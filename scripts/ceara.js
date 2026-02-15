/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CEARA.JS — Base de Dados Tributária Completa do Estado do Ceará
 * ═══════════════════════════════════════════════════════════════════════════
 * Versão 3.0 — Padronizado conforme modelo roraima.js v3.0
 * Dados verificados via fontes oficiais (SEFAZ/CE, Receita Federal, SEFIN Fortaleza)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ESTRUTURA PADRÃO (15 seções obrigatórias):
 *   01. dados_gerais        — Identificação, links, legislação base
 *   02. icms                — Alíquotas, cesta básica, reduções, ST, DIFAL
 *   03. ipva                — Alíquotas, calendário, descontos, isenções
 *   04. itcmd               — Alíquotas, base de cálculo, isenções
 *   05. iss                 — Tabela por grupo de serviço (município-referência)
 *   06. iptu                — Alíquotas, progressividade, isenções
 *   07. itbi                — Alíquota, base de cálculo
 *   08. taxas               — Estaduais e municipais (capital)
 *   09. federal             — IRPJ, CSLL, PIS, COFINS, IOF, ITR, INSS, FGTS, IRPF
 *   10. simples_nacional    — Anexos, faixas, sublimite, MEI
 *   11. incentivos          — SUDAM/SUDENE, ALC/ZFM, SUFRAMA, programas estaduais
 *   12. reforma_tributaria  — EC 132, LC 214, transição IBS/CBS
 *   13. cobertura           — Versão, itens localizados/pendentes, contatos
 *   14. funções utilitárias — Helpers de cálculo
 *   15. exportação          — module.exports + window (padrão Grupo 2)
 *
 * FONTES CONSULTADAS:
 *   • SEFAZ/CE — www.sefaz.ce.gov.br
 *   • Lei nº 18.305/2023 (majoração ICMS para 20%)
 *   • Lei nº 15.730/2016 (ICMS/CE)
 *   • Decreto nº 34.605/2022 (RICMS/CE)
 *   • Lei Complementar nº 33/2006 (ISS/IPTU/ITBI Fortaleza)
 *   • LC nº 59/2008 (Alterações tributárias Fortaleza)
 *   • Decreto nº 15.854/2023 (IPTU Fortaleza)
 *   • Receita Federal — www.gov.br/receitafederal
 *   • SUDENE — www.gov.br/sudene
 *
 * ATUALIZAÇÃO: 10/02/2026
 * ═══════════════════════════════════════════════════════════════════════════
 */

const CEARA_TRIBUTARIO = {

    // ═══════════════════════════════════════════════════════════════
    //  1. DADOS GERAIS
    // ═══════════════════════════════════════════════════════════════

    dados_gerais: {
        nome: "Ceará",
        sigla: "CE",
        regiao: "Nordeste",
        capital: "Fortaleza",
        codigo_ibge: "23",
        codigo_ibge_capital: "2304400",
        municipios_principais: [
            { nome: "Fortaleza", codigo_ibge: "2304400", capital: true },
            { nome: "Caucaia", codigo_ibge: "2302404" },
            { nome: "Maracanaú", codigo_ibge: "2307296" },
            { nome: "Juazeiro do Norte", codigo_ibge: "2306407" },
        ],
        zona_franca: {
            existe: false,
            observacao: "Não há Zona Franca no Ceará",
        },
        alc: {
            existe: false,
            observacao: "Não há Área de Livre Comércio no Ceará",
        },
        sudam: {
            abrangencia: "parcial",
            observacao: "Abrangência parcial — região Oeste do Ceará",
        },
        sudene: {
            abrangencia: true,
            beneficios: "Redução de IRPJ até 75%, incentivos para projetos aprovados",
        },
        suframa: {
            abrangencia: false,
            observacao: "Ceará não está na área de abrangência da SUFRAMA",
        },
        sefaz: {
            url: "https://www.sefaz.ce.gov.br/",
            legislacao: "https://www.sefaz.ce.gov.br/legislacao-tributaria/",
            ipva: "https://ipva.sefaz.ce.gov.br/",
            convenios_icms: "http://www.confaz.fazenda.gov.br/legislacao/convenios",
            contato: "DADO NÃO LOCALIZADO",
        },
        prefeitura_capital: {
            url: "https://www.fortaleza.ce.gov.br/",
            sefin: "https://www.sefin.fortaleza.ce.gov.br/",
            contato: "DADO NÃO LOCALIZADO",
        },
        legislacao_base: {
            icms: "Lei nº 18.305/2023 (majoração para 20%); Lei nº 15.730/2016; Decreto nº 34.605/2022 (RICMS/CE)",
            ipva: "Lei Estadual do IPVA; Instrução Normativa SEFAZ (tabelas anuais)",
            iss: "Lei Complementar nº 33/2006 (ISS Fortaleza); LC nº 116/2003 (federal)",
            iptu: "Lei Complementar nº 33/2006; LC nº 59/2008; Decreto nº 15.854/2023",
            itbi: "Lei Complementar nº 33/2006 (ITIV Fortaleza)",
        },
    },


    // ═══════════════════════════════════════════════════════════════
    //  2. ICMS — IMPOSTO SOBRE CIRCULAÇÃO DE MERCADORIAS E SERVIÇOS
    // ═══════════════════════════════════════════════════════════════

    icms: {
        aliquota_padrao: 0.20,
        aliquota_padrao_percentual: "20%",
        aliquota_padrao_anterior: 0.17,
        vigencia_aliquota_atual: "A partir de 01/01/2024",
        base_legal: "Lei nº 18.305/2023; Lei nº 15.730/2016; Decreto nº 34.605/2022 (RICMS/CE)",

        historico: [
            { vigencia: "Até 31/12/2023", aliquota: 0.17, percentual: "17%" },
            { vigencia: "A partir de 01/01/2024", aliquota: 0.20, percentual: "20%", nota: "Majoração de 3 pontos percentuais" },
        ],

        aliquotas_diferenciadas: {
            energia_eletrica: {
                aliquota: null,
                dados_disponiveis: false,
                obs: "Verificar diretamente na SEFAZ/CE",
            },
            combustiveis: {
                aliquota: null,
                dados_disponiveis: false,
                obs: "Verificar diretamente na SEFAZ/CE",
            },
            cesta_basica: {
                aliquota: null,
                dados_disponiveis: false,
                obs: "Verificar diretamente na SEFAZ/CE",
            },
            bebidas_alcoolicas: {
                aliquota: null,
                dados_disponiveis: false,
                obs: "Verificar diretamente na SEFAZ/CE",
            },
            medicamentos: {
                aliquota: null,
                dados_disponiveis: false,
                obs: "Verificar diretamente na SEFAZ/CE",
            },
            telecom: {
                aliquota: null,
                dados_disponiveis: false,
                obs: "Verificar diretamente na SEFAZ/CE",
            },
            transporte_interestadual_intermunicipal: {
                aliquota: 0.20,
                percentual: "20%",
                descricao: "ICMS sobre transporte interestadual e intermunicipal",
            },
        },

        aliquotas_interestaduais: {
            norte_nordeste_centro_oeste_es: {
                aliquota: 0.12,
                percentual: "12%",
                descricao: "Saídas para N/NE/CO e Espírito Santo",
            },
            sul_sudeste_exceto_es: {
                aliquota: 0.07,
                percentual: "7%",
                descricao: "Saídas para Sul e Sudeste (exceto ES)",
            },
            nao_contribuinte: {
                aliquota: 0.20,
                percentual: "20%",
                descricao: "Operações com não contribuintes (EC 87/2015)",
            },
        },

        importacao: {
            aliquota: 0.20,
            percentual: "20%",
            descricao: "ICMS sobre importação — alíquota interna",
        },

        fecop: {
            existe: false,
            adicional: 0,
            observacao: "FECOP/FEM não identificado na pesquisa — verificar na SEFAZ/CE",
        },

        difal: {
            aplicacao: true,
            calculo: "Diferença entre alíquota interna (20%) e alíquota interestadual",
            base_legal: "EC 87/2015",
        },

        substituicao_tributaria: {
            dados_disponiveis: false,
            obs: "Verificar lista de produtos e MVA na SEFAZ/CE e CONFAZ",
        },
    },


    // ═══════════════════════════════════════════════════════════════
    //  3. IPVA — IMPOSTO SOBRE PROPRIEDADE DE VEÍCULOS AUTOMOTORES
    // ═══════════════════════════════════════════════════════════════

    ipva: {
        base_legal: "Lei Estadual do IPVA; Instrução Normativa SEFAZ/CE",
        base_calculo: "Valor venal conforme tabela FIPE",

        aliquotas: {
            automovel_ate_100cv: {
                aliquota: 0.02,
                percentual: "2,0%",
                descricao: "Automóveis até 100 CV",
            },
            automovel_100_a_180cv: {
                aliquota: 0.03,
                percentual: "3,0%",
                descricao: "Automóveis de 100 CV a 180 CV",
            },
            automovel_acima_180cv: {
                aliquota: 0.035,
                percentual: "3,5%",
                descricao: "Automóveis acima de 180 CV",
            },
            camioneta_utilitario_ate_100cv: {
                aliquota: 0.02,
                percentual: "2,0%",
                descricao: "Camionetas/Utilitários até 100 CV",
            },
            camioneta_utilitario_100_a_180cv: {
                aliquota: 0.03,
                percentual: "3,0%",
                descricao: "Camionetas/Utilitários de 100 CV a 180 CV",
            },
            camioneta_utilitario_acima_180cv: {
                aliquota: 0.035,
                percentual: "3,5%",
                descricao: "Camionetas/Utilitários acima de 180 CV",
            },
            onibus_microonibus_caminhao: {
                aliquota: 0.01,
                percentual: "1,0%",
                descricao: "Ônibus, micro-ônibus, caminhões ≥3.500kg, cavalos mecânicos",
            },
            motocicleta_combustao: {
                aliquota_minima: 0.01,
                aliquota_maxima: 0.035,
                percentual: "1,0% a 3,5%",
                descricao: "Motocicletas, motonetas, ciclomotores, triciclos (combustão) — conforme cilindrada",
            },
            motocicleta_eletrica: {
                aliquota_minima: 0.01,
                aliquota_maxima: 0.02,
                percentual: "1,0% a 2,0%",
                descricao: "Motocicletas, motonetas, ciclomotores, triciclos elétricos (3kW)",
                beneficio: "Redução de 50% para condutores sem multas",
            },
            aeronave: {
                aliquota: 0.025,
                percentual: "2,5%",
                descricao: "Aeronaves particulares",
            },
            embarcacao: {
                aliquota: 0.025,
                percentual: "2,5%",
                descricao: "Embarcações de recreio ou esporte",
            },
            locadora: {
                aliquota: null,
                dados_disponiveis: false,
                obs: "Verificar diretamente na SEFAZ/CE",
            },
        },

        isencoes: [
            {
                tipo: "Veículos fabricados até 2010",
                descricao: "Isenção total de IPVA para veículos com mais de 15 anos (fabricados até 2010 em 2025/2026)",
                base_legal: "Lei Estadual",
            },
            {
                tipo: "PCD",
                descricao: "Isenção total para portadores de deficiência — com comprovação",
            },
            {
                tipo: "Táxis",
                descricao: "Isenção para categoria aluguel, motorista profissional",
            },
            {
                tipo: "Veículos oficiais",
                descricao: "Isenção para veículos da União, Estados e Municípios",
            },
            {
                tipo: "Transporte público",
                descricao: "Isenção para empresas concessionárias de transporte público",
            },
            {
                tipo: "Ambulâncias e bombeiros",
                descricao: "Isenção para ambulâncias e veículos de bombeiros sem cobrança de serviço",
            },
            {
                tipo: "Embarcações de pesca profissional",
                descricao: "Isenção para pessoa física pescador profissional",
            },
        ],

        descontos: {
            antecipacao: {
                percentual: 0.10,
                descricao: "Até 10% de desconto para pagamento em cota única",
                condicao: "Conforme calendário",
            },
            motocicleta_sem_multas: {
                percentual: 0.50,
                descricao: "50% de redução para motociclistas sem multas",
            },
            parcelamento: {
                parcelas: 12,
                descricao: "Até 12 parcelas sem desconto",
            },
        },

        calendario_vencimento: {
            dados_disponiveis: false,
            obs: "Consultar calendário oficial na SEFAZ/CE",
        },
    },


    // ═══════════════════════════════════════════════════════════════
    //  4. ITCMD — IMPOSTO SOBRE TRANSMISSÃO CAUSA MORTIS E DOAÇÃO
    // ═══════════════════════════════════════════════════════════════

    itcmd: {
        base_legal: "DADO NÃO LOCALIZADO — verificar legislação estadual",

        aliquotas: {
            causa_mortis: {
                dados_disponiveis: false,
                obs: "Verificar diretamente na SEFAZ/CE",
            },
            doacao: {
                dados_disponiveis: false,
                obs: "Verificar diretamente na SEFAZ/CE",
            },
        },

        base_calculo: "Valor venal do bem ou direito transmitido",

        isencoes: {
            dados_disponiveis: false,
            obs: "Verificar na SEFAZ/CE",
        },
    },


    // ═══════════════════════════════════════════════════════════════
    //  5. ISS — IMPOSTO SOBRE SERVIÇOS (Fortaleza — referência)
    // ═══════════════════════════════════════════════════════════════

    iss: {
        municipio_referencia: "Fortaleza",
        base_legal: "Lei Complementar nº 33/2006 (Fortaleza); LC nº 116/2003 (federal)",
        aliquota_minima_federal: 0.02,
        aliquota_maxima_federal: 0.05,

        aliquota_geral: 0.03,
        aliquota_geral_percentual: "3%",
        faixa_aliquotas: "2% a 5% conforme tipo de serviço",

        por_tipo_servico: {
            // SAÚDE — Alíquota 3%
            medicina: { aliquota: 0.03, percentual: "3%", grupo: "Saúde" },
            analises_clinicas: { aliquota: 0.03, percentual: "3%", grupo: "Saúde" },
            hospitais_clinicas: { aliquota: 0.03, percentual: "3%", grupo: "Saúde" },
            enfermagem: { aliquota: 0.03, percentual: "3%", grupo: "Saúde" },
            farmaceuticos: { aliquota: 0.03, percentual: "3%", grupo: "Saúde" },
            fisioterapia: { aliquota: 0.03, percentual: "3%", grupo: "Saúde" },
            fonoaudiologia: { aliquota: 0.03, percentual: "3%", grupo: "Saúde" },
            terapia_ocupacional: { aliquota: 0.03, percentual: "3%", grupo: "Saúde" },
            nutricao: { aliquota: 0.03, percentual: "3%", grupo: "Saúde" },
            odontologia: { aliquota: 0.03, percentual: "3%", grupo: "Saúde" },
            psicologia: { aliquota: 0.03, percentual: "3%", grupo: "Saúde" },
            psicanalise: { aliquota: 0.03, percentual: "3%", grupo: "Saúde" },
            obstetricia: { aliquota: 0.03, percentual: "3%", grupo: "Saúde" },
            proteses: { aliquota: 0.03, percentual: "3%", grupo: "Saúde" },
            planos_saude: { aliquota: 0.03, percentual: "3%", grupo: "Saúde" },
            inseminacao_fertilizacao: { aliquota: 0.03, percentual: "3%", grupo: "Saúde" },
            bancos_sangue: { aliquota: 0.03, percentual: "3%", grupo: "Saúde" },
            casas_repouso_creches: { aliquota: 0.03, percentual: "3%", grupo: "Saúde" },
            atendimento_movel: { aliquota: 0.03, percentual: "3%", grupo: "Saúde" },

            // INFORMÁTICA — Alíquota 5%
            informatica: { aliquota: 0.05, percentual: "5%", grupo: "Informática" },
            desenvolvimento_sistemas: { aliquota: 0.05, percentual: "5%", grupo: "Informática" },
            programacao: { aliquota: 0.05, percentual: "5%", grupo: "Informática" },
            processamento_dados: { aliquota: 0.05, percentual: "5%", grupo: "Informática" },
            licenciamento_software: { aliquota: 0.05, percentual: "5%", grupo: "Informática" },
            consultoria_informatica: { aliquota: 0.05, percentual: "5%", grupo: "Informática" },
            suporte_tecnico: { aliquota: 0.05, percentual: "5%", grupo: "Informática" },
            paginas_eletronicas: { aliquota: 0.05, percentual: "5%", grupo: "Informática" },

            // PESQUISA E DESENVOLVIMENTO — 5%
            pesquisa_desenvolvimento: { aliquota: 0.05, percentual: "5%", grupo: "Pesquisa" },

            // ENGENHARIA E CONSTRUÇÃO CIVIL — 5%
            engenharia: { aliquota: 0.05, percentual: "5%", grupo: "Engenharia e Construção Civil" },
            construcao_civil: { aliquota: 0.05, percentual: "5%", grupo: "Engenharia e Construção Civil" },
            arquitetura: { aliquota: 0.05, percentual: "5%", grupo: "Engenharia e Construção Civil" },
            urbanismo: { aliquota: 0.05, percentual: "5%", grupo: "Engenharia e Construção Civil" },
            agronomia: { aliquota: 0.05, percentual: "5%", grupo: "Engenharia e Construção Civil" },
            geologia: { aliquota: 0.05, percentual: "5%", grupo: "Engenharia e Construção Civil" },
            demolicao: { aliquota: 0.05, percentual: "5%", grupo: "Engenharia e Construção Civil" },
            reparacao_reforma: { aliquota: 0.05, percentual: "5%", grupo: "Engenharia e Construção Civil" },
            limpeza_vias: { aliquota: 0.05, percentual: "5%", grupo: "Engenharia e Construção Civil" },
            decoracao_jardinagem: { aliquota: 0.05, percentual: "5%", grupo: "Engenharia e Construção Civil" },
            dedetizacao: { aliquota: 0.05, percentual: "5%", grupo: "Engenharia e Construção Civil" },
            aerofotogrametria: { aliquota: 0.05, percentual: "5%", grupo: "Engenharia e Construção Civil" },
            fiscalizacao_obras: { aliquota: 0.05, percentual: "5%", grupo: "Engenharia e Construção Civil" },

            // EDUCAÇÃO — 5%
            educacao: { aliquota: 0.05, percentual: "5%", grupo: "Educação" },
            ensino_regular: { aliquota: 0.05, percentual: "5%", grupo: "Educação" },
            treinamento: { aliquota: 0.05, percentual: "5%", grupo: "Educação" },

            // PROFISSIONAIS — 5%
            advocacia: { aliquota: 0.05, percentual: "5%", grupo: "Profissionais" },
            contabilidade: { aliquota: 0.05, percentual: "5%", grupo: "Profissionais" },
            auditoria: { aliquota: 0.05, percentual: "5%", grupo: "Profissionais" },
            consultoria_empresarial: { aliquota: 0.05, percentual: "5%", grupo: "Profissionais" },
            consultoria_tecnica: { aliquota: 0.05, percentual: "5%", grupo: "Profissionais" },
            pericia: { aliquota: 0.05, percentual: "5%", grupo: "Profissionais" },
            traducao: { aliquota: 0.05, percentual: "5%", grupo: "Profissionais" },
            secretariado: { aliquota: 0.05, percentual: "5%", grupo: "Profissionais" },
            administracao_imoveis: { aliquota: 0.05, percentual: "5%", grupo: "Profissionais" },
            administracao_empresas: { aliquota: 0.05, percentual: "5%", grupo: "Profissionais" },
            administracao_condominios: { aliquota: 0.05, percentual: "5%", grupo: "Profissionais" },
            administracao_rh: { aliquota: 0.05, percentual: "5%", grupo: "Profissionais" },

            // VETERINÁRIOS — 5%
            veterinaria: { aliquota: 0.05, percentual: "5%", grupo: "Veterinários" },
            zootecnia: { aliquota: 0.05, percentual: "5%", grupo: "Veterinários" },

            // CUIDADOS PESSOAIS E ESTÉTICA — 5%
            barbearia_cabeleireiros: { aliquota: 0.05, percentual: "5%", grupo: "Cuidados Pessoais" },
            estetica: { aliquota: 0.05, percentual: "5%", grupo: "Cuidados Pessoais" },
            academias_ginastica: { aliquota: 0.05, percentual: "5%", grupo: "Cuidados Pessoais" },
            spa_emagrecimento: { aliquota: 0.05, percentual: "5%", grupo: "Cuidados Pessoais" },

            // HOSPEDAGEM E TURISMO — 5%
            hospedagem: { aliquota: 0.05, percentual: "5%", grupo: "Hospedagem e Turismo" },
            turismo: { aliquota: 0.05, percentual: "5%", grupo: "Hospedagem e Turismo" },
            guias_turismo: { aliquota: 0.05, percentual: "5%", grupo: "Hospedagem e Turismo" },

            // INTERMEDIAÇÃO — 5%
            corretagem: { aliquota: 0.05, percentual: "5%", grupo: "Intermediação" },
            representacao_comercial: { aliquota: 0.05, percentual: "5%", grupo: "Intermediação" },
            agenciamento: { aliquota: 0.05, percentual: "5%", grupo: "Intermediação" },

            // GUARDA, ESTACIONAMENTO, VIGILÂNCIA — 5%
            estacionamento: { aliquota: 0.05, percentual: "5%", grupo: "Guarda e Vigilância" },
            vigilancia_seguranca: { aliquota: 0.05, percentual: "5%", grupo: "Guarda e Vigilância" },
            armazenamento: { aliquota: 0.05, percentual: "5%", grupo: "Guarda e Vigilância" },

            // DIVERSÕES, LAZER, ENTRETENIMENTO — 5%
            teatro_shows: { aliquota: 0.05, percentual: "5%", grupo: "Diversões e Entretenimento" },
            cinema: { aliquota: 0.05, percentual: "5%", grupo: "Diversões e Entretenimento" },
            eventos_producao: { aliquota: 0.05, percentual: "5%", grupo: "Diversões e Entretenimento" },
            parques_diversoes: { aliquota: 0.05, percentual: "5%", grupo: "Diversões e Entretenimento" },

            // FOTOGRAFIA, FONOGRAFIA — 5%
            fotografia: { aliquota: 0.05, percentual: "5%", grupo: "Fotografia e Fonografia" },
            fonografia: { aliquota: 0.05, percentual: "5%", grupo: "Fotografia e Fonografia" },
            reprografia: { aliquota: 0.05, percentual: "5%", grupo: "Fotografia e Fonografia" },
            composicao_grafica: { aliquota: 0.05, percentual: "5%", grupo: "Fotografia e Fonografia" },

            // BENS DE TERCEIROS — 5%
            assistencia_tecnica: { aliquota: 0.05, percentual: "5%", grupo: "Bens de Terceiros" },
            conserto_manutencao: { aliquota: 0.05, percentual: "5%", grupo: "Bens de Terceiros" },
            instalacao_montagem: { aliquota: 0.05, percentual: "5%", grupo: "Bens de Terceiros" },
            alfaiataria_costura: { aliquota: 0.05, percentual: "5%", grupo: "Bens de Terceiros" },
            tinturaria_lavanderia: { aliquota: 0.05, percentual: "5%", grupo: "Bens de Terceiros" },

            // TRANSPORTE — 5%
            transporte: { aliquota: 0.05, percentual: "5%", grupo: "Transporte" },
            transporte_pessoas: { aliquota: 0.05, percentual: "5%", grupo: "Transporte" },
            transporte_carga: { aliquota: 0.05, percentual: "5%", grupo: "Transporte" },
            taxi: { aliquota: 0.05, percentual: "5%", grupo: "Transporte" },

            // COMUNICAÇÃO — 5%
            telefonia: { aliquota: 0.05, percentual: "5%", grupo: "Comunicação" },
            comunicacao_internet: { aliquota: 0.05, percentual: "5%", grupo: "Comunicação" },

            // LOCAÇÃO E CESSÃO — 5%
            locacao_cessao: { aliquota: 0.05, percentual: "5%", grupo: "Locação e Cessão" },
            cessao_marcas: { aliquota: 0.05, percentual: "5%", grupo: "Locação e Cessão" },
            saloes_festas: { aliquota: 0.05, percentual: "5%", grupo: "Locação e Cessão" },

            // LIMPEZA E CONSERVAÇÃO — 5%
            limpeza_conservacao: { aliquota: 0.05, percentual: "5%", grupo: "Limpeza e Conservação" },
        },

        // Resumo agrupado por alíquota
        resumo_aliquotas: {
            aliquota_3_porcento: [
                "Medicina e biomedicina",
                "Análises clínicas, patologia, radiologia, tomografia",
                "Hospitais, clínicas, laboratórios, sanatórios",
                "Enfermagem e serviços auxiliares",
                "Serviços farmacêuticos",
                "Fisioterapia, fonoaudiologia, terapia ocupacional",
                "Nutrição, obstetrícia, odontologia",
                "Psicologia, psicanálise",
                "Próteses sob encomenda",
                "Planos de saúde",
                "Inseminação artificial, fertilização in vitro",
                "Bancos de sangue, leite, pele",
                "Casas de repouso, creches, asilos",
                "Unidade de atendimento móvel",
            ],
            aliquota_5_porcento: [
                "Informática e congêneres",
                "Pesquisa e desenvolvimento",
                "Engenharia e construção civil",
                "Educação",
                "Profissionais liberais (advocacia, contabilidade, auditoria, etc.)",
                "Veterinários",
                "Cuidados pessoais e estética",
                "Hospedagem e turismo",
                "Intermediação e corretagem",
                "Guarda, estacionamento, vigilância",
                "Diversões, lazer, entretenimento",
                "Fotografia, fonografia",
                "Serviços relativos a bens de terceiros",
                "Transporte",
                "Comunicação",
                "Locação e cessão",
            ],
        },
    },


    // ═══════════════════════════════════════════════════════════════
    //  6. IPTU — IMPOSTO PREDIAL E TERRITORIAL URBANO (Fortaleza)
    // ═══════════════════════════════════════════════════════════════

    iptu: {
        municipio_referencia: "Fortaleza",
        base_legal: "Lei Complementar nº 33/2006; LC nº 59/2008; Decreto nº 15.854/2023",
        base_calculo: "Valor venal do imóvel conforme Planta Genérica de Valores (PGV) municipal",
        tipo_aliquota: "Alíquota única (sem progressão por faixa de área)",

        residencial: {
            aliquota: 0.01,
            percentual: "1,0%",
            descricao: "Imóvel residencial — sobre valor venal",
        },

        comercial: {
            aliquota: 0.015,
            percentual: "1,5%",
            descricao: "Imóvel não residencial — sobre valor venal",
        },

        terreno_nao_edificado: {
            aliquota: 0.015,
            percentual: "1,5%",
            descricao: "Terreno não edificado — sobre valor venal",
        },

        reajuste_anual: {
            indice: "IPCA-e",
            reajuste_2025: "4,71%",
            reajuste_2026: "4,41%",
            observacao: "Sem alteração de alíquota, apenas correção inflacionária",
        },

        isencoes: [
            {
                tipo: "Imóvel residencial de baixo valor",
                descricao: "Isenção para imóveis residenciais com valor venal até R$ 101.260,13",
                vigencia: "2025",
                observacao: "Valor sujeito a atualização anual",
            },
            {
                tipo: "Imóveis de interesse público",
                descricao: "Isenção para imóveis de interesse público",
            },
            {
                tipo: "Imóveis históricos/culturais",
                descricao: "Possível redução para imóveis históricos e culturais",
            },
            {
                tipo: "PCD",
                descricao: "Conforme legislação municipal",
            },
        ],

        descontos: {
            cota_unica: {
                percentual: 0.10,
                descricao: "Até 10% de desconto para pagamento em cota única",
            },
            parcelamento: {
                parcelas: 12,
                parcela_minima: 82.59,
                parcela_minima_formatada: "R$ 82,59",
                descricao: "Até 12 parcelas sem desconto (mínimo R$ 82,59 por parcela)",
            },
        },
    },


    // ═══════════════════════════════════════════════════════════════
    //  7. ITBI — IMPOSTO SOBRE TRANSMISSÃO DE BENS IMÓVEIS (Fortaleza)
    //     Nota: Em Fortaleza é chamado ITIV
    // ═══════════════════════════════════════════════════════════════

    itbi: {
        municipio_referencia: "Fortaleza",
        nome_local: "ITIV — Imposto sobre Transmissão de Imóvel Inter Vivos",
        base_legal: "Lei Complementar nº 33/2006 (Fortaleza)",
        base_calculo: "Valor de avaliação ou valor de mercado do imóvel",

        aliquota_geral: 0.02,
        aliquota_geral_percentual: "2%",

        transmissao_comum: {
            aliquota: 0.02,
            percentual: "2%",
        },

        transmissao_doacao: {
            aliquota: 0.02,
            percentual: "2%",
        },

        sfh: {
            dados_disponiveis: false,
            obs: "Verificar alíquota específica SFH na Prefeitura de Fortaleza",
        },
    },


    // ═══════════════════════════════════════════════════════════════
    //  8. TAXAS ESTADUAIS E MUNICIPAIS
    // ═══════════════════════════════════════════════════════════════

    taxas: {

        // ── Taxas Estaduais ──
        estaduais: {
            licenciamento_veiculos: { dados_disponiveis: false, obs: "Verificar na SEFAZ/CE" },
            taxa_judiciaria: { dados_disponiveis: false, obs: "Verificar no TJCE" },
            servicos_sefaz: { dados_disponiveis: false, obs: "Verificar na SEFAZ/CE" },
            taxa_ambiental: { dados_disponiveis: false, obs: "Verificar na SEFAZ/CE" },
            taxa_incendio_bombeiros: { dados_disponiveis: false, obs: "Verificar na SEFAZ/CE" },
        },

        // ── Taxas Municipais Fortaleza ──
        municipais_fortaleza: {
            municipio_referencia: "Fortaleza",
            taxa_lixo: { dados_disponiveis: false, obs: "Verificar na SEFIN Fortaleza" },
            alvara_funcionamento: { dados_disponiveis: false, obs: "Verificar na SEFIN Fortaleza" },
            cosip: { dados_disponiveis: false, obs: "Verificar na SEFIN Fortaleza" },
            taxa_publicidade: { dados_disponiveis: false, obs: "Verificar na SEFIN Fortaleza" },
        },
    },


    // ═══════════════════════════════════════════════════════════════
    //  9. IMPOSTOS FEDERAIS (aplicáveis no Ceará)
    // ═══════════════════════════════════════════════════════════════

    federal: {
        irpj: {
            lucro_real: {
                aliquota: 0.15,
                percentual: "15%",
                base: "Lucro líquido contábil ajustado",
                adicional: {
                    aliquota: 0.10,
                    percentual: "10%",
                    limite_mensal: 20000,
                    limite_anual: 240000,
                    descricao: "Sobre excedente de R$ 20.000/mês (R$ 240.000/ano)",
                },
            },
            lucro_presumido: {
                aliquota: 0.15,
                percentual: "15%",
                presuncao: {
                    comercio: 0.08,
                    industria: 0.08,
                    servicos: 0.32,
                    transporte: 0.08,
                    transporte_passageiros: 0.16,
                    servicos_hospitalares: 0.08,
                    revenda_combustiveis: 0.016,
                },
                aliquota_efetiva: {
                    comercio: 0.012,
                    industria: 0.012,
                    servicos: 0.048,
                    transporte: 0.012,
                },
                adicional: {
                    aliquota: 0.10,
                    percentual: "10%",
                    limite_trimestral: 60000,
                    descricao: "Sobre excedente de R$ 60.000/trimestre",
                },
            },
        },

        csll: {
            aliquota_geral: 0.09,
            percentual: "9%",
            financeiras: {
                aliquota: 0.15,
                percentual: "15%",
            },
            base_lucro_presumido: {
                servicos: 0.32,
                demais: 0.12,
            },
        },

        pis_pasep: {
            regime_cumulativo: {
                aliquota: 0.0076,
                percentual: "0,76%",
                aplicacao: "Lucro Presumido",
                creditos: false,
            },
            regime_nao_cumulativo: {
                aliquota: 0.0165,
                percentual: "1,65%",
                aplicacao: "Lucro Real",
                creditos: true,
            },
            aliquota_zero_cesta_basica: true,
        },

        cofins: {
            regime_cumulativo: {
                aliquota: 0.03,
                percentual: "3%",
                aplicacao: "Lucro Presumido",
                creditos: false,
            },
            regime_nao_cumulativo: {
                aliquota: 0.076,
                percentual: "7,6%",
                aplicacao: "Lucro Real",
                creditos: true,
            },
            aliquota_zero_cesta_basica: true,
        },

        ipi: {
            referencia: "Tabela de Incidência do IPI (TIPI) vigente",
            observacao: "Ceará não possui benefícios de IPI tipo ZFM/SUFRAMA",
        },

        iof: {
            credito_pf: 0.0082,
            credito_pj: 0.0041,
            adicional_fixo: 0.0038,
            seguros: 0.0738,
            cambio: 0.0038,
            observacao: "Alíquotas padrão federais — verificar vigência",
        },

        ii: {
            observacao: "Conforme TEC (Tarifa Externa Comum do Mercosul)",
        },

        ie: {
            observacao: "Conforme NCM e regulamentação CAMEX",
        },

        itr: {
            observacao: "Imposto federal sobre propriedade rural — alíquotas conforme grau de utilização e área",
        },

        inss: {
            patronal: {
                aliquota: 0.20,
                percentual: "20%",
                base: "Sobre folha de pagamento",
            },
            patronal_maximo: {
                aliquota: 0.288,
                percentual: "28,8%",
                descricao: "Alíquota máxima incluindo RAT/SAT e terceiros",
            },
            rat_sat: {
                minima: 0.005,
                maxima: 0.03,
                percentual: "0,5% a 3%",
                condicao: "Conforme grau de risco da atividade (CNAE)",
            },
            terceiros: {
                aliquota: 0.058,
                percentual: "5,8%",
                descricao: "SESI/SENAI/SEBRAE/INCRA etc. (varia por setor)",
            },
            empregado_tabela_progressiva: [
                { faixa: 1, ate: 1518.00, aliquota: 0.075, percentual: "7,5%" },
                { faixa: 2, ate: 2793.88, aliquota: 0.09, percentual: "9%" },
                { faixa: 3, ate: 4190.83, aliquota: 0.12, percentual: "12%" },
                { faixa: 4, ate: 8157.41, aliquota: 0.14, percentual: "14%" },
            ],
            teto_contribuicao: 8157.41,
            observacao: "Tabela progressiva 2025 — valores sujeitos a atualização",
        },

        fgts: {
            aliquota: 0.08,
            percentual: "8%",
            base: "Remuneração mensal do empregado",
            multa_rescisoria: 0.40,
            multa_rescisoria_percentual: "40%",
        },

        irpf: {
            tabela_mensal_2025: [
                { faixa: 1, ate: 2112.00, aliquota: 0.00, percentual: "Isento", deducao: 0 },
                { faixa: 2, de: 2112.01, ate: 2826.65, aliquota: 0.075, percentual: "7,5%", deducao: 158.40 },
                { faixa: 3, de: 2826.66, ate: 3751.05, aliquota: 0.15, percentual: "15%", deducao: 423.15 },
                { faixa: 4, de: 3751.06, ate: 4664.68, aliquota: 0.225, percentual: "22,5%", deducao: 844.80 },
                { faixa: 5, acima_de: 4664.68, aliquota: 0.275, percentual: "27,5%", deducao: 1278.64 },
            ],
            deducao_por_dependente: 189.59,
            observacao: "Tabela mensal 2025 — verificar atualizações para 2026",
        },
    },


    // ═══════════════════════════════════════════════════════════════
    //  10. SIMPLES NACIONAL
    // ═══════════════════════════════════════════════════════════════

    simples_nacional: {
        sublimite_estadual: 3600000,
        sublimite_estadual_formatado: "R$ 3.600.000,00",
        sublimite_observacao: "Ceará adota o sublimite padrão nacional",

        limites: {
            mei: 81000,
            mei_formatado: "R$ 81.000,00",
            microempresa: 360000,
            microempresa_formatado: "R$ 360.000,00",
            epp: 4800000,
            epp_formatado: "R$ 4.800.000,00",
        },

        mei: {
            limite_anual: 81000,
            limite_anual_formatado: "R$ 81.000,00",
            das_mensal: {
                comercio_industria: 76.90,
                servicos: 81.90,
                comercio_servicos: 81.90,
            },
            icms_fixo: 1.00,
            iss_fixo: 5.00,
            observacao: "Valores baseados no salário mínimo de R$ 1.518,00 em 2025",
        },

        anexos: {
            anexo_i: {
                nome: "Comércio",
                faixas: 6,
                aliquota_minima: 0.04,
                aliquota_maxima: 0.19,
                detalhamento: [
                    { faixa: 1, rbt12_ate: 180000, aliquota: 0.04, deducao: 0 },
                    { faixa: 2, rbt12_ate: 360000, aliquota: 0.073, deducao: 5940 },
                    { faixa: 3, rbt12_ate: 720000, aliquota: 0.095, deducao: 13860 },
                    { faixa: 4, rbt12_ate: 1800000, aliquota: 0.107, deducao: 22500 },
                    { faixa: 5, rbt12_ate: 3600000, aliquota: 0.143, deducao: 87300 },
                    { faixa: 6, rbt12_ate: 4800000, aliquota: 0.19, deducao: 378000 },
                ],
            },
            anexo_ii: {
                nome: "Indústria",
                faixas: 6,
                aliquota_minima: 0.045,
                aliquota_maxima: 0.23,
                detalhamento: [
                    { faixa: 1, rbt12_ate: 180000, aliquota: 0.045, deducao: 0 },
                    { faixa: 2, rbt12_ate: 360000, aliquota: 0.078, deducao: 5940 },
                    { faixa: 3, rbt12_ate: 720000, aliquota: 0.10, deducao: 13860 },
                    { faixa: 4, rbt12_ate: 1800000, aliquota: 0.112, deducao: 22500 },
                    { faixa: 5, rbt12_ate: 3600000, aliquota: 0.147, deducao: 85500 },
                    { faixa: 6, rbt12_ate: 4800000, aliquota: 0.30, deducao: 720000 },
                ],
            },
            anexo_iii: {
                nome: "Serviços (Grupo 1)",
                faixas: 6,
                aliquota_minima: 0.06,
                aliquota_maxima: 0.33,
                detalhamento: [
                    { faixa: 1, rbt12_ate: 180000, aliquota: 0.06, deducao: 0 },
                    { faixa: 2, rbt12_ate: 360000, aliquota: 0.112, deducao: 9360 },
                    { faixa: 3, rbt12_ate: 720000, aliquota: 0.135, deducao: 17640 },
                    { faixa: 4, rbt12_ate: 1800000, aliquota: 0.16, deducao: 35640 },
                    { faixa: 5, rbt12_ate: 3600000, aliquota: 0.21, deducao: 125640 },
                    { faixa: 6, rbt12_ate: 4800000, aliquota: 0.33, deducao: 648000 },
                ],
            },
            anexo_iv: {
                nome: "Serviços (Grupo 2 — construção civil, vigilância, limpeza)",
                faixas: 6,
                aliquota_minima: 0.045,
                aliquota_maxima: 0.33,
                detalhamento: [
                    { faixa: 1, rbt12_ate: 180000, aliquota: 0.045, deducao: 0 },
                    { faixa: 2, rbt12_ate: 360000, aliquota: 0.09, deducao: 8100 },
                    { faixa: 3, rbt12_ate: 720000, aliquota: 0.1020, deducao: 12420 },
                    { faixa: 4, rbt12_ate: 1800000, aliquota: 0.14, deducao: 39780 },
                    { faixa: 5, rbt12_ate: 3600000, aliquota: 0.22, deducao: 183780 },
                    { faixa: 6, rbt12_ate: 4800000, aliquota: 0.33, deducao: 828000 },
                ],
            },
            anexo_v: {
                nome: "Serviços (Grupo 3 — auditoria, jornalismo, tecnologia, engenharia)",
                faixas: 6,
                aliquota_minima: 0.155,
                aliquota_maxima: 0.305,
                detalhamento: [
                    { faixa: 1, rbt12_ate: 180000, aliquota: 0.155, deducao: 0 },
                    { faixa: 2, rbt12_ate: 360000, aliquota: 0.18, deducao: 4500 },
                    { faixa: 3, rbt12_ate: 720000, aliquota: 0.195, deducao: 9900 },
                    { faixa: 4, rbt12_ate: 1800000, aliquota: 0.205, deducao: 17100 },
                    { faixa: 5, rbt12_ate: 3600000, aliquota: 0.23, deducao: 62100 },
                    { faixa: 6, rbt12_ate: 4800000, aliquota: 0.305, deducao: 540000 },
                ],
            },
        },
    },


    // ═══════════════════════════════════════════════════════════════
    //  11. INCENTIVOS FISCAIS E BENEFÍCIOS REGIONAIS
    // ═══════════════════════════════════════════════════════════════

    incentivos: {
        sudam: {
            ativo: false,
            abrangencia: "parcial",
            observacao: "Abrangência parcial — apenas região Oeste do Ceará. Verificar municípios específicos na SUDAM.",
        },

        sudene: {
            ativo: true,
            nome: "Superintendência do Desenvolvimento do Nordeste (SUDENE)",
            abrangencia: "Todo o estado do Ceará",
            reducao_irpj: 0.75,
            reducao_irpj_percentual: "75%",
            aliquota_irpj_efetiva: 0.0375,
            aliquota_irpj_efetiva_percentual: "3,75%",
            reinvestimento: "Incentivos para reinvestimento de lucros conforme legislação específica",
            prazo_aprovacao: "Conforme legislação SUDENE vigente",
            tipo_projeto: "Instalação, diversificação, modernização",
            legislacao: "Lei nº 8.167/1991; Decreto nº 4.213/2002 e legislação SUDENE",
        },

        zona_franca: {
            ativo: false,
            observacao: "Não há Zona Franca no Ceará",
        },

        suframa: {
            ativo: false,
            observacao: "Ceará não está na área de abrangência da SUFRAMA",
        },

        incentivos_estaduais: {
            dados_disponiveis: false,
            obs: "Verificar programas estaduais de incentivo fiscal na SEFAZ/CE (ex: PROVIN, FDI, etc.)",
        },
    },


    // ═══════════════════════════════════════════════════════════════
    //  12. REFORMA TRIBUTÁRIA
    // ═══════════════════════════════════════════════════════════════

    reforma_tributaria: {
        ibs: {
            nome: "Imposto sobre Bens e Serviços",
            aliquota_estadual_prevista: null,
            dados_disponiveis: false,
            cronograma_transicao: "Em implementação conforme legislação federal",
            substituira: "ICMS (gradualmente)",
        },
        cbs: {
            nome: "Contribuição sobre Bens e Serviços",
            aliquota_federal_prevista: null,
            dados_disponiveis: false,
            cronograma_transicao: "Em implementação conforme legislação federal",
            substituira: "PIS/COFINS (gradualmente)",
        },
        is: {
            nome: "Imposto Seletivo",
            produtos_afetados: "Produtos prejudiciais à saúde ou ao meio ambiente",
            aliquotas_estimadas: null,
            dados_disponiveis: false,
        },
        impactos_ceara: {
            beneficios_regionais: "Possível manutenção de benefícios SUDENE conforme legislação de transição",
            fundo_desenvolvimento_regional: {
                dados_disponiveis: false,
                obs: "Verificar na SEFAZ/CE",
            },
        },
    },


    // ═══════════════════════════════════════════════════════════════
    //  13. DADOS DE COBERTURA
    // ═══════════════════════════════════════════════════════════════

    cobertura: {
        versao: "3.0",
        data_atualizacao: "2026-02-10",
        localizados: [
            "ICMS — alíquota padrão interna (20% desde 01/01/2024)",
            "ICMS — alíquota anterior (17%)",
            "ICMS — alíquotas interestaduais (7% e 12%)",
            "ICMS — importação (20%)",
            "ICMS — transporte interestadual/intermunicipal (20%)",
            "ICMS — DIFAL (EC 87/2015)",
            "IPVA — automóveis até 100 CV (2,0%)",
            "IPVA — automóveis 100-180 CV (3,0%)",
            "IPVA — automóveis acima 180 CV (3,5%)",
            "IPVA — camionetas/utilitários (mesmas faixas)",
            "IPVA — ônibus/caminhões (1,0%)",
            "IPVA — motocicletas combustão (1,0% a 3,5%)",
            "IPVA — motocicletas elétricas (1,0% a 2,0%)",
            "IPVA — aeronaves (2,5%)",
            "IPVA — embarcações (2,5%)",
            "IPVA — isenção veículos até 2010",
            "IPVA — isenções (PCD, táxis, oficiais, transporte público, ambulâncias, pesca)",
            "IPVA — desconto antecipação (10%)",
            "IPVA — desconto moto sem multas (50%)",
            "ISS Fortaleza — alíquota geral (3%)",
            "ISS Fortaleza — alíquotas por serviço (2% a 5%) — tabela completa",
            "ISS Fortaleza — saúde (3%)",
            "ISS Fortaleza — informática (5%)",
            "IPTU Fortaleza — residencial (1,0%)",
            "IPTU Fortaleza — não residencial (1,5%)",
            "IPTU Fortaleza — terreno não edificado (1,5%)",
            "IPTU Fortaleza — isenção até R$ 101.260,13",
            "IPTU Fortaleza — reajuste IPCA-e (4,71% em 2025; 4,41% em 2026)",
            "ITBI/ITIV Fortaleza — 2%",
            "SUDENE — redução 75% IRPJ",
            "Simples Nacional — sublimite (R$ 3.600.000)",
            "Simples Nacional — MEI limite (R$ 81.000)",
            "Simples Nacional — Anexos I a V completos",
            "Impostos federais — IRPJ, CSLL, PIS, COFINS, INSS, FGTS, IRPF (tabelas completas)",
        ],

        nao_localizados: [
            "ICMS — energia elétrica (alíquota específica)",
            "ICMS — combustíveis (alíquota específica)",
            "ICMS — cesta básica (alíquota específica)",
            "ICMS — bebidas alcoólicas",
            "ICMS — medicamentos",
            "ICMS — telecom",
            "ICMS — FECOP/FEM (verificar se Ceará possui)",
            "ICMS — Substituição Tributária (produtos e MVA)",
            "IPVA — locadoras",
            "IPVA — calendário de vencimento detalhado",
            "ITCMD — alíquotas e faixas do Ceará",
            "ITBI/ITIV — alíquota SFH",
            "Taxas estaduais (licenciamento, judiciária, ambiental, bombeiros)",
            "Taxas municipais (lixo, alvará, COSIP)",
            "Incentivos estaduais (PROVIN, FDI, etc.)",
            "Reforma tributária — alíquotas previstas IBS/CBS/IS",
        ],

        completude_estimada: "68%",

        contatos_para_completar: [
            { orgao: "SEFAZ/CE", url: "https://www.sefaz.ce.gov.br/" },
            { orgao: "SEFAZ/CE Legislação", url: "https://www.sefaz.ce.gov.br/legislacao-tributaria/" },
            { orgao: "SEFIN Fortaleza", url: "https://www.sefin.fortaleza.ce.gov.br/" },
            { orgao: "CONFAZ", url: "http://www.confaz.fazenda.gov.br/legislacao/convenios" },
            { orgao: "SUDENE", url: "https://www.gov.br/sudene" },
            { orgao: "Receita Federal", url: "https://www.gov.br/receitafederal/" },
        ],
    },
};


// ═══════════════════════════════════════════════════════════════════════════
//  14. FUNÇÕES UTILITÁRIAS — CEARÁ
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Retorna alíquota ISS por tipo de serviço (Fortaleza)
 * @param {string} tipo - Tipo de serviço (informatica, saude, medicina, advocacia, construcao_civil, etc.)
 * @returns {object} Objeto com alíquota e observações
 */
function getISSCeara(tipo) {
    // Mapeamento de aliases comuns
    const aliases = {
        saude: "medicina",
        tecnologia: "informatica",
        ti: "informatica",
        software: "licenciamento_software",
        web: "paginas_eletronicas",
        juridico: "advocacia",
        direito: "advocacia",
        seguranca: "vigilancia_seguranca",
        limpeza: "limpeza_conservacao",
        hospital: "hospitais_clinicas",
        dentista: "odontologia",
        fisio: "fisioterapia",
        fono: "fonoaudiologia",
    };

    const tipoNormalizado = aliases[tipo] || tipo;
    const servico = CEARA_TRIBUTARIO.iss.por_tipo_servico[tipoNormalizado];

    if (servico) {
        return servico;
    }
    return {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Tipo de serviço não encontrado. Alíquota geral de Fortaleza: 3%. Faixa: 2% a 5%.",
    };
}

/**
 * Retorna alíquota IPTU residencial (Fortaleza)
 * @param {number} areaM2 - Área em metros quadrados (não utilizado — alíquota única)
 * @returns {object} Objeto com alíquota
 */
function getIPTUResidencialCeara(areaM2) {
    return {
        aliquota: CEARA_TRIBUTARIO.iptu.residencial.aliquota,
        percentual: CEARA_TRIBUTARIO.iptu.residencial.percentual,
        tipo: "Alíquota única (sem progressão por área)",
        observacao: "Isenção para imóveis residenciais com valor venal até R$ 101.260,13 (2025)",
    };
}

/**
 * Retorna alíquota IPTU comercial (Fortaleza)
 * @param {number} areaM2 - Área em metros quadrados (não utilizado — alíquota única)
 * @returns {object} Objeto com alíquota
 */
function getIPTUComercialCeara(areaM2) {
    return {
        aliquota: CEARA_TRIBUTARIO.iptu.comercial.aliquota,
        percentual: CEARA_TRIBUTARIO.iptu.comercial.percentual,
        tipo: "Alíquota única (sem progressão por área)",
    };
}

/**
 * Retorna alíquota IPVA por tipo de veículo
 * @param {string} tipo - Tipo do veículo
 * @returns {object} Objeto com alíquota e informações
 */
function getIPVACeara(tipo) {
    const veiculo = CEARA_TRIBUTARIO.ipva.aliquotas[tipo];
    if (veiculo) {
        return veiculo;
    }
    return {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Tipo não encontrado. Disponíveis: automovel_ate_100cv, automovel_100_a_180cv, automovel_acima_180cv, camioneta_utilitario_ate_100cv, camioneta_utilitario_100_a_180cv, camioneta_utilitario_acima_180cv, onibus_microonibus_caminhao, motocicleta_combustao, motocicleta_eletrica, aeronave, embarcacao",
    };
}

/**
 * Verifica se município está em Zona Franca
 * @param {string} municipio - Nome do município
 * @returns {boolean}
 */
function isZonaFrancaCeara(municipio) {
    return false; // Ceará não possui Zona Franca
}

/**
 * Verifica se município é ALC (Área de Livre Comércio)
 * @param {string} municipio - Nome do município
 * @returns {boolean}
 */
function isALCCeara(municipio) {
    return false; // Ceará não possui ALC
}

/**
 * Retorna percentual de redução IRPJ pela SUDENE
 * @returns {object} Dados da redução SUDENE
 */
function getReducaoSUDENECeara() {
    return {
        ativo: true,
        reducao: 0.75,
        reducao_percentual: "75%",
        aliquota_efetiva: 0.0375,
        aliquota_efetiva_percentual: "3,75%",
        legislacao: "Lei nº 8.167/1991; Decreto nº 4.213/2002",
    };
}

/**
 * Retorna percentual de redução IRPJ pela SUDAM (parcial no Ceará)
 * @returns {object} Dados da redução SUDAM
 */
function getReducaoSUDAMCeara() {
    return {
        ativo: false,
        abrangencia: "parcial",
        observacao: "Abrangência parcial — apenas região Oeste do Ceará. Verificar municípios na SUDAM.",
        reducao: 0,
        aliquota_efetiva: 0.15,
    };
}

/**
 * Retorna ICMS efetivo (padrão + FECOP se houver)
 * @returns {object} ICMS efetivo
 */
function getICMSEfetivoCeara() {
    const icms = CEARA_TRIBUTARIO.icms;
    const fecop = icms.fecop && icms.fecop.existe ? icms.fecop.adicional : 0;
    return {
        aliquota_padrao: icms.aliquota_padrao,
        fecop: fecop,
        aliquota_efetiva: icms.aliquota_padrao + fecop,
        aliquota_efetiva_percentual: ((icms.aliquota_padrao + fecop) * 100).toFixed(1) + "%",
    };
}

/**
 * Retorna resumo tributário do estado para exibição rápida
 * @returns {object} Resumo tributário completo
 */
function resumoTributarioCeara() {
    const d = CEARA_TRIBUTARIO;
    return {
        estado: d.dados_gerais.nome,
        sigla: d.dados_gerais.sigla,
        regiao: d.dados_gerais.regiao,
        capital: d.dados_gerais.capital,
        icms_padrao: d.icms.aliquota_padrao,
        icms_efetivo: getICMSEfetivoCeara().aliquota_efetiva,
        fecop: d.icms.fecop.existe ? d.icms.fecop.adicional : 0,
        ipva_automovel_basico: d.ipva.aliquotas.automovel_ate_100cv.aliquota,
        itcmd: "Dados não localizados — verificar SEFAZ/CE",
        iss_geral: d.iss.aliquota_geral,
        iss_saude: d.iss.por_tipo_servico.medicina.aliquota,
        iss_informatica: d.iss.por_tipo_servico.informatica.aliquota,
        iptu_residencial: d.iptu.residencial.aliquota,
        iptu_comercial: d.iptu.comercial.aliquota,
        itbi: d.itbi.aliquota_geral,
        sublimite_simples: d.simples_nacional.sublimite_estadual,
        sudam: d.incentivos.sudam.ativo,
        sudam_abrangencia: d.incentivos.sudam.abrangencia,
        sudene: d.incentivos.sudene.ativo,
        zona_franca: d.dados_gerais.zona_franca.existe,
        suframa: d.dados_gerais.suframa.abrangencia,
        reducao_irpj_sudene: d.incentivos.sudene.ativo ? d.incentivos.sudene.reducao_irpj : 0,
        completude: d.cobertura.completude_estimada,
    };
}


// ═══════════════════════════════════════════════════════════════════════════
//  15. EXPORTAÇÃO (Padrão Grupo 2)
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        ...CEARA_TRIBUTARIO,
        utils: {
            getISS: getISSCeara,
            getIPTUResidencial: getIPTUResidencialCeara,
            getIPTUComercial: getIPTUComercialCeara,
            getIPVA: getIPVACeara,
            isZonaFranca: isZonaFrancaCeara,
            isALC: isALCCeara,
            getReducaoSUDENE: getReducaoSUDENECeara,
            getReducaoSUDAM: getReducaoSUDAMCeara,
            getICMSEfetivo: getICMSEfetivoCeara,
            resumoTributario: resumoTributarioCeara,
        },
    };
}

if (typeof window !== "undefined") {
    window.CEARA_TRIBUTARIO = CEARA_TRIBUTARIO;
    window.CearaTributario = {
        getISS: getISSCeara,
        getIPTUResidencial: getIPTUResidencialCeara,
        getIPTUComercial: getIPTUComercialCeara,
        getIPVA: getIPVACeara,
        isZonaFranca: isZonaFrancaCeara,
        isALC: isALCCeara,
        getReducaoSUDENE: getReducaoSUDENECeara,
        getReducaoSUDAM: getReducaoSUDAMCeara,
        getICMSEfetivo: getICMSEfetivoCeara,
        resumoTributario: resumoTributarioCeara,
    };
}
