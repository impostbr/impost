/**
 * IMPOST — Cloud Functions API
 * Wrapper que expõe os motores de cálculo como endpoints HTTP seguros.
 * Os arquivos .js originais rodam no servidor, invisíveis ao usuário.
 */

const functions = require("firebase-functions");

// ═══════════════════════════════════════════════════════════════
// 1. CARREGAR ESTADOS PRIMEIRO (outros módulos dependem dele)
// ═══════════════════════════════════════════════════════════════
const Estados = require("./scripts/estados");
// Disponibilizar globalmente para módulos que usam globalThis.Estados
globalThis.Estados = Estados;
globalThis.EstadosBR = Estados;

// ═══════════════════════════════════════════════════════════════
// 2. CARREGAR MÓDULOS DE CÁLCULO
// ═══════════════════════════════════════════════════════════════
const LucroPresumido = require("./scripts/lucro_presumido");
const EstudoLP = require("./scripts/lucro-presumido-estudos");
const ComparadorRegimes = require("./scripts/comparador-regimes");

// Tentar carregar módulos extras (não quebra se não existirem)
let SimplesNacional, LucroReal, DadosTributarios, CnaeMapeamento;
try { SimplesNacional = require("./scripts/simples_nacional"); } catch (e) {}
try { LucroReal = require("./scripts/lucro-real-estudos"); } catch (e) {}
try { DadosTributarios = require("./scripts/dados-tributarios"); } catch (e) {}
try { CnaeMapeamento = require("./scripts/cnae-mapeamento"); } catch (e) {}

// ═══════════════════════════════════════════════════════════════
// 3. HELPERS
// ═══════════════════════════════════════════════════════════════

/** CORS — permite chamadas do seu frontend */
function setCors(req, res) {
  // TODO: trocar '*' pelo domínio real do seu site em produção
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return true;
  }
  return false;
}

/** Validar que é POST */
function validarPost(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ erro: "Use POST" });
    return false;
  }
  return true;
}

/** Resposta de erro padronizada */
function erroResponse(res, mensagem, status = 400) {
  return res.status(status).json({ erro: mensagem });
}

// ═══════════════════════════════════════════════════════════════
// 4. ENDPOINTS — CLOUD FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * POST /calcularLucroPresumido
 * Calcula tributos no regime de Lucro Presumido
 * 
 * Body: {
 *   receitaBrutaAnual: 500000,
 *   receitas: [{ atividadeId: "servicos_gerais", valor: 500000 }],
 *   aliquotaISS: 0.05,
 *   folhaPagamentoMensal: 10000,
 *   aliquotaINSSTotal: 0.235,
 *   uf: "PA",
 *   ... (demais parâmetros aceitos pelo motor)
 * }
 */
exports.calcularLucroPresumido = functions.https.onRequest((req, res) => {
  if (setCors(req, res)) return;
  if (!validarPost(req, res)) return;

  try {
    const params = req.body;

    if (!params || !params.receitaBrutaAnual) {
      return erroResponse(res, "Parâmetro 'receitaBrutaAnual' é obrigatório");
    }

    // Cálculo trimestral
    const resultado = LucroPresumido.calcularLucroPresumidoTrimestral(params);

    // Cálculo anual consolidado
    const anual = LucroPresumido.calcularAnualConsolidado(params);

    // PIS/COFINS mensal
    const pisCofins = LucroPresumido.calcularPISCOFINSMensal(params);

    res.json({
      sucesso: true,
      trimestral: resultado,
      anual: anual,
      pisCofins: pisCofins,
    });
  } catch (error) {
    console.error("Erro calcularLucroPresumido:", error);
    erroResponse(res, error.message, 500);
  }
});

/**
 * POST /estudoLucroPresumido
 * Gera estudo completo do Lucro Presumido com break-even, dicas e economia
 * 
 * Body: mesmos parâmetros + opcionais para estudo
 */
exports.estudoLucroPresumido = functions.https.onRequest((req, res) => {
  if (setCors(req, res)) return;
  if (!validarPost(req, res)) return;

  try {
    const params = req.body;

    if (!params || !params.receitaBrutaAnual) {
      return erroResponse(res, "Parâmetro 'receitaBrutaAnual' é obrigatório");
    }

    const resultado = {};

    // Break-even
    if (EstudoLP.calcularBreakEven) {
      resultado.breakEven = EstudoLP.calcularBreakEven(params);
    }

    // Dicas inteligentes
    if (EstudoLP.gerarDicasInteligentes) {
      resultado.dicas = EstudoLP.gerarDicasInteligentes(params);
    }

    // Impacto LC 224
    if (EstudoLP.calcularImpactoLC224) {
      resultado.impactoLC224 = EstudoLP.calcularImpactoLC224(params);
    }

    // Economia potencial
    if (EstudoLP.calcularEconomiaPotencial) {
      resultado.economiaPotencial = EstudoLP.calcularEconomiaPotencial(params);
    }

    // Resumo executivo
    if (EstudoLP.gerarResumoExecutivo) {
      resultado.resumoExecutivo = EstudoLP.gerarResumoExecutivo(params);
    }

    res.json({
      sucesso: true,
      estudo: resultado,
    });
  } catch (error) {
    console.error("Erro estudoLucroPresumido:", error);
    erroResponse(res, error.message, 500);
  }
});

/**
 * POST /compararRegimes
 * Compara Simples Nacional × Lucro Presumido × Lucro Real
 * 
 * Body: {
 *   faturamentoMensal: 50000,
 *   folhaMensal: 15000,
 *   codigoCNAE: "6201-5",
 *   categoriaCNAE: "servicos",
 *   uf: "PA"
 * }
 */
exports.compararRegimes = functions.https.onRequest((req, res) => {
  if (setCors(req, res)) return;
  if (!validarPost(req, res)) return;

  try {
    const params = req.body;

    if (!params || !params.faturamentoMensal) {
      return erroResponse(res, "Parâmetro 'faturamentoMensal' é obrigatório");
    }

    // Comparação completa
    const resultado = ComparadorRegimes.comparar(params);

    res.json({
      sucesso: true,
      comparacao: resultado,
    });
  } catch (error) {
    console.error("Erro compararRegimes:", error);
    erroResponse(res, error.message, 500);
  }
});

/**
 * POST /compararPorCNAE
 * Comparação simplificada por código CNAE
 * 
 * Body: {
 *   codigoCNAE: "6201-5",
 *   categoriaCNAE: "servicos",
 *   faturamentoMensal: 50000,
 *   folhaMensal: 15000,
 *   uf: "PA"
 * }
 */
exports.compararPorCNAE = functions.https.onRequest((req, res) => {
  if (setCors(req, res)) return;
  if (!validarPost(req, res)) return;

  try {
    const { codigoCNAE, categoriaCNAE, faturamentoMensal, folhaMensal, uf } = req.body;

    if (!codigoCNAE || !faturamentoMensal) {
      return erroResponse(res, "Parâmetros 'codigoCNAE' e 'faturamentoMensal' são obrigatórios");
    }

    const resultado = ComparadorRegimes.compararParaCNAE(
      codigoCNAE,
      categoriaCNAE || "servicos",
      faturamentoMensal,
      folhaMensal || 0,
      uf || "SP"
    );

    res.json({
      sucesso: true,
      comparacao: resultado,
    });
  } catch (error) {
    console.error("Erro compararPorCNAE:", error);
    erroResponse(res, error.message, 500);
  }
});

/**
 * POST /fichaTributariaEstado
 * Retorna ficha tributária completa de um estado
 * 
 * Body: { uf: "PA" }
 */
exports.fichaTributariaEstado = functions.https.onRequest((req, res) => {
  if (setCors(req, res)) return;
  if (!validarPost(req, res)) return;

  try {
    const { uf } = req.body;

    if (!uf) {
      return erroResponse(res, "Parâmetro 'uf' é obrigatório");
    }

    const resultado = ComparadorRegimes.fichaTributariaUF(uf);

    res.json({
      sucesso: true,
      ficha: resultado,
    });
  } catch (error) {
    console.error("Erro fichaTributariaEstado:", error);
    erroResponse(res, error.message, 500);
  }
});

/**
 * POST /elegibilidade
 * Verifica elegibilidade para Lucro Presumido
 * 
 * Body: { receitaBrutaAnual: 500000, ... }
 */
exports.elegibilidade = functions.https.onRequest((req, res) => {
  if (setCors(req, res)) return;
  if (!validarPost(req, res)) return;

  try {
    const params = req.body;
    const resultado = LucroPresumido.verificarElegibilidade(params);

    res.json({
      sucesso: true,
      elegibilidade: resultado,
    });
  } catch (error) {
    console.error("Erro elegibilidade:", error);
    erroResponse(res, error.message, 500);
  }
});

/**
 * GET /health
 * Verificação de saúde da API
 */
exports.health = functions.https.onRequest((req, res) => {
  if (setCors(req, res)) return;

  res.json({
    status: "ok",
    versao: EstudoLP.VERSION || "1.0.0",
    modulos: {
      lucroPresumido: !!LucroPresumido,
      estudoLP: !!EstudoLP,
      comparadorRegimes: !!ComparadorRegimes,
      estados: !!Estados,
      simplesNacional: !!SimplesNacional,
      lucroReal: !!LucroReal,
    },
    timestamp: new Date().toISOString(),
  });
});
