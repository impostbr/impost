/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MATO_GROSSO.JS — Base de Dados Tributária Completa do Estado de Mato Grosso
 * ═══════════════════════════════════════════════════════════════════════════
 * Versão 3.0 — Padronizado conforme template roraima.js v3.0
 * Dados verificados via fontes oficiais (SEFAZ-MT, Receita Federal, Prefeitura de Cuiabá)
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
 *   08. taxas               — Estaduais e municipais (capital)
 *   09. federal             — IRPJ, CSLL, PIS, COFINS, IOF, ITR, INSS, FGTS, IRPF
 *   10. simples_nacional    — Anexos, faixas, sublimite, MEI
 *   11. incentivos          — SUDAM/SUDENE/SUDECO, programas estaduais
 *   12. reforma_tributaria  — EC 132, LC 214, LC 227, transição IBS/CBS
 *   13. cobertura           — Versão, itens localizados/pendentes, contatos
 *   14. funções utilitárias — Helpers de cálculo
 *   15. exportação          — module.exports + window (padrão Grupo 2)
 *
 * FONTES CONSULTADAS:
 *   • SEFAZ-MT — http://app1.sefaz.mt.gov.br/
 *   • Lei nº 5.610/1990 (ICMS)
 *   • Lei nº 7.301/2000; Decreto nº 1.977/2000 (IPVA)
 *   • Lei nº 6.747/1996 (ITCD)
 *   • Convênios ICMS (CONFAZ)
 *   • Convênio ICMS nº 3/2026 (Energia renovável)
 *   • Legislação municipal de Cuiabá
 *   • Receita Federal — www.gov.br/receitafederal
 *
 * ATUALIZAÇÃO: 10/02/2026
 * ═══════════════════════════════════════════════════════════════════════════
 */

const MATO_GROSSO_TRIBUTARIO = {

  // ═══════════════════════════════════════════════════════════════
  //  1. DADOS GERAIS
  // ═══════════════════════════════════════════════════════════════

  dados_gerais: {
    nome: "Mato Grosso",
    sigla: "MT",
    regiao: "Centro-Oeste",
    capital: "Cuiabá",
    codigo_ibge: "51",
    zona_franca: {
      existe: false,
      observacao: "Não há Zona Franca em Mato Grosso"
    },
    alc: {
      existe: false,
      observacao: "Não há Área de Livre Comércio em Mato Grosso"
    },
    sudam: {
      abrangencia: true,
      abrangencia_parcial: true,
      area: "Norte de Mato Grosso",
      beneficios: "Redução de até 75% do IRPJ para projetos aprovados",
      status: "Ativa"
    },
    sudene: {
      abrangencia: false,
      observacao: "Mato Grosso não está na área de abrangência da SUDENE"
    },
    sudeco: {
      abrangencia: true,
      abrangencia_parcial: true,
      area: "Centro-Sul de Mato Grosso",
      beneficios: "Redução de até 75% do IRPJ para projetos aprovados",
      status: "Ativa"
    },
    suframa: {
      abrangencia: false,
      observacao: "Mato Grosso não está na área de abrangência da SUFRAMA"
    },
    sefaz: {
      url: "http://app1.sefaz.mt.gov.br/",
      legislacao: "http://app1.sefaz.mt.gov.br/Sistema/Legislacao/legislacaotribut.nsf",
      contato: "DADO NÃO LOCALIZADO"
    },
    prefeitura_capital: {
      url: "DADO NÃO LOCALIZADO",
      contato: "DADO NÃO LOCALIZADO"
    },
    legislacao_base: {
      icms: "Lei nº 5.610/1990; Convênios ICMS",
      ipva: "Lei nº 7.301/2000; Decreto nº 1.977/2000",
      itcmd: "Lei nº 6.747/1996",
      iss: "Legislação municipal de Cuiabá",
      iptu: "Legislação municipal de Cuiabá"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  2. ICMS — IMPOSTO SOBRE CIRCULAÇÃO DE MERCADORIAS E SERVIÇOS
  // ═══════════════════════════════════════════════════════════════

  icms: {
    aliquota_padrao: 0.17,
    aliquota_padrao_percentual: "17%",
    aliquota_padrao_anterior: null,
    vigencia_aliquota_atual: "Vigente",
    base_legal: "Lei nº 5.610/1990; Convênios ICMS",
    nota: "Uma das menores alíquotas padrão do Brasil — estado altamente competitivo",

    historico: [
      { vigencia: "Vigente", aliquota: 0.17, percentual: "17%", base_legal: "Lei nº 5.610/1990" }
    ],

    aliquotas_diferenciadas: {
      energia_eletrica: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Alíquota reduzida para consumo residencial — verificar legislação específica na SEFAZ-MT"
      },
      combustiveis: {
        aliquota: 0.25,
        percentual: "25%",
        observacao: "Combustíveis e lubrificantes — com possibilidade de substituição tributária"
      },
      comunicacao: {
        aliquota: 0.25,
        percentual: "25%",
        observacao: "Telefonia e internet"
      },
      cesta_basica: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Alíquota reduzida — verificar legislação específica na SEFAZ-MT"
      },
      bebidas_alcoolicas: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ-MT"
      },
      medicamentos: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ-MT"
      },
      energia_solar: {
        aliquota: 0.00,
        percentual: "0% (isento)",
        descricao: "Isenção de ICMS em operações com energia solar",
        base_legal: "Convênio ICMS nº 3/2026"
      }
    },

    reducao_base_calculo: {
      descricao: "Base de cálculo reduzida para 17,65% do valor da operação em operações específicas",
      carga_tributaria_final: "Carga tributária final reduzida conforme Convênios ICMS e legislação estadual"
    },

    convenios_2026: {
      descricao: "MT prorrogou diversos convênios ICMS até 31/12/2026, incluindo benefícios para energia renovável",
      base_legal: "Convênio ICMS nº 3/2026 (15/01/2026)"
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
        aliquota: 0.17,
        percentual: "17%",
        descricao: "Operações com não contribuintes (EC 87/2015)"
      }
    },

    importacao: {
      aliquota: 0.17,
      percentual: "17%",
      descricao: "ICMS sobre importação — alíquota interna"
    },

    fecop: {
      existe: false,
      adicional: 0,
      observacao: "FECOP não identificado na pesquisa — verificar na SEFAZ-MT"
    },

    difal: {
      aplicacao: true,
      calculo: "Diferença entre alíquota interna (17%) e alíquota interestadual",
      base_legal: "EC 87/2015"
    },

    substituicao_tributaria: {
      existe: true,
      obs: "Combustíveis e outros produtos com ST — verificar lista completa e MVA na SEFAZ-MT"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  3. IPVA — IMPOSTO SOBRE PROPRIEDADE DE VEÍCULOS AUTOMOTORES
  // ═══════════════════════════════════════════════════════════════

  ipva: {
    base_legal: "Lei nº 7.301/2000; Decreto nº 1.977/2000",
    base_calculo: "Valor venal conforme tabela FIPE",

    aliquotas: {
      automovel_utilitario: {
        aliquota: 0.03,
        percentual: "3,0%",
        descricao: "Automóveis e utilitários"
      },
      motocicleta: {
        aliquota: 0.02,
        percentual: "2,0%",
        descricao: "Motocicletas e similares"
      },
      onibus_caminhao: {
        aliquota: 0.01,
        percentual: "1,0%",
        descricao: "Ônibus, micro-ônibus, caminhões e cavalo mecânico"
      },
      embarcacao: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ-MT"
      },
      aeronave: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ-MT"
      },
      locadora: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ-MT"
      }
    },

    isencoes: [
      {
        tipo: "PCD",
        descricao: "Isenção para pessoa com deficiência física, visual, mental severa ou profunda, ou autista",
        status: "Ativo"
      },
      {
        tipo: "Táxis",
        descricao: "Isenção para táxis"
      },
      {
        tipo: "Transporte escolar",
        descricao: "Isenção para veículos de transporte escolar"
      }
    ],

    descontos: {
      antecipacao: {
        dados_disponiveis: false,
        obs: "Verificar descontos para cota única na SEFAZ-MT"
      },
      parcelamento: {
        dados_disponiveis: false,
        obs: "Verificar parcelamento na SEFAZ-MT"
      }
    },

    calendario_vencimento: {
      descricao: "Geralmente divulgado no final do ano anterior pela SEFAZ-MT, com cotas de janeiro a março/abril",
      dados_disponiveis: false,
      obs: "Consultar calendário oficial na SEFAZ-MT"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  4. ITCMD — IMPOSTO SOBRE TRANSMISSÃO CAUSA MORTIS E DOAÇÃO
  //     Nota: Em MT é chamado ITCD
  // ═══════════════════════════════════════════════════════════════

  itcmd: {
    nome_local: "ITCD — Imposto sobre Transmissão Causa Mortis e Doação",
    base_legal: "Lei nº 6.747/1996",
    tipo: "Progressivo (já atende LC 227/2026)",

    aliquotas_causa_mortis: {
      tipo: "Progressiva por faixas de valor",
      faixas: [
        { ate: 1500, aliquota: 0.00, percentual: "Isento", descricao: "Até R$ 1.500" },
        { de: 1500.01, ate: 4000, aliquota: 0.02, percentual: "2%", descricao: "R$ 1.500,01 a R$ 4.000" },
        { de: 4000.01, ate: 10000, aliquota: 0.03, percentual: "3%", descricao: "R$ 4.000,01 a R$ 10.000" },
        { de: 10000.01, ate: 30000, aliquota: 0.04, percentual: "4%", descricao: "R$ 10.000,01 a R$ 30.000" },
        { acima_de: 30000, aliquota: 0.05, percentual: "5%", descricao: "Acima de R$ 30.000" }
      ]
    },

    aliquotas_doacao: {
      tipo: "Progressiva por faixas de valor (mesmas faixas da causa mortis)",
      faixas: [
        { ate: 1500, aliquota: 0.00, percentual: "Isento", descricao: "Até R$ 1.500" },
        { de: 1500.01, ate: 4000, aliquota: 0.02, percentual: "2%", descricao: "R$ 1.500,01 a R$ 4.000" },
        { de: 4000.01, ate: 10000, aliquota: 0.03, percentual: "3%", descricao: "R$ 4.000,01 a R$ 10.000" },
        { de: 10000.01, ate: 30000, aliquota: 0.04, percentual: "4%", descricao: "R$ 10.000,01 a R$ 30.000" },
        { acima_de: 30000, aliquota: 0.05, percentual: "5%", descricao: "Acima de R$ 30.000" }
      ]
    },

    base_calculo: "Valor venal do bem ou direito transmitido",

    reforma_tributaria_impacto: "MT já adota progressividade (Lei nº 6.747/1996) — menor impacto na adequação à LC 227/2026"
  },

  // ═══════════════════════════════════════════════════════════════
  //  5. ISS — IMPOSTO SOBRE SERVIÇOS (Cuiabá — referência)
  // ═══════════════════════════════════════════════════════════════

  iss: {
    municipio_referencia: "Cuiabá",
    base_legal: "Legislação municipal de Cuiabá; LC nº 116/2003 (federal)",
    aliquota_minima_federal: 0.02,
    aliquota_maxima_federal: 0.05,

    aliquota_geral: 0.05,
    aliquota_geral_percentual: "5%",
    faixa_aliquotas: "Variáveis conforme tipo de serviço — alíquota geral 5%",

    por_tipo_servico: {
      // Dados específicos por serviço não localizados na pesquisa
      // Utilizando alíquota geral como referência
      informatica: { aliquota: null, dados_disponiveis: false, obs: "Verificar na Prefeitura de Cuiabá" },
      saude: { aliquota: null, dados_disponiveis: false, obs: "Verificar na Prefeitura de Cuiabá" },
      educacao: { aliquota: null, dados_disponiveis: false, obs: "Verificar na Prefeitura de Cuiabá" },
      construcao_civil: { aliquota: null, dados_disponiveis: false, obs: "Verificar na Prefeitura de Cuiabá" },
      contabilidade: { aliquota: null, dados_disponiveis: false, obs: "Verificar na Prefeitura de Cuiabá" },
      advocacia: { aliquota: null, dados_disponiveis: false, obs: "Verificar na Prefeitura de Cuiabá" },
      transporte: { aliquota: null, dados_disponiveis: false, obs: "Verificar na Prefeitura de Cuiabá" }
    },

    observacao: "Alíquotas específicas variáveis conforme anexo da legislação municipal — dados detalhados não localizados"
  },

  // ═══════════════════════════════════════════════════════════════
  //  6. IPTU — IMPOSTO PREDIAL E TERRITORIAL URBANO (Cuiabá)
  // ═══════════════════════════════════════════════════════════════

  iptu: {
    municipio_referencia: "Cuiabá",
    base_legal: "Legislação municipal de Cuiabá",
    base_calculo: "Valor venal do imóvel conforme PGV municipal",

    residencial: {
      dados_disponiveis: false,
      obs: "Alíquotas variáveis conforme uso e valor venal — verificar na Prefeitura de Cuiabá"
    },

    comercial: {
      dados_disponiveis: false,
      obs: "Verificar na Prefeitura de Cuiabá"
    },

    terreno_nao_edificado: {
      dados_disponiveis: false,
      obs: "Verificar na Prefeitura de Cuiabá"
    },

    industrial: {
      dados_disponiveis: false,
      obs: "Verificar na Prefeitura de Cuiabá"
    },

    isencoes: {
      dados_disponiveis: false,
      obs: "Verificar na Prefeitura de Cuiabá"
    },

    descontos: {
      dados_disponiveis: false,
      obs: "Verificar na Prefeitura de Cuiabá"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  7. ITBI — IMPOSTO SOBRE TRANSMISSÃO DE BENS IMÓVEIS (Cuiabá)
  // ═══════════════════════════════════════════════════════════════

  itbi: {
    municipio_referencia: "Cuiabá",
    base_legal: "Legislação municipal de Cuiabá",
    base_calculo: "Valor venal ou valor de transação do imóvel",

    aliquota_geral: 0.02,
    aliquota_geral_percentual: "2%",
    observacao: "Alíquota única para todas as transmissões de bens imóveis"
  },

  // ═══════════════════════════════════════════════════════════════
  //  8. TAXAS ESTADUAIS E MUNICIPAIS
  // ═══════════════════════════════════════════════════════════════

  taxas: {

    // ── Taxas Estaduais ──
    estaduais: {
      tfusp: {
        nome: "Taxa de Fiscalização e Utilização de Serviços Públicos (TFUSP)",
        descricao: "Cobrada por diversos serviços públicos (certidões, registros, etc.)",
        valor: null,
        dados_disponiveis: false
      },
      taxas_detran: {
        nome: "Taxas do DETRAN-MT",
        descricao: "Licenciamento, transferência, emissão de CNH, etc.",
        valor: null,
        dados_disponiveis: false
      },
      taxa_incendio_bombeiros: {
        nome: "TPEI — Taxa de Prevenção e Extinção de Incêndios",
        orgao: "Corpo de Bombeiros Militar de Mato Grosso",
        descricao: "Cobrada anualmente de proprietários de imóveis",
        valor: null,
        dados_disponiveis: false
      }
    },

    // ── Taxas Municipais (Cuiabá) ──
    municipais_Cuiaba: {
      municipio_referencia: "Cuiabá",
      taxa_lixo: { dados_disponiveis: false, obs: "Verificar na Prefeitura de Cuiabá" },
      alvara_funcionamento: { dados_disponiveis: false, obs: "Verificar na Prefeitura de Cuiabá" },
      cosip: { dados_disponiveis: false, obs: "Verificar na Prefeitura de Cuiabá" }
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  9. IMPOSTOS FEDERAIS (aplicáveis em Mato Grosso)
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
          descricao: "Sobre excedente de R$ 20.000/mês (R$ 240.000/ano)"
        }
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
          revenda_combustiveis: 0.016
        },
        aliquota_efetiva: {
          comercio: 0.012,
          industria: 0.012,
          servicos: 0.048,
          transporte: 0.012
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
      financeiras: {
        aliquota: 0.15,
        percentual: "15%"
      },
      base_lucro_presumido: {
        servicos: 0.32,
        demais: 0.12
      }
    },

    pis_pasep: {
      regime_cumulativo: {
        aliquota: 0.0065,
        percentual: "0,65%",
        aplicacao: "Lucro Presumido",
        creditos: false
      },
      regime_nao_cumulativo: {
        aliquota: 0.0165,
        percentual: "1,65%",
        aplicacao: "Lucro Real",
        creditos: true
      },
      aliquota_zero_cesta_basica: true
    },

    cofins: {
      regime_cumulativo: {
        aliquota: 0.03,
        percentual: "3%",
        aplicacao: "Lucro Presumido",
        creditos: false
      },
      regime_nao_cumulativo: {
        aliquota: 0.076,
        percentual: "7,6%",
        aplicacao: "Lucro Real",
        creditos: true
      },
      aliquota_zero_cesta_basica: true
    },

    ipi: {
      referencia: "Tabela de Incidência do IPI (TIPI) vigente",
      observacao: "MT não possui benefícios de IPI tipo ZFM/SUFRAMA (exceto área SUDAM parcial)"
    },

    iof: {
      credito_pf: 0.0082,
      credito_pj: 0.0041,
      adicional_fixo: 0.0038,
      seguros: 0.0738,
      cambio: 0.0038,
      observacao: "Alíquotas padrão federais — verificar vigência"
    },

    ii: { observacao: "Conforme TEC (Tarifa Externa Comum do Mercosul)" },
    ie: { observacao: "Conforme NCM e regulamentação CAMEX" },
    itr: { observacao: "Imposto federal sobre propriedade rural — alíquotas conforme grau de utilização e área" },

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
        { faixa: 1, ate: 2112.00, aliquota: 0.00, percentual: "Isento", deducao: 0 },
        { faixa: 2, de: 2112.01, ate: 2826.65, aliquota: 0.075, percentual: "7,5%", deducao: 158.40 },
        { faixa: 3, de: 2826.66, ate: 3751.05, aliquota: 0.15, percentual: "15%", deducao: 423.15 },
        { faixa: 4, de: 3751.06, ate: 4664.68, aliquota: 0.225, percentual: "22,5%", deducao: 844.80 },
        { faixa: 5, acima_de: 4664.68, aliquota: 0.275, percentual: "27,5%", deducao: 1278.64 }
      ],
      deducao_por_dependente: 189.59,
      observacao: "Tabela mensal 2025 — verificar atualizações para 2026"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  10. SIMPLES NACIONAL
  // ═══════════════════════════════════════════════════════════════

  simples_nacional: {
    sublimite_estadual: 3600000,
    sublimite_estadual_formatado: "R$ 3.600.000,00",
    sublimite_observacao: "Empresas que ultrapassam devem recolher ICMS e ISS fora do Simples Nacional",

    limites: {
      mei: 81000,
      mei_formatado: "R$ 81.000,00",
      microempresa: 360000,
      microempresa_formatado: "R$ 360.000,00",
      epp: 4800000,
      epp_formatado: "R$ 4.800.000,00"
    },

    mei: {
      limite_anual: 81000,
      limite_anual_formatado: "R$ 81.000,00",
      das_mensal: {
        minimo: 75.90,
        maximo: 81.90,
        descricao: "Varia entre R$ 75,90 e R$ 81,90 dependendo da atividade (INSS + ICMS/ISS)"
      },
      icms_fixo: 1.00,
      iss_fixo: 5.00,
      observacao: "Valores referência 2026"
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
          { faixa: 6, rbt12_ate: 4800000, aliquota: 0.33, deducao: 648000 }
        ]
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
          { faixa: 6, rbt12_ate: 4800000, aliquota: 0.33, deducao: 828000 }
        ]
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
          { faixa: 6, rbt12_ate: 4800000, aliquota: 0.305, deducao: 540000 }
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
      abrangencia_parcial: true,
      area: "Norte de Mato Grosso",
      nome: "Superintendência do Desenvolvimento da Amazônia (SUDAM)",
      reducao_irpj: 0.75,
      reducao_irpj_percentual: "75%",
      aliquota_irpj_efetiva: 0.0375,
      aliquota_irpj_efetiva_percentual: "3,75%",
      condicao: "Projetos aprovados na área de atuação da SUDAM",
      status: "Ativa"
    },

    sudeco: {
      ativo: true,
      abrangencia_parcial: true,
      area: "Centro-Sul de Mato Grosso",
      nome: "Superintendência do Desenvolvimento do Centro-Oeste (SUDECO)",
      reducao_irpj: 0.75,
      reducao_irpj_percentual: "75%",
      aliquota_irpj_efetiva: 0.0375,
      aliquota_irpj_efetiva_percentual: "3,75%",
      condicao: "Projetos aprovados na área de atuação da SUDECO",
      status: "Ativa"
    },

    sudene: {
      ativo: false,
      observacao: "Mato Grosso NÃO está na área de abrangência da SUDENE"
    },

    zona_franca: {
      ativo: false,
      observacao: "Não há Zona Franca em Mato Grosso"
    },

    suframa: {
      ativo: false,
      observacao: "MT não está na área de abrangência da SUFRAMA"
    },

    incentivos_estaduais: {
      energia_renovavel: {
        descricao: "Isenção de ICMS em operações com energia solar e outras fontes renováveis",
        base_legal: "Convênio ICMS nº 3/2026"
      },
      reducao_base_calculo_icms: {
        descricao: "Base de cálculo reduzida para 17,65% em operações específicas",
        condicao: "Conforme Convênios ICMS e legislação estadual"
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  12. REFORMA TRIBUTÁRIA
  // ═══════════════════════════════════════════════════════════════

  reforma_tributaria: {
    ibs: {
      nome: "Imposto sobre Bens e Serviços",
      substituira: "ICMS (estadual) e ISS (municipal)",
      cronograma_transicao: "Gradual de 2026 a 2033"
    },
    cbs: {
      nome: "Contribuição sobre Bens e Serviços",
      substituira: "PIS, COFINS e IPI (federais)",
      cronograma_transicao: "Gradual de 2026 a 2033"
    },
    is: {
      nome: "Imposto Seletivo",
      incidencia: "Produtos e serviços prejudiciais à saúde e ao meio ambiente"
    },
    cronograma_mt: {
      fase_2026: "Testes com alíquotas simbólicas — CBS 0,9% + IBS 0,1%. Valor recolhido deduzido dos tributos atuais.",
      fase_2027_2032: "Redução gradual de ICMS/ISS e aumento gradual de IBS",
      fase_2033: "Extinção completa do ICMS e ISS — vigência plena do IBS"
    },
    impactos_mt: {
      itcmd: "MT já adota progressividade (Lei 6.747/1996) — menor impacto de adequação",
      competitividade: "MT com ICMS 17% pode perder competitividade fiscal relativa na harmonização das alíquotas de IBS"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  13. DADOS DE COBERTURA
  // ═══════════════════════════════════════════════════════════════

  cobertura: {
    versao: "3.0",
    data_atualizacao: "2026-02-10",
    localizados: [
      "ICMS — alíquota padrão interna (17%)",
      "ICMS — combustíveis e comunicação (25%)",
      "ICMS — energia solar (isento — Convênio ICMS 3/2026)",
      "ICMS — redução base de cálculo (17,65%)",
      "ICMS — convênios prorrogados até 31/12/2026",
      "ICMS — alíquotas interestaduais (7% e 12%)",
      "ICMS — DIFAL (EC 87/2015)",
      "IPVA — automóvel/utilitário (3,0%)",
      "IPVA — motocicleta (2,0%)",
      "IPVA — ônibus/caminhão (1,0%)",
      "IPVA — isenções (PCD, táxis, transporte escolar)",
      "ITCD — causa mortis progressivo (isento a 5%)",
      "ITCD — doação progressivo (isento a 5%)",
      "ITCD — já atende progressividade obrigatória (LC 227/2026)",
      "ISS Cuiabá — alíquota geral (5%)",
      "ITBI Cuiabá — 2%",
      "SUDAM — norte de MT — redução 75% IRPJ",
      "SUDECO — centro-sul de MT — redução 75% IRPJ",
      "Energia renovável — isenção ICMS (Convênio 3/2026)",
      "Simples Nacional — sublimite (R$ 3.600.000)",
      "Simples Nacional — MEI (R$ 81.000)",
      "Simples Nacional — Anexos I a V completos",
      "Reforma tributária — cronograma MT (2026-2033)",
      "Taxas estaduais — TFUSP, DETRAN-MT, TPEI (nomes identificados)",
      "Impostos federais — IRPJ, CSLL, PIS, COFINS, INSS, FGTS, IRPF"
    ],

    nao_localizados: [
      "ICMS — energia elétrica residencial (alíquota específica)",
      "ICMS — cesta básica (alíquota específica)",
      "ICMS — bebidas alcoólicas",
      "ICMS — medicamentos",
      "ICMS — FECOP (verificar se MT possui)",
      "ICMS — ST (lista completa de produtos e MVA)",
      "ICMS — histórico de alterações",
      "IPVA — embarcações e aeronaves",
      "IPVA — locadoras",
      "IPVA — descontos cota única / parcelamento",
      "IPVA — calendário de vencimento",
      "IPVA — isenção veículos antigos (verificar idade)",
      "ISS Cuiabá — alíquotas por tipo de serviço (detalhamento)",
      "IPTU Cuiabá — alíquotas residencial/comercial/terreno",
      "IPTU Cuiabá — isenções e descontos",
      "Taxas estaduais (valores específicos)",
      "Taxas municipais (lixo, alvará, COSIP)",
      "Reforma tributária — alíquotas previstas IBS/CBS/IS"
    ],

    completude_estimada: "55%",

    contatos_para_completar: [
      "SEFAZ-MT: http://app1.sefaz.mt.gov.br/",
      "Prefeitura de Cuiabá: consultar site oficial",
      "SUDAM: https://www.gov.br/sudam",
      "SUDECO: https://www.gov.br/sudeco",
      "Receita Federal: https://www.gov.br/receitafederal/"
    ]
  }
};

// ═══════════════════════════════════════════════════════════════════════════
//  14. FUNÇÕES UTILITÁRIAS — MATO GROSSO
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Retorna alíquota ISS por tipo de serviço (Cuiabá)
 * @param {string} tipo - Tipo de serviço
 * @returns {object}
 */
function getISSMatoGrosso(tipo) {
  const servico = MATO_GROSSO_TRIBUTARIO.iss.por_tipo_servico[tipo];
  if (servico && servico.aliquota !== null) {
    return servico;
  }
  return {
    aliquota: MATO_GROSSO_TRIBUTARIO.iss.aliquota_geral,
    percentual: MATO_GROSSO_TRIBUTARIO.iss.aliquota_geral_percentual,
    obs: "Alíquota geral de Cuiabá (5%). Alíquotas específicas por serviço não detalhadas — verificar na Prefeitura."
  };
}

/**
 * Retorna alíquota IPTU residencial (Cuiabá)
 * @param {number} areaM2
 * @returns {object}
 */
function getIPTUResidencialMatoGrosso(areaM2) {
  return {
    aliquota: null,
    dados_disponiveis: false,
    obs: "Dados de IPTU residencial de Cuiabá não disponíveis. Verificar na Prefeitura."
  };
}

/**
 * Retorna alíquota IPTU comercial (Cuiabá)
 * @param {number} areaM2
 * @returns {object}
 */
function getIPTUComercialMatoGrosso(areaM2) {
  return {
    aliquota: null,
    dados_disponiveis: false,
    obs: "Dados de IPTU comercial de Cuiabá não disponíveis. Verificar na Prefeitura."
  };
}

/**
 * Retorna alíquota IPVA por tipo de veículo
 * @param {string} tipo - Tipo do veículo
 * @returns {object}
 */
function getIPVAMatoGrosso(tipo) {
  const veiculo = MATO_GROSSO_TRIBUTARIO.ipva.aliquotas[tipo];
  if (veiculo) {
    return veiculo;
  }
  return {
    aliquota: null,
    dados_disponiveis: false,
    obs: "Tipo não encontrado. Disponíveis: automovel_utilitario, motocicleta, onibus_caminhao"
  };
}

/**
 * Calcula ITCD por valor e tipo de transmissão
 * @param {number} valor - Valor do bem
 * @param {string} tipo - "causa_mortis" ou "doacao"
 * @returns {object}
 */
function calcularITCDMatoGrosso(valor, tipo) {
  const faixasKey = tipo === "causa_mortis" ? "aliquotas_causa_mortis" : "aliquotas_doacao";
  const faixas = MATO_GROSSO_TRIBUTARIO.itcmd[faixasKey].faixas;

  for (const faixa of faixas) {
    if (faixa.ate !== undefined && valor <= faixa.ate) {
      return {
        valor: valor,
        tipo: tipo,
        aliquota: faixa.aliquota,
        percentual: faixa.percentual,
        imposto: Math.round(valor * faixa.aliquota * 100) / 100,
        faixa_descricao: faixa.descricao
      };
    }
    if (faixa.de !== undefined && faixa.ate !== undefined && valor >= faixa.de && valor <= faixa.ate) {
      return {
        valor: valor,
        tipo: tipo,
        aliquota: faixa.aliquota,
        percentual: faixa.percentual,
        imposto: Math.round(valor * faixa.aliquota * 100) / 100,
        faixa_descricao: faixa.descricao
      };
    }
    if (faixa.acima_de !== undefined && valor > faixa.acima_de) {
      return {
        valor: valor,
        tipo: tipo,
        aliquota: faixa.aliquota,
        percentual: faixa.percentual,
        imposto: Math.round(valor * faixa.aliquota * 100) / 100,
        faixa_descricao: faixa.descricao
      };
    }
  }

  return { valor: valor, tipo: tipo, aliquota: null, obs: "Faixa não identificada" };
}

/**
 * Verifica se município está em Zona Franca
 * @param {string} municipio
 * @returns {boolean}
 */
function isZonaFrancaMatoGrosso(municipio) {
  return false;
}

/**
 * Verifica se município é ALC
 * @param {string} municipio
 * @returns {boolean}
 */
function isALCMatoGrosso(municipio) {
  return false;
}

/**
 * Retorna percentual de redução IRPJ pela SUDENE
 * @returns {object}
 */
function getReducaoSUDENEMatoGrosso() {
  return {
    ativo: false,
    observacao: "Mato Grosso NÃO está na área de abrangência da SUDENE",
    reducao: 0,
    aliquota_efetiva: 0.15
  };
}

/**
 * Retorna percentual de redução IRPJ pela SUDAM
 * @param {string} municipio - Município (para verificar se está no norte de MT)
 * @returns {object}
 */
function getReducaoSUDAMMatoGrosso(municipio) {
  return {
    ativo: true,
    abrangencia_parcial: true,
    area: "Norte de Mato Grosso",
    reducao: 0.75,
    reducao_percentual: "75%",
    aliquota_efetiva: 0.0375,
    aliquota_efetiva_percentual: "3,75%",
    condicao: "Projetos aprovados na área de atuação da SUDAM",
    nota: "Verificar se o município específico está na área de abrangência da SUDAM"
  };
}

/**
 * Retorna percentual de redução IRPJ pela SUDECO
 * @param {string} municipio - Município (para verificar se está no centro-sul de MT)
 * @returns {object}
 */
function getReducaoSUDECOMatoGrosso(municipio) {
  return {
    ativo: true,
    abrangencia_parcial: true,
    area: "Centro-Sul de Mato Grosso",
    reducao: 0.75,
    reducao_percentual: "75%",
    aliquota_efetiva: 0.0375,
    aliquota_efetiva_percentual: "3,75%",
    condicao: "Projetos aprovados na área de atuação da SUDECO",
    nota: "Verificar se o município específico está na área de abrangência da SUDECO"
  };
}

/**
 * Retorna ICMS efetivo (padrão + FECOP se houver)
 * @returns {object}
 */
function getICMSEfetivoMatoGrosso() {
  const icms = MATO_GROSSO_TRIBUTARIO.icms;
  const fecop = icms.fecop && icms.fecop.existe ? icms.fecop.adicional : 0;
  return {
    aliquota_padrao: icms.aliquota_padrao,
    fecop: fecop,
    aliquota_efetiva: icms.aliquota_padrao + fecop,
    aliquota_efetiva_percentual: ((icms.aliquota_padrao + fecop) * 100).toFixed(1) + "%"
  };
}

/**
 * Retorna resumo tributário do estado
 * @returns {object}
 */
function resumoTributarioMatoGrosso() {
  const d = MATO_GROSSO_TRIBUTARIO;
  return {
    estado: d.dados_gerais.nome,
    sigla: d.dados_gerais.sigla,
    regiao: d.dados_gerais.regiao,
    capital: d.dados_gerais.capital,
    icms_padrao: d.icms.aliquota_padrao,
    icms_efetivo: getICMSEfetivoMatoGrosso().aliquota_efetiva,
    icms_nota: d.icms.nota,
    ipva_automovel: d.ipva.aliquotas.automovel_utilitario.aliquota,
    ipva_motocicleta: d.ipva.aliquotas.motocicleta.aliquota,
    ipva_onibus_caminhao: d.ipva.aliquotas.onibus_caminhao.aliquota,
    itcmd_tipo: d.itcmd.tipo,
    itcmd_maximo: "5%",
    iss_geral: d.iss.aliquota_geral,
    itbi: d.itbi.aliquota_geral,
    sublimite_simples: d.simples_nacional.sublimite_estadual,
    sudam: d.incentivos.sudam.ativo,
    sudam_parcial: d.incentivos.sudam.abrangencia_parcial,
    sudeco: d.incentivos.sudeco.ativo,
    sudeco_parcial: d.incentivos.sudeco.abrangencia_parcial,
    sudene: d.incentivos.sudene.ativo,
    zona_franca: d.dados_gerais.zona_franca.existe,
    suframa: d.dados_gerais.suframa.abrangencia,
    energia_solar_isento: true,
    completude: d.cobertura.completude_estimada
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  15. EXPORTAÇÃO (Padrão Grupo 2)
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        ...MATO_GROSSO_TRIBUTARIO,
        utils: {
            getISS: getISSMatoGrosso,
            getIPTUResidencial: getIPTUResidencialMatoGrosso,
            getIPTUComercial: getIPTUComercialMatoGrosso,
            getIPVA: getIPVAMatoGrosso,
            calcularITCD: calcularITCDMatoGrosso,
            isZonaFranca: isZonaFrancaMatoGrosso,
            isALC: isALCMatoGrosso,
            getReducaoSUDENE: getReducaoSUDENEMatoGrosso,
            getReducaoSUDAM: getReducaoSUDAMMatoGrosso,
            getReducaoSUDECO: getReducaoSUDECOMatoGrosso,
            getICMSEfetivo: getICMSEfetivoMatoGrosso,
            resumoTributario: resumoTributarioMatoGrosso,
        },
    };
}

if (typeof window !== "undefined") {
    window.MATO_GROSSO_TRIBUTARIO = MATO_GROSSO_TRIBUTARIO;
    window.MatoGrossoTributario = {
        getISS: getISSMatoGrosso,
        getIPTUResidencial: getIPTUResidencialMatoGrosso,
        getIPTUComercial: getIPTUComercialMatoGrosso,
        getIPVA: getIPVAMatoGrosso,
        calcularITCD: calcularITCDMatoGrosso,
        isZonaFranca: isZonaFrancaMatoGrosso,
        isALC: isALCMatoGrosso,
        getReducaoSUDENE: getReducaoSUDENEMatoGrosso,
        getReducaoSUDAM: getReducaoSUDAMMatoGrosso,
        getReducaoSUDECO: getReducaoSUDECOMatoGrosso,
        getICMSEfetivo: getICMSEfetivoMatoGrosso,
        resumoTributario: resumoTributarioMatoGrosso,
    };
}
