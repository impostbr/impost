/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MATO_GROSSO_DO_SUL.JS — Base de Dados Tributária Completa do Estado de Mato Grosso do Sul
 * ═══════════════════════════════════════════════════════════════════════════
 * Versão 3.0 — Padronizado conforme modelo roraima.js v3.0
 * Dados verificados via fontes oficiais (SEFAZ-MS, Receita Federal, Prefeitura de Campo Grande)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ESTRUTURA PADRÃO (15 seções obrigatórias):
 *   01. dados_gerais        — Identificação, links, legislação base
 *   02. icms                — Alíquotas, diferenciadas, interestaduais, ST, DIFAL
 *   03. ipva                — Alíquotas, calendário, descontos, isenções
 *   04. itcmd               — Alíquotas, base de cálculo, isenções, reforma
 *   05. iss                 — Tabela por grupo de serviço (município-referência)
 *   06. iptu                — Alíquotas, progressividade, isenções
 *   07. itbi                — Alíquota, base de cálculo
 *   08. taxas               — Estaduais e municipais (Campo Grande)
 *   09. federal             — IRPJ, CSLL, PIS, COFINS, IOF, ITR, INSS, FGTS, IRPF
 *   10. simples_nacional    — Anexos, faixas, sublimite, MEI
 *   11. incentivos          — SUDAM/SUDECO/SUDENE, ZFM, SUFRAMA, programas estaduais
 *   12. reforma_tributaria  — EC 132, LC 214, LC 227, transição IBS/CBS
 *   13. cobertura           — Versão, itens localizados/pendentes, contatos
 *   14. funções utilitárias — Helpers de cálculo
 *   15. exportação          — module.exports + window (padrão Grupo 2)
 *
 * FONTES CONSULTADAS:
 *   • SEFAZ-MS — www.sefaz.ms.gov.br
 *   • Lei nº 2.657/1996 (ICMS)
 *   • Lei nº 10.849/1992; Decreto nº 55.937/2023 (IPVA)
 *   • Decreto nº 16.694/2025 (Tabela IPVA 2026)
 *   • Lei nº 4.863/1996 (ITCD)
 *   • Lei nº 6.472/2025 (Desconto doação ITCD, REFIS)
 *   • Legislação municipal de Campo Grande (ISS, IPTU, ITBI)
 *   • LC nº 116/2003 (ISS federal)
 *   • LC nº 214/2025 (Reforma Tributária — IBS/CBS)
 *   • LC nº 227/2026 (Comitê Gestor IBS, ITCMD progressivo obrigatório)
 *   • EC nº 132/2023 (Reforma Tributária)
 *   • Receita Federal — www.gov.br/receitafederal
 *
 * ATUALIZAÇÃO: 10/02/2026
 * ═══════════════════════════════════════════════════════════════════════════
 */

const MATO_GROSSO_DO_SUL_TRIBUTARIO = {

  // ═══════════════════════════════════════════════════════════════
  //  1. DADOS GERAIS
  // ═══════════════════════════════════════════════════════════════
  dados_gerais: {
    nome: "Mato Grosso do Sul",
    sigla: "MS",
    regiao: "Centro-Oeste",
    capital: "Campo Grande",
    codigo_ibge: "50",
    zona_franca: {
      existe: false,
      observacao: "Não há Zona Franca em Mato Grosso do Sul"
    },
    alc: {
      existe: false,
      observacao: "Não há Área de Livre Comércio em Mato Grosso do Sul"
    },
    sudam: {
      abrangencia: true,
      abrangencia_parcial: true,
      area: "Norte de Mato Grosso do Sul",
      beneficios: "Redução de até 75% do IRPJ para projetos aprovados",
      status: "Ativa"
    },
    sudene: {
      abrangencia: false,
      observacao: "Mato Grosso do Sul não está na área de abrangência da SUDENE"
    },
    sudeco: {
      abrangencia: true,
      abrangencia_parcial: true,
      area: "Centro-Sul de Mato Grosso do Sul",
      beneficios: "Redução de até 75% do IRPJ para projetos aprovados",
      status: "Ativa"
    },
    suframa: {
      abrangencia: false,
      observacao: "MS não está na área de abrangência da SUFRAMA"
    },
    sefaz: {
      url: "https://www.sefaz.ms.gov.br/",
      ipva: "https://www.sefaz.ms.gov.br/ipva/",
      itcd: "https://www.sefaz.ms.gov.br/itcd/",
      contato: "DADO NÃO LOCALIZADO"
    },
    prefeitura_capital: {
      url: "DADO NÃO LOCALIZADO",
      contato: "DADO NÃO LOCALIZADO"
    },
    destaque: "MENOR ICMS DO BRASIL (17%) — enquanto 25 estados aumentaram alíquotas em 2026, MS manteve-se competitivo",
    legislacao_base: {
      icms: "Lei nº 2.657/1996, art. 14, inciso I",
      ipva: "Lei nº 10.849/1992; Decreto nº 55.937/2023",
      itcmd: "Lei nº 4.863/1996",
      iss: "Legislação municipal de Campo Grande",
      iptu: "Legislação municipal de Campo Grande"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  2. ICMS — IMPOSTO SOBRE CIRCULAÇÃO DE MERCADORIAS E SERVIÇOS
  // ═══════════════════════════════════════════════════════════════
  icms: {
    aliquota_padrao: 0.17,
    aliquota_padrao_percentual: "17%",
    vigencia_aliquota_atual: "Vigente",
    base_legal: "Lei nº 2.657/1996, art. 14, inciso I",
    nota: "MENOR ALÍQUOTA DE ICMS DO BRASIL — MS manteve 17% enquanto 25 estados aumentaram em 2026",

    historico: [
      { vigencia: "Vigente", aliquota: 0.17, percentual: "17%", base_legal: "Lei nº 2.657/1996" }
    ],

    aliquotas_diferenciadas: {
      energia_eletrica: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Alíquota reduzida para consumo residencial — verificar legislação específica na SEFAZ-MS"
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
        obs: "Alíquota reduzida — verificar legislação específica na SEFAZ-MS"
      },
      bebidas_alcoolicas: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ-MS"
      },
      medicamentos: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ-MS"
      }
    },

    convenios_2026: {
      descricao: "MS prorrogou diversos convênios ICMS até 31/12/2026",
      base_legal: "Convênio ICMS nº 21/2026 (29/01/2026)"
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
      observacao: "FECOP não identificado na pesquisa — verificar na SEFAZ-MS"
    },

    difal: {
      aplicacao: true,
      calculo: "17% - Alíquota interestadual de origem",
      descricao: "Cobrado na entrada de mercadorias de outros estados para consumo ou ativo fixo de contribuintes",
      base_legal: "EC 87/2015"
    },

    substituicao_tributaria: {
      existe: true,
      obs: "Combustíveis e outros produtos com ST — verificar lista completa na SEFAZ-MS"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  3. IPVA — IMPOSTO SOBRE PROPRIEDADE DE VEÍCULOS AUTOMOTORES
  // ═══════════════════════════════════════════════════════════════
  ipva: {
    base_legal: "Lei nº 10.849/1992; Decreto nº 55.937/2023; Decreto nº 16.694/2025 (Tabela IPVA 2026)",
    base_calculo: "Valor venal conforme tabela FIPE",

    aliquotas: {
      automovel_utilitario: {
        aliquota: 0.03,
        percentual: "3,0%",
        descricao: "Automóveis de passeio e utilitários"
      },
      motocicleta: {
        aliquota: 0.02,
        percentual: "2,0%",
        descricao: "Motocicletas e similares"
      },
      onibus_micro_onibus: {
        aliquota: 0.015,
        percentual: "1,5%",
        descricao: "Ônibus e micro-ônibus"
      },
      caminhao: {
        aliquota: 0.01,
        percentual: "1,0%",
        descricao: "Caminhões de qualquer capacidade de carga"
      },
      embarcacao: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ-MS"
      },
      aeronave: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ-MS"
      },
      locadora: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ-MS"
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

    ipva_verde: {
      descricao: "Programa de incentivo fiscal para veículos elétricos e híbridos",
      status: "Sem legislação específica formalizada em MS",
      observacao: "Não há lei específica disciplinando o IPVA Verde em MS"
    },

    descontos: {
      antecipacao: {
        dados_disponiveis: false,
        obs: "Verificar descontos para cota única na SEFAZ-MS"
      },
      parcelamento: {
        dados_disponiveis: false,
        obs: "Verificar parcelamento na SEFAZ-MS"
      }
    },

    calendario_vencimento: {
      descricao: "Divulgado pela SEFAZ-MS, cotas de janeiro a março/abril. Decreto nº 16.694/2025 publica tabela 2026.",
      dados_disponiveis: false
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  4. ITCMD — IMPOSTO SOBRE TRANSMISSÃO CAUSA MORTIS E DOAÇÃO
  //     Nota: Em MS é chamado ITCD
  // ═══════════════════════════════════════════════════════════════
  itcmd: {
    nome_local: "ITCD — Imposto sobre Transmissão Causa Mortis e Doação",
    base_legal: "Lei nº 4.863/1996; Lei nº 6.472/2025 (desconto doação)",
    tipo: "Alíquotas fixas (necessita adequação à LC 227/2026 para progressividade)",

    aliquotas_causa_mortis: {
      tipo: "Fixa",
      aliquota: 0.05,
      percentual: "5%",
      descricao: "Alíquota fixa para transmissão causa mortis (herança)"
    },

    aliquotas_doacao: {
      tipo: "Fixa",
      aliquota: 0.03,
      percentual: "3%",
      descricao: "Alíquota fixa para doação"
    },

    base_calculo: "Valor venal do bem ou direito transmitido",

    desconto_inedito_2025: {
      descricao: "Desconto inédito de 30% no pagamento à vista do ITCD sobre doações",
      percentual: 0.30,
      percentual_descricao: "30%",
      base_legal: "Lei nº 6.472/2025",
      condicao: "Doações de bens e direitos formalizadas dentro do prazo legal"
    },

    refis_itcd: {
      descricao: "Programa de regularização de débitos de ITCD com possibilidade de parcelamento",
      base_legal: "Lei nº 6.472/2025"
    },

    reforma_tributaria_impacto: "MS precisará ajustar legislação de alíquotas fixas (5% e 3%) para progressividade obrigatória (LC 227/2026)"
  },

  // ═══════════════════════════════════════════════════════════════
  //  5. ISS — IMPOSTO SOBRE SERVIÇOS (Campo Grande — Capital)
  // ═══════════════════════════════════════════════════════════════
  iss: {
    municipio_referencia: "Campo Grande",
    base_legal: "Legislação municipal de Campo Grande; LC nº 116/2003 (federal)",
    aliquota_minima_federal: 0.02,
    aliquota_maxima_federal: 0.05,

    aliquota_geral: 0.05,
    aliquota_geral_percentual: "5%",
    faixa_aliquotas: "Variáveis conforme tipo de serviço — alíquota geral 5%",

    por_tipo_servico: {
      informatica: { aliquota: null, dados_disponiveis: false, obs: "Verificar na Prefeitura de Campo Grande" },
      saude: { aliquota: null, dados_disponiveis: false, obs: "Verificar na Prefeitura de Campo Grande" },
      educacao: { aliquota: null, dados_disponiveis: false, obs: "Verificar na Prefeitura de Campo Grande" },
      construcao_civil: { aliquota: null, dados_disponiveis: false, obs: "Verificar na Prefeitura de Campo Grande" },
      contabilidade: { aliquota: null, dados_disponiveis: false, obs: "Verificar na Prefeitura de Campo Grande" },
      advocacia: { aliquota: null, dados_disponiveis: false, obs: "Verificar na Prefeitura de Campo Grande" },
      transporte: { aliquota: null, dados_disponiveis: false, obs: "Verificar na Prefeitura de Campo Grande" }
    },

    observacao: "Alíquotas específicas variáveis conforme anexo da legislação municipal — dados detalhados não localizados"
  },

  // ═══════════════════════════════════════════════════════════════
  //  6. IPTU — IMPOSTO PREDIAL E TERRITORIAL URBANO (Campo Grande)
  // ═══════════════════════════════════════════════════════════════
  iptu: {
    municipio_referencia: "Campo Grande",
    base_legal: "Legislação municipal de Campo Grande",
    base_calculo: "Valor venal do imóvel conforme PGV municipal",

    residencial: {
      dados_disponiveis: false,
      obs: "Alíquotas variáveis conforme uso e valor venal — verificar na Prefeitura de Campo Grande"
    },

    comercial: {
      dados_disponiveis: false,
      obs: "Verificar na Prefeitura de Campo Grande"
    },

    terreno_nao_edificado: {
      dados_disponiveis: false,
      obs: "Verificar na Prefeitura de Campo Grande"
    },

    industrial: {
      dados_disponiveis: false,
      obs: "Verificar na Prefeitura de Campo Grande"
    },

    isencoes: {
      dados_disponiveis: false,
      obs: "Verificar na Prefeitura de Campo Grande"
    },

    descontos: {
      dados_disponiveis: false,
      obs: "Verificar na Prefeitura de Campo Grande"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  7. ITBI — IMPOSTO SOBRE TRANSMISSÃO DE BENS IMÓVEIS (Campo Grande)
  // ═══════════════════════════════════════════════════════════════
  itbi: {
    municipio_referencia: "Campo Grande",
    base_legal: "Legislação municipal de Campo Grande",
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
        nome: "Taxas do DETRAN-MS",
        descricao: "Licenciamento, transferência, emissão de CNH, etc.",
        valor: null,
        dados_disponiveis: false
      },
      taxa_incendio_bombeiros: {
        nome: "TPEI — Taxa de Prevenção e Extinção de Incêndios",
        orgao: "Corpo de Bombeiros Militar de Mato Grosso do Sul",
        descricao: "Cobrada anualmente de proprietários de imóveis",
        valor: null,
        dados_disponiveis: false
      }
    },

    // ── Taxas Municipais Campo Grande ──
    municipais_campo_grande: {
      municipio_referencia: "Campo Grande",
      taxa_lixo: { dados_disponiveis: false, obs: "Verificar na Prefeitura de Campo Grande" },
      alvara_funcionamento: { dados_disponiveis: false, obs: "Verificar na Prefeitura de Campo Grande" },
      cosip: { dados_disponiveis: false, obs: "Verificar na Prefeitura de Campo Grande" }
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  9. IMPOSTOS FEDERAIS (aplicáveis em Mato Grosso do Sul)
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
      }
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
      }
    },

    ipi: {
      referencia: "Tabela de Incidência do IPI (TIPI) vigente",
      observacao: "MS não possui benefícios de IPI tipo ZFM/SUFRAMA"
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
      area: "Norte de Mato Grosso do Sul",
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
      area: "Centro-Sul de Mato Grosso do Sul",
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
      observacao: "MS NÃO está na área de abrangência da SUDENE"
    },

    zona_franca: {
      ativo: false,
      observacao: "Não há Zona Franca em Mato Grosso do Sul"
    },

    suframa: {
      ativo: false,
      observacao: "MS não está na área de abrangência da SUFRAMA"
    },

    incentivos_estaduais: {
      icms_competitivo: {
        descricao: "Manutenção da menor alíquota de ICMS do Brasil (17%) para atrair investimentos",
        aplicacao: "Todas as operações sujeitas ao ICMS"
      },
      desconto_itcd_doacao: {
        descricao: "30% de desconto no pagamento à vista do ITCD sobre doações de bens e direitos",
        base_legal: "Lei nº 6.472/2025"
      },
      refis_itcd: {
        descricao: "Programa de regularização de débitos de ITCD com possibilidade de parcelamento",
        base_legal: "Lei nº 6.472/2025"
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
    cronograma_ms: {
      fase_2026: "Testes com alíquotas simbólicas — CBS 0,9% + IBS 0,1%. Valor recolhido deduzido dos tributos atuais.",
      fase_2027_2032: "Redução gradual de ICMS/ISS e aumento gradual de IBS",
      fase_2033: "Extinção completa do ICMS e ISS — vigência plena do IBS"
    },
    impactos_ms: {
      itcmd: "MS precisará ajustar alíquotas fixas (5% herança / 3% doação) para progressividade obrigatória (LC 227/2026)",
      competitividade: "MS com ICMS 17% (menor do Brasil) pode perder vantagem competitiva na harmonização de alíquotas de IBS, porém estratégia de manutenção de ICMS baixo demonstra comprometimento",
      alerta_governo: "Governo de MS orientou contribuintes sobre prazos e vantagens no ITCD Refis e IPVA em dezembro de 2025"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  13. DADOS DE COBERTURA
  // ═══════════════════════════════════════════════════════════════
  cobertura: {
    versao: "3.0",
    data_atualizacao: "2026-02-10",
    localizados: [
      "ICMS — alíquota padrão interna (17% — menor do Brasil)",
      "ICMS — combustíveis e comunicação (25%)",
      "ICMS — convênios prorrogados até 31/12/2026 (Convênio 21/2026)",
      "ICMS — alíquotas interestaduais (7% e 12%)",
      "ICMS — DIFAL (EC 87/2015)",
      "IPVA — automóvel/utilitário (3,0%)",
      "IPVA — motocicleta (2,0%)",
      "IPVA — ônibus/micro-ônibus (1,5%)",
      "IPVA — caminhão (1,0%)",
      "IPVA — isenções (PCD, táxis, transporte escolar)",
      "IPVA — IPVA Verde mencionado (sem legislação formal)",
      "ITCD — causa mortis fixa (5%)",
      "ITCD — doação fixa (3%)",
      "ITCD — desconto inédito 30% à vista (Lei 6.472/2025)",
      "ITCD — REFIS ITCD (Lei 6.472/2025)",
      "ITCD — impacto reforma (necessita progressividade — LC 227/2026)",
      "ISS Campo Grande — alíquota geral (5%)",
      "ITBI Campo Grande — 2%",
      "SUDAM — norte de MS — redução 75% IRPJ",
      "SUDECO — centro-sul de MS — redução 75% IRPJ",
      "Simples Nacional — sublimite (R$ 3.600.000)",
      "Simples Nacional — MEI (R$ 81.000)",
      "Simples Nacional — Anexos I a V completos",
      "Reforma tributária — cronograma MS (2026-2033)",
      "Taxas estaduais — TFUSP, DETRAN-MS, TPEI (nomes identificados)",
      "Impostos federais — IRPJ, CSLL, PIS, COFINS, INSS, FGTS, IRPF"
    ],

    nao_localizados: [
      "ICMS — energia elétrica residencial (alíquota específica)",
      "ICMS — cesta básica (alíquota específica)",
      "ICMS — bebidas alcoólicas",
      "ICMS — medicamentos",
      "ICMS — FECOP (verificar se MS possui)",
      "ICMS — ST (lista completa)",
      "ICMS — histórico de alterações",
      "IPVA — embarcações e aeronaves",
      "IPVA — locadoras",
      "IPVA — descontos cota única / parcelamento",
      "IPVA — calendário de vencimento detalhado",
      "IPVA — isenção veículos antigos (verificar idade)",
      "ISS Campo Grande — alíquotas por tipo de serviço (detalhamento)",
      "IPTU Campo Grande — alíquotas residencial/comercial/terreno",
      "IPTU Campo Grande — isenções e descontos",
      "Taxas estaduais (valores específicos)",
      "Taxas municipais (lixo, alvará, COSIP)",
      "Reforma tributária — alíquotas previstas IBS/CBS/IS"
    ],

    completude_estimada: "55%",

    contatos_para_completar: [
      "SEFAZ-MS: https://www.sefaz.ms.gov.br/",
      "Prefeitura de Campo Grande: consultar site oficial",
      "SUDAM: https://www.gov.br/sudam",
      "SUDECO: https://www.gov.br/sudeco",
      "Receita Federal: https://www.gov.br/receitafederal/"
    ]
  }
};

// ═══════════════════════════════════════════════════════════════════════════
//  14. FUNÇÕES UTILITÁRIAS — MATO GROSSO DO SUL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Retorna alíquota ISS por tipo de serviço (Campo Grande)
 * @param {string} tipo - Tipo de serviço
 * @returns {object}
 */
function getISSMatoGrossoDoSul(tipo) {
  const servico = MATO_GROSSO_DO_SUL_TRIBUTARIO.iss.por_tipo_servico[tipo];
  if (servico && servico.aliquota !== null) {
    return servico;
  }
  return {
    aliquota: MATO_GROSSO_DO_SUL_TRIBUTARIO.iss.aliquota_geral,
    percentual: MATO_GROSSO_DO_SUL_TRIBUTARIO.iss.aliquota_geral_percentual,
    obs: "Alíquota geral de Campo Grande (5%). Alíquotas específicas por serviço não detalhadas — verificar na Prefeitura."
  };
}

/**
 * Retorna alíquota IPTU residencial (Campo Grande)
 * @returns {object}
 */
function getIPTUResidencialMatoGrossoDoSul() {
  return {
    aliquota: null,
    dados_disponiveis: false,
    obs: "Dados de IPTU residencial de Campo Grande não disponíveis. Verificar na Prefeitura."
  };
}

/**
 * Retorna alíquota IPTU comercial (Campo Grande)
 * @returns {object}
 */
function getIPTUComercialMatoGrossoDoSul() {
  return {
    aliquota: null,
    dados_disponiveis: false,
    obs: "Dados de IPTU comercial de Campo Grande não disponíveis. Verificar na Prefeitura."
  };
}

/**
 * Retorna alíquota IPVA por tipo de veículo
 * @param {string} tipo - Tipo do veículo
 * @returns {object}
 */
function getIPVAMatoGrossoDoSul(tipo) {
  const veiculo = MATO_GROSSO_DO_SUL_TRIBUTARIO.ipva.aliquotas[tipo];
  if (veiculo) {
    return veiculo;
  }
  return {
    aliquota: null,
    dados_disponiveis: false,
    obs: "Tipo não encontrado. Disponíveis: automovel_utilitario, motocicleta, onibus_micro_onibus, caminhao"
  };
}

/**
 * Calcula ITCD (alíquotas fixas em MS)
 * @param {number} valor - Valor do bem
 * @param {string} tipo - "causa_mortis" ou "doacao"
 * @returns {object}
 */
function calcularITCDMatoGrossoDoSul(valor, tipo) {
  const aliquota = tipo === "causa_mortis"
    ? MATO_GROSSO_DO_SUL_TRIBUTARIO.itcmd.aliquotas_causa_mortis.aliquota
    : MATO_GROSSO_DO_SUL_TRIBUTARIO.itcmd.aliquotas_doacao.aliquota;

  const percentual = tipo === "causa_mortis"
    ? MATO_GROSSO_DO_SUL_TRIBUTARIO.itcmd.aliquotas_causa_mortis.percentual
    : MATO_GROSSO_DO_SUL_TRIBUTARIO.itcmd.aliquotas_doacao.percentual;

  const imposto = Math.round(valor * aliquota * 100) / 100;

  const result = {
    valor: valor,
    tipo: tipo,
    aliquota: aliquota,
    percentual: percentual,
    imposto: imposto
  };

  // Se doação, mostrar desconto possível
  if (tipo === "doacao") {
    const desconto30 = MATO_GROSSO_DO_SUL_TRIBUTARIO.itcmd.desconto_inedito_2025;
    result.desconto_vista = {
      percentual: desconto30.percentual,
      descricao: desconto30.descricao,
      imposto_com_desconto: Math.round(imposto * (1 - desconto30.percentual) * 100) / 100,
      base_legal: desconto30.base_legal
    };
  }

  return result;
}

/**
 * Verifica se município está em Zona Franca
 * @param {string} municipio
 * @returns {boolean}
 */
function isZonaFrancaMatoGrossoDoSul(municipio) {
  return false;
}

/**
 * Verifica se município é ALC
 * @param {string} municipio
 * @returns {boolean}
 */
function isALCMatoGrossoDoSul(municipio) {
  return false;
}

/**
 * Retorna percentual de redução IRPJ pela SUDENE
 * @returns {object}
 */
function getReducaoSUDENEMatoGrossoDoSul() {
  return {
    ativo: false,
    observacao: "MS NÃO está na área de abrangência da SUDENE",
    reducao: 0,
    aliquota_efetiva: 0.15
  };
}

/**
 * Retorna percentual de redução IRPJ pela SUDAM
 * @returns {object}
 */
function getReducaoSUDAMMatoGrossoDoSul() {
  return {
    ativo: true,
    abrangencia_parcial: true,
    area: "Norte de Mato Grosso do Sul",
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
 * @returns {object}
 */
function getReducaoSUDECOMatoGrossoDoSul() {
  return {
    ativo: true,
    abrangencia_parcial: true,
    area: "Centro-Sul de Mato Grosso do Sul",
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
function getICMSEfetivoMatoGrossoDoSul() {
  const icms = MATO_GROSSO_DO_SUL_TRIBUTARIO.icms;
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
function resumoTributarioMatoGrossoDoSul() {
  const d = MATO_GROSSO_DO_SUL_TRIBUTARIO;
  return {
    estado: d.dados_gerais.nome,
    sigla: d.dados_gerais.sigla,
    regiao: d.dados_gerais.regiao,
    capital: d.dados_gerais.capital,
    destaque: d.dados_gerais.destaque,
    icms_padrao: d.icms.aliquota_padrao,
    icms_efetivo: getICMSEfetivoMatoGrossoDoSul().aliquota_efetiva,
    icms_nota: d.icms.nota,
    ipva_automovel: d.ipva.aliquotas.automovel_utilitario.aliquota,
    ipva_motocicleta: d.ipva.aliquotas.motocicleta.aliquota,
    ipva_onibus: d.ipva.aliquotas.onibus_micro_onibus.aliquota,
    ipva_caminhao: d.ipva.aliquotas.caminhao.aliquota,
    itcmd_heranca: d.itcmd.aliquotas_causa_mortis.percentual,
    itcmd_doacao: d.itcmd.aliquotas_doacao.percentual,
    itcmd_desconto_doacao: "30% à vista (Lei 6.472/2025)",
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
    completude: d.cobertura.completude_estimada
  };
}


// ═══════════════════════════════════════════════════════════════════════════
//  15. EXPORTAÇÃO (Padrão Grupo 2)
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        ...MATO_GROSSO_DO_SUL_TRIBUTARIO,
        utils: {
            getISS: getISSMatoGrossoDoSul,
            getIPTUResidencial: getIPTUResidencialMatoGrossoDoSul,
            getIPTUComercial: getIPTUComercialMatoGrossoDoSul,
            getIPVA: getIPVAMatoGrossoDoSul,
            calcularITCD: calcularITCDMatoGrossoDoSul,
            isZonaFranca: isZonaFrancaMatoGrossoDoSul,
            isALC: isALCMatoGrossoDoSul,
            getReducaoSUDENE: getReducaoSUDENEMatoGrossoDoSul,
            getReducaoSUDAM: getReducaoSUDAMMatoGrossoDoSul,
            getReducaoSUDECO: getReducaoSUDECOMatoGrossoDoSul,
            getICMSEfetivo: getICMSEfetivoMatoGrossoDoSul,
            resumoTributario: resumoTributarioMatoGrossoDoSul,
        },
    };
}

if (typeof window !== "undefined") {
    window.MATO_GROSSO_DO_SUL_TRIBUTARIO = MATO_GROSSO_DO_SUL_TRIBUTARIO;
    window.MatoGrossoDoSulTributario = {
        getISS: getISSMatoGrossoDoSul,
        getIPTUResidencial: getIPTUResidencialMatoGrossoDoSul,
        getIPTUComercial: getIPTUComercialMatoGrossoDoSul,
        getIPVA: getIPVAMatoGrossoDoSul,
        calcularITCD: calcularITCDMatoGrossoDoSul,
        isZonaFranca: isZonaFrancaMatoGrossoDoSul,
        isALC: isALCMatoGrossoDoSul,
        getReducaoSUDENE: getReducaoSUDENEMatoGrossoDoSul,
        getReducaoSUDAM: getReducaoSUDAMMatoGrossoDoSul,
        getReducaoSUDECO: getReducaoSUDECOMatoGrossoDoSul,
        getICMSEfetivo: getICMSEfetivoMatoGrossoDoSul,
        resumoTributario: resumoTributarioMatoGrossoDoSul,
    };
}
