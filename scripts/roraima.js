/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RORAIMA.JS — Base de Dados Tributária Completa do Estado de Roraima
 * ═══════════════════════════════════════════════════════════════════════════
 * Versão 3.0 — ARQUIVO MODELO para padronização de todos os estados
 * Dados verificados via fontes oficiais (SEFAZ/RR, RFB, Planalto, DETRAN-RR)
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
 *   08. taxas               — Estaduais (UFERR, valores exatos) e municipais
 *   09. federal             — IRPJ, CSLL, PIS, COFINS, IOF, ITR, INSS, FGTS, IRPF
 *   10. simples_nacional    — Anexos, faixas, sublimite, MEI
 *   11. incentivos          — SUDAM/SUDENE, ALC/ZFM, SUFRAMA, programas estaduais
 *   12. reforma_tributaria  — EC 132, LC 214, LC 227, transição IBS/CBS
 *   13. cobertura           — Versão, itens localizados/pendentes, contatos
 *   14. funções utilitárias — Helpers de cálculo
 *   15. exportação          — module.exports + window (padrão Grupo 2)
 *
 * FONTES CONSULTADAS:
 *   • SEFAZ/RR — www.sefaz.rr.gov.br
 *   • Lei Complementar nº 59/1993 (Código Tributário Estadual)
 *   • Decreto nº 4.335-E/2001 (RICMS/RR)
 *   • Decreto nº 37.319-E/2025 (Alterações RICMS/RR — reduções de base)
 *   • Lei nº 1.767/2022 (ICMS 20% modal a partir de 30/03/2023)
 *   • Lei nº 2.092/2024 (Crédito presumido combustíveis — energia isolada)
 *   • Lei nº 152/2025 (ALC Boa Vista e Bonfim — abrangência)
 *   • Portaria SEFAZ/DITRI/DEPAR nº 1224/2025 (UFERR 2026: R$ 540,57)
 *   • Portaria SEFAZ/DEPAR/DITRI nº 1179/2024 (UFERR 2025: R$ 517,49)
 *   • Portal Governo RR — Calendário IPVA 2026
 *   • Consulta de Taxas de Expediente — SEFAZ/RR (valores em UFERR)
 *   • Lei Complementar nº 1.223/2009 (Código Tributário Boa Vista)
 *   • LC nº 2/2011, LC nº 10/2018 (Alterações CTM Boa Vista)
 *   • Decreto nº 113-E/2025 (NFS-e Boa Vista)
 *   • Decreto nº 127-E/2025 (Calendário Tributário Boa Vista 2026)
 *   • Instrução Normativa SEFAZ nº 1/2022 (Base de cálculo ITCD)
 *   • Lei nº 1.138/2016 (Taxas DETRAN-RR)
 *   • Portaria DETRAN-RR nº 16/2025 (Tabela taxas DETRAN 2025)
 *   • SEPLAN/RR (Cesta Básica — 14 itens)
 *   • Decreto SUFRAMA nº 61.244/1967 (ZFM/ALC)
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

const RORAIMA_TRIBUTARIO = {

    // ═══════════════════════════════════════════════════════════════
    //  1. DADOS GERAIS
    // ═══════════════════════════════════════════════════════════════

    dados_gerais: {
        estado: "Roraima",
        sigla: "RR",
        regiao: "Norte",
        capital: "Boa Vista",
        codigo_ibge: 14,
        codigo_ibge_capital: 1400100,
        populacao_estimada: 700000,
        zona_franca: false,
        alc: true,
        alc_nome: "Área de Livre Comércio de Boa Vista e Bonfim (ALCBV)",
        alc_municipios: ["Boa Vista", "Bonfim"],
        abrangencia_sudam: true,
        abrangencia_sudene: false,
        abrangencia_suframa: true,
        site_sefaz: "https://www.sefaz.rr.gov.br/",
        site_detran: "https://www.detran.rr.gov.br/",
        site_nfse_boa_vista: "https://boavista.saatri.com.br/",
        site_prefeitura_capital: "https://boavista.rr.gov.br/",
        legislacao_base: {
            codigo_tributario_estadual: "Lei Complementar nº 59/1993",
            codigo_tributario_municipal: "Lei Complementar nº 1.223/2009 (Boa Vista)",
            ricms: "Decreto nº 4.335-E/2001 (RICMS/RR)",
        },

        // ── Unidade Fiscal do Estado ──
        uferr: {
            nome: "Unidade Fiscal do Estado de Roraima",
            sigla: "UFERR",
            valor_2026: 540.57,
            valor_2025: 517.49,
            valor_2024: 493.46,
            valor_2023: 471.40,
            valor_2022: 445.14,
            vigencia_2026: "01/01/2026 a 31/12/2026",
            atualizacao: "Anual, pelo IGP-DI/FGV (dez/anterior a nov/corrente)",
            base_legal: "Decreto-Lei nº 001/1990; Art. 176 da Lei 59/1993; Lei nº 301/2001",
            portaria_2026: "Portaria SEFAZ/DITRI/DEPAR nº 1224/2025",
            portaria_2025: "Portaria SEFAZ/DEPAR/DITRI nº 1179/2024",
            uso: "Indexador para tributos, taxas, multas e penalidades estaduais",
        },

        // ── Unidade Fiscal Municipal ──
        ufm: {
            nome: "Unidade Fiscal do Município de Boa Vista",
            sigla: "UFM",
            valor_2025: 145.37,
            valor_2024: 140.00,
            reajuste_2025: 0.039,
        },
    },


    // ═══════════════════════════════════════════════════════════════
    //  2. ICMS — IMPOSTO SOBRE CIRCULAÇÃO DE MERCADORIAS E SERVIÇOS
    // ═══════════════════════════════════════════════════════════════

    icms: {

        aliquota_padrao: 0.20,
        aliquota_padrao_percentual: "20%",
        aliquota_padrao_descricao: "Alíquota modal (Lei nº 1.767/2022, vigente desde 30/03/2023)",
        aliquota_anterior: 0.17,
        vigencia_inicio: "2023-03-30",

        // ── Alíquotas Diferenciadas ──
        aliquotas_diferenciadas: {
            cesta_basica: {
                aliquota: 0.07,
                percentual: "7%",
                itens: 14,
                produtos: [
                    "Arroz",
                    "Feijão",
                    "Carne",
                    "Frango",
                    "Leite",
                    "Pão",
                    "Café",
                    "Açúcar",
                    "Farinha de mandioca",
                    "Mandioca",
                    "Óleo de soja",
                    "Ovos",
                    "Sal",
                    "Alimentos complementares",
                ],
                fonte: "SEPLAN/RR — Pesquisa Cesta Básica",
            },
            energia_eletrica: {
                aliquota: 0.20,
                obs: "Alíquota modal; sistema isolado (não conectado ao SIN)",
            },
            combustiveis: {
                regime: "Monofásico (Convênio ICMS 199/2022)",
                gasolina: "Alíquota ad rem conforme CONFAZ",
                diesel: "Alíquota ad rem conforme CONFAZ",
                etanol: "Alíquota ad rem conforme CONFAZ",
                glp: "Alíquota ad rem conforme CONFAZ",
                obs: "Reduções graduais previstas (25→23→21,5→20%) foram revogadas pela Lei 1.767/2022",
                credito_presumido_energia: {
                    percentual: 1.00,
                    descricao: "100% do ICMS para combustíveis destinados a geração de energia em sistema isolado (não conectado ao SIN)",
                    legislacao: "Lei 2.092/2024; Decreto 37.319-E/2025",
                },
            },
            telecomunicacoes: {
                aliquota: 0.20,
                obs: "Alíquota modal",
            },
            bebidas_alcoolicas: {
                aliquota: 0.25,
                obs: "Alíquota diferenciada — produtos supérfluos",
            },
            cigarros_fumo: {
                aliquota: 0.25,
                obs: "Alíquota diferenciada — produtos supérfluos",
            },
            armas_municoes: {
                aliquota: 0.25,
                obs: "Alíquota diferenciada",
            },
        },

        // ── Reduções de Base de Cálculo (Anexo I do RICMS/RR) ──
        reducoes_base_calculo: {
            fonte: "Decreto nº 37.319-E/2025 (alterações Anexo I do RICMS/RR)",
            obs: "Tabela completa por NCM indisponível nos portais — categorias principais abaixo",
            categorias: [
                {
                    categoria: "Carne de aves, gado bovino e leporídeos",
                    reducao_base: 0.4167,
                    carga_efetiva: 0.0833,
                    aplicacao: "Saídas interestaduais de carnes e derivados",
                },
                {
                    categoria: "Insumos agropecuários — Grupo A",
                    reducao_base: 0.60,
                    carga_efetiva: 0.08,
                    aplicacao: "Saídas interestaduais",
                    vigencia: "Até 31/12/2025 (verificar prorrogação)",
                },
                {
                    categoria: "Insumos agropecuários — Grupo B",
                    reducao_base: 0.30,
                    carga_efetiva: 0.14,
                    aplicacao: "Saídas interestaduais",
                    vigencia: "Até 31/12/2025 (verificar prorrogação)",
                },
                {
                    categoria: "Insumos agropecuários — Grupo C",
                    reducao_base: null,
                    carga_efetiva: 0.04,
                    aplicacao: "Importações e saídas internas/interestaduais",
                    obs: "Redução variável para atingir carga de 4%",
                },
                {
                    categoria: "Máquinas e implementos agrícolas",
                    reducao_base_interestadual: 0.4167,
                    carga_efetiva_interestadual: 0.07,
                    reducao_base_interna: 0.72,
                    carga_efetiva_interna: 0.056,
                    vigencia: "Até 30/04/2024 (verificar prorrogação)",
                },
                {
                    categoria: "Aeronaves, partes e peças",
                    reducao_base: 0.80,
                    carga_efetiva: 0.04,
                    vigencia: "Até 30/04/2024 (verificar prorrogação)",
                },
                {
                    categoria: "Biodiesel (B-100)",
                    reducao_base: 0.40,
                    carga_efetiva: 0.12,
                    vigencia: "Até 30/04/2024 (verificar prorrogação)",
                },
            ],
        },

        // ── Alíquotas Interestaduais ──
        interestaduais: {
            para_norte_ne_co_es: 0.12,
            para_sul_sudeste: 0.07,
            para_nao_contribuinte: 0.20,
            importados: 0.04,
        },

        importacao: {
            aliquota_geral: 0.20,
        },

        fecop: {
            existe: false,
            adicional: 0,
            obs: "Roraima não possui Fundo de Combate à Pobreza vinculado ao ICMS",
        },

        substituicao_tributaria: {
            aplicavel: true,
            obs: "Conforme convênios e protocolos ICMS vigentes (CONFAZ)",
        },

        beneficios_alc: {
            descricao: "ALC Boa Vista e Bonfim — Redução/Isenção de ICMS conforme legislação SUFRAMA",
            vigencia: "Permanente",
        },

        difal: {
            aplicavel: true,
            obs: "Diferencial de alíquota para consumidor final não contribuinte (EC 87/2015)",
        },

        legislacao: [
            { norma: "Lei Complementar nº 59/1993", assunto: "Código Tributário Estadual (base)" },
            { norma: "Decreto nº 4.335-E/2001", assunto: "RICMS/RR — Regulamento do ICMS" },
            { norma: "Decreto nº 37.319-E/2025", assunto: "Alterações RICMS — reduções de base, crédito presumido" },
            { norma: "Lei nº 1.767/2022", assunto: "ICMS 20% modal a partir de 30/03/2023" },
            { norma: "Lei nº 1.769/2022", assunto: "Incorpora Convênio ICMS 199/2022 — monofásico combustíveis" },
            { norma: "Lei nº 2.092/2024", assunto: "Crédito presumido combustíveis — geração energia isolada" },
            { norma: "Lei nº 152/2025", assunto: "Alterou abrangência ALC Boa Vista e Bonfim" },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  3. IPVA — IMPOSTO SOBRE PROPRIEDADE DE VEÍCULOS AUTOMOTORES
    // ═══════════════════════════════════════════════════════════════

    ipva: {

        aliquotas: {
            automoveis_passeio: 0.025,
            caminhonetes_utilitarios: 0.025,
            motocicletas: 0.02,
            motonetas_triciclos: 0.02,
            quadriciclos: 0.02,
            caminhoes: 0.01,
            onibus_micro: 0.01,
            embarcacoes: 0.025,
            aeronaves: 0.025,
            veiculos_locadoras: 0.007,
        },

        // ── Calendário IPVA 2026 ──
        calendario_2026: {
            escalonamento_por_placa: false,
            obs: "Vencimento ÚNICO para todos os veículos — não varia por final de placa",

            cota_unica_com_desconto: {
                desconto: 0.10,
                percentual: "10%",
                vencimento: "2026-02-27",
                vencimento_formatado: "27 de fevereiro de 2026",
            },

            parcelamento: {
                max_parcelas: 10,
                desconto: 0,
                primeira_parcela: "2026-03-31",
                ultima_parcela: "2026-12-29",
                obs: "10 parcelas mensais e consecutivas",
            },

            cota_unica_sem_desconto: {
                vencimento: "2026-12-29",
                vencimento_formatado: "29 de dezembro de 2026",
            },

            licenciamento: {
                vencimento: "2026-03-31",
                vencimento_formatado: "31 de março de 2026",
                orgao: "DETRAN-RR",
                obs: "Data única para todos os veículos",
            },

            fonte: "Portal do Governo de Roraima — Calendário IPVA 2026",
        },

        isencoes: [
            { tipo: "Veículos com mais de 20 anos de fabricação" },
            { tipo: "Veículos para PCD (com comprovação)" },
            { tipo: "Táxis" },
            { tipo: "Veículos oficiais" },
            { tipo: "Veículos elétricos/híbridos", status: "SUSPENSO — STF impediu isenção (Nov/2024)" },
        ],

        base_calculo: "Tabela FIPE (Fundação Instituto de Pesquisas Econômicas)",

        legislacao: [
            { norma: "Lei Complementar nº 59/1993, Arts. 95 a 132", assunto: "IPVA — fato gerador, base, alíquotas" },
            { norma: "Portal Governo RR", assunto: "Calendário e descontos IPVA 2026" },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  4. ITCMD — IMPOSTO TRANSMISSÃO CAUSA MORTIS E DOAÇÃO
    //     (denominado ITCD na legislação de Roraima)
    // ═══════════════════════════════════════════════════════════════

    itcmd: {
        nome_local: "ITCD — Imposto sobre Transmissão Causa Mortis e Doação",
        base_legal: "Lei Complementar nº 59/1993, Arts. 73 a 95",

        aliquotas: {
            causa_mortis: {
                tipo: "fixa",
                aliquota: 0.04,
                percentual: "4%",
                descricao: "Alíquota única para transmissão causa mortis (Art. 79)",
            },
            doacao: {
                tipo: "fixa",
                aliquota: 0.04,
                percentual: "4%",
                descricao: "Alíquota única para doação de quaisquer bens ou direitos (Art. 79)",
            },
        },

        progressividade: {
            implementada: false,
            obrigatoria_ec_132: true,
            observacao: "RR aplica alíquota fixa de 4%. EC 132/2023 e LC 227/2026 determinam progressividade obrigatória (2% a 8%). Estado NÃO editou nova lei — insegurança jurídica.",
            prazo_adequacao: "Pendente — lei estadual progressiva não aprovada (fev/2026)",
            teto_senado: 0.08,
        },

        fato_gerador: {
            causa_mortis: "Data do óbito ou morte presumida (Art. 73, §2º)",
            doacao: "Data da transmissão/escritura pública",
            incidencia: [
                "Propriedade ou domínio útil de bens imóveis",
                "Direitos reais sobre bens imóveis (inclusive hipoteca)",
                "Bens móveis, títulos, créditos e respectivos direitos",
            ],
            obs: "Tantos fatos geradores quantos forem os herdeiros/donatários (Art. 73, §1º)",
        },

        base_calculo: {
            regra_geral: "Valor venal dos bens ou direitos transmitidos (Art. 77)",
            imoveis_urbanos: "Valor IPTU/ITBI municipal (IN SEFAZ nº 1/2022)",
            imoveis_rurais: "Tabela por hectares e municípios (Anexo IN SEFAZ nº 1/2022)",
            nua_propriedade: "70% do valor do bem",
        },

        contribuinte: {
            causa_mortis: "Herdeiro ou legatário",
            doacao: "Donatário ou cessionário",
            responsavel_solidario: "Doador",
        },

        isencoes: [
            {
                tipo: "Valor inferior a 50 UFERR",
                valor_referencia_2026: "50 × R$ 540,57 = R$ 27.028,50",
                valor_referencia_2025: "50 × R$ 517,49 = R$ 25.874,50",
            },
            {
                tipo: "Propriedade rural até 60 hectares",
                descricao: "Trabalhador rural que não possua outro imóvel",
            },
            {
                tipo: "Ex-combatentes da 2ª Guerra / ex-guardas territoriais",
                descricao: "Residência própria (único imóvel, uma única vez)",
            },
            {
                tipo: "Programas habitacionais",
                descricao: "Baixa renda sem outro imóvel (federal/estadual/municipal)",
            },
            {
                tipo: "Imóveis oficiais",
                descricao: "Imunidade constitucional — patrimônio público",
            },
        ],

        prazo_pagamento: {
            causa_mortis: "Antes da homologação do formal de partilha",
            doacao: "Antes do registro/averbação da transmissão",
            multa_atraso: "0,33%/dia até 20%, mais juros SELIC",
        },

        competencia_territorial: {
            bens_imoveis: "Estado da situação do bem",
            bens_moveis: "Local do inventário/arrolamento ou domicílio do doador",
            exterior: "Domicílio do de cujus ou donatário (LC 227/2026)",
        },

        reforma_tributaria: {
            ec_132_2023: "Obriga progressividade por valor do quinhão/doação",
            lc_227_2026: "Normas gerais — confirma progressividade obrigatória",
            impacto_rr: "Nova lei estadual necessária (2% a 8%); se aprovada em 2026 → efeitos em 2027",
            tese_juridica: "Alíquota fixa questionável após LC 227/2026 — risco de judicialização",
        },

        legislacao: [
            { norma: "Lei Complementar nº 59/1993, Arts. 73 a 95", assunto: "ITCD — fato gerador, base, alíquota, isenções" },
            { norma: "Instrução Normativa SEFAZ nº 1/2022", assunto: "Base de cálculo (valor venal = IPTU/ITBI)" },
            { norma: "EC nº 132/2023", assunto: "Progressividade obrigatória" },
            { norma: "LC nº 227/2026", assunto: "Normas gerais ITCMD progressivo" },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  5. ISS — IMPOSTO SOBRE SERVIÇOS (Boa Vista — referência)
    //     Tabela COMPLETA por grupo de serviço (17 grupos)
    // ═══════════════════════════════════════════════════════════════

    iss: {
        municipio_referencia: "Boa Vista",
        base_legal: "LC nº 1.223/2009; LC nº 2/2011; LC nº 10/2018; Decreto nº 113-E/2025",

        aliquotas: {
            minima: 0.03,
            maxima: 0.05,
        },

        por_tipo_servico: {

            informatica: {
                aliquota: 0.05, ufm_ano: 260,
                servicos: [
                    "1.01 Análise e desenvolvimento de sistemas",
                    "1.02 Programação",
                    "1.03 Processamento, armazenamento ou hospedagem de dados",
                    "1.04 Elaboração de programas (inclusive jogos)",
                    "1.05 Licenciamento/cessão de software",
                    "1.06 Assessoria e consultoria em informática",
                    "1.07 Suporte técnico, instalação, configuração, manutenção",
                    "1.08 Planejamento e manutenção de páginas eletrônicas",
                    "1.09 Disponibilização de conteúdo digital por internet",
                ],
            },

            pesquisa_desenvolvimento: {
                aliquota: 0.045, ufm_ano: 260,
                servicos: ["2.01 Pesquisas e desenvolvimento de qualquer natureza"],
            },

            locacao_cessao: {
                aliquota: 0.05,
                servicos: [
                    "3.02 Cessão de direito de uso de marcas/propaganda",
                    "3.03 Exploração de salões, centros de convenções, estádios",
                    "3.04 Locação de ferrovia, rodovia, postes, cabos, dutos",
                    "3.05 Cessão de andaimes, palcos, coberturas",
                ],
            },

            saude: {
                aliquota_principal: 0.05,
                servicos_5pct: [
                    "4.01 Medicina e biomedicina", "4.02 Análises clínicas, patologia, radiologia",
                    "4.03 Hospitais, clínicas, laboratórios", "4.04 Instrumentação cirúrgica",
                    "4.05 Acupuntura", "4.13 Ortóptica", "4.14 Próteses sob encomenda",
                    "4.15 Psicanálise", "4.16 Psicologia",
                    "4.18 a 4.23 Inseminação, bancos sangue, planos saúde",
                ],
                servicos_4pct: [
                    "4.06 Enfermagem", "4.07 Farmacêuticos",
                    "4.08 Terapia ocupacional, fisioterapia, fonoaudiologia",
                    "4.09 Terapias diversas", "4.10 Nutrição", "4.11 Obstetrícia",
                    "4.12 Odontologia", "4.17 Casas de repouso, creches, asilos",
                ],
                aliquota_reduzida: 0.04,
            },

            veterinaria: {
                aliquota: 0.05,
                servicos: ["5.01 Medicina veterinária e zootecnia", "5.02 a 5.09 Hospitais, laboratórios, planos vet."],
            },

            cuidados_pessoais: {
                aliquota_principal: 0.05,
                servicos_5pct: [
                    "6.01 Barbearia, cabeleireiros, manicuros",
                    "6.02 Esteticistas, depilação", "6.03 Banhos, sauna, massagens",
                    "6.05 Centros de emagrecimento, spa", "6.06 Tatuagens, piercings",
                ],
                servicos_4pct: ["6.04 Ginástica, dança, esportes, natação, artes marciais"],
                aliquota_reduzida: 0.04,
            },

            construcao_civil: {
                aliquota_principal: 0.03,
                servicos_3pct: [
                    "7.02 Execução de construção civil", "7.03 Planos diretores, projetos",
                    "7.04 Demolição", "7.05 Reparação de edifícios, estradas, pontes",
                    "7.06 Colocação de tapetes, carpetes", "7.16 Florestamento, silvicultura",
                    "7.17 Escoramento, contenção", "7.19 Fiscalização de obras",
                ],
                servicos_4pct: [
                    "7.07 Raspagem de pisos", "7.08 Calafetação",
                    "7.12 Tratamento de efluentes", "7.13 Dedetização",
                    "7.20 Aerofotogrametria, cartografia, topografia",
                    "7.22 Nucleação de nuvens",
                ],
                servicos_4_5pct: ["7.21 Pesquisa e perfuração em petróleo e gás"],
                servicos_5pct: [
                    "7.01 Engenharia, agronomia, agrimensura, arquitetura, geologia",
                    "7.09 Varrição, coleta, incineração de lixo",
                    "7.10 Limpeza de vias, imóveis, piscinas",
                    "7.11 Decoração, jardinagem, poda", "7.18 Dragagem de rios, portos",
                ],
            },

            educacao: {
                aliquota: 0.035, ufm_ano: 130,
                servicos: ["8.01 Ensino regular (todos os níveis)", "8.02 Instrução, treinamento, orientação pedagógica"],
            },

            hospedagem_turismo: {
                aliquota: 0.045,
                servicos: ["9.01 Hospedagem (hotéis, flats, motéis, pensões)", "9.02 Turismo, viagens", "9.03 Guias de turismo"],
            },

            intermediacao: {
                aliquota: 0.05, ufm_ano: 130,
                servicos: ["10.01 a 10.10 Agenciamento, corretagem, representação comercial"],
            },

            vigilancia_seguranca: {
                aliquota: 0.04,
                servicos: ["11.01 Guarda e estacionamento", "11.02 Vigilância, segurança, monitoramento", "11.03 Escolta", "11.04 Armazenamento, depósito"],
            },

            diversoes_lazer: {
                aliquota_principal: 0.05,
                servicos_3pct: ["12.01 Espetáculos teatrais", "12.03 Espetáculos circenses"],
                servicos_4pct: ["12.02 Exibições cinematográficas", "12.08 Feiras, exposições, congressos"],
                servicos_5pct: ["12.04 a 12.17 Demais diversões e entretenimento"],
            },

            fonografia_fotografia: {
                aliquota: 0.05,
                servicos: ["13.02 Fonografia, gravação", "13.03 Fotografia, cinematografia", "13.04 Reprografia, digitalização", "13.05 Composição gráfica"],
            },

            bens_terceiros: {
                aliquota_principal: 0.05,
                servicos_5pct: ["14.01 Lubrificação, revisão, conserto", "14.02 Assistência técnica", "14.03 Recondicionamento de motores"],
                servicos_4pct: [
                    "14.04 Recauchutagem", "14.05 Restauração, pintura, lavagem",
                    "14.06 Instalação e montagem", "14.07 Molduras",
                    "14.08 Encadernação", "14.09 Alfaiataria e costura",
                    "14.10 Tinturaria e lavanderia", "14.11 Tapeçaria",
                    "14.12 Funilaria e lanternagem",
                ],
            },

            transporte: {
                aliquota: 0.05,
                servicos: ["15.01 a 15.08 Transporte de pessoas, cargas, táxi, valores, reboque"],
            },

            comunicacao: {
                aliquota: 0.05,
                servicos: ["16.01 a 16.05 Telefonia, satélite, rádio, TV, internet"],
            },

            profissionais: {
                aliquota: 0.05, ufm_ano: 260,
                servicos: [
                    "17.01 Advocacia", "17.02 Consultoria empresarial",
                    "17.03 Consultoria técnica", "17.04 Contabilidade",
                    "17.05 Auditoria", "17.06 Perícia", "17.07 Tradução",
                    "17.08 Interpretação", "17.09 Secretariado",
                    "17.10 Limpeza e conservação", "17.11 Vigilância e segurança",
                    "17.12 a 17.20 Administração (imóveis, empresas, condomínios, RH, logística)",
                ],
            },
        },

        isencoes: [
            "Profissionais autônomos recém-formados — isentos nos primeiros 2 anos",
            "Serviços educacionais — conforme legislação",
            "Serviços de saúde — conforme legislação",
        ],

        legislacao: [
            { norma: "Lei Complementar nº 1.223/2009", assunto: "Código Tributário Municipal de Boa Vista" },
            { norma: "Lei Complementar nº 2/2011", assunto: "Alterações CTM" },
            { norma: "Lei Complementar nº 10/2018", assunto: "Alterações CTM" },
            { norma: "Decreto nº 113-E/2025", assunto: "Regulamentação NFS-e" },
            { norma: "Lei Complementar nº 116/2003", assunto: "Federal — normas gerais ISS" },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  6. IPTU — IMPOSTO PREDIAL E TERRITORIAL URBANO (Boa Vista)
    // ═══════════════════════════════════════════════════════════════

    iptu: {
        municipio_referencia: "Boa Vista",

        residencial: { aliquota_min: 0.005, aliquota_max: 0.025, obs: "Progressiva por faixa de valor" },
        nao_edificado: { ate_4_imoveis: 0.02, a_partir_5_imoveis: null, obs: "Progressiva a partir do 5º imóvel" },
        imoveis_multiplos: { ate_4: 0.005, de_5_a_8: 0.02, a_partir_9: 0.025 },
        loteamentos_regulares: { aliquota: 0.0025, prazo: "3 anos do registro", apos_comercializacao: "Alíquota normal" },
        base_calculo: "Valor venal — Planta Genérica de Valores (PGV) municipal",

        calendario_2026: {
            cota_unica_ou_parcelado: "Até 6 parcelas",
            primeiro_vencimento: "2026-05-05",
            desconto_cota_unica: 0.10,
            desconto_obs: "10% de desconto no pagamento em cota única do IPTU e TCL",
            fonte: "Decreto nº 127-E/2025 — Calendário Tributário Boa Vista 2026",
        },

        isencoes: ["Imóveis de interesse público", "Imóveis históricos/culturais (possível redução)", "PCD"],

        legislacao: [
            { norma: "Lei Complementar nº 1.223/2009, Arts. 121 a 130", assunto: "IPTU" },
            { norma: "Decreto nº 127-E/2025", assunto: "Calendário tributário 2026 Boa Vista" },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  7. ITBI — IMPOSTO TRANSMISSÃO DE BENS IMÓVEIS (Boa Vista)
    // ═══════════════════════════════════════════════════════════════

    itbi: {
        municipio_referencia: "Boa Vista",
        aliquotas: { geral: 0.015, percentual: "1,5%" },
        base_calculo: "Valor de avaliação ou valor de mercado",
        reforma_tributaria: {
            lc_227_2026: "Base = valor de mercado declarado; fisco contesta via processo administrativo",
            stf: "ITBI devido apenas após transferência efetiva no cartório",
        },
        legislacao: [
            { norma: "Lei Complementar nº 1.223/2009, Arts. 141 a 150", assunto: "ITBI" },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  8. TAXAS ESTADUAIS E MUNICIPAIS
    // ═══════════════════════════════════════════════════════════════

    taxas: {

        // ── Taxas Estaduais com valores exatos em UFERR e R$ ──
        estaduais: {

            base_uferr_2026: 540.57,
            fonte: "Consulta de Taxas de Expediente — SEFAZ/RR",

            sefaz: [
                {
                    servico: "Alteração de Dados Cadastrais (FAC)",
                    valor_uferr: 0.086456,
                    valor_reais_2026: 46.74,
                },
                {
                    servico: "Inscrição ou Baixa no CGF/SEFAZ",
                    valor_uferr: 0.054035,
                    valor_reais_2026: 29.21,
                },
            ],

            saude: [
                {
                    servico: "Licença para Farmácia/Drogaria",
                    valor_uferr: 1.005051,
                    valor_reais_2026: 543.30,
                },
                {
                    servico: "Licença para Hospitais",
                    valor_uferr: 2.809820,
                    valor_reais_2026: 1518.90,
                },
            ],

            detran: [
                {
                    servico: "Primeira Habilitação (CNH)",
                    valor_uferr: 0.563152,
                    valor_reais_2026: 304.42,
                },
                {
                    servico: "Renovação da CNH",
                    valor_uferr: 0.338042,
                    valor_reais_2026: 182.74,
                },
                {
                    servico: "Licenciamento Anual",
                    valor_uferr: 0.269958,
                    valor_reais_2026: 145.93,
                },
            ],

            bombeiros: [
                {
                    servico: "Cadastramento Anual (Microempresa)",
                    valor_uferr: 0.337428,
                    valor_reais_2026: 182.40,
                },
            ],

            policia_civil: [
                {
                    servico: "Emissão de Carteira de Identidade",
                    valor_uferr: 10.000000,
                    valor_reais_2026: 5405.70,
                },
            ],

            legislacao_taxas: [
                { norma: "Lei Complementar nº 59/1993, Arts. 133 a 178", assunto: "Taxas estaduais — poder de polícia e serviços" },
                { norma: "Lei nº 1.138/2016", assunto: "Taxas DETRAN-RR" },
                { norma: "Portaria DETRAN-RR nº 16/2025", assunto: "Tabela taxas DETRAN 2025" },
            ],

            outras_taxas: {
                taxa_incendio: "Cobrada pelo Corpo de Bombeiros — variável por tipo/metragem",
                taxa_ambiental: "FEMARH — licenciamento ambiental, outorga de recursos hídricos",
                taxa_junta_comercial: "JUCERR — registro, alteração, baixa de empresas",
            },
        },

        // ── Taxas Municipais Boa Vista — Calendário 2026 ──
        municipais_boa_vista: {

            fonte: "Decreto nº 127-E/2025 — Calendário Tributário Boa Vista 2026",

            calendario_2026: [
                {
                    tributo: "IPTU + Taxa de Coleta de Lixo (TCL)",
                    parcelas: "Cota única ou até 6 parcelas",
                    primeiro_vencimento: "2026-05-05",
                    desconto_cota_unica: 0.10,
                },
                {
                    tributo: "TLEA — Taxa de Licença para Exploração de Atividades",
                    parcelas: "Até 3 parcelas",
                    primeiro_vencimento: "2026-02-27",
                },
                {
                    tributo: "ISS — Autônomos",
                    parcelas: "Até 2 parcelas",
                    primeiro_vencimento: "2026-02-27",
                },
                {
                    tributo: "TAC — Taxa de Atualização Cadastral",
                    parcelas: "De 2 a 6 parcelas (por área)",
                    primeiro_vencimento: "2026-02-27",
                },
            ],

            obs: "Valores exatos em R$ das taxas municipais não localizados de forma consolidada nos portais públicos. CTM (LC 1.223/2009) define fórmulas — tabelas 2026 não publicadas online.",
        },

        legislacao: [
            { norma: "Lei Complementar nº 59/1993, Arts. 133 a 178", assunto: "Taxas estaduais" },
            { norma: "Lei nº 1.138/2016", assunto: "Taxas DETRAN-RR" },
            { norma: "Decreto nº 127-E/2025", assunto: "Calendário tributário Boa Vista 2026" },
            { norma: "Lei Complementar nº 1.223/2009", assunto: "Taxas municipais Boa Vista" },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  9. IMPOSTOS FEDERAIS (aplicáveis em RR)
    // ═══════════════════════════════════════════════════════════════

    federal: {

        irpj: {
            lucro_real: {
                aliquota_base: 0.15,
                adicional: { aliquota: 0.10, limite_mensal: 20000, limite_anual: 240000 },
                aliquota_efetiva_maxima: 0.25,
            },
            lucro_presumido: {
                aliquota_base: 0.15,
                presuncao_lucro: {
                    comercio: 0.08, servicos_geral: 0.32, transporte: 0.08,
                    transporte_passageiros: 0.16, servicos_saude: 0.08,
                    revenda_combustiveis: 0.016, min: 0.016, max: 0.32,
                },
                adicional: { aliquota: 0.10, limite_mensal: 20000 },
                alteracao_2026: "LC nº 224/2025 — presunção +10% para receita acima de R$ 5M",
            },
            incentivos_regionais: {
                sudam: { reducao: 0.75, aliquota_efetiva: 0.075, descricao: "75% redução IRPJ — setores prioritários SUDAM" },
            },
        },

        csll: { aliquota_geral: 0.09, instituicoes_financeiras: 0.15, seguradoras: 0.15 },

        pis: { cumulativo: 0.0076, nao_cumulativo: 0.0165, importacao: 0.0165, cesta_basica: 0 },
        cofins: { cumulativo: 0.03, nao_cumulativo: 0.076, importacao: 0.076, cesta_basica: 0 },

        ipi: {
            referencia: "Tabela TIPI vigente", faixa_min: 0, faixa_max: 0.35,
            isencoes_alc: true, obs: "Suspensão de IPI em operações internas na ALC",
        },

        iof: {
            credito_pf: { min: 0.0038, max: 0.0338 },
            credito_pj: { min: 0.0038, max: 0.0163 },
            cambio: 0.0038, seguros: { min: 0, max: 0.25 }, titulos: { min: 0, max: 0.25 },
        },

        imposto_importacao: {
            referencia: "Tarifa Externa Comum (TEC) — MERCOSUL",
            beneficios_alc: "Redução/Isenção de II na ALC Boa Vista e Bonfim",
        },

        imposto_exportacao: { aliquota_geral: 0 },

        itr: { faixa_min: 0.0003, faixa_max: 0.20, isencoes: ["Pequena propriedade familiar"] },

        inss: {
            patronal: { min: 0.20, max: 0.288 },
            rat_sat: { min: 0.005, max: 0.03 },
            terceiros_sistema_s: { min: 0.025, max: 0.033 },
            empregado: { min: 0.08, max: 0.11 },
        },

        fgts: { aliquota: 0.08, multa_rescisoria: 0.40 },

        irpf: {
            tabela_mensal_2025: [
                { ate: 2112.00, aliquota: 0, deducao: 0 },
                { ate: 2826.65, aliquota: 0.075, deducao: 158.40 },
                { ate: 3751.05, aliquota: 0.15, deducao: 423.15 },
                { ate: 4664.68, aliquota: 0.225, deducao: 844.80 },
                { ate: Infinity, aliquota: 0.275, deducao: 1278.64 },
            ],
        },
    },


    // ═══════════════════════════════════════════════════════════════
    //  10. SIMPLES NACIONAL (aplicável em RR)
    // ═══════════════════════════════════════════════════════════════

    simples_nacional: {

        sublimite_estadual: 3600000,
        adota_sublimite: true,
        mei: { limite_anual: 81000 },
        limites: { microempresa: 360000, epp: 4800000 },

        anexos: {
            anexo_I: {
                nome: "Comércio",
                faixas: [
                    { faixa: 1, limite: 180000, aliquota: 0.04, deducao: 0 },
                    { faixa: 2, limite: 360000, aliquota: 0.073, deducao: 5940 },
                    { faixa: 3, limite: 540000, aliquota: 0.095, deducao: 13860 },
                    { faixa: 4, limite: 720000, aliquota: 0.105, deducao: 19260 },
                    { faixa: 5, limite: 900000, aliquota: 0.1161, deducao: 28530 },
                ],
            },
            anexo_II: {
                nome: "Indústria",
                faixas: [
                    { faixa: 1, limite: 180000, aliquota: 0.045, deducao: 0 },
                    { faixa: 2, limite: 360000, aliquota: 0.078, deducao: 5940 },
                    { faixa: 3, limite: 540000, aliquota: 0.10, deducao: 13860 },
                    { faixa: 4, limite: 720000, aliquota: 0.112, deducao: 22500 },
                    { faixa: 5, limite: 900000, aliquota: 0.135, deducao: 39780 },
                ],
            },
            anexo_III: {
                nome: "Serviços",
                faixas: [
                    { faixa: 1, limite: 180000, aliquota: 0.06, deducao: 0 },
                    { faixa: 2, limite: 360000, aliquota: 0.112, deducao: 9360 },
                    { faixa: 3, limite: 540000, aliquota: 0.135, deducao: 17640 },
                    { faixa: 4, limite: 720000, aliquota: 0.16, deducao: 35640 },
                    { faixa: 5, limite: 900000, aliquota: 0.1742, deducao: 44940 },
                ],
            },
            anexo_IV: {
                nome: "Serviços (construção, vigilância, advocacia)",
                faixas: [
                    { faixa: 1, limite: 180000, aliquota: 0.045, deducao: 0 },
                    { faixa: 2, limite: 360000, aliquota: 0.0903, deducao: 8145 },
                    { faixa: 3, limite: 540000, aliquota: 0.1084, deducao: 14652 },
                    { faixa: 4, limite: 720000, aliquota: 0.1237, deducao: 22896 },
                    { faixa: 5, limite: 900000, aliquota: 0.1385, deducao: 33516 },
                ],
                obs: "CPP NÃO incluída — recolher INSS patronal à parte (20% + RAT + Terceiros)",
            },
            anexo_V: {
                nome: "Serviços (TI, engenharia, auditoria, jornalismo)",
                faixas: [
                    { faixa: 1, limite: 180000, aliquota: 0.155, deducao: 0 },
                    { faixa: 2, limite: 360000, aliquota: 0.1842, deducao: 5256 },
                    { faixa: 3, limite: 540000, aliquota: 0.1984, deducao: 10368 },
                    { faixa: 4, limite: 720000, aliquota: 0.2094, deducao: 16308 },
                    { faixa: 5, limite: 900000, aliquota: 0.2245, deducao: 25380 },
                ],
                obs: "Fator R ≥ 28% → migra para Anexo III (alíquotas menores)",
            },
        },
    },


    // ═══════════════════════════════════════════════════════════════
    //  11. INCENTIVOS FISCAIS E BENEFÍCIOS REGIONAIS
    // ═══════════════════════════════════════════════════════════════

    incentivos: {

        sudam: {
            ativo: true,
            reducao_irpj: { percentual: 0.75, aliquota_efetiva: 0.075, prazo_pleitos: "2028-12-31", setores: "Decreto nº 4.212/2002" },
            isencao_inclusao_digital: "Isenção total de IRPJ para atividades de inclusão digital",
            reinvestimento_30: "Reinvestimento obrigatório de 30% do IRPJ em projetos regionais",
        },

        alc: {
            nome: "Área de Livre Comércio de Boa Vista e Bonfim (ALCBV)",
            municipios: ["Boa Vista", "Bonfim"],
            beneficios: {
                ipi: "Suspensão em operações internas",
                icms: "Redução/Isenção conforme SUFRAMA",
                pis: "0,65% (redução ~60%)",
                cofins: "3% (redução ~60%)",
                ii: "Redução/Isenção para determinados produtos",
            },
            vigencia: "Permanente",
            legislacao: ["Lei nº 152/2025", "Decreto SUFRAMA nº 61.244/1967"],
        },

        suframa: { pis_diferenciado: 0.0065, cofins_diferenciado: 0.03 },

        programas_estaduais: {
            refis_rr: {
                descricao: "Programa de Recuperação de Créditos Tributários",
                legislacao: "Lei nº 1.446/2020; Decreto nº 29.821/2021; Decreto nº 35.070/2023",
                obs: "Periódico — verificar vigência junto à SEFAZ/RR",
            },
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
            ibs: { nome: "Imposto sobre Bens e Serviços", obs: "Substituirá ICMS gradualmente" },
            cbs: { nome: "Contribuição sobre Bens e Serviços", obs: "Substituirá PIS/COFINS" },
            is: { nome: "Imposto Seletivo", obs: "Produtos prejudiciais à saúde/meio ambiente" },
        },
        lc_224_2025: {
            nome: "Alterações IRPJ/CSLL",
            presuncao_majorada: "Presunção +10% para receitas acima de R$ 5M (Lucro Presumido)",
        },
        lc_227_2026: {
            nome: "Comitê Gestor do IBS + Normas gerais ITCMD",
            itcmd: "Confirma progressividade obrigatória; competência territorial; bens exterior",
            comite_gestor: "CG-IBS para coordenação da arrecadação entre estados e municípios",
            impacto_rr: "Adequação ITCD urgente — alíquota fixa pode ser contestada judicialmente",
        },
        transicao: { periodo: "2026-2033", obs: "Coexistência gradual ICMS/ISS/PIS/COFINS com IBS/CBS" },
    },


    // ═══════════════════════════════════════════════════════════════
    //  13. DADOS DE COBERTURA
    // ═══════════════════════════════════════════════════════════════

    cobertura: {
        versao: "3.0",
        data_atualizacao: "2026-02-10",
        localizados: [
            "UFERR 2026: R$ 540,57 (Portaria SEFAZ/DITRI/DEPAR nº 1224/2025)",
            "UFERR histórico: 2022 a 2025",
            "UFM Boa Vista 2025: R$ 145,37",
            "ICMS modal 20% + cesta básica 7% (14 itens detalhados)",
            "ICMS reduções de base (Anexo I RICMS/RR): carnes, insumos, máquinas, aeronaves, biodiesel",
            "ICMS interestaduais, importação, DIFAL, monofásico combustíveis, crédito presumido energia",
            "IPVA alíquotas completas + calendário 2026 (10% desconto cota única até 27/02, parcelamento 10x)",
            "ITCMD/ITCD 4% fixo causa mortis e doação, isenções, base de cálculo, reforma tributária",
            "ISS Boa Vista — tabela completa 17 grupos (3% a 5%)",
            "IPTU Boa Vista (0,5% a 2,5%, progressividade, loteamento 0,25%) + calendário 2026",
            "ITBI Boa Vista 1,5%",
            "Taxas estaduais com VALORES EXATOS em UFERR e R$ 2026 (SEFAZ, Saúde, DETRAN, Bombeiros, Polícia Civil)",
            "Taxas municipais Boa Vista — calendário 2026 (TLEA, TAC, ISS autônomos)",
            "Federal completo: IRPJ, CSLL, PIS, COFINS, IOF, ITR, INSS, FGTS, IRPF tabela 2025",
            "Simples Nacional — 5 Anexos com faixas",
            "SUDAM 75% + ALC (IPI, ICMS, PIS, COFINS, II)",
            "Reforma Tributária (EC 132, LC 214, LC 224, LC 227)",
        ],
        nao_localizados: [
            "ICMS — tabela Anexo I do RICMS/RR completa por NCM (apenas categorias principais obtidas)",
            "ICMS — vigência atualizada das reduções de base (máquinas, aeronaves, biodiesel — prazos vencidos, possível prorrogação)",
            "Taxas municipais Boa Vista — valores exatos em R$ (CTM define fórmulas, tabelas 2026 não publicadas online)",
            "UFM Boa Vista 2026 — não publicada na data desta atualização",
            "Simples Nacional — 6ª faixa de cada anexo (acima de R$ 900K até R$ 4,8M) e distribuição de tributos por faixa",
        ],
        contatos_para_completar: [
            { orgao: "SEFAZ/RR", url: "https://www.sefaz.rr.gov.br/", tel: "(95) 2121-2500" },
            { orgao: "DETRAN/RR", url: "https://www.detran.rr.gov.br/" },
            { orgao: "Prefeitura de Boa Vista", url: "https://boavista.rr.gov.br/" },
            { orgao: "FEMARH/RR", url: "https://www.femarh.rr.gov.br/" },
            { orgao: "JUCERR", url: "https://www.jucerr.rr.gov.br/" },
            { orgao: "Receita Federal", url: "https://www.gov.br/receitafederal", tel: "146" },
        ],
    },
};


// ═══════════════════════════════════════════════════════════════════════════
//  14. FUNÇÕES UTILITÁRIAS — RORAIMA
// ═══════════════════════════════════════════════════════════════════════════

/** Retorna alíquota de ISS por grupo de serviço em Boa Vista */
function getISSRoraima(tipo) {
    const s = RORAIMA_TRIBUTARIO.iss.por_tipo_servico[tipo];
    if (!s) return 0.05;
    return s.aliquota || s.aliquota_principal || 0.05;
}

/** Retorna alíquota IPVA por tipo de veículo */
function getIPVARoraima(tipo) {
    const map = {
        auto: RORAIMA_TRIBUTARIO.ipva.aliquotas.automoveis_passeio,
        caminhonete: RORAIMA_TRIBUTARIO.ipva.aliquotas.caminhonetes_utilitarios,
        moto: RORAIMA_TRIBUTARIO.ipva.aliquotas.motocicletas,
        motoneta: RORAIMA_TRIBUTARIO.ipva.aliquotas.motonetas_triciclos,
        quadriciclo: RORAIMA_TRIBUTARIO.ipva.aliquotas.quadriciclos,
        caminhao: RORAIMA_TRIBUTARIO.ipva.aliquotas.caminhoes,
        onibus: RORAIMA_TRIBUTARIO.ipva.aliquotas.onibus_micro,
        embarcacao: RORAIMA_TRIBUTARIO.ipva.aliquotas.embarcacoes,
        aeronave: RORAIMA_TRIBUTARIO.ipva.aliquotas.aeronaves,
        locadora: RORAIMA_TRIBUTARIO.ipva.aliquotas.veiculos_locadoras,
    };
    return map[tipo] ?? 0.025;
}

/** Retorna alíquota ITCMD (fixa 4%) */
function getITCMDRoraima(tipo) {
    if (tipo === "causa_mortis") return RORAIMA_TRIBUTARIO.itcmd.aliquotas.causa_mortis.aliquota;
    if (tipo === "doacao") return RORAIMA_TRIBUTARIO.itcmd.aliquotas.doacao.aliquota;
    return 0.04;
}

/** Verifica isenção de ITCMD (abaixo de 50 UFERR) */
function isIsentoITCMDRoraima(valor, uferr = 540.57) {
    return valor < (50 * uferr);
}

/** Verifica se município está na ALC */
function isALCRoraima(municipio) {
    return RORAIMA_TRIBUTARIO.dados_gerais.alc_municipios
        .map(m => m.toLowerCase()).includes(municipio?.trim().toLowerCase());
}

/** Retorna percentual de redução IRPJ via SUDAM */
function getReducaoSUDAMRoraima() {
    return RORAIMA_TRIBUTARIO.incentivos.sudam.ativo ? 0.75 : 0;
}

/** ICMS efetivo (padrão + FECOP) */
function getICMSEfetivoRoraima() {
    return RORAIMA_TRIBUTARIO.icms.aliquota_padrao + RORAIMA_TRIBUTARIO.icms.fecop.adicional;
}

/** Valor da UFERR por ano */
function getUFERR(ano = 2026) {
    const v = { 2022: 445.14, 2023: 471.40, 2024: 493.46, 2025: 517.49, 2026: 540.57 };
    return v[ano] ?? v[2026];
}

/** Calcula valor de taxa estadual em R$ a partir de UFERR */
function calcTaxaUFERR(valor_uferr, ano = 2026) {
    return +(valor_uferr * getUFERR(ano)).toFixed(2);
}

/** Calcula IPVA com desconto de cota única */
function calcIPVAComDesconto(valor_veiculo_fipe, tipo = "auto") {
    const aliq = getIPVARoraima(tipo);
    const ipva_cheio = valor_veiculo_fipe * aliq;
    const desconto = RORAIMA_TRIBUTARIO.ipva.calendario_2026.cota_unica_com_desconto.desconto;
    return {
        ipva_cheio: +ipva_cheio.toFixed(2),
        desconto_percentual: desconto,
        ipva_com_desconto: +(ipva_cheio * (1 - desconto)).toFixed(2),
        vencimento_desconto: RORAIMA_TRIBUTARIO.ipva.calendario_2026.cota_unica_com_desconto.vencimento,
        parcela_10x: +(ipva_cheio / 10).toFixed(2),
    };
}

/** Resumo rápido dos tributos */
function resumoTributarioRoraima() {
    return {
        estado: "Roraima (RR)",
        icms_padrao: "20%",
        icms_cesta_basica: "7% (14 itens)",
        fecop: "Não existe",
        ipva_auto: "2,5%", ipva_moto: "2%", ipva_caminhao: "1%", ipva_locadora: "0,7%",
        ipva_desconto_cota_unica: "10% até 27/02/2026",
        itcmd: "4% fixa (pendente adequação progressiva)",
        itcmd_isencao: "Até 50 UFERR (R$ " + (50 * 540.57).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) + ")",
        iss_faixa: "3% a 5%",
        iptu_residencial: "0,5% a 2,5%",
        itbi: "1,5%",
        uferr_2026: "R$ 540,57",
        uferr_2025: "R$ 517,49",
        ufm_2025: "R$ 145,37",
        sudam: "75% redução IRPJ",
        alc: "ALC Boa Vista e Bonfim — IPI, ICMS, PIS, COFINS, II",
        sublimite_simples: "R$ 3.600.000",
    };
}


// ═══════════════════════════════════════════════════════════════════════════
//  15. EXPORTAÇÃO (Padrão Grupo 2)
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        ...RORAIMA_TRIBUTARIO,
        utils: {
            getISS: getISSRoraima,
            getIPVA: getIPVARoraima,
            getITCMD: getITCMDRoraima,
            isIsentoITCMD: isIsentoITCMDRoraima,
            isALC: isALCRoraima,
            getReducaoSUDAM: getReducaoSUDAMRoraima,
            getICMSEfetivo: getICMSEfetivoRoraima,
            getUFERR: getUFERR,
            calcTaxaUFERR: calcTaxaUFERR,
            calcIPVAComDesconto: calcIPVAComDesconto,
            resumoTributario: resumoTributarioRoraima,
        },
    };
}

if (typeof window !== "undefined") {
    window.RORAIMA_TRIBUTARIO = RORAIMA_TRIBUTARIO;
    window.RoraimaTributario = {
        getISS: getISSRoraima,
        getIPVA: getIPVARoraima,
        getITCMD: getITCMDRoraima,
        isIsentoITCMD: isIsentoITCMDRoraima,
        isALC: isALCRoraima,
        getReducaoSUDAM: getReducaoSUDAMRoraima,
        getICMSEfetivo: getICMSEfetivoRoraima,
        getUFERR: getUFERR,
        calcTaxaUFERR: calcTaxaUFERR,
        calcIPVAComDesconto: calcIPVAComDesconto,
        resumo: resumoTributarioRoraima,
    };
}
