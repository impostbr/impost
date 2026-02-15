/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PARANA.JS — Base de Dados Tributária Completa do Estado do Paraná
 * ═══════════════════════════════════════════════════════════════════════════
 * Versão 3.0 — Padronizado conforme modelo roraima.js v3.0
 * Dados verificados via fontes oficiais (SEFA-PR, RFB, Planalto, DETRAN-PR)
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
 *   11. incentivos          — SUDAM/SUDENE, ALC/ZFM, programas estaduais
 *   12. reforma_tributaria  — EC 132, LC 214, LC 227, transição IBS/CBS
 *   13. cobertura           — Versão, itens localizados/pendentes, contatos
 *   14. funções utilitárias — Helpers de cálculo
 *   15. exportação          — module.exports + window (padrão Grupo 2)
 *
 * FONTES CONSULTADAS:
 *   • SEFA-PR — www.fazenda.pr.gov.br
 *   • Lei nº 21.850/2023 (Alterações ICMS e IPVA — nova alíquota padrão 19,5%)
 *   • Lei nº 11.580/1996 (ICMS — Lei Orgânica do ICMS no Paraná)
 *   • Lei nº 1.427/1989 (ITCMD)
 *   • Lei Complementar nº 40/2001 (Código Tributário Municipal de Curitiba)
 *   • Resolução SEFA nº 982/2023 (MVAs para Substituição Tributária)
 *   • Lei Complementar nº 116/2003 (ISS — Lei Nacional do ISS)
 *   • Lei Complementar nº 227/2026 (ITCMD progressivo — aplicação futura)
 *   • Receita Federal — www.gov.br/receitafederal
 *   • Prefeitura de Curitiba — www.curitiba.pr.gov.br
 *   • DETRAN-PR — www.detran.pr.gov.br
 *   • Governo do Paraná (AEN)
 *
 * ATUALIZAÇÃO: 10/02/2026
 * ═══════════════════════════════════════════════════════════════════════════
 */

const PARANA_TRIBUTARIO = {

    // ═══════════════════════════════════════════════════════════════
    //  1. DADOS GERAIS
    // ═══════════════════════════════════════════════════════════════

    dados_gerais: {
        estado: "Paraná",
        sigla: "PR",
        regiao: "Sul",
        capital: "Curitiba",
        codigo_ibge: "41",
        codigo_ibge_capital: "4106902",
        populacao_estimada: 11800000,
        pib_ranking: 4,
        zona_franca: false,
        alc: false,
        alc_nome: null,
        alc_municipios: [],
        abrangencia_sudam: false,
        abrangencia_sudene: false,
        abrangencia_suframa: false,
        site_sefaz: "https://www.fazenda.pr.gov.br",
        site_detran: "https://www.detran.pr.gov.br",
        site_prefeitura_capital: "https://www.curitiba.pr.gov.br",
        legislacao_base: {
            codigo_tributario_estadual: "Lei nº 11.580/1996 (ICMS — Lei Orgânica)",
            codigo_tributario_municipal: "Lei Complementar nº 40/2001 (Curitiba)",
            ricms: "RICMS/PR — Regulamento do ICMS do Paraná",
        },
        legislacao_referencia: [
            { norma: "Lei nº 21.850/2023", assunto: "Alterações ICMS e IPVA — nova alíquota padrão 19,5%", url: "https://www.fazenda.pr.gov.br" },
            { norma: "Lei nº 11.580/1996", assunto: "ICMS — Lei Orgânica do ICMS no Paraná" },
            { norma: "Lei nº 1.427/1989", assunto: "ITCMD — Imposto sobre Transmissão Causa Mortis e Doação" },
            { norma: "Lei Complementar nº 40/2001", assunto: "Código Tributário Municipal de Curitiba" },
            { norma: "Lei nº 691/1984", assunto: "Código Tributário Municipal de Curitiba (IPTU/ITBI)" },
            { norma: "Resolução SEFA nº 982/2023", assunto: "MVAs para Substituição Tributária" },
            { norma: "Lei Complementar nº 116/2003", assunto: "ISS — Lei Nacional do ISS" },
            { norma: "Lei Complementar nº 227/2026", assunto: "ITCMD progressivo — aplicação futura" },
        ],
        particularidades: {
            menor_ipva_brasil: true,
            ipva_aliquota: 0.019,
            reducao_ipva_percentual: 45.7,
            maior_quantidade_produtos_isentos_cesta_basica: true,
            produtos_isentos_cesta_basica: 21,
            total_produtos_cesta_basica: 32,
            percentual_isencao_cesta: 65.6,
            unico_estado_erva_mate_isenta: true,
            aliquota_efetiva_simples_icms: 0.0239,
            isencao_icms_simples_ate_360k: true,
            frota_tributavel: 4100000,
            descricao: "Paraná possui a MENOR alíquota de IPVA do Brasil (1,9%) e a MAIOR quantidade de produtos isentos de ICMS na cesta básica (21 de 32 produtos). Único estado que isenta erva-mate.",
        },
    },


    // ═══════════════════════════════════════════════════════════════
    //  2. ICMS — IMPOSTO SOBRE CIRCULAÇÃO DE MERCADORIAS E SERVIÇOS
    // ═══════════════════════════════════════════════════════════════

    icms: {
        nome_completo: "Imposto sobre Circulação de Mercadorias e Serviços",
        explicacao: "Principal imposto estadual. Incide sobre circulação de mercadorias, prestação de serviços de transporte interestadual/intermunicipal e de comunicação. É não cumulativo. No PR a alíquota padrão é 19,5% desde 18/03/2024 (anteriormente 19%). Destaque: maior número de produtos da cesta básica isentos do Brasil.",
        base_legal: "Lei nº 11.580/1996, alterada pela Lei nº 21.850/2023",
        url_lei: "https://www.fazenda.pr.gov.br",
        fato_gerador: "Circulação de mercadorias, prestação de serviços de transporte interestadual e intermunicipal, e serviços de comunicação",
        base_calculo: "Valor da operação, incluindo frete, seguro, juros e demais despesas cobradas do adquirente (ICMS 'por dentro')",
        aliquota_padrao: 0.195,
        aliquota_padrao_percentual: "19,5%",
        aliquota_padrao_descricao: "Alíquota padrão para operações internas (Lei nº 21.850/2023, vigente desde 18/03/2024)",
        aliquota_anterior: 0.19,
        vigencia_inicio: "2024-03-18",
        dados_disponiveis: true,

        historico_aliquota: [
            { periodo: "Até 17/03/2024", aliquota: 0.19 },
            { periodo: "A partir de 18/03/2024", aliquota: 0.195 },
        ],

        aliquotas_diferenciadas: {
            // ── CESTA BÁSICA — 21 de 32 produtos ISENTOS (maior do Brasil)
            cesta_basica_isenta: {
                aliquota: 0.00,
                descricao: "Produtos essenciais — ISENÇÃO TOTAL (maior do Brasil: 21 de 32)",
                produtos: [
                    "Arroz",
                    "Feijão",
                    "Leite pasteurizado e UHT",
                    "Pão francês",
                    "Farinha de trigo",
                    "Farinha de mandioca",
                    "Ovos",
                    "Café",
                    "Carne bovina (in natura)",
                    "Carne suína (in natura)",
                    "Carne de frango (in natura)",
                    "Peixe (in natura)",
                    "Frutas",
                    "Verduras e legumes",
                    "Manteiga",
                    "Margarina",
                    "Erva-mate (único estado do Brasil)",
                    "Açúcar",
                    "Sal",
                    "Óleo de soja",
                    "Macarrão",
                ],
                base_legal: "Lei nº 21.850/2023 — Levantamento ABRAS",
                fonte: "Associação Brasileira de Supermercados (ABRAS) / Governo PR",
            },
            cesta_basica_reduzida: {
                aliquota: 0.07,
                descricao: "Outros produtos da cesta básica — alíquota reduzida",
                produtos: [
                    "Demais produtos da cesta básica conforme Convênios ICMS",
                ],
                base_legal: "Convênios ICMS / RICMS-PR",
            },

            // ── PRODUTOS COM ALÍQUOTA PADRÃO (19,5%)
            energia_eletrica: {
                aliquota: 0.195,
                descricao: "Energia elétrica (residencial e industrial)",
                base_legal: "Lei nº 21.850/2023",
            },
            telecomunicacoes: {
                aliquota: 0.195,
                descricao: "Serviços de telecomunicações",
                base_legal: "Lei nº 21.850/2023",
            },
            bebidas_alcoolicas: {
                aliquota: 0.195,
                descricao: "Bebidas alcoólicas",
                base_legal: "Lei nº 21.850/2023",
            },
            cigarros_fumo: {
                aliquota: 0.195,
                descricao: "Cigarros e fumo",
                base_legal: "Lei nº 21.850/2023",
            },
            armas_municoes: {
                aliquota: 0.195,
                descricao: "Armas e munições",
                base_legal: "Lei nº 21.850/2023",
            },
            embarcacoes_esporte: {
                aliquota: 0.195,
                descricao: "Embarcações de esporte e lazer",
                base_legal: "Lei nº 21.850/2023",
            },
            perfumaria_cosmeticos: {
                aliquota: 0.195,
                descricao: "Perfumaria e cosméticos",
                base_legal: "Lei nº 21.850/2023",
            },
            veiculos_novos: {
                aliquota: 0.195,
                descricao: "Veículos automotores novos",
                base_legal: "Lei nº 21.850/2023",
            },
            medicamentos: {
                aliquota: 0.195,
                descricao: "Medicamentos (genéricos e de marca) — alguns com isenção específica",
                base_legal: "Lei nº 21.850/2023",
                obs: "Diversos medicamentos para hipertensão e câncer isentos a partir de 2025",
            },
            produtos_luxo: {
                aliquota: 0.195,
                descricao: "Produtos supérfluos/luxo — sem sobretaxa (não há FECOP no PR)",
                base_legal: "Lei nº 21.850/2023",
            },
            informatica: {
                aliquota: 0.195,
                descricao: "Produtos de informática",
                base_legal: "Lei nº 21.850/2023",
            },
            glp: {
                aliquota: 0.195,
                descricao: "GLP (gás de cozinha)",
                base_legal: "Lei nº 21.850/2023",
            },
            querosene_aviacao: {
                aliquota: 0.195,
                descricao: "Querosene de aviação",
                base_legal: "Lei nº 21.850/2023",
            },

            // ── PRODUTOS COM ALÍQUOTA REDUZIDA (7%)
            agropecuarios_primarios: {
                aliquota: 0.07,
                descricao: "Produtos agropecuários primários",
                base_legal: "Convênios ICMS / RICMS-PR",
            },
            maquinas_equipamentos: {
                aliquota: 0.07,
                descricao: "Máquinas e equipamentos industriais",
                base_legal: "Convênios ICMS / RICMS-PR",
            },
            insumos_agropecuarios: {
                aliquota: 0.07,
                descricao: "Insumos agropecuários",
                base_legal: "Convênios ICMS / RICMS-PR",
            },
        },

        // ── Alíquotas Interestaduais ──
        interestaduais: {
            norte_nordeste_co_es: {
                aliquota: 0.07,
                descricao: "Para estados do Norte, Nordeste, Centro-Oeste e Espírito Santo",
                base_legal: "Resolução do Senado Federal nº 22/1989",
            },
            sul_sudeste_exceto_es: {
                aliquota: 0.12,
                descricao: "Para estados do Sul e Sudeste (exceto ES)",
                base_legal: "Resolução do Senado Federal nº 22/1989",
            },
            importados: {
                aliquota: 0.04,
                descricao: "Mercadorias importadas (Resolução Senado nº 13/2012)",
                base_legal: "Resolução do Senado Federal nº 13/2012; Convênio ICMS 38/13",
            },
        },

        importacao: {
            aliquota_interna: 0.195,
            aliquota_interestadual: 0.04,
            operacoes_zfm: 0.07,
            descricao: "Alíquota interna padrão 19,5%; 4% interestadual para importados (Res. Senado 13/12); tratamento especial ZFM",
            base_legal: "Lei nº 11.580/1996; Resolução Senado nº 13/2012; Convênio ICMS 38/13",
        },

        fecop: {
            existe: false,
            adicional: 0,
            descricao: "O Paraná NÃO possui Fundo de Combate à Pobreza. A alíquota de 19,5% é integral, sem adicionais.",
        },

        substituicao_tributaria: {
            aplicavel: true,
            descricao: "Amplamente utilizada no Paraná",
            produtos_sujeitos: [
                "Combustíveis (gasolina, diesel, etanol, GNV)",
                "Bebidas (cervejas, refrigerantes, alcoólicas)",
                "Cigarros e fumos",
                "Medicamentos",
                "Produtos de higiene pessoal",
                "Energia elétrica",
                "Telecomunicações",
                "Pneus",
                "Óleos lubrificantes",
                "Produtos de informática",
                "Cosméticos e perfumaria",
            ],
            mva: {
                descricao: "MVA varia conforme categoria e é atualizada periodicamente pela SEFA-PR",
                resolucao: "Resolução SEFA nº 982/2023",
                formula: "Base ST = Valor Operação × (1 + MVA); ICMS-ST = Base ST × Alíquota Interna",
            },
            convenios: [
                "Convênio ICMS 128/94 (cesta básica)",
                "Convênio ICMS 15/2023 (combustíveis — regime monofásico)",
                "Convênio ICMS 236/21 (DIFAL)",
            ],
            base_legal: "Lei nº 11.580/1996; Resolução SEFA nº 982/2023",
        },

        difal: {
            aplicavel: true,
            explicacao: "Diferencial de alíquotas para operações interestaduais destinadas a consumidor final não contribuinte do ICMS",
            formula: "DIFAL = (Alíquota Interna Destino - Alíquota Interestadual Origem) × Valor da Operação",
            base_legal: "EC 87/2015; LC 190/2022; Convênio ICMS 236/21",
            partilha: {
                "2020_atual": { destino: 1.00, origem: 0.00, obs: "100% para o estado de destino desde 2019" },
            },
            aliquota_interna_pr: 0.195,
        },

        // ── ICMS Monofásico (combustíveis) ──
        icms_monofasico: {
            descricao: "Regime monofásico para combustíveis — valores ad rem por unidade, uniformes em todo o Brasil",
            base_legal: "Convênio ICMS 15/2023",
            vigencia: "2026",
            valores: {
                gasolina: { valor: 1.57, unidade: "R$/litro", descricao: "Gasolina comum e aditivada" },
                diesel: { valor: 1.17, unidade: "R$/litro", descricao: "Diesel S10 e S500" },
                etanol: { valor: null, unidade: "R$/litro", descricao: "Conforme tabela SEFAZ — atualizado mensalmente" },
                gnv: { valor: null, unidade: "R$/m³", descricao: "Conforme tabela SEFAZ — atualizado mensalmente" },
            },
        },

        simples_nacional_icms: {
            descricao: "PR isenta ICMS para empresas do Simples com faturamento até R$ 360.000/ano",
            isencao_ate: 360000,
            tributacao_excedente: true,
            aliquota_efetiva_media: 0.0239,
            obs: "Alíquota efetiva média de ICMS Simples: 2,39% — abaixo da média nacional (2,81%)",
        },

        legislacao: [
            { norma: "Lei nº 11.580/1996", assunto: "ICMS — Lei Orgânica do ICMS no Paraná" },
            { norma: "Lei nº 21.850/2023", assunto: "Alterações ICMS — nova alíquota padrão 19,5%" },
            { norma: "Resolução SEFA nº 982/2023", assunto: "MVAs para Substituição Tributária" },
            { norma: "Convênio ICMS 15/2023", assunto: "Combustíveis — regime monofásico" },
            { norma: "EC 87/2015; LC 190/2022", assunto: "DIFAL" },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  3. IPVA — IMPOSTO SOBRE PROPRIEDADE DE VEÍCULOS AUTOMOTORES
    // ═══════════════════════════════════════════════════════════════

    ipva: {
        nome_completo: "Imposto sobre a Propriedade de Veículos Automotores",
        explicacao: "Imposto estadual anual sobre veículos. O Paraná possui a MENOR alíquota de IPVA do Brasil em 2026: 1,9% (redução de 45,7% em relação aos 3,5% de 2025). Desconto de 6% para pagamento à vista. Economia pode chegar a 49% na comparação com 2025.",
        base_legal: "Lei nº 21.850/2023 (Lei sancionada setembro/2025); Portarias SEFA-PR",
        url_lei: "https://www.fazenda.pr.gov.br",
        url_portal_ipva: "https://www.fazenda.pr.gov.br/Pagina/Calcule-agora-seu-IPVA-2026",
        fato_gerador: "Propriedade de veículo automotor em 1º de janeiro de cada exercício",
        base_calculo: "Valor venal do veículo conforme tabela FIPE (Fundação Instituto de Pesquisas Econômicas)",
        dados_disponiveis: true,

        aliquota_padrao: 0.019, // 1,9% — MENOR DO BRASIL
        aliquota_anterior: 0.035, // 3,5% (até 2025)
        reducao_percentual: 45.7,
        particularidade: "MENOR ALÍQUOTA DE IPVA DO BRASIL em 2026",

        aliquotas: {
            // 1,9% — Veículos em geral
            automovel_passeio: { aliquota: 0.019, descricao: "Automóveis de passeio (gasolina, diesel, flex)" },
            motocicleta_acima_170cc: { aliquota: 0.019, descricao: "Motocicletas acima de 170 cilindradas" },
            caminhonete: { aliquota: 0.019, descricao: "Caminhonetes" },
            camioneta: { aliquota: 0.019, descricao: "Camionetas" },
            ciclomotor: { aliquota: 0.019, descricao: "Ciclomotores (até 50cc)" },
            motoneta: { aliquota: 0.019, descricao: "Motonetas" },
            utilitario: { aliquota: 0.019, descricao: "Utilitários" },
            motorhome: { aliquota: 0.019, descricao: "Motorhomes" },
            triciclo: { aliquota: 0.019, descricao: "Triciclos" },
            quadriciclo: { aliquota: 0.019, descricao: "Quadriciclos" },
            caminhao_trator: { aliquota: 0.019, descricao: "Caminhões-tratores" },
            // 1,0% — Alíquota reduzida
            caminhao: { aliquota: 0.01, descricao: "Caminhões (carga pesada)" },
            onibus: { aliquota: 0.01, descricao: "Ônibus" },
            microonibus: { aliquota: 0.01, descricao: "Micro-ônibus" },
            locadora_ate_3_anos: { aliquota: 0.01, descricao: "Veículos de locadoras (até 3 anos)" },
            veiculo_gnv: { aliquota: 0.01, descricao: "Veículos movidos a GNV" },
            veiculo_aluguel: { aliquota: 0.01, descricao: "Veículos de aluguel (transporte remunerado PJ)" },
            embarcacao: { aliquota: 0.01, descricao: "Embarcações" },
            aeronave: { aliquota: 0.01, descricao: "Aeronaves" },
        },

        isencoes: [
            { tipo: "motocicleta_ate_170cc", descricao: "Motocicletas de até 170 cilindradas — ISENÇÃO TOTAL", base_legal: "Lei sancionada dez/2024, mantida em 2026" },
            { tipo: "veiculo_20_anos", descricao: "Veículos com mais de 20 anos de fabricação", base_legal: "PEC 72/2023 promulgada 09/12/2025" },
            { tipo: "pcd", descricao: "Veículos para Pessoa com Deficiência (PcD)", base_legal: "Lei nº 11.580/1996" },
            { tipo: "taxi_pf", descricao: "Táxis de pessoas físicas", base_legal: "Lei nº 11.580/1996" },
            { tipo: "veiculo_oficial", descricao: "Veículos oficiais (governo)", base_legal: "Lei nº 11.580/1996" },
            { tipo: "seguranca_publica", descricao: "Veículos de segurança pública", base_legal: "Lei nº 11.580/1996" },
        ],

        desconto_antecipacao: {
            percentual: 0.06,
            descricao: "6% de desconto para pagamento da cota única à vista",
            economia_total: "Até 49% comparado com IPVA 2025 (combinando redução de alíquota + desconto à vista)",
            exemplo: "Veículo R$ 50.000: IPVA 2025 = R$ 1.750 → IPVA 2026 à vista = R$ 893",
        },

        calendario_2026: {
            escalonamento_por_placa: true,
            cota_unica_com_desconto: {
                desconto: 0.06,
                percentual: "6%",
                vencimentos: {
                    "placas_1_2": "09/01/2026",
                    "placas_3_4": "12/01/2026",
                    "placas_5_6": "13/01/2026",
                    "placas_7_8": "14/01/2026",
                    "placas_9_0": "15/01/2026",
                },
            },
            parcelamento: {
                max_parcelas: 5,
                desconto: 0,
                obs: "Até 5 cotas iguais (janeiro a maio), sem desconto",
                vencimentos: {
                    "placas_1_2": ["09/01/2026", "09/02/2026", "09/03/2026", "09/04/2026", "11/05/2026"],
                    "placas_3_4": ["12/01/2026", "10/02/2026", "10/03/2026", "10/04/2026", "12/05/2026"],
                    "placas_5_6": ["13/01/2026", "11/02/2026", "11/03/2026", "13/04/2026", "13/05/2026"],
                    "placas_7_8": ["14/01/2026", "12/02/2026", "12/03/2026", "14/04/2026", "14/05/2026"],
                    "placas_9_0": ["15/01/2026", "13/02/2026", "13/03/2026", "15/04/2026", "15/05/2026"],
                },
            },
        },

        multa_atraso: {
            percentual: 0.20,
            juros_mora_diario: 0.0033,
            juros_selic: true,
            descricao: "Multa de 20% após 30 dias de atraso + juros Selic",
        },

        arrecadacao_estimada_2026: "R$ 4,6 bilhões",
        frota_tributavel: 4100000,
        veiculos_beneficiados: 3400000,
        percentual_frota_beneficiada: "83% da frota paranaense",
        comparativo: "PR tem o menor IPVA do Brasil (1,9%). SC cobra 2%, SP cobra 4%, MG 3-4%. Veículo de R$50k: PR=R$950, SC=R$1.000, SP=R$2.000",

        legislacao: [
            { norma: "Lei nº 21.850/2023", assunto: "IPVA — nova alíquota 1,9% (menor do Brasil)" },
            { norma: "PEC 72/2023 (promulgada 09/12/2025)", assunto: "Isenção veículos 20+ anos" },
            { norma: "Portarias SEFA-PR", assunto: "Calendário e regulamentação IPVA 2026" },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  4. ITCMD — IMPOSTO TRANSMISSÃO CAUSA MORTIS E DOAÇÃO
    // ═══════════════════════════════════════════════════════════════

    itcmd: {
        nome_completo: "Imposto sobre Transmissão Causa Mortis e Doação",
        explicacao: "Imposto estadual sobre heranças (causa mortis) e doações. Atualmente com alíquota FIXA de 4% no Paraná. A partir de 2026, passará a ser progressivo (4% a 8%) conforme LC 227/2026. Limite de isenção: R$ 70.170 (500 UPF/PR) para pequenas heranças.",
        base_legal: "Lei nº 1.427/1989 (atual); Lei Complementar nº 227/2026 (futuro progressivo)",
        fato_gerador: "Transmissão por herança (causa mortis) ou por doação de quaisquer bens ou direitos",
        base_calculo: "Valor venal (valor de mercado) dos bens e direitos transmitidos",
        dados_disponiveis: true,

        aliquotas: {
            causa_mortis: {
                tipo: "fixa",
                aliquota: 0.04,
                percentual: "4%",
                descricao: "Alíquota única para transmissão causa mortis",
            },
            doacao: {
                tipo: "fixa",
                aliquota: 0.04,
                percentual: "4%",
                descricao: "Alíquota única para doação de quaisquer bens ou direitos",
            },
        },

        progressividade: {
            implementada: false,
            obrigatoria_ec_132: true,
            observacao: "PR aplica alíquota fixa de 4%. EC 132/2023 e LC 227/2026 determinam progressividade obrigatória. Faixas futuras: 4% a 8%.",
            vigencia_futura: "2026 (conforme regulamentação estadual)",
            faixas_progressivas_2026: [
                { faixa: "Até R$ 10.000,00", aliquota: 0.04, valor_min: 0, valor_max: 10000 },
                { faixa: "De R$ 10.000,01 a R$ 50.000,00", aliquota: 0.05, valor_min: 10000.01, valor_max: 50000 },
                { faixa: "De R$ 50.000,01 a R$ 100.000,00", aliquota: 0.06, valor_min: 50000.01, valor_max: 100000 },
                { faixa: "De R$ 100.000,01 a R$ 500.000,00", aliquota: 0.07, valor_min: 100000.01, valor_max: 500000 },
                { faixa: "Acima de R$ 500.000,00", aliquota: 0.08, valor_min: 500000.01, valor_max: Infinity },
            ],
            teto_senado: 0.08,
        },

        isencoes: [
            { condicao: "Pequenas heranças até R$ 70.170 (500 UPF/PR)", base_legal: "Lei nº 1.427/1989" },
            { condicao: "Transmissões para cônjuge (isenção total, sem limite)", base_legal: "Lei nº 1.427/1989" },
            { condicao: "Transmissões para ascendentes/descendentes (isenção total, sem limite)", base_legal: "Lei nº 1.427/1989" },
            { condicao: "Bens de pequeno valor conforme legislação", base_legal: "Lei nº 1.427/1989" },
        ],

        limite_isencao_pequena_heranca: 70170,
        upf_pr: 140.34,
        prazo_pagamento: {
            dias: 30,
            descricao: "30 dias a contar da data do evento gerador (morte ou doação)",
        },

        reforma_tributaria: {
            ec_132_2023: "Obriga progressividade por valor do quinhão/doação",
            lc_227_2026: "Normas gerais — confirma progressividade obrigatória",
            impacto_pr: "Nova lei estadual necessária (4% a 8%); se aprovada em 2026 → efeitos em 2027",
        },

        legislacao: [
            { norma: "Lei nº 1.427/1989", assunto: "ITCMD — alíquota fixa 4% (vigente)" },
            { norma: "Lei Complementar nº 227/2026", assunto: "ITCMD progressivo — aplicação futura" },
            { norma: "EC nº 132/2023", assunto: "Progressividade obrigatória" },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  5. ISS — IMPOSTO SOBRE SERVIÇOS (Curitiba — referência)
    // ═══════════════════════════════════════════════════════════════

    iss: {
        municipio_referencia: "Curitiba",
        base_legal: "Lei Complementar nº 40/2001 (Código Tributário Municipal de Curitiba); LC nº 116/2003 (Federal)",
        prazo_pagamento: "Até o dia 20 de cada mês, via DAM (Documento de Arrecadação Municipal)",
        dados_disponiveis: true,

        aliquotas: {
            minima: 0.02,
            maxima: 0.05,
            mais_comum: 0.05,
        },

        por_tipo_servico: {
            servicos_computador: {
                aliquota: 0.02,
                descricao: "Serviços de computador sob encomenda",
                base_legal: "LC nº 40/2001",
            },
            programas_computador: {
                aliquota: 0.02,
                descricao: "Geração de programas de computador",
                base_legal: "LC nº 40/2001",
            },
            profissional_autonomo: {
                aliquota: 0.02,
                descricao: "Serviços prestados por profissional autônomo",
                base_legal: "LC nº 40/2001",
            },
            arrendamento_mercantil: {
                aliquota: 0.02,
                descricao: "Arrendamento mercantil (leasing)",
                base_legal: "LC nº 40/2001",
            },
            servicos_cinematograficos: {
                aliquota: 0.02,
                descricao: "Serviços cinematográficos",
                base_legal: "LC nº 40/2001",
            },
            pesquisa_projetos: {
                aliquota: 0.02,
                descricao: "Pesquisa e gestão de projetos científicos",
                base_legal: "LC nº 40/2001",
            },
            limpeza_drenagem: {
                aliquota: 0.03,
                descricao: "Limpeza e drenagem de portos, rios e canais",
                base_legal: "LC nº 40/2001",
            },
            veiculacao_publicidade: {
                aliquota: 0.03,
                descricao: "Veiculação de publicidade (internet)",
                base_legal: "LC nº 40/2001",
            },
            cooperativas_saude: {
                aliquota: 0.04,
                descricao: "Cooperativas de serviços de saúde",
                base_legal: "LC nº 40/2001",
            },
            construcao_civil: {
                aliquota: 0.05,
                descricao: "Construção civil",
                base_legal: "LC nº 40/2001",
            },
            servicos_saude: {
                aliquota: 0.05,
                descricao: "Serviços de saúde",
                base_legal: "LC nº 40/2001",
            },
            servicos_educacao: {
                aliquota: 0.05,
                descricao: "Serviços de educação",
                base_legal: "LC nº 40/2001",
            },
            servicos_contabeis: {
                aliquota: 0.05,
                descricao: "Serviços contábeis e advocatícios",
                base_legal: "LC nº 40/2001",
            },
            transporte_municipal: {
                aliquota: 0.05,
                descricao: "Serviços de transporte municipal",
                base_legal: "LC nº 40/2001",
            },
            limpeza_vigilancia: {
                aliquota: 0.05,
                descricao: "Serviços de limpeza e vigilância",
                base_legal: "LC nº 40/2001",
            },
            demais_servicos: {
                aliquota: 0.05,
                descricao: "Demais serviços não especificados",
                base_legal: "LC nº 40/2001",
            },
        },

        municipios: [
            { nome: "Curitiba", iss_geral: 5.0 },
            { nome: "Londrina", iss_geral: 5.0 },
            { nome: "Maringá", iss_geral: 5.0 },
            { nome: "Ponta Grossa", iss_geral: 5.0 },
            { nome: "Cascavel", iss_geral: 5.0 },
            { nome: "São José dos Pinhais", iss_geral: 5.0 },
            { nome: "Foz do Iguaçu", iss_geral: 5.0 },
            { nome: "Colombo", iss_geral: 5.0 },
            { nome: "Guarapuava", iss_geral: 5.0 },
            { nome: "Paranaguá", iss_geral: 5.0 },
        ],

        legislacao: [
            { norma: "Lei Complementar nº 40/2001", assunto: "Código Tributário Municipal de Curitiba" },
            { norma: "Lei Complementar nº 116/2003", assunto: "Federal — normas gerais ISS" },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  6. IPTU — IMPOSTO PREDIAL E TERRITORIAL URBANO (Curitiba)
    // ═══════════════════════════════════════════════════════════════

    iptu: {
        municipio_referencia: "Curitiba",
        nome_completo: "Imposto Predial e Territorial Urbano",
        explicacao: "Imposto municipal anual sobre imóveis urbanos. Curitiba adota alíquotas progressivas conforme valor venal. Máxima residencial reduzida de 1,1% para 0,65% em 2024. Imóveis residenciais representam 70% do total.",
        base_legal: "Lei nº 691/1984 (Código Tributário Municipal); Decreto nº 27.041/2006",
        progressiva: true,
        dados_disponiveis: true,

        residencial: [
            { faixa: "Até R$ 38.645,00", aliquota: 0.002, valor_min: 0, valor_max: 38645 },
            { faixa: "De R$ 38.645,01 a R$ 48.386,00", aliquota: 0.0025, valor_min: 38645.01, valor_max: 48386 },
            { faixa: "De R$ 48.386,01 a R$ 65.000,00", aliquota: 0.003, valor_min: 48386.01, valor_max: 65000 },
            { faixa: "De R$ 65.000,01 a R$ 100.000,00", aliquota: 0.004, valor_min: 65000.01, valor_max: 100000 },
            { faixa: "De R$ 100.000,01 a R$ 150.000,00", aliquota: 0.005, valor_min: 100000.01, valor_max: 150000 },
            { faixa: "De R$ 150.000,01 a R$ 250.000,00", aliquota: 0.0055, valor_min: 150000.01, valor_max: 250000 },
            { faixa: "Acima de R$ 250.000,00", aliquota: 0.0065, valor_min: 250000.01, valor_max: Infinity },
        ],

        comercial: [
            { faixa: "Até R$ 50.000,00", aliquota: 0.005, valor_min: 0, valor_max: 50000 },
            { faixa: "De R$ 50.000,01 a R$ 100.000,00", aliquota: 0.0075, valor_min: 50000.01, valor_max: 100000 },
            { faixa: "De R$ 100.000,01 a R$ 200.000,00", aliquota: 0.01, valor_min: 100000.01, valor_max: 200000 },
            { faixa: "De R$ 200.000,01 a R$ 500.000,00", aliquota: 0.0125, valor_min: 200000.01, valor_max: 500000 },
            { faixa: "Acima de R$ 500.000,00", aliquota: 0.015, valor_min: 500000.01, valor_max: Infinity },
        ],

        terreno: [
            { faixa: "Até R$ 50.000,00", aliquota: 0.0075, valor_min: 0, valor_max: 50000 },
            { faixa: "De R$ 50.000,01 a R$ 100.000,00", aliquota: 0.01, valor_min: 50000.01, valor_max: 100000 },
            { faixa: "De R$ 100.000,01 a R$ 200.000,00", aliquota: 0.0125, valor_min: 100000.01, valor_max: 200000 },
            { faixa: "Acima de R$ 200.000,00", aliquota: 0.015, valor_min: 200000.01, valor_max: Infinity },
        ],

        isencoes: [
            "Entidades filantrópicas",
            "Imóveis públicos",
            "Imóveis de culto religioso",
            "Imóveis de pequeno valor (conforme legislação)",
        ],

        observacao: "Alíquotas máximas residenciais reduzidas de 1,1% para 0,65% em 2024. Imóveis residenciais representam 70% do total de imóveis em Curitiba.",

        legislacao: [
            { norma: "Lei nº 691/1984", assunto: "Código Tributário Municipal — IPTU" },
            { norma: "Decreto nº 27.041/2006", assunto: "Regulamentação IPTU Curitiba" },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  7. ITBI — IMPOSTO TRANSMISSÃO DE BENS IMÓVEIS (Curitiba)
    // ═══════════════════════════════════════════════════════════════

    itbi: {
        municipio_referencia: "Curitiba",
        nome_completo: "Imposto sobre Transmissão de Bens Imóveis",
        explicacao: "Imposto municipal sobre transmissão onerosa de imóveis. Curitiba cobra 2,7% sobre o maior valor entre venal e declarado. Também incide sobre heranças e doações de imóveis.",
        base_legal: "Lei nº 691/1984; Lei nº 3.691/2002",
        dados_disponiveis: true,

        aliquotas: {
            transmissao_onerosa: { aliquota: 0.027, descricao: "Transmissão onerosa (compra e venda)" },
            heranca: { aliquota: 0.027, descricao: "Transmissão por herança" },
            doacao: { aliquota: 0.027, descricao: "Doação de imóveis" },
        },

        base_calculo: "Maior valor entre o valor venal de referência (prefeitura) e o valor declarado/de compra",

        isencoes: [
            "Transmissões entre cônjuges",
            "Transmissões para ascendentes/descendentes",
            "Imóveis de pequeno valor (conforme legislação)",
        ],

        legislacao: [
            { norma: "Lei nº 691/1984", assunto: "Código Tributário Municipal — ITBI" },
            { norma: "Lei nº 3.691/2002", assunto: "Alterações ITBI Curitiba" },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  8. TAXAS ESTADUAIS E MUNICIPAIS
    // ═══════════════════════════════════════════════════════════════

    taxas: {

        estaduais: {
            dados_disponiveis: false,
            obs: "Taxas estaduais variam por serviço e são atualizadas periodicamente pela SEFA-PR",
            principais: [
                { taxa: "Taxa de licenciamento de veículos", valor: "Incluída no IPVA" },
                { taxa: "Taxa judiciária", valor: "Conforme tabela da Justiça Estadual" },
                { taxa: "Taxa de serviços da SEFAZ", valor: "Conforme tabela específica" },
                { taxa: "Taxa ambiental", valor: "Conforme legislação ambiental estadual" },
                { taxa: "Taxa de incêndio/bombeiros", valor: "Calculada sobre valor venal do imóvel" },
                { taxa: "Emolumentos cartorários", valor: "Conforme tabela de emolumentos" },
            ],
            contato: "SEFA-PR: https://www.fazenda.pr.gov.br",
        },

        municipais_curitiba: {
            dados_disponiveis: true,
            taxas: {
                coleta_lixo: { minima: 15.00, maxima: 50.00, unidade: "R$/mês", obs: "Varia conforme imóvel" },
                alvara_funcionamento: { minima: 100.00, maxima: 500.00, unidade: "R$", obs: "Varia conforme atividade" },
                publicidade: { valor: "Conforme tabela específica", unidade: "R$", obs: "Atualizada anualmente" },
                cosip: { minima: 5.00, maxima: 30.00, unidade: "R$/mês", obs: "Contribuição de iluminação pública — conforme consumo" },
            },
            base_legal: "Lei nº 691/1984; Decretos municipais",
        },

        legislacao: [
            { norma: "Lei nº 691/1984", assunto: "Taxas municipais Curitiba" },
            { norma: "SEFA-PR", assunto: "Taxas estaduais — tabelas atualizadas periodicamente" },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  9. IMPOSTOS FEDERAIS (aplicáveis em PR)
    // ═══════════════════════════════════════════════════════════════

    federal: {
        irpj: {
            nome: "Imposto de Renda Pessoa Jurídica",
            lucro_real: { aliquota: 0.15, adicional: 0.10, limite_adicional: 20000 },
            lucro_presumido: { aliquota: 0.15, presuncao_comercio: 0.08, presuncao_servicos: 0.32 },
            lucro_arbitrado: { aliquota: 0.15, adicional: 0.10 },
            incentivos_regionais: "Não aplicável — PR fora da SUDAM/SUDENE",
            base_legal: "Lei nº 9.249/1995; Lei nº 9.430/1996",
        },

        irpf: {
            nome: "Imposto de Renda Pessoa Física",
            tabela_progressiva: [
                { faixa: "Até R$ 1.518,00", aliquota: 0.00, deducao: 0, faixa_ate: 1518.00 },
                { faixa: "De R$ 1.518,01 a R$ 2.793,88", aliquota: 0.075, deducao: 113.85, faixa_de: 1518.01, faixa_ate: 2793.88 },
                { faixa: "De R$ 2.793,89 a R$ 4.156,56", aliquota: 0.15, deducao: 419.53, faixa_de: 2793.89, faixa_ate: 4156.56 },
                { faixa: "De R$ 4.156,57 a R$ 8.313,11", aliquota: 0.225, deducao: 933.42, faixa_de: 4156.57, faixa_ate: 8313.11 },
                { faixa: "Acima de R$ 8.313,11", aliquota: 0.275, deducao: 1660.53, faixa_acima: 8313.11 },
            ],
            deducoes: {
                dependente: 189.59,
                educacao_limite_anual: 3561.50,
                previdencia_privada: "Sem limite (PGBL até 12% da renda bruta tributável)",
                pensao_alimenticia: "Conforme decisão judicial",
                despesas_medicas: "Sem limite",
            },
            desconto_simplificado: {
                percentual: 0.20,
                limite: 16754.34,
                descricao: "Desconto simplificado de 20% sobre rendimentos tributáveis, limitado a R$ 16.754,34",
            },
            base_legal: "Lei nº 7.713/1988; Instruções Normativas RFB",
        },

        csll: {
            nome: "Contribuição Social sobre o Lucro Líquido",
            lucro_real: 0.09,
            lucro_presumido: { aliquota: 0.09, presuncao: 0.12 },
            lucro_arbitrado: 0.09,
            base_legal: "Lei nº 7.713/1988; Lei Complementar nº 104/2001",
        },

        pis: {
            nome: "PIS/PASEP",
            cumulativo: 0.0065,
            nao_cumulativo: 0.0165,
            importacao: 0.0165,
            aliquota_zero_cesta_basica: true,
            produtos_aliquota_zero: ["Arroz", "Feijão", "Leite", "Pão", "Frutas e verduras", "Ovos", "Carnes"],
            base_legal: "Lei nº 10.637/2002; Lei nº 10.833/2003",
        },

        cofins: {
            nome: "COFINS",
            cumulativo: 0.03,
            nao_cumulativo: 0.076,
            importacao: 0.076,
            aliquota_zero_cesta_basica: true,
            base_legal: "Lei nº 10.833/2003",
        },

        ipi: {
            nome: "Imposto sobre Produtos Industrializados",
            referencia: "TIPI — Tabela de Incidência do IPI (Decreto nº 11.362/2023)",
            aliquota_range: "0% a 300% conforme produto",
            isencoes_regiao_sul: false,
            base_legal: "Lei nº 4.502/1964; Decretos atualizados",
        },

        iof: {
            nome: "Imposto sobre Operações Financeiras",
            credito_pf: { minima: 0.00, maxima: 0.03 },
            credito_pj: { minima: 0.00, maxima: 0.015 },
            cambio: { minima: 0.00, maxima: 0.25 },
            seguros: { minima: 0.00, maxima: 0.25 },
            titulos_valores: { minima: 0.00, maxima: 0.015 },
            base_legal: "Decreto-Lei nº 1.783/1980; Resoluções Banco Central",
        },

        ii: {
            nome: "Imposto de Importação",
            referencia: "TEC — Tarifa Externa Comum (Mercosul)",
            aliquota_range: { minima: 0.00, maxima: 0.55 },
            beneficios_pr: "Operações com ZFM têm tratamento especial",
            base_legal: "Lei nº 3.244/1957; Regulamentos Mercosul",
        },

        ie: {
            nome: "Imposto de Exportação",
            aliquota_geral: 0.00,
            obs: "Algumas commodities podem ter alíquotas específicas",
            base_legal: "Lei nº 3.244/1957",
        },

        itr: {
            nome: "Imposto Territorial Rural",
            tabela: [
                { descricao: "Até 50% de utilização", aliquota: 0.0003 },
                { descricao: "De 50% a 80% de utilização", aliquota: 0.00015 },
                { descricao: "Acima de 80% de utilização", aliquota: 0.00005 },
            ],
            isencoes: ["Pequena propriedade familiar (até 4 módulos fiscais)"],
            base_legal: "Lei nº 9.393/1996",
        },

        inss: {
            nome: "INSS / Contribuições Previdenciárias",
            patronal: 0.20,
            rat_sat: { minima: 0.005, maxima: 0.03 },
            terceiros_sistema_s: 0.025,
            empregado_faixas: [
                { faixa: "Até R$ 1.518,00", aliquota: 0.075, faixa_ate: 1518.00 },
                { faixa: "De R$ 1.518,01 a R$ 2.793,88", aliquota: 0.09, faixa_de: 1518.01, faixa_ate: 2793.88 },
                { faixa: "De R$ 2.793,89 a R$ 4.156,56", aliquota: 0.12, faixa_de: 2793.89, faixa_ate: 4156.56 },
                { faixa: "Acima de R$ 4.156,57", aliquota: 0.14, faixa_acima: 4156.57, teto: 8313.11 },
            ],
            base_legal: "Lei nº 8.212/1991; Lei nº 8.213/1991",
        },

        fgts: {
            nome: "Fundo de Garantia por Tempo de Serviço",
            aliquota: 0.08,
            base_legal: "Lei nº 8.036/1990",
        },
    },


    // ═══════════════════════════════════════════════════════════════
    //  10. SIMPLES NACIONAL (aplicável em PR)
    // ═══════════════════════════════════════════════════════════════

    simples_nacional: {
        limite_geral: 3600000,
        sublimite_estadual: 3600000,
        adota_sublimite: true,
        isencao_icms_ate: 360000,
        isencao_icms_descricao: "Empresas do Simples com faturamento até R$ 360.000/ano são ISENTAS de ICMS no PR",
        limites: { microempresa: 360000, epp: 4800000 },

        fator_r: {
            descricao: "Empresas com Fator R (folha/receita) >= 28% podem migrar do Anexo V para o Anexo III",
            formula: "Fator R = Folha de salários 12 meses / Receita bruta 12 meses",
            limite: 0.28,
        },

        anexos: {
            anexo_I: {
                nome: "Comércio",
                faixas: [
                    { faixa: 1, limite: 180000, aliquota: 0.04, deducao: 0 },
                    { faixa: 2, limite: 360000, aliquota: 0.073, deducao: 5940 },
                    { faixa: 3, limite: 720000, aliquota: 0.095, deducao: 13860 },
                    { faixa: 4, limite: 1800000, aliquota: 0.107, deducao: 22500 },
                    { faixa: 5, limite: 3600000, aliquota: 0.143, deducao: 87300 },
                ],
            },
            anexo_II: {
                nome: "Indústria",
                faixas: [
                    { faixa: 1, limite: 180000, aliquota: 0.045, deducao: 0 },
                    { faixa: 2, limite: 360000, aliquota: 0.078, deducao: 5940 },
                    { faixa: 3, limite: 720000, aliquota: 0.10, deducao: 13860 },
                    { faixa: 4, limite: 1800000, aliquota: 0.112, deducao: 22500 },
                    { faixa: 5, limite: 3600000, aliquota: 0.155, deducao: 87300 },
                ],
            },
            anexo_III: {
                nome: "Serviços",
                faixas: [
                    { faixa: 1, limite: 180000, aliquota: 0.06, deducao: 0 },
                    { faixa: 2, limite: 360000, aliquota: 0.112, deducao: 9360 },
                    { faixa: 3, limite: 720000, aliquota: 0.135, deducao: 22860 },
                    { faixa: 4, limite: 1800000, aliquota: 0.16, deducao: 61500 },
                    { faixa: 5, limite: 3600000, aliquota: 0.1742, deducao: 116362 },
                ],
            },
            anexo_IV: {
                nome: "Serviços (construção, vigilância, advocacia)",
                faixas: [
                    { faixa: 1, limite: 180000, aliquota: 0.1693, deducao: 0 },
                    { faixa: 2, limite: 360000, aliquota: 0.187, deducao: 3150 },
                    { faixa: 3, limite: 720000, aliquota: 0.197, deducao: 7560 },
                    { faixa: 4, limite: 1800000, aliquota: 0.209, deducao: 16245 },
                    { faixa: 5, limite: 3600000, aliquota: 0.229, deducao: 40095 },
                ],
                obs: "CPP NÃO incluída — recolher INSS patronal à parte (20% + RAT + Terceiros)",
            },
            anexo_V: {
                nome: "Serviços (TI, engenharia, auditoria, jornalismo)",
                faixas: [
                    { faixa: 1, limite: 180000, aliquota: 0.21, deducao: 0 },
                    { faixa: 2, limite: 360000, aliquota: 0.217, deducao: 1260 },
                    { faixa: 3, limite: 720000, aliquota: 0.22, deducao: 2340 },
                    { faixa: 4, limite: 1800000, aliquota: 0.229, deducao: 5355 },
                    { faixa: 5, limite: 3600000, aliquota: 0.235, deducao: 8045 },
                ],
                obs: "Fator R >= 28% -> migra para Anexo III (alíquotas menores)",
            },
        },

        mei: {
            limite_faturamento_anual: 81000,
            das_comercio_industria: 71.60,
            das_servicos: 75.60,
            das_comercio_servicos: 79.60,
            obs: "Valores incluem INSS, ICMS e ISS (quando aplicável)",
        },

        base_legal: "Lei Complementar nº 123/2006; Resoluções CGSN",
    },


    // ═══════════════════════════════════════════════════════════════
    //  11. INCENTIVOS FISCAIS E BENEFÍCIOS REGIONAIS
    // ═══════════════════════════════════════════════════════════════

    incentivos: {

        sudam: {
            ativo: false,
            descricao: "PR NÃO está na área SUDAM",
            reducao_irpj: null,
        },

        sudene: {
            ativo: false,
            descricao: "PR NÃO está na área SUDENE",
            reducao_irpj: null,
        },

        alc: {
            existe: false,
            nome: null,
            municipios: [],
            observacao: "Operações com Zona Franca de Manaus têm tratamento tributário especial (Consulta SEFA nº 74/2020)",
        },

        programas_estaduais: [
            {
                nome: "Diferimento do ICMS",
                tipo: "diferimento",
                beneficio: "Adiamento do recolhimento do ICMS para etapa posterior da cadeia produtiva",
                setores: ["Indústria", "Agronegócio", "Logística"],
                base_legal: "RICMS/PR — Anexo VIII",
                vigencia: "Permanente",
            },
            {
                nome: "Isenção ICMS Simples Nacional (até R$ 360k)",
                tipo: "isencao",
                beneficio: "Isenção total de ICMS para empresas do Simples Nacional com faturamento até R$ 360.000/ano",
                setores: ["Todos (Simples Nacional)"],
                empresas_beneficiadas: "190.000+",
                base_legal: "Legislação estadual do Simples",
                vigencia: "Permanente",
            },
            {
                nome: "Redução ICMS Setores Estratégicos",
                tipo: "reducao",
                beneficio: "Redução de ICMS em operações específicas para setores estratégicos",
                setores: ["Turismo", "Tecnologia", "Energias renováveis", "Indústria de transformação", "Logística", "Agronegócio"],
                base_legal: "Resoluções SEFA; Decretos estaduais",
                vigencia: "Conforme cada programa",
            },
            {
                nome: "Isenção ICMS Medicamentos",
                tipo: "isencao",
                beneficio: "Isenção de ICMS para medicamentos específicos (hipertensão, câncer)",
                setores: ["Saúde"],
                base_legal: "Legislação específica (a partir de 2025)",
                vigencia: "Permanente",
            },
        ],

        isencoes_especificas: {
            agricultura_familiar: { existe: true, descricao: "Isenção/redução de ICMS em operações específicas" },
            sociobiodiversidade: { existe: true, descricao: "Isenção/redução conforme legislação da Amazônia Legal" },
            cooperativas: { existe: true, descricao: "Benefícios fiscais conforme Lei nº 5.764/1971" },
            exportadores: { existe: true, descricao: "Isenção de ICMS em operações de exportação" },
            industrias_transformacao: { existe: true, descricao: "Benefícios conforme programas estaduais" },
        },
    },


    // ═══════════════════════════════════════════════════════════════
    //  12. REFORMA TRIBUTÁRIA
    // ═══════════════════════════════════════════════════════════════

    reforma_tributaria: {
        ec_132_2023: {
            descricao: "Emenda Constitucional da Reforma Tributária",
            itcmd_progressivo: "Obriga progressividade (2% a 8%)",
            ibs: "Substituirá ICMS e ISS gradualmente (2026-2033)",
        },
        lc_214_2025: {
            nome: "Regulamentação do IBS e CBS",
            ibs: {
                nome: "Imposto sobre Bens e Serviços",
                descricao: "Substituirá o ICMS e ISS. Alíquota estadual PR estimada entre 16% e 18%",
                aliquota_prevista: { minima: 0.16, maxima: 0.18 },
                substituira: ["ICMS", "ISS"],
                status_pr: "Testes iniciados em janeiro/2026",
            },
            cbs: {
                nome: "Contribuição sobre Bens e Serviços",
                descricao: "Substituirá o PIS e COFINS. Alíquota federal estimada 9,25%",
                aliquota_prevista: 0.0925,
                substituira: ["PIS", "COFINS"],
                status_pr: "Testes iniciados em janeiro/2026",
            },
            is: {
                nome: "Imposto Seletivo (IS)",
                descricao: "Imposto sobre produtos prejudiciais à saúde ou ao meio ambiente",
                aliquota_inicial: 0.009,
                aliquota_maxima_estimada: 0.30,
                produtos: ["Combustíveis", "Bebidas alcoólicas", "Cigarros", "Armas e munições", "Produtos de luxo"],
                status: "Regulamentação pendente",
            },
        },
        lc_227_2026: {
            nome: "Comitê Gestor do IBS + Normas gerais ITCMD",
            itcmd: "Confirma progressividade obrigatória; competência territorial; bens exterior",
            comite_gestor: "CG-IBS para coordenação da arrecadação entre estados e municípios",
            impacto_pr: "Adequação ITCMD necessária — alíquota fixa pode ser contestada judicialmente",
        },
        transicao: {
            periodo: "2026-2033",
            cronograma: {
                "2026": "Testes e simulações (fase facultativa) — PR iniciou em janeiro/2026",
                "2027": "Início da cobrança obrigatória",
                "2026-2033": "Período de transição gradual",
            },
            obs: "Coexistência gradual ICMS/ISS/PIS/COFINS com IBS/CBS",
        },
        impacto_pr: {
            beneficios_regionais_perdidos: false,
            descricao: "PR não possui benefícios SUDAM/SUDENE, portanto não será afetado pela perda destes",
            fundo_desenvolvimento: "Em discussão — possível criação para compensar perdas de arrecadação",
            simplificacao_sistema: true,
            transicao_estruturada: true,
            operacoes_zfm: "Podem ter tratamento especial na transição",
            diferenciais: [
                "Maior quantidade de produtos isentos de ICMS na cesta básica",
                "Menor alíquota de IPVA do Brasil (1,9%)",
                "Transição tributária bem estruturada",
                "Testes CBS/IBS iniciados em janeiro/2026",
            ],
        },
    },


    // ═══════════════════════════════════════════════════════════════
    //  13. DADOS DE COBERTURA
    // ═══════════════════════════════════════════════════════════════

    cobertura: {
        versao: "3.0",
        data_atualizacao: "2026-02-10",
        localizados: [
            "Dados gerais do PR (IBGE, particularidades, legislação base)",
            "ICMS (alíquota padrão 19,5%, histórico, cesta básica 21 produtos isentos)",
            "ICMS interestaduais (7%/12%/4%), DIFAL, Substituição Tributária",
            "ICMS combustíveis monofásico 2026 (gasolina R$1,57/L, diesel R$1,17/L)",
            "ICMS Simples Nacional (isenção até R$360k, alíquota efetiva 2,39%)",
            "IPVA completo (1,9% passeio — MENOR DO BRASIL, 1% pesados, isenções)",
            "IPVA calendário 2026 completo (cota única + 5x por placa)",
            "IPVA desconto 6% à vista, multa 20% atraso, 5 parcelas",
            "IPVA isenções (motos até 170cc, 20+ anos, PcD, táxi, oficial)",
            "ITCMD (4% fixo atual + progressivo 4-8% futuro LC 227/2026)",
            "ISS Curitiba (2% a 5% por tipo de serviço — 15+ categorias)",
            "IPTU Curitiba progressivo (residencial, comercial, terreno — 18 faixas)",
            "ITBI Curitiba (2,7% padrão)",
            "Impostos Federais (IRPJ, IRPF, CSLL, PIS, COFINS, IPI, IOF, II, IE, ITR, INSS, FGTS)",
            "Simples Nacional (sublimite R$3.600.000, 5 anexos, Fator R, MEI)",
            "Incentivos fiscais (diferimento, isenção Simples, setores estratégicos)",
            "Reforma Tributária (IBS/CBS 2026, cronograma, impacto PR)",
        ],
        nao_localizados: [
            "Tabela completa de alíquotas ICMS por NCM/produto",
            "MVAs completas de substituição tributária por segmento (Res. SEFA 982/2023)",
            "Taxas estaduais específicas (judiciárias, ambientais, DETRAN)",
            "IPVA alíquotas para veículos elétricos/híbridos (apenas informado na pesquisa, não confirmado na SEFA)",
            "Emolumentos cartorários PR",
            "ISS valores fixos para profissionais autônomos em Curitiba",
            "IPTU alíquotas para áreas industriais em Curitiba",
            "Detalhes completos dos programas de incentivo fiscal por setor",
        ],
        contatos_para_completar: [
            { orgao: "SEFA-PR — Secretaria da Fazenda", url: "https://www.fazenda.pr.gov.br", tel: "(41) 3200-5009" },
            { orgao: "Prefeitura de Curitiba — Secretaria Municipal de Finanças", url: "https://www.curitiba.pr.gov.br" },
            { orgao: "DETRAN-PR", url: "https://www.detran.pr.gov.br" },
            { orgao: "Receita Federal", url: "https://www.gov.br/receitafederal", tel: "146" },
        ],
    },
};


// ═══════════════════════════════════════════════════════════════════════════
//  14. FUNÇÕES UTILITÁRIAS — PARANÁ
// ═══════════════════════════════════════════════════════════════════════════

/** Retorna alíquota de ISS por tipo de serviço em Curitiba */
function getISSParana(tipo) {
    const servico = PARANA_TRIBUTARIO.iss.por_tipo_servico[tipo];
    if (!servico) return PARANA_TRIBUTARIO.iss.aliquotas.mais_comum; // 5% padrão
    return servico.aliquota;
}

/** Retorna alíquota de IPVA por tipo de veículo no Paraná */
function getIPVAParana(tipo) {
    const veiculo = PARANA_TRIBUTARIO.ipva.aliquotas[tipo];
    if (!veiculo) return PARANA_TRIBUTARIO.ipva.aliquota_padrao;
    return veiculo.aliquota;
}

/** Retorna alíquota ITCMD (fixa 4%) */
function getITCMDParana(tipo) {
    if (tipo === "causa_mortis") return PARANA_TRIBUTARIO.itcmd.aliquotas.causa_mortis.aliquota;
    if (tipo === "doacao") return PARANA_TRIBUTARIO.itcmd.aliquotas.doacao.aliquota;
    return 0.04;
}

/** Verifica isenção de ITCMD (abaixo de 500 UPF/PR = R$ 70.170) */
function isIsentoITCMDParana(valor) {
    return valor <= PARANA_TRIBUTARIO.itcmd.limite_isencao_pequena_heranca;
}

/**
 * Calcula o IPVA no Paraná com verificação de isenções.
 * @param {number} valorVenal - Valor FIPE do veículo
 * @param {string} tipo - Tipo: "automovel_passeio", "caminhao", "motocicleta_acima_170cc", etc.
 * @param {number} anoFabricacao - Ano de fabricação do veículo
 * @param {object} opcoes - { cilindrada, aVista, pcd, taxi }
 * @returns {object} { valor, aliquota, isento, motivo, desconto, valorFinal, parcelas }
 */
function calcularIPVAParana(valorVenal, tipo, anoFabricacao, opcoes = {}) {
    const anoAtual = 2026;
    const idade = anoAtual - anoFabricacao;

    // Verificar isenções
    if (idade >= 20) {
        return { valor: 0, aliquota: 0, isento: true, motivo: "Veículo com " + idade + " anos (>= 20 anos — PEC 72/2023)", valorFinal: 0 };
    }
    if (opcoes.cilindrada && opcoes.cilindrada <= 170 && (tipo === "motocicleta_acima_170cc" || tipo === "motoneta" || tipo === "ciclomotor")) {
        return { valor: 0, aliquota: 0, isento: true, motivo: "Motocicleta até 170cc — isenta no PR desde 2025", valorFinal: 0 };
    }
    if (opcoes.pcd) {
        return { valor: 0, aliquota: 0, isento: true, motivo: "Veículo para PcD — isento", valorFinal: 0 };
    }
    if (opcoes.taxi) {
        return { valor: 0, aliquota: 0, isento: true, motivo: "Táxi PF — isento", valorFinal: 0 };
    }

    const aliquota = getIPVAParana(tipo);
    const valor = valorVenal * aliquota;

    const resultado = {
        valor: Math.round(valor * 100) / 100,
        aliquota: aliquota,
        aliquota_pct: (aliquota * 100).toFixed(1) + "%",
        isento: false,
        motivo: null,
    };

    if (opcoes.aVista) {
        resultado.desconto = 0.06;
        resultado.valorFinal = Math.round(valor * (1 - 0.06) * 100) / 100;
        resultado.economia = Math.round((valor - resultado.valorFinal) * 100) / 100;
    } else {
        resultado.valorFinal = resultado.valor;
        resultado.parcelas = 5;
        resultado.valorParcela = Math.round((valor / 5) * 100) / 100;
    }

    return resultado;
}

/**
 * Calcula ITCMD no Paraná (sistema atual: fixo 4%; futuro: progressivo).
 * @param {number} valor - Valor dos bens transmitidos
 * @param {string} sistema - "atual" (4% fixo) ou "progressivo" (LC 227/2026)
 * @returns {object} { valor, aliquota_efetiva, sistema, detalhamento }
 */
function calcularITCMDParana(valor, sistema = "atual") {
    if (valor <= 70170) {
        return { valor: 0, aliquota_efetiva: 0, sistema: sistema, isento: true, motivo: "Valor até R$ 70.170 (500 UPF/PR) — isento" };
    }

    if (sistema === "atual") {
        var imposto = valor * 0.04;
        return {
            valor: Math.round(imposto * 100) / 100,
            aliquota_efetiva: 0.04,
            aliquota_pct: "4%",
            sistema: "fixa",
            isento: false,
        };
    }

    // Sistema progressivo (LC 227/2026)
    var faixas = PARANA_TRIBUTARIO.itcmd.progressividade.faixas_progressivas_2026;
    var impostoTotal = 0;
    var detalhamento = [];

    for (var i = 0; i < faixas.length; i++) {
        var faixa = faixas[i];
        var limiteInferior = faixa.valor_min || 0;
        var limiteSuperior = faixa.valor_max === Infinity ? valor : faixa.valor_max;

        if (valor <= limiteInferior) break;

        var baseNaFaixa = Math.min(valor, limiteSuperior) - limiteInferior;
        if (baseNaFaixa <= 0) continue;

        var impostoFaixa = baseNaFaixa * faixa.aliquota;
        impostoTotal += impostoFaixa;
        detalhamento.push({
            faixa: faixa.faixa,
            base: Math.round(baseNaFaixa * 100) / 100,
            aliquota: faixa.aliquota,
            imposto: Math.round(impostoFaixa * 100) / 100,
        });
    }

    return {
        valor: Math.round(impostoTotal * 100) / 100,
        aliquota_efetiva: Math.round((impostoTotal / valor) * 10000) / 10000,
        aliquota_efetiva_pct: ((impostoTotal / valor) * 100).toFixed(2) + "%",
        sistema: "progressiva",
        isento: false,
        detalhamento: detalhamento,
    };
}

/**
 * Calcula DIFAL para operações originadas no Paraná.
 * @param {string} destino - Sigla do estado de destino (ex: "SP", "BA")
 * @param {number} valor - Valor da operação
 * @returns {object} { difal, aliquota_destino, aliquota_interestadual, diferenca }
 */
function calcularDIFALParana(destino, valor) {
    var aliquotasInternas = {
        AC: 0.19, AL: 0.19, AM: 0.20, AP: 0.18, BA: 0.205, CE: 0.20, DF: 0.20, ES: 0.17,
        GO: 0.19, MA: 0.22, MG: 0.18, MS: 0.17, MT: 0.17, PA: 0.19, PB: 0.20, PE: 0.205,
        PI: 0.225, PR: 0.195, RJ: 0.22, RN: 0.18, RO: 0.195, RR: 0.20, RS: 0.17, SC: 0.17,
        SE: 0.19, SP: 0.18, TO: 0.20,
    };

    var uf = destino.toUpperCase();
    var aliquotaDestino = aliquotasInternas[uf];
    if (!aliquotaDestino) return { erro: "Estado de destino '" + destino + "' não encontrado" };

    var sulSudeste = ["MG", "SP", "RJ", "PR", "SC", "RS"];
    var aliquotaInterestadual = sulSudeste.includes(uf) && uf !== "ES" ? 0.12 : 0.07;

    var diferenca = aliquotaDestino - aliquotaInterestadual;
    var difal = diferenca > 0 ? Math.round(valor * diferenca * 100) / 100 : 0;

    return {
        difal: difal,
        aliquota_destino: aliquotaDestino,
        aliquota_destino_pct: (aliquotaDestino * 100).toFixed(1) + "%",
        aliquota_interestadual: aliquotaInterestadual,
        aliquota_interestadual_pct: (aliquotaInterestadual * 100) + "%",
        diferenca: diferenca,
        diferenca_pct: (diferenca * 100).toFixed(1) + "%",
        valor_operacao: valor,
    };
}

/**
 * Calcula ICMS "por dentro" para o Paraná.
 * @param {number} valor - Valor do produto (sem ICMS)
 * @param {string} tipo - "geral", "cesta_basica_reduzida", "cesta_basica_isenta", "agropecuario"
 * @returns {object} { icms, aliquota, base_calculo, valor_com_icms }
 */
function calcularICMSParana(valor, tipo) {
    if (tipo === undefined) tipo = "geral";
    var aliquotas = {
        geral: 0.195,
        cesta_basica_reduzida: 0.07,
        cesta_basica_isenta: 0.00,
        agropecuario: 0.07,
        maquinas_equipamentos: 0.07,
    };

    var aliquota = aliquotas.hasOwnProperty(tipo) ? aliquotas[tipo] : 0.195;

    if (aliquota === 0) {
        return { icms: 0, aliquota: 0, base_calculo: valor, valor_com_icms: valor, tipo: tipo };
    }

    // ICMS "por dentro": Base = Valor / (1 - alíquota)
    var baseCalculo = valor / (1 - aliquota);
    var icms = baseCalculo * aliquota;

    return {
        icms: Math.round(icms * 100) / 100,
        aliquota: aliquota,
        aliquota_pct: (aliquota * 100).toFixed(1) + "%",
        base_calculo: Math.round(baseCalculo * 100) / 100,
        valor_com_icms: Math.round(baseCalculo * 100) / 100,
        tipo: tipo,
    };
}

/**
 * Calcula o Simples Nacional para empresas no Paraná.
 * @param {string} anexo - "anexo_I", "anexo_II", "anexo_III", "anexo_IV", "anexo_V"
 * @param {number} rbt12 - Receita Bruta Total dos últimos 12 meses
 * @param {number} faturamentoMes - Faturamento do mês atual
 * @returns {object} { aliquota_efetiva, das, faixa, alerta_sublimite }
 */
function calcularSimplesNacionalParana(anexo, rbt12, faturamentoMes) {
    var nomesAnexo = {
        anexo_i: "anexo_I",
        anexo_ii: "anexo_II",
        anexo_iii: "anexo_III",
        anexo_iv: "anexo_IV",
        anexo_v: "anexo_V",
        anexo_I: "anexo_I",
        anexo_II: "anexo_II",
        anexo_III: "anexo_III",
        anexo_IV: "anexo_IV",
        anexo_V: "anexo_V",
        anexo_i_comercio: "anexo_I",
        anexo_ii_industria: "anexo_II",
        anexo_iii_servicos: "anexo_III",
        anexo_iv_servicos_profissionais: "anexo_IV",
        anexo_v_servicos_especiais: "anexo_V",
    };

    var chave = nomesAnexo[anexo];
    if (!chave) return { erro: "Anexo '" + anexo + "' não encontrado" };

    var tabelaAnexo = PARANA_TRIBUTARIO.simples_nacional.anexos[chave];
    if (!tabelaAnexo) return { erro: "Tabela não encontrada para " + chave };

    var tabela = tabelaAnexo.faixas;

    // Encontrar a faixa
    var faixaEncontrada = null;
    for (var i = 0; i < tabela.length; i++) {
        if (rbt12 <= tabela[i].limite) {
            faixaEncontrada = tabela[i];
            break;
        }
    }

    if (!faixaEncontrada) {
        return { erro: "RBT12 de R$ " + rbt12.toLocaleString("pt-BR") + " excede o limite do Simples Nacional (R$ 3.600.000)" };
    }

    // Calcular alíquota efetiva
    var aliquotaEfetiva = ((rbt12 * faixaEncontrada.aliquota) - faixaEncontrada.deducao) / rbt12;
    var das = faturamentoMes * aliquotaEfetiva;

    var resultado = {
        anexo: anexo,
        faixa: faixaEncontrada.faixa,
        aliquota_nominal: faixaEncontrada.aliquota,
        aliquota_nominal_pct: (faixaEncontrada.aliquota * 100).toFixed(2) + "%",
        deducao: faixaEncontrada.deducao,
        aliquota_efetiva: Math.round(aliquotaEfetiva * 10000) / 10000,
        aliquota_efetiva_pct: (aliquotaEfetiva * 100).toFixed(2) + "%",
        das: Math.round(das * 100) / 100,
        rbt12: rbt12,
        faturamento_mes: faturamentoMes,
    };

    // Alertas
    if (rbt12 > PARANA_TRIBUTARIO.simples_nacional.sublimite_estadual) {
        resultado.alerta_sublimite = "RBT12 excede sublimite PR (R$ " + PARANA_TRIBUTARIO.simples_nacional.sublimite_estadual.toLocaleString("pt-BR") + "). ICMS/ISS recolhidos fora do DAS.";
    }
    if (rbt12 <= 360000) {
        resultado.isencao_icms = "Faturamento até R$ 360.000 — ISENTO de ICMS no Paraná!";
    }

    return resultado;
}

/**
 * Calcula IRPF mensal simplificado.
 * @param {number} rendaMensal - Renda mensal bruta
 * @returns {object} { imposto, aliquota_efetiva, faixa }
 */
function calcularIRPFParana(rendaMensal) {
    var tabela = PARANA_TRIBUTARIO.federal.irpf.tabela_progressiva;

    // Desconto simplificado mensal
    var descontoSimplificado = Math.min(rendaMensal * 0.20, 16754.34 / 12);
    var baseCalculo = rendaMensal - descontoSimplificado;

    if (baseCalculo <= 0) return { imposto: 0, aliquota_efetiva: 0, faixa: "Isento" };

    var imposto = 0;
    var faixa = "Isento";

    for (var i = 0; i < tabela.length; i++) {
        var f = tabela[i];
        if (f.aliquota === 0) continue;

        var limiteInferior = f.faixa_de || f.faixa_acima || 0;
        if (baseCalculo >= limiteInferior) {
            imposto = baseCalculo * f.aliquota - f.deducao;
            faixa = f.faixa;
        } else {
            break;
        }
    }

    imposto = Math.max(0, imposto);

    return {
        renda_bruta: rendaMensal,
        desconto_simplificado: Math.round(descontoSimplificado * 100) / 100,
        base_calculo: Math.round(baseCalculo * 100) / 100,
        imposto: Math.round(imposto * 100) / 100,
        aliquota_efetiva: rendaMensal > 0 ? Math.round((imposto / rendaMensal) * 10000) / 10000 : 0,
        aliquota_efetiva_pct: rendaMensal > 0 ? ((imposto / rendaMensal) * 100).toFixed(2) + "%" : "0%",
        faixa: faixa,
    };
}

/**
 * Calcula INSS do empregado (progressivo).
 * @param {number} salario - Salário bruto mensal
 * @returns {object} { contribuicao, aliquota_efetiva }
 */
function calcularINSSParana(salario) {
    var faixas = PARANA_TRIBUTARIO.federal.inss.empregado_faixas;
    var teto = 8313.11;
    var salarioLimitado = Math.min(salario, teto);
    var contribuicao = 0;
    var anterior = 0;
    var detalhamento = [];

    var limites = [1518.00, 2793.88, 4156.56, teto];

    for (var i = 0; i < faixas.length; i++) {
        var limite = limites[i];
        var aliquota = faixas[i].aliquota;

        if (salarioLimitado <= anterior) break;

        var base = Math.min(salarioLimitado, limite) - anterior;
        if (base <= 0) break;

        var valor = base * aliquota;
        contribuicao += valor;
        detalhamento.push({
            faixa: faixas[i].faixa,
            base: Math.round(base * 100) / 100,
            aliquota: aliquota,
            valor: Math.round(valor * 100) / 100,
        });

        anterior = limite;
    }

    return {
        salario_bruto: salario,
        contribuicao: Math.round(contribuicao * 100) / 100,
        aliquota_efetiva: salario > 0 ? Math.round((contribuicao / salario) * 10000) / 10000 : 0,
        aliquota_efetiva_pct: salario > 0 ? ((contribuicao / salario) * 100).toFixed(2) + "%" : "0%",
        teto_aplicado: salario > teto,
        detalhamento: detalhamento,
    };
}

/** ICMS efetivo (padrão + FECOP) */
function getICMSEfetivoParana() {
    return PARANA_TRIBUTARIO.icms.aliquota_padrao + PARANA_TRIBUTARIO.icms.fecop.adicional;
}

/** Calcula IPVA com desconto de cota única */
function calcIPVAComDescontoParana(valorVeiculoFipe, tipo) {
    if (tipo === undefined) tipo = "automovel_passeio";
    var aliq = getIPVAParana(tipo);
    var ipvaCheio = valorVeiculoFipe * aliq;
    var desconto = PARANA_TRIBUTARIO.ipva.calendario_2026.cota_unica_com_desconto.desconto;
    return {
        ipva_cheio: +(ipvaCheio.toFixed(2)),
        desconto_percentual: desconto,
        ipva_com_desconto: +(ipvaCheio * (1 - desconto)).toFixed(2),
        parcela_5x: +(ipvaCheio / 5).toFixed(2),
    };
}

/** Resumo rápido dos tributos */
function resumoTributarioParana() {
    return {
        estado: "Paraná (PR)",
        icms_padrao: "19,5% (sem FECOP)",
        icms_cesta_basica: "21 de 32 produtos ISENTOS (maior do Brasil)",
        fecop: "Não existe",
        ipva_passeio: "1,9% (MENOR DO BRASIL)",
        ipva_pesados: "1,0%",
        ipva_desconto_cota_unica: "6%",
        itcmd: "4% fixa (progressivo 4-8% previsto LC 227/2026)",
        iss_faixa: "2% a 5% (Curitiba)",
        iptu_residencial: "0,20% a 0,65% (Curitiba)",
        itbi: "2,7% (Curitiba)",
        sublimite_simples: "R$ 3.600.000",
        isencao_icms_simples: "Até R$ 360.000",
        sudam: "Não aplicável",
        sudene: "Não aplicável",
    };
}


// ═══════════════════════════════════════════════════════════════════════════
//  15. EXPORTAÇÃO (Padrão Grupo 2)
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        ...PARANA_TRIBUTARIO,
        utils: {
            getISS: getISSParana,
            getIPVA: getIPVAParana,
            getITCMD: getITCMDParana,
            isIsentoITCMD: isIsentoITCMDParana,
            calcularIPVA: calcularIPVAParana,
            calcularITCMD: calcularITCMDParana,
            calcularDIFAL: calcularDIFALParana,
            calcularICMS: calcularICMSParana,
            calcularSimplesNacional: calcularSimplesNacionalParana,
            calcularIRPF: calcularIRPFParana,
            calcularINSS: calcularINSSParana,
            getICMSEfetivo: getICMSEfetivoParana,
            calcIPVAComDesconto: calcIPVAComDescontoParana,
            resumoTributario: resumoTributarioParana,
        },
    };
}

if (typeof window !== "undefined") {
    window.PARANA_TRIBUTARIO = PARANA_TRIBUTARIO;
    window.ParanaTributario = {
        getISS: getISSParana,
        getIPVA: getIPVAParana,
        getITCMD: getITCMDParana,
        isIsentoITCMD: isIsentoITCMDParana,
        calcularIPVA: calcularIPVAParana,
        calcularITCMD: calcularITCMDParana,
        calcularDIFAL: calcularDIFALParana,
        calcularICMS: calcularICMSParana,
        calcularSimplesNacional: calcularSimplesNacionalParana,
        calcularIRPF: calcularIRPFParana,
        calcularINSS: calcularINSSParana,
        getICMSEfetivo: getICMSEfetivoParana,
        calcIPVAComDesconto: calcIPVAComDescontoParana,
        resumo: resumoTributarioParana,
    };
}
