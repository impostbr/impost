/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ACRE.JS — Base de Dados Tributária Completa do Estado do Acre
 * Versão 3.0 — Padronizado conforme modelo roraima.js
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * FONTES:
 *   • SEFAZ/AC — www.sefaz.ac.gov.br
 *   • SEFAZ Online — www.sefazonline.ac.gov.br
 *   • LC nº 55/1997 (ICMS)
 *   • LC nº 481/2024 (ICMS importação)
 *   • LC nº 483/2024 (IPVA)
 *   • LC nº 510/2026 (alterações recentes)
 *   • LC nº 1.508/2003 (Código Tributário Municipal de Rio Branco)
 *   • LC nº 361/2026 (isenções IPTU)
 *   • Decreto nº 008/1998 (RICMS/AC)
 *   • Decreto nº 15.503/2006 (ALC Cruzeiro do Sul)
 *   • Portaria SEFAZ nº 751/2025 (IPVA calendário)
 *   • Receita Federal — www.gov.br/receitafederal
 *   • LC nº 214/2025 (Reforma Tributária — IBS/CBS)
 *
 * ATUALIZAÇÃO: 09/02/2026
 * ═══════════════════════════════════════════════════════════════════════════
 */

const ACRE_TRIBUTARIO = {

    // ═══════════════════════════════════════════════════════════════
    //  1. DADOS GERAIS
    // ═══════════════════════════════════════════════════════════════

    dados_gerais: {
        estado: "Acre",
        sigla: "AC",
        regiao: "Norte",
        capital: "Rio Branco",
        codigo_ibge: 12,
        zona_franca_alc: true,
        alc_nome: "Área de Livre Comércio de Cruzeiro do Sul",
        alc_municipios: ["Cruzeiro do Sul"],
        alc_expansao_prevista: ["Mâncio Lima", "Rodrigues Alves"],
        abrangencia_sudam: true,
        abrangencia_sudene: false,
        site_sefaz: "https://www.sefaz.ac.gov.br/",
        portal_sefaz_online: "http://www.sefazonline.ac.gov.br/",
        telefone_sefaz: "(68) 3212-7707 / 3212-7705",
    },


    // ═══════════════════════════════════════════════════════════════
    //  2. ICMS — IMPOSTO SOBRE CIRCULAÇÃO DE MERCADORIAS E SERVIÇOS
    // ═══════════════════════════════════════════════════════════════

    icms: {

        // ─── Alíquotas Internas ───
        aliquota_padrao: 0.19,
        aliquota_padrao_descricao: "19% (aumentada de 17% em 2023)",

        aliquotas_diferenciadas: {
            cesta_basica:         { aliquota: 0.07, obs: "Com redução da base de cálculo de 58,82%" },
            combustiveis:         { aliquota: null,  obs: "Regime Monofásico (pós-reforma tributária)" },
            energia_eletrica:     { aliquota: null,  obs: "Alíquotas diferenciadas conforme consumo" },
            telecomunicacoes:     { aliquota: 0.19,  obs: "Mesma alíquota padrão" },
            medicamentos:         { aliquota: null,  obs: "Alíquotas reduzidas — verificar legislação específica" },
        },

        // ─── Alíquotas Interestaduais ───
        interestaduais: {
            para_norte_ne_co_es:    0.12,  // N/NE/CO + ES
            para_sul_sudeste:       0.07,  // S/SE exceto ES
            para_nao_contribuinte:  0.19,  // EC 87/2015
        },

        // ─── Importação ───
        importacao: {
            aliquota_geral:      0.19,
            remessas_postais:    0.20,  // A partir de 01/04/2025
            remessas_postais_inicio: "2025-04-01",
        },

        // ─── FECOP (Fundo de Combate à Pobreza) ───
        fecop: {
            existe: true,
            adicional: 0.02,
            obs: "2% adicional de ICMS em operações internas (com exceções)",
        },

        // ─── Substituição Tributária ───
        substituicao_tributaria: {
            aplicavel: true,
            produtos_sujeitos: [
                "Combustíveis",
                "Energia elétrica",
                "Bebidas",
                "Cigarros",
                "Pneus",
            ],
            mva: "Conforme Convênios ICMS — verificar por categoria",
        },

        // ─── Legislação ───
        legislacao: [
            { norma: "Lei Complementar nº 55/1997",   assunto: "ICMS — Lei base" },
            { norma: "Decreto nº 008/1998",            assunto: "RICMS/AC — Regulamento" },
            { norma: "Lei Complementar nº 481/2024",   assunto: "ICMS importação remessas postais/expressas" },
            { norma: "Lei Complementar nº 510/2026",   assunto: "Alterações recentes" },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  3. IPVA — IMPOSTO SOBRE PROPRIEDADE DE VEÍCULOS AUTOMOTORES
    // ═══════════════════════════════════════════════════════════════

    ipva: {

        aliquotas: {
            automoveis_passeio_esporte_corrida: 0.02,   // 2,0%
            demais_veiculos:                    0.01,   // 1,0% (motos, caminhões, ônibus, aéreos, aquáticos)
        },

        isencoes: [
            "Veículos com 20 anos ou mais de fabricação",
            "Veículos elétricos e híbridos",
            "Motocicletas até 170 cilindradas",
            "Veículos para PCD (Pessoa com Deficiência)",
            "Táxis (conforme legislação específica)",
            "Veículos oficiais",
        ],

        base_calculo: "Tabela FIPE (Fundação Instituto de Pesquisas Econômicas)",

        calendario: {
            escalonamento: "Por final de placa",
            primeiro_pagamento: "Março (placas 1 e 2)",
            ultimo_pagamento: "Outubro",
        },

        descontos: {
            cota_unica: { desconto: 0.03, obs: "3% se pago até janeiro" },
            parcelamento: { max_parcelas: 12 },
        },

        legislacao: [
            { norma: "Lei Complementar nº 483/2024",       assunto: "Alíquotas IPVA" },
            { norma: "Portaria SEFAZ nº 751/2025",         assunto: "Calendário de vencimento" },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  4. ITCMD — IMPOSTO TRANSMISSÃO CAUSA MORTIS E DOAÇÃO
    // ═══════════════════════════════════════════════════════════════

    itcmd: {
        dados_disponiveis: false,
        obs: "Dados não localizados — verificar diretamente na SEFAZ/AC",
    },


    // ═══════════════════════════════════════════════════════════════
    //  5. ISS — IMPOSTO SOBRE SERVIÇOS (Rio Branco — referência)
    // ═══════════════════════════════════════════════════════════════

    iss: {
        municipio_referencia: "Rio Branco",

        aliquotas: {
            minima: 0.02,
            maxima: 0.05,
            mais_comum: 0.05,
        },

        por_tipo_servico: {

            // ─── Informática e Congêneres ───
            informatica: {
                aliquota: 0.05,
                servicos: [
                    "Análise e desenvolvimento de sistemas",
                    "Programação",
                    "Processamento de dados e congêneres",
                    "Elaboração de programas de computadores",
                    "Licenciamento ou cessão de direito de uso de programação",
                    "Assessoria e consultoria em informática",
                    "Suporte técnico em informática",
                    "Planejamento, confecção, manutenção e atualização de páginas eletrônicas",
                ],
            },

            // ─── Pesquisa e Desenvolvimento ───
            pesquisa_desenvolvimento: {
                aliquota: 0.05,
                servicos: [
                    "Serviços de pesquisa e desenvolvimento de qualquer natureza",
                ],
            },

            // ─── Locação/Cessão de Direito ───
            locacao_cessao: {
                aliquota: 0.05,
                servicos: [
                    "Cessão de direito de uso de marcas e sinais de propaganda",
                    "Exploração de salões de festas, centros de convenções, escritórios virtuais, stands",
                    "Locação, sublocação, arrendamento, direito de passagem ou permissão de uso",
                    "Cessão de andaimes, palcos, coberturas e outras estruturas de uso temporário",
                ],
            },

            // ─── Saúde e Assistência Médica ───
            saude: {
                aliquota: 0.03,
                servicos: [
                    "Medicina e biomedicina",
                    "Análises clínicas, patologia, eletricidade médica, radioterapia, quimioterapia",
                    "Hospitais, clínicas, laboratórios, sanatórios, manicômios, casas de saúde",
                    "Instrumentação cirúrgica",
                    "Acupuntura",
                    "Enfermagem, inclusive serviços auxiliares",
                    "Serviços farmacêuticos",
                    "Terapia ocupacional, fisioterapia e fonoaudiologia",
                    "Terapias de qualquer espécie (tratamento físico, orgânico e mental)",
                    "Nutrição",
                    "Obstetrícia",
                    "Odontologia",
                    "Ortóptica",
                    "Próteses sob encomenda",
                    "Psicanálise",
                    "Psicologia",
                    "Casas de repouso e de recuperação, creches, asilos e congêneres",
                    "Inseminação artificial, fertilização in vitro e congêneres",
                    "Bancos de sangue, leite, tecidos, órgãos e materiais biológicos",
                    "Coleta de sangue, leite, tecidos, órgãos e materiais biológicos",
                    "Unidade de atendimento, assistência ou tratamento móvel",
                    "Planos de medicina de grupo ou individual",
                    "Outros planos de saúde através de serviços de terceiros contratados",
                ],
            },

            // ─── Construção Civil ───
            construcao_civil: {
                aliquota: 0.05,
                servicos: [
                    "Execução por administração, empreitada ou subempreitada de obras de construção civil, hidráulica ou elétrica",
                ],
            },
        },

        legislacao: [
            { norma: "Lei nº 1.508/2003",          assunto: "Código Tributário Municipal de Rio Branco" },
            { norma: "Lei Complementar nº 116/2003", assunto: "Federal — normas gerais ISS" },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  6. IPTU — IMPOSTO PREDIAL E TERRITORIAL URBANO (Rio Branco)
    // ═══════════════════════════════════════════════════════════════

    iptu: {
        municipio_referencia: "Rio Branco",

        residencial: [
            { ate_m2: 100,   aliquota: 0.003 },  // 0,30%
            { ate_m2: 350,   aliquota: 0.003 },  // 0,30%
            { ate_m2: 700,   aliquota: 0.005 },  // 0,50%
            { ate_m2: null,  aliquota: 0.010 },  // 1,00% (acima de 700 m²)
        ],

        comercial: [
            { ate_m2: 100,   aliquota: 0.03 },   // 3,00%
            { ate_m2: 350,   aliquota: 0.03 },   // 3,00%
            { ate_m2: 700,   aliquota: 0.05 },   // 5,00%
            { ate_m2: null,  aliquota: 0.10 },   // 10,00% (acima de 700 m²)
        ],

        terreno_nao_edificado: {
            dados_disponiveis: false,
            obs: "Verificar tabela específica na Prefeitura",
        },

        descontos: {
            cota_unica: { desconto: 0.20, obs: "Até 20% para pagamento à vista" },
            parcelamento: true,
        },

        isencoes: [
            "Imóveis de PCD (Pessoa com Deficiência)",
            "Viúvas/viúvos",
            "Órfãos menores",
            "Pessoas com TEA (Lei Complementar nº 361/2026)",
        ],

        base_calculo: "Valor venal conforme Planta Genérica de Valores (PGV)",

        legislacao: [
            { norma: "Lei Complementar nº 1.508/2003", assunto: "Código Tributário Municipal" },
            { norma: "Lei Complementar nº 361/2026",    assunto: "Isenções IPTU — PCD, TEA" },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  7. ITBI — IMPOSTO TRANSMISSÃO DE BENS IMÓVEIS (Rio Branco)
    // ═══════════════════════════════════════════════════════════════

    itbi: {
        municipio_referencia: "Rio Branco",

        aliquotas: {
            geral: 0.02,                  // 2%
            sfh_financiado: 0.005,         // 0,5% sobre valor financiado
            sfh_nao_financiado: 0.02,      // 2% sobre valor não financiado
        },

        base_calculo: "Valor de avaliação do imóvel conforme laudo técnico",

        legislacao: [
            { norma: "Lei Complementar nº 1.508/2003",          assunto: "Código Tributário Municipal" },
            { norma: "Instrução Normativa SEFIN nº 9/2019",     assunto: "Procedimentos ITBI" },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  8. TAXAS ESTADUAIS E MUNICIPAIS
    // ═══════════════════════════════════════════════════════════════

    taxas: {
        estaduais: {
            dados_disponiveis: false,
            obs: "Dados parcialmente localizados — necessário pesquisa adicional",
        },
        municipais_rio_branco: {
            municipio_referencia: "Rio Branco",
            taxa_lixo: { dados_disponiveis: false },
            taxa_alvara: { dados_disponiveis: false },
            cosip: { dados_disponiveis: false },
        },
    },


    // ═══════════════════════════════════════════════════════════════
    //  9. IMPOSTOS FEDERAIS (aplicáveis no AC)
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
            cumulativo: 0.0076,           // 0,76% (Lucro Presumido)
            nao_cumulativo: 0.0165,        // 1,65% (Lucro Real)
            importacao: 0.0165,
            cesta_basica: 0,               // alíquota zero
        },

        // ─── COFINS ───
        cofins: {
            cumulativo: 0.03,              // 3%
            nao_cumulativo: 0.076,         // 7,6%
            importacao: 0.076,
            cesta_basica: 0,               // alíquota zero
        },

        // ─── IPI ───
        ipi: {
            referencia: "Tabela TIPI vigente",
            faixa_min: 0,
            faixa_max: 0.35,
            isencoes_zona_franca: true,
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
            beneficios_alc: "Redução ou isenção conforme produto/ALC",
        },

        // ─── Imposto de Exportação ───
        imposto_exportacao: {
            aliquota_geral: 0,
        },

        // ─── ITR ───
        itr: {
            faixa_min: 0.0003,   // 0,03%
            faixa_max: 0.20,     // 20%
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
    //  10. SIMPLES NACIONAL (aplicável no AC)
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
    //  11. INCENTIVOS FISCAIS E BENEFÍCIOS REGIONAIS
    // ═══════════════════════════════════════════════════════════════

    incentivos: {

        // ─── SUDAM ───
        sudam: {
            ativo: true,
            reducao_irpj: {
                percentual: 0.75,          // Até 75%
                aliquota_efetiva: 0.075,   // 7,5% efetivo (de 25% máx)
                prazo_pleitos: "2028-12-31",
                setores_prioritarios: "Conforme Decreto nº 4.212/2002",
            },
            isencao_inclusao_digital: {
                beneficio: "Isenção total de IRPJ para atividades de inclusão digital",
            },
            reinvestimento_30: {
                beneficio: "Reinvestimento obrigatório de 30% do IRPJ em projetos regionais",
            },
        },

        // ─── Área de Livre Comércio ───
        alc: {
            nome: "Área de Livre Comércio de Cruzeiro do Sul",
            municipios_abrangidos: ["Cruzeiro do Sul"],
            expansao_prevista: ["Mâncio Lima", "Rodrigues Alves"],
            expansao_status: "PL em votação no Senado em 2026",
            beneficios_fiscais: {
                icms: "Redução/Isenção",
                ipi:  "Redução/Isenção",
                ii:   "Redução/Isenção",
                pis:  "Redução/Isenção",
                cofins: "Redução/Isenção",
            },
            legislacao: "Decreto nº 15.503/2006",
        },

        // ─── SUFRAMA ───
        suframa: {
            pis_diferenciado: 0.0065,      // 0,65% (redução ~60%)
            cofins_diferenciado: 0.03,     // 3% (redução ~60%)
            obs: "Para operações dentro da Zona Franca de Manaus",
        },

        // ─── Programas Estaduais ───
        programas_estaduais: {
            dados_disponiveis: false,
            obs: "Necessário pesquisa adicional na SEFAZ/AC",
        },
    },


    // ═══════════════════════════════════════════════════════════════
    //  12. REFORMA TRIBUTÁRIA (Impactos previstos para o AC)
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

        impactos_acre: {
            manutencao_beneficios: "Sob análise",
            fundo_desenvolvimento_regional: "Previsão em regulamentação",
        },
    },


    // ═══════════════════════════════════════════════════════════════
    //  13. DADOS DE COBERTURA (controle de qualidade da pesquisa)
    // ═══════════════════════════════════════════════════════════════

    cobertura: {
        versao: "3.0",
        data_atualizacao: "2026-02-10",
        localizados: [
            "Dados gerais do Acre (IBGE, SEFAZ, ALC)",
            "ICMS (alíquota padrão 19%, diferenciadas, interestaduais)",
            "IPVA (alíquotas 2% e 1%, isenções, base de cálculo)",
            "ISS Rio Branco (alíquotas por tipo de serviço)",
            "IPTU Rio Branco (alíquotas residencial e comercial)",
            "ITBI Rio Branco (alíquota 2% geral, 0,5% SFH)",
            "Impostos Federais (IRPJ, CSLL, PIS, COFINS, IPI, IOF, II, IE, ITR, INSS, FGTS, IRPF)",
            "Simples Nacional (tabelas e alíquotas)",
            "Incentivos SUDAM (redução 75% IRPJ)",
            "Zona Franca/ALC (benefícios fiscais)",
            "Reforma Tributária (LC nº 214/2025)",
            "FECOP (2% adicional ICMS)",
        ],
        nao_localizados: [
            "ITCMD — alíquotas e base legal",
            "Taxas estaduais específicas (licenciamento, judiciária, SEFAZ, ambiental, bombeiros)",
            "Emolumentos cartorários",
            "FECOP — detalhes completos de incidência",
            "ICMS-ST — MVA completo por categoria",
            "Taxas municipais Rio Branco (lixo, alvará, COSIP)",
            "IPTU — alíquota terreno não edificado",
            "Programas estaduais de incentivo fiscal específicos",
        ],
        contatos_para_completar: [
            { orgao: "SEFAZ/AC", url: "https://www.sefaz.ac.gov.br/", tel: "(68) 3212-7707" },
            { orgao: "Prefeitura de Rio Branco (SEFIN)", url: null, tel: null },
            { orgao: "Receita Federal", url: "https://www.gov.br/receitafederal", tel: null },
        ],
    },
};


// ═══════════════════════════════════════════════════════════════════════════
//  14. FUNÇÕES UTILITÁRIAS — ACRE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Retorna a alíquota de ISS para um tipo de serviço em Rio Branco.
 * @param {string} tipo - Chave: "informatica", "saude", "construcao_civil", etc.
 * @returns {number} Alíquota (ex: 0.05 = 5%)
 */
function getISSAcre(tipo) {
    const servico = ACRE_TRIBUTARIO.iss.por_tipo_servico[tipo];
    return servico ? servico.aliquota : ACRE_TRIBUTARIO.iss.aliquotas.mais_comum;
}

/**
 * Retorna alíquota de IPTU residencial por área em Rio Branco.
 * @param {number} areaM2 - Área do imóvel em m²
 * @returns {number} Alíquota (ex: 0.003 = 0,3%)
 */
function getIPTUResidencialAcre(areaM2) {
    const faixa = ACRE_TRIBUTARIO.iptu.residencial.find(f => f.ate_m2 === null || areaM2 <= f.ate_m2);
    return faixa ? faixa.aliquota : 0.01;
}

/**
 * Retorna alíquota de IPTU comercial por área em Rio Branco.
 * @param {number} areaM2 - Área do imóvel em m²
 * @returns {number} Alíquota (ex: 0.03 = 3%)
 */
function getIPTUComercialAcre(areaM2) {
    const faixa = ACRE_TRIBUTARIO.iptu.comercial.find(f => f.ate_m2 === null || areaM2 <= f.ate_m2);
    return faixa ? faixa.aliquota : 0.10;
}

/**
 * Verifica se um município está na ALC do Acre.
 * @param {string} municipio - Nome do município
 * @returns {boolean}
 */
function isALCAcre(municipio) {
    const nome = municipio?.trim().toLowerCase();
    const todos = [
        ...ACRE_TRIBUTARIO.dados_gerais.alc_municipios,
        ...ACRE_TRIBUTARIO.dados_gerais.alc_expansao_prevista,
    ].map(m => m.toLowerCase());
    return todos.includes(nome);
}

/**
 * Retorna o percentual efetivo de redução IRPJ via SUDAM.
 * @returns {number} 0.75 = 75% de redução
 */
function getReducaoSUDAMAcre() {
    return ACRE_TRIBUTARIO.incentivos.sudam.ativo
        ? ACRE_TRIBUTARIO.incentivos.sudam.reducao_irpj.percentual
        : 0;
}

/**
 * Calcula ICMS efetivo (padrão + FECOP) do Acre.
 * @returns {number}
 */
function getICMSEfetivoAcre() {
    return ACRE_TRIBUTARIO.icms.aliquota_padrao + ACRE_TRIBUTARIO.icms.fecop.adicional;
}

/**
 * Resumo rápido dos tributos do Acre para exibição.
 * @returns {object}
 */
function resumoTributarioAcre() {
    return {
        estado: "Acre (AC)",
        icms_padrao: (ACRE_TRIBUTARIO.icms.aliquota_padrao * 100).toFixed(0) + "%",
        icms_efetivo: (getICMSEfetivoAcre() * 100).toFixed(0) + "%",
        fecop: (ACRE_TRIBUTARIO.icms.fecop.adicional * 100).toFixed(0) + "%",
        ipva_auto: (ACRE_TRIBUTARIO.ipva.aliquotas.automoveis_passeio_esporte_corrida * 100).toFixed(1) + "%",
        ipva_demais: (ACRE_TRIBUTARIO.ipva.aliquotas.demais_veiculos * 100).toFixed(1) + "%",
        iss_padrao: (ACRE_TRIBUTARIO.iss.aliquotas.mais_comum * 100).toFixed(0) + "%",
        itbi: (ACRE_TRIBUTARIO.itbi.aliquotas.geral * 100).toFixed(0) + "%",
        sudam: ACRE_TRIBUTARIO.incentivos.sudam.ativo ? "75% redução IRPJ" : "N/A",
        alc: ACRE_TRIBUTARIO.dados_gerais.zona_franca_alc ? ACRE_TRIBUTARIO.dados_gerais.alc_nome : "N/A",
        sublimite_simples: "R$ " + ACRE_TRIBUTARIO.simples_nacional.sublimite_estadual.toLocaleString("pt-BR"),
    };
}


// ═══════════════════════════════════════════════════════════════════════════
//  15. EXPORTAÇÃO (Padrão Grupo 2)
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        ...ACRE_TRIBUTARIO,
        utils: {
            getISS: getISSAcre,
            getIPTUResidencial: getIPTUResidencialAcre,
            getIPTUComercial: getIPTUComercialAcre,
            isALC: isALCAcre,
            getReducaoSUDAM: getReducaoSUDAMAcre,
            getICMSEfetivo: getICMSEfetivoAcre,
            resumoTributario: resumoTributarioAcre,
        },
    };
}

if (typeof window !== "undefined") {
    window.ACRE_TRIBUTARIO = ACRE_TRIBUTARIO;
    window.AcreTributario = {
        getISS: getISSAcre,
        getIPTUResidencial: getIPTUResidencialAcre,
        getIPTUComercial: getIPTUComercialAcre,
        isALC: isALCAcre,
        getReducaoSUDAM: getReducaoSUDAMAcre,
        getICMSEfetivo: getICMSEfetivoAcre,
        resumo: resumoTributarioAcre,
    };
}
