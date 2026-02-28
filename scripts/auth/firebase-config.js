// ═══════════════════════════════════════════════════════
// IMPOST. — Firebase Config (centralizado)
// Arquivo: scripts/firebase-config.js
//
// Todas as páginas importam este arquivo antes de usar
// qualquer serviço Firebase (Auth, Firestore, etc.)
//
// NOTA: Chaves do Firebase Web são PÚBLICAS por design.
// A segurança é feita pelas Firebase Security Rules
// e pela restrição de domínio no Console Google Cloud:
// https://console.cloud.google.com/apis/credentials
// ═══════════════════════════════════════════════════════

var firebaseConfig = {
  apiKey: "AIzaSyCj4fJY87dLU6wnP8y6wWQ5TokmllqWZ7g",
  authDomain: "impost-8b24d.firebaseapp.com",
  projectId: "impost-8b24d",
  storageBucket: "impost-8b24d.firebasestorage.app",
  messagingSenderId: "353928871368",
  appId: "1:353928871368:web:e5d1b013797063f24a94fd",
  measurementId: "G-LBBB9NEBLZ"
};

// Inicializa o app (só uma vez)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Exporta referências globais para uso em qualquer página
var IMPOST_AUTH = firebase.auth();
var IMPOST_GOOGLE_PROVIDER = new firebase.auth.GoogleAuthProvider();

console.log('[IMPOST] Firebase inicializado — projeto:', firebaseConfig.projectId);
