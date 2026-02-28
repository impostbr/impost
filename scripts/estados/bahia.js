/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BAHIA.JS — Base de Dados Tributária Completa do Estado da Bahia
 * ═══════════════════════════════════════════════════════════════════════════
 * Versão 3.0 — Padronizado conforme modelo roraima.js v3.0
 * Dados verificados via fontes oficiais (SEFAZ/BA, Receita Federal, Planalto,
 * Legislação Municipal Salvador, SEFAZ Salvador)
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
 *   11. incentivos          — SUDAM/SUDENE, ALC/ZFM, SUFRAMA, programas estaduais
 *   12. reforma_tributaria  — EC 132, LC 214, transição IBS/CBS
 *   13. cobertura           — Versão, itens localizados/pendentes, contatos
 *   14. funções utilitárias — Helpers de cálculo
 *   15. exportação          — module.exports + window (padrão Grupo 2)
 *
 * FONTES CONSULTADAS:
 *   • SEFAZ/BA — www.sefaz.ba.gov.br
 *   • Lei nº 7.014/1996 (Lei do ICMS da Bahia)
 *   • Decreto nº 13.780/2012 (RICMS/BA)
 *   • Lei nº 6.348/1991 (IPVA)
 *   • Lei nº 4.826/1989 (ITD)
 *   • Lei Complementar nº 7.186/2006 (ISS Salvador)
 *   • Decreto nº 33.434/2021 (CTISS Salvador)
 *   • Decreto nº 39.746/2025 (Alterações ISS Salvador)
 *   • Lei nº 9.655/2022, Lei nº 9.823/2024 (IPTU Salvador)
 *   • Receita Federal — www.gov.br/receitafederal
 *
 * ATUALIZAÇÃO: 10/02/2026
 * ═══════════════════════════════════════════════════════════════════════════
 */

const BAHIA_TRIBUTARIO = {

  // ═══════════════════════════════════════════════════════════════
  //  1. DADOS GERAIS
  // ═══════════════════════════════════════════════════════════════

  dados_gerais: {
    nome: "Bahia",
    sigla: "BA",
    regiao: "Nordeste",
    capital: "Salvador",
    codigo_ibge: "29",
    codigo_ibge_capital: "2927408",
    gentilico: "Baiano(a)",
    municipios_principais: [
      { nome: "Salvador", codigo_ibge: "2927408", capital: true },
      { nome: "Feira de Santana", codigo_ibge: "2909402", capital: false },
      { nome: "Vitória da Conquista", codigo_ibge: "2933307", capital: false },
      { nome: "Camaçari", codigo_ibge: "2904654", capital: false }
    ],
    zona_franca: {
      existe: false,
      observacao: "Não há Zona Franca na Bahia"
    },
    alc: {
      existe: false,
      observacao: "Não há Área de Livre Comércio na Bahia"
    },
    sudam: {
      abrangencia: true,
      parcial: true,
      descricao: "Oeste e Sul do Estado",
      observacao: "Abrangência parcial — apenas parte dos municípios da Bahia"
    },
    sudene: {
      abrangencia: true,
      parcial: true,
      descricao: "Litoral e Recôncavo",
      observacao: "Abrangência parcial — parte dos municípios",
      beneficios: "Redução de IRPJ até 75%, incentivos para projetos aprovados"
    },
    suframa: {
      abrangencia: false,
      observacao: "Bahia não está na área de abrangência da SUFRAMA"
    },
    sefaz: {
      url: "https://www.sefaz.ba.gov.br/",
      legislacao_url: "https://www.sefaz.ba.gov.br/legislacao/textos-legais/",
      telefone: null,
      email: null
    },
    prefeitura_capital: {
      url: "https://www.salvador.ba.gov.br/",
      sefaz_salvador_url: "https://www2.sefaz.salvador.ba.gov.br/"
    },
    legislacao_base: {
      icms: "Lei nº 7.014/1996; Decreto nº 13.780/2012 (RICMS/BA)",
      ipva: "Lei nº 6.348/1991; Decreto nº 14.528/2013",
      itd: "Lei nº 4.826/1989; Decreto nº 2.487/1989",
      iss_salvador: "Lei Complementar nº 7.186/2006; Decreto nº 33.434/2021 (CTISS); Decreto nº 39.746/2025",
      iptu_salvador: "Lei nº 7.186/2006; Lei nº 9.655/2022; Lei nº 9.823/2024",
      itiv_salvador: "Lei nº 7.186/2006"
    },
    observacoes: [
      "Bahia possui abrangência parcial tanto da SUDAM (Oeste/Sul) quanto da SUDENE (Litoral/Recôncavo)",
      "ICMS majorado para 20,5% desde 07/02/2024",
      "ISS de Salvador possui tabela CTISS completa com alíquotas de 2% a 5%",
      "IPTU de Salvador com faixas progressivas e dedução"
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  2. ICMS — IMPOSTO SOBRE CIRCULAÇÃO DE MERCADORIAS E SERVIÇOS
  // ═══════════════════════════════════════════════════════════════

  icms: {
    aliquota_padrao: 0.205,
    aliquota_padrao_percentual: "20,5%",
    aliquota_padrao_vigencia: "Desde 07/02/2024",
    aliquota_padrao_base_legal: "Lei nº 7.014/1996",

    historico: [
      { aliquota: 0.19, percentual: "19%", vigencia: "01/01/2024 a 06/02/2024" },
      { aliquota: 0.205, percentual: "20,5%", vigencia: "A partir de 07/02/2024 (majoração de 1,5 p.p.)" }
    ],

    fecoep: {
      existe: false,
      observacao: "Não foi identificado FECOEP/FECOP adicional na pesquisa — verificar SEFAZ/BA"
    },

    aliquota_efetiva_padrao: 0.205,
    aliquota_efetiva_padrao_percentual: "20,5%",

    aliquotas_diferenciadas: {
      // Dados específicos não detalhados na pesquisa
      cesta_basica: {
        dados_disponiveis: false,
        obs: "Verificar SEFAZ/BA — RICMS/2012"
      },
      combustiveis: {
        dados_disponiveis: false,
        obs: "Verificar SEFAZ/BA — RICMS/2012"
      },
      energia_eletrica: {
        dados_disponiveis: false,
        obs: "Verificar SEFAZ/BA — RICMS/2012"
      },
      telecomunicacoes: {
        dados_disponiveis: false,
        obs: "Verificar SEFAZ/BA — RICMS/2012"
      },
      medicamentos: {
        dados_disponiveis: false,
        obs: "Verificar SEFAZ/BA — RICMS/2012"
      },
      bebidas_alcoolicas: {
        dados_disponiveis: false,
        obs: "Verificar SEFAZ/BA — RICMS/2012"
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
        descricao: "Operações com não contribuintes (EC 87/2015) — alíquota interna"
      }
    },

    icms_importacao: {
      aliquota: 0.205,
      percentual: "20,5%",
      descricao: "ICMS sobre importação — alíquota interna"
    },

    substituicao_tributaria: {
      dados_disponiveis: true,
      referencia: "Anexo 01 do RICMS/2012 — atualizado anualmente",
      url: "https://mbusca.sefaz.ba.gov.br/DITRI/normas_complementares/decretos/decreto_2012_13780_ricms_anexo_1_vigente_2026.pdf",
      observacao: "Tabelas de ST disponíveis no Anexo 01 do RICMS/BA"
    },

    legislacao: [
      { norma: "Lei nº 7.014/1996", assunto: "Lei do ICMS da Bahia" },
      { norma: "Decreto nº 13.780/2012", assunto: "RICMS/BA — Regulamento do ICMS" },
      { norma: "RICMS/BA Texto 2021", url: "http://mbusca.sefaz.ba.gov.br/DITRI/normas_complementares/decretos/decreto_2012_13780_ricms_texto_2021.pdf" }
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  3. IPVA — IMPOSTO SOBRE PROPRIEDADE DE VEÍCULOS AUTOMOTORES
  // ═══════════════════════════════════════════════════════════════

  ipva: {
    base_legal: "Lei nº 6.348/1991; Decreto nº 14.528/2013",
    base_calculo: "Valor venal conforme tabela FIPE (veículos usados) ou NF (veículos novos)",

    aliquotas: {
      automovel_diesel: {
        aliquota: 0.03,
        percentual: "3%",
        descricao: "Automóveis a diesel"
      },
      automovel_outros: {
        aliquota: 0.025,
        percentual: "2,5%",
        descricao: "Automóveis gasolina, álcool, híbrido, elétrico"
      },
      utilitario_diesel: {
        aliquota: 0.03,
        percentual: "3%",
        descricao: "Utilitários a diesel (pick-ups, vans comerciais)"
      },
      utilitario_outros: {
        aliquota: 0.025,
        percentual: "2,5%",
        descricao: "Utilitários outros combustíveis"
      },
      motocicleta: {
        aliquota: 0.01,
        percentual: "1%",
        descricao: "Motocicletas e motonetas — todas as cilindradas"
      },
      triciclo: {
        aliquota: 0.01,
        percentual: "1%",
        descricao: "Veículos de 3 rodas"
      },
      onibus_micro_onibus: {
        aliquota: 0.01,
        percentual: "1%",
        descricao: "Ônibus e micro-ônibus — transporte coletivo"
      },
      caminhao: {
        aliquota: 0.01,
        percentual: "1%",
        descricao: "Caminhões — todos os tipos"
      },
      maquinas_terraplanagem: {
        aliquota: 0.01,
        percentual: "1%",
        descricao: "Tratores, escavadeiras, máquinas de terraplanagem"
      },
      embarcacao: {
        aliquota: 0.015,
        percentual: "1,5%",
        descricao: "Embarcações de recreio ou esporte"
      },
      aeronave: {
        aliquota: 0.015,
        percentual: "1,5%",
        descricao: "Aeronaves particulares"
      }
    },

    isencoes: [
      { tipo: "Veículos com mais de 15 anos", descricao: "Isenção total de IPVA", base_legal: "Lei nº 6.348/1991" },
      { tipo: "Veículos PCD", descricao: "Isenção com comprovação" },
      { tipo: "Táxis", descricao: "Categoria aluguel, motorista autônomo" },
      { tipo: "Motos/motonetas de aluguel", descricao: "Motorista profissional autônomo" },
      { tipo: "Veículos oficiais", descricao: "União, Estados, Municípios" },
      { tipo: "Transporte público", descricao: "Empresas concessionárias" },
      { tipo: "Ambulâncias e bombeiros", descricao: "Sem cobrança de serviço" },
      { tipo: "Embarcações pesca profissional", descricao: "Pessoa física pescador" },
      { tipo: "Veículos 100% elétricos", descricao: "Até R$ 300.000,00", limite_valor: 300000 },
      { tipo: "Máquinas agrícolas", descricao: "Não circulam em vias públicas" },
      { tipo: "Veículos < 50cc", descricao: "Motocicletas/motonetas até 50 cilindradas" }
    ],

    descontos_antecipacao: {
      cota_unica: {
        percentual: 0.15,
        percentual_texto: "15% de desconto",
        prazo: "Até 10 de fevereiro",
        observacao: "Desconto para pagamento em cota única"
      },
      parcelamento: {
        parcelas: 5,
        desconto: 0,
        periodo: "Março a novembro",
        observacao: "Até 5 parcelas sem desconto"
      }
    },

    calendario_vencimento: {
      escalonamento: "Por final de placa",
      dados_disponiveis: false,
      obs: "Consultar calendário oficial SEFAZ/BA para detalhes por placa"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  4. ITCMD (ITD na Bahia — Imposto sobre Transmissão Causa Mortis e Doação)
  // ═══════════════════════════════════════════════════════════════

  itcmd: {
    nome_local: "ITD — Imposto sobre Transmissão Causa Mortis",
    base_legal: "Lei nº 4.826/1989; Decreto nº 2.487/1989; Portaria nº 79/2025 (SGITD)",

    aliquotas: {
      causa_mortis: {
        tipo: "fixa",
        aliquota: 0.04,
        percentual: "4%",
        descricao: "Transmissão causa mortis (herança)"
      },
      doacao: {
        dados_disponiveis: false,
        obs: "Alíquota de doação não especificada na pesquisa — verificar SEFAZ/BA"
      }
    },

    progressividade: {
      implementada: false,
      observacao: "Alíquota fixa de 4% — sem progressividade identificada"
    },

    base_calculo: "Valor do patrimônio transmitido (valor de mercado)",

    isencoes: {
      dados_disponiveis: false,
      obs: "Isenções específicas não detalhadas — verificar SEFAZ/BA"
    },

    legislacao: [
      { norma: "Lei nº 4.826/1989", assunto: "Lei do ITD da Bahia" },
      { norma: "Decreto nº 2.487/1989", assunto: "Regulamento do ITD" },
      { norma: "Portaria nº 79/2025", assunto: "Sistema de Gestão do ITD (SGITD)" }
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  5. ISS — IMPOSTO SOBRE SERVIÇOS (Salvador — referência)
  // ═══════════════════════════════════════════════════════════════

  iss: {
    municipio_referencia: "Salvador",
    base_legal: "Lei Complementar nº 7.186/2006; Decreto nº 33.434/2021 (CTISS); Decreto nº 39.746/2025",
    aliquota_minima: 0.02,
    aliquota_maxima: 0.05,
    aliquota_minima_percentual: "2%",
    aliquota_maxima_percentual: "5%",
    aliquota_geral: 0.05,
    aliquota_geral_percentual: "5%",
    observacao: "Alíquotas variam de 2% a 5% conforme código CTISS",

    tabela_ctiss_url: "https://www2.sefaz.salvador.ba.gov.br/storage/7459/ISS-2024.pdf",

    por_tipo_servico: {
      informatica: {
        aliquota: 0.05,
        percentual: "5%",
        codigos: ["1.01", "1.02", "1.03", "1.04", "1.05", "1.06", "1.07", "1.08", "1.09"],
        descricao: "Análise, desenvolvimento, programação, hospedagem, consultoria TI"
      },
      pesquisa_desenvolvimento: {
        aliquota: 0.05,
        percentual: "5%",
        codigos: ["2.0"],
        descricao: "Pesquisas e desenvolvimento de qualquer natureza"
      },
      locacao_cessao: {
        aliquota: 0.05,
        percentual: "5%",
        codigos: ["3.01", "3.02", "3.03"],
        descricao: "Cessão de marcas, exploração de salões, locação"
      },
      saude: {
        aliquota: 0.03,
        percentual: "3%",
        codigos: ["4.01", "4.02", "4.03", "4.04", "4.05", "4.06", "4.07", "4.08", "4.09", "4.10", "4.11", "4.12", "4.13", "4.14", "4.15", "4.16", "4.17", "4.18", "4.19", "4.20", "4.21", "4.22", "4.23"],
        descricao: "Medicina, biomedicina, odontologia, psicologia, planos de saúde, laboratórios"
      },
      veterinaria: {
        aliquota: 0.05,
        percentual: "5%",
        codigos: ["5.0"],
        descricao: "Medicina e assistência veterinária"
      },
      cuidados_pessoais_estetica: {
        aliquota: 0.05,
        percentual: "5%",
        codigos: ["6.01", "6.02", "6.03", "6.04", "6.05", "6.06"],
        descricao: "Barbearia, cabeleireiro, estética, academia, spa, tatuagem"
      },
      construcao_civil: {
        aliquota: 0.03,
        percentual: "3%",
        codigos: ["7.01", "7.02", "7.03", "7.04", "7.05", "7.06", "7.07", "7.08", "7.09", "7.10", "7.11", "7.12", "7.13", "7.14", "7.15", "7.16", "7.17", "7.18", "7.19", "7.20"],
        descricao: "Engenharia, arquitetura, construção civil, demolição, limpeza, jardinagem"
      },
      educacao: {
        aliquota: 0.035,
        percentual: "3,5%",
        codigos: ["8.01", "8.02"],
        descricao: "Ensino regular, instrução, treinamento, orientação pedagógica"
      },
      hospedagem_turismo: {
        aliquota: 0.05,
        percentual: "5%",
        codigos: ["9.01", "9.02", "9.03"],
        descricao: "Hotéis, apart-service, flats, agenciamento de turismo"
      },
      intermediacao: {
        aliquota: 0.02,
        percentual: "2%",
        codigos: ["10.01", "10.02", "10.03", "10.04", "10.05", "10.06", "10.07", "10.08", "10.09", "10.10"],
        descricao: "Agenciamento, corretagem, representação comercial, distribuição"
      },
      guarda_vigilancia: {
        aliquota: 0.05,
        percentual: "5%",
        codigos: ["11.01", "11.02", "11.03", "11.04"],
        descricao: "Estacionamento, vigilância, segurança, armazenamento"
      },
      diversoes_lazer: {
        aliquota: 0.05,
        percentual: "5%",
        codigos: ["12.01", "12.02", "12.03", "12.04", "12.05", "12.06", "12.07", "12.08", "12.09", "12.10", "12.11", "12.12", "12.13", "12.14", "12.15", "12.16", "12.17"],
        descricao: "Espetáculos, cinema, shows, feiras, competições, carnaval"
      },
      fonografia_fotografia: {
        aliquota: 0.05,
        percentual: "5%",
        codigos: ["13.01", "13.02", "13.03", "13.04"],
        descricao: "Gravação, fotografia, cinematografia, reprografia"
      },
      servicos_bens_terceiros: {
        aliquota: 0.05,
        percentual: "5%",
        codigos: ["14.01", "14.02", "14.03", "14.04", "14.05", "14.06", "14.07", "14.08", "14.09", "14.10", "14.11", "14.12"],
        descricao: "Manutenção, assistência técnica, lavanderia, alfaiataria"
      },
      transporte: {
        aliquota: 0.05,
        percentual: "5%",
        codigos: ["15.01", "15.02", "15.03", "15.04", "15.05", "15.06", "15.07", "15.08"],
        descricao: "Transporte de pessoas, cargas, táxi, valores"
      },
      comunicacao: {
        aliquota: 0.05,
        percentual: "5%",
        codigos: ["16.01", "16.02", "16.03", "16.04", "16.05"],
        descricao: "Telefonia, satélite, rádio, televisão, internet"
      },
      servicos_profissionais: {
        aliquota: 0.05,
        percentual: "5%",
        codigos: ["17.01", "17.02", "17.03", "17.04", "17.05", "17.06", "17.07", "17.08", "17.09", "17.10", "17.11", "17.12", "17.13", "17.14", "17.15", "17.16", "17.17", "17.18", "17.19"],
        descricao: "Advocacia, consultoria, contabilidade, auditoria, limpeza, administração"
      },
      incentivo_fiscal_2pct: {
        aliquota: 0.02,
        percentual: "2%",
        codigos_faixa: "18.0 a 26.03, 26-A e 26-B",
        descricao: "Alíquota reduzida de 2% como incentivo fiscal (vigência 5 anos)",
        base_legal: "Decreto nº 39.746/2025"
      }
    },

    iss_fixo: {
      dados_disponiveis: false,
      obs: "ISS fixo para autônomos não detalhado — verificar SEFAZ Salvador"
    },

    legislacao: [
      { norma: "Lei Complementar nº 7.186/2006", assunto: "Lei do ISS de Salvador" },
      { norma: "Decreto nº 33.434/2021", assunto: "Código de Tributação do ISS (CTISS)" },
      { norma: "Decreto nº 39.746/2025", assunto: "Alterações de alíquotas ISS" },
      { norma: "Lei Complementar nº 116/2003", assunto: "Normas Gerais ISS (Federal)" }
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  6. IPTU — IMPOSTO PREDIAL E TERRITORIAL URBANO (Salvador)
  // ═══════════════════════════════════════════════════════════════

  iptu: {
    municipio_referencia: "Salvador",
    base_legal: "Lei nº 7.186/2006; Lei nº 9.655/2022; Lei nº 9.823/2024",
    base_calculo: "Valor venal conforme Planta Genérica de Valores (PGV) — atualização anual",

    aliquotas_residencial: {
      faixas: [
        { faixa: 1, de: 0, ate: 42156.82, aliquota: 0.001, percentual: "0,10%", deducao: 0 },
        { faixa: 2, de: 42156.83, ate: 65532.01, aliquota: 0.002, percentual: "0,20%", deducao: 42.16 },
        { faixa: 3, de: 65532.02, ate: 95678.60, aliquota: 0.003, percentual: "0,30%", deducao: 107.69 },
        { faixa: 4, de: 95678.61, ate: 143864.45, aliquota: 0.004, percentual: "0,40%", deducao: 203.37 },
        { faixa: 5, de: 143864.46, ate: 241348.45, aliquota: 0.006, percentual: "0,60%", deducao: 573.80 },
        { faixa: 6, de: 241348.46, ate: 472217.64, aliquota: 0.008, percentual: "0,80%", deducao: 973.80 },
        { faixa: 7, de: 472217.65, ate: Infinity, aliquota: 0.01, percentual: "1,00%", deducao: 1918.84 }
      ]
    },

    aliquotas_nao_residencial: {
      faixas: [
        { faixa: 1, de: 0, ate: 82681.45, aliquota: 0.01, percentual: "1,00%", deducao: 0 },
        { faixa: 2, de: 82681.46, ate: 139299.65, aliquota: 0.011, percentual: "1,10%", deducao: 82.68 },
        { faixa: 3, de: 139299.66, ate: 218470.98, aliquota: 0.012, percentual: "1,20%", deducao: 221.98 },
        { faixa: 4, de: 218470.99, ate: 306270.30, aliquota: 0.013, percentual: "1,30%", deducao: 440.45 },
        { faixa: 5, de: 306270.31, ate: 807630.32, aliquota: 0.014, percentual: "1,40%", deducao: 746.72 },
        { faixa: 6, de: 807630.33, ate: Infinity, aliquota: 0.015, percentual: "1,50%", deducao: 1534.35 }
      ]
    },

    aliquotas_terreno: {
      faixas: [
        { faixa: 1, de: 0, ate: 58192.52, aliquota: 0.01, percentual: "1,00%", deducao: 0 },
        { faixa: 2, de: 58192.53, ate: 161751.23, aliquota: 0.015, percentual: "1,50%", deducao: 290.96 },
        { faixa: 3, de: 161751.24, ate: 393942.53, aliquota: 0.02, percentual: "2,00%", deducao: 1699.72 },
        { faixa: 4, de: 393942.54, ate: 1358991.49, aliquota: 0.025, percentual: "2,50%", deducao: 3069.43 },
        { faixa: 5, de: 1358991.50, ate: Infinity, aliquota: 0.03, percentual: "3,00%", deducao: 9864.39 }
      ]
    },

    isencoes: [
      {
        tipo: "Imóvel residencial até ~R$ 138.000",
        descricao: "Isenção para imóvel residencial até valor venal de aproximadamente R$ 138.000 (2025)",
        base_legal: "Lei nº 9.823/2024",
        observacao: "Limite atualizado anualmente"
      },
      { tipo: "Imóveis de interesse público", descricao: "Isentos conforme legislação" },
      { tipo: "Imóveis históricos/culturais", descricao: "Possível redução" },
      { tipo: "PCD", descricao: "Conforme legislação" }
    ],

    legislacao: [
      { norma: "Lei nº 7.186/2006", assunto: "Lei do IPTU de Salvador" },
      { norma: "Lei nº 9.655/2022", assunto: "Atualização de limites IPTU" },
      { norma: "Lei nº 9.823/2024", assunto: "Atualização de limites IPTU" },
      { norma: "Decreto nº 33.400/2020", assunto: "Regulamentação" }
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  7. ITBI (ITIV em Salvador — Imposto sobre Transmissão Inter Vivos)
  // ═══════════════════════════════════════════════════════════════

  itbi: {
    nome_local: "ITIV — Imposto sobre Transmissão de Imóvel Inter Vivos",
    municipio_referencia: "Salvador",
    base_legal: "Lei nº 7.186/2006",
    aliquota_geral: 0.02,
    aliquota_geral_percentual: "2%",
    aliquota_doacao: 0.02,
    aliquota_doacao_percentual: "2%",
    base_calculo: "Valor de avaliação ou valor de mercado do imóvel",

    sfh: {
      dados_disponiveis: false,
      obs: "Alíquota SFH não especificada — verificar SEFAZ Salvador"
    },

    legislacao: [
      { norma: "Lei nº 7.186/2006", assunto: "Lei do ITIV de Salvador" }
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  //  8. TAXAS ESTADUAIS E MUNICIPAIS
  // ═══════════════════════════════════════════════════════════════

  taxas: {
    estaduais: {
      dados_disponiveis: false,
      obs: "Taxas estaduais não detalhadas na pesquisa — verificar SEFAZ/BA"
    },
    municipais_salvador: {
      dados_disponiveis: false,
      obs: "Taxas municipais de Salvador não detalhadas — verificar SEFAZ Salvador"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  9. IMPOSTOS FEDERAIS (aplicáveis no estado)
  // ═══════════════════════════════════════════════════════════════

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
          descricao: "Sobre excedente de R$ 20.000/mês ou R$ 240.000/ano"
        },
        aliquota_efetiva_maxima: 0.25,
        aliquota_efetiva_maxima_percentual: "25% (15% + 10%)"
      },
      lucro_presumido: {
        aliquota: 0.15,
        percentual: "15%",
        base: "Presunção de lucro",
        presuncao: {
          comercio: { percentual: 0.08, aliquota_efetiva: 0.012, descricao: "8% → IRPJ efetivo 1,2%" },
          industria: { percentual: 0.08, aliquota_efetiva: 0.012, descricao: "8% → IRPJ efetivo 1,2%" },
          servicos: { percentual: 0.32, aliquota_efetiva: 0.048, descricao: "32% → IRPJ efetivo 4,8%" },
          transporte: { percentual: 0.08, aliquota_efetiva: 0.012, descricao: "8% → IRPJ efetivo 1,2%" },
          transporte_passageiros: { percentual: 0.16, aliquota_efetiva: 0.024, descricao: "16% → IRPJ efetivo 2,4%" },
          servicos_saude: { percentual: 0.08, aliquota_efetiva: 0.012, descricao: "8% → IRPJ efetivo 1,2% (com requisitos)" },
          revenda_combustiveis: { percentual: 0.016, aliquota_efetiva: 0.0024, descricao: "1,6% → IRPJ efetivo 0,24%" },
          observacao: "Presunção varia de 1,6% a 32% conforme atividade"
        },
        adicional: {
          aliquota: 0.10,
          percentual: "10%",
          limite_trimestral: 60000,
          descricao: "Sobre excedente de R$ 60.000/trimestre"
        }
      },
      incentivos_regionais: {
        sudam: {
          parcial: true,
          descricao: "Redução de até 75% IRPJ — municípios do Oeste/Sul da Bahia na área SUDAM"
        },
        sudene: {
          parcial: true,
          descricao: "Redução de até 75% IRPJ — municípios do Litoral/Recôncavo na área SUDENE"
        }
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
      instituicoes_financeiras: 0.15,
      instituicoes_financeiras_percentual: "15%",
      base: "Lucro líquido ajustado ou receita bruta presumida"
    },

    pis_pasep: {
      cumulativo: {
        aliquota: 0.0076,
        percentual: "0,76%",
        regime: "Lucro Presumido",
        creditos: false
      },
      nao_cumulativo: {
        aliquota: 0.0165,
        percentual: "1,65%",
        regime: "Lucro Real",
        creditos: true
      }
    },

    cofins: {
      cumulativo: {
        aliquota: 0.03,
        percentual: "3%",
        regime: "Lucro Presumido",
        creditos: false
      },
      nao_cumulativo: {
        aliquota: 0.076,
        percentual: "7,6%",
        regime: "Lucro Real",
        creditos: true
      }
    },

    ipi: {
      referencia: "Tabela de Incidência do IPI (TIPI) vigente",
      beneficios_regionais: false
    },

    iof: {
      descricao: "Conforme legislação federal — sem especificidade estadual"
    },

    ii: {
      descricao: "Imposto de Importação — conforme TEC e legislação federal"
    },

    ie: {
      descricao: "Imposto de Exportação — conforme legislação federal"
    },

    itr: {
      descricao: "Imposto Territorial Rural — conforme legislação federal"
    },

    inss: {
      patronal: {
        geral: { aliquota_minima: 0.20, aliquota_maxima: 0.288, percentual: "20% a 28,8%" },
        rat_sat: { minima: 0.005, maxima: 0.03, percentual: "0,5% a 3%" }
      },
      empregado: {
        tabela: [
          { faixa: 1, aliquota: 0.08, percentual: "8%" },
          { faixa: 2, aliquota: 0.09, percentual: "9%" },
          { faixa: 3, aliquota: 0.10, percentual: "10%" },
          { faixa: 4, aliquota: 0.11, percentual: "11%" }
        ],
        observacao: "Tabela progressiva conforme faixa salarial"
      }
    },

    fgts: {
      aliquota: 0.08,
      percentual: "8%",
      base: "Remuneração mensal do empregado",
      multa_rescisoria: 0.40,
      multa_rescisoria_percentual: "40% do saldo"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  10. SIMPLES NACIONAL
  // ═══════════════════════════════════════════════════════════════

  simples_nacional: {
    sublimite_estadual: 3600000,
    sublimite_estadual_formatado: "R$ 3.600.000,00",
    sublimite_tipo: "Padrão",
    sublimite_observacao: "Bahia adota o sublimite padrão para ICMS/ISS",

    limite_simples: 4800000,
    limite_simples_formatado: "R$ 4.800.000,00",

    mei: {
      limite_anual: 81000,
      limite_formatado: "R$ 81.000,00",
      vigencia: "2025"
    },

    microempresa: {
      limite_anual: 360000,
      limite_formatado: "R$ 360.000,00"
    },

    epp: {
      limite_anual: 4800000,
      limite_formatado: "R$ 4.800.000,00"
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

  // ═══════════════════════════════════════════════════════════════
  //  11. INCENTIVOS FISCAIS E BENEFÍCIOS REGIONAIS
  // ═══════════════════════════════════════════════════════════════

  incentivos: {
    sudam: {
      ativo: true,
      parcial: true,
      descricao: "Abrangência parcial — Oeste e Sul da Bahia",
      beneficios: {
        reducao_irpj: {
          percentual: 0.75,
          descricao: "Redução de até 75% do IRPJ para projetos aprovados"
        }
      },
      condicoes: ["Projeto aprovado pela SUDAM", "Município na área de abrangência (Oeste/Sul da Bahia)"],
      base_legal: "Legislação SUDAM"
    },

    sudene: {
      ativo: true,
      parcial: true,
      descricao: "Abrangência parcial — Litoral e Recôncavo Baiano",
      beneficios: {
        reducao_irpj: {
          percentual: 0.75,
          descricao: "Redução de até 75% do IRPJ para projetos aprovados"
        }
      },
      condicoes: ["Projeto aprovado pela SUDENE", "Município na área de abrangência (Litoral/Recôncavo)"],
      base_legal: "Lei nº 9.126/1995 e legislação SUDENE"
    },

    zona_franca: {
      ativo: false,
      observacao: "Não aplicável na Bahia"
    },

    alc: {
      ativo: false,
      observacao: "Não há ALC na Bahia"
    },

    programas_estaduais: {
      dados_disponiveis: false,
      obs: "Programas estaduais de incentivo não detalhados na pesquisa — verificar SEFAZ/BA"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  12. REFORMA TRIBUTÁRIA
  // ═══════════════════════════════════════════════════════════════

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
      cronograma: "Transição gradual conforme legislação federal",
      dados_disponiveis: false
    },
    is: {
      nome: "Imposto Seletivo",
      descricao: "Sobre produtos prejudiciais à saúde ou ao meio ambiente",
      dados_disponiveis: false
    },
    impactos_bahia: {
      observacao: "Bahia possui dupla abrangência (SUDAM parcial + SUDENE parcial) — benefícios regionais devem ser mantidos na transição"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  13. DADOS DE COBERTURA
  // ═══════════════════════════════════════════════════════════════

  cobertura: {
    versao: "3.0",
    data_atualizacao: "2026-02-10",

    localizados: [
      "ICMS — alíquota padrão 20,5% (vigente desde 07/02/2024) + histórico",
      "ICMS — alíquotas interestaduais (7% e 12%)",
      "ICMS — ICMS importação (20,5%)",
      "ICMS — Substituição Tributária (referência Anexo 01 RICMS)",
      "IPVA — alíquotas completas por tipo de veículo (1% a 3%)",
      "IPVA — isenções detalhadas (15+ anos, PCD, táxi, elétrico até 300k, etc.)",
      "IPVA — desconto 15% cota única + parcelamento 5x",
      "ITD — alíquota causa mortis 4%",
      "ISS Salvador — tabela CTISS completa (grupos 1-17 + incentivo 2%)",
      "ISS Salvador — alíquotas por tipo: informática 5%, saúde 3%, construção 3%, educação 3,5%, intermediação 2%",
      "IPTU Salvador — faixas progressivas residencial (7 faixas, 0,10% a 1,00%)",
      "IPTU Salvador — faixas progressivas não-residencial (6 faixas, 1,00% a 1,50%)",
      "IPTU Salvador — faixas progressivas terreno (5 faixas, 1,00% a 3,00%)",
      "IPTU Salvador — valores de dedução por faixa",
      "IPTU Salvador — isenção residencial até ~R$ 138.000",
      "ITIV Salvador — alíquota 2% (transmissão comum e doação)",
      "Impostos federais completos (IRPJ, CSLL, PIS, COFINS, INSS, FGTS, IRPF)",
      "IRPJ Lucro Presumido — presunções por atividade",
      "Simples Nacional — sublimite R$ 3.600.000 e anexos I-V",
      "SUDAM — abrangência parcial (Oeste/Sul)",
      "SUDENE — abrangência parcial (Litoral/Recôncavo)"
    ],

    nao_localizados: [
      "ICMS — alíquotas diferenciadas (cesta básica, combustíveis, energia, telecom, medicamentos, bebidas)",
      "ICMS — FECOEP/FECOP (existência e percentual)",
      "ITD — alíquota de doação",
      "ITD — isenções específicas",
      "IPVA — calendário de vencimento detalhado por placa",
      "ISS Salvador — valor do ISS Fixo (autônomos)",
      "ITIV Salvador — alíquota SFH",
      "Taxas estaduais (licenciamento, judiciária, etc.)",
      "Taxas municipais Salvador (lixo, alvará, COSIP)",
      "MEI — valores DAS mensais",
      "Programas estaduais de incentivo fiscal",
      "Reforma Tributária — alíquotas IBS/CBS para Bahia"
    ],

    contatos_para_completar: [
      "SEFAZ/BA — https://www.sefaz.ba.gov.br/",
      "SEFAZ Salvador — https://www2.sefaz.salvador.ba.gov.br/",
      "Receita Federal — https://www.gov.br/receitafederal/"
    ],

    cobertura_percentual_estimada: "72%",
    observacao: "Bahia possui dados muito completos de ISS e IPTU (Salvador) e IPVA. Gaps principais: alíquotas diferenciadas de ICMS e taxas"
  }
};


// ═══════════════════════════════════════════════════════════════════════════
//  14. FUNÇÕES UTILITÁRIAS — BAHIA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Retorna alíquota ISS por tipo de serviço em Salvador
 * @param {string} tipo - Tipo de serviço (ex: "saude", "informatica", "construcao_civil")
 * @returns {object}
 */
function getISSBahia(tipo) {
  var servico = BAHIA_TRIBUTARIO.iss.por_tipo_servico[tipo];
  if (!servico) {
    return {
      encontrado: false,
      aliquota: null,
      mensagem: "Tipo \"" + tipo + "\" não encontrado. Disponíveis: " + Object.keys(BAHIA_TRIBUTARIO.iss.por_tipo_servico).join(", ")
    };
  }
  if (servico.dados_disponiveis === false) {
    return { encontrado: true, aliquota: null, dados_disponiveis: false, mensagem: servico.obs };
  }
  return {
    encontrado: true,
    aliquota: servico.aliquota,
    percentual: servico.percentual,
    descricao: servico.descricao || null
  };
}

/**
 * Calcula IPTU residencial de Salvador por valor venal
 * @param {number} valorVenal - Valor venal do imóvel
 * @returns {object}
 */
function getIPTUResidencialBahia(valorVenal) {
  if (!valorVenal || valorVenal <= 0) {
    return { erro: true, mensagem: "Valor venal deve ser maior que zero." };
  }
  // Isenção
  if (valorVenal <= 138000) {
    return {
      valor_venal: valorVenal,
      aliquota: 0,
      percentual: "Isento",
      iptu: 0,
      descricao: "Imóvel residencial isento (valor venal até ~R$ 138.000)"
    };
  }
  var faixas = BAHIA_TRIBUTARIO.iptu.aliquotas_residencial.faixas;
  for (var i = 0; i < faixas.length; i++) {
    var f = faixas[i];
    if (valorVenal >= f.de && valorVenal <= f.ate) {
      var iptu = (valorVenal * f.aliquota) - f.deducao;
      return {
        valor_venal: valorVenal,
        faixa: f.faixa,
        aliquota: f.aliquota,
        percentual: f.percentual,
        deducao: f.deducao,
        iptu: parseFloat(iptu.toFixed(2)),
        tipo: "Residencial"
      };
    }
  }
  return { erro: true, mensagem: "Faixa não encontrada." };
}

/**
 * Calcula IPTU não-residencial (comercial) de Salvador por valor venal
 * @param {number} valorVenal - Valor venal do imóvel
 * @returns {object}
 */
function getIPTUComercialBahia(valorVenal) {
  if (!valorVenal || valorVenal <= 0) {
    return { erro: true, mensagem: "Valor venal deve ser maior que zero." };
  }
  var faixas = BAHIA_TRIBUTARIO.iptu.aliquotas_nao_residencial.faixas;
  for (var i = 0; i < faixas.length; i++) {
    var f = faixas[i];
    if (valorVenal >= f.de && valorVenal <= f.ate) {
      var iptu = (valorVenal * f.aliquota) - f.deducao;
      return {
        valor_venal: valorVenal,
        faixa: f.faixa,
        aliquota: f.aliquota,
        percentual: f.percentual,
        deducao: f.deducao,
        iptu: parseFloat(iptu.toFixed(2)),
        tipo: "Não Residencial (Comercial)"
      };
    }
  }
  return { erro: true, mensagem: "Faixa não encontrada." };
}

/**
 * Calcula IPTU terreno de Salvador por valor venal
 * @param {number} valorVenal - Valor venal do terreno
 * @returns {object}
 */
function getIPTUTerrenoBahia(valorVenal) {
  if (!valorVenal || valorVenal <= 0) {
    return { erro: true, mensagem: "Valor venal deve ser maior que zero." };
  }
  var faixas = BAHIA_TRIBUTARIO.iptu.aliquotas_terreno.faixas;
  for (var i = 0; i < faixas.length; i++) {
    var f = faixas[i];
    if (valorVenal >= f.de && valorVenal <= f.ate) {
      var iptu = (valorVenal * f.aliquota) - f.deducao;
      return {
        valor_venal: valorVenal,
        faixa: f.faixa,
        aliquota: f.aliquota,
        percentual: f.percentual,
        deducao: f.deducao,
        iptu: parseFloat(iptu.toFixed(2)),
        tipo: "Terreno"
      };
    }
  }
  return { erro: true, mensagem: "Faixa não encontrada." };
}

/**
 * Retorna alíquota IPVA por tipo de veículo
 * @param {string} tipo - Tipo (ex: "automovel_outros", "automovel_diesel", "motocicleta", "caminhao")
 * @returns {object}
 */
function getIPVABahia(tipo) {
  var veiculo = BAHIA_TRIBUTARIO.ipva.aliquotas[tipo];
  if (!veiculo) {
    return {
      encontrado: false,
      aliquota: null,
      mensagem: "Tipo \"" + tipo + "\" não encontrado. Disponíveis: " + Object.keys(BAHIA_TRIBUTARIO.ipva.aliquotas).join(", ")
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
 * @param {string} municipio
 * @returns {boolean}
 */
function isZonaFrancaBahia(municipio) {
  return false;
}

/**
 * Verifica se município está em Área de Livre Comércio
 * @param {string} municipio
 * @returns {boolean}
 */
function isALCBahia(municipio) {
  return false;
}

/**
 * Retorna redução SUDAM (parcial na Bahia)
 * @returns {object}
 */
function getReducaoSUDAMBahia() {
  return {
    ativo: true,
    parcial: true,
    reducao_irpj: 0.75,
    reducao_irpj_percentual: "75%",
    abrangencia: "Oeste e Sul da Bahia",
    condicao: "Município deve estar na área SUDAM + projeto aprovado"
  };
}

/**
 * Retorna redução SUDENE (parcial na Bahia)
 * @returns {object}
 */
function getReducaoSUDENEBahia() {
  return {
    ativo: true,
    parcial: true,
    reducao_irpj: 0.75,
    reducao_irpj_percentual: "75%",
    abrangencia: "Litoral e Recôncavo Baiano",
    condicao: "Município deve estar na área SUDENE + projeto aprovado"
  };
}

/**
 * Retorna ICMS efetivo
 * @returns {object}
 */
function getICMSEfetivoBahia() {
  return {
    aliquota_base: 0.205,
    fecoep: 0,
    efetiva: 0.205,
    percentual: "20,5%",
    vigencia: "Desde 07/02/2024"
  };
}

/**
 * Calcula alíquota efetiva do Simples Nacional
 * @param {number} rbt12 - Receita Bruta dos últimos 12 meses
 * @param {string} anexo - "anexo_i", "anexo_ii", "anexo_iii", "anexo_iv", "anexo_v"
 * @returns {object}
 */
function getAliquotaEfetivaSimplesBahia(rbt12, anexo) {
  var tabela = BAHIA_TRIBUTARIO.simples_nacional.anexos[anexo];
  if (!tabela) {
    return { erro: true, mensagem: "Anexo \"" + anexo + "\" não encontrado." };
  }
  if (rbt12 <= 0) {
    return { erro: true, mensagem: "RBT12 deve ser maior que zero." };
  }
  if (rbt12 > 4800000) {
    return { erro: true, mensagem: "RBT12 excede o limite do Simples Nacional (R$ 4.800.000,00)." };
  }

  var faixaSelecionada = null;
  for (var i = 0; i < tabela.faixas.length; i++) {
    if (rbt12 <= tabela.faixas[i].ate) {
      faixaSelecionada = tabela.faixas[i];
      break;
    }
  }

  if (!faixaSelecionada) {
    return { erro: true, mensagem: "Faixa não encontrada." };
  }

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
    sublimite_icms_iss: BAHIA_TRIBUTARIO.simples_nacional.sublimite_estadual,
    alerta_sublimite: rbt12 > BAHIA_TRIBUTARIO.simples_nacional.sublimite_estadual
      ? "RBT12 acima do sublimite estadual — ICMS/ISS recolhidos à parte"
      : null
  };
}

/**
 * Resumo tributário rápido do estado
 * @returns {object}
 */
function resumoTributarioBahia() {
  return {
    estado: "Bahia (BA)",
    regiao: "Nordeste",
    capital: "Salvador",
    icms_padrao: BAHIA_TRIBUTARIO.icms.aliquota_padrao,
    icms_padrao_percentual: BAHIA_TRIBUTARIO.icms.aliquota_padrao_percentual,
    icms_efetivo: BAHIA_TRIBUTARIO.icms.aliquota_efetiva_padrao,
    icms_efetivo_percentual: BAHIA_TRIBUTARIO.icms.aliquota_efetiva_padrao_percentual,
    ipva_auto_gasolina: "2,5%",
    ipva_auto_diesel: "3%",
    ipva_moto: "1%",
    ipva_caminhao: "1%",
    itcmd_causa_mortis: "4%",
    iss_faixa: "2% a 5% (Salvador)",
    iss_geral: "5%",
    iptu_residencial: "0,10% a 1,00% (Salvador — progressivo)",
    iptu_comercial: "1,00% a 1,50% (Salvador — progressivo)",
    iptu_terreno: "1,00% a 3,00% (Salvador — progressivo)",
    itiv: "2% (Salvador)",
    sublimite_simples: BAHIA_TRIBUTARIO.simples_nacional.sublimite_estadual_formatado,
    sudam: "Parcial (Oeste/Sul)",
    sudene: "Parcial (Litoral/Recôncavo)",
    zona_franca: false,
    cobertura_estimada: BAHIA_TRIBUTARIO.cobertura.cobertura_percentual_estimada
  };
}

/**
 * Lista incentivos fiscais ativos na Bahia
 * @returns {Array}
 */
function getIncentivosAtivosBahia() {
  var incentivos = [];

  if (BAHIA_TRIBUTARIO.incentivos.sudam.ativo) {
    incentivos.push({
      nome: "SUDAM",
      tipo: "Federal (parcial)",
      beneficio_principal: "Redução de até 75% IRPJ",
      abrangencia: "Oeste e Sul da Bahia"
    });
  }
  if (BAHIA_TRIBUTARIO.incentivos.sudene.ativo) {
    incentivos.push({
      nome: "SUDENE",
      tipo: "Federal (parcial)",
      beneficio_principal: "Redução de até 75% IRPJ",
      abrangencia: "Litoral e Recôncavo Baiano"
    });
  }

  // ISS 2% incentivo
  incentivos.push({
    nome: "ISS Reduzido 2% (Salvador)",
    tipo: "Municipal",
    beneficio_principal: "Alíquota reduzida de 2% para códigos 18.0 a 26.03, 26-A/26-B",
    vigencia: "5 anos (Decreto nº 39.746/2025)"
  });

  return incentivos;
}

/**
 * Calcula ITIV (ITBI de Salvador)
 * @param {number} valorImovel - Valor do imóvel
 * @returns {object}
 */
function calcularITIVBahia(valorImovel) {
  if (!valorImovel || valorImovel <= 0) {
    return { erro: true, mensagem: "Valor do imóvel deve ser maior que zero." };
  }
  var aliquota = BAHIA_TRIBUTARIO.itbi.aliquota_geral;
  return {
    valor_imovel: valorImovel,
    aliquota: aliquota,
    percentual: BAHIA_TRIBUTARIO.itbi.aliquota_geral_percentual,
    itiv: parseFloat((valorImovel * aliquota).toFixed(2))
  };
}

/**
 * Calcula ITD (ITCMD causa mortis da Bahia)
 * @param {number} valorPatrimonio - Valor do patrimônio transmitido
 * @returns {object}
 */
function calcularITDBahia(valorPatrimonio) {
  if (!valorPatrimonio || valorPatrimonio <= 0) {
    return { erro: true, mensagem: "Valor do patrimônio deve ser maior que zero." };
  }
  var aliquota = BAHIA_TRIBUTARIO.itcmd.aliquotas.causa_mortis.aliquota;
  return {
    valor_patrimonio: valorPatrimonio,
    aliquota: aliquota,
    percentual: "4%",
    itd: parseFloat((valorPatrimonio * aliquota).toFixed(2))
  };
}


// ═══════════════════════════════════════════════════════════════════════════
//  15. EXPORTAÇÃO (Padrão Grupo 2)
// ═══════════════════════════════════════════════════════════════════════════

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        ...BAHIA_TRIBUTARIO,
        utils: {
            getISS: getISSBahia,
            getIPTUResidencial: getIPTUResidencialBahia,
            getIPTUComercial: getIPTUComercialBahia,
            getIPTUTerreno: getIPTUTerrenoBahia,
            getIPVA: getIPVABahia,
            isZonaFranca: isZonaFrancaBahia,
            isALC: isALCBahia,
            getReducaoSUDAM: getReducaoSUDAMBahia,
            getReducaoSUDENE: getReducaoSUDENEBahia,
            getICMSEfetivo: getICMSEfetivoBahia,
            getAliquotaEfetivaSimples: getAliquotaEfetivaSimplesBahia,
            resumoTributario: resumoTributarioBahia,
            getIncentivosAtivos: getIncentivosAtivosBahia,
            calcularITIV: calcularITIVBahia,
            calcularITD: calcularITDBahia,
        },
    };
}

if (typeof window !== "undefined") {
    window.BAHIA_TRIBUTARIO = BAHIA_TRIBUTARIO;
    window.BahiaTributario = {
        getISS: getISSBahia,
        getIPTUResidencial: getIPTUResidencialBahia,
        getIPTUComercial: getIPTUComercialBahia,
        getIPTUTerreno: getIPTUTerrenoBahia,
        getIPVA: getIPVABahia,
        isZonaFranca: isZonaFrancaBahia,
        isALC: isALCBahia,
        getReducaoSUDAM: getReducaoSUDAMBahia,
        getReducaoSUDENE: getReducaoSUDENEBahia,
        getICMSEfetivo: getICMSEfetivoBahia,
        getAliquotaEfetivaSimples: getAliquotaEfetivaSimplesBahia,
        resumoTributario: resumoTributarioBahia,
        getIncentivosAtivos: getIncentivosAtivosBahia,
        calcularITIV: calcularITIVBahia,
        calcularITD: calcularITDBahia,
    };
}
