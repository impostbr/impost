/**
 * ══════════════════════════════════════════════════════════════════════════════
 * MOTOR DE CÁLCULO FISCAL — LUCRO PRESUMIDO
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * AGROGEO BRASIL - Geotecnologia e Consultoria Ambiental
 * Autor: Luis Fernando | Proprietário AGROGEO BRASIL
 * Versão: 3.4.1
 * Data: Fevereiro/2026
 *
 * Changelog v3.4.1:
 *   - Validação de entrada em simulacaoRapida() e calcularAnualConsolidado()
 *   - Disclaimer jurídico aprimorado no rodapé do PDF (referências legais explícitas)
 * Localização: Novo Progresso, Pará (Amazônia Legal - SUDAM)
 *
 * Changelog v3.4.0:
 *   - SEÇÃO 14A: Base Legal Complementar — 18 leis/normas detalhadas
 *   - Lei 9.718/1998: VEDACOES_LP_DETALHADAS (Art. 14, I-VIII), PIS/COFINS Arts. 2º e 3º
 *   - Lei 12.814/2013: Referência correta do limite R$ 78M
 *   - Lei 10.684/2003: CSLL 32% para serviços (Art. 22)
 *   - Lei 11.727/2008: REQUISITOS_HOSPITALAR_8PCT com serviços abrangidos/não abrangidos
 *   - IN RFB 1.700/2017: REGULAMENTACAO_IN_RFB (distribuição lucros, regime caixa, atividades mistas)
 *   - DL 1.598/1977: CONCEITO_RECEITA_BRUTA (Art. 12, redação Lei 12.973/2014)
 *   - Lei 9.430/1996: REGRAS_ESPECIFICAS_LP_9430 (Arts. 51-54, Art. 26)
 *   - RIR/2018: MAPA_RIR_2018_LP (artigos consolidados do LP)
 *   - Lei 7.689/1988: Histórico alíquota CSLL
 *   - Lei 12.973/2014: ALTERACOES_LEI_12973_2014 (impactos no LP)
 *   - MULTAS_E_PENALIDADES: consolidação (Lei 9.430/96, Arts. 44 e 61)
 *   - RETENCOES_FONTE_LP: IRRF, CSRF, CSLL Adm. Pública completos
 *   - COMPENSACAO_TRIBUTARIA: PER/DCOMP, vedações, DARF mínimo
 *   - LC 116/2003: ISS_DETALHAMENTO (alíquotas, local incidência)
 *   - CSLL_ALIQUOTAS_POR_SETOR: diferenciação financeiras vs regra geral
 *   - Lei 8.212/1991: INSS_PATRONAL_DETALHAMENTO (Art. 22)
 *   - TABELA_IRRF_SERVICOS_PJ: retenções fonte entre PJs
 *   - TRANSICOES: PRESUMIDO_PARA_REAL e REAL_PARA_PRESUMIDO
 *   - Impedimentos: securitização (Lei 14.430/2022) e SCP sócio ostensivo LR
 *
 * Changelog v3.3.0 (versão final):
 *   - ETAPA 4: (removido comparativo LR — ferramenta exclusiva LP)
 *   - ETAPA 4: gerarCalendarioTributario() — Calendário tributário 12 meses × tributos
 *   - ETAPA 4: Retenções CSRF: CODIGOS_DARF_RETENCAO, ALIQUOTAS_CSRF, saldo PER/DCOMP
 *   - ETAPA 4: calcularPISCOFINSMensal() atualizado com CSRF e indicação PER/DCOMP
 *   - ETAPA 4: Fix ECF prazo: "31 de maio" → "Último dia útil de julho" (IN RFB 1.422/2013, Art. 3º)
 *   - ETAPA 4: Fix EFD-Contribuições prazo: "15º dia útil" → "10º dia útil" (IN RFB 1.252/2012, Art. 7º)
 *   - ETAPA 4: Adicionada EFD-Reinf: mensal, dia 15 do mês seguinte (IN RFB 2.043/2021)
 *   - ETAPA 4: DIRF com alerta "substituída por EFD-Reinf + eSocial a partir de 2025"
 *   - ETAPA 4: UI: foco exclusivo em otimização dentro do Lucro Presumido
 *   - ETAPA 4: UI: aba Calendário Tributário (tabela 12 meses × tributos)
 *
 * Changelog v3.0.0:
 *   - ETAPA 1: Constantes atualizadas para 2026 (SM, INSS, IRPF, LC 224/2025, JCP)
 *   - ETAPA 1: 14 categorias de atividade (6 novas + reestruturação)
 *   - ETAPA 1: Campos irpjMajorado/csllMajorada (LC 224/2025 +10%) em todas as categorias
 *   - ETAPA 1: Removida aba "Comparativo" (ferramenta exclusiva LP)
 *   - ETAPA 1: Tabela IRPF 2026 com redutor Lei 15.270/2025
 *   - ETAPA 2: calcularBasePresumidaLC224() — acréscimo 10% com faixa R$5M e vigência
 *   - ETAPA 2: Integração LC 224 no fluxo trimestral e consolidado anual
 *   - ETAPA 2: getAliquotaIRRFJCP() — 15% até 31/03, 17.5% a partir de 01/04/2026
 *   - ETAPA 2: calcularIRPFProLabore2026() — tabela progressiva + redutor Lei 15.270
 *   - ETAPA 2: calcularINSSSocio() e calcularINSSPatronal()
 *   - ETAPA 2: Fix distribuição lucros isentos (IN RFB 1.700/2017, Art. 238)
 *   - ETAPA 2: Fix adicional IRPJ trimestral (RIR/2018, Art. 624)
 *   - ETAPA 3: simularProLaboreOtimo() — Simulador de pró-labore ótimo por sócio
 *   - ETAPA 3: simularJCP() — Simulador de JCP com comparativo 3 vias
 *   - ETAPA 3: simularRegimeCaixa() — Caixa vs Competência (PIS/COFINS + IRPJ/CSLL)
 *   - ETAPA 3: calcularBeneficioECD() — Escrituração completa e distribuição ampliada
 *   - ETAPA 3: UI com abas Pró-Labore Ótimo, JCP/ECD, Caixa vs Competência
 *
 * Changelog v2.1.0:
 *   - Fix: _formatarMoeda protegida contra undefined/NaN
 *   - Fix: PDF INSS Composição exibia "R$ NaN" (composicao são strings de %)
 *   - Fix: PDF ISS normaliza alíquota (aceita tanto decimal 0.03 quanto inteiro 3)
 *   - Fix: Calendário PDF indica qual trimestre referencia cada vencimento IRPJ
 *   - Melhoria: Nota sobre lucro distribuível trimestral parcial (sem PIS/COFINS)
 *   - Confirmado: ESC CSLL 38,4% correto conforme LC 167/2019, Art. 12
 *
 * Base Legal:
 *   - Decreto 9.580/2018 (RIR/2018) — Arts. 587 a 601
 *   - Lei 9.249/1995 — Arts. 15 e 20
 *   - Lei 9.430/1996 — Arts. 1º, 25 e 26
 *   - Lei 9.718/1998 — Arts. 12 e 13
 *   - Lei 10.637/2002 (PIS) e Lei 10.833/2003 (COFINS)
 *   - Lei 12.973/2014
 *   - IN RFB 1.700/2017
 *   - LC 224/2025 — Acréscimo 10% presunção; JCP 17,5%
 *   - LC 167/2019 — ESC 38,4%
 *   - Lei 15.270/2025 — Reforma IRPF (isenção até R$ 5.000)
 *   - Portaria MPS/MF 13/2026 — Valores INSS/SM 2026
 *
 * ══════════════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 1: CONSTANTES LEGAIS E TABELAS DE REFERÊNCIA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Limite máximo de receita bruta anual para elegibilidade ao Lucro Presumido.
 * Base Legal: Lei 9.718/1998, Art. 13 e RIR/2018, Art. 587.
 */
const LIMITE_RECEITA_BRUTA_ANUAL = 78_000_000.00;

/**
 * Limite mensal proporcional (para empresas com menos de 12 meses de atividade).
 * Base Legal: RIR/2018, Art. 587.
 */
const LIMITE_RECEITA_BRUTA_MENSAL = 6_500_000.00;

/**
 * Alíquota normal do IRPJ.
 * Base Legal: Lei 9.249/1995, Art. 3º.
 */
const ALIQUOTA_IRPJ = 0.15;

/**
 * Alíquota do adicional de IRPJ.
 * Incide sobre a parcela do lucro presumido que exceder R$ 20.000/mês (R$ 60.000/trimestre).
 * Base Legal: RIR/2018, Art. 624.
 */
const ALIQUOTA_ADICIONAL_IRPJ = 0.10;

/**
 * Limite trimestral para incidência do adicional de IRPJ.
 * R$ 20.000,00 × 3 meses = R$ 60.000,00.
 */
const LIMITE_ADICIONAL_TRIMESTRAL = 60_000.00;

/**
 * Limite mensal para incidência do adicional de IRPJ.
 */
const LIMITE_ADICIONAL_MENSAL = 20_000.00;

/**
 * Alíquota da CSLL (Contribuição Social sobre o Lucro Líquido).
 * Base Legal: Lei 9.249/1995, Art. 20.
 * Nota: Não há adicional de CSLL.
 */
const ALIQUOTA_CSLL = 0.09;

/**
 * Alíquota do PIS no regime cumulativo (Lucro Presumido).
 * Base Legal: Lei 10.637/2002.
 */
const ALIQUOTA_PIS_CUMULATIVO = 0.0065;

/**
 * Alíquota do COFINS no regime cumulativo (Lucro Presumido).
 * Base Legal: Lei 10.833/2003.
 */
const ALIQUOTA_COFINS_CUMULATIVO = 0.03;

/**
 * Alíquota patronal do INSS (mesma em todos os regimes).
 */
const ALIQUOTA_INSS_PATRONAL = 0.20;

// ── Constantes 2026 (Portaria MPS/MF 13/2026) ──

const SALARIO_MINIMO_2026 = 1621.00;
const TETO_INSS_2026 = 8475.55;
const INSS_PATRONAL_ALIQUOTA = 0.20;           // 20% sem teto
const INSS_CONTRIBUINTE_INDIVIDUAL = 0.11;      // 11% limitado ao teto

// ── IRPF 2026 — Tabela progressiva mensal ──

const TABELA_IRPF_2026 = [
  { limite: 2428.80,   aliquota: 0,     deducao: 0 },
  { limite: 2826.65,   aliquota: 0.075, deducao: 182.16 },
  { limite: 3751.05,   aliquota: 0.15,  deducao: 394.16 },
  { limite: 4664.68,   aliquota: 0.225, deducao: 675.49 },
  { limite: Infinity,  aliquota: 0.275, deducao: 908.73 }
];

// ── IRPF 2026 — Redutor adicional (Lei 15.270/2025) ──

const REDUTOR_IRPF_2026 = {
  limiteIsencaoTotal: 5000.00,       // Até R$ 5.000: IR zerado
  limiteReducaoParcial: 7350.00,     // Até R$ 7.350: redução parcial
  valorReducao: 978.62,              // Constante da fórmula
  coeficienteReducao: 0.133145       // Multiplicador da fórmula
};

const DEDUCAO_DEPENDENTE_IRPF = 189.59;
const DESCONTO_SIMPLIFICADO_IRPF = 607.20;

// ── JCP — LC 224/2025, Art. 8º ──

const ALIQUOTA_IRRF_JCP_ANTIGA = 0.15;          // Até 31/03/2026
const ALIQUOTA_IRRF_JCP_NOVA = 0.175;           // A partir de 01/04/2026
const DATA_VIGENCIA_JCP_NOVA = new Date(2026, 3, 1); // 01/04/2026

// ── LC 224/2025 — Acréscimo 10% nos percentuais de presunção ──

const LC224_DATA_VIGENCIA = new Date(2026, 3, 1);    // 01/04/2026
const LC224_LIMITE_ISENCAO_ANUAL = 5_000_000.00;
const LC224_ACRESCIMO = 0.10;                         // 10% sobre o percentual

// ── ISS (LC 116/2003) ──

const ISS_MINIMO = 0.02;
const ISS_MAXIMO = 0.05;

// ── Limite LP (Lei 9.430/96, Art. 13) ──

const LIMITE_RECEITA_LP = 78_000_000.00;

// ── Retenções CSRF (Lei 10.833/2003, Arts. 30-35) ──

const LIMITE_DISPENSA_CSRF = 5000.00;
const ALIQUOTA_CSRF_TOTAL = 0.0465;

const CODIGOS_DARF_RETENCAO = {
  IRRF_SERVICOS: '1708',
  CSRF_UNIFICADA: '5952'
};

const ALIQUOTAS_CSRF = {
  PIS: 0.0065,
  COFINS: 0.03,
  CSLL: 0.01,
  TOTAL: 0.0465
};

// ── ESC (LC 167/2019) ──

const LIMITE_RECEITA_ESC = 4_800_000.00;


// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 1A: LC 224/2025 — FUNÇÕES DE CÁLCULO COM ACRÉSCIMO DE 10%
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula a base presumida considerando a LC 224/2025.
 *
 * REGRAS:
 * 1. VIGÊNCIA: Só se aplica a partir de 01/04/2026 (2º trimestre).
 *    1º Trimestre 2026 = percentuais ANTIGOS.
 * 2. FAIXA DE ISENÇÃO: Receita anual ≤ R$ 5.000.000 → NENHUMA alteração.
 *    Apenas a PARCELA EXCEDENTE recebe acréscimo.
 * 3. PROPORCIONALIZAÇÃO: Limite trimestral = R$ 5M ÷ 4 = R$ 1.250.000.
 *    Ajuste acumulado permitido.
 * 4. ACRÉSCIMO: É 10% SOBRE o percentual (não pontos).
 *    Ex: 32% × 1.10 = 35.2%, NÃO 42%.
 * 5. ATIVIDADES MISTAS: Se empresa tem comércio + serviço, acréscimo proporcional
 *    a cada atividade.
 *
 * Base Legal: LC 224/2025, Art. 4º, §4º, VII; §5º; Art. 14, I, "a".
 *
 * @param {Object} params
 * @param {number} params.receitaBrutaTrimestral - Receita bruta do trimestre atual
 * @param {number} params.receitaBrutaAcumuladaAnoAte - Receita acumulada no ano ATÉ o fim deste trimestre
 * @param {number} params.percentualPresuncaoOriginal - Ex: 0.32 para serviços
 * @param {number} params.trimestreAtual - 1, 2, 3 ou 4
 * @param {number} params.anoCalendario - Ex: 2026
 * @returns {Object} Resultado com base presumida bifurcada e impacto da LC 224
 */
function calcularBasePresumidaLC224(params) {
  const {
    receitaBrutaTrimestral,
    receitaBrutaAcumuladaAnoAte,
    percentualPresuncaoOriginal,
    trimestreAtual,
    anoCalendario
  } = params;

  // REGRA 1: Verificar vigência
  // LC 224/2025, Art. 14, I, "a": primeiro dia do 4º mês após 26/12/2025 = 01/04/2026
  // IRPJ e CSLL: anterioridade nonagesimal (CF, art. 150, III, "c")
  const inicioTrimestre = new Date(anoCalendario, (trimestreAtual - 1) * 3, 1);

  if (inicioTrimestre < LC224_DATA_VIGENCIA) {
    return {
      basePresumida: receitaBrutaTrimestral * percentualPresuncaoOriginal,
      percentualOriginal: percentualPresuncaoOriginal,
      percentualMajorado: percentualPresuncaoOriginal * (1 + LC224_ACRESCIMO),
      dentroDoLimite: receitaBrutaTrimestral,
      excedenteDoTrimestre: 0,
      impactoLC224: 0,
      lc224Aplicavel: false
    };
  }

  // REGRA 2 e 3: Calcular parcela excedente com proporcionalização e ajuste acumulado
  const limiteProporcionalAcumulado = (LC224_LIMITE_ISENCAO_ANUAL / 4) * trimestreAtual;
  const limiteProporcionalAnterior = (LC224_LIMITE_ISENCAO_ANUAL / 4) * (trimestreAtual - 1);
  const receitaAcumuladaAnterior = receitaBrutaAcumuladaAnoAte - receitaBrutaTrimestral;

  // Excedente acumulado ATÉ o trimestre anterior (já processado)
  const excedenteAnterior = Math.max(0, receitaAcumuladaAnterior - limiteProporcionalAnterior);

  // Excedente acumulado ATÉ este trimestre (total)
  const excedenteAteAqui = Math.max(0, receitaBrutaAcumuladaAnoAte - limiteProporcionalAcumulado);

  // Excedente que pertence EXCLUSIVAMENTE a este trimestre
  // (desconta o que já foi processado em trimestres anteriores)
  const excedenteDoTrimestre = Math.max(0, Math.min(excedenteAteAqui - excedenteAnterior, receitaBrutaTrimestral));
  const dentroDoLimite = receitaBrutaTrimestral - excedenteDoTrimestre;

  // REGRA 4: Percentual majorado
  const percentualMajorado = percentualPresuncaoOriginal * (1 + LC224_ACRESCIMO);

  // Base presumida bifurcada
  const baseDentroDoLimite = dentroDoLimite * percentualPresuncaoOriginal;
  const baseExcedente = excedenteDoTrimestre * percentualMajorado;
  const basePresumidaTotal = baseDentroDoLimite + baseExcedente;

  // Impacto financeiro da LC 224 (quanto a mais na base)
  const impactoNaBase = excedenteDoTrimestre * (percentualMajorado - percentualPresuncaoOriginal);

  return {
    basePresumida: basePresumidaTotal,
    percentualOriginal: percentualPresuncaoOriginal,
    percentualMajorado: percentualMajorado,
    dentroDoLimite: dentroDoLimite,
    excedenteDoTrimestre: excedenteDoTrimestre,
    impactoLC224: impactoNaBase,
    lc224Aplicavel: excedenteDoTrimestre > 0
  };
}

/**
 * Retorna a alíquota de IRRF sobre JCP conforme vigência da LC 224/2025, Art. 8º.
 * - Antes de 01/04/2026: 15%
 * - A partir de 01/04/2026: 17,5%
 *
 * Base Legal: LC 224/2025, Art. 8º (altera Lei 9.249/95, Art. 9º, §2º).
 *
 * @param {Date} dataReferencia - Data de pagamento ou crédito do JCP
 * @returns {number} Alíquota decimal (0.15 ou 0.175)
 */
function getAliquotaIRRFJCP(dataReferencia) {
  return dataReferencia >= DATA_VIGENCIA_JCP_NOVA
    ? ALIQUOTA_IRRF_JCP_NOVA
    : ALIQUOTA_IRRF_JCP_ANTIGA;
}

/**
 * Calcula IRPF sobre pró-labore do sócio em 2026.
 * Inclui tabela progressiva de 5 faixas + REDUTOR ADICIONAL (Lei 15.270/2025).
 *
 * O redutor usa o RENDIMENTO BRUTO (proLabore), NÃO a base de cálculo.
 *
 * Base Legal: Lei 15.270/2025; Tabela progressiva mensal IRPF 2026.
 *
 * @param {number} proLabore - Valor bruto do pró-labore mensal
 * @param {number} inssDescontado - INSS retido do sócio
 * @param {number} numeroDependentes - Número de dependentes para dedução
 * @returns {Object} { baseCalculo, irCalculado, redutorAdicional, irFinal, aliquotaEfetiva }
 */
function calcularIRPFProLabore2026(proLabore, inssDescontado, numeroDependentes) {
  // Passo 1: Base de cálculo
  const deducaoDependentes = numeroDependentes * DEDUCAO_DEPENDENTE_IRPF;

  // Usar a MAIOR dedução entre (INSS + dependentes) ou desconto simplificado
  const deducoesCompletas = inssDescontado + deducaoDependentes;
  const deducaoEfetiva = Math.max(deducoesCompletas, DESCONTO_SIMPLIFICADO_IRPF);

  const baseCalculo = Math.max(0, proLabore - deducaoEfetiva);

  // Passo 2: Tabela progressiva
  let irCalculado = 0;
  for (const faixa of TABELA_IRPF_2026) {
    if (baseCalculo <= faixa.limite) {
      irCalculado = baseCalculo * faixa.aliquota - faixa.deducao;
      break;
    }
  }
  irCalculado = Math.max(0, irCalculado);

  // Passo 3: Redutor adicional (Lei 15.270/2025)
  // ATENÇÃO: O redutor usa o RENDIMENTO BRUTO (proLabore), não a base de cálculo
  let redutorAdicional = 0;
  if (proLabore <= REDUTOR_IRPF_2026.limiteIsencaoTotal) {
    redutorAdicional = irCalculado; // Zera o IR
  } else if (proLabore <= REDUTOR_IRPF_2026.limiteReducaoParcial) {
    redutorAdicional = Math.max(0,
      REDUTOR_IRPF_2026.valorReducao - (REDUTOR_IRPF_2026.coeficienteReducao * proLabore)
    );
    redutorAdicional = Math.min(redutorAdicional, irCalculado);
  }
  // Acima de R$ 7.350: sem redutor

  const irFinal = Math.max(0, irCalculado - redutorAdicional);

  return {
    baseCalculo: _arredondar(baseCalculo),
    irCalculado: _arredondar(irCalculado),
    redutorAdicional: _arredondar(redutorAdicional),
    irFinal: _arredondar(irFinal),
    aliquotaEfetiva: proLabore > 0 ? _arredondar(irFinal / proLabore, 4) : 0
  };
}

/**
 * Calcula INSS do sócio (contribuinte individual): 11% sobre pró-labore, limitado ao teto.
 * Base Legal: IN RFB 971/2009, Art. 57; Decreto 3.048/99, Art. 201.
 *
 * @param {number} proLabore - Valor bruto do pró-labore mensal
 * @returns {number} Valor do INSS retido
 */
function calcularINSSSocio(proLabore) {
  const base = Math.min(proLabore, TETO_INSS_2026);
  return _arredondar(base * INSS_CONTRIBUINTE_INDIVIDUAL);
}

/**
 * Calcula INSS Patronal: 20% sobre total do pró-labore (SEM TETO).
 * Base Legal: Lei 8.212/91, Art. 22, III.
 *
 * @param {number} proLabore - Valor bruto do pró-labore mensal
 * @returns {number} Valor do INSS patronal
 */
function calcularINSSPatronal(proLabore) {
  return _arredondar(proLabore * INSS_PATRONAL_ALIQUOTA);
}


// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 2: TABELAS DE PERCENTUAIS DE PRESUNÇÃO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tabela completa de percentuais de presunção do IRPJ por atividade.
 * Base Legal: Lei 9.249/1995, Art. 15 e seus parágrafos.
 *
 * Cada entrada contém:
 *   - id:              Identificador único da atividade
 *   - descricao:       Descrição da atividade
 *   - percentual:      Percentual de presunção do IRPJ (decimal)
 *   - irpjMajorado:    Percentual com acréscimo de 10% da LC 224/2025
 *   - baseLegal:       Referência legal
 *   - cnaes:           Lista de CNAEs típicos (não exaustiva)
 *   - observacoes:     Notas adicionais
 *   - temRequisitos:   (opcional) Se há requisitos cumulativos para o percentual reduzido
 *   - requisitos:      (opcional) Lista de requisitos
 *   - alertaSeFalhar:  (opcional) Alerta se requisitos não atendidos
 */
const PERCENTUAIS_PRESUNCAO_IRPJ = [
  {
    id: 'combustivel',
    descricao: 'Revenda a varejo de combustível derivado de petróleo, álcool etílico carburante e gás natural',
    percentual: 0.016,
    irpjMajorado: 0.0176,
    baseLegal: 'Lei 9.249/95, Art. 15, §1º, I',
    cnaes: ['47.31-8'],
    observacoes: 'Exclusivamente revenda a varejo. Não se aplica a distribuição ou transporte.'
  },
  {
    id: 'comercio_geral',
    descricao: 'Venda de mercadorias e produtos (comércio em geral)',
    percentual: 0.08,
    irpjMajorado: 0.088,
    baseLegal: 'Lei 9.249/95, Art. 15, caput',
    cnaes: ['47.*', '46.*'],
    observacoes: 'Regra geral para comércio. Indústria e transporte de cargas são categorias separadas.'
  },
  {
    id: 'industria',
    descricao: 'Indústria (transformação, beneficiamento)',
    percentual: 0.08,
    irpjMajorado: 0.088,
    baseLegal: 'Lei 9.249/95, Art. 15, caput — regra geral de 8%',
    cnaes: ['10.*', '11.*', '12.*', '13.*', '14.*', '15.*', '16.*', '17.*', '18.*', '19.*', '20.*', '21.*', '22.*', '23.*', '24.*', '25.*', '26.*', '27.*', '28.*', '29.*', '30.*', '31.*', '32.*', '33.*'],
    observacoes: 'Transformação de matéria-prima. CNAEs 10.xx a 33.xx.'
  },
  {
    id: 'imobiliaria_venda',
    descricao: 'Atividade Imobiliária — Venda/Loteamento/Incorporação',
    percentual: 0.08,
    irpjMajorado: 0.088,
    baseLegal: 'Lei 9.249/95, Art. 15, caput — regra geral de 8%',
    cnaes: ['41.10-7', '68.10-2/01'],
    observacoes: 'Venda de imóveis próprios, loteamento, incorporação imobiliária. CNAEs 41.10, 68.10-2/01.'
  },
  {
    id: 'construcao_com_material',
    descricao: 'Construção — Empreitada com TODOS os materiais',
    percentual: 0.08,
    irpjMajorado: 0.088,
    baseLegal: 'IN RFB 1.700/2017, Art. 33, §4º',
    cnaes: ['41.20-4', '42.*'],
    observacoes: 'SOMENTE quando o contrato prevê fornecimento de TODOS os materiais indispensáveis. Se parcial → usar 32% (construcao_sem_material).'
  },
  {
    id: 'transporte_cargas',
    descricao: 'Transporte de Cargas',
    percentual: 0.08,
    irpjMajorado: 0.088,
    baseLegal: 'Lei 9.249/95, Art. 15, caput — regra geral de 8%',
    cnaes: ['49.30-2'],
    observacoes: 'Transporte de carga (qualquer modal). NÃO confundir com transporte de passageiros (16%). CNAE 49.30-2.'
  },
  {
    id: 'hospitalar_reduzido',
    descricao: 'Serviços Hospitalares e Auxílio Diagnóstico (8%)',
    percentual: 0.08,
    irpjMajorado: 0.088,
    baseLegal: 'Lei 9.249/95, Art. 15, §1º, III, "a"; Lei 11.727/2008, Art. 29',
    cnaes: ['86.*'],
    observacoes: 'REQUISITOS CUMULATIVOS: (1) Sociedade empresária (LTDA ou S/A — NÃO pode ser sociedade simples); (2) Atender normas ANVISA. Se NÃO atender AMBOS os requisitos → cai para 32% (serviços gerais). CNAE 86.xx.',
    temRequisitos: true,
    requisitos: ['Sociedade empresária registrada na Junta Comercial', 'Cumprimento de normas ANVISA'],
    alertaSeFalhar: 'Sem atender os requisitos cumulativos, a presunção sobe de 8% para 32% (IRPJ) e de 12% para 32% (CSLL).'
  },
  {
    id: 'transporte_passageiros',
    descricao: 'Prestação de serviços de transporte de passageiros',
    percentual: 0.16,
    irpjMajorado: 0.176,
    baseLegal: 'Lei 9.249/95, Art. 15, §1º, II, a',
    cnaes: ['49.21-3', '49.22-1', '49.29-9', '50.11-4', '50.12-2', '51.11-1'],
    observacoes: 'Transporte de passageiros (rodoviário, aquaviário, aéreo). NÃO inclui transporte de carga (8%).'
  },
  {
    id: 'servicos_gerais',
    descricao: 'Prestação de serviços em geral',
    percentual: 0.32,
    irpjMajorado: 0.352,
    baseLegal: 'Lei 9.249/95, Art. 15, §1º, III, a',
    cnaes: ['71.19-7', '71.12-0', '62.01-5', '69.20-6', '70.20-4', '73.11-4'],
    observacoes: 'Inclui consultoria, engenharia, TI, contabilidade, advocacia e demais serviços profissionais.'
  },
  {
    id: 'intermediacao',
    descricao: 'Intermediação de negócios',
    percentual: 0.32,
    irpjMajorado: 0.352,
    baseLegal: 'Lei 9.249/95, Art. 15, §1º, III, b',
    cnaes: ['66.12-6', '68.22-6'],
    observacoes: 'Corretores, agentes, representantes comerciais.'
  },
  {
    id: 'locacao_cessao',
    descricao: 'Locação de bens MÓVEIS e cessão de direitos de qualquer natureza',
    percentual: 0.32,
    irpjMajorado: 0.352,
    baseLegal: 'Lei 9.249/95, Art. 15, §1º, III, c',
    cnaes: ['77.11-0', '77.19-5'],
    observacoes: 'Locação de bens MÓVEIS e cessão de direitos. Para locação de IMÓVEIS próprios, usar imobiliaria_locacao.'
  },
  {
    id: 'imobiliaria_locacao',
    descricao: 'Locação/Administração de Imóveis Próprios',
    percentual: 0.32,
    irpjMajorado: 0.352,
    baseLegal: 'Lei 9.249/95, Art. 15, §1º, III, "c"',
    cnaes: ['68.10-2/02', '68.22-6'],
    observacoes: 'Locação de imóveis próprios e administração de imóveis de terceiros. Diferente de locação de bens MÓVEIS. CNAEs 68.10-2/02, 68.22-6.'
  },
  {
    id: 'factoring',
    descricao: 'Factoring (compra de direitos creditórios)',
    percentual: 0.32,
    irpjMajorado: 0.352,
    baseLegal: 'Lei 9.249/95, Art. 15, §1º, III, d',
    cnaes: ['64.99-9'],
    observacoes: 'Prestação cumulativa e contínua de serviços de assessoria creditícia, mercadológica, gestão de crédito, seleção de riscos, administração de contas.'
  },
  {
    id: 'construcao_sem_material',
    descricao: 'Construção — Empreitada SEM fornecimento de materiais',
    percentual: 0.32,
    irpjMajorado: 0.352,
    baseLegal: 'Lei 9.249/95, Art. 15, §1º, III, e',
    cnaes: ['41.20-4', '42.11-1'],
    observacoes: 'Empreitada sem fornecimento de todos os materiais indispensáveis. Se fornece TODOS os materiais → usar construcao_com_material (8%).'
  },
  {
    id: 'esc',
    descricao: 'Empresa Simples de Crédito (ESC) — Operações de empréstimo, financiamento e desconto de títulos',
    percentual: 0.384,
    irpjMajorado: 0.4224,
    baseLegal: 'Lei Complementar 167/2019, Art. 12 (altera Lei 9.249/95, Art. 15, §1º, IV)',
    cnaes: ['64.99-9'],
    observacoes: 'Percentual exclusivo para ESC. Introduzido pela LC 167/2019. Limite receita: R$ 4.800.000/ano (EPP).'
  }
];

/**
 * Tabela completa de percentuais de presunção da CSLL por atividade.
 * Base Legal: Lei 9.249/1995, Art. 20.
 *
 * ATENÇÃO: Os percentuais de CSLL podem diferir dos de IRPJ.
 * Ex.: Comércio/Indústria → IRPJ 8%, CSLL 12%.
 *      Transporte          → IRPJ 16%, CSLL 12%.
 *      Serviços em geral   → IRPJ 32%, CSLL 32%.
 *
 * Cada entrada contém csllMajorada com o acréscimo de 10% da LC 224/2025.
 */
const PERCENTUAIS_PRESUNCAO_CSLL = [
  {
    id: 'combustivel',
    descricao: 'Revenda a varejo de combustível',
    percentual: 0.12,
    csllMajorada: 0.132,
    baseLegal: 'Lei 9.249/95, Art. 20, III'
  },
  {
    id: 'comercio_geral',
    descricao: 'Venda de mercadorias e produtos (comércio em geral)',
    percentual: 0.12,
    csllMajorada: 0.132,
    baseLegal: 'Lei 9.249/95, Art. 20, III'
  },
  {
    id: 'industria',
    descricao: 'Indústria (transformação, beneficiamento)',
    percentual: 0.12,
    csllMajorada: 0.132,
    baseLegal: 'Lei 9.249/95, Art. 20, III'
  },
  {
    id: 'imobiliaria_venda',
    descricao: 'Atividade Imobiliária — Venda/Loteamento/Incorporação',
    percentual: 0.12,
    csllMajorada: 0.132,
    baseLegal: 'Lei 9.249/95, Art. 20, III'
  },
  {
    id: 'construcao_com_material',
    descricao: 'Construção — Empreitada com TODOS os materiais',
    percentual: 0.12,
    csllMajorada: 0.132,
    baseLegal: 'Lei 9.249/95, Art. 20, III'
  },
  {
    id: 'transporte_cargas',
    descricao: 'Transporte de Cargas',
    percentual: 0.12,
    csllMajorada: 0.132,
    baseLegal: 'Lei 9.249/95, Art. 20, III'
  },
  {
    id: 'hospitalar_reduzido',
    descricao: 'Serviços Hospitalares e Auxílio Diagnóstico (8%)',
    percentual: 0.12,
    csllMajorada: 0.132,
    baseLegal: 'Lei 9.249/95, Art. 20, III'
  },
  {
    id: 'transporte_passageiros',
    descricao: 'Prestação de serviços de transporte de passageiros',
    percentual: 0.12,
    csllMajorada: 0.132,
    baseLegal: 'Lei 9.249/95, Art. 20, III'
  },
  {
    id: 'servicos_gerais',
    descricao: 'Prestação de serviços em geral',
    percentual: 0.32,
    csllMajorada: 0.352,
    baseLegal: 'Lei 9.249/95, Art. 20, I'
  },
  {
    id: 'intermediacao',
    descricao: 'Intermediação de negócios',
    percentual: 0.32,
    csllMajorada: 0.352,
    baseLegal: 'Lei 9.249/95, Art. 20, I'
  },
  {
    id: 'locacao_cessao',
    descricao: 'Locação de bens MÓVEIS e cessão de direitos',
    percentual: 0.32,
    csllMajorada: 0.352,
    baseLegal: 'Lei 9.249/95, Art. 20, I'
  },
  {
    id: 'imobiliaria_locacao',
    descricao: 'Locação/Administração de Imóveis Próprios',
    percentual: 0.32,
    csllMajorada: 0.352,
    baseLegal: 'Lei 9.249/95, Art. 20, I'
  },
  {
    id: 'factoring',
    descricao: 'Factoring',
    percentual: 0.32,
    csllMajorada: 0.352,
    baseLegal: 'Lei 9.249/95, Art. 20, I'
  },
  {
    id: 'construcao_sem_material',
    descricao: 'Construção — Empreitada SEM fornecimento de materiais',
    percentual: 0.32,
    csllMajorada: 0.352,
    baseLegal: 'Lei 9.249/95, Art. 20, I'
  },
  {
    id: 'esc',
    descricao: 'Empresa Simples de Crédito (ESC)',
    percentual: 0.384,
    csllMajorada: 0.4224,
    baseLegal: 'Lei Complementar 167/2019, Art. 12 (altera Art. 20, II da Lei 9.249/95)'
  }
];


// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 3: CÓDIGOS DARF E OBRIGAÇÕES ACESSÓRIAS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Códigos DARF para recolhimento no Lucro Presumido.
 */
const CODIGOS_DARF = {
  IRPJ_PRESUMIDO: '2089',
  CSLL_PRESUMIDO: '2372',
  PIS_CUMULATIVO: '8109',
  COFINS_CUMULATIVO: '2172',
};

/**
 * Obrigações acessórias do Lucro Presumido com prazos e periodicidade.
 */
const OBRIGACOES_ACESSORIAS = {
  DCTF: {
    nome: 'Declaração de Débitos e Créditos Tributários Federais',
    descricao: 'Declaração mensal dos débitos e créditos relativos a tributos federais (IRPJ, CSLL, PIS, COFINS, IPI, IOF etc.).',
    periodicidade: 'Mensal',
    prazo: '15º dia útil do mês subsequente',
    obrigatoria: true,
    baseLegal: 'IN RFB 1.700/2017'
  },
  ECF: {
    nome: 'Escrituração Contábil Fiscal',
    descricao: 'Substituiu a DIPJ. Contém informações contábeis e fiscais para apuração do IRPJ e CSLL. Deve ser transmitida via SPED.',
    periodicidade: 'Anual',
    prazo: 'Último dia útil de julho do ano seguinte',
    obrigatoria: true,
    baseLegal: 'IN RFB 1.422/2013, Art. 3º'
  },
  ECD: {
    nome: 'Escrituração Contábil Digital',
    descricao: 'Livros contábeis digitais (Diário, Razão, Balancetes). Opcional no Presumido — pode usar Livro Caixa, mas recomendada para distribuir lucro contábil efetivo.',
    periodicidade: 'Anual',
    prazo: '31 de maio do ano seguinte',
    obrigatoria: false, // Opcional — pode usar Livro Caixa
    baseLegal: 'IN RFB 1.774/2017',
    observacao: 'Opcional. Se optar por Livro Caixa, não precisa entregar ECD. Recomendada para distribuir lucro contábil efetivo.'
  },
  EFD_CONTRIBUICOES: {
    nome: 'Escrituração Fiscal Digital de Contribuições (PIS/COFINS)',
    descricao: 'Escrituração digital da apuração do PIS/Pasep e COFINS. Apresenta receitas, custos, despesas e créditos (se aplicável).',
    periodicidade: 'Mensal',
    prazo: '10º dia útil do 2º mês seguinte ao da escrituração',
    obrigatoria: true,
    baseLegal: 'IN RFB 1.252/2012, Art. 7º'
  },
  DIRF: {
    nome: 'Declaração do Imposto de Renda Retido na Fonte',
    descricao: 'Informa à Receita os rendimentos pagos e o IR retido na fonte sobre salários, serviços de terceiros, aluguéis, etc.',
    periodicidade: 'Anual',
    prazo: '29 de fevereiro do ano seguinte',
    obrigatoria: true,
    baseLegal: 'IN RFB 1.990/2020',
    observacao: 'Obrigatória se houve retenções de IR na fonte.',
    alerta: 'DIRF foi substituída por EFD-Reinf + eSocial a partir de 2025 (IN RFB 2.096/2022). Verificar com contador a transição.'
  },
  EFD_REINF: {
    nome: 'Escrituração Fiscal Digital de Retenções e Informações (EFD-Reinf)',
    descricao: 'Escrituração mensal das retenções de IRRF, CSRF (PIS/COFINS/CSLL), INSS e demais informações fiscais não relacionadas ao trabalho. Substitui parcialmente a DIRF.',
    periodicidade: 'Mensal',
    prazo: 'Dia 15 do mês seguinte',
    obrigatoria: true,
    baseLegal: 'IN RFB 2.043/2021',
    observacao: 'Obrigatória para todas as PJ. Integra o SPED. Informações de retenções de serviços tomados/prestados.'
  },
  ESOCIAL: {
    nome: 'e-Social',
    descricao: 'Sistema unificado de escrituração fiscal das obrigações trabalhistas, previdenciárias e fiscais relativas a empregados e contribuintes.',
    periodicidade: 'Mensal',
    prazo: '15º dia do mês seguinte',
    obrigatoria: true,
    baseLegal: 'Decreto 8.373/2014'
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 4: IMPEDIMENTOS LEGAIS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lista de impedimentos para opção pelo Lucro Presumido.
 * Base Legal: RIR/2018, Art. 257 e legislação complementar.
 */
const IMPEDIMENTOS_LUCRO_PRESUMIDO = [
  {
    id: 'receita_excedente',
    descricao: 'Receita bruta total no ano anterior superior a R$ 78.000.000,00',
    baseLegal: 'Lei 9.718/1998, Art. 13',
    verificacao: (dados) => dados.receitaBrutaAnualAnterior > LIMITE_RECEITA_BRUTA_ANUAL
  },
  {
    id: 'instituicao_financeira',
    descricao: 'Instituições financeiras (bancos, corretoras, distribuidoras, etc.)',
    baseLegal: 'RIR/2018, Art. 257, I',
    verificacao: (dados) => dados.isInstituicaoFinanceira === true
  },
  {
    id: 'factoring_impedimento',
    descricao: 'Empresas de factoring (compra de direitos creditórios)',
    baseLegal: 'RIR/2018, Art. 257, II',
    verificacao: (dados) => dados.isFactoring === true
  },
  {
    id: 'lucros_exterior',
    descricao: 'Empresas com lucros, rendimentos ou ganhos de capital oriundos do exterior',
    baseLegal: 'RIR/2018, Art. 257, III',
    verificacao: (dados) => dados.temRendimentosExterior === true
  },
  {
    id: 'isencao_reducao',
    descricao: 'Beneficiários de isenção ou redução de IR calculada com base no lucro da exploração',
    baseLegal: 'RIR/2018, Art. 257, IV',
    verificacao: (dados) => dados.temIsencaoReducaoIR === true
  },
  {
    id: 'scp',
    descricao: 'Sociedade em Conta de Participação (SCP) em determinadas circunstâncias',
    baseLegal: 'RIR/2018, Art. 257',
    verificacao: (dados) => dados.isSCP === true
  },
  {
    id: 'scp_socio_ostensivo_lr',
    descricao: 'Sócio ostensivo de SCP quando tributado pelo Lucro Real — vedação ao LP para parcela do resultado da SCP',
    baseLegal: 'Lei 9.718/1998, Art. 14, VII',
    verificacao: (dados) => dados.isSocioOstensivoSCPnoLucroReal === true
  },
  {
    id: 'securitizacao',
    descricao: 'Atividade de securitização de créditos imobiliários, financeiros e do agronegócio',
    baseLegal: 'Lei 9.718/1998, Art. 14, VIII (incluído pela Lei 14.430/2022)',
    verificacao: (dados) => dados.isSecuritizadora === true
  }
];


// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 5: PERÍODOS DE APURAÇÃO E PRAZOS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retorna os trimestres fiscais para um dado ano-calendário.
 * Base Legal: RIR/2018, Art. 588.
 *
 * @param {number} ano - Ano-calendário (ex.: 2026)
 * @returns {Array<Object>} Lista de trimestres com datas e vencimentos
 */
function getTrimestres(ano) {
  return [
    {
      trimestre: 1,
      descricao: `1º Trimestre ${ano}`,
      inicio: new Date(ano, 0, 1),
      fim: new Date(ano, 2, 31),
      vencimentoQuotaUnica: _getUltimoDiaUtil(ano, 3),  // Abril
      vencimentoQuota2: _getUltimoDiaUtil(ano, 4),       // Maio
      vencimentoQuota3: _getUltimoDiaUtil(ano, 5),       // Junho
      meses: [1, 2, 3]
    },
    {
      trimestre: 2,
      descricao: `2º Trimestre ${ano}`,
      inicio: new Date(ano, 3, 1),
      fim: new Date(ano, 5, 30),
      vencimentoQuotaUnica: _getUltimoDiaUtil(ano, 6),
      vencimentoQuota2: _getUltimoDiaUtil(ano, 7),
      vencimentoQuota3: _getUltimoDiaUtil(ano, 8),
      meses: [4, 5, 6]
    },
    {
      trimestre: 3,
      descricao: `3º Trimestre ${ano}`,
      inicio: new Date(ano, 6, 1),
      fim: new Date(ano, 8, 30),
      vencimentoQuotaUnica: _getUltimoDiaUtil(ano, 9),
      vencimentoQuota2: _getUltimoDiaUtil(ano, 10),
      vencimentoQuota3: _getUltimoDiaUtil(ano, 11),
      meses: [7, 8, 9]
    },
    {
      trimestre: 4,
      descricao: `4º Trimestre ${ano}`,
      inicio: new Date(ano, 9, 1),
      fim: new Date(ano, 11, 31),
      vencimentoQuotaUnica: _getUltimoDiaUtil(ano + 1, 0),
      vencimentoQuota2: _getUltimoDiaUtil(ano + 1, 1),
      vencimentoQuota3: _getUltimoDiaUtil(ano + 1, 2),
      meses: [10, 11, 12]
    }
  ];
}

/**
 * Feriados nacionais fixos (MM-DD).
 * NOTA: Feriados variáveis (Carnaval, Corpus Christi, Sexta-feira Santa) e estaduais não estão incluídos. Considerar integração futura.
 * @private
 */
const FERIADOS_NACIONAIS_FIXOS = [
  '01-01', // Confraternização Universal
  '04-21', // Tiradentes
  '05-01', // Dia do Trabalho
  '09-07', // Independência
  '10-12', // Nossa Senhora Aparecida
  '11-02', // Finados
  '11-15', // Proclamação da República
  '12-25'  // Natal
];

/**
 * Verifica se uma data cai em feriado nacional fixo.
 * @private
 */
function _isFeriadoFixo(data) {
  const mmdd = String(data.getMonth() + 1).padStart(2, '0') + '-' + String(data.getDate()).padStart(2, '0');
  return FERIADOS_NACIONAIS_FIXOS.includes(mmdd);
}

/**
 * Calcula o último dia útil de um mês (considera fins de semana e feriados nacionais fixos).
 * @private
 */
function _getUltimoDiaUtil(ano, mes) {
  let data = new Date(ano, mes + 1, 0);
  while (data.getDay() === 0 || data.getDay() === 6 || _isFeriadoFixo(data)) {
    data.setDate(data.getDate() - 1);
  }
  return data;
}

/**
 * Calcula o dia 25 (ou próximo dia útil) do mês seguinte para PIS/COFINS.
 * Base Legal: Lei 9.718/1998.
 * @param {number} ano
 * @param {number} mes - Mês de competência (1-12)
 * @returns {Date}
 */
function getVencimentoPISCOFINS(ano, mes) {
  const mesVencimento = mes; // mês seguinte (0-indexed = mes)
  const anoVencimento = mes === 12 ? ano + 1 : ano;
  const mesIdx = mes === 12 ? 0 : mes;
  let data = new Date(anoVencimento, mesIdx, 25);
  const diaSemana = data.getDay();
  if (diaSemana === 0) data.setDate(data.getDate() - 2);
  else if (diaSemana === 6) data.setDate(data.getDate() - 1);
  return data;
}


// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 6: VERIFICAÇÃO DE ELEGIBILIDADE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verifica se a empresa é elegível para optar pelo Lucro Presumido.
 *
 * @param {Object} dados - Dados da empresa
 * @param {number} dados.receitaBrutaAnualAnterior - Receita bruta do ano anterior
 * @param {number} [dados.mesesAtividadeAnoAnterior=12] - Meses de atividade no ano anterior
 * @param {boolean} [dados.isInstituicaoFinanceira=false]
 * @param {boolean} [dados.isFactoring=false]
 * @param {boolean} [dados.temRendimentosExterior=false]
 * @param {boolean} [dados.temIsencaoReducaoIR=false]
 * @param {boolean} [dados.isSCP=false]
 * @returns {Object} Resultado da verificação
 */
function verificarElegibilidade(dados) {
  const resultado = {
    elegivel: true,
    impedimentos: [],
    alertas: [],
    limiteAplicavel: LIMITE_RECEITA_BRUTA_ANUAL
  };

  // Ajuste de limite proporcional se atividade < 12 meses
  const meses = dados.mesesAtividadeAnoAnterior || 12;
  if (meses < 12) {
    resultado.limiteAplicavel = LIMITE_RECEITA_BRUTA_MENSAL * meses;
    resultado.alertas.push({
      tipo: 'info',
      mensagem: `Limite proporcional aplicado: R$ ${_formatarMoeda(resultado.limiteAplicavel)} (${meses} meses de atividade).`
    });
  }

  // Verificar cada impedimento
  for (const impedimento of IMPEDIMENTOS_LUCRO_PRESUMIDO) {
    if (impedimento.verificacao(dados)) {
      resultado.elegivel = false;
      resultado.impedimentos.push({
        id: impedimento.id,
        descricao: impedimento.descricao,
        baseLegal: impedimento.baseLegal
      });
    }
  }

  // Alertas adicionais
  if (dados.receitaBrutaAnualAnterior > LIMITE_RECEITA_BRUTA_ANUAL * 0.80) {
    resultado.alertas.push({
      tipo: 'atencao',
      mensagem: `Receita bruta está acima de 80% do limite (R$ ${_formatarMoeda(dados.receitaBrutaAnualAnterior)} / R$ ${_formatarMoeda(LIMITE_RECEITA_BRUTA_ANUAL)}). Monitore para evitar perda de elegibilidade.`
    });
  }

  // Validação cruzada: atividade factoring ou ESC
  if (dados.atividadeId === 'factoring' || dados.atividadeId === 'esc') {
    resultado.alertas.push({
      tipo: 'atencao',
      mensagem: dados.atividadeId === 'factoring'
        ? 'Atividade de factoring pode configurar impedimento ao LP (RIR/2018, Art. 257, II). Confirme com o contador se sua atividade se enquadra nesta vedação.'
        : 'ESC: limite de receita R$ 4.800.000/ano (EPP). Atuação restrita ao município da sede + limítrofes (LC 167/2019).'
    });
  }

  return resultado;
}


// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 7: MOTOR DE CÁLCULO PRINCIPAL — LUCRO PRESUMIDO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula IRPJ e CSLL trimestrais no regime de Lucro Presumido.
 *
 * @param {Object} params
 * @param {Array<Object>} params.receitas - Receitas por atividade no trimestre
 *   Cada objeto: { atividadeId: string, valor: number }
 * @param {number} [params.devolucoes=0] - Devoluções de vendas
 * @param {number} [params.cancelamentos=0] - Vendas canceladas
 * @param {number} [params.descontosIncondicionais=0] - Descontos incondicionais concedidos
 * @param {number} [params.ganhosCapital=0] - Ganhos de capital na alienação de ativos
 * @param {number} [params.rendimentosFinanceiros=0] - Rendimentos de aplicações financeiras
 * @param {number} [params.jcpRecebidos=0] - JCP recebido de outras empresas
 * @param {number} [params.multasContratuais=0] - Multas por rescisão contratual recebidas
 * @param {number} [params.receitasFinanceirasDiversas=0] - Variações cambiais, juros recebidos, etc.
 * @param {number} [params.valoresRecuperados=0] - Custos/despesas deduzidos anteriormente e recuperados
 * @param {number} [params.demaisReceitas=0] - Outras receitas não abrangidas pela presunção
 * @param {number} [params.irrfRetidoFonte=0] - IRRF retido na fonte sobre receitas do trimestre
 * @param {number} [params.csllRetidaFonte=0] - CSLL retida na fonte sobre receitas do trimestre
 * @param {number} [params.trimestreAtual=0] - Trimestre (1-4), necessário para LC 224/2025
 * @param {number} [params.anoCalendario=2026] - Ano-calendário, necessário para LC 224/2025
 * @param {number} [params.receitaBrutaAcumuladaAnoAte=0] - Receita acumulada no ano até o fim deste trimestre (inclui este trimestre)
 * @returns {Object} Detalhamento completo do cálculo
 */
function calcularLucroPresumidoTrimestral(params) {
  const {
    receitas = [],
    devolucoes = 0,
    cancelamentos = 0,
    descontosIncondicionais = 0,
    ganhosCapital = 0,
    rendimentosFinanceiros = 0,
    jcpRecebidos = 0,
    multasContratuais = 0,
    receitasFinanceirasDiversas = 0,
    valoresRecuperados = 0,
    demaisReceitas = 0,
    irrfRetidoFonte = 0,
    csllRetidaFonte = 0,
    trimestreAtual = 0,
    anoCalendario = new Date().getFullYear(),
    receitaBrutaAcumuladaAnoAte = 0
  } = params;

  // ── Passo 1: Receita Bruta Trimestral ──
  const receitaBrutaTotal = receitas.reduce((sum, r) => sum + (r.valor || 0), 0);
  const deducoesDaReceita = devolucoes + cancelamentos + descontosIncondicionais;
  // FIX: Receita ajustada não pode ser negativa (deduções > receita)
  const receitaBrutaAjustadaRaw = receitaBrutaTotal - deducoesDaReceita;
  const receitaBrutaAjustada = Math.max(0, receitaBrutaAjustadaRaw);
  const deducoesExcedentes = _arredondar(Math.max(0, -receitaBrutaAjustadaRaw));

  // ── Passo 2: Base Presumida por Atividade (com LC 224/2025) ──
  const detalhamentoIRPJ = [];
  const detalhamentoCSLL = [];
  let basePresumidaIRPJ = 0;
  let basePresumidaCSLL = 0;
  let impactoLC224TotalIRPJ = 0;
  let impactoLC224TotalCSLL = 0;
  let lc224AplicadaNoTrimestre = false;

  // Receita acumulada para LC 224 (usa receitaBrutaAjustada como base)
  const receitaAcumuladaLC224 = receitaBrutaAcumuladaAnoAte > 0
    ? receitaBrutaAcumuladaAnoAte
    : receitaBrutaAjustada; // fallback: apenas este trimestre

  for (const receita of receitas) {
    const atividadeIRPJ = PERCENTUAIS_PRESUNCAO_IRPJ.find(a => a.id === receita.atividadeId);
    const atividadeCSLL = PERCENTUAIS_PRESUNCAO_CSLL.find(a => a.id === receita.atividadeId);

    if (!atividadeIRPJ || !atividadeCSLL) {
      throw new Error(`Atividade não encontrada: "${receita.atividadeId}". IDs válidos: ${PERCENTUAIS_PRESUNCAO_IRPJ.map(a => a.id).join(', ')}`);
    }

    // Proporção das deduções da receita para cada atividade
    const proporcao = receitaBrutaTotal > 0 ? receita.valor / receitaBrutaTotal : 0;
    // FIX: Garantir que a receita líquida por atividade não seja negativa
    const receitaLiquidaAtividade = Math.max(0, receita.valor - (deducoesDaReceita * proporcao));

    // LC 224/2025: Aplicar proporcionalização por atividade (§5º, II)
    // Cada atividade recebe o excedente proporcional à sua receita
    const proporcaoAtividadeNaReceita = receitaBrutaAjustada > 0
      ? receitaLiquidaAtividade / receitaBrutaAjustada
      : 0;

    // Calcular base IRPJ com LC 224
    let baseIRPJAtividade;
    let lc224IRPJ = null;
    if (trimestreAtual > 0) {
      lc224IRPJ = calcularBasePresumidaLC224({
        receitaBrutaTrimestral: receitaLiquidaAtividade,
        receitaBrutaAcumuladaAnoAte: receitaAcumuladaLC224 * proporcaoAtividadeNaReceita,
        percentualPresuncaoOriginal: atividadeIRPJ.percentual,
        trimestreAtual,
        anoCalendario
      });
      baseIRPJAtividade = lc224IRPJ.basePresumida;
      impactoLC224TotalIRPJ += lc224IRPJ.impactoLC224;
      if (lc224IRPJ.lc224Aplicavel) lc224AplicadaNoTrimestre = true;
    } else {
      baseIRPJAtividade = receitaLiquidaAtividade * atividadeIRPJ.percentual;
    }

    // Calcular base CSLL com LC 224
    let baseCSLLAtividade;
    let lc224CSLL = null;
    if (trimestreAtual > 0) {
      lc224CSLL = calcularBasePresumidaLC224({
        receitaBrutaTrimestral: receitaLiquidaAtividade,
        receitaBrutaAcumuladaAnoAte: receitaAcumuladaLC224 * proporcaoAtividadeNaReceita,
        percentualPresuncaoOriginal: atividadeCSLL.percentual,
        trimestreAtual,
        anoCalendario
      });
      baseCSLLAtividade = lc224CSLL.basePresumida;
      impactoLC224TotalCSLL += lc224CSLL.impactoLC224;
    } else {
      baseCSLLAtividade = receitaLiquidaAtividade * atividadeCSLL.percentual;
    }

    basePresumidaIRPJ += baseIRPJAtividade;
    basePresumidaCSLL += baseCSLLAtividade;

    const percentualEfetivoIRPJ = (lc224IRPJ && lc224IRPJ.lc224Aplicavel)
      ? (baseIRPJAtividade / receitaLiquidaAtividade)
      : atividadeIRPJ.percentual;
    const percentualEfetivoCSLL = (lc224CSLL && lc224CSLL.lc224Aplicavel)
      ? (baseCSLLAtividade / receitaLiquidaAtividade)
      : atividadeCSLL.percentual;

    detalhamentoIRPJ.push({
      atividade: atividadeIRPJ.descricao,
      atividadeId: receita.atividadeId,
      receitaBruta: receita.valor,
      receitaLiquida: _arredondar(receitaLiquidaAtividade),
      percentualPresuncao: atividadeIRPJ.percentual,
      percentualPresuncaoFormatado: `${(atividadeIRPJ.percentual * 100).toFixed(1)}%`,
      basePresumida: _arredondar(baseIRPJAtividade),
      baseLegal: atividadeIRPJ.baseLegal,
      lc224: lc224IRPJ ? {
        aplicavel: lc224IRPJ.lc224Aplicavel,
        percentualMajorado: lc224IRPJ.percentualMajorado,
        percentualEfetivo: _arredondar(percentualEfetivoIRPJ, 4),
        dentroDoLimite: _arredondar(lc224IRPJ.dentroDoLimite),
        excedenteDoTrimestre: _arredondar(lc224IRPJ.excedenteDoTrimestre),
        impactoNaBase: _arredondar(lc224IRPJ.impactoLC224)
      } : null
    });

    detalhamentoCSLL.push({
      atividade: atividadeCSLL.descricao,
      atividadeId: receita.atividadeId,
      receitaBruta: receita.valor,
      receitaLiquida: _arredondar(receitaLiquidaAtividade),
      percentualPresuncao: atividadeCSLL.percentual,
      percentualPresuncaoFormatado: `${(atividadeCSLL.percentual * 100).toFixed(1)}%`,
      basePresumida: _arredondar(baseCSLLAtividade),
      baseLegal: atividadeCSLL.baseLegal,
      lc224: lc224CSLL ? {
        aplicavel: lc224CSLL.lc224Aplicavel,
        percentualMajorado: lc224CSLL.percentualMajorado,
        percentualEfetivo: _arredondar(percentualEfetivoCSLL, 4),
        dentroDoLimite: _arredondar(lc224CSLL.dentroDoLimite),
        excedenteDoTrimestre: _arredondar(lc224CSLL.excedenteDoTrimestre),
        impactoNaBase: _arredondar(lc224CSLL.impactoLC224)
      } : null
    });
  }

  // ── Passo 3: Adições Obrigatórias (Art. 595 RIR/2018) ──
  const adicoesObrigatorias = {
    ganhosCapital,
    rendimentosFinanceiros,
    jcpRecebidos,
    multasContratuais,
    receitasFinanceirasDiversas,
    valoresRecuperados,
    demaisReceitas,
    total: ganhosCapital + rendimentosFinanceiros + jcpRecebidos +
           multasContratuais + receitasFinanceirasDiversas +
           valoresRecuperados + demaisReceitas
  };

  // ── Passo 4: Base de Cálculo Final ──
  const baseCalculoIRPJ = _arredondar(basePresumidaIRPJ + adicoesObrigatorias.total);
  const baseCalculoCSLL = _arredondar(basePresumidaCSLL + adicoesObrigatorias.total);

  // ── Passo 5: Cálculo do IRPJ ──
  const irpjNormal = _arredondar(baseCalculoIRPJ * ALIQUOTA_IRPJ);
  const baseAdicional = Math.max(0, baseCalculoIRPJ - LIMITE_ADICIONAL_TRIMESTRAL);
  const irpjAdicional = _arredondar(baseAdicional * ALIQUOTA_ADICIONAL_IRPJ);
  const irpjBruto = _arredondar(irpjNormal + irpjAdicional);
  const irpjDevido = _arredondar(Math.max(0, irpjBruto - irrfRetidoFonte));
  // FIX: Capturar saldo credor de IRRF para PER/DCOMP
  const saldoCredorIRPJ = _arredondar(Math.max(0, irrfRetidoFonte - irpjBruto));

  // ── Passo 6: Cálculo da CSLL ──
  const csllBruta = _arredondar(baseCalculoCSLL * ALIQUOTA_CSLL);
  const csllDevida = _arredondar(Math.max(0, csllBruta - csllRetidaFonte));
  // FIX: Capturar saldo credor de CSLL para PER/DCOMP
  const saldoCredorCSLL = _arredondar(Math.max(0, csllRetidaFonte - csllBruta));
  const temSaldoCredorIRPJCSLL = saldoCredorIRPJ > 0 || saldoCredorCSLL > 0;

  // ── Passo 7: Alíquota Efetiva ──
  const totalImpostos = irpjDevido + csllDevida;
  const aliquotaEfetivaReceita = receitaBrutaAjustada > 0
    ? _arredondar((totalImpostos / receitaBrutaAjustada) * 100, 2)
    : 0;
  const aliquotaEfetivaBase = baseCalculoIRPJ > 0
    ? _arredondar((totalImpostos / baseCalculoIRPJ) * 100, 2)
    : 0;

  // ── Passo 8: Quotas de Parcelamento ──
  const quotasIRPJ = _calcularQuotas(irpjDevido);
  const quotasCSLL = _calcularQuotas(csllDevida);

  // ── Passo 9: Distribuição de Lucros Isentos ──
  // NOTA: Este valor considera apenas IRPJ+CSLL (trimestral).
  // Para cálculo completo incluindo PIS/COFINS, use calcularAnualConsolidado().
  const lucroDistribuidoPresumido = _arredondar(Math.max(0, baseCalculoIRPJ - totalImpostos));

  return {
    // Resumo
    resumo: {
      receitaBrutaTotal,
      deducoesDaReceita,
      receitaBrutaAjustada,
      basePresumidaIRPJ: _arredondar(basePresumidaIRPJ),
      basePresumidaCSLL: _arredondar(basePresumidaCSLL),
      adicoesObrigatorias: adicoesObrigatorias.total,
      baseCalculoIRPJ,
      baseCalculoCSLL,
      irpjNormal,
      irpjAdicional,
      irpjBruto,
      irrfRetidoFonte,
      irpjDevido,
      csllBruta,
      csllRetidaFonte,
      csllDevida,
      totalIRPJCSLL: _arredondar(irpjDevido + csllDevida),
      aliquotaEfetivaReceita: `${aliquotaEfetivaReceita}%`,
      aliquotaEfetivaBase: `${aliquotaEfetivaBase}%`,
      lucroDistribuidoPresumido,
      codigoDARF_IRPJ: CODIGOS_DARF.IRPJ_PRESUMIDO,
      codigoDARF_CSLL: CODIGOS_DARF.CSLL_PRESUMIDO,
      // FIX: Novos campos para saldo credor e deduções excedentes
      deducoesExcedentes,
      saldoCredorIRPJ,
      saldoCredorCSLL,
      temSaldoCredorIRPJCSLL
    },

    // Detalhamento da composição da base
    detalhamento: {
      irpj: detalhamentoIRPJ,
      csll: detalhamentoCSLL,
      adicoesObrigatorias
    },

    // Quotas de parcelamento
    parcelamento: {
      irpj: quotasIRPJ,
      csll: quotasCSLL,
      observacao: 'Quotas mínimas de R$ 1.000,00. 2ª e 3ª quotas acrescidas de juros SELIC.'
    },

    // LC 224/2025 — Impacto do acréscimo de 10%
    lc224: {
      aplicada: lc224AplicadaNoTrimestre,
      impactoBaseIRPJ: _arredondar(impactoLC224TotalIRPJ),
      impactoBaseCSLL: _arredondar(impactoLC224TotalCSLL),
      impactoIRPJ: _arredondar(impactoLC224TotalIRPJ * ALIQUOTA_IRPJ),
      impactoCSLL: _arredondar(impactoLC224TotalCSLL * ALIQUOTA_CSLL),
      baseLegal: 'LC 224/2025, Art. 4º, §4º, VII; §5º'
    },

    // Cálculos intermediários (para auditoria)
    _auditoria: {
      limiteAdicional: LIMITE_ADICIONAL_TRIMESTRAL,
      baseAdicional,
      aliquotaIRPJ: ALIQUOTA_IRPJ,
      aliquotaAdicional: ALIQUOTA_ADICIONAL_IRPJ,
      aliquotaCSLL: ALIQUOTA_CSLL,
      trimestreAtual,
      anoCalendario
    }
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 8: CÁLCULO DE PIS E COFINS (REGIME CUMULATIVO)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula PIS e COFINS mensais no regime cumulativo (Lucro Presumido).
 * Base Legal: Lei 9.718/1998 / Lei 10.637/2002 / Lei 10.833/2003.
 *
 * @param {Object} params
 * @param {number} params.receitaBrutaMensal - Receita bruta do mês
 * @param {number} [params.vendasCanceladas=0]
 * @param {number} [params.descontosIncondicionais=0]
 * @param {number} [params.receitasExportacao=0] - Imunes de PIS/COFINS
 * @param {number} [params.receitasIsentas=0]
 * @param {number} [params.icmsST=0] - ICMS-ST destacado
 * @param {number} [params.ipiDestacado=0] - IPI destacado
 * @param {number} [params.pisRetidoFonte=0] - PIS retido na fonte (CSRF)
 * @param {number} [params.cofinsRetidaFonte=0] - COFINS retida na fonte (CSRF)
 * @param {number} [params.csllRetidaFonteMensal=0] - CSLL retida na fonte (CSRF) — informativo
 * @param {number} [params.irrfRetidoFonteMensal=0] - IRRF retido na fonte — informativo
 * @returns {Object} Detalhamento do cálculo com saldo PER/DCOMP
 */
function calcularPISCOFINSMensal(params) {
  const {
    receitaBrutaMensal,
    vendasCanceladas = 0,
    descontosIncondicionais = 0,
    receitasExportacao = 0,
    receitasIsentas = 0,
    icmsST = 0,
    ipiDestacado = 0,
    pisRetidoFonte = 0,
    cofinsRetidaFonte = 0,
    csllRetidaFonteMensal = 0,
    irrfRetidoFonteMensal = 0
  } = params;

  const exclusoes = vendasCanceladas + descontosIncondicionais +
                    receitasExportacao + receitasIsentas + icmsST + ipiDestacado;
  const baseCalculo = Math.max(0, receitaBrutaMensal - exclusoes);

  const pisBruto = _arredondar(baseCalculo * ALIQUOTA_PIS_CUMULATIVO);
  const cofinsBruta = _arredondar(baseCalculo * ALIQUOTA_COFINS_CUMULATIVO);

  const pisDevido = _arredondar(Math.max(0, pisBruto - pisRetidoFonte));
  const cofinsDevida = _arredondar(Math.max(0, cofinsBruta - cofinsRetidaFonte));

  // Saldo credor (retenção > imposto devido) → PER/DCOMP
  const saldoCredorPIS = _arredondar(Math.max(0, pisRetidoFonte - pisBruto));
  const saldoCredorCOFINS = _arredondar(Math.max(0, cofinsRetidaFonte - cofinsBruta));
  const temSaldoPERDCOMP = saldoCredorPIS > 0 || saldoCredorCOFINS > 0;

  return {
    regime: 'Cumulativo',
    receitaBrutaMensal,
    exclusoes: {
      vendasCanceladas,
      descontosIncondicionais,
      receitasExportacao,
      receitasIsentas,
      icmsST,
      ipiDestacado,
      total: exclusoes
    },
    baseCalculo,
    pis: {
      aliquota: ALIQUOTA_PIS_CUMULATIVO,
      aliquotaFormatada: '0,65%',
      bruto: pisBruto,
      retidoFonte: pisRetidoFonte,
      devido: pisDevido,
      saldoCredor: saldoCredorPIS,
      codigoDARF: CODIGOS_DARF.PIS_CUMULATIVO
    },
    cofins: {
      aliquota: ALIQUOTA_COFINS_CUMULATIVO,
      aliquotaFormatada: '3,00%',
      bruta: cofinsBruta,
      retidaFonte: cofinsRetidaFonte,
      devida: cofinsDevida,
      saldoCredor: saldoCredorCOFINS,
      codigoDARF: CODIGOS_DARF.COFINS_CUMULATIVO
    },
    retencoesFonte: {
      pisRetido: pisRetidoFonte,
      cofinsRetida: cofinsRetidaFonte,
      csllRetida: csllRetidaFonteMensal,
      irrfRetido: irrfRetidoFonteMensal,
      totalCSRF: _arredondar(pisRetidoFonte + cofinsRetidaFonte + csllRetidaFonteMensal),
      codigoDARFCSRF: CODIGOS_DARF_RETENCAO.CSRF_UNIFICADA,
      codigoDARFIRRF: CODIGOS_DARF_RETENCAO.IRRF_SERVICOS,
      dispensaCSRF: `Pagamentos <= R$ ${LIMITE_DISPENSA_CSRF.toLocaleString('pt-BR')}/mes ao mesmo fornecedor estao dispensados (Lei 10.833/2003, Art. 31, §3o).`
    },
    perDcomp: {
      temSaldo: temSaldoPERDCOMP,
      saldoPIS: saldoCredorPIS,
      saldoCOFINS: saldoCredorCOFINS,
      instrucao: temSaldoPERDCOMP
        ? 'Saldo credor de retencoes excede o imposto devido. Utilize PER/DCOMP para compensar com outros tributos federais ou solicitar restituicao.'
        : null,
      baseLegal: 'IN RFB 1.717/2017 (PER/DCOMP)'
    },
    totalPISCOFINS: _arredondar(pisDevido + cofinsDevida),
    cargaCombinada: '3,65%',
    observacoes: [
      'Regime cumulativo: SEM direito a creditos sobre insumos.',
      'Receitas financeiras de empresa de consultoria: nao integram a base (posicao da RFB).',
      'Retencoes CSRF (Lei 10.833/2003, Arts. 30-35): PIS 0,65% + COFINS 3% + CSLL 1% = 4,65%.',
      'Dispensa: pagamentos <= R$ 5.000/mes ao mesmo fornecedor.',
      'Base Legal: Lei 10.637/2002 (PIS) e Lei 10.833/2003 (COFINS).'
    ]
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 9: CÁLCULO ANUAL CONSOLIDADO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Consolida os cálculos de um ano completo de Lucro Presumido.
 *
 * @param {Object} params
 * @param {Array<Object>} params.trimestres - Array de 4 objetos com dados de cada trimestre
 *   Cada objeto deve conter as mesmas propriedades de calcularLucroPresumidoTrimestral
 * @param {Array<Object>} params.meses - Array de 12 objetos com dados mensais para PIS/COFINS
 *   Cada objeto deve conter as mesmas propriedades de calcularPISCOFINSMensal
 * @param {number} [params.aliquotaISS=0.03] - Alíquota de ISS municipal
 * @param {number} [params.folhaPagamentoAnual=0] - Folha de pagamento anual bruta
 * @param {number} [params.aliquotaRAT=0.03] - RAT conforme CNAE
 * @param {number} [params.aliquotaTerceiros=0.005] - Contribuição a terceiros
 * @param {number} [params.lucroContabilEfetivo=null] - Lucro contábil apurado (se mantiver escrituração completa)
 * @param {Array<Object>} [params.socios=[]] - Participação societária
 *   Cada objeto: { nome: string, percentual: number }
 * @returns {Object} Consolidação anual completa
 */
function calcularAnualConsolidado(params) {
  if (!params || typeof params !== 'object') {
    throw new Error('calcularAnualConsolidado: params deve ser um objeto.');
  }
  const {
    trimestres = [],
    meses = [],
    aliquotaISS = 0.03,
    folhaPagamentoAnual = 0,
    aliquotaRAT = 0.03,
    aliquotaTerceiros = 0.005,
    lucroContabilEfetivo = null,
    socios = []
  } = params;

  if (!Array.isArray(trimestres) || trimestres.length === 0) {
    throw new Error('calcularAnualConsolidado: informe ao menos 1 trimestre.');
  }

  // ── Cálculos Trimestrais (IRPJ + CSLL) com LC 224/2025 ──
  const anoCalendario = params.anoCalendario || new Date().getFullYear();
  let receitaAcumulada = 0;
  const resultadosTrimestres = trimestres.map((t, i) => {
    // Calcular receita bruta deste trimestre para acumular
    const receitaTrimestre = (t.receitas || []).reduce((sum, r) => sum + (r.valor || 0), 0)
      - (t.devolucoes || 0) - (t.cancelamentos || 0) - (t.descontosIncondicionais || 0);
    receitaAcumulada += receitaTrimestre;

    const resultado = calcularLucroPresumidoTrimestral({
      ...t,
      trimestreAtual: i + 1,
      anoCalendario,
      receitaBrutaAcumuladaAnoAte: receitaAcumulada
    });
    return {
      trimestre: i + 1,
      ...resultado.resumo,
      lc224: resultado.lc224
    };
  });

  const totalIRPJ = resultadosTrimestres.reduce((s, t) => s + t.irpjDevido, 0);
  const totalCSLL = resultadosTrimestres.reduce((s, t) => s + t.csllDevida, 0);
  const receitaBrutaAnual = resultadosTrimestres.reduce((s, t) => s + t.receitaBrutaAjustada, 0);

  // ── Cálculos Mensais (PIS + COFINS) ──
  const resultadosMeses = meses.map((m, i) => {
    const resultado = calcularPISCOFINSMensal(m);
    return {
      mes: i + 1,
      ...resultado
    };
  });

  const totalPIS = resultadosMeses.reduce((s, m) => s + m.pis.devido, 0);
  const totalCOFINS = resultadosMeses.reduce((s, m) => s + m.cofins.devida, 0);

  // ── ISS ──
  const issAnual = _arredondar(receitaBrutaAnual * aliquotaISS);

  // ── INSS Patronal ──
  const aliquotaINSSTotal = ALIQUOTA_INSS_PATRONAL + aliquotaRAT + aliquotaTerceiros;
  const inssPatronalAnual = _arredondar(folhaPagamentoAnual * aliquotaINSSTotal);

  // ── Totais ──
  const tributosFederais = _arredondar(totalIRPJ + totalCSLL + totalPIS + totalCOFINS);
  const cargaTributariaTotal = _arredondar(tributosFederais + issAnual + inssPatronalAnual);
  const percentualCarga = receitaBrutaAnual > 0
    ? _arredondar((cargaTributariaTotal / receitaBrutaAnual) * 100, 2)
    : 0;

  // ── Distribuição de Lucros Isentos ──
  // IN RFB 1.700/2017, Art. 238: "diminuída de TODOS os impostos e contribuições"
  // tributosFederais já inclui IRPJ + CSLL + PIS + COFINS
  const basePresumidaAnual = resultadosTrimestres.reduce((s, t) => s + t.baseCalculoIRPJ, 0);
  const lucroDistribuivelPresumido = _arredondar(Math.max(0, basePresumidaAnual - tributosFederais));

  let lucroDistribuivelContabil = null;
  if (lucroContabilEfetivo !== null) {
    lucroDistribuivelContabil = _arredondar(Math.max(0, lucroContabilEfetivo - tributosFederais));
  }

  const lucroDistribuivel = lucroDistribuivelContabil !== null
    ? Math.max(lucroDistribuivelPresumido, lucroDistribuivelContabil)
    : lucroDistribuivelPresumido;

  // ── Distribuição por Sócio ──
  const distribuicaoPorSocio = socios.map(socio => ({
    nome: socio.nome,
    percentual: socio.percentual,
    percentualFormatado: `${(socio.percentual * 100).toFixed(1)}%`,
    valorIsento: _arredondar(lucroDistribuivel * socio.percentual),
    observacao: 'Isento de IR para pessoa física residente no Brasil (Art. 725 RIR/2018).'
  }));

  return {
    anoCalendario: params.anoCalendario || new Date().getFullYear(),
    regime: 'Lucro Presumido',

    receitaBrutaAnual: _arredondar(receitaBrutaAnual),
    elegibilidade: receitaBrutaAnual <= LIMITE_RECEITA_BRUTA_ANUAL
      ? 'Elegível'
      : 'INELEGÍVEL — Receita excede R$ 78 milhões',

    tributos: {
      irpj: { anual: _arredondar(totalIRPJ), trimestres: resultadosTrimestres.map(t => t.irpjDevido) },
      csll: { anual: _arredondar(totalCSLL), trimestres: resultadosTrimestres.map(t => t.csllDevida) },
      pis: { anual: _arredondar(totalPIS), meses: resultadosMeses.map(m => m.pis.devido) },
      cofins: { anual: _arredondar(totalCOFINS), meses: resultadosMeses.map(m => m.cofins.devida) },
      iss: { anual: issAnual, aliquota: `${(aliquotaISS * 100).toFixed(1)}%` },
      inssPatronal: {
        anual: inssPatronalAnual,
        folhaPagamento: folhaPagamentoAnual,
        aliquotaTotal: `${(aliquotaINSSTotal * 100).toFixed(1)}%`,
        composicao: {
          patronal: `${(ALIQUOTA_INSS_PATRONAL * 100).toFixed(1)}%`,
          rat: `${(aliquotaRAT * 100).toFixed(1)}%`,
          terceiros: `${(aliquotaTerceiros * 100).toFixed(1)}%`
        }
      }
    },

    consolidacao: {
      tributosFederais,
      issAnual,
      inssPatronalAnual,
      cargaTributariaTotal,
      percentualCargaTributaria: `${percentualCarga}%`
    },

    distribuicaoLucros: {
      basePresumidaAnual: _arredondar(basePresumidaAnual),
      lucroContabilEfetivo,
      tributosFederais,
      lucroDistribuivelPresumido,
      lucroDistribuivelContabil,
      lucroDistribuivelFinal: lucroDistribuivel,
      tipoBase: lucroDistribuivelContabil !== null ? 'Contábil (escrituração completa)' : 'Presumido',
      porSocio: distribuicaoPorSocio,
      baseLegal: 'IN RFB 1.700/2017, Art. 238; RIR/2018, Art. 725 — Lucros isentos diminuídos de TODOS os impostos e contribuições (IRPJ+CSLL+PIS+COFINS).'
    },

    // LC 224/2025 — Resumo anual do impacto
    lc224: {
      impactoBaseIRPJAnual: _arredondar(resultadosTrimestres.reduce((s, t) => s + (t.lc224 ? t.lc224.impactoBaseIRPJ : 0), 0)),
      impactoBaseCSLLAnual: _arredondar(resultadosTrimestres.reduce((s, t) => s + (t.lc224 ? t.lc224.impactoBaseCSLL : 0), 0)),
      impactoIRPJAnual: _arredondar(resultadosTrimestres.reduce((s, t) => s + (t.lc224 ? t.lc224.impactoIRPJ : 0), 0)),
      impactoCSLLAnual: _arredondar(resultadosTrimestres.reduce((s, t) => s + (t.lc224 ? t.lc224.impactoCSLL : 0), 0)),
      trimestresAfetados: resultadosTrimestres.filter(t => t.lc224 && t.lc224.aplicada).map(t => t.trimestre),
      baseLegal: 'LC 224/2025, Art. 4º, §4º, VII; §5º'
    },

    detalhamentoTrimestral: resultadosTrimestres,
    detalhamentoMensal: resultadosMeses
  };
}



// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 11: VANTAGENS E DESVANTAGENS DO LUCRO PRESUMIDO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retorna a análise completa de vantagens e desvantagens do Lucro Presumido,
 * contextualizada para os dados da empresa.
 *
 * @param {Object} params
 * @param {number} params.receitaBrutaAnual
 * @param {number} params.despesasOperacionaisAnuais
 * @param {string} params.atividadeId
 * @param {boolean} [params.temReceitasSazonais=false]
 * @returns {Object}
 */
function analisarVantagensDesvantagens(params) {
  const {
    receitaBrutaAnual,
    despesasOperacionaisAnuais,
    atividadeId,
    temReceitasSazonais = false
  } = params;

  const atividadeIRPJ = PERCENTUAIS_PRESUNCAO_IRPJ.find(a => a.id === atividadeId);
  const percentualPresuncao = atividadeIRPJ ? atividadeIRPJ.percentual : 0.32;
  const lucroReal = receitaBrutaAnual - despesasOperacionaisAnuais;
  const margemReal = receitaBrutaAnual > 0 ? lucroReal / receitaBrutaAnual : 0;

  const vantagens = [
    {
      titulo: 'Simplicidade de Cálculo',
      descricao: 'Base de cálculo determinada por percentual fixo sobre receita bruta. Sem necessidade de controle detalhado de despesas para fins de IRPJ/CSLL.',
      impacto: 'alto',
      aplicavel: true
    },
    {
      titulo: 'Custo Contábil Menor',
      descricao: 'Economia estimada de R$ 6.000 a R$ 14.400/ano em honorários contábeis devido à simplicidade da apuração.',
      impacto: 'medio',
      aplicavel: true
    },
    {
      titulo: 'Não Necessita de LALUR',
      descricao: 'Dispensa LALUR/LACS e escrituração contábil complexa, reduzindo risco de erros.',
      impacto: 'medio',
      aplicavel: true
    },
    {
      titulo: 'Previsibilidade Tributária',
      descricao: 'Imposto previsível a partir da receita bruta. Facilita planejamento financeiro.',
      impacto: 'alto',
      aplicavel: true
    },
    {
      titulo: 'Dispensa de Comprovação de Despesas para IRPJ/CSLL',
      descricao: 'Despesas operacionais não afetam a base de cálculo. Menor risco de autuação por falta de comprovação.',
      impacto: 'medio',
      aplicavel: true
    },
    {
      titulo: 'Margem Real Superior à Presunção → Economia Tributária',
      descricao: `Margem de lucro real (${(margemReal * 100).toFixed(1)}%) ${margemReal > percentualPresuncao ? 'é SUPERIOR' : 'é INFERIOR'} ao percentual de presunção (${(percentualPresuncao * 100).toFixed(1)}%). ${margemReal > percentualPresuncao ? 'A empresa ECONOMIZA com o Presumido.' : 'A empresa PAGA MAIS com o Presumido.'}`,
      impacto: margemReal > percentualPresuncao ? 'alto' : 'negativo',
      aplicavel: margemReal > percentualPresuncao
    },
    {
      titulo: 'PIS/COFINS Cumulativo Simplificado',
      descricao: 'Alíquota combinada de 3,65% (vs 9,25% no não-cumulativo). Sem necessidade de controlar créditos.',
      impacto: 'alto',
      aplicavel: true
    },
    {
      titulo: 'Distribuição de Lucros Isentos',
      descricao: 'Sócios recebem lucros sem tributação adicional de IR (Art. 725 RIR/2018). Com escrituração completa, pode distribuir lucro contábil efetivo.',
      impacto: 'alto',
      aplicavel: true
    },
    {
      titulo: 'Regime de Caixa Disponível',
      descricao: 'Opção de reconhecer receita apenas quando efetivamente recebida. Melhora o fluxo de caixa.',
      impacto: 'medio',
      aplicavel: true
    },
    {
      titulo: 'Menor Risco de Autuação Fiscal',
      descricao: 'Base objetiva e fixa. Menor margem para divergências com a Receita Federal.',
      impacto: 'medio',
      aplicavel: true
    }
  ];

  const desvantagens = [
    {
      titulo: 'Margem Real Inferior à Presunção → Atenção ao Custo',
      descricao: `Sua margem de lucro real (${(margemReal * 100).toFixed(1)}%) é inferior à presunção (${(percentualPresuncao * 100).toFixed(1)}%). Isso significa que a base de IRPJ/CSLL é maior que o lucro efetivo. Foque em aumentar a margem operacional (reduzir custos, renegociar contratos, otimizar processos) para maximizar o benefício do LP.`,
      impacto: margemReal < percentualPresuncao ? 'critico' : 'baixo',
      aplicavel: margemReal < percentualPresuncao,
      valorImpacto: margemReal < percentualPresuncao
        ? _arredondar((receitaBrutaAnual * percentualPresuncao - lucroReal) * (ALIQUOTA_IRPJ + ALIQUOTA_CSLL))
        : 0
    },
    {
      titulo: 'Não Pode Deduzir Despesas Operacionais',
      descricao: 'Aluguel, telefone, energia, combustível, salários e demais despesas não reduzem a base de IRPJ/CSLL.',
      impacto: 'alto',
      aplicavel: true
    },
    {
      titulo: 'PIS/COFINS Sem Créditos',
      descricao: 'Embora a alíquota seja menor (3,65%), não há direito a créditos sobre insumos.',
      impacto: 'medio',
      aplicavel: true
    },
    {
      titulo: 'Apuração Trimestral Obrigatória',
      descricao: 'Imposto calculado e pago 4 vezes ao ano. Pode impactar fluxo de caixa em receitas sazonais.',
      impacto: temReceitasSazonais ? 'alto' : 'baixo',
      aplicavel: true
    },
    {
      titulo: 'Adicional de IRPJ Sobre Base Elevada',
      descricao: `Adicional de 10% sobre base que excede R$ 60.000/trimestre (R$ 240.000/ano). Base anual estimada: R$ ${_formatarMoeda(receitaBrutaAnual * percentualPresuncao)}.`,
      impacto: (receitaBrutaAnual * percentualPresuncao) > 240000 ? 'alto' : 'baixo',
      aplicavel: (receitaBrutaAnual * percentualPresuncao) > 240000
    },
    {
      titulo: 'ISS Cobrado Por Fora',
      descricao: 'ISS municipal é pago adicionalmente, diferente do Simples Nacional onde está incluído na alíquota única.',
      impacto: 'medio',
      aplicavel: true
    }
  ];

  return {
    atividade: atividadeIRPJ ? atividadeIRPJ.descricao : atividadeId,
    percentualPresuncao: `${(percentualPresuncao * 100).toFixed(1)}%`,
    margemLucroReal: `${(margemReal * 100).toFixed(1)}%`,
    analise: margemReal > percentualPresuncao
      ? 'FAVORÁVEL — Margem real superior à presunção. Lucro Presumido tende a ser vantajoso.'
      : 'DESFAVORÁVEL — Margem real inferior à presunção. Lucro Presumido tende a ser desvantajoso.',
    vantagens: vantagens.filter(v => v.aplicavel),
    desvantagens: desvantagens.filter(d => d.aplicavel),
    todasVantagens: vantagens,
    todasDesvantagens: desvantagens,
    pontuacao: {
      vantagensAplicaveis: vantagens.filter(v => v.aplicavel).length,
      desvantagensAplicaveis: desvantagens.filter(d => d.aplicavel).length,
      desvantagensCriticas: desvantagens.filter(d => d.impacto === 'critico').length
    }
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 12: RISCOS FISCAIS E PEGADINHAS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lista de riscos fiscais e pegadinhas comuns no Lucro Presumido.
 * Cada item inclui descrição, consequência, exemplo e prevenção.
 */
const RISCOS_FISCAIS = [
  {
    id: 'receitas_financeiras_esquecidas',
    titulo: 'Receitas Financeiras Não Adicionadas à Base',
    descricao: 'Rendimentos de aplicações, juros e demais receitas financeiras devem ser adicionados integralmente à base de IRPJ/CSLL (Art. 595 RIR/2018).',
    consequencia: 'Omissão de receita. Multa de 75% do imposto não recolhido.',
    prevencao: 'Revisar todos os extratos bancários mensalmente. Incluir rendimentos financeiros na base.',
    gravidade: 'alta'
  },
  {
    id: 'omissao_receita',
    titulo: 'Omissão de Receita (Art. 601 RIR/2018)',
    descricao: 'Toda receita deve ser declarada. A Receita Federal cruza dados de notas fiscais, extratos bancários e declarações.',
    consequencia: 'Montante omitido é computado na base com multa de 75%. Pode chegar a 150% em caso de fraude.',
    prevencao: 'Emitir NF para toda operação. Reconciliar receitas com extratos bancários.',
    gravidade: 'critica'
  },
  {
    id: 'distribuicao_lucros_excessiva',
    titulo: 'Distribuição de Lucros Isentos Acima do Permitido',
    descricao: 'Lucro distribuído isento não pode exceder: base presumida − tributos federais (ou lucro contábil − tributos, se houver escrituração completa).',
    consequencia: 'Excedente é tributado como lucro distribuído (15% + adicional).',
    prevencao: 'Calcular o limite antes de distribuir. Manter escrituração contábil completa para ampliar o limite.',
    gravidade: 'alta'
  },
  {
    id: 'adicional_irpj_esquecido',
    titulo: 'Não Recolhimento do Adicional de IRPJ',
    descricao: 'Adicional de 10% sobre base que excede R$ 60.000/trimestre é frequentemente esquecido.',
    consequencia: 'Falta de recolhimento + multa de 75% + juros SELIC.',
    prevencao: 'Automatizar o cálculo. Sempre verificar se base > R$ 60.000.',
    gravidade: 'alta'
  },
  {
    id: 'confusao_receita_bruta_liquida',
    titulo: 'Confusão Entre Receita Bruta e Receita Líquida',
    descricao: 'Percentual de presunção incide sobre receita bruta (deduzida de devoluções, cancelamentos e descontos incondicionais), não sobre receita líquida de impostos.',
    consequencia: 'Base de cálculo incorreta. Autuação fiscal.',
    prevencao: 'Usar definição correta do Art. 208 RIR/2018.',
    gravidade: 'media'
  },
  {
    id: 'atividades_mistas_percentual_unico',
    titulo: 'Usar Percentual Único para Atividades Mistas',
    descricao: 'Empresa com receitas de diferentes percentuais deve aplicar o percentual correto a cada tipo de receita.',
    consequencia: 'Base maior ou menor que a devida. Autuação em ambos os casos.',
    prevencao: 'Segregar receitas por atividade/CNAE. Aplicar percentual individual.',
    gravidade: 'alta'
  },
  {
    id: 'percentual_16_indevido',
    titulo: 'Uso Indevido do Percentual de 16%',
    descricao: 'O percentual de 16% aplica-se APENAS a transporte de passageiros. Serviços técnicos, consultoria e engenharia são 32%.',
    consequencia: 'Autuação fiscal com multa de 75%.',
    prevencao: 'Verificar CNAE e jurisprudência. Serviços técnicos = 32%.',
    gravidade: 'alta'
  },
  {
    id: 'prejuizo_paga_imposto',
    titulo: 'Empresa com Prejuízo Operacional Paga Imposto',
    descricao: 'No Lucro Presumido, imposto é calculado sobre base presumida, independentemente de prejuízo real.',
    consequencia: 'Pagamento de imposto mesmo sem lucro. Pode comprometer caixa.',
    prevencao: 'Monitorar margem de lucro efetiva vs presunção. Se margem cair, avaliar adequação das alíquotas de presunção.',
    gravidade: 'critica'
  },
  {
    id: 'compensacao_irrf_indevida',
    titulo: 'Compensação Indevida de IRRF',
    descricao: 'IRRF só pode ser compensado no trimestre de apuração correspondente, sobre as mesmas receitas.',
    consequencia: 'Compensação glosada. Multa + juros.',
    prevencao: 'Compensar IRRF apenas no trimestre correto. Documentar por período.',
    gravidade: 'media'
  },
  {
    id: 'ganhos_capital_nao_adicionados',
    titulo: 'Ganhos de Capital Não Adicionados à Base',
    descricao: 'Venda de equipamentos, veículos, imóveis — o ganho de capital deve ser adicionado à base de IRPJ/CSLL.',
    consequencia: 'Omissão de receita. Multa de 75%.',
    prevencao: 'Registrar toda alienação de ativos. Calcular ganho de capital e adicionar à base.',
    gravidade: 'alta'
  }
];


// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 13: TRANSIÇÃO ENTRE REGIMES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Informações sobre transição entre regimes tributários.
 */
const TRANSICOES = {
  SIMPLES_PARA_PRESUMIDO: {
    descricao: 'Transição do Simples Nacional para Lucro Presumido',
    procedimentos: [
      'Comunicar desenquadramento do Simples à RFB até o último dia do mês anterior à mudança.',
      'Manifestar opção pelo Presumido com pagamento do 1º DARF de IRPJ/CSLL.',
      'Fazer balanço de transição e ajustar saldos contábeis.',
      'Implementar obrigações acessórias do Presumido (DCTF, ECF, EFD-Contribuições).',
      'Registrar passivos tributários de ISS, PIS/COFINS que passam a ser apurados separadamente.'
    ],
    alertas: [
      'Opção é irretratável durante o ano-calendário (Lei 9.430/1996, Art. 26).',
      'ISS passa a ser pago separadamente (não mais incluído no DAS).',
      'PIS/COFINS mudam para regime cumulativo (0,65% + 3%).'
    ],
    baseLegal: 'LC 123/2006, Art. 30 e Lei 9.430/1996, Art. 26'
  },

  PRESUMIDO_PARA_REAL: {
    descricao: 'Transição do Lucro Presumido para Lucro Real',
    procedimentos: [
      'Manifestar opção pelo LR com pagamento de estimativa ou LALUR no 1º trimestre.',
      'Implementar escrituração contábil completa (ECD obrigatória).',
      'Abrir LALUR/LACS para controle de adições e exclusões.',
      'Levantar balanço de abertura no LR.',
      'Verificar estoque de prejuízos fiscais anteriores (só se houver).',
      'Adequar sistema para PIS/COFINS não-cumulativo (9,25% com créditos).'
    ],
    alertas: [
      'Opção é irretratável para o ano-calendário.',
      'NÃO é possível compensar prejuízos do período no LP.',
      'PIS/COFINS muda para regime não-cumulativo (9,25% COM créditos sobre insumos).',
      'Custo contábil aumenta significativamente.'
    ],
    baseLegal: 'Lei 9.430/1996, Art. 26; Lei 9.718/1998, Art. 14'
  },

  REAL_PARA_PRESUMIDO: {
    descricao: 'Transição do Lucro Real para Lucro Presumido',
    procedimentos: [
      'Verificar se PJ atende TODOS os requisitos do LP (receita ≤ R$ 78M, sem vedações).',
      'Manifestar opção com 1º DARF de IRPJ-LP do 1º trimestre.',
      'OBRIGATÓRIO: adicionar saldos de tributação diferida do LALUR à base do 1º trimestre (Art. 54 Lei 9.430/96).',
      'Verificar saldos de depreciação acelerada, variação cambial diferida, provisões.',
      'Simplificar escrituração (pode usar Livro Caixa em vez de ECD).'
    ],
    alertas: [
      'Saldos diferidos do LALUR devem ser oferecidos à tributação no 1º trimestre — NÃO pode "esquecer".',
      'Prejuízos fiscais acumulados no LR são PERDIDOS (não compensáveis no LP).',
      'PIS/COFINS volta ao regime cumulativo (3,65% SEM créditos).',
      'Distribuição de lucros: limite passa a ser base presumida − tributos (ou lucro contábil se mantiver ECD).'
    ],
    baseLegal: 'Lei 9.430/1996, Arts. 26 e 54'
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 14A: BASE LEGAL COMPLEMENTAR
// ─────────────────────────────────────────────────────────────────────────────
//
// Detalhamento das referências legais citadas no motor de cálculo.
// Cada constante contém baseLegal com citação precisa (Lei, Artigo, Parágrafo).
// Adicionado na v3.4.0.
//

/**
 * Vedações detalhadas ao Lucro Presumido — Art. 14 da Lei 9.718/1998.
 * Base Legal: Lei 9.718/1998, Art. 14 (redação atualizada pela Lei 12.814/2013 e Lei 14.430/2022).
 *
 * Lista todos os incisos I a VIII com a redação vigente.
 */
const VEDACOES_LP_DETALHADAS = [
  {
    inciso: 'I',
    descricao: 'Receita bruta total no ano-calendário anterior superior a R$ 78.000.000,00',
    baseLegal: 'Lei 9.718/1998, Art. 14, I (redação Lei 12.814/2013, Art. 7º)',
    nota: 'Limite anterior de R$ 48.000.000 (Lei 10.637/2002) revogado pela Lei 12.814/2013'
  },
  {
    inciso: 'II',
    descricao: 'Instituições financeiras: bancos comerciais, bancos de investimento, bancos de desenvolvimento, caixas econômicas, sociedades de crédito, financiamento e investimento, sociedades de crédito imobiliário, corretoras de títulos e valores mobiliários, distribuidoras de títulos e valores mobiliários, empresas de arrendamento mercantil, cooperativas de crédito, empresas de seguros privados, entidades de previdência privada aberta e empresas de capitalização',
    baseLegal: 'Lei 9.718/1998, Art. 14, II'
  },
  {
    inciso: 'III',
    descricao: 'Que tiverem lucros, rendimentos ou ganhos de capital oriundos do exterior',
    baseLegal: 'Lei 9.718/1998, Art. 14, III'
  },
  {
    inciso: 'IV',
    descricao: 'Que, autorizadas pela legislação tributária, usufruam de benefícios fiscais relativos à isenção ou redução do imposto, calculado com base no lucro da exploração',
    baseLegal: 'Lei 9.718/1998, Art. 14, IV (cf. Lei 11.941/2009, Art. 19)'
  },
  {
    inciso: 'V',
    descricao: 'Que, no decorrer do ano-calendário, tenham efetuado pagamento mensal pelo regime de estimativa (Lei 9.430/96, Art. 2º)',
    baseLegal: 'Lei 9.718/1998, Art. 14, V'
  },
  {
    inciso: 'VI',
    descricao: 'Que explorem atividade de factoring: prestação cumulativa e contínua de serviços de assessoria creditícia, mercadológica, gestão de crédito, seleção de riscos, administração de contas a pagar e a receber, compras de direitos creditórios resultantes de vendas mercantis a prazo ou de prestação de serviços',
    baseLegal: 'Lei 9.718/1998, Art. 14, VI',
    nota: 'Factoring pode optar pelo LP desde a Lei 12.249/2010; vedação original do inciso VI foi alterada. Verificar redação vigente.'
  },
  {
    inciso: 'VII',
    descricao: 'Que possuam parcela do resultado de Sociedade em Conta de Participação (SCP), quando o sócio ostensivo for tributado pelo Lucro Real',
    baseLegal: 'Lei 9.718/1998, Art. 14, VII'
  },
  {
    inciso: 'VIII',
    descricao: 'Que exerçam atividade de securitização de créditos imobiliários, financeiros e do agronegócio',
    baseLegal: 'Lei 9.718/1998, Art. 14, VIII (incluído pela Lei 14.430/2022)'
  }
];

/**
 * PIS/COFINS Cumulativo — Arts. 2º e 3º da Lei 9.718/1998.
 * Base Legal: Lei 9.718/1998, Arts. 2º e 3º.
 *
 * No Lucro Presumido, PIS/COFINS segue regime CUMULATIVO.
 */
const PIS_COFINS_LEI_9718 = {
  baseLegal: 'Lei 9.718/1998, Arts. 2º e 3º',
  art2: {
    descricao: 'As contribuições para PIS/PASEP e COFINS são devidas pelas pessoas jurídicas de direito privado e as que lhes são equiparadas pela legislação do imposto de renda',
    baseCalculo: 'Receita bruta da pessoa jurídica (regime cumulativo quando LP)',
    aliquotas: { PIS: 0.0065, COFINS: 0.03 }
  },
  art3ExclusoesReceitaBruta: [
    { inciso: 'I', descricao: 'Vendas canceladas' },
    { inciso: 'II', descricao: 'Descontos incondicionais concedidos' },
    { inciso: 'III', descricao: 'IPI quando destacado como receita na nota fiscal' },
    { inciso: 'IV', descricao: 'ICMS-ST cobrado como substituto tributário' },
    { inciso: 'V', descricao: 'Receitas de exportação de mercadorias e serviços (CF/88, Art. 149, §2º, I)' }
  ],
  art3Paragrafo1: 'Na determinação da base de cálculo, são também excluídas as receitas isentas ou com alíquota reduzida a zero',
  nota: 'No LP, não há direito a créditos de PIS/COFINS (regime cumulativo). PIS/COFINS não-cumulativo aplica-se ao Lucro Real.'
};

/**
 * Limite de receita bruta para opção pelo Lucro Presumido.
 * Atualizado pela Lei 12.814/2013, Art. 7º (revoga limite anterior de R$ 48M da Lei 10.637/2002).
 * Base Legal: Lei 12.814/2013, Art. 7º c/c Lei 9.718/1998, Art. 14, I.
 *
 * Nota: O limite de R$ 78.000.000,00 vigora desde 01/01/2014.
 */
const HISTORICO_LIMITE_RECEITA_LP = {
  baseLegal: 'Lei 12.814/2013, Art. 7º c/c Lei 9.718/1998, Art. 14, I',
  limiteAtual: 78_000_000.00,
  vigenciaAtual: 'Desde 01/01/2014',
  historico: [
    { limite: 24_000_000.00, vigencia: 'Até 31/12/2002', lei: 'Lei 9.718/1998, Art. 14 (redação original)' },
    { limite: 48_000_000.00, vigencia: '01/01/2003 a 31/12/2013', lei: 'Lei 10.637/2002' },
    { limite: 78_000_000.00, vigencia: 'A partir de 01/01/2014', lei: 'Lei 12.814/2013, Art. 7º' }
  ]
};

/**
 * Base Legal da CSLL 32% para serviços.
 * Lei 10.684/2003, Art. 22 — Altera Art. 20 da Lei 9.249/1995.
 *
 * Atividades com CSLL 32%: serviços em geral, intermediação de negócios,
 * locação/cessão de bens móveis, factoring.
 * Vigência: a partir de 01/09/2003.
 *
 * Nota: A referência correta para os 32% da CSLL é:
 * Lei 9.249/95, Art. 20, caput, com redação dada pela Lei 10.684/2003, Art. 22.
 * Anteriormente, a CSLL de serviços era 12% (como comércio/indústria).
 */
const CSLL_32PCT_SERVICOS = {
  baseLegal: 'Lei 9.249/95, Art. 20, caput, com redação dada pela Lei 10.684/2003, Art. 22',
  vigencia: 'A partir de 01/09/2003',
  percentual: 0.32,
  atividadesAbrangidas: [
    'Prestação de serviços em geral (exceto hospitalares e transporte)',
    'Intermediação de negócios',
    'Administração, locação ou cessão de bens imóveis, móveis e direitos de qualquer natureza',
    'Factoring (prestação cumulativa e contínua de assessoria creditícia)'
  ],
  nota: 'Antes da Lei 10.684/2003, serviços em geral tinham CSLL de 12%. A alteração elevou para 32% alinhando com o percentual do IRPJ para essas atividades.'
};

/**
 * Requisitos detalhados para presunção reduzida de 8% em serviços hospitalares.
 * Base Legal: Lei 11.727/2008, Art. 29; Lei 9.249/95, Art. 15, §1º, III, "a";
 *             IN RFB 1.700/2017, Art. 33, §3º e §4º.
 *
 * REQUISITOS CUMULATIVOS: ambos devem ser atendidos simultaneamente.
 */
const REQUISITOS_HOSPITALAR_8PCT = {
  baseLegal: 'Lei 11.727/2008, Art. 29; Lei 9.249/95, Art. 15, §1º, III, "a"; IN RFB 1.700/2017, Art. 33, §3º e §4º',
  requisitos: [
    {
      id: 'sociedade_empresaria',
      descricao: 'Ser sociedade empresária registrada na Junta Comercial (NÃO pode ser sociedade simples)',
      fundamentacao: 'Lei 11.727/2008, Art. 29; CC/2002, Art. 982'
    },
    {
      id: 'normas_anvisa',
      descricao: 'Cumprir normas da ANVISA para funcionamento',
      fundamentacao: 'Lei 11.727/2008, Art. 29'
    }
  ],
  servicosAbrangidos: [
    'Serviços hospitalares propriamente ditos',
    'Serviços de auxílio diagnóstico e terapia',
    'Patologia clínica',
    'Imagenologia (RX, ultrassom, tomografia, ressonância)',
    'Anatomia patológica e citopatologia',
    'Medicina nuclear',
    'Análises e patologias clínicas',
    'Radioterapia, quimioterapia, diálise, hemoterapia',
    'Serviços de pronto-socorro',
    'Cirurgias (em ambiente hospitalar)'
  ],
  servicosNaoAbrangidos: [
    'Simples consultas médicas (em consultório)',
    'Serviço de profissional liberal individual',
    'Serviços prestados em clínica SEM internação ou procedimentos complexos'
  ],
  alertaFalha: 'Se NÃO atender AMBOS os requisitos cumulativos → presunção sobe para 32% (IRPJ) e 32% (CSLL)'
};

/**
 * Regulamentação detalhada da IN RFB 1.700/2017 (atual IN RFB 2.058/2021).
 * Artigos relevantes para o Lucro Presumido.
 *
 * Base Legal: IN RFB 1.700/2017 e IN RFB 2.058/2021.
 */
const REGULAMENTACAO_IN_RFB = {
  distribuicaoLucros: {
    artigo: 'IN RFB 1.700/2017, Art. 238 (atual IN RFB 2.058/2021)',
    regra: 'Lucros isentos = base presumida MENOS todos os impostos e contribuições (IRPJ + CSLL + PIS + COFINS)',
    escrituracaoContabil: 'Se PJ mantiver escrituração contábil completa (ECD), pode distribuir lucro contábil efetivo se maior que a presunção fiscal',
    baseLegalECD: 'IN RFB 1.700/2017, Art. 238, parágrafo único'
  },
  regimeCaixa: {
    artigo: 'IN RFB 1.700/2017, Art. 215 e Lei 8.981/1995, Art. 30',
    regra: 'PJ no LP pode optar pelo regime de caixa para reconhecimento de receitas',
    condicoes: [
      'Opção manifestada na ECF do ano-calendário',
      'Irretratável para o ano inteiro',
      'Aplicável apenas para receitas de venda de bens/serviços a prazo',
      'Receitas financeiras e ganhos de capital seguem regime de competência'
    ],
    atividadesImobiliarias: 'Atividades imobiliárias (loteamento, incorporação, construção p/ venda) DEVEM usar regime de caixa — Art. 30 da Lei 8.981/95'
  },
  construcaoComMaterial: {
    artigo: 'IN RFB 1.700/2017, Art. 33, §4º',
    regra: 'Empreitada com fornecimento de TODOS os materiais indispensáveis à obra: percentual de 8%',
    requisito: 'Contrato deve prever expressamente o fornecimento de TODOS os materiais. Se parcial → 32%'
  },
  atividadesMistas: {
    artigo: 'Lei 9.249/95, Art. 15, §2º; IN RFB 1.700/2017, Art. 33, §1º',
    regra: 'PJ com atividades diversificadas: aplicar percentual correspondente a CADA atividade separadamente'
  }
};

/**
 * Conceito legal de Receita Bruta — DL 1.598/1977, Art. 12.
 * Redação dada pela Lei 12.973/2014.
 *
 * Base Legal: Decreto-Lei 1.598/1977, Art. 12 (redação Lei 12.973/2014).
 * Esta definição se aplica tanto ao Lucro Real quanto ao Presumido
 * para fins de aplicação dos percentuais de presunção.
 */
const CONCEITO_RECEITA_BRUTA = {
  baseLegal: 'Decreto-Lei 1.598/1977, Art. 12 (redação Lei 12.973/2014)',
  componentes: [
    'I — Produto da venda de bens nas operações de conta própria',
    'II — Preço da prestação de serviços em geral',
    'III — Resultado auferido nas operações de conta alheia',
    'IV — Receitas da atividade ou objeto principal não compreendidas nos incisos I a III'
  ],
  exclusoes: [
    'Devoluções e vendas canceladas',
    'Descontos incondicionais concedidos',
    'Tributos sobre ela incidentes (IPI, ICMS-ST quando destacado pelo substituto)',
    'Valores decorrentes do ajuste a valor presente (Lei 6.404/76, Art. 183, VIII)'
  ],
  nota: 'Esta definição se aplica tanto ao Lucro Real quanto ao Presumido para fins de aplicação dos percentuais de presunção.'
};

/**
 * Regras específicas do Lucro Presumido — Lei 9.430/1996, Arts. 51-54 e Art. 26.
 * Base Legal: Lei 9.430/1996.
 *
 * Detalha artigos referenciados nos cálculos mas não formalizados como constantes.
 */
const REGRAS_ESPECIFICAS_LP_9430 = {
  jcpEFinanceiros: {
    artigo: 'Lei 9.430/1996, Art. 51',
    regra: 'JCP recebidos e rendimentos/ganhos de operações financeiras são ADICIONADOS ao lucro presumido. IR-fonte sobre eles é ANTECIPAÇÃO do devido.',
    nota: 'Diferente do que ocorre no art. 76, II da Lei 8.981/95 (que torna IR-fonte definitivo para renda fixa/variável), o art. 51 da Lei 9.430 torna a retenção em ANTECIPAÇÃO.'
  },
  ganhoCapitalReavaliacao: {
    artigo: 'Lei 9.430/1996, Art. 52',
    regra: 'Na apuração de ganho de capital no LP, valores de reavaliação SÓ podem ser computados no custo se comprovado que foram tributados.'
  },
  valoresRecuperados: {
    artigo: 'Lei 9.430/1996, Art. 53',
    regra: 'Valores recuperados (custos, despesas, perdas de crédito deduzidos anteriormente) devem ser ADICIONADOS ao lucro presumido.',
    excecao: 'Exceto se comprovar que: (a) não deduziu no lucro real anterior; ou (b) refere-se a período já no presumido.'
  },
  transicaoRealParaPresumido: {
    artigo: 'Lei 9.430/1996, Art. 54 (redação Lei 12.973/2014)',
    regra: 'PJ que migra do Lucro Real para Presumido deve ADICIONAR à base do 1º período TODOS os saldos de tributação diferida controlados no LALUR/e-LALUR.',
    exemplos: [
      'Depreciação acelerada não tributada',
      'Variação cambial diferida',
      'Provisões temporariamente indedutíveis que foram excluídas do lucro real',
      'Lucro inflacionário diferido (se remanescente)'
    ]
  },
  opcaoIrretratavel: {
    artigo: 'Lei 9.430/1996, Art. 26',
    regras: [
      '§1º: Opção manifestada com pagamento da 1ª ou única quota do 1º trimestre',
      '§2º: PJ que iniciar no 2º trimestre manifesta no 1º DARF do trimestre de início',
      '§3º: Mudança para LR no mesmo ano → multa + juros sobre diferença',
      '§4º: Mudança só admitida antes da ECF e antes de procedimento de ofício'
    ]
  }
};

/**
 * Mapa de artigos do RIR/2018 (Decreto 9.580/2018) relevantes ao Lucro Presumido.
 * Base Legal: Decreto 9.580/2018 — Regulamento do Imposto de Renda.
 *
 * Consolida todos os artigos do RIR referenciados no motor de cálculo.
 */
const MAPA_RIR_2018_LP = {
  titulo: 'Decreto 9.580/2018 — Regulamento do Imposto de Renda — Artigos do Lucro Presumido',
  artigos: {
    'Art. 587': { tema: 'Limite de receita bruta para opção pelo LP', leiOrigem: 'Lei 9.718/98, Art. 14' },
    'Art. 588': { tema: 'Período de apuração trimestral', leiOrigem: 'Lei 9.430/96, Art. 1º' },
    'Art. 589': { tema: 'Manifestação da opção', leiOrigem: 'Lei 9.430/96, Art. 26' },
    'Art. 590': { tema: 'Percentual de presunção 8% (caput)', leiOrigem: 'Lei 9.249/95, Art. 15' },
    'Art. 591': { tema: 'Percentual 1,6% — combustíveis', leiOrigem: 'Lei 9.249/95, Art. 15, §1º, I' },
    'Art. 592': { tema: 'Percentual 16% — transporte passageiros e financeiras', leiOrigem: 'Lei 9.249/95, Art. 15, §1º, II' },
    'Art. 593': { tema: 'Percentual 32% — serviços, intermediação, locação, factoring', leiOrigem: 'Lei 9.249/95, Art. 15, §1º, III' },
    'Art. 594': { tema: 'Atividades diversificadas', leiOrigem: 'Lei 9.249/95, Art. 15, §2º' },
    'Art. 595': { tema: 'Acréscimos à base (ganhos de capital, receitas financeiras, etc.)', leiOrigem: 'Lei 8.981/95, Art. 32; Lei 9.430/96, Art. 25, II' },
    'Art. 596': { tema: 'Conceito de receita bruta', leiOrigem: 'DL 1.598/77, Art. 12' },
    'Art. 597': { tema: 'Regime de caixa — atividades imobiliárias', leiOrigem: 'Lei 8.981/95, Art. 30' },
    'Art. 598': { tema: 'Alíquota 15% + adicional 10%', leiOrigem: 'Lei 9.249/95, Art. 3º; Lei 9.430/96, Art. 4º' },
    'Art. 599': { tema: 'Pagamento em quotas (até 3)', leiOrigem: 'Lei 9.430/96, Art. 5º' },
    'Art. 600': { tema: 'Deduções do imposto apurado (IRRF, incentivos)', leiOrigem: 'Lei 8.981/95, Art. 34' },
    'Art. 601': { tema: 'Omissão de receita', leiOrigem: 'Lei 9.249/95, Art. 24' },
    'Art. 624': { tema: 'Adicional do IRPJ — cálculo trimestral', leiOrigem: 'Lei 9.249/95, Art. 3º, §1º' },
    'Art. 725': { tema: 'Isenção de dividendos na distribuição', leiOrigem: 'Lei 9.249/95, Art. 10' },
    'Art. 257': { tema: 'PJs obrigadas ao Lucro Real (vedações ao LP)', leiOrigem: 'Lei 9.718/98, Art. 14' }
  }
};

/**
 * Histórico da alíquota CSLL.
 * Base Legal: Lei 7.689/1988 c/c alterações posteriores.
 *
 * - Lei 7.689/1988: Instituiu a CSLL (alíquota original variou)
 * - Lei 9.249/1995, Art. 19: Fixou em 8%
 * - Lei 10.637/2002, Art. 37: Elevou para 9% (vigente desde 01/02/2003)
 * - Instituições financeiras: 15% (Lei 13.169/2015) ou 20% em períodos específicos
 *
 * Alíquota vigente regra geral: 9%
 * Base Legal consolidada: Lei 7.689/88 c/c Lei 10.637/2002, Art. 37
 */
const HISTORICO_ALIQUOTA_CSLL = {
  baseLegal: 'Lei 7.689/1988 c/c Lei 10.637/2002, Art. 37',
  aliquotaVigente: 0.09,
  historico: [
    { aliquota: 'Variável', vigencia: '1989–1995', lei: 'Lei 7.689/1988 (redação original)' },
    { aliquota: 0.08, vigencia: '1996–2002', lei: 'Lei 9.249/1995, Art. 19' },
    { aliquota: 0.09, vigencia: 'Desde 01/02/2003', lei: 'Lei 10.637/2002, Art. 37' }
  ],
  nota: 'Alíquota de 9% aplica-se a todas as PJ não-financeiras, inclusive no Lucro Presumido.'
};

/**
 * Alterações da Lei 12.973/2014 com impacto no Lucro Presumido.
 * Base Legal: Lei 12.973/2014.
 * Vigência: a partir de 01/01/2015 (opção antecipada em 2014).
 */
const ALTERACOES_LEI_12973_2014 = {
  baseLegal: 'Lei 12.973/2014',
  vigencia: 'A partir de 01/01/2015 (opção antecipada em 2014)',
  impactosNoLP: [
    {
      tema: 'Ganho de capital — investimento, imobilizado e intangível',
      artigo: 'Altera Lei 9.430/96, Art. 25, §1º',
      regra: 'Ganho = valor alienação − valor contábil (depreciação acumulada considerada)'
    },
    {
      tema: 'Ajuste a valor presente',
      artigo: 'Altera Lei 9.430/96, Art. 25, inciso II',
      regra: 'Ajuste a valor presente (Lei 6.404/76, Art. 183, VIII) deve ser adicionado à base'
    },
    {
      tema: 'Valor justo — exclusão',
      artigo: 'Altera Lei 9.430/96, Art. 25, §3º',
      regra: 'Ganhos de avaliação a valor justo NÃO integram a base quando apurados'
    },
    {
      tema: 'Transição LR → LP — saldos diferidos',
      artigo: 'Altera Lei 9.430/96, Art. 54',
      regra: 'Obrigação de adicionar saldos de tributação diferida no 1º período de LP'
    },
    {
      tema: 'Definição de receita bruta',
      artigo: 'Altera DL 1.598/77, Art. 12',
      regra: 'Nova definição de receita bruta abrangendo receitas da atividade principal'
    }
  ]
};

/**
 * Tabela consolidada de multas e penalidades fiscais.
 * Referências legais diversas — detalhamento dos RISCOS_FISCAIS.
 */
const MULTAS_E_PENALIDADES = {
  moraVoluntaria: {
    baseLegal: 'Lei 9.430/1996, Art. 61',
    calculo: '0,33% por dia de atraso, limitado a 20%',
    juros: 'SELIC acumulada + 1% no mês do pagamento'
  },
  lancamentoOficio: {
    baseLegal: 'Lei 9.430/1996, Art. 44 (redação Lei 14.689/2023)',
    multa75: 'Falta de pagamento, declaração inexata, falta de declaração',
    multa100: 'Sonegação, fraude, conluio (arts. 71-73 da Lei 4.502/64)',
    multa150: 'Reincidência (dentro de 2 anos) nos casos de sonegação/fraude/conluio'
  },
  omissaoReceita: {
    baseLegal: 'Lei 9.249/1995, Art. 24',
    multa: '300% sobre a diferença de imposto devida por omissão de receita no LP',
    nota: 'No LP diversificado, receita omitida é atribuída à atividade com percentual MAIS ALTO'
  },
  atrasoDeclaracao: {
    baseLegal: 'Lei 8.981/1995, Art. 88',
    multa: '1% ao mês sobre IR devido (mínimo R$ 500 para PJ)',
    maximo: '20% do IR devido'
  },
  dctfAtraso: {
    baseLegal: 'Lei 10.426/2002, Art. 7º',
    multa: '2% ao mês sobre tributos informados (mínimo R$ 500)',
    maximo: '20% dos tributos informados'
  },
  ecfAtraso: {
    baseLegal: 'IN RFB 1.422/2013, Art. 6º; Lei 12.766/2012, Art. 8º',
    multaReceita0a3_6M: 'R$ 500/mês de atraso',
    multaReceitaAcima3_6M: 'R$ 1.500/mês de atraso',
    nota: 'Pode ser reduzida em 50% se entregue antes de intimação'
  }
};

/**
 * Retenções na fonte aplicáveis ao Lucro Presumido — detalhamento completo.
 * Inclui IRRF, CSRF e retenções da Administração Pública.
 *
 * Base Legal: Decreto 9.580/2018 (RIR), Lei 10.833/2003, Lei 9.430/1996.
 */
const RETENCOES_FONTE_LP = {
  irrfServicos: {
    baseLegal: 'Decreto 9.580/2018, Art. 714; IN RFB 1.234/2012',
    aliquota: 0.015,
    codigoDARF: '1708',
    aplicacao: 'Serviços profissionais prestados por PJ a outras PJs',
    limiteDispensa: 10.00,
    limiteDispensaBaseLegal: 'Lei 9.430/96, Art. 67',
    natureza: 'Antecipação do IRPJ devido (compensável no trimestre)'
  },
  irrfAdmPublica: {
    baseLegal: 'Lei 9.430/1996, Art. 64',
    formula: 'Valor pago × percentual presunção (art. 15 Lei 9.249) × 15%',
    codigoDARF: '6190',
    aplicacao: 'Pagamentos de órgãos federais a PJs',
    natureza: 'Antecipação (compensável com IRPJ mesma espécie — art. 64, §4º)'
  },
  csllAdmPublica: {
    baseLegal: 'Lei 9.430/1996, Art. 64, §6º',
    aliquota: 0.01,
    codigoDARF: '6190',
    natureza: 'Antecipação (compensável apenas com CSLL)'
  },
  csrf: {
    baseLegal: 'Lei 10.833/2003, Arts. 30-35',
    aliquotas: { PIS: 0.0065, COFINS: 0.03, CSLL: 0.01, total: 0.0465 },
    codigoDARF: '5952',
    limiteDispensa: 5000.00,
    natureza: 'Antecipação (cada tributo compensável com sua espécie)',
    dispensas: [
      'Pagamentos ≤ R$ 5.000/mês ao mesmo fornecedor (Lei 10.833/2003, Art. 31, §3º)',
      'Pagamentos a PJs optantes pelo Simples Nacional',
      'Pagamentos a PJs imunes ou isentas'
    ]
  },
  irrfAluguel: {
    baseLegal: 'RIR/2018, Art. 683',
    aliquota: 0.015,
    codigoDARF: '3208',
    aplicacao: 'Aluguéis pagos por PJ a outra PJ',
    natureza: 'Antecipação do IRPJ'
  }
};

/**
 * Compensação tributária — PER/DCOMP.
 * Base Legal: Lei 9.430/1996, Art. 74; IN RFB 1.717/2017.
 */
const COMPENSACAO_TRIBUTARIA = {
  baseLegal: 'Lei 9.430/1996, Art. 74; IN RFB 1.717/2017',
  regras: [
    'Crédito tributário (restituição ou ressarcimento) pode ser compensado com débitos próprios administrados pela RFB',
    'Compensação via DCOMP (Declaração de Compensação) ou PER (Pedido de Restituição)',
    'Cada espécie de tributo retido só compensa com a mesma espécie (IRRF → IRPJ; CSLL retida → CSLL)',
    'Vedada compensação de tributo com exigibilidade suspensa'
  ],
  vedacoesLP: [
    'A vedação do art. 74, §3º, IX (débitos de estimativa mensal) NÃO se aplica ao LP — aplica-se apenas ao Lucro Real por estimativa',
    'LP pode compensar normalmente via DCOMP'
  ],
  limiteCreditoJudicial: {
    baseLegal: 'Lei 9.430/96, Art. 74-A (Lei 14.873/2024)',
    regra: 'Créditos judiciais > R$ 10 milhões: compensação limitada a 1/60 por mês (mínimo)',
    nota: 'Verificar se PJ tem crédito judicial antes de planejar compensações'
  },
  darf_minimo: {
    baseLegal: 'Lei 9.430/1996, Arts. 67 e 68',
    regraRetencao: 'Dispensada retenção de IRRF ≤ R$ 10,00',
    regraDARF: 'Vedado DARF < R$ 10,00 — acumular para períodos seguintes'
  }
};

/**
 * Detalhamento do ISS — Lei Complementar 116/2003.
 * Base Legal: LC 116/2003 c/c LC 157/2016.
 */
const ISS_DETALHAMENTO = {
  baseLegal: 'Lei Complementar 116/2003',
  aliquotaMinima: 0.02,
  aliquotaMinimaBaseLegal: 'LC 157/2016, Art. 8-A',
  aliquotaMaxima: 0.05,
  regras: [
    'ISS é tributo MUNICIPAL — alíquota definida por cada município dentro dos limites',
    'Lista de serviços anexa à LC 116/2003 — taxativa quanto aos gêneros, exemplificativa quanto às espécies',
    'Local de incidência: em geral, no município do ESTABELECIMENTO PRESTADOR',
    'Exceções ao local: construção civil, diversões, serviços portuários → local da prestação'
  ],
  exemplosCNAEeISS: [
    { cnae: '71.12-0', servico: 'Engenharia', itemLC116: '7.01/7.03', aliquotaUsual: '2% a 5%' },
    { cnae: '62.01-5', servico: 'Desenvolvimento de software', itemLC116: '1.01/1.04', aliquotaUsual: '2% a 5%' },
    { cnae: '69.20-6', servico: 'Contabilidade/Auditoria', itemLC116: '17.18/17.19', aliquotaUsual: '2% a 5%' }
  ],
  nota: 'No LP, o ISS é cobrado SEPARADAMENTE (não incluído na base de IRPJ/CSLL como no Simples). O ISS NÃO reduz a receita bruta para fins de presunção.'
};

/**
 * Alíquotas da CSLL diferenciadas por setor.
 * Base Legal: Lei 7.689/88 c/c alterações.
 */
const CSLL_ALIQUOTAS_POR_SETOR = {
  baseLegal: 'Lei 7.689/88 c/c alterações',
  regraGeral: { aliquota: 0.09, vigencia: 'Desde 01/02/2003 (Lei 10.637/2002, Art. 37)' },
  instituicoesFinanceiras: {
    aliquota: 0.20,
    vigencia: 'Lei 13.169/2015 (prorrogada)',
    entidades: ['Bancos', 'Financeiras', 'Seguradoras', 'Capitalização', 'Cooperativas de crédito', 'Administradoras de cartão']
  },
  nota: 'No LP regra geral (empresas não financeiras), a alíquota é SEMPRE 9%.'
};

/**
 * Detalhamento do INSS Patronal — Lei 8.212/1991, Art. 22.
 * Base Legal: Lei 8.212/1991, Art. 22.
 */
const INSS_PATRONAL_DETALHAMENTO = {
  baseLegal: 'Lei 8.212/1991, Art. 22',
  componentes: [
    { nome: 'Contribuição patronal', aliquota: 0.20, incideSobre: 'Total da folha de pagamento (sem teto)', artigo: 'Art. 22, I e III' },
    { nome: 'RAT/SAT', aliquota: '0.01 a 0.03', incideSobre: 'Total da folha', artigo: 'Art. 22, II', nota: 'Conforme grau de risco do CNAE. Pode ser ajustado pelo FAP (0.5 a 2.0)' },
    { nome: 'Terceiros (Sistema S)', aliquota: '0.058', incideSobre: 'Total da folha', artigo: 'Lei 8.029/90 e decretos', nota: 'Varia conforme atividade: SENAC/SESC (comércio), SENAI/SESI (indústria), etc.' },
    { nome: 'Contribuinte individual (sócio)', aliquota: 0.11, incideSobre: 'Pró-labore (limitado ao teto INSS)', artigo: 'Art. 21, §1º c/c Decreto 3.048/99, Art. 201' },
    { nome: 'Patronal sobre contribuinte individual', aliquota: 0.20, incideSobre: 'Pró-labore (SEM teto)', artigo: 'Art. 22, III' }
  ]
};

/**
 * Tabela de IRRF sobre serviços prestados entre PJs.
 * Base Legal: Decreto 9.580/2018 (RIR) e IN RFB 1.234/2012.
 */
const TABELA_IRRF_SERVICOS_PJ = [
  { tipo: 'Serviços profissionais (limpeza, conservação, segurança, locação de mão de obra)', aliquota: 0.01, codigoDARF: '1708', baseLegal: 'RIR/2018, Art. 716; IN RFB 1.234/2012' },
  { tipo: 'Serviços profissionais prestados por associados de cooperativas de trabalho', aliquota: 0.015, codigoDARF: '3280', baseLegal: 'RIR/2018, Art. 714' },
  { tipo: 'Serviços de assessoria, consultoria, engenharia, contabilidade, advocacia, etc.', aliquota: 0.015, codigoDARF: '1708', baseLegal: 'RIR/2018, Art. 714' },
  { tipo: 'Comissões e corretagens pagas a PJs', aliquota: 0.015, codigoDARF: '8045', baseLegal: 'RIR/2018, Art. 718' },
  { tipo: 'Serviços de propaganda e publicidade', aliquota: 0.015, codigoDARF: '8045', baseLegal: 'RIR/2018, Art. 718' },
  { tipo: 'Aluguéis pagos a PJ', aliquota: 0.015, codigoDARF: '3208', baseLegal: 'RIR/2018, Art. 683' }
];


// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 14: FUNÇÕES AUXILIARES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Arredonda valor para centavos (2 casas decimais) ou casas especificadas.
 * @private
 */
function _arredondar(valor, casas = 2) {
  const fator = Math.pow(10, casas);
  return Math.round(valor * fator) / fator;
}

/**
 * Formata valor como moeda brasileira (sem símbolo R$).
 * @private
 */
function _formatarMoeda(valor) {
  return (valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Calcula quotas de parcelamento (até 3 quotas).
 * Base Legal: RIR/2018, Art. 599.
 * @private
 */
function _calcularQuotas(valorTotal) {
  const QUOTA_MINIMA = 1000.00;

  if (valorTotal <= 0) {
    return { parcelas: 0, quotas: [], observacao: 'Nada a recolher.' };
  }

  if (valorTotal < QUOTA_MINIMA) {
    return {
      parcelas: 1,
      quotas: [{ numero: 1, valor: valorTotal, juros: 0, observacao: 'Quota única (valor < R$ 1.000)' }],
      observacao: 'Valor inferior a R$ 1.000,00 — pagamento em quota única obrigatório.'
    };
  }

  if (valorTotal < QUOTA_MINIMA * 2) {
    return {
      parcelas: 1,
      quotas: [{ numero: 1, valor: valorTotal, juros: 0, observacao: 'Quota única' }],
      observacao: 'Duas quotas teriam valor individual inferior a R$ 1.000,00.'
    };
  }

  const maxQuotas = Math.min(3, Math.floor(valorTotal / QUOTA_MINIMA));
  const valorQuota = _arredondar(valorTotal / maxQuotas);

  const quotas = [];
  for (let i = 1; i <= maxQuotas; i++) {
    const isUltimaQuota = i === maxQuotas;
    const valor = isUltimaQuota
      ? _arredondar(valorTotal - valorQuota * (maxQuotas - 1))
      : valorQuota;

    quotas.push({
      numero: i,
      valor,
      juros: i === 1 ? 0 : null, // Juros SELIC calculados na data de pagamento
      observacao: i === 1
        ? 'Sem juros'
        : `Acrescida de juros SELIC acumulada a partir do ${i}º mês após encerramento do trimestre`
    });
  }

  return {
    parcelas: maxQuotas,
    quotas,
    observacao: `Parcelamento em ${maxQuotas} quotas iguais. Quota mínima: R$ 1.000,00. 2ª e 3ª quotas com juros SELIC.`
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 15: SIMULAÇÃO RÁPIDA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simulação rápida de carga tributária no Lucro Presumido.
 * Útil para estimativas rápidas sem todos os detalhes.
 *
 * @param {number} receitaBrutaTrimestral - Receita bruta do trimestre
 * @param {string} atividadeId - ID da atividade
 * @returns {Object} Estimativa rápida
 */
function simulacaoRapida(receitaBrutaTrimestral, atividadeId = 'servicos_gerais') {
  if (typeof receitaBrutaTrimestral !== 'number' || receitaBrutaTrimestral <= 0) {
    throw new Error('simulacaoRapida: receitaBrutaTrimestral deve ser um numero positivo.');
  }
  const atividadeIRPJ = PERCENTUAIS_PRESUNCAO_IRPJ.find(a => a.id === atividadeId);
  const atividadeCSLL = PERCENTUAIS_PRESUNCAO_CSLL.find(a => a.id === atividadeId);

  if (!atividadeIRPJ || !atividadeCSLL) {
    throw new Error(`Atividade não encontrada: "${atividadeId}"`);
  }

  const baseIRPJ = receitaBrutaTrimestral * atividadeIRPJ.percentual;
  const baseCSLL = receitaBrutaTrimestral * atividadeCSLL.percentual;

  const irpjNormal = baseIRPJ * ALIQUOTA_IRPJ;
  const irpjAdicional = Math.max(0, baseIRPJ - LIMITE_ADICIONAL_TRIMESTRAL) * ALIQUOTA_ADICIONAL_IRPJ;
  const irpjTotal = _arredondar(irpjNormal + irpjAdicional);
  const csllTotal = _arredondar(baseCSLL * ALIQUOTA_CSLL);

  const pisMensal = _arredondar(receitaBrutaTrimestral / 3 * ALIQUOTA_PIS_CUMULATIVO);
  const cofinsMensal = _arredondar(receitaBrutaTrimestral / 3 * ALIQUOTA_COFINS_CUMULATIVO);
  const pisTrimestral = _arredondar(pisMensal * 3);
  const cofinsTrimestral = _arredondar(cofinsMensal * 3);

  const totalTrimestral = _arredondar(irpjTotal + csllTotal + pisTrimestral + cofinsTrimestral);
  const aliquotaEfetiva = _arredondar((totalTrimestral / receitaBrutaTrimestral) * 100, 2);

  return {
    receitaBrutaTrimestral,
    atividade: atividadeIRPJ.descricao,
    percentualPresuncaoIRPJ: `${(atividadeIRPJ.percentual * 100).toFixed(1)}%`,
    percentualPresuncaoCSLL: `${(atividadeCSLL.percentual * 100).toFixed(1)}%`,
    baseIRPJ: _arredondar(baseIRPJ),
    baseCSLL: _arredondar(baseCSLL),
    irpj: { normal: _arredondar(irpjNormal), adicional: _arredondar(irpjAdicional), total: irpjTotal },
    csll: csllTotal,
    pisTrimestral,
    cofinsTrimestral,
    totalTributosFederais: totalTrimestral,
    aliquotaEfetiva: `${aliquotaEfetiva}%`,
    observacao: 'Estimativa sem considerar adições obrigatórias, IRRF retido ou ISS. Use calcularLucroPresumidoTrimestral() para cálculo completo.'
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 16: HELPERS PARA INTERFACE (LABELS, FORMATAÇÃO, VALIDAÇÃO)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retorna lista de atividades disponíveis para seleção em formulários.
 */
function getAtividadesDisponiveis() {
  return PERCENTUAIS_PRESUNCAO_IRPJ.map(a => ({
    id: a.id,
    descricao: a.descricao,
    percentualIRPJ: a.percentual,
    percentualCSLL: PERCENTUAIS_PRESUNCAO_CSLL.find(c => c.id === a.id)?.percentual || 0.12,
    irpjMajorado: a.irpjMajorado || a.percentual * 1.10,
    csllMajorada: (PERCENTUAIS_PRESUNCAO_CSLL.find(c => c.id === a.id)?.csllMajorada) || (PERCENTUAIS_PRESUNCAO_CSLL.find(c => c.id === a.id)?.percentual || 0.12) * 1.10,
    temRequisitos: a.temRequisitos || false,
    requisitos: a.requisitos || [],
    alertaSeFalhar: a.alertaSeFalhar || null,
    cnaes: a.cnaes || []
  }));
}

/**
 * Identifica a atividade por CNAE.
 * @param {string} cnae - Código CNAE (ex.: '71.19-7')
 * @returns {Object|null} Atividade correspondente ou null
 */
function identificarAtividadePorCNAE(cnae) {
  const cnaeNormalizado = cnae.replace(/[.\-\/]/g, '');
  for (const atividade of PERCENTUAIS_PRESUNCAO_IRPJ) {
    if (!atividade.cnaes) continue;
    for (const cnaePadrao of atividade.cnaes) {
      const padrao = cnaePadrao.replace(/[.\-\/]/g, '').replace(/\*/g, '');
      if (cnaeNormalizado.startsWith(padrao)) {
        return {
          atividadeId: atividade.id,
          descricao: atividade.descricao,
          percentualIRPJ: atividade.percentual,
          percentualCSLL: PERCENTUAIS_PRESUNCAO_CSLL.find(c => c.id === atividade.id)?.percentual || 0.12,
          baseLegal: atividade.baseLegal
        };
      }
    }
  }
  return null;
}

/**
 * Valida os dados de entrada para cálculo trimestral.
 * @param {Object} params - Mesmos parâmetros de calcularLucroPresumidoTrimestral
 * @returns {Object} { valido: boolean, erros: string[] }
 */
function validarDadosEntrada(params) {
  const erros = [];

  if (!params.receitas || !Array.isArray(params.receitas) || params.receitas.length === 0) {
    erros.push('Receitas são obrigatórias. Informe ao menos uma receita com atividadeId e valor.');
  } else {
    for (const [i, receita] of params.receitas.entries()) {
      if (!receita.atividadeId) {
        erros.push(`Receita ${i + 1}: atividadeId é obrigatório.`);
      } else if (!PERCENTUAIS_PRESUNCAO_IRPJ.find(a => a.id === receita.atividadeId)) {
        erros.push(`Receita ${i + 1}: atividadeId "${receita.atividadeId}" não encontrada. Valores válidos: ${PERCENTUAIS_PRESUNCAO_IRPJ.map(a => a.id).join(', ')}`);
      }
      if (receita.valor === undefined || receita.valor === null || receita.valor < 0) {
        erros.push(`Receita ${i + 1}: valor inválido (${receita.valor}). Deve ser >= 0.`);
      }
    }
  }

  const camposNumericos = [
    'devolucoes', 'cancelamentos', 'descontosIncondicionais',
    'ganhosCapital', 'rendimentosFinanceiros', 'jcpRecebidos',
    'multasContratuais', 'receitasFinanceirasDiversas',
    'valoresRecuperados', 'demaisReceitas', 'irrfRetidoFonte', 'csllRetidaFonte'
  ];

  for (const campo of camposNumericos) {
    if (params[campo] !== undefined && params[campo] !== null) {
      if (typeof params[campo] !== 'number' || params[campo] < 0) {
        erros.push(`${campo}: deve ser um número >= 0. Valor recebido: ${params[campo]}`);
      }
    }
  }

  return { valido: erros.length === 0, erros };
}

/**
 * Formata um resultado de cálculo trimestral para exibição em texto.
 * @param {Object} resultado - Retorno de calcularLucroPresumidoTrimestral()
 * @returns {string} Texto formatado
 */
function formatarResultadoTexto(resultado) {
  const r = resultado.resumo;
  const linhas = [
    '═══════════════════════════════════════════════════════',
    '       APURAÇÃO TRIMESTRAL — LUCRO PRESUMIDO',
    '═══════════════════════════════════════════════════════',
    '',
    `Receita Bruta Total:        R$ ${_formatarMoeda(r.receitaBrutaTotal)}`,
    `(-) Deduções da Receita:    R$ ${_formatarMoeda(r.deducoesDaReceita)}`,
    `(=) Receita Bruta Ajustada: R$ ${_formatarMoeda(r.receitaBrutaAjustada)}`,
    '',
    '── BASE DE CÁLCULO IRPJ ──',
    `Base Presumida:             R$ ${_formatarMoeda(r.basePresumidaIRPJ)}`,
    `(+) Adições Obrigatórias:   R$ ${_formatarMoeda(r.adicoesObrigatorias)}`,
    `(=) Base de Cálculo:        R$ ${_formatarMoeda(r.baseCalculoIRPJ)}`,
    '',
    '── IRPJ ──',
    `IRPJ Normal (15%):          R$ ${_formatarMoeda(r.irpjNormal)}`,
    `IRPJ Adicional (10%):       R$ ${_formatarMoeda(r.irpjAdicional)}`,
    `IRPJ Bruto:                 R$ ${_formatarMoeda(r.irpjBruto)}`,
    `(-) IRRF Retido na Fonte:   R$ ${_formatarMoeda(r.irrfRetidoFonte)}`,
    `(=) IRPJ Devido:            R$ ${_formatarMoeda(r.irpjDevido)}`,
    '',
    '── CSLL ──',
    `Base de Cálculo:            R$ ${_formatarMoeda(r.baseCalculoCSLL)}`,
    `CSLL Bruta (9%):            R$ ${_formatarMoeda(r.csllBruta)}`,
    `(-) CSLL Retida na Fonte:   R$ ${_formatarMoeda(r.csllRetidaFonte)}`,
    `(=) CSLL Devida:            R$ ${_formatarMoeda(r.csllDevida)}`,
    '',
    '── TOTAIS ──',
    `Total IRPJ + CSLL:          R$ ${_formatarMoeda(r.totalIRPJCSLL)}`,
    `Alíquota Efetiva/Receita:   ${r.aliquotaEfetivaReceita}`,
    '',
    '── DISTRIBUIÇÃO DE LUCROS ──',
    `Lucro Distribuível Isento:  R$ ${_formatarMoeda(r.lucroDistribuidoPresumido)}`,
    '',
    '── CÓDIGOS DARF ──',
    `IRPJ: ${r.codigoDARF_IRPJ}    CSLL: ${r.codigoDARF_CSLL}`,
    '═══════════════════════════════════════════════════════'
  ];

  return linhas.join('\n');
}


// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 19: EXPORTAÇÃO PDF PROFISSIONAL — IMPOST.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gera PDF profissional com relatório completo de Lucro Presumido.
 * Este PDF é o principal entregável do produto IMPOST. para o assinante.
 * Requer jsPDF 2.5+ e jspdf-autotable 3.8+ carregados via CDN.
 * Chamada pelo botão "Exportar PDF" no Step 6 do wizard.
 */

// ── Constantes visuais do PDF ──

const _PDF_CORES = {
  primaria:   [15, 23, 42],
  accent:     [245, 158, 11],
  verde:      [16, 185, 129],
  vermelho:   [239, 68, 68],
  azul:       [59, 130, 246],
  cinzaClaro: [241, 245, 249],
  cinzaMedio: [148, 163, 184],
  branco:     [255, 255, 255],
  preto:      [30, 41, 59]
};

const _PDF_MARGIN = { left: 20, right: 20, top: 25, topNext: 15, bottom: 25 };
const _PDF_WIDTH = 210;
const _PDF_HEIGHT = 297;
const _PDF_CONTENT_WIDTH = _PDF_WIDTH - _PDF_MARGIN.left - _PDF_MARGIN.right;

// ── Helpers de formatação ──

function _pdfFmtMoeda(v) {
  if (v == null || isNaN(v)) return 'R$ 0,00';
  return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function _pdfFmtPct(v) {
  if (v == null || isNaN(v)) return '0,00%';
  return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
}

function _pdfFmtData() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── Helpers de layout ──

function _pdfTituloSecao(doc, y, titulo) {
  y = _pdfCheckPage(doc, y, 20);
  doc.setFillColor(..._PDF_CORES.primaria);
  doc.rect(_PDF_MARGIN.left, y, _PDF_CONTENT_WIDTH, 9, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(..._PDF_CORES.branco);
  doc.text(titulo.toUpperCase(), _PDF_MARGIN.left + 4, y + 6.5);
  doc.setTextColor(..._PDF_CORES.preto);
  return y + 13;
}

function _pdfInfoBox(doc, y, texto, cor) {
  y = _pdfCheckPage(doc, y, 18);
  const rgb = cor || _PDF_CORES.azul;
  doc.setFillColor(
    Math.min(255, rgb[0] + Math.round((255 - rgb[0]) * 0.88)),
    Math.min(255, rgb[1] + Math.round((255 - rgb[1]) * 0.88)),
    Math.min(255, rgb[2] + Math.round((255 - rgb[2]) * 0.88))
  );
  doc.setDrawColor(...rgb);
  doc.setLineWidth(0.5);
  const lines = doc.splitTextToSize(texto, _PDF_CONTENT_WIDTH - 10);
  const h = Math.max(12, lines.length * 5 + 6);
  doc.rect(_PDF_MARGIN.left, y, _PDF_CONTENT_WIDTH, h, 'FD');
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(..._PDF_CORES.preto);
  doc.text(lines, _PDF_MARGIN.left + 5, y + 5);
  return y + h + 4;
}

function _pdfCheckPage(doc, y, minSpace) {
  if (y + (minSpace || 30) > _PDF_HEIGHT - _PDF_MARGIN.bottom) {
    doc.addPage();
    return _PDF_MARGIN.topNext;
  }
  return y;
}

function _pdfRodape(doc) {
  const totalPages = doc.internal.getNumberOfPages();
  const dataStr = _pdfFmtData();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const yRod = _PDF_HEIGHT - 12;
    doc.setDrawColor(..._PDF_CORES.cinzaMedio);
    doc.setLineWidth(0.3);
    doc.line(_PDF_MARGIN.left, yRod - 3, _PDF_WIDTH - _PDF_MARGIN.right, yRod - 3);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(..._PDF_CORES.cinzaMedio);
    doc.text(`IMPOST. — Inteligencia em Otimizacao Tributaria | ${dataStr} | Pagina ${i} de ${totalPages}`, _PDF_MARGIN.left, yRod);
    doc.text('AVISO LEGAL: Estimativa baseada na legislacao vigente (RIR/2018, IN RFB 1.700/2017, LC 224/2025). NAO constitui parecer contabil/juridico. Valide com profissional habilitado.', _PDF_MARGIN.left, yRod + 3.5);
  }
}

function _pdfLinha(doc, y) {
  doc.setDrawColor(..._PDF_CORES.cinzaMedio);
  doc.setLineWidth(0.2);
  doc.line(_PDF_MARGIN.left, y, _PDF_WIDTH - _PDF_MARGIN.right, y);
  return y + 3;
}

function _pdfLabelValue(doc, y, label, value, x) {
  x = x || _PDF_MARGIN.left;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(..._PDF_CORES.cinzaMedio);
  doc.text(label, x, y);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(..._PDF_CORES.preto);
  doc.text(String(value || '-'), x + doc.getTextWidth(label) + 2, y);
  return y + 5;
}

function _pdfTabela(doc, y, head, body, options) {
  y = _pdfCheckPage(doc, y, 30);
  const defaults = {
    startY: y,
    margin: { left: _PDF_MARGIN.left, right: _PDF_MARGIN.right },
    headStyles: {
      fillColor: _PDF_CORES.primaria,
      textColor: _PDF_CORES.branco,
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
      cellPadding: 2.5
    },
    bodyStyles: {
      fontSize: 8,
      textColor: _PDF_CORES.preto,
      cellPadding: 2,
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    alternateRowStyles: {
      fillColor: _PDF_CORES.cinzaClaro
    },
    styles: {
      font: 'Helvetica',
      overflow: 'linebreak'
    },
    theme: 'grid',
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.2
  };

  const merged = Object.assign({}, defaults, options || {});
  merged.head = [head];
  merged.body = body;

  doc.autoTable(merged);
  return doc.lastAutoTable.finalY + 5;
}

// ── PÁGINA 1 — CAPA ──

function _pdfCapa(doc, fd) {
  doc.setFillColor(..._PDF_CORES.primaria);
  doc.rect(0, 0, _PDF_WIDTH, 80, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(42);
  doc.setTextColor(..._PDF_CORES.branco);
  doc.text('IMPOST', _PDF_WIDTH / 2 - 5, 38, { align: 'center' });
  doc.setTextColor(..._PDF_CORES.accent);
  doc.text('.', _PDF_WIDTH / 2 + doc.getTextWidth('IMPOST') / 2 - 3, 38);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(200, 210, 230);
  doc.text('Relatorio de Otimizacao — Lucro Presumido', _PDF_WIDTH / 2, 52, { align: 'center' });

  doc.setFillColor(..._PDF_CORES.accent);
  doc.rect(_PDF_WIDTH / 2 - 40, 62, 80, 2, 'F');

  let y = 100;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(..._PDF_CORES.preto);
  const razao = fd.razaoSocial || 'Empresa Nao Informada';
  const razaoLines = doc.splitTextToSize(razao, _PDF_CONTENT_WIDTH);
  doc.text(razaoLines, _PDF_WIDTH / 2, y, { align: 'center' });
  y += razaoLines.length * 9 + 4;

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(..._PDF_CORES.cinzaMedio);
  if (fd.cnpj) { doc.text('CNPJ: ' + fd.cnpj, _PDF_WIDTH / 2, y, { align: 'center' }); y += 6; }

  const cnaeDesc = _pdfGetCnaeDescricao(fd);
  if (fd.cnaePrincipal) {
    doc.text('CNAE: ' + fd.cnaePrincipal + (cnaeDesc ? ' - ' + cnaeDesc : ''), _PDF_WIDTH / 2, y, { align: 'center' });
    y += 6;
  }

  if (fd.municipio || fd.estado) {
    doc.text((fd.municipio || '') + (fd.municipio && fd.estado ? ' / ' : '') + (fd.estado || ''), _PDF_WIDTH / 2, y, { align: 'center' });
    y += 6;
  }

  y = 185;
  doc.setFillColor(..._PDF_CORES.cinzaClaro);
  doc.roundedRect(_PDF_MARGIN.left + 20, y, _PDF_CONTENT_WIDTH - 40, 50, 4, 4, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(..._PDF_CORES.primaria);
  doc.text('Relatorio de Otimizacao Tributaria', _PDF_WIDTH / 2, y + 16, { align: 'center' });

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(..._PDF_CORES.cinzaMedio);
  doc.text('Data de geracao: ' + _pdfFmtData(), _PDF_WIDTH / 2, y + 26, { align: 'center' });
  doc.text('Ano-calendario: ' + new Date().getFullYear(), _PDF_WIDTH / 2, y + 33, { align: 'center' });

  doc.setFont('Helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(..._PDF_CORES.cinzaMedio);
  doc.text('Analise personalizada com oportunidades de economia fiscal no regime de Lucro Presumido', _PDF_WIDTH / 2, 260, { align: 'center' });

  doc.setFontSize(7.5);
  doc.text('Documento gerado pela plataforma IMPOST.', _PDF_WIDTH / 2, 270, { align: 'center' });
}

function _pdfGetCnaeDescricao(fd) {
  if (!fd.cnaePrincipal) return '';
  try {
    const ativ = identificarAtividadePorCNAE(fd.cnaePrincipal);
    return ativ ? ativ.descricao : '';
  } catch(e) { return ''; }
}

// ── PÁGINA 2 — RESUMO EXECUTIVO ──

function _pdfResumo(doc, fd, anual) {
  doc.addPage();
  let y = _PDF_MARGIN.topNext;

  y = _pdfTituloSecao(doc, y, 'Resumo Executivo');

  const cargaTotal = anual.consolidacao.cargaTributariaTotal;
  const pctStr = anual.consolidacao.percentualCargaTributaria;
  const pctNum = parseFloat(String(pctStr).replace('%', '').replace(',', '.')) || 0;
  const mensal = cargaTotal / 12;

  doc.setFillColor(..._PDF_CORES.accent);
  doc.roundedRect(_PDF_MARGIN.left, y, _PDF_CONTENT_WIDTH, 36, 3, 3, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(..._PDF_CORES.primaria);
  doc.text('CARGA TRIBUTARIA ANUAL', _PDF_MARGIN.left + 6, y + 8);
  doc.setFontSize(22);
  doc.text(_pdfFmtMoeda(cargaTotal), _PDF_MARGIN.left + 6, y + 21);

  doc.setFontSize(10);
  doc.text('ALIQUOTA EFETIVA', _PDF_WIDTH / 2 + 10, y + 8);
  doc.setFontSize(22);
  doc.text(String(pctStr), _PDF_WIDTH / 2 + 10, y + 21);

  doc.setFontSize(9);
  doc.setFont('Helvetica', 'normal');
  doc.text('Sua empresa paga ' + _pdfFmtMoeda(mensal) + '/mes em impostos', _PDF_MARGIN.left + 6, y + 32);

  y += 42;

  let semaforoCor, semaforoTexto;
  if (pctNum < 15) { semaforoCor = _PDF_CORES.verde; semaforoTexto = 'CARGA BAIXA'; }
  else if (pctNum <= 25) { semaforoCor = _PDF_CORES.accent; semaforoTexto = 'CARGA MODERADA'; }
  else { semaforoCor = _PDF_CORES.vermelho; semaforoTexto = 'CARGA ELEVADA'; }

  doc.setFillColor(...semaforoCor);
  doc.roundedRect(_PDF_MARGIN.left, y, 60, 8, 2, 2, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(..._PDF_CORES.branco);
  doc.text(semaforoTexto, _PDF_MARGIN.left + 4, y + 5.5);

  y += 14;

  const rb = anual.receitaBrutaAnual || 1;
  const tributos = anual.tributos;
  const rows = [
    ['IRPJ', _pdfFmtMoeda(tributos.irpj.anual), _pdfFmtMoeda(tributos.irpj.anual / 12), _pdfFmtPct((tributos.irpj.anual / rb) * 100)],
    ['CSLL', _pdfFmtMoeda(tributos.csll.anual), _pdfFmtMoeda(tributos.csll.anual / 12), _pdfFmtPct((tributos.csll.anual / rb) * 100)],
    ['PIS', _pdfFmtMoeda(tributos.pis.anual), _pdfFmtMoeda(tributos.pis.anual / 12), '0,65%'],
    ['COFINS', _pdfFmtMoeda(tributos.cofins.anual), _pdfFmtMoeda(tributos.cofins.anual / 12), '3,00%'],
    ['ISS', _pdfFmtMoeda(tributos.iss.anual), _pdfFmtMoeda(tributos.iss.anual / 12), String(tributos.iss.aliquota || '')],
    ['INSS Patronal', _pdfFmtMoeda(tributos.inssPatronal.anual), _pdfFmtMoeda(tributos.inssPatronal.anual / 12), String(tributos.inssPatronal.aliquotaTotal || '')]
  ];

  rows.push([
    { content: 'TOTAL', styles: { fontStyle: 'bold' } },
    { content: _pdfFmtMoeda(cargaTotal), styles: { fontStyle: 'bold' } },
    { content: _pdfFmtMoeda(cargaTotal / 12), styles: { fontStyle: 'bold' } },
    { content: String(pctStr), styles: { fontStyle: 'bold' } }
  ]);

  y = _pdfTabela(doc, y,
    ['Tributo', 'Anual', 'Mensal (/ 12)', '% Receita'],
    rows,
    {
      columnStyles: {
        0: { cellWidth: 40 },
        1: { halign: 'right', cellWidth: 40 },
        2: { halign: 'right', cellWidth: 40 },
        3: { halign: 'right', cellWidth: 30 }
      }
    }
  );

  y = _pdfTituloSecao(doc, y, 'Distribuicao de Lucros Isenta');

  const dist = anual.distribuicaoLucros;
  y = _pdfLabelValue(doc, y, 'Lucro distribuivel isento: ', _pdfFmtMoeda(dist.lucroDistribuivelFinal));
  y = _pdfLabelValue(doc, y, 'Tipo de base: ', dist.tipoBase);
  y = _pdfLabelValue(doc, y, 'Base legal: ', dist.baseLegal);

  return y;
}

// ── PÁGINA 3 — IRPJ + CSLL TRIMESTRAL ──

function _pdfTrimestral(doc, trimestral, fd) {
  doc.addPage();
  let y = _PDF_MARGIN.topNext;

  y = _pdfTituloSecao(doc, y, 'Detalhamento IRPJ + CSLL Trimestral');

  const fields = [
    ['Receita Bruta', 'receitaBrutaTotal'],
    ['(-) Deducoes', 'deducoesDaReceita'],
    ['Receita Ajustada', 'receitaBrutaAjustada'],
    ['Base Presumida IRPJ', 'basePresumidaIRPJ'],
    ['(+) Adicoes Obrigatorias', 'adicoesObrigatorias'],
    ['Base de Calculo IRPJ', 'baseCalculoIRPJ'],
    ['IRPJ Normal (15%)', 'irpjNormal'],
    ['IRPJ Adicional (10%)', 'irpjAdicional'],
    ['(-) IRRF Retido', 'irrfRetidoFonte'],
    ['IRPJ Devido', 'irpjDevido'],
    ['Base de Calculo CSLL', 'baseCalculoCSLL'],
    ['CSLL (9%)', 'csllBruta'],
    ['(-) CSLL Retida', 'csllRetidaFonte'],
    ['CSLL Devida', 'csllDevida'],
    ['Total IRPJ + CSLL', 'totalIRPJCSLL']
  ];

  const boldRows = ['IRPJ Devido', 'CSLL Devida', 'Total IRPJ + CSLL'];

  const body = fields.map(([label, key]) => {
    const vals = trimestral.map(t => t.resumo[key] || 0);
    const total = vals.reduce((s, v) => s + v, 0);
    const isBold = boldRows.includes(label);
    return [
      isBold ? { content: label, styles: { fontStyle: 'bold' } } : label,
      ...vals.map(v => ({ content: _pdfFmtMoeda(v), styles: { halign: 'right', fontStyle: isBold ? 'bold' : 'normal' } })),
      { content: _pdfFmtMoeda(total), styles: { halign: 'right', fontStyle: 'bold' } }
    ];
  });

  y = _pdfTabela(doc, y,
    ['Item', '1o Trim', '2o Trim', '3o Trim', '4o Trim', 'TOTAL'],
    body,
    {
      columnStyles: {
        0: { cellWidth: 48 },
        1: { halign: 'right', cellWidth: 26 },
        2: { halign: 'right', cellWidth: 26 },
        3: { halign: 'right', cellWidth: 26 },
        4: { halign: 'right', cellWidth: 26 },
        5: { halign: 'right', cellWidth: 26 }
      }
    }
  );

  const r0 = trimestral[0].resumo;
  const pIRPJ = PERCENTUAIS_PRESUNCAO_IRPJ.find(a => a.id === fd.atividadeId);
  const pCSLL = PERCENTUAIS_PRESUNCAO_CSLL.find(a => a.id === fd.atividadeId);
  const pctIRPJ = pIRPJ ? (pIRPJ.percentual * 100).toFixed(1) + '%' : '32%';
  const pctCSLL = pCSLL ? (pCSLL.percentual * 100).toFixed(1) + '%' : '32%';

  y = _pdfInfoBox(doc, y,
    `DARF IRPJ: ${r0.codigoDARF_IRPJ || '2089'} | DARF CSLL: ${r0.codigoDARF_CSLL || '2372'}\n` +
    `Presuncao IRPJ: ${pctIRPJ} | Presuncao CSLL: ${pctCSLL}\n` +
    'Base Legal: Lei 9.249/95, Art. 15',
    _PDF_CORES.azul
  );

  const irpjTrimMax = Math.max(...trimestral.map(t => t.resumo.irpjDevido || 0));
  if (irpjTrimMax > 3000) {
    y = _pdfCheckPage(doc, y, 25);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(..._PDF_CORES.primaria);
    doc.text('Opcao de Parcelamento (IRPJ > R$ 3.000)', _PDF_MARGIN.left, y);
    y += 5;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(..._PDF_CORES.preto);
    doc.text('O IRPJ pode ser parcelado em ate 3 quotas iguais (minimo R$ 1.000 cada).', _PDF_MARGIN.left, y); y += 4;
    doc.text('A 2a e 3a quotas sao acrescidas de juros SELIC acumulada.', _PDF_MARGIN.left, y); y += 4;
    doc.text('Vencimentos: ultimo dia util dos meses subsequentes ao trimestre.', _PDF_MARGIN.left, y); y += 6;
  }

  return y;
}

// ── PÁGINA 4 — PIS/COFINS MENSAL ──

function _pdfPISCOFINS(doc, anual, piscofins) {
  doc.addPage();
  let y = _PDF_MARGIN.topNext;

  y = _pdfTituloSecao(doc, y, 'PIS/COFINS — Apuracao Mensal');

  const mesesNomes = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const mesesData = piscofins || anual.detalhamentoMensal || [];

  const body = [];
  let totRec = 0, totBase = 0, totPIS = 0, totCOF = 0, totT = 0;

  mesesData.forEach((m, i) => {
    const rec = m.receitaBrutaMensal || 0;
    const base = m.baseCalculo || rec;
    const pis = m.pis ? m.pis.devido : 0;
    const cof = m.cofins ? m.cofins.devida : 0;
    const total = pis + cof;
    totRec += rec; totBase += base; totPIS += pis; totCOF += cof; totT += total;
    body.push([
      mesesNomes[i] || `Mes ${i + 1}`,
      { content: _pdfFmtMoeda(rec), styles: { halign: 'right' } },
      { content: _pdfFmtMoeda(base), styles: { halign: 'right' } },
      { content: _pdfFmtMoeda(pis), styles: { halign: 'right' } },
      { content: _pdfFmtMoeda(cof), styles: { halign: 'right' } },
      { content: _pdfFmtMoeda(total), styles: { halign: 'right', fontStyle: 'bold' } }
    ]);
  });

  body.push([
    { content: 'TOTAL', styles: { fontStyle: 'bold' } },
    { content: _pdfFmtMoeda(totRec), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: _pdfFmtMoeda(totBase), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: _pdfFmtMoeda(totPIS), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: _pdfFmtMoeda(totCOF), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: _pdfFmtMoeda(totT), styles: { halign: 'right', fontStyle: 'bold' } }
  ]);

  y = _pdfTabela(doc, y,
    ['Mes', 'Receita', 'Base', 'PIS (0,65%)', 'COFINS (3,00%)', 'Total'],
    body,
    {
      columnStyles: {
        0: { cellWidth: 20 },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' }
      }
    }
  );

  y = _pdfInfoBox(doc, y,
    'Regime: Cumulativo (sem creditos) | DARF PIS: 8109 | DARF COFINS: 2172\n' +
    'Vencimento: dia 25 do mes seguinte ao fato gerador\n' +
    'Carga combinada PIS+COFINS: 3,65%',
    _PDF_CORES.azul
  );

  return y;
}

// ── PÁGINA 5 — ISS MUNICIPAL + INSS ──

function _pdfISS(doc, fd, anual) {
  doc.addPage();
  let y = _PDF_MARGIN.topNext;

  y = _pdfTituloSecao(doc, y, 'ISS — Imposto Sobre Servicos Municipal');

  // Normaliza alíquota: se veio decimal (0.03), converte para inteiro (3)
  const aliqISSRaw = fd.aliquotaISS || 5;
  const aliqISS = aliqISSRaw < 1 ? _arredondar(aliqISSRaw * 100, 2) : aliqISSRaw;
  const issAnual = anual.tributos.iss.anual;
  const receitaAnual = anual.receitaBrutaAnual || 0;
  const receitaMensal = receitaAnual / 12;
  const issMensal = issAnual / 12;

  y = _pdfLabelValue(doc, y, 'Municipio: ', fd.municipio || 'Nao informado');
  y = _pdfLabelValue(doc, y, 'Estado: ', fd.estado || 'Nao informado');
  y = _pdfLabelValue(doc, y, 'Aliquota ISS: ', aliqISS + '%');
  y = _pdfLabelValue(doc, y, 'ISS Mensal: ', _pdfFmtMoeda(issMensal));
  y = _pdfLabelValue(doc, y, 'ISS Anual: ', _pdfFmtMoeda(issAnual));
  y = _pdfLabelValue(doc, y, 'Base Legal: ', 'LC 116/2003');
  y += 3;

  const mesesNomes = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const issBody = mesesNomes.map(mes => [
    mes,
    { content: _pdfFmtMoeda(receitaMensal), styles: { halign: 'right' } },
    { content: aliqISS + '%', styles: { halign: 'center' } },
    { content: _pdfFmtMoeda(issMensal), styles: { halign: 'right' } }
  ]);
  issBody.push([
    { content: 'TOTAL', styles: { fontStyle: 'bold' } },
    { content: _pdfFmtMoeda(receitaAnual), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: aliqISS + '%', styles: { halign: 'center', fontStyle: 'bold' } },
    { content: _pdfFmtMoeda(issAnual), styles: { halign: 'right', fontStyle: 'bold' } }
  ]);

  y = _pdfTabela(doc, y,
    ['Mes', 'Receita', 'Aliquota', 'ISS Devido'],
    issBody,
    {
      columnStyles: {
        0: { cellWidth: 25 },
        1: { halign: 'right' },
        2: { halign: 'center', cellWidth: 25 },
        3: { halign: 'right' }
      }
    }
  );

  // INSS Patronal
  y = _pdfTituloSecao(doc, y, 'INSS Patronal');

  const inss = anual.tributos.inssPatronal;
  y = _pdfLabelValue(doc, y, 'Folha de pagamento anual: ', _pdfFmtMoeda(inss.folhaPagamento));
  y = _pdfLabelValue(doc, y, 'Aliquota total: ', String(inss.aliquotaTotal || ''));

  if (inss.composicao) {
    // composicao contém strings de percentual (ex: "20.0%"), não valores monetários
    y = _pdfLabelValue(doc, y, 'Patronal: ', String(inss.composicao.patronal || ''));
    y = _pdfLabelValue(doc, y, 'RAT: ', String(inss.composicao.rat || ''));
    y = _pdfLabelValue(doc, y, 'Terceiros: ', String(inss.composicao.terceiros || ''));
  }

  y = _pdfLabelValue(doc, y, 'INSS Patronal Anual: ', _pdfFmtMoeda(inss.anual));
  y = _pdfLabelValue(doc, y, 'INSS Patronal Mensal: ', _pdfFmtMoeda(inss.anual / 12));

  return y;
}

// ── PÁGINA 6 — DISTRIBUIÇÃO DE LUCROS ──

function _pdfDistribuicao(doc, anual) {
  doc.addPage();
  let y = _PDF_MARGIN.topNext;

  y = _pdfTituloSecao(doc, y, 'Distribuicao de Lucros por Socio');

  const dist = anual.distribuicaoLucros;
  const socios = dist.porSocio || [];

  const body = socios.map(s => [
    s.nome,
    { content: s.percentualFormatado, styles: { halign: 'center' } },
    { content: _pdfFmtMoeda(s.valorIsento), styles: { halign: 'right' } },
    { content: _pdfFmtMoeda(s.valorIsento / 12), styles: { halign: 'right' } }
  ]);

  const totalIsento = socios.reduce((s, x) => s + x.valorIsento, 0);
  body.push([
    { content: 'TOTAL', styles: { fontStyle: 'bold' } },
    { content: '100%', styles: { halign: 'center', fontStyle: 'bold' } },
    { content: _pdfFmtMoeda(totalIsento), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: _pdfFmtMoeda(totalIsento / 12), styles: { halign: 'right', fontStyle: 'bold' } }
  ]);

  y = _pdfTabela(doc, y,
    ['Socio', 'Participacao', 'Lucro Isento Anual', 'Lucro Isento Mensal'],
    body,
    {
      columnStyles: {
        0: { cellWidth: 50 },
        1: { halign: 'center', cellWidth: 30 },
        2: { halign: 'right' },
        3: { halign: 'right' }
      }
    }
  );

  y = _pdfTituloSecao(doc, y, 'Demonstracao do Calculo');

  y = _pdfLabelValue(doc, y, 'Base utilizada: ', dist.tipoBase);
  y += 2;

  const linhasCalc = [
    ['Base presumida anual:', _pdfFmtMoeda(dist.basePresumidaAnual)],
    ['(-) Tributos federais:', _pdfFmtMoeda(dist.tributosFederais)],
    ['(=) Lucro distribuivel (presumido):', _pdfFmtMoeda(dist.lucroDistribuivelPresumido)]
  ];

  if (dist.lucroDistribuivelContabil !== null && dist.lucroDistribuivelContabil !== undefined) {
    linhasCalc.push(['Lucro contabil efetivo:', _pdfFmtMoeda(dist.lucroContabilEfetivo)]);
    linhasCalc.push(['(-) Tributos federais:', _pdfFmtMoeda(dist.tributosFederais)]);
    linhasCalc.push(['(=) Lucro distribuivel (contabil):', _pdfFmtMoeda(dist.lucroDistribuivelContabil)]);
  }

  linhasCalc.forEach(([label, val]) => {
    y = _pdfCheckPage(doc, y, 6);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(..._PDF_CORES.cinzaMedio);
    doc.text(label, _PDF_MARGIN.left + 4, y);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(..._PDF_CORES.preto);
    doc.text(val, _PDF_MARGIN.left + 80, y);
    y += 5;
  });

  y += 3;
  y = _pdfInfoBox(doc, y,
    'Art. 725 RIR/2018 - Lucros distribuidos sao isentos de IR para pessoa fisica residente no Brasil.\n' +
    (dist.lucroDistribuivelContabil !== null && dist.lucroDistribuivelContabil !== undefined
      ? 'Com escrituracao contabil completa (ECD), a base contabil pode superar a presumida.'
      : 'Sem escrituracao completa, o limite e a base presumida menos tributos federais.'
    ),
    _PDF_CORES.verde
  );

  return y;
}

// ── PÁGINA 7 — DICAS DE ECONOMIA LEGAL (A MAIS IMPORTANTE) ──

function _pdfDicasEconomia(doc, fd, anual) {
  doc.addPage();
  let y = _PDF_MARGIN.topNext;

  y = _pdfTituloSecao(doc, y, 'Dicas de Economia Legal');

  const dicas = _pdfGerarDicas(fd, anual);

  dicas.forEach((dica, idx) => {
    y = _pdfCheckPage(doc, y, 30);

    const corBadge = dica.tipo === 'economia' ? _PDF_CORES.verde
                   : dica.tipo === 'atencao' ? _PDF_CORES.accent
                   : _PDF_CORES.azul;

    doc.setFillColor(...corBadge);
    doc.roundedRect(_PDF_MARGIN.left, y, _PDF_CONTENT_WIDTH, 5, 1, 1, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(..._PDF_CORES.branco);
    doc.text(`#${idx + 1} - ${dica.titulo}`, _PDF_MARGIN.left + 3, y + 3.5);
    y += 8;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(..._PDF_CORES.preto);
    const descLines = doc.splitTextToSize(dica.descricao, _PDF_CONTENT_WIDTH - 6);
    doc.text(descLines, _PDF_MARGIN.left + 3, y);
    y += descLines.length * 4 + 2;

    if (dica.economia) {
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(..._PDF_CORES.verde);
      doc.text('Economia estimada: ' + dica.economia, _PDF_MARGIN.left + 3, y);
      y += 5;
    }

    if (dica.baseLegal) {
      doc.setFont('Helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(..._PDF_CORES.cinzaMedio);
      doc.text('Base Legal: ' + dica.baseLegal, _PDF_MARGIN.left + 3, y);
      y += 5;
    }

    if (dica.acao) {
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(..._PDF_CORES.azul);
      const acaoLines = doc.splitTextToSize('Acao: ' + dica.acao, _PDF_CONTENT_WIDTH - 6);
      doc.text(acaoLines, _PDF_MARGIN.left + 3, y);
      y += acaoLines.length * 4 + 2;
    }

    y += 3;
    y = _pdfLinha(doc, y);
    y += 2;
  });

  return y;
}

function _pdfGerarDicas(fd, anual) {
  const dicas = [];
  const rb = anual.receitaBrutaAnual || fd.receitaBrutaAnual || 0;
  const dist = anual.distribuicaoLucros;
  const tribFed = anual.consolidacao.tributosFederais;

  // Normalizar: aceitar tanto 0.03 quanto 3 (percentual inteiro)
  const aliquotaISS = fd.aliquotaISS > 1 ? fd.aliquotaISS : (fd.aliquotaISS || 0) * 100;

  const pIRPJ = PERCENTUAIS_PRESUNCAO_IRPJ.find(a => a.id === fd.atividadeId);
  const presuncao = pIRPJ ? pIRPJ.percentual : 0.32;

  // 1. Margem Real vs Presuncao
  if (fd.totalDespesas > 0 && rb > 0) {
    const folha = fd.folhaPagamento || 0;
    const margemReal = (rb - fd.totalDespesas - folha) / rb;
    if (margemReal > presuncao) {
      const econIRPJ = (margemReal - presuncao) * rb * 0.15;
      dicas.push({
        tipo: 'economia',
        titulo: 'Margem Real Superior a Presuncao',
        descricao: `Sua margem real (${_pdfFmtPct(margemReal * 100)}) e SUPERIOR a presuncao (${_pdfFmtPct(presuncao * 100)}). Voce economiza com o Lucro Presumido, pois paga imposto sobre uma base menor que o lucro real.`,
        economia: _pdfFmtMoeda(econIRPJ) + '/ano (estimativa sobre IRPJ)',
        baseLegal: 'Lei 9.249/95, Art. 15',
        acao: 'Mantenha o Lucro Presumido enquanto a margem real superar a presuncao.'
      });
    } else {
      const custoExcedente = (presuncao - margemReal) * rb * 0.15;
      dicas.push({
        tipo: 'atencao',
        titulo: 'Margem Real Inferior a Presuncao — Otimize Custos',
        descricao: `Sua margem real (${_pdfFmtPct(margemReal * 100)}) e INFERIOR a presuncao (${_pdfFmtPct(presuncao * 100)}). Voce paga imposto sobre uma base maior que o lucro efetivo. Foque em aumentar a margem: renegocie contratos, reduza custos operacionais e otimize processos.`,
        economia: 'Custo tributario excedente estimado: ' + _pdfFmtMoeda(custoExcedente) + '/ano',
        baseLegal: 'Lei 9.249/95, Art. 15',
        acao: 'Revise despesas operacionais com seu contador para elevar a margem acima da presuncao.'
      });
    }
  }

  // 2. Escrituracao Completa
  if (!fd.temEscrituracao && fd.lucroContabil > 0 && dist.lucroDistribuivelPresumido > 0) {
    const diferenca = Math.max(0, fd.lucroContabil - tribFed - dist.lucroDistribuivelPresumido);
    if (diferenca > 0) {
      dicas.push({
        tipo: 'economia',
        titulo: 'Escrituracao Completa — Distribuicao Maior',
        descricao: `Com escrituracao contabil completa (ECD), voce poderia distribuir ate ${_pdfFmtMoeda(diferenca)} a mais em lucros isentos por ano.`,
        economia: _pdfFmtMoeda(diferenca) + '/ano em distribuicao adicional isenta',
        baseLegal: 'RIR/2018, Art. 725 e IN RFB 1.774/2017',
        acao: 'Implemente a ECD com seu contador para ampliar o limite de distribuicao.'
      });
    }
  }

  // 3. Adicional de IRPJ
  const basePresumidaTrim = (dist.basePresumidaAnual || 0) / 4;
  if (basePresumidaTrim > 60000) {
    const adicionalEstimado = Math.max(0, (basePresumidaTrim - 60000) * 0.10 * 4);
    dicas.push({
      tipo: 'atencao',
      titulo: 'Adicional de IRPJ (10%)',
      descricao: `Sua base presumida excede R$ 60.000/trimestre. O adicional de 10% representa aproximadamente ${_pdfFmtMoeda(adicionalEstimado)}/ano.`,
      baseLegal: 'RIR/2018, Art. 624',
      acao: 'Certifique-se de incluir o adicional no calculo do DARF trimestral.'
    });
  }

  // 4. IRRF Compensar
  if (fd.irrfRetido > 0) {
    dicas.push({
      tipo: 'economia',
      titulo: 'IRRF Retido — Compensacao',
      descricao: `Voce tem ${_pdfFmtMoeda(fd.irrfRetido)} de IRRF retido na fonte para compensar. Abata esse valor no DARF de IRPJ do trimestre correspondente.`,
      economia: _pdfFmtMoeda(fd.irrfRetido) + '/ano',
      baseLegal: 'RIR/2018, Art. 36',
      acao: 'Verifique com seu contador a correta compensacao por trimestre.'
    });
  }

  // 5. ISS Otimizacao
  if (aliquotaISS > 2 && rb > 0) {
    const economiaISS = rb * ((aliquotaISS - 2) / 100);
    dicas.push({
      tipo: 'info',
      titulo: 'ISS — Comparativo com Aliquota Minima',
      descricao: `Se o ISS do seu municipio fosse 2% (minimo legal pela LC 116/2003) em vez de ${aliquotaISS}%, a economia seria de ${_pdfFmtMoeda(economiaISS)}/ano.`,
      economia: _pdfFmtMoeda(economiaISS) + '/ano (diferencial teorico)',
      baseLegal: 'LC 116/2003, Art. 8-A',
      acao: 'Consulte incentivos fiscais municipais disponiveis para sua atividade.'
    });
  }

  // 6. PIS/COFINS Cumulativo
  dicas.push({
    tipo: 'info',
    titulo: 'PIS/COFINS Cumulativo — Simplicidade como Vantagem',
    descricao: 'No Lucro Presumido, PIS/COFINS e cumulativo com aliquota combinada de 3,65%. A simplicidade reduz custos contabeis estimados em R$ 6.000 a R$ 14.400/ano em relacao a regimes com creditos.',
    baseLegal: 'Lei 10.637/2002 e Lei 10.833/2003',
    acao: 'Aproveite a simplicidade do cumulativo para focar em gestao e crescimento.'
  });

  // 7. Regime de Caixa
  dicas.push({
    tipo: 'info',
    titulo: 'Regime de Caixa — Inadimplencia',
    descricao: 'Se sua empresa sofre com inadimplencia, a opcao pelo Regime de Caixa permite reconhecer receita apenas quando recebida, diferindo o pagamento de impostos.',
    baseLegal: 'IN RFB 1.700/2017',
    acao: 'Consulte seu contador sobre a opcao pelo Regime de Caixa na apuracao.'
  });

  // 8. Atividades Mistas
  if (fd.receitas && fd.receitas.length > 1) {
    const ativIds = [...new Set(fd.receitas.map(r => r.atividadeId))];
    if (ativIds.length > 1) {
      dicas.push({
        tipo: 'info',
        titulo: 'Composicao de Receita — Atividades Mistas',
        descricao: `Sua empresa possui ${fd.receitas.length} fontes de receita com atividades diferentes. Cada uma tem seu percentual de presuncao. Verifique se ha oportunidade de reclassificar receitas para presuncoes menores.`,
        baseLegal: 'Lei 9.249/95, Art. 15',
        acao: 'Revise a segregacao de receitas por CNAE com seu contador.'
      });
    }
  }

  // 10. Proximidade do Limite
  if (rb > 78000000 * 0.7) {
    const pctLimite = (rb / 78000000 * 100).toFixed(1);
    dicas.push({
      tipo: 'atencao',
      titulo: 'Proximidade do Limite de Elegibilidade',
      descricao: `Sua receita esta a ${pctLimite}% do limite de R$ 78 milhoes. Monitore de perto para garantir permanencia no Lucro Presumido no exercicio seguinte.`,
      baseLegal: 'Lei 9.718/1998, Art. 13',
      acao: 'Planeje com antecedencia caso haja risco de ultrapassar o limite de elegibilidade.'
    });
  }

  // Ordenar por economia potencial (dicas com economia primeiro)
  dicas.sort((a, b) => {
    if (a.economia && !b.economia) return -1;
    if (!a.economia && b.economia) return 1;
    return 0;
  });

  return dicas;
}

// ── PÁGINA 8 — OBRIGAÇÕES ACESSÓRIAS ──

function _pdfObrigacoes(doc) {
  doc.addPage();
  let y = _PDF_MARGIN.topNext;

  y = _pdfTituloSecao(doc, y, 'Obrigacoes Acessorias');

  const body = [];
  const chaves = ['DCTF', 'ECF', 'ECD', 'EFD_CONTRIBUICOES', 'DIRF', 'EFD_REINF', 'ESOCIAL'];
  chaves.forEach(key => {
    const ob = OBRIGACOES_ACESSORIAS[key];
    if (!ob) return;
    body.push([
      ob.nome.length > 40 ? ob.nome.substring(0, 40) + '...' : ob.nome,
      ob.periodicidade,
      ob.prazo,
      ob.obrigatoria ? 'Sim' : 'Opcional*'
    ]);
  });

  y = _pdfTabela(doc, y,
    ['Obrigacao', 'Periodicidade', 'Prazo', 'Obrigatoria'],
    body,
    {
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 55 },
        3: { cellWidth: 22, halign: 'center' }
      }
    }
  );

  y = _pdfInfoBox(doc, y,
    '* ECD e opcional no Lucro Presumido (pode usar Livro Caixa). Porem, e recomendada para distribuir lucro contabil efetivo superior a base presumida.\n' +
    '** DIRF obrigatoria se houve retencoes de IR na fonte. Nota: DIRF substituida por EFD-Reinf + eSocial a partir de 2025.',
    _PDF_CORES.azul
  );

  // Calendario de vencimentos
  y = _pdfCheckPage(doc, y, 40);
  y = _pdfTituloSecao(doc, y, 'Calendario de Vencimentos');

  const mesesNomes = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const calBody = mesesNomes.map((mes, i) => {
    const obsMes = [];
    obsMes.push('PIS/COFINS (ref. mes anterior) - dia 25');
    obsMes.push('DCTF - 15o dia util');
    obsMes.push('EFD-Contribuicoes - 10o dia util do 2o mes');
    obsMes.push('e-Social - dia 15');
    obsMes.push('EFD-Reinf - dia 15');
    if ([0, 3, 6, 9].includes(i)) {
      const trimRef = i === 0 ? '(ref. 4o trim ano anterior)' : `(ref. ${Math.ceil(i / 3)}o trim)`;
      obsMes.push(`IRPJ/CSLL trimestral - ultimo dia util ${trimRef}`);
    }
    if (i === 4) {
      obsMes.push('ECD (anual) - 31/05');
    }
    if (i === 6) {
      obsMes.push('ECF (anual) - ultimo dia util de julho');
    }
    if (i === 1) {
      obsMes.push('DIRF (anual) - 29/02');
    }
    return [mes, obsMes.join('\n')];
  });

  y = _pdfTabela(doc, y,
    ['Mes', 'Obrigacoes/Vencimentos'],
    calBody,
    {
      columnStyles: {
        0: { cellWidth: 30, fontStyle: 'bold' },
        1: { fontSize: 7 }
      },
      bodyStyles: { fontSize: 7, cellPadding: 1.5, textColor: _PDF_CORES.preto, lineColor: [226, 232, 240], lineWidth: 0.2 }
    }
  );

  return y;
}

// ── PÁGINA 9 — RISCOS FISCAIS ──

function _pdfRiscos(doc) {
  doc.addPage();
  let y = _PDF_MARGIN.topNext;

  y = _pdfTituloSecao(doc, y, 'Riscos Fiscais');

  const riscos = RISCOS_FISCAIS || [];

  const ordemGravidade = { critica: 0, alta: 1, media: 2, baixa: 3 };
  const riscosOrdenados = [...riscos].sort((a, b) => (ordemGravidade[a.gravidade] || 9) - (ordemGravidade[b.gravidade] || 9));

  const body = riscosOrdenados.map(r => {
    let gravidadeLabel = (r.gravidade || '').toUpperCase();
    let corFundo;
    switch (r.gravidade) {
      case 'critica': corFundo = [254, 226, 226]; break;
      case 'alta':    corFundo = [255, 237, 213]; break;
      case 'media':   corFundo = [254, 249, 195]; break;
      default:        corFundo = _PDF_CORES.cinzaClaro;
    }
    return [
      { content: gravidadeLabel, styles: { fillColor: corFundo, fontStyle: 'bold', fontSize: 7, halign: 'center' } },
      r.titulo,
      r.consequencia || '',
      r.prevencao || ''
    ];
  });

  y = _pdfTabela(doc, y,
    ['Gravidade', 'Risco', 'Consequencia', 'Prevencao'],
    body,
    {
      columnStyles: {
        0: { cellWidth: 22, halign: 'center' },
        1: { cellWidth: 40 },
        2: { cellWidth: 45 },
        3: { cellWidth: 50 }
      },
      bodyStyles: { fontSize: 7.5, cellPadding: 2, textColor: _PDF_CORES.preto, lineColor: [226, 232, 240], lineWidth: 0.2 }
    }
  );

  return y;
}

// ── PÁGINA 10 — PARÂMETROS (AUDITORIA) ──

function _pdfParametros(doc, fd) {
  doc.addPage();
  let y = _PDF_MARGIN.topNext;

  y = _pdfTituloSecao(doc, y, 'Parametros Utilizados (Auditoria)');

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(..._PDF_CORES.cinzaMedio);
  doc.text('Todos os parametros informados para reproducao e auditoria do calculo.', _PDF_MARGIN.left, y);
  y += 6;

  const params = [
    ['Razao Social', fd.razaoSocial || '-'],
    ['CNPJ', fd.cnpj || '-'],
    ['CNAE Principal', fd.cnaePrincipal || '-'],
    ['Atividade', fd.atividadeId || '-'],
    ['Estado', fd.estado || '-'],
    ['Municipio', fd.municipio || '-'],
    ['Aliquota ISS', (fd.aliquotaISS > 1 ? fd.aliquotaISS : (fd.aliquotaISS || 0) * 100) + '%'],
    ['Porte', fd.porte || '-'],
    ['Receita Bruta Anual', _pdfFmtMoeda(fd.receitaBrutaAnual)],
    ['Receita Ano Anterior', _pdfFmtMoeda(fd.receitaAnterior)],
    ['Folha de Pagamento', _pdfFmtMoeda(fd.folhaPagamento)],
    ['Aliquota RAT', (fd.aliquotaRAT || 0) + '%'],
    ['Aliquota Terceiros', (fd.aliquotaTerceiros || 0) + '%'],
    ['Total Despesas', _pdfFmtMoeda(fd.totalDespesas)],
    ['Lucro Contabil', _pdfFmtMoeda(fd.lucroContabil)],
    ['Prejuizos Fiscais', _pdfFmtMoeda(fd.prejuizosFiscais)],
    ['Escrituracao Completa', fd.temEscrituracao ? 'Sim' : 'Nao'],
    ['Equipamentos (Depreciacao)', fd.temEquipamentos ? 'Sim' : 'Nao'],
    ['Investimentos P&D', fd.temPD ? 'Sim' : 'Nao'],
    ['Receita Sazonal', fd.receitaSazonal ? 'Sim' : 'Nao'],

    ['Elegivel Simples', fd.elegivelSimples ? 'Sim' : 'Nao'],
    ['Devolucoes', _pdfFmtMoeda(fd.devolucoes)],
    ['Cancelamentos', _pdfFmtMoeda(fd.cancelamentos)],
    ['Descontos', _pdfFmtMoeda(fd.descontos)],
    ['Ganhos de Capital', _pdfFmtMoeda(fd.ganhosCapital)],
    ['Rendimentos Financeiros', _pdfFmtMoeda(fd.rendFinanceiros)],
    ['JCP Recebido', _pdfFmtMoeda(fd.jcpRecebido)],
    ['Multas Contratuais', _pdfFmtMoeda(fd.multasContratuais)],
    ['Receitas Financeiras Diversas', _pdfFmtMoeda(fd.recFinDiversas)],
    ['Valores Recuperados', _pdfFmtMoeda(fd.valoresRecuperados)],
    ['Demais Receitas', _pdfFmtMoeda(fd.demaisReceitas)],
    ['IRRF Retido', _pdfFmtMoeda(fd.irrfRetido)],
    ['CSLL Retida', _pdfFmtMoeda(fd.csllRetida)],
    ['PIS Retido', _pdfFmtMoeda(fd.pisRetido)],
    ['COFINS Retida', _pdfFmtMoeda(fd.cofinsRetida)]
  ];

  if (fd.socios && fd.socios.length > 0) {
    fd.socios.forEach((s, i) => {
      params.push([`Socio ${i + 1}`, `${s.nome} (${(s.percentual * 100).toFixed(1)}%)`]);
    });
  }

  if (fd.receitas && fd.receitas.length > 0) {
    fd.receitas.forEach((r, i) => {
      params.push([`Receita ${i + 1}`, `${r.atividadeId}: ${_pdfFmtMoeda(r.valor)}`]);
    });
  }

  const tableBody = params.map(([label, val]) => [
    { content: label, styles: { fontStyle: 'bold' } },
    val
  ]);

  y = _pdfTabela(doc, y,
    ['Parametro', 'Valor'],
    tableBody,
    {
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 100 }
      },
      bodyStyles: { fontSize: 8, cellPadding: 2, textColor: _PDF_CORES.preto, lineColor: [226, 232, 240], lineWidth: 0.2 }
    }
  );

  return y;
}

// ── FUNÇÃO PRINCIPAL — exportPDF ──

function exportPDF(appData) {
  const dados = appData || (typeof App !== 'undefined' ? App : null);
  if (!dados || !dados.formData || !dados.results || !dados.results.anual) {
    alert('Execute os calculos primeiro (Etapa 5) antes de exportar o PDF.');
    return;
  }

  if (typeof window.jspdf === 'undefined') {
    alert('Biblioteca jsPDF nao carregada. Verifique os CDNs no HTML.');
    return;
  }

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const fd = dados.formData;
    const res = dados.results;
    const anual = res.anual;
    const trimestral = res.trimestral || [];
    const piscofins = res.piscofins || [];

    // Página 1 — Capa
    _pdfCapa(doc, fd);

    // Página 2 — Resumo Executivo
    _pdfResumo(doc, fd, anual);

    // Página 3 — IRPJ/CSLL Trimestral
    if (trimestral.length === 4) {
      _pdfTrimestral(doc, trimestral, fd);
    }

    // Página 4 — PIS/COFINS Mensal
    _pdfPISCOFINS(doc, anual, piscofins);

    // Página 5 — ISS Municipal + INSS
    _pdfISS(doc, fd, anual);

    // Página 6 — Distribuição de Lucros
    _pdfDistribuicao(doc, anual);

    // Página 7 — Dicas de Economia
    _pdfDicasEconomia(doc, fd, anual);

    // Página 8 — Obrigações Acessórias
    _pdfObrigacoes(doc);

    // Página 9 — Riscos Fiscais
    _pdfRiscos(doc);

    // Página 10 — Parâmetros de Auditoria
    _pdfParametros(doc, fd);

    // Rodapé em todas as páginas (loop final)
    _pdfRodape(doc);

    // Download
    const nomeCliente = (fd.razaoSocial || fd.cnpj || 'empresa').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    const dataStr = new Date().toISOString().slice(0, 10);
    const nomeArquivo = `IMPOST_LucroPresumido_${nomeCliente}_${dataStr}.pdf`;
    doc.save(nomeArquivo);
  } catch(e) {
    alert('Erro ao gerar PDF: ' + e.message);
    console.error('Erro exportPDF:', e);
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 16A: SIMULADOR DE PRÓ-LABORE ÓTIMO (Etapa 3)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simula o pró-labore ótimo para um sócio, encontrando o valor que minimiza
 * a carga tributária total (INSS patronal + INSS retido + IRPF).
 *
 * A lógica é: quanto MENOR o pró-labore (respeitando o mínimo de 1 SM),
 * MENOR o custo tributário total, pois a distribuição de lucros é isenta.
 *
 * ALERTA: Todo sócio-administrador DEVE receber pró-labore de pelo menos
 * 1 salário mínimo (R$ 1.621,00 em 2026). A ausência gera risco de autuação
 * pelo INSS com cobrança retroativa de 20% patronal + 11% do sócio + multa + juros.
 *
 * Base Legal: IN RFB 971/2009, Art. 57 (obrigatoriedade); Decreto 3.048/99,
 * Art. 201 (contribuinte individual); Lei 9.249/95, Art. 10 (isenção lucros);
 * IN RFB 1.700/2017, Art. 238 (limite distribuição isenta).
 *
 * @param {Object} socio - Dados do sócio
 * @param {string} socio.nome - Nome do sócio
 * @param {number} socio.participacao - % do capital social (decimal, ex: 0.65)
 * @param {boolean} socio.isAdministrador - Se exerce atividade de administração
 * @param {number} socio.proLaboreAtual - Pró-labore atual mensal
 * @param {boolean} socio.temOutroVinculoCLT - Se já contribui INSS por outro vínculo
 * @param {number} socio.dependentesIRPF - Número de dependentes para dedução IRPF
 * @param {number} lucroDistribuivelIsento - Total de lucro distribuível isento (anual)
 * @returns {Object} Cenários, ótimo, atual, economia anual e recomendação
 */
function simularProLaboreOtimo(socio, lucroDistribuivelIsento) {
  const cenarios = [];
  const MIN = SALARIO_MINIMO_2026;
  const MAX = 30000;
  const STEP = 250;
  const dependentes = socio.dependentesIRPF || 0;

  for (let pl = MIN; pl <= MAX; pl += STEP) {
    // Ajustar primeiro valor para ser exatamente o SM
    const proLabore = (pl === MIN) ? MIN : pl;

    // === CUSTOS PARA A EMPRESA ===
    const inssPatronal = calcularINSSPatronal(proLabore);
    const custoEmpresaMensal = proLabore + inssPatronal;

    // === CUSTOS PARA O SÓCIO ===
    const inssRetido = socio.temOutroVinculoCLT ? 0 : calcularINSSSocio(proLabore);
    const irpf = calcularIRPFProLabore2026(proLabore, inssRetido, dependentes);

    // Líquido mensal via pró-labore
    const liquidoProLabore = proLabore - inssRetido - irpf.irFinal;

    // === DISTRIBUIÇÃO DE LUCROS (ISENTA) ===
    const lucroDoSocio = _arredondar(lucroDistribuivelIsento * (socio.participacao || 1));

    // === TOTAIS ANUAIS ===
    const custoTotalEmpresaAnual = _arredondar(custoEmpresaMensal * 12);
    const liquidoSocioAnual = _arredondar((liquidoProLabore * 12) + lucroDoSocio);
    const tributosAnuais = _arredondar((inssPatronal + inssRetido + irpf.irFinal) * 12);

    cenarios.push({
      proLaboreMensal: proLabore,
      inssPatronalMensal: inssPatronal,
      inssRetidoMensal: inssRetido,
      irpfMensal: irpf.irFinal,
      aliquotaEfetivaIRPF: irpf.aliquotaEfetiva,
      liquidoMensal: _arredondar(liquidoProLabore),
      custoEmpresaMensal: _arredondar(custoEmpresaMensal),
      custoEmpresaAnual: custoTotalEmpresaAnual,
      liquidoSocioAnual: liquidoSocioAnual,
      lucroDistribuivelSocio: lucroDoSocio,
      tributosAnuais: tributosAnuais,
      eficiencia: custoTotalEmpresaAnual > 0
        ? _arredondar(liquidoSocioAnual / custoTotalEmpresaAnual, 4)
        : 0
    });
  }

  // Encontrar ótimo (menor custo tributário)
  const cenariosOrdenados = [...cenarios].sort((a, b) => a.tributosAnuais - b.tributosAnuais);
  const otimo = cenariosOrdenados[0];

  // Cenário atual para comparação
  const atual = cenarios.find(c => c.proLaboreMensal === socio.proLaboreAtual)
    || _encontrarCenarioMaisProximo(cenarios, socio.proLaboreAtual || MIN);

  const economiaAnual = _arredondar((atual.tributosAnuais || 0) - (otimo.tributosAnuais || 0));

  // Cenários-chave para exibição rápida (5 cenários)
  const tetoINSS = cenarios.find(c => c.proLaboreMensal >= TETO_INSS_2026)
    || cenarios[cenarios.length - 1];
  const intermediario = cenarios.find(c => c.proLaboreMensal >= 5000)
    || cenarios[Math.floor(cenarios.length / 3)];

  const cenariosChave = [
    { ...cenarios[0], label: 'Minimo (1 SM)' },
    { ...atual, label: 'Atual' },
    { ...otimo, label: 'Otimo' },
    { ...tetoINSS, label: 'Teto INSS' },
    { ...intermediario, label: 'Intermediario' }
  ];

  // Remover duplicatas do cenariosChave
  const vistos = new Set();
  const cenariosChaveUnicos = cenariosChave.filter(c => {
    const key = c.proLaboreMensal;
    if (vistos.has(key)) return false;
    vistos.add(key);
    return true;
  });

  return {
    cenarios,
    cenariosChave: cenariosChaveUnicos,
    otimo,
    atual,
    economiaAnual,
    alerta: 'Todo socio-administrador DEVE receber pro-labore de pelo menos 1 salario minimo (R$ 1.621,00 em 2026). A ausencia gera risco de autuacao pelo INSS com cobranca retroativa de 20% patronal + 11% do socio + multa + juros.',
    recomendacao: otimo.proLaboreMensal === SALARIO_MINIMO_2026
      ? `O pro-labore otimo e o salario minimo (R$ ${SALARIO_MINIMO_2026.toLocaleString('pt-BR', {minimumFractionDigits: 2})}). Distribua o restante como lucros isentos.`
      : `O pro-labore otimo e R$ ${otimo.proLaboreMensal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}/mes.`,
    baseLegal: 'IN RFB 971/2009, Art. 57; Decreto 3.048/99, Art. 201; Lei 9.249/95, Art. 10; IN RFB 1.700/2017, Art. 238'
  };
}

/**
 * Encontra o cenário com pró-labore mais próximo do valor informado.
 * @private
 */
function _encontrarCenarioMaisProximo(cenarios, valor) {
  let melhor = cenarios[0];
  let menorDif = Math.abs(cenarios[0].proLaboreMensal - valor);
  for (const c of cenarios) {
    const dif = Math.abs(c.proLaboreMensal - valor);
    if (dif < menorDif) { melhor = c; menorDif = dif; }
  }
  return melhor;
}


// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 16B: SIMULADOR DE JCP (Etapa 3)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simula Juros sobre Capital Próprio (JCP) e compara com distribuição isenta
 * e pró-labore adicional.
 *
 * No Lucro Presumido, o JCP NÃO reduz a base do IRPJ/CSLL (a base é presumida).
 * Mas pode ser útil quando o lucro distribuível isento já se esgotou.
 *
 * Recomendação: SEMPRE usar distribuição isenta primeiro → JCP → pró-labore.
 *
 * Base Legal: Lei 9.249/95, Art. 9º e §§; LC 224/2025, Art. 8º (17,5% a partir
 * de 01/04/2026); Lei 9.249/95, Art. 9º, §1º (limite 50%).
 *
 * @param {Object} params
 * @param {number} params.patrimonioLiquido - PL da empresa
 * @param {number} params.taxaTJLP - Taxa TJLP vigente (decimal, ex: 0.0612)
 * @param {number} params.lucroLiquidoOuReservas - Lucro líquido ou lucros acumulados (para limite 50%)
 * @param {number} params.lucroDistribuivelIsentoRestante - Quanto ainda pode distribuir isento
 * @param {Date|string} params.dataReferencia - Data de referência para alíquota IRRF
 * @returns {Object} JCP bruto, líquido, IRRF, comparativo 3 vias, recomendação
 */
function simularJCP(params) {
  const {
    patrimonioLiquido,
    taxaTJLP,
    lucroLiquidoOuReservas,
    lucroDistribuivelIsentoRestante,
    dataReferencia
  } = params;

  const dataRef = dataReferencia instanceof Date
    ? dataReferencia
    : new Date(dataReferencia || '2026-06-30');

  // JCP máximo permitido
  const jcpMaximoPL = _arredondar(patrimonioLiquido * taxaTJLP);
  const limiteDeducao = _arredondar(lucroLiquidoOuReservas * 0.50);
  const jcpPermitido = _arredondar(Math.min(jcpMaximoPL, limiteDeducao));

  // IRRF sobre JCP
  const aliquota = getAliquotaIRRFJCP(dataRef);
  const irrfRetido = _arredondar(jcpPermitido * aliquota);
  const jcpLiquido = _arredondar(jcpPermitido - irrfRetido);

  // Comparativo: mesmo valor bruto via pró-labore
  const mesmoValorBruto = jcpPermitido;
  const inssPatronalPL = calcularINSSPatronal(mesmoValorBruto);
  const inssRetidoPL = calcularINSSSocio(mesmoValorBruto);
  const irpfPL = calcularIRPFProLabore2026(mesmoValorBruto, inssRetidoPL, 0);
  const liquidoViaProlabore = _arredondar(mesmoValorBruto - inssRetidoPL - irpfPL.irFinal);
  const custoTotalProlabore = _arredondar(mesmoValorBruto + inssPatronalPL);

  // Via distribuição isenta (custo zero)
  const valorDistribuicaoIsenta = Math.min(jcpPermitido, lucroDistribuivelIsentoRestante || 0);

  return {
    jcpBruto: jcpPermitido,
    jcpMaximoPL: jcpMaximoPL,
    limiteDeducao: limiteDeducao,
    aliquotaIRRF: aliquota,
    aliquotaIRRFPercentual: _arredondar(aliquota * 100, 1),
    irrfRetido: irrfRetido,
    jcpLiquido: jcpLiquido,
    comparativo: {
      viaDistribuicaoIsenta: {
        valorBruto: valorDistribuicaoIsenta,
        liquido: valorDistribuicaoIsenta,
        custo: 0,
        aliquotaEfetiva: 0,
        nota: lucroDistribuivelIsentoRestante > 0
          ? 'Se ha saldo de lucro distribuivel isento, SEMPRE e melhor que JCP.'
          : 'Sem saldo isento disponivel.'
      },
      viaJCP: {
        valorBruto: jcpPermitido,
        liquido: jcpLiquido,
        custo: irrfRetido,
        aliquotaEfetiva: aliquota
      },
      viaProlabore: {
        valorBruto: mesmoValorBruto,
        liquido: liquidoViaProlabore,
        custo: _arredondar(custoTotalProlabore - liquidoViaProlabore),
        custoTotal: custoTotalProlabore,
        aliquotaEfetiva: custoTotalProlabore > 0
          ? _arredondar((custoTotalProlabore - liquidoViaProlabore) / custoTotalProlabore, 4)
          : 0
      }
    },
    recomendacao: lucroDistribuivelIsentoRestante > 0
      ? 'Use primeiro a distribuicao de lucros isentos (custo ZERO). JCP so faz sentido quando o limite isento se esgota.'
      : jcpLiquido > liquidoViaProlabore
        ? `JCP e mais vantajoso que pro-labore adicional. Economia: R$ ${_arredondar(jcpLiquido - liquidoViaProlabore).toLocaleString('pt-BR', {minimumFractionDigits: 2})}.`
        : 'Pro-labore e mais vantajoso que JCP neste cenario.',
    baseLegal: 'Lei 9.249/95, Art. 9o e §§; LC 224/2025, Art. 8o (aliquota 17,5% a partir de 01/04/2026)'
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 16C: REGIME DE CAIXA vs COMPETÊNCIA (Etapa 3)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simula a diferença entre regime de Caixa e Competência para PIS/COFINS e
 * IRPJ/CSLL, mostrando o impacto no fluxo de caixa.
 *
 * Não muda o TOTAL de impostos no ano, mas muda QUANDO pagar.
 * Vantajoso quando há diferimento entre faturamento e recebimento.
 *
 * Base Legal: IN RFB 1.700/2017, Art. 223 e §§.
 *
 * @param {Object} params
 * @param {number[]} params.faturamentoMensal - Array de 12 valores faturados
 * @param {number[]} params.recebimentoMensal - Array de 12 valores recebidos
 * @param {string} [params.atividadeId='servicos_gerais'] - ID da atividade
 * @returns {Object} Comparativo mensal, total diferido, recomendação
 */
function simularRegimeCaixa(params) {
  const {
    faturamentoMensal,
    recebimentoMensal,
    atividadeId = 'servicos_gerais'
  } = params;

  // Garantir 12 meses
  const fat = Array.isArray(faturamentoMensal) ? faturamentoMensal : new Array(12).fill(0);
  const rec = Array.isArray(recebimentoMensal) ? recebimentoMensal : new Array(12).fill(0);

  // Buscar percentuais de presunção
  const irpjData = PERCENTUAIS_PRESUNCAO_IRPJ.find(p => p.id === atividadeId);
  const csllData = PERCENTUAIS_PRESUNCAO_CSLL.find(p => p.id === atividadeId);
  const percIRPJ = irpjData ? irpjData.percentual : 0.32;
  const percCSLL = csllData ? csllData.percentual : 0.32;

  const aliqPIS = ALIQUOTA_PIS_CUMULATIVO;
  const aliqCOFINS = ALIQUOTA_COFINS_CUMULATIVO;

  // PIS/COFINS mensal: competência vs caixa
  const tributosCompetencia = fat.map((f, i) => ({
    mes: i + 1,
    base: f,
    pis: _arredondar(f * aliqPIS),
    cofins: _arredondar(f * aliqCOFINS),
    totalPisCofins: _arredondar(f * (aliqPIS + aliqCOFINS))
  }));

  const tributosCaixa = rec.map((r, i) => ({
    mes: i + 1,
    base: r,
    pis: _arredondar(r * aliqPIS),
    cofins: _arredondar(r * aliqCOFINS),
    totalPisCofins: _arredondar(r * (aliqPIS + aliqCOFINS))
  }));

  // Diferença mensal de fluxo de caixa
  const diferencialMensal = fat.map((f, i) => {
    const difBase = f - rec[i];
    const economiaPisCofins = _arredondar(difBase * (aliqPIS + aliqCOFINS));
    return {
      mes: i + 1,
      faturado: f,
      recebido: rec[i],
      diferenca: _arredondar(difBase),
      economiaPisCofins: economiaPisCofins
    };
  });

  // IRPJ/CSLL trimestral: recalcular com base no recebimento vs faturamento
  const trimestresComparativo = [];
  for (let t = 0; t < 4; t++) {
    const mesesTrim = [t * 3, t * 3 + 1, t * 3 + 2];
    const receitaCompetencia = mesesTrim.reduce((s, m) => s + (fat[m] || 0), 0);
    const receitaCaixa = mesesTrim.reduce((s, m) => s + (rec[m] || 0), 0);

    const baseIRPJComp = _arredondar(receitaCompetencia * percIRPJ);
    const baseIRPJCaixa = _arredondar(receitaCaixa * percIRPJ);
    const baseCSLLComp = _arredondar(receitaCompetencia * percCSLL);
    const baseCSLLCaixa = _arredondar(receitaCaixa * percCSLL);

    const irpjComp = _arredondar(baseIRPJComp * ALIQUOTA_IRPJ + Math.max(0, baseIRPJComp - LIMITE_ADICIONAL_TRIMESTRAL) * ALIQUOTA_ADICIONAL_IRPJ);
    const irpjCaixa = _arredondar(baseIRPJCaixa * ALIQUOTA_IRPJ + Math.max(0, baseIRPJCaixa - LIMITE_ADICIONAL_TRIMESTRAL) * ALIQUOTA_ADICIONAL_IRPJ);
    const csllComp = _arredondar(baseCSLLComp * ALIQUOTA_CSLL);
    const csllCaixa = _arredondar(baseCSLLCaixa * ALIQUOTA_CSLL);

    const pisCompTrim = mesesTrim.reduce((s, m) => s + (tributosCompetencia[m] ? tributosCompetencia[m].pis : 0), 0);
    const cofinsCompTrim = mesesTrim.reduce((s, m) => s + (tributosCompetencia[m] ? tributosCompetencia[m].cofins : 0), 0);
    const pisCaixaTrim = mesesTrim.reduce((s, m) => s + (tributosCaixa[m] ? tributosCaixa[m].pis : 0), 0);
    const cofinsCaixaTrim = mesesTrim.reduce((s, m) => s + (tributosCaixa[m] ? tributosCaixa[m].cofins : 0), 0);

    trimestresComparativo.push({
      trimestre: t + 1,
      competencia: {
        receitaBruta: receitaCompetencia,
        irpj: irpjComp,
        csll: csllComp,
        pis: _arredondar(pisCompTrim),
        cofins: _arredondar(cofinsCompTrim),
        total: _arredondar(irpjComp + csllComp + pisCompTrim + cofinsCompTrim)
      },
      caixa: {
        receitaBruta: receitaCaixa,
        irpj: irpjCaixa,
        csll: csllCaixa,
        pis: _arredondar(pisCaixaTrim),
        cofins: _arredondar(cofinsCaixaTrim),
        total: _arredondar(irpjCaixa + csllCaixa + pisCaixaTrim + cofinsCaixaTrim)
      },
      diferenca: _arredondar((irpjComp + csllComp + pisCompTrim + cofinsCompTrim) -
        (irpjCaixa + csllCaixa + pisCaixaTrim + cofinsCaixaTrim))
    });
  }

  const totalDiferidoPisCofins = _arredondar(diferencialMensal.reduce((s, f) => s + f.economiaPisCofins, 0));
  const totalDiferidoIRPJCSLL = _arredondar(trimestresComparativo.reduce((s, t) => s + t.diferenca, 0) - totalDiferidoPisCofins);
  const totalDiferido = _arredondar(trimestresComparativo.reduce((s, t) => s + t.diferenca, 0));
  const totalFaturado = _arredondar(fat.reduce((s, v) => s + v, 0));
  const totalRecebido = _arredondar(rec.reduce((s, v) => s + v, 0));

  return {
    competencia: { tributosMensais: tributosCompetencia },
    caixa: { tributosMensais: tributosCaixa },
    diferencialMensal: diferencialMensal,
    trimestresComparativo: trimestresComparativo,
    totalFaturado: totalFaturado,
    totalRecebido: totalRecebido,
    totalDiferido: totalDiferido,
    totalDiferidoPisCofins: totalDiferidoPisCofins,
    totalDiferidoIRPJCSLL: totalDiferidoIRPJCSLL,
    recomendacao: totalDiferido > 0
      ? `Regime de Caixa posterga R$ ${totalDiferido.toLocaleString('pt-BR', {minimumFractionDigits: 2})} em tributos no ano. Beneficio de fluxo de caixa, nao de reducao de imposto.`
      : 'Regime de Competencia e mais favoravel neste cenario (recebimentos superam faturamento).',
    requisitos: [
      'Opcao irretratavel para o ano-calendario (IN RFB 1.700/2017, Art. 223)',
      'Manter Livro Caixa se nao tiver escrituracao completa (ECD)',
      'Controle detalhado de recebimentos por NF e cliente',
      'Emissao de nota fiscal no momento do faturamento (mesmo que receba depois)'
    ],
    baseLegal: 'IN RFB 1.700/2017, Art. 223 e §§'
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 16D: ESCRITURAÇÃO COMPLETA ECD — DISTRIBUIÇÃO AMPLIADA (Etapa 3)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula o benefício de adotar a Escrituração Contábil Digital (ECD) para
 * ampliar a distribuição de lucros isentos.
 *
 * Sem ECD: limite = Base Presumida IRPJ − todos os tributos
 * Com ECD: limite = Lucro Líquido Contábil − todos os tributos
 *
 * Se o lucro contábil > base presumida (comum em empresas com alta margem),
 * o sócio pode retirar MAIS sem pagar imposto.
 *
 * Base Legal: IN RFB 1.700/2017, Art. 238; IN RFB 1.774/2017 (ECD);
 * RIR/2018, Art. 725.
 *
 * @param {Object} params
 * @param {number} params.basePresumidaAnual - Base presumida IRPJ calculada pelo motor
 * @param {number} params.lucroContabilReal - Lucro contábil real (informado pelo usuário)
 * @param {number} params.tributosFederaisAnuais - IRPJ + CSLL + PIS + COFINS total
 * @param {number} params.custoAnualECD - Custo anual do contador pela escrituração completa
 * @returns {Object} Limites, distribuição extra, benefício líquido, recomendação
 */
function calcularBeneficioECD(params) {
  const {
    basePresumidaAnual,
    lucroContabilReal,
    tributosFederaisAnuais,
    custoAnualECD
  } = params;

  const limitePresumido = _arredondar(Math.max(0, basePresumidaAnual - tributosFederaisAnuais));
  const limiteContabil = _arredondar(Math.max(0, lucroContabilReal - tributosFederaisAnuais));

  const distribuicaoExtraPossivel = _arredondar(Math.max(0, limiteContabil - limitePresumido));
  const beneficioLiquido = _arredondar(distribuicaoExtraPossivel - custoAnualECD);

  const percentualGanho = limitePresumido > 0
    ? _arredondar((distribuicaoExtraPossivel / limitePresumido) * 100, 1)
    : 0;

  return {
    limitePresumido: limitePresumido,
    limiteContabil: limiteContabil,
    distribuicaoExtra: distribuicaoExtraPossivel,
    custoECD: custoAnualECD,
    beneficioLiquido: beneficioLiquido,
    percentualGanho: percentualGanho,
    valeAPena: beneficioLiquido > 0,
    recomendacao: beneficioLiquido > 0
      ? `Com ECD, distribua R$ ${distribuicaoExtraPossivel.toLocaleString('pt-BR', {minimumFractionDigits: 2})} a mais por ano como lucro isento. Beneficio liquido (descontando custo da ECD): R$ ${beneficioLiquido.toLocaleString('pt-BR', {minimumFractionDigits: 2})}/ano.`
      : custoAnualECD > 0
        ? `O custo da ECD (R$ ${custoAnualECD.toLocaleString('pt-BR', {minimumFractionDigits: 2})}) supera o beneficio de R$ ${distribuicaoExtraPossivel.toLocaleString('pt-BR', {minimumFractionDigits: 2})}. Nao recomendado.`
        : 'O lucro contabil nao excede a base presumida. ECD nao gera beneficio adicional na distribuicao.',
    baseLegal: 'IN RFB 1.700/2017, Art. 238; IN RFB 1.774/2017 (ECD); RIR/2018, Art. 725'
  };
}



// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 16F: FLUXO DE CAIXA TRIBUTÁRIO / CALENDÁRIO (Etapa 4)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gera o calendário tributário mensal com todos os vencimentos e valores.
 *
 * Tributos incluídos:
 * - PIS: DARF 8109, dia 25 do mês seguinte, mensal
 * - COFINS: DARF 2172, dia 25 do mês seguinte, mensal
 * - IRPJ: DARF 2089, trimestral (com opção de parcelamento em 3 quotas)
 * - CSLL: DARF 2372, trimestral (com opção de parcelamento em 3 quotas)
 * - ISS: conforme legislação municipal (padrão dia 10 ou 15), mensal
 * - INSS Patronal: GPS, dia 20 do mês seguinte, mensal
 *
 * Parcelamento IRPJ/CSLL: até 3 quotas (mínimo R$ 1.000/quota).
 * Quotas 2 e 3 com SELIC acumulada + 1%.
 *
 * Base Legal: Lei 9.430/96, Arts. 5º e 6º (quotas); RIR/2018, Art. 856.
 *
 * @param {Object} params
 * @param {Object} params.anualConsolidado - Resultado de calcularAnualConsolidado()
 * @param {number} [params.anoCalendario=2026] - Ano-calendário
 * @param {number} [params.aliquotaISS=0.03] - Alíquota ISS
 * @param {number} [params.folhaPagamentoMensal=0] - Folha mensal para cálculo INSS
 * @param {number} [params.aliquotaINSSTotal=0.235] - INSS patronal + RAT + terceiros
 * @param {number} [params.diaVencimentoISS=15] - Dia de vencimento ISS municipal
 * @param {boolean} [params.parcelarIRPJCSLL=false] - Parcelar em até 3 quotas
 * @param {number} [params.taxaSelicMensal=0.01] - Taxa SELIC mensal estimada
 * @returns {Object} Calendário 12 meses × tributos com totais
 */
function gerarCalendarioTributario(params) {
  const {
    anualConsolidado,
    anoCalendario = 2026,
    aliquotaISS = 0.03,
    folhaPagamentoMensal = 0,
    aliquotaINSSTotal = 0.235,
    diaVencimentoISS = 15,
    parcelarIRPJCSLL = false,
    taxaSelicMensal = 0.01
  } = params;

  const mesesNomes = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  // Dados mensais de PIS/COFINS do consolidado
  const detalhesMensais = (anualConsolidado && anualConsolidado.detalhamentoMensal) || [];
  const detalhesTrim = (anualConsolidado && anualConsolidado.detalhamentoTrimestral) || [];

  // IRPJ/CSLL por trimestre
  const irpjTrimestral = detalhesTrim.map(t => t.irpjDevido || 0);
  const csllTrimestral = detalhesTrim.map(t => t.csllDevida || 0);

  // Parcelamento: calcular quotas por tributo e trimestre
  function calcularQuotasTributo(valorTrimestral, parcelar) {
    if (!parcelar || valorTrimestral < 2000) {
      // Quota única (ou se valor total < 2 × R$ 1.000)
      return [{ valor: valorTrimestral, juros: 0, quota: 1 }];
    }
    const maxQ = Math.min(3, Math.floor(valorTrimestral / 1000));
    const quotas = [];
    const valorBase = _arredondar(valorTrimestral / maxQ);
    for (let q = 1; q <= maxQ; q++) {
      const isUltima = q === maxQ;
      const val = isUltima ? _arredondar(valorTrimestral - valorBase * (maxQ - 1)) : valorBase;
      const juros = q === 1 ? 0 : _arredondar(val * (taxaSelicMensal * q + 0.01));
      quotas.push({ valor: val, juros: juros, valorComJuros: _arredondar(val + juros), quota: q });
    }
    return quotas;
  }

  // Mapeamento: mês de vencimento IRPJ/CSLL
  // T1 (jan-mar): vence abr, mai, jun
  // T2 (abr-jun): vence jul, ago, set
  // T3 (jul-set): vence out, nov, dez
  // T4 (out-dez): vence jan+1, fev+1, mar+1
  const vencimentosTrim = [
    { trimestre: 1, mesesQuotas: [3, 4, 5] },     // T1 → abr(3), mai(4), jun(5)
    { trimestre: 2, mesesQuotas: [6, 7, 8] },     // T2 → jul(6), ago(7), set(8)
    { trimestre: 3, mesesQuotas: [9, 10, 11] },   // T3 → out(9), nov(10), dez(11)
    { trimestre: 4, mesesQuotas: [12, 13, 14] }   // T4 → jan+1(12), fev+1(13), mar+1(14)
  ];

  // Gerar calendário de 12 meses
  const calendario = [];
  let totalGeralAcumulado = 0;

  for (let m = 0; m < 12; m++) {
    const mesInfo = {
      mes: m + 1,
      mesNome: mesesNomes[m],
      tributos: {},
      totalMes: 0,
      totalAcumulado: 0
    };

    // PIS — referência mês anterior, vence dia 25 deste mês
    const pisMesRef = m > 0 ? (detalhesMensais[m - 1] || {}) : {};
    const pisDevido = pisMesRef.pis ? (pisMesRef.pis.devido || 0) : 0;
    mesInfo.tributos.pis = {
      valor: pisDevido,
      codigoDARF: '8109',
      vencimento: `Dia 25/${String(m + 1).padStart(2, '0')}`,
      referencia: m > 0 ? mesesNomes[m - 1] : '(Dez ano anterior)'
    };

    // COFINS — idem PIS
    const cofinsDevida = pisMesRef.cofins ? (pisMesRef.cofins.devida || 0) : 0;
    mesInfo.tributos.cofins = {
      valor: cofinsDevida,
      codigoDARF: '2172',
      vencimento: `Dia 25/${String(m + 1).padStart(2, '0')}`,
      referencia: m > 0 ? mesesNomes[m - 1] : '(Dez ano anterior)'
    };

    // IRPJ e CSLL — trimestral (pode ter quota neste mês)
    mesInfo.tributos.irpj = { valor: 0, codigoDARF: '2089', vencimento: '-', referencia: '-' };
    mesInfo.tributos.csll = { valor: 0, codigoDARF: '2372', vencimento: '-', referencia: '-' };

    for (let t = 0; t < 4; t++) {
      const venc = vencimentosTrim[t];
      const quotasIRPJ = calcularQuotasTributo(irpjTrimestral[t] || 0, parcelarIRPJCSLL);
      const quotasCSLL = calcularQuotasTributo(csllTrimestral[t] || 0, parcelarIRPJCSLL);

      for (let q = 0; q < quotasIRPJ.length; q++) {
        const mesVenc = venc.mesesQuotas[q];
        if (mesVenc === m) {
          // Vencimento cai neste mês (dentro do ano calendário)
          const quotaLabel = quotasIRPJ.length > 1 ? ` (Q${q + 1}/${quotasIRPJ.length})` : ' (unica)';
          mesInfo.tributos.irpj.valor += quotasIRPJ[q].valorComJuros || quotasIRPJ[q].valor;
          mesInfo.tributos.irpj.vencimento = `Ult. dia util/${String(m + 1).padStart(2, '0')}`;
          mesInfo.tributos.irpj.referencia = `${venc.trimestre}o Trim${quotaLabel}`;

          mesInfo.tributos.csll.valor += quotasCSLL[q] ? (quotasCSLL[q].valorComJuros || quotasCSLL[q].valor) : 0;
          mesInfo.tributos.csll.vencimento = `Ult. dia util/${String(m + 1).padStart(2, '0')}`;
          mesInfo.tributos.csll.referencia = `${venc.trimestre}o Trim${quotaLabel}`;
        }
      }
    }

    mesInfo.tributos.irpj.valor = _arredondar(mesInfo.tributos.irpj.valor);
    mesInfo.tributos.csll.valor = _arredondar(mesInfo.tributos.csll.valor);

    // ISS — mensal
    const receitaMensal = detalhesMensais[m] ? (detalhesMensais[m].receitaBrutaMensal || 0) : 0;
    const issValor = _arredondar(receitaMensal * aliquotaISS);
    mesInfo.tributos.iss = {
      valor: issValor,
      vencimento: `Dia ${diaVencimentoISS}/${String(m + 1).padStart(2, '0')}`,
      referencia: mesesNomes[m]
    };

    // INSS Patronal — GPS, dia 20 do mês seguinte (competência mês anterior)
    const inssMensal = _arredondar(folhaPagamentoMensal * aliquotaINSSTotal);
    mesInfo.tributos.inssPatronal = {
      valor: inssMensal,
      vencimento: `Dia 20/${String(m + 1).padStart(2, '0')}`,
      referencia: m > 0 ? mesesNomes[m - 1] : '(Dez ano anterior)'
    };

    // Totais
    mesInfo.totalMes = _arredondar(
      mesInfo.tributos.pis.valor +
      mesInfo.tributos.cofins.valor +
      mesInfo.tributos.irpj.valor +
      mesInfo.tributos.csll.valor +
      mesInfo.tributos.iss.valor +
      mesInfo.tributos.inssPatronal.valor
    );

    totalGeralAcumulado += mesInfo.totalMes;
    mesInfo.totalAcumulado = _arredondar(totalGeralAcumulado);

    calendario.push(mesInfo);
  }

  // Totais por tributo
  const totais = {
    pis: _arredondar(calendario.reduce((s, m) => s + m.tributos.pis.valor, 0)),
    cofins: _arredondar(calendario.reduce((s, m) => s + m.tributos.cofins.valor, 0)),
    irpj: _arredondar(calendario.reduce((s, m) => s + m.tributos.irpj.valor, 0)),
    csll: _arredondar(calendario.reduce((s, m) => s + m.tributos.csll.valor, 0)),
    iss: _arredondar(calendario.reduce((s, m) => s + m.tributos.iss.valor, 0)),
    inssPatronal: _arredondar(calendario.reduce((s, m) => s + m.tributos.inssPatronal.valor, 0)),
    total: _arredondar(totalGeralAcumulado)
  };

  // Meses com maior saída de caixa
  const mesesOrdenados = [...calendario].sort((a, b) => b.totalMes - a.totalMes);
  const picosCaixa = mesesOrdenados.slice(0, 3).map(m => ({
    mes: m.mesNome,
    valor: m.totalMes
  }));

  return {
    anoCalendario,
    parcelamento: parcelarIRPJCSLL,
    calendario: calendario,
    totais: totais,
    picosCaixa: picosCaixa,
    mediaMensal: _arredondar(totais.total / 12),
    codigosDARF: {
      pis: '8109',
      cofins: '2172',
      irpj: '2089',
      csll: '2372'
    },
    observacoes: [
      'Vencimentos aproximados — verificar calendario de feriados do municipio.',
      'IRPJ/CSLL: quotas 2 e 3 acrescidas de SELIC acumulada + 1%.',
      'Quotas minimas de R$ 1.000,00. Abaixo disso: quota unica obrigatoria.',
      'ISS: vencimento conforme legislacao municipal (padrao dia ' + diaVencimentoISS + ').',
      'INSS Patronal: GPS, competencia do mes anterior.'
    ],
    baseLegal: 'Lei 9.430/96, Arts. 5o e 6o (quotas); RIR/2018, Art. 856 (vencimentos); Lei 9.718/98 (PIS/COFINS).'
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 17: EXPORTAÇÕES
// ─────────────────────────────────────────────────────────────────────────────

// Exportação para uso como módulo ES ou CommonJS
const LucroPresumido = {
  // ── Constantes ──
  LIMITE_RECEITA_BRUTA_ANUAL,
  LIMITE_RECEITA_BRUTA_MENSAL,
  ALIQUOTA_IRPJ,
  ALIQUOTA_ADICIONAL_IRPJ,
  ALIQUOTA_CSLL,
  ALIQUOTA_PIS_CUMULATIVO,
  ALIQUOTA_COFINS_CUMULATIVO,
  ALIQUOTA_INSS_PATRONAL,
  LIMITE_ADICIONAL_TRIMESTRAL,
  LIMITE_ADICIONAL_MENSAL,

  // ── Constantes 2026 ──
  SALARIO_MINIMO_2026,
  TETO_INSS_2026,
  INSS_PATRONAL_ALIQUOTA,
  INSS_CONTRIBUINTE_INDIVIDUAL,
  TABELA_IRPF_2026,
  REDUTOR_IRPF_2026,
  DEDUCAO_DEPENDENTE_IRPF,
  DESCONTO_SIMPLIFICADO_IRPF,
  ALIQUOTA_IRRF_JCP_ANTIGA,
  ALIQUOTA_IRRF_JCP_NOVA,
  DATA_VIGENCIA_JCP_NOVA,
  LC224_DATA_VIGENCIA,
  LC224_LIMITE_ISENCAO_ANUAL,
  LC224_ACRESCIMO,
  ISS_MINIMO,
  ISS_MAXIMO,
  LIMITE_RECEITA_LP,
  LIMITE_DISPENSA_CSRF,
  ALIQUOTA_CSRF_TOTAL,
  LIMITE_RECEITA_ESC,

  // ── Tabelas de Referência ──
  PERCENTUAIS_PRESUNCAO_IRPJ,
  PERCENTUAIS_PRESUNCAO_CSLL,
  CODIGOS_DARF,
  OBRIGACOES_ACESSORIAS,
  IMPEDIMENTOS_LUCRO_PRESUMIDO,
  RISCOS_FISCAIS,
  TRANSICOES,

  // ── Funções de Cálculo ──
  calcularLucroPresumidoTrimestral,
  calcularPISCOFINSMensal,
  calcularAnualConsolidado,
  simulacaoRapida,

  // ── Funções LC 224/2025 e IRPF 2026 (Etapa 2) ──
  calcularBasePresumidaLC224,
  getAliquotaIRRFJCP,
  calcularIRPFProLabore2026,
  calcularINSSSocio,
  calcularINSSPatronal,

  // ── Funções de Otimização (Etapa 3) ──
  simularProLaboreOtimo,
  simularJCP,
  simularRegimeCaixa,
  calcularBeneficioECD,

  // ── Funções de Otimização (Etapa 4) ──
  gerarCalendarioTributario,

  // ── Constantes CSRF (Etapa 4) ──
  CODIGOS_DARF_RETENCAO,
  ALIQUOTAS_CSRF,

  // ── Base Legal Complementar (v3.4.0) ──
  VEDACOES_LP_DETALHADAS,
  PIS_COFINS_LEI_9718,
  HISTORICO_LIMITE_RECEITA_LP,
  CSLL_32PCT_SERVICOS,
  REQUISITOS_HOSPITALAR_8PCT,
  REGULAMENTACAO_IN_RFB,
  CONCEITO_RECEITA_BRUTA,
  REGRAS_ESPECIFICAS_LP_9430,
  MAPA_RIR_2018_LP,
  HISTORICO_ALIQUOTA_CSLL,
  ALTERACOES_LEI_12973_2014,
  MULTAS_E_PENALIDADES,
  RETENCOES_FONTE_LP,
  COMPENSACAO_TRIBUTARIA,
  ISS_DETALHAMENTO,
  CSLL_ALIQUOTAS_POR_SETOR,
  INSS_PATRONAL_DETALHAMENTO,
  TABELA_IRRF_SERVICOS_PJ,

  // ── Funções de Análise ──
  verificarElegibilidade,
  analisarVantagensDesvantagens,

  // ── Funções Auxiliares ──
  getTrimestres,
  getVencimentoPISCOFINS,
  getAtividadesDisponiveis,
  identificarAtividadePorCNAE,
  validarDadosEntrada,
  formatarResultadoTexto,

  // ── Exportação PDF ──
  exportPDF
};

// Compatibilidade CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LucroPresumido;
}

// Compatibilidade ESM
if (typeof globalThis !== 'undefined') {
  globalThis.LucroPresumido = LucroPresumido;
}

// Expor exportPDF globalmente para chamada direta pelo HTML
if (typeof window !== 'undefined') {
  window.exportPDF = function() { exportPDF(typeof App !== 'undefined' ? App : null); };
}


// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 18: TESTES E DEMONSTRAÇÃO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Executa demonstração completa com dados da AGROGEO BRASIL.
 * Rode: node lucro_presumido.js
 */
function _executarDemonstracao() {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   MOTOR DE CÁLCULO FISCAL — LUCRO PRESUMIDO v3.3           ║');
  console.log('║   AGROGEO BRASIL — Geotecnologia e Consultoria Ambiental   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  // ── 1. Identificação por CNAE ──
  console.log('\n\n▸ 1. IDENTIFICAÇÃO DA ATIVIDADE POR CNAE');
  console.log('─'.repeat(55));
  const atividade = identificarAtividadePorCNAE('71.19-7');
  console.log(`CNAE 71.19-7 → ${atividade.descricao}`);
  console.log(`Percentual IRPJ: ${(atividade.percentualIRPJ * 100).toFixed(1)}% | CSLL: ${(atividade.percentualCSLL * 100).toFixed(1)}%`);
  console.log(`Base Legal: ${atividade.baseLegal}`);

  // ── 2. Verificação de Elegibilidade ──
  console.log('\n\n▸ 2. VERIFICAÇÃO DE ELEGIBILIDADE');
  console.log('─'.repeat(55));
  const elegibilidade = verificarElegibilidade({
    receitaBrutaAnualAnterior: 2_350_000,
    mesesAtividadeAnoAnterior: 12,
    isInstituicaoFinanceira: false,
    isFactoring: false,
    temRendimentosExterior: false,
    temIsencaoReducaoIR: false,
    isSCP: false
  });
  console.log(`Elegível: ${elegibilidade.elegivel ? '✅ SIM' : '❌ NÃO'}`);
  console.log(`Limite aplicável: R$ ${_formatarMoeda(elegibilidade.limiteAplicavel)}`);
  if (elegibilidade.alertas.length > 0) {
    elegibilidade.alertas.forEach(a => console.log(`  ⚠️ ${a.mensagem}`));
  }

  // ── 3. Simulação Rápida ──
  console.log('\n\n▸ 3. SIMULAÇÃO RÁPIDA — 1 Trimestre');
  console.log('─'.repeat(55));
  const simRapida = simulacaoRapida(587_500, 'servicos_gerais');
  console.log(`Receita Trimestral: R$ ${_formatarMoeda(simRapida.receitaBrutaTrimestral)}`);
  console.log(`Base IRPJ (32%):    R$ ${_formatarMoeda(simRapida.baseIRPJ)}`);
  console.log(`IRPJ Total:         R$ ${_formatarMoeda(simRapida.irpj.total)}`);
  console.log(`CSLL Total:         R$ ${_formatarMoeda(simRapida.csll)}`);
  console.log(`PIS Trimestral:     R$ ${_formatarMoeda(simRapida.pisTrimestral)}`);
  console.log(`COFINS Trimestral:  R$ ${_formatarMoeda(simRapida.cofinsTrimestral)}`);
  console.log(`Total Federal:      R$ ${_formatarMoeda(simRapida.totalTributosFederais)}`);
  console.log(`Alíquota Efetiva:   ${simRapida.aliquotaEfetiva}`);

  // ── 4. Cálculo Trimestral Detalhado ──
  console.log('\n\n▸ 4. CÁLCULO TRIMESTRAL DETALHADO');
  const resultadoTrimestral = calcularLucroPresumidoTrimestral({
    receitas: [
      { atividadeId: 'servicos_gerais', valor: 600_000 }
    ],
    devolucoes: 10_000,
    cancelamentos: 0,
    descontosIncondicionais: 5_000,
    ganhosCapital: 3_000,
    rendimentosFinanceiros: 2_000,
    irrfRetidoFonte: 3_500
  });
  console.log(formatarResultadoTexto(resultadoTrimestral));

  // ── 5. Cálculo PIS/COFINS Mensal ──
  console.log('\n\n▸ 5. PIS/COFINS MENSAL');
  console.log('─'.repeat(55));
  const pisCofins = calcularPISCOFINSMensal({
    receitaBrutaMensal: 200_000,
    vendasCanceladas: 2_000,
    descontosIncondicionais: 1_000
  });
  console.log(`Receita Bruta:  R$ ${_formatarMoeda(pisCofins.receitaBrutaMensal)}`);
  console.log(`Base Cálculo:   R$ ${_formatarMoeda(pisCofins.baseCalculo)}`);
  console.log(`PIS (0,65%):    R$ ${_formatarMoeda(pisCofins.pis.devido)}`);
  console.log(`COFINS (3,00%): R$ ${_formatarMoeda(pisCofins.cofins.devida)}`);
  console.log(`Total:          R$ ${_formatarMoeda(pisCofins.totalPISCOFINS)}`);

  // ── 6. Riscos Fiscais ──
  console.log('\n\n▸ 6. RISCOS FISCAIS E PEGADINHAS');
  console.log('─'.repeat(55));
  RISCOS_FISCAIS.filter(r => r.gravidade === 'critica' || r.gravidade === 'alta').forEach(r => {
    console.log(`\n  🔴 [${r.gravidade.toUpperCase()}] ${r.titulo}`);
    console.log(`     ${r.descricao}`);
    console.log(`     Prevenção: ${r.prevencao}`);
  });

  // ── 7. ETAPA 2: LC 224/2025 — Validação ──
  console.log('\n\n▸ 7. ETAPA 2: LC 224/2025 — CÁLCULO BASE PRESUMIDA COM ACRÉSCIMO');
  console.log('─'.repeat(55));
  console.log('Cenário: Serviços (32%), receita R$ 2M/trim uniforme, ano 2026');

  const trimLC224 = [1, 2, 3, 4];
  let acumulado = 0;
  let totalBaseIRPJ_LC224 = 0;
  for (const t of trimLC224) {
    acumulado += 2_000_000;
    const res = calcularBasePresumidaLC224({
      receitaBrutaTrimestral: 2_000_000,
      receitaBrutaAcumuladaAnoAte: acumulado,
      percentualPresuncaoOriginal: 0.32,
      trimestreAtual: t,
      anoCalendario: 2026
    });
    totalBaseIRPJ_LC224 += res.basePresumida;
    console.log(`  T${t}: Base = R$ ${_formatarMoeda(res.basePresumida)} | LC224=${res.lc224Aplicavel ? 'SIM' : 'NÃO'} | Excedente: R$ ${_formatarMoeda(res.excedenteDoTrimestre)} | Impacto: R$ ${_formatarMoeda(res.impactoLC224)}`);
  }
  console.log(`  TOTAL BASE IRPJ ANUAL: R$ ${_formatarMoeda(totalBaseIRPJ_LC224)}`);
  console.log(`  SEM LC 224: R$ ${_formatarMoeda(8_000_000 * 0.32)} | COM LC 224: R$ ${_formatarMoeda(totalBaseIRPJ_LC224)}`);
  console.log(`  Impacto anual na base: R$ ${_formatarMoeda(totalBaseIRPJ_LC224 - 8_000_000 * 0.32)}`);
  console.log(`  Esperado: R$ 72.000 a mais`);

  // ── 8. ETAPA 2: JCP Alíquota Variável ──
  console.log('\n\n▸ 8. ETAPA 2: JCP — ALÍQUOTA VARIÁVEL');
  console.log('─'.repeat(55));
  const dataAntes = new Date(2026, 2, 31); // 31/03/2026
  const dataDepois = new Date(2026, 3, 1); // 01/04/2026
  console.log(`  JCP em 31/03/2026: ${(getAliquotaIRRFJCP(dataAntes) * 100).toFixed(1)}% (esperado: 15.0%)`);
  console.log(`  JCP em 01/04/2026: ${(getAliquotaIRRFJCP(dataDepois) * 100).toFixed(1)}% (esperado: 17.5%)`);

  // ── 9. ETAPA 2: IRPF 2026 com Redutor ──
  console.log('\n\n▸ 9. ETAPA 2: IRPF PRÓ-LABORE 2026 (Lei 15.270/2025)');
  console.log('─'.repeat(55));
  const cenariosPL = [1621, 3000, 5000, 7000, 10000, 15000];
  for (const pl of cenariosPL) {
    const inss = calcularINSSSocio(pl);
    const irpf = calcularIRPFProLabore2026(pl, inss, 0);
    const inssP = calcularINSSPatronal(pl);
    console.log(`  PL R$ ${pl.toLocaleString('pt-BR').padStart(8)} | INSS Sócio: R$ ${_formatarMoeda(inss).padStart(8)} | INSS Patron: R$ ${_formatarMoeda(inssP).padStart(8)} | IRPF: R$ ${_formatarMoeda(irpf.irFinal).padStart(8)} (redutor: R$ ${_formatarMoeda(irpf.redutorAdicional).padStart(7)}) | Aliq.Efet: ${(irpf.aliquotaEfetiva * 100).toFixed(2)}%`);
  }

  // ── 10. ETAPA 3: Pró-Labore Ótimo ──
  console.log('\n\n▸ 10. ETAPA 3: SIMULADOR DE PRÓ-LABORE ÓTIMO');
  console.log('─'.repeat(55));
  const simPL = simularProLaboreOtimo(
    {
      nome: 'Luis Fernando',
      participacao: 0.65,
      isAdministrador: true,
      proLaboreAtual: 5000,
      temOutroVinculoCLT: false,
      dependentesIRPF: 0
    },
    300000 // lucro distribuível isento anual estimado
  );
  console.log(`  Ótimo: R$ ${_formatarMoeda(simPL.otimo.proLaboreMensal)}/mês`);
  console.log(`  Atual: R$ ${_formatarMoeda(simPL.atual.proLaboreMensal)}/mês`);
  console.log(`  Economia anual: R$ ${_formatarMoeda(simPL.economiaAnual)}`);
  console.log(`  ${simPL.recomendacao}`);

  // ── 11. ETAPA 3: Simulador JCP ──
  console.log('\n\n▸ 11. ETAPA 3: SIMULADOR DE JCP');
  console.log('─'.repeat(55));
  const simJCP = simularJCP({
    patrimonioLiquido: 500000,
    taxaTJLP: 0.06,
    lucroLiquidoOuReservas: 400000,
    lucroDistribuivelIsentoRestante: 100000,
    dataReferencia: new Date(2026, 5, 15) // Junho/2026
  });
  console.log(`  JCP Bruto: R$ ${_formatarMoeda(simJCP.jcpBruto)}`);
  console.log(`  IRRF (${(simJCP.aliquotaIRRF * 100).toFixed(1)}%): R$ ${_formatarMoeda(simJCP.irrfRetido)}`);
  console.log(`  JCP Líquido: R$ ${_formatarMoeda(simJCP.jcpLiquido)}`);
  console.log(`  ${simJCP.recomendacao}`);

  // ── 12. ETAPA 3: Regime de Caixa vs Competência ──
  console.log('\n\n▸ 12. ETAPA 3: REGIME DE CAIXA vs COMPETÊNCIA');
  console.log('─'.repeat(55));
  const fat = Array(12).fill(196000); // ~R$ 2.35M/ano
  const rec = [150000, 180000, 220000, 190000, 200000, 160000, 210000, 195000, 185000, 205000, 170000, 285000];
  const simCaixa = simularRegimeCaixa({ faturamentoMensal: fat, recebimentoMensal: rec });
  console.log(`  Total diferido no ano: R$ ${_formatarMoeda(simCaixa.totalDiferido)}`);
  console.log(`  ${simCaixa.recomendacao}`);

  // ── 13. ETAPA 3: Benefício da ECD ──
  console.log('\n\n▸ 13. ETAPA 3: BENEFÍCIO DA ESCRITURAÇÃO COMPLETA (ECD)');
  console.log('─'.repeat(55));
  const simECD = calcularBeneficioECD({
    basePresumidaAnual: 752000,
    lucroContabilReal: 550000,
    tributosFederaisAnuais: 250000,
    custoAnualECD: 12000
  });
  console.log(`  Limite presumido: R$ ${_formatarMoeda(simECD.limitePresumido)}`);
  console.log(`  Limite contábil:  R$ ${_formatarMoeda(simECD.limiteContabil)}`);
  console.log(`  Distribuição extra: R$ ${_formatarMoeda(simECD.distribuicaoExtra)}`);
  console.log(`  Benefício líquido: R$ ${_formatarMoeda(simECD.beneficioLiquido)}`);
  console.log(`  ${simECD.recomendacao}`);

  // ── 14. ETAPA 4: Calendário Tributário ──
  console.log('\n\n▸ 14. ETAPA 4: CALENDÁRIO TRIBUTÁRIO (resumo)');
  console.log('─'.repeat(55));
  const cal = gerarCalendarioTributario({
    anoCalendario: 2026,
    receitaBrutaAnual: 2350000,
    irpjTrimestral: [28200, 28200, 28200, 28200],
    csllTrimestral: [16920, 16920, 16920, 16920],
    folhaPagamentoAnual: 1000000,
    aliquotaISS: 0.03,
    aliquotaRAT: 0.03,
    aliquotaTerceiros: 0.005
  });
  console.log(`  Total anual: R$ ${_formatarMoeda(cal.totais.total)}`);
  console.log(`  Média mensal: R$ ${_formatarMoeda(cal.mediaMensal)}`);
  console.log(`  Picos de caixa:`);
  cal.picosCaixa.forEach(p => console.log(`    ${p.mes}: R$ ${_formatarMoeda(p.valor)}`));

  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('  Demonstração concluída. Motor v3.3.0 — Todas as etapas (1-4) prontas.');
  console.log('═══════════════════════════════════════════════════════\n');
}

// Executa demonstração se rodado diretamente
if (typeof require !== 'undefined' && require.main === module) {
  _executarDemonstracao();
}
