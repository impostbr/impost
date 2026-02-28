/**
 * ============================================================
 * IMPOST. — Sistema de Análise Tributária
 * Arquivo: rio_grande_norte.js
 * Estado: Rio Grande do Norte (RN)
 * Região: Nordeste
 * Capital: Natal
 * Última atualização: Fevereiro de 2026
 * Fontes: SEFAZ/RN, Receita Federal, legislação oficial, Prefeitura de Natal (SEMUT)
 * ============================================================
 */

const RIO_GRANDE_NORTE_TRIBUTARIO = {

  // ============================================================
  // 1. DADOS GERAIS DO ESTADO
  // ============================================================
  dados_gerais: {
    nome: "Rio Grande do Norte",
    sigla: "RN",
    regiao: "Nordeste",
    capital: "Natal",
    codigo_ibge: "24",
    codigo_ibge_capital: "2408102",
    municipios_principais: [
      { nome: "Natal", codigo_ibge: "2408102", capital: true },
      { nome: "Mossoró", codigo_ibge: "2407302" },
      { nome: "Parnamirim", codigo_ibge: "2409500" },
      { nome: "São Gonçalo do Amarante", codigo_ibge: "2411902" }
    ],
    zona_franca: {
      existe: false,
      observacao: "Não há Zona Franca no Rio Grande do Norte"
    },
    alc: {
      existe: false,
      observacao: "Não há Área de Livre Comércio no Rio Grande do Norte"
    },
    sudam: {
      abrangencia: false,
      observacao: "Rio Grande do Norte não está na área de abrangência da SUDAM"
    },
    sudene: {
      abrangencia: true,
      beneficios: "Redução de IRPJ até 75%, incentivos para projetos aprovados"
    },
    suframa: {
      abrangencia: false,
      observacao: "Rio Grande do Norte não está na área de abrangência da SUFRAMA"
    },
    sefaz: {
      url: "http://www.sefaz.rn.gov.br/",
      contato: "DADO NÃO LOCALIZADO"
    },
    prefeitura_capital: {
      url: "https://www.natal.rn.gov.br/",
      semut: "https://natal.rn.gov.br/semut/",
      contato: "DADO NÃO LOCALIZADO"
    },
    detran: {
      url: "http://www.detran.rn.gov.br/"
    },
    legislacao_base: {
      icms: "Lei nº 6.968/1996; Lei nº 11.314/2022 (18%); Lei nº 11.999/2024 (20%); Decreto nº 31.825/2022 (RICMS/RN)",
      ipva: "Lei nº 6.967/1996; Lei nº 9.689/2013; Lei nº 12.026/2024",
      iss: "Lei nº 3.882/1989 (CTM Natal); LC nº 217/2022; LC nº 197/2021; LC nº 116/2003 (federal)",
      iptu: "Lei nº 3.882/1989; LC nº 254/2024; LC nº 257/2024; LC nº 265/2025; Decreto nº 13.573/2025",
      itbi: "Lei nº 3.882/1989 (CTM Natal)"
    }
  },

  // ============================================================
  // 2. ICMS — Imposto sobre Circulação de Mercadorias e Serviços
  // ============================================================
  icms: {
    aliquota_padrao: 0.20,
    aliquota_padrao_percentual: "20%",
    aliquota_padrao_anterior: 0.18,
    vigencia_aliquota_atual: "A partir de 20/03/2025",
    base_legal: "Lei nº 11.999/2024; Lei nº 6.968/1996; Decreto nº 31.825/2022 (RICMS/RN)",

    historico: [
      { vigencia: "Até 31/12/2023", aliquota: 0.17, percentual: "17%" },
      { vigencia: "01/01/2024 a 19/03/2025", aliquota: 0.18, percentual: "18%", base_legal: "Lei nº 11.314/2022" },
      { vigencia: "A partir de 20/03/2025", aliquota: 0.20, percentual: "20%", base_legal: "Lei nº 11.999/2024" }
    ],

    aliquotas_diferenciadas: {
      energia_eletrica: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ/RN"
      },
      combustiveis: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ/RN"
      },
      cesta_basica: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ/RN"
      },
      bebidas_alcoolicas: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ/RN"
      },
      medicamentos: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ/RN"
      },
      telecom: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ/RN"
      }
    },

    aliquotas_modais: {
      peixe: {
        aliquota: 0.64,
        percentual: "64%",
        descricao: "Alíquota modal para peixe"
      },
      molusco_crustaceo: {
        aliquota: 0.37,
        percentual: "37%",
        descricao: "Alíquota modal para molusco ou crustáceo (exceto camarão e lagosta)"
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
      aliquota: 0.20,
      percentual: "20%",
      descricao: "ICMS sobre importação — alíquota interna"
    },

    fecop: {
      existe: false,
      adicional: 0,
      observacao: "FECOP/FEM não identificado na pesquisa — verificar na SEFAZ/RN"
    },

    difal: {
      aplicacao: true,
      calculo: "Diferença entre alíquota interna (20%) e alíquota interestadual",
      base_legal: "EC 87/2015"
    },

    substituicao_tributaria: {
      dados_disponiveis: false,
      obs: "Verificar lista de produtos e MVA na SEFAZ/RN"
    }
  },

  // ============================================================
  // 3. IPVA — Imposto sobre Propriedade de Veículos Automotores
  // ============================================================
  ipva: {
    base_legal: "Lei nº 6.967/1996; Lei nº 9.689/2013; Lei nº 12.026/2024",
    base_calculo: "Valor venal conforme tabela FIPE",

    aliquotas: {
      automovel: {
        aliquota: 0.03,
        percentual: "3,0%",
        descricao: "Automóveis, caminhonetes, micro-ônibus, embarcações, motocicletas"
      },
      caminhonete: {
        aliquota: 0.03,
        percentual: "3,0%",
        descricao: "Caminhonetes (mesma alíquota geral)"
      },
      motocicleta: {
        aliquota: 0.03,
        percentual: "3,0%",
        descricao: "Motocicletas (mesma alíquota geral)"
      },
      micro_onibus: {
        aliquota: 0.03,
        percentual: "3,0%",
        descricao: "Micro-ônibus (mesma alíquota geral)"
      },
      embarcacao: {
        aliquota: 0.03,
        percentual: "3,0%",
        descricao: "Embarcações (mesma alíquota geral)"
      },
      gnv: {
        aliquota: 0.015,
        percentual: "1,5%",
        descricao: "Veículos movidos a Gás Natural Veicular (GNV) — incentivo ambiental"
      },
      eletrico: {
        aliquota: 0.005,
        percentual: "0,5%",
        descricao: "Veículos 100% elétricos — incentivo ambiental",
        base_legal: "Lei nº 12.026/2024"
      },
      onibus_caminhao: {
        aliquota: 0.01,
        percentual: "1,0%",
        descricao: "Ônibus, caminhões acima de 3.500 kg, cavalos mecânicos"
      },
      aeronave: {
        aliquota: 0.02,
        percentual: "2,0%",
        descricao: "Aeronaves particulares"
      },
      locadora: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ/RN"
      }
    },

    isencoes: [
      {
        tipo: "Veículos fabricados até 2016",
        descricao: "Isenção total de IPVA para veículos com mais de 10 anos",
        base_legal: "Lei nº 6.967/1996"
      },
      {
        tipo: "PCD",
        descricao: "Isenção total para portadores de deficiência — com comprovação"
      },
      {
        tipo: "Táxis",
        descricao: "Isenção para categoria aluguel, motorista profissional"
      },
      {
        tipo: "Veículos oficiais",
        descricao: "Isenção para veículos da União, Estados e Municípios"
      },
      {
        tipo: "Transporte público",
        descricao: "Isenção para empresas concessionárias de transporte público"
      },
      {
        tipo: "Ambulâncias e bombeiros",
        descricao: "Isenção para ambulâncias e veículos de bombeiros sem cobrança de serviço"
      }
    ],

    descontos: {
      antecipacao: {
        percentual: 0.10,
        descricao: "Até 10% de desconto para pagamento em cota única",
        condicao: "Conforme calendário"
      },
      parcelamento: {
        parcelas: 12,
        descricao: "Até 12 parcelas sem desconto"
      }
    },

    calendario_vencimento: {
      dados_disponiveis: false,
      obs: "Consultar calendário oficial na SEFAZ/RN ou DETRAN/RN"
    }
  },

  // ============================================================
  // 4. ITCMD — Imposto sobre Transmissão Causa Mortis e Doação
  // ============================================================
  itcmd: {
    base_legal: "DADO NÃO LOCALIZADO — verificar legislação estadual do RN",

    aliquotas: {
      causa_mortis: {
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ/RN"
      },
      doacao: {
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ/RN"
      }
    },

    base_calculo: "Valor venal do bem ou direito transmitido",

    isencoes: {
      dados_disponiveis: false,
      obs: "Verificar na SEFAZ/RN"
    }
  },

  // ============================================================
  // 5. ISS — Imposto Sobre Serviços (Natal - Capital)
  // ============================================================
  iss: {
    municipio_referencia: "Natal",
    base_legal: "Lei nº 3.882/1989 (CTM Natal); LC nº 217/2022; LC nº 197/2021; LC nº 116/2003 (federal)",
    aliquota_minima_federal: 0.02,
    aliquota_maxima_federal: 0.05,

    aliquota_geral: null,
    aliquota_geral_obs: "Natal não possui alíquota geral única — varia de 2% a 5% conforme serviço",
    faixa_aliquotas: "2% a 5%",

    desconto_geral: {
      percentual: 0.05,
      percentual_descricao: "5%",
      base_legal: "Portaria GS/SEMUT nº 85/2024"
    },

    por_tipo_servico: {
      // ===== ALÍQUOTA 2% =====
      intermediacao_imoveis: { aliquota: 0.02, percentual: "2%", grupo: "Intermediação (2%)" },
      agenciamento_seguros: { aliquota: 0.02, percentual: "2%", grupo: "Intermediação (2%)" },
      intermediacao_geral: { aliquota: 0.02, percentual: "2%", grupo: "Intermediação (2%)" },
      profissional_recem_formado: { aliquota: 0.02, percentual: "2%", grupo: "Recém-formados (2%)", observacao: "Primeiros 5 anos de atividade" },

      // ===== ALÍQUOTA 3% =====
      medicina: { aliquota: 0.03, percentual: "3%", grupo: "Saúde (3%)" },
      analises_clinicas: { aliquota: 0.03, percentual: "3%", grupo: "Saúde (3%)" },
      hospitais_clinicas: { aliquota: 0.03, percentual: "3%", grupo: "Saúde (3%)" },
      enfermagem: { aliquota: 0.03, percentual: "3%", grupo: "Saúde (3%)" },
      farmaceuticos: { aliquota: 0.03, percentual: "3%", grupo: "Saúde (3%)" },
      fisioterapia: { aliquota: 0.03, percentual: "3%", grupo: "Saúde (3%)" },
      fonoaudiologia: { aliquota: 0.03, percentual: "3%", grupo: "Saúde (3%)" },
      terapia_ocupacional: { aliquota: 0.03, percentual: "3%", grupo: "Saúde (3%)" },
      odontologia: { aliquota: 0.03, percentual: "3%", grupo: "Saúde (3%)" },
      psicologia: { aliquota: 0.03, percentual: "3%", grupo: "Saúde (3%)" },
      psicanalise: { aliquota: 0.03, percentual: "3%", grupo: "Saúde (3%)" },
      casas_repouso_creches: { aliquota: 0.03, percentual: "3%", grupo: "Saúde (3%)" },
      planos_saude: { aliquota: 0.03, percentual: "3%", grupo: "Saúde (3%)" },
      educacao: { aliquota: 0.03, percentual: "3%", grupo: "Educação (3%)" },
      ensino_regular: { aliquota: 0.03, percentual: "3%", grupo: "Educação (3%)" },

      // ===== ALÍQUOTA 4% =====
      construcao_civil: { aliquota: 0.04, percentual: "4%", grupo: "Construção e Engenharia (4%)" },
      engenharia: { aliquota: 0.04, percentual: "4%", grupo: "Construção e Engenharia (4%)" },
      arquitetura: { aliquota: 0.04, percentual: "4%", grupo: "Construção e Engenharia (4%)" },
      reparacao_reforma: { aliquota: 0.04, percentual: "4%", grupo: "Construção e Engenharia (4%)" },
      limpeza_conservacao: { aliquota: 0.04, percentual: "4%", grupo: "Limpeza e Vigilância (4%)" },
      vigilancia_seguranca: { aliquota: 0.04, percentual: "4%", grupo: "Limpeza e Vigilância (4%)" },
      advocacia: { aliquota: 0.04, percentual: "4%", grupo: "Profissionais (4%)" },
      contabilidade: { aliquota: 0.04, percentual: "4%", grupo: "Profissionais (4%)" },
      consultoria: { aliquota: 0.04, percentual: "4%", grupo: "Profissionais (4%)" },
      consultoria_empresarial: { aliquota: 0.04, percentual: "4%", grupo: "Profissionais (4%)" },

      // ===== ALÍQUOTA 5% =====
      informatica: { aliquota: 0.05, percentual: "5%", grupo: "Informática (5%)" },
      desenvolvimento_sistemas: { aliquota: 0.05, percentual: "5%", grupo: "Informática (5%)" },
      programacao: { aliquota: 0.05, percentual: "5%", grupo: "Informática (5%)" },
      processamento_dados: { aliquota: 0.05, percentual: "5%", grupo: "Informática (5%)" },
      suporte_tecnico: { aliquota: 0.05, percentual: "5%", grupo: "Informática (5%)" },
      paginas_eletronicas: { aliquota: 0.05, percentual: "5%", grupo: "Informática (5%)" },
      pesquisa_desenvolvimento: { aliquota: 0.05, percentual: "5%", grupo: "Pesquisa (5%)" },
      locacao_cessao: { aliquota: 0.05, percentual: "5%", grupo: "Locação e Cessão (5%)" },
      veterinaria: { aliquota: 0.05, percentual: "5%", grupo: "Veterinários (5%)" },
      barbearia_cabeleireiros: { aliquota: 0.05, percentual: "5%", grupo: "Cuidados Pessoais (5%)" },
      estetica: { aliquota: 0.05, percentual: "5%", grupo: "Cuidados Pessoais (5%)" },
      academias_ginastica: { aliquota: 0.05, percentual: "5%", grupo: "Cuidados Pessoais (5%)" },
      spa_emagrecimento: { aliquota: 0.05, percentual: "5%", grupo: "Cuidados Pessoais (5%)" },
      hospedagem: { aliquota: 0.05, percentual: "5%", grupo: "Hospedagem e Turismo (5%)" },
      turismo: { aliquota: 0.05, percentual: "5%", grupo: "Hospedagem e Turismo (5%)" },
      guias_turismo: { aliquota: 0.05, percentual: "5%", grupo: "Hospedagem e Turismo (5%)" },
      estacionamento: { aliquota: 0.05, percentual: "5%", grupo: "Guarda e Vigilância (5%)" },
      teatro_shows: { aliquota: 0.05, percentual: "5%", grupo: "Diversões e Entretenimento (5%)" },
      cinema: { aliquota: 0.05, percentual: "5%", grupo: "Diversões e Entretenimento (5%)" },
      eventos_producao: { aliquota: 0.05, percentual: "5%", grupo: "Diversões e Entretenimento (5%)" },
      parques_diversoes: { aliquota: 0.05, percentual: "5%", grupo: "Diversões e Entretenimento (5%)" },
      musica: { aliquota: 0.05, percentual: "5%", grupo: "Diversões e Entretenimento (5%)" },
      fotografia: { aliquota: 0.05, percentual: "5%", grupo: "Fotografia e Fonografia (5%)" },
      fonografia: { aliquota: 0.05, percentual: "5%", grupo: "Fotografia e Fonografia (5%)" },
      reprografia: { aliquota: 0.05, percentual: "5%", grupo: "Fotografia e Fonografia (5%)" },
      composicao_grafica: { aliquota: 0.05, percentual: "5%", grupo: "Fotografia e Fonografia (5%)" },
      assistencia_tecnica: { aliquota: 0.05, percentual: "5%", grupo: "Bens de Terceiros (5%)" },
      conserto_manutencao: { aliquota: 0.05, percentual: "5%", grupo: "Bens de Terceiros (5%)" },
      instalacao_montagem: { aliquota: 0.05, percentual: "5%", grupo: "Bens de Terceiros (5%)" },
      alfaiataria_costura: { aliquota: 0.05, percentual: "5%", grupo: "Bens de Terceiros (5%)" },
      tinturaria_lavanderia: { aliquota: 0.05, percentual: "5%", grupo: "Bens de Terceiros (5%)" },
      funilaria_lanternagem: { aliquota: 0.05, percentual: "5%", grupo: "Bens de Terceiros (5%)" },
      transporte: { aliquota: 0.05, percentual: "5%", grupo: "Transporte (5%)" },
      transporte_pessoas: { aliquota: 0.05, percentual: "5%", grupo: "Transporte (5%)" },
      transporte_carga: { aliquota: 0.05, percentual: "5%", grupo: "Transporte (5%)" },
      taxi: { aliquota: 0.05, percentual: "5%", grupo: "Transporte (5%)" },
      telefonia: { aliquota: 0.05, percentual: "5%", grupo: "Comunicação (5%)" },
      comunicacao_internet: { aliquota: 0.05, percentual: "5%", grupo: "Comunicação (5%)" },
      auditoria: { aliquota: 0.05, percentual: "5%", grupo: "Profissionais (5%)" },
      pericia: { aliquota: 0.05, percentual: "5%", grupo: "Profissionais (5%)" },
      traducao: { aliquota: 0.05, percentual: "5%", grupo: "Profissionais (5%)" },
      secretariado: { aliquota: 0.05, percentual: "5%", grupo: "Profissionais (5%)" },
      administracao_imoveis: { aliquota: 0.05, percentual: "5%", grupo: "Administração (5%)" },
      administracao_empresas: { aliquota: 0.05, percentual: "5%", grupo: "Administração (5%)" },
      administracao_condominios: { aliquota: 0.05, percentual: "5%", grupo: "Administração (5%)" }
    },

    resumo_aliquotas: {
      aliquota_2_porcento: [
        "Intermediação de imóveis",
        "Agenciamento de seguros",
        "Intermediação em geral",
        "Profissionais recém-formados (primeiros 5 anos)"
      ],
      aliquota_3_porcento: [
        "Saúde e assistência médica (medicina, odontologia, psicologia, etc.)",
        "Hospitais, clínicas, laboratórios",
        "Planos de saúde",
        "Educação e ensino regular"
      ],
      aliquota_4_porcento: [
        "Construção civil, engenharia, arquitetura",
        "Reparação, conservação e reforma",
        "Limpeza e conservação",
        "Vigilância e segurança",
        "Advocacia, contabilidade, consultoria"
      ],
      aliquota_5_porcento: [
        "Informática e congêneres",
        "Pesquisa e desenvolvimento",
        "Locação e cessão",
        "Veterinários",
        "Cuidados pessoais e estética",
        "Hospedagem e turismo",
        "Diversões, lazer, entretenimento",
        "Fotografia, fonografia, reprografia",
        "Serviços relativos a bens de terceiros",
        "Transporte",
        "Comunicação",
        "Auditoria, perícia, tradução",
        "Administração de imóveis/empresas/condomínios"
      ]
    }
  },

  // ============================================================
  // 6. IPTU — Imposto Predial e Territorial Urbano (Natal)
  // ============================================================
  iptu: {
    municipio_referencia: "Natal",
    base_legal: "Lei nº 3.882/1989; LC nº 254/2024; LC nº 257/2024; LC nº 265/2025; Decreto nº 13.573/2025",
    base_calculo: "Valor venal do imóvel conforme Planta Genérica de Valores (PGV) municipal",
    tipo_aliquota: "Alíquota única por tipo (sem progressão por faixa de área)",

    residencial: {
      aliquota: 0.006,
      percentual: "0,6%",
      descricao: "Imóvel exclusivamente residencial — sobre valor venal"
    },

    comercial: {
      aliquota: 0.01,
      percentual: "1,0%",
      descricao: "Imóvel não edificado ou uso não residencial — sobre valor venal"
    },

    terreno_nao_edificado: {
      aliquota: 0.01,
      percentual: "1,0%",
      descricao: "Terreno não edificado — sobre valor venal"
    },

    reducoes_base_calculo: {
      residencial_baixo_valor: {
        reducao_maxima: 0.75,
        reducao_maxima_percentual: "75%",
        valor_limite: 77306.01,
        valor_limite_formatado: "R$ 77.306,01",
        descricao: "Redução de até 75% da base de cálculo para imóveis residenciais até R$ 77.306,01",
        vigencia: "2025"
      }
    },

    isencoes: [
      {
        tipo: "Imóvel residencial de baixo valor",
        descricao: "Isenção/redução até 75% para imóveis até R$ 77.306,01",
        vigencia: "2025",
        base_legal: "LC nº 254/2024"
      },
      {
        tipo: "Imóveis de interesse público",
        descricao: "Isenção conforme legislação",
        base_legal: "Lei nº 3.882/1989"
      },
      {
        tipo: "Imóveis em área de proteção",
        descricao: "Possível redução até 0% (isenção total)",
        base_legal: "LC nº 257/2024"
      },
      {
        tipo: "Imóveis com transmissão inter vivos",
        descricao: "Redução extraordinária",
        base_legal: "LC nº 265/2025"
      }
    ],

    descontos: {
      cota_unica: {
        percentual: 0.16,
        percentual_descricao: "16%",
        descricao: "Desconto de 16% para pagamento em cota única antecipada",
        vigencia: "2026"
      },
      parcelamento: {
        parcelas: 12,
        parcela_minima: 82.59,
        parcela_minima_formatada: "R$ 82,59",
        descricao: "Até 12 parcelas sem desconto (mínimo R$ 82,59 por parcela)"
      }
    }
  },

  // ============================================================
  // 7. ITBI — Imposto sobre Transmissão de Bens Imóveis (Natal)
  //    Nota: Em Natal é chamado ITIV
  // ============================================================
  itbi: {
    municipio_referencia: "Natal",
    nome_local: "ITIV — Imposto sobre Transmissão de Imóvel Inter Vivos",
    base_legal: "Lei nº 3.882/1989 (CTM Natal)",
    base_calculo: "Valor de avaliação ou valor de mercado do imóvel",

    aliquota_geral: 0.02,
    aliquota_geral_percentual: "2%",

    transmissao_comum: {
      aliquota: 0.02,
      percentual: "2%"
    },

    transmissao_doacao: {
      aliquota: 0.02,
      percentual: "2%"
    },

    sfh: {
      dados_disponiveis: false,
      obs: "Verificar alíquota específica SFH na Prefeitura de Natal"
    }
  },

  // ============================================================
  // 8. TAXAS ESTADUAIS E MUNICIPAIS
  // ============================================================
  taxas_estaduais: {
    licenciamento_veiculos: { dados_disponiveis: false, obs: "Verificar na SEFAZ/RN" },
    taxa_judiciaria: { dados_disponiveis: false, obs: "Verificar no TJRN" },
    servicos_sefaz: { dados_disponiveis: false, obs: "Verificar na SEFAZ/RN" },
    taxa_ambiental: { dados_disponiveis: false, obs: "Verificar na SEFAZ/RN" },
    taxa_incendio_bombeiros: { dados_disponiveis: false, obs: "Verificar na SEFAZ/RN" }
  },

  taxas_municipais: {
    municipio_referencia: "Natal",
    taxa_lixo: { dados_disponiveis: false, obs: "Verificar na SEMUT Natal" },
    alvara_funcionamento: { dados_disponiveis: false, obs: "Verificar na SEMUT Natal" },
    cosip: { dados_disponiveis: false, obs: "Verificar na SEMUT Natal" }
  },

  // ============================================================
  // 9. IMPOSTOS FEDERAIS (aplicáveis no Rio Grande do Norte)
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
        aliquota: 0.0076,
        percentual: "0,76%",
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
      observacao: "RN não possui benefícios de IPI tipo ZFM/SUFRAMA"
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
      patronal_maximo: {
        aliquota: 0.288,
        percentual: "28,8%",
        descricao: "Alíquota máxima incluindo RAT/SAT e terceiros"
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

  // ============================================================
  // 10. SIMPLES NACIONAL
  // ============================================================
  simples_nacional: {
    sublimite_estadual: 3600000,
    sublimite_estadual_formatado: "R$ 3.600.000,00",
    sublimite_observacao: "Rio Grande do Norte adota o sublimite padrão nacional",

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

  // ============================================================
  // 11. INCENTIVOS FISCAIS E BENEFÍCIOS REGIONAIS
  // ============================================================
  incentivos: {
    sudam: {
      ativo: false,
      observacao: "Rio Grande do Norte NÃO está na área de abrangência da SUDAM"
    },

    sudene: {
      ativo: true,
      nome: "Superintendência do Desenvolvimento do Nordeste (SUDENE)",
      abrangencia: "Todo o estado do Rio Grande do Norte",
      reducao_irpj: 0.75,
      reducao_irpj_percentual: "75%",
      aliquota_irpj_efetiva: 0.0375,
      aliquota_irpj_efetiva_percentual: "3,75%",
      reinvestimento: "Incentivos para reinvestimento de lucros conforme legislação específica",
      tipo_projeto: "Instalação, diversificação, modernização",
      legislacao: "Lei nº 8.167/1991; Decreto nº 4.213/2002 e legislação SUDENE"
    },

    zona_franca: {
      ativo: false,
      observacao: "Não há Zona Franca no Rio Grande do Norte"
    },

    suframa: {
      ativo: false,
      observacao: "RN não está na área de abrangência da SUFRAMA"
    },

    incentivos_estaduais: {
      dados_disponiveis: false,
      obs: "Verificar programas estaduais de incentivo fiscal na SEFAZ/RN (ex: PROADI, etc.)"
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
    impactos_rn: {
      beneficios_regionais: "Possível manutenção de benefícios SUDENE conforme legislação de transição",
      fundo_desenvolvimento_regional: {
        dados_disponiveis: false,
        obs: "Verificar na SEFAZ/RN"
      }
    }
  },

  // ============================================================
  // 13. DADOS DE COBERTURA (Controle de Qualidade)
  // ============================================================
  cobertura: {
    dados_localizados: [
      "ICMS — alíquota padrão interna (20% desde 20/03/2025)",
      "ICMS — histórico completo (17% → 18% → 20%)",
      "ICMS — alíquotas interestaduais (7% e 12%)",
      "ICMS — importação (20%)",
      "ICMS — alíquotas modais (peixe 64%, molusco 37%)",
      "ICMS — DIFAL (EC 87/2015)",
      "IPVA — alíquota geral (3,0%) — autos, caminhonetes, motos, embarcações",
      "IPVA — GNV (1,5%)",
      "IPVA — elétrico (0,5%)",
      "IPVA — ônibus/caminhões (1,0%)",
      "IPVA — aeronaves (2,0%)",
      "IPVA — isenção veículos até 2016",
      "IPVA — isenções (PCD, táxis, oficiais, transporte público, ambulâncias)",
      "IPVA — desconto antecipação (até 10%)",
      "ISS Natal — alíquotas por serviço (2%, 3%, 4%, 5%) — tabela completa",
      "ISS Natal — desconto geral 5% (Portaria 85/2024)",
      "IPTU Natal — residencial (0,6%)",
      "IPTU Natal — não residencial/terreno (1,0%)",
      "IPTU Natal — redução até 75% para imóveis ≤R$ 77.306",
      "IPTU Natal — desconto 16% cota única (2026)",
      "IPTU Natal — isenção/redução áreas de proteção",
      "ITBI/ITIV Natal — 2%",
      "SUDENE — redução 75% IRPJ",
      "Simples Nacional — sublimite (R$ 3.600.000)",
      "Simples Nacional — MEI limite (R$ 81.000)",
      "Simples Nacional — Anexos I a V completos",
      "Impostos federais — IRPJ, CSLL, PIS, COFINS, INSS, FGTS, IRPF (tabelas completas)"
    ],

    dados_nao_localizados: [
      "ICMS — energia elétrica (alíquota específica)",
      "ICMS — combustíveis (alíquota específica)",
      "ICMS — cesta básica (alíquota específica)",
      "ICMS — bebidas alcoólicas",
      "ICMS — medicamentos",
      "ICMS — telecom",
      "ICMS — FECOP/FEM (verificar se RN possui)",
      "ICMS — Substituição Tributária (produtos e MVA)",
      "IPVA — locadoras",
      "IPVA — calendário de vencimento detalhado",
      "ITCMD — alíquotas e faixas do RN",
      "ITBI/ITIV — alíquota SFH",
      "Taxas estaduais (licenciamento, judiciária, ambiental, bombeiros)",
      "Taxas municipais (lixo, alvará, COSIP)",
      "Incentivos estaduais (PROADI, etc.)",
      "Reforma tributária — alíquotas previstas IBS/CBS/IS"
    ],

    completude_estimada: "65%",

    contatos_para_completar: [
      "SEFAZ/RN: http://www.sefaz.rn.gov.br/",
      "DETRAN/RN: http://www.detran.rn.gov.br/",
      "SEMUT Natal: https://natal.rn.gov.br/semut/",
      "SUDENE: https://www.gov.br/sudene",
      "Receita Federal: https://www.gov.br/receitafederal/"
    ]
  }
};

// ============================================================
// 14. FUNÇÕES UTILITÁRIAS
// ============================================================

/**
 * Retorna alíquota ISS por tipo de serviço (Natal)
 * @param {string} tipo - Tipo de serviço
 * @returns {object}
 */
function getISS(tipo) {
  const aliases = {
    saude: "medicina",
    tecnologia: "informatica",
    ti: "informatica",
    software: "desenvolvimento_sistemas",
    web: "paginas_eletronicas",
    juridico: "advocacia",
    direito: "advocacia",
    seguranca: "vigilancia_seguranca",
    limpeza: "limpeza_conservacao",
    hospital: "hospitais_clinicas",
    dentista: "odontologia",
    fisio: "fisioterapia",
    fono: "fonoaudiologia"
  };

  const tipoNormalizado = aliases[tipo] || tipo;
  const servico = RIO_GRANDE_NORTE_TRIBUTARIO.iss.por_tipo_servico[tipoNormalizado];

  if (servico) {
    return servico;
  }
  return {
    aliquota: null,
    dados_disponiveis: false,
    obs: "Tipo de serviço não encontrado. Alíquotas em Natal: 2% (intermediação), 3% (saúde/educação), 4% (construção/advocacia/contabilidade), 5% (informática e demais)."
  };
}

/**
 * Retorna alíquota IPTU residencial (Natal)
 * @param {number} areaM2 - Área (não utilizado — alíquota única)
 * @returns {object}
 */
function getIPTUResidencial(areaM2) {
  return {
    aliquota: RIO_GRANDE_NORTE_TRIBUTARIO.iptu.residencial.aliquota,
    percentual: RIO_GRANDE_NORTE_TRIBUTARIO.iptu.residencial.percentual,
    tipo: "Alíquota única (sem progressão por área)",
    observacao: "Redução de até 75% para imóveis residenciais até R$ 77.306,01 (2025)"
  };
}

/**
 * Retorna alíquota IPTU comercial (Natal)
 * @param {number} areaM2 - Área (não utilizado — alíquota única)
 * @returns {object}
 */
function getIPTUComercial(areaM2) {
  return {
    aliquota: RIO_GRANDE_NORTE_TRIBUTARIO.iptu.comercial.aliquota,
    percentual: RIO_GRANDE_NORTE_TRIBUTARIO.iptu.comercial.percentual,
    tipo: "Alíquota única (sem progressão por área)"
  };
}

/**
 * Retorna alíquota IPVA por tipo de veículo
 * @param {string} tipo - Tipo do veículo
 * @returns {object}
 */
function getIPVA(tipo) {
  const veiculo = RIO_GRANDE_NORTE_TRIBUTARIO.ipva.aliquotas[tipo];
  if (veiculo) {
    return veiculo;
  }
  return {
    aliquota: null,
    dados_disponiveis: false,
    obs: "Tipo não encontrado. Disponíveis: automovel, caminhonete, motocicleta, micro_onibus, embarcacao, gnv, eletrico, onibus_caminhao, aeronave"
  };
}

/**
 * Verifica se município está em Zona Franca
 * @param {string} municipio
 * @returns {boolean}
 */
function isZonaFranca(municipio) {
  return false;
}

/**
 * Verifica se município é ALC
 * @param {string} municipio
 * @returns {boolean}
 */
function isALC(municipio) {
  return false;
}

/**
 * Retorna percentual de redução IRPJ pela SUDENE
 * @returns {object}
 */
function getReducaoSUDENE() {
  return {
    ativo: true,
    reducao: 0.75,
    reducao_percentual: "75%",
    aliquota_efetiva: 0.0375,
    aliquota_efetiva_percentual: "3,75%",
    legislacao: "Lei nº 8.167/1991; Decreto nº 4.213/2002"
  };
}

/**
 * Retorna percentual de redução IRPJ pela SUDAM
 * @returns {object}
 */
function getReducaoSUDAM() {
  return {
    ativo: false,
    observacao: "Rio Grande do Norte NÃO está na área de abrangência da SUDAM",
    reducao: 0,
    aliquota_efetiva: 0.15
  };
}

/**
 * Retorna ICMS efetivo (padrão + FECOP se houver)
 * @returns {object}
 */
function getICMSEfetivo() {
  const icms = RIO_GRANDE_NORTE_TRIBUTARIO.icms;
  const fecop = icms.fecop && icms.fecop.existe ? icms.fecop.adicional : 0;
  return {
    aliquota_padrao: icms.aliquota_padrao,
    fecop: fecop,
    aliquota_efetiva: icms.aliquota_padrao + fecop,
    aliquota_efetiva_percentual: ((icms.aliquota_padrao + fecop) * 100).toFixed(1) + "%"
  };
}

/**
 * Verifica se produto tem alíquota modal especial
 * @param {string} produto - "peixe" ou "molusco_crustaceo"
 * @returns {object|null}
 */
function getAliquotaModal(produto) {
  const modal = RIO_GRANDE_NORTE_TRIBUTARIO.icms.aliquotas_modais[produto];
  if (modal) {
    return modal;
  }
  return null;
}

/**
 * Retorna resumo tributário do estado
 * @returns {object}
 */
function resumoTributario() {
  const d = RIO_GRANDE_NORTE_TRIBUTARIO;
  return {
    estado: d.dados_gerais.nome,
    sigla: d.dados_gerais.sigla,
    regiao: d.dados_gerais.regiao,
    capital: d.dados_gerais.capital,
    icms_padrao: d.icms.aliquota_padrao,
    icms_efetivo: getICMSEfetivo().aliquota_efetiva,
    fecop: d.icms.fecop.existe ? d.icms.fecop.adicional : 0,
    ipva_automovel: d.ipva.aliquotas.automovel.aliquota,
    ipva_eletrico: d.ipva.aliquotas.eletrico.aliquota,
    ipva_gnv: d.ipva.aliquotas.gnv.aliquota,
    itcmd: "Dados não localizados — verificar SEFAZ/RN",
    iss_faixa: d.iss.faixa_aliquotas,
    iptu_residencial: d.iptu.residencial.aliquota,
    iptu_comercial: d.iptu.comercial.aliquota,
    iptu_desconto_cota_unica: d.iptu.descontos.cota_unica.percentual_descricao,
    itbi: d.itbi.aliquota_geral,
    sublimite_simples: d.simples_nacional.sublimite_estadual,
    sudam: d.incentivos.sudam.ativo,
    sudene: d.incentivos.sudene.ativo,
    zona_franca: d.dados_gerais.zona_franca.existe,
    suframa: d.dados_gerais.suframa.abrangencia,
    reducao_irpj_sudene: d.incentivos.sudene.ativo ? d.incentivos.sudene.reducao_irpj : 0,
    completude: d.cobertura.completude_estimada
  };
}

// ============================================================
// 15. EXPORTAÇÃO
// ============================================================

// Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    dados: RIO_GRANDE_NORTE_TRIBUTARIO,
    getISS,
    getIPTUResidencial,
    getIPTUComercial,
    getIPVA,
    isZonaFranca,
    isALC,
    getReducaoSUDENE,
    getReducaoSUDAM,
    getICMSEfetivo,
    getAliquotaModal,
    resumoTributario
  };
}

// Browser
if (typeof window !== 'undefined') {
  window.RIO_GRANDE_NORTE_TRIBUTARIO = RIO_GRANDE_NORTE_TRIBUTARIO;
  window.rio_grande_norte_utils = {
    getISS,
    getIPTUResidencial,
    getIPTUComercial,
    getIPVA,
    isZonaFranca,
    isALC,
    getReducaoSUDENE,
    getReducaoSUDAM,
    getICMSEfetivo,
    getAliquotaModal,
    resumoTributario
  };
}
