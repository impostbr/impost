/**
 * ================================================================
 * IMPOST. — Sistema de Análise Tributária do Brasil
 * Arquivo: sergipe.js
 * Estado: Sergipe (SE)
 * Região: Nordeste
 * Capital: Aracaju
 * ================================================================
 * Versão: 3.0 — Padronizado conforme modelo roraima.js
 * Data de criação: Fevereiro/2026
 * Fontes: SEFAZ-SE, Receita Federal, Prefeitura de Aracaju,
 *         Lei nº 1.547/1989, Lei nº 7.655/2013, Lei nº 7.724/2013,
 *         Lei nº 9.167/2023, pesquisa complementar web
 * ================================================================
 * ESTRUTURA:
 *  1. Dados Gerais
 *  2. ICMS
 *  3. IPVA
 *  4. ITCMD
 *  5. ISS (Aracaju)
 *  6. IPTU (Aracaju)
 *  7. ITBI (Aracaju)
 *  8. Taxas Estaduais e Municipais
 *  9. Impostos Federais
 * 10. Simples Nacional
 * 11. Incentivos Fiscais e Benefícios Regionais
 * 12. Reforma Tributária
 * 13. Dados de Cobertura (controle de qualidade)
 * 14. Funções Utilitárias
 * 15. Exportação
 * ================================================================
 */

const SERGIPE_TRIBUTARIO = {

  // ============================================================
  // 1. DADOS GERAIS DO ESTADO
  // ============================================================
  dados_gerais: {
    nome: "Sergipe",
    sigla: "SE",
    regiao: "Nordeste",
    capital: "Aracaju",
    codigo_ibge: "28",
    gentilico: "Sergipano(a)",
    zona_franca: {
      existe: false,
      observacao: "Não há Zona Franca em Sergipe"
    },
    alc: {
      existe: false,
      observacao: "Não há Área de Livre Comércio em Sergipe"
    },
    sudam: {
      abrangencia: false,
      observacao: "Sergipe não está na área de abrangência da SUDAM"
    },
    sudene: {
      abrangencia: true,
      beneficios: "Redução de IRPJ até 75% para projetos aprovados",
      observacao: "Benefícios em transição — LC 224/2025 prevê extinção formal em 26/12/2025",
      base_legal: "Lei nº 9.126/1995"
    },
    suframa: {
      abrangencia: false,
      observacao: "Sergipe não está na área de abrangência da SUFRAMA"
    },
    sefaz: {
      url: "https://www.sefaz.se.gov.br",
      telefone: null,
      email: null
    },
    prefeitura_capital: {
      url: "https://www.aracaju.se.gov.br",
      fazenda: "https://fazenda.aracaju.se.gov.br/"
    },
    legislacao_base: {
      icms: "Lei nº 4.257/1989 (base); Lei nº 9.167/2023 (19%)",
      ipva: "Lei nº 7.655/2013",
      itcmd: "Lei nº 7.724/2013; Lei nº 9.774/2025 (Refis)",
      codigo_tributario_aracaju: "Lei nº 1.547/1989"
    },
    observacoes: [
      "ICMS 19% — uma das menores alíquotas do Nordeste/Brasil",
      "IPVA progressivo por valor de veículo (2,5% até 120k / 3% acima)",
      "ITCMD fixo: 5% causa mortis, 3% doação (deve migrar para progressivo)",
      "IPTU Aracaju progressivo para residenciais (0,5% a 0,8%)",
      "IPTU 2026 congelado pelo 2º ano consecutivo",
      "SUDENE ativa mas em transição",
      "ICMS-Social — programa de responsabilidade social/ambiental"
    ]
  },

  // ============================================================
  // 2. ICMS (Imposto sobre Circulação de Mercadorias e Serviços)
  // ============================================================
  icms: {
    aliquota_padrao: 0.19,
    aliquota_padrao_percentual: "19%",
    aliquota_padrao_vigencia: "Vigente",
    aliquota_padrao_base_legal: "Lei nº 9.167/2023",

    historico: [
      { aliquota: 0.19, percentual: "19%", vigencia: "Vigente (uma das menores do Brasil)" }
    ],

    funcep: {
      existe: false,
      observacao: "Fundo de combate à pobreza não identificado separadamente"
    },

    aliquota_efetiva_padrao: 0.19,
    aliquota_efetiva_padrao_percentual: "19%",

    aliquotas_diferenciadas: {
      comunicacao: {
        aliquota: 0.25,
        percentual: "25%",
        descricao: "Comunicação — telefonia, internet"
      },
      combustiveis: {
        aliquota: 0.25,
        percentual: "25%",
        descricao: "Combustíveis e lubrificantes (possibilidade de ST)"
      },
      energia_eletrica: {
        dados_disponiveis: true,
        observacao: "Variável conforme consumo — reduzida para consumo residencial básico"
      },
      cesta_basica: {
        dados_disponiveis: true,
        observacao: "Reduzida conforme legislação específica"
      },
      medicamentos: { dados_disponiveis: false, obs: "Verificar SEFAZ/SE" }
    },

    icms_social: {
      nome: "ICMS-Social",
      base_legal: "Lei nº 8.628/2019",
      descricao: "Redução de carga tributária de ICMS para empresas que cumprem critérios de responsabilidade social e ambiental"
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
        aliquota: 0.19,
        percentual: "19%",
        descricao: "Operações com não contribuintes (EC 87/2015) — alíquota interna"
      }
    },

    difal: {
      descricao: "Diferencial de alíquotas na entrada de mercadorias de outros estados",
      calculo: "19% - alíquota interestadual de origem"
    },

    icms_importacao: {
      aliquota: 0.04,
      percentual: "4%",
      descricao: "Mercadorias importadas (Resolução SF nº 13/2012)"
    },

    substituicao_tributaria: {
      dados_disponiveis: false,
      obs: "Lista de produtos e MVA não incluída — verificar SEFAZ/SE"
    }
  },

  // ============================================================
  // 3. IPVA (Imposto sobre Propriedade de Veículos Automotores)
  // ============================================================
  ipva: {
    base_legal: "Lei nº 7.655/2013; Portaria SEFAZ nº 341/2025",
    base_calculo: "Valor venal conforme tabela FIPE",

    aliquotas: {
      automovel_ate_120k: {
        aliquota: 0.025,
        percentual: "2,5%",
        descricao: "Automóveis, camionetas e utilitários com valor até R$ 120.000"
      },
      automovel_acima_120k: {
        aliquota: 0.03,
        percentual: "3%",
        descricao: "Automóveis, camionetas e utilitários com valor acima de R$ 120.000"
      },
      motocicleta: {
        aliquota: 0.02,
        percentual: "2%",
        descricao: "Motocicletas e similares"
      },
      onibus_caminhao: {
        aliquota: 0.01,
        percentual: "1%",
        descricao: "Ônibus, micro-ônibus, caminhões e cavalo mecânico"
      },
      aeronave: {
        aliquota: 0.015,
        percentual: "1,5%",
        descricao: "Aeronaves"
      },
      embarcacao_recreativa: {
        aliquota: 0.035,
        percentual: "3,5%",
        descricao: "Embarcações recreativas ou esportivas, inclusive Jet Ski",
        base_legal: "Art. 9º, V, Lei 7.655/2013 (redação Lei 8.045/2015)"
      },
      outros_veiculos: {
        aliquota: 0.025,
        percentual: "2,5%",
        descricao: "Qualquer outro veículo automotor não enquadrado nos incisos anteriores",
        base_legal: "Art. 9º, VII, Lei 7.655/2013"
      }
    },

    isencoes: [
      {
        tipo: "Veículos com 15+ anos de fabricação",
        descricao: "Isenção automática para veículos com 15 ou mais anos de fabricação",
        vigencia: "Em 2026: fabricados até 2011"
      },
      {
        tipo: "Corpo diplomático",
        descricao: "Veículos de Corpo Diplomático acreditado junto ao Governo Brasileiro",
        base_legal: "Art. 6º, I"
      },
      {
        tipo: "Máquinas agrícolas",
        descricao: "Máquinas utilizadas exclusivamente na atividade agrícola",
        base_legal: "Art. 6º, II"
      },
      {
        tipo: "Máquinas construção civil/industrial",
        descricao: "Terraplanagem, empilhadeira, guindaste e demais máquinas de construção civil ou industrial",
        base_legal: "Art. 6º, III"
      },
      {
        tipo: "Táxis",
        descricao: "Veículo utilizado como táxi, de motorista profissional autônomo ou cooperativado (limite 1 veículo)",
        base_legal: "Art. 6º, IV"
      },
      {
        tipo: "Veículos até 50cc",
        descricao: "Veículo de duas rodas com potência de até 50 cilindradas (limite 1 por beneficiário)",
        base_legal: "Art. 6º, V (redação Lei 8.045/2015)"
      },
      {
        tipo: "Pessoas com deficiência",
        descricao: "PCD, deficiência visual, mental severa ou profunda, autismo",
        base_legal: "Art. 6º, VI"
      },
      {
        tipo: "Transporte escolar",
        descricao: "Veículos empregados exclusivamente no transporte escolar",
        base_legal: "Art. 6º, XI (acrescido por lei posterior)"
      },
      {
        tipo: "Transporte coletivo",
        descricao: "Concessionárias de transporte coletivo de passageiros",
        base_legal: "Art. 6º"
      }
    ],

    descontos_antecipacao: {
      cota_unica: {
        desconto: 0.10,
        percentual: "10%",
        prazo: "Até 31/03/2026",
        base_legal: "Portaria SEFAZ nº 341/2025"
      },
      parcelamento_boleto: {
        descricao: "Sem opção direta de parcelamento em boleto pela SEFAZ",
        observacao: "Parcelamento disponível em até 10-12x via cartão de crédito com juros da operadora"
      }
    },

    calendario_pagamento: {
      observacao: "Escalonado por final de placa — divulgado pela SEFAZ-SE anualmente",
      vigencia: "Janeiro a novembro/2026"
    }
  },

  // ============================================================
  // 4. ITCMD (Imposto sobre Transmissão Causa Mortis e Doação)
  // ============================================================
  itcmd: {
    base_legal: "Lei nº 7.724/2013; Lei nº 9.774/2025",

    aliquotas: {
      causa_mortis: {
        tipo: "fixa",
        aliquota: 0.05,
        percentual: "5%",
        descricao: "Transmissão por herança — alíquota fixa",
        observacao: "Até 26/12/2025 havia regime de transição com alíquota reduzida de 3% (Lei nº 9.774/2025)"
      },
      doacao: {
        tipo: "fixa",
        aliquota: 0.03,
        percentual: "3%",
        descricao: "Transmissão por doação — alíquota fixa",
        observacao: "Até 26/12/2025 havia regime de transição com alíquota reduzida de 1% (Lei nº 9.774/2025)"
      }
    },

    progressividade: {
      implementada: false,
      observacao: "LC 227/2026 torna progressividade do ITCMD obrigatória. Sergipe precisará ajustar sua legislação (atualmente fixas: 5% e 3%)."
    },

    base_calculo: "Valor venal do bem ou direito transmitido",

    refis_itcmd: {
      nome: "Refis ITCMD",
      base_legal: "Lei nº 9.774/2025",
      descricao: "Programa de regularização de débitos de ITCMD — parcelamento em até 60 meses",
      prazo_adesao: "Encerrado em 26/12/2025"
    }
  },

  // ============================================================
  // 5. ISS — Aracaju (capital como referência)
  // ============================================================
  iss: {
    municipio_referencia: "Aracaju",
    base_legal: "Lei nº 1.547/1989 (Código Tributário Municipal)",
    aliquota_geral: 0.05,
    aliquota_geral_percentual: "5%",
    aliquota_minima: 0.02,
    aliquota_maxima: 0.05,
    aliquota_minima_percentual: "2%",
    aliquota_maxima_percentual: "5%",
    observacao: "Alíquotas específicas variam conforme tipo de serviço — anexo da lei",

    por_tipo_servico: {
      geral: {
        aliquota: 0.05,
        percentual: "5%",
        descricao: "Alíquota geral para serviços não especificados"
      }
    },

    detalhamento: {
      dados_disponiveis: false,
      obs: "Tabela detalhada por tipo de serviço (CTISS) não localizada — verificar Prefeitura de Aracaju"
    },

    iss_fixo: {
      dados_disponiveis: false,
      obs: "ISS fixo para autônomos não detalhado — verificar Prefeitura"
    }
  },

  // ============================================================
  // 6. IPTU — Aracaju (capital como referência)
  // ============================================================
  iptu: {
    municipio_referencia: "Aracaju",
    base_legal: "Lei nº 1.547/1989; Decreto nº 8.429/2025",
    base_calculo: "Valor venal do imóvel (valor de mercado aferido pela Prefeitura)",
    portal: "http://financas.aracaju.se.gov.br/",
    congelamento_2026: "IPTU 2026 congelado pelo 2º ano consecutivo (Decreto nº 8.429)",

    residencial: {
      descricao: "Imóvel edificado para fins residenciais — alíquotas progressivas",
      faixas: [
        { faixa: 1, de: 0, ate: 80000, aliquota: 0.005, percentual: "0,50%" },
        { faixa: 2, de: 80000.01, ate: 150000, aliquota: 0.0065, percentual: "0,65%" },
        { faixa: 3, de: 150000.01, ate: 250000, aliquota: 0.007, percentual: "0,70%" },
        { faixa: 4, de: 250000.01, ate: 400000, aliquota: 0.0075, percentual: "0,75%" },
        { faixa: 5, de: 400000.01, ate: Infinity, aliquota: 0.008, percentual: "0,80%" }
      ]
    },

    comercial: {
      descricao: "Imóvel edificado para fins comerciais",
      aliquota_unica: 0.016,
      percentual: "1,6%",
      observacao: "Alíquota fixa para todos os imóveis comerciais"
    },

    terreno: {
      descricao: "Imóvel não edificado (terreno)",
      com_muro: {
        aliquota: 0.04,
        percentual: "4%",
        observacao: "Terreno com muro ou cerca (reduzido para 3% em legislação recente)"
      },
      sem_muro: {
        aliquota: 0.06,
        percentual: "6%",
        observacao: "Terreno sem muro — alíquota maior para incentivar fechamento do terreno"
      },
      bairros_vulneraveis: {
        observacao: "Alíquotas reduzidas em bairros vulneráveis (Santa Maria, 17 de Março, Porto Dantas, etc.)"
      }
    },

    isencoes: [
      {
        tipo: "Renda até 2 salários mínimos",
        descricao: "Contribuinte com renda bruta familiar mensal até 2 SM, imóvel residencial único até R$ 168.000",
        base_legal: "Lei nº 6.154/2025"
      },
      {
        tipo: "Imóvel até R$ 90.000 (automática)",
        descricao: "Imóvel residencial único até R$ 90.000 — isenção automática sem necessidade de comprovar renda",
        base_legal: "Lei nº 6.154/2025, §1º"
      },
      {
        tipo: "Servidores públicos municipais",
        descricao: "Imóvel residencial de servidor público efetivo municipal",
        base_legal: "Lei nº 6.154/2025"
      },
      {
        tipo: "Pessoas com doença grave",
        descricao: "Proprietários com câncer, AIDS",
        base_legal: "Art. 164, Lei nº 1.547/1989"
      }
    ],

    descontos: {
      cota_unica: {
        desconto: 0.10,
        percentual: "10%",
        condicao: "Sem débitos anteriores com a Prefeitura"
      },
      parcelamento: {
        parcelas_maximas: 10,
        parcela_minima: 300.00,
        desconto: 0,
        observacao: "Novidade IPTU 2026: até 10 parcelas (mín R$ 300)"
      }
    }
  },

  // ============================================================
  // 7. ITBI — Aracaju (capital como referência)
  // ============================================================
  itbi: {
    municipio_referencia: "Aracaju",
    base_legal: "Lei nº 1.547/1989",
    aliquota_geral: 0.02,
    aliquota_geral_percentual: "2%",
    base_calculo: "Valor venal do imóvel",
    observacao: "Alíquota única para todas as transmissões de bens imóveis"
  },

  // ============================================================
  // 8. TAXAS ESTADUAIS E MUNICIPAIS
  // ============================================================
  taxas: {
    estaduais: {
      tfusp: {
        nome: "Taxa de Fiscalização e Utilização de Serviços Públicos",
        descricao: "Cobrada por serviços como emissão de certidões, registros, etc.",
        valor: null
      },
      detran: {
        nome: "Taxas do DETRAN-SE",
        descricao: "Licenciamento, transferência, emissão de CNH, etc.",
        valor: null
      },
      tpei: {
        nome: "Taxa de Prevenção e Extinção de Incêndios (TPEI)",
        orgao: "Corpo de Bombeiros Militar de Sergipe",
        descricao: "Cobrada anualmente de proprietários de imóveis",
        valor: null
      }
    },
    municipais: {
      taxa_alvara: { dados_disponiveis: false, obs: "Verificar Prefeitura Aracaju" },
      cosip: { dados_disponiveis: false, obs: "Verificar Prefeitura Aracaju" },
      taxa_lixo: { dados_disponiveis: false, obs: "Verificar Prefeitura Aracaju" }
    }
  },

  // ============================================================
  // 9. IMPOSTOS FEDERAIS (aplicáveis no estado)
  // ============================================================
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
        base: "Presunção de lucro",
        presuncao: {
          comercio: 0.08,
          servicos: 0.32,
          industria: 0.08,
          transporte_carga: 0.08,
          transporte_passageiros: 0.16,
          servicos_saude: 0.08,
          revenda_combustiveis: 0.016
        },
        adicional: {
          aliquota: 0.10,
          percentual: "10%",
          limite_trimestral: 60000
        }
      },
      incentivos_sudene: {
        reducao: 0.75,
        percentual_reducao: "75%",
        aliquota_efetiva: 0.0375,
        aliquota_efetiva_percentual: "3,75%",
        condicoes: "Empresas com projetos aprovados pela SUDENE",
        observacao: "Benefício em fase de transição",
        base_legal: "Lei nº 9.126/1995"
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
      percentual: "9%"
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
      patronal: { aliquota: 0.20, percentual: "20%", base: "Folha de pagamento" },
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

    fgts: { aliquota: 0.08, percentual: "8%", base: "Remuneração mensal" }
  },

  // ============================================================
  // 10. SIMPLES NACIONAL
  // ============================================================
  simples_nacional: {
    sublimite_estadual: 3600000,
    sublimite_estadual_formatado: "R$ 3.600.000,00",
    sublimite_tipo: "Padrão",

    limite_simples: 4800000,
    limite_simples_formatado: "R$ 4.800.000,00",

    mei: {
      limite_anual: 81000,
      limite_formatado: "R$ 81.000,00",
      vigencia: "2026",
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

  // ============================================================
  // 11. INCENTIVOS FISCAIS E BENEFÍCIOS REGIONAIS
  // ============================================================
  incentivos: {
    sudam: { ativo: false, observacao: "Sergipe não está na abrangência da SUDAM" },

    sudene: {
      ativo: true,
      nome: "Superintendência do Desenvolvimento do Nordeste",
      abrangencia: "Todo o estado de Sergipe",
      status: "Ativa, mas com benefícios em transição — LC 224/2025",
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
        "Investimentos em instalação, diversificação, modernização"
      ],
      base_legal: "Lei nº 9.126/1995"
    },

    zona_franca: { ativo: false },
    alc: { ativo: false },

    programas_estaduais: {
      icms_social: {
        nome: "ICMS-Social",
        ativo: true,
        base_legal: "Lei nº 8.628/2019",
        descricao: "Redução de carga tributária de ICMS para empresas com responsabilidade social e ambiental"
      },
      imfc: {
        nome: "Incentivo à Modernização da Relação Fisco Contribuinte (IMFC)",
        ativo: true,
        base_legal: "Lei Complementar nº 440/2025",
        descricao: "Incentivo indenizatório e variável para empresas que modernizam relação com o fisco"
      },
      refis_icms: {
        nome: "Programas de Regularização de Débitos (Refis)",
        ativo: true,
        base_legal: "Lei nº 9.167/2023; Lei nº 9.774/2025",
        descricao: "Redução de até 95% de multas e juros para débitos de ICMS e ITCMD"
      }
    }
  },

  // ============================================================
  // 12. REFORMA TRIBUTÁRIA
  // ============================================================
  reforma_tributaria: {
    ibs: {
      nome: "Imposto sobre Bens e Serviços",
      substituira: "ICMS (estadual) + ISS (municipal)",
      cronograma: {
        "2026": "Fase de testes — alíquotas simbólicas CBS 0,9% + IBS 0,1% (deduziveis dos tributos atuais)",
        "2027_2032": "Redução gradual ICMS/ISS e aumento gradual IBS",
        "2033": "Extinção completa de ICMS e ISS — vigência plena IBS"
      }
    },
    cbs: {
      nome: "Contribuição sobre Bens e Serviços",
      substituira: "PIS/COFINS/IPI (federal)"
    },
    is: {
      nome: "Imposto Seletivo",
      descricao: "Sobre produtos/serviços prejudiciais à saúde e meio ambiente"
    },
    impactos_sergipe: {
      itcmd_progressivo: {
        descricao: "LC 227/2026 torna progressividade obrigatória. Sergipe precisará ajustar legislação (atualmente fixas: 5% e 3%)."
      },
      alerta: "Governo de Sergipe alertou contribuintes sobre mudanças em janeiro/2026"
    }
  },

  // ============================================================
  // 13. DADOS DE COBERTURA (controle de qualidade)
  // ============================================================
  cobertura: {
    versao: "3.0",
    data_atualizacao: "2026-02-10",
    localizados: [
      "ICMS — alíquota padrão 19% (uma das menores do Brasil)",
      "ICMS — alíquotas diferenciadas: comunicação 25%, combustíveis 25%",
      "ICMS — ICMS-Social (Lei nº 8.628/2019)",
      "ICMS — alíquotas interestaduais (7% e 12%)",
      "IPVA — progressivo por valor: 2,5% (até 120k) / 3% (acima 120k)",
      "IPVA — motos 2%, ônibus/caminhões 1%, aeronaves 1,5%",
      "IPVA — embarcações recreativas/esportivas 3,5% (inclusive Jet Ski)",
      "IPVA — outros veículos 2,5% (catch-all)",
      "IPVA — isenção 15+ anos de fabricação (automática)",
      "IPVA — 9 categorias isenção: diplomáticos, agrícolas, construção civil, táxis, 50cc, PCD, escolar, coletivo, +15 anos",
      "IPVA — desconto 10% cota única até 31/03/2026",
      "ITCMD — causa mortis 5% (fixa), doação 3% (fixa)",
      "ITCMD — Refis com parcelamento até 60 meses",
      "ISS Aracaju — alíquota geral 5%",
      "IPTU Aracaju — residencial progressivo: 5 faixas (0,50% a 0,80%)",
      "IPTU Aracaju — comercial 1,6%",
      "IPTU Aracaju — terreno 4% (com muro) / 6% (sem muro)",
      "IPTU Aracaju — congelado 2026 (2º ano consecutivo)",
      "IPTU Aracaju — isenções: renda até 2 SM, imóvel até R$ 90k automática, servidores, doença grave",
      "IPTU Aracaju — desconto 10% cota única, até 10 parcelas (mín R$ 300)",
      "ITBI Aracaju — 2% (alíquota única)",
      "Taxas estaduais identificadas: TFUSP, DETRAN, TPEI",
      "Impostos federais completos",
      "Simples Nacional — sublimite R$ 3.600.000 e anexos I-V",
      "MEI — R$ 81.000 / DAS R$ 76,90-81,90",
      "SUDENE — redução 75% IRPJ (em transição)",
      "Programas: ICMS-Social, IMFC, Refis",
      "Reforma tributária — cronograma SE detalhado (2026-2033)"
    ],

    nao_localizados: [
      "ICMS — alíquotas diferenciadas completas (energia elétrica faixas, cesta básica detalhada, medicamentos)",
      "ICMS — Substituição Tributária (produtos e MVA)",
      "ISS Aracaju — alíquotas por tipo de serviço (CTISS detalhado)",
      "ISS Aracaju — ISS fixo (autônomos)",
      "IPTU Aracaju — faixas de terrenos em bairros vulneráveis",
      "Taxas estaduais — valores específicos (TFUSP, DETRAN, TPEI)",
      "Taxas municipais Aracaju (alvará, COSIP, lixo)"
    ],

    contatos_para_completar: [
      "SEFAZ/SE — https://www.sefaz.se.gov.br",
      "Prefeitura Aracaju — https://www.aracaju.se.gov.br",
      "Fazenda Aracaju — https://fazenda.aracaju.se.gov.br/",
      "SUDENE — https://www.gov.br/sudene"
    ],

    cobertura_percentual_estimada: "65%",
    observacao: "Boa cobertura de IPVA completo (7 categorias + 9 isenções), IPTU progressivo residencial, ITCMD e ITBI. Gaps em ISS detalhado e taxas. ICMS 19% destaque competitivo."
  }
};


// ============================================================
// 14. FUNÇÕES UTILITÁRIAS
// ============================================================

function getISSSergipe(tipo) {
  var servico = SERGIPE_TRIBUTARIO.iss.por_tipo_servico[tipo];
  if (!servico) {
    return {
      encontrado: false,
      aliquota: SERGIPE_TRIBUTARIO.iss.aliquota_geral,
      percentual: SERGIPE_TRIBUTARIO.iss.aliquota_geral_percentual,
      mensagem: "Tipo \"" + tipo + "\" não encontrado. Usando alíquota geral de 5%."
    };
  }
  return { encontrado: true, aliquota: servico.aliquota, percentual: servico.percentual, descricao: servico.descricao };
}

function _encontrarFaixaIPTUSergipe(faixas, valorVenal) {
  for (var i = 0; i < faixas.length; i++) {
    if (valorVenal >= faixas[i].de && valorVenal <= faixas[i].ate) return faixas[i];
  }
  return faixas[faixas.length - 1];
}

function getIPTUResidencialSergipe(valorVenal) {
  if (!valorVenal || valorVenal <= 0) return { erro: true, mensagem: "Valor venal deve ser maior que zero." };
  var faixa = _encontrarFaixaIPTUSergipe(SERGIPE_TRIBUTARIO.iptu.residencial.faixas, valorVenal);
  return {
    valor_venal: valorVenal,
    faixa: faixa.faixa,
    aliquota: faixa.aliquota,
    percentual: faixa.percentual,
    iptu: parseFloat((valorVenal * faixa.aliquota).toFixed(2)),
    tipo: "Residencial"
  };
}

function getIPTUComercialSergipe(valorVenal) {
  if (!valorVenal || valorVenal <= 0) return { erro: true, mensagem: "Valor venal deve ser maior que zero." };
  var aliq = SERGIPE_TRIBUTARIO.iptu.comercial.aliquota_unica;
  return {
    valor_venal: valorVenal,
    aliquota: aliq,
    percentual: SERGIPE_TRIBUTARIO.iptu.comercial.percentual,
    iptu: parseFloat((valorVenal * aliq).toFixed(2)),
    tipo: "Comercial"
  };
}

function getIPTUTerrenoSergipe(valorVenal, temMuro) {
  if (!valorVenal || valorVenal <= 0) return { erro: true, mensagem: "Valor venal deve ser maior que zero." };
  var aliq = temMuro ? SERGIPE_TRIBUTARIO.iptu.terreno.com_muro.aliquota : SERGIPE_TRIBUTARIO.iptu.terreno.sem_muro.aliquota;
  var perc = temMuro ? SERGIPE_TRIBUTARIO.iptu.terreno.com_muro.percentual : SERGIPE_TRIBUTARIO.iptu.terreno.sem_muro.percentual;
  return {
    valor_venal: valorVenal,
    aliquota: aliq,
    percentual: perc,
    iptu: parseFloat((valorVenal * aliq).toFixed(2)),
    tipo: temMuro ? "Terreno (com muro)" : "Terreno (sem muro)",
    observacao: temMuro ? null : "Fechar o terreno pode reduzir IPTU de 6% para 4%"
  };
}

function getIPVASergipe(tipo) {
  var veiculo = SERGIPE_TRIBUTARIO.ipva.aliquotas[tipo];
  if (!veiculo) {
    return {
      encontrado: false,
      aliquota: null,
      mensagem: "Tipo \"" + tipo + "\" não encontrado. Disponíveis: " + Object.keys(SERGIPE_TRIBUTARIO.ipva.aliquotas).join(", ")
    };
  }
  if (veiculo.dados_disponiveis === false) {
    return { encontrado: true, aliquota: null, dados_disponiveis: false, mensagem: veiculo.obs };
  }
  return { encontrado: true, aliquota: veiculo.aliquota, percentual: veiculo.percentual, descricao: veiculo.descricao };
}

function calcularIPVASergipe(valorVenal, tipoOuAutomatico) {
  if (!valorVenal || valorVenal <= 0) return { erro: true, mensagem: "Valor venal deve ser maior que zero." };

  var tipo = tipoOuAutomatico;
  var aliq;

  // Se tipo for 'automovel' ou 'auto', determina automaticamente pela faixa de valor
  if (tipo === "automovel" || tipo === "auto") {
    if (valorVenal <= 120000) {
      tipo = "automovel_ate_120k";
    } else {
      tipo = "automovel_acima_120k";
    }
  }

  var info = getIPVASergipe(tipo);
  if (!info.encontrado || info.aliquota === null) return info;

  var ipva_bruto = parseFloat((valorVenal * info.aliquota).toFixed(2));
  return {
    valor_venal: valorVenal,
    tipo: tipo,
    aliquota: info.aliquota,
    percentual: info.percentual,
    ipva_bruto: ipva_bruto,
    com_desconto_10pct: parseFloat((ipva_bruto * 0.90).toFixed(2)),
    sem_desconto: ipva_bruto
  };
}

function calcularITBISergipe(valorImovel) {
  if (!valorImovel || valorImovel <= 0) return { erro: true, mensagem: "Valor deve ser maior que zero." };
  var aliq = SERGIPE_TRIBUTARIO.itbi.aliquota_geral;
  return {
    valor_imovel: valorImovel,
    aliquota: aliq,
    percentual: SERGIPE_TRIBUTARIO.itbi.aliquota_geral_percentual,
    itbi: parseFloat((valorImovel * aliq).toFixed(2))
  };
}

function calcularITCMDCausaMortisSergipe(valorBem) {
  if (!valorBem || valorBem <= 0) return { erro: true, mensagem: "Valor deve ser maior que zero." };
  var aliq = SERGIPE_TRIBUTARIO.itcmd.aliquotas.causa_mortis.aliquota;
  return {
    valor: valorBem,
    aliquota: aliq,
    percentual: SERGIPE_TRIBUTARIO.itcmd.aliquotas.causa_mortis.percentual,
    itcmd: parseFloat((valorBem * aliq).toFixed(2)),
    tipo: "Causa Mortis (fixa)"
  };
}

function calcularITCMDDoacaoSergipe(valorBem) {
  if (!valorBem || valorBem <= 0) return { erro: true, mensagem: "Valor deve ser maior que zero." };
  var aliq = SERGIPE_TRIBUTARIO.itcmd.aliquotas.doacao.aliquota;
  return {
    valor: valorBem,
    aliquota: aliq,
    percentual: SERGIPE_TRIBUTARIO.itcmd.aliquotas.doacao.percentual,
    itcmd: parseFloat((valorBem * aliq).toFixed(2)),
    tipo: "Doação (fixa)"
  };
}

function isZonaFrancaSergipe() { return false; }
function isALCSergipe() { return false; }

function getReducaoSUDAMSergipe() {
  return { ativo: false, reducao: 0, mensagem: "Sergipe não está na abrangência da SUDAM." };
}

function getReducaoSUDENESergipe() {
  return {
    ativo: true,
    reducao_irpj: 0.75,
    reducao_irpj_percentual: "75%",
    aliquota_efetiva_irpj: 0.0375,
    aliquota_efetiva_irpj_percentual: "3,75%",
    condicoes: "Projeto aprovado pela SUDENE",
    status: "Em transição — LC 224/2025",
    base_legal: "Lei nº 9.126/1995"
  };
}

function getICMSEfetivoSergipe() {
  return {
    aliquota_base: 0.19,
    funcep: null,
    efetiva: 0.19,
    percentual: "19%",
    vigencia: "Vigente",
    observacao: "Uma das menores alíquotas de ICMS do Brasil"
  };
}

function getAliquotaEfetivaSimplesSeripe(rbt12, anexo) {
  var tabela = SERGIPE_TRIBUTARIO.simples_nacional.anexos[anexo];
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
    sublimite_icms_iss: SERGIPE_TRIBUTARIO.simples_nacional.sublimite_estadual,
    alerta_sublimite: rbt12 > SERGIPE_TRIBUTARIO.simples_nacional.sublimite_estadual
      ? "⚠️ RBT12 acima do sublimite estadual — ICMS/ISS recolhidos à parte" : null
  };
}

function resumoTributarioSergipe() {
  return {
    estado: "Sergipe (SE)",
    regiao: "Nordeste",
    capital: "Aracaju",
    icms_padrao: "19% (uma das menores do Brasil)",
    icms_efetivo: "19%",
    ipva_auto_ate_120k: "2,5%",
    ipva_auto_acima_120k: "3%",
    ipva_moto: "2%",
    ipva_onibus_caminhao: "1%",
    ipva_aeronave: "1,5%",
    ipva_embarcacao_recreativa: "3,5% (inclusive Jet Ski)",
    ipva_outros: "2,5% (catch-all)",
    ipva_isencao_idade: "15+ anos",
    itcmd_causa_mortis: "5% (fixa — deve migrar para progressivo)",
    itcmd_doacao: "3% (fixa)",
    iss_geral: "5% (Aracaju)",
    iptu_residencial: "0,50% a 0,80% (5 faixas — Aracaju)",
    iptu_comercial: "1,6% (Aracaju)",
    iptu_terreno: "4% com muro / 6% sem muro (Aracaju)",
    itbi: "2% (Aracaju)",
    sublimite_simples: SERGIPE_TRIBUTARIO.simples_nacional.sublimite_estadual_formatado,
    sudene: true,
    sudam: false,
    zona_franca: false,
    programa_destaque: "ICMS-Social + IMFC + Refis",
    cobertura_estimada: SERGIPE_TRIBUTARIO.cobertura.cobertura_percentual_estimada
  };
}

function getIncentivosAtivosSergipe() {
  var incentivos = [];
  if (SERGIPE_TRIBUTARIO.incentivos.sudene.ativo) {
    incentivos.push({ nome: "SUDENE", tipo: "Federal", beneficio_principal: "Redução 75% IRPJ (em transição)" });
  }
  var progs = SERGIPE_TRIBUTARIO.incentivos.programas_estaduais;
  for (var chave in progs) {
    var p = progs[chave];
    if (p.ativo) {
      incentivos.push({ nome: p.nome, tipo: "Estadual", beneficio_principal: p.descricao });
    }
  }
  return incentivos;
}


// ============================================================
// 15. EXPORTAÇÃO
// ============================================================

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        ...SERGIPE_TRIBUTARIO,
        utils: {
            getISS: getISSSergipe,
            getIPVA: getIPVASergipe,
            calcularIPVA: calcularIPVASergipe,
            getIPTUResidencial: getIPTUResidencialSergipe,
            getIPTUComercial: getIPTUComercialSergipe,
            getIPTUTerreno: getIPTUTerrenoSergipe,
            calcularITBI: calcularITBISergipe,
            calcularITCMDCausaMortis: calcularITCMDCausaMortisSergipe,
            calcularITCMDDoacao: calcularITCMDDoacaoSergipe,
            isZonaFranca: isZonaFrancaSergipe,
            isALC: isALCSergipe,
            getReducaoSUDAM: getReducaoSUDAMSergipe,
            getReducaoSUDENE: getReducaoSUDENESergipe,
            getICMSEfetivo: getICMSEfetivoSergipe,
            getAliquotaEfetivaSimples: getAliquotaEfetivaSimplesSeripe,
            resumoTributario: resumoTributarioSergipe,
            getIncentivosAtivos: getIncentivosAtivosSergipe,
        },
    };
}

if (typeof window !== "undefined") {
    window.SERGIPE_TRIBUTARIO = SERGIPE_TRIBUTARIO;
    window.SergipeTributario = {
        getISS: getISSSergipe,
        getIPVA: getIPVASergipe,
        calcularIPVA: calcularIPVASergipe,
        getIPTUResidencial: getIPTUResidencialSergipe,
        getIPTUComercial: getIPTUComercialSergipe,
        getIPTUTerreno: getIPTUTerrenoSergipe,
        calcularITBI: calcularITBISergipe,
        calcularITCMDCausaMortis: calcularITCMDCausaMortisSergipe,
        calcularITCMDDoacao: calcularITCMDDoacaoSergipe,
        isZonaFranca: isZonaFrancaSergipe,
        isALC: isALCSergipe,
        getReducaoSUDAM: getReducaoSUDAMSergipe,
        getReducaoSUDENE: getReducaoSUDENESergipe,
        getICMSEfetivo: getICMSEfetivoSergipe,
        resumo: resumoTributarioSergipe,
        getIncentivosAtivos: getIncentivosAtivosSergipe,
    };
}
