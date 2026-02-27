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
// 2b. FIREBASE ADMIN + MERCADO PAGO (NOVO)
// ═══════════════════════════════════════════════════════════════
const admin = require("firebase-admin");
if (!admin.apps.length) {
  admin.initializeApp();
}
const dbAdmin = admin.firestore();

// Credenciais do Mercado Pago via Firebase Functions Config
// Configurar com:
//   firebase functions:config:set mercadopago.access_token="APP_USR-..."
//   firebase functions:config:set mercadopago.webhook_secret="f12b1bea..."
const MP_ACCESS_TOKEN = functions.config().mercadopago
  ? functions.config().mercadopago.access_token
  : "";
const MP_WEBHOOK_SECRET = functions.config().mercadopago
  ? functions.config().mercadopago.webhook_secret
  : "";

// ═══════════════════════════════════════════════════════════════
// 3. HELPERS
// ═══════════════════════════════════════════════════════════════

/** CORS — permite chamadas do seu frontend */
function setCors(req, res) {
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

/** NOVO: Verificar token de autenticação Firebase */
async function verificarAuth(req) {
  var authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  try {
    var token = authHeader.split("Bearer ")[1];
    return await admin.auth().verifyIdToken(token);
  } catch (error) {
    console.error("Erro ao verificar token:", error.message);
    return null;
  }
}

/** NOVO: Chamada HTTP genérica para API do Mercado Pago */
function mpRequest(method, path, body) {
  const https = require("https");
  return new Promise(function (resolve, reject) {
    var options = {
      hostname: "api.mercadopago.com",
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + MP_ACCESS_TOKEN,
      },
    };

    var req = https.request(options, function (response) {
      var data = "";
      response.on("data", function (chunk) { data += chunk; });
      response.on("end", function () {
        try {
          resolve({ status: response.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: response.statusCode, data: data });
        }
      });
    });

    req.on("error", reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// ═══════════════════════════════════════════════════════════════
// 4. ENDPOINTS — CLOUD FUNCTIONS (EXISTENTES)
// ═══════════════════════════════════════════════════════════════

/**
 * POST /calcularLucroPresumido
 */
exports.calcularLucroPresumido = functions.https.onRequest((req, res) => {
  if (setCors(req, res)) return;
  if (!validarPost(req, res)) return;

  try {
    const params = req.body;

    if (!params || !params.receitaBrutaAnual) {
      return erroResponse(res, "Parâmetro 'receitaBrutaAnual' é obrigatório");
    }

    const resultado = LucroPresumido.calcularLucroPresumidoTrimestral(params);
    const anual = LucroPresumido.calcularAnualConsolidado(params);
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

    if (EstudoLP.calcularBreakEven) {
      resultado.breakEven = EstudoLP.calcularBreakEven(params);
    }
    if (EstudoLP.gerarDicasInteligentes) {
      resultado.dicas = EstudoLP.gerarDicasInteligentes(params);
    }
    if (EstudoLP.calcularImpactoLC224) {
      resultado.impactoLC224 = EstudoLP.calcularImpactoLC224(params);
    }
    if (EstudoLP.calcularEconomiaPotencial) {
      resultado.economiaPotencial = EstudoLP.calcularEconomiaPotencial(params);
    }
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
 */
exports.compararRegimes = functions.https.onRequest((req, res) => {
  if (setCors(req, res)) return;
  if (!validarPost(req, res)) return;

  try {
    const params = req.body;

    if (!params || !params.faturamentoMensal) {
      return erroResponse(res, "Parâmetro 'faturamentoMensal' é obrigatório");
    }

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
    mercadoPago: !!MP_ACCESS_TOKEN,
    timestamp: new Date().toISOString(),
  });
});

// ═══════════════════════════════════════════════════════════════
// 5. MERCADO PAGO — CRIAR ASSINATURA (NOVO)
// ═══════════════════════════════════════════════════════════════

/**
 * POST /criarAssinatura
 * Cria uma assinatura no Mercado Pago e retorna o link de pagamento.
 * Requer autenticação Firebase (Bearer token).
 *
 * Body: { periodo: "mensal" | "anual" }
 *
 * Retorna: { sucesso: true, init_point: "https://www.mercadopago.com.br/..." }
 */
exports.criarAssinatura = functions.https.onRequest(async (req, res) => {
  if (setCors(req, res)) return;
  if (!validarPost(req, res)) return;

  try {
    // 1. Verificar autenticação
    const decoded = await verificarAuth(req);
    if (!decoded) {
      return res.status(401).json({ erro: "Token de autenticação inválido" });
    }
    const uid = decoded.uid;

    // 2. Buscar dados do usuário
    const userDoc = await dbAdmin.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }
    const userData = userDoc.data();

    // 3. Verificar se já é Pro
    if (userData.plano === "pro") {
      return res.status(400).json({ erro: "Você já possui o plano Pro" });
    }

    // 4. Determinar período e valor
    const periodo = req.body.periodo || "mensal";
    let valor, frequencia, tipoFrequencia, reason;

    if (periodo === "anual") {
      valor = 399;
      frequencia = 12;
      tipoFrequencia = "months";
      reason = "IMPOST. Pro — Plano Anual";
    } else {
      valor = 49.90;
      frequencia = 1;
      tipoFrequencia = "months";
      reason = "IMPOST. Pro — Plano Mensal";
    }

    // 5. Criar assinatura no Mercado Pago (sem plano associado, pagamento pendente)
    const backUrl = "https://impostbr.github.io/impost/pages/planos.html";

    const mpBody = {
      reason: reason,
      external_reference: uid,
      payer_email: userData.email || decoded.email,
      auto_recurring: {
        frequency: frequencia,
        frequency_type: tipoFrequencia,
        transaction_amount: valor,
        currency_id: "BRL",
      },
      back_url: backUrl,
      status: "pending",
    };

    console.log("[criarAssinatura] Criando para uid:", uid, "periodo:", periodo);

    const mpResult = await mpRequest("POST", "/preapproval", mpBody);

    if (mpResult.status !== 200 && mpResult.status !== 201) {
      console.error("[criarAssinatura] Erro MP:", JSON.stringify(mpResult.data));
      return res.status(500).json({
        erro: "Erro ao criar assinatura no Mercado Pago",
        detalhe: mpResult.data.message || "Erro desconhecido",
      });
    }

    // 6. Salvar referência da assinatura no Firestore
    await dbAdmin.collection("users").doc(uid).update({
      "assinatura.gateway": "mercadopago",
      "assinatura.gatewayId": mpResult.data.id || "",
      "assinatura.status": "pending",
      "assinatura.valor": valor,
    });

    console.log("[criarAssinatura] Sucesso! ID MP:", mpResult.data.id);

    // 7. Retornar link de pagamento
    res.json({
      sucesso: true,
      init_point: mpResult.data.init_point,
      assinaturaId: mpResult.data.id,
      periodo: periodo,
      valor: valor,
    });
  } catch (error) {
    console.error("[criarAssinatura] Erro:", error);
    erroResponse(res, error.message, 500);
  }
});

// ═══════════════════════════════════════════════════════════════
// 6. MERCADO PAGO — WEBHOOK (NOVO)
// ═══════════════════════════════════════════════════════════════

/**
 * POST /webhookMercadoPago
 * Recebe notificações do Mercado Pago sobre pagamentos e assinaturas.
 * Atualiza o plano do usuário no Firestore automaticamente.
 *
 * NÃO requer autenticação Firebase — é chamado pelo Mercado Pago.
 */
exports.webhookMercadoPago = functions.https.onRequest(async (req, res) => {
  // Webhook aceita POST do Mercado Pago
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, x-signature, x-request-id");
    return res.status(204).send("");
  }

  if (req.method !== "POST") {
    return res.status(200).send("OK");
  }

  try {
    const body = req.body;
    console.log("[Webhook MP] Recebido:", JSON.stringify(body));

    // O Mercado Pago envia diferentes tipos de notificação
    const type = body.type;
    const dataId = body.data ? body.data.id : null;

    if (!type || !dataId) {
      // Pode ser ping de teste — retorna 200 para não reenviar
      console.log("[Webhook MP] Notificação sem type/data.id — ignorando");
      return res.status(200).send("OK");
    }

    // ──────────────────────────────────────────────
    // TIPO: subscription_preapproval (assinatura criada/atualizada)
    // ──────────────────────────────────────────────
    if (type === "subscription_preapproval") {
      console.log("[Webhook MP] Assinatura atualizada, ID:", dataId);

      // Buscar detalhes da assinatura no MP
      const mpResult = await mpRequest("GET", "/preapproval/" + dataId, null);

      if (mpResult.status !== 200) {
        console.error("[Webhook MP] Erro ao buscar assinatura:", JSON.stringify(mpResult.data));
        return res.status(200).send("OK"); // Retorna 200 para não reenviar
      }

      const assinatura = mpResult.data;
      const uid = assinatura.external_reference;
      const status = assinatura.status; // authorized, paused, cancelled, pending

      if (!uid) {
        console.warn("[Webhook MP] Assinatura sem external_reference (uid)");
        return res.status(200).send("OK");
      }

      console.log("[Webhook MP] UID:", uid, "Status MP:", status);

      // Mapear status do MP para plano IMPOST
      let novoPlano = "free";
      let assinaturaStatus = "inactive";

      if (status === "authorized") {
        novoPlano = "pro";
        assinaturaStatus = "active";
      } else if (status === "paused") {
        novoPlano = "pro"; // Mantém Pro enquanto pausado (ainda tem acesso)
        assinaturaStatus = "paused";
      } else if (status === "cancelled") {
        novoPlano = "free";
        assinaturaStatus = "cancelled";
      } else if (status === "pending") {
        // Ainda não pagou — não muda nada
        console.log("[Webhook MP] Assinatura pendente — aguardando pagamento");
        return res.status(200).send("OK");
      }

      // Atualizar Firestore
      const updateData = {
        plano: novoPlano,
        "assinatura.status": assinaturaStatus,
        "assinatura.gateway": "mercadopago",
        "assinatura.gatewayId": String(dataId),
      };

      if (novoPlano === "pro") {
        updateData["assinatura.inicioEm"] = admin.firestore.FieldValue.serverTimestamp();
      }

      await dbAdmin.collection("users").doc(uid).update(updateData);
      console.log("[Webhook MP] Firestore atualizado! UID:", uid, "→ plano:", novoPlano);
    }

    // ──────────────────────────────────────────────
    // TIPO: payment (pagamento individual)
    // ──────────────────────────────────────────────
    else if (type === "payment") {
      console.log("[Webhook MP] Pagamento recebido, ID:", dataId);

      // Buscar detalhes do pagamento
      const mpResult = await mpRequest("GET", "/v1/payments/" + dataId, null);

      if (mpResult.status !== 200) {
        console.error("[Webhook MP] Erro ao buscar pagamento:", JSON.stringify(mpResult.data));
        return res.status(200).send("OK");
      }

      const pagamento = mpResult.data;

      // Se o pagamento está associado a uma assinatura (preapproval)
      if (pagamento.status === "approved" && pagamento.metadata && pagamento.metadata.preapproval_id) {
        console.log("[Webhook MP] Pagamento aprovado para assinatura:", pagamento.metadata.preapproval_id);
        // A notificação de subscription_preapproval já cuida da atualização
        // Mas podemos logar para auditoria
      }

      // Log para auditoria
      console.log("[Webhook MP] Pagamento:", {
        id: pagamento.id,
        status: pagamento.status,
        valor: pagamento.transaction_amount,
        email: pagamento.payer ? pagamento.payer.email : "N/A",
      });
    }

    // Qualquer outro tipo — apenas loga
    else {
      console.log("[Webhook MP] Tipo não tratado:", type);
    }

    // SEMPRE retornar 200 — se não, o MP reenvia a cada 15 min
    return res.status(200).send("OK");
  } catch (error) {
    console.error("[Webhook MP] Erro no processamento:", error);
    // Retorna 200 mesmo com erro para evitar reenvios infinitos
    return res.status(200).send("OK");
  }
});
