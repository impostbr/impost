/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SANTA_CATARINA.JS — Base de Dados Tributária Completa do Estado de Santa Catarina
 * ═══════════════════════════════════════════════════════════════════════════
 * Versão 3.0 — Padronizado conforme template Roraima v3.0
 * Dados verificados via fontes oficiais (SEF-SC, RFB, Planalto, Prefeitura de Florianópolis)
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
 *   11. incentivos          — SUDAM/SUDENE, programas estaduais, TTDs
 *   12. reforma_tributaria  — EC 132, LC 214, LC 227, transição IBS/CBS
 *   13. cobertura           — Versão, itens localizados/pendentes, contatos
 *   14. funções utilitárias — Helpers de cálculo
 *   15. exportação          — module.exports + window (padrão Grupo 2)
 *
 * FONTES CONSULTADAS:
 *   • SEF-SC — www.sef.sc.gov.br
 *   • Lei nº 10.297/1996 (ICMS)
 *   • Lei nº 7.543/1988 (IPVA)
 *   • Lei nº 13.136/2004 (ITCMD)
 *   • RICMS/SC — Decreto nº 2.870/2001
 *   • Lei Complementar nº 53/2008 (Código Tributário de Florianópolis)
 *   • Lei Complementar nº 116/2003 (ISS federal)
 *   • Emenda Constitucional nº 137/2025 (Isenção IPVA veículos 20+ anos)
 *   • SEF-SC Notícias, TaxGroup, TOTVS, NSC Total
 *   • Receita Federal — www.gov.br/receitafederal
 *
 * ATUALIZAÇÃO: 10/02/2026
 * ═══════════════════════════════════════════════════════════════════════════
 */

const SANTA_CATARINA_TRIBUTARIO = {

    // ═══════════════════════════════════════════════════════════════
    //  1. DADOS GERAIS
    // ═══════════════════════════════════════════════════════════════

    dados_gerais: {
        estado: "Santa Catarina",
        sigla: "SC",
        regiao: "Sul",
        capital: "Florianópolis",
        codigo_ibge: "42",
        zona_franca: false,
        alc: false,
        alc_nome: null,
        alc_municipios: [],
        abrangencia_sudam: false,
        abrangencia_sudene: false,
        populacao_estimada: 7610000,
        pib_ranking: 6,
        menor_desemprego_pais: true,
        taxa_desemprego: 0.022,
        site_sefaz: "https://www.sef.sc.gov.br/",
        site_sefaz_legislacao: "https://legislacao.sef.sc.gov.br/",
        site_prefeitura_capital: "https://www.pmf.sc.gov.br/entidades/fazenda/",
        legislacao_base: {
            icms: "Lei nº 10.297/1996",
            ricms: "RICMS/SC — Decreto nº 2.870/2001",
            ipva: "Lei nº 7.543/1988",
            itcmd: "Lei nº 13.136/2004",
            codigo_tributario_municipal: "Lei Complementar nº 53/2008 (Código Tributário de Florianópolis)",
            iss_federal: "Lei Complementar nº 116/2003",
            ipva_isencao_20anos: "Emenda Constitucional nº 137/2025",
        },
        portos_principais: [
            "Porto de Itajaí",
            "Porto de Navegantes",
            "Porto de São Francisco do Sul",
            "Porto de Imbituba",
            "Porto de Laguna",
            "Terminal Portuário de Itapoá",
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  2. ICMS — IMPOSTO SOBRE CIRCULAÇÃO DE MERCADORIAS E SERVIÇOS
    // ═══════════════════════════════════════════════════════════════

    icms: {
        aliquota_padrao: 0.17,
        aliquota_padrao_percentual: "17%",
        aliquota_padrao_descricao: "Alíquota padrão para operações internas (Art. 19, I, Lei 10.297/1996)",
        base_legal: "Lei nº 10.297/1996, regulamentada pelo RICMS/SC (Decreto 2.870/2001)",
        url_lei: "https://legislacao.sef.sc.gov.br/html/leis/1996/lei_96_10297_pas.htm",
        fato_gerador: "Circulação de mercadorias, prestação de serviços de transporte interestadual e intermunicipal, e serviços de comunicação",
        base_calculo: "Valor da operação, incluindo frete, seguro, juros e demais despesas cobradas do adquirente",

        aliquotas_diferenciadas: {
            superfluo_25: {
                aliquota: 0.25,
                descricao: "Produtos supérfluos — alíquota majorada",
                produtos: [
                    "Bebidas alcoólicas (exceto cerveja e chope)",
                    "Cigarros, cigarrilhas, charutos e fumos industrializados",
                    "Armas e munições",
                    "Fogos de artifício",
                    "Perfumes e cosméticos (selecionados)",
                    "Embarcações de esporte e recreação",
                ],
                base_legal: "Art. 19, II, Lei 10.297/1996",
            },
            cesta_basica_12: {
                aliquota: 0.12,
                descricao: "Produtos da cesta básica — alíquota reduzida",
                produtos: [
                    "Arroz, feijão, farinha de trigo, farinha de mandioca",
                    "Açúcar, café, sal, óleo de soja",
                    "Leite pasteurizado ou UHT",
                    "Ovos, frutas, verduras e legumes",
                    "Pão francês",
                    "Carnes e peixes (in natura)",
                    "Artigos têxteis, vestuário e artefatos de couro (operações entre contribuintes, produção própria industrial)",
                    "Telhas de fibrocimento sem amianto (NCM 6811.82.00, produção própria)",
                ],
                base_legal: "Art. 19, III, Lei 10.297/1996 / RICMS/SC Anexo",
            },
            energia_eletrica: {
                aliquota: 0.17,
                descricao: "Energia elétrica — alíquota padrão (após decisão STF 2022)",
                base_legal: "Lei 10.297/1996",
            },
            combustiveis: {
                aliquota: 0.17,
                descricao: "Combustíveis — alíquota padrão (após LC 194/2022)",
                base_legal: "Lei 10.297/1996",
            },
            telecomunicacoes: {
                aliquota: 0.17,
                descricao: "Telecomunicações — alíquota padrão (após decisão STF 2022)",
                base_legal: "Lei 10.297/1996",
            },
        },

        combustiveis_monofasico_2026: {
            sistema: "Substituição tributária com valores específicos (monofásico)",
            dados_disponiveis: true,
            itens: [
                { produto: "Gasolina", valor_por_litro: 1.57, unidade: "R$/litro", fonte: "Convênio ICMS nº 21/2026" },
                { produto: "Diesel S-10 / S-500", valor_por_litro: 1.17, unidade: "R$/litro", fonte: "Convênio ICMS nº 21/2026" },
                { produto: "GLP (gás de cozinha)", valor_por_kg: 1.47, unidade: "R$/kg", fonte: "Convênio ICMS nº 21/2026" },
                { produto: "Etanol hidratado (EHC)", valor_por_litro: null, unidade: "R$/litro", obs: "Valor variável conforme PMPF" },
            ],
        },

        interestaduais: {
            descricao: "Alíquotas aplicadas em operações entre estados, definidas por Resolução do Senado",
            para_sul_sudeste: 0.12,
            para_norte_nordeste_co: 0.07,
            importados: 0.04,
            obs: "ES recebe 7% quando destino, por ser considerado região menos desenvolvida",
        },

        difal: {
            aplicavel: true,
            descricao: "Diferencial de Alíquota — aplicado em vendas interestaduais para consumidor final não contribuinte",
            calculo: "DIFAL = Alíquota Interna Destino - Alíquota Interestadual",
            exemplo: "Venda SC → SP: 18% (SP) - 12% (interestadual S/SE) = 6% DIFAL para SP",
            exemplo2: "Venda SC → BA: 20,5% (BA) - 7% (interestadual N/NE/CO) = 13,5% DIFAL para BA",
            responsavel: "100% para o estado de destino (desde 2022)",
            base_legal: "EC 87/2015, regulamentada por convênios CONFAZ",
        },

        fecop: {
            existe: false,
            adicional: 0,
            nome: "Fundo Social / FUMDES",
            descricao: "Santa Catarina NÃO possui FECOP nos moldes de outros estados. Porém, empresas com TTDs devem recolher 0,4% ao Fundo Social (FUMDES) sobre a base de cálculo integral",
            aliquota_ttd: 0.004,
            aplicacao: "Obrigatório para empresas com Tratamento Tributário Diferenciado (TTD)",
            base_legal: "Regulamento dos TTDs / SEF-SC",
            obs: "Diferente de estados como RJ, CE, PE que cobram FECOP de 1%-2% sobre supérfluos",
        },

        substituicao_tributaria: {
            aplicavel: true,
            descricao: "Regime de antecipação do ICMS. O primeiro da cadeia recolhe o imposto por toda a cadeia produtiva",
            mva_exemplos: [
                { segmento: "Bebidas alcoólicas", mva_ajustada: "Conforme PMPF/Pauta Fiscal" },
                { segmento: "Materiais de construção", mva_ajustada: "Conforme protocolo CONFAZ" },
                { segmento: "Autopeças", mva_ajustada: "Conforme protocolo CONFAZ" },
                { segmento: "Medicamentos", mva_ajustada: "Conforme protocolo CONFAZ" },
            ],
            obs: "MVAs variam conforme protocolo CONFAZ vigente. Consultar RICMS/SC Anexo 3",
        },

        legislacao: [
            { norma: "Lei nº 10.297/1996", assunto: "ICMS — Lei base do ICMS em Santa Catarina" },
            { norma: "RICMS/SC — Decreto nº 2.870/2001", assunto: "Regulamento do ICMS de Santa Catarina" },
            { norma: "LC 194/2022", assunto: "Essencialidade — energia, combustíveis, telecomunicações a 17%" },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  3. IPVA — IMPOSTO SOBRE PROPRIEDADE DE VEÍCULOS AUTOMOTORES
    // ═══════════════════════════════════════════════════════════════

    ipva: {
        nome_completo: "Imposto sobre a Propriedade de Veículos Automotores",
        explicacao: "Imposto anual cobrado de proprietários de veículos registrados em SC. 50% fica com o estado e 50% com o município de registro. SC tem uma das menores alíquotas do país (atrás apenas do PR que reduziu para 1,9% em 2026).",
        base_legal: "Lei nº 7.543/1988",
        fato_gerador: "Propriedade de veículo automotor em 1º de janeiro de cada exercício",
        base_calculo: "Valor de mercado do veículo conforme Tabela FIPE (mercado automotivo catarinense, art. 6º Lei 7.543/1988)",

        aliquotas: {
            automoveis_passeio: 0.02,
            utilitarios: 0.02,
            caminhonetes: 0.02,
            motor_casa: 0.02,
            motocicletas: 0.01,
            ciclomotores: 0.01,
            caminhoes: 0.01,
            onibus_micro: 0.01,
            transporte_passageiros: 0.01,
            veiculos_locadoras: 0.01,
        },

        aliquotas_detalhadas: [
            {
                tipo: "Automóveis de passeio e utilitários",
                descricao: "Carros, SUVs, caminhonetes, motor-casa (nacionais ou importados)",
                aliquota: 0.02,
                fonte: "SEF-SC Notícia 16/12/2025",
            },
            {
                tipo: "Motocicletas, ciclomotores e similares",
                descricao: "Motos, ciclomotores, triciclos e quadriciclos (acima de 200cc)",
                aliquota: 0.01,
                fonte: "SEF-SC Notícia 16/12/2025",
            },
            {
                tipo: "Veículos de carga",
                descricao: "Caminhões e veículos utilizados no transporte de carga",
                aliquota: 0.01,
                fonte: "SEF-SC Notícia 16/12/2025",
            },
            {
                tipo: "Veículos de transporte de passageiros",
                descricao: "Ônibus, micro-ônibus e veículos de transporte coletivo",
                aliquota: 0.01,
                fonte: "SEF-SC Notícia 16/12/2025",
            },
            {
                tipo: "Veículos de locadoras",
                descricao: "Veículos registrados para locação",
                aliquota: 0.01,
                fonte: "SEF-SC Notícia 16/12/2025",
            },
        ],

        isencoes: [
            { tipo: "Veículos com 20 anos ou mais de fabricação", obs: "NOVA para 2026 (EC 137/2025). NÃO se aplica a ônibus, micro-ônibus e caminhões. Cerca de 950 mil veículos beneficiados.", fonte: "SEF-SC / EC 137/2025" },
            { tipo: "Motocicletas até 200 cilindradas (incluindo ciclomotores elétricos)", obs: "Condição: sem infrações de trânsito no ano anterior (2025)", fonte: "SEF-SC" },
            { tipo: "Veículos de pessoas com deficiência (física, visual, mental severa/profunda ou autistas)", obs: "Inclui responsáveis legais, mesmo que conduzido por terceiros", fonte: "SEF-SC / NSC Total" },
            { tipo: "Táxis e mototáxis", fonte: "SEF-SC" },
            { tipo: "Veículos de corpos de bombeiros voluntários", fonte: "SEF-SC" },
            { tipo: "Veículos de consulados", tipo_beneficio: "IMUNIDADE", fonte: "SEF-SC" },
            { tipo: "Veículos de instituições religiosas, educação e assistência social", tipo_beneficio: "IMUNIDADE", fonte: "SEF-SC" },
            { tipo: "Veículos de partidos políticos", tipo_beneficio: "IMUNIDADE", fonte: "SEF-SC" },
        ],

        calendario_2026: {
            forma_pagamento: [
                "Cota única: até o final de cada mês conforme final da placa",
                "Parcelamento em 3x sem juros: dia 10 de cada mês conforme placa",
                "Parcelamento em até 12x no cartão de crédito (empresa credenciada)",
            ],
            cota_unica_por_placa: [
                { final_placa: 1, vencimento: "31/01/2026" },
                { final_placa: 2, vencimento: "28/02/2026" },
                { final_placa: 3, vencimento: "31/03/2026" },
                { final_placa: 4, vencimento: "30/04/2026" },
                { final_placa: 5, vencimento: "31/05/2026" },
                { final_placa: 6, vencimento: "30/06/2026" },
                { final_placa: 7, vencimento: "31/07/2026" },
                { final_placa: 8, vencimento: "31/08/2026" },
                { final_placa: 9, vencimento: "30/09/2026" },
                { final_placa: 0, vencimento: "31/10/2026" },
            ],
            parcelado_3x: [
                { final_placa: 1, cotas: ["10/01", "10/02", "10/03"] },
                { final_placa: 2, cotas: ["10/02", "10/03", "10/04"] },
                { final_placa: 3, cotas: ["10/03", "10/04", "10/05"] },
                { final_placa: 4, cotas: ["10/04", "10/05", "10/06"] },
                { final_placa: 5, cotas: ["10/05", "10/06", "10/07"] },
                { final_placa: 6, cotas: ["10/06", "10/07", "10/08"] },
                { final_placa: 7, cotas: ["10/07", "10/08", "10/09"] },
                { final_placa: 8, cotas: ["10/08", "10/09", "10/10"] },
                { final_placa: 9, cotas: ["10/09", "10/10", "10/11"] },
                { final_placa: 0, cotas: ["10/10", "10/11", "10/12"] },
            ],
            desconto_cota_unica: null,
            obs_desconto: "SC não divulgou desconto específico para cota única em 2026",
        },

        arrecadacao_prevista_2026: "R$ 4,7 bilhões (crescimento de ~6% sobre 2025)",
        frota_total: 6400000,
        frota_tributavel: 4200000,
        comparativo: "SC tem IPVA entre os menores do país. Atrás apenas do PR (1,9% em 2026). Empatado com AC e ES (2%)",

        legislacao: [
            { norma: "Lei nº 7.543/1988", assunto: "IPVA — fato gerador, base, alíquotas" },
            { norma: "Emenda Constitucional nº 137/2025", assunto: "Isenção IPVA veículos 20+ anos" },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  4. ITCMD — IMPOSTO TRANSMISSÃO CAUSA MORTIS E DOAÇÃO
    // ═══════════════════════════════════════════════════════════════

    itcmd: {
        nome_completo: "Imposto sobre Transmissão Causa Mortis e Doação",
        explicacao: "Imposto estadual sobre heranças (causa mortis) e doações. SC já adota progressividade há muitos anos, com faixas de 1% a 8%. Impacto da LC 227/2026 é menor que em outros estados.",
        base_legal: "Lei nº 13.136/2004",
        url_lei: "https://legislacao.sef.sc.gov.br/",
        fato_gerador: "Transmissão por herança (causa mortis) ou por doação de quaisquer bens ou direitos",
        base_calculo: "Valor de mercado do bem (NÃO valor venal do IPTU)",
        declaracao_sistema: "DIEF-ITCMD (Declaração de Imposto sobre Transmissão)",
        url_servico: "https://www.sef.sc.gov.br/servicos/",

        aliquotas: {
            tipo: "Progressivas conforme faixa de valor",
            faixas: [
                { faixa: "Até R$ 20.000,00", aliquota: 0.01, valor_min: 0, valor_max: 20000 },
                { faixa: "De R$ 20.000,01 a R$ 50.000,00", aliquota: 0.03, valor_min: 20000.01, valor_max: 50000 },
                { faixa: "De R$ 50.000,01 a R$ 100.000,00", aliquota: 0.05, valor_min: 50000.01, valor_max: 100000 },
                { faixa: "De R$ 100.000,01 a R$ 500.000,00", aliquota: 0.06, valor_min: 100000.01, valor_max: 500000 },
                { faixa: "Acima de R$ 500.000,00", aliquota: 0.08, valor_min: 500000.01, valor_max: Infinity },
            ],
            fonte: "Lei 13.136/2004 — Verificado em múltiplas fontes (NR Advocacia, JusBrasil, Tabelionato Porto Belo)",
        },

        progressividade: {
            implementada: true,
            obrigatoria_ec_132: true,
            observacao: "SC já adota progressividade há muitos anos. Impacto da LC 227/2026 é menor que em outros estados.",
            fonte: "Instagram oficial SEF-SC 14/01/2026",
        },

        isencoes: [
            { tipo: "Transmissão de imóvel residencial de valor até determinado limite para família de baixa renda", obs: "Consultar legislação atualizada" },
            { tipo: "Doações para entidades de utilidade pública", obs: "Conforme legislação" },
        ],

        reforma_tributaria: {
            ec_132_2023: "Obriga progressividade por valor do quinhão/doação",
            lc_227_2026: "Normas gerais — confirma progressividade obrigatória",
            impacto_sc: "SC já adota progressividade — impacto menor",
        },

        legislacao: [
            { norma: "Lei nº 13.136/2004", assunto: "ITCMD — fato gerador, base, alíquotas progressivas" },
            { norma: "EC nº 132/2023", assunto: "Progressividade obrigatória" },
            { norma: "LC nº 227/2026", assunto: "Normas gerais ITCMD progressivo" },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  5. ISS — IMPOSTO SOBRE SERVIÇOS (Florianópolis — referência)
    // ═══════════════════════════════════════════════════════════════

    iss: {
        municipio_referencia: "Florianópolis",
        base_legal: "Lei Complementar Municipal nº 126/2003 (alterou LC 07/97) — Regulamento: Decreto 2.154/2003",
        base_legal_nacional: "Lei Complementar nº 116/2003",
        sistema_declaracao: "SefinNet — Declaração Eletrônica de Serviços",
        url_iss: "https://www.pmf.sc.gov.br/entidades/fazenda/index.php?cms=iss",
        suporte_tel: "(48) 3213-5518",

        aliquotas: {
            minima: 0.02,
            maxima: 0.05,
            mais_comum: 0.05,
        },

        por_tipo_servico: {
            informatica: {
                aliquota: 0.05,
                descricao: "Serviços de informática (análise, programação, processamento de dados, etc.)",
                subitens_lc116: ["1.01", "1.02", "1.03", "1.04", "1.05", "1.06", "1.07", "1.08"],
            },
            saude: {
                aliquota: 0.05,
                descricao: "Serviços de saúde, assistência médica, odontológica",
                subitens_lc116: ["4.01", "4.02", "4.03"],
            },
            construcao_civil: {
                aliquota: 0.025,
                descricao: "Execução de obras de construção civil, engenharia",
                subitens_lc116: ["7.02", "7.05"],
                obs: "Subitens 7.02 e 7.05 — alíquota de 2,5%",
            },
            limpeza_manutencao: {
                aliquota: 0.05,
                descricao: "Limpeza, manutenção e conservação",
                subitens_lc116: ["7.10"],
            },
            decoracao_jardinagem: {
                aliquota: 0.025,
                descricao: "Decoração e jardinagem, inclusive corte e poda de árvores",
                subitens_lc116: ["7.10"],
                obs: "Subitem 7.10 — alíquota de 2,5%",
            },
            educacao: {
                aliquota: 0.02,
                descricao: "Ensino regular pré-escolar, fundamental, médio e superior",
                subitens_lc116: ["8.01"],
                obs: "Subitens 8.01 — alíquota de 2%",
            },
            hospedagem: {
                aliquota: 0.02,
                descricao: "Hospedagem de qualquer natureza em hotéis, pousadas, etc.",
                subitens_lc116: ["9.01"],
                obs: "Subitem 9.01 — alíquota de 2% (verificar legislação atualizada)",
            },
            intermediacao: {
                aliquota: 0.025,
                descricao: "Agenciamento, corretagem ou intermediação de bens móveis ou imóveis",
                subitens_lc116: ["10.05", "10.09"],
                obs: "Subitens 10.05 e 10.09 — alíquota de 2,5% e 2%",
            },
            guarda_estacionamento: {
                aliquota: 0.025,
                descricao: "Guarda e estacionamento de veículos",
                subitens_lc116: ["11.02"],
                obs: "Subitem 11.02 — alíquota de 2,5%",
            },
            espetaculos: {
                aliquota: 0.025,
                descricao: "Espetáculos artísticos, shows, cinemas, teatros",
                subitens_lc116: ["12.01", "12.02", "12.03"],
            },
            transporte_municipal: {
                aliquota: 0.05,
                descricao: "Transporte de natureza municipal",
                subitens_lc116: ["16.01"],
            },
            servicos_portuarios: {
                aliquota: 0.025,
                descricao: "Serviços portuários, aeroportuários, de terminais rodoviários",
                subitens_lc116: ["20.01", "20.02", "20.03"],
            },
            contabilidade_auditoria: {
                aliquota: 0.05,
                descricao: "Serviços de contabilidade, auditoria, consultoria",
                subitens_lc116: ["17.01", "17.02", "17.03"],
            },
            assessoria_consultoria: {
                aliquota: 0.025,
                descricao: "Assessoria e consultoria de qualquer natureza (selecionados)",
                subitens_lc116: ["17.04", "17.05", "17.12"],
                obs: "Subitens 17.04, 17.05 e 17.12 — alíquota de 2,5%",
            },
            advocacia: {
                aliquota: 0.05,
                descricao: "Serviços advocatícios",
                subitens_lc116: ["17.13", "17.14"],
            },
            demais_servicos: {
                aliquota: 0.05,
                descricao: "Demais serviços não especificados acima",
            },
        },

        trabalho_pessoal: {
            descricao: "Quando serviço é prestado sob forma de trabalho pessoal do próprio contribuinte (autônomo), o ISS é fixo e anual, conforme grau de escolaridade",
            valores: {
                nivel_superior: "Valor fixo anual — consultar Decreto 2.154/2003",
                nivel_medio: "Valor fixo anual — consultar Decreto 2.154/2003",
                demais: "Valor fixo anual — consultar Decreto 2.154/2003",
            },
            base_legal: "Art. 10, RISSQN Florianópolis / Decreto 2.154/2003",
        },

        municipios: [
            { nome: "Florianópolis", iss_geral: 5.0 },
            { nome: "Joinville", iss_geral: 5.0 },
            { nome: "Blumenau", iss_geral: 5.0 },
            { nome: "Chapecó", iss_geral: 5.0 },
            { nome: "Itajaí", iss_geral: 5.0 },
            { nome: "Criciúma", iss_geral: 5.0 },
            { nome: "Jaraguá do Sul", iss_geral: 5.0 },
            { nome: "Balneário Camboriú", iss_geral: 5.0 },
            { nome: "Lages", iss_geral: 5.0 },
            { nome: "São José", iss_geral: 5.0 },
        ],

        legislacao: [
            { norma: "Lei Complementar Municipal nº 126/2003", assunto: "ISS Florianópolis" },
            { norma: "Decreto 2.154/2003", assunto: "Regulamento ISS Florianópolis" },
            { norma: "Lei Complementar nº 116/2003", assunto: "Federal — normas gerais ISS" },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  6. IPTU — IMPOSTO PREDIAL E TERRITORIAL URBANO (Florianópolis)
    // ═══════════════════════════════════════════════════════════════

    iptu: {
        municipio_referencia: "Florianópolis",
        base_legal: "Lei Complementar nº 53/2008 (Código Tributário de Florianópolis)",
        url_servico: "https://www.pmf.sc.gov.br/servicos/index.php?pagina=servcategoria&idCidadao=24",

        residencial: {
            aliquota_min: 0.003,
            aliquota_max: 0.03,
            obs: "Varia conforme valor venal e localização do imóvel",
        },
        comercial: {
            aliquota_min: 0.008,
            aliquota_max: 0.03,
            obs: "Varia conforme valor venal e localização do imóvel",
        },
        industrial: {
            dados_disponiveis: false,
            obs: "Alíquotas industriais não localizadas em fonte pública acessível",
        },
        terreno_nao_edificado: {
            dados_disponiveis: false,
            obs: "Alíquota para terrenos não edificados pode ser progressiva no tempo (IPTU progressivo)",
        },

        beneficios_fiscais: {
            total_isencoes: 18,
            descricao: "18 tipos de isenção disponíveis no município",
            programa_sustentavel: {
                nome: "IPTU Sustentável",
                descricao: "Programa de redução do IPTU para imóveis com práticas sustentáveis (energia solar, cisterna, etc.)",
                dados_disponiveis: true,
            },
        },

        desconto_pagamento: {
            descricao: "Desconto para pagamento antecipado",
            prazo_2026: "Até 05/01/2026",
            percentual: null,
            obs: "Valor do desconto não localizado — consultar Prefeitura",
        },

        legislacao: [
            { norma: "Lei Complementar nº 53/2008", assunto: "Código Tributário de Florianópolis — IPTU" },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  7. ITBI — IMPOSTO TRANSMISSÃO DE BENS IMÓVEIS (Florianópolis)
    // ═══════════════════════════════════════════════════════════════

    itbi: {
        municipio_referencia: "Florianópolis",
        base_legal: "Lei Complementar nº 53/2008 (Código Tributário de Florianópolis)",
        url_servico: "https://www.pmf.sc.gov.br/entidades/fazenda/index.php?cms=itbi&menu=4&submenuid=193",

        aliquotas: {
            geral: 0.02,
            percentual: "2%",
            reduzida: 0.005,
            percentual_reduzida: "0,5%",
        },
        condicoes_reducao: "Alíquota de 0,5% para casos específicos (ex: primeira aquisição pelo SFH — Sistema Financeiro de Habitação)",
        base_calculo: "Valor da transação ou valor de avaliação do município (o maior)",
        fato_gerador: "Transmissão onerosa, entre vivos, de bens imóveis e direitos reais sobre imóveis",

        legislacao: [
            { norma: "Lei Complementar nº 53/2008", assunto: "Código Tributário de Florianópolis — ITBI" },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  8. TAXAS ESTADUAIS E MUNICIPAIS
    // ═══════════════════════════════════════════════════════════════

    taxas: {

        estaduais: {
            dados_disponiveis: false,
            obs: "Informações sobre taxas estaduais não foram localizadas em fontes públicas acessíveis",
            taxas_conhecidas: [
                {
                    taxa: "Taxas DETRAN-SC",
                    descricao: "Taxas de emplacamento, transferência de veículos, licenciamento",
                    orgao: "DETRAN-SC",
                    dados_disponiveis: false,
                },
                {
                    taxa: "TFUSP",
                    descricao: "Taxa de Fiscalização de Uso de Solo e Posturas",
                    dados_disponiveis: false,
                },
                {
                    taxa: "TPEI",
                    descricao: "Taxa de Proteção e Estímulo à Indústria",
                    dados_disponiveis: false,
                },
                {
                    taxa: "Taxas Ambientais",
                    descricao: "IMA — Instituto do Meio Ambiente de SC",
                    dados_disponiveis: false,
                },
                {
                    taxa: "Taxas Judiciais",
                    descricao: "Taxas do Poder Judiciário de SC",
                    dados_disponiveis: false,
                },
            ],
        },

        municipais_florianopolis: {
            municipio_referencia: "Florianópolis",
            dados_disponiveis: false,
            taxas_conhecidas: [
                { taxa: "COSIP", descricao: "Contribuição para Iluminação Pública" },
                { taxa: "Taxa de Coleta de Lixo", descricao: "Taxa de coleta e destinação de resíduos sólidos" },
                { taxa: "Taxa de Alvará", descricao: "Taxa de licença para funcionamento" },
                { taxa: "Taxa de Habite-se", descricao: "Taxa para certificado de conclusão de obra" },
            ],
        },
    },


    // ═══════════════════════════════════════════════════════════════
    //  9. IMPOSTOS FEDERAIS (aplicáveis em SC)
    // ═══════════════════════════════════════════════════════════════

    federal: {
        obs: "Impostos federais são iguais em todo o Brasil. Dados abaixo são padrões nacionais 2026.",

        irpj: {
            lucro_real: {
                aliquota_base: 0.15,
                adicional: { aliquota: 0.10, limite_mensal: 20000, limite_anual: 240000 },
                aliquota_efetiva_maxima: 0.25,
            },
            lucro_presumido: {
                aliquota_base: 0.15,
                presuncao_lucro: {
                    comercio: 0.08,
                    servicos_geral: 0.32,
                    industria: 0.08,
                    transporte_carga: 0.08,
                    transporte_passageiros: 0.16,
                    servicos_saude: 0.08,
                    construcao_civil: 0.08,
                },
                adicional: { aliquota: 0.10, limite_mensal: 20000 },
            },
            incentivos_regionais: {
                sudam: { aplicavel: false, obs: "SC NÃO está na área da SUDAM" },
                sudene: { aplicavel: false, obs: "SC NÃO está na área da SUDENE" },
            },
            particularidade_sc: "Não há incentivo regional de IRPJ em SC (não é SUDAM/SUDENE). Porém empresas podem acessar TTDs estaduais de ICMS.",
        },

        irpf: {
            tabela_mensal_2026: [
                { ate: 2112.00, aliquota: 0, deducao: 0 },
                { ate: 2826.65, aliquota: 0.075, deducao: 158.40 },
                { ate: 3751.05, aliquota: 0.15, deducao: 370.40 },
                { ate: 4664.68, aliquota: 0.225, deducao: 651.73 },
                { ate: Infinity, aliquota: 0.275, deducao: 884.96 },
            ],
            desconto_simplificado: 528.00,
            obs: "Desconto simplificado de R$ 528,00 na faixa de isenção (efetiva até ~R$ 2.640,00)",
        },

        csll: {
            aliquota_geral: 0.09,
            presuncao: {
                comercio: 0.12,
                servicos: 0.32,
                servicos_hospitalares: 0.12,
            },
        },

        pis: {
            cumulativo: 0.0065,
            nao_cumulativo: 0.0165,
        },

        cofins: {
            cumulativo: 0.03,
            nao_cumulativo: 0.076,
        },

        ipi: {
            referencia: "Tabela TIPI vigente",
            obs: "SC tem forte base industrial (têxtil, alimentício, metalúrgico, madeireiro, tecnológico)",
        },

        inss: {
            patronal: {
                aliquota: 0.20,
                adicional_rat: "RAT 1%-3% conforme grau de risco da atividade",
                adicional_fap: "FAP — Fator Acidentário de Prevenção (0,5 a 2,0)",
                obs: "Alíquota efetiva = 20% + RAT x FAP + Terceiros (Sistema S, SENAI, SESI, etc.)",
            },
            empregado: {
                tabela_2026: [
                    { ate: 1518.00, aliquota: 0.075 },
                    { ate: 2793.88, aliquota: 0.09 },
                    { ate: 4190.83, aliquota: 0.12 },
                    { ate: 8157.41, aliquota: 0.14 },
                ],
                teto_previdenciario: 8157.41,
                obs: "Alíquotas progressivas — cada faixa incide apenas sobre a parcela correspondente",
            },
        },

        fgts: {
            aliquota: 0.08,
            multa_rescisoria: 0.40,
        },

        iof: {
            credito_pj: "0,0041%/dia + 0,38%",
            credito_pf: "0,0082%/dia + 0,38%",
            cambio: "1,1% (compras internacionais)",
            seguro: "0,38% a 7,38%",
        },

        imposto_importacao: {
            referencia: "Tarifa Externa Comum (TEC) — MERCOSUL",
            obs_sc: "SC é um dos maiores estados importadores do Brasil, com benefícios TTD 409/410/411/77 para importadores",
        },

        imposto_exportacao: {
            aliquota_geral: 0.00,
            obs: "Exceções: cigarros, armas, commodities específicas",
        },

        itr: {
            aliquota: "0,03% a 20% (progressiva conforme área e grau de utilização)",
            obs: "SC tem significativa produção agrícola e pode ser cobrado pelo município conveniado",
        },
    },


    // ═══════════════════════════════════════════════════════════════
    //  10. SIMPLES NACIONAL (aplicável em SC)
    // ═══════════════════════════════════════════════════════════════

    simples_nacional: {
        nome: "Regime Especial Unificado de Arrecadação de Tributos e Contribuições — Simples Nacional",
        explicacao: "Regime tributário simplificado para micro e pequenas empresas. Unifica 8 tributos em uma única guia (DAS). As alíquotas variam de 4% a 33% conforme faturamento e atividade.",
        base_legal: "Lei Complementar nº 123/2006",

        sublimite_estadual: 3600000,
        adota_sublimite: true,

        limites: {
            mei: { limite_anual: 81000, descricao: "Microempreendedor Individual" },
            microempresa: 360000,
            epp: 4800000,
        },

        sublimite_icms_iss: {
            valor: 3600000,
            descricao: "Sublimite estadual de SC para ICMS e ISS dentro do Simples Nacional",
            consequencia: "Acima de R$ 3,6 mi de RBT12, a empresa recolhe ICMS e ISS fora do Simples (apuração normal), mas demais tributos federais continuam no Simples até R$ 4,8 mi",
            base_legal: "LC 123/2006, art. 19 e 20",
            obs: "SC adota sublimite de R$ 3.600.000,00 (igual à maioria dos estados)",
        },

        mei_2026: {
            valor_mensal_comercio_industria: 75.90,
            valor_mensal_servicos: 79.90,
            valor_mensal_comercio_servicos: 81.90,
            obs: "Valores sujeitos a reajuste com salário mínimo",
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
                    { faixa: 6, limite: 4800000, aliquota: 0.19, deducao: 378000 },
                ],
            },
            anexo_II: {
                nome: "Indústria",
                faixas: [
                    { faixa: 1, limite: 180000, aliquota: 0.045, deducao: 0 },
                    { faixa: 2, limite: 360000, aliquota: 0.078, deducao: 5940 },
                    { faixa: 3, limite: 720000, aliquota: 0.10, deducao: 13860 },
                    { faixa: 4, limite: 1800000, aliquota: 0.112, deducao: 22500 },
                    { faixa: 5, limite: 3600000, aliquota: 0.147, deducao: 85500 },
                    { faixa: 6, limite: 4800000, aliquota: 0.30, deducao: 720000 },
                ],
            },
            anexo_III: {
                nome: "Serviços (locação, reparos, agência de viagem, etc.)",
                faixas: [
                    { faixa: 1, limite: 180000, aliquota: 0.06, deducao: 0 },
                    { faixa: 2, limite: 360000, aliquota: 0.112, deducao: 9360 },
                    { faixa: 3, limite: 720000, aliquota: 0.135, deducao: 17640 },
                    { faixa: 4, limite: 1800000, aliquota: 0.16, deducao: 35640 },
                    { faixa: 5, limite: 3600000, aliquota: 0.21, deducao: 125640 },
                    { faixa: 6, limite: 4800000, aliquota: 0.33, deducao: 648000 },
                ],
            },
            anexo_IV: {
                nome: "Serviços (construção, advocacia, vigilância)",
                faixas: [
                    { faixa: 1, limite: 180000, aliquota: 0.045, deducao: 0 },
                    { faixa: 2, limite: 360000, aliquota: 0.09, deducao: 8100 },
                    { faixa: 3, limite: 720000, aliquota: 0.102, deducao: 12420 },
                    { faixa: 4, limite: 1800000, aliquota: 0.14, deducao: 39780 },
                    { faixa: 5, limite: 3600000, aliquota: 0.22, deducao: 183780 },
                    { faixa: 6, limite: 4800000, aliquota: 0.33, deducao: 828000 },
                ],
                obs: "CPP NÃO incluída — recolher INSS patronal à parte (20% + RAT + Terceiros)",
            },
            anexo_V: {
                nome: "Serviços (TI, engenharia, auditoria, jornalismo)",
                faixas: [
                    { faixa: 1, limite: 180000, aliquota: 0.155, deducao: 0 },
                    { faixa: 2, limite: 360000, aliquota: 0.18, deducao: 4500 },
                    { faixa: 3, limite: 720000, aliquota: 0.195, deducao: 9900 },
                    { faixa: 4, limite: 1800000, aliquota: 0.205, deducao: 17100 },
                    { faixa: 5, limite: 3600000, aliquota: 0.23, deducao: 62100 },
                    { faixa: 6, limite: 4800000, aliquota: 0.305, deducao: 540000 },
                ],
                obs: "Fator R >= 28% -> migra para Anexo III (alíquotas menores)",
            },
        },

        fator_r: {
            descricao: "Empresas do Anexo V com folha de pagamento >= 28% do faturamento dos últimos 12 meses podem ser tributadas pelo Anexo III (mais favorável)",
            limiar: 0.28,
        },
    },


    // ═══════════════════════════════════════════════════════════════
    //  11. INCENTIVOS FISCAIS E BENEFÍCIOS REGIONAIS
    // ═══════════════════════════════════════════════════════════════

    incentivos: {
        obs: "SC possui um dos mais robustos sistemas de incentivos fiscais do Brasil, especialmente para importação e e-commerce",

        sudam: { aplicavel: false, obs: "SC NÃO está na área da SUDAM" },
        sudene: { aplicavel: false, obs: "SC NÃO está na área da SUDENE" },
        zona_franca: { aplicavel: false, obs: "SC NÃO possui Zona Franca" },
        alc: { aplicavel: false, obs: "SC NÃO possui Área de Livre Comércio" },

        programas_estaduais: [
            {
                nome: "PRODEC — Programa de Desenvolvimento da Empresa Catarinense",
                tipo: "Postergação de ICMS",
                descricao: "Incentivo à implantação ou expansão de empreendimentos industriais. Postergação de percentual do ICMS gerado pelo novo projeto. Criado em 1988.",
                beneficio: "Postergação de percentual pré-determinado sobre o valor do ICMS",
                industria_40: "Indústrias com tecnologias de indústria 4.0 podem ter juros zero na devolução do ICMS postergado",
                base_legal: "Lei Estadual / SEF-SC",
            },
            {
                nome: "Pró-Emprego",
                tipo: "Desoneração de ICMS",
                descricao: "Geração de emprego e renda por meio de tratamento tributário diferenciado do ICMS. Desoneração na aquisição de bens, mercadorias e serviços. Criado em 2007.",
                beneficio: "Desoneração de ICMS na aquisição de bens, mercadorias e serviços",
                base_legal: "Lei Estadual / SEF-SC",
            },
            {
                nome: "TTD 409 — Importação Comercialização",
                tipo: "Crédito presumido + Diferimento ICMS",
                descricao: "Tratamento para empresas que importam pelo estado de SC. Reduz ICMS de importação de 17% para entre 0,6% e 2,6%.",
                beneficio_diferimento: "ICMS da importação é diferido para o momento da venda",
                beneficio_credito_presumido: "Crédito presumido na saída, reduzindo carga tributária final",
                cargas_tributarias: [
                    { operacao: "Mercadoria com similar nacional (alíquota 4%)", carga_final: "1,4%" },
                    { operacao: "Operações com aço, alumínio, cobre, coque e prata", carga_final: "0,6%" },
                    { operacao: "Mercadoria sem similar (alíquota 12%)", carga_final: "2,5%" },
                    { operacao: "Saída interestadual 7%", carga_final: "1,0%" },
                    { operacao: "Saída interestadual 12%", carga_final: "2,1% a 3,6%" },
                ],
                obrigacoes: [
                    "Contratar despachante aduaneiro catarinense",
                    "Utilizar preferencialmente transporte rodoviário catarinense",
                    "Contribuir para Fundos Especiais (FUMDES — 0,4%)",
                    "Recolher ICMS antecipado de 2,60% nos primeiros 36 meses",
                ],
                base_legal: "RICMS/SC Anexo II, art. 246 / Decreto 2.128/2009",
            },
            {
                nome: "TTD 410 — Importação Sem Antecipação",
                tipo: "Dispensa de antecipação ICMS",
                descricao: "Semelhante ao TTD 409, porém dispensa o recolhimento antecipado a cada desembaraço aduaneiro.",
                beneficio: "Dispensa antecipação, liberação de fluxo de caixa",
                requisito: "Ter utilizado TTD 409 previamente + sem débitos fiscais",
                base_legal: "SEF-SC",
            },
            {
                nome: "TTD 411 — Importação com Garantia",
                tipo: "Similar ao TTD 410 com garantia",
                descricao: "Semelhante ao TTD 410, porém exige pagamento de garantia.",
                base_legal: "SEF-SC",
            },
            {
                nome: "TTD 77 — Importação Matéria-Prima Industrial",
                tipo: "Diferimento total (0%)",
                descricao: "Importação de matéria-prima, materiais secundários ou embalagens com ICMS diferido a 0%, beneficiando indústrias catarinenses.",
                beneficio: "ICMS diferido = 0% na importação de insumos industriais",
                base_legal: "SEF-SC",
            },
            {
                nome: "TTD 478 — E-commerce",
                tipo: "Crédito presumido ICMS",
                descricao: "Incentivo para empresas de e-commerce em SC. Crédito presumido em substituição aos créditos efetivos de ICMS nas vendas interestaduais ao consumidor final.",
                beneficio: "Carga tributária efetiva de 1,4% a 2,4% nas vendas interestaduais",
                obrigacoes: [
                    "Estorno dos créditos de ICMS das aquisições",
                    "Utilização de crédito presumido em substituição",
                    "Recolhimento de 0,4% ao Fundo Social (FUMDES)",
                    "Empresas Lucro Real: recolhimento de 2% sobre IRPJ devido (1% FIA + 1% FEI)",
                ],
                exemplo_calculo: {
                    venda_interestadual_12: {
                        debito_icms: 24.00,
                        estorno_credito: 12.00,
                        credito_presumido: 20.00,
                        fundo_social: 0.80,
                        valor_recolhido: 4.80,
                        carga_efetiva: "2,4%",
                        reducao: "60% em relação ao regime normal",
                    },
                },
                base_legal: "RICMS/SC / SEF-SC",
            },
            {
                nome: "TTD 489 — Transferência de Créditos",
                tipo: "Limites adicionais para transferência de créditos",
                descricao: "Autoriza limites adicionais para transferência de créditos acumulados de ICMS de operações destinadas ao exterior, isentas ou diferidas. Condicionado a investimentos em expansão ou criação de novos negócios. Criado em 2019.",
                base_legal: "SEF-SC",
            },
            {
                nome: "Pró-Cargas",
                tipo: "Tratamento tributário especial para logística",
                descricao: "Tratamento tributário especial para ICMS na atividade portuária e logística.",
                base_legal: "Lei Estadual / SEF-SC",
            },
        ],

        incentivos_inovacao: {
            lei_do_bem: {
                descricao: "Deduções de IRPJ e CSLL para empresas que investem em P&D",
                aplicavel: true,
                obs: "Federal, aplicável a empresas de SC no Lucro Real",
            },
            acate: {
                descricao: "Associação Catarinense de Tecnologia — polo tecnológico de Florianópolis",
                obs: "Florianópolis é um dos principais polos de tecnologia do Brasil",
            },
        },

        refis_2026: {
            descricao: "Novo programa de refinanciamento de dívidas tributárias aprovado pela ALESC em dezembro/2025",
            impostos_contemplados: ["IPVA", "ITCMD", "ICMS"],
            desconto_multas_juros: "Até 95% de desconto sobre multas e juros",
            parcelamento: "Até 72 vezes (ICMS e ITCMD). IPVA sem parcelamento (apenas desconto)",
            fonte: "SEF-SC / Lei Orçamentária 2026",
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
        lc_227_2026: {
            nome: "Comitê Gestor do IBS + Normas gerais ITCMD",
            itcmd: "Confirma progressividade obrigatória; competência territorial; bens exterior",
            comite_gestor: "CG-IBS para coordenação da arrecadação entre estados e municípios",
            impacto_sc: "SC já adota progressividade — impacto menor que em outros estados",
        },

        ibs_cbs_2026: {
            cbs: { aliquota: 0.009, descricao: "Contribuição sobre Bens e Serviços — 0,9% (alíquota teste)" },
            ibs: { aliquota: 0.001, descricao: "Imposto sobre Bens e Serviços — 0,1% (alíquota teste)" },
            integra_base_icms_2026: false,
            descricao: "IBS e CBS NÃO integram a base de cálculo do ICMS em 2026",
            finalidade: "Alíquotas apenas informativas e educativas, para adaptação dos sistemas",
        },

        cronograma: {
            "2026": "Alíquotas teste (0,9% CBS + 0,1% IBS). Não integram base do ICMS. Coexistência.",
            "2027": "Início da implementação gradual",
            "2029": "Fase de transição — coeficiente de participação dos estados no IBS começa a ser calculado (média 2019-2026)",
            "2033": "Extinção do ICMS e ISS",
            "2077": "Fim do período de transição para distribuição do IBS",
        },

        impacto_sc: {
            arrecadacao_media: "Média de arrecadação ICMS 2019-2026 definirá participação no IBS (2029-2077)",
            importancia_refis: "Cada R$ 1 bi arrecadado hoje = +R$ 13 bi em 50 anos no IBS",
            itcmd: "SC já adota progressividade — impacto da LC 227/2026 é menor que em outros estados",
            obs: "Pelo menos 22 estados implementaram novos REFIS para elevar média de arrecadação",
        },

        imposto_seletivo: {
            descricao: "Imposto Seletivo (IS) — Imposto sobre produtos prejudiciais à saúde ou ao meio ambiente",
            produtos: ["Bebidas alcoólicas", "Cigarros", "Bebidas açucaradas", "Veículos poluentes", "Mineração"],
            status: "Regulamentação pendente",
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
            "Dados gerais de SC (IBGE, SEF-SC, portos)",
            "ICMS (alíquota padrão 17%, diferenciadas 25%/12%, interestaduais, DIFAL)",
            "ICMS combustíveis monofásico 2026 (gasolina R$1,57/L, diesel R$1,17/L, GLP R$1,47/kg)",
            "IPVA (alíquotas 2% passeio, 1% motos/carga/locadoras — completo)",
            "IPVA isenções completas (20+ anos, PcD, motos até 200cc, táxis, bombeiros, consulados)",
            "IPVA calendário 2026 completo (cota única + parcelamento 3x)",
            "ITCMD (progressivo 1%-8% em 5 faixas — completo)",
            "ISS Florianópolis (alíquotas 2%-5% por tipo de serviço)",
            "IPTU Florianópolis (0,3%-3,0% residencial, 0,8%-3,0% comercial)",
            "ITBI Florianópolis (2% padrão, 0,5% reduzida)",
            "Impostos Federais (IRPJ, CSLL, PIS, COFINS, IPI, IOF, II, IE, ITR, INSS, FGTS, IRPF)",
            "Simples Nacional (sublimite R$ 3.600.000, anexos e Fator R)",
            "Incentivos fiscais (PRODEC, Pró-Emprego, TTDs 409/410/411/77/478/489, Pró-Cargas)",
            "Reforma Tributária (IBS/CBS 2026, cronograma, impacto SC)",
            "REFIS 2026 (até 95% desconto multa/juros, até 72x parcelamento)",
        ],
        nao_localizados: [
            "Tabela completa de alíquotas ICMS por NCM/produto",
            "MVAs completas de substituição tributária por segmento",
            "Taxas estaduais específicas (DETRAN, ambientais, judiciais)",
            "Taxas municipais de Florianópolis (COSIP, lixo, alvará)",
            "IPTU alíquota industrial Florianópolis",
            "IPTU alíquota terreno não edificado Florianópolis",
            "Desconto IPVA cota única (percentual não divulgado)",
            "Valores fixos ISS profissionais autônomos Florianópolis",
            "Emolumentos cartorários SC",
            "Detalhes completos do IPTU Sustentável (percentuais de redução)",
        ],
        contatos_para_completar: [
            { orgao: "SEF-SC", url: "https://www.sef.sc.gov.br/", tel: "(48) 3665-2504" },
            { orgao: "Prefeitura de Florianópolis — Secretaria Municipal da Fazenda", url: "https://www.pmf.sc.gov.br/entidades/fazenda/", tel: "(48) 3213-5555" },
            { orgao: "DETRAN-SC", url: "https://www.detran.sc.gov.br/" },
            { orgao: "Receita Federal", url: "https://www.gov.br/receitafederal", tel: "146" },
        ],
    },
};


// ═══════════════════════════════════════════════════════════════════════════
//  14. FUNÇÕES UTILITÁRIAS — SANTA CATARINA
// ═══════════════════════════════════════════════════════════════════════════

/** Retorna a alíquota de ISS para um tipo de serviço em Florianópolis */
function getISSSantaCatarina(tipo) {
    const servico = SANTA_CATARINA_TRIBUTARIO.iss.por_tipo_servico[tipo];
    return servico ? servico.aliquota : SANTA_CATARINA_TRIBUTARIO.iss.aliquotas.mais_comum;
}

/** Retorna a alíquota de IPVA conforme tipo de veículo */
function getIPVASantaCatarina(tipo) {
    const mapa = {
        passeio: 0.02,
        auto: 0.02,
        utilitario: 0.02,
        suv: 0.02,
        caminhonete: 0.02,
        motor_casa: 0.02,
        moto: 0.01,
        motocicleta: 0.01,
        ciclomotor: 0.01,
        carga: 0.01,
        caminhao: 0.01,
        onibus: 0.01,
        micro_onibus: 0.01,
        locadora: 0.01,
        transporte_passageiros: 0.01,
    };
    return mapa[tipo] || 0.02;
}

/** Calcula IPVA de SC conforme valor e tipo do veículo */
function calcularIPVASantaCatarina(valorVenal, tipo, anoFabricacao) {
    const anoAtual = 2026;
    const idade = anoAtual - anoFabricacao;

    // Isenção para veículos com 20+ anos (exceto ônibus, micro-ônibus e caminhões)
    const tiposNaoIsentos20anos = ["onibus", "micro_onibus", "caminhao"];
    if (idade >= 20 && !tiposNaoIsentos20anos.includes(tipo)) {
        return { valor: 0, aliquota: 0, isento: true, motivo: "Veículo com 20+ anos de fabricação (EC 137/2025)" };
    }

    const aliquota = getIPVASantaCatarina(tipo);
    const valor = valorVenal * aliquota;
    return { valor: Math.round(valor * 100) / 100, aliquota, isento: false, motivo: null };
}

/** Calcula ITCMD de SC conforme valor do bem (progressivo) */
function calcularITCMDSantaCatarina(valor) {
    const faixas = SANTA_CATARINA_TRIBUTARIO.itcmd.aliquotas.faixas;
    let faixaAplicada = "";

    // SC aplica alíquota da faixa sobre o valor TOTAL (não faixa por faixa)
    let aliquotaAplicavel = 0.01;
    for (const f of faixas) {
        if (valor >= f.valor_min && (valor <= f.valor_max || f.valor_max === Infinity)) {
            aliquotaAplicavel = f.aliquota;
            faixaAplicada = f.faixa;
            break;
        }
    }

    const imposto = valor * aliquotaAplicavel;
    const aliquotaEfetiva = valor > 0 ? (imposto / valor) : 0;

    return {
        imposto: Math.round(imposto * 100) / 100,
        aliquota_aplicada: aliquotaAplicavel,
        aliquota_efetiva: Math.round(aliquotaEfetiva * 10000) / 10000,
        faixa: faixaAplicada,
    };
}

/** Calcula DIFAL para vendas de SC para outro estado */
function calcularDIFALSantaCatarina(destino, valor) {
    const aliquotasInternas = {
        AC: 0.19, AL: 0.19, AM: 0.20, AP: 0.18, BA: 0.205, CE: 0.20,
        DF: 0.20, ES: 0.17, GO: 0.19, MA: 0.22, MG: 0.18, MS: 0.17,
        MT: 0.17, PA: 0.19, PB: 0.20, PE: 0.205, PI: 0.215, PR: 0.195,
        RJ: 0.22, RN: 0.20, RO: 0.195, RR: 0.20, RS: 0.17, SC: 0.17,
        SE: 0.19, SP: 0.18, TO: 0.20,
    };

    const sulSudeste = ["SP", "RJ", "MG", "PR", "RS", "SC"];
    const aliquotaInter = sulSudeste.includes(destino) ? 0.12 : 0.07;
    const aliquotaDestino = aliquotasInternas[destino] || 0.17;
    const difal = aliquotaDestino - aliquotaInter;

    return {
        difal_percentual: Math.round(difal * 10000) / 10000,
        difal_valor: Math.round(valor * difal * 100) / 100,
        aliquota_destino: aliquotaDestino,
        aliquota_interestadual: aliquotaInter,
        responsavel: "100% estado de destino",
    };
}

/** Calcula ICMS interno de SC para um produto */
function calcularICMSSantaCatarina(valor, tipo) {
    if (tipo === undefined) tipo = "geral";
    const aliquotas = {
        geral: 0.17,
        superfluo: 0.25,
        cesta_basica: 0.12,
        energia: 0.17,
        combustivel: 0.17,
        telecomunicacoes: 0.17,
    };
    const aliquota = aliquotas[tipo] || 0.17;
    const baseCalculo = valor / (1 - aliquota);
    const icms = baseCalculo - valor;

    return {
        icms: Math.round(icms * 100) / 100,
        aliquota,
        base_calculo: Math.round(baseCalculo * 100) / 100,
        valor_com_icms: Math.round(baseCalculo * 100) / 100,
        obs: "ICMS calculado 'por dentro' (compõe própria base de cálculo)",
    };
}

/** Calcula Simples Nacional estimado para empresa em SC */
function calcularSimplesNacionalSantaCatarina(anexo, rbt12, faturamentoMes) {
    const tabelas = {
        anexo_i: [
            { ate: 180000, aliquota: 0.04, deducao: 0 },
            { ate: 360000, aliquota: 0.073, deducao: 5940 },
            { ate: 720000, aliquota: 0.095, deducao: 13860 },
            { ate: 1800000, aliquota: 0.107, deducao: 22500 },
            { ate: 3600000, aliquota: 0.143, deducao: 87300 },
            { ate: 4800000, aliquota: 0.19, deducao: 378000 },
        ],
        anexo_ii: [
            { ate: 180000, aliquota: 0.045, deducao: 0 },
            { ate: 360000, aliquota: 0.078, deducao: 5940 },
            { ate: 720000, aliquota: 0.10, deducao: 13860 },
            { ate: 1800000, aliquota: 0.112, deducao: 22500 },
            { ate: 3600000, aliquota: 0.147, deducao: 85500 },
            { ate: 4800000, aliquota: 0.30, deducao: 720000 },
        ],
        anexo_iii: [
            { ate: 180000, aliquota: 0.06, deducao: 0 },
            { ate: 360000, aliquota: 0.112, deducao: 9360 },
            { ate: 720000, aliquota: 0.135, deducao: 17640 },
            { ate: 1800000, aliquota: 0.16, deducao: 35640 },
            { ate: 3600000, aliquota: 0.21, deducao: 125640 },
            { ate: 4800000, aliquota: 0.33, deducao: 648000 },
        ],
        anexo_iv: [
            { ate: 180000, aliquota: 0.045, deducao: 0 },
            { ate: 360000, aliquota: 0.09, deducao: 8100 },
            { ate: 720000, aliquota: 0.102, deducao: 12420 },
            { ate: 1800000, aliquota: 0.14, deducao: 39780 },
            { ate: 3600000, aliquota: 0.22, deducao: 183780 },
            { ate: 4800000, aliquota: 0.33, deducao: 828000 },
        ],
        anexo_v: [
            { ate: 180000, aliquota: 0.155, deducao: 0 },
            { ate: 360000, aliquota: 0.18, deducao: 4500 },
            { ate: 720000, aliquota: 0.195, deducao: 9900 },
            { ate: 1800000, aliquota: 0.205, deducao: 17100 },
            { ate: 3600000, aliquota: 0.23, deducao: 62100 },
            { ate: 4800000, aliquota: 0.305, deducao: 540000 },
        ],
    };

    const tabela = tabelas[anexo];
    if (!tabela) return { erro: "Anexo inválido. Use: anexo_i, anexo_ii, anexo_iii, anexo_iv, anexo_v" };

    let faixa = tabela[tabela.length - 1];
    for (const f of tabela) {
        if (rbt12 <= f.ate) {
            faixa = f;
            break;
        }
    }

    const aliquotaEfetiva = rbt12 > 0
        ? (rbt12 * faixa.aliquota - faixa.deducao) / rbt12
        : faixa.aliquota;

    const dasMensal = faturamentoMes * Math.max(aliquotaEfetiva, 0);

    const sublimite = SANTA_CATARINA_TRIBUTARIO.simples_nacional.sublimite_icms_iss.valor;
    let alertaSublimite = null;
    if (rbt12 > sublimite) {
        alertaSublimite = "ATEN\u00C7\u00C3O: RBT12 (R$ " + rbt12.toLocaleString("pt-BR") + ") ultrapassa sublimite SC de R$ " + sublimite.toLocaleString("pt-BR") + ". ICMS e ISS devem ser recolhidos FORA do Simples Nacional.";
    } else if (rbt12 > sublimite * 0.8) {
        alertaSublimite = "AVISO: RBT12 est\u00E1 a " + Math.round((sublimite - rbt12) / 1000) + "k do sublimite SC. Planeje-se.";
    }

    return {
        anexo,
        rbt12,
        faturamento_mes: faturamentoMes,
        faixa_aplicada: "At\u00E9 R$ " + faixa.ate.toLocaleString("pt-BR"),
        aliquota_nominal: faixa.aliquota,
        deducao: faixa.deducao,
        aliquota_efetiva: Math.round(Math.max(aliquotaEfetiva, 0) * 10000) / 10000,
        das_mensal: Math.round(dasMensal * 100) / 100,
        alerta_sublimite: alertaSublimite,
    };
}

/** Calcula IRPF para pessoa física (padrão nacional) */
function calcularIRPFSantaCatarina(rendaMensal) {
    const faixas = [
        { limite: 2112.00, aliquota: 0, deducao: 0 },
        { limite: 2826.65, aliquota: 0.075, deducao: 158.40 },
        { limite: 3751.05, aliquota: 0.15, deducao: 370.40 },
        { limite: 4664.68, aliquota: 0.225, deducao: 651.73 },
        { limite: Infinity, aliquota: 0.275, deducao: 884.96 },
    ];

    const baseCalculo = Math.max(rendaMensal - 528.00, 0);

    let aliquota = 0;
    let deducao = 0;
    for (const f of faixas) {
        if (baseCalculo <= f.limite) {
            aliquota = f.aliquota;
            deducao = f.deducao;
            break;
        }
    }

    const imposto = Math.max(baseCalculo * aliquota - deducao, 0);
    const aliquotaEfetiva = rendaMensal > 0 ? imposto / rendaMensal : 0;

    return {
        renda_mensal: rendaMensal,
        desconto_simplificado: 528.00,
        base_calculo: Math.round(baseCalculo * 100) / 100,
        aliquota_faixa: aliquota,
        imposto_mensal: Math.round(imposto * 100) / 100,
        aliquota_efetiva: Math.round(aliquotaEfetiva * 10000) / 10000,
    };
}

/** Calcula INSS do empregado (progressivo) — padrão nacional */
function calcularINSSSantaCatarina(salario) {
    const faixas = [
        { limite: 1518.00, aliquota: 0.075 },
        { limite: 2793.88, aliquota: 0.09 },
        { limite: 4190.83, aliquota: 0.12 },
        { limite: 8157.41, aliquota: 0.14 },
    ];

    let contribuicao = 0;
    let anterior = 0;

    for (const f of faixas) {
        if (salario <= f.limite) {
            contribuicao += (salario - anterior) * f.aliquota;
            break;
        } else {
            contribuicao += (f.limite - anterior) * f.aliquota;
        }
        anterior = f.limite;
    }

    // Teto
    if (salario > 8157.41) {
        contribuicao = 0;
        anterior = 0;
        for (const f of faixas) {
            contribuicao += (f.limite - anterior) * f.aliquota;
            anterior = f.limite;
        }
    }

    return {
        salario,
        contribuicao: Math.round(contribuicao * 100) / 100,
        aliquota_efetiva: salario > 0 ? Math.round((contribuicao / salario) * 10000) / 10000 : 0,
        teto_previdenciario: 8157.41,
    };
}

/** ICMS efetivo (padrão + FECOP) */
function getICMSEfetivoSantaCatarina() {
    return SANTA_CATARINA_TRIBUTARIO.icms.aliquota_padrao + (SANTA_CATARINA_TRIBUTARIO.icms.fecop.adicional || 0);
}

/** Retorna resumo rápido do estado de Santa Catarina */
function resumoTributarioSantaCatarina() {
    return {
        estado: "Santa Catarina (SC)",
        regiao: "Sul",
        capital: "Florianópolis",
        icms_geral: "17%",
        icms_superfluo: "25%",
        icms_cesta_basica: "12%",
        fecop: "Não existe (apenas FUMDES 0,4% para TTDs)",
        ipva_passeio: "2%",
        ipva_moto_carga: "1%",
        ipva_isencao: "Veículos 20+ anos / motos até 200cc / PcD / táxis",
        itcmd: "1% a 8% (progressivo)",
        iss_florianopolis: "2% a 5% (geral 5%)",
        iptu_florianopolis: "0,3% a 3,0%",
        itbi_florianopolis: "2% (0,5% reduzida)",
        sublimite_simples: "R$ 3.600.000",
        sudam: "Não aplicável",
        alc: "Não aplicável",
        incentivos: "PRODEC, Pró-Emprego, TTDs 409/410/411/77/478/489, Pró-Cargas",
        destaques: [
            "Um dos menores IPVAs do Brasil (2%/1%)",
            "Forte polo de importação com TTDs que reduzem ICMS de 17% para 0,6%-2,6%",
            "TTD E-commerce (478) com carga de 1,4%-2,4%",
            "Polo tecnológico de Florianópolis (capital da inovação)",
            "Menor taxa de desemprego do país (2,2%)",
            "Sem FECOP adicional sobre supérfluos (diferente de CE, RJ, PE)",
            "REFIS 2026 aprovado com até 95% de desconto em multas e juros",
        ],
    };
}


// ═══════════════════════════════════════════════════════════════════════════
//  15. EXPORTAÇÃO (Padrão Grupo 2)
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        ...SANTA_CATARINA_TRIBUTARIO,
        utils: {
            getISS: getISSSantaCatarina,
            getIPVA: getIPVASantaCatarina,
            calcularIPVA: calcularIPVASantaCatarina,
            calcularITCMD: calcularITCMDSantaCatarina,
            calcularDIFAL: calcularDIFALSantaCatarina,
            calcularICMS: calcularICMSSantaCatarina,
            calcularSimplesNacional: calcularSimplesNacionalSantaCatarina,
            calcularIRPF: calcularIRPFSantaCatarina,
            calcularINSS: calcularINSSSantaCatarina,
            getICMSEfetivo: getICMSEfetivoSantaCatarina,
            resumoTributario: resumoTributarioSantaCatarina,
        },
    };
}

if (typeof window !== "undefined") {
    window.SANTA_CATARINA_TRIBUTARIO = SANTA_CATARINA_TRIBUTARIO;
    window.SantaCatarinaTributario = {
        getISS: getISSSantaCatarina,
        getIPVA: getIPVASantaCatarina,
        calcularIPVA: calcularIPVASantaCatarina,
        calcularITCMD: calcularITCMDSantaCatarina,
        calcularDIFAL: calcularDIFALSantaCatarina,
        calcularICMS: calcularICMSSantaCatarina,
        calcularSimplesNacional: calcularSimplesNacionalSantaCatarina,
        calcularIRPF: calcularIRPFSantaCatarina,
        calcularINSS: calcularINSSSantaCatarina,
        getICMSEfetivo: getICMSEfetivoSantaCatarina,
        resumo: resumoTributarioSantaCatarina,
    };
}
