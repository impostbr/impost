/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GOIAS.JS — Base de Dados Tributária Completa do Estado de Goiás
 * ═══════════════════════════════════════════════════════════════════════════
 * Versão 3.0 — Padronizado conforme template roraima.js v3.0
 * Dados verificados via fontes oficiais (SEFAZ/GO, RFB, Planalto, Prefeitura de Goiânia)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ESTRUTURA PADRÃO (15 seções obrigatórias):
 *   01. dados_gerais        — Identificação, links, legislação base
 *   02. icms                — Alíquotas, diferenciadas, interestaduais, DIFAL
 *   03. ipva                — Alíquotas, descontos, isenções, calendário
 *   04. itcmd               — Alíquotas, base de cálculo, isenções
 *   05. iss                 — Tabela por tipo de serviço (Goiânia — referência)
 *   06. iptu                — Alíquotas, progressividade, isenções (Goiânia)
 *   07. itbi                — Alíquota, base de cálculo (Goiânia)
 *   08. taxas               — Estaduais e municipais (Goiânia)
 *   09. federal             — IRPJ, CSLL, PIS, COFINS, IOF, ITR, INSS, FGTS, IRPF
 *   10. simples_nacional    — Anexos, faixas, sublimite, MEI
 *   11. incentivos          — SUDAM/SUDENE, ZFM, SUFRAMA, programas estaduais
 *   12. reforma_tributaria  — IBS/CBS/IS, transição
 *   13. cobertura           — Versão, itens localizados/pendentes, contatos
 *   14. funções utilitárias — Helpers de cálculo
 *   15. exportação          — module.exports + window (padrão Grupo 2)
 *
 * FONTES CONSULTADAS:
 *   • SEFAZ/GO — https://goias.gov.br/economia/
 *   • Lei nº 11.651/1991 (Código Tributário Estadual — ICMS)
 *   • Lei nº 23.129/2024 (Alíquota ICMS 19%)
 *   • Decreto nº 4.852/1997 (RICMS/GO)
 *   • Lei nº 20.752/1996 (IPVA)
 *   • Lei nº 23.036/2024 (Alterações IPVA — isenção motos ≤150cc)
 *   • Lei nº 5.040/1975 (CTM Goiânia)
 *   • LC nº 344/2021; LC nº 362/2022; LC nº 381/2024 (Alterações CTM Goiânia)
 *   • Lei nº 11.520/2025 (REFIS 2025)
 *   • IN SMF/SEDEC nº 1/2025 (SGISS Goiânia)
 *   • DC nº 2.824/2025 (SGISS Goiânia)
 *   • Receita Federal — www.gov.br/receitafederal
 *
 * ATUALIZAÇÃO: 10/02/2026
 * ═══════════════════════════════════════════════════════════════════════════
 */

const GOIAS_TRIBUTARIO = {

  // ═══════════════════════════════════════════════════════════════
  //  1. DADOS GERAIS
  // ═══════════════════════════════════════════════════════════════
  dados_gerais: {
    nome: "Goiás",
    sigla: "GO",
    regiao: "Centro-Oeste",
    capital: "Goiânia",
    codigo_ibge: "52",
    codigo_ibge_capital: "5208707",
    municipios_principais: [
      { nome: "Goiânia", codigo_ibge: "5208707", capital: true },
      { nome: "Aparecida de Goiânia", codigo_ibge: "5202404" },
      { nome: "Anápolis", codigo_ibge: "5201405" },
      { nome: "Rio Verde", codigo_ibge: "5218808" }
    ],
    zona_franca: {
      existe: false,
      observacao: "Não há Zona Franca em Goiás"
    },
    alc: {
      existe: false,
      observacao: "Não há Área de Livre Comércio em Goiás"
    },
    sudam: {
      abrangencia: false,
      observacao: "Goiás não está na área de abrangência da SUDAM"
    },
    sudene: {
      abrangencia: false,
      observacao: "Goiás não está na área de abrangência da SUDENE"
    },
    suframa: {
      abrangencia: false,
      observacao: "Goiás não está na área de abrangência da SUFRAMA"
    },
    sefaz: {
      url: "https://goias.gov.br/economia/",
      legislacao: "https://appasp.economia.go.gov.br/legislacao/",
      ipva: "https://goias.gov.br/economia/ipva/"
    },
    prefeitura_capital: {
      url: "https://www.goiania.go.gov.br/",
      sefaz: "https://www.goiania.go.gov.br/sefaz/",
      contato: "DADO NÃO LOCALIZADO"
    },
    detran: {
      url: "https://goias.gov.br/detran/"
    },
    legislacao_base: {
      icms: "Lei nº 11.651/1991; Lei nº 23.129/2024; Decreto nº 4.852/1997 (RICMS/GO)",
      ipva: "Lei nº 20.752/1996; Lei nº 23.036/2024",
      iss: "Lei nº 5.040/1975 (CTM Goiânia); LC nº 344/2021; LC nº 362/2022; LC nº 116/2003 (federal)",
      iptu: "Lei nº 5.040/1975; LC nº 344/2021; LC nº 381/2024; LC nº 362/2022"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  2. ICMS — IMPOSTO SOBRE CIRCULAÇÃO DE MERCADORIAS E SERVIÇOS
  // ═══════════════════════════════════════════════════════════════
  icms: {
    aliquota_padrao: 0.19,
    aliquota_padrao_percentual: "19%",
    aliquota_padrao_anterior: null,
    vigencia_aliquota_atual: "Vigente",
    base_legal: "Lei nº 11.651/1991; Lei nº 23.129/2024; Decreto nº 4.852/1997 (RICMS/GO)",

    historico: [
      { vigencia: "Vigente", aliquota: 0.19, percentual: "19%", base_legal: "Lei nº 11.651/1991" }
    ],

    aliquotas_diferenciadas: {
      energia_eletrica: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ/GO"
      },
      combustiveis: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ/GO"
      },
      cesta_basica: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ/GO"
      },
      bebidas_alcoolicas: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ/GO"
      },
      medicamentos: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ/GO"
      },
      telecom: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ/GO"
      },
      energia_solar: {
        descricao: "Energia solar gerada — benefício conforme legislação",
        dados_disponiveis: false,
        obs: "Verificar legislação específica na SEFAZ/GO"
      },
      biogas_biometano: {
        aliquota: 0.12,
        percentual: "12%",
        descricao: "Redução para biogás/biometano",
        vigencia: "Desde 23/12/2024"
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

    importacao: {
      aliquota: 0.19,
      percentual: "19%",
      descricao: "ICMS sobre importação — alíquota interna"
    },

    fecop: {
      existe: false,
      adicional: 0,
      observacao: "FECOP/PROTEGE não identificado como adicional ao ICMS na pesquisa — verificar na SEFAZ/GO"
    },

    difal: {
      aplicacao: true,
      calculo: "Diferença entre alíquota interna (19%) e alíquota interestadual",
      base_legal: "EC 87/2015"
    },

    substituicao_tributaria: {
      dados_disponiveis: false,
      obs: "Verificar lista de produtos e MVA na SEFAZ/GO"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  3. IPVA — IMPOSTO SOBRE PROPRIEDADE DE VEÍCULOS AUTOMOTORES
  // ═══════════════════════════════════════════════════════════════
  ipva: {
    base_legal: "Lei nº 20.752/1996; Lei nº 23.036/2024",
    base_calculo: "Valor venal conforme tabela FIPE",

    aliquotas: {
      automovel_passeio: {
        aliquota: 0.0375,
        percentual: "3,75%",
        descricao: "Automóveis, caminhonetes, veículos aquáticos/aéreos de passeio"
      },
      veiculo_terrestre_passeio: {
        aliquota_minima: 0.0345,
        aliquota_maxima: 0.0375,
        percentual: "3,45% a 3,75%",
        descricao: "Veículos terrestres de passeio (conforme tipo)"
      },
      motocicleta_acima_150cc: {
        aliquota: 0.03,
        percentual: "3,0%",
        descricao: "Motocicletas, ciclomotores, triciclos acima de 150cc"
      },
      motocicleta_ate_150cc: {
        aliquota: 0.00,
        percentual: "0% (isento)",
        descricao: "Motocicletas, ciclomotores, triciclos até 150cc — isenção total desde 2026",
        base_legal: "Lei nº 23.036/2024"
      },
      onibus_caminhao: {
        aliquota: 0.0125,
        percentual: "1,25%",
        descricao: "Ônibus, micro-ônibus, caminhões, veículos aéreos/aquáticos de transporte coletivo"
      },
      embarcacao: {
        aliquota: 0.0375,
        percentual: "3,75%",
        descricao: "Embarcações de passeio (mesma alíquota geral)"
      },
      aeronave_passeio: {
        aliquota: 0.0375,
        percentual: "3,75%",
        descricao: "Aeronaves de passeio (mesma alíquota geral)"
      },
      aeronave_transporte: {
        aliquota: 0.0125,
        percentual: "1,25%",
        descricao: "Aeronaves de transporte coletivo"
      },
      locadora: {
        aliquota: null,
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ/GO"
      }
    },

    isencoes: [
      {
        tipo: "Motocicletas até 150cc",
        descricao: "Isenção total de IPVA para motocicletas, ciclomotores e triciclos até 150cc",
        vigencia: "A partir de 2026",
        base_legal: "Lei nº 23.036/2024"
      },
      {
        tipo: "Veículos com 20 anos ou mais",
        descricao: "Isenção total de IPVA",
        base_legal: "Lei estadual"
      },
      {
        tipo: "PCD",
        descricao: "Isenção total para pessoas com deficiência — com comprovação"
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
      cota_unica: {
        percentual: 0.08,
        percentual_descricao: "8%",
        prazo: "Até 15/01",
        vigencia: "2026"
      },
      nota_fiscal_goiana: {
        percentual_maximo: 0.18,
        percentual_maximo_descricao: "Até 18%",
        descricao: "Desconto adicional acumulativo via Programa Nota Fiscal Goiana",
        nota: "Cumulativo com desconto cota única — potencial total até 26%"
      },
      parcelamento: {
        parcelas: 10,
        descricao: "Até 10 parcelas sem desconto (novidade 2026)"
      }
    },

    calendario_vencimento: {
      dados_disponiveis: false,
      obs: "Consultar calendário oficial na SEFAZ/GO ou DETRAN/GO"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  4. ITCMD — IMPOSTO SOBRE TRANSMISSÃO CAUSA MORTIS E DOAÇÃO
  // ═══════════════════════════════════════════════════════════════
  itcmd: {
    base_legal: "DADO NÃO LOCALIZADO — verificar legislação estadual de Goiás",

    aliquotas: {
      causa_mortis: {
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ/GO"
      },
      doacao: {
        dados_disponiveis: false,
        obs: "Verificar diretamente na SEFAZ/GO"
      }
    },

    base_calculo: "Valor venal do bem ou direito transmitido",

    isencoes: {
      dados_disponiveis: false,
      obs: "Verificar na SEFAZ/GO"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  5. ISS — IMPOSTO SOBRE SERVIÇOS (Goiânia — referência)
  // ═══════════════════════════════════════════════════════════════
  iss: {
    municipio_referencia: "Goiânia",
    base_legal: "Lei nº 5.040/1975 (CTM Goiânia); LC nº 344/2021; LC nº 362/2022; LC nº 116/2003 (federal); IN SMF/SEDEC nº 1/2025",
    aliquota_minima_federal: 0.02,
    aliquota_maxima_federal: 0.05,

    aliquota_geral: null,
    aliquota_geral_obs: "Goiânia não possui alíquota geral única — varia de 2% a 5% conforme serviço",
    faixa_aliquotas: "2% a 5%",

    sgiss: {
      nome: "SGISS — Sistema de Gestão, Fiscalização e Arrecadação do ISSQN",
      vigencia: "A partir de 01/10/2025",
      descricao: "Centraliza emissão de NFS-e em Goiânia",
      base_legal: "DC nº 2.824/2025"
    },

    por_tipo_servico: {
      // ===== ALÍQUOTA 2% =====
      intermediacao_imoveis: { aliquota: 0.02, percentual: "2%", grupo: "Intermediação (2%)" },
      agenciamento_seguros: { aliquota: 0.02, percentual: "2%", grupo: "Intermediação (2%)" },
      intermediacao_geral: { aliquota: 0.02, percentual: "2%", grupo: "Intermediação (2%)" },
      construcao_civil_refis: { aliquota: 0.02, percentual: "2%", grupo: "REFIS 2025 (2%)", observacao: "Redução especial REFIS 2025 — verificar vigência" },
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
      construcao_civil: { aliquota: 0.04, percentual: "4%", grupo: "Construção e Engenharia (4%)", nota: "4% a 5% padrão — 2% no REFIS 2025" },
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
        "Construção civil (REFIS 2025 — redução especial)",
        "Profissionais recém-formados (primeiros 5 anos)"
      ],
      aliquota_3_porcento: [
        "Saúde e assistência médica (medicina, odontologia, psicologia, etc.)",
        "Hospitais, clínicas, laboratórios",
        "Planos de saúde",
        "Educação e ensino regular"
      ],
      aliquota_4_porcento: [
        "Construção civil (padrão), engenharia, arquitetura",
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

  // ═══════════════════════════════════════════════════════════════
  //  6. IPTU — IMPOSTO PREDIAL E TERRITORIAL URBANO (Goiânia)
  // ═══════════════════════════════════════════════════════════════
  iptu: {
    municipio_referencia: "Goiânia",
    base_legal: "Lei nº 5.040/1975; LC nº 344/2021; LC nº 381/2024; LC nº 362/2022; Lei nº 11.520/2025",
    base_calculo: "Valor venal do imóvel conforme Planta Genérica de Valores (PGV) municipal",
    tipo_aliquota: "Progressivo por faixa de valor venal",

    residencial: {
      aliquota_minima: 0.006,
      aliquota_maxima: 0.012,
      percentual: "0,6% a 1,2%",
      descricao: "Imóvel residencial — alíquota progressiva conforme valor venal"
    },

    comercial: {
      aliquota_minima: 0.012,
      aliquota_maxima: 0.015,
      percentual: "1,2% a 1,5%",
      descricao: "Imóvel não residencial — alíquota progressiva conforme valor venal"
    },

    terreno_nao_edificado: {
      aliquota_minima: 0.015,
      aliquota_maxima: 0.02,
      percentual: "1,5% a 2,0%",
      descricao: "Terreno não edificado — alíquota progressiva conforme valor venal"
    },

    isencoes: [
      {
        tipo: "IPTU Social",
        descricao: "Isenção para imóvel residencial com valor venal até R$ 173.000 (2025)",
        valor_limite: 173000,
        vigencia: "2025",
        base_legal: "LC nº 381/2024"
      },
      {
        tipo: "Renda limitada (em análise)",
        descricao: "Isenção para renda até 5 salários mínimos — projeto em análise (2025)",
        status: "Pendente"
      },
      {
        tipo: "Imóveis de interesse público",
        descricao: "Isenção conforme legislação",
        base_legal: "Lei nº 5.040/1975"
      },
      {
        tipo: "Pessoas com doenças graves",
        descricao: "Isenção para portadores de doenças graves",
        base_legal: "LC nº 381/2024"
      }
    ],

    descontos: {
      cota_unica: {
        percentual: 0.10,
        percentual_descricao: "10%",
        descricao: "Desconto de 10% para pagamento em cota única antecipada",
        vigencia: "2026"
      },
      parcelamento: {
        parcelas: 11,
        descricao: "Até 11 parcelas sem desconto"
      }
    },

    reajuste: {
      percentual_2026: 0.0446,
      percentual_2026_descricao: "4,46%",
      descricao: "Reajuste de 4,46% sobre valores de 2025"
    },

    refis: {
      nome: "REFIS 2025",
      base_legal: "Lei nº 11.520/2025",
      descricao: "Programa de regularização fiscal municipal — inclui ISS e IPTU"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  7. ITBI — IMPOSTO SOBRE TRANSMISSÃO DE BENS IMÓVEIS (Goiânia)
  // ═══════════════════════════════════════════════════════════════
  itbi: {
    municipio_referencia: "Goiânia",
    base_legal: "DADO NÃO LOCALIZADO — verificar no CTM de Goiânia",
    base_calculo: "Valor venal ou valor de transação do imóvel",

    aliquota_geral: null,
    dados_disponiveis: false,
    obs: "Alíquota de ITBI de Goiânia não localizada na pesquisa — verificar na Prefeitura"
  },

  // ═══════════════════════════════════════════════════════════════
  //  8. TAXAS ESTADUAIS E MUNICIPAIS
  // ═══════════════════════════════════════════════════════════════
  taxas: {

    // ── Taxas Estaduais ──
    estaduais: {
      licenciamento_veiculos: { dados_disponiveis: false, obs: "Verificar na SEFAZ/GO" },
      taxa_judiciaria: { dados_disponiveis: false, obs: "Verificar no TJGO" },
      servicos_sefaz: { dados_disponiveis: false, obs: "Verificar na SEFAZ/GO" },
      taxa_ambiental: { dados_disponiveis: false, obs: "Verificar na SEFAZ/GO" },
      taxa_incendio_bombeiros: { dados_disponiveis: false, obs: "Verificar na SEFAZ/GO" }
    },

    // ── Taxas Municipais (Goiânia — Capital) ──
    municipais_goiania: {
      municipio_referencia: "Goiânia",
      taxa_lixo: { dados_disponiveis: false, obs: "Verificar na Prefeitura de Goiânia" },
      alvara_funcionamento: { dados_disponiveis: false, obs: "Verificar na Prefeitura de Goiânia" },
      cosip: { dados_disponiveis: false, obs: "Verificar na Prefeitura de Goiânia" }
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  9. IMPOSTOS FEDERAIS (aplicáveis em Goiás)
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
      observacao: "Goiás não possui benefícios de IPI tipo ZFM/SUFRAMA"
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

  // ═══════════════════════════════════════════════════════════════
  //  10. SIMPLES NACIONAL
  // ═══════════════════════════════════════════════════════════════
  simples_nacional: {
    sublimite_estadual: 3600000,
    sublimite_estadual_formatado: "R$ 3.600.000,00",
    sublimite_observacao: "Goiás adota o sublimite padrão nacional",

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

  // ═══════════════════════════════════════════════════════════════
  //  11. INCENTIVOS FISCAIS E BENEFÍCIOS REGIONAIS
  // ═══════════════════════════════════════════════════════════════
  incentivos: {
    sudam: {
      ativo: false,
      observacao: "Goiás NÃO está na área de abrangência da SUDAM"
    },

    sudene: {
      ativo: false,
      observacao: "Goiás NÃO está na área de abrangência da SUDENE"
    },

    zona_franca: {
      ativo: false,
      observacao: "Não há Zona Franca em Goiás"
    },

    suframa: {
      ativo: false,
      observacao: "Goiás não está na área de abrangência da SUFRAMA"
    },

    incentivos_estaduais: {
      nota_fiscal_goiana: {
        nome: "Programa Nota Fiscal Goiana",
        descricao: "Desconto no IPVA de até 18% para consumidores que solicitam NF",
        aplicacao: "Desconto acumulativo no IPVA"
      },
      fomentar: {
        dados_disponiveis: false,
        obs: "Programa FOMENTAR — verificar condições atuais na SEFAZ/GO"
      },
      produzir: {
        dados_disponiveis: false,
        obs: "Programa PRODUZIR — verificar condições atuais na SEFAZ/GO"
      },
      centroeste: {
        dados_disponiveis: false,
        obs: "Programa Centro-Oeste — verificar incentivos federais para região CO"
      },
      biogas_biometano: {
        descricao: "ICMS reduzido para 12% sobre biogás/biometano",
        vigencia: "Desde 23/12/2024"
      },
      refis_2025: {
        nome: "REFIS 2025",
        descricao: "Programa de regularização fiscal — redução ISS construção civil para 2%",
        base_legal: "Lei nº 11.520/2025"
      }
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
    impactos_goias: {
      fundo_desenvolvimento_regional: {
        dados_disponiveis: false,
        obs: "Verificar na SEFAZ/GO"
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
      "ICMS — alíquota padrão interna (19%)",
      "ICMS — alíquotas interestaduais (7% e 12%)",
      "ICMS — importação (19%)",
      "ICMS — biogás/biometano (12%)",
      "ICMS — DIFAL (EC 87/2015)",
      "IPVA — automóvel/passeio (3,75%)",
      "IPVA — veículos terrestres passeio (3,45% a 3,75%)",
      "IPVA — motocicleta >150cc (3,0%)",
      "IPVA — motocicleta ≤150cc (0% — isento desde 2026)",
      "IPVA — ônibus/caminhão/transporte coletivo (1,25%)",
      "IPVA — aeronaves e embarcações (3,75% passeio / 1,25% transporte)",
      "IPVA — isenção veículos ≥20 anos",
      "IPVA — isenções (PCD, táxis, oficiais, transporte público, ambulâncias)",
      "IPVA — desconto cota única 8% + Nota Fiscal Goiana até 18%",
      "IPVA — parcelamento 10x (novidade 2026)",
      "ISS Goiânia — alíquotas por serviço (2%, 3%, 4%, 5%) — tabela completa",
      "ISS Goiânia — construção civil REFIS 2025 (2%)",
      "ISS Goiânia — SGISS novo sistema NFS-e (10/2025)",
      "IPTU Goiânia — residencial (0,6% a 1,2%)",
      "IPTU Goiânia — não residencial (1,2% a 1,5%)",
      "IPTU Goiânia — terreno não edificado (1,5% a 2,0%)",
      "IPTU Goiânia — IPTU Social (isenção até R$ 173k)",
      "IPTU Goiânia — isenção doenças graves",
      "IPTU Goiânia — desconto 10% cota única",
      "IPTU Goiânia — reajuste 4,46% (2026)",
      "Simples Nacional — sublimite (R$ 3.600.000)",
      "Simples Nacional — MEI limite (R$ 81.000)",
      "Simples Nacional — Anexos I a V completos",
      "Nota Fiscal Goiana — desconto IPVA",
      "Impostos federais — IRPJ, CSLL, PIS, COFINS, INSS, FGTS, IRPF (tabelas completas)"
    ],

    nao_localizados: [
      "ICMS — energia elétrica (alíquota específica)",
      "ICMS — combustíveis (alíquota específica)",
      "ICMS — cesta básica (alíquota específica)",
      "ICMS — bebidas alcoólicas",
      "ICMS — medicamentos",
      "ICMS — telecom",
      "ICMS — FECOP/PROTEGE (verificar se GO possui adicional)",
      "ICMS — Substituição Tributária (produtos e MVA)",
      "ICMS — histórico de alterações (alíquotas anteriores a 19%)",
      "IPVA — locadoras",
      "IPVA — calendário de vencimento detalhado",
      "ITCMD — alíquotas e faixas de Goiás",
      "ITBI Goiânia — alíquota",
      "Taxas estaduais (licenciamento, judiciária, ambiental, bombeiros)",
      "Taxas municipais (lixo, alvará, COSIP)",
      "Incentivos estaduais (FOMENTAR, PRODUZIR, etc.)",
      "Reforma tributária — alíquotas previstas IBS/CBS/IS"
    ],

    completude_estimada: "62%",

    contatos_para_completar: [
      { orgao: "SEFAZ/GO", url: "https://goias.gov.br/economia/" },
      { orgao: "DETRAN/GO", url: "https://goias.gov.br/detran/" },
      { orgao: "Prefeitura de Goiânia", url: "https://www.goiania.go.gov.br/sefaz/" },
      { orgao: "Receita Federal", url: "https://www.gov.br/receitafederal/" }
    ]
  }
};


// ═══════════════════════════════════════════════════════════════════════════
//  14. FUNÇÕES UTILITÁRIAS — GOIÁS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Retorna alíquota ISS por tipo de serviço (Goiânia)
 * @param {string} tipo - Tipo de serviço
 * @returns {object}
 */
function getISSGoias(tipo) {
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
  const servico = GOIAS_TRIBUTARIO.iss.por_tipo_servico[tipoNormalizado];

  if (servico) {
    return servico;
  }
  return {
    aliquota: null,
    dados_disponiveis: false,
    obs: "Tipo de serviço não encontrado. Alíquotas em Goiânia: 2% (intermediação/REFIS), 3% (saúde/educação), 4% (construção/advocacia/contabilidade), 5% (informática e demais)."
  };
}

/**
 * Retorna alíquota IPTU residencial (Goiânia)
 * @param {number} valorVenal - Valor venal do imóvel
 * @returns {object}
 */
function getIPTUResidencialGoias(valorVenal) {
  const iptu = GOIAS_TRIBUTARIO.iptu;
  return {
    aliquota_minima: iptu.residencial.aliquota_minima,
    aliquota_maxima: iptu.residencial.aliquota_maxima,
    percentual: iptu.residencial.percentual,
    tipo: "Progressivo por faixa de valor venal",
    isento_iptu_social: valorVenal && valorVenal <= 173000,
    observacao: valorVenal && valorVenal <= 173000
      ? "Imóvel pode ser isento pelo IPTU Social (até R$ 173.000)"
      : "Verificar faixas detalhadas na Prefeitura de Goiânia"
  };
}

/**
 * Retorna alíquota IPTU comercial (Goiânia)
 * @param {number} valorVenal - Valor venal do imóvel
 * @returns {object}
 */
function getIPTUComercialGoias(valorVenal) {
  const iptu = GOIAS_TRIBUTARIO.iptu;
  return {
    aliquota_minima: iptu.comercial.aliquota_minima,
    aliquota_maxima: iptu.comercial.aliquota_maxima,
    percentual: iptu.comercial.percentual,
    tipo: "Progressivo por faixa de valor venal"
  };
}

/**
 * Retorna alíquota IPVA por tipo de veículo
 * @param {string} tipo - Tipo do veículo
 * @returns {object}
 */
function getIPVAGoias(tipo) {
  const veiculo = GOIAS_TRIBUTARIO.ipva.aliquotas[tipo];
  if (veiculo) {
    return veiculo;
  }
  return {
    aliquota: null,
    dados_disponiveis: false,
    obs: "Tipo não encontrado. Disponíveis: automovel_passeio, veiculo_terrestre_passeio, motocicleta_acima_150cc, motocicleta_ate_150cc, onibus_caminhao, embarcacao, aeronave_passeio, aeronave_transporte"
  };
}

/**
 * Calcula desconto IPVA com Nota Fiscal Goiana
 * @param {number} valorIPVA - Valor do IPVA
 * @param {number} creditoNFG - Crédito acumulado Nota Fiscal Goiana (decimal, ex: 0.10 = 10%)
 * @param {boolean} cotaUnica - Se paga em cota única
 * @returns {object}
 */
function calcularDescontoIPVAGoias(valorIPVA, creditoNFG, cotaUnica) {
  const descontoCU = cotaUnica ? 0.08 : 0;
  const descontoNFG = Math.min(creditoNFG || 0, 0.18);
  const descontoTotal = Math.min(descontoCU + descontoNFG, 0.26);
  const valorDesconto = valorIPVA * descontoTotal;
  return {
    valor_original: valorIPVA,
    desconto_cota_unica: descontoCU,
    desconto_nota_fiscal_goiana: descontoNFG,
    desconto_total: descontoTotal,
    desconto_total_percentual: (descontoTotal * 100).toFixed(1) + "%",
    valor_desconto: Math.round(valorDesconto * 100) / 100,
    valor_final: Math.round((valorIPVA - valorDesconto) * 100) / 100
  };
}

/**
 * Verifica se município está em Zona Franca
 * @param {string} municipio
 * @returns {boolean}
 */
function isZonaFrancaGoias(municipio) {
  return false;
}

/**
 * Verifica se município é ALC
 * @param {string} municipio
 * @returns {boolean}
 */
function isALCGoias(municipio) {
  return false;
}

/**
 * Retorna percentual de redução IRPJ pela SUDENE
 * @returns {object}
 */
function getReducaoSUDENEGoias() {
  return {
    ativo: false,
    observacao: "Goiás NÃO está na área de abrangência da SUDENE",
    reducao: 0,
    aliquota_efetiva: 0.15
  };
}

/**
 * Retorna percentual de redução IRPJ pela SUDAM
 * @returns {object}
 */
function getReducaoSUDAMGoias() {
  return {
    ativo: false,
    observacao: "Goiás NÃO está na área de abrangência da SUDAM",
    reducao: 0,
    aliquota_efetiva: 0.15
  };
}

/**
 * Retorna ICMS efetivo (padrão + FECOP se houver)
 * @returns {object}
 */
function getICMSEfetivoGoias() {
  const icms = GOIAS_TRIBUTARIO.icms;
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
function resumoTributarioGoias() {
  const d = GOIAS_TRIBUTARIO;
  return {
    estado: d.dados_gerais.nome,
    sigla: d.dados_gerais.sigla,
    regiao: d.dados_gerais.regiao,
    capital: d.dados_gerais.capital,
    icms_padrao: d.icms.aliquota_padrao,
    icms_efetivo: getICMSEfetivoGoias().aliquota_efetiva,
    fecop: 0,
    ipva_automovel: d.ipva.aliquotas.automovel_passeio.aliquota,
    ipva_moto_ate_150cc: d.ipva.aliquotas.motocicleta_ate_150cc.aliquota,
    ipva_moto_acima_150cc: d.ipva.aliquotas.motocicleta_acima_150cc.aliquota,
    ipva_onibus_caminhao: d.ipva.aliquotas.onibus_caminhao.aliquota,
    ipva_desconto_maximo: "Até 26% (8% cota única + 18% Nota Fiscal Goiana)",
    iss_faixa: d.iss.faixa_aliquotas,
    iptu_residencial: d.iptu.residencial.percentual,
    iptu_comercial: d.iptu.comercial.percentual,
    iptu_terreno: d.iptu.terreno_nao_edificado.percentual,
    iptu_social: "Isenção até R$ 173.000",
    itbi: d.itbi.dados_disponiveis ? d.itbi.aliquota_geral : "Dado não localizado",
    itcmd: "Dado não localizado",
    sublimite_simples: d.simples_nacional.sublimite_estadual,
    sudam: d.incentivos.sudam.ativo,
    sudene: d.incentivos.sudene.ativo,
    zona_franca: d.dados_gerais.zona_franca.existe,
    suframa: d.dados_gerais.suframa.abrangencia,
    nota_fiscal_goiana: true,
    completude: d.cobertura.completude_estimada
  };
}


// ═══════════════════════════════════════════════════════════════════════════
//  15. EXPORTAÇÃO (Padrão Grupo 2)
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        ...GOIAS_TRIBUTARIO,
        utils: {
            getISS: getISSGoias,
            getIPTUResidencial: getIPTUResidencialGoias,
            getIPTUComercial: getIPTUComercialGoias,
            getIPVA: getIPVAGoias,
            calcularDescontoIPVA: calcularDescontoIPVAGoias,
            isZonaFranca: isZonaFrancaGoias,
            isALC: isALCGoias,
            getReducaoSUDENE: getReducaoSUDENEGoias,
            getReducaoSUDAM: getReducaoSUDAMGoias,
            getICMSEfetivo: getICMSEfetivoGoias,
            resumoTributario: resumoTributarioGoias,
        },
    };
}

if (typeof window !== "undefined") {
    window.GOIAS_TRIBUTARIO = GOIAS_TRIBUTARIO;
    window.GoiasTributario = {
        getISS: getISSGoias,
        getIPTUResidencial: getIPTUResidencialGoias,
        getIPTUComercial: getIPTUComercialGoias,
        getIPVA: getIPVAGoias,
        calcularDescontoIPVA: calcularDescontoIPVAGoias,
        isZonaFranca: isZonaFrancaGoias,
        isALC: isALCGoias,
        getReducaoSUDENE: getReducaoSUDENEGoias,
        getReducaoSUDAM: getReducaoSUDAMGoias,
        getICMSEfetivo: getICMSEfetivoGoias,
        resumoTributario: resumoTributarioGoias,
    };
}
