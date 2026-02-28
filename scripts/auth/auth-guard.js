// ═══════════════════════════════════════════════════════════════════════
// IMPOST. — Auth Guard (v2 — corrigido)
// Arquivo: scripts/auth-guard.js
// Depende de: firebase-app-compat, firebase-auth-compat,
//             firebase-firestore-compat, firebase-config.js
// ═══════════════════════════════════════════════════════════════════════
//
// Protege páginas que exigem login.
// - Redireciona para login.html se não logado
// - Carrega dados do Firestore (plano, nome, etc.)
// - Disponibiliza IMPOST_USER e IMPOST_USER_DATA globalmente
// - Dispara evento customizado 'impost-user-ready'
//
// USO: Adicionar nas páginas protegidas DEPOIS de firebase-config.js:
//   <script src="../scripts/auth-guard.js"></script>
//
// Escutar quando o usuário estiver pronto:
//   document.addEventListener('impost-user-ready', function(e) {
//       var user = e.detail.user;       // Firebase Auth user
//       var dados = e.detail.dados;     // Documento Firestore
//   });
//
// Ou acessar diretamente (após o evento):
//   window.IMPOST_USER       → Firebase Auth user
//   window.IMPOST_USER_DATA  → { nome, email, plano, planoExpira, ... }
// ═══════════════════════════════════════════════════════════════════════

(function () {
    "use strict";

    // ══════════════════════════════════════════════════════════════
    // CONFIGURAÇÃO
    // ══════════════════════════════════════════════════════════════

    // Detecta automaticamente o base path do projeto
    // Funciona tanto em /pages/dashboard.html quanto em /index.html
    var BASE_PATH = (function () {
        var path = window.location.pathname;
        var match = path.match(/^(\/impost\/)/);
        return match ? match[1] : "/";
    })();

    var LOGIN_URL = BASE_PATH + "pages/login.html";
    var TIMEOUT_MS = 8000;
    var MAX_RETRIES_FIRESTORE = 2;

    // ══════════════════════════════════════════════════════════════
    // ESTADO GLOBAL
    // ══════════════════════════════════════════════════════════════
    window.IMPOST_USER = null;
    window.IMPOST_USER_DATA = null;

    // CORREÇÃO: NÃO inicializar auth e db aqui no topo da IIFE.
    // Se firebase-config.js atrasar, dá ReferenceError e quebra tudo.
    // Inicializamos dentro de iniciarGuard() após verificar dependências.
    var auth = null;
    var db = null;
    var guardResolvido = false;

    // ══════════════════════════════════════════════════════════════
    // 1. OVERLAY DE CARREGAMENTO
    // ══════════════════════════════════════════════════════════════
    function criarOverlayCarregamento() {
        if (document.getElementById("impost-auth-overlay")) return;

        var overlay = document.createElement("div");
        overlay.id = "impost-auth-overlay";
        overlay.innerHTML =
            '<div class="impost-auth-spinner">' +
                '<div class="impost-auth-logo">IMPOST<span>.</span></div>' +
                '<div class="impost-auth-dots">' +
                    '<span></span><span></span><span></span>' +
                '</div>' +
                '<p class="impost-auth-msg">Verificando acesso...</p>' +
            '</div>';

        var style = document.createElement("style");
        style.id = "impost-auth-overlay-style";
        style.textContent =
            "#impost-auth-overlay {" +
                "position:fixed;inset:0;z-index:99999;" +
                "background:#ffffff;" +
                "display:flex;align-items:center;justify-content:center;" +
                "transition:opacity 0.4s ease;" +
            "}" +
            "#impost-auth-overlay.saindo { opacity:0; pointer-events:none; }" +
            ".impost-auth-spinner { text-align:center; }" +
            ".impost-auth-logo {" +
                "font-family:'JetBrains Mono','Poppins',monospace;" +
                "font-weight:700;font-size:2rem;color:#1b5e20;margin-bottom:16px;" +
            "}" +
            ".impost-auth-logo span { color:#66bb6a; }" +
            ".impost-auth-dots { display:flex;gap:6px;justify-content:center;margin-bottom:12px; }" +
            ".impost-auth-dots span {" +
                "width:8px;height:8px;border-radius:50%;background:#43a047;" +
                "animation:impostPulse 1.2s ease-in-out infinite;" +
            "}" +
            ".impost-auth-dots span:nth-child(2) { animation-delay:0.2s; }" +
            ".impost-auth-dots span:nth-child(3) { animation-delay:0.4s; }" +
            "@keyframes impostPulse {" +
                "0%,80%,100%{opacity:0.3;transform:scale(0.8)}" +
                "40%{opacity:1;transform:scale(1.2)}" +
            "}" +
            ".impost-auth-msg {" +
                "font-family:'Inter','DM Sans',sans-serif;" +
                "font-size:0.88rem;color:#6b7e6b;" +
            "}";

        document.head.appendChild(style);
        document.body.appendChild(overlay);
    }

    function removerOverlay() {
        var overlay = document.getElementById("impost-auth-overlay");
        if (!overlay) return;
        overlay.classList.add("saindo");
        setTimeout(function () {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            var style = document.getElementById("impost-auth-overlay-style");
            if (style && style.parentNode) style.parentNode.removeChild(style);
        }, 450);
    }

    // ══════════════════════════════════════════════════════════════
    // 2. REDIRECIONAR PARA LOGIN
    // ══════════════════════════════════════════════════════════════
    function redirecionarParaLogin() {
        try {
            sessionStorage.setItem("impost_redirect", window.location.href);
        } catch (e) { /* sessionStorage indisponível */ }

        window.location.href = LOGIN_URL;
    }

    // ══════════════════════════════════════════════════════════════
    // 3. CARREGAR DADOS DO FIRESTORE
    // ══════════════════════════════════════════════════════════════
    function carregarDadosUsuario(uid, tentativa) {
        tentativa = tentativa || 1;

        return db.collection("users").doc(uid).get()
            .then(function (docSnap) {
                if (docSnap.exists) {
                    var dados = docSnap.data();

                    // Verificar se aceite de termos é válido
                    if (!dados.termosAceite || dados.termosAceite.aceito !== true) {
                        console.warn("[Auth Guard] Usuário sem aceite de termos válido. Redirecionando para cadastro.");
                        window.location.href = BASE_PATH + "pages/cadastro.html?email=" + encodeURIComponent(auth.currentUser.email || "");
                        // Retorna promise que nunca resolve (página vai redirecionar)
                        return new Promise(function () {});
                    }

                    return dados;
                }

                // Documento NÃO existe → redirecionar para cadastro
                console.warn("[Auth Guard] Documento não encontrado. Redirecionando para cadastro.");
                window.location.href = BASE_PATH + "pages/cadastro.html?email=" + encodeURIComponent(auth.currentUser.email || "");
                return new Promise(function () {});
            })
            .catch(function (err) {
                console.error("[Auth Guard] Erro Firestore (tentativa " + tentativa + "):", err);
                if (tentativa < MAX_RETRIES_FIRESTORE) {
                    return new Promise(function (resolve) {
                        setTimeout(function () {
                            resolve(carregarDadosUsuario(uid, tentativa + 1));
                        }, 1000 * tentativa);
                    });
                }
                // Após todas as tentativas falharem, usa dados mínimos offline
                console.warn("[Auth Guard] Usando dados mínimos (offline).");
                return {
                    nome: (auth.currentUser && auth.currentUser.displayName) || "",
                    email: (auth.currentUser && auth.currentUser.email) || "",
                    plano: "free",
                    planoExpira: null,
                    _offline: true
                };
            });
    }

    // ══════════════════════════════════════════════════════════════
    // 4. ATUALIZAR ÚLTIMO LOGIN
    // ══════════════════════════════════════════════════════════════
    function atualizarUltimoLogin(uid) {
        // Evitar múltiplos writes por sessão
        var chave = "impost_login_atualizado_" + uid;
        try {
            if (sessionStorage.getItem(chave)) {
                console.log("[Auth Guard] ultimoLogin já atualizado nesta sessão.");
                return;
            }
        } catch (e) { /* sessionStorage indisponível, prossegue */ }

        var user = auth.currentUser;
        db.collection("users").doc(uid).update({
            ultimoLogin: firebase.firestore.FieldValue.serverTimestamp(),
            emailVerificado: (user && user.emailVerified) || false
        }).then(function () {
            try { sessionStorage.setItem(chave, "1"); } catch (e) { }
        }).catch(function (err) {
            console.warn("[Auth Guard] Erro ao atualizar ultimoLogin:", err);
        });
    }

    // ══════════════════════════════════════════════════════════════
    // 5. DISPARAR EVENTO 'impost-user-ready'
    // ══════════════════════════════════════════════════════════════
    function dispararEventoReady(user, dados) {
        var evento = new CustomEvent("impost-user-ready", {
            detail: { user: user, dados: dados }
        });
        // CORREÇÃO: dispara em ambos para compatibilidade
        // (user-service.js escuta em document)
        document.dispatchEvent(evento);
        window.dispatchEvent(evento);
        console.log("[Auth Guard] Usuário pronto:", dados.nome || user.email, "| Plano:", dados.plano || "free");
    }

    // ══════════════════════════════════════════════════════════════
    // 6. GUARD PRINCIPAL
    // ══════════════════════════════════════════════════════════════
    function iniciarGuard() {
        // CORREÇÃO: verificar dependências AQUI, não no topo da IIFE
        if (typeof IMPOST_AUTH === "undefined") {
            console.error("[Auth Guard] IMPOST_AUTH não encontrado. Verifique se firebase-config.js carregou antes.");
            return;
        }
        if (typeof firebase === "undefined" || typeof firebase.firestore !== "function") {
            console.error("[Auth Guard] Firebase Firestore SDK não encontrado.");
            return;
        }

        // CORREÇÃO: inicializar AGORA que temos certeza das dependências
        auth = IMPOST_AUTH;
        db = IMPOST_DB;

        criarOverlayCarregamento();

        var timeout = setTimeout(function () {
            if (!guardResolvido) {
                console.error("[Auth Guard] Timeout — redirecionando para login.");
                redirecionarParaLogin();
            }
        }, TIMEOUT_MS);

        auth.onAuthStateChanged(function (user) {
            if (guardResolvido) return;
            guardResolvido = true;
            clearTimeout(timeout);

            if (!user) {
                redirecionarParaLogin();
                return;
            }

            carregarDadosUsuario(user.uid)
                .then(function (dados) {
                    window.IMPOST_USER = user;
                    window.IMPOST_USER_DATA = dados;
                    atualizarUltimoLogin(user.uid);
                    dispararEventoReady(user, dados);
                    removerOverlay();
                })
                .catch(function (err) {
                    console.error("[Auth Guard] Erro fatal:", err);
                    window.IMPOST_USER = user;
                    window.IMPOST_USER_DATA = { plano: "free", nome: user.displayName || "", email: user.email || "" };
                    dispararEventoReady(user, window.IMPOST_USER_DATA);
                    removerOverlay();
                });
        });
    }

    // ══════════════════════════════════════════════════════════════
    // 7. UTILITÁRIOS PÚBLICOS
    // ══════════════════════════════════════════════════════════════

    /**
     * Faz logout e redireciona para login
     */
    window.IMPOST_LOGOUT = function () {
        if (!auth) {
            window.location.href = LOGIN_URL;
            return;
        }
        auth.signOut().then(function () {
            window.IMPOST_USER = null;
            window.IMPOST_USER_DATA = null;
            try { sessionStorage.removeItem("impost_redirect"); } catch (e) { }
            window.location.href = LOGIN_URL;
        }).catch(function (err) {
            console.error("[Auth Guard] Erro no logout:", err);
            window.location.href = LOGIN_URL;
        });
    };

    /**
     * Retorna o token JWT do usuário logado (para enviar nas Cloud Functions)
     * Uso: var token = await IMPOST_GET_TOKEN();
     *      headers: { "Authorization": "Bearer " + token }
     */
    window.IMPOST_GET_TOKEN = function () {
        if (!auth || !auth.currentUser) return Promise.reject(new Error("Usuário não logado"));
        return auth.currentUser.getIdToken();
    };

    // ══════════════════════════════════════════════════════════════
    // 8. INIT
    // ══════════════════════════════════════════════════════════════
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciarGuard);
    } else {
        iniciarGuard();
    }

})();
