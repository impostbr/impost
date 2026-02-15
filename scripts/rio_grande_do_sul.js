/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RIO_GRANDE_DO_SUL.JS — Base de Dados Tributária Completa do Estado do Rio Grande do Sul
 * ═══════════════════════════════════════════════════════════════════════════
 * Versão 3.0 — Padronizado conforme template roraima.js v3.0
 * Dados verificados via fontes oficiais (SEFAZ-RS, RFB, Planalto, Prefeitura POA)
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
 *   08. taxas               — Estaduais e municipais
 *   09. federal             — IRPJ, CSLL, PIS, COFINS, IOF, ITR, INSS, FGTS, IRPF
 *   10. simples_nacional    — Anexos, faixas, sublimite, MEI
 *   11. incentivos          — SUDAM/SUDENE, programas estaduais
 *   12. reforma_tributaria  — EC 132, LC 214, LC 224, LC 227, transição IBS/CBS
 *   13. cobertura           — Versão, itens localizados/pendentes, contatos
 *   14. funções utilitárias — Helpers de cálculo
 *   15. exportação          — module.exports + window (padrão Grupo 2)
 *
 * FONTES CONSULTADAS:
 *   • SEFAZ-RS — www.fazenda.rs.gov.br
 *   • RICMS/RS (Regulamento do ICMS do Rio Grande do Sul)
 *   • Lei Complementar nº 87/1996 (Lei Kandir — base do ICMS)
 *   • Convênio ICMS nº 199/22 (ICMS monofásico sobre combustíveis)
 *   • Legislação municipal de Porto Alegre (ISS, IPTU, ITBI)
 *   • Receita Federal — www.gov.br/receitafederal
 *
 * ATUALIZAÇÃO: 10/02/2026
 * ═══════════════════════════════════════════════════════════════════════════
 */

const RIO_GRANDE_DO_SUL_TRIBUTARIO = {

    // ═══════════════════════════════════════════════════════════════
    //  1. DADOS GERAIS
    // ═══════════════════════════════════════════════════════════════

    dados_gerais: {
        nome: "Rio Grande do Sul",
        sigla: "RS",
        regiao: "Sul",
        capital: "Porto Alegre",
        codigo_ibge: 43,
        zona_franca: {
            ativo: false,
            obs: "Não possui Zona Franca"
        },
        area_livre_comercio: {
            ativo: false,
            obs: "Não possui ALC"
        },
        sudam: {
            ativo: false,
            obs: "Rio Grande do Sul não está na área de atuação da SUDAM"
        },
        sudene: {
            ativo: false,
            obs: "Rio Grande do Sul não está na área de atuação da SUDENE"
        },
        sefaz: {
            site: "https://www.fazenda.rs.gov.br/",
            nome: "SEFAZ-RS - Secretaria da Fazenda do Estado do Rio Grande do Sul"
        },
        prefeitura_capital: {
            site: "https://prefeitura.poa.br/",
            nome: "Prefeitura Municipal de Porto Alegre"
        },
        legislacao_base: [
            { norma: "Regulamento do ICMS (RICMS/RS)", assunto: "Base do ICMS no Rio Grande do Sul" },
            { norma: "Lei Estadual de IPVA", assunto: "Base do IPVA no Rio Grande do Sul" },
            { norma: "Lei Estadual de ITCD", assunto: "Base do ITCD no Rio Grande do Sul" },
            { norma: "Lei Complementar nº 87/1996", assunto: "Lei Kandir — base do ICMS" }
        ],
        destaque: "RS possui ICMS padrão de 17% (abaixo da média nacional). FECOP de 2% adicional em produtos selecionados. IPVA de 3% para automóveis (entre as mais altas do Brasil). ITCD fixo em 4%."
    },

    // ═══════════════════════════════════════════════════════════════
    //  2. ICMS — IMPOSTO SOBRE CIRCULAÇÃO DE MERCADORIAS E SERVIÇOS
    // ═══════════════════════════════════════════════════════════════

    icms: {
        aliquota_padrao: 0.17,
        aliquota_padrao_percentual: "17%",
        aliquota_anterior: 0.17,
        data_aumento: null,
        obs_aliquota: "Alíquota interna padrão de 17% (RICMS/RS, Art. 27, inciso X). Abaixo da média nacional de 18-19%.",
        base_legal: "RICMS/RS, Art. 27",

        aliquotas_diferenciadas: {
            combustiveis:            { aliquota: 0.25, obs: "Gasolina, diesel, etanol, GNV, GLP — Convênio ICMS 199/22 (monofásico)", base_legal: "Convênio ICMS nº 199/22" },
            bebidas_alcoolicas:      { aliquota: 0.25, obs: "Cervejas, vinhos — 25% + FECOP 2% = 27% efetivo", base_legal: "RICMS/RS" },
            cigarros_fumo:           { aliquota: 0.25, obs: "25% + FECOP 2% = 27% efetivo", base_legal: "RICMS/RS" },
            armas_municoes:          { aliquota: 0.25, base_legal: "RICMS/RS" },
            embarcacoes_esporte:     { aliquota: 0.25, obs: "Embarcações de esporte e lazer", base_legal: "RICMS/RS" },
            produtos_superfluos:     { aliquota: 0.25, obs: "Conforme classificação RICMS/RS", base_legal: "RICMS/RS" },
            telecomunicacoes:        { aliquota_min: 0.17, aliquota_max: 0.25, obs: "17% a 25% conforme tipo de serviço", base_legal: "RICMS/RS" },
            energia_eletrica:        { aliquota: 0.17, obs: "Todas as faixas — STF decisão 2021 reduziu para alíquota padrão", base_legal: "STF — Decisão 2021" },
            cesta_basica:            { aliquota: 0.00, obs: "ISENTOS — produtos da cesta básica", base_legal: "RICMS/RS" },
            produtos_primarios_agropecuarios: { aliquota: 0.12, obs: "Redução para agricultura — operações internas", base_legal: "RICMS/RS" },
            insumos_agropecuarios:   { aliquota: 0.12, obs: "Redução para agricultura", base_legal: "RICMS/RS" },
            veiculos_automotores:    { aliquota: 0.17, obs: "Veículos novos — alíquota padrão", base_legal: "RICMS/RS" },
            medicamentos:            { aliquota: 0.17, obs: "Genéricos e de marca — alíquota padrão", base_legal: "RICMS/RS" },
            perfumaria_cosmeticos:   { aliquota: 0.17, obs: "Alíquota padrão", base_legal: "RICMS/RS" },
            informatica:             { aliquota: 0.17, obs: "Produtos de informática — alíquota padrão", base_legal: "RICMS/RS" },
            maquinas_equipamentos:   { aliquota: 0.17, obs: "Máquinas e equipamentos industriais — alíquota padrão", base_legal: "RICMS/RS" }
        },

        aliquotas_interestaduais: {
            norte_nordeste_co_es: 0.12,
            sul_sudeste_exceto_es: 0.07,
            nao_contribuinte: 0.17,
            obs: "Conforme EC 87/2015. RS está na região Sul — remetente aplica 12% p/ N/NE/CO/ES e 7% p/ S/SE."
        },

        difal: {
            formula: "DIFAL = (Alíquota Interna Destino - Alíquota Interestadual) × Base de Cálculo",
            partilha_destino: 1.00,
            partilha_origem: 0.00,
            obs: "100% para estado de destino (EC 87/2015 — transição concluída).",
            exemplo: {
                cenario: "Remessa de SP para RS (não-contribuinte)",
                aliquota_interestadual_sp: 0.07,
                aliquota_interna_rs: 0.17,
                difal: 0.10,
                valor_exemplo: 1000,
                difal_valor: 100
            }
        },

        importacao: {
            aliquota: 0.17,
            obs: "Alíquota padrão aplicada em operações de importação"
        },

        fecop: {
            ativo: true,
            aliquota_adicional: 0.02,
            aliquota_adicional_percentual: "2%",
            obs: "Adicional de 2% sobre o ICMS em produtos selecionados",
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
                combustiveis:         { min: 0.08, max: 0.12, obs: "MVA 8% a 12%" },
                energia_eletrica:     { min: 0.05, max: 0.08, obs: "MVA 5% a 8%" },
                bebidas_alcoolicas:   { min: 0.15, max: 0.25, obs: "MVA 15% a 25%" },
                cigarros:             { min: 0.20, max: 0.30, obs: "MVA 20% a 30%" },
                medicamentos:         { min: 0.25, max: 0.35, obs: "MVA 25% a 35%" },
                veiculos_automotores: { min: 0.15, max: 0.25, obs: "MVA 15% a 25%" }
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
            obs: "RS possui diversos convênios ICMS vigentes — consultar SEFAZ-RS",
            base_legal: "Convênios ICMS diversos"
        },

        legislacao: [
            { norma: "RICMS/RS", assunto: "Regulamento do ICMS do Rio Grande do Sul" },
            { norma: "Lei Complementar nº 87/1996", assunto: "Lei Kandir — base do ICMS" },
            { norma: "Convênio ICMS nº 199/22", assunto: "ICMS monofásico sobre combustíveis" }
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    //  3. IPVA — IMPOSTO SOBRE PROPRIEDADE DE VEÍCULOS AUTOMOTORES
    // ═══════════════════════════════════════════════════════════════

    ipva: {
        destaque: "RS possui alíquota de IPVA de 3% para automóveis — ENTRE AS MAIS ALTAS DO BRASIL. Veículos elétricos/híbridos pagam 2%.",

        aliquotas: {
            automoveis_utilitarios:   { aliquota: 0.03, obs: "Automóveis e utilitários — 3%" },
            motocicletas:             { aliquota: 0.02, obs: "Motocicletas e similares" },
            caminhoes:                { aliquota: 0.02, obs: "Caminhões" },
            onibus_micro:             { aliquota: 0.02, obs: "Ônibus e micro-ônibus" },
            veiculos_locadoras:       { aliquota: 0.03, obs: "Locadoras — mesma alíquota de automóveis" },
            veiculos_eletricos_hibridos: { aliquota: 0.02, obs: "Elétricos e híbridos — alíquota reduzida" },
            embarcacoes:              { aliquota: 0.03, obs: "Embarcações" },
            aeronaves:                { aliquota: 0.03, obs: "Aeronaves" }
        },

        isencoes: [
            "Veículos com mais de 20 anos de fabricação",
            "Pessoa com deficiência (PCD) — com comprovação",
            "Táxis",
            "Veículos oficiais (administração pública)",
            "Ônibus de transporte coletivo"
        ],

        descontos_antecipacao: {
            pagamento_vista: {
                desconto: 0.03,
                desconto_percentual: "3%",
                obs: "Desconto de 3% no pagamento em cota única antecipada"
            },
            parcelamento: {
                parcelas: 3,
                obs: "Até 3 parcelas sem desconto"
            }
        },

        base_calculo: "Tabela FIPE — valor venal do veículo",

        calendario_vencimento: {
            obs: "Divulgado anualmente pela SEFAZ-RS. Escalonado conforme final da placa.",
            dados_disponiveis: false
        },

        legislacao: [
            { norma: "Lei Estadual de IPVA", assunto: "Lei base do IPVA no Rio Grande do Sul" }
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    //  4. ITCMD — IMPOSTO TRANSMISSÃO CAUSA MORTIS E DOAÇÃO
    //     (denominado ITCD na legislação do RS)
    // ═══════════════════════════════════════════════════════════════

    itcmd: {
        tipo: "fixa",
        denominacao_local: "ITCD — Imposto sobre Transmissão Causa Mortis e Doação",
        obs: "ALÍQUOTA FIXA DE 4% — tanto para causa mortis quanto para doação. RS NÃO adota progressividade (EC 132/2023 exigirá progressividade a partir de 2026).",

        aliquota_atual: {
            tipo: "fixa",
            aliquota: 0.04,
            aliquota_percentual: "4%",
            base_legal: "Lei Estadual de ITCD",
            vigencia: "Até regulamentação da progressividade obrigatória"
        },

        causa_mortis: {
            tipo: "fixa",
            aliquota: 0.04,
            aliquota_percentual: "4%"
        },

        doacao: {
            tipo: "fixa",
            aliquota: 0.04,
            aliquota_percentual: "4%"
        },

        base_calculo: "Valor venal do bem (valor de mercado) ou valor declarado — o que for maior",

        isencoes: [
            "Transmissão de imóvel rural até 25 hectares para herdeiro",
            "Imóvel destinado à morada do cônjuge supérstite (causa mortis)",
            "Pequena propriedade familiar (até 25 hectares)",
            "Doações para instituições de caridade e educação",
            "Doações para entidades de utilidade pública"
        ],

        prazo_pagamento: "30 dias a partir da data do óbito ou da doação",

        legislacao: [
            { norma: "Lei Estadual de ITCD", assunto: "Lei base do ITCD no Rio Grande do Sul" },
            { norma: "EC nº 132/2023", assunto: "Reforma Tributária — progressividade obrigatória futura" }
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    //  5. ISS — IMPOSTO SOBRE SERVIÇOS (Porto Alegre — referência)
    // ═══════════════════════════════════════════════════════════════

    iss: {
        municipio_referencia: "Porto Alegre",
        aliquota_padrao: 0.05,
        aliquota_minima: 0.02,
        aliquota_maxima: 0.05,
        obs: "Porto Alegre adota alíquota padrão de 5% com reduções para setores específicos. ISS de serviços financeiros em redução progressiva (3% → 2,5% → 2%).",

        por_tipo_servico: {
            construcao_civil:     { aliquota: 0.025, descricao: "Construção civil — reduzida a partir de 2024 (era 4%)" },
            servicos_financeiros: { aliquota: 0.03, descricao: "Serviços financeiros — 3% em 2024, 2,5% em 2025, 2% a partir de 2026" },
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
            geral:                { aliquota: 0.05, descricao: "Demais serviços não especificados" }
        },

        reducao_progressiva_financeiros: {
            "2024": 0.03,
            "2025": 0.025,
            "2026": 0.02,
            obs: "ISS de serviços financeiros em redução gradual até 2% em 2026"
        },

        legislacao: [
            { norma: "Legislação municipal de Porto Alegre", assunto: "Regulamentação ISS em Porto Alegre" },
            { norma: "Lei Complementar nº 116/2003", assunto: "Lista de serviços (federal)" }
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    //  6. IPTU — IMPOSTO PREDIAL E TERRITORIAL URBANO (Porto Alegre)
    // ═══════════════════════════════════════════════════════════════

    iptu: {
        municipio_referencia: "Porto Alegre",

        residencial: {
            aliquota_min: 0.00,
            aliquota_max: 0.0085,
            obs: "0% a 0,85% — progressivo por faixa de valor venal"
        },

        comercial: {
            aliquota_min: 0.00,
            aliquota_max: 0.008,
            obs: "0% a 0,80% — progressivo por faixa de valor venal"
        },

        terreno_nao_edificado: {
            aliquota_min: 0.00,
            aliquota_max: 0.03,
            obs: "0% a 3,00% — progressivo por faixa de valor venal"
        },

        progressividade: {
            ativo: true,
            tipo: "faixas_de_valor_venal",
            obs: "Progressivo conforme valor venal do imóvel — alíquotas crescentes por faixa"
        },

        isencoes: [
            "Imóveis de instituições de caridade",
            "Imóveis de entidades de utilidade pública",
            "Imóveis da União, Estados e Municípios",
            "Templos religiosos",
            "Imóveis com valor venal até R$ 86.253,37 (14.946 UFM) — isentos"
        ],

        pagamento: {
            cota_unica: { desconto: 0.03, desconto_percentual: "3%", obs: "Desconto de 3% para pagamento em cota única" },
            parcelamento: { parcelas: null, obs: "Conforme calendário municipal" }
        },

        legislacao: [
            { norma: "Legislação municipal de Porto Alegre", assunto: "IPTU progressivo" }
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    //  7. ITBI — IMPOSTO TRANSMISSÃO DE BENS IMÓVEIS (Porto Alegre)
    // ═══════════════════════════════════════════════════════════════

    itbi: {
        municipio_referencia: "Porto Alegre",
        aliquota_padrao: 0.03,
        aliquota_padrao_percentual: "3%",
        aliquota_regularizacao: 0.015,
        aliquota_regularizacao_percentual: "1,5%",
        base_calculo: "Valor do bem ou direito transmitido",
        obs: "Alíquota padrão de 3% — uma das mais altas do Brasil. Alíquota reduzida de 1,5% para regularização imobiliária.",

        isencoes: [
            "Transmissões para entidades de caridade",
            "Transmissões para órgãos públicos",
            "Transmissões para fins de reforma urbana",
            "Doações para cônjuge/descendentes (em alguns casos)"
        ],

        legislacao: [
            { norma: "Legislação municipal de Porto Alegre", assunto: "ITBI" }
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    //  8. TAXAS ESTADUAIS E MUNICIPAIS
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
                obs: "Conforme tabela de cartórios do RS"
            },
            obs_geral: "Valores das taxas estaduais são variáveis e atualizados anualmente. Consultar SEFAZ-RS."
        },

        // ── Taxas Municipais Porto Alegre ──
        municipais_porto_alegre: {
            municipio_referencia: "Porto Alegre",
            tcl:                { valor: null, obs: "Taxa de Coleta de Lixo (TCL) — variável conforme imóvel, cobrada junto com IPTU" },
            alvara:             { valor_min: 50, valor_max: 500, obs: "Taxa de Alvará/Funcionamento — R$ 50 a R$ 500 conforme atividade" },
            publicidade:        { valor: null, obs: "Taxa de Publicidade — variável conforme tipo" },
            cosip:              { valor: null, obs: "COSIP (Contribuição de Iluminação Pública) — incluída no IPTU" },
            obs_geral: "Valores variáveis conforme tabelas municipais de Porto Alegre. Consultar Prefeitura."
        },

        legislacao: [
            { norma: "Legislação estadual RS", assunto: "Taxas estaduais diversas" },
            { norma: "Legislação municipal de Porto Alegre", assunto: "Taxas municipais" }
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    //  9. IMPOSTOS FEDERAIS (aplicáveis no estado)
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
                sudam: { ativo: false },
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
                sudam: { ativo: false },
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
            aliquota_min: 0,
            aliquota_max: 0.35,
            obs: "Alíquotas de 0% a 35% conforme produto"
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
    //  10. SIMPLES NACIONAL
    // ═══════════════════════════════════════════════════════════════

    simples_nacional: {
        sublimite_estadual: 3600000,
        sublimite_obs: "R$ 3.600.000,00 — RS adota sublimite federal. Empresas que ultrapassam devem recolher ICMS e ISS fora do Simples.",

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
            ativo: false,
            obs: "Não aplicável ao Rio Grande do Sul"
        },

        sudene: {
            ativo: false,
            obs: "Não aplicável ao Rio Grande do Sul"
        },

        zona_franca: {
            ativo: false
        },

        programa_desenvolvimento_regional: {
            ativo: true,
            descricao: "Programa de Desenvolvimento Regional — redução de ICMS, isenção de taxas estaduais",
            setores: ["Indústria", "Agronegócio", "Turismo"],
            obs: "Vigência contínua com renovação anual — consultar SEFAZ-RS"
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

        convenios_icms: {
            ativo: true,
            descricao: "Diversos convênios ICMS vigentes",
            obs: "Consultar SEFAZ-RS para lista atualizada"
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

        cronograma_detalhado_rs: {
            "2026": { icms: 0.17, iss_poa: 0.05, ibs_teste: 0.009, cbs_teste: 0.009, obs: "Fase de testes — IBS 0,9% + CBS 0,9%" },
            "2027": { icms_estimado: 0.153, obs: "ICMS reduz ~10%" },
            "2028": { icms_estimado: 0.138 },
            "2029": { icms_estimado: 0.124 },
            "2030": { icms_estimado: 0.112 },
            "2031": { icms_estimado: 0.101 },
            "2032": { icms_estimado: 0.091 },
            "2033": { icms: 0, iss: 0, ibs: "Alíquota cheia", cbs: "Alíquota cheia", obs: "ICMS e ISS extintos" }
        },

        impactos_rs: [
            "Substituição do ICMS 17% pelo IBS — possível redistribuição de receitas",
            "FECOP 2% adicional — possível incorporação ao IBS ou extinção",
            "ITCD: progressividade obrigatória — RS ainda com alíquota fixa 4%",
            "Redução gradual de ~10%/ano no ICMS entre 2027-2032",
            "ISS Porto Alegre (2-5%) extinto gradualmente — substituído pelo IBS",
            "Possível perda de benefícios fiscais regionais na transição"
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    //  13. DADOS DE COBERTURA
    // ═══════════════════════════════════════════════════════════════

    cobertura: {
        versao: "3.0",
        data_atualizacao: "2026-02-10",
        localizados: [
            "ICMS — alíquota padrão 17%, diferenciadas (0% cesta básica, 12% agro, 17% padrão, 25% supérfluos), FECOP 2%",
            "ICMS — monofásico combustíveis com valores ad rem por litro detalhados",
            "ICMS — ST com MVA por categoria de produto",
            "IPVA — alíquotas por tipo (2% a 3%), isenções, desconto 3% cota única",
            "ITCD — alíquota fixa 4% (causa mortis e doação), isenções detalhadas",
            "ISS Porto Alegre — alíquotas por tipo de serviço (2,5% a 5%), redução progressiva financeiros",
            "IPTU Porto Alegre — faixas progressivas (resid 0-0,85%, comerc 0-0,80%, terreno 0-3%)",
            "ITBI Porto Alegre — 3% padrão, 1,5% regularização imobiliária",
            "Impostos federais — IRPJ (com LC 224/2025), IRPF, CSLL, PIS, COFINS, IPI, IOF, IE, ITR detalhado, INSS, FGTS",
            "Simples Nacional — sublimite R$ 3,6M, MEI com valores DAS, todos os 5 Anexos com faixas detalhadas",
            "Incentivos — desenvolvimento regional, agricultura familiar, exportadores",
            "Reforma Tributária — cronograma 2026-2033, IS com produtos afetados"
        ],
        nao_localizados: [
            "IPVA — calendário de vencimento 2026 por placa",
            "IPTU Porto Alegre — faixas detalhadas de valor venal para cada alíquota",
            "Taxas estaduais e municipais — valores específicos",
            "Convênios ICMS — lista completa vigente"
        ],
        contatos_para_completar: [
            { orgao: "SEFAZ-RS", url: "https://www.fazenda.rs.gov.br/" },
            { orgao: "Prefeitura de Porto Alegre", url: "https://prefeitura.poa.br/" },
            { orgao: "DETRAN-RS", url: "https://www.detran.rs.gov.br/" },
            { orgao: "Receita Federal", url: "https://www.gov.br/receitafederal/" }
        ]
    },
};


// ═══════════════════════════════════════════════════════════════════════════
//  14. FUNÇÕES UTILITÁRIAS — RIO GRANDE DO SUL
// ═══════════════════════════════════════════════════════════════════════════

/** Retorna alíquota do ISS por tipo de serviço */
function getISSRioGrandeDoSul(tipo) {
    if (!tipo) return RIO_GRANDE_DO_SUL_TRIBUTARIO.iss.aliquota_padrao;
    const servico = RIO_GRANDE_DO_SUL_TRIBUTARIO.iss.por_tipo_servico[tipo];
    return servico ? servico.aliquota : RIO_GRANDE_DO_SUL_TRIBUTARIO.iss.aliquota_padrao;
}

/** Retorna alíquota do IPTU residencial (faixas) */
function getIPTUResidencialRioGrandeDoSul() {
    return {
        aliquota_min: RIO_GRANDE_DO_SUL_TRIBUTARIO.iptu.residencial.aliquota_min,
        aliquota_max: RIO_GRANDE_DO_SUL_TRIBUTARIO.iptu.residencial.aliquota_max,
        obs: RIO_GRANDE_DO_SUL_TRIBUTARIO.iptu.residencial.obs
    };
}

/** Retorna alíquota do IPTU comercial (faixas) */
function getIPTUComercialRioGrandeDoSul() {
    return {
        aliquota_min: RIO_GRANDE_DO_SUL_TRIBUTARIO.iptu.comercial.aliquota_min,
        aliquota_max: RIO_GRANDE_DO_SUL_TRIBUTARIO.iptu.comercial.aliquota_max,
        obs: RIO_GRANDE_DO_SUL_TRIBUTARIO.iptu.comercial.obs
    };
}

/** Retorna alíquota do IPVA por tipo de veículo */
function getIPVARioGrandeDoSul(tipo) {
    if (!tipo) return null;
    const veiculo = RIO_GRANDE_DO_SUL_TRIBUTARIO.ipva.aliquotas[tipo];
    return veiculo ? veiculo.aliquota : null;
}

/** Verifica se município está em Zona Franca */
function isZonaFrancaRioGrandeDoSul(municipio) {
    return false; // RS não possui Zona Franca
}

/** Verifica se município está em ALC */
function isALCRioGrandeDoSul(municipio) {
    return false; // RS não possui ALC
}

/** Retorna percentual de redução IRPJ pela SUDAM */
function getReducaoSUDAMRioGrandeDoSul() {
    return 0; // Não aplicável ao RS
}

/** Retorna ICMS efetivo (padrão + FECOP se houver) */
function getICMSEfetivoRioGrandeDoSul() {
    const padrao = RIO_GRANDE_DO_SUL_TRIBUTARIO.icms.aliquota_padrao;
    const fecop = RIO_GRANDE_DO_SUL_TRIBUTARIO.icms.fecop.ativo ? (RIO_GRANDE_DO_SUL_TRIBUTARIO.icms.fecop.aliquota_adicional || 0) : 0;
    return {
        aliquota_padrao: padrao,
        fecop: fecop,
        total: padrao + fecop,
        total_percentual: ((padrao + fecop) * 100).toFixed(1) + "%"
    };
}

/**
 * Calcula ITCMD (alíquota fixa 4%)
 * @param {number} valor - Valor do bem em R$
 * @param {string} tipo - "causa_mortis" ou "doacao"
 * @returns {object} Detalhamento do cálculo
 */
function calcularITCMDRioGrandeDoSul(valor, tipo) {
    const aliquota = RIO_GRANDE_DO_SUL_TRIBUTARIO.itcmd.aliquota_atual.aliquota;
    const imposto = valor * aliquota;

    return {
        valor_bem: valor,
        tipo: tipo || "causa_mortis",
        aliquota: aliquota,
        imposto_total: imposto,
        aliquota_efetiva: aliquota,
        obs: "Alíquota fixa de 4% vigente. Progressividade obrigatória futura (EC 132/2023).",
        detalhamento: [{
            faixa: "Valor total",
            base: valor,
            aliquota: aliquota,
            imposto: imposto
        }]
    };
}

/** Retorna resumo tributário para exibição rápida */
function resumoTributarioRioGrandeDoSul() {
    return {
        estado: RIO_GRANDE_DO_SUL_TRIBUTARIO.dados_gerais.nome,
        sigla: RIO_GRANDE_DO_SUL_TRIBUTARIO.dados_gerais.sigla,
        regiao: RIO_GRANDE_DO_SUL_TRIBUTARIO.dados_gerais.regiao,
        capital: RIO_GRANDE_DO_SUL_TRIBUTARIO.dados_gerais.capital,
        icms_padrao: RIO_GRANDE_DO_SUL_TRIBUTARIO.icms.aliquota_padrao,
        icms_efetivo: RIO_GRANDE_DO_SUL_TRIBUTARIO.icms.aliquota_padrao + (RIO_GRANDE_DO_SUL_TRIBUTARIO.icms.fecop.ativo ? RIO_GRANDE_DO_SUL_TRIBUTARIO.icms.fecop.aliquota_adicional : 0),
        fecop: RIO_GRANDE_DO_SUL_TRIBUTARIO.icms.fecop.ativo,
        fecop_aliquota: RIO_GRANDE_DO_SUL_TRIBUTARIO.icms.fecop.aliquota_adicional,
        iss_padrao: RIO_GRANDE_DO_SUL_TRIBUTARIO.iss.aliquota_padrao,
        iss_min: RIO_GRANDE_DO_SUL_TRIBUTARIO.iss.aliquota_minima,
        iss_max: RIO_GRANDE_DO_SUL_TRIBUTARIO.iss.aliquota_maxima,
        ipva_auto: RIO_GRANDE_DO_SUL_TRIBUTARIO.ipva.aliquotas.automoveis_utilitarios.aliquota,
        ipva_moto: RIO_GRANDE_DO_SUL_TRIBUTARIO.ipva.aliquotas.motocicletas.aliquota,
        ipva_caminhao: RIO_GRANDE_DO_SUL_TRIBUTARIO.ipva.aliquotas.caminhoes.aliquota,
        ipva_eletrico: RIO_GRANDE_DO_SUL_TRIBUTARIO.ipva.aliquotas.veiculos_eletricos_hibridos.aliquota,
        itcmd_tipo: "fixa",
        itcmd_aliquota: 0.04,
        itbi: RIO_GRANDE_DO_SUL_TRIBUTARIO.itbi.aliquota_padrao,
        iptu_residencial_max: RIO_GRANDE_DO_SUL_TRIBUTARIO.iptu.residencial.aliquota_max,
        iptu_comercial_max: RIO_GRANDE_DO_SUL_TRIBUTARIO.iptu.comercial.aliquota_max,
        sublimite_simples: RIO_GRANDE_DO_SUL_TRIBUTARIO.simples_nacional.sublimite_estadual,
        sudam: false,
        sudene: false,
        zona_franca: false,
        destaque: RIO_GRANDE_DO_SUL_TRIBUTARIO.dados_gerais.destaque
    };
}


// ═══════════════════════════════════════════════════════════════════════════
//  15. EXPORTAÇÃO (Padrão Grupo 2)
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        ...RIO_GRANDE_DO_SUL_TRIBUTARIO,
        utils: {
            getISS: getISSRioGrandeDoSul,
            getIPTUResidencial: getIPTUResidencialRioGrandeDoSul,
            getIPTUComercial: getIPTUComercialRioGrandeDoSul,
            getIPVA: getIPVARioGrandeDoSul,
            isZonaFranca: isZonaFrancaRioGrandeDoSul,
            isALC: isALCRioGrandeDoSul,
            getReducaoSUDAM: getReducaoSUDAMRioGrandeDoSul,
            getICMSEfetivo: getICMSEfetivoRioGrandeDoSul,
            calcularITCMD: calcularITCMDRioGrandeDoSul,
            resumoTributario: resumoTributarioRioGrandeDoSul,
        },
    };
}

if (typeof window !== "undefined") {
    window.RIO_GRANDE_DO_SUL_TRIBUTARIO = RIO_GRANDE_DO_SUL_TRIBUTARIO;
    window.RioGrandeDoSulTributario = {
        getISS: getISSRioGrandeDoSul,
        getIPTUResidencial: getIPTUResidencialRioGrandeDoSul,
        getIPTUComercial: getIPTUComercialRioGrandeDoSul,
        getIPVA: getIPVARioGrandeDoSul,
        isZonaFranca: isZonaFrancaRioGrandeDoSul,
        isALC: isALCRioGrandeDoSul,
        getReducaoSUDAM: getReducaoSUDAMRioGrandeDoSul,
        getICMSEfetivo: getICMSEfetivoRioGrandeDoSul,
        calcularITCMD: calcularITCMDRioGrandeDoSul,
        resumo: resumoTributarioRioGrandeDoSul,
    };
}
