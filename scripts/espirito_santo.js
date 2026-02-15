/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ESPIRITO_SANTO.JS — Base de Dados Tributária Completa do Estado do Espírito Santo
 * ═══════════════════════════════════════════════════════════════════════════
 * Versão 3.0 — Padronizado conforme modelo roraima.js v3.0
 * Dados verificados via fontes oficiais (SEFAZ/ES, RFB, Planalto, DETRAN-ES)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ESTRUTURA PADRÃO (15 seções obrigatórias):
 *   01. dados_gerais        — Identificação, links, legislação base
 *   02. icms                — Alíquotas, diferenciadas, interestaduais, ST
 *   03. ipva                — Alíquotas, descontos, isenções
 *   04. itcmd               — Alíquotas, base de cálculo, isenções
 *   05. iss                 — Tabela por tipo de serviço (município-referência)
 *   06. iptu                — Alíquotas, progressividade, isenções
 *   07. itbi                — Alíquota, base de cálculo
 *   08. taxas               — Estaduais e municipais
 *   09. federal             — IRPJ, CSLL, PIS, COFINS, IOF, ITR, INSS, FGTS, IRPF
 *   10. simples_nacional    — Anexos, faixas, sublimite, MEI
 *   11. incentivos          — SUDAM/SUDENE, ZFM/ALC, programas estaduais
 *   12. reforma_tributaria  — EC 132, LC 214, transição IBS/CBS
 *   13. cobertura           — Versão, itens localizados/pendentes, contatos
 *   14. funções utilitárias — Helpers de cálculo
 *   15. exportação          — module.exports + window (padrão Grupo 2)
 *
 * FONTES CONSULTADAS:
 *   • SEFAZ/ES — https://sefaz.es.gov.br/
 *   • Lei nº 7.000/2001 (Lei do ICMS do Espírito Santo)
 *   • Decreto nº 1.090-R/2002 (RICMS/ES)
 *   • Lei nº 11.997/2023 (Redução ICMS gás natural para indústria)
 *   • Lei Complementar nº 481/2024 (Majoração álcool carburante)
 *   • Lei nº 5.400/1996 (IPVA/ES)
 *   • Código Tributário Municipal de Vitória
 *   • Decreto nº 25.380/2025 (Redução ISS profissionais específicos)
 *   • Receita Federal — www.gov.br/receitafederal
 *   • Planalto.gov.br
 *
 * ATUALIZAÇÃO: 10/02/2026
 * ═══════════════════════════════════════════════════════════════════════════
 */

const ESPIRITO_SANTO_TRIBUTARIO = {

    // ═══════════════════════════════════════════════════════════════
    //  1. DADOS GERAIS
    // ═══════════════════════════════════════════════════════════════

    dados_gerais: {
        nome: 'Espírito Santo',
        sigla: 'ES',
        codigo_ibge: 32,
        capital: 'Vitória',
        codigo_ibge_capital: 3205309,
        regiao: 'Sudeste',
        zona_franca: false,
        alc: false,
        sudam: false,
        sudene: false,
        sefaz_url: 'https://sefaz.es.gov.br/',
        legislacao_url: 'http://www2.sefaz.es.gov.br/LegislacaoOnline/',
        detran_url: 'https://detran.es.gov.br/',
        prefeitura_url: 'https://www.vitoria.es.gov.br/',
        sefaz_municipal_url: 'https://www.vitoria.es.gov.br/prefeitura/',
        receita_federal_url: 'https://www.gov.br/receitafederal/',
        municipios_principais: [
            { nome: 'Vitória', codigo_ibge: 3205309, capital: true },
            { nome: 'Vila Velha', codigo_ibge: 3205200, capital: false },
            { nome: 'Serra', codigo_ibge: 3205002, capital: false },
            { nome: 'Cariacica', codigo_ibge: 3201308, capital: false },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  2. ICMS — IMPOSTO SOBRE CIRCULAÇÃO DE MERCADORIAS E SERVIÇOS
    // ═══════════════════════════════════════════════════════════════

    icms: {
        aliquota_padrao: 0.17,  // 17%
        fecop: {
            ativo: false,
            aliquota: 0,
            obs: 'Espírito Santo não possui FECOP adicional destacado na pesquisa',
        },
        aliquota_efetiva: 0.17,

        aliquotas_diferenciadas: {
            cesta_basica: {
                aliquota: null,
                dados_disponiveis: false,
                obs: 'Não detalhado na pesquisa — verificar RICMS/ES Decreto 1.090-R/2002',
            },
            energia_eletrica: {
                aliquota: null,
                dados_disponiveis: false,
                obs: 'Não detalhado na pesquisa',
            },
            gas_natural_industria: {
                aliquota: 0.12,  // 12%
                obs: 'Reduzido de 15% em 2024 para 12% em 2025',
                base_legal: 'Lei nº 11.997/2023',
            },
            biogas_biometano: {
                aliquota: 0.12,  // 12%
                obs: 'Reduzido de 17% desde 2024',
            },
            alcool_carburante: {
                aliquota: 0.27,  // 27%
                obs: 'Majorado de 17% desde 2025',
                base_legal: 'Lei Complementar nº 481/2024',
            },
            telecom: {
                aliquota: null,
                dados_disponiveis: false,
                obs: 'Não detalhado na pesquisa',
            },
            combustiveis: {
                aliquota: null,
                dados_disponiveis: false,
                obs: 'Não detalhado na pesquisa — verificar RICMS/ES',
            },
            medicamentos: {
                aliquota: null,
                dados_disponiveis: false,
                obs: 'Não detalhado na pesquisa',
            },
        },

        interestadual: {
            norte_nordeste_centro_oeste_es: 0.12,
            sul_sudeste_exceto_es: 0.07,
            nao_contribuinte: 0.17,
        },

        importacao: 0.17,

        substituicao_tributaria: {
            dados_disponiveis: false,
            obs: 'Produtos sujeitos a ST e MVAs não detalhados na pesquisa — verificar RICMS/ES',
        },

        legislacao: [
            { norma: 'Lei nº 7.000/2001', assunto: 'Lei do ICMS do Espírito Santo' },
            { norma: 'Lei nº 11.997/2023', assunto: 'Redução ICMS gás natural para indústria' },
            { norma: 'Lei Complementar nº 481/2024', assunto: 'Majoração álcool carburante para 27%' },
            { norma: 'Decreto nº 1.090-R/2002', assunto: 'Regulamento do ICMS (RICMS/ES)' },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  3. IPVA — IMPOSTO SOBRE PROPRIEDADE DE VEÍCULOS AUTOMOTORES
    // ═══════════════════════════════════════════════════════════════

    ipva: {
        aliquotas: {
            automovel: 0.02,                  // 2%
            caminhonete: 0.02,                // 2%
            utilitario: 0.02,                 // 2%
            embarcacao: 0.02,                 // 2%
            aeronave: 0.02,                   // 2%
            motocicleta: 0.01,                // 1%
            ciclomotor: 0.01,                 // 1%
            onibus: 0.01,                     // 1%
            micro_onibus: 0.01,               // 1%
            caminhao: 0.01,                   // 1%
        },

        base_calculo: 'Tabela FIPE (veículos usados) / Nota Fiscal (veículos novos)',

        isencoes: [
            { categoria: 'Veículos fabricados até 2010', condicao: 'Ano de fabricação até 2010', base_legal: 'Lei estadual' },
            { categoria: 'PCD', condicao: 'Com comprovação de deficiência', base_legal: 'Lei estadual' },
            { categoria: 'Táxis', condicao: 'Categoria aluguel, motorista profissional', base_legal: 'Lei estadual' },
            { categoria: 'Veículos Oficiais', condicao: 'União, Estados, Municípios', base_legal: 'Lei estadual' },
            { categoria: 'Transporte Público', condicao: 'Empresas concessionárias', base_legal: 'Lei estadual' },
            { categoria: 'Ambulâncias/Bombeiros', condicao: 'Sem cobrança de serviço', base_legal: 'Lei estadual' },
        ],

        descontos: {
            cota_unica: {
                percentual: 0.10,  // até 10%
                obs: 'Conforme calendário estadual',
            },
            parcelamento: {
                desconto: 0,
                parcelas_maximas: 6,
                obs: 'Até 6 parcelas sem desconto',
            },
        },

        legislacao: [
            { norma: 'Lei nº 5.400/1996', assunto: 'Lei do IPVA do Espírito Santo' },
            { norma: 'Decreto nº 6.226-R/2026', assunto: 'Calendário IPVA 2026' },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  4. ITCMD — IMPOSTO SOBRE TRANSMISSÃO CAUSA MORTIS E DOAÇÃO
    // ═══════════════════════════════════════════════════════════════

    itcmd: {
        dados_disponiveis: false,
        obs: 'Não detalhado na pesquisa — verificar legislação estadual SEFAZ/ES',
    },


    // ═══════════════════════════════════════════════════════════════
    //  5. ISS — IMPOSTO SOBRE SERVIÇOS (Vitória — referência)
    // ═══════════════════════════════════════════════════════════════

    iss: {
        municipio_referencia: 'Vitória',
        aliquota_minima: 0.02,
        aliquota_maxima: 0.05,

        reducao_especial: {
            descricao: 'Redução de 75% na alíquota ISS para profissionais específicos',
            percentual_reducao: 0.75,
            base_legal: 'Decreto nº 25.380/2025',
        },

        por_tipo_servico: {
            // === 2% ===
            cartorios:              { aliquota: 0.02, descricao: 'Serviços de cartórios' },
            arrendamento_mercantil: { aliquota: 0.02, descricao: 'Arrendamento mercantil' },
            recreacao_esportiva:    { aliquota: 0.02, descricao: 'Serviços recreativos e esportivos (patrocinados)' },
            intermediacao_imoveis:  { aliquota: 0.02, descricao: 'Intermediação de imóveis' },
            agenciamento_seguros:   { aliquota: 0.02, descricao: 'Agenciamento de seguros' },
            intermediacao_geral:    { aliquota: 0.02, descricao: 'Serviços de intermediação em geral' },
            gestao_imobiliaria:     { aliquota: 0.02, descricao: 'Gestão imobiliária' },
            vigilancia:             { aliquota: 0.02, descricao: 'Vigilância e segurança' },
            coworking:              { aliquota: 0.02, descricao: 'Serviços de coworking' },
            profissional_recem_formado: { aliquota: 0.02, descricao: 'Atividades profissionais recém-formadas (5 anos)' },

            // === 3% ===
            saude:                { aliquota: 0.03, descricao: 'Serviços de saúde e assistência médica' },
            medicina:             { aliquota: 0.03, descricao: 'Medicina, biomedicina' },
            analises_clinicas:    { aliquota: 0.03, descricao: 'Análises clínicas, radiologia, tomografia' },
            hospitais_clinicas:   { aliquota: 0.03, descricao: 'Hospitais, clínicas, laboratórios' },
            enfermagem:           { aliquota: 0.03, descricao: 'Enfermagem e serviços auxiliares' },
            farmacia:             { aliquota: 0.03, descricao: 'Serviços farmacêuticos' },
            fisioterapia:         { aliquota: 0.03, descricao: 'Fisioterapia, fonoaudiologia, terapia ocupacional' },
            odontologia:          { aliquota: 0.03, descricao: 'Odontologia' },
            psicologia:           { aliquota: 0.03, descricao: 'Psicologia, psicanálise' },
            casas_repouso:        { aliquota: 0.03, descricao: 'Casas de repouso, creches, asilos' },
            planos_saude:         { aliquota: 0.03, descricao: 'Planos de saúde' },
            educacao:             { aliquota: 0.03, descricao: 'Serviços de educação' },

            // === 4% ===
            construcao_civil:     { aliquota: 0.04, descricao: 'Serviços de construção civil' },
            engenharia:           { aliquota: 0.04, descricao: 'Engenharia, arquitetura' },
            execucao_obras:       { aliquota: 0.04, descricao: 'Execução de construção civil' },
            reparacao_conservacao: { aliquota: 0.04, descricao: 'Reparação, conservação e reforma' },
            limpeza:              { aliquota: 0.04, descricao: 'Serviços de limpeza e conservação' },
            advocacia:            { aliquota: 0.04, descricao: 'Serviços de advocacia' },
            contabilidade:        { aliquota: 0.04, descricao: 'Serviços de contabilidade' },
            consultoria:          { aliquota: 0.04, descricao: 'Serviços de consultoria' },

            // === 5% ===
            informatica:          { aliquota: 0.05, descricao: 'Serviços de informática' },
            desenvolvimento_sistemas: { aliquota: 0.05, descricao: 'Análise e desenvolvimento de sistemas' },
            programacao:          { aliquota: 0.05, descricao: 'Programação' },
            processamento_dados:  { aliquota: 0.05, descricao: 'Processamento de dados' },
            suporte_tecnico:      { aliquota: 0.05, descricao: 'Suporte técnico em informática' },
            web_design:           { aliquota: 0.05, descricao: 'Planejamento, confecção, manutenção de páginas eletrônicas' },
            pesquisa_desenvolvimento: { aliquota: 0.05, descricao: 'Serviços de pesquisa e desenvolvimento' },
            locacao_cessao:       { aliquota: 0.05, descricao: 'Serviços de locação e cessão' },
            veterinaria:          { aliquota: 0.05, descricao: 'Serviços veterinários' },
            estetica:             { aliquota: 0.05, descricao: 'Serviços de cuidados pessoais e estética' },
            barbearia:            { aliquota: 0.05, descricao: 'Barbearia, cabeleireiros, manicuros, pedicuros' },
            esteticistas:         { aliquota: 0.05, descricao: 'Esteticistas, tratamento de pele, depilação' },
            academia:             { aliquota: 0.05, descricao: 'Ginástica, dança, esportes, natação' },
            spa:                  { aliquota: 0.05, descricao: 'Centros de emagrecimento, spa' },
            hospedagem:           { aliquota: 0.05, descricao: 'Hospedagem em hotéis, apart-service, flats, motéis' },
            turismo:              { aliquota: 0.05, descricao: 'Agenciamento de turismo, viagens' },
            guia_turismo:         { aliquota: 0.05, descricao: 'Guias de turismo' },
            estacionamento:       { aliquota: 0.05, descricao: 'Guarda e estacionamento de veículos' },
            espetaculos:          { aliquota: 0.05, descricao: 'Espetáculos teatrais, cinematográficos, circenses' },
            diversoes:            { aliquota: 0.05, descricao: 'Parques de diversões, centros de lazer' },
            casas_noturnas:       { aliquota: 0.05, descricao: 'Boates, táxi-dancing' },
            shows:                { aliquota: 0.05, descricao: 'Shows, ballet, danças, desfiles, bailes, óperas' },
            feiras_eventos:       { aliquota: 0.05, descricao: 'Feiras, exposições, congressos' },
            jogos:                { aliquota: 0.05, descricao: 'Bilhares, boliches, diversões eletrônicas' },
            musica:               { aliquota: 0.05, descricao: 'Execução de música' },
            producao_eventos:     { aliquota: 0.05, descricao: 'Produção de eventos, espetáculos, shows' },
            fotografia:           { aliquota: 0.05, descricao: 'Fonografia, fotografia, cinematografia' },
            reprografia:          { aliquota: 0.05, descricao: 'Reprografia, microfilmagem, digitalização' },
            grafica:              { aliquota: 0.05, descricao: 'Composição gráfica, impressos gráficos' },
            mecanica:             { aliquota: 0.05, descricao: 'Lubrificação, limpeza, lustração, revisão, conserto' },
            assistencia_tecnica:  { aliquota: 0.05, descricao: 'Assistência técnica' },
            motores:              { aliquota: 0.05, descricao: 'Recondicionamento de motores' },
            pneus:                { aliquota: 0.05, descricao: 'Recauchutagem ou regeneração de pneus' },
            restauracao:          { aliquota: 0.05, descricao: 'Restauração, recondicionamento, pintura' },
            instalacao_montagem:  { aliquota: 0.05, descricao: 'Instalação e montagem de aparelhos, máquinas' },
            alfaiataria:          { aliquota: 0.05, descricao: 'Alfaiataria e costura' },
            lavanderia:           { aliquota: 0.05, descricao: 'Tinturaria e lavanderia' },
            tapecaria:            { aliquota: 0.05, descricao: 'Tapeçaria e reforma de estofamento' },
            funilaria:            { aliquota: 0.05, descricao: 'Funilaria e lanternagem' },
            transporte_pessoas:   { aliquota: 0.05, descricao: 'Transporte de pessoas' },
            transporte_carga:     { aliquota: 0.05, descricao: 'Transporte de carga' },
            transporte_urbano:    { aliquota: 0.05, descricao: 'Transporte urbano de pessoas/carga' },
            taxi:                 { aliquota: 0.05, descricao: 'Serviços de táxi' },
            mala_direta:          { aliquota: 0.05, descricao: 'Transporte de mala direta' },
            reboque:              { aliquota: 0.05, descricao: 'Serviços de reboque' },
            transporte_valores:   { aliquota: 0.05, descricao: 'Transporte de valores' },
            telefonia:            { aliquota: 0.05, descricao: 'Serviços de telefonia' },
            comunicacao:          { aliquota: 0.05, descricao: 'Comunicação por satélite, rádio, TV, internet' },
            auditoria:            { aliquota: 0.05, descricao: 'Serviços de auditoria' },
            pericia:              { aliquota: 0.05, descricao: 'Serviços de perícia' },
            traducao:             { aliquota: 0.05, descricao: 'Serviços de tradução' },
            interpretacao:        { aliquota: 0.05, descricao: 'Serviços de interpretação' },
            secretariado:         { aliquota: 0.05, descricao: 'Serviços de secretariado' },
            administracao_imoveis: { aliquota: 0.05, descricao: 'Serviços de administração de imóveis' },
            administracao_empresas: { aliquota: 0.05, descricao: 'Serviços de administração de empresas' },
            administracao_condominios: { aliquota: 0.05, descricao: 'Serviços de administração de condomínios' },
        },

        legislacao: [
            { norma: 'Lei Complementar nº 116/2003', assunto: 'Normas Gerais ISS (Federal)' },
            { norma: 'Código Tributário Municipal de Vitória', assunto: 'Lei Municipal — ISS' },
            { norma: 'Decreto nº 25.380/2025', assunto: 'Redução de 75% alíquota ISS para profissionais específicos' },
            { norma: 'Portaria SEMFA nº 1/2025', assunto: 'Prazos de recolhimento ISS' },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  6. IPTU — IMPOSTO PREDIAL E TERRITORIAL URBANO (Vitória)
    // ═══════════════════════════════════════════════════════════════

    iptu: {
        municipio_referencia: 'Vitória',

        residencial: {
            faixas: [
                { limite_inferior: 0,      limite_superior: 30000,  aliquota: 0.0012, descricao: 'Até R$ 30.000' },
                { limite_inferior: 30001,  limite_superior: 60000,  aliquota: 0.0016, descricao: 'R$ 30.000,01 a R$ 60.000' },
                { limite_inferior: 60001,  limite_superior: Infinity, aliquota: 0.0020, descricao: 'Acima de R$ 60.000,01' },
            ],
        },

        nao_residencial: {
            faixas: [
                { limite_inferior: 0,      limite_superior: 30000,  aliquota: 0.0020, descricao: 'Até R$ 30.000' },
                { limite_inferior: 30001,  limite_superior: 60000,  aliquota: 0.0025, descricao: 'R$ 30.000,01 a R$ 60.000' },
                { limite_inferior: 60001,  limite_superior: Infinity, aliquota: 0.0030, descricao: 'Acima de R$ 60.000,01' },
            ],
        },

        terreno_nao_edificado: {
            dados_disponiveis: false,
            obs: 'Alíquota para terreno não edificado não detalhada na pesquisa',
        },

        base_calculo: 'Planta Genérica de Valores (PGV) — atualização anual',

        isencoes: [
            { categoria: 'Imóveis de Interesse Público', condicao: 'Isentos', base_legal: 'Lei nº 4.476/1997' },
            { categoria: 'Imóveis Tombados', condicao: 'Desconto 50% a 100%', base_legal: 'Lei nº 4.476/1997' },
            { categoria: 'Pessoas com Doenças Graves', condicao: 'Isentos', base_legal: 'Lei nº 9.590/2019' },
            { categoria: 'Idosos/Aposentados por Invalidez', condicao: 'Desconto especial', base_legal: 'Legislação municipal' },
        ],

        descontos: {
            cota_unica: {
                percentual: 0.10,  // até 10%
                obs: 'Conforme calendário municipal',
            },
            parcelamento: {
                parcelas_maximas: 12,
                desconto: 0,
            },
        },

        legislacao: [
            { norma: 'Lei nº 4.476/1997', assunto: 'Lei do IPTU de Vitória' },
            { norma: 'Lei nº 4.557/1997', assunto: 'Alterações IPTU' },
            { norma: 'Lei nº 9.590/2019', assunto: 'Isenção doenças graves' },
            { norma: 'Decreto nº 25.380/2025', assunto: 'Procedimentos de redução' },
        ],
    },


    // ═══════════════════════════════════════════════════════════════
    //  7. ITBI — IMPOSTO SOBRE TRANSMISSÃO DE BENS IMÓVEIS (Vitória)
    // ═══════════════════════════════════════════════════════════════

    itbi: {
        municipio_referencia: 'Vitória',
        dados_disponiveis: false,
        obs: 'Não detalhado na pesquisa — verificar legislação municipal de Vitória',
    },


    // ═══════════════════════════════════════════════════════════════
    //  8. TAXAS ESTADUAIS E MUNICIPAIS
    // ═══════════════════════════════════════════════════════════════

    taxas: {
        dados_disponiveis: false,
        obs: 'Taxas de lixo, alvará, COSIP etc. não detalhadas na pesquisa',
    },


    // ═══════════════════════════════════════════════════════════════
    //  9. IMPOSTOS FEDERAIS (aplicáveis no ES)
    // ═══════════════════════════════════════════════════════════════

    federal: {

        irpj: {
            lucro_real: {
                aliquota_base: 0.15,
                adicional: 0.10,
                limite_adicional_mensal: 20000,
                limite_adicional_anual: 240000,
                aliquota_efetiva_maxima: 0.25,
            },
            lucro_presumido: {
                presuncao: {
                    comercio_industria: 0.08,
                    servicos: 0.32,
                    transporte: 0.08,
                },
                aliquota_irpj: 0.15,
                aliquota_efetiva: {
                    comercio_industria: 0.012,
                    servicos: 0.048,
                    transporte: 0.012,
                },
            },
        },

        csll: {
            aliquota_geral: 0.09,
            aliquota_financeiras: 0.15,
            lucro_presumido_presuncao: {
                comercio_industria: 0.12,
                servicos: 0.32,
            },
        },

        pis: {
            cumulativo: 0.0076,
            nao_cumulativo: 0.0165,
        },

        cofins: {
            cumulativo: 0.03,
            nao_cumulativo: 0.076,
        },

        ipi: {
            dados_disponiveis: false,
            obs: 'ES não possui benefícios ZFM/ALC — IPI segue tabela federal padrão (TIPI)',
        },

        iof: {
            dados_disponiveis: false,
            obs: 'IOF segue regras federais — não há especificidade estadual',
        },

        ii: {
            dados_disponiveis: false,
            obs: 'Imposto de Importação segue TEC federal',
        },

        ie: {
            dados_disponiveis: false,
            obs: 'Imposto de Exportação segue regras federais',
        },

        itr: {
            dados_disponiveis: false,
            obs: 'ITR segue regras federais',
        },

        inss: {
            patronal: {
                aliquota_geral_min: 0.20,
                aliquota_geral_max: 0.288,
                rat_sat_min: 0.005,
                rat_sat_max: 0.03,
            },
            empregado: {
                aliquota_min: 0.08,
                aliquota_max: 0.11,
            },
        },

        fgts: {
            aliquota_mensal: 0.08,
            multa_rescisoria: 0.40,
        },

        irpf: {
            tabela_mensal_2025: [
                { faixa: 'Até R$ 2.112,00', aliquota: 0, deducao: 0 },
                { faixa: 'R$ 2.112,01 a R$ 2.826,65', aliquota: 0.075, deducao: 158.40 },
                { faixa: 'R$ 2.826,66 a R$ 3.751,05', aliquota: 0.15, deducao: 423.15 },
                { faixa: 'R$ 3.751,06 a R$ 4.664,68', aliquota: 0.225, deducao: 844.80 },
                { faixa: 'Acima de R$ 4.664,68', aliquota: 0.275, deducao: 1278.64 },
            ],
        },
    },


    // ═══════════════════════════════════════════════════════════════
    //  10. SIMPLES NACIONAL
    // ═══════════════════════════════════════════════════════════════

    simples_nacional: {
        sublimite_estadual: 3600000,
        mei_limite: 81000,
        microempresa_limite: 360000,
        epp_limite: 4800000,

        anexos: {
            anexo_I: {
                nome: 'Comércio',
                faixas: [
                    { faixa: 1, limite_inferior: 0,      limite_superior: 180000,  aliquota: 0.04,   deducao: 0 },
                    { faixa: 2, limite_inferior: 180001,  limite_superior: 360000,  aliquota: 0.073,  deducao: 5940 },
                    { faixa: 3, limite_inferior: 360001,  limite_superior: 720000,  aliquota: 0.095,  deducao: 13860 },
                    { faixa: 4, limite_inferior: 720001,  limite_superior: 1800000, aliquota: 0.107,  deducao: 22500 },
                    { faixa: 5, limite_inferior: 1800001, limite_superior: 3600000, aliquota: 0.143,  deducao: 87300 },
                    { faixa: 6, limite_inferior: 3600001, limite_superior: 4800000, aliquota: 0.19,   deducao: 378000 },
                ],
            },
            anexo_II: {
                nome: 'Indústria',
                faixas: [
                    { faixa: 1, limite_inferior: 0,      limite_superior: 180000,  aliquota: 0.045,  deducao: 0 },
                    { faixa: 2, limite_inferior: 180001,  limite_superior: 360000,  aliquota: 0.078,  deducao: 5940 },
                    { faixa: 3, limite_inferior: 360001,  limite_superior: 720000,  aliquota: 0.10,   deducao: 13860 },
                    { faixa: 4, limite_inferior: 720001,  limite_superior: 1800000, aliquota: 0.112,  deducao: 22500 },
                    { faixa: 5, limite_inferior: 1800001, limite_superior: 3600000, aliquota: 0.147,  deducao: 85500 },
                    { faixa: 6, limite_inferior: 3600001, limite_superior: 4800000, aliquota: 0.30,   deducao: 720000 },
                ],
            },
            anexo_III: {
                nome: 'Serviços (receitas de locação de bens móveis, agências de viagem, etc.)',
                faixas: [
                    { faixa: 1, limite_inferior: 0,      limite_superior: 180000,  aliquota: 0.06,   deducao: 0 },
                    { faixa: 2, limite_inferior: 180001,  limite_superior: 360000,  aliquota: 0.112,  deducao: 9360 },
                    { faixa: 3, limite_inferior: 360001,  limite_superior: 720000,  aliquota: 0.135,  deducao: 17640 },
                    { faixa: 4, limite_inferior: 720001,  limite_superior: 1800000, aliquota: 0.16,   deducao: 35640 },
                    { faixa: 5, limite_inferior: 1800001, limite_superior: 3600000, aliquota: 0.21,   deducao: 125640 },
                    { faixa: 6, limite_inferior: 3600001, limite_superior: 4800000, aliquota: 0.33,   deducao: 648000 },
                ],
            },
            anexo_IV: {
                nome: 'Serviços (construção civil, vigilância, limpeza, advocacia, etc.)',
                faixas: [
                    { faixa: 1, limite_inferior: 0,      limite_superior: 180000,  aliquota: 0.045,  deducao: 0 },
                    { faixa: 2, limite_inferior: 180001,  limite_superior: 360000,  aliquota: 0.09,   deducao: 8100 },
                    { faixa: 3, limite_inferior: 360001,  limite_superior: 720000,  aliquota: 0.102,  deducao: 12420 },
                    { faixa: 4, limite_inferior: 720001,  limite_superior: 1800000, aliquota: 0.14,   deducao: 39780 },
                    { faixa: 5, limite_inferior: 1800001, limite_superior: 3600000, aliquota: 0.22,   deducao: 183780 },
                    { faixa: 6, limite_inferior: 3600001, limite_superior: 4800000, aliquota: 0.33,   deducao: 828000 },
                ],
            },
            anexo_V: {
                nome: 'Serviços (TI, engenharia, auditoria, consultoria, etc.)',
                faixas: [
                    { faixa: 1, limite_inferior: 0,      limite_superior: 180000,  aliquota: 0.155,  deducao: 0 },
                    { faixa: 2, limite_inferior: 180001,  limite_superior: 360000,  aliquota: 0.18,   deducao: 4500 },
                    { faixa: 3, limite_inferior: 360001,  limite_superior: 720000,  aliquota: 0.195,  deducao: 9900 },
                    { faixa: 4, limite_inferior: 720001,  limite_superior: 1800000, aliquota: 0.205,  deducao: 17100 },
                    { faixa: 5, limite_inferior: 1800001, limite_superior: 3600000, aliquota: 0.23,   deducao: 62100 },
                    { faixa: 6, limite_inferior: 3600001, limite_superior: 4800000, aliquota: 0.305,  deducao: 540000 },
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
            obs: 'Espírito Santo NÃO está na área de abrangência da SUDAM',
        },
        sudene: {
            ativo: false,
            obs: 'Espírito Santo NÃO está na área de abrangência da SUDENE',
        },
        zona_franca: {
            ativo: false,
            obs: 'Espírito Santo não possui Zona Franca',
        },
        alc: {
            ativo: false,
            obs: 'Espírito Santo não possui Área de Livre Comércio',
        },
        programas_estaduais: {
            invest_es: {
                descricao: 'Programas de incentivo fiscal estadual',
                dados_disponiveis: false,
                obs: 'Programas estaduais de incentivo não detalhados na pesquisa — verificar SEFAZ/ES',
            },
            reducao_iss_75: {
                descricao: 'Redução de 75% na alíquota ISS para profissionais específicos',
                percentual_reducao: 0.75,
                base_legal: 'Decreto nº 25.380/2025',
            },
            gas_natural_industria: {
                descricao: 'ICMS reduzido para gás natural na indústria',
                aliquota_reduzida: 0.12,
                vigencia: '2025',
                base_legal: 'Lei nº 11.997/2023',
            },
            biogas_biometano: {
                descricao: 'ICMS reduzido para biogás/biometano',
                aliquota_reduzida: 0.12,
                vigencia: 'Desde 2024',
            },
        },

        // Nota: ES recebe alíquota interestadual de 12% (mesmo tratamento que N/NE/CO)
        nota_interestadual: {
            descricao: 'ES é o único estado do Sudeste que recebe alíquota interestadual de 12% (como N/NE/CO)',
            obs: 'Benefício constitucional — demais estados do Sul/Sudeste recebem 7%',
        },
    },


    // ═══════════════════════════════════════════════════════════════
    //  12. REFORMA TRIBUTÁRIA
    // ═══════════════════════════════════════════════════════════════

    reforma_tributaria: {
        ibs: {
            descricao: 'Imposto sobre Bens e Serviços — substituirá ICMS + ISS',
            status: 'Em implementação (transição 2026-2033)',
        },
        cbs: {
            descricao: 'Contribuição sobre Bens e Serviços — substituirá PIS + COFINS',
            status: 'Em implementação',
        },
        is: {
            descricao: 'Imposto Seletivo — sobre bens/serviços prejudiciais à saúde/meio ambiente',
            status: 'Em regulamentação',
        },
        impacto_es: {
            obs: 'ES se beneficia da alíquota interestadual de 12% — impacto da reforma nesta vantagem a ser avaliado',
            dados_disponiveis: false,
        },
    },


    // ═══════════════════════════════════════════════════════════════
    //  13. DADOS DE COBERTURA
    // ═══════════════════════════════════════════════════════════════

    cobertura: {
        versao: "3.0",
        data_atualizacao: "2026-02-10",
        localizados: [
            'ICMS — alíquota padrão (17%), interestaduais, importação',
            'ICMS — benefícios gás natural (12%), biogás (12%), álcool carburante (27%)',
            'IPVA — alíquotas por tipo de veículo (1% e 2%)',
            'IPVA — isenções (fabricados até 2010, PCD, táxis, etc.)',
            'IPVA — descontos (cota única até 10%, parcelamento 6x)',
            'ISS — alíquotas completas por tipo de serviço (Vitória)',
            'ISS — redução de 75% para profissionais específicos',
            'IPTU — faixas detalhadas por valor venal residencial e não residencial (Vitória)',
            'IPTU — isenções (interesse público, tombados, doenças graves)',
            'IRPJ — Lucro Real e Presumido',
            'CSLL — alíquotas',
            'PIS/COFINS — cumulativo e não cumulativo',
            'INSS/FGTS — alíquotas',
            'IRPF — tabela mensal 2025',
            'Simples Nacional — limites e Anexos I a V',
            'Incentivos — redução ISS, ICMS gás/biogás',
            'Nota interestadual 12% (benefício constitucional ES)',
            'Legislação — normas base citadas',
        ],
        nao_localizados: [
            'ICMS — alíquotas diferenciadas (cesta básica, energia elétrica, telecom, medicamentos)',
            'ICMS — Substituição Tributária (produtos e MVAs)',
            'ICMS — FECOP (ES pode ter fundo adicional não detalhado)',
            'ITCMD — alíquotas e faixas progressivas',
            'ITBI — alíquota geral (Vitória)',
            'IPTU — terreno não edificado (Vitória)',
            'Taxas estaduais e municipais (lixo, alvará, COSIP)',
            'IPI — tabela específica',
            'IOF — detalhamento',
            'ITR — detalhamento',
            'INVEST-ES e outros programas estaduais de incentivo',
            'Reforma Tributária — impacto específico no ES',
        ],
        contatos_para_completar: [
            { orgao: 'SEFAZ/ES', url: 'https://sefaz.es.gov.br/' },
            { orgao: 'SEMFA Vitória', url: 'https://www.vitoria.es.gov.br/prefeitura/' },
            { orgao: 'DETRAN/ES', url: 'https://detran.es.gov.br/' },
            { orgao: 'Receita Federal', url: 'https://www.gov.br/receitafederal/' },
        ],
    },
};


// ═══════════════════════════════════════════════════════════════════════════
//  14. FUNÇÕES UTILITÁRIAS — ESPÍRITO SANTO
// ═══════════════════════════════════════════════════════════════════════════

/** Retorna alíquota ISS por tipo de serviço (Vitória) */
function getISSEspiritoSanto(tipo) {
    const servico = ESPIRITO_SANTO_TRIBUTARIO.iss.por_tipo_servico[tipo];
    return servico ? servico.aliquota : null;
}

/** Retorna alíquota IPTU residencial por valor venal (Vitória) */
function getIPTUResidencialEspiritoSanto(valorVenal) {
    const faixas = ESPIRITO_SANTO_TRIBUTARIO.iptu.residencial.faixas;
    for (const faixa of faixas) {
        if (valorVenal >= faixa.limite_inferior && valorVenal <= faixa.limite_superior) {
            return faixa.aliquota;
        }
    }
    return null;
}

/** Retorna alíquota IPTU comercial (não residencial) por valor venal (Vitória) */
function getIPTUComercialEspiritoSanto(valorVenal) {
    const faixas = ESPIRITO_SANTO_TRIBUTARIO.iptu.nao_residencial.faixas;
    for (const faixa of faixas) {
        if (valorVenal >= faixa.limite_inferior && valorVenal <= faixa.limite_superior) {
            return faixa.aliquota;
        }
    }
    return null;
}

/** Retorna alíquota IPVA por tipo de veículo */
function getIPVAEspiritoSanto(tipo) {
    const aliquota = ESPIRITO_SANTO_TRIBUTARIO.ipva.aliquotas[tipo];
    return aliquota !== undefined ? aliquota : null;
}

/** Verifica se município é Zona Franca (ES: sempre false) */
function isZonaFrancaEspiritoSanto(municipio) {
    return false;
}

/** Verifica se município é ALC (ES: sempre false) */
function isALCEspiritoSanto(municipio) {
    return false;
}

/** Retorna percentual de redução SUDAM no IRPJ (ES: sempre 0) */
function getReducaoSUDAMEspiritoSanto() {
    return 0;
}

/** ICMS efetivo (padrão + FECOP) */
function getICMSEfetivoEspiritoSanto() {
    return ESPIRITO_SANTO_TRIBUTARIO.icms.aliquota_padrao + (ESPIRITO_SANTO_TRIBUTARIO.icms.fecop.aliquota || 0);
}

/** Calcula alíquota efetiva do Simples Nacional */
function calcularSimplesNacionalEspiritoSanto(rbt12, anexo) {
    const tabela = ESPIRITO_SANTO_TRIBUTARIO.simples_nacional.anexos[anexo];
    if (!tabela) return null;

    let faixaSelecionada = null;
    for (const faixa of tabela.faixas) {
        if (rbt12 >= faixa.limite_inferior && rbt12 <= faixa.limite_superior) {
            faixaSelecionada = faixa;
            break;
        }
    }

    if (!faixaSelecionada) return null;

    const aliquotaEfetiva = ((rbt12 * faixaSelecionada.aliquota) - faixaSelecionada.deducao) / rbt12;

    return {
        aliquota_nominal: faixaSelecionada.aliquota,
        deducao: faixaSelecionada.deducao,
        aliquota_efetiva: Math.round(aliquotaEfetiva * 10000) / 10000,
        faixa: faixaSelecionada.faixa,
    };
}

/** Calcula IPVA com desconto de cota única */
function calcularIPVAEspiritoSanto(valorFipe, tipo, cotaUnica) {
    const aliquota = getIPVAEspiritoSanto(tipo);
    if (aliquota === null) return null;

    const ipvaBruto = valorFipe * aliquota;
    const desconto = cotaUnica ? ESPIRITO_SANTO_TRIBUTARIO.ipva.descontos.cota_unica.percentual : 0;
    const ipvaFinal = ipvaBruto * (1 - desconto);

    return {
        valor_fipe: valorFipe,
        tipo: tipo,
        aliquota: aliquota,
        ipva_bruto: Math.round(ipvaBruto * 100) / 100,
        desconto_cota_unica: desconto,
        ipva_final: Math.round(ipvaFinal * 100) / 100,
        isento: aliquota === 0,
    };
}

/** Calcula IPTU por valor venal e tipo */
function calcularIPTUEspiritoSanto(valorVenal, tipo) {
    const aliquota = tipo === 'residencial'
        ? getIPTUResidencialEspiritoSanto(valorVenal)
        : getIPTUComercialEspiritoSanto(valorVenal);
    if (aliquota === null) return null;

    const iptu = valorVenal * aliquota;
    return {
        valor_venal: valorVenal,
        tipo: tipo,
        aliquota: aliquota,
        iptu_anual: Math.round(iptu * 100) / 100,
    };
}

/** Resumo rápido dos tributos do Espírito Santo */
function resumoTributarioEspiritoSanto() {
    return {
        estado: ESPIRITO_SANTO_TRIBUTARIO.dados_gerais.nome,
        sigla: ESPIRITO_SANTO_TRIBUTARIO.dados_gerais.sigla,
        regiao: ESPIRITO_SANTO_TRIBUTARIO.dados_gerais.regiao,
        icms_padrao: ESPIRITO_SANTO_TRIBUTARIO.icms.aliquota_padrao,
        icms_efetivo: getICMSEfetivoEspiritoSanto(),
        fecop: ESPIRITO_SANTO_TRIBUTARIO.icms.fecop.aliquota,
        iss_min: ESPIRITO_SANTO_TRIBUTARIO.iss.aliquota_minima,
        iss_max: ESPIRITO_SANTO_TRIBUTARIO.iss.aliquota_maxima,
        ipva_auto: ESPIRITO_SANTO_TRIBUTARIO.ipva.aliquotas.automovel,
        ipva_moto: ESPIRITO_SANTO_TRIBUTARIO.ipva.aliquotas.motocicleta,
        sudam: ESPIRITO_SANTO_TRIBUTARIO.incentivos.sudam.ativo,
        sudene: ESPIRITO_SANTO_TRIBUTARIO.incentivos.sudene.ativo,
        zona_franca: ESPIRITO_SANTO_TRIBUTARIO.incentivos.zona_franca.ativo,
        sublimite_simples: ESPIRITO_SANTO_TRIBUTARIO.simples_nacional.sublimite_estadual,
        interestadual_12: true,  // ES recebe 12% como N/NE/CO
    };
}


// ═══════════════════════════════════════════════════════════════════════════
//  15. EXPORTAÇÃO (Padrão Grupo 2)
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        ...ESPIRITO_SANTO_TRIBUTARIO,
        utils: {
            getISS: getISSEspiritoSanto,
            getIPTUResidencial: getIPTUResidencialEspiritoSanto,
            getIPTUComercial: getIPTUComercialEspiritoSanto,
            getIPVA: getIPVAEspiritoSanto,
            isZonaFranca: isZonaFrancaEspiritoSanto,
            isALC: isALCEspiritoSanto,
            getReducaoSUDAM: getReducaoSUDAMEspiritoSanto,
            getICMSEfetivo: getICMSEfetivoEspiritoSanto,
            calcularSimplesNacional: calcularSimplesNacionalEspiritoSanto,
            calcularIPVA: calcularIPVAEspiritoSanto,
            calcularIPTU: calcularIPTUEspiritoSanto,
            resumoTributario: resumoTributarioEspiritoSanto,
        },
    };
}

if (typeof window !== "undefined") {
    window.ESPIRITO_SANTO_TRIBUTARIO = ESPIRITO_SANTO_TRIBUTARIO;
    window.EspiritoSantoTributario = {
        getISS: getISSEspiritoSanto,
        getIPTUResidencial: getIPTUResidencialEspiritoSanto,
        getIPTUComercial: getIPTUComercialEspiritoSanto,
        getIPVA: getIPVAEspiritoSanto,
        isZonaFranca: isZonaFrancaEspiritoSanto,
        isALC: isALCEspiritoSanto,
        getReducaoSUDAM: getReducaoSUDAMEspiritoSanto,
        getICMSEfetivo: getICMSEfetivoEspiritoSanto,
        calcularSimplesNacional: calcularSimplesNacionalEspiritoSanto,
        calcularIPVA: calcularIPVAEspiritoSanto,
        calcularIPTU: calcularIPTUEspiritoSanto,
        resumo: resumoTributarioEspiritoSanto,
    };
}
