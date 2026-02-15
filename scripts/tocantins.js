/**
 * ============================================================
 * IMPOST. — Sistema de Análise Tributária
 * Arquivo: tocantins.js
 * Estado: Tocantins (TO)
 * Região: Norte
 * Capital: Palmas
 * Versão: 3.0 — Padronizado conforme modelo roraima.js
 * Última atualização: Fevereiro de 2026
 * Fontes: SEFAZ/TO, Receita Federal, legislação oficial, Prefeitura de Palmas
 * ============================================================
 */

const TOCANTINS_TRIBUTARIO = {

  // ============================================================
  // 1. DADOS GERAIS DO ESTADO
  // ============================================================
  dados_gerais: {
    nome: "Tocantins",
    sigla: "TO",
    regiao: "Norte",
    capital: "Palmas",
    codigo_ibge: "17",
    zona_franca: {
      existe: false,
      observacao: "Não há Zona Franca em Tocantins"
    },
    alc: {
      existe: false,
      observacao: "Não há Área de Livre Comércio em Tocantins"
    },
    sudam: {
      abrangencia: true,
      beneficios: "Redução de IRPJ até 75%, redução de CSLL, incentivos para projetos aprovados até 31/12/2028"
    },
    sudene: {
      abrangencia: false,
      observacao: "Tocantins não está na área de abrangência da SUDENE"
    },
    suframa: {
      abrangencia: true,
      descricao: "Benefícios de IPI e outros incentivos fiscais em áreas específicas"
    },
    sefaz: {
      url: "https://portal.sefaz.to.gov.br",
      legislacao: "https://dtri.sefaz.to.gov.br",
      ipva: "https://ipva.sefaz.to.gov.br",
      contato: "DADO NÃO LOCALIZADO"
    },
    prefeitura_capital: {
      url: "https://www.palmas.to.gov.br",
      contato: "DADO NÃO LOCALIZADO"
    },
    legislacao_base: {
      icms: "Lei nº 2.657/1996; Medida Provisória nº 33/2022; Decreto nº 6.696/2023",
      ipva: "Lei nº 1.303/2002",
      itcmd: "Lei nº 109/1989; Lei Complementar nº 227/2026",
      codigo_tributario_palmas: "Lei Complementar nº 107/2005 (Código Tributário de Palmas)"
    }
  },

  // ============================================================
  // 2. ICMS — Imposto sobre Circulação de Mercadorias e Serviços
  // ============================================================
  icms: {
    aliquota_padrao: 0.20,
    aliquota_padrao_percentual: "20%",
    aliquota_padrao_anterior: 0.18,
    vigencia_aliquota_atual: "A partir de 01/04/2023",
    base_legal: "Lei nº 2.657/1996; MP nº 33/2022; Decreto nº 6.696/2023",

    aliquotas_diferenciadas: {
      energia_eletrica: {
        aliquota: 0.18,
        percentual: "18%",
        observacao: "Redução de ICMS para energia elétrica conforme Medida Provisória"
      },
      combustiveis: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ/TO"
      },
      cesta_basica: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ/TO"
      },
      bebidas_alcoolicas: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ/TO"
      },
      medicamentos: {
        aliquota: 0.00,
        percentual: "0%",
        observacao: "Conforme legislação federal"
      },
      telecom: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ/TO"
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
        aliquota: 0.20,
        percentual: "20%",
        descricao: "Operações com não contribuintes (EC 87/2015)"
      }
    },

    importacao: {
      aliquota: 0.04,
      percentual: "4%",
      descricao: "Alíquota fixa para mercadorias estrangeiras (Resolução SF 13/2012)"
    },

    fecop: {
      existe: false,
      adicional: 0,
      observacao: "Tocantins não possui FECOP/FEM adicional identificado na pesquisa"
    },

    difal: {
      aplicacao: true,
      calculo: "Diferença entre alíquota interna (20%) e alíquota interestadual",
      base_legal: "EC 87/2015 e legislação posterior"
    },

    substituicao_tributaria: {
      dados_disponiveis: false,
      obs: "Verificar lista de produtos e MVA diretamente na SEFAZ/TO"
    }
  },

  // ============================================================
  // 3. IPVA — Imposto sobre Propriedade de Veículos Automotores
  // ============================================================
  ipva: {
    base_legal: "Lei nº 1.303/2002",
    base_calculo: "Valor venal conforme tabela FIPE",

    aliquotas: {
      automovel_ate_100hp: {
        aliquota: 0.025,
        percentual: "2,5%",
        descricao: "Automóveis com motor até 100 HP"
      },
      automovel_acima_100hp: {
        aliquota: 0.035,
        percentual: "3,5%",
        descricao: "Automóveis com motor acima de 100 HP"
      },
      motocicleta_ate_180cc: {
        aliquota: 0.025,
        percentual: "2,5%",
        descricao: "Motocicletas e ciclomotores até 180cc"
      },
      motocicleta_acima_180cc: {
        aliquota: 0.035,
        percentual: "3,5%",
        descricao: "Motocicletas acima de 180cc"
      },
      caminhao: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ/TO"
      },
      onibus: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ/TO"
      },
      locadora: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ/TO"
      },
      eletrico_hibrido: {
        aliquota: 0.00,
        percentual: "0%",
        descricao: "Isenção para veículos elétricos e híbridos",
        vigencia: "Até 31/12/2026",
        base_legal: "Lei sancionada em 28/11/2025"
      },
      embarcacao: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ/TO"
      },
      aeronave: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ/TO"
      }
    },

    isencoes: [
      {
        tipo: "Veículos com mais de 20 anos",
        descricao: "Isenção total de IPVA",
        vigencia: "A partir de 01/01/2026",
        beneficiarios: "Mais de 175 mil tocantinenses",
        observacao: "Texto em vigor, pendente de aprovação legislativa definitiva"
      },
      {
        tipo: "Veículos elétricos e híbridos",
        descricao: "Isenção total",
        vigencia: "Até 31/12/2026",
        base_legal: "Lei sancionada em 28/11/2025"
      },
      {
        tipo: "PCD",
        descricao: "Isenção total para portadores de deficiência física, visual, mental severa ou profunda, ou autistas"
      },
      {
        tipo: "Motoristas profissionais",
        descricao: "Isenção de ICMS na aquisição de veículos novos para transporte autônomo de passageiros"
      }
    ],

    descontos: {
      antecipacao: {
        percentual: 0.10,
        descricao: "10% de desconto para pagamento à vista até 30 de janeiro",
        vigencia: "2026"
      },
      programa_pontos: {
        percentual: 0.05,
        descricao: "5% de abatimento no IPVA",
        condicao: "Pontos acumulados entre dezembro/2024 e novembro/2025"
      }
    },

    calendario_vencimento: {
      dados_disponiveis: false,
      obs: "Consultar calendário oficial na SEFAZ/TO"
    }
  },

  // ============================================================
  // 4. ITCMD — Imposto sobre Transmissão Causa Mortis e Doação
  // ============================================================
  itcmd: {
    base_legal: "Lei nº 109/1989; Lei Complementar nº 227/2026",
    tipo: "Progressivo",

    aliquotas: {
      causa_mortis: {
        tipo: "Progressiva",
        faixas: [
          { descricao: "Faixa 1", aliquota: 0.02, percentual: "2%" },
          { descricao: "Faixa 2", aliquota: 0.04, percentual: "4%" },
          { descricao: "Faixa 3", aliquota: 0.06, percentual: "6%" },
          { descricao: "Faixa 4", aliquota: 0.08, percentual: "8%" }
        ],
        observacao: "Tocantins já adota alíquotas progressivas"
      },
      doacao: {
        tipo: "Progressiva",
        faixas: [
          { descricao: "Faixa 1", aliquota: 0.02, percentual: "2%" },
          { descricao: "Faixa 2", aliquota: 0.04, percentual: "4%" },
          { descricao: "Faixa 3", aliquota: 0.06, percentual: "6%" },
          { descricao: "Faixa 4", aliquota: 0.08, percentual: "8%" }
        ],
        observacao: "Tocantins já adota alíquotas progressivas"
      }
    },

    base_calculo: "Valor venal do bem ou direito transmitido (valor de mercado ou valor real)",

    isencoes: {
      dados_disponiveis: false,
      obs: "Verificar limites de isenção diretamente na SEFAZ/TO"
    },

    prazo_pagamento: {
      dados_disponiveis: false,
      obs: "Verificar diretamente na SEFAZ/TO"
    }
  },

  // ============================================================
  // 5. ISS — Imposto Sobre Serviços (Palmas - Capital)
  // ============================================================
  iss: {
    municipio_referencia: "Palmas",
    base_legal: "Lei Complementar nº 107/2005 (Código Tributário de Palmas)",
    aliquota_minima_federal: 0.02,
    aliquota_maxima_federal: 0.05,

    aliquota_geral: {
      dados_disponiveis: false,
      obs: "Verificar diretamente na Prefeitura de Palmas"
    },

    por_tipo_servico: {
      informatica: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar na Prefeitura de Palmas"
      },
      saude: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar na Prefeitura de Palmas"
      },
      educacao: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar na Prefeitura de Palmas"
      },
      construcao_civil: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar na Prefeitura de Palmas"
      },
      servicos_paralelos_construcao: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar na Prefeitura de Palmas"
      },
      contabilidade: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar na Prefeitura de Palmas"
      },
      advocacia: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar na Prefeitura de Palmas"
      },
      transporte: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar na Prefeitura de Palmas"
      }
    }
  },

  // ============================================================
  // 6. IPTU — Imposto Predial e Territorial Urbano (Palmas)
  // ============================================================
  iptu: {
    municipio_referencia: "Palmas",
    base_legal: "Lei Complementar nº 107/2005",
    base_calculo: "Valor venal do imóvel (tamanho do terreno, edificação, destinação, localização e tipo)",

    residencial: {
      dados_disponiveis: false,
      obs: "Verificar faixas de alíquota diretamente na Prefeitura de Palmas"
    },

    comercial: {
      dados_disponiveis: false,
      obs: "Verificar faixas de alíquota diretamente na Prefeitura de Palmas"
    },

    terreno_nao_edificado: {
      dados_disponiveis: false,
      obs: "Verificar diretamente na Prefeitura de Palmas"
    },

    descontos_isencoes: {
      dados_disponiveis: false,
      obs: "Verificar na Prefeitura de Palmas"
    }
  },

  // ============================================================
  // 7. ITBI — Imposto sobre Transmissão de Bens Imóveis (Palmas)
  // ============================================================
  itbi: {
    municipio_referencia: "Palmas",
    base_legal: "Lei Complementar nº 107/2005",
    base_calculo: "Valor venal do imóvel",

    aliquota_geral: 0.02,
    aliquota_geral_percentual: "2%",

    causa_mortis: {
      aliquota: 0.02,
      percentual: "2%"
    },

    demais_transmissoes: {
      aliquota: 0.02,
      percentual: "2%"
    },

    aliquota_maxima_progressiva: {
      aliquota: 0.15,
      percentual: "15%",
      observacao: "Alíquota máxima progressiva até atingir 15% do valor venal"
    },

    sfh: {
      dados_disponiveis: false,
      obs: "Verificar alíquota específica SFH na Prefeitura de Palmas"
    }
  },

  // ============================================================
  // 8. TAXAS ESTADUAIS E MUNICIPAIS
  // ============================================================
  taxas: {
    estaduais: {
      licenciamento_veiculos: { dados_disponiveis: false, obs: "Verificar na SEFAZ/TO" },
      taxa_judiciaria: { dados_disponiveis: false, obs: "Verificar na SEFAZ/TO" },
      servicos_sefaz: { dados_disponiveis: false, obs: "Verificar na SEFAZ/TO" },
      taxa_ambiental: { dados_disponiveis: false, obs: "Verificar na SEFAZ/TO" },
      taxa_incendio_bombeiros: { dados_disponiveis: false, obs: "Verificar na SEFAZ/TO" },
      emolumentos_cartorarios: { dados_disponiveis: false, obs: "Verificar na SEFAZ/TO" }
    },
    municipais_palmas: {
      municipio_referencia: "Palmas",
      taxa_lixo: { dados_disponiveis: false, obs: "Verificar na Prefeitura de Palmas" },
      alvara_funcionamento: { dados_disponiveis: false, obs: "Verificar na Prefeitura de Palmas" },
      cosip: { dados_disponiveis: false, obs: "Verificar na Prefeitura de Palmas" },
      taxa_publicidade: { dados_disponiveis: false, obs: "Verificar na Prefeitura de Palmas" }
    },
  },

  // ============================================================
  // 9. IMPOSTOS FEDERAIS (aplicáveis em Tocantins)
  // ============================================================
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
          descricao: "Sobre excedente de R$ 20.000/mês"
        }
      },
      lucro_presumido: {
        aliquota: 0.15,
        percentual: "15%",
        presuncao: {
          comercio: 0.08,
          servicos: 0.32,
          industria: 0.08,
          transporte_carga: 0.08,
          transporte_passageiros: 0.16,
          servicos_hospitalares: 0.08,
          revenda_combustiveis: 0.016
        },
        adicional: {
          aliquota: 0.10,
          percentual: "10%",
          limite_trimestral: 60000,
          descricao: "Sobre excedente de R$ 60.000/trimestre"
        }
      }
    },

    csll: {
      aliquota_geral: 0.09,
      percentual: "9%",
      base_lucro_real: "Lucro líquido ajustado",
      base_lucro_presumido: {
        servicos: 0.32,
        demais: 0.12
      },
      vigencia_alteracao: "A partir de 01/10/2025",
      observacao: "Alteração em vigor conforme Medida Provisória"
    },

    pis_pasep: {
      regime_cumulativo: {
        aliquota: 0.0065,
        percentual: "0,65%",
        aplicacao: "Lucro Presumido"
      },
      regime_nao_cumulativo: {
        aliquota: 0.0165,
        percentual: "1,65%",
        aplicacao: "Lucro Real"
      },
      aliquota_zero_cesta_basica: true
    },

    cofins: {
      regime_cumulativo: {
        aliquota: 0.03,
        percentual: "3%",
        aplicacao: "Lucro Presumido"
      },
      regime_nao_cumulativo: {
        aliquota: 0.076,
        percentual: "7,6%",
        aplicacao: "Lucro Real"
      },
      aliquota_zero_cesta_basica: true
    },

    ipi: {
      referencia: "Tabela de Incidência do IPI (TIPI) vigente",
      isencoes_regiao_norte: {
        suframa: true,
        descricao: "Isenção de IPI para empresas cadastradas na SUFRAMA"
      }
    },

    iof: {
      credito_pf: 0.0082,
      credito_pj: 0.0041,
      adicional_fixo: 0.0038,
      seguros: 0.0738,
      cambio: 0.0038,
      observacao: "Alíquotas padrão federais — verificar vigência"
    },

    ii: {
      observacao: "Conforme TEC (Tarifa Externa Comum do Mercosul)"
    },

    ie: {
      observacao: "Conforme NCM e regulamentação CAMEX"
    },

    itr: {
      observacao: "Imposto federal sobre propriedade rural — alíquotas conforme grau de utilização e área"
    },

    inss: {
      patronal: {
        aliquota: 0.20,
        percentual: "20%",
        base: "Sobre folha de pagamento"
      },
      rat_sat: {
        minima: 0.005,
        maxima: 0.03,
        percentual: "0,5% a 3%",
        condicao: "Conforme grau de risco da atividade (CNAE)"
      },
      terceiros: {
        aliquota: 0.058,
        percentual: "5,8%",
        descricao: "SESI/SENAI/SEBRAE/INCRA etc. (varia por setor)"
      },
      empregado_tabela_progressiva: [
        { faixa: 1, ate: 1518.00, aliquota: 0.075, percentual: "7,5%" },
        { faixa: 2, ate: 2793.88, aliquota: 0.09, percentual: "9%" },
        { faixa: 3, ate: 4190.83, aliquota: 0.12, percentual: "12%" },
        { faixa: 4, ate: 8157.41, aliquota: 0.14, percentual: "14%" }
      ],
      teto_contribuicao: 8157.41,
      observacao: "Tabela progressiva 2025 — valores sujeitos a atualização"
    },

    fgts: {
      aliquota: 0.08,
      percentual: "8%",
      base: "Remuneração mensal do empregado",
      multa_rescisoria: 0.40,
      multa_rescisoria_percentual: "40%"
    },

    irpf: {
      tabela_mensal_2025: [
        { faixa: 1, ate: 2259.20, aliquota: 0.00, percentual: "Isento", deducao: 0 },
        { faixa: 2, de: 2259.21, ate: 2826.65, aliquota: 0.075, percentual: "7,5%", deducao: 169.44 },
        { faixa: 3, de: 2826.66, ate: 3751.05, aliquota: 0.15, percentual: "15%", deducao: 381.44 },
        { faixa: 4, de: 3751.06, ate: 4664.68, aliquota: 0.225, percentual: "22,5%", deducao: 662.77 },
        { faixa: 5, acima_de: 4664.68, aliquota: 0.275, percentual: "27,5%", deducao: 896.00 }
      ],
      deducao_por_dependente: 189.59,
      desconto_simplificado: 564.80,
      observacao: "Tabela mensal 2025 — verificar atualizações para 2026"
    }
  },

  // ============================================================
  // 10. SIMPLES NACIONAL
  // ============================================================
  simples_nacional: {
    sublimite_estadual: 3600000,
    sublimite_estadual_formatado: "R$ 3.600.000,00",
    sublimite_observacao: "Tocantins adota o sublimite padrão nacional",
    base_legal: "Portaria CGSN nº 49/2024",

    reducao_icms_simples_nacional: {
      descricao: "Redução da base de cálculo do ICMS para empresas do Simples Nacional",
      faixas: [
        { ano: 2024, reducao: 0.75, descricao: "75% de redução em 2024" },
        { ano: 2025, reducao: 0.50, descricao: "50% de redução em 2025" },
        { ano: 2026, reducao: 0.25, descricao: "25% de redução em 2026" }
      ],
      base_legal: "Governo do Tocantins"
    },

    mei: {
      limite_anual: 81500,
      limite_anual_formatado: "R$ 81.500,00",
      vigencia: "2025",
      das_mensal: {
        comercio_industria: 76.90,
        servicos: 81.90,
        comercio_servicos: 81.90
      },
      icms_fixo: 1.00,
      iss_fixo: 5.00,
      observacao: "Valores baseados no salário mínimo de R$ 1.518,00 em 2025"
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
          { faixa: 6, rbt12_ate: 4800000, aliquota: 0.19, deducao: 378000 }
        ]
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
          { faixa: 6, rbt12_ate: 4800000, aliquota: 0.30, deducao: 720000 }
        ]
      },
      anexo_iii: {
        nome: "Serviços (Grupo 1 — receitas de locação de bens móveis, agências de viagem, escritórios contábeis, etc.)",
        faixas: 6,
        aliquota_minima: 0.06,
        aliquota_maxima: 0.33,
        detalhamento: [
          { faixa: 1, rbt12_ate: 180000, aliquota: 0.06, deducao: 0 },
          { faixa: 2, rbt12_ate: 360000, aliquota: 0.112, deducao: 9360 },
          { faixa: 3, rbt12_ate: 720000, aliquota: 0.135, deducao: 17640 },
          { faixa: 4, rbt12_ate: 1800000, aliquota: 0.16, deducao: 35640 },
          { faixa: 5, rbt12_ate: 3600000, aliquota: 0.21, deducao: 125640 },
          { faixa: 6, rbt12_ate: 4800000, aliquota: 0.33, deducao: 648000 }
        ]
      },
      anexo_iv: {
        nome: "Serviços (Grupo 2 — construção civil, vigilância, limpeza, etc.)",
        faixas: 6,
        aliquota_minima: 0.045,
        aliquota_maxima: 0.33,
        detalhamento: [
          { faixa: 1, rbt12_ate: 180000, aliquota: 0.045, deducao: 0 },
          { faixa: 2, rbt12_ate: 360000, aliquota: 0.09, deducao: 8100 },
          { faixa: 3, rbt12_ate: 720000, aliquota: 0.1020, deducao: 12420 },
          { faixa: 4, rbt12_ate: 1800000, aliquota: 0.14, deducao: 39780 },
          { faixa: 5, rbt12_ate: 3600000, aliquota: 0.22, deducao: 183780 },
          { faixa: 6, rbt12_ate: 4800000, aliquota: 0.33, deducao: 828000 }
        ]
      },
      anexo_v: {
        nome: "Serviços (Grupo 3 — auditoria, jornalismo, tecnologia, publicidade, engenharia, etc.)",
        faixas: 6,
        aliquota_minima: 0.155,
        aliquota_maxima: 0.305,
        detalhamento: [
          { faixa: 1, rbt12_ate: 180000, aliquota: 0.155, deducao: 0 },
          { faixa: 2, rbt12_ate: 360000, aliquota: 0.18, deducao: 4500 },
          { faixa: 3, rbt12_ate: 720000, aliquota: 0.195, deducao: 9900 },
          { faixa: 4, rbt12_ate: 1800000, aliquota: 0.205, deducao: 17100 },
          { faixa: 5, rbt12_ate: 3600000, aliquota: 0.23, deducao: 62100 },
          { faixa: 6, rbt12_ate: 4800000, aliquota: 0.305, deducao: 540000 }
        ]
      }
    }
  },

  // ============================================================
  // 11. INCENTIVOS FISCAIS E BENEFÍCIOS REGIONAIS
  // ============================================================
  incentivos: {
    sudam: {
      ativo: true,
      nome: "Superintendência do Desenvolvimento da Amazônia (SUDAM)",
      abrangencia: "Todo o estado de Tocantins (Amazônia Legal)",
      reducao_irpj: 0.75,
      reducao_irpj_percentual: "75%",
      aliquota_irpj_efetiva: 0.0375,
      aliquota_irpj_efetiva_percentual: "3,75%",
      reinvestimento: "Incentivos para reinvestimento de lucros conforme legislação específica",
      prazo_aprovacao: "Até 31/12/2028",
      tipo_projeto: "Instalação, diversificação, modernização",
      sustentabilidade: "Conforme critérios SUDAM",
      legislacao: "Lei nº 5.173/1966 e legislação SUDAM",
      csll: {
        reducao: "Conforme aprovação e projeto",
        descricao: "Redução de CSLL para empresas aprovadas na SUDAM"
      }
    },

    sudene: {
      ativo: false,
      observacao: "Tocantins NÃO está na área de abrangência da SUDENE"
    },

    zona_franca: {
      ativo: false,
      observacao: "Não há Zona Franca em Tocantins"
    },

    suframa: {
      ativo: true,
      nome: "Superintendência da Zona Franca de Manaus (SUFRAMA)",
      abrangencia: "Áreas específicas de Tocantins",
      beneficios: {
        ipi: "Isenção de IPI conforme cadastro SUFRAMA"
      },
      requisitos: "Cadastro na SUFRAMA e aprovação de projeto",
      legislacao: "Lei nº 8.387/1991 e regulamentações SUFRAMA"
    },

    incentivos_estaduais: {
      credito_fiscal_presumido: {
        nome: "Crédito fiscal presumido de ICMS",
        percentual_75: "75% sobre o valor do ICMS apurado em escrituração fiscal própria",
        percentual_100: "100% sobre o valor do ICMS em operações interestaduais",
        base_legal: "Lei nº 1.385/2003"
      },
      incentivos_culturais: {
        descricao: "Financiamento de 75% do valor do ICMS devido",
        aplicacao: "Projetos de implantação e revitalização"
      },
      projetos_2025: {
        descricao: "Incentivos fiscais aprovados para empresas em cinco municípios",
        data: "Outubro de 2025",
        investimentos: "Mais de R$ 48 milhões",
        setores: "Frigorífico, beneficiamento de arroz, comércio de EPIs, alimentação animal, fabricação"
      }
    },

    isencoes_especificas: {
      agricultura_familiar: { dados_disponiveis: false, obs: "Verificar na SEFAZ/TO" },
      cooperativas: { dados_disponiveis: false, obs: "Verificar na SEFAZ/TO" },
      exportadores: { dados_disponiveis: false, obs: "Verificar na SEFAZ/TO" }
    }
  },

  // ============================================================
  // 12. REFORMA TRIBUTÁRIA
  // ============================================================
  reforma_tributaria: {
    ibs: {
      nome: "Imposto sobre Bens e Serviços",
      aliquota_estadual_prevista: null,
      dados_disponiveis: false,
      cronograma_transicao: "Em implementação conforme legislação federal",
      substituira: "ICMS (gradualmente)"
    },
    cbs: {
      nome: "Contribuição sobre Bens e Serviços",
      aliquota_federal_prevista: null,
      dados_disponiveis: false,
      cronograma_transicao: "Em implementação conforme legislação federal",
      substituira: "PIS/COFINS (gradualmente)"
    },
    is: {
      nome: "Imposto Seletivo",
      produtos_afetados: "Produtos prejudiciais à saúde ou ao meio ambiente",
      aliquotas_estimadas: null,
      dados_disponiveis: false
    },
    impactos_tocantins: {
      beneficios_regionais: "Possível manutenção de benefícios SUDAM/SUFRAMA conforme legislação de transição",
      fundo_desenvolvimento_regional: {
        dados_disponiveis: false,
        obs: "Verificar na SEFAZ/TO"
      }
    }
  },

  // ============================================================
  // 13. DADOS DE COBERTURA (Controle de Qualidade)
  // ============================================================
  cobertura: {
    versao: "3.0",
    data_atualizacao: "2026-02-10",
    localizados: [
      "ICMS — alíquota padrão interna (20%)",
      "ICMS — alíquota anterior (18%)",
      "ICMS — energia elétrica (18%)",
      "ICMS — medicamentos (0%)",
      "ICMS — alíquotas interestaduais (7% e 12%)",
      "ICMS — importação (4%)",
      "ICMS — DIFAL",
      "IPVA — automóveis até 100 HP (2,5%)",
      "IPVA — automóveis acima 100 HP (3,5%)",
      "IPVA — motocicletas até 180cc (2,5%)",
      "IPVA — motocicletas acima 180cc (3,5%)",
      "IPVA — elétricos/híbridos (isenção até 2026)",
      "IPVA — isenção veículos +20 anos",
      "IPVA — desconto antecipação (10%)",
      "IPVA — programa pontos (5%)",
      "IPVA — isenção PCD",
      "ITCMD — alíquotas progressivas (2%, 4%, 6%, 8%)",
      "ITBI — Palmas (2%)",
      "ITBI — alíquota máxima progressiva (15%)",
      "Simples Nacional — sublimite (R$ 3.600.000)",
      "Simples Nacional — redução ICMS escalonada (75%/50%/25%)",
      "MEI — limite e DAS mensal",
      "SUDAM — redução 75% IRPJ",
      "SUFRAMA — isenção IPI em áreas específicas",
      "Incentivos estaduais — crédito fiscal presumido ICMS (Lei 1.385/2003)",
      "Impostos federais — IRPJ, CSLL, PIS, COFINS, INSS, FGTS, IRPF",
      "Anexos I a V do Simples Nacional"
    ],

    nao_localizados: [
      "ICMS — combustíveis (alíquota específica)",
      "ICMS — cesta básica (alíquota específica)",
      "ICMS — bebidas alcoólicas",
      "ICMS — telecom",
      "ICMS — Substituição Tributária (produtos e MVA)",
      "ICMS — FECOP/FEM",
      "IPVA — caminhões",
      "IPVA — ônibus/micro-ônibus",
      "IPVA — locadoras",
      "IPVA — embarcações e aeronaves",
      "IPVA — calendário de vencimento detalhado",
      "ITCMD — limites de isenção por faixa de valor",
      "ITCMD — prazo de pagamento",
      "ISS — alíquotas por tipo de serviço em Palmas",
      "IPTU — alíquotas residencial e comercial em Palmas",
      "IPTU — terreno não edificado",
      "ITBI — alíquota SFH",
      "Taxas estaduais (licenciamento, judiciária, ambiental, bombeiros, etc.)",
      "Taxas municipais (lixo, alvará, COSIP, publicidade)",
      "Reforma tributária — alíquotas previstas IBS/CBS/IS",
      "Reforma tributária — Fundo de Desenvolvimento Regional"
    ],

    completude_estimada: "55%",

    contatos_para_completar: [
      "SEFAZ/TO: https://portal.sefaz.to.gov.br",
      "DTRI/TO: https://dtri.sefaz.to.gov.br",
      "Prefeitura de Palmas: https://www.palmas.to.gov.br",
      "SUDAM: https://www.gov.br/sudam",
      "SUFRAMA: https://www.gov.br/suframa"
    ]
  }
};

// ============================================================
// 14. FUNÇÕES UTILITÁRIAS
// ============================================================

/**
 * Retorna alíquota ISS por tipo de serviço (Palmas)
 * @param {string} tipo - Tipo de serviço (informatica, saude, educacao, construcao_civil, etc.)
 * @returns {object} Objeto com alíquota e observações
 */
function getISSTocantins(tipo) {
  const servico = TOCANTINS_TRIBUTARIO.iss.por_tipo_servico[tipo];
  if (servico) {
    return servico;
  }
  return {
    aliquota: null,
    dados_disponiveis: false,
    obs: "Tipo de serviço não encontrado ou dados não disponíveis. Verificar na Prefeitura de Palmas."
  };
}

/**
 * Retorna alíquota IPTU residencial por área (Palmas)
 * @param {number} areaM2 - Área em metros quadrados
 * @returns {object} Objeto com alíquota e observações
 */
function getIPTUResidencialTocantins(areaM2) {
  return {
    aliquota: null,
    dados_disponiveis: false,
    obs: "Dados de IPTU residencial de Palmas não disponíveis. Verificar na Prefeitura de Palmas."
  };
}

/**
 * Retorna alíquota IPTU comercial por área (Palmas)
 * @param {number} areaM2 - Área em metros quadrados
 * @returns {object} Objeto com alíquota e observações
 */
function getIPTUComercialTocantins(areaM2) {
  return {
    aliquota: null,
    dados_disponiveis: false,
    obs: "Dados de IPTU comercial de Palmas não disponíveis. Verificar na Prefeitura de Palmas."
  };
}

/**
 * Retorna alíquota IPVA por tipo de veículo
 * @param {string} tipo - Tipo do veículo (automovel_ate_100hp, motocicleta_ate_180cc, eletrico_hibrido, etc.)
 * @returns {object} Objeto com alíquota e informações
 */
function getIPVATocantins(tipo) {
  const veiculo = TOCANTINS_TRIBUTARIO.ipva.aliquotas[tipo];
  if (veiculo) {
    return veiculo;
  }
  return {
    aliquota: null,
    dados_disponiveis: false,
    obs: "Tipo de veículo não encontrado. Tipos disponíveis: automovel_ate_100hp, automovel_acima_100hp, motocicleta_ate_180cc, motocicleta_acima_180cc, eletrico_hibrido"
  };
}

/**
 * Verifica se município está em Zona Franca
 * @param {string} municipio - Nome do município
 * @returns {boolean}
 */
function isZonaFrancaTocantins(municipio) {
  return false; // Tocantins não possui Zona Franca
}

/**
 * Verifica se município é ALC (Área de Livre Comércio)
 * @param {string} municipio - Nome do município
 * @returns {boolean}
 */
function isALCTocantins(municipio) {
  return false; // Tocantins não possui ALC
}

/**
 * Retorna percentual de redução IRPJ pela SUDAM
 * @returns {object} Dados da redução SUDAM
 */
function getReducaoSUDAMTocantins() {
  return {
    ativo: true,
    reducao: 0.75,
    reducao_percentual: "75%",
    aliquota_efetiva: 0.0375,
    aliquota_efetiva_percentual: "3,75%",
    prazo: "Até 31/12/2028",
    legislacao: "Lei nº 5.173/1966"
  };
}

/**
 * Retorna ICMS efetivo (padrão + FECOP se houver)
 * @returns {object} ICMS efetivo
 */
function getICMSEfetivoTocantins() {
  const icms = TOCANTINS_TRIBUTARIO.icms;
  const fecop = icms.fecop && icms.fecop.existe ? icms.fecop.adicional : 0;
  return {
    aliquota_padrao: icms.aliquota_padrao,
    fecop: fecop,
    aliquota_efetiva: icms.aliquota_padrao + fecop,
    aliquota_efetiva_percentual: ((icms.aliquota_padrao + fecop) * 100).toFixed(1) + "%"
  };
}

/**
 * Retorna redução de ICMS do Simples Nacional para o ano especificado
 * @param {number} ano - Ano de referência (2024, 2025, 2026)
 * @returns {object} Dados da redução
 */
function getReducaoICMSSimplesNacionalTocantins(ano) {
  const reducoes = TOCANTINS_TRIBUTARIO.simples_nacional.reducao_icms_simples_nacional;
  const faixa = reducoes.faixas.find(f => f.ano === ano);
  if (faixa) {
    return faixa;
  }
  return {
    reducao: 0,
    descricao: "Ano fora do período de redução ou dados não disponíveis"
  };
}

/**
 * Retorna resumo tributário do estado para exibição rápida
 * @returns {object} Resumo tributário completo
 */
function resumoTributarioTocantins() {
  const d = TOCANTINS_TRIBUTARIO;
  return {
    estado: d.dados_gerais.nome,
    sigla: d.dados_gerais.sigla,
    regiao: d.dados_gerais.regiao,
    capital: d.dados_gerais.capital,
    icms_padrao: d.icms.aliquota_padrao,
    icms_efetivo: getICMSEfetivoTocantins().aliquota_efetiva,
    fecop: d.icms.fecop.existe ? d.icms.fecop.adicional : 0,
    ipva_automovel: d.ipva.aliquotas.automovel_ate_100hp.aliquota,
    itcmd_min: d.itcmd.aliquotas.causa_mortis.faixas[0].aliquota,
    itcmd_max: d.itcmd.aliquotas.causa_mortis.faixas[d.itcmd.aliquotas.causa_mortis.faixas.length - 1].aliquota,
    iss_geral: d.iss.aliquota_geral.dados_disponiveis === false ? "N/D" : d.iss.aliquota_geral,
    itbi: d.itbi.aliquota_geral,
    sublimite_simples: d.simples_nacional.sublimite_estadual,
    sudam: d.incentivos.sudam.ativo,
    sudene: d.incentivos.sudene.ativo,
    zona_franca: d.dados_gerais.zona_franca.existe,
    suframa: d.incentivos.suframa.ativo,
    reducao_irpj_sudam: d.incentivos.sudam.ativo ? d.incentivos.sudam.reducao_irpj : 0,
    completude: d.cobertura.completude_estimada
  };
}

// ============================================================
// 15. EXPORTAÇÃO
// ============================================================

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        ...TOCANTINS_TRIBUTARIO,
        utils: {
            getISS: getISSTocantins,
            getIPVA: getIPVATocantins,
            getIPTUResidencial: getIPTUResidencialTocantins,
            getIPTUComercial: getIPTUComercialTocantins,
            isZonaFranca: isZonaFrancaTocantins,
            isALC: isALCTocantins,
            getReducaoSUDAM: getReducaoSUDAMTocantins,
            getICMSEfetivo: getICMSEfetivoTocantins,
            getReducaoICMSSimplesNacional: getReducaoICMSSimplesNacionalTocantins,
            resumoTributario: resumoTributarioTocantins,
        },
    };
}

if (typeof window !== "undefined") {
    window.TOCANTINS_TRIBUTARIO = TOCANTINS_TRIBUTARIO;
    window.TocantinsTributario = {
        getISS: getISSTocantins,
        getIPVA: getIPVATocantins,
        getIPTUResidencial: getIPTUResidencialTocantins,
        getIPTUComercial: getIPTUComercialTocantins,
        isZonaFranca: isZonaFrancaTocantins,
        isALC: isALCTocantins,
        getReducaoSUDAM: getReducaoSUDAMTocantins,
        getICMSEfetivo: getICMSEfetivoTocantins,
        getReducaoICMSSimplesNacional: getReducaoICMSSimplesNacionalTocantins,
        resumo: resumoTributarioTocantins,
    };
}
