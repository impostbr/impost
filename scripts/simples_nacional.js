/**
 * ================================================================================
 * IMPOST. — Inteligência em Modelagem de Otimização Tributária v4.0
 * ================================================================================
 *
 * Motor fiscal otimizado para cálculo do Simples Nacional brasileiro.
 * Compara 4 regimes tributários: Simples Nacional, Lucro Presumido,
 * Lucro Real e Lucro Real + Incentivos (SUDAM/SUDENE/ZFM).
 *
 * Integra com módulos auxiliares:
 *   - cnae-mapeamento.js (CnaeMapeamento) — classificação CNAE em 4 níveis
 *   - estados.js (Estados/EstadosBR)      — dados tributários das 27 UFs
 *   - municipios.js (MunicipiosIBGE)      — ISS municipal via API IBGE
 *
 * @product     IMPOST. — Porque pagar imposto certo é direito. Pagar menos, legalmente, é inteligência.
 * @version     4.1.0
 * @date        2026-02-17
 * @license     Proprietary
 *
 * Base Legal Principal:
 *   - Lei Complementar 123/2006 (Estatuto Nacional da ME e EPP)
 *   - Lei Complementar 147/2014 (Universalização do Simples Nacional)
 *   - Lei Complementar 155/2016 (Alterações LC 123 — Fator "r")
 *   - Resolução CGSN nº 140/2018 (Regulamentação completa)
 *   - Lei Complementar 224/2025 (Reforma Tributária — impactos futuros)
 *   - Lei Complementar 214/2025 (IBS e CBS — Reforma Tributária do Consumo)
 *   - Lei Complementar 227/2026 (Alterações IBS/CBS e processo administrativo)
 *   - Lei nº 15.270/2025 (Tributação de dividendos e IRPF mínimo)
 *   - Resolução CGSN nº 183/2025 (Novas multas PGDAS-D/DEFIS)
 *   - Emenda Constitucional nº 132/2023 (Reforma Tributária do Consumo)
 *
 * Compatibilidade: Node.js (CommonJS) + Browser (ESM/globalThis)
 * Dependências: ZERO (vanilla JavaScript puro)
 * ================================================================================
 */

'use strict';

// ================================================================================
// SEÇÃO 1: CONSTANTES LEGAIS
// ================================================================================

/** Limite de Receita Bruta Anual — Microempresa (LC 123/2006, Art. 3º, I) */
const LIMITE_ME = 360_000.00;

/** Limite de Receita Bruta Anual — Empresa de Pequeno Porte (LC 123/2006, Art. 3º, II — alterado LC 155/2016) */
const LIMITE_EPP = 4_800_000.00;

/** Sublimite estadual para ICMS/ISS (LC 123/2006, Art. 19) */
const SUBLIMITE_ICMS_ISS = 3_600_000.00;

/** Limite de receita mensal proporcional: R$ 4.800.000 / 12 */
const LIMITE_RECEITA_MENSAL_PROPORCIONAL = 400_000.00;

/** Limiar do Fator "r" para determinação de Anexo III vs V (Resolução CGSN 140/2018, Art. 18, §5º-J) */
const LIMITE_FATOR_R = 0.28;

/** Prazo de opção pelo Simples Nacional — empresas já existentes */
const PRAZO_OPCAO = 'Último dia útil de janeiro';

/** Prazo de opção — empresa nova (LC 123/2006, Art. 16, §3º) */
const PRAZO_OPCAO_EMPRESA_NOVA = '30 dias após último deferimento de inscrição';

/** INSS Patronal — Anexo IV: pago por fora do DAS (Art. 22, Lei 8.212/1991) */
const ALIQUOTA_INSS_PATRONAL_ANEXO_IV = 0.20;

/** RAT padrão (varia por CNAE — valor médio para serviços) */
const ALIQUOTA_RAT_PADRAO = 0.02;

/** ISS — Alíquota mínima dentro do DAS (LC 116/2003) */
const ISS_MINIMO = 0.02;

/** ISS — Alíquota máxima dentro do DAS (LC 116/2003) */
const ISS_MAXIMO = 0.05;

/** Ganho de capital — alíquota separada (IN RFB 1.515/2014) */
const ALIQUOTA_GANHO_CAPITAL = 0.15;

/** Percentual de presunção — Comércio/Indústria (para distribuição de lucros sem escrituração) */
const PRESUNCAO_LUCRO_COMERCIO = 0.08;

/** Percentual de presunção — Transporte de cargas */
const PRESUNCAO_LUCRO_TRANSPORTE = 0.16;

/** Percentual de presunção — Serviços em geral */
const PRESUNCAO_LUCRO_SERVICOS = 0.32;

/** Limite para exclusão retroativa: 4.800.000 × 1,20 (LC 123/2006, Art. 30) */
const LIMITE_EXCESSO_20_PORCENTO = 5_760_000.00;

/** FGTS — Alíquota sobre remuneração (Lei 8.036/1990, Art. 15) */
const ALIQUOTA_FGTS = 0.08;

/** INSS empregado — Teto (atualizado periodicamente) */
const TETO_INSS_EMPREGADO = 908.85;


// ================================================================================
// SEÇÃO 2: TABELAS DOS 5 ANEXOS (Faixas + Alíquotas + Deduções)
// ================================================================================

/**
 * Tabelas dos 5 Anexos do Simples Nacional.
 * Cada anexo contém 6 faixas com: min (RBT12 mínimo), max (RBT12 máximo),
 * aliquotaNominal (decimal), deducao (R$).
 *
 * Base legal: Anexos I a V da LC 123/2006, com redação dada pela LC 155/2016.
 * Valores atualizados conforme Resolução CGSN nº 140/2018.
 */
const ANEXOS = {
  I: {
    nome: 'Anexo I — Comércio',
    descricao: 'Empresas de comércio (lojas, restaurantes, etc.)',
    tributosDentro: ['IRPJ', 'CSLL', 'COFINS', 'PIS/PASEP', 'CPP', 'ICMS'],
    tributosFora: ['ISS', 'IPI'],
    cppInclusa: true,
    baseLegal: 'LC 123/2006, Anexo I (redação LC 155/2016)',
    faixas: [
      { faixa: 1, min: 0.00,          max: 180_000.00,   aliquotaNominal: 0.0400, deducao: 0.00 },
      { faixa: 2, min: 180_000.01,    max: 360_000.00,   aliquotaNominal: 0.0730, deducao: 5_940.00 },
      { faixa: 3, min: 360_000.01,    max: 720_000.00,   aliquotaNominal: 0.0950, deducao: 13_860.00 },
      { faixa: 4, min: 720_000.01,    max: 1_800_000.00, aliquotaNominal: 0.1070, deducao: 22_500.00 },
      { faixa: 5, min: 1_800_000.01,  max: 3_600_000.00, aliquotaNominal: 0.1430, deducao: 87_300.00 },
      { faixa: 6, min: 3_600_000.01,  max: 4_800_000.00, aliquotaNominal: 0.1900, deducao: 378_000.00 }
    ]
  },

  II: {
    nome: 'Anexo II — Indústria',
    descricao: 'Empresas industriais (fábricas, manufaturas, etc.)',
    tributosDentro: ['IRPJ', 'CSLL', 'COFINS', 'PIS/PASEP', 'CPP', 'IPI', 'ICMS'],
    tributosFora: ['ISS'],
    cppInclusa: true,
    baseLegal: 'LC 123/2006, Anexo II (redação LC 155/2016)',
    faixas: [
      { faixa: 1, min: 0.00,          max: 180_000.00,   aliquotaNominal: 0.0450, deducao: 0.00 },
      { faixa: 2, min: 180_000.01,    max: 360_000.00,   aliquotaNominal: 0.0780, deducao: 5_940.00 },
      { faixa: 3, min: 360_000.01,    max: 720_000.00,   aliquotaNominal: 0.1000, deducao: 13_860.00 },
      { faixa: 4, min: 720_000.01,    max: 1_800_000.00, aliquotaNominal: 0.1120, deducao: 22_500.00 },
      { faixa: 5, min: 1_800_000.01,  max: 3_600_000.00, aliquotaNominal: 0.1470, deducao: 85_500.00 },
      { faixa: 6, min: 3_600_000.01,  max: 4_800_000.00, aliquotaNominal: 0.3000, deducao: 720_000.00 }
    ]
  },

  III: {
    nome: 'Anexo III — Serviços (Fator "r" ≥ 28%)',
    descricao: 'Prestadores de serviços com Fator "r" igual ou superior a 28%',
    tributosDentro: ['IRPJ', 'CSLL', 'COFINS', 'PIS/PASEP', 'CPP', 'ISS'],
    tributosFora: ['ICMS', 'IPI'],
    cppInclusa: true,
    baseLegal: 'LC 123/2006, Anexo III (redação LC 155/2016); Resolução CGSN 140/2018, Art. 18, §5º-J',
    faixas: [
      { faixa: 1, min: 0.00,          max: 180_000.00,   aliquotaNominal: 0.0600, deducao: 0.00 },
      { faixa: 2, min: 180_000.01,    max: 360_000.00,   aliquotaNominal: 0.1120, deducao: 9_360.00 },
      { faixa: 3, min: 360_000.01,    max: 720_000.00,   aliquotaNominal: 0.1350, deducao: 17_640.00 },
      { faixa: 4, min: 720_000.01,    max: 1_800_000.00, aliquotaNominal: 0.1600, deducao: 35_640.00 },
      { faixa: 5, min: 1_800_000.01,  max: 3_600_000.00, aliquotaNominal: 0.2100, deducao: 125_640.00 },
      { faixa: 6, min: 3_600_000.01,  max: 4_800_000.00, aliquotaNominal: 0.3300, deducao: 648_000.00 }
    ]
  },

  IV: {
    nome: 'Anexo IV — Serviços (SEM CPP — INSS patronal pago por fora)',
    descricao: 'Limpeza, vigilância, construção civil, advocacia. CPP NÃO inclusa no DAS.',
    tributosDentro: ['IRPJ', 'CSLL', 'COFINS', 'PIS/PASEP', 'ISS'],
    tributosFora: ['CPP', 'ICMS', 'IPI'],
    cppInclusa: false,
    baseLegal: 'LC 123/2006, Anexo IV (redação LC 155/2016)',
    faixas: [
      { faixa: 1, min: 0.00,          max: 180_000.00,   aliquotaNominal: 0.0450, deducao: 0.00 },
      { faixa: 2, min: 180_000.01,    max: 360_000.00,   aliquotaNominal: 0.0900, deducao: 8_100.00 },
      { faixa: 3, min: 360_000.01,    max: 720_000.00,   aliquotaNominal: 0.1020, deducao: 12_420.00 },
      { faixa: 4, min: 720_000.01,    max: 1_800_000.00, aliquotaNominal: 0.1400, deducao: 39_780.00 },
      { faixa: 5, min: 1_800_000.01,  max: 3_600_000.00, aliquotaNominal: 0.2200, deducao: 183_780.00 },
      { faixa: 6, min: 3_600_000.01,  max: 4_800_000.00, aliquotaNominal: 0.3300, deducao: 828_000.00 }
    ]
  },

  V: {
    nome: 'Anexo V — Serviços (Fator "r" < 28%)',
    descricao: 'Prestadores de serviços com Fator "r" inferior a 28%',
    tributosDentro: ['IRPJ', 'CSLL', 'COFINS', 'PIS/PASEP', 'CPP', 'ISS'],
    tributosFora: ['ICMS', 'IPI'],
    cppInclusa: true,
    baseLegal: 'LC 123/2006, Anexo V (redação LC 155/2016); Resolução CGSN 140/2018, Art. 18, §5º-J',
    faixas: [
      { faixa: 1, min: 0.00,          max: 180_000.00,   aliquotaNominal: 0.1550, deducao: 0.00 },
      { faixa: 2, min: 180_000.01,    max: 360_000.00,   aliquotaNominal: 0.1800, deducao: 4_500.00 },
      { faixa: 3, min: 360_000.01,    max: 720_000.00,   aliquotaNominal: 0.1950, deducao: 9_900.00 },
      { faixa: 4, min: 720_000.01,    max: 1_800_000.00, aliquotaNominal: 0.2050, deducao: 17_100.00 },
      { faixa: 5, min: 1_800_000.01,  max: 3_600_000.00, aliquotaNominal: 0.2300, deducao: 62_100.00 },
      { faixa: 6, min: 3_600_000.01,  max: 4_800_000.00, aliquotaNominal: 0.3050, deducao: 540_000.00 }
    ]
  }
};


// ================================================================================
// SEÇÃO 3: TABELAS DE PARTILHA DE TRIBUTOS (por faixa, por anexo)
// ================================================================================

/**
 * Percentuais de repartição de tributos dentro do DAS, por faixa, por anexo.
 * Base legal: Resolução CGSN nº 140/2018, Anexos I a V.
 *
 * Cada entrada é um array de 6 objetos (faixas 1-6).
 * Os valores são decimais (ex: 0.055 = 5,50%).
 */
const PARTILHA = {
  I: [
    // Faixa 1
    { irpj: 0.0550, csll: 0.0350, cofins: 0.1274, pis: 0.0276, cpp: 0.4150, icms: 0.3400 },
    // Faixa 2
    { irpj: 0.0550, csll: 0.0350, cofins: 0.1274, pis: 0.0276, cpp: 0.4150, icms: 0.3400 },
    // Faixa 3
    { irpj: 0.0550, csll: 0.0350, cofins: 0.1274, pis: 0.0276, cpp: 0.4200, icms: 0.3350 },
    // Faixa 4
    { irpj: 0.0550, csll: 0.0350, cofins: 0.1274, pis: 0.0276, cpp: 0.4200, icms: 0.3350 },
    // Faixa 5
    { irpj: 0.0550, csll: 0.0350, cofins: 0.1274, pis: 0.0276, cpp: 0.4200, icms: 0.3350 },
    // Faixa 6 — ICMS substituído por zero (recolhido por fora se RBT12 > sublimite)
    { irpj: 0.1350, csll: 0.1000, cofins: 0.2827, pis: 0.0613, cpp: 0.4210, icms: 0.0000 }
  ],

  II: [
    // Faixa 1
    { irpj: 0.0550, csll: 0.0350, cofins: 0.1151, pis: 0.0249, cpp: 0.3750, ipi: 0.0750, icms: 0.3200 },
    // Faixa 2
    { irpj: 0.0550, csll: 0.0350, cofins: 0.1151, pis: 0.0249, cpp: 0.3750, ipi: 0.0750, icms: 0.3200 },
    // Faixa 3
    { irpj: 0.0550, csll: 0.0350, cofins: 0.1151, pis: 0.0249, cpp: 0.3750, ipi: 0.0750, icms: 0.3200 },
    // Faixa 4
    { irpj: 0.0550, csll: 0.0350, cofins: 0.1151, pis: 0.0249, cpp: 0.3750, ipi: 0.0750, icms: 0.3200 },
    // Faixa 5
    { irpj: 0.0550, csll: 0.0350, cofins: 0.1151, pis: 0.0249, cpp: 0.3750, ipi: 0.0750, icms: 0.3200 },
    // Faixa 6 — ICMS zero na 6ª faixa
    { irpj: 0.0850, csll: 0.0750, cofins: 0.2096, pis: 0.0454, cpp: 0.2350, ipi: 0.3500, icms: 0.0000 }
  ],

  III: [
    // Faixa 1
    { irpj: 0.0400, csll: 0.0350, cofins: 0.1282, pis: 0.0278, cpp: 0.4340, iss: 0.3350 },
    // Faixa 2
    { irpj: 0.0400, csll: 0.0350, cofins: 0.1405, pis: 0.0305, cpp: 0.4340, iss: 0.3200 },
    // Faixa 3
    { irpj: 0.0400, csll: 0.0350, cofins: 0.1364, pis: 0.0296, cpp: 0.4340, iss: 0.3250 },
    // Faixa 4
    { irpj: 0.0400, csll: 0.0350, cofins: 0.1364, pis: 0.0296, cpp: 0.4340, iss: 0.3250 },
    // Faixa 5
    { irpj: 0.0400, csll: 0.0350, cofins: 0.1282, pis: 0.0278, cpp: 0.4340, iss: 0.3350 },
    // Faixa 6 — ISS limitado a 5%; excedente transferido para IRPJ
    { irpj: 0.3500, csll: 0.1500, cofins: 0.1603, pis: 0.0347, cpp: 0.3050, iss: 0.0000 }
  ],

  IV: [
    // Faixa 1
    { irpj: 0.1880, csll: 0.1520, cofins: 0.1767, pis: 0.0383, iss: 0.4450 },
    // Faixa 2
    { irpj: 0.1980, csll: 0.1520, cofins: 0.2055, pis: 0.0445, iss: 0.4000 },
    // Faixa 3
    { irpj: 0.2080, csll: 0.1520, cofins: 0.1973, pis: 0.0427, iss: 0.4000 },
    // Faixa 4
    { irpj: 0.1780, csll: 0.1920, cofins: 0.1890, pis: 0.0410, iss: 0.4000 },
    // Faixa 5
    { irpj: 0.1880, csll: 0.1920, cofins: 0.1808, pis: 0.0392, iss: 0.4000 },
    // Faixa 6 — ISS zero na 6ª faixa
    { irpj: 0.5350, csll: 0.2150, cofins: 0.2055, pis: 0.0445, iss: 0.0000 }
  ],

  V: [
    // Faixa 1 — Resolução CGSN 140/2018, Anexo V (valores oficiais: 14,10/12,40/14,10/3,05/28,85/14,10 = 86,60%)
    //           Renormalizados para 100% (÷ 0.866) para partilha correta do DAS
    { irpj: 0.1628, csll: 0.1432, cofins: 0.1628, pis: 0.0352, cpp: 0.3332, iss: 0.1628 },
    // Faixa 2
    { irpj: 0.1628, csll: 0.1432, cofins: 0.1628, pis: 0.0352, cpp: 0.3332, iss: 0.1628 },
    // Faixa 3
    { irpj: 0.1628, csll: 0.1432, cofins: 0.1628, pis: 0.0352, cpp: 0.3332, iss: 0.1628 },
    // Faixa 4
    { irpj: 0.1628, csll: 0.1432, cofins: 0.1628, pis: 0.0352, cpp: 0.3332, iss: 0.1628 },
    // Faixa 5
    { irpj: 0.1628, csll: 0.1432, cofins: 0.1628, pis: 0.0352, cpp: 0.3332, iss: 0.1628 },
    // Faixa 6 — ISS = 0% (recolhido por fora); valores oficiais CGSN 140/2018
    { irpj: 0.3500, csll: 0.1500, cofins: 0.1603, pis: 0.0347, cpp: 0.3050, iss: 0.0000 }
  ]
};


// ================================================================================
// SEÇÃO 4: MAPEAMENTO CNAE → ANEXO
// ================================================================================

/**
 * Mapeamento dos CNAEs mais comuns para seus respectivos anexos.
 *
 * Tipos:
 *   'fixo'    — Sempre o mesmo anexo
 *   'fator_r' — Anexo III se r>=28%, Anexo V se r<28%
 *   'vedado'  — Não pode optar pelo Simples Nacional
 *
 * Base legal: Resolução CGSN nº 140/2018, Anexos VI e VII.
 */
const MAPEAMENTO_CNAE = [
  // === CNAEs dependentes do Fator "r" ===
  {
    cnae: '71.19-7',
    descricao: 'Atividades técnicas relacionadas à engenharia',
    tipo: 'fator_r',
    anexoFixo: null,
    anexoFatorRAlto: 'III',
    anexoFatorRBaixo: 'V',
    observacao: 'AGROGEO BRASIL — Geotecnologia e Consultoria Ambiental'
  },
  {
    cnae: '62.01-5',
    descricao: 'Desenvolvimento de programas de computador sob encomenda',
    tipo: 'fator_r',
    anexoFixo: null,
    anexoFatorRAlto: 'III',
    anexoFatorRBaixo: 'V',
    observacao: 'Desenvolvimento de software customizado'
  },
  {
    cnae: '62.02-3',
    descricao: 'Desenvolvimento e licenciamento de programas de computador customizáveis',
    tipo: 'fator_r',
    anexoFixo: null,
    anexoFatorRAlto: 'III',
    anexoFatorRBaixo: 'V',
    observacao: 'Software SaaS e licenciamento'
  },
  {
    cnae: '69.20-6',
    descricao: 'Atividades de contabilidade, consultoria e auditoria contábil e tributária',
    tipo: 'fator_r',
    anexoFixo: null,
    anexoFatorRAlto: 'III',
    anexoFatorRBaixo: 'V',
    observacao: 'Escritórios de contabilidade'
  },
  {
    cnae: '70.20-4',
    descricao: 'Atividades de consultoria em gestão empresarial',
    tipo: 'fator_r',
    anexoFixo: null,
    anexoFatorRAlto: 'III',
    anexoFatorRBaixo: 'V',
    observacao: 'Consultoria empresarial'
  },
  {
    cnae: '73.11-4',
    descricao: 'Agências de publicidade',
    tipo: 'fator_r',
    anexoFixo: null,
    anexoFatorRAlto: 'III',
    anexoFatorRBaixo: 'V',
    observacao: 'Publicidade e propaganda'
  },
  {
    cnae: '86.30-5',
    descricao: 'Atividade médica ambulatorial com recursos para realização de exames complementares',
    tipo: 'fator_r',
    anexoFixo: null,
    anexoFatorRAlto: 'III',
    anexoFatorRBaixo: 'V',
    observacao: 'Clínicas médicas e consultórios'
  },
  {
    cnae: '63.11-9',
    descricao: 'Tratamento de dados, provedores de serviços de aplicação e hospedagem na internet',
    tipo: 'fator_r',
    anexoFixo: null,
    anexoFatorRAlto: 'III',
    anexoFatorRBaixo: 'V',
    observacao: 'Hospedagem e data centers'
  },
  {
    cnae: '74.90-1',
    descricao: 'Atividades profissionais, científicas e técnicas não especificadas anteriormente',
    tipo: 'fator_r',
    anexoFixo: null,
    anexoFatorRAlto: 'III',
    anexoFatorRBaixo: 'V',
    observacao: 'Serviços técnicos diversos'
  },

  // === CNAEs com Anexo FIXO — Comércio (Anexo I) ===
  {
    cnae: '47.11-3',
    descricao: 'Comércio varejista de mercadorias em geral (supermercados)',
    tipo: 'fixo',
    anexoFixo: 'I',
    anexoFatorRAlto: null,
    anexoFatorRBaixo: null,
    observacao: 'Comércio varejista'
  },
  {
    cnae: '47.51-2',
    descricao: 'Comércio varejista especializado de equipamentos e suprimentos de informática',
    tipo: 'fixo',
    anexoFixo: 'I',
    anexoFatorRAlto: null,
    anexoFatorRBaixo: null,
    observacao: 'Lojas de informática'
  },
  {
    cnae: '47.81-4',
    descricao: 'Comércio varejista de artigos do vestuário e acessórios',
    tipo: 'fixo',
    anexoFixo: 'I',
    anexoFatorRAlto: null,
    anexoFatorRBaixo: null,
    observacao: 'Lojas de roupas'
  },

  // === CNAEs com Anexo FIXO — Indústria (Anexo II) ===
  {
    cnae: '10.91-1',
    descricao: 'Fabricação de produtos de panificação',
    tipo: 'fixo',
    anexoFixo: 'II',
    anexoFatorRAlto: null,
    anexoFatorRBaixo: null,
    observacao: 'Indústria alimentícia — padarias industriais'
  },
  {
    cnae: '10.99-6',
    descricao: 'Fabricação de produtos alimentícios não especificados anteriormente',
    tipo: 'fixo',
    anexoFixo: 'II',
    anexoFatorRAlto: null,
    anexoFatorRBaixo: null,
    observacao: 'Indústria alimentícia geral'
  },

  // === CNAEs com Anexo FIXO — Serviços Anexo IV (SEM CPP) ===
  {
    cnae: '81.21-4',
    descricao: 'Limpeza em prédios e em domicílios',
    tipo: 'fixo',
    anexoFixo: 'IV',
    anexoFatorRAlto: null,
    anexoFatorRBaixo: null,
    observacao: 'Serviços de limpeza — INSS patronal por fora'
  },
  {
    cnae: '80.11-1',
    descricao: 'Atividades de vigilância e segurança privada',
    tipo: 'fixo',
    anexoFixo: 'IV',
    anexoFatorRAlto: null,
    anexoFatorRBaixo: null,
    observacao: 'Vigilância patrimonial — INSS patronal por fora'
  },
  {
    cnae: '41.20-4',
    descricao: 'Construção de edifícios',
    tipo: 'fixo',
    anexoFixo: 'IV',
    anexoFatorRAlto: null,
    anexoFatorRBaixo: null,
    observacao: 'Construção civil — INSS patronal por fora'
  },
  {
    cnae: '69.11-7',
    descricao: 'Atividades jurídicas (advocacia)',
    tipo: 'fixo',
    anexoFixo: 'IV',
    anexoFatorRAlto: null,
    anexoFatorRBaixo: null,
    observacao: 'Escritórios de advocacia — INSS patronal por fora'
  },

  // === CNAEs com Anexo FIXO — Serviços Anexo III ===
  {
    cnae: '66.12-6',
    descricao: 'Corretagem de valores mobiliários e mercadorias',
    tipo: 'fixo',
    anexoFixo: 'III',
    anexoFatorRAlto: null,
    anexoFatorRBaixo: null,
    observacao: 'Corretagem — sempre Anexo III'
  },

  // === CNAEs VEDADOS ===
  {
    cnae: '64.10-7',
    descricao: 'Banco comercial',
    tipo: 'vedado',
    anexoFixo: null,
    anexoFatorRAlto: null,
    anexoFatorRBaixo: null,
    observacao: 'Instituição financeira — vedado (LC 123/2006, Art. 17, I)'
  },
  {
    cnae: '64.91-3',
    descricao: 'Sociedades de fomento mercantil (factoring)',
    tipo: 'vedado',
    anexoFixo: null,
    anexoFatorRAlto: null,
    anexoFatorRBaixo: null,
    observacao: 'Factoring — vedado (LC 123/2006, Art. 17, IV)'
  },
  {
    cnae: '65.11-1',
    descricao: 'Seguros de vida',
    tipo: 'vedado',
    anexoFixo: null,
    anexoFatorRAlto: null,
    anexoFatorRBaixo: null,
    observacao: 'Seguros privados — vedado (LC 123/2006, Art. 17, II)'
  }
];


// ================================================================================
// SEÇÃO 5: VEDAÇÕES AO SIMPLES NACIONAL
// ================================================================================

/**
 * Lista completa de vedações ao ingresso/permanência no Simples Nacional.
 * Base legal: LC 123/2006, Art. 3º, §4º e Art. 17.
 *
 * Cada vedação possui uma função de verificação que recebe os dados da empresa
 * e retorna true se a vedação se aplica (impedindo o Simples).
 */
const VEDACOES = [
  {
    id: 'receita_excedente',
    descricao: 'Receita bruta superior a R$ 4.800.000,00 no ano-calendário anterior',
    baseLegal: 'LC 123/2006, Art. 3º, II',
    verificacao: (dados) => (dados.receitaBrutaAnualAnterior || 0) > LIMITE_EPP
  },
  {
    id: 'sociedade_acoes',
    descricao: 'Constituída sob a forma de sociedade por ações (S/A)',
    baseLegal: 'LC 123/2006, Art. 3º, §4º, I',
    verificacao: (dados) => dados.naturezaJuridica === 'S/A'
  },
  {
    id: 'socio_pessoa_juridica',
    descricao: 'Possui sócio que é pessoa jurídica',
    baseLegal: 'LC 123/2006, Art. 3º, §4º, I',
    verificacao: (dados) => dados.socioPessoaJuridica === true
  },
  {
    id: 'socio_participacao_outra_pj',
    descricao: 'Sócio com mais de 10% em outra PJ não beneficiada, cuja receita global ultrapasse R$ 4,8 milhões',
    baseLegal: 'LC 123/2006, Art. 3º, §4º, IV',
    verificacao: (dados) => dados.socioParticipacaoOutraPJ === true
  },
  {
    id: 'socio_administrador_outra_pj',
    descricao: 'Sócio administrador de outra PJ com fins lucrativos, cuja receita global ultrapasse R$ 4,8 milhões',
    baseLegal: 'LC 123/2006, Art. 3º, §4º, V',
    verificacao: (dados) => dados.socioAdminOutraPJ === true
  },
  {
    id: 'debitos_fiscais',
    descricao: 'Possui débitos fiscais com o INSS ou Fazendas Públicas sem exigibilidade suspensa',
    baseLegal: 'LC 123/2006, Art. 17, V',
    verificacao: (dados) => dados.debitosFiscaisPendentes === true
  },
  {
    id: 'instituicao_financeira',
    descricao: 'Exerce atividade de instituição financeira',
    baseLegal: 'LC 123/2006, Art. 17, I',
    verificacao: (dados) => dados.atividadeInstFinanceira === true
  },
  {
    id: 'factoring',
    descricao: 'Exerce atividade de factoring (fomento mercantil)',
    baseLegal: 'LC 123/2006, Art. 17, IV',
    verificacao: (dados) => dados.atividadeFactoring === true
  },
  {
    id: 'cessao_mao_obra',
    descricao: 'Presta serviço mediante cessão ou locação de mão de obra (exceto Anexo IV)',
    baseLegal: 'LC 123/2006, Art. 17, XII',
    verificacao: (dados) => dados.cessaoMaoObra === true && dados.anexo !== 'IV'
  },
  {
    id: 'socio_exterior',
    descricao: 'Possui sócio ou titular domiciliado no exterior',
    baseLegal: 'LC 123/2006, Art. 3º, §4º, VIII',
    verificacao: (dados) => dados.socioDomiciliadoExterior === true
  },
  {
    id: 'cooperativa',
    descricao: 'Constituída como cooperativa (exceto cooperativa de consumo)',
    baseLegal: 'LC 123/2006, Art. 3º, §4º, VI',
    verificacao: (dados) => dados.tipoCooperativa === true && dados.cooperativaConsumo !== true
  },
  {
    id: 'cisao_recente',
    descricao: 'Empresa resultante de cisão ou qualquer outra forma de desmembramento de PJ ocorrido nos últimos 5 anos',
    baseLegal: 'LC 123/2006, Art. 3º, §4º, IX',
    verificacao: (dados) => dados.resultadoCisao5Anos === true
  },
  {
    id: 'filial_exterior',
    descricao: 'Possui filial, sucursal, agência ou representação no exterior',
    baseLegal: 'LC 123/2006, Art. 3º, §4º, VII',
    verificacao: (dados) => dados.filialExterior === true
  },
  {
    id: 'atividade_vedada',
    descricao: 'Exerce atividade vedada ao Simples Nacional conforme CNAE',
    baseLegal: 'LC 123/2006, Art. 17; Resolução CGSN 140/2018, Anexo VI',
    verificacao: (dados) => {
      const cnaeInfo = MAPEAMENTO_CNAE.find(c => c.cnae === dados.cnae);
      return cnaeInfo ? cnaeInfo.tipo === 'vedado' : false;
    }
  }
];


// ================================================================================
// SEÇÃO 6: OBRIGAÇÕES ACESSÓRIAS
// ================================================================================

/**
 * Obrigações acessórias obrigatórias para empresas do Simples Nacional.
 * Base legal: LC 123/2006, Art. 25 e 26; Resolução CGSN nº 140/2018.
 */
const OBRIGACOES_ACESSORIAS = [
  {
    nome: 'PGDAS-D',
    descricao: 'Programa Gerador do Documento de Arrecadação do Simples Nacional — Declaratório',
    periodicidade: 'Mensal',
    prazo: 'Até o dia 20 do mês subsequente ao da apuração',
    obrigatoria: true,
    baseLegal: 'Resolução CGSN nº 140/2018, Art. 38',
    observacao: 'Declaração mensal de receitas e cálculo do DAS. Transmitido pela internet.'
  },
  {
    nome: 'DEFIS',
    descricao: 'Declaração de Informações Socioeconômicas e Fiscais',
    periodicidade: 'Anual',
    prazo: 'Até 31 de março do ano-calendário subsequente',
    obrigatoria: true,
    baseLegal: 'Resolução CGSN nº 140/2018, Art. 72',
    observacao: 'Substitui a DASN a partir de 2013. Contém dados socioeconômicos e fiscais.'
  },
  {
    nome: 'e-Social',
    descricao: 'Sistema de Escrituração Digital das Obrigações Fiscais, Previdenciárias e Trabalhistas',
    periodicidade: 'Mensal',
    prazo: 'Conforme cronograma do e-Social (eventos periódicos até dia 15)',
    obrigatoria: true,
    baseLegal: 'Decreto 8.373/2014; Resolução CGSN 140/2018',
    observacao: 'Unifica envio de informações trabalhistas, previdenciárias e fiscais.'
  },
  {
    nome: 'DIRF',
    descricao: 'Declaração do Imposto de Renda Retido na Fonte',
    periodicidade: 'Anual',
    prazo: 'Último dia útil de fevereiro do ano subsequente',
    obrigatoria: true,
    baseLegal: 'IN RFB nº 1.990/2020',
    observacao: 'Informa valores de IR retidos na fonte sobre pagamentos a terceiros.'
  },
  {
    nome: 'EFD-Reinf',
    descricao: 'Escrituração Fiscal Digital de Retenções e Outras Informações Fiscais',
    periodicidade: 'Mensal',
    prazo: 'Até o dia 15 do mês subsequente',
    obrigatoria: true,
    baseLegal: 'IN RFB nº 2.043/2021',
    observacao: 'Complementa o e-Social com informações de retenções de tributos.'
  },
  {
    nome: 'NF-e / NFS-e',
    descricao: 'Nota Fiscal Eletrônica / Nota Fiscal de Serviços Eletrônica',
    periodicidade: 'Por operação',
    prazo: 'No momento da operação de venda ou prestação de serviço',
    obrigatoria: true,
    baseLegal: 'Ajuste SINIEF 07/2005; LC 116/2003; legislação municipal',
    observacao: 'Obrigatória para todas as operações. NFS-e conforme município.'
  },
  {
    nome: 'Livro Caixa',
    descricao: 'Livro Caixa com escrituração contábil simplificada',
    periodicidade: 'Contínua',
    prazo: 'Permanente — manter em dia',
    obrigatoria: true,
    baseLegal: 'LC 123/2006, Art. 26, II; Resolução CGSN 140/2018, Art. 63',
    observacao: 'Obrigatório se não mantiver escrituração contábil completa. Recomenda-se a completa para distribuição de lucros.'
  },
  {
    nome: 'DCTFWeb',
    descricao: 'Declaração de Débitos e Créditos Tributários Federais Previdenciários e de Outras Entidades e Fundos',
    periodicidade: 'Mensal',
    prazo: 'Até o dia 15 do mês seguinte ao da ocorrência dos fatos geradores',
    obrigatoria: true,
    baseLegal: 'IN RFB nº 2.005/2021',
    observacao: 'Obrigatória para empresas do Simples com empregados.'
  }
];


// ================================================================================
// SEÇÃO 7: FUNÇÃO — calcularFatorR()
// ================================================================================

/**
 * Calcula o Fator "r" da empresa e determina o anexo aplicável.
 *
 * O Fator "r" é a razão entre a folha de salários dos últimos 12 meses
 * (incluindo pró-labore, salários, FGTS e encargos sobre a folha)
 * e a receita bruta total do mesmo período.
 *
 * Base legal: Resolução CGSN nº 140/2018, Art. 18, §5º-J e §5º-M.
 *
 * @param {Object} params - Parâmetros de entrada
 * @param {number} params.folhaSalarios12Meses - Folha total dos últimos 12 meses (inclui pro-labore, salários, FGTS, encargos)
 * @param {number} params.receitaBruta12Meses - RBT12 (Receita Bruta dos últimos 12 meses)
 * @returns {Object} Resultado do cálculo do Fator "r"
 */
function calcularFatorR(params) {
  const { folhaSalarios12Meses, receitaBruta12Meses } = params;

  if (!receitaBruta12Meses || receitaBruta12Meses <= 0) {
    throw new Error('[FATOR_R_001] Receita bruta dos últimos 12 meses deve ser maior que zero.');
  }
  if (folhaSalarios12Meses < 0) {
    throw new Error('[FATOR_R_002] Folha de salários não pode ser negativa.');
  }

  const fatorR = folhaSalarios12Meses / receitaBruta12Meses;
  const acimaDoLimiar = fatorR >= LIMITE_FATOR_R;
  const anexoResultante = acimaDoLimiar ? 'III' : 'V';

  // Alerta de flutuação: entre 25% e 31%
  let observacao = '';
  if (fatorR >= 0.25 && fatorR < 0.28) {
    observacao = '⚠️ ALERTA: Fator "r" muito próximo do limiar (25%-28%). Risco de cair no Anexo V no próximo mês. Considere aumentar a folha de salários.';
  } else if (fatorR >= 0.28 && fatorR <= 0.31) {
    observacao = '⚠️ ALERTA: Fator "r" próximo do limiar (28%-31%). Pequenas variações na folha ou receita podem alterar o anexo. Monitore mensalmente.';
  } else if (acimaDoLimiar) {
    observacao = '✅ Fator "r" confortavelmente acima do limiar de 28%. Enquadrado no Anexo III (alíquotas menores).';
  } else {
    observacao = '❌ Fator "r" abaixo de 28%. Enquadrado no Anexo V (alíquotas mais altas). Considere estratégias para aumentar a folha.';
  }

  return {
    folhaSalarios12Meses: _arredondar(folhaSalarios12Meses),
    receitaBruta12Meses: _arredondar(receitaBruta12Meses),
    fatorR: _arredondar(fatorR, 4),
    fatorRPercentual: (fatorR * 100).toFixed(2).replace('.', ',') + '%',
    limiar: LIMITE_FATOR_R,
    limiarPercentual: '28,00%',
    acimaDoLimiar,
    anexoResultante,
    observacao,
    baseLegal: 'Resolução CGSN nº 140/2018, Art. 18, §5º-J'
  };
}


// ================================================================================
// SEÇÃO 8: FUNÇÃO — determinarAnexo()
// ================================================================================

/**
 * Determina o anexo aplicável com base no CNAE e, quando necessário, no Fator "r".
 *
 * @param {Object} params - Parâmetros de entrada
 * @param {string} params.cnae - Código CNAE da atividade principal
 * @param {number} [params.fatorR] - Fator "r" (obrigatório se CNAE é tipo 'fator_r')
 * @returns {Object} Informações do anexo determinado
 */
function determinarAnexo(params) {
  const { cnae, fatorR } = params;

  if (!cnae) {
    throw new Error('[ANEXO_001] CNAE é obrigatório para determinar o anexo.');
  }

  const cnaeInfo = MAPEAMENTO_CNAE.find(c => c.cnae === cnae);

  if (!cnaeInfo) {
    // Tenta match parcial (primeiros 2 dígitos)
    const prefixo = cnae.substring(0, 2);
    const cnaeGenerico = MAPEAMENTO_CNAE.find(c => c.cnae.startsWith(prefixo));
    if (!cnaeGenerico) {
      throw new Error(`[ANEXO_002] CNAE ${cnae} não encontrado no mapeamento. Verifique o código ou adicione ao mapeamento.`);
    }
    // Usa o genérico como fallback
    return _montarResultadoAnexo(cnaeGenerico, fatorR);
  }

  return _montarResultadoAnexo(cnaeInfo, fatorR);
}

/**
 * Monta o resultado da determinação de anexo.
 * @private
 */
function _montarResultadoAnexo(cnaeInfo, fatorR) {
  if (cnaeInfo.tipo === 'vedado') {
    return {
      cnae: cnaeInfo.cnae,
      descricao: cnaeInfo.descricao,
      anexo: null,
      vedado: true,
      motivo: cnaeInfo.observacao,
      baseLegal: 'LC 123/2006, Art. 17'
    };
  }

  let anexo;
  let motivoAnexo;

  if (cnaeInfo.tipo === 'fixo') {
    anexo = cnaeInfo.anexoFixo;
    motivoAnexo = `CNAE ${cnaeInfo.cnae} tem anexo fixo: ${anexo}`;
  } else if (cnaeInfo.tipo === 'fator_r') {
    if (fatorR === undefined || fatorR === null) {
      throw new Error(`[ANEXO_003] Fator "r" é obrigatório para CNAE ${cnaeInfo.cnae} (tipo fator_r).`);
    }
    if (fatorR >= LIMITE_FATOR_R) {
      anexo = cnaeInfo.anexoFatorRAlto;
      motivoAnexo = `Fator "r" = ${(fatorR * 100).toFixed(2)}% (≥ 28%) → Anexo ${anexo}`;
    } else {
      anexo = cnaeInfo.anexoFatorRBaixo;
      motivoAnexo = `Fator "r" = ${(fatorR * 100).toFixed(2)}% (< 28%) → Anexo ${anexo}`;
    }
  }

  const dadosAnexo = ANEXOS[anexo];

  return {
    cnae: cnaeInfo.cnae,
    descricao: cnaeInfo.descricao,
    tipo: cnaeInfo.tipo,
    anexo,
    descricaoAnexo: dadosAnexo.nome,
    cppInclusa: dadosAnexo.cppInclusa,
    tributosDentro: dadosAnexo.tributosDentro,
    tributosFora: dadosAnexo.tributosFora,
    motivoAnexo,
    vedado: false,
    baseLegal: dadosAnexo.baseLegal
  };
}


// ================================================================================
// SEÇÃO 9: FUNÇÃO — calcularAliquotaEfetiva()
// ================================================================================

/**
 * Calcula a alíquota efetiva do Simples Nacional.
 *
 * Fórmula: aliquotaEfetiva = (RBT12 × aliquotaNominal − parcelaADeduzir) / RBT12
 *
 * Base legal: LC 123/2006, Art. 18; Resolução CGSN 140/2018, Art. 21.
 *
 * @param {Object} params - Parâmetros de entrada
 * @param {number} params.rbt12 - Receita Bruta acumulada nos últimos 12 meses
 * @param {string} params.anexo - Identificador do anexo: 'I', 'II', 'III', 'IV', 'V'
 * @returns {Object} Resultado do cálculo da alíquota efetiva
 */
function calcularAliquotaEfetiva(params) {
  const { rbt12, anexo } = params;

  if (!rbt12 || rbt12 <= 0) {
    throw new Error('[ALIQ_001] RBT12 deve ser maior que zero.');
  }
  if (!ANEXOS[anexo]) {
    throw new Error(`[ALIQ_002] Anexo "${anexo}" inválido. Use I, II, III, IV ou V.`);
  }
  if (rbt12 > LIMITE_EPP) {
    throw new Error(`[ALIQ_003] RBT12 (${_formatarMoeda(rbt12)}) excede o limite do Simples Nacional (${_formatarMoeda(LIMITE_EPP)}).`);
  }

  const faixaObj = getFaixaByRBT12(rbt12, anexo);

  if (!faixaObj) {
    throw new Error(`[ALIQ_004] Não foi possível determinar a faixa para RBT12=${_formatarMoeda(rbt12)} no Anexo ${anexo}.`);
  }

  const numerador = (rbt12 * faixaObj.aliquotaNominal) - faixaObj.deducao;
  const aliquotaEfetiva = numerador / rbt12;

  const faixaDescricoes = ['', '1ª Faixa', '2ª Faixa', '3ª Faixa', '4ª Faixa', '5ª Faixa', '6ª Faixa'];

  return {
    rbt12: _arredondar(rbt12),
    anexo,
    faixa: faixaObj.faixa,
    faixaDescricao: faixaDescricoes[faixaObj.faixa] || `${faixaObj.faixa}ª Faixa`,
    rbt12MinFaixa: _arredondar(faixaObj.min),
    rbt12MaxFaixa: _arredondar(faixaObj.max),
    aliquotaNominal: faixaObj.aliquotaNominal,
    aliquotaNominalFormatada: (faixaObj.aliquotaNominal * 100).toFixed(2).replace('.', ',') + '%',
    parcelaADeduzir: _arredondar(faixaObj.deducao),
    aliquotaEfetiva: _arredondar(aliquotaEfetiva, 6),
    aliquotaEfetivaFormatada: (aliquotaEfetiva * 100).toFixed(4).replace('.', ',') + '%',
    baseLegal: 'LC 123/2006, Art. 18, §1º'
  };
}


// ================================================================================
// SEÇÃO 10: FUNÇÃO — calcularDASMensal()
// ================================================================================

/**
 * Calcula o valor do DAS mensal, incluindo partilha de tributos.
 *
 * @param {Object} params - Parâmetros de entrada
 * @param {number} params.receitaBrutaMensal - Receita bruta do mês de apuração
 * @param {number} params.rbt12 - Receita Bruta acumulada nos últimos 12 meses
 * @param {string} params.anexo - Identificador do anexo
 * @param {number} [params.issRetidoFonte=0] - Valor de ISS retido na fonte pelo tomador
 * @param {number} [params.folhaMensal=0] - Folha de pagamento mensal (para cálculo INSS Anexo IV)
 * @param {number} [params.aliquotaRAT=0.02] - Alíquota RAT (para Anexo IV)
 * @returns {Object} Resultado completo do cálculo do DAS mensal
 */
function calcularDASMensal(params) {
  const {
    receitaBrutaMensal,
    rbt12,
    anexo,
    issRetidoFonte = 0,
    folhaMensal = 0,
    aliquotaRAT = ALIQUOTA_RAT_PADRAO
  } = params;

  if (!receitaBrutaMensal || receitaBrutaMensal <= 0) {
    throw new Error('[DAS_001] Receita bruta mensal deve ser maior que zero.');
  }

  // 1. Calcular alíquota efetiva
  const aliqResult = calcularAliquotaEfetiva({ rbt12, anexo });

  // 2. Calcular DAS bruto
  const dasValor = _arredondar(receitaBrutaMensal * aliqResult.aliquotaEfetiva);

  // 3. Calcular partilha de tributos
  const partilha = calcularPartilhaTributos(dasValor, aliqResult.faixa, anexo, receitaBrutaMensal, aliqResult.aliquotaEfetiva);

  // 4. ISS retido na fonte — deduzir do DAS
  const issRetido = _arredondar(Math.min(issRetidoFonte, partilha.iss ? partilha.iss.valor : 0));

  // 5. DAS a pagar (após dedução do ISS retido)
  const dasAPagar = _arredondar(Math.max(0, dasValor - issRetido));

  // 6. INSS patronal por fora (apenas Anexo IV)
  let inssPatronalFora = 0;
  if (anexo === 'IV') {
    inssPatronalFora = _arredondar(folhaMensal * (ALIQUOTA_INSS_PATRONAL_ANEXO_IV + aliquotaRAT));
  }

  // 7. Total a pagar
  const totalAPagar = _arredondar(dasAPagar + inssPatronalFora);

  return {
    receitaBrutaMensal: _arredondar(receitaBrutaMensal),
    rbt12: _arredondar(rbt12),
    anexo,
    descricaoAnexo: ANEXOS[anexo].nome,
    faixa: aliqResult.faixa,
    faixaDescricao: aliqResult.faixaDescricao,
    aliquotaNominal: aliqResult.aliquotaNominal,
    aliquotaNominalFormatada: aliqResult.aliquotaNominalFormatada,
    aliquotaEfetiva: aliqResult.aliquotaEfetiva,
    aliquotaEfetivaFormatada: aliqResult.aliquotaEfetivaFormatada,
    dasValor,
    partilha,
    issRetidoFonte: issRetido,
    dasAPagar,
    inssPatronalFora,
    totalAPagar,
    baseLegal: 'LC 123/2006, Art. 18; Resolução CGSN 140/2018, Art. 21'
  };
}


// ================================================================================
// SEÇÃO 11: FUNÇÃO — calcularAnualConsolidado()
// ================================================================================

/**
 * Calcula a consolidação anual do Simples Nacional (12 meses).
 *
 * @param {Object} params - Parâmetros de entrada
 * @param {Array<Object>} params.meses - Array de 12 objetos com dados mensais
 * @param {Array<Object>} params.socios - Array de sócios com {nome, percentual}
 * @param {number} [params.lucroContabilEfetivo] - Lucro contábil efetivo (se houver escrituração)
 * @param {number} [params.aliquotaRAT=0.02] - Alíquota RAT
 * @returns {Object} Consolidação anual completa
 */
function calcularAnualConsolidado(params) {
  const {
    meses,
    socios = [],
    cnae = null,
    tipoAtividade = 'servicos',
    lucroContabilEfetivo = null,
    aliquotaRAT = ALIQUOTA_RAT_PADRAO
  } = params;

  if (!meses || !Array.isArray(meses) || meses.length === 0) {
    throw new Error('[ANUAL_001] Deve fornecer array de meses com dados mensais.');
  }

  const detalhamentoMensal = [];
  let receitaBrutaAnual = 0;
  let dasAnual = 0;
  let inssPatronalAnualFora = 0;
  let folhaAnual = 0;

  // Acumuladores de partilha anual
  const partilhaAnual = {
    irpj: 0, csll: 0, cofins: 0, pis: 0,
    cpp: 0, iss: 0, icms: 0, ipi: 0
  };

  for (let i = 0; i < meses.length; i++) {
    const mes = meses[i];
    const receitaMensal = mes.receitaBrutaMensal || 0;
    const rbt12 = mes.rbt12 || 0;
    const folhaMensal = mes.folhaMensal || 0;
    const issRetido = mes.issRetidoFonte || 0;

    // Determinar anexo para o mês
    let anexoMes = mes.anexo;
    if (!anexoMes && mes.folhaSalarios12Meses && rbt12) {
      const fr = calcularFatorR({
        folhaSalarios12Meses: mes.folhaSalarios12Meses,
        receitaBruta12Meses: rbt12
      });
      anexoMes = fr.anexoResultante;
    }

    if (receitaMensal <= 0 || !anexoMes) {
      detalhamentoMensal.push({
        mes: i + 1,
        receitaBrutaMensal: 0,
        dasAPagar: 0,
        inssPatronalFora: 0,
        totalAPagar: 0,
        observacao: 'Mês sem receita ou sem anexo definido'
      });
      continue;
    }

    const resultado = calcularDASMensal({
      receitaBrutaMensal: receitaMensal,
      rbt12,
      anexo: anexoMes,
      issRetidoFonte: issRetido,
      folhaMensal,
      aliquotaRAT
    });

    receitaBrutaAnual += receitaMensal;
    dasAnual += resultado.dasAPagar;
    inssPatronalAnualFora += resultado.inssPatronalFora;
    folhaAnual += folhaMensal;

    // Acumular partilha
    if (resultado.partilha) {
      for (const tributo of Object.keys(partilhaAnual)) {
        if (resultado.partilha[tributo]) {
          partilhaAnual[tributo] += resultado.partilha[tributo].valor || 0;
        }
      }
    }

    detalhamentoMensal.push({
      mes: i + 1,
      ...resultado
    });
  }

  // FGTS anual (8% sobre folha bruta)
  const fgtsAnual = _arredondar(folhaAnual * ALIQUOTA_FGTS);

  // Carga tributária total
  const cargaTributariaTotal = _arredondar(dasAnual + inssPatronalAnualFora + fgtsAnual);
  const percentualCarga = receitaBrutaAnual > 0
    ? _arredondar(cargaTributariaTotal / receitaBrutaAnual, 4)
    : 0;

  // Distribuição de lucros
  const distribuicaoLucros = calcularDistribuicaoLucros({
    receitaBrutaAnual,
    dasAnual,
    socios,
    cnae: cnae || null,
    lucroContabilEfetivo,
    tipoAtividade: tipoAtividade || 'servicos'
  });

  // Arredondar partilha anual
  for (const k of Object.keys(partilhaAnual)) {
    partilhaAnual[k] = _arredondar(partilhaAnual[k]);
  }

  return {
    receitaBrutaAnual: _arredondar(receitaBrutaAnual),
    dasAnual: _arredondar(dasAnual),
    partilhaAnual,
    inssPatronalAnualFora: _arredondar(inssPatronalAnualFora),
    fgtsAnual,
    folhaAnual: _arredondar(folhaAnual),
    cargaTributariaTotal,
    percentualCarga,
    percentualCargaFormatado: (percentualCarga * 100).toFixed(2).replace('.', ',') + '%',
    distribuicaoLucros,
    detalhamentoMensal,
    totalMeses: meses.length,
    baseLegal: 'LC 123/2006; Resolução CGSN 140/2018'
  };
}


// ================================================================================
// SEÇÃO 12: FUNÇÃO — calcularPartilhaTributos()
// ================================================================================

/**
 * Calcula a partilha de tributos a partir do valor do DAS.
 *
 * @param {number} dasValor - Valor total do DAS
 * @param {number} faixa - Número da faixa (1-6)
 * @param {string} anexo - Identificador do anexo
 * @param {number} [receitaBrutaMensal=0] - Receita bruta mensal (para regra do ISS)
 * @param {number} [aliquotaEfetiva=0] - Alíquota efetiva (para regra do ISS)
 * @returns {Object} Partilha detalhada de cada tributo
 */
function calcularPartilhaTributos(dasValor, faixa, anexo, receitaBrutaMensal = 0, aliquotaEfetiva = 0) {
  if (!PARTILHA[anexo]) {
    throw new Error(`[PARTILHA_001] Partilha não disponível para Anexo "${anexo}".`);
  }

  const idx = faixa - 1;
  if (idx < 0 || idx >= PARTILHA[anexo].length) {
    throw new Error(`[PARTILHA_002] Faixa ${faixa} inválida para Anexo ${anexo}.`);
  }

  const percentuais = PARTILHA[anexo][idx];
  const resultado = {};

  // Lista de todos os tributos possíveis
  const tributos = ['irpj', 'csll', 'cofins', 'pis', 'cpp', 'iss', 'icms', 'ipi'];

  for (const tributo of tributos) {
    const perc = percentuais[tributo] || 0;
    let valor = _arredondar(dasValor * perc);

    resultado[tributo] = {
      percentual: perc,
      percentualFormatado: (perc * 100).toFixed(2).replace('.', ',') + '%',
      valor
    };
  }

  // REGRA ESPECIAL ISS — Limitar a 5% e transferir excedente para IRPJ
  if (resultado.iss && resultado.iss.percentual > 0 && receitaBrutaMensal > 0) {
    const issEfetivo = aliquotaEfetiva * resultado.iss.percentual;
    if (issEfetivo > ISS_MAXIMO) {
      const issLimitado = _arredondar(receitaBrutaMensal * ISS_MAXIMO);
      const excedente = _arredondar(resultado.iss.valor - issLimitado);
      resultado.iss.valor = issLimitado;
      resultado.iss.limitadoA5Porcento = true;
      resultado.iss.excedenteTransferidoIRPJ = excedente;
      resultado.irpj.valor = _arredondar(resultado.irpj.valor + excedente);
      resultado.irpj.incluiExcedenteISS = true;
    }
  }

  return resultado;
}


// ================================================================================
// SEÇÃO 13: FUNÇÃO — verificarElegibilidade()
// ================================================================================

/**
 * Verifica se a empresa é elegível ao Simples Nacional.
 *
 * @param {Object} dados - Dados da empresa
 * @param {number} dados.receitaBrutaAnual - Receita bruta anual atual
 * @param {number} [dados.receitaBrutaAnualAnterior] - Receita bruta do ano anterior
 * @param {string} [dados.cnae] - CNAE principal
 * @param {string} [dados.naturezaJuridica] - Natureza jurídica
 * @param {boolean} [dados.socioPessoaJuridica=false] - Se há sócio PJ
 * @param {boolean} [dados.socioParticipacaoOutraPJ=false] - Se sócio tem >10% em outra PJ
 * @param {boolean} [dados.socioAdminOutraPJ=false] - Se sócio é admin de outra PJ
 * @param {boolean} [dados.debitosFiscaisPendentes=false] - Se há débitos pendentes
 * @param {boolean} [dados.atividadeInstFinanceira=false] - Se é instituição financeira
 * @param {boolean} [dados.atividadeFactoring=false] - Se é factoring
 * @param {boolean} [dados.cessaoMaoObra=false] - Se há cessão de mão de obra
 * @param {boolean} [dados.socioDomiciliadoExterior=false] - Se há sócio no exterior
 * @param {boolean} [dados.tipoCooperativa=false] - Se é cooperativa
 * @param {boolean} [dados.resultadoCisao5Anos=false] - Se é resultado de cisão nos últimos 5 anos
 * @param {boolean} [dados.filialExterior=false] - Se possui filial no exterior
 * @param {number} [dados.fatorR] - Fator "r" atual
 * @returns {Object} Resultado da verificação de elegibilidade
 */
function verificarElegibilidade(dados) {
  const impedimentos = [];
  const alertas = [];

  // Verificar todas as vedações
  for (const vedacao of VEDACOES) {
    try {
      if (vedacao.verificacao(dados)) {
        impedimentos.push({
          id: vedacao.id,
          descricao: vedacao.descricao,
          baseLegal: vedacao.baseLegal
        });
      }
    } catch (e) {
      // Dados insuficientes para verificar — ignora
    }
  }

  // Classificação ME / EPP
  const rb = dados.receitaBrutaAnual || 0;
  let classificacao = null;
  if (rb <= LIMITE_ME) {
    classificacao = 'ME';
  } else if (rb <= LIMITE_EPP) {
    classificacao = 'EPP';
  }

  // Alertas automáticos
  // 1. Proximidade do limite
  if (rb > LIMITE_EPP * 0.80) {
    alertas.push({
      tipo: 'proximidade_limite',
      mensagem: `⚠️ Receita bruta (${_formatarMoeda(rb)}) está acima de 80% do limite (${_formatarMoeda(LIMITE_EPP * 0.80)}). Monitore para evitar exclusão.`
    });
  }

  // 2. Sublimite estadual
  const sublimiteUltrapassou = rb > SUBLIMITE_ICMS_ISS;
  if (sublimiteUltrapassou) {
    alertas.push({
      tipo: 'sublimite_ultrapassado',
      mensagem: `⚠️ Receita bruta (${_formatarMoeda(rb)}) ultrapassou o sublimite de ${_formatarMoeda(SUBLIMITE_ICMS_ISS)}. ICMS e ISS serão recolhidos POR FORA do DAS.`
    });
  }

  // 3. Fator "r" próximo do limiar
  if (dados.fatorR !== undefined && dados.fatorR !== null) {
    if (dados.fatorR >= 0.25 && dados.fatorR < 0.28) {
      alertas.push({
        tipo: 'fator_r_critico',
        mensagem: `⚠️ Fator "r" (${(dados.fatorR * 100).toFixed(2)}%) está entre 25% e 28%. Risco iminente de migrar para Anexo V (alíquotas mais altas).`
      });
    } else if (dados.fatorR >= 0.28 && dados.fatorR <= 0.31) {
      alertas.push({
        tipo: 'fator_r_flutuante',
        mensagem: `⚠️ Fator "r" (${(dados.fatorR * 100).toFixed(2)}%) está próximo do limiar (28%-31%). Monitore mensalmente.`
      });
    }
  }

  // 4. Exclusão por excesso > 20%
  if (rb > LIMITE_EXCESSO_20_PORCENTO) {
    alertas.push({
      tipo: 'exclusao_retroativa',
      mensagem: `🚨 CRÍTICO: Receita bruta (${_formatarMoeda(rb)}) excede 20% do limite (${_formatarMoeda(LIMITE_EXCESSO_20_PORCENTO)}). Exclusão RETROATIVA ao início do ano-calendário!`
    });
  }

  return {
    elegivel: impedimentos.length === 0 && rb <= LIMITE_EPP,
    classificacao,
    impedimentos,
    alertas,
    sublimiteEstadual: {
      ultrapassou: sublimiteUltrapassou,
      icmsISSPorFora: sublimiteUltrapassou,
      observacao: sublimiteUltrapassou
        ? 'ICMS e ISS devem ser recolhidos por fora do DAS, pelo regime normal de apuração.'
        : 'Todos os tributos são recolhidos dentro do DAS.'
    },
    baseLegal: 'LC 123/2006, Arts. 3º, 17, 19 e 30'
  };
}


// ================================================================================
// SEÇÃO 14: FUNÇÃO — calcularDistribuicaoLucros()
// ================================================================================

/**
 * Calcula a distribuição de lucros aos sócios.
 *
 * Duas modalidades:
 * 1. SEM escrituração contábil: Lucro isento = (Receita × Percentual Presunção) − DAS
 * 2. COM escrituração contábil: Lucro isento = Lucro Contábil − DAS
 *
 * Base legal: LC 123/2006, Art. 14; RIR/2018, Art. 145.
 *
 * @param {Object} params
 * @param {number} params.receitaBrutaAnual
 * @param {number} params.dasAnual
 * @param {Array<Object>} params.socios - Array de {nome, percentual}
 * @param {string} [params.cnae='71.19-7']
 * @param {number|null} [params.lucroContabilEfetivo=null]
 * @param {string} [params.tipoAtividade='servicos'] - 'comercio', 'transporte', 'servicos'
 * @returns {Object} Detalhamento da distribuição de lucros
 */
function calcularDistribuicaoLucros(params) {
  const {
    receitaBrutaAnual,
    dasAnual,
    socios = [],
    cnae = null,
    lucroContabilEfetivo = null,
    tipoAtividade = 'servicos'
  } = params;

  // Determinar percentual de presunção — usar CnaeMapeamento se disponível
  let percentualPresuncao;
  switch (tipoAtividade) {
    case 'comercio':
    case 'industria':
      percentualPresuncao = PRESUNCAO_LUCRO_COMERCIO;
      break;
    case 'transporte':
      percentualPresuncao = PRESUNCAO_LUCRO_TRANSPORTE;
      break;
    case 'servicos':
    default:
      percentualPresuncao = PRESUNCAO_LUCRO_SERVICOS;
      break;
  }

  const basePresumida = _arredondar(receitaBrutaAnual * percentualPresuncao);
  const lucroDistribuivelPresumido = _arredondar(Math.max(0, basePresumida - dasAnual));

  const temEscrituracaoContabil = lucroContabilEfetivo !== null && lucroContabilEfetivo !== undefined;
  let lucroDistribuivelContabil = null;
  if (temEscrituracaoContabil) {
    lucroDistribuivelContabil = _arredondar(Math.max(0, lucroContabilEfetivo - dasAnual));
  }

  // O lucro distribuível final é o MAIOR entre presunção e contábil
  const lucroDistribuivelFinal = temEscrituracaoContabil
    ? Math.max(lucroDistribuivelPresumido, lucroDistribuivelContabil)
    : lucroDistribuivelPresumido;

  // Distribuição por sócio
  const porSocio = socios.map(socio => ({
    nome: socio.nome,
    percentual: socio.percentual,
    percentualFormatado: (socio.percentual * 100).toFixed(0) + '%',
    valorIsento: _arredondar(lucroDistribuivelFinal * socio.percentual),
    valorIsentoFormatado: _formatarMoeda(lucroDistribuivelFinal * socio.percentual)
  }));

  return {
    comEscrituracaoContabil: temEscrituracaoContabil,
    percentualPresuncao,
    percentualPresuncaoFormatado: (percentualPresuncao * 100).toFixed(0) + '%',
    receitaBrutaAnual: _arredondar(receitaBrutaAnual),
    basePresumida,
    lucroContabilEfetivo: temEscrituracaoContabil ? _arredondar(lucroContabilEfetivo) : null,
    dasAnual: _arredondar(dasAnual),
    lucroDistribuivelPresumido,
    lucroDistribuivelContabil,
    lucroDistribuivelFinal: _arredondar(lucroDistribuivelFinal),
    modalidadeUtilizada: temEscrituracaoContabil ? 'Escrituração Contábil' : 'Presunção (sem escrituração)',
    porSocio,
    alertas: [],
    baseLegal: 'LC 123/2006, Art. 14; RIR/2018, Art. 145'
  };
}


// ================================================================================
// SEÇÃO 15: FUNÇÃO — analisarVantagensDesvantagens()
// ================================================================================

/**
 * Analisa vantagens e desvantagens do Simples Nacional para a empresa.
 *
 * @param {Object} params
 * @param {number} params.receitaBrutaAnual
 * @param {string} params.anexo
 * @param {number} params.fatorR
 * @param {boolean} [params.localizacaoSUDAM=false]
 * @param {boolean} [params.vendeParaPJ=false]
 * @param {number} [params.folhaAnual=0]
 * @param {boolean} [params.exporta=false]
 * @returns {Object} Análise de vantagens e desvantagens
 */
function analisarVantagensDesvantagens(params) {
  const {
    receitaBrutaAnual = 0,
    anexo = 'III',
    fatorR = 0,
    localizacaoSUDAM = false,
    vendeParaPJ = false,
    folhaAnual = 0,
    exporta = false
  } = params;

  const isAnexoIV = anexo === 'IV';
  const isAnexoV = anexo === 'V';
  const receitaAlta = receitaBrutaAnual > 2_400_000;
  const fatorRProximo = fatorR >= 0.25 && fatorR < 0.31;

  // === VANTAGENS (mínimo 14) ===
  const vantagens = [
    {
      titulo: 'Unificação de tributos em guia única (DAS)',
      descricao: 'Até 8 tributos (IRPJ, CSLL, PIS, COFINS, CPP, ICMS, ISS, IPI) recolhidos em uma única guia mensal, simplificando enormemente a gestão tributária.',
      impacto: 'alto',
      aplicavel: true
    },
    {
      titulo: 'Alíquotas reduzidas nas faixas iniciais',
      descricao: `Com RBT12 de ${_formatarMoeda(receitaBrutaAnual)}, a alíquota efetiva tende a ser menor do que nos regimes de Lucro Presumido e Lucro Real.`,
      impacto: receitaAlta ? 'medio' : 'alto',
      aplicavel: true
    },
    {
      titulo: 'CPP incluída no DAS',
      descricao: 'A Contribuição Previdenciária Patronal (20% sobre folha) já está embutida na alíquota do DAS, gerando economia significativa na folha de pagamento.',
      impacto: isAnexoIV ? 'nao_aplicavel' : 'alto',
      aplicavel: !isAnexoIV
    },
    {
      titulo: 'ISS incluído no DAS',
      descricao: 'O ISS é recolhido dentro do DAS, sem necessidade de guia separada ao município (desde que abaixo do sublimite de R$ 3,6M).',
      impacto: 'medio',
      aplicavel: ['III', 'IV', 'V'].includes(anexo) && receitaBrutaAnual <= SUBLIMITE_ICMS_ISS
    },
    {
      titulo: 'Simplicidade de obrigações acessórias',
      descricao: 'Dispensa de ECD, ECF e diversas declarações exigidas no Lucro Presumido e Lucro Real. PGDAS-D e DEFIS são as principais obrigações.',
      impacto: 'alto',
      aplicavel: true
    },
    {
      titulo: 'Tratamento diferenciado em licitações',
      descricao: 'Preferência em licitações públicas (LC 123/2006, Art. 44-49), incluindo contratação exclusiva de ME/EPP em determinados valores.',
      impacto: 'medio',
      aplicavel: true
    },
    {
      titulo: 'Facilidades para exportação',
      descricao: 'Receitas de exportação são isentas de COFINS, PIS, IPI, ICMS e ISS dentro do DAS.',
      impacto: exporta ? 'alto' : 'baixo',
      aplicavel: exporta
    },
    {
      titulo: 'Acesso facilitado a crédito',
      descricao: 'Linhas de crédito específicas para ME/EPP com juros subsidiados (BNDES, Pronampe, etc.).',
      impacto: 'medio',
      aplicavel: true
    },
    {
      titulo: 'Presunção de lucro para distribuição (32% para serviços)',
      descricao: 'Permite distribuir até 32% da receita bruta como lucro isento, mesmo sem escrituração contábil completa.',
      impacto: 'alto',
      aplicavel: true
    },
    {
      titulo: 'Dispensa de ECD/ECF',
      descricao: 'Não é obrigada a entregar a Escrituração Contábil Digital (ECD) nem a Escrituração Contábil Fiscal (ECF), reduzindo custos com contabilidade.',
      impacto: 'medio',
      aplicavel: true
    },
    {
      titulo: 'Regime de caixa disponível',
      descricao: 'Pode optar pelo regime de caixa para reconhecimento de receitas, pagando imposto apenas quando receber efetivamente.',
      impacto: 'medio',
      aplicavel: true
    },
    {
      titulo: 'Menor custo contábil',
      descricao: 'Honorários contábeis geralmente menores devido à menor complexidade das obrigações acessórias.',
      impacto: 'medio',
      aplicavel: true
    },
    {
      titulo: 'Menor risco de autuação',
      descricao: 'Sistema simplificado reduz a probabilidade de erros no cumprimento das obrigações e, consequentemente, o risco de autuações.',
      impacto: 'medio',
      aplicavel: true
    },
    {
      titulo: 'FGTS com alíquota normal (8%)',
      descricao: 'Recolhe FGTS à alíquota normal de 8%, sem adicional. Em caso de rescisão, multa de 40% (não 50%).',
      impacto: 'baixo',
      aplicavel: true
    }
  ];

  // === DESVANTAGENS (mínimo 16) ===
  const desvantagens = [
    {
      titulo: 'Limite de receita R$ 4.800.000',
      descricao: 'Empresas que crescem além de R$ 4,8M anuais são excluídas do regime, enfrentando aumento repentino de carga tributária.',
      impacto: receitaAlta ? 'critico' : 'medio',
      aplicavel: true
    },
    {
      titulo: 'Alíquota efetiva pode ser MAIOR que Lucro Presumido nas faixas superiores',
      descricao: `Nas faixas 5ª e 6ª, a alíquota efetiva do Simples pode superar a carga do Lucro Presumido, especialmente para serviços com folha baixa.`,
      impacto: receitaAlta ? 'alto' : 'baixo',
      aplicavel: true
    },
    {
      titulo: 'NÃO permite créditos de PIS/COFINS para clientes PJ',
      descricao: 'Clientes do Lucro Real não podem tomar créditos de PIS/COFINS sobre compras de empresas do Simples. Reduz competitividade em vendas B2B.',
      impacto: vendeParaPJ ? 'critico' : 'baixo',
      aplicavel: true
    },
    {
      titulo: 'NÃO permite incentivos SUDAM/SUDENE',
      descricao: localizacaoSUDAM
        ? '❌ AGROGEO está na Amazônia Legal (SUDAM) mas NÃO pode aproveitar a redução de 75% do IRPJ por estar no Simples.'
        : 'Empresas do Simples não podem usufruir de incentivos fiscais regionais SUDAM/SUDENE.',
      impacto: localizacaoSUDAM ? 'critico' : 'nao_aplicavel',
      aplicavel: localizacaoSUDAM
    },
    {
      titulo: 'NÃO permite Lei do Bem (P&D)',
      descricao: 'Não pode deduzir gastos com pesquisa e desenvolvimento (Lei 11.196/2005).',
      impacto: 'baixo',
      aplicavel: true
    },
    {
      titulo: 'NÃO permite PAT',
      descricao: 'Não pode deduzir gastos com o Programa de Alimentação do Trabalhador.',
      impacto: 'baixo',
      aplicavel: true
    },
    {
      titulo: 'Fator "r" pode jogar para Anexo V (mais caro)',
      descricao: fatorRProximo
        ? `⚠️ Fator "r" atual (${(fatorR * 100).toFixed(2)}%) está próximo do limiar de 28%. Risco de migrar para Anexo V com alíquotas iniciais de 15,50%.`
        : 'Se o Fator "r" cair abaixo de 28%, a empresa é tributada pelo Anexo V, com alíquotas significativamente maiores.',
      impacto: fatorRProximo ? 'critico' : (isAnexoV ? 'alto' : 'medio'),
      aplicavel: true
    },
    {
      titulo: 'Sublimite estadual — ICMS/ISS por fora',
      descricao: `Se receita bruta ultrapassar R$ 3.600.000, ICMS e ISS saem do DAS e são recolhidos pelo regime normal, aumentando complexidade e custo.`,
      impacto: receitaBrutaAnual > SUBLIMITE_ICMS_ISS * 0.8 ? 'alto' : 'baixo',
      aplicavel: true
    },
    {
      titulo: 'Vedações extensas de atividades',
      descricao: 'Lista extensa de atividades vedadas (instituições financeiras, factoring, seguros, etc.). Restringe a diversificação de negócios.',
      impacto: 'medio',
      aplicavel: true
    },
    {
      titulo: 'Restrições de participação societária',
      descricao: 'Não pode ter sócio pessoa jurídica, sócio no exterior, ou participação relevante em outras empresas.',
      impacto: 'medio',
      aplicavel: true
    },
    {
      titulo: 'Não pode ter filial/sócio no exterior',
      descricao: 'Proibida de ter filial, sucursal ou representação no exterior, limitando a internacionalização.',
      impacto: 'baixo',
      aplicavel: true
    },
    {
      titulo: 'Impossibilidade de compensar prejuízos',
      descricao: 'Diferente do Lucro Real, não há possibilidade de compensar prejuízos fiscais de períodos anteriores.',
      impacto: 'medio',
      aplicavel: true
    },
    {
      titulo: 'Anexo IV: INSS patronal por fora',
      descricao: 'Atividades do Anexo IV (limpeza, vigilância, construção, advocacia) devem pagar CPP separadamente (20%+RAT sobre folha).',
      impacto: isAnexoIV ? 'critico' : 'nao_aplicavel',
      aplicavel: isAnexoIV
    },
    {
      titulo: 'Proibição de cessão de mão de obra',
      descricao: 'Empresas do Simples (exceto Anexo IV) não podem prestar serviços por cessão ou locação de mão de obra.',
      impacto: 'medio',
      aplicavel: true
    },
    {
      titulo: 'ICMS-ST e DIFAL pagos por fora',
      descricao: 'Substituição tributária e diferencial de alíquotas de ICMS são pagos em guias separadas, mesmo dentro do Simples.',
      impacto: ['I', 'II'].includes(anexo) ? 'medio' : 'baixo',
      aplicavel: ['I', 'II'].includes(anexo)
    },
    {
      titulo: 'Competitividade reduzida em vendas B2B',
      descricao: 'Na prática, o produto/serviço fica mais caro para clientes do Lucro Real, que perdem créditos de PIS/COFINS.',
      impacto: vendeParaPJ ? 'alto' : 'baixo',
      aplicavel: vendeParaPJ
    }
  ];

  return { vantagens, desvantagens };
}


// ================================================================================
// SEÇÃO 16: FUNÇÃO — compararComOutrosRegimes()
// ================================================================================

/**
 * Compara o Simples Nacional com Lucro Presumido, Lucro Real e Lucro Real + SUDAM 75%.
 *
 * @param {Object} params
 * @param {number} params.receitaBrutaAnual
 * @param {number} params.folhaAnual - Folha de pagamento anual (incluindo encargos)
 * @param {string} params.cnae
 * @param {number} params.fatorR
 * @param {string} params.anexo - Anexo do Simples
 * @param {number} [params.despesasOperacionais=0] - Despesas operacionais (para Lucro Real)
 * @param {number} [params.aliquotaRAT=0.02]
 * @param {number} [params.aliquotaISS=0.05] - Alíquota de ISS do município
 * @param {boolean} [params.temSUDAM=false] - Se tem benefício SUDAM
 * @returns {Object} Comparativo entre regimes
 */
function compararComOutrosRegimes(params) {
  const {
    receitaBrutaAnual,
    folhaAnual,
    cnae = '71.19-7',
    fatorR = 0.4255,
    anexo = 'III',
    despesasOperacionais = 0,
    aliquotaRAT = ALIQUOTA_RAT_PADRAO,
    aliquotaISS = 0.05,
    temSUDAM = false
  } = params;

  const regimes = [];

  // -------------------------------------------------------
  // 1. SIMPLES NACIONAL
  // -------------------------------------------------------
  const aliqSimples = calcularAliquotaEfetiva({ rbt12: receitaBrutaAnual, anexo });
  const dasAnual = _arredondar(receitaBrutaAnual * aliqSimples.aliquotaEfetiva);
  const fgtsSimples = _arredondar(folhaAnual * ALIQUOTA_FGTS);
  // CPP incluída no DAS para Anexo III, apenas FGTS por fora
  const cargaSimples = _arredondar(dasAnual + fgtsSimples);

  const distribuicaoSimples = calcularDistribuicaoLucros({
    receitaBrutaAnual,
    dasAnual,
    socios: [{ nome: 'Sócio 1', percentual: 0.65 }, { nome: 'Sócio 2', percentual: 0.35 }],
    tipoAtividade: 'servicos'
  });

  regimes.push({
    regime: 'Simples Nacional',
    anexo: `Anexo ${anexo}`,
    aliquotaEfetiva: aliqSimples.aliquotaEfetiva,
    aliquotaEfetivaFormatada: aliqSimples.aliquotaEfetivaFormatada,
    dasOuImpostos: dasAnual,
    fgts: fgtsSimples,
    inssPatronal: 0, // Incluso no DAS (Anexo III)
    cargaTotal: cargaSimples,
    percentualCarga: _arredondar(cargaSimples / receitaBrutaAnual, 4),
    percentualCargaFormatado: ((cargaSimples / receitaBrutaAnual) * 100).toFixed(2).replace('.', ',') + '%',
    lucroDistribuivel: distribuicaoSimples.lucroDistribuivelFinal,
    observacoes: ['CPP incluída no DAS', 'Guia única de recolhimento']
  });

  // -------------------------------------------------------
  // 2. LUCRO PRESUMIDO
  // -------------------------------------------------------
  const presuncaoLP = 0.32; // Serviços
  const baseIRPJ_LP = receitaBrutaAnual * presuncaoLP;
  const irpjLP = _arredondar(baseIRPJ_LP * 0.15);
  const adicionalIR_LP = _arredondar(Math.max(0, (baseIRPJ_LP - 240_000) * 0.10));
  const csllLP = _arredondar(baseIRPJ_LP * 0.09);
  const cofinsLP = _arredondar(receitaBrutaAnual * 0.03); // Cumulativo
  const pisLP = _arredondar(receitaBrutaAnual * 0.0065); // Cumulativo
  const issLP = _arredondar(receitaBrutaAnual * aliquotaISS);
  const inssPatronalLP = _arredondar(folhaAnual * (0.20 + aliquotaRAT));
  const terceirosSAT_LP = _arredondar(folhaAnual * 0.058); // Sistema S + Salário Educação
  const fgtsLP = _arredondar(folhaAnual * ALIQUOTA_FGTS);

  const cargaLP = _arredondar(irpjLP + adicionalIR_LP + csllLP + cofinsLP + pisLP + issLP + inssPatronalLP + terceirosSAT_LP + fgtsLP);

  const lucroDistribuivelLP = _arredondar(Math.max(0, baseIRPJ_LP - irpjLP - adicionalIR_LP - csllLP));

  regimes.push({
    regime: 'Lucro Presumido',
    anexo: null,
    detalhamento: {
      irpj: irpjLP,
      adicionalIR: adicionalIR_LP,
      csll: csllLP,
      cofins: cofinsLP,
      pis: pisLP,
      iss: issLP,
      inssPatronal: inssPatronalLP,
      terceiros: terceirosSAT_LP,
      fgts: fgtsLP
    },
    dasOuImpostos: _arredondar(irpjLP + adicionalIR_LP + csllLP + cofinsLP + pisLP + issLP),
    fgts: fgtsLP,
    inssPatronal: _arredondar(inssPatronalLP + terceirosSAT_LP),
    cargaTotal: cargaLP,
    percentualCarga: _arredondar(cargaLP / receitaBrutaAnual, 4),
    percentualCargaFormatado: ((cargaLP / receitaBrutaAnual) * 100).toFixed(2).replace('.', ',') + '%',
    lucroDistribuivel: lucroDistribuivelLP,
    observacoes: ['INSS patronal pago separadamente (20%+RAT)', 'PIS/COFINS cumulativo (3%+0,65%)']
  });

  // -------------------------------------------------------
  // 3. LUCRO REAL
  // -------------------------------------------------------
  const lucroOperacional = receitaBrutaAnual - folhaAnual - despesasOperacionais;
  const lucroAntesTributos = Math.max(0, lucroOperacional);
  const irpjLR = _arredondar(lucroAntesTributos * 0.15);
  const adicionalIR_LR = _arredondar(Math.max(0, (lucroAntesTributos - 240_000) * 0.10));
  const csllLR = _arredondar(lucroAntesTributos * 0.09);
  const cofinsLR = _arredondar(receitaBrutaAnual * 0.076); // Não cumulativo (bruto sem créditos simplificado)
  const creditoCofins = _arredondar((folhaAnual + despesasOperacionais) * 0.076 * 0.5); // Estimativa simplificada de créditos
  const cofinsLRLiquido = _arredondar(Math.max(0, cofinsLR - creditoCofins));
  const pisLR = _arredondar(receitaBrutaAnual * 0.0165);
  const creditoPis = _arredondar((folhaAnual + despesasOperacionais) * 0.0165 * 0.5);
  const pisLRLiquido = _arredondar(Math.max(0, pisLR - creditoPis));
  const issLR = _arredondar(receitaBrutaAnual * aliquotaISS);
  const inssPatronalLR = _arredondar(folhaAnual * (0.20 + aliquotaRAT));
  const terceirosSAT_LR = _arredondar(folhaAnual * 0.058);
  const fgtsLR = _arredondar(folhaAnual * ALIQUOTA_FGTS);

  const cargaLR = _arredondar(irpjLR + adicionalIR_LR + csllLR + cofinsLRLiquido + pisLRLiquido + issLR + inssPatronalLR + terceirosSAT_LR + fgtsLR);

  const lucroDistribuivelLR = _arredondar(Math.max(0, lucroAntesTributos - irpjLR - adicionalIR_LR - csllLR));

  regimes.push({
    regime: 'Lucro Real',
    anexo: null,
    detalhamento: {
      lucroOperacional: _arredondar(lucroOperacional),
      irpj: irpjLR,
      adicionalIR: adicionalIR_LR,
      csll: csllLR,
      cofinsLiquido: cofinsLRLiquido,
      pisLiquido: pisLRLiquido,
      iss: issLR,
      inssPatronal: inssPatronalLR,
      terceiros: terceirosSAT_LR,
      fgts: fgtsLR
    },
    dasOuImpostos: _arredondar(irpjLR + adicionalIR_LR + csllLR + cofinsLRLiquido + pisLRLiquido + issLR),
    fgts: fgtsLR,
    inssPatronal: _arredondar(inssPatronalLR + terceirosSAT_LR),
    cargaTotal: cargaLR,
    percentualCarga: _arredondar(cargaLR / receitaBrutaAnual, 4),
    percentualCargaFormatado: ((cargaLR / receitaBrutaAnual) * 100).toFixed(2).replace('.', ',') + '%',
    lucroDistribuivel: lucroDistribuivelLR,
    observacoes: ['PIS/COFINS não cumulativo (créditos estimados)', 'Permite compensar prejuízos']
  });

  // -------------------------------------------------------
  // 4. LUCRO REAL + SUDAM 75% (se aplicável)
  // -------------------------------------------------------
  if (temSUDAM) {
    const reducaoSUDAM = _arredondar(irpjLR * 0.75);
    const irpjSUDAM = _arredondar(irpjLR - reducaoSUDAM);
    const cargaSUDAM = _arredondar(cargaLR - reducaoSUDAM);

    regimes.push({
      regime: 'Lucro Real + SUDAM 75%',
      anexo: null,
      detalhamento: {
        irpjOriginal: irpjLR,
        reducaoSUDAM,
        irpjFinal: irpjSUDAM,
        adicionalIR: adicionalIR_LR,
        csll: csllLR,
        cofinsLiquido: cofinsLRLiquido,
        pisLiquido: pisLRLiquido,
        iss: issLR,
        inssPatronal: inssPatronalLR,
        terceiros: terceirosSAT_LR,
        fgts: fgtsLR
      },
      dasOuImpostos: _arredondar(irpjSUDAM + adicionalIR_LR + csllLR + cofinsLRLiquido + pisLRLiquido + issLR),
      fgts: fgtsLR,
      inssPatronal: _arredondar(inssPatronalLR + terceirosSAT_LR),
      cargaTotal: cargaSUDAM,
      percentualCarga: _arredondar(cargaSUDAM / receitaBrutaAnual, 4),
      percentualCargaFormatado: ((cargaSUDAM / receitaBrutaAnual) * 100).toFixed(2).replace('.', ',') + '%',
      lucroDistribuivel: _arredondar(lucroDistribuivelLR + reducaoSUDAM),
      observacoes: ['Redução de 75% do IRPJ (SUDAM)', 'Requer laudo + aprovação ADA/SUDAM', 'Não disponível no Simples Nacional']
    });
  }

  // Ordenar pelo menor carga total
  regimes.sort((a, b) => a.cargaTotal - b.cargaTotal);

  // Atribuir ranking
  regimes.forEach((r, i) => {
    r.ranking = i + 1;
    r.melhorOpcao = i === 0;
  });

  // Economia vs pior
  const pior = regimes[regimes.length - 1];
  const melhor = regimes[0];
  const economiaMelhorVsPior = _arredondar(pior.cargaTotal - melhor.cargaTotal);

  return {
    receitaBrutaAnual: _arredondar(receitaBrutaAnual),
    folhaAnual: _arredondar(folhaAnual),
    cnae,
    regimes,
    melhorRegime: melhor.regime,
    piorRegime: pior.regime,
    economiaMelhorVsPior,
    economiaFormatada: _formatarMoeda(economiaMelhorVsPior),
    recomendacao: `O regime mais vantajoso é ${melhor.regime} com carga de ${melhor.percentualCargaFormatado} (${_formatarMoeda(melhor.cargaTotal)}). Economia de ${_formatarMoeda(economiaMelhorVsPior)} em relação ao pior regime (${pior.regime}).`
  };
}


// ================================================================================
// SEÇÃO 17: RISCOS FISCAIS E PEGADINHAS
// ================================================================================

/**
 * Riscos fiscais e "pegadinhas" comuns no Simples Nacional.
 * Base legal: LC 123/2006; Resolução CGSN 140/2018.
 */
const RISCOS_FISCAIS = [
  {
    id: 'ultrapassagem_limite',
    titulo: 'Exclusão por excesso de receita',
    descricao: 'Ultrapassar o limite de R$ 4.800.000,00 de receita bruta anual resulta em exclusão obrigatória do Simples Nacional.',
    consequencia: 'Exclusão a partir de 1º de janeiro do ano seguinte (se excesso ≤ 20%) ou retroativa ao início do ano (se excesso > 20%).',
    prevencao: 'Monitorar receita mensal acumulada. Alertar quando atingir 80% do limite.',
    gravidade: 'critica',
    baseLegal: 'LC 123/2006, Art. 3º, II e Art. 30'
  },
  {
    id: 'ultrapassagem_sublimite',
    titulo: 'ICMS/ISS por fora ao ultrapassar sublimite',
    descricao: 'Receita acima de R$ 3.600.000,00 obriga recolhimento de ICMS e ISS fora do DAS.',
    consequencia: 'Aumento da complexidade tributária e possível aumento da carga fiscal. ICMS/ISS pelo regime normal.',
    prevencao: 'Planejar antecipadamente a transição quando receita se aproximar do sublimite.',
    gravidade: 'alta',
    baseLegal: 'LC 123/2006, Art. 19'
  },
  {
    id: 'fator_r_flutuante',
    titulo: 'Fator "r" flutuando entre Anexo III e V',
    descricao: 'Variações mensais na folha de pagamento ou receita podem fazer o Fator "r" oscilar em torno do limiar de 28%.',
    consequencia: 'Alternância entre Anexo III e V pode causar tributação imprevisível e possível pagamento a maior ou menor.',
    prevencao: 'Manter folha de pagamento estável. Considerar ajustar pró-labore para manter Fator "r" acima de 28%.',
    gravidade: 'alta',
    baseLegal: 'Resolução CGSN 140/2018, Art. 18, §5º-J'
  },
  {
    id: 'segregacao_receitas',
    titulo: 'Erro na segregação de receitas por anexo',
    descricao: 'Empresas com múltiplas atividades devem segregar receitas por anexo no PGDAS-D.',
    consequencia: 'Cálculo incorreto de tributos, podendo resultar em autuação com multa de 75% + juros.',
    prevencao: 'Segregar receitas por CNAE/anexo mensalmente. Conferir classificação de cada nota fiscal.',
    gravidade: 'alta',
    baseLegal: 'Resolução CGSN 140/2018, Art. 25'
  },
  {
    id: 'omissao_receita',
    titulo: 'Omissão de receita',
    descricao: 'Diferença entre receita declarada e notas fiscais emitidas ou recebimentos via cartão/PIX.',
    consequencia: 'Autuação com multa de 75% (podendo chegar a 150% em caso de fraude) + juros SELIC.',
    prevencao: 'Conciliar receita mensal com extratos bancários, recebimentos de cartão e notas emitidas.',
    gravidade: 'critica',
    baseLegal: 'LC 123/2006, Art. 38-A; CTN, Art. 44'
  },
  {
    id: 'distribuicao_lucros_excessiva',
    titulo: 'Distribuição de lucros acima do permitido',
    descricao: 'Distribuir lucros isentos acima do limite da presunção (32% para serviços) sem escrituração contábil.',
    consequencia: 'Valor excedente tributado como remuneração (IRPF + INSS). Autuação retroativa de até 5 anos.',
    prevencao: 'Manter escrituração contábil completa para distribuir lucros acima da presunção. Calcular limite mensal.',
    gravidade: 'alta',
    baseLegal: 'LC 123/2006, Art. 14'
  },
  {
    id: 'debitos_exclusao',
    titulo: 'Exclusão por débitos fiscais',
    descricao: 'Débitos pendentes com INSS ou Fazendas Públicas (federal, estadual, municipal) sem exigibilidade suspensa.',
    consequencia: 'Exclusão de ofício do Simples Nacional por notificação (Termo de Exclusão).',
    prevencao: 'Manter certidões negativas em dia. Parcelar débitos imediatamente se houver pendências.',
    gravidade: 'alta',
    baseLegal: 'LC 123/2006, Art. 17, V e Art. 29'
  },
  {
    id: 'atividade_vedada',
    titulo: 'Exercício de atividade vedada',
    descricao: 'Incluir CNAE vedado ao Simples Nacional (ex: factoring, instituição financeira).',
    consequencia: 'Exclusão de ofício, com recolhimento retroativo pelo regime geral.',
    prevencao: 'Verificar elegibilidade antes de adicionar novos CNAEs. Consultar resolução CGSN 140/2018.',
    gravidade: 'alta',
    baseLegal: 'LC 123/2006, Art. 17'
  },
  {
    id: 'icms_st_duplicado',
    titulo: 'Pagar ICMS duas vezes (ICMS-ST)',
    descricao: 'Não segregar no PGDAS-D as receitas de mercadorias com substituição tributária, pagando ICMS dentro e fora do DAS.',
    consequencia: 'Pagamento de ICMS em duplicidade. Necessário pedido de restituição.',
    prevencao: 'Segregar receitas com ICMS-ST no PGDAS-D. Identificar NCM/CEST sujeitos à substituição.',
    gravidade: 'media',
    baseLegal: 'Resolução CGSN 140/2018, Art. 25, §6º'
  },
  {
    id: 'alocacao_indevida_anexo',
    titulo: 'Receita alocada no anexo errado',
    descricao: 'Classificar receita em um anexo com tributação menor que o correto (ex: Anexo III quando deveria ser V).',
    consequencia: 'Autuação pela RFB com cobrança de diferença + multa de 75% + juros.',
    prevencao: 'Calcular Fator "r" mensalmente. Verificar CNAE de cada receita.',
    gravidade: 'alta',
    baseLegal: 'Resolução CGSN 140/2018, Art. 18'
  },
  {
    id: 'exclusao_retroativa',
    titulo: 'Exclusão retroativa por excesso > 20%',
    descricao: 'Se receita bruta exceder R$ 5.760.000 (20% acima do limite), a exclusão é retroativa ao início do ano-calendário.',
    consequencia: 'Recalcular TODOS os tributos do ano pelo Lucro Presumido ou Real, com multas e juros.',
    prevencao: 'NUNCA permitir receita acima de R$ 4.800.000 sem planejamento tributário prévio.',
    gravidade: 'critica',
    baseLegal: 'LC 123/2006, Art. 30, §1º'
  },
  {
    id: 'iss_retido_nao_deduzido',
    titulo: 'ISS retido na fonte não deduzido do DAS',
    descricao: 'Quando o ISS é retido pelo tomador do serviço, o valor deve ser deduzido do DAS para evitar bitributação.',
    consequencia: 'Pagamento de ISS em duplicidade (dentro do DAS + retenção na fonte).',
    prevencao: 'Registrar ISS retido no PGDAS-D mensalmente. Conferir notas fiscais com retenção.',
    gravidade: 'media',
    baseLegal: 'Resolução CGSN 140/2018, Art. 27'
  }
];


// ================================================================================
// SEÇÃO 18: TRANSIÇÕES ENTRE REGIMES
// ================================================================================

/**
 * Procedimentos para transição entre regimes tributários.
 * Base legal: LC 123/2006, Arts. 16, 30 e 31.
 */
const TRANSICOES = {
  SIMPLES_PARA_PRESUMIDO: {
    descricao: 'Transição do Simples Nacional para o Lucro Presumido',
    procedimentos: [
      'Formalizar exclusão no Portal do Simples Nacional (caso voluntária)',
      'Comunicação deve ser feita em janeiro para efeitos no mesmo ano',
      'Se exclusão obrigatória por excesso, seguir prazos específicos da LC 123/2006',
      'Adaptar contabilidade: implantar ECD e ECF',
      'Implantar apuração de PIS/COFINS cumulativo (3% + 0,65%)',
      'Iniciar recolhimento de INSS patronal separadamente (20% + RAT)',
      'Iniciar recolhimento de contribuições a terceiros (Sistema S, Salário Educação)',
      'Adequar sistema de emissão de notas fiscais (destacar impostos)'
    ],
    alertas: [
      'INSS patronal por fora aumenta custo da folha significativamente',
      'Contribuições a terceiros (~5,8% sobre folha) não existem no Simples',
      'Aumento das obrigações acessórias e complexidade contábil',
      'Aumento esperado de custo com honorários contábeis',
      'Clientes do Lucro Real poderão tomar créditos de PIS/COFINS'
    ],
    baseLegal: 'LC 123/2006, Arts. 30 e 31; Resolução CGSN 140/2018, Arts. 73 a 80'
  },

  SIMPLES_PARA_REAL: {
    descricao: 'Transição do Simples Nacional para o Lucro Real',
    procedimentos: [
      'Formalizar exclusão no Portal do Simples Nacional',
      'Implantar contabilidade completa (ECD + ECF obrigatórias)',
      'Implantar apuração de PIS/COFINS não cumulativo (7,6% + 1,65%, com créditos)',
      'Iniciar recolhimento de INSS patronal separadamente',
      'Implantar LALUR (Livro de Apuração do Lucro Real)',
      'Avaliar possibilidade de incentivos fiscais (SUDAM, Lei do Bem, PAT)',
      'Implementar controle de prejuízos fiscais para compensação',
      'Adequar sistema ERP/contábil para apuração trimestral ou anual'
    ],
    alertas: [
      'Aumento significativo da complexidade contábil',
      'Possibilidade de aproveitar incentivos fiscais (SUDAM 75% para AGROGEO)',
      'PIS/COFINS não cumulativo pode gerar créditos significativos',
      'Possibilidade de compensar prejuízos fiscais',
      'Custo contábil significativamente maior',
      'Maior risco de autuações fiscais'
    ],
    baseLegal: 'LC 123/2006, Arts. 30 e 31; RIR/2018; Lei 12.973/2014'
  },

  PRESUMIDO_PARA_SIMPLES: {
    descricao: 'Transição do Lucro Presumido para o Simples Nacional',
    procedimentos: [
      'Verificar elegibilidade: receita ≤ R$ 4.800.000, sem vedações',
      'Solicitar opção no Portal do Simples Nacional em janeiro (até último dia útil)',
      'Aguardar verificação de pendências pela RFB (débitos, vedações)',
      'Regularizar débitos pendentes antes do prazo de opção',
      'Se deferido, efeitos a partir de 1º de janeiro',
      'Adaptar sistemas para emissão de DAS mensal',
      'Cessar recolhimento separado de INSS patronal (exceto se Anexo IV)',
      'Encerrar obrigações do regime anterior (ECD, ECF do último período)'
    ],
    alertas: [
      'Opção é irretratável para todo o ano-calendário',
      'Verificar se Fator "r" é favorável (>= 28% para serviços)',
      'Clientes do Lucro Real perderão créditos de PIS/COFINS',
      'Incentivos fiscais (SUDAM, Lei do Bem) não poderão mais ser aproveitados',
      'Prazos são rígidos: janeiro ou perderá o ano'
    ],
    baseLegal: 'LC 123/2006, Art. 16; Resolução CGSN 140/2018, Arts. 6º a 15'
  },

  REAL_PARA_SIMPLES: {
    descricao: 'Transição do Lucro Real para o Simples Nacional',
    procedimentos: [
      'Verificar elegibilidade completa (receita, vedações, sócios)',
      'Solicitar opção no Portal do Simples Nacional em janeiro',
      'Regularizar todos os débitos fiscais pendentes',
      'Perda de saldos credores de PIS/COFINS e prejuízos fiscais',
      'Encerrar LALUR e balancetes do último período no Lucro Real',
      'Cancelar eventuais incentivos fiscais ativos (SUDAM, etc.)',
      'Adaptar sistemas para cálculo do DAS',
      'Comunicar clientes sobre impossibilidade de créditos PIS/COFINS'
    ],
    alertas: [
      'Saldos credores de PIS/COFINS serão perdidos',
      'Prejuízos fiscais acumulados não poderão ser compensados no Simples',
      'Incentivo SUDAM será perdido — calcular impacto antes',
      'Pode ser vantajoso apenas se alíquota efetiva do Simples for menor',
      'Opção é irretratável para o ano-calendário'
    ],
    baseLegal: 'LC 123/2006, Art. 16; Resolução CGSN 140/2018, Arts. 6º a 15'
  }
};


// ================================================================================
// SEÇÃO 19: FUNÇÕES AUXILIARES
// ================================================================================

/**
 * Arredonda um valor para N casas decimais.
 * @param {number} valor
 * @param {number} [casas=2]
 * @returns {number}
 */
function _arredondar(valor, casas = 2) {
  const fator = Math.pow(10, casas);
  return Math.round(valor * fator) / fator;
}

/**
 * Formata um valor numérico como moeda brasileira (R$).
 * @param {number} valor
 * @returns {string}
 */
function _formatarMoeda(valor) {
  return _fmtBRL(valor);
}

// Alternativa mais robusta de formatação de moeda
function _fmtBRL(v) {
  if (v === null || v === undefined || isNaN(v)) return 'R$ 0,00';
  const parts = Math.abs(v).toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decPart = parts[1];
  const sign = v < 0 ? '-' : '';
  return `${sign}R$ ${intPart},${decPart}`;
}

/**
 * Retorna os anexos disponíveis.
 * @returns {Object}
 */
function getAnexosDisponiveis() {
  const result = {};
  for (const [key, val] of Object.entries(ANEXOS)) {
    result[key] = {
      nome: val.nome,
      descricao: val.descricao,
      cppInclusa: val.cppInclusa,
      totalFaixas: val.faixas.length,
      tributosDentro: val.tributosDentro,
      tributosFora: val.tributosFora
    };
  }
  return result;
}

/**
 * Retorna a faixa de tributação para um dado RBT12 e anexo.
 * @param {number} rbt12
 * @param {string} anexo
 * @returns {Object|null}
 */
function getFaixaByRBT12(rbt12, anexo) {
  if (!ANEXOS[anexo]) return null;
  return ANEXOS[anexo].faixas.find(f => rbt12 >= f.min && rbt12 <= f.max) || null;
}

/**
 * Calcula RBT12 proporcional para empresas em início de atividade.
 * @param {Array<number>} receitasMensais
 * @param {number} mesesAtividade
 * @returns {number}
 */
function calcularRBT12Proporcional(receitasMensais, mesesAtividade) {
  if (!receitasMensais || receitasMensais.length === 0 || mesesAtividade <= 0) return 0;
  const somaReceitas = receitasMensais.reduce((a, b) => a + b, 0);
  const mediaReceita = somaReceitas / Math.min(receitasMensais.length, mesesAtividade);
  return _arredondar(mediaReceita * 12);
}

/**
 * Valida os dados de entrada antes do processamento.
 * @param {Object} params
 * @returns {Object} {valido: boolean, erros: string[]}
 */
function validarDadosEntrada(params) {
  const erros = [];

  if (!params) {
    return { valido: false, erros: ['Parâmetros não fornecidos'] };
  }

  if (params.receitaBrutaMensal !== undefined && params.receitaBrutaMensal < 0) {
    erros.push('Receita bruta mensal não pode ser negativa');
  }
  if (params.rbt12 !== undefined && params.rbt12 < 0) {
    erros.push('RBT12 não pode ser negativo');
  }
  if (params.rbt12 !== undefined && params.rbt12 > LIMITE_EPP) {
    erros.push(`RBT12 (${_fmtBRL(params.rbt12)}) excede o limite do Simples Nacional`);
  }
  if (params.anexo !== undefined && !ANEXOS[params.anexo]) {
    erros.push(`Anexo "${params.anexo}" inválido`);
  }
  if (params.fatorR !== undefined && (params.fatorR < 0 || params.fatorR > 1)) {
    erros.push('Fator "r" deve estar entre 0 e 1');
  }

  return { valido: erros.length === 0, erros };
}

/**
 * Formata resultado completo como texto legível.
 * @param {Object} resultado
 * @returns {string}
 */
function formatarResultadoTexto(resultado) {
  if (!resultado) return '';

  const linhas = [];

  if (resultado.regime) {
    linhas.push(`Regime: ${resultado.regime}`);
  }
  if (resultado.cargaTotal !== undefined) {
    linhas.push(`Carga Tributária Total: ${_fmtBRL(resultado.cargaTotal)}`);
  }
  if (resultado.percentualCargaFormatado) {
    linhas.push(`Percentual sobre Receita: ${resultado.percentualCargaFormatado}`);
  }
  if (resultado.lucroDistribuivel !== undefined) {
    linhas.push(`Lucro Distribuível Isento: ${_fmtBRL(resultado.lucroDistribuivel)}`);
  }

  return linhas.join('\n');
}


// ================================================================================
// SEÇÃO 20: ANEXO VI HISTÓRICO (LC 147/2014 — vigência 01/01/2015 a 31/12/2017)
// ================================================================================

/**
 * Tabela do Anexo VI — Vigência: 01/01/2015 a 31/12/2017.
 * Substituído pela sistemática Fator "r" (LC 155/2016) a partir de 01/01/2018.
 *
 * IMPORTANTE: Atividades do antigo Anexo VI (§5º-I) agora são tributadas no
 * Anexo III (se r ≥ 28%) ou Anexo V (se r < 28%) conforme LC 155/2016.
 *
 * Mantido como referência histórica e para cálculos retroativos.
 *
 * Base legal: LC 123/2006, §5º-I, Anexo VI (redação LC 147/2014).
 */
const ANEXO_VI_HISTORICO = {
  nome: 'Anexo VI — Serviços Profissionais (HISTÓRICO — vigência 2015-2017)',
  descricao: 'Atividades intelectuais, técnicas, científicas, desportivas, artísticas — §5º-I',
  baseLegal: 'LC 123/2006, §5º-I c/c Anexo VI (redação LC 147/2014)',
  vigencia: { inicio: '2015-01-01', fim: '2017-12-31' },
  substituidoPor: 'Fator "r" → Anexo III (r≥28%) ou Anexo V (r<28%) — LC 155/2016',
  tributosDentro: ['IRPJ', 'CSLL', 'COFINS', 'PIS/PASEP', 'CPP', 'ISS'],
  cppInclusa: true,
  faixas: [
    { faixa: 1,  min: 0.00,           max: 180_000.00,   aliquota: 0.1693, irpjPisCsllCofinsCpp: 0.1493, iss: 0.0200 },
    { faixa: 2,  min: 180_000.01,     max: 360_000.00,   aliquota: 0.1772, irpjPisCsllCofinsCpp: 0.1493, iss: 0.0279 },
    { faixa: 3,  min: 360_000.01,     max: 540_000.00,   aliquota: 0.1843, irpjPisCsllCofinsCpp: 0.1493, iss: 0.0350 },
    { faixa: 4,  min: 540_000.01,     max: 720_000.00,   aliquota: 0.1877, irpjPisCsllCofinsCpp: 0.1493, iss: 0.0384 },
    { faixa: 5,  min: 720_000.01,     max: 900_000.00,   aliquota: 0.1904, irpjPisCsllCofinsCpp: 0.1517, iss: 0.0387 },
    { faixa: 6,  min: 900_000.01,     max: 1_080_000.00, aliquota: 0.1994, irpjPisCsllCofinsCpp: 0.1571, iss: 0.0423 },
    { faixa: 7,  min: 1_080_000.01,   max: 1_260_000.00, aliquota: 0.2034, irpjPisCsllCofinsCpp: 0.1608, iss: 0.0426 },
    { faixa: 8,  min: 1_260_000.01,   max: 1_440_000.00, aliquota: 0.2066, irpjPisCsllCofinsCpp: 0.1635, iss: 0.0431 },
    { faixa: 9,  min: 1_440_000.01,   max: 1_620_000.00, aliquota: 0.2117, irpjPisCsllCofinsCpp: 0.1656, iss: 0.0461 },
    { faixa: 10, min: 1_620_000.01,   max: 1_800_000.00, aliquota: 0.2138, irpjPisCsllCofinsCpp: 0.1673, iss: 0.0465 },
    { faixa: 11, min: 1_800_000.01,   max: 1_980_000.00, aliquota: 0.2186, irpjPisCsllCofinsCpp: 0.1686, iss: 0.0500 },
    { faixa: 12, min: 1_980_000.01,   max: 2_160_000.00, aliquota: 0.2197, irpjPisCsllCofinsCpp: 0.1697, iss: 0.0500 },
    { faixa: 13, min: 2_160_000.01,   max: 2_340_000.00, aliquota: 0.2206, irpjPisCsllCofinsCpp: 0.1706, iss: 0.0500 },
    { faixa: 14, min: 2_340_000.01,   max: 2_520_000.00, aliquota: 0.2214, irpjPisCsllCofinsCpp: 0.1714, iss: 0.0500 },
    { faixa: 15, min: 2_520_000.01,   max: 2_700_000.00, aliquota: 0.2221, irpjPisCsllCofinsCpp: 0.1721, iss: 0.0500 },
    { faixa: 16, min: 2_700_000.01,   max: 2_880_000.00, aliquota: 0.2221, irpjPisCsllCofinsCpp: 0.1721, iss: 0.0500 },
    { faixa: 17, min: 2_880_000.01,   max: 3_060_000.00, aliquota: 0.2232, irpjPisCsllCofinsCpp: 0.1732, iss: 0.0500 },
    { faixa: 18, min: 3_060_000.01,   max: 3_240_000.00, aliquota: 0.2237, irpjPisCsllCofinsCpp: 0.1737, iss: 0.0500 },
    { faixa: 19, min: 3_240_000.01,   max: 3_420_000.00, aliquota: 0.2241, irpjPisCsllCofinsCpp: 0.1741, iss: 0.0500 },
    { faixa: 20, min: 3_420_000.01,   max: 3_600_000.00, aliquota: 0.2245, irpjPisCsllCofinsCpp: 0.1745, iss: 0.0500 }
  ]
};


// ================================================================================
// SEÇÃO 21: ATIVIDADES §5º-I (ANTIGO ANEXO VI) — MAPEAMENTO COMPLETO
// ================================================================================

/**
 * Lista completa das atividades do §5º-I do Art. 18 da LC 123/2006 (redação LC 147/2014).
 *
 * Após LC 155/2016, todas estas atividades passaram a ser tributadas pelo
 * sistema Fator "r": Anexo III (r ≥ 28%) ou Anexo V (r < 28%).
 *
 * ESTRATÉGIA FISCAL: Manter Fator "r" ≥ 28% para estas atividades garante
 * alíquota efetiva MENOR (Anexo III vs V). Diferença pode ser de até 10 pontos
 * percentuais nas faixas superiores.
 *
 * Base legal: LC 123/2006, Art. 18, §5º-I (redação LC 147/2014);
 *             LC 155/2016 (migração para sistema Fator "r");
 *             Resolução CGSN 140/2018, Art. 18, §5º-J e §5º-M.
 */
const ATIVIDADES_PARAGRAFO_5I = [
  // Inciso I
  {
    inciso: 'I',
    descricao: 'Medicina, inclusive laboratorial e enfermagem',
    exemplosAtividades: ['Clínicas médicas', 'Laboratórios', 'Enfermagem domiciliar', 'Medicina do trabalho'],
    exemplosCNAE: ['86.30-5', '86.10-1', '86.21-6'],
    tributacaoAtual: 'Fator "r" — Anexo III (r≥28%) ou Anexo V (r<28%)',
    baseLegal: 'LC 123/2006, Art. 18, §5º-I, I'
  },
  // Inciso II
  {
    inciso: 'II',
    descricao: 'Medicina veterinária',
    exemplosAtividades: ['Clínicas veterinárias', 'Consultórios veterinários'],
    exemplosCNAE: ['75.00-1'],
    tributacaoAtual: 'Fator "r" — Anexo III (r≥28%) ou Anexo V (r<28%)',
    baseLegal: 'LC 123/2006, Art. 18, §5º-I, II'
  },
  // Inciso III
  {
    inciso: 'III',
    descricao: 'Odontologia',
    exemplosAtividades: ['Consultórios odontológicos', 'Clínicas odontológicas'],
    exemplosCNAE: ['86.30-5/03'],
    tributacaoAtual: 'Fator "r" — Anexo III (r≥28%) ou Anexo V (r<28%)',
    baseLegal: 'LC 123/2006, Art. 18, §5º-I, III'
  },
  // Inciso IV
  {
    inciso: 'IV',
    descricao: 'Psicologia, psicanálise, terapia ocupacional, acupuntura, podologia, fonoaudiologia, clínicas de nutrição e de vacinação e bancos de leite',
    exemplosAtividades: ['Psicólogos', 'Psicanalistas', 'Terapeutas ocupacionais', 'Acupunturistas', 'Fonoaudiólogos', 'Nutricionistas', 'Clínicas de vacinação'],
    exemplosCNAE: ['86.50-0', '86.90-9'],
    tributacaoAtual: 'Fator "r" — Anexo III (r≥28%) ou Anexo V (r<28%)',
    baseLegal: 'LC 123/2006, Art. 18, §5º-I, IV'
  },
  // Inciso V
  {
    inciso: 'V',
    descricao: 'Serviços de comissaria, de despachantes, de tradução e de interpretação',
    exemplosAtividades: ['Comissários de avarias', 'Despachantes aduaneiros', 'Tradutores', 'Intérpretes'],
    exemplosCNAE: ['52.50-8', '74.90-1'],
    tributacaoAtual: 'Fator "r" — Anexo III (r≥28%) ou Anexo V (r<28%)',
    baseLegal: 'LC 123/2006, Art. 18, §5º-I, V'
  },
  // Inciso VI — AGROGEO BRASIL enquadra-se aqui
  {
    inciso: 'VI',
    descricao: 'Arquitetura, engenharia, medição, cartografia, topografia, geologia, geodésia, testes, suporte e análises técnicas e tecnológicas, pesquisa, design, desenho e agronomia',
    exemplosAtividades: [
      'Escritórios de arquitetura', 'Empresas de engenharia', 'Serviços de medição e cartografia',
      'Topografia', 'Geologia', 'Geodésia', 'Laboratórios de ensaio',
      'Pesquisa científica', 'Design gráfico/industrial', 'Desenho técnico',
      'Agronomia', 'Geotecnologia', 'Consultoria ambiental', 'Georeferenciamento'
    ],
    exemplosCNAE: ['71.11-1', '71.12-0', '71.19-7', '71.20-1', '72.10-0', '73.19-0', '74.10-2', '01.61-0'],
    tributacaoAtual: 'Fator "r" — Anexo III (r≥28%) ou Anexo V (r<28%)',
    baseLegal: 'LC 123/2006, Art. 18, §5º-I, VI',
    observacao: '⭐ AGROGEO BRASIL — CNAE 71.19-7 enquadra-se neste inciso'
  },
  // Inciso VII
  {
    inciso: 'VII',
    descricao: 'Representação comercial e demais atividades de intermediação de negócios e serviços de terceiros',
    exemplosAtividades: ['Representantes comerciais', 'Intermediários de negócios', 'Agentes de comércio'],
    exemplosCNAE: ['46.13-3', '74.90-1'],
    tributacaoAtual: 'Fator "r" — Anexo III (r≥28%) ou Anexo V (r<28%)',
    baseLegal: 'LC 123/2006, Art. 18, §5º-I, VII'
  },
  // Inciso VIII
  {
    inciso: 'VIII',
    descricao: 'Perícia, leilão e avaliação',
    exemplosAtividades: ['Peritos judiciais', 'Leiloeiros', 'Avaliadores de imóveis'],
    exemplosCNAE: ['69.20-6', '82.99-7'],
    tributacaoAtual: 'Fator "r" — Anexo III (r≥28%) ou Anexo V (r<28%)',
    baseLegal: 'LC 123/2006, Art. 18, §5º-I, VIII'
  },
  // Inciso IX
  {
    inciso: 'IX',
    descricao: 'Auditoria, economia, consultoria, gestão, organização, controle e administração',
    exemplosAtividades: ['Empresas de auditoria', 'Economistas', 'Consultorias de gestão', 'Organizadores de eventos corporativos'],
    exemplosCNAE: ['69.20-6', '70.20-4', '82.11-3'],
    tributacaoAtual: 'Fator "r" — Anexo III (r≥28%) ou Anexo V (r<28%)',
    baseLegal: 'LC 123/2006, Art. 18, §5º-I, IX'
  },
  // Inciso X
  {
    inciso: 'X',
    descricao: 'Jornalismo e publicidade',
    exemplosAtividades: ['Agências de jornalismo', 'Agências de publicidade', 'Assessoria de imprensa'],
    exemplosCNAE: ['63.91-7', '73.11-4', '73.12-2'],
    tributacaoAtual: 'Fator "r" — Anexo III (r≥28%) ou Anexo V (r<28%)',
    baseLegal: 'LC 123/2006, Art. 18, §5º-I, X'
  },
  // Inciso XI
  {
    inciso: 'XI',
    descricao: 'Agenciamento, exceto de mão de obra',
    exemplosAtividades: ['Agentes de viagem', 'Agenciadores de publicidade', 'Agentes de propriedade industrial'],
    exemplosCNAE: ['79.11-2', '79.12-1', '74.90-1'],
    tributacaoAtual: 'Fator "r" — Anexo III (r≥28%) ou Anexo V (r<28%)',
    baseLegal: 'LC 123/2006, Art. 18, §5º-I, XI'
  },
  // Inciso XII — Cláusula residual
  {
    inciso: 'XII',
    descricao: 'Outras atividades do setor de serviços que tenham por finalidade a prestação de serviços decorrentes do exercício de atividade intelectual, de natureza técnica, científica, desportiva, artística ou cultural, que constitua profissão regulamentada ou não',
    exemplosAtividades: ['Consultores em geral', 'Profissionais liberais', 'Treinadores esportivos', 'Professores', 'Artistas'],
    exemplosCNAE: ['Diversos — verificar enquadramento específico'],
    tributacaoAtual: 'Fator "r" — Anexo III (r≥28%) ou Anexo V (r<28%)',
    baseLegal: 'LC 123/2006, Art. 18, §5º-I, XII',
    observacao: 'Cláusula residual — aplica-se quando não sujeitas à tributação na forma dos Anexos III, IV ou V'
  }
];


// ================================================================================
// SEÇÃO 22: REGRAS DE TRIBUTAÇÃO ESPECIAL POR TIPO DE ATIVIDADE
// ================================================================================

/**
 * Mapeamento completo das regras de tributação por tipo de serviço/atividade.
 * Essencial para determinar o MENOR imposto legal possível.
 *
 * Base legal: LC 123/2006, Art. 18, §§4º a 5º-I (redação LC 147/2014 e LC 155/2016).
 */
const REGRAS_TRIBUTACAO_ATIVIDADE = {
  // Art. 18, §4º, I — Comércio
  comercio_revenda: {
    descricao: 'Revenda de mercadorias',
    anexo: 'I',
    tipo: 'fixo',
    baseLegal: 'LC 123/2006, Art. 18, §4º, I'
  },

  // Art. 18, §4º, II — Indústria
  industria: {
    descricao: 'Venda de mercadorias industrializadas pelo contribuinte',
    anexo: 'II',
    tipo: 'fixo',
    baseLegal: 'LC 123/2006, Art. 18, §4º, II'
  },

  // Art. 18, §4º, III — Serviços Anexo III (§5º-B)
  servicos_anexo_iii_fixo: {
    descricao: 'Serviços do §5º-B (corretagem de imóveis, bens imóveis, fisioterapia, corretagem de seguros, etc.)',
    anexo: 'III',
    tipo: 'fixo',
    baseLegal: 'LC 123/2006, Art. 18, §4º, III c/c §5º-B',
    servicos: [
      'Locação de bens imóveis e corretagem de imóveis',
      'Fisioterapia',
      'Corretagem de seguros',
      'Creches e pré-escolas',
      'Academias de dança, capoeira, yoga, artes marciais',
      'Academias de atividades físicas/desportivas/natação',
      'Elaboração de programas de computador',
      'Licenciamento de programas de computador customizáveis',
      'Planejamento, confecção, manutenção e atualização de páginas eletrônicas',
      'Escritórios de serviços contábeis (condições especiais)',
      'Produções cinematográficas, audiovisuais, artísticas e culturais',
      'Serviços de transporte municipal de passageiros',
      'Empresas montadoras de stands',
      'Agências lotéricas',
      'Serviços de instalação, manutenção e reparação',
      'Serviços de comunicação por conta e ordem de terceiros',
      'Serviços de varrição, coleta de resíduos (não perigosos), limpeza urbana'
    ]
  },

  // Art. 18, §4º, V — Locação de bens móveis (Anexo III SEM ISS)
  locacao_bens_moveis: {
    descricao: 'Locação de bens móveis',
    anexo: 'III',
    tipo: 'fixo',
    deducaoISS: true,
    baseLegal: 'LC 123/2006, Art. 18, §4º, V',
    observacao: '⭐ BENEFÍCIO: Tributada no Anexo III, MAS deduzida a parcela do ISS (locação de bem móvel não é prestação de serviço = sem ISS). Reduz alíquota efetiva!'
  },

  // Art. 18, §4º, VI — IPI + ISS simultâneo
  ipi_mais_iss: {
    descricao: 'Atividade com incidência simultânea de IPI e ISS',
    anexo: 'II',
    tipo: 'fixo',
    deducaoICMS: true,
    acrescimoISS_Anexo_III: true,
    baseLegal: 'LC 123/2006, Art. 18, §4º, VI',
    observacao: 'Tributada no Anexo II, deduzida parcela ICMS, acrescida parcela ISS do Anexo III'
  },

  // Art. 18, §4º, VII — Medicamentos manipulados
  medicamentos_manipulados_encomenda: {
    descricao: 'Medicamentos/produtos magistrais sob encomenda pessoal',
    anexo: 'III',
    tipo: 'fixo',
    baseLegal: 'LC 123/2006, Art. 18, §4º, VII, "a"'
  },
  medicamentos_manipulados_geral: {
    descricao: 'Medicamentos/produtos magistrais — demais casos (venda em prateleira)',
    anexo: 'I',
    tipo: 'fixo',
    baseLegal: 'LC 123/2006, Art. 18, §4º, VII, "b"'
  },

  // Art. 18, §5º-C — Serviços com Fator "r" (Advocacia incluída no Anexo IV)
  servicos_5C: {
    descricao: 'Serviços do §5º-C, incluindo advocacia',
    tipo: 'misto',
    baseLegal: 'LC 123/2006, Art. 18, §5º-C',
    servicos: [
      'Administração e locação de imóveis de terceiros',
      'Academias de atividades físicas em geral',
      'Centros de cultura, arte e educação',
      'Laboratórios de análises clínicas',
      'Serviços de tomografia e diagnósticos médicos',
      'Serviços de prótese em geral',
      'Serviços advocatícios (Anexo IV — SEM CPP no DAS)'
    ],
    observacao: 'Advocacia é tributada no Anexo IV (sem CPP no DAS). Demais podem usar Fator "r".'
  },

  // Art. 18, §5º-E — Transporte e comunicação (REGRA ESPECIAL)
  transporte_comunicacao: {
    descricao: 'Comunicação e transportes interestadual/intermunicipal de cargas e passageiros (modalidades autorizadas)',
    tipo: 'especial',
    regra: 'Anexo III (base), deduzida parcela ISS, acrescida parcela ICMS do Anexo I',
    baseLegal: 'LC 123/2006, Art. 18, §5º-E (redação LC 147/2014)',
    observacao: 'Transporte fluvial incluso. Transporte urbano/metropolitano e fretamento contínuo de estudantes/trabalhadores também.'
  },

  // Art. 18, §5º-F — Serviços do §2º do Art. 17
  servicos_art17_paragrafo2: {
    descricao: 'Serviços não vedados do §2º do Art. 17',
    tipo: 'misto',
    regra: 'Tributados no Anexo III, SALVO se houver previsão expressa nos Anexos IV, V ou VI',
    baseLegal: 'LC 123/2006, Art. 18, §5º-F (redação LC 147/2014)',
    observacao: 'Regra residual favorável — na dúvida, aplica-se Anexo III (alíquotas menores)'
  },

  // Art. 18, §5º-I — Serviços intelectuais/técnicos (ver ATIVIDADES_PARAGRAFO_5I)
  servicos_intelectuais_5I: {
    descricao: 'Serviços intelectuais, técnicos, científicos, artísticos, desportivos (§5º-I)',
    tipo: 'fator_r',
    anexoFatorRAlto: 'III',
    anexoFatorRBaixo: 'V',
    baseLegal: 'LC 123/2006, Art. 18, §5º-I (redação LC 147/2014); LC 155/2016 (migração Fator "r")',
    observacao: 'Após LC 155/2016: Fator "r" ≥ 28% → Anexo III; Fator "r" < 28% → Anexo V'
  }
};


// ================================================================================
// SEÇÃO 23: REDUÇÕES LEGAIS E BENEFÍCIOS PARA MENOR IMPOSTO
// ================================================================================

/**
 * Catálogo completo de TODAS as reduções, isenções e benefícios fiscais legais
 * disponíveis no Simples Nacional para pagar o menor imposto possível.
 *
 * CADA redução inclui: base legal, condições de aplicação, impacto estimado
 * e função de cálculo que pode ser importada por outro arquivo.
 *
 * Base legal: LC 123/2006 (redações LC 147/2014 e LC 155/2016);
 *             Resolução CGSN 140/2018.
 */
const REDUCOES_LEGAIS = [
  // ─── 1. TRIBUTAÇÃO MONOFÁSICA ────────────────────────────────────────────────
  {
    id: 'monofasica',
    titulo: 'Tributação Monofásica (concentrada em etapa única)',
    descricao: 'Produtos com PIS/COFINS já recolhidos na indústria/importador. O revendedor NÃO paga PIS/COFINS novamente no DAS.',
    aplicavelA: ['Anexo I', 'Anexo II'],
    tributoReduzido: ['PIS/PASEP', 'COFINS'],
    tipoReducao: 'exclusao_base_calculo',
    baseLegal: 'LC 123/2006, Art. 18, §4º-A, I; Resolução CGSN 140/2018, Art. 25, I',
    condicoes: 'Produto deve estar na lista de tributação monofásica (Art. 13, §1º, XIII, "a")',
    produtosComuns: [
      'Combustíveis e lubrificantes',
      'Medicamentos e produtos farmacêuticos',
      'Cosméticos e perfumaria',
      'Bebidas frias (água, refrescos, cervejas)',
      'Autopeças',
      'Pneus e câmaras de ar',
      'Máquinas e veículos',
      'Cigarros e derivados do fumo'
    ],
    impactoEstimado: 'Redução de 3,65% a 9,25% no valor do DAS sobre receita desses produtos',
    /** Calcula redução mensal por monofásica */
    calcularReducao: function(receitaMonofasica, aliquotaEfetiva, faixa, anexo) {
      if (!receitaMonofasica || receitaMonofasica <= 0 || !PARTILHA[anexo]) return 0;
      const idx = faixa - 1;
      const p = PARTILHA[anexo][idx];
      if (!p) return 0;
      const percPisCofins = (p.pis || 0) + (p.cofins || 0);
      return _arredondar(receitaMonofasica * aliquotaEfetiva * percPisCofins);
    }
  },

  // ─── 2. SUBSTITUIÇÃO TRIBUTÁRIA (ICMS-ST) ─────────────────────────────────────
  {
    id: 'icms_st',
    titulo: 'ICMS já recolhido por Substituição Tributária',
    descricao: 'Quando o ICMS já foi recolhido por ST (pelo fabricante/importador), o revendedor deduz a parcela do ICMS do DAS.',
    aplicavelA: ['Anexo I', 'Anexo II'],
    tributoReduzido: ['ICMS'],
    tipoReducao: 'exclusao_base_calculo',
    baseLegal: 'LC 123/2006, Art. 18, §4º-A, I; Resolução CGSN 140/2018, Art. 25, I',
    condicoes: 'ICMS deve ter sido recolhido antecipadamente por ST',
    impactoEstimado: 'Redução de até 3,35% do valor do DAS (parcela ICMS excluída)',
    calcularReducao: function(receitaST, aliquotaEfetiva, faixa, anexo) {
      if (!receitaST || receitaST <= 0 || !PARTILHA[anexo]) return 0;
      const idx = faixa - 1;
      const p = PARTILHA[anexo][idx];
      if (!p) return 0;
      return _arredondar(receitaST * aliquotaEfetiva * (p.icms || 0));
    }
  },

  // ─── 3. ISS RETIDO NA FONTE ────────────────────────────────────────────────────
  {
    id: 'iss_retido_fonte',
    titulo: 'ISS retido na fonte pelo tomador do serviço',
    descricao: 'Quando o ISS é retido na fonte pelo tomador, o valor deve ser DEDUZIDO do DAS para evitar bitributação.',
    aplicavelA: ['Anexo III', 'Anexo IV', 'Anexo V'],
    tributoReduzido: ['ISS'],
    tipoReducao: 'deducao_das',
    baseLegal: 'LC 123/2006, Art. 18, §4º-A, II c/c Art. 21, §4º',
    condicoes: 'ISS retido deve estar informado no documento fiscal. Tomador deve estar em município diverso do prestador.',
    impactoEstimado: 'Dedução de 2% a 5% do valor da nota fiscal do DAS mensal',
    calcularReducao: function(valorISSRetido) {
      return _arredondar(Math.max(0, valorISSRetido || 0));
    }
  },

  // ─── 4. ISS VALOR FIXO MUNICIPAL ──────────────────────────────────────────────
  {
    id: 'iss_valor_fixo',
    titulo: 'ISS em valor fixo mensal (municipal)',
    descricao: 'Municípios podem estabelecer valor fixo de ISS para ME com receita até a 2ª faixa, substituindo o percentual variável.',
    aplicavelA: ['Anexo III', 'Anexo IV', 'Anexo V'],
    tributoReduzido: ['ISS'],
    tipoReducao: 'valor_fixo',
    baseLegal: 'LC 123/2006, Art. 18, §§18 e 18-A (redação LC 147/2014)',
    condicoes: 'Microempresa com RBT12 até o limite da 2ª faixa de receitas. Município deve ter legislação específica.',
    limiteRBT12: 360_000.00,
    impactoEstimado: 'Pode reduzir ISS significativamente para microempresas de baixo faturamento'
  },

  // ─── 5. EXPORTAÇÃO — ISENÇÃO DE TRIBUTOS ──────────────────────────────────────
  {
    id: 'exportacao_isencao',
    titulo: 'Isenção de tributos sobre receita de exportação',
    descricao: 'Receitas de exportação são isentas de COFINS, PIS/PASEP, IPI, ICMS e ISS dentro do DAS. Paga-se apenas IRPJ, CSLL e CPP.',
    aplicavelA: ['Todos os Anexos'],
    tributoReduzido: ['COFINS', 'PIS/PASEP', 'IPI', 'ICMS', 'ISS'],
    tipoReducao: 'isencao_exportacao',
    baseLegal: 'LC 123/2006, Art. 18, §14 e §4º-A, IV (redação LC 147/2014); Art. 3º, §14',
    condicoes: 'Receitas de exportação de mercadorias ou serviços, inclusive via comercial exportadora. Exportação também não pode exceder o limite de R$ 4,8M.',
    impactoEstimado: 'Redução de 40% a 70% da alíquota efetiva sobre receita exportada',
    calcularReducao: function(receitaExportacao, aliquotaEfetiva, faixa, anexo) {
      if (!receitaExportacao || receitaExportacao <= 0 || !PARTILHA[anexo]) return 0;
      const idx = faixa - 1;
      const p = PARTILHA[anexo][idx];
      if (!p) return 0;
      const percIsentos = (p.cofins || 0) + (p.pis || 0) + (p.ipi || 0) + (p.icms || 0) + (p.iss || 0);
      return _arredondar(receitaExportacao * aliquotaEfetiva * percIsentos);
    }
  },

  // ─── 6. RECEITAS COM ISENÇÃO OU REDUÇÃO DE ICMS/ISS ──────────────────────────
  {
    id: 'isencao_reducao_icms_iss',
    titulo: 'Receitas com isenção ou redução de ICMS ou ISS',
    descricao: 'Quando há isenção ou redução de ICMS ou ISS concedida por legislação específica, a parcela desses tributos é deduzida do DAS.',
    aplicavelA: ['Todos os Anexos'],
    tributoReduzido: ['ICMS', 'ISS'],
    tipoReducao: 'isencao_reducao',
    baseLegal: 'LC 123/2006, Art. 18, §4º-A, III; Resolução CGSN 140/2018, Art. 25, III',
    condicoes: 'Deve haver legislação estadual/municipal específica concedendo isenção ou redução. Verificar regulamentação local.',
    impactoEstimado: 'Variável — pode representar de 2% a 5% de redução no DAS'
  },

  // ─── 7. CESTA BÁSICA — ISENÇÃO ESPECIAL ───────────────────────────────────────
  {
    id: 'cesta_basica',
    titulo: 'Isenção/redução de COFINS, PIS e ICMS para produtos de cesta básica',
    descricao: 'União, Estados e DF podem estabelecer isenção ou redução de COFINS, PIS/PASEP e ICMS para produtos da cesta básica vendidos por ME/EPP.',
    aplicavelA: ['Anexo I', 'Anexo II'],
    tributoReduzido: ['COFINS', 'PIS/PASEP', 'ICMS'],
    tipoReducao: 'isencao_cesta_basica',
    baseLegal: 'LC 123/2006, Art. 18, §20-B (redação LC 147/2014)',
    condicoes: 'Depende de lei específica federal, estadual ou distrital. Verificar legislação vigente.',
    impactoEstimado: 'Variável conforme legislação local'
  },

  // ─── 8. FATOR "r" OTIMIZADO (ESTRATÉGIA DE FOLHA) ─────────────────────────────
  {
    id: 'fator_r_otimizado',
    titulo: 'Otimização do Fator "r" para manter Anexo III',
    descricao: 'Manter o Fator "r" ≥ 28% garantindo tributação pelo Anexo III ao invés do Anexo V. Estratégia: aumentar pró-labore/folha de salários.',
    aplicavelA: ['Atividades §5º-I', 'Atividades §5º-C', 'Atividades com Fator "r"'],
    tributoReduzido: ['Alíquota global'],
    tipoReducao: 'planejamento_fator_r',
    baseLegal: 'LC 123/2006, Art. 18, §24 (redação LC 147/2014); Resolução CGSN 140/2018, Art. 18, §5º-J',
    condicoes: 'Fator "r" = Folha de Salários (12 meses) / Receita Bruta (12 meses). Folha inclui: salários, pró-labore, FGTS, encargos patronais.',
    impactoEstimado: 'Diferença de 9,5% na alíquota inicial (15,5% no Anexo V vs 6% no Anexo III). Economia de até R$ 200.000+ em empresas maiores.',
    /** Calcula folha mínima necessária para atingir Fator "r" de 28% */
    calcularFolhaMinima: function(rbt12) {
      return _arredondar(rbt12 * LIMITE_FATOR_R);
    },
    /** Calcula economia ao manter Anexo III vs cair no Anexo V */
    calcularEconomiaAnexoIIIvsV: function(rbt12, receitaMensal) {
      if (!rbt12 || rbt12 <= 0 || !receitaMensal) return 0;
      try {
        const aliqIII = calcularAliquotaEfetiva({ rbt12, anexo: 'III' });
        const aliqV = calcularAliquotaEfetiva({ rbt12, anexo: 'V' });
        const dasIII = receitaMensal * aliqIII.aliquotaEfetiva;
        const dasV = receitaMensal * aliqV.aliquotaEfetiva;
        return _arredondar(dasV - dasIII);
      } catch (e) {
        return 0;
      }
    }
  },

  // ─── 9. REGIME DE CAIXA ────────────────────────────────────────────────────────
  {
    id: 'regime_caixa',
    titulo: 'Opção pelo regime de caixa',
    descricao: 'Reconhecer receitas apenas quando efetivamente recebidas (não quando faturadas). Adia o pagamento de tributos para o mês do recebimento.',
    aplicavelA: ['Todos os Anexos'],
    tributoReduzido: ['Fluxo de caixa'],
    tipoReducao: 'diferimento',
    baseLegal: 'LC 123/2006, Art. 18, §3º; Resolução CGSN 140/2018, Art. 16',
    condicoes: 'Opção feita no PGDAS-D no mês de janeiro ou no início de atividade. Irretratável para o ano-calendário.',
    impactoEstimado: 'Não reduz alíquota, mas melhora o fluxo de caixa significativamente. Tributo pago apenas sobre receita efetivamente recebida.'
  },

  // ─── 10. ANTECIPAÇÃO TRIBUTÁRIA COM ENCERRAMENTO ──────────────────────────────
  {
    id: 'antecipacao_encerramento',
    titulo: 'Antecipação tributária de ICMS com encerramento',
    descricao: 'Quando o ICMS já foi recolhido por antecipação tributária com encerramento de tributação, a parcela do ICMS é excluída do DAS.',
    aplicavelA: ['Anexo I', 'Anexo II'],
    tributoReduzido: ['ICMS'],
    tipoReducao: 'exclusao_base_calculo',
    baseLegal: 'LC 123/2006, Art. 18, §4º-A, I; Art. 13, §1º, XIII, "a" (redação LC 147/2014)',
    condicoes: 'ICMS deve ter sido recolhido por antecipação com encerramento de tributação.',
    impactoEstimado: 'Similar ao ICMS-ST — redução da parcela ICMS no DAS'
  },

  // ─── 11. MULTAS REDUZIDAS (Art. 38-B) ─────────────────────────────────────────
  {
    id: 'multas_reduzidas',
    titulo: 'Redução de multas por obrigações acessórias',
    descricao: 'Multas em valor fixo ou mínimo por descumprimento de obrigações acessórias são reduzidas: 90% para MEI e 50% para ME/EPP no Simples.',
    aplicavelA: ['MEI', 'ME', 'EPP optante Simples'],
    tributoReduzido: ['Multas'],
    tipoReducao: 'reducao_penalidades',
    baseLegal: 'LC 123/2006, Art. 38-B (incluído LC 147/2014)',
    condicoes: 'Multa em valor fixo ou mínimo. Não se aplica em caso de fraude, resistência ou embaraço à fiscalização. Pagamento em 30 dias.',
    reducaoMEI: 0.90,
    reducaoME_EPP: 0.50,
    excecoes: ['Fraude', 'Resistência à fiscalização', 'Embaraço à fiscalização', 'Não pagamento em 30 dias'],
    calcularMultaReduzida: function(valorMultaOriginal, tipoEmpresa) {
      if (tipoEmpresa === 'MEI') return _arredondar(valorMultaOriginal * (1 - 0.90));
      if (tipoEmpresa === 'ME' || tipoEmpresa === 'EPP') return _arredondar(valorMultaOriginal * (1 - 0.50));
      return valorMultaOriginal;
    }
  },

  // ─── 12. FISCALIZAÇÃO ORIENTADORA (DUPLA VISITA) ──────────────────────────────
  {
    id: 'fiscalizacao_orientadora',
    titulo: 'Fiscalização de natureza prioritariamente orientadora (dupla visita)',
    descricao: 'Antes de autuar, o fiscal deve orientar a ME/EPP na primeira visita. Auto de infração SEM dupla visita é NULO.',
    aplicavelA: ['ME', 'EPP'],
    tributoReduzido: ['Multas', 'Autos de infração'],
    tipoReducao: 'protecao_legal',
    baseLegal: 'LC 123/2006, Art. 55, §§5º e 6º (redação LC 147/2014)',
    condicoes: 'Aplica-se a aspectos trabalhista, metrológico, sanitário, ambiental, de segurança e uso do solo. Atividade deve comportar grau de risco compatível.',
    excecoesAplicacao: [
      'Infrações trabalhistas (exceto obrigações acessórias)',
      'Ocupação irregular de reserva de faixa não edificável',
      'Áreas de preservação permanente',
      'Faixas de domínio público de rodovias/ferrovias'
    ],
    impactoEstimado: 'Nulidade de autos de infração que não cumpriram critério da dupla visita. Proteção legal significativa.'
  },

  // ─── 13. LOCAÇÃO DE BENS MÓVEIS SEM ISS ──────────────────────────────────────
  {
    id: 'locacao_bens_moveis_sem_iss',
    titulo: 'Locação de bens móveis — dedução do ISS',
    descricao: 'Locação de bens móveis é tributada no Anexo III, MAS com dedução da parcela ISS, pois locação não constitui prestação de serviço para fins de ISS.',
    aplicavelA: ['Anexo III'],
    tributoReduzido: ['ISS'],
    tipoReducao: 'deducao_iss',
    baseLegal: 'LC 123/2006, Art. 18, §4º, V',
    impactoEstimado: 'Redução de até 5% (parcela ISS) na alíquota efetiva sobre receita de locação',
    calcularReducao: function(receitaLocacao, aliquotaEfetiva, faixa) {
      if (!receitaLocacao || !PARTILHA.III) return 0;
      const idx = faixa - 1;
      const p = PARTILHA.III[idx];
      if (!p) return 0;
      return _arredondar(receitaLocacao * aliquotaEfetiva * (p.iss || 0));
    }
  }
];


// ================================================================================
// SEÇÃO 24: SEGREGAÇÃO DE RECEITAS — REGRAS PARA MENOR TRIBUTAÇÃO
// ================================================================================

/**
 * Regras de segregação de receitas no PGDAS-D.
 * A segregação CORRETA é OBRIGATÓRIA e pode gerar economia tributária significativa.
 *
 * Base legal: LC 123/2006, Art. 18, §§4º e 4º-A (redação LC 147/2014);
 *             Resolução CGSN 140/2018, Art. 25.
 */
const SEGREGACAO_RECEITAS = {
  descricao: 'Regras para segregação obrigatória de receitas no PGDAS-D para cálculo correto (e otimizado) do DAS',
  baseLegal: 'LC 123/2006, Art. 18, §§4º e 4º-A; Resolução CGSN 140/2018, Art. 25',

  /** Tipos de segregação com impacto na tributação */
  tipos: [
    {
      id: 'monofasica',
      descricao: 'Receitas com PIS/COFINS monofásico',
      impactoTributario: 'REDUZ DAS — exclui parcela PIS/COFINS',
      baseLegal: 'Art. 18, §4º-A, I',
      comoInformar: 'Marcar como "Tributação Monofásica" no PGDAS-D para PIS/COFINS'
    },
    {
      id: 'icms_st',
      descricao: 'Receitas com ICMS já recolhido por ST',
      impactoTributario: 'REDUZ DAS — exclui parcela ICMS',
      baseLegal: 'Art. 18, §4º-A, I',
      comoInformar: 'Marcar como "Substituição Tributária" no PGDAS-D para ICMS'
    },
    {
      id: 'iss_retido',
      descricao: 'Receitas com ISS retido na fonte',
      impactoTributario: 'REDUZ DAS — deduz valor do ISS retido',
      baseLegal: 'Art. 18, §4º-A, II',
      comoInformar: 'Informar valor do ISS retido no PGDAS-D'
    },
    {
      id: 'isencao_icms_iss',
      descricao: 'Receitas com isenção/redução de ICMS ou ISS',
      impactoTributario: 'REDUZ DAS — exclui/reduz parcela isenta',
      baseLegal: 'Art. 18, §4º-A, III',
      comoInformar: 'Marcar receita como sujeita à isenção/redução no PGDAS-D'
    },
    {
      id: 'exportacao',
      descricao: 'Receitas de exportação de mercadorias ou serviços',
      impactoTributario: 'REDUZ DAS SIGNIFICATIVAMENTE — exclui COFINS, PIS, IPI, ICMS, ISS',
      baseLegal: 'Art. 18, §4º-A, IV',
      comoInformar: 'Informar receita como "Exportação" no PGDAS-D'
    },
    {
      id: 'iss_municipio_diverso',
      descricao: 'ISS devido a município diverso do estabelecimento prestador',
      impactoTributario: 'NEUTRO — ISS recolhido dentro do DAS mas para outro município',
      baseLegal: 'Art. 18, §4º-A, V',
      comoInformar: 'Informar o município onde o ISS é devido no PGDAS-D'
    }
  ],

  /** Fórmula legal de apuração do montante devido (Art. 18, §12) */
  formulaReducao: 'Na apuração do montante mensal, para receitas dos tipos acima, serão consideradas as reduções relativas aos tributos já recolhidos, monofásicos, isentos, reduzidos ou retidos.',

  /** Alerta importante */
  alerta: '⚠️ ATENÇÃO: A falta de segregação correta pode resultar em PAGAMENTO A MAIOR de tributos. Verificar mensalmente se todas as receitas estão corretamente classificadas no PGDAS-D.'
};


// ================================================================================
// SEÇÃO 25: DADOS DO MEI (Microempreendedor Individual)
// ================================================================================

/**
 * Constantes e regras do MEI — Microempreendedor Individual.
 * Base legal: LC 123/2006, Arts. 18-A a 18-E (redação LC 147/2014 e LC 155/2016).
 */
const MEI = {
  /** Limite de receita bruta anual — MEI (atualizado LC 188/2021) */
  limiteReceitaAnual: 81_000.00,
  limiteReceitaMensal: 6_750.00,

  /** Limitar de receita em início de atividade — proporcional ao mês */
  limiteReceitaProporcional: 'R$ 6.750,00 por mês de atividade no ano',

  /** Valores fixos mensais do DAS-MEI (atualizados anualmente conforme salário mínimo) */
  valores2025: {
    inss: null, // 5% do salário mínimo — atualizar conforme SM vigente
    percentualINSS: 0.05,
    icms: 1.00,
    iss: 5.00,
    baseLegal: 'LC 123/2006, Art. 18-A, §3º, V'
  },

  /** Benefícios especiais do MEI (LC 147/2014) */
  beneficios: [
    {
      titulo: 'Isenção de taxas de registro e legalização',
      baseLegal: 'LC 123/2006, Art. 4º, §3º (redação LC 147/2014)',
      descricao: 'Todos os custos de abertura, registro, funcionamento, alvará, licença reduzidos a ZERO.'
    },
    {
      titulo: 'Isenção de vigilância sanitária',
      baseLegal: 'LC 123/2006, Art. 4º, §3º-A (incluído LC 147/2014)',
      descricao: 'Isento de taxas de fiscalização da vigilância sanitária.'
    },
    {
      titulo: 'Redução de 90% em multas',
      baseLegal: 'LC 123/2006, Art. 38-B, I (incluído LC 147/2014)',
      descricao: 'Multas por obrigações acessórias em valor fixo ou mínimo reduzidas em 90%.'
    },
    {
      titulo: 'IPTU mais favorável para MEI que atua em casa',
      baseLegal: 'LC 123/2006, Art. 18-D (incluído LC 147/2014)',
      descricao: 'Menor alíquota vigente (residencial ou comercial) para MEI que atua no mesmo local de residência.'
    },
    {
      titulo: 'Vedação de cobrança associativa indevida',
      baseLegal: 'LC 123/2006, Art. 4º, §4º (redação LC 147/2014)',
      descricao: 'Cobrança de sindicatos/associações só com contrato assinado pelo próprio MEI.'
    },
    {
      titulo: 'Vedação de aumento de tarifas de concessionárias',
      baseLegal: 'LC 123/2006, Art. 18-A, §22 (incluído LC 147/2014)',
      descricao: 'Concessionárias não podem aumentar tarifas por conta da condição de PJ do MEI.'
    },
    {
      titulo: 'Cancelamento automático por inatividade',
      baseLegal: 'LC 123/2006, Art. 18-A, §15-B (incluído LC 147/2014)',
      descricao: '12 meses sem recolhimento ou declarações = cancelamento automático (sem penalidades adicionais).'
    },
    {
      titulo: 'Participação em licitações',
      baseLegal: 'LC 123/2006, Art. 18-E, §4º (incluído LC 147/2014)',
      descricao: 'Vedado impor restrições ao MEI em licitações por sua natureza jurídica.'
    }
  ],

  /** Vedações — quem NÃO pode ser MEI */
  vedacoes: [
    'Atividades do Anexo V ou VI (salvo autorização CGSN) — Art. 18-A, §4º, I (LC 147/2014)',
    'Sócio, administrador ou titular de outra empresa',
    'Receita bruta > R$ 81.000 no ano anterior',
    'Exercício de atividade vedada na lista CGSN'
  ],

  baseLegal: 'LC 123/2006, Arts. 18-A a 18-E (redação LC 147/2014 e LC 155/2016)'
};


// ================================================================================
// SEÇÃO 26: BENEFÍCIOS EM LICITAÇÕES E COMPRAS PÚBLICAS
// ================================================================================

/**
 * Tratamento diferenciado para ME/EPP em licitações e contratações públicas.
 * Base legal: LC 123/2006, Arts. 43 a 49 (redação LC 147/2014);
 *             Lei 8.666/1993, Arts. 3º e 5º-A (redação LC 147/2014).
 */
const LICITACOES_BENEFICIOS = {
  descricao: 'Tratamento diferenciado em contratações públicas para ME/EPP',
  baseLegal: 'LC 123/2006, Arts. 43 a 49 (redação LC 147/2014); Lei 8.666/1993, Art. 3º, §14',

  beneficios: [
    {
      titulo: 'Licitação exclusiva até R$ 80.000',
      descricao: 'Administração pública DEVERÁ realizar processo licitatório destinado EXCLUSIVAMENTE a ME/EPP nos itens de até R$ 80.000.',
      valorLimite: 80_000.00,
      obrigatorioPara: 'Administração pública direta e indireta, federal, estadual e municipal',
      baseLegal: 'LC 123/2006, Art. 48, I (redação LC 147/2014)'
    },
    {
      titulo: 'Subcontratação de ME/EPP',
      descricao: 'Pode ser exigida a subcontratação de ME/EPP em obras e serviços.',
      baseLegal: 'LC 123/2006, Art. 48, II (redação LC 147/2014)'
    },
    {
      titulo: 'Cota de 25% para ME/EPP',
      descricao: 'Administração DEVERÁ estabelecer cota de até 25% do objeto para contratação de ME/EPP em bens divisíveis.',
      percentualCota: 0.25,
      baseLegal: 'LC 123/2006, Art. 48, III (redação LC 147/2014)'
    },
    {
      titulo: 'Preferência local/regional',
      descricao: 'Prioridade para ME/EPP sediadas local ou regionalmente, até 10% do melhor preço válido.',
      percentualPreferencia: 0.10,
      baseLegal: 'LC 123/2006, Art. 48, §3º (redação LC 147/2014)'
    },
    {
      titulo: 'Prazo para regularização fiscal',
      descricao: '5 dias úteis para regularização de documentação fiscal após declarada vencedora, prorrogável por mais 5 dias.',
      prazo: '5 dias úteis + 5 dias (prorrogável)',
      baseLegal: 'LC 123/2006, Art. 43, §1º (redação LC 147/2014)'
    },
    {
      titulo: 'Preferência em compras diretas (dispensa)',
      descricao: 'Em dispensas de licitação (incisos I e II do Art. 24 da Lei 8.666), compra PREFERENCIAL de ME/EPP.',
      baseLegal: 'LC 123/2006, Art. 49, IV (redação LC 147/2014)'
    },
    {
      titulo: 'Prioridade sobre preferências estrangeiras',
      descricao: 'Preferências para ME/EPP prevalecem sobre preferências para produtos/serviços estrangeiros.',
      baseLegal: 'Lei 8.666/1993, Art. 3º, §15 (incluído LC 147/2014)'
    }
  ]
};


// ================================================================================
// SEÇÃO 27: RECUPERAÇÃO JUDICIAL — BENEFÍCIOS ME/EPP
// ================================================================================

/**
 * Benefícios em recuperação judicial para ME/EPP.
 * Base legal: Lei 11.101/2005 (com alterações da LC 147/2014).
 */
const RECUPERACAO_JUDICIAL = {
  descricao: 'Benefícios especiais em recuperação judicial para ME/EPP',
  baseLegal: 'Lei 11.101/2005, alterada pela LC 147/2014',

  beneficios: [
    {
      titulo: 'Remuneração reduzida do administrador judicial',
      descricao: 'Limitada a 2% (vs até 5% para demais empresas)',
      baseLegal: 'Lei 11.101/2005, Art. 24, §5º'
    },
    {
      titulo: 'Classe própria de credores',
      descricao: 'Créditos de ME/EPP formam classe própria (Classe IV)',
      baseLegal: 'Lei 11.101/2005, Art. 41, IV'
    },
    {
      titulo: 'Aprovação por maioria simples',
      descricao: 'Plano de recuperação aprovado por maioria simples de credores presentes (não por valor)',
      baseLegal: 'Lei 11.101/2005, Art. 45, §2º'
    },
    {
      titulo: 'Parcelamento em até 36 vezes',
      descricao: 'Plano especial com parcelamento em até 36 parcelas mensais, com juros SELIC + possibilidade de abatimento',
      baseLegal: 'Lei 11.101/2005, Art. 71, II'
    },
    {
      titulo: 'Prazos 20% superiores',
      descricao: 'ME/EPP fazem jus a prazos 20% maiores que demais empresas no processo',
      baseLegal: 'Lei 11.101/2005, Art. 68, parágrafo único'
    },
    {
      titulo: 'Preferência na ordem de pagamento',
      descricao: 'Créditos de ME/EPP têm preferência na Classe IV (quirografários prioritários)',
      baseLegal: 'Lei 11.101/2005, Art. 83, IV, "d"'
    }
  ]
};


// ================================================================================
// SEÇÃO 28: ESTRATÉGIAS LEGAIS PARA MENOR IMPOSTO — RESUMO EXECUTIVO
// ================================================================================

/**
 * Resumo consolidado de TODAS as estratégias legais para pagar o menor imposto
 * possível no Simples Nacional. Referências cruzadas com as seções acima.
 *
 * Organizadas por impacto (alto/médio/baixo) e facilidade de implementação.
 *
 * Pode ser importado por segundo arquivo para gerar relatório ou dashboard.
 */
const ESTRATEGIAS_MENOR_IMPOSTO = [
  {
    id: 'E01',
    prioridade: 1,
    impacto: 'critico',
    titulo: 'Manter Fator "r" ≥ 28% (Anexo III vs V)',
    descricao: 'Garantir que a razão folha/receita fique ≥ 28% para tributação pelo Anexo III.',
    economiaEstimada: 'Até 9,5 p.p. na alíquota nominal (6% vs 15,5% na 1ª faixa)',
    comoFazer: [
      'Ajustar pró-labore dos sócios para manter folha proporcional',
      'Incluir FGTS e encargos no cálculo da folha',
      'Monitorar mensalmente a relação folha/receita',
      'Se receita crescer, aumentar folha proporcionalmente'
    ],
    referencia: 'REDUCOES_LEGAIS[7] (fator_r_otimizado)',
    baseLegal: 'LC 123/2006, Art. 18, §24 e §5º-J'
  },
  {
    id: 'E02',
    prioridade: 2,
    impacto: 'alto',
    titulo: 'Segregar receitas com tributação monofásica',
    descricao: 'Identificar e segregar no PGDAS-D as receitas de produtos com PIS/COFINS monofásico.',
    economiaEstimada: 'Redução de 3,65% a 9,25% sobre receita de produtos monofásicos',
    comoFazer: [
      'Listar todos os produtos vendidos que possuem tributação monofásica',
      'Classificar corretamente no PGDAS-D mensalmente',
      'Manter documentação comprobatória (NCM dos produtos)'
    ],
    referencia: 'REDUCOES_LEGAIS[0] (monofasica)',
    baseLegal: 'LC 123/2006, Art. 18, §4º-A, I'
  },
  {
    id: 'E03',
    prioridade: 3,
    impacto: 'alto',
    titulo: 'Segregar receitas com ICMS-ST',
    descricao: 'Excluir parcela ICMS do DAS quando já recolhido por substituição tributária.',
    economiaEstimada: 'Até 3,35% de redução no DAS (parcela ICMS)',
    comoFazer: [
      'Identificar notas de compra com ICMS-ST destacado',
      'Segregar revenda destes produtos no PGDAS-D',
      'Manter documentação fiscal organizada'
    ],
    referencia: 'REDUCOES_LEGAIS[1] (icms_st)',
    baseLegal: 'LC 123/2006, Art. 18, §4º-A, I'
  },
  {
    id: 'E04',
    prioridade: 4,
    impacto: 'alto',
    titulo: 'Deduzir ISS retido na fonte do DAS',
    descricao: 'Abater do DAS o ISS que já foi retido na fonte pelo tomador do serviço.',
    economiaEstimada: '2% a 5% do valor das notas com ISS retido',
    comoFazer: [
      'Identificar todas as notas com ISS retido',
      'Informar o valor retido no PGDAS-D mensalmente',
      'Conferir com o tomador a efetiva retenção e recolhimento'
    ],
    referencia: 'REDUCOES_LEGAIS[2] (iss_retido_fonte)',
    baseLegal: 'LC 123/2006, Art. 18, §4º-A, II; Art. 21, §4º'
  },
  {
    id: 'E05',
    prioridade: 5,
    impacto: 'alto',
    titulo: 'Isenções sobre receitas de exportação',
    descricao: 'Receitas de exportação são isentas de COFINS, PIS, IPI, ICMS e ISS no DAS.',
    economiaEstimada: '40% a 70% de redução na alíquota efetiva sobre exportação',
    comoFazer: [
      'Classificar receitas de exportação separadamente no PGDAS-D',
      'Incluir exportação via comercial exportadora ou SPE',
      'Manter documentação de exportação (DU-E, contratos)'
    ],
    referencia: 'REDUCOES_LEGAIS[4] (exportacao_isencao)',
    baseLegal: 'LC 123/2006, Art. 18, §14 e §4º-A, IV'
  },
  {
    id: 'E06',
    prioridade: 6,
    impacto: 'medio',
    titulo: 'Optar pelo regime de caixa',
    descricao: 'Reconhecer receitas apenas quando recebidas, adiando tributação.',
    economiaEstimada: 'Melhora fluxo de caixa — tributo pago somente sobre recebimentos efetivos',
    comoFazer: [
      'Optar pelo regime de caixa no PGDAS-D em janeiro',
      'Controlar rigorosamente recebimentos x faturamento',
      'Considerar se inadimplência é significativa'
    ],
    referencia: 'REDUCOES_LEGAIS[8] (regime_caixa)',
    baseLegal: 'LC 123/2006, Art. 18, §3º'
  },
  {
    id: 'E07',
    prioridade: 7,
    impacto: 'medio',
    titulo: 'Locação de bens móveis sem ISS',
    descricao: 'Segregar receita de locação de bens móveis para deduzir parcela ISS do DAS.',
    economiaEstimada: 'Até 5% de redução na alíquota sobre receita de locação',
    comoFazer: [
      'Classificar receita de locação separadamente no PGDAS-D',
      'Emitir notas específicas para locação (sem ISS)'
    ],
    referencia: 'REDUCOES_LEGAIS[12] (locacao_bens_moveis_sem_iss)',
    baseLegal: 'LC 123/2006, Art. 18, §4º, V'
  },
  {
    id: 'E08',
    prioridade: 8,
    impacto: 'medio',
    titulo: 'Escrituração contábil para distribuição de lucros otimizada',
    descricao: 'Manter escrituração contábil completa para distribuir lucros acima da presunção (32%), com isenção de IRPF.',
    economiaEstimada: 'Distribuição isenta acima de 32% quando lucro contábil for maior',
    comoFazer: [
      'Contratar contador para escrituração contábil completa',
      'Apurar lucro contábil real mês a mês',
      'Distribuir o MAIOR entre presunção e lucro contábil'
    ],
    referencia: 'Função calcularDistribuicaoLucros()',
    baseLegal: 'LC 123/2006, Art. 14'
  },
  {
    id: 'E09',
    prioridade: 9,
    impacto: 'medio',
    titulo: 'Verificar isenções municipais/estaduais de ICMS/ISS',
    descricao: 'Identificar se há isenções ou reduções concedidas pelo município/estado para atividades específicas.',
    economiaEstimada: 'Variável — de 2% a 5% de redução no DAS',
    comoFazer: [
      'Consultar legislação municipal sobre ISS (alíquotas, isenções)',
      'Consultar legislação estadual sobre ICMS (incentivos, reduções)',
      'Informar corretamente no PGDAS-D'
    ],
    referencia: 'REDUCOES_LEGAIS[5] (isencao_reducao_icms_iss)',
    baseLegal: 'LC 123/2006, Art. 18, §4º-A, III'
  },
  {
    id: 'E10',
    prioridade: 10,
    impacto: 'baixo',
    titulo: 'Invocar fiscalização orientadora (dupla visita) contra autos de infração',
    descricao: 'Contestar autos de infração que não respeitaram o critério da dupla visita.',
    economiaEstimada: 'Nulidade de autos de infração — pode evitar multas significativas',
    comoFazer: [
      'Verificar se houve visita orientadora prévia',
      'Se não houve, impugnar o auto de infração com base no Art. 55',
      'Protocolar defesa administrativa citando §6º (nulidade)'
    ],
    referencia: 'REDUCOES_LEGAIS[11] (fiscalizacao_orientadora)',
    baseLegal: 'LC 123/2006, Art. 55, §§5º e 6º'
  }
];


// ================================================================================
// SEÇÃO 29: TABELA DE PRODUTOS COM TRIBUTAÇÃO MONOFÁSICA (REFERÊNCIA)
// ================================================================================

/**
 * Lista expandida de produtos sujeitos à tributação concentrada (monofásica),
 * conforme Art. 13, §1º, XIII, "a" (redação LC 147/2014).
 *
 * Para estes produtos, PIS/COFINS (e em alguns casos ICMS) já foram recolhidos
 * na etapa de fabricação/importação. O revendedor EXCLUI estas parcelas do DAS.
 *
 * IMPORTANTE: Esta lista é uma referência. A verificação final deve ser feita
 * pela NCM (Nomenclatura Comum do Mercosul) do produto.
 *
 * Base legal: LC 123/2006, Art. 13, §1º, XIII, "a" (redação LC 147/2014);
 *             Art. 18, §4º-A, I; Resolução CGSN 140/2018, Art. 25.
 */
const PRODUTOS_MONOFASICOS = [
  { categoria: 'Combustíveis e lubrificantes', tributosConcentrados: ['PIS', 'COFINS', 'ICMS'], baseLegal: 'Lei 10.336/2001; Lei 10.865/2004' },
  { categoria: 'Cigarros e derivados do fumo', tributosConcentrados: ['PIS', 'COFINS', 'IPI'], baseLegal: 'Lei 11.196/2005' },
  { categoria: 'Bebidas frias (água, refrescos, cervejas)', tributosConcentrados: ['PIS', 'COFINS'], baseLegal: 'Lei 13.097/2015' },
  { categoria: 'Medicamentos e produtos farmacêuticos', tributosConcentrados: ['PIS', 'COFINS'], baseLegal: 'Lei 10.147/2000' },
  { categoria: 'Cosméticos, perfumaria e higiene pessoal', tributosConcentrados: ['PIS', 'COFINS'], baseLegal: 'Lei 10.147/2000' },
  { categoria: 'Veículos automotivos e autopeças', tributosConcentrados: ['PIS', 'COFINS'], baseLegal: 'Lei 10.485/2002' },
  { categoria: 'Pneumáticos, câmaras de ar e protetores', tributosConcentrados: ['PIS', 'COFINS'], baseLegal: 'Lei 10.485/2002' },
  { categoria: 'Máquinas e veículos (peças e acessórios)', tributosConcentrados: ['PIS', 'COFINS'], baseLegal: 'Lei 10.485/2002' },
  { categoria: 'Energia elétrica', tributosConcentrados: ['PIS', 'COFINS', 'ICMS'], baseLegal: 'Lei 10.637/2002' },
  { categoria: 'Óleos e azeites vegetais comestíveis', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Convênio ICMS' },
  { categoria: 'Farinha de trigo e misturas', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Convênio ICMS' },
  { categoria: 'Massas alimentícias', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Art. 13, §8º (LC 147/2014) — somente escala industrial relevante' },
  { categoria: 'Açúcares', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Convênio ICMS' },
  { categoria: 'Produtos lácteos', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Art. 13, §8º (LC 147/2014) — somente escala industrial relevante' },
  { categoria: 'Carnes e preparações', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Art. 13, §8º (LC 147/2014) — somente escala industrial relevante' },
  { categoria: 'Preparações à base de cereais', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Art. 13, §8º (LC 147/2014)' },
  { categoria: 'Chocolates', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Art. 13, §8º (LC 147/2014)' },
  { categoria: 'Produtos de padaria, bolachas e biscoitos', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Art. 13, §8º (LC 147/2014)' },
  { categoria: 'Sorvetes e preparados para sorvetes', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Convênio ICMS' },
  { categoria: 'Cafés, mates, extratos e concentrados', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Convênio ICMS' },
  { categoria: 'Molhos e preparações para molhos', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Art. 13, §8º (LC 147/2014)' },
  { categoria: 'Rações para animais domésticos', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Convênio ICMS' },
  { categoria: 'Papéis', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Convênio ICMS' },
  { categoria: 'Plásticos', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Convênio ICMS' },
  { categoria: 'Cimentos, cal e argamassas', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Convênio ICMS' },
  { categoria: 'Produtos cerâmicos para construção', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Art. 13, §8º (LC 147/2014)' },
  { categoria: 'Vidros', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Convênio ICMS' },
  { categoria: 'Tintas e vernizes', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Convênio ICMS' },
  { categoria: 'Produtos eletrônicos e eletrodomésticos', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Convênio ICMS' },
  { categoria: 'Fios, cabos e condutores elétricos', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Convênio ICMS' },
  { categoria: 'Lâmpadas, disjuntores, interruptores', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Convênio ICMS' },
  { categoria: 'Ferramentas', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Convênio ICMS' },
  { categoria: 'Álcool etílico', tributosConcentrados: ['PIS', 'COFINS', 'ICMS-ST'], baseLegal: 'Lei 9.718/1998' },
  { categoria: 'Sabões, detergentes, alvejantes, amaciantes', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Art. 13, §8º (LC 147/2014) — somente escala industrial relevante para detergentes' }
];


// ================================================================================
// SEÇÃO 30: PRAZO MÍNIMO ICMS-ST (Art. 21-B — LC 147/2014)
// ================================================================================

/**
 * Prazo mínimo para vencimento do ICMS-ST, monofásico e antecipação tributária.
 * Base legal: LC 123/2006, Art. 21-B (incluído LC 147/2014).
 */
const PRAZO_MINIMO_ICMS_ST = {
  descricao: 'Prazo mínimo de 60 dias para vencimento de ICMS devido por ST, monofásica e antecipação tributária',
  prazoMinimoDias: 60,
  contadoA_partir: 'Primeiro dia do mês do fato gerador',
  aplicavelQuando: 'Responsabilidade recai sobre operações ou prestações subsequentes',
  baseLegal: 'LC 123/2006, Art. 21-B (incluído LC 147/2014)',
  observacao: 'Estados e DF devem respeitar este prazo mínimo. Prazo inferior é ilegal.'
};


// ================================================================================
// SEÇÃO 31: CNAE ADICIONAIS (§5º-I) PARA MAPEAMENTO COMPLETO
// ================================================================================

/**
 * CNAEs adicionais mapeados para completar o mapeamento §5º-I.
 * Todos usam Fator "r" para determinação de Anexo III ou V.
 */
const MAPEAMENTO_CNAE_ADICIONAL = [
  // Engenharia e Geotecnologia (Inciso VI do §5º-I)
  { cnae: '71.11-1', descricao: 'Serviços de arquitetura', tipo: 'fator_r', anexoFatorRAlto: 'III', anexoFatorRBaixo: 'V', paragrafo5I: 'VI' },
  { cnae: '71.12-0', descricao: 'Serviços de engenharia', tipo: 'fator_r', anexoFatorRAlto: 'III', anexoFatorRBaixo: 'V', paragrafo5I: 'VI' },
  { cnae: '71.20-1', descricao: 'Testes e análises técnicas', tipo: 'fator_r', anexoFatorRAlto: 'III', anexoFatorRBaixo: 'V', paragrafo5I: 'VI' },
  { cnae: '72.10-0', descricao: 'Pesquisa e desenvolvimento em ciências físicas e naturais', tipo: 'fator_r', anexoFatorRAlto: 'III', anexoFatorRBaixo: 'V', paragrafo5I: 'VI' },
  { cnae: '74.10-2', descricao: 'Design e decoração de interiores', tipo: 'fator_r', anexoFatorRAlto: 'III', anexoFatorRBaixo: 'V', paragrafo5I: 'VI' },

  // Medicina (Inciso I)
  { cnae: '86.10-1', descricao: 'Atividades de atendimento hospitalar', tipo: 'fator_r', anexoFatorRAlto: 'III', anexoFatorRBaixo: 'V', paragrafo5I: 'I' },
  { cnae: '86.21-6', descricao: 'Serviços móveis de atendimento a urgências', tipo: 'fator_r', anexoFatorRAlto: 'III', anexoFatorRBaixo: 'V', paragrafo5I: 'I' },

  // Medicina Veterinária (Inciso II)
  { cnae: '75.00-1', descricao: 'Atividades veterinárias', tipo: 'fator_r', anexoFatorRAlto: 'III', anexoFatorRBaixo: 'V', paragrafo5I: 'II' },

  // Psicologia, terapia, etc. (Inciso IV)
  { cnae: '86.50-0', descricao: 'Atividades de profissionais da área de saúde (exceto médicos e odontólogos)', tipo: 'fator_r', anexoFatorRAlto: 'III', anexoFatorRBaixo: 'V', paragrafo5I: 'IV' },
  { cnae: '86.90-9', descricao: 'Atividades de atenção à saúde humana NE', tipo: 'fator_r', anexoFatorRAlto: 'III', anexoFatorRBaixo: 'V', paragrafo5I: 'IV' },

  // Representação Comercial (Inciso VII)
  { cnae: '46.13-3', descricao: 'Representantes comerciais e agentes do comércio', tipo: 'fator_r', anexoFatorRAlto: 'III', anexoFatorRBaixo: 'V', paragrafo5I: 'VII' },

  // Jornalismo e Publicidade (Inciso X)
  { cnae: '63.91-7', descricao: 'Agências de notícias', tipo: 'fator_r', anexoFatorRAlto: 'III', anexoFatorRBaixo: 'V', paragrafo5I: 'X' },
  { cnae: '73.12-2', descricao: 'Agenciamento de espaços para publicidade', tipo: 'fator_r', anexoFatorRAlto: 'III', anexoFatorRBaixo: 'V', paragrafo5I: 'X' },

  // Agenciamento (Inciso XI)
  { cnae: '79.11-2', descricao: 'Agências de viagens', tipo: 'fator_r', anexoFatorRAlto: 'III', anexoFatorRBaixo: 'V', paragrafo5I: 'XI' },
  { cnae: '79.12-1', descricao: 'Operadores turísticos', tipo: 'fator_r', anexoFatorRAlto: 'III', anexoFatorRBaixo: 'V', paragrafo5I: 'XI' },

  // Transporte — Regra especial (§5º-E)
  { cnae: '49.30-2', descricao: 'Transporte rodoviário de carga', tipo: 'fixo', anexoFixo: 'III_ESPECIAL', observacao: 'Anexo III base, deduz ISS, acrescenta ICMS Anexo I — §5º-E' },
  { cnae: '50.11-4', descricao: 'Transporte marítimo de cabotagem — carga', tipo: 'fixo', anexoFixo: 'III_ESPECIAL', observacao: 'Transporte fluvial/marítimo — §5º-E' },
  { cnae: '50.22-0', descricao: 'Transporte por navegação interior de carga', tipo: 'fixo', anexoFixo: 'III_ESPECIAL', observacao: 'Transporte fluvial — §5º-E e inciso VI Art. 17' },

  // Fisioterapia e Corretagem de Seguros — Anexo III FIXO (§5º-B)
  { cnae: '86.50-0/04', descricao: 'Atividades de fisioterapia', tipo: 'fixo', anexoFixo: 'III', paragrafo: '5B-XVI' },
  { cnae: '66.22-3', descricao: 'Corretagem e intermediação de seguros', tipo: 'fixo', anexoFixo: 'III', paragrafo: '5B-XVII' }
];


// ================================================================================
// SEÇÃO 4-INT: INTEGRAÇÃO COM CnaeMapeamento (cnae-mapeamento.js)
// ================================================================================

/**
 * Funções de integração com o módulo CnaeMapeamento.
 * Fallback gracioso: se CnaeMapeamento não estiver disponível, usa MAPEAMENTO_CNAE local.
 *
 * @requires CnaeMapeamento (cnae-mapeamento.js) — opcional, com fallback
 */

/**
 * Obtém referência ao módulo CnaeMapeamento, se disponível.
 * @returns {Object|null}
 */
function _getCnaeMapeamento() {
  if (typeof CnaeMapeamento !== 'undefined') return CnaeMapeamento;
  if (typeof globalThis !== 'undefined' && globalThis.CnaeMapeamento) return globalThis.CnaeMapeamento;
  try { return require('./cnae-mapeamento.js'); } catch (e) { return null; }
}

/**
 * Obtém regras tributárias de um CNAE, usando CnaeMapeamento se disponível.
 * @param {string} codigo — Código CNAE (ex: '7119-7/00' ou '71.19-7')
 * @param {string} [categoria] — Categoria fallback: 'Comercio', 'Industria', 'Servico', 'Transporte'
 * @returns {Object} { anexo, fatorR, presuncaoIRPJ, presuncaoCSLL, vedado, motivoVedacao, obs, monofasico }
 */
function obterRegrasCNAE(codigo, categoria) {
  const cm = _getCnaeMapeamento();
  if (cm && typeof cm.obterRegrasCNAE === 'function') {
    const regras = cm.obterRegrasCNAE(codigo, categoria);
    const monofasico = typeof cm.isMonofasico === 'function' ? cm.isMonofasico(codigo) : false;
    return { ...regras, monofasico };
  }
  // Fallback: usar MAPEAMENTO_CNAE local
  const cnaeNorm = codigo.replace(/[^0-9]/g, '').substring(0, 5);
  const cnaeFormatado = cnaeNorm.substring(0, 2) + '.' + cnaeNorm.substring(2, 4) + '-' + cnaeNorm.substring(4);
  const local = MAPEAMENTO_CNAE.find(c => c.cnae === cnaeFormatado);
  if (local) {
    const isServico = ['III', 'IV', 'V'].includes(local.anexoFixo || local.anexoFatorRAlto);
    return {
      anexo: local.tipo === 'fixo' ? local.anexoFixo : null,
      fatorR: local.tipo === 'fator_r',
      presuncaoIRPJ: isServico ? 0.32 : 0.08,
      presuncaoCSLL: isServico ? 0.32 : 0.12,
      vedado: local.tipo === 'vedado',
      motivoVedacao: local.tipo === 'vedado' ? local.observacao : null,
      obs: local.observacao,
      monofasico: false,
      fonte: 'MAPEAMENTO_CNAE_LOCAL'
    };
  }
  // Fallback por categoria
  const fallbacks = {
    'Comercio': { anexo: 'I', presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
    'Industria': { anexo: 'II', presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
    'Servico': { anexo: null, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
    'Transporte': { anexo: 'III', presuncaoIRPJ: 0.16, presuncaoCSLL: 0.12 }
  };
  const fb = fallbacks[categoria] || fallbacks['Servico'];
  return {
    ...fb, fatorR: !fb.anexo, vedado: false, motivoVedacao: null,
    obs: `Fallback por categoria: ${categoria || 'Servico'}`, monofasico: false, fonte: 'FALLBACK'
  };
}

/**
 * Verifica se CNAE é vedado ao Simples Nacional.
 * @param {string} codigo
 * @returns {false|string} false se permitido, string com motivo se vedado
 */
function isVedadoCNAE(codigo) {
  const cm = _getCnaeMapeamento();
  if (cm && typeof cm.isVedado === 'function') return cm.isVedado(codigo);
  const regras = obterRegrasCNAE(codigo);
  return regras.vedado ? (regras.motivoVedacao || 'Vedado ao Simples Nacional') : false;
}

/**
 * Obtém o anexo efetivo considerando Fator R.
 * @param {string} codigo
 * @param {string} [categoria]
 * @param {number} [fatorR]
 * @returns {string} 'I'|'II'|'III'|'IV'|'V'|'VEDADO'
 */
function obterAnexoEfetivoCNAE(codigo, categoria, fatorR) {
  const cm = _getCnaeMapeamento();
  if (cm && typeof cm.obterAnexoEfetivo === 'function') return cm.obterAnexoEfetivo(codigo, categoria, fatorR);
  const regras = obterRegrasCNAE(codigo, categoria);
  if (regras.vedado) return 'VEDADO';
  if (regras.fatorR) return (fatorR !== undefined && fatorR >= LIMITE_FATOR_R) ? 'III' : 'V';
  return regras.anexo || 'III';
}

/**
 * Verifica se CNAE possui tributação monofásica.
 * @param {string} codigo
 * @returns {false|string}
 */
function isMonofasicoCNAE(codigo) {
  const cm = _getCnaeMapeamento();
  if (cm && typeof cm.isMonofasico === 'function') return cm.isMonofasico(codigo);
  return false; // Sem CnaeMapeamento, não temos dados de monofásica
}


// ================================================================================
// SEÇÃO 5-INT: INTEGRAÇÃO COM Estados (estados.js)
// ================================================================================

/**
 * Funções de integração com o módulo Estados/EstadosBR.
 * @requires Estados (estados.js) — opcional, com fallback
 */

/**
 * Obtém referência ao módulo Estados.
 * @returns {Object|null}
 */
function _getEstados() {
  if (typeof Estados !== 'undefined') return Estados;
  if (typeof EstadosBR !== 'undefined') return EstadosBR;
  if (typeof globalThis !== 'undefined') {
    if (globalThis.Estados) return globalThis.Estados;
    if (globalThis.EstadosBR) return globalThis.EstadosBR;
  }
  try { return require('./estados.js'); } catch (e) { return null; }
}

/**
 * Obtém dados completos de um estado brasileiro.
 * @param {string} uf — Sigla da UF (ex: 'PA', 'SP')
 * @returns {Object|null}
 */
function obterDadosEstado(uf) {
  const est = _getEstados();
  if (est && typeof est.getEstado === 'function') return est.getEstado(uf);
  // Fallback mínimo
  return null;
}

/**
 * Verifica se a UF está em área de incentivo SUDAM/SUDENE/ZFM.
 * @param {string} uf
 * @returns {Object} { sudam: boolean, sudene: boolean, zfm: boolean, reducaoIRPJ: number }
 */
function verificarIncentivosRegionais(uf) {
  const dadosEstado = obterDadosEstado(uf);
  if (dadosEstado && dadosEstado.incentivos) {
    const inc = dadosEstado.incentivos;
    const sudam = !!(inc.sudam || inc.SUDAM);
    const sudene = !!(inc.sudene || inc.SUDENE);
    const zfm = !!(inc.zfm || inc.ZFM);
    return { sudam, sudene, zfm, reducaoIRPJ: (sudam || sudene) ? 0.75 : (zfm ? 0.75 : 0) };
  }
  // Fallback por UF conhecida
  const SUDAM_UFS = ['AC', 'AM', 'AP', 'MA', 'MT', 'PA', 'RO', 'RR', 'TO'];
  const SUDENE_UFS = ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'];
  const sudam = SUDAM_UFS.includes(uf);
  const sudene = SUDENE_UFS.includes(uf);
  const zfm = uf === 'AM'; // Zona Franca de Manaus
  return { sudam, sudene, zfm, reducaoIRPJ: (sudam || sudene || zfm) ? 0.75 : 0 };
}

/**
 * Obtém alíquota ICMS interna do estado.
 * @param {string} uf
 * @returns {number} Alíquota ICMS (ex: 0.17 para 17%)
 */
function obterAliquotaICMS(uf) {
  const dadosEstado = obterDadosEstado(uf);
  if (dadosEstado && dadosEstado.icms && dadosEstado.icms.aliquota_interna) {
    return dadosEstado.icms.aliquota_interna;
  }
  // Fallback genérico
  const aliquotasPadrao = { SP: 0.18, MG: 0.18, RJ: 0.20, RS: 0.17, PR: 0.19 };
  return aliquotasPadrao[uf] || 0.17;
}


// ================================================================================
// SEÇÃO 6-INT: INTEGRAÇÃO COM MunicipiosIBGE (municipios.js)
// ================================================================================

/**
 * Funções de integração com o módulo MunicipiosIBGE.
 * @requires MunicipiosIBGE (municipios.js) — opcional, com fallback
 */

/**
 * Obtém referência ao módulo MunicipiosIBGE.
 * @returns {Object|null}
 */
function _getMunicipiosIBGE() {
  if (typeof MunicipiosIBGE !== 'undefined') return MunicipiosIBGE;
  if (typeof globalThis !== 'undefined' && globalThis.MunicipiosIBGE) return globalThis.MunicipiosIBGE;
  try { return require('./municipios.js'); } catch (e) { return null; }
}

/**
 * Obtém alíquota ISS de um município.
 * @param {string} uf
 * @param {string} municipio — Nome do município
 * @returns {number} Alíquota ISS (ex: 0.05 para 5%)
 */
function obterAliquotaISS(uf, municipio) {
  // Tentar do módulo Estados primeiro (ISS da capital como referência)
  const dadosEstado = obterDadosEstado(uf);
  if (dadosEstado && dadosEstado.iss) {
    // Se tiver ISS por município
    if (dadosEstado.iss.municipios && dadosEstado.iss.municipios[municipio]) {
      return dadosEstado.iss.municipios[municipio] / 100;
    }
    // ISS geral do estado (capital)
    if (dadosEstado.iss.aliquota_geral) {
      return dadosEstado.iss.aliquota_geral / 100;
    }
  }
  // Fallback: ISS padrão 5%
  return ISS_MAXIMO;
}


// ================================================================================
// SEÇÃO 13: calcularDASMensalOtimizado() ★ NOVO
// ================================================================================

/**
 * Calcula o DAS mensal COM TODAS as deduções legais aplicadas automaticamente.
 * Esta é a função PRINCIPAL do IMPOST. — calcula o MENOR DAS legal possível.
 *
 * Base legal: LC 123/2006, Art. 18, §§4º e 4º-A; Resolução CGSN 140/2018, Art. 25.
 *
 * @param {Object} params
 * @param {number} params.receitaBrutaMensal     — Receita bruta total do mês
 * @param {number} params.rbt12                   — RBT12 (últimos 12 meses)
 * @param {string} params.anexo                   — Anexo aplicável (I a V)
 * @param {string} [params.cnae]                  — CNAE principal
 * @param {string} [params.uf]                    — UF da empresa
 * @param {string} [params.municipio]             — Município da empresa
 * @param {number} [params.receitaMonofasica=0]   — Parcela com PIS/COFINS monofásico
 * @param {number} [params.receitaICMS_ST=0]      — Parcela com ICMS já recolhido por ST
 * @param {number} [params.receitaExportacao=0]   — Parcela de exportação
 * @param {number} [params.receitaLocacaoBensMoveis=0] — Parcela de locação sem ISS
 * @param {number} [params.issRetidoFonte=0]      — Valor de ISS retido na fonte
 * @param {number} [params.folhaMensal=0]         — Folha mensal (para Anexo IV)
 * @param {number} [params.aliquotaRAT=0.02]      — RAT
 * @param {number} [params.aliquotaISS=null]      — ISS do município (se null, busca automaticamente)
 * @returns {Object} Resultado completo com DAS otimizado e economia
 */
function calcularDASMensalOtimizado(params) {
  const {
    receitaBrutaMensal,
    rbt12,
    anexo,
    cnae = null,
    uf = null,
    municipio = null,
    receitaMonofasica = 0,
    receitaICMS_ST = 0,
    receitaExportacao = 0,
    receitaLocacaoBensMoveis = 0,
    issRetidoFonte = 0,
    folhaMensal = 0,
    aliquotaRAT = ALIQUOTA_RAT_PADRAO,
    aliquotaISS = null
  } = params;

  if (!receitaBrutaMensal || receitaBrutaMensal <= 0) {
    throw new Error('[DAS_OPT_001] Receita bruta mensal deve ser maior que zero.');
  }
  if (!rbt12 || rbt12 <= 0) {
    throw new Error('[DAS_OPT_002] RBT12 deve ser maior que zero.');
  }

  // 1. Calcular DAS "cheio" (sem otimização)
  const dasCheio = calcularDASMensal({
    receitaBrutaMensal,
    rbt12,
    anexo,
    issRetidoFonte: 0,
    folhaMensal,
    aliquotaRAT
  });

  const aliquotaEfetiva = dasCheio.aliquotaEfetiva;
  const faixa = dasCheio.faixa;
  const idx = faixa - 1;
  const partilhaPerc = PARTILHA[anexo] ? PARTILHA[anexo][idx] : null;

  if (!partilhaPerc) {
    throw new Error(`[DAS_OPT_003] Partilha não encontrada para Anexo ${anexo}, Faixa ${faixa}.`);
  }

  // 2. Array de deduções aplicadas
  const deducoes = [];
  let dasOtimizado = 0;

  // Parcela de receita com tributação normal (sem benefício)
  const receitaNormal = Math.max(0,
    receitaBrutaMensal - receitaMonofasica - receitaICMS_ST - receitaExportacao - receitaLocacaoBensMoveis
  );

  // DAS sobre receita normal = alíquota efetiva × receita normal
  const dasNormal = _arredondar(receitaNormal * aliquotaEfetiva);
  dasOtimizado += dasNormal;

  // 3a. MONOFÁSICA: zerar PIS/COFINS sobre receitaMonofasica
  if (receitaMonofasica > 0 && partilhaPerc) {
    const percPisCofins = (partilhaPerc.pis || 0) + (partilhaPerc.cofins || 0);
    const dasMonofasica = _arredondar(receitaMonofasica * aliquotaEfetiva * (1 - percPisCofins));
    const economiaMonofasica = _arredondar(receitaMonofasica * aliquotaEfetiva * percPisCofins);
    dasOtimizado += dasMonofasica;
    deducoes.push({
      id: 'monofasica',
      descricao: 'Tributação Monofásica — PIS/COFINS zerados',
      receitaAfetada: _arredondar(receitaMonofasica),
      economia: economiaMonofasica,
      baseLegal: 'LC 123/2006, Art. 18, §4º-A, I'
    });
  }

  // 3b. ICMS-ST: zerar ICMS sobre receitaICMS_ST
  if (receitaICMS_ST > 0 && partilhaPerc) {
    const percICMS = partilhaPerc.icms || 0;
    const dasST = _arredondar(receitaICMS_ST * aliquotaEfetiva * (1 - percICMS));
    const economiaST = _arredondar(receitaICMS_ST * aliquotaEfetiva * percICMS);
    dasOtimizado += dasST;
    deducoes.push({
      id: 'icms_st',
      descricao: 'ICMS-ST — ICMS já recolhido por Substituição Tributária',
      receitaAfetada: _arredondar(receitaICMS_ST),
      economia: economiaST,
      baseLegal: 'LC 123/2006, Art. 18, §4º-A, I'
    });
  }

  // 3c. EXPORTAÇÃO: zerar COFINS, PIS, IPI, ICMS, ISS (manter IRPJ + CSLL + CPP)
  if (receitaExportacao > 0 && partilhaPerc) {
    const percMantidos = (partilhaPerc.irpj || 0) + (partilhaPerc.csll || 0) + (partilhaPerc.cpp || 0);
    const dasExportacao = _arredondar(receitaExportacao * aliquotaEfetiva * percMantidos);
    const economiaExportacao = _arredondar(receitaExportacao * aliquotaEfetiva * (1 - percMantidos));
    dasOtimizado += dasExportacao;
    deducoes.push({
      id: 'exportacao',
      descricao: 'Exportação — isentos COFINS, PIS, IPI, ICMS, ISS',
      receitaAfetada: _arredondar(receitaExportacao),
      economia: economiaExportacao,
      baseLegal: 'LC 123/2006, Art. 18, §14 e §4º-A, IV'
    });
  }

  // 3d. LOCAÇÃO DE BENS MÓVEIS: zerar ISS
  if (receitaLocacaoBensMoveis > 0 && partilhaPerc) {
    const percISS = partilhaPerc.iss || 0;
    const dasLocacao = _arredondar(receitaLocacaoBensMoveis * aliquotaEfetiva * (1 - percISS));
    const economiaLocacao = _arredondar(receitaLocacaoBensMoveis * aliquotaEfetiva * percISS);
    dasOtimizado += dasLocacao;
    deducoes.push({
      id: 'locacao_bens_moveis',
      descricao: 'Locação de bens móveis — ISS não incide',
      receitaAfetada: _arredondar(receitaLocacaoBensMoveis),
      economia: economiaLocacao,
      baseLegal: 'LC 123/2006, Art. 18, §4º, V'
    });
  }

  // 3e. ISS RETIDO NA FONTE: deduzir do DAS
  let issRetidoEfetivo = 0;
  if (issRetidoFonte > 0) {
    const issNoDAS = dasOtimizado * (partilhaPerc.iss || 0);
    issRetidoEfetivo = _arredondar(Math.min(issRetidoFonte, issNoDAS));
    dasOtimizado = _arredondar(dasOtimizado - issRetidoEfetivo);
    deducoes.push({
      id: 'iss_retido',
      descricao: 'ISS retido na fonte pelo tomador',
      receitaAfetada: 0,
      economia: issRetidoEfetivo,
      baseLegal: 'LC 123/2006, Art. 18, §4º-A, II; Art. 21, §4º'
    });
  }

  dasOtimizado = _arredondar(Math.max(0, dasOtimizado));
  const dasSemOtimizacao = dasCheio.dasValor;
  const economiaTotal = _arredondar(dasSemOtimizacao - dasOtimizado);

  // INSS patronal por fora (Anexo IV)
  let inssPatronalFora = 0;
  if (anexo === 'IV') {
    inssPatronalFora = _arredondar(folhaMensal * (ALIQUOTA_INSS_PATRONAL_ANEXO_IV + aliquotaRAT));
  }

  // Calcular partilha otimizada
  const partilhaOtimizada = calcularPartilhaTributos(dasOtimizado, faixa, anexo, receitaBrutaMensal, aliquotaEfetiva);

  // Alertas
  const alertas = [];
  if (economiaTotal > 0) {
    alertas.push({
      tipo: 'economia',
      mensagem: `✅ Economia de ${_fmtBRL(economiaTotal)} (${((economiaTotal / dasSemOtimizacao) * 100).toFixed(1)}%) aplicando ${deducoes.length} dedução(ões) legal(is).`
    });
  }
  if (rbt12 > SUBLIMITE_ICMS_ISS) {
    alertas.push({
      tipo: 'sublimite',
      mensagem: `⚠️ RBT12 acima do sublimite de ${_fmtBRL(SUBLIMITE_ICMS_ISS)}. ICMS e ISS devem ser recolhidos por fora.`
    });
  }
  if (cnae) {
    const mono = isMonofasicoCNAE(cnae);
    if (mono && receitaMonofasica === 0) {
      alertas.push({
        tipo: 'oportunidade',
        mensagem: `💡 CNAE ${cnae} pode ter produtos monofásicos (${mono}). Segregar receita monofásica pode gerar economia adicional.`
      });
    }
  }

  return {
    receitaBrutaMensal: _arredondar(receitaBrutaMensal),
    rbt12: _arredondar(rbt12),
    anexo,
    faixa,
    aliquotaEfetiva,
    aliquotaEfetivaFormatada: dasCheio.aliquotaEfetivaFormatada,
    dasSemOtimizacao: _arredondar(dasSemOtimizacao),
    dasOtimizado,
    economiaTotal,
    economiaPercentual: dasSemOtimizacao > 0 ? _arredondar(economiaTotal / dasSemOtimizacao, 4) : 0,
    deducoes,
    partilha: partilhaOtimizada,
    issRetidoFonte: issRetidoEfetivo,
    inssPatronalFora,
    totalAPagar: _arredondar(dasOtimizado + inssPatronalFora),
    alertas,
    baseLegal: 'LC 123/2006, Art. 18, §§4º e 4º-A; Resolução CGSN 140/2018, Art. 25'
  };
}


// ================================================================================
// SEÇÃO 14: calcularDASSegregado() ★ NOVO
// ================================================================================

/**
 * Calcula DAS com receitas segregadas por múltiplos CNAEs/anexos.
 *
 * Base legal: Resolução CGSN 140/2018, Art. 25 — segregação obrigatória.
 *
 * @param {Object} params
 * @param {Array<Object>} params.receitas — Array de receitas segregadas:
 *   [{ valor, cnae, anexo, receitaMonofasica, receitaICMS_ST, receitaExportacao, ... }]
 * @param {number} params.rbt12          — RBT12 total (compartilhado)
 * @param {number} [params.folhaSalarios12Meses=0] — Folha total 12 meses
 * @param {string} [params.uf]
 * @param {string} [params.municipio]
 * @returns {Object} Resultado consolidado com DAS total e detalhamento por CNAE
 */
function calcularDASSegregado(params) {
  const {
    receitas,
    rbt12,
    folhaSalarios12Meses = 0,
    uf = null,
    municipio = null
  } = params;

  if (!receitas || !Array.isArray(receitas) || receitas.length === 0) {
    throw new Error('[DAS_SEG_001] Deve fornecer array de receitas segregadas.');
  }

  const fatorR = rbt12 > 0 ? folhaSalarios12Meses / rbt12 : 0;
  const detalhamento = [];
  let dasTotal = 0;
  let dasSemOtimizacaoTotal = 0;
  let receitaTotal = 0;

  for (const receita of receitas) {
    const cnae = receita.cnae || null;
    let anexo = receita.anexo;

    // Determinar anexo automaticamente se não fornecido
    if (!anexo && cnae) {
      anexo = obterAnexoEfetivoCNAE(cnae, null, fatorR);
    }
    if (!anexo) {
      throw new Error(`[DAS_SEG_002] Não foi possível determinar o anexo para a receita com CNAE ${cnae}.`);
    }
    if (anexo === 'VEDADO') {
      throw new Error(`[DAS_SEG_003] CNAE ${cnae} é vedado ao Simples Nacional.`);
    }

    const resultado = calcularDASMensalOtimizado({
      receitaBrutaMensal: receita.valor,
      rbt12, // RBT12 compartilhado
      anexo,
      cnae,
      uf,
      municipio,
      receitaMonofasica: receita.receitaMonofasica || 0,
      receitaICMS_ST: receita.receitaICMS_ST || 0,
      receitaExportacao: receita.receitaExportacao || 0,
      receitaLocacaoBensMoveis: receita.receitaLocacaoBensMoveis || 0,
      issRetidoFonte: receita.issRetidoFonte || 0,
      folhaMensal: receita.folhaMensal || 0
    });

    dasTotal += resultado.dasOtimizado;
    dasSemOtimizacaoTotal += resultado.dasSemOtimizacao;
    receitaTotal += receita.valor;

    detalhamento.push({
      cnae,
      anexo,
      receita: _arredondar(receita.valor),
      dasOtimizado: resultado.dasOtimizado,
      dasSemOtimizacao: resultado.dasSemOtimizacao,
      economia: resultado.economiaTotal,
      aliquotaEfetiva: resultado.aliquotaEfetiva,
      deducoes: resultado.deducoes
    });
  }

  dasTotal = _arredondar(dasTotal);
  dasSemOtimizacaoTotal = _arredondar(dasSemOtimizacaoTotal);
  const economiaTotal = _arredondar(dasSemOtimizacaoTotal - dasTotal);

  return {
    receitaTotal: _arredondar(receitaTotal),
    rbt12: _arredondar(rbt12),
    dasTotal,
    dasSemOtimizacaoTotal,
    economiaTotal,
    aliquotaEfetivaMedia: receitaTotal > 0 ? _arredondar(dasTotal / receitaTotal, 6) : 0,
    totalCNAEs: receitas.length,
    detalhamento,
    baseLegal: 'Resolução CGSN 140/2018, Art. 25 — segregação obrigatória de receitas'
  };
}


// ================================================================================
// SEÇÃO 21: otimizarFatorR() ★ NOVO
// ================================================================================

/**
 * Simula cenários de folha de pagamento e retorna o ponto ótimo.
 * Responde: "Se aumentar o pró-labore em R$ X, economiza R$ Y no DAS"
 *
 * Base legal: Resolução CGSN 140/2018, Art. 18, §5º-J.
 *
 * @param {Object} params
 * @param {number} params.rbt12
 * @param {number} params.folhaAtual12Meses
 * @param {number} params.receitaMensal
 * @param {string} [params.cnae]
 * @param {number} [params.encargosPatronaisFolha=0.368] — FGTS+INSS+RAT+Terceiros
 * @returns {Object} Cenário ótimo e tabela de cenários
 */
function otimizarFatorR(params) {
  const {
    rbt12,
    folhaAtual12Meses,
    receitaMensal,
    cnae = null,
    encargosPatronaisFolha = 0.368
  } = params;

  if (!rbt12 || rbt12 <= 0) throw new Error('[FATOR_R_OPT_001] RBT12 deve ser maior que zero.');
  if (!receitaMensal || receitaMensal <= 0) throw new Error('[FATOR_R_OPT_002] Receita mensal deve ser maior que zero.');

  const fatorRAtual = folhaAtual12Meses / rbt12;
  const anexoAtual = fatorRAtual >= LIMITE_FATOR_R ? 'III' : 'V';
  const folhaNecessaria12Meses = _arredondar(rbt12 * LIMITE_FATOR_R);
  const deficitFolha12Meses = Math.max(0, folhaNecessaria12Meses - folhaAtual12Meses);
  const aumentoMensalNecessario = _arredondar(deficitFolha12Meses / 12);

  // Se já está no Anexo III
  if (fatorRAtual >= LIMITE_FATOR_R) {
    return {
      fatorRAtual: _arredondar(fatorRAtual, 4),
      anexoAtual: 'III',
      jaOtimizado: true,
      mensagem: `Fator "r" atual (${(fatorRAtual * 100).toFixed(2)}%) já está acima de 28%. Empresa já tributada no Anexo III.`,
      fatorRNecessario: LIMITE_FATOR_R,
      folhaNecessaria12Meses,
      aumentoMensalNecessario: 0,
      custoAumentoMensal: 0,
      custoAumentoAnual: 0,
      economiaDASMensal: 0,
      economiaDASAnual: 0,
      economiaLiquida: 0,
      vale_a_pena: false,
      cenarios: [],
      baseLegal: 'Resolução CGSN 140/2018, Art. 18, §5º-J'
    };
  }

  // Calcular DAS atual (Anexo V) e DAS alvo (Anexo III)
  let dasAnexoV, dasAnexoIII;
  try {
    const aliqV = calcularAliquotaEfetiva({ rbt12, anexo: 'V' });
    const aliqIII = calcularAliquotaEfetiva({ rbt12, anexo: 'III' });
    dasAnexoV = _arredondar(receitaMensal * aliqV.aliquotaEfetiva);
    dasAnexoIII = _arredondar(receitaMensal * aliqIII.aliquotaEfetiva);
  } catch (e) {
    throw new Error(`[FATOR_R_OPT_003] Erro ao calcular alíquotas: ${e.message}`);
  }

  const economiaDASMensal = _arredondar(dasAnexoV - dasAnexoIII);
  const economiaDASAnual = _arredondar(economiaDASMensal * 12);
  const custoAumentoMensal = _arredondar(aumentoMensalNecessario * (1 + encargosPatronaisFolha));
  const custoAumentoAnual = _arredondar(custoAumentoMensal * 12);
  const economiaLiquida = _arredondar(economiaDASAnual - custoAumentoAnual);

  // Simular cenários incrementais (de R$ 500 em R$ 500)
  const cenarios = [];
  const maxIncremento = Math.ceil(aumentoMensalNecessario / 500) + 5;
  for (let i = 0; i <= maxIncremento; i++) {
    const incremento = i * 500;
    const novaFolhaMensal = (folhaAtual12Meses / 12) + incremento;
    const novaFolha12M = novaFolhaMensal * 12;
    const novoFatorR = novaFolha12M / rbt12;
    const novoAnexo = novoFatorR >= LIMITE_FATOR_R ? 'III' : 'V';
    const novoAliq = novoAnexo === 'III' ? dasAnexoIII : dasAnexoV;
    const custoExtra = _arredondar(incremento * (1 + encargosPatronaisFolha));
    const custoExtraAnual = _arredondar(custoExtra * 12);
    const economiaDAS = novoAnexo === 'III' ? economiaDASAnual : 0;
    const econLiquida = _arredondar(economiaDAS - custoExtraAnual);

    cenarios.push({
      incrementoMensal: incremento,
      folhaMensal: _arredondar(novaFolhaMensal),
      fatorR: _arredondar(novoFatorR, 4),
      anexo: novoAnexo,
      dasMensal: novoAliq,
      custoExtraMensal: custoExtra,
      custoExtraAnual: custoExtraAnual,
      economiaLiquida: econLiquida
    });

    // Parar quando já está no Anexo III e economia começa a diminuir
    if (novoAnexo === 'III' && i > 2 && cenarios.length > 3) {
      if (cenarios[cenarios.length - 1].economiaLiquida < cenarios[cenarios.length - 2].economiaLiquida) {
        break;
      }
    }
  }

  // Encontrar cenário ótimo (maior economia líquida)
  const cenarioOtimo = cenarios.reduce((melhor, c) => {
    return c.economiaLiquida > melhor.economiaLiquida ? c : melhor;
  }, cenarios[0]);

  return {
    fatorRAtual: _arredondar(fatorRAtual, 4),
    fatorRAtualFormatado: (fatorRAtual * 100).toFixed(2).replace('.', ',') + '%',
    anexoAtual,
    jaOtimizado: false,
    fatorRNecessario: LIMITE_FATOR_R,
    folhaNecessaria12Meses,
    aumentoMensalNecessario,
    custoAumentoMensal,
    custoAumentoAnual,
    economiaDASMensal,
    economiaDASAnual,
    economiaLiquida,
    vale_a_pena: economiaLiquida > 0,
    cenarioOtimo,
    cenarios,
    baseLegal: 'Resolução CGSN 140/2018, Art. 18, §5º-J'
  };
}


// ================================================================================
// SEÇÃO 20: compararRegimesCompleto() ★ NOVO
// ================================================================================

/**
 * Comparação completa entre regimes tributários usando dados reais dos módulos.
 * Refatoração da compararComOutrosRegimes() com integração CnaeMapeamento + Estados.
 *
 * @param {Object} params
 * @param {number} params.receitaBrutaAnual
 * @param {number} params.folhaAnual
 * @param {string} params.cnae
 * @param {string} [params.uf]
 * @param {string} [params.municipio]
 * @param {number} [params.fatorR]
 * @param {number} [params.despesasOperacionais=0]
 * @param {number} [params.lucroContabilEfetivo]
 * @param {Object} [params.receitasSegregadas] — Para DAS otimizado
 * @param {Array<Object>} [params.socios]
 * @returns {Object} Comparativo completo entre regimes
 */
function compararRegimesCompleto(params) {
  const {
    receitaBrutaAnual,
    folhaAnual,
    cnae,
    uf = null,
    municipio = null,
    fatorR = null,
    despesasOperacionais = 0,
    lucroContabilEfetivo = null,
    receitasSegregadas = null,
    socios = [],
    aliquotaRAT = ALIQUOTA_RAT_PADRAO
  } = params;

  // 1. Buscar regras CNAE
  const regrasCNAE = cnae ? obterRegrasCNAE(cnae) : { presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 };
  const presuncaoIRPJ = regrasCNAE.presuncaoIRPJ || 0.32;
  const presuncaoCSLL = regrasCNAE.presuncaoCSLL || 0.32;

  // 2. Buscar incentivos regionais
  const incentivos = uf ? verificarIncentivosRegionais(uf) : { sudam: false, sudene: false, zfm: false, reducaoIRPJ: 0 };
  const temIncentivo = incentivos.sudam || incentivos.sudene || incentivos.zfm;

  // 3. Buscar ISS do município
  const aliquotaISS = (uf && municipio) ? obterAliquotaISS(uf, municipio) : ISS_MAXIMO;

  // 4. Determinar anexo
  const fatorRCalc = fatorR !== null ? fatorR : (folhaAnual / receitaBrutaAnual);
  const anexo = cnae ? obterAnexoEfetivoCNAE(cnae, null, fatorRCalc) : 'III';

  if (anexo === 'VEDADO') {
    return {
      erro: `CNAE ${cnae} é vedado ao Simples Nacional.`,
      regimes: [],
      recomendacao: 'CNAE vedado ao Simples. Avaliar Lucro Presumido ou Lucro Real.'
    };
  }

  // Rodar o comparativo original com os dados enriquecidos
  const resultadoBase = compararComOutrosRegimes({
    receitaBrutaAnual,
    folhaAnual,
    cnae: cnae || '',
    fatorR: fatorRCalc,
    anexo,
    despesasOperacionais,
    aliquotaRAT,
    aliquotaISS,
    temSUDAM: temIncentivo
  });

  // Enriquecer com presunções corretas para Lucro Presumido
  const regimeLP = resultadoBase.regimes.find(r => r.regime === 'Lucro Presumido');
  if (regimeLP && presuncaoIRPJ !== 0.32) {
    // Recalcular LP com presunção correta
    const baseIRPJ = receitaBrutaAnual * presuncaoIRPJ;
    const baseCSLL = receitaBrutaAnual * presuncaoCSLL;
    const irpjLP = _arredondar(baseIRPJ * 0.15);
    const adicionalIR = _arredondar(Math.max(0, (baseIRPJ - 240_000) * 0.10));
    const csllLP = _arredondar(baseCSLL * 0.09);
    const cofinsLP = _arredondar(receitaBrutaAnual * 0.03);
    const pisLP = _arredondar(receitaBrutaAnual * 0.0065);
    const issLP = _arredondar(receitaBrutaAnual * aliquotaISS);
    const inssPatronalLP = _arredondar(folhaAnual * (0.20 + aliquotaRAT));
    const terceirosLP = _arredondar(folhaAnual * 0.058);
    const fgtsLP = _arredondar(folhaAnual * ALIQUOTA_FGTS);
    const novaCarga = _arredondar(irpjLP + adicionalIR + csllLP + cofinsLP + pisLP + issLP + inssPatronalLP + terceirosLP + fgtsLP);

    regimeLP.cargaTotal = novaCarga;
    regimeLP.percentualCarga = _arredondar(novaCarga / receitaBrutaAnual, 4);
    regimeLP.percentualCargaFormatado = ((novaCarga / receitaBrutaAnual) * 100).toFixed(2).replace('.', ',') + '%';
    regimeLP.detalhamento = {
      presuncaoIRPJ, presuncaoCSLL,
      irpj: irpjLP, adicionalIR, csll: csllLP,
      cofins: cofinsLP, pis: pisLP, iss: issLP,
      inssPatronal: inssPatronalLP, terceiros: terceirosLP, fgts: fgtsLP
    };
    regimeLP.observacoes.push(`Presunção IRPJ: ${(presuncaoIRPJ * 100).toFixed(0)}% (CNAE ${cnae})`);
  }

  // Re-sort e re-rank
  resultadoBase.regimes.sort((a, b) => a.cargaTotal - b.cargaTotal);
  resultadoBase.regimes.forEach((r, i) => {
    r.ranking = i + 1;
    r.melhorOpcao = i === 0;
  });

  const melhor = resultadoBase.regimes[0];
  const pior = resultadoBase.regimes[resultadoBase.regimes.length - 1];

  return {
    ...resultadoBase,
    presuncaoIRPJ,
    presuncaoCSLL,
    incentivos,
    aliquotaISS,
    economiaMelhorVsPior: _arredondar(pior.cargaTotal - melhor.cargaTotal),
    economiaFormatada: _fmtBRL(pior.cargaTotal - melhor.cargaTotal),
    recomendacao: `O regime mais vantajoso é ${melhor.regime} com carga de ${melhor.percentualCargaFormatado} (${_fmtBRL(melhor.cargaTotal)}).` +
      (temIncentivo ? ` Empresa em área ${incentivos.sudam ? 'SUDAM' : incentivos.sudene ? 'SUDENE' : 'ZFM'} — considerar Lucro Real com redução de 75% do IRPJ.` : '')
  };
}


// ================================================================================
// SEÇÃO 27: gerarRelatorioOtimizacao() ★ NOVO
// ================================================================================

/**
 * Gera relatório completo de otimização tributária — o produto final do IMPOST.
 *
 * @param {Object} params — Todos os dados da empresa
 * @param {string} params.nomeEmpresa
 * @param {string} params.cnae
 * @param {string} params.uf
 * @param {string} params.municipio
 * @param {number} params.receitaBrutaAnual
 * @param {number} params.receitaBrutaMensal
 * @param {number} params.folhaAnual
 * @param {number} params.folhaMensal
 * @param {Array<Object>} [params.socios]
 * @param {number} [params.despesasOperacionais=0]
 * @param {number} [params.lucroContabilEfetivo]
 * @param {number} [params.receitaMonofasica=0]
 * @param {number} [params.receitaICMS_ST=0]
 * @param {number} [params.receitaExportacao=0]
 * @param {number} [params.receitaLocacaoBensMoveis=0]
 * @param {number} [params.issRetidoFonte=0]
 * @returns {Object} Relatório estruturado completo
 */
function gerarRelatorioOtimizacao(params) {
  const {
    nomeEmpresa = 'Empresa',
    cnae,
    uf,
    municipio,
    receitaBrutaAnual,
    receitaBrutaMensal = receitaBrutaAnual / 12,
    folhaAnual,
    folhaMensal = folhaAnual / 12,
    socios = [],
    despesasOperacionais = 0,
    lucroContabilEfetivo = null,
    receitaMonofasica = 0,
    receitaICMS_ST = 0,
    receitaExportacao = 0,
    receitaLocacaoBensMoveis = 0,
    issRetidoFonte = 0,
    aliquotaRAT = ALIQUOTA_RAT_PADRAO
  } = params;

  const resultado = {};
  resultado.timestamp = new Date().toISOString();
  resultado.versao = '4.0.0';
  resultado.produto = 'IMPOST. — Inteligência em Modelagem de Otimização Tributária';
  resultado.baseLegal = 'LC 123/2006; LC 155/2016; Resolução CGSN 140/2018';

  // Dados da empresa
  resultado.dadosEmpresa = {
    nome: nomeEmpresa, cnae, uf, municipio,
    receitaBrutaAnual: _arredondar(receitaBrutaAnual),
    folhaAnual: _arredondar(folhaAnual),
    socios
  };

  // Classificação CNAE
  resultado.classificacaoCNAE = obterRegrasCNAE(cnae);

  // Fator R
  const fatorResult = calcularFatorR({
    folhaSalarios12Meses: folhaAnual,
    receitaBruta12Meses: receitaBrutaAnual
  });
  resultado.fatorR = fatorResult;

  // Anexo efetivo
  const anexo = obterAnexoEfetivoCNAE(cnae, null, fatorResult.fatorR);
  resultado.anexo = anexo;

  // Elegibilidade
  resultado.elegibilidade = verificarElegibilidade({
    receitaBrutaAnual,
    receitaBrutaAnualAnterior: receitaBrutaAnual,
    cnae,
    fatorR: fatorResult.fatorR
  });

  // DAS sem otimização
  try {
    resultado.dasAtual = calcularDASMensal({
      receitaBrutaMensal, rbt12: receitaBrutaAnual, anexo
    });
  } catch (e) {
    resultado.dasAtual = { erro: e.message };
  }

  // DAS otimizado
  try {
    resultado.dasOtimizado = calcularDASMensalOtimizado({
      receitaBrutaMensal, rbt12: receitaBrutaAnual, anexo, cnae, uf, municipio,
      receitaMonofasica, receitaICMS_ST, receitaExportacao, receitaLocacaoBensMoveis,
      issRetidoFonte, folhaMensal, aliquotaRAT
    });
  } catch (e) {
    resultado.dasOtimizado = { erro: e.message };
  }

  // Economia imediata
  if (resultado.dasAtual.dasValor && resultado.dasOtimizado.dasOtimizado !== undefined) {
    resultado.economiaImediata = {
      mensal: _arredondar(resultado.dasAtual.dasValor - resultado.dasOtimizado.dasOtimizado),
      anual: _arredondar((resultado.dasAtual.dasValor - resultado.dasOtimizado.dasOtimizado) * 12)
    };
  }

  // Otimização Fator R (se aplicável — empresa está no Anexo V)
  if (anexo === 'V') {
    try {
      resultado.otimizacaoFatorR = otimizarFatorR({
        rbt12: receitaBrutaAnual,
        folhaAtual12Meses: folhaAnual,
        receitaMensal: receitaBrutaMensal,
        cnae
      });
    } catch (e) {
      resultado.otimizacaoFatorR = { erro: e.message };
    }
  }

  // Comparativo de regimes
  try {
    resultado.comparativoRegimes = compararRegimesCompleto({
      receitaBrutaAnual, folhaAnual, cnae, uf, municipio,
      fatorR: fatorResult.fatorR, despesasOperacionais, socios
    });
  } catch (e) {
    resultado.comparativoRegimes = { erro: e.message };
  }

  // Estratégias aplicáveis
  resultado.estrategiasAplicaveis = ESTRATEGIAS_MENOR_IMPOSTO
    .filter(e => {
      if (e.id === 'E01' && anexo !== 'V') return false; // Fator R só se Anexo V
      return true;
    })
    .map(e => ({
      ...e,
      aplicavel: true
    }));

  // Riscos fiscais
  resultado.riscos = RISCOS_FISCAIS;

  // Obrigações acessórias
  resultado.obrigacoes = OBRIGACOES_ACESSORIAS;

  // Incentivos regionais
  resultado.incentivos = uf ? verificarIncentivosRegionais(uf) : null;

  // Resumo executivo
  const melhorRegime = resultado.comparativoRegimes && resultado.comparativoRegimes.regimes
    ? resultado.comparativoRegimes.regimes[0]
    : null;
  resultado.resumoExecutivo = {
    empresa: nomeEmpresa,
    regimeRecomendado: melhorRegime ? melhorRegime.regime : 'Simples Nacional',
    cargaTributariaAnual: melhorRegime ? _fmtBRL(melhorRegime.cargaTotal) : 'N/D',
    percentualCarga: melhorRegime ? melhorRegime.percentualCargaFormatado : 'N/D',
    economiaOtimizacao: resultado.economiaImediata ? _fmtBRL(resultado.economiaImediata.anual) : 'R$ 0,00',
    deducoesAplicadas: resultado.dasOtimizado.deducoes ? resultado.dasOtimizado.deducoes.length : 0
  };

  return resultado;
}






// ================================================================================
// SEÇÃO 34: MÓDULO AVANÇADO — INTELIGÊNCIA FISCAL COMPLEMENTAR v4.1 (2026)
// ================================================================================
// Base Legal: LC 214/2025, LC 227/2026, Lei 15.270/2025, Res. CGSN 183/2025
// ================================================================================

/**
 * 34.1 — PENALIDADES 2026 (Vigência 01/01/2026)
 *
 * Novas multas automáticas para PGDAS-D e DEFIS.
 * ANTES de 2026: PGDAS-D não gerava multa automática; DEFIS também não.
 * AGORA: Multa já no primeiro dia de atraso para ambas.
 *
 * Base Legal: LC 214/2025, Art. 38-A §2º da LC 123/2006, Res. CGSN 183/2025
 */
const PENALIDADES_2026 = {
  PGDAS_D: {
    descricao: 'Multa por atraso no PGDAS-D (declaração mensal)',
    percentualMensal: 0.02,         // 2% ao mês ou fração
    limitePercentual: 0.20,         // Máximo 20% do total dos tributos informados
    valorMinimo: 50.00,             // R$ 50,00 mínimo
    termoInicial: 'Dia seguinte ao vencimento do prazo legal',
    termoFinal: 'Data da efetiva transmissão ou lavratura do auto de infração',
    vigencia: '2026-01-01',
    baseLegal: 'Resolução CGSN nº 183/2025; LC 123/2006, Art. 38-A, §2º',
    observacao: 'Antes de 2026 NÃO havia multa automática. Agora qualquer atraso, mesmo de 1 dia, gera multa.',
    impactoAssinante: 'ALTO — Acompanhamento mensal de prazos é essencial para evitar multas.'
  },
  DEFIS: {
    descricao: 'Multa por atraso na DEFIS (declaração anual)',
    percentualMensal: 0.02,         // 2% ao mês ou fração
    limitePercentual: 0.20,         // Máximo 20%
    multaPorGrupoOmissoes: 100.00,  // R$ 100 por grupo de 10 informações incorretas/omitidas
    valorMinimo: 200.00,            // R$ 200,00 mínimo
    prazoEntrega2025: '2026-03-31', // DEFIS do ano-calendário 2025
    termoInicial: 'Dia seguinte ao término do prazo fixado',
    termoFinal: 'Data da efetiva prestação ou lavratura do auto de infração',
    vigencia: '2026-01-01',
    reducaoEntregaEspontanea: true,
    baseLegal: 'Resolução CGSN nº 183/2025; LC 123/2006, Art. 38-A',
    observacao: 'Primeira vez que DEFIS gera multa por atraso. Entrega até 31/03/2026 (AC 2025).',
    impactoAssinante: 'CRÍTICO — DEFIS do AC 2025 deve ser entregue até 31/03/2026, senão multa de no mínimo R$ 200.'
  }
};

/**
 * Calcula a multa estimada por atraso no PGDAS-D ou DEFIS.
 * @param {Object} params
 * @param {string} params.tipo — 'PGDAS_D' ou 'DEFIS'
 * @param {number} params.valorTributos — Total de tributos informados/declarados
 * @param {number} params.diasAtraso — Dias de atraso
 * @returns {Object} Detalhamento da multa
 */
function calcularMultaAtraso(params) {
  const { tipo, valorTributos = 0, diasAtraso = 0 } = params;

  const regra = PENALIDADES_2026[tipo];
  if (!regra) throw new Error(`[MULTA_001] Tipo "${tipo}" inválido. Use PGDAS_D ou DEFIS.`);

  if (diasAtraso <= 0) return { multa: 0, observacao: 'Sem atraso', baseLegal: regra.baseLegal };

  // Meses de atraso (fração de mês conta como mês inteiro)
  const mesesAtraso = Math.ceil(diasAtraso / 30);
  const percentualAplicado = Math.min(mesesAtraso * regra.percentualMensal, regra.limitePercentual);
  const multaCalculada = _arredondar(valorTributos * percentualAplicado);
  const multa = Math.max(multaCalculada, regra.valorMinimo);

  return {
    tipo,
    diasAtraso,
    mesesAtraso,
    percentualAplicado,
    percentualFormatado: (percentualAplicado * 100).toFixed(1) + '%',
    multaCalculada: _arredondar(multaCalculada),
    multaMinima: regra.valorMinimo,
    multaFinal: _arredondar(multa),
    multaFinalFormatada: _fmtBRL(multa),
    baseLegal: regra.baseLegal,
    alertaAssinante: multa > 0 ? `⚠️ Multa de ${_fmtBRL(multa)} por ${diasAtraso} dia(s) de atraso no ${tipo}.` : null
  };
}


/**
 * 34.2 — TRIBUTAÇÃO DE DIVIDENDOS 2026 (Lei 15.270/2025)
 *
 * A partir de janeiro/2026, distribuição de lucros/dividendos > R$ 50.000/mês
 * por uma mesma PJ a uma mesma PF residente no Brasil está sujeita a IRRF de 10%.
 *
 * CONTROVÉRSIA JURÍDICA: Há forte debate se essa regra se aplica ao Simples Nacional,
 * uma vez que o Art. 14 da LC 123/2006 prevê isenção específica. ADIs 7912 e 7914
 * foram ajuizadas no STF questionando a constitucionalidade.
 *
 * A Receita Federal posiciona-se que a retenção APLICA-SE ao Simples Nacional.
 * Juristas argumentam que lei ordinária não pode revogar benefício de lei complementar.
 */
const TRIBUTACAO_DIVIDENDOS_2026 = {
  descricao: 'Retenção de IRRF sobre lucros/dividendos acima de R$ 50 mil/mês',
  limiteIsencaoMensal: 50_000.00,
  aliquotaIRRF: 0.10,
  vigencia: '2026-01-01',
  baseLegalNova: 'Lei nº 15.270/2025, Art. 6º-A da Lei 9.250/1995',
  baseLegalSN: 'LC 123/2006, Art. 14 (isenção na fonte e no ajuste anual)',
  posicaoRFB: 'Receita Federal entende que a retenção aplica-se inclusive ao Simples Nacional.',
  controversia: 'ADIs 7912 e 7914 no STF questionam constitucionalidade para empresas do Simples. ' +
                'Lei ordinária (15.270) x Lei Complementar (123/2006, Art. 14). ' +
                'Hierarquia normativa: LC 123 tem caráter especial protegido pelo Art. 146, III, "d" da CF.',
  regraTransicao: {
    lucrosAte2025: 'Lucros apurados até AC 2025 permanecem isentos se distribuição aprovada até 31/12/2025.',
    prazoProrrogado: 'Ministro Nunes Marques (STF) prorrogou prazo para 31/01/2026.',
    pagamentoAte2028: 'Pagamento dos lucros isentos pode ocorrer até 2028, conforme aprovação.'
  },
  tributacaoMinima: {
    descricao: 'IRPF Mínimo para rendimentos anuais > R$ 600 mil',
    limiteAnual: 600_000.00,
    aliquotaMaxima: 0.10,
    faixaInicial: 600_000.00,
    faixaFinal: 1_200_000.00,
    observacao: 'Alíquota cresce progressivamente de 0% (R$ 600k) até 10% (R$ 1,2M+).',
    baseLegal: 'Lei 15.270/2025, Art. 16-A da Lei 9.250/1995'
  },
  calculoSimplificadoLucro: {
    descricao: 'Empresas fora do Lucro Real podem optar por cálculo simplificado do lucro contábil',
    deducoesPermitidas: [
      'Folha de salários, administradores e encargos',
      'Custo de mercadorias (comércio)',
      'Matéria-prima e embalagem (indústria)',
      'Aluguéis de imóveis necessários à operação',
      'Juros sobre financiamentos (instituições autorizadas pelo BACEN)',
      'Depreciação de equipamentos (indústria)'
    ],
    baseLegal: 'Lei 15.270/2025, Art. 10, §6º da Lei 9.249/1995'
  },
  impactoAssinante: 'CRÍTICO — Pode impactar sócios que recebem > R$ 50k/mês em dividendos. ' +
                    'Planejamento de distribuição de lucros é essencial.'
};

/**
 * Calcula o impacto da tributação de dividendos (Lei 15.270/2025) para sócios.
 *
 * @param {Object} params
 * @param {number} params.lucroDistribuivelMensal — Lucro distribuível mensal
 * @param {Array}  params.socios — Array com {nome, percentual}
 * @returns {Object} Análise de impacto por sócio
 */
function calcularImpactoDividendos2026(params) {
  const { lucroDistribuivelMensal, socios = [] } = params;
  const limite = TRIBUTACAO_DIVIDENDOS_2026.limiteIsencaoMensal;
  const aliq = TRIBUTACAO_DIVIDENDOS_2026.aliquotaIRRF;

  const resultado = {
    lucroDistribuivelMensal: _arredondar(lucroDistribuivelMensal),
    baseLegal: TRIBUTACAO_DIVIDENDOS_2026.baseLegalNova,
    controversiaSTF: TRIBUTACAO_DIVIDENDOS_2026.controversia,
    porSocio: []
  };

  let totalRetidoMensal = 0;

  for (const socio of socios) {
    const valorMensal = _arredondar(lucroDistribuivelMensal * (socio.percentual || 0));
    const ultrapassaLimite = valorMensal > limite;
    // Se ultrapassa R$ 50k, IRRF de 10% sobre o TOTAL (não apenas o excedente)
    const irrfRetido = ultrapassaLimite ? _arredondar(valorMensal * aliq) : 0;
    const valorLiquido = _arredondar(valorMensal - irrfRetido);

    totalRetidoMensal += irrfRetido;

    resultado.porSocio.push({
      nome: socio.nome,
      percentual: socio.percentual,
      valorBrutoMensal: valorMensal,
      valorBrutoFormatado: _fmtBRL(valorMensal),
      ultrapassaLimite,
      irrfRetido: _arredondar(irrfRetido),
      irrfRetidoFormatado: _fmtBRL(irrfRetido),
      valorLiquido,
      valorLiquidoFormatado: _fmtBRL(valorLiquido),
      alertaAssinante: ultrapassaLimite
        ? `⚠️ ${socio.nome}: IRRF de ${_fmtBRL(irrfRetido)}/mês (10% sobre ${_fmtBRL(valorMensal)}). Considere fracionar distribuição.`
        : `✅ ${socio.nome}: Dentro do limite de R$ 50 mil — isento de IRRF.`
    });
  }

  resultado.totalRetidoMensal = _arredondar(totalRetidoMensal);
  resultado.totalRetidoAnual = _arredondar(totalRetidoMensal * 12);
  resultado.totalRetidoMensalFormatado = _fmtBRL(totalRetidoMensal);
  resultado.totalRetidoAnualFormatado = _fmtBRL(totalRetidoMensal * 12);

  // Estratégia de economia
  resultado.estrategiasEconomia = [];
  if (totalRetidoMensal > 0) {
    resultado.estrategiasEconomia.push({
      titulo: 'Fracionamento mensal da distribuição',
      descricao: 'Distribuir lucros em parcelas ≤ R$ 50 mil por mês para cada sócio.',
      economiaEstimada: _fmtBRL(totalRetidoMensal * 12),
      impacto: 'alto',
      baseLegal: 'Lei 15.270/2025, Art. 6º-A'
    });
    resultado.estrategiasEconomia.push({
      titulo: 'Revisão de pró-labore vs dividendos',
      descricao: 'Ajustar mix de pró-labore e dividendos para otimizar a carga tributária total.',
      impacto: 'alto',
      observacao: 'Pró-labore tem INSS (11%) mas é dedutível. Dividendos agora podem ter 10% IRRF.'
    });
    resultado.estrategiasEconomia.push({
      titulo: 'Contestação judicial (ADIs 7912/7914)',
      descricao: 'Questionar aplicação da Lei 15.270 ao Simples Nacional via mandado de segurança.',
      impacto: 'medio',
      risco: 'Resultado depende do julgamento das ADIs no STF. Recomendável acompanhar.',
      baseLegal: 'Art. 146, III, "d" CF c/c Art. 14 LC 123/2006'
    });
    resultado.estrategiasEconomia.push({
      titulo: 'Escrituração contábil completa',
      descricao: 'Manter escrituração contábil completa permite distribuir lucro contábil efetivo (que pode ser maior que a presunção), otimizando a base de distribuição.',
      impacto: 'medio',
      baseLegal: 'LC 123/2006, Art. 14, §1º'
    });
  }

  return resultado;
}


/**
 * 34.3 — REFORMA TRIBUTÁRIA — IBS/CBS NO SIMPLES NACIONAL (2026-2033)
 *
 * Em 2026: Empresas do Simples Nacional ESTÃO ISENTAS das alíquotas-teste de IBS/CBS.
 * A partir de set/2026: Opção para 2027 — continuar no SN ou migrar para IBS/CBS.
 * 2027+: CBS substitui PIS/COFINS; IBS substitui ICMS/ISS (transição gradual até 2033).
 *
 * Base Legal: LC 214/2025 (Art. 117-125, Art. 348, III, "c"); EC 132/2023
 */
const REFORMA_TRIBUTARIA_SIMPLES = {
  fase2026: {
    descricao: 'Período de testes — Simples Nacional ISENTO de IBS/CBS em 2026',
    aliquotaTesteCBS: 0.009,  // 0,9%
    aliquotaTesteIBS: 0.001,  // 0,1%
    aplicavelSimplesNacional: false, // NÃO se aplica ao SN em 2026
    obrigacoesAcessorias: {
      nfe: 'Empresas do SN NÃO precisam destacar IBS/CBS nas NF-e em 2026.',
      nfse: 'Destaque de IBS/CBS na NFS-e é facultativo em 2026.',
      cClassTrib: 'Novo código obrigatório nas NF a partir de 2026 (identificação do tipo de tributação).',
      preparacao: 'Recomendado: revisar NCM, NBS, CST, CFOP e adotar cClassTrib para preparação.'
    },
    baseLegal: 'LC 214/2025, Art. 348, III, "c"'
  },
  fase2027_2028: {
    descricao: 'CBS entra em vigor (substitui PIS/COFINS). IBS inicia transição.',
    prazoOpcao: 'Até setembro/2026 para optar se em 2027 continua no SN ou migra para IBS/CBS.',
    cbsAliquotaReferencia: 0.093, // ~9,3% estimativa
    ibsAliquotaReferencia: 0.187, // ~18,7% estimativa
    observacao: 'Simples pode optar por recolher CBS/IBS fora do DAS (modelo híbrido) para gerar créditos aos clientes.',
    baseLegal: 'LC 214/2025, Arts. 353-359'
  },
  fase2029_2032: {
    descricao: 'Aumento progressivo de IBS/CBS. Redução gradual de ICMS/ISS/PIS/COFINS.',
    extintosPIS_COFINS: '2027 (substituídos por CBS)',
    transicaoICMS_ISS: '2029-2032 (redução gradual até extinção)',
    extintosFinal: '2033 — extinção total de ICMS, ISS, PIS, COFINS, IPI'
  },
  modeloHibrido: {
    descricao: 'Empresa do Simples pode optar por recolher IBS/CBS fora do DAS',
    vantagem: 'Permite que clientes B2B aproveitem créditos de IBS/CBS nas suas compras.',
    desvantagem: 'Maior complexidade fiscal e contábil.',
    recomendacao: 'Indicado para empresas B2B cujos clientes são do Lucro Presumido/Real.',
    impactoAssinante: 'ALTO — Decisão estratégica que pode afetar competitividade em vendas B2B.'
  },
  cronograma: [
    { ano: 2026, evento: 'Testes IBS 0,1% + CBS 0,9% (SN isento). Preparação de sistemas.' },
    { ano: 2027, evento: 'CBS efetiva. PIS/COFINS extintos. IPI zerado (exceto ZFM). IS entra em vigor.' },
    { ano: 2028, evento: 'Continuação CBS. Alíquotas de transição para IBS.' },
    { ano: 2029, evento: 'IBS efetivo. Início da redução do ICMS e ISS.' },
    { ano: 2030, evento: 'Redução progressiva ICMS/ISS.' },
    { ano: 2031, evento: 'Redução progressiva ICMS/ISS.' },
    { ano: 2032, evento: 'Últimas alíquotas de transição ICMS/ISS.' },
    { ano: 2033, evento: 'Extinção total: ICMS, ISS, PIS, COFINS, IPI. Apenas IBS + CBS + IS.' }
  ],
  impactoAssinante: 'ESTRATÉGICO — Acompanhar a transição é fundamental. Decisão de regime em set/2026.'
};


/**
 * 34.4 — GRUPO ECONÔMICO (LC 214/2025 — Nova Fiscalização)
 *
 * A Receita Federal agora analisa a REALIDADE ECONÔMICA dos negócios.
 * Não basta ter CNPJs separados; se funcionam como um só, será tratado como grupo.
 * Impacta diretamente o enquadramento no Simples (soma de faturamento).
 */
const GRUPO_ECONOMICO_2026 = {
  descricao: 'Novo conceito de grupo econômico para fins de enquadramento no Simples Nacional',
  indicadores: [
    'Controle comum: mesmos donos, sócios relacionados (familiares) ou sócio com poder de mando',
    'Compartilhamento de estrutura: endereço, funcionários, equipamentos',
    'Vendas/serviços cruzados: uma empresa vende majoritariamente para/da outra',
    'Mesmo ramo de negócio ou atividades complementares',
    'Administração ou gestão financeira centralizada',
    'Funcionários transitando entre empresas',
    'Clientes ou fornecedores em comum de forma predominante'
  ],
  consequencia: 'Receitas das empresas do grupo são SOMADAS para verificar o limite de R$ 4,8 milhões.',
  risco: 'Exclusão retroativa do Simples Nacional com cobrança de diferenças tributárias + multas.',
  checklistRisco: [
    { pergunta: 'Sócios com participação em mais de uma empresa no Simples Nacional?', risco: 'alto' },
    { pergunta: 'Empresas atuam no mesmo ramo ou atividades complementares?', risco: 'alto' },
    { pergunta: 'Compartilham endereço, estrutura, funcionários ou equipamentos?', risco: 'critico' },
    { pergunta: 'Vendas/serviços destinados majoritariamente entre as empresas?', risco: 'critico' },
    { pergunta: 'Administração ou gestão financeira centralizada?', risco: 'medio' },
    { pergunta: 'Clientes/fornecedores em comum de forma predominante?', risco: 'medio' }
  ],
  baseLegal: 'LC 214/2025; LC 123/2006, Art. 3º, §4º',
  impactoAssinante: 'CRÍTICO — Em 2026, a estratégia de "dividir para não crescer" é a mais perigosa.'
};


/**
 * 34.5 — DIFAL (Diferencial de Alíquota de ICMS)
 * Base Legal: Lei Complementar nº 190/2022, Convênio ICMS 236/21
 */
const ALIQUOTAS_INTERNAS_UF = {
  'AC': 0.19, 'AL': 0.19, 'AP': 0.18, 'AM': 0.20, 'BA': 0.205, 'CE': 0.20,
  'DF': 0.20, 'ES': 0.17, 'GO': 0.19, 'MA': 0.22, 'MT': 0.17, 'MS': 0.17,
  'MG': 0.18, 'PA': 0.19, 'PB': 0.20, 'PR': 0.195, 'PE': 0.205, 'PI': 0.21,
  'RJ': 0.22, 'RN': 0.20, 'RS': 0.17, 'RO': 0.195, 'RR': 0.20, 'SC': 0.17,
  'SP': 0.18, 'SE': 0.19, 'TO': 0.20
};

/**
 * Calcula o DIFAL (Diferencial de Alíquota) para operações interestaduais.
 *
 * @param {Object} params
 * @param {number} params.valorOperacao — Valor da operação
 * @param {string} params.ufOrigem — UF de origem
 * @param {string} params.ufDestino — UF de destino
 * @param {boolean} params.isConsumidorFinal — Se o destinatário é consumidor final
 * @returns {Object}
 */
function calcularDIFAL(params) {
  const { valorOperacao, ufOrigem, ufDestino, isConsumidorFinal = false } = params;

  if (!isConsumidorFinal) {
    return {
      valorDIFAL: 0,
      observacao: 'DIFAL não se aplica — destinatário NÃO é consumidor final.',
      baseLegal: 'LC 190/2022'
    };
  }

  if (ufOrigem === ufDestino) {
    return {
      valorDIFAL: 0,
      observacao: 'Operação interna — não há DIFAL.',
      baseLegal: 'LC 190/2022'
    };
  }

  // Alíquotas interestaduais: 7% (Sul/Sudeste → N/NE/CO) ou 12% (demais)
  const ufsSulSudeste = ['SP', 'RJ', 'MG', 'PR', 'RS', 'SC', 'ES'];
  const ufsNorteNordesteCO = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'GO', 'MA', 'MT', 'MS',
                               'PA', 'PB', 'PE', 'PI', 'RN', 'RO', 'RR', 'SE', 'TO'];
  
  let aliqInter = 0.12; // padrão
  if (ufsSulSudeste.includes(ufOrigem) && ufsNorteNordesteCO.includes(ufDestino)) {
    aliqInter = 0.07;
  }

  const aliqInternaDestino = ALIQUOTAS_INTERNAS_UF[ufDestino] || 0.17;
  const valorDIFAL = _arredondar(Math.max(0, valorOperacao * (aliqInternaDestino - aliqInter)));

  return {
    valorOperacao: _arredondar(valorOperacao),
    ufOrigem,
    ufDestino,
    aliquotaInterestadual: aliqInter,
    aliquotaInternaDestino: aliqInternaDestino,
    valorDIFAL,
    valorDIFALFormatado: _fmtBRL(valorDIFAL),
    responsavel: 'Remetente (empresa do Simples)',
    baseLegal: 'LC 190/2022; Convênio ICMS 236/21',
    observacao: 'O Simples Nacional recolhe o DIFAL por fora do DAS.',
    impactoAssinante: valorDIFAL > 0
      ? `⚠️ DIFAL de ${_fmtBRL(valorDIFAL)} deve ser recolhido separadamente do DAS.`
      : 'Sem DIFAL aplicável.'
  };
}


/**
 * 34.6 — PRODUTOS MONOFÁSICOS — NCMs (Inteligência PGDAS-D)
 *
 * Produtos com tributação monofásica de PIS/COFINS NÃO devem ter esses tributos
 * cobrados novamente no DAS. Segregar corretamente no PGDAS-D gera ECONOMIA REAL.
 */
const PRODUTOS_MONOFASICOS_NCM = {
  BEBIDAS_FRIAS: {
    ncms: ['2201', '2202', '2203', '2204', '2205', '2206', '2207', '2208'],
    descricao: 'Cervejas, águas, refrigerantes, sucos, vinhos, destilados',
    tributacao: 'PIS/COFINS recolhidos pelo fabricante/importador (tributação concentrada)',
    impactoRevenda: 'Varejista/atacadista paga ZERO de PIS/COFINS sobre essas receitas no DAS.',
    baseLegal: 'Lei 10.833/2003, Art. 58-A a 58-V; Lei 13.097/2015'
  },
  PERFUMARIA_HIGIENE: {
    ncms: ['3303', '3304', '3305', '3307'],
    descricao: 'Perfumes, maquiagem, shampoos, desodorantes, produtos de higiene',
    tributacao: 'PIS/COFINS concentrados na indústria/importação',
    impactoRevenda: 'Revenda isenta de PIS/COFINS no DAS.',
    baseLegal: 'Lei 10.147/2000'
  },
  FARMACEUTICOS: {
    ncms: ['3001', '3002', '3003', '3004', '3005', '3006'],
    descricao: 'Medicamentos, preparações farmacêuticas, curativos',
    tributacao: 'PIS/COFINS com alíquota zero no varejo para grande parte dos itens',
    impactoRevenda: 'Revenda isenta ou com alíquota zero de PIS/COFINS no DAS.',
    baseLegal: 'Lei 10.147/2000; Decreto 3.803/2001'
  },
  AUTOPECAS: {
    ncms: ['4011', '4012', '4013', '8433', '8481', '8482', '8483', '8484'],
    descricao: 'Pneus, câmaras de ar, peças automotivas',
    tributacao: 'PIS/COFINS monofásicos concentrados no fabricante/importador',
    impactoRevenda: 'Revenda de autopeças pode excluir PIS/COFINS do DAS.',
    baseLegal: 'Lei 10.485/2002'
  },
  COMBUSTIVEIS: {
    ncms: ['2710', '2711'],
    descricao: 'Gasolina, Diesel, GLP, querosene',
    tributacao: 'Tributação monofásica — recolhimento concentrado na refinaria/distribuidora',
    impactoRevenda: 'Postos de combustíveis pagam ZERO de PIS/COFINS no DAS.',
    baseLegal: 'Lei 9.718/1998; Lei 10.336/2001'
  },
  MAQUINAS_VEICULOS: {
    ncms: ['8429', '8430', '8432', '8433', '8434', '8435', '8436', '8701', '8702', '8703', '8704', '8711'],
    descricao: 'Veículos, máquinas agrícolas, tratores, caminhões, motocicletas',
    tributacao: 'PIS/COFINS concentrados no fabricante/importador',
    impactoRevenda: 'Concessionárias e revendas pagam PIS/COFINS reduzido ou zero no DAS.',
    baseLegal: 'Lei 10.485/2002; Decreto 5.060/2004'
  }
};

/**
 * Verifica se um NCM é monofásico e retorna informações de economia.
 * @param {string} ncm — Código NCM (mínimo 4 dígitos)
 * @returns {Object|null}
 */
function verificarMonofasicoNCM(ncm) {
  if (!ncm) return null;
  const ncm4 = ncm.replace(/[.\-\/]/g, '').substring(0, 4);

  for (const [categoria, dados] of Object.entries(PRODUTOS_MONOFASICOS_NCM)) {
    if (dados.ncms.includes(ncm4)) {
      return {
        monofasico: true,
        categoria,
        descricao: dados.descricao,
        impactoRevenda: dados.impactoRevenda,
        baseLegal: dados.baseLegal,
        alertaAssinante: `💰 NCM ${ncm} é MONOFÁSICO! Segregue no PGDAS-D para NÃO pagar PIS/COFINS no DAS.`
      };
    }
  }
  return { monofasico: false, ncm, observacao: 'NCM não identificado como monofásico na base.' };
}

/**
 * Calcula economia com segregação monofásica no PGDAS-D.
 * @param {Object} params
 * @param {number} params.receitaMonofasica — Receita de produtos monofásicos no mês
 * @param {number} params.rbt12 — RBT12
 * @param {string} params.anexo — Anexo
 * @returns {Object}
 */
function calcularEconomiaMonofasica(params) {
  const { receitaMonofasica, rbt12, anexo } = params;

  if (!receitaMonofasica || receitaMonofasica <= 0) {
    return { economia: 0, observacao: 'Sem receita monofásica.' };
  }

  const aliqResult = calcularAliquotaEfetiva({ rbt12, anexo });
  const faixa = aliqResult.faixa;
  const partilhaPct = PARTILHA[anexo] ? PARTILHA[anexo][faixa - 1] : null;

  if (!partilhaPct) return { economia: 0, observacao: 'Não foi possível calcular.' };

  const pctPIS = partilhaPct.pis || 0;
  const pctCOFINS = partilhaPct.cofins || 0;
  const pctTotalExcluido = pctPIS + pctCOFINS;
  const aliqEfetivaSemMonofasica = aliqResult.aliquotaEfetiva * (1 - pctTotalExcluido);
  const dasComMonofasico = _arredondar(receitaMonofasica * aliqResult.aliquotaEfetiva);
  const dasSemMonofasico = _arredondar(receitaMonofasica * aliqEfetivaSemMonofasica);
  const economiaMensal = _arredondar(dasComMonofasico - dasSemMonofasico);

  return {
    receitaMonofasica: _arredondar(receitaMonofasica),
    aliquotaEfetivaNormal: aliqResult.aliquotaEfetiva,
    aliquotaEfetivaSemPISCOFINS: _arredondar(aliqEfetivaSemMonofasica, 6),
    percentualPISExcluido: pctPIS,
    percentualCOFINSExcluido: pctCOFINS,
    dasSeNaoSegregasse: dasComMonofasico,
    dasComSegregacao: dasSemMonofasico,
    economiaMensal,
    economiaMensalFormatada: _fmtBRL(economiaMensal),
    economiaAnual: _arredondar(economiaMensal * 12),
    economiaAnualFormatada: _fmtBRL(economiaMensal * 12),
    baseLegal: 'Resolução CGSN 140/2018, Art. 25-A; Lei 10.147/2000',
    alertaAssinante: `💰 Segregação monofásica gera economia de ${_fmtBRL(economiaMensal)}/mês (${_fmtBRL(economiaMensal * 12)}/ano).`
  };
}


/**
 * 34.7 — BENEFÍCIOS ESTADUAIS (Isenção de ICMS por Faixa)
 *
 * Alguns estados isentam 100% do ICMS para microempresas dentro do Simples.
 * Atualizado para 2026 com dados dos principais estados.
 */
const ISENCAO_ESTADUAL_ICMS = {
  'RS': { limiteReceita: 360_000.00, isencao: 1.00, descricao: 'Isenção integral do ICMS para MEs', baseLegal: 'Lei Estadual RS 13.036/2008' },
  'SE': { limiteReceita: 360_000.00, isencao: 1.00, descricao: 'Isenção integral do ICMS para MEs', baseLegal: 'Lei Estadual SE' },
  'PR': { limiteReceita: 360_000.00, isencao: 1.00, descricao: 'Isenção total do ICMS para MEs', baseLegal: 'Lei Estadual PR' },
  'SC': { limiteReceita: 360_000.00, isencao: 1.00, descricao: 'Isenção integral do ICMS para MEs', baseLegal: 'Lei Estadual SC' },
  'AM': { limiteReceita: 360_000.00, isencao: 1.00, descricao: 'Isenção integral ZFM + SN', baseLegal: 'Lei Estadual AM; SUFRAMA' },
  'PA': { limiteReceita: 360_000.00, isencao: 0.00, descricao: 'SEM isenção estadual de ICMS para MEs', baseLegal: 'N/A' },
  'SP': { limiteReceita: 0, isencao: 0.00, descricao: 'Redução de base de cálculo para bares/restaurantes (Convênio 09/93)', baseLegal: 'Convênio ICMS 09/93' },
  'RJ': { limiteReceita: 0, isencao: 0.00, descricao: 'SEM isenção estadual de ICMS para MEs', baseLegal: 'N/A' },
  'MG': { limiteReceita: 360_000.00, isencao: 0.50, descricao: 'Redução de 50% do ICMS para MEs (faixa 1)', baseLegal: 'Lei Estadual MG' }
};


/**
 * 34.8 — PRAZO DE IMPUGNAÇÃO (LC 227/2026)
 *
 * Mudança crítica: prazo de defesa passou de dias CORRIDOS para dias ÚTEIS.
 */
const PRAZO_IMPUGNACAO_2026 = {
  dias: 20,
  tipo: 'DIAS ÚTEIS',
  mudanca: 'Antes eram dias corridos. Agora são 20 dias ÚTEIS — mais prazo real de defesa.',
  vigencia: '2026',
  baseLegal: 'LC 227/2026',
  impactoAssinante: 'FAVORÁVEL — Mais tempo real para preparar defesa. Finais de semana e feriados não contam.'
};


/**
 * 34.9 — CALENDÁRIO FISCAL 2026 (Datas Críticas para Assinantes)
 */
const CALENDARIO_FISCAL_2026 = [
  { data: '2026-01-31', evento: 'Prazo final para opção pelo Simples Nacional (empresas existentes)', baseLegal: 'LC 123/2006, Art. 16' },
  { data: '2026-01-31', evento: 'Prazo prorrogado (STF) para aprovação de distribuição de lucros AC 2025', baseLegal: 'Decisão Min. Nunes Marques' },
  { data: '2026-02-28', evento: 'DIRF — Último dia útil de fevereiro (entrega referente AC 2025)', baseLegal: 'IN RFB 1.990/2020' },
  { data: '2026-03-31', evento: 'DEFIS AC 2025 — Entrega obrigatória. Atraso gera multa mín. R$ 200', baseLegal: 'Resolução CGSN 183/2025' },
  { data: '2026-05-31', evento: 'DASN-SIMEI — Declaração anual do MEI (AC 2025)', baseLegal: 'Resolução CGSN 140/2018' },
  { data: '2026-09-30', evento: 'Prazo para optar entre SN ou novo sistema IBS/CBS para 2027', baseLegal: 'LC 214/2025' },
  { data: null, evento: 'PGDAS-D — Todo dia 20 do mês subsequente. ATRASO GERA MULTA.', baseLegal: 'Resolução CGSN 183/2025' },
  { data: null, evento: 'DAS — Pagamento até dia 20 do mês subsequente ao faturamento', baseLegal: 'LC 123/2006, Art. 21' },
  { data: null, evento: 'eSocial — Eventos periódicos até dia 15 do mês subsequente', baseLegal: 'Decreto 8.373/2014' },
  { data: null, evento: 'EFD-Reinf — Até dia 15 do mês subsequente', baseLegal: 'IN RFB 2.043/2021' },
  { data: null, evento: 'DCTFWeb — Até dia 15 do mês seguinte (se tem empregados)', baseLegal: 'IN RFB 2.005/2021' }
];


/**
 * 34.10 — GERADOR DE DICAS DE ECONOMIA (Motor de Vendas de Assinatura)
 *
 * Analisa os dados da empresa e gera dicas personalizadas de economia fiscal.
 * Cada dica indica a economia estimada e o nível de acesso (gratuito/premium).
 */
function gerarDicasEconomia(params) {
  const {
    receitaBrutaAnual,
    receitaBrutaMensal,
    folhaAnual,
    folhaMensal,
    cnae,
    uf,
    anexo,
    rbt12,
    socios = [],
    temProdutosMonofasicos = false,
    receitaMonofasica = 0,
    vendasInterestaduais = false,
    temMaisDeUmCNPJ = false
  } = params;

  const dicas = [];
  const fatorR = folhaAnual > 0 && receitaBrutaAnual > 0 ? folhaAnual / receitaBrutaAnual : 0;

  // ─── DICA 1: Fator R (migração Anexo V → III) ───
  if (anexo === 'V' || (fatorR > 0 && fatorR < LIMITE_FATOR_R)) {
    const aliqV = calcularAliquotaEfetiva({ rbt12, anexo: 'V' });
    const aliqIII = calcularAliquotaEfetiva({ rbt12, anexo: 'III' });
    const economiaMensal = _arredondar(receitaBrutaMensal * (aliqV.aliquotaEfetiva - aliqIII.aliquotaEfetiva));
    dicas.push({
      id: 'fator_r_otimizacao',
      titulo: '🎯 Otimize o Fator "r" e pague menos',
      descricao: `Seu Fator "r" é ${(fatorR * 100).toFixed(1)}%. Aumentando a folha para atingir 28%, você cai do Anexo V para o III.`,
      economiaMensal: _fmtBRL(economiaMensal),
      economiaAnual: _fmtBRL(economiaMensal * 12),
      impacto: 'alto',
      nivel: 'premium',
      acao: 'Aumente pró-labore ou contrate registrado para elevar a folha acima de 28% da receita.'
    });
  }

  // ─── DICA 2: Segregação Monofásica ───
  if (temProdutosMonofasicos || (anexo === 'I' || anexo === 'II')) {
    const econMono = receitaMonofasica > 0
      ? calcularEconomiaMonofasica({ receitaMonofasica, rbt12, anexo })
      : null;
    dicas.push({
      id: 'monofasico_segregacao',
      titulo: '💰 Segregação de produtos monofásicos',
      descricao: 'Produtos como combustíveis, bebidas, perfumaria, autopeças e farmacêuticos têm PIS/COFINS pagos pelo fabricante. Segregue no PGDAS-D e NÃO pague novamente.',
      economiaMensal: econMono ? econMono.economiaMensalFormatada : 'A calcular — informe receita monofásica.',
      economiaAnual: econMono ? econMono.economiaAnualFormatada : 'A calcular',
      impacto: 'alto',
      nivel: 'gratuito',
      acao: 'Classifique as receitas de produtos monofásicos corretamente no PGDAS-D.'
    });
  }

  // ─── DICA 3: Multas PGDAS-D / DEFIS ───
  dicas.push({
    id: 'multas_2026',
    titulo: '⚠️ ALERTA: Novas multas por atraso em 2026',
    descricao: 'Desde jan/2026, PGDAS-D e DEFIS geram multa automática no 1º dia de atraso. Mínimo R$ 50 (PGDAS-D) e R$ 200 (DEFIS).',
    economiaAnual: 'Evite até R$ 2.400/ano em multas.',
    impacto: 'medio',
    nivel: 'gratuito',
    acao: 'Configure alertas de prazo. Use o calendário fiscal do IMPOST.'
  });

  // ─── DICA 4: Dividendos (Lei 15.270/2025) ───
  const lucroDistribuivelMensal = receitaBrutaMensal * 0.32; // presunção serviços
  const maiorSocio = socios.length > 0 ? socios.reduce((a, b) => (a.percentual > b.percentual ? a : b)) : null;
  const valorMaiorSocio = maiorSocio ? lucroDistribuivelMensal * (maiorSocio.percentual || 0) : 0;

  if (valorMaiorSocio > 50_000) {
    const irrfEstimado = _arredondar(valorMaiorSocio * 0.10);
    dicas.push({
      id: 'dividendos_2026',
      titulo: '🚨 Tributação de dividendos: IRRF de 10%',
      descricao: `Sócio ${maiorSocio.nome || 'principal'} recebe ~${_fmtBRL(valorMaiorSocio)}/mês. Acima de R$ 50 mil → IRRF de 10%.`,
      economiaMensal: _fmtBRL(irrfEstimado),
      economiaAnual: _fmtBRL(irrfEstimado * 12),
      impacto: 'critico',
      nivel: 'premium',
      acao: 'Fracione distribuição em parcelas ≤ R$ 50k/mês por sócio. Revise mix pró-labore/dividendos.'
    });
  }

  // ─── DICA 5: ISS Retido na Fonte ───
  if (['III', 'IV', 'V'].includes(anexo)) {
    dicas.push({
      id: 'iss_retido',
      titulo: '📋 Deduza ISS retido na fonte do DAS',
      descricao: 'Quando o tomador retém ISS, esse valor deve ser ABATIDO do DAS mensal.',
      impacto: 'medio',
      nivel: 'gratuito',
      acao: 'Informe o ISS retido no PGDAS-D para reduzir o valor do DAS.'
    });
  }

  // ─── DICA 6: Sublimite ICMS/ISS ───
  if (rbt12 > 3_200_000 && rbt12 <= SUBLIMITE_ICMS_ISS) {
    dicas.push({
      id: 'sublimite_alerta',
      titulo: '⚠️ Próximo do sublimite de R$ 3,6 milhões',
      descricao: 'Se ultrapassar R$ 3,6M em RBT12, ICMS e ISS saem do DAS e são recolhidos por fora.',
      impacto: 'alto',
      nivel: 'premium',
      acao: 'Planeje faturamento para evitar ultrapassar o sublimite. Simule no comparativo de regimes.'
    });
  }

  // ─── DICA 7: Grupo Econômico ───
  if (temMaisDeUmCNPJ) {
    dicas.push({
      id: 'grupo_economico',
      titulo: '🚨 ALERTA: Novo conceito de grupo econômico em 2026',
      descricao: 'A Receita Federal agora analisa a REALIDADE ECONÔMICA. Se suas empresas compartilham estrutura, podem ser tratadas como grupo.',
      impacto: 'critico',
      nivel: 'premium',
      acao: 'Faça o checklist de risco de grupo econômico. Busque independência operacional.'
    });
  }

  // ─── DICA 8: Comparativo de Regimes ───
  if (receitaBrutaAnual > 1_800_000) {
    dicas.push({
      id: 'comparativo_regimes',
      titulo: '📊 Compare: Simples x Lucro Presumido x Lucro Real',
      descricao: 'Com faturamento acima de R$ 1,8M, pode valer a pena migrar de regime. Use o comparativo completo.',
      impacto: 'alto',
      nivel: 'premium',
      acao: 'Execute compararRegimesCompleto() para análise detalhada.'
    });
  }

  // ─── DICA 9: Isenção Estadual de ICMS ───
  const isencaoUF = ISENCAO_ESTADUAL_ICMS[uf];
  if (isencaoUF && isencaoUF.isencao > 0 && receitaBrutaAnual <= isencaoUF.limiteReceita) {
    dicas.push({
      id: 'isencao_estadual',
      titulo: `✅ Isenção de ICMS no estado ${uf}`,
      descricao: isencaoUF.descricao,
      impacto: 'medio',
      nivel: 'gratuito',
      acao: 'Verifique se a isenção está sendo aplicada corretamente no DAS.'
    });
  }

  // ─── DICA 10: Reforma Tributária — Opção set/2026 ───
  dicas.push({
    id: 'reforma_tributaria_opcao',
    titulo: '🔄 Reforma Tributária: decida até setembro/2026',
    descricao: 'Empresas do SN devem optar até set/2026 se em 2027 continuam no Simples ou migram para IBS/CBS.',
    impacto: 'alto',
    nivel: 'premium',
    acao: 'Se sua empresa vende muito B2B, avaliar o modelo híbrido pode dar vantagem competitiva.'
  });

  // Ordenar por impacto
  const ordemImpacto = { critico: 0, alto: 1, medio: 2, baixo: 3 };
  dicas.sort((a, b) => (ordemImpacto[a.impacto] || 3) - (ordemImpacto[b.impacto] || 3));

  // Resumo
  const dicasGratuitas = dicas.filter(d => d.nivel === 'gratuito');
  const dicasPremium = dicas.filter(d => d.nivel === 'premium');

  return {
    totalDicas: dicas.length,
    dicasGratuitas: dicasGratuitas.length,
    dicasPremium: dicasPremium.length,
    dicas,
    mensagemVenda: dicasPremium.length > 0
      ? `🔓 Você tem ${dicasPremium.length} dica(s) PREMIUM bloqueada(s). ` +
        `Assine o IMPOST. para desbloquear estratégias avançadas de economia fiscal.`
      : null,
    ctaAssinatura: '💎 Assine agora e economize — IMPOST. Premium a partir de R$ 49,90/mês.'
  };
}


/**
 * 34.11 — RELATÓRIO COMPLETO DE ECONOMIA (Para Vendas de Assinatura)
 *
 * Gera relatório detalhado com todas as oportunidades de economia.
 * Versão gratuita mostra resumo; Premium mostra detalhes + ações.
 */
function gerarRelatorioEconomiaCompleto(params) {
  const {
    receitaBrutaAnual,
    receitaBrutaMensal,
    folhaAnual,
    folhaMensal,
    cnae,
    uf,
    municipio,
    socios = [],
    despesasOperacionais = 0,
    produtosMonofasicos = [],
    receitaMonofasica = 0,
    nivelAcesso = 'gratuito' // 'gratuito' ou 'premium'
  } = params;

  const rbt12 = receitaBrutaAnual;
  const fatorR = folhaAnual > 0 && rbt12 > 0 ? folhaAnual / rbt12 : 0;

  // Determinar anexo
  let anexo;
  try {
    const anexoResult = determinarAnexo({ cnae, fatorR });
    anexo = anexoResult.vedado ? null : anexoResult.anexo;
  } catch (e) {
    // Fallback: tentar via fator R direto
    anexo = fatorR >= LIMITE_FATOR_R ? 'III' : 'V';
  }

  if (!anexo) return { erro: 'CNAE vedado ao Simples Nacional.' };

  // DAS atual
  const dasAtual = calcularDASMensal({
    receitaBrutaMensal,
    rbt12,
    anexo,
    folhaMensal,
    aliquotaRAT: ALIQUOTA_RAT_PADRAO
  });

  // Dicas de economia
  const dicas = gerarDicasEconomia({
    receitaBrutaAnual,
    receitaBrutaMensal,
    folhaAnual,
    folhaMensal,
    cnae,
    uf,
    anexo,
    rbt12,
    socios,
    temProdutosMonofasicos: produtosMonofasicos.length > 0 || receitaMonofasica > 0,
    receitaMonofasica
  });

  // Impacto dividendos
  let impactoDividendos = null;
  if (socios.length > 0) {
    const lucroPresumido = receitaBrutaMensal * PRESUNCAO_LUCRO_SERVICOS;
    impactoDividendos = calcularImpactoDividendos2026({
      lucroDistribuivelMensal: lucroPresumido,
      socios
    });
  }

  // Economia monofásica
  let economiaMonofasica = null;
  if (receitaMonofasica > 0) {
    economiaMonofasica = calcularEconomiaMonofasica({ receitaMonofasica, rbt12, anexo });
  }

  // Penalidades evitáveis
  const penalidades = {
    pgdasd: calcularMultaAtraso({ tipo: 'PGDAS_D', valorTributos: dasAtual.dasAPagar, diasAtraso: 30 }),
    defis: calcularMultaAtraso({ tipo: 'DEFIS', valorTributos: dasAtual.dasAPagar * 12, diasAtraso: 30 })
  };

  const relatorio = {
    versao: '4.1.0',
    dataGeracao: new Date().toISOString(),
    produto: 'IMPOST. — Inteligência em Modelagem de Otimização Tributária',
    nivelAcesso,

    // Resumo (sempre visível)
    resumo: {
      dasAtual: dasAtual.dasAPagar,
      dasAtualFormatado: _fmtBRL(dasAtual.dasAPagar),
      aliquotaEfetiva: dasAtual.aliquotaEfetivaFormatada,
      anexo,
      fatorR: (fatorR * 100).toFixed(2) + '%',
      totalDicasEconomia: dicas.totalDicas,
      dicasPremiumBloqueadas: nivelAcesso === 'gratuito' ? dicas.dicasPremium : 0
    },

    // Calendário fiscal (sempre visível)
    calendarioFiscal: CALENDARIO_FISCAL_2026,

    // Penalidades 2026 (sempre visível como alerta)
    penalidades2026: PENALIDADES_2026,

    // Reforma Tributária (sempre visível)
    reformaTributaria: REFORMA_TRIBUTARIA_SIMPLES,

    // Dicas de economia (parcialmente bloqueadas)
    dicasEconomia: nivelAcesso === 'premium'
      ? dicas.dicas
      : dicas.dicas.map(d => d.nivel === 'gratuito' ? d : {
          ...d,
          economiaMensal: '🔒 Premium',
          economiaAnual: '🔒 Premium',
          acao: '🔒 Assine para desbloquear',
          bloqueado: true
        }),

    // Impacto dividendos (premium)
    impactoDividendos: nivelAcesso === 'premium' ? impactoDividendos : {
      resumo: impactoDividendos ? `${impactoDividendos.porSocio.length} sócio(s) analisado(s)` : null,
      detalhes: '🔒 Assine para ver a análise completa de dividendos.',
      bloqueado: true
    },

    // Economia monofásica (premium)
    economiaMonofasica: nivelAcesso === 'premium' ? economiaMonofasica : {
      resumo: economiaMonofasica ? `Economia estimada: 🔒 Premium` : null,
      bloqueado: true
    },

    // Grupo econômico (sempre visível como alerta)
    grupoEconomico: GRUPO_ECONOMICO_2026,

    // CTA de vendas
    cta: nivelAcesso === 'gratuito' ? {
      mensagem: `🎯 Você tem ${dicas.dicasPremium} estratégia(s) de economia bloqueada(s).`,
      acao: 'Assine o IMPOST. Premium e desbloqueie TODAS as estratégias.',
      preco: 'A partir de R$ 49,90/mês',
      beneficios: [
        'Dicas personalizadas de economia fiscal',
        'Comparativo completo de regimes tributários',
        'Alerta de prazos e multas automatizado',
        'Simulador de Fator "r" e migração de anexo',
        'Análise de impacto de dividendos (Lei 15.270/2025)',
        'Segregação monofásica automatizada',
        'Relatório mensal de otimização',
        'Suporte prioritário'
      ]
    } : null
  };

  return relatorio;
}


/**
 * Objeto principal de exportação do módulo.
 */
const SimplesNacional = {
  // ── Constantes Legais ──────────────────────────────────────
  LIMITE_ME,
  LIMITE_EPP,
  SUBLIMITE_ICMS_ISS,
  LIMITE_RECEITA_MENSAL_PROPORCIONAL,
  LIMITE_FATOR_R,
  ALIQUOTA_INSS_PATRONAL_ANEXO_IV,
  ALIQUOTA_RAT_PADRAO,
  ISS_MINIMO,
  ISS_MAXIMO,
  ALIQUOTA_GANHO_CAPITAL,
  PRESUNCAO_LUCRO_COMERCIO,
  PRESUNCAO_LUCRO_TRANSPORTE,
  PRESUNCAO_LUCRO_SERVICOS,
  LIMITE_EXCESSO_20_PORCENTO,
  ALIQUOTA_FGTS,

  // ── Tabelas dos Anexos ─────────────────────────────────────
  ANEXOS,
  PARTILHA,
  ANEXO_VI_HISTORICO,

  // ── Mapeamento CNAE ────────────────────────────────────────
  MAPEAMENTO_CNAE,
  MAPEAMENTO_CNAE_ADICIONAL,
  ATIVIDADES_PARAGRAFO_5I,

  // ── Regras de Tributação ───────────────────────────────────
  REGRAS_TRIBUTACAO_ATIVIDADE,
  SEGREGACAO_RECEITAS,
  PRODUTOS_MONOFASICOS,
  PRAZO_MINIMO_ICMS_ST,

  // ── Reduções Legais e Estratégias ──────────────────────────
  REDUCOES_LEGAIS,
  ESTRATEGIAS_MENOR_IMPOSTO,

  // ── MEI ────────────────────────────────────────────────────
  MEI,

  // ── Benefícios Especiais ───────────────────────────────────
  LICITACOES_BENEFICIOS,
  RECUPERACAO_JUDICIAL,

  // ── Vedações e Riscos ──────────────────────────────────────
  VEDACOES,
  OBRIGACOES_ACESSORIAS,
  RISCOS_FISCAIS,
  TRANSICOES,

  // ── Funções Base ────────────────────────────────────────────
  calcularFatorR,
  determinarAnexo,
  calcularAliquotaEfetiva,
  calcularDASMensal,
  calcularAnualConsolidado,
  calcularPartilhaTributos,
  verificarElegibilidade,
  calcularDistribuicaoLucros,
  analisarVantagensDesvantagens,
  compararComOutrosRegimes,

  // ── Funções Otimizadas (NOVAS) ★ ────────────────────────────
  calcularDASMensalOtimizado,
  calcularDASSegregado,
  otimizarFatorR,
  compararRegimesCompleto,
  gerarRelatorioOtimizacao,

  // ── Integração com Módulos Auxiliares ────────────────────────
  obterRegrasCNAE,
  isVedadoCNAE,
  obterAnexoEfetivoCNAE,
  isMonofasicoCNAE,
  obterDadosEstado,
  verificarIncentivosRegionais,
  obterAliquotaICMS,
  obterAliquotaISS,

  // ── Módulo Avançado 2026 (NOVO v4.1) ★ ──────────────────────
  PENALIDADES_2026,
  TRIBUTACAO_DIVIDENDOS_2026,
  REFORMA_TRIBUTARIA_SIMPLES,
  GRUPO_ECONOMICO_2026,
  PRODUTOS_MONOFASICOS_NCM,
  ISENCAO_ESTADUAL_ICMS,
  PRAZO_IMPUGNACAO_2026,
  CALENDARIO_FISCAL_2026,
  ALIQUOTAS_INTERNAS_UF,
  calcularMultaAtraso,
  calcularImpactoDividendos2026,
  calcularDIFAL,
  verificarMonofasicoNCM,
  calcularEconomiaMonofasica,
  gerarDicasEconomia,
  gerarRelatorioEconomiaCompleto,

  // ── Funções Auxiliares ─────────────────────────────────────
  getAnexosDisponiveis,
  getFaixaByRBT12,
  calcularRBT12Proporcional,
  validarDadosEntrada,
  formatarResultadoTexto,
  _arredondar,
  _formatarMoeda: _fmtBRL,

  // ── Metadados ──────────────────────────────────────────────
  VERSION: '4.1.0',
  PRODUTO: 'IMPOST. — Inteligência em Modelagem de Otimização Tributária',
  DATA_ATUALIZACAO: new Date().toISOString().split('T')[0],
  BASE_LEGAL: 'LC 123/2006; LC 155/2016; LC 214/2025; LC 227/2026; Lei 15.270/2025; Resolução CGSN 140/2018; Resolução CGSN 183/2025'
};

// Alias: IMPOST_API = SimplesNacional (retrocompatibilidade)
const IMPOST_API = SimplesNacional;

// CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IMPOST_API;
}

// ESM / Browser
if (typeof globalThis !== 'undefined') {
  globalThis.IMPOST = IMPOST_API;
  globalThis.SimplesNacional = IMPOST_API; // retrocompatibilidade
}


// ================================================================================
// SEÇÃO 33: DEMONSTRAÇÃO IMPOST v4.0 (executar com `node simples_nacional.js`)
// ================================================================================

/**
 * Execução de demonstração do IMPOST. v4.0.
 * Aceita dados como parâmetro ou usa exemplo padrão.
 * @param {Object} [dadosEmpresa] — Dados da empresa (opcional)
 */
function executarDemonstracao(dadosEmpresa) {
  const sep = '═'.repeat(68);
  const sep2 = '─'.repeat(68);
  const log = console.log.bind(console);

  log('');
  log('╔' + sep + '╗');
  log('║   IMPOST. — Inteligência em Modelagem de Otimização Tributária     ║');
  log('║   Motor de Cálculo Fiscal Otimizado v4.0                           ║');
  log('╚' + sep + '╝');
  log('');

  // Dados da empresa (parâmetro ou exemplo)
  const empresa = dadosEmpresa || {
    nome: 'EMPRESA EXEMPLO S/A',
    cnae: '7119-7/00',
    uf: 'PA',
    municipio: 'Novo Progresso',
    receitaBrutaAnual: 2_350_000.00,
    receitaBrutaMensal: 2_350_000 / 12,
    folhaAnual: 1_000_000.00,
    folhaMensal: 1_000_000 / 12,
    socios: [
      { nome: 'Sócio 1 (Majoritário)', percentual: 0.65 },
      { nome: 'Sócio 2 (Minoritário)', percentual: 0.35 }
    ],
    despesasOperacionais: 800_000.00,
    receitaMonofasica: 0,
    receitaICMS_ST: 0,
    receitaExportacao: 0
  };

  // ▸ 1. DADOS DA EMPRESA
  log('▸ 1. DADOS DA EMPRESA');
  log(sep2);
  log(`  Nome:       ${empresa.nome}`);
  log(`  CNAE:       ${empresa.cnae}`);
  log(`  UF:         ${empresa.uf}`);
  log(`  Município:  ${empresa.municipio}`);
  log(`  Receita Bruta Anual: ${_fmtBRL(empresa.receitaBrutaAnual)}`);
  log(`  Folha Anual:         ${_fmtBRL(empresa.folhaAnual)}`);
  log('');

  // ▸ 2. CLASSIFICAÇÃO CNAE (via CnaeMapeamento)
  log('▸ 2. CLASSIFICAÇÃO CNAE');
  log(sep2);
  const regrasCNAE = obterRegrasCNAE(empresa.cnae);
  log(`  Anexo:          ${regrasCNAE.anexo || 'Fator R'}`);
  log(`  Fator R:        ${regrasCNAE.fatorR ? 'SIM' : 'NÃO'}`);
  log(`  Presunção IRPJ: ${((regrasCNAE.presuncaoIRPJ || 0) * 100).toFixed(0)}%`);
  log(`  Presunção CSLL: ${((regrasCNAE.presuncaoCSLL || 0) * 100).toFixed(0)}%`);
  log(`  Vedado:         ${regrasCNAE.vedado ? 'SIM — ' + regrasCNAE.motivoVedacao : 'NÃO'}`);
  log(`  Monofásico:     ${regrasCNAE.monofasico || 'NÃO'}`);
  log(`  Fonte:          ${regrasCNAE.fonte || 'CnaeMapeamento'}`);
  log('');

  // ▸ 3. FATOR "r" E ANEXO
  log('▸ 3. FATOR "r" E ANEXO');
  log(sep2);
  const fatorResult = calcularFatorR({
    folhaSalarios12Meses: empresa.folhaAnual,
    receitaBruta12Meses: empresa.receitaBrutaAnual
  });
  log(`  Folha (12m):  ${_fmtBRL(fatorResult.folhaSalarios12Meses)}`);
  log(`  RBT12:        ${_fmtBRL(fatorResult.receitaBruta12Meses)}`);
  log(`  Fator "r":    ${fatorResult.fatorRPercentual}`);
  log(`  Limiar:       ${fatorResult.limiarPercentual}`);
  log(`  Anexo:        ${fatorResult.anexoResultante}`);
  log(`  ${fatorResult.observacao}`);
  log('');

  const anexo = obterAnexoEfetivoCNAE(empresa.cnae, null, fatorResult.fatorR);

  // ▸ 4. ELEGIBILIDADE
  log('▸ 4. ELEGIBILIDADE');
  log(sep2);
  const elegResult = verificarElegibilidade({
    receitaBrutaAnual: empresa.receitaBrutaAnual,
    receitaBrutaAnualAnterior: empresa.receitaBrutaAnual,
    cnae: empresa.cnae, fatorR: fatorResult.fatorR
  });
  log(`  Elegível:      ${elegResult.elegivel ? '✅ SIM' : '❌ NÃO'}`);
  log(`  Classificação: ${elegResult.classificacao}`);
  log(`  Impedimentos:  ${elegResult.impedimentos.length === 0 ? 'Nenhum' : elegResult.impedimentos.map(i => i.descricao).join('; ')}`);
  log('');

  // ▸ 5. DAS MENSAL — SEM OTIMIZAÇÃO
  log('▸ 5. DAS MENSAL — SEM OTIMIZAÇÃO');
  log(sep2);
  const dasSemOtim = calcularDASMensal({
    receitaBrutaMensal: empresa.receitaBrutaMensal,
    rbt12: empresa.receitaBrutaAnual,
    anexo
  });
  log(`  Alíquota Efetiva: ${dasSemOtim.aliquotaEfetivaFormatada}`);
  log(`  DAS Mensal:       ${_fmtBRL(dasSemOtim.dasValor)}`);
  log(`  Total a Pagar:    ${_fmtBRL(dasSemOtim.totalAPagar)}`);
  log('');

  // ▸ 6. DAS MENSAL — COM OTIMIZAÇÃO ★
  log('▸ 6. DAS MENSAL — COM OTIMIZAÇÃO ★ (IMPOST.)');
  log(sep2);
  try {
    const dasOtim = calcularDASMensalOtimizado({
      receitaBrutaMensal: empresa.receitaBrutaMensal,
      rbt12: empresa.receitaBrutaAnual,
      anexo,
      cnae: empresa.cnae,
      uf: empresa.uf,
      municipio: empresa.municipio,
      receitaMonofasica: empresa.receitaMonofasica || 0,
      receitaICMS_ST: empresa.receitaICMS_ST || 0,
      receitaExportacao: empresa.receitaExportacao || 0,
      receitaLocacaoBensMoveis: empresa.receitaLocacaoBensMoveis || 0,
      issRetidoFonte: empresa.issRetidoFonte || 0,
      folhaMensal: empresa.folhaMensal
    });

    log(`  DAS sem Otimização:  ${_fmtBRL(dasOtim.dasSemOtimizacao)}`);
    log(`  DAS Otimizado:       ${_fmtBRL(dasOtim.dasOtimizado)}`);
    log(`  Total a Pagar:       ${_fmtBRL(dasOtim.totalAPagar)}`);
    log('');

    // ▸ 7. ECONOMIA IMEDIATA ★
    log('▸ 7. ECONOMIA IMEDIATA ★');
    log(sep2);
    log(`  Economia Mensal: ${_fmtBRL(dasOtim.economiaTotal)}`);
    log(`  Economia Anual:  ${_fmtBRL(dasOtim.economiaTotal * 12)}`);
    if (dasOtim.deducoes.length > 0) {
      log('  Deduções aplicadas:');
      dasOtim.deducoes.forEach((d, i) => {
        log(`    ${i + 1}. ${d.descricao}: ${_fmtBRL(d.economia)}`);
        log(`       Base legal: ${d.baseLegal}`);
      });
    } else {
      log('  Nenhuma dedução aplicável neste cenário.');
    }
    if (dasOtim.alertas.length > 0) {
      log('  Alertas:');
      dasOtim.alertas.forEach(a => log(`    ${a.mensagem}`));
    }
    log('');

    // ▸ 8. PARTILHA DE TRIBUTOS (otimizada)
    log('▸ 8. PARTILHA DE TRIBUTOS (otimizada)');
    log(sep2);
    const pOtim = dasOtim.partilha;
    const tributosList = ['irpj', 'csll', 'cofins', 'pis', 'cpp', 'iss', 'icms', 'ipi'];
    for (const t of tributosList) {
      if (pOtim[t] && pOtim[t].valor > 0) {
        log(`  ${t.toUpperCase().padEnd(8)} ${pOtim[t].percentualFormatado.padStart(8)}  →  ${_fmtBRL(pOtim[t].valor).padStart(14)}`);
      }
    }
    log('');
  } catch (e) {
    log(`  ⚠️ Erro na otimização: ${e.message}`);
    log('');
  }

  // ▸ 9. OTIMIZAÇÃO FATOR "r" ★ (se aplicável)
  if (anexo === 'V') {
    log('▸ 9. OTIMIZAÇÃO FATOR "r" ★');
    log(sep2);
    try {
      const otimFR = otimizarFatorR({
        rbt12: empresa.receitaBrutaAnual,
        folhaAtual12Meses: empresa.folhaAnual,
        receitaMensal: empresa.receitaBrutaMensal,
        cnae: empresa.cnae
      });
      log(`  Fator R Atual:   ${otimFR.fatorRAtualFormatado}`);
      log(`  Anexo Atual:     ${otimFR.anexoAtual}`);
      log(`  Aumento Mensal Necessário: ${_fmtBRL(otimFR.aumentoMensalNecessario)}`);
      log(`  Custo do Aumento Anual:    ${_fmtBRL(otimFR.custoAumentoAnual)}`);
      log(`  Economia DAS Anual:        ${_fmtBRL(otimFR.economiaDASAnual)}`);
      log(`  Economia Líquida Anual:    ${_fmtBRL(otimFR.economiaLiquida)}`);
      log(`  Vale a pena? ${otimFR.vale_a_pena ? '✅ SIM' : '❌ NÃO'}`);
    } catch (e) {
      log(`  ⚠️ Erro: ${e.message}`);
    }
    log('');
  } else {
    log('▸ 9. OTIMIZAÇÃO FATOR "r" — Não aplicável (empresa já no Anexo III)');
    log('');
  }

  // ▸ 10. CONSOLIDAÇÃO ANUAL
  log('▸ 10. CONSOLIDAÇÃO ANUAL');
  log(sep2);
  const mesesUniformes = Array.from({ length: 12 }, () => ({
    receitaBrutaMensal: empresa.receitaBrutaMensal,
    rbt12: empresa.receitaBrutaAnual,
    folhaSalarios12Meses: empresa.folhaAnual,
    anexo,
    folhaMensal: empresa.folhaMensal,
    issRetidoFonte: 0
  }));
  const anualResult = calcularAnualConsolidado({
    meses: mesesUniformes,
    socios: empresa.socios,
    cnae: empresa.cnae,
    tipoAtividade: 'servico',
    aliquotaRAT: ALIQUOTA_RAT_PADRAO
  });
  log(`  Receita Bruta Anual:     ${_fmtBRL(anualResult.receitaBrutaAnual)}`);
  log(`  DAS Anual:               ${_fmtBRL(anualResult.dasAnual)}`);
  log(`  Carga Tributária Total:  ${_fmtBRL(anualResult.cargaTributariaTotal)}`);
  log(`  % sobre Receita:         ${anualResult.percentualCargaFormatado}`);
  log('');

  // ▸ 11. DISTRIBUIÇÃO DE LUCROS
  log('▸ 11. DISTRIBUIÇÃO DE LUCROS');
  log(sep2);
  const distLucros = anualResult.distribuicaoLucros;
  if (distLucros) {
    log(`  Modalidade:         ${distLucros.modalidadeUtilizada}`);
    log(`  Lucro Distribuível: ${_fmtBRL(distLucros.lucroDistribuivelFinal)}`);
    if (distLucros.porSocio) {
      log('  Por Sócio:');
      for (const socio of distLucros.porSocio) {
        log(`    ${socio.nome} (${socio.percentualFormatado}): ${socio.valorIsentoFormatado}`);
      }
    }
  }
  log('');

  // ▸ 12. COMPARATIVO DE REGIMES ★ (completo com dados reais)
  log('▸ 12. COMPARATIVO DE REGIMES ★');
  log(sep2);
  try {
    const comp = compararRegimesCompleto({
      receitaBrutaAnual: empresa.receitaBrutaAnual,
      folhaAnual: empresa.folhaAnual,
      cnae: empresa.cnae,
      uf: empresa.uf,
      municipio: empresa.municipio,
      fatorR: fatorResult.fatorR,
      despesasOperacionais: empresa.despesasOperacionais,
      socios: empresa.socios
    });
    if (comp.regimes) {
      for (const r of comp.regimes) {
        const marker = r.melhorOpcao ? '🏆' : '  ';
        log(`  ${marker} #${r.ranking} ${r.regime.padEnd(28)} Carga: ${_fmtBRL(r.cargaTotal).padStart(14)} (${r.percentualCargaFormatado})`);
      }
      log('');
      log(`  Presunção IRPJ: ${((comp.presuncaoIRPJ || 0.32) * 100).toFixed(0)}% | CSLL: ${((comp.presuncaoCSLL || 0.32) * 100).toFixed(0)}%`);
      if (comp.incentivos && (comp.incentivos.sudam || comp.incentivos.sudene || comp.incentivos.zfm)) {
        log(`  🌿 Incentivos: ${comp.incentivos.sudam ? 'SUDAM' : ''} ${comp.incentivos.sudene ? 'SUDENE' : ''} ${comp.incentivos.zfm ? 'ZFM' : ''} — Redução IRPJ: ${(comp.incentivos.reducaoIRPJ * 100).toFixed(0)}%`);
      }
      log(`  📊 ${comp.recomendacao}`);
    }
  } catch (e) {
    log(`  ⚠️ Erro: ${e.message}`);
  }
  log('');

  // ▸ 13. ESTRATÉGIAS DE ECONOMIA ★
  log('▸ 13. ESTRATÉGIAS DE ECONOMIA');
  log(sep2);
  const estrategiasTop = ESTRATEGIAS_MENOR_IMPOSTO.slice(0, 5);
  estrategiasTop.forEach((e, i) => {
    log(`  ${i + 1}. [${(e.impacto || 'médio').toUpperCase()}] ${e.titulo || e.nome || e.descricao}`);
  });
  log('');

  // ▸ 14. RISCOS FISCAIS
  log('▸ 14. RISCOS FISCAIS (Alta/Crítica)');
  log(sep2);
  RISCOS_FISCAIS
    .filter(r => ['critica', 'alta'].includes(r.gravidade))
    .slice(0, 5)
    .forEach((r, i) => {
      log(`  ${i + 1}. [${r.gravidade.toUpperCase()}] ${r.titulo}`);
    });
  log('');

  // ▸ 15. RECOMENDAÇÃO FINAL
  log('▸ 15. RECOMENDAÇÃO FINAL');
  log(sep2);
  log('');
  log('  ╔══════════════════════════════════════════════════════════════════╗');
  log('  ║  IMPOST. — Relatório de Otimização Tributária Concluído         ║');
  log('  ╚══════════════════════════════════════════════════════════════════╝');
  log('');
  log(`  Empresa:           ${empresa.nome}`);
  log(`  Receita Anual:     ${_fmtBRL(empresa.receitaBrutaAnual)}`);
  log(`  Regime Atual:      Simples Nacional — Anexo ${anexo}`);
  log(`  Alíquota Efetiva:  ${dasSemOtim.aliquotaEfetivaFormatada}`);
  log(`  Carga Anual:       ${_fmtBRL(anualResult.cargaTributariaTotal)} (${anualResult.percentualCargaFormatado})`);
  log('');
  log('  Use gerarRelatorioOtimizacao() para o relatório completo SaaS.');
  log('');
  log(sep);
  log(' IMPOST. v4.0 — Porque pagar imposto certo é direito.');
  log('                 Pagar menos, legalmente, é inteligência.');
  log(sep);
  log('');
}

// Executar demonstração se chamado diretamente
if (typeof require !== 'undefined' && require.main === module) {
  executarDemonstracao();
} else if (typeof process !== 'undefined' && process.argv && process.argv[1] &&
           process.argv[1].endsWith('simples_nacional.js')) {
  executarDemonstracao();
}