/**
 * ================================================================
 * IMPOST. — Sistema de Análise Tributária do Brasil
 * Arquivo: alagoas.js
 * Estado: Alagoas (AL)
 * Região: Nordeste
 * Capital: Maceió
 * ================================================================
 * Versão: 3.0 — Padronizado conforme modelo roraima.js
 * Data de criação: Fevereiro/2026
 * Fontes: SEFAZ/AL, Receita Federal, legislação oficial,
 *         portais governamentais, SEMEC Maceió
 * ================================================================
 * ESTRUTURA:
 *  1. Dados Gerais
 *  2. ICMS
 *  3. IPVA
 *  4. ITCMD
 *  5. ISS (Maceió)
 *  6. IPTU (Maceió)
 *  7. ITBI (Maceió)
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

const ALAGOAS_TRIBUTARIO = {

  // ============================================================
  // 1. DADOS GERAIS DO ESTADO
  // ============================================================
  dados_gerais: {
    nome: "Alagoas",
    sigla: "AL",
    regiao: "Nordeste",
    capital: "Maceió",
    codigo_ibge: "27",
    gentilico: "Alagoano(a)",
    zona_franca: {
      existe: false,
      observacao: "Não há Zona Franca em Alagoas"
    },
    alc: {
      existe: false,
      observacao: "Não há Área de Livre Comércio em Alagoas"
    },
    sudam: {
      abrangencia: false,
      observacao: "Alagoas não está na área de abrangência da SUDAM"
    },
    sudene: {
      abrangencia: true,
      beneficios: "Redução de IRPJ até 75%, redução de CSLL, incentivos para projetos aprovados",
      base_legal: "Lei nº 9.126/1995 e legislação SUDENE"
    },
    suframa: {
      abrangencia: false,
      observacao: "Alagoas não está na área de abrangência da SUFRAMA"
    },
    sefaz: {
      url: "https://www.sefaz.al.gov.br",
      telefone: null,
      email: null
    },
    prefeitura_capital: {
      url: "https://maceio.al.gov.br",
      semec_url: "https://semecmaceio.com"
    },
    legislacao_base: {
      icms: "Lei nº 5.900/1996 (alíquota 19%); Lei nº 9.776/2025 (alíquota 20,5% a partir de 01/04/2026)",
      ipva: "Lei nº 7.745/2015; Lei nº 9.780/2025",
      itcmd: "Decreto nº 53.609/2017 (4% causa mortis; 2% doação)",
      codigo_tributario_maceio: "Lei nº 4.486/1996 (Código Tributário de Maceió)"
    },
    observacoes: [
      "Alagoas tinha a 8ª mais baixa carga tributária do Brasil em 2023 com 19%",
      "Estado abrangido pela SUDENE — benefícios fiscais federais aplicáveis"
    ]
  },

  // ============================================================
  // 2. ICMS (Imposto sobre Circulação de Mercadorias e Serviços)
  // ============================================================
  icms: {
    aliquota_padrao: 0.19,
    aliquota_padrao_percentual: "19%",
    aliquota_padrao_vigencia: "Até 31/03/2026",
    aliquota_padrao_base_legal: "Lei nº 5.900/1996, Art. 17, I, 'b'",

    aliquota_padrao_novo: {
      valor: 0.205,
      percentual: "20,5%",
      vigencia: "A partir de 01/04/2026",
      base_legal: "Lei nº 9.776/2025"
    },

    fecoep: {
      existe: true,
      nome: "Fundo Estadual de Combate e Erradicação da Pobreza (FECOEP)",
      adicional_padrao: 0.01,
      adicional_padrao_percentual: "1%",
      adicional_extra: 0.02,
      adicional_extra_percentual: "2%",
      adicional_extra_vigencia: "A partir de 01/04/2025",
      adicional_extra_obs: "Alguns produtos ganham adicional de 2% para o FECOEP",
      base_legal: "Instrução Normativa Conjunta SEFAZ",
      observacao: "Soma-se à alíquota base (ex: 19% + 1% = 20% efetivo)"
    },

    aliquota_efetiva_padrao: 0.20,
    aliquota_efetiva_padrao_percentual: "20% (19% + 1% FECOEP)",

    aliquotas_diferenciadas: {
      servicos_transporte_aereo: {
        aliquota: 0.12,
        fecoep: 0.01,
        efetiva: 0.13,
        percentual: "13% (12% + 1%)",
        descricao: "Serviços de transporte aéreo"
      },
      alcool_etilico_hidratado: {
        aliquota: 0.19,
        fecoep: 0.01,
        efetiva: 0.20,
        percentual: "20% (19% + 1%)",
        descricao: "Álcool etílico hidratado combustível (AEHC)"
      },
      bebidas_alcoolicas: {
        aliquota: 0.27,
        fecoep: 0.02,
        efetiva: 0.29,
        percentual: "29% (27% + 2%)",
        descricao: "Bebidas alcoólicas"
      },
      fogos_de_artificio: {
        aliquota: 0.12,
        fecoep: 0.02,
        efetiva: 0.14,
        percentual: "14% (12% + 2%)",
        descricao: "Fogos de artifício"
      },
      embarcacoes_esporte_recreio: {
        aliquota: 0.12,
        fecoep: 0.02,
        efetiva: 0.14,
        percentual: "14% (12% + 2%)",
        descricao: "Motores de popa, barcos, jet ski, iates, esquis aquáticos, pranchas"
      },
      ultraleves_asas_deltas: {
        aliquota: 0.12,
        fecoep: 0.02,
        efetiva: 0.14,
        percentual: "14% (12% + 2%)",
        descricao: "Balões, dirigíveis, planadores, veículos aéreos"
      },
      rodas_esportivas: {
        aliquota: 0.25,
        fecoep: 0.02,
        efetiva: 0.27,
        percentual: "27% (25% + 2%)",
        descricao: "Rodas esportivas para automóveis"
      },
      energia_eletrica_acima_150kwh: {
        aliquota: 0.19,
        fecoep: 0.01,
        efetiva: 0.20,
        percentual: "20% (19% + 1%)",
        descricao: "Fornecimento acima de 150 kWh/mês para consumo domiciliar e comercial"
      },
      perfumaria_aguas_colonia: {
        aliquota: 0.25,
        fecoep: 0.02,
        efetiva: 0.27,
        percentual: "27% (25% + 2%)",
        descricao: "Perfumaria e águas de colônia",
        ncm: "3303.00"
      },
      produtos_beleza_maquilagem: {
        aliquota: 0.25,
        fecoep: 0.02,
        efetiva: 0.27,
        percentual: "27% (25% + 2%)",
        descricao: "Produtos de beleza, maquilagem, anti-solares, bronzeadores, manicure/pedicure",
        ncm: "3304"
      },
      medicamentos: {
        aliquota: 0.00,
        fecoep: 0.00,
        efetiva: 0.00,
        percentual: "0%",
        descricao: "Medicamentos — conforme legislação federal"
      },
      cesta_basica: {
        dados_disponiveis: false,
        obs: "Alíquota de cesta básica não localizada — verificar SEFAZ/AL"
      },
      combustiveis: {
        dados_disponiveis: false,
        obs: "Alíquotas de combustíveis não localizadas — verificar SEFAZ/AL"
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
        aliquota: 0.19,
        percentual: "19%",
        descricao: "Operações com não contribuintes (EC 87/2015)"
      }
    },

    icms_importacao: {
      aliquota: 0.04,
      percentual: "4%",
      descricao: "Alíquota fixa para mercadorias importadas (Resolução SF nº 13/2012)"
    },

    substituicao_tributaria: {
      dados_disponiveis: false,
      obs: "Lista de produtos sujeitos à ST e MVA não incluída nesta pesquisa — verificar SEFAZ/AL"
    }
  },

  // ============================================================
  // 3. IPVA (Imposto sobre Propriedade de Veículos Automotores)
  // ============================================================
  ipva: {
    base_legal: "Lei nº 7.745/2015; Lei nº 9.780/2025",
    base_calculo: "Valor venal conforme tabela FIPE",
    carga_tributaria_media: 0.0262,
    carga_tributaria_media_percentual: "2,62% (média ponderada)",

    aliquotas: {
      automovel_acima_160cv: {
        aliquota: 0.0325,
        percentual: "3,25%",
        descricao: "Carros de passeio e similares acima de 160 cv"
      },
      automovel_80_a_160cv: {
        aliquota: 0.03,
        percentual: "3%",
        descricao: "Carros de passeio e similares de 80 cv a 160 cv"
      },
      automovel_ate_80cv: {
        aliquota: 0.02,
        percentual: "2%",
        descricao: "Carros de passeio e similares até 80 cv"
      },
      motocicleta: {
        dados_disponiveis: false,
        obs: "Alíquota geral de motocicletas não localizada — verificar SEFAZ/AL"
      },
      caminhao: {
        dados_disponiveis: false,
        obs: "Alíquota de caminhões não localizada — verificar SEFAZ/AL"
      },
      onibus_micro_onibus: {
        dados_disponiveis: false,
        obs: "Alíquota de ônibus/micro-ônibus não localizada — verificar SEFAZ/AL"
      },
      locadora: {
        dados_disponiveis: false,
        obs: "Alíquota para veículos de locadoras não localizada — verificar SEFAZ/AL"
      },
      eletrico: {
        dados_disponiveis: false,
        obs: "Alíquota de veículos elétricos não localizada — verificar SEFAZ/AL"
      },
      hibrido: {
        dados_disponiveis: false,
        obs: "Alíquota de veículos híbridos não localizada — verificar SEFAZ/AL"
      },
      embarcacao: {
        dados_disponiveis: false,
        obs: "Alíquota de embarcações não localizada — verificar SEFAZ/AL"
      },
      aeronave: {
        dados_disponiveis: false,
        obs: "Alíquota de aeronaves não localizada — verificar SEFAZ/AL"
      }
    },

    isencoes: [
      {
        tipo: "Motocicletas até 50cc",
        descricao: "Isenção total de IPVA",
        base_legal: "Lei nº 7.745/2015"
      },
      {
        tipo: "Motocicletas até 175cc (fabricação nacional)",
        descricao: "Isenção total de IPVA",
        vigencia: "A partir de 2023",
        base_legal: "Lei nº 9.780/2025"
      },
      {
        tipo: "Veículos com mais de 20 anos de fabricação",
        descricao: "Isenção total de IPVA"
      },
      {
        tipo: "Veículos PCD",
        descricao: "Isenção para automóvel de passeio de pessoa com deficiência física, visual ou mental",
        base_legal: "Lei nº 7.745/2015"
      },
      {
        tipo: "Ciclomotores",
        descricao: "Dispensa de débitos de IPVA e taxa de licenciamento"
      }
    ],

    descontos_antecipacao: {
      percentual: 0.05,
      percentual_texto: "5% de desconto",
      vigencia: "2025",
      observacao: "Conforme publicação da tabela de valores-base"
    },

    calendario_vencimento: {
      dados_disponiveis: false,
      obs: "Calendário de vencimento por final de placa não localizado — verificar SEFAZ/AL"
    }
  },

  // ============================================================
  // 4. ITCMD (Imposto sobre Transmissão Causa Mortis e Doação)
  // ============================================================
  itcmd: {
    base_legal: "Decreto nº 53.609/2017; Lei Complementar nº 227/2026",

    aliquotas: {
      causa_mortis: {
        tipo: "fixa",
        aliquota: 0.04,
        percentual: "4%",
        descricao: "Transmissão causa mortis (óbitos a partir de 01/04/2017)"
      },
      doacao: {
        tipo: "fixa",
        aliquota: 0.02,
        percentual: "2%",
        descricao: "Doação de quaisquer bens ou direitos"
      }
    },

    progressividade: {
      implementada: false,
      observacao: "Alagoas ainda não implementou alíquotas progressivas — LC 227/2026 torna obrigatória a progressividade"
    },

    base_calculo: "Valor venal do bem ou direito transmitido (valor de mercado ou valor real)",

    isencoes: {
      dados_disponiveis: false,
      obs: "Limites de isenção para imóvel urbano/rural não localizados — verificar SEFAZ/AL"
    },

    prazo_pagamento: {
      dados_disponiveis: false,
      obs: "Prazo de pagamento não localizado — verificar SEFAZ/AL"
    }
  },

  // ============================================================
  // 5. ISS — Maceió (capital como referência)
  // ============================================================
  iss: {
    municipio_referencia: "Maceió",
    base_legal: "Lei nº 4.486/1996 (Código Tributário de Maceió)",
    aliquota_minima: 0.01,
    aliquota_maxima: 0.05,
    aliquota_minima_percentual: "1%",
    aliquota_maxima_percentual: "5%",
    observacao: "Alíquotas variam conforme tipo de serviço",

    por_tipo_servico: {
      construcao_civil: {
        aliquota: 0.05,
        percentual: "5%",
        observacao: "Abatimento de materiais/sub-empreitada disponível"
      },
      informatica: {
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEMEC Maceió"
      },
      saude: {
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEMEC Maceió"
      },
      educacao: {
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEMEC Maceió"
      },
      servicos_paralelos_construcao: {
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEMEC Maceió"
      }
    },

    iss_fixo: {
      existe: true,
      descricao: "ISS Fixo para prestadores de serviços autônomos",
      valor: null,
      dados_disponiveis: false,
      obs: "Valor do ISS fixo não localizado — verificar SEMEC Maceió"
    }
  },

  // ============================================================
  // 6. IPTU — Maceió (capital como referência)
  // ============================================================
  iptu: {
    municipio_referencia: "Maceió",
    base_legal: "Lei nº 4.486/1996 (Código Tributário de Maceió)",
    base_calculo: "Valor venal do imóvel (valor de mercado estimado)",

    aliquotas_residencial: {
      dados_disponiveis: false,
      obs: "Alíquotas residenciais por faixa de área não localizadas — verificar Prefeitura de Maceió"
    },

    aliquotas_nao_residencial: {
      dados_disponiveis: false,
      obs: "Alíquotas comerciais/não-residenciais não localizadas — verificar Prefeitura de Maceió"
    },

    aliquota_terreno_nao_edificado: {
      dados_disponiveis: false,
      obs: "Alíquota de terreno não edificado não localizada — verificar Prefeitura de Maceió"
    },

    isencoes: [
      {
        tipo: "Imóvel pequeno (residencial)",
        descricao: "Isenção do IPTU para imóveis com área construída < 120m² e terreno < 250m² (casas)",
        observacao: "Mantida cobrança de taxa de lixo mesmo com isenção do IPTU"
      }
    ]
  },

  // ============================================================
  // 7. ITBI — Maceió (capital como referência)
  // ============================================================
  itbi: {
    municipio_referencia: "Maceió",
    base_legal: "Lei nº 4.486/1996 (Código Tributário de Maceió)",
    aliquota_minima: 0.01,
    aliquota_maxima: 0.02,
    aliquota_minima_percentual: "1%",
    aliquota_maxima_percentual: "2%",
    base_calculo: "Valor venal do imóvel",
    observacao: "Alíquota de 2% foi estendida até 31/08 (conforme notícia de 2021)",

    sfh: {
      dados_disponiveis: false,
      obs: "Alíquota específica SFH não localizada — verificar Prefeitura de Maceió"
    }
  },

  // ============================================================
  // 8. TAXAS ESTADUAIS E MUNICIPAIS
  // ============================================================
  taxas: {
    estaduais: {
      taxa_licenciamento_veiculos: {
        dados_disponiveis: false,
        obs: "Verificar SEFAZ/AL"
      },
      taxa_judiciaria: {
        dados_disponiveis: false,
        obs: "Verificar SEFAZ/AL"
      },
      taxa_servicos_sefaz: {
        dados_disponiveis: false,
        obs: "Verificar SEFAZ/AL"
      },
      taxa_ambiental: {
        dados_disponiveis: false,
        obs: "Verificar SEFAZ/AL"
      },
      taxa_incendio_bombeiros: {
        dados_disponiveis: false,
        obs: "Verificar SEFAZ/AL"
      },
      emolumentos_cartorarios: {
        dados_disponiveis: false,
        obs: "Verificar SEFAZ/AL"
      }
    },
    municipais: {
      taxa_lixo_coleta: {
        dados_disponiveis: false,
        obs: "Verificar SEMEC Maceió"
      },
      taxa_alvara_funcionamento: {
        dados_disponiveis: false,
        obs: "Verificar SEMEC Maceió"
      },
      taxa_publicidade: {
        dados_disponiveis: false,
        obs: "Verificar SEMEC Maceió"
      },
      cosip: {
        dados_disponiveis: false,
        obs: "Verificar Prefeitura de Maceió"
      }
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
          descricao: "Sobre excedente de R$ 20.000,00/mês"
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
          descricao: "Sobre excedente de R$ 60.000,00/trimestre"
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
      base: "Lucro líquido ajustado (Lucro Real) ou receita bruta presumida (Lucro Presumido)",
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
      observacao: "Sem benefícios específicos de IPI para Alagoas"
    },

    iof: {
      descricao: "Conforme legislação federal — sem especificidade estadual"
    },

    ii: {
      descricao: "Imposto de Importação — conforme TEC (Tarifa Externa Comum) e legislação federal"
    },

    ie: {
      descricao: "Imposto de Exportação — conforme legislação federal"
    },

    itr: {
      descricao: "Imposto Territorial Rural — conforme legislação federal"
    },

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
        observacao: "Tabela progressiva 2025 — teto do INSS: R$ 8.157,41"
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
    sublimite_observacao: "Alagoas adota o sublimite padrão para recolhimento de ICMS/ISS",

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
        nome: "Serviços (grupo 1 — locação, academias, etc.)",
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
        nome: "Serviços (grupo 3 — engenharia, TI, contabilidade, etc.)",
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
      observacao: "Alagoas não está na abrangência da SUDAM"
    },

    sudene: {
      ativo: true,
      nome: "Superintendência do Desenvolvimento do Nordeste",
      abrangencia: "Todo o estado de Alagoas",
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
          descricao: "Incentivos para reinvestimento de lucros conforme legislação específica"
        }
      },
      condicoes: [
        "Projeto aprovado pela SUDENE",
        "Localização no Nordeste (Alagoas)",
        "Tipos: instalação, diversificação, modernização",
        "Atender critérios de sustentabilidade SUDENE"
      ],
      setores_prioritarios: [
        "Agronegócio", "Indústria", "Infraestrutura",
        "Turismo", "Tecnologia", "Energia renovável"
      ],
      base_legal: "Lei nº 9.126/1995 e legislação SUDENE"
    },

    zona_franca: {
      ativo: false,
      observacao: "Não aplicável em Alagoas"
    },

    alc: {
      ativo: false,
      observacao: "Não há Área de Livre Comércio em Alagoas"
    },

    programas_estaduais: {
      programa_cresce_alagoas: {
        nome: "Programa Cresce Alagoas",
        ativo: true,
        base_legal: "Decreto nº 99.350/2024",
        vigencia: "A partir de setembro/2024",
        beneficios: [
          "Diferimento do ICMS na aquisição de bens do ativo imobilizado",
          "Diferimento do ICMS na aquisição de matéria-prima",
          "Diferimento do ICMS na aquisição de energia elétrica",
          "Diferimento do ICMS na aquisição de gás natural"
        ],
        objetivo: "Atrair investimentos e crescimento sustentável de pequenos negócios",
        ampliacao: "Em junho/2025 o governo ampliou acesso de pequenos negócios aos incentivos"
      },

      beneficio_importacao: {
        nome: "Benefício fiscal para importações",
        ativo: true,
        descricao: "Diferimento de ICMS nas importações — redução do imposto mais alto",
        base_legal: "Legislação estadual específica"
      }
    },

    isencoes_especificas: {
      agricultura_familiar: {
        dados_disponiveis: false,
        obs: "Verificar SEFAZ/AL"
      },
      cooperativas: {
        dados_disponiveis: false,
        obs: "Verificar SEFAZ/AL"
      },
      exportadores: {
        dados_disponiveis: false,
        obs: "Verificar SEFAZ/AL"
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
      aliquota_estadual_prevista: null,
      cronograma: "Transição gradual conforme legislação federal",
      dados_disponiveis: false,
      obs: "Alíquota estadual ainda não definida"
    },
    cbs: {
      nome: "Contribuição sobre Bens e Serviços",
      substituira: "PIS/COFINS (federal)",
      aliquota_prevista: null,
      cronograma: "Transição gradual conforme legislação federal",
      dados_disponiveis: false,
      obs: "Alíquota ainda não definida"
    },
    is: {
      nome: "Imposto Seletivo",
      descricao: "Incidirá sobre produtos prejudiciais à saúde ou ao meio ambiente",
      produtos_afetados: null,
      aliquotas_estimadas: null,
      dados_disponiveis: false,
      obs: "Detalhes ainda não definidos para Alagoas"
    },
    impactos_alagoas: {
      itcmd_progressivo: {
        descricao: "LC 227/2026 torna obrigatória a progressividade no ITCMD",
        status: "Alagoas ainda não implementou — adequação necessária"
      },
      fundo_desenvolvimento_regional: {
        dados_disponiveis: false,
        obs: "Verificar SEFAZ/AL"
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
      "ICMS — alíquota padrão vigente (19%) e futura (20,5%)",
      "ICMS — FECOEP (1% padrão, 2% adicional para alguns produtos)",
      "ICMS — alíquotas diferenciadas (bebidas, perfumaria, embarcações, fogos, etc.)",
      "ICMS — alíquotas interestaduais",
      "ICMS — importação (4%)",
      "IPVA — alíquotas por faixa de potência (2% a 3,25%)",
      "IPVA — isenções (motos até 50cc, até 175cc nacionais, +20 anos, PCD, ciclomotores)",
      "IPVA — desconto de 5% para antecipação (2025)",
      "ITCMD — alíquotas fixas (4% causa mortis, 2% doação)",
      "ISS Maceió — faixa de 1% a 5%, construção civil 5%",
      "ITBI Maceió — faixa de 1% a 2%",
      "IPTU Maceió — isenção para imóvel < 120m²/250m²",
      "Impostos federais completos (IRPJ, CSLL, PIS, COFINS, INSS, FGTS)",
      "Tabela IRPF 2026 (anual)",
      "Simples Nacional — sublimite R$ 3.600.000 e anexos I-V",
      "MEI — valores DAS 2025",
      "SUDENE — redução 75% IRPJ, CSLL, reinvestimento",
      "Programa Cresce Alagoas — diferimento de ICMS",
      "Benefício fiscal para importações com diferimento"
    ],

    nao_localizados: [
      "ICMS — cesta básica (alíquota específica)",
      "ICMS — combustíveis (alíquotas específicas)",
      "ICMS — Substituição Tributária (lista de produtos, MVA)",
      "IPVA — motocicletas (alíquota geral), caminhões, ônibus, locadoras, elétricos, híbridos, embarcações, aeronaves",
      "IPVA — calendário de vencimento por placa",
      "ITCMD — isenções específicas (limites de valor)",
      "ITCMD — prazo de pagamento",
      "ISS Maceió — alíquotas por tipo (informática, saúde, educação)",
      "ISS Maceió — valor do ISS Fixo (autônomos)",
      "IPTU Maceió — alíquotas residenciais e comerciais por faixa",
      "IPTU Maceió — terreno não edificado",
      "ITBI Maceió — alíquota SFH",
      "Taxas estaduais (licenciamento, judiciária, SEFAZ, ambiental, bombeiros, cartórios)",
      "Taxas municipais (lixo, alvará, publicidade, COSIP)",
      "Reforma Tributária — alíquotas IBS/CBS para Alagoas",
      "Incentivos — agricultura familiar, cooperativas, exportadores"
    ],

    contatos_para_completar: [
      "SEFAZ/AL — https://www.sefaz.al.gov.br",
      "SEMEC Maceió — https://semecmaceio.com",
      "Prefeitura de Maceió — https://maceio.al.gov.br",
      "SUDENE — https://www.gov.br/sudene"
    ],

    cobertura_percentual_estimada: "55%",
    observacao: "Dados municipais (ISS, IPTU, ITBI detalhados) e taxas estaduais são os maiores gaps"
  }
};


// ============================================================
// 14. FUNÇÕES UTILITÁRIAS
// ============================================================

/**
 * Retorna alíquota ISS por tipo de serviço em Maceió
 * @param {string} tipo - Tipo de serviço (ex: "construcao_civil", "informatica")
 * @returns {object} Objeto com alíquota e informações
 */
function getISSAlagoas(tipo) {
  const servico = ALAGOAS_TRIBUTARIO.iss.por_tipo_servico[tipo];
  if (!servico) {
    return {
      encontrado: false,
      aliquota: null,
      mensagem: `Tipo de serviço "${tipo}" não encontrado. Tipos disponíveis: ${Object.keys(ALAGOAS_TRIBUTARIO.iss.por_tipo_servico).join(", ")}`
    };
  }
  if (servico.dados_disponiveis === false) {
    return {
      encontrado: true,
      aliquota: null,
      dados_disponiveis: false,
      mensagem: servico.obs
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
 * Retorna alíquota IPTU residencial por área em Maceió
 * @param {number} areaM2 - Área em metros quadrados
 * @returns {object} Informações do IPTU
 */
function getIPTUResidencialAlagoas(areaM2) {
  // Verifica isenção
  if (areaM2 < 120) {
    return {
      aliquota: 0,
      percentual: "Isento",
      descricao: "Imóvel com área < 120m² — isenção de IPTU (taxa de lixo mantida)"
    };
  }
  return {
    aliquota: null,
    dados_disponiveis: false,
    mensagem: "Alíquotas residenciais por faixa de área não localizadas para Maceió — verificar Prefeitura"
  };
}

/**
 * Retorna alíquota IPTU comercial por área em Maceió
 * @param {number} areaM2 - Área em metros quadrados
 * @returns {object} Informações do IPTU comercial
 */
function getIPTUComercialAlagoas(areaM2) {
  return {
    aliquota: null,
    dados_disponiveis: false,
    mensagem: "Alíquotas comerciais por faixa de área não localizadas para Maceió — verificar Prefeitura"
  };
}

/**
 * Retorna alíquota IPVA por tipo de veículo
 * @param {string} tipo - Tipo (ex: "automovel_ate_80cv", "automovel_80_a_160cv", "automovel_acima_160cv")
 * @returns {object} Objeto com alíquota e informações
 */
function getIPVAAlagoas(tipo) {
  const veiculo = ALAGOAS_TRIBUTARIO.ipva.aliquotas[tipo];
  if (!veiculo) {
    return {
      encontrado: false,
      aliquota: null,
      mensagem: `Tipo "${tipo}" não encontrado. Tipos disponíveis: ${Object.keys(ALAGOAS_TRIBUTARIO.ipva.aliquotas).join(", ")}`
    };
  }
  if (veiculo.dados_disponiveis === false) {
    return {
      encontrado: true,
      aliquota: null,
      dados_disponiveis: false,
      mensagem: veiculo.obs
    };
  }
  return {
    encontrado: true,
    aliquota: veiculo.aliquota,
    percentual: veiculo.percentual,
    descricao: veiculo.descricao
  };
}

/**
 * Verifica se município está em Zona Franca
 * @param {string} municipio - Nome do município
 * @returns {boolean}
 */
function isZonaFrancaAlagoas(municipio) {
  return false; // Alagoas não possui Zona Franca
}

/**
 * Verifica se município está em Área de Livre Comércio
 * @param {string} municipio - Nome do município
 * @returns {boolean}
 */
function isALCAlagoas(municipio) {
  return false; // Alagoas não possui ALC
}

/**
 * Retorna a redução SUDAM (não aplicável em Alagoas)
 * @returns {object}
 */
function getReducaoSUDAMAlagoas() {
  return {
    ativo: false,
    reducao: 0,
    mensagem: "Alagoas não está na abrangência da SUDAM. Utilize getReducaoSUDENE()."
  };
}

/**
 * Retorna a redução SUDENE aplicável em Alagoas
 * @returns {object}
 */
function getReducaoSUDENEAlagoas() {
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

/**
 * Retorna ICMS efetivo (alíquota padrão + FECOEP)
 * @param {boolean} usarNovo - Se true, usa alíquota de 20,5% (a partir de 01/04/2026)
 * @returns {object}
 */
function getICMSEfetivoAlagoas(usarNovo) {
  if (usarNovo) {
    return {
      aliquota_base: 0.205,
      fecoep: 0.01,
      efetiva: 0.215,
      percentual: "21,5% (20,5% + 1% FECOEP)",
      vigencia: "A partir de 01/04/2026"
    };
  }
  return {
    aliquota_base: 0.19,
    fecoep: 0.01,
    efetiva: 0.20,
    percentual: "20% (19% + 1% FECOEP)",
    vigencia: "Até 31/03/2026"
  };
}

/**
 * Calcula alíquota efetiva do Simples Nacional
 * @param {number} rbt12 - Receita Bruta dos últimos 12 meses
 * @param {string} anexo - "anexo_i", "anexo_ii", "anexo_iii", "anexo_iv", "anexo_v"
 * @returns {object}
 */
function getAliquotaEfetivaSimplesAlagoas(rbt12, anexo) {
  const tabela = ALAGOAS_TRIBUTARIO.simples_nacional.anexos[anexo];
  if (!tabela) {
    return { erro: true, mensagem: `Anexo "${anexo}" não encontrado.` };
  }
  if (rbt12 <= 0) {
    return { erro: true, mensagem: "RBT12 deve ser maior que zero." };
  }
  if (rbt12 > 4800000) {
    return { erro: true, mensagem: "RBT12 excede o limite do Simples Nacional (R$ 4.800.000,00)." };
  }

  let faixaSelecionada = null;
  for (const faixa of tabela.faixas) {
    if (rbt12 <= faixa.ate) {
      faixaSelecionada = faixa;
      break;
    }
  }

  if (!faixaSelecionada) {
    return { erro: true, mensagem: "Faixa não encontrada." };
  }

  const aliquotaEfetiva = ((rbt12 * faixaSelecionada.aliquota) - faixaSelecionada.deducao) / rbt12;

  return {
    erro: false,
    rbt12: rbt12,
    anexo: tabela.nome,
    faixa: faixaSelecionada.faixa,
    aliquota_nominal: faixaSelecionada.aliquota,
    deducao: faixaSelecionada.deducao,
    aliquota_efetiva: parseFloat(aliquotaEfetiva.toFixed(6)),
    aliquota_efetiva_percentual: (aliquotaEfetiva * 100).toFixed(2) + "%",
    sublimite_icms_iss: ALAGOAS_TRIBUTARIO.simples_nacional.sublimite_estadual,
    alerta_sublimite: rbt12 > ALAGOAS_TRIBUTARIO.simples_nacional.sublimite_estadual
      ? "⚠️ RBT12 acima do sublimite estadual — ICMS/ISS recolhidos à parte"
      : null
  };
}

/**
 * Resumo tributário rápido do estado
 * @returns {object}
 */
function resumoTributarioAlagoas() {
  return {
    estado: "Alagoas (AL)",
    regiao: "Nordeste",
    capital: "Maceió",
    icms_padrao: ALAGOAS_TRIBUTARIO.icms.aliquota_padrao,
    icms_padrao_percentual: ALAGOAS_TRIBUTARIO.icms.aliquota_padrao_percentual,
    icms_efetivo: ALAGOAS_TRIBUTARIO.icms.aliquota_efetiva_padrao,
    icms_efetivo_percentual: ALAGOAS_TRIBUTARIO.icms.aliquota_efetiva_padrao_percentual,
    icms_futuro: "20,5% + 1% FECOEP = 21,5% (a partir de 01/04/2026)",
    fecoep: "1% padrão (2% para alguns produtos)",
    ipva_faixa: "2% a 3,25% (conforme potência)",
    itcmd_causa_mortis: "4%",
    itcmd_doacao: "2%",
    iss_faixa: "1% a 5% (Maceió)",
    itbi_faixa: "1% a 2% (Maceió)",
    sublimite_simples: ALAGOAS_TRIBUTARIO.simples_nacional.sublimite_estadual_formatado,
    sudene: true,
    sudam: false,
    zona_franca: false,
    programa_estadual: "Cresce Alagoas (diferimento de ICMS)",
    cobertura_estimada: ALAGOAS_TRIBUTARIO.cobertura.cobertura_percentual_estimada
  };
}

/**
 * Lista incentivos fiscais ativos em Alagoas
 * @returns {object}
 */
function getIncentivosAtivosAlagoas() {
  const incentivos = [];

  if (ALAGOAS_TRIBUTARIO.incentivos.sudene.ativo) {
    incentivos.push({
      nome: "SUDENE",
      tipo: "Federal",
      beneficio_principal: "Redução de 75% do IRPJ",
      aliquota_efetiva: "3,75%"
    });
  }

  const programas = ALAGOAS_TRIBUTARIO.incentivos.programas_estaduais;
  for (const [chave, prog] of Object.entries(programas)) {
    if (prog.ativo) {
      incentivos.push({
        nome: prog.nome,
        tipo: "Estadual",
        beneficio_principal: Array.isArray(prog.beneficios) ? prog.beneficios[0] : prog.descricao,
        base_legal: prog.base_legal
      });
    }
  }

  return incentivos;
}


// ═══════════════════════════════════════════════════════════════════════════
//  15. EXPORTAÇÃO (Padrão Grupo 2)
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        ...ALAGOAS_TRIBUTARIO,
        utils: {
            getISS: getISSAlagoas,
            getIPVA: getIPVAAlagoas,
            getIPTUResidencial: getIPTUResidencialAlagoas,
            getIPTUComercial: getIPTUComercialAlagoas,
            isZonaFranca: isZonaFrancaAlagoas,
            isALC: isALCAlagoas,
            getReducaoSUDAM: getReducaoSUDAMAlagoas,
            getReducaoSUDENE: getReducaoSUDENEAlagoas,
            getICMSEfetivo: getICMSEfetivoAlagoas,
            getAliquotaEfetivaSimples: getAliquotaEfetivaSimplesAlagoas,
            resumoTributario: resumoTributarioAlagoas,
            getIncentivosAtivos: getIncentivosAtivosAlagoas,
        },
    };
}

if (typeof window !== "undefined") {
    window.ALAGOAS_TRIBUTARIO = ALAGOAS_TRIBUTARIO;
    window.AlagoasTributario = {
        getISS: getISSAlagoas,
        getIPVA: getIPVAAlagoas,
        getIPTUResidencial: getIPTUResidencialAlagoas,
        getIPTUComercial: getIPTUComercialAlagoas,
        isZonaFranca: isZonaFrancaAlagoas,
        isALC: isALCAlagoas,
        getReducaoSUDAM: getReducaoSUDAMAlagoas,
        getReducaoSUDENE: getReducaoSUDENEAlagoas,
        getICMSEfetivo: getICMSEfetivoAlagoas,
        getAliquotaEfetivaSimples: getAliquotaEfetivaSimplesAlagoas,
        resumoTributario: resumoTributarioAlagoas,
        getIncentivosAtivos: getIncentivosAtivosAlagoas,
    };
}
