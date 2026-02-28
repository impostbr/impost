/**
 * ═══════════════════════════════════════════════════════════════════
 * IMPOST. — Análise Tributária TEA v5.1
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

        // Órgão público slider
        if ($('sliderOrgaoPublico')) {
            $('sliderOrgaoPublico').addEventListener('input', () => {
                $('orgaoPublicoValue').textContent = $('sliderOrgaoPublico').value + '%';
            });
        }

        // Calculate button
        $('btnCalcular').addEventListener('click', calcular);

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
        parseMoney: (v) => parseMoney(v),
        mascaraMoney: (el) => aplicarMascaraMoney(el),
        blurMoney: (el) => formatarMoneyOnBlur(el),
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

        // Folha excede pró-labore mas sem funcionários declarados
        if (dados.funcionarios === 0 && dados.folha > dados.proLaboreTotal && dados.proLaboreTotal > 0) {
            const diferenca = dados.folha - dados.proLaboreTotal;
            alertas.push({ tipo: 'warn', msg: `Funcionários = 0, mas a folha (${formatBRL(dados.folha)}) excede o pró-labore (${formatBRL(dados.proLaboreTotal)}) em ${formatBRL(diferenca)}. Essa diferença não tem origem identificada, distorce o Fator R do Simples Nacional e pode gerar inconsistência fiscal. Ajuste a folha ou informe o número de funcionários.` });
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

            // ═══ NOVOS CAMPOS — v5.0 ═══
            creditosPISCOFINS: $('inputCreditosPISCOFINS') ? parseMoney($('inputCreditosPISCOFINS')) : 0,
            pctOrgaoPublico: $('sliderOrgaoPublico') ? parseInt($('sliderOrgaoPublico').value) / 100 : 0,
            patrimonioLiquido: $('inputPatrimonioLiquido') ? parseMoney($('inputPatrimonioLiquido')) : 0,
            lucrosAcumulados: $('inputLucrosAcumulados') ? parseMoney($('inputLucrosAcumulados')) : 0,
            prejuizoFiscal: $('inputPrejuizoFiscal') ? parseMoney($('inputPrejuizoFiscal')) : 0,
            baseNegativaCSLL: $('inputBaseNegativaCSLL') ? parseMoney($('inputBaseNegativaCSLL')) : 0,
            investimentoAtivos: $('inputInvestimentoAtivos') ? parseMoney($('inputInvestimentoAtivos')) : 0,
            custoContabilLR: $('inputCustoContabilLR') ? parseMoney($('inputCustoContabilLR')) : 2000,
            apuracaoLR: $('selectApuracaoLR') ? $('selectApuracaoLR').value : 'trimestral',
            tjlp: $('inputTJLP') ? (parseFloat($('inputTJLP').value.replace(',', '.')) || 6) / 100 : 0.06,

            // ═══ CAMPOS LUCRO PRESUMIDO — v6.0 ═══
            devolucoesLP: $('inputDevolucoesLP') ? parseMoney($('inputDevolucoesLP')) : 0,
            descontosIncondLP: $('inputDescontosIncondLP') ? parseMoney($('inputDescontosIncondLP')) : 0,
            ganhosCapitalLP: $('inputGanhosCapitalLP') ? parseMoney($('inputGanhosCapitalLP')) : 0,
            rendimentosFinancLP: $('inputRendimentosFinancLP') ? parseMoney($('inputRendimentosFinancLP')) : 0,
            irrfRetidoLP: $('inputIRRFRetidoLP') ? parseMoney($('inputIRRFRetidoLP')) : 0,
            csllRetidaLP: $('inputCSLLRetidaLP') ? parseMoney($('inputCSLLRetidaLP')) : 0,
            lucroContabilLP: $('inputLucroContabilLP') ? parseMoney($('inputLucroContabilLP')) : 0,
            mesesAtividadeLP: $('selectMesesAtividadeLP') ? parseInt($('selectMesesAtividadeLP').value) || 12 : 12,
            impedInstFinanceira: $('checkInstFinanceira') ? $('checkInstFinanceira').checked : false,
            impedFactoring: $('checkFactoring') ? $('checkFactoring').checked : false,
            impedRendaExterior: $('checkRendaExterior') ? $('checkRendaExterior').checked : false,
            impedIsencaoIR: $('checkIsencaoIR') ? $('checkIsencaoIR').checked : false,
        };
    }

    // ═══════════════════════════════════════════════════════════════
    //  CÁLCULO 1: SIMPLES NACIONAL
    // ═══════════════════════════════════════════════════════════════

    function calcularSimples(dados, regras, estado) {
        if (regras.vedado) return null;

        const motor = typeof SimplesNacional !== 'undefined' ? SimplesNacional : null;

        const RBT12 = dados.faturamento * 12;
        if (RBT12 > IF.PARAMETROS_GERAIS.teto_simples_nacional) return null;

        // ═══ VERIFICAR ELEGIBILIDADE VIA MOTOR ═══
        let elegibilidade = { elegivel: true, impedimentos: [], alertas: [], classificacao: null, sublimiteEstadual: null };
        if (motor) {
            try {
                elegibilidade = motor.verificarElegibilidade({
                    receitaBrutaAnual: RBT12,
                    cnae: dados.cnaeCodigo,
                    naturezaJuridica: dados.naturezaJuridica || null,
                    socioPessoaJuridica: dados.impedSocioPJ || false,
                    socioParticipacaoOutraPJ: dados.impedSocioParticipacao || false,
                    debitosFiscaisPendentes: dados.impedDebitos || false,
                    atividadeInstFinanceira: dados.impedInstFinanceira || false,
                    atividadeFactoring: dados.impedFactoring || false,
                    socioDomiciliadoExterior: dados.impedRendaExterior || false,
                    fatorR: dados.faturamento > 0 ? dados.folha / dados.faturamento : 0,
                });
            } catch (e) {
                // Motor falhou na elegibilidade — seguir com cálculo manual
                console.warn('[SN Motor] Erro na verificação de elegibilidade:', e.message);
            }
        }

        if (!elegibilidade.elegivel) return null;

        // ═══ CÁLCULO FATOR R E ANEXO ═══
        const fatorR = dados.faturamento > 0 ? dados.folha / dados.faturamento : 0;
        const anexoEfetivo = CM.obterAnexoEfetivo(dados.cnaeCodigo, dados.cnaeCategoria, fatorR);
        if (anexoEfetivo === 'VEDADO') return null;

        const tabelaAnexo = IF.SIMPLES_NACIONAL['ANEXO_' + anexoEfetivo];
        if (!tabelaAnexo) return null;

        // ═══ DADOS DO MOTOR (enriquecimento) ═══
        let motorFatorR = null;
        let anexoResult = null;
        let resultadoDAS = null;
        let resultadoAnual = null;
        let distribuicaoLucros = null;
        let analiseVD = null;
        let comparativo = null;

        if (motor) {
            try {
                // Fator R via motor
                motorFatorR = motor.calcularFatorR({
                    folhaSalarios12Meses: dados.folha * 12,
                    receitaBruta12Meses: RBT12,
                });
            } catch (e) {
                console.warn('[SN Motor] Erro no calcularFatorR:', e.message);
            }

            try {
                // Anexo via motor
                anexoResult = motor.determinarAnexo({
                    cnae: dados.cnaeCodigo,
                    fatorR: motorFatorR ? motorFatorR.fatorR : fatorR,
                });
            } catch (e) {
                console.warn('[SN Motor] Erro no determinarAnexo:', e.message);
            }

            // Usar o anexo do motor se disponível (consistência com romano do analise.js)
            const anexoMotor = anexoResult && !anexoResult.vedado ? anexoResult.anexo : anexoEfetivo;

            try {
                // DAS mensal via motor
                resultadoDAS = motor.calcularDASMensal({
                    receitaBrutaMensal: dados.faturamento,
                    rbt12: RBT12,
                    anexo: anexoMotor,
                    issRetidoFonte: 0,
                    folhaMensal: dados.folha,
                });
            } catch (e) {
                console.warn('[SN Motor] Erro no calcularDASMensal:', e.message);
            }

            try {
                // Consolidação anual via motor (12 meses iguais)
                const mesesArr = Array(12).fill(null).map(() => ({
                    receitaBrutaMensal: dados.faturamento,
                    rbt12: RBT12,
                    anexo: anexoMotor,
                    folhaMensal: dados.folha,
                    folhaSalarios12Meses: dados.folha * 12,
                    issRetidoFonte: 0,
                }));
                resultadoAnual = motor.calcularAnualConsolidado({
                    meses: mesesArr,
                    socios: dados.sociosConfig.map(s => ({
                        nome: s.nome,
                        percentual: s.participacao / 100,
                    })),
                    lucroContabilEfetivo: dados.lucroContabilLP > 0 ? dados.lucroContabilLP : null,
                });
            } catch (e) {
                console.warn('[SN Motor] Erro no calcularAnualConsolidado:', e.message);
            }

            try {
                // Distribuição de lucros via motor
                const dasAnualEstimado = resultadoDAS ? resultadoDAS.dasAPagar * 12 : 0;
                const tipoAtiv = dados.cnaeCategoria === 'Serviço' ? 'servicos' : (dados.cnaeCategoria === 'Comércio' ? 'comercio' : 'servicos');
                distribuicaoLucros = motor.calcularDistribuicaoLucros({
                    receitaBrutaAnual: RBT12,
                    dasAnual: resultadoAnual ? resultadoAnual.dasAnual : dasAnualEstimado,
                    socios: dados.sociosConfig.map(s => ({
                        nome: s.nome,
                        percentual: s.participacao / 100,
                    })),
                    cnae: dados.cnaeCodigo,
                    lucroContabilEfetivo: dados.lucroContabilLP > 0 ? dados.lucroContabilLP : null,
                    tipoAtividade: tipoAtiv,
                });
            } catch (e) {
                console.warn('[SN Motor] Erro no calcularDistribuicaoLucros:', e.message);
            }

            try {
                // Análise vantagens/desvantagens
                analiseVD = motor.analisarVantagensDesvantagens({
                    receitaBrutaAnual: RBT12,
                    anexo: anexoMotor,
                    fatorR: motorFatorR ? motorFatorR.fatorR : fatorR,
                    localizacaoSUDAM: dados.sudam || false,
                    vendeParaPJ: false,
                    folhaAnual: dados.folha * 12,
                    exporta: false,
                });
            } catch (e) {
                console.warn('[SN Motor] Erro no analisarVantagensDesvantagens:', e.message);
            }

            try {
                // Comparativo com outros regimes
                comparativo = motor.compararComOutrosRegimes({
                    receitaBrutaAnual: RBT12,
                    folhaAnual: dados.folha * 12,
                    cnae: dados.cnaeCodigo,
                    fatorR: motorFatorR ? motorFatorR.fatorR : fatorR,
                    anexo: anexoMotor,
                    despesasOperacionais: (dados.cmv + dados.despesas) * 12,
                    aliquotaISS: dados.issAliquota,
                    temSUDAM: dados.sudam || false,
                });
            } catch (e) {
                console.warn('[SN Motor] Erro no compararComOutrosRegimes:', e.message);
            }
        }

        // ═══ CÁLCULO BASE (compatibilidade com ranking) ═══
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

            // ═══ DADOS DO MOTOR PARA ABA DEDICADA ═══
            motorDAS: resultadoDAS,
            motorAnual: resultadoAnual,
            motorFatorR: motorFatorR,
            motorDistribuicaoLucros: distribuicaoLucros,
            motorComparativo: comparativo,
            analiseVD,
            elegibilidade,
            anexoResult,
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
        const motor = typeof LucroPresumido !== 'undefined' ? LucroPresumido : null;

        // ═══ VERIFICAR ELEGIBILIDADE VIA MOTOR ═══
        let elegibilidade = { elegivel: true, impedimentos: [], alertas: [] };
        if (motor) {
            elegibilidade = motor.verificarElegibilidade({
                receitaBrutaAnualAnterior: dados.faturamento * 12,
                mesesAtividadeAnoAnterior: dados.mesesAtividadeLP || 12,
                isInstituicaoFinanceira: dados.impedInstFinanceira || false,
                isFactoring: dados.impedFactoring || false,
                temRendimentosExterior: dados.impedRendaExterior || false,
                temIsencaoReducaoIR: dados.impedIsencaoIR || false,
            });
        }

        // Se RBT12 > R$ 78M, inelegível
        if (dados.faturamento * 12 > 78000000) {
            elegibilidade.elegivel = false;
            elegibilidade.impedimentos.push({
                descricao: 'Receita bruta anual excede R$ 78 milhões',
                baseLegal: 'Art. 587 do RIR/2018'
            });
        }

        // ═══ IDENTIFICAR ATIVIDADE VIA MOTOR ═══
        let atividadeMotor = null;
        let presIRPJ = regras.presuncaoIRPJ || 0.32;
        let presCSLL = regras.presuncaoCSLL || 0.32;
        let atividadeId = 'servicos_gerais';

        if (motor && dados.cnaeCodigo) {
            atividadeMotor = motor.identificarAtividadePorCNAE(dados.cnaeCodigo);
            if (atividadeMotor) {
                presIRPJ = atividadeMotor.percentualIRPJ;
                presCSLL = atividadeMotor.percentualCSLL;
                atividadeId = atividadeMotor.atividadeId;
            }
        }

        // ═══ CÁLCULO TRIMESTRAL VIA MOTOR ═══
        const fatTrimestral = dados.faturamento * 3;
        let resultadoTrimestral = null;
        let resultadoAnual = null;
        let pisCofinsmensal = null;
        let analiseVD = null;

        if (motor) {
            // Cálculo trimestral detalhado
            resultadoTrimestral = motor.calcularLucroPresumidoTrimestral({
                receitas: [{ atividadeId: atividadeId, valor: fatTrimestral }],
                devolucoes: (dados.devolucoesLP || 0),
                cancelamentos: 0,
                descontosIncondicionais: (dados.descontosIncondLP || 0),
                ganhosCapital: (dados.ganhosCapitalLP || 0),
                rendimentosFinanceiros: (dados.rendimentosFinancLP || 0),
                irrfRetidoFonte: (dados.irrfRetidoLP || 0),
                csllRetidaFonte: (dados.csllRetidaLP || 0),
            });

            // PIS/COFINS mensal
            pisCofinsmensal = motor.calcularPISCOFINSMensal({
                receitaBrutaMensal: dados.faturamento,
            });

            // Consolidação anual (4 trimestres iguais, 12 meses iguais)
            const trimestresArr = Array(4).fill({
                receitas: [{ atividadeId: atividadeId, valor: fatTrimestral }],
                devolucoes: (dados.devolucoesLP || 0),
                descontosIncondicionais: (dados.descontosIncondLP || 0),
                ganhosCapital: (dados.ganhosCapitalLP || 0),
                rendimentosFinanceiros: (dados.rendimentosFinancLP || 0),
                irrfRetidoFonte: (dados.irrfRetidoLP || 0),
                csllRetidaFonte: (dados.csllRetidaLP || 0),
            });
            const mesesArr = Array(12).fill({
                receitaBrutaMensal: dados.faturamento,
            });

            resultadoAnual = motor.calcularAnualConsolidado({
                trimestres: trimestresArr,
                meses: mesesArr,
                aliquotaISS: dados.issAliquota,
                folhaPagamentoAnual: dados.folha * 12,
                lucroContabilEfetivo: dados.lucroContabilLP > 0 ? dados.lucroContabilLP : null,
                socios: dados.sociosConfig.map(s => ({
                    nome: s.nome,
                    percentual: s.participacao / 100
                })),
            });

            // Análise de vantagens/desvantagens
            analiseVD = motor.analisarVantagensDesvantagens({
                receitaBrutaAnual: dados.faturamento * 12,
                despesasOperacionaisAnuais: (dados.cmv + dados.despesas + dados.folha) * 12,
                atividadeId: atividadeId,
                areaAtuacaoSUDAM: dados.sudam || false,
                temInvestimentosEquipamentos: dados.investimentoAtivos > 0,
                temReceitasSazonais: false,
            });
        }

        // ═══ CÁLCULO BASE (compatibilidade com ranking) ═══
        const baseIRPJ = dados.faturamento * presIRPJ;
        const baseCSLL = dados.faturamento * presCSLL;

        // Valores mensais para compatibilidade com o sistema
        let irpjMensal, adicionalMensal, csllMensal, pisMensal, cofinsMensal;

        if (resultadoTrimestral) {
            const res = resultadoTrimestral.resumo;
            irpjMensal = res.irpjNormal / 3;
            adicionalMensal = res.irpjAdicional / 3;
            csllMensal = res.csllDevida / 3;
            pisMensal = pisCofinsmensal ? pisCofinsmensal.pis.devido : dados.faturamento * 0.0065;
            cofinsMensal = pisCofinsmensal ? pisCofinsmensal.cofins.devida : dados.faturamento * 0.03;
        } else {
            irpjMensal = baseIRPJ * LP.irpj.aliquota;
            adicionalMensal = Math.max(0, baseIRPJ - LP.irpj.adicional_limite_mensal) * LP.irpj.adicional_aliquota;
            csllMensal = baseCSLL * LP.csll.aliquota;
            pisMensal = dados.faturamento * LP.pis;
            cofinsMensal = dados.faturamento * LP.cofins;
        }

        const cpp = dados.folha * IF.INSS.patronal.total_estimado.medio;

        const aliqICMS = dados.cestaBas ? (estado?.icms?.cesta_basica || 0.07) : (estado?.icms?.padrao || 0.18);
        const icms = dados.cnaeCategoria !== 'Serviço'
            ? Math.max(0, dados.faturamento * aliqICMS - dados.cmv * aliqICMS)
            : 0;
        const iss = dados.cnaeCategoria === 'Serviço' ? dados.faturamento * dados.issAliquota : 0;

        // ═══ SUDAM NÃO SE APLICA AO LUCRO PRESUMIDO ═══
        // Art. 257, IV do RIR/2018 — Incentivo SUDAM é exclusivo do Lucro Real
        const descontoSudam = 0;

        const irpjFinal = irpjMensal + adicionalMensal;
        const totalImpostos = irpjFinal + csllMensal + pisMensal + cofinsMensal + cpp + icms + iss;

        return {
            regime: 'Lucro Presumido',
            elegivel: elegibilidade.elegivel,
            impostos: {
                irpj: irpjFinal,
                irpjNormal: irpjMensal,
                irpjBruto: irpjMensal + adicionalMensal,
                adicionalIRPJ: adicionalMensal,
                descontoSudam: 0,
                csll: csllMensal,
                pis: pisMensal,
                cofins: cofinsMensal,
                cpp,
                icms,
                iss,
            },
            presuncaoIRPJ: presIRPJ,
            presuncaoCSLL: presCSLL,
            atividadeId,
            atividadeMotor,
            totalImpostos,
            // Dados do motor para a aba dedicada
            motorTrimestral: resultadoTrimestral,
            motorAnual: resultadoAnual,
            motorPISCOFINS: pisCofinsmensal,
            analiseVD,
            elegibilidade,
            alertas: gerarAlertasPresumido(dados, regras, elegibilidade, analiseVD),
        };
    }

    function gerarAlertasPresumido(dados, regras, elegibilidade, analiseVD) {
        const alertas = [];

        // ═══ ALERTA CRÍTICO: SUDAM NÃO APLICA ═══
        if (dados.sudam) {
            alertas.push({
                tipo: 'warn',
                msg: '⚠️ SUDAM/SUDENE NÃO se aplica ao Lucro Presumido (Art. 257, IV RIR/2018). Incentivo exclusivo do Lucro Real. Avalie migrar para Lucro Real para aproveitar 75% de redução no IRPJ.'
            });
        }

        // Impedimentos
        if (elegibilidade && !elegibilidade.elegivel) {
            elegibilidade.impedimentos.forEach(imp => {
                alertas.push({
                    tipo: 'error',
                    msg: `IMPEDIMENTO: ${imp.descricao} (${imp.baseLegal})`
                });
            });
        }

        // Alertas de elegibilidade
        if (elegibilidade?.alertas) {
            elegibilidade.alertas.forEach(a => {
                alertas.push({ tipo: a.tipo === 'atencao' ? 'warn' : 'info', msg: a.mensagem });
            });
        }

        // Margem vs presunção
        const margem = dados.margem;
        const presuncao = regras.presuncaoIRPJ || 0.32;
        if (margem < presuncao) {
            alertas.push({
                tipo: 'warn',
                msg: `Margem real (${(margem * 100).toFixed(1)}%) é INFERIOR à presunção (${(presuncao * 100).toFixed(1)}%). Você paga imposto sobre lucro que não existe. Avalie o Lucro Real.`
            });
        }

        // Rendimentos financeiros esquecidos
        if (dados.rendimentosFinancLP === 0 && dados.faturamento > 100000) {
            alertas.push({
                tipo: 'info',
                msg: 'Rendimentos financeiros (aplicações, juros) devem ser adicionados 100% à base. Risco fiscal alto se esquecidos.'
            });
        }

        // Presunções especiais
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
        const LR_IF = IF.LUCRO_REAL;
        const LR_MAP = window.LucroRealMap; // dados do lucro-real-mapeamento.js
        const RBT12 = dados.faturamento * 12;
        const lucroMensal = dados.faturamento * dados.margem;
        const lucroAnual = lucroMensal * 12;
        const numMeses = 12;

        // ═══ 1. COMPENSAÇÃO DE PREJUÍZO FISCAL (Art. 580-590) ═══
        const lucroAntesComp = lucroAnual;
        const limiteComp30 = Math.max(lucroAntesComp, 0) * 0.30;
        const compensacaoPrejuizo = Math.min(limiteComp30, dados.prejuizoFiscal, Math.max(lucroAntesComp, 0));
        const lucroAposComp = Math.max(lucroAntesComp - compensacaoPrejuizo, 0);
        const economiaPrejuizo = compensacaoPrejuizo * 0.34; // IRPJ+CSLL evitados

        // ═══ 2. JCP — Juros sobre Capital Próprio ═══
        let jcpDedutivel = 0, economiaJCP = 0, custoIRRFJCP = 0, economiaLiquidaJCP = 0;
        if (dados.patrimonioLiquido > 0) {
            const maxTJLP = dados.patrimonioLiquido * dados.tjlp;
            const lim50LL = lucroAnual * 0.50;
            const lim50Reservas = dados.lucrosAcumulados > 0 ? dados.lucrosAcumulados * 0.50 : Infinity;
            jcpDedutivel = Math.max(0, Math.min(maxTJLP, lim50LL, lim50Reservas));
            const economiaIRPJJCP = jcpDedutivel * 0.25;
            const economiaCSLLJCP = jcpDedutivel * 0.09;
            custoIRRFJCP = jcpDedutivel * 0.15;
            economiaJCP = economiaIRPJJCP + economiaCSLLJCP;
            economiaLiquidaJCP = economiaJCP - custoIRRFJCP;
        }

        // Lucro tributável após JCP
        const lucroTributavel = Math.max(lucroAposComp - jcpDedutivel, 0);
        const lucroMensalTrib = lucroTributavel / 12;

        // ═══ 3. IRPJ (15% + 10% adicional) ═══
        const irpjNormal = lucroMensalTrib * LR_IF.irpj.aliquota;
        const adicionalIRPJ = Math.max(0, lucroMensalTrib - LR_IF.irpj.adicional_limite_mensal) * LR_IF.irpj.adicional_aliquota;

        // ═══ 4. SUDAM — Redução 75% via Lucro da Exploração ═══
        let descontoSudam = 0;
        let lucroExploracao = 0;
        let irpjSobreExploracao = 0;
        if (dados.sudam) {
            // Lucro da Exploração simplificado (sem rec. financeiras para calc. mensal)
            lucroExploracao = lucroMensalTrib;
            irpjSobreExploracao = lucroExploracao * LR_IF.irpj.aliquota;
            descontoSudam = irpjSobreExploracao * 0.75;
        }

        // ═══ 5. CSLL (9%) ═══
        // Compensação base negativa CSLL
        const baseCSLLAntes = lucroTributavel;
        const limiteCompCSLL = Math.max(baseCSLLAntes, 0) * 0.30;
        const compensacaoCSLL = Math.min(limiteCompCSLL, dados.baseNegativaCSLL, Math.max(baseCSLLAntes, 0));
        const baseCSLLFinal = Math.max(baseCSLLAntes - compensacaoCSLL, 0);
        const csll = (baseCSLLFinal / 12) * LR_IF.csll.aliquota_geral;

        // ═══ 6. PIS/COFINS NÃO-CUMULATIVO COM CRÉDITOS REAIS ═══
        // Base de créditos: dados explícitos OU estimativa (CMV + 60% despesas)
        const baseCreditoExplicita = dados.creditosPISCOFINS > 0;
        let baseCreditoPC = baseCreditoExplicita
            ? dados.creditosPISCOFINS
            : dados.cmv + (dados.despesas * 0.60);

        // Crédito adicional: depreciação de ativos (mensal)
        if (dados.investimentoAtivos > 0) {
            // Depreciação acelerada SUDAM: 100% no ano. Normal: ~20%/ano
            const taxaDeprec = dados.sudam ? 1.0 : 0.20;
            const deprecMensal = (dados.investimentoAtivos * taxaDeprec) / 12;
            baseCreditoPC += deprecMensal;
        }

        const pisBruto = dados.faturamento * LR_IF.pis;
        const cofinsBruto = dados.faturamento * LR_IF.cofins;
        const pisCredito = baseCreditoPC * LR_IF.pis;
        const cofinsCredito = baseCreditoPC * LR_IF.cofins;
        const pis = Math.max(0, pisBruto - pisCredito);
        const cofins = Math.max(0, cofinsBruto - cofinsCredito);
        const creditoPISCOFINStotal = pisCredito + cofinsCredito;
        const aliquotaEfetivaPISCOFINS = dados.faturamento > 0
            ? (pis + cofins) / dados.faturamento : 0;

        // ═══ 7. CPP/INSS ═══
        const cpp = dados.folha * IF.INSS.patronal.total_estimado.medio;

        // ═══ 8. ICMS / ISS ═══
        const aliqICMS = dados.cestaBas ? (estado?.icms?.cesta_basica || 0.07) : (estado?.icms?.padrao || 0.18);
        const icms = dados.cnaeCategoria !== 'Serviço'
            ? Math.max(0, dados.faturamento * aliqICMS - dados.cmv * aliqICMS)
            : 0;
        const iss = dados.cnaeCategoria === 'Serviço' ? dados.faturamento * dados.issAliquota : 0;

        // ═══ 9. RETENÇÕES NA FONTE (compensáveis no LR) ═══
        const fatOrgPublico = dados.faturamento * dados.pctOrgaoPublico;
        const retencaoIRRF = fatOrgPublico * 0.048;
        const retencaoCSRF = fatOrgPublico * 0.0465;
        const retencaoTotal = retencaoIRRF + retencaoCSRF;
        // No Lucro Real: 100% compensável como antecipação

        // ═══ 10. DEPRECIAÇÃO ACELERADA (economia IRPJ+CSLL) ═══
        let economiaDepreciacao = 0;
        if (dados.investimentoAtivos > 0 && dados.sudam) {
            // 100% no ano → deduz do lucro
            economiaDepreciacao = (dados.investimentoAtivos / 12) * 0.34; // 34% IRPJ+CSLL
        }

        // ═══ TOTAIS ═══
        const irpjFinal = Math.max(0, irpjNormal + adicionalIRPJ - descontoSudam);
        const totalImpostos = irpjFinal + csll + pis + cofins + cpp + icms + iss;
        const obrigatorio = RBT12 > 78000000;

        // ═══ VANTAGENS DO LUCRO REAL (anualizadas para comparação) ═══
        const economiaCreditosPISCOFINS = creditoPISCOFINStotal * 12;
        const economiaSUDAMAnual = descontoSudam * 12;
        const economiaJCPAnual = economiaLiquidaJCP;
        const economiaPrejuizoAnual = economiaPrejuizo;
        const economiaDeprecAnual = economiaDepreciacao * 12;
        const economiaRetencoesAnual = retencaoTotal * 12; // fluxo de caixa
        const custoContabilAnual = dados.custoContabilLR * 12;

        const totalEconomiasBrutas = economiaCreditosPISCOFINS + economiaSUDAMAnual +
            economiaJCPAnual + economiaPrejuizoAnual + economiaDeprecAnual;
        const economiaLiquida = totalEconomiasBrutas - custoContabilAnual;

        // ═══ SCORE DE ELEGIBILIDADE ═══
        let score = 40; // base
        if (dados.sudam) score += 20;
        if (baseCreditoPC / dados.faturamento > 0.30) score += 15;
        else if (baseCreditoPC / dados.faturamento > 0.15) score += 8;
        if (dados.patrimonioLiquido > 0) score += 8;
        if (dados.prejuizoFiscal > 0) score += 10;
        if (dados.pctOrgaoPublico > 0.3) score += 10;
        else if (dados.pctOrgaoPublico > 0) score += 5;
        if (dados.investimentoAtivos > 0 && dados.sudam) score += 7;
        if (dados.margem < 0.15) score += 10; // margem baixa favorece LR
        else if (dados.margem > 0.35) score -= 10;
        score = Math.max(0, Math.min(100, score));

        return {
            regime: 'Lucro Real',
            elegivel: true,
            obrigatorio,
            impostos: {
                irpj: irpjFinal,
                irpjBruto: irpjNormal + adicionalIRPJ,
                irpjNormal,
                adicionalIRPJ,
                descontoSudam,
                csll,
                pis,
                cofins,
                cpp,
                icms,
                iss,
            },
            creditoPISCOFINS: creditoPISCOFINStotal,
            aliquotaEfetivaPISCOFINS,
            baseCreditoPC,
            baseCreditoExplicita,
            totalImpostos,

            // ═══ DADOS EXPANDIDOS v5.0 ═══
            lucroReal: {
                lucroAnual,
                compensacaoPrejuizo,
                prejuizoRemanescente: Math.max(0, dados.prejuizoFiscal - compensacaoPrejuizo),
                compensacaoCSLL,
                baseNegCSLLRemanescente: Math.max(0, dados.baseNegativaCSLL - compensacaoCSLL),
                lucroTributavel,
                jcpDedutivel,
                economiaJCP,
                economiaLiquidaJCP,
                custoIRRFJCP,
                lucroExploracao,
                irpjSobreExploracao,
                retencaoIRRF,
                retencaoCSRF,
                retencaoTotal,
                economiaDepreciacao,
                investimentoAtivos: dados.investimentoAtivos,
            },
            vantagens: {
                creditosPISCOFINS: economiaCreditosPISCOFINS,
                sudam: economiaSUDAMAnual,
                jcp: economiaJCPAnual,
                prejuizo: economiaPrejuizoAnual,
                depreciacao: economiaDeprecAnual,
                retencoes: economiaRetencoesAnual,
                totalBruto: totalEconomiasBrutas,
                custoContabil: custoContabilAnual,
                economiaLiquida: economiaLiquida,
            },
            score,
            alertas: gerarAlertasReal(dados, RBT12, score),
        };
    }

    function gerarAlertasReal(dados, RBT12, score) {
        const alertas = [];
        if (RBT12 > 78000000) {
            alertas.push({ tipo: 'danger', msg: 'Lucro Real OBRIGATÓRIO: faturamento anual > R$ 78 milhões.' });
        }
        if (dados.sudam && dados.margem >= 0) {
            alertas.push({ tipo: 'danger', msg: 'SUDAM/SUDENE: Lucro Real é OBRIGATÓRIO para usufruir da redução de 75% do IRPJ (Art. 257, IV).' });
        }
        if (dados.margem < 0) {
            alertas.push({ tipo: 'warn', msg: 'Empresa operando no prejuízo. No Lucro Real o imposto é ZERO e o prejuízo fica acumulado para compensar futuramente.' });
        }
        if (dados.sudam) {
            alertas.push({ tipo: 'info', msg: 'SUDAM: 75% de desconto no IRPJ aplicado sobre o Lucro da Exploração.' });
        }
        if (dados.prejuizoFiscal > 0) {
            const comp30 = Math.min(dados.prejuizoFiscal, Math.max(dados.faturamento * dados.margem * 12, 0) * 0.30);
            alertas.push({ tipo: 'info', msg: `Compensação de prejuízo: ${formatBRL(comp30)} deduzido do lucro tributável (limite 30%).` });
        }
        if (dados.patrimonioLiquido > 0) {
            alertas.push({ tipo: 'info', msg: `JCP dedutível estimado: ${formatBRL(Math.min(dados.patrimonioLiquido * dados.tjlp, dados.faturamento * dados.margem * 6))}/ano — reduz base IRPJ+CSLL em 34%.` });
        }
        const baseCred = dados.creditosPISCOFINS > 0 ? dados.creditosPISCOFINS : dados.cmv + dados.despesas * 0.6;
        alertas.push({ tipo: 'info', msg: `Créditos PIS/COFINS estimados: ${formatBRL(baseCred * (IF.LUCRO_REAL.pis + IF.LUCRO_REAL.cofins))}/mês. Alíquota efetiva: ${formatPct(dados.faturamento > 0 ? Math.max(0, (dados.faturamento * 0.0925 - baseCred * 0.0925)) / dados.faturamento : 0)}.` });
        if (dados.pctOrgaoPublico > 0) {
            alertas.push({ tipo: 'info', msg: `Retenções órgãos públicos: ${formatBRL(dados.faturamento * dados.pctOrgaoPublico * 0.0945)}/mês (100% compensável no Lucro Real).` });
        }
        if (score >= 70) {
            alertas.push({ tipo: 'info', msg: `Score de elegibilidade: ${score}/100 — Lucro Real é ALTAMENTE recomendado para sua empresa.` });
        }
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
        const dados = coletarInputs();
        if (dados.faturamento <= 0) return;

        // Validações
        const alertasValidacao = validarDados(dados);
        const errosCriticos = alertasValidacao.filter(a => a.tipo === 'error');
        if (errosCriticos.length > 0) {
            alert('Erros encontrados:\n\n' + errosCriticos.map(a => '• ' + a.msg).join('\n'));
            return;
        }

        const regras = regrasCNAE || CM.obterRegrasCNAE(dados.cnaeCodigo, dados.cnaeCategoria);
        const estado = dados.uf && ES[dados.uf] ? ES[dados.uf] : null;

        const simples = calcularSimples(dados, regras, estado);
        const presumido = calcularPresumido(dados, regras, estado);
        const real = calcularReal(dados, regras, estado);

        const regimesArr = [simples, presumido, real];
        const pessoalArr = calcularImpactoPessoal(dados, regimesArr);
        const ranking = ranquear(regimesArr, pessoalArr);

        // Armazenar para exportação
        ultimoRanking = ranking;
        ultimosDados = dados;

        // Render all tabs
        renderTabTributaria(ranking, dados, regras, alertasValidacao);
        renderTabSimplesNacional(ranking, dados, regras);
        renderTabLucroPresumido(ranking, dados, regras);
        renderTabLucroReal(ranking, dados, regras);
        renderTabTEA(ranking, dados);
        renderTabPessoal(ranking, dados);
        renderTabProjecoes(ranking, dados, regras, estado);

        // Habilitar botões de exportação
        $('btnPDF').disabled = false;
        $('btnExcel').disabled = false;

        // Show results
        $('formArea').style.display = 'none';
        $('resultArea').style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Salvar no histórico
        salvarHistorico(dados, ranking);
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

        // ═══ PAINEL "NO SEU BOLSO" — v5.1 ═══
        html += '<div class="bolso-comparison">';
        html += '<h4 style="font-size:1rem;font-weight:700;margin-bottom:16px;text-align:center;">💰 O Que Fica No Seu Bolso (Mensal)</h4>';

        // Alerta global: folha > pró-labore mas 0 funcionários
        if (dados.funcionarios === 0 && dados.folha > dados.proLaboreTotal && dados.proLaboreTotal > 0) {
            const folhaDiferenca = dados.folha - dados.proLaboreTotal;
            html += `<div style="background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.3);border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:0.8rem;color:var(--amber);">
                ⚠️ <strong>Atenção:</strong> Folha de pagamento (${formatBRL(dados.folha)}) excede o pró-labore (${formatBRL(dados.proLaboreTotal)}) em ${formatBRL(folhaDiferenca)}, mas você informou 0 funcionários. Essa diferença distorce o Fator R do Simples e pode gerar inconsistência fiscal. Ajuste a folha ou informe o nº de funcionários.
            </div>`;
        }

        html += '<div class="regime-cards">';
        ranking.forEach((r, i) => {
            const caixaEmpresa = dados.faturamento - r.totalImpostos - dados.folha - dados.cmv - dados.despesas;
            const colors = ['var(--accent)', 'var(--blue)', 'var(--purple)'];
            const best = i === 0;
            const p = r.pessoal;
            const proLaboreLiqTotal = p.detalhesSocios.reduce((s, d) => s + d.proLabore.liquido, 0);
            const dividendosLiqTotal = p.detalhesSocios.reduce((s, d) => s + d.dividendos.liquido, 0);
            const irpfmTotal = p.detalhesSocios.reduce((s, d) => s + d.irpfm, 0);
            const totalBolsoSocios = p.totalBolsoTodosSocios;

            html += `
            <div class="regime-card pos-${i + 1}" style="text-align:center;">
                <div class="regime-name">${r.regime}</div>
                <div style="margin:12px 0;">
                    <div style="font-size:0.78rem;color:var(--text-muted);">Faturamento</div>
                    <div style="font-size:0.95rem;">${formatBRL(dados.faturamento)}</div>
                </div>
                <div style="margin:4px 0;">
                    <div style="font-size:0.78rem;color:var(--red);">(-) Impostos PJ</div>
                    <div style="font-size:0.95rem;color:var(--red);">-${formatBRL(r.totalImpostos)}</div>
                </div>
                <div style="margin:4px 0;">
                    <div style="font-size:0.78rem;color:var(--text-muted);">(-) Folha + CMV + Desp.</div>
                    <div style="font-size:0.95rem;">-${formatBRL(dados.folha + dados.cmv + dados.despesas)}</div>
                </div>
                <div style="margin:8px 0;padding:8px 0;border-top:1px dashed var(--border-base);">
                    <div style="font-size:0.78rem;color:${caixaEmpresa < 0 ? 'var(--red)' : 'var(--text-muted)'};">= Caixa da Empresa</div>
                    <div style="font-size:0.95rem;color:${caixaEmpresa < 0 ? 'var(--red)' : 'var(--text-primary)'};">${caixaEmpresa < 0 ? '-' : ''}${formatBRL(Math.abs(caixaEmpresa))}</div>
                    ${caixaEmpresa <= 0 ? '<div style="font-size:0.7rem;color:var(--amber);margin-top:2px;">⚠ Custos consomem o faturamento</div>' : ''}
                </div>
                <div style="margin:4px 0;font-size:0.78rem;color:var(--text-muted);">
                    <div style="display:flex;justify-content:space-between;padding:2px 8px;">
                        <span>Pró-labore líq. sócios</span><span>${formatBRL(proLaboreLiqTotal)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:2px 8px;">
                        <span>Dividendos líquidos</span><span>${formatBRL(dividendosLiqTotal)}</span>
                    </div>
                    ${irpfmTotal > 0 ? `<div style="display:flex;justify-content:space-between;padding:2px 8px;color:var(--red);">
                        <span>(-) IRPFM</span><span>-${formatBRL(irpfmTotal)}</span>
                    </div>` : ''}
                </div>
                <div style="margin-top:10px;padding-top:10px;border-top:2px solid ${colors[i]};">
                    <div style="font-size:0.82rem;font-weight:600;color:${colors[i]};">= TOTAL NO BOLSO DOS SÓCIOS</div>
                    <div style="font-size:1.3rem;font-weight:800;color:${best ? 'var(--accent-bright)' : 'var(--text-primary)'};">${formatBRL(totalBolsoSocios)}</div>
                    ${best ? '<div style="font-size:0.75rem;color:var(--accent);margin-top:4px;">✅ MAIS VANTAJOSO</div>' : ''}
                </div>
            </div>`;
        });
        html += '</div>';

        // Nota explicativa se valores idênticos
        const bolsoValues = ranking.map(r => r.pessoal.totalBolsoTodosSocios);
        const allEqual = bolsoValues.every(v => Math.abs(v - bolsoValues[0]) < 1);
        if (allEqual && ranking.length > 1) {
            html += `<div style="background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.2);border-radius:8px;padding:10px 14px;margin-top:12px;font-size:0.78rem;color:var(--text-secondary);">
                ℹ️ <strong>Valores idênticos nos ${ranking.length} regimes:</strong> Como seus custos (${formatBRL(dados.folha + dados.cmv + dados.despesas)}) consomem praticamente todo o faturamento, não sobra lucro para dividendos em nenhum regime. O "Total no bolso" reflete apenas o pró-labore líquido dos sócios, que é independente do regime tributário escolhido. A diferença entre os regimes aparecerá quando a empresa gerar lucro.
            </div>`;
        }

        html += '</div>';

        // ═══ PAINEL VANTAGENS DO LUCRO REAL — v5.0 ═══
        const realData = ranking.find(r => r.regime === 'Lucro Real');
        if (realData && realData.vantagens) {
            html += renderVantagensLRResumo(realData, ranking, dados);
        }

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
    //  PAINEL RESUMO VANTAGENS LUCRO REAL — v5.0
    // ═══════════════════════════════════════════════════════════════

    function renderVantagensLRResumo(realData, ranking, dados) {
        const v = realData.vantagens;
        const hasVantagens = v.totalBruto > 0;
        if (!hasVantagens) return '';

        let html = `<div class="lr-vantagens-card">
            <h4>💰 Vantagens Exclusivas do Lucro Real (Anual)</h4>`;

        if (v.creditosPISCOFINS > 0) {
            html += `<div class="lr-item"><span class="lr-label">✅ Créditos PIS/COFINS (alíq. efetiva ${formatPct(realData.aliquotaEfetivaPISCOFINS)} vs 3,65%)</span><span class="lr-value">${formatBRL(v.creditosPISCOFINS)}</span></div>`;
        }
        if (v.sudam > 0) {
            html += `<div class="lr-item"><span class="lr-label">✅ Incentivo SUDAM (-75% IRPJ)</span><span class="lr-value">${formatBRL(v.sudam)}</span></div>`;
        }
        if (v.jcp > 0) {
            html += `<div class="lr-item"><span class="lr-label">✅ JCP Dedutível (economia líquida após IRRF 15%)</span><span class="lr-value">${formatBRL(v.jcp)}</span></div>`;
        }
        if (v.prejuizo > 0) {
            html += `<div class="lr-item"><span class="lr-label">✅ Compensação Prejuízo Fiscal</span><span class="lr-value">${formatBRL(v.prejuizo)}</span></div>`;
        }
        if (v.depreciacao > 0) {
            html += `<div class="lr-item"><span class="lr-label">✅ Depreciação Acelerada (SUDAM 100%)</span><span class="lr-value">${formatBRL(v.depreciacao)}</span></div>`;
        }

        html += `<div class="lr-item lr-total"><span class="lr-label">Economia Bruta Total</span><span class="lr-value">${formatBRL(v.totalBruto)}</span></div>`;

        if (v.custoContabil > 0) {
            html += `<div class="lr-item lr-custo"><span class="lr-label">⚠️ Custo contábil adicional (LALUR, ECD, ECF)</span><span class="lr-value negative">-${formatBRL(v.custoContabil)}</span></div>`;
        }

        html += `<div class="lr-item lr-economia-liq"><span class="lr-label">✅ ECONOMIA LÍQUIDA ANUAL</span><span class="lr-value">${formatBRL(v.economiaLiquida)}</span></div>`;

        // Retenções fluxo de caixa
        if (v.retencoes > 0) {
            html += `<div style="margin-top:10px;padding:8px 12px;background:rgba(37,99,235,0.04);border-radius:6px;font-size:0.82rem;color:var(--text-secondary);">
                ℹ️ <strong>Retenções órgãos públicos:</strong> ${formatBRL(v.retencoes)}/ano retidos nas NFs → 100% compensável no Lucro Real (impacto zero). No Presumido: parcialmente compensável.
            </div>`;
        }

        html += `</div>`;
        return html;
    }

    // ═══════════════════════════════════════════════════════════════
    //  RENDER TAB: SIMPLES NACIONAL DETALHADO — v6.0
    // ═══════════════════════════════════════════════════════════════

    function renderTabSimplesNacional(ranking, dados, regras) {
        const tab = $('tabSimplesNacional');
        if (!tab) return;

        const sn = ranking.find(r => r.regime === 'Simples Nacional');
        if (!sn) {
            tab.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:40px 0;">Simples Nacional não calculado ou não elegível para este cenário.</p>';
            return;
        }

        const motor = typeof SimplesNacional !== 'undefined' ? SimplesNacional : null;
        const dasResult = sn.motorDAS;
        const anual = sn.motorAnual;
        const analise = sn.analiseVD;
        const eleg = sn.elegibilidade;
        const distLucros = sn.motorDistribuicaoLucros || (anual ? anual.distribuicaoLucros : null);
        const fatorRResult = sn.motorFatorR;
        const anexoRes = sn.anexoResult;
        const imp = sn.impostos;
        const RBT12 = dados.faturamento * 12;

        let html = '<h3 style="font-size:1.1rem;font-weight:700;margin-bottom:16px;">Análise Detalhada — Simples Nacional</h3>';

        // ═══ ALERTAS ═══
        if (sn.alertas?.length) {
            html += '<div class="validacao-alertas">';
            sn.alertas.forEach(a => {
                html += `<div class="alert-item ${a.tipo}">${a.msg}</div>`;
            });
            html += '</div>';
        }

        // Alertas do motor (elegibilidade)
        if (eleg?.alertas?.length) {
            html += '<div class="validacao-alertas">';
            eleg.alertas.forEach(a => {
                html += `<div class="alert-item warn">${a.mensagem || a.tipo}</div>`;
            });
            html += '</div>';
        }

        // ═══ CARD DE ELEGIBILIDADE ═══
        const elegColor = eleg?.elegivel !== false ? 'var(--accent)' : 'var(--red)';
        const elegLabel = eleg?.elegivel !== false ? '✅ Elegível' : '❌ Inelegível';
        html += `<div class="info-card" style="border-color:${elegColor}22;">
            <h4 style="color:${elegColor};">${elegLabel} para Simples Nacional</h4>`;
        if (eleg?.impedimentos?.length) {
            eleg.impedimentos.forEach(imp2 => {
                html += `<div style="padding:6px 0;font-size:0.85rem;color:var(--red);">🚫 ${imp2.descricao} <small style="color:var(--text-muted);">(${imp2.baseLegal})</small></div>`;
            });
        } else {
            const classif = eleg?.classificacao || (RBT12 <= 360000 ? 'ME' : 'EPP');
            html += `<div style="font-size:0.85rem;color:var(--text-secondary);">Nenhum impedimento legal identificado. Classificação: <strong>${classif}</strong> (${classif === 'ME' ? 'Microempresa — até R$ 360 mil/ano' : 'Empresa de Pequeno Porte — até R$ 4,8 milhões/ano'}).</div>`;
        }
        html += '</div>';

        // ═══ ENQUADRAMENTO ═══
        html += `<div class="info-card">
            <h4>📋 Enquadramento no Simples Nacional</h4>
            <div class="info-row"><span>CNAE</span><span>${dados.cnaeCodigo || '—'}</span></div>`;
        if (anexoRes && !anexoRes.vedado) {
            html += `<div class="info-row"><span>Atividade</span><span>${anexoRes.descricao || dados.cnaeCategoria}</span></div>
                <div class="info-row"><span>Tipo de Enquadramento</span><span>${anexoRes.tipo === 'fator_r' ? 'Fator R (variável)' : 'Fixo'}</span></div>`;
        }
        html += `<div class="info-row"><span>Anexo Aplicável</span><span style="font-weight:700;color:var(--accent);">Anexo ${sn.anexo}</span></div>
            <div class="info-row"><span>Fator R</span><span style="font-weight:700;${sn.fatorR < 0.28 ? 'color:var(--red);' : 'color:var(--accent);'}">${formatPct(sn.fatorR)}</span></div>`;
        if (fatorRResult) {
            html += `<div style="font-size:0.78rem;color:var(--text-muted);padding:4px 0;">${fatorRResult.observacao}</div>`;
        }
        html += `<div class="info-row"><span>Faixa de Tributação</span><span>${sn.faixa}ª Faixa</span></div>
            <div class="info-row"><span>RBT12 (Receita Bruta 12 meses)</span><span>${formatBRL(RBT12)}</span></div>
            <div class="info-row"><span>Classificação</span><span>${RBT12 <= 360000 ? 'ME — Microempresa' : 'EPP — Empresa de Pequeno Porte'}</span></div>
            <div class="info-row"><span>Alíquota Efetiva</span><span style="font-weight:700;color:var(--accent);">${formatPct(sn.aliqEfetiva)}</span></div>`;
        if (anexoRes?.baseLegal) {
            html += `<div style="font-size:0.78rem;color:var(--text-muted);margin-top:8px;">Base Legal: ${anexoRes.baseLegal}</div>`;
        }
        html += '</div>';

        // ═══ DEMONSTRATIVO DAS MENSAL ═══
        if (dasResult) {
            html += `<div class="info-card">
                <h4>💰 Demonstrativo DAS Mensal</h4>
                <div class="info-row"><span>Receita Bruta Mensal</span><span>${formatBRL(dasResult.receitaBrutaMensal)}</span></div>
                <div class="info-row"><span>RBT12</span><span>${formatBRL(dasResult.rbt12)}</span></div>
                <div class="info-row"><span>Anexo ${dasResult.anexo} — ${dasResult.faixaDescricao || dasResult.faixa + 'ª Faixa'}</span><span></span></div>
                <div style="height:8px;"></div>
                <div class="info-row"><span>Alíquota Nominal</span><span>${dasResult.aliquotaNominalFormatada || formatPct(dasResult.aliquotaNominal)}</span></div>`;
            if (dasResult.faixa > 1) {
                let aliqResult = null;
                try { aliqResult = motor ? motor.calcularAliquotaEfetiva({ rbt12: RBT12, anexo: dasResult.anexo }) : null; } catch(e) {}
                if (aliqResult) {
                    html += `<div class="info-row"><span>(-) Parcela a Deduzir</span><span style="color:var(--accent);">-${formatBRL(aliqResult.parcelaADeduzir)}</span></div>`;
                }
            }
            html += `<div class="info-row"><span>Alíquota Efetiva</span><span style="font-weight:700;color:var(--accent);">${dasResult.aliquotaEfetivaFormatada || formatPct(dasResult.aliquotaEfetiva)}</span></div>
                <div style="height:8px;"></div>
                <div class="info-row total"><span>DAS a Pagar</span><span style="color:var(--red);">${formatBRL(dasResult.dasAPagar)}</span></div>`;
            if (dasResult.issRetidoFonte > 0) {
                html += `<div class="info-row"><span>(-) ISS Retido na Fonte</span><span style="color:var(--accent);">-${formatBRL(dasResult.issRetidoFonte)}</span></div>`;
            }
            if (dasResult.inssPatronalFora > 0) {
                html += `<div class="info-row"><span>(+) INSS Patronal fora do DAS (Anexo IV)</span><span style="color:var(--red);">${formatBRL(dasResult.inssPatronalFora)}</span></div>
                    <div class="info-row total"><span>Total a Pagar (DAS + INSS)</span><span style="color:var(--red);">${formatBRL(dasResult.totalAPagar)}</span></div>`;
            }
            html += '</div>';
        } else {
            // Fallback sem motor
            html += `<div class="info-card">
                <h4>💰 Demonstrativo DAS Mensal</h4>
                <div class="info-row"><span>Receita Bruta Mensal</span><span>${formatBRL(dados.faturamento)}</span></div>
                <div class="info-row"><span>Alíquota Efetiva</span><span style="font-weight:700;color:var(--accent);">${formatPct(sn.aliqEfetiva)}</span></div>
                <div class="info-row total"><span>DAS a Pagar</span><span style="color:var(--red);">${formatBRL(sn.DAS)}</span></div>
                ${sn.cppFora > 0 ? `<div class="info-row"><span>(+) CPP fora do DAS</span><span style="color:var(--red);">${formatBRL(sn.cppFora)}</span></div>` : ''}
                ${sn.icmsForaDAS > 0 ? `<div class="info-row"><span>(+) ICMS fora do DAS</span><span style="color:var(--red);">${formatBRL(sn.icmsForaDAS)}</span></div>` : ''}
                ${sn.issForaDAS > 0 ? `<div class="info-row"><span>(+) ISS fora do DAS</span><span style="color:var(--red);">${formatBRL(sn.issForaDAS)}</span></div>` : ''}
                <div class="info-row total"><span>Total Mensal</span><span style="color:var(--red);">${formatBRL(sn.totalImpostos)}</span></div>
            </div>`;
        }

        // ═══ PARTILHA DE TRIBUTOS NO DAS ═══
        if (dasResult?.partilha) {
            const p = dasResult.partilha;
            const tributos = [
                { nome: 'IRPJ', key: 'irpj' },
                { nome: 'CSLL', key: 'csll' },
                { nome: 'COFINS', key: 'cofins' },
                { nome: 'PIS/PASEP', key: 'pis' },
                { nome: 'CPP', key: 'cpp' },
                { nome: 'ICMS', key: 'icms' },
                { nome: 'ISS', key: 'iss' },
                { nome: 'IPI', key: 'ipi' },
            ];

            html += `<div class="info-card">
                <h4>📊 Partilha de Tributos no DAS</h4>
                <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
                    <thead>
                        <tr style="border-bottom:2px solid var(--border-base);text-align:left;">
                            <th style="padding:8px 6px;">Tributo</th>
                            <th style="padding:8px 6px;text-align:right;">% Partilha</th>
                            <th style="padding:8px 6px;text-align:right;">Valor (R$)</th>
                        </tr>
                    </thead>
                    <tbody>`;
            let totalPartilha = 0;
            tributos.forEach(t => {
                const tribData = p[t.key];
                if (tribData && (tribData.percentual > 0 || tribData.valor > 0)) {
                    totalPartilha += tribData.valor;
                    const isZerado = tribData.valor === 0;
                    html += `<tr style="border-bottom:1px solid var(--border-subtle);">
                        <td style="padding:6px;">${t.nome}${isZerado ? ' <small style="color:var(--text-muted);">(excluído)</small>' : ''}</td>
                        <td style="padding:6px;text-align:right;">${tribData.percentualFormatado || formatPct(tribData.percentual)}</td>
                        <td style="padding:6px;text-align:right;${isZerado ? 'color:var(--text-muted);' : ''}">${formatBRL(tribData.valor)}</td>
                    </tr>`;
                }
            });
            html += `<tr style="border-top:2px solid var(--border-base);font-weight:700;">
                        <td style="padding:8px 6px;">TOTAL DAS</td>
                        <td style="padding:8px 6px;text-align:right;">—</td>
                        <td style="padding:8px 6px;text-align:right;color:var(--red);">${formatBRL(dasResult.dasValor)}</td>
                    </tr>`;
            html += '</tbody></table></div>';

            // Notas especiais na partilha
            if (p.iss?.limitadoA5Porcento) {
                html += `<div style="margin-top:8px;padding:8px;background:rgba(251,191,36,0.08);border-radius:6px;font-size:0.78rem;color:var(--amber);">
                    ⚠️ ISS limitado a 5% — excedente de ${formatBRL(p.iss.excedenteTransferidoIRPJ)} transferido para IRPJ (LC 123/2006, Art. 18, §5º-H).
                </div>`;
            }
            html += '</div>';
        } else {
            // Fallback — partilha sem motor (usar dados do ranking)
            html += `<div class="info-card">
                <h4>📊 Partilha de Tributos no DAS</h4>`;
            const tributosFallback = [
                { nome: 'IRPJ', valor: imp.irpj },
                { nome: 'CSLL', valor: imp.csll },
                { nome: 'COFINS', valor: imp.cofins },
                { nome: 'PIS/PASEP', valor: imp.pis },
                { nome: 'CPP', valor: imp.cpp },
                { nome: 'ICMS', valor: imp.icms },
                { nome: 'ISS', valor: imp.iss },
                { nome: 'IPI', valor: imp.ipi },
            ];
            tributosFallback.forEach(t => {
                if (t.valor > 0) {
                    html += `<div class="info-row"><span>${t.nome}</span><span>${formatBRL(t.valor)}</span></div>`;
                }
            });
            html += `<div class="info-row total"><span>Total DAS</span><span style="color:var(--red);">${formatBRL(sn.DAS)}</span></div>
            </div>`;
        }

        // ═══ ALERTAS ESPECIAIS ═══
        const alertasEspeciais = [];
        if (sn.anexo === 'IV') {
            alertasEspeciais.push({ icon: '🏗️', cor: 'var(--red)', msg: `<strong>Anexo IV:</strong> CPP (INSS Patronal ~20% + RAT) é paga FORA do DAS. Valor estimado: ${formatBRL(sn.cppFora)}/mês.` });
        }
        if (RBT12 > (motor?.SUBLIMITE_ICMS_ISS || 3600000)) {
            alertasEspeciais.push({ icon: '📍', cor: 'var(--amber)', msg: `<strong>Sublimite ultrapassado:</strong> ICMS e ISS devem ser recolhidos POR FORA do DAS, pelo regime normal.` });
        }
        if (sn.mono) {
            alertasEspeciais.push({ icon: '🏭', cor: 'var(--accent)', msg: `<strong>Produto monofásico:</strong> PIS e COFINS excluídos do DAS (tributação concentrada na indústria).` });
        }
        if (sn.fatorR < 0.28 && (sn.anexo === 'V' || sn.anexo === 'III')) {
            alertasEspeciais.push({ icon: '📉', cor: 'var(--amber)', msg: `<strong>Fator R abaixo de 28%:</strong> Tributação pelo Anexo V (alíquotas mais altas). Aumentar a folha de pagamento pode migrar para o Anexo III.` });
        }
        if (dados.st) {
            alertasEspeciais.push({ icon: '🔄', cor: 'var(--text-secondary)', msg: `<strong>Substituição Tributária:</strong> ICMS zerado no DAS — já recolhido na cadeia anterior.` });
        }

        if (alertasEspeciais.length) {
            html += `<div class="info-card" style="border-color:rgba(251,191,36,0.2);">
                <h4>⚠️ Alertas Especiais do Enquadramento</h4>`;
            alertasEspeciais.forEach(a => {
                html += `<div style="padding:8px 0;border-bottom:1px solid var(--border-subtle);font-size:0.85rem;">
                    <span style="margin-right:6px;">${a.icon}</span>
                    <span style="color:${a.cor};">${a.msg}</span>
                </div>`;
            });
            html += '</div>';
        }

        // ═══ CONSOLIDAÇÃO ANUAL ═══
        if (anual) {
            html += `<div class="info-card" style="border-color:rgba(37,99,235,0.15);">
                <h4>📊 Consolidação Anual (12 meses)</h4>
                <div class="info-row"><span>Receita Bruta Anual</span><span>${formatBRL(anual.receitaBrutaAnual)}</span></div>
                <div class="info-row"><span>DAS Total (12 meses)</span><span>${formatBRL(anual.dasAnual)}</span></div>`;
            if (anual.inssPatronalAnualFora > 0) {
                html += `<div class="info-row"><span>(+) INSS Patronal fora do DAS (Anexo IV)</span><span>${formatBRL(anual.inssPatronalAnualFora)}</span></div>`;
            }
            if (anual.fgtsAnual > 0) {
                html += `<div class="info-row"><span>(+) FGTS Anual (8%)</span><span>${formatBRL(anual.fgtsAnual)}</span></div>`;
            }
            html += `<div class="info-row total" style="font-size:1rem;"><span>CARGA TRIBUTÁRIA TOTAL ANUAL</span><span style="color:var(--red);">${formatBRL(anual.cargaTributariaTotal)}</span></div>
                <div class="info-row"><span>Percentual sobre receita</span><span style="font-weight:700;">${anual.percentualCargaFormatado || formatPct(anual.percentualCarga)}</span></div>`;

            // Partilha anual por tributo
            if (anual.partilhaAnual) {
                const pa = anual.partilhaAnual;
                html += '<div style="height:12px;"></div><div style="font-weight:600;font-size:0.85rem;margin-bottom:8px;">Partilha Anual Acumulada:</div>';
                const tribAnual = [
                    { nome: 'IRPJ', valor: pa.irpj },
                    { nome: 'CSLL', valor: pa.csll },
                    { nome: 'COFINS', valor: pa.cofins },
                    { nome: 'PIS', valor: pa.pis },
                    { nome: 'CPP', valor: pa.cpp },
                    { nome: 'ISS', valor: pa.iss },
                    { nome: 'ICMS', valor: pa.icms },
                    { nome: 'IPI', valor: pa.ipi },
                ];
                tribAnual.forEach(t => {
                    if (t.valor > 0) {
                        html += `<div class="info-row"><span>${t.nome}</span><span>${formatBRL(t.valor)}</span></div>`;
                    }
                });
            }
            html += '</div>';
        } else {
            // Fallback sem motor
            const totalAnualEst = sn.totalImpostos * 12;
            html += `<div class="info-card" style="border-color:rgba(37,99,235,0.15);">
                <h4>📊 Consolidação Anual (Estimativa)</h4>
                <div class="info-row"><span>Receita Bruta Anual</span><span>${formatBRL(RBT12)}</span></div>
                <div class="info-row"><span>DAS Total (12 meses)</span><span>${formatBRL(sn.DAS * 12)}</span></div>`;
            if (sn.cppFora > 0) {
                html += `<div class="info-row"><span>(+) CPP fora do DAS (12 meses)</span><span>${formatBRL(sn.cppFora * 12)}</span></div>`;
            }
            if (sn.icmsForaDAS > 0) {
                html += `<div class="info-row"><span>(+) ICMS fora do DAS (12 meses)</span><span>${formatBRL(sn.icmsForaDAS * 12)}</span></div>`;
            }
            if (sn.issForaDAS > 0) {
                html += `<div class="info-row"><span>(+) ISS fora do DAS (12 meses)</span><span>${formatBRL(sn.issForaDAS * 12)}</span></div>`;
            }
            html += `<div class="info-row total" style="font-size:1rem;"><span>CARGA TRIBUTÁRIA TOTAL ANUAL</span><span style="color:var(--red);">${formatBRL(totalAnualEst)}</span></div>
                <div class="info-row"><span>Percentual sobre receita</span><span style="font-weight:700;">${formatPct(totalAnualEst / RBT12)}</span></div>
            </div>`;
        }

        // ═══ DISTRIBUIÇÃO DE LUCROS ISENTOS ═══
        const dl = distLucros;
        if (dl) {
            html += `<div class="info-card" style="border-color:rgba(16,185,129,0.2);">
                <h4>💰 Distribuição de Lucros Isentos de IR (Anual)</h4>
                <div class="info-row"><span>Modalidade</span><span>${dl.modalidadeUtilizada || 'Presunção'}</span></div>
                <div class="info-row"><span>Receita Bruta Anual</span><span>${formatBRL(dl.receitaBrutaAnual)}</span></div>
                <div class="info-row"><span>Percentual de Presunção</span><span>${dl.percentualPresuncaoFormatado || formatPct(dl.percentualPresuncao)}</span></div>
                <div class="info-row"><span>Base Presumida</span><span>${formatBRL(dl.basePresumida)}</span></div>
                <div class="info-row"><span>(-) DAS Anual</span><span style="color:var(--accent);">-${formatBRL(dl.dasAnual)}</span></div>
                <div class="info-row total"><span>Lucro Distribuível (presunção)</span><span style="color:var(--accent);">${formatBRL(dl.lucroDistribuivelPresumido)}</span></div>`;
            if (dl.lucroDistribuivelContabil !== null && dl.lucroDistribuivelContabil !== undefined) {
                html += `<div class="info-row"><span>Lucro distribuível (contábil efetivo)</span><span style="color:var(--accent-bright);">${formatBRL(dl.lucroDistribuivelContabil)}</span></div>
                    <div class="info-row total"><span>Maior valor = distribuível isento</span><span style="color:var(--accent-bright);">${formatBRL(dl.lucroDistribuivelFinal)}</span></div>`;
            }

            // Por sócio
            if (dl.porSocio?.length) {
                html += `<div style="margin-top:12px;">
                    <div style="font-weight:600;font-size:0.85rem;margin-bottom:8px;">Distribuição por Sócio (isenta de IR):</div>`;
                dl.porSocio.forEach(s => {
                    html += `<div class="info-row"><span>${s.nome} (${s.percentualFormatado})</span><span style="color:var(--accent-bright);">${formatBRL(s.valorIsento)}</span></div>`;
                });
                html += '</div>';
            }
            html += `<div style="margin-top:8px;font-size:0.78rem;color:var(--text-muted);">${dl.baseLegal || 'LC 123/2006, Art. 14; RIR/2018, Art. 145'}</div>`;
            html += `<div style="margin-top:8px;padding:8px;background:rgba(16,185,129,0.06);border-radius:6px;font-size:0.78rem;color:var(--accent);">
                💡 Com escrituração contábil completa, é possível distribuir lucros acima da presunção (até o lucro contábil efetivo), sem tributação de IR.
            </div>`;
            html += '</div>';
        }

        // ═══ OBRIGAÇÕES ACESSÓRIAS ═══
        if (motor?.OBRIGACOES_ACESSORIAS) {
            const obrig = motor.OBRIGACOES_ACESSORIAS;
            html += `<div class="info-card">
                <h4>📑 Obrigações Acessórias do Simples Nacional</h4>`;
            obrig.forEach(ob => {
                const opcionalTag = ob.obrigatoria === false ? ' <span style="background:rgba(251,191,36,0.12);color:var(--amber);font-size:0.7rem;padding:1px 6px;border-radius:4px;margin-left:4px;">Opcional</span>' : '';
                html += `<div style="padding:8px 0;border-bottom:1px solid var(--border-base);">
                    <div style="font-weight:600;font-size:0.88rem;">${ob.nome}${opcionalTag}</div>
                    ${ob.descricao ? `<div style="font-size:0.78rem;color:var(--text-muted);">${ob.descricao}</div>` : ''}
                    <div style="font-size:0.78rem;color:var(--text-secondary);margin-top:4px;">
                        Periodicidade: <strong>${ob.periodicidade}</strong> · Prazo: ${ob.prazo}
                    </div>
                    ${ob.observacao ? `<div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">${ob.observacao}</div>` : ''}
                </div>`;
            });
            html += '</div>';
        }

        // ═══ VANTAGENS E DESVANTAGENS ═══
        if (analise) {
            const vantagensAplicaveis = analise.vantagens.filter(v => v.aplicavel !== false);
            const desvantagensAplicaveis = analise.desvantagens.filter(d => d.aplicavel !== false);

            html += `<div class="info-card" style="border-color:rgba(16,185,129,0.15);">
                <h4>✅ Vantagens do Simples Nacional (${vantagensAplicaveis.length} aplicáveis)</h4>`;
            vantagensAplicaveis.forEach(v => {
                const iconImpacto = v.impacto === 'alto' ? '🟢' : v.impacto === 'medio' ? '🟡' : '⚪';
                html += `<div style="padding:6px 0;border-bottom:1px solid var(--border-subtle);">
                    <div style="font-weight:600;font-size:0.85rem;">${iconImpacto} ${v.titulo}</div>
                    <div style="font-size:0.78rem;color:var(--text-muted);">${v.descricao}</div>
                </div>`;
            });
            html += '</div>';

            const desvCriticas = desvantagensAplicaveis.filter(d => d.impacto === 'critico' || d.impacto === 'alto').length;
            html += `<div class="info-card" style="border-color:rgba(239,68,68,0.15);">
                <h4>❌ Desvantagens do Simples Nacional (${desvantagensAplicaveis.length} aplicáveis${desvCriticas > 0 ? `, ${desvCriticas} de alto impacto` : ''})</h4>`;
            desvantagensAplicaveis.forEach(d => {
                const iconImpacto = d.impacto === 'critico' ? '🔴' : d.impacto === 'alto' ? '🟠' : d.impacto === 'medio' ? '🟡' : '⚪';
                html += `<div style="padding:6px 0;border-bottom:1px solid var(--border-subtle);">
                    <div style="font-weight:600;font-size:0.85rem;">${iconImpacto} ${d.titulo}</div>
                    <div style="font-size:0.78rem;color:var(--text-muted);">${d.descricao}</div>
                </div>`;
            });
            html += '</div>';
        }

        // ═══ RISCOS FISCAIS ═══
        if (motor?.RISCOS_FISCAIS) {
            html += `<div class="info-card" style="border-color:rgba(217,119,6,0.2);">
                <h4>⚠️ Riscos Fiscais e Pegadinhas Comuns</h4>`;
            motor.RISCOS_FISCAIS.forEach(risco => {
                const gravIcon = risco.gravidade === 'critica' ? '🔴' : risco.gravidade === 'alta' ? '🟠' : '🟡';
                html += `<details style="padding:8px 0;border-bottom:1px solid var(--border-subtle);">
                    <summary style="cursor:pointer;font-weight:600;font-size:0.85rem;">${gravIcon} [${risco.gravidade.toUpperCase()}] ${risco.titulo}</summary>
                    <div style="padding:8px 0 0 16px;font-size:0.82rem;color:var(--text-secondary);">
                        <p>${risco.descricao}</p>
                        ${risco.consequencia ? `<p style="margin-top:4px;"><strong>Consequência:</strong> ${risco.consequencia}</p>` : ''}
                        <p style="margin-top:4px;color:var(--accent);"><strong>Prevenção:</strong> ${risco.prevencao}</p>
                        ${risco.baseLegal ? `<p style="margin-top:4px;font-size:0.75rem;color:var(--text-muted);">Base Legal: ${risco.baseLegal}</p>` : ''}
                    </div>
                </details>`;
            });
            html += '</div>';
        }

        // ═══ COMPARATIVO vs LUCRO PRESUMIDO ═══
        const presData = ranking.find(r => r.regime === 'Lucro Presumido');
        if (presData) {
            const diffMensal = sn.totalImpostos - presData.totalImpostos;
            const diffAnual = diffMensal * 12;
            const snVantajoso = diffMensal < 0;

            html += `<div class="breakeven-card">
                <h5>📊 Comparativo: Simples Nacional vs Lucro Presumido</h5>
                <div class="info-row"><span>Simples Nacional (mensal)</span><span>${formatBRL(sn.totalImpostos)}</span></div>
                <div class="info-row"><span>Lucro Presumido (mensal)</span><span>${formatBRL(presData.totalImpostos)}</span></div>
                <div class="info-row total"><span>Diferença anual</span><span style="color:${snVantajoso ? 'var(--accent)' : 'var(--red)'};">${snVantajoso ? 'Economia' : 'Custo adicional'}: ${formatBRL(Math.abs(diffAnual))}/ano</span></div>`;

            // Incluir Lucro Real se disponível
            const realData = ranking.find(r => r.regime === 'Lucro Real');
            if (realData) {
                const diffRealAnual = (sn.totalImpostos - realData.totalImpostos) * 12;
                const snVsRealVantajoso = diffRealAnual < 0;
                html += `<div style="height:8px;"></div>
                    <div class="info-row"><span>Lucro Real (mensal)</span><span>${formatBRL(realData.totalImpostos)}</span></div>
                    <div class="info-row total"><span>SN vs Lucro Real (anual)</span><span style="color:${snVsRealVantajoso ? 'var(--accent)' : 'var(--red)'};">${snVsRealVantajoso ? 'Economia' : 'Custo adicional'}: ${formatBRL(Math.abs(diffRealAnual))}/ano</span></div>`;
            }

            html += `<div style="margin-top:10px;font-size:0.85rem;color:var(--text-secondary);">
                ${snVantajoso
                    ? 'O Simples Nacional é mais barato neste cenário. A guia única e menor complexidade contábil são vantagens adicionais.'
                    : 'Outro regime tributário é mais barato. Considere avaliar a migração levando em conta: custo contábil, complexidade e obrigações acessórias adicionais.'
                }
            </div>
            </div>`;
        }

        // ═══ COMPARATIVO DO MOTOR (se disponível) ═══
        if (sn.motorComparativo?.regimes?.length) {
            const comp = sn.motorComparativo;
            html += `<div class="info-card" style="border-color:rgba(37,99,235,0.15);">
                <h4>🔬 Comparativo Completo (Motor Simples Nacional)</h4>`;
            if (comp.recomendacao) {
                html += `<div style="padding:10px;margin-bottom:12px;background:rgba(16,185,129,0.06);border-radius:8px;font-size:0.88rem;font-weight:600;color:var(--accent);">
                    🏆 ${comp.recomendacao}
                </div>`;
            }
            html += `<div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;font-size:0.82rem;">
                    <thead>
                        <tr style="border-bottom:2px solid var(--border-base);text-align:left;">
                            <th style="padding:8px 6px;">Regime</th>
                            <th style="padding:8px 6px;text-align:right;">Carga Total</th>
                            <th style="padding:8px 6px;text-align:right;">% s/ Receita</th>
                            <th style="padding:8px 6px;text-align:right;">Lucro Distribuível</th>
                        </tr>
                    </thead>
                    <tbody>`;
            comp.regimes.forEach(reg => {
                const isMelhor = reg.regime === comp.melhorRegime;
                html += `<tr style="border-bottom:1px solid var(--border-subtle);${isMelhor ? 'background:rgba(16,185,129,0.06);font-weight:600;' : ''}">
                    <td style="padding:6px;">${isMelhor ? '🏆 ' : ''}${reg.regime}${reg.anexo ? ` (${reg.anexo})` : ''}</td>
                    <td style="padding:6px;text-align:right;${isMelhor ? 'color:var(--accent);' : ''}">${formatBRL(reg.cargaTotal)}</td>
                    <td style="padding:6px;text-align:right;">${reg.percentualCargaFormatado}</td>
                    <td style="padding:6px;text-align:right;">${formatBRL(reg.lucroDistribuivel || 0)}</td>
                </tr>`;
            });
            html += '</tbody></table></div></div>';
        }

        tab.innerHTML = html;
    }

    // ═══════════════════════════════════════════════════════════════
    //  RENDER TAB: LUCRO PRESUMIDO DETALHADO — v6.0
    // ═══════════════════════════════════════════════════════════════

    function renderTabLucroPresumido(ranking, dados, regras) {
        const tab = $('tabLucroPresumido');
        if (!tab) return;

        const pres = ranking.find(r => r.regime === 'Lucro Presumido');
        if (!pres) {
            tab.innerHTML = '<p style="text-align:center;color:var(--text-muted);">Lucro Presumido não calculado.</p>';
            return;
        }

        const motor = typeof LucroPresumido !== 'undefined' ? LucroPresumido : null;
        const trim = pres.motorTrimestral;
        const anual = pres.motorAnual;
        const pisCof = pres.motorPISCOFINS;
        const analise = pres.analiseVD;
        const eleg = pres.elegibilidade;
        const imp = pres.impostos;

        let html = '<h3 style="font-size:1.1rem;font-weight:700;margin-bottom:16px;">Análise Detalhada — Lucro Presumido</h3>';

        // ═══ ALERTAS ═══
        if (pres.alertas?.length) {
            html += '<div class="validacao-alertas">';
            pres.alertas.forEach(a => {
                html += `<div class="alert-item ${a.tipo}">${a.msg}</div>`;
            });
            html += '</div>';
        }

        // ═══ CARD DE ELEGIBILIDADE ═══
        const elegColor = eleg?.elegivel ? 'var(--accent)' : 'var(--red)';
        const elegLabel = eleg?.elegivel ? '✅ Elegível' : '❌ Inelegível';
        html += `<div class="info-card" style="border-color:${elegColor}22;">
            <h4 style="color:${elegColor};">${elegLabel} para Lucro Presumido</h4>`;
        if (eleg?.impedimentos?.length) {
            eleg.impedimentos.forEach(imp2 => {
                html += `<div style="padding:6px 0;font-size:0.85rem;color:var(--red);">🚫 ${imp2.descricao} <small style="color:var(--text-muted);">(${imp2.baseLegal})</small></div>`;
            });
        } else {
            html += `<div style="font-size:0.85rem;color:var(--text-secondary);">Nenhum impedimento legal identificado. Limite de receita: R$ 78 milhões/ano.</div>`;
        }
        html += '</div>';

        // ═══ PRESUNÇÃO APLICADA ═══
        html += `<div class="info-card">
            <h4>Percentuais de Presunção Aplicados</h4>
            <div class="info-row"><span>Atividade</span><span>${pres.atividadeMotor?.descricao || regras.descricao || dados.cnaeCategoria}</span></div>
            <div class="info-row"><span>CNAE</span><span>${dados.cnaeCodigo || '—'}</span></div>
            <div class="info-row"><span>Presunção IRPJ</span><span style="font-weight:700;color:var(--accent);">${formatPct(pres.presuncaoIRPJ)}</span></div>
            <div class="info-row"><span>Presunção CSLL</span><span style="font-weight:700;">${formatPct(pres.presuncaoCSLL)}</span></div>
            ${pres.atividadeMotor?.baseLegal ? `<div style="font-size:0.78rem;color:var(--text-muted);margin-top:8px;">Base Legal: ${pres.atividadeMotor.baseLegal}</div>` : ''}
        </div>`;

        // ═══ DEMONSTRATIVO TRIMESTRAL ═══
        if (trim) {
            const r = trim.resumo;
            html += `<div class="info-card">
                <h4>Demonstrativo IRPJ + CSLL (Trimestral)</h4>
                <div class="info-row"><span>Receita Bruta do Trimestre</span><span>${formatBRL(r.receitaBrutaTotal)}</span></div>`;
            if (r.deducoesDaReceita > 0) {
                html += `<div class="info-row"><span>(-) Deduções (devoluções, desc. incondicionais)</span><span style="color:var(--accent);">-${formatBRL(r.deducoesDaReceita)}</span></div>`;
            }
            html += `<div class="info-row"><span>(=) Receita Bruta Ajustada</span><span>${formatBRL(r.receitaBrutaAjustada)}</span></div>
                <div style="height:12px;"></div>
                <div class="info-row"><span>Base Presumida IRPJ (${formatPct(pres.presuncaoIRPJ)})</span><span>${formatBRL(r.basePresumidaIRPJ)}</span></div>`;
            if (r.adicoesObrigatorias > 0) {
                html += `<div class="info-row"><span>(+) Adições obrigatórias (ganhos capital, rend. financeiros)</span><span>${formatBRL(r.adicoesObrigatorias)}</span></div>`;
            }
            html += `<div class="info-row total"><span>Base de Cálculo IRPJ</span><span>${formatBRL(r.baseCalculoIRPJ)}</span></div>
                <div style="height:8px;"></div>
                <div class="info-row"><span>IRPJ Normal (15%)</span><span>${formatBRL(r.irpjNormal)}</span></div>
                <div class="info-row"><span>IRPJ Adicional (10% s/ excedente R$ 60k)</span><span>${formatBRL(r.irpjAdicional)}</span></div>`;
            if (r.irrfRetidoFonte > 0) {
                html += `<div class="info-row"><span>(-) IRRF retido na fonte</span><span style="color:var(--accent);">-${formatBRL(r.irrfRetidoFonte)}</span></div>`;
            }
            html += `<div class="info-row total"><span>IRPJ Devido</span><span style="color:var(--red);">${formatBRL(r.irpjDevido)}</span></div>
                <div style="height:12px;"></div>
                <div class="info-row"><span>Base Presumida CSLL (${formatPct(pres.presuncaoCSLL)})</span><span>${formatBRL(r.basePresumidaCSLL)}</span></div>
                <div class="info-row"><span>CSLL Bruta (9%)</span><span>${formatBRL(r.csllBruta)}</span></div>`;
            if (r.csllRetidaFonte > 0) {
                html += `<div class="info-row"><span>(-) CSLL retida na fonte</span><span style="color:var(--accent);">-${formatBRL(r.csllRetidaFonte)}</span></div>`;
            }
            html += `<div class="info-row total"><span>CSLL Devida</span><span style="color:var(--red);">${formatBRL(r.csllDevida)}</span></div>
                <div style="height:12px;"></div>
                <div class="info-row" style="font-weight:700;font-size:0.95rem;"><span>Total IRPJ + CSLL (Trimestral)</span><span style="color:var(--red);">${formatBRL(r.totalIRPJCSLL)}</span></div>
                <div class="info-row"><span>Alíquota Efetiva s/ Receita</span><span>${r.aliquotaEfetivaReceita}</span></div>
            </div>`;

            // ═══ QUOTAS DE PARCELAMENTO ═══
            if (trim.parcelamento) {
                const parc = trim.parcelamento;
                html += `<div class="info-card">
                    <h4>Quotas de Parcelamento Trimestral</h4>
                    <div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:10px;">${parc.observacao}</div>`;
                if (parc.irpj?.length) {
                    html += '<div style="font-weight:600;font-size:0.85rem;margin-bottom:6px;">IRPJ (DARF 2089):</div>';
                    parc.irpj.forEach(q => {
                        html += `<div class="info-row"><span>${q.quota}ª Quota</span><span>${formatBRL(q.valor)}</span></div>`;
                    });
                }
                if (parc.csll?.length) {
                    html += '<div style="font-weight:600;font-size:0.85rem;margin:10px 0 6px;">CSLL (DARF 2372):</div>';
                    parc.csll.forEach(q => {
                        html += `<div class="info-row"><span>${q.quota}ª Quota</span><span>${formatBRL(q.valor)}</span></div>`;
                    });
                }
                html += '</div>';
            }
        }

        // ═══ PIS/COFINS MENSAL ═══
        if (pisCof) {
            html += `<div class="info-card">
                <h4>PIS/COFINS — Regime Cumulativo (Mensal)</h4>
                <div class="info-row"><span>Receita Bruta Mensal</span><span>${formatBRL(pisCof.receitaBrutaMensal)}</span></div>`;
            if (pisCof.exclusoes?.total > 0) {
                html += `<div class="info-row"><span>(-) Exclusões</span><span>-${formatBRL(pisCof.exclusoes.total)}</span></div>`;
            }
            html += `<div class="info-row"><span>Base de Cálculo</span><span>${formatBRL(pisCof.baseCalculo)}</span></div>
                <div style="height:8px;"></div>
                <div class="info-row"><span>PIS (0,65%) — DARF ${pisCof.pis.codigoDARF}</span><span>${formatBRL(pisCof.pis.devido)}</span></div>
                <div class="info-row"><span>COFINS (3,00%) — DARF ${pisCof.cofins.codigoDARF}</span><span>${formatBRL(pisCof.cofins.devida)}</span></div>
                <div class="info-row total"><span>Total PIS + COFINS</span><span style="color:var(--red);">${formatBRL(pisCof.totalPISCOFINS)}</span></div>
                <div style="margin-top:8px;padding:8px;background:rgba(16,185,129,0.06);border-radius:6px;font-size:0.78rem;color:var(--accent);">
                    ✅ Regime cumulativo: alíquota fixa 3,65%. Sem controle de créditos. Mais simples que o não-cumulativo (9,25%) do Lucro Real.
                </div>
            </div>`;
        } else {
            html += `<div class="info-card">
                <h4>PIS/COFINS — Regime Cumulativo (Mensal)</h4>
                <div class="info-row"><span>PIS (0,65%)</span><span>${formatBRL(imp.pis)}</span></div>
                <div class="info-row"><span>COFINS (3,00%)</span><span>${formatBRL(imp.cofins)}</span></div>
                <div class="info-row total"><span>Total PIS + COFINS</span><span style="color:var(--red);">${formatBRL(imp.pis + imp.cofins)}</span></div>
            </div>`;
        }

        // ═══ CONSOLIDAÇÃO ANUAL ═══
        if (anual) {
            const c = anual.consolidacao;
            const t = anual.tributos;
            const dl = anual.distribuicaoLucros;
            html += `<div class="info-card" style="border-color:rgba(37,99,235,0.15);">
                <h4>📊 Consolidação Anual</h4>
                <div class="info-row"><span>IRPJ Total (4 trimestres)</span><span>${formatBRL(t.irpj.anual)}</span></div>
                <div class="info-row"><span>CSLL Total (4 trimestres)</span><span>${formatBRL(t.csll.anual)}</span></div>
                <div class="info-row"><span>PIS Total (12 meses)</span><span>${formatBRL(t.pis.anual)}</span></div>
                <div class="info-row"><span>COFINS Total (12 meses)</span><span>${formatBRL(t.cofins.anual)}</span></div>
                ${c.issAnual > 0 ? `<div class="info-row"><span>ISS Total (${t.iss.aliquota})</span><span>${formatBRL(c.issAnual)}</span></div>` : ''}
                ${c.inssPatronalAnual > 0 ? `<div class="info-row"><span>INSS Patronal (${t.inssPatronal.aliquotaTotal})</span><span>${formatBRL(c.inssPatronalAnual)}</span></div>` : ''}
                <div class="info-row total" style="font-size:1rem;"><span>CARGA TRIBUTÁRIA TOTAL ANUAL</span><span style="color:var(--red);">${formatBRL(c.cargaTributariaTotal)}</span></div>
                <div class="info-row"><span>Percentual sobre receita</span><span>${c.percentualCargaTributaria}</span></div>
            </div>`;

            // ═══ DISTRIBUIÇÃO DE LUCROS ISENTOS ═══
            html += `<div class="info-card" style="border-color:rgba(16,185,129,0.2);">
                <h4>💰 Distribuição de Lucros Isentos de IR (Anual)</h4>
                <div class="info-row"><span>Lucro distribuível (base presumida)</span><span style="color:var(--accent);">${formatBRL(dl.lucroDistribuivelPresumido)}</span></div>`;
            if (dl.lucroDistribuivelContabil !== null && dl.lucroDistribuivelContabil !== undefined) {
                html += `<div class="info-row"><span>Lucro distribuível (contábil efetivo)</span><span style="color:var(--accent-bright);">${formatBRL(dl.lucroDistribuivelContabil)}</span></div>
                    <div class="info-row total"><span>Maior valor = distribuível isento</span><span style="color:var(--accent-bright);">${formatBRL(dl.lucroDistribuivelFinal)}</span></div>`;
            }
            html += `<div style="margin-top:8px;font-size:0.78rem;color:var(--text-muted);">${dl.baseLegal}</div>`;

            // Por sócio
            if (dl.porSocio?.length) {
                html += `<div style="margin-top:12px;">
                    <div style="font-weight:600;font-size:0.85rem;margin-bottom:8px;">Distribuição por Sócio (isenta de IR):</div>`;
                dl.porSocio.forEach(s => {
                    html += `<div class="info-row"><span>${s.nome} (${s.percentualFormatado})</span><span style="color:var(--accent-bright);">${formatBRL(s.valorIsento)}</span></div>`;
                });
                html += '</div>';
            }
            html += '</div>';
        }

        // ═══ CÓDIGOS DARF ═══
        if (motor) {
            const darf = motor.CODIGOS_DARF;
            html += `<div class="info-card">
                <h4>📋 Códigos DARF para Recolhimento</h4>
                <div class="info-row"><span>IRPJ Lucro Presumido</span><span style="font-family:var(--font-mono);font-weight:700;">${darf.IRPJ_PRESUMIDO}</span></div>
                <div class="info-row"><span>CSLL Lucro Presumido</span><span style="font-family:var(--font-mono);font-weight:700;">${darf.CSLL_PRESUMIDO}</span></div>
                <div class="info-row"><span>PIS Cumulativo</span><span style="font-family:var(--font-mono);font-weight:700;">${darf.PIS_CUMULATIVO}</span></div>
                <div class="info-row"><span>COFINS Cumulativo</span><span style="font-family:var(--font-mono);font-weight:700;">${darf.COFINS_CUMULATIVO}</span></div>
                <div style="margin-top:10px;font-size:0.78rem;color:var(--text-muted);">
                    IRPJ/CSLL: Vencimento no último dia útil do mês subsequente ao encerramento do trimestre.<br>
                    PIS/COFINS: Vencimento até o 25º dia do mês subsequente ao fato gerador.
                </div>
            </div>`;
        }

        // ═══ OBRIGAÇÕES ACESSÓRIAS ═══
        if (motor?.OBRIGACOES_ACESSORIAS) {
            const obrig = motor.OBRIGACOES_ACESSORIAS;
            html += `<div class="info-card">
                <h4>📑 Obrigações Acessórias do Lucro Presumido</h4>`;
            Object.entries(obrig).forEach(([key, ob]) => {
                const descTexto = ob.descricao || ob.observacao || ob.baseLegal || '';
                const nomeTexto = ob.nome || key;
                const opcionalTag = ob.obrigatoria === false ? ' <span style="background:rgba(251,191,36,0.12);color:var(--amber);font-size:0.7rem;padding:1px 6px;border-radius:4px;margin-left:4px;">Opcional</span>' : '';
                html += `<div style="padding:8px 0;border-bottom:1px solid var(--border-base);">
                    <div style="font-weight:600;font-size:0.88rem;">${nomeTexto}${opcionalTag}</div>
                    ${descTexto ? `<div style="font-size:0.78rem;color:var(--text-muted);">${descTexto}</div>` : ''}
                    <div style="font-size:0.78rem;color:var(--text-secondary);margin-top:4px;">
                        Periodicidade: <strong>${ob.periodicidade}</strong> · Prazo: ${ob.prazo}
                    </div>
                </div>`;
            });
            html += '</div>';
        }

        // ═══ VANTAGENS E DESVANTAGENS ═══
        if (analise) {
            html += `<div class="info-card" style="border-color:rgba(16,185,129,0.15);">
                <h4>✅ Vantagens do Lucro Presumido (${analise.pontuacao.vantagensAplicaveis} aplicáveis)</h4>`;
            analise.vantagens.forEach(v => {
                const iconImpacto = v.impacto === 'alto' ? '🟢' : v.impacto === 'medio' ? '🟡' : '⚪';
                html += `<div style="padding:6px 0;border-bottom:1px solid var(--border-subtle);">
                    <div style="font-weight:600;font-size:0.85rem;">${iconImpacto} ${v.titulo}</div>
                    <div style="font-size:0.78rem;color:var(--text-muted);">${v.descricao}</div>
                </div>`;
            });
            html += '</div>';

            html += `<div class="info-card" style="border-color:rgba(239,68,68,0.15);">
                <h4>❌ Desvantagens do Lucro Presumido (${analise.pontuacao.desvantagensAplicaveis} aplicáveis${analise.pontuacao.desvantagensCriticas > 0 ? `, ${analise.pontuacao.desvantagensCriticas} CRÍTICAS` : ''})</h4>`;
            analise.desvantagens.forEach(d => {
                const iconImpacto = d.impacto === 'critico' ? '🔴' : d.impacto === 'alto' ? '🟠' : d.impacto === 'medio' ? '🟡' : '⚪';
                html += `<div style="padding:6px 0;border-bottom:1px solid var(--border-subtle);">
                    <div style="font-weight:600;font-size:0.85rem;">${iconImpacto} ${d.titulo}</div>
                    <div style="font-size:0.78rem;color:var(--text-muted);">${d.descricao}</div>
                    ${d.valorImpacto > 0 ? `<div style="font-size:0.78rem;color:var(--red);font-weight:600;">Impacto estimado: ${formatBRL(d.valorImpacto)}/ano</div>` : ''}
                </div>`;
            });
            html += '</div>';

            // ═══ ANÁLISE MARGEM vs PRESUNÇÃO ═══
            const margemAtual = dados.margem;
            const presuncao = pres.presuncaoIRPJ;
            const favoravel = margemAtual > presuncao;

            html += `<div class="info-card">
                <h4>📊 Margem Real vs Presunção</h4>
                <div class="info-row"><span>Sua margem de lucro</span><span style="font-weight:700;color:${favoravel ? 'var(--accent)' : 'var(--red)'};">${formatPct(margemAtual)}</span></div>
                <div class="info-row"><span>Presunção IRPJ</span><span style="font-weight:700;">${formatPct(presuncao)}</span></div>
                <div style="margin-top:10px;padding:10px;border-radius:8px;background:${favoravel ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)'};">
                    <div style="font-size:0.88rem;font-weight:600;color:${favoravel ? 'var(--accent)' : 'var(--red)'};">
                        ${favoravel
                            ? `✅ FAVORÁVEL — Margem real (${formatPct(margemAtual)}) é SUPERIOR à presunção (${formatPct(presuncao)}). Você economiza com o Presumido!`
                            : `⚠️ DESFAVORÁVEL — Margem real (${formatPct(margemAtual)}) é INFERIOR à presunção (${formatPct(presuncao)}). Você paga imposto sobre lucro que não existe. Avalie o Lucro Real.`
                        }
                    </div>
                </div>
            </div>`;
        }

        // ═══ RISCOS FISCAIS ═══
        if (motor?.RISCOS_FISCAIS) {
            html += `<div class="info-card" style="border-color:rgba(217,119,6,0.2);">
                <h4>⚠️ Riscos Fiscais e Pegadinhas Comuns</h4>`;
            motor.RISCOS_FISCAIS.forEach(risco => {
                const gravIcon = risco.gravidade === 'critica' ? '🔴' : risco.gravidade === 'alta' ? '🟠' : '🟡';
                html += `<details style="padding:8px 0;border-bottom:1px solid var(--border-subtle);">
                    <summary style="cursor:pointer;font-weight:600;font-size:0.85rem;">${gravIcon} [${risco.gravidade.toUpperCase()}] ${risco.titulo}</summary>
                    <div style="padding:8px 0 0 16px;font-size:0.82rem;color:var(--text-secondary);">
                        <p>${risco.descricao}</p>
                        ${risco.exemplo ? `<p style="margin-top:4px;"><strong>Exemplo:</strong> ${risco.exemplo}</p>` : ''}
                        <p style="margin-top:4px;color:var(--accent);"><strong>Prevenção:</strong> ${risco.prevencao}</p>
                        ${risco.baseLegal ? `<p style="margin-top:4px;font-size:0.75rem;color:var(--text-muted);">Base Legal: ${risco.baseLegal}</p>` : ''}
                    </div>
                </details>`;
            });
            html += '</div>';
        }

        // ═══ COMPARATIVO vs LUCRO REAL ═══
        const realData = ranking.find(r => r.regime === 'Lucro Real');
        if (realData) {
            const diffMensal = pres.totalImpostos - realData.totalImpostos;
            const diffAnual = diffMensal * 12;
            const presVantajoso = diffMensal < 0;

            html += `<div class="breakeven-card">
                <h5>📊 Comparativo: Lucro Presumido vs Lucro Real</h5>
                <div class="info-row"><span>Presumido (mensal)</span><span>${formatBRL(pres.totalImpostos)}</span></div>
                <div class="info-row"><span>Lucro Real (mensal)</span><span>${formatBRL(realData.totalImpostos)}</span></div>
                <div class="info-row total"><span>Diferença anual</span><span style="color:${presVantajoso ? 'var(--accent)' : 'var(--red)'};">${presVantajoso ? 'Economia' : 'Custo adicional'}: ${formatBRL(Math.abs(diffAnual))}/ano</span></div>
                <div style="margin-top:10px;font-size:0.85rem;color:var(--text-secondary);">
                    ${presVantajoso
                        ? 'O Lucro Presumido é mais barato neste cenário. Porém, se a margem cair abaixo da presunção, o Lucro Real pode compensar.'
                        : 'O Lucro Real é mais barato. Considere migrar para aproveitar: dedução de despesas, créditos PIS/COFINS, compensação de prejuízos' + (dados.sudam ? ', e incentivo SUDAM (75% redução IRPJ).' : '.')
                    }
                </div>
            </div>`;
        }

        tab.innerHTML = html;
    }

    // ═══════════════════════════════════════════════════════════════
    //  RENDER TAB: LUCRO REAL DETALHADO — v5.0
    // ═══════════════════════════════════════════════════════════════

    function renderTabLucroReal(ranking, dados, regras) {
        const tab = $('tabLucroReal');
        if (!tab) return;

        const real = ranking.find(r => r.regime === 'Lucro Real');
        if (!real) {
            tab.innerHTML = '<p style="text-align:center;color:var(--text-muted);">Lucro Real não calculado.</p>';
            return;
        }

        const lr = real.lucroReal;
        const v = real.vantagens;
        const imp = real.impostos;

        let html = '<h3 style="font-size:1.1rem;font-weight:700;margin-bottom:16px;">Análise Detalhada — Lucro Real</h3>';

        // ═══ SCORE DE ELEGIBILIDADE ═══
        const scoreColor = real.score >= 70 ? 'var(--accent)' : real.score >= 50 ? 'var(--amber)' : 'var(--red)';
        const scoreLabel = real.score >= 70 ? 'Altamente Recomendado' : real.score >= 50 ? 'Pode ser Vantajoso' : 'Avaliar com Cautela';
        const scoreMsg = real.score >= 70
            ? 'Sua empresa tem perfil ideal para Lucro Real: incentivos regionais, créditos PIS/COFINS, e/ou patrimônio para JCP.'
            : real.score >= 50
                ? 'O Lucro Real pode ser vantajoso dependendo da gestão dos créditos e incentivos. Consulte um contador especializado.'
                : 'A margem alta e poucos créditos podem tornar o Presumido mais simples. Mas analise as vantagens abaixo.';

        const circumference = 2 * Math.PI * 30;
        const offset = circumference * (1 - real.score / 100);

        html += `<div class="score-container">
            <div class="score-ring">
                <svg width="80" height="80" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="30" fill="none" stroke="var(--border-base)" stroke-width="6"/>
                    <circle cx="40" cy="40" r="30" fill="none" stroke="${scoreColor}" stroke-width="6"
                        stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
                        stroke-linecap="round"/>
                </svg>
                <span class="score-text" style="color:${scoreColor};">${real.score}</span>
            </div>
            <div class="score-details">
                <h5 style="color:${scoreColor};">${scoreLabel}</h5>
                <p>${scoreMsg}</p>
            </div>
        </div>`;

        // ═══ DEMONSTRATIVO IRPJ ═══
        html += `<div class="info-card">
            <h4>Demonstrativo IRPJ</h4>
            <div class="info-row"><span>Lucro contábil anual</span><span>${formatBRL(lr.lucroAnual)}</span></div>`;
        if (lr.compensacaoPrejuizo > 0) {
            html += `<div class="info-row"><span>(-) Compensação prejuízo fiscal (30%)</span><span style="color:var(--accent);">-${formatBRL(lr.compensacaoPrejuizo)}</span></div>`;
            html += `<div class="info-row"><span style="font-size:0.75rem;color:var(--text-muted);">    Prejuízo remanescente</span><span style="font-size:0.75rem;">${formatBRL(lr.prejuizoRemanescente)}</span></div>`;
        }
        if (lr.jcpDedutivel > 0) {
            html += `<div class="info-row"><span>(-) JCP dedutível</span><span style="color:var(--accent);">-${formatBRL(lr.jcpDedutivel)}</span></div>`;
        }
        html += `<div class="info-row total"><span>Lucro Real tributável (anual)</span><span>${formatBRL(lr.lucroTributavel)}</span></div>`;
        html += `<div class="info-row"><span>IRPJ 15%</span><span>${formatBRL(imp.irpjNormal * 12)}</span></div>`;
        html += `<div class="info-row"><span>Adicional 10% (sobre excedente R$ 20k/mês)</span><span>${formatBRL(imp.adicionalIRPJ * 12)}</span></div>`;
        if (imp.descontoSudam > 0) {
            html += `<div class="info-row"><span style="color:var(--accent);">(-) Desconto SUDAM 75%</span><span style="color:var(--accent);">-${formatBRL(imp.descontoSudam * 12)}</span></div>`;
        }
        html += `<div class="info-row total"><span>IRPJ final (anual)</span><span>${formatBRL(imp.irpj * 12)}</span></div>`;
        html += `</div>`;

        // ═══ DEMONSTRATIVO CSLL ═══
        html += `<div class="info-card">
            <h4>Demonstrativo CSLL</h4>`;
        if (lr.compensacaoCSLL > 0) {
            html += `<div class="info-row"><span>(-) Compensação base negativa (30%)</span><span style="color:var(--accent);">-${formatBRL(lr.compensacaoCSLL)}</span></div>`;
        }
        html += `<div class="info-row"><span>CSLL 9% (anual)</span><span>${formatBRL(imp.csll * 12)}</span></div>`;
        html += `</div>`;

        // ═══ PIS/COFINS DETALHADO ═══
        html += `<div class="info-card">
            <h4>PIS/COFINS Não-Cumulativo — Detalhado</h4>
            <div class="info-row"><span>Débito PIS (1,65%)</span><span>${formatBRL(imp.pis + real.creditoPISCOFINS * (IF.LUCRO_REAL.pis / (IF.LUCRO_REAL.pis + IF.LUCRO_REAL.cofins)))}</span></div>
            <div class="info-row"><span>Débito COFINS (7,6%)</span><span>${formatBRL(imp.cofins + real.creditoPISCOFINS * (IF.LUCRO_REAL.cofins / (IF.LUCRO_REAL.pis + IF.LUCRO_REAL.cofins)))}</span></div>
            <div class="info-row"><span>(-) Créditos sobre base ${formatBRL(real.baseCreditoPC)}${real.baseCreditoExplicita ? '' : ' (estimada)'}</span><span style="color:var(--accent);">-${formatBRL(real.creditoPISCOFINS)}</span></div>
            <div class="info-row total"><span>PIS/COFINS a pagar</span><span>${formatBRL(imp.pis + imp.cofins)}/mês</span></div>
            <div class="info-row"><span>Alíquota efetiva</span><span style="color:${real.aliquotaEfetivaPISCOFINS < 0.0365 ? 'var(--accent)' : 'var(--amber)'};">${formatPct(real.aliquotaEfetivaPISCOFINS)} <small>(vs 3,65% Presumido)</small></span></div>`;

        if (!real.baseCreditoExplicita) {
            html += `<div style="margin-top:8px;padding:8px;background:rgba(217,119,6,0.06);border-radius:6px;font-size:0.78rem;color:var(--amber);">
                ⚠️ Base de créditos estimada (CMV + 60% despesas). Para resultado preciso, preencha "Despesas Elegíveis Crédito PIS/COFINS" no formulário.
            </div>`;
        }
        html += `</div>`;

        // ═══ JCP DETALHADO ═══
        if (dados.patrimonioLiquido > 0 && lr.jcpDedutivel > 0) {
            html += `<div class="info-card">
                <h4>JCP — Juros sobre Capital Próprio</h4>
                <div class="info-row"><span>Patrimônio Líquido</span><span>${formatBRL(dados.patrimonioLiquido)}</span></div>
                <div class="info-row"><span>TJLP (${(dados.tjlp * 100).toFixed(1)}% a.a.)</span><span>${formatBRL(dados.patrimonioLiquido * dados.tjlp)}</span></div>
                <div class="info-row"><span>JCP dedutível (limitado)</span><span>${formatBRL(lr.jcpDedutivel)}</span></div>
                <div class="info-row"><span style="color:var(--accent);">Economia IRPJ+CSLL (34%)</span><span style="color:var(--accent);">${formatBRL(lr.economiaJCP)}</span></div>
                <div class="info-row"><span style="color:var(--red);">(-) Custo IRRF (15%)</span><span style="color:var(--red);">-${formatBRL(lr.custoIRRFJCP)}</span></div>
                <div class="info-row total"><span>Economia líquida JCP</span><span>${formatBRL(lr.economiaLiquidaJCP)}/ano</span></div>
            </div>`;
        } else if (dados.patrimonioLiquido === 0) {
            html += `<div class="info-card">
                <h4>JCP — Juros sobre Capital Próprio</h4>
                <p style="font-size:0.85rem;color:var(--text-muted);">Preencha o Patrimônio Líquido na seção "Dados Avançados" para calcular o JCP. Economia potencial: 19% do JCP distribuído.</p>
            </div>`;
        }

        // ═══ RETENÇÕES NA FONTE ═══
        if (dados.pctOrgaoPublico > 0) {
            html += `<div class="info-card">
                <h4>Retenções na Fonte — Órgãos Públicos</h4>
                <div class="info-row"><span>Faturamento c/ órgãos públicos (${(dados.pctOrgaoPublico * 100).toFixed(0)}%)</span><span>${formatBRL(dados.faturamento * dados.pctOrgaoPublico)}/mês</span></div>
                <div class="info-row"><span>IRRF retido (4,8%)</span><span>${formatBRL(lr.retencaoIRRF)}/mês</span></div>
                <div class="info-row"><span>CSRF retido (4,65%)</span><span>${formatBRL(lr.retencaoCSRF)}/mês</span></div>
                <div class="info-row total"><span>Total retido (9,45%)</span><span>${formatBRL(lr.retencaoTotal)}/mês</span></div>
                <div style="margin-top:8px;font-size:0.82rem;color:var(--accent);">
                    ✅ No Lucro Real: <strong>100% compensável</strong> como antecipação do imposto devido. Impacto líquido = zero.<br>
                    ⚠️ No Presumido: IRRF parcialmente compensável; CSRF compensável com limitações.
                </div>
            </div>`;
        }

        // ═══ DEPRECIAÇÃO ACELERADA ═══
        if (dados.investimentoAtivos > 0) {
            html += `<div class="info-card">
                <h4>Depreciação ${dados.sudam ? 'Acelerada (SUDAM 100%)' : 'Normal'}</h4>
                <div class="info-row"><span>Investimento em ativos (12 meses)</span><span>${formatBRL(dados.investimentoAtivos)}</span></div>
                <div class="info-row"><span>Taxa depreciação</span><span>${dados.sudam ? '100%/ano (SUDAM)' : '~20%/ano (normal)'}</span></div>
                <div class="info-row"><span>Despesa depreciação mensal</span><span>${formatBRL(dados.investimentoAtivos * (dados.sudam ? 1 : 0.20) / 12)}</span></div>
                <div class="info-row"><span>Economia IRPJ+CSLL (34%)</span><span style="color:var(--accent);">${formatBRL(lr.economiaDepreciacao)}/mês</span></div>
                <div class="info-row"><span>+ Crédito PIS/COFINS (9,25%)</span><span style="color:var(--accent);">${formatBRL(dados.investimentoAtivos * (dados.sudam ? 1 : 0.20) / 12 * 0.0925)}/mês</span></div>
            </div>`;
        }

        // ═══ PAINEL VANTAGENS CONSOLIDADO ═══
        html += renderVantagensLRResumo(real, ranking, dados);

        // ═══ BREAK-EVEN: MARGEM MÍNIMA ═══
        const presumido = ranking.find(r => r.regime === 'Lucro Presumido');
        if (presumido) {
            const presTotal = presumido.totalImpostos;
            const realTotal = real.totalImpostos;
            const diff = realTotal - presTotal;
            const diffAnual = diff * 12;
            const vantLR = realTotal < presTotal;

            html += `<div class="breakeven-card">
                <h5>📊 Comparativo Lucro Real vs Presumido</h5>`;

            if (vantLR) {
                html += `<p style="font-size:0.88rem;color:var(--accent);font-weight:600;">
                    ✅ Lucro Real é ${formatBRL(Math.abs(diffAnual))}/ano mais barato que o Presumido!
                </p>`;
            } else {
                html += `<p style="font-size:0.88rem;color:var(--text-secondary);">
                    O Presumido é ${formatBRL(Math.abs(diffAnual))}/ano mais barato. Mas considere as vantagens extras do LR (JCP, retenções, prejuízo).
                </p>`;
            }

            // Margem de break-even
            const presuncao = regras.presuncaoIRPJ || 0.32;
            const margemAtual = dados.margem;
            html += `<div style="margin-top:12px;">
                <div class="info-row"><span>Sua margem de lucro</span><span>${formatPct(margemAtual)}</span></div>
                <div class="info-row"><span>Presunção IRPJ do seu CNAE</span><span>${formatPct(presuncao)}</span></div>
                <div class="info-row"><span style="font-size:0.78rem;color:var(--text-muted);">Regra: Se margem real < presunção, Lucro Real tende a ser melhor</span><span></span></div>
            </div>`;

            // Barra visual
            const maxPct = Math.max(presuncao, margemAtual, 0.40) * 100;
            const margemPct = (margemAtual * 100 / maxPct * 100).toFixed(0);
            const presuncaoPct = (presuncao * 100 / maxPct * 100).toFixed(0);

            html += `<div class="breakeven-bar">
                <div class="breakeven-bar-fill" style="width:${margemPct}%;background:${margemAtual <= presuncao ? 'var(--accent)' : 'var(--amber)'};border-radius:12px;"></div>
                <div class="breakeven-marker" style="left:${presuncaoPct}%;">
                    <span class="breakeven-marker-label" style="color:var(--red);">Presunção ${formatPct(presuncao)}</span>
                </div>
            </div>
            <div style="font-size:0.78rem;color:var(--text-muted);margin-top:16px;">
                Sua margem: <strong style="color:${margemAtual <= presuncao ? 'var(--accent)' : 'var(--amber)'};">${formatPct(margemAtual)}</strong>
                ${margemAtual <= presuncao ? '→ Abaixo da presunção = Lucro Real tende a ser mais barato' : '→ Acima da presunção = Presumido pode ser mais simples'}
            </div>`;

            html += `</div>`;
        }

        // ═══ OBRIGAÇÕES ACESSÓRIAS COMPARATIVO ═══
        html += `<div class="info-card">
            <h4>Obrigações Acessórias — Comparativo</h4>
            <div class="obrig-grid">
                <div class="obrig-col">
                    <h6>Simples Nacional</h6>
                    <div class="obrig-item">PGDAS-D (mensal)</div>
                    <div class="obrig-item">DEFIS (anual)</div>
                    <div class="obrig-item">Contabilidade simplificada</div>
                    <div class="obrig-item" style="font-weight:600;color:var(--accent);margin-top:6px;">~R$ 800-1.500/mês</div>
                </div>
                <div class="obrig-col">
                    <h6>Lucro Presumido</h6>
                    <div class="obrig-item">DCTF (mensal)</div>
                    <div class="obrig-item">ECD/ECF (anual)</div>
                    <div class="obrig-item">DARF trimestral</div>
                    <div class="obrig-item" style="font-weight:600;color:var(--amber);margin-top:6px;">~R$ 1.500-2.500/mês</div>
                </div>
                <div class="obrig-col">
                    <h6>Lucro Real</h6>
                    <div class="obrig-item">LALUR (via ECF)</div>
                    <div class="obrig-item">ECD + ECF (anual)</div>
                    <div class="obrig-item">EFD-Contribuições (mensal)</div>
                    <div class="obrig-item">DCTF (mensal)</div>
                    <div class="obrig-item">DARF ${dados.apuracaoLR === 'anual' ? 'mensal estimativa' : 'trimestral'}</div>
                    <div class="obrig-item" style="font-weight:600;color:var(--red);margin-top:6px;">~R$ 2.500-5.000/mês</div>
                </div>
            </div>
            <div style="margin-top:12px;font-size:0.82rem;color:var(--text-muted);">
                💡 O custo contábil maior do Lucro Real é um <strong>investimento</strong> que pode gerar economia tributária muito superior.
                ${v.economiaLiquida > 0 ? `No seu caso: economia líquida de <strong style="color:var(--accent);">${formatBRL(v.economiaLiquida)}/ano</strong> após o custo contábil.` : ''}
            </div>
        </div>`;

        // ═══ SUDAM DETALHADO ═══
        if (dados.sudam) {
            html += `<div class="info-card" style="border-color:rgba(22,163,74,0.25);">
                <h4>🌿 Incentivo SUDAM — Requisitos e Base Legal</h4>
                <div style="font-size:0.85rem;color:var(--text-secondary);line-height:1.7;">
                    <p><strong>Base Legal:</strong> Art. 630-633 do RIR/2018 + LC 124/2007 + MP 2.199-14/2001</p>
                    <p style="margin-top:8px;"><strong>Requisitos:</strong></p>
                    <p style="padding-left:12px;">• Lucro Real obrigatório (Art. 257, IV)<br>
                    • Projeto aprovado pela SUDAM<br>
                    • Laudo Constitutivo emitido<br>
                    • Setor prioritário (Decreto 4.212/2002)<br>
                    • CND/CPEN federal + regularidade FGTS<br>
                    • Produção efetiva > 20% capacidade instalada</p>
                    <p style="margin-top:8px;"><strong>Benefícios:</strong></p>
                    <p style="padding-left:12px;">• Redução 75% do IRPJ por 10 anos<br>
                    • Depreciação acelerada integral (100% no ano)<br>
                    • Reinvestimento 30% do IRPJ (Banco da Amazônia)</p>
                </div>
            </div>`;
        }

        tab.innerHTML = html;
    }

    // ═══════════════════════════════════════════════════════════════
    //  RENDER TAB 2: TEA (renumerada)
    // ═══════════════════════════════════════════════════════════════

    function renderTabTEA(ranking, dados) {
        const tab = $('tabTEA');
        let html = '<h3 style="font-size:1.1rem;font-weight:700;margin-bottom:16px;">Tax Effective Analysis</h3>';

        ranking.forEach(r => {
            const p = r.pessoal;
            const proLaboreLiqTotal = p.detalhesSocios.reduce((s, d) => s + d.proLabore.liquido, 0);
            const dividendosLiqTotal = p.detalhesSocios.reduce((s, d) => s + d.dividendos.liquido, 0);
            const irpfmTotal = p.detalhesSocios.reduce((s, d) => s + d.irpfm, 0);
            html += `
            <div class="info-card">
                <h4>${r.regime}</h4>
                <div class="info-row"><span>Impostos PJ</span><span>${formatBRL(r.totalImpostos)}</span></div>
                <div class="info-row"><span>Carga sobre faturamento</span><span>${formatPct(p.cargaEfetiva)}</span></div>
                <div class="info-row"><span>Lucro disponível (após impostos e custos)</span><span>${formatBRL(p.lucroDisponivel)}</span></div>
                <div style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--border-base);font-size:0.82rem;">
                    <div style="font-weight:600;color:var(--text-secondary);margin-bottom:4px;">Composição do Bolso dos Sócios:</div>
                    <div class="info-row"><span style="padding-left:8px;">Pró-labore líquido (todos)</span><span>${formatBRL(proLaboreLiqTotal)}</span></div>
                    <div class="info-row"><span style="padding-left:8px;">Dividendos líquidos (todos)</span><span>${dividendosLiqTotal > 0 ? formatBRL(dividendosLiqTotal) : `R$ 0,00 <span style="font-size:0.72rem;color:var(--text-muted);">— sem lucro disponível</span>`}</span></div>
                    ${irpfmTotal > 0 ? `<div class="info-row"><span style="padding-left:8px;color:var(--red);">(-) IRPFM</span><span style="color:var(--red);">-${formatBRL(irpfmTotal)}</span></div>` : ''}
                </div>
                <div class="info-row" style="margin-top:6px;"><span style="font-weight:700;">Total no bolso (todos os sócios)</span><span style="color:var(--accent-bright);font-weight:700;">${formatBRL(p.totalBolsoTodosSocios)}</span></div>
            </div>`;
        });

        // Nota explicativa se valores idênticos
        const bolsoValues = ranking.map(r => r.pessoal.totalBolsoTodosSocios);
        const allEqual = bolsoValues.every(v => Math.abs(v - bolsoValues[0]) < 1);
        if (allEqual && ranking.length > 1) {
            html += `<div style="background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.2);border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:0.78rem;color:var(--text-secondary);">
                ℹ️ <strong>Por que os valores são idênticos?</strong> Seus custos (${formatBRL(dados.folha + dados.cmv + dados.despesas)}) consomem praticamente todo o faturamento, não sobrando lucro para dividendos em nenhum regime. O "Total no bolso" reflete apenas o pró-labore líquido, que é independente do regime tributário. A diferença entre os regimes aparecerá quando a empresa gerar lucro.
            </div>`;
        }

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
