/**
 * ══════════════════════════════════════════════════════════════════════════════
 * MOTOR DE CÁLCULO FISCAL — LUCRO PRESUMIDO
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * AGROGEO BRASIL - Geotecnologia e Consultoria Ambiental
 * Autor: Luis Fernando | Proprietário AGROGEO BRASIL
 * Versão: 3.8.0
 * Data: Fevereiro/2026
 *
 * Changelog v3.8.0:
 *   - FIX AUDITORIA 1: gerarCalendarioTributario() — ISS agora incide APENAS sobre
 *     receitas de serviços (presunção IRPJ >= 16%), NÃO sobre comércio/indústria.
 *     Novo param receitas[] permite segregar atividades. (LC 116/2003)
 *   - FIX AUDITORIA 2: calcularAnualConsolidado() — Adicionado alerta explícito sobre
 *     ausência de ICMS/IPI no cálculo. Receitas de comércio/indústria agora geram
 *     campo alertaICMS com estimativa e referência legal.
 *   - FIX AUDITORIA 3: verificarElegibilidade() — Validação defensiva contra valores
 *     formatados com separadores BR (ex: "4.000.000,00" lido como 400M). Novo campo
 *     valorRecebido no retorno para debug. Mensagem de erro mais clara.
 *   - FIX AUDITORIA 4: LC 224/2025 CSLL — Adicionado campo transparenciaLC224 no
 *     retorno trimestral para deixar explícito que T1/2026 usa percentuais ANTIGOS
 *     (12% CSLL) e T2-T4 usam majorados (13,2% CSLL) quando exceder R$ 5M.
 *   - MELHORIA AUDITORIA 5: Novo alerta de persistência de dados no disclaimerLegal.
 *   - MELHORIA AUDITORIA 6: gerarCalendarioTributario() — Alerta ICMS para atividades
 *     de comércio, indicando que o tributo não está incluso.
 *
 * Changelog v3.7.2:
 *   - BUG 2 FIX (DEFINITIVO): INSS Sócio — calcularINSSSocio() agora usa tabela
 *     progressiva por faixas (Portaria MPS/MF 13/2026, Anexo II; EC 103/2019) em vez
 *     de alíquota flat de 11%. Para R$ 5.000 de pró-labore: antes R$ 550,00 (11% flat),
 *     agora R$ 501,52 (progressivo). Isso elimina a divergência entre a linha "Atual"
 *     e os demais cenários na simulação de pró-labore ótimo.
 *     Tabela: 7,5% até R$ 1.621 | 9% até R$ 2.902,84 | 12% até R$ 4.354,27 | 14% até teto.
 *     Constante TABELA_INSS_PROGRESSIVA_2026 adicionada. INSS_CONTRIBUINTE_INDIVIDUAL (0.11)
 *     mantida para referência/comparação, mas não mais usada no cálculo.
 *
 * Changelog v3.7.1:
 *   - BUG 1 FIX: Coluna "Eficiência" na tabela Pró-Labore exibia "NaN%" —
 *     Adicionados campos eficienciaFormatada ("2.8x") e eficienciaDescricao prontos para renderização.
 *     O campo retornoPorRealTributo é um RATIO (não porcentagem). A UI deve usar eficienciaFormatada.
 *   - BUG 2 FIX: Pró-labore "Atual" não batia com valor digitado —
 *     O valor exato do proLaboreAtual agora é inserido como cenário forçado na grade de simulação.
 *     Não há mais arredondamento para o step mais próximo (R$ 250).
 *   - BUG 3 FIX: IRPF do Pró-Labore R$ 5.121 mostrava R$ 43,33 (deveria ser ~R$ 0) —
 *     Fórmula do redutor Lei 15.270/2025 corrigida: coeficiente incide sobre o EXCEDENTE acima de
 *     R$ 5.000 (limiteIsencaoTotal), não sobre o rendimento bruto total.
 *     Fórmula correta: valorReducao - coeficienteReducao × (proLabore - limiteIsencaoTotal)
 *   - DIVERGÊNCIA 1 FIX: Lucro Distribuível Isento usando base presumida —
 *     Adicionado campo alertaDistribuicao explícito no objeto distribuicaoLucros quando não há ECD,
 *     alertando que distribuir acima do lucro contábil real pode gerar tributação do sócio.
 *
 * Changelog v3.7.0:
 *   - FIX CRÍTICO (A): INSS Patronal — Separar folha CLT de pró-labore para RAT/Terceiros (Lei 8.212/91)
 *     RAT e Terceiros agora incidem APENAS sobre folha CLT, NÃO sobre pró-labore (Art. 22, III)
 *   - FIX CRÍTICO (B): ISS — Filtrar apenas receitas de serviços (LC 116/2003)
 *     Comércio/indústria não recolhem ISS; aceita param receitas[] no consolidado
 *   - FIX (C): Percentual reduzido 16% — Aplicado automaticamente em calcularLucroPresumidoTrimestral()
 *     Param exclusivamenteServicosElegiveis + receita ≤ R$120k → IRPJ 16% (IN RFB 1.700/2017, Art. 215, §10)
 *   - NOVA FUNÇÃO (D): calcularEconomiaLRComSUDAM() — Comparativo LP vs LR com benefício SUDAM/SUDENE
 *     Redução 75% IRPJ normal, créditos PIS/COFINS estimados (MP 2.199-14/2001)
 *   - MELHORIA (E): Regime de Caixa integrado ao calcularAnualConsolidado()
 *     Params regimeCaixa + recebimentosMensais[] → ajuste automático de bases trimestrais e PIS/COFINS
 *
 * Changelog v3.6.1:
 *   - FIX: simularProLaboreOtimo() — operador || substituído por ?? para participacao (evita bug com participacao=0)
 *   - MELHORIA: _normalizarSocio() — função utilitária para padronizar campos de sócios em todas as funções
 *   - MELHORIA: calcularAnualConsolidado() usa sociosNorm para consistência (proLabore + distribuição)
 *   - MELHORIA: simularProLaboreOtimoMultiSocios() usa sociosNorm
 *   - FIX: Validação da soma de participações dos sócios (alerta se ≠ 100%)
 *
 * Changelog v3.6.0:
 *   - FIX CRÍTICO: verificarElegibilidade() — validação defensiva de entrada + alias receitaBrutaAnual
 *   - FIX CRÍTICO: Distribuição por sócio — aceita tanto "percentual" quanto "participacao" (sem NaN)
 *   - FIX CRÍTICO: _arredondar() e _formatarMoeda() protegidas contra NaN/undefined
 *   - FIX: calcularPISCOFINSMensal() aceita "receitaBruta" como alias de "receitaBrutaMensal"
 *   - FIX: Floating-point em percentuais majorados LC 224 (arredondamento 4 casas)
 *   - FIX: INSS Patronal agora inclui pró-labore dos sócios automaticamente (20% sem teto)
 *   - FIX: PDF distribuição protegido contra valorIsento NaN/null
 *   - MELHORIA: calcularIRPFProLabore2026() retorna campo "detalhamento" com transparência total
 *   - MELHORIA: simularProLaboreOtimo() aceita opcoes (objetivoPrevidenciario, fatorRiscoAutuacao)
 *   - MELHORIA: Métrica "eficiencia" renomeada para "retornoPorRealTributo" (mais claro)
 *   - MELHORIA: Nova função simularProLaboreOtimoMultiSocios()
 *   - MELHORIA: Alerta CNAE 62.01-5 (software) sobre presunção 16% vs 32%
 *   - JURÍDICO: Disclaimer robusto em página dedicada no PDF (7 itens, SaaS-ready)
 *   - JURÍDICO: Rodapé PDF com referência à página de Aviso Legal
 *
 * Changelog v3.5.1:
 *   - Merge: v3.4.1 (melhorias) + v3.5.0 (cobertura completa IN 1.700/2017)
 *   - 6 atividades adicionais IRPJ/CSLL: infraestrutura_concessao, coleta_residuos,
 *     exploracao_rodovia, suprimento_agua_esgoto, servicos_limpeza_locacao_mao_obra,
 *     instituicao_financeira_16
 *   - SEÇÕES 17-32: Acréscimos, Exclusões, Percentual 16%, Lucro Arbitrado,
 *     Ganho Capital, Variação Cambial, Renda Variável, Arrendamento, Concessão,
 *     Deduções IF, Distribuição lucros, Otimizações, Regras condicionais,
 *     Regime caixa detalhado, Vedações, Metadados
 *   - Funções: verificarPercentualReduzido16(), calcularLucroArbitrado()
 *   - Todas as seções 17-32 agora EXPORTADAS no objeto LucroPresumido (correção v3.5.0)
 *   - Mantidas melhorias v3.4.1: observações SC COSIT 7/2021, disclaimer PDF
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
 *   - Fix: ESC CSLL corrigida de 38,4% para 32% — LC 167/2019 altera apenas IRPJ, não CSLL
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
const INSS_CONTRIBUINTE_INDIVIDUAL = 0.11;      // 11% alíquota flat (mantida para referência/comparação)

// ── INSS 2026 — Tabela progressiva mensal (Portaria MPS/MF 13/2026, Anexo II) ──
// EC 103/2019 introduziu cálculo progressivo por faixas.
// Aplicável a empregados, domésticos, avulsos e contribuintes individuais (pró-labore).

const TABELA_INSS_PROGRESSIVA_2026 = [
  { limite: 1621.00,   aliquota: 0.075 },   // 7,5% até 1 SM
  { limite: 2902.84,   aliquota: 0.09  },   // 9%
  { limite: 4354.27,   aliquota: 0.12  },   // 12%
  { limite: 8475.55,   aliquota: 0.14  }    // 14% até o teto
];

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
      percentualMajorado: _arredondar(percentualPresuncaoOriginal * (1 + LC224_ACRESCIMO), 4),
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

  // REGRA 4: Percentual majorado (arredondado para evitar imprecisão de ponto flutuante)
  const percentualMajorado = _arredondar(percentualPresuncaoOriginal * (1 + LC224_ACRESCIMO), 4);

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
  // BUG 3 FIX: O coeficiente de reducao incide sobre o EXCEDENTE acima do limite
  // de isencao (R$ 5.000), nao sobre o rendimento bruto total.
  // Formula corrigida: valorReducao - coeficienteReducao * (proLabore - limiteIsencaoTotal)
  // Isso garante que rendimentos logo acima de R$ 5.000 tenham IRPF proximo de zero.
  // ATENÇÃO: O redutor usa o RENDIMENTO BRUTO (proLabore), não a base de cálculo
  let redutorAdicional = 0;
  if (proLabore <= REDUTOR_IRPF_2026.limiteIsencaoTotal) {
    redutorAdicional = irCalculado; // Zera o IR
  } else if (proLabore <= REDUTOR_IRPF_2026.limiteReducaoParcial) {
    redutorAdicional = Math.max(0,
      REDUTOR_IRPF_2026.valorReducao - (REDUTOR_IRPF_2026.coeficienteReducao * (proLabore - REDUTOR_IRPF_2026.limiteIsencaoTotal))
    );
    redutorAdicional = Math.min(redutorAdicional, irCalculado);
  }
  // Acima de R$ 7.350: sem redutor

  const irFinal = Math.max(0, irCalculado - redutorAdicional);

  // Identificar faixa aplicada
  let faixaAplicada = 'Isento';
  for (let fi = 0; fi < TABELA_IRPF_2026.length; fi++) {
    if (baseCalculo <= TABELA_IRPF_2026[fi].limite) {
      faixaAplicada = fi === 0 ? 'Isento' : `${(TABELA_IRPF_2026[fi].aliquota * 100)}% (faixa ${fi + 1})`;
      break;
    }
  }

  return {
    baseCalculo: _arredondar(baseCalculo),
    irCalculado: _arredondar(irCalculado),
    redutorAdicional: _arredondar(redutorAdicional),
    irFinal: _arredondar(irFinal),
    aliquotaEfetiva: proLabore > 0 ? _arredondar(irFinal / proLabore, 4) : 0,
    detalhamento: {
      proLabore: proLabore,
      inssDescontado: inssDescontado,
      descontoSimplificado: DESCONTO_SIMPLIFICADO_IRPF,
      deducaoUsada: deducaoEfetiva > deducoesCompletas ? 'Desconto simplificado' : 'INSS + dependentes',
      deducaoValor: _arredondar(deducaoEfetiva),
      baseCalculo: _arredondar(baseCalculo),
      faixaAplicada: faixaAplicada,
      irBruto: _arredondar(irCalculado),
      redutorLei15270: _arredondar(redutorAdicional),
      irFinal: _arredondar(irFinal)
    }
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
  // ── BUG 2 FIX (v3.7.2): Usar tabela progressiva em vez de alíquota flat de 11% ──
  // A EC 103/2019 introduziu alíquotas progressivas por faixas.
  // Cálculo idêntico ao do IRPF: cada faixa incide apenas sobre o trecho correspondente.
  // Base Legal: Portaria MPS/MF 13/2026, Anexo II; EC 103/2019.
  const base = Math.min(proLabore, TETO_INSS_2026);
  if (base <= 0) return 0;

  let total = 0;
  let faixaAnterior = 0;

  for (const faixa of TABELA_INSS_PROGRESSIVA_2026) {
    if (base <= faixaAnterior) break;
    const trechoBase = Math.min(base, faixa.limite) - faixaAnterior;
    if (trechoBase > 0) {
      total += trechoBase * faixa.aliquota;
    }
    faixaAnterior = faixa.limite;
  }

  return _arredondar(total);
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
    cnaes: ['71.19-7', '71.12-0', '62.01-5', '62.04-0', '69.20-6', '70.20-4', '73.11-4'],
    observacoes: 'Inclui consultoria, engenharia, TI, contabilidade, advocacia e demais serviços profissionais.',
    alertaCNAE: {
      '62.01-5': 'ATENCAO: Desenvolvimento de software sob encomenda pode ter presuncao de 32% (servicos) OU 16% (quando ha cessao de direito de uso — Lei 9.249/95, Art. 15, §1o, III, "a" c/c IN RFB 1.700/2017). Consulte seu tributarista para avaliar o enquadramento especifico da sua atividade.'
    }
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
    observacoes: 'Locação de bens MÓVEIS e cessão de direitos. Para locação de IMÓVEIS próprios, usar imobiliaria_locacao. NOTA: Há divergência interpretativa sobre a presunção de CSLL para locação de bens móveis — a abordagem conservadora (32%) é aplicada por padrão. Consulte SC COSIT 7/2021 e jurisprudência favorável à alíquota de 12%.'
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
    descricao: 'Construção — Empreitada SEM fornecimento de materiais ou emprego PARCIAL de materiais',
    percentual: 0.32,
    irpjMajorado: 0.352,
    baseLegal: 'Lei 9.249/95, Art. 15, §1º, III, e / IN RFB 1.700/2017, Art. 33, §1º, IV, d',
    cnaes: ['41.20-4', '42.11-1'],
    observacoes: 'Empreitada sem fornecimento de todos os materiais indispensáveis, ou por administração, ou com emprego PARCIAL. Se fornece TODOS os materiais → usar construcao_com_material (8%).'
  },
  {
    id: 'infraestrutura_concessao',
    descricao: 'Construção/recuperação/reforma/ampliação/melhoramento de infraestrutura em concessão de serviços públicos',
    percentual: 0.32,
    irpjMajorado: 0.352,
    baseLegal: 'IN RFB 1.700/2017, Art. 33, §1º, IV, e',
    cnaes: ['42.11-1', '42.12-0', '42.13-8'],
    observacoes: 'Independente do emprego parcial ou total de materiais. Aplica-se 32% sempre em concessão de serviço público.'
  },
  {
    id: 'coleta_residuos',
    descricao: 'Coleta e transporte de resíduos até aterros sanitários ou local de descarte',
    percentual: 0.32,
    irpjMajorado: 0.352,
    baseLegal: 'IN RFB 1.700/2017, Art. 33, §1º, IV, g',
    cnaes: ['38.11-4', '38.12-2'],
    observacoes: 'Coleta, transporte e destinação de resíduos. NÃO confundir com transporte de cargas (8%).'
  },
  {
    id: 'exploracao_rodovia',
    descricao: 'Exploração de rodovia mediante cobrança de preço dos usuários — concessionárias/subconcessionárias',
    percentual: 0.32,
    irpjMajorado: 0.352,
    baseLegal: 'IN RFB 1.700/2017, Art. 33, §1º, IV, h (redação IN RFB 1881/2019)',
    cnaes: ['52.21-4'],
    observacoes: 'Conservação, manutenção, melhoramento, operação, monitoração e assistência aos usuários.'
  },
  {
    id: 'suprimento_agua_esgoto',
    descricao: 'Suprimento de água tratada e coleta/tratamento de esgotos — concessionárias/subconcessionárias',
    percentual: 0.32,
    irpjMajorado: 0.352,
    baseLegal: 'IN RFB 1.700/2017, Art. 33, §1º, IV, i (redação IN RFB 1881/2019)',
    cnaes: ['36.00-6', '37.01-1', '37.02-9'],
    observacoes: 'Concessionárias e subconcessionárias de serviço público de água e esgoto.'
  },
  {
    id: 'servicos_limpeza_locacao_mao_obra',
    descricao: 'Serviços em geral como limpeza e locação de mão de obra (ainda que fornecidos materiais)',
    percentual: 0.32,
    irpjMajorado: 0.352,
    baseLegal: 'IN RFB 1.700/2017, Art. 33, §2º',
    cnaes: ['81.11-7', '81.12-5', '81.21-4', '78.10-8', '78.20-5'],
    observacoes: 'O fornecimento de materiais NÃO reduz o percentual para 8%. Permanece 32%.'
  },
  {
    id: 'instituicao_financeira_16',
    descricao: 'Instituições financeiras optantes do Refis (bancos, corretoras, seguradoras, capitalização, previdência aberta)',
    percentual: 0.16,
    irpjMajorado: 0.176,
    baseLegal: 'IN RFB 1.700/2017, Art. 33, §1º, III, b',
    cnaes: ['64.*', '65.*', '66.*'],
    observacoes: 'Percentual de 16% para estimativa mensal. Regra geral: instituições financeiras são OBRIGADAS ao Lucro Real. Exceção: Refis (Art. 214, §5º-A, IN 1700/2017).'
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
    baseLegal: 'Lei 9.249/95, Art. 20, I',
    observacoes: 'NOTA: A aplicação de 32% para locação de bens móveis é a abordagem conservadora. Há divergência interpretativa: a SC COSIT 7/2021 aplica 32%, mas a interpretação majoritária da RFB e jurisprudência entende que locação de bens móveis não é prestação de serviços, cabendo CSLL a 12% (regra geral). Consulte seu advogado tributarista para avaliar a posição mais adequada ao seu caso.'
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
    descricao: 'Construção — Empreitada SEM fornecimento de materiais ou emprego PARCIAL',
    percentual: 0.32,
    csllMajorada: 0.352,
    baseLegal: 'Lei 9.249/95, Art. 20, I / IN RFB 1.700/2017, Art. 34, §1º, IX'
  },
  {
    id: 'infraestrutura_concessao',
    descricao: 'Construção/recuperação/reforma/ampliação de infraestrutura em concessão',
    percentual: 0.32,
    csllMajorada: 0.352,
    baseLegal: 'IN RFB 1.700/2017, Art. 34, §1º, V (redação IN RFB 1881/2019)'
  },
  {
    id: 'coleta_residuos',
    descricao: 'Coleta de resíduos e transporte até aterros/local de descarte',
    percentual: 0.32,
    csllMajorada: 0.352,
    baseLegal: 'IN RFB 1.700/2017, Art. 34, §1º, VII (redação IN RFB 1881/2019)'
  },
  {
    id: 'exploracao_rodovia',
    descricao: 'Exploração de rodovia por concessionárias/subconcessionárias',
    percentual: 0.32,
    csllMajorada: 0.352,
    baseLegal: 'IN RFB 1.700/2017, Art. 34, §1º, VI (redação IN RFB 1881/2019)'
  },
  {
    id: 'suprimento_agua_esgoto',
    descricao: 'Suprimento de água tratada e coleta/tratamento de esgotos',
    percentual: 0.32,
    csllMajorada: 0.352,
    baseLegal: 'IN RFB 1.700/2017, Art. 34, §1º, VIII (redação IN RFB 1881/2019)'
  },
  {
    id: 'servicos_limpeza_locacao_mao_obra',
    descricao: 'Serviços em geral como limpeza e locação de mão de obra',
    percentual: 0.32,
    csllMajorada: 0.352,
    baseLegal: 'IN RFB 1.700/2017, Art. 34, §3º'
  },
  {
    id: 'instituicao_financeira_16',
    descricao: 'Instituições financeiras (Refis)',
    percentual: 0.12,
    csllMajorada: 0.132,
    baseLegal: 'Lei 9.249/95, Art. 20, III — CSLL de instituições financeiras no LP segue 12% (transporte/serviços hospitalares)',
    nota: 'Nota: A alíquota da CSLL (9% regra geral, 20% para financeiras) é separada do percentual de presunção'
  },
  {
    id: 'esc',
    descricao: 'Empresa Simples de Crédito (ESC)',
    percentual: 0.32,
    csllMajorada: 0.352,
    baseLegal: 'Lei 9.249/95, Art. 20, I — CSLL segue regra geral de serviços (32%). LC 167/2019 majorou apenas o IRPJ (Art. 15, §1º, IV).'
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
  const anoVencimento = mes === 12 ? ano + 1 : ano;
  const mesIdx = mes === 12 ? 0 : mes;
  let data = new Date(anoVencimento, mesIdx, 25);
  // FIX (Erros 1+2): Usar loop para garantir dia útil (verifica fim de semana E feriados nacionais fixos)
  while (data.getDay() === 0 || data.getDay() === 6 || _isFeriadoFixo(data)) {
    data.setDate(data.getDate() - 1);
  }
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
  if (!dados || typeof dados !== 'object') {
    throw new Error('verificarElegibilidade: dados deve ser um objeto.');
  }

  // Aceitar "receitaBrutaAnual" como alias de "receitaBrutaAnualAnterior" (compatibilidade)
  if (dados.receitaBrutaAnual !== undefined && dados.receitaBrutaAnualAnterior === undefined) {
    dados.receitaBrutaAnualAnterior = dados.receitaBrutaAnual;
  }

  // FIX AUDITORIA 3: Validação defensiva contra valores formatados com separadores BR.
  // Problema detectado: "4.000.000,00" digitado no input → parseFloat lê "4" → multiplica por 100
  // ou lê "4000000.00" como 4 bilhões se separadores não forem tratados.
  // Solução: se receber string, tentar converter; se receber número, validar faixa de sanidade.
  if (typeof dados.receitaBrutaAnualAnterior === 'string') {
    // Converter formato BR (1.234.567,89) para número
    let valorStr = dados.receitaBrutaAnualAnterior
      .replace(/\s/g, '')          // remover espaços
      .replace(/R\$/g, '')         // remover símbolo R$
      .replace(/\./g, '')          // remover separador de milhar
      .replace(/,/g, '.');         // trocar vírgula decimal por ponto
    const valorConvertido = parseFloat(valorStr);
    if (isNaN(valorConvertido)) {
      throw new Error('verificarElegibilidade: receitaBrutaAnualAnterior não é um valor numérico válido. Valor recebido: "' + dados.receitaBrutaAnualAnterior + '".');
    }
    dados.receitaBrutaAnualAnterior = valorConvertido;
  }

  if (typeof dados.receitaBrutaAnualAnterior !== 'number' || isNaN(dados.receitaBrutaAnualAnterior)) {
    throw new Error('verificarElegibilidade: receitaBrutaAnualAnterior é obrigatório e deve ser numérico.');
  }

  // FIX AUDITORIA 3: Validação de sanidade — se valor parece absurdamente alto,
  // pode ser um erro de parsing (ex: 4.000.000 lido como 4000000000)
  if (dados.receitaBrutaAnualAnterior > 10_000_000_000) {
    console.warn('verificarElegibilidade: ATENÇÃO — Receita informada R$ ' + _formatarMoeda(dados.receitaBrutaAnualAnterior)
      + ' parece muito alta (> R$ 10 bilhões). Verifique se o valor foi formatado corretamente.');
  }

  const resultado = {
    elegivel: true,
    impedimentos: [],
    alertas: [],
    limiteAplicavel: LIMITE_RECEITA_BRUTA_ANUAL,
    valorRecebido: dados.receitaBrutaAnualAnterior  // FIX AUDITORIA 3: campo para debug
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
    receitaBrutaAcumuladaAnoAte = 0,
    exclusivamenteServicosElegiveis = false   // Percentual reduzido 16% (IN RFB 1.700/2017, Art. 215, §10)
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

  // ── Percentual Reduzido 16% (IN RFB 1.700/2017, Art. 215, §10) ──
  // Redução APENAS no IRPJ (32% → 16%). CSLL permanece 32%.
  const receitaAnualEstimada = receitaBrutaAcumuladaAnoAte > 0
    ? (receitaBrutaAcumuladaAnoAte / Math.max(1, trimestreAtual)) * 4
    : receitaBrutaTotal * 4;
  const elegivel16 = exclusivamenteServicosElegiveis
    && receitaAnualEstimada <= 120000;

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

    // Percentual reduzido 16%: substituir 0.32 por 0.16 apenas no IRPJ quando elegível
    const percentualIRPJEfetivo = (elegivel16 && atividadeIRPJ.percentual === 0.32)
      ? 0.16
      : atividadeIRPJ.percentual;

    // Calcular base IRPJ com LC 224
    let baseIRPJAtividade;
    let lc224IRPJ = null;
    if (trimestreAtual > 0) {
      lc224IRPJ = calcularBasePresumidaLC224({
        receitaBrutaTrimestral: receitaLiquidaAtividade,
        receitaBrutaAcumuladaAnoAte: receitaAcumuladaLC224 * proporcaoAtividadeNaReceita,
        percentualPresuncaoOriginal: percentualIRPJEfetivo,
        trimestreAtual,
        anoCalendario
      });
      baseIRPJAtividade = lc224IRPJ.basePresumida;
      impactoLC224TotalIRPJ += lc224IRPJ.impactoLC224;
      if (lc224IRPJ.lc224Aplicavel) lc224AplicadaNoTrimestre = true;
    } else {
      baseIRPJAtividade = receitaLiquidaAtividade * percentualIRPJEfetivo;
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

    // FIX (Erro 7): Guard contra divisão por zero quando receitaLiquidaAtividade = 0
    const percentualEfetivoIRPJ = (lc224IRPJ && lc224IRPJ.lc224Aplicavel && receitaLiquidaAtividade > 0)
      ? (baseIRPJAtividade / receitaLiquidaAtividade)
      : atividadeIRPJ.percentual;
    const percentualEfetivoCSLL = (lc224CSLL && lc224CSLL.lc224Aplicavel && receitaLiquidaAtividade > 0)
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
  // FIX (Erro 3): Usar basePresumidaIRPJ (sem adições obrigatórias) em vez de baseCalculoIRPJ.
  // Art. 725 RIR/2018: lucro isento = base presumida − IRPJ − CSLL.
  // Adições obrigatórias (Art. 595 RIR/2018) são tributadas integralmente e NÃO geram lucro distribuível isento.
  // NOTA: Este valor considera apenas IRPJ+CSLL (trimestral).
  // Para cálculo completo incluindo PIS/COFINS, use calcularAnualConsolidado().
  const lucroDistribuidoPresumido = _arredondar(Math.max(0, basePresumidaIRPJ - totalImpostos));

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
      baseLegal: 'LC 224/2025, Art. 4º, §4º, VII; §5º',
      // FIX AUDITORIA 4: Transparência sobre vigência da majoração
      transparencia: {
        trimestreAtual: trimestreAtual,
        anoCalendario: anoCalendario,
        vigenciaIRPJ: trimestreAtual >= 2 && anoCalendario >= 2026
          ? 'ATIVA — Acréscimo 10% aplicável a partir do 2º trimestre 2026'
          : 'INATIVA — 1º trimestre 2026 usa percentuais ANTIGOS (anterioridade nonagesimal CF Art. 150, III, "c")',
        vigenciaCSLL: trimestreAtual >= 2 && anoCalendario >= 2026
          ? 'ATIVA — CSLL majorada (ex: 12% → 13,2%) aplicável a partir do 2º trimestre 2026'
          : 'INATIVA — 1º trimestre 2026 usa CSLL percentual ANTIGO (ex: 12% para comércio)',
        nota: 'A LC 224/2025 entra em vigor em 01/04/2026 para IRPJ e CSLL. No 1º trimestre, os percentuais de presunção são os originais.'
      }
    },

    // Percentual Reduzido 16% (IN RFB 1.700/2017, Art. 215, §10)
    percentualReduzido: {
      elegivel: elegivel16,
      percentualUsado: elegivel16 ? 0.16 : null,
      receitaAnualEstimada: _arredondar(receitaAnualEstimada),
      alertaEstouro: (elegivel16 && receitaBrutaAcumuladaAnoAte > 120000)
        ? 'Receita acumulada excedeu R$ 120.000 — diferença de IRPJ deve ser recolhida sem multa até o último dia útil do mês seguinte ao trimestre de estouro.'
        : null
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

  // Aceitar tanto "receitaBrutaMensal" quanto "receitaBruta" (compatibilidade)
  const receitaBrutaMensal = params.receitaBrutaMensal ?? params.receitaBruta ?? 0;
  if (typeof receitaBrutaMensal !== 'number' || receitaBrutaMensal < 0) {
    console.warn('calcularPISCOFINSMensal: receitaBrutaMensal inválida, usando 0.');
  }

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
    receitas = [],               // Array de { atividadeId, valor } — para separar ISS (serviços) de ICMS (comércio)
    aliquotaISS = 0.03,
    folhaPagamentoAnual = 0,
    aliquotaRAT = 0.03,
    aliquotaTerceiros = 0.005,
    lucroContabilEfetivo = null,
    socios = [],
    regimeCaixa = false,         // Usar regime de caixa (recebimentos) em vez de competência
    recebimentosMensais = null,  // Array de 12 valores (recebimentos reais por mês)
    // ── NOVOS: Benefícios Fiscais Estaduais ──
    beneficiosAtivos = {},               // { sudam: true, sudene: false, zfmVendas: true, ... }
    receitasVendasZFM = 0,               // Vendas PARA a ZFM (qualquer empresa)
    receitasSUFRAMA = 0,                 // Receitas com projeto SUFRAMA aprovado
    receitasExportacao = 0,              // Exportações (imune PIS/COFINS)
    receitasIsenta = 0,                  // Outras isentas PIS/COFINS
    icmsST = 0,                          // ICMS-ST destacado
    ipiDestacado = 0,                    // IPI destacado
    exclusivamenteServicosElegiveis = false,
    inadimplencia = 0                    // Percentual 0-1 (ex: 0.10 = 10%)
  } = params;

  if (!Array.isArray(trimestres) || trimestres.length === 0) {
    throw new Error('calcularAnualConsolidado: informe ao menos 1 trimestre.');
  }

  // ── Regime de Caixa: pré-processar recebimentos (IN RFB 1.700/2017, Arts. 223-225) ──
  const usarRegimeCaixa = regimeCaixa && Array.isArray(recebimentosMensais) && recebimentosMensais.length === 12;

  // Agrupar recebimentos por trimestre (para ajustar bases trimestrais)
  let recebimentosTrimestre = null;
  if (usarRegimeCaixa) {
    recebimentosTrimestre = [0, 1, 2, 3].map(q =>
      recebimentosMensais.slice(q * 3, q * 3 + 3).reduce((s, v) => s + (v || 0), 0)
    );
  }

  // ── Cálculos Trimestrais (IRPJ + CSLL) com LC 224/2025 ──
  const anoCalendario = params.anoCalendario || new Date().getFullYear();
  let receitaAcumulada = 0;
  const resultadosTrimestres = trimestres.map((t, i) => {
    // Calcular receita bruta deste trimestre para acumular
    const receitaTrimestre = (t.receitas || []).reduce((sum, r) => sum + (r.valor || 0), 0)
      - (t.devolucoes || 0) - (t.cancelamentos || 0) - (t.descontosIncondicionais || 0);

    // Regime de Caixa: ajustar receitas proporcionalmente ao recebimento
    let trimestreParams = { ...t };
    if (usarRegimeCaixa && receitaTrimestre > 0) {
      const fatorCaixa = recebimentosTrimestre[i] / receitaTrimestre;
      trimestreParams.receitas = (t.receitas || []).map(r => ({
        ...r,
        valor: _arredondar((r.valor || 0) * fatorCaixa)
      }));
    }

    // FIX (Erro 8): Garantir que receita acumulada não fique negativa (deduções > receita)
    const receitaAcumular = usarRegimeCaixa
      ? Math.max(0, recebimentosTrimestre[i] || 0)
      : Math.max(0, receitaTrimestre);
    receitaAcumulada += receitaAcumular;

    const resultado = calcularLucroPresumidoTrimestral({
      ...trimestreParams,
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
    // Regime de Caixa: usar recebimento mensal como base de PIS/COFINS
    let mesParams = { ...m };
    if (usarRegimeCaixa) {
      mesParams.receitaBrutaMensal = recebimentosMensais[i] || 0;
    }
    if (mesParams.receitaBrutaMensal === undefined && mesParams.receitaBruta === undefined) {
      console.warn(`calcularAnualConsolidado: mês ${i + 1} sem receitaBrutaMensal. PIS/COFINS será zero.`);
    }
    const resultado = calcularPISCOFINSMensal(mesParams);
    return {
      mes: i + 1,
      ...resultado
    };
  });

  const totalPIS = resultadosMeses.reduce((s, m) => s + m.pis.devido, 0);
  const totalCOFINS = resultadosMeses.reduce((s, m) => s + m.cofins.devida, 0);

  // ── ISS — Apenas sobre receitas de SERVIÇOS (LC 116/2003) ──
  // Atividades com presunção IRPJ >= 16% são serviços (ISS)
  // Atividades com presunção 8% ou 1,6% são comércio/indústria (ICMS)
  let receitaServicosAnual = receitaBrutaAnual; // fallback: usar tudo se não tiver detalhamento

  if (receitas && receitas.length > 0) {
    receitaServicosAnual = 0;
    for (const rec of receitas) {
      const ativIRPJ = PERCENTUAIS_PRESUNCAO_IRPJ.find(a => a.id === rec.atividadeId);
      if (ativIRPJ && ativIRPJ.percentual >= 0.16) {
        receitaServicosAnual += (rec.valor || 0);
      }
    }
  }

  const issAnual = _arredondar(receitaServicosAnual * aliquotaISS);

  // ── INSS Patronal — Separar folha CLT de pró-labore (Lei 8.212/91) ──
  // Art. 22, I e II → Folha CLT: 20% patronal + RAT + Terceiros
  // Art. 22, III   → Contribuinte individual (sócio): apenas 20%, SEM RAT/Terceiros
  const sociosNorm = socios.map(_normalizarSocio);

  const somaParticipacoes = sociosNorm.reduce((s, soc) => s + soc.participacao, 0);
  if (somaParticipacoes > 0 && Math.abs(somaParticipacoes - 1) > 0.001) {
    console.warn(`calcularAnualConsolidado: Soma participações = ${(somaParticipacoes * 100).toFixed(1)}% (esperado: 100%).`);
  }

  const totalProLaboreAnual = sociosNorm.reduce((total, socio) => {
    return total + (socio.proLaboreMensal * 12);
  }, 0);

  // Subtrair pró-labore da folha informada para isolar folha CLT
  // (usuário pode ter informado folha total = CLT + pró-labore)
  const folhaCLTAnual = Math.max(0, folhaPagamentoAnual - totalProLaboreAnual);

  // Folha CLT: 20% + RAT + Terceiros
  const aliquotaINSSTotalCLT = ALIQUOTA_INSS_PATRONAL + aliquotaRAT + aliquotaTerceiros;
  const inssPatronalFolhaCLT = _arredondar(folhaCLTAnual * aliquotaINSSTotalCLT);

  // Pró-labore: APENAS 20% (SEM RAT, SEM Terceiros)
  const inssPatronalProLabore = _arredondar(totalProLaboreAnual * ALIQUOTA_INSS_PATRONAL);

  const inssPatronalAnual = inssPatronalFolhaCLT + inssPatronalProLabore;

  // ── Totais ──
  const tributosFederais = _arredondar(totalIRPJ + totalCSLL + totalPIS + totalCOFINS);
  const cargaTributariaTotal = _arredondar(tributosFederais + issAnual + inssPatronalAnual);
  const percentualCarga = receitaBrutaAnual > 0
    ? _arredondar((cargaTributariaTotal / receitaBrutaAnual) * 100, 2)
    : 0;

  // ── Distribuição de Lucros Isentos ──
  // FIX (Erros 4+6): Usar basePresumidaIRPJ (sem adições obrigatórias) para base de distribuição.
  // Art. 725 RIR/2018: lucro isento = base presumida − IRPJ − CSLL.
  // NOTA: Há divergência interpretativa sobre incluir PIS/COFINS:
  //   - Art. 725 RIR/2018: menciona apenas IRPJ e CSLL.
  //   - IN RFB 1.700/2017, Art. 238: menciona "impostos e contribuições" (pode incluir PIS/COFINS).
  //   - Posição adotada: Art. 725 RIR/2018 (somente IRPJ + CSLL), por ser norma hierárquica superior.
  //   - Para posição conservadora, use incluirPISCOFINSNaDistribuicao = true.
  const basePresumidaAnual = resultadosTrimestres.reduce((s, t) => s + t.basePresumidaIRPJ, 0);
  const tributosDistribuicao = _arredondar(totalIRPJ + totalCSLL);
  const tributosDistribuicaoConservador = _arredondar(totalIRPJ + totalCSLL + totalPIS + totalCOFINS);
  const lucroDistribuivelPresumido = _arredondar(Math.max(0, basePresumidaAnual - tributosDistribuicao));
  const lucroDistribuivelConservador = _arredondar(Math.max(0, basePresumidaAnual - tributosDistribuicaoConservador));

  let lucroDistribuivelContabil = null;
  if (lucroContabilEfetivo !== null) {
    lucroDistribuivelContabil = _arredondar(Math.max(0, lucroContabilEfetivo - tributosDistribuicao));
  }

  const lucroDistribuivel = lucroDistribuivelContabil !== null
    ? Math.max(lucroDistribuivelPresumido, lucroDistribuivelContabil)
    : lucroDistribuivelPresumido;

  // ── Distribuição por Sócio ──
  const distribuicaoPorSocio = sociosNorm.map(socio => {
    const pct = socio.participacao;
    return {
      nome: socio.nome,
      percentual: pct,
      percentualFormatado: `${(pct * 100).toFixed(1)}%`,
      valorIsento: _arredondar(lucroDistribuivel * pct),
      observacao: 'Isento de IR para pessoa física residente no Brasil (Art. 725 RIR/2018).'
    };
  });

  // ── Resumo de Benefícios Aplicados ──
  const totalExclusoesZFM = (receitasVendasZFM || 0) + (receitasSUFRAMA || 0);
  const totalExclusoesPISCOFINS = (receitasExportacao || 0) + (receitasIsenta || 0)
    + (icmsST || 0) + (ipiDestacado || 0) + totalExclusoesZFM;

  const beneficiosAplicados = {
    issApenasServicos: {
      ativo: receitas && receitas.length > 0,
      receitaServicos: _arredondar(receitaServicosAnual),
      receitaComercio: _arredondar(receitaBrutaAnual - receitaServicosAnual),
      economiaISS: _arredondar((receitaBrutaAnual - receitaServicosAnual) * aliquotaISS),
      nota: 'ISS incide apenas sobre serviços (LC 116/2003).'
    },
    inssSeparado: {
      ativo: totalProLaboreAnual > 0,
      folhaCLT: folhaCLTAnual,
      proLabore: totalProLaboreAnual,
      economiaRAT: _arredondar(totalProLaboreAnual * (aliquotaRAT + aliquotaTerceiros)),
      nota: 'RAT/Terceiros não incidem sobre pró-labore (Lei 8.212/91, Art. 22, III).'
    },
    zonFrancaVendas: {
      ativo: (receitasVendasZFM || 0) > 0,
      valor: receitasVendasZFM || 0,
      economiaPISCOFINS: _arredondar((receitasVendasZFM || 0) * 0.0365),
      nota: 'Vendas para ZFM isentas de PIS/COFINS (Lei 10.996/2004, Art. 2º).'
    },
    suframaSediada: {
      ativo: (receitasSUFRAMA || 0) > 0,
      valor: receitasSUFRAMA || 0,
      economiaPISCOFINS: _arredondar((receitasSUFRAMA || 0) * 0.0365),
      nota: 'Receitas SUFRAMA isentas de PIS/COFINS (Decreto 288/67).'
    },
    exportacao: {
      ativo: (receitasExportacao || 0) > 0,
      valor: receitasExportacao || 0,
      economiaPISCOFINS: _arredondar((receitasExportacao || 0) * 0.0365),
      nota: 'Exportações imunes de PIS/COFINS (CF/88, Art. 149, §2º, I).'
    },
    exclusoesPISCOFINS: {
      totalExcluido: _arredondar(totalExclusoesPISCOFINS),
      economiaTotalPISCOFINS: _arredondar(totalExclusoesPISCOFINS * 0.0365)
    },
    percentualReduzido16: {
      ativo: exclusivamenteServicosElegiveis && receitaBrutaAnual <= 120000,
      nota: 'Presunção IRPJ 16% para micro prestadoras (IN RFB 1.700/2017, Art. 215, §10).'
    },
    sudamSudene: {
      tipo: beneficiosAtivos.sudam ? 'SUDAM' : (beneficiosAtivos.sudene ? 'SUDENE' : null),
      ativo: !!(beneficiosAtivos.sudam || beneficiosAtivos.sudene),
      aplicaNoLP: false,
      nota: 'Redução 75% IRPJ exclusiva do Lucro Real. Veja comparativo.'
    },
    economiaTotal: 0  // calculado abaixo
  };

  // Somar economias reais (já aplicadas no cálculo)
  beneficiosAplicados.economiaTotal = _arredondar(
    beneficiosAplicados.issApenasServicos.economiaISS
    + beneficiosAplicados.inssSeparado.economiaRAT
    + beneficiosAplicados.exclusoesPISCOFINS.economiaTotalPISCOFINS
  );

  // ── FIX AUDITORIA 2: Alerta ICMS/IPI para atividades de comércio/indústria ──
  const receitaComercioIndustriaTotal = _arredondar(receitaBrutaAnual - receitaServicosAnual);
  let alertaICMS = null;
  if (receitaComercioIndustriaTotal > 0) {
    alertaICMS = {
      aplicavel: true,
      receitaComercio: receitaComercioIndustriaTotal,
      descricao: 'ATENÇÃO: ICMS e IPI NÃO estão incluídos neste cálculo. '
        + 'Receitas de comércio/indústria (R$ ' + _formatarMoeda(receitaComercioIndustriaTotal) + '/ano) '
        + 'estão sujeitas ao ICMS estadual (alíquota varia de 7% a 25% conforme UF e produto). '
        + 'A carga tributária TOTAL real é maior que a apresentada aqui.',
      baseLegal: 'LC 87/1996 (ICMS); Decreto 7.212/2010 (IPI)',
      nota: 'Consulte seu contador para calcular ICMS/IPI conforme legislação do seu estado.'
    };
  }

  return {
    anoCalendario: params.anoCalendario || new Date().getFullYear(),
    regime: 'Lucro Presumido',
    regimeCaixa: usarRegimeCaixa,

    receitaBrutaAnual: _arredondar(receitaBrutaAnual),
    elegibilidade: receitaBrutaAnual <= LIMITE_RECEITA_BRUTA_ANUAL
      ? 'Elegível'
      : 'INELEGÍVEL — Receita excede R$ 78 milhões',

    tributos: {
      irpj: { anual: _arredondar(totalIRPJ), trimestres: resultadosTrimestres.map(t => t.irpjDevido) },
      csll: { anual: _arredondar(totalCSLL), trimestres: resultadosTrimestres.map(t => t.csllDevida) },
      pis: { anual: _arredondar(totalPIS), meses: resultadosMeses.map(m => m.pis.devido) },
      cofins: { anual: _arredondar(totalCOFINS), meses: resultadosMeses.map(m => m.cofins.devida) },
      iss: {
        anual: issAnual,
        aliquota: `${(aliquotaISS * 100).toFixed(1)}%`,
        receitaBaseServicos: _arredondar(receitaServicosAnual),
        receitaComercioIndustria: _arredondar(receitaBrutaAnual - receitaServicosAnual),
        nota: 'ISS incide apenas sobre receitas de serviços (LC 116/2003). Receitas de comércio/indústria recolhem ICMS, não ISS.'
      },
      alertaICMS: alertaICMS,
      inssPatronal: {
        anual: inssPatronalAnual,
        folhaCLT: folhaCLTAnual,
        proLaboreTotal: totalProLaboreAnual,
        sobreFolhaCLT: inssPatronalFolhaCLT,
        sobreProLabore: inssPatronalProLabore,
        aliquotaCLT: `${(aliquotaINSSTotalCLT * 100).toFixed(1)}%`,
        aliquotaProLabore: `${(ALIQUOTA_INSS_PATRONAL * 100).toFixed(1)}%`,
        composicao: {
          patronal: `${(ALIQUOTA_INSS_PATRONAL * 100).toFixed(1)}%`,
          rat: `${(aliquotaRAT * 100).toFixed(1)}%`,
          terceiros: `${(aliquotaTerceiros * 100).toFixed(1)}%`
        },
        nota: 'INSS patronal 20% sobre pró-labore SEM teto e SEM RAT/Terceiros (Lei 8.212/91, Art. 22, III). RAT e Terceiros incidem APENAS sobre folha CLT (Art. 22, I e II).'
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
      tributosDescontados: tributosDistribuicao,
      tributosDescontadosConservador: tributosDistribuicaoConservador,
      lucroDistribuivelPresumido,
      lucroDistribuivelConservador,
      lucroDistribuivelContabil,
      lucroDistribuivelFinal: lucroDistribuivel,
      tipoBase: lucroDistribuivelContabil !== null ? 'Contábil (escrituração completa)' : 'Presumido',
      porSocio: distribuicaoPorSocio,
      baseLegal: 'IN RFB 1.700/2017, Art. 238; RIR/2018, Art. 725 — Lucros distribuídos com isenção: base presumida diminuída de IRPJ e CSLL devidos.',
      notaDivergencia: 'Há divergência interpretativa: Art. 725 RIR/2018 menciona IRPJ+CSLL; IN RFB 1.700/2017, Art. 238 menciona todos os impostos e contribuições. O campo lucroDistribuivelConservador desconta também PIS/COFINS.',
      // DIVERGÊNCIA 1 FIX: Alerta explícito sobre risco de distribuição acima do lucro contábil
      alertaDistribuicao: lucroDistribuivelContabil === null
        ? 'ATENÇÃO: O lucro distribuível isento foi calculado com base na presunção fiscal (IN SRF 93/97, Art. 48), pois não há escrituração contábil completa (ECD). Se o lucro contábil real da empresa for INFERIOR à base presumida, distribuir o valor total pode configurar distribuição acima do lucro efetivo, com risco de tributação do excedente como rendimento tributável do sócio (IRPF). Recomenda-se manter escrituração contábil para comprovar o lucro real.'
        : null
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

    // Benefícios Fiscais Aplicados — Alimenta a UI para exibir ficha de benefícios
    beneficiosAplicados,

    detalhamentoTrimestral: resultadosTrimestres,
    detalhamentoMensal: resultadosMeses
  };
}


// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 9.1: COMPARATIVO SUDAM/SUDENE — ECONOMIA POTENCIAL NO LUCRO REAL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calcula economia potencial estimada se a empresa migrasse para Lucro Real
 * com benefício SUDAM/SUDENE (redução de 75% do IRPJ normal).
 *
 * IMPORTANTE: Estimativa simplificada. Não substitui apuração real do LR.
 * O benefício exige laudo constitutivo aprovado pela SUDAM ou SUDENE.
 *
 * @param {Object} params
 * @param {number} params.irpjNormalAnualLP - IRPJ normal (15%) apurado no LP (sem adicional)
 * @param {number} params.irpjAdicionalAnualLP - Adicional 10% apurado no LP
 * @param {number} params.csllAnualLP - CSLL apurada no LP
 * @param {number} params.receitaBrutaAnual
 * @param {number} params.despesasOperacionaisAnuais - Despesas dedutíveis estimadas
 * @param {number} params.folhaPagamentoAnual
 * @param {boolean} params.temBeneficioSUDAM
 * @param {boolean} params.temBeneficioSUDENE
 * @returns {Object} Estimativa comparativa
 */
function calcularEconomiaLRComSUDAM(params) {
  const {
    irpjNormalAnualLP = 0,
    irpjAdicionalAnualLP = 0,
    csllAnualLP = 0,
    receitaBrutaAnual = 0,
    despesasOperacionaisAnuais = 0,
    folhaPagamentoAnual = 0,
    temBeneficioSUDAM = false,
    temBeneficioSUDENE = false
  } = params;

  if (!temBeneficioSUDAM && !temBeneficioSUDENE) {
    return { aplicavel: false };
  }

  // Estimar lucro real (simplificado)
  const despesasTotais = despesasOperacionaisAnuais + folhaPagamentoAnual;
  const lucroRealEstimado = Math.max(0, receitaBrutaAnual - despesasTotais);

  // IRPJ no LR (sem o benefício)
  const irpjNormalLR = _arredondar(lucroRealEstimado * ALIQUOTA_IRPJ);
  const baseAdicionalLR = Math.max(0, lucroRealEstimado - (LIMITE_ADICIONAL_TRIMESTRAL * 4));
  const irpjAdicionalLR = _arredondar(baseAdicionalLR * ALIQUOTA_ADICIONAL_IRPJ);

  // IRPJ no LR COM benefício SUDAM/SUDENE (75% redução do normal, NÃO do adicional)
  const reducao75 = _arredondar(irpjNormalLR * 0.75);
  const irpjNormalLRComBeneficio = _arredondar(irpjNormalLR - reducao75);
  const irpjTotalLRComBeneficio = _arredondar(irpjNormalLRComBeneficio + irpjAdicionalLR);

  // CSLL no LR (mesma base, sem redução — SUDAM/SUDENE não reduz CSLL)
  const csllLR = _arredondar(lucroRealEstimado * ALIQUOTA_CSLL);

  // PIS/COFINS não-cumulativo no LR (9,25% com créditos estimados)
  const pisCofinsLRBruto = _arredondar(receitaBrutaAnual * 0.0925);
  const creditosEstimados = _arredondar(despesasTotais * 0.0925 * 0.5); // 50% conservador
  const pisCofinsLR = _arredondar(Math.max(0, pisCofinsLRBruto - creditosEstimados));

  // Total LR com SUDAM
  const totalLRComBeneficio = _arredondar(irpjTotalLRComBeneficio + csllLR + pisCofinsLR);

  // Total LP atual
  const pisCofinsLP = _arredondar(receitaBrutaAnual * 0.0365);
  const totalLP = _arredondar(irpjNormalAnualLP + irpjAdicionalAnualLP + csllAnualLP + pisCofinsLP);

  // Economia
  const economiaEstimada = _arredondar(totalLP - totalLRComBeneficio);
  const economiaPercentual = totalLP > 0
    ? _arredondar((economiaEstimada / totalLP) * 100, 1)
    : 0;

  const tipo = temBeneficioSUDAM ? 'SUDAM' : 'SUDENE';

  return {
    aplicavel: true,
    tipo,
    reducao75IRPJ: reducao75,
    comparativo: {
      lpAtual: {
        irpj: _arredondar(irpjNormalAnualLP + irpjAdicionalAnualLP),
        csll: csllAnualLP,
        pisCofins: pisCofinsLP,
        total: totalLP
      },
      lrComBeneficio: {
        irpjNormal: irpjNormalLRComBeneficio,
        irpjAdicional: irpjAdicionalLR,
        reducaoSUDAM: reducao75,
        csll: csllLR,
        pisCofins: pisCofinsLR,
        creditosEstimados,
        total: totalLRComBeneficio
      }
    },
    economiaEstimada,
    economiaPercentual: `${economiaPercentual}%`,
    favoravel: economiaEstimada > 0 ? 'LR_COM_' + tipo : 'LP',
    alertas: [
      'Estimativa simplificada — valores reais dependem de apuração contábil completa no Lucro Real.',
      `Requer laudo constitutivo aprovado pela ${tipo} com projeto em atividade elegível.`,
      'Redução de 75% incide APENAS sobre IRPJ normal (15%). Adicional de 10% NÃO é reduzido.',
      'Reinvestimento de 30% do imposto economizado pode ser obrigatório (Lei 9.532/97, Art. 3º, §4º).',
      'PIS/COFINS no LR é não-cumulativo (9,25% com créditos) — créditos estimados podem variar.'
    ],
    baseLegal: 'MP 2.199-14/2001, Art. 1º; Lei 9.532/97, Art. 3º; Lei 12.715/2012, Art. 1º'
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
    regra: 'Lucros isentos = base presumida MENOS IRPJ e CSLL devidos (Art. 725 RIR/2018). NOTA: IN RFB 1.700/2017, Art. 238 menciona "impostos e contribuições", o que pode incluir PIS/COFINS. Implementação adota posição do Art. 725 RIR/2018 (somente IRPJ+CSLL). Campo lucroDistribuivelConservador disponibiliza cálculo alternativo.',
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
 * Normaliza objeto de sócio para garantir campos consistentes.
 * Aceita tanto "participacao" quanto "percentual", "proLaboreMensal" quanto "proLabore"/"proLaboreAtual".
 * @private
 * @param {Object} socio - Objeto do sócio com campos possivelmente inconsistentes
 * @returns {Object} Sócio com campos normalizados
 */
function _normalizarSocio(socio) {
  return {
    nome: socio.nome || 'Sócio',
    participacao: socio.participacao ?? socio.percentual ?? 0,
    proLaboreMensal: socio.proLaboreMensal ?? socio.proLabore ?? socio.proLaboreAtual ?? 0,
    isAdministrador: socio.isAdministrador ?? true,
    dependentesIRPF: socio.dependentesIRPF ?? 0,
    temOutroVinculoCLT: socio.temOutroVinculoCLT ?? false
  };
}

/**
 * Arredonda valor para centavos (2 casas decimais) ou casas especificadas.
 * @private
 */
function _arredondar(valor, casas = 2) {
  if (typeof valor !== 'number' || isNaN(valor)) return 0;
  const fator = Math.pow(10, casas);
  return Math.round(valor * fator) / fator;
}

/**
 * Formata valor como moeda brasileira (sem símbolo R$).
 * @private
 */
function _formatarMoeda(valor) {
  const v = (typeof valor === 'number' && !isNaN(valor)) ? valor : 0;
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
          baseLegal: atividade.baseLegal,
          alertaCNAE: atividade.alertaCNAE || null
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

function _pdfDisclaimerPage(doc) {
  doc.addPage();
  let y = _PDF_MARGIN.topNext;

  y = _pdfTituloSecao(doc, y, 'AVISO LEGAL — IMPOST (Inteligencia em Modelagem de Otimizacao Tributaria)');

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(..._PDF_CORES.preto);

  const disclaimerItems = [
    '1. NATUREZA DA FERRAMENTA: O IMPOST e uma ferramenta de SIMULACAO e PLANEJAMENTO tributario. Os valores aqui apresentados sao estimativas baseadas na legislacao vigente e nos dados informados pelo usuario.',
    '2. NAO SUBSTITUI ESCRITURACAO CONTABIL: Os calculos apresentados NAO substituem a Escrituracao Contabil Digital (ECD), a Escrituracao Contabil Fiscal (ECF), nem quaisquer obrigacoes acessorias exigidas pela Receita Federal do Brasil.',
    '3. NAO CONSTITUI DECLARACAO FISCAL: Os valores apurados por esta ferramenta NAO constituem declaracao fiscal, confissao de divida, nem documento habil para fins de fiscalizacao. A responsabilidade pela apuracao oficial dos tributos permanece integralmente com o contribuinte e seu contador.',
    '4. LIMITACOES: A ferramenta pode nao contemplar todas as particularidades do caso concreto, incluindo mas nao se limitando a: regimes especiais, incentivos fiscais estaduais/municipais, decisoes judiciais aplicaveis, solucoes de consulta especificas, e alteracoes legislativas posteriores a ultima atualizacao.',
    '5. RECOMENDACAO: Consulte SEMPRE um profissional contabil habilitado (CRC ativo) antes de tomar decisoes tributarias baseadas nos resultados desta ferramenta.',
    '6. LEGISLACAO BASE: Lei 9.249/1995; Lei 9.430/1996; Lei 9.718/1998; RIR/2018 (Decreto 9.580/2018); IN RFB 1.700/2017; LC 224/2025; Lei 15.270/2025.',
    '7. TERMO DE USO: Ao utilizar esta ferramenta e/ou gerar relatorios PDF, o usuario declara estar ciente das limitacoes acima e assume inteira responsabilidade pelo uso dos dados apresentados.'
  ];

  const maxWidth = _PDF_WIDTH - _PDF_MARGIN.left - _PDF_MARGIN.right;
  for (const item of disclaimerItems) {
    y = _pdfCheckPage(doc, y, 20);
    const lines = doc.splitTextToSize(item, maxWidth);
    doc.text(lines, _PDF_MARGIN.left, y);
    y += lines.length * 4 + 3;
  }

  y += 5;
  doc.setFont('Helvetica', 'italic');
  doc.setFontSize(8);
  doc.text('Versao do motor de calculo: v3.6.1 | Ultima atualizacao legislativa: Fevereiro/2026', _PDF_MARGIN.left, y);

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
    doc.text('AVISO LEGAL: Simulacao tributaria. NAO constitui declaracao fiscal nem parecer contabil/juridico. Consulte profissional habilitado (CRC ativo). Veja pagina de Aviso Legal.', _PDF_MARGIN.left, yRod + 3.5);
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

  const totalIsento = socios.reduce((s, x) => s + (x.valorIsento || 0), 0);
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
    ['(-) IRPJ + CSLL:', _pdfFmtMoeda(dist.tributosDescontados)],
    ['(=) Lucro distribuivel (presumido):', _pdfFmtMoeda(dist.lucroDistribuivelPresumido)]
  ];

  if (dist.lucroDistribuivelContabil !== null && dist.lucroDistribuivelContabil !== undefined) {
    linhasCalc.push(['Lucro contabil efetivo:', _pdfFmtMoeda(dist.lucroContabilEfetivo)]);
    linhasCalc.push(['(-) IRPJ + CSLL:', _pdfFmtMoeda(dist.tributosDescontados)]);
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

    // Página 11 — Aviso Legal / Disclaimer
    _pdfDisclaimerPage(doc);

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
function simularProLaboreOtimo(socio, lucroDistribuivelIsento, opcoes = {}) {
  const {
    objetivoPrevidenciario = 'minimo', // 'minimo' | 'teto' | 'personalizado'
    fatorRiscoAutuacao = false
  } = opcoes;

  const cenarios = [];
  const MIN = SALARIO_MINIMO_2026;
  const MAX = 30000;
  const STEP = 250;
  const dependentes = socio.dependentesIRPF || 0;

  // ── BUG 2 FIX: Montar grade incluindo o valor exato digitado pelo usuário ──
  // Garante que o proLaboreAtual aparece na grade sem arredondamento
  const valoresGrade = new Set();
  for (let pl = MIN; pl <= MAX; pl += STEP) {
    valoresGrade.add(pl === MIN ? MIN : pl);
  }
  // Inserir valor exato do usuário (se informado e dentro dos limites)
  const plAtualExato = socio.proLaboreAtual;
  if (plAtualExato && plAtualExato >= MIN && plAtualExato <= MAX) {
    valoresGrade.add(plAtualExato);
  }
  // Ordenar a grade
  const gradeOrdenada = [...valoresGrade].sort((a, b) => a - b);

  for (const proLabore of gradeOrdenada) {

    // === CUSTOS PARA A EMPRESA ===
    const inssPatronal = calcularINSSPatronal(proLabore);
    const custoEmpresaMensal = proLabore + inssPatronal;

    // === CUSTOS PARA O SÓCIO ===
    const inssRetido = socio.temOutroVinculoCLT ? 0 : calcularINSSSocio(proLabore);
    const irpf = calcularIRPFProLabore2026(proLabore, inssRetido, dependentes);

    // Líquido mensal via pró-labore
    const liquidoProLabore = proLabore - inssRetido - irpf.irFinal;

    // === DISTRIBUIÇÃO DE LUCROS (ISENTA) ===
    const pct = socio.participacao ?? socio.percentual ?? 1;
    const lucroDoSocio = _arredondar(lucroDistribuivelIsento * pct);

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
      retornoPorRealTributo: tributosAnuais > 0
        ? _arredondar(liquidoSocioAnual / tributosAnuais, 1)
        : 0,
      // ── BUG 1 FIX: Campo formatado pronto para renderização (evita NaN%) ──
      // O campo é um RATIO (R$ líquidos por R$ 1 de tributo), NÃO uma porcentagem.
      // Use este campo diretamente na UI em vez de tentar converter para %.
      eficienciaFormatada: tributosAnuais > 0
        ? _arredondar(liquidoSocioAnual / tributosAnuais, 1).toFixed(1) + 'x'
        : '∞',
      eficienciaDescricao: 'R$ líquidos por R$ 1 pago em tributos',
      retornoPorRealTributoDescricao: 'Reais liquidos gerados para o socio a cada R$ 1 pago em tributos (INSS + IRPF)'
    });
  }

  // Encontrar ótimo (menor custo tributário)
  const cenariosOrdenados = [...cenarios].sort((a, b) => a.tributosAnuais - b.tributosAnuais);
  const otimo = cenariosOrdenados[0];

  // Cenário atual para comparação
  // BUG 2 FIX: O valor exato do usuário agora está na grade, então find() vai achar exato
  const atual = cenarios.find(c => c.proLaboreMensal === (socio.proLaboreAtual || MIN))
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

  // Pró-labore mínimo anti-autuação: ao menos 5% do lucro distribuível mensal
  let minimoAntiAutuacao = null;
  if (fatorRiscoAutuacao) {
    const plMinAnti = Math.max(SALARIO_MINIMO_2026, _arredondar(lucroDistribuivelIsento * 0.05 / 12));
    minimoAntiAutuacao = cenarios.find(c => c.proLaboreMensal >= plMinAnti)
      || cenarios[cenarios.length - 1];
  }

  // Cenário previdenciário
  let cenarioPrevidenciario = null;
  if (objetivoPrevidenciario === 'teto') {
    cenarioPrevidenciario = cenarios.find(c => c.proLaboreMensal >= TETO_INSS_2026)
      || cenarios[cenarios.length - 1];
  }

  return {
    cenarios,
    cenariosChave: cenariosChaveUnicos,
    otimo,
    atual,
    economiaAnual,
    minimoAntiAutuacao,
    cenarioPrevidenciario,
    objetivoPrevidenciario,
    alerta: 'Todo socio-administrador DEVE receber pro-labore de pelo menos 1 salario minimo (R$ 1.621,00 em 2026). A ausencia gera risco de autuacao pelo INSS com cobranca retroativa de 20% patronal + 11% do socio + multa + juros.',
    alertaPrevidenciario: objetivoPrevidenciario === 'teto'
      ? `Para aposentadoria pelo teto do INSS (R$ ${TETO_INSS_2026.toLocaleString('pt-BR', {minimumFractionDigits: 2})}), o pro-labore deve ser de pelo menos R$ ${TETO_INSS_2026.toLocaleString('pt-BR', {minimumFractionDigits: 2})}/mes.`
      : null,
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


/**
 * Simula o pró-labore ótimo para TODOS os sócios simultaneamente.
 *
 * @param {Array<Object>} socios - Array de sócios (mesma estrutura de simularProLaboreOtimo)
 * @param {number} lucroDistribuivelIsento - Total de lucro distribuível isento (anual)
 * @param {Object} [opcoes={}] - Opções (mesma estrutura de simularProLaboreOtimo)
 * @returns {Array<Object>} Resultado por sócio com nome identificador
 */
function simularProLaboreOtimoMultiSocios(socios, lucroDistribuivelIsento, opcoes = {}) {
  const sociosNorm = socios.map(_normalizarSocio);
  return sociosNorm.map(socio => ({
    socio: socio.nome,
    participacao: socio.participacao,
    ...simularProLaboreOtimo(socio, lucroDistribuivelIsento, opcoes)
  }));
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
    taxaSelicMensal = 0.01,
    receitas = [],                   // FIX AUDITORIA 1: Array de { atividadeId, valor } para segregar ISS
    receitaBrutaAnual = 0            // FIX AUDITORIA 1: Receita total para fallback
  } = params;

  // FIX AUDITORIA 1: Calcular fração de receita que é serviço (ISS) vs comércio (ICMS)
  let fracaoServicos = 1; // fallback: tudo é serviço se não houver detalhamento
  const receitaAnualEfetiva = receitaBrutaAnual || (anualConsolidado ? anualConsolidado.receitaBrutaAnual : 0) || 0;
  if (receitas && receitas.length > 0 && receitaAnualEfetiva > 0) {
    let receitaServicos = 0;
    for (const rec of receitas) {
      const ativIRPJ = PERCENTUAIS_PRESUNCAO_IRPJ.find(a => a.id === rec.atividadeId);
      if (ativIRPJ && ativIRPJ.percentual >= 0.16) {
        receitaServicos += (rec.valor || 0);
      }
    }
    fracaoServicos = receitaServicos / receitaAnualEfetiva;
  } else if (anualConsolidado && anualConsolidado.tributos && anualConsolidado.tributos.iss) {
    // Usar dados do consolidado se disponível
    const recServ = anualConsolidado.tributos.iss.receitaBaseServicos || 0;
    if (receitaAnualEfetiva > 0) {
      fracaoServicos = recServ / receitaAnualEfetiva;
    }
  }

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

    // ISS — mensal, APENAS sobre receitas de serviços (FIX AUDITORIA 1)
    const receitaMensal = detalhesMensais[m] ? (detalhesMensais[m].receitaBrutaMensal || 0) : 0;
    const receitaServicosMensal = _arredondar(receitaMensal * fracaoServicos);
    const issValor = _arredondar(receitaServicosMensal * aliquotaISS);
    mesInfo.tributos.iss = {
      valor: issValor,
      vencimento: `Dia ${diaVencimentoISS}/${String(m + 1).padStart(2, '0')}`,
      referencia: mesesNomes[m],
      nota: fracaoServicos < 1 ? 'ISS calculado apenas sobre receitas de serviços (LC 116/2003).' : undefined
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
      fracaoServicos < 1
        ? 'ISS: incide apenas sobre receitas de servicos (' + _arredondar(fracaoServicos * 100, 1) + '% da receita). Vencimento dia ' + diaVencimentoISS + '.'
        : 'ISS: vencimento conforme legislacao municipal (padrao dia ' + diaVencimentoISS + ').',
      'INSS Patronal: GPS, competencia do mes anterior.',
      fracaoServicos < 1
        ? 'ICMS/IPI: NAO incluidos neste calendario. Receitas de comercio/industria (' + _arredondar((1 - fracaoServicos) * 100, 1) + '% da receita) estao sujeitas ao ICMS estadual. Consulte seu contador.'
        : null
    ].filter(Boolean),
    baseLegal: 'Lei 9.430/96, Arts. 5o e 6o (quotas); RIR/2018, Art. 856 (vencimentos); Lei 9.718/98 (PIS/COFINS).'
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 17: EXPORTAÇÕES
// ─────────────────────────────────────────────────────────────────────────────

// Exportação para uso como módulo ES ou CommonJS

// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 17: ACRÉSCIMOS À BASE DE CÁLCULO (IN RFB 1.700/2017, Art. 215, §3º)
// ═══════════════════════════════════════════════════════════════════════════════
//
// Receitas que são ADICIONADAS à base do LP SEM aplicar percentual de presunção.
// São 15 tipos listados nos §§3º e 3º-A do Art. 215.
//

/**
 * Acréscimos obrigatórios à base de cálculo do Lucro Presumido.
 * Estas receitas NÃO passam pelo percentual de presunção — entram integralmente na base.
 *
 * Base Legal: IN RFB 1.700/2017, Art. 215, §3º.
 */
const ACRESCIMOS_BASE_CALCULO = [
  {
    cod: 'ACR_01',
    descricao: 'Ganhos de capital na alienação de participações societárias permanentes (investimentos)',
    aplicaA: 'IRPJ_CSLL',
    artigo: 'Art. 215, §3º, I, a',
    formula: 'valor_alienacao - valor_contabil_ajustado'
  },
  {
    cod: 'ACR_02',
    descricao: 'Ganhos de capital em operações de hedge (proteção financeira)',
    aplicaA: 'IRPJ_CSLL',
    artigo: 'Art. 215, §3º, I, b'
  },
  {
    cod: 'ACR_03',
    descricao: 'Locação de imóvel quando NÃO for objeto social da empresa (deduzida de encargos necessários)',
    aplicaA: 'IRPJ_CSLL',
    artigo: 'Art. 215, §3º, I, c',
    nota: 'Se locação de imóvel for objeto social → aplica percentual de presunção normalmente (32%)'
  },
  {
    cod: 'ACR_04',
    descricao: 'Juros SELIC sobre impostos restituídos ou compensados',
    aplicaA: 'IRPJ_CSLL',
    artigo: 'Art. 215, §3º, I, d'
  },
  {
    cod: 'ACR_05',
    descricao: 'Rendimentos de mútuo (empréstimos entre PJ↔PJ ou PJ↔PF)',
    aplicaA: 'IRPJ_CSLL',
    artigo: 'Art. 215, §3º, I, e'
  },
  {
    cod: 'ACR_06',
    descricao: 'Variações monetárias de créditos/obrigações em função de índices ou coeficientes legais/contratuais',
    aplicaA: 'IRPJ_CSLL',
    artigo: 'Art. 215, §3º, I, f'
  },
  {
    cod: 'ACR_07',
    descricao: 'Ganhos de capital na devolução de capital em bens ou direitos',
    aplicaA: 'IRPJ_CSLL',
    artigo: 'Art. 215, §3º, I, g'
  },
  {
    cod: 'ACR_08',
    descricao: 'SOMENTE IRPJ: diferença entre valor recebido e valor entregue em devolução de patrimônio de instituição isenta',
    aplicaA: 'IRPJ',
    artigo: 'Art. 215, §3º, I, h'
  },
  {
    cod: 'ACR_09',
    descricao: 'SOMENTE CSLL: valor TOTAL recebido de instituição isenta (devolução de patrimônio)',
    aplicaA: 'CSLL',
    artigo: 'Art. 215, §3º, I, i'
  },
  {
    cod: 'ACR_10',
    descricao: 'Rendimentos e ganhos líquidos em aplicações de renda fixa e renda variável',
    aplicaA: 'IRPJ_CSLL',
    artigo: 'Art. 215, §3º, II',
    nota: 'IR-fonte sobre estas receitas é ANTECIPAÇÃO (compensável no trimestre)'
  },
  {
    cod: 'ACR_11',
    descricao: 'Juros sobre capital próprio (JCP) auferidos de outras empresas',
    aplicaA: 'IRPJ_CSLL',
    artigo: 'Art. 215, §3º, III'
  },
  {
    cod: 'ACR_12',
    descricao: 'Valores recuperados de custos e despesas (exceto se não foram deduzidos em período anterior de Lucro Real)',
    aplicaA: 'IRPJ_CSLL',
    artigo: 'Art. 215, §3º, IV'
  },
  {
    cod: 'ACR_13',
    descricao: 'Excesso de preço de transferência em exportações a empresas vinculadas (ANUAL, acrescido no último trimestre)',
    aplicaA: 'IRPJ_CSLL',
    artigo: 'Art. 215, §3º, V',
    periodicidade: 'ANUAL_ULTIMO_TRIMESTRE'
  },
  {
    cod: 'ACR_14',
    descricao: 'Diferença de receita financeira por preço de transferência (ANUAL, acrescido no último trimestre)',
    aplicaA: 'IRPJ_CSLL',
    artigo: 'Art. 215, §3º, VI',
    periodicidade: 'ANUAL_ULTIMO_TRIMESTRE'
  },
  {
    cod: 'ACR_15',
    descricao: 'Multas e vantagens por rescisão de contrato (inclusive indenizações recebidas)',
    aplicaA: 'IRPJ_CSLL',
    artigo: 'Art. 215, §3º, VII'
  }
];


// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 18: EXCLUSÕES DA BASE DE CÁLCULO (IN RFB 1.700/2017, Art. 215/217)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Receitas que NÃO integram a base de cálculo do Lucro Presumido.
 * Base Legal: IN RFB 1.700/2017, Arts. 215 e 217.
 */
const EXCLUSOES_BASE_CALCULO = [
  {
    cod: 'EXC_01',
    descricao: 'AVP (Ajuste a Valor Presente) apropriado como receita financeira',
    artigo: 'Art. 215, §5º'
  },
  {
    cod: 'EXC_02',
    descricao: 'AVP de receitas do §3º (acréscimos) apropriado como receita financeira',
    artigo: 'Art. 215, §7º'
  },
  {
    cod: 'EXC_03',
    descricao: 'Receita de construção de infraestrutura em concessão de serviço público (quando contrapartida = ativo intangível)',
    artigo: 'Art. 215, §8º, I'
  },
  {
    cod: 'EXC_04',
    descricao: 'Ganho de Ajuste a Valor Justo (AVJ) registrado em conta de receita',
    artigo: 'Art. 217, I'
  },
  {
    cod: 'EXC_05',
    descricao: 'Ganho de AVJ reclassificado do Patrimônio Líquido para conta de receita',
    artigo: 'Art. 217, II'
  },
  {
    cod: 'EXC_06',
    descricao: 'Variações monetárias cambiais de saldos de juros a apropriar (AVP)',
    artigo: 'Art. 215, §29'
  },
  {
    cod: 'EXC_07',
    descricao: 'Variações monetárias de arrendamento mercantil (arrendatária) sobre contraprestações/juros a apropriar — exceto vencidas',
    artigo: 'Art. 215, §§30-32',
    redacaoDadaPor: 'IN RFB 1881/2019'
  }
];


// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 19: PERCENTUAL REDUZIDO 16% — MICRO PRESTADORAS (Art. 215, §§10-13)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Regra do percentual reduzido de 16% para micro prestadoras de serviços.
 *
 * PJ que presta EXCLUSIVAMENTE serviços das alíneas b, c, d, f, g, j do Art. 33
 * e tem receita bruta anual ≤ R$ 120.000,00 pode usar 16% em vez de 32%.
 *
 * Base Legal: IN RFB 1.700/2017, Art. 215, §§10-13 (redação IN RFB 1881/2019).
 */
const PERCENTUAL_REDUZIDO_16PCT = {
  percentualNormal: 0.32,
  percentualReduzido: 0.16,
  limiteReceitaBrutaAnual: 120_000.00,
  baseLegal: 'IN RFB 1.700/2017, Art. 215, §§10-13 (redação IN RFB 1881/2019)',

  alineasElegiveis: [
    { alinea: 'b', descricao: 'Intermediação de negócios', artigo: 'Art. 33, §1º, IV, b' },
    { alinea: 'c', descricao: 'Administração, locação ou cessão de bens imóveis, móveis e direitos', artigo: 'Art. 33, §1º, IV, c' },
    { alinea: 'd', descricao: 'Construção por administração ou empreitada de mão de obra', artigo: 'Art. 33, §1º, IV, d' },
    { alinea: 'f', descricao: 'Factoring (assessoria creditícia, compra de direitos creditórios)', artigo: 'Art. 33, §1º, IV, f' },
    { alinea: 'g', descricao: 'Coleta e transporte de resíduos até aterros sanitários', artigo: 'Art. 33, §1º, IV, g' },
    { alinea: 'j', descricao: 'Qualquer outra espécie de serviço não mencionada (residual)', artigo: 'Art. 33, §1º, IV, j' }
  ],

  alineasNaoElegiveis: [
    { alinea: 'a', descricao: 'Serviços de profissão legalmente regulamentada (médicos, advogados, engenheiros, contadores, etc.)' },
    { alinea: 'e', descricao: 'Construção de infraestrutura em concessão de serviços públicos' },
    { alinea: 'h', descricao: 'Exploração de rodovias por concessionárias' },
    { alinea: 'i', descricao: 'Suprimento de água e coleta/tratamento de esgotos' }
  ],

  condicoesCumulativas: [
    'Prestar EXCLUSIVAMENTE serviços das alíneas elegíveis (b, c, d, f, g, j)',
    'Receita bruta ANUAL ≤ R$ 120.000,00'
  ],

  regraEstouro: {
    gatilho: 'Receita bruta acumulada no ano excede R$ 120.000',
    efeito: 'Pagar a diferença de imposto postergado, trimestre a trimestre',
    prazo: 'Quota única até o último dia útil do mês subsequente ao trimestre em que ocorreu o excesso',
    acrescimos: 'Sem acréscimos moratórios se pago dentro do prazo',
    artigo: 'Art. 215, §§11-13'
  },

  nota: 'ATENÇÃO: O percentual reduzido de 16% se aplica APENAS ao IRPJ. A CSLL permanece 32% para serviços.'
};

/**
 * Verifica se empresa é elegível ao percentual reduzido de 16%.
 * @param {Object} params
 * @param {string} params.atividadeId - ID da atividade
 * @param {number} params.receitaBrutaAnual - Receita bruta anual
 * @param {boolean} params.exclusivamenteServicosElegiveis - Se presta EXCLUSIVAMENTE serviços elegíveis
 * @returns {Object} { elegivel, percentual, motivo }
 */
function verificarPercentualReduzido16(params) {
  const { atividadeId, receitaBrutaAnual, exclusivamenteServicosElegiveis } = params;

  const idsElegiveis = ['intermediacao', 'locacao_cessao', 'imobiliaria_locacao', 'construcao_sem_material',
                        'factoring', 'coleta_residuos', 'servicos_gerais', 'servicos_limpeza_locacao_mao_obra'];

  if (!exclusivamenteServicosElegiveis) {
    return { elegivel: false, percentual: 0.32, motivo: 'Empresa não presta exclusivamente serviços das alíneas b,c,d,f,g,j.' };
  }
  if (receitaBrutaAnual > PERCENTUAL_REDUZIDO_16PCT.limiteReceitaBrutaAnual) {
    return { elegivel: false, percentual: 0.32, motivo: `Receita bruta anual (R$ ${_formatarMoeda(receitaBrutaAnual)}) excede o limite de R$ 120.000,00.` };
  }

  return { elegivel: true, percentual: 0.16, motivo: 'Elegível ao percentual reduzido de 16% (IN RFB 1.700/2017, Art. 215, §10).' };
}


// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 20: LUCRO ARBITRADO (IN RFB 1.700/2017, Arts. 226-237)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Motor completo do Lucro Arbitrado.
 * Percentuais de presunção com acréscimo de 20% sobre os do LP.
 *
 * Base Legal: IN RFB 1.700/2017, Arts. 226-237.
 */
const LUCRO_ARBITRADO = {
  descricao: 'O lucro arbitrado é utilizado quando a escrituração é imprestável ou a empresa não cumpre obrigações que permitam apuração pelo Lucro Real ou Presumido.',
  baseLegal: 'IN RFB 1.700/2017, Arts. 226-237',

  percentuaisArbitradoIRPJ: [
    { atividade: 'Revenda de combustíveis', lpPercent: 0.016, arbitradoPercent: 0.0192, artigo: 'Art. 227, §4º, I' },
    { atividade: 'Hospitalar (soc. empresária + Anvisa)', lpPercent: 0.08, arbitradoPercent: 0.096, artigo: 'Art. 227, §4º, II, a' },
    { atividade: 'Transporte de carga', lpPercent: 0.08, arbitradoPercent: 0.096, artigo: 'Art. 227, §4º, II, b' },
    { atividade: 'Atividades imobiliárias', lpPercent: 0.08, arbitradoPercent: 0.096, artigo: 'Art. 227, §4º, II, c' },
    { atividade: 'Empreitada com todos os materiais', lpPercent: 0.08, arbitradoPercent: 0.096, artigo: 'Art. 227, §4º, II, d' },
    { atividade: 'Demais atividades (regra geral)', lpPercent: 0.08, arbitradoPercent: 0.096, artigo: 'Art. 227, §4º, II, e' },
    { atividade: 'Transporte de passageiros', lpPercent: 0.16, arbitradoPercent: 0.192, artigo: 'Art. 227, §4º, III' },
    { atividade: 'Serviços em geral (32%)', lpPercent: 0.32, arbitradoPercent: 0.384, artigo: 'Art. 227, §4º, IV' },
    { atividade: 'Instituições financeiras', lpPercent: 0.16, arbitradoPercent: 0.45, artigo: 'Art. 227, §26', nota: 'Percentual diferenciado (não segue regra dos 20%)' },
    { atividade: 'Limpeza/locação de mão de obra', lpPercent: 0.32, arbitradoPercent: 0.384, artigo: 'Art. 227, §4º-A' }
  ],

  csllArbitrado: 'Mesmos percentuais do resultado presumido (Art. 34) — NÃO recebe acréscimo de 20%',

  hipotesesArbitramento: [
    { id: 'HIP_01', descricao: 'Obrigada ao Lucro Real porém sem escrituração exigida', artigo: 'Art. 226, I' },
    { id: 'HIP_02', descricao: 'Escrituração com fraude, vícios ou erros que a tornem imprestável', artigo: 'Art. 226, II' },
    { id: 'HIP_03', descricao: 'Não apresentação de livros e documentos ao Fisco', artigo: 'Art. 226, III' },
    { id: 'HIP_04', descricao: 'Opção indevida pelo Lucro Presumido (quando obrigada ao LR)', artigo: 'Art. 226, IV' },
    { id: 'HIP_05', descricao: 'Comissário ou representante de PJ estrangeira com descumprimento de obrigações', artigo: 'Art. 226, V' },
    { id: 'HIP_06', descricao: 'Livro Razão não mantido em boa ordem ou sem hashcode SPED', artigo: 'Art. 226, VI' },
    { id: 'HIP_07', descricao: 'Não escriturar ou apresentar FCONT (período aplicável)', artigo: 'Art. 226, VII' },
    { id: 'HIP_08', descricao: 'Não escriturar ou apresentar ECF', artigo: 'Art. 226, VIII' }
  ],

  // Quando a receita bruta é desconhecida, usar uma das alternativas:
  receitaDesconhecidaAlternativas: [
    { id: 'ALT_01', formula: '1.5 × lucro_real_ultimo_periodo_conhecido', artigo: 'Art. 232, I' },
    { id: 'ALT_02', formula: '0.12 × (ativo_circulante + ativo_não_circulante)', artigo: 'Art. 232, II' },
    { id: 'ALT_03', formula: '0.21 × capital_social_corrigido', artigo: 'Art. 232, III' },
    { id: 'ALT_04', formula: '0.15 × patrimônio_líquido', artigo: 'Art. 232, IV' },
    { id: 'ALT_05', formula: '0.40 × compras_de_mercadorias', artigo: 'Art. 232, V' },
    { id: 'ALT_06', formula: '0.40 × (folha_pagamento + compras_matéria_prima)', artigo: 'Art. 232, VI' },
    { id: 'ALT_07', formula: '0.80 × valores_empregados_em_atividade', artigo: 'Art. 232, VII' },
    { id: 'ALT_08', formula: '0.90 × aluguel_devido_no_período', artigo: 'Art. 232, VIII' }
  ],

  convivenciaComLP: {
    regra: 'Trimestres com lucro arbitrado podem CONVIVER com LP nos demais trimestres do ano',
    condicao: 'Desde que a empresa não esteja obrigada ao Lucro Real',
    artigo: 'Art. 236'
  }
};

/**
 * Calcula lucro arbitrado para um trimestre.
 * @param {Object} params
 * @param {number} params.receitaBrutaTrimestral - Receita bruta do trimestre (se conhecida)
 * @param {string} params.atividadeId - ID da atividade
 * @param {boolean} [params.receitaConhecida=true] - Se a receita bruta é conhecida
 * @param {Object} [params.dadosAlternativos] - Dados para cálculo alternativo (se receita desconhecida)
 * @returns {Object} Resultado do arbitramento
 */
function calcularLucroArbitrado(params) {
  const { receitaBrutaTrimestral = 0, atividadeId = 'servicos_gerais', receitaConhecida = true, dadosAlternativos = {} } = params;

  // Buscar percentual arbitrado
  const atividadeIRPJ = PERCENTUAIS_PRESUNCAO_IRPJ.find(a => a.id === atividadeId);
  const atividadeCSLL = PERCENTUAIS_PRESUNCAO_CSLL.find(a => a.id === atividadeId);

  if (!atividadeIRPJ) throw new Error(`Atividade não encontrada: "${atividadeId}"`);

  const percentualLP = atividadeIRPJ.percentual;
  const percentualArbitrado = _arredondar(percentualLP * 1.20, 4); // Acréscimo de 20%
  const percentualCSLL = atividadeCSLL ? atividadeCSLL.percentual : 0.12;

  if (receitaConhecida) {
    const baseIRPJ = _arredondar(receitaBrutaTrimestral * percentualArbitrado);
    const baseCSLL = _arredondar(receitaBrutaTrimestral * percentualCSLL); // CSLL NÃO tem acréscimo

    const irpjNormal = _arredondar(baseIRPJ * ALIQUOTA_IRPJ);
    const irpjAdicional = _arredondar(Math.max(0, baseIRPJ - LIMITE_ADICIONAL_TRIMESTRAL) * ALIQUOTA_ADICIONAL_IRPJ);
    const csll = _arredondar(baseCSLL * ALIQUOTA_CSLL);

    return {
      tipo: 'RECEITA_CONHECIDA',
      receitaBruta: receitaBrutaTrimestral,
      percentualLP: percentualLP,
      percentualArbitrado: percentualArbitrado,
      percentualCSLL: percentualCSLL,
      baseIRPJ: baseIRPJ,
      baseCSLL: baseCSLL,
      irpjNormal: irpjNormal,
      irpjAdicional: irpjAdicional,
      irpjTotal: _arredondar(irpjNormal + irpjAdicional),
      csll: csll,
      totalTributos: _arredondar(irpjNormal + irpjAdicional + csll),
      baseLegal: 'IN RFB 1.700/2017, Art. 227'
    };
  } else {
    // Receita desconhecida: usar alternativas do Art. 232
    const resultados = [];
    const alternativas = LUCRO_ARBITRADO.receitaDesconhecidaAlternativas;

    if (dadosAlternativos.lucroRealUltimo > 0) {
      resultados.push({ metodo: alternativas[0].formula, base: _arredondar(dadosAlternativos.lucroRealUltimo * 1.5), artigo: alternativas[0].artigo });
    }
    if (dadosAlternativos.ativoTotal > 0) {
      resultados.push({ metodo: alternativas[1].formula, base: _arredondar(dadosAlternativos.ativoTotal * 0.12), artigo: alternativas[1].artigo });
    }
    if (dadosAlternativos.capitalSocial > 0) {
      resultados.push({ metodo: alternativas[2].formula, base: _arredondar(dadosAlternativos.capitalSocial * 0.21), artigo: alternativas[2].artigo });
    }
    if (dadosAlternativos.patrimonioLiquido > 0) {
      resultados.push({ metodo: alternativas[3].formula, base: _arredondar(dadosAlternativos.patrimonioLiquido * 0.15), artigo: alternativas[3].artigo });
    }

    return {
      tipo: 'RECEITA_DESCONHECIDA',
      alternativas: resultados,
      nota: 'Quando a receita bruta é desconhecida, o lucro arbitrado é determinado pelas alternativas do Art. 232',
      baseLegal: 'IN RFB 1.700/2017, Art. 232'
    };
  }
}


// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 21: GANHO DE CAPITAL — REGRAS DETALHADAS (Art. 215, §§14-23)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Regras de apuração de ganho de capital no Lucro Presumido.
 * O ganho integra a base de cálculo SEM passar pelo percentual de presunção.
 *
 * Base Legal: IN RFB 1.700/2017, Art. 215, §§14-23.
 */
const REGRAS_GANHO_CAPITAL_LP = {
  baseLegal: 'IN RFB 1.700/2017, Art. 215, §§14-23',
  formulaGeral: 'ganho = valor_alienacao - valor_contabil_ajustado',

  ajustesValorContabil: [
    {
      descricao: 'AVP proporcional pode ser considerado no valor contábil',
      artigo: '§§15-17',
      nota: 'AVP que foi excluído da base tributária pode ser adicionado ao custo para fins de ganho de capital'
    },
    {
      descricao: 'Vedado cômputo de encargos de empréstimos capitalizados no custo',
      artigo: '§18'
    },
    {
      descricao: 'Considerar diferença de critérios contábeis pré e pós 2007/2008 (Lei 11.638)',
      artigo: '§19'
    },
    {
      descricao: 'Reavaliação só pode integrar o custo se tributada anteriormente',
      artigo: '§20',
      nota: 'Se a reavaliação foi apenas diferida (não tributada), não pode ser computada no custo (Art. 52, Lei 9.430/96)'
    }
  ],

  intangivelConcessao: {
    formula: 'ganho = valor_alienacao - (custos_incorridos - amortizacao_proporcional)',
    artigo: 'Art. 215, §§21-23',
    nota: 'Aplicável a direitos de exploração (intangível) em concessões de serviço público'
  },

  aliquotasGanhoCapital: {
    descricao: 'Ganho de capital integra a base e é tributado pelas alíquotas normais de IRPJ (15% + adicional 10%) e CSLL (9%)',
    nota: 'NÃO se aplica a tabela progressiva de ganho de capital de PF (15% a 22,5%)'
  }
};


// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 22: VARIAÇÃO CAMBIAL (Art. 215, §§27-28)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Regras de variação cambial no Lucro Presumido.
 * Base Legal: IN RFB 1.700/2017, Art. 215, §§27-28.
 */
const VARIACAO_CAMBIAL_LP = {
  regimePadrao: {
    descricao: 'Reconhecer variações monetárias na LIQUIDAÇÃO da operação (regime de caixa cambial)',
    artigo: 'Art. 215, §27',
    nota: 'É o regime padrão — não precisa fazer opção para utilizá-lo'
  },
  regimeOpcional: {
    descricao: 'Opção por regime de COMPETÊNCIA — reconhecer variações mensalmente',
    artigo: 'Art. 215, §28',
    nota: 'Opção aplicável a todo o ano-calendário, irretratável. Manifestada na ECF.'
  },
  impacto: 'O regime de caixa (liquidação) é geralmente mais favorável pois DIFERE a tributação de variações cambiais positivas até o momento da liquidação efetiva do contrato.',
  baseLegal: 'IN RFB 1.700/2017, Art. 215, §§27-28'
};


// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 23: RENDA VARIÁVEL — ANTECIPAÇÃO MENSAL (Art. 216)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Regras de rendimentos de renda fixa e ganhos de renda variável.
 * Base Legal: IN RFB 1.700/2017, Art. 216.
 */
const RENDA_VARIAVEL_LP = {
  baseLegal: 'IN RFB 1.700/2017, Art. 216',
  regra: 'Rendimentos de renda fixa e ganhos líquidos de renda variável são reconhecidos na alienação, resgate ou cessão do título/operação.',
  antecipacaoMensal: {
    descricao: 'Nos 2 primeiros meses do trimestre, o IRPJ sobre ganhos líquidos de renda variável é pago EM SEPARADO (como antecipação mensal).',
    mesDispensado: 'No 3º mês do trimestre: dispensado pagamento em separado.',
    consolidacao: 'O total trimestral é compensável com o IRPJ trimestral apurado.'
  }
};


// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 24: ARRENDAMENTO MERCANTIL — ARRENDADORA (Art. 218)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Regras para arrendadoras com transferência de riscos (não sujeitas à Lei 6.099/74).
 * Base Legal: IN RFB 1.700/2017, Art. 218 (redação IN RFB 1881/2019).
 */
const ARRENDAMENTO_ARRENDADORA_LP = {
  baseLegal: 'IN RFB 1.700/2017, Art. 218 (redação IN RFB 1881/2019)',
  regra: 'Computar a contraprestação integral na base de cálculo do LP.',
  naoDuplicar: [
    'Receitas financeiras do arrendamento já incluídas na contraprestação (§1º)',
    'Variações monetárias de contraprestações a receber e juros a apropriar (§2º)'
  ],
  excecao: 'Atualizações sobre contraprestações VENCIDAS entram integralmente na base (§3º)'
};


// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 25: CONCESSÃO DE SERVIÇOS PÚBLICOS (Art. 215, §8º)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Regras específicas para concessionárias de serviço público.
 * Base Legal: IN RFB 1.700/2017, Art. 215, §8º.
 */
const CONCESSAO_SERVICOS_PUBLICOS_LP = {
  baseLegal: 'IN RFB 1.700/2017, Art. 215, §8º',
  regraExclusao: 'Excluir da base a receita de construção de infraestrutura quando a contrapartida contábil for um ativo INTANGÍVEL (direito de exploração).',
  regraInclusao: 'Incluir na base o AVP dos ativos financeiros a receber pela construção.',
  nota: 'Se a contrapartida for ativo financeiro (recebível da concedente), a receita NÃO é excluída e entra normalmente na base com percentual de presunção.'
};


// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 26: DEDUÇÕES DA RECEITA BRUTA — INSTITUIÇÕES FINANCEIRAS (Art. 36)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Deduções específicas da receita bruta ANTES de aplicar o percentual de presunção
 * para instituições financeiras, seguradoras e operadoras de saúde.
 *
 * Base Legal: IN RFB 1.700/2017, Art. 36.
 */
const DEDUCOES_RECEITA_INSTITUICOES_FINANCEIRAS = {
  baseLegal: 'IN RFB 1.700/2017, Art. 36',
  categorias: {
    financeiras_corretoras_distribuidoras: {
      deducoes: [
        'Captação de terceiros (despesas com captação)',
        'Refinanciamentos, empréstimos e repasses oficiais',
        'Cessão de créditos',
        'Operações de câmbio',
        'Perdas em operações de renda fixa',
        'Perdas em operações de renda variável'
      ]
    },
    seguros: {
      deducoes: [
        'Cosseguros e resseguros cedidos',
        'Cancelamentos e restituições de prêmios',
        'Provisões e reservas técnicas constituídas'
      ]
    },
    previdencia_capitalizacao: {
      deducoes: ['Provisões e reservas técnicas']
    },
    operadoras_saude: {
      deducoes: ['Corresponsabilidades cedidas', 'Provisões técnicas']
    }
  }
};


// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 27: DISTRIBUIÇÃO DE LUCROS ISENTOS — DETALHAMENTO (Art. 238)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Regras detalhadas de distribuição de lucros isentos no Lucro Presumido.
 * Base Legal: IN RFB 1.700/2017, Art. 238, §§1º a 9º.
 */
const DISTRIBUICAO_LUCROS_DETALHADA = [
  {
    id: 'DIV_001',
    regra: 'Lucros e dividendos distribuídos são ISENTOS de IRRF — inclusive para beneficiários no exterior',
    artigo: 'Art. 238, caput e §1º'
  },
  {
    id: 'DIV_002',
    regra: 'Limite isento SEM escrituração contábil: base_presunção - IRPJ - CSLL - PIS - COFINS',
    formula: 'lucro_distribuivel_isento = base_lp - irpj - csll - pis - cofins',
    artigo: 'Art. 238, §2º, I'
  },
  {
    id: 'DIV_003',
    regra: 'Acima do limite presumido: isento apenas se escrituração contábil (ECD) demonstrar lucro efetivo maior',
    artigo: 'Art. 238, §2º, II'
  },
  {
    id: 'DIV_004',
    regra: 'Excesso ao lucro escriturado: imputado a lucros acumulados ou reservas anteriores, sujeito a IRRF',
    artigo: 'Art. 238, §3º'
  },
  {
    id: 'DIV_005',
    regra: 'Sem lucros acumulados suficientes: tributar excesso como rendimento (tabela progressiva ou 15% PF)',
    artigo: 'Art. 238, §4º',
    baseLegalComplementar: 'Art. 61, Lei 8.981/95'
  },
  {
    id: 'DIV_006',
    regra: 'Distribuição do §2º, I (dentro do limite presumido) APÓS encerramento do trimestre: NÃO se aplica a restrição do §3º',
    artigo: 'Art. 238, §7º'
  },
  {
    id: 'DIV_007',
    regra: 'Distribuição por conta de período NÃO encerrado (sem balanço): tributável — exceto se dentro do limite do §2º, I',
    artigo: 'Art. 238, §8º'
  },
  {
    id: 'DIV_008',
    regra: 'Isenção se aplica a TODAS as espécies de ações (Art. 15, Lei 6.404/76), inclusive as classificadas no passivo',
    artigo: 'Art. 238, §9º'
  },
  {
    id: 'DIV_009',
    regra: 'Pró-labore, aluguéis e remuneração por serviços NÃO são distribuição de lucros isentos — tributáveis normalmente',
    artigo: 'Art. 238, §5º'
  },
  {
    id: 'DIV_010',
    regra: 'Isenção somente para lucros apurados a partir de janeiro/1996',
    artigo: 'Art. 238, §6º'
  }
];


// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 28: OTIMIZAÇÕES FISCAIS CATALOGADAS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Catálogo de oportunidades de otimização fiscal no Lucro Presumido.
 * Cada otimização inclui economia estimada, como implementar, risco e base legal.
 */
const OTIMIZACOES_FISCAIS_LP = [
  {
    id: 'OPT_001',
    titulo: 'Enquadramento hospitalar (8% IRPJ em vez de 32%)',
    economia: 'Redução de 75% na base IRPJ',
    como: 'Sociedade empresária registrada na Junta Comercial + alvará Anvisa + ambiente próprio conforme RDC 50/2002',
    artigo: 'Art. 33, §1º, II, a',
    risco: 'BAIXO',
    simulavel: true
  },
  {
    id: 'OPT_002',
    titulo: 'Empreitada com TODOS os materiais (8%/12% em vez de 32%/32%)',
    economia: 'Redução de 75% IRPJ e 62.5% CSLL',
    como: 'Contrato prevendo expressamente o fornecimento de TODOS os materiais indispensáveis incorporados à obra',
    artigo: 'Art. 33, §1º, II, d',
    risco: 'MEDIO',
    simulavel: true
  },
  {
    id: 'OPT_003',
    titulo: 'Percentual reduzido 16% para micro prestadoras (até R$ 120k)',
    economia: 'Redução de 50% na base IRPJ',
    como: 'Receita bruta anual até R$ 120.000 + exclusivamente serviços das alíneas b,c,d,f,g,j',
    artigo: 'Art. 215, §10',
    risco: 'BAIXO',
    simulavel: true
  },
  {
    id: 'OPT_004',
    titulo: 'Regime de caixa: diferimento de receitas não recebidas',
    economia: 'Posterga tributo até recebimento efetivo (ganho financeiro = SELIC sobre imposto diferido)',
    como: 'Optar pelo regime de caixa + manter Livro Caixa ou escrituração contábil',
    artigo: 'Art. 223',
    risco: 'BAIXO',
    simulavel: true
  },
  {
    id: 'OPT_005',
    titulo: 'Maximizar distribuição isenta com escrituração contábil (ECD)',
    economia: 'Distribuir acima do presumido sem IRRF quando lucro contábil efetivo > base presumida',
    como: 'Manter escrituração contábil completa (ECD) demonstrando lucro real efetivo maior',
    artigo: 'Art. 238, §2º, II',
    risco: 'BAIXO',
    simulavel: true
  },
  {
    id: 'OPT_006',
    titulo: 'Exclusão de AVJ (Ajuste a Valor Justo) da base do LP',
    economia: 'Ganhos de AVJ não são tributados no período de registro',
    como: 'Registrar ganhos conforme Art. 217 e excluir da base',
    artigo: 'Art. 217',
    risco: 'BAIXO',
    simulavel: false
  },
  {
    id: 'OPT_007',
    titulo: 'Segregação de atividades para otimizar percentuais',
    economia: 'Aplicar 8% sobre comércio/indústria e 32% somente sobre serviços — CADA atividade com seu percentual',
    como: 'Art. 215, §2º — percentual correspondente a cada atividade separadamente',
    artigo: 'Art. 215, §2º',
    risco: 'BAIXO',
    simulavel: true
  },
  {
    id: 'OPT_008',
    titulo: 'Bônus de adimplência fiscal na CSLL',
    economia: 'Dedução direta de 1% da base de cálculo da CSLL',
    como: 'Manter-se sem infrações tributárias nos últimos 5 anos (Lei 10.637/2002, Art. 38)',
    artigo: 'Art. 222, parágrafo único, II',
    risco: 'BAIXO',
    simulavel: true
  },
  {
    id: 'OPT_009',
    titulo: 'Comparativo LP vs Lucro Real antes da opção anual',
    economia: 'Economia de 30-70% dependendo da margem efetiva da empresa',
    como: 'Se lucro_efetivo / receita < percentual_presuncao → Lucro Real pode ser mais vantajoso',
    artigo: 'Art. 214, §2º',
    risco: 'BAIXO',
    simulavel: true
  },
  {
    id: 'OPT_010',
    titulo: 'Variação cambial: regime de liquidação para diferir tributação',
    economia: 'Diferir variações cambiais positivas não realizadas até a liquidação efetiva do contrato',
    como: 'Manter o regime padrão (liquidação) — não optar por competência',
    artigo: 'Art. 215, §§27-28',
    risco: 'BAIXO',
    simulavel: false
  }
];


// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 29: REGRAS CONDICIONAIS COMPLETAS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Conjunto completo de regras condicionais que afetam o cálculo do LP.
 * Codificado para uso por motor de regras / validação automática.
 *
 * Base Legal: IN RFB 1.700/2017 (multivigente com alterações até IN RFB 1881/2019).
 */
const REGRAS_CONDICIONAIS_LP = [
  {
    id: 'COND_001',
    se: 'receita_bruta_anual_anterior > 78.000.000 (ou 6.500.000 × meses se < 12)',
    entao: 'VEDA opção pelo Lucro Presumido',
    tipo: 'VEDACAO', prioridade: 1,
    artigo: 'Art. 214'
  },
  {
    id: 'COND_002',
    se: 'atividade = hospitalar E sociedade_empresaria = true E alvara_anvisa = true E ambiente_proprio = true',
    entao: 'IRPJ = 8%; CSLL = 12%',
    senao: 'IRPJ = 32%; CSLL = 32%',
    tipo: 'ALTERACAO_PERCENTUAL', prioridade: 2,
    artigo: 'Art. 33, §1º, II, a / §§3º-4º'
  },
  {
    id: 'COND_003',
    se: 'sociedade_simples = true E atividade = hospitalar',
    entao: 'VEDA percentual 8% → usar 32%',
    tipo: 'VEDACAO', prioridade: 2,
    artigo: 'Art. 33, §4º, I'
  },
  {
    id: 'COND_004',
    se: 'ambiente_terceiro = true E atividade = hospitalar',
    entao: 'VEDA percentual 8% → usar 32%',
    tipo: 'VEDACAO', prioridade: 2,
    artigo: 'Art. 33, §4º, II'
  },
  {
    id: 'COND_005',
    se: 'atividade = medico_ambulatorial_home_care',
    entao: 'VEDA percentual 8% → usar 32%',
    tipo: 'VEDACAO', prioridade: 2,
    artigo: 'Art. 33, §4º, III'
  },
  {
    id: 'COND_006',
    se: 'empreitada_todos_materiais = true',
    entao: 'IRPJ 8% / CSLL 12%',
    senao: 'IRPJ 32% / CSLL 32%',
    tipo: 'ALTERACAO_PERCENTUAL', prioridade: 2,
    artigo: 'Art. 33, §1º, II d vs IV d'
  },
  {
    id: 'COND_007',
    se: 'exclusivamente_servicos_alineas_bcdfgj = true E receita_anual <= 120.000',
    entao: 'percentual_irpj = 16%',
    senao: 'percentual_irpj = 32%',
    tipo: 'REDUCAO', prioridade: 3,
    artigo: 'Art. 215, §10'
  },
  {
    id: 'COND_008',
    se: 'usou_16% = true E receita_acumulada > 120.000',
    entao: 'Diferença do imposto postergado por trimestre — pagar quota única até último dia útil do mês subsequente. Sem acréscimos no prazo.',
    tipo: 'MAJORACAO', prioridade: 3,
    artigo: 'Art. 215, §§11-13'
  },
  {
    id: 'COND_009',
    se: 'locacao_imovel_nao_objeto_social = true',
    entao: 'Receita de locação ACRESCE à base SEM percentual de presunção',
    senao: 'Aplica percentual normalmente',
    tipo: 'ALTERACAO_BASE', prioridade: 3,
    artigo: 'Art. 215, §3º, I, c'
  },
  {
    id: 'COND_010',
    se: 'regime_anterior = LUCRO_REAL E regime_atual = LP',
    entao: 'Adicionar TODOS os saldos de tributação diferida do LALUR à base do 1º trimestre de LP',
    tipo: 'OBRIGACAO', prioridade: 1,
    artigo: 'Art. 219'
  },
  {
    id: 'COND_011',
    se: 'regime_atual = LP E rendimentos_exterior = true',
    entao: 'MIGRAR OBRIGATORIAMENTE para Lucro Real Trimestral a partir do trimestre da ocorrência',
    tipo: 'VEDACAO', prioridade: 1,
    artigo: 'Art. 214, §3º-A',
    redacaoDadaPor: 'IN RFB 1881/2019'
  },
  {
    id: 'COND_012',
    se: 'concessao_servico_publico = true E contrapartida = ativo_intangivel',
    entao: 'Excluir receita de construção da base de cálculo',
    tipo: 'REDUCAO', prioridade: 3,
    artigo: 'Art. 215, §8º, I'
  },
  {
    id: 'COND_013',
    se: 'variacao_cambial = true',
    entao: 'Regime padrão: reconhecer na liquidação. Opção anual: reconhecer por competência',
    tipo: 'ALTERACAO_BASE', prioridade: 3,
    artigo: 'Art. 215, §§27-28'
  },
  {
    id: 'COND_014',
    se: 'mudanca_caixa_para_competencia = true',
    entao: 'Reconhecer em dezembro do ano anterior TODAS as receitas auferidas e não recebidas',
    tipo: 'OBRIGACAO', prioridade: 1,
    artigo: 'Art. 223-A',
    redacaoDadaPor: 'IN RFB 1881/2019'
  },
  {
    id: 'COND_015',
    se: 'regime_csll = CAIXA',
    entao: 'regime_irpj DEVE ser obrigatoriamente CAIXA também',
    tipo: 'VEDACAO', prioridade: 1,
    artigo: 'Art. 224'
  },
  {
    id: 'COND_016',
    se: 'distribuicao_lucros > (base_lp - IRPJ - CSLL - PIS - COFINS)',
    entao: 'Excesso isento SOMENTE se escrituração contábil demonstrar lucro efetivo maior. Caso contrário: tributar como rendimento.',
    tipo: 'OBRIGACAO', prioridade: 2,
    artigo: 'Art. 238, §§2º-4º'
  }
];


// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 30: REGIME DE CAIXA — REGRAS DETALHADAS (Arts. 223-224)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Regras detalhadas do regime de caixa no Lucro Presumido.
 * Base Legal: IN RFB 1.700/2017, Arts. 215 §9º, 223, 223-A e 224.
 */
const REGIME_CAIXA_DETALHADO = [
  {
    id: 'CAIXA_001',
    regra: 'LP pode ser apurado por COMPETÊNCIA ou por CAIXA',
    requisitos: [
      'Livro Caixa com registro individual de receitas por nota fiscal/recebimento',
      'OU escrituração contábil (ECD) com conta específica de recebimentos'
    ],
    artigo: 'Art. 215, §9º / Art. 223'
  },
  {
    id: 'CAIXA_002',
    regra: 'Recebimentos antecipados: receita reconhecida no mês do FATURAMENTO, ENTREGA ou CONCLUSÃO — o que ocorrer primeiro',
    artigo: 'Art. 223, §2º'
  },
  {
    id: 'CAIXA_003',
    regra: 'Qualquer valor recebido do comprador (inclusive a título de adiantamento, sinal, etc.) = recebimento do preço, até o limite total do contrato',
    artigo: 'Art. 223, §3º'
  },
  {
    id: 'CAIXA_004',
    regra: 'Se receita for reconhecida em período POSTERIOR ao devido: incidência de juros SELIC + multa de mora ou de ofício',
    artigo: 'Art. 223, §4º'
  },
  {
    id: 'CAIXA_005',
    regra: 'Mudança de caixa → competência: reconhecer em DEZEMBRO do ano anterior TODAS as receitas auferidas e não recebidas',
    artigo: 'Art. 223-A',
    redacaoDadaPor: 'IN RFB 1881/2019'
  },
  {
    id: 'CAIXA_006',
    regra: 'Mudança obrigatória LP → LR durante o ano: tributar receitas auferidas/não recebidas do período anterior. Diferença sem multa/juros se paga até último dia útil do mês subsequente ao trimestre',
    artigo: 'Art. 223-A, §§1º-2º',
    redacaoDadaPor: 'IN RFB 1881/2019'
  },
  {
    id: 'CAIXA_007',
    regra: 'CSLL pelo resultado presumido em regime de caixa: SÓ é permitido se o IRPJ também adotar regime de caixa',
    artigo: 'Art. 224'
  }
];


// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 31: VEDAÇÕES À OPÇÃO PELO LP — CONSOLIDAÇÃO (Art. 214)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Vedações à opção pelo Lucro Presumido consolidadas (IN RFB 1.700/2017, Art. 214).
 */
const VEDACOES_OPCAO_LP = [
  {
    id: 'VED_001',
    impedimento: 'Receita bruta total no ano anterior > R$ 78.000.000,00',
    condicao: 'SE receita_bruta_anual_anterior > 78.000.000 → VEDA',
    proporcional: 'SE meses_atividade < 12 → limite = 6.500.000 × meses',
    artigo: 'Art. 214, caput'
  },
  {
    id: 'VED_002',
    impedimento: 'PJ obrigada ao Lucro Real (Art. 59 da IN 1700/2017)',
    condicao: 'SE enquadrada no Art. 59 → VEDA',
    excecao: 'PJs dos incisos I, III, IV, V do Art. 59 podem optar por LP durante o Refis (§§5º-A/B/C)',
    artigo: 'Art. 214, caput / §§5º-A a 5º-C',
    redacaoDadaPor: 'IN RFB 1881/2019'
  },
  {
    id: 'VED_003',
    impedimento: 'PJ resultante de incorporação/fusão enquadrada no Art. 59',
    condicao: 'SE (incorporação OU fusão) E resultado enquadrada no Art. 59 → VEDA',
    excecao: 'Incorporadora já no Refis antes da incorporação (§5º)',
    artigo: 'Art. 214, §4º'
  },
  {
    id: 'VED_004',
    impedimento: 'Auferir lucros, rendimentos ou ganhos de capital oriundos do EXTERIOR durante LP',
    condicao: 'SE regime = LP E rendimentos_exterior = true → MIGRAR para LR Trimestral a partir do trimestre',
    artigo: 'Art. 214, §3º-A',
    redacaoDadaPor: 'IN RFB 1881/2019'
  },
  {
    id: 'VED_005',
    impedimento: 'Opção pelo LP é IRRETRATÁVEL para todo o ano-calendário',
    condicao: 'Opção se aplica a todo o período de atividade no ano-calendário',
    excecao: 'Art. 236: trimestres com lucro arbitrado podem conviver com LP nos demais',
    artigo: 'Art. 214, §1º'
  }
];


// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 32: METADADOS E LACUNAS DA NORMA PROCESSADA
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Registro de normas alteradoras e lacunas identificadas.
 * Usado para auditoria e rastreabilidade do motor.
 */
const METADADOS_NORMA = {
  normaBase: 'IN RFB 1700/2017',
  dataPublicacao: '2017-03-14',
  vigenciaInicio: '2017-03-16',

  normasAlteradoras: [
    { numero: 'IN RFB 1881/2019', data: '2019-04-03', artigosAlterados: ['33 §1º IV h', '33 §7º', '34 §1º IV-V', '214 §3º-A §5º-A §5º-B §5º-C', '215 §3º-A §10 §§30-32', '218', '221', '223-A', '227 §4º IV §4º-A §4º-B §22 §§32-34', '230'] },
    { numero: 'IN RFB 2161/2023', data: '2023', nota: 'NÃO processada — verificar alterações' },
    { numero: 'IN RFB 2201/2024', data: '2024', nota: 'NÃO processada — verificar alterações' },
    { numero: 'IN RFB 2235/2024', data: '2024', nota: 'NÃO processada — verificar alterações' },
    { numero: 'IN RFB 2281/2025', data: '2025', nota: 'NÃO processada — verificar alterações' },
    { numero: 'IN RFB 2296/2025', data: '2025', nota: 'NÃO processada — verificar alterações' }
  ],

  lacunasIdentificadas: [
    'Art. 29 IN 1700 (alíquota IRPJ 15% + adicional 10%) — referenciado mas não incluído no texto processado',
    'Art. 30 IN 1700 (alíquotas CSLL: 9%, 15%, 17%, 20% por tipo de PJ) — não incluído',
    'Art. 26 IN 1700 (definição detalhada de receita bruta) — não incluído',
    'Art. 59 IN 1700 (lista completa de PJs obrigadas ao Lucro Real) — não incluído',
    'PIS/COFINS regime cumulativo: exclusões detalhadas para setores específicos',
    'IRRF sobre aplicações financeiras e serviços — não detalhado por tipo de operação',
    'JCP — mencionado como acréscimo mas sem regras detalhadas de cálculo/limites no contexto LP',
    'Alterações das INs 2161/2023, 2201/2024, 2235/2024, 2281/2025, 2296/2025 — NÃO processadas'
  ],

  normasComplementaresNecessarias: [
    'Art. 29 IN 1700 (alíquota IRPJ)', 'Art. 30 IN 1700 (alíquota CSLL)', 'Art. 26 IN 1700 (receita bruta)',
    'Art. 59 IN 1700 (obrigadas ao LR)', 'Art. 119 IN 1700 (mudança LP→LR)', 'Art. 200 IN 1700 (valor contábil ganho capital)',
    'Arts. 271-276 IN 1700 (bônus adimplência)', 'Arts. 291-296 IN 1700 (adoção inicial Lei 12.973)',
    'Lei 9.249/1995', 'Lei 9.430/1996', 'Lei 12.973/2014', 'IN RFB 1.312/2012 (preços transferência)',
    'IN RFB 1925/2020', 'IN RFB 2161/2023', 'IN RFB 2201/2024', 'IN RFB 2235/2024', 'IN RFB 2281/2025', 'IN RFB 2296/2025'
  ]
};


// ═══════════════════════════════════════════════════════════════════════════════
// FIM DAS NOVAS SEÇÕES (17-32)


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
  TABELA_INSS_PROGRESSIVA_2026,
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
  simularProLaboreOtimoMultiSocios,
  simularJCP,
  simularRegimeCaixa,
  calcularBeneficioECD,

  // ── Funções de Otimização (Etapa 4) ──
  gerarCalendarioTributario,

  // ── Comparativo SUDAM/SUDENE ──
  calcularEconomiaLRComSUDAM,

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

  // ── Seções 17-32: IN RFB 1.700/2017 Detalhamento (v3.5.1) ──
  ACRESCIMOS_BASE_CALCULO,
  EXCLUSOES_BASE_CALCULO,
  PERCENTUAL_REDUZIDO_16PCT,
  verificarPercentualReduzido16,
  LUCRO_ARBITRADO,
  calcularLucroArbitrado,
  REGRAS_GANHO_CAPITAL_LP,
  VARIACAO_CAMBIAL_LP,
  RENDA_VARIAVEL_LP,
  ARRENDAMENTO_ARRENDADORA_LP,
  CONCESSAO_SERVICOS_PUBLICOS_LP,
  DEDUCOES_RECEITA_INSTITUICOES_FINANCEIRAS,
  DISTRIBUICAO_LUCROS_DETALHADA,
  OTIMIZACOES_FISCAIS_LP,
  REGRAS_CONDICIONAIS_LP,
  REGIME_CAIXA_DETALHADO,
  VEDACOES_OPCAO_LP,
  METADADOS_NORMA,

  // ── Funções Auxiliares ──
  _normalizarSocio,
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
// FIX (Erro 9): Verificar se App existe antes de chamar exportPDF, com mensagem de erro amigável
if (typeof window !== 'undefined') {
  window.exportPDF = function() {
    if (typeof App === 'undefined' || App === null) {
      alert('Erro: Nenhum cálculo foi realizado ainda. Execute a simulação antes de exportar o PDF.');
      return;
    }
    exportPDF(App);
  };
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
  console.log('║   MOTOR DE CÁLCULO FISCAL — LUCRO PRESUMIDO v3.6.1         ║');
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
    receitas: [{ atividadeId: 'servicos_gerais', valor: 2350000 }],  // FIX AUDITORIA: segregar ISS
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
  console.log('  Demonstração concluída. Motor v3.8.0 — Todas as etapas (1-4) + Seções 17-32 + Correções Auditoria.');
  console.log('═══════════════════════════════════════════════════════\n');
}

// Executa demonstração se rodado diretamente
if (typeof require !== 'undefined' && require.main === module) {
  _executarDemonstracao();
}
