// ═══════════════════════════════════════════════════════════════════════════════
// IMPOST. — Controle de Acesso + Autenticação
// Arquivo: scripts/controle-acesso.js
//
// Depende de: firebase-config.js (carregado ANTES deste arquivo)
// Expõe:     window.IMPOST_ACESSO (objeto global)
//
// Planos:
//   "free"        → Só visualiza, não calcula (trial/demo)
//   "empresario"  → 1 regime (Real OU Presumido), até 5 CNPJs
//   "escritorio"  → Todas as abas, CNPJs ilimitados, white-label PDF
//
// Firestore Collection: "usuarios/{uid}"
// ═══════════════════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ─────────────────────────────────────────────────
  // 1. CONFIGURAÇÃO DOS PLANOS
  // ─────────────────────────────────────────────────
  var PLANOS = {
    free: {
      nome: 'Gratuito',
      descricao: 'Acesso limitado para conhecer a plataforma',
      preco: 0,
      abas: ['simples'],                    // só Simples Nacional (demo)
      limite_cnpjs: 1,
      exporta_pdf: false,
      white_label: false,
      simuladores: false,
      plano_acao: false,
      cor: '#94a3b8'                         // cinza
    },
    empresario: {
      nome: 'Empresário',
      descricao: 'Ideal para quem quer otimizar seus próprios negócios',
      preco: 97,                             // R$/mês (ajuste conforme quiser)
      abas: [],                              // definido na assinatura: ['lucro_real'] OU ['lucro_presumido']
      abas_possiveis: ['lucro_real', 'lucro_presumido', 'simples'],
      regime_unico: true,                    // escolhe 1 regime (Real OU Presumido) + Simples
      limite_cnpjs: 5,
      exporta_pdf: true,
      white_label: false,
      simuladores: true,
      plano_acao: false,
      cor: '#3b82f6'                         // azul
    },
    escritorio: {
      nome: 'Escritório Contábil',
      descricao: 'Todas as ferramentas, sem limites, com sua marca',
      preco: 297,                            // R$/mês
      abas: ['simples', 'lucro_presumido', 'lucro_real', 'comparativo', 'diagnostico'],
      regime_unico: false,
      limite_cnpjs: Infinity,
      exporta_pdf: true,
      white_label: true,                     // PDF com logo do escritório
      simuladores: true,
      plano_acao: true,
      cor: '#f59e0b'                         // dourado
    }
  };

  // ─────────────────────────────────────────────────
  // 2. MAPEAMENTO DE ABAS (id da aba no HTML → chave interna)
  // Ajuste os seletores conforme o id real das suas abas no HTML
  // ─────────────────────────────────────────────────
  var MAPA_ABAS = {
    'simples':          { seletor: '#tab-simples, #aba-simples, [data-aba="simples"]',           label: 'Simples Nacional' },
    'lucro_presumido':  { seletor: '#tab-presumido, #aba-presumido, [data-aba="presumido"]',     label: 'Lucro Presumido' },
    'lucro_real':       { seletor: '#tab-real, #aba-real, [data-aba="real"]',                     label: 'Lucro Real' },
    'comparativo':      { seletor: '#tab-comparativo, #aba-comparativo, [data-aba="comparativo"]', label: 'Comparativo' },
    'diagnostico':      { seletor: '#tab-diagnostico, #aba-diagnostico, [data-aba="diagnostico"]', label: 'Diagnóstico' }
  };

  // ─────────────────────────────────────────────────
  // 3. REFERÊNCIAS FIREBASE
  // ─────────────────────────────────────────────────
  var auth = IMPOST_AUTH;                                    // do firebase-config.js
  var db   = firebase.firestore();
  var googleProvider = IMPOST_GOOGLE_PROVIDER;               // do firebase-config.js

  // ─────────────────────────────────────────────────
  // 4. ESTADO GLOBAL
  // ─────────────────────────────────────────────────
  var estado = {
    usuario: null,          // firebase user object
    perfil: null,           // dados do Firestore (plano, cnpjs, etc.)
    plano: 'free',          // chave do plano atual
    carregando: true,
    listeners: []           // callbacks para mudança de estado
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTENTICAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── Login com Google ───
  function loginGoogle() {
    return auth.signInWithPopup(googleProvider)
      .then(function (result) {
        console.log('[IMPOST] Login Google OK:', result.user.email);
        return result.user;
      })
      .catch(function (err) {
        console.error('[IMPOST] Erro login Google:', err);
        _mostrarErro('Erro ao fazer login com Google: ' + err.message);
        throw err;
      });
  }

  // ─── Login com Email/Senha ───
  function loginEmail(email, senha) {
    if (!email || !senha) {
      _mostrarErro('Preencha email e senha.');
      return Promise.reject(new Error('Campos vazios'));
    }
    return auth.signInWithEmailAndPassword(email, senha)
      .then(function (result) {
        console.log('[IMPOST] Login email OK:', result.user.email);
        return result.user;
      })
      .catch(function (err) {
        console.error('[IMPOST] Erro login email:', err);
        var msg = _traduzirErroAuth(err.code);
        _mostrarErro(msg);
        throw err;
      });
  }

  // ─── Cadastro com Email/Senha ───
  function cadastrar(email, senha, nome) {
    if (!email || !senha) {
      _mostrarErro('Preencha email e senha.');
      return Promise.reject(new Error('Campos vazios'));
    }
    if (senha.length < 6) {
      _mostrarErro('A senha deve ter pelo menos 6 caracteres.');
      return Promise.reject(new Error('Senha curta'));
    }
    return auth.createUserWithEmailAndPassword(email, senha)
      .then(function (result) {
        // Atualiza nome de exibição
        var promessaNome = nome
          ? result.user.updateProfile({ displayName: nome })
          : Promise.resolve();

        return promessaNome.then(function () {
          // Cria documento no Firestore com plano free
          return _criarPerfilFirestore(result.user, nome);
        }).then(function () {
          console.log('[IMPOST] Cadastro OK:', result.user.email);
          return result.user;
        });
      })
      .catch(function (err) {
        console.error('[IMPOST] Erro cadastro:', err);
        var msg = _traduzirErroAuth(err.code);
        _mostrarErro(msg);
        throw err;
      });
  }

  // ─── Logout ───
  function logout() {
    return auth.signOut().then(function () {
      console.log('[IMPOST] Logout OK');
      estado.usuario = null;
      estado.perfil = null;
      estado.plano = 'free';
      _notificarListeners();
    });
  }

  // ─── Recuperar Senha ───
  function recuperarSenha(email) {
    if (!email) {
      _mostrarErro('Informe seu email.');
      return Promise.reject(new Error('Email vazio'));
    }
    return auth.sendPasswordResetEmail(email)
      .then(function () {
        _mostrarSucesso('Email de recuperação enviado para ' + email);
      })
      .catch(function (err) {
        var msg = _traduzirErroAuth(err.code);
        _mostrarErro(msg);
        throw err;
      });
  }

  // ─── Criar perfil inicial no Firestore ───
  function _criarPerfilFirestore(user, nome) {
    return db.collection('usuarios').doc(user.uid).set({
      email: user.email,
      nome: nome || user.displayName || '',
      plano: 'free',
      regime_escolhido: null,       // para plano empresário: 'lucro_real' ou 'lucro_presumido'
      cnpjs: [],
      criado_em: firebase.firestore.FieldValue.serverTimestamp(),
      atualizado_em: firebase.firestore.FieldValue.serverTimestamp(),
      vencimento: null,             // data de expiração da assinatura
      ativo: true,
      // White-label (escritório)
      logo_url: null,
      nome_escritorio: null
    }, { merge: true });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTROLE DE PLANOS E ACESSO
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── Carregar perfil do Firestore ───
  function _carregarPerfil(uid) {
    return db.collection('usuarios').doc(uid).get()
      .then(function (doc) {
        if (doc.exists) {
          estado.perfil = doc.data();
          estado.plano = estado.perfil.plano || 'free';

          // Verifica vencimento
          if (estado.perfil.vencimento) {
            var venc = estado.perfil.vencimento.toDate
              ? estado.perfil.vencimento.toDate()
              : new Date(estado.perfil.vencimento);
            if (venc < new Date()) {
              console.warn('[IMPOST] Assinatura vencida em', venc);
              estado.plano = 'free';
              // Atualiza no Firestore
              db.collection('usuarios').doc(uid).update({ plano: 'free' });
            }
          }
        } else {
          // Primeiro acesso (ex: login Google sem cadastro prévio)
          return _criarPerfilFirestore(estado.usuario).then(function () {
            estado.perfil = { plano: 'free', cnpjs: [], regime_escolhido: null };
            estado.plano = 'free';
          });
        }
      });
  }

  // ─── Obter abas liberadas para o usuário atual ───
  function getAbasLiberadas() {
    var planoConfig = PLANOS[estado.plano];
    if (!planoConfig) return ['simples'];

    // Plano escritório: tudo liberado
    if (estado.plano === 'escritorio') {
      return planoConfig.abas.slice(); // cópia
    }

    // Plano empresário: simples + regime escolhido
    if (estado.plano === 'empresario') {
      var abas = ['simples'];
      var regime = estado.perfil && estado.perfil.regime_escolhido;
      if (regime) {
        abas.push(regime); // 'lucro_real' ou 'lucro_presumido'
      }
      return abas;
    }

    // Free: só simples
    return planoConfig.abas.slice();
  }

  // ─── Verificar se pode acessar uma aba ───
  function podeAcessarAba(chaveAba) {
    var liberadas = getAbasLiberadas();
    return liberadas.indexOf(chaveAba) !== -1;
  }

  // ─── Verificar se pode adicionar mais CNPJs ───
  function podeAdicionarCNPJ() {
    var planoConfig = PLANOS[estado.plano];
    if (!planoConfig) return false;
    var cnpjsAtuais = (estado.perfil && estado.perfil.cnpjs) ? estado.perfil.cnpjs.length : 0;
    return cnpjsAtuais < planoConfig.limite_cnpjs;
  }

  // ─── Adicionar CNPJ à lista do usuário ───
  function adicionarCNPJ(cnpj) {
    cnpj = _limparCNPJ(cnpj);
    if (!_validarCNPJ(cnpj)) {
      _mostrarErro('CNPJ inválido.');
      return Promise.reject(new Error('CNPJ inválido'));
    }
    if (!podeAdicionarCNPJ()) {
      var planoConfig = PLANOS[estado.plano];
      _mostrarUpgrade('Você atingiu o limite de ' + planoConfig.limite_cnpjs + ' CNPJ(s) no plano ' + planoConfig.nome + '.');
      return Promise.reject(new Error('Limite de CNPJs'));
    }
    // Verifica duplicata
    var cnpjsAtuais = (estado.perfil && estado.perfil.cnpjs) || [];
    if (cnpjsAtuais.indexOf(cnpj) !== -1) {
      _mostrarErro('Este CNPJ já está cadastrado.');
      return Promise.reject(new Error('CNPJ duplicado'));
    }

    return db.collection('usuarios').doc(estado.usuario.uid).update({
      cnpjs: firebase.firestore.FieldValue.arrayUnion(cnpj),
      atualizado_em: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function () {
      estado.perfil.cnpjs.push(cnpj);
      _mostrarSucesso('CNPJ adicionado com sucesso.');
      _notificarListeners();
    });
  }

  // ─── Remover CNPJ da lista ───
  function removerCNPJ(cnpj) {
    cnpj = _limparCNPJ(cnpj);
    return db.collection('usuarios').doc(estado.usuario.uid).update({
      cnpjs: firebase.firestore.FieldValue.arrayRemove(cnpj),
      atualizado_em: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function () {
      var idx = estado.perfil.cnpjs.indexOf(cnpj);
      if (idx > -1) estado.perfil.cnpjs.splice(idx, 1);
      _notificarListeners();
    });
  }

  // ─── Definir regime escolhido (plano empresário) ───
  function escolherRegime(regime) {
    if (['lucro_real', 'lucro_presumido'].indexOf(regime) === -1) {
      return Promise.reject(new Error('Regime inválido'));
    }
    return db.collection('usuarios').doc(estado.usuario.uid).update({
      regime_escolhido: regime,
      atualizado_em: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function () {
      estado.perfil.regime_escolhido = regime;
      _aplicarRestricoes();
      _notificarListeners();
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // APLICAR RESTRIÇÕES NA INTERFACE
  // ═══════════════════════════════════════════════════════════════════════════

  function _aplicarRestricoes() {
    var abasLiberadas = getAbasLiberadas();

    Object.keys(MAPA_ABAS).forEach(function (chave) {
      var config = MAPA_ABAS[chave];
      var elementos = document.querySelectorAll(config.seletor);
      var liberada = abasLiberadas.indexOf(chave) !== -1;

      elementos.forEach(function (el) {
        if (liberada) {
          // Libera a aba
          el.classList.remove('impost-bloqueada');
          el.style.pointerEvents = '';
          el.style.opacity = '';
          // Remove overlay de bloqueio se existir
          var overlay = el.querySelector('.impost-overlay-bloqueio');
          if (overlay) overlay.remove();
        } else {
          // Bloqueia a aba
          el.classList.add('impost-bloqueada');

          // Se for botão/tab, desabilita o clique e mostra cadeado
          if (el.tagName === 'BUTTON' || el.tagName === 'A' || el.hasAttribute('data-aba')) {
            el.style.opacity = '0.5';
            el.style.position = 'relative';
            // Adiciona ícone de cadeado se não tiver
            if (!el.querySelector('.impost-cadeado')) {
              var cadeado = document.createElement('span');
              cadeado.className = 'impost-cadeado';
              cadeado.innerHTML = ' 🔒';
              cadeado.style.fontSize = '0.8em';
              el.appendChild(cadeado);
            }
            // Intercepta clique
            el.addEventListener('click', function (e) {
              if (!podeAcessarAba(chave)) {
                e.preventDefault();
                e.stopPropagation();
                _mostrarUpgrade('A aba "' + config.label + '" não está disponível no seu plano. Faça upgrade para acessar.');
              }
            }, true);
          }

          // Se for painel/conteúdo, adiciona overlay
          if (el.classList.contains('tab-content') || el.classList.contains('aba-conteudo') || el.id && el.id.indexOf('conteudo') > -1) {
            el.style.position = 'relative';
            if (!el.querySelector('.impost-overlay-bloqueio')) {
              var overlay = document.createElement('div');
              overlay.className = 'impost-overlay-bloqueio';
              overlay.innerHTML =
                '<div style="text-align:center;padding:40px;">' +
                  '<div style="font-size:48px;margin-bottom:16px;">🔒</div>' +
                  '<h3 style="margin:0 0 8px;color:#1e293b;">Conteúdo bloqueado</h3>' +
                  '<p style="color:#64748b;margin:0 0 16px;">Faça upgrade do seu plano para acessar "' + config.label + '"</p>' +
                  '<button onclick="IMPOST_ACESSO.mostrarPlanos()" style="' +
                    'background:#3b82f6;color:#fff;border:none;padding:10px 24px;' +
                    'border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;' +
                  '">Ver Planos</button>' +
                '</div>';
              overlay.style.cssText =
                'position:absolute;top:0;left:0;right:0;bottom:0;z-index:100;' +
                'background:rgba(255,255,255,0.92);display:flex;align-items:center;' +
                'justify-content:center;backdrop-filter:blur(4px);border-radius:inherit;';
              el.appendChild(overlay);
            }
          }
        }
      });
    });

    // Atualiza badge do plano no header (se existir)
    _atualizarBadgePlano();
    console.log('[IMPOST] Restrições aplicadas. Plano:', estado.plano, '| Abas:', abasLiberadas);
  }

  // ─── Badge do plano no header ───
  function _atualizarBadgePlano() {
    var badge = document.getElementById('impost-badge-plano');
    if (!badge) return;
    var planoConfig = PLANOS[estado.plano];
    badge.textContent = planoConfig.nome;
    badge.style.background = planoConfig.cor;
    badge.style.color = '#fff';
    badge.style.padding = '4px 12px';
    badge.style.borderRadius = '20px';
    badge.style.fontSize = '12px';
    badge.style.fontWeight = '700';
    badge.style.letterSpacing = '0.5px';
    badge.style.textTransform = 'uppercase';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERFACE — MODAIS
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── Modal de Login ───
  function mostrarLogin() {
    _removerModal();
    var modal = _criarModal('impost-modal-login');
    modal.querySelector('.impost-modal-corpo').innerHTML =
      '<div style="text-align:center;margin-bottom:24px;">' +
        '<h2 style="margin:0 0 4px;color:#0f172a;font-size:24px;">Entrar no IMPOST.</h2>' +
        '<p style="color:#64748b;margin:0;">Inteligência Tributária ao seu alcance</p>' +
      '</div>' +

      // Google
      '<button id="impost-btn-google" style="' +
        'width:100%;padding:12px;border:1px solid #e2e8f0;border-radius:8px;' +
        'background:#fff;cursor:pointer;font-size:14px;display:flex;align-items:center;' +
        'justify-content:center;gap:8px;margin-bottom:16px;transition:background .2s;' +
      '">' +
        '<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" height="18">' +
        'Entrar com Google' +
      '</button>' +

      '<div style="text-align:center;color:#94a3b8;margin:16px 0;font-size:13px;">ou use email e senha</div>' +

      // Email/Senha
      '<input id="impost-input-email" type="email" placeholder="Email" style="' +
        'width:100%;padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;' +
        'margin-bottom:8px;font-size:14px;box-sizing:border-box;' +
      '">' +
      '<input id="impost-input-senha" type="password" placeholder="Senha" style="' +
        'width:100%;padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;' +
        'margin-bottom:16px;font-size:14px;box-sizing:border-box;' +
      '">' +

      '<button id="impost-btn-login-email" style="' +
        'width:100%;padding:12px;background:#0f172a;color:#fff;border:none;' +
        'border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;margin-bottom:12px;' +
      '">Entrar</button>' +

      '<div style="display:flex;justify-content:space-between;font-size:13px;">' +
        '<a href="#" id="impost-link-cadastro" style="color:#3b82f6;text-decoration:none;">Criar conta</a>' +
        '<a href="#" id="impost-link-senha" style="color:#64748b;text-decoration:none;">Esqueci minha senha</a>' +
      '</div>';

    // Eventos
    document.getElementById('impost-btn-google').addEventListener('click', function () {
      loginGoogle().then(function () { _removerModal(); });
    });
    document.getElementById('impost-btn-login-email').addEventListener('click', function () {
      var email = document.getElementById('impost-input-email').value;
      var senha = document.getElementById('impost-input-senha').value;
      loginEmail(email, senha).then(function () { _removerModal(); });
    });
    document.getElementById('impost-link-cadastro').addEventListener('click', function (e) {
      e.preventDefault();
      mostrarCadastro();
    });
    document.getElementById('impost-link-senha').addEventListener('click', function (e) {
      e.preventDefault();
      var email = document.getElementById('impost-input-email').value;
      recuperarSenha(email);
    });

    // Enter para enviar
    modal.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        document.getElementById('impost-btn-login-email').click();
      }
    });
  }

  // ─── Modal de Cadastro ───
  function mostrarCadastro() {
    _removerModal();
    var modal = _criarModal('impost-modal-cadastro');
    modal.querySelector('.impost-modal-corpo').innerHTML =
      '<div style="text-align:center;margin-bottom:24px;">' +
        '<h2 style="margin:0 0 4px;color:#0f172a;font-size:24px;">Criar conta</h2>' +
        '<p style="color:#64748b;margin:0;">Comece grátis no IMPOST.</p>' +
      '</div>' +

      '<input id="impost-input-nome" type="text" placeholder="Nome completo" style="' +
        'width:100%;padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;' +
        'margin-bottom:8px;font-size:14px;box-sizing:border-box;' +
      '">' +
      '<input id="impost-input-email-cad" type="email" placeholder="Email" style="' +
        'width:100%;padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;' +
        'margin-bottom:8px;font-size:14px;box-sizing:border-box;' +
      '">' +
      '<input id="impost-input-senha-cad" type="password" placeholder="Senha (mínimo 6 caracteres)" style="' +
        'width:100%;padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;' +
        'margin-bottom:16px;font-size:14px;box-sizing:border-box;' +
      '">' +

      '<button id="impost-btn-cadastrar" style="' +
        'width:100%;padding:12px;background:#0f172a;color:#fff;border:none;' +
        'border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;margin-bottom:12px;' +
      '">Criar conta</button>' +

      '<div style="text-align:center;font-size:13px;">' +
        '<a href="#" id="impost-link-voltar-login" style="color:#3b82f6;text-decoration:none;">Já tenho conta</a>' +
      '</div>';

    document.getElementById('impost-btn-cadastrar').addEventListener('click', function () {
      var nome  = document.getElementById('impost-input-nome').value;
      var email = document.getElementById('impost-input-email-cad').value;
      var senha = document.getElementById('impost-input-senha-cad').value;
      cadastrar(email, senha, nome).then(function () { _removerModal(); });
    });
    document.getElementById('impost-link-voltar-login').addEventListener('click', function (e) {
      e.preventDefault();
      mostrarLogin();
    });
  }

  // ─── Modal de Planos (Upgrade) ───
  function mostrarPlanos() {
    _removerModal();
    var modal = _criarModal('impost-modal-planos', '520px');
    var planosHTML = '';

    ['empresario', 'escritorio'].forEach(function (chave) {
      var p = PLANOS[chave];
      var atual = estado.plano === chave;
      var features = [];

      if (chave === 'empresario') {
        features = [
          'Simples Nacional + 1 regime (Real ou Presumido)',
          'Até 5 CNPJs cadastrados',
          'Exportação PDF',
          'Simuladores inclusos'
        ];
      } else {
        features = [
          'Todas as abas liberadas',
          'CNPJs ilimitados',
          'PDF com sua marca (white-label)',
          'Simuladores + Plano de Ação',
          'Suporte prioritário'
        ];
      }

      var featuresLI = features.map(function (f) {
        return '<li style="padding:4px 0;display:flex;align-items:start;gap:8px;">' +
          '<span style="color:#22c55e;font-weight:bold;">✓</span>' + f + '</li>';
      }).join('');

      planosHTML +=
        '<div style="' +
          'border:2px solid ' + (atual ? p.cor : '#e2e8f0') + ';border-radius:12px;' +
          'padding:24px;flex:1;min-width:200px;position:relative;' +
          (atual ? 'background:' + p.cor + '08;' : '') +
        '">' +
          (atual ? '<div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);' +
            'background:' + p.cor + ';color:#fff;padding:2px 12px;border-radius:20px;font-size:11px;' +
            'font-weight:700;text-transform:uppercase;">Seu Plano</div>' : '') +
          '<h3 style="margin:0 0 4px;color:#0f172a;">' + p.nome + '</h3>' +
          '<div style="font-size:28px;font-weight:800;color:#0f172a;margin-bottom:4px;">' +
            'R$ ' + p.preco + '<span style="font-size:14px;font-weight:400;color:#64748b;">/mês</span>' +
          '</div>' +
          '<p style="color:#64748b;font-size:13px;margin:0 0 16px;">' + p.descricao + '</p>' +
          '<ul style="list-style:none;padding:0;margin:0 0 20px;font-size:13px;color:#334155;">' +
            featuresLI +
          '</ul>' +
          (atual
            ? '<button disabled style="width:100%;padding:10px;border:1px solid #e2e8f0;' +
              'border-radius:8px;background:#f8fafc;color:#94a3b8;font-size:14px;cursor:default;">Plano atual</button>'
            : '<button class="impost-btn-assinar" data-plano="' + chave + '" style="' +
              'width:100%;padding:10px;background:' + p.cor + ';color:#fff;border:none;' +
              'border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;' +
              'transition:opacity .2s;" onmouseover="this.style.opacity=0.9" onmouseout="this.style.opacity=1"' +
              '>Assinar ' + p.nome + '</button>'
          ) +
        '</div>';
    });

    modal.querySelector('.impost-modal-corpo').innerHTML =
      '<div style="text-align:center;margin-bottom:24px;">' +
        '<h2 style="margin:0 0 4px;color:#0f172a;font-size:24px;">Escolha seu plano</h2>' +
        '<p style="color:#64748b;margin:0;">Desbloqueie todo o poder do IMPOST.</p>' +
      '</div>' +
      '<div style="display:flex;gap:16px;flex-wrap:wrap;">' + planosHTML + '</div>' +
      '<p style="text-align:center;color:#94a3b8;font-size:12px;margin:16px 0 0;">' +
        'Cancele a qualquer momento. Sem fidelidade.' +
      '</p>';

    // Eventos dos botões de assinar
    var btnsAssinar = modal.querySelectorAll('.impost-btn-assinar');
    btnsAssinar.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var plano = btn.getAttribute('data-plano');
        _processarAssinatura(plano);
      });
    });
  }

  // ─── Modal de Escolha de Regime (plano empresário) ───
  function mostrarEscolhaRegime() {
    _removerModal();
    var modal = _criarModal('impost-modal-regime');
    modal.querySelector('.impost-modal-corpo').innerHTML =
      '<div style="text-align:center;margin-bottom:24px;">' +
        '<h2 style="margin:0 0 4px;color:#0f172a;font-size:24px;">Escolha seu regime</h2>' +
        '<p style="color:#64748b;margin:0;">No plano Empresário, você acessa Simples Nacional + 1 regime tributário</p>' +
      '</div>' +
      '<div style="display:flex;gap:12px;">' +
        '<button class="impost-btn-regime" data-regime="lucro_real" style="' +
          'flex:1;padding:20px;border:2px solid #e2e8f0;border-radius:12px;background:#fff;' +
          'cursor:pointer;text-align:center;transition:border-color .2s;' +
        '">' +
          '<div style="font-size:32px;margin-bottom:8px;">📊</div>' +
          '<div style="font-weight:700;color:#0f172a;margin-bottom:4px;">Lucro Real</div>' +
          '<div style="font-size:12px;color:#64748b;">IRPJ, CSLL, PIS/COFINS não-cumulativo</div>' +
        '</button>' +
        '<button class="impost-btn-regime" data-regime="lucro_presumido" style="' +
          'flex:1;padding:20px;border:2px solid #e2e8f0;border-radius:12px;background:#fff;' +
          'cursor:pointer;text-align:center;transition:border-color .2s;' +
        '">' +
          '<div style="font-size:32px;margin-bottom:8px;">📋</div>' +
          '<div style="font-weight:700;color:#0f172a;margin-bottom:4px;">Lucro Presumido</div>' +
          '<div style="font-size:12px;color:#64748b;">Presunção de lucro sobre faturamento</div>' +
        '</button>' +
      '</div>' +
      '<p style="text-align:center;color:#94a3b8;font-size:12px;margin:16px 0 0;">' +
        'Você pode alterar depois nas configurações.' +
      '</p>';

    modal.querySelectorAll('.impost-btn-regime').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var regime = btn.getAttribute('data-regime');
        escolherRegime(regime).then(function () {
          _removerModal();
          _mostrarSucesso('Regime "' + (regime === 'lucro_real' ? 'Lucro Real' : 'Lucro Presumido') + '" selecionado!');
        });
      });
      btn.addEventListener('mouseover', function () { btn.style.borderColor = '#3b82f6'; });
      btn.addEventListener('mouseout', function () { btn.style.borderColor = '#e2e8f0'; });
    });
  }

  // ─── Processar assinatura (placeholder — integrar com gateway) ───
  function _processarAssinatura(plano) {
    // ═══════════════════════════════════════════════════════════════════
    // TODO: Integrar com gateway de pagamento (Stripe / Mercado Pago)
    //
    // O fluxo seria:
    // 1. Chamar backend/Cloud Function que cria sessão de pagamento
    // 2. Redirecionar para checkout do gateway
    // 3. Webhook do gateway confirma pagamento
    // 4. Cloud Function atualiza Firestore (plano + vencimento)
    //
    // Por enquanto, atualiza direto para teste:
    // ═══════════════════════════════════════════════════════════════════

    if (!estado.usuario) {
      mostrarLogin();
      return;
    }

    var vencimento = new Date();
    vencimento.setMonth(vencimento.getMonth() + 1); // +30 dias

    db.collection('usuarios').doc(estado.usuario.uid).update({
      plano: plano,
      vencimento: firebase.firestore.Timestamp.fromDate(vencimento),
      atualizado_em: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function () {
      estado.plano = plano;
      estado.perfil.plano = plano;
      estado.perfil.vencimento = vencimento;
      _removerModal();
      _aplicarRestricoes();
      _notificarListeners();
      _mostrarSucesso('Plano ' + PLANOS[plano].nome + ' ativado com sucesso!');

      // Se for empresário, pedir para escolher regime
      if (plano === 'empresario' && !estado.perfil.regime_escolhido) {
        setTimeout(function () { mostrarEscolhaRegime(); }, 1500);
      }
    }).catch(function (err) {
      console.error('[IMPOST] Erro ao ativar plano:', err);
      _mostrarErro('Erro ao processar assinatura. Tente novamente.');
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITÁRIOS INTERNOS
  // ═══════════════════════════════════════════════════════════════════════════

  function _limparCNPJ(cnpj) {
    return String(cnpj).replace(/\D/g, '');
  }

  function _validarCNPJ(cnpj) {
    cnpj = _limparCNPJ(cnpj);
    if (cnpj.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cnpj)) return false;

    var tamanho = cnpj.length - 2;
    var numeros = cnpj.substring(0, tamanho);
    var digitos = cnpj.substring(tamanho);
    var soma = 0;
    var pos = tamanho - 7;
    for (var i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2) pos = 9;
    }
    var resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado != digitos.charAt(0)) return false;

    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    for (var j = tamanho; j >= 1; j--) {
      soma += numeros.charAt(tamanho - j) * pos--;
      if (pos < 2) pos = 9;
    }
    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado != digitos.charAt(1)) return false;
    return true;
  }

  function _traduzirErroAuth(code) {
    var msgs = {
      'auth/email-already-in-use': 'Este email já está cadastrado.',
      'auth/invalid-email': 'Email inválido.',
      'auth/user-not-found': 'Usuário não encontrado.',
      'auth/wrong-password': 'Senha incorreta.',
      'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
      'auth/too-many-requests': 'Muitas tentativas. Aguarde um momento.',
      'auth/popup-closed-by-user': 'Login cancelado.',
      'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.'
    };
    return msgs[code] || 'Erro inesperado. Tente novamente.';
  }

  // ─── Criar modal base ───
  function _criarModal(id, maxWidth) {
    var overlay = document.createElement('div');
    overlay.id = id;
    overlay.style.cssText =
      'position:fixed;top:0;left:0;right:0;bottom:0;z-index:10000;' +
      'background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;' +
      'padding:20px;backdrop-filter:blur(4px);animation:impost-fade-in .2s ease;';

    var card = document.createElement('div');
    card.className = 'impost-modal-corpo';
    card.style.cssText =
      'background:#fff;border-radius:16px;padding:32px;width:100%;' +
      'max-width:' + (maxWidth || '400px') + ';max-height:90vh;overflow-y:auto;' +
      'box-shadow:0 25px 50px rgba(0,0,0,0.15);position:relative;';

    // Botão fechar
    var btnFechar = document.createElement('button');
    btnFechar.innerHTML = '✕';
    btnFechar.style.cssText =
      'position:absolute;top:12px;right:12px;background:none;border:none;' +
      'font-size:18px;color:#94a3b8;cursor:pointer;padding:4px 8px;';
    btnFechar.addEventListener('click', _removerModal);
    card.appendChild(btnFechar);

    overlay.appendChild(card);

    // Fechar clicando fora
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) _removerModal();
    });

    // ESC fecha
    document.addEventListener('keydown', function handler(e) {
      if (e.key === 'Escape') {
        _removerModal();
        document.removeEventListener('keydown', handler);
      }
    });

    document.body.appendChild(overlay);

    // Injetar animação CSS (uma vez)
    if (!document.getElementById('impost-modal-css')) {
      var style = document.createElement('style');
      style.id = 'impost-modal-css';
      style.textContent =
        '@keyframes impost-fade-in{from{opacity:0}to{opacity:1}}' +
        '.impost-toast{position:fixed;top:20px;right:20px;z-index:10001;padding:12px 20px;' +
        'border-radius:8px;color:#fff;font-size:14px;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,0.15);' +
        'animation:impost-fade-in .3s ease,impost-fade-in .3s ease 2.7s reverse forwards;}';
      document.head.appendChild(style);
    }

    return overlay;
  }

  function _removerModal() {
    ['impost-modal-login', 'impost-modal-cadastro', 'impost-modal-planos', 'impost-modal-regime']
      .forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.remove();
      });
  }

  // ─── Toasts (notificações) ───
  function _mostrarErro(msg) {
    _toast(msg, '#ef4444');
  }

  function _mostrarSucesso(msg) {
    _toast(msg, '#22c55e');
  }

  function _mostrarUpgrade(msg) {
    _toast(msg + ' 🔒', '#f59e0b');
  }

  function _toast(msg, cor) {
    var toast = document.createElement('div');
    toast.className = 'impost-toast';
    toast.style.background = cor;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function () { if (toast.parentNode) toast.remove(); }, 3200);
  }

  // ─── Listeners para mudança de estado ───
  function onMudancaEstado(callback) {
    estado.listeners.push(callback);
  }

  function _notificarListeners() {
    estado.listeners.forEach(function (cb) {
      try { cb(estado); } catch (e) { console.error(e); }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INICIALIZAÇÃO — OBSERVER DE AUTENTICAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════

  auth.onAuthStateChanged(function (user) {
    estado.carregando = true;

    if (user) {
      estado.usuario = user;
      _carregarPerfil(user.uid).then(function () {
        estado.carregando = false;
        _aplicarRestricoes();
        _atualizarUIUsuario();
        _notificarListeners();
        console.log('[IMPOST] Usuário logado:', user.email, '| Plano:', estado.plano);
      });
    } else {
      estado.usuario = null;
      estado.perfil = null;
      estado.plano = 'free';
      estado.carregando = false;
      _aplicarRestricoes();
      _atualizarUIUsuario();
      _notificarListeners();
      console.log('[IMPOST] Nenhum usuário logado');
    }
  });

  // ─── Atualizar UI do usuário logado/deslogado ───
  function _atualizarUIUsuario() {
    var btnLogin  = document.getElementById('impost-btn-entrar');
    var btnLogout = document.getElementById('impost-btn-sair');
    var nomeUser  = document.getElementById('impost-nome-usuario');
    var avatarEl  = document.getElementById('impost-avatar');

    if (estado.usuario) {
      if (btnLogin)  btnLogin.style.display = 'none';
      if (btnLogout) btnLogout.style.display = '';
      if (nomeUser)  nomeUser.textContent = estado.usuario.displayName || estado.usuario.email;
      if (avatarEl && estado.usuario.photoURL) {
        avatarEl.src = estado.usuario.photoURL;
        avatarEl.style.display = '';
      }
    } else {
      if (btnLogin)  btnLogin.style.display = '';
      if (btnLogout) btnLogout.style.display = 'none';
      if (nomeUser)  nomeUser.textContent = '';
      if (avatarEl)  avatarEl.style.display = 'none';
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // API PÚBLICA — window.IMPOST_ACESSO
  // ═══════════════════════════════════════════════════════════════════════════

  window.IMPOST_ACESSO = {
    // Auth
    loginGoogle:      loginGoogle,
    loginEmail:       loginEmail,
    cadastrar:        cadastrar,
    logout:           logout,
    recuperarSenha:   recuperarSenha,

    // Modais
    mostrarLogin:     mostrarLogin,
    mostrarCadastro:  mostrarCadastro,
    mostrarPlanos:    mostrarPlanos,
    mostrarEscolhaRegime: mostrarEscolhaRegime,

    // Controle de acesso
    podeAcessarAba:   podeAcessarAba,
    getAbasLiberadas: getAbasLiberadas,
    podeAdicionarCNPJ: podeAdicionarCNPJ,
    adicionarCNPJ:    adicionarCNPJ,
    removerCNPJ:      removerCNPJ,
    escolherRegime:   escolherRegime,

    // Estado
    getEstado:        function () { return estado; },
    getPlano:         function () { return estado.plano; },
    getUsuario:       function () { return estado.usuario; },
    getPerfil:        function () { return estado.perfil; },
    isLogado:         function () { return !!estado.usuario; },
    isCarregando:     function () { return estado.carregando; },
    onMudancaEstado:  onMudancaEstado,

    // Config
    PLANOS:           PLANOS,
    MAPA_ABAS:        MAPA_ABAS
  };

  console.log('[IMPOST] Controle de Acesso carregado');
})();
