/**
 * ================================================================
 * IMPOST. — Sistema de Análise Tributária do Brasil
 * Arquivo: maranhao.js
 * Estado: Maranhão (MA)
 * Região: Nordeste
 * Capital: São Luís
 * ================================================================
 * Versão: 3.0 — Padronizado conforme modelo roraima.js
 * Data de criação: Fevereiro/2026
 * Fontes: SEFAZ/MA, Receita Federal, legislação oficial,
 *         portais governamentais, SEMFAZ São Luís
 * ================================================================
 * ESTRUTURA:
 *  1. Dados Gerais
 *  2. ICMS
 *  3. IPVA
 *  4. ITCMD
 *  5. ISS (São Luís)
 *  6. IPTU (São Luís)
 *  7. ITBI (São Luís)
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

const MARANHAO_TRIBUTARIO = {

  // ============================================================
  // 1. DADOS GERAIS DO ESTADO
  // ============================================================
  dados_gerais: {
    nome: "Maranhão",
    sigla: "MA",
    regiao: "Nordeste",
    capital: "São Luís",
    codigo_ibge: "21",
    gentilico: "Maranhense",
    zona_franca: {
      existe: false,
      observacao: "Não há Zona Franca no Maranhão"
    },
    alc: {
      existe: false,
      observacao: "Não há Área de Livre Comércio no Maranhão"
    },
    sudam: {
      abrangencia: false,
      observacao: "Maranhão não está na área de abrangência da SUDAM"
    },
    sudene: {
      abrangencia: true,
      beneficios: "Redução de IRPJ até 75%, redução de CSLL, incentivos para projetos aprovados",
      base_legal: "Lei nº 9.126/1995 e legislação SUDENE"
    },
    suframa: {
      abrangencia: false,
      observacao: "Maranhão não está na área de abrangência da SUFRAMA"
    },
    sefaz: {
      url: "https://sistemas1.sefaz.ma.gov.br",
      telefone: null,
      email: null
    },
    prefeitura_capital: {
      url: "https://www.saoluis.ma.gov.br",
      semfaz_url: "https://www.semfaz.saoluis.ma.gov.br"
    },
    legislacao_base: {
      icms: "Lei nº 7.799/2002 (22% até 22/02/2025; 23% a partir de 23/02/2025); Lei nº 12.426/2024",
      ipva: "Legislação estadual de IPVA; Decreto nº 12.668/2026",
      itcmd: "Decreto nº 12.668/2026 (progressivo: doação 1%-2%; causa mortis 3%-7%)",
      codigo_tributario_sao_luis: "Lei nº 5.822/2013 (Código Tributário de São Luís)"
    },
    observacoes: [
      "ICMS de 23% — um dos mais altos do Brasil (vigente desde 23/02/2025)",
      "ITCMD progressivo implementado: doação 1%-1,5%-2%, causa mortis 3%-5%-7%",
      "SUDENE ativo — 42 projetos aprovados em 2025 somando R$ 1,6 bilhão",
      "Reforma tributária pode elevar carga em até 28% para produtores rurais"
    ]
  },

  // ============================================================
  // 2. ICMS (Imposto sobre Circulação de Mercadorias e Serviços)
  // ============================================================
  icms: {
    aliquota_padrao: 0.23,
    aliquota_padrao_percentual: "23%",
    aliquota_padrao_vigencia: "A partir de 23/02/2025",
    aliquota_padrao_base_legal: "Lei nº 12.426/2024",

    historico: [
      { aliquota: 0.22, percentual: "22%", vigencia: "Até 22/02/2025" },
      { aliquota: 0.23, percentual: "23%", vigencia: "A partir de 23/02/2025 (aumento de 1 p.p.)" }
    ],

    fumacop: {
      existe: true,
      nome: "Fundo de Manutenção e Combate à Pobreza (FUMACOP)",
      observacao: "Verificar incidência conforme legislação específica — percentual não detalhado na pesquisa"
    },

    aliquota_efetiva_padrao: 0.23,
    aliquota_efetiva_padrao_percentual: "23%",

    aliquotas_diferenciadas: {
      medicamentos: {
        aliquota: 0.00,
        fecoep: 0.00,
        efetiva: 0.00,
        percentual: "0%",
        descricao: "Medicamentos — conforme legislação federal"
      },
      gasolina_etanol: {
        dados_disponiveis: false,
        obs: "Regime de tributação monofásica do ICMS — verificar SEFAZ/MA"
      },
      combustiveis: {
        dados_disponiveis: false,
        obs: "Verificar SEFAZ/MA"
      },
      cesta_basica: {
        dados_disponiveis: false,
        obs: "Verificar SEFAZ/MA"
      },
      energia_eletrica: {
        dados_disponiveis: false,
        obs: "Verificar SEFAZ/MA"
      },
      bebidas_alcoolicas: {
        dados_disponiveis: false,
        obs: "Verificar SEFAZ/MA"
      }
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
        aliquota: 0.23,
        percentual: "23%",
        descricao: "Operações com não contribuintes (EC 87/2015) — alíquota interna"
      }
    },

    icms_importacao: {
      aliquota: 0.04,
      percentual: "4%",
      descricao: "Alíquota fixa para mercadorias importadas (Resolução SF nº 13/2012)"
    },

    substituicao_tributaria: {
      dados_disponiveis: false,
      obs: "Lista de produtos sujeitos à ST e MVA não incluída — verificar SEFAZ/MA"
    }
  },

  // ============================================================
  // 3. IPVA (Imposto sobre Propriedade de Veículos Automotores)
  // ============================================================
  ipva: {
    base_legal: "Legislação estadual de IPVA; Decreto nº 12.668/2026",
    base_calculo: "Valor venal conforme tabela FIPE",

    aliquotas: {
      automovel_ate_150mil: {
        aliquota: 0.025,
        percentual: "2,5%",
        descricao: "Automóveis de passeio com valor venal até R$ 150.000"
      },
      automovel_acima_150mil: {
        aliquota: 0.03,
        percentual: "3%",
        descricao: "Automóveis de passeio com valor venal acima de R$ 150.000"
      },
      utilitario: {
        aliquota: 0.03,
        percentual: "3%",
        descricao: "Caminhonetes e utilitários"
      },
      motocicleta_ate_10mil: {
        aliquota: 0.01,
        percentual: "1%",
        descricao: "Motocicletas e ciclomotores com valor venal até R$ 10.000"
      },
      motocicleta_acima_10mil: {
        aliquota: 0.02,
        percentual: "2%",
        descricao: "Motocicletas com valor venal acima de R$ 10.000"
      },
      onibus_caminhao: {
        aliquota: 0.01,
        percentual: "1%",
        descricao: "Ônibus, micro-ônibus, caminhões, cavalo mecânico, tratores"
      },
      motocicleta_ate_170cc: {
        aliquota: 0.00,
        percentual: "0% (isento)",
        descricao: "Isenção total para motocicletas até 170 cilindradas",
        vigencia: "A partir de 18/12/2025",
        beneficiarios: "Mais de 230 mil pessoas",
        base_legal: "Decreto nº 12.668/2026"
      },
      embarcacao: {
        dados_disponiveis: false,
        obs: "Verificar SEFAZ/MA"
      },
      aeronave: {
        dados_disponiveis: false,
        obs: "Verificar SEFAZ/MA"
      }
    },

    isencoes: [
      {
        tipo: "Motocicletas até 170cc",
        descricao: "Isenção total de IPVA (ampliação da isenção anterior de até 150cc)",
        vigencia: "A partir de 18/12/2025",
        beneficiarios: "Mais de 230 mil pessoas",
        base_legal: "Decreto nº 12.668/2026"
      },
      {
        tipo: "Veículos com mais de 15 anos",
        descricao: "Isenção total — a partir do 16º ano de fabricação"
      },
      {
        tipo: "Veículos PCD",
        descricao: "Isenção total para portadores de deficiência"
      },
      {
        tipo: "Taxistas e motoristas de aplicativo",
        descricao: "Isenção de taxa de renovação de licenciamento e consulta RENAVAM"
      }
    ],

    descontos_antecipacao: {
      percentual: 0.10,
      percentual_texto: "10% de desconto",
      condicao: "Pagamento à vista",
      observacao: "Conforme calendário de pagamento"
    },

    calendario_vencimento: {
      dados_disponiveis: false,
      obs: "Consultar calendário oficial SEFAZ/MA"
    }
  },

  // ============================================================
  // 4. ITCMD (Imposto sobre Transmissão Causa Mortis e Doação)
  // ============================================================
  itcmd: {
    base_legal: "Decreto nº 12.668/2026; Lei Complementar nº 227/2026",

    aliquotas: {
      causa_mortis: {
        tipo: "progressiva",
        faixas: [
          { aliquota: 0.03, percentual: "3%", descricao: "Faixa mínima" },
          { aliquota: 0.05, percentual: "5%", descricao: "Faixa intermediária" },
          { aliquota: 0.07, percentual: "7%", descricao: "Faixa máxima" }
        ],
        observacao: "Maranhão adota alíquotas progressivas de 3% a 7% para causa mortis"
      },
      doacao: {
        tipo: "progressiva",
        faixas: [
          { aliquota: 0.01, percentual: "1%", descricao: "Faixa mínima" },
          { aliquota: 0.015, percentual: "1,5%", descricao: "Faixa intermediária" },
          { aliquota: 0.02, percentual: "2%", descricao: "Faixa máxima" }
        ],
        observacao: "Maranhão adota alíquotas progressivas de 1% a 2% para doação"
      }
    },

    progressividade: {
      implementada: true,
      observacao: "Maranhão já implementou alíquotas progressivas conforme LC 227/2026"
    },

    base_calculo: "Valor venal do bem ou direito transmitido (valor de mercado ou valor real)",

    isencoes: {
      dados_disponiveis: false,
      obs: "Limites de isenção não localizados — verificar SEFAZ/MA"
    },

    prazo_pagamento: {
      dados_disponiveis: false,
      obs: "Prazo de pagamento não localizado — verificar SEFAZ/MA"
    }
  },

  // ============================================================
  // 5. ISS — São Luís (capital como referência)
  // ============================================================
  iss: {
    municipio_referencia: "São Luís",
    base_legal: "Lei nº 5.822/2013 (Código Tributário de São Luís); Decreto nº 61.447/2025",
    aliquota_geral: 0.05,
    aliquota_geral_percentual: "5%",
    aliquota_minima: 0.02,
    aliquota_maxima: 0.05,
    aliquota_minima_percentual: "2%",
    aliquota_maxima_percentual: "5%",
    observacao: "Alíquota geral de 5% para empresas com base de cálculo no preço do serviço",

    por_tipo_servico: {
      construcao_civil: {
        dados_disponiveis: false,
        obs: "Verificar SEMFAZ São Luís"
      },
      informatica: {
        dados_disponiveis: false,
        obs: "Verificar SEMFAZ São Luís"
      },
      saude: {
        dados_disponiveis: false,
        obs: "Verificar SEMFAZ São Luís"
      },
      educacao: {
        dados_disponiveis: false,
        obs: "Verificar SEMFAZ São Luís"
      },
      servicos_paralelos_construcao: {
        dados_disponiveis: false,
        obs: "Verificar SEMFAZ São Luís"
      }
    },

    iss_fixo: {
      dados_disponiveis: false,
      obs: "ISS fixo para autônomos não detalhado — verificar SEMFAZ São Luís"
    }
  },

  // ============================================================
  // 6. IPTU — São Luís (capital como referência)
  // ============================================================
  iptu: {
    municipio_referencia: "São Luís",
    base_legal: "Lei nº 5.822/2013 (Código Tributário de São Luís)",
    base_calculo: "Valor venal do imóvel (valor de mercado estimado)",
    atualizacao_monetaria: "Conforme variação do IPCA",

    aliquotas_residencial: {
      dados_disponiveis: false,
      obs: "Alíquotas residenciais não localizadas — verificar SEMFAZ São Luís"
    },

    aliquotas_nao_residencial: {
      dados_disponiveis: false,
      obs: "Alíquotas comerciais não localizadas — verificar SEMFAZ São Luís"
    },

    aliquota_terreno_nao_edificado: {
      dados_disponiveis: false,
      obs: "Alíquota de terreno não edificado não localizada — verificar SEMFAZ São Luís"
    },

    descontos: {
      cota_unica: {
        descricao: "Possibilidade de descontos cumulativos",
        prazo: "Pagamento em cota única até 10 de março de 2026"
      }
    },

    isencoes: {
      dados_disponiveis: false,
      obs: "Isenções de IPTU não detalhadas — verificar SEMFAZ São Luís"
    }
  },

  // ============================================================
  // 7. ITBI — São Luís (capital como referência)
  // ============================================================
  itbi: {
    municipio_referencia: "São Luís",
    base_legal: "Lei nº 5.822/2013",
    aliquota_geral: null,
    base_calculo: "Valor venal do imóvel",
    dados_disponiveis: false,
    obs: "Alíquota de ITBI não localizada — verificar SEMFAZ São Luís",

    sfh: {
      dados_disponiveis: false,
      obs: "Alíquota SFH não localizada — verificar SEMFAZ São Luís"
    }
  },

  // ============================================================
  // 8. TAXAS ESTADUAIS E MUNICIPAIS
  // ============================================================
  taxas: {
    estaduais: {
      taxa_licenciamento_veiculos: { dados_disponiveis: false, obs: "Verificar SEFAZ/MA" },
      taxa_judiciaria: { dados_disponiveis: false, obs: "Verificar SEFAZ/MA" },
      taxa_servicos_sefaz: { dados_disponiveis: false, obs: "Verificar SEFAZ/MA" },
      taxa_ambiental: { dados_disponiveis: false, obs: "Verificar SEFAZ/MA" },
      taxa_incendio_bombeiros: { dados_disponiveis: false, obs: "Verificar SEFAZ/MA" },
      emolumentos_cartorarios: { dados_disponiveis: false, obs: "Verificar SEFAZ/MA" }
    },
    municipais: {
      taxa_lixo_coleta: { dados_disponiveis: false, obs: "Verificar SEMFAZ São Luís" },
      taxa_alvara_funcionamento: { dados_disponiveis: false, obs: "Verificar SEMFAZ São Luís" },
      taxa_publicidade: { dados_disponiveis: false, obs: "Verificar SEMFAZ São Luís" },
      cosip: { dados_disponiveis: false, obs: "Verificar SEMFAZ São Luís" }
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
          revenda_combustiveis: 0.016,
          observacao: "Percentuais de presunção variam de 1,6% a 32% conforme atividade"
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
        base_legal: "Lei nº 9.126/1995",
        destaque: "42 projetos aprovados em 2025 somando R$ 1,6 bilhão para empresas maranhenses"
      }
    },

    irpf: {
      tabela_mensal_2026: [
        { faixa: 1, de: 0, ate: 2372.27, aliquota: 0.00, deducao: 0, descricao: "Isento" },
        { faixa: 2, de: 2372.27, ate: 2826.65, aliquota: 0.075, deducao: 177.92, descricao: "7,5%" },
        { faixa: 3, de: 2826.66, ate: 3751.05, aliquota: 0.15, deducao: 428.27, descricao: "15%" },
        { faixa: 4, de: 3751.06, ate: 4664.75, aliquota: 0.225, deducao: 709.64, descricao: "22,5%" },
        { faixa: 5, de: 4664.76, ate: Infinity, aliquota: 0.275, deducao: 1236.47, descricao: "27,5%" }
      ],
      tabela_anual_2026: [
        { faixa: 1, de: 0, ate: 28467.21, aliquota: 0.00, deducao: 0, descricao: "Isento" },
        { faixa: 2, de: 28467.21, ate: 33919.80, aliquota: 0.075, deducao: 2135.04, descricao: "7,5%" },
        { faixa: 3, de: 33919.81, ate: 45012.60, aliquota: 0.15, deducao: 5139.18, descricao: "15%" },
        { faixa: 4, de: 45012.61, ate: 55976.96, aliquota: 0.225, deducao: 9253.68, descricao: "22,5%" },
        { faixa: 5, de: 55976.97, ate: Infinity, aliquota: 0.275, deducao: 14831.64, descricao: "27,5%" }
      ],
      deducoes: "Conforme legislação federal (dependentes, educação, saúde, etc.)"
    },

    csll: {
      aliquota_geral: 0.09,
      percentual: "9%",
      vigencia_alteracao: "A partir de 01/10/2025",
      observacao: "Alteração em vigor conforme Medida Provisória",
      incentivos_sudene: {
        reducao_aplicavel: true,
        condicoes: "Conforme aprovação e projeto SUDENE"
      }
    },

    pis_pasep: {
      cumulativo: {
        aliquota: 0.0065,
        percentual: "0,65%",
        regime: "Lucro Presumido"
      },
      nao_cumulativo: {
        aliquota: 0.0165,
        percentual: "1,65%",
        regime: "Lucro Real"
      },
      aliquota_zero_cesta_basica: true
    },

    cofins: {
      cumulativo: {
        aliquota: 0.03,
        percentual: "3%",
        regime: "Lucro Presumido"
      },
      nao_cumulativo: {
        aliquota: 0.076,
        percentual: "7,6%",
        regime: "Lucro Real"
      },
      aliquota_zero_cesta_basica: true
    },

    ipi: {
      referencia: "Tabela de Incidência do IPI (TIPI) vigente",
      beneficios_regionais: false,
      observacao: "Sem benefícios específicos de IPI para o Maranhão"
    },

    iof: { descricao: "Conforme legislação federal — sem especificidade estadual" },
    ii: { descricao: "Imposto de Importação — conforme TEC e legislação federal" },
    ie: { descricao: "Imposto de Exportação — conforme legislação federal" },
    itr: { descricao: "Imposto Territorial Rural — conforme legislação federal" },

    inss: {
      patronal: {
        aliquota: 0.20,
        percentual: "20%",
        base: "Folha de pagamento"
      },
      rat_sat: {
        minima: 0.005,
        maxima: 0.03,
        percentual: "0,5% a 3%",
        descricao: "Conforme risco da atividade (CNAE)"
      },
      terceiros: {
        aliquota: 0.058,
        percentual: "5,8%",
        descricao: "INCRA, SENAI/SENAC, SESI/SESC, SEBRAE, salário-educação"
      },
      empregado: {
        tabela: [
          { faixa: 1, ate: 1518.00, aliquota: 0.075, percentual: "7,5%" },
          { faixa: 2, ate: 2793.88, aliquota: 0.09, percentual: "9%" },
          { faixa: 3, ate: 4190.83, aliquota: 0.12, percentual: "12%" },
          { faixa: 4, ate: 8157.41, aliquota: 0.14, percentual: "14%" }
        ],
        observacao: "Tabela progressiva 2025 — teto INSS: R$ 8.157,41"
      }
    },

    fgts: {
      aliquota: 0.08,
      percentual: "8%",
      base: "Remuneração mensal do empregado"
    }
  },

  // ============================================================
  // 10. SIMPLES NACIONAL
  // ============================================================
  simples_nacional: {
    sublimite_estadual: 3600000,
    sublimite_estadual_formatado: "R$ 3.600.000,00",
    sublimite_tipo: "Padrão",
    sublimite_base_legal: "Portaria CGSN nº 49/2024",
    sublimite_observacao: "Maranhão adota o sublimite padrão para ICMS/ISS",

    limite_simples: 4800000,
    limite_simples_formatado: "R$ 4.800.000,00",

    mei: {
      limite_anual: 81500,
      limite_formatado: "R$ 81.500,00",
      vigencia: "2025",
      das_mensal: {
        comercio_industria: 76.90,
        servicos: 81.90,
        comercio_servicos: 81.90
      },
      icms_fixo: 1.00,
      iss_fixo: 5.00,
      observacao: "Valores atualizados conforme salário-mínimo R$ 1.518,00 (2025)"
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
    sudam: {
      ativo: false,
      observacao: "Maranhão não está na abrangência da SUDAM"
    },

    sudene: {
      ativo: true,
      nome: "Superintendência do Desenvolvimento do Nordeste",
      abrangencia: "Todo o estado do Maranhão",
      beneficios: {
        reducao_irpj: {
          percentual: 0.75,
          descricao: "Redução de 75% do IRPJ devido",
          aliquota_efetiva: 0.0375,
          aliquota_efetiva_percentual: "3,75%"
        },
        reducao_csll: {
          descricao: "Redução aplicável conforme aprovação e projeto"
        },
        reinvestimento: {
          descricao: "Incentivos para reinvestimento de lucros"
        }
      },
      condicoes: [
        "Projeto aprovado pela SUDENE",
        "Localização no Maranhão",
        "Tipos: instalação, diversificação, modernização",
        "Atender critérios de sustentabilidade SUDENE"
      ],
      destaque: "42 projetos aprovados em 2025 somando R$ 1,6 bilhão",
      base_legal: "Lei nº 9.126/1995 e legislação SUDENE"
    },

    zona_franca: {
      ativo: false,
      observacao: "Não aplicável no Maranhão"
    },

    alc: {
      ativo: false,
      observacao: "Não há ALC no Maranhão"
    },

    programas_estaduais: {
      programa_mais_empresas: {
        nome: "Programa Mais Empresas",
        ativo: true,
        descricao: "Benefícios para empresas maranhenses",
        base_legal: "Legislação estadual"
      },
      beneficios_fiscais_icms: {
        nome: "Benefícios Fiscais Estaduais de ICMS",
        ativo: true,
        descricao: "Isenção, redução da base de cálculo, manutenção de crédito",
        setores: [
          "Agricultura", "Combustíveis", "Comércio atacadista",
          "Cultura", "Exportação/Importação", "Frutos do mar", "Hortifrutigranjeiros"
        ],
        base_legal: "Legislação SEFAZ/MA"
      }
    },

    isencoes_especificas: {
      agricultura_familiar: { dados_disponiveis: false, obs: "Verificar SEFAZ/MA" },
      cooperativas: { dados_disponiveis: false, obs: "Verificar SEFAZ/MA" },
      exportadores: { dados_disponiveis: false, obs: "Verificar SEFAZ/MA" }
    }
  },

  // ============================================================
  // 12. REFORMA TRIBUTÁRIA
  // ============================================================
  reforma_tributaria: {
    ibs: {
      nome: "Imposto sobre Bens e Serviços",
      substituira: "ICMS (estadual) + ISS (municipal)",
      cronograma: "Transição gradual conforme legislação federal",
      dados_disponiveis: false,
      obs: "Alíquota estadual ainda não definida"
    },
    cbs: {
      nome: "Contribuição sobre Bens e Serviços",
      substituira: "PIS/COFINS (federal)",
      cronograma: "Transição gradual conforme legislação federal",
      dados_disponiveis: false
    },
    is: {
      nome: "Imposto Seletivo",
      descricao: "Sobre produtos prejudiciais à saúde ou ao meio ambiente",
      dados_disponiveis: false
    },
    impactos_maranhao: {
      produtores_rurais: {
        descricao: "Reforma tributária pode elevar carga tributária em até 28% para produtores rurais",
        aliquotas_estimadas: "Variação de 10% até 28% conforme produto",
        observacao: "Muitos produtores que não pagavam imposto agora enfrentarão alíquotas maiores"
      },
      fundo_desenvolvimento_regional: {
        dados_disponiveis: false,
        obs: "Verificar SEFAZ/MA"
      },
      manutencao_sudene: {
        descricao: "Benefícios SUDENE devem ser mantidos durante transição"
      }
    }
  },

  // ============================================================
  // 13. DADOS DE COBERTURA (controle de qualidade)
  // ============================================================
  cobertura: {
    versao: "3.0",
    data_atualizacao: "2026-02-10",
    localizados: [
      "ICMS — alíquota padrão 23% (vigente desde 23/02/2025) + histórico 22%",
      "ICMS — alíquotas interestaduais (7% e 12%)",
      "ICMS — importação (4%)",
      "ICMS — FUMACOP existe (percentual não detalhado)",
      "IPVA — alíquotas por tipo/valor (2,5% a 3% autos; 1%-2% motos; 1% caminhões/ônibus)",
      "IPVA — isenção motos até 170cc (Decreto nº 12.668/2026, 230 mil beneficiados)",
      "IPVA — isenção veículos +15 anos, PCD, taxistas",
      "IPVA — desconto 10% pagamento à vista",
      "ITCMD — progressivo causa mortis (3%, 5%, 7%)",
      "ITCMD — progressivo doação (1%, 1,5%, 2%)",
      "ISS São Luís — alíquota geral 5%",
      "Impostos federais completos (IRPJ, CSLL, PIS, COFINS, INSS, FGTS)",
      "IRPF tabela 2026 (anual e mensal)",
      "Simples Nacional — sublimite R$ 3.600.000 e anexos I-V",
      "MEI — valores DAS 2025",
      "SUDENE — redução 75% IRPJ (42 projetos R$ 1,6 bi em 2025)",
      "Programa Mais Empresas",
      "Benefícios fiscais ICMS por setor (agricultura, combustíveis, etc.)",
      "Reforma tributária — impacto até 28% produtores rurais"
    ],

    nao_localizados: [
      "ICMS — alíquotas diferenciadas (cesta básica, combustíveis, energia, bebidas)",
      "ICMS — FUMACOP percentual específico",
      "ICMS — Substituição Tributária (lista de produtos, MVA)",
      "IPVA — embarcações e aeronaves",
      "IPVA — calendário de vencimento por placa",
      "ITCMD — faixas de valor para cada alíquota progressiva",
      "ITCMD — isenções específicas",
      "ISS São Luís — alíquotas por tipo de serviço (informática, saúde, educação, construção)",
      "ISS São Luís — ISS Fixo (autônomos)",
      "IPTU São Luís — alíquotas residenciais, comerciais, terreno",
      "IPTU São Luís — isenções",
      "ITBI São Luís — alíquota",
      "Taxas estaduais (licenciamento, judiciária, bombeiros, etc.)",
      "Taxas municipais São Luís (lixo, alvará, COSIP)"
    ],

    contatos_para_completar: [
      "SEFAZ/MA — https://sistemas1.sefaz.ma.gov.br",
      "SEMFAZ São Luís — https://www.semfaz.saoluis.ma.gov.br",
      "SUDENE — https://www.gov.br/sudene"
    ],

    cobertura_percentual_estimada: "50%",
    observacao: "Dados estaduais (ICMS, IPVA, ITCMD) bem cobertos. Grandes gaps em dados municipais de São Luís (ISS, IPTU, ITBI) e taxas"
  }
};


// ============================================================
// 14. FUNÇÕES UTILITÁRIAS
// ============================================================

/**
 * Retorna alíquota ISS por tipo de serviço em São Luís
 */
function getISSMaranhao(tipo) {
  var servico = MARANHAO_TRIBUTARIO.iss.por_tipo_servico[tipo];
  if (!servico) {
    return {
      encontrado: false,
      aliquota: MARANHAO_TRIBUTARIO.iss.aliquota_geral,
      percentual: MARANHAO_TRIBUTARIO.iss.aliquota_geral_percentual,
      mensagem: "Tipo \"" + tipo + "\" não encontrado. Usando alíquota geral de 5%. Disponíveis: " + Object.keys(MARANHAO_TRIBUTARIO.iss.por_tipo_servico).join(", ")
    };
  }
  if (servico.dados_disponiveis === false) {
    return {
      encontrado: true,
      aliquota: MARANHAO_TRIBUTARIO.iss.aliquota_geral,
      percentual: MARANHAO_TRIBUTARIO.iss.aliquota_geral_percentual,
      dados_disponiveis: false,
      mensagem: servico.obs + " — usando alíquota geral de 5%"
    };
  }
  return {
    encontrado: true,
    aliquota: servico.aliquota,
    percentual: servico.percentual,
    observacao: servico.observacao || null
  };
}

/**
 * Retorna alíquota IPTU residencial (dados não disponíveis para São Luís)
 */
function getIPTUResidencialMaranhao(areaM2) {
  return {
    aliquota: null,
    dados_disponiveis: false,
    mensagem: "Alíquotas residenciais não localizadas para São Luís — verificar SEMFAZ"
  };
}

/**
 * Retorna alíquota IPTU comercial (dados não disponíveis para São Luís)
 */
function getIPTUComercialMaranhao(areaM2) {
  return {
    aliquota: null,
    dados_disponiveis: false,
    mensagem: "Alíquotas comerciais não localizadas para São Luís — verificar SEMFAZ"
  };
}

/**
 * Retorna alíquota IPVA por tipo de veículo
 */
function getIPVAMaranhao(tipo) {
  var veiculo = MARANHAO_TRIBUTARIO.ipva.aliquotas[tipo];
  if (!veiculo) {
    return {
      encontrado: false,
      aliquota: null,
      mensagem: "Tipo \"" + tipo + "\" não encontrado. Disponíveis: " + Object.keys(MARANHAO_TRIBUTARIO.ipva.aliquotas).join(", ")
    };
  }
  if (veiculo.dados_disponiveis === false) {
    return { encontrado: true, aliquota: null, dados_disponiveis: false, mensagem: veiculo.obs };
  }
  return {
    encontrado: true,
    aliquota: veiculo.aliquota,
    percentual: veiculo.percentual,
    descricao: veiculo.descricao
  };
}

function isZonaFrancaMaranhao(municipio) { return false; }
function isALCMaranhao(municipio) { return false; }

function getReducaoSUDAMMaranhao() {
  return { ativo: false, reducao: 0, mensagem: "Maranhão não está na abrangência da SUDAM. Use getReducaoSUDENEMaranhao()." };
}

function getReducaoSUDENEMaranhao() {
  return {
    ativo: true,
    reducao_irpj: 0.75,
    reducao_irpj_percentual: "75%",
    aliquota_efetiva_irpj: 0.0375,
    aliquota_efetiva_irpj_percentual: "3,75%",
    condicoes: "Projeto aprovado pela SUDENE",
    destaque: "42 projetos aprovados em 2025 (R$ 1,6 bi)",
    base_legal: "Lei nº 9.126/1995"
  };
}

function getICMSEfetivoMaranhao() {
  return {
    aliquota_base: 0.23,
    fumacop: null,
    efetiva: 0.23,
    percentual: "23%",
    vigencia: "A partir de 23/02/2025",
    observacao: "FUMACOP existe mas percentual não detalhado na pesquisa"
  };
}

/**
 * Retorna alíquota ITCMD causa mortis por valor (progressiva)
 */
function getITCMDCausaMortisMaranhao(valor) {
  var faixas = MARANHAO_TRIBUTARIO.itcmd.aliquotas.causa_mortis.faixas;
  return {
    tipo: "progressiva",
    faixas: faixas,
    observacao: "Faixas de valor específicas para cada alíquota não detalhadas na pesquisa. Alíquotas: 3%, 5%, 7%.",
    aliquota_minima: 0.03,
    aliquota_maxima: 0.07
  };
}

/**
 * Retorna alíquota ITCMD doação (progressiva)
 */
function getITCMDDoacaoMaranhao(valor) {
  var faixas = MARANHAO_TRIBUTARIO.itcmd.aliquotas.doacao.faixas;
  return {
    tipo: "progressiva",
    faixas: faixas,
    observacao: "Faixas de valor específicas não detalhadas. Alíquotas: 1%, 1,5%, 2%.",
    aliquota_minima: 0.01,
    aliquota_maxima: 0.02
  };
}

/**
 * Calcula alíquota efetiva do Simples Nacional
 */
function getAliquotaEfetivaSimplesMaranhao(rbt12, anexo) {
  var tabela = MARANHAO_TRIBUTARIO.simples_nacional.anexos[anexo];
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
    erro: false,
    rbt12: rbt12,
    anexo: tabela.nome,
    faixa: faixaSelecionada.faixa,
    aliquota_nominal: faixaSelecionada.aliquota,
    deducao: faixaSelecionada.deducao,
    aliquota_efetiva: parseFloat(aliquotaEfetiva.toFixed(6)),
    aliquota_efetiva_percentual: (aliquotaEfetiva * 100).toFixed(2) + "%",
    sublimite_icms_iss: MARANHAO_TRIBUTARIO.simples_nacional.sublimite_estadual,
    alerta_sublimite: rbt12 > MARANHAO_TRIBUTARIO.simples_nacional.sublimite_estadual
      ? "⚠️ RBT12 acima do sublimite estadual — ICMS/ISS recolhidos à parte" : null
  };
}

function resumoTributarioMaranhao() {
  return {
    estado: "Maranhão (MA)",
    regiao: "Nordeste",
    capital: "São Luís",
    icms_padrao: MARANHAO_TRIBUTARIO.icms.aliquota_padrao,
    icms_padrao_percentual: MARANHAO_TRIBUTARIO.icms.aliquota_padrao_percentual,
    icms_efetivo: MARANHAO_TRIBUTARIO.icms.aliquota_efetiva_padrao,
    icms_efetivo_percentual: MARANHAO_TRIBUTARIO.icms.aliquota_efetiva_padrao_percentual,
    icms_destaque: "Um dos mais altos do Brasil",
    ipva_auto: "2,5% (até 150k) / 3% (acima 150k)",
    ipva_moto: "1% (até 10k) / 2% (acima 10k) / 0% (até 170cc)",
    ipva_caminhao: "1%",
    itcmd_causa_mortis: "3% a 7% (progressivo)",
    itcmd_doacao: "1% a 2% (progressivo)",
    iss_geral: "5% (São Luís)",
    sublimite_simples: MARANHAO_TRIBUTARIO.simples_nacional.sublimite_estadual_formatado,
    sudene: true,
    sudam: false,
    zona_franca: false,
    programa_estadual: "Mais Empresas + Benefícios Fiscais ICMS por setor",
    cobertura_estimada: MARANHAO_TRIBUTARIO.cobertura.cobertura_percentual_estimada
  };
}

function getIncentivosAtivosMaranhao() {
  var incentivos = [];

  if (MARANHAO_TRIBUTARIO.incentivos.sudene.ativo) {
    incentivos.push({
      nome: "SUDENE",
      tipo: "Federal",
      beneficio_principal: "Redução de 75% do IRPJ",
      destaque: "42 projetos aprovados em 2025 (R$ 1,6 bi)"
    });
  }

  var programas = MARANHAO_TRIBUTARIO.incentivos.programas_estaduais;
  for (var chave in programas) {
    var prog = programas[chave];
    if (prog.ativo) {
      incentivos.push({
        nome: prog.nome,
        tipo: "Estadual",
        beneficio_principal: prog.descricao,
        setores: prog.setores || null
      });
    }
  }

  return incentivos;
}


// ============================================================
// 15. EXPORTAÇÃO
// ============================================================

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        ...MARANHAO_TRIBUTARIO,
        utils: {
            getISS: getISSMaranhao,
            getIPVA: getIPVAMaranhao,
            getIPTUResidencial: getIPTUResidencialMaranhao,
            getIPTUComercial: getIPTUComercialMaranhao,
            isZonaFranca: isZonaFrancaMaranhao,
            isALC: isALCMaranhao,
            getReducaoSUDAM: getReducaoSUDAMMaranhao,
            getReducaoSUDENE: getReducaoSUDENEMaranhao,
            getICMSEfetivo: getICMSEfetivoMaranhao,
            getITCMDCausaMortis: getITCMDCausaMortisMaranhao,
            getITCMDDoacao: getITCMDDoacaoMaranhao,
            getAliquotaEfetivaSimples: getAliquotaEfetivaSimplesMaranhao,
            resumoTributario: resumoTributarioMaranhao,
            getIncentivosAtivos: getIncentivosAtivosMaranhao,
        },
    };
}

if (typeof window !== "undefined") {
    window.MARANHAO_TRIBUTARIO = MARANHAO_TRIBUTARIO;
    window.MaranhaoTributario = {
        getISS: getISSMaranhao,
        getIPVA: getIPVAMaranhao,
        getIPTUResidencial: getIPTUResidencialMaranhao,
        getIPTUComercial: getIPTUComercialMaranhao,
        isZonaFranca: isZonaFrancaMaranhao,
        isALC: isALCMaranhao,
        getReducaoSUDAM: getReducaoSUDAMMaranhao,
        getReducaoSUDENE: getReducaoSUDENEMaranhao,
        getICMSEfetivo: getICMSEfetivoMaranhao,
        getITCMDCausaMortis: getITCMDCausaMortisMaranhao,
        getITCMDDoacao: getITCMDDoacaoMaranhao,
        resumo: resumoTributarioMaranhao,
        getIncentivosAtivos: getIncentivosAtivosMaranhao,
    };
}
