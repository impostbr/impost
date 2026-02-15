/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AMAPA.JS — Base de Dados Tributária Completa do Estado do Amapá
 * ═══════════════════════════════════════════════════════════════════════════
 * Versão 3.0 — Padronizado conforme template roraima.js v3.0
 * Dados verificados via fontes oficiais (SEFAZ/AP, RFB, Planalto)
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
 *   08. taxas               — Estaduais e municipais (consolidadas)
 *   09. federal             — IRPJ, CSLL, PIS, COFINS, IOF, ITR, INSS, FGTS, IRPF
 *   10. simples_nacional    — Anexos, faixas, sublimite, MEI
 *   11. incentivos          — SUDAM/SUDENE, programas estaduais
 *   12. reforma_tributaria  — EC 132, LC 214, LC 224, LC 227, transição IBS/CBS
 *   13. cobertura           — Versão, itens localizados/pendentes, contatos
 *   14. funções utilitárias — Helpers de cálculo
 *   15. exportação          — module.exports + window (padrão Grupo 2)
 *
 * FONTES CONSULTADAS:
 *   • SEFAZ/AP — www.sefaz.ap.gov.br
 *   • Lei nº 400/1997 (Código Tributário do Estado do Amapá)
 *   • Decreto nº 2.269/1998 (RICMS/AP)
 *   • Convênio ICMS nº 199/22 (Monofásico combustíveis)
 *   • Protocolo ICMS 25/23 (ST produtos alimentícios)
 *   • Lei nº 3.152/2024 (Alíquota zero motos até 170cc)
 *   • Decreto nº 5.541/2025 (Regulamentação prazo ITCD)
 *   • Decreto nº 175/2026 (Prazo de pagamento ITBI)
 *   • Resolução CONDEL/SUDAM nº 136/2025 (SUDAM)
 *   • Receita Federal — www.gov.br/receitafederal
 *
 * ATUALIZAÇÃO: 10/02/2026
 * ═══════════════════════════════════════════════════════════════════════════
 */

const AMAPA_TRIBUTARIO = {

    // ═══════════════════════════════════════════════════════════════
    //  1. DADOS GERAIS
    // ═══════════════════════════════════════════════════════════════

    dados_gerais: {
        nome: "Amapá",
        sigla: "AP",
        regiao: "Norte",
        capital: "Macapá",
        codigo_ibge: 16,
        codigo_ibge_capital: 1600303,
        zona_franca: {
            ativo: false,
            obs: "Não possui Zona Franca (mas é beneficiário de SUDAM)"
        },
        area_livre_comercio: {
            ativo: false,
            obs: "Não possui ALC"
        },
        sudam: {
            ativo: true,
            obs: "Amapá está na área de atuação da SUDAM — redução de 75% em IRPJ e CSLL para empresas aprovadas",
            reducao_irpj: 0.75,
            reducao_csll: 0.75,
            base_legal: "Resolução CONDEL/SUDAM nº 136, de 12 de agosto de 2025"
        },
        sudene: {
            ativo: false,
            obs: "Amapá não está na área de atuação da SUDENE"
        },
        sefaz: {
            site: "https://www.sefaz.ap.gov.br/",
            nome: "SEFAZ-AP - Secretaria de Estado da Fazenda do Amapá"
        },
        prefeitura_capital: {
            site: "https://macapa.ap.gov.br/",
            nome: "Prefeitura Municipal de Macapá"
        },
        legislacao_base: [
            { norma: "Lei nº 400/1997", assunto: "Código Tributário do Estado do Amapá" },
            { norma: "Decreto nº 2.269/1998", assunto: "RICMS/AP — Regulamento do ICMS" },
            { norma: "Lei Complementar nº 87/1996", assunto: "Lei Kandir — base do ICMS" }
        ],
        destaque: "Amapá é beneficiário de SUDAM com redução de 75% em IRPJ e CSLL. ICMS padrão 18%. IPVA com alíquota ZERO para motos até 170cc (Lei 3152/2024). ITCD progressivo (2% a 6%). IPVA desconto de 20% cota única."
    },

    // ═══════════════════════════════════════════════════════════════
    //  2. ICMS — IMPOSTO SOBRE CIRCULAÇÃO DE MERCADORIAS E SERVIÇOS
    // ═══════════════════════════════════════════════════════════════

    icms: {
        aliquota_padrao: 0.18,
        aliquota_padrao_percentual: "18%",
        aliquota_anterior: 0.18,
        data_aumento: null,
        base_legal: "RICMS/AP, Art. 25, inciso III, alínea 'i', Anexo I",

        aliquotas_diferenciadas: {
            combustiveis:            { aliquota: 0.25, obs: "Gasolina, diesel, etanol, GNV, GLP — Convênio ICMS 199/22 (monofásico)", base_legal: "Convênio ICMS nº 199/22" },
            bebidas_alcoolicas:      { aliquota_min: 0.25, aliquota_max: 0.29, obs: "25% a 29% — alíquota majorada", base_legal: "RICMS/AP" },
            cigarros_fumo:           { aliquota_min: 0.25, aliquota_max: 0.29, obs: "25% a 29% — alíquota majorada", base_legal: "RICMS/AP" },
            armas_municoes:          { aliquota: 0.25, base_legal: "RICMS/AP" },
            produtos_superfluos:     { aliquota_min: 0.25, aliquota_max: 0.29, obs: "25% a 29% — alíquota majorada", base_legal: "RICMS/AP" },
            energia_eletrica:        { aliquota: 0.18, obs: "Alíquota padrão", base_legal: "RICMS/AP" },
            telecomunicacoes:        { aliquota: 0.18, obs: "Alíquota padrão", base_legal: "RICMS/AP" },
            cesta_basica:            { aliquota: 0.00, obs: "ISENTOS — produtos da cesta básica", base_legal: "RICMS/AP" },
            medicamentos_genericos:  { aliquota: 0.00, obs: "ISENTOS", base_legal: "RICMS/AP" },
            medicamentos_marca:      { aliquota: 0.18, obs: "Alíquota padrão", base_legal: "RICMS/AP" },
            veiculos_automotores:    { aliquota: 0.18, obs: "Alíquota padrão", base_legal: "RICMS/AP" },
            perfumaria_cosmeticos:   { aliquota: 0.18, obs: "Alíquota padrão", base_legal: "RICMS/AP" },
            informatica:             { aliquota: 0.18, obs: "Alíquota padrão", base_legal: "RICMS/AP" },
            maquinas_equipamentos:   { aliquota: 0.18, obs: "Alíquota padrão", base_legal: "RICMS/AP" },
            insumos_agropecuarios:   { aliquota: 0.18, obs: "Alíquota padrão", base_legal: "RICMS/AP" },
            embarcacoes_esporte:     { aliquota: 0.18, obs: "Alíquota padrão", base_legal: "RICMS/AP" }
        },

        aliquotas_interestaduais: {
            norte_nordeste_co_es: 0.12,
            sul_sudeste_exceto_es: 0.07,
            nao_contribuinte: 0.18,
            obs: "Conforme EC 87/2015. AP está na região Norte."
        },

        difal: {
            formula: "DIFAL = (Alíquota Interna Destino - Alíquota Interestadual) × Base de Cálculo",
            partilha_destino: 1.00,
            partilha_origem: 0.00,
            obs: "100% para estado de destino (EC 87/2015 — transição concluída).",
            exemplo: {
                cenario: "Remessa de SP para AP (não-contribuinte)",
                aliquota_interestadual_sp: 0.07,
                aliquota_interna_ap: 0.18,
                difal: 0.11,
                valor_exemplo: 1000,
                difal_valor: 110
            }
        },

        importacao: {
            aliquota: 0.18,
            obs: "Alíquota padrão aplicada em operações de importação"
        },

        fecop: {
            ativo: false,
            obs: "Amapá NÃO possui FECOP/FEM adicional ao ICMS. As alíquotas já incluem a carga tributária total."
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
                "Lubrificantes",
                "Produtos alimentícios (Protocolo ICMS 25/23)"
            ],
            mva: {
                combustiveis:         { min: 0.08, max: 0.12, obs: "MVA 8% a 12%" },
                energia_eletrica:     { min: 0.05, max: 0.08, obs: "MVA 5% a 8%" },
                bebidas_alcoolicas:   { min: 0.15, max: 0.25, obs: "MVA 15% a 25%" },
                cigarros:             { min: 0.20, max: 0.30, obs: "MVA 20% a 30%" },
                medicamentos:         { min: 0.25, max: 0.35, obs: "MVA 25% a 35%" },
                veiculos_automotores: { min: 0.15, max: 0.25, obs: "MVA 15% a 25%" },
                produtos_alimenticios: { obs: "Variável conforme Protocolo ICMS 25/23" }
            }
        },

        monofasico_combustiveis: {
            obs: "Valores ad rem por litro — Convênio ICMS nº 199/22",
            base_legal: "Convênio ICMS nº 199/22",
            gasolina_comum:   { valor_por_litro: 1.0500, obs: "R$ 1,0500/litro" },
            diesel_biodiesel: { valor_por_litro: 0.9456, obs: "R$ 0,9456/litro (diesel + biodiesel)" },
            etanol:           { valor_por_litro: 0.7500, obs: "R$ 0,7500/litro" },
            glp:              { valor_por_kg: 0.4200, obs: "R$ 0,4200/kg" }
        },

        convenios_2026: {
            obs: "Amapá possui diversos convênios ICMS vigentes — consultar SEFAZ-AP",
            base_legal: "Convênios ICMS diversos"
        },

        legislacao: [
            { norma: "Lei nº 400/1997", assunto: "Código Tributário do Amapá" },
            { norma: "Decreto nº 2.269/1998", assunto: "RICMS/AP" },
            { norma: "Convênio ICMS nº 199/22", assunto: "ICMS monofásico sobre combustíveis" },
            { norma: "Protocolo ICMS 25/23", assunto: "ST produtos alimentícios" }
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    //  3. IPVA — IMPOSTO SOBRE PROPRIEDADE DE VEÍCULOS AUTOMOTORES
    // ═══════════════════════════════════════════════════════════════

    ipva: {
        destaque: "IPVA com ALÍQUOTA ZERO para motocicletas até 170cc (Lei 3152/2024). Desconto de 20% para pagamento em cota única até 17/março.",

        aliquotas: {
            automoveis_camionetes:    { aliquota: 0.03, obs: "Automóveis e camionetes — 3%" },
            motocicletas_acima_180cc: { aliquota: 0.035, obs: "Motocicletas acima de 180cc — 3,5%" },
            motocicletas_ate_170cc:   { aliquota: 0.00, obs: "ISENTOS — alíquota zero desde 2024 (Lei 3152/2024)" },
            caminhoes:                { aliquota: 0.015, obs: "Caminhões" },
            onibus_micro:             { aliquota: 0.015, obs: "Ônibus e micro-ônibus" },
            ciclomotores_motonetas:   { aliquota: 0.015, obs: "Ciclomotores, motonetas, quadriciclos, triciclos" },
            embarcacoes:              { aliquota: 0.03, obs: "Embarcações" },
            aeronaves:                { aliquota: 0.03, obs: "Aeronaves" }
        },

        isencoes: [
            "Veículos com mais de 20 anos de fabricação",
            "Pessoa com deficiência (PCD) — com comprovação",
            "Táxis",
            "Veículos oficiais (administração pública)",
            "Ônibus de transporte coletivo",
            "Motocicletas até 170cc — alíquota zero (Lei 3152/2024)"
        ],

        descontos_antecipacao: {
            pagamento_vista: {
                desconto: 0.20,
                desconto_percentual: "20%",
                obs: "Desconto de 20% para pagamento em cota única até 17 de março — UM DOS MAIORES DESCONTOS DO BRASIL"
            },
            parcelamento: {
                parcelas: 6,
                obs: "Até 6 parcelas sem desconto"
            }
        },

        base_calculo: "Tabela FIPE — valor venal do veículo",

        calendario_vencimento: {
            obs: "Cota única com desconto de 20% até 17 de março. Demais parcelas conforme calendário SEFAZ-AP.",
            dados_disponiveis: false
        },

        legislacao: [
            { norma: "Lei Estadual de IPVA do Amapá", assunto: "Lei base do IPVA" },
            { norma: "Lei nº 3.152/2024", assunto: "Alíquota zero para motos até 170cc" }
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    //  4. ITCMD — IMPOSTO TRANSMISSÃO CAUSA MORTIS E DOAÇÃO
    //     (denominado ITCD na legislação do Amapá)
    // ═══════════════════════════════════════════════════════════════

    itcmd: {
        tipo: "progressiva",
        denominacao_local: "ITCD — Imposto sobre Transmissão Causa Mortis e Doação",
        obs: "Amapá já adota alíquotas PROGRESSIVAS. Faixas em UFM/AP (Unidade Padrão Fiscal do Amapá). Causa mortis: 2% a 6%. Doação: 2% a 5%.",

        causa_mortis: {
            tipo: "progressiva",
            unidade_referencia: "UFM/AP",
            faixas: [
                { limite_inferior: 0,      limite_superior_ufm: 10000,   aliquota: 0.02, obs: "2%" },
                { limite_inferior_ufm: 10001, limite_superior_ufm: 20000,   aliquota: 0.03, obs: "3%" },
                { limite_inferior_ufm: 20001, limite_superior_ufm: 50000,   aliquota: 0.04, obs: "4%" },
                { limite_inferior_ufm: 50001, limite_superior_ufm: 100000,  aliquota: 0.05, obs: "5%" },
                { limite_inferior_ufm: 100001, limite_superior_ufm: null,    aliquota: 0.06, obs: "6%" }
            ]
        },

        doacao: {
            tipo: "progressiva",
            unidade_referencia: "UFM/AP",
            faixas: [
                { limite_inferior: 0,      limite_superior_ufm: 10000,   aliquota: 0.02, obs: "2%" },
                { limite_inferior_ufm: 10001, limite_superior_ufm: 20000,   aliquota: 0.03, obs: "3%" },
                { limite_inferior_ufm: 20001, limite_superior_ufm: 50000,   aliquota: 0.04, obs: "4%" },
                { limite_inferior_ufm: 50001, limite_superior_ufm: null,    aliquota: 0.05, obs: "5%" }
            ],
            obs: "Doação tem teto de 5% (causa mortis vai até 6%)"
        },

        base_calculo: "Valor venal do bem (valor de mercado) ou valor declarado — o que for maior",

        isencoes: [
            "Transmissão de imóvel rural até 25 hectares para herdeiro",
            "Imóvel destinado à morada do cônjuge supérstite (causa mortis)",
            "Pequena propriedade familiar (até 25 hectares)",
            "Doações para instituições de caridade e educação",
            "Doações para entidades de utilidade pública"
        ],

        prazo_pagamento: "30 dias a partir da data do óbito ou da doação (Decreto nº 5541/2025)",

        legislacao: [
            { norma: "Lei Estadual de ITCD do Amapá", assunto: "Lei base do ITCD" },
            { norma: "Decreto nº 5.541/2025", assunto: "Regulamentação prazo de pagamento ITCD" }
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    //  5. ISS — IMPOSTO SOBRE SERVIÇOS (Macapá — referência)
    // ═══════════════════════════════════════════════════════════════

    iss: {
        municipio_referencia: "Macapá",
        aliquota_padrao: 0.05,
        aliquota_minima: 0.02,
        aliquota_maxima: 0.05,
        obs: "Macapá adota alíquota padrão de 5% para todos os serviços. ISS fixo anual para profissionais autônomos e sociedades uniprofissionais.",

        ufm: {
            valor_2025: 4.7809,
            obs: "UFM (Unidade Fiscal do Município) 2025 = R$ 4,7809"
        },

        iss_fixo_anual: {
            profissional_nivel_medio:   { ufm: 261, valor_reais_2025: 1247.81, obs: "261 UFM = R$ 1.247,81" },
            profissional_nivel_superior: { ufm: 522, valor_reais_2025: 2495.63, obs: "522 UFM = R$ 2.495,63" },
            demais_trabalho_pessoal:    { ufm: 87,  valor_reais_2025: 415.94,  obs: "87 UFM = R$ 415,94" }
        },

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
            reparacao_manutencao: { aliquota: 0.05, descricao: "Reparação e manutenção" },
            geral:                { aliquota: 0.05, descricao: "Demais serviços — alíquota padrão 5%" }
        },

        legislacao: [
            { norma: "Legislação municipal de Macapá", assunto: "Regulamentação ISS em Macapá" },
            { norma: "Lei Complementar nº 116/2003", assunto: "Lista de serviços (federal)" }
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    //  6. IPTU — IMPOSTO PREDIAL E TERRITORIAL URBANO (Macapá)
    // ═══════════════════════════════════════════════════════════════

    iptu: {
        municipio_referencia: "Macapá",

        residencial: {
            aliquota_min: 0.005,
            aliquota_max: 0.01,
            obs: "0,50% a 1,00% — conforme faixa de valor venal"
        },

        comercial: {
            aliquota_min: 0.008,
            aliquota_max: 0.015,
            obs: "0,80% a 1,50% — conforme faixa de valor venal"
        },

        terreno_nao_edificado: {
            aliquota_min: 0.01,
            aliquota_max: 0.02,
            obs: "1,00% a 2,00% — conforme faixa de valor venal"
        },

        progressividade: {
            ativo: true,
            tipo: "faixas_de_valor_venal",
            obs: "Progressivo conforme valor venal do imóvel"
        },

        descontos: {
            cota_unica_ate_10_marco: { desconto: 0.20, obs: "20% de desconto para pagamento em cota única até 10 de março" },
            cota_unica_11_marco_10_abril: { desconto: 0.10, obs: "10% de desconto para pagamento em cota única de 11/março a 10/abril" },
            parcelamento: { parcelas: 8, obs: "Até 8 parcelas sem desconto" }
        },

        isencoes: [
            "Imóveis de instituições de caridade",
            "Imóveis de entidades de utilidade pública",
            "Imóveis da União, Estados e Municípios",
            "Templos religiosos"
        ],

        legislacao: [
            { norma: "Legislação municipal de Macapá", assunto: "IPTU progressivo" }
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    //  7. ITBI — IMPOSTO TRANSMISSÃO DE BENS IMÓVEIS (Macapá)
    // ═══════════════════════════════════════════════════════════════

    itbi: {
        municipio_referencia: "Macapá",
        aliquota_padrao: 0.02,
        aliquota_padrao_percentual: "2%",
        base_calculo: "Valor do bem ou direito transmitido",
        obs: "Alíquota de 2% — uma das mais baixas do Brasil.",

        prazo_pagamento: "Até 20 dias após o registro no cartório (Decreto nº 175/2026)",

        isencoes: [
            "Transmissões para entidades de caridade",
            "Transmissões para órgãos públicos",
            "Transmissões para fins de reforma urbana"
        ],

        legislacao: [
            { norma: "Legislação municipal de Macapá", assunto: "ITBI" },
            { norma: "Decreto nº 175/2026", assunto: "Prazo de pagamento ITBI" }
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    //  8. TAXAS ESTADUAIS E MUNICIPAIS (consolidadas)
    // ═══════════════════════════════════════════════════════════════

    taxas: {

        // ── Taxas Estaduais ──
        estaduais: {
            licenciamento_veiculos: {
                nome: "Taxa de Licenciamento de Veículos",
                valor: null,
                obs: "Incluída no IPVA"
            },
            taxa_judiciaria: {
                nome: "Taxa Judiciária",
                valor: null,
                obs: "Variável conforme tipo de ação"
            },
            taxa_sefaz: {
                nome: "Taxa de Serviços da SEFAZ",
                valor: null,
                obs: "Variável conforme serviço"
            },
            taxa_ambiental: {
                nome: "Taxa Ambiental",
                valor: null,
                obs: "Variável conforme atividade"
            },
            taxa_incendio: {
                nome: "Taxa de Incêndio/Bombeiros",
                valor: null,
                obs: "Variável conforme município"
            },
            emolumentos_cartorarios: {
                nome: "Emolumentos Cartorários",
                valor: null,
                obs: "Conforme tabela de cartórios do AP"
            },
            obs_geral: "Valores das taxas estaduais são variáveis e atualizados anualmente. Consultar SEFAZ-AP."
        },

        // ── Taxas Municipais (Macapá) ──
        municipais_macapa: {
            municipio_referencia: "Macapá",
            tflf: {
                nome: "Taxa de Licença para Fiscalização, Localização e Funcionamento (TFLF)",
                valor: null,
                obs: "Variável conforme atividade (em UFM). Desconto: 10% cota única até 10/março + 2% adicional por exercício pago nos últimos 5 anos."
            },
            coleta_residuos: { valor: null, obs: "Taxa de Coleta de Resíduos Sólidos Urbanos — variável conforme área construída, cobrada com IPTU" },
            publicidade:     { valor: null, obs: "Taxa de Publicidade — variável conforme tipo" },
            obs_geral: "Valores variáveis conforme tabelas municipais de Macapá. Consultar Prefeitura."
        },

        legislacao: [
            { norma: "Legislação estadual do Amapá", assunto: "Taxas estaduais" },
            { norma: "Legislação municipal de Macapá", assunto: "Taxas municipais" }
        ],
    },

    // ═══════════════════════════════════════════════════════════════
    //  9. IMPOSTOS FEDERAIS (aplicáveis no AP)
    // ═══════════════════════════════════════════════════════════════

    federal: {

        irpj: {
            lucro_real: {
                aliquota: 0.15,
                adicional: { aliquota: 0.10, limite_mensal: 20000, obs: "Sobre excedente de R$ 20.000/mês ou R$ 240.000/ano" }
            },
            lucro_presumido: {
                aliquota: 0.15,
                presuncao_comercio_industria: 0.08,
                presuncao_servicos: 0.16,
                presuncao_transporte: 0.16,
                adicional: { aliquota: 0.10, limite_mensal: 20000 },
                obs_2026: "LC 224/2025 — acréscimo de 10% na base de presunção a partir de 2026 (comércio 8% → 8,8%, serviços 16% → 17,6%)"
            },
            incentivos_regionais: {
                sudam: {
                    ativo: true,
                    reducao_irpj: 0.75,
                    reducao_percentual: "75%",
                    isencao_atividades_especificas: true,
                    reinvestimento: { min: 0.50, max: 0.75, obs: "50% a 75% de redução com reinvestimento de lucros" },
                    base_legal: "Resolução CONDEL/SUDAM nº 136/2025",
                    requisitos: [
                        "Empresa localizada na Amazônia Legal",
                        "Projeto alinhado com desenvolvimento sustentável",
                        "Aprovação prévia da SUDAM",
                        "Cumprimento de metas de investimento",
                        "Geração de empregos locais"
                    ]
                },
                sudene: { ativo: false }
            }
        },

        irpf: {
            tabela_mensal_2025: [
                { limite_inferior: 0,       limite_superior: 2112.00, aliquota: 0,     deducao: 0,      obs: "Isento" },
                { limite_inferior: 2112.01, limite_superior: 2826.65, aliquota: 0.075, deducao: 158.40 },
                { limite_inferior: 2826.66, limite_superior: 3751.05, aliquota: 0.15,  deducao: 370.40 },
                { limite_inferior: 3751.06, limite_superior: 4664.68, aliquota: 0.225, deducao: 649.73 },
                { limite_inferior: 4664.69, limite_superior: null,    aliquota: 0.275, deducao: 869.36 }
            ]
        },

        csll: {
            aliquota_geral: 0.09,
            aliquota_financeiras: 0.15,
            incentivos_regionais: {
                sudam: {
                    ativo: true,
                    reducao_csll: 0.75,
                    reducao_percentual: "75%",
                    isencao_atividades_especificas: true,
                    base_legal: "Resolução CONDEL/SUDAM nº 136/2025"
                },
                sudene: { ativo: false }
            }
        },

        pis: {
            regime_cumulativo: 0.0065,
            regime_nao_cumulativo: 0.0165,
            importacao: 0.0165
        },

        cofins: {
            regime_cumulativo: 0.03,
            regime_nao_cumulativo: 0.076,
            importacao: 0.076
        },

        ipi: {
            referencia: "TIPI (Tabela de Incidência do IPI) vigente",
            incentivos_sudam: {
                reducao_geral: 0.35,
                obs: "Redução geral de 35% nas alíquotas para região Norte/SUDAM. Isenção para produtos específicos."
            }
        },

        iof: {
            credito_pf:   { aliquota_min: 0.0038, aliquota_max: 0.03 },
            credito_pj:   { aliquota_min: 0.0038, aliquota_max: 0.015 },
            cambio:       { aliquota_min: 0.0038, aliquota_max: 0.25 },
            seguros:      { aliquota_min: 0.0038, aliquota_max: 0.25 },
            titulos:      { aliquota_min: 0.0038, aliquota_max: 0.25 }
        },

        ii: {
            referencia: "TEC — Nomenclatura Comum do Mercosul (NCM)",
            aliquota_min: 0,
            aliquota_max: 0.55
        },

        ie: {
            aliquota_geral: 0.30,
            aliquota_vigente_2025: 0.09,
            obs: "Facultado ao Poder Executivo reduzir — alíquota vigente de 9% (redução em vigor)"
        },

        itr: {
            obs: "Conforme tabela federal por grau de utilização e tamanho do imóvel rural",
            faixas: [
                { tamanho: "Até 50 ha",          aliquota_min: 0.0003, aliquota_max: 0.003 },
                { tamanho: "50 a 100 ha",        aliquota_min: 0.0015, aliquota_max: 0.004 },
                { tamanho: "100 a 500 ha",       aliquota_min: 0.003,  aliquota_max: 0.005 },
                { tamanho: "500 a 1.000 ha",     aliquota_min: 0.004,  aliquota_max: 0.006 },
                { tamanho: "Acima de 1.000 ha",  aliquota_min: 0.005,  aliquota_max: 0.008 }
            ]
        },

        inss: {
            patronal: 0.20,
            rat_sat: { min: 0.005, max: 0.03, obs: "Conforme risco da atividade (RAT/FAP)" },
            terceiros: { min: 0.015, max: 0.025, obs: "Sistema S — 1,5% a 2,5%" },
            empregado_2025: [
                { limite_inferior: 0,       limite_superior: 1518.00, aliquota: 0.075 },
                { limite_inferior: 1518.01, limite_superior: 2793.88, aliquota: 0.09 },
                { limite_inferior: 2793.89, limite_superior: 4190.83, aliquota: 0.12 },
                { limite_inferior: 4190.84, limite_superior: 8381.66, aliquota: 0.14 }
            ]
        },

        fgts: {
            aliquota: 0.08,
            contribuicao_social: { min: 0.005, max: 0.008, obs: "0,5% a 0,8% adicional" },
            obs: "Depósito mensal obrigatório sobre folha de pagamento"
        }
    },

    // ═══════════════════════════════════════════════════════════════
    //  10. SIMPLES NACIONAL (aplicável no AP)
    // ═══════════════════════════════════════════════════════════════

    simples_nacional: {
        sublimite_estadual: 3600000,
        sublimite_obs: "R$ 3.600.000,00 — AP adota sublimite federal. Empresas que ultrapassam devem recolher ICMS e ISS fora do Simples.",

        mei: {
            limite_anual: 81000,
            das_mensal: {
                comercio_industria: 71.60,
                servicos: 75.60,
                comercio_servicos: 76.60,
                obs: "Valores mensais do DAS MEI"
            },
            icms_fixo: 1.00,
            iss_fixo: 5.00,
            composicao: "INSS + ICMS e/ou ISS"
        },

        anexo_i_comercio: {
            nome: "Anexo I — Comércio",
            faixas: [
                { faixa: 1,  limite_inferior: 0,          limite_superior: 180000,   aliquota: 0.04,    deducao: 0 },
                { faixa: 2,  limite_inferior: 180000.01,   limite_superior: 360000,   aliquota: 0.0547,  deducao: 0 },
                { faixa: 3,  limite_inferior: 360000.01,   limite_superior: 540000,   aliquota: 0.0684,  deducao: 0 },
                { faixa: 4,  limite_inferior: 540000.01,   limite_superior: 720000,   aliquota: 0.0754,  deducao: 0 },
                { faixa: 5,  limite_inferior: 720000.01,   limite_superior: 900000,   aliquota: 0.0813,  deducao: 0 },
                { faixa: 6,  limite_inferior: 900000.01,   limite_superior: 1080000,  aliquota: 0.0860,  deducao: 0 },
                { faixa: 7,  limite_inferior: 1080000.01,  limite_superior: 1260000,  aliquota: 0.0895,  deducao: 0 },
                { faixa: 8,  limite_inferior: 1260000.01,  limite_superior: 1440000,  aliquota: 0.0927,  deducao: 0 },
                { faixa: 9,  limite_inferior: 1440000.01,  limite_superior: 1620000,  aliquota: 0.0957,  deducao: 0 },
                { faixa: 10, limite_inferior: 1620000.01,  limite_superior: 1800000,  aliquota: 0.0987,  deducao: 0 },
                { faixa: 11, limite_inferior: 1800000.01,  limite_superior: 3600000,  aliquota_min: 0.1017, aliquota_max: 0.1493, obs: "10,17% a 14,93%" }
            ]
        },

        anexo_ii_industria: {
            nome: "Anexo II — Indústria",
            faixas: [
                { faixa: 1,  limite_inferior: 0,          limite_superior: 180000,   aliquota: 0.045,   deducao: 0 },
                { faixa: 2,  limite_inferior: 180000.01,   limite_superior: 360000,   aliquota: 0.0597,  deducao: 0 },
                { faixa: 3,  limite_inferior: 360000.01,   limite_superior: 540000,   aliquota: 0.0734,  deducao: 0 },
                { faixa: 4,  limite_inferior: 540000.01,   limite_superior: 720000,   aliquota: 0.0804,  deducao: 0 },
                { faixa: 5,  limite_inferior: 720000.01,   limite_superior: 900000,   aliquota: 0.0863,  deducao: 0 },
                { faixa: 6,  limite_inferior: 900000.01,   limite_superior: 1080000,  aliquota: 0.0910,  deducao: 0 },
                { faixa: 7,  limite_inferior: 1080000.01,  limite_superior: 1260000,  aliquota: 0.0945,  deducao: 0 },
                { faixa: 8,  limite_inferior: 1260000.01,  limite_superior: 1440000,  aliquota: 0.0977,  deducao: 0 },
                { faixa: 9,  limite_inferior: 1440000.01,  limite_superior: 1620000,  aliquota: 0.1007,  deducao: 0 },
                { faixa: 10, limite_inferior: 1620000.01,  limite_superior: 1800000,  aliquota: 0.1037,  deducao: 0 },
                { faixa: 11, limite_inferior: 1800000.01,  limite_superior: 3600000,  aliquota_min: 0.1067, aliquota_max: 0.1543, obs: "10,67% a 15,43%" }
            ]
        },

        anexo_iii_servicos: {
            nome: "Anexo III — Serviços",
            faixas: [
                { faixa: 1,  limite_inferior: 0,          limite_superior: 180000,   aliquota: 0.06,    deducao: 0 },
                { faixa: 2,  limite_inferior: 180000.01,   limite_superior: 360000,   aliquota: 0.0821,  deducao: 0 },
                { faixa: 3,  limite_inferior: 360000.01,   limite_superior: 540000,   aliquota: 0.1026,  deducao: 0 },
                { faixa: 4,  limite_inferior: 540000.01,   limite_superior: 720000,   aliquota: 0.1151,  deducao: 0 },
                { faixa: 5,  limite_inferior: 720000.01,   limite_superior: 900000,   aliquota: 0.1260,  deducao: 0 },
                { faixa: 6,  limite_inferior: 900000.01,   limite_superior: 1080000,  aliquota: 0.1355,  deducao: 0 },
                { faixa: 7,  limite_inferior: 1080000.01,  limite_superior: 1260000,  aliquota: 0.1435,  deducao: 0 },
                { faixa: 8,  limite_inferior: 1260000.01,  limite_superior: 1440000,  aliquota: 0.1510,  deducao: 0 },
                { faixa: 9,  limite_inferior: 1440000.01,  limite_superior: 1620000,  aliquota: 0.1580,  deducao: 0 },
                { faixa: 10, limite_inferior: 1620000.01,  limite_superior: 1800000,  aliquota: 0.1650,  deducao: 0 },
                { faixa: 11, limite_inferior: 1800000.01,  limite_superior: 3600000,  aliquota_min: 0.1720, aliquota_max: 0.2245, obs: "17,20% a 22,45%" }
            ]
        },

        anexo_iv_servicos_profissionais: {
            nome: "Anexo IV — Serviços Profissionais",
            faixas: [
                { faixa: 1,  limite_inferior: 0,          limite_superior: 180000,   aliquota: 0.1693,  deducao: 0 },
                { faixa: 2,  limite_inferior: 180000.01,   limite_superior: 360000,   aliquota: 0.1842,  deducao: 0 },
                { faixa: 3,  limite_inferior: 360000.01,   limite_superior: 540000,   aliquota: 0.1988,  deducao: 0 },
                { faixa: 4,  limite_inferior: 540000.01,   limite_superior: 720000,   aliquota: 0.2132,  deducao: 0 },
                { faixa: 5,  limite_inferior: 720000.01,   limite_superior: 900000,   aliquota: 0.2245,  deducao: 0 },
                { faixa: 6,  limite_inferior: 900000.01,   limite_superior: 1080000,  aliquota: 0.2348,  deducao: 0 },
                { faixa: 7,  limite_inferior: 1080000.01,  limite_superior: 1260000,  aliquota: 0.2449,  deducao: 0 },
                { faixa: 8,  limite_inferior: 1260000.01,  limite_superior: 1440000,  aliquota: 0.2545,  deducao: 0 },
                { faixa: 9,  limite_inferior: 1440000.01,  limite_superior: 1620000,  aliquota: 0.2638,  deducao: 0 },
                { faixa: 10, limite_inferior: 1620000.01,  limite_superior: 1800000,  aliquota: 0.2730,  deducao: 0 },
                { faixa: 11, limite_inferior: 1800000.01,  limite_superior: 3600000,  aliquota_min: 0.2823, aliquota_max: 0.3366, obs: "28,23% a 33,66%" }
            ]
        },

        anexo_v_servicos_transportes: {
            nome: "Anexo V — Serviços de Transporte / Outros",
            faixas: [
                { faixa: 1,  limite_inferior: 0,          limite_superior: 180000,   aliquota: 0.16,    deducao: 0 },
                { faixa: 2,  limite_inferior: 180000.01,   limite_superior: 360000,   aliquota: 0.1742,  deducao: 0 },
                { faixa: 3,  limite_inferior: 360000.01,   limite_superior: 540000,   aliquota: 0.1878,  deducao: 0 },
                { faixa: 4,  limite_inferior: 540000.01,   limite_superior: 720000,   aliquota: 0.2011,  deducao: 0 },
                { faixa: 5,  limite_inferior: 720000.01,   limite_superior: 900000,   aliquota: 0.2118,  deducao: 0 },
                { faixa: 6,  limite_inferior: 900000.01,   limite_superior: 1080000,  aliquota: 0.2216,  deducao: 0 },
                { faixa: 7,  limite_inferior: 1080000.01,  limite_superior: 1260000,  aliquota: 0.2311,  deducao: 0 },
                { faixa: 8,  limite_inferior: 1260000.01,  limite_superior: 1440000,  aliquota: 0.2404,  deducao: 0 },
                { faixa: 9,  limite_inferior: 1440000.01,  limite_superior: 1620000,  aliquota: 0.2494,  deducao: 0 },
                { faixa: 10, limite_inferior: 1620000.01,  limite_superior: 1800000,  aliquota: 0.2581,  deducao: 0 },
                { faixa: 11, limite_inferior: 1800000.01,  limite_superior: 3600000,  aliquota_min: 0.2668, aliquota_max: 0.3217, obs: "26,68% a 32,17%" }
            ]
        }
    },

    // ═══════════════════════════════════════════════════════════════
    //  11. INCENTIVOS FISCAIS E BENEFÍCIOS REGIONAIS
    // ═══════════════════════════════════════════════════════════════

    incentivos: {
        sudam: {
            ativo: true,
            descricao: "SUDAM — Superintendência do Desenvolvimento da Amazônia",
            reducao_irpj: 0.75,
            reducao_csll: 0.75,
            reinvestimento: { min: 0.50, max: 0.75 },
            isencao_atividades_especificas: true,
            reducao_ipi: 0.35,
            base_legal: "Resolução CONDEL/SUDAM nº 136/2025",
            requisitos: [
                "Empresa localizada na Amazônia Legal",
                "Projeto alinhado com desenvolvimento sustentável",
                "Aprovação prévia da SUDAM",
                "Cumprimento de metas de investimento",
                "Geração de empregos locais"
            ]
        },

        sudene: {
            ativo: false,
            obs: "Não aplicável ao Amapá"
        },

        zona_franca: {
            ativo: false,
            obs: "Amapá não possui Zona Franca"
        },

        programa_desenvolvimento_regional: {
            ativo: true,
            descricao: "Programa de Desenvolvimento Regional — redução de ICMS, isenção de taxas estaduais",
            setores: ["Indústria", "Agronegócio", "Turismo"],
            obs: "Vigência contínua com renovação anual — consultar SEFAZ-AP"
        },

        agricultura_familiar: {
            ativo: true,
            beneficios: [
                "Redução de ICMS em operações internas",
                "Redução de ITR",
                "Isenção de taxas estaduais"
            ]
        },

        exportadores: {
            ativo: true,
            beneficios: [
                "Isenção de ICMS em operações de exportação",
                "Redução de IE",
                "Benefícios de drawback"
            ]
        },

        medicamentos_genericos: {
            ativo: true,
            beneficio: "Isenção de ICMS para medicamentos genéricos",
            base_legal: "RICMS/AP"
        },

        convenios_icms: {
            ativo: true,
            descricao: "Diversos convênios ICMS vigentes",
            obs: "Consultar SEFAZ-AP para lista atualizada"
        }
    },

    // ═══════════════════════════════════════════════════════════════
    //  12. REFORMA TRIBUTÁRIA
    // ═══════════════════════════════════════════════════════════════

    reforma_tributaria: {
        ibs: {
            nome: "IBS — Imposto sobre Bens e Serviços",
            substitui: ["ICMS (estadual)", "ISS (municipal)"],
            aliquota_estadual_estimada: "5% a 7%",
            cronograma: [
                { ano: 2026, aliquota: 0.009, obs: "Início com alíquota de 0,9% (teste)" },
                { ano: 2027, obs: "Aumento gradual" },
                { ano: 2033, obs: "Alíquota definitiva estimada 10% a 11%" }
            ]
        },

        cbs: {
            nome: "CBS — Contribuição sobre Bens e Serviços",
            substitui: ["PIS", "COFINS", "IPI (parcialmente)"],
            aliquota_estimada: "10% a 11%",
            cronograma: [
                { ano: 2026, aliquota: 0.009, obs: "Início com alíquota de 0,9%" },
                { ano: 2027, obs: "Aumento gradual" },
                { ano: 2033, obs: "Alíquota definitiva" }
            ]
        },

        is: {
            nome: "IS — Imposto Seletivo",
            incidencia: "Produtos e serviços prejudiciais à saúde e ao meio ambiente",
            aliquota_estimada: "25% a 26,5%",
            produtos_afetados: [
                "Bebidas alcoólicas",
                "Cigarros e fumo",
                "Combustíveis fósseis",
                "Produtos de origem animal",
                "Produtos prejudiciais ao meio ambiente"
            ]
        },

        cronograma_detalhado_ap: {
            "2026": { icms: 0.18, iss_macapa: 0.05, ibs_teste: 0.009, cbs_teste: 0.009, obs: "Fase de testes" },
            "2027": { icms_estimado: 0.162, obs: "ICMS reduz ~10%" },
            "2028": { icms_estimado: 0.146 },
            "2029": { icms_estimado: 0.131 },
            "2030": { icms_estimado: 0.118 },
            "2031": { icms_estimado: 0.106 },
            "2032": { icms_estimado: 0.096 },
            "2033": { icms: 0, iss: 0, ibs: "Alíquota cheia", cbs: "Alíquota cheia", obs: "ICMS e ISS extintos" }
        },

        impactos_ap: [
            "Substituição do ICMS 18% pelo IBS — redistribuição de receitas",
            "POSSÍVEL PERDA de benefícios SUDAM na transição — risco significativo para AP",
            "ITCD: AP já adota progressividade — menor impacto neste tributo",
            "Redução gradual de ~10%/ano no ICMS entre 2027-2032",
            "ISS Macapá (5%) extinto gradualmente — substituído pelo IBS",
            "IPI: redução SUDAM de 35% pode ser afetada pela substituição por CBS/IS"
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    //  13. DADOS DE COBERTURA
    // ═══════════════════════════════════════════════════════════════

    cobertura: {
        versao: "3.0",
        data_atualizacao: "2026-02-10",
        localizados: [
            "ICMS — alíquota padrão 18%, diferenciadas (0% cesta básica/genéricos, 18% padrão, 25-29% supérfluos), sem FECOP",
            "ICMS — monofásico combustíveis com valores ad rem por litro detalhados",
            "ICMS — ST com MVA por categoria de produto incluindo alimentícios (Protocolo 25/23)",
            "IPVA — alíquotas por tipo (0% motos ≤170cc, 1,5% a 3,5%), desconto 20% cota única",
            "ITCD — alíquotas progressivas completas (causa mortis 2-6%, doação 2-5%) em UFM/AP",
            "ISS Macapá — alíquota padrão 5%, ISS fixo anual para autônomos (em UFM), UFM = R$ 4,7809",
            "IPTU Macapá — faixas (resid 0,5-1%, comerc 0,8-1,5%, terreno 1-2%), descontos 20%/10%",
            "ITBI Macapá — 2% (uma das mais baixas), prazo 20 dias (Decreto 175/2026)",
            "Impostos federais — IRPJ com SUDAM 75%, CSLL com SUDAM 75%, IPI redução 35%, IRPF, PIS, COFINS, IOF, IE 9%, ITR detalhado, INSS, FGTS",
            "Simples Nacional — sublimite R$ 3,6M, MEI com valores DAS, todos os 5 Anexos com 11 faixas",
            "Incentivos — SUDAM completo (requisitos, base legal), agricultura familiar, exportadores, genéricos isentos",
            "Reforma Tributária — cronograma 2026-2033, impacto SUDAM na transição"
        ],
        nao_localizados: [
            "IPVA — calendário de vencimento 2026 detalhado por placa",
            "IPTU Macapá — faixas detalhadas de valor venal para cada alíquota",
            "UFM/AP — valor atualizado para 2026 (disponível apenas 2025)",
            "Taxas estaduais e municipais — valores específicos",
            "Convênios ICMS — lista completa vigente"
        ],
        contatos_para_completar: [
            { orgao: "SEFAZ-AP", url: "https://www.sefaz.ap.gov.br/" },
            { orgao: "Prefeitura de Macapá", url: "https://macapa.ap.gov.br/" },
            { orgao: "SUDAM", url: "https://www.gov.br/sudam/" },
            { orgao: "Receita Federal", url: "https://www.gov.br/receitafederal", tel: "146" }
        ]
    },
};


// ═══════════════════════════════════════════════════════════════════════════
//  14. FUNÇÕES UTILITÁRIAS — AMAPÁ
// ═══════════════════════════════════════════════════════════════════════════

/** Retorna alíquota do ISS por tipo de serviço em Macapá */
function getISSAmapa(tipo) {
    if (!tipo) return AMAPA_TRIBUTARIO.iss.aliquota_padrao;
    const servico = AMAPA_TRIBUTARIO.iss.por_tipo_servico[tipo];
    return servico ? servico.aliquota : AMAPA_TRIBUTARIO.iss.aliquota_padrao;
}

/** Retorna alíquota do IPTU residencial (faixas) */
function getIPTUResidencialAmapa() {
    return {
        aliquota_min: AMAPA_TRIBUTARIO.iptu.residencial.aliquota_min,
        aliquota_max: AMAPA_TRIBUTARIO.iptu.residencial.aliquota_max,
        obs: AMAPA_TRIBUTARIO.iptu.residencial.obs
    };
}

/** Retorna alíquota do IPTU comercial (faixas) */
function getIPTUComercialAmapa() {
    return {
        aliquota_min: AMAPA_TRIBUTARIO.iptu.comercial.aliquota_min,
        aliquota_max: AMAPA_TRIBUTARIO.iptu.comercial.aliquota_max,
        obs: AMAPA_TRIBUTARIO.iptu.comercial.obs
    };
}

/** Retorna alíquota do IPVA por tipo de veículo */
function getIPVAAmapa(tipo) {
    if (!tipo) return null;
    const veiculo = AMAPA_TRIBUTARIO.ipva.aliquotas[tipo];
    return veiculo ? veiculo.aliquota : null;
}

/** Verifica se município está em Zona Franca */
function isZonaFrancaAmapa(municipio) {
    return false; // AP não possui Zona Franca
}

/** Verifica se município está em ALC */
function isALCAmapa(municipio) {
    return false; // AP não possui ALC
}

/** Retorna percentual de redução IRPJ pela SUDAM */
function getReducaoSUDAMAmapa() {
    return AMAPA_TRIBUTARIO.dados_gerais.sudam.ativo ? AMAPA_TRIBUTARIO.dados_gerais.sudam.reducao_irpj : 0;
}

/** Retorna ICMS efetivo (padrão + FECOP se houver) */
function getICMSEfetivoAmapa() {
    const padrao = AMAPA_TRIBUTARIO.icms.aliquota_padrao;
    const fecop = AMAPA_TRIBUTARIO.icms.fecop.ativo ? (AMAPA_TRIBUTARIO.icms.fecop.aliquota_adicional || 0) : 0;
    return {
        aliquota_padrao: padrao,
        fecop: fecop,
        total: padrao + fecop,
        total_percentual: ((padrao + fecop) * 100).toFixed(1) + "%"
    };
}

/**
 * Calcula ITCMD — nota: faixas em UFM/AP, cálculo simplificado com alíquota máxima
 * Para cálculo preciso, converter valor para UFM/AP com valor atualizado
 * @param {number} valor - Valor do bem em R$
 * @param {string} tipo - "causa_mortis" ou "doacao"
 * @returns {object} Detalhamento do cálculo (estimativa com alíquota máxima da faixa)
 */
function calcularITCMDAmapa(valor, tipo) {
    // Cálculo simplificado — faixas são em UFM/AP
    // Para cálculo preciso, necessário valor da UFM/AP atualizado
    const tabela = tipo === "doacao" ? AMAPA_TRIBUTARIO.itcmd.doacao : AMAPA_TRIBUTARIO.itcmd.causa_mortis;
    const aliquota_max = tabela.faixas[tabela.faixas.length - 1].aliquota;
    const aliquota_min = tabela.faixas[0].aliquota;

    return {
        valor_bem: valor,
        tipo: tipo || "causa_mortis",
        aliquota_min: aliquota_min,
        aliquota_max: aliquota_max,
        imposto_estimado_min: valor * aliquota_min,
        imposto_estimado_max: valor * aliquota_max,
        obs: "Faixas em UFM/AP. Para cálculo preciso, converter valor para UFM/AP (2025: R$ 4,7809). Resultado é estimativa.",
        unidade_referencia: "UFM/AP"
    };
}

/** Retorna resumo tributário para exibição rápida */
function resumoTributarioAmapa() {
    return {
        estado: AMAPA_TRIBUTARIO.dados_gerais.nome,
        sigla: AMAPA_TRIBUTARIO.dados_gerais.sigla,
        regiao: AMAPA_TRIBUTARIO.dados_gerais.regiao,
        capital: AMAPA_TRIBUTARIO.dados_gerais.capital,
        icms_padrao: AMAPA_TRIBUTARIO.icms.aliquota_padrao,
        icms_efetivo: AMAPA_TRIBUTARIO.icms.aliquota_padrao,
        fecop: AMAPA_TRIBUTARIO.icms.fecop.ativo,
        fecop_aliquota: 0,
        iss_padrao: AMAPA_TRIBUTARIO.iss.aliquota_padrao,
        iss_min: AMAPA_TRIBUTARIO.iss.aliquota_minima,
        iss_max: AMAPA_TRIBUTARIO.iss.aliquota_maxima,
        ipva_auto: AMAPA_TRIBUTARIO.ipva.aliquotas.automoveis_camionetes.aliquota,
        ipva_moto_acima_180: AMAPA_TRIBUTARIO.ipva.aliquotas.motocicletas_acima_180cc.aliquota,
        ipva_moto_ate_170: AMAPA_TRIBUTARIO.ipva.aliquotas.motocicletas_ate_170cc.aliquota,
        ipva_caminhao: AMAPA_TRIBUTARIO.ipva.aliquotas.caminhoes.aliquota,
        itcmd_tipo: "progressiva",
        itcmd_min: 0.02,
        itcmd_max: 0.06,
        itbi: AMAPA_TRIBUTARIO.itbi.aliquota_padrao,
        iptu_residencial_min: AMAPA_TRIBUTARIO.iptu.residencial.aliquota_min,
        iptu_residencial_max: AMAPA_TRIBUTARIO.iptu.residencial.aliquota_max,
        sublimite_simples: AMAPA_TRIBUTARIO.simples_nacional.sublimite_estadual,
        sudam: true,
        sudam_reducao_irpj: 0.75,
        sudene: false,
        zona_franca: false,
        destaque: AMAPA_TRIBUTARIO.dados_gerais.destaque
    };
}


// ═══════════════════════════════════════════════════════════════════════════
//  15. EXPORTAÇÃO (Padrão Grupo 2)
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        ...AMAPA_TRIBUTARIO,
        utils: {
            getISS: getISSAmapa,
            getIPTUResidencial: getIPTUResidencialAmapa,
            getIPTUComercial: getIPTUComercialAmapa,
            getIPVA: getIPVAAmapa,
            isZonaFranca: isZonaFrancaAmapa,
            isALC: isALCAmapa,
            getReducaoSUDAM: getReducaoSUDAMAmapa,
            getICMSEfetivo: getICMSEfetivoAmapa,
            calcularITCMD: calcularITCMDAmapa,
            resumoTributario: resumoTributarioAmapa,
        },
    };
}

if (typeof window !== "undefined") {
    window.AMAPA_TRIBUTARIO = AMAPA_TRIBUTARIO;
    window.AmapaTributario = {
        getISS: getISSAmapa,
        getIPTUResidencial: getIPTUResidencialAmapa,
        getIPTUComercial: getIPTUComercialAmapa,
        getIPVA: getIPVAAmapa,
        isZonaFranca: isZonaFrancaAmapa,
        isALC: isALCAmapa,
        getReducaoSUDAM: getReducaoSUDAMAmapa,
        getICMSEfetivo: getICMSEfetivoAmapa,
        calcularITCMD: calcularITCMDAmapa,
        resumoTributario: resumoTributarioAmapa,
    };
}
