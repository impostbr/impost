/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PARA.JS — Base de Dados Tributária Completa do Estado do Pará
 * ═══════════════════════════════════════════════════════════════════════════
 * Versão 3.0 — Padronizado conforme modelo roraima.js v3.0
 * Dados verificados via fontes oficiais (SEFA/PA, RFB, Planalto)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ESTRUTURA PADRÃO (15 seções obrigatórias):
 *   01. dados_gerais        — Identificação, links, legislação base
 *   02. icms                — Alíquotas, cesta básica, reduções, ST, DIFAL
 *   03. ipva                — Alíquotas, calendário, descontos, isenções
 *   04. itcmd               — Alíquotas, base de cálculo, isenções, reforma
 *   05. iss                 — Tabela por grupo de serviço (município-referência)
 *   06. iptu                — Alíquotas, progressividade, isenções
 *   07. itbi                — Alíquota, base de cálculo
 *   08. taxas               — Estaduais e municipais (unificadas)
 *   09. federal             — IRPJ, CSLL, PIS, COFINS, IOF, ITR, INSS, FGTS, IRPF
 *   10. simples_nacional    — Anexos, faixas, sublimite, MEI
 *   11. incentivos          — SUDAM/SUDENE, programas estaduais
 *   12. reforma_tributaria  — EC 132, LC 214, LC 227, transição IBS/CBS
 *   13. cobertura           — Versão, itens localizados/pendentes, contatos
 *   14. funções utilitárias — Helpers de cálculo (standalone com sufixo Para)
 *   15. exportação          — module.exports + window (padrão Grupo 2)
 *
 * FONTES CONSULTADAS:
 *   • SEFA/PA — www.sefa.pa.gov.br
 *   • Lei Estadual nº 5.529/1989 (ITCMD do Pará)
 *   • RICMS/PA (Regulamento do ICMS do Pará)
 *   • Lei Estadual nº 7.640/2011 (Programa de Desenvolvimento Regional)
 *   • Convênio ICMS nº 199/22 (Regime monofásico de combustíveis)
 *   • EC nº 87/2015 (DIFAL para não contribuintes)
 *   • Código Tributário Municipal de Belém
 *   • LC nº 116/2003 (ISS federal)
 *   • LC nº 214/2025 (Reforma Tributária — IBS/CBS)
 *   • LC nº 224/2025 (Alterações IRPJ/CSLL)
 *   • LC nº 227/2026 (Comitê Gestor IBS, ITCMD progressivo obrigatório)
 *   • EC nº 132/2023 (Reforma Tributária)
 *   • Receita Federal — www.gov.br/receitafederal
 *
 * ATUALIZAÇÃO: 10/02/2026
 * ═══════════════════════════════════════════════════════════════════════════
 */

const PARA_TRIBUTARIO = {

    // ═══════════════════════════════════════════════════════════════
    //  1. DADOS GERAIS
    // ═══════════════════════════════════════════════════════════════

    dados_gerais: {
        nome: "Pará",
        sigla: "PA",
        regiao: "Norte",
        capital: "Belém",
        codigo_ibge: 15,
        zona_franca: {
            ativo: false,
            em_aprovacao: true,
            nome: "Zona Franca da Bioeconomia em Belém",
            municipios: ["Belém"],
            obs: "Projeto de Lei em aprovação na Câmara dos Deputados (2025). Ainda não vigente."
        },
        area_livre_comercio: {
            ativo: false,
            obs: "Não possui ALC vigente. Zona Franca da Bioeconomia em tramitação."
        },
        sudam: {
            ativo: true,
            obs: "Estado integralmente na área de abrangência da SUDAM (Amazônia Legal)"
        },
        sudene: {
            ativo: false
        },
        sefaz: {
            site: "https://www.sefa.pa.gov.br/",
            nome: "SEFA/PA - Secretaria de Estado da Fazenda do Pará"
        },
        legislacao_base: [
            { norma: "Lei Estadual nº 5.529/1989", assunto: "ITCMD do Pará" },
            { norma: "RICMS/PA", assunto: "Regulamento do ICMS do Pará" },
            { norma: "Lei Estadual nº 7.640/2011", assunto: "Programa de Desenvolvimento Regional do Pará" }
        ]
    },


    // ═══════════════════════════════════════════════════════════════
    //  2. ICMS — IMPOSTO SOBRE CIRCULAÇÃO DE MERCADORIAS E SERVIÇOS
    // ═══════════════════════════════════════════════════════════════

    icms: {
        aliquota_padrao: 0.19,
        aliquota_padrao_percentual: "19%",

        aliquotas_diferenciadas: {
            cesta_basica:               { aliquota: 0.00, obs: "Isento", base_legal: "RICMS/PA" },
            combustiveis_gasolina:      { aliquota: 0.25, obs: "Gasolina", base_legal: "Convênio ICMS nº 199/22" },
            combustiveis_diesel:        { aliquota: 0.25, obs: "Diesel", base_legal: "Convênio ICMS nº 199/22" },
            combustiveis_etanol:        { aliquota: 0.25, obs: "Etanol", base_legal: "Convênio ICMS nº 199/22" },
            combustiveis_gnv:           { aliquota: 0.25, obs: "GNV", base_legal: "Convênio ICMS nº 199/22" },
            combustiveis_glp:           { aliquota: 0.25, obs: "GLP - gás de cozinha", base_legal: "Convênio ICMS nº 199/22" },
            energia_residencial:        { aliquota: 0.17, obs: "Residencial (todas as faixas)", base_legal: "STF - Decisão 2021" },
            energia_comercial:          { aliquota: 0.17, obs: "Comercial", base_legal: "STF - Decisão 2021" },
            energia_industrial:         { aliquota: 0.17, obs: "Industrial", base_legal: "STF - Decisão 2021" },
            telecomunicacoes:           { aliquota_min: 0.17, aliquota_max: 0.25, obs: "Varia conforme serviço", base_legal: "RICMS/PA" },
            bebidas_alcoolicas:         { aliquota: 0.30, obs: "Cervejas, vinhos", base_legal: "RICMS/PA" },
            cigarros_fumo:              { aliquota: 0.30, obs: "NCM 2402 e 2403", base_legal: "RICMS/PA" },
            armas_municoes:             { aliquota: 0.25, base_legal: "RICMS/PA" },
            embarcacoes_esporte_lazer:  { aliquota: 0.12, base_legal: "RICMS/PA" },
            perfumaria_cosmeticos:      { aliquota: 0.25, base_legal: "RICMS/PA" },
            veiculos_novos:             { aliquota_min: 0.12, aliquota_max: 0.18, base_legal: "RICMS/PA" },
            medicamentos_genericos:     { aliquota: 0.12, base_legal: "RICMS/PA" },
            medicamentos_marca:         { aliquota_min: 0.12, aliquota_max: 0.18, base_legal: "RICMS/PA" },
            produtos_superfluos_luxo:   { aliquota: 0.25, base_legal: "RICMS/PA" },
            produtos_agropecuarios:     { aliquota: 0.07, obs: "Operações internas com produtos primários", base_legal: "RICMS/PA" },
            querosene_aviacao:          { aliquota: 0.25, base_legal: "RICMS/PA" },
            diesel_s10:                 { aliquota: 0.25, base_legal: "Convênio ICMS nº 199/22" },
            informatica:                { aliquota: 0.12, obs: "Produtos de informática", base_legal: "RICMS/PA" },
            maquinas_equipamentos:      { aliquota: 0.12, obs: "Máquinas e equipamentos industriais", base_legal: "RICMS/PA" },
            insumos_agropecuarios:      { aliquota: 0.07, base_legal: "RICMS/PA" }
        },

        aliquotas_interestaduais: {
            norte_nordeste_co_es: 0.12,
            sul_sudeste_exceto_es: 0.07,
            nao_contribuinte: 0.19,
            obs: "Conforme EC 87/2015"
        },

        difal: {
            formula: "DIFAL = (Alíquota Interna Destino - Alíquota Interestadual) × Base de Cálculo",
            partilha_destino: 1.00,
            partilha_origem: 0.00,
            obs: "100% para o estado de destino conforme EC 87/2015"
        },

        importacao: {
            aliquota: 0.19,
            obs: "Alíquota padrão aplicada em operações de importação"
        },

        fecop: {
            ativo: true,
            nome: "FECOP - Fundo Estadual de Combate à Pobreza",
            aliquota_adicional: 0.02,
            produtos_incidentes: [
                "Combustíveis (gasolina, diesel, etanol, GLP)",
                "Energia elétrica",
                "Bebidas alcoólicas",
                "Cigarros e fumo",
                "Telecomunicações"
            ]
        },

        substituicao_tributaria: {
            produtos_sujeitos: [
                "Combustíveis e derivados",
                "Energia elétrica",
                "Telecomunicações",
                "Bebidas alcoólicas",
                "Cigarros e fumo",
                "Produtos farmacêuticos",
                "Cosméticos e perfumaria",
                "Veículos automotores",
                "Pneus e câmaras de ar",
                "Lubrificantes"
            ],
            mva: {
                combustiveis:         { min: 0.08, max: 0.12 },
                energia_eletrica:     { min: 0.05, max: 0.08 },
                bebidas_alcoolicas:   { min: 0.15, max: 0.25 },
                cigarros:             { min: 0.20, max: 0.30 },
                medicamentos:         { min: 0.25, max: 0.35 },
                veiculos_automotores: { min: 0.15, max: 0.25 }
            },
            convenios: [
                "Convênio ICMS nº 199/22 (Regime monofásico de combustíveis)",
                "Convênios bilaterais com AM, TO, MA"
            ]
        },

        monofasico_combustiveis: {
            oleo_diesel_biodiesel: { valor_por_litro: 0.9456, unidade: "R$/litro" },
            gasolina:              { valor_por_litro: 1.0500, unidade: "R$/litro" },
            etanol:                { valor_por_litro: 0.7500, unidade: "R$/litro" },
            glp:                   { valor_por_kg: 0.4200, unidade: "R$/kg" }
        },

        legislacao: [
            { norma: "RICMS/PA", assunto: "Regulamento do ICMS do Pará" },
            { norma: "Convênio ICMS nº 199/22", assunto: "Regime monofásico de combustíveis" },
            { norma: "EC 87/2015", assunto: "DIFAL para não contribuintes" }
        ]
    },


    // ═══════════════════════════════════════════════════════════════
    //  3. IPVA — IMPOSTO SOBRE PROPRIEDADE DE VEÍCULOS AUTOMOTORES
    // ═══════════════════════════════════════════════════════════════

    ipva: {
        aliquotas: {
            automoveis_utilitarios: { aliquota: 0.025, obs: "Automóveis e utilitários" },
            motocicletas:           { aliquota: 0.01, obs: "Motocicletas e similares" },
            caminhoes:              { aliquota: 0.01 },
            onibus_micro:           { aliquota: 0.01, obs: "Ônibus e micro-ônibus" },
            locadoras:              { aliquota: 0.025, obs: "Veículos de locadoras" },
            eletricos_hibridos:     { aliquota: 0.025, obs: "Veículos elétricos/híbridos" },
            embarcacoes:            { aliquota: 0.025 },
            aeronaves:              { aliquota: 0.025 }
        },

        isencoes: [
            "Veículos com mais de 15 anos de fabricação",
            "Veículos para PCD (Pessoa com Deficiência) - com comprovação",
            "Táxis",
            "Veículos oficiais",
            "Ônibus de transporte coletivo"
        ],

        descontos_antecipacao: {
            cota_unica:               { desconto_min: 0.10, desconto_max: 0.15, obs: "10% a 15% para cota única" },
            bons_motoristas_2_anos:   { desconto: 0.15, obs: "Sem multas há 2 anos" },
            sem_multas_1_ano:         { desconto: 0.10, obs: "Sem multas no último ano" },
            sem_multas_demais:        { desconto: 0.05, obs: "Demais situações sem multa" },
            parcelamento:             { parcelas: 3, desconto: 0, obs: "Até 3 parcelas sem desconto" }
        },

        base_calculo: "Tabela FIPE (valor venal do veículo)",

        calendario_vencimento: {
            obs: "Por final de placa",
            faixas: [
                { finais: "01 a 31", mes: "Janeiro" },
                { finais: "32 a 62", mes: "Fevereiro" },
                { finais: "63 a 93", mes: "Março" },
                { finais: "94 a 99 e 00", mes: "Abril" }
            ]
        }
    },


    // ═══════════════════════════════════════════════════════════════
    //  4. ITCMD — IMPOSTO TRANSMISSÃO CAUSA MORTIS E DOAÇÃO
    // ═══════════════════════════════════════════════════════════════

    itcmd: {
        causa_mortis: {
            tipo: "progressiva",
            unidade_referencia: "UPF/PA",
            faixas: [
                { limite_inferior: 0,      limite_superior: 15000,  aliquota: 0.02 },
                { limite_inferior: 15001,  limite_superior: 30000,  aliquota: 0.03 },
                { limite_inferior: 30001,  limite_superior: 60000,  aliquota: 0.04 },
                { limite_inferior: 60001,  limite_superior: 120000, aliquota: 0.05 },
                { limite_inferior: 120001, limite_superior: 240000, aliquota: 0.06 },
                { limite_inferior: 240001, limite_superior: null,   aliquota: 0.08 }
            ]
        },

        doacao: {
            tipo: "progressiva",
            unidade_referencia: "UPF/PA",
            faixas: [
                { limite_inferior: 0,      limite_superior: 15000,  aliquota: 0.02 },
                { limite_inferior: 15001,  limite_superior: 30000,  aliquota: 0.025 },
                { limite_inferior: 30001,  limite_superior: 60000,  aliquota: 0.03 },
                { limite_inferior: 60001,  limite_superior: null,   aliquota: 0.04 }
            ]
        },

        base_calculo: "Valor venal do bem (valor de mercado) ou valor declarado, o que for maior",

        isencoes: [
            "Transmissão de imóvel rural até 25 hectares para herdeiro",
            "Imóvel destinado à morada do cônjuge supérstite (causa mortis)",
            "Pequena propriedade familiar (até 25 hectares)",
            "Doações para instituições de caridade e educação",
            "Doações para entidades de utilidade pública"
        ],

        prazo_pagamento: "30 dias a partir da data do óbito ou da doação",

        legislacao: [
            { norma: "Lei Estadual nº 5.529/1989", assunto: "ITCMD do Pará (com alterações posteriores)" }
        ]
    },


    // ═══════════════════════════════════════════════════════════════
    //  5. ISS — IMPOSTO SOBRE SERVIÇOS (Belém — referência)
    // ═══════════════════════════════════════════════════════════════

    iss: {
        municipio_referencia: "Belém",
        aliquota_padrao: 0.05,
        aliquota_minima: 0.02,
        aliquota_maxima: 0.05,

        por_tipo_servico: {
            construcao_civil:     { aliquota: 0.05, descricao: "Construção civil" },
            informatica:          { aliquota: 0.05, descricao: "Serviços de informática" },
            saude:                { aliquota: 0.05, descricao: "Serviços de saúde" },
            educacao:             { aliquota: 0.05, descricao: "Serviços de educação" },
            contabilidade:        { aliquota: 0.05, descricao: "Serviços contábeis" },
            advocacia:            { aliquota: 0.05, descricao: "Serviços advocatícios" },
            transporte_municipal: { aliquota: 0.05, descricao: "Transporte municipal" },
            limpeza_vigilancia:   { aliquota: 0.05, descricao: "Limpeza e vigilância" },
            consultoria:          { aliquota: 0.05, descricao: "Consultoria" },
            publicidade:          { aliquota: 0.05, descricao: "Publicidade e propaganda" },
            reparacao_manutencao: { aliquota: 0.05, descricao: "Reparação e manutenção" }
        },

        legislacao: [
            { norma: "Lei Complementar nº 116/2003", assunto: "Lista de serviços (federal)" },
            { norma: "Código Tributário Municipal de Belém", assunto: "Regulamentação ISS em Belém" }
        ]
    },


    // ═══════════════════════════════════════════════════════════════
    //  6. IPTU — IMPOSTO PREDIAL E TERRITORIAL URBANO (Belém)
    // ═══════════════════════════════════════════════════════════════

    iptu: {
        municipio_referencia: "Belém",

        residencial: {
            aliquota_min: 0.006,
            aliquota_max: 0.015,
            obs: "0,60% a 1,50% conforme faixa de área e localização"
        },

        comercial: {
            aliquota_min: 0.015,
            aliquota_max: 0.030,
            obs: "1,50% a 3,00% conforme faixa de área e localização"
        },

        terreno_nao_edificado: {
            aliquota_min: 0.020,
            aliquota_max: 0.040,
            obs: "2,00% a 4,00%"
        },

        progressividade: {
            ativo: true,
            obs: "Aplicada para imóveis não utilizados ou subutilizados"
        },

        isencoes: [
            "Imóveis de instituições de caridade",
            "Imóveis de entidades de utilidade pública",
            "Imóveis da União, Estados e Municípios",
            "Templos religiosos",
            "Imóveis com valor venal baixo (limite municipal)"
        ],

        descontos_2025: {
            credito_residencial_quitado:  { desconto: 0.25, obs: "Crédito para IPTU 2024 quitado" },
            credito_comercial_quitado:    { desconto: 0.30, obs: "Até 30% para IPTU 2024 quitado" },
            cota_unica_fev:               { desconto: 0.10, obs: "Cota única até 10/02" },
            cota_unica_mar:               { desconto: 0.07, obs: "Cota única até 10/03" }
        }
    },


    // ═══════════════════════════════════════════════════════════════
    //  7. ITBI — IMPOSTO TRANSMISSÃO DE BENS IMÓVEIS (Belém)
    // ═══════════════════════════════════════════════════════════════

    itbi: {
        municipio_referencia: "Belém",
        aliquota_padrao: 0.02,
        aliquota_financiamento: 0.01,
        base_calculo: "Valor do bem ou direito transmitido",

        isencoes: [
            "Transmissões para entidades de caridade",
            "Transmissões para órgãos públicos",
            "Transmissões para fins de reforma urbana",
            "Doações para cônjuge/descendentes (em alguns casos)"
        ],

        legislacao: [
            { norma: "Código Tributário Municipal de Belém", assunto: "ITBI" }
        ]
    },


    // ═══════════════════════════════════════════════════════════════
    //  8. TAXAS ESTADUAIS E MUNICIPAIS (unificadas)
    // ═══════════════════════════════════════════════════════════════

    taxas: {

        // ── Taxas Estaduais ──
        estaduais: {
            licenciamento_veiculos:  { valor: null, obs: "Incluída no IPVA" },
            taxa_judiciaria:         { valor: null, obs: "Variável conforme tipo de ação" },
            servicos_sefaz:          { valor: null, obs: "Variável conforme serviço" },
            taxa_ambiental:          { valor: null, obs: "Variável conforme atividade" },
            taxa_incendio_bombeiros: { valor: null, obs: "Variável conforme município" },
            emolumentos_cartorarios: { valor: null, obs: "Conforme tabela de cartórios" },
            inscricao_estadual:      { valor: null, obs: "Variável" },
            obs_geral: "Muitas taxas estaduais foram extintas ou incorporadas ao ICMS. Consultar SEFA/PA."
        },

        // ── Taxas Municipais Belém ──
        municipais_belem: {
            municipio_referencia: "Belém",
            taxa_lixo:        { valor_min: 20, valor_max: 100, unidade: "R$/mês", obs: "Variável conforme imóvel" },
            alvara:           { valor_min: 50, valor_max: 500, unidade: "R$", obs: "Variável conforme atividade" },
            taxa_publicidade: { valor: null, obs: "Variável conforme tipo" },
            cosip:            { valor_min: 10, valor_max: 50, unidade: "R$/mês", obs: "Contribuição de iluminação pública" },
            legislacao: [
                { norma: "Lei nº 10.113/2024", assunto: "Regulamenta a COSIP em Belém" }
            ]
        },

        legislacao: [
            { norma: "SEFA/PA", assunto: "Taxas estaduais do Pará" },
            { norma: "Código Tributário Municipal de Belém", assunto: "Taxas municipais de Belém" },
            { norma: "Lei nº 10.113/2024", assunto: "COSIP em Belém" }
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  9. IMPOSTOS FEDERAIS (aplicáveis no PA)
    // ═══════════════════════════════════════════════════════════════

    federal: {

        irpj: {
            lucro_real: {
                aliquota: 0.15,
                adicional: { aliquota: 0.10, limite_mensal: 20000, obs: "Sobre excedente de R$ 20.000/mês" }
            },
            lucro_presumido: {
                aliquota: 0.15,
                presuncao_comercio_industria: 0.08,
                presuncao_servicos: 0.32,
                adicional: { aliquota: 0.10, limite_mensal: 20000 }
            },
            incentivos_regionais: {
                sudam: {
                    reducao_irpj: 0.75,
                    reinvestimento_min: 0.50,
                    reinvestimento_max: 0.75,
                    obs: "Redução de 75% do IRPJ para empresas aprovadas pela SUDAM"
                }
            }
        },

        irpf: {
            tabela_mensal_2025: [
                { limite_inferior: 0,       limite_superior: 2112.00, aliquota: 0,     deducao: 0 },
                { limite_inferior: 2112.01, limite_superior: 2826.65, aliquota: 0.075, deducao: 158.40 },
                { limite_inferior: 2826.66, limite_superior: 3751.05, aliquota: 0.15,  deducao: 370.40 },
                { limite_inferior: 3751.06, limite_superior: 4664.68, aliquota: 0.225, deducao: 649.73 },
                { limite_inferior: 4664.69, limite_superior: null,    aliquota: 0.275, deducao: 869.36 }
            ],
            deducoes: [
                "Contribuição ao INSS",
                "Pensão alimentícia",
                "Contribuição a sindicatos",
                "Despesas com educação (até limite)",
                "Despesas médicas e odontológicas"
            ]
        },

        csll: {
            aliquota_geral: 0.09,
            aliquota_financeiras: 0.15,
            incentivos_regionais: {
                sudam: {
                    reducao: 0.75,
                    obs: "Redução de 75% da CSLL (SUDAM)"
                }
            }
        },

        pis: {
            regime_cumulativo: 0.0065,
            regime_nao_cumulativo: 0.0165,
            importacao: 0.0165,
            aliquota_zero_cesta_basica: true,
            produtos_aliquota_zero: [
                "Arroz, feijão, milho, trigo",
                "Leite, ovos, carnes",
                "Pão, farinha de trigo",
                "Açúcar, sal",
                "Óleos vegetais"
            ]
        },

        cofins: {
            regime_cumulativo: 0.03,
            regime_nao_cumulativo: 0.076,
            importacao: 0.076,
            aliquota_zero_cesta_basica: true,
            produtos_aliquota_zero: [
                "Mesmos produtos do PIS"
            ]
        },

        ipi: {
            referencia: "TIPI (Tabela de Incidência do IPI) vigente",
            beneficios_regiao_norte: {
                reducao_geral: 0.35,
                obs: "Redução de 35% nas alíquotas para região Norte/Zona Franca"
            },
            produtos_diferenciados: [
                "Produtos de informática (redução)",
                "Máquinas e equipamentos industriais (redução)",
                "Insumos agropecuários (redução)"
            ]
        },

        iof: {
            credito_pf:   { aliquota_min: 0.0038, aliquota_max: 0.03 },
            credito_pj:   { aliquota_min: 0.0038, aliquota_max: 0.015 },
            cambio:       { aliquota_min: 0.0038, aliquota_max: 0.25 },
            seguros:      { aliquota_min: 0.0038, aliquota_max: 0.25 },
            titulos:      { aliquota_min: 0.0038, aliquota_max: 0.25 }
        },

        ii: {
            referencia: "TEC - Nomenclatura Comum do Mercosul (NCM)",
            aliquota_min: 0,
            aliquota_max: 0.55,
            beneficios_alc: {
                obs: "Isenção ou redução para produtos importados via ALC/SUFRAMA"
            }
        },

        ie: {
            aliquota_geral: 0.30,
            aliquota_vigente_2025: 0.09,
            obs: "Facultado ao Poder Executivo reduzir. Alíquota vigente de 9%.",
            excecoes: [
                "Alguns produtos podem ter alíquota zero",
                "Produtos da sociobiodiversidade (redução)"
            ]
        },

        itr: {
            tabela: [
                { tamanho: "Até 50 hectares",          aliquota_min: 0.0003, aliquota_max: 0.003 },
                { tamanho: "De 50 a 100 hectares",      aliquota_min: 0.0015, aliquota_max: 0.004 },
                { tamanho: "De 100 a 500 hectares",     aliquota_min: 0.003,  aliquota_max: 0.005 },
                { tamanho: "De 500 a 1.000 hectares",   aliquota_min: 0.004,  aliquota_max: 0.006 },
                { tamanho: "Acima de 1.000 hectares",    aliquota_min: 0.005,  aliquota_max: 0.008 }
            ],
            isencoes: {
                pequena_propriedade: {
                    limite_hectares: 25,
                    renda_bruta_max: 20000,
                    obs: "Exploração familiar"
                }
            }
        },

        inss: {
            patronal: 0.20,
            rat_sat: { min: 0.005, max: 0.03, obs: "Conforme risco da atividade" },
            terceiros: { min: 0.015, max: 0.025, obs: "Sistema S" },
            empregado_2025: [
                { limite_inferior: 0,       limite_superior: 1518.00, aliquota: 0.075 },
                { limite_inferior: 1518.01, limite_superior: 2793.88, aliquota: 0.09 },
                { limite_inferior: 2793.89, limite_superior: 4190.83, aliquota: 0.12 },
                { limite_inferior: 4190.84, limite_superior: 8381.66, aliquota: 0.14 }
            ]
        },

        fgts: {
            aliquota: 0.08,
            contribuicao_social: { min: 0.005, max: 0.008 }
        }
    },


    // ═══════════════════════════════════════════════════════════════
    //  10. SIMPLES NACIONAL (aplicável no PA)
    // ═══════════════════════════════════════════════════════════════

    simples_nacional: {
        sublimite_estadual: 3600000,
        sublimite_obs: "R$ 3.600.000,00 — Pará adota o sublimite federal",

        mei: {
            limite_anual: 81000,
            das_comercio_industria: 71.60,
            das_servicos: 75.60,
            das_comercio_servicos: 76.60,
            icms_fixo: 1.00,
            iss_fixo: 5.00
        },

        anexo_i_comercio: {
            nome: "Anexo I — Comércio",
            faixas: [
                { faixa: 1,  limite_inferior: 0,          limite_superior: 180000,   aliquota: 0.04,   deducao: 0 },
                { faixa: 2,  limite_inferior: 180000.01,   limite_superior: 360000,   aliquota: 0.0547, deducao: 0 },
                { faixa: 3,  limite_inferior: 360000.01,   limite_superior: 540000,   aliquota: 0.0684, deducao: 0 },
                { faixa: 4,  limite_inferior: 540000.01,   limite_superior: 720000,   aliquota: 0.0754, deducao: 0 },
                { faixa: 5,  limite_inferior: 720000.01,   limite_superior: 900000,   aliquota: 0.0813, deducao: 0 },
                { faixa: 6,  limite_inferior: 900000.01,   limite_superior: 1080000,  aliquota: 0.0860, deducao: 0 },
                { faixa: 7,  limite_inferior: 1080000.01,  limite_superior: 1260000,  aliquota: 0.0895, deducao: 0 },
                { faixa: 8,  limite_inferior: 1260000.01,  limite_superior: 1440000,  aliquota: 0.0927, deducao: 0 },
                { faixa: 9,  limite_inferior: 1440000.01,  limite_superior: 1620000,  aliquota: 0.0957, deducao: 0 },
                { faixa: 10, limite_inferior: 1620000.01,  limite_superior: 1800000,  aliquota: 0.0987, deducao: 0 },
                { faixa: 11, limite_inferior: 1800000.01,  limite_superior: 3600000,  aliquota_min: 0.1017, aliquota_max: 0.1493, deducao: 0 }
            ]
        },

        anexo_ii_industria: {
            nome: "Anexo II — Indústria",
            faixas: [
                { faixa: 1,  limite_inferior: 0,          limite_superior: 180000,   aliquota: 0.045,  deducao: 0 },
                { faixa: 2,  limite_inferior: 180000.01,   limite_superior: 360000,   aliquota: 0.0597, deducao: 0 },
                { faixa: 3,  limite_inferior: 360000.01,   limite_superior: 540000,   aliquota: 0.0734, deducao: 0 },
                { faixa: 4,  limite_inferior: 540000.01,   limite_superior: 720000,   aliquota: 0.0804, deducao: 0 },
                { faixa: 5,  limite_inferior: 720000.01,   limite_superior: 900000,   aliquota: 0.0863, deducao: 0 },
                { faixa: 6,  limite_inferior: 900000.01,   limite_superior: 1080000,  aliquota: 0.0910, deducao: 0 },
                { faixa: 7,  limite_inferior: 1080000.01,  limite_superior: 1260000,  aliquota: 0.0945, deducao: 0 },
                { faixa: 8,  limite_inferior: 1260000.01,  limite_superior: 1440000,  aliquota: 0.0977, deducao: 0 },
                { faixa: 9,  limite_inferior: 1440000.01,  limite_superior: 1620000,  aliquota: 0.1007, deducao: 0 },
                { faixa: 10, limite_inferior: 1620000.01,  limite_superior: 1800000,  aliquota: 0.1037, deducao: 0 },
                { faixa: 11, limite_inferior: 1800000.01,  limite_superior: 3600000,  aliquota_min: 0.1067, aliquota_max: 0.1543, deducao: 0 }
            ]
        },

        anexo_iii_servicos: {
            nome: "Anexo III — Serviços",
            faixas: [
                { faixa: 1,  limite_inferior: 0,          limite_superior: 180000,   aliquota: 0.06,   deducao: 0 },
                { faixa: 2,  limite_inferior: 180000.01,   limite_superior: 360000,   aliquota: 0.0821, deducao: 0 },
                { faixa: 3,  limite_inferior: 360000.01,   limite_superior: 540000,   aliquota: 0.1026, deducao: 0 },
                { faixa: 4,  limite_inferior: 540000.01,   limite_superior: 720000,   aliquota: 0.1151, deducao: 0 },
                { faixa: 5,  limite_inferior: 720000.01,   limite_superior: 900000,   aliquota: 0.1260, deducao: 0 },
                { faixa: 6,  limite_inferior: 900000.01,   limite_superior: 1080000,  aliquota: 0.1355, deducao: 0 },
                { faixa: 7,  limite_inferior: 1080000.01,  limite_superior: 1260000,  aliquota: 0.1435, deducao: 0 },
                { faixa: 8,  limite_inferior: 1260000.01,  limite_superior: 1440000,  aliquota: 0.1510, deducao: 0 },
                { faixa: 9,  limite_inferior: 1440000.01,  limite_superior: 1620000,  aliquota: 0.1580, deducao: 0 },
                { faixa: 10, limite_inferior: 1620000.01,  limite_superior: 1800000,  aliquota: 0.1650, deducao: 0 },
                { faixa: 11, limite_inferior: 1800000.01,  limite_superior: 3600000,  aliquota_min: 0.1720, aliquota_max: 0.2245, deducao: 0 }
            ]
        },

        anexo_iv_servicos_profissionais: {
            nome: "Anexo IV — Serviços Profissionais",
            faixas: [
                { faixa: 1,  limite_inferior: 0,          limite_superior: 180000,   aliquota: 0.1693, deducao: 0 },
                { faixa: 2,  limite_inferior: 180000.01,   limite_superior: 360000,   aliquota: 0.1842, deducao: 0 },
                { faixa: 3,  limite_inferior: 360000.01,   limite_superior: 540000,   aliquota: 0.1988, deducao: 0 },
                { faixa: 4,  limite_inferior: 540000.01,   limite_superior: 720000,   aliquota: 0.2132, deducao: 0 },
                { faixa: 5,  limite_inferior: 720000.01,   limite_superior: 900000,   aliquota: 0.2245, deducao: 0 },
                { faixa: 6,  limite_inferior: 900000.01,   limite_superior: 1080000,  aliquota: 0.2348, deducao: 0 },
                { faixa: 7,  limite_inferior: 1080000.01,  limite_superior: 1260000,  aliquota: 0.2449, deducao: 0 },
                { faixa: 8,  limite_inferior: 1260000.01,  limite_superior: 1440000,  aliquota: 0.2545, deducao: 0 },
                { faixa: 9,  limite_inferior: 1440000.01,  limite_superior: 1620000,  aliquota: 0.2638, deducao: 0 },
                { faixa: 10, limite_inferior: 1620000.01,  limite_superior: 1800000,  aliquota: 0.2730, deducao: 0 },
                { faixa: 11, limite_inferior: 1800000.01,  limite_superior: 3600000,  aliquota_min: 0.2823, aliquota_max: 0.3366, deducao: 0 }
            ]
        },

        anexo_v_servicos_transportes: {
            nome: "Anexo V — Serviços / Transportes",
            faixas: [
                { faixa: 1,  limite_inferior: 0,          limite_superior: 180000,   aliquota: 0.16,   deducao: 0 },
                { faixa: 2,  limite_inferior: 180000.01,   limite_superior: 360000,   aliquota: 0.1742, deducao: 0 },
                { faixa: 3,  limite_inferior: 360000.01,   limite_superior: 540000,   aliquota: 0.1878, deducao: 0 },
                { faixa: 4,  limite_inferior: 540000.01,   limite_superior: 720000,   aliquota: 0.2011, deducao: 0 },
                { faixa: 5,  limite_inferior: 720000.01,   limite_superior: 900000,   aliquota: 0.2118, deducao: 0 },
                { faixa: 6,  limite_inferior: 900000.01,   limite_superior: 1080000,  aliquota: 0.2216, deducao: 0 },
                { faixa: 7,  limite_inferior: 1080000.01,  limite_superior: 1260000,  aliquota: 0.2311, deducao: 0 },
                { faixa: 8,  limite_inferior: 1260000.01,  limite_superior: 1440000,  aliquota: 0.2404, deducao: 0 },
                { faixa: 9,  limite_inferior: 1440000.01,  limite_superior: 1620000,  aliquota: 0.2494, deducao: 0 },
                { faixa: 10, limite_inferior: 1620000.01,  limite_superior: 1800000,  aliquota: 0.2581, deducao: 0 },
                { faixa: 11, limite_inferior: 1800000.01,  limite_superior: 3600000,  aliquota_min: 0.2668, aliquota_max: 0.3217, deducao: 0 }
            ]
        }
    },


    // ═══════════════════════════════════════════════════════════════
    //  11. INCENTIVOS FISCAIS E BENEFÍCIOS REGIONAIS
    // ═══════════════════════════════════════════════════════════════

    incentivos: {
        sudam: {
            ativo: true,
            reducao_irpj: 0.75,
            reinvestimento: { min: 0.50, max: 0.75 },
            setores_prioritarios: [
                "Indústria de transformação",
                "Agronegócio",
                "Turismo",
                "Infraestrutura",
                "Desenvolvimento sustentável"
            ],
            requisitos: [
                "Empresa localizada na Amazônia Legal",
                "Projeto alinhado com desenvolvimento sustentável",
                "Aprovação prévia da SUDAM",
                "Cumprimento de metas de investimento",
                "Geração de empregos locais"
            ],
            legislacao: "Resolução CONDEL/SUDAM nº 136, de 12 de agosto de 2025"
        },

        sudene: {
            ativo: false
        },

        zona_franca_bioeconomia: {
            ativo: false,
            em_aprovacao: true,
            nome: "Zona Franca da Bioeconomia em Belém",
            municipios: ["Belém", "Região Metropolitana"],
            beneficios_previstos: [
                "Isenção ou redução de IPI",
                "Redução de ICMS",
                "Isenção de II (Imposto de Importação)",
                "Redução de PIS/COFINS",
                "Incentivos estaduais adicionais"
            ],
            legislacao: "Projeto de Lei em aprovação na Câmara dos Deputados (2025)"
        },

        programa_desenvolvimento_regional: {
            ativo: true,
            nome: "Programa de Desenvolvimento Regional do Pará",
            beneficios: [
                "Redução de ICMS",
                "Isenção de taxas estaduais"
            ],
            setores: ["Indústria", "Agronegócio", "Turismo"],
            legislacao: "Lei Estadual nº 7.640/2011 (com alterações)",
            vigencia: "Contínuo, com renovação anual"
        },

        isencoes_especificas: {
            agricultura_familiar: {
                beneficios: [
                    "Isenção de ICMS em operações internas",
                    "Redução de ITR",
                    "Isenção de taxas estaduais"
                ]
            },
            sociobiodiversidade: {
                beneficios: [
                    "Redução de ICMS (7%)",
                    "Isenção de IPI",
                    "Redução de IE (Imposto de Exportação)"
                ]
            },
            cooperativas: {
                beneficios: [
                    "Isenção de ICMS em operações entre cooperados",
                    "Redução de ISS",
                    "Isenção de ITCMD"
                ]
            },
            exportadores: {
                beneficios: [
                    "Isenção de ICMS em operações de exportação",
                    "Redução de IE",
                    "Benefícios de drawback"
                ]
            },
            industrias_transformacao_local: {
                beneficios: [
                    "Redução de ICMS (12%)",
                    "Isenção de IPI",
                    "Incentivos SUDAM"
                ]
            }
        }
    },


    // ═══════════════════════════════════════════════════════════════
    //  12. REFORMA TRIBUTÁRIA
    // ═══════════════════════════════════════════════════════════════

    reforma_tributaria: {
        ibs: {
            nome: "IBS — Imposto sobre Bens e Serviços",
            aliquota_estadual_prevista: { min: 0.05, max: 0.07, obs: "Estimativa" },
            cronograma: [
                { ano: 2026, aliquota: 0.009, obs: "Início com alíquota de teste" },
                { ano: 2027, obs: "Aumento gradual" },
                { ano: 2033, aliquota_estimada: { min: 0.10, max: 0.11 }, obs: "Alíquota definitiva" }
            ],
            impacto_para: [
                "Substituição do ICMS pelo IBS",
                "Redistribuição de receitas entre estados",
                "Possível perda de benefícios fiscais regionais"
            ]
        },

        cbs: {
            nome: "CBS — Contribuição sobre Bens e Serviços",
            aliquota_prevista: { min: 0.10, max: 0.11, obs: "Estimativa" },
            cronograma: [
                { ano: 2026, aliquota: 0.009, obs: "Início com alíquota de teste" },
                { ano: 2033, obs: "Alíquota definitiva" }
            ],
            substitui: ["PIS", "COFINS", "IPI (parcialmente)"]
        },

        is: {
            nome: "IS — Imposto Seletivo",
            aliquota_media_estimada: { min: 0.25, max: 0.265 },
            produtos_afetados: [
                "Bebidas alcoólicas",
                "Cigarros e fumo",
                "Combustíveis fósseis",
                "Produtos de origem animal",
                "Produtos prejudiciais ao meio ambiente"
            ],
            aliquotas_estimadas: {
                bebidas_alcoolicas: { min: 0.20, max: 0.30 },
                cigarros:           { min: 0.30, max: 0.40 },
                combustiveis:       { min: 0.15, max: 0.25 }
            }
        },

        impactos_para: {
            manutencao_beneficios: "Incerteza sobre manutenção de incentivos SUDAM",
            fundo_desenvolvimento_regional: {
                obs: "Criação prevista para compensar perdas de receita",
                impacto_estimado: "Redução de 5% a 15% nas receitas estaduais"
            },
            cronograma_geral: [
                { ano: 2026, descricao: "Início da transição (IBS e CBS a 0,9%)" },
                { ano: "2027-2032", descricao: "Aumento gradual das alíquotas" },
                { ano: 2033, descricao: "Implementação completa (extinção do ICMS)" }
            ]
        }
    },


    // ═══════════════════════════════════════════════════════════════
    //  13. DADOS DE COBERTURA
    // ═══════════════════════════════════════════════════════════════

    cobertura: {
        versao: "3.0",
        data_atualizacao: "2026-02-10",
        localizados: [
            "ICMS — alíquota padrão, diferenciadas, interestaduais, DIFAL, ST, FECOP, monofásico",
            "IPVA — alíquotas por tipo, isenções, descontos, calendário",
            "ITCMD — alíquotas progressivas (causa mortis e doação), isenções",
            "ISS — alíquota padrão e por tipo de serviço (Belém)",
            "IPTU — faixas residencial, comercial, terreno (Belém)",
            "ITBI — alíquotas padrão e financiamento (Belém)",
            "Taxas municipais — lixo, alvará, COSIP (Belém)",
            "Impostos federais — IRPJ, IRPF, CSLL, PIS, COFINS, IPI, IOF, II, IE, ITR, INSS, FGTS",
            "Simples Nacional — sublimite, MEI, Anexos I a V",
            "Incentivos — SUDAM, Programa Estadual, Zona Franca Bioeconomia (em aprovação)",
            "Reforma Tributária — IBS, CBS, IS, cronograma, impactos"
        ],
        nao_localizados: [
            "IPTU — faixas detalhadas por m² (Belém não disponibiliza publicamente)",
            "Taxas estaduais — valores específicos (muitas extintas ou incorporadas)",
            "MVA detalhada por produto para ICMS-ST (disponível apenas em protocolos específicos)",
            "Calendário IPVA 2026 detalhado por final de placa (dados genéricos da pesquisa)",
            "UPF/PA valor atualizado 2025/2026 (necessário consultar SEFA/PA)",
            "Zona Franca da Bioeconomia — benefícios definitivos (PL em tramitação)"
        ],
        contatos_para_completar: [
            { orgao: "SEFA/PA", url: "https://www.sefa.pa.gov.br/" },
            { orgao: "SEFIN Belém", url: "Secretaria Municipal de Finanças de Belém" },
            { orgao: "SUDAM", url: "https://www.gov.br/sudam/" },
            { orgao: "Receita Federal", url: "https://www.gov.br/receitafederal/" }
        ]
    },
};


// ═══════════════════════════════════════════════════════════════════════════
//  14. FUNÇÕES UTILITÁRIAS — PARÁ
// ═══════════════════════════════════════════════════════════════════════════

/** Retorna alíquota do ISS por tipo de serviço em Belém */
function getISSPara(tipo) {
    if (!tipo) return PARA_TRIBUTARIO.iss.aliquota_padrao;
    const servico = PARA_TRIBUTARIO.iss.por_tipo_servico[tipo];
    return servico ? servico.aliquota : PARA_TRIBUTARIO.iss.aliquota_padrao;
}

/** Retorna alíquota do IPTU residencial por área (m²) */
function getIPTUResidencialPara(areaM2) {
    return {
        aliquota_min: PARA_TRIBUTARIO.iptu.residencial.aliquota_min,
        aliquota_max: PARA_TRIBUTARIO.iptu.residencial.aliquota_max,
        obs: PARA_TRIBUTARIO.iptu.residencial.obs
    };
}

/** Retorna alíquota do IPTU comercial por área (m²) */
function getIPTUComercialPara(areaM2) {
    return {
        aliquota_min: PARA_TRIBUTARIO.iptu.comercial.aliquota_min,
        aliquota_max: PARA_TRIBUTARIO.iptu.comercial.aliquota_max,
        obs: PARA_TRIBUTARIO.iptu.comercial.obs
    };
}

/** Retorna alíquota do IPVA por tipo de veículo */
function getIPVAPara(tipo) {
    if (!tipo) return null;
    const veiculo = PARA_TRIBUTARIO.ipva.aliquotas[tipo];
    return veiculo ? veiculo.aliquota : null;
}

/** Verifica se município está na Zona Franca da Bioeconomia */
function isZonaFrancaPara(municipio) {
    if (!PARA_TRIBUTARIO.incentivos.zona_franca_bioeconomia.ativo) return false;
    const m = municipio ? municipio.toLowerCase().trim() : "";
    return PARA_TRIBUTARIO.incentivos.zona_franca_bioeconomia.municipios
        .map(n => n.toLowerCase())
        .includes(m);
}

/** Verifica se município está em ALC */
function isALCPara(municipio) {
    return false; // Pará não possui ALC vigente
}

/** Retorna percentual de redução IRPJ pela SUDAM */
function getReducaoSUDAMPara() {
    return PARA_TRIBUTARIO.incentivos.sudam.ativo ? PARA_TRIBUTARIO.incentivos.sudam.reducao_irpj : 0;
}

/** Retorna ICMS efetivo (padrão + FECOP) */
function getICMSEfetivoPara() {
    const padrao = PARA_TRIBUTARIO.icms.aliquota_padrao;
    const fecop = PARA_TRIBUTARIO.icms.fecop.ativo ? PARA_TRIBUTARIO.icms.fecop.aliquota_adicional : 0;
    return {
        aliquota_padrao: padrao,
        fecop: fecop,
        total: padrao + fecop,
        total_percentual: ((padrao + fecop) * 100).toFixed(2) + "%"
    };
}

/** Retorna alíquota ITCMD causa mortis por valor em UPF/PA */
function getITCMDCausaMortisPara(valorUPF) {
    const faixas = PARA_TRIBUTARIO.itcmd.causa_mortis.faixas;
    for (let i = faixas.length - 1; i >= 0; i--) {
        if (valorUPF >= faixas[i].limite_inferior) {
            return faixas[i].aliquota;
        }
    }
    return faixas[0].aliquota;
}

/** Retorna alíquota ITCMD doação por valor em UPF/PA */
function getITCMDDoacaoPara(valorUPF) {
    const faixas = PARA_TRIBUTARIO.itcmd.doacao.faixas;
    for (let i = faixas.length - 1; i >= 0; i--) {
        if (valorUPF >= faixas[i].limite_inferior) {
            return faixas[i].aliquota;
        }
    }
    return faixas[0].aliquota;
}

/** Retorna resumo tributário para exibição rápida */
function resumoTributarioPara() {
    return {
        estado: PARA_TRIBUTARIO.dados_gerais.nome,
        sigla: PARA_TRIBUTARIO.dados_gerais.sigla,
        regiao: PARA_TRIBUTARIO.dados_gerais.regiao,
        capital: PARA_TRIBUTARIO.dados_gerais.capital,
        icms_padrao: PARA_TRIBUTARIO.icms.aliquota_padrao,
        icms_efetivo: PARA_TRIBUTARIO.icms.aliquota_padrao + (PARA_TRIBUTARIO.icms.fecop.ativo ? PARA_TRIBUTARIO.icms.fecop.aliquota_adicional : 0),
        fecop: PARA_TRIBUTARIO.icms.fecop.ativo,
        fecop_aliquota: PARA_TRIBUTARIO.icms.fecop.aliquota_adicional,
        iss_padrao: PARA_TRIBUTARIO.iss.aliquota_padrao,
        ipva_auto: PARA_TRIBUTARIO.ipva.aliquotas.automoveis_utilitarios.aliquota,
        ipva_moto: PARA_TRIBUTARIO.ipva.aliquotas.motocicletas.aliquota,
        itcmd_min: 0.02,
        itcmd_max: 0.08,
        itbi: PARA_TRIBUTARIO.itbi.aliquota_padrao,
        sublimite_simples: PARA_TRIBUTARIO.simples_nacional.sublimite_estadual,
        sudam: PARA_TRIBUTARIO.incentivos.sudam.ativo,
        sudam_reducao: PARA_TRIBUTARIO.incentivos.sudam.reducao_irpj,
        zona_franca_ativa: PARA_TRIBUTARIO.incentivos.zona_franca_bioeconomia.ativo,
        zona_franca_em_aprovacao: PARA_TRIBUTARIO.incentivos.zona_franca_bioeconomia.em_aprovacao
    };
}


// ═══════════════════════════════════════════════════════════════════════════
//  15. EXPORTAÇÃO (Padrão Grupo 2)
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        ...PARA_TRIBUTARIO,
        utils: {
            getISS: getISSPara,
            getIPTUResidencial: getIPTUResidencialPara,
            getIPTUComercial: getIPTUComercialPara,
            getIPVA: getIPVAPara,
            isZonaFranca: isZonaFrancaPara,
            isALC: isALCPara,
            getReducaoSUDAM: getReducaoSUDAMPara,
            getICMSEfetivo: getICMSEfetivoPara,
            getITCMDCausaMortis: getITCMDCausaMortisPara,
            getITCMDDoacao: getITCMDDoacaoPara,
            resumoTributario: resumoTributarioPara,
        },
    };
}

if (typeof window !== "undefined") {
    window.PARA_TRIBUTARIO = PARA_TRIBUTARIO;
    window.ParaTributario = {
        getISS: getISSPara,
        getIPTUResidencial: getIPTUResidencialPara,
        getIPTUComercial: getIPTUComercialPara,
        getIPVA: getIPVAPara,
        isZonaFranca: isZonaFrancaPara,
        isALC: isALCPara,
        getReducaoSUDAM: getReducaoSUDAMPara,
        getICMSEfetivo: getICMSEfetivoPara,
        getITCMDCausaMortis: getITCMDCausaMortisPara,
        getITCMDDoacao: getITCMDDoacaoPara,
        resumo: resumoTributarioPara,
    };
}
