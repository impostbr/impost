// ═══════════════════════════════════════════════════════
// IMPOST. — Login Controller
// Arquivo: scripts/auth/login.js
// Depende de: scripts/auth/firebase-config.js (carregado antes)
// ═══════════════════════════════════════════════════════

(function () {

  var auth = IMPOST_AUTH;
  var googleProvider = IMPOST_GOOGLE_PROVIDER;
  var db = IMPOST_DB;

  // Persistência padrão: SESSION
  auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);

  // ─── Se já estiver logado, verificar Firestore antes de redirecionar ───
  auth.onAuthStateChanged(function (user) {
    if (user) {
      db.collection("users").doc(user.uid).get()
        .then(function (docSnap) {
          if (docSnap.exists) {
            var dados = docSnap.data();
            if (dados.termosAceite && dados.termosAceite.aceito === true) {
              // Aceite válido → pode ir pro dashboard
              window.location.href = 'dashboard.html';
            }
            // Sem aceite → fica no login (usuário pode ir pro cadastro manualmente)
          }
          // Documento não existe → fica no login
        })
        .catch(function () {
          // Erro de rede → fica no login por segurança
        });
    }
  });

  // ─── DOM refs ───
  var form = document.getElementById('loginForm');
  var emailInput = document.getElementById('email');
  var passInput = document.getElementById('password');
  var btnLogin = document.getElementById('btnLogin');
  var btnGoogle = document.getElementById('btnGoogle');
  var togglePass = document.getElementById('togglePass');
  var eyeOpen = document.getElementById('eyeOpen');
  var eyeClosed = document.getElementById('eyeClosed');
  var formError = document.getElementById('formError');
  var errorMsg = document.getElementById('errorMsg');
  var toast = document.getElementById('toast');
  var toastMsg = document.getElementById('toastMsg');
  var rememberCb = document.getElementById('remember');
  var forgotLink = document.getElementById('forgotLink');

  // ─── Password toggle ───
  togglePass.addEventListener('click', function () {
    var isPw = passInput.type === 'password';
    passInput.type = isPw ? 'text' : 'password';
    eyeOpen.style.display = isPw ? 'none' : 'block';
    eyeClosed.style.display = isPw ? 'block' : 'none';
  });

  // ─── Helpers ───
  function showError(msg) {
    errorMsg.textContent = msg;
    formError.classList.add('show');
    formError.style.animation = 'none';
    formError.offsetHeight;
    formError.style.animation = '';
  }

  function hideError() {
    formError.classList.remove('show');
  }

  function showToast(msg, ms) {
    toastMsg.textContent = msg;
    toast.classList.add('show');
    setTimeout(function () { toast.classList.remove('show'); }, ms || 3000);
  }

  function setLoading(on) {
    btnLogin.classList.toggle('loading', on);
    btnLogin.disabled = on;
  }

  function validateForm(email, pw) {
    if (!email) {
      showError('Informe o e-mail');
      emailInput.focus();
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('E-mail inválido');
      emailInput.focus();
      return false;
    }
    if (!pw) {
      showError('Informe a senha');
      passInput.focus();
      return false;
    }
    if (pw.length < 8) {
      showError('A senha deve ter pelo menos 8 caracteres');
      passInput.focus();
      return false;
    }
    return true;
  }

  // ─── Banner de sugestão (cadastro / login cruzado) ───
  function showSuggestionBanner(type, email) {
    // Remove banner anterior se existir
    var old = document.getElementById('suggestionBanner');
    if (old) old.remove();

    var banner = document.createElement('div');
    banner.id = 'suggestionBanner';
    banner.className = 'suggestion-banner';

    var encodedEmail = encodeURIComponent(email || '');

    if (type === 'no-account') {
      banner.innerHTML =
        '<div class="suggestion-icon">' +
          '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<circle cx="10" cy="10" r="9"/><path d="M10 6v4M10 14h.01"/>' +
          '</svg>' +
        '</div>' +
        '<div class="suggestion-text">' +
          '<strong>Não encontramos uma conta com este e-mail.</strong><br>' +
          'Verifique o endereço digitado ou crie uma conta gratuitamente.' +
        '</div>' +
        '<a href="cadastro.html' + (encodedEmail ? '?email=' + encodedEmail : '') + '" class="suggestion-btn">' +
          'Criar conta grátis' +
          '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h8M8 4l3 3-3 3"/></svg>' +
        '</a>';
    } else if (type === 'wrong-password') {
      banner.className += ' suggestion-warn';
      banner.innerHTML =
        '<div class="suggestion-icon">' +
          '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<rect x="3" y="8" width="14" height="10" rx="2"/><path d="M6 8V5a4 4 0 0 1 8 0v3"/>' +
          '</svg>' +
        '</div>' +
        '<div class="suggestion-text">' +
          '<strong>Senha incorreta.</strong> Verifique e tente novamente, ou ' +
          '<a href="#" id="forgotFromBanner">redefina sua senha</a>.' +
        '</div>';
    }

    // Insere antes do formulário
    var formEl = document.getElementById('loginForm');
    formEl.parentNode.insertBefore(banner, formEl);

    // Anima entrada
    requestAnimationFrame(function () {
      banner.classList.add('show');
    });

    // Link "redefina sua senha" dentro do banner
    var forgotBannerLink = document.getElementById('forgotFromBanner');
    if (forgotBannerLink) {
      forgotBannerLink.addEventListener('click', function (e) {
        e.preventDefault();
        forgotLink.click();
      });
    }
  }

  function hideSuggestionBanner() {
    var banner = document.getElementById('suggestionBanner');
    if (banner) banner.remove();
  }

  function handleAuthError(err) {
    var code = err.code || '';
    var email = emailInput.value.trim();

    // ─── Fluxo inteligente: e-mail não encontrado → sugerir cadastro ───
    if (code === 'auth/user-not-found') {
      hideError();
      showSuggestionBanner('no-account', email);
      return;
    }

    // ─── Fluxo inteligente: senha errada → sugerir recuperação ───
    if (code === 'auth/wrong-password') {
      hideError();
      showSuggestionBanner('wrong-password', email);
      return;
    }

    // ─── invalid-credential (Firebase v9+ combina user-not-found + wrong-password) ───
    if (code === 'auth/invalid-credential') {
      hideError();
      // Como não sabemos se é "conta não existe" ou "senha errada",
      // mostra mensagem genérica que cobre ambos os casos
      showError('E-mail ou senha incorretos. Verifique seus dados ou crie uma conta.');
      return;
    }

    // ─── Erros genéricos ───
    hideSuggestionBanner();
    var map = {
      'auth/invalid-email':        'E-mail inválido',
      'auth/user-disabled':        'Conta desativada. Entre em contato com o suporte.',
      'auth/too-many-requests':    'Muitas tentativas. Tente novamente em alguns minutos.',
      'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.',
      'auth/popup-closed-by-user': 'Login cancelado.',
      'auth/popup-blocked':        'Popup bloqueado. Permita popups para este site.',
      'auth/account-exists-with-different-credential': 'Já existe conta com este e-mail usando outro método de login. Tente com Google.'
    };
    showError(map[code] || 'Erro: ' + (err.message || 'tente novamente'));
    console.error('Auth Error:', code, err.message);
  }

  function getPersistence() {
    return rememberCb.checked
      ? firebase.auth.Auth.Persistence.LOCAL
      : firebase.auth.Auth.Persistence.SESSION;
  }

  function onLoginSuccess(user) {
    showToast('Verificando conta...');
    console.log('Login OK:', user.email, user.uid);

    // Verificar se tem documento no Firestore
    db.collection("users").doc(user.uid).get()
      .then(function (docSnap) {
        if (docSnap.exists) {
          // Documento existe → verificar aceite
          var dados = docSnap.data();

          // Verificar se aceite de termos é válido
          if (!dados.termosAceite || dados.termosAceite.aceito !== true) {
            // Aceite inválido ou ausente → redirecionar para cadastro
            showToast('Complete seu cadastro para continuar');
            setTimeout(function () {
              window.location.href = 'cadastro.html?email=' + encodeURIComponent(user.email || '');
            }, 1200);
            return;
          }

          // Atualizar último login (1x por sessão — ver sessão do auth-guard)
          db.collection("users").doc(user.uid).update({
            ultimoLogin: firebase.firestore.FieldValue.serverTimestamp(),
            emailVerificado: user.emailVerified || false
          }).catch(function () { /* silencioso */ });

          showToast('Bem-vindo, ' + (dados.nome || user.displayName || user.email) + '!');
          setTimeout(function () {
            window.location.href = 'dashboard.html';
          }, 1200);
        } else {
          // Documento NÃO existe → usuário nunca se cadastrou
          // Redirecionar para cadastro para aceitar termos
          showToast('Complete seu cadastro para continuar');
          setTimeout(function () {
            window.location.href = 'cadastro.html?email=' + encodeURIComponent(user.email || '');
          }, 1200);
        }
      })
      .catch(function (err) {
        console.error('Erro ao verificar documento:', err);
        // Em caso de erro de rede, tentar ir pro dashboard
        // O auth-guard vai verificar novamente
        showToast('Bem-vindo, ' + (user.displayName || user.email) + '!');
        setTimeout(function () {
          window.location.href = 'dashboard.html';
        }, 1200);
      });
  }

  // ═══ LOGIN — Email/Senha ═══
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    hideError();
    hideSuggestionBanner();
    var email = emailInput.value.trim();
    var pw = passInput.value;
    if (!validateForm(email, pw)) return;

    setLoading(true);
    auth.setPersistence(getPersistence())
      .then(function () {
        return auth.signInWithEmailAndPassword(email, pw);
      })
      .then(function (cred) {
        onLoginSuccess(cred.user);
      })
      .catch(function (err) {
        handleAuthError(err);
      })
      .finally(function () {
        setLoading(false);
      });
  });

  // ═══ LOGIN — Google ═══
  btnGoogle.addEventListener('click', function () {
    hideError();
    auth.setPersistence(getPersistence())
      .then(function () {
        return auth.signInWithPopup(googleProvider);
      })
      .then(function (result) {
        onLoginSuccess(result.user);
      })
      .catch(function (err) {
        if (err.code !== 'auth/popup-closed-by-user') {
          handleAuthError(err);
        }
      });
  });

  // ═══ ESQUECEU A SENHA ═══
  forgotLink.addEventListener('click', function (e) {
    e.preventDefault();
    var email = emailInput.value.trim();

    if (!email) {
      showError('Digite seu e-mail acima e clique em "Esqueceu a senha?" novamente');
      emailInput.focus();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('Digite um e-mail válido');
      emailInput.focus();
      return;
    }

    auth.sendPasswordResetEmail(email)
      .then(function () {
        showToast('E-mail de recuperação enviado para ' + email, 5000);
      })
      .catch(function (err) {
        if (err.code === 'auth/user-not-found') {
          showError('Nenhuma conta encontrada com este e-mail');
        } else {
          handleAuthError(err);
        }
      });
  });

  // ─── Limpa erros ao digitar ───
  emailInput.addEventListener('input', function () { hideError(); hideSuggestionBanner(); });
  passInput.addEventListener('input', function () { hideError(); hideSuggestionBanner(); });

  // ─── Pré-preencher e-mail vindo do cadastro (via ?email=) ───
  (function preencheDaURL() {
    try {
      var params = new URLSearchParams(window.location.search);
      var emailParam = params.get('email');
      if (emailParam) {
        emailInput.value = decodeURIComponent(emailParam);
        passInput.focus();
        // Limpa a URL sem recarregar
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch (e) { /* URL sem parâmetros, segue normal */ }
  })();

})();
