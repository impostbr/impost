// ═══════════════════════════════════════════════════════
// IMPOST. — Login Controller
// Arquivo: scripts/login.js
// Depende de: scripts/firebase-config.js (carregado antes)
// ═══════════════════════════════════════════════════════

(function () {

  var auth = IMPOST_AUTH;
  var googleProvider = IMPOST_GOOGLE_PROVIDER;

  // Persistência padrão: SESSION
  auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);

  // ─── Se já estiver logado, redireciona ───
  auth.onAuthStateChanged(function (user) {
    if (user) {
      window.location.href = 'dashboard.html';
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
    if (pw.length < 6) {
      showError('A senha deve ter pelo menos 6 caracteres');
      passInput.focus();
      return false;
    }
    return true;
  }

  function handleAuthError(err) {
    var code = err.code || '';
    var map = {
      'auth/user-not-found':       'E-mail ou senha inválidos',
      'auth/wrong-password':       'E-mail ou senha inválidos',
      'auth/invalid-credential':   'E-mail ou senha inválidos',
      'auth/invalid-email':        'E-mail inválido',
      'auth/user-disabled':        'Conta desativada. Entre em contato com o suporte.',
      'auth/too-many-requests':    'Muitas tentativas. Tente novamente em alguns minutos.',
      'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.',
      'auth/popup-closed-by-user': 'Login cancelado.',
      'auth/popup-blocked':        'Popup bloqueado. Permita popups para este site.',
      'auth/account-exists-with-different-credential': 'Já existe conta com este e-mail usando outro método.'
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
    showToast('Bem-vindo, ' + (user.displayName || user.email) + '!');
    console.log('Login OK:', user.email, user.uid);
    setTimeout(function () {
      window.location.href = 'dashboard.html';
    }, 1200);
  }

  // ═══ LOGIN — Email/Senha ═══
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    hideError();
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
  emailInput.addEventListener('input', hideError);
  passInput.addEventListener('input', hideError);

})();
