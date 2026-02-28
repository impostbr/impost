/**
 * ================================================================
 * IMPOST. — Sistema de Análise Tributária do Brasil
 * Arquivo: paraiba.js
 * Estado: Paraíba (PB)
 * Região: Nordeste
 * Capital: João Pessoa
 * ================================================================
 * Versão: 3.0 — Padronizado conforme modelo roraima.js
 * Data de criação: Fevereiro/2026
 * Fontes: SEFAZ/PB, Receita Federal, legislação oficial,
 *         portais governamentais, Prefeitura de João Pessoa
 * ================================================================
 * ESTRUTURA:
 *  1. Dados Gerais
 *  2. ICMS
 *  3. IPVA
 *  4. ITCMD
 *  5. ISS (João Pessoa)
 *  6. IPTU (João Pessoa)
 *  7. ITBI (João Pessoa)
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

const PARAIBA_TRIBUTARIO = {

  // ============================================================
  // 1. DADOS GERAIS DO ESTADO
  // ============================================================
  dados_gerais: {
    nome: "Paraíba",
    sigla: "PB",
    regiao: "Nordeste",
    capital: "João Pessoa",
    codigo_ibge: "25",
    gentilico: "Paraibano(a)",
    zona_franca: {
      existe: false,
      observacao: "Não há Zona Franca na Paraíba"
    },
    alc: {
      existe: false,
      observacao: "Não há Área de Livre Comércio na Paraíba"
    },
    sudam: {
      abrangencia: false,
      observacao: "Paraíba não está na área de abrangência da SUDAM"
    },
    sudene: {
      abrangencia: true,
      beneficios: "Redução de IRPJ até 75%, redução de CSLL, incentivos para projetos aprovados",
      base_legal: "Lei nº 9.126/1995 e legislação SUDENE"
    },
    suframa: {
      abrangencia: false,
      observacao: "Paraíba não está na área de abrangência da SUFRAMA"
    },
    sefaz: {
      url: "https://www.sefaz.pb.gov.br",
      telefone: null,
      email: null
    },
    prefeitura_capital: {
      url: "https://www.joaopessoa.pb.gov.br"
    },
    legislacao_base: {
      icms: "Lei nº 6.379/1996 (20% desde 01/01/2024); Lei nº 12.788/2023; Decreto nº 44.675/2023",
      ipva: "Lei nº 13.667/2025",
      itcmd: "Lei nº 5.123/1990; Lei nº 13.751/2025 (progressivo 2%-4%-6%-8%)",
      codigo_tributario_joao_pessoa: "Lei Complementar nº 53/2008; LC nº 174/2025"
    },
    observacoes: [
      "ICMS de 20% vigente desde 01/01/2024 (anterior 18%)",
      "ITCMD progressivo implementado: 2%, 4%, 6%, 8% (causa mortis e doação)",
      "FAIN — crédito presumido ICMS de 48% a 74,25% até dez/2032",
      "IPVA — isenção para motos até 170cc e veículos fabricados até 2010",
      "SUDENE ativo — todo o estado"
    ]
  },

  // ============================================================
  // 2. ICMS (Imposto sobre Circulação de Mercadorias e Serviços)
  // ============================================================
  icms: {
    aliquota_padrao: 0.20,
    aliquota_padrao_percentual: "20%",
    aliquota_padrao_vigencia: "A partir de 01/01/2024",
    aliquota_padrao_base_legal: "Lei nº 6.379/1996; Lei nº 12.788/2023; Decreto nº 44.675/2023",

    historico: [
      { aliquota: 0.18, percentual: "18%", vigencia: "Até 31/12/2023" },
      { aliquota: 0.20, percentual: "20%", vigencia: "A partir de 01/01/2024 (aumento de 2 p.p.)" }
    ],

    funcep: {
      existe: true,
      nome: "Fundo de Combate à Pobreza (FUNCEP)",
      observacao: "Verificar incidência conforme legislação específica — percentual não detalhado"
    },

    aliquota_efetiva_padrao: 0.20,
    aliquota_efetiva_padrao_percentual: "20%",

    aliquotas_diferenciadas: {
      medicamentos: {
        aliquota: 0.00,
        percentual: "0%",
        descricao: "Medicamentos — conforme legislação federal"
      },
      combustiveis: { dados_disponiveis: false, obs: "Verificar SEFAZ/PB" },
      cesta_basica: { dados_disponiveis: false, obs: "Verificar SEFAZ/PB" },
      energia_eletrica: { dados_disponiveis: false, obs: "Verificar SEFAZ/PB" },
      bebidas_alcoolicas: { dados_disponiveis: false, obs: "Verificar SEFAZ/PB" }
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
        aliquota: 0.20,
        percentual: "20%",
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
      obs: "Lista de produtos e MVA não incluída — verificar SEFAZ/PB"
    }
  },

  // ============================================================
  // 3. IPVA (Imposto sobre Propriedade de Veículos Automotores)
  // ============================================================
  ipva: {
    base_legal: "Lei nº 13.667/2025",
    base_calculo: "Valor venal conforme tabela FIPE",

    aliquotas: {
      automovel_passeio: {
        aliquota: 0.025,
        percentual: "2,5%",
        descricao: "Carros de passeio e similares"
      },
      caminhonete_utilitario: {
        aliquota: 0.025,
        percentual: "2,5%",
        descricao: "Caminhonetes e utilitários"
      },
      motocicleta: {
        aliquota: 0.01,
        percentual: "1%",
        descricao: "Motocicletas, ciclomotores e similares"
      },
      onibus_caminhao_novo: {
        aliquota: 0.01,
        percentual: "1%",
        descricao: "Ônibus, micro-ônibus, caminhões novos"
      },
      caminhao_usado: {
        aliquota: 0.025,
        percentual: "2,5%",
        descricao: "Caminhões usados"
      },
      embarcacao: { dados_disponiveis: false, obs: "Verificar SEFAZ/PB" },
      aeronave: { dados_disponiveis: false, obs: "Verificar SEFAZ/PB" }
    },

    isencoes: [
      {
        tipo: "Veículos com mais de 15 anos",
        descricao: "Isenção automática para veículos com mais de 15 anos de uso",
        base_legal: "Lei nº 13.667/2025"
      },
      {
        tipo: "Motocicletas até 170cc",
        descricao: "Isenção automática para motocicletas de até 170 cilindradas"
      },
      {
        tipo: "Veículos PCD",
        descricao: "Pessoas com deficiência, síndrome de Down ou autismo",
        base_legal: "Lei nº 13.667/2025"
      },
      {
        tipo: "Veículos fabricados até 2010",
        descricao: "Isenção total a partir de 2026",
        vigencia: "A partir de 2026"
      }
    ],

    descontos_antecipacao: {
      dados_disponiveis: false,
      obs: "Desconto conforme calendário de pagamento — verificar SEFAZ/PB"
    },

    calendario_vencimento: {
      dados_disponiveis: false,
      obs: "Consultar calendário oficial SEFAZ/PB"
    }
  },

  // ============================================================
  // 4. ITCMD (Imposto sobre Transmissão Causa Mortis e Doação)
  // ============================================================
  itcmd: {
    base_legal: "Lei nº 5.123/1990; Lei nº 13.751/2025; LC nº 227/2026",

    aliquotas: {
      causa_mortis: {
        tipo: "progressiva",
        faixas: [
          { aliquota: 0.02, percentual: "2%", descricao: "Faixa 1" },
          { aliquota: 0.04, percentual: "4%", descricao: "Faixa 2" },
          { aliquota: 0.06, percentual: "6%", descricao: "Faixa 3" },
          { aliquota: 0.08, percentual: "8%", descricao: "Faixa 4 (máxima)" }
        ],
        observacao: "Paraíba adota alíquotas progressivas de 2% a 8% para causa mortis"
      },
      doacao: {
        tipo: "progressiva",
        faixas: [
          { aliquota: 0.02, percentual: "2%", descricao: "Faixa 1" },
          { aliquota: 0.04, percentual: "4%", descricao: "Faixa 2" },
          { aliquota: 0.06, percentual: "6%", descricao: "Faixa 3" },
          { aliquota: 0.08, percentual: "8%", descricao: "Faixa 4 (máxima)" }
        ],
        observacao: "Paraíba adota alíquotas progressivas de 2% a 8% para doação"
      }
    },

    progressividade: {
      implementada: true,
      observacao: "Paraíba já implementou ITCMD progressivo conforme LC 227/2026"
    },

    base_calculo: "Valor venal do bem ou direito transmitido (valor de mercado ou valor real)",

    isencoes: {
      servidores_publicos: {
        descricao: "Isenção para herdeiros, legatários ou donatários servidores públicos",
        base_legal: "Lei nº 5.123/1990"
      },
      imovel_urbano_rural: {
        dados_disponiveis: false,
        obs: "Limites de isenção por valor não localizados — verificar SEFAZ/PB"
      }
    },

    novo_sistema_itcd: {
      descricao: "SEFAZ-PB avança no desenvolvimento de sistema ágil do ITCD",
      vigencia: "2025"
    }
  },

  // ============================================================
  // 5. ISS — João Pessoa (capital como referência)
  // ============================================================
  iss: {
    municipio_referencia: "João Pessoa",
    base_legal: "Lei Complementar nº 53/2008; LC nº 174/2025",
    aliquota_geral: 0.05,
    aliquota_geral_percentual: "5%",
    aliquota_minima: 0.02,
    aliquota_maxima: 0.05,
    aliquota_minima_percentual: "2%",
    aliquota_maxima_percentual: "5%",
    observacao: "Alíquota geral padrão conforme LC nº 116/2003",

    incentivos_fiscais: {
      hoteis_polo_cabo_branco: {
        reducao_aliquota: 0.02,
        percentual: "Redução até 2%",
        condicao: "Para implantação de novos hotéis no Polo Turístico do Cabo Branco",
        base_legal: "Lei Complementar nº 174/2025"
      }
    },

    por_tipo_servico: {
      construcao_civil: { dados_disponiveis: false, obs: "Verificar Prefeitura de João Pessoa" },
      informatica: { dados_disponiveis: false, obs: "Verificar Prefeitura de João Pessoa" },
      saude: { dados_disponiveis: false, obs: "Verificar Prefeitura de João Pessoa" },
      educacao: { dados_disponiveis: false, obs: "Verificar Prefeitura de João Pessoa" },
      servicos_paralelos_construcao: { dados_disponiveis: false, obs: "Verificar Prefeitura de João Pessoa" }
    },

    iss_fixo: {
      dados_disponiveis: false,
      obs: "ISS fixo para autônomos não detalhado — verificar Prefeitura JP"
    }
  },

  // ============================================================
  // 6. IPTU — João Pessoa (capital como referência)
  // ============================================================
  iptu: {
    municipio_referencia: "João Pessoa",
    base_legal: "Lei Complementar nº 53/2008",
    base_calculo: "Valor venal do imóvel (PGV — Padrão Genérico de Valor)",

    aliquotas: {
      residencial: {
        aliquota: 0.01,
        percentual: "1%",
        descricao: "Imóveis residenciais"
      },
      nao_edificado_comercial_servicos_terreno: {
        aliquota: 0.015,
        percentual: "1,5%",
        descricao: "Imóveis não edificados, comerciais, serviços e terrenos"
      },
      servicos_especiais: {
        aliquota: 0.02,
        percentual: "2%",
        descricao: "Serviços especiais (bancos e similares)"
      }
    },

    isencoes: {
      dados_disponiveis: false,
      obs: "Isenções de IPTU não detalhadas — verificar Prefeitura JP"
    }
  },

  // ============================================================
  // 7. ITBI — João Pessoa (capital como referência)
  // ============================================================
  itbi: {
    municipio_referencia: "João Pessoa",
    base_legal: "Lei Complementar nº 53/2008",
    aliquota_geral: 0.03,
    aliquota_geral_percentual: "3%",
    base_calculo: "Valor venal do imóvel",
    observacao: "Imposto indispensável para registro oficial do imóvel no nome do novo proprietário",

    sfh: {
      dados_disponiveis: false,
      obs: "Alíquota SFH não localizada — verificar Prefeitura JP"
    }
  },

  // ============================================================
  // 8. TAXAS ESTADUAIS E MUNICIPAIS
  // ============================================================
  taxas: {
    estaduais: {
      taxa_licenciamento_veiculos: { dados_disponiveis: false, obs: "Verificar SEFAZ/PB" },
      taxa_judiciaria: { dados_disponiveis: false, obs: "Verificar SEFAZ/PB" },
      taxa_servicos_sefaz: { dados_disponiveis: false, obs: "Verificar SEFAZ/PB" },
      taxa_ambiental: { dados_disponiveis: false, obs: "Verificar SEFAZ/PB" },
      taxa_incendio_bombeiros: { dados_disponiveis: false, obs: "Verificar SEFAZ/PB" },
      emolumentos_cartorarios: { dados_disponiveis: false, obs: "Verificar SEFAZ/PB" }
    },
    municipais: {
      taxa_lixo_coleta: { dados_disponiveis: false, obs: "Verificar Prefeitura JP" },
      taxa_alvara: { dados_disponiveis: false, obs: "Verificar Prefeitura JP" },
      taxa_publicidade: { dados_disponiveis: false, obs: "Verificar Prefeitura JP" },
      cosip: { dados_disponiveis: false, obs: "Verificar Prefeitura JP" }
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
      ],
      deducoes: "Conforme legislação federal (dependentes, educação, saúde, etc.)"
    },

    csll: {
      aliquota_geral: 0.09,
      percentual: "9%",
      incentivos_sudene: {
        reducao_aplicavel: true,
        condicoes: "Conforme aprovação e projeto SUDENE"
      }
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

    ipi: { referencia: "Tabela de Incidência do IPI (TIPI) vigente", beneficios_regionais: false },
    iof: { descricao: "Conforme legislação federal" },
    ii: { descricao: "Imposto de Importação — conforme TEC e legislação federal" },
    ie: { descricao: "Imposto de Exportação — conforme legislação federal" },
    itr: { descricao: "Imposto Territorial Rural — conforme legislação federal" },

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
        observacao: "Tabela progressiva 2025 — teto INSS: R$ 8.157,41"
      }
    },

    fgts: { aliquota: 0.08, percentual: "8%", base: "Remuneração mensal do empregado" }
  },

  // ============================================================
  // 10. SIMPLES NACIONAL
  // ============================================================
  simples_nacional: {
    sublimite_estadual: 3600000,
    sublimite_estadual_formatado: "R$ 3.600.000,00",
    sublimite_tipo: "Padrão",
    sublimite_base_legal: "Portaria CGSN nº 49/2024",

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
    sudam: { ativo: false, observacao: "Paraíba não está na abrangência da SUDAM" },

    sudene: {
      ativo: true,
      nome: "Superintendência do Desenvolvimento do Nordeste",
      abrangencia: "Todo o estado da Paraíba",
      beneficios: {
        reducao_irpj: {
          percentual: 0.75,
          descricao: "Redução de 75% do IRPJ devido",
          aliquota_efetiva: 0.0375,
          aliquota_efetiva_percentual: "3,75%"
        },
        reducao_csll: { descricao: "Redução aplicável conforme aprovação e projeto" },
        reinvestimento: { descricao: "Incentivos para reinvestimento de lucros" }
      },
      condicoes: [
        "Projeto aprovado pela SUDENE",
        "Localização na Paraíba",
        "Tipos: instalação, diversificação, modernização",
        "Atender critérios de sustentabilidade SUDENE"
      ],
      base_legal: "Lei nº 9.126/1995"
    },

    zona_franca: { ativo: false },
    alc: { ativo: false },

    programas_estaduais: {
      fain: {
        nome: "Fundo de Apoio à Industrialização (FAIN)",
        ativo: true,
        descricao: "Crédito presumido de ICMS de 48% a 74,25%",
        prazo: "Até dezembro de 2032",
        base_legal: "Legislação estadual"
      },
      beneficios_fiscais_icms: {
        nome: "Benefícios Fiscais Estaduais de ICMS",
        ativo: true,
        descricao: "Isenção, redução da base de cálculo, manutenção de crédito"
      },
      fundo_compensacao: {
        nome: "Fundo de Compensação de Benefícios Fiscais",
        ativo: true,
        descricao: "Regulamenta habilitação de titulares de benefícios de ICMS",
        vigencia: "Portaria publicada em janeiro/2026"
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
      descricao: "Sobre produtos prejudiciais à saúde ou ao meio ambiente",
      dados_disponiveis: false
    },
    impactos_paraiba: {
      itcmd_progressivo: {
        descricao: "ITCMD deve ter alíquota progressiva conforme LC 227/2026",
        observacao: "Paraíba já adota progressividade (2%-4%-6%-8%)"
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
      "ICMS — alíquota padrão 20% (vigente desde 01/01/2024) + histórico 18%",
      "ICMS — alíquotas interestaduais (7% e 12%)",
      "ICMS — importação (4%)",
      "ICMS — FUNCEP existe (percentual não detalhado)",
      "IPVA — alíquotas por tipo (2,5% autos; 1% motos/caminhões novos; 2,5% caminhões usados)",
      "IPVA — isenção motos até 170cc, veículos +15 anos, PCD, fabricados até 2010",
      "ITCMD — progressivo causa mortis (2%, 4%, 6%, 8%)",
      "ITCMD — progressivo doação (2%, 4%, 6%, 8%)",
      "ITCMD — isenção servidores públicos",
      "ISS João Pessoa — alíquota geral 5%",
      "ISS João Pessoa — incentivo hotéis Polo Cabo Branco (redução até 2%)",
      "IPTU João Pessoa — residencial 1%, comercial/terreno 1,5%, especial 2%",
      "ITBI João Pessoa — alíquota 3%",
      "Impostos federais completos (IRPJ, CSLL, PIS, COFINS, INSS, FGTS, IRPF)",
      "Simples Nacional — sublimite R$ 3.600.000 e anexos I-V",
      "MEI — R$ 81.500 / DAS R$ 76,90-81,90",
      "SUDENE — redução 75% IRPJ",
      "FAIN — crédito presumido ICMS 48%-74,25% até dez/2032",
      "Fundo de Compensação de Benefícios Fiscais"
    ],

    nao_localizados: [
      "ICMS — alíquotas diferenciadas (cesta básica, combustíveis, energia, bebidas)",
      "ICMS — FUNCEP percentual específico",
      "ICMS — Substituição Tributária (lista de produtos, MVA)",
      "IPVA — embarcações e aeronaves",
      "IPVA — calendário de vencimento e descontos antecipação",
      "ITCMD — faixas de valor para cada alíquota progressiva",
      "ISS João Pessoa — alíquotas por tipo de serviço",
      "ISS João Pessoa — ISS Fixo (autônomos)",
      "IPTU João Pessoa — isenções",
      "ITBI João Pessoa — alíquota SFH",
      "Taxas estaduais (licenciamento, judiciária, bombeiros, etc.)",
      "Taxas municipais João Pessoa (lixo, alvará, COSIP)"
    ],

    contatos_para_completar: [
      "SEFAZ/PB — https://www.sefaz.pb.gov.br",
      "Prefeitura João Pessoa — https://www.joaopessoa.pb.gov.br",
      "SUDENE — https://www.gov.br/sudene"
    ],

    cobertura_percentual_estimada: "55%",
    observacao: "Boa cobertura de ITCMD progressivo, IPVA e IPTU/ITBI. Gaps em ISS detalhado e alíquotas diferenciadas de ICMS"
  }
};


// ============================================================
// 14. FUNÇÕES UTILITÁRIAS
// ============================================================

function getISSParaiba(tipo) {
  var servico = PARAIBA_TRIBUTARIO.iss.por_tipo_servico[tipo];
  if (!servico) {
    return {
      encontrado: false,
      aliquota: PARAIBA_TRIBUTARIO.iss.aliquota_geral,
      percentual: PARAIBA_TRIBUTARIO.iss.aliquota_geral_percentual,
      mensagem: "Tipo \"" + tipo + "\" não encontrado. Usando alíquota geral de 5%."
    };
  }
  if (servico.dados_disponiveis === false) {
    return {
      encontrado: true,
      aliquota: PARAIBA_TRIBUTARIO.iss.aliquota_geral,
      percentual: PARAIBA_TRIBUTARIO.iss.aliquota_geral_percentual,
      dados_disponiveis: false,
      mensagem: servico.obs + " — usando alíquota geral de 5%"
    };
  }
  return { encontrado: true, aliquota: servico.aliquota, percentual: servico.percentual };
}

function getIPTUResidencialParaiba(valorVenal) {
  if (!valorVenal || valorVenal <= 0) return { erro: true, mensagem: "Valor venal deve ser maior que zero." };
  var aliq = PARAIBA_TRIBUTARIO.iptu.aliquotas.residencial;
  return {
    valor_venal: valorVenal,
    aliquota: aliq.aliquota,
    percentual: aliq.percentual,
    iptu: parseFloat((valorVenal * aliq.aliquota).toFixed(2)),
    tipo: "Residencial"
  };
}

function getIPTUComercialParaiba(valorVenal) {
  if (!valorVenal || valorVenal <= 0) return { erro: true, mensagem: "Valor venal deve ser maior que zero." };
  var aliq = PARAIBA_TRIBUTARIO.iptu.aliquotas.nao_edificado_comercial_servicos_terreno;
  return {
    valor_venal: valorVenal,
    aliquota: aliq.aliquota,
    percentual: aliq.percentual,
    iptu: parseFloat((valorVenal * aliq.aliquota).toFixed(2)),
    tipo: "Comercial / Terreno"
  };
}

function getIPVAParaiba(tipo) {
  var veiculo = PARAIBA_TRIBUTARIO.ipva.aliquotas[tipo];
  if (!veiculo) {
    return {
      encontrado: false,
      aliquota: null,
      mensagem: "Tipo \"" + tipo + "\" não encontrado. Disponíveis: " + Object.keys(PARAIBA_TRIBUTARIO.ipva.aliquotas).join(", ")
    };
  }
  if (veiculo.dados_disponiveis === false) {
    return { encontrado: true, aliquota: null, dados_disponiveis: false, mensagem: veiculo.obs };
  }
  return { encontrado: true, aliquota: veiculo.aliquota, percentual: veiculo.percentual, descricao: veiculo.descricao };
}

function isZonaFrancaParaiba() { return false; }
function isALCParaiba() { return false; }

function getReducaoSUDAMParaiba() {
  return { ativo: false, reducao: 0, mensagem: "Paraíba não está na abrangência da SUDAM." };
}

function getReducaoSUDENEParaiba() {
  return {
    ativo: true,
    reducao_irpj: 0.75,
    reducao_irpj_percentual: "75%",
    aliquota_efetiva_irpj: 0.0375,
    aliquota_efetiva_irpj_percentual: "3,75%",
    condicoes: "Projeto aprovado pela SUDENE",
    base_legal: "Lei nº 9.126/1995"
  };
}

function getICMSEfetivoParaiba() {
  return {
    aliquota_base: 0.20,
    funcep: null,
    efetiva: 0.20,
    percentual: "20%",
    vigencia: "A partir de 01/01/2024",
    observacao: "FUNCEP existe mas percentual não detalhado"
  };
}

function getITCMDCausaMortisParaiba() {
  return {
    tipo: "progressiva",
    faixas: PARAIBA_TRIBUTARIO.itcmd.aliquotas.causa_mortis.faixas,
    observacao: "Faixas de valor para cada alíquota não detalhadas. Alíquotas: 2%, 4%, 6%, 8%.",
    aliquota_minima: 0.02,
    aliquota_maxima: 0.08
  };
}

function getITCMDDoacaoParaiba() {
  return {
    tipo: "progressiva",
    faixas: PARAIBA_TRIBUTARIO.itcmd.aliquotas.doacao.faixas,
    observacao: "Faixas de valor não detalhadas. Alíquotas: 2%, 4%, 6%, 8%.",
    aliquota_minima: 0.02,
    aliquota_maxima: 0.08
  };
}

function calcularITBIParaiba(valorImovel) {
  if (!valorImovel || valorImovel <= 0) return { erro: true, mensagem: "Valor deve ser maior que zero." };
  var aliq = PARAIBA_TRIBUTARIO.itbi.aliquota_geral;
  return {
    valor_imovel: valorImovel,
    aliquota: aliq,
    percentual: PARAIBA_TRIBUTARIO.itbi.aliquota_geral_percentual,
    itbi: parseFloat((valorImovel * aliq).toFixed(2))
  };
}

function getAliquotaEfetivaSimplesParaiba(rbt12, anexo) {
  var tabela = PARAIBA_TRIBUTARIO.simples_nacional.anexos[anexo];
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
    sublimite_icms_iss: PARAIBA_TRIBUTARIO.simples_nacional.sublimite_estadual,
    alerta_sublimite: rbt12 > PARAIBA_TRIBUTARIO.simples_nacional.sublimite_estadual
      ? "⚠️ RBT12 acima do sublimite estadual — ICMS/ISS recolhidos à parte" : null
  };
}

function resumoTributarioParaiba() {
  return {
    estado: "Paraíba (PB)",
    regiao: "Nordeste",
    capital: "João Pessoa",
    icms_padrao: "20%",
    icms_efetivo: "20%",
    ipva_auto: "2,5%",
    ipva_moto: "1%",
    ipva_caminhao_novo: "1%",
    ipva_caminhao_usado: "2,5%",
    itcmd_causa_mortis: "2% a 8% (progressivo)",
    itcmd_doacao: "2% a 8% (progressivo)",
    iss_geral: "5% (João Pessoa)",
    iptu_residencial: "1% (João Pessoa)",
    iptu_comercial: "1,5% (João Pessoa)",
    itbi: "3% (João Pessoa)",
    sublimite_simples: PARAIBA_TRIBUTARIO.simples_nacional.sublimite_estadual_formatado,
    sudene: true,
    sudam: false,
    zona_franca: false,
    programa_estadual: "FAIN (crédito presumido ICMS 48%-74,25%)",
    cobertura_estimada: PARAIBA_TRIBUTARIO.cobertura.cobertura_percentual_estimada
  };
}

function getIncentivosAtivosParaiba() {
  var incentivos = [];
  if (PARAIBA_TRIBUTARIO.incentivos.sudene.ativo) {
    incentivos.push({ nome: "SUDENE", tipo: "Federal", beneficio_principal: "Redução de 75% do IRPJ" });
  }
  var progs = PARAIBA_TRIBUTARIO.incentivos.programas_estaduais;
  for (var chave in progs) {
    var p = progs[chave];
    if (p.ativo) {
      incentivos.push({ nome: p.nome, tipo: "Estadual", beneficio_principal: p.descricao, prazo: p.prazo || null });
    }
  }
  if (PARAIBA_TRIBUTARIO.iss.incentivos_fiscais.hoteis_polo_cabo_branco) {
    incentivos.push({
      nome: "ISS Reduzido — Hotéis Polo Cabo Branco",
      tipo: "Municipal (João Pessoa)",
      beneficio_principal: "Redução ISS até 2% para novos hotéis"
    });
  }
  return incentivos;
}


// ============================================================
// 15. EXPORTAÇÃO
// ============================================================

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        ...PARAIBA_TRIBUTARIO,
        utils: {
            getISS: getISSParaiba,
            getIPVA: getIPVAParaiba,
            getIPTUResidencial: getIPTUResidencialParaiba,
            getIPTUComercial: getIPTUComercialParaiba,
            isZonaFranca: isZonaFrancaParaiba,
            isALC: isALCParaiba,
            getReducaoSUDAM: getReducaoSUDAMParaiba,
            getReducaoSUDENE: getReducaoSUDENEParaiba,
            getICMSEfetivo: getICMSEfetivoParaiba,
            getITCMDCausaMortis: getITCMDCausaMortisParaiba,
            getITCMDDoacao: getITCMDDoacaoParaiba,
            calcularITBI: calcularITBIParaiba,
            getAliquotaEfetivaSimples: getAliquotaEfetivaSimplesParaiba,
            resumoTributario: resumoTributarioParaiba,
            getIncentivosAtivos: getIncentivosAtivosParaiba,
        },
    };
}

if (typeof window !== "undefined") {
    window.PARAIBA_TRIBUTARIO = PARAIBA_TRIBUTARIO;
    window.ParaibaTributario = {
        getISS: getISSParaiba,
        getIPVA: getIPVAParaiba,
        getIPTUResidencial: getIPTUResidencialParaiba,
        getIPTUComercial: getIPTUComercialParaiba,
        isZonaFranca: isZonaFrancaParaiba,
        isALC: isALCParaiba,
        getReducaoSUDAM: getReducaoSUDAMParaiba,
        getReducaoSUDENE: getReducaoSUDENEParaiba,
        getICMSEfetivo: getICMSEfetivoParaiba,
        getITCMDCausaMortis: getITCMDCausaMortisParaiba,
        getITCMDDoacao: getITCMDDoacaoParaiba,
        calcularITBI: calcularITBIParaiba,
        resumo: resumoTributarioParaiba,
        getIncentivosAtivos: getIncentivosAtivosParaiba,
    };
}
