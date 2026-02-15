/**
 * ================================================================================
 * MOTOR DE CÁLCULO FISCAL — SIMPLES NACIONAL v2.0
 * ================================================================================
 *
 * Módulo completo de cálculo fiscal do Simples Nacional brasileiro.
 * Parte de um sistema maior que compara 3 regimes tributários:
 * Simples Nacional, Lucro Presumido e Lucro Real.
 *
 * @author      AGROGEO BRASIL — Geotecnologia e Consultoria Ambiental
 * @version     2.0.0
 * @date        2026-02-11
 * @license     Proprietary
 *
 * Base Legal Principal:
 *   - Lei Complementar 123/2006 (Estatuto Nacional da ME e EPP)
 *   - Lei Complementar 155/2016 (Alterações LC 123)
 *   - Resolução CGSN nº 140/2018 (Regulamentação completa)
 *   - Lei Complementar 224/2025 (Reforma Tributária — impactos futuros)
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
    // Faixa 1
    { irpj: 0.1410, csll: 0.1240, cofins: 0.1410, pis: 0.0305, cpp: 0.2885, iss: 0.1410 },  // VERIFICAR: extraído de fonte secundária, soma ~86,6%
    // Faixa 2
    { irpj: 0.1410, csll: 0.1240, cofins: 0.1410, pis: 0.0305, cpp: 0.2885, iss: 0.1410 },
    // Faixa 3
    { irpj: 0.1410, csll: 0.1240, cofins: 0.1410, pis: 0.0305, cpp: 0.2885, iss: 0.1410 },
    // Faixa 4
    { irpj: 0.1410, csll: 0.1240, cofins: 0.1410, pis: 0.0305, cpp: 0.2885, iss: 0.1410 },
    // Faixa 5
    { irpj: 0.1410, csll: 0.1240, cofins: 0.1410, pis: 0.0305, cpp: 0.2885, iss: 0.1410 },
    // Faixa 6
    { irpj: 0.1410, csll: 0.1240, cofins: 0.1410, pis: 0.0305, cpp: 0.2885, iss: 0.1410 }
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
    cnae: '71.19-7', // Default AGROGEO
    lucroContabilEfetivo,
    tipoAtividade: 'servicos'
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
    cnae = '71.19-7',
    lucroContabilEfetivo = null,
    tipoAtividade = 'servicos'
  } = params;

  // Determinar percentual de presunção
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
// SEÇÃO 20: EXPORTAÇÕES (CommonJS + ESM + globalThis)
// ================================================================================

/**
 * Objeto principal de exportação do módulo.
 */
const SimplesNacional = {
  // Constantes
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

  // Tabelas
  ANEXOS,
  PARTILHA,
  MAPEAMENTO_CNAE,
  VEDACOES,
  OBRIGACOES_ACESSORIAS,
  RISCOS_FISCAIS,
  TRANSICOES,

  // Funções de cálculo
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

  // Funções auxiliares
  getAnexosDisponiveis,
  getFaixaByRBT12,
  calcularRBT12Proporcional,
  validarDadosEntrada,
  formatarResultadoTexto,
  _arredondar,
  _formatarMoeda: _fmtBRL
};

// CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SimplesNacional;
}

// ESM / Browser
if (typeof globalThis !== 'undefined') {
  globalThis.SimplesNacional = SimplesNacional;
}


// ================================================================================
// SEÇÃO 21: DEMONSTRAÇÃO (executar com `node simples_nacional.js`)
// ================================================================================

/**
 * Execução de demonstração quando rodado diretamente via Node.js.
 * Utiliza dados da empresa AGROGEO BRASIL como referência.
 */
function executarDemonstracao() {
  const sep = '═'.repeat(64);
  const sep2 = '─'.repeat(64);

  console.log('');
  console.log('╔' + sep + '╗');
  console.log('║   MOTOR DE CÁLCULO FISCAL — SIMPLES NACIONAL v2.0' + ' '.repeat(13) + '║');
  console.log('║   AGROGEO BRASIL — Geotecnologia e Consultoria Ambiental' + ' '.repeat(5) + '║');
  console.log('╚' + sep + '╝');
  console.log('');

  // Dados da AGROGEO BRASIL
  const AGROGEO = {
    nome: 'AGROGEO BRASIL',
    cnae: '71.19-7',
    localizacao: 'Novo Progresso, Pará (Amazônia Legal — SUDAM)',
    receitaBrutaAnual: 2_350_000.00,
    receitaBrutaMensal: 2_350_000 / 12,
    folhaAnual: 1_000_000.00,
    folhaMensal: 1_000_000 / 12,
    socios: [
      { nome: 'Sócio 1 (Majoritário)', percentual: 0.65 },
      { nome: 'Sócio 2 (Minoritário)', percentual: 0.35 }
    ],
    despesasOperacionais: 800_000.00
  };

  // ▸ 1. IDENTIFICAÇÃO POR CNAE
  console.log('▸ 1. IDENTIFICAÇÃO POR CNAE');
  console.log(sep2);
  const cnaeResult = determinarAnexo({ cnae: AGROGEO.cnae, fatorR: AGROGEO.folhaAnual / AGROGEO.receitaBrutaAnual });
  console.log(`  CNAE: ${cnaeResult.cnae} — ${cnaeResult.descricao}`);
  console.log(`  Tipo: ${cnaeResult.tipo}`);
  console.log(`  Anexo Determinado: ${cnaeResult.anexo} (${cnaeResult.descricaoAnexo})`);
  console.log(`  CPP Incluída no DAS: ${cnaeResult.cppInclusa ? 'SIM' : 'NÃO'}`);
  console.log(`  Tributos no DAS: ${cnaeResult.tributosDentro.join(', ')}`);
  console.log(`  Motivo: ${cnaeResult.motivoAnexo}`);
  console.log('');

  // ▸ 2. FATOR "r"
  console.log('▸ 2. FATOR "r"');
  console.log(sep2);
  const fatorResult = calcularFatorR({
    folhaSalarios12Meses: AGROGEO.folhaAnual,
    receitaBruta12Meses: AGROGEO.receitaBrutaAnual
  });
  console.log(`  Folha de Salários (12 meses): ${_fmtBRL(fatorResult.folhaSalarios12Meses)}`);
  console.log(`  Receita Bruta (12 meses):     ${_fmtBRL(fatorResult.receitaBruta12Meses)}`);
  console.log(`  Fator "r":                     ${fatorResult.fatorRPercentual}`);
  console.log(`  Limiar:                        ${fatorResult.limiarPercentual}`);
  console.log(`  Acima do Limiar:               ${fatorResult.acimaDoLimiar ? 'SIM' : 'NÃO'}`);
  console.log(`  Anexo Resultante:              ${fatorResult.anexoResultante}`);
  console.log(`  ${fatorResult.observacao}`);
  console.log('');

  // ▸ 3. ELEGIBILIDADE
  console.log('▸ 3. ELEGIBILIDADE');
  console.log(sep2);
  const elegResult = verificarElegibilidade({
    receitaBrutaAnual: AGROGEO.receitaBrutaAnual,
    receitaBrutaAnualAnterior: AGROGEO.receitaBrutaAnual,
    cnae: AGROGEO.cnae,
    naturezaJuridica: 'LTDA',
    fatorR: fatorResult.fatorR
  });
  console.log(`  Elegível: ${elegResult.elegivel ? '✅ SIM' : '❌ NÃO'}`);
  console.log(`  Classificação: ${elegResult.classificacao}`);
  console.log(`  Impedimentos: ${elegResult.impedimentos.length === 0 ? 'Nenhum' : elegResult.impedimentos.map(i => i.descricao).join('; ')}`);
  if (elegResult.alertas.length > 0) {
    console.log(`  Alertas:`);
    elegResult.alertas.forEach(a => console.log(`    ${a.mensagem}`));
  }
  console.log(`  Sublimite Estadual: ${elegResult.sublimiteEstadual.observacao}`);
  console.log('');

  // ▸ 4. CÁLCULO DAS MENSAL
  console.log('▸ 4. CÁLCULO DAS MENSAL');
  console.log(sep2);
  const dasResult = calcularDASMensal({
    receitaBrutaMensal: AGROGEO.receitaBrutaMensal,
    rbt12: AGROGEO.receitaBrutaAnual,
    anexo: fatorResult.anexoResultante
  });
  console.log(`  Receita Bruta Mensal: ${_fmtBRL(dasResult.receitaBrutaMensal)}`);
  console.log(`  RBT12:                ${_fmtBRL(dasResult.rbt12)}`);
  console.log(`  Anexo:                ${dasResult.anexo} (${dasResult.descricaoAnexo})`);
  console.log(`  Faixa:                ${dasResult.faixaDescricao}`);
  console.log(`  Alíquota Nominal:     ${dasResult.aliquotaNominalFormatada}`);
  console.log(`  Alíquota Efetiva:     ${dasResult.aliquotaEfetivaFormatada}`);
  console.log(`  Valor do DAS:         ${_fmtBRL(dasResult.dasValor)}`);
  console.log(`  DAS a Pagar:          ${_fmtBRL(dasResult.dasAPagar)}`);
  console.log(`  INSS Patronal Fora:   ${_fmtBRL(dasResult.inssPatronalFora)}`);
  console.log(`  TOTAL a Pagar:        ${_fmtBRL(dasResult.totalAPagar)}`);
  console.log('');

  // ▸ 5. PARTILHA DE TRIBUTOS
  console.log('▸ 5. PARTILHA DE TRIBUTOS (mensal)');
  console.log(sep2);
  const p = dasResult.partilha;
  const tributosList = ['irpj', 'csll', 'cofins', 'pis', 'cpp', 'iss', 'icms', 'ipi'];
  for (const t of tributosList) {
    if (p[t] && p[t].valor > 0) {
      console.log(`  ${t.toUpperCase().padEnd(8)} ${p[t].percentualFormatado.padStart(8)}  →  ${_fmtBRL(p[t].valor).padStart(14)}`);
    }
  }
  console.log(`  ${'TOTAL'.padEnd(8)} ${''.padStart(8)}     ${_fmtBRL(dasResult.dasValor).padStart(14)}`);
  console.log('');

  // ▸ 6. CONSOLIDAÇÃO ANUAL
  console.log('▸ 6. CONSOLIDAÇÃO ANUAL');
  console.log(sep2);
  // Gerar 12 meses uniformes
  const mesesUniformes = Array.from({ length: 12 }, () => ({
    receitaBrutaMensal: AGROGEO.receitaBrutaMensal,
    rbt12: AGROGEO.receitaBrutaAnual,
    folhaSalarios12Meses: AGROGEO.folhaAnual,
    anexo: fatorResult.anexoResultante,
    folhaMensal: AGROGEO.folhaMensal,
    issRetidoFonte: 0
  }));

  const anualResult = calcularAnualConsolidado({
    meses: mesesUniformes,
    socios: AGROGEO.socios,
    aliquotaRAT: ALIQUOTA_RAT_PADRAO
  });

  console.log(`  Receita Bruta Anual:     ${_fmtBRL(anualResult.receitaBrutaAnual)}`);
  console.log(`  DAS Anual:               ${_fmtBRL(anualResult.dasAnual)}`);
  console.log(`  INSS Patronal Fora:      ${_fmtBRL(anualResult.inssPatronalAnualFora)}`);
  console.log(`  FGTS Anual:              ${_fmtBRL(anualResult.fgtsAnual)}`);
  console.log(`  Carga Tributária Total:  ${_fmtBRL(anualResult.cargaTributariaTotal)}`);
  console.log(`  Percentual sobre Receita: ${anualResult.percentualCargaFormatado}`);
  console.log('');
  console.log('  Partilha Anual de Tributos:');
  for (const [tributo, valor] of Object.entries(anualResult.partilhaAnual)) {
    if (valor > 0) {
      console.log(`    ${tributo.toUpperCase().padEnd(8)} ${_fmtBRL(valor).padStart(14)}`);
    }
  }
  console.log('');

  // ▸ 7. DISTRIBUIÇÃO DE LUCROS
  console.log('▸ 7. DISTRIBUIÇÃO DE LUCROS');
  console.log(sep2);
  const distLucros = anualResult.distribuicaoLucros;
  console.log(`  Modalidade:          ${distLucros.modalidadeUtilizada}`);
  console.log(`  Presunção (32%):     ${_fmtBRL(distLucros.basePresumida)}`);
  console.log(`  DAS Anual:           ${_fmtBRL(distLucros.dasAnual)}`);
  console.log(`  Lucro Distribuível:  ${_fmtBRL(distLucros.lucroDistribuivelFinal)}`);
  console.log('');
  console.log('  Por Sócio:');
  for (const socio of distLucros.porSocio) {
    console.log(`    ${socio.nome} (${socio.percentualFormatado}): ${socio.valorIsentoFormatado}`);
  }
  console.log('');

  // ▸ 8. COMPARATIVO DE REGIMES
  console.log('▸ 8. COMPARATIVO DE REGIMES');
  console.log(sep2);
  const comparativo = compararComOutrosRegimes({
    receitaBrutaAnual: AGROGEO.receitaBrutaAnual,
    folhaAnual: AGROGEO.folhaAnual,
    cnae: AGROGEO.cnae,
    fatorR: fatorResult.fatorR,
    anexo: fatorResult.anexoResultante,
    despesasOperacionais: AGROGEO.despesasOperacionais,
    temSUDAM: true
  });

  for (const r of comparativo.regimes) {
    const marker = r.melhorOpcao ? '🏆' : '  ';
    console.log(`  ${marker} #${r.ranking} ${r.regime.padEnd(28)} Carga: ${_fmtBRL(r.cargaTotal).padStart(14)} (${r.percentualCargaFormatado})`);
  }
  console.log('');
  console.log(`  📊 ${comparativo.recomendacao}`);
  console.log('');

  // ▸ 9. VANTAGENS E DESVANTAGENS
  console.log('▸ 9. VANTAGENS E DESVANTAGENS');
  console.log(sep2);
  const vd = analisarVantagensDesvantagens({
    receitaBrutaAnual: AGROGEO.receitaBrutaAnual,
    anexo: fatorResult.anexoResultante,
    fatorR: fatorResult.fatorR,
    localizacaoSUDAM: true,
    vendeParaPJ: true,
    folhaAnual: AGROGEO.folhaAnual
  });

  console.log('  VANTAGENS APLICÁVEIS:');
  vd.vantagens.filter(v => v.aplicavel).forEach((v, i) => {
    console.log(`    ${i + 1}. [${v.impacto.toUpperCase()}] ${v.titulo}`);
  });
  console.log('');
  console.log('  DESVANTAGENS APLICÁVEIS:');
  vd.desvantagens.filter(d => d.aplicavel).forEach((d, i) => {
    console.log(`    ${i + 1}. [${d.impacto.toUpperCase()}] ${d.titulo}`);
  });
  console.log('');

  // ▸ 10. RISCOS FISCAIS
  console.log('▸ 10. RISCOS FISCAIS (Alta e Crítica Gravidade)');
  console.log(sep2);
  RISCOS_FISCAIS
    .filter(r => ['critica', 'alta'].includes(r.gravidade))
    .forEach((r, i) => {
      console.log(`    ${i + 1}. [${r.gravidade.toUpperCase()}] ${r.titulo}`);
      console.log(`       ${r.descricao}`);
      console.log(`       Prevenção: ${r.prevencao}`);
      console.log('');
    });

  // ▸ 11. RECOMENDAÇÃO
  console.log('▸ 11. RECOMENDAÇÃO FINAL');
  console.log(sep2);
  console.log('');
  console.log('  ╔══════════════════════════════════════════════════════════╗');
  console.log('  ║  RECOMENDAÇÃO: PERMANECER NO SIMPLES NACIONAL          ║');
  console.log('  ╚══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`  O Simples Nacional (Anexo III) é o regime mais vantajoso para a`);
  console.log(`  AGROGEO BRASIL nas condições atuais:`);
  console.log(`    • Alíquota efetiva: ${dasResult.aliquotaEfetivaFormatada}`);
  console.log(`    • Carga anual: ${_fmtBRL(anualResult.cargaTributariaTotal)} (${anualResult.percentualCargaFormatado})`);
  console.log(`    • Economia vs Lucro Presumido: ${comparativo.economiaFormatada}`);
  console.log('');
  console.log('  PONTOS DE ATENÇÃO:');
  console.log('    1. Monitorar Fator "r" mensalmente (manter acima de 28%)');
  console.log('    2. Se faturamento se aproximar de R$ 4,8M, planejar transição');
  console.log('    3. Considerar Lucro Real + SUDAM se receita crescer acima de R$ 4,4M');
  console.log('    4. Manter escrituração contábil para otimizar distribuição de lucros');
  console.log('');
  console.log(sep);
  console.log(' FIM DA DEMONSTRAÇÃO — Simples Nacional v2.0');
  console.log(sep);
  console.log('');
}

// Executar demonstração se chamado diretamente
if (typeof require !== 'undefined' && require.main === module) {
  executarDemonstracao();
} else if (typeof process !== 'undefined' && process.argv && process.argv[1] &&
           process.argv[1].endsWith('simples_nacional.js')) {
  executarDemonstracao();
}
