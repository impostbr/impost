// ═══════════════════════════════════════════════════════════════════════
// IMPOST. — Auth Guard
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
    var LOGIN_URL = "login.html";
    var TIMEOUT_MS = 8000;             // Timeout para carregamento do auth
    var MAX_RETRIES_FIRESTORE = 2;     // Tentativas de leitura no Firestore

    // ══════════════════════════════════════════════════════════════
    // ESTADO GLOBAL
    // ══════════════════════════════════════════════════════════════
    window.IMPOST_USER = null;
    window.IMPOST_USER_DATA = null;

    var auth = IMPOST_AUTH;
    var db = firebase.firestore();
    var guardResolvido = false;

    // ══════════════════════════════════════════════════════════════
    // 1. OVERLAY DE CARREGAMENTO
    // ══════════════════════════════════════════════════════════════
    function criarOverlayCarregamento() {
        // Verifica se já existe
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

        // CSS inline para não depender de arquivo externo
        var style = document.createElement("style");
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
        }, 450);
    }

    // ══════════════════════════════════════════════════════════════
    // 2. REDIRECIONAR PARA LOGIN
    // ══════════════════════════════════════════════════════════════
    function redirecionarParaLogin() {
        // Salva a URL atual para redirect após login (opcional futuro)
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
                    return docSnap.data();
                }
                // Documento não existe (login Google antigo sem cadastro.js)
                // Cria documento mínimo para não quebrar
                console.warn("[Auth Guard] Documento do usuário não encontrado. Criando perfil mínimo.");
                var user = auth.currentUser;
                var dadosMinimos = {
                    nome: (user && user.displayName) || "",
                    email: (user && user.email) || "",
                    telefone: "",
                    plano: "free",
                    planoExpira: null,
                    assinatura: {
                        status: "inactive",
                        gateway: "",
                        gatewayId: "",
                        inicioEm: null,
                        proximaCobranca: null,
                        valor: 0
                    },
                    termosAceite: { aceito: false },
                    criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
                    ultimoLogin: firebase.firestore.FieldValue.serverTimestamp(),
                    provider: (user && user.providerData && user.providerData[0])
                        ? user.providerData[0].providerId.replace(".com", "")
                        : "unknown",
                    emailVerificado: (user && user.emailVerified) || false,
                    totalCalculos: 0,
                    ultimoCalculo: null
                };
                return db.collection("users").doc(uid).set(dadosMinimos)
                    .then(function () { return dadosMinimos; });
            })
            .catch(function (err) {
                console.error("[Auth Guard] Erro ao carregar Firestore (tentativa " + tentativa + "):", err);
                if (tentativa < MAX_RETRIES_FIRESTORE) {
                    return new Promise(function (resolve) {
                        setTimeout(function () {
                            resolve(carregarDadosUsuario(uid, tentativa + 1));
                        }, 1000 * tentativa);
                    });
                }
                // Retorna dados mínimos offline para não bloquear a página
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
        db.collection("users").doc(uid).update({
            ultimoLogin: firebase.firestore.FieldValue.serverTimestamp()
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
        document.dispatchEvent(evento);
        console.log("[Auth Guard] Usuário pronto:", dados.nome || user.email, "| Plano:", dados.plano || "free");
    }

    // ══════════════════════════════════════════════════════════════
    // 6. GUARD PRINCIPAL
    // ══════════════════════════════════════════════════════════════
    function iniciarGuard() {
        criarOverlayCarregamento();

        // Timeout de segurança — se o auth demorar demais
        var timeout = setTimeout(function () {
            if (!guardResolvido) {
                console.error("[Auth Guard] Timeout — redirecionando para login.");
                redirecionarParaLogin();
            }
        }, TIMEOUT_MS);

        auth.onAuthStateChanged(function (user) {
            // Evita executar mais de uma vez
            if (guardResolvido) return;
            guardResolvido = true;
            clearTimeout(timeout);

            // ─── Não logado → redireciona ───
            if (!user) {
                redirecionarParaLogin();
                return;
            }

            // ─── Logado → carrega dados ───
            carregarDadosUsuario(user.uid)
                .then(function (dados) {
                    // Disponibiliza globalmente
                    window.IMPOST_USER = user;
                    window.IMPOST_USER_DATA = dados;

                    // Atualiza último login (fire and forget)
                    atualizarUltimoLogin(user.uid);

                    // Dispara evento para a página
                    dispararEventoReady(user, dados);

                    // Remove overlay de carregamento
                    removerOverlay();
                })
                .catch(function (err) {
                    console.error("[Auth Guard] Erro fatal:", err);
                    // Mesmo com erro, deixa acessar com dados mínimos
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
        var user = auth.currentUser;
        if (!user) return Promise.reject(new Error("Usuário não logado"));
        return user.getIdToken();
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
