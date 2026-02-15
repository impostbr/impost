/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RIO_DE_JANEIRO.JS — Base de Dados Tributária Completa do Estado do Rio de Janeiro
 * ═══════════════════════════════════════════════════════════════════════════
 * Versão 3.0 — Padronizado conforme template roraima.js v3.0
 * Dados verificados via fontes oficiais (SEFAZ-RJ, RFB, Prefeitura do Rio de Janeiro)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ESTRUTURA PADRÃO (15 seções obrigatórias):
 *   01. dados_gerais        — Identificação, links, legislação base
 *   02. icms                — Alíquotas, cesta básica, reduções, ST, DIFAL
 *   03. ipva                — Alíquotas, calendário, descontos, isenções
 *   04. itd                 — Alíquotas, base de cálculo, isenções, reforma (ITD no RJ)
 *   05. iss                 — Tabela por grupo de serviço (município-referência)
 *   06. iptu                — Alíquotas, progressividade, isenções
 *   07. itbi                — Alíquota, base de cálculo
 *   08. taxas               — Estaduais e municipais
 *   09. federal             — IRPJ, CSLL, PIS, COFINS, IOF, ITR, INSS, FGTS, IRPF
 *   10. simples_nacional    — Anexos, faixas, sublimite, MEI
 *   11. incentivos          — SUDAM/SUDENE, ZFM/ALC, programas estaduais
 *   12. reforma_tributaria  — EC 132, LC 214, LC 227, transição IBS/CBS
 *   13. cobertura           — Versão, itens localizados/pendentes, contatos
 *   14. funções utilitárias — Helpers de cálculo
 *   15. exportação          — module.exports + window (padrão Grupo 2)
 *
 * FONTES CONSULTADAS:
 *   • SEFAZ-RJ — portal.fazenda.rj.gov.br
 *   • Lei nº 2.657/1996 (ICMS-RJ)
 *   • Lei Complementar nº 210/2023 (FECP)
 *   • Lei nº 10.253/2023 (Alíquota padrão ICMS 20%)
 *   • Lei nº 7.174/2015 (ITD)
 *   • Lei nº 7.786/2017 (Faixas ITD progressivas)
 *   • Lei nº 691/1984 (CTM-RJ)
 *   • Receita Federal — www.gov.br/receitafederal
 *
 * ATUALIZAÇÃO: 10/02/2026
 * ═══════════════════════════════════════════════════════════════════════════
 */

const RIO_DE_JANEIRO_TRIBUTARIO = {

    // ═══════════════════════════════════════════════════════════════
    //  1. DADOS GERAIS
    // ═══════════════════════════════════════════════════════════════

    dados_gerais: {
        nome: "Rio de Janeiro",
        sigla: "RJ",
        codigo_ibge: 33,
        capital: "Rio de Janeiro",
        codigo_ibge_capital: 3304557,
        regiao: "Sudeste",
        zona_franca: false,
        alc: false,
        sudam: false,
        sudene: false,
        sefaz_url: "https://portal.fazenda.rj.gov.br/",
        sefaz_legislacao: "https://portal.fazenda.rj.gov.br/legislacao/",
        prefeitura_capital_url: "https://prefeitura.rio/",
        prefeitura_fazenda_url: "https://carioca.rio/servicos/",
        destaque: "Segundo maior arrecadador de tributos do Brasil. Capital turística e financeira. FECP de 2% sobre ICMS eleva alíquota efetiva para 22%.",
        municipios_principais: [
            { nome: "Rio de Janeiro", codigo_ibge: 3304557, capital: true },
            { nome: "Niterói", codigo_ibge: 3303302, capital: false },
            { nome: "São Gonçalo", codigo_ibge: 3304904, capital: false },
            { nome: "Duque de Caxias", codigo_ibge: 3301702, capital: false },
            { nome: "Nova Iguaçu", codigo_ibge: 3303500, capital: false },
            { nome: "Petrópolis", codigo_ibge: 3303906, capital: false }
        ],
        principais_leis_base: [
            { lei: "Lei Complementar nº 87/1996", descricao: "Lei Kandir — base do ICMS" },
            { lei: "Lei nº 2.657/1996", descricao: "ICMS do estado do Rio de Janeiro" },
            { lei: "Lei Complementar nº 210/2023", descricao: "FECP — Fundo de Combate à Pobreza" },
            { lei: "Lei nº 10.253/2023", descricao: "Alteração da alíquota padrão do ICMS para 20%" },
            { lei: "Lei nº 7.174/2015", descricao: "ITD — Imposto sobre Transmissão Causa Mortis e Doação" },
            { lei: "Lei nº 7.786/2017", descricao: "Alteração das faixas do ITD (progressividade 4%-8%)" },
            { lei: "Lei nº 691/1984", descricao: "Código Tributário Municipal do Rio de Janeiro" }
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    //  2. ICMS — IMPOSTO SOBRE CIRCULAÇÃO DE MERCADORIAS E SERVIÇOS
    // ═══════════════════════════════════════════════════════════════

    icms: {
        aliquota_padrao: 0.20,
        fecop: {
            ativo: true,
            adicional: 0.02,
            obs: "FECP — Fundo Estadual de Combate à Pobreza e às Desigualdades Sociais. Incide sobre a base de cálculo do ICMS. LC 210/2023."
        },
        aliquota_efetiva_padrao: 0.22,

        aliquotas_diferenciadas: {
            cesta_basica: {
                aliquota: 0.07,
                obs: "Produtos da cesta básica — arroz, feijão, etc. Decreto 32.161/2002"
            },
            arroz_branco: {
                aliquota: 0,
                obs: "Arroz branco e parboilizado — isento. Lei 4.892/2006"
            },
            feijao_preto: {
                aliquota: 0,
                obs: "Feijão preto — isento. Lei 4.892/2006"
            },
            produtos_agropecuarios: {
                aliquota: 0.07,
                obs: "Operações internas com produtos primários agropecuários"
            },
            energia_eletrica: {
                aliquota: 0.20,
                obs: "20% + 2% FECP = 22%. Inclui residencial e industrial."
            },
            telecomunicacoes: {
                aliquota: 0.20,
                obs: "20% + 2% FECP = 22%"
            },
            combustiveis: {
                obs: "Regime monofásico — valores ad rem por litro. Convênio ICMS 15/2023"
            },
            bebidas_alcoolicas: {
                aliquota: 0.20,
                obs: "20% + 2% FECP = 22%"
            },
            cigarros: {
                aliquota: 0.20,
                obs: "20% + 2% FECP = 22%"
            },
            veiculos_novos: {
                aliquota: 0.20,
                obs: "20% + 2% FECP = 22%"
            },
            medicamentos: {
                aliquota: 0.20,
                obs: "20% + 2% FECP = 22% (genéricos e de marca)"
            },
            informatica: {
                aliquota: 0.20,
                obs: "20% + 2% FECP = 22%"
            }
        },

        aliquotas_interestaduais: {
            norte_nordeste_co_es: 0.07,
            sul_sudeste_exceto_es: 0.12,
            importados: 0.04,
            obs: "CF art. 155 §2º IV; Resolução Senado 13/2012 (importados)"
        },

        difal: {
            obs: "Diferencial de Alíquotas — operações interestaduais para consumidor final não contribuinte",
            formula: "(aliquota_interna_destino - aliquota_interestadual) × valor_operacao",
            partilha: "100% destino desde 2019. LC 190/2022"
        },

        substituicao_tributaria: {
            aplicavel: true,
            produtos_principais: [
                "Combustíveis (gasolina, diesel, etanol, GNV)",
                "Bebidas (cervejas, refrigerantes, alcoólicas)",
                "Cigarros e fumos",
                "Medicamentos",
                "Produtos de higiene pessoal",
                "Energia elétrica",
                "Telecomunicações",
                "Pneus",
                "Óleos lubrificantes",
                "Produtos de informática"
            ],
            obs: "MVA variável por produto. Resolução SEFAZ 720/14, Anexo I Livro II RICMS/00."
        },

        icms_monofasico: {
            obs: "Regime monofásico para combustíveis. Convênio ICMS 15/2023",
            gasolina_ad_rem: 1.57,
            diesel_ad_rem: 1.17
        },

        legislacao: [
            { norma: "Lei nº 2.657/1996", assunto: "ICMS do estado do Rio de Janeiro" },
            { norma: "Lei Complementar nº 210/2023", assunto: "FECP — adicional de 2%" },
            { norma: "Lei nº 10.253/2023", assunto: "Alíquota padrão de 20%" },
            { norma: "Resolução SEFAZ nº 720/14", assunto: "ST — Substituição Tributária" },
            { norma: "Convênio ICMS 15/2023", assunto: "Regime monofásico combustíveis" },
            { norma: "Convênio ICMS 236/21", assunto: "DIFAL" }
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    //  3. IPVA — IMPOSTO SOBRE PROPRIEDADE DE VEÍCULOS AUTOMOTORES
    // ═══════════════════════════════════════════════════════════════

    ipva: {
        aliquotas: {
            automovel: { aliquota: 0.04, descricao: "Automóveis e utilitários (gasolina/flex/diesel)" },
            motocicleta: { aliquota: 0.02, descricao: "Motocicletas e similares" },
            caminhao: { aliquota: 0.02, descricao: "Caminhões" },
            onibus: { aliquota: 0.02, descricao: "Ônibus e micro-ônibus" },
            locadora: { aliquota: 0.005, descricao: "Veículos de locadoras (até 3 anos)" },
            eletrico: { aliquota: 0.005, descricao: "Veículos 100% elétricos" },
            hibrido_gnv: { aliquota: 0.015, descricao: "Veículos híbridos e GNV" },
            taxi_pj: { aliquota: 0.01, descricao: "Táxis de empresas (PJ)" },
            embarcacao: { aliquota: 0.02, descricao: "Embarcações" },
            aeronave: { aliquota: 0.02, descricao: "Aeronaves" }
        },

        isencoes: [
            { tipo: "Veículos com mais de 20 anos", obs: "Isenção total" },
            { tipo: "PCD (Pessoa com Deficiência)", obs: "Isenção total — Lei 2.657/96" },
            { tipo: "Táxis (pessoa física)", obs: "Isenção total" },
            { tipo: "Veículos oficiais", obs: "Governo — isenção total" },
            { tipo: "Veículos de segurança pública", obs: "Isenção total" }
        ],

        desconto_antecipacao: 0.03,
        parcelamento_maximo: 3,
        base_calculo: "FIPE",

        calendario_vencimento: {
            "1": "janeiro", "2": "fevereiro", "3": "março", "4": "abril", "5": "maio",
            "6": "junho", "7": "julho", "8": "agosto", "9": "setembro", "0": "outubro"
        },

        legislacao: [
            { norma: "Lei nº 2.657/1996", assunto: "IPVA do estado do Rio de Janeiro" },
            { norma: "Decreto nº 45.123/2014", assunto: "Isenções IPVA" }
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    //  4. ITD — IMPOSTO SOBRE TRANSMISSÃO CAUSA MORTIS E DOAÇÃO
    //     (denominação oficial no RJ: ITD, não ITCMD)
    // ═══════════════════════════════════════════════════════════════

    itd: {
        denominacao_oficial: "ITD — Imposto sobre Transmissão Causa Mortis e Doação",
        progressivo: true,
        obs: "RJ já adota progressividade desde 2018 (Lei 7.786/2017). Faixas em UFIR-RJ.",

        ufir_rj_2025: 4.7508,
        obs_ufir: "Valor da UFIR-RJ para 2025. Atualizada anualmente pela SEFAZ-RJ.",

        faixas: [
            { limite_ufir: 70000, aliquota: 0.04, valor_aprox_2025: 332556, obs: "Até 70.000 UFIR-RJ (≈ R$ 332.556)" },
            { limite_ufir: 100000, aliquota: 0.045, valor_aprox_2025: 475080, obs: "70.001 a 100.000 UFIR-RJ (≈ R$ 475.080)" },
            { limite_ufir: 200000, aliquota: 0.05, valor_aprox_2025: 950160, obs: "100.001 a 200.000 UFIR-RJ (≈ R$ 950.160)" },
            { limite_ufir: 300000, aliquota: 0.06, valor_aprox_2025: 1425240, obs: "200.001 a 300.000 UFIR-RJ (≈ R$ 1.425.240)" },
            { limite_ufir: 400000, aliquota: 0.07, valor_aprox_2025: 1900320, obs: "300.001 a 400.000 UFIR-RJ (≈ R$ 1.900.320)" },
            { limite_ufir: Infinity, aliquota: 0.08, valor_aprox_2025: null, obs: "Acima de 400.000 UFIR-RJ (≈ R$ 1.900.320+)" }
        ],

        isencoes: [
            { tipo: "Monte-mor pequeno (causa mortis)", limite_ufir: 13000, valor_aprox_2025: 61760, obs: "Transmissão causa mortis com monte-mor até 13.000 UFIR-RJ" },
            { tipo: "Doação em dinheiro", limite_ufir: 11250, valor_aprox_2025: 53447, obs: "Doação em dinheiro até 11.250 UFIR-RJ/ano/donatário" },
            { tipo: "Imóveis residenciais (causa mortis)", limite_ufir: 60000, valor_aprox_2025: 285048, obs: "Imóveis residenciais causa mortis PF até 60.000 UFIR-RJ" },
            { tipo: "Regularização fundiária", obs: "Doação de imóvel em comunidade de baixa renda para regularização pelo Poder Público" },
            { tipo: "Programa habitacional", obs: "Doação de imóvel para programa habitacional de baixa renda" }
        ],

        prazo_pagamento_dias: 180,
        obs_prazo: "RJ concede até 180 dias para pagamento do ITD, diferente de SP (30 dias).",
        parcelamento_maximo_meses: 48,
        obs_parcelamento: "Parcelamento em até 48 meses (ampliável para 60 por decreto). Correção anual pela UFIR-RJ.",

        legislacao: [
            { norma: "Lei nº 7.174/2015", assunto: "ITD — Lei base atual" },
            { norma: "Lei nº 7.786/2017", assunto: "Alteração das faixas para 6 faixas progressivas (4% a 8%)" },
            { norma: "Decreto nº 49.952/2025", assunto: "Regulamenta reconhecimento de isenções ITD" }
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    //  5. ISS — IMPOSTO SOBRE SERVIÇOS (Rio de Janeiro capital)
    // ═══════════════════════════════════════════════════════════════

    iss: {
        municipio_referencia: "Rio de Janeiro",
        aliquota_minima: 0.02,
        aliquota_maxima: 0.05,
        aliquota_geral: 0.05,
        obs: "A maioria dos serviços paga 5%. Alíquotas reduzidas de 2% e 3% para serviços específicos. Art. 33 da Lei 691/1984.",

        por_tipo_servico: {
            // =====================================================
            // === ALÍQUOTA 2,0% ===
            // =====================================================
            // --- Saúde com internação ---
            saude_internacao: { aliquota: 0.02, descricao: "Hospitais, sanatórios, manicômios, casas de saúde, prontos-socorros e clínicas aptos a efetuar internações (subitem 4.03)", obs: "Art. 33 II item 10 — condicionado à capacidade de internação integral" },

            // --- Serviços bolsa de valores (Lei 8.467/2024) ---
            bolsa_valores_informatica: { aliquota: 0.02, descricao: "Serviços de informática prestados por sociedade de bolsa de valores (subitens 1.01, 1.03, 1.05, 1.07)", obs: "Lei 8.467/2024" },
            bolsa_valores_monitoramento: { aliquota: 0.02, descricao: "Monitoramento e rastreamento de veículos (subitem 11.04) prestado por bolsa de valores", obs: "Lei 8.467/2024" },
            bolsa_valores_intermediacao: { aliquota: 0.02, descricao: "Agenciamento, corretagem ou intermediação de títulos e valores mobiliários (subitens 15.12, 15.15, 15.16) prestados por bolsa de valores", obs: "Lei 8.467/2024" },
            bolsa_valores_administracao: { aliquota: 0.02, descricao: "Assessoria, análise e administração (subitem 17.01, 17.11) prestados por bolsa de valores", obs: "Lei 8.467/2024" },

            // --- Contraparte central (CCP) autorizadas pelo BACEN ---
            ccp_informatica: { aliquota: 0.02, descricao: "Serviços de informática prestados por CCP (subitens 1.01, 1.03, 1.05)", obs: "Lei 8.467/2024" },
            ccp_financeiros: { aliquota: 0.02, descricao: "Serviços financeiros (subitens 15.06, 15.07, 15.10, 15.11, 15.12, 15.15, 15.16) prestados por CCP", obs: "Lei 8.467/2024" },

            // --- Outros serviços a 2% ---
            arrendamento_mercantil: { aliquota: 0.02, descricao: "Arrendamento mercantil — leasing (subitem 15.09)" },
            servicos_cinematograficos: { aliquota: 0.02, descricao: "Serviços da indústria cinematográfica vinculados a filmes brasileiros (subitem 12.13)" },
            pesquisa_desenvolvimento: { aliquota: 0.02, descricao: "Pesquisa, desenvolvimento e gestão de projetos em ciência e tecnologia na Ilha do Fundão (Lei 691/84 art. 33)" },
            conteudo_audiovisual_internet: { aliquota: 0.02, descricao: "Disponibilização de conteúdos audiovisuais pela internet, sem cessão definitiva (subitem 1.09)" },

            // =====================================================
            // === ALÍQUOTA 3,0% ===
            // =====================================================
            limpeza_dragagem_portos: { aliquota: 0.03, descricao: "Limpeza e dragagem de portos, rios e canais (subitem 7.18)", obs: "Majorado de 2% para 3% pelo Decreto 49.835/2021 a partir de 01/03/2022" },
            veiculacao_publicidade: { aliquota: 0.03, descricao: "Veiculação e divulgação de publicidade (incluindo internet) (subitem 17.25)" },

            // =====================================================
            // === ALÍQUOTA 5,0% (maioria dos serviços) ===
            // =====================================================
            // --- Informática (geral — exceto bolsa de valores) ---
            informatica_geral: { aliquota: 0.05, descricao: "Análise, desenvolvimento de sistemas, programação, processamento de dados (subitens 1.01 a 1.09)" },

            // --- Saúde (sem internação) ---
            medicina_geral: { aliquota: 0.05, descricao: "Medicina, biomedicina, enfermagem, fisioterapia, fonoaudiologia, odontologia (subitens 4.01 a 4.23)" },
            planos_saude: { aliquota: 0.05, descricao: "Planos de medicina de grupo e convênios (subitens 4.22, 4.23)" },

            // --- Veterinária ---
            veterinaria: { aliquota: 0.05, descricao: "Serviços veterinários em geral (subitens 5.01 a 5.09)" },

            // --- Cuidados pessoais ---
            estetica: { aliquota: 0.05, descricao: "Barbearia, cabeleireiros, manicuros, esteticistas (subitem 6.01 a 6.06)" },
            ginastica_esportes: { aliquota: 0.05, descricao: "Ginástica, dança, esportes, natação, artes marciais (subitem 6.04)" },

            // --- Engenharia e Construção ---
            engenharia: { aliquota: 0.05, descricao: "Engenharia, agronomia, arquitetura, urbanismo (subitem 7.01)" },
            construcao_civil: { aliquota: 0.05, descricao: "Execução de obras de construção civil (subitem 7.02)" },
            reparacao_conservacao: { aliquota: 0.05, descricao: "Reparação, conservação e reforma de edifícios (subitem 7.05)" },
            limpeza_conservacao: { aliquota: 0.05, descricao: "Limpeza, manutenção e conservação de imóveis (subitem 7.10)" },
            decoracao_jardinagem: { aliquota: 0.05, descricao: "Decoração e jardinagem (subitem 7.11)" },

            // --- Educação ---
            educacao: { aliquota: 0.05, descricao: "Ensino regular pré-escolar, fundamental, médio e superior (subitem 8.01)" },

            // --- Transporte ---
            transporte_municipal: { aliquota: 0.05, descricao: "Transporte municipal de natureza estritamente municipal (subitem 16.01)" },
            transporte_coletivo: { aliquota: 0.02, descricao: "Transporte coletivo de passageiros e de táxi (subitem 16.01)", obs: "Alíquota reduzida — Art. 33 II item 6" },

            // --- Profissionais ---
            advocacia: { aliquota: 0.05, descricao: "Serviços de advocacia (subitem 17.14)" },
            contabilidade: { aliquota: 0.05, descricao: "Serviços de contabilidade e auditoria (subitens 17.15, 17.16)" },
            consultoria: { aliquota: 0.05, descricao: "Serviços de consultoria (subitem 17.01)" },

            // --- Vigilância e Limpeza ---
            vigilancia_seguranca: { aliquota: 0.05, descricao: "Vigilância e segurança (subitem 11.02)" },
            limpeza_empresas: { aliquota: 0.05, descricao: "Serviços de limpeza empresarial (subitem 7.10)" },

            // --- Hospedagem e Turismo ---
            hospedagem: { aliquota: 0.05, descricao: "Hospedagem em hotéis, apart-service, flats, motéis" },
            turismo: { aliquota: 0.05, descricao: "Agenciamento de turismo e viagens" },

            // --- Outros a 5% ---
            administracao_imoveis: { aliquota: 0.05, descricao: "Administração de imóveis (subitem 17.12)" },
            administracao_condominios: { aliquota: 0.05, descricao: "Administração de condomínios" },
            intermediacao_imoveis: { aliquota: 0.05, descricao: "Intermediação de imóveis" },
            mecanica_veiculos: { aliquota: 0.05, descricao: "Lubrificação, revisão, conserto de veículos" },
            assistencia_tecnica: { aliquota: 0.05, descricao: "Assistência técnica" },
            fotografia_cinema: { aliquota: 0.05, descricao: "Fonografia, fotografia, cinematografia" },
            reprografia: { aliquota: 0.05, descricao: "Reprografia, microfilmagem, digitalização" }
        },

        legislacao: [
            { norma: "Lei nº 691/1984", assunto: "Código Tributário Municipal do Rio de Janeiro" },
            { norma: "Lei Complementar nº 235/2021", assunto: "Novo Regime Fiscal Municipal — ajustes de alíquotas ISS" },
            { norma: "Decreto nº 49.835/2021", assunto: "Majoração de alíquotas ISS a partir de 01/03/2022" },
            { norma: "Lei nº 8.467/2024", assunto: "Redução ISS para 2% — bolsas de valores e CCP" },
            { norma: "Lei Complementar nº 116/2003", assunto: "Normas Gerais ISS (Federal)" }
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    //  6. IPTU — IMPOSTO PREDIAL E TERRITORIAL URBANO (RJ capital)
    // ═══════════════════════════════════════════════════════════════

    iptu: {
        municipio_referencia: "Rio de Janeiro",

        residencial: {
            aliquota_base: 0.01,
            obs: "1% sobre valor venal para imóveis residenciais edificados"
        },

        nao_residencial: {
            aliquota_base: 0.025,
            obs: "2,5% sobre valor venal para imóveis comerciais/não residenciais edificados"
        },

        terreno_nao_edificado: {
            aliquota_base: 0.03,
            obs: "3% sobre valor venal para terrenos não edificados"
        },

        progressivo: false,
        obs_progressividade: "RJ capital não adota IPTU progressivo no tempo na forma tradicional, mas há descontos para adimplência e alíquotas diferenciadas por uso.",

        isencoes: [
            { tipo: "Entidades filantrópicas", obs: "Imunidade constitucional" },
            { tipo: "Imóveis públicos", obs: "Imunidade constitucional" },
            { tipo: "Culto religioso", obs: "Imunidade constitucional — templos de qualquer culto" },
            { tipo: "Imóveis de pequeno valor", obs: "Conforme legislação municipal" }
        ],

        legislacao: [
            { norma: "Lei nº 691/1984", assunto: "IPTU — Código Tributário Municipal" },
            { norma: "Decreto nº 27.041/2006", assunto: "Regulamentação IPTU" }
        ],

        portal: "https://carioca.rio/servicos/iptu/"
    },

    // ═══════════════════════════════════════════════════════════════
    //  7. ITBI — IMPOSTO SOBRE TRANSMISSÃO DE BENS IMÓVEIS (RJ capital)
    // ═══════════════════════════════════════════════════════════════

    itbi: {
        municipio_referencia: "Rio de Janeiro",
        aliquota_geral: 0.03,
        obs: "3% sobre o valor de mercado. ITBI incide APENAS sobre transmissão onerosa inter vivos (compra e venda). Herança e doação são ITD (imposto estadual).",

        base_calculo: "Valor de mercado do imóvel, conforme declarado ou avaliado pela Prefeitura",

        isencoes: [
            { tipo: "Imóveis de pequeno valor", obs: "Conforme legislação municipal" },
            { tipo: "Incorporação ao patrimônio de PJ (capital)", obs: "Não incide ITBI na integralização de capital, salvo quando atividade preponderante é compra/venda de imóveis" }
        ],

        legislacao: [
            { norma: "Lei nº 691/1984", assunto: "ITBI — Código Tributário Municipal" },
            { norma: "Lei nº 3.691/2002", assunto: "Alterações ITBI" }
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    //  8. TAXAS ESTADUAIS E MUNICIPAIS
    // ═══════════════════════════════════════════════════════════════

    taxas: {
        taxa_incendio: {
            descricao: "Taxa de Prevenção e Extinção de Incêndios (Corpo de Bombeiros)",
            obs: "Calculada sobre valor venal do imóvel"
        },
        detran: {
            descricao: "Taxas do DETRAN-RJ (licenciamento, transferência, CNH)",
            obs: "Incluídas no IPVA — atualizadas anualmente"
        },
        taxa_judiciaria: {
            descricao: "Taxa judiciária",
            obs: "Conforme tabela da Justiça Estadual"
        },
        coleta_lixo: {
            descricao: "Taxa de coleta de lixo (municipal)",
            valor_minimo: 15.00,
            valor_maximo: 50.00,
            obs: "Varia conforme tipo e tamanho do imóvel"
        },
        alvara_funcionamento: {
            descricao: "Taxa de alvará/licença de funcionamento (municipal)",
            valor_minimo: 100.00,
            valor_maximo: 500.00,
            obs: "Conforme atividade econômica"
        },
        cosip: {
            descricao: "Contribuição para Custeio do Serviço de Iluminação Pública",
            valor_minimo: 5.00,
            valor_maximo: 30.00,
            obs: "Conforme faixa de consumo de energia"
        }
    },

    // ═══════════════════════════════════════════════════════════════
    //  9. IMPOSTOS FEDERAIS (aplicáveis no estado)
    // ═══════════════════════════════════════════════════════════════

    federal: {
        irpj: {
            lucro_real: {
                aliquota_base: 0.15,
                adicional: 0.10,
                limite_adicional_mensal: 20000,
                limite_adicional_anual: 240000,
                obs: "15% sobre lucro líquido + 10% sobre excedente de R$ 20.000/mês"
            },
            lucro_presumido: {
                presuncao: {
                    comercio_industria: 0.08,
                    servicos: 0.32,
                    transporte: 0.08,
                    geral: 0.08
                },
                aliquota: 0.15,
                aliquota_efetiva: {
                    comercio_industria: 0.012,
                    servicos: 0.048,
                    transporte: 0.012,
                    geral: 0.012
                }
            }
        },

        csll: {
            aliquota_geral: 0.09,
            aliquota_financeiras: 0.15,
            presuncao_lucro_presumido: {
                servicos: 0.32,
                comercio_industria: 0.12,
                geral: 0.12
            }
        },

        pis: {
            cumulativo: { aliquota: 0.0065, obs: "Lucro Presumido — sem créditos" },
            nao_cumulativo: { aliquota: 0.0165, obs: "Lucro Real — com créditos" }
        },

        cofins: {
            cumulativo: { aliquota: 0.03, obs: "Lucro Presumido — sem créditos" },
            nao_cumulativo: { aliquota: 0.076, obs: "Lucro Real — com créditos" }
        },

        ipi: {
            obs: "Alíquotas por NCM — tabela TIPI vigente. RJ não possui benefícios ZFM/ALC.",
            beneficios_regionais: false
        },

        iof: {
            obs: "Alíquotas federais padrão — operações de crédito, câmbio, seguros, títulos"
        },

        ii: {
            obs: "Imposto de Importação — TEC vigente, alíquotas por NCM"
        },

        ie: {
            obs: "Imposto de Exportação — geralmente 0%, exceto produtos regulados"
        },

        itr: {
            obs: "Imposto Territorial Rural — alíquotas conforme grau de utilização e área total"
        },

        inss: {
            patronal: {
                aliquota_geral: 0.20,
                rat_sat: { minimo: 0.005, maximo: 0.03, obs: "RAT/SAT de 0,5% a 3% conforme atividade + FAP" },
                terceiros: 0.025,
                total_maximo: 0.288,
                obs: "20% patronal + RAT/SAT (0,5% a 3%) + terceiros (até 5,8%)"
            },
            empregado: {
                faixas: [
                    { limite: 1518.00, aliquota: 0.075 },
                    { limite: 2793.88, aliquota: 0.09 },
                    { limite: 4156.56, aliquota: 0.12 },
                    { limite: 8157.41, aliquota: 0.14 }
                ],
                obs: "Tabela progressiva INSS 2025"
            }
        },

        fgts: {
            aliquota_mensal: 0.08,
            multa_rescisoria: 0.40,
            obs: "8% sobre remuneração mensal + 40% multa rescisória sem justa causa"
        },

        irpf: {
            tabela_mensal: [
                { limite_inferior: 0, limite_superior: 2259.20, aliquota: 0, deducao: 0 },
                { limite_inferior: 2259.21, limite_superior: 2826.65, aliquota: 0.075, deducao: 169.44 },
                { limite_inferior: 2826.66, limite_superior: 3751.05, aliquota: 0.15, deducao: 381.44 },
                { limite_inferior: 3751.06, limite_superior: 4664.68, aliquota: 0.225, deducao: 662.77 },
                { limite_inferior: 4664.69, limite_superior: Infinity, aliquota: 0.275, deducao: 896.00 }
            ],
            obs: "Tabela IRPF 2025 — desconto simplificado de R$ 564,80 para quem ganha até R$ 2.824,00"
        }
    },

    // ═══════════════════════════════════════════════════════════════
    //  10. SIMPLES NACIONAL
    // ═══════════════════════════════════════════════════════════════

    simples_nacional: {
        sublimite_estadual: 3600000,
        obs_sublimite: "RJ adota o sublimite de R$ 3.600.000 para ICMS/ISS. Empresas que ultrapassam devem recolher ICMS e ISS fora do Simples.",

        mei: {
            limite_anual: 81000,
            valor_mensal_das: {
                comercio_industria: 75.90,
                servicos: 79.90,
                comercio_servicos: 81.90
            },
            obs: "Valores DAS-MEI 2026 (INSS + ICMS/ISS). Inclui contribuição de R$ 5,00 ICMS e/ou R$ 5,00 ISS."
        },

        limites: {
            microempresa: 360000,
            epp: 4800000
        },

        anexos: {
            anexo_i: {
                nome: "Comércio",
                faixas: [
                    { faixa: 1, receita_ate: 180000, aliquota: 0.04, deducao: 0 },
                    { faixa: 2, receita_ate: 360000, aliquota: 0.073, deducao: 5940 },
                    { faixa: 3, receita_ate: 720000, aliquota: 0.095, deducao: 13860 },
                    { faixa: 4, receita_ate: 1800000, aliquota: 0.105, deducao: 22500 },
                    { faixa: 5, receita_ate: 3600000, aliquota: 0.1461, deducao: 87300 },
                    { faixa: 6, receita_ate: 4800000, aliquota: 0.19, deducao: 378000 }
                ]
            },
            anexo_ii: {
                nome: "Indústria",
                faixas: [
                    { faixa: 1, receita_ate: 180000, aliquota: 0.045, deducao: 0 },
                    { faixa: 2, receita_ate: 360000, aliquota: 0.078, deducao: 5940 },
                    { faixa: 3, receita_ate: 720000, aliquota: 0.10, deducao: 13860 },
                    { faixa: 4, receita_ate: 1800000, aliquota: 0.112, deducao: 22500 },
                    { faixa: 5, receita_ate: 3600000, aliquota: 0.1472, deducao: 85500 },
                    { faixa: 6, receita_ate: 4800000, aliquota: 0.30, deducao: 720000 }
                ]
            },
            anexo_iii: {
                nome: "Serviços (locação de bens móveis, agências de viagem, escritórios contábeis, etc.)",
                faixas: [
                    { faixa: 1, receita_ate: 180000, aliquota: 0.06, deducao: 0 },
                    { faixa: 2, receita_ate: 360000, aliquota: 0.112, deducao: 9360 },
                    { faixa: 3, receita_ate: 720000, aliquota: 0.135, deducao: 17640 },
                    { faixa: 4, receita_ate: 1800000, aliquota: 0.16, deducao: 35640 },
                    { faixa: 5, receita_ate: 3600000, aliquota: 0.21, deducao: 125640 },
                    { faixa: 6, receita_ate: 4800000, aliquota: 0.33, deducao: 648000 }
                ]
            },
            anexo_iv: {
                nome: "Serviços (construção civil, vigilância, limpeza, obras, etc.)",
                faixas: [
                    { faixa: 1, receita_ate: 180000, aliquota: 0.045, deducao: 0 },
                    { faixa: 2, receita_ate: 360000, aliquota: 0.09, deducao: 8100 },
                    { faixa: 3, receita_ate: 720000, aliquota: 0.102, deducao: 12420 },
                    { faixa: 4, receita_ate: 1800000, aliquota: 0.14, deducao: 39780 },
                    { faixa: 5, receita_ate: 3600000, aliquota: 0.22, deducao: 183780 },
                    { faixa: 6, receita_ate: 4800000, aliquota: 0.33, deducao: 828000 }
                ]
            },
            anexo_v: {
                nome: "Serviços (auditoria, tecnologia, engenharia, publicidade, etc.)",
                faixas: [
                    { faixa: 1, receita_ate: 180000, aliquota: 0.155, deducao: 0 },
                    { faixa: 2, receita_ate: 360000, aliquota: 0.18, deducao: 4500 },
                    { faixa: 3, receita_ate: 720000, aliquota: 0.195, deducao: 9900 },
                    { faixa: 4, receita_ate: 1800000, aliquota: 0.205, deducao: 17100 },
                    { faixa: 5, receita_ate: 3600000, aliquota: 0.23, deducao: 62100 },
                    { faixa: 6, receita_ate: 4800000, aliquota: 0.305, deducao: 540000 }
                ]
            }
        }
    },

    // ═══════════════════════════════════════════════════════════════
    //  11. INCENTIVOS FISCAIS E BENEFÍCIOS REGIONAIS
    // ═══════════════════════════════════════════════════════════════

    incentivos: {
        sudam: {
            ativo: false,
            obs: "RJ NÃO está na área de abrangência da SUDAM"
        },
        sudene: {
            ativo: false,
            obs: "RJ NÃO está na área de abrangência da SUDENE"
        },
        zona_franca: {
            ativo: false,
            obs: "RJ não possui Zona Franca ou ALC"
        },
        programas_estaduais: [
            {
                programa: "Lei nº 10.431/2024 — Programa de Desenvolvimento Econômico Sustentável",
                beneficio: "Diferimento e redução de ICMS para setores estratégicos",
                setores: ["Turismo", "Tecnologia", "Energias renováveis", "Indústria de transformação", "Logística"],
                vigencia: "2024-2032"
            },
            {
                programa: "Convênios ICMS",
                beneficio: "Diversos convênios com benefícios para operações específicas",
                setores: ["Exportação", "Energia renovável", "Agricultura familiar"]
            }
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    //  12. REFORMA TRIBUTÁRIA
    // ═══════════════════════════════════════════════════════════════

    reforma_tributaria: {
        obs_geral: "LC 214/2025 — Reforma Tributária aprovada. IBS substituirá ICMS e ISS. CBS substituirá PIS/COFINS.",

        ibs: {
            obs: "Imposto sobre Bens e Serviços — substituirá ICMS (estadual) e ISS (municipal)",
            aliquota_estimada_min: 0.16,
            aliquota_estimada_max: 0.18,
            obs_aliquota: "A ser definida por cada estado/município"
        },

        cbs: {
            obs: "Contribuição sobre Bens e Serviços — substituirá PIS e COFINS",
            aliquota_estimada: 0.0925
        },

        imposto_seletivo: {
            obs: "Incidirá sobre produtos prejudiciais à saúde ou ao meio ambiente",
            produtos: ["Combustíveis", "Bebidas alcoólicas", "Cigarros", "Armas e munições", "Produtos de luxo"],
            aliquota_inicial: 0.009
        },

        cronograma_transicao: {
            "2026": { obs: "IBS 0,1% (teste). CBS 0,9% (teste). Fase de simulação e calibragem." },
            "2027": { obs: "CBS vigência plena. IBS ainda em fase de transição." },
            "2029_2032": { obs: "Transição gradual — redução de ICMS/ISS e aumento de IBS" },
            "2033": { obs: "Extinção total do ICMS e ISS. IBS pleno." }
        },

        impacto_rj: {
            obs: "RJ não perde benefícios SUDAM/SUDENE. Programas estaduais (Lei 10.431/2024) podem ser ajustados. Fundo de Desenvolvimento Regional em discussão."
        }
    },

    // ═══════════════════════════════════════════════════════════════
    //  13. DADOS DE COBERTURA
    // ═══════════════════════════════════════════════════════════════

    cobertura: {
        versao: "3.0",
        data_atualizacao: "2026-02-10",
        localizados: [
            "ICMS — alíquota padrão 20% + FECP 2%",
            "ICMS — alíquotas diferenciadas (cesta básica, agropecuários)",
            "ICMS — alíquotas interestaduais",
            "IPVA — alíquotas por tipo de veículo",
            "ITD — faixas progressivas reais (Lei 7.786/2017, 6 faixas em UFIR-RJ)",
            "ITD — isenções com valores em UFIR-RJ",
            "ISS — alíquotas por serviço (geral 5%, reduzidas 2% e 3%)",
            "IPTU — alíquotas por tipo de imóvel",
            "ITBI — alíquota de 3%",
            "Simples Nacional — todas as 6 faixas dos 5 anexos",
            "Impostos federais completos"
        ],
        nao_localizados: [
            "ICMS-ST — MVA por produto (varia periodicamente)",
            "IPTU — faixas progressivas detalhadas por valor venal",
            "Taxas — valores exatos atualizados",
            "UFIR-RJ 2026 (ainda não publicada — usar 2025 como referência)"
        ],
        contatos_para_completar: [
            { orgao: "SEFAZ-RJ", url: "https://portal.fazenda.rj.gov.br/" },
            { orgao: "Prefeitura do Rio de Janeiro", url: "https://prefeitura.rio/" },
            { orgao: "Receita Federal", url: "https://www.gov.br/receitafederal", tel: "146" }
        ]
    },
};


// ═══════════════════════════════════════════════════════════════════════════
//  14. FUNÇÕES UTILITÁRIAS — RIO DE JANEIRO
// ═══════════════════════════════════════════════════════════════════════════

/** Retorna alíquota ISS por tipo de serviço no Rio de Janeiro */
function getISSRioDeJaneiro(tipo) {
    if (!tipo) return null;
    var chave = tipo.toLowerCase().replace(/[\s-]+/g, "_");
    var servico = RIO_DE_JANEIRO_TRIBUTARIO.iss.por_tipo_servico[chave];
    return servico ? servico.aliquota : null;
}

/**
 * Calcula ITD (ITCMD do RJ) sobre um valor em R$
 * @param {number} valor - Valor da transmissão em R$
 * @param {number} [ufir] - Valor da UFIR-RJ (default: 2025)
 * @returns {object} { aliquota, imposto, faixa_ufir, obs }
 */
function getITDRioDeJaneiro(valor, ufir) {
    var ufirrj = ufir || RIO_DE_JANEIRO_TRIBUTARIO.itd.ufir_rj_2025;
    var valorUfir = valor / ufirrj;
    var faixas = RIO_DE_JANEIRO_TRIBUTARIO.itd.faixas;
    for (var i = 0; i < faixas.length; i++) {
        if (valorUfir <= faixas[i].limite_ufir) {
            return {
                aliquota: faixas[i].aliquota,
                imposto: valor * faixas[i].aliquota,
                faixa_ufir: valorUfir.toFixed(0) + " UFIR-RJ",
                obs: faixas[i].obs
            };
        }
    }
    var ultima = faixas[faixas.length - 1];
    return {
        aliquota: ultima.aliquota,
        imposto: valor * ultima.aliquota,
        faixa_ufir: valorUfir.toFixed(0) + " UFIR-RJ",
        obs: ultima.obs
    };
}

/**
 * Verifica se transmissão é isenta de ITD
 * @param {string} tipo - "causa_mortis" ou "doacao_dinheiro" ou "imovel_residencial_cm"
 * @param {number} valor - Valor em R$
 * @param {number} [ufir] - UFIR-RJ
 * @returns {object} { isento, limite_reais, obs }
 */
function isITDIsentoRioDeJaneiro(tipo, valor, ufir) {
    var ufirrj = ufir || RIO_DE_JANEIRO_TRIBUTARIO.itd.ufir_rj_2025;
    var isencoes = RIO_DE_JANEIRO_TRIBUTARIO.itd.isencoes;
    for (var i = 0; i < isencoes.length; i++) {
        var is = isencoes[i];
        if (!is.limite_ufir) continue;
        var limiteReais = is.limite_ufir * ufirrj;
        if (tipo === "causa_mortis" && is.tipo.indexOf("Monte-mor") >= 0 && valor <= limiteReais) {
            return { isento: true, limite_reais: limiteReais, obs: is.obs };
        }
        if (tipo === "doacao_dinheiro" && is.tipo.indexOf("Doação em dinheiro") >= 0 && valor <= limiteReais) {
            return { isento: true, limite_reais: limiteReais, obs: is.obs };
        }
        if (tipo === "imovel_residencial_cm" && is.tipo.indexOf("Imóveis residenciais") >= 0 && valor <= limiteReais) {
            return { isento: true, limite_reais: limiteReais, obs: is.obs };
        }
    }
    return { isento: false, limite_reais: null, obs: "Não isento" };
}

/**
 * Retorna cálculo IPTU por tipo de imóvel
 * @param {number} valorVenal - Valor venal
 * @param {string} tipo - "residencial", "comercial", "terreno"
 * @returns {object} { aliquota, imposto_estimado }
 */
function getIPTURioDeJaneiro(valorVenal, tipo) {
    var aliquota;
    switch (tipo) {
        case "residencial": aliquota = RIO_DE_JANEIRO_TRIBUTARIO.iptu.residencial.aliquota_base; break;
        case "comercial": aliquota = RIO_DE_JANEIRO_TRIBUTARIO.iptu.nao_residencial.aliquota_base; break;
        case "terreno": aliquota = RIO_DE_JANEIRO_TRIBUTARIO.iptu.terreno_nao_edificado.aliquota_base; break;
        default: aliquota = RIO_DE_JANEIRO_TRIBUTARIO.iptu.residencial.aliquota_base;
    }
    return {
        aliquota: aliquota,
        imposto_estimado: valorVenal * aliquota
    };
}

/**
 * Retorna alíquota IPVA por tipo de veículo
 * @param {string} tipo - Tipo do veículo
 * @returns {number|null} Alíquota em decimal
 */
function getIPVARioDeJaneiro(tipo) {
    if (!tipo) return null;
    var chave = tipo.toLowerCase().replace(/[\s-]+/g, "_");
    var veiculo = RIO_DE_JANEIRO_TRIBUTARIO.ipva.aliquotas[chave];
    return veiculo ? veiculo.aliquota : null;
}

/**
 * Retorna ICMS efetivo (padrão + FECP)
 * @returns {number} 0.22 (20% + 2% FECP)
 */
function getICMSEfetivoRioDeJaneiro() {
    return RIO_DE_JANEIRO_TRIBUTARIO.icms.aliquota_padrao + (RIO_DE_JANEIRO_TRIBUTARIO.icms.fecop.ativo ? RIO_DE_JANEIRO_TRIBUTARIO.icms.fecop.adicional : 0);
}

/**
 * Calcula alíquota efetiva do Simples Nacional
 * @param {number} rbt12 - Receita Bruta dos últimos 12 meses
 * @param {string} anexo - Anexo (anexo_i, anexo_ii, anexo_iii, anexo_iv, anexo_v)
 * @returns {number|null} Alíquota efetiva em decimal
 */
function getAliquotaSimplesNacionalRioDeJaneiro(rbt12, anexo) {
    if (!rbt12 || rbt12 <= 0 || !anexo) return null;
    var tabela = RIO_DE_JANEIRO_TRIBUTARIO.simples_nacional.anexos[anexo];
    if (!tabela) return null;
    var faixa = null;
    for (var i = 0; i < tabela.faixas.length; i++) {
        if (rbt12 <= tabela.faixas[i].receita_ate) {
            faixa = tabela.faixas[i];
            break;
        }
    }
    if (!faixa) return null;
    var aliquotaEfetiva = ((rbt12 * faixa.aliquota) - faixa.deducao) / rbt12;
    return Math.max(0, aliquotaEfetiva);
}

/** Verifica se é Zona Franca */
function isZonaFrancaRioDeJaneiro() { return false; }

/** Verifica se é ALC */
function isALCRioDeJaneiro() { return false; }

/** Retorna percentual de redução IRPJ via SUDAM */
function getReducaoSUDAMRioDeJaneiro() { return 0; }

/** Retorna percentual de redução IRPJ via SUDENE */
function getReducaoSUDENERioDeJaneiro() { return 0; }

/**
 * Retorna objeto resumido para exibição rápida
 * @returns {Object} Resumo tributário do estado
 */
function resumoTributarioRioDeJaneiro() {
    return {
        estado: RIO_DE_JANEIRO_TRIBUTARIO.dados_gerais.nome,
        sigla: RIO_DE_JANEIRO_TRIBUTARIO.dados_gerais.sigla,
        regiao: RIO_DE_JANEIRO_TRIBUTARIO.dados_gerais.regiao,
        icms_padrao: RIO_DE_JANEIRO_TRIBUTARIO.icms.aliquota_padrao,
        icms_efetivo: getICMSEfetivoRioDeJaneiro(),
        fecop: RIO_DE_JANEIRO_TRIBUTARIO.icms.fecop.ativo,
        fecop_adicional: RIO_DE_JANEIRO_TRIBUTARIO.icms.fecop.adicional,
        ipva_automovel: RIO_DE_JANEIRO_TRIBUTARIO.ipva.aliquotas.automovel.aliquota,
        iss_geral: RIO_DE_JANEIRO_TRIBUTARIO.iss.aliquota_geral,
        iss_minimo: RIO_DE_JANEIRO_TRIBUTARIO.iss.aliquota_minima,
        iss_maximo: RIO_DE_JANEIRO_TRIBUTARIO.iss.aliquota_maxima,
        iptu_residencial: RIO_DE_JANEIRO_TRIBUTARIO.iptu.residencial.aliquota_base,
        iptu_comercial: RIO_DE_JANEIRO_TRIBUTARIO.iptu.nao_residencial.aliquota_base,
        itbi: RIO_DE_JANEIRO_TRIBUTARIO.itbi.aliquota_geral,
        itd_minima: 0.04,
        itd_maxima: 0.08,
        sublimite_simples: RIO_DE_JANEIRO_TRIBUTARIO.simples_nacional.sublimite_estadual,
        sudam: RIO_DE_JANEIRO_TRIBUTARIO.incentivos.sudam.ativo,
        sudene: RIO_DE_JANEIRO_TRIBUTARIO.incentivos.sudene.ativo,
        zona_franca: RIO_DE_JANEIRO_TRIBUTARIO.incentivos.zona_franca.ativo
    };
}


// ═══════════════════════════════════════════════════════════════════════════
//  15. EXPORTAÇÃO (Padrão Grupo 2)
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        ...RIO_DE_JANEIRO_TRIBUTARIO,
        utils: {
            getISS: getISSRioDeJaneiro,
            getITD: getITDRioDeJaneiro,
            isITDIsento: isITDIsentoRioDeJaneiro,
            getIPTU: getIPTURioDeJaneiro,
            getIPVA: getIPVARioDeJaneiro,
            getICMSEfetivo: getICMSEfetivoRioDeJaneiro,
            getAliquotaSimplesNacional: getAliquotaSimplesNacionalRioDeJaneiro,
            isZonaFranca: isZonaFrancaRioDeJaneiro,
            isALC: isALCRioDeJaneiro,
            getReducaoSUDAM: getReducaoSUDAMRioDeJaneiro,
            getReducaoSUDENE: getReducaoSUDENERioDeJaneiro,
            resumoTributario: resumoTributarioRioDeJaneiro,
        },
    };
}

if (typeof window !== "undefined") {
    window.RIO_DE_JANEIRO_TRIBUTARIO = RIO_DE_JANEIRO_TRIBUTARIO;
    window.RioDeJaneiroTributario = {
        getISS: getISSRioDeJaneiro,
        getITD: getITDRioDeJaneiro,
        isITDIsento: isITDIsentoRioDeJaneiro,
        getIPTU: getIPTURioDeJaneiro,
        getIPVA: getIPVARioDeJaneiro,
        getICMSEfetivo: getICMSEfetivoRioDeJaneiro,
        getAliquotaSimplesNacional: getAliquotaSimplesNacionalRioDeJaneiro,
        isZonaFranca: isZonaFrancaRioDeJaneiro,
        isALC: isALCRioDeJaneiro,
        getReducaoSUDAM: getReducaoSUDAMRioDeJaneiro,
        getReducaoSUDENE: getReducaoSUDENERioDeJaneiro,
        resumo: resumoTributarioRioDeJaneiro,
    };
}
