/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DISTRITO_FEDERAL.JS — Base de Dados Tributária Completa do Distrito Federal
 * ═══════════════════════════════════════════════════════════════════════════
 * Versão 3.0 — Padronizado conforme template roraima.js v3.0
 * Dados verificados via fontes oficiais (SEFAZ-DF/SEEC-DF, RFB, Planalto)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ESTRUTURA PADRÃO (15 seções obrigatórias):
 *   01. dados_gerais        — Identificação, links, legislação base
 *   02. icms                — Alíquotas, cesta básica, reduções, ST, DIFAL
 *   03. ipva                — Alíquotas, calendário, descontos, isenções
 *   04. itcmd               — Alíquotas, base de cálculo, isenções, reforma
 *   05. iss                 — Tabela por grupo de serviço (Brasília)
 *   06. iptu                — Alíquotas, progressividade, isenções
 *   07. itbi                — Alíquota, base de cálculo
 *   08. taxas               — Distritais (TLP, DETRAN-DF)
 *   09. federal             — IRPJ, CSLL, PIS, COFINS, IOF, ITR, INSS, FGTS, IRPF
 *   10. simples_nacional    — Anexos, faixas, sublimite, MEI
 *   11. incentivos          — Benefícios fiscais distritais
 *   12. reforma_tributaria  — EC 132, LC 214, LC 227, transição IBS/CBS
 *   13. cobertura           — Versão, itens localizados/pendentes, contatos
 *   14. funções utilitárias — Helpers de cálculo
 *   15. exportação          — module.exports + window (padrão Grupo 2)
 *
 * FONTES CONSULTADAS:
 *   • SEFAZ-DF (Secretaria de Estado de Economia) — www.economia.df.gov.br
 *   • Receita do DF — www.receita.fazenda.df.gov.br
 *   • Decreto-Lei nº 82/1966 (Código Tributário do DF)
 *   • Lei nº 769/1994 (Alterações sistema tributário DF)
 *   • Decreto nº 25.508/2005 (RISS-DF)
 *   • LC nº 116/2003 (ISS federal)
 *   • Lei nº 3.269/2003 (Redução ISS TI)
 *   • LC nº 994/2021 (ISS hotelaria 3%)
 *   • Portaria nº 923/2025 (Calendário IPVA 2026)
 *   • LC nº 227/2026 (ITCMD progressivo obrigatório)
 *   • Receita Federal — www.gov.br/receitafederal
 *
 * PARTICULARIDADE ÚNICA: O DF acumula competência estadual E
 * municipal. Brasília é a ÚNICA cidade. Não há distinção entre
 * impostos estaduais e municipais — todos cobrados pela SEFAZ-DF.
 *
 * ATUALIZAÇÃO: 10/02/2026
 * ═══════════════════════════════════════════════════════════════════════════
 */

const DISTRITO_FEDERAL_TRIBUTARIO = {

  // ═══════════════════════════════════════════════════════════════
  //  1. DADOS GERAIS
  // ═══════════════════════════════════════════════════════════════
  dados_gerais: {
    nome: "Distrito Federal",
    sigla: "DF",
    regiao: "Centro-Oeste",
    capital: "Brasília",
    codigo_ibge: "53",
    codigo_ibge_capital: "5300108",
    zona_franca: false,
    alc_nome: null,
    alc_municipios: [],
    sudam: false,
    sudene: false,
    populacao_estimada: 3100000,
    pib_ranking: 8,
    sefaz_nome: "Secretaria de Estado de Economia (SEEC-DF)",
    sefaz_url: "https://www.economia.df.gov.br/",
    receita_df_url: "https://www.receita.fazenda.df.gov.br/",
    legislacao_base: [
      { norma: "Decreto-Lei nº 82/1966", assunto: "Código Tributário do Distrito Federal — todos os tributos distritais", url: "https://www.sinj.df.gov.br" },
      { norma: "Lei nº 769/1994", assunto: "Alterações ao sistema tributário do DF — inclusão de IPVA, ICMS, ITBI, ISS" },
      { norma: "Decreto nº 25.508/2005", assunto: "RISS — Regulamento do ISS do Distrito Federal" },
      { norma: "Lei Complementar nº 116/2003", assunto: "ISS — Lei Nacional do ISS" },
      { norma: "Lei nº 3.269/2003", assunto: "Redução de ISS para 2% em atividades específicas no DF" },
      { norma: "Lei Complementar nº 994/2021", assunto: "ISS hotelaria — alíquota de 3% a partir de 01/01/2022" },
      { norma: "Portaria nº 923/2025", assunto: "Calendário IPVA 2026 — datas de vencimento e parcelas" },
      { norma: "Lei Complementar nº 227/2026", assunto: "ITCMD progressivo obrigatório — Lei Geral nacional" }
    ],
    particularidades: {
      ente_federativo_unico: true,
      brasilia_unica_cidade: true,
      acumula_competencia_estadual_e_municipal: true,
      todos_tributos_pela_sefaz: true,
      sem_municipios: true,
      ibs_cbs_integram_icms_2026: true,
      itcmd_ja_progressivo: true,
      ipva_desconto_10_porcento: true,
      descricao: "O DF é a ÚNICA UF que acumula competência estadual E municipal. Brasília é a única cidade. Todos os impostos — ICMS, ISS, IPTU, ITBI, IPVA, ITCMD — são cobrados pela mesma Secretaria de Economia. Em 2026, o DF integra IBS/CBS na base do ICMS (diferente de outros estados)."
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  2. ICMS — IMPOSTO SOBRE CIRCULAÇÃO DE MERCADORIAS E SERVIÇOS
  // ═══════════════════════════════════════════════════════════════
  icms: {
    nome_completo: "Imposto sobre Circulação de Mercadorias e Serviços",
    explicacao: "Principal imposto estadual do DF. Alíquota interna geral de 20%. Particularidade 2026: o DF integra os novos tributos IBS (0,1%) e CBS (0,9%) na base de cálculo do ICMS, diferente de estados como SC e SP.",
    base_legal: "Decreto-Lei nº 82/1966, Lei nº 769/1994, RICMS-DF",
    url_lei: "https://www.receita.fazenda.df.gov.br/",
    fato_gerador: "Circulação de mercadorias, prestação de serviços de transporte interestadual e intermunicipal, e serviços de comunicação",
    base_calculo: "Valor da operação (ICMS 'por dentro')",
    aliquota_interna_padrao: 0.20,
    dados_disponiveis: true,

    aliquotas_internas: {
      geral: {
        aliquota: 0.20,
        descricao: "Alíquota padrão para operações internas no DF",
        base_legal: "RICMS-DF"
      },
      energia_eletrica: {
        aliquota: 0.21,
        descricao: "Energia elétrica — alíquota diferenciada",
        observacao: "Pode variar conforme faixa de consumo"
      },
      combustiveis_monofasicos: {
        descricao: "Combustíveis tributados por substituição tributária com valores fixos por unidade",
        gasolina: { valor_por_litro: 1.57, unidade: "R$/litro" },
        diesel: { valor_por_litro: 1.17, unidade: "R$/litro" },
        glp: { valor_por_kg: 1.47, unidade: "R$/kg" },
        sistema: "Substituição tributária — valores específicos 2026"
      },
      cesta_basica: {
        aliquota: 0.12,
        descricao: "Produtos da cesta básica — alíquota reduzida",
        observacao: "Alíquota reduzida para produtos essenciais. Tabela completa por NCM não localizada em fonte pública."
      }
    },

    aliquotas_interestaduais: {
      descricao: "Alíquotas nas operações interestaduais com origem no DF",
      para_sul_sudeste: { aliquota: 0.12, estados: "SP, RJ, MG, ES, PR, SC, RS" },
      para_norte_nordeste_centro_oeste: { aliquota: 0.07, estados: "Demais estados" },
      importados: { aliquota: 0.04, descricao: "Resolução do Senado nº 13/2012 — produtos importados" }
    },

    fecop: {
      aplicavel: false,
      descricao: "O DF NÃO possui FECOP (Fundo Estadual de Combate à Pobreza)"
    },

    substituicao_tributaria: {
      descricao: "DF participa de convênios ST do CONFAZ",
      mva_tabela_completa: false,
      observacao: "MVAs específicos não localizados em fonte pública consolidada. Consultar SEFAZ-DF."
    },

    reforma_tributaria_2026: {
      cbs_teste: 0.009,
      ibs_teste: 0.001,
      total_teste: 0.01,
      integra_base_icms: true,
      descricao: "PARTICULARIDADE DO DF: IBS/CBS integram a base de cálculo do ICMS em 2026 (diferente de SC e SP)",
      exemplo: {
        valor_produto: 100,
        icms_20_porcento: 20.00,
        ibs_cbs_1_porcento: 1.00,
        total_tributo_2026: 21.00,
        observacao: "No DF o total tributário sobre a operação inclui ICMS + IBS/CBS sobre a mesma base"
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  3. IPVA — IMPOSTO SOBRE PROPRIEDADE DE VEÍCULOS AUTOMOTORES
  // ═══════════════════════════════════════════════════════════════
  ipva: {
    nome_completo: "Imposto sobre Propriedade de Veículos Automotores",
    explicacao: "Imposto anual sobre a propriedade de veículos. No DF, alíquota de 3% para carros de passeio (na média nacional). Destaque: desconto de 10% para pagamento em cota única — um dos maiores do Brasil.",
    base_legal: "Decreto-Lei nº 82/1966, Lei nº 769/1994, Portaria nº 923/2025",
    url_consulta: "https://www.receita.fazenda.df.gov.br/",
    fato_gerador: "Propriedade de veículo automotor registrado no DF",
    base_calculo: "Valor venal do veículo conforme tabela FIPE/SEEC-DF",
    dados_disponiveis: true,
    arrecadacao_estimada_2026: 2140000000,
    variacao_media_2026: 0.0172,
    frota_carros: 1220000,

    aliquotas: {
      automoveis_caminhonetes_utilitarios: {
        aliquota: 0.03,
        descricao: "Automóveis, caminhonetes e utilitários (SUVs)"
      },
      motocicletas_ciclomotores: {
        aliquota: 0.02,
        descricao: "Ciclomotores, motocicletas, motonetas, quadriciclos e triciclos"
      },
      carga_pesada: {
        aliquota: 0.01,
        descricao: "Veículos de carga acima de 2.000 kg, caminhões-tratores, micro-ônibus, ônibus e tratores"
      }
    },

    desconto_cota_unica: {
      percentual: 0.10,
      condicao: "Pagamento integral até a data da 1ª parcela. Não pode haver débito de exercícios anteriores.",
      destaque: "UM DOS MAIORES DESCONTOS DO BRASIL (10%)"
    },

    parcelamento: {
      numero_parcelas: 6,
      periodo: "Fevereiro a Julho/2026",
      valor_minimo_parcela: 50,
      valor_minimo_cota_unica: 100,
      regra: "Se IPVA < R$100, pagamento obrigatório em cota única. Se parcelado, cada parcela mínima de R$50."
    },

    calendario_2026: {
      fonte: "Portaria nº 923, publicada no DODF — SEEC-DF",
      cota_unica_e_1a_parcela: [
        { placa_final: "1 e 2", vencimento: "23/02/2026" },
        { placa_final: "3 e 4", vencimento: "24/02/2026" },
        { placa_final: "5 e 6", vencimento: "25/02/2026" },
        { placa_final: "7 e 8", vencimento: "26/02/2026" },
        { placa_final: "9 e 0", vencimento: "27/02/2026" }
      ],
      demais_parcelas: "Mensais consecutivas de março a julho/2026"
    },

    isencoes: [
      { tipo: "Veículos com 15+ anos de fabricação", automatica: true, observacao: "Isenção automática — não é necessário solicitar" },
      { tipo: "Veículos elétricos ou híbridos", automatica: true, observacao: "Isenção vigente no DF" },
      { tipo: "Pessoas com deficiência (PcD)", automatica: false, observacao: "Necessário solicitar junto à SEEC-DF" },
      { tipo: "Veículos de transporte público", automatica: false, observacao: "Táxis e transporte escolar" },
      { tipo: "PEC 20+ anos", automatica: false, observacao: "PEC aprovada para isentar veículos com 20+ anos — promulgação pendente" }
    ],

    pauta_valores_venais: {
      publicacao: "18/12/2025",
      url: "https://mobile.receita.fazenda.df.gov.br/",
      descricao: "Pauta de valores venais dos veículos automotores usados para 2026"
    },

    exemplos: [
      { veiculo: "Carro passeio R$80.000", calculo: "80.000 × 3% = R$2.400", cota_unica: "R$2.160 (desconto 10%)" },
      { veiculo: "Moto R$20.000", calculo: "20.000 × 2% = R$400", cota_unica: "R$360" },
      { veiculo: "Caminhão R$200.000", calculo: "200.000 × 1% = R$2.000", cota_unica: "R$1.800" }
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  4. ITCMD (ITCD no DF) — IMPOSTO TRANSMISSÃO CAUSA MORTIS E DOAÇÃO
  // ═══════════════════════════════════════════════════════════════
  itcmd: {
    nome_completo: "Imposto sobre Transmissão Causa Mortis e Doação (ITCD)",
    explicacao: "O DF JÁ adota alíquotas progressivas para o ITCD — diferente de estados como SP e MG que ainda usavam alíquota fixa até 2025. Faixas atuais: 4%, 5% e 6%. Isenção generosa para causa mortis até R$ 169.015,91.",
    base_legal: "Decreto-Lei nº 82/1966 (arts. específicos), legislação distrital",
    url_consulta: "https://mobile.receita.fazenda.df.gov.br/",
    fato_gerador: "Transmissão causa mortis (herança) e doação de bens e direitos",
    base_calculo: "Valor venal dos bens transmitidos (a partir de 2026: valor de mercado obrigatório, conforme LC 227/2026)",
    dados_disponiveis: true,

    sistema_atual: {
      tipo: "Progressivo — DF JÁ adota progressividade",
      faixas: [
        { faixa: "Até R$ 1.000.000,00", aliquota: 0.04, descricao: "4%" },
        { faixa: "De R$ 1.000.000,01 a R$ 2.000.000,00", aliquota: 0.05, descricao: "5%" },
        { faixa: "Acima de R$ 2.000.000,00", aliquota: 0.06, descricao: "6%" }
      ],
      aliquota_maxima_atual: 0.06,
      teto_senado: 0.08
    },

    sistema_futuro_lc227: {
      tipo: "Progressivo obrigatório — LC 227/2026",
      descricao: "O DF já é progressivo, mas poderá ajustar faixas para atingir teto de 8%. Novas regras exigem base de cálculo pelo valor de mercado.",
      aliquota_maxima_possivel: 0.08,
      base_calculo: "Valor de mercado dos bens (não mais valor histórico ou contábil)",
      por_quinhao: true,
      descricao_quinhao: "Alíquota incide sobre o quinhão individual de cada herdeiro, não sobre o total do espólio"
    },

    isencoes: {
      causa_mortis: {
        limite_2025: 169015.91,
        descricao: "Isenção de ITCD na transmissão causa mortis se o patrimônio total transmitido não ultrapassar R$ 169.015,91 (valor 2025, atualizado anualmente)",
        observacao: "Se o óbito ocorreu antes de 24/01/1997, NÃO há isenção"
      },
      doacao: {
        descricao: "Verificar legislação distrital específica para isenções em doações",
        dados_disponiveis: false
      },
      previdencia: {
        vgbl_pgbl: true,
        descricao: "Planos VGBL/PGBL NÃO são tributados por ITCMD na transmissão causa mortis (conforme LC 227/2026)"
      },
      renuncia_heranca: {
        isento: true,
        descricao: "Renúncia à herança não gera incidência de ITCMD"
      }
    },

    multas: {
      moratoria: "Progressiva conforme atraso",
      punitiva: "Valor fixo conforme conduta prevista em lei",
      juros_mora: "1% ao mês sobre valor corrigido pelo INPC",
      limite_multa: "Vedada multa superior a 100% do valor do tributo (RE 833.106/STF)"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  5. ISS — IMPOSTO SOBRE SERVIÇOS (Brasília — ÚNICA cidade do DF)
  // ═══════════════════════════════════════════════════════════════
  iss: {
    nome_completo: "Imposto sobre Serviços de Qualquer Natureza (ISSQN)",
    explicacao: "No DF, o ISS é cobrado pela SEFAZ-DF (não por prefeitura, pois Brasília é a única cidade). Alíquota padrão de 5%, com redução para 2% em serviços específicos e 3% para hotelaria. O DF foi PIONEIRO na redução de ISS para serviços de TI.",
    base_legal: "Decreto-Lei nº 82/1966, art. 93; Decreto nº 25.508/2005 (RISS-DF); Lei nº 3.269/2003; LC nº 994/2021",
    url_consulta: "https://www.receita.fazenda.df.gov.br/",
    fato_gerador: "Prestação de serviços constantes da lista anexa à LC 116/2003",
    base_calculo: "Preço do serviço (ISS está incluído na base — 'por dentro')",
    aliquota_minima: 0.02,
    aliquota_maxima: 0.05,
    dados_disponiveis: true,

    aliquotas: {
      padrao: {
        aliquota: 0.05,
        descricao: "5% — para todos os serviços não listados nas alíquotas reduzidas",
        base_legal: "Art. 93, III (inciso II do art. 38 do RISS)"
      },
      reduzida_2_porcento: {
        aliquota: 0.02,
        descricao: "2% — serviços específicos listados no art. 93, I do DL 82/1966",
        base_legal: "Art. 93, I, do DL 82/1966; Lei nº 3.269/2003; Decreto 25.508/2005, art. 38",
        servicos: [
          { subitem: "1.03", descricao: "Projeto, planejamento, implantação e manutenção de redes de comunicação de dados" },
          { subitem: "1.04", descricao: "Elaboração de programas de computadores, inclusive jogos eletrônicos" },
          { subitem: "1.05", descricao: "Licenciamento ou cessão de uso de programas de computação" },
          { subitem: "1.07", descricao: "Manutenção de programas de computação e bancos de dados" },
          { subitem: "4.xx", descricao: "Serviços de saúde, medicina e assistência veterinária (item 4 completo)" },
          { subitem: "6.04", descricao: "Ginástica, dança, musculação, natação, artes marciais e afins" },
          { subitem: "7.02", descricao: "Construção civil — execução de obras" },
          { subitem: "7.03", descricao: "Elaboração de planos diretores, estudos de viabilidade" },
          { subitem: "7.04", descricao: "Demolição" },
          { subitem: "7.05", descricao: "Reparação, conservação de edifícios, rodovias, pontes" },
          { subitem: "7.17", descricao: "Colocação e instalação de tapetes, cortinas" },
          { subitem: "7.19", descricao: "Acompanhamento de execução de obras" },
          { subitem: "8.xx", descricao: "Serviços de educação, ensino e treinamento (item 8 completo)" },
          { subitem: "10.05", descricao: "Agenciamento de bens ou valores mobiliários" },
          { subitem: "10.09", descricao: "Representação de qualquer natureza" },
          { subitem: "10.10", descricao: "Distribuição de bens" },
          { subitem: "11.05", descricao: "Não especificado (alíquota 2% — LC 1014/2022)" },
          { subitem: "14.07", descricao: "Fotografias e cinematografia" },
          { subitem: "14.08", descricao: "Produção de eventos, shows e congêneres" },
          { subitem: "15.01", descricao: "Administração de cartão de crédito/débito (exclusivamente)" },
          { subitem: "15.09", descricao: "Arrendamento mercantil (leasing) de bens móveis" },
          { subitem: "16.01", descricao: "Transporte público coletivo (concessão/permissão)" },
          { subitem: "17.08", descricao: "Franquia (franchising)" },
          { subitem: "17.24", descricao: "Apresentação de espetáculos e congêneres" }
        ]
      },
      hotelaria_3_porcento: {
        aliquota: 0.03,
        descricao: "3% — serviços de hotelaria (a partir de 01/01/2022)",
        base_legal: "LC nº 994/2021, incluiu inciso I-A no art. 93 do DL 82/1966",
        servicos: [
          { cnae: "5510-8/01-00", descricao: "Hotéis" },
          { cnae: "5590-6/01-00", descricao: "Albergues (exceto assistenciais)" }
        ]
      }
    },

    retencao_na_fonte: {
      construcao_civil: {
        aliquota_retencao: 0.01,
        descricao: "Para subitens 7.02 e 7.05, a retenção na fonte é de 1% (menor que a alíquota de 2%)",
        observacao: "O prestador ajusta na apuração normal do ISS"
      },
      demais_servicos: {
        descricao: "Retenção conforme alíquota do serviço, quando aplicável"
      }
    },

    empresas_tecnologia: {
      descricao: "Empresas de TI no DF pagam ISS de apenas 2% — um dos menores do Brasil para o setor",
      beneficio: "Aplica-se independentemente do regime tributário (Simples Nacional, Lucro Presumido ou Real)"
    },

    reforma_tributaria_2026: {
      descricao: "ISS será gradualmente substituído por IBS a partir de 2027",
      ibs_teste_2026: 0.001,
      impacto: "Redução gradual do ISS de 2027 a 2032, extinção em 2033"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  6. IPTU — IMPOSTO PREDIAL E TERRITORIAL URBANO
  // ═══════════════════════════════════════════════════════════════
  iptu: {
    nome_completo: "Imposto Predial e Territorial Urbano",
    explicacao: "Cobrado pela SEFAZ-DF sobre imóveis localizados no Distrito Federal. Alíquotas diferenciadas por tipo de imóvel. Variação média de 5,1% para 2026. Arrecadação estimada: R$ 1,39 bilhão.",
    base_legal: "Decreto-Lei nº 82/1966, legislação distrital",
    url_consulta: "https://mobile.receita.fazenda.df.gov.br/",
    fato_gerador: "Propriedade de imóvel urbano no DF em 1º de janeiro do exercício",
    base_calculo: "Valor venal do imóvel (terreno + edificação) conforme pauta SEFAZ-DF",
    dados_disponiveis: true,
    arrecadacao_estimada_2026: 1390000000,
    variacao_media_2026: 0.051,

    aliquotas: {
      residencial_edificado: {
        aliquota: 0.003,
        descricao: "0,3% — imóvel residencial edificado"
      },
      comercial_edificado: {
        aliquota: 0.01,
        descricao: "1% — imóvel comercial edificado"
      },
      nao_edificado: {
        aliquota: 0.03,
        descricao: "3% — terreno não edificado (caráter extrafiscal para combater especulação)"
      }
    },

    pauta_valores_venais: {
      publicacao: "18/12/2025",
      url: "https://mobile.receita.fazenda.df.gov.br/aplicacoes/informativos/detalharMobile.cfm?codInformativo=1921",
      componentes: ["Valor do terreno por m²", "Valor do metro quadrado construído"]
    },

    isencoes: [
      { tipo: "Aposentado/Pensionista/Beneficiário assistência idoso", condicao: "Necessário solicitar isenção junto à SEFAZ-DF", automatica: false },
      { tipo: "Imóveis de embaixadas e consulados", condicao: "Reciprocidade de tratamento ao governo brasileiro", automatica: true },
      { tipo: "Clubes sociais e esportivos", condicao: "Imóveis edificados destinados a sedes sociais/esportivas", automatica: false }
    ],

    tlp: {
      nome: "Taxa de Limpeza Pública",
      descricao: "Cobrada conjuntamente com o IPTU",
      valor: "DADO NÃO LOCALIZADO em fonte pública"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  7. ITBI — IMPOSTO TRANSMISSÃO DE BENS IMÓVEIS
  // ═══════════════════════════════════════════════════════════════
  itbi: {
    nome_completo: "Imposto sobre Transmissão Inter Vivos de Bens Imóveis",
    explicacao: "Cobrado na transmissão onerosa de imóveis entre pessoas vivas (compra e venda). MUDANÇA CRÍTICA em 2026: base de cálculo passa a ser o valor real de mercado (não mais o valor venal do IPTU). CIB (Cadastro Imobiliário Brasileiro) implementado em 2026.",
    base_legal: "Decreto-Lei nº 82/1966, Lei nº 769/1994",
    fato_gerador: "Transmissão inter vivos, a qualquer título por ato oneroso, de bens imóveis e direitos reais sobre imóveis",
    dados_disponiveis: "parcial",

    aliquotas: {
      primeira_transferencia_novo: {
        aliquota: 0.01,
        descricao: "1% — primeira transferência de imóvel novo (verificar legislação vigente para valor exato)"
      },
      outras_transferencias: {
        aliquota: null,
        descricao: "DADO NÃO LOCALIZADO — alíquota para transmissões que não sejam primeira de imóvel novo. Consultar SEFAZ-DF.",
        observacao: "Comum no Brasil: 2% a 3% para demais transmissões"
      }
    },

    mudanca_2026: {
      descricao: "MUDANÇA CRÍTICA A PARTIR DE 2026",
      antes_2026: "Base de cálculo era o valor venal do IPTU",
      a_partir_2026: "Base de cálculo é o valor real de mercado do imóvel (valor declarado, contestável pelo fisco via processo administrativo)",
      impacto: "Pode aumentar significativamente o valor do ITBI, pois valor de mercado é geralmente SUPERIOR ao valor venal do IPTU",
      fonte: "Correio Braziliense 04/12/2025, PLP 108/2024"
    },

    cib_2026: {
      nome: "Cadastro Imobiliário Brasileiro",
      descricao: "Código único para cada imóvel no Brasil (como CPF para propriedades)",
      implementacao: "Janeiro/2026 — cartórios, órgãos federais e capitais/DF",
      impacto: "Cruzamento de dados entre municípios e entes federais. Diferenças expressivas entre valores declarados e de mercado gerarão alertas automáticos."
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  8. TAXAS DISTRITAIS
  // ═══════════════════════════════════════════════════════════════
  taxas: {
    descricao: "Taxas cobradas pelo Governo do Distrito Federal",
    tlp: {
      nome: "Taxa de Limpeza Pública",
      cobrada_com: "IPTU",
      valor: "DADO NÃO LOCALIZADO"
    },
    detran_df: {
      nome: "Taxas do DETRAN-DF",
      descricao: "Licenciamento, transferência, emplacamento etc.",
      url: "https://www.detran.df.gov.br/",
      valores: "DADO NÃO LOCALIZADO em fonte pública consolidada"
    },
    observacao: "Para valores atualizados das taxas distritais, consultar a SEFAZ-DF ou o DETRAN-DF."
  },

  // ═══════════════════════════════════════════════════════════════
  //  9. IMPOSTOS FEDERAIS (aplicáveis no DF)
  // ═══════════════════════════════════════════════════════════════
  federal: {
    irpj: {
      nome: "Imposto de Renda Pessoa Jurídica",
      lucro_real: { aliquota: 0.15, adicional_acima_20k: 0.10, aliquota_maxima: 0.25 },
      lucro_presumido: {
        aliquota: 0.15,
        adicional_acima_20k: 0.10,
        percentuais_presuncao: { comercio: 0.08, industria: 0.08, servicos: 0.32, transporte_cargas: 0.08, transporte_passageiros: 0.16, servicos_gerais: 0.32 }
      }
    },
    irpf: {
      nome: "Imposto de Renda Pessoa Física",
      tabela_mensal_2026: [
        { faixa: 1, ate: 2112.00, aliquota: 0, deducao: 0, descricao: "Isento" },
        { faixa: 2, de: 2112.01, ate: 2826.65, aliquota: 0.075, deducao: 158.40 },
        { faixa: 3, de: 2826.66, ate: 3751.05, aliquota: 0.15, deducao: 370.40 },
        { faixa: 4, de: 3751.06, ate: 4664.68, aliquota: 0.225, deducao: 651.73 },
        { faixa: 5, de: 4664.69, ate: Infinity, aliquota: 0.275, deducao: 884.96 }
      ],
      deducao_simplificada: 564.80,
      descricao: "Tabela progressiva mensal do IRPF 2026. Desconto simplificado de R$564,80 aplicável até o limite da faixa de isenção."
    },
    csll: {
      nome: "Contribuição Social sobre o Lucro Líquido",
      aliquota_geral: 0.09,
      base_calculo: "Lucro líquido (Lucro Real) ou percentual da receita (Lucro Presumido)"
    },
    pis: {
      nome: "PIS/PASEP",
      lucro_real: { aliquota: 0.0165, tipo: "Não cumulativo" },
      lucro_presumido: { aliquota: 0.0065, tipo: "Cumulativo" }
    },
    cofins: {
      nome: "COFINS",
      lucro_real: { aliquota: 0.076, tipo: "Não cumulativo" },
      lucro_presumido: { aliquota: 0.03, tipo: "Cumulativo" }
    },
    ipi: {
      nome: "Imposto sobre Produtos Industrializados",
      aliquota: "Variável por produto (TIPI)",
      reforma_2026: "Alíquotas em redução gradual até extinção em 2033"
    },
    iof: {
      nome: "Imposto sobre Operações Financeiras",
      descricao: "Incide sobre crédito, câmbio, seguros e títulos/valores mobiliários"
    },
    ii: { nome: "Imposto de Importação", descricao: "Incide na importação de produtos estrangeiros" },
    ie: { nome: "Imposto de Exportação", descricao: "Incide na exportação de produtos nacionais ou nacionalizados" },
    itr: { nome: "Imposto sobre Propriedade Territorial Rural", descricao: "Incide sobre propriedades rurais. No DF, área rural é limitada." },
    inss: {
      nome: "Contribuição Previdenciária",
      empregador: { aliquota_base: 0.20, rat: "0,5% a 3%", fap: "0,5 a 2,0", descricao: "20% sobre folha + RAT × FAP" },
      empregado: {
        tabela_2026: [
          { faixa: 1, ate: 1518.00, aliquota: 0.075 },
          { faixa: 2, de: 1518.01, ate: 2793.88, aliquota: 0.09 },
          { faixa: 3, de: 2793.89, ate: 4190.83, aliquota: 0.12 },
          { faixa: 4, de: 4190.84, ate: 8157.41, aliquota: 0.14 }
        ],
        teto: 8157.41,
        contribuicao_maxima: 951.63,
        descricao: "Tabela progressiva — cada faixa aplica-se apenas à parcela do salário dentro dela"
      }
    },
    fgts: {
      nome: "Fundo de Garantia do Tempo de Serviço",
      aliquota: 0.08,
      descricao: "8% sobre remuneração bruta, depositado em conta vinculada do empregado"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  10. SIMPLES NACIONAL
  // ═══════════════════════════════════════════════════════════════
  simples_nacional: {
    descricao: "Regime tributário simplificado para micro e pequenas empresas",
    sublimite_icms_iss: 3600000,
    limite_total: 4800000,
    impostos_unificados: ["IRPJ", "CSLL", "PIS", "COFINS", "IPI", "CPP", "ICMS", "ISS"],

    mei: {
      faturamento_maximo_anual: 81000,
      das_mensal_2026: {
        comercio_industria: { valor: 82.05, composicao: "R$ 81,05 INSS + R$ 1,00 ICMS" },
        servicos: { valor: 82.05, composicao: "R$ 81,05 INSS + R$ 1,00 ISS" },
        comercio_e_servicos: { valor: 83.05, composicao: "R$ 81,05 INSS + R$ 1,00 ICMS + R$ 1,00 ISS" }
      }
    },

    anexos: {
      anexo_i: {
        atividades: "Comércio",
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
        atividades: "Indústria",
        faixas: [
          { faixa: 1, ate: 180000, aliquota: 0.045, deducao: 0 },
          { faixa: 2, ate: 360000, aliquota: 0.078, deducao: 5940 },
          { faixa: 3, ate: 720000, aliquota: 0.10, deducao: 13860 },
          { faixa: 4, ate: 1800000, aliquota: 0.112, deducao: 22500 },
          { faixa: 5, ate: 3600000, aliquota: 0.147, deducao: 87300 },
          { faixa: 6, ate: 4800000, aliquota: 0.30, deducao: 540000 }
        ]
      },
      anexo_iii: {
        atividades: "Serviços (Fator R ≥ 28%): instalação, reparação, locação de bens, contabilidade",
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
        atividades: "Serviços: advocacia, engenharia, medicina, odontologia",
        faixas: [
          { faixa: 1, ate: 180000, aliquota: 0.045, deducao: 0 },
          { faixa: 2, ate: 360000, aliquota: 0.09, deducao: 8100 },
          { faixa: 3, ate: 720000, aliquota: 0.102, deducao: 12420 },
          { faixa: 4, ate: 1800000, aliquota: 0.14, deducao: 39780 },
          { faixa: 5, ate: 3600000, aliquota: 0.22, deducao: 183780 },
          { faixa: 6, ate: 4800000, aliquota: 0.33, deducao: 828000 }
        ]
      },
      anexo_v: {
        atividades: "Serviços (Fator R < 28%): consultoria, intermediação, auditoria",
        faixas: [
          { faixa: 1, ate: 180000, aliquota: 0.155, deducao: 0 },
          { faixa: 2, ate: 360000, aliquota: 0.18, deducao: 4500 },
          { faixa: 3, ate: 720000, aliquota: 0.195, deducao: 9900 },
          { faixa: 4, ate: 1800000, aliquota: 0.205, deducao: 17100 },
          { faixa: 5, ate: 3600000, aliquota: 0.23, deducao: 62100 },
          { faixa: 6, ate: 4800000, aliquota: 0.305, deducao: 540000 }
        ]
      }
    },

    fator_r: {
      descricao: "Fator R = Folha de salários (12 meses) / Receita Bruta (12 meses)",
      limite: 0.28,
      regra: "Se Fator R ≥ 28% → Anexo III (mais favorável). Se < 28% → Anexo V (mais oneroso)."
    },

    particularidades_df: {
      descricao: "No DF, como acumula competência estadual e municipal, ICMS e ISS são cobrados pela mesma secretaria. Isso simplifica obrigações acessórias para empresas do Simples.",
      iss_ti_2_porcento: true,
      observacao: "Empresas de TI no Simples ainda se beneficiam da alíquota de ISS de 2% do DF quando excedem o sublimite"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  11. INCENTIVOS FISCAIS E BENEFÍCIOS
  // ═══════════════════════════════════════════════════════════════
  incentivos: {
    descricao: "Incentivos e benefícios fiscais no DF",

    iss_reduzido_ti: {
      nome: "ISS reduzido para TI",
      beneficio: "Alíquota de 2% para serviços de TI (vs. 5% padrão)",
      subitens_lc116: ["1.03", "1.04", "1.05", "1.07"],
      economia: "60% de redução na alíquota"
    },

    iss_reduzido_hotelaria: {
      nome: "ISS reduzido para hotelaria",
      beneficio: "Alíquota de 3% para hotéis e albergues (vs. 5% padrão)",
      base_legal: "LC nº 994/2021",
      economia: "40% de redução na alíquota"
    },

    ipva_desconto_cota_unica: {
      nome: "Desconto IPVA cota única",
      beneficio: "10% de desconto para pagamento à vista sem débitos anteriores",
      destaque: "Um dos maiores descontos do Brasil"
    },

    ipva_isencao_eletricos: {
      nome: "Isenção IPVA veículos elétricos/híbridos",
      beneficio: "Isenção total de IPVA para veículos elétricos e híbridos no DF"
    },

    itcmd_isencao_generosa: {
      nome: "Isenção ITCMD causa mortis",
      beneficio: "Patrimônio até R$ 169.015,91 isento de ITCD (um dos maiores limites do Brasil)"
    },

    nota_legal: {
      nome: "Programa Nota Legal",
      descricao: "Programa de incentivo à emissão de nota fiscal. Contribuintes podem obter créditos e participar de sorteios.",
      url: "https://www.notalegal.df.gov.br/"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  12. REFORMA TRIBUTÁRIA
  // ═══════════════════════════════════════════════════════════════
  reforma_tributaria: {
    cronograma: {
      "2026": {
        fase: "Testes",
        cbs: "0,9% (teste — substitui PIS/COFINS)",
        ibs: "0,1% (teste — substitui ICMS/ISS)",
        total_teste: "1%",
        icms: "20% (mantém integral)",
        iss: "2%-5% (mantém integral)",
        particularidade_df: "DF integra IBS/CBS na base do ICMS — total tributo sobre consumo pode chegar a 21% em operações internas"
      },
      "2027": {
        fase: "Início da transição",
        cbs: "Alíquota efetiva (substitui PIS/COFINS)",
        ibs: "Alíquota a definir",
        icms: "Início da redução gradual",
        iss: "Início da redução gradual"
      },
      "2028_2032": {
        fase: "Transição gradual",
        descricao: "ICMS e ISS reduzem anualmente enquanto IBS aumenta proporcionalmente"
      },
      "2033": {
        fase: "Conclusão",
        icms: "Extinto",
        iss: "Extinto",
        ibs: "Vigente (competência compartilhada estados/municípios/DF)",
        cbs: "Vigente (competência federal)"
      }
    },

    impacto_df: {
      descricao: "O DF é um caso ÚNICO na reforma tributária: como acumula competência estadual e municipal, a transição é mais simples do que em outros estados (que precisam coordenar com milhares de municípios). Porém, a integração de IBS/CBS na base do ICMS em 2026 aumenta a carga efetiva sobre o consumo.",
      cib: "DF é um dos primeiros a implementar o CIB (Cadastro Imobiliário Brasileiro) em 2026",
      itcmd: "DF já tem progressividade no ITCMD — transição menos abrupta que SP/MG"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  13. DADOS DE COBERTURA
  // ═══════════════════════════════════════════════════════════════
  cobertura: {
    versao: "3.0",
    data_atualizacao: "2026-02-10",
    localizados: [
      { item: "ICMS alíquota geral", valor: "20%", fonte: "SEFAZ-DF", status: "verificado" },
      { item: "ICMS combustíveis monofásicos", valor: "Gasolina R$1,57/L, Diesel R$1,17/L, GLP R$1,47/kg", fonte: "SEFAZ-DF", status: "verificado" },
      { item: "IBS/CBS integração ICMS", valor: "1% (0,9% CBS + 0,1% IBS)", fonte: "LC 227/2026", status: "verificado" },
      { item: "IPVA carros", valor: "3%", fonte: "SEFAZ-DF, Portaria 923/2025", status: "verificado" },
      { item: "IPVA motos", valor: "2%", fonte: "SEFAZ-DF", status: "verificado" },
      { item: "IPVA carga pesada", valor: "1%", fonte: "SEFAZ-DF", status: "verificado" },
      { item: "IPVA desconto cota única", valor: "10%", fonte: "SEFAZ-DF, Correio Braziliense", status: "verificado" },
      { item: "IPVA parcelamento", valor: "6 parcelas (fev-jul)", fonte: "Portaria 923/2025", status: "verificado" },
      { item: "IPVA isenção 15+ anos", valor: "Isento", fonte: "SEFAZ-DF", status: "verificado" },
      { item: "IPVA isenção elétricos/híbridos", valor: "Isento", fonte: "Gazeta do Povo", status: "verificado" },
      { item: "IPVA calendário 2026", valor: "23-27/fev conforme placa", fonte: "Portaria 923/2025", status: "verificado" },
      { item: "IPVA variação 2026", valor: "1,72% média", fonte: "SEFAZ-DF", status: "verificado" },
      { item: "IPVA arrecadação estimada", valor: "R$ 2,14 bilhões", fonte: "SEFAZ-DF", status: "verificado" },
      { item: "ITCMD faixas progressivas", valor: "4% até R$1M, 5% R$1M-R$2M, 6% acima R$2M", fonte: "Migalhas, CLM Controller", status: "verificado" },
      { item: "ITCMD isenção causa mortis", valor: "R$ 169.015,91", fonte: "SEFAZ-DF (portal serviços)", status: "verificado" },
      { item: "ISS alíquota padrão", valor: "5%", fonte: "Art. 93 DL 82/1966", status: "verificado" },
      { item: "ISS alíquota reduzida", valor: "2% para serviços listados", fonte: "Art. 93, I, DL 82/1966; Decreto 25.508/2005", status: "verificado" },
      { item: "ISS hotelaria", valor: "3%", fonte: "LC 994/2021", status: "verificado" },
      { item: "IPTU residencial", valor: "0,3%", fonte: "SEFAZ-DF", status: "verificado" },
      { item: "IPTU comercial", valor: "1%", fonte: "SEFAZ-DF", status: "verificado" },
      { item: "IPTU terreno", valor: "3%", fonte: "SEFAZ-DF", status: "verificado" },
      { item: "IPTU variação 2026", valor: "5,1% média", fonte: "SEFAZ-DF", status: "verificado" },
      { item: "IPTU arrecadação estimada", valor: "R$ 1,39 bilhão", fonte: "SEFAZ-DF", status: "verificado" },
      { item: "ITBI primeira transferência", valor: "1%", fonte: "Documento de pesquisa", status: "parcial" },
      { item: "ITBI mudança base cálculo 2026", valor: "Valor de mercado", fonte: "PLP 108/2024", status: "verificado" }
    ],

    nao_localizados: [
      { item: "Tabela completa ICMS por NCM/produto no DF", contato: "SEFAZ-DF" },
      { item: "MVAs para substituição tributária no DF", contato: "SEFAZ-DF" },
      { item: "ITBI alíquota para transferências que não primeira de imóvel novo", contato: "SEFAZ-DF" },
      { item: "TLP (Taxa de Limpeza Pública) valor", contato: "SEFAZ-DF" },
      { item: "Taxas DETRAN-DF valores", contato: "DETRAN-DF" },
      { item: "ITCMD isenção doações limite específico DF", contato: "SEFAZ-DF" }
    ],

    contatos: {
      sefaz_df: "https://www.economia.df.gov.br/",
      receita_df: "https://www.receita.fazenda.df.gov.br/",
      detran_df: "https://www.detran.df.gov.br/",
      receita_federal: "https://www.receita.federal.gov.br/"
    }
  }
};


// ═══════════════════════════════════════════════════════════════════════════
//  14. FUNÇÕES UTILITÁRIAS — DISTRITO FEDERAL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Retorna a alíquota de ISS para um tipo de serviço em Brasília/DF
 * @param {string} tipo - Tipo de serviço: "ti", "saude", "educacao", "construcao", "hotelaria", "geral", etc.
 * @returns {object} { aliquota, descricao }
 */
function getISSDistritoFederal(tipo) {
  const t = (tipo || "").toLowerCase().trim();
  const mapa2 = ["ti", "tecnologia", "software", "programacao", "computacao", "saude", "medicina", "veterinaria", "educacao", "ensino", "treinamento", "construcao", "civil", "demolição", "obra", "academia", "ginastica", "danca", "cartao_credito", "leasing", "franquia", "show", "espetaculo", "fotografia", "cinematografia", "transporte_publico"];
  const mapa3 = ["hotelaria", "hotel", "albergue", "hospedagem"];

  if (mapa3.some(k => t.includes(k))) return { aliquota: 0.03, descricao: "3% — Hotelaria (LC 994/2021)" };
  if (mapa2.some(k => t.includes(k))) return { aliquota: 0.02, descricao: "2% — Serviço com alíquota reduzida (DL 82/1966, art. 93, I)" };
  return { aliquota: 0.05, descricao: "5% — Alíquota padrão (DL 82/1966, art. 93, III)" };
}

/**
 * Retorna a alíquota de IPVA por tipo de veículo no DF
 * @param {string} tipo - "carro", "moto", "caminhao", "onibus", "utilitario"
 * @returns {object} { aliquota, descricao }
 */
function getIPVADistritoFederal(tipo) {
  const t = (tipo || "").toLowerCase().trim();
  if (["caminhao", "caminhão", "onibus", "ônibus", "micro_onibus", "trator", "carga"].some(k => t.includes(k))) {
    return { aliquota: 0.01, descricao: "1% — Veículos de carga acima de 2.000 kg, caminhões, ônibus, tratores" };
  }
  if (["moto", "motocicleta", "ciclomotor", "motoneta", "quadriciclo", "triciclo"].some(k => t.includes(k))) {
    return { aliquota: 0.02, descricao: "2% — Motocicletas, ciclomotores, triciclos e quadriciclos" };
  }
  return { aliquota: 0.03, descricao: "3% — Automóveis, caminhonetes e utilitários" };
}

/**
 * Calcula o IPVA no DF
 * @param {number} valorVenal - Valor venal do veículo (tabela FIPE)
 * @param {string} tipo - "carro", "moto", "caminhao" etc.
 * @param {number} anoFabricacao - Ano de fabricação do veículo
 * @param {object} opcoes - { cotaUnica: boolean, pcd: boolean, eletrico: boolean }
 * @returns {object} Resultado detalhado do cálculo
 */
function calcularIPVADistritoFederal(valorVenal, tipo, anoFabricacao, opcoes = {}) {
  const anoAtual = 2026;
  const idade = anoAtual - anoFabricacao;

  // Isenções
  if (opcoes.pcd) return { valor: 0, isento: true, motivo: "Pessoa com deficiência — isento", aliquota: 0 };
  if (opcoes.eletrico || opcoes.hibrido) return { valor: 0, isento: true, motivo: "Veículo elétrico/híbrido — isento no DF", aliquota: 0 };
  if (idade >= 15) return { valor: 0, isento: true, motivo: `Veículo com ${idade} anos (15+ anos) — isento`, aliquota: 0 };

  const info = getIPVADistritoFederal(tipo);
  const valorBruto = valorVenal * info.aliquota;

  if (opcoes.cotaUnica) {
    const desconto = valorBruto * 0.10;
    return {
      valor: Math.round((valorBruto - desconto) * 100) / 100,
      valor_sem_desconto: Math.round(valorBruto * 100) / 100,
      desconto: Math.round(desconto * 100) / 100,
      percentual_desconto: 10,
      isento: false,
      aliquota: info.aliquota,
      descricao: info.descricao,
      forma_pagamento: "Cota única com 10% de desconto"
    };
  }

  // Parcelamento
  const numParcelas = Math.min(6, Math.max(1, Math.floor(valorBruto / 50)));
  const valorParcela = Math.round((valorBruto / numParcelas) * 100) / 100;

  return {
    valor: Math.round(valorBruto * 100) / 100,
    isento: false,
    aliquota: info.aliquota,
    descricao: info.descricao,
    parcelamento: {
      numero_parcelas: numParcelas,
      valor_parcela: valorParcela,
      periodo: "Fevereiro a Julho/2026"
    },
    economia_cota_unica: Math.round(valorBruto * 0.10 * 100) / 100,
    forma_pagamento: `Parcelado em ${numParcelas}x de R$ ${valorParcela.toFixed(2)}`
  };
}

/**
 * Calcula ITCMD (ITCD) no DF
 * @param {number} valor - Valor do quinhão/doação
 * @param {string} tipo - "causa_mortis" ou "doacao"
 * @returns {object} Resultado do cálculo
 */
function calcularITCMDDistritoFederal(valor, tipo = "causa_mortis") {
  // Verificar isenção de causa mortis
  if (tipo === "causa_mortis" && valor <= 169015.91) {
    return {
      valor: 0,
      isento: true,
      motivo: `Patrimônio de R$ ${valor.toLocaleString('pt-BR')} abaixo do limite de isenção (R$ 169.015,91)`,
      aliquota_efetiva: 0
    };
  }

  // Cálculo progressivo por faixas
  let imposto = 0;
  const faixas = [
    { limite: 1000000, aliquota: 0.04 },
    { limite: 2000000, aliquota: 0.05 },
    { limite: Infinity, aliquota: 0.06 }
  ];

  let restante = valor;
  let limiteAnterior = 0;
  const detalhamento = [];

  for (const faixa of faixas) {
    if (restante <= 0) break;
    const baseNaFaixa = Math.min(restante, faixa.limite - limiteAnterior);
    const impostoNaFaixa = baseNaFaixa * faixa.aliquota;
    imposto += impostoNaFaixa;
    detalhamento.push({
      faixa: `${limiteAnterior > 0 ? 'R$ ' + limiteAnterior.toLocaleString('pt-BR') : 'R$ 0'} a R$ ${faixa.limite === Infinity ? '∞' : faixa.limite.toLocaleString('pt-BR')}`,
      base: Math.round(baseNaFaixa * 100) / 100,
      aliquota: faixa.aliquota,
      imposto: Math.round(impostoNaFaixa * 100) / 100
    });
    restante -= baseNaFaixa;
    limiteAnterior = faixa.limite;
  }

  return {
    valor: Math.round(imposto * 100) / 100,
    isento: false,
    tipo: tipo,
    aliquota_efetiva: Math.round((imposto / valor) * 10000) / 10000,
    aliquota_efetiva_percentual: (Math.round((imposto / valor) * 10000) / 100).toFixed(2) + "%",
    detalhamento: detalhamento,
    observacao: "Cálculo progressivo por faixas (DF já adota progressividade)"
  };
}

/**
 * Calcula DIFAL para operações interestaduais com destino ao DF
 * @param {string} origem - UF de origem ("SP", "MG", "BA", etc.)
 * @param {number} valor - Valor da operação
 * @returns {object} Resultado do DIFAL
 */
function calcularDIFALDistritoFederal(origem, valor) {
  const origemUpper = (origem || "").toUpperCase().trim();
  const sulSudeste = ["SP", "RJ", "MG", "ES", "PR", "SC", "RS"];
  const aliquotaInterestadual = sulSudeste.includes(origemUpper) ? 0.12 : 0.07;
  const aliquotaInternaDF = 0.20;
  const diferencial = aliquotaInternaDF - aliquotaInterestadual;
  const valorDifal = valor * diferencial;

  return {
    aliquota_interestadual: aliquotaInterestadual,
    aliquota_interna_df: aliquotaInternaDF,
    diferencial: diferencial,
    diferencial_percentual: (diferencial * 100).toFixed(1) + "%",
    valor_difal: Math.round(valorDifal * 100) / 100,
    origem: origemUpper,
    observacao: `DIFAL ${origemUpper}→DF: ${(aliquotaInternaDF * 100)}% - ${(aliquotaInterestadual * 100)}% = ${(diferencial * 100).toFixed(1)}%`
  };
}

/**
 * Calcula ICMS "por dentro" no DF
 * @param {number} valor - Valor da operação
 * @param {string} tipo - "geral", "energia", "cesta_basica"
 * @returns {object} Resultado do cálculo
 */
function calcularICMSDistritoFederal(valor, tipo = "geral") {
  const aliquotas = {
    geral: 0.20,
    energia: 0.21,
    cesta_basica: 0.12
  };
  const aliquota = aliquotas.hasOwnProperty(tipo) ? aliquotas[tipo] : 0.20;
  const icms = valor * aliquota / (1 - aliquota);

  return {
    valor_icms: Math.round(icms * 100) / 100,
    aliquota: aliquota,
    aliquota_percentual: (aliquota * 100).toFixed(1) + "%",
    base_calculo: Math.round((valor + icms) * 100) / 100,
    tipo: tipo,
    metodo: "ICMS por dentro"
  };
}

/**
 * Calcula Simples Nacional no DF
 * @param {number|string} anexo - Número do anexo (1-5) ou "I", "II", etc.
 * @param {number} rbt12 - Receita Bruta dos últimos 12 meses
 * @param {number} faturamentoMes - Faturamento do mês atual
 * @returns {object} Resultado do cálculo
 */
function calcularSimplesNacionalDistritoFederal(anexo, rbt12, faturamentoMes) {
  const anexoMap = { "I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 };
  const anexoNum = anexoMap[anexo];
  if (!anexoNum) return { erro: "Anexo inválido. Use 1-5 ou 'I'-'V'." };
  if (rbt12 > 4800000) return { erro: "Receita bruta acima de R$ 4.800.000 — não se enquadra no Simples Nacional." };

  const sublimite = 3600000;
  const alertaSublimite = rbt12 > sublimite;

  const faixas = DISTRITO_FEDERAL_TRIBUTARIO.simples_nacional.anexos[`anexo_${["", "i", "ii", "iii", "iv", "v"][anexoNum]}`].faixas;
  let faixaEncontrada = null;
  for (const f of faixas) {
    if (rbt12 <= f.ate) { faixaEncontrada = f; break; }
  }
  if (!faixaEncontrada) return { erro: "Faixa não encontrada para o faturamento informado." };

  const aliquotaEfetiva = (rbt12 * faixaEncontrada.aliquota - faixaEncontrada.deducao) / rbt12;
  const das = faturamentoMes * aliquotaEfetiva;

  return {
    anexo: `Anexo ${["", "I", "II", "III", "IV", "V"][anexoNum]}`,
    rbt12: rbt12,
    faturamento_mes: faturamentoMes,
    faixa: faixaEncontrada.faixa,
    aliquota_nominal: faixaEncontrada.aliquota,
    aliquota_efetiva: Math.round(aliquotaEfetiva * 10000) / 10000,
    aliquota_efetiva_percentual: (Math.round(aliquotaEfetiva * 10000) / 100).toFixed(2) + "%",
    das_mensal: Math.round(das * 100) / 100,
    alerta_sublimite: alertaSublimite ? `ATENÇÃO: RBT12 de R$ ${rbt12.toLocaleString('pt-BR')} excede sublimite de R$ 3.600.000. ICMS e ISS devem ser recolhidos por fora do DAS.` : null
  };
}

/**
 * Calcula IRPF mensal
 * @param {number} rendaMensal - Renda mensal bruta
 * @returns {object} Resultado do cálculo
 */
function calcularIRPFDistritoFederal(rendaMensal) {
  const tabela = DISTRITO_FEDERAL_TRIBUTARIO.federal.irpf.tabela_mensal_2026;
  const deducaoSimplificada = DISTRITO_FEDERAL_TRIBUTARIO.federal.irpf.deducao_simplificada;

  // Aplica desconto simplificado
  const baseCalculo = Math.max(0, rendaMensal - deducaoSimplificada);

  if (baseCalculo <= tabela[0].ate) {
    return { renda_mensal: rendaMensal, base_calculo: baseCalculo, irpf: 0, aliquota_efetiva: "0%", isento: true };
  }

  let irpf = 0;
  let faixaAplicada = null;
  for (let i = tabela.length - 1; i >= 0; i--) {
    const f = tabela[i];
    const limiteInferior = f.de || 0;
    if (baseCalculo >= limiteInferior) {
      irpf = baseCalculo * f.aliquota - f.deducao;
      faixaAplicada = f;
      break;
    }
  }

  irpf = Math.max(0, Math.round(irpf * 100) / 100);
  const efetiva = rendaMensal > 0 ? (irpf / rendaMensal * 100).toFixed(2) + "%" : "0%";

  return {
    renda_mensal: rendaMensal,
    desconto_simplificado: deducaoSimplificada,
    base_calculo: Math.round(baseCalculo * 100) / 100,
    irpf: irpf,
    aliquota_nominal: faixaAplicada ? (faixaAplicada.aliquota * 100) + "%" : "0%",
    aliquota_efetiva: efetiva,
    isento: irpf === 0
  };
}

/**
 * Calcula INSS do empregado (tabela progressiva)
 * @param {number} salario - Salário bruto mensal
 * @returns {object} Resultado do cálculo
 */
function calcularINSSDistritoFederal(salario) {
  const tabela = DISTRITO_FEDERAL_TRIBUTARIO.federal.inss.empregado.tabela_2026;
  const teto = DISTRITO_FEDERAL_TRIBUTARIO.federal.inss.empregado.teto;
  const base = Math.min(salario, teto);

  let inss = 0;
  let anterior = 0;
  const detalhamento = [];

  for (const faixa of tabela) {
    const limite = faixa.ate || teto;
    if (base <= anterior) break;
    const baseNaFaixa = Math.min(base, limite) - anterior;
    if (baseNaFaixa <= 0) break;
    const contrib = baseNaFaixa * faixa.aliquota;
    inss += contrib;
    detalhamento.push({
      faixa: `R$ ${anterior.toFixed(2)} a R$ ${limite.toFixed(2)}`,
      base: Math.round(baseNaFaixa * 100) / 100,
      aliquota: faixa.aliquota,
      contribuicao: Math.round(contrib * 100) / 100
    });
    anterior = limite;
  }

  inss = Math.round(inss * 100) / 100;
  const efetiva = salario > 0 ? (inss / salario * 100).toFixed(2) + "%" : "0%";

  return {
    salario: salario,
    base_calculo: base,
    inss: inss,
    teto_aplicado: salario > teto,
    aliquota_efetiva: efetiva,
    detalhamento: detalhamento
  };
}

/**
 * Resumo rápido do DF para consulta
 * @returns {object} Resumo dos principais tributos
 */
function resumoTributarioDistritoFederal() {
  return {
    uf: "DF — Distrito Federal / Brasília",
    particularidade: "ÚNICO ente que acumula competência estadual + municipal. Brasília é a única cidade.",
    icms: "20% (geral) — DF integra IBS/CBS (1%) na base do ICMS em 2026",
    ipva: {
      carros: "3%",
      motos: "2%",
      carga_pesada: "1%",
      desconto_cota_unica: "10%",
      isencao: "15+ anos, elétricos/híbridos, PcD"
    },
    itcmd: "Progressivo: 4% até R$1M, 5% R$1M-R$2M, 6% acima R$2M. Isenção causa mortis até R$ 169.015,91",
    iss: "5% padrão, 2% TI/saúde/educação/construção, 3% hotelaria",
    iptu: "0,3% residencial, 1% comercial, 3% terreno",
    itbi: "1% primeira transferência imóvel novo (demais: não localizado). Base 2026: valor de mercado",
    fecop: "NÃO possui",
    simples_sublimite: "R$ 3.600.000"
  };
}


// ═══════════════════════════════════════════════════════════════════════════
//  15. EXPORTAÇÃO (Padrão Grupo 2)
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    ...DISTRITO_FEDERAL_TRIBUTARIO,
    utils: {
      getISS: getISSDistritoFederal,
      getIPVA: getIPVADistritoFederal,
      calcularIPVA: calcularIPVADistritoFederal,
      calcularITCMD: calcularITCMDDistritoFederal,
      calcularDIFAL: calcularDIFALDistritoFederal,
      calcularICMS: calcularICMSDistritoFederal,
      calcularSimplesNacional: calcularSimplesNacionalDistritoFederal,
      calcularIRPF: calcularIRPFDistritoFederal,
      calcularINSS: calcularINSSDistritoFederal,
      resumoTributario: resumoTributarioDistritoFederal,
    },
  };
}

if (typeof window !== "undefined") {
  window.DISTRITO_FEDERAL_TRIBUTARIO = DISTRITO_FEDERAL_TRIBUTARIO;
  window.DistritoFederalTributario = {
    getISS: getISSDistritoFederal,
    getIPVA: getIPVADistritoFederal,
    calcularIPVA: calcularIPVADistritoFederal,
    calcularITCMD: calcularITCMDDistritoFederal,
    calcularDIFAL: calcularDIFALDistritoFederal,
    calcularICMS: calcularICMSDistritoFederal,
    calcularSimplesNacional: calcularSimplesNacionalDistritoFederal,
    calcularIRPF: calcularIRPFDistritoFederal,
    calcularINSS: calcularINSSDistritoFederal,
    resumo: resumoTributarioDistritoFederal,
  };
}
