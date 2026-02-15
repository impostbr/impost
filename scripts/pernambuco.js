/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PERNAMBUCO.JS — Base de Dados Tributária Completa do Estado de Pernambuco
 * ═══════════════════════════════════════════════════════════════════════════
 * Versão 3.0 — Padronizado conforme template roraima.js v3.0
 * Dados verificados via fontes oficiais (SEFAZ/PE, Receita Federal, Prefeitura do Recife)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ESTRUTURA PADRÃO (15 seções obrigatórias):
 *   01. dados_gerais        — Identificação, links, legislação base
 *   02. icms                — Alíquotas, diferenciadas, interestaduais, FECEP, DIFAL
 *   03. ipva                — Alíquotas, isenções, descontos
 *   04. itcmd               — Alíquotas, base de cálculo, isenções, reforma
 *   05. iss                 — Tabela por tipo de serviço (Recife — capital)
 *   06. iptu                — Alíquotas, base de cálculo (Recife)
 *   07. itbi                — Alíquota, base de cálculo (Recife)
 *   08. taxas               — Estaduais e municipais (Recife)
 *   09. federal             — IRPJ, CSLL, PIS, COFINS, IOF, ITR, INSS, FGTS, IRPF
 *   10. simples_nacional    — Anexos, faixas, sublimite, MEI
 *   11. incentivos          — SUDAM/SUDENE, ZFM, SUFRAMA, programas estaduais
 *   12. reforma_tributaria  — EC 132, LC 214, LC 227, transição IBS/CBS
 *   13. cobertura           — Versão, itens localizados/pendentes, contatos
 *   14. funções utilitárias — Helpers de cálculo
 *   15. exportação          — module.exports + window (padrão Grupo 2)
 *
 * FONTES CONSULTADAS:
 *   • SEFAZ/PE — www.sefaz.pe.gov.br
 *   • Lei nº 15.730/2016 (ICMS base)
 *   • Lei nº 18.305/2023 (Alíquota ICMS 20,5% desde 01/01/2024)
 *   • Lei Complementar nº 563/2025 (ITCMD 5% herança, 2% doação desde 01/01/2026)
 *   • Lei Complementar nº 227/2026 (ITCMD progressivo obrigatório, IPVA isenção ≥20 anos)
 *   • Lei Complementar nº 53/2008 (Código Tributário de Recife)
 *   • Lei Municipal nº 19.148/2024 (ISS Recife)
 *   • Lei nº 19.452/2025 (ISS Recife)
 *   • Instrução Normativa nº 19/2025 (Redução de alíquota ICMS)
 *   • Portaria CGSN nº 49/2024 (Simples Nacional)
 *   • Receita Federal — www.gov.br/receitafederal
 *
 * ATUALIZAÇÃO: 10/02/2026
 * ═══════════════════════════════════════════════════════════════════════════
 */

const PERNAMBUCO_TRIBUTARIO = {

  // ═══════════════════════════════════════════════════════════════
  //  1. DADOS GERAIS
  // ═══════════════════════════════════════════════════════════════
  dados_gerais: {
    nome: "Pernambuco",
    sigla: "PE",
    regiao: "Nordeste",
    capital: "Recife",
    codigo_ibge: "26",
    zona_franca: {
      existe: false,
      observacao: "Não há Zona Franca em Pernambuco"
    },
    alc: {
      existe: false,
      observacao: "Não há Área de Livre Comércio em Pernambuco"
    },
    sudam: {
      abrangencia: false,
      observacao: "Pernambuco não está na área de abrangência da SUDAM"
    },
    sudene: {
      abrangencia: true,
      beneficios: "Redução de IRPJ até 75%, redução de CSLL, incentivos para projetos aprovados",
      status: "SUDENE extinta em 26/12/2025 pela LC nº 224/2025, mas benefícios continuam em transição"
    },
    suframa: {
      abrangencia: false,
      observacao: "Pernambuco não está na área de abrangência da SUFRAMA"
    },
    suape: {
      existe: true,
      nome: "Suape — Complexo Industrial Portuário de Suape",
      beneficios: "Incentivos fiscais específicos para empresas instaladas no porto"
    },
    sefaz: {
      url: "https://www.sefaz.pe.gov.br",
      legislacao: "DADO NÃO LOCALIZADO",
      contato: "DADO NÃO LOCALIZADO"
    },
    prefeitura_capital: {
      url: "https://www.recife.pe.gov.br",
      contato: "DADO NÃO LOCALIZADO"
    },
    legislacao_base: {
      icms: "Lei nº 15.730/2016; Lei nº 18.305/2023 (alíquota 20,5% desde 01/01/2024)",
      ipva: "Lei nº 18.305/2023; Legislação estadual de IPVA",
      itcmd: "Lei Complementar nº 563/2025 (5% herança, 2% doação desde 01/01/2026)",
      codigo_tributario_recife: "Lei Complementar nº 53/2008 (Código Tributário de Recife)"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  2. ICMS — IMPOSTO SOBRE CIRCULAÇÃO DE MERCADORIAS E SERVIÇOS
  // ═══════════════════════════════════════════════════════════════
  icms: {
    aliquota_padrao: 0.205,
    aliquota_padrao_percentual: "20,5%",
    aliquota_padrao_anterior: 0.18,
    vigencia_aliquota_atual: "A partir de 01/01/2024",
    base_legal: "Lei nº 15.730/2016; Lei nº 18.305/2023",
    nota: "Menor alíquota padrão do Nordeste em 2026",

    historico: [
      { vigencia: "Até 31/12/2023", aliquota: 0.18, percentual: "18%" },
      { vigencia: "A partir de 01/01/2024", aliquota: 0.205, percentual: "20,5%", nota: "Majoração de 2,5 pontos percentuais" }
    ],

    aliquotas_diferenciadas: {
      combustiveis: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ/PE"
      },
      cesta_basica: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ/PE"
      },
      energia_eletrica: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ/PE"
      },
      bebidas_alcoolicas: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ/PE"
      },
      medicamentos: {
        aliquota: 0.00,
        percentual: "0%",
        observacao: "Conforme legislação federal"
      },
      telecom: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ/PE"
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
        aliquota: 0.205,
        percentual: "20,5%",
        descricao: "Operações com não contribuintes (EC 87/2015)"
      }
    },

    importacao: {
      aliquota: 0.04,
      percentual: "4%",
      descricao: "Alíquota fixa para mercadorias estrangeiras (Resolução SF 13/2012)"
    },

    fecop: {
      existe: true,
      nome: "FECEP — Fundo Estadual de Combate à Pobreza",
      adicional: null,
      dados_disponiveis: false,
      observacao: "FECEP existe em Pernambuco — verificar alíquota adicional na SEFAZ/PE"
    },

    difal: {
      aplicacao: true,
      calculo: "Diferença entre alíquota interna (20,5%) e alíquota interestadual",
      base_legal: "EC 87/2015"
    },

    substituicao_tributaria: {
      dados_disponiveis: false,
      obs: "Verificar lista de produtos e MVA na SEFAZ/PE"
    },

    beneficios_fiscais: {
      reducao_aliquota: {
        descricao: "Redução de alíquota conforme legislação específica",
        base_legal: "Instrução Normativa nº 19/2025"
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  3. IPVA — IMPOSTO SOBRE PROPRIEDADE DE VEÍCULOS AUTOMOTORES
  // ═══════════════════════════════════════════════════════════════
  ipva: {
    base_legal: "Lei nº 18.305/2023; Legislação estadual de IPVA",
    base_calculo: "Valor venal conforme tabela FIPE",

    aliquotas: {
      automovel_passeio: {
        aliquota: 0.024,
        percentual: "2,4%",
        descricao: "Carros de passeio e similares",
        nota: "Menor alíquota do Nordeste (terceiro ano consecutivo)"
      },
      caminhonete_utilitario: {
        aliquota: 0.024,
        percentual: "2,4%",
        descricao: "Caminhonetes e utilitários"
      },
      motocicleta_ate_50cc: {
        aliquota: 0.01,
        percentual: "1,0%",
        descricao: "Motocicletas com motor até 50cc"
      },
      motocicleta_acima_50cc: {
        aliquota: 0.02,
        percentual: "2,0%",
        descricao: "Motocicletas com motor acima de 50cc"
      },
      caminhao_onibus: {
        aliquota: 0.01,
        percentual: "1,0%",
        descricao: "Caminhões, ônibus, micro-ônibus"
      },
      embarcacao: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ/PE"
      },
      aeronave: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ/PE"
      },
      locadora: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ/PE"
      }
    },

    isencoes: [
      {
        tipo: "Veículos com 20 anos ou mais",
        descricao: "Isenção total de IPVA",
        vigencia: "A partir de 2026",
        base_legal: "Lei Complementar nº 227/2026"
      },
      {
        tipo: "PCD",
        descricao: "Isenção total para pessoas com deficiência visual, mental severa ou profunda",
        base_legal: "Legislação estadual"
      },
      {
        tipo: "Motocicletas até 170cc (em discussão)",
        descricao: "Projeto de isenção aprovado pela Comissão de Finanças",
        status: "Pendente de sanção",
        base_legal: "PL nº 640/2023"
      },
      {
        tipo: "Transporte por aplicativo (em discussão)",
        descricao: "Projeto de isenção aprovado pela Comissão de Finanças",
        status: "Pendente de sanção",
        base_legal: "PL nº 640/2023"
      }
    ],

    descontos: {
      antecipacao: {
        descricao: "Desconto conforme calendário de pagamento",
        dados_disponiveis: false,
        obs: "Verificar percentual na SEFAZ/PE"
      }
    },

    calendario_vencimento: {
      dados_disponiveis: false,
      obs: "Consultar calendário oficial na SEFAZ/PE"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  4. ITCMD — IMPOSTO SOBRE TRANSMISSÃO CAUSA MORTIS E DOAÇÃO
  // ═══════════════════════════════════════════════════════════════
  itcmd: {
    base_legal: "Lei Complementar nº 563/2025; Lei Complementar nº 227/2026",
    tipo: "Fixo (progressividade obrigatória pendente de implementação)",
    vigencia: "A partir de 01/01/2026",

    aliquotas: {
      causa_mortis: {
        tipo: "Fixa",
        aliquota: 0.05,
        percentual: "5%",
        descricao: "Transmissão por herança"
      },
      doacao: {
        tipo: "Fixa",
        aliquota: 0.02,
        percentual: "2%",
        descricao: "Transmissão por doação"
      }
    },

    aliquotas_reduzidas_temporarias: {
      vigencia: "01/01/2026 a 31/03/2026 (prorrogado)",
      doacao_ate_317412: {
        aliquota: 0.01,
        percentual: "1%",
        limite: 317412.45,
        descricao: "Doação até R$ 317.412,45"
      },
      doacao_acima_317412: {
        aliquota: 0.02,
        percentual: "2%",
        limite_minimo: 317412.45,
        descricao: "Doação acima de R$ 317.412,45"
      }
    },

    base_calculo: "Valor venal do bem ou direito transmitido (valor de mercado ou valor real)",

    isencoes: {
      servidores_publicos: {
        descricao: "Isenção para herdeiros, legatários ou donatários servidores públicos"
      },
      imovel_urbano_rural: {
        dados_disponiveis: false,
        obs: "Verificar limites de isenção na SEFAZ/PE"
      }
    },

    progressividade_obrigatoria: {
      descricao: "LC 227/2026 exige alíquota progressiva para ITCMD",
      status: "Pernambuco ainda tem alíquotas fixas — deve implementar progressividade",
      prazo: "Conforme legislação federal"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  5. ISS — IMPOSTO SOBRE SERVIÇOS (Recife — Capital)
  // ═══════════════════════════════════════════════════════════════
  iss: {
    municipio_referencia: "Recife",
    base_legal: "Lei Complementar nº 53/2008 (CTM Recife); Lei Municipal nº 19.148/2024; Lei nº 19.452/2025",
    aliquota_minima_federal: 0.02,
    aliquota_maxima_federal: 0.05,

    aliquota_geral: 0.05,
    aliquota_geral_percentual: "5%",

    por_tipo_servico: {
      // Alíquota padrão 5%
      informatica: { aliquota: null, dados_disponiveis: false, obs: "Verificar na Prefeitura de Recife" },
      saude: { aliquota: null, dados_disponiveis: false, obs: "Verificar na Prefeitura de Recife" },
      educacao: { aliquota: null, dados_disponiveis: false, obs: "Verificar na Prefeitura de Recife" },
      construcao_civil: { aliquota: null, dados_disponiveis: false, obs: "Verificar na Prefeitura de Recife" },
      contabilidade: { aliquota: null, dados_disponiveis: false, obs: "Verificar na Prefeitura de Recife" },
      advocacia: { aliquota: null, dados_disponiveis: false, obs: "Verificar na Prefeitura de Recife" },
      transporte: { aliquota: null, dados_disponiveis: false, obs: "Verificar na Prefeitura de Recife" },

      // Alíquota reduzida identificada
      distribuicao_venda: {
        aliquota: 0.02,
        percentual: "2%",
        descricao: "Serviços de distribuição e venda",
        base_legal: "Lei Municipal nº 19.148/2024"
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  6. IPTU — IMPOSTO PREDIAL E TERRITORIAL URBANO (Recife)
  // ═══════════════════════════════════════════════════════════════
  iptu: {
    municipio_referencia: "Recife",
    base_legal: "Lei Complementar nº 53/2008",
    base_calculo: "Valor venal do imóvel (PGV — Padrão Genérico de Valor)",

    residencial: {
      dados_disponiveis: false,
      obs: "Verificar faixas de alíquota diretamente na Prefeitura de Recife"
    },

    comercial: {
      dados_disponiveis: false,
      obs: "Verificar — alíquota maior que residencial conforme legislação"
    },

    terreno_nao_edificado: {
      dados_disponiveis: false,
      obs: "Verificar diretamente na Prefeitura de Recife"
    },

    descontos_isencoes: {
      dados_disponiveis: false,
      obs: "Verificar na Prefeitura de Recife"
    },

    observacao: "Fator de utilização diferenciado para TRSD (Taxa de Resíduos Sólidos Domiciliares)"
  },

  // ═══════════════════════════════════════════════════════════════
  //  7. ITBI — IMPOSTO SOBRE TRANSMISSÃO DE BENS IMÓVEIS (Recife)
  // ═══════════════════════════════════════════════════════════════
  itbi: {
    municipio_referencia: "Recife",
    base_legal: "Lei Complementar nº 53/2008; Legislação municipal",
    base_calculo: "Valor venal do imóvel",

    aliquota_geral: 0.03,
    aliquota_geral_percentual: "3%",

    aliquota_reduzida_temporaria: {
      aliquota: 0.02,
      percentual: "2%",
      vigencia: "Até 31/01/2026 (prorrogado)",
      descricao: "Redução temporária de 3% para 2% para incentivar regularização"
    },

    sfh: {
      dados_disponiveis: false,
      obs: "Verificar alíquota específica SFH na Prefeitura de Recife"
    },

    observacao: "Imposto indispensável para registro oficial do imóvel no nome do novo proprietário"
  },

  // ═══════════════════════════════════════════════════════════════
  //  8. TAXAS ESTADUAIS E MUNICIPAIS
  // ═══════════════════════════════════════════════════════════════
  taxas: {

    // ── Taxas Estaduais ──
    estaduais: {
      licenciamento_veiculos: { dados_disponiveis: false, obs: "Verificar na SEFAZ/PE" },
      taxa_judiciaria: { dados_disponiveis: false, obs: "Verificar na SEFAZ/PE" },
      servicos_sefaz: { dados_disponiveis: false, obs: "Verificar na SEFAZ/PE" },
      taxa_ambiental: { dados_disponiveis: false, obs: "Verificar na SEFAZ/PE" },
      taxa_incendio_bombeiros: { dados_disponiveis: false, obs: "Verificar na SEFAZ/PE" },
      emolumentos_cartorarios: { dados_disponiveis: false, obs: "Verificar na SEFAZ/PE" }
    },

    // ── Taxas Municipais Recife ──
    municipais_Recife: {
      municipio_referencia: "Recife",
      taxa_lixo: { dados_disponiveis: false, obs: "Verificar na Prefeitura de Recife" },
      alvara_funcionamento: { dados_disponiveis: false, obs: "Verificar na Prefeitura de Recife" },
      cosip: { dados_disponiveis: false, obs: "Verificar na Prefeitura de Recife" },
      taxa_publicidade: { dados_disponiveis: false, obs: "Verificar na Prefeitura de Recife" }
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  9. IMPOSTOS FEDERAIS (aplicáveis em Pernambuco)
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
      vigencia_alteracao: "A partir de 01/10/2025",
      base_lucro_presumido: {
        servicos: 0.32,
        demais: 0.12
      }
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
      observacao: "Pernambuco não possui benefícios de IPI tipo ZFM/SUFRAMA"
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

  // ═══════════════════════════════════════════════════════════════
  //  10. SIMPLES NACIONAL
  // ═══════════════════════════════════════════════════════════════
  simples_nacional: {
    sublimite_estadual: 3600000,
    sublimite_estadual_formatado: "R$ 3.600.000,00",
    sublimite_observacao: "Pernambuco adota o sublimite padrão nacional",
    base_legal: "Portaria CGSN nº 49/2024",

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
      ativo: false,
      observacao: "Pernambuco NÃO está na área de abrangência da SUDAM"
    },

    sudene: {
      ativo: true,
      nome: "Superintendência do Desenvolvimento do Nordeste (SUDENE)",
      abrangencia: "Todo o estado de Pernambuco",
      status: "Extinta em 26/12/2025 pela LC nº 224/2025 — benefícios continuam em transição",
      reducao_irpj: 0.75,
      reducao_irpj_percentual: "75%",
      aliquota_irpj_efetiva: 0.0375,
      aliquota_irpj_efetiva_percentual: "3,75%",
      reinvestimento: "Incentivos para reinvestimento de lucros conforme legislação específica",
      tipo_projeto: "Instalação, diversificação, modernização",
      legislacao: "Lei nº 9.126/1995 e legislação SUDENE",
      csll: {
        reducao: "Conforme aprovação e projeto",
        descricao: "Redução de CSLL para empresas aprovadas"
      }
    },

    zona_franca: {
      ativo: false,
      observacao: "Não há Zona Franca em Pernambuco"
    },

    suframa: {
      ativo: false,
      observacao: "Pernambuco não está na área de abrangência da SUFRAMA"
    },

    incentivos_estaduais: {
      prodepe: {
        nome: "Programa de Desenvolvimento do Estado de Pernambuco (PRODEPE)",
        descricao: "Concessão de créditos presumidos de ICMS",
        percentuais: "47,5% a 95%",
        alvo: "Indústrias do estado"
      },
      peap: {
        nome: "Programa de Estímulo à Atividade Produtiva (PEAP I e II)",
        descricao: "Redução de cerca de 90% do ICMS devido",
        alvo: "Comércio e indústria",
        nota: "Oportunidades estratégicas de planejamento tributário"
      },
      pe_sustentavel: {
        nome: "Programa PE Sustentável",
        base_legal: "Lei Estadual nº 14.666/2012; Decreto nº 39.460/2013",
        descricao: "Incentivos para atividades sustentáveis"
      },
      suape: {
        nome: "Complexo Industrial Portuário de Suape",
        descricao: "Incentivos fiscais específicos para empresas instaladas",
        observacao: "Benefícios diferenciados para operações portuárias"
      },
      pesquisa_desenvolvimento: {
        descricao: "Redução de 20,4% a 34% no IRPJ e CSLL",
        condicao: "Para atividades de pesquisa e desenvolvimento"
      },
      beneficios_gerais: {
        descricao: "Isenção, redução da base de cálculo, manutenção de crédito conforme SEFAZ/PE"
      }
    },

    isencoes_especificas: {
      agricultura_familiar: { dados_disponiveis: false, obs: "Verificar na SEFAZ/PE" },
      cooperativas: { dados_disponiveis: false, obs: "Verificar na SEFAZ/PE" },
      exportadores: { dados_disponiveis: false, obs: "Verificar na SEFAZ/PE" }
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  12. REFORMA TRIBUTÁRIA
  // ═══════════════════════════════════════════════════════════════
  reforma_tributaria: {
    ibs: {
      nome: "Imposto sobre Bens e Serviços",
      aliquota_estadual_prevista: null,
      dados_disponiveis: false,
      cronograma_transicao: "PE incluirá IBS e CBS no ICMS apenas em 2027",
      substituira: "ICMS (gradualmente)"
    },
    cbs: {
      nome: "Contribuição sobre Bens e Serviços",
      aliquota_federal_prevista: null,
      dados_disponiveis: false,
      cronograma_transicao: "PE incluirá IBS e CBS no ICMS apenas em 2027",
      substituira: "PIS/COFINS (gradualmente)"
    },
    is: {
      nome: "Imposto Seletivo",
      produtos_afetados: "Produtos prejudiciais à saúde ou ao meio ambiente",
      aliquotas_estimadas: null,
      dados_disponiveis: false
    },
    impactos_pernambuco: {
      itcmd_progressivo: "ITCMD deve ter alíquota progressiva conforme LC 227/2026 — PE ainda com alíquotas fixas",
      grupo_trabalho: "SEFAZ/PE instituiu Grupo de Trabalho para acompanhar reforma tributária em 2026",
      fundo_desenvolvimento_regional: {
        dados_disponiveis: false,
        obs: "Verificar na SEFAZ/PE"
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  13. DADOS DE COBERTURA
  // ═══════════════════════════════════════════════════════════════
  cobertura: {
    versao: "3.0",
    data_atualizacao: "2026-02-10",

    localizados: [
      "ICMS — alíquota padrão interna (20,5% desde 01/01/2024)",
      "ICMS — alíquota anterior (18%)",
      "ICMS — alíquotas interestaduais (7% e 12%)",
      "ICMS — importação (4%)",
      "ICMS — DIFAL (EC 87/2015)",
      "ICMS — FECEP (existe — percentual pendente)",
      "ICMS — medicamentos (0%)",
      "IPVA — automóveis/caminhonetes (2,4%)",
      "IPVA — motocicletas ≤50cc (1,0%)",
      "IPVA — motocicletas >50cc (2,0%)",
      "IPVA — caminhões/ônibus (1,0%)",
      "IPVA — isenção veículos ≥20 anos",
      "IPVA — isenção PCD",
      "ITCMD — causa mortis (5% fixo)",
      "ITCMD — doação (2% fixo)",
      "ITCMD — alíquotas reduzidas temporárias (1%/2%)",
      "ITCMD — isenção servidores públicos",
      "ITCMD — progressividade obrigatória pendente (LC 227/2026)",
      "ISS Recife — alíquota geral (5%)",
      "ISS Recife — distribuição e venda (2%)",
      "ITBI Recife — alíquota geral (3%)",
      "ITBI Recife — alíquota reduzida temporária (2% até 01/2026)",
      "Simples Nacional — sublimite (R$ 3.600.000)",
      "MEI — limite e DAS mensal",
      "SUDENE — redução 75% IRPJ (em transição pós-extinção)",
      "PRODEPE — crédito presumido ICMS (47,5% a 95%)",
      "PEAP I/II — redução ~90% ICMS",
      "PE Sustentável — incentivos sustentabilidade",
      "Suape — incentivos portuários",
      "P&D — redução 20,4% a 34% IRPJ/CSLL",
      "Impostos federais — IRPJ, CSLL, PIS, COFINS, INSS, FGTS, IRPF",
      "Anexos I a V do Simples Nacional",
      "Reforma tributária — cronograma PE (IBS/CBS em 2027)"
    ],

    nao_localizados: [
      "ICMS — combustíveis (alíquota específica)",
      "ICMS — cesta básica (alíquota específica)",
      "ICMS — energia elétrica",
      "ICMS — bebidas alcoólicas",
      "ICMS — telecom",
      "ICMS — FECEP (percentual adicional)",
      "ICMS — Substituição Tributária (produtos e MVA)",
      "IPVA — embarcações e aeronaves",
      "IPVA — locadoras",
      "IPVA — calendário de vencimento e desconto antecipação",
      "ISS Recife — alíquotas por tipo de serviço (detalhamento)",
      "IPTU Recife — alíquotas residencial e comercial",
      "IPTU Recife — terreno não edificado",
      "ITBI Recife — alíquota SFH",
      "Taxas estaduais (licenciamento, judiciária, ambiental, bombeiros)",
      "Taxas municipais (lixo, alvará, COSIP)",
      "Reforma tributária — alíquotas previstas IBS/CBS/IS"
    ],

    completude_estimada: "60%",

    contatos_para_completar: [
      "SEFAZ/PE: https://www.sefaz.pe.gov.br",
      "Prefeitura de Recife: https://www.recife.pe.gov.br",
      "SUDENE: https://www.gov.br/sudene",
      "Receita Federal: https://www.gov.br/receitafederal/"
    ]
  }
};

// ═══════════════════════════════════════════════════════════════════════════
//  14. FUNÇÕES UTILITÁRIAS — PERNAMBUCO
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Retorna alíquota ISS por tipo de serviço (Recife)
 * @param {string} tipo - Tipo de serviço
 * @returns {object} Objeto com alíquota e observações
 */
function getISSPernambuco(tipo) {
  const servico = PERNAMBUCO_TRIBUTARIO.iss.por_tipo_servico[tipo];
  if (servico) {
    return servico;
  }
  return {
    aliquota: PERNAMBUCO_TRIBUTARIO.iss.aliquota_geral,
    percentual: PERNAMBUCO_TRIBUTARIO.iss.aliquota_geral_percentual,
    obs: "Tipo específico não encontrado — usando alíquota geral de Recife (5%). Verificar detalhamento na Prefeitura."
  };
}

/**
 * Retorna alíquota IPTU residencial (Recife)
 * @param {number} areaM2 - Área em metros quadrados
 * @returns {object}
 */
function getIPTUResidencialPernambuco(areaM2) {
  return {
    aliquota: null,
    dados_disponiveis: false,
    obs: "Dados de IPTU residencial de Recife não disponíveis. Verificar na Prefeitura de Recife."
  };
}

/**
 * Retorna alíquota IPTU comercial (Recife)
 * @param {number} areaM2 - Área em metros quadrados
 * @returns {object}
 */
function getIPTUComercialPernambuco(areaM2) {
  return {
    aliquota: null,
    dados_disponiveis: false,
    obs: "Dados de IPTU comercial de Recife não disponíveis. Verificar na Prefeitura de Recife."
  };
}

/**
 * Retorna alíquota IPVA por tipo de veículo
 * @param {string} tipo - Tipo do veículo
 * @returns {object}
 */
function getIPVAPernambuco(tipo) {
  const veiculo = PERNAMBUCO_TRIBUTARIO.ipva.aliquotas[tipo];
  if (veiculo) {
    return veiculo;
  }
  return {
    aliquota: null,
    dados_disponiveis: false,
    obs: "Tipo não encontrado. Disponíveis: automovel_passeio, caminhonete_utilitario, motocicleta_ate_50cc, motocicleta_acima_50cc, caminhao_onibus"
  };
}

/**
 * Verifica se município está em Zona Franca
 * @param {string} municipio
 * @returns {boolean}
 */
function isZonaFrancaPernambuco(municipio) {
  return false;
}

/**
 * Verifica se município é ALC
 * @param {string} municipio
 * @returns {boolean}
 */
function isALCPernambuco(municipio) {
  return false;
}

/**
 * Retorna percentual de redução IRPJ pela SUDENE
 * @returns {object}
 */
function getReducaoSUDENEPernambuco() {
  return {
    ativo: true,
    reducao: 0.75,
    reducao_percentual: "75%",
    aliquota_efetiva: 0.0375,
    aliquota_efetiva_percentual: "3,75%",
    status: "SUDENE extinta em 26/12/2025 — benefícios em transição",
    legislacao: "Lei nº 9.126/1995"
  };
}

/**
 * Retorna percentual de redução IRPJ pela SUDAM
 * @returns {object}
 */
function getReducaoSUDAMPernambuco() {
  return {
    ativo: false,
    observacao: "Pernambuco NÃO está na área de abrangência da SUDAM",
    reducao: 0,
    aliquota_efetiva: 0.15
  };
}

/**
 * Retorna ICMS efetivo (padrão + FECEP se houver)
 * @returns {object}
 */
function getICMSEfetivoPernambuco() {
  const icms = PERNAMBUCO_TRIBUTARIO.icms;
  // FECEP existe mas percentual não localizado — usar 0 até confirmação
  const fecop = 0;
  return {
    aliquota_padrao: icms.aliquota_padrao,
    fecop: fecop,
    fecop_existe: icms.fecop.existe,
    fecop_obs: "FECEP existe em PE — percentual adicional não localizado",
    aliquota_efetiva: icms.aliquota_padrao + fecop,
    aliquota_efetiva_percentual: ((icms.aliquota_padrao + fecop) * 100).toFixed(1) + "%"
  };
}

/**
 * Retorna alíquota ITCMD por tipo de transmissão
 * @param {string} tipo - "causa_mortis" ou "doacao"
 * @returns {object}
 */
function getITCMDPernambuco(tipo) {
  const aliquotas = PERNAMBUCO_TRIBUTARIO.itcmd.aliquotas;
  if (aliquotas[tipo]) {
    return aliquotas[tipo];
  }
  return {
    aliquota: null,
    obs: "Tipo não encontrado. Disponíveis: causa_mortis, doacao"
  };
}

/**
 * Retorna resumo tributário do estado
 * @returns {object}
 */
function resumoTributarioPernambuco() {
  const d = PERNAMBUCO_TRIBUTARIO;
  return {
    estado: d.dados_gerais.nome,
    sigla: d.dados_gerais.sigla,
    regiao: d.dados_gerais.regiao,
    capital: d.dados_gerais.capital,
    icms_padrao: d.icms.aliquota_padrao,
    icms_efetivo: getICMSEfetivoPernambuco().aliquota_efetiva,
    fecop_existe: d.icms.fecop.existe,
    ipva_automovel: d.ipva.aliquotas.automovel_passeio.aliquota,
    itcmd_heranca: d.itcmd.aliquotas.causa_mortis.aliquota,
    itcmd_doacao: d.itcmd.aliquotas.doacao.aliquota,
    iss_geral: d.iss.aliquota_geral,
    itbi: d.itbi.aliquota_geral,
    itbi_reduzido: d.itbi.aliquota_reduzida_temporaria.aliquota,
    sublimite_simples: d.simples_nacional.sublimite_estadual,
    sudam: d.incentivos.sudam.ativo,
    sudene: d.incentivos.sudene.ativo,
    sudene_status: d.incentivos.sudene.status,
    zona_franca: d.dados_gerais.zona_franca.existe,
    suframa: d.dados_gerais.suframa.abrangencia,
    reducao_irpj_sudene: d.incentivos.sudene.ativo ? d.incentivos.sudene.reducao_irpj : 0,
    suape: d.dados_gerais.suape.existe,
    prodepe: d.incentivos.incentivos_estaduais.prodepe.percentuais,
    completude: d.cobertura.completude_estimada
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  15. EXPORTAÇÃO (Padrão Grupo 2)
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        ...PERNAMBUCO_TRIBUTARIO,
        utils: {
            getISS: getISSPernambuco,
            getIPTUResidencial: getIPTUResidencialPernambuco,
            getIPTUComercial: getIPTUComercialPernambuco,
            getIPVA: getIPVAPernambuco,
            isZonaFranca: isZonaFrancaPernambuco,
            isALC: isALCPernambuco,
            getReducaoSUDENE: getReducaoSUDENEPernambuco,
            getReducaoSUDAM: getReducaoSUDAMPernambuco,
            getICMSEfetivo: getICMSEfetivoPernambuco,
            getITCMD: getITCMDPernambuco,
            resumoTributario: resumoTributarioPernambuco,
        },
    };
}

if (typeof window !== "undefined") {
    window.PERNAMBUCO_TRIBUTARIO = PERNAMBUCO_TRIBUTARIO;
    window.PernambucoTributario = {
        getISS: getISSPernambuco,
        getIPTUResidencial: getIPTUResidencialPernambuco,
        getIPTUComercial: getIPTUComercialPernambuco,
        getIPVA: getIPVAPernambuco,
        isZonaFranca: isZonaFrancaPernambuco,
        isALC: isALCPernambuco,
        getReducaoSUDENE: getReducaoSUDENEPernambuco,
        getReducaoSUDAM: getReducaoSUDAMPernambuco,
        getICMSEfetivo: getICMSEfetivoPernambuco,
        getITCMD: getITCMDPernambuco,
        resumoTributario: resumoTributarioPernambuco,
    };
}
