// ═══════════════════════════════════════════════════════════════════════
// IMPOST. — User Service (v3 — 4 planos + controle PDF)
// Arquivo: scripts/user-service.js
// Depende de: auth-guard.js (carregado antes)
// ═══════════════════════════════════════════════════════════════════════
//
// Funções disponíveis globalmente via IMPOST_PLANO:
//
//   IMPOST_PLANO.temAcessoPro()
//     → boolean — true se plano é "pf", "pro", "escritorio" ou "trial" válido
//
//   IMPOST_PLANO.temAcessoPDF()
//     → boolean — true se plano é "pro", "escritorio" ou "trial" válido
//
//   IMPOST_PLANO.verificarAcessoOuUpgrade(mensagem?)
//     → boolean — retorna true se tem acesso Pro, ou mostra modal upgrade
//
//   IMPOST_PLANO.verificarPDFOuUpgrade(mensagem?)
//     → boolean — retorna true se tem acesso PDF, ou mostra modal upgrade
//
//   IMPOST_PLANO.mostrarModalUpgrade(mensagem?)
//     → void — abre modal de upgrade com CTA para planos.html
//
//   IMPOST_PLANO.fecharModalUpgrade()
//     → void — fecha o modal de upgrade
//
//   IMPOST_PLANO.getPlano()
//     → string — "free" | "pf" | "pro" | "escritorio" | "trial"
//
//   IMPOST_PLANO.getNomeUsuario()
//     → string — nome do usuário ou e-mail como fallback
//
//   IMPOST_PLANO.aplicarBloqueiosPro()
//     → void — escaneia [data-pro] no DOM e aplica cadeados
//
// HIERARQUIA DE PLANOS:
//   free       → Bloqueado em estudos/calculadoras e PDF
//   pf         → Liberado em estudos/calculadoras, Bloqueado em PDF
//   pro        → Tudo liberado
//   escritorio → Tudo liberado
//   trial      → Tudo liberado (temporário, 7 dias)
//
// USO NO HTML para bloquear elementos Pro (estudos/calculadoras):
//   <button data-pro="true" data-pro-msg="Comparador detalhado">
//       Comparar regimes
//   </button>
//
//   <a href="lucro-real-estudos.html" data-pro="true">
//       Estudo de Lucro Real 🔒
//   </a>
//
// USO FUTURO para bloquear elementos PDF:
//   <button data-pdf="true" data-pro-msg="Relatório em PDF">
//       Gerar PDF
//   </button>
// ═══════════════════════════════════════════════════════════════════════

(function () {
    "use strict";

    // ══════════════════════════════════════════════════════════════
    // CONFIGURAÇÃO
    // ══════════════════════════════════════════════════════════════

    // CORREÇÃO: usar path absoluto para funcionar em qualquer profundidade
    var BASE_PATH = (function () {
        var path = window.location.pathname;
        var match = path.match(/^(\/impost\/)/);
        return match ? match[1] : "/";
    })();

    var PLANOS_URL = BASE_PATH + "pages/planos.html";
    var CSS_INJETADO = false;

    // CORREÇÃO: referência ao handler de Escape para poder removê-lo
    var escapeHandler = null;

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
        return dados.nome || (window.IMPOST_USER && window.IMPOST_USER.email) || "Usuário";
    }

    /**
     * Verifica se o trial ainda está ativo (não expirou).
     * Reutilizado por temAcessoPro() e temAcessoPDF().
     */
    function trialValido(dados) {
        if (!dados.planoExpira) return true; // trial sem data = ativo

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

    /**
     * Verifica se o usuário tem acesso Pro ativo (estudos e calculadoras).
     * - plano "pf"         → true
     * - plano "pro"        → true
     * - plano "escritorio"  → true
     * - plano "trial"      → true se não expirou
     * - plano "free"       → false
     */
    function temAcessoPro() {
        var dados = getDadosUsuario();
        var plano = dados.plano || "free";

        if (plano === "pf") return true;
        if (plano === "pro") return true;
        if (plano === "escritorio") return true;

        if (plano === "trial") {
            return trialValido(dados);
        }

        return false;
    }

    /**
     * Verifica se o usuário tem acesso a relatórios em PDF.
     * Mais restritivo que temAcessoPro() — plano "pf" NÃO tem PDF.
     * - plano "pro"        → true
     * - plano "escritorio"  → true
     * - plano "trial"      → true se não expirou
     * - plano "pf"         → false
     * - plano "free"       → false
     */
    function temAcessoPDF() {
        var dados = getDadosUsuario();
        var plano = dados.plano || "free";

        if (plano === "pro") return true;
        if (plano === "escritorio") return true;

        if (plano === "trial") {
            return trialValido(dados);
        }

        return false;
    }

    /**
     * Verifica acesso Pro. Se não tiver, mostra o modal de upgrade.
     * Retorna true se tem acesso, false se bloqueou.
     */
    function verificarAcessoOuUpgrade(mensagem) {
        if (temAcessoPro()) return true;
        mostrarModalUpgrade(mensagem);
        return false;
    }

    /**
     * Verifica acesso a PDF. Se não tiver, mostra o modal de upgrade.
     * Retorna true se tem acesso, false se bloqueou.
     */
    function verificarPDFOuUpgrade(mensagem) {
        if (temAcessoPDF()) return true;
        var msg = mensagem || "Relatórios em PDF estão disponíveis a partir do plano Pro";
        mostrarModalUpgrade(msg);
        return false;
    }

    // ══════════════════════════════════════════════════════════════
    // 2. CSS DO MODAL + CADEADOS
    // ══════════════════════════════════════════════════════════════

    function injetarCSS() {
        if (CSS_INJETADO) return;
        CSS_INJETADO = true;

        var style = document.createElement("style");
        style.id = "impost-user-service-style";
        style.textContent =
            /* ─── Modal Overlay ─── */
            "#impost-upgrade-overlay {" +
                "position:fixed;inset:0;z-index:99998;" +
                "background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);" +
                "display:flex;align-items:center;justify-content:center;" +
                "opacity:0;pointer-events:none;transition:opacity 0.3s ease;" +
            "}" +
            "#impost-upgrade-overlay.visivel { opacity:1;pointer-events:auto; }" +

            /* ─── Modal Card ─── */
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
                "font-family:'Poppins','DM Sans',sans-serif;" +
                "font-size:1.3rem;font-weight:700;color:#fff;margin:0 0 6px;" +
            "}" +
            ".impost-upgrade-header p {" +
                "font-size:0.88rem;color:rgba(255,255,255,0.8);margin:0;" +
                "font-family:'Inter','DM Sans',sans-serif;" +
            "}" +

            /* ─── Body ─── */
            ".impost-upgrade-body {" +
                "padding:20px 28px 8px;font-family:'Inter','DM Sans',sans-serif;" +
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
                "font-family:'Inter','DM Sans',sans-serif;" +
                "transition:transform 0.2s,box-shadow 0.2s;" +
                "box-shadow:0 4px 14px rgba(27,94,32,0.3);" +
            "}" +
            ".impost-btn-pro:hover {" +
                "transform:translateY(-2px);box-shadow:0 6px 20px rgba(27,94,32,0.4);" +
            "}" +
            ".impost-btn-fechar-upgrade {" +
                "display:inline-block;margin-top:12px;padding:8px 16px;" +
                "background:none;border:none;color:#888;font-size:0.84rem;" +
                "cursor:pointer;font-family:'Inter','DM Sans',sans-serif;" +
                "transition:color 0.2s;" +
            "}" +
            ".impost-btn-fechar-upgrade:hover { color:#555; }" +

            /* ─── Badge Pro (cadeado nos elementos) ─── */
            "[data-pro-bloqueado] {" +
                "position:relative;pointer-events:none;opacity:0.55;" +
                "filter:grayscale(30%);user-select:none;" +
            "}" +
            ".impost-pro-badge {" +
                "position:absolute;top:8px;right:8px;z-index:10;" +
                "display:inline-flex;align-items:center;gap:4px;" +
                "padding:4px 10px;border-radius:20px;" +
                "background:linear-gradient(135deg,#1b5e20,#388e3c);" +
                "color:#fff;font-size:0.7rem;font-weight:700;letter-spacing:0.5px;" +
                "font-family:'Inter','DM Sans',sans-serif;" +
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
                "font-family:'Inter','DM Sans',sans-serif;" +
            "}" +
            ".impost-pro-inline:hover { background:#c8e6c9; }";

        document.head.appendChild(style);
    }

    // ══════════════════════════════════════════════════════════════
    // 3. MODAL DE UPGRADE
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
                    '<h2>Recurso exclusivo Pro</h2>' +
                    '<p>Desbloqueie todo o potencial do IMPOST.</p>' +
                '</div>' +

                /* Body */
                '<div class="impost-upgrade-body">' +
                    '<p class="impost-upgrade-msg" id="impost-upgrade-msg">' +
                        'Este recurso faz parte do plano <strong>IMPOST. Pro</strong>.' +
                    '</p>' +
                    '<ul class="impost-upgrade-features">' +
                        '<li>' +
                            '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 3L6 11l-3-3"/></svg>' +
                            'Estudos completos: Lucro Real, Presumido e Simples' +
                        '</li>' +
                        '<li>' +
                            '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 3L6 11l-3-3"/></svg>' +
                            'Comparador detalhado com break-even' +
                        '</li>' +
                        '<li>' +
                            '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 3L6 11l-3-3"/></svg>' +
                            'Ficha tributária por estado + relatórios em PDF' +
                        '</li>' +
                        '<li>' +
                            '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 3L6 11l-3-3"/></svg>' +
                            'Simulador da Reforma Tributária' +
                        '</li>' +
                        '<li>' +
                            '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 3L6 11l-3-3"/></svg>' +
                            'Suporte prioritário' +
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

        // Event listeners
        document.getElementById("impost-btn-assinar").addEventListener("click", function () {
            window.location.href = PLANOS_URL;
        });

        document.getElementById("impost-btn-fechar-upgrade").addEventListener("click", fecharModalUpgrade);

        // Fechar clicando fora
        overlay.addEventListener("click", function (e) {
            if (e.target === overlay) fecharModalUpgrade();
        });
    }

    function mostrarModalUpgrade(mensagem) {
        injetarCSS();
        criarModalUpgrade();

        // Mensagem personalizada
        var msgEl = document.getElementById("impost-upgrade-msg");
        if (msgEl && mensagem) {
            msgEl.innerHTML =
                'O recurso <strong>"' + mensagem + '"</strong> faz parte do plano <strong>IMPOST. Pro</strong>.';
        } else if (msgEl && !mensagem) {
            // CORREÇÃO: resetar mensagem padrão se não passou mensagem
            // (evita mensagem antiga persistir de chamada anterior)
            msgEl.innerHTML = 'Este recurso faz parte do plano <strong>IMPOST. Pro</strong>.';
        }

        // CORREÇÃO: adicionar listener de Escape apenas ao abrir,
        // e guardar referência para remover ao fechar
        if (!escapeHandler) {
            escapeHandler = function (e) {
                if (e.key === "Escape") {
                    fecharModalUpgrade();
                }
            };
            document.addEventListener("keydown", escapeHandler);
        }

        // Abre com animação
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

        // CORREÇÃO: remover listener de Escape ao fechar
        if (escapeHandler) {
            document.removeEventListener("keydown", escapeHandler);
            escapeHandler = null;
        }
    }

    // ══════════════════════════════════════════════════════════════
    // 4. BLOQUEIO AUTOMÁTICO DE ELEMENTOS [data-pro]
    // ══════════════════════════════════════════════════════════════

    /**
     * Escaneia todos os elementos com [data-pro="true"] no DOM.
     * Se o usuário NÃO tem plano Pro:
     *   - Bloqueia o elemento (pointer-events: none, opacidade)
     *   - Adiciona badge "PRO 🔒"
     *   - Clique no badge abre modal de upgrade
     */
    function aplicarBloqueiosPro() {
        if (temAcessoPro()) return; // Nada a fazer

        injetarCSS();

        var elementos = document.querySelectorAll('[data-pro="true"]');
        for (var i = 0; i < elementos.length; i++) {
            (function (el) {
                // Evita aplicar duas vezes
                if (el.hasAttribute("data-pro-bloqueado")) return;
                el.setAttribute("data-pro-bloqueado", "true");

                var tagName = el.tagName.toLowerCase();
                var isInline = (tagName === "a" || tagName === "button" || tagName === "span");
                var msgFeature = el.getAttribute("data-pro-msg") || "";

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
                        mostrarModalUpgrade(msgFeature);
                    });

                    el.addEventListener("click", function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        mostrarModalUpgrade(msgFeature);
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
                        mostrarModalUpgrade(msgFeature);
                    });

                    el.addEventListener("click", function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        mostrarModalUpgrade(msgFeature);
                    });
                }
            })(elementos[i]);
        }

        var total = elementos.length;
        if (total > 0) {
            console.log("[User Service] " + total + " elemento(s) bloqueado(s) como Pro.");
        }
    }

    // ══════════════════════════════════════════════════════════════
    // 5. API PÚBLICA
    // ══════════════════════════════════════════════════════════════

    window.IMPOST_PLANO = {
        temAcessoPro: temAcessoPro,
        temAcessoPDF: temAcessoPDF,
        verificarAcessoOuUpgrade: verificarAcessoOuUpgrade,
        verificarPDFOuUpgrade: verificarPDFOuUpgrade,
        mostrarModalUpgrade: mostrarModalUpgrade,
        fecharModalUpgrade: fecharModalUpgrade,
        getPlano: getPlano,
        getNomeUsuario: getNomeUsuario,
        aplicarBloqueiosPro: aplicarBloqueiosPro
    };

    // ══════════════════════════════════════════════════════════════
    // 6. AUTO-APLICAR BLOQUEIOS QUANDO USUÁRIO ESTIVER PRONTO
    // ══════════════════════════════════════════════════════════════

    document.addEventListener("impost-user-ready", function () {
        aplicarBloqueiosPro();
    });

    console.log("[User Service] v3 inicializado. Aguardando impost-user-ready...");

})();
