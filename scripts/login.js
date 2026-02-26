// ═══════════════════════════════════════════════════════
// IMPOST. — Login Page Controller
// ═══════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {

  // ─── DOM refs ───
  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passInput = document.getElementById('password');
  const btnLogin = document.getElementById('btnLogin');
  const btnGoogle = document.getElementById('btnGoogle');
  const togglePass = document.getElementById('togglePass');
  const eyeOpen = document.getElementById('eyeOpen');
  const eyeClosed = document.getElementById('eyeClosed');
  const formError = document.getElementById('formError');
  const errorMsg = document.getElementById('errorMsg');
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');


  // ═══ Firebase Config ═══
  // Descomente e preencha com seus dados do Firebase Console:
  //
  // import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
  // import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider }
  //   from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
  //
  // const firebaseConfig = {
  //   apiKey: "SUA_API_KEY",
  //   authDomain: "impost-8b24d.firebaseapp.com",
  //   projectId: "impost-8b24d",
  //   storageBucket: "impost-8b24d.appspot.com",
  //   messagingSenderId: "SEU_SENDER_ID",
  //   appId: "SEU_APP_ID"
  // };
  //
  // const app = initializeApp(firebaseConfig);
  // const auth = getAuth(app);
  // const googleProvider = new GoogleAuthProvider();


  // ─── Password visibility toggle ───
  togglePass.addEventListener('click', () => {
    const isPassword = passInput.type === 'password';
    passInput.type = isPassword ? 'text' : 'password';
    eyeOpen.style.display = isPassword ? 'none' : 'block';
    eyeClosed.style.display = isPassword ? 'block' : 'none';
  });


  // ─── Error helpers ───
  function showError(msg) {
    errorMsg.textContent = msg;
    formError.classList.add('show');
    // re-trigger shake animation
    formError.style.animation = 'none';
    formError.offsetHeight; // reflow
    formError.style.animation = '';
  }

  function hideError() {
    formError.classList.remove('show');
  }


  // ─── Toast notification ───
  function showToast(msg, duration = 3000) {
    toastMsg.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
  }


  // ─── Set loading state ───
  function setLoading(loading) {
    if (loading) {
      btnLogin.classList.add('loading');
      btnLogin.disabled = true;
    } else {
      btnLogin.classList.remove('loading');
      btnLogin.disabled = false;
    }
  }


  // ─── Validate form inputs ───
  function validateForm(email, password) {
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

    if (!password) {
      showError('Informe a senha');
      passInput.focus();
      return false;
    }

    if (password.length < 6) {
      showError('A senha deve ter pelo menos 6 caracteres');
      passInput.focus();
      return false;
    }

    return true;
  }


  // ─── Handle Firebase Auth errors ───
  function handleAuthError(err) {
    const code = err.code || '';
    const errorMap = {
      'auth/user-not-found': 'E-mail ou senha inválidos',
      'auth/wrong-password': 'E-mail ou senha inválidos',
      'auth/invalid-credential': 'E-mail ou senha inválidos',
      'auth/invalid-email': 'E-mail inválido',
      'auth/user-disabled': 'Conta desativada. Entre em contato com o suporte.',
      'auth/too-many-requests': 'Muitas tentativas. Tente novamente em alguns minutos.',
      'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.',
      'auth/popup-closed-by-user': 'Login cancelado.',
      'auth/account-exists-with-different-credential': 'Já existe uma conta com este e-mail usando outro método de login.',
    };

    showError(errorMap[code] || 'Erro ao fazer login. Tente novamente.');
  }


  // ─── Redirect after login ───
  function onLoginSuccess(user) {
    showToast('Login realizado com sucesso!');
    console.log('Usuário autenticado:', user?.email || user);

    setTimeout(() => {
      // Redirecionar para o dashboard
      window.location.href = 'dashboard.html';
    }, 1000);
  }


  // ═══ Form Submit — Email/Senha ═══
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const email = emailInput.value.trim();
    const password = passInput.value;

    if (!validateForm(email, password)) return;

    setLoading(true);

    try {
      // ══════════════════════════════════════════════
      // MODO DEMO — Substitua pelo Firebase Auth real
      // ══════════════════════════════════════════════
      await new Promise(resolve => setTimeout(resolve, 1800));
      onLoginSuccess({ email });

      // ══════════════════════════════════════════════
      // FIREBASE AUTH — Descomente para produção:
      // ══════════════════════════════════════════════
      // const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // const user = userCredential.user;
      // const token = await user.getIdToken();
      // sessionStorage.setItem('authToken', token);
      // onLoginSuccess(user);

    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  });


  // ═══ Google Sign-In ═══
  btnGoogle.addEventListener('click', async () => {
    hideError();

    try {
      // ══════════════════════════════════════════════
      // MODO DEMO
      // ══════════════════════════════════════════════
      showToast('Google Sign-In — integrar com Firebase Auth');

      // ══════════════════════════════════════════════
      // FIREBASE AUTH — Descomente para produção:
      // ══════════════════════════════════════════════
      // const result = await signInWithPopup(auth, googleProvider);
      // const user = result.user;
      // const token = await user.getIdToken();
      // sessionStorage.setItem('authToken', token);
      // onLoginSuccess(user);

    } catch (err) {
      handleAuthError(err);
    }
  });


  // ─── Clear errors on input ───
  emailInput.addEventListener('input', hideError);
  passInput.addEventListener('input', hideError);


  // ─── Enter key on password → submit ───
  passInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      form.dispatchEvent(new Event('submit'));
    }
  });

});
