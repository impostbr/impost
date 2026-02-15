/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AMAZONAS.JS — Base de Dados Tributária Completa do Estado do Amazonas
 * Versão 3.0 — Padronizado conforme modelo roraima.js
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * FONTES:
 *   • SEFAZ/AM — www.sefaz.am.gov.br
 *   • SEFAZ Online — online.sefaz.am.gov.br
 *   • LC nº 19/1997 (ICMS — Lei base)
 *   • Lei nº 11.999/2024 (ICMS 20%)
 *   • LC nº 269/2024 (alterações ICMS)
 *   • LC nº 281/2025 (alterações ICMS)
 *   • LC nº 280/2025 (IPVA — redução 50% em 2026)
 *   • Lei nº 2.833/2021 (ISS Manaus)
 *   • Decreto nº 5.962/2024 (Regulamentação ISS Manaus)
 *   • Decreto nº 61.244/1967 (Zona Franca de Manaus)
 *   • Receita Federal — www.gov.br/receitafederal
 *   • LC nº 214/2025 (Reforma Tributária — IBS/CBS)
 *
 * ATUALIZAÇÃO: 09/02/2026
 * ═══════════════════════════════════════════════════════════════════════════
 */

const AMAZONAS_TRIBUTARIO = {

    // ═══════════════════════════════════════════════════════════════
    //  DADOS GERAIS
    // ═══════════════════════════════════════════════════════════════

    dados_gerais: {
        estado: "Amazonas",
        sigla: "AM",
        regiao: "Norte",
        capital: "Manaus",
        codigo_ibge: 13,
        zona_franca: true,
        zona_franca_nome: "Zona Franca de Manaus (ZFM)",
        zona_franca_abrangencia: "Município de Manaus",
        alc_associadas: ["Boa Vista e Bonfim (RR)"],
        abrangencia_sudam: true,
        abrangencia_sudene: false,
        site_sefaz: "https://www.sefaz.am.gov.br/",
        portal_sefaz_online: "https://online.sefaz.am.gov.br/",
    },


    // ═══════════════════════════════════════════════════════════════
    //  ICMS — IMPOSTO SOBRE CIRCULAÇÃO DE MERCADORIAS E SERVIÇOS
    // ═══════════════════════════════════════════════════════════════

    icms: {

        // ─── Alíquotas Internas ───
        aliquota_padrao: 0.20,
        aliquota_padrao_descricao: "20% (aumentada de 18% em 2023 — vigência a partir de 20/03/2025)",
        vigencia_inicio: "2025-03-20",

        aliquotas_diferenciadas: {
            // Dados parcialmente localizados — pesquisa adicional necessária
            obs: "Alíquotas diferenciadas disponíveis na SEFAZ/AM — verificar legislação específica",
        },

        // ─── Alíquotas Interestaduais ───
        interestaduais: {
            para_norte_ne_co_es:    0.12,  // N/NE/CO + ES
            para_sul_sudeste:       0.07,  // S/SE exceto ES
            para_nao_contribuinte:  0.20,  // EC 87/2015
        },

        // ─── Importação ───
        importacao: {
            aliquota_geral: 0.20,
        },

        // ─── FECOP (Fundo de Combate à Pobreza) ───
        fecop: {
            existe: false,
            adicional: 0,
            obs: "Verificar legislação atualizada na SEFAZ/AM",
        },

        // ─── Substituição Tributária ───
        substituicao_tributaria: {
            aplicavel: true,
            obs: "Conforme Convênios ICMS — verificar por categoria na SEFAZ/AM",
        },

        // ─── Legislação ───
        legislacao: [
            { norma: "Lei Complementar nº 19/1997",    assunto: "ICMS — Lei base" },
            { norma: "Lei nº 11.999/2024",              assunto: "ICMS aumentado para 20%" },
            { norma: "Lei Complementar nº 269/2024",    assunto: "Alterações ICMS" },
            { norma: "Lei Complementar nº 281/2025",    assunto: "Alterações ICMS recentes" },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  IPVA — IMPOSTO SOBRE PROPRIEDADE DE VEÍCULOS AUTOMOTORES
    // ═══════════════════════════════════════════════════════════════

    ipva: {

        // ─── Alíquotas 2026 (pós-redução LC 280/2025 — 50% de redução) ───
        aliquotas_2026: {
            ate_1000cc_eletricos_hibridos:   0.015,   // 1,5% (era 3%)
            acima_1000cc:                    0.02,    // 2,0% (era 4%)
            motocicletas_ate_180cc:          0,       // ISENTAS (era ~1,75%)
            caminhoes_onibus_micro:          0.015,   // 1,5%
        },

        // ─── Alíquotas 2025 (anteriores à redução — referência) ───
        aliquotas_2025: {
            automoveis_passeio:              0.03,    // 3%
            motocicletas_acima_180cc:        0.035,   // 3,5%
            acima_1000cc:                    0.04,    // 4%
        },

        isencoes: [
            "Motocicletas até 180 cilindradas (a partir de 2026)",
            "Veículos com mais de 20 anos de fabricação",
            "Veículos para PCD (Pessoa com Deficiência)",
            "Táxis",
            "Veículos oficiais",
        ],

        base_calculo: "Tabela FIPE (Fundação Instituto de Pesquisas Econômicas)",

        calendario: {
            escalonamento: "Por final de placa",
        },

        descontos: {
            cota_unica: { desconto: null, obs: "Conforme legislação — verificar SEFAZ/AM" },
            parcelamento: { max_parcelas: 12 },
        },

        destaque: "Amazonas com IPVA mais barato do Brasil em 2026 (redução de 50%)",

        legislacao: [
            { norma: "Lei Complementar nº 280/2025",   assunto: "Redução IPVA 50% — vigência 2026" },
            { norma: "Lei Complementar nº 19/1997",     assunto: "Legislação base anterior" },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  ITCMD — IMPOSTO TRANSMISSÃO CAUSA MORTIS E DOAÇÃO
    // ═══════════════════════════════════════════════════════════════

    itcmd: {
        dados_disponiveis: false,
        obs: "Dados não localizados — verificar diretamente na SEFAZ/AM",
    },


    // ═══════════════════════════════════════════════════════════════
    //  ISS — IMPOSTO SOBRE SERVIÇOS (Manaus — referência)
    // ═══════════════════════════════════════════════════════════════

    iss: {
        municipio_referencia: "Manaus",

        aliquotas: {
            minima: 0.02,
            maxima: 0.05,
            geral: 0.05,
        },

        por_tipo_servico: {

            // ─── Construção Civil ───
            construcao_civil: {
                aliquota: 0.05,
                servicos: [
                    "Execução por administração, empreitada ou subempreitada de obras de construção civil",
                ],
            },

            // ─── Informática ───
            informatica: {
                aliquota: 0.05,
                obs: "Conforme tabela específica — verificar portal NFS-e Manaus",
            },

            // ─── Saúde ───
            saude: {
                aliquota: null,
                obs: "Conforme tabela específica — verificar portal NFS-e Manaus",
            },

            // ─── Educação ───
            educacao: {
                aliquota: null,
                obs: "Conforme tabela específica — verificar portal NFS-e Manaus",
            },

            // ─── Contabilidade e Advocacia ───
            contabilidade_advocacia: {
                aliquota: null,
                obs: "Conforme tabela específica — verificar portal NFS-e Manaus",
            },

            // ─── Profissionais Autônomos ───
            autonomos_nao_inscritos: {
                aliquota: 0.05,
                servicos: ["Profissionais autônomos não inscritos"],
            },
        },

        portal_aliquotas: "https://nfse-prd.manaus.am.gov.br/nfse/servlet/hwmlistaservicos",

        legislacao: [
            { norma: "Lei nº 2.833/2021",               assunto: "ISS Manaus — Lei atual" },
            { norma: "Decreto nº 5.962/2024",            assunto: "Regulamentação ISS Manaus" },
            { norma: "Lei nº 2.251/2017",                assunto: "ISS Manaus — Lei anterior (revogada)" },
            { norma: "Lei Complementar nº 116/2003",     assunto: "Federal — normas gerais ISS" },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  IPTU — IMPOSTO PREDIAL E TERRITORIAL URBANO (Manaus)
    // ═══════════════════════════════════════════════════════════════

    iptu: {
        municipio_referencia: "Manaus",
        dados_disponiveis: false,
        obs: "Dados não localizados — verificar diretamente na Prefeitura Municipal de Manaus (SEMEF)",
    },


    // ═══════════════════════════════════════════════════════════════
    //  ITBI — IMPOSTO TRANSMISSÃO DE BENS IMÓVEIS (Manaus)
    // ═══════════════════════════════════════════════════════════════

    itbi: {
        municipio_referencia: "Manaus",
        dados_disponiveis: false,
        obs: "Dados não localizados — verificar diretamente na Prefeitura Municipal de Manaus (SEMEF)",
    },


    // ═══════════════════════════════════════════════════════════════
    //  8. TAXAS ESTADUAIS E MUNICIPAIS
    // ═══════════════════════════════════════════════════════════════

    taxas: {
        estaduais: {
            dados_disponiveis: false,
            obs: "Dados parcialmente localizados — necessário pesquisa adicional",
        },
        municipais_manaus: {
            municipio_referencia: "Manaus",
            taxa_lixo: { dados_disponiveis: false },
            taxa_alvara: { dados_disponiveis: false },
            cosip: { dados_disponiveis: false },
        },
    },


    // ═══════════════════════════════════════════════════════════════
    //  9. IMPOSTOS FEDERAIS (aplicáveis no AM)
    // ═══════════════════════════════════════════════════════════════

    federal: {

        // ─── IRPJ ───
        irpj: {
            lucro_real: {
                aliquota_base: 0.15,
                adicional: { aliquota: 0.10, limite_mensal: 20000, limite_anual: 240000 },
                aliquota_efetiva_maxima: 0.25,
            },
            lucro_presumido: {
                aliquota_base: 0.15,
                presuncao_lucro: {
                    comercio:                0.08,
                    servicos_geral:          0.32,
                    transporte_passageiros:  0.16,
                    revenda_combustiveis:    0.016,
                    servicos_hospitalares:   0.08,
                    min: 0.08,
                    max: 0.32,
                },
                adicional: { aliquota: 0.10, limite_mensal: 20000 },
                alteracao_2026: "LC nº 224/2025 aumentou presunção em 10% para receita acima de R$ 5M",
            },
        },

        // ─── CSLL ───
        csll: {
            aliquota_geral: 0.09,
            instituicoes_financeiras: 0.15,
            seguradoras: 0.15,
        },

        // ─── PIS/PASEP ───
        pis: {
            cumulativo: 0.0076,
            nao_cumulativo: 0.0165,
            importacao: 0.0165,
            cesta_basica: 0,
        },

        // ─── COFINS ───
        cofins: {
            cumulativo: 0.03,
            nao_cumulativo: 0.076,
            importacao: 0.076,
            cesta_basica: 0,
        },

        // ─── IPI ───
        ipi: {
            referencia: "Tabela TIPI vigente",
            faixa_min: 0,
            faixa_max: 0.35,
            isencoes_zona_franca: true,
            obs_zfm: "Suspensão do IPI em operações internas na ZFM",
        },

        // ─── IOF ───
        iof: {
            credito_pf:      { min: 0.0038, max: 0.0338 },
            credito_pj:      { min: 0.0038, max: 0.0163 },
            cambio:            0.0038,
            seguros:         { min: 0, max: 0.25 },
            titulos_valores: { min: 0, max: 0.25 },
        },

        // ─── Imposto de Importação ───
        imposto_importacao: {
            referencia: "Tarifa Externa Comum (TEC)",
            beneficios_zfm: "Isenção de II em determinados casos na ZFM",
        },

        // ─── Imposto de Exportação ───
        imposto_exportacao: {
            aliquota_geral: 0,
        },

        // ─── ITR ───
        itr: {
            faixa_min: 0.0003,
            faixa_max: 0.20,
            base: "Valor da terra nua x grau de utilização x tamanho",
            isencoes: ["Pequena propriedade familiar"],
        },

        // ─── INSS / Contribuições Previdenciárias ───
        inss: {
            patronal: { min: 0.20, max: 0.288 },
            rat_sat:  { min: 0.005, max: 0.03 },
            terceiros_sistema_s: { min: 0.025, max: 0.033 },
            empregado: { min: 0.08, max: 0.11, obs: "Tabela progressiva" },
        },

        // ─── FGTS ───
        fgts: {
            aliquota: 0.08,
            multa_rescisoria: 0.40,
        },

        // ─── IRPF ───
        irpf: {
            tabela_mensal_2025: [
                { ate: 2112.00,   aliquota: 0,      deducao: 0 },
                { ate: 2826.65,   aliquota: 0.075,   deducao: 158.40 },
                { ate: 3751.05,   aliquota: 0.15,    deducao: 370.40 },
                { ate: 4664.68,   aliquota: 0.225,   deducao: 651.73 },
                { ate: Infinity,  aliquota: 0.275,   deducao: 884.96 },
            ],
        },
    },


    // ═══════════════════════════════════════════════════════════════
    //  SIMPLES NACIONAL (aplicável no AM)
    // ═══════════════════════════════════════════════════════════════

    simples_nacional: {

        sublimite_estadual: 3600000,
        adota_sublimite: true,

        mei: {
            limite_anual: 81000,
            obs: "DAS mensal conforme tabela vigente",
        },

        anexos: {

            // Anexo I — Comércio
            anexo_I: {
                nome: "Comércio",
                faixas: [
                    { faixa: 1, limite: 180000,   aliquota: 0.04,    deducao: 0 },
                    { faixa: 2, limite: 360000,   aliquota: 0.073,   deducao: 5940 },
                    { faixa: 3, limite: 540000,   aliquota: 0.095,   deducao: 13860 },
                    { faixa: 4, limite: 720000,   aliquota: 0.105,   deducao: 19260 },
                    { faixa: 5, limite: 900000,   aliquota: 0.1161,  deducao: 28530 },
                ],
            },

            // Anexo II — Indústria
            anexo_II: {
                nome: "Indústria",
                faixas: [
                    { faixa: 1, limite: 180000,   aliquota: 0.045,   deducao: 0 },
                    { faixa: 2, limite: 360000,   aliquota: 0.078,   deducao: 5940 },
                    { faixa: 3, limite: 540000,   aliquota: 0.10,    deducao: 13860 },
                    { faixa: 4, limite: 720000,   aliquota: 0.112,   deducao: 22500 },
                    { faixa: 5, limite: 900000,   aliquota: 0.135,   deducao: 39780 },
                ],
            },

            // Anexo III — Serviços
            anexo_III: {
                nome: "Serviços",
                faixa_aliquota: { min: 0.06, max: 0.33 },
            },

            // Anexo IV — Serviços (Específicos)
            anexo_IV: {
                nome: "Serviços (Específicos)",
                faixa_aliquota: { min: 0.045, max: 0.1685 },
            },

            // Anexo V — Serviços (Específicos)
            anexo_V: {
                nome: "Serviços (Específicos)",
                faixa_aliquota: { min: 0.155, max: 0.2885 },
            },
        },
    },


    // ═══════════════════════════════════════════════════════════════
    //  INCENTIVOS FISCAIS E BENEFÍCIOS REGIONAIS
    // ═══════════════════════════════════════════════════════════════

    incentivos: {

        // ─── SUDAM ───
        sudam: {
            ativo: true,
            reducao_irpj: {
                percentual: 0.75,
                aliquota_efetiva: 0.075,
                prazo_pleitos: "2028-12-31",
                setores_prioritarios: "Conforme Decreto nº 4.212/2002",
            },
            reinvestimento_30: {
                beneficio: "Reinvestimento obrigatório de 30% do IRPJ em projetos regionais",
            },
        },

        // ─── Zona Franca de Manaus ───
        zfm: {
            nome: "Zona Franca de Manaus (ZFM)",
            abrangencia: "Município de Manaus",
            beneficios_fiscais: {
                ipi:    "Suspensão do IPI em operações internas",
                icms:   "Redução/Isenção de ICMS (até 88% de redução)",
                ii:     "Isenção de II em determinados casos",
                pis:    "Benefícios em PIS — alíquota diferenciada 0,65%",
                cofins: "Benefícios em COFINS — alíquota diferenciada 3%",
            },
            legislacao: "Decreto nº 61.244/1967 (Planalto)",
            vigencia: "Prorrogada até 2073 (EC nº 83/2014)",
        },

        // ─── SUFRAMA ───
        suframa: {
            pis_diferenciado: 0.0065,      // 0,65% (redução ~60%)
            cofins_diferenciado: 0.03,     // 3% (redução ~60%)
            obs: "Para operações dentro da Zona Franca de Manaus",
        },

        // ─── ALCs Associadas ───
        alcs_associadas: {
            lista: ["Boa Vista e Bonfim (RR)"],
            obs: "Benefícios similares à ZFM",
        },

        // ─── Programas Estaduais ───
        programas_estaduais: {
            dados_disponiveis: false,
            obs: "Necessário pesquisa adicional na SEFAZ/AM",
        },
    },


    // ═══════════════════════════════════════════════════════════════
    //  REFORMA TRIBUTÁRIA (Impactos previstos para o AM)
    // ═══════════════════════════════════════════════════════════════

    reforma_tributaria: {
        legislacao: "Lei Complementar nº 214/2025",

        ibs: {
            nome: "Imposto sobre Bens e Serviços",
            aliquota_estadual: null,
            obs: "Conforme regulamentação — implementação gradual",
        },

        cbs: {
            nome: "Contribuição sobre Bens e Serviços",
            aliquota_federal: null,
            obs: "Substituirá PIS e COFINS gradualmente",
        },

        is: {
            nome: "Imposto Seletivo",
            produtos: ["Bebidas alcoólicas", "Cigarros", "Combustíveis", "Veículos"],
            aliquotas: "Conforme produto — regulamentação pendente",
        },

        impactos_amazonas: {
            manutencao_zfm: "ZFM mantida com tratamento diferenciado na Reforma Tributária",
            fundo_desenvolvimento_regional: "Previsão em regulamentação",
            obs: "Impactos ainda em análise — ZFM tem proteção constitucional até 2073",
        },
    },


    // ═══════════════════════════════════════════════════════════════
    //  DADOS DE COBERTURA (controle de qualidade da pesquisa)
    // ═══════════════════════════════════════════════════════════════

    cobertura: {
        versao: "3.0",
        data_atualizacao: "2026-02-10",
        localizados: [
            "Dados gerais do Amazonas (IBGE, SEFAZ, ZFM)",
            "ICMS (alíquota padrão 20%, interestaduais)",
            "IPVA 2026 (1,5% até 1.000cc, 2% acima, 0% motos até 180cc — redução 50%)",
            "ISS Manaus (alíquota geral 5%)",
            "Incentivos SUDAM (redução 75% IRPJ)",
            "Zona Franca de Manaus (benefícios fiscais — IPI, ICMS, II, PIS, COFINS)",
            "Reforma Tributária (LC nº 214/2025)",
            "Impostos Federais (IRPJ, CSLL, PIS, COFINS, IPI, IOF, II, IE, ITR, INSS, FGTS, IRPF)",
            "Simples Nacional (tabelas e alíquotas)",
        ],
        nao_localizados: [
            "ITCMD — alíquotas e base legal",
            "Taxas estaduais específicas",
            "IPTU Manaus — alíquotas",
            "ITBI Manaus — alíquotas",
            "ICMS — alíquotas diferenciadas completas (cesta básica, energia, telecom, etc.)",
            "ISS Manaus — tabela completa de alíquotas por serviço",
            "Programas estaduais de incentivo fiscal específicos",
            "Taxas municipais Manaus (lixo, alvará, COSIP)",
        ],
        contatos_para_completar: [
            { orgao: "SEFAZ/AM", url: "https://www.sefaz.am.gov.br/", tel: null },
            { orgao: "Prefeitura de Manaus (SEMEF)", url: null, tel: null },
            { orgao: "Portal NFS-e Manaus", url: "https://nfse-prd.manaus.am.gov.br/nfse/servlet/hwmlistaservicos", tel: null },
            { orgao: "Receita Federal", url: "https://www.gov.br/receitafederal", tel: null },
        ],
    },
};


// ═══════════════════════════════════════════════════════════════════════════
//  FUNÇÕES UTILITÁRIAS — AMAZONAS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Retorna a alíquota de ISS para um tipo de serviço em Manaus.
 * @param {string} tipo - Chave: "informatica", "construcao_civil", etc.
 * @returns {number} Alíquota (ex: 0.05 = 5%)
 */
function getISSAmazonas(tipo) {
    const servico = AMAZONAS_TRIBUTARIO.iss.por_tipo_servico[tipo];
    if (servico && servico.aliquota !== null) return servico.aliquota;
    return AMAZONAS_TRIBUTARIO.iss.aliquotas.geral;
}

/**
 * Retorna alíquota IPVA 2026 por tipo de veículo.
 * @param {string} tipo - "ate_1000cc", "acima_1000cc", "moto_ate_180cc", "caminhao_onibus"
 * @returns {number}
 */
function getIPVAAmazonas2026(tipo) {
    const map = {
        ate_1000cc:      AMAZONAS_TRIBUTARIO.ipva.aliquotas_2026.ate_1000cc_eletricos_hibridos,
        eletrico:        AMAZONAS_TRIBUTARIO.ipva.aliquotas_2026.ate_1000cc_eletricos_hibridos,
        hibrido:         AMAZONAS_TRIBUTARIO.ipva.aliquotas_2026.ate_1000cc_eletricos_hibridos,
        acima_1000cc:    AMAZONAS_TRIBUTARIO.ipva.aliquotas_2026.acima_1000cc,
        moto_ate_180cc:  AMAZONAS_TRIBUTARIO.ipva.aliquotas_2026.motocicletas_ate_180cc,
        caminhao_onibus: AMAZONAS_TRIBUTARIO.ipva.aliquotas_2026.caminhoes_onibus_micro,
    };
    return map[tipo] ?? AMAZONAS_TRIBUTARIO.ipva.aliquotas_2026.acima_1000cc;
}

/**
 * Verifica se uma operação está dentro da ZFM.
 * @param {string} municipio - Nome do município
 * @returns {boolean}
 */
function isZFM(municipio) {
    return municipio?.trim().toLowerCase() === "manaus";
}

/**
 * Retorna o percentual efetivo de redução IRPJ via SUDAM.
 * @returns {number} 0.75 = 75% de redução
 */
function getReducaoSUDAMAmazonas() {
    return AMAZONAS_TRIBUTARIO.incentivos.sudam.ativo
        ? AMAZONAS_TRIBUTARIO.incentivos.sudam.reducao_irpj.percentual
        : 0;
}

/**
 * Retorna benefícios fiscais da ZFM por tributo.
 * @returns {object}
 */
function getBeneficiosZFM() {
    return AMAZONAS_TRIBUTARIO.incentivos.zfm.beneficios_fiscais;
}

/**
 * Calcula ICMS efetivo (padrão + FECOP) do Amazonas.
 * @returns {number}
 */
function getICMSEfetivoAmazonas() {
    return AMAZONAS_TRIBUTARIO.icms.aliquota_padrao + AMAZONAS_TRIBUTARIO.icms.fecop.adicional;
}

/**
 * Resumo rápido dos tributos do Amazonas para exibição.
 * @returns {object}
 */
function resumoTributarioAmazonas() {
    return {
        estado: "Amazonas (AM)",
        icms_padrao: (AMAZONAS_TRIBUTARIO.icms.aliquota_padrao * 100).toFixed(0) + "%",
        icms_efetivo: (getICMSEfetivoAmazonas() * 100).toFixed(0) + "%",
        fecop: (AMAZONAS_TRIBUTARIO.icms.fecop.adicional * 100).toFixed(0) + "%",
        ipva_ate_1000cc: (AMAZONAS_TRIBUTARIO.ipva.aliquotas_2026.ate_1000cc_eletricos_hibridos * 100).toFixed(1) + "%",
        ipva_acima_1000cc: (AMAZONAS_TRIBUTARIO.ipva.aliquotas_2026.acima_1000cc * 100).toFixed(1) + "%",
        ipva_moto_180cc: "ISENTO",
        iss_padrao: (AMAZONAS_TRIBUTARIO.iss.aliquotas.geral * 100).toFixed(0) + "%",
        sudam: AMAZONAS_TRIBUTARIO.incentivos.sudam.ativo ? "75% redução IRPJ" : "N/A",
        zfm: "Zona Franca de Manaus — IPI, ICMS, II, PIS, COFINS",
        sublimite_simples: "R$ " + AMAZONAS_TRIBUTARIO.simples_nacional.sublimite_estadual.toLocaleString("pt-BR"),
    };
}


// ═══════════════════════════════════════════════════════════════════════════
//  15. EXPORTAÇÃO (Padrão Grupo 2)
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        ...AMAZONAS_TRIBUTARIO,
        utils: {
            getISS: getISSAmazonas,
            getIPVA: getIPVAAmazonas2026,
            isZFM: isZFM,
            getReducaoSUDAM: getReducaoSUDAMAmazonas,
            getBeneficiosZFM: getBeneficiosZFM,
            getICMSEfetivo: getICMSEfetivoAmazonas,
            resumoTributario: resumoTributarioAmazonas,
        },
    };
}

if (typeof window !== "undefined") {
    window.AMAZONAS_TRIBUTARIO = AMAZONAS_TRIBUTARIO;
    window.AmazonasTributario = {
        getISS: getISSAmazonas,
        getIPVA: getIPVAAmazonas2026,
        isZFM: isZFM,
        getReducaoSUDAM: getReducaoSUDAMAmazonas,
        getBeneficiosZFM: getBeneficiosZFM,
        getICMSEfetivo: getICMSEfetivoAmazonas,
        resumo: resumoTributarioAmazonas,
    };
}
