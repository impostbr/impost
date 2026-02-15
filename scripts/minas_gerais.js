/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MINAS_GERAIS.JS — Base de Dados Tributária Completa do Estado de Minas Gerais
 * ═══════════════════════════════════════════════════════════════════════════
 * Versão 3.0 — Padronizado conforme template roraima.js v3.0
 * Dados verificados via fontes oficiais (SEFAZ/MG, RFB, Prefeitura de Belo Horizonte)
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
 *   • SEFAZ/MG — www.fazenda.mg.gov.br
 *   • Lei nº 6.763/1975 (Lei do ICMS e IPVA de MG)
 *   • Decreto nº 38.104/1996 (RICMS/MG)
 *   • Decreto nº 48.589/2023 (Alterações RICMS)
 *   • Decreto nº 48.768/2024 (Alterações RICMS)
 *   • Resolução nº 5.857/2024 (Revogação de normas)
 *   • Resolução nº 5.977/2025 (Valores IPVA 2026)
 *   • Lei nº 14.941/2003 (ITCMD de MG)
 *   • Lei nº 8.725/2003 (Código Tributário Municipal de Belo Horizonte)
 *   • Lei nº 9.795/2009 (Política Tributária IPTU de BH)
 *   • Lei Complementar nº 116/2003 (ISS federal)
 *   • Receita Federal — www.gov.br/receitafederal
 *
 * ATUALIZAÇÃO: 10/02/2026
 * ═══════════════════════════════════════════════════════════════════════════
 */

const MINAS_GERAIS_TRIBUTARIO = {

    // ═══════════════════════════════════════════════════════════════
    //  1. DADOS GERAIS
    // ═══════════════════════════════════════════════════════════════

    dados_gerais: {
        estado: "Minas Gerais",
        sigla: "MG",
        regiao: "Sudeste",
        capital: "Belo Horizonte",
        codigo_ibge: 31,
        codigo_ibge_capital: 3106200,
        zona_franca: false,
        alc: false,
        abrangencia_sudam: false,
        abrangencia_sudene: false,
        site_sefaz: "https://www.fazenda.mg.gov.br/",
        site_sefaz_legislacao: "https://www.fazenda.mg.gov.br/empresas/legislacao_tributaria/",
        site_prefeitura_capital: "https://prefeitura.pbh.gov.br/",
        site_prefeitura_fazenda: "https://prefeitura.pbh.gov.br/fazenda/",
        legislacao_base: {
            codigo_tributario_estadual: "Lei nº 6.763/1975",
            ricms: "Decreto nº 38.104/1996 (RICMS/MG)",
            codigo_tributario_municipal: "Lei nº 8.725/2003 (Belo Horizonte)",
        },
        municipios_principais: [
            { nome: "Belo Horizonte", codigo_ibge: 3106200, capital: true },
            { nome: "Contagem", codigo_ibge: 3118402, capital: false },
            { nome: "Betim", codigo_ibge: 3105003, capital: false },
            { nome: "Montes Claros", codigo_ibge: 3142402, capital: false },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  2. ICMS — IMPOSTO SOBRE CIRCULAÇÃO DE MERCADORIAS E SERVIÇOS
    // ═══════════════════════════════════════════════════════════════

    icms: {
        aliquota_padrao: 0.18,

        fecop: {
            ativo: false,
            adicional: 0,
            obs: "MG não possui FECOP/FEM adicional ao ICMS padrão",
        },

        aliquotas_diferenciadas: {
            cesta_basica: {
                aliquota: 0.07,
                obs: "Redução para itens da cesta básica conforme RICMS/MG",
                dados_disponiveis: false,
            },
            energia_eletrica: {
                dados_disponiveis: false,
                obs: "Alíquotas diferenciadas por faixa de consumo — verificar RICMS/MG",
            },
            telecomunicacoes: {
                dados_disponiveis: false,
                obs: "Verificar RICMS/MG para alíquotas específicas",
            },
            combustiveis: {
                dados_disponiveis: false,
                obs: "Sujeito a monofásico / ICMS-ST — verificar RICMS/MG",
            },
            medicamentos: {
                dados_disponiveis: false,
                obs: "Verificar RICMS/MG para alíquotas e ST",
            },
            energia_solar: {
                obs: "Redução aplicável conforme legislação específica",
                dados_disponiveis: false,
            },
            biogas_biometano: {
                obs: "Redução aplicável conforme legislação específica",
                dados_disponiveis: false,
            },
        },

        aliquotas_interestaduais: {
            norte_nordeste_centro_oeste_es: 0.07,
            sul_sudeste_exceto_es: 0.12,
            nao_contribuinte: 0.18,
            obs: "MG está no Sudeste: saídas para N/NE/CO/ES = 7%; saídas para S/SE (exceto ES) = 12%",
        },

        importacao: {
            aliquota: 0.18,
            obs: "Alíquota interna aplicada a importações",
        },

        substituicao_tributaria: {
            ativo: true,
            obs: "MG possui ampla lista de produtos sujeitos a ICMS-ST — verificar Anexos do RICMS/MG",
            produtos_sujeitos: [],
            dados_disponiveis: false,
        },

        legislacao: [
            { norma: "Lei nº 6.763/1975", assunto: "Lei do ICMS de Minas Gerais" },
            { norma: "Decreto nº 38.104/1996", assunto: "Regulamento do ICMS (RICMS/MG)" },
            { norma: "Decreto nº 48.589/2023", assunto: "Alterações RICMS" },
            { norma: "Decreto nº 48.768/2024", assunto: "Alterações RICMS" },
            { norma: "Resolução nº 5.857/2024", assunto: "Revogação de normas" },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  3. IPVA — IMPOSTO SOBRE PROPRIEDADE DE VEÍCULOS AUTOMOTORES
    // ═══════════════════════════════════════════════════════════════

    ipva: {
        aliquotas: {
            automovel: { aliquota: 0.04, descricao: "Veículos de passeio (automóveis)" },
            caminhonete: { aliquota: 0.03, descricao: "Caminhonetes / Pick-ups" },
            motocicleta: { aliquota: 0.02, descricao: "Motocicletas, ciclomotores" },
            onibus_caminhao: { aliquota: 0.01, descricao: "Ônibus, micro-ônibus, caminhões" },
        },

        base_calculo: "Tabela FIPE (veículos usados) / Nota Fiscal (veículos novos)",

        isencoes: [
            { categoria: "Veículos com 20+ anos", condicao: "Fabricação há 20 anos ou mais", base_legal: "Emenda Constitucional 2025" },
            { categoria: "PCD", condicao: "Pessoa com deficiência, com comprovação", base_legal: "Legislação estadual" },
            { categoria: "Táxis", condicao: "Categoria aluguel, motorista profissional", base_legal: "Legislação estadual" },
            { categoria: "Veículos oficiais", condicao: "União, Estados, Municípios", base_legal: "Legislação estadual" },
            { categoria: "Transporte público", condicao: "Empresas concessionárias", base_legal: "Legislação estadual" },
            { categoria: "Ambulâncias / Bombeiros", condicao: "Sem cobrança de serviço", base_legal: "Legislação estadual" },
        ],

        descontos: {
            cota_unica: { desconto_maximo: 0.10, obs: "Até 10% conforme calendário" },
            parcelamento: { parcelas: 3, desconto: 0, obs: "Sem desconto no parcelamento" },
        },

        legislacao: [
            { norma: "Lei nº 6.763/1975", assunto: "Lei do IPVA de Minas Gerais" },
            { norma: "Resolução nº 5.977/2025", assunto: "Valores IPVA 2026" },
            { norma: "Emenda Constitucional 2025", assunto: "Isenção veículos 20+ anos" },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  4. ITCMD — IMPOSTO TRANSMISSÃO CAUSA MORTIS E DOAÇÃO
    // ═══════════════════════════════════════════════════════════════

    itcmd: {
        aliquota: 0.05,
        progressivo: false,
        obs: "Alíquota fixa de 5% — verificar legislação vigente para possíveis alterações",
        dados_disponiveis: false,
        legislacao: [
            { norma: "Lei nº 14.941/2003", assunto: "ITCMD de Minas Gerais" },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  5. ISS — IMPOSTO SOBRE SERVIÇOS (Belo Horizonte — referência)
    // ═══════════════════════════════════════════════════════════════

    iss: {
        municipio_referencia: "Belo Horizonte",
        aliquota_minima: 0.02,
        aliquota_maxima: 0.05,

        por_tipo_servico: {

            // === 2% ===
            intermediacao_imoveis: { aliquota: 0.02, descricao: "Intermediação de imóveis" },
            agenciamento_seguros: { aliquota: 0.02, descricao: "Agenciamento de seguros" },
            intermediacao_geral: { aliquota: 0.02, descricao: "Serviços de intermediação em geral" },
            profissionais_recem_formados: { aliquota: 0.02, descricao: "Atividades profissionais recém-formadas (5 anos)" },
            cartorios: { aliquota: 0.02, descricao: "Cartórios" },

            // === 2,5% ===
            saude: { aliquota: 0.025, descricao: "Serviços de saúde e assistência médica" },
            medicina: { aliquota: 0.025, descricao: "Medicina, biomedicina" },
            analises_clinicas: { aliquota: 0.025, descricao: "Análises clínicas, radiologia, tomografia" },
            hospitais_clinicas: { aliquota: 0.025, descricao: "Hospitais, clínicas, laboratórios" },
            enfermagem: { aliquota: 0.025, descricao: "Enfermagem e serviços auxiliares" },
            farmaceuticos: { aliquota: 0.025, descricao: "Serviços farmacêuticos" },
            fisioterapia: { aliquota: 0.025, descricao: "Fisioterapia, fonoaudiologia, terapia ocupacional" },
            odontologia: { aliquota: 0.025, descricao: "Odontologia" },
            psicologia: { aliquota: 0.025, descricao: "Psicologia, psicanálise" },
            casas_repouso: { aliquota: 0.025, descricao: "Casas de repouso, creches, asilos" },
            planos_saude: { aliquota: 0.025, descricao: "Planos de saúde" },
            educacao: { aliquota: 0.025, descricao: "Serviços de educação" },

            // === 3% ===
            construcao_civil: { aliquota: 0.03, descricao: "Serviços de construção civil" },
            engenharia: { aliquota: 0.03, descricao: "Engenharia, arquitetura" },
            execucao_construcao: { aliquota: 0.03, descricao: "Execução de construção civil" },
            reparacao_conservacao: { aliquota: 0.03, descricao: "Reparação, conservação e reforma" },
            limpeza_conservacao: { aliquota: 0.03, descricao: "Serviços de limpeza e conservação" },
            vigilancia_seguranca: { aliquota: 0.03, descricao: "Vigilância e segurança" },
            advocacia: { aliquota: 0.03, descricao: "Serviços de advocacia" },
            contabilidade: { aliquota: 0.03, descricao: "Serviços de contabilidade" },
            consultoria: { aliquota: 0.03, descricao: "Serviços de consultoria" },
            arrendamento_mercantil: { aliquota: 0.03, descricao: "Arrendamento mercantil" },

            // === 5% ===
            informatica: { aliquota: 0.05, descricao: "Serviços de informática" },
            desenvolvimento_sistemas: { aliquota: 0.05, descricao: "Análise e desenvolvimento de sistemas" },
            programacao: { aliquota: 0.05, descricao: "Programação" },
            processamento_dados: { aliquota: 0.05, descricao: "Processamento de dados" },
            suporte_tecnico: { aliquota: 0.05, descricao: "Suporte técnico em informática" },
            paginas_eletronicas: { aliquota: 0.05, descricao: "Planejamento, confecção, manutenção de páginas eletrônicas" },
            pesquisa_desenvolvimento: { aliquota: 0.05, descricao: "Serviços de pesquisa e desenvolvimento" },
            locacao_cessao: { aliquota: 0.05, descricao: "Serviços de locação e cessão" },
            veterinarios: { aliquota: 0.05, descricao: "Serviços veterinários" },
            estetica: { aliquota: 0.05, descricao: "Serviços de cuidados pessoais e estética" },
            barbearia_cabeleireiros: { aliquota: 0.05, descricao: "Barbearia, cabeleireiros, manicuros, pedicuros" },
            esteticistas: { aliquota: 0.05, descricao: "Esteticistas, tratamento de pele, depilação" },
            ginastica_esportes: { aliquota: 0.05, descricao: "Ginástica, dança, esportes, natação" },
            spa_emagrecimento: { aliquota: 0.05, descricao: "Centros de emagrecimento, spa" },
            hospedagem: { aliquota: 0.05, descricao: "Hospedagem em hotéis, apart-service, flats, motéis" },
            turismo: { aliquota: 0.05, descricao: "Agenciamento de turismo, viagens" },
            guias_turismo: { aliquota: 0.05, descricao: "Guias de turismo" },
            estacionamento: { aliquota: 0.05, descricao: "Guarda e estacionamento de veículos" },
            espetaculos: { aliquota: 0.05, descricao: "Espetáculos teatrais, cinematográficos, circenses" },
            parques_diversoes: { aliquota: 0.05, descricao: "Parques de diversões, centros de lazer" },
            casas_noturnas: { aliquota: 0.05, descricao: "Boates, táxi-dancing" },
            shows_eventos: { aliquota: 0.05, descricao: "Shows, ballet, danças, desfiles, bailes, óperas" },
            feiras_congressos: { aliquota: 0.05, descricao: "Feiras, exposições, congressos" },
            diversoes_eletronicas: { aliquota: 0.05, descricao: "Bilhares, boliches, diversões eletrônicas" },
            musica: { aliquota: 0.05, descricao: "Execução de música" },
            producao_eventos: { aliquota: 0.05, descricao: "Produção de eventos, espetáculos, shows" },
            fotografia_cinema: { aliquota: 0.05, descricao: "Fonografia, fotografia, cinematografia" },
            reprografia: { aliquota: 0.05, descricao: "Reprografia, microfilmagem, digitalização" },
            grafica: { aliquota: 0.05, descricao: "Composição gráfica, impressos gráficos" },
            mecanica_veiculos: { aliquota: 0.05, descricao: "Lubrificação, limpeza, lustração, revisão, conserto" },
            assistencia_tecnica: { aliquota: 0.05, descricao: "Assistência Técnica" },
            motores: { aliquota: 0.05, descricao: "Recondicionamento de motores" },
            pneus: { aliquota: 0.05, descricao: "Recauchutagem ou regeneração de pneus" },
            restauracao: { aliquota: 0.05, descricao: "Restauração, recondicionamento, pintura" },
            instalacao_montagem: { aliquota: 0.05, descricao: "Instalação e montagem de aparelhos, máquinas" },
            alfaiataria: { aliquota: 0.05, descricao: "Alfaiataria e costura" },
            tinturaria_lavanderia: { aliquota: 0.05, descricao: "Tinturaria e lavanderia" },
            tapecaria: { aliquota: 0.05, descricao: "Tapeçaria e reforma de estofamento" },
            funilaria: { aliquota: 0.05, descricao: "Funilaria e lanternagem" },
            transporte_pessoas: { aliquota: 0.05, descricao: "Transporte de pessoas" },
            transporte_carga: { aliquota: 0.05, descricao: "Transporte de carga" },
            transporte_urbano_pessoas: { aliquota: 0.05, descricao: "Transporte urbano de pessoas" },
            transporte_urbano_carga: { aliquota: 0.05, descricao: "Transporte urbano de carga" },
            taxi: { aliquota: 0.05, descricao: "Serviços de táxi" },
            mala_direta: { aliquota: 0.05, descricao: "Transporte de mala direta" },
            reboque: { aliquota: 0.05, descricao: "Serviços de reboque" },
            transporte_valores: { aliquota: 0.05, descricao: "Transporte de valores" },
            telefonia: { aliquota: 0.05, descricao: "Serviços de telefonia" },
            comunicacao_satelite: { aliquota: 0.05, descricao: "Serviços de comunicação por satélite" },
            comunicacao_radio: { aliquota: 0.05, descricao: "Serviços de comunicação por rádio" },
            comunicacao_tv: { aliquota: 0.05, descricao: "Serviços de comunicação por televisão" },
            comunicacao_internet: { aliquota: 0.05, descricao: "Serviços de comunicação por internet" },
            auditoria: { aliquota: 0.05, descricao: "Serviços de auditoria" },
            pericia: { aliquota: 0.05, descricao: "Serviços de perícia" },
            traducao: { aliquota: 0.05, descricao: "Serviços de tradução" },
            interpretacao: { aliquota: 0.05, descricao: "Serviços de interpretação" },
            secretariado: { aliquota: 0.05, descricao: "Serviços de secretariado" },
            administracao_imoveis: { aliquota: 0.05, descricao: "Serviços de administração de imóveis" },
            administracao_empresas: { aliquota: 0.05, descricao: "Serviços de administração de empresas" },
            administracao_condominios: { aliquota: 0.05, descricao: "Serviços de administração de condomínios" },
        },

        legislacao: [
            { norma: "Lei Complementar nº 116/2003", assunto: "Normas Gerais ISS (Federal)" },
            { norma: "Lei nº 8.725/2003", assunto: "Código Tributário Municipal de Belo Horizonte" },
            { norma: "Portaria SMF nº 002/2012", assunto: "Tabela de Códigos de Tributação ISS" },
            { norma: "Portaria SMFA nº 74/2021", assunto: "Alterações CTISS" },
        ],

        portal: "http://www.pbh.gov.br/bhissdigital/",
    },


    // ═══════════════════════════════════════════════════════════════
    //  6. IPTU — IMPOSTO PREDIAL E TERRITORIAL URBANO (Belo Horizonte)
    // ═══════════════════════════════════════════════════════════════

    iptu: {
        municipio_referencia: "Belo Horizonte",

        residencial: {
            faixas: [
                { limite_inferior: 0, limite_superior: 170008.00, aliquota: 0.006 },
                { limite_inferior: 170008.01, limite_superior: 425020.00, aliquota: 0.007 },
                { limite_inferior: 425020.01, limite_superior: 850040.00, aliquota: 0.008 },
                { limite_inferior: 850040.01, limite_superior: Infinity, aliquota: 0.009 },
            ],
        },

        nao_residencial: {
            faixas: [
                { limite_inferior: 0, limite_superior: 170008.00, aliquota: 0.008 },
                { limite_inferior: 170008.01, limite_superior: 425020.00, aliquota: 0.010 },
                { limite_inferior: 425020.01, limite_superior: 850040.00, aliquota: 0.012 },
                { limite_inferior: 850040.01, limite_superior: Infinity, aliquota: 0.014 },
            ],
        },

        terreno_nao_edificado: {
            dados_disponiveis: false,
            obs: "Verificar legislação municipal de BH para alíquotas de terreno não edificado",
        },

        isencoes: [
            { categoria: "Imóveis de Interesse Público", condicao: "Conforme legislação", base_legal: "Lei nº 9.795/2009" },
            { categoria: "Programa de Arrendamento Residencial (PAR)", condicao: "Valor até R$ 95.506,60", base_legal: "Legislação municipal" },
            { categoria: "Imóvel Residencial Único", condicao: "Redução/Isenção conforme renda", base_legal: "Legislação municipal" },
            { categoria: "Idosos e Aposentados", condicao: "Desconto especial", base_legal: "Legislação municipal" },
        ],

        descontos: {
            cota_unica: { desconto: 0.05, prazo: "Até 31/01 do exercício", obs: "5% de desconto para cota única" },
            parcelamento: { parcelas: 11, desconto: 0, obs: "Sem desconto no parcelamento" },
        },

        reajuste_2026: 0.0441,

        legislacao: [
            { norma: "Lei nº 9.795/2009", assunto: "Política Tributária IPTU de BH" },
            { norma: "Lei nº 6.763/1975", assunto: "Lei de Finanças Públicas" },
        ],

        portal: "https://prefeitura.pbh.gov.br/fazenda/iptu",
    },


    // ═══════════════════════════════════════════════════════════════
    //  7. ITBI — IMPOSTO TRANSMISSÃO DE BENS IMÓVEIS (Belo Horizonte)
    // ═══════════════════════════════════════════════════════════════

    itbi: {
        municipio_referencia: "Belo Horizonte",
        aliquota_geral: 0.03,
        obs: "Alíquota padrão de 3% — verificar legislação vigente para detalhes SFH",
        dados_disponiveis: false,
        legislacao: [
            { norma: "Código Tributário Municipal de BH", assunto: "ITBI" },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  8. TAXAS ESTADUAIS E MUNICIPAIS
    // ═══════════════════════════════════════════════════════════════

    taxas: {
        taxa_lixo: {
            dados_disponiveis: false,
            obs: "Verificar legislação municipal de BH",
        },
        taxa_alvara: {
            dados_disponiveis: false,
            obs: "Verificar legislação municipal de BH",
        },
        cosip: {
            dados_disponiveis: false,
            obs: "Contribuição para custeio da iluminação pública — verificar BH",
        },
    },


    // ═══════════════════════════════════════════════════════════════
    //  9. IMPOSTOS FEDERAIS (aplicáveis em MG)
    // ═══════════════════════════════════════════════════════════════

    federal: {

        irpj: {
            lucro_real: {
                aliquota_base: 0.15,
                adicional: 0.10,
                limite_adicional_mensal: 20000,
                limite_adicional_anual: 240000,
                obs: "15% sobre lucro líquido + 10% sobre excedente de R$ 20.000/mês",
            },
            lucro_presumido: {
                presuncao: {
                    comercio_industria: 0.08,
                    servicos: 0.32,
                    transporte: 0.08,
                    geral: 0.08,
                },
                aliquota: 0.15,
                aliquota_efetiva: {
                    comercio_industria: 0.012,
                    servicos: 0.048,
                    transporte: 0.012,
                    geral: 0.012,
                },
            },
            incentivos_regionais: {
                sudam: { ativo: false, obs: "MG não está na área de abrangência da SUDAM" },
                sudene: { ativo: false, obs: "MG não está na área de abrangência da SUDENE" },
            },
        },

        csll: {
            aliquota_geral: 0.09,
            aliquota_financeiras: 0.15,
            presuncao_lucro_presumido: {
                servicos: 0.32,
                comercio_industria: 0.12,
                geral: 0.12,
            },
        },

        pis: {
            cumulativo: { aliquota: 0.0076, obs: "Lucro Presumido — sem créditos" },
            nao_cumulativo: { aliquota: 0.0165, obs: "Lucro Real — com créditos" },
        },

        cofins: {
            cumulativo: { aliquota: 0.03, obs: "Lucro Presumido — sem créditos" },
            nao_cumulativo: { aliquota: 0.076, obs: "Lucro Real — com créditos" },
        },

        ipi: {
            obs: "Alíquotas por NCM — tabela TIPI vigente. MG não possui benefícios ZFM/ALC.",
            beneficios_regionais: false,
        },

        iof: {
            obs: "Alíquotas federais padrão — operações de crédito, câmbio, seguros, títulos",
        },

        ii: {
            obs: "Imposto de Importação — TEC vigente, alíquotas por NCM",
        },

        ie: {
            obs: "Imposto de Exportação — geralmente 0%, exceto produtos regulados",
        },

        itr: {
            obs: "Imposto Territorial Rural — alíquotas conforme grau de utilização e área total",
        },

        inss: {
            patronal: {
                aliquota_geral: 0.20,
                rat_sat: { minimo: 0.005, maximo: 0.03, obs: "RAT/SAT de 0,5% a 3% conforme atividade" },
                total_maximo: 0.288,
                obs: "20% patronal + RAT/SAT (0,5% a 3%) + terceiros (até 5,8%)",
            },
            empregado: {
                faixas: [
                    { limite: 1412.00, aliquota: 0.075 },
                    { limite: 2666.68, aliquota: 0.09 },
                    { limite: 4000.03, aliquota: 0.12 },
                    { limite: 7786.02, aliquota: 0.14 },
                ],
                obs: "Tabela progressiva — valores 2024/2025",
            },
        },

        fgts: {
            aliquota_mensal: 0.08,
            multa_rescisoria: 0.40,
            obs: "8% sobre remuneração mensal + 40% multa rescisória sem justa causa",
        },

        irpf: {
            tabela_mensal: [
                { limite_inferior: 0, limite_superior: 2112.00, aliquota: 0, deducao: 0 },
                { limite_inferior: 2112.01, limite_superior: 2826.65, aliquota: 0.075, deducao: 158.40 },
                { limite_inferior: 2826.66, limite_superior: 3751.05, aliquota: 0.15, deducao: 423.15 },
                { limite_inferior: 3751.06, limite_superior: 4664.68, aliquota: 0.225, deducao: 844.80 },
                { limite_inferior: 4664.69, limite_superior: Infinity, aliquota: 0.275, deducao: 1278.64 },
            ],
            obs: "Tabela IRPF 2025",
        },
    },


    // ═══════════════════════════════════════════════════════════════
    //  10. SIMPLES NACIONAL
    // ═══════════════════════════════════════════════════════════════

    simples_nacional: {
        sublimite_estadual: 3600000,
        obs_sublimite: "MG adota sublimite de R$ 3.600.000 para ICMS e ISS no Simples Nacional",

        mei: {
            limite_anual: 81000,
            obs: "MEI — limite federal",
        },

        limites: {
            microempresa: 360000,
            epp: 4800000,
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
                    { faixa: 6, receita_ate: 4800000, aliquota: 0.19, deducao: 378000 },
                ],
            },
            anexo_ii: {
                nome: "Indústria",
                faixas: [
                    { faixa: 1, receita_ate: 180000, aliquota: 0.045, deducao: 0 },
                    { faixa: 2, receita_ate: 360000, aliquota: 0.078, deducao: 5940 },
                    { faixa: 3, receita_ate: 720000, aliquota: 0.10, deducao: 13860 },
                    { faixa: 4, receita_ate: 1800000, aliquota: 0.112, deducao: 22500 },
                    { faixa: 5, receita_ate: 3600000, aliquota: 0.1472, deducao: 85500 },
                    { faixa: 6, receita_ate: 4800000, aliquota: 0.30, deducao: 720000 },
                ],
            },
            anexo_iii: {
                nome: "Serviços (receitas de locação de bens móveis, agências de viagem, escritórios contábeis, etc.)",
                faixas: [
                    { faixa: 1, receita_ate: 180000, aliquota: 0.06, deducao: 0 },
                    { faixa: 2, receita_ate: 360000, aliquota: 0.112, deducao: 9360 },
                    { faixa: 3, receita_ate: 720000, aliquota: 0.135, deducao: 17640 },
                    { faixa: 4, receita_ate: 1800000, aliquota: 0.16, deducao: 35640 },
                    { faixa: 5, receita_ate: 3600000, aliquota: 0.21, deducao: 125640 },
                    { faixa: 6, receita_ate: 4800000, aliquota: 0.33, deducao: 648000 },
                ],
            },
            anexo_iv: {
                nome: "Serviços (construção civil, vigilância, limpeza, obras, etc.)",
                faixas: [
                    { faixa: 1, receita_ate: 180000, aliquota: 0.045, deducao: 0 },
                    { faixa: 2, receita_ate: 360000, aliquota: 0.09, deducao: 8100 },
                    { faixa: 3, receita_ate: 720000, aliquota: 0.102, deducao: 12420 },
                    { faixa: 4, receita_ate: 1800000, aliquota: 0.14, deducao: 39780 },
                    { faixa: 5, receita_ate: 3600000, aliquota: 0.22, deducao: 183780 },
                    { faixa: 6, receita_ate: 4800000, aliquota: 0.33, deducao: 828000 },
                ],
            },
            anexo_v: {
                nome: "Serviços (auditoria, tecnologia, engenharia, publicidade, etc.)",
                faixas: [
                    { faixa: 1, receita_ate: 180000, aliquota: 0.155, deducao: 0 },
                    { faixa: 2, receita_ate: 360000, aliquota: 0.18, deducao: 4500 },
                    { faixa: 3, receita_ate: 720000, aliquota: 0.195, deducao: 9900 },
                    { faixa: 4, receita_ate: 1800000, aliquota: 0.205, deducao: 17100 },
                    { faixa: 5, receita_ate: 3600000, aliquota: 0.23, deducao: 62100 },
                    { faixa: 6, receita_ate: 4800000, aliquota: 0.305, deducao: 540000 },
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
            obs: "Minas Gerais NÃO está na área de abrangência da SUDAM",
        },
        sudene: {
            ativo: false,
            obs: "Minas Gerais NÃO está na área de abrangência da SUDENE (exceto Vale do Jequitinhonha/Mucuri em programas específicos)",
        },
        zona_franca: {
            ativo: false,
            obs: "Minas Gerais não possui Zona Franca ou ALC",
        },
        programas_estaduais: {
            dados_disponiveis: false,
            obs: "Verificar programas de incentivo da SEFAZ/MG (ex: crédito presumido ICMS, regime especial para setores)",
        },
    },


    // ═══════════════════════════════════════════════════════════════
    //  12. REFORMA TRIBUTÁRIA
    // ═══════════════════════════════════════════════════════════════

    reforma_tributaria: {
        ibs: {
            obs: "Imposto sobre Bens e Serviços — substituirá ICMS e ISS. Transição 2026-2033.",
        },
        cbs: {
            obs: "Contribuição sobre Bens e Serviços — substituirá PIS e COFINS.",
        },
        is: {
            obs: "Imposto Seletivo — sobre bens e serviços prejudiciais à saúde ou meio ambiente.",
        },
        impactos_estado: {
            obs: "MG como grande estado do Sudeste terá ajustes significativos na transição. Sem benefícios regionais SUDAM/SUDENE a manter.",
        },
    },


    // ═══════════════════════════════════════════════════════════════
    //  13. DADOS DE COBERTURA
    // ═══════════════════════════════════════════════════════════════

    cobertura: {
        versao: "3.0",
        data_atualizacao: "2026-02-10",
        localizados: [
            "ICMS — alíquota padrão 18% e interestaduais",
            "ICMS — alíquota importação",
            "IPVA — alíquotas por tipo de veículo (4 categorias)",
            "IPVA — isenções (6 categorias)",
            "IPVA — descontos cota única até 10%",
            "ISS BH — tabela completa por tipo de serviço (2% a 5%)",
            "IPTU BH — faixas residenciais (4 faixas)",
            "IPTU BH — faixas não-residenciais (4 faixas)",
            "IPTU BH — isenções e descontos",
            "IRPJ — Lucro Real e Presumido",
            "CSLL — alíquotas",
            "PIS/COFINS — cumulativo e não-cumulativo",
            "INSS — patronal e empregado",
            "FGTS — alíquotas",
            "IRPF — tabela mensal 2025",
            "Simples Nacional — limites e anexos I a V",
            "Legislação base — ICMS, IPVA, ISS, IPTU",
        ],
        nao_localizados: [
            "ICMS — alíquotas diferenciadas (cesta básica, energia, telecom, combustíveis, medicamentos)",
            "ICMS — FECOP/FEM (não aplicável em MG)",
            "ICMS — Substituição Tributária (lista de produtos e MVA)",
            "ITCMD — alíquotas detalhadas e progressividade",
            "ITBI — alíquota confirmada e detalhes SFH",
            "IPTU — terreno não edificado",
            "Taxas estaduais e municipais (lixo, alvará, COSIP)",
            "Programas estaduais de incentivo fiscal",
            "IPVA — calendário detalhado de vencimento 2026",
        ],
        contatos_para_completar: [
            { orgao: "SEFAZ/MG", url: "https://www.fazenda.mg.gov.br/" },
            { orgao: "Prefeitura de Belo Horizonte", url: "https://prefeitura.pbh.gov.br/fazenda/" },
            { orgao: "Receita Federal", url: "https://www.gov.br/receitafederal/" },
        ],
    },
};


// ═══════════════════════════════════════════════════════════════════════════
//  14. FUNÇÕES UTILITÁRIAS — MINAS GERAIS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Retorna alíquota ISS por tipo de serviço em Belo Horizonte
 * @param {string} tipo - Chave do serviço (ex: "informatica", "saude", "construcao_civil")
 * @returns {number|null} Alíquota em decimal ou null se não encontrado
 */
function getISSMinasGerais(tipo) {
    if (!tipo) return null;
    var chave = tipo.toLowerCase().replace(/[\s-]+/g, "_");
    var servico = MINAS_GERAIS_TRIBUTARIO.iss.por_tipo_servico[chave];
    return servico ? servico.aliquota : null;
}

/**
 * Retorna alíquota IPTU residencial por valor venal
 * @param {number} valorVenal - Valor venal do imóvel em R$
 * @returns {number|null} Alíquota em decimal
 */
function getIPTUResidencialMinasGerais(valorVenal) {
    if (!valorVenal || valorVenal <= 0) return null;
    var faixas = MINAS_GERAIS_TRIBUTARIO.iptu.residencial.faixas;
    for (var i = 0; i < faixas.length; i++) {
        if (valorVenal >= faixas[i].limite_inferior && valorVenal <= faixas[i].limite_superior) {
            return faixas[i].aliquota;
        }
    }
    return faixas[faixas.length - 1].aliquota;
}

/**
 * Retorna alíquota IPTU não-residencial (comercial) por valor venal
 * @param {number} valorVenal - Valor venal do imóvel em R$
 * @returns {number|null} Alíquota em decimal
 */
function getIPTUComercialMinasGerais(valorVenal) {
    if (!valorVenal || valorVenal <= 0) return null;
    var faixas = MINAS_GERAIS_TRIBUTARIO.iptu.nao_residencial.faixas;
    for (var i = 0; i < faixas.length; i++) {
        if (valorVenal >= faixas[i].limite_inferior && valorVenal <= faixas[i].limite_superior) {
            return faixas[i].aliquota;
        }
    }
    return faixas[faixas.length - 1].aliquota;
}

/**
 * Retorna alíquota IPVA por tipo de veículo
 * @param {string} tipo - Tipo do veículo (automovel, caminhonete, motocicleta, onibus_caminhao)
 * @returns {number|null} Alíquota em decimal
 */
function getIPVAMinasGerais(tipo) {
    if (!tipo) return null;
    var chave = tipo.toLowerCase().replace(/[\s-]+/g, "_");
    var veiculo = MINAS_GERAIS_TRIBUTARIO.ipva.aliquotas[chave];
    return veiculo ? veiculo.aliquota : null;
}

/**
 * Verifica se o município é Zona Franca
 * @returns {boolean} Sempre false para MG
 */
function isZonaFrancaMinasGerais() {
    return false;
}

/**
 * Verifica se o município é ALC
 * @returns {boolean} Sempre false para MG
 */
function isALCMinasGerais() {
    return false;
}

/**
 * Retorna percentual de redução SUDAM no IRPJ
 * @returns {number} 0 — MG não tem SUDAM
 */
function getReducaoSUDAMMinasGerais() {
    return 0;
}

/**
 * Retorna percentual de redução SUDENE no IRPJ
 * @returns {number} 0 — MG não tem SUDENE
 */
function getReducaoSUDENEMinasGerais() {
    return 0;
}

/**
 * Retorna ICMS efetivo (padrão + FECOP)
 * @returns {number} 0.18 — sem FECOP em MG
 */
function getICMSEfetivoMinasGerais() {
    return MINAS_GERAIS_TRIBUTARIO.icms.aliquota_padrao + (MINAS_GERAIS_TRIBUTARIO.icms.fecop.ativo ? MINAS_GERAIS_TRIBUTARIO.icms.fecop.adicional : 0);
}

/**
 * Calcula alíquota efetiva do Simples Nacional
 * @param {number} rbt12 - Receita Bruta dos últimos 12 meses
 * @param {string} anexo - Anexo (anexo_i, anexo_ii, anexo_iii, anexo_iv, anexo_v)
 * @returns {number|null} Alíquota efetiva em decimal
 */
function getAliquotaSimplesNacionalMinasGerais(rbt12, anexo) {
    if (!rbt12 || rbt12 <= 0 || !anexo) return null;
    var tabela = MINAS_GERAIS_TRIBUTARIO.simples_nacional.anexos[anexo];
    if (!tabela) return null;
    var faixa = null;
    for (var i = 0; i < tabela.faixas.length; i++) {
        if (rbt12 <= tabela.faixas[i].receita_ate) {
            faixa = tabela.faixas[i];
            break;
        }
    }
    if (!faixa) return null;
    // Fórmula: (RBT12 x Aliq - Ded) / RBT12
    var aliquotaEfetiva = ((rbt12 * faixa.aliquota) - faixa.deducao) / rbt12;
    return Math.max(0, aliquotaEfetiva);
}

/**
 * Retorna objeto resumido para exibição rápida
 * @returns {Object} Resumo tributário do estado
 */
function resumoTributarioMinasGerais() {
    return {
        estado: MINAS_GERAIS_TRIBUTARIO.dados_gerais.estado,
        sigla: MINAS_GERAIS_TRIBUTARIO.dados_gerais.sigla,
        regiao: MINAS_GERAIS_TRIBUTARIO.dados_gerais.regiao,
        icms_padrao: MINAS_GERAIS_TRIBUTARIO.icms.aliquota_padrao,
        icms_efetivo: getICMSEfetivoMinasGerais(),
        fecop: MINAS_GERAIS_TRIBUTARIO.icms.fecop.ativo,
        ipva_automovel: MINAS_GERAIS_TRIBUTARIO.ipva.aliquotas.automovel.aliquota,
        iss_minimo: MINAS_GERAIS_TRIBUTARIO.iss.aliquota_minima,
        iss_maximo: MINAS_GERAIS_TRIBUTARIO.iss.aliquota_maxima,
        iptu_residencial_min: MINAS_GERAIS_TRIBUTARIO.iptu.residencial.faixas[0].aliquota,
        iptu_residencial_max: MINAS_GERAIS_TRIBUTARIO.iptu.residencial.faixas[MINAS_GERAIS_TRIBUTARIO.iptu.residencial.faixas.length - 1].aliquota,
        sublimite_simples: MINAS_GERAIS_TRIBUTARIO.simples_nacional.sublimite_estadual,
        sudam: MINAS_GERAIS_TRIBUTARIO.incentivos.sudam.ativo,
        sudene: MINAS_GERAIS_TRIBUTARIO.incentivos.sudene.ativo,
        zona_franca: MINAS_GERAIS_TRIBUTARIO.incentivos.zona_franca.ativo,
    };
}


// ═══════════════════════════════════════════════════════════════════════════
//  15. EXPORTAÇÃO (Padrão Grupo 2)
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        ...MINAS_GERAIS_TRIBUTARIO,
        utils: {
            getISS: getISSMinasGerais,
            getIPTUResidencial: getIPTUResidencialMinasGerais,
            getIPTUComercial: getIPTUComercialMinasGerais,
            getIPVA: getIPVAMinasGerais,
            isZonaFranca: isZonaFrancaMinasGerais,
            isALC: isALCMinasGerais,
            getReducaoSUDAM: getReducaoSUDAMMinasGerais,
            getReducaoSUDENE: getReducaoSUDENEMinasGerais,
            getICMSEfetivo: getICMSEfetivoMinasGerais,
            getAliquotaSimplesNacional: getAliquotaSimplesNacionalMinasGerais,
            resumoTributario: resumoTributarioMinasGerais,
        },
    };
}

if (typeof window !== "undefined") {
    window.MINAS_GERAIS_TRIBUTARIO = MINAS_GERAIS_TRIBUTARIO;
    window.MinasGeraisTributario = {
        getISS: getISSMinasGerais,
        getIPTUResidencial: getIPTUResidencialMinasGerais,
        getIPTUComercial: getIPTUComercialMinasGerais,
        getIPVA: getIPVAMinasGerais,
        isZonaFranca: isZonaFrancaMinasGerais,
        isALC: isALCMinasGerais,
        getReducaoSUDAM: getReducaoSUDAMMinasGerais,
        getReducaoSUDENE: getReducaoSUDENEMinasGerais,
        getICMSEfetivo: getICMSEfetivoMinasGerais,
        getAliquotaSimplesNacional: getAliquotaSimplesNacionalMinasGerais,
        resumo: resumoTributarioMinasGerais,
    };
}
