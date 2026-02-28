/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RONDONIA.JS — Base de Dados Tributária Completa do Estado de Rondônia
 * Versão 3.0 — Padronizado conforme modelo roraima.js
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * FONTES:
 *   • SEFIN/RO — www.sefin.ro.gov.br
 *   • SEFIN Legislação — legislacao.sefin.ro.gov.br
 *   • SEMFAZ Porto Velho — semfaz.portovelho.ro.gov.br
 *   • Lei nº 5.634/2023 (ICMS 19,5% a partir de 12/01/2024)
 *   • Lei nº 6.287/2025 (NÃO aumenta ICMS)
 *   • Lei nº 6.050/2025 (Teto ICMS combustíveis 17,5%)
 *   • Lei nº 959/2000 (ITCMD progressivo 2%, 3%, 4%)
 *   • LC nº 227/2026 (ITCMD progressivo obrigatório)
 *   • Resolução GAB/SEMFAZ nº 10/2024 (Calendário Fiscal Porto Velho 2025)
 *   • Lei nº 5.173/1966 + Resolução CONDEL/SUDAM nº 136/2025 (SUDAM)
 *   • LC nº 214/2025 (Reforma Tributária — IBS/CBS)
 *   • Portaria CGSN nº 49/2024 (Simples Nacional sublimite)
 *
 * ATUALIZAÇÃO: 09/02/2026
 * ═══════════════════════════════════════════════════════════════════════════
 */

const RONDONIA_TRIBUTARIO = {

    // ═══════════════════════════════════════════════════════════════
    //  DADOS GERAIS
    // ═══════════════════════════════════════════════════════════════

    dados_gerais: {
        estado: "Rondônia",
        sigla: "RO",
        regiao: "Norte",
        capital: "Porto Velho",
        codigo_ibge: 11,
        zona_franca: false,
        zona_franca_obs: "Sem Zona Franca, mas com benefícios SUFRAMA em áreas específicas",
        abrangencia_sudam: true,
        abrangencia_sudene: false,
        abrangencia_suframa: true,
        suframa_obs: "Benefícios de IPI e outros incentivos fiscais em áreas específicas",
        site_sefin: "https://www.sefin.ro.gov.br",
        site_sefin_legislacao: "https://legislacao.sefin.ro.gov.br",
        site_semfaz_porto_velho: "https://semfaz.portovelho.ro.gov.br",
    },


    // ═══════════════════════════════════════════════════════════════
    //  ICMS — IMPOSTO SOBRE CIRCULAÇÃO DE MERCADORIAS E SERVIÇOS
    // ═══════════════════════════════════════════════════════════════

    icms: {

        // ─── Alíquotas Internas ───
        aliquota_padrao: 0.195,
        aliquota_padrao_descricao: "19,5% (aumentada de 17,5% em 12/01/2024)",
        aliquota_anterior: 0.175,
        vigencia_inicio: "2024-01-12",

        aliquotas_diferenciadas: {

            cesta_basica: {
                dados_disponiveis: false,
                obs: "Verificar SEFIN/RO",
            },

            combustiveis: {
                gasolina: { aliquota: 0.175, obs: "Teto ICMS — Lei nº 6.050/2025" },
                diesel:   { aliquota: 0.175, obs: "Teto ICMS — Lei nº 6.050/2025" },
                etanol:   { dados_disponiveis: false },
                gnv:      { dados_disponiveis: false },
            },

            telecomunicacoes:           { aliquota: 0.195 },
            bebidas_alcoolicas:         { aliquota: 0.195 },
            refrigerantes:              { aliquota: 0.195 },
            aguas_minerais:             { aliquota: 0.195 },
            cigarros_fumo:              { aliquota: 0.195 },
            armas_municoes:             { aliquota: 0.195 },
            embarcacoes_esporte_lazer:  { aliquota: 0.195 },
            perfumaria_cosmeticos:      { aliquota: 0.195 },
            joias:                      { aliquota: 0.195 },
            veiculos_novos:             { aliquota: 0.195 },

            medicamentos: {
                aliquota: 0,
                obs: "Isenção conforme legislação federal",
            },

            energia_eletrica:       { dados_disponiveis: false },
            produtos_informatica:   { dados_disponiveis: false },
            cervejas:               { dados_disponiveis: false },
            insumos_agropecuarios:  { dados_disponiveis: false },
        },

        // ─── Alíquotas Interestaduais ───
        interestaduais: {
            para_norte_ne_co_es:    0.12,
            para_sul_sudeste:       0.07,
            para_nao_contribuinte:  0.195,
        },

        // ─── Importação ───
        importacao: {
            aliquota_mercadoria_estrangeira: 0.04,
            obs: "Alíquota fixa 4% para mercadorias de origem estrangeira (Resolução SF 13/2012)",
        },

        // ─── FECOEP (Fundo Estadual de Combate e Erradicação da Pobreza) ───
        fecop: {
            existe: true,
            adicional: null,
            obs: "FECOEP existe — verificar incidência e percentual na SEFIN/RO",
        },

        // ─── Substituição Tributária ───
        substituicao_tributaria: {
            aplicavel: true,
            produtos_sujeitos: "Conforme convênios ICMS vigentes — verificar SEFIN/RO",
        },

        // ─── DIFAL ───
        difal: {
            aplicacao: "Conforme EC 87/2015",
            calculo: "Diferença entre alíquota interna (19,5%) e alíquota interestadual",
        },

        // ─── Legislação ───
        legislacao: [
            { norma: "Lei nº 5.634/2023",           assunto: "ICMS 19,5% a partir de 12/01/2024" },
            { norma: "Lei nº 6.287/2025",            assunto: "Promulgada pela ALE — NÃO aumenta ICMS" },
            { norma: "Lei nº 6.050/2025",            assunto: "Teto ICMS combustíveis 17,5%" },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  IPVA — IMPOSTO SOBRE PROPRIEDADE DE VEÍCULOS AUTOMOTORES
    // ═══════════════════════════════════════════════════════════════

    ipva: {

        aliquotas: {
            automoveis_ate_120mil:           0.02,    // 2% (até R$ 120 mil)
            automoveis_acima_120mil:         0.03,    // 3% (acima R$ 120 mil)
            automoveis_motor_1_0:            0.02,    // 2% (motor 1.0 ou menos)
            motocicletas_similares:          0.02,    // 2%
            motocicletas_ate_170cc:          0,       // ISENTAS
            motocicletas_acima_180cc:        0.035,   // 3,5%
            caminhoes:                       null,    // Dado não localizado
            onibus_micro:                    null,    // Dado não localizado
            veiculos_locadoras:              null,    // Dado não localizado
            veiculos_eletricos:              null,    // Proposta de isenção em análise (abr/2025)
            veiculos_hibridos:               null,    // Dado não localizado
            embarcacoes:                     null,    // Dado não localizado
            aeronaves:                       null,    // Dado não localizado
            transporte_app:                  0,       // ISENTO (min 3.600 viagens/ano)
        },

        isencoes: [
            {
                tipo: "Motocicletas até 170 cilindradas",
                beneficiarios: "Mais de 300 mil motocicletas em Rondônia",
                obs: "Beneficia população que depende do transporte para trabalho",
            },
            {
                tipo: "Transporte de passageiro por aplicativo",
                condicao: "Mínimo de 3.600 viagens anuais",
                base_legal: "Governo de RO — Fevereiro de 2024",
            },
            {
                tipo: "Veículos para PCD",
                dados_disponiveis: false,
            },
            {
                tipo: "Táxis",
                dados_disponiveis: false,
            },
        ],

        descontos_antecipacao: {
            dados_disponiveis: false,
            obs: "Verificar SEFIN/RO",
        },

        base_calculo: "Tabela FIPE (Fundação Instituto de Pesquisas Econômicas)",

        calendario: {
            escalonamento: "Conforme final de placa",
            distribuicao: "Janeiro a dezembro",
        },

        legislacao: [
            { norma: "Legislação estadual de IPVA",   assunto: "Base de alíquotas e isenções" },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  ITCMD — IMPOSTO TRANSMISSÃO CAUSA MORTIS E DOAÇÃO
    // ═══════════════════════════════════════════════════════════════

    itcmd: {
        dados_disponiveis: true,

        causa_mortis: {
            tipo: "Progressiva",
            faixas: [
                { aliquota: 0.02, obs: "Faixa inicial" },
                { aliquota: 0.03, obs: "Faixa intermediária" },
                { aliquota: 0.04, obs: "Faixa máxima" },
            ],
            aliquota_min: 0.02,
            aliquota_max: 0.04,
            obs: "Rondônia já adota alíquotas progressivas (2%, 3%, 4%)",
        },

        doacao: {
            tipo: "Progressiva",
            faixas: [
                { aliquota: 0.02, obs: "Faixa inicial" },
                { aliquota: 0.03, obs: "Faixa intermediária" },
                { aliquota: 0.04, obs: "Faixa máxima" },
            ],
            aliquota_min: 0.02,
            aliquota_max: 0.04,
        },

        base_calculo: "Valor venal do bem ou direito transmitido (valor de mercado ou valor real)",

        isencoes: {
            dados_disponiveis: false,
            obs: "Verificar SEFIN/RO",
        },

        sistema_eletronico: "Novo sistema da SEFIN agiliza acesso a declarações de ITCMD — processo eletrônico completo",

        legislacao: [
            { norma: "Lei nº 959/2000",                 assunto: "ITCMD progressivo (2%, 3%, 4%)" },
            { norma: "Lei Complementar nº 227/2026",     assunto: "Alíquota progressiva obrigatória" },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  ISS — IMPOSTO SOBRE SERVIÇOS (Porto Velho — referência)
    // ═══════════════════════════════════════════════════════════════

    iss: {
        municipio_referencia: "Porto Velho",

        aliquotas: {
            minima: 0.01,
            maxima: 0.05,
            padrao: 0.05,
            obs: "Alíquotas variam conforme tipo de serviço",
        },

        por_tipo_servico: {
            construcao_civil:           { aliquota: null, obs: "Verificar SEMFAZ Porto Velho" },
            informatica:                { aliquota: null, obs: "Verificar SEMFAZ Porto Velho" },
            saude:                      { aliquota: null, obs: "Verificar SEMFAZ Porto Velho" },
            educacao:                   { aliquota: null, obs: "Verificar SEMFAZ Porto Velho" },
            contabilidade_advocacia:    { aliquota: null, obs: "Verificar SEMFAZ Porto Velho" },
        },

        legislacao: [
            { norma: "Código Tributário de Porto Velho",     assunto: "ISS municipal" },
            { norma: "Lei Complementar nº 116/2003",         assunto: "Federal — normas gerais ISS" },
            { norma: "Resolução GAB/SEMFAZ nº 10/2024",      assunto: "Calendário Fiscal 2025" },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  IPTU — IMPOSTO PREDIAL E TERRITORIAL URBANO (Porto Velho)
    // ═══════════════════════════════════════════════════════════════

    iptu: {
        municipio_referencia: "Porto Velho",

        residencial: {
            aliquota: 0.005,    // 0,5%
        },

        nao_residencial: {
            dados_disponiveis: false,
        },

        terreno_nao_edificado: {
            dados_disponiveis: false,
        },

        descontos: {
            dados_disponiveis: false,
            obs: "Verificar SEMFAZ Porto Velho",
        },

        isencoes: {
            dados_disponiveis: false,
        },

        base_calculo: "Valor venal do imóvel (valor de mercado estimado)",

        legislacao: [
            { norma: "Código Tributário de Porto Velho",   assunto: "IPTU municipal" },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  ITBI — IMPOSTO TRANSMISSÃO DE BENS IMÓVEIS (Porto Velho)
    // ═══════════════════════════════════════════════════════════════

    itbi: {
        municipio_referencia: "Porto Velho",

        aliquotas: {
            geral: 0.02,    // 2% — alíquota única
        },

        base_calculo: "Maior valor entre: valor da operação, valor avaliado ou valor venal",

        isencoes: {
            dados_disponiveis: false,
        },

        legislacao: [
            { norma: "Código Tributário de Porto Velho",   assunto: "ITBI municipal" },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  8. TAXAS ESTADUAIS E MUNICIPAIS
    // ═══════════════════════════════════════════════════════════════

    taxas: {
        estaduais: {
            dados_disponiveis: false,
            itens_nao_localizados: [
                "Taxa de licenciamento de veículos",
                "Taxa judiciária",
                "Taxa de serviços SEFIN",
                "Taxa ambiental",
                "Taxa incêndio/bombeiros",
                "Emolumentos cartorários",
            ],
        },
        municipais_porto_velho: {
            municipio_referencia: "Porto Velho",
            taxa_lixo: { dados_disponiveis: false },
            taxa_alvara: { dados_disponiveis: false },
            taxa_publicidade: { dados_disponiveis: false },
            cosip: {
                nome: "Contribuição para Custeio do Serviço de Iluminação Pública",
                dados_disponiveis: false,
                base_legal: "Resolução GAB/SEMFAZ nº 10/2024",
            },
        },
    },


    // ═══════════════════════════════════════════════════════════════
    //  9. IMPOSTOS FEDERAIS (aplicáveis em RO)
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
            },
            incentivos_sudam: {
                reducao: 0.75,
                aliquota_efetiva: 0.0375,
                condicoes: "Empresas aprovadas até 31/12/2028 na Amazônia Legal",
                base_legal: "Lei nº 5.173/1966; Resolução CONDEL/SUDAM nº 136/2025",
            },
        },

        // ─── CSLL ───
        csll: {
            aliquota_geral: 0.09,
            instituicoes_financeiras: 0.15,
            seguradoras: 0.15,
            vigencia_alteracao: "A partir de 01/10/2025 (conforme MP)",
            incentivos_sudam: "Redução aplicável conforme aprovação de projeto SUDAM",
        },

        // ─── PIS/PASEP ───
        pis: {
            cumulativo: 0.0065,
            nao_cumulativo: 0.0165,
            cesta_basica: 0,
        },

        // ─── COFINS ───
        cofins: {
            cumulativo: 0.03,
            nao_cumulativo: 0.076,
            cesta_basica: 0,
        },

        // ─── IPI ───
        ipi: {
            referencia: "Tabela TIPI vigente",
            faixa_min: 0,
            faixa_max: 0.35,
            isencoes_suframa: true,
            obs: "Isenção de IPI para empresas cadastradas na SUFRAMA",
        },

        // ─── IOF ───
        iof: {
            dados_disponiveis: false,
            obs: "Verificar Receita Federal — alíquotas federais padrão",
        },

        // ─── Imposto de Importação ───
        imposto_importacao: {
            referencia: "Tarifa Externa Comum (TEC) — MERCOSUL",
            beneficios_suframa: "Isenção de II para empresas cadastradas SUFRAMA",
        },

        // ─── ITR ───
        itr: {
            dados_disponiveis: false,
            obs: "Verificar Receita Federal",
        },

        // ─── INSS / Contribuições Previdenciárias ───
        inss: {
            patronal: 0.20,
            rat_sat: { min: 0.005, max: 0.03 },
            empregado: {
                tabela_progressiva: [
                    { faixa: 1, aliquota: 0.08 },
                    { faixa: 2, aliquota: 0.09 },
                    { faixa: 3, aliquota: 0.10 },
                    { faixa: 4, aliquota: 0.11 },
                ],
            },
        },

        // ─── FGTS ───
        fgts: {
            aliquota: 0.08,
            multa_rescisoria: 0.40,
        },

        // ─── IRPF ───
        irpf: {
            tabela_anual_2026: [
                { ate: 28467.21,   aliquota: 0,      deducao: 0 },
                { ate: 33919.80,   aliquota: 0.075,   deducao: 2135.04 },
                { ate: 45012.60,   aliquota: 0.15,    deducao: 5139.18 },
                { ate: 55976.96,   aliquota: 0.225,   deducao: 9253.68 },
                { ate: Infinity,   aliquota: 0.275,   deducao: 14831.64 },
            ],
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
    //  SIMPLES NACIONAL (aplicável em RO)
    // ═══════════════════════════════════════════════════════════════

    simples_nacional: {

        sublimite_estadual: 3600000,
        adota_sublimite: true,
        base_legal_sublimite: "Portaria CGSN nº 49/2024",

        mei: {
            limite_anual: 81500,
            das_mensal: {
                comercio_industria: 76.90,
                servicos:           81.90,
                comercio_servicos:  81.90,
            },
            icms_fixo: 1.00,
            iss_fixo:  5.00,
            obs: "Valores 2025 — base salário-mínimo R$ 1.518,00",
        },

        anexos: {
            anexo_I: {
                nome: "Comércio",
                faixas: 6,
                faixa_aliquota: { min: 0.04, max: 0.1742 },
            },
            anexo_II: {
                nome: "Indústria",
                faixas: 6,
                faixa_aliquota: { min: 0.045, max: 0.1742 },
            },
            anexo_III: {
                nome: "Serviços (grupo 1)",
                faixas: 6,
                faixa_aliquota: { min: 0.06, max: 0.1742 },
            },
            anexo_IV: {
                nome: "Serviços (grupo 2)",
                faixas: 6,
                faixa_aliquota: { min: 0.1693, max: 0.2245 },
            },
            anexo_V: {
                nome: "Serviços (grupo 3)",
                faixas: 6,
                faixa_aliquota: { min: 0.155, max: 0.305 },
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
                aliquota_efetiva: 0.0375,
                prazo_pleitos: "2028-12-31",
                tipo_projeto: "Instalação, diversificação, modernização",
                base_legal: "Lei nº 5.173/1966; Resolução CONDEL/SUDAM nº 136/2025",
            },
            reducao_csll: {
                obs: "Redução aplicável conforme aprovação de projeto SUDAM",
            },
            reducao_icms: {
                descricao: "Até 75% do ICMS que superar a média dos últimos 12 meses",
                aplicacao: "Operações de saída do estado",
            },
            reinvestimento: {
                beneficio: "Incentivos para reinvestimento de lucros conforme legislação específica",
            },
        },

        // ─── SUFRAMA ───
        suframa: {
            abrangencia: "Áreas específicas de Rondônia",
            pis_diferenciado: 0.0065,
            cofins_diferenciado: 0.03,
            ipi: "Isenção conforme cadastro SUFRAMA",
            base_legal: "Lei nº 8.387/1991 e regulamentações SUFRAMA",
            requisitos: "Cadastro na SUFRAMA e aprovação de projeto",
        },

        // ─── Incentivo Tributário para Crescimento Econômico ───
        incentivo_crescimento: {
            nome: "Ampliação do Incentivo Tributário para o Crescimento Econômico",
            descricao: "Redução de 75% do ICMS que superar a média do valor recolhido nos últimos 12 meses",
            aplicacao: "Setores específicos conforme legislação estadual",
        },

        // ─── Programas Estaduais ───
        programas_estaduais: {
            dados_disponiveis: false,
            obs: "Verificar SEFIN/RO",
        },

        // ─── Isenções Específicas ───
        isencoes_especificas: {
            agricultura_familiar:   { dados_disponiveis: false },
            cooperativas:           { dados_disponiveis: false },
            exportadores:           { dados_disponiveis: false },
        },
    },


    // ═══════════════════════════════════════════════════════════════
    //  REFORMA TRIBUTÁRIA (Impactos previstos para RO)
    // ═══════════════════════════════════════════════════════════════

    reforma_tributaria: {
        legislacao: "Lei Complementar nº 214/2025",

        ibs: {
            nome: "Imposto sobre Bens e Serviços",
            aliquota_estadual: null,
            obs: "Substituirá gradualmente o ICMS",
        },

        cbs: {
            nome: "Contribuição sobre Bens e Serviços",
            aliquota_federal: null,
            obs: "Substituirá gradualmente PIS/COFINS",
        },

        is: {
            nome: "Imposto Seletivo",
            obs: "Incidirá sobre produtos prejudiciais à saúde ou meio ambiente",
        },

        impactos_rondonia: {
            beneficios_sudam_suframa: "Possível manutenção conforme legislação de transição",
            disputa_stf: {
                descricao: "Rondônia em disputa com São Paulo no STF sobre benefícios fiscais de ICMS",
                data: "Junho de 2025",
                obs: "Questão de equilíbrio federativo",
            },
        },
    },


    // ═══════════════════════════════════════════════════════════════
    //  DADOS DE COBERTURA (controle de qualidade da pesquisa)
    // ═══════════════════════════════════════════════════════════════

    cobertura: {
        versao: "3.0",
        data_atualizacao: "2026-02-10",
        localizados: [
            "Dados gerais de Rondônia (IBGE, SEFIN, SUDAM, SUFRAMA)",
            "ICMS (padrão 19,5%, combustíveis 17,5% teto, interestaduais, importação 4%)",
            "FECOEP (existe — percentual a verificar)",
            "IPVA (2% até R$120k, 3% acima, 2% motor 1.0, ISENTO motos até 170cc, ISENTO app 3.600 viagens)",
            "ITCMD (progressivo 2%, 3%, 4% — Lei 959/2000)",
            "ISS Porto Velho (faixa 1% a 5%)",
            "IPTU Porto Velho (residencial 0,5%)",
            "ITBI Porto Velho (2% alíquota única)",
            "IRPJ (15% + 10% adicional, SUDAM 75% redução = 3,75% efetivo)",
            "CSLL (9%, com redução SUDAM aplicável)",
            "PIS (0,65% cumulativo, 1,65% não cumulativo)",
            "COFINS (3% cumulativo, 7,6% não cumulativo)",
            "INSS patronal (20%) + empregado (8-11%)",
            "FGTS (8%)",
            "IRPF tabela 2025/2026",
            "Simples Nacional (sublimite R$ 3,6M, MEI R$ 81.500)",
            "SUDAM (75% redução IRPJ + 75% ICMS sobre média 12 meses)",
            "SUFRAMA (PIS 0,65%, COFINS 3%, IPI isento)",
            "Incentivo crescimento econômico (75% ICMS sobre média)",
            "Reforma Tributária (LC 214/2025) + disputa STF com SP",
        ],
        nao_localizados: [
            "ICMS — cesta básica, energia elétrica, cervejas, informática, insumos agro",
            "FECOEP — percentual exato de adicional",
            "IPVA — caminhões, ônibus, locadoras, elétricos, híbridos, embarcações, aeronaves",
            "IPVA — descontos por antecipação",
            "ISS Porto Velho — alíquotas por tipo de serviço",
            "IPTU Porto Velho — não residencial, terreno não edificado, descontos, isenções",
            "ITBI Porto Velho — isenções",
            "Taxas estaduais (licenciamento, judiciária, SEFIN, ambiental, bombeiros, emolumentos)",
            "Taxas municipais Porto Velho (lixo, alvará, publicidade, COSIP)",
            "IOF, ITR — detalhes federais",
            "Programas estaduais de incentivo fiscal",
        ],
        contatos_para_completar: [
            { orgao: "SEFIN/RO", url: "https://www.sefin.ro.gov.br", tel: null },
            { orgao: "SEMFAZ Porto Velho", url: "https://semfaz.portovelho.ro.gov.br", tel: null },
            { orgao: "Receita Federal", url: "https://www.gov.br/receitafederal", tel: null },
        ],
    },
};


// ═══════════════════════════════════════════════════════════════════════════
//  FUNÇÕES UTILITÁRIAS — RONDÔNIA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Retorna a alíquota de ISS para um tipo de serviço em Porto Velho.
 * @param {string} tipo - Chave do serviço
 * @returns {number} Alíquota (ex: 0.05 = 5%) — retorna padrão se não encontrado
 */
function getISSRondonia(tipo) {
    const servico = RONDONIA_TRIBUTARIO.iss.por_tipo_servico[tipo];
    if (servico && servico.aliquota !== null) return servico.aliquota;
    return RONDONIA_TRIBUTARIO.iss.aliquotas.padrao;
}

/**
 * Retorna alíquota IPVA por tipo de veículo em Rondônia.
 * @param {string} tipo - "auto_ate_120k", "auto_acima_120k", "auto_1_0", "moto",
 *                         "moto_170cc", "moto_acima_180cc", "app"
 * @returns {number|null}
 */
function getIPVARondonia(tipo) {
    const map = {
        auto_ate_120k:      RONDONIA_TRIBUTARIO.ipva.aliquotas.automoveis_ate_120mil,
        auto_acima_120k:    RONDONIA_TRIBUTARIO.ipva.aliquotas.automoveis_acima_120mil,
        auto_1_0:           RONDONIA_TRIBUTARIO.ipva.aliquotas.automoveis_motor_1_0,
        moto:               RONDONIA_TRIBUTARIO.ipva.aliquotas.motocicletas_similares,
        moto_170cc:         RONDONIA_TRIBUTARIO.ipva.aliquotas.motocicletas_ate_170cc,
        moto_acima_180cc:   RONDONIA_TRIBUTARIO.ipva.aliquotas.motocicletas_acima_180cc,
        app:                RONDONIA_TRIBUTARIO.ipva.aliquotas.transporte_app,
    };
    return map[tipo] ?? RONDONIA_TRIBUTARIO.ipva.aliquotas.automoveis_ate_120mil;
}

/**
 * Retorna alíquota de IPTU residencial de Porto Velho.
 * @returns {number}
 */
function getIPTUResidencialRondonia() {
    return RONDONIA_TRIBUTARIO.iptu.residencial.aliquota;
}

/**
 * Retorna o percentual de redução IRPJ via SUDAM para Rondônia.
 * @returns {number} 0.75 = 75%
 */
function getReducaoSUDAMRondonia() {
    return RONDONIA_TRIBUTARIO.incentivos.sudam.ativo
        ? RONDONIA_TRIBUTARIO.incentivos.sudam.reducao_irpj.percentual
        : 0;
}

/**
 * Calcula ICMS efetivo de Rondônia (padrão + FECOP quando disponível).
 * @returns {number}
 */
function getICMSEfetivoRondonia() {
    const fecop = RONDONIA_TRIBUTARIO.icms.fecop.adicional || 0;
    return RONDONIA_TRIBUTARIO.icms.aliquota_padrao + fecop;
}

/**
 * Retorna alíquota ITCMD (faixa) de Rondônia.
 * @param {string} tipo - "causa_mortis" ou "doacao"
 * @returns {object} {min, max, faixas}
 */
function getITCMDRondonia(tipo) {
    const dados = tipo === "doacao" ? RONDONIA_TRIBUTARIO.itcmd.doacao : RONDONIA_TRIBUTARIO.itcmd.causa_mortis;
    return {
        min: dados.aliquota_min,
        max: dados.aliquota_max,
        faixas: dados.faixas.map(f => f.aliquota),
    };
}

/**
 * Resumo rápido dos tributos de Rondônia para exibição.
 * @returns {object}
 */
function resumoTributarioRondonia() {
    return {
        estado: "Rondônia (RO)",
        icms_padrao: (RONDONIA_TRIBUTARIO.icms.aliquota_padrao * 100).toFixed(1) + "%",
        icms_efetivo: (getICMSEfetivoRondonia() * 100).toFixed(1) + "%",
        icms_combustiveis: "17,5% (teto — Lei 6.050/2025)",
        fecop: RONDONIA_TRIBUTARIO.icms.fecop.existe ? "Existe — percentual a verificar" : "Não existe",
        ipva_auto_ate_120k: (RONDONIA_TRIBUTARIO.ipva.aliquotas.automoveis_ate_120mil * 100).toFixed(0) + "%",
        ipva_auto_acima_120k: (RONDONIA_TRIBUTARIO.ipva.aliquotas.automoveis_acima_120mil * 100).toFixed(0) + "%",
        ipva_moto_170cc: "ISENTO (300 mil+ beneficiados)",
        ipva_moto_acima_180cc: (RONDONIA_TRIBUTARIO.ipva.aliquotas.motocicletas_acima_180cc * 100).toFixed(1) + "%",
        ipva_app: "ISENTO (min 3.600 viagens/ano)",
        itcmd: "Progressivo 2%, 3%, 4%",
        iss_faixa: "1% a 5%",
        iptu_residencial: (RONDONIA_TRIBUTARIO.iptu.residencial.aliquota * 100).toFixed(1) + "%",
        itbi: (RONDONIA_TRIBUTARIO.itbi.aliquotas.geral * 100).toFixed(0) + "% (única)",
        sudam: "75% redução IRPJ (efetivo 3,75%)",
        suframa: "PIS 0,65% / COFINS 3% / IPI isento",
        incentivo_crescimento: "75% ICMS sobre média 12 meses",
        sublimite_simples: "R$ " + RONDONIA_TRIBUTARIO.simples_nacional.sublimite_estadual.toLocaleString("pt-BR"),
    };
}


// ═══════════════════════════════════════════════════════════════════════════
//  15. EXPORTAÇÃO (Padrão Grupo 2)
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        ...RONDONIA_TRIBUTARIO,
        utils: {
            getISS: getISSRondonia,
            getIPVA: getIPVARondonia,
            getIPTUResidencial: getIPTUResidencialRondonia,
            getReducaoSUDAM: getReducaoSUDAMRondonia,
            getICMSEfetivo: getICMSEfetivoRondonia,
            getITCMD: getITCMDRondonia,
            resumoTributario: resumoTributarioRondonia,
        },
    };
}

if (typeof window !== "undefined") {
    window.RONDONIA_TRIBUTARIO = RONDONIA_TRIBUTARIO;
    window.RondoniaTributario = {
        getISS: getISSRondonia,
        getIPVA: getIPVARondonia,
        getIPTUResidencial: getIPTUResidencialRondonia,
        getReducaoSUDAM: getReducaoSUDAMRondonia,
        getICMSEfetivo: getICMSEfetivoRondonia,
        getITCMD: getITCMDRondonia,
        resumo: resumoTributarioRondonia,
    };
}
