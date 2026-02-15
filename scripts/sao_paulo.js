/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SAO_PAULO.JS — Base de Dados Tributária Completa do Estado de São Paulo
 * ═══════════════════════════════════════════════════════════════════════════
 * Versão 3.0 — Padronizado conforme template roraima.js v3.0
 * Dados verificados via fontes oficiais (SEFAZ-SP, RFB, Prefeitura de São Paulo)
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
 *   • SEFAZ-SP — portal.fazenda.sp.gov.br
 *   • Prefeitura de São Paulo — www.prefeitura.sp.gov.br
 *   • RICMS-SP — Regulamento do ICMS de São Paulo
 *   • Lei Complementar nº 87/1996 (Lei Kandir)
 *   • Lei nº 13.296/2008 (IPVA-SP)
 *   • Decreto nº 70.087/2025 (IPVA 2026)
 *   • Lei nº 6.606/1989 (ITCMD-SP)
 *   • Lei Municipal nº 13.701/2003 (ISS-SP)
 *   • IN SF/SUREM nº 08/2011 e nº 23/2017 (alíquotas ISS)
 *   • Lei nº 6.989/1966, Lei nº 15.889/2013, Lei nº 18.330/2025 (IPTU-SP)
 *   • Lei nº 11.154/1991 (ITBI-SP)
 *   • LC 214/2025, LC 224/2025, LC 227/2026 (Reforma Tributária)
 *   • Receita Federal — www.gov.br/receitafederal
 *
 * ATUALIZAÇÃO: 10/02/2026
 * ═══════════════════════════════════════════════════════════════════════════
 */

const SAO_PAULO_TRIBUTARIO = {

    // ═══════════════════════════════════════════════════════════════
    //  1. DADOS GERAIS
    // ═══════════════════════════════════════════════════════════════

    dados_gerais: {
        nome: "São Paulo",
        sigla: "SP",
        codigo_ibge: 35,
        capital: "São Paulo",
        codigo_ibge_capital: 3550308,
        regiao: "Sudeste",
        zona_franca: false,
        alc: false,
        sudam: false,
        sudene: false,
        sefaz_url: "https://portal.fazenda.sp.gov.br/",
        sefaz_legislacao: "https://legislacao.fazenda.sp.gov.br/",
        prefeitura_capital_url: "https://www.prefeitura.sp.gov.br/",
        prefeitura_fazenda_url: "https://www.prefeitura.sp.gov.br/cidade/secretarias/fazenda/",
        destaque: "Maior estado da federação em arrecadação tributária, maior arrecadador de ICMS do Brasil.",
        municipios_principais: [
            { nome: "São Paulo", codigo_ibge: 3550308, capital: true },
            { nome: "Guarulhos", codigo_ibge: 3518800, capital: false },
            { nome: "Campinas", codigo_ibge: 3509502, capital: false },
            { nome: "São Bernardo do Campo", codigo_ibge: 3548708, capital: false }
        ],
        principais_leis_base: [
            { lei: "Lei Complementar nº 87/1996", descricao: "Lei Kandir — base do ICMS" },
            { lei: "RICMS-SP", descricao: "Regulamento do ICMS de São Paulo" },
            { lei: "Lei nº 13.296/2008", descricao: "Lei base do IPVA em São Paulo" },
            { lei: "Decreto nº 70.087/2025", descricao: "Regulamenta o IPVA para 2026" },
            { lei: "Lei nº 6.606/1989", descricao: "Lei base do ITCMD em São Paulo" }
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    //  2. ICMS — IMPOSTO SOBRE CIRCULAÇÃO DE MERCADORIAS E SERVIÇOS
    // ═══════════════════════════════════════════════════════════════

    icms: {
        aliquota_padrao: 0.18,
        fecop: {
            ativo: false,
            adicional: 0,
            obs: "SP não possui FECOP/FEM adicional ao ICMS padrão"
        },

        aliquotas_diferenciadas: {
            cesta_basica: {
                aliquota: null,
                obs: "Alíquota reduzida para alimentos essenciais — conforme legislação específica RICMS-SP",
                dados_disponiveis: false
            },
            energia_eletrica: {
                obs: "Reduzida para consumo residencial básico — conforme legislação específica",
                dados_disponiveis: false
            },
            telecomunicacoes: {
                aliquota: 0.25,
                obs: "Comunicação (telefonia, internet) — alíquota elevada"
            },
            combustiveis: {
                obs: "Substituição tributária monofásica com valores específicos por litro — atualizado 01/01/2026",
                dados_disponiveis: false
            },
            bebidas_alcoolicas: {
                aliquota_minima: 0.25,
                aliquota_maxima: 0.30,
                obs: "25% a 30% — alíquota elevada"
            },
            cigarros_fumo: {
                aliquota_minima: 0.30,
                aliquota_maxima: 0.35,
                obs: "30% a 35% — uma das mais altas do Brasil"
            },
            veiculos_automotores: {
                aliquota: 0.18,
                obs: "Alíquota geral"
            },
            energia_solar: {
                obs: "Reduzida ou isenta conforme convênios ICMS",
                dados_disponiveis: false
            }
        },

        aliquotas_interestaduais: {
            norte_nordeste_centro_oeste_es: 0.07,
            sul_sudeste_exceto_es: 0.12,
            nao_contribuinte: 0.18,
            obs: "SP está no Sudeste: saídas para N/NE/CO/ES = 7%; saídas para S/SE (exceto ES) = 12%"
        },

        importacao: {
            aliquota: 0.18,
            obs: "Alíquota interna aplicada a importações"
        },

        difal: {
            descricao: "Diferencial de alíquota na entrada de mercadorias de outros estados para consumo ou ativo fixo",
            calculo: "18% - alíquota interestadual de origem",
            exemplo: "Remessa de PI (7%) para SP: DIFAL = 18% - 7% = 11%"
        },

        substituicao_tributaria: {
            ativo: true,
            obs: "SP possui ampla lista de produtos sujeitos a ICMS-ST — verificar RICMS-SP",
            produtos_sujeitos: [],
            dados_disponiveis: false
        },

        convenios_2026: {
            descricao: "SP prorrogou diversos convênios ICMS até 31/12/2026",
            base_legal: "Convênio ICMS nº 21/2026 (29 de janeiro de 2026)"
        },

        legislacao: [
            { norma: "Lei Complementar nº 87/1996", assunto: "Lei Kandir — base do ICMS" },
            { norma: "RICMS-SP (art. 52, inciso I)", assunto: "Regulamento do ICMS de São Paulo — alíquota geral 18%" },
            { norma: "Convênio ICMS nº 21/2026", assunto: "Prorrogação de benefícios fiscais até 31/12/2026" }
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    //  3. IPVA — IMPOSTO SOBRE PROPRIEDADE DE VEÍCULOS AUTOMOTORES
    // ═══════════════════════════════════════════════════════════════

    ipva: {
        aliquotas: {
            automovel: { aliquota: 0.04, descricao: "Automóveis de passeio (novos e usados)" },
            motocicleta: { aliquota: 0.02, descricao: "Motocicletas e similares" },
            onibus_microonibus: { aliquota: 0.02, descricao: "Ônibus e micro-ônibus (transporte coletivo)" },
            caminhonete_cabine_simples: { aliquota: 0.02, descricao: "Caminhonetes cabine simples (até 3 passageiros)" },
            caminhao: { aliquota: 0.015, descricao: "Caminhões (comercial pesado)" },
            trator_agricola: { aliquota: 0.015, descricao: "Tratores agrícolas" },
            eletrico_hibrido: { obs: "Redução progressiva até 2026 — incentivo ambiental", dados_disponiveis: false }
        },

        base_calculo: "Tabela FIPE (veículos usados) / Nota Fiscal (veículos novos)",

        isencoes: [
            { categoria: "PCD", condicao: "Pessoa com deficiência física, visual, mental severa/profunda ou autista", base_legal: "Legislação estadual" },
            { categoria: "Táxis", condicao: "Isenção integral", base_legal: "Legislação estadual" },
            { categoria: "Transporte escolar", condicao: "Isenção integral", base_legal: "Legislação estadual" },
            { categoria: "Ônibus (transporte de passageiros)", condicao: "Isenção integral", base_legal: "Legislação estadual" },
            { categoria: "Transporte de carga", condicao: "Redução parcial de alíquota", base_legal: "Legislação estadual" }
        ],

        descontos: {
            cota_unica: { obs: "Desconto conforme calendário SEFAZ-SP — geralmente 3% a 5%", dados_disponiveis: false },
            parcelamento_veiculo_novo: { parcelas: 5, desconto: 0, obs: "5 parcelas mensais iguais e consecutivas, sem desconto — Decreto 70.087/2025" }
        },

        programa_ipva_em_dia: {
            descricao: "Programa de benefícios para contribuintes em dia com o IPVA",
            beneficios: "Parcelamentos especiais, descontos e outras vantagens"
        },

        calendario: "Divulgado no final do ano anterior pela SEFAZ-SP, cotas de janeiro a março/abril",

        legislacao: [
            { norma: "Lei nº 13.296/2008", assunto: "Lei base do IPVA em São Paulo" },
            { norma: "Decreto nº 70.087/2025", assunto: "Regulamenta o IPVA para 2026" }
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    //  4. ITCMD — IMPOSTO SOBRE TRANSMISSÃO CAUSA MORTIS E DOAÇÃO
    // ═══════════════════════════════════════════════════════════════

    itcmd: {
        aliquota_atual: 0.04,
        progressivo: false,
        obs: "Alíquota fixa de 4% até 2025. Reforma Tributária (LC 227/2026) torna a progressividade obrigatória.",

        aliquotas_progressivas_propostas: {
            ativo: false,
            obs: "SP precisa ajustar legislação para alíquotas progressivas — valores ilustrativos, sujeitos a lei complementar",
            faixas: [
                { limite_superior: 100000, aliquota: 0.02, obs: "Até R$ 100 mil — proposta" },
                { limite_superior: 500000, aliquota: 0.03, obs: "R$ 100 mil a R$ 500 mil — proposta" },
                { limite_superior: 2000000, aliquota: 0.04, obs: "R$ 500 mil a R$ 2 milhões — proposta" },
                { limite_superior: Infinity, aliquota: 0.05, obs: "Acima de R$ 2 milhões — proposta" }
            ]
        },

        legislacao: [
            { norma: "Lei nº 6.606/1989", assunto: "Lei base do ITCMD em São Paulo" },
            { norma: "LC 227/2026", assunto: "Reforma Tributária — progressividade obrigatória do ITCMD" }
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    //  5. ISS — IMPOSTO SOBRE SERVIÇOS (São Paulo capital)
    // ═══════════════════════════════════════════════════════════════

    iss: {
        municipio_referencia: "São Paulo",
        aliquota_minima: 0.02,
        aliquota_maxima: 0.05,
        aliquota_geral: 0.05,
        obs: "São Paulo possui 4 faixas de ISS: 2%, 2,5%, 2,9% e 5%. Conforme IN SF/SUREM nº 08/2011 e IN SF/SUREM nº 23/2017. Sociedades de Profissionais (SUP) pagam ISS fixo por profissional.",

        por_tipo_servico: {
            // =====================================================
            // === ALÍQUOTA 2,0% (IN SF/SUREM nº 08/2011) ===
            // =====================================================
            // --- Item 2: Pesquisa e Desenvolvimento ---
            pesquisa_desenvolvimento: { aliquota: 0.02, descricao: "Pesquisa e desenvolvimento de qualquer natureza (item 2.01)", codigo: 3085 },

            // --- Item 4: Saúde ---
            medicina: { aliquota: 0.02, descricao: "Medicina e biomedicina (item 4.01)", codigo: 4030 },
            analises_clinicas: { aliquota: 0.02, descricao: "Análises clínicas, patologia, radioterapia, quimioterapia, ressonância, radiologia, tomografia (item 4.02)", codigo: 4138 },
            hospitais: { aliquota: 0.02, descricao: "Hospitais (item 4.03)", codigo: 4189 },
            clinicas_laboratorios: { aliquota: 0.02, descricao: "Clínicas, laboratórios, sanatórios, ambulatórios, prontos-socorros (item 4.03)", codigo: 4170 },
            instrumentacao_cirurgica: { aliquota: 0.02, descricao: "Instrumentação cirúrgica (item 4.04)", codigo: 4251 },
            acupuntura: { aliquota: 0.02, descricao: "Acupuntura (item 4.05)", codigo: 4260 },
            enfermagem: { aliquota: 0.02, descricao: "Enfermagem, inclusive serviços auxiliares (item 4.06)", codigo: 4316 },
            farmaceuticos: { aliquota: 0.02, descricao: "Serviços farmacêuticos (item 4.07)", codigo: 4383 },
            fisioterapia: { aliquota: 0.02, descricao: "Fisioterapia (item 4.08)", codigo: 4391 },
            fonoaudiologia: { aliquota: 0.02, descricao: "Fonoaudiologia (item 4.08)", codigo: 4472 },
            terapia_ocupacional: { aliquota: 0.02, descricao: "Terapia ocupacional (item 4.08)" },
            terapias_diversas: { aliquota: 0.02, descricao: "Terapias de qualquer espécie — tratamento físico, orgânico e mental (item 4.09)", codigo: 4588 },
            nutricao: { aliquota: 0.02, descricao: "Nutrição (item 4.10)", codigo: 4626 },
            obstetricia: { aliquota: 0.02, descricao: "Obstetrícia (item 4.11)", codigo: 4634 },
            odontologia: { aliquota: 0.02, descricao: "Odontologia (item 4.12)", codigo: 4693 },
            ortoptica: { aliquota: 0.02, descricao: "Ortóptica (item 4.13)", codigo: 4774 },
            proteses_encomenda: { aliquota: 0.02, descricao: "Próteses sob encomenda (item 4.14)", codigo: 5037 },
            psicanalise: { aliquota: 0.02, descricao: "Psicanálise (item 4.15)", codigo: 5100 },
            psicologia: { aliquota: 0.02, descricao: "Psicologia (item 4.16)", codigo: 5118 },
            casas_repouso_creches: { aliquota: 0.02, descricao: "Casas de repouso, recuperação, creches, asilos (item 4.17)", codigo: 5150 },
            inseminacao_fertilizacao: { aliquota: 0.02, descricao: "Inseminação artificial, fertilização in vitro (item 4.18)", codigo: 5193 },
            bancos_sangue: { aliquota: 0.02, descricao: "Bancos de sangue, leite, pele, olhos, óvulos, sêmen (item 4.19)", codigo: 5223 },
            coleta_material_biologico: { aliquota: 0.02, descricao: "Coleta de sangue, leite, tecidos, sêmen, órgãos (item 4.20)", codigo: 5231 },
            atendimento_movel: { aliquota: 0.02, descricao: "Unidade de atendimento, assistência ou tratamento móvel (item 4.21)", codigo: 5266 },
            planos_saude: { aliquota: 0.02, descricao: "Planos de medicina de grupo/individual e convênios (item 4.22)", codigo: 5274 },
            outros_planos_saude: { aliquota: 0.02, descricao: "Outros planos de saúde via terceiros (item 4.23)", codigo: 5312 },

            // --- Item 5: Veterinária ---
            veterinaria_medicina: { aliquota: 0.02, descricao: "Medicina veterinária e zootecnia (item 5.01)", codigo: 5380 },
            veterinaria_hospitais: { aliquota: 0.02, descricao: "Hospitais, clínicas, ambulatórios veterinários (item 5.02)", codigo: 5428 },
            veterinaria_laboratorio: { aliquota: 0.02, descricao: "Laboratórios de análise veterinária (item 5.03)", codigo: 5436 },
            veterinaria_inseminacao: { aliquota: 0.02, descricao: "Inseminação artificial veterinária (item 5.04)", codigo: 5460 },
            veterinaria_bancos: { aliquota: 0.02, descricao: "Bancos de sangue e órgãos veterinários (item 5.05)", codigo: 5479 },
            veterinaria_coleta: { aliquota: 0.02, descricao: "Coleta de material biológico veterinário (item 5.06)", codigo: 5495 },
            veterinaria_movel: { aliquota: 0.02, descricao: "Atendimento veterinário móvel (item 5.07)", codigo: 5517 },
            veterinaria_guarda: { aliquota: 0.02, descricao: "Guarda, tratamento, embelezamento de animais (item 5.08)", codigo: 8648 },
            veterinaria_planos: { aliquota: 0.02, descricao: "Planos de assistência médico-veterinária (item 5.09)", codigo: 5533 },

            // --- Item 6: Cuidados pessoais (parcial 2%) ---
            ginastica_esportes: { aliquota: 0.02, descricao: "Ginástica, dança, esportes, natação, artes marciais (item 6.04)", codigo: 5657 },

            // --- Item 7: Construção (parcial 2%) ---
            limpeza_conservacao_imoveis: { aliquota: 0.02, descricao: "Limpeza, manutenção e conservação de imóveis, inclusive fossas (item 7.10)", codigo: 1406 },

            // --- Item 8: Educação ---
            educacao_regular: { aliquota: 0.02, descricao: "Ensino regular pré-escolar, fundamental, médio e superior (item 8.01)" },

            // --- Item 10: Intermediação (parcial 2%) ---
            corretagem_seguros: { aliquota: 0.02, descricao: "Corretagem de seguros (item 10.01)" },

            // --- Item 11: Vigilância ---
            vigilancia_seguranca: { aliquota: 0.02, descricao: "Vigilância, segurança ou monitoramento de bens e pessoas (item 11.02)" },
            escolta: { aliquota: 0.02, descricao: "Escolta, inclusive de veículos e cargas (item 11.03)" },

            // --- Item 12: Diversões (parcial 2%) ---
            espetaculos_teatrais: { aliquota: 0.02, descricao: "Espetáculos teatrais (item 12.01)" },
            espetaculos_circenses: { aliquota: 0.02, descricao: "Espetáculos circenses (item 12.03)" },
            parques_diversoes: { aliquota: 0.02, descricao: "Parques de diversões, centros de lazer (item 12.05)" },
            ballet_opera_concertos: { aliquota: 0.02, descricao: "Ballet, danças, óperas, concertos, recitais (item 12.07)" },
            formula_1: { aliquota: 0.02, descricao: "Venda de ingressos do Grande Prêmio Brasil de Fórmula 1 (item 12.11)" },

            // --- Item 13: Gráfica (parcial 2%) ---
            composicao_grafica: { aliquota: 0.02, descricao: "Composição gráfica, fotocomposição, clicheria, zincografia, litografia (item 13.04)" },

            // --- Item 14: Bens de terceiros (parcial 2%) ---
            sapateiro_remendao: { aliquota: 0.02, descricao: "Sapateiros remendões individuais (item 14.01)" },

            // --- Item 15: Bancários/Financeiros (parcial 2%) ---
            administracao_fundos_cartoes: { aliquota: 0.02, descricao: "Administração de fundos, cartão de crédito/débito e carteira de clientes (item 15.01)" },
            arrendamento_mercantil: { aliquota: 0.02, descricao: "Arrendamento mercantil — leasing (item 15.09)", codigo: null },
            pagamentos_eletronicos: { aliquota: 0.02, descricao: "Pagamentos por meio eletrônico, facilitadores de pagamento (item 15.10)" },
            bolsa_valores: { aliquota: 0.02, descricao: "Atividades da Bolsa de Valores — BM&FBOVESPA (itens 15.12, 15.15, 15.16)" },
            cartao_magnetico: { aliquota: 0.02, descricao: "Fornecimento, emissão, renovação de cartão magnético, crédito, débito (item 15.14)" },

            // --- Item 16: Transporte (parcial 2%) ---
            transporte_escolar_taxi: { aliquota: 0.02, descricao: "Transporte escolar e transporte por táxi (item 16.02)" },

            // --- Item 17: Apoio técnico (parcial 2%) ---
            fornecimento_mao_obra: { aliquota: 0.02, descricao: "Fornecimento de mão-de-obra temporária (item 17.05)" },
            vales_beneficios: { aliquota: 0.02, descricao: "Fornecimento/administração vales-refeição, alimentação, transporte, planos saúde (item 17.11)" },

            // --- Item 21: Registros públicos ---
            cartorios: { aliquota: 0.02, descricao: "Serviços de registros públicos, cartorários e notariais (item 21.01)" },

            // =====================================================
            // === ALÍQUOTA 2,5% ===
            // =====================================================
            centros_convencoes: { aliquota: 0.025, descricao: "Exploração de stands e centros de convenções para feiras/exposições (item 3.02)" },
            organizacao_feiras_exposicoes: { aliquota: 0.025, descricao: "Planejamento, organização e administração de feiras, exposições, congressos (item 17.09)" },
            administracao_fundos: { aliquota: 0.025, descricao: "Serviços de administração de fundos quaisquer (item 17.10)" },

            // =====================================================
            // === ALÍQUOTA 2,9% (IN SF/SUREM nº 23/2017) ===
            // =====================================================
            informatica_analise_sistemas: { aliquota: 0.029, descricao: "Análise e desenvolvimento de sistemas (item 1.01)", codigo: 2660 },
            informatica_programacao: { aliquota: 0.029, descricao: "Programação (item 1.02)", codigo: 2668 },
            informatica_processamento_dados: { aliquota: 0.029, descricao: "Processamento, armazenamento ou hospedagem de dados, textos, imagens, vídeos, aplicativos (item 1.03)", codigo: 2684 },
            informatica_software: { aliquota: 0.029, descricao: "Elaboração de programas de computadores, inclusive jogos eletrônicos (item 1.04)", codigo: 2692 },
            informatica_licenciamento: { aliquota: 0.029, descricao: "Licenciamento ou cessão de direito de uso de programas de computação (item 1.05)", codigo: 2800 },
            informatica_consultoria: { aliquota: 0.029, descricao: "Assessoria e consultoria em informática (item 1.06)", codigo: 2881 },
            informatica_suporte: { aliquota: 0.029, descricao: "Suporte técnico em informática, instalação e manutenção de softwares e bancos de dados (item 1.07)", codigo: 2919 },
            informatica_paginas_eletronicas: { aliquota: 0.029, descricao: "Planejamento, confecção, manutenção e atualização de páginas eletrônicas (item 1.08)", codigo: 2935 },
            informatica_conteudo_audio: { aliquota: 0.029, descricao: "Disponibilização de conteúdos de áudio por meio da internet, sem cessão definitiva (item 1.09)", codigo: 2962 },
            informatica_conteudo_imagem_texto: { aliquota: 0.029, descricao: "Disponibilização de conteúdos de imagem e texto por meio da internet, sem cessão definitiva (item 1.09)", codigo: 2961 },

            // =====================================================
            // === ALÍQUOTA 5,0% (maioria dos serviços) ===
            // =====================================================
            // --- Item 3: Locação/Cessão ---
            cessao_marcas: { aliquota: 0.05, descricao: "Cessão de direito de uso de marcas e sinais de propaganda (item 3.02)", codigo: 7765 },
            saloes_festas_quadras: { aliquota: 0.05, descricao: "Exploração de salões de festas, escritórios virtuais, quadras, estádios, auditórios (item 3.03)", codigo: 7773 },
            locacao_ferrovia_dutos: { aliquota: 0.05, descricao: "Locação de ferrovia, rodovia, postes, cabos, dutos (item 3.04)", codigo: 7790 },
            cessao_andaimes_palcos: { aliquota: 0.05, descricao: "Cessão de andaimes, palcos, coberturas temporárias (item 3.05)", codigo: 7803 },

            // --- Item 6: Cuidados pessoais (5%) ---
            barbearia_cabeleireiros: { aliquota: 0.05, descricao: "Barbearia, cabeleireiros, manicuros, pedicuros (item 6.01)", codigo: 8494 },
            estetica_pele: { aliquota: 0.05, descricao: "Esteticistas, tratamento de pele, depilação (item 6.02)", codigo: 8516 },
            emagrecimento_spa: { aliquota: 0.05, descricao: "Centros de emagrecimento, SPA (item 6.05)", codigo: 8567 },
            tatuagens_piercings: { aliquota: 0.05, descricao: "Aplicação de tatuagens, piercings (item 6.06)", codigo: 8658 },

            // --- Item 7: Engenharia/Construção (5%) ---
            engenharia_arquitetura: { aliquota: 0.05, descricao: "Engenharia, agronomia, arquitetura, urbanismo, paisagismo (item 7.01)", codigo: 1520 },
            agrimensura_geologia: { aliquota: 0.05, descricao: "Agrimensura, geologia e congêneres (item 7.01)", codigo: 1589 },
            execucao_construcao: { aliquota: 0.05, descricao: "Execução de obras de construção civil por empreitada (item 7.02)", codigo: 1023 },
            projetos_engenharia: { aliquota: 0.05, descricao: "Elaboração de planos diretores, projetos de engenharia (item 7.03)", codigo: 1694 },
            demolicao: { aliquota: 0.05, descricao: "Demolição (item 7.04)", codigo: 1031 },
            reparacao_conservacao: { aliquota: 0.05, descricao: "Reparação, conservação e reforma de edifícios, estradas, pontes (item 7.05)", codigo: 1058 },
            limpeza_vias_publicas: { aliquota: 0.05, descricao: "Limpeza, manutenção de vias e logradouros públicos, parques (item 7.10)", codigo: 1384 },
            decoracao: { aliquota: 0.05, descricao: "Decoração (item 7.11)", codigo: 1430 },
            jardinagem: { aliquota: 0.05, descricao: "Jardinagem, inclusive corte e poda de árvores (item 7.11)", codigo: 1449 },
            dedetizacao: { aliquota: 0.05, descricao: "Dedetização, desinfecção, desratização, pulverização (item 7.13)", codigo: 1465 },
            florestamento: { aliquota: 0.05, descricao: "Florestamento, reflorestamento, semeadura, adubação (item 7.16)", codigo: 1740 },

            // --- Demais serviços a 5% ---
            advocacia: { aliquota: 0.05, descricao: "Serviços de advocacia (item 17.14)" },
            contabilidade: { aliquota: 0.05, descricao: "Serviços de contabilidade, auditoria (item 17.15/17.16)" },
            consultoria_geral: { aliquota: 0.05, descricao: "Serviços de consultoria (exceto informática, que é 2,9%)" },
            pericia: { aliquota: 0.05, descricao: "Serviços de perícia" },
            traducao: { aliquota: 0.05, descricao: "Serviços de tradução" },
            hospedagem: { aliquota: 0.05, descricao: "Hospedagem em hotéis, apart-service, flats, motéis" },
            turismo: { aliquota: 0.05, descricao: "Agenciamento de turismo, viagens" },
            estacionamento: { aliquota: 0.05, descricao: "Guarda e estacionamento de veículos" },
            fotografia_cinema: { aliquota: 0.05, descricao: "Fonografia, fotografia, cinematografia" },
            reprografia: { aliquota: 0.05, descricao: "Reprografia, microfilmagem, digitalização" },
            mecanica_veiculos: { aliquota: 0.05, descricao: "Lubrificação, limpeza, revisão, conserto de veículos" },
            assistencia_tecnica: { aliquota: 0.05, descricao: "Assistência técnica" },
            instalacao_montagem: { aliquota: 0.05, descricao: "Instalação e montagem de aparelhos, máquinas" },
            alfaiataria: { aliquota: 0.05, descricao: "Alfaiataria e costura" },
            tinturaria_lavanderia: { aliquota: 0.05, descricao: "Tinturaria e lavanderia" },
            transporte_pessoas: { aliquota: 0.05, descricao: "Transporte municipal de pessoas (exceto escolar/táxi)" },
            transporte_carga: { aliquota: 0.05, descricao: "Transporte de carga" },
            secretariado: { aliquota: 0.05, descricao: "Serviços de secretariado" },
            administracao_imoveis: { aliquota: 0.05, descricao: "Administração de imóveis" },
            administracao_empresas: { aliquota: 0.05, descricao: "Administração de empresas" },
            administracao_condominios: { aliquota: 0.05, descricao: "Administração de condomínios" },
            intermediacao_imoveis: { aliquota: 0.05, descricao: "Intermediação de imóveis" },
            publicidade_propaganda: { aliquota: 0.05, descricao: "Publicidade, propaganda e promoção de vendas" },
            servicos_portuarios: { aliquota: 0.05, descricao: "Serviços portuários e aeroportuários" },
            cobranca: { aliquota: 0.05, descricao: "Serviços de cobrança" },
            desenho_tecnico: { aliquota: 0.05, descricao: "Desenho técnico" }
        },

        // Regime SUP — Sociedade Uniprofissional
        sup: {
            obs: "Sociedades de profissionais habilitados ao exercício da mesma atividade. ISS fixo por profissional, não sobre o preço do serviço.",
            base_calculo_2023: 2110.69,
            obs_calculo: "5% sobre base de cálculo presumida por profissional (sócio ou empregado), até 5 profissionais. Profissionais liberais autônomos PF isentos desde 2009."
        },

        legislacao: [
            { norma: "Lei Complementar nº 116/2003", assunto: "Normas Gerais ISS (Federal)" },
            { norma: "Lei Municipal nº 13.701/2003", assunto: "ISS municipal de São Paulo" },
            { norma: "IN SF/SUREM nº 08/2011", assunto: "Tabela de Códigos de Serviço e alíquotas ISS-SP (original)" },
            { norma: "IN SF/SUREM nº 23/2017", assunto: "Alteração — alíquota 2,9% para informática e conteúdo digital" },
            { norma: "Lei Municipal nº 17.719/2021", assunto: "Redução ISS para 2% em plataformas digitais e intermediação" }
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    //  6. IPTU — IMPOSTO PREDIAL E TERRITORIAL URBANO (São Paulo)
    // ═══════════════════════════════════════════════════════════════

    iptu: {
        municipio_referencia: "São Paulo",
        obs: "Regras a partir de 2026 conforme Lei nº 18.330/2025 e Lei nº 15.889/2013. PGV revisada pelo PL 1130/2025.",

        residencial: {
            aliquota_base: 0.01,
            obs: "1% sobre o valor venal. Progressividade efetiva via acréscimos/descontos por faixas (Lei 6.989/1966 com alterações).",
            dados_disponiveis: true
        },

        nao_residencial: {
            aliquota_base: 0.015,
            obs: "1,5% sobre o valor venal (comerciais, industriais, terrenos). Acréscimos e descontos por faixas de valor venal.",
            dados_disponiveis: true
        },

        terreno_nao_edificado: {
            aliquota_base: 0.015,
            obs: "1,5% sobre o valor venal. Terrenos com mais de 500m² desocupados ou com pouca construção podem ter aumento superior à trava."
        },

        isencoes_2026: [
            {
                tipo: "Qualquer imóvel construído",
                valor_venal_limite: 150000,
                obs: "Isenção total do imposto predial para qualquer imóvel construído com VV até R$ 150.000 (antes R$ 120.000). Exceto garagens e estacionamentos comerciais."
            },
            {
                tipo: "Imóvel residencial padrão baixo/médio",
                valor_venal_limite: 260000,
                obs: "Isenção total para imóvel único, residencial (padrões A, B ou C, tipos 1 ou 2) com VV até R$ 260.000 (antes R$ 230.000)."
            },
            {
                tipo: "ZEIS",
                obs: "Imóveis em Zonas Especiais de Interesse Social (ZEIS 1, 2 e 4) — isenção/perdão até 2030."
            }
        ],

        descontos_valor_venal_2026: [
            {
                tipo: "Residencial padrão baixo/médio",
                faixa_vv_min: 260000,
                faixa_vv_max: 390000,
                formula: "Desconto no VV = R$ 780.000 - (2 × Valor Venal)",
                obs: "Redução automática da base de cálculo antes da aplicação da alíquota"
            },
            {
                tipo: "Outros imóveis construídos",
                faixa_vv_min: 150000,
                faixa_vv_max: 225000,
                formula: "Desconto no VV = R$ 450.000 - (2 × Valor Venal)",
                obs: "Exceto garagens e estacionamentos comerciais"
            }
        ],

        trava_reajuste_2026: {
            residencial: 0.10,
            nao_residencial: 0.10,
            obs: "Limite máximo de aumento nominal anual de 10% para todos os imóveis a partir de 2026 (antes 15% para comerciais)."
        },

        desconto_cota_unica: 0.03,
        parcelamento_maximo: 10,
        valor_minimo_parcela: 50,
        obs_pagamento: "Desconto de 3% para pagamento à vista. Parcelamento em até 10x sem juros, mínimo R$ 50/parcela. Desde 2026, sem envio de carnê pelos Correios — emissão digital obrigatória.",

        legislacao: [
            { norma: "Lei nº 6.989/1966", assunto: "IPTU — alíquotas, acréscimos e descontos por faixas" },
            { norma: "Lei nº 10.235/1986", assunto: "Apuração do valor venal — PGV" },
            { norma: "Lei nº 15.889/2013", assunto: "IPTU — alterações nas alíquotas e faixas" },
            { norma: "Lei nº 17.719/2021", assunto: "Isenções por valor venal (automáticas)" },
            { norma: "Lei nº 18.330/2025 (PL 1130/2025)", assunto: "Revisão da PGV 2026 — novas faixas de isenção e desconto, trava de 10%" }
        ],

        portal: "https://prefeitura.sp.gov.br/web/fazenda/servicos/iptu/"
    },

    // ═══════════════════════════════════════════════════════════════
    //  7. ITBI — IMPOSTO SOBRE TRANSMISSÃO DE BENS IMÓVEIS (SP)
    // ═══════════════════════════════════════════════════════════════

    itbi: {
        municipio_referencia: "São Paulo",
        aliquota_geral: 0.03,
        obs: "Alíquota padrão de 3% sobre o maior valor entre transação e valor venal de referência (Lei nº 11.154/1991).",

        sfh_par_his: {
            obs: "Transmissões pelo SFH, PAR e HIS — alíquota reduzida para parte financiada",
            limite_imovel: 725808,
            aliquota_financiada: 0.005,
            limite_valor_financiado: 120968,
            aliquota_restante: 0.03,
            formula: "ITBI = (0,5% × valor financiado até R$ 120.968) + (3% × valor restante)"
        },

        sfi_carteira_hipotecaria: {
            obs: "SFI, Carteira Hipotecária, Consórcios — alíquota de 3% integral, sem redução da parte financiada"
        },

        base_calculo: "Maior valor entre o valor de transação e o valor venal de referência da Prefeitura",
        obs_stf: "STF definiu que ITBI só é devido após transferência efetiva no cartório (não na assinatura da escritura).",

        legislacao: [
            { norma: "Lei nº 11.154/1991", assunto: "ITBI municipal de São Paulo" },
            { norma: "PLC 108/2024", assunto: "Novas regras ITBI — base de cálculo = valor de mercado declarado pelo contribuinte" }
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    //  8. TAXAS ESTADUAIS E MUNICIPAIS
    // ═══════════════════════════════════════════════════════════════

    taxas: {
        tfusp: {
            descricao: "Taxa de Fiscalização e Utilização de Serviços Públicos",
            obs: "Valores variáveis conforme tipo de serviço"
        },
        detran: {
            descricao: "Taxas do DETRAN-SP (licenciamento, transferência, CNH, etc.)",
            obs: "Atualizadas anualmente"
        },
        tpei: {
            descricao: "Taxa de Prevenção e Extinção de Incêndios (Corpo de Bombeiros)",
            obs: "Cobrada anualmente de proprietários de imóveis — conforme classificação"
        },
        tlae: {
            descricao: "Taxa de Licenciamento de Atividades Econômicas (municipal)",
            obs: "Conforme tipo de atividade"
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
            obs: "Alíquotas por NCM — tabela TIPI vigente. SP não possui benefícios ZFM/ALC.",
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
                total_maximo: 0.288,
                obs: "20% patronal + RAT/SAT (0,5% a 3%) + terceiros (até 5,8%)"
            },
            empregado: {
                faixas: [
                    { limite: 1412.00, aliquota: 0.075 },
                    { limite: 2666.68, aliquota: 0.09 },
                    { limite: 4000.03, aliquota: 0.12 },
                    { limite: 7786.02, aliquota: 0.14 }
                ],
                obs: "Tabela progressiva — valores 2024/2025"
            }
        },

        fgts: {
            aliquota_mensal: 0.08,
            multa_rescisoria: 0.40,
            obs: "8% sobre remuneração mensal + 40% multa rescisória sem justa causa"
        },

        irpf: {
            tabela_mensal: [
                { limite_inferior: 0, limite_superior: 2112.00, aliquota: 0, deducao: 0 },
                { limite_inferior: 2112.01, limite_superior: 2826.65, aliquota: 0.075, deducao: 158.40 },
                { limite_inferior: 2826.66, limite_superior: 3751.05, aliquota: 0.15, deducao: 423.15 },
                { limite_inferior: 3751.06, limite_superior: 4664.68, aliquota: 0.225, deducao: 844.80 },
                { limite_inferior: 4664.69, limite_superior: Infinity, aliquota: 0.275, deducao: 1278.64 }
            ],
            obs: "Tabela IRPF 2025"
        }
    },

    // ═══════════════════════════════════════════════════════════════
    //  10. SIMPLES NACIONAL
    // ═══════════════════════════════════════════════════════════════

    simples_nacional: {
        sublimite_estadual: 3600000,
        obs_sublimite: "Empresas que ultrapassam R$ 3.600.000 devem recolher ICMS e ISS fora do Simples Nacional",

        mei: {
            limite_anual: 81000,
            valor_mensal_das_ref_2026: "R$ 75,90 a R$ 81,90 dependendo da atividade (INSS + ICMS/ISS)",
            obs: "Regime mais simples e com menor carga tributária"
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
            obs: "São Paulo NÃO está na área de abrangência da SUDAM"
        },
        sudene: {
            ativo: false,
            obs: "São Paulo NÃO está na área de abrangência da SUDENE"
        },
        zona_franca: {
            ativo: false,
            obs: "São Paulo não possui Zona Franca ou ALC"
        },
        programas_estaduais: [
            { programa: "Convênios ICMS", beneficio: "Diversos convênios com benefícios fiscais para operações específicas", base_legal: "Convênio ICMS nº 21/2026" },
            { programa: "Incentivos para Energia Renovável", beneficio: "Redução ou isenção de ICMS em operações com energia solar e renováveis", base_legal: "Convênios ICMS" },
            { programa: "Programa de Desenvolvimento Regional", beneficio: "Incentivos para empresas em regiões de menor desenvolvimento no interior de SP", base_legal: "Legislação específica" },
            { programa: "Incentivos para Inovação Tecnológica", beneficio: "Deduções fiscais para empresas que investem em P&D", base_legal: "Lei de Inovação" }
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    //  12. REFORMA TRIBUTÁRIA
    // ═══════════════════════════════════════════════════════════════

    reforma_tributaria: {
        ibs: {
            substitui: "ICMS (estadual) e ISS (municipal)",
            obs: "Substituição gradual 2026-2033"
        },
        cbs: {
            substitui: "PIS, COFINS e IPI (federais)",
            obs: "Substituição gradual 2026-2033"
        },
        is: {
            obs: "Imposto Seletivo — sobre produtos e serviços prejudiciais à saúde e ao meio ambiente. Novo tributo a partir de 2026."
        },
        cronograma_transicao: {
            "2026": {
                icms: 0.18,
                iss: 0.05,
                ibs_teste: 0.001,
                cbs_teste: 0.009,
                obs: "Fase de testes — IBS e CBS NÃO integram base do ICMS em 2026 (RC 33083/2026). Contribuinte dispensado de recolher alíquota teste se cumprir obrigações acessórias."
            },
            "2027": {
                icms_estimado: 0.162,
                iss_estimado: 0.045,
                ibs_estimado: 0.01,
                cbs_estimado: 0.01,
                obs: "Início da integração — redução gradual de 10% ao ano"
            },
            "2028": { icms_estimado: 0.146, iss_estimado: 0.0405 },
            "2029": { icms_estimado: 0.131, iss_estimado: 0.036 },
            "2030": { icms_estimado: 0.118, iss_estimado: 0.032 },
            "2031": { icms_estimado: 0.106, iss_estimado: 0.029 },
            "2032": { icms_estimado: 0.095, iss_estimado: 0.026 },
            "2033": {
                icms: 0,
                iss: 0,
                ibs_estimado: 0.26,
                cbs_estimado: 0.10,
                obs: "Extinção completa do ICMS e ISS — vigência plena do IBS"
            }
        },
        impactos_estado: {
            obs: "SP, maior arrecadador de ICMS do Brasil, será significativamente afetado pela harmonização. Primeiro estado a implementar a Reforma com inclusão de IBS e CBS.",
            itcmd: "Reforma torna obrigatória progressividade do ITCMD — SP precisa ajustar alíquota fixa de 4%.",
            medicamentos: "Ampliação da alíquota zero para medicamentos em determinadas linhas de cuidado (LC 214/2025)."
        },
        base_legal: [
            { norma: "RC 33083/2026", assunto: "Orientações SEFAZ-SP sobre Reforma Tributária" },
            { norma: "LC 214/2025", assunto: "Alíquota zero para medicamentos" },
            { norma: "LC 227/2026", assunto: "Progressividade obrigatória ITCMD" }
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    //  13. DADOS DE COBERTURA
    // ═══════════════════════════════════════════════════════════════

    cobertura: {
        versao: "3.0",
        data_atualizacao: "2026-02-10",
        localizados: [
            "ICMS — alíquota padrão 18% e interestaduais",
            "ICMS — alíquotas diferenciadas (telecom 25%, bebidas, cigarros)",
            "ICMS — DIFAL e importação",
            "ICMS — convênios 2026 prorrogados",
            "IPVA — alíquotas por tipo de veículo (6 categorias + elétricos)",
            "IPVA — isenções (5 categorias)",
            "IPVA — parcelamento veículo novo (5 parcelas)",
            "ITCMD — alíquota fixa 4% e proposta progressiva",
            "ISS SP — alíquota geral 5% para maioria dos serviços",
            "IPTU SP — faixas residencial e comercial (ranges)",
            "ITBI SP — alíquota 2%",
            "Taxas estaduais (TFUSP, DETRAN, TPEI, TLAE)",
            "IRPJ — Lucro Real e Presumido",
            "CSLL, PIS, COFINS — cumulativo e não-cumulativo",
            "INSS — patronal e empregado",
            "FGTS — alíquotas",
            "IRPF — tabela mensal 2025",
            "Simples Nacional — limites e anexos I a V",
            "Reforma Tributária — cronograma completo 2026-2033",
            "Incentivos fiscais — programas estaduais"
        ],
        nao_localizados: [
            "ICMS — alíquotas exatas cesta básica e energia elétrica residencial",
            "ICMS — valores monofásicos combustíveis 2026",
            "ICMS — Substituição Tributária (lista de produtos e MVA)",
            "IPVA — desconto exato cota única 2026",
            "IPVA — alíquota exata veículos elétricos/híbridos",
            "IPTU SP — faixas de acréscimo/desconto progressivo por valor venal (Lei 6.989/1966 — tabelas práticas da Prefeitura)",
            "Taxas — valores específicos"
        ],
        contatos_para_completar: [
            { orgao: "SEFAZ-SP", url: "https://portal.fazenda.sp.gov.br/" },
            { orgao: "Prefeitura de São Paulo", url: "https://www.prefeitura.sp.gov.br/cidade/secretarias/fazenda/" },
            { orgao: "Receita Federal", url: "https://www.gov.br/receitafederal/" }
        ]
    },
};


// ═══════════════════════════════════════════════════════════════════════════
//  14. FUNÇÕES UTILITÁRIAS — SÃO PAULO
// ═══════════════════════════════════════════════════════════════════════════

/** Retorna alíquota ISS por tipo de serviço em São Paulo */
function getISSSaoPaulo(tipo) {
    if (!tipo) return null;
    var chave = tipo.toLowerCase().replace(/[\s-]+/g, "_");
    var servico = SAO_PAULO_TRIBUTARIO.iss.por_tipo_servico[chave];
    return servico ? servico.aliquota : null;
}

/**
 * Retorna cálculo IPTU residencial para São Paulo capital
 * @param {number} valorVenal - Valor venal do imóvel em R$
 * @param {boolean} residencialPadraoBaixoMedio - Se é padrão baixo/médio (tipos 1-2, padrões A-C)
 * @param {boolean} imovelUnico - Se é o único imóvel do contribuinte
 * @returns {object} { isento, aliquota_base, desconto_vv, vv_ajustado, imposto_estimado, obs }
 */
function getIPTUResidencialSaoPaulo(valorVenal, residencialPadraoBaixoMedio, imovelUnico) {
    var resultado = {
        isento: false,
        aliquota_base: 0.01,
        desconto_vv: 0,
        vv_ajustado: valorVenal,
        imposto_estimado: 0,
        obs: ""
    };

    // Isenção para qualquer imóvel construído até R$150k
    if (valorVenal <= 150000 && imovelUnico) {
        resultado.isento = true;
        resultado.obs = "Isento — VV até R$ 150.000 (imóvel único)";
        return resultado;
    }

    // Isenção para residencial padrão baixo/médio até R$260k
    if (residencialPadraoBaixoMedio && valorVenal <= 260000 && imovelUnico) {
        resultado.isento = true;
        resultado.obs = "Isento — residencial padrão baixo/médio, VV até R$ 260.000 (imóvel único)";
        return resultado;
    }

    // Desconto para residencial padrão baixo/médio entre R$260k e R$390k
    if (residencialPadraoBaixoMedio && valorVenal > 260000 && valorVenal < 390000 && imovelUnico) {
        resultado.desconto_vv = 780000 - (2 * valorVenal);
        resultado.vv_ajustado = valorVenal - Math.max(0, resultado.desconto_vv);
        resultado.obs = "Desconto no VV: R$ 780.000 - (2 × VV) = R$ " + Math.max(0, resultado.desconto_vv).toFixed(2);
    }

    resultado.imposto_estimado = resultado.vv_ajustado * resultado.aliquota_base;
    return resultado;
}

/**
 * Retorna cálculo IPTU não-residencial para São Paulo capital
 * @param {number} valorVenal - Valor venal do imóvel em R$
 * @param {boolean} imovelUnico - Se é o único imóvel do contribuinte
 * @returns {object} { isento, aliquota_base, desconto_vv, vv_ajustado, imposto_estimado, obs }
 */
function getIPTUComercialSaoPaulo(valorVenal, imovelUnico) {
    var resultado = {
        isento: false,
        aliquota_base: 0.015,
        desconto_vv: 0,
        vv_ajustado: valorVenal,
        imposto_estimado: 0,
        obs: ""
    };

    // Isenção para qualquer imóvel construído até R$150k
    if (valorVenal <= 150000 && imovelUnico) {
        resultado.isento = true;
        resultado.obs = "Isento — VV até R$ 150.000 (imóvel único)";
        return resultado;
    }

    // Desconto para outros imóveis entre R$150k e R$225k
    if (valorVenal > 150000 && valorVenal < 225000 && imovelUnico) {
        resultado.desconto_vv = 450000 - (2 * valorVenal);
        resultado.vv_ajustado = valorVenal - Math.max(0, resultado.desconto_vv);
        resultado.obs = "Desconto no VV: R$ 450.000 - (2 × VV) = R$ " + Math.max(0, resultado.desconto_vv).toFixed(2);
    }

    resultado.imposto_estimado = resultado.vv_ajustado * resultado.aliquota_base;
    return resultado;
}

/**
 * Calcula ITBI São Paulo
 * @param {number} valorTransacao - Valor da transação em R$
 * @param {boolean} sfh - Se é financiamento pelo SFH/PAR/HIS
 * @param {number} valorFinanciado - Valor efetivamente financiado (se SFH)
 * @returns {object} { itbi, aliquota_efetiva, detalhamento }
 */
function getITBISaoPaulo(valorTransacao, sfh, valorFinanciado) {
    if (!sfh || !valorFinanciado || valorTransacao > 725808) {
        return {
            itbi: valorTransacao * 0.03,
            aliquota_efetiva: 0.03,
            detalhamento: "3% sobre R$ " + valorTransacao.toFixed(2)
        };
    }
    var limiteFinanciado = Math.min(valorFinanciado, 120968);
    var parteReduzida = limiteFinanciado * 0.005;
    var parteNormal = (valorTransacao - limiteFinanciado) * 0.03;
    var total = parteReduzida + parteNormal;
    return {
        itbi: total,
        aliquota_efetiva: total / valorTransacao,
        detalhamento: "0,5% sobre R$ " + limiteFinanciado.toFixed(2) + " + 3% sobre R$ " + (valorTransacao - limiteFinanciado).toFixed(2)
    };
}

/** Retorna alíquota IPVA por tipo de veículo */
function getIPVASaoPaulo(tipo) {
    if (!tipo) return null;
    var chave = tipo.toLowerCase().replace(/[\s-]+/g, "_");
    var veiculo = SAO_PAULO_TRIBUTARIO.ipva.aliquotas[chave];
    return veiculo ? veiculo.aliquota : null;
}

/** Verifica se o município é Zona Franca — sempre false para SP */
function isZonaFrancaSaoPaulo() {
    return false;
}

/** Verifica se o município é ALC — sempre false para SP */
function isALCSaoPaulo() {
    return false;
}

/** Retorna percentual de redução SUDAM no IRPJ — 0 para SP */
function getReducaoSUDAMSaoPaulo() {
    return 0;
}

/** Retorna percentual de redução SUDENE no IRPJ — 0 para SP */
function getReducaoSUDENESaoPaulo() {
    return 0;
}

/** ICMS efetivo (padrão + FECOP) — 0.18 sem FECOP em SP */
function getICMSEfetivoSaoPaulo() {
    return SAO_PAULO_TRIBUTARIO.icms.aliquota_padrao + (SAO_PAULO_TRIBUTARIO.icms.fecop.ativo ? SAO_PAULO_TRIBUTARIO.icms.fecop.adicional : 0);
}

/**
 * Retorna alíquota ITCMD (atual ou progressiva proposta)
 * @param {number} valor - Valor da transmissão em R$
 * @param {boolean} usarProgressiva - Usar tabela progressiva proposta
 * @returns {number} Alíquota em decimal
 */
function getITCMDSaoPaulo(valor, usarProgressiva) {
    if (!usarProgressiva) return SAO_PAULO_TRIBUTARIO.itcmd.aliquota_atual;
    var faixas = SAO_PAULO_TRIBUTARIO.itcmd.aliquotas_progressivas_propostas.faixas;
    for (var i = 0; i < faixas.length; i++) {
        if (valor <= faixas[i].limite_superior) {
            return faixas[i].aliquota;
        }
    }
    return faixas[faixas.length - 1].aliquota;
}

/**
 * Calcula alíquota efetiva do Simples Nacional
 * @param {number} rbt12 - Receita Bruta dos últimos 12 meses
 * @param {string} anexo - Anexo (anexo_i, anexo_ii, anexo_iii, anexo_iv, anexo_v)
 * @returns {number|null} Alíquota efetiva em decimal
 */
function getAliquotaSimplesNacionalSaoPaulo(rbt12, anexo) {
    if (!rbt12 || rbt12 <= 0 || !anexo) return null;
    var tabela = SAO_PAULO_TRIBUTARIO.simples_nacional.anexos[anexo];
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

/**
 * Retorna estimativa de ICMS para um ano específico da transição
 * @param {number} ano - Ano (2026 a 2033)
 * @returns {object|null} Dados da transição para o ano
 */
function getReformaTransicaoSaoPaulo(ano) {
    var dados = SAO_PAULO_TRIBUTARIO.reforma_tributaria.cronograma_transicao[String(ano)];
    return dados || null;
}

/** Retorna objeto resumido para exibição rápida */
function resumoTributarioSaoPaulo() {
    return {
        estado: SAO_PAULO_TRIBUTARIO.dados_gerais.nome,
        sigla: SAO_PAULO_TRIBUTARIO.dados_gerais.sigla,
        regiao: SAO_PAULO_TRIBUTARIO.dados_gerais.regiao,
        icms_padrao: SAO_PAULO_TRIBUTARIO.icms.aliquota_padrao,
        icms_efetivo: getICMSEfetivoSaoPaulo(),
        fecop: SAO_PAULO_TRIBUTARIO.icms.fecop.ativo,
        ipva_automovel: SAO_PAULO_TRIBUTARIO.ipva.aliquotas.automovel.aliquota,
        iss_geral: SAO_PAULO_TRIBUTARIO.iss.aliquota_geral,
        iss_minimo: SAO_PAULO_TRIBUTARIO.iss.aliquota_minima,
        iss_maximo: SAO_PAULO_TRIBUTARIO.iss.aliquota_maxima,
        iss_informatica: 0.029,
        iptu_residencial: SAO_PAULO_TRIBUTARIO.iptu.residencial.aliquota_base,
        iptu_nao_residencial: SAO_PAULO_TRIBUTARIO.iptu.nao_residencial.aliquota_base,
        iptu_isencao_geral: 150000,
        iptu_isencao_residencial: 260000,
        itbi: SAO_PAULO_TRIBUTARIO.itbi.aliquota_geral,
        itcmd: SAO_PAULO_TRIBUTARIO.itcmd.aliquota_atual,
        sublimite_simples: SAO_PAULO_TRIBUTARIO.simples_nacional.sublimite_estadual,
        sudam: SAO_PAULO_TRIBUTARIO.incentivos.sudam.ativo,
        sudene: SAO_PAULO_TRIBUTARIO.incentivos.sudene.ativo,
        zona_franca: SAO_PAULO_TRIBUTARIO.incentivos.zona_franca.ativo
    };
}


// ═══════════════════════════════════════════════════════════════════════════
//  15. EXPORTAÇÃO (Padrão Grupo 2)
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        ...SAO_PAULO_TRIBUTARIO,
        utils: {
            getISS: getISSSaoPaulo,
            getIPTUResidencial: getIPTUResidencialSaoPaulo,
            getIPTUComercial: getIPTUComercialSaoPaulo,
            getITBI: getITBISaoPaulo,
            getIPVA: getIPVASaoPaulo,
            isZonaFranca: isZonaFrancaSaoPaulo,
            isALC: isALCSaoPaulo,
            getReducaoSUDAM: getReducaoSUDAMSaoPaulo,
            getReducaoSUDENE: getReducaoSUDENESaoPaulo,
            getICMSEfetivo: getICMSEfetivoSaoPaulo,
            getITCMD: getITCMDSaoPaulo,
            getAliquotaSimplesNacional: getAliquotaSimplesNacionalSaoPaulo,
            getReformaTransicao: getReformaTransicaoSaoPaulo,
            resumoTributario: resumoTributarioSaoPaulo,
        },
    };
}

if (typeof window !== "undefined") {
    window.SAO_PAULO_TRIBUTARIO = SAO_PAULO_TRIBUTARIO;
    window.SaoPauloTributario = {
        getISS: getISSSaoPaulo,
        getIPTUResidencial: getIPTUResidencialSaoPaulo,
        getIPTUComercial: getIPTUComercialSaoPaulo,
        getITBI: getITBISaoPaulo,
        getIPVA: getIPVASaoPaulo,
        isZonaFranca: isZonaFrancaSaoPaulo,
        isALC: isALCSaoPaulo,
        getReducaoSUDAM: getReducaoSUDAMSaoPaulo,
        getReducaoSUDENE: getReducaoSUDENESaoPaulo,
        getICMSEfetivo: getICMSEfetivoSaoPaulo,
        getITCMD: getITCMDSaoPaulo,
        getAliquotaSimplesNacional: getAliquotaSimplesNacionalSaoPaulo,
        getReformaTransicao: getReformaTransicaoSaoPaulo,
        resumo: resumoTributarioSaoPaulo,
    };
}
