/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PIAUI.JS — Base de Dados Tributária Completa do Estado do Piauí
 * ═══════════════════════════════════════════════════════════════════════════
 * Versão 3.0 — Padronizado conforme template roraima.js v3.0
 * Dados verificados via fontes oficiais (SEFAZ/PI, RFB, Prefeitura de Teresina)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ESTRUTURA PADRÃO (15 seções obrigatórias):
 *   01. dados_gerais        — Identificação, links, legislação base
 *   02. icms                — Alíquotas, diferenciadas, interestaduais, ST
 *   03. ipva                — Alíquotas, descontos, isenções
 *   04. itcmd               — Dados e observações
 *   05. iss                 — Tabela por tipo de serviço (Teresina — referência)
 *   06. iptu                — Alíquotas progressivas, isenções (Teresina)
 *   07. itbi                — Alíquota, base de cálculo (Teresina)
 *   08. taxas               — Estaduais e municipais (TCRD, COSIP)
 *   09. federal             — IRPJ, CSLL, PIS, COFINS, INSS, FGTS, IRPF
 *   10. simples_nacional    — Anexos, faixas, sublimite, MEI
 *   11. incentivos          — SUDAM/SUDENE, programas estaduais
 *   12. reforma_tributaria  — IBS, CBS, IS
 *   13. cobertura           — Versão, itens localizados/pendentes, contatos
 *   14. funções utilitárias — Helpers de cálculo
 *   15. exportação          — module.exports + window (padrão Grupo 2)
 *
 * FONTES CONSULTADAS:
 *   • SEFAZ/PI — https://portal.sefaz.pi.gov.br/
 *   • Receita Federal — www.gov.br/receitafederal
 *   • Prefeitura de Teresina — https://pmt.pi.gov.br/
 *   • SEMF Teresina — https://semf.pmt.pi.gov.br/
 *   • Lei nº 4.257/1989 (ICMS); Lei nº 8.558/2024 (majoração 22,5%)
 *   • Decreto nº 21.866/2023 (RICMS/PI)
 *   • Lei nº 4.548/1992 (IPVA)
 *   • LC nº 4.974/2016; LC nº 5.093/2017; LC nº 5.839/2022 (ISS Teresina)
 *   • LC nº 4.974/2016; Lei nº 6.166/2024; Decreto nº 28.580/2026 (IPTU Teresina)
 *
 * ATUALIZAÇÃO: 10/02/2026
 * ═══════════════════════════════════════════════════════════════════════════
 */

const PIAUI_TRIBUTARIO = {

    // ═══════════════════════════════════════════════════════════════
    //  1. DADOS GERAIS
    // ═══════════════════════════════════════════════════════════════

    dados_gerais: {
        nome: "Piauí",
        sigla: "PI",
        regiao: "Nordeste",
        capital: "Teresina",
        codigo_ibge: "22",
        codigo_ibge_capital: "2211001",
        gentilico: "Piauiense",
        zona_franca: {
            existe: false,
            observacao: "Não há Zona Franca no Piauí"
        },
        alc: {
            existe: false,
            observacao: "Não há Área de Livre Comércio no Piauí"
        },
        sudam: {
            abrangencia: "parcial",
            detalhe: "Região Oeste do estado",
            beneficios: "Redução de IRPJ até 75% para projetos aprovados na área SUDAM"
        },
        sudene: {
            abrangencia: true,
            beneficios: "Redução de IRPJ até 75%, incentivos para projetos aprovados",
            base_legal: "Lei nº 9.126/1995"
        },
        suframa: {
            abrangencia: false,
            observacao: "Piauí não está na área de abrangência da SUFRAMA"
        },
        sefaz: {
            url: "https://portal.sefaz.pi.gov.br/",
            legislacao: "https://portaldalegislacao.sefaz.pi.gov.br/",
            ipva_portal: "http://webas.sefaz.pi.gov.br/eageat/externo/ipva/ipva.jsf"
        },
        prefeitura_capital: {
            url: "https://pmt.pi.gov.br/",
            semf: "https://semf.pmt.pi.gov.br/",
            iptu_portal: "https://iptu.teresina.pi.gov.br/"
        },
        municipios_principais: [
            { nome: "Teresina", ibge: "2211001", capital: true },
            { nome: "Parnaíba", ibge: "2207702" },
            { nome: "Picos", ibge: "2208102" },
            { nome: "Floriano", ibge: "2203452" }
        ],
        legislacao_base: {
            icms: "Lei nº 4.257/1989; Lei nº 8.558/2024 (22,5% desde 01/04/2025); Decreto nº 21.866/2023 (RICMS/PI)",
            ipva: "Lei nº 4.548/1992",
            iss_teresina: "Lei Complementar nº 4.974/2016; LC nº 5.093/2017; LC nº 5.839/2022",
            iptu_teresina: "LC nº 4.974/2016; Lei nº 6.166/2024; Decreto nº 28.580/2026"
        },
        observacoes: [
            "ICMS 22,5% vigente desde 01/04/2025 — um dos mais altos do Brasil (anterior 21%)",
            "SUDAM parcial (Oeste) + SUDENE (todo o estado) — dupla cobertura regional",
            "ISS Teresina com 5 faixas diferenciadas (0,2% a 5%) — tabela detalhada",
            "IPTU Teresina progressivo com 7 faixas por tipo de imóvel",
            "IPVA — isenção motos até 170cc e veículos com 20+ anos",
            "TCRD e COSIP com fórmulas específicas para cálculo"
        ]
    },


    // ═══════════════════════════════════════════════════════════════
    //  2. ICMS — IMPOSTO SOBRE CIRCULAÇÃO DE MERCADORIAS E SERVIÇOS
    // ═══════════════════════════════════════════════════════════════

    icms: {
        aliquota_padrao: 0.225,
        aliquota_padrao_percentual: "22,5%",
        aliquota_padrao_vigencia: "A partir de 01/04/2025",
        aliquota_padrao_base_legal: "Lei nº 8.558/2024; Lei nº 4.257/1989; Decreto nº 21.866/2023",

        historico: [
            { aliquota: 0.21, percentual: "21%", vigencia: "Até 31/03/2025" },
            { aliquota: 0.225, percentual: "22,5%", vigencia: "A partir de 01/04/2025 (majoração de 1,5 p.p.)" }
        ],

        funcep: {
            existe: false,
            observacao: "Fundo de combate à pobreza não identificado separadamente na pesquisa"
        },

        aliquota_efetiva_padrao: 0.225,
        aliquota_efetiva_padrao_percentual: "22,5%",

        aliquotas_diferenciadas: {
            energia_solar: {
                aliquota: 0.00,
                percentual: "0%",
                descricao: "Energia solar gerada — isenta para a população"
            },
            cesta_basica: {
                dados_disponiveis: false,
                obs: "Alíquota variável conforme legislação — verificar SEFAZ/PI"
            },
            combustiveis: { dados_disponiveis: false, obs: "Verificar SEFAZ/PI" },
            energia_eletrica: { dados_disponiveis: false, obs: "Verificar SEFAZ/PI" },
            bebidas_alcoolicas: { dados_disponiveis: false, obs: "Verificar SEFAZ/PI" },
            medicamentos: { dados_disponiveis: false, obs: "Verificar SEFAZ/PI" }
        },

        aliquotas_interestaduais: {
            norte_nordeste_centro_oeste_es: {
                aliquota: 0.12,
                percentual: "12%",
                descricao: "Saídas para N/NE/CO e Espírito Santo"
            },
            sul_sudeste_exceto_es: {
                aliquota: 0.07,
                percentual: "7%",
                descricao: "Saídas para Sul e Sudeste (exceto ES)"
            },
            nao_contribuinte: {
                aliquota: 0.225,
                percentual: "22,5%",
                descricao: "Operações com não contribuintes (EC 87/2015) — alíquota interna"
            }
        },

        icms_importacao: {
            aliquota: 0.225,
            percentual: "22,5%",
            descricao: "ICMS sobre importação — alíquota interna"
        },

        substituicao_tributaria: {
            dados_disponiveis: false,
            obs: "Lista de produtos e MVA não incluída — verificar SEFAZ/PI"
        },

        decretos_complementares: [
            "Decreto nº 21.866, de 06/03/2023 — Regulamento do ICMS (RICMS/PI)",
            "Decreto nº 23.535, de 20/01/2025 — Alterações ao RICMS/PI",
            "Decreto nº 23.741, de 24/04/2025 — Alterações ao RICMS/PI"
        ]
    },


    // ═══════════════════════════════════════════════════════════════
    //  3. IPVA — IMPOSTO SOBRE PROPRIEDADE DE VEÍCULOS AUTOMOTORES
    // ═══════════════════════════════════════════════════════════════

    ipva: {
        base_legal: "Lei nº 4.548/1992",
        base_calculo: "Valor venal conforme tabela FIPE",

        aliquotas: {
            automovel_passeio: {
                aliquota: 0.025,
                percentual: "2,5%",
                descricao: "Automóveis de passeio"
            },
            camioneta_utilitario: {
                aliquota: 0.025,
                percentual: "2,5%",
                descricao: "Camionetas e utilitários"
            },
            motocicleta_acima_170cc: {
                aliquota: 0.02,
                percentual: "2%",
                descricao: "Motocicletas, motonetas, ciclomotores, triciclos acima de 170cc"
            },
            motocicleta_ate_170cc: {
                aliquota: 0.00,
                percentual: "0% (isento)",
                descricao: "Motocicletas, motonetas, ciclomotores, triciclos até 170cc — isenção total (2026)"
            },
            onibus_caminhao: {
                aliquota: 0.01,
                percentual: "1%",
                descricao: "Ônibus, microônibus, caminhões (≥3.500kg), cavalos mecânicos"
            },
            embarcacao: {
                aliquota: 0.025,
                percentual: "2,5%",
                descricao: "Embarcações (recreio ou esporte)"
            },
            aeronave: {
                aliquota: 0.025,
                percentual: "2,5%",
                descricao: "Aeronaves particulares"
            }
        },

        isencoes: [
            { tipo: "Motocicletas até 170cc", descricao: "Isenção total desde 2026" },
            { tipo: "Veículos com 20+ anos", descricao: "Isenção automática", base_legal: "Lei nº 4.548/1992" },
            { tipo: "Veículos PCD", descricao: "Com comprovação médica" },
            { tipo: "Táxis", descricao: "Categoria aluguel, motorista profissional" },
            { tipo: "Veículos oficiais", descricao: "União, Estados, Municípios" },
            { tipo: "Transporte público", descricao: "Empresas concessionárias" },
            { tipo: "Ambulâncias/Bombeiros", descricao: "Sem cobrança de serviço" }
        ],

        descontos_antecipacao: {
            cota_unica_janeiro: {
                desconto: 0.15,
                percentual: "15%",
                prazo: "Até 30/01/2026"
            },
            cota_unica_fevereiro: {
                desconto: 0.10,
                percentual: "10%",
                prazo: "Até 27/02/2026"
            },
            parcelamento: {
                desconto: 0,
                parcelas_maximas: 3,
                descricao: "Até 3 parcelas sem desconto"
            }
        }
    },


    // ═══════════════════════════════════════════════════════════════
    //  4. ITCMD — IMPOSTO TRANSMISSÃO CAUSA MORTIS E DOAÇÃO
    // ═══════════════════════════════════════════════════════════════

    itcmd: {
        dados_disponiveis: false,
        observacao: "Dados de ITCMD do Piauí não incluídos na pesquisa. Verificar SEFAZ/PI.",
        nota: "Conforme reforma tributária (LC 227/2026), ITCMD deve ser progressivo"
    },


    // ═══════════════════════════════════════════════════════════════
    //  5. ISS — IMPOSTO SOBRE SERVIÇOS (Teresina — referência)
    // ═══════════════════════════════════════════════════════════════

    iss: {
        municipio_referencia: "Teresina",
        base_legal: "LC nº 4.974/2016; LC nº 5.093/2017; LC nº 5.839/2022; LC nº 116/2003",
        portal: "https://semf.pmt.pi.gov.br/iss/",
        aliquota_minima: 0.002,
        aliquota_minima_percentual: "0,2%",
        aliquota_maxima: 0.05,
        aliquota_maxima_percentual: "5%",

        por_tipo_servico: {
            // --- 0,2% (REDUZIDA) ---
            educacao: {
                aliquota: 0.002,
                percentual: "0,2%",
                descricao: "Serviços de educação"
            },
            profissional_recem_formado: {
                aliquota: 0.002,
                percentual: "0,2%",
                descricao: "Atividades profissionais recém-formadas (até 5 anos)",
                condicao: "Prazo de 5 anos após formatura"
            },

            // --- 2% ---
            intermediacao_imoveis: {
                aliquota: 0.02,
                percentual: "2%",
                descricao: "Intermediação de imóveis"
            },
            agenciamento_seguros: {
                aliquota: 0.02,
                percentual: "2%",
                descricao: "Agenciamento de seguros"
            },
            intermediacao_geral: {
                aliquota: 0.02,
                percentual: "2%",
                descricao: "Serviços de intermediação em geral"
            },

            // --- 3% ---
            saude: {
                aliquota: 0.03,
                percentual: "3%",
                descricao: "Serviços de saúde, medicina, biomedicina, análises clínicas, radiologia"
            },
            hospitais_clinicas: {
                aliquota: 0.03,
                percentual: "3%",
                descricao: "Hospitais, clínicas, laboratórios"
            },
            enfermagem: {
                aliquota: 0.03,
                percentual: "3%",
                descricao: "Enfermagem e serviços auxiliares"
            },
            farmacia: {
                aliquota: 0.03,
                percentual: "3%",
                descricao: "Serviços farmacêuticos"
            },
            fisioterapia: {
                aliquota: 0.03,
                percentual: "3%",
                descricao: "Fisioterapia, fonoaudiologia, terapia ocupacional"
            },
            odontologia: {
                aliquota: 0.03,
                percentual: "3%",
                descricao: "Odontologia"
            },
            psicologia: {
                aliquota: 0.03,
                percentual: "3%",
                descricao: "Psicologia, psicanálise"
            },
            casas_repouso: {
                aliquota: 0.03,
                percentual: "3%",
                descricao: "Casas de repouso, creches, asilos"
            },
            planos_saude: {
                aliquota: 0.03,
                percentual: "3%",
                descricao: "Planos de saúde"
            },

            // --- 4% ---
            construcao_civil: {
                aliquota: 0.04,
                percentual: "4%",
                descricao: "Construção civil, engenharia, arquitetura, reforma"
            },
            limpeza_conservacao: {
                aliquota: 0.04,
                percentual: "4%",
                descricao: "Serviços de limpeza e conservação"
            },
            vigilancia_seguranca: {
                aliquota: 0.04,
                percentual: "4%",
                descricao: "Vigilância e segurança"
            },

            // --- 5% ---
            informatica: {
                aliquota: 0.05,
                percentual: "5%",
                descricao: "Informática, sistemas, programação, processamento de dados, suporte técnico"
            },
            pesquisa_desenvolvimento: {
                aliquota: 0.05,
                percentual: "5%",
                descricao: "Pesquisa e desenvolvimento"
            },
            veterinaria: {
                aliquota: 0.05,
                percentual: "5%",
                descricao: "Serviços veterinários"
            },
            estetica_cuidados_pessoais: {
                aliquota: 0.05,
                percentual: "5%",
                descricao: "Cuidados pessoais, barbearia, cabeleireiros, esteticistas, spa"
            },
            hospedagem: {
                aliquota: 0.05,
                percentual: "5%",
                descricao: "Hotéis, apart-service, flats, motéis"
            },
            turismo: {
                aliquota: 0.05,
                percentual: "5%",
                descricao: "Agenciamento de turismo, viagens, guias de turismo"
            },
            estacionamento: {
                aliquota: 0.05,
                percentual: "5%",
                descricao: "Guarda e estacionamento de veículos"
            },
            entretenimento: {
                aliquota: 0.05,
                percentual: "5%",
                descricao: "Espetáculos, shows, parques, feiras, eventos, boates"
            },
            producao_audiovisual: {
                aliquota: 0.05,
                percentual: "5%",
                descricao: "Fonografia, fotografia, cinematografia, reprografia"
            },
            grafica: {
                aliquota: 0.05,
                percentual: "5%",
                descricao: "Composição gráfica, impressos"
            },
            mecanica_manutencao: {
                aliquota: 0.05,
                percentual: "5%",
                descricao: "Lubrificação, revisão, conserto, assistência técnica, funilaria"
            },
            instalacao_montagem: {
                aliquota: 0.05,
                percentual: "5%",
                descricao: "Instalação e montagem de aparelhos e máquinas"
            },
            confeccao_textil: {
                aliquota: 0.05,
                percentual: "5%",
                descricao: "Alfaiataria, costura, tinturaria, lavanderia, tapeçaria"
            },
            transporte: {
                aliquota: 0.05,
                percentual: "5%",
                descricao: "Transporte de pessoas e carga, táxi, reboque, valores"
            },
            comunicacao: {
                aliquota: 0.05,
                percentual: "5%",
                descricao: "Telefonia, comunicação por satélite, rádio, TV, internet"
            },
            advocacia: {
                aliquota: 0.05,
                percentual: "5%",
                descricao: "Serviços de advocacia"
            },
            consultoria: {
                aliquota: 0.05,
                percentual: "5%",
                descricao: "Consultoria empresarial e técnica"
            },
            contabilidade: {
                aliquota: 0.05,
                percentual: "5%",
                descricao: "Contabilidade, auditoria, perícia"
            },
            traducao: {
                aliquota: 0.05,
                percentual: "5%",
                descricao: "Tradução, interpretação, secretariado"
            },
            administracao: {
                aliquota: 0.05,
                percentual: "5%",
                descricao: "Administração de imóveis, empresas, condomínios"
            },
            locacao_cessao: {
                aliquota: 0.05,
                percentual: "5%",
                descricao: "Serviços de locação e cessão"
            }
        },

        tabela_resumida: [
            { aliquota: 0.002, percentual: "0,2%", servicos: "Educação, profissional recém-formado (5 anos)" },
            { aliquota: 0.02, percentual: "2%", servicos: "Intermediação imóveis/seguros/geral" },
            { aliquota: 0.03, percentual: "3%", servicos: "Saúde, hospitais, clínicas, odontologia, fisioterapia, psicologia, planos de saúde" },
            { aliquota: 0.04, percentual: "4%", servicos: "Construção civil, engenharia, limpeza, vigilância" },
            { aliquota: 0.05, percentual: "5%", servicos: "Informática, advocacia, contabilidade, consultoria, transporte, hospedagem, entretenimento, estética, veterinária e demais" }
        ]
    },


    // ═══════════════════════════════════════════════════════════════
    //  6. IPTU — IMPOSTO PREDIAL E TERRITORIAL URBANO (Teresina)
    // ═══════════════════════════════════════════════════════════════

    iptu: {
        municipio_referencia: "Teresina",
        base_legal: "LC nº 4.974/2016; Lei nº 6.166/2024; Decreto nº 28.580/2026",
        base_calculo: "Valor venal do imóvel (PGV — Planta Genérica de Valores)",
        portal: "https://iptu.teresina.pi.gov.br/",

        residencial: {
            descricao: "Imóvel edificado para fins residenciais",
            faixas: [
                { faixa: 1, de: 0, ate: 55918.85, aliquota: 0.002, percentual: "0,20%" },
                { faixa: 2, de: 55918.86, ate: 139797.25, aliquota: 0.005, percentual: "0,50%" },
                { faixa: 3, de: 139797.26, ate: 279594.51, aliquota: 0.006, percentual: "0,60%" },
                { faixa: 4, de: 279594.52, ate: 363458.12, aliquota: 0.007, percentual: "0,70%" },
                { faixa: 5, de: 363458.13, ate: 503269.33, aliquota: 0.008, percentual: "0,80%" },
                { faixa: 6, de: 503269.34, ate: 643066.37, aliquota: 0.009, percentual: "0,90%" },
                { faixa: 7, de: 643066.38, ate: Infinity, aliquota: 0.010, percentual: "1,00%" }
            ]
        },

        nao_residencial: {
            descricao: "Imóvel edificado para fins não residenciais (comercial, serviços)",
            faixas: [
                { faixa: 1, de: 0, ate: 55918.85, aliquota: 0.002, percentual: "0,20%" },
                { faixa: 2, de: 55918.86, ate: 139797.25, aliquota: 0.007, percentual: "0,70%" },
                { faixa: 3, de: 139797.26, ate: 279594.51, aliquota: 0.008, percentual: "0,80%" },
                { faixa: 4, de: 279594.52, ate: 363458.12, aliquota: 0.009, percentual: "0,90%" },
                { faixa: 5, de: 363458.13, ate: 503269.33, aliquota: 0.010, percentual: "1,00%" },
                { faixa: 6, de: 503269.34, ate: 643066.37, aliquota: 0.011, percentual: "1,10%" },
                { faixa: 7, de: 643066.38, ate: Infinity, aliquota: 0.012, percentual: "1,20%" }
            ]
        },

        nao_edificado: {
            descricao: "Imóvel não edificado (terreno)",
            faixas: [
                { faixa: 1, de: 0, ate: 55918.85, aliquota: 0.012, percentual: "1,20%" },
                { faixa: 2, de: 55918.86, ate: 139797.25, aliquota: 0.018, percentual: "1,80%" },
                { faixa: 3, de: 139797.26, ate: 279594.51, aliquota: 0.019, percentual: "1,90%" },
                { faixa: 4, de: 279594.52, ate: 363458.12, aliquota: 0.020, percentual: "2,00%" },
                { faixa: 5, de: 363458.13, ate: 503269.33, aliquota: 0.022, percentual: "2,20%" },
                { faixa: 6, de: 503269.34, ate: 643066.37, aliquota: 0.024, percentual: "2,40%" },
                { faixa: 7, de: 643066.38, ate: Infinity, aliquota: 0.026, percentual: "2,60%" }
            ]
        },

        isencoes: [
            { tipo: "Imóvel residencial até R$ 55.918,85", descricao: "Isenção conforme faixa 1 (alíquota 0,20% mas pode ser isento)" },
            { tipo: "Imóveis de interesse público", descricao: "Isentos" },
            { tipo: "Servidores públicos municipais", descricao: "Isentos (residência)" },
            { tipo: "Associações sem fins lucrativos", descricao: "Isentos" },
            { tipo: "Ex-combatentes da FEB", descricao: "Isentos" },
            { tipo: "Pessoas com câncer ou AIDS", descricao: "Isentos" }
        ],

        descontos: {
            cota_unica: {
                desconto: 0.07,
                percentual: "7%",
                prazo: "Até 30/06/2025"
            },
            parcelamento: {
                parcelas_maximas: 9,
                parcela_minima: 20.00,
                desconto: 0
            }
        }
    },


    // ═══════════════════════════════════════════════════════════════
    //  7. ITBI — IMPOSTO TRANSMISSÃO DE BENS IMÓVEIS (Teresina)
    // ═══════════════════════════════════════════════════════════════

    itbi: {
        municipio_referencia: "Teresina",
        dados_disponiveis: false,
        observacao: "Alíquota de ITBI de Teresina não detalhada na pesquisa. Verificar Prefeitura."
    },


    // ═══════════════════════════════════════════════════════════════
    //  8. TAXAS ESTADUAIS E MUNICIPAIS
    // ═══════════════════════════════════════════════════════════════

    taxas: {

        estaduais: {
            tcrd: {
                nome: "Taxa de Coleta e Remoção de Resíduos Domiciliares",
                municipio: "Teresina",
                formula: "TCRD = [(A × C1) × Y × N × PSER] / 3000",
                formula_acima_500m2: "TCRD = {[(500 × C1) + ((A - 500) × C2)] × Y × N × PSER} / 3000",
                componentes: {
                    residencial: { C1: 0.09, C2: 0.04, Y: 0.25, N: 365, PSER: 253.30 },
                    comercial: { C1: 0.12, C2: 0.06, Y: 0.25, N: 365, PSER: 253.30 }
                },
                unidades: {
                    C1: "l/m²",
                    C2: "l/m² (área acima 500m²)",
                    Y: "densidade aparente",
                    N: "dias/ano",
                    PSER: "R$/tonelada"
                },
                exemplo_100m2_residencial: 69.87,
                exemplo_150m2_residencial: 104.81
            },

            cosip: {
                nome: "COSIP — Contribuição para Iluminação Pública",
                municipio: "Teresina",
                tipo: "Faixa fixa por área do terreno",
                faixas: [
                    { de: 0, ate: 150, valor: 0, descricao: "ISENTO" },
                    { de: 150.01, ate: 300, valor: 122.22, descricao: "R$ 122,22/ano" },
                    { de: 300.01, ate: 500, valor: 216.67, descricao: "R$ 216,67/ano" },
                    { de: 500.01, ate: 1000, valor: 406.93, descricao: "R$ 406,93/ano" },
                    { de: 1000.01, ate: Infinity, valor: 694.41, descricao: "R$ 694,41/ano" }
                ],
                vigencia: "2025"
            },

            taxa_licenciamento: { dados_disponiveis: false, obs: "Verificar SEFAZ/PI" },
            taxa_judiciaria: { dados_disponiveis: false, obs: "Verificar SEFAZ/PI" },
            taxa_bombeiros: { dados_disponiveis: false, obs: "Verificar SEFAZ/PI" }
        },

        municipais_Teresina: {
            taxa_alvara: { dados_disponiveis: false, obs: "Verificar Prefeitura Teresina" },
            taxa_publicidade: { dados_disponiveis: false, obs: "Verificar Prefeitura Teresina" }
        }
    },


    // ═══════════════════════════════════════════════════════════════
    //  9. IMPOSTOS FEDERAIS (aplicáveis no estado)
    // ═══════════════════════════════════════════════════════════════

    federal: {
        irpj: {
            lucro_real: {
                aliquota: 0.15,
                percentual: "15%",
                base: "Lucro líquido ajustado",
                adicional: {
                    aliquota: 0.10,
                    percentual: "10%",
                    limite_mensal: 20000,
                    limite_anual: 240000,
                    descricao: "Sobre excedente de R$ 20.000/mês"
                }
            },
            lucro_presumido: {
                aliquota: 0.15,
                percentual: "15%",
                presuncao: {
                    comercio_industria: 0.08,
                    servicos: 0.32,
                    transporte: 0.08,
                    servicos_saude: 0.08,
                    transporte_passageiros: 0.16,
                    revenda_combustiveis: 0.016
                },
                aliquota_efetiva: {
                    comercio: 0.012,
                    servicos: 0.048,
                    transporte: 0.012
                },
                adicional: {
                    aliquota: 0.10,
                    percentual: "10%",
                    limite_trimestral: 60000,
                    descricao: "Sobre excedente de R$ 60.000/trimestre"
                }
            },
            incentivos_sudene: {
                reducao: 0.75,
                percentual_reducao: "75%",
                aliquota_efetiva: 0.0375,
                aliquota_efetiva_percentual: "3,75%",
                condicoes: "Empresas com projetos aprovados pela SUDENE",
                base_legal: "Lei nº 9.126/1995"
            },
            incentivos_sudam: {
                reducao: 0.75,
                percentual_reducao: "75%",
                aliquota_efetiva: 0.0375,
                aliquota_efetiva_percentual: "3,75%",
                condicoes: "Empresas na região Oeste do PI com projetos aprovados pela SUDAM",
                abrangencia: "Parcial — Oeste do Piauí"
            }
        },

        irpf: {
            tabela_mensal_2025: [
                { faixa: 1, de: 0, ate: 2112.00, aliquota: 0.00, deducao: 0, descricao: "Isento" },
                { faixa: 2, de: 2112.01, ate: 2826.65, aliquota: 0.075, deducao: 158.40, descricao: "7,5%" },
                { faixa: 3, de: 2826.66, ate: 3751.05, aliquota: 0.15, deducao: 423.15, descricao: "15%" },
                { faixa: 4, de: 3751.06, ate: 4664.68, aliquota: 0.225, deducao: 844.80, descricao: "22,5%" },
                { faixa: 5, de: 4664.69, ate: Infinity, aliquota: 0.275, deducao: 1278.64, descricao: "27,5%" }
            ]
        },

        csll: {
            aliquota_geral: 0.09,
            percentual: "9%",
            financeiras: { aliquota: 0.15, percentual: "15%" }
        },

        pis_pasep: {
            cumulativo: { aliquota: 0.0065, percentual: "0,65%", regime: "Lucro Presumido" },
            nao_cumulativo: { aliquota: 0.0165, percentual: "1,65%", regime: "Lucro Real" },
            aliquota_zero_cesta_basica: true
        },

        cofins: {
            cumulativo: { aliquota: 0.03, percentual: "3%", regime: "Lucro Presumido" },
            nao_cumulativo: { aliquota: 0.076, percentual: "7,6%", regime: "Lucro Real" },
            aliquota_zero_cesta_basica: true
        },

        ipi: { referencia: "TIPI vigente" },
        iof: { descricao: "Conforme legislação federal" },
        ii: { descricao: "Conforme TEC e legislação federal" },
        ie: { descricao: "Conforme legislação federal" },
        itr: { descricao: "Conforme legislação federal" },

        inss: {
            patronal: { aliquota_minima: 0.20, aliquota_maxima: 0.288, percentual: "20% a 28,8%", base: "Folha de pagamento" },
            rat_sat: { minima: 0.005, maxima: 0.03, percentual: "0,5% a 3%" },
            empregado: {
                tabela: [
                    { faixa: 1, ate: 1518.00, aliquota: 0.075, percentual: "7,5%" },
                    { faixa: 2, ate: 2793.88, aliquota: 0.09, percentual: "9%" },
                    { faixa: 3, ate: 4190.83, aliquota: 0.12, percentual: "12%" },
                    { faixa: 4, ate: 8157.41, aliquota: 0.14, percentual: "14%" }
                ],
                observacao: "Tabela progressiva 2025 — teto INSS R$ 8.157,41"
            }
        },

        fgts: { aliquota: 0.08, percentual: "8%", multa_rescisoria: 0.40 }
    },


    // ═══════════════════════════════════════════════════════════════
    //  10. SIMPLES NACIONAL
    // ═══════════════════════════════════════════════════════════════

    simples_nacional: {
        sublimite_estadual: 3600000,
        sublimite_estadual_formatado: "R$ 3.600.000,00",
        sublimite_tipo: "Padrão",

        limite_simples: 4800000,
        limite_simples_formatado: "R$ 4.800.000,00",

        mei: {
            limite_anual: 81000,
            limite_formatado: "R$ 81.000,00",
            vigencia: "2025",
            das_mensal: {
                comercio_industria: 76.90,
                servicos: 81.90,
                comercio_servicos: 81.90
            },
            icms_fixo: 1.00,
            iss_fixo: 5.00,
            observacao: "Valores conforme salário-mínimo R$ 1.518,00 (2025)"
        },

        anexos: {
            anexo_i: {
                nome: "Comércio",
                faixas: [
                    { faixa: 1, ate: 180000, aliquota: 0.04, deducao: 0 },
                    { faixa: 2, ate: 360000, aliquota: 0.073, deducao: 5940 },
                    { faixa: 3, ate: 720000, aliquota: 0.095, deducao: 13860 },
                    { faixa: 4, ate: 1800000, aliquota: 0.107, deducao: 22500 },
                    { faixa: 5, ate: 3600000, aliquota: 0.143, deducao: 87300 },
                    { faixa: 6, ate: 4800000, aliquota: 0.19, deducao: 378000 }
                ]
            },
            anexo_ii: {
                nome: "Indústria",
                faixas: [
                    { faixa: 1, ate: 180000, aliquota: 0.045, deducao: 0 },
                    { faixa: 2, ate: 360000, aliquota: 0.078, deducao: 5940 },
                    { faixa: 3, ate: 720000, aliquota: 0.10, deducao: 13860 },
                    { faixa: 4, ate: 1800000, aliquota: 0.112, deducao: 22500 },
                    { faixa: 5, ate: 3600000, aliquota: 0.147, deducao: 85500 },
                    { faixa: 6, ate: 4800000, aliquota: 0.30, deducao: 720000 }
                ]
            },
            anexo_iii: {
                nome: "Serviços (grupo 1)",
                faixas: [
                    { faixa: 1, ate: 180000, aliquota: 0.06, deducao: 0 },
                    { faixa: 2, ate: 360000, aliquota: 0.112, deducao: 9360 },
                    { faixa: 3, ate: 720000, aliquota: 0.135, deducao: 17640 },
                    { faixa: 4, ate: 1800000, aliquota: 0.16, deducao: 35640 },
                    { faixa: 5, ate: 3600000, aliquota: 0.21, deducao: 125640 },
                    { faixa: 6, ate: 4800000, aliquota: 0.33, deducao: 648000 }
                ]
            },
            anexo_iv: {
                nome: "Serviços (grupo 2 — limpeza, vigilância, construção civil)",
                faixas: [
                    { faixa: 1, ate: 180000, aliquota: 0.045, deducao: 0 },
                    { faixa: 2, ate: 360000, aliquota: 0.09, deducao: 8100 },
                    { faixa: 3, ate: 720000, aliquota: 0.1020, deducao: 12420 },
                    { faixa: 4, ate: 1800000, aliquota: 0.14, deducao: 39780 },
                    { faixa: 5, ate: 3600000, aliquota: 0.22, deducao: 183780 },
                    { faixa: 6, ate: 4800000, aliquota: 0.33, deducao: 828000 }
                ]
            },
            anexo_v: {
                nome: "Serviços (grupo 3 — engenharia, TI, contabilidade)",
                faixas: [
                    { faixa: 1, ate: 180000, aliquota: 0.155, deducao: 0 },
                    { faixa: 2, ate: 360000, aliquota: 0.18, deducao: 4500 },
                    { faixa: 3, ate: 720000, aliquota: 0.195, deducao: 9900 },
                    { faixa: 4, ate: 1800000, aliquota: 0.205, deducao: 17100 },
                    { faixa: 5, ate: 3600000, aliquota: 0.23, deducao: 62100 },
                    { faixa: 6, ate: 4800000, aliquota: 0.305, deducao: 540000 }
                ]
            }
        }
    },


    // ═══════════════════════════════════════════════════════════════
    //  11. INCENTIVOS FISCAIS E BENEFÍCIOS REGIONAIS
    // ═══════════════════════════════════════════════════════════════

    incentivos: {
        sudam: {
            ativo: true,
            abrangencia: "Parcial — Oeste do Piauí",
            nome: "Superintendência do Desenvolvimento da Amazônia",
            beneficios: {
                reducao_irpj: {
                    percentual: 0.75,
                    descricao: "Redução de 75% do IRPJ devido",
                    aliquota_efetiva: 0.0375,
                    aliquota_efetiva_percentual: "3,75%"
                }
            },
            condicoes: [
                "Projeto aprovado pela SUDAM",
                "Localização na região Oeste do Piauí",
                "Tipos: instalação, diversificação, modernização"
            ]
        },

        sudene: {
            ativo: true,
            abrangencia: "Todo o estado do Piauí",
            nome: "Superintendência do Desenvolvimento do Nordeste",
            beneficios: {
                reducao_irpj: {
                    percentual: 0.75,
                    descricao: "Redução de 75% do IRPJ devido",
                    aliquota_efetiva: 0.0375,
                    aliquota_efetiva_percentual: "3,75%"
                }
            },
            condicoes: [
                "Projeto aprovado pela SUDENE",
                "Localização no Piauí",
                "Tipos: instalação, diversificação, modernização"
            ],
            base_legal: "Lei nº 9.126/1995"
        },

        zona_franca: { ativo: false },
        alc: { ativo: false },

        programas_estaduais: {
            dados_disponiveis: false,
            obs: "Programas estaduais de incentivo fiscal não detalhados na pesquisa — verificar SEFAZ/PI"
        }
    },


    // ═══════════════════════════════════════════════════════════════
    //  12. REFORMA TRIBUTÁRIA
    // ═══════════════════════════════════════════════════════════════

    reforma_tributaria: {
        ibs: {
            nome: "Imposto sobre Bens e Serviços",
            substituira: "ICMS (estadual) + ISS (municipal)",
            cronograma: "Transição gradual conforme legislação federal",
            dados_disponiveis: false
        },
        cbs: {
            nome: "Contribuição sobre Bens e Serviços",
            substituira: "PIS/COFINS (federal)",
            dados_disponiveis: false
        },
        is: {
            nome: "Imposto Seletivo",
            descricao: "Sobre produtos prejudiciais à saúde ou meio ambiente",
            dados_disponiveis: false
        }
    },


    // ═══════════════════════════════════════════════════════════════
    //  13. DADOS DE COBERTURA
    // ═══════════════════════════════════════════════════════════════

    cobertura: {
        versao: "3.0",
        data_atualizacao: "2026-02-10",
        localizados: [
            "ICMS — alíquota padrão 22,5% (desde 01/04/2025) + histórico 21%",
            "ICMS — alíquotas interestaduais (7% e 12%)",
            "ICMS — importação (22,5%)",
            "ICMS — energia solar isenta",
            "ICMS — legislação completa (Lei nº 4.257/1989, Lei nº 8.558/2024, RICMS/PI)",
            "IPVA — alíquotas completas (2,5% autos/embarcações/aeronaves; 2% motos >170cc; 1% ônibus/caminhões; 0% motos ≤170cc)",
            "IPVA — 7 categorias de isenção detalhadas",
            "IPVA — descontos: 15% cota única jan, 10% fev, 3 parcelas",
            "ISS Teresina — tabela detalhada com 5 faixas (0,2%, 2%, 3%, 4%, 5%) e 30+ tipos de serviço",
            "ISS Teresina — incentivo profissional recém-formado 0,2%",
            "IPTU Teresina — progressivo: 7 faixas × 3 tipos (residencial, não-residencial, terreno)",
            "IPTU Teresina — isenções: 6 categorias",
            "IPTU Teresina — desconto 7% cota única, até 9 parcelas",
            "TCRD Teresina — fórmula completa com componentes",
            "COSIP Teresina — 5 faixas por área do terreno",
            "Impostos federais completos (IRPJ, CSLL, PIS, COFINS, INSS, FGTS, IRPF)",
            "Simples Nacional — sublimite R$ 3.600.000 e anexos I-V",
            "MEI — R$ 81.000 / DAS R$ 76,90-81,90",
            "SUDENE — redução 75% IRPJ (todo o estado)",
            "SUDAM — redução 75% IRPJ (parcial — Oeste)"
        ],

        nao_localizados: [
            "ICMS — alíquotas diferenciadas detalhadas (combustíveis, energia, bebidas, medicamentos, cesta básica)",
            "ICMS — Substituição Tributária (produtos e MVA)",
            "ITCMD — alíquotas e faixas não incluídas na pesquisa",
            "ITBI Teresina — alíquota não detalhada",
            "ISS Teresina — ISS fixo (autônomos)",
            "Taxas estaduais (licenciamento, judiciária, bombeiros)",
            "Programas estaduais de incentivo fiscal",
            "Taxas municipais (alvará, publicidade)"
        ],

        contatos_para_completar: [
            "SEFAZ/PI — https://portal.sefaz.pi.gov.br/",
            "Prefeitura Teresina — https://pmt.pi.gov.br/",
            "SEMF Teresina — https://semf.pmt.pi.gov.br/",
            "SUDENE — https://www.gov.br/sudene",
            "SUDAM — https://www.gov.br/sudam"
        ],

        cobertura_percentual_estimada: "65%",
        observacao: "Excelente cobertura de ISS (30+ tipos de serviço) e IPTU (7 faixas × 3 tipos). TCRD e COSIP com fórmulas completas. Gap principal: ITCMD e ITBI."
    }
};


// ═══════════════════════════════════════════════════════════════════════════
//  14. FUNÇÕES UTILITÁRIAS — PIAUÍ
// ═══════════════════════════════════════════════════════════════════════════

function getISSPiaui(tipo) {
    var servico = PIAUI_TRIBUTARIO.iss.por_tipo_servico[tipo];
    if (!servico) {
        return {
            encontrado: false,
            aliquota: PIAUI_TRIBUTARIO.iss.aliquota_maxima,
            percentual: PIAUI_TRIBUTARIO.iss.aliquota_maxima_percentual,
            mensagem: "Tipo \"" + tipo + "\" não encontrado. Usando alíquota máxima de 5%."
        };
    }
    return {
        encontrado: true,
        aliquota: servico.aliquota,
        percentual: servico.percentual,
        descricao: servico.descricao,
        condicao: servico.condicao || null
    };
}

function _encontrarFaixaIPTUPiaui(faixas, valorVenal) {
    for (var i = 0; i < faixas.length; i++) {
        if (valorVenal >= faixas[i].de && valorVenal <= faixas[i].ate) return faixas[i];
    }
    return faixas[faixas.length - 1];
}

function getIPTUResidencialPiaui(valorVenal) {
    if (!valorVenal || valorVenal <= 0) return { erro: true, mensagem: "Valor venal deve ser maior que zero." };
    var faixa = _encontrarFaixaIPTUPiaui(PIAUI_TRIBUTARIO.iptu.residencial.faixas, valorVenal);
    return {
        valor_venal: valorVenal,
        faixa: faixa.faixa,
        aliquota: faixa.aliquota,
        percentual: faixa.percentual,
        iptu: parseFloat((valorVenal * faixa.aliquota).toFixed(2)),
        tipo: "Residencial"
    };
}

function getIPTUNaoResidencialPiaui(valorVenal) {
    if (!valorVenal || valorVenal <= 0) return { erro: true, mensagem: "Valor venal deve ser maior que zero." };
    var faixa = _encontrarFaixaIPTUPiaui(PIAUI_TRIBUTARIO.iptu.nao_residencial.faixas, valorVenal);
    return {
        valor_venal: valorVenal,
        faixa: faixa.faixa,
        aliquota: faixa.aliquota,
        percentual: faixa.percentual,
        iptu: parseFloat((valorVenal * faixa.aliquota).toFixed(2)),
        tipo: "Não Residencial"
    };
}

function getIPTUTerrenoPiaui(valorVenal) {
    if (!valorVenal || valorVenal <= 0) return { erro: true, mensagem: "Valor venal deve ser maior que zero." };
    var faixa = _encontrarFaixaIPTUPiaui(PIAUI_TRIBUTARIO.iptu.nao_edificado.faixas, valorVenal);
    return {
        valor_venal: valorVenal,
        faixa: faixa.faixa,
        aliquota: faixa.aliquota,
        percentual: faixa.percentual,
        iptu: parseFloat((valorVenal * faixa.aliquota).toFixed(2)),
        tipo: "Terreno (não edificado)"
    };
}

function getIPVAPiaui(tipo) {
    var veiculo = PIAUI_TRIBUTARIO.ipva.aliquotas[tipo];
    if (!veiculo) {
        return {
            encontrado: false,
            aliquota: null,
            mensagem: "Tipo \"" + tipo + "\" não encontrado. Disponíveis: " + Object.keys(PIAUI_TRIBUTARIO.ipva.aliquotas).join(", ")
        };
    }
    return {
        encontrado: true,
        aliquota: veiculo.aliquota,
        percentual: veiculo.percentual,
        descricao: veiculo.descricao
    };
}

function calcularIPVAPiaui(valorVenal, tipo) {
    var info = getIPVAPiaui(tipo);
    if (!info.encontrado) return info;
    if (!valorVenal || valorVenal <= 0) return { erro: true, mensagem: "Valor venal deve ser maior que zero." };
    var ipva_bruto = parseFloat((valorVenal * info.aliquota).toFixed(2));
    return {
        valor_venal: valorVenal,
        tipo: tipo,
        aliquota: info.aliquota,
        percentual: info.percentual,
        ipva_bruto: ipva_bruto,
        desconto_15pct: parseFloat((ipva_bruto * 0.85).toFixed(2)),
        desconto_10pct: parseFloat((ipva_bruto * 0.90).toFixed(2)),
        sem_desconto: ipva_bruto
    };
}

function calcularTCRDPiaui(areaM2, tipo) {
    if (!areaM2 || areaM2 <= 0) return { erro: true, mensagem: "Área deve ser maior que zero." };
    tipo = tipo || "residencial";
    var comp = PIAUI_TRIBUTARIO.taxas.estaduais.tcrd.componentes[tipo];
    if (!comp) return { erro: true, mensagem: "Tipo deve ser 'residencial' ou 'comercial'." };

    var tcrd;
    if (areaM2 <= 500) {
        tcrd = (areaM2 * comp.C1 * comp.Y * comp.N * comp.PSER) / 3000;
    } else {
        tcrd = (((500 * comp.C1) + ((areaM2 - 500) * comp.C2)) * comp.Y * comp.N * comp.PSER) / 3000;
    }

    return {
        area: areaM2,
        tipo: tipo,
        C1: comp.C1,
        C2: comp.C2,
        tcrd: parseFloat(tcrd.toFixed(2))
    };
}

function calcularCOSIPPiaui(areaTerreno) {
    if (!areaTerreno || areaTerreno <= 0) return { erro: true, mensagem: "Área deve ser maior que zero." };
    var faixas = PIAUI_TRIBUTARIO.taxas.estaduais.cosip.faixas;
    for (var i = 0; i < faixas.length; i++) {
        if (areaTerreno >= faixas[i].de && areaTerreno <= faixas[i].ate) {
            return { area: areaTerreno, valor_anual: faixas[i].valor, descricao: faixas[i].descricao };
        }
    }
    return { area: areaTerreno, valor_anual: faixas[faixas.length - 1].valor, descricao: faixas[faixas.length - 1].descricao };
}

function isZonaFrancaPiaui() { return false; }
function isALCPiaui() { return false; }

function getReducaoSUDAMPiaui() {
    return {
        ativo: true,
        abrangencia: "Parcial — Oeste do Piauí",
        reducao_irpj: 0.75,
        reducao_irpj_percentual: "75%",
        aliquota_efetiva_irpj: 0.0375,
        aliquota_efetiva_irpj_percentual: "3,75%",
        condicoes: "Projeto aprovado pela SUDAM, localizado na região Oeste do PI"
    };
}

function getReducaoSUDENEPiaui() {
    return {
        ativo: true,
        abrangencia: "Todo o estado do Piauí",
        reducao_irpj: 0.75,
        reducao_irpj_percentual: "75%",
        aliquota_efetiva_irpj: 0.0375,
        aliquota_efetiva_irpj_percentual: "3,75%",
        condicoes: "Projeto aprovado pela SUDENE",
        base_legal: "Lei nº 9.126/1995"
    };
}

function getICMSEfetivoPiaui() {
    return {
        aliquota_base: 0.225,
        funcep: null,
        efetiva: 0.225,
        percentual: "22,5%",
        vigencia: "A partir de 01/04/2025",
        anterior: "21%",
        observacao: "Um dos ICMS mais altos do Brasil"
    };
}

function getAliquotaEfetivaSimplesPiaui(rbt12, anexo) {
    var tabela = PIAUI_TRIBUTARIO.simples_nacional.anexos[anexo];
    if (!tabela) return { erro: true, mensagem: "Anexo \"" + anexo + "\" não encontrado." };
    if (rbt12 <= 0) return { erro: true, mensagem: "RBT12 deve ser maior que zero." };
    if (rbt12 > 4800000) return { erro: true, mensagem: "RBT12 excede o limite do Simples Nacional." };

    var faixaSelecionada = null;
    for (var i = 0; i < tabela.faixas.length; i++) {
        if (rbt12 <= tabela.faixas[i].ate) { faixaSelecionada = tabela.faixas[i]; break; }
    }
    if (!faixaSelecionada) return { erro: true, mensagem: "Faixa não encontrada." };

    var aliquotaEfetiva = ((rbt12 * faixaSelecionada.aliquota) - faixaSelecionada.deducao) / rbt12;
    return {
        erro: false, rbt12: rbt12, anexo: tabela.nome, faixa: faixaSelecionada.faixa,
        aliquota_nominal: faixaSelecionada.aliquota, deducao: faixaSelecionada.deducao,
        aliquota_efetiva: parseFloat(aliquotaEfetiva.toFixed(6)),
        aliquota_efetiva_percentual: (aliquotaEfetiva * 100).toFixed(2) + "%",
        sublimite_icms_iss: PIAUI_TRIBUTARIO.simples_nacional.sublimite_estadual,
        alerta_sublimite: rbt12 > PIAUI_TRIBUTARIO.simples_nacional.sublimite_estadual
            ? "RBT12 acima do sublimite estadual — ICMS/ISS recolhidos à parte" : null
    };
}

function resumoTributarioPiaui() {
    return {
        estado: "Piauí (PI)",
        regiao: "Nordeste",
        capital: "Teresina",
        icms_padrao: "22,5%",
        icms_efetivo: "22,5%",
        ipva_auto: "2,5%",
        ipva_moto_acima_170cc: "2%",
        ipva_moto_ate_170cc: "0% (isento)",
        ipva_onibus_caminhao: "1%",
        ipva_embarcacao: "2,5%",
        ipva_aeronave: "2,5%",
        itcmd: "Não localizado",
        iss_minima: "0,2% (educação/recém-formado)",
        iss_maxima: "5% (Teresina)",
        iptu_residencial: "0,20% a 1,00% (7 faixas — Teresina)",
        iptu_nao_residencial: "0,20% a 1,20% (7 faixas — Teresina)",
        iptu_terreno: "1,20% a 2,60% (7 faixas — Teresina)",
        itbi: "Não localizado",
        tcrd: "Fórmula por área (Teresina)",
        cosip: "R$ 0 a R$ 694,41/ano (Teresina)",
        sublimite_simples: PIAUI_TRIBUTARIO.simples_nacional.sublimite_estadual_formatado,
        sudene: true,
        sudam: "Parcial (Oeste)",
        zona_franca: false,
        cobertura_estimada: PIAUI_TRIBUTARIO.cobertura.cobertura_percentual_estimada
    };
}

function getIncentivosAtivosPiaui() {
    var incentivos = [];
    if (PIAUI_TRIBUTARIO.incentivos.sudene.ativo) {
        incentivos.push({ nome: "SUDENE", tipo: "Federal", abrangencia: "Todo o estado", beneficio_principal: "Redução 75% IRPJ" });
    }
    if (PIAUI_TRIBUTARIO.incentivos.sudam.ativo) {
        incentivos.push({ nome: "SUDAM", tipo: "Federal", abrangencia: "Parcial — Oeste do PI", beneficio_principal: "Redução 75% IRPJ" });
    }
    return incentivos;
}


// ═══════════════════════════════════════════════════════════════════════════
//  15. EXPORTAÇÃO (Padrão Grupo 2)
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        ...PIAUI_TRIBUTARIO,
        utils: {
            getISS: getISSPiaui,
            getIPTUResidencial: getIPTUResidencialPiaui,
            getIPTUNaoResidencial: getIPTUNaoResidencialPiaui,
            getIPTUTerreno: getIPTUTerrenoPiaui,
            getIPVA: getIPVAPiaui,
            calcularIPVA: calcularIPVAPiaui,
            calcularTCRD: calcularTCRDPiaui,
            calcularCOSIP: calcularCOSIPPiaui,
            isZonaFranca: isZonaFrancaPiaui,
            isALC: isALCPiaui,
            getReducaoSUDAM: getReducaoSUDAMPiaui,
            getReducaoSUDENE: getReducaoSUDENEPiaui,
            getICMSEfetivo: getICMSEfetivoPiaui,
            getAliquotaEfetivaSimples: getAliquotaEfetivaSimplesPiaui,
            resumoTributario: resumoTributarioPiaui,
            getIncentivosAtivos: getIncentivosAtivosPiaui,
        },
    };
}

if (typeof window !== "undefined") {
    window.PIAUI_TRIBUTARIO = PIAUI_TRIBUTARIO;
    window.PiauiTributario = {
        getISS: getISSPiaui,
        getIPTUResidencial: getIPTUResidencialPiaui,
        getIPTUNaoResidencial: getIPTUNaoResidencialPiaui,
        getIPTUTerreno: getIPTUTerrenoPiaui,
        getIPVA: getIPVAPiaui,
        calcularIPVA: calcularIPVAPiaui,
        calcularTCRD: calcularTCRDPiaui,
        calcularCOSIP: calcularCOSIPPiaui,
        isZonaFranca: isZonaFrancaPiaui,
        isALC: isALCPiaui,
        getReducaoSUDAM: getReducaoSUDAMPiaui,
        getReducaoSUDENE: getReducaoSUDENEPiaui,
        getICMSEfetivo: getICMSEfetivoPiaui,
        getAliquotaEfetivaSimples: getAliquotaEfetivaSimplesPiaui,
        resumoTributario: resumoTributarioPiaui,
        getIncentivosAtivos: getIncentivosAtivosPiaui,
    };
}
