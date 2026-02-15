/**
 * ═══════════════════════════════════════════════════════════════════
 * IMPOST. — Análise Tributária TEA v4.2
 * Motor de cálculo + Interface reativa
 * CORREÇÕES APLICADAS:
 *   ✓ Bug crítico parseMoney/máscara monetária corrigido
 *   ✓ Distribuição de dividendos por sócio com participação %
 *   ✓ Pró-labore diferenciado por sócio
 *   ✓ Alerta visual limite R$ 50k dividendos
 *   ✓ Simulador de cenários de distribuição
 *   ✓ Validações avançadas de dados
 *   ✓ Exportação PDF e Excel
 *   ✓ Histórico de cenários (LocalStorage)
 *   ✓ Municípios via API IBGE com merge ISS (municipios.js)
 *   ✓ Dica ISS 2%-5% + input manual + fallback offline
 *   ✓ FIX: Adaptador estados.js API → dicionário compatível
 * Importa dados de: cnae.js, estados.js, impostos_federais.js, cnae-mapeamento.js, municipios.js
 * ═══════════════════════════════════════════════════════════════════
 */
(function () {
    "use strict";

    // ═══ DOM SHORTCUTS ═══
    const $ = id => document.getElementById(id);
    const $$ = sel => document.querySelectorAll(sel);

    // ═══ GLOBALS ═══
    let IF, CM, ES, CNAE;
    let MUN; // Módulo MunicipiosIBGE
    let cnaeSelecionado = null;
    let regrasCNAE = null;
    let margemManual = false;
    let debounceTimer = null;
    let ultimoRanking = null;
    let ultimosDados = null;

    // ═══ SÓCIOS ═══
    let sociosConfig = [
        { nome: 'Sócio 1', participacao: 100, proLabore: 0 }
    ];


    // ═══════════════════════════════════════════════════════════════
    //  ADAPTADOR: estados.js API → Dicionário compatível (v4.2 fix)
    //  estados.js retorna um objeto API {getEstado, listarEstados, ...}
    //  analise.js espera um dicionário {MT: {nome, icms, beneficios, ...}}
    // ═══════════════════════════════════════════════════════════════

    function _resolverEstados(src) {
        if (!src) return {};
        // Se já é dicionário de UFs (tem chaves de 2 letras com propriedade .nome)
        if (src.MT && src.MT.nome) return src;
        // Se é a API do estados.js (tem métodos como getEstado, listarSiglas)
        if (typeof src.getEstado === 'function' && typeof src.listarSiglas === 'function') {
            if (typeof src.carregarTodos === 'function') {
                try { src.carregarTodos(); } catch(e) { console.warn('[analise] carregarTodos:', e); }
            }
            var dict = {};
            var siglas = src.listarSiglas();
            siglas.forEach(function(uf) {
                var dados = src.getEstado(uf);
                if (dados) dict[uf] = _adaptarEstado(uf, dados);
            });
            dict._api = src; // manter referência à API original
            return dict;
        }
        // Fallback: retornar como está
        return src;
    }

    function _adaptarEstado(uf, dados) {
        if (!dados) return null;
        var dg = dados.dados_gerais || {};
        var ic = dados.icms || {};
        var sn = dados.simples_nacional || {};
        var inc = dados.incentivos || {};

        // nome (analise.js usa estado.nome)
        if (!dados.nome) {
            dados.nome = dg.estado || dg.nome || dg.nome_completo || uf;
        }
        // sublimite_simples (analise.js usa estado.sublimite_simples)
        if (dados.sublimite_simples === undefined) {
            dados.sublimite_simples = sn.sublimite_estadual || sn.sublimite || sn.sublimite_icms_iss || 3600000;
        }
        // beneficios (analise.js usa estado.beneficios.tem_sudam, .tem_sudene, .dica_economia)
        if (!dados.beneficios) {
            var temSudam = !!(dg.abrangencia_sudam || (inc.sudam && inc.sudam.ativo));
            var temSudene = !!(dg.abrangencia_sudene || (inc.sudene && inc.sudene.ativo));
            var dica = '';
            if (temSudam) dica = 'Região SUDAM: 75% de redução no IRPJ para setores prioritários.';
            if (temSudene) dica = 'Região SUDENE: 75% de redução no IRPJ para setores prioritários.';
            if (inc.alc || inc.zfm) {
                var alcNome = (inc.alc && inc.alc.nome) || (inc.zfm && inc.zfm.nome) || 'ALC/ZFM';
                dica += (dica ? ' ' : '') + alcNome + ': isenções de IPI, PIS, COFINS.';
            }
            dados.beneficios = { tem_sudam: temSudam, tem_sudene: temSudene, dica_economia: dica };
        }
        // icms normalizado (analise.js usa estado.icms.padrao e estado.icms.cesta_basica)
        if (ic && dados.icms) {
            if (dados.icms.padrao === undefined) {
                dados.icms.padrao = ic.aliquota_padrao || ic.aliquota_modal || ic.aliquota_interna || 0.18;
            }
            if (dados.icms.cesta_basica === undefined) {
                var cb = ic.aliquotas_diferenciadas && ic.aliquotas_diferenciadas.cesta_basica;
                dados.icms.cesta_basica = cb ? (cb.aliquota || 0.07) : (ic.cesta_basica || 0.07);
            }
        }
        // municipios (compatibilidade mínima — MunicipiosIBGE cuida via API)
        if (!dados.municipios) {
            dados.municipios = [];
            if (dg.capital) {
                var issRef = dados.iss || {};
                var issCapital = issRef.aliquota_minima || issRef.aliquota_padrao || 5;
                dados.municipios.push({
                    nome: dg.capital,
                    iss: typeof issCapital === 'number' && issCapital < 1 ? issCapital * 100 : issCapital,
                    issConhecido: true
                });
            }
        }
        return dados;
    }

    // ═══════════════════════════════════════════════════════════════
    //  INICIALIZAÇÃO
    // ═══════════════════════════════════════════════════════════════

    function init() {
        IF = window.ImpostosFederais;
        CM = window.CnaeMapeamento;
        // ─── Resolver estados: API → dicionário (v4.2 fix) ───
        var estadosSrc = window.Estados || window.EstadosBR || (typeof ESTADOS !== 'undefined' ? ESTADOS : window.ESTADOS);
        ES = _resolverEstados(estadosSrc);
        window.ESTADOS = ES;
        MUN = window.MunicipiosIBGE; // Módulo de municípios IBGE

        if (!window.BANCO_CNAE) {
            window.addEventListener('cnae-loaded', init);
            return;
        }
        CNAE = window.BANCO_CNAE;

        console.log(`%c⚡ IMPOST. Análise v4.1`, 'color: #10b981; font-size: 16px; font-weight: bold;');
        console.log(`📊 ${CNAE.length} CNAEs | ${Object.keys(ES).filter(k => k.length === 2).length} Estados | Municípios: IBGE API | Motor: ${CM.getEstatisticas().cnae_especificos} mapeamentos específicos`);

        $('loadingOverlay').style.display = 'none';
        $('formArea').style.display = 'block';

        popularEstados();
        bindEventos();
        renderSociosList();
        atualizarBotaoCalcular();
        console.log('[init] ✅ Inicialização completa. btnCalcular disabled:', $('btnCalcular').disabled);
    }

    document.addEventListener('DOMContentLoaded', init);

    // ═══════════════════════════════════════════════════════════════
    //  POPULAR ESTADOS
    // ═══════════════════════════════════════════════════════════════

    function popularEstados() {
        const sel = $('selectEstado');
        const estados = Object.entries(ES)
            .filter(([sigla, e]) => sigla.length === 2 && e && typeof e === 'object' && e.nome)
            .map(([sigla, e]) => ({ sigla, nome: e.nome }))
            .sort((a, b) => a.nome.localeCompare(b.nome));

        estados.forEach(e => {
            const opt = document.createElement('option');
            opt.value = e.sigla;
            opt.textContent = `${e.nome} (${e.sigla})`;
            sel.appendChild(opt);
        });
    }

    // ═══════════════════════════════════════════════════════════════
    //  EVENT BINDINGS
    // ═══════════════════════════════════════════════════════════════

    function bindEventos() {
        // Estado
        $('selectEstado').addEventListener('change', onEstadoChange);

        // Município
        $('selectMunicipio').addEventListener('change', onMunicipioChange);

        // ISS manual — validar quando o usuário digita
        if ($('inputISS')) {
            $('inputISS').addEventListener('blur', onISSManualChange);
            $('inputISS').addEventListener('change', onISSManualChange);
        }

        // CNAE autocomplete
        $('inputCNAE').addEventListener('input', onCNAEInput);
        $('inputCNAE').addEventListener('focus', () => {
            if ($('inputCNAE').value.length >= 2) onCNAEInput();
        });
        document.addEventListener('click', e => {
            if (!e.target.closest('.cnae-wrapper')) {
                $('cnaeDropdown').style.display = 'none';
            }
        });

        // Money masks — CORRIGIDO v4.0
        $$('[data-type="money"]').forEach(el => {
            el.addEventListener('input', () => aplicarMascaraMoney(el));
            el.addEventListener('blur', () => formatarMoneyOnBlur(el));
        });

        // Real-time indicators
        $('inputFaturamento').addEventListener('input', atualizarIndicadores);
        $('inputFolha').addEventListener('input', atualizarIndicadores);
        $('inputCMV').addEventListener('input', atualizarMargemAuto);
        $('inputDespesas').addEventListener('input', atualizarMargemAuto);

        // Margin slider sync
        $('sliderMargem').addEventListener('input', () => {
            const v = $('sliderMargem').value;
            $('inputMargem').value = v + '%';
            margemManual = false;
            $('margemBadge').classList.add('hidden');
        });
        $('inputMargem').addEventListener('change', () => {
            const v = parseFloat($('inputMargem').value.replace(/[^0-9.,]/g, '').replace(',', '.'));
            if (!isNaN(v) && v >= 0 && v <= 100) {
                $('sliderMargem').value = v;
                $('inputMargem').value = v + '%';
                margemManual = true;
                $('margemBadge').classList.remove('hidden');
            }
        });

        // Socios slider — agora atualiza a lista de sócios
        $('sliderSocios').addEventListener('input', () => {
            const qtd = parseInt($('sliderSocios').value);
            $('sociosValue').textContent = qtd;
            ajustarQuantidadeSocios(qtd);
        });

        // Crescimento slider
        $('sliderCrescimento').addEventListener('input', () => {
            $('crescimentoValue').textContent = $('sliderCrescimento').value + '%';
        });

        // Calculate button
        $('btnCalcular').addEventListener('click', calcular);
        console.log('[bindEventos] Click handler anexado ao btnCalcular');

        // Back button
        $('btnVoltar').addEventListener('click', voltarFormulario);

        // Export buttons
        $('btnPDF').addEventListener('click', exportarPDF);
        $('btnExcel').addEventListener('click', exportarExcel);

        // Tabs
        $$('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                $$('.tab-btn').forEach(b => b.classList.remove('active'));
                $$('.tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                $(btn.dataset.tab).classList.add('active');
            });
        });

        // Keyboard shortcut
        document.addEventListener('keydown', e => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                if (!$('btnCalcular').disabled && $('formArea').style.display !== 'none') {
                    calcular();
                }
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════
    //  MÁSCARA MONETÁRIA — CORRIGIDO v4.0
    //  BUG ORIGINAL: dividia por 100, então "22000" virava "R$ 220,00"
    //  CORREÇÃO: formata o número inteiro que o usuário digita
    // ═══════════════════════════════════════════════════════════════

    function aplicarMascaraMoney(el) {
        // Salva posição do cursor
        const cursorPos = el.selectionStart;
        const valorAnterior = el.value;

        // Remove tudo exceto dígitos e vírgula
        let v = el.value.replace(/[^\d,]/g, '');
        if (!v) { el.value = ''; atualizarBotaoCalcular(); return; }

        // Se tem vírgula, limita a 2 casas decimais
        const partes = v.split(',');
        let inteiro = partes[0].replace(/^0+(?=\d)/, ''); // remove zeros à esquerda
        if (!inteiro) inteiro = '0';
        const decimal = partes.length > 1 ? partes[1].substring(0, 2) : '';

        // Formata milhares
        inteiro = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

        // Monta valor formatado
        if (partes.length > 1) {
            el.value = 'R$ ' + inteiro + ',' + decimal;
        } else {
            el.value = 'R$ ' + inteiro;
        }

        // Ajusta cursor
        const diff = el.value.length - valorAnterior.length;
        const novaPosicao = Math.max(4, cursorPos + diff);
        el.setSelectionRange(novaPosicao, novaPosicao);

        atualizarBotaoCalcular();
    }

    function formatarMoneyOnBlur(el) {
        const valor = parseMoney(el);
        if (valor > 0) {
            el.value = formatBRLInput(valor);
        } else if (el.value.trim() === '' || el.value === 'R$ ' || el.value === 'R$ 0') {
            el.value = '';
        }
    }

    /**
     * parseMoney — CORRIGIDO v4.0
     * Extrai o valor numérico de um input monetário ou string formatada
     * "R$ 22.000,00" → 22000.00
     * "R$ 22000" → 22000
     * "22000" → 22000
     */
    function parseMoney(el) {
        const raw = (typeof el === 'string' ? el : el.value);
        const v = raw
            .replace(/R\$\s?/g, '')   // remove R$
            .replace(/\./g, '')        // remove pontos de milhar
            .replace(',', '.');        // vírgula → ponto decimal
        return parseFloat(v) || 0;
    }

    function formatBRL(n) {
        return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function formatBRLInput(n) {
        const parts = n.toFixed(2).split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return 'R$ ' + parts.join(',');
    }

    function formatPct(n) {
        return (n * 100).toFixed(2).replace('.', ',') + '%';
    }

    // ═══════════════════════════════════════════════════════════════
    //  GESTÃO DE SÓCIOS — NOVO v4.0
    // ═══════════════════════════════════════════════════════════════

    function ajustarQuantidadeSocios(qtd) {
        while (sociosConfig.length < qtd) {
            const idx = sociosConfig.length + 1;
            sociosConfig.push({
                nome: `Sócio ${idx}`,
                participacao: 0,
                proLabore: 0
            });
        }
        while (sociosConfig.length > qtd) {
            sociosConfig.pop();
        }
        // Distribuir participação igualmente se nenhum foi configurado manualmente
        distribuirParticipacaoIgual();
        renderSociosList();
    }

    function distribuirParticipacaoIgual() {
        const total = sociosConfig.reduce((s, sc) => s + sc.participacao, 0);
        if (total === 0 || Math.abs(total - 100) < 0.1) {
            const pct = Math.round(100 / sociosConfig.length * 100) / 100;
            sociosConfig.forEach((sc, i) => {
                if (i === sociosConfig.length - 1) {
                    sc.participacao = Math.round((100 - pct * (sociosConfig.length - 1)) * 100) / 100;
                } else {
                    sc.participacao = pct;
                }
            });
        }
    }

    function renderSociosList() {
        const container = $('sociosList');
        if (!container) return;

        const totalParticipacao = sociosConfig.reduce((s, sc) => s + sc.participacao, 0);
        const proLaboreTotal = parseMoney($('inputProLabore'));

        let html = '';
        sociosConfig.forEach((sc, i) => {
            const plDefault = proLaboreTotal > 0 ? (proLaboreTotal / sociosConfig.length) : 0;
            if (sc.proLabore === 0 && proLaboreTotal > 0) {
                sc.proLabore = plDefault;
            }

            html += `
            <div class="socio-row">
                <div class="socio-field socio-nome">
                    <input type="text" value="${sc.nome}" placeholder="Nome"
                           onchange="window._IMPOST.atualizarSocio(${i}, 'nome', this.value)">
                </div>
                <div class="socio-field socio-pct">
                    <div class="socio-input-group">
                        <input type="number" value="${sc.participacao}" min="0" max="100" step="0.01"
                               onchange="window._IMPOST.atualizarSocio(${i}, 'participacao', parseFloat(this.value) || 0)">
                        <span class="socio-suffix">%</span>
                    </div>
                </div>
                <div class="socio-field socio-pl">
                    <input type="text" value="${sc.proLabore > 0 ? formatBRLInput(sc.proLabore) : ''}" 
                           placeholder="R$ 0,00" class="money"
                           onchange="window._IMPOST.atualizarSocio(${i}, 'proLabore', window._IMPOST.parseMoney(this.value))">
                </div>
            </div>`;
        });

        // Validação total
        const valid = Math.abs(totalParticipacao - 100) < 0.5;
        html += `
        <div class="socios-total ${valid ? 'valid' : 'invalid'}">
            <span>Total participação:</span>
            <span>${totalParticipacao.toFixed(1)}%</span>
            <span class="socios-status">${valid ? '✓' : '⚠ Deve somar 100%'}</span>
        </div>`;

        // Preset buttons
        if (sociosConfig.length >= 2) {
            html += `<div class="socios-presets">`;
            html += `<button onclick="window._IMPOST.presetParticipacao('igual')">Dividir igual</button>`;
            if (sociosConfig.length === 2) {
                html += `<button onclick="window._IMPOST.presetParticipacao('6040')">60/40</button>`;
                html += `<button onclick="window._IMPOST.presetParticipacao('7030')">70/30</button>`;
            }
            if (sociosConfig.length === 3) {
                html += `<button onclick="window._IMPOST.presetParticipacao('503020')">50/30/20</button>`;
            }
            html += `</div>`;
        }

        container.innerHTML = html;

        // Mostrar/ocultar seção
        const section = $('sociosSection');
        if (section) section.style.display = 'block';
    }

    function atualizarSocio(idx, campo, valor) {
        if (idx >= 0 && idx < sociosConfig.length) {
            sociosConfig[idx][campo] = valor;
            if (campo === 'participacao') {
                renderSociosList();
            }
        }
    }

    function presetParticipacao(tipo) {
        const n = sociosConfig.length;
        if (tipo === 'igual') {
            distribuirParticipacaoIgual();
        } else if (tipo === '6040' && n === 2) {
            sociosConfig[0].participacao = 60;
            sociosConfig[1].participacao = 40;
        } else if (tipo === '7030' && n === 2) {
            sociosConfig[0].participacao = 70;
            sociosConfig[1].participacao = 30;
        } else if (tipo === '503020' && n === 3) {
            sociosConfig[0].participacao = 50;
            sociosConfig[1].participacao = 30;
            sociosConfig[2].participacao = 20;
        }
        renderSociosList();
    }

    // Expor funções necessárias para callbacks inline
    window._IMPOST = {
        atualizarSocio,
        presetParticipacao,
        parseMoney: (v) => parseMoney(v)
    };

    // ═══════════════════════════════════════════════════════════════
    //  ESTADO → MUNICÍPIOS (IBGE API + ISS MERGE)
    // ═══════════════════════════════════════════════════════════════

    async function onEstadoChange() {
        const uf = $('selectEstado').value;
        const selMun = $('selectMunicipio');
        const issHint = $('issHint');
        const munLoading = $('munLoading');

        // Limpar hint ISS
        if (issHint) issHint.innerHTML = '';

        if (!uf || !ES[uf]) {
            selMun.innerHTML = '<option value="">Selecione o estado primeiro...</option>';
            selMun.disabled = true;
            $('dicaBanner').style.display = 'none';
            $('checkSudam').checked = false;
            $('checkSudam').disabled = true;
            return;
        }

        const estado = ES[uf];

        // ─── Mostrar loading enquanto busca municípios ───
        selMun.disabled = true;
        selMun.innerHTML = '<option value="">Carregando municípios...</option>';
        if (munLoading) munLoading.style.display = 'inline-block';

        // Mostrar dica ISS genérica enquanto carrega
        if (issHint) {
            issHint.innerHTML = `<span style="color:var(--warning,#f59e0b);">ℹ</span> 
                A alíquota de ISS geralmente varia entre <strong>2% e 5%</strong> conforme a legislação municipal 
                (LC 116/2003). Se não informada, será usado <strong>5%</strong> (teto legal).`;
        }

        try {
            // ─── Buscar municípios via IBGE API (com cache) ───
            let municipios;
            if (MUN) {
                municipios = await MUN.buscarMunicipios(uf, ES);
            } else {
                // Fallback se municipios.js não carregou
                municipios = _fallbackMunicipiosLocal(uf);
            }

            // ─── Renderizar select ───
            if (MUN) {
                MUN.renderizarSelect(selMun, municipios, {
                    mostrarISS: true,
                    marcarConhecidos: true
                });
            } else {
                _renderizarSelectLocal(selMun, municipios);
            }

        } catch (err) {
            console.warn('Erro ao carregar municípios IBGE, usando fallback:', err);

            // Fallback para os dados estáticos de estados.js
            const municipios = _fallbackMunicipiosLocal(uf);
            _renderizarSelectLocal(selMun, municipios);

            if (issHint) {
                issHint.innerHTML = `<span style="color:var(--warning,#f59e0b);">⚠</span> 
                    Não foi possível carregar todos os municípios (sem conexão?). 
                    Mostrando apenas os principais. A alíquota ISS varia entre <strong>2% e 5%</strong> — 
                    ajuste manualmente se necessário.`;
            }
        } finally {
            if (munLoading) munLoading.style.display = 'none';
        }

        // ─── SUDAM auto ───
        const temIncentivo = estado.beneficios && (estado.beneficios.tem_sudam || estado.beneficios.tem_sudene);
        $('checkSudam').checked = temIncentivo;
        $('checkSudam').disabled = !temIncentivo;

        // ─── Dica econômica ───
        if (estado.beneficios && estado.beneficios.dica_economia) {
            $('dicaTitulo').textContent = `Dica para empresas no ${estado.nome}:`;
            $('dicaTexto').textContent = estado.beneficios.dica_economia;
            $('dicaBanner').style.display = 'block';
        } else {
            $('dicaBanner').style.display = 'none';
        }

        // ─── Update RBT12 sublimite marker ───
        const subPct = (estado.sublimite_simples / 4800000) * 100;
        $('barRBT12MarkerSub').style.left = subPct + '%';

        atualizarIndicadores();
    }

    // ─── Fallback local (usa apenas estados.js) ───
    function _fallbackMunicipiosLocal(uf) {
        const estado = ES[uf];
        if (!estado || !estado.municipios) return [];
        return [...estado.municipios]
            .sort((a, b) => a.nome.localeCompare(b.nome))
            .map(m => ({
                nome: m.nome,
                iss: m.iss || 5,
                issConhecido: true
            }));
    }

    function _renderizarSelectLocal(selMun, municipios) {
        selMun.innerHTML = '';
        const optDefault = document.createElement('option');
        optDefault.value = '';
        optDefault.textContent = `Selecione o município (${municipios.length} disponíveis)...`;
        selMun.appendChild(optDefault);

        municipios.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.nome;
            opt.dataset.iss = m.iss;
            opt.dataset.issConhecido = m.issConhecido ? '1' : '0';
            opt.textContent = `${m.nome} (ISS: ${m.iss.toFixed(1).replace('.', ',')}%${m.issConhecido ? '' : ' ≈'})`;
            selMun.appendChild(opt);
        });

        selMun.disabled = false;
    }

    // ─── Município selecionado → atualizar ISS + dica ───
    function onMunicipioChange() {
        const sel = $('selectMunicipio');
        const opt = sel.options[sel.selectedIndex];
        const issHint = $('issHint');
        const inputISS = $('inputISS');

        if (opt && opt.dataset.iss) {
            const iss = parseFloat(opt.dataset.iss);
            const issConhecido = opt.dataset.issConhecido === '1';
            const nomeMun = opt.value;

            // Preencher o campo ISS
            inputISS.value = iss.toFixed(2).replace('.', ',');

            // Mostrar dica contextualizada
            if (issHint) {
                if (MUN) {
                    issHint.innerHTML = MUN.gerarDicaISS(issConhecido, nomeMun);
                } else if (issConhecido) {
                    issHint.innerHTML = `<span style="color:var(--success,#10b981);">✓</span> 
                        Alíquota ISS de <strong>${nomeMun}</strong> cadastrada. Ajuste se necessário.`;
                } else {
                    issHint.innerHTML = `<span style="color:var(--warning,#f59e0b);">ℹ</span> 
                        ISS de <strong>${nomeMun}</strong> não cadastrado. Usando <strong>5%</strong> (teto legal). 
                        A alíquota varia entre 2% e 5% — consulte sua prefeitura e ajuste abaixo.`;
                }
            }
        } else {
            // Nenhum município selecionado — hint genérico
            if (issHint) {
                issHint.innerHTML = `<span style="color:var(--warning,#f59e0b);">ℹ</span> 
                    A alíquota de ISS geralmente varia entre <strong>2% e 5%</strong> conforme o município. 
                    Se não informada, será usado <strong>5%</strong> (teto legal).`;
            }
        }

        // Validar ISS se módulo disponível
        if (MUN && inputISS.value) {
            const issVal = parseFloat(inputISS.value.replace(',', '.'));
            const validacao = MUN.validarISS(issVal);
            if (!validacao.valido && issHint) {
                issHint.innerHTML += `<br><span style="color:var(--danger,#ef4444);">⚠ ${validacao.msg}</span>`;
            }
        }
    }

    // ─── ISS alterado manualmente pelo usuário ───
    function onISSManualChange() {
        const issHint = $('issHint');
        const inputISS = $('inputISS');
        if (!inputISS || !inputISS.value) return;

        const issVal = parseFloat(inputISS.value.replace(',', '.'));

        if (isNaN(issVal)) return;

        if (issHint) {
            if (issVal < 2) {
                issHint.innerHTML = `<span style="color:var(--danger,#ef4444);">⚠</span> 
                    Alíquota de <strong>${issVal.toFixed(2).replace('.', ',')}%</strong> está abaixo do mínimo legal de 2% (LC 116/2003, art. 8-A). 
                    Verifique a legislação do seu município.`;
            } else if (issVal > 5) {
                issHint.innerHTML = `<span style="color:var(--danger,#ef4444);">⚠</span> 
                    Alíquota de <strong>${issVal.toFixed(2).replace('.', ',')}%</strong> excede o máximo legal de 5% (LC 116/2003, art. 8, II). 
                    Verifique a legislação do seu município.`;
            } else {
                const selMun = $('selectMunicipio');
                const nomeMun = selMun ? selMun.value : '';
                issHint.innerHTML = `<span style="color:var(--success,#10b981);">✓</span> 
                    Alíquota ISS definida em <strong>${issVal.toFixed(2).replace('.', ',')}%</strong>${nomeMun ? ' para ' + nomeMun : ''}. 
                    <span style="opacity:0.7;">Faixa legal: 2% a 5%.</span>`;
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    //  CNAE AUTOCOMPLETE
    // ═══════════════════════════════════════════════════════════════

    function normStr(s) {
        return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }

    function onCNAEInput() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const q = $('inputCNAE').value.trim();
            if (q.length < 2) {
                $('cnaeDropdown').style.display = 'none';
                return;
            }
            const qn = normStr(q);
            const results = [];
            for (let i = 0; i < CNAE.length && results.length < 8; i++) {
                const c = CNAE[i];
                if (c.codigo.includes(q) || c.codigoNumerico.includes(q) || normStr(c.descricao).includes(qn)) {
                    results.push(c);
                }
            }
            renderDropdown(results);
        }, 200);
    }

    function renderDropdown(items) {
        const dd = $('cnaeDropdown');
        if (!items.length) {
            dd.style.display = 'none';
            return;
        }
        dd.innerHTML = items.map((c, i) => {
            const catClass = c.categoria === 'Comércio' ? 'comercio' : c.categoria === 'Indústria' ? 'industria' : 'servico';
            return `<div class="cnae-item" data-idx="${i}" data-codigo="${c.codigo}" data-categoria="${c.categoria}" data-desc="${c.descricao}">
                <span class="cnae-text"><span class="code">${c.codigo}</span> — ${c.descricao}</span>
                <span class="cnae-badge ${catClass}">${c.categoria}</span>
            </div>`;
        }).join('');
        dd.style.display = 'block';

        dd.querySelectorAll('.cnae-item').forEach(el => {
            el.addEventListener('click', () => selecionarCNAE(el));
        });
    }

    function selecionarCNAE(el) {
        const codigo = el.dataset.codigo;
        const categoria = el.dataset.categoria;
        const desc = el.dataset.desc;

        cnaeSelecionado = { codigo, categoria, descricao: desc };
        $('inputCNAE').value = `${codigo} — ${desc}`;
        $('cnaeDropdown').style.display = 'none';

        // Set tipo atividade
        $('selectTipoAtividade').value = categoria;

        // Get rules from CnaeMapeamento
        regrasCNAE = CM.obterRegrasCNAE(codigo, categoria);
        renderCnaeInfo(regrasCNAE, codigo, desc, categoria);
        atualizarIndicadores();
        atualizarBotaoCalcular();
    }

    function renderCnaeInfo(regras, codigo, desc, categoria) {
        const info = $('cnaeInfo');
        let anexoLabel = regras.anexo;
        if (regras.fatorR) anexoLabel += ' (sujeito ao Fator R)';

        let badgeHtml = '';
        if (regras.vedado) {
            badgeHtml = `<span class="badge-vedado">VEDADO ao Simples Nacional: ${regras.motivoVedacao}</span>`;
        } else if (regras.fonte === 'categoria' || regras.fonte === 'padrao') {
            badgeHtml = `<span class="badge-warn">Regra estimada — consulte um contador</span>`;
        } else {
            badgeHtml = `<span class="badge-ok">Mapeamento ${regras.fonte} ✓</span>`;
        }

        const mono = CM.isMonofasico(codigo);
        let monoHtml = '';
        if (mono) {
            monoHtml = `<div class="cnae-info-row"><span>Monofásico</span><span style="color:var(--cyan);">${mono}</span></div>`;
        }

        info.innerHTML = `
            <div class="cnae-info-title">${codigo} — ${desc}</div>
            <div class="cnae-info-row"><span>Categoria</span><span>${categoria}</span></div>
            <div class="cnae-info-row"><span>Anexo Simples</span><span>${anexoLabel}</span></div>
            <div class="cnae-info-row"><span>Presunção IRPJ</span><span>${(regras.presuncaoIRPJ * 100).toFixed(1)}%</span></div>
            <div class="cnae-info-row"><span>Presunção CSLL</span><span>${(regras.presuncaoCSLL * 100).toFixed(1)}%</span></div>
            ${monoHtml}
            ${regras.obs ? `<div style="margin-top:6px;font-size:0.8rem;color:var(--text-muted);">${regras.obs}</div>` : ''}
            ${badgeHtml}
        `;
        info.style.display = 'block';
    }

    // ═══════════════════════════════════════════════════════════════
    //  INDICADORES EM TEMPO REAL
    // ═══════════════════════════════════════════════════════════════

    function atualizarIndicadores() {
        const fat = parseMoney($('inputFaturamento'));
        const folha = parseMoney($('inputFolha'));

        // Fator R bar
        if (regrasCNAE?.fatorR && fat > 0) {
            $('barFatorR').style.display = 'block';
            const fr = folha / fat;
            const frPct = Math.min(fr * 100, 100);
            $('barFatorRFill').style.width = frPct + '%';
            const isGood = fr >= 0.28;
            $('barFatorRFill').style.background = isGood ? 'var(--accent)' : 'var(--red)';
            $('barFatorRValue').textContent = frPct.toFixed(1).replace('.', ',') + '%';
            $('barFatorRValue').style.color = isGood ? 'var(--accent)' : 'var(--red)';
            $('barFatorRMsg').textContent = isGood
                ? 'Folha >= 28% → Anexo III (economia!)'
                : 'Folha < 28% → Anexo V (mais caro)';
        } else {
            $('barFatorR').style.display = 'none';
        }

        // RBT12 bar
        if (fat > 0) {
            $('barRBT12').style.display = 'block';
            const rbt12 = fat * 12;
            const pct = Math.min((rbt12 / 4800000) * 100, 100);
            $('barRBT12Fill').style.width = pct + '%';

            const uf = $('selectEstado').value;
            const sublimite = uf && ES[uf] ? ES[uf].sublimite_simples : 3600000;

            let color = 'var(--accent)';
            if (rbt12 > 4800000) color = 'var(--red)';
            else if (rbt12 > sublimite) color = 'var(--amber)';
            $('barRBT12Fill').style.background = color;
            $('barRBT12Value').textContent = formatBRL(rbt12);
            $('barRBT12Value').style.color = color;
        } else {
            $('barRBT12').style.display = 'none';
        }
    }

    function atualizarMargemAuto() {
        if (margemManual) return;
        const fat = parseMoney($('inputFaturamento'));
        const cmv = parseMoney($('inputCMV'));
        const folha = parseMoney($('inputFolha'));
        const desp = parseMoney($('inputDespesas'));

        if (fat > 0 && (cmv > 0 || desp > 0)) {
            const margem = Math.max(0, Math.min(80, ((fat - cmv - folha - desp) / fat) * 100));
            $('sliderMargem').value = Math.round(margem);
            $('inputMargem').value = Math.round(margem) + '%';
        }
    }

    function atualizarBotaoCalcular() {
        const fat = parseMoney($('inputFaturamento'));
        $('btnCalcular').disabled = !(fat > 0 && cnaeSelecionado);
    }

    // ═══════════════════════════════════════════════════════════════
    //  VALIDAÇÕES AVANÇADAS — NOVO v4.0
    // ═══════════════════════════════════════════════════════════════

    function validarDados(dados) {
        const alertas = [];

        if (dados.proLaboreTotal > dados.faturamento) {
            alertas.push({ tipo: 'error', msg: 'Pró-labore total é maior que o faturamento. Verifique os valores.' });
        }

        if (dados.cmv + dados.despesas + dados.folha > dados.faturamento) {
            alertas.push({ tipo: 'warn', msg: 'Custos + Despesas + Folha excedem o faturamento — empresa opera no prejuízo.' });
        }

        if (dados.faturamento > 0 && dados.proLaboreTotal === 0) {
            alertas.push({ tipo: 'warn', msg: 'Sócio sem pró-labore pode ser questionado pela Receita Federal. Recomenda-se ao menos 1 salário mínimo.' });
        }

        const totalParticipacao = dados.sociosConfig.reduce((s, sc) => s + sc.participacao, 0);
        if (Math.abs(totalParticipacao - 100) > 0.5) {
            alertas.push({ tipo: 'error', msg: `Participação dos sócios soma ${totalParticipacao.toFixed(1)}% (deveria ser 100%).` });
        }

        if (dados.folha > 0 && dados.folha < dados.proLaboreTotal) {
            alertas.push({ tipo: 'warn', msg: 'Folha de pagamento é menor que o pró-labore total. A folha deve incluir o pró-labore.' });
        }

        return alertas;
    }

    // ═══════════════════════════════════════════════════════════════
    //  COLETAR INPUTS
    // ═══════════════════════════════════════════════════════════════

    function coletarInputs() {
        const fat = parseMoney($('inputFaturamento'));
        const issStr = $('inputISS').value.replace(',', '.');

        // Calcular pró-labore total a partir dos sócios
        const proLaboreTotal = sociosConfig.reduce((s, sc) => s + (sc.proLabore || 0), 0);

        // Se o input global de pró-labore foi preenchido mas os sócios individuais não,
        // usar o valor global dividido igualmente
        const proLaboreInput = parseMoney($('inputProLabore'));
        if (proLaboreInput > 0 && proLaboreTotal === 0) {
            const plPorSocio = proLaboreInput / sociosConfig.length;
            sociosConfig.forEach(sc => sc.proLabore = plPorSocio);
        }

        const proLaboreFinal = proLaboreInput > 0 && proLaboreTotal === 0 ? proLaboreInput : proLaboreTotal;

        return {
            uf: $('selectEstado').value,
            municipio: $('selectMunicipio').value,
            cnaeCodigo: cnaeSelecionado?.codigo || '',
            cnaeCategoria: cnaeSelecionado?.categoria || $('selectTipoAtividade').value,
            cnaeDescricao: cnaeSelecionado?.descricao || '',
            faturamento: fat,
            folha: parseMoney($('inputFolha')),
            proLabore: proLaboreFinal, // mantém compatibilidade
            proLaboreTotal: proLaboreFinal,
            cmv: parseMoney($('inputCMV')),
            despesas: parseMoney($('inputDespesas')),
            margem: parseFloat($('sliderMargem').value) / 100,
            funcionarios: parseInt($('inputFuncionarios').value) || 0,
            socios: sociosConfig.length,
            sociosConfig: [...sociosConfig],
            crescimento: parseInt($('sliderCrescimento').value) / 100,
            destinoLucro: $('selectDestinoLucro').value,
            tipoCliente: $('selectCliente').value,
            issAliquota: (parseFloat(issStr) || 5) / 100,
            st: $('checkST').checked,
            cestaBas: $('checkCesta').checked,
            sudam: $('checkSudam').checked,
            interestadual: $('checkInterestadual').checked,
        };
    }

    // ═══════════════════════════════════════════════════════════════
    //  CÁLCULO 1: SIMPLES NACIONAL
    // ═══════════════════════════════════════════════════════════════

    function calcularSimples(dados, regras, estado) {
        if (regras.vedado) return null;

        const RBT12 = dados.faturamento * 12;
        if (RBT12 > IF.PARAMETROS_GERAIS.teto_simples_nacional) return null;

        const fatorR = dados.faturamento > 0 ? dados.folha / dados.faturamento : 0;
        const anexoEfetivo = CM.obterAnexoEfetivo(dados.cnaeCodigo, dados.cnaeCategoria, fatorR);
        if (anexoEfetivo === 'VEDADO') return null;

        const tabelaAnexo = IF.SIMPLES_NACIONAL['ANEXO_' + anexoEfetivo];
        if (!tabelaAnexo) return null;

        const faixa = tabelaAnexo.faixas.find(f => RBT12 <= f.limite) || tabelaAnexo.faixas[tabelaAnexo.faixas.length - 1];
        const aliqEfetiva = Math.max(0, (RBT12 * faixa.aliquota - faixa.deducao) / RBT12);
        const DASBruto = dados.faturamento * aliqEfetiva;

        const faixaIdx = faixa.faixa - 1;
        const rep = tabelaAnexo.reparticao[faixaIdx];

        const impostos = {
            irpj:   DASBruto * (rep.irpj || 0),
            csll:   DASBruto * (rep.csll || 0),
            cofins: DASBruto * (rep.cofins || 0),
            pis:    DASBruto * (rep.pis || 0),
            cpp:    DASBruto * (rep.cpp || 0),
            icms:   DASBruto * (rep.icms || 0),
            iss:    DASBruto * (rep.iss || 0),
            ipi:    DASBruto * (rep.ipi || 0),
        };

        // Monofásico
        const mono = CM.isMonofasico(dados.cnaeCodigo);
        if (mono) {
            impostos.pis = 0;
            impostos.cofins = 0;
        }

        // Substituição Tributária
        if (dados.st) {
            impostos.icms = 0;
        }

        // Anexo IV: CPP fora do DAS
        let cppFora = 0;
        if (anexoEfetivo === 'IV') {
            cppFora = dados.folha * IF.INSS.patronal.total_estimado.medio;
            impostos.cpp = 0;
        }

        // Sublimite estadual
        let icmsForaDAS = 0, issForaDAS = 0;
        const sublimite = estado?.sublimite_simples || IF.PARAMETROS_GERAIS.sublimite_icms_iss;
        if (RBT12 > sublimite) {
            if (dados.cnaeCategoria !== 'Serviço') {
                const aliqICMS = dados.cestaBas ? (estado?.icms?.cesta_basica || 0.07) : (estado?.icms?.padrao || 0.18);
                icmsForaDAS = dados.faturamento * aliqICMS;
            }
            issForaDAS = dados.cnaeCategoria === 'Serviço' ? dados.faturamento * dados.issAliquota : 0;
            impostos.icms = 0;
            impostos.iss = 0;
        }

        const totalDAS = Object.values(impostos).reduce((a, b) => a + b, 0);
        const totalImpostos = totalDAS + cppFora + icmsForaDAS + issForaDAS;

        return {
            regime: 'Simples Nacional',
            elegivel: true,
            anexo: anexoEfetivo,
            fatorR,
            faixa: faixa.faixa,
            aliqEfetiva,
            DAS: totalDAS,
            impostos,
            cppFora,
            icmsForaDAS,
            issForaDAS,
            totalImpostos,
            mono: mono || false,
            alertas: gerarAlertasSimples(dados, regras, RBT12, estado, fatorR, anexoEfetivo),
        };
    }

    function gerarAlertasSimples(dados, regras, RBT12, estado, fatorR, anexo) {
        const alertas = [];
        const sublimite = estado?.sublimite_simples || 3600000;
        if (RBT12 > sublimite && RBT12 <= 4800000) {
            alertas.push({ tipo: 'warn', msg: `RBT12 acima do sublimite estadual (${formatBRL(sublimite)}). ICMS/ISS pagos fora do DAS.` });
        }
        if (regras.fatorR && fatorR < 0.28) {
            alertas.push({ tipo: 'warn', msg: `Fator R (${formatPct(fatorR)}) abaixo de 28% — tributação pelo Anexo V (mais caro). Aumentar folha pode reduzir impostos.` });
        }
        if (anexo === 'IV') {
            alertas.push({ tipo: 'info', msg: 'Anexo IV: CPP (INSS patronal ~28,8%) pago fora do DAS.' });
        }
        if (dados.st) {
            alertas.push({ tipo: 'info', msg: 'Substituição Tributária: ICMS zerado no DAS (já recolhido na cadeia anterior).' });
        }
        const mono = CM.isMonofasico(dados.cnaeCodigo);
        if (mono) {
            alertas.push({ tipo: 'info', msg: `Produto monofásico (${mono}): PIS/COFINS excluídos do DAS.` });
        }
        return alertas;
    }

    // ═══════════════════════════════════════════════════════════════
    //  CÁLCULO 2: LUCRO PRESUMIDO
    // ═══════════════════════════════════════════════════════════════

    function calcularPresumido(dados, regras, estado) {
        const LP = IF.LUCRO_PRESUMIDO;

        const presIRPJ = regras.presuncaoIRPJ;
        const presCSLL = regras.presuncaoCSLL;

        const baseIRPJ = dados.faturamento * presIRPJ;
        const baseCSLL = dados.faturamento * presCSLL;

        const irpj = baseIRPJ * LP.irpj.aliquota;
        const adicionalIRPJ = Math.max(0, baseIRPJ - LP.irpj.adicional_limite_mensal) * LP.irpj.adicional_aliquota;
        const csll = baseCSLL * LP.csll.aliquota;
        const pis = dados.faturamento * LP.pis;
        const cofins = dados.faturamento * LP.cofins;

        const cpp = dados.folha * IF.INSS.patronal.total_estimado.medio;

        const aliqICMS = dados.cestaBas ? (estado?.icms?.cesta_basica || 0.07) : (estado?.icms?.padrao || 0.18);
        const icms = dados.cnaeCategoria !== 'Serviço'
            ? Math.max(0, dados.faturamento * aliqICMS - dados.cmv * aliqICMS)
            : 0;
        const iss = dados.cnaeCategoria === 'Serviço' ? dados.faturamento * dados.issAliquota : 0;

        let descontoSudam = 0;
        if (dados.sudam) {
            descontoSudam = (irpj + adicionalIRPJ) * 0.75;
        }

        const irpjFinal = irpj + adicionalIRPJ - descontoSudam;
        const totalImpostos = irpjFinal + csll + pis + cofins + cpp + icms + iss;

        return {
            regime: 'Lucro Presumido',
            elegivel: true,
            impostos: {
                irpj: irpjFinal,
                irpjBruto: irpj + adicionalIRPJ,
                adicionalIRPJ,
                descontoSudam,
                csll,
                pis,
                cofins,
                cpp,
                icms,
                iss,
            },
            presuncaoIRPJ: presIRPJ,
            presuncaoCSLL: presCSLL,
            totalImpostos,
            alertas: gerarAlertasPresumido(dados, regras),
        };
    }

    function gerarAlertasPresumido(dados, regras) {
        const alertas = [];
        if (dados.sudam) {
            alertas.push({ tipo: 'info', msg: 'SUDAM/SUDENE: 75% de desconto no IRPJ aplicado.' });
        }
        if (regras.presuncaoIRPJ === 0.016) {
            alertas.push({ tipo: 'info', msg: 'Presunção especial 1,6% para revenda de combustíveis.' });
        }
        if (regras.presuncaoIRPJ === 0.16) {
            alertas.push({ tipo: 'info', msg: 'Presunção 16% para transporte de passageiros.' });
        }
        if (regras.presuncaoIRPJ === 0.08 && regras.presuncaoCSLL === 0.12 && dados.cnaeCategoria === 'Serviço') {
            alertas.push({ tipo: 'info', msg: 'Presunção hospitalar/equiparada: IRPJ 8%, CSLL 12%.' });
        }
        return alertas;
    }

    // ═══════════════════════════════════════════════════════════════
    //  CÁLCULO 3: LUCRO REAL
    // ═══════════════════════════════════════════════════════════════

    function calcularReal(dados, regras, estado) {
        const LR = IF.LUCRO_REAL;
        const RBT12 = dados.faturamento * 12;

        const lucro = dados.faturamento * dados.margem;

        const irpj = lucro * LR.irpj.aliquota;
        const adicionalIRPJ = Math.max(0, lucro - LR.irpj.adicional_limite_mensal) * LR.irpj.adicional_aliquota;
        const csll = lucro * LR.csll.aliquota_geral;

        const baseCredito = dados.cmv + (dados.despesas * 0.60);
        const pisBruto = dados.faturamento * LR.pis;
        const cofinsBruto = dados.faturamento * LR.cofins;
        const pisCredito = baseCredito * LR.pis;
        const cofinsCredito = baseCredito * LR.cofins;
        const pis = Math.max(0, pisBruto - pisCredito);
        const cofins = Math.max(0, cofinsBruto - cofinsCredito);

        const cpp = dados.folha * IF.INSS.patronal.total_estimado.medio;

        const aliqICMS = dados.cestaBas ? (estado?.icms?.cesta_basica || 0.07) : (estado?.icms?.padrao || 0.18);
        const icms = dados.cnaeCategoria !== 'Serviço'
            ? Math.max(0, dados.faturamento * aliqICMS - dados.cmv * aliqICMS)
            : 0;
        const iss = dados.cnaeCategoria === 'Serviço' ? dados.faturamento * dados.issAliquota : 0;

        let descontoSudam = 0;
        if (dados.sudam) {
            descontoSudam = (irpj + adicionalIRPJ) * 0.75;
        }

        const irpjFinal = irpj + adicionalIRPJ - descontoSudam;
        const totalImpostos = irpjFinal + csll + pis + cofins + cpp + icms + iss;
        const obrigatorio = RBT12 > 78000000;

        return {
            regime: 'Lucro Real',
            elegivel: true,
            obrigatorio,
            impostos: {
                irpj: irpjFinal,
                irpjBruto: irpj + adicionalIRPJ,
                adicionalIRPJ,
                descontoSudam,
                csll,
                pis,
                cofins,
                cpp,
                icms,
                iss,
            },
            creditoPISCOFINS: pisCredito + cofinsCredito,
            totalImpostos,
            alertas: gerarAlertasReal(dados, RBT12),
        };
    }

    function gerarAlertasReal(dados, RBT12) {
        const alertas = [];
        if (RBT12 > 78000000) {
            alertas.push({ tipo: 'danger', msg: 'Lucro Real OBRIGATÓRIO: faturamento anual > R$ 78 milhões.' });
        }
        if (dados.margem < 0) {
            alertas.push({ tipo: 'warn', msg: 'Empresa operando no prejuízo. Lucro Real permite compensar prejuízos fiscais.' });
        }
        if (dados.sudam) {
            alertas.push({ tipo: 'info', msg: 'SUDAM/SUDENE: 75% de desconto no IRPJ aplicado.' });
        }
        alertas.push({ tipo: 'info', msg: `Créditos PIS/COFINS estimados: ${formatBRL((dados.cmv + dados.despesas * 0.6) * (IF.LUCRO_REAL.pis + IF.LUCRO_REAL.cofins))}.` });
        return alertas;
    }

    // ═══════════════════════════════════════════════════════════════
    //  CÁLCULO 4: IMPACTO PESSOAL — REESCRITO v4.0
    //  Agora calcula por sócio individual com participação diferenciada
    // ═══════════════════════════════════════════════════════════════

    function calcularImpactoPessoal(dados, regimes) {
        return regimes.map(regime => {
            if (!regime) return null;

            // Calcular detalhes por sócio
            const detalhesSocios = dados.sociosConfig.map(socio => {
                const proLaboreBruto = socio.proLabore || 0;

                // INSS do pró-labore (contribuinte individual: 11% sobre SC limitado ao teto)
                const scINSS = Math.min(proLaboreBruto, IF.INSS.teto);
                const inss = scINSS * IF.INSS.contribuinte_individual.aliquota_simplificada;

                // IRPF sobre pró-labore
                const baseIRPF = Math.max(0, proLaboreBruto - inss);
                let irpfTabela = 0;
                const faixa = IF.IRPF.tabela_mensal.find(f => baseIRPF <= f.ate);
                if (faixa) {
                    irpfTabela = Math.max(0, baseIRPF * faixa.aliquota - faixa.deducao);
                }

                // Redutor Lei 15.270/2025
                let redutor = 0;
                const red = IF.IRPF.redutor_mensal;
                if (proLaboreBruto <= red.faixa_isencao_limite) {
                    redutor = Math.min(red.redutor_maximo, irpfTabela);
                } else if (proLaboreBruto <= red.faixa_transicao_fim) {
                    redutor = red.formula_base - red.formula_coeficiente * proLaboreBruto;
                    redutor = Math.max(0, Math.min(redutor, irpfTabela));
                }
                const irpf = Math.max(0, irpfTabela - redutor);
                const proLaboreLiq = proLaboreBruto - inss - irpf;

                // Dividendos — proporcional à participação
                const lucroDisponivel = dados.faturamento - regime.totalImpostos - dados.folha - dados.cmv - dados.despesas;
                let fatorRetirada = 1;
                if (dados.destinoLucro === 'parcial') fatorRetirada = 0.5;
                else if (dados.destinoLucro === 'reinveste') fatorRetirada = 0;

                const participacaoDecimal = socio.participacao / 100;
                const dividendosBruto = Math.max(0, lucroDisponivel * fatorRetirada * participacaoDecimal);

                let irDividendos = 0;
                const limiteIsento = IF.IRPF.dividendos.limite_mensal_isento;
                if (dividendosBruto > limiteIsento) {
                    irDividendos = (dividendosBruto - limiteIsento) * IF.IRPF.dividendos.aliquota_retencao;
                }
                const dividendosLiq = dividendosBruto - irDividendos;

                // IRPFM por sócio
                const rendaAnual = (proLaboreBruto + dividendosBruto) * 12;
                let irpfm = 0;
                if (rendaAnual > IF.IRPF.irpfm.limite_anual) {
                    let aliq;
                    if (rendaAnual >= IF.IRPF.irpfm.renda_aliquota_maxima) {
                        aliq = IF.IRPF.irpfm.aliquota_maxima;
                    } else {
                        aliq = IF.IRPF.irpfm.aliquota_maxima * (rendaAnual - IF.IRPF.irpfm.limite_anual) / IF.IRPF.irpfm.limite_anual;
                    }
                    const impostoMinimo = rendaAnual * aliq;
                    const jaRetido = (irpf + irDividendos) * 12;
                    irpfm = Math.max(0, impostoMinimo - jaRetido) / 12;
                }

                const totalBolso = proLaboreLiq + dividendosLiq - irpfm;

                return {
                    nome: socio.nome,
                    participacao: socio.participacao,
                    proLabore: { bruto: proLaboreBruto, inss, irpf, liquido: proLaboreLiq },
                    dividendos: {
                        bruto: dividendosBruto,
                        isento: Math.min(dividendosBruto, limiteIsento),
                        tributavel: Math.max(0, dividendosBruto - limiteIsento),
                        ir: irDividendos,
                        liquido: dividendosLiq,
                        acima50k: dividendosBruto > limiteIsento
                    },
                    irpfm,
                    totalBolso,
                };
            });

            // Totais consolidados (para compatibilidade com código existente)
            const proLaboreMedio = detalhesSocios.length > 0
                ? detalhesSocios.reduce((s, d) => s + d.proLabore.bruto, 0) / detalhesSocios.length : 0;
            const primeiroSocio = detalhesSocios[0] || {};
            const lucroDisponivel = dados.faturamento - regime.totalImpostos - dados.folha - dados.cmv - dados.despesas;

            return {
                regime: regime.regime,
                proLabore: primeiroSocio.proLabore || { bruto: 0, inss: 0, irpf: 0, liquido: 0 },
                dividendos: primeiroSocio.dividendos || { bruto: 0, ir: 0, liquido: 0 },
                irpfm: primeiroSocio.irpfm || 0,
                totalBolso: primeiroSocio.totalBolso || 0,
                totalBolsoTodosSocios: detalhesSocios.reduce((s, d) => s + d.totalBolso, 0),
                cargaEfetiva: dados.faturamento > 0 ? regime.totalImpostos / dados.faturamento : 0,
                lucroDisponivel: Math.max(0, lucroDisponivel),
                detalhesSocios,
            };
        });
    }

    // ═══════════════════════════════════════════════════════════════
    //  SIMULADOR DE CENÁRIOS DE DISTRIBUIÇÃO — NOVO v4.0
    // ═══════════════════════════════════════════════════════════════

    function gerarCenariosDistribuicao(lucroDisponivel, sociosArr, fatorRetirada) {
        const lucroRetirado = Math.max(0, lucroDisponivel * fatorRetirada);
        const limiteIsento = IF.IRPF.dividendos.limite_mensal_isento;
        const aliqRetencao = IF.IRPF.dividendos.aliquota_retencao;
        const cenarios = [];

        // Cenário 1: Distribuição Proporcional (conforme contrato social)
        cenarios.push({
            nome: 'Proporcional (Contrato Social)',
            descricao: 'Cada sócio recebe conforme sua participação no capital',
            distribuicao: sociosArr.map(s => {
                const pctDecimal = s.participacao / 100;
                const dividendo = lucroRetirado * pctDecimal;
                const tributavel = Math.max(0, dividendo - limiteIsento);
                const ir = tributavel * aliqRetencao;
                return {
                    nome: s.nome,
                    participacao: s.participacao,
                    dividendo,
                    isento: Math.min(dividendo, limiteIsento),
                    tributavel,
                    ir,
                    liquido: dividendo - ir
                };
            })
        });

        // Cenário 2: Distribuição Igual
        if (sociosArr.length > 1) {
            cenarios.push({
                nome: 'Distribuição Igual',
                descricao: 'Cada sócio recebe o mesmo valor',
                distribuicao: sociosArr.map(s => {
                    const dividendo = lucroRetirado / sociosArr.length;
                    const tributavel = Math.max(0, dividendo - limiteIsento);
                    const ir = tributavel * aliqRetencao;
                    return {
                        nome: s.nome,
                        participacao: s.participacao,
                        dividendo,
                        isento: Math.min(dividendo, limiteIsento),
                        tributavel,
                        ir,
                        liquido: dividendo - ir
                    };
                })
            });
        }

        // Cenário 3: Otimizado (máximo isento)
        if (lucroRetirado > limiteIsento * sociosArr.length) {
            cenarios.push({
                nome: 'Otimizado (Máximo Isento)',
                descricao: `Cada sócio recebe até ${formatBRL(limiteIsento)} (isento), excedente reinvestido`,
                distribuicao: sociosArr.map(s => {
                    const dividendo = Math.min(limiteIsento, lucroRetirado / sociosArr.length);
                    return {
                        nome: s.nome,
                        participacao: s.participacao,
                        dividendo,
                        isento: dividendo,
                        tributavel: 0,
                        ir: 0,
                        liquido: dividendo,
                        reinvestimento: Math.max(0, (lucroRetirado * (s.participacao / 100)) - dividendo)
                    };
                })
            });
        }

        // Calcular IR total de cada cenário
        cenarios.forEach(c => {
            c.irTotal = c.distribuicao.reduce((s, d) => s + d.ir, 0);
            c.liquidoTotal = c.distribuicao.reduce((s, d) => s + d.liquido, 0);
        });

        return cenarios;
    }

    // ═══════════════════════════════════════════════════════════════
    //  CÁLCULO 5: RANKING
    // ═══════════════════════════════════════════════════════════════

    function ranquear(regimesArr, pessoalArr) {
        const combined = [];
        for (let i = 0; i < regimesArr.length; i++) {
            if (!regimesArr[i] || !pessoalArr[i]) continue;
            combined.push({
                ...regimesArr[i],
                pessoal: pessoalArr[i],
                bolsoSocio: pessoalArr[i].totalBolso,
                bolsoTodosSocios: pessoalArr[i].totalBolsoTodosSocios,
            });
        }

        combined.sort((a, b) => {
            if (b.bolsoTodosSocios !== a.bolsoTodosSocios) return b.bolsoTodosSocios - a.bolsoTodosSocios;
            return a.totalImpostos - b.totalImpostos;
        });

        return combined.map((r, i) => ({ ...r, posicao: i + 1 }));
    }

    // ═══════════════════════════════════════════════════════════════
    //  FLUXO PRINCIPAL — CALCULAR
    // ═══════════════════════════════════════════════════════════════

    function calcular() {
      try {
        console.log('[calcular] Início...');
        const dados = coletarInputs();
        console.log('[calcular] Inputs:', JSON.stringify({uf: dados.uf, fat: dados.faturamento, cnae: dados.cnaeCodigo, cat: dados.cnaeCategoria}));
        if (dados.faturamento <= 0) { console.warn('[calcular] Faturamento <= 0, abortando'); return; }

        // Validações
        const alertasValidacao = validarDados(dados);
        const errosCriticos = alertasValidacao.filter(a => a.tipo === 'error');
        if (errosCriticos.length > 0) {
            alert('Erros encontrados:\n\n' + errosCriticos.map(a => '• ' + a.msg).join('\n'));
            return;
        }

        const regras = regrasCNAE || CM.obterRegrasCNAE(dados.cnaeCodigo, dados.cnaeCategoria);
        console.log('[calcular] Regras:', JSON.stringify({anexo: regras?.anexo, vedado: regras?.vedado, fatorR: regras?.fatorR}));
        const estado = dados.uf && ES[dados.uf] ? ES[dados.uf] : null;
        console.log('[calcular] Estado:', estado ? JSON.stringify({nome: estado.nome, sub: estado.sublimite_simples, icms: estado.icms?.padrao}) : 'null');

        console.log('[calcular] Calculando Simples...');
        const simples = calcularSimples(dados, regras, estado);
        console.log('[calcular] Simples:', simples ? 'OK ('+simples.totalImpostos+')' : 'null/inelegível');

        console.log('[calcular] Calculando Presumido...');
        const presumido = calcularPresumido(dados, regras, estado);
        console.log('[calcular] Presumido:', presumido ? 'OK ('+presumido.totalImpostos+')' : 'null');

        console.log('[calcular] Calculando Real...');
        const real = calcularReal(dados, regras, estado);
        console.log('[calcular] Real:', real ? 'OK ('+real.totalImpostos+')' : 'null');

        const regimesArr = [simples, presumido, real];
        console.log('[calcular] Calculando Impacto Pessoal...');
        const pessoalArr = calcularImpactoPessoal(dados, regimesArr);
        console.log('[calcular] Pessoal OK. Ranqueando...');
        const ranking = ranquear(regimesArr, pessoalArr);
        console.log('[calcular] Ranking:', ranking.length, 'regimes');

        // Armazenar para exportação
        ultimoRanking = ranking;
        ultimosDados = dados;

        // Render all tabs
        console.log('[calcular] Renderizando tabs...');
        renderTabTributaria(ranking, dados, regras, alertasValidacao);
        console.log('[calcular] Tab Tributária OK');
        renderTabTEA(ranking, dados);
        console.log('[calcular] Tab TEA OK');
        renderTabPessoal(ranking, dados);
        console.log('[calcular] Tab Pessoal OK');
        renderTabProjecoes(ranking, dados, regras, estado);
        console.log('[calcular] Tab Projeções OK');

        // Habilitar botões de exportação
        $('btnPDF').disabled = false;
        $('btnExcel').disabled = false;

        // Show results
        $('formArea').style.display = 'none';
        $('resultArea').style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        console.log('[calcular] ✅ Concluído com sucesso!');

        // Salvar no histórico
        salvarHistorico(dados, ranking);
      } catch (err) {
        console.error('[calcular] ❌ ERRO:', err.message);
        console.error('[calcular] Stack:', err.stack);
        alert('Erro ao calcular: ' + err.message + '\n\nVeja o console (F12) para detalhes.');
      }
    }

    function voltarFormulario() {
        $('resultArea').style.display = 'none';
        $('formArea').style.display = 'block';
        // Reset tabs
        $$('.tab-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
        $$('.tab-content').forEach((c, i) => c.classList.toggle('active', i === 0));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ═══════════════════════════════════════════════════════════════
    //  RENDER TAB 1: TRIBUTÁRIA
    // ═══════════════════════════════════════════════════════════════

    function renderTabTributaria(ranking, dados, regras, alertasValidacao) {
        const tab = $('tabTributaria');
        if (!ranking.length) {
            tab.innerHTML = '<p style="text-align:center;color:var(--text-muted);">Nenhum regime calculável.</p>';
            return;
        }

        const winner = ranking[0];
        const second = ranking[1];
        const econAnual = second ? (second.totalImpostos - winner.totalImpostos) * 12 : 0;

        const medals = ['🥇', '🥈', '🥉'];

        // Alertas de validação no topo
        let alertasHtml = '';
        if (alertasValidacao && alertasValidacao.length > 0) {
            alertasHtml = '<div class="validacao-alertas">';
            alertasValidacao.forEach(a => {
                alertasHtml += `<div class="alert-item ${a.tipo}">${a.msg}</div>`;
            });
            alertasHtml += '</div>';
        }

        let html = alertasHtml + `
        <div class="winner-card">
            <div class="winner-label">REGIME MAIS VANTAJOSO</div>
            <div class="winner-regime">${winner.regime}</div>
            <div class="winner-value">${formatBRL(winner.totalImpostos)}/mês</div>
            <div class="winner-sub">${formatPct(winner.pessoal.cargaEfetiva)} do faturamento${econAnual > 0 ? ` · Economia de ${formatBRL(econAnual)}/ano vs ${second.regime}` : ''}</div>
        </div>

        <div class="regime-cards">`;

        ranking.forEach((r, i) => {
            const imp = r.impostos;
            html += `
            <div class="regime-card pos-${i + 1}">
                <span class="medal">${medals[i] || ''}</span>
                <div class="regime-name">${r.regime}</div>
                <div class="regime-total">${formatBRL(r.totalImpostos)}/mês</div>
                <div class="regime-aliq">${formatPct(r.pessoal.cargaEfetiva)} efetiva</div>
                <div class="regime-breakdown">
                    ${imp.irpj !== undefined ? `<div class="bk-row"><span>IRPJ</span><span>${formatBRL(imp.irpj)}</span></div>` : ''}
                    ${imp.csll !== undefined ? `<div class="bk-row"><span>CSLL</span><span>${formatBRL(imp.csll)}</span></div>` : ''}
                    ${imp.pis !== undefined ? `<div class="bk-row"><span>PIS</span><span>${formatBRL(imp.pis)}</span></div>` : ''}
                    ${imp.cofins !== undefined ? `<div class="bk-row"><span>COFINS</span><span>${formatBRL(imp.cofins)}</span></div>` : ''}
                    ${imp.cpp !== undefined ? `<div class="bk-row"><span>CPP</span><span>${formatBRL(imp.cpp)}</span></div>` : ''}
                    ${imp.icms !== undefined && imp.icms > 0 ? `<div class="bk-row"><span>ICMS</span><span>${formatBRL(imp.icms)}</span></div>` : ''}
                    ${imp.iss !== undefined && imp.iss > 0 ? `<div class="bk-row"><span>ISS</span><span>${formatBRL(imp.iss)}</span></div>` : ''}
                    ${r.DAS !== undefined ? `<div class="bk-row"><span>DAS</span><span>${formatBRL(r.DAS)}</span></div>` : ''}
                    ${r.cppFora ? `<div class="bk-row"><span>CPP fora DAS</span><span>${formatBRL(r.cppFora)}</span></div>` : ''}
                    ${imp.descontoSudam ? `<div class="bk-row"><span>Desconto SUDAM</span><span style="color:var(--accent);">-${formatBRL(imp.descontoSudam)}</span></div>` : ''}
                </div>
                ${r.alertas?.length ? '<div class="alert-list">' + r.alertas.map(a => `<div class="alert-item ${a.tipo}">${a.msg}</div>`).join('') + '</div>' : ''}
            </div>`;
        });

        // Add ineligible Simples card if not in ranking
        if (!ranking.find(r => r.regime === 'Simples Nacional')) {
            const reason = regras.vedado ? `VEDADO: ${regras.motivoVedacao || 'Atividade não permitida'}` : `RBT12 (${formatBRL(dados.faturamento * 12)}) excede teto de R$ 4.800.000`;
            html += `
            <div class="regime-card">
                <div class="regime-name" style="color:var(--text-muted);">Simples Nacional</div>
                <div class="regime-ineligible">${reason}</div>
            </div>`;
        }

        html += '</div>';

        // Detail table
        html += renderDetailTable(ranking, dados);

        // Bar chart
        html += renderBarChart(ranking);

        // Donut chart for winner
        html += renderDonut(ranking[0]);

        tab.innerHTML = html;
    }

    function renderDetailTable(ranking, dados) {
        const tributos = ['IRPJ', 'CSLL', 'PIS', 'COFINS', 'CPP', 'ICMS', 'ISS', 'Total'];
        const keys = ['irpj', 'csll', 'pis', 'cofins', 'cpp', 'icms', 'iss'];

        let html = `<table class="detail-table"><thead><tr><th>Tributo</th>`;
        ranking.forEach(r => { html += `<th>${r.regime}</th>`; });
        html += '</tr></thead><tbody>';

        keys.forEach((k, i) => {
            html += `<tr><td style="font-family:var(--font-body);color:var(--text-muted);">${tributos[i]}</td>`;
            ranking.forEach(r => {
                const val = r.impostos[k] !== undefined ? r.impostos[k] : 0;
                html += `<td>${formatBRL(val)}</td>`;
            });
            html += '</tr>';
        });

        // Total row
        html += `<tr><td style="font-family:var(--font-body);">TOTAL</td>`;
        ranking.forEach(r => { html += `<td>${formatBRL(r.totalImpostos)}</td>`; });
        html += '</tr></tbody></table>';

        return html;
    }

    function renderBarChart(ranking) {
        if (!ranking.length) return '';
        const max = Math.max(...ranking.map(r => r.totalImpostos));
        const colors = ['var(--accent)', 'var(--blue)', 'var(--purple)'];

        let html = '<div class="chart-bars">';
        ranking.forEach((r, i) => {
            const h = max > 0 ? (r.totalImpostos / max) * 160 : 4;
            html += `
            <div class="chart-bar-item">
                <div class="chart-bar" style="height:${h}px;background:${colors[i]};"></div>
                <div class="chart-bar-label">${r.regime.split(' ')[0]}</div>
                <div class="chart-bar-value">${formatBRL(r.totalImpostos)}</div>
            </div>`;
        });
        html += '</div>';
        return html;
    }

    function renderDonut(regime) {
        if (!regime) return '';
        const imp = regime.impostos;
        const items = [
            { label: 'IRPJ', value: imp.irpj || 0, color: '#10b981' },
            { label: 'CSLL', value: imp.csll || 0, color: '#3b82f6' },
            { label: 'PIS', value: imp.pis || 0, color: '#8b5cf6' },
            { label: 'COFINS', value: imp.cofins || 0, color: '#f97316' },
            { label: 'CPP', value: imp.cpp || 0, color: '#f59e0b' },
            { label: 'ICMS', value: imp.icms || 0, color: '#06b6d4' },
            { label: 'ISS', value: imp.iss || 0, color: '#ec4899' },
        ].filter(i => i.value > 0);

        const total = items.reduce((a, b) => a + b.value, 0);
        if (total <= 0) return '';

        const R = 60, cx = 80, cy = 80;
        let angle = 0;
        let paths = '';

        items.forEach(item => {
            const pct = item.value / total;
            const endAngle = angle + pct * 360;
            const startRad = (angle - 90) * Math.PI / 180;
            const endRad = (endAngle - 90) * Math.PI / 180;
            const largeArc = pct > 0.5 ? 1 : 0;

            const x1 = cx + R * Math.cos(startRad);
            const y1 = cy + R * Math.sin(startRad);
            const x2 = cx + R * Math.cos(endRad);
            const y2 = cy + R * Math.sin(endRad);

            paths += `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${item.color}" opacity="0.85"/>`;
            angle = endAngle;
        });

        let legendHtml = items.map(i =>
            `<div class="donut-legend-item"><span class="dot" style="background:${i.color};"></span>${i.label}: ${formatBRL(i.value)} (${(i.value / total * 100).toFixed(1)}%)</div>`
        ).join('');

        return `
        <div class="donut-container">
            <svg width="160" height="160" viewBox="0 0 160 160">
                ${paths}
                <circle cx="${cx}" cy="${cy}" r="30" fill="var(--bg-deepest)"/>
            </svg>
            <div class="donut-legend">${legendHtml}</div>
        </div>`;
    }

    // ═══════════════════════════════════════════════════════════════
    //  RENDER TAB 2: TEA
    // ═══════════════════════════════════════════════════════════════

    function renderTabTEA(ranking, dados) {
        const tab = $('tabTEA');
        let html = '<h3 style="font-size:1.1rem;font-weight:700;margin-bottom:16px;">Tax Effective Analysis</h3>';

        ranking.forEach(r => {
            const p = r.pessoal;
            html += `
            <div class="info-card">
                <h4>${r.regime}</h4>
                <div class="info-row"><span>Impostos PJ</span><span>${formatBRL(r.totalImpostos)}</span></div>
                <div class="info-row"><span>Carga sobre faturamento</span><span>${formatPct(p.cargaEfetiva)}</span></div>
                <div class="info-row"><span>Lucro disponível (após impostos e custos)</span><span>${formatBRL(p.lucroDisponivel)}</span></div>
                <div class="info-row"><span>Total no bolso (todos os sócios)</span><span style="color:var(--accent-bright);">${formatBRL(p.totalBolsoTodosSocios)}</span></div>
            </div>`;
        });

        // Custo real do funcionário
        if (dados.funcionarios > 0 && dados.folha > 0) {
            const salMedio = (dados.folha - dados.proLabore) / Math.max(dados.funcionarios, 1);
            const custoReal = salMedio * 1.70;
            html += `
            <div class="info-card">
                <h4>Custo Real por Funcionário</h4>
                <div class="info-row"><span>Salário médio</span><span>${formatBRL(salMedio)}</span></div>
                <div class="info-row"><span>Custo real (~70% encargos)</span><span style="color:var(--amber);">${formatBRL(custoReal)}</span></div>
                <div class="info-row"><span>Multiplicador</span><span>~1,70x</span></div>
            </div>`;
        }

        // Bar chart: dinheiro no bolso (todos os sócios)
        if (ranking.length > 1) {
            const max = Math.max(...ranking.map(r => r.pessoal.totalBolsoTodosSocios));
            const colors = ['var(--accent)', 'var(--blue)', 'var(--purple)'];
            html += '<h4 style="margin-top:20px;font-size:0.9rem;font-weight:700;color:var(--text-secondary);margin-bottom:12px;">Dinheiro no Bolso (Todos os Sócios)</h4>';
            html += '<div class="chart-bars" style="height:150px;">';
            ranking.forEach((r, i) => {
                const h = max > 0 ? (r.pessoal.totalBolsoTodosSocios / max) * 120 : 4;
                html += `
                <div class="chart-bar-item">
                    <div class="chart-bar" style="height:${Math.max(4, h)}px;background:${colors[i]};"></div>
                    <div class="chart-bar-label">${r.regime.split(' ')[0]}</div>
                    <div class="chart-bar-value">${formatBRL(r.pessoal.totalBolsoTodosSocios)}</div>
                </div>`;
            });
            html += '</div>';
        }

        tab.innerHTML = html;
    }

    // ═══════════════════════════════════════════════════════════════
    //  RENDER TAB 3: PESSOAL — REESCRITO v4.0
    //  Agora mostra detalhes por sócio individual
    // ═══════════════════════════════════════════════════════════════

    function renderTabPessoal(ranking, dados) {
        const tab = $('tabPessoal');
        let html = '<h3 style="font-size:1.1rem;font-weight:700;margin-bottom:16px;">Impacto na Pessoa Física</h3>';

        if (!ranking.length) {
            tab.innerHTML = html + '<p style="color:var(--text-muted);">Sem dados.</p>';
            return;
        }

        const winner = ranking[0];
        const p = winner.pessoal;

        // ═══ TABELA DE PRÓ-LABORE POR SÓCIO ═══
        html += `<div class="info-card">
            <h4>Pró-labore por Sócio</h4>
            <div class="table-responsive">
            <table class="detail-table socios-detail">
                <thead><tr>
                    <th>Sócio</th><th>Part.</th><th>Bruto</th><th>INSS</th><th>IRPF</th><th>Líquido</th>
                </tr></thead><tbody>`;

        p.detalhesSocios.forEach(ds => {
            html += `<tr>
                <td style="color:var(--text-primary);font-family:var(--font-body);">${ds.nome}</td>
                <td>${ds.participacao.toFixed(1)}%</td>
                <td>${formatBRL(ds.proLabore.bruto)}</td>
                <td style="color:var(--red);">-${formatBRL(ds.proLabore.inss)}</td>
                <td style="color:var(--red);">-${formatBRL(ds.proLabore.irpf)}</td>
                <td style="color:var(--accent-bright);">${formatBRL(ds.proLabore.liquido)}</td>
            </tr>`;
        });

        html += `</tbody></table></div></div>`;

        // ═══ DIVIDENDOS POR SÓCIO — CADA REGIME ═══
        ranking.forEach(r => {
            const rp = r.pessoal;
            const limiteIsento = IF.IRPF.dividendos.limite_mensal_isento;

            html += `<div class="info-card">
                <h4>Dividendos — ${r.regime}</h4>
                <div class="info-row"><span>Lucro disponível</span><span>${formatBRL(rp.lucroDisponivel)}</span></div>`;

            // Tabela de dividendos por sócio
            html += `<div class="table-responsive" style="margin-top:12px;">
            <table class="detail-table socios-detail">
                <thead><tr>
                    <th>Sócio</th><th>Part.</th><th>Div. Bruto</th>
                    <th>Isento</th><th>Tributável</th><th>IR 10%</th><th>Líquido</th>
                </tr></thead><tbody>`;

            let totalIR = 0;
            let temAlerta50k = false;

            rp.detalhesSocios.forEach(ds => {
                const acima50k = ds.dividendos.acima50k;
                if (acima50k) temAlerta50k = true;
                totalIR += ds.dividendos.ir;

                html += `<tr ${acima50k ? 'class="row-warning"' : ''}>
                    <td style="color:var(--text-primary);font-family:var(--font-body);">${ds.nome}</td>
                    <td>${ds.participacao.toFixed(1)}%</td>
                    <td>${formatBRL(ds.dividendos.bruto)}</td>
                    <td style="color:var(--accent);">${formatBRL(ds.dividendos.isento)}</td>
                    <td>${ds.dividendos.tributavel > 0 ? formatBRL(ds.dividendos.tributavel) : '—'}</td>
                    <td style="color:var(--red);">${ds.dividendos.ir > 0 ? '-' + formatBRL(ds.dividendos.ir) : '—'}</td>
                    <td style="color:var(--accent-bright);">${formatBRL(ds.dividendos.liquido)}</td>
                </tr>`;
            });

            html += `</tbody></table></div>`;

            // ═══ ALERTA R$ 50K — NOVO v4.0 ═══
            if (temAlerta50k) {
                html += `
                <div class="alerta-50k">
                    <div class="alerta-50k-icon">⚠️</div>
                    <div class="alerta-50k-content">
                        <strong>Dividendos acima de ${formatBRL(limiteIsento)}/mês</strong>
                        <p>Um ou mais sócios recebem dividendos acima do limite de isenção. Incide IR 10% sobre o excedente.</p>
                        <p>IR total sobre dividendos: <strong style="color:var(--red);">${formatBRL(totalIR)}/mês</strong> (${formatBRL(totalIR * 12)}/ano)</p>
                        <p style="color:var(--accent);">💡 Veja os cenários de otimização abaixo para reduzir o IR.</p>
                    </div>
                </div>`;
            }

            // Totais e IRPFM
            html += `
                <div class="info-row total" style="margin-top:12px;">
                    <span>Total no bolso (todos os sócios)</span>
                    <span>${formatBRL(rp.totalBolsoTodosSocios)}</span>
                </div>
            </div>`;
        });

        // ═══ SIMULADOR DE CENÁRIOS DE DISTRIBUIÇÃO — NOVO v4.0 ═══
        const winnerP = winner.pessoal;
        let fatorRetirada = 1;
        if (dados.destinoLucro === 'parcial') fatorRetirada = 0.5;
        else if (dados.destinoLucro === 'reinveste') fatorRetirada = 0;

        if (winnerP.lucroDisponivel > 0 && fatorRetirada > 0 && dados.sociosConfig.length > 1) {
            const cenarios = gerarCenariosDistribuicao(winnerP.lucroDisponivel, dados.sociosConfig, fatorRetirada);

            html += `<div class="info-card cenarios-card">
                <h4>🎯 Simulador de Cenários — ${winner.regime}</h4>
                <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:16px;">Compare estratégias de distribuição de dividendos para otimizar o IR dos sócios.</p>`;

            cenarios.forEach((c, ci) => {
                const isMelhor = c.irTotal === Math.min(...cenarios.map(x => x.irTotal));
                html += `
                <div class="cenario-item ${isMelhor ? 'cenario-melhor' : ''}">
                    <div class="cenario-header">
                        <span class="cenario-nome">${isMelhor ? '⭐ ' : ''}${c.nome}</span>
                        <span class="cenario-ir">IR: ${formatBRL(c.irTotal)}/mês</span>
                    </div>
                    <div class="cenario-desc">${c.descricao}</div>
                    <div class="cenario-grid">`;

                c.distribuicao.forEach(d => {
                    html += `
                    <div class="cenario-socio">
                        <span class="cenario-socio-nome">${d.nome}</span>
                        <span class="cenario-socio-valor">${formatBRL(d.dividendo)}</span>
                        ${d.ir > 0 ? `<span class="cenario-socio-ir">IR: ${formatBRL(d.ir)}</span>` : `<span class="cenario-socio-isento">Isento</span>`}
                        ${d.reinvestimento > 0 ? `<span class="cenario-socio-reinv">Reinveste: ${formatBRL(d.reinvestimento)}</span>` : ''}
                    </div>`;
                });

                html += `</div></div>`;
            });

            // Economia potencial
            const irProporcional = cenarios[0].irTotal;
            const irMinimo = Math.min(...cenarios.map(c => c.irTotal));
            if (irProporcional > irMinimo) {
                html += `
                <div class="cenario-economia">
                    💰 Economia potencial: <strong>${formatBRL(irProporcional - irMinimo)}/mês</strong> (${formatBRL((irProporcional - irMinimo) * 12)}/ano) usando a distribuição otimizada.
                </div>`;
            }

            html += `</div>`;
        }

        // IRPFM note
        const anyIrpfm = ranking.some(r => r.pessoal.detalhesSocios?.some(d => d.irpfm > 0));
        if (anyIrpfm) {
            html += `<div class="alert-item info">Tributação mínima (IRPFM): incide quando renda anual > R$ 600.000. Alíquota progressiva até 10%.</div>`;
        }

        tab.innerHTML = html;
    }

    // ═══════════════════════════════════════════════════════════════
    //  RENDER TAB 4: PROJEÇÕES
    // ═══════════════════════════════════════════════════════════════

    function renderTabProjecoes(ranking, dados, regras, estado) {
        const tab = $('tabProjecoes');
        let html = '<h3 style="font-size:1.1rem;font-weight:700;margin-bottom:16px;">Projeções 12 Meses</h3>';

        if (!ranking.length) {
            tab.innerHTML = html + '<p style="color:var(--text-muted);">Sem dados para projeção.</p>';
            return;
        }

        const winner = ranking[0];
        const crescMensal = Math.pow(1 + dados.crescimento, 1 / 12) - 1;
        const sublimite = estado?.sublimite_simples || 3600000;
        const alertasProj = [];
        const meses = [];

        for (let m = 1; m <= 12; m++) {
            const fatProj = dados.faturamento * Math.pow(1 + crescMensal, m);
            const rbt12Proj = fatProj * 12;
            meses.push({ mes: m, fat: fatProj, rbt12: rbt12Proj });

            if (rbt12Proj > 4800000 && !alertasProj.find(a => a.tipo === 'teto')) {
                alertasProj.push({ tipo: 'teto', msg: `Mês ${m}: RBT12 atinge ${formatBRL(rbt12Proj)} — excede teto do Simples (R$ 4,8M). Migração obrigatória!` });
            } else if (rbt12Proj > sublimite && !alertasProj.find(a => a.tipo === 'sublimite')) {
                alertasProj.push({ tipo: 'sublimite', msg: `Mês ${m}: RBT12 atinge ${formatBRL(rbt12Proj)} — excede sublimite estadual (${formatBRL(sublimite)}). ICMS/ISS fora do DAS.` });
            }
        }

        // Projection bars
        const maxFat = meses[meses.length - 1].fat;
        meses.forEach(m => {
            const pct = (m.fat / maxFat) * 100;
            let color = 'var(--accent)';
            if (m.rbt12 > 4800000) color = 'var(--red)';
            else if (m.rbt12 > sublimite) color = 'var(--amber)';

            html += `
            <div class="proj-month">
                <span class="proj-label">Mês ${m.mes}</span>
                <div class="proj-bar-track"><div class="proj-bar-fill" style="width:${pct}%;background:${color};"></div></div>
                <span class="proj-value">${formatBRL(m.fat)}</span>
            </div>`;
        });

        // Projection alerts
        alertasProj.forEach(a => {
            html += `<div class="proj-alert">${a.msg}</div>`;
        });

        // Annual summary
        const totalAnual = meses.reduce((s, m) => s + m.fat, 0);
        const impostoAnual = winner.totalImpostos * 12;
        html += `
        <div class="info-card" style="margin-top:20px;">
            <h4>Resumo Anual Projetado</h4>
            <div class="info-row"><span>Faturamento anual projetado</span><span>${formatBRL(totalAnual)}</span></div>
            <div class="info-row"><span>Impostos anuais (${winner.regime})</span><span style="color:var(--red);">${formatBRL(impostoAnual)}</span></div>
            <div class="info-row"><span>Lucro anual projetado</span><span style="color:var(--accent-bright);">${formatBRL(totalAnual - impostoAnual - (dados.folha + dados.cmv + dados.despesas) * 12)}</span></div>
        </div>`;

        // Strategic recommendation
        html += `
        <div class="info-card">
            <h4>Recomendação Estratégica</h4>`;

        if (winner.regime === 'Simples Nacional') {
            const rbt12Final = meses[11].rbt12;
            if (rbt12Final > 4800000) {
                html += `<p style="font-size:0.88rem;color:var(--text-secondary);">Com o crescimento projetado, sua empresa excederá o teto do Simples. Recomendamos planejar a transição para ${ranking[1]?.regime || 'Lucro Presumido'} nos próximos meses.</p>`;
            } else if (rbt12Final > sublimite) {
                html += `<p style="font-size:0.88rem;color:var(--text-secondary);">RBT12 projetado excede o sublimite estadual. ICMS/ISS passarão a ser pagos fora do DAS, aumentando a carga. Avalie se outro regime compensa.</p>`;
            } else {
                html += `<p style="font-size:0.88rem;color:var(--text-secondary);">O Simples Nacional permanece vantajoso no horizonte de 12 meses. Continue monitorando o faturamento em relação ao sublimite.</p>`;
            }
        } else {
            html += `<p style="font-size:0.88rem;color:var(--text-secondary);">O ${winner.regime} é o mais vantajoso. ${dados.crescimento > 0.2 ? 'Com crescimento acelerado, revise anualmente.' : 'Mantenha acompanhamento trimestral.'}</p>`;
        }

        html += '</div>';

        tab.innerHTML = html;
    }

    // ═══════════════════════════════════════════════════════════════
    //  EXPORTAÇÃO PDF — NOVO v4.0
    // ═══════════════════════════════════════════════════════════════

    function exportarPDF() {
        if (!ultimoRanking || !ultimosDados) return;
        window.print();
    }

    // ═══════════════════════════════════════════════════════════════
    //  EXPORTAÇÃO EXCEL (CSV) — NOVO v4.0
    // ═══════════════════════════════════════════════════════════════

    function exportarExcel() {
        if (!ultimoRanking || !ultimosDados) return;

        const dados = ultimosDados;
        let csv = '\uFEFF'; // BOM para Excel
        csv += 'ANÁLISE TRIBUTÁRIA IMPOST v4.0\n';
        csv += `Data:;${new Date().toLocaleDateString('pt-BR')}\n`;
        csv += `CNAE:;${dados.cnaeCodigo} - ${dados.cnaeDescricao}\n`;
        csv += `Faturamento:;${formatBRL(dados.faturamento)}\n`;
        csv += `Folha:;${formatBRL(dados.folha)}\n\n`;

        csv += 'COMPARATIVO DE REGIMES\n';
        csv += 'Tributo;' + ultimoRanking.map(r => r.regime).join(';') + '\n';

        const tributos = ['irpj', 'csll', 'pis', 'cofins', 'cpp', 'icms', 'iss'];
        const nomes = ['IRPJ', 'CSLL', 'PIS', 'COFINS', 'CPP', 'ICMS', 'ISS'];
        tributos.forEach((t, i) => {
            csv += nomes[i] + ';' + ultimoRanking.map(r => formatBRL(r.impostos[t] || 0)).join(';') + '\n';
        });
        csv += 'TOTAL;' + ultimoRanking.map(r => formatBRL(r.totalImpostos)).join(';') + '\n\n';

        // Sócios
        csv += 'DISTRIBUIÇÃO POR SÓCIO\n';
        csv += 'Sócio;Participação;Pró-labore;Dividendo;IR Dividendo;Total Bolso\n';
        const winner = ultimoRanking[0];
        winner.pessoal.detalhesSocios.forEach(ds => {
            csv += `${ds.nome};${ds.participacao}%;${formatBRL(ds.proLabore.bruto)};${formatBRL(ds.dividendos.bruto)};${formatBRL(ds.dividendos.ir)};${formatBRL(ds.totalBolso)}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analise-tributaria-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // ═══════════════════════════════════════════════════════════════
    //  HISTÓRICO DE CENÁRIOS — NOVO v4.0
    // ═══════════════════════════════════════════════════════════════

    function salvarHistorico(dados, ranking) {
        try {
            const historico = JSON.parse(localStorage.getItem('impost_historico') || '[]');
            historico.unshift({
                id: Date.now(),
                data: new Date().toISOString(),
                cnae: dados.cnaeCodigo,
                faturamento: dados.faturamento,
                regimeMelhor: ranking[0]?.regime || '',
                impostosMelhor: ranking[0]?.totalImpostos || 0,
                bolsoTotal: ranking[0]?.pessoal?.totalBolsoTodosSocios || 0,
            });
            // Manter no máximo 20 registros
            if (historico.length > 20) historico.length = 20;
            localStorage.setItem('impost_historico', JSON.stringify(historico));
        } catch (e) {
            // Silently fail for storage issues
        }
    }

    // ═══════════════════════════════════════════════════════════════
    //  FIM
    // ═══════════════════════════════════════════════════════════════
})();
