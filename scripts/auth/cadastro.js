/**
 * ═══════════════════════════════════════════════════════════════════════
 * cadastro.js — Controller: Cadastro + Aceite de Termos (sem obrigar leitura)
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * O checkbox está habilitado desde o início.
 * Ao marcar, aparece mensagem de "assinatura digital" com data/hora.
 * No Firestore salva: versão dos termos, IP, user-agent, timestamp.
 * O modal é opcional — abre pra quem quiser ler.
 */

(function () {
    "use strict";

    // ══════════════════════════════════════════════════════════════
    // CONSTANTES
    // ══════════════════════════════════════════════════════════════
    var TERMOS_VERSAO = "2026.02.v1";
    var PRIVACIDADE_VERSAO = "2026.02.v1";

    // ══════════════════════════════════════════════════════════════
    // DOM
    // ══════════════════════════════════════════════════════════════
    var form = document.getElementById("form-cadastro");
    var btnCadastrar = document.getElementById("btn-cadastrar");
    var btnGoogle = document.getElementById("btn-google");

    var inputNome = document.getElementById("nome");
    var inputEmail = document.getElementById("email");
    var inputSenha = document.getElementById("senha");
    var inputConfirmarSenha = document.getElementById("confirmar-senha");
    var inputTermos = document.getElementById("termos");
    var termosAssinatura = document.getElementById("termos-assinatura");

    var alertaErro = document.getElementById("alerta-erro");
    var alertaErroMsg = document.getElementById("alerta-erro-msg");
    var alertaSucesso = document.getElementById("alerta-sucesso");

    var senhaForca = document.getElementById("senha-forca");
    var senhaForcaTexto = document.getElementById("senha-forca-texto");

    // Modal
    var modalOverlay = document.getElementById("modal-termos-overlay");
    var modalBody = document.getElementById("modal-body");

    var processando = false;
    var ipUsuario = null;
    var momentoAceite = null;

    // ══════════════════════════════════════════════════════════════
    // 1. CAPTURAR IP
    // ══════════════════════════════════════════════════════════════
    function capturarIP() {
        fetch("https://api.ipify.org?format=json")
            .then(function (r) { return r.json(); })
            .then(function (data) { ipUsuario = data.ip || null; })
            .catch(function () { ipUsuario = "indisponível"; });
    }

    // ══════════════════════════════════════════════════════════════
    // 2. CHECKBOX DE TERMOS — Mensagem de assinatura
    // ══════════════════════════════════════════════════════════════
    inputTermos.addEventListener("change", function () {
        if (inputTermos.checked) {
            momentoAceite = new Date();
            var dataFormatada = momentoAceite.toLocaleString("pt-BR");
            termosAssinatura.textContent = "✅ Aceite registrado em " + dataFormatada + ". Este aceite será salvo junto ao seu cadastro.";
            termosAssinatura.classList.add("visivel");
        } else {
            momentoAceite = null;
            termosAssinatura.classList.remove("visivel");
        }
        esconderAlerta();
    });

    // ══════════════════════════════════════════════════════════════
    // 3. MODAL — Abrir / Fechar / Abas
    // ══════════════════════════════════════════════════════════════
    function abrirModal(tab) {
        modalOverlay.classList.add("visivel");
        document.body.style.overflow = "hidden";
        if (tab) trocarTab(tab);
        modalBody.scrollTop = 0;
    }

    function fecharModal() {
        modalOverlay.classList.remove("visivel");
        document.body.style.overflow = "";
    }

    function trocarTab(tabId) {
        document.querySelectorAll(".modal-tab").forEach(function (t) {
            t.classList.toggle("ativa", t.getAttribute("data-tab") === tabId);
        });
        document.querySelectorAll(".tab-content").forEach(function (c) {
            c.classList.toggle("ativo", c.id === "tab-" + tabId);
        });
        modalBody.scrollTop = 0;
    }

    // Links no formulário
    document.getElementById("link-abrir-termos").addEventListener("click", function (e) {
        e.preventDefault();
        abrirModal("termos");
    });
    document.getElementById("link-abrir-privacidade").addEventListener("click", function (e) {
        e.preventDefault();
        abrirModal("privacidade");
    });

    // Fechar modal
    document.getElementById("btn-fechar-modal").addEventListener("click", fecharModal);
    document.getElementById("btn-fechar-modal-footer").addEventListener("click", fecharModal);
    modalOverlay.addEventListener("click", function (e) {
        if (e.target === modalOverlay) fecharModal();
    });
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && modalOverlay.classList.contains("visivel")) fecharModal();
    });

    // Abas
    document.querySelectorAll(".modal-tab").forEach(function (tab) {
        tab.addEventListener("click", function () {
            trocarTab(tab.getAttribute("data-tab"));
        });
    });

    // ══════════════════════════════════════════════════════════════
    // 4. VALIDAÇÕES
    // ══════════════════════════════════════════════════════════════
    var regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function validarFormulario() {
        var erros = {};
        var nome = inputNome.value.trim();
        var email = inputEmail.value.trim();
        var senha = inputSenha.value;
        var confirmacao = inputConfirmarSenha.value;

        if (!nome || nome.length < 3) erros.nome = "Nome deve ter pelo menos 3 caracteres";
        if (!email || !regexEmail.test(email)) erros.email = "E-mail inválido";
        if (!senha || senha.length < 8) erros.senha = "Senha deve ter pelo menos 8 caracteres";
        if (senha !== confirmacao) erros["confirmar-senha"] = "As senhas não conferem";
        if (!inputTermos.checked) erros.termos = "Você precisa concordar com os Termos de Uso e Política de Privacidade para criar sua conta.";

        return Object.keys(erros).length > 0 ? erros : null;
    }

    // ══════════════════════════════════════════════════════════════
    // 5. UI
    // ══════════════════════════════════════════════════════════════
    function mostrarErroCampo(id, msg) {
        var input = document.getElementById(id);
        var erroEl = document.getElementById(id + "-erro");
        if (input) input.classList.add("campo-erro");
        if (erroEl) { erroEl.textContent = msg; erroEl.style.display = "block"; }
    }

    function limparErroCampo(id) {
        var input = document.getElementById(id);
        var erroEl = document.getElementById(id + "-erro");
        if (input) input.classList.remove("campo-erro");
        if (erroEl) { erroEl.textContent = ""; erroEl.style.display = "none"; }
    }

    function limparTodosErros() {
        ["nome", "email", "senha", "confirmar-senha"].forEach(limparErroCampo);
        esconderAlerta();
    }

    function mostrarAlertaErro(msg) {
        alertaErroMsg.textContent = msg;
        alertaErro.classList.add("visivel");
        alertaSucesso.classList.remove("visivel");
        alertaErro.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function mostrarAlertaSucesso() {
        alertaSucesso.classList.add("visivel");
        alertaErro.classList.remove("visivel");
    }

    function esconderAlerta() {
        alertaErro.classList.remove("visivel");
        alertaSucesso.classList.remove("visivel");
    }

    function mostrarLoading(ativo) {
        btnCadastrar.classList.toggle("carregando", ativo);
        btnCadastrar.disabled = ativo;
        btnGoogle.disabled = ativo;
        processando = ativo;
    }

    // ══════════════════════════════════════════════════════════════
    // 6. FORÇA DE SENHA
    // ══════════════════════════════════════════════════════════════
    function atualizarForcaSenha() {
        var senha = inputSenha.value;
        if (!senha) { senhaForca.classList.remove("visivel"); senhaForca.className = "senha-forca"; return; }
        senhaForca.classList.add("visivel");
        var p = 0;
        if (senha.length >= 8) p++; if (senha.length >= 12) p++;
        if (/[a-z]/.test(senha)) p++; if (/[A-Z]/.test(senha)) p++;
        if (/[0-9]/.test(senha)) p++; if (/[^a-zA-Z0-9]/.test(senha)) p++;
        senhaForca.classList.remove("forca-fraca", "forca-media", "forca-forte");
        if (p <= 2) { senhaForca.classList.add("forca-fraca"); senhaForcaTexto.textContent = "Senha fraca"; }
        else if (p <= 4) { senhaForca.classList.add("forca-media"); senhaForcaTexto.textContent = "Senha razoável"; }
        else { senhaForca.classList.add("forca-forte"); senhaForcaTexto.textContent = "Senha forte"; }
    }

    // ══════════════════════════════════════════════════════════════
    // 7. TOGGLE SENHA
    // ══════════════════════════════════════════════════════════════
    function inicializarToggleSenha() {
        document.querySelectorAll(".btn-toggle-senha").forEach(function (btn) {
            btn.addEventListener("click", function () {
                var input = document.getElementById(btn.getAttribute("data-target"));
                if (!input) return;
                if (input.type === "password") {
                    input.type = "text";
                    btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
                } else {
                    input.type = "password";
                    btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
                }
            });
        });
    }

    // ══════════════════════════════════════════════════════════════
    // 8. ERROS FIREBASE + BANNER INTELIGENTE
    // ══════════════════════════════════════════════════════════════

    function mostrarBannerSugestao(tipo, email) {
        // Remove banner anterior
        var old = document.getElementById("suggestion-banner");
        if (old) old.remove();

        var banner = document.createElement("div");
        banner.id = "suggestion-banner";
        banner.className = "suggestion-banner";

        var emailCodificado = encodeURIComponent(email || "");

        if (tipo === "email-existe") {
            banner.innerHTML =
                '<div class="suggestion-icon">' +
                    '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                        '<path d="M10 1a9 9 0 1 0 0 18 9 9 0 0 0 0-18z"/><path d="M10 6v4M10 14h.01"/>' +
                    '</svg>' +
                '</div>' +
                '<div class="suggestion-text">' +
                    '<strong>Já existe uma conta com este e-mail.</strong><br>' +
                    'Se for você, faça login para acessar a plataforma.' +
                '</div>' +
                '<a href="login.html' + (emailCodificado ? '?email=' + emailCodificado : '') + '" class="suggestion-btn">' +
                    'Ir para o login' +
                    '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h8M8 4l3 3-3 3"/></svg>' +
                '</a>';
        } else if (tipo === "metodo-diferente") {
            banner.className += " suggestion-warn";
            banner.innerHTML =
                '<div class="suggestion-icon">' +
                    '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                        '<path d="M10 1a9 9 0 1 0 0 18 9 9 0 0 0 0-18z"/><path d="M10 6v4M10 14h.01"/>' +
                    '</svg>' +
                '</div>' +
                '<div class="suggestion-text">' +
                    '<strong>Este e-mail já está vinculado a outro método de login.</strong><br>' +
                    'Tente entrar com o Google, ou faça login com a senha cadastrada.' +
                '</div>' +
                '<a href="login.html' + (emailCodificado ? '?email=' + emailCodificado : '') + '" class="suggestion-btn">' +
                    'Ir para o login' +
                    '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h8M8 4l3 3-3 3"/></svg>' +
                '</a>';
        }

        // Insere antes do formulário
        var formEl = document.getElementById("form-cadastro");
        formEl.parentNode.insertBefore(banner, formEl);

        // Anima entrada
        requestAnimationFrame(function () {
            banner.classList.add("visivel");
        });

        // Scroll suave até o banner
        banner.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function esconderBannerSugestao() {
        var banner = document.getElementById("suggestion-banner");
        if (banner) banner.remove();
    }

    function traduzirErroFirebase(code) {
        var erros = {
            "auth/invalid-email": "E-mail inválido.",
            "auth/weak-password": "Senha muito fraca. Use no mínimo 8 caracteres.",
            "auth/operation-not-allowed": "Método de cadastro não permitido.",
            "auth/network-request-failed": "Erro de conexão. Verifique sua internet.",
            "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos.",
            "auth/popup-blocked": "Popup bloqueado. Permita popups para este site.",
            "auth/popup-closed-by-user": "Popup fechado. Tente novamente.",
            "auth/internal-error": "Erro interno. Tente novamente."
        };
        return erros[code] || "Ocorreu um erro inesperado. Tente novamente.";
    }

    /**
     * Trata erros do Firebase — se for email duplicado,
     * mostra banner inteligente em vez de erro genérico.
     * Retorna true se tratou com banner (não precisa de alerta).
     */
    function tratarErroInteligente(code, email) {
        if (code === "auth/email-already-in-use") {
            esconderAlerta();
            mostrarBannerSugestao("email-existe", email);
            return true;
        }
        if (code === "auth/account-exists-with-different-credential") {
            esconderAlerta();
            mostrarBannerSugestao("metodo-diferente", email);
            return true;
        }
        return false;
    }

    // ══════════════════════════════════════════════════════════════
    // 9. REGISTRO DE ACEITE — Objeto salvo no Firestore
    // ══════════════════════════════════════════════════════════════
    function gerarRegistroAceite() {
        return {
            aceito: true,
            termosVersao: TERMOS_VERSAO,
            privacidadeVersao: PRIVACIDADE_VERSAO,
            aceitoEm: firebase.firestore.FieldValue.serverTimestamp(),
            aceitoEmLocal: (momentoAceite || new Date()).toISOString(),
            ip: ipUsuario || "indisponível",
            userAgent: navigator.userAgent || "",
            idioma: navigator.language || "",
            plataforma: navigator.platform || ""
        };
    }

    // ══════════════════════════════════════════════════════════════
    // 10. CRIAR DOCUMENTO FIRESTORE
    // ══════════════════════════════════════════════════════════════
    function criarDocumentoUsuario(uid, dados) {
        return IMPOST_DB.collection("users").doc(uid).set({
            nome: dados.nome || "",
            email: dados.email || "",
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

            // ═══ REGISTRO LEGAL DO ACEITE ═══
            termosAceite: dados.termosAceite || gerarRegistroAceite(),

            criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            ultimoLogin: firebase.firestore.FieldValue.serverTimestamp(),
            provider: dados.provider || "email",
            emailVerificado: dados.emailVerificado || false,
            totalCalculos: 0,
            ultimoCalculo: null
        });
    }

    // ══════════════════════════════════════════════════════════════
    // 11. CADASTRO E-MAIL / SENHA
    // ══════════════════════════════════════════════════════════════
    async function cadastrarComEmail(nome, email, senha) {
        var cred = await IMPOST_AUTH.createUserWithEmailAndPassword(email, senha);
        var user = cred.user;
        await user.updateProfile({ displayName: nome });
        try { await user.sendEmailVerification(); } catch (e) { console.warn("Verificação:", e); }
        await criarDocumentoUsuario(user.uid, {
            nome: nome, email: email, provider: "email",
            emailVerificado: false, termosAceite: gerarRegistroAceite()
        });
        return user;
    }

    // ══════════════════════════════════════════════════════════════
    // 12. CADASTRO GOOGLE
    // ══════════════════════════════════════════════════════════════
    async function cadastrarComGoogle() {
        var result = await IMPOST_AUTH.signInWithPopup(IMPOST_GOOGLE_PROVIDER);
        var user = result.user;
        var docRef = IMPOST_DB.collection("users").doc(user.uid);
        var docSnap = await docRef.get();
        if (!docSnap.exists) {
            await criarDocumentoUsuario(user.uid, {
                nome: user.displayName || "", email: user.email || "",
                provider: "google", emailVerificado: true,
                termosAceite: gerarRegistroAceite()
            });
        } else {
            await docRef.update({ ultimoLogin: firebase.firestore.FieldValue.serverTimestamp() });
        }
        return user;
    }

    // ══════════════════════════════════════════════════════════════
    // 13. SESSÃO ATIVA
    // ══════════════════════════════════════════════════════════════
    function verificarSessaoAtiva() {
        IMPOST_AUTH.onAuthStateChanged(function (user) {
            if (user) window.location.href = "dashboard.html";
        });
    }

    // ══════════════════════════════════════════════════════════════
    // 14. EVENT LISTENERS
    // ══════════════════════════════════════════════════════════════

    // Submit
    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        if (processando) return;
        limparTodosErros();

        var erros = validarFormulario();
        if (erros) {
            Object.keys(erros).forEach(function (campo) {
                if (campo === "termos") mostrarAlertaErro(erros[campo]);
                else mostrarErroCampo(campo, erros[campo]);
            });
            var primeiro = Object.keys(erros)[0];
            if (primeiro !== "termos") { var el = document.getElementById(primeiro); if (el) el.focus(); }
            return;
        }

        try {
            mostrarLoading(true);
            esconderAlerta();
            esconderBannerSugestao();
            await cadastrarComEmail(inputNome.value.trim(), inputEmail.value.trim(), inputSenha.value);
            mostrarAlertaSucesso();
            setTimeout(function () { window.location.href = "dashboard.html"; }, 1200);
        } catch (error) {
            console.error("Erro:", error);
            if (!tratarErroInteligente(error.code, inputEmail.value.trim())) {
                mostrarAlertaErro(traduzirErroFirebase(error.code));
            }
            mostrarLoading(false);
        }
    });

    // Google
    btnGoogle.addEventListener("click", async function () {
        if (processando) return;
        if (!inputTermos.checked) {
            mostrarAlertaErro("Você precisa concordar com os Termos de Uso e Política de Privacidade para criar sua conta.");
            return;
        }
        try {
            mostrarLoading(true); esconderAlerta(); limparTodosErros(); esconderBannerSugestao();
            await cadastrarComGoogle();
            mostrarAlertaSucesso();
            setTimeout(function () { window.location.href = "dashboard.html"; }, 1200);
        } catch (error) {
            if (error.code !== "auth/popup-closed-by-user" && error.code !== "auth/cancelled-popup-request") {
                if (!tratarErroInteligente(error.code, "")) {
                    mostrarAlertaErro(traduzirErroFirebase(error.code));
                }
            }
            mostrarLoading(false);
        }
    });

    // Validação em tempo real
    inputNome.addEventListener("blur", function () {
        var v = inputNome.value.trim();
        if (v && v.length < 3) mostrarErroCampo("nome", "Nome deve ter pelo menos 3 caracteres");
        else limparErroCampo("nome");
    });
    inputEmail.addEventListener("blur", function () {
        var v = inputEmail.value.trim();
        if (v && !regexEmail.test(v)) mostrarErroCampo("email", "E-mail inválido");
        else limparErroCampo("email");
    });
    inputSenha.addEventListener("blur", function () {
        if (inputSenha.value && inputSenha.value.length < 8) mostrarErroCampo("senha", "Mínimo 8 caracteres");
        else limparErroCampo("senha");
    });
    inputConfirmarSenha.addEventListener("blur", function () {
        if (inputConfirmarSenha.value && inputSenha.value !== inputConfirmarSenha.value) mostrarErroCampo("confirmar-senha", "As senhas não conferem");
        else limparErroCampo("confirmar-senha");
    });

    [inputNome, inputEmail, inputSenha, inputConfirmarSenha].forEach(function (input) {
        input.addEventListener("input", function () { limparErroCampo(input.id); esconderAlerta(); esconderBannerSugestao(); });
    });
    inputSenha.addEventListener("input", atualizarForcaSenha);

    // ══════════════════════════════════════════════════════════════
    // 15. INIT
    // ══════════════════════════════════════════════════════════════

    // Pré-preencher e-mail vindo do login (via ?email=)
    function preencherEmailDaURL() {
        try {
            var params = new URLSearchParams(window.location.search);
            var emailParam = params.get("email");
            if (emailParam) {
                inputEmail.value = decodeURIComponent(emailParam);
                if (inputNome) inputNome.focus();
                // Limpa a URL sem recarregar
                window.history.replaceState({}, "", window.location.pathname);
            }
        } catch (e) { /* sem parâmetros */ }
    }

    function init() {
        inicializarToggleSenha();
        verificarSessaoAtiva();
        capturarIP();
        preencherEmailDaURL();
        if (inputNome && !inputEmail.value) inputNome.focus();
        console.log("[IMPOST] Cadastro v" + TERMOS_VERSAO + " inicializado");
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();

})();
