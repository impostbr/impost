/**
 * ═══════════════════════════════════════════════════════════════════════════
 * REFORMA-TRIBUTARIA.JS — Simulador da Reforma Tributária (EC 132/2023)
 * Versão 1.0 — Transição IBS/CBS 2026-2033
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * FONTES LEGAIS:
 *   • Emenda Constitucional nº 132/2023
 *   • Lei Complementar nº 214/2025 (regulamentação)
 *   • PLP 68/2024 (Senado) — alíquotas de referência
 *   • Nota Técnica SEI nº 7/2024/MF — estimativa 26,5%
 *
 * O QUE A REFORMA FAZ:
 *   → CBS (federal) substitui PIS + COFINS
 *   → IBS (estadual/municipal) substitui ICMS + ISS
 *   → IVA dual (CBS + IBS) com creditamento amplo
 *   → Alíquota de referência estimada: ~26,5%
 *
 * TIMELINE DE TRANSIÇÃO:
 *   2026 .... Fase de teste (IBS 0,1% + CBS 0,9%)
 *   2027 .... CBS plena → PIS/COFINS extintos
 *   2029 .... IBS começa a substituir ICMS/ISS (10%)
 *   2030 .... IBS 20% / ICMS-ISS 80%
 *   2031 .... IBS 40% / ICMS-ISS 60%
 *   2032 .... IBS 60% / ICMS-ISS 40%
 *   2033 .... IBS 100% → ICMS/ISS extintos
 *
 * ATUALIZAÇÃO: 09/02/2026
 * ═══════════════════════════════════════════════════════════════════════════
 */

const ReformaTributaria = (function () {
    "use strict";

    // ═══════════════════════════════════════════════════════════════
    //  CONSTANTES — ALÍQUOTAS DE REFERÊNCIA
    // ═══════════════════════════════════════════════════════════════

    const CBS_REF = 0.088;        // ~8,8% (substitui PIS+COFINS)
    const IBS_REF = 0.177;        // ~17,7% (substitui ICMS+ISS)
    const IVA_TOTAL = 0.265;      // ~26,5% (CBS+IBS combinado)

    const TESTE_CBS = 0.009;      // 0,9% (fase teste 2026)
    const TESTE_IBS = 0.001;      // 0,1% (fase teste 2026)

    // ═══════════════════════════════════════════════════════════════
    //  TIMELINE DE TRANSIÇÃO
    // ═══════════════════════════════════════════════════════════════
    //
    // cbs_pct   = % da CBS em vigor (0=zero, 1=plena)
    // ibs_pct   = % do IBS em vigor
    // pc_pct    = % do PIS/COFINS remanescente
    // icms_pct  = % do ICMS/ISS remanescente
    // teste     = se cobra adicional de teste

    const TIMELINE = [
        { ano: 2025, fase: "Sistema Atual",     cor: "#8a8578", cbs_pct: 0,    ibs_pct: 0,    pc_pct: 1.00, icms_pct: 1.00, teste: false },
        { ano: 2026, fase: "Fase de Teste",     cor: "#d97706", cbs_pct: 0,    ibs_pct: 0,    pc_pct: 1.00, icms_pct: 1.00, teste: true  },
        { ano: 2027, fase: "CBS Plena",         cor: "#2563eb", cbs_pct: 1.00, ibs_pct: 0,    pc_pct: 0,    icms_pct: 1.00, teste: false },
        { ano: 2028, fase: "CBS Plena",         cor: "#2563eb", cbs_pct: 1.00, ibs_pct: 0,    pc_pct: 0,    icms_pct: 1.00, teste: false },
        { ano: 2029, fase: "IBS 10%",           cor: "#7c3aed", cbs_pct: 1.00, ibs_pct: 0.10, pc_pct: 0,    icms_pct: 0.90, teste: false },
        { ano: 2030, fase: "IBS 20%",           cor: "#7c3aed", cbs_pct: 1.00, ibs_pct: 0.20, pc_pct: 0,    icms_pct: 0.80, teste: false },
        { ano: 2031, fase: "IBS 40%",           cor: "#7c3aed", cbs_pct: 1.00, ibs_pct: 0.40, pc_pct: 0,    icms_pct: 0.60, teste: false },
        { ano: 2032, fase: "IBS 60%",           cor: "#7c3aed", cbs_pct: 1.00, ibs_pct: 0.60, pc_pct: 0,    icms_pct: 0.40, teste: false },
        { ano: 2033, fase: "Plena Vigência",    cor: "#16a34a", cbs_pct: 1.00, ibs_pct: 1.00, pc_pct: 0,    icms_pct: 0,    teste: false },
    ];

    // ═══════════════════════════════════════════════════════════════
    //  CLASSIFICAÇÃO SETORIAL — REDUÇÃO DE ALÍQUOTA
    // ═══════════════════════════════════════════════════════════════
    //
    // LC 214/2025 prevê alíquotas reduzidas para setores específicos:
    //   → 60% de redução (paga 40% da alíquota cheia)
    //   → 30% de redução (paga 70% da alíquota cheia) — prof. liberais
    //   → 0% (isenção) — cesta básica nacional
    //   → 100% (alíquota cheia) — demais

    const REDUCAO_SETOR = {
        // 60% de redução (alíquota efetiva × 0.4)
        saude:      { reducao: 0.60, label: "Saúde",      motivo: "Art. 274, LC 214/2025 — prestação de serviços de saúde" },
        educacao:   { reducao: 0.60, label: "Educação",   motivo: "Art. 274 — serviços de educação" },
        transporte: { reducao: 0.60, label: "Transporte", motivo: "Art. 274 — transporte público coletivo" },
        agro:       { reducao: 0.60, label: "Agropecuária", motivo: "Art. 274 — insumos e produtos agropecuários" },
        cultura:    { reducao: 0.60, label: "Cultura",    motivo: "Art. 274 — atividades artísticas e culturais" },

        // 30% de redução (alíquota efetiva × 0.7) — profissões regulamentadas
        advocacia:      { reducao: 0.30, label: "Advocacia",      motivo: "Art. 278, LC 214/2025 — serviços de profissão regulamentada" },
        engenharia:     { reducao: 0.30, label: "Engenharia",     motivo: "Art. 278 — profissão regulamentada" },
        arquitetura:    { reducao: 0.30, label: "Arquitetura",    motivo: "Art. 278 — profissão regulamentada" },
        contabilidade:  { reducao: 0.30, label: "Contabilidade",  motivo: "Art. 278 — profissão regulamentada" },
        medicina:       { reducao: 0.30, label: "Medicina",       motivo: "Art. 278 — profissão regulamentada (consultório)" },
        odontologia:    { reducao: 0.30, label: "Odontologia",    motivo: "Art. 278 — profissão regulamentada" },
        psicologia:     { reducao: 0.30, label: "Psicologia",     motivo: "Art. 278 — profissão regulamentada" },
        veterinaria:    { reducao: 0.30, label: "Veterinária",    motivo: "Art. 278 — profissão regulamentada" },
        fisioterapia:   { reducao: 0.30, label: "Fisioterapia",   motivo: "Art. 278 — profissão regulamentada" },
        nutricao:       { reducao: 0.30, label: "Nutrição",       motivo: "Art. 278 — profissão regulamentada" },
        economia:       { reducao: 0.30, label: "Economia",       motivo: "Art. 278 — profissão regulamentada" },
        administracao:  { reducao: 0.30, label: "Administração",  motivo: "Art. 278 — profissão regulamentada" },
        ambiental:      { reducao: 0.30, label: "Ambiental",      motivo: "Art. 278 — profissão regulamentada (eng. ambiental)" },
        topografia:     { reducao: 0.30, label: "Topografia",     motivo: "Art. 278 — profissão regulamentada (agrimensura)" },

        // Sem redução
        geral: { reducao: 0, label: "Geral", motivo: "Alíquota cheia — sem redução setorial aplicável" },
    };

    // Mapa de palavras-chave da descrição CNAE → setor de redução
    const CNAE_SETOR_MAP = [
        { termos: ["hospital", "ambulatorial", "medic", "clinica medica", "saude"],             setor: "saude" },
        { termos: ["odontolog", "dentist", "dental"],                                           setor: "odontologia" },
        { termos: ["psicolog", "terapia ocupacional"],                                          setor: "psicologia" },
        { termos: ["fisioter", "reabilitacao"],                                                 setor: "fisioterapia" },
        { termos: ["nutric", "dietetica"],                                                      setor: "nutricao" },
        { termos: ["veterinar"],                                                                setor: "veterinaria" },
        { termos: ["ensino", "educacao", "escola", "creche", "treinamento", "curso"],           setor: "educacao" },
        { termos: ["advocacia", "juridic", "direito"],                                          setor: "advocacia" },
        { termos: ["engenharia", "engenheiro"],                                                 setor: "engenharia" },
        { termos: ["arquitetura", "urbanismo"],                                                 setor: "arquitetura" },
        { termos: ["contabil", "contabilidade", "auditoria"],                                   setor: "contabilidade" },
        { termos: ["agropecuar", "agricol", "pecuar", "lavoura", "cultivo", "criacao"],         setor: "agro" },
        { termos: ["transporte coletivo", "transporte public", "onibus"],                       setor: "transporte" },
        { termos: ["ambiental", "licenciamento", "georreferenc", "cartograf"],                  setor: "ambiental" },
        { termos: ["topograf", "agrimensura", "geodesia"],                                      setor: "topografia" },
        { termos: ["artisti", "cultural", "museu", "teatro"],                                   setor: "cultura" },
        { termos: ["economia", "economista"],                                                   setor: "economia" },
        { termos: ["administrac"],                                                              setor: "administracao" },
    ];

    // Ratio de créditos de insumos por tipo de atividade
    const CREDITO_INSUMOS = {
        comercio:  0.65,  // ~65% da receita é CMV (gera crédito)
        industria: 0.55,  // ~55% matéria-prima + energia
        servico:   0.15,  // ~15% (aluguel, materiais — mão-de-obra não gera crédito)
        agro:      0.50,  // ~50% insumos
    };

    // ═══════════════════════════════════════════════════════════════
    //  FUNÇÕES AUXILIARES
    // ═══════════════════════════════════════════════════════════════

    function norm(s) {
        return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    }

    function R$(n) {
        if (n == null) return "—";
        return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }

    function pct(n, casas) {
        if (n == null) return "—";
        return (n * 100).toFixed(casas != null ? casas : 2).replace(".", ",") + "%";
    }

    // ═══════════════════════════════════════════════════════════════
    //  CLASSIFICAR SETOR DO CNAE
    // ═══════════════════════════════════════════════════════════════

    function classificarSetor(cnaeDesc, cnaeCat) {
        var descNorm = norm(cnaeDesc);
        var catNorm = norm(cnaeCat);

        for (var i = 0; i < CNAE_SETOR_MAP.length; i++) {
            var entry = CNAE_SETOR_MAP[i];
            for (var j = 0; j < entry.termos.length; j++) {
                if (descNorm.indexOf(entry.termos[j]) >= 0 || catNorm.indexOf(entry.termos[j]) >= 0) {
                    return REDUCAO_SETOR[entry.setor];
                }
            }
        }
        return REDUCAO_SETOR.geral;
    }

    function getTipoAtividade(cnaeCat) {
        var c = norm(cnaeCat);
        if (c.indexOf("comercio") >= 0) return "comercio";
        if (c.indexOf("industria") >= 0) return "industria";
        if (c.indexOf("agro") >= 0 || c.indexOf("pecuar") >= 0) return "agro";
        return "servico";
    }

    // ═══════════════════════════════════════════════════════════════
    //  CÁLCULO: IMPOSTOS ATUAIS (PIS+COFINS+ICMS+ISS)
    // ═══════════════════════════════════════════════════════════════

    /**
     * Calcula os impostos sobre consumo atuais (que serão substituídos)
     * NÃO inclui IRPJ, CSLL, CPP (esses não mudam)
     */
    function calcAtual(fat, regime, regras, uf, issRate, ES) {
        var resultado = { pis: 0, cofins: 0, icms: 0, iss: 0, total: 0 };
        var isServico = (regras.presuncaoIRPJ || 0) >= 0.32 || ["III", "IV", "V"].indexOf(regras.anexo) >= 0;
        var estado = ES ? ES[uf] : null;
        var icmsRate = estado ? (estado.icms.padrao || 0.18) : 0.18;

        if (regime === "simples") {
            // No Simples, PIS/COFINS/ICMS/ISS estão embutidos no DAS
            // Para comparação, estimar a parcela do DAS referente a esses impostos
            // Aproximação: ~60% do DAS são PIS+COFINS+ICMS+ISS
            // Mas para a reforma, empresas do Simples podem optar por ficar no regime atual
            resultado.total = 0; // Tratamento especial — ver nota no render
            resultado.simplesNota = true;
            return resultado;
        }

        if (regime === "presumido") {
            resultado.pis = fat * 0.0065;
            resultado.cofins = fat * 0.03;
        } else { // real
            var credEst = fat * 0.30;
            resultado.pis = Math.max(0, fat * 0.0165 - credEst * 0.0165);
            resultado.cofins = Math.max(0, fat * 0.076 - credEst * 0.076);
        }

        if (isServico) {
            resultado.iss = fat * (issRate || 0.05);
        } else {
            resultado.icms = fat * icmsRate * 0.30; // Efetivo ~30% da alíquota nominal
        }

        resultado.total = resultado.pis + resultado.cofins + resultado.icms + resultado.iss;
        return resultado;
    }

    // ═══════════════════════════════════════════════════════════════
    //  CÁLCULO: PROJEÇÃO REFORMA ANO A ANO
    // ═══════════════════════════════════════════════════════════════

    /**
     * Projeta os impostos sobre consumo para cada ano da transição
     *
     * @param {number} fat - Faturamento mensal
     * @param {string} regime - "simples"|"presumido"|"real"
     * @param {object} regras - Regras do CNAE
     * @param {string} uf - UF
     * @param {number} issRate - Alíquota ISS (decimal)
     * @param {object} ES - Objeto ESTADOS
     * @param {object} setor - Resultado de classificarSetor()
     * @param {string} tipoAtiv - "comercio"|"industria"|"servico"|"agro"
     */
    function projetarTransicao(fat, regime, regras, uf, issRate, ES, setor, tipoAtiv) {
        var atual = calcAtual(fat, regime, regras, uf, issRate, ES);
        var creditoRatio = CREDITO_INSUMOS[tipoAtiv] || 0.15;
        var reducaoFator = 1 - (setor.reducao || 0);

        // Alíquotas efetivas de referência para IBS e CBS
        var cbsEfetiva = CBS_REF * reducaoFator;
        var ibsEfetiva = IBS_REF * reducaoFator;

        var projecao = [];

        for (var i = 0; i < TIMELINE.length; i++) {
            var t = TIMELINE[i];
            var item = {
                ano: t.ano,
                fase: t.fase,
                cor: t.cor,
            };

            if (regime === "simples") {
                // Simples Nacional: tratamento especial
                // A alíquota do DAS será ajustada gradualmente
                // Para simulação: impacto limitado (±5% variação)
                item.pis_cofins = atual.total * t.pc_pct;
                item.icms_iss = atual.total * t.icms_pct;
                item.cbs = 0;
                item.ibs = 0;
                item.teste = 0;
                item.total = atual.total; // Aproximação: Simples absorve gradualmente
                item.simplesNota = true;
            } else {
                // PIS/COFINS remanescente
                item.pis_cofins = (atual.pis + atual.cofins) * t.pc_pct;

                // CBS em vigor
                var cbsBruta = fat * cbsEfetiva * t.cbs_pct;
                var cbsCredito = fat * creditoRatio * cbsEfetiva * t.cbs_pct;
                item.cbs = Math.max(0, cbsBruta - cbsCredito);

                // ICMS/ISS remanescente
                item.icms_iss = (atual.icms + atual.iss) * t.icms_pct;

                // IBS em vigor
                var ibsBruta = fat * ibsEfetiva * t.ibs_pct;
                var ibsCredito = fat * creditoRatio * ibsEfetiva * t.ibs_pct;
                item.ibs = Math.max(0, ibsBruta - ibsCredito);

                // Adicional de teste 2026
                item.teste = t.teste ? fat * (TESTE_CBS + TESTE_IBS) : 0;

                item.total = item.pis_cofins + item.cbs + item.icms_iss + item.ibs + item.teste;
            }

            // Delta vs atual
            item.delta = atual.total > 0 ? (item.total - atual.total) / atual.total : 0;
            item.deltaAbs = item.total - atual.total;

            projecao.push(item);
        }

        return { atual: atual, projecao: projecao };
    }

    // ═══════════════════════════════════════════════════════════════
    //  GERAR ALERTAS POR SETOR
    // ═══════════════════════════════════════════════════════════════

    function gerarAlertas(tipoAtiv, setor, projecao) {
        var alertas = [];
        var ultimo = projecao[projecao.length - 1];
        var delta = ultimo.delta;

        // Impacto geral
        if (delta > 0.10) {
            alertas.push({
                tipo: "danger",
                texto: "Aumento estimado de " + pct(delta, 1) + " na carga sobre consumo em 2033. " +
                    "Setores de serviço tendem a ser os mais impactados pela reforma, pois a mão de obra " +
                    "(principal custo) não gera créditos de IBS/CBS."
            });
        } else if (delta < -0.05) {
            alertas.push({
                tipo: "success",
                texto: "Redução estimada de " + pct(Math.abs(delta), 1) + " na carga sobre consumo. " +
                    "A eliminação da cumulatividade e o creditamento amplo tendem a beneficiar este setor."
            });
        } else {
            alertas.push({
                tipo: "info",
                texto: "Impacto relativamente neutro na carga sobre consumo (" + pct(delta, 1) + "). " +
                    "A transição deve ser suave para este perfil de atividade."
            });
        }

        // Redução setorial
        if (setor.reducao > 0) {
            alertas.push({
                tipo: "info",
                texto: "✅ Alíquota reduzida em " + (setor.reducao * 100).toFixed(0) + "% — " +
                    setor.motivo + ". Alíquota efetiva estimada: " +
                    pct(IVA_TOTAL * (1 - setor.reducao), 1) + " (em vez de " + pct(IVA_TOTAL, 1) + ")."
            });
        }

        // Créditos
        if (tipoAtiv === "servico") {
            alertas.push({
                tipo: "warn",
                texto: "⚠️ Serviços têm menor aproveitamento de créditos IBS/CBS porque a folha de " +
                    "pagamento (principal custo) não gera crédito. Isso eleva a carga efetiva."
            });
        }
        if (tipoAtiv === "comercio") {
            alertas.push({
                tipo: "info",
                texto: "O comércio tende a se beneficiar: o custo das mercadorias (CMV) gera crédito " +
                    "integral de IBS/CBS, eliminando o efeito cascata atual do ICMS."
            });
        }

        // Simples Nacional
        alertas.push({
            tipo: "info",
            texto: "Empresas do Simples Nacional podem optar por recolher IBS/CBS por fora do DAS, " +
                "permitindo que clientes PJ aproveitem créditos. Ideal para quem vende B2B."
        });

        // Split payment
        alertas.push({
            tipo: "info",
            texto: "A reforma introduz o split payment (pagamento fracionado): o IBS/CBS será " +
                "retido automaticamente no momento do pagamento via cartão/PIX."
        });

        return alertas;
    }

    // ═══════════════════════════════════════════════════════════════
    //  RENDER — TAB COMPLETA
    // ═══════════════════════════════════════════════════════════════

    function render(dados) {
        /**
         * dados = {
         *   faturamento, folha, uf, regime,
         *   cnaeDesc, cnaeCat, cnaeCode,
         *   regras, issRate, ES,
         *   containerID: "tabReforma" (default)
         * }
         */
        var container = document.getElementById(dados.containerID || "tabReforma");
        if (!container) return;

        var fat = dados.faturamento || 0;
        if (fat <= 0) { container.innerHTML = ""; return; }

        var setor = classificarSetor(dados.cnaeDesc, dados.cnaeCat);
        var tipoAtiv = getTipoAtividade(dados.cnaeCat);
        var proj = projetarTransicao(fat, dados.regime, dados.regras, dados.uf, dados.issRate, dados.ES, setor, tipoAtiv);
        var alertas = gerarAlertas(tipoAtiv, setor, proj.projecao);
        var ultimo = proj.projecao[proj.projecao.length - 1];
        var isNeg = ultimo.delta <= 0;

        var html = "";

        // ── 1. BANNER DE IMPACTO ──
        html += '<div class="info-card" style="border-color:' + (isNeg ? "var(--accent)" : "var(--amber)") + ';border-width:2px;">';
        html += '<div style="text-align:center;margin-bottom:16px;">';
        html += '<div style="font-size:0.75rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:' + (isNeg ? "var(--accent)" : "var(--amber)") + ';margin-bottom:6px;">';
        html += '🏛️ IMPACTO ESTIMADO DA REFORMA TRIBUTÁRIA</div>';
        html += '<div style="font-size:1.8rem;font-weight:800;color:' + (isNeg ? "var(--accent-bright)" : "var(--red)") + ';">';
        html += (ultimo.delta >= 0 ? "+" : "") + pct(ultimo.delta, 1) + '</div>';
        html += '<div style="font-size:0.88rem;color:var(--text-secondary);">na carga sobre consumo em 2033 vs. sistema atual</div>';
        html += '<div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px;">';
        html += 'Atual: ' + R$(proj.atual.total) + '/mês → 2033: ' + R$(ultimo.total) + '/mês';
        html += ' <span style="font-weight:700;color:' + (isNeg ? "var(--accent)" : "var(--red)") + ';">(' + (ultimo.deltaAbs >= 0 ? "+" : "") + R$(ultimo.deltaAbs) + ')</span>';
        html += '</div>';
        if (setor.reducao > 0) {
            html += '<div style="margin-top:8px;display:inline-block;background:' + (setor.reducao >= 0.5 ? "rgba(22,163,74,0.08)" : "rgba(37,99,235,0.08)") + ';padding:4px 14px;border-radius:20px;font-size:0.75rem;font-weight:700;color:' + (setor.reducao >= 0.5 ? "var(--accent)" : "var(--blue)") + ';">';
            html += '✅ ' + setor.label + ' — Alíquota reduzida ' + (setor.reducao * 100).toFixed(0) + '% (LC 214/2025)';
            html += '</div>';
        }
        html += '</div></div>';

        // ── 2. TIMELINE VISUAL ──
        html += '<div class="info-card">';
        html += '<h4>📅 Timeline da Transição</h4>';
        html += '<div style="display:flex;align-items:flex-start;gap:0;overflow-x:auto;padding:8px 0 16px;">';

        for (var ti = 0; ti < TIMELINE.length; ti++) {
            var t = TIMELINE[ti];
            var isAtual = (t.ano === 2026);
            var isUltimo = (ti === TIMELINE.length - 1);
            html += '<div style="flex:1;min-width:80px;text-align:center;position:relative;">';
            // Linha conectora
            if (ti > 0) {
                html += '<div style="position:absolute;top:10px;left:0;right:50%;height:2px;background:' + TIMELINE[ti - 1].cor + ';"></div>';
            }
            if (!isUltimo) {
                html += '<div style="position:absolute;top:10px;left:50%;right:0;height:2px;background:' + t.cor + ';"></div>';
            }
            // Dot
            html += '<div style="width:' + (isAtual ? "22px" : "14px") + ';height:' + (isAtual ? "22px" : "14px") + ';border-radius:50%;background:' + t.cor + ';margin:' + (isAtual ? "0" : "4px") + ' auto;position:relative;z-index:2;';
            if (isAtual) html += 'box-shadow:0 0 0 4px ' + t.cor + '33;';
            html += '"></div>';
            // Year
            html += '<div style="font-family:var(--font-mono);font-size:' + (isAtual ? "0.82rem" : "0.72rem") + ';font-weight:' + (isAtual ? "800" : "600") + ';margin-top:6px;color:' + (isAtual ? "var(--text-primary)" : "var(--text-muted)") + ';">' + t.ano + '</div>';
            // Phase
            html += '<div style="font-size:0.65rem;color:' + t.cor + ';font-weight:600;margin-top:1px;">' + t.fase + '</div>';
            html += '</div>';
        }
        html += '</div></div>';

        // ── 3. O QUE MUDA ──
        html += '<div class="info-card">';
        html += '<h4>🔄 O Que Muda para Sua Empresa</h4>';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">';

        // Coluna: Impostos que SAEM
        html += '<div style="background:rgba(220,38,38,0.05);border:1px solid rgba(220,38,38,0.15);border-radius:8px;padding:14px;">';
        html += '<div style="font-size:0.78rem;font-weight:700;color:var(--red);margin-bottom:8px;">❌ EXTINTOS (gradualmente)</div>';
        html += '<div style="font-size:0.82rem;color:var(--text-secondary);line-height:1.8;">';
        html += '• <strong>PIS</strong> ' + pct(dados.regime === "real" ? 0.0165 : 0.0065) + ' → extinto em 2027<br>';
        html += '• <strong>COFINS</strong> ' + pct(dados.regime === "real" ? 0.076 : 0.03) + ' → extinto em 2027<br>';
        if (proj.atual.icms > 0) html += '• <strong>ICMS</strong> — extinto em 2033<br>';
        if (proj.atual.iss > 0) html += '• <strong>ISS</strong> ' + pct(dados.issRate) + ' — extinto em 2033<br>';
        html += '</div></div>';

        // Coluna: Impostos que ENTRAM
        html += '<div style="background:rgba(22,163,74,0.05);border:1px solid rgba(22,163,74,0.15);border-radius:8px;padding:14px;">';
        html += '<div style="font-size:0.78rem;font-weight:700;color:var(--accent);margin-bottom:8px;">✅ NOVOS (IVA Dual)</div>';
        html += '<div style="font-size:0.82rem;color:var(--text-secondary);line-height:1.8;">';
        html += '• <strong>CBS</strong> (federal) ~' + pct(CBS_REF * (1 - setor.reducao), 1) + '<br>';
        html += '<span style="font-size:0.72rem;color:var(--text-muted);margin-left:12px;">substitui PIS+COFINS</span><br>';
        html += '• <strong>IBS</strong> (est./mun.) ~' + pct(IBS_REF * (1 - setor.reducao), 1) + '<br>';
        html += '<span style="font-size:0.72rem;color:var(--text-muted);margin-left:12px;">substitui ICMS+ISS</span><br>';
        html += '• <strong>Crédito amplo</strong> não-cumulativo<br>';
        html += '<span style="font-size:0.72rem;color:var(--text-muted);margin-left:12px;">insumos geram crédito integral</span>';
        html += '</div></div>';
        html += '</div></div>';

        // ── 4. TABELA ANO A ANO ──
        if (dados.regime !== "simples") {
            html += '<div class="info-card">';
            html += '<h4>📊 Projeção Ano a Ano — Impostos sobre Consumo</h4>';
            html += '<div class="table-responsive">';
            html += '<table class="detail-table" style="min-width:600px;">';
            html += '<thead><tr>';
            html += '<th>Ano</th><th>Fase</th>';
            html += '<th style="text-align:right">PIS/COF</th>';
            html += '<th style="text-align:right">CBS</th>';
            html += '<th style="text-align:right">ICMS/ISS</th>';
            html += '<th style="text-align:right">IBS</th>';
            html += '<th style="text-align:right">Total/mês</th>';
            html += '<th style="text-align:right">Δ vs Atual</th>';
            html += '</tr></thead><tbody>';

            var maxTotal = 0;
            for (var pi = 0; pi < proj.projecao.length; pi++) {
                if (proj.projecao[pi].total > maxTotal) maxTotal = proj.projecao[pi].total;
            }

            for (var pi2 = 0; pi2 < proj.projecao.length; pi2++) {
                var p = proj.projecao[pi2];
                var isFirst = (pi2 === 0);
                var isLast = (pi2 === proj.projecao.length - 1);
                var rowStyle = isFirst ? ' style="background:rgba(22,163,74,0.03);"' : (isLast ? ' style="background:rgba(22,163,74,0.06);font-weight:700;"' : "");

                html += '<tr' + rowStyle + '>';
                html += '<td style="font-weight:700;font-family:var(--font-mono);">' + p.ano + '</td>';
                html += '<td><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + p.cor + ';margin-right:4px;vertical-align:middle;"></span>' + p.fase + '</td>';
                html += '<td style="text-align:right;">' + (p.pis_cofins > 0 ? R$(p.pis_cofins) : '<span style="color:var(--text-muted);">—</span>') + '</td>';
                html += '<td style="text-align:right;">' + (p.cbs > 0 ? R$(p.cbs) : '<span style="color:var(--text-muted);">—</span>') + '</td>';
                html += '<td style="text-align:right;">' + (p.icms_iss > 0 ? R$(p.icms_iss) : '<span style="color:var(--text-muted);">—</span>') + '</td>';
                html += '<td style="text-align:right;">' + (p.ibs > 0 ? R$(p.ibs) : '<span style="color:var(--text-muted);">—</span>') + '</td>';
                html += '<td style="text-align:right;font-weight:700;">' + R$(p.total) + '</td>';

                var deltaColor = p.delta > 0.01 ? "var(--red)" : (p.delta < -0.01 ? "var(--accent)" : "var(--text-muted)");
                html += '<td style="text-align:right;color:' + deltaColor + ';font-weight:700;">';
                if (isFirst) html += "—";
                else html += (p.delta >= 0 ? "+" : "") + pct(p.delta, 1);
                html += '</td>';
                html += '</tr>';
            }

            html += '</tbody></table></div></div>';

            // ── 5. GRÁFICO DE BARRAS ──
            html += '<div class="info-card">';
            html += '<h4>📈 Evolução da Carga sobre Consumo</h4>';
            html += '<div style="display:flex;align-items:flex-end;justify-content:center;gap:8px;height:200px;padding:20px 4px 0;">';

            for (var gi = 0; gi < proj.projecao.length; gi++) {
                var g = proj.projecao[gi];
                var barH = maxTotal > 0 ? Math.max(4, (g.total / maxTotal) * 160) : 4;
                var barColor = g.cor;
                html += '<div style="flex:1;max-width:80px;text-align:center;">';
                html += '<div style="font-family:var(--font-mono);font-size:0.65rem;font-weight:700;margin-bottom:4px;color:var(--text-secondary);">' + R$(g.total).replace("R$\u00a0", "").replace("R$ ", "") + '</div>';
                html += '<div style="width:100%;height:' + barH + 'px;background:' + barColor + ';border-radius:4px 4px 0 0;opacity:0.85;transition:height 0.3s;"></div>';
                html += '<div style="font-size:0.65rem;font-weight:700;color:var(--text-muted);margin-top:4px;">' + g.ano + '</div>';
                html += '</div>';
            }

            html += '</div></div>';
        }

        // ── 6. NOTA SIMPLES NACIONAL ──
        if (dados.regime === "simples") {
            html += '<div class="info-card" style="border-color:var(--amber);border-width:2px;">';
            html += '<h4 style="color:var(--amber);">⚠️ Simples Nacional e a Reforma</h4>';
            html += '<div style="font-size:0.85rem;color:var(--text-secondary);line-height:1.7;">';
            html += '<p>Empresas optantes pelo <strong>Simples Nacional</strong> continuarão com o DAS unificado durante toda a transição. ';
            html += 'As tabelas dos Anexos serão ajustadas gradualmente para refletir IBS/CBS em vez de PIS/COFINS/ICMS/ISS.</p>';
            html += '<p style="margin-top:8px;"><strong>Opção importante (Art. 41, LC 214/2025):</strong> A empresa pode optar por recolher IBS e CBS ';
            html += '<strong>por fora do DAS</strong>, destacando esses impostos na nota fiscal. Isso permite que clientes PJ aproveitem os créditos. ';
            html += 'Ideal para quem vende B2B.</p>';
            html += '<p style="margin-top:8px;"><strong>Recomendação:</strong> Se mais de 50% do seu faturamento é B2B, considere a opção de recolhimento ';
            html += 'por fora para manter competitividade com fornecedores de Lucro Presumido/Real.</p>';
            html += '</div></div>';
        }

        // ── 7. ALERTAS ──
        html += '<div class="info-card">';
        html += '<h4>💡 Análise e Recomendações</h4>';
        for (var ai = 0; ai < alertas.length; ai++) {
            var a = alertas[ai];
            var alertBorder = a.tipo === "danger" ? "var(--red)" : (a.tipo === "success" ? "var(--accent)" : (a.tipo === "warn" ? "var(--amber)" : "var(--blue)"));
            var alertBg = a.tipo === "danger" ? "rgba(220,38,38,0.05)" : (a.tipo === "success" ? "rgba(22,163,74,0.05)" : (a.tipo === "warn" ? "rgba(217,119,6,0.05)" : "rgba(37,99,235,0.05)"));
            html += '<div style="border-left:3px solid ' + alertBorder + ';background:' + alertBg + ';padding:10px 14px;margin-bottom:8px;border-radius:0 8px 8px 0;font-size:0.82rem;color:var(--text-secondary);line-height:1.6;">';
            html += a.texto;
            html += '</div>';
        }
        html += '</div>';

        // ── 8. DISCLAIMER ──
        html += '<div style="text-align:center;padding:16px;font-size:0.72rem;color:var(--text-muted);line-height:1.6;">';
        html += '⚠️ Simulação baseada na EC 132/2023 e LC 214/2025 com alíquota de referência estimada de ' + pct(IVA_TOTAL, 1) + '.<br>';
        html += 'Alíquotas definitivas serão fixadas por Resolução do Senado e leis estaduais/municipais. Valores para fins de planejamento.';
        html += '</div>';

        container.innerHTML = html;
    }

    // ═══════════════════════════════════════════════════════════════
    //  RENDER SIMPLIFICADO — PARA PF
    // ═══════════════════════════════════════════════════════════════

    function renderPF(dados) {
        var container = document.getElementById(dados.containerID || "tabReformaPF");
        if (!container) return;

        var html = "";

        html += '<div class="info-card">';
        html += '<h4>🏛️ Reforma Tributária — Impacto na Pessoa Física</h4>';
        html += '<div style="font-size:0.85rem;color:var(--text-secondary);line-height:1.7;">';
        html += '<p>A Reforma Tributária (EC 132/2023) foca nos <strong>impostos sobre consumo</strong> (IBS+CBS substituem PIS/COFINS/ICMS/ISS). ';
        html += 'O IRPF não é diretamente alterado pela reforma atual, mas há impactos indiretos:</p>';
        html += '</div></div>';

        html += '<div class="info-card">';
        html += '<h4>📋 Impactos Indiretos no IRPF</h4>';

        var itens = [
            { icon: "🛒", title: "Cesta Básica — Alíquota Zero", desc: "Itens da cesta básica nacional terão IBS/CBS = 0%, reduzindo o custo de vida." },
            { icon: "💊", title: "Saúde — Alíquota Reduzida", desc: "Medicamentos e dispositivos médicos terão alíquotas reduzidas em até 60%." },
            { icon: "📚", title: "Educação — Alíquota Reduzida", desc: "Serviços de educação terão desconto de 60% na alíquota do IVA." },
            { icon: "💰", title: "Cashback para Baixa Renda", desc: "O sistema prevê devolução de IBS/CBS para famílias de baixa renda no CadÚnico." },
            { icon: "🏠", title: "Imóveis — Regime Especial", desc: "Locação e venda de imóveis terão regime especial com alíquotas diferenciadas." },
            { icon: "📱", title: "Split Payment", desc: "IBS/CBS será retido automaticamente no pagamento (cartão/PIX), simplificando o recolhimento." },
        ];

        for (var ii = 0; ii < itens.length; ii++) {
            var it = itens[ii];
            html += '<div style="display:flex;gap:10px;padding:10px 0;' + (ii < itens.length - 1 ? 'border-bottom:1px solid var(--border-subtle);' : '') + '">';
            html += '<span style="font-size:1.2rem;flex-shrink:0;">' + it.icon + '</span>';
            html += '<div><div style="font-weight:700;font-size:0.85rem;">' + it.title + '</div>';
            html += '<div style="font-size:0.82rem;color:var(--text-muted);margin-top:2px;">' + it.desc + '</div></div>';
            html += '</div>';
        }
        html += '</div>';

        // Timeline resumida
        html += '<div class="info-card">';
        html += '<h4>📅 Quando Entra em Vigor</h4>';
        html += '<div style="font-size:0.82rem;color:var(--text-secondary);line-height:2;">';
        html += '<strong style="color:var(--amber);">2026</strong> — Fase de teste (IBS 0,1% + CBS 0,9% adicionais)<br>';
        html += '<strong style="color:var(--blue);">2027</strong> — CBS substitui PIS/COFINS<br>';
        html += '<strong style="color:var(--purple);">2029-2032</strong> — IBS substitui ICMS/ISS gradualmente<br>';
        html += '<strong style="color:var(--accent);">2033</strong> — Sistema novo em plena vigência<br>';
        html += '</div></div>';

        html += '<div style="text-align:center;padding:16px;font-size:0.72rem;color:var(--text-muted);">';
        html += '⚠️ Baseado na EC 132/2023 e LC 214/2025. Alíquotas definitivas dependem de regulamentação.';
        html += '</div>';

        container.innerHTML = html;
    }

    // ═══════════════════════════════════════════════════════════════
    //  EXPORTAÇÃO
    // ═══════════════════════════════════════════════════════════════

    var API = {
        render: render,
        renderPF: renderPF,
        classificarSetor: classificarSetor,
        getTipoAtividade: getTipoAtividade,
        projetarTransicao: projetarTransicao,
        TIMELINE: TIMELINE,
        IVA_TOTAL: IVA_TOTAL,
        CBS_REF: CBS_REF,
        IBS_REF: IBS_REF,
    };

    if (typeof module !== "undefined" && module.exports) {
        module.exports = API;
    }

    window.ReformaTributaria = API;
    return API;
})();
