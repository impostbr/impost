// ═══════════════════════════════════════════════════════════════════════
// IMPOST. — User Service (v4 — modal de upsell específico por módulo)
// Arquivo: scripts/auth/user-service.js
// Depende de: auth-guard.js (carregado antes)
// ═══════════════════════════════════════════════════════════════════════
//
// Planos: free | pessoal (R$14,90) | pro (R$69,90) | escritorio (R$199,90) | trial
//
// NOVIDADE v4: Quando um card bloqueado possui data-upsell-key, o modal
// exibe conteúdo de venda ESPECÍFICO para aquele módulo (ícone, headline,
// benefícios, CTA direcionado). Cards sem data-upsell-key usam o modal
// genérico (backward compatible).
//
// Funções disponíveis globalmente via IMPOST_PLANO:
//
//   IMPOST_PLANO.temAcessoPro()
//     → boolean — true se plano é "pro", "escritorio" ou "trial" válido
//     → Acesso aos estudos PJ (Lucro Real, Presumido, Simples Nacional)
//
//   IMPOST_PLANO.temAcessoPessoal()
//     → boolean — true se qualquer plano pago ou "trial" válido
//     → Acesso ao Estudo Pessoa Física
//
//   IMPOST_PLANO.verificarAcessoOuUpgrade(mensagem?)
//     → boolean — retorna true se tem acesso Pro, ou mostra modal upgrade
//
//   IMPOST_PLANO.verificarPessoalOuUpgrade(mensagem?)
//     → boolean — retorna true se tem acesso Pessoal, ou mostra modal upgrade
//
//   IMPOST_PLANO.mostrarModalUpgrade(mensagem?)
//     → void — abre modal genérico de upgrade com CTA para planos.html
//
//   IMPOST_PLANO.mostrarUpsell(upsellKey)
//     → void — abre modal rico específico para o módulo (se key existe em UPSELL_DATA)
//
//   IMPOST_PLANO.fecharModalUpgrade()
//     → void — fecha qualquer modal de upgrade aberto
//
//   IMPOST_PLANO.getPlano()
//     → string — "free" | "pessoal" | "pro" | "escritorio" | "trial"
//
//   IMPOST_PLANO.getNomeUsuario()
//     → string — nome do usuário ou e-mail como fallback
//
//   IMPOST_PLANO.getLimitePDF()
//     → number — limite mensal de PDFs (5, 15 ou Infinity)
//
//   IMPOST_PLANO.aplicarBloqueiosPro()
//     → void — escaneia [data-pro] no DOM e aplica cadeados
//
//   IMPOST_PLANO.aplicarBloqueiosPessoal()
//     → void — escaneia [data-pessoal] no DOM e aplica cadeados
//
// USO NO HTML para bloquear elementos:
//
//   <!-- Bloqueia para Free (libera no Pessoal em diante) -->
//   <a href="pessoa-fisica-estudos.html"
//      data-pessoal="true"
//      data-pessoal-msg="Estudo Pessoa Física"
//      data-upsell-key="estudo-pf">
//       Estudo PF
//   </a>
//
//   <!-- Bloqueia para Free E Pessoal (libera no Pro em diante) -->
//   <a href="lucro-real-estudos.html"
//      data-pro="true"
//      data-pro-msg="Estudo Lucro Real"
//      data-upsell-key="estudo-lucro-real">
//       Estudo Lucro Real 🔒
//   </a>
// ═══════════════════════════════════════════════════════════════════════

(function () {
    "use strict";

    // ══════════════════════════════════════════════════════════════
    // CONFIGURAÇÃO
    // ══════════════════════════════════════════════════════════════

    var BASE_PATH = (function () {
        var path = window.location.pathname;
        var match = path.match(/^(\/impost\/)/);
        return match ? match[1] : "/";
    })();

    var PLANOS_URL = BASE_PATH + "pages/planos.html";
    var CSS_INJETADO = false;
    var escapeHandler = null;

    // ══════════════════════════════════════════════════════════════
    // DADOS DE UPSELL POR MÓDULO
    // Cada key corresponde ao valor de data-upsell-key no HTML.
    // Se o card NÃO tem data-upsell-key, usa o modal genérico.
    // ══════════════════════════════════════════════════════════════

    var UPSELL_DATA = {

        // ─── ESTUDO PESSOA FÍSICA ─── Plano Pessoal
        "estudo-pf": {
            icon: "\uD83D\uDC64",
            iconGradient: "linear-gradient(135deg, #1565c0, #1e88e5)",
            plan: "pessoal",
            planLabel: "Dispon\u00EDvel no Plano Pessoal",
            title: "Estudo Pessoa F\u00EDsica",
            headline: "47 vari\u00E1veis tribut\u00E1rias cruzadas em tempo real para projetar seu rendimento l\u00EDquido",
            description: "An\u00E1lise t\u00E9cnica fundamentada em 12 dispositivos legais \u2014 incluindo a Lei 14.663/2023 (nova faixa de isen\u00E7\u00E3o IRPF), IN RFB 2.065/2022 (tabelas progressivas), Lei 8.212/91 (contribui\u00E7\u00F5es previdenci\u00E1rias) e LC 116/2003 (ISS). Cruza remunera\u00E7\u00E3o bruta, dedu\u00E7\u00F5es legais, encargos patronais e contribui\u00E7\u00F5es obrigat\u00F3rias para gerar o demonstrativo l\u00EDquido em cada modelo de atua\u00E7\u00E3o.",
            benefits: [
                "Compara\u00E7\u00E3o t\u00E9cnica CLT vs Aut\u00F4nomo RPA vs PJ com pr\u00F3-labore otimizado",
                "IRPF com 5 faixas progressivas + dedu\u00E7\u00F5es legais \u2014 Lei 14.663/2023",
                "INSS patronal de 20% + RAT + Terceiros para cen\u00E1rio CLT \u2014 Lei 8.212/91",
                "Proje\u00E7\u00E3o anual: 13\u00BA sal\u00E1rio, f\u00E9rias + 1/3, FGTS 8% e multa rescis\u00F3ria",
                "Demonstrativo final com carga tribut\u00E1ria efetiva (%) sobre o rendimento bruto"
            ],
            ctaText: "Desbloquear com Plano Pessoal",
            ctaUrl: "planos.html?highlight=pessoal",
            priceHint: "A partir de <strong>R$ 14,90/m\u00EAs</strong> \u2014 cancele quando quiser"
        },

        // ─── ESTUDO LUCRO REAL ─── Plano Pro
        "estudo-lucro-real": {
            icon: "\uD83D\uDCCA",
            iconGradient: "linear-gradient(135deg, #5e35b1, #7e57c2)",
            plan: "pro",
            planLabel: "Dispon\u00EDvel no Plano Pro",
            title: "Estudo Lucro Real",
            headline: "Mais de 130 dispositivos legais aplicados \u2014 Decreto 9.580/2018, Lei 9.249/95, Lei 10.637 e Lei 10.833",
            description: "O estudo de maior profundidade da plataforma. Reconstr\u00F3i a DRE fiscal aplicando as regras do RIR/2018 (1.050 artigos), identifica adi\u00E7\u00F5es e exclus\u00F5es do LALUR conforme os Arts. 249 a 262, apura cr\u00E9ditos de PIS/COFINS n\u00E3o-cumulativos por natureza de despesa (insumos, deprecia\u00E7\u00E3o, energia, alugu\u00E9is, frete) e projeta a economia tribut\u00E1ria frente aos demais regimes.",
            benefits: [
                "DRE fiscal com adi\u00E7\u00F5es e exclus\u00F5es do LALUR \u2014 Arts. 249-262 do Decreto 9.580/2018",
                "IRPJ 15% + adicional de 10% sobre lucro excedente a R$ 20 mil/m\u00EAs \u2014 Art. 225 RIR",
                "PIS 1,65% e COFINS 7,6% n\u00E3o-cumulativos com apura\u00E7\u00E3o de cr\u00E9ditos \u2014 Leis 10.637 e 10.833",
                "Compensa\u00E7\u00E3o de preju\u00EDzos fiscais limitada a 30% do lucro \u2014 Art. 580 do RIR",
                "Compara\u00E7\u00E3o autom\u00E1tica com Presumido e Simples para validar a escolha de regime"
            ],
            ctaText: "Desbloquear com Plano Pro",
            ctaUrl: "planos.html?highlight=pro",
            priceHint: "A partir de <strong>R$ 69,90/m\u00EAs</strong> \u2014 acesso completo a todos os estudos"
        },

        // ─── ESTUDO LUCRO PRESUMIDO ─── Plano Pro
        "estudo-lucro-presumido": {
            icon: "\uD83D\uDCCB",
            iconGradient: "linear-gradient(135deg, #ef6c00, #fb8c00)",
            plan: "pro",
            planLabel: "Dispon\u00EDvel no Plano Pro",
            title: "Estudo Lucro Presumido",
            headline: "Apura\u00E7\u00E3o trimestral com 7 percentuais de presun\u00E7\u00E3o \u2014 de 1,6% a 32% conforme a atividade",
            description: "Aplica integralmente os Arts. 591 a 593 do Decreto 9.580/2018 e o Art. 15 da Lei 9.249/95 para determinar a base de c\u00E1lculo presumida. O sistema identifica a atividade econ\u00F4mica, seleciona o percentual correto de presun\u00E7\u00E3o (1,6% para combust\u00EDveis at\u00E9 32% para servi\u00E7os), e gera a apura\u00E7\u00E3o trimestral completa com IRPJ, CSLL, PIS e COFINS cumulativos.",
            benefits: [
                "Presun\u00E7\u00E3o autom\u00E1tica por atividade: 1,6%, 8%, 16% ou 32% \u2014 Art. 15, Lei 9.249/95",
                "IRPJ trimestral: 15% + adicional de 10% sobre excedente de R$ 60 mil \u2014 Art. 225 RIR",
                "CSLL com base presumida de 12% (ind\u00FAstria/com\u00E9rcio) ou 32% (servi\u00E7os) \u2014 Art. 20, Lei 9.249",
                "PIS 0,65% e COFINS 3,0% cumulativos \u2014 sem obriga\u00E7\u00E3o de escritura\u00E7\u00E3o de cr\u00E9ditos",
                "An\u00E1lise de ponto de virada: em qual margem de lucro o Presumido perde para o Real"
            ],
            ctaText: "Desbloquear com Plano Pro",
            ctaUrl: "planos.html?highlight=pro",
            priceHint: "A partir de <strong>R$ 69,90/m\u00EAs</strong> \u2014 acesso completo a todos os estudos"
        },

        // ─── ESTUDO SIMPLES NACIONAL ─── Plano Pro
        "estudo-simples": {
            icon: "\uD83D\uDCD8",
            iconGradient: "linear-gradient(135deg, #0277bd, #039be5)",
            plan: "pro",
            planLabel: "Dispon\u00EDvel no Plano Pro",
            title: "Estudo Simples Nacional",
            headline: "5 tabelas progressivas, 6 faixas de faturamento e 8 tributos partilhados \u2014 LC 123/2006 completa",
            description: "Aplica integralmente os Anexos I a V da Lei Complementar 123/2006 com as altera\u00E7\u00F5es da LC 155/2016. Calcula a al\u00EDquota efetiva pela f\u00F3rmula oficial do Art. 18, \u00A7 1\u00BA: (RBT12 \u00D7 Aliq \u2013 PD) \u00F7 RBT12. Identifica o Fator R para migra\u00E7\u00E3o entre Anexos III e V, e decompõe a guia DAS tributo a tributo: CPP, IRPJ, CSLL, COFINS, PIS, ICMS e ISS.",
            benefits: [
                "Enquadramento nos Anexos I a V com 6 faixas de faturamento \u2014 Art. 18, LC 123/2006",
                "Al\u00EDquota efetiva real pela f\u00F3rmula oficial \u2014 n\u00E3o a nominal da tabela",
                "Fator R: an\u00E1lise de migra\u00E7\u00E3o Anexo V \u2192 III quando folha \u2265 28% da RBT12",
                "Partilha detalhada dos 8 tributos dentro da guia DAS \u2014 Art. 18, \u00A7\u00A7 4\u00BA a 7\u00BA",
                "Controle de sublimite estadual (R$ 3,6M) e teto federal (R$ 4,8M) \u2014 Art. 3\u00BA, LC 123"
            ],
            ctaText: "Desbloquear com Plano Pro",
            ctaUrl: "planos.html?highlight=pro",
            priceHint: "A partir de <strong>R$ 69,90/m\u00EAs</strong> \u2014 acesso completo a todos os estudos"
        }
    };

    // ══════════════════════════════════════════════════════════════
    // 1. VERIFICAÇÃO DE PLANO
    // ══════════════════════════════════════════════════════════════

    function getDadosUsuario() {
        return window.IMPOST_USER_DATA || {};
    }

    function getPlano() {
        var dados = getDadosUsuario();
        return dados.plano || "free";
    }

    function getNomeUsuario() {
        var dados = getDadosUsuario();
        return dados.nome || (window.IMPOST_USER && window.IMPOST_USER.email) || "Usu\u00E1rio";
    }

    function trialValido() {
        var dados = getDadosUsuario();
        if (!dados.planoExpira) return true;

        var expira;
        if (dados.planoExpira && typeof dados.planoExpira.toDate === "function") {
            expira = dados.planoExpira.toDate();
        } else if (dados.planoExpira instanceof Date) {
            expira = dados.planoExpira;
        } else {
            expira = new Date(dados.planoExpira);
        }

        return expira > new Date();
    }

    function temAcessoPro() {
        var dados = getDadosUsuario();
        var plano = dados.plano || "free";

        if (plano === "pro" || plano === "escritorio") return true;
        if (plano === "trial") return trialValido();

        return false;
    }

    function temAcessoPessoal() {
        var dados = getDadosUsuario();
        var plano = dados.plano || "free";

        if (plano === "pessoal" || plano === "pro" || plano === "escritorio") return true;
        if (plano === "trial") return trialValido();

        return false;
    }

    function getLimitePDF() {
        var dados = getDadosUsuario();
        var plano = dados.plano || "free";

        if (plano === "pro" || plano === "escritorio") return Infinity;
        if (plano === "trial") {
            if (trialValido()) return Infinity;
            return 5;
        }
        if (plano === "pessoal") return 15;

        return 5;
    }

    function verificarAcessoOuUpgrade(mensagem) {
        if (temAcessoPro()) return true;
        mostrarModalUpgrade(mensagem);
        return false;
    }

    function verificarPessoalOuUpgrade(mensagem) {
        if (temAcessoPessoal()) return true;
        mostrarModalUpgrade(mensagem);
        return false;
    }

    // ══════════════════════════════════════════════════════════════
    // 2. CSS DO MODAL GENÉRICO + CADEADOS + MODAL RICO
    // ══════════════════════════════════════════════════════════════

    function injetarCSS() {
        if (CSS_INJETADO) return;
        CSS_INJETADO = true;

        var style = document.createElement("style");
        style.id = "impost-user-service-style";
        style.textContent =
            /* ─── Modal Overlay GENÉRICO ─── */
            "#impost-upgrade-overlay {" +
                "position:fixed;inset:0;z-index:99998;" +
                "background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);" +
                "display:flex;align-items:center;justify-content:center;" +
                "opacity:0;pointer-events:none;transition:opacity 0.3s ease;" +
            "}" +
            "#impost-upgrade-overlay.visivel { opacity:1;pointer-events:auto; }" +

            /* ─── Modal Card GENÉRICO ─── */
            ".impost-upgrade-card {" +
                "background:#fff;border-radius:16px;padding:0;max-width:440px;width:90%;" +
                "box-shadow:0 20px 60px rgba(0,0,0,0.2);overflow:hidden;" +
                "transform:translateY(20px) scale(0.95);" +
                "transition:transform 0.35s cubic-bezier(0.16,1,0.3,1);" +
            "}" +
            "#impost-upgrade-overlay.visivel .impost-upgrade-card {" +
                "transform:translateY(0) scale(1);" +
            "}" +

            /* ─── Header verde ─── */
            ".impost-upgrade-header {" +
                "background:linear-gradient(135deg,#1b5e20 0%,#2e7d32 50%,#388e3c 100%);" +
                "padding:28px 28px 24px;text-align:center;position:relative;" +
            "}" +
            ".impost-upgrade-header::after {" +
                "content:'';position:absolute;bottom:-1px;left:0;right:0;height:24px;" +
                "background:#fff;border-radius:16px 16px 0 0;" +
            "}" +
            ".impost-upgrade-icone {" +
                "width:56px;height:56px;border-radius:16px;" +
                "background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.2);" +
                "display:flex;align-items:center;justify-content:center;" +
                "margin:0 auto 16px;" +
            "}" +
            ".impost-upgrade-header h2 {" +
                "font-family:'Plus Jakarta Sans','Poppins','DM Sans',sans-serif;" +
                "font-size:1.3rem;font-weight:700;color:#fff;margin:0 0 6px;" +
            "}" +
            ".impost-upgrade-header p {" +
                "font-size:0.88rem;color:rgba(255,255,255,0.8);margin:0;" +
                "font-family:'Plus Jakarta Sans','Inter','DM Sans',sans-serif;" +
            "}" +

            /* ─── Body ─── */
            ".impost-upgrade-body {" +
                "padding:20px 28px 8px;font-family:'Plus Jakarta Sans','Inter','DM Sans',sans-serif;" +
            "}" +
            ".impost-upgrade-msg {" +
                "font-size:0.9rem;color:#374037;line-height:1.6;margin-bottom:20px;text-align:center;" +
            "}" +
            ".impost-upgrade-features {" +
                "list-style:none;padding:0;margin:0 0 20px;" +
            "}" +
            ".impost-upgrade-features li {" +
                "display:flex;align-items:center;gap:10px;padding:8px 0;" +
                "font-size:0.85rem;color:#4a5c4a;border-bottom:1px solid #f0f0f0;" +
            "}" +
            ".impost-upgrade-features li:last-child { border:none; }" +
            ".impost-upgrade-features li svg { flex-shrink:0;color:#43a047; }" +

            /* ─── Footer ─── */
            ".impost-upgrade-footer { padding:8px 28px 24px;text-align:center; }" +
            ".impost-btn-pro {" +
                "display:inline-flex;align-items:center;justify-content:center;gap:8px;" +
                "width:100%;padding:14px 24px;" +
                "background:linear-gradient(135deg,#1b5e20,#2e7d32);" +
                "color:#fff;font-size:0.95rem;font-weight:700;" +
                "border:none;border-radius:12px;cursor:pointer;" +
                "font-family:'Plus Jakarta Sans','Inter','DM Sans',sans-serif;" +
                "transition:transform 0.2s,box-shadow 0.2s;" +
                "box-shadow:0 4px 14px rgba(27,94,32,0.3);" +
            "}" +
            ".impost-btn-pro:hover {" +
                "transform:translateY(-2px);box-shadow:0 6px 20px rgba(27,94,32,0.4);" +
            "}" +
            ".impost-btn-fechar-upgrade {" +
                "display:inline-block;margin-top:12px;padding:8px 16px;" +
                "background:none;border:none;color:#888;font-size:0.84rem;" +
                "cursor:pointer;font-family:'Plus Jakarta Sans','Inter','DM Sans',sans-serif;" +
                "transition:color 0.2s;" +
            "}" +
            ".impost-btn-fechar-upgrade:hover { color:#555; }" +

            /* ─── Badge Pro (cadeado nos elementos) ─── */
            "[data-pro-bloqueado] {" +
                "position:relative;cursor:pointer !important;" +
            "}" +
            ".impost-pro-badge {" +
                "position:absolute;top:8px;right:8px;z-index:10;" +
                "display:inline-flex;align-items:center;gap:4px;" +
                "padding:4px 10px;border-radius:20px;" +
                "background:linear-gradient(135deg,#1b5e20,#388e3c);" +
                "color:#fff;font-size:0.7rem;font-weight:700;letter-spacing:0.5px;" +
                "font-family:'Plus Jakarta Sans','Inter','DM Sans',sans-serif;" +
                "box-shadow:0 2px 8px rgba(27,94,32,0.3);" +
                "pointer-events:auto;cursor:pointer;" +
            "}" +
            ".impost-pro-badge:hover { transform:scale(1.05); }" +

            /* ─── Badge inline (para links/botões) ─── */
            ".impost-pro-inline {" +
                "display:inline-flex;align-items:center;gap:4px;" +
                "margin-left:6px;padding:2px 8px;border-radius:12px;" +
                "background:#e8f5e9;color:#1b5e20;font-size:0.7rem;font-weight:700;" +
                "letter-spacing:0.3px;pointer-events:auto;cursor:pointer;" +
                "font-family:'Plus Jakarta Sans','Inter','DM Sans',sans-serif;" +
            "}" +
            ".impost-pro-inline:hover { background:#c8e6c9; }" +

            /* ─── Badge Pessoal (cadeado nos elementos data-pessoal) ─── */
            "[data-pessoal-bloqueado] {" +
                "position:relative;cursor:pointer !important;" +
            "}" +
            ".impost-pessoal-badge {" +
                "position:absolute;top:8px;right:8px;z-index:10;" +
                "display:inline-flex;align-items:center;gap:4px;" +
                "padding:4px 10px;border-radius:20px;" +
                "background:linear-gradient(135deg,#1565c0,#1e88e5);" +
                "color:#fff;font-size:0.7rem;font-weight:700;letter-spacing:0.5px;" +
                "font-family:'Plus Jakarta Sans','Inter','DM Sans',sans-serif;" +
                "box-shadow:0 2px 8px rgba(21,101,192,0.3);" +
                "pointer-events:auto;cursor:pointer;" +
            "}" +
            ".impost-pessoal-badge:hover { transform:scale(1.05); }" +

            /* ─── Badge Pessoal inline (para links/botões) ─── */
            ".impost-pessoal-inline {" +
                "display:inline-flex;align-items:center;gap:4px;" +
                "margin-left:6px;padding:2px 8px;border-radius:12px;" +
                "background:#e3f2fd;color:#0d47a1;font-size:0.7rem;font-weight:700;" +
                "letter-spacing:0.3px;pointer-events:auto;cursor:pointer;" +
                "font-family:'Plus Jakarta Sans','Inter','DM Sans',sans-serif;" +
            "}" +
            ".impost-pessoal-inline:hover { background:#bbdefb; }" +

            /* ═══════════════════════════════════════════ */
            /* MODAL RICO DE UPSELL (por módulo)          */
            /* ═══════════════════════════════════════════ */
            "#impost-upsell-overlay {" +
                "position:fixed;inset:0;z-index:99999;" +
                "display:flex;align-items:center;justify-content:center;" +
                "padding:20px;" +
                "opacity:0;visibility:hidden;" +
                "transition:opacity 0.3s ease,visibility 0.3s ease;" +
            "}" +
            "#impost-upsell-overlay.visivel {" +
                "opacity:1;visibility:visible;" +
            "}" +
            ".impost-upsell-backdrop {" +
                "position:absolute;inset:0;" +
                "background:rgba(15,23,42,0.55);" +
                "backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);" +
            "}" +
            ".impost-upsell-modal {" +
                "position:relative;z-index:1;" +
                "background:#fff;border-radius:24px;" +
                "max-width:480px;width:100%;" +
                "padding:40px 36px 36px;" +
                "box-shadow:0 25px 80px rgba(0,0,0,0.18);" +
                "transform:scale(0.92) translateY(20px);" +
                "transition:transform 0.35s cubic-bezier(0.34,1.56,0.64,1);" +
                "max-height:90vh;overflow-y:auto;" +
                "font-family:'Plus Jakarta Sans','Inter',sans-serif;" +
            "}" +
            "#impost-upsell-overlay.visivel .impost-upsell-modal {" +
                "transform:scale(1) translateY(0);" +
            "}" +

            /* Close button */
            ".impost-upsell-close {" +
                "position:absolute;top:16px;right:16px;" +
                "width:36px;height:36px;border-radius:50%;" +
                "border:1px solid #e2e8f0;background:#fff;" +
                "display:flex;align-items:center;justify-content:center;" +
                "cursor:pointer;transition:all 0.2s;" +
                "color:#8896a6;font-size:18px;line-height:1;" +
            "}" +
            ".impost-upsell-close:hover {" +
                "background:#ffebee;border-color:#e53935;color:#c62828;" +
            "}" +

            /* Icon */
            ".impost-upsell-icon {" +
                "width:64px;height:64px;border-radius:16px;" +
                "display:flex;align-items:center;justify-content:center;" +
                "font-size:30px;margin:0 auto 20px;color:#fff;" +
                "position:relative;" +
            "}" +
            ".impost-upsell-icon::after {" +
                "content:'';position:absolute;inset:0;border-radius:16px;" +
                "background:linear-gradient(135deg,transparent 40%,rgba(255,255,255,0.18));" +
            "}" +

            /* Plan badge */
            ".impost-upsell-plan-badge {" +
                "display:inline-flex;align-items:center;gap:6px;" +
                "padding:6px 14px;border-radius:50px;" +
                "font-size:11px;font-weight:700;" +
                "letter-spacing:0.5px;text-transform:uppercase;" +
            "}" +
            ".impost-upsell-plan-badge.plan-pro {" +
                "background:linear-gradient(135deg,#fff8e1,#fff3e0);" +
                "color:#e65100;border:1px solid #ffcc80;" +
            "}" +
            ".impost-upsell-plan-badge.plan-pessoal {" +
                "background:#e3f2fd;color:#0d47a1;border:1px solid #90caf9;" +
            "}" +

            /* Textos */
            ".impost-upsell-title {" +
                "font-size:22px;font-weight:800;letter-spacing:-0.5px;" +
                "text-align:center;color:#1a2332;margin:16px 0 6px;" +
            "}" +
            ".impost-upsell-headline {" +
                "font-size:15px;color:#4a5568;text-align:center;" +
                "font-weight:500;margin-bottom:20px;line-height:1.5;" +
            "}" +
            ".impost-upsell-desc {" +
                "font-size:14px;color:#4a5568;line-height:1.7;" +
                "text-align:center;margin-bottom:24px;padding:0 8px;" +
            "}" +

            /* Benefits */
            ".impost-upsell-benefits {" +
                "list-style:none;display:flex;flex-direction:column;" +
                "gap:10px;margin-bottom:28px;padding:0 4px;" +
            "}" +
            ".impost-upsell-benefits li {" +
                "display:flex;align-items:flex-start;gap:10px;" +
                "font-size:13.5px;color:#1a2332;font-weight:500;line-height:1.5;" +
            "}" +
            ".impost-upsell-check {" +
                "flex-shrink:0;width:22px;height:22px;border-radius:50%;" +
                "display:flex;align-items:center;justify-content:center;" +
                "font-size:12px;margin-top:1px;" +
            "}" +
            ".impost-upsell-check.check-pro { background:#fff3e0;color:#e65100; }" +
            ".impost-upsell-check.check-pessoal { background:#e3f2fd;color:#0d47a1; }" +

            /* Divider */
            ".impost-upsell-divider {" +
                "height:1px;background:#e2e8f0;margin:0 -8px 24px;" +
            "}" +

            /* CTA */
            ".impost-upsell-cta {" +
                "display:flex;align-items:center;justify-content:center;gap:8px;" +
                "width:100%;padding:16px 24px;border-radius:14px;border:none;" +
                "font-family:'Plus Jakarta Sans','Inter',sans-serif;" +
                "font-size:15px;font-weight:700;color:#fff;cursor:pointer;" +
                "transition:all 0.2s;text-decoration:none;letter-spacing:-0.2px;" +
            "}" +
            ".impost-upsell-cta.cta-pro {" +
                "background:linear-gradient(135deg,#ef6c00,#fb8c00);" +
                "box-shadow:0 4px 16px rgba(239,108,0,0.35);" +
            "}" +
            ".impost-upsell-cta.cta-pro:hover {" +
                "transform:translateY(-2px);box-shadow:0 8px 24px rgba(239,108,0,0.45);" +
            "}" +
            ".impost-upsell-cta.cta-pessoal {" +
                "background:linear-gradient(135deg,#1565c0,#1e88e5);" +
                "box-shadow:0 4px 16px rgba(21,101,192,0.35);" +
            "}" +
            ".impost-upsell-cta.cta-pessoal:hover {" +
                "transform:translateY(-2px);box-shadow:0 8px 24px rgba(21,101,192,0.45);" +
            "}" +
            ".impost-upsell-cta svg { width:18px;height:18px;flex-shrink:0; }" +

            /* Price hint */
            ".impost-upsell-price-hint {" +
                "text-align:center;font-size:12px;color:#8896a6;margin-top:10px;font-weight:500;" +
            "}" +
            ".impost-upsell-price-hint strong { color:#4a5568; }" +

            /* Secondary */
            ".impost-upsell-secondary {" +
                "display:block;text-align:center;margin-top:14px;" +
                "font-size:13px;color:#8896a6;font-weight:500;cursor:pointer;" +
                "background:none;border:none;width:100%;" +
                "font-family:'Plus Jakarta Sans','Inter',sans-serif;" +
                "transition:color 0.2s;" +
            "}" +
            ".impost-upsell-secondary:hover { color:#4a5568;text-decoration:underline; }" +

            /* Responsive */
            "@media (max-width:768px) {" +
                ".impost-upsell-modal { padding:32px 24px 28px;margin:16px; }" +
                ".impost-upsell-title { font-size:20px; }" +
            "}";

        document.head.appendChild(style);
    }

    // ══════════════════════════════════════════════════════════════
    // 3. MODAL GENÉRICO DE UPGRADE (backward compatible)
    // ══════════════════════════════════════════════════════════════

    function criarModalUpgrade() {
        if (document.getElementById("impost-upgrade-overlay")) return;

        var overlay = document.createElement("div");
        overlay.id = "impost-upgrade-overlay";
        overlay.innerHTML =
            '<div class="impost-upgrade-card">' +

                /* Header */
                '<div class="impost-upgrade-header">' +
                    '<div class="impost-upgrade-icone">' +
                        '<svg width="28" height="28" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                            '<path d="M12 2L2 7l10 5 10-5-10-5z"/>' +
                            '<path d="M2 17l10 5 10-5"/>' +
                            '<path d="M2 12l10 5 10-5"/>' +
                        '</svg>' +
                    '</div>' +
                    '<h2>Recurso exclusivo</h2>' +
                    '<p>Desbloqueie todo o potencial do IMPOST.</p>' +
                '</div>' +

                /* Body */
                '<div class="impost-upgrade-body">' +
                    '<p class="impost-upgrade-msg" id="impost-upgrade-msg">' +
                        'Este recurso faz parte de um plano pago do <strong>IMPOST.</strong>' +
                    '</p>' +
                    '<ul class="impost-upgrade-features">' +
                        '<li>' +
                            '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 3L6 11l-3-3"/></svg>' +
                            'Estudos completos: Lucro Real, Presumido e Simples' +
                        '</li>' +
                        '<li>' +
                            '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 3L6 11l-3-3"/></svg>' +
                            'Estudo Pessoa F\u00EDsica com simula\u00E7\u00F5es CLT, RPA, MEI, PJ' +
                        '</li>' +
                        '<li>' +
                            '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 3L6 11l-3-3"/></svg>' +
                            'Ficha tribut\u00E1ria por estado + relat\u00F3rios em PDF' +
                        '</li>' +
                        '<li>' +
                            '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 3L6 11l-3-3"/></svg>' +
                            'Simulador da Reforma Tribut\u00E1ria' +
                        '</li>' +
                        '<li>' +
                            '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 3L6 11l-3-3"/></svg>' +
                            'Suporte priorit\u00E1rio' +
                        '</li>' +
                    '</ul>' +
                '</div>' +

                /* Footer */
                '<div class="impost-upgrade-footer">' +
                    '<button class="impost-btn-pro" id="impost-btn-assinar">' +
                        '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                            '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>' +
                        '</svg>' +
                        'Ver planos e assinar' +
                    '</button>' +
                    '<button class="impost-btn-fechar-upgrade" id="impost-btn-fechar-upgrade">' +
                        'Continuar no plano Free' +
                    '</button>' +
                '</div>' +

            '</div>';

        document.body.appendChild(overlay);

        document.getElementById("impost-btn-assinar").addEventListener("click", function () {
            window.location.href = PLANOS_URL;
        });

        document.getElementById("impost-btn-fechar-upgrade").addEventListener("click", fecharModalUpgrade);

        overlay.addEventListener("click", function (e) {
            if (e.target === overlay) fecharModalUpgrade();
        });
    }

    function mostrarModalUpgrade(mensagem) {
        injetarCSS();
        criarModalUpgrade();

        var msgEl = document.getElementById("impost-upgrade-msg");
        if (msgEl && mensagem) {
            msgEl.innerHTML =
                'O recurso <strong>\u201C' + mensagem + '\u201D</strong> faz parte de um plano pago do <strong>IMPOST.</strong>';
        } else if (msgEl && !mensagem) {
            msgEl.innerHTML = 'Este recurso faz parte de um plano pago do <strong>IMPOST.</strong>';
        }

        if (!escapeHandler) {
            escapeHandler = function (e) {
                if (e.key === "Escape") {
                    fecharModalUpgrade();
                    fecharUpsell();
                }
            };
            document.addEventListener("keydown", escapeHandler);
        }

        var overlay = document.getElementById("impost-upgrade-overlay");
        if (overlay) {
            requestAnimationFrame(function () {
                overlay.classList.add("visivel");
            });
        }
    }

    function fecharModalUpgrade() {
        var overlay = document.getElementById("impost-upgrade-overlay");
        if (overlay) {
            overlay.classList.remove("visivel");
        }

        if (escapeHandler) {
            document.removeEventListener("keydown", escapeHandler);
            escapeHandler = null;
        }
    }

    // ══════════════════════════════════════════════════════════════
    // 3B. MODAL RICO DE UPSELL (específico por módulo)
    // ══════════════════════════════════════════════════════════════

    function criarModalUpsell() {
        if (document.getElementById("impost-upsell-overlay")) return;

        var overlay = document.createElement("div");
        overlay.id = "impost-upsell-overlay";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.innerHTML =
            '<div class="impost-upsell-backdrop" id="impost-upsell-backdrop"></div>' +
            '<div class="impost-upsell-modal">' +
                '<button class="impost-upsell-close" id="impost-upsell-close" aria-label="Fechar">\u2715</button>' +

                /* Icon */
                '<div class="impost-upsell-icon" id="impost-upsell-icon"></div>' +

                /* Plan badge */
                '<div style="text-align:center">' +
                    '<span class="impost-upsell-plan-badge" id="impost-upsell-plan-badge">' +
                        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">' +
                            '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>' +
                            '<path d="M7 11V7a5 5 0 0 1 10 0v4"/>' +
                        '</svg>' +
                        '<span id="impost-upsell-plan-text"></span>' +
                    '</span>' +
                '</div>' +

                /* Textos */
                '<div class="impost-upsell-title" id="impost-upsell-title"></div>' +
                '<div class="impost-upsell-headline" id="impost-upsell-headline"></div>' +
                '<div class="impost-upsell-desc" id="impost-upsell-desc"></div>' +

                /* Benefits */
                '<ul class="impost-upsell-benefits" id="impost-upsell-benefits"></ul>' +

                /* Divider */
                '<div class="impost-upsell-divider"></div>' +

                /* CTA */
                '<a class="impost-upsell-cta" id="impost-upsell-cta" href="#">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
                        '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>' +
                    '</svg>' +
                    '<span id="impost-upsell-cta-text"></span>' +
                '</a>' +

                /* Price hint */
                '<div class="impost-upsell-price-hint" id="impost-upsell-price-hint"></div>' +

                /* Secondary */
                '<button class="impost-upsell-secondary" id="impost-upsell-secondary">Voltar ao dashboard</button>' +

            '</div>';

        document.body.appendChild(overlay);

        // Event listeners
        document.getElementById("impost-upsell-close").addEventListener("click", fecharUpsell);
        document.getElementById("impost-upsell-secondary").addEventListener("click", fecharUpsell);
        document.getElementById("impost-upsell-backdrop").addEventListener("click", fecharUpsell);
    }

    function mostrarUpsell(upsellKey) {
        var data = UPSELL_DATA[upsellKey];
        if (!data) {
            // Fallback: sem dados ricos, abre o modal genérico
            mostrarModalUpgrade(upsellKey);
            return;
        }

        injetarCSS();
        criarModalUpsell();

        var isPro = (data.plan === "pro");
        var checkClass = isPro ? "check-pro" : "check-pessoal";

        // Preencher conteúdo
        var iconEl = document.getElementById("impost-upsell-icon");
        iconEl.textContent = data.icon;
        iconEl.style.background = data.iconGradient;

        var planBadge = document.getElementById("impost-upsell-plan-badge");
        planBadge.className = "impost-upsell-plan-badge " + (isPro ? "plan-pro" : "plan-pessoal");

        document.getElementById("impost-upsell-plan-text").textContent = data.planLabel;
        document.getElementById("impost-upsell-title").textContent = data.title;
        document.getElementById("impost-upsell-headline").textContent = data.headline;
        document.getElementById("impost-upsell-desc").textContent = data.description;

        // Benefícios
        var benefitsEl = document.getElementById("impost-upsell-benefits");
        benefitsEl.innerHTML = "";
        data.benefits.forEach(function (b) {
            var li = document.createElement("li");
            li.innerHTML = '<span class="impost-upsell-check ' + checkClass + '">\u2713</span><span>' + b + '</span>';
            benefitsEl.appendChild(li);
        });

        // CTA
        var ctaEl = document.getElementById("impost-upsell-cta");
        ctaEl.className = "impost-upsell-cta " + (isPro ? "cta-pro" : "cta-pessoal");
        ctaEl.href = BASE_PATH + "pages/" + data.ctaUrl;
        document.getElementById("impost-upsell-cta-text").textContent = data.ctaText;

        // Price hint
        document.getElementById("impost-upsell-price-hint").innerHTML = data.priceHint;

        // Escape handler
        if (!escapeHandler) {
            escapeHandler = function (e) {
                if (e.key === "Escape") {
                    fecharUpsell();
                    fecharModalUpgrade();
                }
            };
            document.addEventListener("keydown", escapeHandler);
        }

        // Mostrar com animação
        var overlay = document.getElementById("impost-upsell-overlay");
        if (overlay) {
            requestAnimationFrame(function () {
                overlay.classList.add("visivel");
            });
        }
        document.body.style.overflow = "hidden";

        // Focus trap
        var closeBtn = document.getElementById("impost-upsell-close");
        if (closeBtn) closeBtn.focus();
    }

    function fecharUpsell() {
        var overlay = document.getElementById("impost-upsell-overlay");
        if (overlay) {
            overlay.classList.remove("visivel");
        }
        document.body.style.overflow = "";

        if (escapeHandler) {
            document.removeEventListener("keydown", escapeHandler);
            escapeHandler = null;
        }
    }

    // ══════════════════════════════════════════════════════════════
    // 4. BLOQUEIO AUTOMÁTICO DE ELEMENTOS [data-pro] e [data-pessoal]
    // ══════════════════════════════════════════════════════════════

    /**
     * Decide qual modal abrir: rico (se tem data-upsell-key) ou genérico.
     */
    function abrirModalParaElemento(el) {
        var upsellKey = el.getAttribute("data-upsell-key");
        if (upsellKey && UPSELL_DATA[upsellKey]) {
            mostrarUpsell(upsellKey);
        } else {
            var msg = el.getAttribute("data-pro-msg") || el.getAttribute("data-pessoal-msg") || "";
            mostrarModalUpgrade(msg);
        }
    }

    /**
     * Escaneia todos os elementos com [data-pro="true"] no DOM.
     * Se o usuário NÃO tem plano Pro:
     *   - Adiciona badge "PRO 🔒"
     *   - Clique abre modal rico (se data-upsell-key) ou genérico
     */
    function aplicarBloqueiosPro() {
        if (temAcessoPro()) return;

        injetarCSS();

        var elementos = document.querySelectorAll('[data-pro="true"]');
        for (var i = 0; i < elementos.length; i++) {
            (function (el) {
                if (el.hasAttribute("data-pro-bloqueado")) return;
                el.setAttribute("data-pro-bloqueado", "true");

                var tagName = el.tagName.toLowerCase();
                var isInline = (tagName === "a" || tagName === "button" || tagName === "span");

                var svgCadeado =
                    '<svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
                        '<rect x="2" y="5" width="6" height="5" rx="1"/>' +
                        '<path d="M3 5V3.5a2 2 0 0 1 4 0V5"/>' +
                    '</svg> PRO';

                if (isInline) {
                    var badgeInline = document.createElement("span");
                    badgeInline.className = "impost-pro-inline";
                    badgeInline.innerHTML = svgCadeado;
                    el.appendChild(badgeInline);

                    badgeInline.addEventListener("click", function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        abrirModalParaElemento(el);
                    });

                    el.addEventListener("click", function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        abrirModalParaElemento(el);
                    });
                } else {
                    var computedPos = window.getComputedStyle(el).position;
                    if (computedPos === "static") el.style.position = "relative";

                    var badge = document.createElement("div");
                    badge.className = "impost-pro-badge";
                    badge.innerHTML = svgCadeado;
                    el.appendChild(badge);

                    badge.addEventListener("click", function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        abrirModalParaElemento(el);
                    });

                    el.addEventListener("click", function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        abrirModalParaElemento(el);
                    });
                }
            })(elementos[i]);
        }

        var total = elementos.length;
        if (total > 0) {
            console.log("[User Service] " + total + " elemento(s) bloqueado(s) como Pro.");
        }
    }

    /**
     * Escaneia todos os elementos com [data-pessoal="true"] no DOM.
     * Se o usuário NÃO tem acesso Pessoal (é free):
     *   - Adiciona badge "PESSOAL 🔒"
     *   - Clique abre modal rico (se data-upsell-key) ou genérico
     */
    function aplicarBloqueiosPessoal() {
        if (temAcessoPessoal()) return;

        injetarCSS();

        var elementos = document.querySelectorAll('[data-pessoal="true"]');
        for (var i = 0; i < elementos.length; i++) {
            (function (el) {
                if (el.hasAttribute("data-pessoal-bloqueado")) return;
                el.setAttribute("data-pessoal-bloqueado", "true");

                var tagName = el.tagName.toLowerCase();
                var isInline = (tagName === "a" || tagName === "button" || tagName === "span");

                var svgCadeado =
                    '<svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
                        '<rect x="2" y="5" width="6" height="5" rx="1"/>' +
                        '<path d="M3 5V3.5a2 2 0 0 1 4 0V5"/>' +
                    '</svg> PESSOAL';

                if (isInline) {
                    var badgeInline = document.createElement("span");
                    badgeInline.className = "impost-pessoal-inline";
                    badgeInline.innerHTML = svgCadeado;
                    el.appendChild(badgeInline);

                    badgeInline.addEventListener("click", function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        abrirModalParaElemento(el);
                    });

                    el.addEventListener("click", function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        abrirModalParaElemento(el);
                    });
                } else {
                    var computedPos = window.getComputedStyle(el).position;
                    if (computedPos === "static") el.style.position = "relative";

                    var badge = document.createElement("div");
                    badge.className = "impost-pessoal-badge";
                    badge.innerHTML = svgCadeado;
                    el.appendChild(badge);

                    badge.addEventListener("click", function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        abrirModalParaElemento(el);
                    });

                    el.addEventListener("click", function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        abrirModalParaElemento(el);
                    });
                }
            })(elementos[i]);
        }

        var total = elementos.length;
        if (total > 0) {
            console.log("[User Service] " + total + " elemento(s) bloqueado(s) como Pessoal.");
        }
    }

    // ══════════════════════════════════════════════════════════════
    // 5. API PÚBLICA
    // ══════════════════════════════════════════════════════════════

    window.IMPOST_PLANO = {
        // Verificações de acesso
        temAcessoPro: temAcessoPro,
        temAcessoPessoal: temAcessoPessoal,

        // Verificar ou mostrar upgrade
        verificarAcessoOuUpgrade: verificarAcessoOuUpgrade,
        verificarPessoalOuUpgrade: verificarPessoalOuUpgrade,

        // Modal genérico
        mostrarModalUpgrade: mostrarModalUpgrade,
        fecharModalUpgrade: fecharModalUpgrade,

        // Modal rico (upsell por módulo)
        mostrarUpsell: mostrarUpsell,
        fecharUpsell: fecharUpsell,

        // Dados do usuário
        getPlano: getPlano,
        getNomeUsuario: getNomeUsuario,
        getLimitePDF: getLimitePDF,

        // Bloqueios no DOM
        aplicarBloqueiosPro: aplicarBloqueiosPro,
        aplicarBloqueiosPessoal: aplicarBloqueiosPessoal
    };

    // ══════════════════════════════════════════════════════════════
    // 6. AUTO-APLICAR BLOQUEIOS QUANDO USUÁRIO ESTIVER PRONTO
    // ══════════════════════════════════════════════════════════════

    document.addEventListener("impost-user-ready", function () {
        aplicarBloqueiosPro();
        aplicarBloqueiosPessoal();
    });

    console.log("[User Service] Inicializado (v4 \u2014 upsell por m\u00F3dulo). Aguardando impost-user-ready...");

})();
