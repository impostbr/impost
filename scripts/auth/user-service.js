// ═══════════════════════════════════════════════════════════════════════
// IMPOST. — User Service (v5 — conversão)
// Arquivo: scripts/auth/user-service.js
// Depende de: auth-guard.js (carregado antes)
// ═══════════════════════════════════════════════════════════════════════
//
// Planos: free | pessoal (R$14,90) | pro (R$69,90) | escritorio (R$199,90) | trial
//
// Ao clicar em um card bloqueado, abre um modal de venda específico
// para aquele módulo. O modal é focado em CONVERSÃO: mostra o valor
// em dinheiro que o usuário está deixando na mesa, não features técnicas.
//
// Cards com data-upsell-key → modal rico de venda
// Cards sem data-upsell-key → modal genérico (fallback)
//
// API pública: window.IMPOST_PLANO
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
    // DADOS DE UPSELL — COPY FOCADO EM CONVERSÃO
    //
    // Cada key = valor do atributo data-upsell-key no HTML.
    // Sem data-upsell-key → usa modal genérico.
    //
    // Princípios do copy:
    // 1. Headline = resultado que o usuário quer (não o que a ferramenta faz)
    // 2. Subtítulo = prova com número concreto
    // 3. Bullets = benefícios em linguagem de resultado
    // 4. CTA = ação clara com preço visível
    // ══════════════════════════════════════════════════════════════

    var UPSELL_DATA = {

        "estudo-pf": {
            emoji: "👤",
            corGradiente: "linear-gradient(135deg, #1565c0, #1e88e5)",
            plano: "pessoal",
            planoNome: "Pessoal",
            titulo: "Descubra quanto você perde por não simular",
            subtitulo: "Brasileiros pagam em média 27,5% de IR quando poderiam pagar 15% ou menos escolhendo o modelo certo.",
            destaque: {
                numero: "R$ 8.400",
                texto: "é quanto um profissional com renda de R$ 10 mil/mês pode economizar por ano escolhendo entre CLT, PJ ou Autônomo"
            },
            bullets: [
                "Simule CLT, Autônomo RPA, MEI e PJ lado a lado — veja o líquido real de cada modelo",
                "IRPF 2026 com todas as faixas, deduções e a nova isenção da Lei 14.663/2023",
                "Compare o custo total para o tomador — essencial para negociar sua remuneração",
                "Projeção anual completa: 13º, férias, FGTS, INSS patronal e rescisória"
            ],
            ctaTexto: "Desbloquear por R$ 14,90/mês",
            ctaUrl: "planos.html?highlight=pessoal",
            rodape: "Cancele quando quiser · Sem fidelidade · Acesso imediato"
        },

        "estudo-lucro-real": {
            emoji: "📊",
            corGradiente: "linear-gradient(135deg, #5e35b1, #7e57c2)",
            plano: "pro",
            planoNome: "Pro",
            titulo: "Sua empresa pode estar no regime errado",
            subtitulo: "Empresas com margem abaixo de 20% frequentemente pagam mais no Presumido do que pagariam no Lucro Real.",
            destaque: {
                numero: "18% a 35%",
                texto: "é a economia média que nossos usuários encontram ao comparar regimes com dados reais da própria empresa"
            },
            bullets: [
                "DRE fiscal completa com LALUR — veja exatamente onde seus impostos podem ser menores",
                "PIS e COFINS não-cumulativos com créditos reais: insumos, energia, aluguel, frete",
                "Compensação de prejuízos fiscais — transforme trimestres ruins em economia futura",
                "Comparação automática com Presumido e Simples — tenha certeza da melhor escolha"
            ],
            ctaTexto: "Desbloquear por R$ 69,90/mês",
            ctaUrl: "planos.html?highlight=pro",
            rodape: "Inclui todos os estudos · Cancele quando quiser · Acesso imediato"
        },

        "estudo-lucro-presumido": {
            emoji: "📋",
            corGradiente: "linear-gradient(135deg, #ef6c00, #fb8c00)",
            plano: "pro",
            planoNome: "Pro",
            titulo: "Presumido parece simples, mas o cálculo errado custa caro",
            subtitulo: "O percentual de presunção varia de 1,6% a 32% dependendo da atividade. Usar o errado significa pagar imposto sobre uma base maior do que deveria.",
            destaque: {
                numero: "R$ 2.100/mês",
                texto: "é a diferença média entre usar presunção de 32% quando sua atividade permite 8%"
            },
            bullets: [
                "Identifica automaticamente o percentual correto para sua atividade — sem erro",
                "Apuração trimestral: IRPJ, CSLL, PIS e COFINS com os valores exatos",
                "Descubra o ponto de virada: em qual margem de lucro o Presumido perde pro Real",
                "Relatório pronto para levar ao seu contador — economize horas de reunião"
            ],
            ctaTexto: "Desbloquear por R$ 69,90/mês",
            ctaUrl: "planos.html?highlight=pro",
            rodape: "Inclui todos os estudos · Cancele quando quiser · Acesso imediato"
        },

        "estudo-simples": {
            emoji: "📘",
            corGradiente: "linear-gradient(135deg, #0277bd, #039be5)",
            plano: "pro",
            planoNome: "Pro",
            titulo: "Simples Nacional nem sempre é o mais simples para o bolso",
            subtitulo: "Acima de R$ 180 mil de faturamento, a alíquota efetiva do Simples pode ultrapassar a do Lucro Presumido. Você sabe em qual faixa está?",
            destaque: {
                numero: "Fator R",
                texto: "pode reduzir sua alíquota de 15,5% para 6% — mas só se sua folha de pagamento for ≥ 28% do faturamento"
            },
            bullets: [
                "Enquadramento correto nos Anexos I a V — cada anexo tem alíquotas completamente diferentes",
                "Alíquota efetiva REAL pela fórmula oficial — não a nominal da tabela que engana",
                "Análise do Fator R: descubra se compensa aumentar a folha para cair de anexo",
                "Partilha dos 8 tributos dentro do DAS — saiba exatamente o que está pagando"
            ],
            ctaTexto: "Desbloquear por R$ 69,90/mês",
            ctaUrl: "planos.html?highlight=pro",
            rodape: "Inclui todos os estudos · Cancele quando quiser · Acesso imediato"
        }
    };

    // ══════════════════════════════════════════════════════════════
    // 1. VERIFICAÇÃO DE PLANO
    // ══════════════════════════════════════════════════════════════

    function getDadosUsuario() {
        return window.IMPOST_USER_DATA || {};
    }

    function getPlano() {
        return getDadosUsuario().plano || "free";
    }

    function getNomeUsuario() {
        var dados = getDadosUsuario();
        return dados.nome || (window.IMPOST_USER && window.IMPOST_USER.email) || "Usuário";
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
        var plano = getPlano();
        if (plano === "pro" || plano === "escritorio") return true;
        if (plano === "trial") return trialValido();
        return false;
    }

    function temAcessoPessoal() {
        var plano = getPlano();
        if (plano === "pessoal" || plano === "pro" || plano === "escritorio") return true;
        if (plano === "trial") return trialValido();
        return false;
    }

    function getLimitePDF() {
        var plano = getPlano();
        if (plano === "pro" || plano === "escritorio") return Infinity;
        if (plano === "trial") return trialValido() ? Infinity : 5;
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
    // 2. CSS
    // ══════════════════════════════════════════════════════════════

    function injetarCSS() {
        if (CSS_INJETADO) return;
        CSS_INJETADO = true;

        var s = document.createElement("style");
        s.id = "impost-user-service-css";
        s.textContent =

            // ─── OVERLAY (compartilhado) ───
            ".ius-overlay {" +
                "position:fixed;inset:0;z-index:99999;" +
                "display:flex;align-items:center;justify-content:center;" +
                "padding:20px;" +
                "opacity:0;visibility:hidden;" +
                "transition:opacity .3s,visibility .3s;" +
            "}" +
            ".ius-overlay.ius-vis { opacity:1;visibility:visible; }" +
            ".ius-backdrop {" +
                "position:absolute;inset:0;" +
                "background:rgba(10,20,30,.6);" +
                "backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);" +
            "}" +

            // ─── MODAL CARD ───
            ".ius-modal {" +
                "position:relative;z-index:1;" +
                "background:#fff;border-radius:20px;" +
                "max-width:460px;width:100%;" +
                "box-shadow:0 25px 80px rgba(0,0,0,.2);" +
                "transform:scale(.94) translateY(16px);" +
                "transition:transform .4s cubic-bezier(.34,1.56,.64,1);" +
                "max-height:92vh;overflow-y:auto;" +
                "font-family:'Plus Jakarta Sans','Inter',system-ui,sans-serif;" +
            "}" +
            ".ius-overlay.ius-vis .ius-modal { transform:scale(1) translateY(0); }" +

            // ─── FECHAR ───
            ".ius-close {" +
                "position:absolute;top:14px;right:14px;" +
                "width:32px;height:32px;border-radius:50%;" +
                "border:none;background:rgba(255,255,255,.15);" +
                "display:flex;align-items:center;justify-content:center;" +
                "cursor:pointer;color:rgba(255,255,255,.7);font-size:16px;" +
                "transition:all .2s;z-index:2;" +
            "}" +
            ".ius-close:hover { background:rgba(255,255,255,.25);color:#fff; }" +

            // ─── HEADER (gradiente com emoji) ───
            ".ius-header {" +
                "padding:36px 32px 28px;" +
                "text-align:center;position:relative;" +
                "border-radius:20px 20px 0 0;" +
            "}" +
            ".ius-header::after {" +
                "content:'';position:absolute;bottom:-1px;left:0;right:0;" +
                "height:20px;background:#fff;border-radius:20px 20px 0 0;" +
            "}" +
            ".ius-emoji {" +
                "font-size:42px;margin-bottom:16px;" +
                "display:block;line-height:1;" +
                "filter:drop-shadow(0 4px 12px rgba(0,0,0,.15));" +
            "}" +
            ".ius-titulo {" +
                "font-size:1.35rem;font-weight:800;color:#fff;" +
                "line-height:1.25;letter-spacing:-.3px;margin:0;" +
            "}" +

            // ─── BODY ───
            ".ius-body { padding:20px 32px 0; }" +

            // ─── SUBTÍTULO ───
            ".ius-sub {" +
                "font-size:.9rem;color:#4a5568;line-height:1.65;" +
                "text-align:center;margin-bottom:20px;" +
            "}" +

            // ─── BLOCO DESTAQUE (número grande) ───
            ".ius-destaque {" +
                "background:linear-gradient(135deg,#f0fdf4,#ecfdf5);" +
                "border:1.5px solid #bbf7d0;" +
                "border-radius:14px;padding:20px 24px;" +
                "text-align:center;margin-bottom:24px;" +
            "}" +
            ".ius-destaque-num {" +
                "font-size:2rem;font-weight:800;letter-spacing:-.5px;" +
                "margin-bottom:4px;" +
            "}" +
            ".ius-destaque-num.ius-cor-pessoal { color:#1565c0; }" +
            ".ius-destaque-num.ius-cor-pro { color:#1b5e20; }" +
            ".ius-destaque-txt {" +
                "font-size:.82rem;color:#4a5568;line-height:1.5;" +
            "}" +

            // ─── BULLETS ───
            ".ius-bullets { list-style:none;padding:0;margin:0 0 24px; }" +
            ".ius-bullets li {" +
                "display:flex;align-items:flex-start;gap:10px;" +
                "padding:9px 0;font-size:.86rem;color:#1a2332;" +
                "line-height:1.5;border-bottom:1px solid #f1f5f9;" +
            "}" +
            ".ius-bullets li:last-child { border:none; }" +
            ".ius-check {" +
                "flex-shrink:0;width:20px;height:20px;border-radius:50%;" +
                "display:flex;align-items:center;justify-content:center;" +
                "font-size:11px;font-weight:700;margin-top:1px;" +
            "}" +
            ".ius-check.ius-chk-pessoal { background:#e3f2fd;color:#1565c0; }" +
            ".ius-check.ius-chk-pro { background:#e8f5e9;color:#1b5e20; }" +

            // ─── FOOTER ───
            ".ius-footer { padding:0 32px 28px; }" +

            // ─── CTA BOTÃO ───
            ".ius-cta {" +
                "display:flex;align-items:center;justify-content:center;gap:8px;" +
                "width:100%;padding:16px;border-radius:14px;border:none;" +
                "font-size:1rem;font-weight:700;color:#fff;cursor:pointer;" +
                "transition:all .2s;text-decoration:none;letter-spacing:-.2px;" +
                "font-family:inherit;" +
            "}" +
            ".ius-cta-pessoal {" +
                "background:linear-gradient(135deg,#1565c0,#1e88e5);" +
                "box-shadow:0 4px 20px rgba(21,101,192,.35);" +
            "}" +
            ".ius-cta-pessoal:hover {" +
                "transform:translateY(-2px);box-shadow:0 8px 28px rgba(21,101,192,.45);" +
            "}" +
            ".ius-cta-pro {" +
                "background:linear-gradient(135deg,#1b5e20,#2e7d32);" +
                "box-shadow:0 4px 20px rgba(27,94,32,.35);" +
            "}" +
            ".ius-cta-pro:hover {" +
                "transform:translateY(-2px);box-shadow:0 8px 28px rgba(27,94,32,.45);" +
            "}" +

            // ─── RODAPÉ ───
            ".ius-rodape {" +
                "text-align:center;font-size:.76rem;color:#94a3b8;" +
                "margin-top:12px;letter-spacing:.2px;" +
            "}" +

            // ─── VOLTAR ───
            ".ius-voltar {" +
                "display:block;width:100%;text-align:center;margin-top:14px;" +
                "font-size:.84rem;color:#94a3b8;background:none;border:none;" +
                "cursor:pointer;font-family:inherit;transition:color .2s;" +
            "}" +
            ".ius-voltar:hover { color:#475569; }" +

            // ─── BADGE PLANO ───
            ".ius-plan-tag {" +
                "display:inline-flex;align-items:center;gap:5px;" +
                "padding:5px 12px;border-radius:50px;" +
                "font-size:.7rem;font-weight:700;letter-spacing:.5px;" +
                "text-transform:uppercase;margin-bottom:8px;" +
            "}" +
            ".ius-plan-tag-pessoal { background:#e3f2fd;color:#0d47a1;border:1px solid #90caf9; }" +
            ".ius-plan-tag-pro { background:#e8f5e9;color:#1b5e20;border:1px solid #a5d6a7; }" +

            // ═══ CADEADOS NOS CARDS DO DASHBOARD ═══

            // ─── data-pro bloqueado ───
            "[data-pro-bloqueado] { position:relative;cursor:pointer !important; }" +
            ".ius-badge-pro {" +
                "position:absolute;top:10px;right:10px;z-index:10;" +
                "display:inline-flex;align-items:center;gap:4px;" +
                "padding:5px 12px;border-radius:20px;" +
                "background:linear-gradient(135deg,#1b5e20,#2e7d32);" +
                "color:#fff;font-size:.7rem;font-weight:700;letter-spacing:.4px;" +
                "font-family:'Plus Jakarta Sans','Inter',sans-serif;" +
                "box-shadow:0 2px 10px rgba(27,94,32,.3);" +
                "pointer-events:auto;cursor:pointer;transition:transform .15s;" +
            "}" +
            ".ius-badge-pro:hover { transform:scale(1.06); }" +

            // ─── data-pro inline ───
            ".ius-inline-pro {" +
                "display:inline-flex;align-items:center;gap:4px;" +
                "margin-left:6px;padding:2px 8px;border-radius:12px;" +
                "background:#e8f5e9;color:#1b5e20;font-size:.7rem;font-weight:700;" +
                "letter-spacing:.3px;pointer-events:auto;cursor:pointer;" +
                "font-family:'Plus Jakarta Sans','Inter',sans-serif;" +
            "}" +
            ".ius-inline-pro:hover { background:#c8e6c9; }" +

            // ─── data-pessoal bloqueado ───
            "[data-pessoal-bloqueado] { position:relative;cursor:pointer !important; }" +
            ".ius-badge-pessoal {" +
                "position:absolute;top:10px;right:10px;z-index:10;" +
                "display:inline-flex;align-items:center;gap:4px;" +
                "padding:5px 12px;border-radius:20px;" +
                "background:linear-gradient(135deg,#1565c0,#1e88e5);" +
                "color:#fff;font-size:.7rem;font-weight:700;letter-spacing:.4px;" +
                "font-family:'Plus Jakarta Sans','Inter',sans-serif;" +
                "box-shadow:0 2px 10px rgba(21,101,192,.3);" +
                "pointer-events:auto;cursor:pointer;transition:transform .15s;" +
            "}" +
            ".ius-badge-pessoal:hover { transform:scale(1.06); }" +

            // ─── data-pessoal inline ───
            ".ius-inline-pessoal {" +
                "display:inline-flex;align-items:center;gap:4px;" +
                "margin-left:6px;padding:2px 8px;border-radius:12px;" +
                "background:#e3f2fd;color:#0d47a1;font-size:.7rem;font-weight:700;" +
                "letter-spacing:.3px;pointer-events:auto;cursor:pointer;" +
                "font-family:'Plus Jakarta Sans','Inter',sans-serif;" +
            "}" +
            ".ius-inline-pessoal:hover { background:#bbdefb; }" +

            // ─── MODAL GENÉRICO (fallback) ───
            ".ius-gen-header {" +
                "background:linear-gradient(135deg,#1b5e20,#2e7d32,#388e3c);" +
                "padding:28px 28px 24px;text-align:center;position:relative;" +
                "border-radius:20px 20px 0 0;" +
            "}" +
            ".ius-gen-header::after {" +
                "content:'';position:absolute;bottom:-1px;left:0;right:0;" +
                "height:20px;background:#fff;border-radius:20px 20px 0 0;" +
            "}" +
            ".ius-gen-header h2 {" +
                "font-size:1.3rem;font-weight:700;color:#fff;margin:0 0 6px;" +
            "}" +
            ".ius-gen-header p { font-size:.88rem;color:rgba(255,255,255,.8);margin:0; }" +
            ".ius-gen-body { padding:20px 28px 8px; }" +
            ".ius-gen-msg {" +
                "font-size:.9rem;color:#374037;line-height:1.6;margin-bottom:20px;text-align:center;" +
            "}" +
            ".ius-gen-features { list-style:none;padding:0;margin:0 0 20px; }" +
            ".ius-gen-features li {" +
                "display:flex;align-items:center;gap:10px;padding:8px 0;" +
                "font-size:.85rem;color:#4a5c4a;border-bottom:1px solid #f0f0f0;" +
            "}" +
            ".ius-gen-features li:last-child { border:none; }" +
            ".ius-gen-features li svg { flex-shrink:0;color:#43a047; }" +
            ".ius-gen-footer { padding:8px 28px 24px;text-align:center; }" +
            ".ius-gen-btn {" +
                "display:inline-flex;align-items:center;justify-content:center;gap:8px;" +
                "width:100%;padding:14px 24px;" +
                "background:linear-gradient(135deg,#1b5e20,#2e7d32);" +
                "color:#fff;font-size:.95rem;font-weight:700;" +
                "border:none;border-radius:12px;cursor:pointer;" +
                "font-family:inherit;transition:all .2s;" +
                "box-shadow:0 4px 14px rgba(27,94,32,.3);" +
            "}" +
            ".ius-gen-btn:hover { transform:translateY(-2px);box-shadow:0 6px 20px rgba(27,94,32,.4); }" +

            // ─── RESPONSIVO ───
            "@media(max-width:768px){" +
                ".ius-modal{padding:0;margin:12px;}" +
                ".ius-header{padding:28px 24px 22px;}" +
                ".ius-body{padding:16px 24px 0;}" +
                ".ius-footer{padding:0 24px 24px;}" +
                ".ius-titulo{font-size:1.15rem;}" +
                ".ius-destaque-num{font-size:1.6rem;}" +
            "}";

        document.head.appendChild(s);
    }

    // ══════════════════════════════════════════════════════════════
    // 3. MODAL GENÉRICO (fallback para cards sem data-upsell-key)
    // ══════════════════════════════════════════════════════════════

    function criarModalGenerico() {
        if (document.getElementById("ius-gen-overlay")) return;

        var o = document.createElement("div");
        o.id = "ius-gen-overlay";
        o.className = "ius-overlay";

        var check = '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 3L6 11l-3-3"/></svg>';

        o.innerHTML =
            '<div class="ius-backdrop" id="ius-gen-backdrop"></div>' +
            '<div class="ius-modal">' +
                '<div class="ius-gen-header">' +
                    '<h2>Recurso exclusivo</h2>' +
                    '<p>Desbloqueie o potencial do IMPOST.</p>' +
                '</div>' +
                '<div class="ius-gen-body">' +
                    '<p class="ius-gen-msg" id="ius-gen-msg">' +
                        'Este recurso faz parte de um plano pago do <strong>IMPOST.</strong>' +
                    '</p>' +
                    '<ul class="ius-gen-features">' +
                        '<li>' + check + 'Estudos completos: Lucro Real, Presumido e Simples</li>' +
                        '<li>' + check + 'Estudo Pessoa Física: CLT, RPA, MEI, PJ</li>' +
                        '<li>' + check + 'Relatórios em PDF para seu contador</li>' +
                        '<li>' + check + 'A partir de R$ 14,90/mês</li>' +
                    '</ul>' +
                '</div>' +
                '<div class="ius-gen-footer">' +
                    '<button class="ius-gen-btn" id="ius-gen-cta">Ver planos e assinar</button>' +
                    '<button class="ius-voltar" id="ius-gen-voltar">Continuar no plano Free</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(o);

        document.getElementById("ius-gen-cta").addEventListener("click", function () {
            window.location.href = PLANOS_URL;
        });
        document.getElementById("ius-gen-voltar").addEventListener("click", fecharGenerico);
        document.getElementById("ius-gen-backdrop").addEventListener("click", fecharGenerico);
    }

    function mostrarModalUpgrade(mensagem) {
        injetarCSS();
        criarModalGenerico();

        var msg = document.getElementById("ius-gen-msg");
        if (msg && mensagem) {
            msg.innerHTML = 'O recurso <strong>\u201C' + mensagem + '\u201D</strong> faz parte de um plano pago do <strong>IMPOST.</strong>';
        } else if (msg) {
            msg.innerHTML = 'Este recurso faz parte de um plano pago do <strong>IMPOST.</strong>';
        }

        registrarEscape();

        var o = document.getElementById("ius-gen-overlay");
        if (o) requestAnimationFrame(function () { o.classList.add("ius-vis"); });
    }

    function fecharGenerico() {
        var o = document.getElementById("ius-gen-overlay");
        if (o) o.classList.remove("ius-vis");
        limparEscape();
    }

    // ══════════════════════════════════════════════════════════════
    // 4. MODAL RICO DE UPSELL (por módulo — foco em conversão)
    // ══════════════════════════════════════════════════════════════

    function criarModalUpsell() {
        if (document.getElementById("ius-upsell-overlay")) return;

        var o = document.createElement("div");
        o.id = "ius-upsell-overlay";
        o.className = "ius-overlay";
        o.setAttribute("role", "dialog");
        o.setAttribute("aria-modal", "true");

        o.innerHTML =
            '<div class="ius-backdrop" id="ius-upsell-backdrop"></div>' +
            '<div class="ius-modal">' +

                // Header (cor dinâmica via JS)
                '<div class="ius-header" id="ius-upsell-header">' +
                    '<button class="ius-close" id="ius-upsell-close" aria-label="Fechar">\u2715</button>' +
                    '<span class="ius-emoji" id="ius-upsell-emoji"></span>' +
                    '<h2 class="ius-titulo" id="ius-upsell-titulo"></h2>' +
                '</div>' +

                // Body
                '<div class="ius-body">' +

                    // Tag do plano
                    '<div style="text-align:center;margin-bottom:12px;">' +
                        '<span class="ius-plan-tag" id="ius-upsell-tag"></span>' +
                    '</div>' +

                    // Subtítulo
                    '<p class="ius-sub" id="ius-upsell-sub"></p>' +

                    // Bloco destaque com número grande
                    '<div class="ius-destaque">' +
                        '<div class="ius-destaque-num" id="ius-upsell-dest-num"></div>' +
                        '<div class="ius-destaque-txt" id="ius-upsell-dest-txt"></div>' +
                    '</div>' +

                    // Bullets
                    '<ul class="ius-bullets" id="ius-upsell-bullets"></ul>' +

                '</div>' +

                // Footer
                '<div class="ius-footer">' +
                    '<a class="ius-cta" id="ius-upsell-cta" href="#">' +
                        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>' +
                        '<span id="ius-upsell-cta-txt"></span>' +
                    '</a>' +
                    '<div class="ius-rodape" id="ius-upsell-rodape"></div>' +
                    '<button class="ius-voltar" id="ius-upsell-voltar">Voltar ao dashboard</button>' +
                '</div>' +

            '</div>';

        document.body.appendChild(o);

        document.getElementById("ius-upsell-close").addEventListener("click", fecharUpsell);
        document.getElementById("ius-upsell-voltar").addEventListener("click", fecharUpsell);
        document.getElementById("ius-upsell-backdrop").addEventListener("click", fecharUpsell);
    }

    function mostrarUpsell(key) {
        var d = UPSELL_DATA[key];
        if (!d) { mostrarModalUpgrade(key); return; }

        injetarCSS();
        criarModalUpsell();

        var isPro = (d.plano === "pro");
        var corCheck = isPro ? "ius-chk-pro" : "ius-chk-pessoal";

        // Header
        document.getElementById("ius-upsell-header").style.background = d.corGradiente;
        document.getElementById("ius-upsell-emoji").textContent = d.emoji;
        document.getElementById("ius-upsell-titulo").textContent = d.titulo;

        // Tag
        var tag = document.getElementById("ius-upsell-tag");
        tag.className = "ius-plan-tag " + (isPro ? "ius-plan-tag-pro" : "ius-plan-tag-pessoal");
        tag.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Plano ' + d.planoNome;

        // Textos
        document.getElementById("ius-upsell-sub").textContent = d.subtitulo;

        var numEl = document.getElementById("ius-upsell-dest-num");
        numEl.textContent = d.destaque.numero;
        numEl.className = "ius-destaque-num " + (isPro ? "ius-cor-pro" : "ius-cor-pessoal");
        document.getElementById("ius-upsell-dest-txt").textContent = d.destaque.texto;

        // Bullets
        var ul = document.getElementById("ius-upsell-bullets");
        ul.innerHTML = "";
        for (var i = 0; i < d.bullets.length; i++) {
            var li = document.createElement("li");
            li.innerHTML = '<span class="ius-check ' + corCheck + '">\u2713</span><span>' + d.bullets[i] + '</span>';
            ul.appendChild(li);
        }

        // CTA
        var cta = document.getElementById("ius-upsell-cta");
        cta.className = "ius-cta " + (isPro ? "ius-cta-pro" : "ius-cta-pessoal");
        cta.href = BASE_PATH + "pages/" + d.ctaUrl;
        document.getElementById("ius-upsell-cta-txt").textContent = d.ctaTexto;

        // Rodapé
        document.getElementById("ius-upsell-rodape").textContent = d.rodape;

        registrarEscape();

        var o = document.getElementById("ius-upsell-overlay");
        if (o) requestAnimationFrame(function () { o.classList.add("ius-vis"); });
        document.body.style.overflow = "hidden";
    }

    function fecharUpsell() {
        var o = document.getElementById("ius-upsell-overlay");
        if (o) o.classList.remove("ius-vis");
        document.body.style.overflow = "";
        limparEscape();
    }

    // ══════════════════════════════════════════════════════════════
    // 5. ESCAPE HANDLER
    // ══════════════════════════════════════════════════════════════

    function registrarEscape() {
        if (escapeHandler) return;
        escapeHandler = function (e) {
            if (e.key === "Escape") { fecharUpsell(); fecharGenerico(); }
        };
        document.addEventListener("keydown", escapeHandler);
    }

    function limparEscape() {
        if (!escapeHandler) return;
        // Só limpa se nenhum modal estiver aberto
        var u = document.getElementById("ius-upsell-overlay");
        var g = document.getElementById("ius-gen-overlay");
        var uAberto = u && u.classList.contains("ius-vis");
        var gAberto = g && g.classList.contains("ius-vis");
        if (!uAberto && !gAberto) {
            document.removeEventListener("keydown", escapeHandler);
            escapeHandler = null;
        }
    }

    // ══════════════════════════════════════════════════════════════
    // 6. BLOQUEIO AUTOMÁTICO DE CARDS
    // ══════════════════════════════════════════════════════════════

    function abrirModalParaElemento(el) {
        var key = el.getAttribute("data-upsell-key");
        if (key && UPSELL_DATA[key]) {
            mostrarUpsell(key);
        } else {
            var msg = el.getAttribute("data-pro-msg") || el.getAttribute("data-pessoal-msg") || "";
            mostrarModalUpgrade(msg);
        }
    }

    var SVG_CADEADO =
        '<svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
            '<rect x="2" y="5" width="6" height="5" rx="1"/>' +
            '<path d="M3 5V3.5a2 2 0 0 1 4 0V5"/>' +
        '</svg>';

    function bloquearElemento(el, tipo) {
        var attrBloqueado = "data-" + tipo + "-bloqueado";
        if (el.hasAttribute(attrBloqueado)) return;
        el.setAttribute(attrBloqueado, "true");

        var tagName = el.tagName.toLowerCase();
        var isInline = (tagName === "a" || tagName === "button" || tagName === "span");
        var label = tipo === "pro" ? " PRO" : " PESSOAL";
        var badgeClass = tipo === "pro" ? "ius-badge-pro" : "ius-badge-pessoal";
        var inlineClass = tipo === "pro" ? "ius-inline-pro" : "ius-inline-pessoal";

        var handler = function (e) {
            e.preventDefault();
            e.stopPropagation();
            abrirModalParaElemento(el);
        };

        if (isInline) {
            var bi = document.createElement("span");
            bi.className = inlineClass;
            bi.innerHTML = SVG_CADEADO + label;
            el.appendChild(bi);
            bi.addEventListener("click", handler);
            el.addEventListener("click", handler);
        } else {
            var cs = window.getComputedStyle(el).position;
            if (cs === "static") el.style.position = "relative";

            var b = document.createElement("div");
            b.className = badgeClass;
            b.innerHTML = SVG_CADEADO + label;
            el.appendChild(b);
            b.addEventListener("click", handler);
            el.addEventListener("click", handler);
        }
    }

    function aplicarBloqueiosPro() {
        if (temAcessoPro()) return;
        injetarCSS();

        var els = document.querySelectorAll('[data-pro="true"]');
        for (var i = 0; i < els.length; i++) bloquearElemento(els[i], "pro");

        if (els.length > 0) console.log("[IMPOST] " + els.length + " card(s) bloqueado(s) — Pro");
    }

    function aplicarBloqueiosPessoal() {
        if (temAcessoPessoal()) return;
        injetarCSS();

        var els = document.querySelectorAll('[data-pessoal="true"]');
        for (var i = 0; i < els.length; i++) bloquearElemento(els[i], "pessoal");

        if (els.length > 0) console.log("[IMPOST] " + els.length + " card(s) bloqueado(s) — Pessoal");
    }

    // ══════════════════════════════════════════════════════════════
    // 7. API PÚBLICA
    // ══════════════════════════════════════════════════════════════

    window.IMPOST_PLANO = {
        temAcessoPro: temAcessoPro,
        temAcessoPessoal: temAcessoPessoal,
        verificarAcessoOuUpgrade: verificarAcessoOuUpgrade,
        verificarPessoalOuUpgrade: verificarPessoalOuUpgrade,
        mostrarModalUpgrade: mostrarModalUpgrade,
        mostrarUpsell: mostrarUpsell,
        fecharModalUpgrade: fecharGenerico,
        fecharUpsell: fecharUpsell,
        getPlano: getPlano,
        getNomeUsuario: getNomeUsuario,
        getLimitePDF: getLimitePDF,
        aplicarBloqueiosPro: aplicarBloqueiosPro,
        aplicarBloqueiosPessoal: aplicarBloqueiosPessoal
    };

    // ══════════════════════════════════════════════════════════════
    // 8. AUTO-APLICAR AO CARREGAR
    // ══════════════════════════════════════════════════════════════

    document.addEventListener("impost-user-ready", function () {
        aplicarBloqueiosPro();
        aplicarBloqueiosPessoal();
    });

    console.log("[IMPOST] User Service v5 inicializado.");

})();
