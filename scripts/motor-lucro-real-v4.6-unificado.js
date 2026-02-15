/**
 * ============================================================================
 * MOTOR DE CÁLCULO UNIFICADO — LUCRO REAL (IRPJ + CSLL)  v4.6
 * Base Legal: Decreto nº 9.580/2018 (RIR/2018) — Artigos 217 a 290+
 * Ano-Base: 2026
 * ============================================================================
 *
 * ARQUIVO CONSOLIDADO — Contém todos os módulos:
 *   • Motor Principal (IRPJ/CSLL, Estimativa, JCP, PIS/COFINS)
 *   • Bloco A — Compensação de Prejuízos Fiscais (Art. 580-590)
 *   • Bloco D — Despesas Dedutíveis, PDD, Depreciação (Art. 311-365)
 *   • Bloco D2 — Valor Justo, MEP, Operações Exterior (CPC 18/46/02)
 *   • Bloco E — Lucro da Exploração SUDAM/SUDENE (Art. 615-627)
 *   • Bloco G — Retenções na Fonte IRRF/CSRF/ISS (Art. 714-786)
 *
 * INSTRUÇÕES:
 *   1. Arquivo único — basta importar: const motor = require('./motor-lucro-real-v4.6');
 *   2. Cada função documenta o artigo do RIR/2018 que a fundamenta
 *   3. Valores monetários em R$ (reais); taxas em decimal (0.15 = 15%)
 *   4. Todas as funções públicas exportadas no final do arquivo
 *
 * TOTAL DE FUNÇÕES: 71
 * ============================================================================
 */

'use strict';


// ============================================================================
// BLOCO 1 — CONSTANTES E ALÍQUOTAS
// ============================================================================

const CONSTANTES = {
  // --- IRPJ ---
  IRPJ_ALIQUOTA_NORMAL: 0.15,           // Art. 225: 15%
  IRPJ_ALIQUOTA_ADICIONAL: 0.10,        // Art. 225, parágrafo único: 10%
  IRPJ_LIMITE_ADICIONAL_MES: 20000.00,  // Art. 225, parágrafo único: R$ 20.000/mês
  IRPJ_LIMITE_ADICIONAL_TRIMESTRE: 60000.00,  // R$ 60.000/trimestre
  IRPJ_LIMITE_ADICIONAL_ANO: 240000.00, // R$ 240.000/ano

  // --- CSLL ---
  CSLL_ALIQUOTA_GERAL: 0.09,            // 9% para empresas em geral
  CSLL_ALIQUOTA_FINANCEIRAS: 0.15,      // 15% para instituições financeiras

  // --- Compensação de Prejuízos ---
  TRAVA_COMPENSACAO_PREJUIZO: 0.30,     // Art. 261, III: 30%

  // --- PIS/COFINS Não-Cumulativo ---
  PIS_ALIQUOTA: 0.0165,                 // 1,65%
  COFINS_ALIQUOTA: 0.076,               // 7,6%
  PIS_COFINS_TOTAL: 0.0925,             // 9,25%

  // --- JCP ---
  JCP_IRRF_ALIQUOTA: 0.15,              // 15% IRRF sobre JCP
  JCP_LIMITE_LUCRO_LIQUIDO: 0.50,       // 50% do lucro líquido
  JCP_LIMITE_LUCROS_ACUMULADOS: 0.50,   // 50% de lucros acumulados + reservas

  // --- Limites de Obrigatoriedade ---
  LIMITE_RECEITA_LUCRO_REAL: 78000000.00, // Art. 257, I: R$ 78 milhões

  // --- Períodos Trimestrais ---
  TRIMESTRES: [
    { numero: 1, inicio: '01-01', fim: '03-31', meses: 3 },
    { numero: 2, inicio: '04-01', fim: '06-30', meses: 3 },
    { numero: 3, inicio: '07-01', fim: '09-30', meses: 3 },
    { numero: 4, inicio: '10-01', fim: '12-31', meses: 3 },
  ],
};

// ============================================================================
// BLOCO 2 — PERCENTUAIS DE PRESUNÇÃO PARA ESTIMATIVA MENSAL
// Base Legal: Art. 220 (IRPJ) + Art. 15 Lei 9.249/95
// ============================================================================

const PRESUNCOES = {
  /**
   * Cada atividade tem:
   *   irpj: percentual de presunção para IRPJ
   *   csll: percentual de presunção para CSLL (Lei 9.249/95, Art. 20)
   *   artigo: fundamentação legal
   */
  COMERCIO_INDUSTRIA: {
    irpj: 0.08,
    csll: 0.12,
    artigo: 'Art. 220, caput',
    descricao: 'Comércio, indústria, transporte de carga',
    aliquotaEfetivaIRPJ: 0.08 * 0.15, // 1,20%
    aliquotaEfetivaCSLL: 0.12 * 0.09, // 1,08%
  },
  REVENDA_COMBUSTIVEIS: {
    irpj: 0.016,
    csll: 0.12,
    artigo: 'Art. 220, §1º, I',
    descricao: 'Revenda de combustível derivado de petróleo, álcool, gás natural',
    aliquotaEfetivaIRPJ: 0.016 * 0.15, // 0,24%
    aliquotaEfetivaCSLL: 0.12 * 0.09,
  },
  TRANSPORTE_PASSAGEIROS: {
    irpj: 0.16,
    csll: 0.12,
    artigo: 'Art. 220, §1º, II, a',
    descricao: 'Transporte de passageiros',
    aliquotaEfetivaIRPJ: 0.16 * 0.15, // 2,40%
    aliquotaEfetivaCSLL: 0.12 * 0.09,
  },
  INSTITUICOES_FINANCEIRAS: {
    irpj: 0.16,
    csll: 0.12,
    artigo: 'Art. 220, §1º, II, b + Art. 223',
    descricao: 'Bancos, financeiras, seguradoras, etc.',
    aliquotaEfetivaIRPJ: 0.16 * 0.15,
    aliquotaEfetivaCSLL: 0.12 * 0.09,
  },
  SERVICOS_GERAL: {
    irpj: 0.32,
    csll: 0.32,
    artigo: 'Art. 220, §1º, III, a',
    descricao: 'Prestação de serviços em geral',
    aliquotaEfetivaIRPJ: 0.32 * 0.15, // 4,80%
    aliquotaEfetivaCSLL: 0.32 * 0.09, // 2,88%
  },
  SERVICOS_HOSPITALARES: {
    irpj: 0.08,
    csll: 0.12,
    artigo: 'Art. 220, §2º (exceção do §1º, III, a)',
    descricao: 'Serviços hospitalares (sociedade empresária + normas ANVISA)',
    aliquotaEfetivaIRPJ: 0.08 * 0.15,
    aliquotaEfetivaCSLL: 0.12 * 0.09,
    requisitos: ['Sociedade empresária', 'Atender normas ANVISA'],
  },
  INTERMEDIACAO_NEGOCIOS: {
    irpj: 0.32,
    csll: 0.32,
    artigo: 'Art. 220, §1º, III, b',
    descricao: 'Intermediação de negócios',
    aliquotaEfetivaIRPJ: 0.32 * 0.15,
    aliquotaEfetivaCSLL: 0.32 * 0.09,
  },
  ADMINISTRACAO_LOCACAO: {
    irpj: 0.32,
    csll: 0.32,
    artigo: 'Art. 220, §1º, III, c',
    descricao: 'Administração, locação ou cessão de bens e direitos',
    aliquotaEfetivaIRPJ: 0.32 * 0.15,
    aliquotaEfetivaCSLL: 0.32 * 0.09,
  },
  FACTORING: {
    irpj: 0.32,
    csll: 0.32,
    artigo: 'Art. 220, §1º, III, d',
    descricao: 'Factoring, assessoria creditícia',
    aliquotaEfetivaIRPJ: 0.32 * 0.15,
    aliquotaEfetivaCSLL: 0.32 * 0.09,
  },
  CONSTRUCAO_CONCESSAO: {
    irpj: 0.32,
    csll: 0.32,
    artigo: 'Art. 220, §1º, III, e',
    descricao: 'Construção vinculada a concessão de serviço público',
    aliquotaEfetivaIRPJ: 0.32 * 0.15,
    aliquotaEfetivaCSLL: 0.32 * 0.09,
  },
  SERVICOS_ATE_120K: {
    irpj: 0.16,
    csll: 0.32,
    artigo: 'Art. 220, §4º',
    descricao: 'Serviços em geral com receita bruta anual até R$ 120.000',
    aliquotaEfetivaIRPJ: 0.16 * 0.15,
    aliquotaEfetivaCSLL: 0.32 * 0.09,
    requisitos: [
      'Receita bruta anual <= R$ 120.000',
      'Não se aplica a serviços hospitalares',
      'Não se aplica a profissões regulamentadas (Art. 220 §5º, II)',
    ],
  },
  ATIVIDADE_IMOBILIARIA: {
    irpj: 0.08,
    csll: 0.12,
    artigo: 'Art. 220, §7º + Art. 224',
    descricao: 'Loteamento, incorporação, construção p/ venda',
    aliquotaEfetivaIRPJ: 0.08 * 0.15,
    aliquotaEfetivaCSLL: 0.12 * 0.09,
    nota: 'Receita = montante efetivamente recebido (regime de caixa)',
  },
  TRANSPORTE_CARGA: {
    irpj: 0.08,
    csll: 0.12,
    artigo: 'Art. 220, caput',
    descricao: 'Transporte de carga',
    aliquotaEfetivaIRPJ: 0.08 * 0.15,
    aliquotaEfetivaCSLL: 0.12 * 0.09,
  },
};

// ============================================================================
// BLOCO 3 — ADIÇÕES AO LUCRO LÍQUIDO (Art. 260)
// Tipo: T = temporária, D = definitiva, C = condicional
// ============================================================================

const ADICOES = [
  {
    id: 1,
    descricao: 'Custos/despesas/encargos não dedutíveis',
    artigo: 'Art. 260, I',
    tipo: 'D',
    operacao: '+',
    estrategia: 'Revisar classificação contábil; reclassificar se possível',
  },
  {
    id: 2,
    descricao: 'Resultados/receitas não incluídos no lucro líquido mas tributáveis',
    artigo: 'Art. 260, II',
    tipo: 'D',
    operacao: '+',
    estrategia: 'Garantir que todas as receitas estejam na contabilidade',
  },
  {
    id: 3,
    descricao: 'Quantias retiradas de lucros/fundos não tributados p/ aumento de capital',
    artigo: 'Art. 260, parágrafo único, I',
    tipo: 'D',
    operacao: '+',
    estrategia: 'Planejar distribuição de lucros tributados',
  },
  {
    id: 4,
    descricao: 'Pagamentos a sociedade simples controlada por diretores/parentes',
    artigo: 'Art. 260, parágrafo único, II',
    tipo: 'D',
    operacao: '+',
    estrategia: 'Evitar pagamentos a sociedades controladas por diretores',
  },
  {
    id: 5,
    descricao: 'Perdas em operações day-trade',
    artigo: 'Art. 260, parágrafo único, III',
    tipo: 'C',
    operacao: '+',
    estrategia: 'Compensar apenas com ganhos de day-trade (Art. 261, IV)',
  },
  {
    id: 6,
    descricao: 'Alimentação de sócios, acionistas e administradores',
    artigo: 'Art. 260, parágrafo único, IV (Lei 9.249/95, Art. 13, IV)',
    tipo: 'D',
    operacao: '+',
    estrategia: 'Usar PAT para alimentação dedutível; excluir sócios do benefício',
  },
  {
    id: 7,
    descricao: 'Contribuições não compulsórias (exceto seguro/saúde/previdência)',
    artigo: 'Art. 260, parágrafo único, V (Lei 9.249/95, Art. 13, V)',
    tipo: 'D',
    operacao: '+',
    estrategia: 'Direcionar contribuições para planos de saúde/previdência (dedutíveis)',
  },
  {
    id: 8,
    descricao: 'Doações não enquadradas nos Art. 377 e Art. 385',
    artigo: 'Art. 260, parágrafo único, VI (Lei 9.249/95, Art. 13, VI)',
    tipo: 'D',
    operacao: '+',
    estrategia: 'Doar dentro dos limites legais (até 2% lucro operacional)',
  },
  {
    id: 9,
    descricao: 'Despesas com brindes',
    artigo: 'Art. 260, parágrafo único, VII (Lei 9.249/95, Art. 13, VII)',
    tipo: 'D',
    operacao: '+',
    estrategia: 'Reclassificar como material de propaganda/publicidade se possível',
  },
  {
    id: 10,
    descricao: 'CSLL registrada como despesa operacional',
    artigo: 'Art. 260, parágrafo único, VIII (Lei 9.316/96, Art. 1º)',
    tipo: 'D',
    operacao: '+',
    estrategia: 'Inevitável; CSLL nunca é dedutível do IRPJ',
  },
  {
    id: 11,
    descricao: 'Perdas em renda variável e swap que excedem ganhos',
    artigo: 'Art. 260, parágrafo único, IX (Lei 8.981/95, Art. 76, §4º)',
    tipo: 'T',
    operacao: '+',
    estrategia: 'Controlar na Parte B do LALUR; compensar quando houver ganhos futuros',
  },
  {
    id: 12,
    descricao: 'Receitas de previdência complementar (regime competência vs realização)',
    artigo: 'Art. 260, parágrafo único, X (Lei 11.948/09, Art. 5º)',
    tipo: 'T',
    operacao: '+',
    estrategia: 'Excluir quando da realização (Art. 261, VI)',
  },
  {
    id: 13,
    descricao: 'Resultados negativos de cooperativas com não-associados',
    artigo: 'Art. 260, parágrafo único, XI',
    tipo: 'D',
    operacao: '+',
    estrategia: 'Segregar atos cooperativos dos não-cooperativos',
  },
  {
    id: 14,
    descricao: 'Depreciação/amortização contábil após atingir custo de aquisição',
    artigo: 'Art. 260, parágrafo único, XII',
    tipo: 'D',
    operacao: '+',
    estrategia: 'Controlar depreciação acumulada por bem; não depreciar além do custo',
  },
  {
    id: 15,
    descricao: 'Saldo de depreciação acelerada incentivada na alienação do bem',
    artigo: 'Art. 260, parágrafo único, XIII',
    tipo: 'T',
    operacao: '+',
    estrategia: 'Planejar alienação considerando saldo de depreciação acelerada',
  },
  // --- Adições adicionais comuns (referenciadas em outros artigos do RIR) ---
  {
    id: 16,
    descricao: 'Multas por infrações fiscais (punitivas)',
    artigo: 'Art. 311, §5º',
    tipo: 'D',
    operacao: '+',
    estrategia: 'Evitar multas; distinguir multas compensatórias (dedutíveis) de punitivas',
  },
  {
    id: 17,
    descricao: 'Provisões não dedutíveis (exceto férias, 13º, PDD permitida)',
    artigo: 'Art. 340 a 352',
    tipo: 'T',
    operacao: '+',
    estrategia: 'Reverter quando liquidada → gera exclusão futura',
  },
  {
    id: 18,
    descricao: 'Resultado negativo de equivalência patrimonial',
    artigo: 'Art. 389',
    tipo: 'T',
    operacao: '+',
    estrategia: 'Controlado na Parte B; excluir na realização do investimento',
  },
  {
    id: 19,
    descricao: 'Gratificações a administradores (não dedutíveis)',
    artigo: 'Art. 358, §1º',
    tipo: 'D',
    operacao: '+',
    estrategia: 'Converter em pró-labore (dedutível) ou JCP',
  },
  {
    id: 20,
    descricao: 'Pagamento sem causa / beneficiário não identificado',
    artigo: 'Art. 674',
    tipo: 'D',
    operacao: '+',
    estrategia: 'SEMPRE identificar beneficiário; tributação exclusiva 35%',
  },
  {
    id: 21,
    descricao: 'Excesso de JCP acima dos limites legais',
    artigo: 'Art. 355 a 358',
    tipo: 'D',
    operacao: '+',
    estrategia: 'Calcular JCP dentro dos limites de PL × TJLP e 50% lucro/reservas',
  },
  {
    id: 22,
    descricao: 'Depreciação contábil acima das taxas fiscais',
    artigo: 'Art. 311 a 323',
    tipo: 'T',
    operacao: '+',
    estrategia: 'Usar taxas fiscais = contábeis quando possível; controlar diferença',
  },
  {
    id: 23,
    descricao: 'Despesas com tributos contestados judicialmente (sem depósito)',
    artigo: 'Art. 311, §2º',
    tipo: 'T',
    operacao: '+',
    estrategia: 'Depositar judicialmente o valor integral permite dedução imediata',
  },
  {
    id: 24,
    descricao: 'Royalties pagos acima dos limites a vinculadas',
    artigo: 'Art. 362 a 365',
    tipo: 'D',
    operacao: '+',
    estrategia: 'Respeitar limites de dedutibilidade de royalties',
  },
  {
    id: 25,
    descricao: 'Excesso de preço de transferência (importações de vinculadas)',
    artigo: 'Art. 242, §8º',
    tipo: 'D',
    operacao: '+',
    estrategia: 'Documentar preços com métodos PIC, PRL ou CPL',
  },
  {
    id: 26,
    descricao: 'Juros de subcapitalização acima dos limites',
    artigo: 'Art. 250 a 251',
    tipo: 'D',
    operacao: '+',
    estrategia: 'Manter dívida/PL dentro dos limites (2:1 vinculada; 0.3:1 paraíso)',
  },
  {
    id: 27,
    descricao: 'Despesas não comprovadas ou sem documentação',
    artigo: 'Art. 311',
    tipo: 'D',
    operacao: '+',
    estrategia: 'Sempre manter documentação fiscal completa',
  },
  {
    id: 28,
    descricao: 'Perdas em créditos não enquadradas nos critérios legais',
    artigo: 'Art. 340 a 345',
    tipo: 'D',
    operacao: '+',
    estrategia: 'Enquadrar perdas nos critérios da PDD fiscal',
  },
];

// ============================================================================
// BLOCO 4 — EXCLUSÕES DO LUCRO LÍQUIDO (Art. 261)
// ============================================================================

const EXCLUSOES = [
  {
    id: 1,
    descricao: 'Valores dedutíveis não computados no lucro líquido',
    artigo: 'Art. 261, I',
    tipo: 'D',
    operacao: '-',
    economia: 'Até 25% do valor excluído',
    requisitos: 'Autorizado pelo RIR',
  },
  {
    id: 2,
    descricao: 'Resultados/receitas incluídos no LL mas não tributáveis',
    artigo: 'Art. 261, II',
    tipo: 'D',
    operacao: '-',
    economia: 'Até 25% do valor',
    requisitos: 'Previsto no RIR como não tributável',
  },
  {
    id: 3,
    descricao: 'Compensação de prejuízos fiscais (trava 30%)',
    artigo: 'Art. 261, III',
    tipo: 'D',
    operacao: '-',
    economia: 'Até 25% da compensação (7,5% do lucro ajustado)',
    requisitos: 'Manter livros/documentos comprobatórios; limite 30%',
  },
  {
    id: 4,
    descricao: 'Rendimentos de reforma agrária (desapropriação)',
    artigo: 'Art. 261, parágrafo único, I (CF Art. 184, §5º)',
    tipo: 'D',
    operacao: '-',
    economia: '25% do ganho',
    requisitos: 'Ser desapropriado para fins de reforma agrária',
  },
  {
    id: 5,
    descricao: 'Dividendos do FND',
    artigo: 'Art. 261, parágrafo único, II',
    tipo: 'D',
    operacao: '-',
    economia: '25% dos dividendos',
    requisitos: 'Dividendos anuais mínimos do FND',
  },
  {
    id: 6,
    descricao: 'Juros reais de NTN (PND) — na realização',
    artigo: 'Art. 261, parágrafo único, III',
    tipo: 'T',
    operacao: '-',
    economia: '25% dos juros',
    requisitos: 'Controlar na Parte B do LALUR',
  },
  {
    id: 7,
    descricao: 'Perdas de renda variável/swap adicionadas anteriormente',
    artigo: 'Art. 261, parágrafo único, IV',
    tipo: 'T',
    operacao: '-',
    economia: '25% das perdas recuperadas',
    requisitos: 'Até o limite de ganhos - perdas > 0 no período',
  },
  {
    id: 8,
    descricao: 'Reversão de provisões não dedutíveis',
    artigo: 'Art. 261, parágrafo único, V',
    tipo: 'T',
    operacao: '-',
    economia: '25% da reversão',
    requisitos: 'Provisão deve ter sido adicionada anteriormente',
  },
  {
    id: 9,
    descricao: 'Receitas de previdência complementar (na realização)',
    artigo: 'Art. 261, parágrafo único, VI',
    tipo: 'T',
    operacao: '-',
    economia: '25% do valor',
    requisitos: 'Adicionado anteriormente no regime de competência',
  },
  {
    id: 10,
    descricao: 'Compensação fiscal — horário gratuito rádio/TV',
    artigo: 'Art. 261, parágrafo único, VII',
    tipo: 'D',
    operacao: '-',
    economia: '25% da compensação',
    requisitos: 'Emissoras de rádio/TV obrigadas',
  },
  {
    id: 11,
    descricao: 'Créditos de ICMS/ISS (programas nota fiscal)',
    artigo: 'Art. 261, parágrafo único, VIII',
    tipo: 'D',
    operacao: '-',
    economia: '25% dos créditos',
    requisitos: 'Programas estaduais/municipais de estímulo fiscal',
  },
  {
    id: 12,
    descricao: 'Redução de multas/juros/encargos (REFIS/parcelamentos)',
    artigo: 'Art. 261, parágrafo único, IX (Lei 11.941/09, Art. 4º)',
    tipo: 'D',
    operacao: '-',
    economia: '25% da redução obtida',
    requisitos: 'Adesão ao programa de parcelamento',
  },
  {
    id: 13,
    descricao: 'Quotas de fundo de cobertura de seguro rural',
    artigo: 'Art. 261, parágrafo único, X',
    tipo: 'D',
    operacao: '-',
    economia: '25% das quotas',
    requisitos: 'Seguradoras, resseguradoras, empresas agroindustriais',
  },
  {
    id: 14,
    descricao: 'Crédito presumido IPI — Inovar-Auto',
    artigo: 'Art. 261, parágrafo único, XI',
    tipo: 'D',
    operacao: '-',
    economia: '25% do crédito',
    requisitos: 'Programa Inovar-Auto vigente',
  },
  // --- Exclusões comuns referenciadas em outros artigos ---
  {
    id: 15,
    descricao: 'Resultado positivo de equivalência patrimonial',
    artigo: 'Art. 389 (c/c Art. 261, II)',
    tipo: 'D',
    operacao: '-',
    economia: '25% do resultado MEP positivo',
    requisitos: 'Investimento em controlada/coligada avaliada por MEP',
  },
  {
    id: 16,
    descricao: 'Lucros e dividendos recebidos de PJ brasileira',
    artigo: 'Art. 261, II + Lei 9.249/95, Art. 10',
    tipo: 'D',
    operacao: '-',
    economia: '25% dos dividendos',
    requisitos: 'Dividendos de PJ tributada no Brasil',
    nota: 'ATENÇÃO: Verificar LC 214/2025 — possível tributação de dividendos a partir de 2026',
  },
  {
    id: 17,
    descricao: 'Depreciação acelerada incentivada (SUDAM/SUDENE)',
    artigo: 'Art. 324 a 328',
    tipo: 'T',
    operacao: '-',
    economia: 'Antecipação de 25% do valor do bem',
    requisitos: 'Projeto aprovado SUDAM/SUDENE; máquinas/equipamentos novos',
  },
  {
    id: 18,
    descricao: 'Subvenção para investimento (Art. 30, Lei 12.973/14)',
    artigo: 'Art. 261, II + Lei 12.973/14, Art. 30',
    tipo: 'C',
    operacao: '-',
    economia: '25% da subvenção',
    requisitos: 'Registrar como reserva de lucros; não distribuir',
    nota: 'VERIFICAR: LC 214/2025 pode ter alterado estas regras',
  },
  {
    id: 19,
    descricao: 'Ganho de capital diferido — permuta imobiliária',
    artigo: 'Art. 261, II (atividades imobiliárias)',
    tipo: 'T',
    operacao: '-',
    economia: '25% do ganho diferido',
    requisitos: 'PJ com atividade imobiliária; permuta sem torna ou com torna parcial',
  },
];

// ============================================================================
// BLOCO 5 — TAXAS DE DEPRECIAÇÃO FISCAL (Art. 311 a 330)
// ============================================================================

const DEPRECIACAO = {
  tabela: [
    { bem: 'Edifícios e construções', taxaAnual: 0.04, vidaUtil: 25, artigo: 'Art. 311 + IN RFB 1.700/17' },
    { bem: 'Instalações', taxaAnual: 0.10, vidaUtil: 10, artigo: 'Art. 311' },
    { bem: 'Máquinas e equipamentos', taxaAnual: 0.10, vidaUtil: 10, artigo: 'Art. 311' },
    { bem: 'Móveis e utensílios', taxaAnual: 0.10, vidaUtil: 10, artigo: 'Art. 311' },
    { bem: 'Veículos de passageiros', taxaAnual: 0.20, vidaUtil: 5, artigo: 'Art. 311' },
    { bem: 'Veículos de carga', taxaAnual: 0.20, vidaUtil: 5, artigo: 'Art. 311' },  // pode ser 25% (4 anos)
    { bem: 'Computadores e periféricos', taxaAnual: 0.20, vidaUtil: 5, artigo: 'Art. 311' },
    { bem: 'Software (adquirido)', taxaAnual: 0.20, vidaUtil: 5, artigo: 'Art. 311' },
    { bem: 'Equipamentos de comunicação', taxaAnual: 0.10, vidaUtil: 10, artigo: 'Art. 311' },
    { bem: 'Ferramentas', taxaAnual: 0.20, vidaUtil: 5, artigo: 'Art. 311' },
    { bem: 'Tratores', taxaAnual: 0.25, vidaUtil: 4, artigo: 'Art. 311' },
    { bem: 'Semoventes e rebanho (reprodutores)', taxaAnual: 0.20, vidaUtil: 5, artigo: 'Art. 311' },
  ],
  // Art. 323 — Depreciação acelerada por turnos
  aceleracaoTurnos: [
    { turno: 1, horas: 8, multiplicador: 1.0, artigo: 'Art. 323' },
    { turno: 2, horas: 16, multiplicador: 1.5, artigo: 'Art. 323' },
    { turno: 3, horas: 24, multiplicador: 2.0, artigo: 'Art. 323' },
  ],
  // Art. 322 — Bens usados
  bensUsados: {
    artigo: 'Art. 322',
    regra: 'Vida útil = MAX(metade da vida útil normal, restante da vida útil)',
  },
};

// ============================================================================
// BLOCO 6 — INCENTIVOS FISCAIS (Deduções do IRPJ Devido)
// Base Legal: Art. 226 (mensal) + Art. 228 (anual) + Art. 625-646
// ============================================================================

const INCENTIVOS_FISCAIS = [
  {
    id: 'PAT',
    descricao: 'Programa de Alimentação do Trabalhador',
    artigo: 'Art. 226, I + Art. 641-646',
    limitePercentualIRPJ: 0.04, // 4% do IRPJ devido (sem adicional)
    base: 'IRPJ_NORMAL',
    requisitos: ['Registro no MTE', 'Beneficiar trabalhadores com até 5 SM'],
    calculoDeducao: 'despesa_PAT × 0.15 (limitado a 4% do IRPJ normal)',
  },
  {
    id: 'FIA',
    descricao: 'Fundo da Criança e do Adolescente',
    artigo: 'Art. 226, II + Art. 636',
    limitePercentualIRPJ: 0.01, // 1% do IRPJ devido
    base: 'IRPJ_NORMAL',
    requisitos: ['Depósito no FIA federal/estadual/municipal'],
  },
  {
    id: 'FUNDO_IDOSO',
    descricao: 'Fundo do Idoso',
    artigo: 'Art. 226, II + Lei 12.213/10, Art. 3º',
    limitePercentualIRPJ: 0.01,
    base: 'IRPJ_NORMAL',
    requisitos: ['Depósito no Fundo do Idoso'],
  },
  {
    id: 'ROUANET',
    descricao: 'Lei Rouanet — Atividades Culturais/Artísticas',
    artigo: 'Art. 226, III + Lei 8.313/91',
    limitePercentualIRPJ: 0.04,
    base: 'IRPJ_NORMAL',
    requisitos: ['Projeto aprovado pelo MinC', 'Doação ou patrocínio'],
  },
  {
    id: 'VALE_CULTURA',
    descricao: 'Vale-Cultura',
    artigo: 'Art. 226, IV + Lei 12.761/12',
    limitePercentualIRPJ: 0.01,
    base: 'IRPJ_NORMAL',
    requisitos: ['Programa de Cultura do Trabalhador'],
  },
  {
    id: 'AUDIOVISUAL',
    descricao: 'Atividades Audiovisuais (FUNCINES)',
    artigo: 'Art. 226, V + MP 2.228-1/01',
    limitePercentualIRPJ: 0.03,
    base: 'IRPJ_NORMAL',
    requisitos: ['Investimentos/patrocínios em audiovisual'],
  },
  {
    id: 'ESPORTE',
    descricao: 'Lei do Esporte — Projetos Desportivos',
    artigo: 'Art. 226, VI + Lei 11.438/06',
    limitePercentualIRPJ: 0.01,
    base: 'IRPJ_NORMAL',
    requisitos: ['Projeto desportivo aprovado'],
  },
  {
    id: 'LICENCA_MATERNIDADE',
    descricao: 'Prorrogação Licença-Maternidade/Paternidade',
    artigo: 'Art. 226, VII + Lei 11.770/08',
    limitePercentualIRPJ: null, // sem limite percentual; é o valor total da remuneração
    base: 'VALOR_TOTAL',
    requisitos: ['Empresa Cidadã', 'Remuneração no período de prorrogação'],
  },
  {
    id: 'PRONON',
    descricao: 'PRONON — Programa Nacional de Apoio à Oncologia',
    artigo: 'Art. 628 + Lei 12.715/12',
    limitePercentualIRPJ: 0.01,
    base: 'IRPJ_NORMAL',
    requisitos: ['Doação/patrocínio aprovado pelo Ministério da Saúde'],
  },
  {
    id: 'PRONAS_PCD',
    descricao: 'PRONAS/PCD — Pessoa com Deficiência',
    artigo: 'Art. 628 + Lei 12.715/12',
    limitePercentualIRPJ: 0.01,
    base: 'IRPJ_NORMAL',
    requisitos: ['Doação/patrocínio aprovado pelo Ministério da Saúde'],
  },
  {
    id: 'PESQUISA_TECNOLOGICA',
    descricao: 'P&D — Pesquisa e Desenvolvimento (Lei do Bem)',
    artigo: 'Lei 11.196/05 (Lei do Bem)',
    limitePercentualIRPJ: null,
    base: 'EXCLUSAO_LUCRO_REAL',
    requisitos: ['Empresa com lucro real', 'Dispêndios com P&D'],
    nota: 'Exclusão de 60% a 80% dos dispêndios com P&D da base do IRPJ/CSLL',
  },
];

// Limite global combinado (Art. 625)
const LIMITE_GLOBAL_INCENTIVOS = {
  artigo: 'Art. 625',
  regra: 'PAT + FIA + Idoso + Rouanet + Audiovisual + Esporte <= percentual do IRPJ normal (sem adicional)',
  nota: 'Verificar Art. 625 para limite global atualizado. Cada incentivo tem seu limite individual.',
};

// ============================================================================
// BLOCO 7 — SUBCAPITALIZAÇÃO (Art. 249 a 251)
// ============================================================================

const SUBCAPITALIZACAO = {
  vinculadaComParticipacao: {
    artigo: 'Art. 250, I',
    limiteDividaPL: 2.0, // 2:1 (dívida ≤ 2× participação da vinculada no PL)
    descricao: 'Endividamento com vinculada que tem participação societária',
  },
  vinculadaSemParticipacao: {
    artigo: 'Art. 250, II',
    limiteDividaPL: 2.0, // 2:1 (dívida ≤ 2× PL total)
    descricao: 'Endividamento com vinculada sem participação societária',
  },
  somatorioVinculadas: {
    artigo: 'Art. 250, III',
    limiteDividaPL: 2.0, // Somatório ≤ 2× somatório participações
    descricao: 'Total de endividamento com todas vinculadas',
  },
  paraisoFiscal: {
    artigo: 'Art. 251',
    limiteDividaPL: 0.30, // 30% do PL
    descricao: 'Endividamento com entidades em paraísos fiscais',
  },
};

// ============================================================================
// BLOCO 8 — FUNÇÕES DE CÁLCULO
// ============================================================================

/**
 * FÓRMULA MESTRE — Cálculo do IRPJ pelo Lucro Real
 * Base Legal: Art. 258 a 261
 *
 * @param {Object} dados
 * @param {number} dados.lucroLiquidoContabil   - Lucro líquido antes de IRPJ/CSLL
 * @param {number} dados.totalAdicoes            - Soma de todas as adições (Art. 260)
 * @param {number} dados.totalExclusoes          - Soma de todas as exclusões (Art. 261, I e II)
 * @param {number} dados.saldoPrejuizoFiscal     - Saldo de prejuízo fiscal acumulado (LALUR Parte B)
 * @param {number} dados.numMeses                - Nº de meses do período (1 a 12)
 * @param {number} dados.incentivosDedutiveis    - Total de incentivos que deduzem do IRPJ (Art. 226/228)
 * @param {number} dados.retencoesFonte          - IRRF retido na fonte compensável
 * @param {number} dados.estimativasPagas        - Estimativas já pagas (se anual)
 * @returns {Object} Resultado completo do cálculo
 */
function calcularIRPJLucroReal(dados) {
  const {
    lucroLiquidoContabil = 0,
    totalAdicoes = 0,
    totalExclusoes = 0,
    saldoPrejuizoFiscal = 0,
    numMeses = 12,
    incentivosDedutiveis = 0,
    retencoesFonte = 0,
    estimativasPagas = 0,
  } = dados;

  // PASSO 1: Lucro Líquido Contábil — Art. 259
  const passo1_lucroLiquido = lucroLiquidoContabil;

  // PASSO 2: + Adições obrigatórias — Art. 260
  const passo2_adicoes = totalAdicoes;

  // PASSO 3: - Exclusões permitidas — Art. 261
  const passo3_exclusoes = totalExclusoes;

  // PASSO 4: = Lucro Real antes da compensação
  const passo4_lucroAntesCompensacao = passo1_lucroLiquido + passo2_adicoes - passo3_exclusoes;

  // PASSO 5: - Compensação de prejuízos — Art. 261, III (trava 30%)
  const resultadoCompensacao = compensarPrejuizo(passo4_lucroAntesCompensacao, saldoPrejuizoFiscal);
  const passo5_compensacao = resultadoCompensacao.compensacao;

  // PASSO 6: = Lucro Real (base de cálculo do IRPJ)
  const passo6_lucroReal = resultadoCompensacao.lucroRealFinal;

  // PASSO 7: × 15% = IRPJ normal — Art. 225
  const passo7_irpjNormal = Math.max(passo6_lucroReal, 0) * CONSTANTES.IRPJ_ALIQUOTA_NORMAL;

  // PASSO 8: Adicional de 10% — Art. 225, parágrafo único
  const limiteAdicional = CONSTANTES.IRPJ_LIMITE_ADICIONAL_MES * numMeses;
  const baseAdicional = Math.max(passo6_lucroReal - limiteAdicional, 0);
  const passo8_adicionalIRPJ = baseAdicional * CONSTANTES.IRPJ_ALIQUOTA_ADICIONAL;

  // PASSO 9: IRPJ Devido = normal + adicional
  const passo9_irpjDevido = passo7_irpjNormal + passo8_adicionalIRPJ;

  // PASSO 10: - Deduções do IRPJ (incentivos fiscais) — Art. 226 / Art. 228
  const passo10_deducoes = Math.min(incentivosDedutiveis, passo7_irpjNormal);
  // NOTA: Incentivos geralmente só deduzem do IRPJ normal, NÃO do adicional

  // PASSO 11: - Retenções na fonte (IRRF) + estimativas pagas
  const passo11_retencoes = retencoesFonte + estimativasPagas;

  // PASSO 12: = IRPJ a Pagar (ou saldo negativo)
  const passo12_irpjAPagar = passo9_irpjDevido - passo10_deducoes - passo11_retencoes;

  return {
    // Detalhamento dos passos
    passo1_lucroLiquido,
    passo2_adicoes,
    passo3_exclusoes,
    passo4_lucroAntesCompensacao,
    passo5_compensacao,
    passo6_lucroReal,
    passo7_irpjNormal,
    passo8_adicionalIRPJ,
    passo8_baseAdicional: baseAdicional,
    passo8_limiteAdicional: limiteAdicional,
    passo9_irpjDevido,
    passo10_deducoes,
    passo11_retencoes,
    passo12_irpjAPagar,

    // Dados auxiliares
    saldoPrejuizoRemanescente: resultadoCompensacao.saldoRemanescente,
    economiaCompensacao: resultadoCompensacao.economiaIRPJ,

    // Indicadores
    aliquotaEfetiva: passo6_lucroReal > 0
      ? (passo9_irpjDevido / passo6_lucroReal * 100).toFixed(2) + '%'
      : '0%',
    saldoNegativo: passo12_irpjAPagar < 0,
    valorSaldoNegativo: passo12_irpjAPagar < 0 ? Math.abs(passo12_irpjAPagar) : 0,
  };
}

/**
 * COMPENSAÇÃO DE PREJUÍZOS FISCAIS — Trava dos 30%
 * Base Legal: Art. 261, III + Art. 580-583
 *
 * @param {number} lucroRealAntes - Lucro Real antes da compensação
 * @param {number} saldoPrejuizo  - Saldo de prejuízo fiscal (LALUR Parte B)
 * @returns {Object}
 */
function compensarPrejuizo(lucroRealAntes, saldoPrejuizo) {
  // Se houver prejuízo no período, acumula
  if (lucroRealAntes <= 0) {
    return {
      lucroAntes: lucroRealAntes,
      limite30: 0,
      compensacao: 0,
      lucroRealFinal: 0, // Não há lucro real negativo; o prejuízo vai p/ Parte B
      saldoRemanescente: saldoPrejuizo + Math.abs(lucroRealAntes),
      prejuizoPeriodo: Math.abs(lucroRealAntes),
      economiaIRPJ: 0,
      economiaCSLL: 0,
    };
  }

  // Limite de 30% — Art. 261, III
  const limite30 = lucroRealAntes * CONSTANTES.TRAVA_COMPENSACAO_PREJUIZO;
  const compensacao = Math.min(limite30, saldoPrejuizo);
  const lucroRealFinal = lucroRealAntes - compensacao;
  const novoSaldo = saldoPrejuizo - compensacao;

  return {
    lucroAntes: lucroRealAntes,
    limite30,
    compensacao,
    lucroRealFinal,
    saldoRemanescente: novoSaldo,
    prejuizoPeriodo: 0,
    economiaIRPJ: compensacao * 0.25,    // 15% + 10% potencial
    economiaCSLL: compensacao * 0.09,
    economiaTotal: compensacao * 0.34,
  };
}

/**
 * CSLL — Cálculo em paralelo ao IRPJ
 * Base Legal: Lei 7.689/88 + Lei 9.249/95
 *
 * @param {Object} dados
 * @param {number} dados.lucroLiquidoContabil
 * @param {number} dados.adicoesCSLL           - Adições específicas para CSLL
 * @param {number} dados.exclusoesCSLL         - Exclusões específicas para CSLL
 * @param {number} dados.saldoBaseNegativa     - Base negativa de CSLL acumulada
 * @param {boolean} dados.ehInstituicaoFinanceira
 * @returns {Object}
 */
function calcularCSLL(dados) {
  const {
    lucroLiquidoContabil = 0,
    adicoesCSLL = 0,
    exclusoesCSLL = 0,
    saldoBaseNegativa = 0,
    ehInstituicaoFinanceira = false,
  } = dados;

  const aliquota = ehInstituicaoFinanceira
    ? CONSTANTES.CSLL_ALIQUOTA_FINANCEIRAS
    : CONSTANTES.CSLL_ALIQUOTA_GERAL;

  // Base de cálculo ajustada
  const baseAjustada = lucroLiquidoContabil + adicoesCSLL - exclusoesCSLL;

  // Compensação de base negativa (mesma trava de 30%)
  const compensacaoBaseNeg = compensarPrejuizo(baseAjustada, saldoBaseNegativa);

  // CSLL devida
  const basePositiva = Math.max(compensacaoBaseNeg.lucroRealFinal, 0);
  const csllDevida = basePositiva * aliquota;

  return {
    baseAjustada,
    compensacaoBaseNegativa: compensacaoBaseNeg.compensacao,
    basePositiva,
    aliquota,
    aliquotaPercentual: (aliquota * 100).toFixed(0) + '%',
    csllDevida,
    saldoBaseNegativaRemanescente: compensacaoBaseNeg.saldoRemanescente,
    nota: 'CSLL NÃO tem incentivos dedutíveis (diferente do IRPJ)',
  };
}

/**
 * ESTIMATIVA MENSAL — Cálculo do IRPJ mensal por estimativa
 * Base Legal: Art. 219 a 225
 *
 * @param {Object} dados
 * @param {number} dados.receitaBrutaMensal     - Receita bruta do mês
 * @param {string} dados.tipoAtividade          - Chave da tabela PRESUNCOES
 * @param {number} dados.ganhosCapital           - Ganhos de capital no mês (Art. 222)
 * @param {number} dados.demaisReceitas          - Outras receitas não incluídas na RB (Art. 222)
 * @param {number} dados.irrfCompensavel         - IRRF retido no mês
 * @param {number} dados.incentivosDedutiveis    - Incentivos dedutíveis no mês
 * @returns {Object}
 */
function calcularEstimativaMensal(dados) {
  const {
    receitaBrutaMensal = 0,
    tipoAtividade = 'COMERCIO_INDUSTRIA',
    ganhosCapital = 0,
    demaisReceitas = 0,
    irrfCompensavel = 0,
    incentivosDedutiveis = 0,
  } = dados;

  const presuncao = PRESUNCOES[tipoAtividade];
  if (!presuncao) {
    throw new Error(`Tipo de atividade "${tipoAtividade}" não encontrado em PRESUNCOES`);
  }

  // Base de cálculo estimada — Art. 220
  const basePresumida = receitaBrutaMensal * presuncao.irpj;
  const baseTotalEstimada = basePresumida + ganhosCapital + demaisReceitas;

  // IRPJ — Art. 225
  const irpjNormal = baseTotalEstimada * CONSTANTES.IRPJ_ALIQUOTA_NORMAL;

  // Adicional — Art. 225, parágrafo único
  const baseAdicional = Math.max(baseTotalEstimada - CONSTANTES.IRPJ_LIMITE_ADICIONAL_MES, 0);
  const irpjAdicional = baseAdicional * CONSTANTES.IRPJ_ALIQUOTA_ADICIONAL;

  // Total devido
  const irpjDevido = irpjNormal + irpjAdicional;

  // Deduções — Art. 226
  const deducoes = Math.min(incentivosDedutiveis, irpjNormal);
  const irpjAPagar = Math.max(irpjDevido - deducoes - irrfCompensavel, 0);

  // CSLL estimada (mesma lógica mas com presunção CSLL)
  const baseCSLL = receitaBrutaMensal * presuncao.csll + ganhosCapital + demaisReceitas;
  const csllDevida = baseCSLL * CONSTANTES.CSLL_ALIQUOTA_GERAL;

  return {
    presuncaoUtilizada: presuncao.descricao,
    percentualPresuncaoIRPJ: (presuncao.irpj * 100).toFixed(1) + '%',
    percentualPresuncaoCSLL: (presuncao.csll * 100).toFixed(1) + '%',
    receitaBruta: receitaBrutaMensal,
    basePresumidaIRPJ: basePresumida,
    ganhosCapital,
    demaisReceitas,
    baseTotalEstimada,
    irpjNormal,
    irpjAdicional,
    irpjDevido,
    deducoes,
    irrfCompensavel,
    irpjAPagar,
    csll: {
      baseCSLL,
      csllDevida,
    },
    totalAPagar: irpjAPagar + csllDevida,
    artigos: 'Art. 219-225',
  };
}

/**
 * ATIVIDADES DIVERSIFICADAS — Art. 220, §3º
 * Quando a empresa tem múltiplas atividades, aplica presunção de cada uma.
 *
 * @param {Array} atividades - Array de { tipoAtividade, receitaBruta }
 * @param {number} ganhosCapital
 * @param {number} demaisReceitas
 * @returns {Object}
 */
function calcularEstimativaAtividadesDiversificadas(atividades, ganhosCapital = 0, demaisReceitas = 0) {
  let basePresumidaIRPJ = 0;
  let basePresumidaCSLL = 0;
  const detalhamento = [];

  for (const atv of atividades) {
    const presuncao = PRESUNCOES[atv.tipoAtividade];
    if (!presuncao) {
      throw new Error(`Tipo de atividade "${atv.tipoAtividade}" não encontrado`);
    }
    const parcIRPJ = atv.receitaBruta * presuncao.irpj;
    const parcCSLL = atv.receitaBruta * presuncao.csll;
    basePresumidaIRPJ += parcIRPJ;
    basePresumidaCSLL += parcCSLL;
    detalhamento.push({
      atividade: presuncao.descricao,
      receita: atv.receitaBruta,
      presuncaoIRPJ: presuncao.irpj,
      baseIRPJ: parcIRPJ,
      presuncaoCSLL: presuncao.csll,
      baseCSLL: parcCSLL,
    });
  }

  const baseTotalIRPJ = basePresumidaIRPJ + ganhosCapital + demaisReceitas;
  const baseTotalCSLL = basePresumidaCSLL + ganhosCapital + demaisReceitas;

  return {
    detalhamento,
    basePresumidaIRPJ,
    basePresumidaCSLL,
    baseTotalIRPJ,
    baseTotalCSLL,
    artigo: 'Art. 220, §3º',
  };
}

/**
 * BALANÇO DE SUSPENSÃO / REDUÇÃO — Art. 227
 * Mecanismo mais poderoso de economia no Lucro Real anual.
 *
 * @param {Object} dados
 * @param {number} dados.estimativaDevidaMes     - Estimativa calculada para o mês corrente
 * @param {number} dados.irpjRealAcumulado       - IRPJ pelo lucro real acumulado até o mês
 * @param {number} dados.irpjPagoAcumulado       - Soma das estimativas já pagas nos meses anteriores
 * @param {number} dados.csllRealAcumulada        - CSLL pelo lucro real acumulado até o mês
 * @param {number} dados.csllPagaAcumulada        - Soma das CSLLs já pagas
 * @returns {Object}
 */
function calcularSuspensaoReducao(dados) {
  const {
    estimativaDevidaMes = 0,
    irpjRealAcumulado = 0,
    irpjPagoAcumulado = 0,
    csllRealAcumulada = 0,
    csllPagaAcumulada = 0,
  } = dados;

  let irpjMes, situacaoIRPJ;
  let csllMes, situacaoCSLL;

  // --- IRPJ ---
  if (irpjRealAcumulado <= irpjPagoAcumulado) {
    // SUSPENSÃO TOTAL — Art. 227, caput
    irpjMes = 0;
    situacaoIRPJ = 'SUSPENSAO';
  } else if (irpjRealAcumulado < irpjPagoAcumulado + estimativaDevidaMes) {
    // REDUÇÃO — paga apenas a diferença
    irpjMes = irpjRealAcumulado - irpjPagoAcumulado;
    situacaoIRPJ = 'REDUCAO';
  } else {
    // Paga estimativa integral
    irpjMes = estimativaDevidaMes;
    situacaoIRPJ = 'INTEGRAL';
  }

  // --- CSLL (mesma lógica) ---
  const estimativaCSLLMes = dados.estimativaCSLLMes || 0;
  if (csllRealAcumulada <= csllPagaAcumulada) {
    csllMes = 0;
    situacaoCSLL = 'SUSPENSAO';
  } else if (csllRealAcumulada < csllPagaAcumulada + estimativaCSLLMes) {
    csllMes = csllRealAcumulada - csllPagaAcumulada;
    situacaoCSLL = 'REDUCAO';
  } else {
    csllMes = estimativaCSLLMes;
    situacaoCSLL = 'INTEGRAL';
  }

  const economiaMes = estimativaDevidaMes - irpjMes + estimativaCSLLMes - csllMes;

  return {
    irpj: {
      estimativaDevida: estimativaDevidaMes,
      irpjRealAcumulado,
      irpjPagoAcumulado,
      valorAPagar: Math.max(irpjMes, 0),
      situacao: situacaoIRPJ,
    },
    csll: {
      estimativaDevida: estimativaCSLLMes,
      csllRealAcumulada,
      csllPagaAcumulada,
      valorAPagar: Math.max(csllMes, 0),
      situacao: situacaoCSLL,
    },
    economiaMes,
    requisitos: [
      'Balanço/balancete mensal levantado e transcrito no Diário (Art. 227, §1º, I)',
      'Observar leis comerciais e fiscais (Art. 227, §1º, I)',
      'Efeitos apenas para o período em curso (Art. 227, §1º, II)',
    ],
    artigos: 'Art. 227 a 230',
  };
}

/**
 * JCP — Juros sobre Capital Próprio
 * Base Legal: Art. 355 a 358
 *
 * @param {Object} dados
 * @param {number} dados.patrimonioLiquido      - PL da empresa
 * @param {number} dados.tjlp                   - TJLP/TLP do período (ex: 0.06 = 6% a.a.)
 * @param {number} dados.lucroLiquidoAntes      - Lucro líquido antes do JCP e IRPJ/CSLL
 * @param {number} dados.lucrosAcumulados        - Lucros acumulados + reservas de lucros
 * @param {number} dados.numMeses                - Meses do período
 * @returns {Object}
 */
function calcularJCP(dados) {
  const {
    patrimonioLiquido = 0,
    tjlp = 0.06,
    lucroLiquidoAntes = 0,
    lucrosAcumulados = 0,
    numMeses = 12,
  } = dados;

  // JCP máximo pela TJLP
  const tjlpProporcional = tjlp * (numMeses / 12);
  const jcpMaximoTJLP = patrimonioLiquido * tjlpProporcional;

  // Limite 1: 50% do lucro líquido do exercício (antes do JCP e IRPJ)
  const limite1 = lucroLiquidoAntes * CONSTANTES.JCP_LIMITE_LUCRO_LIQUIDO;

  // Limite 2: 50% de (lucros acumulados + reservas de lucros)
  const limite2 = lucrosAcumulados * CONSTANTES.JCP_LIMITE_LUCROS_ACUMULADOS;

  // JCP dedutível = menor dos três
  const jcpDedutivel = Math.max(0, Math.min(jcpMaximoTJLP, limite1, limite2));

  // Economia tributária
  const economiaIRPJ = jcpDedutivel * 0.25;    // 15% + 10% adicional
  const economiaCSLL = jcpDedutivel * 0.09;
  const economiaTotal = economiaIRPJ + economiaCSLL;  // 34% da base

  // Custo do JCP (IRRF 15% retido do beneficiário)
  const custoIRRF = jcpDedutivel * CONSTANTES.JCP_IRRF_ALIQUOTA;

  // Economia líquida
  const economiaLiquida = economiaTotal - custoIRRF;  // 34% - 15% = 19% do JCP

  return {
    patrimonioLiquido,
    tjlp,
    tjlpProporcional,
    jcpMaximoTJLP,
    limite1_50LL: limite1,
    limite2_50Reservas: limite2,
    jcpDedutivel,
    economiaIRPJ,
    economiaCSLL,
    economiaTotal,
    custoIRRF,
    economiaLiquida,
    percentualEconomia: jcpDedutivel > 0
      ? ((economiaLiquida / jcpDedutivel) * 100).toFixed(1) + '%'
      : '0%',
    limiteUtilizado: jcpDedutivel === jcpMaximoTJLP ? 'TJLP'
      : jcpDedutivel === limite1 ? '50% Lucro Líquido'
      : '50% Lucros Acumulados',
    artigos: 'Art. 355 a 358',
  };
}

/**
 * DEPRECIAÇÃO — Cálculo fiscal
 * Base Legal: Art. 311 a 330
 *
 * @param {Object} bem
 * @param {string} bem.tipo              - Chave da tabela DEPRECIACAO
 * @param {number} bem.custoAquisicao    - Valor de aquisição
 * @param {number} bem.depAcumulada      - Depreciação já acumulada
 * @param {number} bem.turnos            - 1, 2 ou 3 turnos (Art. 323)
 * @param {boolean} bem.usado             - Se é bem usado (Art. 322)
 * @param {number} bem.vidaUtilRestante   - Vida útil restante (se usado)
 * @param {boolean} bem.aceleradaIncentivada - Se tem depreciação acelerada incentivada
 * @returns {Object}
 */
function calcularDepreciacao(bem) {
  const {
    tipo = 'Máquinas e equipamentos',
    custoAquisicao = 0,
    depAcumulada = 0,
    turnos = 1,
    usado = false,
    vidaUtilRestante = null,
    aceleradaIncentivada = false,
  } = bem;

  // Buscar taxa na tabela
  const itemTabela = DEPRECIACAO.tabela.find(t => t.bem === tipo);
  let taxaNormal = itemTabela ? itemTabela.taxaAnual : 0.10;
  let vidaUtilNormal = itemTabela ? itemTabela.vidaUtil : 10;

  // Bem usado — Art. 322
  if (usado) {
    const metadeVidaUtil = vidaUtilNormal / 2;
    const restante = vidaUtilRestante || metadeVidaUtil;
    const vidaUtilFinal = Math.max(metadeVidaUtil, restante);
    taxaNormal = 1 / vidaUtilFinal;
  }

  // Aceleração por turnos — Art. 323
  const multiplicadorTurno = DEPRECIACAO.aceleracaoTurnos.find(t => t.turno === turnos);
  const taxaComTurnos = taxaNormal * (multiplicadorTurno ? multiplicadorTurno.multiplicador : 1);

  // Depreciação acelerada incentivada — Art. 324-328
  // (SUDAM/SUDENE: dedução integral no ano de aquisição)
  const taxaFinal = aceleradaIncentivada ? 1.0 : taxaComTurnos;

  // Valor depreciável restante
  const baseDepreciavel = Math.max(custoAquisicao - depAcumulada, 0);
  const depreciacaoAno = Math.min(baseDepreciavel, custoAquisicao * taxaFinal);

  return {
    tipo,
    custoAquisicao,
    depAcumulada,
    baseDepreciavel,
    taxaNormal,
    taxaComTurnos,
    turnos,
    multiplicadorTurno: multiplicadorTurno ? multiplicadorTurno.multiplicador : 1,
    aceleradaIncentivada,
    taxaFinal,
    depreciacaoAno,
    novaDepAcumulada: depAcumulada + depreciacaoAno,
    totalmenteDepreciado: (depAcumulada + depreciacaoAno) >= custoAquisicao,
    economiaIRPJ: depreciacaoAno * 0.25,
    economiaCSLL: depreciacaoAno * 0.09,
    artigos: 'Art. 311-330',
  };
}

/**
 * INCENTIVOS FISCAIS — Cálculo das deduções do IRPJ devido
 * Base Legal: Art. 226 + Art. 228 + Art. 625-646
 *
 * @param {number} irpjNormal     - IRPJ normal (15%, sem adicional)
 * @param {Object} despesas       - Despesas com cada incentivo
 * @returns {Object}
 */
function calcularIncentivos(irpjNormal, despesas = {}) {
  const resultado = [];
  let totalDeducao = 0;

  for (const incentivo of INCENTIVOS_FISCAIS) {
    const despesaIncentivo = despesas[incentivo.id] || 0;
    if (despesaIncentivo <= 0) continue;

    let deducaoCalculada = 0;

    if (incentivo.id === 'PAT') {
      // PAT: despesa × 15% da alíquota, limitado a 4% do IRPJ normal
      deducaoCalculada = despesaIncentivo * 0.15;
    } else if (incentivo.id === 'LICENCA_MATERNIDADE') {
      deducaoCalculada = despesaIncentivo; // Valor total da remuneração
    } else {
      deducaoCalculada = despesaIncentivo; // Doações diretas
    }

    const limiteIndividual = incentivo.limitePercentualIRPJ
      ? irpjNormal * incentivo.limitePercentualIRPJ
      : deducaoCalculada;

    const deducaoFinal = Math.min(deducaoCalculada, limiteIndividual);

    resultado.push({
      incentivo: incentivo.id,
      descricao: incentivo.descricao,
      despesa: despesaIncentivo,
      deducaoCalculada,
      limiteIndividual,
      deducaoFinal,
      artigo: incentivo.artigo,
    });

    totalDeducao += deducaoFinal;
  }

  // Limite global (não pode exceder o IRPJ normal)
  const totalFinal = Math.min(totalDeducao, irpjNormal);

  return {
    incentivos: resultado,
    totalDeducaoCalculada: totalDeducao,
    totalDeducaoFinal: totalFinal,
    irpjNormal,
    percentualUtilizado: irpjNormal > 0
      ? ((totalFinal / irpjNormal) * 100).toFixed(2) + '%'
      : '0%',
    artigos: 'Art. 226, 228, 625-646',
  };
}

/**
 * PIS/COFINS NÃO-CUMULATIVO — Créditos
 * Base Legal: Lei 10.637/2002 e Lei 10.833/2003
 *
 * @param {Object} dados
 * @returns {Object}
 */
function calcularPISCOFINSNaoCumulativo(dados) {
  const {
    receitaBruta = 0,
    receitasIsentas = 0,
    receitasExportacao = 0,
    // Créditos
    comprasBensRevenda = 0,
    insumosProducao = 0,
    energiaEletrica = 0,
    alugueisPJ = 0,
    depreciacaoBens = 0,
    devolucoes = 0,
    freteArmazenagem = 0,
    leasing = 0,
    outrosCreditos = 0,
  } = dados;

  // Receita tributável
  const receitaTributavel = receitaBruta - receitasIsentas - receitasExportacao;

  // Débitos
  const pisSobreReceita = receitaTributavel * CONSTANTES.PIS_ALIQUOTA;
  const cofinsSobreReceita = receitaTributavel * CONSTANTES.COFINS_ALIQUOTA;

  // Base de créditos
  const totalBaseCreditos = comprasBensRevenda + insumosProducao + energiaEletrica
    + alugueisPJ + depreciacaoBens + devolucoes + freteArmazenagem + leasing + outrosCreditos;

  // Créditos
  const creditoPIS = totalBaseCreditos * CONSTANTES.PIS_ALIQUOTA;
  const creditoCOFINS = totalBaseCreditos * CONSTANTES.COFINS_ALIQUOTA;

  // PIS/COFINS a pagar
  const pisAPagar = Math.max(pisSobreReceita - creditoPIS, 0);
  const cofinsAPagar = Math.max(cofinsSobreReceita - creditoCOFINS, 0);

  // Crédito excedente (saldo credor)
  const saldoCredorPIS = Math.max(creditoPIS - pisSobreReceita, 0);
  const saldoCredorCOFINS = Math.max(creditoCOFINS - cofinsSobreReceita, 0);

  return {
    receitaBruta,
    receitaTributavel,
    debitos: {
      pis: pisSobreReceita,
      cofins: cofinsSobreReceita,
      total: pisSobreReceita + cofinsSobreReceita,
    },
    creditos: {
      baseTotal: totalBaseCreditos,
      pis: creditoPIS,
      cofins: creditoCOFINS,
      total: creditoPIS + creditoCOFINS,
      detalhamento: {
        comprasBensRevenda,
        insumosProducao,
        energiaEletrica,
        alugueisPJ,
        depreciacaoBens,
        devolucoes,
        freteArmazenagem,
        leasing,
        outrosCreditos,
      },
    },
    aPagar: {
      pis: pisAPagar,
      cofins: cofinsAPagar,
      total: pisAPagar + cofinsAPagar,
    },
    saldoCredor: {
      pis: saldoCredorPIS,
      cofins: saldoCredorCOFINS,
      total: saldoCredorPIS + saldoCredorCOFINS,
    },
    aliquotaEfetiva: receitaBruta > 0
      ? (((pisAPagar + cofinsAPagar) / receitaBruta) * 100).toFixed(2) + '%'
      : '0%',
    economiaCreditos: creditoPIS + creditoCOFINS,
    artigos: 'Lei 10.637/02, Lei 10.833/03',
  };
}

/**
 * SUBCAPITALIZAÇÃO — Verificação de limites
 * Base Legal: Art. 249 a 251
 *
 * @param {Object} dados
 * @returns {Object}
 */
function verificarSubcapitalizacao(dados) {
  const {
    patrimonioLiquido = 0,
    dividaVinculadaComParticipacao = 0,
    participacaoVinculadaPL = 0,
    dividaVinculadaSemParticipacao = 0,
    dividaParaisoFiscal = 0,
    jurosVinculada = 0,
    jurosParaiso = 0,
  } = dados;

  const alertas = [];

  // Art. 250, I — Vinculada com participação
  const limiteVinculadaComPart = participacaoVinculadaPL * SUBCAPITALIZACAO.vinculadaComParticipacao.limiteDividaPL;
  const excessoVinculadaComPart = Math.max(dividaVinculadaComParticipacao - limiteVinculadaComPart, 0);
  if (excessoVinculadaComPart > 0) {
    alertas.push({
      tipo: 'SUBCAPITALIZACAO_VINCULADA_PARTICIPACAO',
      artigo: 'Art. 250, I',
      excesso: excessoVinculadaComPart,
      jurosIndedutiveisEstimados: jurosVinculada * (excessoVinculadaComPart / dividaVinculadaComParticipacao),
    });
  }

  // Art. 250, II — Vinculada sem participação
  const limiteVinculadaSemPart = patrimonioLiquido * SUBCAPITALIZACAO.vinculadaSemParticipacao.limiteDividaPL;
  const excessoVinculadaSemPart = Math.max(dividaVinculadaSemParticipacao - limiteVinculadaSemPart, 0);
  if (excessoVinculadaSemPart > 0) {
    alertas.push({
      tipo: 'SUBCAPITALIZACAO_VINCULADA_SEM_PARTICIPACAO',
      artigo: 'Art. 250, II',
      excesso: excessoVinculadaSemPart,
    });
  }

  // Art. 251 — Paraíso fiscal
  const limiteParaiso = patrimonioLiquido * SUBCAPITALIZACAO.paraisoFiscal.limiteDividaPL;
  const excessoParaiso = Math.max(dividaParaisoFiscal - limiteParaiso, 0);
  if (excessoParaiso > 0) {
    alertas.push({
      tipo: 'SUBCAPITALIZACAO_PARAISO_FISCAL',
      artigo: 'Art. 251',
      excesso: excessoParaiso,
      jurosIndedutiveisEstimados: jurosParaiso * (excessoParaiso / dividaParaisoFiscal),
    });
  }

  return {
    patrimonioLiquido,
    limites: {
      vinculadaComParticipacao: limiteVinculadaComPart,
      vinculadaSemParticipacao: limiteVinculadaSemPart,
      paraisoFiscal: limiteParaiso,
    },
    excessos: {
      vinculadaComParticipacao: excessoVinculadaComPart,
      vinculadaSemParticipacao: excessoVinculadaSemPart,
      paraisoFiscal: excessoParaiso,
    },
    temExcesso: alertas.length > 0,
    alertas,
  };
}

// ============================================================================
// BLOCO 9 — COMPLIANCE E ALERTAS (Art. 293-309)
// ============================================================================

/**
 * Verifica indicadores de omissão de receita e riscos fiscais
 *
 * @param {Object} dados
 * @returns {Array} Lista de alertas
 */
function verificarCompliance(dados) {
  const {
    saldoCaixa = 0,
    entradasCaixa = 0,
    saidasCaixa = 0,
    depositosBancarios = 0,
    receitaDeclarada = 0,
    estoqueContabil = 0,
    estoqueFisico = 0,
    passivoBaixado = 0,
    suprimentosCaixaSemOrigem = 0,
  } = dados;

  const alertas = [];

  // Art. 293-295: Saldo credor de caixa
  if (saidasCaixa > entradasCaixa + saldoCaixa) {
    alertas.push({
      nivel: 'CRITICO',
      tipo: 'SALDO_CREDOR_CAIXA',
      artigo: 'Art. 293-295',
      descricao: 'Saídas de caixa excedem entradas sem justificativa',
      acao: 'Verificar e justificar todos os lançamentos de caixa',
      valorDiscrepancia: saidasCaixa - entradasCaixa - saldoCaixa,
    });
  }

  // Art. 296-298: Passivo fictício
  if (passivoBaixado > 0) {
    alertas.push({
      nivel: 'ALTO',
      tipo: 'PASSIVO_FICTICIO',
      artigo: 'Art. 296-298',
      descricao: 'Dívidas já pagas não baixadas do passivo',
      acao: 'Reconciliar passivo e baixar obrigações liquidadas',
      valor: passivoBaixado,
    });
  }

  // Suprimento de caixa sem origem
  if (suprimentosCaixaSemOrigem > 0) {
    alertas.push({
      nivel: 'CRITICO',
      tipo: 'SUPRIMENTO_SEM_ORIGEM',
      artigo: 'Art. 299-301',
      descricao: 'Depósitos/suprimentos no caixa sem documentação de origem',
      acao: 'Documentar origem de todos os recursos',
      valor: suprimentosCaixaSemOrigem,
    });
  }

  // Depósitos bancários incompatíveis
  if (depositosBancarios > receitaDeclarada * 1.1) {
    alertas.push({
      nivel: 'ALTO',
      tipo: 'DEPOSITOS_INCOMPATIVEIS',
      artigo: 'Art. 302-304',
      descricao: 'Depósitos bancários superam receita declarada em mais de 10%',
      acao: 'Justificar diferença entre depósitos e receita',
      valorDiscrepancia: depositosBancarios - receitaDeclarada,
    });
  }

  // Diferença de estoque
  if (Math.abs(estoqueContabil - estoqueFisico) > estoqueContabil * 0.05) {
    alertas.push({
      nivel: 'MEDIO',
      tipo: 'DIFERENCA_ESTOQUE',
      artigo: 'Art. 305',
      descricao: 'Estoque físico diverge do contábil em mais de 5%',
      acao: 'Realizar inventário e ajustar escrituração',
      diferenca: estoqueContabil - estoqueFisico,
    });
  }

  return alertas;
}

// ============================================================================
// BLOCO 10 — DECISÃO: TRIMESTRAL vs ANUAL (Art. 217 vs Art. 218)
// ============================================================================

/**
 * Recomenda o regime de apuração mais vantajoso
 * Base Legal: Art. 217 (trimestral) vs Art. 218-219 (anual por estimativa)
 *
 * @param {Object} dados
 * @param {Array}  dados.lucrosMensais      - Array com 12 lucros mensais estimados
 * @param {number} dados.prejuizoAcumulado  - Prejuízo fiscal acumulado
 * @param {boolean} dados.temInvestimento   - Se empresa faz investimentos significativos
 * @returns {Object}
 */
function recomendarRegime(dados) {
  const {
    lucrosMensais = [],
    prejuizoAcumulado = 0,
    temInvestimento = false,
  } = dados;

  // Análise de padrão de lucros
  const lucroTotal = lucrosMensais.reduce((a, b) => a + b, 0);
  const temPrejuizoEmAlgunsMeses = lucrosMensais.some(l => l < 0);
  const lucroConcentradoNoFinal = lucrosMensais.slice(9, 12).reduce((a, b) => a + b, 0) > lucroTotal * 0.5;
  const lucroConstante = (() => {
    if (lucroTotal <= 0) return false;
    const media = lucroTotal / 12;
    const desvio = lucrosMensais.reduce((sum, l) => sum + Math.pow(l - media, 2), 0) / 12;
    return Math.sqrt(desvio) / media < 0.3; // CV < 30%
  })();

  // Simulação Trimestral
  const trimestres = [
    lucrosMensais.slice(0, 3).reduce((a, b) => a + b, 0),
    lucrosMensais.slice(3, 6).reduce((a, b) => a + b, 0),
    lucrosMensais.slice(6, 9).reduce((a, b) => a + b, 0),
    lucrosMensais.slice(9, 12).reduce((a, b) => a + b, 0),
  ];

  let irpjTrimestral = 0;
  let saldoPrejTri = prejuizoAcumulado;
  for (const lucroTri of trimestres) {
    const comp = compensarPrejuizo(lucroTri, saldoPrejTri);
    saldoPrejTri = comp.saldoRemanescente;
    if (comp.lucroRealFinal > 0) {
      irpjTrimestral += comp.lucroRealFinal * 0.15;
      irpjTrimestral += Math.max(comp.lucroRealFinal - 60000, 0) * 0.10;
    }
  }

  // Simulação Anual
  const compAnual = compensarPrejuizo(lucroTotal, prejuizoAcumulado);
  let irpjAnual = 0;
  if (compAnual.lucroRealFinal > 0) {
    irpjAnual = compAnual.lucroRealFinal * 0.15;
    irpjAnual += Math.max(compAnual.lucroRealFinal - 240000, 0) * 0.10;
  }

  // Decisão
  let recomendacao, motivos = [];

  if (lucroConcentradoNoFinal || temPrejuizoEmAlgunsMeses) {
    recomendacao = 'ANUAL';
    motivos.push('Lucro concentrado no final ou meses com prejuízo → suspensão/redução economiza');
  } else if (lucroConstante && !temInvestimento) {
    recomendacao = 'TRIMESTRAL';
    motivos.push('Lucro constante e sem investimentos → trimestral é mais simples');
  } else {
    recomendacao = irpjAnual <= irpjTrimestral ? 'ANUAL' : 'TRIMESTRAL';
    motivos.push(`Simulação: IRPJ Trimestral = R$ ${irpjTrimestral.toFixed(2)} vs Anual = R$ ${irpjAnual.toFixed(2)}`);
  }

  if (temPrejuizoEmAlgunsMeses) {
    motivos.push('ANUAL permite suspensão de estimativas com balanço mensal (Art. 227)');
  }

  if (prejuizoAcumulado > 0) {
    motivos.push('Prejuízo acumulado: no trimestral, trava de 30% aplica por trimestre (4 vezes); no anual, aplica uma vez');
  }

  return {
    recomendacao,
    motivos,
    simulacao: {
      trimestral: {
        irpjTotal: irpjTrimestral,
        detalhamentoTrimestres: trimestres,
        saldoPrejuizoRemanescente: saldoPrejTri,
      },
      anual: {
        irpjTotal: irpjAnual,
        lucroRealFinal: compAnual.lucroRealFinal,
        compensacao: compAnual.compensacao,
        saldoPrejuizoRemanescente: compAnual.saldoRemanescente,
      },
      economia: Math.abs(irpjTrimestral - irpjAnual),
      regimeMaisBarato: irpjAnual <= irpjTrimestral ? 'ANUAL' : 'TRIMESTRAL',
    },
    alerta: 'Art. 229: A opção é IRRETRATÁVEL para todo o ano-calendário',
    artigos: 'Art. 217-219, Art. 227-229',
  };
}

// ============================================================================
// BLOCO 11 — OBRIGATORIEDADE DO LUCRO REAL (Art. 257)
// ============================================================================

/**
 * Verifica se a empresa é obrigada ao Lucro Real
 * Base Legal: Art. 257
 *
 * @param {Object} dados
 * @returns {Object}
 */
function verificarObrigatoriedadeLucroReal(dados) {
  const {
    receitaTotalAnterior = 0,
    ehInstituicaoFinanceira = false,
    temLucroExterior = false,
    temBeneficioFiscalIsencao = false,
    pagaEstimativa = false,
    ehFactoring = false,
    ehSecuritizadora = false,
  } = dados;

  const obrigada = (
    receitaTotalAnterior > CONSTANTES.LIMITE_RECEITA_LUCRO_REAL  // Art. 257, I
    || ehInstituicaoFinanceira    // Art. 257, II
    || temLucroExterior           // Art. 257, III
    || temBeneficioFiscalIsencao  // Art. 257, IV
    || pagaEstimativa             // Art. 257, V
    || ehFactoring                // Art. 257, VI
    || ehSecuritizadora           // Art. 257, VII
  );

  const motivos = [];
  if (receitaTotalAnterior > CONSTANTES.LIMITE_RECEITA_LUCRO_REAL)
    motivos.push(`Receita > R$ ${CONSTANTES.LIMITE_RECEITA_LUCRO_REAL.toLocaleString('pt-BR')} (Art. 257, I)`);
  if (ehInstituicaoFinanceira) motivos.push('Instituição financeira (Art. 257, II)');
  if (temLucroExterior) motivos.push('Lucros do exterior (Art. 257, III)');
  if (temBeneficioFiscalIsencao) motivos.push('Benefício fiscal de isenção/redução (Art. 257, IV)');
  if (pagaEstimativa) motivos.push('Paga por estimativa mensal (Art. 257, V)');
  if (ehFactoring) motivos.push('Atividade de factoring (Art. 257, VI)');
  if (ehSecuritizadora) motivos.push('Securitizadora de créditos (Art. 257, VII)');

  return { obrigada, motivos, artigo: 'Art. 257' };
}

// ============================================================================
// BLOCO 12 — SALDO NEGATIVO DE IRPJ (Art. 235)
// ============================================================================

/**
 * Calcula saldo negativo de IRPJ (crédito da empresa)
 *
 * @param {number} irpjDevido       - IRPJ calculado no período
 * @param {number} retencoesFonte   - IRRF retido na fonte
 * @param {number} estimativasPagas - Estimativas pagas durante o ano
 * @param {number} taxaSelic        - Taxa SELIC acumulada para atualização
 * @returns {Object}
 */
function calcularSaldoNegativo(irpjDevido, retencoesFonte, estimativasPagas, taxaSelic = 0) {
  const totalPago = retencoesFonte + estimativasPagas;
  const saldoNegativo = totalPago - irpjDevido;

  if (saldoNegativo <= 0) {
    return {
      temSaldoNegativo: false,
      irpjAPagar: Math.abs(saldoNegativo),
    };
  }

  return {
    temSaldoNegativo: true,
    valorOriginal: saldoNegativo,
    atualizacaoSelic: saldoNegativo * taxaSelic,
    valorAtualizado: saldoNegativo * (1 + taxaSelic),
    compensacao: 'Via PER/DCOMP (compensação com outros tributos federais)',
    restituicao: 'Possível via PER/DCOMP (mais demorado)',
    prazoDecadencial: '5 anos',
    alerta: 'Verificar retenções não compensadas — dinheiro potencialmente "esquecido"',
    artigo: 'Art. 235',
  };
}

// ============================================================================
// BLOCO 13 — SIMULADOR COMPLETO + OTIMIZADOR
// ============================================================================

/**
 * SIMULAÇÃO COMPLETA — Calcula tudo e identifica economia
 *
 * @param {Object} empresa - Todos os dados da empresa
 * @returns {Object} Resultado completo com otimizações
 */
function simularLucroRealCompleto(empresa) {
  const {
    // Dados contábeis
    lucroLiquidoContabil = 0,
    receitaBruta = 0,

    // Adições e Exclusões
    totalAdicoes = 0,
    totalExclusoes = 0,

    // Prejuízos
    saldoPrejuizoFiscal = 0,
    saldoBaseNegativaCSLL = 0,

    // JCP
    patrimonioLiquido = 0,
    tjlp = 0.06,
    lucrosAcumulados = 0,

    // Incentivos
    despesasIncentivos = {},

    // Retenções
    retencoesFonte = 0,
    estimativasPagas = 0,

    // Configuração
    numMeses = 12,
    ehInstituicaoFinanceira = false,
  } = empresa;

  // 1. Calcular JCP máximo
  const jcp = calcularJCP({
    patrimonioLiquido,
    tjlp,
    lucroLiquidoAntes: lucroLiquidoContabil,
    lucrosAcumulados,
    numMeses,
  });

  // 2. Lucro líquido ajustado pelo JCP (JCP é dedutível como despesa financeira)
  const lucroAjustadoJCP = lucroLiquidoContabil - jcp.jcpDedutivel;

  // 3. Calcular IRPJ SEM otimização
  const irpjSemOtimizacao = calcularIRPJLucroReal({
    lucroLiquidoContabil,
    totalAdicoes,
    totalExclusoes,
    saldoPrejuizoFiscal: 0,
    numMeses,
    incentivosDedutiveis: 0,
    retencoesFonte,
    estimativasPagas,
  });

  // 4. Calcular IRPJ COM otimização completa
  const irpjNormalParaIncentivos = Math.max(
    (lucroAjustadoJCP + totalAdicoes - totalExclusoes) * 0.70 * CONSTANTES.IRPJ_ALIQUOTA_NORMAL,
    0
  );
  const incentivos = calcularIncentivos(irpjNormalParaIncentivos, despesasIncentivos);

  const irpjComOtimizacao = calcularIRPJLucroReal({
    lucroLiquidoContabil: lucroAjustadoJCP,
    totalAdicoes,
    totalExclusoes,
    saldoPrejuizoFiscal,
    numMeses,
    incentivosDedutiveis: incentivos.totalDeducaoFinal,
    retencoesFonte,
    estimativasPagas,
  });

  // 5. CSLL
  const csll = calcularCSLL({
    lucroLiquidoContabil: lucroAjustadoJCP,
    adicoesCSLL: totalAdicoes,
    exclusoesCSLL: totalExclusoes,
    saldoBaseNegativa: saldoBaseNegativaCSLL,
    ehInstituicaoFinanceira,
  });

  // 6. Economia total
  const economiaTotalIRPJ = irpjSemOtimizacao.passo9_irpjDevido - irpjComOtimizacao.passo9_irpjDevido;
  const economiaJCP = jcp.economiaLiquida;

  return {
    // Resultado sem otimização
    semOtimizacao: {
      irpjDevido: irpjSemOtimizacao.passo9_irpjDevido,
      aliquotaEfetiva: irpjSemOtimizacao.aliquotaEfetiva,
    },

    // Resultado com otimização
    comOtimizacao: {
      irpj: irpjComOtimizacao,
      csll,
      jcp,
      incentivos,
    },

    // Mapa de economia
    economia: {
      jcp: economiaJCP,
      compensacaoPrejuizo: irpjComOtimizacao.economiaCompensacao,
      incentivos: incentivos.totalDeducaoFinal,
      totalIRPJ: economiaTotalIRPJ + economiaJCP,
      percentualEconomia: irpjSemOtimizacao.passo9_irpjDevido > 0
        ? (((economiaTotalIRPJ + economiaJCP) / irpjSemOtimizacao.passo9_irpjDevido) * 100).toFixed(2) + '%'
        : '0%',
    },

    // Tributos totais a pagar
    totalAPagar: {
      irpj: Math.max(irpjComOtimizacao.passo12_irpjAPagar, 0),
      csll: csll.csllDevida,
      total: Math.max(irpjComOtimizacao.passo12_irpjAPagar, 0) + csll.csllDevida,
    },

    // Saldo negativo
    saldoNegativo: irpjComOtimizacao.saldoNegativo
      ? calcularSaldoNegativo(
          irpjComOtimizacao.passo9_irpjDevido - irpjComOtimizacao.passo10_deducoes,
          retencoesFonte,
          estimativasPagas
        )
      : null,
  };
}

// ============================================================================
// BLOCO 14 — MAPA DE ECONOMIA TRIBUTÁRIA
// ============================================================================

/**
 * Gera o mapa completo de oportunidades de economia tributária
 *
 * @param {Object} empresa - Dados da empresa
 * @returns {Array} Lista de estratégias ordenadas por impacto
 */
function gerarMapaEconomia(empresa) {
  const estrategias = [];

  // 1. JCP
  if (empresa.patrimonioLiquido > 0) {
    const jcp = calcularJCP(empresa);
    estrategias.push({
      id: 1,
      estrategia: 'JCP — Juros sobre Capital Próprio',
      tipo: 'Dedução',
      economiaEstimada: jcp.economiaLiquida,
      complexidade: 'Baixa',
      riscoFiscal: 'Baixo',
      bloco: '5 — JCP',
      artigos: 'Art. 355-358',
      acao: `Pagar JCP de até R$ ${jcp.jcpDedutivel.toFixed(2)} no exercício`,
    });
  }

  // 2. Compensação de Prejuízos
  if (empresa.saldoPrejuizoFiscal > 0) {
    const lucroEstimado = empresa.lucroLiquidoContabil + (empresa.totalAdicoes || 0) - (empresa.totalExclusoes || 0);
    const comp = compensarPrejuizo(lucroEstimado, empresa.saldoPrejuizoFiscal);
    estrategias.push({
      id: 2,
      estrategia: 'Compensação de Prejuízos Fiscais (30%)',
      tipo: 'Dedução',
      economiaEstimada: comp.economiaTotal,
      complexidade: 'Baixa',
      riscoFiscal: 'Baixo',
      bloco: '4 — Prejuízos',
      artigos: 'Art. 261, III',
      acao: `Compensar R$ ${comp.compensacao.toFixed(2)} de prejuízos acumulados`,
    });
  }

  // 3. Incentivos Fiscais
  const incentivosDisponiveis = [
    { nome: 'PAT', impacto: 'Até 4% do IRPJ normal' },
    { nome: 'FIA + Idoso', impacto: 'Até 2% do IRPJ normal' },
    { nome: 'Lei Rouanet', impacto: 'Até 4% do IRPJ normal' },
    { nome: 'Lei do Esporte', impacto: 'Até 1% do IRPJ normal' },
  ];
  estrategias.push({
    id: 3,
    estrategia: 'Incentivos Fiscais (PAT, FIA, Rouanet, Esporte)',
    tipo: 'Dedução do IRPJ',
    economiaEstimada: null,
    impactoDescrito: 'Até ~10% do IRPJ normal combinados',
    complexidade: 'Média',
    riscoFiscal: 'Baixo',
    bloco: '7 — Incentivos',
    artigos: 'Art. 226, Art. 228, Art. 625-646',
    acao: 'Implementar PAT; fazer doações para FIA/Idoso/Rouanet',
    detalhes: incentivosDisponiveis,
  });

  // 4. Balanço de Suspensão/Redução (se anual)
  estrategias.push({
    id: 4,
    estrategia: 'Balanço de Suspensão/Redução (anual)',
    tipo: 'Timing',
    economiaEstimada: null,
    impactoDescrito: 'Variável — pode suspender 100% da estimativa em meses com prejuízo',
    complexidade: 'Média',
    riscoFiscal: 'Baixo',
    bloco: '1.4 — Suspensão/Redução',
    artigos: 'Art. 227-230',
    acao: 'Levantar balanço/balancete mensal; comparar IRPJ real vs estimativa',
  });

  // 5. Depreciação Acelerada
  estrategias.push({
    id: 5,
    estrategia: 'Depreciação Acelerada (turnos + incentivada)',
    tipo: 'Timing',
    economiaEstimada: null,
    impactoDescrito: '1% a 5% da receita em antecipação de despesa',
    complexidade: 'Média',
    riscoFiscal: 'Baixo',
    bloco: '6 — Depreciação',
    artigos: 'Art. 311-330',
    acao: 'Verificar turnos de operação; aplicar incentivos SUDAM/SUDENE se elegível',
  });

  // 6. Créditos PIS/COFINS
  estrategias.push({
    id: 6,
    estrategia: 'Maximização de Créditos PIS/COFINS',
    tipo: 'Crédito',
    economiaEstimada: null,
    impactoDescrito: '3% a 7% dos custos/insumos',
    complexidade: 'Alta',
    riscoFiscal: 'Médio',
    bloco: '11 — PIS/COFINS',
    artigos: 'Lei 10.637/02, Lei 10.833/03',
    acao: 'Revisar conceito de insumo (STJ — conceito amplo); creditar energia, aluguéis, etc.',
  });

  // 7. SUDAM/SUDENE (se aplicável)
  estrategias.push({
    id: 7,
    estrategia: 'SUDAM/SUDENE — Redução 75% IRPJ',
    tipo: 'Redução do IRPJ',
    economiaEstimada: null,
    impactoDescrito: 'Até 75% do IRPJ sobre lucro da exploração',
    complexidade: 'Alta',
    riscoFiscal: 'Baixo',
    bloco: '7.2 — SUDAM/SUDENE',
    artigos: 'Art. 615-627',
    acao: 'Verificar elegibilidade do projeto; calcular lucro da exploração',
    nota: 'Aplicável a Novo Progresso/PA (região SUDAM) — VERIFICAR PROJETO APROVADO',
  });

  // 8. Revisão de despesas indedutíveis
  estrategias.push({
    id: 8,
    estrategia: 'Reclassificação de Despesas Indedutíveis',
    tipo: 'Dedução',
    economiaEstimada: null,
    impactoDescrito: 'Variável',
    complexidade: 'Alta',
    riscoFiscal: 'Médio',
    bloco: '8 — Despesas',
    artigos: 'Art. 311',
    acao: 'Reclassificar brindes como propaganda; usar PAT ao invés de alimentação de sócios',
  });

  // Ordenar por complexidade (Baixa primeiro)
  const ordemComplexidade = { 'Baixa': 1, 'Média': 2, 'Alta': 3 };
  estrategias.sort((a, b) => ordemComplexidade[a.complexidade] - ordemComplexidade[b.complexidade]);

  return estrategias;
}

// ============================================================================
// BLOCO 15 — ÁRVORE DE DECISÃO PARA OTIMIZAÇÃO
// ============================================================================

/**
 * Árvore de decisão automatizada
 * Analisa os dados da empresa e retorna um plano de ação priorizado
 *
 * @param {Object} empresa
 * @returns {Object}
 */
function arvoreDecisaoOtimizacao(empresa) {
  const acoes = [];

  // 1. Tem lucro?
  if (empresa.lucroLiquidoContabil <= 0) {
    acoes.push({
      prioridade: 1,
      acao: 'Acumular prejuízo fiscal no LALUR Parte B',
      motivo: 'Empresa com prejuízo — não há IRPJ a pagar',
      artigo: 'Art. 261, III',
    });
    acoes.push({
      prioridade: 2,
      acao: 'Considerar regime ANUAL com balanço de suspensão',
      motivo: 'Permite suspender estimativas mensais mostrando prejuízo',
      artigo: 'Art. 227',
    });
    return { situacao: 'PREJUIZO', acoes };
  }

  // 2. Tem PL significativo?
  if (empresa.patrimonioLiquido > 0) {
    const jcp = calcularJCP(empresa);
    if (jcp.jcpDedutivel > 0) {
      acoes.push({
        prioridade: 1,
        acao: `Pagar JCP de R$ ${jcp.jcpDedutivel.toFixed(2)}`,
        economia: `R$ ${jcp.economiaLiquida.toFixed(2)} líquidos`,
        artigo: 'Art. 355-358',
      });
    }
  }

  // 3. Tem SUDAM/SUDENE?
  if (empresa.temSUDAM || empresa.temSUDENE) {
    acoes.push({
      prioridade: 2,
      acao: 'Calcular Lucro da Exploração para redução de 75% do IRPJ',
      economia: 'Até 75% do IRPJ sobre lucro da exploração',
      artigo: 'Art. 615-627',
    });
  }

  // 4. Tem investimentos em ativos?
  if (empresa.temInvestimentoAtivos) {
    acoes.push({
      prioridade: 3,
      acao: 'Aplicar depreciação acelerada (turnos + incentivada)',
      artigo: 'Art. 311-330',
    });
  }

  // 5. Tem prejuízos acumulados?
  if (empresa.saldoPrejuizoFiscal > 0) {
    acoes.push({
      prioridade: 4,
      acao: 'Compensar prejuízos fiscais (até 30%)',
      saldo: empresa.saldoPrejuizoFiscal,
      artigo: 'Art. 261, III',
    });
  }

  // 6. Incentivos
  acoes.push({
    prioridade: 5,
    acao: 'Implementar incentivos fiscais (PAT, FIA, Rouanet)',
    artigo: 'Art. 226, Art. 228',
  });

  // 7. PIS/COFINS
  acoes.push({
    prioridade: 6,
    acao: 'Maximizar créditos PIS/COFINS não-cumulativo',
    artigo: 'Lei 10.637/02, Lei 10.833/03',
  });

  return { situacao: 'LUCRO', acoes };
}

// ============================================================================
// BLOCO 16 — OBRIGAÇÕES ACESSÓRIAS (Art. 262-287)
// ============================================================================

const OBRIGACOES_ACESSORIAS = [
  {
    obrigacao: 'LALUR (Livro de Apuração do Lucro Real)',
    artigo: 'Art. 277',
    prazo: 'Anual (entregue via ECF)',
    digital: true,
    descricao: 'Parte A: ajustes; Parte B: controle de valores',
  },
  {
    obrigacao: 'Livro Diário',
    artigo: 'Art. 273',
    prazo: 'Contínuo (SPED ECD)',
    digital: true,
    descricao: 'Todas as operações dia a dia',
  },
  {
    obrigacao: 'Livro Razão',
    artigo: 'Art. 274',
    prazo: 'Contínuo (SPED ECD)',
    digital: true,
    descricao: 'Totalização por conta. Ausência = arbitramento (Art. 274, §2º)',
  },
  {
    obrigacao: 'Livro de Registro de Inventário',
    artigo: 'Art. 275, I + Art. 276',
    prazo: 'Ao final de cada período de apuração',
    digital: true,
    descricao: 'Arrolamento de mercadorias, matérias-primas, produtos',
  },
  {
    obrigacao: 'Livro de Registro de Entradas',
    artigo: 'Art. 275, II',
    prazo: 'Contínuo',
    digital: true,
    descricao: 'Registro de compras',
  },
  {
    obrigacao: 'ECF (Escrituração Contábil Fiscal)',
    artigo: 'Art. 277 + IN RFB',
    prazo: 'Último dia útil de julho do ano seguinte',
    digital: true,
    descricao: 'Substitui LALUR + DIPJ. Demonstração do lucro real.',
  },
  {
    obrigacao: 'ECD (Escrituração Contábil Digital)',
    artigo: 'Art. 265, §2º + Decreto 6.022/07',
    prazo: 'Último dia útil de maio do ano seguinte',
    digital: true,
    descricao: 'Diário e Razão digitais via SPED',
  },
  {
    obrigacao: 'Demonstração do Lucro Real',
    artigo: 'Art. 287',
    prazo: 'Ao final de cada período de apuração',
    digital: true,
    descricao: 'Lucro líquido → ajustes → lucro real (transcrita no LALUR)',
  },
  {
    obrigacao: 'Conservação de livros e documentos',
    artigo: 'Art. 278',
    prazo: 'Enquanto não prescrever/decair (mínimo 5 anos)',
    digital: false,
    descricao: 'Manter escrituração e comprovantes em boa guarda',
  },
];

// ============================================================================
// EXPORTS
// ============================================================================

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Regras gerais de compensação de prejuízos fiscais (Art. 579-580)
 * Decreto-Lei 1.598/1977, art. 64; Lei 9.065/1995, art. 15
 */
const COMPENSACAO_GERAL = {
  artigo: 'Art. 579-580',
  baseLegal: [
    'Decreto-Lei 1.598/1977, art. 64 §§1º-3º',
    'Lei 9.249/1995, art. 6º, caput e parágrafo único',
    'Lei 9.065/1995, art. 15'
  ],
  limitePorcentual: 0.30, // 30% do lucro real ajustado do período
  observacoes: [
    'O prejuízo compensável é o apurado na demonstração do lucro real e registrado no LALUR (Art. 579)',
    'A compensação pode ser total ou parcial, em um ou mais períodos, à opção do contribuinte (Art. 579 §1º)',
    'Absorção contábil de prejuízos (reservas, capital) NÃO prejudica o direito à compensação fiscal (Art. 579 §2º)',
    'O limite de 30% aplica-se somente a quem mantiver livros e documentos comprobatórios (Art. 580 §único)',
    'Não há prazo prescricional para compensação (limite é apenas percentual)'
  ],
  registroLALUR: {
    parte: 'B',
    descricao: 'O saldo de prejuízos fiscais deve ser controlado na Parte B do LALUR',
    registrosECF: {
      irpj: 'Registro M300 (Demonstração do Lucro Real — Parte A)',
      csll: 'Registro M350 (Demonstração da Base de Cálculo da CSLL — Parte A)',
      parteB: 'Registro M410/M500 (Parte B do LALUR/LACS)',
      contaReferencial: '79.01 (Prejuízo Fiscal a Compensar) / 79.02 (Base Negativa CSLL a Compensar)'
    }
  }
};

/**
 * Prejuízos não-operacionais (Art. 581-582)
 * Lei 12.973/2014, art. 43
 */
const PREJUIZOS_NAO_OPERACIONAIS = {
  artigo: 'Art. 581-582',
  baseLegal: 'Lei 12.973/2014, art. 43',
  regra: 'Prejuízos na alienação de bens do ativo imobilizado, investimento e intangível somente compensam com lucros de mesma natureza',
  limitePorcentual: 0.30, // também se aplica o limite de 30%
  tiposAtivo: [
    'Ativo imobilizado',
    'Investimento',
    'Ativo intangível',
    'Bens do ativo circulante reclassificados com intenção de venda (originalmente imobilizado/investimento/intangível)'
  ],
  excecao: {
    artigo: 'Art. 581 §único',
    descricao: 'NÃO se aplica a perdas por baixa de bens imprestáveis, obsoletos ou em desuso (mesmo que posteriormente vendidos como sucata)',
    baseLegal: 'Lei 12.973/2014, art. 43, parágrafo único'
  },
  disposicaoTransitoria: {
    artigo: 'Art. 582',
    descricao: 'Saldo de prejuízos não-operacionais formados durante vigência do art. 31 da Lei 9.249/95 segue regra do Art. 581',
    baseLegal: 'Lei 12.973/2014, art. 70'
  }
};

/**
 * Atividade rural — compensação integral (Art. 583)
 * Lei 8.023/1990, art. 14
 */
const ATIVIDADE_RURAL = {
  artigo: 'Art. 583',
  baseLegal: 'Lei 8.023/1990, art. 14',
  regra: 'Prejuízo da exploração de atividade rural pode ser compensado integralmente (sem limite de 30%)',
  semLimite30: true,
  condicao: 'Somente com resultado positivo obtido na mesma atividade rural em períodos posteriores',
  observacao: 'A atividade rural deve ser contabilizada separadamente das demais atividades da empresa'
};

/**
 * Vedações à compensação (Art. 584-586)
 */
const VEDACOES = {
  mudancaControleRamo: {
    artigo: 'Art. 584',
    baseLegal: 'Decreto-Lei 2.341/1987, art. 32',
    regra: 'VEDADA a compensação se, entre a data da apuração e da compensação, houver ocorrido CUMULATIVAMENTE: (a) modificação do controle societário E (b) mudança do ramo de atividade',
    cumulativo: true,
    observacao: 'Ambas condições devem ocorrer simultaneamente; apenas uma delas NÃO impede a compensação'
  },
  incorporacaoFusaoCisao: {
    artigo: 'Art. 585',
    baseLegal: 'Decreto-Lei 2.341/1987, art. 33',
    regra: 'A pessoa jurídica SUCESSORA por incorporação, fusão ou cisão NÃO poderá compensar prejuízos fiscais da SUCEDIDA',
    cisaoParcial: {
      artigo: 'Art. 585 §único',
      regra: 'Na cisão parcial, a CINDIDA pode compensar seus próprios prejuízos proporcionalmente à parcela REMANESCENTE do PL',
      baseLegal: 'Decreto-Lei 2.341/1987, art. 33, parágrafo único'
    }
  },
  scp: {
    artigo: 'Art. 586',
    baseLegal: 'Decreto-Lei 2.303/1986, art. 7º; Decreto-Lei 2.308/1968, art. 3º',
    regra: 'Prejuízo fiscal de SCP somente compensa com lucro real da MESMA SCP',
    vedacoes: [
      'VEDADA compensação de prejuízos entre duas ou mais SCPs',
      'VEDADA compensação entre SCP e sócio ostensivo'
    ]
  }
};

/**
 * Base negativa da CSLL — regras análogas
 * Lei 9.065/1995, art. 16; IN SRF 390/2004
 */
const BASE_NEGATIVA_CSLL = {
  artigo: 'Lei 9.065/1995, art. 16',
  normaInfralegal: 'IN SRF 390/2004',
  limitePorcentual: 0.30, // 30% da base de cálculo positiva da CSLL
  regra: 'A base de cálculo negativa da CSLL pode ser compensada com base positiva apurada em períodos subsequentes, limitada a 30%',
  registroLACS: {
    parte: 'B',
    descricao: 'O saldo de base negativa da CSLL deve ser controlado na Parte B do LACS (Livro de Apuração da CSLL)',
    registroECF: 'Registro M350 / M500'
  },
  observacoes: [
    'As mesmas vedações dos Art. 584-586 aplicam-se por analogia à CSLL',
    'Prejuízos não-operacionais da CSLL seguem mesma regra de compensação restrita',
    'Não há prazo prescricional para compensação da base negativa'
  ]
};

/**
 * Alíquotas utilizadas nos cálculos de economia
 */
const ALIQUOTAS = {
  irpj: {
    normal: 0.15,
    adicional: 0.10,
    limiteAdicionalMensal: 20000, // R$ 20.000/mês
    limiteAdicionalTrimestral: 60000, // R$ 60.000/trimestre
    limiteAdicionalAnual: 240000 // R$ 240.000/ano
  },
  csll: {
    aliquota: 0.09
  }
};

// ============================================================================
// FUNÇÕES DE CÁLCULO
// ============================================================================

/**
 * Calcula o lucro real ajustado ANTES da compensação de prejuízos.
 * Este é o valor-base sobre o qual se aplica o limite de 30%.
 *
 * @param {Object} dados
 * @param {number} dados.lucroLiquido - Lucro líquido contábil do período
 * @param {number} [dados.adicoes=0] - Total de adições ao lucro líquido (Parte A do LALUR)
 * @param {number} [dados.exclusoes=0] - Total de exclusões do lucro líquido (Parte A do LALUR)
 * @returns {Object} Lucro real ajustado antes da compensação
 *
 * Base Legal: Art. 579-580 do RIR/2018
 */
function calcularLucroRealAjustado(dados) {
  const {
    lucroLiquido,
    adicoes = 0,
    exclusoes = 0
  } = dados;

  const lucroAjustado = lucroLiquido + adicoes - exclusoes;

  return {
    lucroLiquido,
    adicoes,
    exclusoes,
    lucroRealAjustado: lucroAjustado,
    temLucro: lucroAjustado > 0,
    temPrejuizo: lucroAjustado < 0,
    artigo: 'Art. 579-580',
    observacao: lucroAjustado < 0
      ? 'Prejuízo fiscal do período — registrar na Parte B do LALUR para compensação futura'
      : 'Lucro real positivo — verificar possibilidade de compensação de prejuízos acumulados'
  };
}

/**
 * Calcula a compensação de prejuízos fiscais operacionais.
 * Aplica o limite de 30% do lucro real ajustado (Art. 580).
 *
 * @param {Object} dados
 * @param {number} dados.lucroRealAjustado - Lucro real ajustado antes da compensação (deve ser > 0)
 * @param {number} dados.saldoPrejuizoFiscal - Saldo acumulado de prejuízos fiscais operacionais na Parte B do LALUR
 * @param {boolean} [dados.atividadeRural=false] - Se o prejuízo é exclusivamente de atividade rural (Art. 583)
 * @returns {Object} Detalhamento da compensação com economia tributária
 *
 * Base Legal: Art. 580 (limite 30%) / Art. 583 (rural sem limite)
 */
function compensarPrejuizoFiscal(dados) {
  const {
    lucroRealAjustado,
    saldoPrejuizoFiscal,
    atividadeRural = false
  } = dados;

  const resultado = {
    lucroRealAjustado,
    saldoPrejuizoAnterior: saldoPrejuizoFiscal,
    compensacaoPermitida: 0,
    compensacaoEfetiva: 0,
    lucroRealAposCompensacao: lucroRealAjustado,
    saldoPrejuizoRemanescente: saldoPrejuizoFiscal,
    limitePorcentual: atividadeRural ? 1.0 : COMPENSACAO_GERAL.limitePorcentual,
    atividadeRural,
    economia: { irpj: 0, csll: 0, total: 0 },
    ajusteLalur: { tipo: 'COMPENSACAO', valor: 0, parteB: 'Baixa parcial/total do saldo de prejuízo fiscal' },
    artigo: atividadeRural ? 'Art. 583' : 'Art. 580',
    observacoes: []
  };

  // Se não há lucro, não há o que compensar
  if (lucroRealAjustado <= 0) {
    resultado.observacoes.push('Lucro real ajustado <= 0. Não há compensação possível neste período.');
    return resultado;
  }

  // Se não há saldo de prejuízo, nada a compensar
  if (saldoPrejuizoFiscal <= 0) {
    resultado.observacoes.push('Saldo de prejuízo fiscal = 0. Nada a compensar.');
    return resultado;
  }

  // Calcular compensação permitida
  if (atividadeRural) {
    // Art. 583: atividade rural — compensação integral sem limite de 30%
    resultado.compensacaoPermitida = lucroRealAjustado;
    resultado.observacoes.push('Atividade rural (Art. 583): compensação integral sem limite de 30%');
  } else {
    // Art. 580: limite de 30% do lucro real ajustado
    resultado.compensacaoPermitida = lucroRealAjustado * COMPENSACAO_GERAL.limitePorcentual;
    resultado.observacoes.push(`Limite de compensação: 30% de R$ ${lucroRealAjustado.toFixed(2)} = R$ ${resultado.compensacaoPermitida.toFixed(2)}`);
  }

  // Compensação efetiva = menor entre (limite permitido, saldo disponível)
  resultado.compensacaoEfetiva = Math.min(resultado.compensacaoPermitida, saldoPrejuizoFiscal);
  resultado.lucroRealAposCompensacao = lucroRealAjustado - resultado.compensacaoEfetiva;
  resultado.saldoPrejuizoRemanescente = saldoPrejuizoFiscal - resultado.compensacaoEfetiva;

  // Ajuste LALUR
  resultado.ajusteLalur.valor = resultado.compensacaoEfetiva;

  // Calcular economia tributária (IRPJ)
  const irpjSemCompensacao = _calcularIRPJ(lucroRealAjustado);
  const irpjComCompensacao = _calcularIRPJ(resultado.lucroRealAposCompensacao);
  resultado.economia.irpj = irpjSemCompensacao - irpjComCompensacao;

  // Observações adicionais
  if (resultado.compensacaoEfetiva < saldoPrejuizoFiscal && !atividadeRural) {
    resultado.observacoes.push(
      `Saldo remanescente de R$ ${resultado.saldoPrejuizoRemanescente.toFixed(2)} disponível para compensação em períodos futuros (sem prazo prescricional)`
    );
  }
  if (resultado.compensacaoEfetiva === saldoPrejuizoFiscal) {
    resultado.observacoes.push('Saldo de prejuízos fiscais totalmente compensado neste período');
  }

  return resultado;
}

/**
 * Calcula a compensação de base negativa da CSLL.
 * Aplica o limite de 30% da base de cálculo positiva (Lei 9.065/1995, art. 16).
 *
 * @param {Object} dados
 * @param {number} dados.baseCalculoCSLL - Base de cálculo positiva da CSLL antes da compensação
 * @param {number} dados.saldoBaseNegativa - Saldo acumulado de base negativa da CSLL no LACS
 * @returns {Object} Detalhamento da compensação com economia tributária
 *
 * Base Legal: Lei 9.065/1995, art. 16
 */
function compensarBaseNegativaCSLL(dados) {
  const {
    baseCalculoCSLL,
    saldoBaseNegativa
  } = dados;

  const resultado = {
    baseCalculoCSLL,
    saldoBaseNegativaAnterior: saldoBaseNegativa,
    compensacaoPermitida: 0,
    compensacaoEfetiva: 0,
    baseCSLLAposCompensacao: baseCalculoCSLL,
    saldoBaseNegativaRemanescente: saldoBaseNegativa,
    limitePorcentual: BASE_NEGATIVA_CSLL.limitePorcentual,
    economia: { csll: 0, total: 0 },
    ajusteLalur: { tipo: 'COMPENSACAO_CSLL', valor: 0, parteB: 'Baixa parcial/total do saldo de base negativa CSLL' },
    artigo: 'Lei 9.065/1995, art. 16',
    observacoes: []
  };

  if (baseCalculoCSLL <= 0) {
    resultado.observacoes.push('Base de cálculo da CSLL <= 0. Não há compensação possível neste período.');
    return resultado;
  }

  if (saldoBaseNegativa <= 0) {
    resultado.observacoes.push('Saldo de base negativa da CSLL = 0. Nada a compensar.');
    return resultado;
  }

  // Limite de 30%
  resultado.compensacaoPermitida = baseCalculoCSLL * BASE_NEGATIVA_CSLL.limitePorcentual;
  resultado.compensacaoEfetiva = Math.min(resultado.compensacaoPermitida, saldoBaseNegativa);
  resultado.baseCSLLAposCompensacao = baseCalculoCSLL - resultado.compensacaoEfetiva;
  resultado.saldoBaseNegativaRemanescente = saldoBaseNegativa - resultado.compensacaoEfetiva;

  // Ajuste
  resultado.ajusteLalur.valor = resultado.compensacaoEfetiva;

  // Economia CSLL
  resultado.economia.csll = resultado.compensacaoEfetiva * ALIQUOTAS.csll.aliquota;
  resultado.economia.total = resultado.economia.csll;

  resultado.observacoes.push(
    `Compensação de base negativa CSLL: 30% de R$ ${baseCalculoCSLL.toFixed(2)} = R$ ${resultado.compensacaoPermitida.toFixed(2)}`
  );
  if (resultado.saldoBaseNegativaRemanescente > 0) {
    resultado.observacoes.push(
      `Saldo remanescente de R$ ${resultado.saldoBaseNegativaRemanescente.toFixed(2)} para períodos futuros`
    );
  }

  return resultado;
}

/**
 * Calcula a compensação de prejuízos NÃO-OPERACIONAIS.
 * Art. 581: Somente compensam com lucros de mesma natureza (alienação de ativo
 * imobilizado, investimento e intangível), observado o limite de 30%.
 *
 * @param {Object} dados
 * @param {number} dados.lucroNaoOperacional - Lucro não-operacional do período (ganhos de capital em ativos)
 * @param {number} dados.saldoPrejuizoNaoOperacional - Saldo acumulado de prejuízo não-operacional na Parte B
 * @param {boolean} [dados.perdaPorObsolescencia=false] - Se a perda é por obsolescência/desuso (exceção Art. 581 §único)
 * @returns {Object} Detalhamento da compensação
 *
 * Base Legal: Art. 581 do RIR/2018 (Lei 12.973/2014, art. 43)
 */
function compensarPrejuizoNaoOperacional(dados) {
  const {
    lucroNaoOperacional,
    saldoPrejuizoNaoOperacional,
    perdaPorObsolescencia = false
  } = dados;

  const resultado = {
    lucroNaoOperacional,
    saldoPrejuizoAnterior: saldoPrejuizoNaoOperacional,
    compensacaoPermitida: 0,
    compensacaoEfetiva: 0,
    lucroNaoOperacionalAposCompensacao: lucroNaoOperacional,
    saldoPrejuizoRemanescente: saldoPrejuizoNaoOperacional,
    limitePorcentual: PREJUIZOS_NAO_OPERACIONAIS.limitePorcentual,
    economia: { irpj: 0, csll: 0, total: 0 },
    ajusteLalur: { tipo: 'COMPENSACAO_NAO_OPERACIONAL', valor: 0, parteB: 'Baixa de prejuízo não-operacional' },
    artigo: 'Art. 581',
    observacoes: []
  };

  // Exceção: obsolescência/desuso
  if (perdaPorObsolescencia) {
    resultado.observacoes.push(
      'Art. 581 §único: Perdas por bens imprestáveis, obsoletos ou em desuso NÃO são tratadas como prejuízo não-operacional'
    );
    resultado.artigo = 'Art. 581 §único';
    resultado.observacoes.push('Esta perda segue a regra geral de compensação (Art. 580) — compensável com qualquer lucro');
    return resultado;
  }

  if (lucroNaoOperacional <= 0) {
    resultado.observacoes.push('Não há lucro não-operacional no período. Compensação impossível.');
    return resultado;
  }

  if (saldoPrejuizoNaoOperacional <= 0) {
    resultado.observacoes.push('Saldo de prejuízo não-operacional = 0.');
    return resultado;
  }

  // Limite de 30% aplicável sobre o lucro não-operacional
  resultado.compensacaoPermitida = lucroNaoOperacional * PREJUIZOS_NAO_OPERACIONAIS.limitePorcentual;
  resultado.compensacaoEfetiva = Math.min(resultado.compensacaoPermitida, saldoPrejuizoNaoOperacional);
  resultado.lucroNaoOperacionalAposCompensacao = lucroNaoOperacional - resultado.compensacaoEfetiva;
  resultado.saldoPrejuizoRemanescente = saldoPrejuizoNaoOperacional - resultado.compensacaoEfetiva;

  resultado.ajusteLalur.valor = resultado.compensacaoEfetiva;

  // Economia
  resultado.economia.irpj = resultado.compensacaoEfetiva * ALIQUOTAS.irpj.normal;
  resultado.economia.total = resultado.economia.irpj;

  resultado.observacoes.push(
    `Prejuízo não-operacional compensa SOMENTE com lucro não-operacional (Art. 581)`,
    `Limite: 30% de R$ ${lucroNaoOperacional.toFixed(2)} = R$ ${resultado.compensacaoPermitida.toFixed(2)}`
  );

  return resultado;
}

/**
 * Verifica vedações à compensação de prejuízos fiscais (Art. 584-586).
 *
 * @param {Object} dados
 * @param {boolean} [dados.houveMudancaControle=false] - Se houve mudança de controle societário
 * @param {boolean} [dados.houveMudancaRamo=false] - Se houve mudança de ramo de atividade
 * @param {string} [dados.eventoSocietario=null] - 'INCORPORACAO', 'FUSAO', 'CISAO_TOTAL', 'CISAO_PARCIAL' ou null
 * @param {number} [dados.percentualPLRemanescente=1.0] - Percentual do PL remanescente (cisão parcial)
 * @param {boolean} [dados.ehSCP=false] - Se é Sociedade em Conta de Participação
 * @param {string} [dados.identificadorSCP=null] - Identificador da SCP (para controle)
 * @param {number} [dados.saldoPrejuizoFiscal=0] - Saldo de prejuízo para ajuste (cisão parcial)
 * @returns {Object} Análise de vedações com impactos
 *
 * Base Legal: Art. 584-586 do RIR/2018
 */
function verificarVedacoes(dados) {
  const {
    houveMudancaControle = false,
    houveMudancaRamo = false,
    eventoSocietario = null,
    percentualPLRemanescente = 1.0,
    ehSCP = false,
    identificadorSCP = null,
    saldoPrejuizoFiscal = 0
  } = dados;

  const resultado = {
    compensacaoPermitida: true,
    vedacoes: [],
    restricoes: [],
    saldoAjustado: saldoPrejuizoFiscal,
    artigos: [],
    alertas: []
  };

  // Art. 584: Mudança de controle + ramo (cumulativo)
  if (houveMudancaControle && houveMudancaRamo) {
    resultado.compensacaoPermitida = false;
    resultado.vedacoes.push({
      tipo: 'MUDANCA_CONTROLE_RAMO',
      artigo: 'Art. 584',
      baseLegal: 'Decreto-Lei 2.341/1987, art. 32',
      descricao: 'VEDADA compensação: houve modificação cumulativa de controle societário E ramo de atividade',
      saldoPerdido: saldoPrejuizoFiscal
    });
    resultado.saldoAjustado = 0;
    resultado.artigos.push('Art. 584');
  } else if (houveMudancaControle || houveMudancaRamo) {
    resultado.alertas.push({
      tipo: 'MUDANCA_PARCIAL',
      descricao: houveMudancaControle
        ? 'Houve mudança de controle societário, mas NÃO de ramo — compensação mantida (Art. 584 exige as duas condições cumulativas)'
        : 'Houve mudança de ramo de atividade, mas NÃO de controle — compensação mantida (Art. 584 exige as duas condições cumulativas)',
      artigo: 'Art. 584'
    });
    resultado.artigos.push('Art. 584');
  }

  // Art. 585: Incorporação, fusão ou cisão
  if (eventoSocietario) {
    const evento = eventoSocietario.toUpperCase();
    if (evento === 'INCORPORACAO' || evento === 'FUSAO' || evento === 'CISAO_TOTAL') {
      resultado.compensacaoPermitida = false;
      resultado.vedacoes.push({
        tipo: 'SUCESSAO',
        artigo: 'Art. 585',
        baseLegal: 'Decreto-Lei 2.341/1987, art. 33',
        descricao: `VEDADA compensação: pessoa jurídica SUCESSORA (${evento}) não pode compensar prejuízos da SUCEDIDA`,
        saldoPerdido: saldoPrejuizoFiscal
      });
      resultado.saldoAjustado = 0;
      resultado.artigos.push('Art. 585');
    } else if (evento === 'CISAO_PARCIAL') {
      // Na cisão parcial, a cindida pode compensar proporcionalmente ao PL remanescente
      const saldoAjustadoCisao = saldoPrejuizoFiscal * percentualPLRemanescente;
      const saldoPerdido = saldoPrejuizoFiscal - saldoAjustadoCisao;

      resultado.restricoes.push({
        tipo: 'CISAO_PARCIAL',
        artigo: 'Art. 585 §único',
        baseLegal: 'Decreto-Lei 2.341/1987, art. 33, parágrafo único',
        descricao: `Cisão parcial: compensação proporcional ao PL remanescente (${(percentualPLRemanescente * 100).toFixed(1)}%)`,
        saldoOriginal: saldoPrejuizoFiscal,
        saldoAjustado: saldoAjustadoCisao,
        saldoPerdido
      });
      resultado.saldoAjustado = saldoAjustadoCisao;
      resultado.artigos.push('Art. 585 §único');
    }
  }

  // Art. 586: SCP
  if (ehSCP) {
    resultado.restricoes.push({
      tipo: 'SCP',
      artigo: 'Art. 586',
      baseLegal: 'Decreto-Lei 2.303/1986, art. 7º',
      descricao: `Prejuízo da SCP ${identificadorSCP || '(não identificada)'} somente compensa com lucro da MESMA SCP`,
      vedacoes: [
        'VEDADA compensação entre SCPs distintas',
        'VEDADA compensação entre SCP e sócio ostensivo'
      ]
    });
    resultado.artigos.push('Art. 586');
  }

  return resultado;
}

/**
 * Realiza a compensação integrada de prejuízos fiscais (operacionais + não-operacionais)
 * e base negativa da CSLL em um único período de apuração.
 *
 * @param {Object} dados
 * @param {number} dados.lucroLiquido - Lucro líquido contábil do período
 * @param {number} [dados.adicoes=0] - Adições ao LALUR (Parte A)
 * @param {number} [dados.exclusoes=0] - Exclusões do LALUR (Parte A)
 * @param {number} [dados.saldoPrejuizoOperacional=0] - Saldo na Parte B: prejuízos operacionais
 * @param {number} [dados.saldoPrejuizoNaoOperacional=0] - Saldo na Parte B: prejuízos não-operacionais
 * @param {number} [dados.saldoBaseNegativaCSLL=0] - Saldo na Parte B do LACS: base negativa CSLL
 * @param {number} [dados.lucroNaoOperacional=0] - Lucro não-operacional do período (ganhos de capital)
 * @param {boolean} [dados.atividadeRural=false] - Se se trata de atividade rural (Art. 583)
 * @param {boolean} [dados.trimestral=true] - Se apuração é trimestral
 * @returns {Object} Resultado completo da compensação integrada
 *
 * Base Legal: Art. 579-586 do RIR/2018
 */
function compensarIntegrado(dados) {
  const {
    lucroLiquido,
    adicoes = 0,
    exclusoes = 0,
    saldoPrejuizoOperacional = 0,
    saldoPrejuizoNaoOperacional = 0,
    saldoBaseNegativaCSLL = 0,
    lucroNaoOperacional = 0,
    atividadeRural = false,
    trimestral = true
  } = dados;

  // 1. Calcular lucro real ajustado antes da compensação
  const lucroAjustado = calcularLucroRealAjustado({ lucroLiquido, adicoes, exclusoes });

  const resultado = {
    etapa1_lucroAjustado: lucroAjustado,
    etapa2_compensacaoNaoOperacional: null,
    etapa3_compensacaoOperacional: null,
    etapa4_compensacaoCSLL: null,
    resumo: {
      lucroRealAntes: lucroAjustado.lucroRealAjustado,
      totalCompensado: 0,
      lucroRealFinal: lucroAjustado.lucroRealAjustado,
      baseCSLLFinal: lucroAjustado.lucroRealAjustado,
      saldosPosCompensacao: {
        prejuizoOperacional: saldoPrejuizoOperacional,
        prejuizoNaoOperacional: saldoPrejuizoNaoOperacional,
        baseNegativaCSLL: saldoBaseNegativaCSLL
      },
      economia: { irpj: 0, csll: 0, total: 0 }
    },
    artigo: 'Art. 579-586',
    trimestral
  };

  // Se lucro ajustado <= 0, registra prejuízo e retorna
  if (lucroAjustado.lucroRealAjustado <= 0) {
    const novoPrejuizo = Math.abs(lucroAjustado.lucroRealAjustado);

    // Classificar o prejuízo: separar operacional de não-operacional
    // Simplificação: se há prejuízo não-operacional no período, ele é segregado
    const prejNaoOp = lucroNaoOperacional < 0 ? Math.abs(lucroNaoOperacional) : 0;
    const prejOp = novoPrejuizo - prejNaoOp;

    resultado.resumo.novoPrejuizoOperacional = Math.max(0, prejOp);
    resultado.resumo.novoPrejuizoNaoOperacional = prejNaoOp;
    resultado.resumo.saldosPosCompensacao.prejuizoOperacional = saldoPrejuizoOperacional + Math.max(0, prejOp);
    resultado.resumo.saldosPosCompensacao.prejuizoNaoOperacional = saldoPrejuizoNaoOperacional + prejNaoOp;
    resultado.resumo.saldosPosCompensacao.baseNegativaCSLL = saldoBaseNegativaCSLL + novoPrejuizo;
    resultado.resumo.lucroRealFinal = 0;
    resultado.resumo.baseCSLLFinal = 0;
    resultado.resumo.observacao = `Prejuízo fiscal no período: R$ ${novoPrejuizo.toFixed(2)} — registrar na Parte B do LALUR/LACS`;

    return resultado;
  }

  let lucroRealCorrente = lucroAjustado.lucroRealAjustado;
  let baseCSLLCorrente = lucroAjustado.lucroRealAjustado;

  // 2. Compensar prejuízos NÃO-OPERACIONAIS primeiro (se houver lucro não-operacional)
  if (lucroNaoOperacional > 0 && saldoPrejuizoNaoOperacional > 0) {
    const compNaoOp = compensarPrejuizoNaoOperacional({
      lucroNaoOperacional,
      saldoPrejuizoNaoOperacional
    });
    resultado.etapa2_compensacaoNaoOperacional = compNaoOp;

    // O valor compensado do prejuízo não-operacional reduz o lucro real geral
    lucroRealCorrente -= compNaoOp.compensacaoEfetiva;
    baseCSLLCorrente -= compNaoOp.compensacaoEfetiva;
    resultado.resumo.totalCompensado += compNaoOp.compensacaoEfetiva;
    resultado.resumo.saldosPosCompensacao.prejuizoNaoOperacional = compNaoOp.saldoPrejuizoRemanescente;
  }

  // 3. Compensar prejuízos OPERACIONAIS (sobre lucro restante, com limite de 30%)
  if (lucroRealCorrente > 0 && saldoPrejuizoOperacional > 0) {
    const compOp = compensarPrejuizoFiscal({
      lucroRealAjustado: lucroRealCorrente,
      saldoPrejuizoFiscal: saldoPrejuizoOperacional,
      atividadeRural
    });
    resultado.etapa3_compensacaoOperacional = compOp;

    lucroRealCorrente = compOp.lucroRealAposCompensacao;
    baseCSLLCorrente -= compOp.compensacaoEfetiva;
    resultado.resumo.totalCompensado += compOp.compensacaoEfetiva;
    resultado.resumo.saldosPosCompensacao.prejuizoOperacional = compOp.saldoPrejuizoRemanescente;
    resultado.resumo.economia.irpj += compOp.economia.irpj;
  }

  // 4. Compensar base negativa da CSLL (análogo, sobre base da CSLL)
  if (baseCSLLCorrente > 0 && saldoBaseNegativaCSLL > 0) {
    const compCSLL = compensarBaseNegativaCSLL({
      baseCalculoCSLL: baseCSLLCorrente,
      saldoBaseNegativa: saldoBaseNegativaCSLL
    });
    resultado.etapa4_compensacaoCSLL = compCSLL;

    baseCSLLCorrente = compCSLL.baseCSLLAposCompensacao;
    resultado.resumo.saldosPosCompensacao.baseNegativaCSLL = compCSLL.saldoBaseNegativaRemanescente;
    resultado.resumo.economia.csll += compCSLL.economia.csll;
  }

  // Resumo final
  resultado.resumo.lucroRealFinal = Math.max(0, lucroRealCorrente);
  resultado.resumo.baseCSLLFinal = Math.max(0, baseCSLLCorrente);
  resultado.resumo.economia.total = resultado.resumo.economia.irpj + resultado.resumo.economia.csll;

  return resultado;
}

/**
 * Simula a compensação de prejuízos ao longo de múltiplos períodos (planejamento plurianual).
 * Projeta quantos períodos serão necessários para absorver o saldo de prejuízos.
 *
 * @param {Object} dados
 * @param {number} dados.saldoPrejuizoFiscal - Saldo atual de prejuízo fiscal operacional
 * @param {number} dados.saldoBaseNegativaCSLL - Saldo atual de base negativa CSLL
 * @param {number} dados.lucroProjetadoAnual - Lucro real anual projetado (antes da compensação)
 * @param {number} [dados.saldoPrejuizoNaoOperacional=0] - Saldo de prejuízo não-operacional
 * @param {number} [dados.lucroNaoOperacionalProjetado=0] - Lucro não-op anual projetado
 * @param {number} [dados.anosProjecao=10] - Número de anos para projetar
 * @param {boolean} [dados.atividadeRural=false] - Se é atividade rural
 * @returns {Object} Projeção plurianual de compensação
 *
 * Base Legal: Art. 579-586 do RIR/2018
 */
function simularCompensacaoPluranual(dados) {
  const {
    saldoPrejuizoFiscal,
    saldoBaseNegativaCSLL,
    lucroProjetadoAnual,
    saldoPrejuizoNaoOperacional = 0,
    lucroNaoOperacionalProjetado = 0,
    anosProjecao = 10,
    atividadeRural = false
  } = dados;

  const projecao = [];
  let saldoPF = saldoPrejuizoFiscal;
  let saldoBN = saldoBaseNegativaCSLL;
  let saldoPNO = saldoPrejuizoNaoOperacional;
  let totalEconomiaIRPJ = 0;
  let totalEconomiaCSLL = 0;
  let anoZeroPrejuizoFiscal = null;
  let anoZeroBaseNegativa = null;

  for (let ano = 1; ano <= anosProjecao; ano++) {
    let lucroOp = lucroProjetadoAnual;
    let lucroNO = lucroNaoOperacionalProjetado;

    // Compensação não-operacional
    let compNO = 0;
    if (lucroNO > 0 && saldoPNO > 0) {
      const limNO = lucroNO * 0.30;
      compNO = Math.min(limNO, saldoPNO);
      saldoPNO -= compNO;
      lucroOp -= compNO;
    }

    // Compensação operacional
    let compOp = 0;
    if (lucroOp > 0 && saldoPF > 0) {
      const limite = atividadeRural ? lucroOp : lucroOp * 0.30;
      compOp = Math.min(limite, saldoPF);
      saldoPF -= compOp;
    }

    // Compensação CSLL
    let compCSLL = 0;
    const baseCSLL = lucroProjetadoAnual - compNO - compOp;
    if (baseCSLL > 0 && saldoBN > 0) {
      const limCSLL = baseCSLL * 0.30;
      compCSLL = Math.min(limCSLL, saldoBN);
      saldoBN -= compCSLL;
    }

    const economiaIRPJ = _calcularIRPJ(lucroProjetadoAnual) - _calcularIRPJ(lucroProjetadoAnual - compOp - compNO);
    const economiaCSLL = compCSLL * ALIQUOTAS.csll.aliquota;
    totalEconomiaIRPJ += economiaIRPJ;
    totalEconomiaCSLL += economiaCSLL;

    if (saldoPF <= 0 && anoZeroPrejuizoFiscal === null) anoZeroPrejuizoFiscal = ano;
    if (saldoBN <= 0 && anoZeroBaseNegativa === null) anoZeroBaseNegativa = ano;

    projecao.push({
      ano,
      lucroProjetado: lucroProjetadoAnual,
      compensacaoOperacional: compOp,
      compensacaoNaoOperacional: compNO,
      compensacaoCSLL: compCSLL,
      lucroRealFinal: lucroProjetadoAnual - compOp - compNO,
      baseCSLLFinal: Math.max(0, baseCSLL - compCSLL),
      saldoPrejuizoFiscal: saldoPF,
      saldoBaseNegativaCSLL: saldoBN,
      saldoPrejuizoNaoOperacional: saldoPNO,
      economiaIRPJ,
      economiaCSLL,
      economiaTotalAno: economiaIRPJ + economiaCSLL
    });

    // Se tudo compensado, parar
    if (saldoPF <= 0 && saldoBN <= 0 && saldoPNO <= 0) break;
  }

  return {
    projecao,
    resumo: {
      saldoInicialPrejuizoFiscal: saldoPrejuizoFiscal,
      saldoInicialBaseNegativaCSLL: saldoBaseNegativaCSLL,
      saldoInicialPrejuizoNaoOperacional: saldoPrejuizoNaoOperacional,
      anosParaZerarPrejuizo: anoZeroPrejuizoFiscal || `>${anosProjecao}`,
      anosParaZerarBaseNegativa: anoZeroBaseNegativa || `>${anosProjecao}`,
      totalEconomiaIRPJ,
      totalEconomiaCSLL,
      totalEconomia: totalEconomiaIRPJ + totalEconomiaCSLL,
      saldoFinal: {
        prejuizoFiscal: saldoPF,
        baseNegativaCSLL: saldoBN,
        prejuizoNaoOperacional: saldoPNO
      }
    },
    artigo: 'Art. 579-586',
    atividadeRural
  };
}

/**
 * Registra o prejuízo fiscal do período na Parte B do LALUR.
 *
 * @param {Object} dados
 * @param {number} dados.prejuizoFiscal - Prejuízo fiscal apurado no período (valor positivo)
 * @param {number} [dados.saldoAnterior=0] - Saldo anterior na Parte B do LALUR
 * @param {string} [dados.tipoPrejuizo='OPERACIONAL'] - 'OPERACIONAL' ou 'NAO_OPERACIONAL'
 * @param {string} [dados.periodoApuracao=''] - Período de apuração (ex: '1T2025', '2T2025')
 * @param {boolean} [dados.ehCSLL=false] - Se é base negativa da CSLL (LACS) ao invés de IRPJ (LALUR)
 * @returns {Object} Registro para Parte B do LALUR/LACS
 *
 * Base Legal: Art. 579 do RIR/2018
 */
function registrarPrejuizoParteB(dados) {
  const {
    prejuizoFiscal,
    saldoAnterior = 0,
    tipoPrejuizo = 'OPERACIONAL',
    periodoApuracao = '',
    ehCSLL = false
  } = dados;

  const livro = ehCSLL ? 'LACS' : 'LALUR';
  const contaRef = ehCSLL ? '79.02' : (tipoPrejuizo === 'NAO_OPERACIONAL' ? '79.03' : '79.01');

  return {
    livro,
    parte: 'B',
    contaReferencial: contaRef,
    tipoPrejuizo,
    periodoApuracao,
    saldoAnterior,
    valorRegistrado: prejuizoFiscal,
    saldoAtual: saldoAnterior + prejuizoFiscal,
    natureza: 'CREDORA',
    descricao: ehCSLL
      ? `Base negativa da CSLL — ${periodoApuracao}`
      : `Prejuízo fiscal ${tipoPrejuizo.toLowerCase()} — ${periodoApuracao}`,
    registroECF: ehCSLL ? 'M500' : 'M410',
    artigo: 'Art. 579',
    observacao: 'O saldo deve ser mantido enquanto não integralmente compensado (sem prazo prescricional)'
  };
}

/**
 * Registra a utilização (baixa) de prejuízo fiscal na Parte B do LALUR.
 *
 * @param {Object} dados
 * @param {number} dados.valorCompensado - Valor efetivamente compensado
 * @param {number} dados.saldoAnterior - Saldo anterior na Parte B
 * @param {string} [dados.tipoPrejuizo='OPERACIONAL'] - 'OPERACIONAL' ou 'NAO_OPERACIONAL'
 * @param {string} [dados.periodoApuracao=''] - Período de apuração
 * @param {boolean} [dados.ehCSLL=false] - Se é LACS ao invés de LALUR
 * @returns {Object} Registro de baixa na Parte B
 *
 * Base Legal: Art. 580 do RIR/2018
 */
function registrarUtilizacaoParteB(dados) {
  const {
    valorCompensado,
    saldoAnterior,
    tipoPrejuizo = 'OPERACIONAL',
    periodoApuracao = '',
    ehCSLL = false
  } = dados;

  const livro = ehCSLL ? 'LACS' : 'LALUR';
  const novoSaldo = Math.max(0, saldoAnterior - valorCompensado);

  return {
    livro,
    parte: 'B',
    tipoPrejuizo,
    periodoApuracao,
    saldoAnterior,
    valorBaixado: valorCompensado,
    saldoAtual: novoSaldo,
    natureza: 'DEVEDORA',
    tipo: 'UTILIZACAO',
    descricao: ehCSLL
      ? `Compensação de base negativa da CSLL — ${periodoApuracao}`
      : `Compensação de prejuízo fiscal ${tipoPrejuizo.toLowerCase()} — ${periodoApuracao}`,
    registroECF: ehCSLL ? 'M500' : 'M410',
    artigo: 'Art. 580',
    comprovacao: 'Manter livros e documentos comprobatórios do prejuízo utilizado (Art. 580 §único)'
  };
}

/**
 * Gera o relatório consolidado do Bloco A.
 *
 * @param {Object} dados
 * @param {Object} [dados.compensacao] - Resultado de compensarIntegrado()
 * @param {Object} [dados.vedacoes] - Resultado de verificarVedacoes()
 * @param {Object} [dados.projecao] - Resultado de simularCompensacaoPluranual()
 * @returns {Object} Relatório consolidado
 */
function gerarRelatorioA(dados) {
  const { compensacao, vedacoes, projecao } = dados;

  const resultado = {
    bloco: 'A — Compensação de Prejuízos Fiscais',
    artigos: 'Art. 579-586 do RIR/2018',
    dataGeracao: new Date().toISOString(),
    secoes: {},
    economia: { irpj: 0, csll: 0, total: 0 }
  };

  if (compensacao) {
    resultado.secoes.compensacao = {
      lucroRealAntes: compensacao.resumo.lucroRealAntes,
      totalCompensado: compensacao.resumo.totalCompensado,
      lucroRealFinal: compensacao.resumo.lucroRealFinal,
      baseCSLLFinal: compensacao.resumo.baseCSLLFinal,
      saldosRemanescentes: compensacao.resumo.saldosPosCompensacao,
      economia: compensacao.resumo.economia
    };
    resultado.economia = compensacao.resumo.economia;
  }

  if (vedacoes) {
    resultado.secoes.vedacoes = {
      compensacaoPermitida: vedacoes.compensacaoPermitida,
      vedacoesIdentificadas: vedacoes.vedacoes.length,
      restricoes: vedacoes.restricoes.length,
      detalhes: vedacoes.vedacoes.concat(vedacoes.restricoes)
    };
  }

  if (projecao) {
    resultado.secoes.projecao = {
      anosParaZerarPrejuizo: projecao.resumo.anosParaZerarPrejuizo,
      anosParaZerarBaseNegativa: projecao.resumo.anosParaZerarBaseNegativa,
      totalEconomiaProjetada: projecao.resumo.totalEconomia,
      saldoFinal: projecao.resumo.saldoFinal,
      anosSimulados: projecao.projecao.length
    };
  }

  return resultado;
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Calcula o IRPJ (15% + adicional 10%) sobre um valor de lucro real.
 * @param {number} lucroReal - Valor do lucro real (anual)
 * @returns {number} Valor do IRPJ devido
 * @private
 */
function _calcularIRPJ(lucroReal) {
  if (lucroReal <= 0) return 0;
  const normal = lucroReal * ALIQUOTAS.irpj.normal;
  const baseAdicional = Math.max(0, lucroReal - ALIQUOTAS.irpj.limiteAdicionalAnual);
  const adicional = baseAdicional * ALIQUOTAS.irpj.adicional;
  return normal + adicional;
}

/**
 * Calcula o IRPJ trimestral.
 * @param {number} lucroReal - Valor do lucro real (trimestral)
 * @returns {number} Valor do IRPJ devido
 * @private
 */
function _calcularIRPJTrimestral(lucroReal) {
  if (lucroReal <= 0) return 0;
  const normal = lucroReal * ALIQUOTAS.irpj.normal;
  const baseAdicional = Math.max(0, lucroReal - ALIQUOTAS.irpj.limiteAdicionalTrimestral);
  const adicional = baseAdicional * ALIQUOTAS.irpj.adicional;
  return normal + adicional;
}

// ============================================================================
// EXPORTS
// ============================================================================


// ============================================================================
// EXEMPLOS DE USO
// ============================================================================


// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Limites para PDD — Perdas no Recebimento de Créditos (Art. 347)
 * Contratos inadimplidos A PARTIR de 08/10/2014
 */
const LIMITES_PDD_ATUAIS = {
  semGarantia: [
    { limiteInferior: 0, limiteSuperior: 15000, prazoMeses: 6, exigeJudicial: false, exigeAdministrativa: false, descricao: 'Até R$ 15.000 — vencidos > 6 meses — sem exigência judicial' },
    { limiteInferior: 15000.01, limiteSuperior: 100000, prazoMeses: 12, exigeJudicial: false, exigeAdministrativa: true, descricao: 'R$ 15.000 a R$ 100.000 — vencidos > 1 ano — cobrança administrativa mantida' },
    { limiteInferior: 100000.01, limiteSuperior: Infinity, prazoMeses: 12, exigeJudicial: true, exigeAdministrativa: false, descricao: '> R$ 100.000 — vencidos > 1 ano — exige procedimentos judiciais' }
  ],
  comGarantia: [
    { limiteInferior: 0, limiteSuperior: 50000, prazoMeses: 24, exigeJudicial: false, descricao: 'Até R$ 50.000 — vencidos > 2 anos — sem exigência judicial' },
    { limiteInferior: 50000.01, limiteSuperior: Infinity, prazoMeses: 24, exigeJudicial: true, descricao: '> R$ 50.000 — vencidos > 2 anos — exige procedimentos judiciais' }
  ]
};

/**
 * Limites para PDD — Contratos inadimplidos ANTES de 08/10/2014 (Art. 347 §2º)
 */
const LIMITES_PDD_ANTIGOS = {
  semGarantia: [
    { limiteInferior: 0, limiteSuperior: 5000, prazoMeses: 6, exigeJudicial: false, exigeAdministrativa: false, descricao: 'Até R$ 5.000 — vencidos > 6 meses' },
    { limiteInferior: 5000.01, limiteSuperior: 30000, prazoMeses: 12, exigeJudicial: false, exigeAdministrativa: true, descricao: 'R$ 5.000 a R$ 30.000 — vencidos > 1 ano — cobrança administrativa' },
    { limiteInferior: 30000.01, limiteSuperior: Infinity, prazoMeses: 12, exigeJudicial: true, exigeAdministrativa: false, descricao: '> R$ 30.000 — vencidos > 1 ano — exige judicial' }
  ],
  comGarantia: [
    { limiteInferior: 0, limiteSuperior: Infinity, prazoMeses: 24, exigeJudicial: true, descricao: 'Qualquer valor — vencidos > 2 anos — exige judicial' }
  ]
};

/**
 * Provisões dedutíveis vs indedutíveis (Art. 339-346)
 */
const PROVISOES = {
  dedutiveis: [
    { id: 'FERIAS', nome: 'Férias de empregados', artigo: 'Art. 342', regra: 'Proporcional à remuneração × dias de direito + encargos sociais' },
    { id: '13_SALARIO', nome: 'Décimo terceiro salário', artigo: 'Art. 343', regra: '1/12 da remuneração × nº meses do período + encargos sociais' },
    { id: 'TECNICAS_SEGURO', nome: 'Provisões técnicas — seguradoras', artigo: 'Art. 340', regra: 'Exigidas pela legislação especial (SUSEP/ANS/PREVIC)' },
    { id: 'ESTOQUE_LIVROS', nome: 'Perda de estoques de livros', artigo: 'Art. 341', regra: '1/3 do valor do estoque no último dia do período' },
    { id: 'PDD', nome: 'Perdas no recebimento de créditos', artigo: 'Art. 347', regra: 'Conforme faixas de valor, prazo e garantia' }
  ],
  indedutiveis: [
    { id: 'IR', nome: 'Provisão para Imposto de Renda', artigo: 'Art. 344 §único', regra: 'Obrigatória mas NÃO dedutível' },
    { id: 'CSLL', nome: 'CSLL', artigo: 'Art. 352 §6º', regra: 'Valor da CSLL não dedutível do lucro real' },
    { id: 'CONTINGENCIAS', nome: 'Contingências trabalhistas/cíveis/tributárias', artigo: 'Art. 339', regra: 'Somente provisões expressamente autorizadas são dedutíveis' },
    { id: 'IMPAIRMENT', nome: 'Redução ao valor recuperável (impairment)', artigo: 'Art. 345', regra: 'Só reconhecida no lucro real na alienação/baixa do bem' },
    { id: 'DESMONTAGEM', nome: 'Gastos estimados de desmontagem', artigo: 'Art. 346', regra: 'Só dedutíveis quando efetivamente incorridos' },
    { id: 'OSCILACAO_PRECOS', nome: 'Oscilação de preços de estoques', artigo: 'Art. 310 II', regra: 'Proibida redução por provisão para oscilação' },
    { id: 'DESVALORIZACAO_ESTOQUE', nome: 'Desvalorização global de estoques', artigo: 'Art. 310 I', regra: 'Proibidas reduções globais de valores inventariados' }
  ]
};

/**
 * Despesas indedutíveis explícitas (Art. 311-316, 352)
 */
const DESPESAS_INDEDUTIVEIS = [
  { id: 'GRATIFICACAO_DIRIGENTES', artigo: 'Art. 315', descricao: 'Gratificações ou participações no resultado a dirigentes/administradores' },
  { id: 'PAGAMENTO_SEM_CAUSA', artigo: 'Art. 316 I', descricao: 'Pagamentos sem indicação da operação ou causa' },
  { id: 'BENEFICIARIO_NAO_IDENTIFICADO', artigo: 'Art. 316 II', descricao: 'Pagamentos cujo beneficiário não é individualizado no comprovante' },
  { id: 'IRPJ_PROPRIO', artigo: 'Art. 352 §2º', descricao: 'IRPJ de que a PJ é sujeito passivo (contribuinte ou substituto)' },
  { id: 'CSLL', artigo: 'Art. 352 §6º', descricao: 'Valor da CSLL' },
  { id: 'MULTAS_FISCAIS_PUNITIVAS', artigo: 'Art. 352 §5º', descricao: 'Multas por infrações fiscais que resultem em falta/insuficiência de pagamento' },
  { id: 'ATIVO_IMOBILIZADO_DIRETO', artigo: 'Art. 313', descricao: 'Custo de aquisição de bens do ativo imobilizado e intangível (> R$ 1.200 e vida > 1 ano)' },
  { id: 'DEPRECIACAO_SEM_RELACAO', artigo: 'Art. 317 §5º', descricao: 'Depreciação de bens não relacionados com produção/comercialização' },
  { id: 'DEPRECIACAO_LEASING', artigo: 'Art. 317 §6º', descricao: 'Depreciação de bem em arrendamento mercantil pela arrendatária' },
  { id: 'DESPESAS_PESSOAIS_TITULAR', artigo: 'Art. 314 §2º', descricao: 'Despesas pessoais do titular de empresa individual sem relação com atividade' },
  { id: 'PROVISOES_NAO_AUTORIZADAS', artigo: 'Art. 339', descricao: 'Provisões não expressamente autorizadas pelo RIR' },
  { id: 'TRIBUTOS_EXIGIBILIDADE_SUSPENSA', artigo: 'Art. 352 §1º', descricao: 'Impostos/contribuições com exigibilidade suspensa (depósito judicial, liminar, etc.)' }
];

/**
 * Despesas dedutíveis com limites ou condições (Art. 311-316)
 */
const DESPESAS_COM_LIMITES = [
  { id: 'BEM_PEQUENO_VALOR', artigo: 'Art. 313 §1º I', limite: 1200, descricao: 'Bem com valor unitário ≤ R$ 1.200 pode ser despesa direta (não ativar)' },
  { id: 'BEM_VIDA_CURTA', artigo: 'Art. 313 §1º II', limite: null, descricao: 'Bem com vida útil ≤ 1 ano pode ser despesa direta' },
  { id: 'CONSUMO_EVENTUAL', artigo: 'Art. 302 §1º', limite: 0.05, descricao: 'Bens de consumo eventual ≤ 5% do custo total dos produtos vendidos' },
  { id: 'MULTAS_COMPENSATORIAS', artigo: 'Art. 352 §5º', limite: null, descricao: 'Multas compensatórias e por infrações SEM falta/insuficiência de pagamento são dedutíveis' },
  { id: 'REPAROS_CONSERVACAO', artigo: 'Art. 354', limite: null, descricao: 'Dedutíveis se para manter condições eficientes; se aumentar vida útil > 1 ano, capitalizar' },
  { id: 'FGTS', artigo: 'Art. 353', limite: null, descricao: 'Depósitos FGTS são despesa operacional, incluindo diretores não empregados' }
];

/**
 * Tipos de garantia para classificação de créditos (Art. 347 §4º)
 */
const TIPOS_GARANTIA = [
  { id: 'RESERVA_DOMINIO', descricao: 'Venda com reserva de domínio' },
  { id: 'ALIENACAO_FIDUCIARIA', descricao: 'Alienação fiduciária em garantia' },
  { id: 'GARANTIA_REAL', descricao: 'Operações com outras garantias reais' }
];

/**
 * Indicadores de omissão de receita (Art. 293-299) — complementa verificarCompliance do motor
 */
const INDICADORES_OMISSAO = [
  { id: 'SALDO_CREDOR_CAIXA', artigo: 'Art. 293 I', gravidade: 'CRITICO', descricao: 'Indicação na escrituração de saldo credor de caixa' },
  { id: 'FALTA_ESCRITURACAO_PAGAMENTO', artigo: 'Art. 293 II', gravidade: 'CRITICO', descricao: 'Falta de escrituração de pagamentos efetuados' },
  { id: 'PASSIVO_FICTICIO', artigo: 'Art. 293 III', gravidade: 'CRITICO', descricao: 'Manutenção no passivo de obrigações já pagas ou inexigíveis' },
  { id: 'SUPRIMENTO_CAIXA', artigo: 'Art. 294', gravidade: 'ALTO', descricao: 'Recursos fornecidos por sócios/administradores sem comprovação de origem' },
  { id: 'FALTA_NOTA_FISCAL', artigo: 'Art. 295', gravidade: 'CRITICO', descricao: 'Falta de emissão de NF ou emissão com valor inferior à operação' },
  { id: 'DEPOSITOS_SEM_ORIGEM', artigo: 'Art. 299', gravidade: 'ALTO', descricao: 'Créditos em conta bancária sem comprovação de origem' },
  { id: 'DIVERGENCIA_ESTOQUE', artigo: 'Art. 298', gravidade: 'MEDIO', descricao: 'Diferença no levantamento quantitativo de matérias-primas/produtos' }
];

/**
 * Métodos de avaliação de estoques aceitos (Art. 304-310)
 */
const METODOS_ESTOQUE = {
  permitidos: [
    { id: 'CUSTO_MEDIO', artigo: 'Art. 307', descricao: 'Custo médio ponderado' },
    { id: 'PEPS', artigo: 'Art. 307', descricao: 'Custo dos bens adquiridos/produzidos mais recentemente (PEPS/FIFO)' },
    { id: 'PRECO_VENDA_MARGEM', artigo: 'Art. 307', descricao: 'Preço de venda menos margem de lucro' },
    { id: 'MERCADO_RURAL', artigo: 'Art. 309', descricao: 'Preços correntes de mercado — apenas produtos agrícolas, animais e extrativos' }
  ],
  semCustoIntegrado: {
    materiaisProcessamento: { artigo: 'Art. 308 I', formula: 'MAX(1,5 × maior custo MP no período; 80% do valor produtos acabados)' },
    produtosAcabados: { artigo: 'Art. 308 II', formula: '70% do maior preço de venda no período (com ICMS)' }
  },
  vedacoes: [
    'Reduções globais de valores inventariados (Art. 310 I)',
    'Depreciações estimadas ou provisões para oscilação de preços (Art. 310 II)',
    'Estoques básicos a preços constantes ou nominais (Art. 310 III)',
    'Provisão de ajuste ao valor de mercado se menor que custo (Art. 310 IV)'
  ]
};

/**
 * Taxas de depreciação fiscal (Art. 317-329) — tabela expandida
 */
const DEPRECIACAO_FISCAL = {
  taxasAnuais: {
    edificios: { taxa: 0.04, vidaUtil: 25, artigo: 'Art. 318 I' },
    instalacoes: { taxa: 0.10, vidaUtil: 10, artigo: 'Art. 319' },
    maquinas: { taxa: 0.10, vidaUtil: 10, artigo: 'Art. 319' },
    moveis: { taxa: 0.10, vidaUtil: 10, artigo: 'Art. 319' },
    veiculosPassageiro: { taxa: 0.20, vidaUtil: 5, artigo: 'Art. 319' },
    veiculosCarga: { taxa: 0.20, vidaUtil: 5, artigo: 'Art. 319' },
    computadores: { taxa: 0.20, vidaUtil: 5, artigo: 'Art. 319' },
    software: { taxa: 0.20, vidaUtil: 5, artigo: 'Art. 319' },
    ferramentas: { taxa: 0.20, vidaUtil: 5, artigo: 'Art. 319' },
    tratores: { taxa: 0.25, vidaUtil: 4, artigo: 'Art. 319' },
    drones: { taxa: 0.20, vidaUtil: 5, artigo: 'Art. 319' },
    gps_topografia: { taxa: 0.20, vidaUtil: 5, artigo: 'Art. 319' }
  },
  aceleracaoTurnos: {
    1: 1.0,   // Art. 323 I
    2: 1.5,   // Art. 323 II
    3: 2.0    // Art. 323 III
  },
  aceleradaIncentivada: {
    atividadeRural: { taxa: 1.0, artigo: 'Art. 325', descricao: 'Depreciação integral no ano (exceto terra nua)' },
    pesquisaInovacao: { taxa: 1.0, artigo: 'Art. 326', descricao: 'Depreciação integral no ano — máquinas novas para P&D' },
    sudamSudene: { taxa: 1.0, artigo: 'Art. 329', descricao: 'Depreciação integral no ano ou até 4º ano subsequente', prazoMaximo: 5 },
    veiculosCarga3x: { taxa: null, multiplicador: 3, artigo: 'Art. 328', descricao: 'Taxa normal × 3 — veículos de carga (Lei 12.788/2013)', vigencia: '01/09/2012 a 31/12/2012' }
  }
};

/**
 * Limites de ativo que pode ir direto para despesa (Art. 313 §1º)
 */
const LIMITE_ATIVO_DESPESA = 1200; // R$ 1.200,00

// ============================================================================
// FUNÇÕES DE CÁLCULO
// ============================================================================

/**
 * Analisa a dedutibilidade de uma despesa segundo o RIR/2018.
 * Retorna se a despesa é dedutível, parcialmente dedutível, ou indedutível.
 *
 * @param {Object} dados
 * @param {string} dados.tipo - Tipo da despesa (ID de DESPESAS_INDEDUTIVEIS ou DESPESAS_COM_LIMITES)
 * @param {number} dados.valor - Valor da despesa em R$
 * @param {number} [dados.custoTotalProdutosVendidos] - CPV do período anterior (para consumo eventual)
 * @param {number} [dados.vidaUtilAnos] - Vida útil do bem em anos (para decisão ativar vs despesa)
 * @param {boolean} [dados.relacionadoProducao=true] - Se o bem/despesa está relacionado à produção
 * @returns {Object} Análise de dedutibilidade
 *
 * Base Legal: Art. 311-316 do RIR/2018
 */
function analisarDedutibilidade(dados) {
  const { tipo, valor = 0, custoTotalProdutosVendidos, vidaUtilAnos, relacionadoProducao = true } = dados;

  if (!tipo || valor < 0) {
    return { erro: 'Tipo de despesa e valor positivo são obrigatórios' };
  }

  // Verificar se está na lista de indedutíveis
  const indedutivel = DESPESAS_INDEDUTIVEIS.find(d => d.id === tipo);
  if (indedutivel) {
    return {
      tipo,
      valor,
      dedutivel: false,
      valorDedutivel: 0,
      valorIndedutivel: valor,
      motivoIndedutibilidade: indedutivel.descricao,
      artigo: indedutivel.artigo,
      ajusteLalur: 'ADICAO',
      descricaoAjuste: `Adicionar R$ ${valor.toFixed(2)} ao lucro líquido na Parte A do LALUR`
    };
  }

  // Verificar limites especiais
  const resultado = {
    tipo,
    valor,
    dedutivel: true,
    valorDedutivel: valor,
    valorIndedutivel: 0,
    artigo: 'Art. 311',
    ajusteLalur: null,
    observacoes: []
  };

  // Art. 313 §1º: Bem de pequeno valor
  if (tipo === 'ATIVO_IMOBILIZADO') {
    if (valor <= LIMITE_ATIVO_DESPESA) {
      resultado.dedutivel = true;
      resultado.valorDedutivel = valor;
      resultado.artigo = 'Art. 313 §1º I';
      resultado.observacoes.push(`Valor unitário ≤ R$ ${LIMITE_ATIVO_DESPESA} — pode ser despesa direta`);
    } else if (vidaUtilAnos && vidaUtilAnos <= 1) {
      resultado.dedutivel = true;
      resultado.valorDedutivel = valor;
      resultado.artigo = 'Art. 313 §1º II';
      resultado.observacoes.push('Vida útil ≤ 1 ano — pode ser despesa direta');
    } else {
      resultado.dedutivel = false;
      resultado.valorDedutivel = 0;
      resultado.valorIndedutivel = valor;
      resultado.artigo = 'Art. 313';
      resultado.ajusteLalur = 'ATIVAR';
      resultado.observacoes.push('Deve ser ativado e depreciado/amortizado. Não pode ser despesa direta.');
    }
  }

  // Art. 302 §1º: Consumo eventual
  if (tipo === 'CONSUMO_EVENTUAL' && custoTotalProdutosVendidos) {
    const limite = custoTotalProdutosVendidos * 0.05;
    if (valor <= limite) {
      resultado.dedutivel = true;
      resultado.valorDedutivel = valor;
      resultado.artigo = 'Art. 302 §1º';
      resultado.observacoes.push(`Dentro do limite de 5% do CPV anterior (R$ ${limite.toFixed(2)})`);
    } else {
      resultado.dedutivel = true;
      resultado.valorDedutivel = limite;
      resultado.valorIndedutivel = valor - limite;
      resultado.artigo = 'Art. 302 §1º';
      resultado.ajusteLalur = 'ADICAO_PARCIAL';
      resultado.observacoes.push(`Excesso de R$ ${(valor - limite).toFixed(2)} sobre limite de 5% do CPV`);
    }
  }

  // Art. 354: Reparos e conservação
  if (tipo === 'REPARO_CONSERVACAO') {
    if (!relacionadoProducao) {
      resultado.dedutivel = false;
      resultado.valorDedutivel = 0;
      resultado.valorIndedutivel = valor;
      resultado.artigo = 'Art. 354 §3º';
      resultado.observacoes.push('Não relacionado com produção/comercialização — indedutível');
    } else if (vidaUtilAnos && vidaUtilAnos > 1) {
      resultado.dedutivel = false;
      resultado.valorDedutivel = 0;
      resultado.valorIndedutivel = valor;
      resultado.artigo = 'Art. 354 §1º';
      resultado.ajusteLalur = 'ATIVAR';
      resultado.observacoes.push('Reparo que aumenta vida útil > 1 ano — deve capitalizar');
    }
  }

  // Art. 352 §5º: Multas
  if (tipo === 'MULTA_FISCAL') {
    resultado.artigo = 'Art. 352 §5º';
    resultado.observacoes.push('Apenas multas compensatórias e por infrações sem falta de pagamento são dedutíveis');
  }

  return resultado;
}

/**
 * Calcula a PDD (Provisão para Devedores Duvidosos) dedutível segundo Art. 347.
 * Analisa cada crédito individualmente e determina se pode ser registrado como perda.
 *
 * @param {Array<Object>} creditos - Lista de créditos a analisar
 * @param {number} creditos[].valor - Valor do crédito
 * @param {string} creditos[].dataVencimento - Data de vencimento (ISO)
 * @param {boolean} creditos[].possuiGarantia - Se possui garantia real
 * @param {string} [creditos[].tipoGarantia] - Tipo da garantia (RESERVA_DOMINIO, ALIENACAO_FIDUCIARIA, GARANTIA_REAL)
 * @param {boolean} [creditos[].devedorInsolvente=false] - Declaração judicial de insolvência
 * @param {boolean} [creditos[].devedorFalido=false] - Devedor declarado falido
 * @param {boolean} [creditos[].devedorRecuperacaoJudicial=false] - Devedor em recuperação judicial
 * @param {number} [creditos[].valorComprometidoRJ=0] - Valor comprometido a pagar na RJ
 * @param {boolean} [creditos[].cobrandoJudicialmente=false] - Se há procedimentos judiciais em curso
 * @param {boolean} [creditos[].cobrandoAdministrativamente=false] - Se há cobrança administrativa
 * @param {boolean} [creditos[].devedorParteRelacionada=false] - Se devedor é parte relacionada (Art. 347 §7º)
 * @param {string} [creditos[].dataInadimplencia] - Data da inadimplência (para regime antigo/novo)
 * @param {string} [creditos[].identificacao] - Identificação do crédito
 * @param {string} dataReferencia - Data de referência para cálculo (ISO)
 * @returns {Object} Análise completa da PDD
 *
 * Base Legal: Art. 347-351 do RIR/2018 (Lei 9.430/96, art. 9º a 12)
 */
function calcularPDD(creditos, dataReferencia) {
  if (!creditos || !Array.isArray(creditos) || creditos.length === 0) {
    return { erro: 'Informe ao menos um crédito para análise' };
  }

  const dataRef = new Date(dataReferencia || new Date().toISOString());
  const DATA_CORTE = new Date('2014-10-08');

  const resultado = {
    dataReferencia: dataRef.toISOString().split('T')[0],
    totalCreditos: 0,
    totalDedutivel: 0,
    totalIndedutivel: 0,
    creditosAnalisados: [],
    resumoPorMotivo: {},
    alertas: [],
    baseLegal: 'Art. 347-351 do RIR/2018 (Lei 9.430/96, art. 9º a 12)'
  };

  creditos.forEach((credito, idx) => {
    const analise = _analisarCreditoPDD(credito, dataRef, DATA_CORTE, idx);
    resultado.creditosAnalisados.push(analise);
    resultado.totalCreditos += credito.valor || 0;

    if (analise.dedutivel) {
      resultado.totalDedutivel += analise.valorDedutivel;
    }
    resultado.totalIndedutivel += analise.valorIndedutivel;

    // Resumo por motivo
    const motivo = analise.motivo || 'NAO_ATENDE_REQUISITOS';
    if (!resultado.resumoPorMotivo[motivo]) {
      resultado.resumoPorMotivo[motivo] = { quantidade: 0, valor: 0 };
    }
    resultado.resumoPorMotivo[motivo].quantidade++;
    resultado.resumoPorMotivo[motivo].valor += analise.valorDedutivel;
  });

  resultado.economia = {
    irpj: resultado.totalDedutivel * 0.25,
    csll: resultado.totalDedutivel * 0.09,
    total: resultado.totalDedutivel * 0.34,
    descricao: 'Economia tributária por reconhecer perdas dedutíveis (IRPJ 25% + CSLL 9%)'
  };

  return resultado;
}

/**
 * Analisa um crédito individual para fins de PDD
 * @private
 */
function _analisarCreditoPDD(credito, dataRef, dataCorteLei, idx) {
  const {
    valor = 0,
    dataVencimento,
    possuiGarantia = false,
    devedorInsolvente = false,
    devedorFalido = false,
    devedorRecuperacaoJudicial = false,
    valorComprometidoRJ = 0,
    cobrandoJudicialmente = false,
    cobrandoAdministrativamente = false,
    devedorParteRelacionada = false,
    dataInadimplencia,
    identificacao = `Crédito #${idx + 1}`
  } = credito;

  const analise = {
    identificacao,
    valor,
    dedutivel: false,
    valorDedutivel: 0,
    valorIndedutivel: valor,
    motivo: null,
    artigo: null,
    requisitosAtendidos: [],
    requisitosNaoAtendidos: [],
    observacoes: []
  };

  // Art. 347 §7º: Partes relacionadas — VEDADO
  if (devedorParteRelacionada) {
    analise.motivo = 'PARTE_RELACIONADA_VEDADO';
    analise.artigo = 'Art. 347 §7º';
    analise.requisitosNaoAtendidos.push('Devedor é parte relacionada (controladora, controlada, coligada, sócio, administrador ou parente até 3º grau)');
    return analise;
  }

  // Art. 347 §1º I: Devedor insolvente por sentença judicial
  if (devedorInsolvente) {
    analise.dedutivel = true;
    analise.valorDedutivel = valor;
    analise.valorIndedutivel = 0;
    analise.motivo = 'INSOLVENCIA_JUDICIAL';
    analise.artigo = 'Art. 347 §1º I';
    analise.requisitosAtendidos.push('Declaração de insolvência por sentença judicial');
    return analise;
  }

  // Art. 347 §1º IV: Devedor falido ou em recuperação judicial
  if (devedorFalido || devedorRecuperacaoJudicial) {
    const valorDedutivel = Math.max(0, valor - valorComprometidoRJ);
    analise.dedutivel = valorDedutivel > 0;
    analise.valorDedutivel = valorDedutivel;
    analise.valorIndedutivel = valor - valorDedutivel;
    analise.motivo = devedorFalido ? 'DEVEDOR_FALIDO' : 'RECUPERACAO_JUDICIAL';
    analise.artigo = 'Art. 347 §1º IV';
    analise.requisitosAtendidos.push(
      devedorFalido ? 'Devedor declarado falido' : 'Devedor em recuperação judicial'
    );
    if (valorComprometidoRJ > 0) {
      analise.observacoes.push(`Parcela comprometida na RJ: R$ ${valorComprometidoRJ.toFixed(2)} — não dedutível. Dedutível: R$ ${valorDedutivel.toFixed(2)}`);
    }
    if (!cobrandoJudicialmente) {
      analise.observacoes.push('ATENÇÃO: Art. 347 §5º exige adoção de procedimentos judiciais para recebimento');
    }
    return analise;
  }

  // Determinar se usa limites novos ou antigos
  const dataInadimpl = dataInadimplencia ? new Date(dataInadimplencia) : new Date(dataVencimento);
  const usarLimitesAntigos = dataInadimpl < dataCorteLei;
  const limites = usarLimitesAntigos ? LIMITES_PDD_ANTIGOS : LIMITES_PDD_ATUAIS;

  if (usarLimitesAntigos) {
    analise.observacoes.push('Usando limites antigos (inadimplência anterior a 08/10/2014)');
  }

  // Calcular meses vencidos
  if (!dataVencimento) {
    analise.requisitosNaoAtendidos.push('Data de vencimento não informada');
    analise.motivo = 'SEM_DATA_VENCIMENTO';
    return analise;
  }

  const dataVenc = new Date(dataVencimento);
  const mesesVencidos = _calcularMesesEntre(dataVenc, dataRef);

  // Selecionar faixa
  const tipoCredito = possuiGarantia ? 'comGarantia' : 'semGarantia';
  const faixas = limites[tipoCredito];
  const faixa = faixas.find(f => valor >= f.limiteInferior && valor <= f.limiteSuperior);

  if (!faixa) {
    analise.motivo = 'FAIXA_NAO_ENCONTRADA';
    return analise;
  }

  analise.artigo = usarLimitesAntigos ? 'Art. 347 §2º' : 'Art. 347 §1º';

  // Verificar prazo
  if (mesesVencidos < faixa.prazoMeses) {
    analise.requisitosNaoAtendidos.push(`Prazo insuficiente: ${mesesVencidos} meses (mínimo: ${faixa.prazoMeses} meses)`);
    analise.motivo = 'PRAZO_INSUFICIENTE';
    analise.observacoes.push(`Faltam ${faixa.prazoMeses - mesesVencidos} meses para atingir prazo mínimo`);
    return analise;
  }
  analise.requisitosAtendidos.push(`Prazo atendido: ${mesesVencidos} meses ≥ ${faixa.prazoMeses} meses`);

  // Verificar exigência judicial
  if (faixa.exigeJudicial && !cobrandoJudicialmente) {
    analise.requisitosNaoAtendidos.push('Exige procedimentos judiciais iniciados e mantidos');
    analise.motivo = 'FALTA_COBRANCA_JUDICIAL';
    analise.observacoes.push('Iniciar e manter cobrança judicial para tornar dedutível');
    return analise;
  }
  if (faixa.exigeJudicial) {
    analise.requisitosAtendidos.push('Cobrança judicial em curso');
  }

  // Verificar exigência administrativa
  if (faixa.exigeAdministrativa && !cobrandoAdministrativamente) {
    analise.requisitosNaoAtendidos.push('Exige cobrança administrativa mantida');
    analise.motivo = 'FALTA_COBRANCA_ADMINISTRATIVA';
    return analise;
  }
  if (faixa.exigeAdministrativa) {
    analise.requisitosAtendidos.push('Cobrança administrativa mantida');
  }

  // Todos os requisitos atendidos
  analise.dedutivel = true;
  analise.valorDedutivel = valor;
  analise.valorIndedutivel = 0;
  analise.motivo = possuiGarantia ? 'COM_GARANTIA_ATENDE' : 'SEM_GARANTIA_ATENDE';
  analise.observacoes.push(faixa.descricao);

  return analise;
}

/**
 * Calcula meses entre duas datas
 * @private
 */
function _calcularMesesEntre(dataInicio, dataFim) {
  const anos = dataFim.getFullYear() - dataInicio.getFullYear();
  const meses = dataFim.getMonth() - dataInicio.getMonth();
  return anos * 12 + meses;
}

/**
 * Calcula provisões dedutíveis de férias e 13º salário (Art. 342-343).
 *
 * @param {Array<Object>} empregados - Lista de empregados
 * @param {number} empregados[].remuneracaoMensal - Remuneração mensal bruta
 * @param {number} empregados[].diasFeriasDevidos - Dias de férias já adquiridos
 * @param {number} empregados[].meses13Devidos - Meses trabalhados para 13º no período
 * @param {number} [taxaEncargos=0.36] - % encargos sociais (INSS patronal + RAT + terceiros + FGTS)
 * @param {number} numMesesPeriodo - Número de meses do período de apuração (1-12)
 * @returns {Object} Cálculo das provisões
 *
 * Base Legal: Art. 342 e 343 do RIR/2018
 */
function calcularProvisoesTrabalhistas(empregados, taxaEncargos = 0.36, numMesesPeriodo = 12) {
  if (!empregados || !Array.isArray(empregados) || empregados.length === 0) {
    return { erro: 'Informe ao menos um empregado' };
  }

  let totalProvisaoFerias = 0;
  let totalProvisao13 = 0;
  const detalhes = [];

  empregados.forEach((emp, idx) => {
    const { remuneracaoMensal = 0, diasFeriasDevidos = 0, meses13Devidos = 0 } = emp;

    // Art. 342: Férias — base na remuneração × dias de direito / 30 + 1/3 constitucional + encargos
    const feriasBruto = (remuneracaoMensal / 30) * diasFeriasDevidos;
    const tercoFerias = feriasBruto / 3;
    const feriasComTerco = feriasBruto + tercoFerias;
    const encargosFerias = feriasComTerco * taxaEncargos;
    const provisaoFerias = feriasComTerco + encargosFerias;

    // Art. 343: 13º — 1/12 da remuneração × meses + encargos
    const base13 = (remuneracaoMensal / 12) * meses13Devidos;
    const encargos13 = base13 * taxaEncargos;
    const provisao13 = base13 + encargos13;

    totalProvisaoFerias += provisaoFerias;
    totalProvisao13 += provisao13;

    detalhes.push({
      empregado: emp.nome || `Empregado #${idx + 1}`,
      remuneracaoMensal,
      provisaoFerias: Math.round(provisaoFerias * 100) / 100,
      provisao13: Math.round(provisao13 * 100) / 100,
      diasFeriasDevidos,
      meses13Devidos
    });
  });

  totalProvisaoFerias = Math.round(totalProvisaoFerias * 100) / 100;
  totalProvisao13 = Math.round(totalProvisao13 * 100) / 100;
  const totalGeral = totalProvisaoFerias + totalProvisao13;

  return {
    provisaoFerias: {
      total: totalProvisaoFerias,
      artigo: 'Art. 342',
      dedutivel: true,
      descricao: 'Provisão para férias (remuneração + 1/3 + encargos sociais)'
    },
    provisao13Salario: {
      total: totalProvisao13,
      artigo: 'Art. 343',
      dedutivel: true,
      descricao: 'Provisão para 13º salário (1/12 × meses + encargos sociais)'
    },
    totalProvisoes: totalGeral,
    economia: {
      irpj: totalGeral * 0.25,
      csll: totalGeral * 0.09,
      total: totalGeral * 0.34,
      descricao: 'Economia por dedução das provisões trabalhistas'
    },
    taxaEncargosUtilizada: taxaEncargos,
    numEmpregados: empregados.length,
    detalhes,
    baseLegal: 'Art. 342-343 do RIR/2018'
  };
}

/**
 * Calcula depreciação fiscal completa de um bem conforme Art. 317-329.
 * Inclui: normal, turnos, incentivada, bens usados.
 *
 * @param {Object} bem
 * @param {string} bem.tipo - Tipo do bem (chave de DEPRECIACAO_FISCAL.taxasAnuais)
 * @param {number} bem.custoAquisicao - Custo de aquisição em R$
 * @param {number} [bem.depreciacaoAcumulada=0] - Depreciação já acumulada
 * @param {boolean} [bem.usado=false] - Se é bem usado
 * @param {number} [bem.vidaUtilRestante] - Vida útil restante (anos) para bens usados
 * @param {number} [bem.turnos=1] - Número de turnos (1, 2 ou 3)
 * @param {string} [bem.incentivo] - Tipo de incentivo (atividadeRural, pesquisaInovacao, sudamSudene)
 * @param {number} [bem.mesesUso=12] - Meses de uso no período
 * @param {boolean} [bem.relacionadoProducao=true] - Se é relacionado à produção
 * @returns {Object} Cálculo completo da depreciação
 *
 * Base Legal: Art. 317-329 do RIR/2018
 */
function calcularDepreciacaoCompleta(bem) {
  const {
    tipo,
    custoAquisicao = 0,
    depreciacaoAcumulada = 0,
    usado = false,
    vidaUtilRestante,
    turnos = 1,
    incentivo,
    mesesUso = 12,
    relacionadoProducao = true
  } = bem;

  if (!tipo || custoAquisicao <= 0) {
    return { erro: 'Tipo do bem e custo de aquisição positivo são obrigatórios' };
  }

  // Art. 317 §5º: Verificar relação com produção
  if (!relacionadoProducao) {
    return {
      tipo,
      custoAquisicao,
      depreciacaoPeriodo: 0,
      dedutivel: false,
      artigo: 'Art. 317 §5º',
      motivo: 'Bem não relacionado com produção/comercialização — depreciação indedutível'
    };
  }

  // Art. 313 §1º: Bem de pequeno valor — despesa direta
  if (custoAquisicao <= LIMITE_ATIVO_DESPESA) {
    return {
      tipo,
      custoAquisicao,
      depreciacaoPeriodo: custoAquisicao,
      dedutivel: true,
      artigo: 'Art. 313 §1º I',
      motivo: `Valor ≤ R$ ${LIMITE_ATIVO_DESPESA} — dedução integral como despesa`
    };
  }

  const infoBem = DEPRECIACAO_FISCAL.taxasAnuais[tipo];
  if (!infoBem) {
    return { erro: `Tipo de bem '${tipo}' não encontrado na tabela de depreciação` };
  }

  // Art. 322: Taxa para bens usados
  let taxaAnual = infoBem.taxa;
  let vidaUtilEfetiva = infoBem.vidaUtil;

  if (usado) {
    const metadeVidaNovo = infoBem.vidaUtil / 2;
    const restante = vidaUtilRestante || metadeVidaNovo;
    vidaUtilEfetiva = Math.max(metadeVidaNovo, restante);
    taxaAnual = 1 / vidaUtilEfetiva;
  }

  // Art. 323: Aceleração por turnos (apenas bens móveis, não edificios)
  let multiplicadorTurnos = 1;
  if (tipo !== 'edificios' && turnos >= 2) {
    multiplicadorTurnos = DEPRECIACAO_FISCAL.aceleracaoTurnos[turnos] || 1;
  }

  // Depreciação normal ajustada
  const taxaEfetiva = taxaAnual * multiplicadorTurnos;
  const depreciacaoAnualBruta = custoAquisicao * taxaEfetiva;

  // Proporcional ao período de uso
  const fatorProporcional = mesesUso / 12;
  let depreciacaoPeriodo = depreciacaoAnualBruta * fatorProporcional;

  // Art. 317 §3º: Limite — não ultrapassar custo de aquisição
  const saldoDepreciavel = Math.max(0, custoAquisicao - depreciacaoAcumulada);
  depreciacaoPeriodo = Math.min(depreciacaoPeriodo, saldoDepreciavel);

  // Depreciação incentivada (Art. 324-329)
  let depreciacaoIncentivada = 0;
  let exclusaoLalur = 0;
  let adicaoFuturaLalur = false;

  if (incentivo && DEPRECIACAO_FISCAL.aceleradaIncentivada[incentivo]) {
    const inc = DEPRECIACAO_FISCAL.aceleradaIncentivada[incentivo];

    if (inc.taxa === 1.0) {
      // Depreciação integral no ano
      depreciacaoIncentivada = Math.max(0, saldoDepreciavel - depreciacaoPeriodo);
      exclusaoLalur = depreciacaoIncentivada;
    } else if (inc.multiplicador) {
      const depreciacaoAcelerada = custoAquisicao * taxaAnual * inc.multiplicador * fatorProporcional;
      depreciacaoIncentivada = Math.max(0, Math.min(depreciacaoAcelerada - depreciacaoPeriodo, saldoDepreciavel - depreciacaoPeriodo));
      exclusaoLalur = depreciacaoIncentivada;
    }

    adicaoFuturaLalur = true;
  }

  const depreciacaoTotalPeriodo = depreciacaoPeriodo + depreciacaoIncentivada;
  const novaDepreciacaoAcumulada = depreciacaoAcumulada + depreciacaoTotalPeriodo;

  // Art. 324 §3º / 321 §único: Quando acumulada atinge custo, depreciação contábil vira adição
  const limiteAtingido = novaDepreciacaoAcumulada >= custoAquisicao;

  return {
    tipo,
    custoAquisicao,
    depreciacaoAcumuladaAnterior: depreciacaoAcumulada,
    saldoDepreciavelAnterior: saldoDepreciavel,
    taxaNormal: infoBem.taxa,
    taxaEfetiva,
    multiplicadorTurnos,
    mesesUso,
    depreciacaoNormal: Math.round(depreciacaoPeriodo * 100) / 100,
    depreciacaoIncentivada: Math.round(depreciacaoIncentivada * 100) / 100,
    exclusaoLalur: Math.round(exclusaoLalur * 100) / 100,
    depreciacaoTotalPeriodo: Math.round(depreciacaoTotalPeriodo * 100) / 100,
    novaDepreciacaoAcumulada: Math.round(novaDepreciacaoAcumulada * 100) / 100,
    saldoDepreciavelRestante: Math.round(Math.max(0, custoAquisicao - novaDepreciacaoAcumulada) * 100) / 100,
    limiteAtingido,
    adicaoFuturaLalur,
    dedutivel: true,
    vidaUtilEfetiva,
    bemUsado: usado,
    incentivo: incentivo || null,
    artigos: _montarArtigosDepreciacao(usado, turnos, incentivo),
    economia: {
      irpj: depreciacaoTotalPeriodo * 0.25,
      csll: depreciacaoTotalPeriodo * 0.09,
      total: depreciacaoTotalPeriodo * 0.34
    },
    alertas: limiteAtingido
      ? ['Limite de depreciação atingido. A partir do próximo período, depreciação contábil deverá ser ADICIONADA ao lucro real (Art. 324 §3º / Art. 321 §único)']
      : []
  };
}

/**
 * Monta lista de artigos relevantes para a depreciação
 * @private
 */
function _montarArtigosDepreciacao(usado, turnos, incentivo) {
  const artigos = ['Art. 317 (dedutibilidade)', 'Art. 319 (quota)', 'Art. 320 (taxa anual)'];
  if (usado) artigos.push('Art. 322 (bens usados)');
  if (turnos > 1) artigos.push('Art. 323 (aceleração por turnos)');
  if (incentivo === 'atividadeRural') artigos.push('Art. 325 (atividade rural)');
  if (incentivo === 'pesquisaInovacao') artigos.push('Art. 326 (P&D)');
  if (incentivo === 'sudamSudene') artigos.push('Art. 329 (SUDAM/SUDENE)');
  return artigos;
}

/**
 * Calcula amortização de bens intangíveis e direitos (Art. 330-335).
 *
 * @param {Object} ativo
 * @param {string} ativo.descricao - Descrição do ativo
 * @param {string} ativo.tipo - Tipo (PATENTE, LICENCA, CONTRATO, BENFEITORIA, SOFTWARE, FLORESTA, PD_INOVACAO, INTANGIVEL)
 * @param {number} ativo.custoAquisicao - Custo de aquisição em R$
 * @param {number} ativo.prazoAnos - Prazo de vida útil/contratual em anos
 * @param {number} [ativo.amortizacaoAcumulada=0] - Amortização acumulada
 * @param {number} [ativo.mesesUso=12] - Meses de uso no período
 * @param {boolean} [ativo.pesquisaInovacao=false] - Se é vinculado a P&D/inovação (Art. 335)
 * @param {boolean} [ativo.relacionadoProducao=true] - Se relacionado com produção/comercialização
 * @returns {Object} Cálculo da amortização
 *
 * Base Legal: Art. 330-335 do RIR/2018
 */
function calcularAmortizacao(ativo) {
  const {
    descricao = 'Ativo intangível',
    tipo = 'INTANGIVEL',
    custoAquisicao = 0,
    prazoAnos = 0,
    amortizacaoAcumulada = 0,
    mesesUso = 12,
    pesquisaInovacao = false,
    relacionadoProducao = true
  } = ativo;

  if (custoAquisicao <= 0 || prazoAnos <= 0) {
    return { erro: 'Custo de aquisição e prazo (em anos) devem ser positivos' };
  }

  // Art. 330 §4º: Somente se relacionado à produção/comercialização
  if (!relacionadoProducao) {
    return {
      descricao,
      custoAquisicao,
      amortizacaoPeriodo: 0,
      dedutivel: false,
      artigo: 'Art. 330 §4º',
      motivo: 'Não relacionado com produção/comercialização'
    };
  }

  // Art. 333: Taxa anual = 1 / prazo restante
  const taxaAnual = 1 / prazoAnos;
  const saldoAmortizavel = Math.max(0, custoAquisicao - amortizacaoAcumulada);

  // Amortização normal proporcional
  const fatorProporcional = mesesUso / 12;
  let amortizacaoNormal = custoAquisicao * taxaAnual * fatorProporcional;
  amortizacaoNormal = Math.min(amortizacaoNormal, saldoAmortizavel);

  // Art. 335: Amortização acelerada incentivada — P&D/Inovação
  let amortizacaoIncentivada = 0;
  let exclusaoLalur = 0;

  if (pesquisaInovacao) {
    // Dedução integral no próprio período
    amortizacaoIncentivada = Math.max(0, saldoAmortizavel - amortizacaoNormal);
    exclusaoLalur = amortizacaoIncentivada;
  }

  const amortizacaoTotal = amortizacaoNormal + amortizacaoIncentivada;
  const novaAmortizacaoAcumulada = amortizacaoAcumulada + amortizacaoTotal;

  // Art. 330 §3º: Se o direito se extinguir antes da amortização integral
  const direitoExtinto = novaAmortizacaoAcumulada < custoAquisicao && prazoAnos <= 0;
  const saldoADeduzir = direitoExtinto ? (custoAquisicao - novaAmortizacaoAcumulada) : 0;

  return {
    descricao,
    tipo,
    custoAquisicao,
    prazoAnos,
    taxaAnual: Math.round(taxaAnual * 10000) / 10000,
    amortizacaoNormal: Math.round(amortizacaoNormal * 100) / 100,
    amortizacaoIncentivada: Math.round(amortizacaoIncentivada * 100) / 100,
    exclusaoLalur: Math.round(exclusaoLalur * 100) / 100,
    amortizacaoTotalPeriodo: Math.round(amortizacaoTotal * 100) / 100,
    novaAmortizacaoAcumulada: Math.round(novaAmortizacaoAcumulada * 100) / 100,
    saldoAmortizavelRestante: Math.round(Math.max(0, custoAquisicao - novaAmortizacaoAcumulada) * 100) / 100,
    dedutivel: true,
    direitoExtinto,
    saldoADeduzirExtincao: Math.round(saldoADeduzir * 100) / 100,
    artigos: pesquisaInovacao
      ? ['Art. 330 (dedutibilidade)', 'Art. 333 (taxa anual)', 'Art. 335 (acelerada P&D)']
      : ['Art. 330 (dedutibilidade)', 'Art. 332-333 (quota e taxa)'],
    economia: {
      irpj: amortizacaoTotal * 0.25,
      csll: amortizacaoTotal * 0.09,
      total: amortizacaoTotal * 0.34
    }
  };
}

/**
 * Calcula exaustão de recursos minerais ou florestais (Art. 336-337).
 *
 * @param {Object} recurso
 * @param {string} recurso.tipo - 'MINERAL' ou 'FLORESTAL'
 * @param {number} recurso.custoAquisicao - Custo de aquisição/prospecção
 * @param {number} recurso.volumeTotal - Volume total estimado (possança da mina ou nº árvores)
 * @param {number} recurso.volumeExplorado - Volume explorado no período
 * @param {number} [recurso.exaustaoAcumulada=0] - Exaustão já acumulada
 * @param {number} [recurso.prazoConcessao] - Prazo da concessão em anos (alternativo)
 * @param {number} [recurso.mesesUso=12] - Meses de uso no período
 * @returns {Object} Cálculo da exaustão
 *
 * Base Legal: Art. 336-337 do RIR/2018
 */
function calcularExaustao(recurso) {
  const {
    tipo = 'MINERAL',
    custoAquisicao = 0,
    volumeTotal = 0,
    volumeExplorado = 0,
    exaustaoAcumulada = 0,
    prazoConcessao,
    mesesUso = 12
  } = recurso;

  if (custoAquisicao <= 0) {
    return { erro: 'Custo de aquisição deve ser positivo' };
  }

  const saldoExaurivel = Math.max(0, custoAquisicao - exaustaoAcumulada);
  let quotaExaustao = 0;
  let metodoCalculo = '';

  if (volumeTotal > 0 && volumeExplorado > 0) {
    // Método por volume (Art. 336 §2º / Art. 337 §2º)
    const percentualExplorado = volumeExplorado / volumeTotal;
    quotaExaustao = custoAquisicao * percentualExplorado;
    metodoCalculo = 'VOLUME_PRODUCAO';
  } else if (prazoConcessao && prazoConcessao > 0) {
    // Método pelo prazo de concessão
    const taxaAnual = 1 / prazoConcessao;
    quotaExaustao = custoAquisicao * taxaAnual * (mesesUso / 12);
    metodoCalculo = 'PRAZO_CONCESSAO';
  } else {
    return { erro: 'Informe volumeTotal + volumeExplorado OU prazoConcessao' };
  }

  quotaExaustao = Math.min(quotaExaustao, saldoExaurivel);
  const novaExaustaoAcumulada = exaustaoAcumulada + quotaExaustao;

  return {
    tipo,
    custoAquisicao,
    metodoCalculo,
    volumeTotal,
    volumeExplorado,
    percentualExplorado: volumeTotal > 0 ? Math.round((volumeExplorado / volumeTotal) * 10000) / 100 : null,
    quotaExaustao: Math.round(quotaExaustao * 100) / 100,
    novaExaustaoAcumulada: Math.round(novaExaustaoAcumulada * 100) / 100,
    saldoExaurivelRestante: Math.round(Math.max(0, custoAquisicao - novaExaustaoAcumulada) * 100) / 100,
    dedutivel: true,
    artigo: tipo === 'MINERAL' ? 'Art. 336' : 'Art. 337',
    economia: {
      irpj: quotaExaustao * 0.25,
      csll: quotaExaustao * 0.09,
      total: quotaExaustao * 0.34
    }
  };
}

/**
 * Calcula despesas pré-operacionais e sua amortização (Art. 338).
 *
 * @param {Object} dados
 * @param {string} dados.tipo - 'PRE_OPERACIONAL' ou 'EXPANSAO'
 * @param {number} dados.totalDespesas - Total das despesas pré-operacionais
 * @param {string} dados.dataInicio - Data de início das operações ou novas instalações
 * @param {string} dados.dataReferencia - Data do período de apuração atual
 * @param {number} [dados.prazoAmortizacaoAnos=5] - Prazo mínimo 5 anos
 * @param {number} [dados.amortizacaoAcumulada=0] - Amortização acumulada
 * @returns {Object} Cálculo das despesas pré-operacionais
 *
 * Base Legal: Art. 338 do RIR/2018 (Lei 12.973/14, art. 11)
 */
function calcularDespesasPreOperacionais(dados) {
  const {
    tipo = 'PRE_OPERACIONAL',
    totalDespesas = 0,
    dataInicio,
    dataReferencia,
    prazoAmortizacaoAnos = 5,
    amortizacaoAcumulada = 0
  } = dados;

  if (totalDespesas <= 0) {
    return { erro: 'Total de despesas deve ser positivo' };
  }

  // Art. 338 §único: Prazo mínimo 5 anos
  const prazoEfetivo = Math.max(5, prazoAmortizacaoAnos);

  // Não computar no período em que incorridas
  // Excluir em quotas fixas mensais a partir do início das operações
  const quotaMensal = totalDespesas / (prazoEfetivo * 12);
  const saldoAmortizavel = Math.max(0, totalDespesas - amortizacaoAcumulada);

  let mesesDecorridos = 0;
  if (dataInicio && dataReferencia) {
    mesesDecorridos = _calcularMesesEntre(new Date(dataInicio), new Date(dataReferencia));
  }

  // Meses no período atual (máximo 12)
  const mesesNoPeriodo = Math.min(12, Math.max(0, mesesDecorridos));
  let exclusaoLalurPeriodo = quotaMensal * mesesNoPeriodo;
  exclusaoLalurPeriodo = Math.min(exclusaoLalurPeriodo, saldoAmortizavel);

  return {
    tipo,
    totalDespesas,
    prazoAmortizacao: prazoEfetivo,
    quotaMensal: Math.round(quotaMensal * 100) / 100,
    mesesDecorridos,
    exclusaoLalurPeriodo: Math.round(exclusaoLalurPeriodo * 100) / 100,
    amortizacaoAcumuladaAnterior: amortizacaoAcumulada,
    novaAmortizacaoAcumulada: Math.round((amortizacaoAcumulada + exclusaoLalurPeriodo) * 100) / 100,
    saldoRestante: Math.round(Math.max(0, totalDespesas - amortizacaoAcumulada - exclusaoLalurPeriodo) * 100) / 100,
    artigo: 'Art. 338',
    descricao: tipo === 'PRE_OPERACIONAL'
      ? 'Despesas pré-operacionais — exclusão em quotas fixas mensais (mín. 5 anos)'
      : 'Despesas de expansão industrial — exclusão em quotas fixas mensais (mín. 5 anos)',
    ajusteLalur: {
      adicao: totalDespesas,
      exclusao: exclusaoLalurPeriodo,
      descricao: 'Adicionar totalidade no período da despesa; excluir quotas mensais a partir do início das operações'
    },
    economia: {
      irpj: exclusaoLalurPeriodo * 0.25,
      csll: exclusaoLalurPeriodo * 0.09,
      total: exclusaoLalurPeriodo * 0.34
    }
  };
}

/**
 * Calcula custo de aquisição de mercadorias conforme Art. 301.
 *
 * @param {Object} dados
 * @param {number} dados.valorMercadoria - Valor da mercadoria
 * @param {number} [dados.frete=0] - Frete até o estabelecimento
 * @param {number} [dados.seguro=0] - Seguro
 * @param {number} [dados.tributoAquisicao=0] - Tributos devidos na aquisição (II, IPI quando não recuperável)
 * @param {number} [dados.desembaracoAduaneiro=0] - Gastos com desembaraço
 * @param {number} [dados.icmsRecuperavel=0] - ICMS creditável (a subtrair)
 * @param {number} [dados.pisRecuperavel=0] - PIS creditável (a subtrair)
 * @param {number} [dados.cofinsRecuperavel=0] - COFINS creditável (a subtrair)
 * @param {number} [dados.ipiRecuperavel=0] - IPI creditável (a subtrair)
 * @returns {Object} Custo de aquisição apurado
 *
 * Base Legal: Art. 301 do RIR/2018
 */
function calcularCustoAquisicao(dados) {
  const {
    valorMercadoria = 0,
    frete = 0,
    seguro = 0,
    tributoAquisicao = 0,
    desembaracoAduaneiro = 0,
    icmsRecuperavel = 0,
    pisRecuperavel = 0,
    cofinsRecuperavel = 0,
    ipiRecuperavel = 0
  } = dados;

  const custoBruto = valorMercadoria + frete + seguro + tributoAquisicao + desembaracoAduaneiro;
  const totalRecuperavel = icmsRecuperavel + pisRecuperavel + cofinsRecuperavel + ipiRecuperavel;
  const custoLiquido = custoBruto - totalRecuperavel;

  return {
    custoBruto: Math.round(custoBruto * 100) / 100,
    composicao: {
      valorMercadoria,
      frete,
      seguro,
      tributoAquisicao,
      desembaracoAduaneiro
    },
    impostosRecuperaveis: {
      icms: icmsRecuperavel,
      pis: pisRecuperavel,
      cofins: cofinsRecuperavel,
      ipi: ipiRecuperavel,
      total: Math.round(totalRecuperavel * 100) / 100
    },
    custoAquisicaoFiscal: Math.round(custoLiquido * 100) / 100,
    artigo: 'Art. 301',
    observacoes: [
      'Art. 301 §1º: Frete e seguro integram custo de aquisição',
      'Art. 301 §2º: Desembaraço aduaneiro integra custo de aquisição',
      'Art. 301 §3º: Impostos recuperáveis NÃO integram custo'
    ]
  };
}

/**
 * Avalia estoque quando a empresa NÃO possui contabilidade de custo integrada (Art. 308).
 *
 * @param {Object} dados
 * @param {number} [dados.maiorCustoMPAdquirida] - Maior custo de MP adquirida no período
 * @param {number} [dados.maiorPrecoVendaProduto] - Maior preço de venda de produto acabado no período
 * @returns {Object} Valores mínimos obrigatórios de estoque
 *
 * Base Legal: Art. 308 do RIR/2018
 */
function avaliarEstoqueSemCustoIntegrado(dados) {
  const { maiorCustoMPAdquirida = 0, maiorPrecoVendaProduto = 0 } = dados;

  // Art. 308 II: Produtos acabados = 70% do maior preço de venda
  const valorProdutosAcabados = maiorPrecoVendaProduto * 0.70;

  // Art. 308 I: Materiais em processamento = MAX(1,5 × maior custo MP; 80% do valor prod. acabados)
  const opcao1 = maiorCustoMPAdquirida * 1.5;
  const opcao2 = valorProdutosAcabados * 0.80;
  const valorMateriaisProcessamento = Math.max(opcao1, opcao2);

  return {
    produtosAcabados: {
      valorMinimo: Math.round(valorProdutosAcabados * 100) / 100,
      formula: '70% × maior preço de venda no período (com ICMS)',
      artigo: 'Art. 308 II'
    },
    materiaisProcessamento: {
      valorMinimo: Math.round(valorMateriaisProcessamento * 100) / 100,
      formula: 'MAX(1,5 × maior custo MP; 80% × valor prod. acabados)',
      opcao1: Math.round(opcao1 * 100) / 100,
      opcao2: Math.round(opcao2 * 100) / 100,
      artigo: 'Art. 308 I'
    },
    observacoes: [
      'Art. 308 §1º: Preço de venda SEM exclusão de ICMS',
      'Art. 308 §2º: Reconhecer na escrituração comercial',
      'Estes valores são OBRIGATÓRIOS quando não há contabilidade de custo integrada (Art. 306 §1º-§2º)'
    ]
  };
}

/**
 * Analisa encargos financeiros de créditos vencidos para exclusão (Art. 349).
 *
 * @param {Object} dados
 * @param {number} dados.valorEncargos - Encargos financeiros contabilizados como receita
 * @param {string} dados.dataVencimentoCredito - Data de vencimento do crédito
 * @param {string} dados.dataReferencia - Data de referência
 * @param {boolean} [dados.cobrandoJudicialmente=false] - Se há cobrança judicial
 * @param {number} [dados.valorCredito=0] - Valor do crédito para determinar exigência judicial
 * @param {boolean} [dados.possuiGarantia=false] - Se possui garantia
 * @returns {Object} Análise dos encargos
 *
 * Base Legal: Art. 349 do RIR/2018 (Lei 9.430/96, art. 11)
 */
function analisarEncargosFinanceirosVencidos(dados) {
  const {
    valorEncargos = 0,
    dataVencimentoCredito,
    dataReferencia,
    cobrandoJudicialmente = false,
    valorCredito = 0,
    possuiGarantia = false
  } = dados;

  if (!dataVencimentoCredito || valorEncargos <= 0) {
    return { erro: 'Data de vencimento e valor dos encargos são obrigatórios' };
  }

  const dataVenc = new Date(dataVencimentoCredito);
  const dataRef = new Date(dataReferencia || new Date().toISOString());
  const mesesVencidos = _calcularMesesEntre(dataVenc, dataRef);

  // Art. 349: Prazo mínimo de 2 meses
  if (mesesVencidos < 2) {
    return {
      valorEncargos,
      exclusivel: false,
      mesesVencidos,
      artigo: 'Art. 349',
      motivo: `Prazo insuficiente: ${mesesVencidos} meses (mínimo 2 meses)`
    };
  }

  // Verificar se precisa de cobrança judicial (depende da faixa do crédito)
  // As exceções são créditos de pequeno valor conforme Art. 347
  const dispensaJudicial = (
    (!possuiGarantia && valorCredito <= 100000) ||
    (possuiGarantia && valorCredito <= 50000)
  );

  if (!dispensaJudicial && !cobrandoJudicialmente) {
    return {
      valorEncargos,
      exclusivel: false,
      mesesVencidos,
      artigo: 'Art. 349 §1º',
      motivo: 'Crédito acima dos limites de dispensa — exige cobrança judicial'
    };
  }

  return {
    valorEncargos,
    exclusivel: true,
    valorExclusao: valorEncargos,
    mesesVencidos,
    artigo: 'Art. 349',
    ajusteLalur: 'EXCLUSAO',
    descricao: 'Excluir do lucro líquido os encargos financeiros contabilizados como receita',
    alerta: 'Art. 349 §2º: Adicionar quando efetivamente recebidos ou quando reconhecida a perda',
    economia: {
      irpj: valorEncargos * 0.25,
      csll: valorEncargos * 0.09,
      total: valorEncargos * 0.34
    }
  };
}

/**
 * Verifica todos os indicadores de omissão de receita (Art. 293-299).
 * Análise expandida do verificarCompliance do motor principal.
 *
 * @param {Object} dados
 * @param {number} [dados.saldoCaixa] - Saldo de caixa (negativo = saldo credor)
 * @param {number} [dados.pagamentosNaoEscriturados=0] - Total de pagamentos não escriturados
 * @param {number} [dados.passivoSemComprovacao=0] - Obrigações no passivo já pagas ou sem exigibilidade
 * @param {number} [dados.suprimentosSociosSemOrigem=0] - Recursos de sócios sem comprovação de origem
 * @param {number} [dados.receitaSemNF=0] - Valor de operações sem emissão de NF
 * @param {number} [dados.depositosBancariosSemOrigem=0] - Depósitos sem comprovação
 * @param {number} [dados.receitaDeclarada=0] - Receita total declarada
 * @param {number} [dados.diferencaEstoque=0] - Diferença no levantamento quantitativo
 * @returns {Object} Diagnóstico completo de omissão de receita
 *
 * Base Legal: Art. 293-300 do RIR/2018
 */
function verificarOmissaoReceita(dados) {
  const {
    saldoCaixa,
    pagamentosNaoEscriturados = 0,
    passivoSemComprovacao = 0,
    suprimentosSociosSemOrigem = 0,
    receitaSemNF = 0,
    depositosBancariosSemOrigem = 0,
    receitaDeclarada = 0,
    diferencaEstoque = 0
  } = dados;

  const alertas = [];
  let receitaOmitidaEstimada = 0;
  let riscoBaixo = 0, riscoMedio = 0, riscoAlto = 0, riscoCritico = 0;

  // Art. 293 I: Saldo credor de caixa
  if (saldoCaixa !== undefined && saldoCaixa < 0) {
    const valor = Math.abs(saldoCaixa);
    alertas.push({
      indicador: 'SALDO_CREDOR_CAIXA',
      artigo: 'Art. 293 I',
      gravidade: 'CRITICO',
      valor,
      descricao: `Saldo credor de caixa de R$ ${valor.toFixed(2)} — presunção de omissão de receita`,
      recomendacao: 'Justificar com documentação hábil ou retificar escrituração'
    });
    receitaOmitidaEstimada += valor;
    riscoCritico++;
  }

  // Art. 293 II: Falta de escrituração de pagamentos
  if (pagamentosNaoEscriturados > 0) {
    alertas.push({
      indicador: 'FALTA_ESCRITURACAO_PAGAMENTO',
      artigo: 'Art. 293 II',
      gravidade: 'CRITICO',
      valor: pagamentosNaoEscriturados,
      descricao: `Pagamentos não escriturados: R$ ${pagamentosNaoEscriturados.toFixed(2)}`,
      recomendacao: 'Regularizar escrituração de todos os pagamentos efetuados'
    });
    receitaOmitidaEstimada += pagamentosNaoEscriturados;
    riscoCritico++;
  }

  // Art. 293 III: Passivo fictício
  if (passivoSemComprovacao > 0) {
    alertas.push({
      indicador: 'PASSIVO_FICTICIO',
      artigo: 'Art. 293 III',
      gravidade: 'CRITICO',
      valor: passivoSemComprovacao,
      descricao: `Passivo sem comprovação de exigibilidade: R$ ${passivoSemComprovacao.toFixed(2)}`,
      recomendacao: 'Baixar obrigações já pagas; comprovar exigibilidade das remanescentes'
    });
    receitaOmitidaEstimada += passivoSemComprovacao;
    riscoCritico++;
  }

  // Art. 294: Suprimentos de sócios sem origem
  if (suprimentosSociosSemOrigem > 0) {
    alertas.push({
      indicador: 'SUPRIMENTO_CAIXA',
      artigo: 'Art. 294',
      gravidade: 'ALTO',
      valor: suprimentosSociosSemOrigem,
      descricao: `Suprimentos de sócios sem comprovação de origem: R$ ${suprimentosSociosSemOrigem.toFixed(2)}`,
      recomendacao: 'Comprovar a efetividade da entrega e a origem dos recursos (DIRPF, extratos)'
    });
    receitaOmitidaEstimada += suprimentosSociosSemOrigem;
    riscoAlto++;
  }

  // Art. 295: Falta de NF
  if (receitaSemNF > 0) {
    alertas.push({
      indicador: 'FALTA_NOTA_FISCAL',
      artigo: 'Art. 295',
      gravidade: 'CRITICO',
      valor: receitaSemNF,
      descricao: `Operações sem emissão de NF: R$ ${receitaSemNF.toFixed(2)}`,
      recomendacao: 'Emitir documentário fiscal para TODAS as operações'
    });
    receitaOmitidaEstimada += receitaSemNF;
    riscoCritico++;
  }

  // Art. 299: Depósitos bancários sem origem
  if (depositosBancariosSemOrigem > 0) {
    alertas.push({
      indicador: 'DEPOSITOS_SEM_ORIGEM',
      artigo: 'Art. 299',
      gravidade: 'ALTO',
      valor: depositosBancariosSemOrigem,
      descricao: `Depósitos bancários sem comprovação de origem: R$ ${depositosBancariosSemOrigem.toFixed(2)}`,
      recomendacao: 'Documentar origem de todos os créditos bancários individualmente (Art. 299 §3º)'
    });
    receitaOmitidaEstimada += depositosBancariosSemOrigem;
    riscoAlto++;
  }

  // Art. 298: Divergência de estoque
  if (diferencaEstoque > 0) {
    alertas.push({
      indicador: 'DIVERGENCIA_ESTOQUE',
      artigo: 'Art. 298',
      gravidade: 'MEDIO',
      valor: diferencaEstoque,
      descricao: `Diferença no levantamento quantitativo de estoques: R$ ${diferencaEstoque.toFixed(2)}`,
      recomendacao: 'Conciliar estoque físico com contábil; inventariar corretamente (Art. 304)'
    });
    receitaOmitidaEstimada += diferencaEstoque;
    riscoMedio++;
  }

  // Calcular impacto tributário da omissão estimada
  const impostoSobreOmissao = {
    irpj: receitaOmitidaEstimada * 0.25,
    csll: receitaOmitidaEstimada * 0.09,
    total: receitaOmitidaEstimada * 0.34,
    multa75: receitaOmitidaEstimada * 0.34 * 0.75,
    multa150: receitaOmitidaEstimada * 0.34 * 1.50,
    descricao: 'Art. 300: Tributação conforme regime da PJ. Multa de ofício: 75% a 150%.'
  };

  const nivelRisco = riscoCritico > 0 ? 'CRITICO' : riscoAlto > 0 ? 'ALTO' : riscoMedio > 0 ? 'MEDIO' : 'BAIXO';

  return {
    nivelRisco,
    totalAlertasCriticos: riscoCritico,
    totalAlertasAlto: riscoAlto,
    totalAlertasMedio: riscoMedio,
    receitaOmitidaEstimada: Math.round(receitaOmitidaEstimada * 100) / 100,
    exposicaoFiscal: impostoSobreOmissao,
    alertas,
    baseLegal: 'Art. 293-300 do RIR/2018',
    recomendacaoGeral: nivelRisco === 'CRITICO'
      ? 'URGENTE: Regularizar escrituração e documentação IMEDIATAMENTE. Risco de autuação com multa qualificada (150%).'
      : nivelRisco === 'ALTO'
        ? 'Regularizar pendências antes do próximo fechamento. Manter documentação comprobatória organizada.'
        : nivelRisco === 'MEDIO'
          ? 'Ajustar controles internos. Manter inventário atualizado e conciliado.'
          : 'Situação regular. Manter procedimentos de controle.'
  };
}

/**
 * Gera relatório consolidado de todas as despesas dedutíveis e ajustes do LALUR.
 *
 * @param {Object} dados
 * @param {Array} [dados.despesas] - Lista de despesas para análise de dedutibilidade
 * @param {Array} [dados.creditos] - Créditos para PDD
 * @param {Array} [dados.empregados] - Empregados para provisões trabalhistas
 * @param {Array} [dados.bensDepreciacao] - Bens para depreciação
 * @param {Array} [dados.ativosAmortizacao] - Ativos para amortização
 * @param {Object} [dados.dadosOmissao] - Dados para verificação de omissão
 * @param {string} [dados.dataReferencia] - Data de referência
 * @returns {Object} Relatório consolidado com totais e ajustes LALUR
 */
function gerarRelatorioConsolidado(dados) {
  const {
    despesas = [],
    creditos = [],
    empregados = [],
    bensDepreciacao = [],
    ativosAmortizacao = [],
    dadosOmissao = null,
    dataReferencia = new Date().toISOString()
  } = dados;

  const relatorio = {
    dataReferencia,
    totalDespesasDedutivel: 0,
    totalDespesasIndedutivel: 0,
    totalExclusoesLalur: 0,
    totalAdicoesLalur: 0,
    economiaTotal: 0,
    secoes: {}
  };

  // 1. Análise de despesas
  if (despesas.length > 0) {
    const analises = despesas.map(d => analisarDedutibilidade(d));
    const totalDed = analises.reduce((s, a) => s + (a.valorDedutivel || 0), 0);
    const totalInd = analises.reduce((s, a) => s + (a.valorIndedutivel || 0), 0);
    relatorio.secoes.despesas = { totalDedutivel: totalDed, totalIndedutivel: totalInd, detalhes: analises };
    relatorio.totalDespesasDedutivel += totalDed;
    relatorio.totalDespesasIndedutivel += totalInd;
    relatorio.totalAdicoesLalur += totalInd;
  }

  // 2. PDD
  if (creditos.length > 0) {
    const pdd = calcularPDD(creditos, dataReferencia);
    relatorio.secoes.pdd = pdd;
    relatorio.totalDespesasDedutivel += pdd.totalDedutivel || 0;
    relatorio.economiaTotal += (pdd.economia && pdd.economia.total) || 0;
  }

  // 3. Provisões trabalhistas
  if (empregados.length > 0) {
    const prov = calcularProvisoesTrabalhistas(empregados);
    relatorio.secoes.provisoesTrabalhistas = prov;
    relatorio.totalDespesasDedutivel += prov.totalProvisoes || 0;
    relatorio.economiaTotal += (prov.economia && prov.economia.total) || 0;
  }

  // 4. Depreciação
  if (bensDepreciacao.length > 0) {
    const deps = bensDepreciacao.map(b => calcularDepreciacaoCompleta(b));
    const totalDep = deps.reduce((s, d) => s + (d.depreciacaoTotalPeriodo || 0), 0);
    const totalExcl = deps.reduce((s, d) => s + (d.exclusaoLalur || 0), 0);
    relatorio.secoes.depreciacao = { totalPeriodo: totalDep, exclusoesLalur: totalExcl, detalhes: deps };
    relatorio.totalDespesasDedutivel += totalDep;
    relatorio.totalExclusoesLalur += totalExcl;
    relatorio.economiaTotal += totalDep * 0.34;
  }

  // 5. Amortização
  if (ativosAmortizacao.length > 0) {
    const amorts = ativosAmortizacao.map(a => calcularAmortizacao(a));
    const totalAmort = amorts.reduce((s, a) => s + (a.amortizacaoTotalPeriodo || 0), 0);
    const totalExcl = amorts.reduce((s, a) => s + (a.exclusaoLalur || 0), 0);
    relatorio.secoes.amortizacao = { totalPeriodo: totalAmort, exclusoesLalur: totalExcl, detalhes: amorts };
    relatorio.totalDespesasDedutivel += totalAmort;
    relatorio.totalExclusoesLalur += totalExcl;
    relatorio.economiaTotal += totalAmort * 0.34;
  }

  // 6. Omissão de receita
  if (dadosOmissao) {
    relatorio.secoes.omissaoReceita = verificarOmissaoReceita(dadosOmissao);
  }

  relatorio.economiaTotal = Math.round(relatorio.economiaTotal * 100) / 100;

  return relatorio;
}

// ============================================================================
// EXPORTS
// ============================================================================


// ============================================================================
// EXEMPLOS DE USO
// ============================================================================


// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Limites de dedutibilidade para royalties, assistência técnica e aluguéis (Art. 361-365)
 */
const LIMITES_ROYALTIES_ASSISTENCIA = {
  limiteGeral: 0.05, // 5% da receita líquida (Art. 365)
  regras: [
    {
      id: 'ALUGUEL_MERCADO',
      artigo: 'Art. 361 §1º I',
      descricao: 'Aluguel pago a sócios/dirigentes/parentes: dedutível até o valor de mercado',
      tipo: 'ALUGUEL'
    },
    {
      id: 'ALUGUEL_NAO_PRODUCAO',
      artigo: 'Art. 361 §2º',
      descricao: 'Aluguel de bens não relacionados à produção/comercialização: indedutível',
      tipo: 'ALUGUEL'
    },
    {
      id: 'ROYALTIES_SOCIOS',
      artigo: 'Art. 363 I',
      descricao: 'Royalties pagos a sócios PF/PJ, dirigentes e parentes: indedutível',
      tipo: 'ROYALTIES'
    },
    {
      id: 'ROYALTIES_MATRIZ_EXTERIOR',
      artigo: 'Art. 363 III-a',
      descricao: 'Royalties de patentes pagos pela filial à matriz no exterior: indedutível',
      tipo: 'ROYALTIES'
    },
    {
      id: 'ROYALTIES_CONTROLADORA_EXTERIOR',
      artigo: 'Art. 363 III-b',
      descricao: 'Royalties de patentes a controladora no exterior: indedutível (salvo INPI+BACEN pós 31/12/1991)',
      tipo: 'ROYALTIES'
    },
    {
      id: 'ROYALTIES_SEM_REGISTRO_BACEN',
      artigo: 'Art. 363 IV-a / V-a',
      descricao: 'Royalties ao exterior sem registro no BACEN: indedutível',
      tipo: 'ROYALTIES'
    },
    {
      id: 'ASSIST_TECNICA_EXTERIOR',
      artigo: 'Art. 364',
      descricao: 'Assistência técnica ao exterior: exige contrato BACEN + serviços efetivos + limite MF',
      tipo: 'ASSISTENCIA_TECNICA',
      prazoMaximo: 10, // 5 + 5 anos com autorização CMN
      requisitos: ['Contrato registrado no BACEN', 'Serviços efetivamente prestados', 'Dentro do limite do MF']
    },
    {
      id: 'ASSIST_TECNICA_MATRIZ',
      artigo: 'Art. 364 §2º',
      descricao: 'Assistência técnica paga à matriz ou controladora no exterior: indedutível (salvo INPI+BACEN pós 31/12/1991)',
      tipo: 'ASSISTENCIA_TECNICA'
    }
  ]
};

/**
 * Despesas dedutíveis com condições específicas (Art. 366-387)
 */
const DESPESAS_CONDICIONAIS = {
  leasing: {
    artigo: 'Art. 366',
    dedutiveis: ['Contraprestações de arrendamento mercantil (bens relacionados à produção)'],
    indedutiveis: [
      'Despesas financeiras em contratos de leasing (Art. 366 §1º)',
      'Depreciação/amortização/exaustão de bem em leasing pela arrendatária (Art. 366 §3º)',
      'AVP de obrigações de leasing (Art. 366 §2º)'
    ],
    alertaDescaracterizacao: 'Art. 367: Aquisição em desacordo com Lei 6.099/74 = compra e venda a prestação'
  },
  remuneracaoSocios: {
    artigo: 'Art. 368',
    dedutiveis: ['Remuneração mensal fixa de sócios, diretores, administradores, conselheiros'],
    indedutiveis: [
      'Retiradas não debitadas em custos/despesas (Art. 368 §único I)',
      'Retiradas que não correspondam a remuneração mensal fixa (Art. 368 §único I)',
      'Pagamentos a membros de diretoria de S.A. não residentes no País (Art. 368 §único II)',
      'Gratificações/participações no resultado a dirigentes (Art. 315)'
    ]
  },
  remuneracaoIndireta: {
    artigo: 'Art. 369',
    descricao: 'Veículo, imóvel, benefícios a administradores/diretores/gerentes',
    regra: 'Integra remuneração do beneficiário. Dedutível se identificado e individualizado (Art. 369 §3º I). Indedutível + IRRF 35% se não identificado (Art. 369 §3º II).'
  },
  pagamentoAcoes: {
    artigo: 'Art. 370',
    regra: 'ADICIONAR ao lucro real quando apropriado. EXCLUIR somente após pagamento efetivo ou transferência definitiva das ações.',
    momentoDedutibilidade: 'Após liquidação em caixa ou transferência definitiva de propriedade'
  },
  plr: {
    artigo: 'Art. 371',
    dedutivel: true,
    limite: null,
    condicoes: [
      'Observar Lei 10.101/2000',
      'Deduzir no próprio exercício de constituição',
      'Máximo 2 pagamentos/ano, periodicidade mínima trimestral'
    ]
  },
  servicosAssistenciais: {
    artigo: 'Art. 372',
    dedutivel: true,
    condicoes: [
      'Planos de saúde/seguros destinados INDISTINTAMENTE a todos empregados e dirigentes',
      'Comprovação por sistema contábil específico',
      'Inclui: médico, odontológico, farmacêutico, social'
    ]
  },
  previdenciaComplementar: {
    artigo: 'Art. 373',
    dedutivel: true,
    limite: 0.20, // 20% do total de salários + remuneração de dirigentes
    descricao: 'Contribuições a planos de previdência complementar — limite de 20% da folha',
    condicoes: [
      'Plano assemelhado à previdência social',
      'Em favor de empregados e dirigentes',
      'Soma com FAPI (Art. 375) não pode exceder 20% da folha',
      'Seguro de vida com sobrevivência: indistintamente a todos empregados/dirigentes'
    ]
  },
  desfalqueFurto: {
    artigo: 'Art. 376',
    dedutivel: true,
    condicoes: ['Inquérito trabalhista instaurado OU queixa-crime registrada']
  },
  doacoes: {
    artigo: 'Art. 377',
    limites: {
      ensinoPesquisa: {
        percentual: 0.015, // 1,5% do lucro operacional
        artigo: 'Art. 377 I',
        base: 'Lucro operacional antes da dedução',
        condicoes: ['Instituição autorizada por lei federal', 'Art. 213 CF: sem fins lucrativos, aplica excedentes na educação']
      },
      entidadesCivis: {
        percentual: 0.02, // 2% do lucro operacional
        artigo: 'Art. 377 II',
        base: 'Lucro operacional antes da dedução',
        condicoes: [
          'Entidade civil sem fins lucrativos',
          'Serviços gratuitos a empregados/dependentes ou comunidade',
          'Doação em dinheiro: via conta corrente bancária da entidade',
          'Declaração de aplicação integral dos recursos',
          'Entidade = Organização da Sociedade Civil (Lei 13.019/2014)'
        ]
      }
    }
  },
  propaganda: {
    artigo: 'Art. 380',
    dedutivel: true,
    condicoes: [
      'Diretamente relacionada com atividade da empresa',
      'Regime de competência',
      'Empresas beneficiárias devem ter CNPJ e escrituração regular',
      'Amostras: até 5% da receita de vendas dos produtos (Art. 380 V-c)'
    ],
    limiteAmostras: 0.05
  },
  formacaoProfissional: { artigo: 'Art. 382', dedutivel: true, limite: null },
  alimentacao: {
    artigo: 'Art. 383',
    dedutivel: true,
    condicoes: ['Fornecida INDISTINTAMENTE a todos os empregados']
  },
  valeTransporte: { artigo: 'Art. 384', dedutivel: true, limite: null },
  cultura: {
    artigo: 'Art. 385',
    dedutivel: true,
    descricao: 'Valores contribuídos ao PRONAC — integralmente dedutíveis como despesa + dedução do IR devido (Art. 539)'
  }
};

/**
 * Regras de variação cambial — caixa vs competência (Art. 407)
 */
const VARIACAO_CAMBIAL = {
  regimePadrao: 'CAIXA', // Art. 407 caput — na liquidação da operação
  regimeOpcional: 'COMPETENCIA', // Art. 407 §1º
  regras: {
    opcaoCompetencia: 'Deve ser exercida em janeiro e aplica-se a todo o ano-calendário (Art. 407 §4º I)',
    mudancaDuranteAno: 'Permitida apenas em caso de elevada oscilação cambial (Art. 407 §4º II)',
    comunicacaoRFB: 'Comunicar à RFB no mês de janeiro ou no mês posterior à mudança (Art. 407 §6º)',
    avpCambial: 'Variações cambiais sobre saldos de AVP NÃO são computadas no lucro real (Art. 408)'
  }
};

/**
 * Regras de avaliação a valor justo (Art. 388-396)
 */
const VALOR_JUSTO = {
  ganho: {
    artigo: 'Art. 388',
    regra: 'NÃO computar se evidenciado em SUBCONTA vinculada ao ativo/passivo',
    tributacao: 'Computar quando ativo realizado (depreciação, alienação, baixa) ou passivo liquidado (Art. 388 §1º)',
    semSubconta: 'TRIBUTADO imediatamente (Art. 388 §3º). Não pode reduzir prejuízo fiscal do período (Art. 388 §4º).'
  },
  perda: {
    artigo: 'Art. 389',
    regra: 'Computar somente quando ativo realizado ou passivo liquidado, SE evidenciada em SUBCONTA',
    semSubconta: 'INDEDUTÍVEL (Art. 389 §2º)'
  },
  incorporacaoFusaoCisao: {
    artigo: 'Art. 392',
    regra: 'Ganhos de valor justo da sucedida NÃO integram custo na sucessora para fins de ganho de capital e depreciação'
  },
  subscricaoCapital: {
    ganho: {
      artigo: 'Art. 393',
      regra: 'Diferido se em subconta vinculada à participação societária',
      realizacao: [
        'Na alienação/liquidação da participação (Art. 393 §1º I)',
        'Proporcionalmente à realização do bem pela investida (Art. 393 §1º II)',
        'À razão de 1/60 por mês nos 5 anos seguintes, se não sujeito a realização (Art. 393 §1º III)'
      ]
    },
    perda: {
      artigo: 'Art. 394',
      regra: 'Mesmas condições do ganho para ser dedutível. Sem subconta = indedutível.'
    }
  },
  transicaoPresumidoReal: {
    artigo: 'Art. 396',
    regra: 'PJ que muda de presumido para real: incluir ganhos de valor justo na base do presumido. Pode diferir se usar subcontas (Art. 388).'
  }
};

/**
 * Regras de participações societárias e MEP (Art. 415-440)
 */
const MEP_REGRAS = {
  obrigatoriedade: {
    artigo: 'Art. 420',
    aplicaA: ['Controladas', 'Coligadas', 'Mesmo grupo ou controle comum'],
    coligada: 'Influência significativa: 20%+ do capital votante ou poder de participar nas decisões (Art. 420 §3º-§4º)'
  },
  desdobramentoCusto: {
    artigo: 'Art. 421',
    componentes: [
      'I — Valor de patrimônio líquido na época da aquisição',
      'II — Mais ou menos-valia (diferença entre valor justo dos ativos líquidos e PL)',
      'III — Ágio por rentabilidade futura (goodwill) = custo de aquisição - (PL + mais/menos-valia)'
    ],
    laudo: 'Laudo de perito independente protocolado na RFB ou registrado em cartório até 13º mês após aquisição (Art. 421 §2º)'
  },
  contrapartidaMEP: {
    artigo: 'Art. 426',
    regra: 'Ajustes positivos e negativos do MEP NÃO computados no lucro real'
  },
  dividendos: {
    artigo: 'Art. 415-418',
    recebidos: 'Lucros/dividendos apurados a partir de jan/1996 NÃO integram base de cálculo do IRPJ (Art. 418)',
    exclusaoLucroReal: 'Excluir do lucro líquido para determinação do lucro real (Art. 415 §1º)',
    registroMEP: 'Diminuição do valor do investimento, sem influenciar resultado (Art. 425 §1º)'
  },
  incorporacaoFusaoCisao: {
    maisValia: {
      artigo: 'Art. 431',
      regra: 'Pode integrar custo do bem para depreciação e ganho/perda de capital (se entre partes independentes)',
      condicoes: ['Laudo tempestivo', 'Valores identificáveis', 'Bem relacionado à produção']
    },
    menosValia: {
      artigo: 'Art. 432',
      regra: 'DEVE integrar custo do bem. Se bem não transferido na cisão: tributar em quotas fixas mensais (máx. 5 anos).'
    },
    goodwill: {
      artigo: 'Art. 433',
      regra: 'Exclusão do lucro real à razão de 1/60 por mês (máx.), nos períodos subsequentes',
      condicoes: ['Entre partes NÃO dependentes', 'Laudo tempestivo', 'Valores identificáveis']
    },
    compraVantajosa: {
      artigo: 'Art. 434',
      regra: 'Computar no lucro real à razão de 1/60 por mês (mín.), nos períodos subsequentes'
    },
    partesDependentes: {
      artigo: 'Art. 435',
      criterios: [
        'Controlados pela mesma parte (Art. 435 I)',
        'Relação de controle entre adquirente e alienante (Art. 435 II)',
        'Alienante é sócio/titular/conselheiro/administrador (Art. 435 III)',
        'Parente até 3º grau do anterior (Art. 435 IV)',
        'Outras relações que comprovem dependência (Art. 435 V)'
      ]
    }
  }
};

/**
 * Despesas financeiras — dedutibilidade (Art. 397-403)
 */
const DESPESAS_FINANCEIRAS = {
  dedutiveis: [
    { id: 'JUROS_GERAIS', artigo: 'Art. 398', descricao: 'Juros pagos ou incorridos — dedutíveis como custo ou despesa' },
    { id: 'JUROS_ANTECIPADOS', artigo: 'Art. 399', descricao: 'Juros antecipados, descontos, correção monetária prefixada — pro rata tempore' },
    { id: 'CUSTOS_EMPRESTIMO', artigo: 'Art. 402', descricao: 'Juros de empréstimos para aquisição de ativos de longa maturação — podem ser custo do ativo' }
  ],
  indedutiveis: [
    { id: 'JUROS_CONTROLADA_LUCROS_EXTERIOR', artigo: 'Art. 400', descricao: 'Juros a controlada/coligada sobre lucros não disponibilizados no exterior' },
    { id: 'DESPESA_FINANCEIRA_LEASING', artigo: 'Art. 401', descricao: 'Despesas financeiras de arrendamento mercantil' },
    { id: 'DIVIDENDOS_DESPESA_FINANCEIRA', artigo: 'Art. 403', descricao: 'Dividendos classificados como despesa financeira na contabilidade' }
  ]
};

/**
 * Operações no exterior — regras de tributação (Art. 446-451)
 */
const OPERACOES_EXTERIOR = {
  regra: {
    artigo: 'Art. 446',
    base: 'Lucros, rendimentos e ganhos de capital no exterior computados no lucro real (balanço 31/12)',
    conversao: 'Taxa de câmbio para venda na data da contabilização no País (Art. 446 §1º)',
    prejuizo: 'Prejuízos no exterior NÃO compensáveis com lucros no País (Art. 446 §7º)',
    incentivos: 'Não se admite incentivo fiscal sobre IR de lucros no exterior (Art. 446 §10)'
  },
  filiais: {
    artigo: 'Art. 446 §3º-§4º',
    disponibilizacao: 'Lucros considerados disponibilizados na data do balanço da filial/sucursal',
    demonstracao: 'De acordo com normas da legislação brasileira',
    adicao: 'Na proporção da participação acionária'
  },
  controladas: {
    artigo: 'Art. 448',
    regra: 'Parcela do ajuste MEP equivalente aos lucros (antes do IR) computada no lucro real da controladora',
    consolidacao: {
      artigo: 'Art. 449',
      vigencia: 'Até ano-calendário 2022',
      excecoes: [
        'País sem tratado de troca de informações (Art. 449 I)',
        'País com tributação favorecida ou regime fiscal privilegiado (Art. 449 II)',
        'Controlada por PJ em regime privilegiado (Art. 449 III)',
        'Renda ativa própria < 80% da renda total (Art. 449 IV)'
      ],
      irretratavel: true
    },
    prejuizo: {
      artigo: 'Art. 448 §2º / Art. 450 II',
      regra: 'Compensável com lucros futuros da MESMA PJ no exterior'
    }
  }
};

// ============================================================================
// FUNÇÕES DE CÁLCULO
// ============================================================================

/**
 * Calcula o limite de dedutibilidade de royalties e assistência técnica (Art. 365).
 *
 * @param {Object} dados
 * @param {number} dados.receitaLiquida - Receita líquida anual em R$
 * @param {number} [dados.royaltiesPatentes=0] - Royalties por patentes de invenção
 * @param {number} [dados.royaltiesMarcas=0] - Royalties por uso de marcas
 * @param {number} [dados.assistenciaTecnica=0] - Assistência técnica, científica, administrativa
 * @param {number} [dados.coeficienteMF] - Coeficiente específico do MF para o setor (se houver)
 * @param {boolean} [dados.beneficiarioExterior=false] - Se pagamento ao exterior
 * @param {boolean} [dados.registradoBACEN=false] - Se contrato registrado no BACEN
 * @param {boolean} [dados.averbadoINPI=false] - Se averbado no INPI
 * @param {boolean} [dados.beneficiarioSocio=false] - Se beneficiário é sócio/dirigente/parente
 * @param {boolean} [dados.beneficiarioControladora=false] - Se beneficiário é controladora/matriz
 * @returns {Object} Análise de dedutibilidade com limites
 *
 * Base Legal: Art. 361-365 do RIR/2018
 */
function calcularLimiteRoyaltiesAssistencia(dados) {
  const {
    receitaLiquida = 0,
    royaltiesPatentes = 0,
    royaltiesMarcas = 0,
    assistenciaTecnica = 0,
    coeficienteMF,
    beneficiarioExterior = false,
    registradoBACEN = false,
    averbadoINPI = false,
    beneficiarioSocio = false,
    beneficiarioControladora = false
  } = dados;

  const totalPago = royaltiesPatentes + royaltiesMarcas + assistenciaTecnica;
  const limitePercentual = coeficienteMF || LIMITES_ROYALTIES_ASSISTENCIA.limiteGeral;
  const limiteAbsoluto = receitaLiquida * limitePercentual;

  const resultado = {
    receitaLiquida,
    totalPago,
    limitePercentual,
    limiteAbsoluto: Math.round(limiteAbsoluto * 100) / 100,
    valorDedutivel: 0,
    valorIndedutivel: 0,
    impedimentos: [],
    alertas: [],
    artigo: 'Art. 365',
    detalhamento: {}
  };

  // Verificar impedimentos absolutos
  if (beneficiarioSocio) {
    // Royalties a sócios: indedutível (Art. 363 I)
    if (royaltiesPatentes > 0 || royaltiesMarcas > 0) {
      resultado.impedimentos.push({
        tipo: 'ROYALTIES_SOCIOS',
        valor: royaltiesPatentes + royaltiesMarcas,
        artigo: 'Art. 363 I',
        descricao: 'Royalties pagos a sócios/dirigentes/parentes: INDEDUTÍVEL'
      });
    }
  }

  if (beneficiarioControladora && beneficiarioExterior) {
    if (!averbadoINPI || !registradoBACEN) {
      resultado.impedimentos.push({
        tipo: 'CONTROLADORA_EXTERIOR',
        valor: totalPago,
        artigo: 'Art. 363 III-b / Art. 364 §2º',
        descricao: 'Pagamento à controladora/matriz no exterior sem INPI+BACEN pós 31/12/1991: INDEDUTÍVEL'
      });
    }
  }

  if (beneficiarioExterior) {
    if (!registradoBACEN) {
      resultado.impedimentos.push({
        tipo: 'SEM_REGISTRO_BACEN',
        valor: totalPago,
        artigo: 'Art. 363 IV-a / Art. 364 I',
        descricao: 'Contrato não registrado no BACEN: INDEDUTÍVEL para exterior'
      });
    }
    if (assistenciaTecnica > 0 && !averbadoINPI) {
      resultado.alertas.push('Art. 365 §3º: Dedutibilidade condicionada à averbação no INPI');
    }
  }

  // Calcular valores dedutíveis
  const totalImpedido = resultado.impedimentos.reduce((s, i) => s + i.valor, 0);
  const totalElegivel = Math.max(0, totalPago - totalImpedido);
  const valorDedutivel = Math.min(totalElegivel, limiteAbsoluto);
  const excessoLimite = Math.max(0, totalElegivel - limiteAbsoluto);

  resultado.valorDedutivel = Math.round(valorDedutivel * 100) / 100;
  resultado.valorIndedutivel = Math.round((totalImpedido + excessoLimite) * 100) / 100;

  if (excessoLimite > 0) {
    resultado.alertas.push(
      `Excesso de R$ ${excessoLimite.toFixed(2)} sobre limite de ${(limitePercentual * 100).toFixed(1)}% da receita líquida — considerado LUCRO DISTRIBUÍDO (Art. 365 §2º)`
    );
  }

  resultado.detalhamento = {
    royaltiesPatentes: { valor: royaltiesPatentes, artigo: 'Art. 362-363' },
    royaltiesMarcas: { valor: royaltiesMarcas, artigo: 'Art. 362-363' },
    assistenciaTecnica: { valor: assistenciaTecnica, artigo: 'Art. 364' }
  };

  resultado.ajusteLalur = resultado.valorIndedutivel > 0
    ? { tipo: 'ADICAO', valor: resultado.valorIndedutivel, descricao: 'Adicionar ao lucro líquido na Parte A do LALUR' }
    : null;

  resultado.economia = {
    irpj: valorDedutivel * 0.25,
    csll: valorDedutivel * 0.09,
    total: valorDedutivel * 0.34
  };

  return resultado;
}

/**
 * Calcula o limite de dedutibilidade de doações (Art. 377-379).
 *
 * @param {Object} dados
 * @param {number} dados.lucroOperacional - Lucro operacional (antes das deduções de doações)
 * @param {number} [dados.doacaoEnsinoPesquisa=0] - Doações a instituições de ensino e pesquisa
 * @param {number} [dados.doacaoEntidadesCivis=0] - Doações a entidades civis / OSCIPs
 * @param {number} [dados.outrasDoacoes=0] - Outras doações (geralmente indedutíveis)
 * @returns {Object} Análise dos limites de doações
 *
 * Base Legal: Art. 377-379 do RIR/2018
 */
function calcularLimiteDoacoes(dados) {
  const {
    lucroOperacional = 0,
    doacaoEnsinoPesquisa = 0,
    doacaoEntidadesCivis = 0,
    outrasDoacoes = 0
  } = dados;

  // Art. 377 I: 1,5% do lucro operacional ANTES de computar ambas deduções
  const limiteEnsino = lucroOperacional * DESPESAS_CONDICIONAIS.doacoes.limites.ensinoPesquisa.percentual;
  const dedutivelEnsino = Math.min(doacaoEnsinoPesquisa, limiteEnsino);
  const excessoEnsino = Math.max(0, doacaoEnsinoPesquisa - limiteEnsino);

  // Art. 377 II: 2% do lucro operacional ANTES de computar ambas deduções
  const limiteEntidades = lucroOperacional * DESPESAS_CONDICIONAIS.doacoes.limites.entidadesCivis.percentual;
  const dedutivelEntidades = Math.min(doacaoEntidadesCivis, limiteEntidades);
  const excessoEntidades = Math.max(0, doacaoEntidadesCivis - limiteEntidades);

  const totalDedutivel = dedutivelEnsino + dedutivelEntidades;
  const totalIndedutivel = excessoEnsino + excessoEntidades + outrasDoacoes;

  return {
    lucroOperacional,
    ensinoPesquisa: {
      valorPago: doacaoEnsinoPesquisa,
      limite: Math.round(limiteEnsino * 100) / 100,
      dedutivel: Math.round(dedutivelEnsino * 100) / 100,
      excesso: Math.round(excessoEnsino * 100) / 100,
      artigo: 'Art. 377 I'
    },
    entidadesCivis: {
      valorPago: doacaoEntidadesCivis,
      limite: Math.round(limiteEntidades * 100) / 100,
      dedutivel: Math.round(dedutivelEntidades * 100) / 100,
      excesso: Math.round(excessoEntidades * 100) / 100,
      artigo: 'Art. 377 II'
    },
    outrasDoacoes: {
      valorPago: outrasDoacoes,
      dedutivel: 0,
      indedutivel: outrasDoacoes,
      artigo: 'Art. 377 caput',
      motivo: 'Doações não enquadradas nos incisos I e II são INDEDUTÍVEIS'
    },
    totalDedutivel: Math.round(totalDedutivel * 100) / 100,
    totalIndedutivel: Math.round(totalIndedutivel * 100) / 100,
    ajusteLalur: totalIndedutivel > 0
      ? { tipo: 'ADICAO', valor: Math.round(totalIndedutivel * 100) / 100 }
      : null,
    economia: {
      irpj: totalDedutivel * 0.25,
      csll: totalDedutivel * 0.09,
      total: totalDedutivel * 0.34
    }
  };
}

/**
 * Calcula limite de previdência complementar dedutível (Art. 373).
 *
 * @param {number} totalFolha - Total de salários dos empregados + remuneração dos dirigentes vinculados ao plano
 * @param {number} contribuicaoPrevidencia - Contribuição ao plano de previdência complementar
 * @param {number} [contribuicaoFAPI=0] - Contribuição ao FAPI (Art. 375)
 * @returns {Object} Análise do limite
 *
 * Base Legal: Art. 373 e 375 do RIR/2018
 */
function calcularLimitePrevidenciaComplementar(totalFolha, contribuicaoPrevidencia, contribuicaoFAPI = 0) {
  const limite = totalFolha * DESPESAS_CONDICIONAIS.previdenciaComplementar.limite;
  const totalContribuicoes = contribuicaoPrevidencia + contribuicaoFAPI;
  const dedutivel = Math.min(totalContribuicoes, limite);
  const excesso = Math.max(0, totalContribuicoes - limite);

  return {
    totalFolha,
    contribuicaoPrevidencia,
    contribuicaoFAPI,
    totalContribuicoes,
    limite: Math.round(limite * 100) / 100,
    dedutivel: Math.round(dedutivel * 100) / 100,
    excesso: Math.round(excesso * 100) / 100,
    artigos: 'Art. 373 §1º e Art. 375',
    ajusteLalur: excesso > 0
      ? { tipo: 'ADICAO', valor: Math.round(excesso * 100) / 100, descricao: 'Art. 373 §2º: Excesso adicionado ao lucro real' }
      : null,
    economia: {
      irpj: dedutivel * 0.25,
      csll: dedutivel * 0.09,
      total: dedutivel * 0.34
    }
  };
}

/**
 * Analisa o tratamento fiscal de ajuste a valor justo (Art. 388-396).
 *
 * @param {Object} dados
 * @param {string} dados.tipo - 'GANHO' ou 'PERDA'
 * @param {number} dados.valor - Valor do ajuste
 * @param {boolean} dados.possuiSubconta - Se foi evidenciado em subconta vinculada
 * @param {string} [dados.contexto='NORMAL'] - 'NORMAL', 'INCORPORACAO', 'SUBSCRICAO_CAPITAL', 'PRESUMIDO_PARA_REAL'
 * @param {boolean} [dados.ativoRealizado=false] - Se o ativo já foi realizado
 * @param {boolean} [dados.valorIndedutivel=false] - Se o valor realizado é indedutível
 * @returns {Object} Tratamento fiscal
 *
 * Base Legal: Art. 388-396 do RIR/2018
 */
function analisarValorJusto(dados) {
  const {
    tipo,
    valor = 0,
    possuiSubconta = false,
    contexto = 'NORMAL',
    ativoRealizado = false,
    valorIndedutivel = false
  } = dados;

  if (!tipo || valor <= 0) {
    return { erro: 'Informe tipo (GANHO/PERDA) e valor positivo' };
  }

  const resultado = {
    tipo,
    valor,
    possuiSubconta,
    contexto,
    computarNoLucroReal: false,
    momentoTributacao: null,
    artigo: null,
    ajusteLalur: null,
    alertas: []
  };

  if (tipo === 'GANHO') {
    resultado.artigo = contexto === 'SUBSCRICAO_CAPITAL' ? 'Art. 393' : 'Art. 388';

    if (!possuiSubconta) {
      // Sem subconta = tributar imediatamente
      resultado.computarNoLucroReal = true;
      resultado.momentoTributacao = 'IMEDIATO';
      resultado.ajusteLalur = { tipo: 'ADICAO', valor };
      resultado.alertas.push(
        tipo === 'GANHO'
          ? 'Art. 388 §3º: Sem subconta, ganho TRIBUTADO. Não pode reduzir prejuízo fiscal do período (Art. 388 §4º).'
          : 'Art. 389 §2º: Sem subconta, perda INDEDUTÍVEL.'
      );
    } else if (ativoRealizado) {
      if (valorIndedutivel) {
        resultado.computarNoLucroReal = false;
        resultado.momentoTributacao = 'NAO_TRIBUTADO';
        resultado.alertas.push('Art. 388 §2º: Valor realizado é indedutível, ganho não computado.');
      } else {
        resultado.computarNoLucroReal = true;
        resultado.momentoTributacao = 'NA_REALIZACAO';
        resultado.ajusteLalur = { tipo: 'ADICAO', valor };
      }
    } else {
      resultado.computarNoLucroReal = false;
      resultado.momentoTributacao = 'DIFERIDO';
      resultado.alertas.push('Ganho diferido. Computar quando o ativo for realizado ou passivo liquidado.');
    }
  } else {
    // PERDA
    resultado.artigo = contexto === 'SUBSCRICAO_CAPITAL' ? 'Art. 394' : 'Art. 389';

    if (!possuiSubconta) {
      resultado.computarNoLucroReal = false;
      resultado.momentoTributacao = 'INDEDUTIVEL';
      resultado.ajusteLalur = { tipo: 'ADICAO', valor, descricao: 'Perda sem subconta — indedutível, adicionar ao lucro real' };
    } else if (ativoRealizado) {
      if (valorIndedutivel) {
        resultado.computarNoLucroReal = false;
        resultado.momentoTributacao = 'INDEDUTIVEL';
        resultado.alertas.push('Art. 389 §1º: Valor realizado indedutível, perda não computada.');
      } else {
        resultado.computarNoLucroReal = true;
        resultado.momentoTributacao = 'NA_REALIZACAO';
        resultado.ajusteLalur = { tipo: 'EXCLUSAO', valor };
      }
    } else {
      resultado.computarNoLucroReal = false;
      resultado.momentoTributacao = 'DIFERIDO';
      resultado.alertas.push('Perda diferida. Computar quando o ativo for realizado ou passivo liquidado.');
      resultado.ajusteLalur = { tipo: 'ADICAO', valor, descricao: 'Adicionar perda contábil ao lucro real (reversão quando realizado)' };
    }
  }

  // Contextos especiais
  if (contexto === 'INCORPORACAO') {
    resultado.alertas.push('Art. 392: Na incorporação/fusão/cisão, ganhos de VJ da sucedida NÃO integram custo na sucessora.');
  }

  if (contexto === 'PRESUMIDO_PARA_REAL') {
    resultado.alertas.push('Art. 396: Na transição presumido→real, incluir ganhos de VJ na base do presumido. Pode diferir com subcontas.');
  }

  return resultado;
}

/**
 * Simula o impacto da escolha entre regime de caixa e competência para variação cambial (Art. 407).
 *
 * @param {Array<Object>} operacoes - Lista de operações com exposição cambial
 * @param {number} operacoes[].valorOriginal - Valor original da operação em moeda estrangeira (convertido em R$ na data)
 * @param {number} operacoes[].valorAtual - Valor convertido pela taxa de câmbio atual
 * @param {boolean} operacoes[].liquidada - Se a operação foi liquidada no período
 * @param {number} [operacoes[].valorLiquidacao] - Valor na data de liquidação (se liquidada)
 * @param {string} [operacoes[].tipo='ATIVO'] - 'ATIVO' (direito de crédito) ou 'PASSIVO' (obrigação)
 * @param {string} [operacoes[].descricao] - Descrição da operação
 * @returns {Object} Comparação entre regime de caixa e competência
 *
 * Base Legal: Art. 407 do RIR/2018 (MP 2.158-35/2001, art. 30)
 */
function simularRegimeCambial(operacoes) {
  if (!operacoes || !Array.isArray(operacoes) || operacoes.length === 0) {
    return { erro: 'Informe ao menos uma operação' };
  }

  let variacaoCaixa = 0;
  let variacaoCompetencia = 0;
  const detalhesCaixa = [];
  const detalhesCompetencia = [];

  operacoes.forEach((op, idx) => {
    const {
      valorOriginal = 0,
      valorAtual = 0,
      liquidada = false,
      valorLiquidacao = 0,
      tipo = 'ATIVO',
      descricao = `Operação #${idx + 1}`
    } = op;

    // Variação cambial
    let variacaoTotal;
    if (liquidada) {
      variacaoTotal = tipo === 'ATIVO'
        ? valorLiquidacao - valorOriginal
        : valorOriginal - valorLiquidacao;
    } else {
      variacaoTotal = tipo === 'ATIVO'
        ? valorAtual - valorOriginal
        : valorOriginal - valorAtual;
    }

    // Regime CAIXA: reconhece apenas operações liquidadas
    if (liquidada) {
      variacaoCaixa += variacaoTotal;
      detalhesCaixa.push({ descricao, variacao: variacaoTotal, reconhecida: true });
    } else {
      detalhesCaixa.push({ descricao, variacao: variacaoTotal, reconhecida: false, motivo: 'Operação não liquidada' });
    }

    // Regime COMPETÊNCIA: reconhece todas as variações
    variacaoCompetencia += variacaoTotal;
    detalhesCompetencia.push({ descricao, variacao: variacaoTotal, reconhecida: true });
  });

  variacaoCaixa = Math.round(variacaoCaixa * 100) / 100;
  variacaoCompetencia = Math.round(variacaoCompetencia * 100) / 100;

  // Calcular impacto tributário de cada regime
  const tributoCaixa = variacaoCaixa > 0 ? variacaoCaixa * 0.34 : variacaoCaixa * 0.34;
  const tributoCompetencia = variacaoCompetencia > 0 ? variacaoCompetencia * 0.34 : variacaoCompetencia * 0.34;

  const melhorRegime = tributoCaixa <= tributoCompetencia ? 'CAIXA' : 'COMPETENCIA';
  const economiaEscolha = Math.abs(tributoCaixa - tributoCompetencia);

  return {
    regimeCaixa: {
      artigo: 'Art. 407 caput',
      variacaoReconhecida: variacaoCaixa,
      impostoEstimado: Math.round(tributoCaixa * 100) / 100,
      detalhes: detalhesCaixa,
      descricao: 'Reconhece variações apenas na liquidação da operação'
    },
    regimeCompetencia: {
      artigo: 'Art. 407 §1º',
      variacaoReconhecida: variacaoCompetencia,
      impostoEstimado: Math.round(tributoCompetencia * 100) / 100,
      detalhes: detalhesCompetencia,
      descricao: 'Reconhece todas as variações no período de apuração'
    },
    comparacao: {
      melhorRegime,
      economiaEscolha: Math.round(economiaEscolha * 100) / 100,
      descricao: `Regime ${melhorRegime} é mais vantajoso em R$ ${economiaEscolha.toFixed(2)}`
    },
    regras: {
      opcao: 'Art. 407 §4º I: Opção em janeiro, vale todo o ano-calendário',
      mudanca: 'Art. 407 §4º II: Só em caso de elevada oscilação cambial',
      comunicacao: 'Art. 407 §6º: Comunicar à RFB em janeiro ou no mês posterior à mudança'
    },
    totalOperacoes: operacoes.length,
    operacoesLiquidadas: operacoes.filter(o => o.liquidada).length
  };
}

/**
 * Calcula a amortização do goodwill em incorporação/fusão/cisão (Art. 433).
 *
 * @param {Object} dados
 * @param {number} dados.saldoGoodwill - Saldo do goodwill na data da aquisição
 * @param {string} dados.dataEvento - Data da incorporação/fusão/cisão
 * @param {string} dados.dataReferencia - Data do período de apuração atual
 * @param {boolean} [dados.partesIndependentes=true] - Se a aquisição foi entre partes NÃO dependentes
 * @param {boolean} [dados.laudoTempestivo=true] - Se o laudo foi protocolado/registrado tempestivamente
 * @param {number} [dados.exclusaoAcumulada=0] - Exclusões já realizadas
 * @returns {Object} Cálculo da exclusão do goodwill
 *
 * Base Legal: Art. 433 do RIR/2018 (Lei 12.973/14, art. 22)
 */
function calcularAmortizacaoGoodwill(dados) {
  const {
    saldoGoodwill = 0,
    dataEvento,
    dataReferencia,
    partesIndependentes = true,
    laudoTempestivo = true,
    exclusaoAcumulada = 0
  } = dados;

  if (saldoGoodwill <= 0) {
    return { erro: 'Saldo do goodwill deve ser positivo' };
  }

  // Verificar condições
  if (!partesIndependentes) {
    return {
      saldoGoodwill,
      exclusaoPeriodo: 0,
      dedutivel: false,
      artigo: 'Art. 433 / Art. 435',
      motivo: 'Aquisição entre PARTES DEPENDENTES — goodwill NÃO dedutível'
    };
  }

  if (!laudoTempestivo) {
    return {
      saldoGoodwill,
      exclusaoPeriodo: 0,
      dedutivel: false,
      artigo: 'Art. 433 §1º I',
      motivo: 'Laudo NÃO protocolado/registrado tempestivamente — goodwill NÃO dedutível'
    };
  }

  // Art. 433: 1/60 por mês (máximo)
  const quotaMensal = saldoGoodwill / 60;

  // Calcular meses no período
  const dtEvento = new Date(dataEvento);
  const dtRef = new Date(dataReferencia);
  const mesesTotais = _calcularMesesEntre(dtEvento, dtRef);
  const mesesNoPeriodo = Math.min(12, Math.max(0, mesesTotais));

  const saldoRemanescente = Math.max(0, saldoGoodwill - exclusaoAcumulada);
  let exclusaoPeriodo = quotaMensal * mesesNoPeriodo;
  exclusaoPeriodo = Math.min(exclusaoPeriodo, saldoRemanescente);

  const novaExclusaoAcumulada = exclusaoAcumulada + exclusaoPeriodo;
  const mesesRestantes = Math.max(0, 60 - Math.round(novaExclusaoAcumulada / quotaMensal));

  return {
    saldoGoodwill,
    quotaMensal: Math.round(quotaMensal * 100) / 100,
    mesesNoPeriodo,
    exclusaoPeriodo: Math.round(exclusaoPeriodo * 100) / 100,
    exclusaoAcumulada: Math.round(novaExclusaoAcumulada * 100) / 100,
    saldoRemanescente: Math.round(Math.max(0, saldoGoodwill - novaExclusaoAcumulada) * 100) / 100,
    mesesRestantes,
    dedutivel: true,
    artigo: 'Art. 433',
    ajusteLalur: {
      tipo: 'EXCLUSAO',
      valor: Math.round(exclusaoPeriodo * 100) / 100,
      descricao: 'Exclusão do lucro líquido — amortização do goodwill (1/60 p/mês máx.)'
    },
    economia: {
      irpj: exclusaoPeriodo * 0.25,
      csll: exclusaoPeriodo * 0.09,
      total: exclusaoPeriodo * 0.34
    }
  };
}

/**
 * Analisa o tratamento de participações societárias e dividendos (Art. 415-418).
 *
 * @param {Object} dados
 * @param {number} [dados.dividendosRecebidos=0] - Dividendos recebidos de PJ no País
 * @param {number} [dados.resultadoMEP=0] - Resultado da equivalência patrimonial (positivo ou negativo)
 * @param {number} [dados.ganhoVendaParticipacao=0] - Ganho na venda de participação societária
 * @param {number} [dados.prejuizoVendaParticipacao=0] - Prejuízo na venda de participação
 * @param {boolean} [dados.dividendosPos1996=true] - Se dividendos calculados a partir de jan/1996
 * @param {boolean} [dados.participacaoAdquiridaHaMenos6Meses=false] - Se adquirida < 6 meses antes
 * @returns {Object} Ajustes no LALUR
 *
 * Base Legal: Art. 415-418, 426 do RIR/2018
 */
function analisarParticipacoesSOcietarias(dados) {
  const {
    dividendosRecebidos = 0,
    resultadoMEP = 0,
    ganhoVendaParticipacao = 0,
    prejuizoVendaParticipacao = 0,
    dividendosPos1996 = true,
    participacaoAdquiridaHaMenos6Meses = false
  } = dados;

  const ajustes = {
    exclusoes: [],
    adicoes: [],
    totalExclusoes: 0,
    totalAdicoes: 0,
    observacoes: []
  };

  // 1. Dividendos recebidos (Art. 415, 418)
  if (dividendosRecebidos > 0) {
    if (dividendosPos1996) {
      if (participacaoAdquiridaHaMenos6Meses) {
        // Art. 416: Redução do custo de aquisição, sem efeito no resultado
        ajustes.observacoes.push(
          `Art. 416: Dividendos de R$ ${dividendosRecebidos.toFixed(2)} recebidos de participação adquirida < 6 meses — registrar como redução do custo de aquisição (sem efeito no resultado).`
        );
      } else {
        // Art. 418: Não integram base de cálculo do IRPJ
        ajustes.exclusoes.push({
          descricao: 'Dividendos recebidos de PJ no País (pós jan/1996)',
          valor: dividendosRecebidos,
          artigo: 'Art. 418 c/c Art. 415 §1º'
        });
        ajustes.totalExclusoes += dividendosRecebidos;
      }
    } else {
      ajustes.observacoes.push('Dividendos de resultados anteriores a jan/1996 podem ter tratamento diverso.');
    }
  }

  // 2. Resultado da equivalência patrimonial (Art. 426)
  if (resultadoMEP !== 0) {
    if (resultadoMEP > 0) {
      // MEP positivo: excluir (já foi registrado como receita contábil, mas não é tributável)
      ajustes.exclusoes.push({
        descricao: 'Resultado positivo de equivalência patrimonial',
        valor: resultadoMEP,
        artigo: 'Art. 426'
      });
      ajustes.totalExclusoes += resultadoMEP;
    } else {
      // MEP negativo: adicionar (foi registrado como despesa contábil, mas não é dedutível)
      const valorAbsoluto = Math.abs(resultadoMEP);
      ajustes.adicoes.push({
        descricao: 'Resultado negativo de equivalência patrimonial',
        valor: valorAbsoluto,
        artigo: 'Art. 426'
      });
      ajustes.totalAdicoes += valorAbsoluto;
    }
  }

  // 3. Ações/quotas bonificadas (Art. 417)
  ajustes.observacoes.push('Art. 417: Ações/quotas bonificadas recebidas sem custo — não alteram valor do investimento nem lucro real.');

  return {
    dividendosRecebidos,
    resultadoMEP,
    ajustes: {
      exclusoes: ajustes.exclusoes,
      adicoes: ajustes.adicoes,
      totalExclusoes: Math.round(ajustes.totalExclusoes * 100) / 100,
      totalAdicoes: Math.round(ajustes.totalAdicoes * 100) / 100,
      efeitoLiquidoLalur: Math.round((ajustes.totalAdicoes - ajustes.totalExclusoes) * 100) / 100
    },
    observacoes: ajustes.observacoes,
    baseLegal: 'Art. 415-418, 426 do RIR/2018'
  };
}

/**
 * Analisa o tratamento do leasing/arrendamento mercantil (Art. 366-367).
 *
 * @param {Object} dados
 * @param {number} dados.contraprestacoesAnuais - Total de contraprestações pagas no período
 * @param {number} [dados.despesasFinanceirasLeasing=0] - Despesas financeiras do contrato
 * @param {number} [dados.depreciacaoBemLeasing=0] - Depreciação contabilizada pela arrendatária
 * @param {number} [dados.avpLeasing=0] - Ajuste a valor presente das obrigações de leasing
 * @param {boolean} [dados.bemRelacionadoProducao=true] - Se o bem é relacionado à produção
 * @param {boolean} [dados.contratoRegular=true] - Se o contrato atende Lei 6.099/74
 * @returns {Object} Análise fiscal do leasing
 *
 * Base Legal: Art. 366-367 do RIR/2018
 */
function analisarLeasing(dados) {
  const {
    contraprestacoesAnuais = 0,
    despesasFinanceirasLeasing = 0,
    depreciacaoBemLeasing = 0,
    avpLeasing = 0,
    bemRelacionadoProducao = true,
    contratoRegular = true
  } = dados;

  const resultado = {
    contraprestacoes: {
      valor: contraprestacoesAnuais,
      dedutivel: bemRelacionadoProducao && contratoRegular,
      artigo: 'Art. 366'
    },
    despesasFinanceiras: {
      valor: despesasFinanceirasLeasing,
      dedutivel: false,
      artigo: 'Art. 366 §1º',
      ajuste: despesasFinanceirasLeasing > 0 ? 'ADICAO ao lucro real' : null
    },
    depreciacaoArrendataria: {
      valor: depreciacaoBemLeasing,
      dedutivel: false,
      artigo: 'Art. 366 §3º',
      ajuste: depreciacaoBemLeasing > 0 ? 'ADICAO ao lucro real' : null
    },
    avp: {
      valor: avpLeasing,
      dedutivel: false,
      artigo: 'Art. 366 §2º',
      ajuste: avpLeasing > 0 ? 'ADICAO ao lucro real' : null
    },
    totalDedutivel: bemRelacionadoProducao && contratoRegular ? contraprestacoesAnuais : 0,
    totalAdicaoLalur: despesasFinanceirasLeasing + depreciacaoBemLeasing + avpLeasing
      + ((!bemRelacionadoProducao || !contratoRegular) ? contraprestacoesAnuais : 0),
    alertas: []
  };

  if (!bemRelacionadoProducao) {
    resultado.alertas.push('Art. 366: Bem não relacionado à produção — contraprestações INDEDUTÍVEIS.');
  }

  if (!contratoRegular) {
    resultado.alertas.push('Art. 367: Contrato irregular = compra e venda a prestação. Contraprestações deduzidas anteriormente devem ser ADICIONADAS ao lucro real com juros e multa.');
  }

  resultado.economia = {
    irpj: resultado.totalDedutivel * 0.25,
    csll: resultado.totalDedutivel * 0.09,
    total: resultado.totalDedutivel * 0.34
  };

  return resultado;
}

/**
 * Calcula a tributação de lucros de controladas/coligadas no exterior (Art. 446-451).
 *
 * @param {Object} dados
 * @param {Array<Object>} dados.investidas - Lista de investidas no exterior
 * @param {string} investidas[].nome - Nome da investida
 * @param {number} investidas[].lucroAntes IR - Lucro antes do IR no país de origem
 * @param {number} investidas[].participacao - % de participação (decimal)
 * @param {number} [investidas[].irPagoExterior=0] - IR pago no exterior
 * @param {number} [investidas[].prejuizoAcumulado=0] - Prejuízo acumulado anterior
 * @param {boolean} [investidas[].controlada=true] - Se é controlada (vs coligada)
 * @param {number} investidas[].taxaCambio - Taxa de câmbio (R$/USD ou R$/moeda)
 * @param {boolean} [investidas[].paisTributacaoFavorecida=false] - Se está em paraíso fiscal
 * @param {number} [investidas[].rendaAtivaPercentual=1] - % de renda ativa própria
 * @param {boolean} [dados.optouConsolidacao=false] - Se optou pela consolidação (Art. 449)
 * @returns {Object} Cálculo da tributação no Brasil
 *
 * Base Legal: Art. 446-451 do RIR/2018
 */
function calcularLucrosExterior(dados) {
  const { investidas = [], optouConsolidacao = false } = dados;

  if (investidas.length === 0) {
    return { erro: 'Informe ao menos uma investida no exterior' };
  }

  const resultados = [];
  let totalAdicaoLucroReal = 0;
  let totalCreditoIRExterior = 0;
  const naoConsolidaveis = [];
  let resultadoConsolidado = 0;

  investidas.forEach((inv, idx) => {
    const {
      nome = `Investida #${idx + 1}`,
      lucroAntesIR = 0,
      participacao = 0,
      irPagoExterior = 0,
      prejuizoAcumulado = 0,
      controlada = true,
      taxaCambio = 1,
      paisTributacaoFavorecida = false,
      rendaAtivaPercentual = 1
    } = inv;

    // Parcela do lucro atribuída à controladora
    const parcela = lucroAntesIR * participacao;
    const parcelaReais = parcela * taxaCambio;

    // Compensação com prejuízo acumulado
    const prejuizoCompensavel = Math.min(prejuizoAcumulado, Math.max(0, parcelaReais));
    const baseAposCompensacao = Math.max(0, parcelaReais - prejuizoCompensavel);

    // Crédito de IR pago no exterior (limitado ao IR brasileiro correspondente)
    const irBrasilCorrespondente = baseAposCompensacao * 0.25;
    const creditoIR = Math.min(irPagoExterior * taxaCambio * participacao, irBrasilCorrespondente);

    // Verificar se pode consolidar
    const podeConsolidar = optouConsolidacao
      && !paisTributacaoFavorecida
      && rendaAtivaPercentual >= 0.80;

    const resultado = {
      nome,
      controlada,
      participacao,
      lucroAntesIR,
      taxaCambio,
      parcelaReais: Math.round(parcelaReais * 100) / 100,
      prejuizoCompensado: Math.round(prejuizoCompensavel * 100) / 100,
      baseAposCompensacao: Math.round(baseAposCompensacao * 100) / 100,
      creditoIRExterior: Math.round(creditoIR * 100) / 100,
      adicaoLucroReal: Math.round(baseAposCompensacao * 100) / 100,
      podeConsolidar,
      artigo: controlada ? 'Art. 448' : 'Art. 446 §5º'
    };

    if (!podeConsolidar && optouConsolidacao) {
      resultado.motivoNaoConsolida = [];
      if (paisTributacaoFavorecida) resultado.motivoNaoConsolida.push('País com tributação favorecida (Art. 449 II)');
      if (rendaAtivaPercentual < 0.80) resultado.motivoNaoConsolida.push(`Renda ativa ${(rendaAtivaPercentual * 100).toFixed(0)}% < 80% (Art. 449 IV)`);
      naoConsolidaveis.push(resultado);
    }

    if (podeConsolidar) {
      resultadoConsolidado += baseAposCompensacao;
    } else {
      totalAdicaoLucroReal += baseAposCompensacao;
    }

    totalCreditoIRExterior += creditoIR;
    resultados.push(resultado);
  });

  // Se consolidação, adicionar o resultado líquido
  if (optouConsolidacao && resultadoConsolidado > 0) {
    totalAdicaoLucroReal += resultadoConsolidado;
  }
  // Resultado negativo da consolidação: só compensa com lucros futuros das mesmas PJs
  const prejuizoConsolidado = optouConsolidacao && resultadoConsolidado < 0 ? Math.abs(resultadoConsolidado) : 0;

  return {
    totalAdicaoLucroReal: Math.round(totalAdicaoLucroReal * 100) / 100,
    totalCreditoIRExterior: Math.round(totalCreditoIRExterior * 100) / 100,
    irpjDevido: Math.round(Math.max(0, totalAdicaoLucroReal * 0.25 - totalCreditoIRExterior) * 100) / 100,
    consolidacao: {
      optou: optouConsolidacao,
      resultadoConsolidado: Math.round(resultadoConsolidado * 100) / 100,
      prejuizoConsolidado: Math.round(prejuizoConsolidado * 100) / 100,
      investidasExcluidas: naoConsolidaveis.length,
      artigo: 'Art. 449'
    },
    investidas: resultados,
    regras: {
      conversao: 'Art. 446 §1º: Taxa de câmbio para venda na data da contabilização',
      prejuizoNoPais: 'Art. 446 §7º: Prejuízos no exterior NÃO compensáveis com lucros no País',
      incentivos: 'Art. 446 §10: Sem incentivos fiscais sobre IR de lucros no exterior'
    },
    baseLegal: 'Art. 446-451 do RIR/2018'
  };
}

/**
 * Gera relatório consolidado de todos os ajustes cobertos pelo Bloco D2.
 *
 * @param {Object} dados - Objeto com resultados das funções acima
 * @returns {Object} Relatório com totais de adições e exclusões no LALUR
 */
function gerarRelatorioD2(dados) {
  const {
    royalties,
    doacoes,
    previdencia,
    valorJusto,
    cambial,
    goodwill,
    participacoes,
    leasing,
    exterior
  } = dados;

  let totalAdicoes = 0;
  let totalExclusoes = 0;
  const itens = [];

  const _add = (nome, obj) => {
    if (!obj) return;
    if (obj.ajusteLalur) {
      if (obj.ajusteLalur.tipo === 'ADICAO') {
        totalAdicoes += obj.ajusteLalur.valor || 0;
        itens.push({ tipo: 'ADICAO', nome, valor: obj.ajusteLalur.valor });
      } else if (obj.ajusteLalur.tipo === 'EXCLUSAO') {
        totalExclusoes += obj.ajusteLalur.valor || 0;
        itens.push({ tipo: 'EXCLUSAO', nome, valor: obj.ajusteLalur.valor });
      }
    }
    if (obj.ajustes) {
      totalAdicoes += obj.ajustes.totalAdicoes || 0;
      totalExclusoes += obj.ajustes.totalExclusoes || 0;
      if (obj.ajustes.totalAdicoes) itens.push({ tipo: 'ADICAO', nome, valor: obj.ajustes.totalAdicoes });
      if (obj.ajustes.totalExclusoes) itens.push({ tipo: 'EXCLUSAO', nome, valor: obj.ajustes.totalExclusoes });
    }
    if (obj.totalAdicaoLalur) {
      totalAdicoes += obj.totalAdicaoLalur;
      itens.push({ tipo: 'ADICAO', nome, valor: obj.totalAdicaoLalur });
    }
  };

  _add('Royalties e Assistência Técnica', royalties);
  _add('Doações', doacoes);
  _add('Previdência Complementar', previdencia);
  _add('Valor Justo', valorJusto);
  _add('Goodwill', goodwill);
  _add('Participações Societárias e MEP', participacoes);
  _add('Leasing', leasing);
  _add('Lucros no Exterior', exterior);

  return {
    totalAdicoes: Math.round(totalAdicoes * 100) / 100,
    totalExclusoes: Math.round(totalExclusoes * 100) / 100,
    efeitoLiquido: Math.round((totalAdicoes - totalExclusoes) * 100) / 100,
    impactoTributario: {
      irpjAdicional: Math.round(totalAdicoes * 0.25 * 100) / 100,
      csllAdicional: Math.round(totalAdicoes * 0.09 * 100) / 100,
      economiaExclusoes: Math.round(totalExclusoes * 0.34 * 100) / 100
    },
    itens,
    baseLegal: 'Art. 361-451 do RIR/2018'
  };
}

/**
 * @private
 */

// ============================================================================
// EXPORTS
// ============================================================================


// ============================================================================
// EXEMPLOS DE USO
// ============================================================================


// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Área de atuação da SUDAM (Art. 630-633 do RIR/2018)
 * Lei Complementar 124/2007
 */
const AREA_SUDAM = {
  artigo: 'Art. 630-633',
  leiComplementar: 'LC 124/2007',
  estados: [
    'AC', 'AP', 'AM', 'MA', 'MT', 'PA', 'RO', 'RR', 'TO'
  ],
  descricao: 'Amazônia Legal: Estados do Acre, Amapá, Amazonas, Maranhão, Mato Grosso, Pará, Rondônia, Roraima e Tocantins',
  municipiosRelevantes: {
    'PA': {
      nome: 'Pará',
      inclui: 'Todo o estado',
      exemplosCidades: ['Belém', 'Marabá', 'Santarém', 'Novo Progresso', 'Altamira', 'Itaituba']
    }
  },
  novoProgresso: {
    estado: 'PA',
    codigoIBGE: '1505031',
    areaAtuacao: 'SUDAM',
    elegivel: true,
    observacao: 'Novo Progresso-PA está integralmente na área de atuação da SUDAM (Amazônia Legal)'
  }
};

/**
 * Área de atuação da SUDENE (Art. 627 do RIR/2018)
 * Lei Complementar 125/2007
 */
const AREA_SUDENE = {
  artigo: 'Art. 627',
  leiComplementar: 'LC 125/2007',
  estados: [
    'AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'
  ],
  parcial: {
    'MG': 'Municípios incluídos no Polígono das Secas e na área do antigo DNOCS (norte e nordeste de MG)',
    'ES': 'Municípios do norte do ES incluídos na área da extinta ADENE'
  }
};

/**
 * Setores prioritários para desenvolvimento regional — SUDAM
 * Decreto 4.212/2002 + atualizações
 */
const SETORES_PRIORITARIOS_SUDAM = {
  decreto: 'Decreto 4.212/2002',
  setores: [
    {
      id: 'AGROIND',
      descricao: 'Agroindústria',
      cnae: ['10', '11', '12'],
      exemplos: ['Beneficiamento de produtos agrícolas', 'Processamento de alimentos']
    },
    {
      id: 'BIOTECH',
      descricao: 'Biotecnologia',
      cnae: ['21', '72'],
      exemplos: ['Pesquisa e desenvolvimento em biotecnologia']
    },
    {
      id: 'CULTURA',
      descricao: 'Cultura',
      cnae: ['90', '91'],
      exemplos: ['Atividades artísticas e culturais']
    },
    {
      id: 'ELETROELETRO',
      descricao: 'Eletroeletrônica',
      cnae: ['26', '27'],
      exemplos: ['Fabricação de equipamentos eletrônicos']
    },
    {
      id: 'FLORESTAL',
      descricao: 'Florestal',
      cnae: ['02', '16'],
      exemplos: ['Manejo florestal sustentável', 'Reflorestamento']
    },
    {
      id: 'INFRA',
      descricao: 'Infraestrutura',
      cnae: ['42', '43'],
      exemplos: ['Construção de obras de infraestrutura']
    },
    {
      id: 'METAL',
      descricao: 'Metalurgia e Metal-Mecânica',
      cnae: ['24', '25', '28', '29'],
      exemplos: ['Siderurgia', 'Fabricação de máquinas']
    },
    {
      id: 'MINERAL',
      descricao: 'Mineral',
      cnae: ['07', '08', '23'],
      exemplos: ['Mineração', 'Beneficiamento de minerais']
    },
    {
      id: 'PESCA',
      descricao: 'Pesca e Aquicultura',
      cnae: ['03'],
      exemplos: ['Piscicultura', 'Aquicultura']
    },
    {
      id: 'QUIMICA',
      descricao: 'Química',
      cnae: ['20'],
      exemplos: ['Fabricação de produtos químicos']
    },
    {
      id: 'SERVICOS_TEC',
      descricao: 'Serviços de tecnologia e técnicos especializados',
      cnae: ['62', '63', '71', '72', '74'],
      exemplos: [
        'Tecnologia da informação',
        'Serviços de engenharia e arquitetura',
        'Geotecnologia e geoprocessamento',
        'Consultoria técnica ambiental',
        'Pesquisa e desenvolvimento'
      ],
      relevanteAGROGEO: true,
      observacao: 'AGROGEO: Geotecnologia, CAR, PRA, LAR, georeferenciamento = serviços técnicos especializados'
    },
    {
      id: 'TEXTIL',
      descricao: 'Têxtil, Confecção e Calçados',
      cnae: ['13', '14', '15'],
      exemplos: ['Fabricação de tecidos', 'Confecção']
    },
    {
      id: 'TURISMO',
      descricao: 'Turismo',
      cnae: ['55', '79'],
      exemplos: ['Hospedagem', 'Agenciamento de turismo']
    },
    {
      id: 'DIGITAL',
      descricao: 'Fabricação de equipamentos para inclusão digital',
      cnae: ['26.2'],
      isencaoTotal: true,
      artigo: 'Art. 634 §2º / Art. 628 §2º',
      exemplos: ['Fabricação de máquinas e equipamentos baseados em tecnologia digital']
    }
  ]
};

/**
 * Parâmetros do incentivo de redução de 75% do IRPJ (Art. 628/634)
 */
const INCENTIVO_REDUCAO_75 = {
  artigo: 'Art. 634 (SUDAM) / Art. 628 (SUDENE)',
  baseLegal: 'MP 2.199-14/2001, art. 1º (redação Lei 13.799/2019)',
  percentualReducao: 0.75, // 75%
  prazo: 10, // 10 anos de fruição
  projetoAprovadoAte: '2023-12-31', // MP 2.199-14, art. 1º
  prorrogacao: {
    lei: 'Lei 13.799/2019',
    novoLimite: '2023-12-31',
    observacao: 'Projetos protocolizados e aprovados até 31/12/2023'
  },
  tiposProjeto: [
    { id: 'INSTALACAO', descricao: 'Instalação de novo empreendimento' },
    { id: 'AMPLIACAO', descricao: 'Ampliação de empreendimento existente' },
    { id: 'MODERNIZACAO', descricao: 'Modernização total ou parcial' },
    { id: 'DIVERSIFICACAO', descricao: 'Diversificação da linha de produção/serviços' }
  ],
  requisitos: [
    'Lucro Real obrigatório (não aplicável a Simples Nacional ou Lucro Presumido)',
    'Projeto protocolizado e aprovado pela SUDAM/SUDENE até 31/12/2023',
    'Laudo Constitutivo emitido pela SUDAM/SUDENE',
    'Reconhecimento pela SRF (Art. 637)',
    'Unidade produtora em operação na área de atuação',
    'Atividade em setor considerado prioritário (Decreto 4.212/2002)',
    'Regularidade fiscal (CND/CPEN federal)',
    'Regularidade FGTS',
    'Produção efetiva > 20% da capacidade instalada (para admissibilidade)'
  ],
  reservaIncentivo: {
    artigo: 'Art. 523 / Art. 195-A da Lei 6.404/76',
    obrigacoes: [
      'Registrar em Reserva de Incentivos Fiscais (subconta da Reserva de Lucros)',
      'Uso permitido APENAS para: (I) absorção de prejuízos; (II) aumento de capital social',
      'VEDADA distribuição como dividendos (sob pena de perda do benefício + recolhimento do IR)',
      'Comunicar à SUDAM/SUDENE em caso de absorção de prejuízos (até 31/12 do exercício seguinte)',
      'Comunicar à SUDAM/SUDENE em caso de aumento de capital (até 60 dias)'
    ]
  }
};

/**
 * Parâmetros do reinvestimento de 30% do IRPJ (Art. 638-651)
 */
const REINVESTIMENTO_30 = {
  artigo: 'Art. 638-651',
  baseLegal: 'Lei 5.508/68, art. 23 + MP 2.199-14/2001, art. 3º + Lei 13.799/2019',
  percentual: 0.30, // 30% do IRPJ sobre lucro da exploração
  prazo: 'Até 31/12/2023',
  bancoDeposito: {
    SUDAM: 'Banco da Amazônia (BASA)',
    SUDENE: 'Banco do Nordeste do Brasil (BNB)'
  },
  capitalGiro: {
    percentualPermitido: 0.50, // 50% do valor reinvestido pode ser usado como capital de giro
    lei: 'Lei 13.799/2019',
    descricao: 'Metade do valor a ser reinvestido poderá ser utilizada como capital de giro'
  },
  destinacao: [
    'Modernização de equipamentos',
    'Complementação de equipamentos',
    'Custos de montagem e instalação',
    'Capital de giro (até 50% do valor — Lei 13.799/2019)'
  ],
  recursosPropriosComplementares: 0.50, // 50% de recursos próprios
  depositoPrazo: 'Nas mesmas datas de pagamento do IRPJ',
  remuneracao: 'Taxa Extramercado do Banco Central (enquanto não aplicado)',
  aprovacao: 'Liberação condicionada à aprovação do projeto pela SUDAM/SUDENE'
};

/**
 * Exclusões para cálculo do Lucro da Exploração (Art. 618-626)
 * IN SRF 267/2002, art. 2º
 */
const EXCLUSOES_LUCRO_EXPLORACAO = {
  artigo: 'Art. 618-626 / IN SRF 267/2002',
  excluirDoLucroLiquido: [
    {
      id: 'REC_FIN_LIQUIDA',
      descricao: 'Receitas financeiras líquidas (receitas financeiras – despesas financeiras, se positivo)',
      artigo: 'Art. 618 I / IN 267 art. 2º I',
      tipo: 'EXCLUSAO'
    },
    {
      id: 'RESULT_PARTIC_SOC',
      descricao: 'Resultados positivos de participações societárias (MEP, dividendos)',
      artigo: 'Art. 618 II / IN 267 art. 2º II',
      tipo: 'EXCLUSAO'
    },
    {
      id: 'RESULT_NAO_OPERAC',
      descricao: 'Resultados não operacionais (ganhos/perdas de capital, alienação de ativo não circulante)',
      artigo: 'Art. 618 III / IN 267 art. 2º III',
      tipo: 'EXCLUSAO'
    },
    {
      id: 'RECEITAS_ANTERIOR',
      descricao: 'Receitas de exercícios anteriores',
      artigo: 'Art. 618 IV / IN 267 art. 2º IV',
      tipo: 'EXCLUSAO'
    },
    {
      id: 'RESERVA_REAVALIACAO',
      descricao: 'Valores baixados de reserva de reavaliação (custo/despesa operacional com contrapartida em receita)',
      artigo: 'Art. 618 V / IN 267 art. 2º V',
      tipo: 'EXCLUSAO'
    },
    {
      id: 'SUBVENCOES',
      descricao: 'Subvenções para investimento registradas como receita',
      artigo: 'Art. 618 VI / IN 267 art. 2º VI',
      tipo: 'EXCLUSAO'
    },
    {
      id: 'LUCRO_INFLAC_PREOP',
      descricao: 'Parcela do lucro inflacionário de fase pré-operacional realizado',
      artigo: 'Art. 618 VII / IN 267 art. 2º VII',
      tipo: 'EXCLUSAO'
    },
    {
      id: 'TRIB_SUSPENSOS',
      descricao: 'Tributos com exigibilidade suspensa (art. 151 CTN, II a IV) — controlados na Parte B do LALUR',
      artigo: 'Art. 618 VIII / IN 267 art. 2º VIII',
      tipo: 'EXCLUSAO',
      observacao: 'Serão diminuídos do lucro da exploração quando efetivamente pagos'
    }
  ],
  adicionarAoLucroLiquido: [
    {
      id: 'CSLL_DEVIDA',
      descricao: 'CSLL devida no período de apuração',
      artigo: 'IN SRF 267/2002, art. 2º §1º',
      tipo: 'ADICAO',
      observacao: 'A CSLL é adicionada ao lucro líquido para fins de lucro da exploração'
    },
    {
      id: 'DESP_FIN_LIQUIDA',
      descricao: 'Despesas financeiras líquidas (se despesas financeiras > receitas financeiras)',
      artigo: 'IN SRF 267/2002, art. 2º §2º',
      tipo: 'ADICAO',
      observacao: 'Excesso de despesas financeiras sobre receitas financeiras é adicionado'
    },
    {
      id: 'PREJUIZO_PARTIC_SOC',
      descricao: 'Resultados negativos de participações societárias',
      artigo: 'IN SRF 267/2002, art. 2º §3º',
      tipo: 'ADICAO'
    }
  ],
  variacao_cambial: {
    artigo: 'IN SRF 267/2002, art. 2º §4º',
    regra: 'Variações monetárias de direitos e obrigações em função de câmbio são consideradas receitas/despesas financeiras para fins do lucro da exploração'
  }
};

/**
 * Depreciação acelerada incentivada — referência cruzada
 */
const DEPRECIACAO_ACELERADA_INCENTIVADA = {
  artigo: 'Art. 327-329 do RIR/2018 + IN SRF 267/2002, art. 6º',
  regra: 'Empresas com projeto SUDAM/SUDENE podem depreciar integralmente no ano de aquisição',
  metodo: 'Exclusão no LALUR — sem alterar contabilidade',
  tiposBens: [
    'Bens adquiridos para instalação ou expansão do empreendimento incentivado',
    'Máquinas, equipamentos, aparelhos, instrumentos'
  ],
  vedacao: 'Não se aplica a terrenos, edificações e bens que normalmente aumentam de valor com o tempo',
  observacao: 'Já tratada no bloco-d-despesas-dedutiveis.js — aqui calculamos impacto combinado com incentivo SUDAM'
};

// ============================================================================
// FUNÇÕES DE CÁLCULO
// ============================================================================

/**
 * Verifica elegibilidade da empresa para incentivos SUDAM/SUDENE.
 *
 * @param {Object} dados
 * @param {string} dados.uf - Sigla do estado (ex: 'PA')
 * @param {string} [dados.municipio] - Nome do município
 * @param {string} [dados.codigoIBGE] - Código IBGE do município
 * @param {string} dados.atividadePrincipal - Descrição da atividade principal
 * @param {string} [dados.cnaePrincipal] - CNAE principal (2 primeiros dígitos)
 * @param {string} dados.regimeTributario - 'LUCRO_REAL', 'SIMPLES', 'PRESUMIDO'
 * @param {boolean} [dados.projetoAprovado=false] - Se possui projeto aprovado pela SUDAM/SUDENE
 * @param {string} [dados.dataProtocolo] - Data do protocolo do projeto (YYYY-MM-DD)
 * @param {boolean} [dados.laudoConstitutivo=false] - Se possui laudo constitutivo
 * @param {boolean} [dados.reconhecimentoSRF=false] - Se possui reconhecimento pela SRF
 * @param {boolean} [dados.regularidadeFiscal=true] - Se está em dia com obrigações fiscais
 * @returns {Object} Análise de elegibilidade com alertas e recomendações
 *
 * Base Legal: Art. 627-637 do RIR/2018
 */
function verificarElegibilidade(dados) {
  const {
    uf,
    municipio = '',
    codigoIBGE = '',
    atividadePrincipal = '',
    cnaePrincipal = '',
    regimeTributario = 'SIMPLES',
    projetoAprovado = false,
    dataProtocolo = null,
    laudoConstitutivo = false,
    reconhecimentoSRF = false,
    regularidadeFiscal = true
  } = dados;

  const resultado = {
    elegivel: false,
    superintendencia: null,
    impedimentos: [],
    alertas: [],
    recomendacoes: [],
    setoresAplicaveis: [],
    incentivosDisponiveis: [],
    artigo: 'Art. 627-637'
  };

  // 1. Verificar localização
  const ufUpper = (uf || '').toUpperCase();
  const naAreaSUDAM = AREA_SUDAM.estados.includes(ufUpper);
  const naAreaSUDENE = AREA_SUDENE.estados.includes(ufUpper);
  const naAreaParciaisSUDENE = Object.keys(AREA_SUDENE.parcial).includes(ufUpper);

  if (naAreaSUDAM) {
    resultado.superintendencia = 'SUDAM';
    resultado.alertas.push(`${ufUpper} está na área de atuação da SUDAM (Amazônia Legal)`);
  } else if (naAreaSUDENE) {
    resultado.superintendencia = 'SUDENE';
    resultado.alertas.push(`${ufUpper} está na área de atuação da SUDENE`);
  } else if (naAreaParciaisSUDENE) {
    resultado.superintendencia = 'SUDENE_PARCIAL';
    resultado.alertas.push(`${ufUpper}: verificar se município está na área parcial da SUDENE — ${AREA_SUDENE.parcial[ufUpper]}`);
  } else {
    resultado.impedimentos.push({
      tipo: 'LOCALIZACAO',
      descricao: `${ufUpper} não está na área de atuação da SUDAM nem da SUDENE`,
      artigo: 'Art. 627/630'
    });
  }

  // 2. Verificar regime tributário
  if (regimeTributario !== 'LUCRO_REAL') {
    resultado.impedimentos.push({
      tipo: 'REGIME_TRIBUTARIO',
      descricao: `Regime atual (${regimeTributario}) não permite fruição dos incentivos. Obrigatório Lucro Real.`,
      artigo: 'MP 2.199-14/2001, art. 1º'
    });
    if (regimeTributario === 'SIMPLES') {
      resultado.recomendacoes.push(
        'MIGRAÇÃO NECESSÁRIA: Para usufruir dos incentivos SUDAM/SUDENE, a empresa deve migrar para o Lucro Real.'
      );
    }
  }

  // 3. Verificar setores prioritários
  const cnae2d = (cnaePrincipal || '').substring(0, 2);
  const atividadeLower = (atividadePrincipal || '').toLowerCase();

  SETORES_PRIORITARIOS_SUDAM.setores.forEach(setor => {
    const matchCNAE = setor.cnae.some(c => cnae2d.startsWith(c.substring(0, 2)));
    const matchDescricao = setor.exemplos.some(e => atividadeLower.includes(e.toLowerCase())) ||
      atividadeLower.includes(setor.descricao.toLowerCase());

    // Match específico para AGROGEO
    const matchGeo = atividadeLower.includes('geotecnologia') ||
      atividadeLower.includes('georeferenc') ||
      atividadeLower.includes('ambiental') ||
      atividadeLower.includes('consultoria técnica') ||
      atividadeLower.includes('geoprocess') ||
      atividadeLower.includes('car ') || atividadeLower.includes(' car') ||
      atividadeLower.includes('cadastro ambiental');

    if (matchCNAE || matchDescricao || (setor.id === 'SERVICOS_TEC' && matchGeo)) {
      resultado.setoresAplicaveis.push({
        setor: setor.id,
        descricao: setor.descricao,
        cnae: setor.cnae,
        isencao: setor.isencaoTotal || false
      });
    }
  });

  if (resultado.setoresAplicaveis.length === 0) {
    resultado.alertas.push(
      'Nenhum setor prioritário identificado automaticamente. Verificar enquadramento no Decreto 4.212/2002 (SUDAM) ou 4.213/2002 (SUDENE). Serviços técnicos especializados (CNAE 71/72/74) podem ser elegíveis.'
    );
  }

  // 4. Verificar projeto e laudo
  if (!projetoAprovado) {
    resultado.alertas.push(
      'Projeto ainda não protocolizado/aprovado. Prazo limite: 31/12/2023 (MP 2.199-14 c/ Lei 13.799/2019). Verificar possibilidade de prorrogação.'
    );
    resultado.recomendacoes.push(
      'AÇÃO URGENTE: Protocolar projeto junto à SUDAM para análise e emissão do Laudo Constitutivo.'
    );
  } else if (!laudoConstitutivo) {
    resultado.alertas.push('Projeto aprovado mas Laudo Constitutivo ainda não emitido pela SUDAM/SUDENE.');
    resultado.recomendacoes.push('Acompanhar emissão do Laudo Constitutivo junto à superintendência.');
  } else if (!reconhecimentoSRF) {
    resultado.alertas.push('Laudo emitido mas reconhecimento pela SRF ainda pendente (Art. 637).');
    resultado.recomendacoes.push(
      'Encaminhar requerimento à unidade da SRF jurisdicionante, instruído com Laudo Constitutivo original.'
    );
  }

  if (dataProtocolo) {
    const dataLimite = new Date('2023-12-31');
    const dataProt = new Date(dataProtocolo);
    if (dataProt > dataLimite) {
      resultado.impedimentos.push({
        tipo: 'PRAZO_PROTOCOLO',
        descricao: `Protocolo em ${dataProtocolo} é posterior ao prazo limite de 31/12/2023`,
        artigo: 'MP 2.199-14, art. 1º (Lei 13.799/2019)'
      });
    }
  }

  // 5. Regularidade fiscal
  if (!regularidadeFiscal) {
    resultado.impedimentos.push({
      tipo: 'REGULARIDADE_FISCAL',
      descricao: 'Empresa com pendências fiscais. Exigida regularidade FGTS + CND federal.',
      artigo: 'IN SRF 267/2002'
    });
  }

  // 6. Determinar elegibilidade
  resultado.elegivel = resultado.impedimentos.length === 0 && resultado.superintendencia != null;

  // 7. Montar incentivos disponíveis
  if (resultado.superintendencia && regimeTributario === 'LUCRO_REAL') {
    resultado.incentivosDisponiveis.push({
      tipo: 'REDUCAO_75',
      descricao: 'Redução de 75% do IRPJ sobre lucro da exploração',
      artigo: resultado.superintendencia === 'SUDAM' ? 'Art. 634' : 'Art. 628',
      prazo: '10 anos a partir do ano de início da fruição',
      requisito: 'Laudo Constitutivo + Reconhecimento SRF'
    });
    resultado.incentivosDisponiveis.push({
      tipo: 'REINVESTIMENTO_30',
      descricao: 'Depósito para reinvestimento de 30% do IRPJ sobre lucro da exploração',
      artigo: 'Art. 638-651',
      deposito: resultado.superintendencia === 'SUDAM' ? 'Banco da Amazônia (BASA)' : 'BNB',
      capitalGiro: '50% do valor pode ser usado como capital de giro (Lei 13.799/2019)'
    });
    resultado.incentivosDisponiveis.push({
      tipo: 'DEPRECIACAO_ACELERADA',
      descricao: 'Depreciação acelerada incentivada — dedução integral no ano de aquisição',
      artigo: 'Art. 327-329',
      requisito: 'Bens do projeto incentivado'
    });
  }

  return resultado;
}

/**
 * Calcula o Lucro da Exploração a partir do lucro líquido.
 * O lucro da exploração é a base para cálculo dos incentivos SUDAM/SUDENE.
 *
 * @param {Object} dados
 * @param {number} dados.lucroLiquido - Lucro líquido antes do IRPJ (após CSLL)
 * @param {number} [dados.receitasFinanceiras=0] - Receitas financeiras do período
 * @param {number} [dados.despesasFinanceiras=0] - Despesas financeiras do período
 * @param {number} [dados.resultadoParticipacoes=0] - Resultado de participações societárias (positivo=receita, negativo=despesa)
 * @param {number} [dados.ganhosCapitalAtivoNaoCirc=0] - Ganhos de capital em ativo não circulante
 * @param {number} [dados.perdasCapitalAtivoNaoCirc=0] - Perdas de capital em ativo não circulante
 * @param {number} [dados.receitasExerciciosAnteriores=0] - Receitas de exercícios anteriores
 * @param {number} [dados.subvencoesReceita=0] - Subvenções registradas como receita
 * @param {number} [dados.csllDevida=0] - CSLL devida no período (a ser adicionada)
 * @param {number} [dados.tributosSuspensos=0] - Tributos com exigibilidade suspensa (Art. 151 CTN)
 * @param {number} [dados.tributosSuspensosPagos=0] - Tributos suspensos efetivamente pagos no período
 * @param {number} [dados.variacaoCambialAtiva=0] - Variação cambial ativa (tratada como rec. financeira)
 * @param {number} [dados.variacaoCambialPassiva=0] - Variação cambial passiva (tratada como desp. financeira)
 * @returns {Object} Lucro da exploração calculado com detalhamento
 *
 * Base Legal: Art. 618-626 do RIR/2018, IN SRF 267/2002, art. 2º
 */
function calcularLucroExploracao(dados) {
  const {
    lucroLiquido = 0,
    receitasFinanceiras = 0,
    despesasFinanceiras = 0,
    resultadoParticipacoes = 0,
    ganhosCapitalAtivoNaoCirc = 0,
    perdasCapitalAtivoNaoCirc = 0,
    receitasExerciciosAnteriores = 0,
    subvencoesReceita = 0,
    csllDevida = 0,
    tributosSuspensos = 0,
    tributosSuspensosPagos = 0,
    variacaoCambialAtiva = 0,
    variacaoCambialPassiva = 0
  } = dados;

  // Receitas e despesas financeiras incluem variações cambiais
  const recFinTotal = receitasFinanceiras + variacaoCambialAtiva;
  const despFinTotal = despesasFinanceiras + variacaoCambialPassiva;

  // Resultado financeiro líquido
  const resultadoFinanceiroLiquido = recFinTotal - despFinTotal;

  // Resultado não operacional (ganhos - perdas de capital)
  const resultadoNaoOperacional = ganhosCapitalAtivoNaoCirc - perdasCapitalAtivoNaoCirc;

  // === EXCLUSÕES ===
  let totalExclusoes = 0;
  const detalhamentoExclusoes = [];

  // I - Receitas financeiras líquidas (se positivo)
  if (resultadoFinanceiroLiquido > 0) {
    totalExclusoes += resultadoFinanceiroLiquido;
    detalhamentoExclusoes.push({
      id: 'REC_FIN_LIQUIDA',
      valor: resultadoFinanceiroLiquido,
      descricao: `Receitas financeiras líquidas (${recFinTotal.toFixed(2)} - ${despFinTotal.toFixed(2)})`,
      artigo: 'Art. 618 I'
    });
  }

  // II - Resultados positivos de participações societárias
  if (resultadoParticipacoes > 0) {
    totalExclusoes += resultadoParticipacoes;
    detalhamentoExclusoes.push({
      id: 'RESULT_PARTIC_SOC',
      valor: resultadoParticipacoes,
      descricao: 'Resultados positivos de participações societárias',
      artigo: 'Art. 618 II'
    });
  }

  // III - Resultados não operacionais (positivos)
  if (resultadoNaoOperacional > 0) {
    totalExclusoes += resultadoNaoOperacional;
    detalhamentoExclusoes.push({
      id: 'RESULT_NAO_OPERAC',
      valor: resultadoNaoOperacional,
      descricao: 'Ganhos de capital em ativo não circulante (líquido)',
      artigo: 'Art. 618 III'
    });
  }

  // IV - Receitas de exercícios anteriores
  if (receitasExerciciosAnteriores > 0) {
    totalExclusoes += receitasExerciciosAnteriores;
    detalhamentoExclusoes.push({
      id: 'RECEITAS_ANTERIOR',
      valor: receitasExerciciosAnteriores,
      descricao: 'Receitas de exercícios anteriores',
      artigo: 'Art. 618 IV'
    });
  }

  // VI - Subvenções como receita
  if (subvencoesReceita > 0) {
    totalExclusoes += subvencoesReceita;
    detalhamentoExclusoes.push({
      id: 'SUBVENCOES',
      valor: subvencoesReceita,
      descricao: 'Subvenções para investimento registradas como receita',
      artigo: 'Art. 618 VI'
    });
  }

  // VIII - Tributos com exigibilidade suspensa (não pagos)
  const tribSuspensosLiquido = tributosSuspensos - tributosSuspensosPagos;
  if (tribSuspensosLiquido > 0) {
    totalExclusoes += tribSuspensosLiquido;
    detalhamentoExclusoes.push({
      id: 'TRIB_SUSPENSOS',
      valor: tribSuspensosLiquido,
      descricao: 'Tributos com exigibilidade suspensa (Art. 151 CTN)',
      artigo: 'Art. 618 VIII'
    });
  }

  // === ADIÇÕES ===
  let totalAdicoes = 0;
  const detalhamentoAdicoes = [];

  // CSLL devida
  if (csllDevida > 0) {
    totalAdicoes += csllDevida;
    detalhamentoAdicoes.push({
      id: 'CSLL_DEVIDA',
      valor: csllDevida,
      descricao: 'CSLL devida no período',
      artigo: 'IN SRF 267/2002, art. 2º §1º'
    });
  }

  // Despesas financeiras líquidas (se despesas > receitas)
  if (resultadoFinanceiroLiquido < 0) {
    const despFinLiquida = Math.abs(resultadoFinanceiroLiquido);
    totalAdicoes += despFinLiquida;
    detalhamentoAdicoes.push({
      id: 'DESP_FIN_LIQUIDA',
      valor: despFinLiquida,
      descricao: `Despesas financeiras líquidas (${despFinTotal.toFixed(2)} - ${recFinTotal.toFixed(2)})`,
      artigo: 'IN SRF 267/2002, art. 2º §2º'
    });
  }

  // Resultados negativos de participações societárias
  if (resultadoParticipacoes < 0) {
    const prejPartic = Math.abs(resultadoParticipacoes);
    totalAdicoes += prejPartic;
    detalhamentoAdicoes.push({
      id: 'PREJUIZO_PARTIC_SOC',
      valor: prejPartic,
      descricao: 'Resultados negativos de participações societárias',
      artigo: 'IN SRF 267/2002, art. 2º §3º'
    });
  }

  // Resultados não operacionais negativos
  if (resultadoNaoOperacional < 0) {
    const perdaNaoOp = Math.abs(resultadoNaoOperacional);
    totalAdicoes += perdaNaoOp;
    detalhamentoAdicoes.push({
      id: 'PERDA_NAO_OPERAC',
      valor: perdaNaoOp,
      descricao: 'Perdas de capital em ativo não circulante',
      artigo: 'Art. 618 III (simétrico)'
    });
  }

  // === CÁLCULO DO LUCRO DA EXPLORAÇÃO ===
  const lucroExploracao = lucroLiquido + totalAdicoes - totalExclusoes;

  return {
    lucroLiquido,
    exclusoes: {
      total: Math.round(totalExclusoes * 100) / 100,
      detalhamento: detalhamentoExclusoes
    },
    adicoes: {
      total: Math.round(totalAdicoes * 100) / 100,
      detalhamento: detalhamentoAdicoes
    },
    lucroExploracao: Math.round(Math.max(0, lucroExploracao) * 100) / 100,
    lucroExploracaoBruto: Math.round(lucroExploracao * 100) / 100,
    prejuizoExploracao: lucroExploracao < 0,
    baseLegal: 'Art. 618-626 do RIR/2018 + IN SRF 267/2002'
  };
}

/**
 * Calcula a proporção do lucro da exploração atribuível à atividade incentivada.
 * Necessário quando a empresa tem atividades incentivadas e não incentivadas.
 *
 * @param {Object} dados
 * @param {number} dados.receitaLiquidaTotal - Receita líquida total da empresa
 * @param {number} dados.receitaLiquidaIncentivada - Receita líquida da atividade incentivada (conforme Laudo)
 * @param {number} dados.lucroExploracao - Lucro da exploração já calculado
 * @returns {Object} Proporção e lucro da exploração incentivado
 *
 * Base Legal: IN SRF 267/2002, art. 3º
 */
function calcularProporcaoIncentivada(dados) {
  const {
    receitaLiquidaTotal = 0,
    receitaLiquidaIncentivada = 0,
    lucroExploracao = 0
  } = dados;

  if (receitaLiquidaTotal <= 0) {
    return {
      proporcao: 0,
      lucroExploracaoIncentivado: 0,
      lucroExploracaoNaoIncentivado: lucroExploracao,
      alertas: ['Receita líquida total é zero ou negativa — não é possível calcular proporção'],
      artigo: 'IN SRF 267/2002, art. 3º'
    };
  }

  const proporcao = Math.min(1, receitaLiquidaIncentivada / receitaLiquidaTotal);
  const lucroExploracaoIncentivado = lucroExploracao * proporcao;

  return {
    receitaLiquidaTotal: Math.round(receitaLiquidaTotal * 100) / 100,
    receitaLiquidaIncentivada: Math.round(receitaLiquidaIncentivada * 100) / 100,
    proporcao: Math.round(proporcao * 10000) / 10000, // 4 casas
    lucroExploracaoIncentivado: Math.round(Math.max(0, lucroExploracaoIncentivado) * 100) / 100,
    lucroExploracaoNaoIncentivado: Math.round(Math.max(0, lucroExploracao - lucroExploracaoIncentivado) * 100) / 100,
    observacao: proporcao >= 1
      ? 'Toda a receita é incentivada — lucro da exploração = lucro da exploração incentivado'
      : `${(proporcao * 100).toFixed(2)}% da receita é incentivada`,
    artigo: 'IN SRF 267/2002, art. 3º'
  };
}

/**
 * Calcula a redução de 75% do IRPJ sobre o lucro da exploração.
 * Principal incentivo SUDAM/SUDENE.
 *
 * @param {Object} dados
 * @param {number} dados.lucroExploracaoIncentivado - Lucro da exploração da atividade incentivada
 * @param {number} [dados.aliquotaIRPJ=0.15] - Alíquota base do IRPJ (15%)
 * @param {number} [dados.limiteAdicional=60000] - Limite trimestral para adicional (R$60.000/tri = R$240.000/ano)
 * @param {boolean} [dados.anual=true] - Se apuração é anual (true) ou trimestral (false)
 * @param {number} [dados.percentualReducao=0.75] - Percentual de redução (padrão 75%)
 * @param {boolean} [dados.isencaoInclusaoDigital=false] - Se é isenção total (inclusão digital)
 * @returns {Object} Cálculo da redução do IRPJ com economia detalhada
 *
 * Base Legal: Art. 634 (SUDAM) / Art. 628 (SUDENE) / MP 2.199-14, art. 1º
 */
function calcularReducao75IRPJ(dados) {
  const {
    lucroExploracaoIncentivado = 0,
    aliquotaIRPJ = 0.15,
    limiteAdicional = 60000, // por trimestre
    anual = true,
    percentualReducao = 0.75,
    isencaoInclusaoDigital = false
  } = dados;

  if (lucroExploracaoIncentivado <= 0) {
    return {
      lucroExploracaoIncentivado: 0,
      irpjSobreLucroExploracao: 0,
      adicionalSobreLucroExploracao: 0,
      totalIRPJIncentivado: 0,
      reducao: 0,
      irpjAposReducao: 0,
      economia: { irpj: 0, total: 0 },
      artigo: isencaoInclusaoDigital ? 'Art. 634 §2º' : 'Art. 634'
    };
  }

  // Calcular IRPJ base sobre lucro da exploração
  const irpjBase = lucroExploracaoIncentivado * aliquotaIRPJ;

  // Calcular adicional de 10% sobre excedente
  const limiteAnual = anual ? limiteAdicional * 4 : limiteAdicional;
  const excedente = Math.max(0, lucroExploracaoIncentivado - limiteAnual);
  const adicional = excedente * 0.10;

  const totalIRPJIncentivado = irpjBase + adicional;

  // Aplicar redução
  const reducaoEfetiva = isencaoInclusaoDigital ? 1.0 : percentualReducao;
  const valorReducao = totalIRPJIncentivado * reducaoEfetiva;
  const irpjAposReducao = totalIRPJIncentivado - valorReducao;

  return {
    lucroExploracaoIncentivado: Math.round(lucroExploracaoIncentivado * 100) / 100,
    irpjSobreLucroExploracao: Math.round(irpjBase * 100) / 100,
    adicionalSobreLucroExploracao: Math.round(adicional * 100) / 100,
    totalIRPJIncentivado: Math.round(totalIRPJIncentivado * 100) / 100,
    percentualReducao: reducaoEfetiva,
    reducao: Math.round(valorReducao * 100) / 100,
    irpjAposReducao: Math.round(irpjAposReducao * 100) / 100,
    economia: {
      irpj: Math.round(valorReducao * 100) / 100,
      total: Math.round(valorReducao * 100) / 100
    },
    ajusteLalur: null, // A redução é deduzida diretamente do IRPJ — não é ajuste no LALUR
    reservaIncentivo: {
      valor: Math.round(valorReducao * 100) / 100,
      descricao: 'Registrar em Reserva de Incentivos Fiscais (Art. 195-A Lei 6.404/76)',
      destino: 'Somente absorção de prejuízos ou aumento de capital social',
      vedacao: 'Vedada distribuição como dividendos'
    },
    artigo: isencaoInclusaoDigital ? 'Art. 634 §2º (isenção digital)' : 'Art. 634 (SUDAM) / Art. 628 (SUDENE)'
  };
}

/**
 * Calcula o reinvestimento de 30% do IRPJ sobre o lucro da exploração.
 *
 * @param {Object} dados
 * @param {number} dados.lucroExploracaoIncentivado - Lucro da exploração da atividade incentivada
 * @param {number} [dados.irpjSobreLucroExploracao] - IRPJ (15% + adicional) sobre lucro da exploração
 * @param {number} [dados.reducao75Ja=0] - Valor já reduzido via incentivo de 75%
 * @param {string} [dados.superintendencia='SUDAM'] - 'SUDAM' ou 'SUDENE'
 * @returns {Object} Cálculo do reinvestimento de 30%
 *
 * Base Legal: Art. 638-651 do RIR/2018 / Lei 5.508/68, art. 23 / MP 2.199-14, art. 3º
 */
function calcularReinvestimento30(dados) {
  const {
    lucroExploracaoIncentivado = 0,
    irpjSobreLucroExploracao = null,
    reducao75Ja = 0,
    superintendencia = 'SUDAM'
  } = dados;

  // Se não informado, calcular IRPJ
  let irpjBase = irpjSobreLucroExploracao;
  if (irpjBase === null) {
    irpjBase = lucroExploracaoIncentivado * 0.15;
    const adicional = Math.max(0, lucroExploracaoIncentivado - 240000) * 0.10;
    irpjBase += adicional;
  }

  // IRPJ líquido = IRPJ total - redução 75% já aplicada
  const irpjLiquido = Math.max(0, irpjBase - reducao75Ja);

  // Reinvestimento = 30% do IRPJ sobre lucro da exploração (ANTES da redução 75%)
  const valorReinvestimento = irpjBase * REINVESTIMENTO_30.percentual;
  const recursosPropriosNecessarios = valorReinvestimento * REINVESTIMENTO_30.recursosPropriosComplementares;
  const capitalGiroPermitido = valorReinvestimento * REINVESTIMENTO_30.capitalGiro.percentualPermitido;

  const banco = REINVESTIMENTO_30.bancoDeposito[superintendencia] || 'Banco da Amazônia (BASA)';

  return {
    irpjSobreLucroExploracao: Math.round(irpjBase * 100) / 100,
    reducao75Ja: Math.round(reducao75Ja * 100) / 100,
    irpjLiquido: Math.round(irpjLiquido * 100) / 100,
    valorReinvestimento: Math.round(valorReinvestimento * 100) / 100,
    recursosPropriosNecessarios: Math.round(recursosPropriosNecessarios * 100) / 100,
    totalDeposito: Math.round((valorReinvestimento + recursosPropriosNecessarios) * 100) / 100,
    capitalGiroPermitido: Math.round(capitalGiroPermitido * 100) / 100,
    bancoDeposito: banco,
    prazoDeposito: 'Nas mesmas datas de pagamento do IRPJ',
    economia: {
      irpj: Math.round(valorReinvestimento * 100) / 100,
      total: Math.round(valorReinvestimento * 100) / 100
    },
    alertas: [
      `Depositar R$ ${valorReinvestimento.toFixed(2)} + R$ ${recursosPropriosNecessarios.toFixed(2)} (próprios) no ${banco}`,
      `Até 50% (R$ ${capitalGiroPermitido.toFixed(2)}) pode ser usado como capital de giro (Lei 13.799/2019)`,
      'Liberação condicionada à aprovação do projeto pela SUDAM/SUDENE'
    ],
    artigo: 'Art. 638-651 / Lei 5.508/68, art. 23 / Lei 13.799/2019'
  };
}

/**
 * Calcula a economia total combinando redução 75% + reinvestimento 30%.
 * Função principal para simulação AGROGEO.
 *
 * @param {Object} dados
 * @param {number} dados.lucroLiquido - Lucro líquido antes do IRPJ (após CSLL)
 * @param {number} [dados.receitasFinanceiras=0] - Receitas financeiras
 * @param {number} [dados.despesasFinanceiras=0] - Despesas financeiras
 * @param {number} [dados.resultadoParticipacoes=0] - Resultado participações
 * @param {number} [dados.ganhosCapitalAtivoNaoCirc=0] - Ganhos de capital
 * @param {number} [dados.perdasCapitalAtivoNaoCirc=0] - Perdas de capital
 * @param {number} [dados.receitasExerciciosAnteriores=0] - Receitas exercícios anteriores
 * @param {number} [dados.subvencoesReceita=0] - Subvenções
 * @param {number} [dados.csllDevida=0] - CSLL devida
 * @param {number} dados.receitaLiquidaTotal - Receita líquida total
 * @param {number} dados.receitaLiquidaIncentivada - Receita líquida incentivada
 * @param {boolean} [dados.anual=true] - Apuração anual
 * @param {string} [dados.superintendencia='SUDAM'] - Superintendência
 * @param {boolean} [dados.usarReinvestimento=true] - Se utilizar reinvestimento 30%
 * @returns {Object} Simulação completa com economia total
 *
 * Base Legal: Art. 618-651 do RIR/2018
 */
function simularIncentivosRegionais(dados) {
  const {
    receitaLiquidaTotal = 0,
    receitaLiquidaIncentivada = 0,
    anual = true,
    superintendencia = 'SUDAM',
    usarReinvestimento = true
  } = dados;

  // Passo 1: Calcular Lucro da Exploração
  const le = calcularLucroExploracao(dados);

  // Passo 2: Proporção incentivada
  const proporcao = calcularProporcaoIncentivada({
    receitaLiquidaTotal,
    receitaLiquidaIncentivada,
    lucroExploracao: le.lucroExploracao
  });

  // Passo 3: Redução 75%
  const reducao = calcularReducao75IRPJ({
    lucroExploracaoIncentivado: proporcao.lucroExploracaoIncentivado,
    anual
  });

  // Passo 4: Reinvestimento 30%
  let reinvestimento = null;
  if (usarReinvestimento && proporcao.lucroExploracaoIncentivado > 0) {
    reinvestimento = calcularReinvestimento30({
      lucroExploracaoIncentivado: proporcao.lucroExploracaoIncentivado,
      irpjSobreLucroExploracao: reducao.totalIRPJIncentivado,
      reducao75Ja: reducao.reducao,
      superintendencia
    });
  }

  // Passo 5: IRPJ total sem incentivos
  const irpjSemIncentivo = reducao.totalIRPJIncentivado;

  // Passo 6: IRPJ total com incentivos
  const irpjComReducao = reducao.irpjAposReducao;
  const irpjComReinvestimento = reinvestimento
    ? Math.max(0, irpjComReducao - reinvestimento.valorReinvestimento)
    : irpjComReducao;

  // Economia total
  const economiaReducao = reducao.reducao;
  const economiaReinvestimento = reinvestimento ? reinvestimento.valorReinvestimento : 0;
  const economiaTotal = economiaReducao + economiaReinvestimento;
  const cargaEfetiva = le.lucroExploracao > 0
    ? irpjComReinvestimento / le.lucroExploracao
    : 0;

  return {
    // Etapas
    lucroExploracao: le,
    proporcaoIncentivada: proporcao,
    reducao75: reducao,
    reinvestimento30: reinvestimento,

    // Resumo
    resumo: {
      lucroExploracao: le.lucroExploracao,
      lucroExploracaoIncentivado: proporcao.lucroExploracaoIncentivado,
      irpjSemIncentivo: Math.round(irpjSemIncentivo * 100) / 100,
      irpjComReducao75: Math.round(irpjComReducao * 100) / 100,
      irpjFinal: Math.round(irpjComReinvestimento * 100) / 100,
      economiaReducao75: Math.round(economiaReducao * 100) / 100,
      economiaReinvestimento30: Math.round(economiaReinvestimento * 100) / 100,
      economiaTotal: Math.round(economiaTotal * 100) / 100,
      cargaEfetivaIRPJ: Math.round(cargaEfetiva * 10000) / 10000, // em decimal
      cargaEfetivaIRPJPercent: (cargaEfetiva * 100).toFixed(2) + '%',
      superintendencia
    },

    economia: {
      irpj: Math.round(economiaTotal * 100) / 100,
      csll: 0, // CSLL não tem incentivo regional
      total: Math.round(economiaTotal * 100) / 100
    },

    observacoes: [
      `Lucro da Exploração apurado: R$ ${le.lucroExploracao.toFixed(2)}`,
      `Proporção incentivada: ${(proporcao.proporcao * 100).toFixed(2)}%`,
      `Redução 75%: R$ ${economiaReducao.toFixed(2)}`,
      reinvestimento ? `Reinvestimento 30%: R$ ${economiaReinvestimento.toFixed(2)} (depositar no ${REINVESTIMENTO_30.bancoDeposito[superintendencia]})` : null,
      `Economia total IRPJ: R$ ${economiaTotal.toFixed(2)}`,
      `Carga efetiva IRPJ sobre lucro da exploração: ${(cargaEfetiva * 100).toFixed(2)}%`,
      'IMPORTANTE: Registrar economia em Reserva de Incentivos Fiscais (Art. 195-A Lei 6.404/76)',
      'CSLL não possui redução por incentivos regionais — alíquota cheia de 9%'
    ].filter(Boolean),

    baseLegal: 'Art. 618-651 do RIR/2018 + MP 2.199-14/2001 + Lei 13.799/2019'
  };
}

/**
 * Simula comparativo completo: Simples Nacional vs Lucro Real COM incentivos SUDAM.
 * Função específica para AGROGEO BRASIL.
 *
 * @param {Object} dados
 * @param {number} dados.receitaBrutaAnual - Receita bruta anual (ex: 2_350_000)
 * @param {number} dados.folhaSalarial - Folha salarial anual (ex: 1_000_000)
 * @param {number} [dados.despesasDedutiveis=0] - Despesas dedutíveis totais
 * @param {number} [dados.receitasFinanceiras=0] - Receitas financeiras
 * @param {number} [dados.despesasFinanceiras=0] - Despesas financeiras
 * @param {number} [dados.percentualReceitaIncentivada=1.0] - % da receita incentivada (0 a 1)
 * @param {number} [dados.aliquotaSimplesEfetiva] - Alíquota efetiva do Simples (se conhecida)
 * @param {string} [dados.anexoSimples='III'] - Anexo do Simples Nacional
 * @returns {Object} Comparativo detalhado com recomendação
 *
 * Base Legal: LC 123/2006 (Simples) vs Art. 618-651 RIR/2018 (Lucro Real + SUDAM)
 */
function compararSimplesVsLucroRealSUDAM(dados) {
  const {
    receitaBrutaAnual = 0,
    folhaSalarial = 0,
    despesasDedutiveis = 0,
    receitasFinanceiras = 0,
    despesasFinanceiras = 0,
    percentualReceitaIncentivada = 1.0,
    aliquotaSimplesEfetiva = null,
    anexoSimples = 'III'
  } = dados;

  // ===== SIMPLES NACIONAL =====
  // Alíquotas do Anexo III (serviços) — faixa 5 (> R$ 1,8M até R$ 3,6M)
  // Alíquota nominal 33%, dedução R$ 648.000 → efetiva ~5,4% a 14,7%
  let aliquotaSimples = aliquotaSimplesEfetiva;
  if (!aliquotaSimples) {
    if (anexoSimples === 'III') {
      // Faixas do Anexo III (LC 123/2006, Anexo III)
      if (receitaBrutaAnual <= 180000) aliquotaSimples = 0.06;
      else if (receitaBrutaAnual <= 360000) aliquotaSimples = 0.112;
      else if (receitaBrutaAnual <= 720000) aliquotaSimples = 0.135;
      else if (receitaBrutaAnual <= 1800000) aliquotaSimples = 0.16;
      else if (receitaBrutaAnual <= 3600000) aliquotaSimples = (receitaBrutaAnual * 0.21 - 125640) / receitaBrutaAnual;
      else if (receitaBrutaAnual <= 4800000) aliquotaSimples = (receitaBrutaAnual * 0.33 - 648000) / receitaBrutaAnual;
      else aliquotaSimples = 0.165; // ultrapassou limite Simples
    } else if (anexoSimples === 'V') {
      // Anexo V — pode ser reclassificado para Anexo III se fator R >= 28%
      const fatorR = folhaSalarial / receitaBrutaAnual;
      if (fatorR >= 0.28) {
        // Usa alíquotas do Anexo III
        if (receitaBrutaAnual <= 1800000) aliquotaSimples = 0.155;
        else aliquotaSimples = (receitaBrutaAnual * 0.21 - 125640) / receitaBrutaAnual;
      } else {
        if (receitaBrutaAnual <= 1800000) aliquotaSimples = 0.195;
        else aliquotaSimples = (receitaBrutaAnual * 0.305 - 540000) / receitaBrutaAnual;
      }
    }
  }
  aliquotaSimples = Math.max(0.06, Math.min(aliquotaSimples, 0.33));
  const tributosSimples = receitaBrutaAnual * aliquotaSimples;

  // ===== LUCRO REAL SEM INCENTIVO SUDAM =====
  const lucroContabil = receitaBrutaAnual - despesasDedutiveis - folhaSalarial;
  const csllSemIncentivo = Math.max(0, lucroContabil) * 0.09;
  const lucroLiquidoAposCSLL = lucroContabil - csllSemIncentivo;
  const irpjSemIncentivo = Math.max(0, lucroContabil) * 0.15 + Math.max(0, lucroContabil - 240000) * 0.10;
  const pisNaoCumulativo = receitaBrutaAnual * 0.0165;
  const cofinsNaoCumulativo = receitaBrutaAnual * 0.076;
  const totalLRSemIncentivo = irpjSemIncentivo + csllSemIncentivo + pisNaoCumulativo + cofinsNaoCumulativo;

  // ===== LUCRO REAL COM INCENTIVO SUDAM =====
  const simulacao = simularIncentivosRegionais({
    lucroLiquido: lucroLiquidoAposCSLL,
    receitasFinanceiras,
    despesasFinanceiras,
    csllDevida: csllSemIncentivo,
    receitaLiquidaTotal: receitaBrutaAnual,
    receitaLiquidaIncentivada: receitaBrutaAnual * percentualReceitaIncentivada,
    anual: true,
    superintendencia: 'SUDAM',
    usarReinvestimento: true
  });

  const irpjComSUDAM = irpjSemIncentivo - simulacao.economia.irpj;
  const totalLRComSUDAM = Math.max(0, irpjComSUDAM) + csllSemIncentivo + pisNaoCumulativo + cofinsNaoCumulativo;

  // ===== COMPARATIVO =====
  const economiaSimplesVsLR = tributosSimples - totalLRSemIncentivo;
  const economiaSimplesVsSUDAM = tributosSimples - totalLRComSUDAM;
  const economiaLRvsSUDAM = totalLRSemIncentivo - totalLRComSUDAM;

  let recomendacao = '';
  let melhorRegime = '';
  if (totalLRComSUDAM < tributosSimples && totalLRComSUDAM < totalLRSemIncentivo) {
    melhorRegime = 'LUCRO_REAL_SUDAM';
    recomendacao = `LUCRO REAL + SUDAM é o mais vantajoso. Economia de R$ ${economiaSimplesVsSUDAM.toFixed(2)} vs Simples Nacional.`;
  } else if (totalLRSemIncentivo < tributosSimples) {
    melhorRegime = 'LUCRO_REAL';
    recomendacao = `LUCRO REAL (sem incentivo) é mais vantajoso que Simples. Economia de R$ ${economiaSimplesVsLR.toFixed(2)}.`;
  } else {
    melhorRegime = 'SIMPLES';
    recomendacao = `SIMPLES NACIONAL é mais vantajoso nas condições atuais. Diferença: R$ ${Math.abs(economiaSimplesVsLR).toFixed(2)}.`;
  }

  return {
    simplesNacional: {
      receitaBruta: receitaBrutaAnual,
      aliquotaEfetiva: Math.round(aliquotaSimples * 10000) / 10000,
      aliquotaEfetivaPercent: (aliquotaSimples * 100).toFixed(2) + '%',
      tributosTotal: Math.round(tributosSimples * 100) / 100,
      anexo: anexoSimples
    },
    lucroRealSemIncentivo: {
      lucroContabil: Math.round(lucroContabil * 100) / 100,
      irpj: Math.round(irpjSemIncentivo * 100) / 100,
      csll: Math.round(csllSemIncentivo * 100) / 100,
      pis: Math.round(pisNaoCumulativo * 100) / 100,
      cofins: Math.round(cofinsNaoCumulativo * 100) / 100,
      tributosTotal: Math.round(totalLRSemIncentivo * 100) / 100,
      cargaEfetiva: receitaBrutaAnual > 0 ? (totalLRSemIncentivo / receitaBrutaAnual * 100).toFixed(2) + '%' : '0%'
    },
    lucroRealComSUDAM: {
      lucroExploracao: simulacao.resumo.lucroExploracao,
      lucroExploracaoIncentivado: simulacao.resumo.lucroExploracaoIncentivado,
      reducao75: simulacao.resumo.economiaReducao75,
      reinvestimento30: simulacao.resumo.economiaReinvestimento30,
      irpj: Math.round(Math.max(0, irpjComSUDAM) * 100) / 100,
      csll: Math.round(csllSemIncentivo * 100) / 100,
      pis: Math.round(pisNaoCumulativo * 100) / 100,
      cofins: Math.round(cofinsNaoCumulativo * 100) / 100,
      tributosTotal: Math.round(totalLRComSUDAM * 100) / 100,
      cargaEfetiva: receitaBrutaAnual > 0 ? (totalLRComSUDAM / receitaBrutaAnual * 100).toFixed(2) + '%' : '0%'
    },
    comparativo: {
      economiaSimplesVsLR: Math.round(economiaSimplesVsLR * 100) / 100,
      economiaSimplesVsSUDAM: Math.round(economiaSimplesVsSUDAM * 100) / 100,
      economiaLRvsSUDAM: Math.round(economiaLRvsSUDAM * 100) / 100,
      melhorRegime,
      recomendacao
    },
    baseLegal: 'LC 123/2006 (Simples) vs Art. 618-651 RIR/2018 + MP 2.199-14/2001'
  };
}

/**
 * Gera relatório consolidado do Bloco E.
 *
 * @param {Object} dados
 * @param {Object} dados.elegibilidade - Resultado de verificarElegibilidade()
 * @param {Object} dados.simulacao - Resultado de simularIncentivosRegionais()
 * @param {Object} [dados.comparativo] - Resultado de compararSimplesVsLucroRealSUDAM()
 * @returns {Object} Relatório consolidado com todas as informações
 */
function gerarRelatorioE(dados) {
  const {
    elegibilidade = null,
    simulacao = null,
    comparativo = null
  } = dados;

  const resultado = {
    bloco: 'E — Lucro da Exploração e Incentivos Regionais SUDAM/SUDENE',
    baseLegal: 'Art. 618-668 do RIR/2018 + MP 2.199-14/2001 + Lei 13.799/2019',
    dataGeracao: new Date().toISOString().split('T')[0],
    secoes: {}
  };

  if (elegibilidade) {
    resultado.secoes.elegibilidade = {
      elegivel: elegibilidade.elegivel,
      superintendencia: elegibilidade.superintendencia,
      impedimentos: elegibilidade.impedimentos.length,
      setoresAplicaveis: elegibilidade.setoresAplicaveis.length,
      incentivosDisponiveis: elegibilidade.incentivosDisponiveis.map(i => i.tipo),
      recomendacoes: elegibilidade.recomendacoes
    };
  }

  if (simulacao) {
    resultado.secoes.incentivos = {
      lucroExploracao: simulacao.resumo.lucroExploracao,
      lucroExploracaoIncentivado: simulacao.resumo.lucroExploracaoIncentivado,
      economiaReducao75: simulacao.resumo.economiaReducao75,
      economiaReinvestimento30: simulacao.resumo.economiaReinvestimento30,
      economiaTotal: simulacao.resumo.economiaTotal,
      cargaEfetivaIRPJ: simulacao.resumo.cargaEfetivaIRPJPercent
    };
    resultado.economia = simulacao.economia;
  }

  if (comparativo) {
    resultado.secoes.comparativo = {
      simplesTotal: comparativo.simplesNacional.tributosTotal,
      lucroRealTotal: comparativo.lucroRealSemIncentivo.tributosTotal,
      lucroRealSUDAMTotal: comparativo.lucroRealComSUDAM.tributosTotal,
      melhorRegime: comparativo.comparativo.melhorRegime,
      recomendacao: comparativo.comparativo.recomendacao,
      economiaSUDAMvSimples: comparativo.comparativo.economiaSimplesVsSUDAM
    };
  }

  return resultado;
}

// ============================================================================
// EXPORTS
// ============================================================================


// ============================================================================
// EXEMPLOS DE USO
// ============================================================================


// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Tabela Progressiva IRPF — Mensal (Art. 677)
 * Vigente a partir de abril/2015 até maio/2023 (tabela RIR/2018)
 * Atualizada pela Lei 14.663/2023 (a partir de maio/2023) e
 * MP 1.294/2025 (a partir de maio/2025 — faixa de isenção R$ 2.428,80)
 *
 * NOTA: As tabelas históricas do Art. 677 (2010-2015) estão preservadas
 * abaixo para referência de períodos anteriores. A tabela corrente
 * deve ser usada para cálculos do período atual.
 */
const TABELAS_IRPF = {
  artigo: 'Art. 677',
  baseLegal: [
    'Lei 11.482/2007, art. 1º',
    'Lei 14.663/2023, art. 1º (faixa isenção R$ 2.112 a partir maio/2023)',
    'MP 1.294/2025 (faixa isenção R$ 2.428,80 a partir maio/2025)'
  ],

  // Tabela vigente a partir de maio/2025 (MP 1.294/2025)
  // Usar para cálculos atuais
  tabela_2025: [
    { faixa: 1, ate: 2428.80, aliquota: 0,     deducao: 0       },
    { faixa: 2, de: 2428.81, ate: 2826.65, aliquota: 0.075, deducao: 182.16 },
    { faixa: 3, de: 2826.66, ate: 3751.05, aliquota: 0.15,  deducao: 394.16 },
    { faixa: 4, de: 3751.06, ate: 4664.68, aliquota: 0.225, deducao: 675.49 },
    { faixa: 5, de: 4664.69, ate: Infinity, aliquota: 0.275, deducao: 908.73 }
  ],
  deducaoDependente_2025: 189.59,

  // Tabela mai/2023 a abr/2025 (Lei 14.663/2023)
  tabela_2023: [
    { faixa: 1, ate: 2112.00, aliquota: 0,     deducao: 0       },
    { faixa: 2, de: 2112.01, ate: 2826.65, aliquota: 0.075, deducao: 158.40 },
    { faixa: 3, de: 2826.66, ate: 3751.05, aliquota: 0.15,  deducao: 370.40 },
    { faixa: 4, de: 3751.06, ate: 4664.68, aliquota: 0.225, deducao: 651.73 },
    { faixa: 5, de: 4664.69, ate: Infinity, aliquota: 0.275, deducao: 884.96 }
  ],
  deducaoDependente_2023: 189.59,

  // Tabela abr/2015 a abr/2023 (RIR/2018, Art. 677 inciso VI)
  tabela_2015: [
    { faixa: 1, ate: 1903.98, aliquota: 0,     deducao: 0       },
    { faixa: 2, de: 1903.99, ate: 2826.65, aliquota: 0.075, deducao: 142.80 },
    { faixa: 3, de: 2826.66, ate: 3751.05, aliquota: 0.15,  deducao: 354.80 },
    { faixa: 4, de: 3751.06, ate: 4664.68, aliquota: 0.225, deducao: 636.13 },
    { faixa: 5, de: 4664.69, ate: Infinity, aliquota: 0.275, deducao: 869.36 }
  ],
  deducaoDependente_2015: 189.59
};

/**
 * IRRF sobre serviços profissionais PJ → PJ (Art. 714)
 * Lista de 40 serviços caracterizadamente de natureza profissional
 */
const IRRF_SERVICOS_PROFISSIONAIS = {
  artigo: 'Art. 714',
  baseLegal: [
    'Decreto-Lei 2.030/1983, art. 2º',
    'Decreto-Lei 2.065/1983, art. 1º, III',
    'Lei 7.450/1985, art. 52',
    'Lei 9.064/1995, art. 6º'
  ],
  aliquota: 0.015, // 1,5%
  tratamento: 'ANTECIPAÇÃO', // Art. 717 — antecipação do IRPJ devido
  servicos: [
    'administração de bens ou negócios', 'advocacia', 'análise clínica laboratorial',
    'análises técnicas', 'arquitetura', 'assessoria e consultoria técnica',
    'assistência social', 'auditoria', 'avaliação e perícia',
    'biologia e biomedicina', 'cálculo em geral', 'consultoria',
    'contabilidade', 'desenho técnico', 'economia',
    'elaboração de projetos', 'engenharia', 'ensino e treinamento',
    'estatística', 'fisioterapia', 'fonoaudiologia',
    'geologia', 'leilão', 'medicina',
    'nutricionismo e dietética', 'odontologia',
    'organização de feiras, congressos, seminários',
    'pesquisa em geral', 'planejamento', 'programação',
    'prótese', 'psicologia e psicanálise', 'química',
    'radiologia e radioterapia', 'relações públicas', 'serviço de despachante',
    'terapêutica ocupacional', 'tradução ou interpretação comercial',
    'urbanismo', 'veterinária'
  ],
  servicosAGROGEO: [
    'engenharia',        // georeferenciamento, topografia
    'geologia',          // estudos ambientais
    'elaboração de projetos', // PRA, LAR
    'consultoria',       // consultoria ambiental
    'análises técnicas', // laudos técnicos
    'avaliação e perícia' // laudos de avaliação
  ],
  excecoes: [
    'engenharia: construção de estradas, pontes, prédios e obras assemelhadas — NÃO sujeito',
    'medicina: ambulatório, banco de sangue, hospital, pronto-socorro — NÃO sujeito',
    'assistência técnica de ramo explorado pelo prestador — NÃO sujeito ao inciso VI'
  ],
  nota: 'Incide independentemente da qualificação profissional dos sócios (Art. 714 §2º)'
};

/**
 * IRRF sobre limpeza, conservação, segurança, vigilância, locação mão-de-obra (Art. 716)
 */
const IRRF_SERVICOS_LIMPEZA_SEGURANCA = {
  artigo: 'Art. 716',
  baseLegal: [
    'Decreto-Lei 2.462/1988, art. 3º',
    'Lei 7.713/1988, art. 55'
  ],
  aliquota: 0.01, // 1%
  tratamento: 'ANTECIPAÇÃO',
  servicos: ['limpeza', 'conservação', 'segurança', 'vigilância', 'locação de mão-de-obra']
};

/**
 * IRRF sobre comissões, corretagens, representação comercial, propaganda (Art. 718)
 */
const IRRF_COMISSOES_REPRESENTACAO = {
  artigo: 'Art. 718',
  baseLegal: [
    'Lei 7.450/1985, art. 53',
    'Lei 9.064/1995, art. 6º'
  ],
  aliquota: 0.015, // 1,5%
  tratamento: 'ANTECIPAÇÃO',
  servicos: ['comissões', 'corretagens', 'representação comercial', 'mediação de negócios', 'propaganda e publicidade'],
  notaPropaganda: 'Publicidade: excluem-se da base os valores repassados a rádio, TV, jornais, revistas (Art. 718 §1º)'
};

/**
 * IRRF sobre cooperativas de trabalho (Art. 719)
 */
const IRRF_COOPERATIVAS = {
  artigo: 'Art. 719',
  baseLegal: 'Lei 8.541/1992, art. 45',
  aliquota: 0.015,
  tratamento: 'ANTECIPAÇÃO',
  nota: 'Retido pela cooperativa; compensado com IRRF pago aos associados (Art. 719 §1º)'
};

/**
 * IRRF sobre assessoria creditícia, mercadológica, gestão de crédito (Art. 723)
 */
const IRRF_ASSESSORIA_CREDITO = {
  artigo: 'Art. 723',
  baseLegal: 'Lei 10.833/2003, art. 29',
  aliquota: 0.015,
  tratamento: 'ANTECIPAÇÃO'
};

/**
 * IRRF sobre pagamentos pela Administração Pública Federal (Art. 720-722)
 * IN RFB 1.234/2012 (e alterações)
 */
const IRRF_ADMINISTRACAO_PUBLICA = {
  artigo: 'Art. 720-722',
  baseLegal: [
    'Lei 9.430/1996, art. 64',
    'Lei 10.833/2003, art. 34-36',
    'IN RFB 1.234/2012',
    'Lei 12.973/2014, art. 9º (altera Art. 15 Lei 9.249 — percentuais presunção e definição receita bruta)'
  ],
  metodoCalculo: '15% sobre (valor pago × percentual de presunção conforme atividade)',
  percentuaisPresuncao: {
    servicos_geral:       0.32,  // 32% — prestação de serviços em geral
    servicos_transporte:  0.16,  // 16% — transporte de carga
    servicos_hospitalar:  0.08,  // 8%  — serviços hospitalares
    comercio:             0.08,  // 8%  — revenda de mercadorias
    combustiveis:         0.016, // 1,6% — combustíveis
    infraestrutura_concessao: 0.32 // 32% — construção/reforma de infraestrutura vinculada a concessão (Lei 12.973, art. 9º → Art. 15, §1º, III, "e" Lei 9.249)
  },
  aliquotaBase: 0.15,
  exemplos: {
    servicos_AGROGEO: '15% × 32% × valor = 4,8% efetivo sobre serviços',
    comercio: '15% × 8% × valor = 1,2% efetivo'
  },
  dispensaSimples: 'Art. 720 §6º — optantes pelo Simples Nacional NÃO sofrem retenção',
  dispensaMinimo: 'R$ 10,00 — retenção dispensada se ≤ R$ 10,00 (Art. 721 §3º)',
  prazoRecolhimento: 'Até o último dia útil do 2º decêndio do mês subsequente (Art. 722)',
  entidadesObrigadas: [
    'Órgãos da administração pública federal direta',
    'Autarquias e fundações federais',
    'Empresas públicas (Art. 721, I)',
    'Sociedades de economia mista (Art. 721, II)',
    'Entidades com maioria de capital federal (Art. 721, III)'
  ]
};

/**
 * IRRF sobre Juros sobre Capital Próprio — JCP (Art. 726)
 */
const IRRF_JCP = {
  artigo: 'Art. 726',
  baseLegal: [
    'Lei 9.249/1995, art. 9º, §2º',
    'Lei 12.973/2014, art. 9º (altera §§8º-12 da Lei 9.249/1995 — contas PL para cálculo JCP)'
  ],
  aliquota: 0.15, // 15%
  tratamento: {
    lucroReal: 'ANTECIPAÇÃO (Art. 726 §1º, I)',
    lucroPresumido: 'ANTECIPAÇÃO (Art. 726 §1º, I)',
    demais: 'TRIBUTAÇÃO DEFINITIVA (Art. 726 §1º, II)'
  },
  contasPL_Lei12973: {
    descricao: 'Para cálculo do JCP, consideram-se EXCLUSIVAMENTE (Lei 9.249, art. 9º, §8º, na redação da Lei 12.973):',
    I: 'Capital social (incluindo ações classificadas em passivo — §12)',
    II: 'Reservas de capital',
    III: 'Reservas de lucros',
    IV: 'Ações em tesouraria (deduzidas)',
    V: 'Prejuízos acumulados (deduzidos)'
  },
  aplicaCSLL: 'Art. 9º, §11 da Lei 9.249 — JCP aplica-se também à CSLL (Lei 12.973)'
};

/**
 * Dividendos — isentos (Art. 725)
 */
const DIVIDENDOS = {
  artigo: 'Art. 725',
  baseLegal: [
    'Lei 9.249/1995, art. 10',
    'Lei 12.973/2014, art. 9º (altera §§1º-3º da Lei 9.249 — isenção ampliada para todas as espécies de ações)'
  ],
  aliquota: 0, // isento
  regra: 'Lucros/dividendos apurados a partir de jan/1996 — isentos de IRRF e não integram base IRPJ do beneficiário',
  nota: 'Aplica-se a todas as espécies de ações (Art. 725 §3º)',
  lei12973: {
    paragrafo1: 'Quotas/ações distribuídas por incorporação de lucros a partir de jan/1996 — custo = parcela do lucro/reserva capitalizado',
    paragrafo2: 'Isenção inclui TODAS as espécies de ações do Art. 15 da Lei 6.404/76, ainda que classificadas em passivo ou remuneração como despesa financeira',
    paragrafo3: 'Lucros/dividendos pagos como despesa financeira NÃO são dedutíveis no lucro real e na base da CSLL'
  }
};

/**
 * IRRF sobre multas rescisórias (Art. 740)
 */
const IRRF_MULTAS_RESCISAO = {
  artigo: 'Art. 740',
  baseLegal: 'Lei 9.430/1996, art. 70',
  aliquota: 0.15,
  tratamento: 'ANTECIPAÇÃO',
  excecoes: 'Não se aplica a indenizações trabalhistas e reparação de danos patrimoniais (Art. 740 §5º)'
};

/**
 * IRRF sobre decisões judiciais (Art. 738-739)
 */
const IRRF_DECISAO_JUDICIAL = {
  jurosLucrosCessantes: {
    artigo: 'Art. 738',
    aliquota: 0.05, // 5%
    tratamento: 'ANTECIPAÇÃO'
  },
  precatorios: {
    artigo: 'Art. 739',
    aliquota: 0.03, // 3%
    tratamento: 'ANTECIPAÇÃO',
    dispensa: 'Dispensada se rendimentos isentos ou não tributáveis, ou optante Simples (Art. 739 §1º)'
  }
};

/**
 * Pagamento a beneficiário não identificado (Art. 730-731)
 */
const IRRF_BENEFICIARIO_NAO_IDENTIFICADO = {
  artigo: 'Art. 730-731',
  baseLegal: 'Lei 8.981/1995, art. 61',
  aliquota: 0.35, // 35%
  tratamento: 'EXCLUSIVAMENTE NA FONTE',
  nota: 'Rendimento considerado líquido — reajustamento para bruto (Art. 730 §3º)',
  formulaBruto: 'Bruto = Líquido / (1 - 0,35) = Líquido / 0,65'
};

/**
 * CSRF — Contribuições Sociais Retidas na Fonte
 * PIS/COFINS/CSLL retidos (Lei 10.833/2003, art. 30)
 */
const CSRF = {
  baseLegal: [
    'Lei 10.833/2003, art. 30 a 36',
    'Lei 13.137/2015 (alteração prazos)',
    'IN RFB 1.234/2012 (Adm. Pública)',
    'IN RFB 459/2004 (regulamentação)'
  ],
  aliquotas: {
    pis:    0.0065,  // 0,65%
    cofins: 0.03,    // 3,00%
    csll:   0.01,    // 1,00%
    total:  0.0465   // 4,65%
  },
  servicosSujeitos: [
    'serviços profissionais (mesma lista do Art. 714)',
    'limpeza, conservação, manutenção',
    'segurança e vigilância',
    'locação de mão-de-obra',
    'assessoria creditícia, mercadológica, gestão de crédito',
    'transporte de valores'
  ],
  dispensas: {
    simplesNacional: 'Optantes pelo Simples Nacional NÃO sofrem retenção (LC 123/2006, art. 30, II)',
    valorMinimo: 'Dispensada se retenção ≤ R$ 10,00 (Lei 10.833/2003, art. 31 §3º)',
    isentas: 'Entidades imunes/isentas referidas no art. 12 da Lei 9.532/1997',
    SCP: 'Não se aplica a pagamentos entre SCP e sócio ostensivo',
    transporteCarga: 'Transporte de carga (exceto valores) — dispensado se PJ prestar com veículo próprio'
  },
  prazoRecolhimento: 'Até o último dia útil do 2º decêndio do mês subsequente ao pagamento (Lei 13.137/2015)',
  codigoDARF: {
    pis: '5979',
    cofins: '5960',
    csll: '5987',
    csrf_unico: '5952' // código unificado Adm. Pública
  },
  tratamento: {
    pis: 'Compensável com PIS/COFINS devidos (cumulativo ou não-cumulativo)',
    cofins: 'Compensável com PIS/COFINS devidos',
    csll: 'Compensável com CSLL devida no período',
    nota: 'Cada contribuição só compensa com ela mesma (PIS com PIS, COFINS com COFINS, CSLL com CSLL)'
  }
};

/**
 * ISS Retido na Fonte (LC 116/2003, art. 3º e 6º)
 */
const ISS_RETIDO = {
  baseLegal: [
    'Lei Complementar 116/2003, art. 3º e 6º',
    'Lei Complementar 175/2020 (CPOM — padrão nacional)'
  ],
  aliquotaMinima: 0.02,   // 2% — piso constitucional (EC 37/2002)
  aliquotaMaxima: 0.05,   // 5%
  retencaoObrigatoria: [
    'Quando o serviço é prestado em município diferente do estabelecimento do prestador',
    'Nos serviços listados nos incisos do art. 3º da LC 116/2003',
    'Serviços de cessão de mão-de-obra (item 17.05 da lista)',
    'Serviços de limpeza, conservação, segurança (item 7.10, 7.12, 7.13)',
    'Serviços de informática (item 1.01 a 1.09)',
    'Quando o município exigir via legislação local'
  ],
  municipioNovoProgresso: {
    aliquotaISS: 0.05,   // 5% — alíquota típica do município de Novo Progresso-PA
    nota: 'Verificar legislação municipal vigente — código tributário do município'
  },
  deducaoIRPJ: 'ISS retido NÃO deduz do IRPJ — é tributo municipal, tratado na DRE como despesa',
  nota: 'Se tomador retém ISS, o prestador NÃO recolhe. Responsabilidade solidária.'
};

/**
 * Retenções pela Administração Pública — IN RFB 1.234/2012
 * (Estados, Municípios: IN RFB 475/2004 — adesão facultativa)
 */
const RETENCOES_ADM_PUBLICA_UNIFICADA = {
  baseLegal: 'IN RFB 1.234/2012',
  tributos: {
    irpj: 0.048,  // 4,8% (15% × 32%) para serviços
    csll: 0.01,   // 1%
    cofins: 0.03, // 3%
    pis: 0.0065,  // 0,65%
    total: 0.0945 // 9,45% — alíquota combinada sobre NF de serviço
  },
  prazo: 'Recolhimento até o último dia útil do 2º decêndio do mês subsequente',
  dispensaSimplesNacional: true,
  nota: 'AGROGEO, se migrar para Lucro Real, passará a sofrer retenção de 9,45% em NFs para órgãos públicos'
};

/**
 * LEI 12.973/2014 — Disposições que impactam retenções na fonte e apuração
 *
 * A Lei 12.973/2014 alterou o DL 1.598/1977, a Lei 9.249/1995, a Lei 9.430/1996,
 * a Lei 8.981/1995, entre outras, com reflexos diretos na base de cálculo de IRPJ,
 * CSLL, PIS/COFINS, e consequentemente nas retenções na fonte.
 *
 * Impactos diretos no Bloco G:
 * 1. Definição de receita bruta (Art. 12 DL 1.598, alterado pela Lei 12.973)
 * 2. JCP — Patrimônio líquido para cálculo (Art. 9º Lei 9.249, alterado)
 * 3. Dividendos — isenção confirmada e ampliada (Art. 10 Lei 9.249, alterado)
 * 4. Base de cálculo CSLL lucro presumido/estimativa (Art. 20 Lei 9.249, alterado)
 * 5. Percentuais de presunção (Art. 15 Lei 9.249, alterado)
 * 6. Avaliação a valor justo — impacto nas bases (Arts. 13-14 Lei 12.973)
 * 7. Subvenções para investimento (Art. 30 Lei 12.973, revogado pela Lei 14.789/2023)
 * 8. Goodwill e mais/menos-valia (Arts. 20-28 Lei 12.973)
 * 9. Ganho de capital — ajustes na base (Art. 25, 27 Lei 9.430, alterados)
 */
const LEI_12973 = {
  baseLegal: 'Lei 12.973/2014',
  publicacao: '14/05/2014',
  vigencia: 'A partir de 01/01/2015 (ou 01/01/2014 para optantes — Art. 75)',

  // ─────────────────────────────────────────────────────────────────────────
  // 1. RECEITA BRUTA (Art. 2º da Lei 12.973 → altera Art. 12 do DL 1.598/1977)
  // ─────────────────────────────────────────────────────────────────────────
  receitaBruta: {
    artigo: 'Art. 12 do DL 1.598/1977 (nova redação pela Lei 12.973/2014, art. 2º)',
    definicao: {
      I: 'Produto da venda de bens nas operações de conta própria',
      II: 'Preço da prestação de serviços em geral',
      III: 'Resultado auferido nas operações de conta alheia',
      IV: 'Receitas da atividade ou objeto principal da PJ não compreendidas em I a III'
    },
    receitaLiquida: {
      descricao: 'Receita bruta diminuída de:',
      I: 'Devoluções e vendas canceladas',
      II: 'Descontos concedidos incondicionalmente',
      III: 'Tributos sobre ela incidentes',
      IV: 'Valores decorrentes do ajuste a valor presente (Art. 183, VIII, Lei 6.404/76)'
    },
    exclusoes: {
      paragrafo4: 'Na receita bruta NÃO se incluem tributos não cumulativos cobrados destacadamente do comprador na condição de mero depositário (§4º)',
      paragrafo5: 'Na receita bruta INCLUEM-SE tributos sobre ela incidentes e valores de ajuste a valor presente (§5º)'
    },
    impactoRetencoes: 'A definição de receita bruta impacta diretamente a base de cálculo para fins de presunção do lucro (Art. 15 Lei 9.249) usada nas retenções pela Adm. Pública (Art. 720 RIR)',
    relevanciaAGROGEO: 'AGROGEO presta serviços (inciso II) — receita bruta = preço dos serviços de georreferenciamento, CAR, PRA, LAR, topografia'
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 2. JCP — JUROS SOBRE CAPITAL PRÓPRIO (Art. 9º da Lei 12.973 → altera Art. 9º Lei 9.249/1995)
  // ─────────────────────────────────────────────────────────────────────────
  jcp: {
    artigo: 'Art. 9º da Lei 9.249/1995 (alterado pela Lei 12.973/2014, art. 9º)',
    irrfRetido: 0.15, // 15% na fonte (Art. 726 RIR)
    contasPatrimonioLiquido: {
      descricao: 'Para cálculo do JCP, consideram-se EXCLUSIVAMENTE (§8º):',
      I: 'Capital social',
      II: 'Reservas de capital',
      III: 'Reservas de lucros',
      IV: 'Ações em tesouraria (deduzidas)',
      V: 'Prejuízos acumulados (deduzidos)'
    },
    capitalSocial: {
      paragrafo12: 'Inclui todas as espécies de ações do Art. 15 da Lei 6.404/76, ainda que classificadas em conta de passivo na escrituração comercial (§12)'
    },
    aplicaCSLL: 'Art. 9º, §11 — o disposto aplica-se também à CSLL',
    impactoRetencao: 'IRRF 15% sobre JCP calculado com base nestas contas do PL (Art. 726 RIR). Se PL inclui passivo reclassificado como ação, a base de JCP é maior → maior IRRF retido.',
    relevanciaAGROGEO: 'Se AGROGEO distribuir JCP (viável no Lucro Real), a retenção de 15% é antecipação compensável com IRPJ'
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 3. DIVIDENDOS (Art. 9º da Lei 12.973 → altera Art. 10 Lei 9.249/1995)
  // ─────────────────────────────────────────────────────────────────────────
  dividendos: {
    artigo: 'Art. 10 da Lei 9.249/1995 (alterado pela Lei 12.973/2014, art. 9º)',
    isencao: 'Lucros e dividendos distribuídos — ISENTOS de IRRF',
    detalhes: {
      paragrafo1: 'Quotas/ações distribuídas por aumento de capital via incorporação de lucros apurados a partir de jan/1996 — custo de aquisição = parcela do lucro/reserva capitalizado (§1º)',
      paragrafo2: 'A isenção inclui lucros/dividendos pagos a TODAS as espécies de ações do Art. 15 da Lei 6.404/76, ainda que classificadas em passivo ou remuneração classificada como despesa financeira (§2º)',
      paragrafo3: 'NÃO são dedutíveis no lucro real e na base da CSLL os lucros/dividendos pagos a qualquer espécie de ação, ainda que classificados como despesa financeira (§3º)'
    },
    impactoRetencao: 'Dividendos continuam ISENTOS de retenção (Art. 725 RIR). Porém, se pagos como despesa financeira contabilmente, NÃO são dedutíveis para IRPJ/CSLL.',
    relevanciaAGROGEO: 'Distribuição de lucros da AGROGEO aos sócios (65%/35%) — isenta de IRRF, tanto no Simples quanto no Lucro Real'
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 4. BASE DE CÁLCULO CSLL — LUCRO PRESUMIDO/ESTIMATIVA (Art. 9º → altera Art. 20 Lei 9.249/1995)
  // ─────────────────────────────────────────────────────────────────────────
  baseCSLL: {
    artigo: 'Art. 20 da Lei 9.249/1995 (alterado pela Lei 12.973/2014, art. 9º)',
    percentualGeral: 0.12,  // 12% sobre receita bruta
    percentualServicos: 0.32, // 32% para serviços (inciso III do §1º do art. 15)
    receitaBrutaRef: 'Art. 12 do DL 1.598/1977 (definição da Lei 12.973)',
    deducoes: 'Deduzida de devoluções, vendas canceladas e descontos incondicionais',
    impactoRetencao: 'A base presumida da CSLL usa a mesma receita bruta redefinida pela Lei 12.973. Para serviços (AGROGEO), a base é 32% — relevante para CSRF retida (1% CSLL) e para cálculo da CSLL devida contra a qual se compensa a CSLL retida.',
    relevanciaAGROGEO: 'Se AGROGEO optar por lucro presumido, a CSLL devida será 9% × (32% × Receita Bruta). A CSLL retida na fonte (1%) compensa contra esse valor.'
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 5. PERCENTUAIS DE PRESUNÇÃO — LUCRO PRESUMIDO (Art. 9º → altera Art. 15 Lei 9.249/1995)
  // ─────────────────────────────────────────────────────────────────────────
  lucroPresumido: {
    artigo: 'Art. 15 da Lei 9.249/1995 (alterado pela Lei 12.973/2014, art. 9º)',
    percentualGeral: 0.08,  // 8%
    receitaBrutaRef: 'Art. 12 do DL 1.598/1977',
    deducoes: 'Deduzida de devoluções, vendas canceladas e descontos incondicionais',
    percentuaisEspecificos: {
      servicos_geral: { percentual: 0.32, descricao: '32% — prestação de serviços em geral' },
      servicos_transporte_carga: { percentual: 0.08, descricao: '8% — transporte de carga' },
      servicos_transporte_passageiros: { percentual: 0.16, descricao: '16% — transporte (exceto carga)' },
      servicos_hospitalares: { percentual: 0.08, descricao: '8% — serviços hospitalares e de auxílio diagnóstico/terapia' },
      construcao_infraestrutura: { percentual: 0.32, descricao: '32% — construção, recuperação, reforma de infraestrutura vinculada a concessão (§1º, III, "e")' },
      comercio: { percentual: 0.08, descricao: '8% — revenda de mercadorias' },
      combustiveis: { percentual: 0.016, descricao: '1,6% — revenda de combustíveis' }
    },
    impactoRetencao: 'Os percentuais de presunção são usados pela Adm. Pública para calcular o IRRF retido (Art. 720 RIR): IRRF = 15% × (percentual de presunção × valor pago). A Lei 12.973 confirmou a inclusão de serviços de infraestrutura vinculados a concessão na alíquota de 32%.',
    relevanciaAGROGEO: 'Serviços da AGROGEO = 32% de presunção. Se receber de órgão público: IRRF = 15% × 32% = 4,8% sobre a NF.'
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 6. GANHO DE CAPITAL — AJUSTES (Arts. 6-7 da Lei 12.973 → altera Arts. 25, 27 Lei 9.430/1996)
  // ─────────────────────────────────────────────────────────────────────────
  ganhoCapital: {
    artigo: 'Arts. 25 e 27 da Lei 9.430/1996 (alterados pela Lei 12.973/2014, art. 6º)',
    lucroPresumido: {
      baseCalculo: {
        I: 'Percentual de presunção (Art. 15 Lei 9.249) × receita bruta (Art. 12 DL 1.598)',
        II: 'Ganhos de capital, rendimentos/ganhos de aplicações financeiras, demais receitas, com valores de ajuste a valor presente'
      },
      ganhoCapitalAlienacao: {
        paragrafo1: 'Ganho de capital nas alienações de investimentos, imobilizados e intangíveis = diferença positiva entre valor da alienação e valor contábil (§1º)',
        paragrafo2: 'No valor contábil, podem ser considerados os efeitos de ajuste a valor presente do Art. 184, III, Lei 6.404/76 (§2º)'
      },
      valorJusto: {
        paragrafo3: 'Ganhos de avaliação a valor justo NÃO integram a base de cálculo no momento da apuração (§3º)',
        paragrafo4: 'Ganhos/perdas de valor justo NÃO são parte do valor contábil para fins do inciso II (§4º)',
        paragrafo5: 'Exceção: ganhos anteriormente computados na base (§5º)'
      }
    },
    csll: {
      artigo: 'Art. 27 da Lei 9.430/1996 (alterado)',
      mesmaLogica: 'Mesma lógica do IRPJ, porém com percentuais do Art. 20 da Lei 9.249 (12% geral, 32% serviços)'
    },
    custoEmprestimos: {
      artigo: 'Art. 7º da Lei 12.973/2014',
      regra: 'Vedado o cômputo de encargos associados a empréstimos registrados como custo (Art. 17, §1º, "b", DL 1.598) no ganho de capital para lucro presumido/arbitrado',
      aplicacao: 'Aplica-se ao ganho de capital do Art. 25, II, Art. 27, II e Art. 29, II da Lei 9.430/96'
    },
    impactoRetencao: 'A forma de apurar o ganho de capital afeta a base sobre a qual se calcula IRPJ/CSLL devidos, contra os quais as retenções (IRRF e CSRF) são compensadas.',
    relevanciaAGROGEO: 'Se AGROGEO alienar ativos (veículos, equipamentos de topografia), o ganho de capital entra na base do IRPJ/CSLL — as retenções sofridas compensam contra esses valores.'
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 7. AJUSTE A VALOR PRESENTE (Arts. 4-5 da Lei 12.973)
  // ─────────────────────────────────────────────────────────────────────────
  ajusteValorPresente: {
    artigo: 'Arts. 4º e 5º da Lei 12.973/2014',
    ativo: {
      artigo: 'Art. 4º',
      regra: 'Valores de ajuste a valor presente (Art. 183, VIII, Lei 6.404/76) somente são considerados no lucro real no período em que a receita/resultado da operação deva ser oferecida à tributação'
    },
    passivo: {
      artigo: 'Art. 5º',
      regra: 'Valores de ajuste a valor presente (Art. 184, III, Lei 6.404/76) são considerados no lucro real quando:',
      I: 'O bem for revendido (aquisição para revenda)',
      II: 'O bem for utilizado como insumo',
      III: 'O ativo for realizado (depreciação, amortização, exaustão, alienação ou baixa)',
      IV: 'A despesa for incorrida (bem/serviço contabilizado como despesa)',
      V: 'O custo for incorrido (bem/serviço contabilizado como custo de produção)',
      subconta: 'Nas hipóteses I, II e III, valores devem ser evidenciados em subconta vinculada ao ativo (§1º)',
      restricao: 'Não podem ser considerados se: valor indedutível (§2º, I-II) ou não evidenciados em subconta (§2º, III)'
    },
    variacaoCambial: {
      artigo: 'Art. 12 da Lei 12.973/2014',
      regra: 'Variações monetárias cambiais referentes a saldos de ajuste a valor presente NÃO são computadas no lucro real'
    },
    lucroPresumido: {
      artigo: 'Art. 8º da Lei 12.973/2014',
      regra: 'No lucro presumido/arbitrado, receitas financeiras de variações cambiais dos direitos/obrigações originadas de ajuste a valor presente NÃO integram a base do IR'
    },
    impactoRetencao: 'Ajustes a valor presente alteram o momento de reconhecimento da receita, podendo deslocar receita tributável entre períodos — afeta a base contra a qual retenções são compensadas.',
    relevanciaAGROGEO: 'Relevante se AGROGEO tiver contratos de longo prazo com pagamento diferido (ex.: grandes projetos de georreferenciamento para fazendas).'
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 8. AVALIAÇÃO A VALOR JUSTO (Arts. 13-14 da Lei 12.973)
  // ─────────────────────────────────────────────────────────────────────────
  avaliacaoValorJusto: {
    ganho: {
      artigo: 'Art. 13 da Lei 12.973/2014',
      regra: 'Ganho de avaliação a valor justo NÃO é computado no lucro real se evidenciado em subconta vinculada ao ativo/passivo',
      realizacao: 'É computado à medida que o ativo for realizado (depreciação, amortização, exaustão, alienação ou baixa) ou passivo liquidado/baixado (§1º)',
      indedutivel: 'Não será computado se o valor realizado for indedutível (§2º)',
      semSubconta: 'Se NÃO evidenciado em subconta, o ganho é TRIBUTADO (§3º)',
      semReducaoPrejuizo: 'Ganho tributado por falta de subconta não pode reduzir prejuízo fiscal — diferido para período seguinte com lucro real (§4º)',
      excecao: 'Não se aplica a ganhos no reconhecimento inicial de ativos de doações recebidas de terceiros (§5º)',
      permuta: 'Em operações de permuta, ganho pode ser computado na medida da realização do ativo/passivo recebido (§6º)'
    },
    perda: {
      artigo: 'Art. 14 da Lei 12.973/2014',
      regra: 'Perda de avaliação a valor justo somente é computada no lucro real à medida que o ativo for realizado ou passivo liquidado/baixado, E desde que evidenciada em subconta',
      indedutivel: 'Não será computada se valor realizado for indedutível (§1º)',
      semSubconta: 'Se NÃO evidenciada em subconta, a perda é INDEDUTÍVEL (§2º)'
    },
    disciplinamento: {
      artigo: 'Art. 15 da Lei 12.973/2014',
      regra: 'A RFB disciplinará o controle em subcontas previsto nos arts. 5º, 13 e 14'
    },
    transicaoPresumidoReal: {
      artigo: 'Art. 16 da Lei 12.973/2014',
      regra: 'PJ que mudar de lucro presumido para lucro real deve incluir na base do presumido os ganhos de valor justo que façam parte do valor contábil dos ativos',
      diferimento: 'Os ganhos podem ser diferidos se observados os requisitos do Art. 13 (subconta)',
      perdas: 'Perdas somente computáveis se observados os requisitos do Art. 14'
    },
    subscricaoAcoes: {
      ganho: {
        artigo: 'Art. 17 da Lei 12.973/2014',
        regra: 'Ganho de valor justo de bem incorporado ao patrimônio de outra PJ na subscrição de capital NÃO é computado no lucro real se evidenciado em subconta vinculada à participação societária',
        realizacao: {
          I: 'Na alienação/liquidação da participação societária',
          II: 'Proporcionalmente ao valor realizado pela PJ que recebeu o bem',
          III: 'Para bens não sujeitos a depreciação: à razão de 1/60 por mês, nos 5 anos subsequentes'
        }
      },
      perda: {
        artigo: 'Art. 18 da Lei 12.973/2014',
        regra: 'Perda de valor justo na subscrição somente computável se evidenciada em subconta, nas mesmas hipóteses do ganho',
        semSubconta: 'Se não evidenciada em subconta, perda é INDEDUTÍVEL (§1º)'
      }
    },
    impactoRetencao: 'Ganhos/perdas de valor justo afetam o lucro real e, portanto, a base de IRPJ/CSLL contra a qual retenções sofridas são compensadas. Se a AGROGEO tiver ativos avaliados a valor justo (terrenos, participações), o momento de tributação do ganho afeta o saldo de compensação.',
    relevanciaAGROGEO: 'Relevante se AGROGEO tiver participações societárias, imóveis avaliados a valor justo, ou realizar subscrição de capital em outras empresas.'
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 9. INCORPORAÇÃO, FUSÃO, CISÃO — MAIS-VALIA, MENOS-VALIA, GOODWILL (Arts. 20-28 Lei 12.973)
  // ─────────────────────────────────────────────────────────────────────────
  incorporacaoFusaoCisao: {
    maisValia: {
      artigo: 'Art. 20 da Lei 12.973/2014',
      regra: 'Saldo de mais-valia (Art. 20, II, DL 1.598) na incorporação/fusão/cisão pode ser considerado como integrante do custo do bem que lhe deu causa — para ganho/perda de capital e depreciação/amortização/exaustão',
      condicoes: {
        laudo: 'Laudo de perito independente deve ter sido protocolado/registrado tempestivamente (§3º)',
        identificacao: 'Valores devem ser identificáveis na contabilidade (§3º do art. 37 ou §1º do art. 39)',
        partesNaoDependentes: 'Somente entre partes NÃO dependentes'
      },
      cisaoSemBem: 'Se o bem não foi transferido na cisão, a importância pode ser deduzida em quotas fixas mensais no prazo mínimo de 5 anos (§1º)',
      condicionada: 'Dedutibilidade condicionada ao Art. 13, III da Lei 9.249/1995 (§2º)'
    },
    menosValia: {
      artigo: 'Art. 21 da Lei 12.973/2014',
      regra: 'Saldo de menos-valia DEVERÁ ser considerado como custo do bem que lhe deu causa — para ganho/perda de capital e depreciação/amortização/exaustão',
      cisaoSemBem: 'Se bem não transferido na cisão, importância pode ser diferida com tributação em quotas fixas mensais no prazo máximo de 5 anos (§1º)'
    },
    goodwill: {
      artigo: 'Art. 22 da Lei 12.973/2014',
      regra: 'Ágio por rentabilidade futura (goodwill) na incorporação/fusão/cisão pode ser excluído do lucro real à razão de 1/60 por mês (no máximo) nos períodos subsequentes',
      condicoes: {
        laudo: 'Laudo tempestivamente protocolado/registrado',
        identificacao: 'Valores identificáveis na contabilidade',
        partesNaoDependentes: 'Aquisição entre partes NÃO dependentes (Art. 25 Lei 12.973)'
      },
      contrapartidaReducao: {
        artigo: 'Art. 28 da Lei 12.973/2014',
        regra: 'Contrapartida da redução do goodwill (inclusive redução ao valor recuperável) NÃO é computada no lucro real'
      }
    },
    ganhoCompraVantajosa: {
      artigo: 'Art. 23 da Lei 12.973/2014',
      regra: 'Ganho proveniente de compra vantajosa na incorporação/fusão/cisão deve ser computado no lucro real à razão de 1/60 por mês (no mínimo) nos períodos subsequentes'
    },
    partesDependentes: {
      artigo: 'Art. 25 da Lei 12.973/2014',
      definicao: {
        I: 'Adquirente e alienante controlados pela mesma parte',
        II: 'Relação de controle entre adquirente e alienante',
        III: 'Alienante é sócio, titular, conselheiro ou administrador da adquirente',
        IV: 'Alienante é parente/afim até 3º grau, cônjuge ou companheiro dos anteriores',
        V: 'Outras relações que comprovem dependência societária'
      }
    },
    valorJustoSuccedida: {
      artigo: 'Art. 26 da Lei 12.973/2014',
      regra: 'Ganhos de valor justo na sucedida NÃO podem ser considerados como custo na sucessora para ganho/perda de capital e depreciação',
      subcontas: 'Ganhos/perdas evidenciados em subcontas (Arts. 13 e 14) transferidos por incorporação/fusão/cisão mantêm o mesmo tratamento tributário na sucessora'
    },
    impactoRetencao: 'Goodwill e mais/menos-valia afetam o lucro real ao longo de até 5 anos (1/60 por mês), alterando a base de IRPJ/CSLL devidos e consequentemente o saldo de compensação de retenções sofridas.',
    relevanciaAGROGEO: 'Relevante se AGROGEO adquirir ou incorporar outras empresas de consultoria ambiental/topografia. O goodwill amortizado reduz lucro real → menos IRPJ/CSLL devidos → retenções sofridas podem gerar saldo credor.'
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 10. SUBVENÇÕES PARA INVESTIMENTO (Art. 30 da Lei 12.973)
  // ─────────────────────────────────────────────────────────────────────────
  subvencoesInvestimento: {
    artigo: 'Art. 30 da Lei 12.973/2014',
    status: 'REVOGADO pela Lei 14.789/2023 (a partir de 2024)',
    regraOriginal: 'Subvenções para investimento (inclusive isenção/redução de impostos) e doações do poder público NÃO eram computadas no lucro real, desde que registradas em reserva de lucros (Art. 195-A Lei 6.404/76)',
    utilizacaoReserva: {
      I: 'Absorção de prejuízos (após absorver demais Reservas de Lucros, exceto Reserva Legal)',
      II: 'Aumento do capital social'
    },
    icms: {
      paragrafo4: 'Incentivos e benefícios fiscais de ICMS (Art. 155, II CF) concedidos por Estados/DF são considerados subvenções para investimento, sem exigência de outros requisitos (incluído pela LC 160/2017 — também revogado pela Lei 14.789/2023)',
      nota: 'A Lei 14.789/2023 substituiu este regime por crédito fiscal de subvenção'
    },
    impactoRetencao: 'Subvenções excluídas do lucro real reduziam a base de IRPJ/CSLL devidos → retenções sofridas compensavam contra valores menores → maior probabilidade de saldo credor.',
    relevanciaAGROGEO: 'Se AGROGEO recebesse incentivos fiscais estaduais (ICMS/PA, por exemplo) ou doações/subvenções municipais, podia excluir da tributação. Com a Lei 14.789/2023, o tratamento mudou para crédito fiscal.'
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 11. PRÊMIO NA EMISSÃO DE DEBÊNTURES (Art. 31 da Lei 12.973)
  // ─────────────────────────────────────────────────────────────────────────
  premioDebentures: {
    artigo: 'Art. 31 da Lei 12.973/2014',
    regra: 'Prêmio na emissão de debêntures NÃO é computado no lucro real, desde que:',
    condicoes: {
      I: 'A titularidade da debênture não seja de sócio/titular com participação ≥ 10% (§5º)',
      II: 'Seja registrado em reserva de lucros específica, para absorção de prejuízos ou aumento de capital'
    },
    tributacao: 'Será tributado se a reserva não for constituída, não for recomposta, ou receber destinação diversa'
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 12. TESTE DE RECUPERABILIDADE (Art. 32 da Lei 12.973)
  // ─────────────────────────────────────────────────────────────────────────
  testeRecuperabilidade: {
    artigo: 'Art. 32 da Lei 12.973/2014',
    regra: 'Valores contabilizados como redução ao valor recuperável (impairment) somente reconhecidos no lucro real quando NÃO revertidos E ocorrer alienação ou baixa do bem',
    unidadeGeradoraCaixa: 'Se o ativo compõe UGC, o valor reconhecido no lucro real é proporcional à relação entre o valor contábil do ativo e o total da UGC na data do teste (parágrafo único)',
    impactoRetencao: 'Impairment não reconhecido no lucro real mantém a base de IRPJ/CSLL mais alta → mais imposto devido → mais espaço para compensar retenções sofridas.',
    relevanciaAGROGEO: 'Se equipamentos da AGROGEO (drones, estações totais, veículos) sofrerem impairment, o efeito fiscal só aparece na alienação/baixa.'
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 13. DESPESAS PRÉ-OPERACIONAIS (Art. 11 da Lei 12.973)
  // ─────────────────────────────────────────────────────────────────────────
  despresasPreOperacionais: {
    artigo: 'Art. 11 da Lei 12.973/2014',
    regra: 'Despesas de organização pré-operacionais/pré-industriais e de expansão NÃO são computadas no período em que incorridas',
    amortizacao: 'Podem ser excluídas do lucro real em quotas fixas mensais no prazo mínimo de 5 anos a partir do início das operações/atividades',
    impactoRetencao: 'Despesas pré-operacionais não deduzidas imediatamente mantêm a base de IRPJ/CSLL mais alta no curto prazo — retenções sofridas são compensadas mais rapidamente.',
    relevanciaAGROGEO: 'Se AGROGEO expandir para nova filial ou nova atividade, as despesas de instalação serão amortizadas em 5+ anos para fins fiscais.'
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 14. CONTRATOS DE LONGO PRAZO (Art. 29 da Lei 12.973)
  // ─────────────────────────────────────────────────────────────────────────
  contratosLongoPrazo: {
    artigo: 'Art. 29 da Lei 12.973/2014',
    regra: 'Se o critério contábil de determinação da porcentagem executada for distinto dos previstos no §1º do art. 10 do DL 1.598, e implicar resultado diferente, a diferença deve ser adicionada ou excluída no lucro real',
    impactoRetencao: 'Ajustes de contratos de longo prazo alteram o lucro real do período → afetam a base de IRPJ/CSLL e o saldo de compensação de retenções.',
    relevanciaAGROGEO: 'Relevante para grandes contratos de georreferenciamento/regularização fundiária com órgãos públicos (INCRA, ITERPA) que podem se estender por vários exercícios.'
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 15. INVESTIMENTOS AVALIADOS POR EQUIVALÊNCIA PATRIMONIAL (Arts. 20-25 DL 1.598, alterados)
  // ─────────────────────────────────────────────────────────────────────────
  equivalenciaPatrimonial: {
    artigo: 'Arts. 20 a 25 do DL 1.598/1977 (alterados pela Lei 12.973/2014, art. 2º)',
    desdobramento: {
      descricao: 'Ao adquirir participação avaliada pelo PL, desdobrar o custo em:',
      I: 'Valor patrimonial (PL na proporção da participação)',
      II: 'Mais ou menos-valia (diferença entre valor justo dos ativos líquidos e o valor patrimonial)',
      III: 'Ágio por rentabilidade futura — goodwill (diferença entre custo de aquisição e soma de I + II)'
    },
    laudo: 'Laudo de perito independente deve ser protocolado na RFB ou registrado em Cartório até o último dia útil do 13º mês subsequente à aquisição (§3º do art. 20)',
    ajusteValorJusto: {
      positivo: {
        artigo: 'Art. 24-A do DL 1.598 (incluído pela Lei 12.973)',
        regra: 'Ajuste positivo na participação societária por valor justo de ativo/passivo da investida deve compensar saldo de mais-valia. Ganho excedente computado no lucro real, salvo se evidenciado em subconta.'
      },
      negativo: {
        artigo: 'Art. 24-B do DL 1.598 (incluído pela Lei 12.973)',
        regra: 'Ajuste negativo deve compensar saldo de menos-valia. Perda excedente não computada no lucro real se evidenciada em subconta.'
      }
    },
    resultadoEquivalencia: {
      artigo: 'Art. 23 do DL 1.598 (alterado)',
      regra: 'Contrapartidas de ajuste de investimento ou redução de mais/menos-valia e goodwill de investimentos em sociedades estrangeiras NÃO são computadas no lucro real (parágrafo único)'
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 16. DESPESAS COM EMISSÃO DE AÇÕES E INSTRUMENTOS DE DÍVIDA (Arts. 38-A e 38-B DL 1.598)
  // ─────────────────────────────────────────────────────────────────────────
  despesasEmissaoAcoes: {
    emissaoAcoes: {
      artigo: 'Art. 38-A do DL 1.598/1977 (incluído pela Lei 12.973)',
      regra: 'Custos associados à distribuição primária de ações/bônus de subscrição contabilizados no PL podem ser excluídos na determinação do lucro real quando incorridos'
    },
    instrumentosDivida: {
      artigo: 'Art. 38-B do DL 1.598/1977 (incluído pela Lei 12.973)',
      regra: 'Remuneração, encargos, despesas e custos de instrumentos de capital ou dívida subordinada (exceto ações) contabilizados no PL podem ser excluídos do lucro real e da base da CSLL quando incorridos',
      entidadesFinanceiras: 'Para entidades do §1º do art. 22 da Lei 8.212/91, podem ser excluídos/deduzidos como despesas de intermediação financeira para PIS/COFINS (§1º)',
      estorno: 'Se houver estorno contra PL, valores anteriormente deduzidos devem ser adicionados nas respectivas bases (§3º)'
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 17. MULTAS POR ESCRITURAÇÃO — ECF (Art. 8º-A DL 1.598, incluído pela Lei 12.973)
  // ─────────────────────────────────────────────────────────────────────────
  multasEscrituracao: {
    artigo: 'Art. 8º-A do DL 1.598/1977 (incluído pela Lei 12.973/2014, art. 2º)',
    naoApresentacao: {
      multa: '0,25% por mês-calendário do lucro líquido antes do IR e CSLL, limitada a 10%',
      limites: {
        receitaAte3_6M: 'R$ 100.000,00 (receita bruta ≤ R$ 3.600.000,00)',
        receitaAcima3_6M: 'R$ 5.000.000,00'
      },
      reducoes: {
        ate30dias: '90% de redução',
        ate60dias: '75% de redução',
        antesOficio: '50% de redução',
        emIntimacao: '25% de redução'
      }
    },
    inexatidoes: {
      multa: '3% do valor omitido, inexato ou incorreto (mínimo R$ 100,00)',
      reducoes: {
        antesOficio: 'Não devida se corrigida antes de procedimento de ofício',
        emIntimacao: '50% de redução se corrigida no prazo de intimação'
      }
    },
    relevanciaAGROGEO: 'Com receita de ~R$ 2,35M, AGROGEO se enquadra no limite de R$ 100.000,00. Manter ECF/LALUR rigorosamente em dia para evitar multas.'
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 18. ATIVIDADE IMOBILIÁRIA — PERMUTA (Art. 27 DL 1.598, alterado)
  // ─────────────────────────────────────────────────────────────────────────
  atividadeImobiliaria: {
    artigo: 'Art. 27 do DL 1.598/1977, §3º-§4º (incluídos pela Lei 12.973)',
    permuta: 'Lucro bruto de avaliação a valor justo de unidades permutadas é computado no lucro real quando o imóvel recebido for alienado, classificado em investimentos ou imobilizado',
    vendaPrazo: {
      artigo: 'Art. 29 do DL 1.598 (alterado)',
      regra: 'Na venda a prazo, lucro bruto pode ser reconhecido proporcionalmente à receita recebida'
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 19. CUSTO DE AQUISIÇÃO — ATIVO NÃO CIRCULANTE (Art. 15 DL 1.598, alterado)
  // ─────────────────────────────────────────────────────────────────────────
  custoAquisicaoAtivoNC: {
    artigo: 'Art. 15 do DL 1.598/1977 (nova redação pela Lei 12.973)',
    regra: 'Custo de aquisição de bens do ativo não circulante imobilizado e intangível NÃO pode ser deduzido como despesa operacional, SALVO se:',
    excecoes: {
      valorUnitario: 'Valor unitário ≤ R$ 1.200,00',
      vidaUtil: 'Prazo de vida útil ≤ 1 ano'
    },
    relevanciaAGROGEO: 'Equipamentos de topografia, drones, receptores GNSS acima de R$ 1.200,00 devem ser ativados e depreciados — não podem ser lançados como despesa direta.'
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 20. JUROS E ENCARGOS DE EMPRÉSTIMOS (Art. 17 DL 1.598, alterado)
  // ─────────────────────────────────────────────────────────────────────────
  jurosEmprestimos: {
    artigo: 'Art. 17 do DL 1.598/1977, §1º-§3º (nova redação pela Lei 12.973)',
    regra: {
      a: 'Juros pagos antecipadamente, descontos de títulos, correção monetária prefixada e deságio devem ser apropriados pro rata tempore (§1º, "a")',
      b: 'Juros e encargos de empréstimos para financiar aquisição/construção/produção de estoques de longa maturação, propriedade para investimentos, ativo imobilizado ou intangível podem ser registrados como custo do ativo, até que estejam prontos para uso/venda (§1º, "b")'
    },
    alternativa: 'Alternativamente, juros e encargos do §1º, "b" podem ser excluídos no lucro real quando incorridos, e adicionados quando o ativo for realizado (§3º)',
    impactoRetencao: 'Se juros forem ativados como custo, a despesa dedutível é adiada → lucro real maior no curto prazo → mais IRPJ/CSLL devidos → maior absorção de retenções sofridas como compensação.'
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CONDOMÍNIOS RESIDENCIAIS (Art. 3º da Lei 12.973)
  // ─────────────────────────────────────────────────────────────────────────
  condominiosResidenciais: {
    artigo: 'Art. 3º da Lei 12.973/2014',
    isencaoIRPF: 'Rendimentos recebidos por condomínios residenciais (Lei 4.591/1964) — isentos de IRPF, limitado a R$ 24.000,00/ano',
    condicoes: [
      'Revertidos em benefício do condomínio para despesas de custeio e extraordinárias',
      'Previstos e autorizados na convenção condominial',
      'Não distribuídos aos condôminos'
    ],
    origens: {
      I: 'Uso, aluguel ou locação de partes comuns',
      II: 'Multas e penalidades por inobservância de regras',
      III: 'Alienação de ativos do condomínio'
    }
  }
};

// ============================================================================
// FUNÇÕES
// ============================================================================

/**
 * 1. Calcular IRRF sobre serviços PJ → PJ (Art. 714-716, 718-719, 723)
 *
 * Art. 714: Serviços profissionais — 1,5%
 * Art. 716: Limpeza/segurança/locação mão-de-obra — 1%
 * Art. 718: Comissões/representação/propaganda — 1,5%
 * Art. 719: Cooperativas de trabalho — 1,5%
 * Art. 723: Assessoria creditícia — 1,5%
 *
 * @param {Object} params
 * @param {number} params.valorBrutoNF - Valor bruto da NF de serviço
 * @param {string} params.tipoServico - 'PROFISSIONAL'|'LIMPEZA_SEGURANCA'|'COMISSAO'|'COOPERATIVA'|'ASSESSORIA_CREDITO'
 * @param {boolean} [params.prestadorSimples=false] - Prestador optante pelo Simples Nacional
 * @param {number} [params.valorRepassadoMidia=0] - Propaganda: valor repassado a rádio/TV/jornal (Art. 718 §1º)
 * @returns {Object} Resultado com IRRF calculado
 */
function calcularIRRFServicoPJ(params) {
  const {
    valorBrutoNF,
    tipoServico,
    prestadorSimples = false,
    valorRepassadoMidia = 0
  } = params;

  // Simples Nacional: dispensado de retenção (LC 123/2006, art. 30, II)
  if (prestadorSimples) {
    return {
      artigo: 'Art. 714-723 c/c LC 123/2006, art. 30',
      valorBrutoNF,
      tipoServico,
      irrfRetido: 0,
      aliquotaAplicada: 0,
      dispensadoSimples: true,
      observacao: 'Prestador optante pelo Simples Nacional — dispensado de retenção IRRF'
    };
  }

  let aliquota, artigo, baseCalculo;

  switch (tipoServico) {
    case 'PROFISSIONAL':
      aliquota = IRRF_SERVICOS_PROFISSIONAIS.aliquota; // 1,5%
      artigo = 'Art. 714';
      baseCalculo = valorBrutoNF;
      break;

    case 'LIMPEZA_SEGURANCA':
      aliquota = IRRF_SERVICOS_LIMPEZA_SEGURANCA.aliquota; // 1%
      artigo = 'Art. 716';
      baseCalculo = valorBrutoNF;
      break;

    case 'COMISSAO':
      aliquota = IRRF_COMISSOES_REPRESENTACAO.aliquota; // 1,5%
      artigo = 'Art. 718';
      baseCalculo = valorBrutoNF - valorRepassadoMidia; // Art. 718 §1º
      break;

    case 'COOPERATIVA':
      aliquota = IRRF_COOPERATIVAS.aliquota; // 1,5%
      artigo = 'Art. 719';
      baseCalculo = valorBrutoNF;
      break;

    case 'ASSESSORIA_CREDITO':
      aliquota = IRRF_ASSESSORIA_CREDITO.aliquota; // 1,5%
      artigo = 'Art. 723';
      baseCalculo = valorBrutoNF;
      break;

    default:
      throw new Error(`Tipo de serviço inválido: ${tipoServico}. Use: PROFISSIONAL, LIMPEZA_SEGURANCA, COMISSAO, COOPERATIVA, ASSESSORIA_CREDITO`);
  }

  if (baseCalculo < 0) baseCalculo = 0;

  const irrfRetido = Math.round(baseCalculo * aliquota * 100) / 100;

  return {
    artigo,
    baseLegal: `${artigo} do RIR/2018`,
    valorBrutoNF,
    tipoServico,
    valorRepassadoMidia: tipoServico === 'COMISSAO' ? valorRepassadoMidia : 0,
    baseCalculo,
    aliquotaAplicada: aliquota,
    aliquotaPercentual: `${(aliquota * 100).toFixed(1)}%`,
    irrfRetido,
    valorLiquido: valorBrutoNF - irrfRetido,
    tratamento: 'Antecipação do IRPJ devido (Art. 717)',
    dispensadoSimples: false,
    codigoDARF: tipoServico === 'LIMPEZA_SEGURANCA' ? '1708' : '1708'
  };
}

/**
 * 2. Calcular CSRF sobre serviços PJ → PJ (Lei 10.833/2003, art. 30)
 *
 * PIS 0,65% + COFINS 3% + CSLL 1% = 4,65% sobre o valor bruto da NF
 *
 * @param {Object} params
 * @param {number} params.valorBrutoNF - Valor bruto da NF
 * @param {boolean} [params.prestadorSimples=false] - Prestador Simples Nacional
 * @param {boolean} [params.serveSujeito=true] - Serviço está na lista sujeita à CSRF
 * @returns {Object} Resultado com PIS/COFINS/CSLL retidos
 */
function calcularCSRF(params) {
  const {
    valorBrutoNF,
    prestadorSimples = false,
    servicoSujeito = true
  } = params;

  // Dispensas
  if (prestadorSimples) {
    return {
      baseLegal: 'Lei 10.833/2003, art. 30 c/c LC 123/2006',
      valorBrutoNF,
      pisRetido: 0, cofinsRetido: 0, csllRetido: 0, totalCSRF: 0,
      dispensado: true,
      motivo: 'Prestador optante pelo Simples Nacional'
    };
  }

  if (!servicoSujeito) {
    return {
      baseLegal: 'Lei 10.833/2003, art. 30',
      valorBrutoNF,
      pisRetido: 0, cofinsRetido: 0, csllRetido: 0, totalCSRF: 0,
      dispensado: true,
      motivo: 'Serviço não sujeito à retenção de CSRF'
    };
  }

  const pisRetido    = Math.round(valorBrutoNF * CSRF.aliquotas.pis    * 100) / 100;
  const cofinsRetido = Math.round(valorBrutoNF * CSRF.aliquotas.cofins * 100) / 100;
  const csllRetido   = Math.round(valorBrutoNF * CSRF.aliquotas.csll   * 100) / 100;
  const totalCSRF    = Math.round((pisRetido + cofinsRetido + csllRetido) * 100) / 100;

  // Dispensa se total ≤ R$ 10,00
  if (totalCSRF <= 10) {
    return {
      baseLegal: 'Lei 10.833/2003, art. 31, §3º',
      valorBrutoNF,
      pisRetido: 0, cofinsRetido: 0, csllRetido: 0, totalCSRF: 0,
      dispensado: true,
      motivo: `Retenção ≤ R$ 10,00 (seria R$ ${totalCSRF.toFixed(2)}) — dispensada`
    };
  }

  return {
    baseLegal: 'Lei 10.833/2003, art. 30',
    valorBrutoNF,
    baseCalculo: valorBrutoNF,
    pisRetido,
    cofinsRetido,
    csllRetido,
    totalCSRF,
    aliquotas: {
      pis: '0,65%',
      cofins: '3,00%',
      csll: '1,00%',
      total: '4,65%'
    },
    valorLiquido: Math.round((valorBrutoNF - totalCSRF) * 100) / 100,
    tratamento: {
      pis: 'Compensável com PIS devido',
      cofins: 'Compensável com COFINS devida',
      csll: 'Compensável com CSLL devida'
    },
    dispensado: false,
    codigosDARF: CSRF.codigoDARF,
    prazo: CSRF.prazoRecolhimento
  };
}

/**
 * 3. Calcular IRRF sobre rendimentos PF — Tabela Progressiva (Art. 677)
 *
 * Aplica-se a: salários, pro-labore (Art. 699), aluguéis PJ→PF (Art. 688),
 * trabalho não-assalariado (Art. 685), e demais rendimentos (Art. 701).
 *
 * @param {Object} params
 * @param {number} params.rendimentoBruto - Rendimento bruto mensal
 * @param {number} [params.inss=0] - Contribuição INSS descontada
 * @param {number} [params.dependentes=0] - Número de dependentes
 * @param {number} [params.pensaoAlimenticia=0] - Pensão alimentícia judicial (Art. 709)
 * @param {number} [params.previdenciaPrivada=0] - Previdência privada (Art. 710)
 * @param {string} [params.tabelaRef='2025'] - Tabela de referência: '2025', '2023', '2015'
 * @param {string} [params.tipoRendimento='SALARIO'] - 'SALARIO'|'PRO_LABORE'|'ALUGUEL'|'AUTONOMO'|'13_SALARIO'
 * @returns {Object} Resultado com IRRF calculado
 */
function calcularIRRFPessoaFisica(params) {
  const {
    rendimentoBruto,
    inss = 0,
    dependentes = 0,
    pensaoAlimenticia = 0,
    previdenciaPrivada = 0,
    tabelaRef = '2025',
    tipoRendimento = 'SALARIO'
  } = params;

  // Selecionar tabela
  let tabela, deducaoDep;
  switch (tabelaRef) {
    case '2025':
      tabela = TABELAS_IRPF.tabela_2025;
      deducaoDep = TABELAS_IRPF.deducaoDependente_2025;
      break;
    case '2023':
      tabela = TABELAS_IRPF.tabela_2023;
      deducaoDep = TABELAS_IRPF.deducaoDependente_2023;
      break;
    case '2015':
      tabela = TABELAS_IRPF.tabela_2015;
      deducaoDep = TABELAS_IRPF.deducaoDependente_2015;
      break;
    default:
      tabela = TABELAS_IRPF.tabela_2025;
      deducaoDep = TABELAS_IRPF.deducaoDependente_2025;
  }

  // Deduções (Art. 707-711)
  const deducaoINSS = inss;
  const deducaoDependentes = dependentes * deducaoDep;
  const deducaoPensao = pensaoAlimenticia;
  const deducaoPrevidenciaPrivada = previdenciaPrivada;

  const totalDeducoes = deducaoINSS + deducaoDependentes + deducaoPensao + deducaoPrevidenciaPrivada;

  // Base de cálculo (Art. 712)
  const baseCalculo = Math.max(rendimentoBruto - totalDeducoes, 0);

  // Desconto simplificado — MP 1.294/2025 e Lei 14.663/2023
  // Contribuinte pode optar pelo desconto simplificado de R$ 564,80 (2023) / R$ 607,20 (2025)
  // ao invés das deduções legais. O motor compara e usa o mais vantajoso.
  let descontoSimplificado = 0;
  if (tabelaRef === '2025') descontoSimplificado = 607.20;
  else if (tabelaRef === '2023') descontoSimplificado = 564.80;

  const baseCalcSimplificado = Math.max(rendimentoBruto - descontoSimplificado, 0);
  const usarSimplificado = (descontoSimplificado > 0 && baseCalcSimplificado < baseCalculo);
  const baseEfetiva = usarSimplificado ? baseCalcSimplificado : baseCalculo;

  // Aplicar tabela progressiva
  let aliquotaEfetiva = 0;
  let deducaoImposto = 0;
  let faixaAplicada = 1;

  for (const faixa of tabela) {
    if (baseEfetiva <= (faixa.ate || Infinity)) {
      aliquotaEfetiva = faixa.aliquota;
      deducaoImposto = faixa.deducao;
      faixaAplicada = faixa.faixa;
      break;
    }
  }

  let irrfCalculado = Math.round((baseEfetiva * aliquotaEfetiva - deducaoImposto) * 100) / 100;
  if (irrfCalculado < 0) irrfCalculado = 0;

  // Artigo de referência conforme tipo
  let artigo;
  switch (tipoRendimento) {
    case 'SALARIO':     artigo = 'Art. 681 c/c Art. 677'; break;
    case 'PRO_LABORE':  artigo = 'Art. 699 c/c Art. 677'; break;
    case 'ALUGUEL':     artigo = 'Art. 688 c/c Art. 677'; break;
    case 'AUTONOMO':    artigo = 'Art. 685 c/c Art. 677'; break;
    case '13_SALARIO':  artigo = 'Art. 700 c/c Art. 677'; break;
    default:            artigo = 'Art. 701 c/c Art. 677';
  }

  return {
    artigo,
    tipoRendimento,
    tabelaRef,
    rendimentoBruto,
    deducoes: {
      inss: deducaoINSS,
      dependentes: deducaoDependentes,
      qtdDependentes: dependentes,
      valorPorDependente: deducaoDep,
      pensaoAlimenticia: deducaoPensao,
      previdenciaPrivada: deducaoPrevidenciaPrivada,
      totalDeducoes
    },
    descontoSimplificado: usarSimplificado ? descontoSimplificado : 0,
    metodoUsado: usarSimplificado ? 'SIMPLIFICADO' : 'DEDUCOES_LEGAIS',
    baseCalculo: baseEfetiva,
    faixaAplicada,
    aliquotaEfetiva: `${(aliquotaEfetiva * 100).toFixed(1)}%`,
    deducaoImposto,
    irrfRetido: irrfCalculado,
    rendimentoLiquido: Math.round((rendimentoBruto - inss - irrfCalculado) * 100) / 100,
    tratamento: tipoRendimento === '13_SALARIO'
      ? 'Tributação exclusiva na fonte, separada (Art. 700, III)'
      : 'Antecipação do IR devido na DIRPF (Art. 677 §3º)'
  };
}

/**
 * 4. Calcular IRRF sobre pagamentos pela Administração Pública (Art. 720-722)
 *
 * Método: 15% sobre (valor × percentual presunção por atividade)
 *
 * @param {Object} params
 * @param {number} params.valorPago - Valor pago pelo órgão público
 * @param {string} params.tipoReceita - 'SERVICOS'|'COMERCIO'|'TRANSPORTE_CARGA'|'HOSPITALAR'|'COMBUSTIVEIS'
 * @param {boolean} [params.prestadorSimples=false]
 * @returns {Object}
 */
function calcularIRRFAdmPublica(params) {
  const {
    valorPago,
    tipoReceita,
    prestadorSimples = false
  } = params;

  // Simples: dispensado (Art. 720 §6º)
  if (prestadorSimples) {
    return {
      artigo: 'Art. 720 §6º',
      valorPago,
      irrfRetido: 0,
      dispensado: true,
      motivo: 'Optante Simples Nacional — dispensado (LC 123/2006, art. 13)'
    };
  }

  const percentuais = IRRF_ADMINISTRACAO_PUBLICA.percentuaisPresuncao;
  let percPresuncao;

  switch (tipoReceita) {
    case 'SERVICOS':           percPresuncao = percentuais.servicos_geral;      break;
    case 'COMERCIO':           percPresuncao = percentuais.comercio;             break;
    case 'TRANSPORTE_CARGA':   percPresuncao = percentuais.transporte_carga;     break;
    case 'HOSPITALAR':         percPresuncao = percentuais.servicos_hospitalar;  break;
    case 'COMBUSTIVEIS':       percPresuncao = percentuais.combustiveis;         break;
    default:                   percPresuncao = percentuais.servicos_geral;
  }

  const basePresumida = Math.round(valorPago * percPresuncao * 100) / 100;
  const irrfRetido = Math.round(basePresumida * 0.15 * 100) / 100;

  // Dispensa se ≤ R$ 10,00
  if (irrfRetido <= 10) {
    return {
      artigo: 'Art. 720 c/c Art. 721 §3º',
      valorPago,
      irrfRetido: 0,
      dispensado: true,
      motivo: `Retenção ≤ R$ 10,00 (seria R$ ${irrfRetido.toFixed(2)}) — dispensada`
    };
  }

  const aliquotaEfetiva = percPresuncao * 0.15;

  return {
    artigo: 'Art. 720-722',
    baseLegal: 'Lei 9.430/1996, art. 64',
    valorPago,
    tipoReceita,
    percentualPresuncao: `${(percPresuncao * 100).toFixed(1)}%`,
    basePresumida,
    aliquotaIRPJ: '15%',
    aliquotaEfetiva: `${(aliquotaEfetiva * 100).toFixed(2)}%`,
    irrfRetido,
    valorLiquido: valorPago - irrfRetido,
    tratamento: 'Antecipação do IRPJ devido (Art. 720 §3º)',
    dispensado: false,
    prazoRecolhimento: IRRF_ADMINISTRACAO_PUBLICA.prazoRecolhimento
  };
}

/**
 * 5. Calcular retenção total sobre NF de serviço (IRRF + CSRF + ISS)
 *
 * Visão integrada: quanto efetivamente o prestador recebe líquido
 * e quais créditos tributários gera.
 *
 * @param {Object} params
 * @param {number} params.valorBrutoNF - Valor bruto da NF
 * @param {string} params.tipoServico - Tipo do serviço para IRRF
 * @param {boolean} [params.prestadorSimples=false]
 * @param {boolean} [params.retencaoISS=false] - Se há retenção de ISS
 * @param {number} [params.aliquotaISS=0.05] - Alíquota ISS municipal
 * @param {boolean} [params.tomadorAdmPublica=false] - Se tomador é órgão público
 * @param {string} [params.tipoReceitaAdmPublica='SERVICOS'] - Tipo receita se Adm. Pública
 * @returns {Object} Consolidação de todas as retenções
 */
function calcularRetencaoIntegrada(params) {
  const {
    valorBrutoNF,
    tipoServico,
    prestadorSimples = false,
    retencaoISS = false,
    aliquotaISS = 0.05,
    tomadorAdmPublica = false,
    tipoReceitaAdmPublica = 'SERVICOS'
  } = params;

  // IRRF sobre serviço PJ
  let irrf;
  if (tomadorAdmPublica && !prestadorSimples) {
    // Adm. Pública: método do Art. 720 (substitui demais retenções IRRF — Art. 720 §5º)
    irrf = calcularIRRFAdmPublica({
      valorPago: valorBrutoNF,
      tipoReceita: tipoReceitaAdmPublica,
      prestadorSimples
    });
  } else {
    irrf = calcularIRRFServicoPJ({
      valorBrutoNF,
      tipoServico,
      prestadorSimples
    });
  }

  // CSRF (PIS/COFINS/CSLL retidos)
  const csrf = calcularCSRF({
    valorBrutoNF,
    prestadorSimples,
    servicoSujeito: true
  });

  // ISS retido
  let issRetido = 0;
  if (retencaoISS && !prestadorSimples) {
    issRetido = Math.round(valorBrutoNF * aliquotaISS * 100) / 100;
  }

  // Totais
  const totalRetencoes = Math.round((
    irrf.irrfRetido +
    csrf.totalCSRF +
    issRetido
  ) * 100) / 100;

  const valorLiquido = Math.round((valorBrutoNF - totalRetencoes) * 100) / 100;
  const percentualRetencao = valorBrutoNF > 0
    ? Math.round((totalRetencoes / valorBrutoNF) * 10000) / 100
    : 0;

  return {
    descricao: 'Retenção integrada sobre NF de serviço',
    valorBrutoNF,
    tipoServico,
    prestadorSimples,
    tomadorAdmPublica,

    irrf: {
      base: irrf.baseCalculo || irrf.basePresumida || 0,
      aliquota: irrf.aliquotaAplicada || irrf.aliquotaEfetiva || '0%',
      valor: irrf.irrfRetido,
      artigo: irrf.artigo
    },

    csrf: {
      pis: csrf.pisRetido,
      cofins: csrf.cofinsRetido,
      csll: csrf.csllRetido,
      total: csrf.totalCSRF,
      dispensado: csrf.dispensado
    },

    iss: {
      aliquota: retencaoISS ? `${(aliquotaISS * 100).toFixed(1)}%` : 'N/A',
      valor: issRetido,
      retido: retencaoISS
    },

    resumo: {
      totalRetencoes,
      percentualRetencao: `${percentualRetencao.toFixed(2)}%`,
      valorLiquido,
      creditosTributarios: {
        irpj: irrf.irrfRetido,
        pis: csrf.pisRetido,
        cofins: csrf.cofinsRetido,
        csll: csrf.csllRetido,
        iss: issRetido,
        nota: 'IRRF/PIS/COFINS/CSLL são antecipações compensáveis; ISS é tributo municipal'
      }
    }
  };
}

/**
 * 6. Calcular IRRF sobre JCP (Art. 726)
 *
 * @param {Object} params
 * @param {number} params.valorJCP - Valor dos juros sobre capital próprio
 * @param {string} [params.tipoBeneficiario='PJ_LUCRO_REAL'] - Tipo do beneficiário
 * @returns {Object}
 */
function calcularIRRFJCP(params) {
  const {
    valorJCP,
    tipoBeneficiario = 'PJ_LUCRO_REAL'
  } = params;

  const irrfRetido = Math.round(valorJCP * IRRF_JCP.aliquota * 100) / 100;

  let tratamento;
  switch (tipoBeneficiario) {
    case 'PJ_LUCRO_REAL':
    case 'PJ_LUCRO_PRESUMIDO':
    case 'PJ_LUCRO_ARBITRADO':
      tratamento = 'Antecipação do IRPJ devido (Art. 726 §1º, I)';
      break;
    case 'PJ_ISENTA':
    case 'PF':
    default:
      tratamento = 'Tributação definitiva (Art. 726 §1º, II)';
  }

  return {
    artigo: 'Art. 726',
    baseLegal: 'Lei 9.249/1995, art. 9º, §2º',
    valorJCP,
    aliquota: '15%',
    irrfRetido,
    valorLiquido: valorJCP - irrfRetido,
    tipoBeneficiario,
    tratamento,
    codigoDARF: '5706'
  };
}

/**
 * 7. Calcular folha de pagamento com retenções (IRRF + INSS)
 *
 * Calcula IRRF individual de cada funcionário + totais da folha.
 * AGROGEO: ~R$ 1M/ano de folha ≈ ~R$ 83.333/mês
 *
 * @param {Object} params
 * @param {Array<Object>} params.funcionarios - Lista de funcionários
 *   Cada: { nome, salarioBruto, dependentes, pensaoAlimenticia, previdenciaPrivada, tipo }
 * @param {string} [params.tabelaRef='2025']
 * @returns {Object} Resultado com IRRF por funcionário e totais
 */
function calcularFolhaPagamento(params) {
  const { funcionarios, tabelaRef = '2025' } = params;

  // Faixas INSS 2025 (aproximadas — verificar IN RFB vigente)
  const faixasINSS = [
    { ate: 1518.00,  aliquota: 0.075  },
    { ate: 2793.88,  aliquota: 0.09   },
    { ate: 4190.83,  aliquota: 0.12   },
    { ate: 8157.41,  aliquota: 0.14   }
  ];

  function calcularINSS(salario) {
    let inss = 0;
    let anterior = 0;
    for (const faixa of faixasINSS) {
      const base = Math.min(salario, faixa.ate) - anterior;
      if (base <= 0) break;
      inss += base * faixa.aliquota;
      anterior = faixa.ate;
    }
    return Math.round(inss * 100) / 100;
  }

  const resultados = funcionarios.map(func => {
    const inss = calcularINSS(func.salarioBruto);

    const irrf = calcularIRRFPessoaFisica({
      rendimentoBruto: func.salarioBruto,
      inss,
      dependentes: func.dependentes || 0,
      pensaoAlimenticia: func.pensaoAlimenticia || 0,
      previdenciaPrivada: func.previdenciaPrivada || 0,
      tabelaRef,
      tipoRendimento: func.tipo || 'SALARIO'
    });

    return {
      nome: func.nome,
      salarioBruto: func.salarioBruto,
      tipo: func.tipo || 'SALARIO',
      inssDescontado: inss,
      irrfRetido: irrf.irrfRetido,
      baseCalculoIRRF: irrf.baseCalculo,
      faixaIRRF: irrf.faixaAplicada,
      aliquotaIRRF: irrf.aliquotaEfetiva,
      metodoIRRF: irrf.metodoUsado,
      salarioLiquido: Math.round((func.salarioBruto - inss - irrf.irrfRetido) * 100) / 100
    };
  });

  const totais = resultados.reduce((acc, r) => ({
    totalBruto: acc.totalBruto + r.salarioBruto,
    totalINSS: acc.totalINSS + r.inssDescontado,
    totalIRRF: acc.totalIRRF + r.irrfRetido,
    totalLiquido: acc.totalLiquido + r.salarioLiquido
  }), { totalBruto: 0, totalINSS: 0, totalIRRF: 0, totalLiquido: 0 });

  // Arredondar totais
  Object.keys(totais).forEach(k => totais[k] = Math.round(totais[k] * 100) / 100);

  // Encargos patronais (INSS 20% + RAT 2% + Terceiros 5,8% = 27,8% — simplificado)
  const inssPatronal = Math.round(totais.totalBruto * 0.20 * 100) / 100;
  const rat = Math.round(totais.totalBruto * 0.02 * 100) / 100;
  const terceiros = Math.round(totais.totalBruto * 0.058 * 100) / 100;

  return {
    descricao: 'Folha de pagamento com retenções — Art. 677/699/681',
    tabelaRef,
    quantidadeFuncionarios: funcionarios.length,
    funcionarios: resultados,
    totais,
    encargosPatronais: {
      inssPatronal,
      rat,
      terceiros,
      fgts: Math.round(totais.totalBruto * 0.08 * 100) / 100,
      totalEncargos: Math.round((inssPatronal + rat + terceiros + totais.totalBruto * 0.08) * 100) / 100
    },
    custoTotalEmpregador: Math.round((
      totais.totalBruto +
      inssPatronal + rat + terceiros +
      totais.totalBruto * 0.08
    ) * 100) / 100
  };
}

/**
 * 8. Controlar saldo de retenções para compensação no período
 *
 * Consolida IRRF/PIS/COFINS/CSLL retidos sobre a AGROGEO (quando AGROGEO é prestadora)
 * e calcula quanto pode ser compensado com os tributos devidos.
 *
 * @param {Object} params
 * @param {Object} params.retencoesSofridas - { irrf, pis, cofins, csll }
 * @param {Object} params.tributosDevidos - { irpj, csll, pis, cofins }
 * @returns {Object} Saldo de compensação
 */
function compensarRetencoes(params) {
  const { retencoesSofridas, tributosDevidos } = params;

  // IRRF compensa somente com IRPJ (Art. 717, 720 §4º)
  const irrfCompensavel = Math.min(retencoesSofridas.irrf || 0, tributosDevidos.irpj || 0);
  const saldoIRRF = Math.round(((retencoesSofridas.irrf || 0) - irrfCompensavel) * 100) / 100;

  // PIS retido compensa com PIS devido
  const pisCompensavel = Math.min(retencoesSofridas.pis || 0, tributosDevidos.pis || 0);
  const saldoPIS = Math.round(((retencoesSofridas.pis || 0) - pisCompensavel) * 100) / 100;

  // COFINS retida compensa com COFINS devida
  const cofinsCompensavel = Math.min(retencoesSofridas.cofins || 0, tributosDevidos.cofins || 0);
  const saldoCOFINS = Math.round(((retencoesSofridas.cofins || 0) - cofinsCompensavel) * 100) / 100;

  // CSLL retida compensa com CSLL devida
  const csllCompensavel = Math.min(retencoesSofridas.csll || 0, tributosDevidos.csll || 0);
  const saldoCSLL = Math.round(((retencoesSofridas.csll || 0) - csllCompensavel) * 100) / 100;

  const totalCompensado = Math.round((irrfCompensavel + pisCompensavel + cofinsCompensavel + csllCompensavel) * 100) / 100;
  const totalSaldoCredor = Math.round((saldoIRRF + saldoPIS + saldoCOFINS + saldoCSLL) * 100) / 100;

  return {
    descricao: 'Compensação de retenções sofridas com tributos devidos',
    baseLegal: 'Art. 717 (IRRF); Lei 10.833/2003, art. 36 (CSRF)',

    retencoesSofridas: {
      irrf: retencoesSofridas.irrf || 0,
      pis: retencoesSofridas.pis || 0,
      cofins: retencoesSofridas.cofins || 0,
      csll: retencoesSofridas.csll || 0,
      total: Math.round(((retencoesSofridas.irrf || 0) + (retencoesSofridas.pis || 0) +
             (retencoesSofridas.cofins || 0) + (retencoesSofridas.csll || 0)) * 100) / 100
    },

    tributosDevidos: {
      irpj: tributosDevidos.irpj || 0,
      csll: tributosDevidos.csll || 0,
      pis: tributosDevidos.pis || 0,
      cofins: tributosDevidos.cofins || 0,
      total: Math.round(((tributosDevidos.irpj || 0) + (tributosDevidos.csll || 0) +
             (tributosDevidos.pis || 0) + (tributosDevidos.cofins || 0)) * 100) / 100
    },

    compensacao: {
      irrf_com_irpj: irrfCompensavel,
      pis_com_pis: pisCompensavel,
      cofins_com_cofins: cofinsCompensavel,
      csll_com_csll: csllCompensavel,
      totalCompensado
    },

    tributosARecolher: {
      irpj: Math.round(((tributosDevidos.irpj || 0) - irrfCompensavel) * 100) / 100,
      csll: Math.round(((tributosDevidos.csll || 0) - csllCompensavel) * 100) / 100,
      pis: Math.round(((tributosDevidos.pis || 0) - pisCompensavel) * 100) / 100,
      cofins: Math.round(((tributosDevidos.cofins || 0) - cofinsCompensavel) * 100) / 100,
      total: Math.round((
        (tributosDevidos.irpj || 0) - irrfCompensavel +
        (tributosDevidos.csll || 0) - csllCompensavel +
        (tributosDevidos.pis || 0) - pisCompensavel +
        (tributosDevidos.cofins || 0) - cofinsCompensavel
      ) * 100) / 100
    },

    saldoCredor: {
      irrf: saldoIRRF,
      pis: saldoPIS,
      cofins: saldoCOFINS,
      csll: saldoCSLL,
      total: totalSaldoCredor,
      destinacao: totalSaldoCredor > 0
        ? 'Saldo credor pode ser compensado em períodos seguintes via PER/DCOMP ou pedido de restituição'
        : 'Sem saldo credor'
    }
  };
}

/**
 * 9. Simular impacto das retenções na migração Simples → Lucro Real
 *
 * No Simples Nacional, a AGROGEO NÃO sofre retenções (LC 123/2006).
 * Ao migrar para Lucro Real, passa a sofrer IRRF 1,5% + CSRF 4,65% + ISS
 * sobre TODAS as NFs emitidas.
 *
 * @param {Object} params
 * @param {number} params.receitaAnualServicos - Receita anual de serviços
 * @param {number} params.percentualPJ - % da receita vinda de PJ (que retém)
 * @param {number} params.percentualAdmPublica - % da receita de órgãos públicos
 * @param {number} params.percentualRetencaoISS - % da receita com retenção ISS
 * @param {number} [params.aliquotaISS=0.05]
 * @returns {Object} Projeção de retenções anuais
 */
function simularRetencoesAnuais(params) {
  const {
    receitaAnualServicos,
    percentualPJ,
    percentualAdmPublica,
    percentualRetencaoISS,
    aliquotaISS = 0.05
  } = params;

  // Receita segmentada
  const receitaPJ = receitaAnualServicos * (percentualPJ / 100);
  const receitaAdmPublica = receitaAnualServicos * (percentualAdmPublica / 100);
  const receitaPJPrivada = receitaPJ - receitaAdmPublica;
  const receitaPF = receitaAnualServicos - receitaPJ;

  // IRRF sobre serviços PJ privada (1,5%)
  const irrfPJPrivada = Math.round(receitaPJPrivada * 0.015 * 100) / 100;

  // IRRF sobre serviços Adm. Pública (4,8% efetivo para serviços)
  const irrfAdmPublica = Math.round(receitaAdmPublica * 0.048 * 100) / 100;

  // CSRF sobre PJ (4,65%) — inclui Adm. Pública
  const csrfTotal = Math.round(receitaPJ * 0.0465 * 100) / 100;

  // ISS retido
  const receitaComRetencaoISS = receitaAnualServicos * (percentualRetencaoISS / 100);
  const issRetido = Math.round(receitaComRetencaoISS * aliquotaISS * 100) / 100;

  const totalRetencoesAnuais = Math.round((irrfPJPrivada + irrfAdmPublica + csrfTotal + issRetido) * 100) / 100;

  return {
    descricao: 'Projeção anual de retenções na fonte — cenário Lucro Real',
    receitaAnualServicos,

    segmentacao: {
      receitaPJTotal: receitaPJ,
      receitaPJPrivada,
      receitaAdmPublica,
      receitaPF,
      receitaComRetencaoISS
    },

    retencoes: {
      irrfPJPrivada: {
        aliquota: '1,5%',
        valor: irrfPJPrivada
      },
      irrfAdmPublica: {
        aliquota: '4,8% efetivo',
        valor: irrfAdmPublica
      },
      csrf: {
        aliquota: '4,65%',
        valor: csrfTotal,
        detalhe: {
          pis: Math.round(receitaPJ * 0.0065 * 100) / 100,
          cofins: Math.round(receitaPJ * 0.03 * 100) / 100,
          csll: Math.round(receitaPJ * 0.01 * 100) / 100
        }
      },
      issRetido: {
        aliquota: `${(aliquotaISS * 100).toFixed(1)}%`,
        valor: issRetido
      }
    },

    totalRetencoesAnuais,
    percentualRetencaoMedio: `${((totalRetencoesAnuais / receitaAnualServicos) * 100).toFixed(2)}%`,

    impactoCaixaMensal: {
      retencaoMediaMensal: Math.round(totalRetencoesAnuais / 12 * 100) / 100,
      nota: 'Retenções são antecipações — compensam no período. Impacto é no fluxo de caixa (timing), não no custo.'
    },

    comparacaoSimples: {
      simplesNacional: 'ZERO retenções (LC 123/2006)',
      lucroReal: `R$ ${totalRetencoesAnuais.toFixed(2)}/ano retidos antecipadamente`,
      diferenca: `Impacto de caixa: R$ ${Math.round(totalRetencoesAnuais / 12).toFixed(2)}/mês`,
      observacao: 'As retenções NÃO são custo adicional — são CRÉDITOS que reduzem o imposto a pagar. O impacto é apenas de timing no fluxo de caixa.'
    }
  };
}

/**
 * 10. Gerar relatório consolidado de retenções — Bloco G
 *
 * @param {Object} params
 * @param {Object} [params.retencaoNF] - Resultado de calcularRetencaoIntegrada
 * @param {Object} [params.folha] - Resultado de calcularFolhaPagamento
 * @param {Object} [params.compensacao] - Resultado de compensarRetencoes
 * @param {Object} [params.projecao] - Resultado de simularRetencoesAnuais
 * @returns {Object}
 */
function gerarRelatorioG(params) {
  const { retencaoNF, folha, compensacao, projecao } = params;

  const resultado = {
    bloco: 'G — Retenções na Fonte',
    baseLegal: 'Art. 714-749 do RIR/2018; Lei 10.833/2003, art. 30-36; LC 116/2003',
    dataGeracao: new Date().toISOString(),
    secoes: {}
  };

  if (retencaoNF) {
    resultado.secoes.retencaoNF = {
      valorBruto: retencaoNF.valorBrutoNF,
      irrf: retencaoNF.irrf.valor,
      csrf: retencaoNF.csrf.total,
      iss: retencaoNF.iss.valor,
      totalRetencoes: retencaoNF.resumo.totalRetencoes,
      percentual: retencaoNF.resumo.percentualRetencao,
      valorLiquido: retencaoNF.resumo.valorLiquido
    };
  }

  if (folha) {
    resultado.secoes.folha = {
      qtdFuncionarios: folha.quantidadeFuncionarios,
      totalBruto: folha.totais.totalBruto,
      totalINSS: folha.totais.totalINSS,
      totalIRRF: folha.totais.totalIRRF,
      totalLiquido: folha.totais.totalLiquido,
      custoTotal: folha.custoTotalEmpregador
    };
  }

  if (compensacao) {
    resultado.secoes.compensacao = {
      totalRetencoesSofridas: compensacao.retencoesSofridas.total,
      totalCompensado: compensacao.compensacao.totalCompensado,
      totalARecolher: compensacao.tributosARecolher.total,
      saldoCredor: compensacao.saldoCredor.total
    };
  }

  if (projecao) {
    resultado.secoes.projecao = {
      receitaAnual: projecao.receitaAnualServicos,
      totalRetencoesAnuais: projecao.totalRetencoesAnuais,
      percentualMedio: projecao.percentualRetencaoMedio,
      impactoCaixaMensal: projecao.impactoCaixaMensal.retencaoMediaMensal
    };
  }

  // Obrigações acessórias relacionadas
  resultado.obrigacoesAcessorias = {
    DIRF: 'Declaração do Imposto sobre a Renda Retido na Fonte — anual (substituída pela EFD-Reinf a partir de 2024)',
    EFDReinf: 'Escrituração Fiscal Digital de Retenções — série R-4000 (eventos de retenções)',
    DCTFWeb: 'Declaração de Débitos e Créditos Tributários Federais — mensal (confissão de débito)',
    DARF: 'Documento de Arrecadação de Receitas Federais — recolhimento das retenções',
    eSocial: 'Retenções sobre folha (IRRF PF) informadas nos eventos S-1200/S-1210',
    prazos: {
      irrfPJ: 'Até o último dia útil do 2º decêndio do mês subsequente',
      irrfPF_folha: 'Até o dia 20 do mês subsequente (antecipado se não for dia útil)',
      csrf: 'Até o último dia útil do 2º decêndio do mês subsequente',
      issRetido: 'Conforme legislação municipal — geralmente até dia 15 do mês seguinte'
    }
  };

  return resultado;
}

// ============================================================================
// FUNÇÕES — LEI 12.973/2014
// ============================================================================

/**
 * 11. Calcular JCP com base nas contas do PL definidas pela Lei 12.973
 *
 * Art. 9º, §8º da Lei 9.249/1995 (redação Lei 12.973): somente capital social,
 * reservas de capital, reservas de lucros, ações em tesouraria e prejuízos acumulados.
 *
 * @param {Object} params
 * @param {number} params.capitalSocial - Capital social (inclui ações em passivo — §12)
 * @param {number} [params.reservasCapital=0]
 * @param {number} [params.reservasLucros=0]
 * @param {number} [params.acoesEmTesouraria=0] - Valor positivo (será deduzido)
 * @param {number} [params.prejuizosAcumulados=0] - Valor positivo (será deduzido)
 * @param {number} params.taxaTJLP - Taxa TJLP/TLP do período (decimal, ex: 0.0612 para 6,12% a.a.)
 * @param {string} [params.tipoBeneficiario='PJ_LUCRO_REAL']
 * @returns {Object} JCP calculado com IRRF e base legal Lei 12.973
 */
function calcularJCPLei12973(params) {
  const {
    capitalSocial,
    reservasCapital = 0,
    reservasLucros = 0,
    acoesEmTesouraria = 0,
    prejuizosAcumulados = 0,
    taxaTJLP,
    tipoBeneficiario = 'PJ_LUCRO_REAL'
  } = params;

  // Base do PL para JCP conforme §8º do Art. 9º Lei 9.249 (redação Lei 12.973)
  const basePL = capitalSocial + reservasCapital + reservasLucros - acoesEmTesouraria - prejuizosAcumulados;

  if (basePL <= 0) {
    return {
      artigo: 'Art. 9º da Lei 9.249/1995 c/c Lei 12.973/2014',
      basePL: 0,
      jcpCalculado: 0,
      irrfRetido: 0,
      observacao: 'PL negativo ou zero — JCP não pode ser calculado'
    };
  }

  // JCP = PL × TJLP (limitado a 50% do lucro líquido do exercício ou 50% dos lucros acumulados)
  const jcpCalculado = Math.round(basePL * taxaTJLP * 100) / 100;
  const irrfRetido = Math.round(jcpCalculado * 0.15 * 100) / 100;

  let tratamento;
  switch (tipoBeneficiario) {
    case 'PJ_LUCRO_REAL':
    case 'PJ_LUCRO_PRESUMIDO':
      tratamento = 'Antecipação do IRPJ devido (Art. 726 §1º, I)';
      break;
    default:
      tratamento = 'Tributação definitiva (Art. 726 §1º, II)';
  }

  return {
    artigo: 'Art. 9º da Lei 9.249/1995 c/c Lei 12.973/2014, art. 9º (§§8º-12)',
    composicaoPL: {
      capitalSocial,
      reservasCapital,
      reservasLucros,
      acoesEmTesouraria: -acoesEmTesouraria,
      prejuizosAcumulados: -prejuizosAcumulados,
      basePL
    },
    taxaTJLP: `${(taxaTJLP * 100).toFixed(2)}% a.a.`,
    jcpCalculado,
    limites: {
      nota: 'JCP limitado a 50% do lucro líquido do exercício OU 50% dos lucros acumulados e reservas de lucros (o maior) — validar externamente',
      referencia: 'Art. 9º, §1º da Lei 9.249/1995'
    },
    irrfRetido,
    aliquotaIRRF: '15%',
    jcpLiquido: Math.round((jcpCalculado - irrfRetido) * 100) / 100,
    tipoBeneficiario,
    tratamento,
    deducaoIRPJ: 'JCP é DESPESA DEDUTÍVEL do lucro real e da base da CSLL (Art. 9º, §11)',
    codigoDARF: '5706',
    impactoFiscal: {
      deducaoLucroReal: jcpCalculado,
      economiaIRPJ: Math.round(jcpCalculado * 0.25 * 100) / 100,  // 15% + 10% adicional (simplificado)
      economiaCSLL: Math.round(jcpCalculado * 0.09 * 100) / 100,
      economiaTotal: Math.round(jcpCalculado * 0.34 * 100) / 100,
      custoIRRF: irrfRetido,
      beneficioLiquido: Math.round((jcpCalculado * 0.34 - irrfRetido) * 100) / 100,
      nota: 'Benefício líquido = economia tributária (34%) - custo IRRF retido (15%)'
    }
  };
}

/**
 * 12. Analisar impacto dos ajustes da Lei 12.973 na compensação de retenções
 *
 * Consolida como os diversos ajustes da Lei 12.973 (valor justo, goodwill,
 * mais/menos-valia, subvenções, pré-operacionais) afetam o lucro real
 * e, consequentemente, o saldo de compensação de retenções sofridas.
 *
 * @param {Object} params
 * @param {number} params.lucroRealAntes - Lucro real ANTES dos ajustes Lei 12.973
 * @param {Object} [params.ajustes] - Ajustes da Lei 12.973
 * @param {number} [params.ajustes.ganhoValorJusto=0] - Ganho diferido por subconta (Art. 13)
 * @param {number} [params.ajustes.perdaValorJusto=0] - Perda diferida por subconta (Art. 14)
 * @param {number} [params.ajustes.amortizacaoGoodwill=0] - Goodwill amortizado no período (Art. 22, 1/60 avos)
 * @param {number} [params.ajustes.maisValiaRealizada=0] - Mais-valia realizada por depreciação (Art. 20)
 * @param {number} [params.ajustes.menosValiaRealizada=0] - Menos-valia realizada (Art. 21)
 * @param {number} [params.ajustes.subvencaoExcluida=0] - Subvenção excluída (Art. 30 — até 2023)
 * @param {number} [params.ajustes.despPreOperacional=0] - Amortização de desp. pré-operacionais (Art. 11)
 * @param {number} [params.ajustes.ajusteValorPresente=0] - AVP realizado no período (Arts. 4-5)
 * @param {number} [params.ajustes.jcpDeduzido=0] - JCP deduzido (Art. 9º Lei 9.249)
 * @param {Object} params.retencoesSofridas - { irrf, pis, cofins, csll }
 * @returns {Object} Impacto na compensação
 */
function analisarImpactoLei12973(params) {
  const {
    lucroRealAntes,
    ajustes = {},
    retencoesSofridas
  } = params;

  const {
    ganhoValorJusto = 0,
    perdaValorJusto = 0,
    amortizacaoGoodwill = 0,
    maisValiaRealizada = 0,
    menosValiaRealizada = 0,
    subvencaoExcluida = 0,
    despPreOperacional = 0,
    ajusteValorPresente = 0,
    jcpDeduzido = 0
  } = ajustes;

  // Cálculo do impacto no lucro real
  const exclusoes = amortizacaoGoodwill + subvencaoExcluida + despPreOperacional + jcpDeduzido + ganhoValorJusto;
  const adicoes = perdaValorJusto + menosValiaRealizada;
  const realizacoes = maisValiaRealizada + ajusteValorPresente; // podem ser adição ou exclusão

  const lucroRealDepois = lucroRealAntes - exclusoes + adicoes + realizacoes;

  // IRPJ sobre lucro real (15% + 10% adicional sobre excedente de R$ 20.000/mês = R$ 60.000/tri)
  const irpjBase = Math.max(lucroRealDepois, 0) * 0.15;
  const irpjAdicional = Math.max(lucroRealDepois - 60000, 0) * 0.10; // trimestral
  const irpjDevido = Math.round((irpjBase + irpjAdicional) * 100) / 100;

  // CSLL 9%
  const csllDevida = Math.round(Math.max(lucroRealDepois, 0) * 0.09 * 100) / 100;

  // Total tributos devidos (simplificado — sem PIS/COFINS para este cálculo)
  const totalRetencoesSofridas = (retencoesSofridas.irrf || 0) + (retencoesSofridas.pis || 0) +
    (retencoesSofridas.cofins || 0) + (retencoesSofridas.csll || 0);

  const irrfCompensavel = Math.min(retencoesSofridas.irrf || 0, irpjDevido);
  const csllCompensavel = Math.min(retencoesSofridas.csll || 0, csllDevida);

  const irpjARecolher = Math.round((irpjDevido - irrfCompensavel) * 100) / 100;
  const csllARecolher = Math.round((csllDevida - csllCompensavel) * 100) / 100;

  const saldoCredorIRRF = Math.round(((retencoesSofridas.irrf || 0) - irrfCompensavel) * 100) / 100;
  const saldoCredorCSLL = Math.round(((retencoesSofridas.csll || 0) - csllCompensavel) * 100) / 100;

  return {
    descricao: 'Análise de impacto dos ajustes Lei 12.973 na compensação de retenções',
    baseLegal: 'Lei 12.973/2014 — Arts. 4-5, 11, 13-14, 20-22, 30',

    lucroReal: {
      antes: lucroRealAntes,
      ajustesLei12973: {
        exclusoes: {
          goodwill: -amortizacaoGoodwill,
          subvencao: -subvencaoExcluida,
          despPreOperacional: -despPreOperacional,
          jcp: -jcpDeduzido,
          ganhoValorJustoDiferido: -ganhoValorJusto,
          totalExclusoes: -exclusoes
        },
        adicoes: {
          perdaValorJusto: +perdaValorJusto,
          menosValia: +menosValiaRealizada,
          totalAdicoes: +adicoes
        },
        realizacoes: {
          maisValia: +maisValiaRealizada,
          ajusteValorPresente: +ajusteValorPresente,
          totalRealizacoes: +realizacoes
        },
        impactoLiquido: Math.round((-exclusoes + adicoes + realizacoes) * 100) / 100
      },
      depois: Math.round(lucroRealDepois * 100) / 100
    },

    tributosDevidos: {
      irpj: irpjDevido,
      irpjBase: Math.round(irpjBase * 100) / 100,
      irpjAdicional: Math.round(irpjAdicional * 100) / 100,
      csll: csllDevida,
      total: Math.round((irpjDevido + csllDevida) * 100) / 100
    },

    compensacao: {
      retencoesSofridas: {
        irrf: retencoesSofridas.irrf || 0,
        pis: retencoesSofridas.pis || 0,
        cofins: retencoesSofridas.cofins || 0,
        csll: retencoesSofridas.csll || 0,
        total: Math.round(totalRetencoesSofridas * 100) / 100
      },
      irrfCompensado: irrfCompensavel,
      csllCompensada: csllCompensavel,
      irpjARecolher,
      csllARecolher,
      saldoCredor: {
        irrf: saldoCredorIRRF,
        csll: saldoCredorCSLL,
        total: Math.round((saldoCredorIRRF + saldoCredorCSLL) * 100) / 100,
        destinacao: (saldoCredorIRRF + saldoCredorCSLL) > 0
          ? 'Saldo credor pode ser compensado via PER/DCOMP ou pedido de restituição'
          : 'Sem saldo credor'
      }
    },

    analise: {
      impactoGoodwill: amortizacaoGoodwill > 0
        ? `Goodwill de R$ ${amortizacaoGoodwill.toFixed(2)} excluído do lucro real → reduz IRPJ/CSLL devidos → pode gerar saldo credor de retenções`
        : 'Sem impacto de goodwill',
      impactoJCP: jcpDeduzido > 0
        ? `JCP de R$ ${jcpDeduzido.toFixed(2)} deduzido → economia fiscal estimada de R$ ${(jcpDeduzido * 0.34).toFixed(2)} (34%)`
        : 'Sem JCP deduzido',
      impactoValorJusto: (ganhoValorJusto > 0 || perdaValorJusto > 0)
        ? `Ganho diferido R$ ${ganhoValorJusto.toFixed(2)} / Perda adicionada R$ ${perdaValorJusto.toFixed(2)} — ajustes afetam timing da compensação`
        : 'Sem ajustes de valor justo'
    }
  };
}

/**
 * 13. Calcular receita bruta conforme Art. 12 do DL 1.598 (redação Lei 12.973)
 *
 * @param {Object} params
 * @param {number} [params.vendaBens=0] - Inciso I: produto da venda de bens (conta própria)
 * @param {number} [params.prestacaoServicos=0] - Inciso II: preço da prestação de serviços
 * @param {number} [params.contaAlheia=0] - Inciso III: resultado de operações de conta alheia
 * @param {number} [params.outrasReceitas=0] - Inciso IV: receitas da atividade principal não em I-III
 * @param {number} [params.devolucoes=0] - Devoluções e vendas canceladas
 * @param {number} [params.descontosIncondicionais=0] - Descontos concedidos incondicionalmente
 * @param {number} [params.tributosIncidentes=0] - Tributos sobre a receita
 * @param {number} [params.ajusteValorPresente=0] - Ajuste a valor presente (Art. 183, VIII, Lei 6.404)
 * @returns {Object} Receita bruta e líquida conforme Lei 12.973
 */
function calcularReceitaBrutaLei12973(params) {
  const {
    vendaBens = 0,
    prestacaoServicos = 0,
    contaAlheia = 0,
    outrasReceitas = 0,
    devolucoes = 0,
    descontosIncondicionais = 0,
    tributosIncidentes = 0,
    ajusteValorPresente = 0
  } = params;

  const receitaBruta = vendaBens + prestacaoServicos + contaAlheia + outrasReceitas;
  const receitaLiquida = receitaBruta - devolucoes - descontosIncondicionais - tributosIncidentes - ajusteValorPresente;

  // Base para presunção do lucro (usado em retenções Adm. Pública)
  const basePresuncaoServicos = receitaBruta - devolucoes - descontosIncondicionais;

  return {
    artigo: 'Art. 12 do DL 1.598/1977 (redação Lei 12.973/2014, art. 2º)',
    composicao: {
      I_vendaBens: vendaBens,
      II_prestacaoServicos: prestacaoServicos,
      III_contaAlheia: contaAlheia,
      IV_outrasReceitas: outrasReceitas
    },
    receitaBruta,
    deducoes: {
      I_devolucoes: devolucoes,
      II_descontosIncondicionais: descontosIncondicionais,
      III_tributosIncidentes: tributosIncidentes,
      IV_ajusteValorPresente: ajusteValorPresente,
      totalDeducoes: devolucoes + descontosIncondicionais + tributosIncidentes + ajusteValorPresente
    },
    receitaLiquida: Math.round(receitaLiquida * 100) / 100,
    basePresuncao: {
      descricao: 'Base para cálculo da presunção de lucro (Art. 15 Lei 9.249 c/c Art. 12 DL 1.598)',
      valor: Math.round(basePresuncaoServicos * 100) / 100,
      nota: 'Receita bruta (-) devoluções (-) descontos incondicionais — SEM deduzir tributos e AVP'
    },
    impactoRetencao: {
      irrfAdmPublica_servicos: Math.round(basePresuncaoServicos * 0.32 * 0.15 * 100) / 100,
      csrf_total: Math.round(basePresuncaoServicos * 0.0465 * 100) / 100,
      nota: 'IRRF Adm. Pública = 15% × 32% × base presunção; CSRF = 4,65% × base presunção'
    },
    relevanciaAGROGEO: 'Receita bruta da AGROGEO = preço dos serviços (inciso II) de georreferenciamento, CAR, PRA, LAR, topografia, defesa ambiental'
  };
}

// ============================================================================
// EXPORTS
// ============================================================================


// ============================================================================
// EXEMPLOS DE USO
// ============================================================================


// ============================================================================
// EXPORTS — MÓDULO UNIFICADO v4.6
// ============================================================================

module.exports = {
  // --- Constantes e Tabelas ---
  ADICOES,
  ALIQUOTAS,
  AREA_SUDAM,
  AREA_SUDENE,
  ATIVIDADE_RURAL,
  BASE_NEGATIVA_CSLL,
  COMPENSACAO_GERAL,
  CONSTANTES,
  CSRF,
  DEPRECIACAO,
  DEPRECIACAO_ACELERADA_INCENTIVADA,
  DEPRECIACAO_FISCAL,
  DESPESAS_COM_LIMITES,
  DESPESAS_CONDICIONAIS,
  DESPESAS_FINANCEIRAS,
  DESPESAS_INDEDUTIVEIS,
  DIVIDENDOS,
  EXCLUSOES,
  EXCLUSOES_LUCRO_EXPLORACAO,
  INCENTIVOS_FISCAIS,
  INCENTIVO_REDUCAO_75,
  INDICADORES_OMISSAO,
  IRRF_ADMINISTRACAO_PUBLICA,
  IRRF_ASSESSORIA_CREDITO,
  IRRF_BENEFICIARIO_NAO_IDENTIFICADO,
  IRRF_COMISSOES_REPRESENTACAO,
  IRRF_COOPERATIVAS,
  IRRF_DECISAO_JUDICIAL,
  IRRF_JCP,
  IRRF_MULTAS_RESCISAO,
  IRRF_SERVICOS_LIMPEZA_SEGURANCA,
  IRRF_SERVICOS_PROFISSIONAIS,
  ISS_RETIDO,
  LEI_12973,
  LIMITES_PDD_ANTIGOS,
  LIMITES_PDD_ATUAIS,
  LIMITES_ROYALTIES_ASSISTENCIA,
  LIMITE_ATIVO_DESPESA,
  LIMITE_GLOBAL_INCENTIVOS,
  MEP_REGRAS,
  METODOS_ESTOQUE,
  OBRIGACOES_ACESSORIAS,
  OPERACOES_EXTERIOR,
  PREJUIZOS_NAO_OPERACIONAIS,
  PRESUNCOES,
  PROVISOES,
  REINVESTIMENTO_30,
  RETENCOES_ADM_PUBLICA_UNIFICADA,
  SETORES_PRIORITARIOS_SUDAM,
  SUBCAPITALIZACAO,
  TABELAS_IRPF,
  TIPOS_GARANTIA,
  VALOR_JUSTO,
  VARIACAO_CAMBIAL,
  VEDACOES,

  // --- Funções de Cálculo ---
  analisarDedutibilidade,
  analisarEncargosFinanceirosVencidos,
  analisarImpactoLei12973,
  analisarLeasing,
  analisarParticipacoesSOcietarias,
  analisarValorJusto,
  arvoreDecisaoOtimizacao,
  avaliarEstoqueSemCustoIntegrado,
  calcularAmortizacao,
  calcularAmortizacaoGoodwill,
  calcularCSLL,
  calcularCSRF,
  calcularCustoAquisicao,
  calcularDepreciacao,
  calcularDepreciacaoCompleta,
  calcularDespesasPreOperacionais,
  calcularEstimativaAtividadesDiversificadas,
  calcularEstimativaMensal,
  calcularExaustao,
  calcularFolhaPagamento,
  calcularIRPJLucroReal,
  calcularIRRFAdmPublica,
  calcularIRRFJCP,
  calcularIRRFPessoaFisica,
  calcularIRRFServicoPJ,
  calcularIncentivos,
  calcularJCP,
  calcularJCPLei12973,
  calcularLimiteDoacoes,
  calcularLimitePrevidenciaComplementar,
  calcularLimiteRoyaltiesAssistencia,
  calcularLucroExploracao,
  calcularLucroRealAjustado,
  calcularLucrosExterior,
  calcularPDD,
  calcularPISCOFINSNaoCumulativo,
  calcularProporcaoIncentivada,
  calcularProvisoesTrabalhistas,
  calcularReceitaBrutaLei12973,
  calcularReducao75IRPJ,
  calcularReinvestimento30,
  calcularRetencaoIntegrada,
  calcularSaldoNegativo,
  calcularSuspensaoReducao,
  compararSimplesVsLucroRealSUDAM,
  compensarBaseNegativaCSLL,
  compensarIntegrado,
  compensarPrejuizo,
  compensarPrejuizoFiscal,
  compensarPrejuizoNaoOperacional,
  compensarRetencoes,
  gerarMapaEconomia,
  gerarRelatorioA,
  gerarRelatorioConsolidado,
  gerarRelatorioD2,
  gerarRelatorioE,
  gerarRelatorioG,
  recomendarRegime,
  registrarPrejuizoParteB,
  registrarUtilizacaoParteB,
  simularCompensacaoPluranual,
  simularIncentivosRegionais,
  simularLucroRealCompleto,
  simularRegimeCambial,
  simularRetencoesAnuais,
  verificarCompliance,
  verificarElegibilidade,
  verificarObrigatoriedadeLucroReal,
  verificarOmissaoReceita,
  verificarSubcapitalizacao,
  verificarVedacoes,
};
