/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  LUCRO REAL — ESTUDOS TRIBUTÁRIOS  v3.4  (ARQUIVO UNIFICADO)              ║
 * ║  Wizard 7 etapas + Motor de diagnóstico + Exportação PDF/Excel            ║
 * ║  100% LUCRO REAL — Sem comparativo com Simples/Presumido                   ║
 * ║  Motor: cruza respostas do usuário com LucroRealMap (LR.calcular.*)        ║
 * ║  Produto comercial por assinatura — ZERO referência a empresa específica   ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 *
 * DEPENDÊNCIAS (carregar ANTES deste arquivo):
 *   1. estados.js              → window.ESTADOS (dados de estados, ICMS, ISS)
 *   2. municipios.js           → window.MunicipiosIBGE (municípios via API IBGE)
 *   3. lucro-real-mapeamento.js → window.LR / window.LucroRealMap
 *   4. Chart.js (CDN)          → gráficos no relatório
 *   5. html2pdf.js (CDN)       → exportação PDF profissional
 *   6. SheetJS / XLSX (CDN)    → exportação Excel (.xlsx)
 *
 * EXPORTA:
 *   window.LucroRealEstudos  — API principal (inclui .pdfSimplificado, .pdfCompleto, .exportarExcel)
 *   window.IMPOSTExport      — alias de compatibilidade para exportação
 *
 * IMPOST. — Inteligência em Modelagem de Otimização Tributária
 * Versão: 3.4.0 | Data: Fevereiro/2026
 *
 * NOTA: Este arquivo unifica os antigos lucro-real-estudos.js + lucro-real-estudos-export.js
 *       Não é mais necessário carregar o arquivo de exportação separadamente.
 *
 * CHANGELOG v3.4.0 (Fevereiro/2026):
 *   FIX — IRRF JCP default fallback corrigido de 15% para 17,5% (LC 224/2025)
 *   FIX — Subcapitalização: juros indedutíveis usam IRPJ marginal (_irpj incremental)
 *         em vez de taxa fixa 25% — correto para lucros abaixo do limiar adicional
 *   FIX — Alerta de retenções usa _irpj() incremental em vez de 0.25 fixo
 *
 * CHANGELOG v3.2.0 (Fevereiro/2026):
 *   BUG #1 (CRÍTICO) — Cálculo JCP agora mantém compensação de prejuízo ativa, recalculando
 *              trava de 30% sobre novo lucro ajustado após dedução do JCP. Economia JCP corrigida.
 *   BUG #2 (MÉDIO) — VERSAO unificada em 3.2.0. Badge no header sincronizado via JS no init().
 *   BUG #3 (MÉDIO) — Totais do Fluxo de Caixa Mensal usam valores anuais exatos em vez da
 *              soma de parcelas arredondadas. Elimina divergência de R$ 0,01.
 *   BUG #4 (MÉDIO) — Seção 5 agora inclui nota explicativa distinguindo alíquota efetiva por
 *              tributo (sobre base específica) vs alíquota efetiva global (sobre receita bruta).
 *   BUG #5 (BAIXO) — PDD Fiscal na oportunidade #22 usa alíquotas efetivas (consistente com
 *              pddFiscalInfo). Alíquotas passadas via ctx para cálculo uniforme.
 *   BUG #6 (BAIXO) — Todas as oportunidades agora têm campo .economia como alias de
 *              .economiaAnual, evitando undefined em funções de exportação.
 *
 * CHANGELOG v2.3.0 (Fevereiro/2026):
 *   FALHA #1 — Cards SIMULACAO_COMPLETA e MAPA_ECONOMIA marcados como consolidação (_isConsolidada)
 *              para não duplicar economia ao somar oportunidades. Visual distinto no relatório e Excel.
 *   FALHA #2 — pisCofins.aliquotaEfetiva agora é LÍQUIDA (após retenções/créditos).
 *              Adicionada pisCofins.aliquotaEfetivaBruta. Seção 5 mostra alíquota líquida com nota.
 *   FALHA #3 — Dashboard já exibe labels "(Bruto)" e "(Líquido)" com tooltips explicativos.
 *   FALHA #4 — Oportunidade Prejuízo Fiscal: inclui economia IRPJ+CSLL quando não há card separado
 *              de Base Negativa CSLL (evita duplicação quando ambos existem).
 *   FALHA #5 — Guarda para multaOficio: não calcula quando não há débito relevante.
 *   MELHORIA — TJLP default atualizado de 6% para 7,97% (taxa 2025).
 *   MELHORIA — Novo campo PL Ajustado JCP (Lei 14.789/2023) na Etapa 3.
 *   MELHORIA — Disclaimer jurídico em destaque no INÍCIO do relatório.
 *   MELHORIA — Alerta inteligente sobre Lei 14.789/2023 quando PL Ajustado não informado.
 */
(function () {
  "use strict";

  // ═══════════════════════════════════════════════════════════════════════════
  //  CONSTANTES E HELPERS
  // ═══════════════════════════════════════════════════════════════════════════
  const VERSAO = "3.4.0";
  const LS_KEY_DADOS = "impost_lr_dados";
  const LS_KEY_STEP = "impost_lr_step";
  const LS_KEY_RESULTADOS = "impost_lr_resultados";

  const $ = (id) => document.getElementById(id);
  const $$ = (sel) => document.querySelectorAll(sel);
  const _r = (v) => Math.round((v || 0) * 100) / 100;
  const _m = (v) =>
    "R$\u00a0" +
    (v || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const _p = (v) => ((v || 0) * 100).toFixed(2) + "%";
  const _n = (v) => parseFloat(v) || 0;
  /** Formata valor que JÁ É percentual (ex: 25 → "25.00%"). Diferente de _p que multiplica por 100. */
  function _pp(v) { return (v || 0).toFixed(2) + "%"; }
  function _irpj(lr) { return lr <= 0 ? 0 : lr * 0.15 + Math.max(0, lr - 240000) * 0.10; }

  /**
   * MELHORIA #2: Acesso seguro a propriedades aninhadas.
   * Uso: _safe(sudamResult, 'resumo', 'economiaReducao75')
   * Em vez de: sudamResult ? (sudamResult.resumo.economiaReducao75 || 0) : 0
   */
  function _safe(obj /*, chave1, chave2, ... */) {
    for (var i = 1; i < arguments.length; i++) {
      if (obj == null) return 0;
      obj = obj[arguments[i]];
    }
    return (typeof obj === 'number') ? obj : (typeof obj === 'string' ? parseFloat(obj) || 0 : 0);
  }

  /**
   * Formata número como moeda brasileira para exibição em inputs.
   * Ex: 3000000 → "3.000.000,00"   |   1234.5 → "1.234,50"
   * Recebe valor numérico (ou string de dígitos), retorna string formatada.
   */
  function _fmtBRL(v) {
    if (v === "" || v === undefined || v === null) return "";
    var n = typeof v === "number" ? v : parseFloat(String(v).replace(/\./g, "").replace(",", ".")) || 0;
    if (n === 0 && String(v) !== "0") return "";
    var parts = n.toFixed(2).split(".");
    var inteiro = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return inteiro + "," + parts[1];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  SIGLAS — Dicionário e helpers (Correção 8)
  // ═══════════════════════════════════════════════════════════════════════════

  var _SIGLAS = {
    LALUR:  "Livro de Apuração do Lucro Real",
    LACS:   "Livro de Apuração da Contribuição Social",
    DRE:    "Demonstração do Resultado do Exercício",
    PL:     "Patrimônio Líquido",
    JCP:    "Juros sobre Capital Próprio",
    TJLP:   "Taxa de Juros de Longo Prazo",
    IRPJ:   "Imposto de Renda Pessoa Jurídica",
    CSLL:   "Contribuição Social sobre o Lucro Líquido",
    PIS:    "Programa de Integração Social",
    COFINS: "Contribuição p/ Financiamento da Seguridade Social",
    DARF:   "Documento de Arrecadação de Receitas Federais",
    ISS:    "Imposto sobre Serviços",
    ICMS:   "Imposto sobre Circulação de Mercadorias e Serviços",
    CPP:    "Contribuição Previdenciária Patronal",
    CPRB:   "Contribuição Previdenciária sobre Receita Bruta",
    PDD:    "Provisão para Devedores Duvidosos",
    ECF:    "Escrituração Contábil Fiscal",
    SPED:   "Sistema Público de Escrituração Digital",
    RIR:    "Regulamento do Imposto de Renda",
    SUDAM:  "Superintendência de Desenvolvimento da Amazônia",
    SUDENE: "Superintendência de Desenvolvimento do Nordeste",
    CSRF:   "Contribuições Sociais Retidas na Fonte",
    MEP:    "Método de Equivalência Patrimonial",
    AVP:    "Ajuste a Valor Presente",
    PER:    "Pedido Eletrônico de Restituição",
    DCOMP:  "Declaração de Compensação",
    CND:    "Certidão Negativa de Débitos",
    CPEN:   "Certidão Positiva com Efeitos de Negativa",
    BASA:   "Banco da Amazônia S.A.",
    BNB:    "Banco do Nordeste do Brasil",
    SCP:    "Sociedade em Conta de Participação",
  };

  /**
   * Retorna HTML inline com tooltip para uma sigla.
   * Ex: _sigla("LALUR") → '<span class="sigla-help">LALUR <small class="sigla-desc">(Livro de Apuração do Lucro Real)</small></span>'
   */
  function _sigla(code) {
    var desc = _SIGLAS[code];
    if (!desc) return code;
    return '<span class="sigla-help">' + code +
      ' <small class="sigla-desc">(' + desc + ')</small></span>';
  }

  /**
   * Processa HTML de uma etapa e substitui a PRIMEIRA ocorrência de cada sigla
   * por sua versão com tooltip. Apenas texto visível (entre tags) é processado.
   */
  function _applySiglas(html) {
    var used = {};
    var allSiglas = Object.keys(_SIGLAS).sort(function (a, b) {
      return b.length - a.length; // mais longas primeiro para evitar conflitos
    });
    var pattern = new RegExp("\\b(" + allSiglas.join("|") + ")\\b", "g");

    return html.replace(/(>[^<]+)/g, function (match) {
      var gt = match[0];
      var text = match.slice(1);
      text = text.replace(pattern, function (sigla) {
        if (used[sigla]) return sigla;
        used[sigla] = true;
        return _sigla(sigla);
      });
      return gt + text;
    });
  }

  var _siglaCSSInjected = false;

  function _injectSiglaCSS() {
    if (_siglaCSSInjected) return;
    _siglaCSSInjected = true;
    var style = document.createElement("style");
    style.textContent =
      ".sigla-help{position:relative;border-bottom:1px dotted rgba(46,204,113,0.5);cursor:help;}" +
      ".sigla-desc{font-weight:400;color:#8b95a5;font-size:0.82em;white-space:nowrap;}";
    document.head.appendChild(style);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  CONFIGURAÇÃO WHITE-LABEL (defaults)
  // ═══════════════════════════════════════════════════════════════════════════
  const CONFIG_DEFAULTS = {
    nomeProduto: "IMPOST.",
    subtitulo: "Inteligência em Modelagem de Otimização Tributária",
    versao: VERSAO,
    corPrimaria: "#1A3C6E",
    corSecundaria: "#E8A838",
    corAcento: "#2ECC71",
    logoURL: "",
    elaboradoPor: { nome: "", registro: "", email: "", telefone: "" },
    disclaimer:
      "Este estudo é uma estimativa automatizada para fins de planejamento tributário. Consulte um profissional habilitado para validação e implementação.",
    mostrarMarcaImpost: true,
  };

  let CONFIG = Object.assign({}, CONFIG_DEFAULTS);

  // ═══════════════════════════════════════════════════════════════════════════
  //  7 ETAPAS DO WIZARD
  // ═══════════════════════════════════════════════════════════════════════════
  const ETAPAS = [
    {
      id: "empresa",
      titulo: "Dados da Empresa e Regime",
      icone: "🏢",
      descricao:
        "Identificação, atividade, localização com ISS automático e forma de apuração",
    },
    {
      id: "receitas",
      titulo: "Receitas e Faturamento",
      icone: "💰",
      descricao: "Receita bruta detalhada por natureza — base para todos os cálculos",
    },
    {
      id: "custos",
      titulo: "Custos, Despesas e Adições/Exclusões",
      icone: "📋",
      descricao: "DRE e LALUR — a etapa mais importante do wizard",
    },
    {
      id: "patrimonio",
      titulo: "Patrimônio, JCP e Prejuízos",
      icone: "🏦",
      descricao:
        "JCP e compensação de prejuízos — as duas maiores fontes de economia",
    },
    {
      id: "retencoes",
      titulo: "Retenções na Fonte e Créditos PIS/COFINS",
      icone: "🔒",
      descricao:
        "Antecipações compensáveis e créditos não-cumulativos sobre insumos",
    },
    {
      id: "ativos",
      titulo: "Ativos, Depreciação e Incentivos",
      icone: "🏗️",
      descricao:
        "Bens depreciáveis, turnos, SUDAM/SUDENE e todos os incentivos fiscais",
    },
    {
      id: "revisao",
      titulo: "Revisão, Cenários e Configuração",
      icone: "📈",
      descricao:
        "Revisar dados, configurar cenários e personalizar relatório antes de gerar",
    },
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  //  ESTADO GLOBAL
  // ═══════════════════════════════════════════════════════════════════════════
  let currentStep = 0;
  let dadosEmpresa = {};
  let resultadosCache = null;
  let LR = null;
  let ESTADOS = null;

  // ═══════════════════════════════════════════════════════════════════════════
  //  HELPERS DE CAMPO — _field (todos os tipos)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Gera select de UFs a partir de ESTADOS (estados.js)
   */
  function _selectUF(selected) {
    if (!ESTADOS) return '<option value="">Carregando estados...</option>';
    var html = '<option value="">Selecione um estado...</option>';
    // Tentar listar estados de diferentes formatos
    if (ESTADOS.listarEstados) {
      // Formato estados.js UMD (window.Estados)
      var lista = ESTADOS.listarEstados();
      lista.forEach(function (e) {
        html +=
          '<option value="' +
          e.sigla +
          '" ' +
          (e.sigla === selected ? "selected" : "") +
          ">" +
          e.sigla +
          " — " +
          e.nome +
          "</option>";
      });
    } else {
      // Formato simples: ESTADOS["PA"] = { nome: "Pará", ... }
      var siglas = Object.keys(ESTADOS).sort();
      siglas.forEach(function (uf) {
        var nome = ESTADOS[uf].nome || uf;
        html +=
          '<option value="' +
          uf +
          '" ' +
          (uf === selected ? "selected" : "") +
          ">" +
          uf +
          " — " +
          nome +
          "</option>";
      });
    }
    return html;
  }

  /**
   * Gera select de tipos de atividade agrupados por optgroup
   */
  function _selectAtividades(selected) {
    if (!LR || !LR.presuncoes) return '<option value="">Carregando...</option>';
    var grupos = {
      Serviços: [
        "SERVICOS_GERAL",
        "SERVICOS_HOSPITALARES",
        "INTERMEDIACAO_NEGOCIOS",
        "ADMINISTRACAO_LOCACAO",
      ],
      "Comércio/Indústria": [
        "COMERCIO_INDUSTRIA",
        "REVENDA_COMBUSTIVEIS",
        "ATIVIDADE_IMOBILIARIA",
      ],
      Transporte: ["TRANSPORTE_CARGA", "TRANSPORTE_PASSAGEIROS"],
      "⚠️ Obrigatório LR": ["FACTORING", "INSTITUICOES_FINANCEIRAS"],
    };
    var html = '<option value="">Selecione a atividade...</option>';
    Object.keys(grupos).forEach(function (grupo) {
      html += '<optgroup label="' + grupo + '">';
      grupos[grupo].forEach(function (k) {
        if (LR.presuncoes[k]) {
          html +=
            '<option value="' +
            k +
            '" ' +
            (k === selected ? "selected" : "") +
            ">" +
            LR.presuncoes[k].label +
            "</option>";
        }
      });
      html += "</optgroup>";
    });
    // Adicionar quaisquer presunções não classificadas
    var usados = [].concat.apply([], Object.values(grupos));
    Object.keys(LR.presuncoes).forEach(function (k) {
      if (usados.indexOf(k) === -1) {
        html +=
          '<option value="' +
          k +
          '" ' +
          (k === selected ? "selected" : "") +
          ">" +
          LR.presuncoes[k].label +
          "</option>";
      }
    });
    return html;
  }

  /**
   * Gerador universal de campo
   * Suporta: text, number, money, percent, select, checkbox, radio, textarea
   */
  function _field(id, label, type, opts) {
    opts = opts || {};
    var val =
      dadosEmpresa[id] !== undefined ? dadosEmpresa[id] : opts.default || "";
    var ph = opts.placeholder || "";
    var tip = opts.tip
      ? '<span class="wz-tip">' + opts.tip + "</span>"
      : "";
    var req = opts.required ? "required" : "";
    var cls = opts.className || "";
    var cond = opts.condition
      ? 'data-condition="' + opts.condition + '" style="display:none"'
      : "";
    var extra = opts.extra || "";
    var disabled = opts.disabled ? "disabled" : "";

    if (type === "select") {
      return (
        '<div class="wz-field ' + cls + '" ' + cond + ">" +
        '<label for="' + id + '">' + label + "</label>" + tip +
        '<select id="' + id + '" name="' + id + '" class="wz-input" ' +
        req + " " + disabled +
        " onchange=\"LucroRealEstudos.saveField('" + id + "',this.value)\">" +
        (opts.options || "") +
        "</select>" + extra + "</div>"
      );
    }

    if (type === "checkbox") {
      var chk =
        val === true || val === "true" || val === "on" ? "checked" : "";
      return (
        '<div class="wz-field wz-field-check ' + cls + '" ' + cond + ">" +
        '<label class="wz-check-label">' +
        '<input type="checkbox" id="' + id + '" name="' + id + '" ' + chk +
        " onchange=\"LucroRealEstudos.saveField('" + id + "',this.checked)\">" +
        '<span class="wz-checkmark"></span>' + label +
        "</label>" + tip + "</div>"
      );
    }

    if (type === "radio") {
      var radios = (opts.options || [])
        .map(function (o) {
          return (
            '<label class="wz-radio-label">' +
            '<input type="radio" name="' + id + '" value="' + o.value + '" ' +
            (String(val) === String(o.value) ? "checked" : "") +
            " onchange=\"LucroRealEstudos.saveField('" +
            id + "','" + o.value + "')\">" +
            '<span class="wz-radio-mark"></span>' + o.label +
            "</label>"
          );
        })
        .join("");
      return (
        '<div class="wz-field ' + cls + '" ' + cond + ">" +
        "<label>" + label + "</label>" + tip +
        '<div class="wz-radio-group">' + radios + "</div></div>"
      );
    }

    if (type === "money") {
      var fmtVal = val ? _fmtBRL(val) : "";
      return (
        '<div class="wz-field ' + cls + '" ' + cond + ">" +
        '<label for="' + id + '">' + label + "</label>" + tip +
        '<div class="wz-input-prefix"><span>R$</span>' +
        '<input type="text" id="' + id + '" name="' + id +
        '" class="wz-input" placeholder="' + ph + '" value="' + fmtVal +
        "\" oninput=\"LucroRealEstudos.saveMoney('" + id + "',this)\" " +
        req + " " + disabled + ">" +
        "</div>" + extra + "</div>"
      );
    }

    if (type === "percent") {
      return (
        '<div class="wz-field ' + cls + '" ' + cond + ">" +
        '<label for="' + id + '">' + label + "</label>" + tip +
        '<div class="wz-input-suffix">' +
        '<input type="number" id="' + id + '" name="' + id +
        '" class="wz-input" placeholder="' + ph + '" value="' + val +
        '" step="0.01" min="0" max="100"' +
        " oninput=\"LucroRealEstudos.saveField('" + id + "',this.value)\" " +
        req + ">" +
        "<span>%</span></div></div>"
      );
    }

    if (type === "textarea") {
      return (
        '<div class="wz-field ' + cls + '" ' + cond + ">" +
        '<label for="' + id + '">' + label + "</label>" + tip +
        '<textarea id="' + id + '" name="' + id +
        '" class="wz-input" placeholder="' + ph + '" rows="3"' +
        " oninput=\"LucroRealEstudos.saveField('" + id + "',this.value)\" " +
        req + ">" + (val || "") + "</textarea></div>"
      );
    }

    // default: text / number
    return (
      '<div class="wz-field ' + cls + '" ' + cond + ">" +
      '<label for="' + id + '">' + label + "</label>" + tip +
      '<input type="' + type + '" id="' + id + '" name="' + id +
      '" class="wz-input" placeholder="' + ph + '" value="' + val +
      "\" oninput=\"LucroRealEstudos.saveField('" + id + "',this.value)\" " +
      req + ">" + extra + "</div>"
    );
  }

  function _sectionTitle(text) {
    return '<h3 class="wz-section-title">' + text + "</h3>";
  }

  function _infoBox(text, cls) {
    return '<div class="wz-info-box ' + (cls || "") + '">' + text + "</div>";
  }

  function _row(content) {
    return '<div class="wz-row">' + content + "</div>";
  }

  function _autoCalcBox(id) {
    return '<div class="wz-auto-calc" id="' + id + '"></div>';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  AUTOCOMPLETE CNAE — Correção 1
  // ═══════════════════════════════════════════════════════════════════════════

  var _cnaeDropdownCSS = false;

  function _injectCnaeCSS() {
    if (_cnaeDropdownCSS) return;
    _cnaeDropdownCSS = true;
    var style = document.createElement("style");
    style.textContent =
      ".cnae-ac-wrap{position:relative;}" +
      ".cnae-dropdown{position:absolute;top:100%;left:0;right:0;z-index:1000;max-height:300px;overflow-y:auto;" +
      "background:#1a2236;border:1px solid rgba(255,255,255,0.12);border-radius:8px;box-shadow:0 8px 32px rgba(0,0,0,0.5);" +
      "margin-top:2px;display:none;}" +
      ".cnae-dropdown.open{display:block;}" +
      ".cnae-dropdown-item{padding:10px 14px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.05);" +
      "font-size:13px;color:#ccc;transition:background .15s;}" +
      ".cnae-dropdown-item:last-child{border-bottom:none;}" +
      ".cnae-dropdown-item:hover,.cnae-dropdown-item.active{background:rgba(46,204,113,0.15);color:#fff;}" +
      ".cnae-dropdown-item .cnae-code{font-family:'JetBrains Mono',monospace;color:#2ECC71;margin-right:8px;font-weight:600;}" +
      ".cnae-dropdown-item .cnae-cat{font-size:11px;color:#888;margin-left:6px;}" +
      ".cnae-dropdown-empty{padding:12px 14px;color:#777;font-style:italic;font-size:13px;}";
    document.head.appendChild(style);
  }

  function buscarCnae(texto) {
    var banco = window.CNAE || window.BANCO_CNAE;
    if (!banco || !texto || texto.length < 2) return [];
    var norm = texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    var isCode = /^\d{2,}/.test(norm.replace(/[\s\-\/]/g, ""));
    var codeQ = norm.replace(/[\s\-\/]/g, "");

    return banco.filter(function (c) {
      if (isCode) return c.codigo.replace(/[\-\/]/g, "").indexOf(codeQ) === 0;
      var descNorm = c.descricao.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return norm.split(/\s+/).every(function (t) { return descNorm.indexOf(t) >= 0; });
    }).slice(0, 15);
  }

  var _cnaeDebounceTimers = {};
  var _cnaeActiveIdx = {};

  function _initCnaeAutocomplete() {
    _injectCnaeCSS();
    _setupCnaeField("cnaePrincipal", false);
    _setupCnaeField("cnaesSecundarios", true);
  }

  function _setupCnaeField(fieldId, multi) {
    var input = $(fieldId);
    if (!input) return;

    // Evitar duplicar dropdowns
    if (input.parentNode.querySelector(".cnae-dropdown")) return;

    // Envolver input em wrapper relativo
    var wrapper = input.parentNode;
    if (!wrapper.classList.contains("cnae-ac-wrap")) {
      wrapper.style.position = "relative";
      wrapper.classList.add("cnae-ac-wrap");
    }

    // Criar dropdown
    var dd = document.createElement("div");
    dd.className = "cnae-dropdown";
    dd.id = "cnaeDD_" + fieldId;
    wrapper.appendChild(dd);

    _cnaeActiveIdx[fieldId] = -1;

    // Input handler com debounce
    input.addEventListener("input", function () {
      clearTimeout(_cnaeDebounceTimers[fieldId]);
      _cnaeDebounceTimers[fieldId] = setTimeout(function () {
        var texto = input.value;
        if (multi) {
          var parts = texto.split(",");
          texto = parts[parts.length - 1].trim();
        }
        _renderCnaeDropdown(dd, fieldId, texto, input, multi);
      }, 250);
    });

    // Paste handler
    input.addEventListener("paste", function () {
      setTimeout(function () {
        var texto = input.value;
        if (multi) {
          var parts = texto.split(",");
          texto = parts[parts.length - 1].trim();
        }
        _renderCnaeDropdown(dd, fieldId, texto, input, multi);
      }, 50);
    });

    // Keyboard navigation
    input.addEventListener("keydown", function (e) {
      if (!dd.classList.contains("open")) return;
      var items = dd.querySelectorAll(".cnae-dropdown-item");
      if (!items.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        _cnaeActiveIdx[fieldId] = Math.min(_cnaeActiveIdx[fieldId] + 1, items.length - 1);
        _highlightCnaeItem(items, _cnaeActiveIdx[fieldId]);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        _cnaeActiveIdx[fieldId] = Math.max(_cnaeActiveIdx[fieldId] - 1, 0);
        _highlightCnaeItem(items, _cnaeActiveIdx[fieldId]);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (_cnaeActiveIdx[fieldId] >= 0 && items[_cnaeActiveIdx[fieldId]]) {
          items[_cnaeActiveIdx[fieldId]].click();
        }
      } else if (e.key === "Escape") {
        dd.classList.remove("open");
        _cnaeActiveIdx[fieldId] = -1;
      }
    });

    // Fechar ao clicar fora
    document.addEventListener("click", function (e) {
      if (!wrapper.contains(e.target)) {
        dd.classList.remove("open");
        _cnaeActiveIdx[fieldId] = -1;
      }
    });
  }

  function _renderCnaeDropdown(dd, fieldId, texto, input, multi) {
    _cnaeActiveIdx[fieldId] = -1;
    if (!texto || texto.length < 2) {
      dd.classList.remove("open");
      dd.innerHTML = "";
      return;
    }
    var resultados = buscarCnae(texto);
    if (resultados.length === 0) {
      dd.innerHTML = '<div class="cnae-dropdown-empty">Nenhum CNAE encontrado para "' + texto + '"</div>';
      dd.classList.add("open");
      return;
    }
    var html = "";
    resultados.forEach(function (c, idx) {
      html += '<div class="cnae-dropdown-item" data-idx="' + idx + '" data-codigo="' + c.codigo + '" data-descricao="' + c.descricao.replace(/"/g, "&quot;") + '">' +
        '<span class="cnae-code">' + c.codigo + '</span>' + c.descricao +
        '<span class="cnae-cat">' + (c.categoria || "") + '</span></div>';
    });
    dd.innerHTML = html;
    dd.classList.add("open");

    // Click handler para cada item
    dd.querySelectorAll(".cnae-dropdown-item").forEach(function (item) {
      item.addEventListener("click", function () {
        var codigo = item.getAttribute("data-codigo");
        var descricao = item.getAttribute("data-descricao");
        var valor = codigo + " - " + descricao;

        if (multi) {
          var parts = input.value.split(",");
          parts[parts.length - 1] = " " + valor;
          input.value = parts.join(",").replace(/^,?\s*/, "");
        } else {
          input.value = valor;
        }

        dadosEmpresa[fieldId] = input.value;
        saveToLS();
        dd.classList.remove("open");
        dd.innerHTML = "";
        _cnaeActiveIdx[fieldId] = -1;

        // Auto-detectar CPRB se CNAE principal começa com 62
        if (fieldId === "cnaePrincipal" && codigo.replace(/[\-\/]/g, "").substring(0, 2) === "62") {
          _sugerirCPRB();
        }
      });
    });
  }

  function _highlightCnaeItem(items, idx) {
    items.forEach(function (it, i) {
      it.classList.toggle("active", i === idx);
    });
    if (items[idx]) items[idx].scrollIntoView({ block: "nearest" });
  }

  function _sugerirCPRB() {
    // Sugere CPRB na etapa 4 — será implementado na Correção 4
    // Marcar flag para mostrar badge informativo
    dadosEmpresa._cprbSugerida = true;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER WIZARD (com progress bar)
  // ═══════════════════════════════════════════════════════════════════════════

  function renderWizard() {
    var container = $("wizardContainer");
    if (!container) return;

    // Esconder resultados se visíveis
    var resContainer = $("resultadosContainer");
    if (resContainer) resContainer.style.display = "none";
    container.style.display = "";

    // ── Progress bar clicável ──
    var progressHTML = '<div class="wz-progress">';
    ETAPAS.forEach(function (e, i) {
      var estado =
        i < currentStep ? "done" : i === currentStep ? "active" : "";
      progressHTML +=
        '<div class="wz-step-indicator ' + estado +
        '" data-step="' + i +
        '" onclick="LucroRealEstudos.goToStep(' + i + ')" title="' +
        e.titulo + '">' +
        '<div class="wz-step-num">' +
        (i < currentStep ? "✓" : i + 1) + "</div>" +
        '<div class="wz-step-label">' + e.titulo + "</div></div>";
      if (i < ETAPAS.length - 1) {
        progressHTML +=
          '<div class="wz-step-line ' +
          (i < currentStep ? "done" : "") + '"></div>';
      }
    });
    progressHTML += "</div>";

    // ── Conteúdo da etapa atual ──
    var etapa = ETAPAS[currentStep];
    var formHTML = renderEtapa(currentStep);

    // ── Navegação ──
    var navHTML = '<div class="wz-nav">';
    if (currentStep > 0) {
      navHTML +=
        '<button class="wz-btn wz-btn-back" onclick="LucroRealEstudos.prevStep()">← Voltar</button>';
    }
    navHTML +=
      '<button class="wz-btn wz-btn-fill" onclick="LucroRealEstudos.preencherExemplo()" title="Carregar dados de exemplo para demonstração">⚡ Carregar Exemplo</button>';
    if (currentStep < ETAPAS.length - 1) {
      navHTML +=
        '<button class="wz-btn wz-btn-next" onclick="LucroRealEstudos.nextStep()">Próximo →</button>';
    } else {
      navHTML +=
        '<button class="wz-btn wz-btn-analyze" onclick="LucroRealEstudos.analisar()">🔍 GERAR ESTUDO COMPLETO</button>';
    }
    navHTML += "</div>";

    container.innerHTML =
      progressHTML +
      '<div class="wz-content">' +
      '<div class="wz-header">' +
      '<span class="wz-header-icon">' + etapa.icone + "</span>" +
      "<div>" +
      '<h2 class="wz-title">Etapa ' + (currentStep + 1) + " de " +
      ETAPAS.length + " — " + etapa.titulo + "</h2>" +
      '<p class="wz-subtitle">' + etapa.descricao + "</p>" +
      "</div></div>" +
      '<div class="wz-form">' + formHTML + "</div>" +
      navHTML +
      "</div>";

    restoreValues();
    bindConditionals();
    updateAutoCalcs();

    // Integração de municípios: se estamos na etapa 0 e tem UF, carregar municípios
    if (currentStep === 0 && dadosEmpresa.uf) {
      _carregarMunicipios(dadosEmpresa.uf);
    }

    // Autocomplete CNAE na etapa 0
    if (currentStep === 0) {
      _initCnaeAutocomplete();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER DE CADA ETAPA (0 a 6)
  // ═══════════════════════════════════════════════════════════════════════════

  function renderEtapa(step) {
    var html;
    switch (step) {
      case 0: html = renderEtapa0(); break;
      case 1: html = renderEtapa1(); break;
      case 2: html = renderEtapa2(); break;
      case 3: html = renderEtapa3(); break;
      case 4: html = renderEtapa4(); break;
      case 5: html = renderEtapa5(); break;
      case 6: html = renderEtapa6(); break;
      default: html = "";
    }
    return _applySiglas(html);
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  ETAPA 0 — Dados da Empresa e Regime
  // ──────────────────────────────────────────────────────────────────────────
  function renderEtapa0() {
    var h = "";
    h += _sectionTitle("Identificação da Empresa");
    h += _row(
      _field("razaoSocial", "Razão Social", "text", {
        required: true,
        placeholder: "Nome da empresa",
      }) +
      _field("cnpj", "CNPJ", "text", {
        placeholder: "XX.XXX.XXX/XXXX-XX",
        extra: '<script>document.getElementById("cnpj")&&document.getElementById("cnpj").addEventListener("input",function(e){var v=e.target.value.replace(/\\D/g,"");if(v.length>14)v=v.substr(0,14);v=v.replace(/(\\d{2})(\\d)/,"$1.$2").replace(/(\\d{3})(\\d)/,"$1.$2").replace(/(\\d{3})(\\d)/,"$1/$2").replace(/(\\d{4})(\\d)/,"$1-$2");e.target.value=v;})<\/script>',
      })
    );
    h += _row(
      _field("cnaePrincipal", "CNAE Principal", "text", {
        placeholder: 'Ex: 7119-7/99',
      }) +
      _field("cnaesSecundarios", "CNAEs Secundários", "text", {
        placeholder: "Separados por vírgula",
      })
    );

    h += _sectionTitle("Localização");
    h += _row(
      _field("uf", "UF", "select", {
        required: true,
        options: _selectUF(dadosEmpresa.uf),
        extra: '<div id="ufBadge"></div>',
      }) +
      '<div class="wz-field">' +
        '<label for="municipio">Município</label>' +
        '<span class="wz-tip">Selecione o estado primeiro — os municípios serão carregados automaticamente via API IBGE</span>' +
        '<select id="municipio" name="municipio" class="wz-input" required ' +
        'onchange="LucroRealEstudos.onMunicipioChanged(this)">' +
        '<option value="">Selecione o estado primeiro...</option>' +
        '</select>' +
        '<div id="municipioLoading" class="wz-municipio-loading" style="display:none">Carregando municípios...</div>' +
      '</div>'
    );
    h += _row(
      _field("tipoServicoISS", "Tipo de serviço (LC 116/2003)", "select", {
        tip: "Influencia a faixa de alíquota ISS. Selecione o item da lista de serviços mais adequado.",
        options:
          '<option value="">Selecione (padrão: 5%)</option>' +
          '<option value="informatica" ' + (dadosEmpresa.tipoServicoISS === "informatica" ? "selected" : "") + '>Item 1 — Informática (2% a 5%)</option>' +
          '<option value="saude" ' + (dadosEmpresa.tipoServicoISS === "saude" ? "selected" : "") + '>Item 4 — Saúde (2% a 3%)</option>' +
          '<option value="engenharia" ' + (dadosEmpresa.tipoServicoISS === "engenharia" ? "selected" : "") + '>Item 7 — Engenharia/Arquitetura (2% a 5%)</option>' +
          '<option value="educacao" ' + (dadosEmpresa.tipoServicoISS === "educacao" ? "selected" : "") + '>Item 8 — Educação (2% a 5%)</option>' +
          '<option value="contabilidade" ' + (dadosEmpresa.tipoServicoISS === "contabilidade" ? "selected" : "") + '>Item 17 — Contabilidade/Auditoria (2% a 5%)</option>' +
          '<option value="advocacia" ' + (dadosEmpresa.tipoServicoISS === "advocacia" ? "selected" : "") + '>Item 17 — Advocacia (2% a 5%)</option>' +
          '<option value="consultoria" ' + (dadosEmpresa.tipoServicoISS === "consultoria" ? "selected" : "") + '>Item 17 — Consultoria (2% a 5%)</option>' +
          '<option value="construcao" ' + (dadosEmpresa.tipoServicoISS === "construcao" ? "selected" : "") + '>Item 7 — Construção civil (2% a 5%)</option>' +
          '<option value="transporte" ' + (dadosEmpresa.tipoServicoISS === "transporte" ? "selected" : "") + '>Item 16 — Transporte municipal (2% a 5%)</option>' +
          '<option value="outros" ' + (dadosEmpresa.tipoServicoISS === "outros" ? "selected" : "") + '>Outros serviços (2% a 5%)</option>',
      }) +
      _field("issAliquota", "Alíquota ISS do município (%)", "percent", {
        default: "5",
        tip: "Pré-preenchido pelo município selecionado. Editável manualmente (2% a 5%).",
      })
    );
    h += '<div class="wz-field"><div id="dicaISS" class="wz-iss-dica"></div></div>';

    // SUP — Sociedade Uniprofissional
    h += _field("ehSUP", "Sociedade Uniprofissional (SUP)?", "checkbox", {
      tip: "Sociedades de profissionais liberais (médicos, advogados, contadores, engenheiros) podem recolher ISS fixo por profissional, sem alíquota percentual.",
    });
    h += '<div data-condition="ehSUP" style="display:none">';
    h += _row(
      _field("issFixoPorProfissional", "ISS fixo anual por profissional (R$)", "money", {
        tip: "Valor fixo anual por sócio/profissional habilitado. Varia por município (ex: SP ≈ R$ 800/ano por profissional).",
        default: "800",
      }) +
      _field("numProfissionaisSUP", "Nº de profissionais habilitados", "number", {
        default: "2",
        tip: "Número de sócios ou profissionais que exercem atividade na sociedade",
      })
    );
    h += _autoCalcBox("calcISSSUP");
    h += "</div>";

    h += _sectionTitle("Atividade e Regime");
    h += _row(
      _field("tipoAtividade", "Tipo de Atividade Principal", "select", {
        required: true,
        options: _selectAtividades(dadosEmpresa.tipoAtividade),
      }) +
      _field("atividadeMista", "Atividade mista?", "checkbox", {
        tip: "Se a empresa tem mais de um tipo de atividade com receitas relevantes",
      })
    );
    h += '<div data-condition="atividadeMista" style="display:none">';
    h += _row(
      _field("atividadeSecundaria", "Atividade Secundária", "select", {
        options: _selectAtividades(dadosEmpresa.atividadeSecundaria),
      }) +
      _field("percentReceitaSecundaria", "% da receita da atividade secundária", "percent", {
        placeholder: "30",
      })
    );
    h += "</div>";

    h += _row(
      _field("anoBase", "Ano-Base do Estudo", "select", {
        options:
          '<option value="2024" ' + (dadosEmpresa.anoBase === "2024" ? "selected" : "") + ">2024</option>" +
          '<option value="2025" ' + (dadosEmpresa.anoBase === "2025" ? "selected" : "") + ">2025</option>" +
          '<option value="2026" ' + ((!dadosEmpresa.anoBase || dadosEmpresa.anoBase === "2026") ? "selected" : "") + ">2026</option>",
      }) +
      _field("apuracaoLR", "Forma de Apuração", "select", {
        required: true,
        options:
          '<option value="">Selecione...</option>' +
          '<option value="trimestral" ' + (dadosEmpresa.apuracaoLR === "trimestral" ? "selected" : "") + ">Trimestral (definitiva — apura a cada 3 meses)</option>" +
          '<option value="anual_estimativa" ' + (dadosEmpresa.apuracaoLR === "anual_estimativa" ? "selected" : "") + ">Anual por Estimativa (antecipações mensais + ajuste no ano)</option>" +
          '<option value="anual_suspensao" ' + (dadosEmpresa.apuracaoLR === "anual_suspensao" ? "selected" : "") + ">Anual com Suspensão/Redução (balancetes mensais)</option>",
        tip: "Trimestral: apuração definitiva a cada trimestre. Anual Estimativa: paga antecipações mensais e ajusta no final. Suspensão/Redução: pode suspender pagamento com balancete mensal.",
      })
    );

    h += _sectionTitle("Informações Complementares");
    h += _row(
      _field("numSocios", "Nº de Sócios", "number", { default: "2" }) +
      _field("numFuncionarios", "Nº de Funcionários", "number", { default: "0" })
    );
    h += _row(
      _field("prestaServPublico", "Presta serviço p/ órgão público?", "checkbox") +
      _field("ehFinanceira", "É instituição financeira?", "checkbox")
    );

    // ── Diagnóstico Avançado (campos para funções do mapeamento) ──
    h += _sectionTitle("Informações Complementares para Diagnóstico Avançado");
    h += _infoBox(
      "Estas informações alimentam o diagnóstico avançado de obrigatoriedade, subcapitalização, operações no exterior e regime cambial.",
      "wz-info-default"
    );
    h += _field("ehInstituicaoFinanceira", "É instituição financeira (banco, seguradora, financeira)?", "checkbox", {
      tip: "Altera alíquota CSLL para 15% (vs 9% geral) e torna o Lucro Real obrigatório (Art. 257, II)",
    });
    h += _field("temLucroExterior", "Possui lucros, rendimentos ou ganhos de capital do exterior?", "checkbox", {
      tip: "Torna o Lucro Real obrigatório (Art. 257, III). Dados usados em LR.calcular.avancado.calcularLucrosExterior()",
    });
    h += _field("temBeneficioFiscalIsencao", "Possui benefício fiscal de isenção ou redução (ex: SUDAM/SUDENE)?", "checkbox", {
      tip: "Torna o Lucro Real obrigatório (Art. 257, IV)",
    });
    h += _row(
      _field("ehFactoring", "Atividade de factoring ou assessoria creditícia?", "checkbox", {
        tip: "Torna o Lucro Real obrigatório (Art. 257, VI)",
      }) +
      _field("ehSecuritizadora", "Securitizadora de créditos?", "checkbox", {
        tip: "Torna o Lucro Real obrigatório (Art. 257, VII)",
      })
    );
    h += _field("regimeCambial", "Regime de variação cambial", "select", {
      tip: "Regime padrão é Caixa. Opção por Competência deve ser exercida em janeiro (Art. 407)",
      options:
        '<option value="CAIXA" ' + ((!dadosEmpresa.regimeCambial || dadosEmpresa.regimeCambial === "CAIXA") ? "selected" : "") + '>Caixa (padrão)</option>' +
        '<option value="COMPETENCIA" ' + (dadosEmpresa.regimeCambial === "COMPETENCIA" ? "selected" : "") + '>Competência</option>',
    });

    h += '<div id="alertaObrigatoriedade"></div>';
    return h;
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  ETAPA 1 — Receitas e Faturamento
  // ──────────────────────────────────────────────────────────────────────────
  function renderEtapa1() {
    var h = "";

    h += _sectionTitle("Receita Bruta (obrigatória)");
    h += _infoBox(
      "Informe a receita bruta total anual. Opcionalmente, detalhe por tipo de receita ou preencha mês a mês para análise de sazonalidade.",
      "wz-info-default"
    );

    // Modo simplificado (padrão)
    h += _field("receitaBrutaAnual", "Receita Bruta Total Anual", "money", {
      required: true,
      placeholder: "3.000.000",
    });

    // Toggle detalhamento
    h += _field("detalharReceita", 'Detalhar por tipo de receita', "checkbox");
    h += '<div data-condition="detalharReceita" style="display:none">';
    h += _row(
      _field("receitaServicos", "Receita de Serviços", "money") +
      _field("receitaComercio", "Receita de Comércio/Mercadorias", "money")
    );
    h += _row(
      _field("receitaFinanceiras", "Receita de Aplicações Financeiras", "money", {
        tip: "Tributadas mas NÃO entram no lucro da exploração (SUDAM/SUDENE)",
      }) +
      _field("receitaAlugueis", "Receita de Aluguéis", "money")
    );
    h += _field("outrasReceitas", "Outras Receitas Operacionais", "money");
    h += _autoCalcBox("calcSomaReceitas");
    h += "</div>";

    // Modo mês a mês
    h += _field("preencherMesAMes", "Preencher mês a mês (para análise de sazonalidade)", "checkbox");
    h += '<div data-condition="preencherMesAMes" style="display:none">';
    var meses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
    for (var i = 0; i < 12; i += 2) {
      h += _row(
        _field("receitaMes" + (i + 1), meses[i], "money") +
        (i + 1 < 12 ? _field("receitaMes" + (i + 2), meses[i + 1], "money") : "")
      );
    }
    h += _autoCalcBox("calcSomaMeses");
    h += "</div>";

    h += _sectionTitle("Receitas Especiais");
    h += _row(
      _field("receitasIsentas", "Receitas isentas de PIS/COFINS", "money", {
        tip: "Exportação, alíquota zero, receitas suspensas",
      }) +
      _field("receitaExportacao", "Receitas de exportação", "money", {
        tip: "Isentas de PIS/COFINS — Lei 10.637/02 art. 5º",
      })
    );
    h += _row(
      _field("receitasMonofasicas", "Receitas monofásicas", "money", {
        tip: "Combustíveis, farmacêuticos, cosméticos — tributação concentrada",
      }) +
      _field("receitasFinanceirasEspeciais", "Receitas financeiras", "money", {
        tip: "Aplicações, rendimentos, juros — tributadas mas NÃO entram no lucro da exploração (SUDAM)",
      })
    );
    h += _row(
      _field("receitasExteriorAnual", "Receitas do exterior", "money", {
        tip: "Se > 0, empresa é OBRIGADA ao Lucro Real (Art. 257, III)",
        extra: '<div id="alertaExterior"></div>',
      }) +
      _field("temCreditoImpExterior", "Tem crédito de imposto pago no exterior?", "checkbox", {
        condition: "receitasExteriorAnual",
      })
    );
    h += _field("percentReceitaPublico", "% da receita de órgãos públicos", "percent", {
      default: "0",
      tip: "Para estimar retenções na fonte automaticamente",
    });

    h += _autoCalcBox("calcReceitas");
    return h;
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  ETAPA 2 — Custos, Despesas e Adições/Exclusões
  // ──────────────────────────────────────────────────────────────────────────
  function renderEtapa2() {
    var h = "";

    // ── Custos Operacionais ──
    h += _sectionTitle("Custos Operacionais");
    h += _field("folhaPagamentoAnual", "Custo com Pessoal (total c/ encargos)", "money", {
      required: true,
      tip: "Valor consolidado. Ou detalhe abaixo.",
    });
    h += _field("detalharFolha", "Detalhar folha de pagamento", "checkbox");
    h += '<div data-condition="detalharFolha" style="display:none">';
    h += _row(
      _field("salariosBrutos", "Salários brutos", "money") +
      _field("proLabore", "Pró-labore dos sócios", "money", {
        tip: "DEDUTÍVEL no Lucro Real — destaque como despesa operacional",
        extra: '<span class="wz-badge wz-badge-green">Dedutível</span>',
      })
    );
    h += _row(
      _field("inssPatronal", "INSS patronal + terceiros (≈27%) + FGTS (8%)", "money") +
      _field("fgts", "FGTS (8%)", "money")
    );
    h += _row(
      _field("decimoTerceiro", "13º provisão", "money") +
      _field("feriasProvisao", "Férias + 1/3 provisão", "money")
    );
    h += "</div>";

    h += _row(
      _field("cmv", "CMV / Custos com Mercadorias", "money") +
      _field("servicosTerceiros", "Custos com Serviços de Terceiros", "money")
    );
    h += _row(
      _field("freteComprasVendas", "Frete sobre vendas/compras", "money") +
      _field("outrosCustosOp", "Outros Custos Operacionais", "money")
    );

    // ── Despesas Operacionais ──
    h += _sectionTitle("Despesas Operacionais");
    h += _row(
      _field("aluguelAnual", "Aluguel de imóveis", "money") +
      _field("energiaAnual", "Energia elétrica", "money")
    );
    h += _row(
      _field("telecomAnual", "Telecomunicações", "money") +
      _field("manutencaoConservacao", "Manutenção e conservação", "money")
    );
    h += _row(
      _field("segurosAnual", "Seguros", "money") +
      _field("despesasVeiculos", "Despesas com veículos", "money")
    );
    h += _row(
      _field("honorariosContabeis", "Honorários (contábeis/advocatícios)", "money") +
      _field("marketingPublicidade", "Marketing e publicidade", "money")
    );
    h += _row(
      _field("despesasViagem", "Viagens", "money") +
      _field("materialEscritorio", "Material de escritório", "money")
    );
    h += _field("outrasDespesasOp", "Outras despesas operacionais", "money");

    // ── Adições ao LALUR ──
    h += _sectionTitle("Despesas Indedutíveis → Adições ao LALUR");
    h += _infoBox(
      "Despesas que NÃO podem ser deduzidas do Lucro Real. Cada R$ 1,00 indedutível gera R$ 0,34 a mais de imposto (25% IRPJ + 9% CSLL). Marque apenas as que se aplicam.",
      "wz-info-warning"
    );

    h += _field("temMultas", "Multas punitivas", "checkbox");
    h += _field("multasPunitivas", "Valor das multas punitivas", "money", {
      condition: "temMultas",
      tip: "Indedutível (Art. 311, §5º). Multas COMPENSATÓRIAS são dedutíveis.",
      extra: '<div class="wz-badge wz-badge-red" data-condition="temMultas" style="display:none">Impacto: <span id="impactoMultas"></span></div>',
    });

    h += _field("temBrindes", "Brindes", "checkbox");
    h += _field("brindes", "Valor dos brindes", "money", {
      condition: "temBrindes",
      tip: "Indedutível (Art. 13, Lei 9.249). Estratégia: reclassificar como propaganda.",
    });

    h += _field("temAlimSocios", "Alimentação de sócios/administradores", "checkbox");
    h += _field("alimentacaoSocios", "Valor da alimentação de sócios", "money", {
      condition: "temAlimSocios",
      tip: "Indedutível (Art. 260, §ú, IV). Use PAT para funcionários.",
    });

    h += _field("temGratificacaoAdm", "Gratificações a administradores", "checkbox");
    h += _field("gratificacoesAdm", "Valor das gratificações", "money", {
      condition: "temGratificacaoAdm",
      tip: "Indedutível (Art. 358, §1º). Estratégia: converter em pró-labore (dedutível).",
      extra: '<div class="wz-badge wz-badge-green" data-condition="temGratificacaoAdm" style="display:none">💡 Converter para pró-labore economiza <span id="econGratif"></span></div>',
    });

    h += _field("temDoacoesFora", "Doações fora dos limites legais", "checkbox");
    h += _field("doacoesIrregulares", "Valor das doações irregulares", "money", {
      condition: "temDoacoesFora",
      tip: "Limite: 2% do lucro operacional (Art. 377-385)",
    });

    h += _field("temDespSemNF", "Despesas sem comprovante/NF", "checkbox");
    h += _field("despesasSemNF", "Valor sem comprovante", "money", {
      condition: "temDespSemNF",
      tip: "Indedutível (Art. 311). SEMPRE manter documentação fiscal.",
    });

    h += _field("temProvisoes", "Provisões não dedutíveis", "checkbox");
    h += _field("provisoesIndedutiveis", "Valor das provisões", "money", {
      condition: "temProvisoes",
      tip: "Adição TEMPORÁRIA — excluir quando realizada (Art. 340-352)",
      extra: '<span class="wz-badge wz-badge-gray" data-condition="temProvisoes" style="display:none">Tipo T — vai para Parte B do LALUR</span>',
    });

    h += _field("temMEPNeg", "Resultado negativo de equivalência patrimonial", "checkbox");
    h += _field("mepNegativo", "Valor do MEP negativo", "money", {
      condition: "temMEPNeg",
      tip: "Adição temporária (Art. 389). Controlado na Parte B.",
    });

    h += _field("temDepContMaior", "Depreciação contábil > fiscal", "checkbox");
    h += _field("depContabilMaiorFiscal", "Diferença depreciação contábil vs fiscal", "money", {
      condition: "temDepContMaior",
      tip: "Diferença entre depreciação IFRS e fiscal. Adição temporária.",
    });

    h += _field("temOutrasAdicoes", "Outras adições", "checkbox");
    h += '<div data-condition="temOutrasAdicoes" style="display:none">';
    h += _field("outrasAdicoes", "Valor de outras adições", "money");
    h += _field("descOutrasAdicoes", "Descrição das outras adições", "textarea");
    h += "</div>";

    h += _autoCalcBox("calcTotalAdicoes");

    // ── Exclusões ──
    h += _sectionTitle("Exclusões do Lucro Real");
    h += _infoBox(
      "Valores que REDUZEM a base de cálculo. Cada R$ 1,00 de exclusão economiza R$ 0,34 em impostos.",
      "wz-info-success"
    );

    h += _field("temDividendos", "Dividendos recebidos de PJ brasileira", "checkbox");
    h += _field("dividendosRecebidos", "Valor dos dividendos", "money", {
      condition: "temDividendos",
      tip: "Art. 261, II + Lei 9.249, art. 10",
    });

    h += _field("temMEPPos", "Resultado positivo de equivalência patrimonial", "checkbox");
    h += _field("mepPositivo", "Valor do MEP positivo", "money", {
      condition: "temMEPPos",
      tip: "Art. 389",
    });

    h += _field("temReversaoProvisao", "Reversão de provisões antes adicionadas", "checkbox");
    h += _field("reversaoProvisoes", "Valor das reversões", "money", {
      condition: "temReversaoProvisao",
      tip: "Art. 261, §ú, V — era Parte B, agora exclui",
    });

    h += _field("temSubvencao", "Subvenção para investimento", "checkbox");
    h += _field("subvencaoInvestimento", "Valor da subvenção", "money", {
      condition: "temSubvencao",
      tip: "⚠️ ATENÇÃO: A Lei 14.789/2023 revogou o art. 30 da Lei 12.973/2014. " +
           "Subvenções (ex: ICMS) passam a ser tributadas por IRPJ/CSLL/PIS/COFINS, " +
           "salvo adesão ao REIS (Regime Especial de Inclusão de Subvenção). " +
           "Consulte contador para verificar elegibilidade ao REIS.",
    });

    h += _field("temDepAcelIncentivada", "Depreciação acelerada incentivada", "checkbox");
    h += _field("depAceleradaIncentivadaExclusao", "Valor da exclusão por depreciação incentivada", "money", {
      condition: "temDepAcelIncentivada",
      tip: "Art. 324-329 — SUDAM/SUDENE ou atividade rural",
    });

    h += _field("temOutrasExclusoes", "Outras exclusões", "checkbox");
    h += _field("outrasExclusoes", "Valor de outras exclusões", "money", {
      condition: "temOutrasExclusoes",
    });

    // ── PDD Fiscal — Perdas no Recebimento de Créditos ──
    h += _sectionTitle("Perdas no Recebimento de Créditos (PDD Fiscal)");
    h += _infoBox(
      "Créditos vencidos há mais de 6 meses e com providências de cobrança podem ser " +
      "excluídos da base do IRPJ/CSLL (Art. 340-342, RIR/2018). " +
      "NÃO são adições temporárias — são exclusões definitivas quando os requisitos são cumpridos.",
      "wz-info-success"
    );
    h += _field("temPDD", "Possui perdas no recebimento de créditos?", "checkbox");
    h += '<div data-condition="temPDD" style="display:none">';
    h += _row(
      _field("perdasCreditos6Meses", "Créditos vencidos > 6 meses (com cobrança)", "money", {
        tip: "Créditos até R$ 15.000 por devedor: basta vencimento + provisão contábil. " +
             "Acima de R$ 15.000: necessário protesto, ação judicial, ou declaração de insolvência.",
      }) +
      _field("perdasCreditosJudicial", "Créditos em cobrança judicial", "money", {
        tip: "Independente do valor — basta ajuizamento da ação",
      })
    );
    h += _field("perdasCreditosFalencia", "Créditos com devedor em falência/recuperação", "money", {
      tip: "Dedutível a partir da sentença declaratória de falência ou deferimento da recuperação",
    });
    h += _autoCalcBox("calcPDD");
    h += "</div>";

    h += _autoCalcBox("calcTotalExclusoes");

    // ── Despesas Condicionais e Limites Legais ──
    h += _sectionTitle("Despesas Condicionais e Limites Legais");
    h += _infoBox(
      "Despesas sujeitas a limites legais de dedutibilidade. Valores que excedam os limites serão automaticamente adicionados ao LALUR como indedutíveis.",
      "wz-info-warning"
    );
    h += _row(
      _field("doacoesOperacionais", "Doações a entidades civis (operacionais)", "money", {
        tip: "Limite: 2% do lucro operacional (Art. 377)",
      }) +
      _field("doacoesOSCIP", "Doações a OSCIPs", "money", {
        tip: "Limite: 2% do lucro operacional (Art. 377, §1º)",
      })
    );
    h += _field("doacoesEntidadesEnsino", "Doações a entidades de ensino/pesquisa", "money", {
      tip: "Limite: 1,5% do lucro operacional (Art. 385)",
    });
    h += _field("previdenciaComplementarPatronal", "Contribuição patronal à previdência complementar", "money", {
      tip: "Limite: 20% da folha salarial anual (Art. 369, §1º)",
    });
    h += _field("royaltiesPagos", "Royalties e assistência técnica pagos", "money", {
      tip: "Limite: 5% da receita líquida (Art. 365)",
    });
    h += _row(
      _field("provisoesContingencias", "Provisões para contingências (trabalhistas, cíveis, fiscais)", "money", {
        tip: "NÃO dedutível — gera adição ao LALUR. Reversão futura gera exclusão. (Art. 340)",
      }) +
      _field("provisoesGarantias", "Provisões para garantia de produtos", "money", {
        tip: "NÃO dedutível (Art. 340)",
      })
    );
    h += _field("despesasBrindes", "Despesas com brindes", "money", {
      tip: "100% indedutível (Art. 13, VII Lei 9.249)",
    });
    h += _field("jurosVinculadasExterior", "Juros pagos a pessoa vinculada no exterior", "money", {
      tip: "Sujeito a regras de subcapitalização (Art. 249-251)",
    });

    h += _autoCalcBox("calcCustos");
    return h;
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  ETAPA 3 — Patrimônio, JCP e Prejuízos
  // ──────────────────────────────────────────────────────────────────────────
  function renderEtapa3() {
    var h = "";

    // ── Patrimônio Líquido ──
    h += _sectionTitle("Patrimônio Líquido");
    h += _infoBox(
      "O Patrimônio Líquido é a base para cálculo dos Juros sobre Capital Próprio (JCP). Informe o PL total ou detalhe os componentes.",
      ""
    );
    h += _field("patrimonioLiquido", "PL total (se souber diretamente)", "money", {
      tip: "Se preenchido, prevalece sobre os componentes abaixo.",
    });
    h += _field("detalharPL", "Ou detalhar componentes", "checkbox");
    h += '<div data-condition="detalharPL" style="display:none">';
    h += _row(
      _field("capitalSocial", "Capital Social Integralizado", "money") +
      _field("reservasCapital", "Reservas de Capital", "money")
    );
    h += _row(
      _field("reservasLucros", "Reservas de Lucros", "money") +
      _field("lucrosAcumulados", "Lucros Acumulados", "money")
    );
    h += _field("ajustesAvaliacaoPatrimonial", "Ajustes de Avaliação Patrimonial", "money", {
      tip: "Pode ser positivo ou negativo. CPC/Lei 6.404 Art. 182 §3°. Inclui: ajustes a valor justo de instrumentos financeiros, variações cambiais de investimentos no exterior, etc.",
    });
    h += _field("prejuizosContabeis", "(-) Prejuízos Acumulados (contábil)", "money");
    h += "</div>";
    h += _autoCalcBox("calcPL");

    // ── JCP ──
    h += _sectionTitle("Juros sobre Capital Próprio (JCP)");
    h += _infoBox(
      'O JCP permite DEDUZIR até PL × TJLP da base do IRPJ+CSLL. Para cada R$ 1,00 de JCP pago, a empresa economiza até R$ 0,165 líquido (34% de IRPJ+CSLL economizados − 17,5% de IRRF retido na distribuição — LC 224/2025). <strong>É a ferramenta de planejamento tributário mais poderosa do Lucro Real.</strong>',
      "wz-info-success"
    );
    // Aviso se só PL total preenchido (sem detalhamento)
    if (_n(dadosEmpresa.patrimonioLiquido) > 0 && !(dadosEmpresa.detalharPL === true || dadosEmpresa.detalharPL === "true")) {
      h += _infoBox(
        'Para cálculo preciso do JCP, detalhe os componentes do PL. O Limite 2 depende especificamente de Lucros Acumulados + Reservas de Lucros.',
        "wz-info-warning"
      );
    }
    h += _field("tjlp", "TJLP anual vigente (%)", "percent", {
      default: "7.97",
      tip: "Taxa de Juros de Longo Prazo (TJLP 2025: 7,97% a.a.). Consulte a taxa vigente no Banco Central (www.bcb.gov.br).",
    });
    h += _field("plAjustadoJCP", "PL Ajustado p/ JCP — Lei 14.789/2023 (opcional)", "money", {
      tip: "Conforme Lei 14.789/2023, a base do JCP pode ser limitada ao PL Ajustado (PL - MEP - PDD - AVP). Se informado, será usado no lugar do PL contábil total para cálculo do JCP máximo.",
    });
    h += _autoCalcBox("calcJCP");

    // ── Prejuízos Fiscais ──
    h += _sectionTitle("Prejuízos Fiscais");
    h += _infoBox(
      "Prejuízos fiscais podem ser compensados com até 30% do lucro ajustado por período. <strong>Não prescrevem.</strong>",
      ""
    );
    h += _row(
      _field("prejuizoFiscal", "Prejuízo Fiscal acumulado (IRPJ)", "money", {
        tip: "Saldo da Parte B do LALUR. Não prescreve.",
      }) +
      _field("baseNegativaCSLL", "Base Negativa de CSLL acumulada", "money", {
        tip: "Saldo acumulado. Trava de 30% aplica-se separadamente.",
      })
    );
    h += _field("temMudancaControle", "Houve mudança de controle societário?", "checkbox");
    h += _field("temMudancaRamo", "Houve mudança de ramo de atividade?", "checkbox", {
      condition: "temMudancaControle",
    });
    h += '<div data-condition="temMudancaControle" style="display:none">';
    h += _infoBox(
      '⚠️ Combinada com mudança de ramo, VEDA compensação (Art. 584)',
      "wz-info-warning"
    );
    h += "</div>";

    h += _field("tipoReorganizacao", "Houve incorporação/fusão/cisão?", "select", {
      options:
        '<option value="">Não</option>' +
        '<option value="incorporacao" ' + (dadosEmpresa.tipoReorganizacao === "incorporacao" ? "selected" : "") + ">Incorporação</option>" +
        '<option value="fusao" ' + (dadosEmpresa.tipoReorganizacao === "fusao" ? "selected" : "") + ">Fusão</option>" +
        '<option value="cisao_total" ' + (dadosEmpresa.tipoReorganizacao === "cisao_total" ? "selected" : "") + ">Cisão Total</option>" +
        '<option value="cisao_parcial" ' + (dadosEmpresa.tipoReorganizacao === "cisao_parcial" ? "selected" : "") + ">Cisão Parcial</option>",
    });
    h += _field("percentPLRemanescente", "% PL remanescente (cisão parcial)", "percent", {
      condition: "tipoReorganizacao",
      placeholder: "70",
    });

    h += _autoCalcBox("calcPrejuizos");

    // ── Estimativas já pagas ──
    // Seção só faz sentido para apuração anual (estimativa ou suspensão/redução)
    var apLR = dadosEmpresa.apuracaoLR || "";
    if (apLR === "anual_estimativa" || apLR === "anual_suspensao") {
      h += _sectionTitle("Estimativas já Pagas");
      h += _infoBox(
        "No regime anual por estimativa, antecipações mensais de IRPJ e CSLL são descontadas no ajuste anual.",
        ""
      );
      h += _field("pagouEstimativas", "Pagou estimativas mensais no período?", "checkbox");
      h += '<div data-condition="pagouEstimativas" style="display:none">';
      h += _row(
        _field("estimativasIRPJPagas", "Total estimativas IRPJ pagas", "money", {
          tip: "Estimativas pagas são descontadas do imposto devido no ajuste anual",
        }) +
        _field("estimativasCSLLPagas", "Total estimativas CSLL pagas", "money")
      );
      h += _field("estimativasPISCOFINSPagas", "Total estimativas PIS/COFINS pagas", "money", {
        tip: "Se aplicável ao regime anual por estimativa",
      });
      h += "</div>";
    } else if (apLR === "trimestral") {
      // Trimestral — não tem estimativas, mas permite informar antecipações
      h += _sectionTitle("Antecipações");
      h += _infoBox(
        "Na apuração trimestral, não há estimativas mensais. Antecipações ocorrem somente via retenções na fonte (informar na Etapa 5).",
        "wz-info-gray"
      );
    } else {
      // Sem apuração selecionada — mostra seção genérica
      h += _sectionTitle("Estimativas já Pagas");
      h += _infoBox(
        "Selecione a forma de apuração na Etapa 1 para habilitar os campos de estimativas.",
        "wz-info-gray"
      );
    }

    // ── Subcapitalização e Operações Vinculadas ──
    h += _sectionTitle("Subcapitalização e Operações Vinculadas");
    h += _infoBox(
      "Dívidas com pessoas vinculadas estão sujeitas a limites de dedutibilidade de juros (Art. 249-251 RIR/2018). Juros que excederem os limites são indedutíveis.",
      "wz-info-warning"
    );
    h += _row(
      _field("dividaVinculadaComParticipacao", "Dívida com vinculada que tem participação no PL", "money", {
        tip: "Limite: 2× participação da vinculada no PL (Art. 250)",
      }) +
      _field("participacaoVinculadaNoPL", "Participação da vinculada no PL", "money")
    );
    h += _field("dividaParaisoFiscal", "Dívida com entidade em paraíso fiscal", "money", {
      tip: "Limite: 30% do PL (Art. 251)",
    });
    h += _row(
      _field("prejuizoNaoOperacional", "Prejuízo não-operacional acumulado (alienação ativo)", "money", {
        tip: "Só compensa com lucro de mesma natureza (Art. 581-582)",
      }) +
      _field("lucroNaoOperacional", "Lucro na alienação de ativo imobilizado/investimento (ano corrente)", "money", {
        tip: "Compensável com prejuízo não-operacional acumulado",
      })
    );
    h += _field("atividadeRural", "Empresa tem atividade rural (permite compensação integral sem trava de 30%)", "checkbox", {
      tip: "Art. 583 — Prejuízo de atividade rural pode ser compensado integralmente, sem a trava de 30%",
    });

    // ── Vedações à Compensação ──
    h += _sectionTitle("Vedações à Compensação");
    h += _infoBox(
      "Situações que podem VEDAR ou LIMITAR a compensação de prejuízos fiscais. Preencha para diagnóstico de riscos.",
      "wz-info-warning"
    );
    h += _row(
      _field("houveMudancaControle", "Houve mudança de controle societário?", "checkbox", {
        tip: "Combinada com mudança de ramo, VEDA compensação (Art. 584)",
      }) +
      _field("houveMudancaRamo", "Houve mudança de ramo de atividade?", "checkbox", {
        tip: "Art. 584 — Vedada compensação se cumulada com mudança de controle",
      })
    );
    h += _field("tipoReorganizacaoVedacao", "Reorganização societária no período?", "select", {
      tip: "Incorporação/fusão/cisão podem limitar compensação de prejuízos (Art. 585)",
      options:
        '<option value="NENHUMA" ' + ((!dadosEmpresa.tipoReorganizacaoVedacao || dadosEmpresa.tipoReorganizacaoVedacao === "NENHUMA") ? "selected" : "") + '>Nenhuma</option>' +
        '<option value="INCORPORACAO" ' + (dadosEmpresa.tipoReorganizacaoVedacao === "INCORPORACAO" ? "selected" : "") + '>Incorporação</option>' +
        '<option value="FUSAO" ' + (dadosEmpresa.tipoReorganizacaoVedacao === "FUSAO" ? "selected" : "") + '>Fusão</option>' +
        '<option value="CISAO" ' + (dadosEmpresa.tipoReorganizacaoVedacao === "CISAO" ? "selected" : "") + '>Cisão</option>',
    });
    h += _field("ehSCP", "É Sociedade em Conta de Participação (SCP)?", "checkbox", {
      tip: "Prejuízos de SCP não compensam com ostensivo e vice-versa (Art. 586)",
    });

    return h;
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  ETAPA 4 — Retenções na Fonte e Créditos PIS/COFINS
  // ──────────────────────────────────────────────────────────────────────────
  function renderEtapa4() {
    var h = "";

    // ── Retenções ──
    h += _sectionTitle("Retenções na Fonte");
    h += _infoBox(
      '<strong>No Lucro Real, retenções são ANTECIPAÇÕES 100% compensáveis.</strong> Cada R$ 1 retido é R$ 1 a menos de imposto a pagar. Se retenções > imposto, gera saldo negativo (restituição via PER/DCOMP).',
      "wz-info-success"
    );

    // Modo automático baseado em % receita pública
    var percPub = _n(dadosEmpresa.percentReceitaPublico);
    if (percPub > 0) {
      var rbEst = _n(dadosEmpresa.receitaBrutaAnual);
      var irrfEst = _r(rbEst * (percPub / 100) * 0.048);
      var csrfEst = _r(rbEst * (percPub / 100) * 0.0465);
      h += _infoBox(
        '<strong>Estimativa automática</strong> (baseada em ' + percPub + '% de receita pública):<br>' +
        'IRRF estimado (4,8%): ' + _m(irrfEst) + ' | CSRF estimado (4,65%): ' + _m(csrfEst) +
        '<br><em>Edite os valores abaixo se necessário.</em>',
        "wz-info-default"
      );
    }

    h += _row(
      _field("irrfRetidoPrivado", "IRRF retido por empresas privadas (1,5%)", "money", {
        tip: "Art. 714 — Retenção sobre serviços profissionais",
      }) +
      _field("irrfRetidoPublico", "IRRF retido por órgãos públicos (4,8%)", "money", {
        tip: "Art. 720 + IN RFB 1.234/12",
      })
    );
    h += _row(
      _field("pisRetido", "PIS retido (0,65%)", "money") +
      _field("cofinsRetido", "COFINS retido (3,0%)", "money")
    );
    h += _row(
      _field("csllRetido", "CSLL retido (1,0%)", "money") +
      _field("issRetido", "ISS retido na fonte", "money")
    );

    h += _autoCalcBox("calcRetencoes");

    // ── Retenções Detalhadas por Tipo ──
    h += _sectionTitle("Retenções Detalhadas por Tipo");
    h += _infoBox(
      "Detalhamento das retenções por categoria de serviço. Permite cálculo preciso de saldos a compensar por tipo de tributo.",
      "wz-info-default"
    );
    h += _field("irrfServicosLimpeza", "IRRF — Serviços de limpeza/segurança/vigilância (1%)", "money", {
      tip: "Art. 716 — Retenção de 1% sobre serviços de limpeza, segurança e vigilância",
    });
    h += _field("irrfComissoes", "IRRF — Comissões e representação (1,5%)", "money", {
      tip: "Art. 718 — Retenção sobre comissões e corretagens",
    });
    h += _field("recebeDeAdmPublica", "Presta serviços para órgãos públicos?", "checkbox", {
      tip: "Se sim, sujeito a retenção unificada de 9,45% (IRPJ+CSLL+PIS+COFINS)",
    });
    h += _field("irrfAdmPublica", "IRRF — Serviços prestados à Administração Pública (4,8%)", "money", {
      condition: "recebeDeAdmPublica",
      tip: "Art. 720 + IN RFB 1.234/12 — Retenção unificada sobre pagamentos de órgãos públicos",
    });

    // ── CPRB — Desoneração da Folha ──
    h += _sectionTitle("Desoneração da Folha (CPRB)");
    h += _infoBox(
      "Empresas de TI, construção civil, comunicação e outros setores podem optar pela CPRB. " +
      "Substitui a CPP patronal de 20% por alíquota sobre receita bruta (Lei 12.546/2011).",
      ""
    );
    // Auto-detectar elegibilidade pelo CNAE principal
    var cnaePri = (dadosEmpresa.cnaePrincipal || "").replace(/[\s\-\/]/g, "");
    if (cnaePri.substring(0, 2) === "62" || dadosEmpresa._cprbSugerida) {
      h += _infoBox(
        'CNAE de TI detectado — sua empresa é elegível à CPRB (alíquota 4,5% sobre receita bruta em vez de 20% sobre folha). Avalie abaixo.',
        "wz-info-success"
      );
    }
    h += _field("optouCPRB", "Empresa optou pela CPRB?", "checkbox");
    h += '<div data-condition="optouCPRB" style="display:none">';
    h += _row(
      _field("aliquotaCPRB", "Alíquota CPRB (%)", "percent", {
        default: "4.5",
        tip: "TI/Serviços: 4,5%. Construção/Transporte: 1% a 3%. Verificar Lei 12.546/2011 e alterações.",
      }) +
      _field("receitaBrutaCPRB", "Base de cálculo CPRB (receita bruta do período)", "money", {
        tip: "Se igual à receita bruta total, pode deixar em branco (usará a receita bruta informada na Etapa 2)",
      })
    );
    h += _autoCalcBox("calcCPRB");
    h += "</div>";

    // ── Créditos PIS/COFINS ──
    h += _sectionTitle("Créditos de PIS/COFINS (Não-Cumulativo)");
    h += _infoBox(
      '<strong>No Lucro Real, PIS/COFINS são não-cumulativos:</strong> alíquota de 9,25% sobre receita, mas com DIREITO A CRÉDITOS sobre insumos, energia, aluguéis, depreciação etc. Se seus custos com crédito são altos, a alíquota efetiva pode ser MUITO menor que 9,25%.',
      "wz-info-default"
    );

    h += _row(
      _field("comprasMercadoriasAnual", "Compras de mercadorias/insumos", "money", {
        tip: "Art. 3º, I — Bens para revenda e insumos",
      }) +
      _field("energiaCredito", "Energia elétrica", "money", {
        tip: "Art. 3º, III — Energia consumida na atividade",
      })
    );
    h += _row(
      _field("alugueisPJCredito", "Aluguéis pagos a PJ", "money", {
        tip: "Art. 3º, IV",
      }) +
      _field("leasingCredito", "Contraprestação de leasing", "money", {
        tip: "Art. 3º, V — Arrendamento mercantil operacional",
      })
    );
    h += _row(
      _field("depreciacaoBensCredito", "Depreciação de máquinas na produção", "money", {
        tip: "Art. 3º, VI",
      }) +
      _field("depreciacaoEdifCredito", "Depreciação de edificações", "money", {
        tip: "Art. 3º, VII",
      })
    );
    h += _row(
      _field("freteVendasAnual", "Fretes sobre vendas", "money", {
        tip: "Art. 3º, IX",
      }) +
      _field("armazenagemCredito", "Armazenagem", "money", {
        tip: "Art. 3º, IX",
      })
    );
    h += _row(
      _field("valeTranspAlim", "Vale-transporte/alimentação funcionários", "money") +
      _field("manutencaoMaquinas", "Manutenção de máquinas", "money")
    );
    h += _row(
      _field("devolucoesVendas", "Devoluções de vendas", "money") +
      _field("outrosCreditosPC", "Outros custos com crédito", "money")
    );
    h += _field("creditoEstoqueAbertura", "Crédito sobre estoque de abertura", "money", {
      tip: "Se migrou recentemente para Lucro Real, tem direito a crédito sobre estoques existentes — 1/12 por mês durante 12 meses",
    });

    h += _autoCalcBox("calcPisCofins");
    return h;
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  ETAPA 5 — Ativos, Depreciação e Incentivos
  // ──────────────────────────────────────────────────────────────────────────
  function renderEtapa5() {
    var h = "";
    var uf = dadosEmpresa.uf || "";
    var isSUDAM = LR && LR.helpers ? LR.helpers.ehSUDAM(uf) : false;
    var isSUDENE = LR && LR.helpers ? LR.helpers.ehSUDENE(uf) : false;
    if (!isSUDAM && LR && LR.sudam) isSUDAM = LR.sudam.estados.indexOf(uf) >= 0;
    if (!isSUDENE && LR && LR.sudene) isSUDENE = LR.sudene.estados.indexOf(uf) >= 0;

    // ── Bens do ativo ──
    h += _sectionTitle("Bens do Ativo Imobilizado");
    h += _infoBox(
      "Informe o valor original total dos bens por categoria. A depreciação será calculada automaticamente com base nas taxas fiscais. Dados de LR.depreciacao.tabela.",
      ""
    );
    h += _row(
      _field("valorVeiculos", "Veículos (20% a.a. — 5 anos)", "money") +
      _field("valorMaquinas", "Máquinas e Equipamentos (10% a.a. — 10 anos)", "money")
    );
    h += _row(
      _field("valorComputadores", "Computadores/Periféricos (20% a.a. — 5 anos)", "money") +
      _field("valorMoveis", "Móveis e Utensílios (10% a.a. — 10 anos)", "money")
    );
    h += _row(
      _field("valorEdificios", "Edifícios/Construções (4% a.a. — 25 anos)", "money") +
      _field("valorDrones", "Drones/GPS/Equip. técnicos (20% a.a. — 5 anos)", "money")
    );
    h += _row(
      _field("valorTratores", "Tratores (25% a.a. — 4 anos)", "money") +
      _field("valorSoftware", "Software adquirido (20% a.a. — 5 anos)", "money")
    );
    h += _row(
      _field("valorInstalacoes", "Instalações (10% a.a. — 10 anos)", "money") +
      _field("valorOutrosBens", "Outros bens (10% a.a. default)", "money")
    );
    h += _field("bensSmallValue", "Bens de pequeno valor (≤ R$ 1.200)", "money", {
      tip: "Podem ser lançados diretamente como despesa no período (Art. 313, §1º)",
    });

    // ── Depreciação acelerada por turnos ──
    h += _sectionTitle("Depreciação Acelerada (Turnos) — Art. 323");
    h += _field("turnosOperacao", "Turnos de operação por dia", "radio", {
      options: [
        { value: "1", label: "1 turno (8h) — multiplicador 1,0×" },
        { value: "2", label: "2 turnos (16h) — multiplicador 1,5×" },
        { value: "3", label: "3 turnos (24h) — multiplicador 2,0×" },
      ],
      default: "1",
      tip: "Art. 323 — Mais turnos = depreciação mais rápida = menor base tributável",
    });

    // ── Depreciação incentivada SUDAM/SUDENE ──
    if (isSUDAM || isSUDENE) {
      h += _sectionTitle("Depreciação Acelerada Incentivada (SUDAM/SUDENE)");
      h += _infoBox(
        "Como sua empresa está em área " + (isSUDAM ? "SUDAM" : "SUDENE") +
        ", bens NOVOS adquiridos podem ter depreciação integral (100%) no ano de aquisição — Art. 329 RIR/2018.",
        "wz-info-success"
      );
      h += _field("temBensNovos", "Adquiriu bens NOVOS nos últimos 12 meses?", "checkbox");
      h += _field("valorBensNovos", "Valor dos bens novos", "money", {
        condition: "temBensNovos",
        tip: "Depreciação integral (100%) no ano de aquisição",
      });
    }

    // ── Incentivos Regionais ──
    h += _sectionTitle("Incentivos Regionais (SUDAM/SUDENE)");
    if (isSUDAM) {
      h += _infoBox(
        '✅ <strong>' + uf + ' — Área SUDAM (Amazônia Legal)</strong> — elegível a redução de até 75% do IRPJ sobre o lucro da exploração, com prazo de 10 anos. É o maior incentivo fiscal disponível no Brasil.',
        "wz-info-success"
      );
    } else if (isSUDENE) {
      h += _infoBox(
        '✅ <strong>' + uf + ' — Área SUDENE</strong> — elegível a redução de até 75% do IRPJ sobre o lucro da exploração.',
        "wz-info-success"
      );
    } else {
      h += _infoBox(
        'A UF selecionada (' + (uf || "nenhuma") + ') não está em área SUDAM nem SUDENE. Incentivos regionais não se aplicam.',
        "wz-info-gray"
      );
    }
    h += _field("temProjetoAprovado", "Tem projeto aprovado na " + (isSUDAM ? "SUDAM" : isSUDENE ? "SUDENE" : "SUDAM/SUDENE") + "?", "checkbox");
    h += '<div data-condition="temProjetoAprovado" style="display:none">';
    h += _row(
      _field("setorPrioritario", "Setor prioritário do projeto", "select", {
        options: '<option value="">Selecione...</option>' +
          (LR && LR.sudam && LR.sudam.setoresPrioritarios
            ? LR.sudam.setoresPrioritarios.map(function (s) {
                return '<option value="' + s.id + '" ' +
                  (dadosEmpresa.setorPrioritario === s.id ? "selected" : "") +
                  ">" + s.label + "</option>";
              }).join("")
            : ""),
      }) +
      _field("percentualReducao", "Percentual de redução IRPJ", "select", {
        options:
          '<option value="75">75% (padrão)</option>' +
          '<option value="50" ' + (dadosEmpresa.percentualReducao === "50" ? "selected" : "") + ">50%</option>" +
          '<option value="25" ' + (dadosEmpresa.percentualReducao === "25" ? "selected" : "") + ">25%</option>",
      })
    );
    h += _row(
      _field("possuiLaudoConstitutivo", "Possui Laudo Constitutivo emitido?", "checkbox") +
      _field("possuiReconhecimentoSRF", "Possui reconhecimento da SRF?", "checkbox")
    );
    h += _field("usarReinvestimento30", "Utiliza reinvestimento de 30%?", "checkbox", {
      tip: "30% do IRPJ sobre lucro da exploração depositado em banco oficial. 50% pode ser usado como capital de giro (Lei 13.799/2019)",
    });
    h += "</div>";

    // ── Incentivos Fiscais Diretos ──
    h += _sectionTitle("Incentivos Fiscais (Dedução do IRPJ)");
    h += _infoBox(
      'Incentivos fiscais são deduções DIRETAS do IRPJ normal (15%). Cada um tem limite individual e o somatório não pode ultrapassar o IRPJ normal.',
      ""
    );

    h += _field("usaPAT", "PAT — Programa de Alimentação do Trabalhador (até 4% IRPJ)", "checkbox");
    h += _field("valorPAT", "Valor investido no PAT", "money", { condition: "usaPAT" });

    h += _field("usaFIA", "FIA — Fundo da Infância e Adolescência (até 1%)", "checkbox");
    h += _field("valorFIA", "Valor doado ao FIA", "money", { condition: "usaFIA" });

    h += _field("usaFundoIdoso", "Fundo do Idoso (até 1%)", "checkbox");
    h += _field("valorFundoIdoso", "Valor doado ao Fundo do Idoso", "money", { condition: "usaFundoIdoso" });

    h += _field("usaRouanet", "Lei Rouanet — Cultura (até 4%)", "checkbox");
    h += _field("valorRouanet", "Valor investido em cultura", "money", { condition: "usaRouanet" });

    h += _field("usaEsporte", "Lei do Esporte (até 1%)", "checkbox");
    h += _field("valorEsporte", "Valor investido em esporte", "money", { condition: "usaEsporte" });

    h += _field("usaPRONON", "PRONON — Oncologia (até 1%)", "checkbox");
    h += _field("valorPRONON", "Valor investido PRONON", "money", { condition: "usaPRONON" });

    h += _field("usaPRONAS", "PRONAS/PCD — Pessoa com Deficiência (até 1%)", "checkbox");
    h += _field("valorPRONAS", "Valor investido PRONAS/PCD", "money", { condition: "usaPRONAS" });

    h += _field("usaEmpresaCidada", "Empresa Cidadã — prorrogação licença-maternidade (valor integral)", "checkbox");

    h += _sectionTitle("Lei do Bem (Pesquisa & Desenvolvimento)");
    h += _field("investePD", "Investe em P&D (Lei do Bem)?", "checkbox");
    h += _field("valorPD", "Valor anual investido em P&D", "money", {
      condition: "investePD",
      tip: "Exclusão de 60% a 80% dos gastos da base IRPJ+CSLL — Lei 11.196/2005",
    });

    h += _autoCalcBox("calcDepreciacao");

    // ── Método de Avaliação de Estoques ──
    h += _sectionTitle("Método de Avaliação de Estoques");
    h += _infoBox(
      "O método de avaliação de estoque afeta o custo das mercadorias vendidas e, consequentemente, o lucro tributável. O método deve ser consistente ano a ano. UEPS é vedado.",
      ""
    );
    h += _field("metodoEstoque", "Método de avaliação de estoque", "select", {
      tip: "Método deve ser consistente ano a ano. UEPS é vedado. (Art. 307)",
      options:
        '<option value="" ' + (!dadosEmpresa.metodoEstoque ? "selected" : "") + '>Selecione...</option>' +
        '<option value="CUSTO_MEDIO" ' + (dadosEmpresa.metodoEstoque === "CUSTO_MEDIO" ? "selected" : "") + '>Custo Médio Ponderado (Art. 307)</option>' +
        '<option value="PEPS" ' + (dadosEmpresa.metodoEstoque === "PEPS" ? "selected" : "") + '>PEPS/FIFO — Primeiro a Entrar, Primeiro a Sair (Art. 307)</option>' +
        '<option value="PRECO_VENDA_MARGEM" ' + (dadosEmpresa.metodoEstoque === "PRECO_VENDA_MARGEM" ? "selected" : "") + '>Preço de Venda menos Margem (Art. 307)</option>' +
        '<option value="MERCADO_RURAL" ' + (dadosEmpresa.metodoEstoque === "MERCADO_RURAL" ? "selected" : "") + '>Preços Correntes de Mercado — Rural (Art. 309)</option>',
    });
    h += _field("valorEstoqueFinal", "Valor do estoque final do período", "money", {
      tip: "Usado para validação do método e cálculo do CMV integrado",
    });

    // ── Amortização e Exaustão ──
    h += _sectionTitle("Amortização e Exaustão");
    h += _infoBox(
      "Goodwill, recursos naturais e despesas pré-operacionais geram deduções por amortização ou exaustão, reduzindo a base tributável ao longo do tempo.",
      ""
    );
    h += _field("valorGoodwill", "Goodwill (ágio por expectativa de rentabilidade)", "money", {
      tip: "Amortizável em 1/60 avos/mês = 20% ao ano (Lei 12.973, Arts. 20-22)",
    });
    h += _field("valorRecursosNaturais", "Custo de direitos minerais/florestais para exaustão", "money", {
      tip: "Art. 334-337 do RIR/2018",
    });
    h += _field("despesasPreOperacionais", "Despesas pré-operacionais (em amortização)", "money", {
      tip: "Amortização diferida — mínimo de 5 anos (Art. 11 Lei 12.973)",
    });

    return h;
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  ETAPA 6 — Revisão, Cenários e Configuração do Relatório
  // ──────────────────────────────────────────────────────────────────────────
  function renderEtapa6() {
    var h = "";
    var d = dadosEmpresa;

    // ── Resumo dos dados ──
    h += _sectionTitle("Resumo dos Dados");
    h += '<div class="wz-resumo">';
    h += '<table class="wz-resumo-table">';
    h += '<tr><td><strong>Empresa:</strong></td><td>' + (d.razaoSocial || "—") + '</td>';
    h += '<td><strong>UF/Município:</strong></td><td>' + (d.uf || "—") + " / " + (d.municipio || "—") + " (ISS: " + (d.issAliquota || "5") + "%)" + '</td></tr>';
    h += '<tr><td><strong>Atividade:</strong></td><td>' + _nomeAtividade(d.tipoAtividade) + '</td>';
    h += '<td><strong>Apuração:</strong></td><td>' + _nomeApuracao(d.apuracaoLR) + '</td></tr>';
    h += '<tr><td><strong>Receita Bruta:</strong></td><td>' + _m(_n(d.receitaBrutaAnual)) + '</td>';
    h += '<td><strong>Custos+Despesas:</strong></td><td>' + _m(_calcTotalCustos() + _calcTotalDespesas()) + '</td></tr>';

    var ll = _calcLL();
    var adj = _calcLucroAjustado();
    h += '<tr><td><strong>Lucro Líquido:</strong></td><td>' + _m(ll) + '</td>';
    h += '<td><strong>Lucro Ajustado:</strong></td><td>' + _m(adj) + '</td></tr>';

    var plVal = _calcPL();
    h += '<tr><td><strong>PL:</strong></td><td>' + _m(plVal) + '</td>';
    h += '<td><strong>Prejuízo Fiscal:</strong></td><td>' + _m(_n(d.prejuizoFiscal)) + '</td></tr>';

    var retTotal = _n(d.irrfRetidoPrivado) + _n(d.irrfRetidoPublico) + _n(d.pisRetido) + _n(d.cofinsRetido) + _n(d.csllRetido);
    h += '<tr><td><strong>Retenções:</strong></td><td>' + _m(retTotal) + '</td>';
    h += '<td><strong>Créditos PIS/COFINS:</strong></td><td>' + _m(_calcBaseCreditos()) + '</td></tr>';
    h += '</table>';

    // Botões de editar por etapa
    h += '<div class="wz-resumo-editar">';
    for (var i = 0; i < ETAPAS.length - 1; i++) {
      h += '<button class="wz-btn wz-btn-small" onclick="LucroRealEstudos.goToStep(' + i + ')">✏️ ' + ETAPAS[i].titulo + '</button>';
    }
    h += '</div>';
    h += '</div>';

    // ── Cenários ──
    h += _sectionTitle("Configuração de Cenários");
    h += _field("gerarCenarios", "Gerar cenários de sensibilidade?", "checkbox", {
      default: true,
    });
    h += '<div data-condition="gerarCenarios" style="display:none">';
    h += _field("variacaoMargemCenario", "Variação de margem para cenários (pontos percentuais)", "percent", {
      default: "5",
      tip: "Pessimista: margem - X pp | Base: margem informada | Otimista: margem + X pp",
    });
    h += "</div>";

    h += _field("gerarProjecao", "Gerar projeção plurianual?", "checkbox", {
      default: true,
    });
    h += '<div data-condition="gerarProjecao" style="display:none">';
    h += _row(
      _field("taxaCrescimentoAnual", "Taxa de crescimento anual da receita (%)", "percent", {
        default: "10",
      }) +
      _field("horizonteProjecao", "Horizonte de projeção", "select", {
        options:
          '<option value="3" ' + (dadosEmpresa.horizonteProjecao === "3" ? "selected" : "") + ">3 anos</option>" +
          '<option value="5" ' + ((!dadosEmpresa.horizonteProjecao || dadosEmpresa.horizonteProjecao === "5") ? "selected" : "") + ">5 anos</option>" +
          '<option value="10" ' + (dadosEmpresa.horizonteProjecao === "10" ? "selected" : "") + ">10 anos</option>",
      })
    );
    h += "</div>";

    // ── Personalização do relatório ──
    h += _sectionTitle("Personalização do Relatório");
    h += _row(
      _field("nomeElaborador", "Nome do elaborador", "text", {
        tip: "Aparece no cabeçalho do relatório impresso",
      }) +
      _field("registroProfissional", "Registro profissional (CRC/OAB)", "text")
    );
    h += _row(
      _field("emailContato", "Email de contato", "text") +
      _field("telefoneContato", "Telefone", "text")
    );
    h += _field("logoURL", "Logo (URL da imagem)", "text", {
      tip: "URL de imagem para cabeçalho do relatório (opcional)",
      placeholder: "https://...",
    });

    return h;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  INTEGRAÇÃO COM MunicipiosIBGE — select dinâmico de municípios
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Chamado quando a UF muda na etapa 0
   */
  async function _carregarMunicipios(uf) {
    var selectMun = $("municipio");
    var loading = $("municipioLoading");
    if (!selectMun || !uf) return;

    // Mostrar loading
    selectMun.innerHTML = '<option value="">Carregando municípios...</option>';
    selectMun.disabled = true;
    if (loading) loading.style.display = "";

    try {
      if (window.MunicipiosIBGE) {
        var municipios = await window.MunicipiosIBGE.buscarMunicipios(uf, ESTADOS);
        window.MunicipiosIBGE.renderizarSelect(selectMun, municipios, { mostrarISS: true });
      } else {
        // Fallback: select vazio editável
        selectMun.innerHTML = '<option value="">MunicipiosIBGE não disponível</option>';
        selectMun.disabled = false;
      }
    } catch (e) {
      console.warn("[LREstudos] Falha API IBGE, usando fallback:", e);
      try {
        if (window.MunicipiosIBGE) {
          var fallback = window.MunicipiosIBGE.fallbackEstadosJS(uf, ESTADOS);
          window.MunicipiosIBGE.renderizarSelect(selectMun, fallback, { mostrarISS: true });
        }
      } catch (e2) {
        selectMun.innerHTML = '<option value="">Erro ao carregar municípios</option>';
        selectMun.disabled = false;
      }
    }

    if (loading) loading.style.display = "none";

    // Se já tinha município salvo, restaurar seleção
    if (dadosEmpresa.municipio) {
      for (var i = 0; i < selectMun.options.length; i++) {
        if (selectMun.options[i].value === dadosEmpresa.municipio) {
          selectMun.selectedIndex = i;
          break;
        }
      }
    }
  }

  /**
   * Chamado quando o município é selecionado
   */
  function onMunicipioChanged(selectEl) {
    var opt = selectEl.selectedOptions[0];
    if (opt && opt.value) {
      dadosEmpresa.municipio = opt.value;
      if (opt.dataset.iss) {
        dadosEmpresa.issAliquota = parseFloat(opt.dataset.iss);
        dadosEmpresa.issConhecido = opt.dataset.issConhecido === "1";
        // Atualizar campo ISS
        var issInput = $("issAliquota");
        if (issInput) issInput.value = dadosEmpresa.issAliquota;
      }
      // Atualizar dica ISS
      var dicaEl = $("dicaISS");
      if (dicaEl && window.MunicipiosIBGE) {
        dicaEl.innerHTML = window.MunicipiosIBGE.gerarDicaISS(
          dadosEmpresa.issConhecido,
          opt.value
        );
      }
      saveToLS();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  SAVE / RESTORE / LOCALSTORAGE
  // ═══════════════════════════════════════════════════════════════════════════

  function saveField(id, val) {
    dadosEmpresa[id] = val;
    saveToLS();
    bindConditionals();
    updateAutoCalcs();

    // Tratamento especial: ao mudar UF, carregar municípios e mostrar badge
    if (id === "uf" && val) {
      _carregarMunicipios(val);
      _atualizarBadgeUF(val);
    }

    // Tratamento: alertas de obrigatoriedade
    if (id === "ehFinanceira" || id === "tipoAtividade") {
      _verificarAlertaObrigatoriedade();
    }

    // Tratamento: ao mudar tipo de serviço ISS, atualizar dica de faixa
    if (id === "tipoServicoISS") {
      var dicaEl2 = $("dicaISS");
      if (dicaEl2) {
        var faixas = {
          informatica: { min: 2, max: 5, desc: "Informática (Item 1)" },
          saude: { min: 2, max: 3, desc: "Saúde (Item 4)" },
          engenharia: { min: 2, max: 5, desc: "Engenharia/Arquitetura (Item 7)" },
          educacao: { min: 2, max: 5, desc: "Educação (Item 8)" },
          contabilidade: { min: 2, max: 5, desc: "Contabilidade (Item 17)" },
          advocacia: { min: 2, max: 5, desc: "Advocacia (Item 17)" },
          consultoria: { min: 2, max: 5, desc: "Consultoria (Item 17)" },
          construcao: { min: 2, max: 5, desc: "Construção civil (Item 7)" },
          transporte: { min: 2, max: 5, desc: "Transporte municipal (Item 16)" },
          outros: { min: 2, max: 5, desc: "Outros serviços" },
        };
        var f = faixas[val];
        if (f) {
          dicaEl2.innerHTML = '<span style="color:#3498db;">Faixa ISS para ' + f.desc + ': ' + f.min + '% a ' + f.max + '%. Verifique a alíquota específica do seu município.</span>';
        }
      }
    }

    // Tratamento: validar ISS manualmente alterado
    if (id === "issAliquota" && window.MunicipiosIBGE) {
      var validacao = window.MunicipiosIBGE.validarISS(val);
      var dicaEl = $("dicaISS");
      if (dicaEl && !validacao.valido) {
        dicaEl.innerHTML = '<span style="color:#f59e0b;">⚠️ ' + validacao.msg + '</span>';
      }
    }

    // Alerta receita exterior
    if (id === "receitasExteriorAnual" && _n(val) > 0) {
      var alertaExt = $("alertaExterior");
      if (alertaExt) {
        alertaExt.innerHTML = '<div class="wz-badge wz-badge-red">⚠️ Receitas do exterior tornam o Lucro Real OBRIGATÓRIO (Art. 257, III)</div>';
      }
    }
  }

  function saveMoney(id, el) {
    // Extrair apenas dígitos (e vírgula/ponto decimal) para obter o valor numérico
    var raw = el.value.replace(/[^\d]/g, "");
    // Interpretar como centavos: 3000000 digitado = 30.000,00
    // Mas para UX: tratar como inteiro enquanto não tem vírgula
    // Abordagem: remover tudo que não é dígito, tratar como centavos
    var centavos = parseInt(raw, 10) || 0;
    var valor = centavos / 100;
    dadosEmpresa[id] = valor;

    // Aplicar máscara brasileira no input mantendo cursor funcional
    var formatted = _fmtBRL(valor);
    el.value = formatted;

    saveToLS();
    updateAutoCalcs();
  }

  function saveToLS() {
    try {
      localStorage.setItem(LS_KEY_DADOS, JSON.stringify(dadosEmpresa));
      localStorage.setItem(LS_KEY_STEP, String(currentStep));
    } catch (e) { /* ignore */ }
  }

  function loadFromLS() {
    try {
      var savedDados = localStorage.getItem(LS_KEY_DADOS);
      if (savedDados) dadosEmpresa = JSON.parse(savedDados);
      var savedStep = localStorage.getItem(LS_KEY_STEP);
      if (savedStep !== null) currentStep = parseInt(savedStep) || 0;
    } catch (e) { /* ignore */ }
  }

  function restoreValues() {
    Object.keys(dadosEmpresa).forEach(function (id) {
      var el = $(id);
      if (!el) return;
      var val = dadosEmpresa[id];
      if (el.type === "checkbox") {
        el.checked = val === true || val === "true" || val === "on";
      } else if (el.closest && el.closest(".wz-input-prefix")) {
        el.value = val ? _fmtBRL(val) : "";
      } else {
        el.value = val !== undefined ? val : "";
      }
    });
    // Restaurar radio groups
    Object.keys(dadosEmpresa).forEach(function (id) {
      var radios = document.querySelectorAll('input[name="' + id + '"]');
      if (radios.length > 0) {
        radios.forEach(function (r) {
          r.checked = r.value === String(dadosEmpresa[id]);
        });
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  BIND CONDITIONALS
  // ═══════════════════════════════════════════════════════════════════════════

  function bindConditionals() {
    $$("[data-condition]").forEach(function (el) {
      var condId = el.getAttribute("data-condition");
      var val = dadosEmpresa[condId];
      var visible = false;

      if (condId === "tipoReorganizacao") {
        visible = val === "cisao_parcial";
      } else if (condId === "receitasExteriorAnual") {
        visible = _n(val) > 0;
      } else {
        visible =
          val === true ||
          val === "true" ||
          val === "on" ||
          (val && val !== "false" && val !== "" && val !== "0" && val !== 0);
      }

      el.style.display = visible ? "" : "none";
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  CÁLCULOS EM TEMPO REAL — updateAutoCalcs
  // ═══════════════════════════════════════════════════════════════════════════

  function updateAutoCalcs() {
    if (!LR) return;
    var d = dadosEmpresa;

    // ── Soma receitas detalhadas ──
    var calcSomaRec = $("calcSomaReceitas");
    if (calcSomaRec) {
      var soma = _n(d.receitaServicos) + _n(d.receitaComercio) + _n(d.receitaFinanceiras) + _n(d.receitaAlugueis) + _n(d.outrasReceitas);
      calcSomaRec.innerHTML = '<strong>Soma das receitas detalhadas: ' + _m(soma) + '</strong>';
    }

    // ── Soma meses ──
    var calcSomaMeses = $("calcSomaMeses");
    if (calcSomaMeses) {
      var somaMes = 0;
      for (var m = 1; m <= 12; m++) somaMes += _n(d["receitaMes" + m]);
      calcSomaMeses.innerHTML = '<strong>Soma 12 meses: ' + _m(somaMes) + '</strong>';
    }

    // ── Prévia Receitas (etapa 1) ──
    var calcReceitas = $("calcReceitas");
    if (calcReceitas) {
      var rb = _n(d.receitaBrutaAnual);
      var isentas = _n(d.receitasIsentas) + _n(d.receitaExportacao) + _n(d.receitasMonofasicas);
      var tributavel = Math.max(rb - isentas, 0);
      var percPub = _n(d.percentReceitaPublico);
      var irrfEst = percPub > 0 ? _r(rb * (percPub / 100) * 0.048) : 0;
      var csrfEst = percPub > 0 ? _r(rb * (percPub / 100) * 0.0465) : 0;
      calcReceitas.innerHTML =
        '<strong>📊 Prévia de Receita</strong><br>' +
        'Receita Bruta Total: <strong>' + _m(rb) + '</strong><br>' +
        'Receita Tributável PIS/COFINS: <strong>' + _m(tributavel) + '</strong>' +
        (percPub > 0
          ? '<br>Estimativa retenções órgãos públicos: IRRF (4,8%): ' + _m(irrfEst) + ' | CSRF (4,65%): ' + _m(csrfEst)
          : "");
    }

    // ── Total Adições (etapa 2) ──
    var calcTotAd = $("calcTotalAdicoes");
    if (calcTotAd) {
      var totalAd = _calcTotalAdicoes();
      calcTotAd.innerHTML =
        '<strong>TOTAL DE ADIÇÕES: ' + _m(totalAd) + '</strong>' +
        (totalAd > 0 ? '<br>Impacto fiscal das adições: ' + _m(totalAd) + ' × 34% = <strong>' + _m(totalAd * 0.34) + '</strong>' : '');
    }

    // ── PDD Fiscal (etapa 2) ──
    var calcPDD = $("calcPDD");
    if (calcPDD) {
      var totalPDD = _n(d.perdasCreditos6Meses) + _n(d.perdasCreditosJudicial) + _n(d.perdasCreditosFalencia);
      if (totalPDD > 0) {
        var econPDD = _r(totalPDD * 0.34);
        calcPDD.innerHTML =
          '<strong>Total PDD Fiscal (exclusão do lucro real): ' + _m(totalPDD) + '</strong><br>' +
          'Economia potencial (25% IRPJ + 9% CSLL): <span style="color:#2ECC71"><strong>' + _m(econPDD) + '</strong></span>';
      } else {
        calcPDD.innerHTML = "";
      }
    }

    // ── Total Exclusões (etapa 2) ──
    var calcTotEx = $("calcTotalExclusoes");
    if (calcTotEx) {
      var totalEx = _calcTotalExclusoes();
      calcTotEx.innerHTML =
        '<strong>TOTAL DE EXCLUSÕES: ' + _m(totalEx) + '</strong>' +
        (totalEx > 0 ? '<br>Economia das exclusões: ' + _m(totalEx) + ' × 34% = <strong style="color:#2ECC71">' + _m(totalEx * 0.34) + '</strong>' : '');
    }

    // ── Prévia LALUR (etapa 2) ──
    var calcCustos = $("calcCustos");
    if (calcCustos) {
      var rb2 = _n(d.receitaBrutaAnual);
      var custos = _calcTotalCustos();
      var despesas = _calcTotalDespesas();
      var ll = rb2 - custos - despesas;
      var margem = rb2 > 0 ? (ll / rb2 * 100) : 0;
      var adicoes = _calcTotalAdicoes();
      var exclusoes = _calcTotalExclusoes();
      var lucroAjustado = ll + adicoes - exclusoes;
      var alertas = "";
      if (margem > 50 && d.tipoAtividade === "COMERCIO_INDUSTRIA") alertas += '<br><span style="color:#e67e22">⚠️ Margem > 50% para comércio é incomum — confirme</span>';
      if (margem > 80) alertas += '<br><span style="color:#e67e22">⚠️ Margem > 80% é atípica — verifique custos e despesas</span>';
      if (ll > rb2 && rb2 > 0) alertas += '<br><span style="color:#c0392b">⚠️ Lucro > Receita — há inconsistência</span>';
      if (custos === 0 && rb2 > 0) alertas += '<br><span style="color:#e67e22">⚠️ Nenhum custo informado — o estudo pode ficar impreciso</span>';

      calcCustos.innerHTML =
        '<strong>📊 Prévia do LALUR</strong><br>' +
        'Receita Bruta: ' + _m(rb2) + '<br>' +
        '(-) Custos Totais: ' + _m(custos) + '<br>' +
        '(-) Despesas Totais: ' + _m(despesas) + '<br>' +
        '<strong>= LUCRO LÍQUIDO CONTÁBIL: ' + _m(ll) + '</strong><br>' +
        '(+) Total de Adições: ' + _m(adicoes) + '<br>' +
        '(-) Total de Exclusões: ' + _m(exclusoes) + '<br>' +
        '<strong>= LUCRO AJUSTADO: ' + _m(lucroAjustado) + '</strong> <span style="color:#95a5a6;font-size:0.85em">(antes de ajustes automáticos — valor preliminar)</span><br>' +
        '<span style="color:#e67e22;font-size:0.82em;">⚠️ Valor parcial — PIS/COFINS sobre receita e depreciação fiscal serão deduzidos automaticamente nas próximas etapas, reduzindo esta base.</span><br>' +
        'Margem de Lucro: ' + margem.toFixed(1) + '%' +
        alertas;
    }

    // ── PL (etapa 3) ──
    var calcPL = $("calcPL");
    if (calcPL) {
      var pl = _calcPL();
      calcPL.innerHTML = '<strong>= PATRIMÔNIO LÍQUIDO: ' + _m(pl) + '</strong>';
    }

    // ── JCP (etapa 3) ──
    var calcJCP = $("calcJCP");
    if (calcJCP && LR.calcular) {
      var plVal = _calcPL();
      var llVal = _calcLL();
      if (plVal > 0 && llVal > 0) {
        try {
          var jcpRes = LR.calcular.jcp({
            patrimonioLiquido: _n(d.plAjustadoJCP) > 0 ? _n(d.plAjustadoJCP) : plVal,
            capitalSocial: _n(d.capitalSocial) || null,
            reservasCapital: _n(d.reservasCapital),
            reservasLucros: _n(d.reservasLucros),
            lucrosAcumulados: _n(d.lucrosAcumulados) + _n(d.reservasLucros),
            prejuizosAcumulados: _n(d.prejuizosContabeis),
            tjlp: (_n(d.tjlp) || 7.97) / 100,
            lucroLiquidoAntes: llVal,
            numMeses: 12,
          });
          calcJCP.innerHTML =
            '<strong>💰 Simulação de JCP</strong><br>' +
            'JCP máximo (PL × TJLP): ' + _m(jcpRes.jcpMaximoTJLP) + '<br>' +
            'Limite 1 — 50% lucro líquido: ' + _m(jcpRes.limite50LL) + '<br>' +
            'Limite 2 — 50% lucros acum. + reservas: ' + _m(jcpRes.limite50Reservas) + '<br>' +
            '<strong>JCP dedutível: ' + _m(jcpRes.jcpDedutivel) + '</strong><br>' +
            'Economia IRPJ (25%): ' + _m(jcpRes.economiaIRPJ) + '<br>' +
            'Economia CSLL (9%): ' + _m(jcpRes.economiaCSLL) + '<br>' +
            '(-) Custo IRRF (17,5%): ' + _m(jcpRes.custoIRRF) + '<br>' +
            '<span style="color:#2ECC71"><strong>✅ ECONOMIA LÍQUIDA: ' + _m(jcpRes.economiaLiquida) + ' /ano</strong></span>';
        } catch (e) {
          calcJCP.innerHTML = '<em>Erro ao calcular JCP: ' + e.message + '</em>';
        }
      } else {
        calcJCP.innerHTML = '<em>Preencha o Patrimônio Líquido (> 0) e a Receita para simular JCP.</em>';
      }
    }

    // ── Prejuízos (etapa 3) ──
    var calcPrej = $("calcPrejuizos");
    if (calcPrej) {
      var pfIRPJ = _n(d.prejuizoFiscal);
      var bnCSLL = _n(d.baseNegativaCSLL);
      var lucroAj = _calcLucroAjustado();
      if (pfIRPJ > 0 || bnCSLL > 0) {
        var maxComp = Math.max(lucroAj, 0) * 0.30;
        var compIRPJ = Math.min(maxComp, pfIRPJ, Math.max(lucroAj, 0));
        var compCSLL = Math.min(maxComp, bnCSLL, Math.max(lucroAj, 0));
        var economiaIRPJ = _r(_irpj(lucroAj) - _irpj(lucroAj - compIRPJ));
        var economiaCSLL = compCSLL * 0.09;
        var periodosIRPJ = maxComp > 0 ? Math.ceil(pfIRPJ / maxComp) : "∞";
        calcPrej.innerHTML =
          '<strong>📉 Simulação de Compensação de Prejuízos</strong><br>' +
          'Lucro Ajustado (antes comp.): ' + _m(lucroAj) + '<br>' +
          'Trava 30%: ' + _m(maxComp) + '<br>' +
          'Prejuízo fiscal disponível: ' + _m(pfIRPJ) + '<br>' +
          'Compensação efetiva: ' + _m(compIRPJ) + ' | Saldo remanescente: ' + _m(pfIRPJ - compIRPJ) + '<br>' +
          'Economia IRPJ: ' + _m(economiaIRPJ) + ' | Economia CSLL: ' + _m(economiaCSLL) + '<br>' +
          'Períodos para esgotar saldo: ~' + periodosIRPJ + ' anos';
      } else {
        calcPrej.innerHTML = '<em>Nenhum prejuízo fiscal informado.</em>';
      }
    }

    // ── Retenções (etapa 4) ──
    var calcRet = $("calcRetencoes");
    if (calcRet) {
      var totalIRRF = _n(d.irrfRetidoPrivado) + _n(d.irrfRetidoPublico);
      var totalCSRF = _n(d.pisRetido) + _n(d.cofinsRetido) + _n(d.csllRetido);
      var totalISS = _n(d.issRetido);
      var totalRet = totalIRRF + totalCSRF + totalISS;
      calcRet.innerHTML =
        '<strong>Total de Retenções Compensáveis:</strong><br>' +
        'IRRF retido: ' + _m(totalIRRF) + '<br>' +
        'CSRF retido (PIS+COFINS+CSLL): ' + _m(totalCSRF) + '<br>' +
        'ISS retido: ' + _m(totalISS) + '<br>' +
        '<strong>TOTAL RETENÇÕES: ' + _m(totalRet) + '/ano</strong>';
    }

    // ── PIS/COFINS (etapa 4) ──
    var calcPC = $("calcPisCofins");
    if (calcPC && LR.calcular) {
      var rb3 = _n(d.receitaBrutaAnual);
      var recTrib = Math.max(rb3 - _n(d.receitasIsentas) - _n(d.receitaExportacao) - _n(d.receitasMonofasicas), 0);
      var baseCred = _calcBaseCreditos();
      var debPIS = _r(recTrib * 0.0165);
      var debCOF = _r(recTrib * 0.076);
      var credPIS = _r(baseCred * 0.0165);
      var credCOF = _r(baseCred * 0.076);
      var aPagarPIS = Math.max(debPIS - credPIS, 0);
      var aPagarCOF = Math.max(debCOF - credCOF, 0);
      var totalPC = _r(aPagarPIS + aPagarCOF);
      var aliqEfetiva = rb3 > 0 ? (totalPC / rb3 * 100).toFixed(2) : "0.00";
      var aproveitamento = (debPIS + debCOF) > 0 ? ((credPIS + credCOF) / (debPIS + debCOF) * 100).toFixed(1) : "0.0";

      calcPC.innerHTML =
        '<strong>📊 Simulação PIS/COFINS em Tempo Real</strong><br>' +
        'Receita tributável: ' + _m(recTrib) + '<br>' +
        'Débito PIS (1,65%): ' + _m(debPIS) + ' | Débito COFINS (7,6%): ' + _m(debCOF) + '<br>' +
        'Total débitos: ' + _m(debPIS + debCOF) + '<br><br>' +
        'Base de créditos: ' + _m(baseCred) + '<br>' +
        'Crédito PIS (1,65%): ' + _m(credPIS) + ' | Crédito COFINS (7,6%): ' + _m(credCOF) + '<br>' +
        'Total créditos: ' + _m(credPIS + credCOF) + '<br><br>' +
        '<strong>PIS/COFINS a pagar: ' + _m(totalPC) + '</strong><br>' +
        '<strong>ALÍQUOTA EFETIVA: ' + aliqEfetiva + '%</strong> (de 9,25% nominal)<br>' +
        'Aproveitamento de créditos: ' + aproveitamento + '%' +
        (parseFloat(aproveitamento) < 30 && baseCred > 0
          ? '<br><span style="color:#e67e22">⚠️ Aproveitamento baixo — revise se há insumos não classificados que geram crédito</span>'
          : "");
    }

    // ── Depreciação e Incentivos (etapa 5) ──
    var calcDep = $("calcDepreciacao");
    if (calcDep) {
      var turnos = parseInt(d.turnosOperacao) || 1;
      var mult = turnos === 3 ? 2.0 : turnos === 2 ? 1.5 : 1.0;
      var depNormal = _calcDepNormal();
      var depAcelerada = depNormal * mult;
      var depIncentivada = 0;
      var uf = d.uf || "";
      var isSUD = (LR && LR.helpers && (LR.helpers.ehSUDAM(uf) || LR.helpers.ehSUDENE(uf))) ||
                  (LR && LR.sudam && LR.sudam.estados.indexOf(uf) >= 0) ||
                  (LR && LR.sudene && LR.sudene.estados.indexOf(uf) >= 0);
      if (isSUD && _n(d.valorBensNovos) > 0) {
        depIncentivada = _n(d.valorBensNovos);
      }
      var depTotal = depAcelerada + depIncentivada + _n(d.bensSmallValue);

      calcDep.innerHTML =
        '<strong>🏗️ Prévia de Depreciação e Incentivos</strong><br>' +
        'Depreciação Normal: ' + _m(depNormal) + '/ano<br>' +
        (mult > 1 ? 'Depreciação Acelerada (×' + mult + '): ' + _m(depAcelerada) + '/ano<br>' : '') +
        (depIncentivada > 0 ? 'Depreciação Incentivada SUDAM/SUDENE (100%): ' + _m(depIncentivada) + '<br>' : '') +
        (_n(d.bensSmallValue) > 0 ? 'Bens de pequeno valor (despesa direta): ' + _m(_n(d.bensSmallValue)) + '<br>' : '') +
        '<strong>Economia fiscal depreciação: ' + _m(depTotal * 0.34) + ' (×34%)</strong>';
    }

    // ── ISS SUP (etapa 0) ──
    var calcISSSUP = $("calcISSSUP");
    if (calcISSSUP) {
      var ehSUP = d.ehSUP === true || d.ehSUP === "true";
      if (ehSUP) {
        var issFixo = _n(d.issFixoPorProfissional) || 800;
        var numProf = parseInt(d.numProfissionaisSUP) || 2;
        var issFixoTotal = _r(issFixo * numProf);
        var recServISS = _n(d.receitaBrutaAnual) || 0;
        var issPercentual = _r(recServISS * (_n(d.issAliquota) || 5) / 100);
        var econISSSUP = _r(issPercentual - issFixoTotal);
        calcISSSUP.innerHTML =
          '<strong>Comparativo ISS</strong><br>' +
          'ISS por alíquota (' + (_n(d.issAliquota) || 5) + '%): ' + _m(issPercentual) + '/ano<br>' +
          'ISS fixo SUP (' + numProf + ' × ' + _m(issFixo) + '): ' + _m(issFixoTotal) + '/ano<br>' +
          (econISSSUP > 0
            ? '<span style="color:#2ECC71"><strong>Economia com SUP: ' + _m(econISSSUP) + '/ano</strong></span>'
            : '<span style="color:#e67e22">SUP mais caro em ' + _m(Math.abs(econISSSUP)) + ' — não compensa</span>');
      } else {
        calcISSSUP.innerHTML = "";
      }
    }

    // ── CPRB (etapa 4) ──
    var calcCPRB = $("calcCPRB");
    if (calcCPRB) {
      var optouCPRB = d.optouCPRB === true || d.optouCPRB === "true";
      if (optouCPRB) {
        var aliqCPRB = (_n(d.aliquotaCPRB) || 4.5) / 100;
        var baseCPRB = _n(d.receitaBrutaCPRB) || _n(d.receitaBrutaAnual);
        var custoCPRB = _r(baseCPRB * aliqCPRB);
        var folhaBruta = _n(d.folhaPagamentoAnual) || (_n(d.salariosBrutos) + _n(d.proLabore));
        var cppNormal = _r(folhaBruta * 0.20);
        var economiaCPRB = _r(cppNormal - custoCPRB);
        calcCPRB.innerHTML =
          '<strong>Simulação CPRB</strong><br>' +
          'CPP normal (20% sobre folha): ' + _m(cppNormal) + '<br>' +
          'CPRB (' + (_n(d.aliquotaCPRB) || 4.5) + '% sobre receita): ' + _m(custoCPRB) + '<br>' +
          (economiaCPRB > 0
            ? '<span style="color:#2ECC71"><strong>Economia com CPRB: ' + _m(economiaCPRB) + '/ano</strong></span>'
            : '<span style="color:#e67e22">CPRB mais cara que CPP normal em ' + _m(Math.abs(economiaCPRB)) + ' — não compensa</span>');
      } else {
        calcCPRB.innerHTML = "";
      }
    }

    // ── Impacto badges dinâmicos ──
    var impMultas = $("impactoMultas");
    if (impMultas) impMultas.textContent = _m(_n(d.multasPunitivas) * 0.34);
    var econGrat = $("econGratif");
    if (econGrat) econGrat.textContent = _m(_n(d.gratificacoesAdm) * 0.34);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  HELPERS DE CÁLCULO INTERMEDIÁRIOS
  // ═══════════════════════════════════════════════════════════════════════════

  function _calcTotalCustos() {
    var d = dadosEmpresa;
    var folha = _n(d.folhaPagamentoAnual) ||
      (_n(d.salariosBrutos) + _n(d.inssPatronal) + _n(d.fgts) + _n(d.decimoTerceiro) + _n(d.feriasProvisao) + _n(d.proLabore));
    return folha + _n(d.cmv) + _n(d.servicosTerceiros) + _n(d.freteComprasVendas) + _n(d.outrosCustosOp);
  }

  function _calcTotalDespesas() {
    var d = dadosEmpresa;
    return _n(d.aluguelAnual) + _n(d.energiaAnual) + _n(d.telecomAnual) +
      _n(d.manutencaoConservacao) + _n(d.segurosAnual) + _n(d.despesasVeiculos) +
      _n(d.honorariosContabeis) + _n(d.marketingPublicidade) + _n(d.despesasViagem) +
      _n(d.materialEscritorio) + _n(d.outrasDespesasOp);
  }

  function _calcTotalAdicoes() {
    var d = dadosEmpresa;
    return _n(d.multasPunitivas) + _n(d.brindes) + _n(d.alimentacaoSocios) +
      _n(d.gratificacoesAdm) + _n(d.doacoesIrregulares) + _n(d.despesasSemNF) +
      _n(d.provisoesIndedutiveis) + _n(d.mepNegativo) + _n(d.depContabilMaiorFiscal) +
      _n(d.outrasAdicoes);
  }

  function _calcTotalExclusoes() {
    var d = dadosEmpresa;
    return _n(d.dividendosRecebidos) + _n(d.mepPositivo) + _n(d.reversaoProvisoes) +
      _n(d.subvencaoInvestimento) + _n(d.depAceleradaIncentivadaExclusao) + _n(d.outrasExclusoes) +
      _n(d.perdasCreditos6Meses) + _n(d.perdasCreditosJudicial) + _n(d.perdasCreditosFalencia);
  }

  function _calcLL() {
    var d = dadosEmpresa;
    var rb = _n(d.receitaBrutaAnual);
    var isentas = _n(d.receitasIsentas) + _n(d.receitaExportacao) + _n(d.receitasMonofasicas);
    var recTrib = Math.max(rb - isentas, 0);
    var pisCofDeb = _r(recTrib * 0.0925);
    var dep = _calcDepNormal();
    var recFin = _n(d.receitaFinanceiras) + _n(d.receitasFinanceirasEspeciais);
    return _r(rb - pisCofDeb - _calcTotalCustos() - _calcTotalDespesas() - dep + recFin);
  }

  function _calcLucroAjustado() {
    return _calcLL() + _calcTotalAdicoes() - _calcTotalExclusoes();
  }

  function _calcPL() {
    var d = dadosEmpresa;
    if (_n(d.patrimonioLiquido) > 0) return _n(d.patrimonioLiquido);
    return _n(d.capitalSocial) + _n(d.reservasCapital) + _n(d.reservasLucros) +
      _n(d.lucrosAcumulados) + _n(d.ajustesAvaliacaoPatrimonial) - _n(d.prejuizosContabeis);
  }

  function _calcDepNormal() {
    var d = dadosEmpresa;
    return _n(d.valorVeiculos) * 0.20 + _n(d.valorMaquinas) * 0.10 +
      _n(d.valorComputadores) * 0.20 + _n(d.valorMoveis) * 0.10 +
      _n(d.valorEdificios) * 0.04 + _n(d.valorDrones) * 0.20 +
      _n(d.valorTratores) * 0.25 + _n(d.valorSoftware) * 0.20 +
      _n(d.valorInstalacoes) * 0.10 + _n(d.valorOutrosBens) * 0.10;
  }

  function _calcBaseCreditos() {
    var d = dadosEmpresa;
    return _n(d.comprasMercadoriasAnual) + _n(d.energiaCredito) + _n(d.alugueisPJCredito) +
      _n(d.leasingCredito) + _n(d.depreciacaoBensCredito) + _n(d.depreciacaoEdifCredito) +
      _n(d.freteVendasAnual) + _n(d.armazenagemCredito) + _n(d.valeTranspAlim) +
      _n(d.manutencaoMaquinas) + _n(d.devolucoesVendas) + _n(d.outrosCreditosPC) +
      _n(d.creditoEstoqueAbertura);
  }

  function _nomeAtividade(tipo) {
    if (!tipo) return "—";
    if (LR && LR.presuncoes && LR.presuncoes[tipo]) return LR.presuncoes[tipo].label;
    return tipo;
  }

  function _nomeApuracao(ap) {
    if (ap === "trimestral") return "Trimestral (definitiva)";
    if (ap === "anual_estimativa") return "Anual por Estimativa";
    if (ap === "anual_suspensao") return "Anual com Suspensão/Redução";
    return "—";
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  HELPERS DE UI
  // ═══════════════════════════════════════════════════════════════════════════

  function _atualizarBadgeUF(uf) {
    var badge = $("ufBadge");
    if (!badge) return;
    var isSUDAM = false;
    var isSUDENE = false;
    if (LR) {
      if (LR.helpers && LR.helpers.ehSUDAM) isSUDAM = LR.helpers.ehSUDAM(uf);
      else if (LR.sudam) isSUDAM = LR.sudam.estados.indexOf(uf) >= 0;
      if (LR.helpers && LR.helpers.ehSUDENE) isSUDENE = LR.helpers.ehSUDENE(uf);
      else if (LR.sudene) isSUDENE = LR.sudene.estados.indexOf(uf) >= 0;
    }
    if (isSUDAM) {
      badge.innerHTML = '<div class="wz-badge wz-badge-green">✅ Área SUDAM — Amazônia Legal — elegível a incentivos regionais</div>';
    } else if (isSUDENE) {
      badge.innerHTML = '<div class="wz-badge wz-badge-green">✅ Área SUDENE — elegível a incentivos regionais</div>';
    } else {
      badge.innerHTML = "";
    }

    // Alerta obrigatoriedade por atividade
    _verificarAlertaObrigatoriedade();
  }

  function _verificarAlertaObrigatoriedade() {
    var alerta = $("alertaObrigatoriedade");
    if (!alerta) return;
    var d = dadosEmpresa;
    var msgs = [];
    if (d.tipoAtividade === "FACTORING" || d.tipoAtividade === "INSTITUICOES_FINANCEIRAS") {
      msgs.push('⚠️ Lucro Real é OBRIGATÓRIO para esta atividade (Art. 257)');
    }
    if (d.ehFinanceira === true || d.ehFinanceira === "true") {
      msgs.push('⚠️ Instituições financeiras são OBRIGADAS ao Lucro Real');
    }
    alerta.innerHTML = msgs.map(function (m) {
      return '<div class="wz-badge wz-badge-red">' + m + '</div>';
    }).join("");
  }

  function mostrarErro(msg) {
    var container = $("wizardContainer");
    if (container) {
      container.innerHTML =
        '<div class="wz-error"><h2>Erro de Inicialização</h2><p>' + msg + '</p></div>';
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  NAVEGAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════

  function nextStep() {
    if (currentStep < ETAPAS.length - 1) {
      currentStep++;
      saveToLS();
      renderWizard();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function prevStep() {
    if (currentStep > 0) {
      currentStep--;
      saveToLS();
      renderWizard();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function goToStep(n) {
    if (n >= 0 && n < ETAPAS.length) {
      currentStep = n;
      saveToLS();
      renderWizard();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function voltarWizard() {
    renderWizard();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  MOTOR DE ANÁLISE — analisar() — PLACEHOLDER PARTE 2
  // ═══════════════════════════════════════════════════════════════════════════

  function analisar() {
    var d = dadosEmpresa;

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 0A — Garantir que LR existe (fallback mínimo se mapeamento não carregou)
    // ═══════════════════════════════════════════════════════════════════════
    if (!LR) {
      LR = window.LR || window.LucroRealMap || {};
    }
    if (!LR.calcular) LR.calcular = {};
    if (!LR.validar) LR.validar = {};
    if (!LR.helpers) LR.helpers = {};
    if (!LR.simular) LR.simular = {};

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 0 — Validar campos obrigatórios
    // ═══════════════════════════════════════════════════════════════════════
    var erros = _validarObrigatorios();
    if (erros.length > 0) {
      alert("Campos obrigatórios faltando:\n\n• " + erros.join("\n• "));
      return;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 1 — Validação cruzada (alertas amarelos, não bloqueiam)
    // ═══════════════════════════════════════════════════════════════════════
    var alertas = _validacaoCruzada();

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 1.5 — Normalização dos dados de entrada (MELHORIA #7 + BUG #5)
    // ═══════════════════════════════════════════════════════════════════════
    // Unificar campos duplicados e normalizar tipos
    d.brindes = _n(d.brindes) + _n(d.despesasBrindes);  // CORRIGIDO: soma ambos campos (antes usava || que ignorava um)
    d.ehFinanceira = d.ehFinanceira === true || d.ehFinanceira === "true";
    d.temProjetoAprovado = d.temProjetoAprovado === true || d.temProjetoAprovado === "true";
    d.apuracaoLR = (d.apuracaoLR || "anual").toLowerCase();

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 2 — Montar DRE (Receita → Lucro Líquido Contábil)
    // ═══════════════════════════════════════════════════════════════════════
    var receitaBruta = _n(d.receitaBrutaAnual);
    var custosTotais = _calcTotalCustos();
    var despesasTotais = _calcTotalDespesas();
    var depAnual = _calcDepNormal();
    var turnos = parseInt(d.turnosOperacao) || 1;
    var multTurnos = turnos === 3 ? 2.0 : turnos === 2 ? 1.5 : 1.0;
    var depAcelerada = _r(depAnual * multTurnos);
    var depNormalDRE = depAnual;
    var diferencaAcelerada = _r(depAcelerada - depAnual);
    var receitaFinanceiras = _n(d.receitaFinanceiras) + _n(d.receitasFinanceirasEspeciais);
    var receitaServicos = _n(d.receitaServicos) || (d.tipoAtividade && d.tipoAtividade.indexOf("SERVICO") >= 0 ? receitaBruta : 0);
    var receitaComercio = _n(d.receitaComercio) || (d.tipoAtividade === "COMERCIO_INDUSTRIA" ? receitaBruta : 0);
    // Se não detalharam, usar a receita toda como do tipo de atividade
    if (!d.detalharReceita && !_n(d.receitaServicos) && !_n(d.receitaComercio)) {
      if (d.tipoAtividade && d.tipoAtividade.indexOf("COMERCIO") >= 0) {
        receitaComercio = receitaBruta;
      } else {
        receitaServicos = receitaBruta;
      }
    }
    // Pré-cálculo PIS/COFINS débitos para DRE (antes do passo 8)
    // Na DRE, deduz-se da Receita Bruta os débitos totais de PIS/COFINS (9,25% da receita tributável)
    var receitasIsentasPreDRE = _n(d.receitasIsentas) + _n(d.receitaExportacao) + _n(d.receitasMonofasicas);
    var receitaTributavelDRE = _r(Math.max(receitaBruta - receitasIsentasPreDRE, 0));
    var pisCofinsDebitosDRE = _r(receitaTributavelDRE * 0.0925); // PIS 1,65% + COFINS 7,60%

    var receitaLiquida = _r(receitaBruta - pisCofinsDebitosDRE);
    var lucroBruto = _r(receitaLiquida - custosTotais);
    var lucroLiquido = _r(lucroBruto - despesasTotais - depNormalDRE + receitaFinanceiras);
    var margemLucro = receitaBruta > 0 ? _r(lucroLiquido / receitaBruta * 100) : 0;
    // CORREÇÃO FALHA #6: Margem precisa (sem arredondamento) para uso em cenários
    var margemLucroPrecisa = receitaBruta > 0 ? (lucroLiquido / receitaBruta) : 0;

    var dre = {
      receitaBruta: receitaBruta,
      receitaServicos: receitaServicos,
      receitaComercio: receitaComercio,
      receitaFinanceiras: receitaFinanceiras,
      receitaAlugueis: _n(d.receitaAlugueis),
      outrasReceitas: _n(d.outrasReceitas),
      pisCofinsDebitos: pisCofinsDebitosDRE,
      receitaLiquida: receitaLiquida,
      custosTotais: custosTotais,
      folhaPagamento: _n(d.folhaPagamentoAnual) || (_n(d.salariosBrutos) + _n(d.proLabore) + _n(d.inssPatronal) + _n(d.fgts) + _n(d.decimoTerceiro) + _n(d.feriasProvisao)),
      cmv: _n(d.cmv),
      servicosTerceiros: _n(d.servicosTerceiros),
      despesasTotais: despesasTotais,
      depreciacao: depNormalDRE,
      lucroBruto: lucroBruto,
      lucroLiquido: lucroLiquido,
      margemLucro: margemLucro,
      margemLucroPrecisa: margemLucroPrecisa
    };

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 3 — Montar LALUR (LL + Adições - Exclusões = Lucro Ajustado)
    // ═══════════════════════════════════════════════════════════════════════
    var totalAdicoes = _calcTotalAdicoes();
    var totalExclusoes = _calcTotalExclusoes();
    var lucroAjustado = _r(lucroLiquido + totalAdicoes - totalExclusoes);

    // Detalhe de adições com artigo
    var adicoesDetalhe = [];
    if (_n(d.multasPunitivas) > 0) adicoesDetalhe.push({ desc: "Multas punitivas", valor: _n(d.multasPunitivas), artigo: "Art. 311, §5º", tipo: "D" });
    if (_n(d.brindes) > 0) adicoesDetalhe.push({ desc: "Brindes", valor: _n(d.brindes), artigo: "Art. 13, Lei 9.249", tipo: "D" });
    if (_n(d.alimentacaoSocios) > 0) adicoesDetalhe.push({ desc: "Alimentação de sócios/adm.", valor: _n(d.alimentacaoSocios), artigo: "Art. 260, §ú, IV", tipo: "D" });
    if (_n(d.gratificacoesAdm) > 0) adicoesDetalhe.push({ desc: "Gratificações a administradores", valor: _n(d.gratificacoesAdm), artigo: "Art. 358, §1º", tipo: "D" });
    if (_n(d.doacoesIrregulares) > 0) adicoesDetalhe.push({ desc: "Doações fora dos limites legais", valor: _n(d.doacoesIrregulares), artigo: "Art. 377-385", tipo: "D" });
    if (_n(d.despesasSemNF) > 0) adicoesDetalhe.push({ desc: "Despesas sem comprovante/NF", valor: _n(d.despesasSemNF), artigo: "Art. 311", tipo: "D" });
    if (_n(d.provisoesIndedutiveis) > 0) adicoesDetalhe.push({ desc: "Provisões não dedutíveis", valor: _n(d.provisoesIndedutiveis), artigo: "Art. 340-352", tipo: "T" });
    if (_n(d.mepNegativo) > 0) adicoesDetalhe.push({ desc: "Resultado negativo MEP", valor: _n(d.mepNegativo), artigo: "Art. 389", tipo: "T" });
    if (_n(d.depContabilMaiorFiscal) > 0) adicoesDetalhe.push({ desc: "Depreciação contábil > fiscal", valor: _n(d.depContabilMaiorFiscal), artigo: "Art. 283-285", tipo: "T" });
    if (_n(d.outrasAdicoes) > 0) adicoesDetalhe.push({ desc: d.descOutrasAdicoes || "Outras adições", valor: _n(d.outrasAdicoes), artigo: "—", tipo: "D" });

    var exclusoesDetalhe = [];
    if (_n(d.dividendosRecebidos) > 0) exclusoesDetalhe.push({ desc: "Dividendos recebidos de PJ brasileira", valor: _n(d.dividendosRecebidos), artigo: "Art. 261, II + Lei 9.249, art. 10" });
    if (_n(d.mepPositivo) > 0) exclusoesDetalhe.push({ desc: "Resultado positivo MEP", valor: _n(d.mepPositivo), artigo: "Art. 389" });
    if (_n(d.reversaoProvisoes) > 0) exclusoesDetalhe.push({ desc: "Reversão de provisões antes adicionadas", valor: _n(d.reversaoProvisoes), artigo: "Art. 261, §ú, V" });
    if (_n(d.subvencaoInvestimento) > 0) exclusoesDetalhe.push({ desc: "Subvenção para investimento (⚠ verificar REIS — Lei 14.789/2023)", valor: _n(d.subvencaoInvestimento), artigo: "Lei 14.789/2023 (revogou art. 30, Lei 12.973)" });
    if (_n(d.depAceleradaIncentivadaExclusao) > 0) exclusoesDetalhe.push({ desc: "Depreciação acelerada incentivada", valor: _n(d.depAceleradaIncentivadaExclusao), artigo: "Art. 324-329" });
    if (_n(d.outrasExclusoes) > 0) exclusoesDetalhe.push({ desc: "Outras exclusões", valor: _n(d.outrasExclusoes), artigo: "—" });

    // PDD Fiscal
    var totalPDDAnalise = _n(d.perdasCreditos6Meses) + _n(d.perdasCreditosJudicial) + _n(d.perdasCreditosFalencia);
    if (_n(d.perdasCreditos6Meses) > 0) exclusoesDetalhe.push({ desc: "PDD — Créditos vencidos > 6 meses", valor: _n(d.perdasCreditos6Meses), artigo: "Art. 340, RIR/2018" });
    if (_n(d.perdasCreditosJudicial) > 0) exclusoesDetalhe.push({ desc: "PDD — Créditos em cobrança judicial", valor: _n(d.perdasCreditosJudicial), artigo: "Art. 340, §1º" });
    if (_n(d.perdasCreditosFalencia) > 0) exclusoesDetalhe.push({ desc: "PDD — Créditos c/ devedor em falência/recuperação", valor: _n(d.perdasCreditosFalencia), artigo: "Art. 341" });

    var lalur = {
      lucroLiquido: lucroLiquido,
      adicoes: adicoesDetalhe,
      totalAdicoes: totalAdicoes,
      exclusoes: exclusoesDetalhe,
      totalExclusoes: totalExclusoes,
      lucroAjustado: lucroAjustado
    };

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 3A — Validação de Despesas com Limites Legais
    // ═══════════════════════════════════════════════════════════════════════
    var lucroOperacional = lucroLiquido;
    var receitaLiquidaValidacao = receitaBruta;
    var plVal = _calcPL();
    var validacaoDespesasLimites = { doacoes: null, previdencia: null, royalties: null };
    if (LR.calcular.avancado && LR.calcular.avancado.calcularLimiteDoacoes) {
      try {
        validacaoDespesasLimites.doacoes = LR.calcular.avancado.calcularLimiteDoacoes({
          lucroOperacional: lucroOperacional,
          doacoesOperacionais: _n(d.doacoesOperacionais),
          doacoesOSCIP: _n(d.doacoesOSCIP),
          doacoesEntidadesEnsino: _n(d.doacoesEntidadesEnsino)
        });
      } catch(e) {}
    }
    if (LR.calcular.avancado && LR.calcular.avancado.calcularLimitePrevidenciaComplementar) {
      try {
        validacaoDespesasLimites.previdencia = LR.calcular.avancado.calcularLimitePrevidenciaComplementar({
          folhaSalarial: dre.folhaPagamento,
          contribuicaoPatronal: _n(d.previdenciaComplementarPatronal)
        });
      } catch(e) {}
    }
    if (LR.calcular.avancado && LR.calcular.avancado.calcularLimiteRoyaltiesAssistencia) {
      try {
        validacaoDespesasLimites.royalties = LR.calcular.avancado.calcularLimiteRoyaltiesAssistencia({
          receitaLiquida: receitaLiquida,
          royaltiesPagos: _n(d.royaltiesPagos)
        });
      } catch(e) {}
    }

    // Se algum limite foi excedido, somar o EXCESSO como ADIÇÃO ao LALUR
    var excessoDespesasLimites = 0;
    if (validacaoDespesasLimites.doacoes && validacaoDespesasLimites.doacoes.excesso > 0) {
      excessoDespesasLimites += validacaoDespesasLimites.doacoes.excesso;
      adicoesDetalhe.push({ desc: "Excesso de doações acima do limite legal", valor: validacaoDespesasLimites.doacoes.excesso, artigo: "Art. 377-385", tipo: "D" });
    }
    if (validacaoDespesasLimites.previdencia && validacaoDespesasLimites.previdencia.excesso > 0) {
      excessoDespesasLimites += validacaoDespesasLimites.previdencia.excesso;
      adicoesDetalhe.push({ desc: "Excesso de previdência complementar acima do limite", valor: validacaoDespesasLimites.previdencia.excesso, artigo: "Art. 369, §1º", tipo: "D" });
    }
    if (validacaoDespesasLimites.royalties && validacaoDespesasLimites.royalties.excesso > 0) {
      excessoDespesasLimites += validacaoDespesasLimites.royalties.excesso;
      adicoesDetalhe.push({ desc: "Excesso de royalties acima do limite legal", valor: validacaoDespesasLimites.royalties.excesso, artigo: "Art. 365", tipo: "D" });
    }
    if (excessoDespesasLimites > 0) {
      totalAdicoes = _r(totalAdicoes + excessoDespesasLimites);
      lucroAjustado = _r(lucroLiquido + totalAdicoes - totalExclusoes);
      lalur.totalAdicoes = totalAdicoes;
      lalur.lucroAjustado = lucroAjustado;
    }

    // Depreciação acelerada por turnos: diferença é exclusão fiscal no LALUR
    if (diferencaAcelerada > 0) {
      exclusoesDetalhe.push({ desc: "Depreciação acelerada por turnos (exclusão LALUR)", valor: diferencaAcelerada, artigo: "Art. 323", tipo: "T" });
      totalExclusoes = _r(totalExclusoes + diferencaAcelerada);
      lucroAjustado = _r(lucroLiquido + totalAdicoes - totalExclusoes);
      lalur.totalExclusoes = totalExclusoes;
      lalur.lucroAjustado = lucroAjustado;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 3B — Despesas Indedutíveis Automáticas
    // ═══════════════════════════════════════════════════════════════════════
    var despesasIndedutivelDetalhe = [];
    var totalIndedutivelAuto = 0;
    // CORREÇÃO FALHA #5: Unificar campos d.despesasBrindes e d.brindes (LALUR usa d.brindes, UI usa d.despesasBrindes)
    var valorBrindes = _n(d.despesasBrindes) || _n(d.brindes);
    if (valorBrindes > 0) {
      despesasIndedutivelDetalhe.push({ desc: "Brindes", valor: valorBrindes, artigo: "Art. 13, VII Lei 9.249" });
      // Não somar a totalIndedutivelAuto — já contabilizado em _calcTotalAdicoes() via d.brindes
    }
    if (_n(d.multasPunitivas) > 0) {
      despesasIndedutivelDetalhe.push({ desc: "Multas punitivas", valor: _n(d.multasPunitivas), artigo: "Art. 311, §5º" });
      // Não somar — já incluído em _calcTotalAdicoes()
    }
    // ═══ CORREÇÃO BUG CRÍTICO 4: Deduplicar provisões contingências/garantias ═══
    var _provIndedTotal = _n(d.provisoesIndedutiveis);
    var _provCont = _n(d.provisoesContingencias);
    var _provGar = _n(d.provisoesGarantias);
    if (_provIndedTotal > 0 && (_provCont + _provGar) > 0) {
      if (_provCont + _provGar <= _provIndedTotal) {
        _provCont = 0;
        _provGar = 0;
        console.info('[IMPOST] Provisões contingências/garantias já em provisoesIndedutiveis — deduplicando');
      }
    }
    if (_provCont > 0) {
      despesasIndedutivelDetalhe.push({ desc: "Provisões para contingências", valor: _provCont, artigo: "Art. 340" });
      adicoesDetalhe.push({ desc: "Provisões para contingências (indedutível)", valor: _provCont, artigo: "Art. 340, RIR/2018", tipo: "T" });
      totalIndedutivelAuto += _provCont;
    }
    if (_provGar > 0) {
      despesasIndedutivelDetalhe.push({ desc: "Provisões para garantia de produtos", valor: _provGar, artigo: "Art. 340" });
      adicoesDetalhe.push({ desc: "Provisões para garantia de produtos (indedutível)", valor: _provGar, artigo: "Art. 340, RIR/2018", tipo: "T" });
      totalIndedutivelAuto += _provGar;
    }
    if (_n(d.gratificacoesAdm) > 0) {
      despesasIndedutivelDetalhe.push({ desc: "Gratificações a administradores", valor: _n(d.gratificacoesAdm), artigo: "Art. 358, §1º" });
      // Já contabilizado nas adições existentes, não somar novamente
    }
    if (totalIndedutivelAuto > 0) {
      totalAdicoes = _r(totalAdicoes + totalIndedutivelAuto);
      lucroAjustado = _r(lucroLiquido + totalAdicoes - totalExclusoes);
      lalur.totalAdicoes = totalAdicoes;
      lalur.lucroAjustado = lucroAjustado;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 4 — Compensação de prejuízos → LR.calcular.compensarIntegrado()
    // ═══════════════════════════════════════════════════════════════════════
    var prejuizoFiscal = _n(d.prejuizoFiscal);
    var baseNegCSLL = _n(d.baseNegativaCSLL);
    var compensacao = null;
    var vedacoes = null;

    // Verificar vedações
    if (LR.validar && LR.validar.vedacoesCompensacao) {
      try {
        vedacoes = LR.validar.vedacoesCompensacao({
          houveMudancaControle: d.temMudancaControle === true || d.temMudancaControle === "true",
          houveMudancaRamo: d.temMudancaRamo === true || d.temMudancaRamo === "true",
          tipoReorganizacao: d.tipoReorganizacao || "",
          percentPLRemanescente: _n(d.percentPLRemanescente)
        });
      } catch (e) { vedacoes = null; }
    }

    var vedaCompensacao = vedacoes && vedacoes.compensacaoPermitida === false;

    if (LR.calcular.compensarIntegrado && (prejuizoFiscal > 0 || baseNegCSLL > 0) && lucroAjustado > 0 && !vedaCompensacao) {
      try {
        compensacao = LR.calcular.compensarIntegrado({
          lucroLiquido: lucroLiquido,
          adicoes: totalAdicoes,
          exclusoes: totalExclusoes,
          saldoPrejuizoOperacional: prejuizoFiscal,
          saldoPrejuizoNaoOperacional: _n(d.prejuizoNaoOperacional),
          saldoBaseNegativaCSLL: baseNegCSLL,
          lucroNaoOperacional: _n(d.lucroNaoOperacional),
          atividadeRural: d.atividadeRural === true || d.atividadeRural === "true",
          trimestral: d.apuracaoLR === "trimestral"
        });
      } catch (e) {
        compensacao = null;
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 5 — Lucro Real final (Lucro Ajustado - Compensação)
    // ═══════════════════════════════════════════════════════════════════════
    var lucroRealFinal = compensacao
      ? (compensacao.resumo ? compensacao.resumo.lucroRealFinal : Math.max(lucroAjustado, 0))
      : Math.max(lucroAjustado, 0);
    var baseCSLLFinal = compensacao
      ? (compensacao.resumo ? compensacao.resumo.baseCSLLFinal : lucroRealFinal)
      : lucroRealFinal;

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 6 — IRPJ → LR.calcular.irpj()
    // ═══════════════════════════════════════════════════════════════════════
    var ehFinanceira = d.ehFinanceira === true || d.ehFinanceira === "true" || d.tipoAtividade === "INSTITUICOES_FINANCEIRAS";
    var totalIRRF = _n(d.irrfRetidoPrivado) + _n(d.irrfRetidoPublico);
    var estimIRPJPagas = _n(d.estimativasIRPJPagas);
    var estimCSLLPagas = _n(d.estimativasCSLLPagas);
    var estimPISCOFINSPagas = _n(d.estimativasPISCOFINSPagas);

    // Calcular incentivos primeiro para ter valor de deduções
    var irpjNormalPrevia = _r(lucroRealFinal * 0.15);
    var despesasIncentivos = {};
    if (d.usaPAT === true || d.usaPAT === "true") despesasIncentivos.PAT = _n(d.valorPAT);
    if (d.usaFIA === true || d.usaFIA === "true") despesasIncentivos.FIA = _n(d.valorFIA);
    if (d.usaFundoIdoso === true || d.usaFundoIdoso === "true") despesasIncentivos.FUNDO_IDOSO = _n(d.valorFundoIdoso);
    if (d.usaRouanet === true || d.usaRouanet === "true") despesasIncentivos.ROUANET = _n(d.valorRouanet);
    if (d.usaEsporte === true || d.usaEsporte === "true") despesasIncentivos.ESPORTE = _n(d.valorEsporte);
    if (d.usaPRONON === true || d.usaPRONON === "true") despesasIncentivos.PRONON = _n(d.valorPRONON);
    if (d.usaPRONAS === true || d.usaPRONAS === "true") despesasIncentivos.PRONAS_PCD = _n(d.valorPRONAS);
    if (d.investePD === true || d.investePD === "true") despesasIncentivos.PD_LEI_BEM = _n(d.valorPD);

    var incentivosFiscais = null;
    if (LR.calcular.incentivos) {
      try {
        incentivosFiscais = LR.calcular.incentivos({
          irpjNormal: irpjNormalPrevia,
          despesas: despesasIncentivos
        });
      } catch (e) { incentivosFiscais = null; }
    }

    var totalDeducoesIncentivos = incentivosFiscais ? incentivosFiscais.totalDeducaoFinal : 0;

    // SUDAM/SUDENE — Redução do IRPJ
    var uf = d.uf || "";
    var isSUDAM = (LR.helpers && LR.helpers.ehSUDAM) ? LR.helpers.ehSUDAM(uf) : (LR.sudam && LR.sudam.estados.indexOf(uf) >= 0);
    var isSUDENE = (LR.helpers && LR.helpers.ehSUDENE) ? LR.helpers.ehSUDENE(uf) : (LR.sudene && LR.sudene.estados.indexOf(uf) >= 0);
    var temProjetoSUDAM = (isSUDAM || isSUDENE) && (d.temProjetoAprovado === true || d.temProjetoAprovado === "true");

    var sudamResult = null;
    var reducaoSUDAM = 0;
    if (temProjetoSUDAM && LR.simular && LR.simular.incentivosRegionais) {
      try {
        sudamResult = LR.simular.incentivosRegionais({
          lucroLiquido: lucroLiquido,
          receitasFinanceiras: receitaFinanceiras,
          receitaLiquidaTotal: receitaBruta,
          receitaLiquidaIncentivada: receitaBruta - receitaFinanceiras,
          adicoes: totalAdicoes,
          exclusoes: totalExclusoes,
          csllDevida: _r(baseCSLLFinal * (ehFinanceira ? 0.15 : 0.09)),
          percentualReducao: (_n(d.percentualReducao) || 75) / 100,
          usarReinvestimento: d.usarReinvestimento30 === true || d.usarReinvestimento30 === "true",
          superintendencia: isSUDAM ? "SUDAM" : "SUDENE",
          anual: d.apuracaoLR !== "trimestral"
        });
        reducaoSUDAM = _safe(sudamResult, 'resumo', 'economiaReducao75');
      } catch (e) { sudamResult = null; }
    }

    // ═══ CORREÇÃO ERRO CRÍTICO #1: Evitar compensação DUPLA de prejuízo fiscal ═══
    // Se compensarIntegrado já foi executado, passar lucroRealFinal (já compensado) como base
    // e zerar prejuizoFiscal para que o motor IRPJ NÃO recompense.
    // Se compensarIntegrado NÃO rodou, passar os valores originais para o motor compensar.
    var _irpjUsarBaseCompensada = (compensacao !== null);
    var irpjResult = null;
    try {
      if (LR && LR.calcular && LR.calcular.irpj) {
        irpjResult = LR.calcular.irpj({
          lucroLiquido: _irpjUsarBaseCompensada ? lucroRealFinal : lucroLiquido,
          adicoes: _irpjUsarBaseCompensada ? 0 : totalAdicoes,
          exclusoes: _irpjUsarBaseCompensada ? 0 : totalExclusoes,
          prejuizoFiscal: _irpjUsarBaseCompensada ? 0 : (vedaCompensacao ? 0 : prejuizoFiscal),
          numMeses: 12,
          incentivos: totalDeducoesIncentivos,
          retencoesFonte: totalIRRF,
          estimativasPagas: estimIRPJPagas,
          apuracao: d.apuracaoLR === "trimestral" ? "TRIMESTRAL" : "ANUAL"
        });
      }
    } catch (e) {
      console.warn('[IMPOST] Erro em LR.calcular.irpj:', e.message);
      irpjResult = null;
    }
    // Fallback manual se motor não disponível ou falhou
    if (!irpjResult) {
      var _baseIRPJ = Math.max(lucroRealFinal, 0);
      var _irpjN = _r(_baseIRPJ * 0.15);
      var _irpjA = _r(Math.max(_baseIRPJ - 240000, 0) * 0.10);
      var _irpjDev = _r(_irpjN + _irpjA - totalDeducoesIncentivos);
      irpjResult = {
        baseCalculo: _baseIRPJ,
        irpjNormal: _irpjN,
        irpjAdicional: _irpjA,
        incentivos: totalDeducoesIncentivos,
        irpjDevido: Math.max(_irpjDev, 0),
        irpjAPagar: _r(Math.max(_irpjDev, 0) - totalIRRF - estimIRPJPagas),
        aliquota: 0.15,
        aliquotaAdicional: 0.10,
        limiteAdicional: 240000
      };
    }
    // Garantir propriedades mínimas
    irpjResult.irpjDevido = irpjResult.irpjDevido || 0;
    irpjResult.irpjNormal = irpjResult.irpjNormal || 0;
    irpjResult.irpjAdicional = irpjResult.irpjAdicional || 0;

    // ═══ CORREÇÃO BUG CRÍTICO 2: irpjBruto = IRPJ antes de incentivos (cargaBruta verdadeiramente bruta) ═══
    var irpjBruto = _r((irpjResult.irpjNormal || 0) + (irpjResult.irpjAdicional || 0));
    // Aplicar redução SUDAM/SUDENE sobre o IRPJ
    var irpjAntesReducao = irpjResult.irpjDevido;
    var irpjAposReducao = _r(Math.max(irpjAntesReducao - reducaoSUDAM, 0));

    // ═══ CORREÇÃO BUG 1: Na apuração trimestral, usar simulação trimestral (adicional correto) ═══
    var simTrimestral = _simularTrimestral(d, lucroAjustado, prejuizoFiscal, baseNegCSLL, vedaCompensacao, ehFinanceira);
    if (d.apuracaoLR === "trimestral") {
      irpjResult.irpjAdicional = simTrimestral.totalIRPJAdicional;
      irpjResult.irpjNormal = simTrimestral.totalIRPJNormal;
      irpjResult.irpjDevido = _r(irpjResult.irpjNormal + irpjResult.irpjAdicional);
      irpjAntesReducao = irpjResult.irpjDevido;
      irpjAposReducao = _r(Math.max(irpjAntesReducao - reducaoSUDAM, 0));
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 6A — Subcapitalização
    // ═══════════════════════════════════════════════════════════════════════
    var subcapResult = null;
    if (LR.validar && LR.validar.subcapitalizacao && (_n(d.dividaVinculadaComParticipacao) > 0 || _n(d.dividaParaisoFiscal) > 0)) {
      try {
        subcapResult = LR.validar.subcapitalizacao({
          patrimonioLiquido: plVal,
          dividaVinculadaComParticipacao: _n(d.dividaVinculadaComParticipacao),
          participacaoVinculadaNoPL: _n(d.participacaoVinculadaNoPL),
          dividaParaisoFiscal: _n(d.dividaParaisoFiscal),
          jurosIndedutiveis: _n(d.jurosVinculadasExterior)
        });
      } catch(e) {}
    }
    // Se subcapitalização excedeu, somar IRPJ marginal dos juros indedutíveis
    if (subcapResult && subcapResult.excedeu === true && subcapResult.jurosIndedutiveis > 0) {
      var _baseSubcap = Math.max(lucroRealFinal, 0);
      var _irpjMarginal = _irpj(_baseSubcap + subcapResult.jurosIndedutiveis) - _irpj(_baseSubcap);
      irpjAposReducao = _r(irpjAposReducao + _irpjMarginal);
    }

    // ═══ CORREÇÃO BUG 3: Gravar irpjAPagar corrigido (pós-SUDAM/subcap) no objeto ═══
    irpjResult.irpjAPagar = _r(irpjAposReducao - totalIRRF - estimIRPJPagas);

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 7 — CSLL → LR.calcular.csll()
    // ═══════════════════════════════════════════════════════════════════════
    // ═══ CORREÇÃO ERRO CRÍTICO #2: Evitar compensação DUPLA de base negativa CSLL ═══
    // Se compensarIntegrado já rodou, passar baseCSLLFinal (já compensada) e zerar baseNegativa.
    var _csllUsarBaseCompensada = (compensacao !== null);
    var csllResult = null;
    try {
      if (LR && LR.calcular && LR.calcular.csll) {
        csllResult = LR.calcular.csll({
          lucroLiquido: _csllUsarBaseCompensada ? baseCSLLFinal : lucroLiquido,
          adicoes: _csllUsarBaseCompensada ? 0 : totalAdicoes,
          exclusoes: _csllUsarBaseCompensada ? 0 : totalExclusoes,
          baseNegativa: _csllUsarBaseCompensada ? 0 : (vedaCompensacao ? 0 : baseNegCSLL),
          financeira: ehFinanceira,
          tipoAtividade: d.tipoAtividade || ""
        });
      }
    } catch (e) {
      console.warn('[IMPOST] Erro em LR.calcular.csll:', e.message);
      csllResult = null;
    }
    // Fallback manual se motor não disponível ou falhou
    // ═══ CORREÇÃO ERRO CRÍTICO #3: Usar baseCSLLFinal (não lucroRealFinal) no fallback ═══
    if (!csllResult) {
      var _aliqCSLL = ehFinanceira ? 0.15 : 0.09;
      var _baseCSLL = Math.max(baseCSLLFinal, 0);
      var _compBN = 0;
      if (!_csllUsarBaseCompensada && _baseCSLL > 0 && baseNegCSLL > 0 && !vedaCompensacao) {
        _compBN = Math.min(_r(_baseCSLL * 0.30), baseNegCSLL);
      }
      var _baseCSLLFinal = Math.max(_baseCSLL - _compBN, 0);
      csllResult = {
        baseCalculo: _baseCSLLFinal,
        aliquota: _aliqCSLL,
        compensacao: _compBN,
        csllDevida: _r(_baseCSLLFinal * _aliqCSLL),
        csllAPagar: _r(_baseCSLLFinal * _aliqCSLL - _n(d.csllRetido) - estimCSLLPagas)
      };
    }
    // Garantir propriedades mínimas
    csllResult.csllDevida = csllResult.csllDevida || 0;
    csllResult.aliquota = csllResult.aliquota || (ehFinanceira ? 0.15 : 0.09);
    // ═══ CORREÇÃO BUG CRÍTICO 3: Garantir csllAPagar descontando estimativas ═══
    if (csllResult.csllAPagar === undefined || csllResult.csllAPagar === null) {
      csllResult.csllAPagar = _r(Math.max(
        csllResult.csllDevida - _n(d.csllRetido) - estimCSLLPagas, 0
      ));
    }

    // ═══ CORREÇÃO ERRO CRÍTICO #4: Recalcular SUDAM com csllDevida correta do motor CSLL ═══
    // O SUDAM foi calculado no PASSO 6 com csllDevida manual. Agora que temos csllResult,
    // recalcular se o valor divergiu.
    if (temProjetoSUDAM && LR.simular && LR.simular.incentivosRegionais && csllResult) {
      var _csllManual = _r(baseCSLLFinal * (ehFinanceira ? 0.15 : 0.09));
      if (Math.abs(csllResult.csllDevida - _csllManual) > 0.01) {
        try {
          sudamResult = LR.simular.incentivosRegionais({
            lucroLiquido: lucroLiquido,
            receitasFinanceiras: receitaFinanceiras,
            receitaLiquidaTotal: receitaBruta,
            receitaLiquidaIncentivada: receitaBruta - receitaFinanceiras,
            adicoes: totalAdicoes,
            exclusoes: totalExclusoes,
            csllDevida: csllResult.csllDevida,
            percentualReducao: (_n(d.percentualReducao) || 75) / 100,
            usarReinvestimento: d.usarReinvestimento30 === true || d.usarReinvestimento30 === "true",
            superintendencia: isSUDAM ? "SUDAM" : "SUDENE",
            anual: d.apuracaoLR !== "trimestral"
          });
          reducaoSUDAM = _safe(sudamResult, 'resumo', 'economiaReducao75');
          // Recalcular IRPJ após SUDAM corrigido
          irpjAntesReducao = irpjResult.irpjDevido;
          irpjAposReducao = _r(Math.max(irpjAntesReducao - reducaoSUDAM, 0));
          irpjResult.irpjAPagar = _r(irpjAposReducao - totalIRRF - estimIRPJPagas);
        } catch (e) { /* mantém sudamResult anterior */ }
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 7A — Verificação de Omissão de Receita
    // ═══════════════════════════════════════════════════════════════════════
    var omissaoResult = null;
    if (LR.validar && LR.validar.omissaoReceita) {
      try {
        omissaoResult = LR.validar.omissaoReceita({
          receitaBruta: receitaBruta,
          custos: custosTotais,
          despesas: despesasTotais,
          lucroLiquido: lucroLiquido,
          saldoCaixa: _n(d.saldoCaixa),
          depositosBancarios: _n(d.depositosBancarios)
        });
      } catch(e) {}
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 8 — PIS/COFINS → LR.calcular.pisCofins()
    // ═══════════════════════════════════════════════════════════════════════
    var receitasIsentas = _n(d.receitasIsentas) + _n(d.receitaExportacao) + _n(d.receitasMonofasicas);
    var baseCreditos = _calcBaseCreditos();

    var pisCofinsResult = null;
    try {
      if (LR && LR.calcular && LR.calcular.pisCofins) {
        pisCofinsResult = LR.calcular.pisCofins({
          receitaBruta: receitaBruta,
          isentas: receitasIsentas,
          exportacao: 0, // já incluída em isentas acima
          comprasBensRevenda: _n(d.comprasMercadoriasAnual),
          energiaEletrica: _n(d.energiaCredito),
          alugueisPJ: _n(d.alugueisPJCredito),
          depreciacaoBens: _n(d.depreciacaoBensCredito) + _n(d.depreciacaoEdifCredito),
          freteArmazenagem: _n(d.freteVendasAnual) + _n(d.armazenagemCredito),
          leasing: _n(d.leasingCredito),
          valeTransporteRefeicao: _n(d.valeTranspAlim),
          devolucoes: _n(d.devolucoesVendas),
          outrosCreditos: _n(d.outrosCreditosPC) + _n(d.manutencaoMaquinas) + _n(d.creditoEstoqueAbertura)
        });
      }
    } catch (e) {
      console.warn('[IMPOST] Erro em LR.calcular.pisCofins:', e.message);
      pisCofinsResult = null;
    }
    // Fallback manual se motor não disponível ou falhou
    if (!pisCofinsResult) {
      var _recTribFB = _r(Math.max(receitaBruta - receitasIsentas, 0));
      var _debPIS = _r(_recTribFB * 0.0165);
      var _debCOF = _r(_recTribFB * 0.076);
      var _credPIS = _r(baseCreditos * 0.0165);
      var _credCOF = _r(baseCreditos * 0.076);
      pisCofinsResult = {
        receitaTributavel: _recTribFB,
        debitoPIS: _debPIS,
        debitoCOFINS: _debCOF,
        creditoPIS: _credPIS,
        creditoCOFINS: _credCOF,
        debitos: { pis: _debPIS, cofins: _debCOF },
        creditos: { pis: _credPIS, cofins: _credCOF },
        pisAPagar: _r(Math.max(_debPIS - _credPIS, 0)),
        cofinsAPagar: _r(Math.max(_debCOF - _credCOF, 0)),
        aPagar: {
          pis: _r(Math.max(_debPIS - _credPIS, 0)),
          cofins: _r(Math.max(_debCOF - _credCOF, 0)),
          total: _r(Math.max(_debPIS - _credPIS, 0) + Math.max(_debCOF - _credCOF, 0))
        }
      };
    }

    // Normalizar propriedades flat para evitar crash no render
    // O motor LR pode retornar debitos/creditos como objetos aninhados ou propriedades planas
    if (!pisCofinsResult.debitos) pisCofinsResult.debitos = { pis: 0, cofins: 0 };
    if (!pisCofinsResult.creditos) pisCofinsResult.creditos = { pis: 0, cofins: 0 };
    if (!pisCofinsResult.aPagar) pisCofinsResult.aPagar = { pis: 0, cofins: 0, total: 0 };

    // Garantir flat props a partir de aninhados (ou vice-versa)
    var _recTrib = pisCofinsResult.receitaTributavel || _r(receitaBruta - receitasIsentas);
    pisCofinsResult.receitaTributavel = _recTrib;
    pisCofinsResult.debitoPIS    = pisCofinsResult.debitoPIS    || pisCofinsResult.debitos.pis    || _r(_recTrib * 0.0165);
    pisCofinsResult.debitoCOFINS = pisCofinsResult.debitoCOFINS || pisCofinsResult.debitos.cofins || _r(_recTrib * 0.076);
    pisCofinsResult.debitos.pis    = pisCofinsResult.debitos.pis    || pisCofinsResult.debitoPIS;
    pisCofinsResult.debitos.cofins = pisCofinsResult.debitos.cofins || pisCofinsResult.debitoCOFINS;

    // Créditos: replicar lógica do simulador da Etapa 5
    var _totalCredBase = baseCreditos;
    pisCofinsResult.creditoPIS    = pisCofinsResult.creditoPIS    || pisCofinsResult.creditos.pis    || _r(_totalCredBase * 0.0165);
    pisCofinsResult.creditoCOFINS = pisCofinsResult.creditoCOFINS || pisCofinsResult.creditos.cofins || _r(_totalCredBase * 0.076);
    pisCofinsResult.creditos.pis    = pisCofinsResult.creditos.pis    || pisCofinsResult.creditoPIS;
    pisCofinsResult.creditos.cofins = pisCofinsResult.creditos.cofins || pisCofinsResult.creditoCOFINS;

    // A pagar líquido (débitos - créditos)
    var _pisAP  = _r(Math.max(pisCofinsResult.debitoPIS - pisCofinsResult.creditoPIS, 0));
    var _cofAP  = _r(Math.max(pisCofinsResult.debitoCOFINS - pisCofinsResult.creditoCOFINS, 0));
    // CORREÇÃO: Forçar sobrescrita com valores corretos (débitos - créditos).
    // O mapeamento pode retornar pisAPagar/cofinsAPagar SEM subtrair créditos
    // quando recebe itens individuais mas espera 'baseCreditos'. A cadeia ||
    // anterior preservava esses valores errados.
    pisCofinsResult.pisAPagar      = _pisAP;
    pisCofinsResult.cofinsAPagar   = _cofAP;
    pisCofinsResult.aPagar.pis     = _pisAP;
    pisCofinsResult.aPagar.cofins  = _cofAP;
    pisCofinsResult.aPagar.total   = _r(_pisAP + _cofAP);
    pisCofinsResult.totalAPagarBruto = _r(_pisAP + _cofAP);
    pisCofinsResult.totalAPagarAntesRetencoes = _r(_pisAP + _cofAP); // alias mantido
    pisCofinsResult.pisCofinsRetido = _r(_n(d.pisRetido) + _n(d.cofinsRetido));
    pisCofinsResult.totalAPagarLiquido = _r(Math.max((_pisAP + _cofAP) - _n(d.pisRetido) - _n(d.cofinsRetido), 0));
    pisCofinsResult.totalAPagar = pisCofinsResult.totalAPagarLiquido; // ← agora é o valor líquido (retrocompatível)

    // Economia com créditos (débitos totais - a pagar = quanto os créditos economizaram)
    var _totalDebitos = _r(pisCofinsResult.debitoPIS + pisCofinsResult.debitoCOFINS);
    pisCofinsResult.economiaCreditos = pisCofinsResult.economiaCreditos || _r(Math.max(_totalDebitos - pisCofinsResult.totalAPagarBruto, 0));
    pisCofinsResult.receitasIsentas  = pisCofinsResult.receitasIsentas || receitasIsentas;
    // CORREÇÃO FALHA #2: aliquotaEfetiva agora é LÍQUIDA (após retenções e créditos).
    // aliquotaEfetivaBruta é BRUTA (débitos sobre receita).
    pisCofinsResult.aliquotaEfetiva = pisCofinsResult.aliquotaEfetiva || (receitaBruta > 0 ? (_r(pisCofinsResult.totalAPagarLiquido / receitaBruta * 100)).toFixed(2) + '%' : '0.00%');
    pisCofinsResult.aliquotaEfetivaBruta = pisCofinsResult.aliquotaEfetivaBruta || (receitaBruta > 0 ? (_r(pisCofinsResult.totalAPagarBruto / receitaBruta * 100)).toFixed(2) + '%' : '0.00%');

    // CORREÇÃO BUG #4: Validar consistência entre totalAPagarBruto e aPagar.total
    if (pisCofinsResult.aPagar && pisCofinsResult.aPagar.total !== undefined) {
      if (Math.abs(pisCofinsResult.totalAPagarBruto - pisCofinsResult.aPagar.total) > 0.02) {
        console.warn('[IMPOST PIS/COFINS] Divergência entre totalAPagarBruto (' + pisCofinsResult.totalAPagarBruto + ') e aPagar.total (' + pisCofinsResult.aPagar.total + '). Usando valor recalculado.');
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 9 — ISS mensal
    // ═══════════════════════════════════════════════════════════════════════
    var issAliquota = _n(d.issAliquota) || 5;
    // ═══ CORREÇÃO BUG MÉDIO 1: Normalizar alíquota decimal → percentual ═══
    if (issAliquota > 0 && issAliquota < 1) {
      issAliquota = _r(issAliquota * 100); // converter 0.05 → 5
    }
    var ehSUP = d.ehSUP === true || d.ehSUP === "true";
    var issAnual, issMensal, issModalidade;
    if (ehSUP) {
      var issFixoProf = _n(d.issFixoPorProfissional) || 800;
      var nProf = parseInt(d.numProfissionaisSUP) || 2;
      issAnual = _r(issFixoProf * nProf);
      issMensal = _r(issAnual / 12);
      issModalidade = "SUP (fixo por profissional)";
    } else {
      issAnual = _r(receitaServicos * issAliquota / 100);
      issMensal = _r(issAnual / 12);
      issModalidade = "Percentual";
    }
    var issResult = {
      receitaServicos: receitaServicos,
      aliquota: ehSUP ? 0 : issAliquota,
      municipio: d.municipio || "—",
      issAnual: issAnual,
      issMensal: issMensal,
      modalidade: issModalidade,
      ehSUP: ehSUP,
      tipoServico: d.tipoServicoISS || "",
      baseLegal: "LC 116/2003"
    };

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 9.1 — CPRB (Desoneração da Folha)
    // ═══════════════════════════════════════════════════════════════════════
    var cprbResult = null;
    var optouCPRB = d.optouCPRB === true || d.optouCPRB === "true";
    if (optouCPRB) {
      var aliqCPRB = (_n(d.aliquotaCPRB) || 4.5) / 100;
      var baseCPRB = _n(d.receitaBrutaCPRB) || receitaBruta;
      var custoCPRB = _r(baseCPRB * aliqCPRB);
      var folhaBrutaCPRB = _n(d.folhaPagamentoAnual) || (_n(d.salariosBrutos) + _n(d.proLabore));
      var cppNormal = _r(folhaBrutaCPRB * 0.20);
      var economiaCPRB = _r(cppNormal - custoCPRB);
      cprbResult = {
        optou: true,
        aliquota: aliqCPRB,
        baseCPRB: baseCPRB,
        custoCPRB: custoCPRB,
        cppNormal: cppNormal,
        economia: Math.max(economiaCPRB, 0),
        compensa: economiaCPRB > 0
      };
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 10 — JCP → LR.calcular.jcp()
    // ═══════════════════════════════════════════════════════════════════════
    // plVal já calculado no PASSO 3A
    // MELHORIA Lei 14.789/2023: usar PL Ajustado quando informado
    var plParaJCP = _n(d.plAjustadoJCP) > 0 ? _n(d.plAjustadoJCP) : plVal;
    var jcpResult = null;
    // ═══ CORREÇÃO ERRO MÉDIO #6: Não usar default silencioso para TJLP ═══
    var _tjlpInformada = _n(d.tjlp);
    var _tjlpUsarDefault = false;
    if (!_tjlpInformada || _tjlpInformada === 0) {
      _tjlpInformada = 7.97; // Taxa Q1/2025 como fallback
      _tjlpUsarDefault = true;
      console.warn('[IMPOST] TJLP default 7.97% (Q1/2025) usada — verificar se atualizada para o exercício vigente');
    }
    if (plParaJCP > 0 && (lucroLiquido > 0 || lucroRealFinal > 0)) {
      try {
        jcpResult = LR.calcular.jcp({
          patrimonioLiquido: plParaJCP,
          capitalSocial: _n(d.capitalSocial) || null,
          reservasCapital: _n(d.reservasCapital),
          reservasLucros: _n(d.reservasLucros),
          lucrosAcumulados: _n(d.lucrosAcumulados) + _n(d.reservasLucros),
          prejuizosAcumulados: _n(d.prejuizosContabeis),
          tjlp: _tjlpInformada / 100,
          lucroLiquidoAntes: lucroLiquido,
          numMeses: 12
        });
        // Marcar no resultado se usou taxa default
        if (jcpResult && _tjlpUsarDefault) {
          jcpResult.tjlpDefault = true;
          jcpResult.tjlpUsada = _tjlpInformada;
          jcpResult.alertaTJLP = "ATENÇÃO: TJLP não informada. Usando taxa default de " + _tjlpInformada + "% (Q1/2025). Verifique a taxa vigente.";
        }
      } catch (e) { jcpResult = null; }
    }

    // ═══ CORREÇÃO ERRO MÉDIO #5: Recalcular IRPJ e CSLL com dedução do JCP ═══
    // O JCP é dedutível da base do IRPJ e da CSLL. Recalcular com a dedução aplicada.
    // ═══ FIX BUG #1 (CRÍTICO): Manter compensação de prejuízo ativa no cenário COM JCP ═══
    // Antes: compensação era zerada (prejuizoFiscal: 0, baseNegativa: 0) → economia JCP errada.
    // Agora: recalcula a trava de 30% sobre o novo lucro ajustado APÓS dedução do JCP.
    var jcpDedutivel = _safe(jcpResult, 'jcpDedutivel') || _safe(jcpResult, 'valorDedutivel') || 0;
    var irpjComJCP = irpjResult; // referência original (será sobrescrita se JCP > 0)
    var csllComJCP = csllResult;
    if (jcpDedutivel > 0) {
      // ── IRPJ COM JCP: Recalcular compensação sobre lucroAjustado - JCP ──
      var _lucroAjustadoComJCP_IRPJ = Math.max(lucroAjustado - jcpDedutivel, 0);
      // Recalcular trava de 30% sobre novo lucro ajustado
      var _compPrejComJCP = 0;
      if (!vedaCompensacao && prejuizoFiscal > 0 && _lucroAjustadoComJCP_IRPJ > 0) {
        _compPrejComJCP = Math.min(_lucroAjustadoComJCP_IRPJ * 0.30, prejuizoFiscal);
      }
      var _lucroRealComJCP = Math.max(_lucroAjustadoComJCP_IRPJ - _compPrejComJCP, 0);
      try {
        if (LR && LR.calcular && LR.calcular.irpj) {
          irpjComJCP = LR.calcular.irpj({
            lucroLiquido: _lucroRealComJCP,
            adicoes: 0,
            exclusoes: 0,
            prejuizoFiscal: 0, // já compensado manualmente acima
            numMeses: 12,
            incentivos: totalDeducoesIncentivos,
            retencoesFonte: totalIRRF,
            estimativasPagas: estimIRPJPagas,
            apuracao: d.apuracaoLR === "trimestral" ? "TRIMESTRAL" : "ANUAL"
          });
        }
      } catch (e) { irpjComJCP = irpjResult; }
      if (!irpjComJCP) irpjComJCP = irpjResult;

      // ── CSLL COM JCP: Recalcular compensação de base negativa sobre base - JCP ──
      var _lucroAjustadoComJCP_CSLL = Math.max(lucroAjustado - jcpDedutivel, 0);
      var _compBNComJCP = 0;
      if (!vedaCompensacao && baseNegCSLL > 0 && _lucroAjustadoComJCP_CSLL > 0) {
        _compBNComJCP = Math.min(_lucroAjustadoComJCP_CSLL * 0.30, baseNegCSLL);
      }
      var _baseCSLLComJCP = Math.max(_lucroAjustadoComJCP_CSLL - _compBNComJCP, 0);
      try {
        if (LR && LR.calcular && LR.calcular.csll) {
          csllComJCP = LR.calcular.csll({
            lucroLiquido: _baseCSLLComJCP,
            adicoes: 0,
            exclusoes: 0,
            baseNegativa: 0, // já compensado manualmente acima
            financeira: ehFinanceira,
            tipoAtividade: d.tipoAtividade || ""
          });
        }
      } catch (e) { csllComJCP = csllResult; }
      if (!csllComJCP) csllComJCP = csllResult;

      // Gravar nos resultados para referência
      irpjResult.irpjSemJCP = irpjResult.irpjDevido;
      irpjResult.irpjComJCP = irpjComJCP.irpjDevido || irpjResult.irpjDevido;
      irpjResult.compensacaoPrejComJCP = _compPrejComJCP;
      csllResult.csllSemJCP = csllResult.csllDevida;
      csllResult.csllComJCP = csllComJCP.csllDevida || csllResult.csllDevida;
      csllResult.compensacaoBNComJCP = _compBNComJCP;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 11 — Incentivos fiscais (já calculados no passo 6)
    // ═══════════════════════════════════════════════════════════════════════
    // incentivosFiscais já foi calculado acima

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 12 — SUDAM/SUDENE (já calculado no passo 6)
    // ═══════════════════════════════════════════════════════════════════════
    // sudamResult já foi calculado acima

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 12A — Lucro da Exploração (para incentivos SUDAM/SUDENE)
    // ═══════════════════════════════════════════════════════════════════════
    var lucroExploracaoResult = null;
    if ((isSUDAM || isSUDENE) && LR.calcular.lucroExploracao) {
      try {
        lucroExploracaoResult = LR.calcular.lucroExploracao({
          lucroLiquido: lucroLiquido,
          receitasFinanceirasLiquidas: receitaFinanceiras,
          resultadoMEP: _n(d.resultadoMEP),
          resultadoNaoOperacional: _n(d.lucroNaoOperacional),
          receitasAnteriores: 0,
          csllDevida: csllResult ? csllResult.csllDevida : 0
        });
      } catch(e) {}
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 13 — Depreciação → LR.calcular.depreciacaoCompleta()
    // ═══════════════════════════════════════════════════════════════════════
    var depreciacaoResult = { bens: [], total: 0, economiaFiscal: 0 };
    var bensParaCalculo = [];
    var bensConfig = [
      // CORREÇÃO BUG #2: Tipos devem ser EXATAMENTE iguais às chaves de DEPRECIACAO_FISCAL.taxasAnuais no motor
      // Antes: usava maiúsculas (MAQUINAS, COMPUTADORES) e fazia .toLowerCase() — mas isso
      // quebrava "veiculosPassageiro" → "veiculospassageiro" (sem match no motor).
      // Agora: chaves já são as corretas do motor, sem necessidade de conversão.
      { campo: "valorVeiculos", tipo: "veiculosPassageiro", taxa: 0.20 },
      { campo: "valorMaquinas", tipo: "maquinas", taxa: 0.10 },
      { campo: "valorComputadores", tipo: "computadores", taxa: 0.20 },
      { campo: "valorMoveis", tipo: "moveis", taxa: 0.10 },
      { campo: "valorEdificios", tipo: "edificios", taxa: 0.04 },
      { campo: "valorDrones", tipo: "drones", taxa: 0.20 },
      { campo: "valorTratores", tipo: "tratores", taxa: 0.25 },
      { campo: "valorSoftware", tipo: "software", taxa: 0.20 },
      { campo: "valorInstalacoes", tipo: "instalacoes", taxa: 0.10 },
      { campo: "valorOutrosBens", tipo: "outros", taxa: 0.10 } // "outros" não existe no motor — usa fallback manual
    ];
    bensConfig.forEach(function(bc) {
      var valor = _n(d[bc.campo]);
      // CORREÇÃO BUG #2: Tipos já estão nas chaves corretas do motor — não precisa mais de .toLowerCase()
      if (valor > 0) bensParaCalculo.push({ tipo: bc.tipo, custoAquisicao: valor, valor: valor, taxa: bc.taxa });
    });

    // MELHORIA #1: Validação centralizada — verificar se tipos existem no motor
    if (typeof LR !== 'undefined' && LR.DEPRECIACAO_FISCAL && LR.DEPRECIACAO_FISCAL.taxasAnuais) {
      bensParaCalculo.forEach(function(bp) {
        if (!LR.DEPRECIACAO_FISCAL.taxasAnuais[bp.tipo] && bp.tipo !== 'outros') {
          console.warn('[IMPOST DEPRECIACAO] Tipo "' + bp.tipo + '" não existe no motor. Usando fallback com taxa ' + bp.taxa + '.');
        }
      });
    }

    if (LR.calcular.depreciacaoCompleta && bensParaCalculo.length > 0) {
      // CORREÇÃO BUG 3: Iterar cada bem individualmente (motor espera um único bem, não array)
      var depreciacaoDetalhe = [];
      var totalDepNormal = 0;
      var totalDepAcelerada = 0;
      bensParaCalculo.forEach(function (bc) {
        var resultado = null;
        try {
          resultado = LR.calcular.depreciacaoCompleta({
            tipo: bc.tipo,
            custoAquisicao: bc.custoAquisicao,
            turnos: turnos,
            mesesUso: 12
          });
        } catch(e) {
          resultado = null;
        }
        // Se motor retornou erro ou falhou, usar fallback manual para este bem
        if (!resultado || resultado.erro) {
          var depN = _r(bc.custoAquisicao * bc.taxa);
          var depA = _r(depN * multTurnos);
          totalDepNormal += depN;
          totalDepAcelerada += depA;
          depreciacaoDetalhe.push({
            tipo: bc.tipo, valorOriginal: bc.custoAquisicao, taxa: bc.taxa,
            depreciaNormal: depN, depreciaAcelerada: depA, turnos: turnos
          });
        } else {
          // Motor retornou resultado válido
          var depNM = resultado.depreciacaoNormal || resultado.depreciacaoPeriodo || _r(bc.custoAquisicao * bc.taxa);
          var depAM = resultado.depreciacaoAcelerada || resultado.depreciacaoIncentivada || _r(depNM * multTurnos);
          totalDepNormal += depNM;
          totalDepAcelerada += depAM;
          depreciacaoDetalhe.push(Object.assign({
            tipo: bc.tipo, valorOriginal: bc.custoAquisicao, taxa: bc.taxa,
            depreciaNormal: depNM, depreciaAcelerada: depAM, turnos: turnos
          }, resultado));
        }
      });
      var depBensNovos = 0;
      if ((isSUDAM || isSUDENE) && _n(d.valorBensNovos) > 0) {
        depBensNovos = _n(d.valorBensNovos);
      }
      var depBensSmall = _n(d.bensSmallValue);
      var depreciacaoTotal = _r(totalDepAcelerada + depBensNovos + depBensSmall);
      depreciacaoResult = {
        bens: depreciacaoDetalhe,
        depreciaNormal: totalDepNormal,
        depreciaAcelerada: totalDepAcelerada,
        depBensNovos: depBensNovos,
        depBensSmall: depBensSmall,
        total: depreciacaoTotal,
        economiaFiscal: _r(depreciacaoTotal * 0.34),
        turnos: turnos,
        multiplicador: multTurnos
      };
    } else if (bensParaCalculo.length > 0) {
      // fallback sem motor disponível
      var depreciacaoDetalhe2 = [];
      var totalDepNormal2 = 0;
      var totalDepAcelerada2 = 0;
      bensParaCalculo.forEach(function (bc) {
        var depN = _r(bc.valor * bc.taxa);
        var depA = _r(depN * multTurnos);
        totalDepNormal2 += depN;
        totalDepAcelerada2 += depA;
        depreciacaoDetalhe2.push({
          tipo: bc.tipo, valorOriginal: bc.valor, taxa: bc.taxa,
          depreciaNormal: depN, depreciaAcelerada: depA, turnos: turnos
        });
      });
      var depBensNovos2 = 0;
      if ((isSUDAM || isSUDENE) && _n(d.valorBensNovos) > 0) {
        depBensNovos2 = _n(d.valorBensNovos);
      }
      var depBensSmall2 = _n(d.bensSmallValue);
      var depreciacaoTotal2 = _r(totalDepAcelerada2 + depBensNovos2 + depBensSmall2);
      depreciacaoResult = {
        bens: depreciacaoDetalhe2,
        depreciaNormal: totalDepNormal2,
        depreciaAcelerada: totalDepAcelerada2,
        depBensNovos: depBensNovos2,
        depBensSmall: depBensSmall2,
        total: depreciacaoTotal2,
        economiaFiscal: _r(depreciacaoTotal2 * 0.34),
        turnos: turnos,
        multiplicador: multTurnos
      };
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 13A — Amortização de Goodwill
    // ═══════════════════════════════════════════════════════════════════════
    var goodwillResult = null;
    if (_n(d.valorGoodwill) > 0 && LR.calcular.avancado && LR.calcular.avancado.calcularAmortizacaoGoodwill) {
      try {
        goodwillResult = LR.calcular.avancado.calcularAmortizacaoGoodwill({
          valorGoodwill: _n(d.valorGoodwill),
          mesesNoAno: 12
        });
      } catch(e) {}
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 13B — Exaustão de Recursos Naturais
    // ═══════════════════════════════════════════════════════════════════════
    var exaustaoResult = null;
    if (_n(d.valorRecursosNaturais) > 0 && LR.calcular.avancado && LR.calcular.avancado.calcularExaustao) {
      try {
        exaustaoResult = LR.calcular.avancado.calcularExaustao({
          custoAquisicao: _n(d.valorRecursosNaturais)
        });
      } catch(e) {}
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 13C — Despesas Pré-Operacionais
    // ═══════════════════════════════════════════════════════════════════════
    var preOperacionalResult = null;
    if (_n(d.despesasPreOperacionais) > 0 && LR.calcular.avancado && LR.calcular.avancado.calcularDespesasPreOperacionais) {
      try {
        preOperacionalResult = LR.calcular.avancado.calcularDespesasPreOperacionais({
          valorTotal: _n(d.despesasPreOperacionais)
        });
      } catch(e) {}
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 14 — Retenções compensáveis → LR.calcular.compensarRetencoes()
    // ═══════════════════════════════════════════════════════════════════════
    var retencoesResult = null;
    var totalCSRF = _n(d.pisRetido) + _n(d.cofinsRetido) + _n(d.csllRetido);
    if (LR.calcular.compensarRetencoes) {
      try {
        retencoesResult = LR.calcular.compensarRetencoes({
          retencoesSofridas: {
            irrf: totalIRRF,
            pis: _n(d.pisRetido),
            cofins: _n(d.cofinsRetido),
            csll: _n(d.csllRetido)
          },
          tributosDevidos: {
            irpj: irpjAposReducao,
            csll: csllResult.csllDevida,
            pis: pisCofinsResult.pisAPagar || pisCofinsResult.aPagar.pis,
            cofins: pisCofinsResult.cofinsAPagar || pisCofinsResult.aPagar.cofins
          }
        });
      } catch (e) { retencoesResult = null; }
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 15 — Saldo negativo → LR.calcular.saldoNegativo()
    // ═══════════════════════════════════════════════════════════════════════
    var saldoNegResult = null;
    if (LR.calcular.saldoNegativo) {
      try {
        saldoNegResult = LR.calcular.saldoNegativo({
          irpjDevido: irpjAposReducao,
          retencoesFonte: totalIRRF,
          estimativasPagas: estimIRPJPagas
        });
      } catch (e) { saldoNegResult = null; }
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 16 — Simulação TRIMESTRAL
    // ═══════════════════════════════════════════════════════════════════════
    // var simTrimestral = _simularTrimestral(...); // Movido para PASSO 6 (BUG 1 fix)

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 17 — Simulação ANUAL POR ESTIMATIVA
    // ═══════════════════════════════════════════════════════════════════════
    var simAnual = _simularAnualEstimativa(d, receitaBruta, lucroRealFinal, ehFinanceira, irpjAntesReducao, csllResult.csllDevida);

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 18 — Suspensão/redução (informativo)
    // ═══════════════════════════════════════════════════════════════════════
    var simSuspensao = _simularSuspensaoReducao(d, receitaBruta, lucroRealFinal, ehFinanceira, irpjAntesReducao, csllResult.csllDevida);

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 19 — Recomendação de melhor forma de apuração
    // ═══════════════════════════════════════════════════════════════════════
    var recomendacao = _recomendarApuracao(simTrimestral, simAnual, simSuspensao, d);

    // Recomendação de regime via motor (complementar)
    var recomendacaoRegime = null;
    if (LR.calcular.recomendarRegime) {
      try {
        recomendacaoRegime = LR.calcular.recomendarRegime({
          lucroAjustado: lucroAjustado,
          prejuizoFiscal: _n(d.prejuizoFiscal),
          prejuizoAcumulado: _n(d.prejuizoFiscal),
          baseNegativaCSLL: _n(d.baseNegativaCSLL),
          receitaBruta: receitaBruta,
          sazonalidade: d.preencherMesAMes === true || d.preencherMesAMes === "true",
          mesesReceita: (function() {
            var arr = [];
            for (var m = 1; m <= 12; m++) arr.push(_n(d["receitaMes" + m]));
            return arr;
          })(),
          lucrosMensais: (function() {
            var arr = [];
            var temMes = d.preencherMesAMes === true || d.preencherMesAMes === "true";
            for (var m = 1; m <= 12; m++) {
              if (temMes && _n(d["receitaMes" + m]) > 0) {
                var fator = _n(d.receitaBrutaAnual) > 0 ? _n(d["receitaMes" + m]) / _n(d.receitaBrutaAnual) : 1/12;
                arr.push(_r(lucroAjustado * fator));
              } else {
                arr.push(_r(lucroAjustado / 12));
              }
            }
            return arr;
          })()
        });
      } catch(e) {}
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PRÉ-CÁLCULO — Totais de economia (necessário para projeção)
    // ═══════════════════════════════════════════════════════════════════════
    var economiaJCP = _safe(jcpResult, 'economiaLiquida');
    var economiaPrejuizo = _safe(compensacao, 'resumo', 'economia', 'total');
    var economiaSUDAM = reducaoSUDAM;
    var economiaIncentivos = _safe(incentivosFiscais, 'economiaTotal');
    var economiaDepreciacao = _safe(depreciacaoResult, 'economiaFiscal');
    var economiaPisCofins = pisCofinsResult.economiaCreditos || 0;
    // ═══ CORREÇÃO BUG CRÍTICO 5: Usar alíquota efetiva (não fixa 34%) ═══
    var _aliqEfetIRPJ = lucroRealFinal > 0
      ? Math.min((irpjResult.irpjDevido || 0) / lucroRealFinal, 0.25)
      : 0.15;
    var _aliqEfetCSLL = csllResult.aliquota || 0.09;
    var economiaGratificacao = _n(d.gratificacoesAdm) > 0
      ? _r(_n(d.gratificacoesAdm) * (_aliqEfetIRPJ + _aliqEfetCSLL))
      : 0;
    var economiaCPRBFinal = cprbResult ? cprbResult.economia : 0;
    // ═══ CORREÇÃO BUG CRÍTICO 1: PDD já reduz IRPJ/CSLL via exclusões LALUR — não contar 2x ═══
    var totalPDDEcon = 0; // Valor zerado para eliminar dupla contagem
    var totalPDDInfo = _r((_n(d.perdasCreditos6Meses) + _n(d.perdasCreditosJudicial) + _n(d.perdasCreditosFalencia)) * (_aliqEfetIRPJ + _aliqEfetCSLL)); // apenas para exibição

    // ═══ CORREÇÃO ERRO BAIXO #8: Separar economias REALIZADAS vs OPORTUNIDADE ═══
    // Economias realizadas: já refletidas nos cálculos efetivos
    var economiasRealizadas = _r(economiaJCP + economiaPrejuizo + economiaSUDAM + economiaIncentivos + economiaDepreciacao + economiaPisCofins + economiaCPRBFinal);
    // Economias de oportunidade: potenciais, dependem de implementação
    var economiasOportunidade = _r(economiaGratificacao + totalPDDEcon);
    // Total inclui ambas para manter compatibilidade
    var totalEconomias = _r(economiasRealizadas + economiasOportunidade);

    // ── CORREÇÃO BUG-02: Garantir que totalEconomias nunca seja 0 quando há economias individuais ──
    // Se totalEconomias resultou em 0 mas há economias individuais calculadas, recalcular diretamente
    if (totalEconomias === 0) {
      var _ecoCheck = [economiaJCP, economiaPrejuizo, economiaSUDAM, economiaIncentivos,
                       economiaDepreciacao, economiaPisCofins, economiaCPRBFinal, totalPDDEcon, economiaGratificacao];
      var _ecoSum = 0;
      for (var _ei = 0; _ei < _ecoCheck.length; _ei++) {
        _ecoSum += (_ecoCheck[_ei] || 0);
      }
      if (_ecoSum > 0) {
        totalEconomias = _r(_ecoSum);
        console.warn('[IMPOST] BUG-02 safety: totalEconomias recalculado de 0 para ' + totalEconomias);
      }
    }

    // CORREÇÃO FALHA #3: Carga bruta 100% bruta (IRPJ + CSLL + PIS/COFINS + ISS, todos ANTES de retenções)
    var pisCofinsLiquido = _r(Math.max(pisCofinsResult.totalAPagarBruto - _n(d.pisRetido) - _n(d.cofinsRetido), 0));
    var pisCofinsParaCargaBruta = pisCofinsResult.totalAPagarBruto || pisCofinsLiquido;
    var cargaBruta = _r(irpjBruto + csllResult.csllDevida + pisCofinsParaCargaBruta + issAnual);
    var cargaOtimizada = _r(Math.max(cargaBruta - totalEconomias, 0));
    var aliquotaEfetiva = receitaBruta > 0 ? _r(cargaBruta / receitaBruta * 100) : 0;
    var aliquotaOtimizada = receitaBruta > 0 ? _r(cargaOtimizada / receitaBruta * 100) : 0;

    // Retenções totais
    var totalRetencoes = totalIRRF + totalCSRF + _n(d.issRetido);

    // ═══ CORREÇÃO ERRO BAIXO #9: saldoEfetivo considera economia do JCP ═══
    // Se JCP for efetivamente pago, a carga real é menor. Calcular cargaBrutaComJCP.
    var cargaBrutaComJCP = cargaBruta;
    if (jcpDedutivel > 0 && irpjComJCP && csllComJCP) {
      var _irpjComJCPDevido = irpjComJCP.irpjDevido || irpjResult.irpjDevido;
      var _csllComJCPDevida = csllComJCP.csllDevida || csllResult.csllDevida;
      cargaBrutaComJCP = _r(_irpjComJCPDevido + _csllComJCPDevida + pisCofinsParaCargaBruta + issAnual);
    }

    // Saldo a pagar efetivo (usa cargaBrutaComJCP para refletir economia do JCP)
    var saldoEfetivo = retencoesResult
      ? (retencoesResult.tributosARecolher ? retencoesResult.tributosARecolher.total : _r(cargaBrutaComJCP - totalRetencoes))
      : _r(cargaBrutaComJCP - totalRetencoes);

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 20 — Cenários (pessimista / base / otimista)
    // ═══════════════════════════════════════════════════════════════════════
    var cenarios = null;
    if (d.gerarCenarios === true || d.gerarCenarios === "true") {
      cenarios = _gerarCenarios(d, dre, lalur, ehFinanceira, prejuizoFiscal, baseNegCSLL, vedaCompensacao);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 21 — Projeção plurianual
    // ═══════════════════════════════════════════════════════════════════════
    var projecao = null;
    if (d.gerarProjecao === true || d.gerarProjecao === "true") {
      var taxa = (_n(d.taxaCrescimentoAnual) || 10) / 100;
      var horizonte = parseInt(d.horizonteProjecao) || 5;
      if (LR.simular && LR.simular.compensacaoPluranual) {
        try {
          projecao = LR.simular.compensacaoPluranual({
            saldoPrejuizoFiscal: compensacao ? (compensacao.resumo.saldosPosCompensacao.prejuizoOperacional || 0) : prejuizoFiscal,
            saldoBaseNegativaCSLL: compensacao ? (compensacao.resumo.saldosPosCompensacao.baseNegativaCSLL || 0) : baseNegCSLL,
            lucroProjetadoAnual: lucroAjustado,
            anosProjecao: horizonte
          });
        } catch (e) { projecao = null; }
      }
      // Projeção de carga tributária com crescimento
      // ═══ CORREÇÃO BUG MÉDIO 3: JCP depende do PL, não escala com receita ═══
      var econSemJCP = _r(totalEconomias - economiaJCP);
      var projecaoCarga = [];
      var receitaProj = receitaBruta;
      var econAcum = 0;
      for (var aP = 0; aP < horizonte; aP++) {
        if (aP > 0) receitaProj = _r(receitaProj * (1 + taxa));
        var fator = receitaProj / (receitaBruta || 1);
        var cargaAno = _r((irpjAposReducao + csllResult.csllDevida + pisCofinsLiquido + issAnual) * fator);
        var econAno = _r(econSemJCP * fator + economiaJCP);
        econAcum += econAno;
        projecaoCarga.push({
          ano: aP + 1,
          receita: receitaProj,
          carga: cargaAno,
          economiaAno: econAno,
          economiaAcumulada: _r(econAcum)
        });
      }
      projecao = projecao || {};
      projecao.projecaoCarga = projecaoCarga;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 22 — Fluxo de caixa tributário mensal
    // ═══════════════════════════════════════════════════════════════════════
    var fluxoCaixa = _gerarFluxoCaixaMensal(d, receitaBruta, receitaServicos, issAliquota, irpjAposReducao, csllResult.csllDevida, pisCofinsResult, simTrimestral);

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 22A — Relatório Consolidado (PARTE 5)
    // ═══════════════════════════════════════════════════════════════════════
    var relatorioConsolidado = null;
    if (LR.calcular.avancado && LR.calcular.avancado.gerarRelatorioConsolidado) {
      try {
        relatorioConsolidado = LR.calcular.avancado.gerarRelatorioConsolidado({
          irpj: irpjResult, csll: csllResult, pisCofins: pisCofinsResult,
          jcp: jcpResult, compensacao: compensacao, depreciacao: depreciacaoResult,
          incentivos: incentivosFiscais, retencoes: retencoesResult,
          sudam: sudamResult, saldoNegativo: saldoNegResult
        });
      } catch(e) {}
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 22B — Árvore de Decisão de Otimização (PARTE 5)
    // ═══════════════════════════════════════════════════════════════════════
    var arvoreDecisao = null;
    if (LR.calcular.avancado && LR.calcular.avancado.arvoreDecisaoOtimizacao) {
      try {
        arvoreDecisao = LR.calcular.avancado.arvoreDecisaoOtimizacao({
          receitaBruta: receitaBruta,
          lucroLiquido: lucroLiquido,
          patrimonioLiquido: plVal,
          folhaPagamento: dre.folhaPagamento,
          uf: uf,
          tipoAtividade: d.tipoAtividade,
          ehFinanceira: ehFinanceira,
          temProjetoSUDAM: temProjetoSUDAM,
          isSUDAM: isSUDAM,
          isSUDENE: isSUDENE
        });
      } catch(e) {}
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 22C — Verificar Elegibilidade de Incentivos Regionais (PARTE 5)
    // ═══════════════════════════════════════════════════════════════════════
    var elegibilidade = null;
    if (LR.calcular.avancado && LR.calcular.avancado.verificarElegibilidade) {
      try {
        elegibilidade = LR.calcular.avancado.verificarElegibilidade({
          uf: uf, cnae: d.cnaePrincipal, receitaBruta: receitaBruta
        });
      } catch(e) {}
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 22D — Simulação de Retenções Anuais (PARTE 5)
    // ═══════════════════════════════════════════════════════════════════════
    var retencoesAnuais = null;
    if (LR.calcular.avancado && LR.calcular.avancado.simularRetencoesAnuais) {
      try {
        retencoesAnuais = LR.calcular.avancado.simularRetencoesAnuais({
          receitaServicos: receitaServicos,
          recebeDeAdmPublica: d.recebeDeAdmPublica === true || d.recebeDeAdmPublica === "true",
          aliquotaISS: _n(d.issAliquota)
        });
      } catch(e) {}
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 22E — Comparativo Simples vs Lucro Real SUDAM (PARTE 5)
    // ═══════════════════════════════════════════════════════════════════════
    var comparativoSUDAM = null;
    if (isSUDAM && LR.calcular.avancado && LR.calcular.avancado.compararSimplesVsLucroRealSUDAM) {
      try {
        comparativoSUDAM = LR.calcular.avancado.compararSimplesVsLucroRealSUDAM({
          receitaBruta: receitaBruta,
          lucroLiquido: lucroLiquido,
          folhaPagamento: dre.folhaPagamento,
          tipoAtividade: d.tipoAtividade
        });
      } catch(e) {}
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 22F — Acréscimos Moratórios e Multas (Bloco H)
    //  Arts. 44, 47, 61, 63 — Lei 9.430/1996 + Lei 14.689/2023
    // ═══════════════════════════════════════════════════════════════════════
    var acrescimosMoratoriosResult = null;
    var multaOficioResult = null;
    var prazoEspontaneoResult = null;
    var suspensaoMultaResult = null;

    // Só calcula se o usuário informou dados de atraso/mora
    var temDadosMora = _n(d.valorPrincipalMora) > 0 || d.dataVencimentoMora || d.dataPagamentoMora;
    if (temDadosMora && LR.calcular) {
      try {
        var dadosMora = {
          valorPrincipal: _n(d.valorPrincipalMora) || _r(cargaBruta / 12),
          valorTributo: _n(d.valorPrincipalMora) || _r(cargaBruta / 12),
          dataVencimento: d.dataVencimentoMora || null,
          dataPagamento: d.dataPagamentoMora || null,
          diasAtraso: _n(d.diasAtrasoMora) || 0,
          taxasSelicMes: []
        };
        // Calcular diasAtraso a partir de datas se não fornecido diretamente
        if (!dadosMora.diasAtraso && dadosMora.dataVencimento && dadosMora.dataPagamento) {
          try {
            var _dv = new Date(dadosMora.dataVencimento);
            var _dp = new Date(dadosMora.dataPagamento);
            if (!isNaN(_dv.getTime()) && !isNaN(_dp.getTime())) {
              dadosMora.diasAtraso = Math.max(0, Math.round((_dp - _dv) / 86400000));
            }
          } catch(_e) {}
        }
        if (LR.calcular.acrescimosMoratorios) {
          acrescimosMoratoriosResult = LR.calcular.acrescimosMoratorios(dadosMora);
        }
      } catch(e) { if (typeof console !== 'undefined') console.warn('[Passo 22F] acrescimosMoratorios:', e.message); }
    }

    // Multa de ofício — simulação com base na carga tributária calculada
    // CORREÇÃO FALHA #5: só calcular multa de ofício se houver valor relevante de tributo
    if (LR.calcular && LR.calcular.multaOficio && _r(cargaBruta / 12) > 0) {
      try {
        multaOficioResult = LR.calcular.multaOficio({
          valorDiferenca: _r(cargaBruta / 12),
          valorTributo: _r(cargaBruta / 12),
          tipoInfracao: (d.tipoMultaOficio || 'PADRAO') === 'PADRAO' ? 'normal' : (d.tipoMultaOficio || 'normal').toLowerCase(),
          tipo: d.tipoMultaOficio || 'PADRAO',
          pagamento30Dias: d.pagouMultaEm30Dias === true || d.pagouMultaEm30Dias === "true",
          pagouEm30Dias: d.pagouMultaEm30Dias === true || d.pagouMultaEm30Dias === "true",
          temConformidade: d.temConformidadeLei14689 === true || d.temConformidadeLei14689 === "true",
          temTransacao: d.temTransacaoTributaria === true || d.temTransacaoTributaria === "true"
        });
        // FALHA #5: limpar resultado se multaLiquida é 0 (empresa adimplente)
        if (multaOficioResult && (multaOficioResult.multaLiquida || multaOficioResult.valorFinal || 0) <= 0) {
          multaOficioResult = null;
        }
      } catch(e) { if (typeof console !== 'undefined') console.warn('[Passo 22F] multaOficio:', e.message); }
    }

    // Prazo espontâneo — 20 dias do termo de fiscalização
    if (LR.validar && LR.validar.prazoEspontaneo) {
      try {
        prazoEspontaneoResult = LR.validar.prazoEspontaneo({
          dataTermoFiscalizacao: d.dataTermoFiscalizacao || null
        });
      } catch(e) { if (typeof console !== 'undefined') console.warn('[Passo 22F] prazoEspontaneo:', e.message); }
    }

    // Suspensão de multa de ofício por liminar/tutela
    if (LR.validar && LR.validar.suspensaoMultaOficio) {
      try {
        suspensaoMultaResult = LR.validar.suspensaoMultaOficio({
          temLiminar: d.temLiminarSuspensao === true || d.temLiminarSuspensao === "true",
          temTutela: d.temTutelaSuspensao === true || d.temTutelaSuspensao === "true",
          temDeposito: d.temDepositoJudicial === true || d.temDepositoJudicial === "true"
        });
      } catch(e) { if (typeof console !== 'undefined') console.warn('[Passo 22F] suspensaoMulta:', e.message); }
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 22G — Compensação PER/DCOMP (Bloco I)
    //  Arts. 73, 74, 74-A — CTN + Lei 14.873/2024
    // ═══════════════════════════════════════════════════════════════════════
    var compensacaoPERDCOMPResult = null;
    var compensacaoJudicialResult = null;

    var temCreditoCompensavel = _n(d.creditoCompensavelValor) > 0 || (saldoNegResult && saldoNegResult.saldoNegativo > 0);
    if (temCreditoCompensavel && LR.calcular) {
      var valorCredComp = _n(d.creditoCompensavelValor) || (saldoNegResult ? (saldoNegResult.saldoNegativo || 0) : 0);
      try {
        if (LR.calcular.compensacaoPERDCOMP) {
          compensacaoPERDCOMPResult = LR.calcular.compensacaoPERDCOMP({
            creditoValor: valorCredComp,
            creditoTipo: d.creditoCompensavelTipo || 'PAGAMENTO_INDEVIDO',
            ehEstimativa: d.creditoEhEstimativa === true || d.creditoEhEstimativa === "true",
            creditoPrescrito: d.creditoPrescrito === true || d.creditoPrescrito === "true",
            temTransitoJulgado: d.creditoTemTransito === true || d.creditoTemTransito === "true",
            debitoDestino: d.debitoDestinoCompensacao || 'IRPJ',
            lucroRealFinal: lucroRealFinal,
            cargaBruta: cargaBruta
          });
        }
      } catch(e) { if (typeof console !== 'undefined') console.warn('[Passo 22G] compensacaoPERDCOMP:', e.message); }

      // Simulação judicial — créditos > R$ 10 milhões
      if (valorCredComp > 10000000 && LR.calcular.compensacaoJudicial) {
        try {
          compensacaoJudicialResult = LR.calcular.compensacaoJudicial({
            valorCredito: valorCredComp,
            prazoMeses: 60,
            limiteMinimo: 10000000
          });
        } catch(e) { if (typeof console !== 'undefined') console.warn('[Passo 22G] compensacaoJudicial:', e.message); }
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 23 — Detector de oportunidades
    // ═══════════════════════════════════════════════════════════════════════
    var oportunidades = _detectarOportunidades(d, {
      lucroLiquido: lucroLiquido,
      lucroAjustado: lucroAjustado,
      lucroRealFinal: lucroRealFinal,
      plVal: plVal,
      jcpResult: jcpResult,
      compensacao: compensacao,
      irpjResult: irpjResult,
      irpjNormalPrevia: irpjNormalPrevia,
      irpjAposReducao: irpjAposReducao,
      csllResult: csllResult,
      pisCofinsResult: pisCofinsResult,
      incentivosFiscais: incentivosFiscais,
      sudamResult: sudamResult,
      retencoesResult: retencoesResult,
      saldoNegResult: saldoNegResult,
      depreciacaoResult: depreciacaoResult,
      totalIRRF: totalIRRF,
      totalCSRF: totalCSRF,
      baseCreditos: baseCreditos,
      receitaServicos: receitaServicos,
      isSUDAM: isSUDAM,
      isSUDENE: isSUDENE,
      temProjetoSUDAM: temProjetoSUDAM,
      ehFinanceira: ehFinanceira,
      despesasIncentivos: despesasIncentivos,
      receitaBruta: receitaBruta,
      folhaPagamento: dre.folhaPagamento,
      custosTotais: custosTotais,
      despesasTotais: despesasTotais,
      validacaoDespesasLimites: validacaoDespesasLimites,
      subcapResult: subcapResult,
      omissaoResult: omissaoResult,
      lucroExploracaoResult: lucroExploracaoResult,
      goodwillResult: goodwillResult,
      exaustaoResult: exaustaoResult,
      preOperacionalResult: preOperacionalResult,
      recomendacaoRegime: recomendacaoRegime,
      lucroOperacional: lucroOperacional,
      receitaLiquida: receitaLiquida,
      totalAdicoes: totalAdicoes || 0,   // BUG#4 CORRIGIDO: mapeado do LALUR
      totalExclusoes: totalExclusoes || 0,  // BUG#4 CORRIGIDO: mapeado do LALUR
      // ═══ FIX BUG #5: Passar alíquotas efetivas para cálculo consistente de PDD ═══
      aliqEfetIRPJ: _aliqEfetIRPJ,
      aliqEfetCSLL: _aliqEfetCSLL
    });

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 24 — Compliance e obrigatoriedade
    // ═══════════════════════════════════════════════════════════════════════
    var obrigatoriedade = null;
    if (LR.validar && LR.validar.obrigatoriedade) {
      try {
        obrigatoriedade = LR.validar.obrigatoriedade({
          receitaTotalAnterior: receitaBruta,
          ehInstituicaoFinanceira: ehFinanceira,
          temRendimentosExterior: _n(d.receitasExteriorAnual) > 0,
          tipoAtividade: d.tipoAtividade || ""
        });
      } catch (e) { obrigatoriedade = null; }
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 25 — Obrigações acessórias
    // ═══════════════════════════════════════════════════════════════════════
    var obrigacoes = LR.obrigacoes || [];

    // PASSO 26 — DARFs (CORRIGIDO — enriquecer com periodicidade e prazo)
    var darfs = [];
    var _darfMeta = {
      '0220': { tributo: 'IRPJ', periodicidade: 'Trimestral', prazo: 'Último dia útil do mês subsequente ao trimestre' },
      '2362': { tributo: 'IRPJ', periodicidade: 'Mensal', prazo: 'Último dia útil do mês subsequente' },
      '2430': { tributo: 'IRPJ', periodicidade: 'Anual', prazo: 'Último dia útil de março do ano seguinte' },
      '6012': { tributo: 'CSLL', periodicidade: 'Trimestral', prazo: 'Último dia útil do mês subsequente ao trimestre' },
      '2484': { tributo: 'CSLL', periodicidade: 'Mensal', prazo: 'Último dia útil do mês subsequente' },
      '6773': { tributo: 'CSLL', periodicidade: 'Anual', prazo: 'Último dia útil de março do ano seguinte' },
      '6912': { tributo: 'PIS', periodicidade: 'Mensal', prazo: 'Dia 25 do mês subsequente' },
      '5856': { tributo: 'COFINS', periodicidade: 'Mensal', prazo: 'Dia 25 do mês subsequente' },
      '5706': { tributo: 'IRRF s/ JCP', periodicidade: 'Por evento', prazo: 'Até 3º dia útil após pagamento/crédito' }
    };
    function _enriquecerDarf(df) {
      if (!df) return null;
      var meta = _darfMeta[df.codigo] || {};
      return {
        codigo: df.codigo,
        tributo: df.tributo || df.nome || meta.tributo || df.descricao || '—',
        descricao: df.descricao || '',
        periodicidade: df.periodicidade || meta.periodicidade || '—',
        prazo: df.prazo || df.vencimento || meta.prazo || '—'
      };
    }
    if (LR.darf) {
      if (d.apuracaoLR === "trimestral") {
        darfs.push(_enriquecerDarf(LR.darf.irpjTrimestral));
        darfs.push(_enriquecerDarf(LR.darf.csllTrimestral));
      } else {
        darfs.push(_enriquecerDarf(LR.darf.irpjMensal));
        darfs.push(_enriquecerDarf(LR.darf.csllMensal));
        darfs.push(_enriquecerDarf(LR.darf.irpjAnualAjuste));
        darfs.push(_enriquecerDarf(LR.darf.csllAnualAjuste));
      }
      darfs.push(_enriquecerDarf(LR.darf.pisNaoCumulativo));
      darfs.push(_enriquecerDarf(LR.darf.cofinsNaoCumulativo));
      if (jcpResult && jcpResult.jcpDedutivel > 0) darfs.push(_enriquecerDarf(LR.darf.jcpIrrf));
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 27 — Objeto resultados completo
    // ═══════════════════════════════════════════════════════════════════════
    var resultados = {
      versao: VERSAO,
      dataGeracao: new Date().toISOString(),
      config: CONFIG,
      dadosEmpresa: Object.assign({}, d),

      // Seção 2: Painel resumo
      resumo: {
        economiaTotal: totalEconomias,
        numOportunidades: oportunidades.length,
        cargaBruta: cargaBruta,
        cargaBrutaMensal: _r(cargaBruta / 12),
        aliquotaEfetiva: aliquotaEfetiva,
        cargaOtimizada: cargaOtimizada,
        aliquotaOtimizada: aliquotaOtimizada,
        totalRetencoes: totalRetencoes,
        saldoEfetivo: saldoEfetivo,
        issAnual: issAnual,
        desembolsoTotal: _r(saldoEfetivo + issAnual)
      },

      // Seção 3: DRE + LALUR
      dre: dre,
      lalur: lalur,
      lucroRealFinal: lucroRealFinal,
      baseCSLLFinal: baseCSLLFinal,

      // Seção 4: Tributos detalhados
      irpj: irpjResult,
      irpjBruto: irpjBruto,
      irpjAntesReducao: irpjAntesReducao,
      irpjAposReducao: irpjAposReducao,
      reducaoSUDAM: reducaoSUDAM,
      csll: csllResult,
      pisCofins: pisCofinsResult,
      iss: issResult,

      // Seção 5: Composição da carga
      composicao: {
        // CORREÇÃO BUG CRÍTICO 2: cargaBruta usa irpjBruto, composicao.irpj também
        irpj: { valor: irpjBruto, percentual: cargaBruta > 0 ? _r(irpjBruto / cargaBruta * 100) : 0 },
        csll: { valor: csllResult.csllDevida, percentual: cargaBruta > 0 ? _r(csllResult.csllDevida / cargaBruta * 100) : 0 },
        pisCofins: { valor: pisCofinsParaCargaBruta, percentual: cargaBruta > 0 ? _r(pisCofinsParaCargaBruta / cargaBruta * 100) : 0 },  // BUG#1 CORRIGIDO: usa bruto para consistência com IRPJ e CSLL
        iss: { valor: issAnual, percentual: cargaBruta > 0 ? _r(issAnual / cargaBruta * 100) : 0 }
      },

      // Seção 6: Mapa de economia
      economia: {
        jcp: economiaJCP,
        prejuizo: economiaPrejuizo,
        sudam: economiaSUDAM,
        incentivos: economiaIncentivos,
        depreciacao: economiaDepreciacao,
        pisCofinsCreditos: economiaPisCofins,
        gratificacao: economiaGratificacao,
        cprb: economiaCPRBFinal,
        pddFiscal: totalPDDEcon,
        // ═══ FIX BUG #5: pddFiscalInfo = impacto fiscal com alíquotas efetivas (pode diferir de oportunidade que usa mesmas alíquotas agora) ═══
        pddFiscalInfo: totalPDDInfo, // valor informativo: perdas × (alíqEfetIRPJ + alíqEfetCSLL). Já incluso via exclusões LALUR.
        total: totalEconomias,
        // ═══ CORREÇÃO #8: Separar economias realizadas vs oportunidade ═══
        realizadas: economiasRealizadas,
        oportunidade: economiasOportunidade,
        tipoGratificacao: "OPORTUNIDADE",
        tipoPDD: "OPORTUNIDADE"
      },

      // ═══ CORREÇÃO #5/#9: Resultados com JCP deduzido ═══
      jcpDedutivel: jcpDedutivel,
      irpjComJCP: (jcpDedutivel > 0 && irpjComJCP) ? irpjComJCP : null,
      csllComJCP: (jcpDedutivel > 0 && csllComJCP) ? csllComJCP : null,
      cargaBrutaComJCP: cargaBrutaComJCP,

      // Seção 7: Oportunidades
      oportunidades: oportunidades,

      // Seção 8: Trimestral vs Anual
      comparativoApuracao: {
        trimestral: simTrimestral,
        anual: simAnual,
        suspensao: simSuspensao,
        recomendacao: recomendacao
      },

      // Seção 9: Cenários
      cenarios: cenarios,
      projecao: projecao,

      // Seção 10: Fluxo de caixa
      fluxoCaixa: fluxoCaixa,

      // Demais seções
      jcpDetalhado: jcpResult,
      compensacao: compensacao,
      vedacoes: vedacoes,
      depreciacaoDetalhada: depreciacaoResult,
      retencoes: {
        irrf: totalIRRF,
        pis: _n(d.pisRetido),
        cofins: _n(d.cofinsRetido),
        csll: _n(d.csllRetido),
        iss: _n(d.issRetido),
        total: totalRetencoes
      },
      retencoesCompensadas: retencoesResult,
      saldoNegativo: saldoNegResult,
      sudamDetalhado: sudamResult,
      incentivosFiscais: incentivosFiscais,
      cprb: cprbResult,
      obrigatoriedade: obrigatoriedade,
      obrigacoes: obrigacoes,
      darfs: darfs,
      alertas: alertas,

      // Novos resultados — PARTE 2
      validacaoDespesasLimites: validacaoDespesasLimites,
      despesasIndedutivelDetalhe: despesasIndedutivelDetalhe,
      subcapResult: subcapResult,
      omissaoResult: omissaoResult,
      lucroExploracaoResult: lucroExploracaoResult,
      goodwillResult: goodwillResult,
      exaustaoResult: exaustaoResult,
      preOperacionalResult: preOperacionalResult,
      recomendacaoRegime: recomendacaoRegime,

      // Novos resultados — PARTE 5
      relatorioConsolidado: relatorioConsolidado,
      arvoreDecisao: arvoreDecisao,
      elegibilidade: elegibilidade,
      retencoesAnuais: retencoesAnuais,
      comparativoSUDAM: comparativoSUDAM,

      // Novos resultados — BLOCO H (Acréscimos Moratórios)
      acrescimosMoratorios: acrescimosMoratoriosResult,
      multaOficio: multaOficioResult,
      prazoEspontaneo: prazoEspontaneoResult,
      suspensaoMulta: suspensaoMultaResult,

      // Novos resultados — BLOCO I (PER/DCOMP)
      compensacaoPERDCOMP: compensacaoPERDCOMPResult,
      compensacaoJudicial: compensacaoJudicialResult
    };

    // ── CORREÇÃO BUG-02 (parte 2): Revalidar resumo.economiaTotal a partir do objeto economia ──
    // Garante que o KPI "Economia Total Identificada" sempre reflete a soma real dos componentes
    var _ecoObj = resultados.economia;
    var _ecoResum = _r(
      (_ecoObj.jcp || 0) + (_ecoObj.prejuizo || 0) + (_ecoObj.sudam || 0) +
      (_ecoObj.incentivos || 0) + (_ecoObj.depreciacao || 0) + (_ecoObj.pisCofinsCreditos || 0) +
      (_ecoObj.cprb || 0) + (_ecoObj.pddFiscal || 0) + (_ecoObj.gratificacao || 0)
    );
    if (_ecoResum > 0 && (resultados.resumo.economiaTotal || 0) === 0) {
      resultados.resumo.economiaTotal = _ecoResum;
      resultados.economia.total = _ecoResum;
      console.warn('[IMPOST] BUG-02 safety (passo 2): resumo.economiaTotal corrigido para ' + _ecoResum);
    } else if (_ecoResum > 0 && Math.abs(resultados.resumo.economiaTotal - _ecoResum) > 1) {
      // Se divergência > R$1, usar o recalculado (mais confiável)
      resultados.resumo.economiaTotal = _ecoResum;
      resultados.economia.total = _ecoResum;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 28 — Cache
    // ═══════════════════════════════════════════════════════════════════════
    resultadosCache = resultados;

    // MELHORIA #3: Congelar sub-objetos críticos para detectar mutações posteriores
    // Em strict mode, qualquer tentativa de mutação gerará TypeError (facilita debug)
    if (typeof Object.freeze === 'function') {
      try {
        Object.freeze(resultados.resumo);
        Object.freeze(resultados.composicao);
        Object.freeze(resultados.economia);
      } catch(e) { /* ignora em browsers antigos */ }
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 29 — Salvar localStorage
    // ═══════════════════════════════════════════════════════════════════════
    try {
      localStorage.setItem(LS_KEY_RESULTADOS, JSON.stringify(resultados));
    } catch (e) { /* ignora se exceder quota */ }

    // ═══════════════════════════════════════════════════════════════════════
    //  PASSO 30 — Renderizar resultados
    // ═══════════════════════════════════════════════════════════════════════
    renderResultados(resultados);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS
  // ═══════════════════════════════════════════════════════════════════════════

  function _validarObrigatorios() {
    var d = dadosEmpresa;
    var erros = [];
    if (!d.razaoSocial || !d.razaoSocial.trim()) erros.push("Razão Social (Etapa 0)");
    if (!d.uf) erros.push("UF (Etapa 0)");
    if (!d.municipio) erros.push("Município (Etapa 0)");
    if (!d.tipoAtividade) erros.push("Tipo de Atividade (Etapa 0)");
    if (!d.apuracaoLR) erros.push("Forma de Apuração (Etapa 0)");
    var rb = _n(d.receitaBrutaAnual);
    // Tentar somar meses se preencheu mês a mês
    if (rb <= 0 && (d.preencherMesAMes === true || d.preencherMesAMes === "true")) {
      var somaMes = 0;
      for (var m = 1; m <= 12; m++) somaMes += _n(d["receitaMes" + m]);
      if (somaMes > 0) rb = somaMes;
    }
    if (rb <= 0) erros.push("Receita Bruta Anual (Etapa 1)");
    // Pelo menos um campo de custo/despesa
    if (_calcTotalCustos() + _calcTotalDespesas() <= 0) {
      erros.push("Pelo menos um campo de custo ou despesa (Etapa 2)");
    }
    return erros;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  VALIDAÇÃO CRUZADA (alertas amarelos)
  // ═══════════════════════════════════════════════════════════════════════════

  function _validacaoCruzada() {
    var d = dadosEmpresa;
    var alertas = [];
    var rb = _n(d.receitaBrutaAnual);
    var ll = _calcLL();
    var margem = rb > 0 ? (ll / rb * 100) : 0;
    var custoTotal = _calcTotalCustos() + _calcTotalDespesas();
    var numFunc = parseInt(d.numFuncionarios) || 0;
    var folha = _n(d.folhaPagamentoAnual);
    var plVal = _calcPL();
    var totalRet = _n(d.irrfRetidoPrivado) + _n(d.irrfRetidoPublico) + _n(d.pisRetido) + _n(d.cofinsRetido) + _n(d.csllRetido);
    var issAliq = _n(d.issAliquota);
    var pf = _n(d.prejuizoFiscal);

    if (ll > rb && rb > 0) {
      alertas.push({ tipo: "aviso", msg: "Lucro informado é MAIOR que a receita — verifique os dados" });
    }
    if (ll < 0 && pf === 0) {
      alertas.push({ tipo: "aviso", msg: "Prejuízo contábil mas sem prejuízo fiscal informado — confirme" });
    }
    if (margem > 50 && d.tipoAtividade === "COMERCIO_INDUSTRIA") {
      alertas.push({ tipo: "aviso", msg: "Margem > 50% para comércio é incomum — confirme" });
    }
    if (margem > 80) {
      alertas.push({ tipo: "aviso", msg: "Margem > 80% é atípica — verifique custos e despesas" });
    }
    if (custoTotal === 0 && rb > 0) {
      alertas.push({ tipo: "aviso", msg: "Nenhum custo informado — o estudo pode ficar impreciso" });
    }
    if (folha === 0 && numFunc > 0) {
      alertas.push({ tipo: "aviso", msg: "Tem " + numFunc + " funcionários mas folha de pagamento = R$ 0" });
    }
    if (plVal > 0 && ll > 0 && !(_n(d.tjlp) > 0)) {
      alertas.push({ tipo: "economia", msg: "Há economia de JCP não aproveitada — informe a TJLP" });
    }
    if (totalRet > 0) {
      // IRPJ+CSLL estimados para comparação (IRPJ marginal correto)
      var _laEst = Math.max(_calcLucroAjustado(), 0);
      var irpjEst = _irpj(_laEst);
      var csllEst = _r(_laEst * 0.09);
      if (totalRet > irpjEst + csllEst && irpjEst + csllEst > 0) {
        alertas.push({ tipo: "info", msg: "Retenções excedem imposto estimado — pode gerar saldo negativo (PER/DCOMP)" });
      }
    }
    if ((d.atividadeMista === true || d.atividadeMista === "true") && !_n(d.percentReceitaSecundaria)) {
      alertas.push({ tipo: "aviso", msg: "Atividade mista selecionada mas sem % de receita secundária" });
    }
    if (window.MunicipiosIBGE && issAliq > 0) {
      if (issAliq < (window.MunicipiosIBGE.ISS_MIN || 2) || issAliq > (window.MunicipiosIBGE.ISS_MAX || 5)) {
        alertas.push({ tipo: "aviso", msg: "Alíquota ISS (" + issAliq + "%) fora dos limites legais (2% a 5%)" });
      }
    }

    // ═══ PARTE 5D — Validações cruzadas aprimoradas ═══
    if ((d.ehInstituicaoFinanceira === true || d.ehInstituicaoFinanceira === "true") && d.tipoAtividade !== "INSTITUICOES_FINANCEIRAS") {
      alertas.push({ tipo: "aviso", msg: "Instituição financeira marcada — CSLL deve ser 15% (não 9%). Verifique se alíquota está correta." });
    }
    if ((d.atividadeRural === true || d.atividadeRural === "true") && pf > 0) {
      alertas.push({ tipo: "info", msg: "Atividade rural com prejuízo fiscal — compensação é integral (sem trava de 30%). Art. 583 RIR/2018." });
    }
    if (d.tipoReorganizacao && d.tipoReorganizacao !== "NENHUMA" && pf > 0) {
      alertas.push({ tipo: "aviso", msg: "Reorganização societária (" + d.tipoReorganizacao + ") com prejuízo fiscal — compensação pode ser vedada (Art. 584-585 RIR/2018)." });
    }
    if (d.ehSCP === true || d.ehSCP === "true") {
      alertas.push({ tipo: "aviso", msg: "Sociedade em Conta de Participação (SCP) — prejuízo de SCP não compensa com ostensivo e vice-versa (Art. 586 RIR/2018)." });
    }
    if ((_n(d.doacoesOperacionais) + _n(d.doacoesOSCIP)) > 0 && ll <= 0) {
      alertas.push({ tipo: "aviso", msg: "Doações informadas mas exercício com prejuízo operacional — doações não são dedutíveis quando não há lucro operacional." });
    }
    if (rb > 78000000) {
      alertas.push({ tipo: "info", msg: "Receita bruta > R$ 78 milhões — empresa OBRIGATORIAMENTE no Lucro Real (Art. 257, I do RIR/2018)." });
    }
    if (d.regimeCambial === "COMPETENCIA" && _n(d.receitasExteriorAnual) === 0) {
      alertas.push({ tipo: "aviso", msg: "Regime cambial por competência selecionado mas sem operações em moeda estrangeira declaradas. Verifique se a opção é necessária." });
    }

    return alertas;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  DETECTOR DE 22 OPORTUNIDADES
  // ═══════════════════════════════════════════════════════════════════════════

  function _detectarOportunidades(d, ctx) {
    var ops = [];

    // #1 — JCP
    if (ctx.plVal > 0 && ctx.lucroLiquido > 0 && ctx.jcpResult && ctx.jcpResult.economiaLiquida > 0) {
      ops.push({
        id: "JCP", titulo: "Juros sobre Capital Próprio",
        tipo: "Dedução", complexidade: "Baixa", risco: "Baixo",
        economiaAnual: ctx.jcpResult.economiaLiquida,
        descricao: "JCP dedutível de " + _m(ctx.jcpResult.jcpDedutivel) + " gera economia líquida de " + _m(ctx.jcpResult.economiaLiquida) + "/ano (34% de economia - 17,5% IRRF — LC 224/2025).",
        baseLegal: "Art. 355-358 do RIR/2018",
        acaoRecomendada: "Deliberar distribuição de JCP aos sócios. Formalizar via ata e pagar IRRF (DARF 5706).",
        prazoImplementacao: "Imediato",
        detalhes: ctx.jcpResult
      });
    }

    // #2 — Prejuízo Fiscal
    if (_n(d.prejuizoFiscal) > 0 && ctx.lucroAjustado > 0 && ctx.compensacao) {
      // CORREÇÃO FALHA #4: incluir economia IRPJ + CSLL quando não há card #3 separado.
      // Se há base negativa CSLL separada, card #2 fica apenas IRPJ para evitar duplicação.
      var _temBaseNeg = _n(d.baseNegativaCSLL) > 0;
      var econPrej;
      if (_temBaseNeg) {
        // Cards separados: #2 = IRPJ, #3 = CSLL
        econPrej = ctx.compensacao.resumo ? _n(ctx.compensacao.resumo.economia.irpj) : 0;
      } else {
        // Sem card #3: incluir tudo em #2
        econPrej = ctx.compensacao.resumo ? (ctx.compensacao.resumo.economia.total || (_n(ctx.compensacao.resumo.economia.irpj) + _n(ctx.compensacao.resumo.economia.csll))) : 0;
      }
      if (econPrej > 0) {
        var _descrPrej = _temBaseNeg
          ? "Prejuízo fiscal acumulado de " + _m(_n(d.prejuizoFiscal)) + " permite compensar até 30% do lucro ajustado, economizando " + _m(econPrej) + " em IRPJ."
          : "Prejuízo fiscal acumulado de " + _m(_n(d.prejuizoFiscal)) + " permite compensar até 30% do lucro ajustado, economizando " + _m(econPrej) + " em IRPJ+CSLL.";
        ops.push({
          id: "PREJUIZO_FISCAL", titulo: "Compensação de Prejuízo Fiscal",
          tipo: "Compensação", complexidade: "Baixa", risco: "Baixo",
          economiaAnual: econPrej,
          descricao: _descrPrej,
          baseLegal: "Art. 579-586 do RIR/2018",
          acaoRecomendada: "Manter controle na Parte B do LALUR/LACS. Verificar vedações de compensação.",
          prazoImplementacao: "Imediato",
          detalhes: ctx.compensacao.resumo
        });
      }
    }

    // #3 — Base Negativa CSLL
    if (_n(d.baseNegativaCSLL) > 0 && ctx.lucroAjustado > 0 && ctx.compensacao) {
      var econCSLL = ctx.compensacao.resumo ? ctx.compensacao.resumo.economia.csll : 0;
      if (econCSLL > 0) {
        ops.push({
          id: "BASE_NEGATIVA_CSLL", titulo: "Compensação de Base Negativa CSLL",
          tipo: "Compensação", complexidade: "Baixa", risco: "Baixo",
          economiaAnual: econCSLL,
          descricao: "Base negativa de " + _m(_n(d.baseNegativaCSLL)) + " permite compensar até 30% da base de CSLL, economizando " + _m(econCSLL) + ".",
          baseLegal: "Art. 580-586 do RIR/2018",
          acaoRecomendada: "Manter controle no LACS. Verificar vedações.",
          prazoImplementacao: "Imediato",
          detalhes: {}
        });
      }
    }

    // #4 — SUDAM 75% (com projeto)
    if (ctx.isSUDAM && ctx.temProjetoSUDAM && ctx.sudamResult && ctx.sudamResult.resumo) {
      var econSudam = ctx.sudamResult.resumo.economiaReducao75 || 0;
      if (econSudam > 0) {
        ops.push({
          id: "SUDAM_75", titulo: "Redução 75% IRPJ — SUDAM",
          tipo: "Redução", complexidade: "Média", risco: "Baixo",
          economiaAnual: econSudam,
          descricao: "Projeto SUDAM aprovado permite reduzir 75% do IRPJ sobre o lucro da exploração, economizando " + _m(econSudam) + "/ano.",
          baseLegal: "Art. 627-637 do RIR/2018",
          acaoRecomendada: "Manter laudo constitutivo e reconhecimento da SRF atualizados.",
          prazoImplementacao: "Imediato",
          detalhes: ctx.sudamResult.resumo
        });
      }
    }

    // #5 — SUDENE 75% (com projeto)
    if (ctx.isSUDENE && ctx.temProjetoSUDAM && ctx.sudamResult && ctx.sudamResult.resumo) {
      var econSudene = ctx.sudamResult.resumo.economiaReducao75 || 0;
      if (econSudene > 0) {
        ops.push({
          id: "SUDENE_75", titulo: "Redução 75% IRPJ — SUDENE",
          tipo: "Redução", complexidade: "Média", risco: "Baixo",
          economiaAnual: econSudene,
          descricao: "Projeto SUDENE aprovado permite reduzir 75% do IRPJ sobre o lucro da exploração, economizando " + _m(econSudene) + "/ano.",
          baseLegal: "Art. 627-637 do RIR/2018",
          acaoRecomendada: "Manter laudo constitutivo e reconhecimento da SRF atualizados.",
          prazoImplementacao: "Imediato",
          detalhes: ctx.sudamResult.resumo
        });
      }
    }

    // #6 — SUDAM/SUDENE potencial (sem projeto)
    if ((ctx.isSUDAM || ctx.isSUDENE) && !ctx.temProjetoSUDAM && ctx.lucroRealFinal > 0) {
      var nomeSup = ctx.isSUDAM ? "SUDAM" : "SUDENE";
      var econPotencial = _r(ctx.irpjNormalPrevia * 0.75);
      if (econPotencial > 500) {
        ops.push({
          id: ctx.isSUDAM ? "SUDAM_POTENCIAL" : "SUDENE_POTENCIAL",
          titulo: "Potencial: Projeto " + nomeSup + " (sem projeto aprovado)",
          tipo: "Potencial", complexidade: "Alta", risco: "Médio",
          economiaAnual: econPotencial,
          descricao: "A empresa está em área " + nomeSup + " mas NÃO tem projeto aprovado. Economia potencial de até " + _m(econPotencial) + "/ano com redução de 75% do IRPJ.",
          baseLegal: "Art. 627-637 do RIR/2018",
          acaoRecomendada: "Consultar contador especializado para elaboração e protocolo do projeto junto à superintendência regional.",
          prazoImplementacao: "6 meses",
          detalhes: {}
        });
      }
    }

    // #7 — Créditos PIS/COFINS
    if (ctx.baseCreditos > 0 && ctx.pisCofinsResult) {
      var econPC = ctx.pisCofinsResult.economiaCreditos || _r((ctx.pisCofinsResult.creditoPIS || 0) + (ctx.pisCofinsResult.creditoCOFINS || 0));
      if (econPC > 0) {
        ops.push({
          id: "CREDITOS_PIS_COFINS", titulo: "Créditos de PIS/COFINS Não-Cumulativo",
          tipo: "Crédito", complexidade: "Baixa", risco: "Baixo",
          economiaAnual: econPC,
          descricao: "Créditos sobre insumos de " + _m(ctx.baseCreditos) + " geram economia de " + _m(econPC) + " em PIS/COFINS. Alíquota efetiva: " + (ctx.pisCofinsResult.aliquotaEfetiva || "—"),
          baseLegal: "Lei 10.637/2002 + Lei 10.833/2003, Art. 3º",
          acaoRecomendada: "Mapear todos os insumos elegíveis. Revisar classificação de despesas.",
          prazoImplementacao: "Imediato",
          detalhes: ctx.pisCofinsResult
        });
      }
    }

    // #8 — Depreciação acelerada por turnos
    var turnosVal = parseInt(d.turnosOperacao) || 1;
    if (turnosVal > 1 && ctx.depreciacaoResult.depreciaNormal > 0) {
      var econTurnos = _r((ctx.depreciacaoResult.depreciaAcelerada - ctx.depreciacaoResult.depreciaNormal) * 0.34);
      if (econTurnos > 0) {
        ops.push({
          id: "DEPRECIACAO_TURNOS", titulo: "Depreciação Acelerada por Turnos",
          tipo: "Dedução", complexidade: "Baixa", risco: "Baixo",
          economiaAnual: econTurnos,
          descricao: "Operação em " + turnosVal + " turnos permite depreciação acelerada (×" + ctx.depreciacaoResult.multiplicador + "), economia fiscal de " + _m(econTurnos) + ".",
          baseLegal: "Art. 323 do RIR/2018",
          acaoRecomendada: "Documentar turnos de operação. Manter controles de horas trabalhadas.",
          prazoImplementacao: "Imediato",
          detalhes: {}
        });
      }
    }

    // #9 — Depreciação incentivada SUDAM/SUDENE
    if ((ctx.isSUDAM || ctx.isSUDENE) && _n(d.valorBensNovos) > 0) {
      var econDepInc = _r(_n(d.valorBensNovos) * 0.34);
      ops.push({
        id: "DEPRECIACAO_INCENTIVADA", titulo: "Depreciação Incentivada SUDAM/SUDENE (100%)",
        tipo: "Dedução", complexidade: "Média", risco: "Baixo",
        economiaAnual: econDepInc,
        descricao: "Bens novos de " + _m(_n(d.valorBensNovos)) + " podem ser depreciados integralmente no ano de aquisição, economia de " + _m(econDepInc) + ".",
        baseLegal: "Art. 329 do RIR/2018",
        acaoRecomendada: "Registrar bens como novos e vincular ao projeto SUDAM/SUDENE.",
        prazoImplementacao: "Imediato",
        detalhes: {}
      });
    }

    // #10 — Bens de pequeno valor
    if (_n(d.bensSmallValue) > 0) {
      var econSmall = _r(_n(d.bensSmallValue) * 0.34);
      ops.push({
        id: "BENS_PEQUENO_VALOR", titulo: "Dedução Integral de Bens de Pequeno Valor",
        tipo: "Dedução", complexidade: "Baixa", risco: "Baixo",
        economiaAnual: econSmall,
        descricao: "Bens ≤ R$ 1.200 podem ser deduzidos integralmente como despesa, economia de " + _m(econSmall) + ".",
        baseLegal: "Art. 313, §1º do RIR/2018",
        acaoRecomendada: "Classificar bens de pequeno valor como despesa operacional direta.",
        prazoImplementacao: "Imediato",
        detalhes: {}
      });
    }

    // #11-15 — Incentivos não usados (PAT, FIA, Fundo Idoso, Rouanet, Esporte)
    var incentivosNaoUsados = [
      { id: "PAT_NAO_USADO", campo: "usaPAT", nome: "PAT — Programa de Alimentação do Trabalhador", limite: 0.04 },
      { id: "FIA_NAO_USADO", campo: "usaFIA", nome: "FIA — Fundo da Infância e Adolescência", limite: 0.01 },
      { id: "FUNDO_IDOSO_NAO_USADO", campo: "usaFundoIdoso", nome: "Fundo do Idoso", limite: 0.01 },
      { id: "ROUANET_NAO_USADA", campo: "usaRouanet", nome: "Lei Rouanet — Cultura", limite: 0.04 },
      { id: "ESPORTE_NAO_USADO", campo: "usaEsporte", nome: "Lei do Esporte", limite: 0.01 }
    ];
    incentivosNaoUsados.forEach(function (inc) {
      var usado = d[inc.campo] === true || d[inc.campo] === "true";
      if (!usado && ctx.irpjNormalPrevia > 0) {
        var potencial = _r(ctx.irpjNormalPrevia * inc.limite);
        if (potencial > 500) {
          ops.push({
            id: inc.id, titulo: inc.nome + " (não utilizado)",
            tipo: "Dedução", complexidade: "Média", risco: "Baixo",
            economiaAnual: potencial,
            descricao: "O incentivo " + inc.nome + " permite deduzir até " + _m(potencial) + " do IRPJ normal. ⚠️ Sujeito ao limite combinado de 4% do IRPJ Normal (Art. 228 RIR/2018) caso outros incentivos sejam utilizados simultaneamente.",
            baseLegal: "Art. 625-646 do RIR/2018",
            acaoRecomendada: "Avaliar adesão ao programa e realizar doações/investimentos dentro do período.",
            prazoImplementacao: "90 dias",
            detalhes: {}
          });
        }
      }
    });

    // ALERTA #5 — Limite combinado de 4% para incentivos fiscais (Art. 228 RIR/2018)
    (function() {
      var qtdIncentivosNaoUsados = incentivosNaoUsados.filter(function(inc) {
        return !(d[inc.campo] === true || d[inc.campo] === 'true');
      }).length;
      if (qtdIncentivosNaoUsados >= 2 && ctx.irpjNormalPrevia > 0) {
        var limiteCombinado = _r(ctx.irpjNormalPrevia * 0.04);
        ops.push({
          id: 'INCENTIVOS_LIMITE_COMBINADO',
          titulo: '⚠️ Atenção — Limite Combinado de Incentivos Fiscais',
          tipo: 'Alerta',
          complexidade: 'Baixa',
          risco: 'Alto',
          economiaAnual: 0,
          descricao: 'Os incentivos PAT, Lei Rouanet, FIA, Fundo do Idoso e Lei do Esporte têm limite ' +
            'COMBINADO de 4% do IRPJ Normal (Art. 228 do RIR/2018). O total máximo aproveitável ' +
            'para este período é de ' + _m(limiteCombinado) + '. ' +
            'Não é possível somar os limites individuais de cada incentivo — o teto global é único.',
          baseLegal: 'Art. 228 do RIR/2018 (Decreto 9.580/2018); IN RFB 1.700/2017',
          acaoRecomendada: 'Planejar quais incentivos priorizar dentro do teto de ' + _m(limiteCombinado) +
            ' (4% do IRPJ Normal). Recomenda-se consultar contador para otimizar a combinação.',
          prazoImplementacao: 'Antes do fechamento do período',
          detalhes: { limiteCombinado: limiteCombinado, irpjNormal: ctx.irpjNormalPrevia }
        });
      }
    })();


    // #16 — Lei do Bem (P&D)
    if ((d.investePD === true || d.investePD === "true") && _n(d.valorPD) > 0) {
      var econPD = _r(_n(d.valorPD) * 0.60 * 0.34);
      ops.push({
        id: "LEI_BEM_PD", titulo: "Lei do Bem — Pesquisa & Desenvolvimento",
        tipo: "Exclusão", complexidade: "Média", risco: "Baixo",
        economiaAnual: econPD,
        descricao: "Investimento em P&D de " + _m(_n(d.valorPD)) + " permite exclusão de 60% da base de IRPJ/CSLL, economia de " + _m(econPD) + ".",
        baseLegal: "Lei 11.196/2005 (Lei do Bem)",
        acaoRecomendada: "Manter documentação de projetos de P&D. Enviar relatório ao MCTI.",
        prazoImplementacao: "30 dias",
        detalhes: {}
      });
    }

    // #17 — Converter gratificação em pró-labore
    if ((d.temGratificacaoAdm === true || d.temGratificacaoAdm === "true") && _n(d.gratificacoesAdm) > 0) {
      var econGrat = _r(_n(d.gratificacoesAdm) * 0.34);
      ops.push({
        id: "CONVERTER_GRATIFICACAO", titulo: "Converter Gratificação de Administradores em Pró-labore",
        tipo: "Dedução", complexidade: "Baixa", risco: "Baixo",
        economiaAnual: econGrat,
        descricao: "Gratificação de " + _m(_n(d.gratificacoesAdm)) + " é indedutível. Convertendo em pró-labore, economia de " + _m(econGrat) + " (passa a ser dedutível).",
        baseLegal: "Art. 358, §1º do RIR/2018",
        acaoRecomendada: "Alterar contrato social. Formalizar pró-labore mensal com folha de pagamento.",
        prazoImplementacao: "30 dias",
        detalhes: {}
      });
    }

    // #18 — Retenções a compensar
    if (ctx.totalIRRF + ctx.totalCSRF > 0 && ctx.retencoesResult) {
      var compRetTotal = ctx.retencoesResult.compensacao ? ctx.retencoesResult.compensacao.totalCompensado : 0;
      if (compRetTotal > 0) {
        ops.push({
          id: "RETENCOES_COMPENSAR", titulo: "Retenções na Fonte Compensáveis",
          tipo: "Compensação", complexidade: "Baixa", risco: "Baixo",
          economiaAnual: compRetTotal,
          descricao: "Total de " + _m(ctx.totalIRRF + ctx.totalCSRF) + " em retenções sofridas, " + _m(compRetTotal) + " compensáveis diretamente com tributos devidos.",
          baseLegal: "Art. 717 (IRRF); Lei 10.833/2003, art. 36 (CSRF)",
          acaoRecomendada: "Manter controle detalhado de notas fiscais com retenções. Escriturar na EFD-Reinf.",
          prazoImplementacao: "Imediato",
          detalhes: ctx.retencoesResult
        });
      }
    }

    // #19 — Saldo negativo
    if (ctx.saldoNegResult && ctx.saldoNegResult.temSaldoNegativo) {
      ops.push({
        id: "SALDO_NEGATIVO", titulo: "Saldo Negativo de IRPJ — Restituição/Compensação",
        tipo: "Compensação", complexidade: "Média", risco: "Baixo",
        economiaAnual: ctx.saldoNegResult.valorOriginal,
        descricao: "Retenções + estimativas excedem o IRPJ devido em " + _m(ctx.saldoNegResult.valorOriginal) + ". Pode ser compensado via PER/DCOMP ou pedido de restituição.",
        baseLegal: "Art. 235 do RIR/2018",
        acaoRecomendada: "Transmitir PER/DCOMP para compensar com outros tributos federais. Prazo decadencial: 5 anos.",
        prazoImplementacao: "30 dias",
        detalhes: ctx.saldoNegResult
      });
    }

    // #20 — Crédito sobre estoque de abertura
    if (_n(d.creditoEstoqueAbertura) > 0) {
      var econEstoque = _r(_n(d.creditoEstoqueAbertura) * 0.0925);
      ops.push({
        id: "ESTOQUE_ABERTURA", titulo: "Crédito sobre Estoque de Abertura (Migração)",
        tipo: "Crédito", complexidade: "Média", risco: "Baixo",
        economiaAnual: econEstoque,
        descricao: "Crédito de PIS/COFINS sobre estoque de " + _m(_n(d.creditoEstoqueAbertura)) + " na migração para Lucro Real, " + _m(econEstoque) + "/ano (1/12 por mês).",
        baseLegal: "Art. 12 da Lei 10.637/2002",
        acaoRecomendada: "Levantar inventário na data da migração. Apropriar 1/12 por mês durante 12 meses.",
        prazoImplementacao: "Imediato",
        detalhes: {}
      });
    }

    // #21 — Reinvestimento 30% (SUDAM/SUDENE)
    if (ctx.temProjetoSUDAM && (d.usarReinvestimento30 === true || d.usarReinvestimento30 === "true") && ctx.sudamResult && ctx.sudamResult.resumo) {
      var econReinv = ctx.sudamResult.resumo.economiaReinvestimento30 || 0;
      if (econReinv > 0) {
        ops.push({
          id: "REINVESTIMENTO_30", titulo: "Reinvestimento 30% IRPJ — SUDAM/SUDENE",
          tipo: "Redução", complexidade: "Média", risco: "Baixo",
          economiaAnual: econReinv,
          descricao: "Depósito de 30% do IRPJ sobre lucro da exploração em banco oficial, economia de " + _m(econReinv) + ". 50% pode ser usado como capital de giro.",
          baseLegal: "Lei 13.799/2019",
          acaoRecomendada: "Efetuar depósito no banco oficial da superintendência. Vincular ao projeto aprovado.",
          prazoImplementacao: "30 dias",
          detalhes: {}
        });
      }
    }

    // #22 — PDD Fiscal
    // ═══ FIX BUG #5: Usar alíquotas efetivas (consistente com pddFiscalInfo) em vez de 34% fixo ═══
    var totalPDDOp = _n(d.perdasCreditos6Meses) + _n(d.perdasCreditosJudicial) + _n(d.perdasCreditosFalencia);
    if (totalPDDOp > 0) {
      // Usar alíquotas efetivas do contexto (se disponíveis), senão fallback 34%
      var _aliqIRPJCtx = ctx.aliqEfetIRPJ || 0.15;
      var _aliqCSLLCtx = ctx.aliqEfetCSLL || 0.09;
      var econPDDOp = _r(totalPDDOp * (_aliqIRPJCtx + _aliqCSLLCtx));
      var aliqPDDUsada = _r((_aliqIRPJCtx + _aliqCSLLCtx) * 100);
      ops.push({
        id: "PDD_FISCAL", titulo: "PDD Fiscal — Perdas no Recebimento de Créditos",
        tipo: "Exclusão", complexidade: "Baixa", risco: "Baixo",
        economiaAnual: econPDDOp,
        economia: econPDDOp, // alias para compatibilidade (FIX BUG #6)
        descricao: "Perdas totais de " + _m(totalPDDOp) + " podem ser excluídas do lucro real, gerando economia de " + _m(econPDDOp) + " (" + _pp(aliqPDDUsada) + " alíquota efetiva IRPJ+CSLL).",
        baseLegal: "Art. 340-342 do RIR/2018 (Decreto 9.580/2018)",
        acaoRecomendada: "Manter documentação comprobatória: protestos, ajuizamento de ações, sentença de falência. Controlar na Parte A do LALUR.",
        prazoImplementacao: "Imediato",
        detalhes: {
          creditos6Meses: _n(d.perdasCreditos6Meses),
          creditosJudicial: _n(d.perdasCreditosJudicial),
          creditosFalencia: _n(d.perdasCreditosFalencia),
        }
      });
    }

    // #23 — CPRB (Desoneração da Folha)
    var cnaePriStr = (d.cnaePrincipal || "").replace(/[\s\-\/]/g, "");
    var elegCPRB = cnaePriStr.substring(0, 2) === "62" || d._cprbSugerida;
    if (elegCPRB && !(d.optouCPRB === true || d.optouCPRB === "true")) {
      var folhaCPRBPot = _n(d.folhaPagamentoAnual) || (_n(d.salariosBrutos) + _n(d.proLabore));
      var cppPot = _r(folhaCPRBPot * 0.20);
      var cprbPot = _r((_n(d.receitaBrutaAnual) || 0) * 0.045);
      var econCPRBPot = _r(cppPot - cprbPot);
      if (econCPRBPot > 0) {
        ops.push({
          id: "CPRB_POTENCIAL", titulo: "CPRB — Desoneração da Folha (não optada)",
          tipo: "Potencial", complexidade: "Baixa", risco: "Baixo",
          economiaAnual: econCPRBPot,
          descricao: "Empresa de TI elegível à CPRB. Alíquota de 4,5% sobre receita bruta em vez de 20% sobre folha. Economia potencial de " + _m(econCPRBPot) + "/ano.",
          baseLegal: "Lei 12.546/2011",
          acaoRecomendada: "Avaliar opção pela CPRB na Etapa 5 do wizard. A opção é feita via GFIP/eSocial no início do ano.",
          prazoImplementacao: "Imediato (início do ano-calendário)",
          detalhes: {}
        });
      }
    }

    // #23 — Pró-labore como dedução
    if ((parseInt(d.numSocios) || 0) > 0 && _n(d.proLabore) > 0) {
      var econProLabore = _r(_n(d.proLabore) * 0.34);
      ops.push({
        id: "PROLABORE_DEDUCAO", titulo: "Pró-labore dos Sócios como Despesa Dedutível",
        tipo: "Dedução", complexidade: "Baixa", risco: "Baixo",
        economiaAnual: econProLabore,
        descricao: "Pró-labore de " + _m(_n(d.proLabore)) + "/ano é despesa 100% dedutível no Lucro Real, gerando economia de " + _m(econProLabore) + ".",
        baseLegal: "Art. 357 do RIR/2018",
        acaoRecomendada: "Formalizar pró-labore em folha de pagamento. Recolher INSS e IRRF na fonte.",
        prazoImplementacao: "Imediato",
        detalhes: {}
      });
    }

    // #24 — Previdência Complementar (não usada)
    var usaPrevidCompl = d.usaPrevidenciaComplementar === true || d.usaPrevidenciaComplementar === "true";
    if (!usaPrevidCompl && ctx.folhaPagamento > 0 && ctx.lucroRealFinal > 0) {
      var limPrevidCompl = _r(ctx.folhaPagamento * 0.20);
      var econPrevidCompl = _r(limPrevidCompl * 0.34);
      if (econPrevidCompl > 500) {
        ops.push({
          id: "PREVIDENCIA_COMPLEMENTAR", titulo: "Previdência Complementar Patronal (não utilizada)",
          tipo: "Dedução", complexidade: "Média", risco: "Baixo",
          economiaAnual: econPrevidCompl,
          descricao: "Contribuição patronal para previdência complementar de até " + _m(limPrevidCompl) + " (20% da folha) é dedutível, gerando economia fiscal de até " + _m(econPrevidCompl) + ".",
          baseLegal: "Art. 369, §1º do RIR/2018",
          acaoRecomendada: "Contratar plano de previdência complementar empresarial. Benefício para retenção de talentos.",
          prazoImplementacao: "60 dias",
          detalhes: { limiteAnual: limPrevidCompl, economiaFiscal: econPrevidCompl }
        });
      }
    }

    // #25 — PDD Fiscal (oportunidade proativa — quando NÃO há PDD declarada)
    var temCreditosVencidos = _n(d.creditosVencidos6Meses) > 0 || _n(d.inadimplenciaAnual) > 0;
    var jaPddUsada = _n(d.perdasCreditos6Meses) + _n(d.perdasCreditosJudicial) + _n(d.perdasCreditosFalencia);
    if (!temCreditosVencidos && jaPddUsada === 0 && ctx.receitaBruta > 500000) {
      ops.push({
        id: "PDD_PROATIVA", titulo: "Revisão de PDD — Provisão para Devedores Duvidosos",
        tipo: "Dedução", complexidade: "Média", risco: "Baixo",
        economiaAnual: 0,
        descricao: "Nenhuma PDD fiscal informada. Empresas com receita acima de R$ 500 mil geralmente têm créditos vencidos enquadráveis como PDD fiscal (Art. 340-342). Recomenda-se revisão dos recebíveis.",
        baseLegal: "Art. 340-342 do RIR/2018",
        acaoRecomendada: "Levantar todos os créditos vencidos há mais de 6 meses. Identificar devedores em falência/recuperação judicial. Documentar providências de cobrança.",
        prazoImplementacao: "30 dias",
        detalhes: {}
      });
    }

    // #26 — Compliance/Riscos (se verificarCompliance disponível)
    if (LR.calcular.avancado && LR.calcular.avancado.verificarCompliance) {
      try {
        var compliance = LR.calcular.avancado.verificarCompliance({
          lucroLiquido: ctx.lucroLiquido,
          receitaBruta: ctx.receitaBruta,
          custos: ctx.custosTotais,
          despesas: ctx.despesasTotais
        });
        if (compliance && compliance.alertas && compliance.alertas.length > 0) {
          ops.push({
            id: "COMPLIANCE_ALERTAS", titulo: "Alertas de Compliance Fiscal",
            tipo: "Risco", complexidade: "Alta", risco: "Alto",
            economiaAnual: 0,
            descricao: compliance.alertas.length + " alerta(s) de conformidade identificado(s). Resolução preventiva evita autuações e multas de 75-150%.",
            baseLegal: "Art. 293-300 do RIR/2018",
            acaoRecomendada: "Revisar cada alerta com o contador. Priorizar itens críticos.",
            prazoImplementacao: "Imediato",
            detalhes: compliance
          });
        }
      } catch(e) {}
    }

    // #27 — Lei do Bem NÃO usada (potencial — quando investePD NÃO está marcado)
    var usaLeiBem = d.investePD === true || d.investePD === "true";
    if (!usaLeiBem && ctx.irpjNormalPrevia > 5000) {
      var econLeiBemPotencial = _r(ctx.irpjNormalPrevia * 0.20);
      ops.push({
        id: "LEI_BEM_POTENCIAL", titulo: "Potencial: Lei do Bem — P&D (não utilizada)",
        tipo: "Potencial", complexidade: "Alta", risco: "Médio",
        economiaAnual: econLeiBemPotencial,
        descricao: "Empresas com lucro real podem excluir 60-80% dos gastos com P&D da base de IRPJ/CSLL. Economia potencial de até " + _m(econLeiBemPotencial) + "/ano.",
        baseLegal: "Lei 11.196/2005 (Lei do Bem), Cap. III",
        acaoRecomendada: "Avaliar se a empresa realiza atividades de inovação tecnológica. Consultar MCTI para enquadramento.",
        prazoImplementacao: "6 meses",
        detalhes: {}
      });
    }

    // #28 — Doações com Incentivo Fiscal
    if (ctx.validacaoDespesasLimites && ctx.validacaoDespesasLimites.doacoes && ctx.lucroAjustado > 100000) {
      var limDoacoes = ctx.validacaoDespesasLimites.doacoes;
      var doacoesAtual = _n(d.doacoesOperacionais) + _n(d.doacoesOSCIP);
      var limiteMaxDoacoes = _r((ctx.lucroOperacional || ctx.lucroLiquido) * 0.02);
      var faltaParaLimite = _r(limiteMaxDoacoes - doacoesAtual);
      if (faltaParaLimite > 0) {
        var econDoacoes = _r(faltaParaLimite * 0.34);
        ops.push({
          id: "DOACOES_INCENTIVO", titulo: "Doações com Incentivo Fiscal — Utilizar Limite Completo",
          tipo: "Dedução", complexidade: "Baixa", risco: "Baixo",
          economiaAnual: econDoacoes,
          descricao: "Doações operacionais atuais de " + _m(doacoesAtual) + " estão abaixo do limite de " + _m(limiteMaxDoacoes) + " (2% do lucro operacional). Margem de " + _m(faltaParaLimite) + " gera economia fiscal de " + _m(econDoacoes) + " (34%).",
          baseLegal: "Art. 377-385 do RIR/2018",
          acaoRecomendada: "Realizar doações a entidades civis ou OSCIPs até o limite legal. Obter recibos e manter documentação.",
          prazoImplementacao: "30 dias",
          detalhes: { limiteMaximo: limiteMaxDoacoes, doacoesAtuais: doacoesAtual, margemDisponivel: faltaParaLimite }
        });
      }
    }

    // #29 — Amortização de Goodwill
    if (_n(d.valorGoodwill) > 0 && ctx.goodwillResult) {
      var deducaoGoodwill = ctx.goodwillResult.amortizacaoAnual || _r(_n(d.valorGoodwill) * (12 / 60));
      var econGoodwill = _r(deducaoGoodwill * 0.34);
      ops.push({
        id: "GOODWILL_AMORTIZACAO", titulo: "Amortização de Goodwill — Dedução Fiscal",
        tipo: "Dedução", complexidade: "Média", risco: "Baixo",
        economiaAnual: econGoodwill,
        descricao: "Goodwill de " + _m(_n(d.valorGoodwill)) + " amortizado em 1/60 avos/mês (20% a.a.), dedução anual de " + _m(deducaoGoodwill) + ", economia fiscal de " + _m(econGoodwill) + ".",
        baseLegal: "Lei 12.973/2014, Arts. 20-22",
        acaoRecomendada: "Registrar goodwill conforme CPC 15 e Lei 12.973. Manter laudo de avaliação atualizado.",
        prazoImplementacao: "Imediato",
        detalhes: ctx.goodwillResult
      });
    }

    // #30 — Exaustão de Recursos Naturais
    if (_n(d.valorRecursosNaturais) > 0 && ctx.exaustaoResult) {
      var deducaoExaustao = ctx.exaustaoResult.exaustaoAnual || _r(_n(d.valorRecursosNaturais) * 0.20);
      var econExaustao = _r(deducaoExaustao * 0.34);
      ops.push({
        id: "EXAUSTAO_RECURSOS", titulo: "Exaustão de Recursos Naturais — Dedução Fiscal",
        tipo: "Dedução", complexidade: "Média", risco: "Baixo",
        economiaAnual: econExaustao,
        descricao: "Recursos naturais de " + _m(_n(d.valorRecursosNaturais)) + " permitem dedução de exaustão de " + _m(deducaoExaustao) + "/ano, economia fiscal de " + _m(econExaustao) + ".",
        baseLegal: "Art. 334-337 do RIR/2018",
        acaoRecomendada: "Manter laudo técnico de estimativa de vida útil dos recursos. Registrar na contabilidade e LALUR.",
        prazoImplementacao: "Imediato",
        detalhes: ctx.exaustaoResult
      });
    }

    // #31 — Despesas Pré-Operacionais Diferidas
    if (_n(d.despesasPreOperacionais) > 0 && ctx.preOperacionalResult) {
      var deducaoPreOp = ctx.preOperacionalResult.amortizacaoAnual || _r(_n(d.despesasPreOperacionais) / 5);
      var econPreOp = _r(deducaoPreOp * 0.34);
      ops.push({
        id: "PRE_OPERACIONAIS", titulo: "Despesas Pré-Operacionais — Amortização Diferida",
        tipo: "Dedução", complexidade: "Baixa", risco: "Baixo",
        economiaAnual: econPreOp,
        descricao: "Despesas pré-operacionais de " + _m(_n(d.despesasPreOperacionais)) + " amortizadas em no mínimo 5 anos, dedução anual de " + _m(deducaoPreOp) + ", economia de " + _m(econPreOp) + ".",
        baseLegal: "Art. 11 da Lei 12.973/2014",
        acaoRecomendada: "Registrar despesas pré-operacionais no ativo diferido. Controlar amortização no LALUR Parte B.",
        prazoImplementacao: "Imediato",
        detalhes: ctx.preOperacionalResult
      });
    }

    // #32 — Subcapitalização — Alerta de Juros Indedutíveis
    if (ctx.subcapResult && ctx.subcapResult.excedeu) {
      var jurosIndedSubcap = ctx.subcapResult.jurosIndedutiveis || 0;
      var econSubcapPotencial = _r(jurosIndedSubcap * 0.34);
      ops.push({
        id: "SUBCAPITALIZACAO_ALERTA", titulo: "Subcapitalização — Juros Indedutíveis (Alerta)",
        tipo: "Risco", complexidade: "Alta", risco: "Alto",
        economiaAnual: econSubcapPotencial,
        descricao: "Juros de " + _m(jurosIndedSubcap) + " pagos a vinculadas excedem limites de subcapitalização e são INDEDUTÍVEIS. Reestruturar dívida pode recuperar dedutibilidade de " + _m(econSubcapPotencial) + ".",
        baseLegal: "Art. 249-251 do RIR/2018",
        acaoRecomendada: "Reestruturar dívida para reduzir proporção dívida/PL dentro dos limites legais (2:1 geral, 30% paraíso fiscal).",
        prazoImplementacao: "90 dias",
        detalhes: ctx.subcapResult
      });
    }

    // #33 — Omissão de Receita — Alertas de Compliance
    if (ctx.omissaoResult && ctx.omissaoResult.riscosIdentificados > 0) {
      var descOmissao = ctx.omissaoResult.riscosIdentificados + " indicador(es) de omissão de receita identificado(s).";
      if (ctx.omissaoResult.indicadores && ctx.omissaoResult.indicadores.length > 0) {
        var indicadoresDesc = [];
        ctx.omissaoResult.indicadores.forEach(function (ind) {
          var descInd = ind.descricao || ind.tipo || "Indicador";
          indicadoresDesc.push(descInd);
        });
        descOmissao += " Indicadores: " + indicadoresDesc.join("; ") + ".";
      }
      ops.push({
        id: "OMISSAO_RECEITA_ALERTA", titulo: "Omissão de Receita — Alertas de Compliance",
        tipo: "Risco", complexidade: "Alta", risco: "Alto",
        economiaAnual: 0,
        descricao: descOmissao + " Resolução preventiva evita autuações com multa de 75-150% e juros SELIC.",
        baseLegal: "Art. 293-300 do RIR/2018",
        acaoRecomendada: "Revisar cada indicador imediatamente com o contador. Regularizar divergências antes de fiscalização.",
        prazoImplementacao: "Imediato",
        detalhes: ctx.omissaoResult
      });
    }

    // #34 — Regime Cambial Ótimo
    if (_n(d.receitasExteriorAnual) > 0 && d.regimeCambial) {
      var regCambialAtual = d.regimeCambial === "COMPETENCIA" ? "Competência" : "Caixa";
      var regCambialAlt = d.regimeCambial === "COMPETENCIA" ? "Caixa" : "Competência";
      var descCambial = "Regime atual: " + regCambialAtual + ". ";
      if (d.regimeCambial === "CAIXA") {
        descCambial += "O regime de Competência pode postergar tributação em cenários de depreciação cambial. A opção deve ser exercida em janeiro (Art. 407).";
      } else {
        descCambial += "O regime de Caixa tributa variações cambiais apenas no recebimento/pagamento efetivo, podendo diferir tributação.";
      }
      ops.push({
        id: "REGIME_CAMBIAL", titulo: "Regime Cambial — Análise de Oportunidade",
        tipo: "Timing", complexidade: "Média", risco: "Médio",
        economiaAnual: 0,
        descricao: descCambial,
        baseLegal: "Art. 407-413 do RIR/2018 (Variação Cambial)",
        acaoRecomendada: "Simular impacto da mudança de regime cambial considerando projeções de câmbio. Opção por Competência é irretratável no ano-calendário.",
        prazoImplementacao: "Janeiro do próximo exercício",
        detalhes: { regimeAtual: d.regimeCambial, alternativa: regCambialAlt }
      });
    }

    // #35 — Método de Estoque Ótimo
    if (_n(d.valorEstoqueFinal) > 0) {
      var metodoAtual = d.metodoEstoque || "CUSTO_MEDIO";
      var descEstoque = "Método atual: " + metodoAtual + ". Estoque final: " + _m(_n(d.valorEstoqueFinal)) + ". ";
      descEstoque += "Em cenários inflacionários, PEPS pode gerar custo mais alto (menor lucro tributável). Custo Médio é mais conservador.";
      var vedacoesEstoque = [];
      if (LR.estoques && LR.estoques.vedacoes) {
        vedacoesEstoque = LR.estoques.vedacoes;
      }
      ops.push({
        id: "METODO_ESTOQUE", titulo: "Método de Avaliação de Estoques — Revisão",
        tipo: "Timing", complexidade: "Média", risco: "Baixo",
        economiaAnual: 0,
        descricao: descEstoque + (vedacoesEstoque.length > 0 ? " Vedações: " + vedacoesEstoque[0] + "." : ""),
        baseLegal: "Art. 304-310 do RIR/2018",
        acaoRecomendada: "Avaliar qual método de estoque minimiza a carga tributária no cenário atual. Método deve ser consistente ano a ano. UEPS é vedado (Art. 307).",
        prazoImplementacao: "Início do exercício",
        detalhes: { metodoAtual: metodoAtual, valorEstoque: _n(d.valorEstoqueFinal), vedacoes: vedacoesEstoque }
      });
    }

    // #36 — Provisões Não Dedutíveis — Estratégia de Reversão
    if (_n(d.provisoesContingencias) > 0) {
      var totalProvisoes = _n(d.provisoesContingencias) + _n(d.provisoesGarantias);
      var econFuturaProvisoes = _r(totalProvisoes * 0.34);
      var descProvisao = "Provisões não dedutíveis de " + _m(totalProvisoes) + " geram adição ao LALUR no exercício corrente. ";
      descProvisao += "A reversão/utilização futura gera EXCLUSÃO do LALUR, resultando em economia fiscal futura de até " + _m(econFuturaProvisoes) + ".";
      var fundamentacao = "";
      if (LR.provisoes && LR.provisoes.naoDedutiveis) {
        LR.provisoes.naoDedutiveis.forEach(function (prov) {
          fundamentacao += prov.descricao + " (" + prov.artigo + "); ";
        });
      }
      ops.push({
        id: "PROVISOES_REVERSAO", titulo: "Provisões Não Dedutíveis — Estratégia de Reversão Futura",
        tipo: "Timing", complexidade: "Baixa", risco: "Baixo",
        economiaAnual: 0,
        descricao: descProvisao + (fundamentacao ? " Fundamento: " + fundamentacao : ""),
        baseLegal: "Art. 340-342 do RIR/2018",
        acaoRecomendada: "Controlar provisões na Parte B do LALUR. Na reversão/utilização, registrar exclusão na Parte A. Manter memória de cálculo atualizada.",
        prazoImplementacao: "Contínuo",
        detalhes: { provisoesContingencias: _n(d.provisoesContingencias), provisoesGarantias: _n(d.provisoesGarantias), economiaFuturaEstimada: econFuturaProvisoes }
      });
    }

    // #37 — Reinvestimento 30% SUDAM/SUDENE Potencial (SEM projeto)
    if ((ctx.isSUDAM || ctx.isSUDENE) && !ctx.temProjetoSUDAM && ctx.irpjNormalPrevia > 0) {
      var nomeSup37 = ctx.isSUDAM ? "SUDAM" : "SUDENE";
      var reinvPotencial = _r(ctx.irpjNormalPrevia * 0.30);
      var capitalGiroPotencial = _r(reinvPotencial * 0.50);
      var bancoDeposito = "";
      if (LR.sudam && LR.sudam.reinvestimento30 && LR.sudam.reinvestimento30.bancoDeposito) {
        bancoDeposito = LR.sudam.reinvestimento30.bancoDeposito[nomeSup37] || "";
      } else if (LR.reinvestimento30 && LR.reinvestimento30.bancoDeposito) {
        bancoDeposito = LR.reinvestimento30.bancoDeposito || "";
      }
      ops.push({
        id: "REINVESTIMENTO_30_POTENCIAL", titulo: "Potencial: Reinvestimento 30% " + nomeSup37 + " (sem projeto)",
        tipo: "Potencial", complexidade: "Alta", risco: "Médio",
        economiaAnual: reinvPotencial,
        descricao: "Com projeto " + nomeSup37 + " aprovado, seria possível depositar 30% do IRPJ (" + _m(reinvPotencial) + ") como reinvestimento. 50% (" + _m(capitalGiroPotencial) + ") pode ser usado como capital de giro." + (bancoDeposito ? " Banco: " + bancoDeposito + "." : ""),
        baseLegal: "Art. 638-651 do RIR/2018",
        acaoRecomendada: "Elaborar projeto de investimento e protocolar junto à " + nomeSup37 + " para obter aprovação e acessar o benefício.",
        prazoImplementacao: "6-12 meses",
        detalhes: { reinvestimentoPotencial: reinvPotencial, capitalGiro50: capitalGiroPotencial }
      });
    }

    // #38 — Receita Bruta Formal (revisão)
    if (ctx.receitaBruta > 0 && LR.calcular && LR.calcular.receitaBrutaCalc) {
      try {
        var receitaFormal = LR.calcular.receitaBrutaCalc({
          receitaBruta: ctx.receitaBruta,
          devolucoes: _n(d.devolucoes),
          descontosIncondicionais: _n(d.descontosIncondicionais),
          avp: _n(d.ajusteValorPresente)
        });
        if (receitaFormal && receitaFormal.deducoesNaoAplicadas > 0) {
          var econReceitaFormal = _r(receitaFormal.deducoesNaoAplicadas * 0.34);
          ops.push({
            id: "RECEITA_BRUTA_FORMAL", titulo: "Receita Bruta — Deduções Não Aplicadas",
            tipo: "Dedução", complexidade: "Baixa", risco: "Baixo",
            economiaAnual: econReceitaFormal,
            descricao: "Revisão da composição da receita bruta identificou deduções não aplicadas de " + _m(receitaFormal.deducoesNaoAplicadas) + " (devoluções, descontos, AVP). Economia potencial de " + _m(econReceitaFormal) + ".",
            baseLegal: "Lei 12.973/2014, Art. 12",
            acaoRecomendada: "Verificar se devoluções, descontos incondicionais e AVP estão sendo corretamente deduzidos da receita bruta.",
            prazoImplementacao: "Imediato",
            detalhes: receitaFormal
          });
        }
      } catch(e) {}
    }

    // #39 — Simulação Completa Integrada
    if (LR.calcular && LR.calcular.simulacaoCompleta) {
      try {
        // BUG#4 CORRIGIDO: campos renomeados para o formato esperado pelo mapeamento
        var simCompleta = LR.calcular.simulacaoCompleta({
          lucroLiquido: ctx.lucroLiquido,
          receitaBruta: ctx.receitaBruta,
          adicoes: ctx.totalAdicoes || 0,
          exclusoes: ctx.totalExclusoes || 0,
          patrimonioLiquido: _n(d.plAjustadoJCP) > 0 ? _n(d.plAjustadoJCP) : ctx.plVal,
          prejuizoFiscal: _n(d.prejuizoFiscal),
          baseNegativaCSLL: _n(d.baseNegativaCSLL),
          lucrosAcumulados: _n(d.lucrosAcumulados) + _n(d.reservasLucros),
          tjlp: (_n(d.tjlp) || 7.97) / 100,
          financeira: ctx.ehFinanceira,
          despesasIncentivos: ctx.despesasIncentivos || {},
          retencoesFonte: ctx.totalIRRF || 0,
          estimativasPagas: 0,
          numMeses: 12
        });
        // BUG#4: guarda para evitar exibir número fantasma quando baseline é zero
        if (simCompleta && simCompleta.economia && simCompleta.economia.total > 0
            && simCompleta.semOtimizacao && simCompleta.semOtimizacao.irpjDevido > 0) {
          ops.push({
            id: "SIMULACAO_COMPLETA", titulo: "Simulação Integrada — Economia Consolidada",
            tipo: "Dedução", complexidade: "Média", risco: "Baixo",
            // CORREÇÃO FALHA #1: Marcar como consolidação para não somar com itens individuais
            _isConsolidada: true,
            economiaAnual: simCompleta.economia.total,
            descricao: "⚠️ CONSOLIDAÇÃO (não somar com itens acima) — Simulação consolidada IRPJ+CSLL+JCP+Incentivos indica economia total otimizada de " + _m(simCompleta.economia.total) + " vs cenário sem otimizações.",
            baseLegal: "Diversos — consolidação de todos os incentivos aplicáveis",
            acaoRecomendada: "Implementar todas as otimizações identificadas na simulação completa para maximizar a economia fiscal.",
            prazoImplementacao: "30-90 dias",
            detalhes: simCompleta
          });
        }
      } catch(e) {}
    }

    // #40 — Recomendação Trimestral vs Anual
    if (ctx.recomendacaoRegime) {
      var regimeRecomendado = ctx.recomendacaoRegime.regimeRecomendado || "";
      var regimeAtual = d.apuracaoLR || "anual";
      var econRegime = ctx.recomendacaoRegime.economiaEstimada || 0;
      if (regimeRecomendado && regimeRecomendado.toLowerCase() !== regimeAtual.toLowerCase() && econRegime > 0) {
        ops.push({
          id: "REGIME_APURACAO", titulo: "Recomendação: Apuração " + regimeRecomendado.charAt(0).toUpperCase() + regimeRecomendado.slice(1),
          tipo: "Timing", complexidade: "Baixa", risco: "Baixo",
          economiaAnual: econRegime,
          descricao: "Regime atual: " + regimeAtual + ". Recomendação: " + regimeRecomendado + ". Economia estimada de " + _m(econRegime) + "/ano pela mudança. " + (ctx.recomendacaoRegime.motivo || ""),
          baseLegal: "Art. 218-220 do RIR/2018",
          acaoRecomendada: "Avaliar mudança de regime de apuração no próximo exercício. Considerar impacto no fluxo de caixa e compensação de prejuízos.",
          prazoImplementacao: "Início do exercício",
          detalhes: ctx.recomendacaoRegime
        });
      }
    }

    // #41 — PDD Fiscal Detalhada (usando motor)
    var temPDD = _n(d.perdasCreditos6Meses) + _n(d.perdasCreditosJudicial) + _n(d.perdasCreditosFalencia);
    if (temPDD > 0 && LR.calcular && LR.calcular.avancado && LR.calcular.avancado.calcularPDD) {
      try {
        var pddDetalhada = LR.calcular.avancado.calcularPDD({
          perdasCreditos6Meses: _n(d.perdasCreditos6Meses),
          perdasCreditosJudicial: _n(d.perdasCreditosJudicial),
          perdasCreditosFalencia: _n(d.perdasCreditosFalencia),
          creditosVencidos6Meses: _n(d.creditosVencidos6Meses)
        });
        if (pddDetalhada && pddDetalhada.economiaAdicional > 0) {
          ops.push({
            id: "PDD_DETALHADA", titulo: "PDD Fiscal — Validação Detalhada por Faixas",
            tipo: "Dedução", complexidade: "Média", risco: "Baixo",
            economiaAnual: pddDetalhada.economiaAdicional,
            descricao: "Validação por faixas de valor (< R$ 15k, R$ 15k-100k, > R$ 100k) identificou economia adicional de " + _m(pddDetalhada.economiaAdicional) + ". " + (pddDetalhada.alertas ? pddDetalhada.alertas.join("; ") : ""),
            baseLegal: "Art. 340-342 do RIR/2018 (Decreto 9.580/2018)",
            acaoRecomendada: "Classificar créditos por faixa de valor e verificar requisitos específicos de cada faixa para maximizar PDD dedutível.",
            prazoImplementacao: "30 dias",
            detalhes: pddDetalhada
          });
        }
      } catch(e) {}
    }

    // #42 — Mapa de Economia Consolidado
    if (LR.calcular && LR.calcular.avancado && LR.calcular.avancado.gerarMapaEconomia) {
      try {
        var mapaEconomia = LR.calcular.avancado.gerarMapaEconomia({
          receitaBruta: ctx.receitaBruta,
          lucroLiquido: ctx.lucroLiquido,
          lucroAjustado: ctx.lucroAjustado,
          patrimonioLiquido: ctx.plVal,
          irpjResult: ctx.irpjResult,
          csllResult: ctx.csllResult,
          jcpResult: ctx.jcpResult,
          pisCofinsResult: ctx.pisCofinsResult,
          depreciacaoResult: ctx.depreciacaoResult,
          compensacao: ctx.compensacao,
          incentivosFiscais: ctx.incentivosFiscais,
          sudamResult: ctx.sudamResult,
          goodwillResult: ctx.goodwillResult,
          exaustaoResult: ctx.exaustaoResult,
          preOperacionalResult: ctx.preOperacionalResult,
          oportunidades: ops
        });
        if (mapaEconomia && mapaEconomia.economiaTotal > 0) {
          ops.push({
            id: "MAPA_ECONOMIA", titulo: "Mapa de Economia Consolidado IMPOST.",
            tipo: "Dedução", complexidade: "Baixa", risco: "Baixo",
            // CORREÇÃO FALHA #1: Marcar como consolidação para não somar com itens individuais
            _isConsolidada: true,
            economiaAnual: mapaEconomia.economiaTotal,
            descricao: "⚠️ CONSOLIDAÇÃO (não somar com itens acima) — Mapa consolidado de todas as estratégias identifica economia total potencial de " + _m(mapaEconomia.economiaTotal) + ". " + (mapaEconomia.estrategiasAtivas || 0) + " estratégias ativas de " + (mapaEconomia.estrategiasDisponiveis || 0) + " disponíveis.",
            baseLegal: "Consolidação de todas as bases legais aplicáveis",
            acaoRecomendada: "Utilizar o Mapa de Economia como roteiro de implementação. Priorizar estratégias por impacto e complexidade.",
            prazoImplementacao: "Contínuo",
            detalhes: mapaEconomia
          });
        }
      } catch(e) {}
    }

    // Ordenar por economia anual descrescente e atribuir ranking
    ops.sort(function (a, b) { return b.economiaAnual - a.economiaAnual; });
    // ═══ FIX BUG #6: Garantir que todas as oportunidades tenham .economia como alias de .economiaAnual ═══
    ops.forEach(function (op, i) {
      op.ranking = i + 1;
      // Sincronizar campos para evitar undefined em exportações que usem .economia
      if (op.economiaAnual !== undefined && op.economia === undefined) {
        op.economia = op.economiaAnual;
      } else if (op.economia !== undefined && op.economiaAnual === undefined) {
        op.economiaAnual = op.economia;
      }
    });

    return ops;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  SIMULAÇÃO TRIMESTRAL vs ANUAL
  // ═══════════════════════════════════════════════════════════════════════════

  function _simularTrimestral(d, lucroAjustado, prejuizoFiscal, baseNegCSLL, vedaCompensacao, ehFinanceira) {
    var trimestres = [];
    var totalIRPJ = 0;
    var totalCSLL = 0;
    var totalIRPJNormalExato = 0;
    var totalIRPJAdicionalExato = 0;
    var totalCSLLExato = 0;
    var saldoPF = vedaCompensacao ? 0 : prejuizoFiscal;
    var saldoBN = vedaCompensacao ? 0 : baseNegCSLL;
    var aliqCSLL = ehFinanceira ? 0.15 : 0.09;

    // Se temos meses preenchidos, usar dados reais por trimestre
    var temMes = d.preencherMesAMes === true || d.preencherMesAMes === "true";
    for (var tri = 0; tri < 4; tri++) {
      var lucroTri;
      if (temMes) {
        var recTri = 0;
        for (var m = tri * 3 + 1; m <= tri * 3 + 3; m++) recTri += _n(d["receitaMes" + m]);
        var fator = _n(d.receitaBrutaAnual) > 0 ? recTri / _n(d.receitaBrutaAnual) : 0.25;
        lucroTri = _r(lucroAjustado * fator);
      } else {
        lucroTri = _r(lucroAjustado / 4);
      }

      // Compensação 30% por trimestre
      var compTri = 0;
      if (lucroTri > 0 && saldoPF > 0) {
        var maxComp = _r(lucroTri * 0.30);
        compTri = Math.min(maxComp, saldoPF);
        saldoPF = _r(saldoPF - compTri);
      }
      var lucroRealTri = Math.max(lucroTri - compTri, 0);

      // IRPJ trimestral (adicional sobre R$ 60.000)
      var irpjN_exato = lucroRealTri * 0.15;
      var irpjA_exato = Math.max(lucroRealTri - 60000, 0) * 0.10;
      var irpjN = _r(irpjN_exato);  // arredondado para UI do trimestre
      var irpjA = _r(irpjA_exato);
      var irpjTri = _r(irpjN + irpjA);

      // CSLL trimestral com compensação
      var compCSLLTri = 0;
      if (lucroTri > 0 && saldoBN > 0) {
        var maxCompBN = _r(lucroTri * 0.30);
        compCSLLTri = Math.min(maxCompBN, saldoBN);
        saldoBN = _r(saldoBN - compCSLLTri);
      }
      var baseCSLLTri = Math.max(lucroTri - compCSLLTri, 0);
      var csll_exato = baseCSLLTri * aliqCSLL;
      var csllTri = _r(csll_exato);

      // Acumular valores EXATOS (arredondamento apenas no retorno final)
      totalIRPJNormalExato += irpjN_exato;
      totalIRPJAdicionalExato += irpjA_exato;
      totalCSLLExato += csll_exato;
      totalIRPJ += irpjTri;
      totalCSLL += csllTri;

      trimestres.push({
        trimestre: tri + 1,
        lucroAjustado: lucroTri,
        compensacaoPrejuizo: compTri,
        lucroReal: lucroRealTri,
        irpjNormal: irpjN,
        irpjAdicional: irpjA,
        irpjTotal: irpjTri,
        compensacaoCSLL: compCSLLTri,
        baseCSLL: baseCSLLTri,
        csll: csllTri
      });
    }

    return {
      trimestres: trimestres,
      totalIRPJ: _r(totalIRPJNormalExato + totalIRPJAdicionalExato),
      totalIRPJNormal: _r(totalIRPJNormalExato),
      totalIRPJAdicional: _r(totalIRPJAdicionalExato),
      totalCSLL: _r(totalCSLLExato),
      total: _r(totalIRPJNormalExato + totalIRPJAdicionalExato + totalCSLLExato),
      saldoPrejuizoRemanescente: _r(saldoPF),
      saldoBaseNegRemanescente: _r(saldoBN)
    };
  }

  function _simularAnualEstimativa(d, receitaBruta, lucroRealFinal, ehFinanceira, irpjRealDoMotor, csllRealDoMotor) {
    var meses = [];
    var totalEstimIRPJ = 0;
    var totalEstimCSLL = 0;
    var tipo = d.tipoAtividade || "SERVICOS_GERAL";
    var temMes = d.preencherMesAMes === true || d.preencherMesAMes === "true";

    // Presunções para fallback (RIR/2018 Art. 591-593)
    var presIRPJ = 0.32; // Serviços
    var presCSLL = 0.32;
    if (tipo === "COMERCIO_INDUSTRIA" || tipo === "INDUSTRIA" || tipo === "TRANSPORTE_CARGA") {
      presIRPJ = 0.08;
      presCSLL = 0.12;
    } else if (tipo === "TRANSPORTE_PASSAGEIROS") {
      presIRPJ = 0.16;
      presCSLL = 0.12;
    } else if (tipo === "SERVICOS_HOSPITALARES") {
      presIRPJ = 0.08;
      presCSLL = 0.12;
    } else if (tipo === "REVENDA_COMBUSTIVEIS") {
      presIRPJ = 0.016;
      presCSLL = 0.12;
    }
    // Buscar presunção do LR.presuncoes se disponível
    if (LR && LR.presuncoes && LR.presuncoes[tipo]) {
      var pData = LR.presuncoes[tipo];
      if (pData.irpj) presIRPJ = pData.irpj;
      if (pData.csll) presCSLL = pData.csll;
    }

    for (var m = 1; m <= 12; m++) {
      var recMes = temMes ? _n(d["receitaMes" + m]) : _r(receitaBruta / 12);
      var est = null;
      if (LR.calcular.estimativaMensal) {
        try {
          est = LR.calcular.estimativaMensal({
            receitaBruta: recMes,
            tipoAtividade: tipo,
            mes: m,
            financeira: ehFinanceira
          });
        } catch (e) { est = null; }
      }
      var irpjMes = est ? (est.irpjDevido || (est.irpj && est.irpj.devido) || 0) : 0;
      var csllMes = est ? (est.csllDevida || (est.csll && est.csll.devida) || 0) : 0;

      // Fallback: calcular estimativa por presunção se o motor não retornou valores
      if (irpjMes === 0 && csllMes === 0 && recMes > 0) {
        var baseIRPJMes = _r(recMes * presIRPJ);
        irpjMes = _r(baseIRPJMes * 0.15 + Math.max(baseIRPJMes - 20000, 0) * 0.10);
        var baseCSLLMes = _r(recMes * presCSLL);
        csllMes = _r(baseCSLLMes * (ehFinanceira ? 0.15 : 0.09));
      }

      totalEstimIRPJ += irpjMes;
      totalEstimCSLL += csllMes;

      meses.push({
        mes: m, receitaBruta: recMes,
        irpjEstimativa: _r(irpjMes),
        csllEstimativa: _r(csllMes),
        totalMes: _r(irpjMes + csllMes)
      });
    }

    // Ajuste anual: IRPJ real - estimativas (usa valores do motor quando disponíveis)
    var irpjRealAnual = irpjRealDoMotor || _r(lucroRealFinal * 0.15 + Math.max(lucroRealFinal - 240000, 0) * 0.10);
    var csllRealAnual = csllRealDoMotor || _r(lucroRealFinal * (ehFinanceira ? 0.15 : 0.09));
    var ajusteIRPJ = _r(irpjRealAnual - totalEstimIRPJ);
    var ajusteCSLL = _r(csllRealAnual - totalEstimCSLL);

    return {
      meses: meses,
      totalEstimativasIRPJ: _r(totalEstimIRPJ),
      totalEstimativasCSLL: _r(totalEstimCSLL),
      totalEstimativas: _r(totalEstimIRPJ + totalEstimCSLL),
      irpjRealAnual: irpjRealAnual,
      csllRealAnual: csllRealAnual,
      ajusteIRPJ: ajusteIRPJ,
      ajusteCSLL: ajusteCSLL,
      ajusteTotal: _r(ajusteIRPJ + ajusteCSLL),
      saldoACompensar: ajusteIRPJ < 0 ? _r(Math.abs(ajusteIRPJ)) : 0,
      saldoACompensarCSLL: ajusteCSLL < 0 ? _r(Math.abs(ajusteCSLL)) : 0,
      saldoACompensarTotal: _r((ajusteIRPJ < 0 ? Math.abs(ajusteIRPJ) : 0) + (ajusteCSLL < 0 ? Math.abs(ajusteCSLL) : 0))
    };
  }

  function _simularSuspensaoReducao(d, receitaBruta, lucroRealFinal, ehFinanceira, irpjRealDoMotor, csllRealDoMotor) {
    if (!LR.calcular.suspensaoReducao) return null;
    var meses = [];
    var irpjPagoAcum = 0;
    var csllPagaAcum = 0;
    var tipo = d.tipoAtividade || "SERVICOS_GERAL";
    var mesesSuspensos = 0;
    var economiaSuspensao = 0;
    var temMes = d.preencherMesAMes === true || d.preencherMesAMes === "true";

    // Presunções para fallback
    var presIRPJ = 0.32;
    var presCSLL = 0.32;
    if (tipo === "COMERCIO_INDUSTRIA" || tipo === "INDUSTRIA" || tipo === "TRANSPORTE_CARGA") {
      presIRPJ = 0.08; presCSLL = 0.12;
    } else if (tipo === "TRANSPORTE_PASSAGEIROS") {
      presIRPJ = 0.16; presCSLL = 0.12;
    } else if (tipo === "SERVICOS_HOSPITALARES") {
      presIRPJ = 0.08; presCSLL = 0.12;
    } else if (tipo === "REVENDA_COMBUSTIVEIS") {
      presIRPJ = 0.016; presCSLL = 0.12;
    }
    if (LR && LR.presuncoes && LR.presuncoes[tipo]) {
      if (LR.presuncoes[tipo].irpj) presIRPJ = LR.presuncoes[tipo].irpj;
      if (LR.presuncoes[tipo].csll) presCSLL = LR.presuncoes[tipo].csll;
    }

    for (var m = 1; m <= 12; m++) {
      var recMes = temMes ? _n(d["receitaMes" + m]) : _r(receitaBruta / 12);
      var est = null;
      try {
        est = LR.calcular.estimativaMensal({ receitaBruta: recMes, tipoAtividade: tipo, mes: m, financeira: ehFinanceira });
      } catch (e) { /* ignore */ }
      var estimIRPJMes = est ? (est.irpjDevido || 0) : 0;
      var estimCSLLMes = est ? (est.csllDevida || 0) : 0;

      // Fallback por presunção
      if (estimIRPJMes === 0 && estimCSLLMes === 0 && recMes > 0) {
        var baseEstIRPJ = _r(recMes * presIRPJ);
        estimIRPJMes = _r(baseEstIRPJ * 0.15 + Math.max(baseEstIRPJ - 20000, 0) * 0.10);
        var baseEstCSLL = _r(recMes * presCSLL);
        estimCSLLMes = _r(baseEstCSLL * (ehFinanceira ? 0.15 : 0.09));
      }

      // IRPJ real acumulado até o mês (proporcional — usa valores do motor quando disponíveis)
      var irpjRealAcum = _r((irpjRealDoMotor || (lucroRealFinal * 0.15 + Math.max(lucroRealFinal - 240000, 0) * 0.10)) * m / 12);
      var csllRealAcum = _r((csllRealDoMotor || (lucroRealFinal * (ehFinanceira ? 0.15 : 0.09))) * m / 12);

      var sr = null;
      try {
        sr = LR.calcular.suspensaoReducao({
          estimativaDevidaMes: estimIRPJMes,
          irpjRealAcumulado: irpjRealAcum,
          irpjPagoAcumulado: irpjPagoAcum,
          estimativaCSLLMes: estimCSLLMes,
          csllRealAcumulada: csllRealAcum,
          csllPagaAcumulada: csllPagaAcum,
          mesReferencia: m
        });
      } catch (e) { sr = null; }

      var irpjPago = sr ? (sr.irpj ? sr.irpj.valorAPagar : estimIRPJMes) : estimIRPJMes;
      var csllPaga = sr ? (sr.csll ? sr.csll.valorAPagar : estimCSLLMes) : estimCSLLMes;
      irpjPagoAcum += irpjPago;
      csllPagaAcum += csllPaga;

      var situacao = sr ? (sr.irpj ? sr.irpj.situacao : "INTEGRAL") : "INTEGRAL";
      if (situacao === "SUSPENSAO") mesesSuspensos++;
      var econMes = sr ? (sr.economiaMes || (estimIRPJMes - irpjPago + estimCSLLMes - csllPaga)) : 0;
      economiaSuspensao += Math.max(econMes, 0);

      meses.push({
        mes: m, situacao: situacao,
        estimativaIRPJ: _r(estimIRPJMes), irpjPago: _r(irpjPago),
        estimativaCSLL: _r(estimCSLLMes), csllPaga: _r(csllPaga),
        economia: _r(Math.max(econMes, 0))
      });
    }

    return {
      meses: meses,
      mesesSuspensos: mesesSuspensos,
      economiaTotalSuspensao: _r(economiaSuspensao)
    };
  }

  function _recomendarApuracao(simTri, simAnual, simSuspensao, d) {
    var totalTri = simTri.total;
    // CORREÇÃO: Comparar custo FINAL real de cada regime, não estimativas vs definitivo.
    // No regime anual, o custo final é irpjRealAnual + csllRealAnual (ajuste anual),
    // não a soma das estimativas mensais.
    var totalAnual = (simAnual.irpjRealAnual || 0) + (simAnual.csllRealAnual || 0);
    var temMes = d.preencherMesAMes === true || d.preencherMesAMes === "true";

    // Verificar sazonalidade
    var sazonal = false;
    if (temMes) {
      var recMeses = [];
      for (var m = 1; m <= 12; m++) recMeses.push(_n(d["receitaMes" + m]));
      var maxM = Math.max.apply(null, recMeses);
      var minM = Math.min.apply(null, recMeses.filter(function (v) { return v > 0; }));
      if (minM > 0 && (maxM / minM) > 1.3) sazonal = true;
    }

    // Algum trimestre com prejuízo?
    var temPrejuizoTri = simTri.trimestres.some(function (t) { return t.lucroAjustado < 0; });

    var recomendacao = "";
    var forma = "";
    // CORREÇÃO FALHA #8: Filtro de materialidade — diferenças < R$ 100 são insignificantes
    var MATERIALIDADE = 100;
    var diferencaAbsoluta = Math.abs(totalTri - totalAnual);
    if (sazonal || temPrejuizoTri) {
      forma = "anual";
      recomendacao = "Apuração ANUAL recomendada. ";
      if (sazonal) recomendacao += "Receita sazonal (variação > 30% entre meses) favorece apuração anual. ";
      if (temPrejuizoTri) recomendacao += "Prejuízo em trimestres pode ser compensado dentro do ano na apuração anual. ";
      if (simSuspensao && simSuspensao.mesesSuspensos > 0) {
        recomendacao += "Com suspensão/redução, economia adicional de " + _m(simSuspensao.economiaTotalSuspensao) + " evitando estimativas desnecessárias.";
      }
    } else if (diferencaAbsoluta < MATERIALIDADE) {
      forma = "ambas";
      recomendacao = "Não há diferença significativa entre as formas de apuração (diferença de apenas " + _m(diferencaAbsoluta) + "). Ambas são viáveis — considere a simplicidade operacional.";
    } else if (totalTri < totalAnual) {
      forma = "trimestral";
      recomendacao = "Apuração TRIMESTRAL é mais vantajosa neste caso (economia de " + _m(totalAnual - totalTri) + " vs. estimativa). Lucro estável favorece simplicidade.";
    } else {
      forma = "anual";
      recomendacao = "Apuração ANUAL por estimativa é ligeiramente mais vantajosa (economia de " + _m(totalTri - totalAnual) + ").";
    }

    return {
      formaRecomendada: forma,
      justificativa: recomendacao,
      diferenca: _r(Math.abs(totalTri - totalAnual)),
      sazonal: sazonal,
      temPrejuizoTrimestral: temPrejuizoTri
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  CENÁRIOS (pessimista / base / otimista)
  // ═══════════════════════════════════════════════════════════════════════════

  function _gerarCenarios(d, dre, lalur, ehFinanceira, prejuizoFiscal, baseNegCSLL, vedaCompensacao) {
    var variacao = (_n(d.variacaoMargemCenario) || 5) / 100;
    var rb = _n(d.receitaBrutaAnual);
    var cenarios = [];
    var nomes = ["Pessimista", "Base", "Otimista"];
    var fatores = [-variacao, 0, variacao];
    var aliqCSLL = ehFinanceira ? 0.15 : 0.09;
    var pf = vedaCompensacao ? 0 : (prejuizoFiscal || 0);
    var bn = vedaCompensacao ? 0 : (baseNegCSLL || 0);

    for (var c = 0; c < 3; c++) {
      // CORREÇÃO FALHA #6: Usar margem precisa (sem arredondamento) em vez de margemLucro/100
      var margemAjustada = (dre.margemLucroPrecisa !== undefined ? dre.margemLucroPrecisa : (dre.margemLucro / 100)) + fatores[c];
      var lucroC = _r(rb * margemAjustada);
      var lucroAjC = _r(lucroC + lalur.totalAdicoes - lalur.totalExclusoes);

      // Compensação de prejuízo fiscal (30%) — mesmo critério do cálculo principal
      var compPF = 0;
      if (lucroAjC > 0 && pf > 0) {
        compPF = Math.min(_r(lucroAjC * 0.30), pf);
      }
      var lucroRealC = Math.max(lucroAjC - compPF, 0);

      // IRPJ sobre lucro real do cenário
      var irpjC = _r(lucroRealC * 0.15 + Math.max(lucroRealC - 240000, 0) * 0.10);

      // CSLL com compensação de base negativa (30%)
      var compBN = 0;
      if (lucroAjC > 0 && bn > 0) {
        compBN = Math.min(_r(lucroAjC * 0.30), bn);
      }
      var baseCSLLC = Math.max(lucroAjC - compBN, 0);
      var csllC = _r(baseCSLLC * aliqCSLL);

      var pcC = _r(pisCofinsSimplificado(rb, d));
      var issC = _r((_n(d.receitaServicos) || rb) * (_n(d.issAliquota) || 5) / 100);
      var totalC = _r(irpjC + csllC + pcC + issC);
      var aliqC = rb > 0 ? _r(totalC / rb * 100) : 0;

      cenarios.push({
        nome: nomes[c],
        margem: _r(margemAjustada * 100),
        lucro: lucroC,
        irpjCSLL: _r(irpjC + csllC),
        pisCofins: pcC,
        iss: issC,
        cargaTotal: totalC,
        aliquotaEfetiva: aliqC
      });
    }
    return cenarios;
  }

  function pisCofinsSimplificado(rb, d) {
    var isentas = _n(d.receitasIsentas) + _n(d.receitaExportacao) + _n(d.receitasMonofasicas);
    var tributavel = Math.max(rb - isentas, 0);
    var baseCreditos = _calcBaseCreditos();
    var debitos = _r(tributavel * 0.0925);
    var creditos = _r(baseCreditos * 0.0925);
    // CORREÇÃO FALHA #7: Descontar retenções de PIS/COFINS (consistente com cálculo principal)
    var retencoesPisCofins = _n(d.pisRetido) + _n(d.cofinsRetido);
    return _r(Math.max(debitos - creditos - retencoesPisCofins, 0));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  FLUXO DE CAIXA TRIBUTÁRIO MENSAL
  // ═══════════════════════════════════════════════════════════════════════════

  function _gerarFluxoCaixaMensal(d, receitaBruta, receitaServicos, issAliquota, irpjAnual, csllAnual, pisCofinsResult, simTrimestralData) {
    var apuracao = d.apuracaoLR || "trimestral";
    var temMes = d.preencherMesAMes === true || d.preencherMesAMes === "true";
    var meses = [];
    var pisAnual = pisCofinsResult.pisAPagar || (pisCofinsResult.aPagar ? pisCofinsResult.aPagar.pis : 0);
    var cofinsAnual = pisCofinsResult.cofinsAPagar || (pisCofinsResult.aPagar ? pisCofinsResult.aPagar.cofins : 0);
    var totalFluxo = 0;

    // ═══ CORREÇÃO FALHA #4: Deduzir retenções proporcionalmente à apuração ═══
    var totalIRRFAnual = _n(d.irrfRetidoPrivado) + _n(d.irrfRetidoPublico);
    var totalCSLLRetAnual = _n(d.csllRetido);
    var retPISMes = _r(_n(d.pisRetido) / 12);
    var retCOFINSMes = _r(_n(d.cofinsRetido) / 12);

    for (var m = 1; m <= 12; m++) {
      var recMes = temMes ? _n(d["receitaMes" + m]) : _r(receitaBruta / 12);
      var fator = receitaBruta > 0 ? recMes / receitaBruta : 1 / 12;
      var recServMes = _r(receitaServicos * fator);

      // PIS/COFINS sempre mensais
      var pisMes = _r(pisAnual / 12);
      var cofinsMes = _r(cofinsAnual / 12);

      // ISS mensal sobre receita de serviços
      var issMes = _r(recServMes * issAliquota / 100);

      // IRPJ/CSLL dependem da apuração
      var irpjMes = 0;
      var csllMes = 0;
      // CORREÇÃO: Retenções de IRRF e CSLL proporcionais ao período de apuração
      var retIRRFMes = 0;
      var retCSLLMes = 0;
      if (apuracao === "trimestral") {
        // Concentrado nos meses 3, 6, 9, 12
        if (m % 3 === 0) {
          var triIdx = (m / 3) - 1;
          if (simTrimestralData && simTrimestralData.trimestres && simTrimestralData.trimestres[triIdx]) {
            irpjMes = _r(simTrimestralData.trimestres[triIdx].irpjTotal);
            csllMes = _r(simTrimestralData.trimestres[triIdx].csll);
          } else {
            irpjMes = _r(irpjAnual / 4);
            csllMes = _r(csllAnual / 4);
          }
          // Retenções concentradas nos meses de pagamento (1/4 cada trimestre)
          retIRRFMes = _r(totalIRRFAnual / 4);
          retCSLLMes = _r(totalCSLLRetAnual / 4);
        }
        // Em meses não-trimestrais, retIRRFMes e retCSLLMes ficam 0
      } else {
        // Estimativa mensal
        irpjMes = _r(irpjAnual / 12);
        csllMes = _r(csllAnual / 12);
        retIRRFMes = _r(totalIRRFAnual / 12);
        retCSLLMes = _r(totalCSLLRetAnual / 12);
      }

      var irpjEfetivo = Math.max(_r(irpjMes - (irpjMes > 0 ? retIRRFMes : 0)), 0);
      var csllEfetivo = Math.max(_r(csllMes - (csllMes > 0 ? retCSLLMes : 0)), 0);
      var pisEfetivo = Math.max(_r(pisMes - retPISMes), 0);
      var cofinsEfetivo = Math.max(_r(cofinsMes - retCOFINSMes), 0);
      var totalMes = _r(irpjEfetivo + csllEfetivo + pisEfetivo + cofinsEfetivo + issMes);
      totalFluxo += totalMes;

      meses.push({
        mes: m,
        irpj: irpjEfetivo,
        csll: csllEfetivo,
        pis: pisEfetivo,
        cofins: cofinsEfetivo,
        iss: issMes,
        total: totalMes,
        irpjBruto: irpjMes,
        csllBruto: csllMes
      });
    }

    // ═══ FIX BUG #3: Usar valores anuais exatos nos totais em vez da soma de parcelas arredondadas ═══
    return {
      meses: meses,
      totalAnual: _r(totalFluxo),
      apuracao: apuracao,
      mediaMensal: _r(totalFluxo / 12),
      // Totais anuais exatos (para evitar diferença de centavos ao somar meses arredondados)
      irpjAnualExato: _r(irpjAnual),
      csllAnualExato: _r(csllAnual),
      pisAnualExato: _r(pisAnual),
      cofinsAnualExato: _r(cofinsAnual)
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER RESULTADOS — PLACEHOLDER PARTE 3
  // ═══════════════════════════════════════════════════════════════════════════

  function renderResultados(r) {
    var d = r.dadosEmpresa;
    var cfg = r.config || CONFIG;
    var container = $("wizardContainer");
    var resContainer = $("resultadosContainer");
    if (!resContainer) {
      resContainer = document.createElement("div");
      resContainer.id = "resultadosContainer";
      if (container && container.parentNode) {
        container.parentNode.insertBefore(resContainer, container.nextSibling);
      } else {
        document.body.appendChild(resContainer);
      }
    }
    if (container) container.style.display = "none";
    resContainer.style.display = "";

    var mesesNome = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    var dataHoje = new Date();
    var dataFormatada = dataHoje.toLocaleDateString("pt-BR");
    var anoBase = d.anoBase || "2026";

    // ═══ Helpers locais ═══
    function _pp(v) { return (v || 0).toFixed(2) + "%"; }
    function _linha(label, valor, artigo, cls) {
      return '<tr class="' + (cls || "") + '"><td>' + label +
        (artigo ? ' <span class="res-artigo">' + artigo + '</span>' : '') +
        '</td><td class="res-valor">' + _m(valor) + '</td></tr>';
    }
    function _linhaPerc(label, valor, cls) {
      return '<tr class="' + (cls || "") + '"><td>' + label + '</td><td class="res-valor">' + _pp(valor) + '</td></tr>';
    }
    function _secao(num, titulo, conteudo) {
      return '<div class="res-section" id="resSecao' + num + '">' +
        '<h2 class="res-section-title"><span class="res-section-num">' + num + '</span> ' + titulo + '</h2>' +
        '<div class="res-section-body">' + conteudo + '</div></div>';
    }

    var html = '';

    // ═══════════════════════════════════════════════════════════════════════
    //  SEÇÃO 1 — CABEÇALHO PROFISSIONAL
    // ═══════════════════════════════════════════════════════════════════════
    var elab = cfg.elaboradoPor || {};
    html += '<div class="res-header">';
    if (cfg.logoURL) {
      html += '<div class="res-logo"><img src="' + cfg.logoURL + '" alt="Logo" style="max-height:60px;"></div>';
    }
    html += '<h1 class="res-title">ESTUDO TRIBUTÁRIO — REGIME DO LUCRO REAL</h1>';
    html += '<div class="res-header-line"></div>';
    html += '<div class="res-company">';
    html += '<div class="res-company-row"><strong>Empresa:</strong> ' + (d.razaoSocial || "—") + '</div>';
    if (d.cnpj) html += '<div class="res-company-row"><strong>CNPJ:</strong> ' + d.cnpj + '</div>';
    if (d.cnaePrincipal) html += '<div class="res-company-row"><strong>CNAE:</strong> ' + d.cnaePrincipal + '</div>';
    html += '<div class="res-company-row"><strong>UF/Município:</strong> ' + (d.uf || "—") + ' / ' + (d.municipio || "—") + ' — ISS: ' + _pp(_n(d.issAliquota)) + '</div>';
    var formaApurLabel = d.apuracaoLR === "trimestral" ? "Trimestral (definitiva)" : d.apuracaoLR === "anual_suspensao" ? "Anual com Suspensão/Redução" : "Anual por Estimativa";
    html += '<div class="res-company-row"><strong>Forma de Apuração:</strong> ' + formaApurLabel + '</div>';
    html += '<div class="res-company-row"><strong>Ano-Base:</strong> ' + anoBase + '</div>';
    html += '</div>';
    if (elab.nome) {
      html += '<div class="res-elaborador">';
      html += '<div><strong>Elaborado por:</strong> ' + elab.nome;
      if (elab.registro) html += ' — ' + elab.registro;
      html += '</div>';
      if (elab.email || elab.telefone) {
        html += '<div><strong>Contato:</strong> ';
        if (elab.email) html += elab.email;
        if (elab.email && elab.telefone) html += ' | ';
        if (elab.telefone) html += elab.telefone;
        html += '</div>';
      }
      html += '<div><strong>Data:</strong> ' + dataFormatada + '</div>';
      html += '</div>';
    }
    if (cfg.mostrarMarcaImpost) {
      html += '<div class="res-powered">Powered by ' + cfg.nomeProduto + ' v' + VERSAO + ' — ' + cfg.subtitulo + '</div>';
    }
    html += '</div>';

    // MELHORIA: Aviso Legal em destaque no INÍCIO do relatório (antes do painel)
    html += '<div class="res-disclaimer-top" style="margin:16px 0;padding:14px 18px;background:#FFF9E6;border-left:4px solid #F39C12;border-radius:4px;font-size:0.92em;color:#666;">';
    html += '<strong style="color:#F39C12;">⚠️ AVISO LEGAL</strong><br>';
    html += cfg.disclaimer;
    html += '<br><span style="font-size:0.85em;color:#999;">Os valores apresentados são estimativas baseadas nos dados informados e na legislação vigente. ' +
      'Não substitui a análise individualizada de profissional contábil/jurídico habilitado. ' +
      'Todos os cálculos devem ser validados antes de qualquer implementação.</span>';
    html += '</div>';

    // ═══════════════════════════════════════════════════════════════════════
    //  SEÇÃO 2 — PAINEL RESUMO (6 Cards)
    // ═══════════════════════════════════════════════════════════════════════
    var res = r.resumo;
    var s2 = '<div class="res-summary">';
    // Card 1 — Economia total
    s2 += '<div class="res-summary-card res-card-hero">' +
      '<div class="res-card-label">ECONOMIA TOTAL IDENTIFICADA</div>' +
      '<div class="res-card-value res-card-economia">' + _m(res.economiaTotal) + '</div>' +
      '<div class="res-card-sub">' + res.numOportunidades + ' oportunidade' + (res.numOportunidades !== 1 ? 's' : '') + ' identificada' + (res.numOportunidades !== 1 ? 's' : '') + '</div>' +
      '</div>';
    // Card 2 — Carga bruta
    s2 += '<div class="res-summary-card">' +
      '<div class="res-card-label">TOTAL DE TRIBUTOS DEVIDOS (Bruto)</div>' +
      '<div class="res-card-value" title="Soma de IRPJ + CSLL + PIS/COFINS + ISS antes de descontar retenções na fonte">' + _m(res.cargaBruta) + '</div>' +
      '<div class="res-card-sub">Mensal: ' + _m(res.cargaBrutaMensal) + '</div>' +
      '</div>';
    // Card 3 — Alíquota efetiva
    s2 += '<div class="res-summary-card">' +
      '<div class="res-card-label">ALÍQUOTA EFETIVA GLOBAL</div>' +
      '<div class="res-card-value">' + _pp(res.aliquotaEfetiva) + '</div>' +
      '<div class="res-card-sub">Carga / Receita Bruta</div>' +
      '</div>';
    // Card 4 — Carga otimizada
    s2 += '<div class="res-summary-card">' +
      '<div class="res-card-label">CARGA OTIMIZADA</div>' +
      '<div class="res-card-value res-card-economia">' + _m(res.cargaOtimizada) + '</div>' +
      '<div class="res-card-sub">Alíquota: ' + _pp(res.aliquotaOtimizada) + '</div>' +
      '</div>';
    // Card 5 — Retenções
    s2 += '<div class="res-summary-card">' +
      '<div class="res-card-label">RETENÇÕES A COMPENSAR</div>' +
      '<div class="res-card-value">' + _m(res.totalRetencoes) + '</div>' +
      '<div class="res-card-sub">IRRF + CSRF + ISS retido</div>' +
      '</div>';
    // Card 6 — Saldo efetivo
    s2 += '<div class="res-summary-card">' +
      '<div class="res-card-label">SALDO FEDERAL A PAGAR</div>' +
      '<div class="res-card-value ' + (res.saldoEfetivo < 0 ? 'res-card-economia' : '') + '">' + _m(res.saldoEfetivo) + '</div>' +
      '<div class="res-card-sub">' + (res.saldoEfetivo < 0 ? 'Saldo negativo — PER/DCOMP' : 'Federal — sem ISS de ' + _m(res.issAnual || 0)) + '</div>' +
      '</div>';
    // Card 7 — Total a Pagar (Líquido de Retenções)
    s2 += '<div class="res-summary-card">' +
      '<div class="res-card-label">TOTAL A PAGAR (Líquido de Retenções)</div>' +
      '<div class="res-card-value" title="Valor efetivo a desembolsar após compensação de retenções sofridas (IRRF, PIS, COFINS e CSLL retidos)">' + _m(res.desembolsoTotal) + '</div>' +
      '<div class="res-card-sub">Inclui ISS municipal de ' + _m(res.issAnual || 0) + '</div>' +
      '</div>';
    s2 += '</div>';
    html += _secao(2, 'Painel Resumo Executivo', s2);

    // ═══════════════════════════════════════════════════════════════════════
    //  SEÇÃO 3 — DRE + LALUR
    // ═══════════════════════════════════════════════════════════════════════
    var dre = r.dre;
    var lalur = r.lalur;
    var s3 = '<div class="res-dre">';
    s3 += '<h3>DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO (DRE)</h3>';
    s3 += '<table class="res-table res-table-dre">';
    s3 += _linha('Receita Bruta', dre.receitaBruta, '', '');
    // CORREÇÃO: Deduções da receita = débitos PIS/COFINS (antes de créditos),
    // pois créditos reduzem o imposto a pagar, não a receita líquida
    var deducoesReceita = r.pisCofins
      ? _r((r.pisCofins.debitoPIS || 0) + (r.pisCofins.debitoCOFINS || 0))
      : (dre.pisCofinsDebitos || 0);
    s3 += _linha('(-) PIS/COFINS sobre Receita', deducoesReceita, 'Lei 10.637/02 + 10.833/03', 'res-sub');
    var receitaLiqDisplay = _r(dre.receitaBruta - deducoesReceita);
    s3 += _linha('= RECEITA LÍQUIDA', receitaLiqDisplay, '', 'res-subtotal');
    // Custos Totais (já inclui pessoal/folha, CMV e serviços de terceiros)
    s3 += _linha('(-) Custos Totais', dre.custosTotais, '', 'res-sub');
    // Sub-itens informativos da composição dos custos
    if (dre.folhaPagamento > 0) s3 += _linha('&emsp;Folha de Pagamento', dre.folhaPagamento, '', 'res-sub');
    if (dre.cmv > 0) s3 += _linha('&emsp;CMV / Custos Operacionais', dre.cmv, '', 'res-sub');
    if (dre.servicosTerceiros > 0) s3 += _linha('&emsp;Serviços de Terceiros', dre.servicosTerceiros, '', 'res-sub');
    // CORREÇÃO BUG 2: Lucro Bruto = Receita Líquida - Custos (não Receita Bruta - Custos)
    s3 += _linha('= LUCRO BRUTO', dre.lucroBruto || _r(receitaLiqDisplay - dre.custosTotais), '', 'res-subtotal');
    // Despesas operacionais (pessoal já nos custos — não duplicar)
    s3 += _linha('(-) Despesas Administrativas e Operacionais', dre.despesasTotais, '', 'res-sub');
    // CORREÇÃO BUG 3: Depreciação subtraída no Lucro Líquido (já incluída no cálculo via dre.lucroLiquido)
    if (dre.depreciacao > 0) s3 += _linha('(-) Depreciação e Amortização', dre.depreciacao, 'Art. 305-329 RIR/2018', 'res-sub');
    if (dre.receitaFinanceiras > 0) s3 += _linha('(+) Receitas Financeiras', dre.receitaFinanceiras, '', 'res-sub');
    s3 += '<tr class="res-total"><td><strong>= LUCRO LÍQUIDO DO EXERCÍCIO</strong></td><td class="res-valor"><strong>' + _m(dre.lucroLiquido) + '</strong></td></tr>';
    s3 += '<tr class="res-info-row"><td colspan="2">Margem de Lucro: ' + _pp(dre.margemLucro) + '</td></tr>';
    s3 += '</table>';

    // LALUR
    s3 += '<h3>LIVRO DE APURAÇÃO DO LUCRO REAL (LALUR — Parte A)</h3>';
    s3 += '<table class="res-table res-table-lalur">';
    s3 += _linha('Lucro Líquido do Exercício', lalur.lucroLiquido, '', '');
    if (lalur.adicoes && lalur.adicoes.length > 0) {
      s3 += '<tr class="res-group-header"><td colspan="2"><strong>(+) ADIÇÕES:</strong></td></tr>';
      lalur.adicoes.forEach(function (a) {
        var tipoTag = a.tipo === 'T' ? ' <span class="res-tag-tipo-t">[Temp.]</span>' : a.tipo === 'C' ? ' <span class="res-tag-tipo-c">[Cond.]</span>' : '';
        s3 += _linha('    ' + a.desc + tipoTag, a.valor, a.artigo, 'res-sub');
      });
      s3 += _linha('= Total de Adições', lalur.totalAdicoes, '', 'res-subtotal');
    }
    if (lalur.exclusoes && lalur.exclusoes.length > 0) {
      s3 += '<tr class="res-group-header"><td colspan="2"><strong>(-) EXCLUSÕES:</strong></td></tr>';
      lalur.exclusoes.forEach(function (e) {
        s3 += _linha('    ' + e.desc, e.valor, e.artigo, 'res-sub');
      });
      s3 += _linha('= Total de Exclusões', lalur.totalExclusoes, '', 'res-subtotal');
    }
    s3 += _linha('= LUCRO ANTES DA COMPENSAÇÃO', lalur.lucroAjustado, '', 'res-subtotal');
    // Compensação de prejuízos
    if (r.compensacao && r.compensacao.resumo) {
      var comp = r.compensacao.resumo;
      if (comp.compensacaoEfetiva && comp.compensacaoEfetiva.prejuizoOperacional > 0) {
        s3 += _linha('(-) Compensação Prejuízo Fiscal (30%)', comp.compensacaoEfetiva.prejuizoOperacional, 'Art. 579-586 RIR/2018', 'res-sub res-economia');
      }
    }
    s3 += '<tr class="res-total res-destaque"><td><strong>= LUCRO REAL</strong></td><td class="res-valor"><strong>' + _m(r.lucroRealFinal) + '</strong></td></tr>';
    s3 += '</table>';
    // CORREÇÃO RJ-04: Nota sobre distinção de prejuízos operacionais vs não-operacionais
    if (r.compensacao && r.compensacao.resumo && r.compensacao.resumo.totalCompensado > 0) {
      s3 += '<div class="res-alerta res-alerta-info" style="margin-top:8px;"><span class="res-alerta-icon">&#x1F535;</span>' +
        '<strong>Nota sobre compensação de prejuízos:</strong> ' +
        'A trava de 30% foi aplicada corretamente. Contudo, observe que prejuízos <em>não-operacionais</em> ' +
        'só podem ser compensados com lucros não-operacionais futuros (Art. 511, RIR/2018). ' +
        'Este estudo trata o saldo de prejuízo informado como uma massa única. ' +
        'Se houver parcela de prejuízo não-operacional, a compensação efetiva pode ser menor. ' +
        'Consulte a ECF para segregação.</div>';
    }
    s3 += '</div>';
    html += _secao(3, 'Demonstração do Resultado e Apuração do Lucro Real', s3);

    // ═══════════════════════════════════════════════════════════════════════
    //  SEÇÃO NOVA 1 — DIAGNÓSTICO DE DESPESAS COM LIMITES LEGAIS
    // ═══════════════════════════════════════════════════════════════════════
    var vdl = r.validacaoDespesasLimites;
    if (vdl && (vdl.doacoes || vdl.previdencia || vdl.royalties)) {
      var sN1 = '';
      var houveExcesso = false;
      sN1 += '<table class="res-table"><thead><tr><th>Despesa</th><th>Valor Informado</th><th>Limite Legal</th><th>Excesso Indedutível</th></tr></thead><tbody>';
      if (vdl.doacoes) {
        var limDoacoes = (LR.despesasComLimites && LR.despesasComLimites.doacoes) ? LR.despesasComLimites.doacoes : {};
        var excD = (vdl.doacoes.excesso || vdl.doacoes.excedenteTotal || 0);
        if (excD > 0) houveExcesso = true;
        sN1 += '<tr' + (excD > 0 ? ' style="color:#E74C3C;"' : '') + '><td>Doações (operacionais + OSCIP + ensino)';
        if (limDoacoes.operacionais) sN1 += ' <span class="res-artigo">' + limDoacoes.operacionais.artigo + ' — limite ' + ((limDoacoes.operacionais.limite || 0.02) * 100) + '% do lucro oper.</span>';
        sN1 += '</td><td class="res-valor">' + _m(vdl.doacoes.totalInformado || 0) + '</td><td class="res-valor">' + _m(vdl.doacoes.limiteCalculado || vdl.doacoes.limiteTotal || 0) + '</td><td class="res-valor">' + (excD > 0 ? '⚠️ ' + _m(excD) : '✅ —') + '</td></tr>';
      }
      if (vdl.previdencia) {
        var limPrev = (LR.despesasComLimites && LR.despesasComLimites.previdenciaComplementar) ? LR.despesasComLimites.previdenciaComplementar : {};
        var excP = (vdl.previdencia.excesso || vdl.previdencia.excedente || 0);
        if (excP > 0) houveExcesso = true;
        sN1 += '<tr' + (excP > 0 ? ' style="color:#E74C3C;"' : '') + '><td>Previdência Complementar Patronal';
        if (limPrev.artigo) sN1 += ' <span class="res-artigo">' + limPrev.artigo + ' — limite ' + ((limPrev.limite || 0.20) * 100) + '% da folha</span>';
        sN1 += '</td><td class="res-valor">' + _m(vdl.previdencia.contribuicao || vdl.previdencia.totalInformado || 0) + '</td><td class="res-valor">' + _m(vdl.previdencia.limite || vdl.previdencia.limiteCalculado || 0) + '</td><td class="res-valor">' + (excP > 0 ? '⚠️ ' + _m(excP) : '✅ —') + '</td></tr>';
      }
      if (vdl.royalties) {
        var limRoy = (LR.despesasComLimites && LR.despesasComLimites.royalties) ? LR.despesasComLimites.royalties : {};
        var excR = (vdl.royalties.excesso || vdl.royalties.excedente || 0);
        if (excR > 0) houveExcesso = true;
        sN1 += '<tr' + (excR > 0 ? ' style="color:#E74C3C;"' : '') + '><td>Royalties e Assistência Técnica';
        if (limRoy.artigo) sN1 += ' <span class="res-artigo">' + limRoy.artigo + ' — limite ' + ((limRoy.limiteGeral || 0.05) * 100) + '% da receita líq.</span>';
        sN1 += '</td><td class="res-valor">' + _m(vdl.royalties.royaltiesPagos || vdl.royalties.totalInformado || 0) + '</td><td class="res-valor">' + _m(vdl.royalties.limite || vdl.royalties.limiteCalculado || 0) + '</td><td class="res-valor">' + (excR > 0 ? '⚠️ ' + _m(excR) : '✅ —') + '</td></tr>';
      }
      sN1 += '</tbody></table>';
      if (houveExcesso) {
        sN1 += '<div class="res-alerta res-alerta-aviso"><span class="res-alerta-icon">&#x1F7E1;</span>Excessos identificados foram adicionados automaticamente ao LALUR como despesas indedutíveis.</div>';
      } else {
        sN1 += '<div class="res-alerta res-alerta-economia"><span class="res-alerta-icon">&#x1F7E2;</span>✅ Todas as despesas dentro dos limites legais.</div>';
      }
      html += _secao('A', 'Diagnóstico de Despesas com Limites Legais', sN1);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SEÇÃO NOVA 2 — DESPESAS INDEDUTÍVEIS IDENTIFICADAS
    // ═══════════════════════════════════════════════════════════════════════
    var despInded = r.despesasIndedutivelDetalhe;
    if (despInded && despInded.length > 0) {
      var sN2 = '';
      var totalInded = 0;
      var totalImpacto = 0;
      sN2 += '<table class="res-table"><thead><tr><th>Despesa</th><th>Artigo</th><th>Valor Informado</th><th>Impacto Fiscal (34%)</th></tr></thead><tbody>';
      despInded.forEach(function (di) {
        var impacto = _r((di.valor || 0) * 0.34);
        totalInded += (di.valor || 0);
        totalImpacto += impacto;
        // Lookup da descrição no mapeamento
        var descMapa = di.descricao || di.desc || '';
        var artigoMapa = di.artigo || '';
        if (!descMapa && LR.despesasIndedutiveis) {
          for (var dii = 0; dii < LR.despesasIndedutiveis.length; dii++) {
            if (LR.despesasIndedutiveis[dii].id === di.id) {
              descMapa = LR.despesasIndedutiveis[dii].descricao;
              artigoMapa = LR.despesasIndedutiveis[dii].artigo;
              break;
            }
          }
        }
        sN2 += '<tr><td>' + descMapa + '</td><td><span class="res-artigo">' + artigoMapa + '</span></td><td class="res-valor">' + _m(di.valor) + '</td><td class="res-valor" style="color:#E74C3C;">' + _m(impacto) + '</td></tr>';
      });
      sN2 += '<tr class="res-total"><td colspan="2"><strong>Total de adições por despesas indedutíveis</strong></td><td class="res-valor"><strong>' + _m(totalInded) + '</strong></td><td class="res-valor" style="color:#E74C3C;"><strong>' + _m(totalImpacto) + '</strong></td></tr>';
      sN2 += '</tbody></table>';
      html += _secao('B', 'Despesas Indedutíveis Identificadas', sN2);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SEÇÃO NOVA 3 — ANÁLISE DE SUBCAPITALIZAÇÃO
    // ═══════════════════════════════════════════════════════════════════════
    if (r.subcapResult) {
      var sN3 = '';
      if (r.subcapResult.excedeu) {
        sN3 += '<div class="res-alerta res-alerta-critico"><span class="res-alerta-icon">&#x1F534;</span><strong>ATENÇÃO:</strong> Juros indedutíveis por subcapitalização: <strong>' + _m(r.subcapResult.jurosIndedutiveis || 0) + '</strong></div>';
        // Detalhamento dos limites violados
        sN3 += '<table class="res-table"><thead><tr><th>Limite</th><th>Regra</th><th>Status</th></tr></thead><tbody>';
        if (LR.subcapitalizacao) {
          if (LR.subcapitalizacao.vinculadaComParticipacao) {
            sN3 += '<tr><td>Vinculada c/ participação <span class="res-artigo">' + LR.subcapitalizacao.vinculadaComParticipacao.artigo + '</span></td><td>' + LR.subcapitalizacao.vinculadaComParticipacao.descricao + '</td><td style="color:#E74C3C;">Excedido</td></tr>';
          }
          if (LR.subcapitalizacao.paraisoFiscal) {
            sN3 += '<tr><td>Paraíso Fiscal <span class="res-artigo">' + LR.subcapitalizacao.paraisoFiscal.artigo + '</span></td><td>' + LR.subcapitalizacao.paraisoFiscal.descricao + '</td><td>' + (r.subcapResult.paraisoFiscalExcedeu ? '<span style="color:#E74C3C;">Excedido</span>' : '✅ OK') + '</td></tr>';
          }
        }
        sN3 += '</tbody></table>';
        sN3 += '<div class="res-alerta res-alerta-info"><span class="res-alerta-icon">&#x1F535;</span><strong>Base Legal:</strong> Art. 249-251 do RIR/2018. <strong>Ação recomendada:</strong> Reestruturar dívida para reduzir proporção dívida/PL.</div>';
      } else {
        sN3 += '<div class="res-alerta res-alerta-economia"><span class="res-alerta-icon">&#x1F7E2;</span>✅ Dívidas com vinculadas dentro dos limites de subcapitalização.</div>';
      }
      html += _secao('C', 'Análise de Subcapitalização', sN3);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SEÇÃO NOVA 4 — ALERTAS DE COMPLIANCE E OMISSÃO DE RECEITA
    // ═══════════════════════════════════════════════════════════════════════
    if (r.omissaoResult && r.omissaoResult.indicadores && r.omissaoResult.indicadores.length > 0) {
      var sN4 = '';
      r.omissaoResult.indicadores.forEach(function (ind) {
        var gravIcon = ind.gravidade === 'CRITICO' ? '&#x1F534;' : ind.gravidade === 'ALTO' ? '&#x1F7E0;' : '&#x1F7E1;';
        var gravCls = ind.gravidade === 'CRITICO' ? 'res-alerta-critico' : ind.gravidade === 'ALTO' ? 'res-alerta-aviso' : 'res-alerta-info';
        // Lookup no mapeamento
        var descOm = ind.descricao || '';
        var artigoOm = ind.artigo || '';
        if (LR.indicadoresOmissao) {
          for (var oi = 0; oi < LR.indicadoresOmissao.length; oi++) {
            if (LR.indicadoresOmissao[oi].id === ind.id) {
              descOm = descOm || LR.indicadoresOmissao[oi].descricao;
              artigoOm = artigoOm || LR.indicadoresOmissao[oi].artigo;
              break;
            }
          }
        }
        sN4 += '<div class="res-alerta ' + gravCls + '"><span class="res-alerta-icon">' + gravIcon + '</span>';
        sN4 += '<strong>' + descOm + '</strong>';
        if (artigoOm) sN4 += ' <span class="res-artigo">' + artigoOm + '</span>';
        if (ind.resolucao) sN4 += '<br><em>Resolução: ' + ind.resolucao + '</em>';
        sN4 += '</div>';
      });
      html += _secao('D', 'Alertas de Compliance e Omissão de Receita', sN4);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SEÇÃO NOVA 5 — AMORTIZAÇÃO, EXAUSTÃO E PRÉ-OPERACIONAIS
    // ═══════════════════════════════════════════════════════════════════════
    if (r.goodwillResult || r.exaustaoResult || r.preOperacionalResult) {
      var sN5 = '';
      sN5 += '<table class="res-table"><thead><tr><th>Item</th><th>Valor Original</th><th>Dedução Anual</th><th>Economia Fiscal (34%)</th><th>Base Legal</th></tr></thead><tbody>';
      if (r.goodwillResult) {
        var gwDeducao = r.goodwillResult.amortizacaoAnual || r.goodwillResult.deducaoAnual || 0;
        var gwEcon = _r(gwDeducao * 0.34);
        sN5 += '<tr><td>Goodwill (ágio por rentabilidade)</td><td class="res-valor">' + _m(r.goodwillResult.valorGoodwill || _n(d.valorGoodwill)) + '</td><td class="res-valor">' + _m(gwDeducao) + '</td><td class="res-valor res-economia">' + _m(gwEcon) + '</td><td><span class="res-artigo">Lei 12.973/2014, Art. 20-22</span></td></tr>';
      }
      if (r.exaustaoResult) {
        var exDeducao = r.exaustaoResult.exaustaoAnual || r.exaustaoResult.deducaoAnual || 0;
        var exEcon = _r(exDeducao * 0.34);
        sN5 += '<tr><td>Exaustão de Recursos Naturais</td><td class="res-valor">' + _m(r.exaustaoResult.custoAquisicao || _n(d.valorRecursosNaturais)) + '</td><td class="res-valor">' + _m(exDeducao) + '</td><td class="res-valor res-economia">' + _m(exEcon) + '</td><td><span class="res-artigo">Art. 334-337 RIR/2018</span></td></tr>';
      }
      if (r.preOperacionalResult) {
        var poDeducao = r.preOperacionalResult.amortizacaoAnual || r.preOperacionalResult.deducaoAnual || 0;
        var poEcon = _r(poDeducao * 0.34);
        sN5 += '<tr><td>Despesas Pré-Operacionais</td><td class="res-valor">' + _m(r.preOperacionalResult.valorTotal || _n(d.despesasPreOperacionais)) + '</td><td class="res-valor">' + _m(poDeducao) + '</td><td class="res-valor res-economia">' + _m(poEcon) + '</td><td><span class="res-artigo">Art. 11 Lei 12.973</span></td></tr>';
      }
      sN5 += '</tbody></table>';
      html += _secao('E', 'Amortização, Exaustão e Pré-Operacionais', sN5);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SEÇÃO 4 — CÁLCULO DETALHADO DE CADA TRIBUTO
    // ═══════════════════════════════════════════════════════════════════════
    var s4 = '<div class="res-detail-grid">';

    // 4.1 — IRPJ
    s4 += '<div class="res-detail-card">';
    s4 += '<h3>4.1 — IRPJ <span class="res-artigo">Art. 225 do RIR/2018</span></h3>';
    s4 += '<table class="res-table">';
    // CORREÇÃO FALHA #1: Exibir lucroAjustado (ANTES compensação), não lucroRealFinal (APÓS)
    var lucroAjustadoDisplay = (r.lalur && r.lalur.lucroAjustado !== undefined) ? r.lalur.lucroAjustado : r.lucroRealFinal;
    var baseIRPJDisplay = (r.irpj && r.irpj.lucroReal !== undefined) ? r.irpj.lucroReal : r.lucroRealFinal;
    s4 += _linha('Lucro Ajustado (antes compensação)', lucroAjustadoDisplay, '', '');
    if (r.irpj && r.irpj.compensacaoPrejuizo > 0) {
      s4 += _linha('(-) Compensação de Prejuízo Fiscal (30%)', r.irpj.compensacaoPrejuizo, 'Art. 580-586', 'res-sub res-economia');
    } else if (r.compensacao && r.compensacao.resumo && r.compensacao.resumo.totalCompensado > 0) {
      s4 += _linha('(-) Compensação de Prejuízo Fiscal (30%)', r.compensacao.resumo.totalCompensado, 'Art. 580-586', 'res-sub res-economia');
    }
    s4 += _linha('= Lucro Real (base de cálculo IRPJ)', baseIRPJDisplay, '', 'res-subtotal');
    if (r.irpj) {
      // CORREÇÃO FALHA #9: Usar baseIRPJDisplay (base de cálculo correta) no fallback, evitando centavo de arredondamento
      s4 += _linha('IRPJ Normal (15%)', r.irpj.irpjNormal || _r(baseIRPJDisplay * 0.15), 'Art. 225', '');
      s4 += _linha('Adicional (10% sobre excedente R$ 240.000)', r.irpj.adicional || r.irpj.irpjAdicional || 0, 'Art. 228', '');
      s4 += _linha('= IRPJ Bruto', r.irpjAntesReducao, '', 'res-subtotal');
      if (r.irpj.deducaoIncentivos > 0 || (r.incentivosFiscais && r.incentivosFiscais.totalDeducaoFinal > 0)) {
        s4 += _linha('(-) Deduções por Incentivos Fiscais', r.irpj.deducaoIncentivos || r.incentivosFiscais.totalDeducaoFinal, 'Art. 641', 'res-sub res-economia');
      }
      if (r.reducaoSUDAM > 0) {
        s4 += _linha('(-) Redução SUDAM/SUDENE (75%)', r.reducaoSUDAM, 'Art. 627-637', 'res-sub res-economia');
      }
      s4 += _linha('= IRPJ após Reduções', r.irpjAposReducao, '', 'res-subtotal');
      var totalIRRF = _n(d.irrfRetidoPrivado) + _n(d.irrfRetidoPublico);
      if (totalIRRF > 0) {
        s4 += _linha('(-) IRRF Retido na Fonte', totalIRRF, '', 'res-sub');
      }
      var estimIRPJ = _n(d.estimativasIRPJPagas);
      if (estimIRPJ > 0) {
        s4 += _linha('(-) Estimativas de IRPJ Pagas', estimIRPJ, '', 'res-sub');
      }
      var saldoIRPJ = _r(r.irpjAposReducao - totalIRRF - estimIRPJ);
      s4 += '<tr class="res-total"><td><strong>' + (saldoIRPJ >= 0 ? '= IRPJ A PAGAR' : '= SALDO NEGATIVO IRPJ') + '</strong></td><td class="res-valor"><strong>' + _m(saldoIRPJ) + '</strong></td></tr>';
    }
    s4 += '</table></div>';

    // 4.2 — CSLL
    s4 += '<div class="res-detail-card">';
    s4 += '<h3>4.2 — CSLL <span class="res-artigo">Lei 7.689/1988</span></h3>';
    s4 += '<table class="res-table">';
    if (r.csll) {
      var aliqCSLL = r.csll.aliquota || (d.ehFinanceira ? 0.15 : 0.09);
      // CORREÇÃO BUG 4: Exibir base pós-compensação para CSLL
      var baseCSLLDisplay = (r.csll.baseCalculo !== undefined) ? r.csll.baseCalculo : r.baseCSLLFinal;
      s4 += _linha('Base de cálculo CSLL', baseCSLLDisplay, '', '');
      if (r.csll.compensacao > 0) {
        s4 += _linha('(-) Compensação Base Negativa (30%)', r.csll.compensacao, 'Art. 580-586', 'res-sub res-economia');
      } else if (r.compensacao && r.compensacao.resumo && r.compensacao.resumo.compensacaoEfetiva && r.compensacao.resumo.compensacaoEfetiva.baseNegativaCSLL > 0) {
        s4 += _linha('(-) Compensação Base Negativa (30%)', r.compensacao.resumo.compensacaoEfetiva.baseNegativaCSLL, 'Art. 580-586', 'res-sub res-economia');
      }
      // CORREÇÃO BUG 5: Usar _linhaPerc em vez de _linha para alíquota (evita prefixo "R$" em valor percentual)
      s4 += _linhaPerc('Alíquota CSLL', aliqCSLL * 100, '');
      s4 += '<tr><td>CSLL (' + _pp(aliqCSLL * 100) + ')</td><td class="res-valor">' + _m(r.csll.csllDevida) + '</td></tr>';
      var csllRetida = _n(d.csllRetido);
      if (csllRetida > 0) s4 += _linha('(-) CSLL Retida na Fonte', csllRetida, '', 'res-sub');
      var estimCSLL = _n(d.estimativasCSLLPagas);
      if (estimCSLL > 0) s4 += _linha('(-) Estimativas CSLL Pagas', estimCSLL, '', 'res-sub');
      var saldoCSLL = _r(r.csll.csllDevida - csllRetida - estimCSLL);
      s4 += '<tr class="res-total"><td><strong>' + (saldoCSLL >= 0 ? '= CSLL A PAGAR' : '= SALDO NEGATIVO CSLL') + '</strong></td><td class="res-valor"><strong>' + _m(saldoCSLL) + '</strong></td></tr>';
    }
    s4 += '</table></div>';

    // 4.3 — PIS/COFINS
    s4 += '<div class="res-detail-card res-detail-wide">';
    s4 += '<h3>4.3 — PIS/COFINS Não-Cumulativo <span class="res-artigo">Lei 10.637/02 + Lei 10.833/03</span></h3>';
    s4 += '<table class="res-table">';
    if (r.pisCofins) {
      var pc = r.pisCofins;
      s4 += _linha('Receita Bruta', dre.receitaBruta, '', '');
      if (pc.receitasIsentas > 0) s4 += _linha('(-) Receitas Isentas/Suspensas', pc.receitasIsentas, '', 'res-sub');
      s4 += _linha('= Receita Tributável', pc.receitaTributavel || _r(dre.receitaBruta - (pc.receitasIsentas || 0)), '', 'res-subtotal');
      s4 += '<tr class="res-group-header"><td colspan="2"><strong>DÉBITOS:</strong></td></tr>';
      s4 += _linha('    PIS (1,65%)', pc.debitoPIS || pc.debitos.pis, 'Art. 2º, Lei 10.637/02', 'res-sub');
      s4 += _linha('    COFINS (7,60%)', pc.debitoCOFINS || pc.debitos.cofins, 'Art. 2º, Lei 10.833/03', 'res-sub');
      s4 += _linha('= Total Débitos', _r((pc.debitoPIS || pc.debitos.pis || 0) + (pc.debitoCOFINS || pc.debitos.cofins || 0)), '', 'res-subtotal');
      s4 += '<tr class="res-group-header"><td colspan="2"><strong>CRÉDITOS:</strong></td></tr>';
      // Listar créditos detalhados se disponíveis
      if (pc.creditosDetalhe && pc.creditosDetalhe.length > 0) {
        pc.creditosDetalhe.forEach(function (cr) {
          if (cr.valor > 0) s4 += _linha('    ' + cr.descricao, cr.valor, cr.artigo || 'Art. 3º', 'res-sub res-economia');
        });
      } else {
        s4 += _linha('    Crédito PIS (1,65%)', pc.creditoPIS || pc.creditos.pis, 'Art. 3º', 'res-sub res-economia');
        s4 += _linha('    Crédito COFINS (7,60%)', pc.creditoCOFINS || pc.creditos.cofins, 'Art. 3º', 'res-sub res-economia');
      }
      s4 += _linha('= Total Créditos', _r((pc.creditoPIS || pc.creditos.pis || 0) + (pc.creditoCOFINS || pc.creditos.cofins || 0)), '', 'res-subtotal res-economia');
      // Retenções PIS/COFINS
      var pisRetido = _n(d.pisRetido);
      var cofinsRetido = _n(d.cofinsRetido);
      if (pisRetido > 0) s4 += _linha('(-) PIS Retido na Fonte', pisRetido, '', 'res-sub');
      if (cofinsRetido > 0) s4 += _linha('(-) COFINS Retido na Fonte', cofinsRetido, '', 'res-sub');
      var pisCofinsLiquido = _r(Math.max(pc.totalAPagarBruto - pisRetido - cofinsRetido, 0));
      s4 += '<tr class="res-total"><td><strong>' + (pisCofinsLiquido >= 0 ? '= PIS/COFINS A PAGAR' : '= SALDO CREDOR PIS/COFINS') + '</strong></td><td class="res-valor"><strong>' + _m(pisCofinsLiquido) + '</strong></td></tr>';
      s4 += '<tr class="res-info-row"><td colspan="2">Alíquota Efetiva: ' + _pp(_r(pisCofinsLiquido / (dre.receitaBruta || 1) * 100)) + ' (nominal: 9,25%)</td></tr>';
    }
    s4 += '</table></div>';

    // 4.4 — ISS
    s4 += '<div class="res-detail-card">';
    s4 += '<h3>4.4 — ISS <span class="res-artigo">LC 116/2003</span></h3>';
    s4 += '<table class="res-table">';
    if (r.iss) {
      s4 += _linha('Receita de Serviços', r.iss.receitaServicos, '', '');
      s4 += '<tr><td>Município: ' + r.iss.municipio + '</td><td class="res-valor">Alíquota: ' + _pp(r.iss.aliquota) + '</td></tr>';
      s4 += '<tr class="res-total"><td><strong>= ISS Anual</strong></td><td class="res-valor"><strong>' + _m(r.iss.issAnual) + '</strong></td></tr>';
      s4 += '<tr class="res-info-row"><td><strong>ISS Mensal</strong></td><td class="res-valor">' + _m(r.iss.issMensal) + '</td></tr>';
      var issRetido = _n(d.issRetido);
      if (issRetido > 0) s4 += _linha('(-) ISS Retido na Fonte', issRetido, '', 'res-sub');
    }
    s4 += '</table></div>';

    s4 += '</div>'; // fecha res-detail-grid
    html += _secao(4, 'Cálculo Detalhado de Cada Tributo', s4);

    // ═══════════════════════════════════════════════════════════════════════
    //  SEÇÃO 5 — COMPOSIÇÃO DA CARGA TRIBUTÁRIA
    // ═══════════════════════════════════════════════════════════════════════
    var comp = r.composicao;
    var s5 = '';

    // Barra visual
    var totalComp = (comp.irpj.valor || 0) + (comp.csll.valor || 0) + (comp.pisCofins.valor || 0) + (comp.iss.valor || 0);
    if (totalComp > 0) {
      var pIRPJ = _r((comp.irpj.valor / totalComp) * 100);
      var pCSLL = _r((comp.csll.valor / totalComp) * 100);
      var pPC = _r((comp.pisCofins.valor / totalComp) * 100);
      var pISS = _r(100 - pIRPJ - pCSLL - pPC);

      s5 += '<div class="res-composicao-visual">';
      s5 += '<div class="res-comp-bar">';
      if (pIRPJ > 0) s5 += '<div class="res-comp-seg" style="width:' + pIRPJ + '%;background:#E74C3C;" title="IRPJ: ' + _pp(pIRPJ) + '">IRPJ</div>';
      if (pCSLL > 0) s5 += '<div class="res-comp-seg" style="width:' + pCSLL + '%;background:#F39C12;" title="CSLL: ' + _pp(pCSLL) + '">CSLL</div>';
      if (pPC > 0) s5 += '<div class="res-comp-seg" style="width:' + pPC + '%;background:#3498DB;" title="PIS/COFINS: ' + _pp(pPC) + '">PIS/COF</div>';
      if (pISS > 0) s5 += '<div class="res-comp-seg" style="width:' + pISS + '%;background:#9B59B6;" title="ISS: ' + _pp(pISS) + '">ISS</div>';
      s5 += '</div></div>';
    }

    // Gráfico Pizza
    s5 += '<div class="res-chart-container"><canvas id="chartComposicao" width="350" height="350"></canvas></div>';

    // Tabela de composição — usar bases pós-compensação para alíquota efetiva
    var compBaseIRPJ = (r.irpj && r.irpj.lucroReal !== undefined) ? r.irpj.lucroReal : r.lucroRealFinal;
    var compBaseCSLL = (r.csll && r.csll.baseCalculo !== undefined) ? r.csll.baseCalculo : (r.baseCSLLFinal || r.lucroRealFinal);
    s5 += '<table class="res-table">';
    s5 += '<thead><tr><th>Tributo</th><th>Base</th><th>Alíq. Efetiva</th><th>Anual</th><th>Mensal</th><th>% Carga</th></tr></thead>';
    s5 += '<tbody>';
    s5 += '<tr><td style="color:#E74C3C;">IRPJ</td><td>' + _m(compBaseIRPJ) + '</td><td>' + _pp(compBaseIRPJ > 0 ? _r(comp.irpj.valor / compBaseIRPJ * 100) : 0) + '</td><td>' + _m(comp.irpj.valor) + '</td><td>' + _m(_r(comp.irpj.valor / 12)) + '</td><td>' + _pp(comp.irpj.percentual) + '</td></tr>';
    s5 += '<tr><td style="color:#F39C12;">CSLL</td><td>' + _m(compBaseCSLL) + '</td><td>' + _pp(compBaseCSLL > 0 ? _r(comp.csll.valor / compBaseCSLL * 100) : 0) + '</td><td>' + _m(comp.csll.valor) + '</td><td>' + _m(_r(comp.csll.valor / 12)) + '</td><td>' + _pp(comp.csll.percentual) + '</td></tr>';
    // CORREÇÃO FALHA #2: alíquota efetiva LÍQUIDA (após retenções e créditos)
    var pcValorBruto = comp.pisCofins.valor; // bruto para consistência com cargaBruta
    var pcAliqEfetivaLiquida = dre.receitaBruta > 0 ? _pp(_r(r.pisCofins.totalAPagarLiquido / dre.receitaBruta * 100)) : '0,00%';
    var pcAliqDisplay = r.pisCofins.aliquotaEfetiva || pcAliqEfetivaLiquida;
    s5 += '<tr><td style="color:#3498DB;">PIS/COFINS</td><td>' + _m(dre.receitaBruta) + '</td><td>' + pcAliqDisplay + '</td><td>' + _m(pcValorBruto) + '</td><td>' + _m(_r(pcValorBruto / 12)) + '</td><td>' + _pp(comp.pisCofins.percentual) + '</td></tr>';
    s5 += '<tr><td style="color:#9B59B6;">ISS</td><td>' + _m(r.iss.receitaServicos) + '</td><td>' + _pp(r.iss.aliquota) + '</td><td>' + _m(comp.iss.valor) + '</td><td>' + _m(_r(comp.iss.valor / 12)) + '</td><td>' + _pp(comp.iss.percentual) + '</td></tr>';
    s5 += '</tbody>';
    s5 += '<tfoot><tr class="res-total"><td><strong>TOTAL</strong></td><td></td><td><strong>' + _pp(res.aliquotaEfetiva) + '</strong></td><td><strong>' + _m(res.cargaBruta) + '</strong></td><td><strong>' + _m(res.cargaBrutaMensal) + '</strong></td><td><strong>100%</strong></td></tr></tfoot>';
    s5 += '</table>';
    // ═══ FIX BUG #4: Nota explicativa sobre bases de cálculo das alíquotas efetivas ═══
    s5 += '<p class="res-nota">* <strong>Nota sobre alíquotas efetivas:</strong> Na tabela acima, a alíquota efetiva de cada tributo é calculada sobre sua respectiva base de cálculo (Lucro Real para IRPJ/CSLL, Receita Bruta para PIS/COFINS, Receita de Serviços para ISS). A <strong>Alíquota Efetiva Global</strong> no rodapé (' + _pp(res.aliquotaEfetiva) + ') é calculada sobre a <strong>Receita Bruta Total</strong> (' + _m(dre.receitaBruta) + ').</p>';
    // FALHA #2 nota: esclarecer que PIS/COFINS exibe alíquota líquida (após créditos e retenções)
    s5 += '<p class="res-nota">* A alíquota efetiva de PIS/COFINS exibida é <strong>líquida</strong> (após créditos e retenções). Alíquota bruta (antes de créditos): <strong>' + (r.pisCofins.aliquotaEfetivaBruta || '—') + '</strong></p>';
    // BUG#1 — notas de valores líquidos (após retenções) para transparência
    var _pisCofinsLiqS5 = _r(Math.max(pcValorBruto - _n(d.pisRetido) - _n(d.cofinsRetido), 0));
    var _csllLiqS5 = _r(Math.max(_n(comp.csll.valor) - _n(d.csllRetido), 0));
    if (_n(d.pisRetido) + _n(d.cofinsRetido) > 0) {
      s5 += '<p class="res-nota">* PIS/COFINS a pagar líquido (após retenções na fonte de ' + _m(_n(d.pisRetido) + _n(d.cofinsRetido)) + '): <strong>' + _m(_pisCofinsLiqS5) + '</strong></p>';
    }
    if (_n(d.csllRetido) > 0) {
      s5 += '<p class="res-nota">* CSLL a pagar líquida (após CSLL retida ' + _m(_n(d.csllRetido)) + '): <strong>' + _m(_csllLiqS5) + '</strong></p>';
    }
    html += _secao(5, 'Composição da Carga Tributária', s5);

    // ═══════════════════════════════════════════════════════════════════════
    //  SEÇÃO 6 — MAPA DA ECONOMIA (Antes × Depois)
    // ═══════════════════════════════════════════════════════════════════════
    var eco = r.economia;
    var s6 = '<div class="res-mapa-economia">';
    // Antes vs Depois
    s6 += '<div class="res-mapa-row">';
    s6 += '<div class="res-mapa-card res-mapa-antes"><div class="res-mapa-card-label">SEM Otimização</div><div class="res-mapa-card-value">' + _m(res.cargaBruta) + '</div><div class="res-mapa-card-sub">Alíquota: ' + _pp(res.aliquotaEfetiva) + '</div></div>';
    s6 += '<div class="res-mapa-seta"><div class="res-mapa-seta-valor">- ' + _m(eco.total) + '</div><div class="res-mapa-seta-icon">→</div></div>';
    s6 += '<div class="res-mapa-card res-mapa-depois"><div class="res-mapa-card-label">COM Otimização</div><div class="res-mapa-card-value">' + _m(res.cargaOtimizada) + '</div><div class="res-mapa-card-sub">Alíquota: ' + _pp(res.aliquotaOtimizada) + '</div></div>';
    s6 += '</div>';

    // Breakdown das economias
    // Breakdown separado: Planejamento vs Já Incorporados
    s6 += '<div class="res-mapa-breakdown">';
    var temAdicionais = (eco.jcp > 0 || eco.sudam > 0 || eco.incentivos > 0 || eco.gratificacao > 0 || eco.cprb > 0);
    if (temAdicionais) {
      s6 += '<h4>💡 Economias por Ação de Planejamento Tributário</h4>';
      s6 += '<p style="font-size:0.82em;color:#8892b0;margin-bottom:8px;">Estratégias que você pode implementar para reduzir a carga:</p>';
      s6 += '<table class="res-table">';
      if (eco.jcp > 0) s6 += _linha('JCP — Juros sobre Capital Próprio', eco.jcp, 'Art. 355-358', 'res-economia');
      if (eco.sudam > 0) s6 += _linha('Redução SUDAM/SUDENE (75%)', eco.sudam, 'Art. 627-637', 'res-economia');
      if (eco.incentivos > 0) s6 += _linha('Incentivos Fiscais (PAT, FIA, etc.)', eco.incentivos, 'Art. 641', 'res-economia');
      if (eco.gratificacao > 0) s6 += _linha('Conversão Gratificação → Pró-labore', eco.gratificacao, 'Art. 358, §1º', 'res-economia');
      if (eco.cprb > 0) s6 += _linha('CPRB — Desoneração da Folha', eco.cprb, 'Lei 12.546/2011', 'res-economia');
      var subPlan = _r((eco.jcp || 0) + (eco.sudam || 0) + (eco.incentivos || 0) + (eco.gratificacao || 0) + (eco.cprb || 0));
      s6 += '<tr class="res-total res-economia"><td><strong>SUBTOTAL PLANEJAMENTO</strong></td><td class="res-valor"><strong>' + _m(subPlan) + '</strong></td></tr>';
      s6 += '</table>';
    }
    var temEmbutidas = (eco.depreciacao > 0 || eco.pisCofinsCreditos > 0 || eco.pddFiscal > 0 || eco.prejuizo > 0);
    if (temEmbutidas) {
      s6 += '<h4 style="margin-top:16px;">✅ Economias Já Incorporadas na Carga Base</h4>';
      s6 += '<p style="font-size:0.82em;color:#8892b0;margin-bottom:8px;">Direitos legais e créditos já refletidos no cálculo:</p>';
      s6 += '<table class="res-table">';
      if (eco.depreciacao > 0) s6 += _linha('Economia Fiscal de Depreciação', eco.depreciacao, 'Art. 305-329', 'res-economia');
      if (eco.pisCofinsCreditos > 0) s6 += _linha('Créditos PIS/COFINS (não-cumulativo)', eco.pisCofinsCreditos, 'Art. 3º', 'res-economia');
      if (eco.pddFiscal > 0) s6 += _linha('PDD Fiscal — Perdas no Recebimento', eco.pddFiscal, 'Art. 340-342', 'res-economia');
      if (eco.prejuizo > 0) s6 += _linha('Compensação de Prejuízo Fiscal', eco.prejuizo, 'Art. 579-586', 'res-economia');
      var subEmb = _r((eco.depreciacao || 0) + (eco.pisCofinsCreditos || 0) + (eco.pddFiscal || 0) + (eco.prejuizo || 0));
      s6 += '<tr class="res-total"><td><strong>SUBTOTAL JÁ APLICADO</strong></td><td class="res-valor"><strong>' + _m(subEmb) + '</strong></td></tr>';
      s6 += '</table>';
    }
    s6 += '<div style="margin-top:12px;padding:12px 16px;background:rgba(16,185,129,0.1);border-radius:8px;text-align:center;">';
    s6 += '<div style="font-size:0.85em;color:#666;">ECONOMIA TOTAL (Planejamento + Direitos Legais)</div>';
    s6 += '<div style="font-size:1.4em;font-weight:700;color:#10b981;">' + _m(eco.total) + '</div>';
    s6 += '</div>';
    s6 += '</div>';

    // Projeções acumuladas
    if (r.projecao && r.projecao.projecaoCarga) {
      s6 += '<div class="res-mapa-projecoes"><h4>Projeção de Economia Acumulada</h4>';
      s6 += '<table class="res-table"><thead><tr><th>Período</th><th>Economia/Ano</th><th>Acumulada</th></tr></thead><tbody>';
      var econAcum1 = 0;
      var periodos = [1, 3, 5, 10];
      var pcLen = r.projecao.projecaoCarga.length;
      periodos.forEach(function (p) {
        var econP = 0;
        // Somar anos disponíveis no array
        for (var a = 0; a < Math.min(p, pcLen); a++) {
          econP += r.projecao.projecaoCarga[a].economiaAno;
        }
        // CORREÇÃO BUG 6: Se período > tamanho do array, extrapolar com economia do último ano
        if (p > pcLen && pcLen > 0) {
          var ultimaEconomia = r.projecao.projecaoCarga[pcLen - 1].economiaAno;
          econP += ultimaEconomia * (p - pcLen);
        }
        var anoLabel = p === 1 ? "1 ano" : p + " anos";
        var idxUltimo = Math.min(p, pcLen) - 1;
        var ultimoAno = r.projecao.projecaoCarga[idxUltimo >= 0 ? idxUltimo : 0];
        var econAnoDisplay = (p > pcLen && pcLen > 0)
          ? r.projecao.projecaoCarga[pcLen - 1].economiaAno
          : (ultimoAno ? ultimoAno.economiaAno : eco.total);
        s6 += '<tr><td>' + anoLabel + '</td><td>' + _m(econAnoDisplay) + '</td><td class="res-economia"><strong>' + _m(econP || eco.total * p) + '</strong></td></tr>';
      });
      s6 += '</tbody></table></div>';
    } else {
      // Projeção simples sem cenários
      s6 += '<div class="res-mapa-projecoes"><h4>Projeção de Economia Acumulada</h4>';
      s6 += '<table class="res-table"><thead><tr><th>Período</th><th>Economia Acumulada</th></tr></thead><tbody>';
      [1, 3, 5, 10].forEach(function (p) {
        s6 += '<tr><td>' + p + (p === 1 ? ' ano' : ' anos') + '</td><td class="res-economia"><strong>' + _m(_r(eco.total * p)) + '</strong></td></tr>';
      });
      s6 += '</tbody></table></div>';
    }

    // Gráficos
    s6 += '<div class="res-chart-row">';
    s6 += '<div class="res-chart-container"><canvas id="chartEconomias" width="400" height="300"></canvas></div>';
    s6 += '<div class="res-chart-container"><canvas id="chartAntesDepois" width="400" height="300"></canvas></div>';
    s6 += '</div>';
    if (r.projecao && r.projecao.projecaoCarga) {
      s6 += '<div class="res-chart-container"><canvas id="chartProjecao" width="700" height="300"></canvas></div>';
    }

    s6 += '</div>';
    html += _secao(6, 'Mapa da Economia — Antes x Depois', s6);

    // ═══════════════════════════════════════════════════════════════════════
    //  SEÇÃO 7 — OPORTUNIDADES DE ECONOMIA
    // ═══════════════════════════════════════════════════════════════════════
    var ops = r.oportunidades || [];
    var s7 = '<div class="res-oportunidades">';
    if (ops.length === 0) {
      s7 += '<p class="res-info-msg">Nenhuma oportunidade adicional identificada com os dados informados.</p>';
    } else {
      ops.sort(function (a, b) { return (b.economiaAnual || 0) - (a.economiaAnual || 0); });
      ops.forEach(function (op, idx) {
        var rankNum = idx + 1;
        var corTipo = op.tipo === 'Dedução' ? '#2ECC71' : op.tipo === 'Redução' ? '#3498DB' : op.tipo === 'Crédito' ? '#9B59B6' : op.tipo === 'Compensação' ? '#F39C12' : op.tipo === 'Potencial' ? '#95A5A6' : '#E74C3C';
        var corRisco = op.risco === 'Baixo' ? '#2ECC71' : op.risco === 'Médio' ? '#F39C12' : '#E74C3C';
        var corCompl = op.complexidade === 'Baixa' ? '#2ECC71' : op.complexidade === 'Média' ? '#F39C12' : '#E74C3C';

        // CORREÇÃO FALHA #1: cards consolidados recebem estilo visual diferente
        var cardStyle = op._isConsolidada ? ' style="border:2px dashed #95A5A6;opacity:0.85;background:#f8f9fa;"' : '';
        s7 += '<div class="res-oport-card"' + cardStyle + '>';
        s7 += '<div class="res-oport-header">';
        s7 += '<div class="res-oport-rank">' + (op._isConsolidada ? '⊕' : '#' + rankNum) + '</div>';
        s7 += '<div class="res-oport-titulo">' + op.titulo + '</div>';
        s7 += '<div class="res-oport-valor">' + _m(op.economiaAnual) + '<span>/ano</span></div>';
        s7 += '</div>';
        s7 += '<div class="res-oport-tags">';
        s7 += '<span class="res-tag" style="background:' + corTipo + ';">' + op.tipo + '</span>';
        s7 += '<span class="res-tag" style="background:' + corCompl + ';">Compl.: ' + op.complexidade + '</span>';
        s7 += '<span class="res-tag" style="background:' + corRisco + ';">Risco: ' + op.risco + '</span>';
        if (op.prazoImplementacao) s7 += '<span class="res-tag" style="background:#3498DB;">Prazo: ' + op.prazoImplementacao + '</span>';
        s7 += '</div>';
        s7 += '<div class="res-oport-body">';
        s7 += '<p>' + op.descricao + '</p>';
        if (op.baseLegal) s7 += '<div class="res-oport-legal">Base Legal: ' + op.baseLegal + '</div>';
        if (op.acaoRecomendada) s7 += '<div class="res-oport-acao"><strong>Ação Recomendada:</strong> ' + op.acaoRecomendada + '</div>';
        s7 += '</div>';
        s7 += '</div>';
      });
    }
    s7 += '</div>';
    html += _secao(7, 'Oportunidades de Economia (' + ops.length + ')', s7);

    // ═══════════════════════════════════════════════════════════════════════
    //  SEÇÃO 8 — TRIMESTRAL vs ANUAL
    // ═══════════════════════════════════════════════════════════════════════
    var ca = r.comparativoApuracao;
    var s8 = '';
    if (ca) {
      // Tabela comparativa TRIMESTRAL
      if (ca.trimestral && ca.trimestral.trimestres) {
        s8 += '<h3>Apuração Trimestral</h3>';
        s8 += '<table class="res-table"><thead><tr><th>Trimestre</th><th>Lucro Ajustado</th><th>Comp. Prejuízo</th><th>Lucro Real</th><th>IRPJ Normal</th><th>IRPJ Adic.</th><th>IRPJ Total</th><th>CSLL</th></tr></thead><tbody>';
        ca.trimestral.trimestres.forEach(function (t) {
          s8 += '<tr><td>' + t.trimestre + 'º Tri</td><td>' + _m(t.lucroAjustado) + '</td><td>' + _m(t.compensacaoPrejuizo) + '</td><td>' + _m(t.lucroReal) + '</td><td>' + _m(t.irpjNormal) + '</td><td>' + _m(t.irpjAdicional) + '</td><td>' + _m(t.irpjTotal) + '</td><td>' + _m(t.csll) + '</td></tr>';
        });
        s8 += '<tr class="res-total"><td><strong>TOTAL</strong></td><td></td><td></td><td></td><td></td><td></td><td><strong>' + _m(ca.trimestral.totalIRPJ) + '</strong></td><td><strong>' + _m(ca.trimestral.totalCSLL) + '</strong></td></tr>';
        s8 += '</tbody></table>';
        s8 += '<p class="res-total-destaque">Total Trimestral (IRPJ+CSLL): <strong>' + _m(ca.trimestral.total) + '</strong></p>';
      }

      // Tabela ANUAL POR ESTIMATIVA (resumo)
      if (ca.anual) {
        s8 += '<h3>Apuração Anual por Estimativa</h3>';
        s8 += '<table class="res-table">';
        s8 += _linha('Total Estimativas IRPJ (12 meses)', ca.anual.totalEstimativasIRPJ, '', '');
        s8 += _linha('Total Estimativas CSLL (12 meses)', ca.anual.totalEstimativasCSLL, '', '');
        s8 += _linha('= Total Estimativas Pagas', ca.anual.totalEstimativas, '', 'res-subtotal');
        s8 += _linha('IRPJ Real Anual (ajuste)', ca.anual.irpjRealAnual, '', '');
        s8 += _linha('CSLL Real Anual (ajuste)', ca.anual.csllRealAnual, '', '');
        s8 += _linha('Ajuste IRPJ (real - estimativas)', ca.anual.ajusteIRPJ, '', ca.anual.ajusteIRPJ < 0 ? 'res-economia' : '');
        s8 += _linha('Ajuste CSLL (real - estimativas)', ca.anual.ajusteCSLL, '', ca.anual.ajusteCSLL < 0 ? 'res-economia' : '');
        // BUG#3 CORRIGIDO: saldo a compensar separado para IRPJ e CSLL
        if (ca.anual.saldoACompensar > 0) {
          s8 += _linha('Saldo a Compensar IRPJ (estimativas excedentes)', ca.anual.saldoACompensar, 'PER/DCOMP', 'res-economia');
        }
        if (ca.anual.saldoACompensarCSLL > 0) {
          s8 += _linha('Saldo a Compensar CSLL (estimativas excedentes)', ca.anual.saldoACompensarCSLL, 'PER/DCOMP', 'res-economia');
        }
        if (ca.anual.saldoACompensarTotal > 0) {
          s8 += _linha('= TOTAL a Compensar via PER/DCOMP', ca.anual.saldoACompensarTotal, 'PER/DCOMP', 'res-total res-economia');
        }
        s8 += '</table>';
      }

      // Suspensão/Redução
      if (ca.suspensao && ca.suspensao.mesesSuspensos > 0) {
        s8 += '<h3>Suspensão/Redução de Estimativas</h3>';
        s8 += '<p>Meses com possibilidade de suspensão: <strong>' + ca.suspensao.mesesSuspensos + '</strong></p>';
        s8 += '<p>Economia estimada com suspensão: <strong class="res-economia">' + _m(ca.suspensao.economiaTotalSuspensao) + '</strong></p>';
      }

      // Recomendação
      if (ca.recomendacao) {
        var recBg = ca.recomendacao.formaRecomendada === 'trimestral' ? '#1A3C6E' : '#2ECC71';
        s8 += '<div class="res-recomendacao" style="border-left:4px solid ' + recBg + ';">';
        s8 += '<h4>Recomendação</h4>';
        s8 += '<p>' + ca.recomendacao.justificativa + '</p>';
        if (ca.recomendacao.diferenca > 0 && ca.recomendacao.diferenca >= 100) {
          s8 += '<p><strong>Diferença: ' + _m(ca.recomendacao.diferenca) + '</strong></p>';
        }
        s8 += '</div>';
      }
    }
    // ALERTA #7 — Impacto de fluxo de caixa no regime anual por estimativa
    if (ca && ca.anual && (ca.anual.saldoACompensar > 0 || ca.anual.saldoACompensarCSLL > 0)) {
      var _capitalImob7 = _r((ca.anual.saldoACompensar || 0) + (ca.anual.saldoACompensarCSLL || 0));
      var _irpjCsllReal7 = _r((ca.anual.irpjRealAnual || 0) + (ca.anual.csllRealAnual || 0));
      s8 += '<div class="res-recomendacao" style="border-left:4px solid #F39C12;">';
      s8 += '<h4>⚠️ Impacto de Fluxo de Caixa (Regime Anual)</h4>';
      s8 += '<p>No regime anual por estimativa, a empresa pagará ' + _m(ca.anual.totalEstimativas) +
        ' em estimativas mensais, mas o imposto real ajustado é de ' + _m(_irpjCsllReal7) + '.</p>';
      s8 += '<p>Isso representa <strong>' + _m(_capitalImob7) +
        ' de capital imobilizado</strong> durante o ano, restituível somente após a entrega da ECF ' +
        '(geralmente no ano seguinte). Para empresas com necessidade de capital de giro, o regime ' +
        'trimestral pode ser mais vantajoso do ponto de vista financeiro.</p>';
      s8 += '</div>';
    }
    html += _secao(8, 'Comparativo: Trimestral vs Anual', s8);

    // ═══════════════════════════════════════════════════════════════════════
    //  SEÇÃO 9 — CENÁRIOS DE SENSIBILIDADE
    // ═══════════════════════════════════════════════════════════════════════
    var s9 = '';
    if (r.cenarios && r.cenarios.length > 0) {
      s9 += '<table class="res-table"><thead><tr><th>Cenário</th><th>Margem</th><th>Lucro</th><th>IRPJ+CSLL</th><th>PIS/COFINS</th><th>ISS</th><th>Carga Total</th><th>Alíq. Efetiva</th></tr></thead><tbody>';
      r.cenarios.forEach(function (c) {
        var cls = c.nome === 'Base' ? 'res-cenario-base' : c.nome === 'Pessimista' ? 'res-cenario-pessimista' : 'res-cenario-otimista';
        s9 += '<tr class="' + cls + '"><td><strong>' + c.nome + '</strong></td><td>' + _pp(c.margem) + '</td><td>' + _m(c.lucro) + '</td><td>' + _m(c.irpjCSLL) + '</td><td>' + _m(c.pisCofins) + '</td><td>' + _m(c.iss) + '</td><td><strong>' + _m(c.cargaTotal) + '</strong></td><td>' + _pp(c.aliquotaEfetiva) + '</td></tr>';
      });
      s9 += '</tbody></table>';
      s9 += '<div class="res-chart-container"><canvas id="chartCenarios" width="600" height="300"></canvas></div>';
    } else {
      s9 += '<p class="res-info-msg">Cenários de sensibilidade não foram habilitados. Ative na Etapa 6 para visualizar.</p>';
    }

    // Projeção plurianual
    if (r.projecao && r.projecao.projecaoCarga) {
      s9 += '<h3>Projeção Plurianual</h3>';
      s9 += '<table class="res-table"><thead><tr><th>Ano</th><th>Receita Projetada</th><th>Carga Tributária</th><th>Economia/Ano</th><th>Economia Acumulada</th></tr></thead><tbody>';
      r.projecao.projecaoCarga.forEach(function (p) {
        s9 += '<tr><td>Ano ' + p.ano + '</td><td>' + _m(p.receita) + '</td><td>' + _m(p.carga) + '</td><td>' + _m(p.economiaAno) + '</td><td class="res-economia"><strong>' + _m(p.economiaAcumulada) + '</strong></td></tr>';
      });
      s9 += '</tbody></table>';
    }
    html += _secao(9, 'Cenários de Sensibilidade', s9);

    // ═══════════════════════════════════════════════════════════════════════
    //  SEÇÃO 10 — FLUXO DE CAIXA TRIBUTÁRIO MENSAL
    // ═══════════════════════════════════════════════════════════════════════
    var fc = r.fluxoCaixa;
    var s10 = '';
    if (fc && fc.meses) {
      s10 += '<p>Forma de Apuração: <strong>' + (fc.apuracao === "trimestral" ? "Trimestral" : "Anual por Estimativa") + '</strong> | Média Mensal: <strong>' + _m(fc.mediaMensal) + '</strong></p>';
      s10 += '<div class="res-table-wrap"><table class="res-table res-fluxo-mensal"><thead><tr><th>Mês</th><th>IRPJ</th><th>CSLL</th><th>PIS</th><th>COFINS</th><th>ISS</th><th>Total</th></tr></thead><tbody>';
      var totIRPJ = 0, totCSLL = 0, totPIS = 0, totCOF = 0, totISS = 0, totTot = 0;
      fc.meses.forEach(function (m) {
        totIRPJ += m.irpj; totCSLL += m.csll; totPIS += m.pis; totCOF += m.cofins; totISS += m.iss; totTot += m.total;
        s10 += '<tr><td>' + mesesNome[m.mes - 1] + '</td><td>' + _m(m.irpj) + '</td><td>' + _m(m.csll) + '</td><td>' + _m(m.pis) + '</td><td>' + _m(m.cofins) + '</td><td>' + _m(m.iss) + '</td><td><strong>' + _m(m.total) + '</strong></td></tr>';
      });
      // ═══ FIX BUG #3: Usar totais anuais exatos para evitar divergência de centavos ═══
      var totIRPJExato = fc.irpjAnualExato !== undefined ? fc.irpjAnualExato : _r(totIRPJ);
      var totCSLLExato = fc.csllAnualExato !== undefined ? fc.csllAnualExato : _r(totCSLL);
      var totPISExato = fc.pisAnualExato !== undefined ? fc.pisAnualExato : _r(totPIS);
      var totCOFExato = fc.cofinsAnualExato !== undefined ? fc.cofinsAnualExato : _r(totCOF);
      var totISSExato = _r(totISS);
      var totTotExato = _r(totIRPJExato + totCSLLExato + totPISExato + totCOFExato + totISSExato);
      s10 += '<tr class="res-total"><td><strong>TOTAL</strong></td><td><strong>' + _m(totIRPJExato) + '</strong></td><td><strong>' + _m(totCSLLExato) + '</strong></td><td><strong>' + _m(totPISExato) + '</strong></td><td><strong>' + _m(totCOFExato) + '</strong></td><td><strong>' + _m(totISSExato) + '</strong></td><td><strong>' + _m(totTotExato) + '</strong></td></tr>';
      s10 += '</tbody></table></div>';
      s10 += '<div class="res-chart-container"><canvas id="chartFluxoMensal" width="700" height="350"></canvas></div>';
    }
    html += _secao(10, 'Fluxo de Caixa Tributário Mensal', s10);

    // ═══════════════════════════════════════════════════════════════════════
    //  SEÇÃO 11 — ALERTAS E COMPLIANCE
    // ═══════════════════════════════════════════════════════════════════════
    var alertas = r.alertas || [];
    var s11 = '<div class="res-alertas">';

    // Obrigatoriedade
    if (r.obrigatoriedade && r.obrigatoriedade.obrigado) {
      s11 += '<div class="res-alerta res-alerta-critico"><span class="res-alerta-icon">&#x1F534;</span><strong>OBRIGATORIEDADE:</strong> ' + (r.obrigatoriedade.motivo || 'Empresa é obrigada ao regime do Lucro Real.') + '</div>';
    }

    // Alertas da validação cruzada
    alertas.forEach(function (a) {
      var cls = a.tipo === 'critico' ? 'res-alerta-critico' : a.tipo === 'aviso' ? 'res-alerta-aviso' : a.tipo === 'economia' ? 'res-alerta-economia' : 'res-alerta-info';
      var icon = a.tipo === 'critico' ? '&#x1F534;' : a.tipo === 'aviso' ? '&#x1F7E1;' : a.tipo === 'economia' ? '&#x1F7E2;' : '&#x1F535;';
      s11 += '<div class="res-alerta ' + cls + '"><span class="res-alerta-icon">' + icon + '</span>' + a.msg + '</div>';
    });

    // Saldo negativo
    if (r.saldoNegativo && r.saldoNegativo.saldoNegativo && r.saldoNegativo.saldoNegativo > 0) {
      s11 += '<div class="res-alerta res-alerta-info"><span class="res-alerta-icon">&#x1F535;</span><strong>SALDO NEGATIVO IRPJ:</strong> ' + _m(r.saldoNegativo.saldoNegativo) + '. Solicitar restituição ou compensação via PER/DCOMP (IN RFB 2.055/2021).</div>';
    }

    // Vedações de compensação
    if (r.vedacoes && r.vedacoes.compensacaoPermitida === false) {
      s11 += '<div class="res-alerta res-alerta-critico"><span class="res-alerta-icon">&#x1F534;</span><strong>VEDAÇÃO DE COMPENSAÇÃO:</strong> ' + (r.vedacoes.motivo || 'Compensação de prejuízo fiscal vedada por mudança de controle + ramo de atividade (Art. 584 RIR/2018).') + '</div>';
    }

    // JCP não aproveitado
    if (r.jcpDetalhado && r.jcpDetalhado.economiaLiquida > 0 && r.economia.jcp > 0) {
      s11 += '<div class="res-alerta res-alerta-economia"><span class="res-alerta-icon">&#x1F7E2;</span><strong>JCP DISPONÍVEL:</strong> Economia líquida de ' + _m(r.jcpDetalhado.economiaLiquida) + '/ano com distribuição de Juros sobre Capital Próprio.</div>';
      // CORREÇÃO RJ-01: Alerta sobre Lei 14.789/2023 que alterou o cálculo do JCP
      if (!_n(d.plAjustadoJCP)) {
        s11 += '<div class="res-alerta res-alerta-warn"><span class="res-alerta-icon">&#x26A0;&#xFE0F;</span><strong>ATENÇÃO — Lei 14.789/2023 (vigente desde 01/01/2024):</strong> ' +
          'O novo §8º do art. 9º da Lei 9.249/95 passou a excluir da base patrimonial do JCP diversos itens ' +
          '(lucros do período, reservas de incentivos, AAP, AVP, entre outros). ' +
          'O valor de JCP apresentado utiliza PL contábil total (PL Ajustado não foi informado) e pode estar superestimado. ' +
          '<strong>Informe o PL Ajustado conforme Lei 14.789/2023 na Etapa 3 ou valide com contador.</strong></div>';
      } else {
        s11 += '<div class="res-alerta res-alerta-info"><span class="res-alerta-icon">&#x1F535;</span><strong>JCP — Lei 14.789/2023:</strong> Cálculo utiliza PL Ajustado de ' + _m(_n(d.plAjustadoJCP)) + ' conforme informado.</div>';
      }
    }

    // SUDAM/SUDENE potencial
    var isSUDAM = (LR.helpers && LR.helpers.ehSUDAM) ? LR.helpers.ehSUDAM(d.uf) : false;
    var isSUDENE = (LR.helpers && LR.helpers.ehSUDENE) ? LR.helpers.ehSUDENE(d.uf) : false;
    if ((isSUDAM || isSUDENE) && !(d.temProjetoAprovado === true || d.temProjetoAprovado === "true")) {
      var nomeSup = isSUDAM ? "SUDAM" : "SUDENE";
      s11 += '<div class="res-alerta res-alerta-economia"><span class="res-alerta-icon">&#x1F7E2;</span><strong>POTENCIAL ' + nomeSup + ':</strong> Empresa em área ' + nomeSup + ' sem projeto aprovado. Redução de até 75% do IRPJ é possível.</div>';
    }

    // Reforma Tributária — CORREÇÃO RJ-03: Disclaimer mais explícito para 2026
    s11 += '<div class="res-alerta res-alerta-warn"><span class="res-alerta-icon">&#x26A0;&#xFE0F;</span><strong>REFORMA TRIBUTÁRIA — ANO-BASE 2026 (LC 214/2025):</strong> ' +
      'Em 2026 inicia-se a fase de teste da CBS (0,9%) e IBS (0,1%) com crédito proporcional de PIS/COFINS vigente. ' +
      'Os cálculos de PIS/COFINS neste estudo utilizam a sistemática anterior (Leis 10.637/02 e 10.833/03). ' +
      '<strong>O impacto da CBS/IBS teste não está refletido nos valores apresentados.</strong> ' +
      'Consulte regulamentação vigente para ajustar o planejamento tributário. ' +
      'O regime do Lucro Real permanece aplicável para IRPJ e CSLL.</div>';

    s11 += '</div>';
    html += _secao(11, 'Alertas e Compliance', s11);

    // ═══════════════════════════════════════════════════════════════════════
    //  SEÇÃO 12 — OBRIGAÇÕES ACESSÓRIAS E DARFs
    // ═══════════════════════════════════════════════════════════════════════
    var s12 = '';

    // Obrigações acessórias
    var obrigacoes = r.obrigacoes || [];
    if (obrigacoes.length > 0) {
      s12 += '<h3>Obrigações Acessórias</h3>';
      s12 += '<table class="res-table"><thead><tr><th>Obrigação</th><th>Periodicidade</th><th>Prazo</th><th>Descrição</th></tr></thead><tbody>';
      obrigacoes.forEach(function (ob) {
        if (ob) {
          var _periodicidade = '—';
          if (ob.prazo) {
            var _pl = ob.prazo.toLowerCase();
            if (_pl.indexOf('mensal') >= 0 || _pl.indexOf('mês') >= 0 || _pl.indexOf('15º') >= 0 || _pl.indexOf('10º') >= 0) _periodicidade = 'Mensal';
            else if (_pl.indexOf('trimestral') >= 0 || _pl.indexOf('trimestre') >= 0) _periodicidade = 'Trimestral';
            else if (_pl.indexOf('anual') >= 0 || _pl.indexOf('ano') >= 0 || _pl.indexOf('julho') >= 0 || _pl.indexOf('maio') >= 0 || _pl.indexOf('fevereiro') >= 0) _periodicidade = 'Anual';
            else if (_pl.indexOf('contínuo') >= 0 || _pl.indexOf('continuo') >= 0) _periodicidade = 'Contínuo';
            else if (_pl.indexOf('período') >= 0 || _pl.indexOf('periodo') >= 0) _periodicidade = 'Por Período';
            else if (_pl.indexOf('prescrever') >= 0 || _pl.indexOf('5 anos') >= 0) _periodicidade = 'Permanente';
            else if (_pl.indexOf('varia') >= 0) _periodicidade = 'Varia por UF';
            else _periodicidade = ob.prazo.split('(')[0].trim() || '—';
          }
          s12 += '<tr><td><strong>' + (ob.obrigacao || ob.nome || ob.id || '—') + '</strong></td><td>' + _periodicidade + '</td><td>' + (ob.prazo || '—') + '</td><td>' + (ob.descricao || '—') + '</td></tr>';
        }
      });
      s12 += '</tbody></table>';
    } else {
      // Obrigações padrão do Lucro Real
      s12 += '<h3>Obrigações Acessórias do Lucro Real</h3>';
      s12 += '<table class="res-table"><thead><tr><th>Obrigação</th><th>Periodicidade</th><th>Prazo</th></tr></thead><tbody>';
      s12 += '<tr><td><strong>ECF</strong> — Escrituração Contábil Fiscal</td><td>Anual</td><td>Último dia útil de julho</td></tr>';
      s12 += '<tr><td><strong>ECD</strong> — Escrituração Contábil Digital</td><td>Anual</td><td>Último dia útil de maio</td></tr>';
      s12 += '<tr><td><strong>EFD-Contribuições</strong></td><td>Mensal</td><td>10º dia útil do 2º mês subsequente</td></tr>';
      s12 += '<tr><td><strong>DCTF</strong> — Declaração de Débitos e Créditos</td><td>Mensal</td><td>15º dia útil do 2º mês subsequente</td></tr>';
      s12 += '<tr><td><strong>EFD-ICMS/IPI</strong></td><td>Mensal</td><td>Varia por UF</td></tr>';
      s12 += '<tr><td><strong>LALUR/LACS</strong> — Livro de Apuração</td><td>' + (d.apuracaoLR === "trimestral" ? "Trimestral" : "Anual") + '</td><td>Integrado à ECF</td></tr>';
      s12 += '</tbody></table>';
    }

    // DARFs
    var darfs = r.darfs || [];
    if (darfs.length > 0) {
      s12 += '<h3>Códigos DARF — Forma: ' + (d.apuracaoLR === "trimestral" ? "Trimestral" : "Anual") + '</h3>';
      s12 += '<table class="res-table res-darf-table"><thead><tr><th>Tributo</th><th>Código DARF</th><th>Periodicidade</th><th>Prazo</th></tr></thead><tbody>';
      darfs.forEach(function (df) {
        if (df) {
          s12 += '<tr><td><strong>' + (df.tributo || df.nome || '—') + '</strong></td><td>' + (df.codigo || '—') + '</td><td>' + (df.periodicidade || '—') + '</td><td>' + (df.prazo || df.vencimento || '—') + '</td></tr>';
        }
      });
      s12 += '</tbody></table>';
    } else {
      // DARFs padrão
      s12 += '<h3>Códigos DARF</h3>';
      s12 += '<table class="res-table res-darf-table"><thead><tr><th>Tributo</th><th>Código DARF</th><th>Periodicidade</th></tr></thead><tbody>';
      if (d.apuracaoLR === "trimestral") {
        s12 += '<tr><td>IRPJ — Trimestral</td><td>0220</td><td>Trimestral</td></tr>';
        s12 += '<tr><td>CSLL — Trimestral</td><td>2372</td><td>Trimestral</td></tr>';
      } else {
        s12 += '<tr><td>IRPJ — Estimativa Mensal</td><td>2362</td><td>Mensal</td></tr>';
        s12 += '<tr><td>CSLL — Estimativa Mensal</td><td>2484</td><td>Mensal</td></tr>';
        s12 += '<tr><td>IRPJ — Ajuste Anual</td><td>2430</td><td>Anual</td></tr>';
        s12 += '<tr><td>CSLL — Ajuste Anual</td><td>6773</td><td>Anual</td></tr>';
      }
      s12 += '<tr><td>PIS — Não Cumulativo</td><td>6912</td><td>Mensal</td></tr>';
      s12 += '<tr><td>COFINS — Não Cumulativo</td><td>5856</td><td>Mensal</td></tr>';
      if (r.jcpDetalhado && r.jcpDetalhado.jcpDedutivel > 0) {
        s12 += '<tr><td>IRRF sobre JCP</td><td>5706</td><td>Quando distribuir</td></tr>';
      }
      s12 += '</tbody></table>';
    }
    html += _secao(12, 'Obrigações Acessórias e DARFs', s12);

    // ═══════════════════════════════════════════════════════════════════════
    //  SEÇÃO NOVA 6 — REFORMA TRIBUTÁRIA — IMPACTOS E DISCLAIMER
    // ═══════════════════════════════════════════════════════════════════════
    if (LR.reformaTributaria) {
      var sN6 = '';
      sN6 += '<div class="res-detail-card" style="border-left:4px solid #3498DB;padding:16px;">';
      sN6 += '<h3>⚖️ Impactos da LC 214/2025 (Reforma Tributária)</h3>';
      if (LR.reformaTributaria.impactosLucroReal) {
        sN6 += '<table class="res-table"><thead><tr><th>Tema</th><th>Impacto</th><th>Status</th></tr></thead><tbody>';
        LR.reformaTributaria.impactosLucroReal.forEach(function (imp) {
          var corImp = imp.impacto === 'ALTO' ? '#E74C3C' : imp.impacto === 'MEDIO' ? '#F39C12' : '#3498DB';
          sN6 += '<tr><td><strong>' + (imp.tema || '') + '</strong>';
          if (imp.artigo) sN6 += ' <span class="res-artigo">' + imp.artigo + '</span>';
          sN6 += '<br><span style="font-size:0.85em;color:#666;">' + (imp.descricao || '') + '</span></td>';
          sN6 += '<td style="color:' + corImp + ';font-weight:600;">' + (imp.impacto || '') + '</td>';
          sN6 += '<td style="font-size:0.85em;color:#666;">' + (imp.statusRegulamentacao || imp.status || '') + '</td></tr>';
        });
        sN6 += '</tbody></table>';
      }
      if (LR.reformaTributaria.disclaimer) {
        sN6 += '<div style="margin-top:12px;padding:10px;background:#f8f9fa;border-radius:6px;font-style:italic;color:#666;font-size:0.9em;">' + LR.reformaTributaria.disclaimer + '</div>';
      }
      if (LR.reformaTributaria.dataUltimaRevisao) {
        sN6 += '<div style="margin-top:6px;font-size:0.8em;color:#999;">Última revisão: ' + LR.reformaTributaria.dataUltimaRevisao + '</div>';
      }
      sN6 += '</div>';
      html += _secao('F', 'Reforma Tributária — Impactos e Disclaimer', sN6);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SEÇÃO NOVA 7 — FÓRMULA MESTRE DO LUCRO REAL
    // ═══════════════════════════════════════════════════════════════════════
    if (LR.formulaMestre && LR.formulaMestre.passos) {
      var sN7 = '';
      // Mapear valores reais para cada passo da fórmula
      var valoresFormula = {};
      valoresFormula[1] = r.dre ? r.dre.lucroLiquido : 0;
      valoresFormula[2] = r.lalur ? r.lalur.totalAdicoes : 0;
      valoresFormula[3] = r.lalur ? r.lalur.totalExclusoes : 0;
      valoresFormula[4] = r.lalur ? r.lalur.lucroAjustado : 0;
      var compensTotal = 0;
      if (r.compensacao && r.compensacao.resumo && r.compensacao.resumo.compensacaoEfetiva) {
        // CORREÇÃO BUG FÓRMULA MESTRE: Usar apenas a compensação de prejuízo fiscal (IRPJ),
        // NÃO somar a base negativa de CSLL — são grandezas distintas.
        // A base negativa CSLL é compensação para cálculo da CSLL (seção 4.2), não do Lucro Real.
        // Antes: compensTotal = prejuizoOperacional + baseNegativaCSLL (ERRADO: R$200k + R$150k = R$350k)
        // Agora: compensTotal = apenas prejuizoOperacional (CORRETO: R$200k)
        compensTotal = (r.compensacao.resumo.compensacaoEfetiva.prejuizoOperacional || 0);
      }
      // Fallback: ler do resultado do IRPJ se a compensação veio zerada
      if (compensTotal === 0 && r.irpj) {
        compensTotal = r.irpj.compensacaoPrejuizo || r.irpj.passo5_compensacao || 0;
      }
      valoresFormula[5] = compensTotal;
      valoresFormula[6] = r.lucroRealFinal || 0;
      valoresFormula[7] = r.irpj ? (r.irpj.irpjNormal || 0) : 0;
      valoresFormula[8] = r.irpj ? (r.irpj.irpjAdicional || r.irpj.adicional || 0) : 0;
      valoresFormula[9] = r.irpjAntesReducao || 0;
      valoresFormula[10] = (r.incentivosFiscais ? (r.incentivosFiscais.totalDeducaoFinal || r.incentivosFiscais.economiaTotal || 0) : 0) + (r.reducaoSUDAM || 0);
      var totalRetForm = _n(d.irrfRetidoPrivado) + _n(d.irrfRetidoPublico);
      valoresFormula[11] = totalRetForm;
      valoresFormula[12] = r.irpjAposReducao ? _r(r.irpjAposReducao - totalRetForm) : 0;

      sN7 += '<div class="res-detail-card" style="font-family:\'JetBrains Mono\',monospace;">';
      sN7 += '<div style="margin-bottom:8px;font-size:0.85em;color:#666;">Sequência de cálculo — <span class="res-artigo">' + (LR.formulaMestre.artigo || 'Art. 258-261') + '</span></div>';
      LR.formulaMestre.passos.forEach(function (p) {
        var val = valoresFormula[p.passo] || 0;
        var isTotal = (p.operacao === '=' && (p.passo === 6 || p.passo === 9 || p.passo === 12));
        var bgColor = isTotal ? '#f0fdf4' : 'transparent';
        var fWeight = isTotal ? 'font-weight:700;' : '';
        var opIcon = p.operacao === '+' ? '(+)' : p.operacao === '-' ? '(-)' : p.operacao === '×' ? '(×)' : '(=)';
        sN7 += '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 12px;border-bottom:1px solid #eee;background:' + bgColor + ';' + fWeight + '">';
        sN7 += '<div><span style="display:inline-block;width:30px;color:#999;font-size:0.9em;">' + opIcon + '</span> ' + p.descricao;
        if (p.artigo && p.artigo !== '-') sN7 += ' <span class="res-artigo">' + p.artigo + '</span>';
        sN7 += '</div>';
        sN7 += '<div style="text-align:right;min-width:140px;' + (isTotal ? 'color:#10b981;font-size:1.1em;' : '') + '">' + _m(val) + '</div>';
        sN7 += '</div>';
      });
      sN7 += '</div>';
      html += _secao('G', 'Fórmula Mestre do Lucro Real', sN7);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SEÇÃO NOVA 8 — MAPA DE ESTRATÉGIAS DE ECONOMIA — RANKINGS
    // ═══════════════════════════════════════════════════════════════════════
    if (LR.estrategiasEconomia && LR.estrategiasEconomia.length > 0) {
      var sN8 = '';
      var opsArr = r.oportunidades || [];
      // Calcular total economia para % barras — CORREÇÃO FALHA #1: excluir cards consolidados
      var totalEconOps = 0;
      opsArr.forEach(function (op) { if (!op._isConsolidada) totalEconOps += (op.economiaAnual || 0); });

      sN8 += '<div class="res-oportunidades">';
      LR.estrategiasEconomia.forEach(function (est) {
        // Cruzar com oportunidade correspondente
        var econReal = 0;
        opsArr.forEach(function (op) {
          if (op.titulo && op.titulo.indexOf(est.nome.substring(0, 10)) >= 0) econReal += (op.economiaAnual || 0);
        });
        // Fallback: cruzar pelo tipo
        if (econReal === 0) {
          var ecoKey = est.nome.toLowerCase();
          if (ecoKey.indexOf('jcp') >= 0) econReal = r.economia ? (r.economia.jcp || 0) : 0;
          else if (ecoKey.indexOf('prejuízo') >= 0 || ecoKey.indexOf('prejuizo') >= 0) econReal = r.economia ? (r.economia.prejuizo || 0) : 0;
          else if (ecoKey.indexOf('sudam') >= 0) econReal = r.economia ? (r.economia.sudam || 0) : 0;
          else if (ecoKey.indexOf('incentiv') >= 0) econReal = r.economia ? (r.economia.incentivos || 0) : 0;
          else if (ecoKey.indexOf('deprecia') >= 0) econReal = r.economia ? (r.economia.depreciacao || 0) : 0;
          else if (ecoKey.indexOf('pis') >= 0 || ecoKey.indexOf('cofins') >= 0) econReal = r.economia ? (r.economia.pisCofinsCreditos || 0) : 0;
        }

        var pctBarra = totalEconOps > 0 ? _r(econReal / totalEconOps * 100) : 0;
        var corTipo = est.tipo === 'Dedução' ? '#2ECC71' : est.tipo === 'Timing' ? '#3498DB' : est.tipo === 'Crédito' ? '#9B59B6' : est.tipo === 'Redução' ? '#F39C12' : '#95A5A6';
        var corCompl = est.complexidade === 'Baixa' ? '#2ECC71' : est.complexidade === 'Média' ? '#F39C12' : '#E74C3C';
        var corRisco = est.risco === 'Baixo' ? '#2ECC71' : est.risco === 'Médio' ? '#F39C12' : '#E74C3C';

        sN8 += '<div class="res-oport-card" style="margin-bottom:8px;">';
        sN8 += '<div class="res-oport-header">';
        sN8 += '<div class="res-oport-titulo">' + est.nome + '</div>';
        sN8 += '<div class="res-oport-valor">' + _m(econReal) + '</div>';
        sN8 += '</div>';
        sN8 += '<div class="res-oport-tags">';
        sN8 += '<span class="res-tag" style="background:' + corTipo + ';">' + est.tipo + '</span>';
        sN8 += '<span class="res-tag" style="background:' + corCompl + ';">Compl.: ' + est.complexidade + '</span>';
        sN8 += '<span class="res-tag" style="background:' + corRisco + ';">Risco: ' + est.risco + '</span>';
        sN8 += '</div>';
        // Barra de progresso
        sN8 += '<div style="display:flex;align-items:center;margin:6px 0 4px;">';
        sN8 += '<div style="flex:1;background:#eee;border-radius:4px;height:10px;overflow:hidden;margin-right:8px;">';
        sN8 += '<div style="width:' + pctBarra + '%;background:' + corTipo + ';height:100%;border-radius:4px;transition:width 0.3s;"></div>';
        sN8 += '</div>';
        sN8 += '<span style="font-size:0.8em;color:#666;min-width:40px;text-align:right;">' + pctBarra.toFixed(0) + '%</span>';
        sN8 += '</div>';
        if (est.artigo) sN8 += '<div style="font-size:0.8em;color:#999;">' + est.artigo + '</div>';
        sN8 += '</div>';
      });
      sN8 += '</div>';
      html += _secao('H', 'Mapa de Estratégias de Economia — Rankings', sN8);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SEÇÃO NOVA 9 — ESTRUTURA LALUR — PARTE A E PARTE B
    // ═══════════════════════════════════════════════════════════════════════
    if (LR.lalur) {
      var sN9 = '';

      // Parte A — Adições e exclusões efetivamente realizadas
      sN9 += '<h3>Parte A — Demonstração do Lucro Real (Art. 277)</h3>';
      if (LR.lalur.parteA) {
        sN9 += '<p style="color:#666;font-size:0.9em;">' + (LR.lalur.parteA.descricao || '') + '</p>';
      }
      sN9 += '<table class="res-table"><thead><tr><th>Tipo</th><th>Descrição</th><th>Artigo</th><th>Valor</th></tr></thead><tbody>';
      // Adições efetivas
      if (r.lalur && r.lalur.adicoes && r.lalur.adicoes.length > 0) {
        r.lalur.adicoes.forEach(function (a) {
          // Lookup artigo no mapeamento LR.adicoes
          var artigoLookup = a.artigo || '';
          if (!artigoLookup && LR.adicoes) {
            for (var ai = 0; ai < LR.adicoes.length; ai++) {
              if (LR.adicoes[ai].id === a.id || (LR.adicoes[ai].descricao && a.desc && LR.adicoes[ai].descricao.indexOf(a.desc.substring(0, 15)) >= 0)) {
                artigoLookup = LR.adicoes[ai].artigo || '';
                break;
              }
            }
          }
          sN9 += '<tr><td style="color:#E74C3C;font-weight:600;">(+) Adição</td><td>' + (a.desc || a.descricao || '') + '</td><td><span class="res-artigo">' + artigoLookup + '</span></td><td class="res-valor">' + _m(a.valor) + '</td></tr>';
        });
      }
      // Exclusões efetivas
      if (r.lalur && r.lalur.exclusoes && r.lalur.exclusoes.length > 0) {
        r.lalur.exclusoes.forEach(function (e) {
          var artigoLookupE = e.artigo || '';
          if (!artigoLookupE && LR.exclusoes) {
            for (var ei = 0; ei < LR.exclusoes.length; ei++) {
              if (LR.exclusoes[ei].id === e.id || (LR.exclusoes[ei].descricao && e.desc && LR.exclusoes[ei].descricao.indexOf(e.desc.substring(0, 15)) >= 0)) {
                artigoLookupE = LR.exclusoes[ei].artigo || '';
                break;
              }
            }
          }
          sN9 += '<tr><td style="color:#2ECC71;font-weight:600;">(-) Exclusão</td><td>' + (e.desc || e.descricao || '') + '</td><td><span class="res-artigo">' + artigoLookupE + '</span></td><td class="res-valor">' + _m(e.valor) + '</td></tr>';
        });
      }
      sN9 += '</tbody></table>';

      // Parte B — Controles futuros
      sN9 += '<h3 style="margin-top:20px;">Parte B — Controle de Valores Futuros (Art. 277)</h3>';
      if (LR.lalur.parteB) {
        sN9 += '<p style="color:#666;font-size:0.9em;">' + (LR.lalur.parteB.descricao || '') + '</p>';
      }
      sN9 += '<table class="res-table"><thead><tr><th>Controle</th><th>Saldo Remanescente</th><th>Projeção de Reversão</th></tr></thead><tbody>';
      // Prejuízos remanescentes
      var saldoPrej = 0;
      if (r.compensacao && r.compensacao.resumo && r.compensacao.resumo.saldosPosCompensacao) {
        saldoPrej = r.compensacao.resumo.saldosPosCompensacao.prejuizoOperacional || r.compensacao.resumo.saldosPosCompensacao.prejuizoFiscal || 0;
      }
      if (saldoPrej > 0 || _n(d.prejuizoFiscal) > 0) {
        sN9 += '<tr><td>Prejuízos Fiscais a Compensar</td><td class="res-valor">' + _m(saldoPrej > 0 ? saldoPrej : _n(d.prejuizoFiscal)) + '</td><td>Compensável a 30% do lucro ajustado por período</td></tr>';
      }
      // Base negativa CSLL
      var saldoBN = 0;
      if (r.compensacao && r.compensacao.resumo && r.compensacao.resumo.saldosPosCompensacao) {
        saldoBN = r.compensacao.resumo.saldosPosCompensacao.baseNegativaCSLL || 0;
      }
      if (saldoBN > 0 || _n(d.baseNegativaCSLL) > 0) {
        sN9 += '<tr><td>Base Negativa da CSLL</td><td class="res-valor">' + _m(saldoBN > 0 ? saldoBN : _n(d.baseNegativaCSLL)) + '</td><td>Compensável a 30% da base positiva</td></tr>';
      }
      // Provisões não dedutíveis (reversão futura)
      var provND = _n(d.provisoesContingencias) + _n(d.provisoesGarantias);
      if (provND > 0) {
        sN9 += '<tr><td>Provisões Não Dedutíveis (reversão futura → exclusão)</td><td class="res-valor">' + _m(provND) + '</td><td>Exclusão quando da reversão/liquidação da provisão</td></tr>';
      }
      // Depreciação acelerada (diferença fiscal × contábil)
      if (r.depreciacaoDetalhada && r.depreciacaoDetalhada.depreciaAcelerada > 0 && r.depreciacaoDetalhada.depreciaNormal > 0) {
        var difDepFiscal = _r(r.depreciacaoDetalhada.depreciaAcelerada - r.depreciacaoDetalhada.depreciaNormal);
        if (difDepFiscal > 0) {
          sN9 += '<tr><td>Depreciação Acelerada (diferença fiscal × contábil)</td><td class="res-valor">' + _m(difDepFiscal) + '</td><td>Adição futura quando a depreciação contábil ultrapassar a fiscal</td></tr>';
        }
      }
      sN9 += '</tbody></table>';

      html += _secao('I', 'Estrutura LALUR — Parte A e Parte B', sN9);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SEÇÃO NOVA 10 — ALÍQUOTAS APLICÁVEIS (PARTE 5B)
    // ═══════════════════════════════════════════════════════════════════════
    if (LR.aliquotas) {
      var sAliq = '';
      sAliq += '<div class="res-detail-grid">';
      var aliqIRPJ = LR.aliquotas.irpj || {};
      var aliqCSLL = LR.aliquotas.csll || {};
      var aliqPC = LR.aliquotas.pisCofins || {};
      var aliqJCP = LR.aliquotas.jcp || {};
      var aliqComp = LR.aliquotas.compensacaoPrejuizo || {};
      sAliq += '<div class="res-detail-card"><h3>IRPJ <span class="res-artigo">' + (aliqIRPJ.artigoBase || 'Art. 225') + '</span></h3>';
      sAliq += '<table class="res-table">';
      sAliq += '<tr><td>Alíquota normal</td><td class="res-valor">' + _p(aliqIRPJ.normal || 0.15) + '</td></tr>';
      sAliq += '<tr><td>Adicional sobre excedente</td><td class="res-valor">' + _p(aliqIRPJ.adicional || 0.10) + '</td></tr>';
      sAliq += '<tr><td>Limite adicional/mês</td><td class="res-valor">' + _m(aliqIRPJ.limiteAdicionalMes || 20000) + '</td></tr>';
      sAliq += '</table></div>';
      sAliq += '<div class="res-detail-card"><h3>CSLL <span class="res-artigo">' + (aliqCSLL.artigoBase || 'Lei 7.689') + '</span></h3>';
      sAliq += '<table class="res-table">';
      sAliq += '<tr><td>Alíquota geral</td><td class="res-valor">' + _p(aliqCSLL.geral || 0.09) + '</td></tr>';
      sAliq += '<tr><td>Instituições financeiras</td><td class="res-valor">' + _p(aliqCSLL.financeiras || 0.15) + '</td></tr>';
      sAliq += '</table></div>';
      sAliq += '<div class="res-detail-card"><h3>PIS/COFINS NC <span class="res-artigo">' + (aliqPC.artigoBase || '') + '</span></h3>';
      sAliq += '<table class="res-table">';
      sAliq += '<tr><td>PIS não-cumulativo</td><td class="res-valor">' + _p(aliqPC.pisNaoCumulativo || 0.0165) + '</td></tr>';
      sAliq += '<tr><td>COFINS não-cumulativo</td><td class="res-valor">' + _p(aliqPC.cofinsNaoCumulativo || 0.076) + '</td></tr>';
      sAliq += '<tr><td>Total NC</td><td class="res-valor">' + _p(aliqPC.totalNaoCumulativo || 0.0925) + '</td></tr>';
      sAliq += '</table></div>';
      sAliq += '<div class="res-detail-card"><h3>JCP e Compensação</h3>';
      sAliq += '<table class="res-table">';
      sAliq += '<tr><td>IRRF sobre JCP <span class="res-artigo">' + (aliqJCP.artigoBase || '') + '</span></td><td class="res-valor">' + _p(aliqJCP.irrfAliquota || 0.175) + '</td></tr>';
      sAliq += '<tr><td>Trava compensação <span class="res-artigo">' + (aliqComp.artigoBase || '') + '</span></td><td class="res-valor">' + _p(aliqComp.trava30 || 0.30) + '</td></tr>';
      sAliq += '</table></div>';
      sAliq += '</div>';
      html += _secao('J', 'Alíquotas Aplicáveis — Referência', sAliq);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SEÇÃO NOVA 11 — OBRIGATORIEDADE LUCRO REAL — HIPÓTESES (PARTE 5B)
    // ═══════════════════════════════════════════════════════════════════════
    if (LR.obrigatoriedadeLucroReal && LR.obrigatoriedadeLucroReal.hipoteses) {
      var sObrig = '';
      sObrig += '<p style="color:#666;font-size:0.9em;">Artigo base: <span class="res-artigo">' + (LR.obrigatoriedadeLucroReal.artigo || 'Art. 257') + '</span></p>';
      sObrig += '<table class="res-table"><thead><tr><th>Inciso</th><th>Hipótese</th><th>Aplicável?</th></tr></thead><tbody>';
      LR.obrigatoriedadeLucroReal.hipoteses.forEach(function (hip) {
        var aplicavel = false;
        if (hip.id === 'RECEITA' && _n(d.receitaBrutaAnual) > (hip.valor || 78000000)) aplicavel = true;
        else if (hip.id === 'FINANCEIRA' && (d.ehInstituicaoFinanceira === true || d.ehInstituicaoFinanceira === "true" || d.ehFinanceira === true || d.ehFinanceira === "true")) aplicavel = true;
        else if (hip.id === 'LUCRO_EXTERIOR' && (d.temLucroExterior === true || d.temLucroExterior === "true")) aplicavel = true;
        else if (hip.id === 'BENEFICIO_FISCAL' && (d.temBeneficioFiscalIsencao === true || d.temBeneficioFiscalIsencao === "true")) aplicavel = true;
        else if (hip.id === 'ESTIMATIVA' && d.apuracaoLR === 'anual') aplicavel = true;
        else if (hip.id === 'FACTORING' && (d.ehFactoring === true || d.ehFactoring === "true")) aplicavel = true;
        else if (hip.id === 'SECURITIZADORA' && (d.ehSecuritizadora === true || d.ehSecuritizadora === "true")) aplicavel = true;
        sObrig += '<tr><td>' + (hip.inciso || '') + '</td><td>' + (hip.descricao || '') + '</td><td style="text-align:center;font-size:1.2em;">' + (aplicavel ? '✅' : '—') + '</td></tr>';
      });
      sObrig += '</tbody></table>';
      html += _secao('K', 'Hipóteses de Obrigatoriedade do Lucro Real', sObrig);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SEÇÃO NOVA 12 — IMPACTOS LEI 12.973/2014 (PARTE 5B)
    // ═══════════════════════════════════════════════════════════════════════
    if (LR.lei12973 && LR.lei12973.temas) {
      var sLei = '';
      sLei += '<p style="color:#666;font-size:0.9em;">Vigência: ' + (LR.lei12973.vigencia || '01/01/2015') + '</p>';
      sLei += '<table class="res-table"><thead><tr><th>Tema</th><th>Artigo</th><th>Relevante?</th></tr></thead><tbody>';
      LR.lei12973.temas.forEach(function (tema) {
        var relevante = false;
        if (tema.id === 'GOODWILL' && _n(d.valorGoodwill) > 0) relevante = true;
        else if (tema.id === 'JCP_PL' && r.jcpDetalhado && r.jcpDetalhado.jcpDedutivel > 0) relevante = true;
        else if (tema.id === 'PRE_OPERACIONAL' && _n(d.despesasPreOperacionais) > 0) relevante = true;
        else if (tema.id === 'RECEITA_BRUTA') relevante = true;
        sLei += '<tr><td><strong>' + (tema.label || '') + '</strong></td><td><span class="res-artigo">' + (tema.artigo || '') + '</span></td><td style="text-align:center;">' + (relevante ? '✅ Sim' : '—') + '</td></tr>';
      });
      sLei += '</tbody></table>';
      html += _secao('L', 'Impactos da Lei 12.973/2014', sLei);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SEÇÃO NOVA 13 — TABELA DE RETENÇÕES APLICÁVEIS (PARTE 5B)
    // ═══════════════════════════════════════════════════════════════════════
    if (LR.retencoes) {
      var sRet = '';
      sRet += '<table class="res-table"><thead><tr><th>Retenção</th><th>Alíquota</th><th>Artigo</th><th>Tratamento</th></tr></thead><tbody>';
      var retKeys = ['irrfServicosPJ', 'irrfAdmPublica', 'csrf', 'beneficiarioNaoIdentificado', 'jcp', 'dividendos'];
      retKeys.forEach(function (rk) {
        var retItem = LR.retencoes[rk];
        if (retItem) {
          var aliqStr = retItem.aliquota !== undefined ? _p(retItem.aliquota) : (retItem.aliquotas ? _p(retItem.aliquotas.total) : '—');
          sRet += '<tr><td><strong>' + (retItem.descricao || rk) + '</strong></td><td class="res-valor">' + aliqStr + '</td><td><span class="res-artigo">' + (retItem.artigo || '') + '</span></td><td>' + (retItem.tratamento || '') + '</td></tr>';
        }
      });
      sRet += '</tbody></table>';
      html += _secao('M', 'Tabela de Retenções na Fonte Aplicáveis', sRet);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SEÇÃO NOVA 14 — TABELA IRPF REFERÊNCIA (PARTE 5B)
    // ═══════════════════════════════════════════════════════════════════════
    if (LR.tabelaIRPF && LR.tabelaIRPF.tabela_2025) {
      var sIRPF = '';
      sIRPF += '<p style="color:#666;font-size:0.9em;">Referência para retenções sobre PF — <span class="res-artigo">' + (LR.tabelaIRPF.artigo || 'Art. 677') + '</span> — Ano-base: ' + (LR.tabelaIRPF.anoBase || '2025') + '</p>';
      sIRPF += '<table class="res-table"><thead><tr><th>Faixa</th><th>Até (R$)</th><th>Alíquota</th><th>Dedução</th></tr></thead><tbody>';
      LR.tabelaIRPF.tabela_2025.forEach(function (f) {
        sIRPF += '<tr><td>' + f.faixa + 'ª</td><td class="res-valor">' + (f.ate === Infinity ? 'Acima' : _m(f.ate)) + '</td><td class="res-valor">' + _p(f.aliquota) + '</td><td class="res-valor">' + _m(f.deducao) + '</td></tr>';
      });
      sIRPF += '</tbody></table>';
      if (LR.tabelaIRPF.deducaoDependente_2025) {
        sIRPF += '<p style="color:#666;font-size:0.85em;">Dedução por dependente: ' + _m(LR.tabelaIRPF.deducaoDependente_2025) + '</p>';
      }
      html += _secao('N', 'Tabela IRPF — Referência para Retenções PF', sIRPF);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SEÇÃO NOVA 15 — ÁRVORE DE DECISÃO E ELEGIBILIDADE (PARTE 5B)
    // ═══════════════════════════════════════════════════════════════════════
    if (r.arvoreDecisao) {
      var sArvore = '';
      if (r.arvoreDecisao.recomendacoes && r.arvoreDecisao.recomendacoes.length > 0) {
        sArvore += '<div class="res-oportunidades">';
        r.arvoreDecisao.recomendacoes.forEach(function (rec, i) {
          var corPri = rec.prioridade === 'ALTA' ? '#E74C3C' : rec.prioridade === 'MEDIA' ? '#F39C12' : '#2ECC71';
          sArvore += '<div class="res-oport-card" style="border-left:4px solid ' + corPri + ';margin-bottom:6px;">';
          sArvore += '<div class="res-oport-header"><div class="res-oport-rank">' + (i + 1) + '</div>';
          sArvore += '<div class="res-oport-titulo">' + (rec.titulo || rec.descricao || '') + '</div></div>';
          if (rec.impacto) sArvore += '<div style="font-size:0.85em;color:#666;padding:4px 12px;">' + rec.impacto + '</div>';
          sArvore += '</div>';
        });
        sArvore += '</div>';
      } else if (typeof r.arvoreDecisao === 'object') {
        sArvore += '<div class="res-alerta res-alerta-info"><span class="res-alerta-icon">&#x1F535;</span>Árvore de decisão processada. Consulte as oportunidades ranqueadas para o plano de ação detalhado.</div>';
      }
      html += _secao('O', 'Árvore de Decisão — Otimização Tributária', sArvore);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SEÇÃO NOVA 16 — COMPARATIVO SUDAM (PARTE 5B)
    // ═══════════════════════════════════════════════════════════════════════
    if (r.comparativoSUDAM) {
      var sCompSUDAM = '';
      if (r.comparativoSUDAM.simplesNacional !== undefined && r.comparativoSUDAM.lucroRealSUDAM !== undefined) {
        sCompSUDAM += '<table class="res-table"><thead><tr><th>Regime</th><th>Carga Tributária</th></tr></thead><tbody>';
        sCompSUDAM += '<tr><td>Simples Nacional (estimativa)</td><td class="res-valor">' + _m(r.comparativoSUDAM.simplesNacional) + '</td></tr>';
        sCompSUDAM += '<tr><td>Lucro Real com SUDAM</td><td class="res-valor res-economia">' + _m(r.comparativoSUDAM.lucroRealSUDAM) + '</td></tr>';
        var difComp = _r((r.comparativoSUDAM.simplesNacional || 0) - (r.comparativoSUDAM.lucroRealSUDAM || 0));
        sCompSUDAM += '<tr class="res-total"><td><strong>' + (difComp > 0 ? 'Economia com LR+SUDAM' : 'Diferença') + '</strong></td><td class="res-valor"><strong>' + _m(difComp) + '</strong></td></tr>';
        sCompSUDAM += '</tbody></table>';
      } else {
        sCompSUDAM += '<div class="res-alerta res-alerta-info"><span class="res-alerta-icon">&#x1F535;</span>Comparativo SUDAM processado. Dados detalhados disponíveis no relatório consolidado.</div>';
      }
      html += _secao('P', 'Comparativo: Simples Nacional vs Lucro Real SUDAM', sCompSUDAM);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SEÇÃO NOVA 17 — PDD FISCAL — CRITÉRIOS E FAIXAS DE VALOR (PARTE 5B)
    // ═══════════════════════════════════════════════════════════════════════
    if (LR.pdd && (LR.pdd.criterios || LR.pdd.faixasValor)) {
      var sPDD = '';

      // CORREÇÃO INC-03 (completa): Os artigos do mapeamento externo (LR.pdd) podem
      // conter "Art. 347-351" (Avaliação de Estoques) em vez de "Art. 340-342" (PDD).
      // Sanitizar todas as referências de artigo vindas do mapeamento.
      function _fixPDDArt(artigo) {
        if (!artigo) return '';
        return String(artigo)
          .replace(/Art\.\s*347[\s\-–]+351/gi, 'Art. 340-342')
          .replace(/\b347\b/g, '340')
          .replace(/\b348\b/g, '340')
          .replace(/\b349\b/g, '341')
          .replace(/\b350\b/g, '341')
          .replace(/\b351\b/g, '342');
      }

      var pddArtigoHeader = _fixPDDArt(LR.pdd.artigo) || 'Art. 340-342';

      if (LR.pdd.criterios && LR.pdd.criterios.length > 0) {
        sPDD += '<h4>Critérios para Dedutibilidade <span class="res-artigo">' + pddArtigoHeader + '</span></h4>';
        sPDD += '<table class="res-table"><thead><tr><th>Critério</th><th>Descrição</th><th>Artigo</th></tr></thead><tbody>';
        LR.pdd.criterios.forEach(function (c) {
          sPDD += '<tr><td><strong>' + (c.id || '') + '</strong></td><td>' + (c.descricao || '') + '</td><td><span class="res-artigo">' + _fixPDDArt(c.artigo) + '</span></td></tr>';
        });
        sPDD += '</tbody></table>';
      }
      if (LR.pdd.faixasValor && LR.pdd.faixasValor.length > 0) {
        sPDD += '<h4 style="margin-top:12px;">Faixas de Valor — Requisitos por Faixa</h4>';
        // CORREÇÃO INC-01: Nota sobre o limite padrão correto
        sPDD += '<div class="res-alerta res-alerta-info" style="margin-bottom:8px;font-size:0.85em;"><span class="res-alerta-icon">&#x1F535;</span>' +
          '<strong>Referência padrão (IN SRF 93/97 + jurisprudência CARF):</strong> ' +
          'Créditos até R$ 15.000 por devedor dispensam procedimento judicial — basta protesto extrajudicial. ' +
          'Acima de R$ 15.000: necessário ação judicial ou declaração de insolvência.</div>';
        sPDD += '<table class="res-table"><thead><tr><th>Faixa</th><th>Requisito</th><th>Artigo</th></tr></thead><tbody>';
        LR.pdd.faixasValor.forEach(function (f) {
          var faixaLabel = f.ate ? 'Até ' + _m(f.ate) : (f.acima ? 'Acima de ' + _m(f.acima) : '—');
          sPDD += '<tr><td><strong>' + faixaLabel + '</strong></td><td>' + (f.descricao || '') + '</td><td><span class="res-artigo">' + _fixPDDArt(f.artigo) + '</span></td></tr>';
        });
        sPDD += '</tbody></table>';
      }
      if (LR.pdd.vedacoes && LR.pdd.vedacoes.length > 0) {
        sPDD += '<div class="res-alerta res-alerta-warn" style="margin-top:8px;"><span class="res-alerta-icon">&#x26A0;&#xFE0F;</span><strong>Vedações:</strong> ' + LR.pdd.vedacoes.join('; ') + '</div>';
      }
      html += _secao('Q', 'PDD Fiscal — Critérios e Faixas de Valor', sPDD);
      // CORREÇÃO INC-01: Nota sobre o limite correto de R$ 15.000 (IN SRF 93/97)
      // Os faixasValor do mapeamento externo podem usar limites diferentes (R$5.000/R$30.000)
      // mas o limite correto conforme IN SRF 93/97 e jurisprudência CARF é R$ 15.000
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SEÇÃO NOVA 18 — ESTOQUES — VEDAÇÕES (PARTE 5B)
    // ═══════════════════════════════════════════════════════════════════════
    if (LR.estoques && LR.estoques.vedacoes && LR.estoques.vedacoes.length > 0) {
      var sEstoque = '';
      if (d.metodoEstoque) {
        var metodoSelecionado = null;
        if (LR.estoques.permitidos) {
          LR.estoques.permitidos.forEach(function (m) {
            if (m.id === d.metodoEstoque) metodoSelecionado = m;
          });
        }
        if (metodoSelecionado) {
          sEstoque += '<p>Método selecionado: <strong>' + (metodoSelecionado.descricao || d.metodoEstoque) + '</strong> <span class="res-artigo">' + (metodoSelecionado.artigo || '') + '</span></p>';
        }
      }
      sEstoque += '<h4>Vedações ao Custeio de Estoques <span class="res-artigo">Art. 310 RIR/2018</span></h4>';
      sEstoque += '<div class="res-oportunidades">';
      LR.estoques.vedacoes.forEach(function (v) {
        sEstoque += '<div class="res-alerta res-alerta-warn" style="margin-bottom:4px;"><span class="res-alerta-icon">&#x26A0;&#xFE0F;</span>' + v + '</div>';
      });
      sEstoque += '</div>';
      if (LR.estoques.permitidos && LR.estoques.permitidos.length > 0) {
        sEstoque += '<h4 style="margin-top:12px;">Métodos Permitidos</h4>';
        sEstoque += '<table class="res-table"><thead><tr><th>Método</th><th>Descrição</th><th>Artigo</th></tr></thead><tbody>';
        LR.estoques.permitidos.forEach(function (m) {
          var isSel = (d.metodoEstoque === m.id);
          sEstoque += '<tr' + (isSel ? ' style="background:rgba(16,185,129,0.1);"' : '') + '><td><strong>' + (m.id || '') + '</strong>' + (isSel ? ' ✅' : '') + '</td><td>' + (m.descricao || '') + '</td><td><span class="res-artigo">' + (m.artigo || '') + '</span></td></tr>';
        });
        sEstoque += '</tbody></table>';
      }
      html += _secao('R', 'Avaliação de Estoques — Métodos e Vedações', sEstoque);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SEÇÃO NOVA 19 — EXCLUSÕES DO LUCRO DA EXPLORAÇÃO (PARTE 5B)
    // ═══════════════════════════════════════════════════════════════════════
    if (r.lucroExploracaoResult && LR.exclusoesLucroExploracao) {
      var sExcLE = '';
      sExcLE += '<p style="color:#666;font-size:0.9em;">Para cálculo do lucro da exploração (base dos incentivos SUDAM/SUDENE), devem ser ajustados os seguintes itens:</p>';
      var excluirLE = LR.exclusoesLucroExploracao.excluirDoLucroLiquido || LR.exclusoesLucroExploracao.excluir || [];
      var adicionarLE = LR.exclusoesLucroExploracao.adicionarAoLucroLiquido || LR.exclusoesLucroExploracao.adicionar || [];
      if (excluirLE.length > 0) {
        sExcLE += '<h4>Exclusões do Lucro Líquido</h4>';
        sExcLE += '<table class="res-table"><thead><tr><th>Item</th><th>Descrição</th><th>Artigo</th></tr></thead><tbody>';
        excluirLE.forEach(function (e) {
          sExcLE += '<tr><td>(-)</td><td>' + (e.descricao || e.label || '') + '</td><td><span class="res-artigo">' + (e.artigo || '') + '</span></td></tr>';
        });
        sExcLE += '</tbody></table>';
      }
      if (adicionarLE.length > 0) {
        sExcLE += '<h4 style="margin-top:12px;">Adições ao Lucro Líquido</h4>';
        sExcLE += '<table class="res-table"><thead><tr><th>Item</th><th>Descrição</th><th>Artigo</th></tr></thead><tbody>';
        adicionarLE.forEach(function (a) {
          sExcLE += '<tr><td>(+)</td><td>' + (a.descricao || a.label || '') + '</td><td><span class="res-artigo">' + (a.artigo || '') + '</span></td></tr>';
        });
        sExcLE += '</tbody></table>';
      }
      if (r.lucroExploracaoResult.lucroExploracao !== undefined) {
        sExcLE += '<div style="margin-top:12px;padding:8px 12px;background:rgba(16,185,129,0.08);border-radius:8px;">';
        sExcLE += '<strong>Lucro da Exploração Calculado: ' + _m(r.lucroExploracaoResult.lucroExploracao) + '</strong>';
        if (r.lucroExploracaoResult.reducao75 !== undefined) {
          sExcLE += '<br>Redução 75% aplicável: <span class="res-economia"><strong>' + _m(r.lucroExploracaoResult.reducao75) + '</strong></span>';
        }
        sExcLE += '</div>';
      }
      html += _secao('S', 'Lucro da Exploração — Ajustes SUDAM/SUDENE', sExcLE);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SEÇÃO NOVA 20 — ACRÉSCIMOS MORATÓRIOS E MULTAS (Bloco H)
    //  Arts. 44, 47, 61, 63 — Lei 9.430/1996 + Lei 14.689/2023
    // ═══════════════════════════════════════════════════════════════════════
    if (r.acrescimosMoratorios || r.multaOficio || LR.multasEMora) {
      var sT = '';

      // Tabela de referência — parâmetros legais
      if (LR.multasEMora) {
        var mm = LR.multasEMora;
        sT += '<h4>Parâmetros Legais — Multas e Mora</h4>';
        sT += '<table class="res-table"><thead><tr><th>Parâmetro</th><th>Valor</th><th>Base Legal</th></tr></thead><tbody>';
        if (mm.multaMora) {
          sT += '<tr><td>Multa de Mora (por dia de atraso)</td><td>' + _p(mm.multaMora.taxaDiaria || 0.0033) + '</td><td><span class="res-artigo">' + (mm.multaMora.artigo || 'Art. 61') + '</span></td></tr>';
          sT += '<tr><td>Teto da Multa de Mora</td><td>' + _p(mm.multaMora.teto || 0.20) + '</td><td><span class="res-artigo">Art. 61</span></td></tr>';
        }
        if (mm.jurosMora) {
          sT += '<tr><td>Juros de Mora</td><td>SELIC acumulada + 1% mês pagamento</td><td><span class="res-artigo">' + (mm.jurosMora.artigo || 'Art. 61, §3º') + '</span></td></tr>';
        }
        if (mm.multaOficio) {
          sT += '<tr><td>Multa de Ofício — Padrão</td><td>' + _p(mm.multaOficio.padrao || 0.75) + '</td><td><span class="res-artigo">' + (mm.multaOficio.artigo || 'Art. 44') + '</span></td></tr>';
          sT += '<tr><td>Multa de Ofício — Fraude/Sonegação</td><td>' + _p(mm.multaOficio.fraude || 1.50) + '</td><td><span class="res-artigo">Art. 44, §1º</span></td></tr>';
          if (mm.multaOficio.agravamento) {
            sT += '<tr><td>Agravamento (não atendimento intimação)</td><td>+' + _p(mm.multaOficio.agravamento.naoAtendimentoIntimacao || 0.50) + ' (teto ' + _p(mm.multaOficio.agravamento.percentualMaximo || 2.25) + ')</td><td><span class="res-artigo">Art. 44, §2º</span></td></tr>';
          }
          if (mm.multaOficio.reducoes) {
            sT += '<tr><td>Redução — pagamento em 30 dias</td><td>-' + _p(mm.multaOficio.reducoes.pagamentoOuParcelamento30dias || 0.50) + '</td><td><span class="res-artigo">Art. 44, §3º</span></td></tr>';
            if (mm.multaOficio.reducoes.conformidadeLei14689) {
              sT += '<tr><td>Redução — Conformidade (Lei 14.689/2023)</td><td>Até -' + _p(mm.multaOficio.reducoes.conformidadeLei14689.comTransacao || 0.50) + ' c/ transação</td><td><span class="res-artigo">' + (mm.multaOficio.reducoes.conformidadeLei14689.artigo || 'Lei 14.689/2023') + '</span></td></tr>';
            }
          }
        }
        if (mm.prazoEspontaneo) {
          sT += '<tr><td>Prazo para Pagamento Espontâneo</td><td>' + (mm.prazoEspontaneo.diasAposTermoFiscalizacao || 20) + ' dias do termo de fiscalização</td><td><span class="res-artigo">' + (mm.prazoEspontaneo.artigo || 'Art. 47') + '</span></td></tr>';
        }
        sT += '</tbody></table>';
      }

      // Resultado calculado — acréscimos moratórios
      if (r.acrescimosMoratorios) {
        var am = r.acrescimosMoratorios;
        sT += '<h4 style="margin-top:16px;">Simulação de Acréscimos Moratórios</h4>';
        sT += '<div class="res-cards-row">';
        sT += '<div class="res-card"><div class="res-card-label">Valor Original</div><div class="res-card-value">' + _m(am.valorOriginal || 0) + '</div></div>';
        sT += '<div class="res-card"><div class="res-card-label">Multa de Mora</div><div class="res-card-value res-negativo">' + _m(am.multaMora || 0) + '</div></div>';
        sT += '<div class="res-card"><div class="res-card-label">Juros (SELIC)</div><div class="res-card-value res-negativo">' + _m(am.jurosMora || 0) + '</div></div>';
        sT += '<div class="res-card"><div class="res-card-label">Total a Pagar</div><div class="res-card-value" style="color:#e74c3c;font-weight:700;">' + _m(am.valorTotal || 0) + '</div></div>';
        sT += '</div>';
        if (am.espontaneo) {
          sT += '<div class="res-alert res-alert-info">Pagamento espontâneo — sem multa de ofício. Incide apenas multa de mora + juros SELIC.</div>';
        }
      }

      // Resultado calculado — multa de ofício
      if (r.multaOficio) {
        var mo = r.multaOficio;
        sT += '<h4 style="margin-top:16px;">Simulação de Multa de Ofício</h4>';
        sT += '<div class="res-cards-row">';
        sT += '<div class="res-card"><div class="res-card-label">Multa Calculada</div><div class="res-card-value res-negativo">' + _m(mo.multaOficio || mo.valorFinal || 0) + '</div></div>';
        sT += '<div class="res-card"><div class="res-card-label">Percentual Aplicado</div><div class="res-card-value">' + _p(mo.percentualAplicado || 0.75) + '</div></div>';
        sT += '</div>';
        if (mo.reducoes && mo.reducoes.length > 0) {
          sT += '<div class="res-alert res-alert-success">Reduções aplicadas: ' + mo.reducoes.join('; ') + '</div>';
        }
      }

      // Suspensão de multa
      if (r.suspensaoMulta && r.suspensaoMulta.suspensa) {
        sT += '<div class="res-alert res-alert-success" style="margin-top:12px;"><strong>Multa de ofício suspensa</strong> — ' + (r.suspensaoMulta.motivo || 'Liminar/Tutela vigente') + ' <span class="res-artigo">Art. 63</span></div>';
      }

      // Prazo espontâneo
      if (r.prazoEspontaneo && r.prazoEspontaneo.prazoFinal) {
        sT += '<div class="res-alert res-alert-warning" style="margin-top:12px;"><strong>Prazo Espontâneo:</strong> até ' + new Date(r.prazoEspontaneo.prazoFinal).toLocaleDateString('pt-BR') + ' (' + (r.prazoEspontaneo.artigo || 'Art. 47') + '). Pagamento dentro deste prazo evita multa de ofício.</div>';
      }

      html += _secao('T', 'Acréscimos Moratórios e Multas', sT);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SEÇÃO NOVA 21 — COMPENSAÇÃO PER/DCOMP (Bloco I)
    //  Arts. 73, 74, 74-A — CTN + Lei 14.873/2024
    // ═══════════════════════════════════════════════════════════════════════
    if (r.compensacaoPERDCOMP || r.compensacaoJudicial || LR.compensacaoPERDCOMP) {
      var sU = '';

      // Tabela de vedações — referência legal
      if (LR.compensacaoPERDCOMP) {
        var cp = LR.compensacaoPERDCOMP;
        if (cp.vedacoes && cp.vedacoes.length > 0) {
          sU += '<h4>Vedações à Compensação (§3º do Art. 74)</h4>';
          sU += '<table class="res-table"><thead><tr><th>Hipótese</th><th>Descrição</th><th>Artigo</th></tr></thead><tbody>';
          cp.vedacoes.forEach(function (v) {
            sU += '<tr><td>' + (v.id || '') + '</td><td>' + (v.descricao || '') + '</td><td><span class="res-artigo">' + (v.artigo || '') + '</span></td></tr>';
          });
          sU += '</tbody></table>';
        }

        if (cp.hipotesesNaoDeclarada && cp.hipotesesNaoDeclarada.length > 0) {
          sU += '<h4 style="margin-top:16px;">Hipóteses de "Não Declarada" (§12 do Art. 74)</h4>';
          sU += '<table class="res-table"><thead><tr><th>Hipótese</th><th>Descrição</th><th>Artigo</th></tr></thead><tbody>';
          cp.hipotesesNaoDeclarada.forEach(function (h) {
            sU += '<tr><td>' + (h.id || '') + '</td><td>' + (h.descricao || '') + '</td><td><span class="res-artigo">' + (h.artigo || '') + '</span></td></tr>';
          });
          sU += '</tbody></table>';
        }

        if (cp.multaCompensacaoIndevida) {
          sU += '<div class="res-alert res-alert-danger" style="margin-top:12px;"><strong>⚠️ Multa por Compensação Indevida:</strong> ' + _p(cp.multaCompensacaoIndevida.percentual || 0.50) + ' sobre o valor não homologado (' + (cp.multaCompensacaoIndevida.artigo || '§17') + ')</div>';
        }

        if (cp.compensacaoJudicial) {
          sU += '<div class="res-alert res-alert-warning" style="margin-top:12px;"><strong>Limite Judicial (Art. 74-A):</strong> ' + (cp.compensacaoJudicial.descricao || 'Créditos > R$ 10 milhões — 1/60 por mês') + '</div>';
        }

        if (cp.prazoDecadencial) {
          sU += '<p style="color:#666;font-size:0.9em;margin-top:8px;">' + (cp.prazoDecadencial.descricao || '') + ' <span class="res-artigo">' + (cp.prazoDecadencial.artigo || 'Art. 168 CTN') + '</span></p>';
        }
      }

      // Resultado calculado — análise PER/DCOMP
      if (r.compensacaoPERDCOMP) {
        var pdc = r.compensacaoPERDCOMP;
        sU += '<h4 style="margin-top:16px;">Análise da Compensação Solicitada</h4>';
        sU += '<div class="res-cards-row">';
        sU += '<div class="res-card"><div class="res-card-label">Status</div><div class="res-card-value" style="color:' + (pdc.compensacaoPermitida ? '#2ecc71' : '#e74c3c') + ';">' + (pdc.compensacaoPermitida ? '✅ Permitida' : '❌ Vedada') + '</div></div>';
        if (pdc.riscoMulta50 && pdc.riscoMulta50.aplicavel) {
          sU += '<div class="res-card"><div class="res-card-label">Risco Multa 50%</div><div class="res-card-value res-negativo">' + _m(pdc.riscoMulta50.valor || 0) + '</div></div>';
        }
        if (pdc.impactoLucroReal) {
          var impLR = pdc.impactoLucroReal;
          if ((impLR.reducaoIRPJ || 0) > 0 || (impLR.reducaoCSLL || 0) > 0) {
            sU += '<div class="res-card"><div class="res-card-label">Redução IRPJ</div><div class="res-card-value res-economia">' + _m(impLR.reducaoIRPJ || 0) + '</div></div>';
            sU += '<div class="res-card"><div class="res-card-label">Redução CSLL</div><div class="res-card-value res-economia">' + _m(impLR.reducaoCSLL || 0) + '</div></div>';
          }
        }
        sU += '</div>';

        if (pdc.vedacoes && pdc.vedacoes.length > 0) {
          sU += '<div class="res-alert res-alert-danger">Vedações identificadas: ' + pdc.vedacoes.join(', ') + '</div>';
        }
        if (pdc.hipotesesNaoDeclarada && pdc.hipotesesNaoDeclarada.length > 0) {
          sU += '<div class="res-alert res-alert-warning">Risco de "não declarada": ' + pdc.hipotesesNaoDeclarada.join(', ') + '</div>';
        }
        if (pdc.recomendacoes && pdc.recomendacoes.length > 0) {
          sU += '<h4 style="margin-top:12px;">Recomendações</h4><ul>';
          pdc.recomendacoes.forEach(function (rec) { sU += '<li>' + rec + '</li>'; });
          sU += '</ul>';
        }
      }

      // Resultado calculado — compensação judicial (1/60)
      if (r.compensacaoJudicial && r.compensacaoJudicial.sujeito) {
        var cj = r.compensacaoJudicial;
        sU += '<h4 style="margin-top:16px;">Cronograma de Compensação Judicial (Art. 74-A)</h4>';
        sU += '<div class="res-cards-row">';
        sU += '<div class="res-card"><div class="res-card-label">Limite Mensal</div><div class="res-card-value">' + _m(cj.limiteMensal || 0) + '</div></div>';
        sU += '<div class="res-card"><div class="res-card-label">Prazo Total</div><div class="res-card-value">' + (cj.prazoTotal || 60) + ' meses</div></div>';
        sU += '</div>';
        if (cj.cronograma && cj.cronograma.length > 0) {
          sU += '<details style="margin-top:8px;"><summary style="cursor:pointer;font-weight:600;">Ver cronograma mês a mês (' + cj.cronograma.length + ' parcelas)</summary>';
          sU += '<table class="res-table" style="margin-top:6px;"><thead><tr><th>Mês</th><th>Compensação</th><th>Saldo Remanescente</th></tr></thead><tbody>';
          cj.cronograma.forEach(function (p) {
            sU += '<tr><td>' + (p.mes || p.parcela || '') + '</td><td>' + _m(p.valor || p.compensacao || 0) + '</td><td>' + _m(p.saldo || p.saldoRemanescente || 0) + '</td></tr>';
          });
          sU += '</tbody></table></details>';
        }
      }

      html += _secao('U', 'Compensação PER/DCOMP', sU);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SEÇÃO 13 — CRONOGRAMA DE IMPLEMENTAÇÃO (condicional)
    // ═══════════════════════════════════════════════════════════════════════
    var situacao = d.situacaoAtual || '';
    if (situacao === 'vai_migrar' || situacao === 'avaliando') {
      var s13 = '<div class="res-timeline">';
      var etapas = [
        { fase: "1", titulo: "Diagnóstico Tributário", prazo: "Semana 1-2", desc: "Análise completa da situação fiscal atual, identificação de riscos e oportunidades." },
        { fase: "2", titulo: "Levantamento de Saldos", prazo: "Semana 2-3", desc: "Apurar saldos de prejuízo fiscal, base negativa, retenções acumuladas e créditos de PIS/COFINS." },
        { fase: "3", titulo: "Ajustes Contábeis (IFRS/CPC)", prazo: "Semana 3-5", desc: "Adequar contabilidade aos padrões IFRS. Conciliações e ajustes de classificação." },
        { fase: "4", titulo: "Implementação LALUR/LACS", prazo: "Semana 5-7", desc: "Estruturar Parte A e Parte B do LALUR. Configurar sistema de adições e exclusões." },
        { fase: "5", titulo: "Setup ECD/ECF/EFD", prazo: "Semana 7-9", desc: "Configurar escriturações digitais. Mapear plano de contas referencial." },
        { fase: "6", titulo: "Créditos PIS/COFINS", prazo: "Semana 8-10", desc: "Mapear todos os insumos elegíveis a créditos. Implementar controles de apropriação." },
        { fase: "7", titulo: "JCP e Incentivos", prazo: "Semana 10-11", desc: "Estruturar distribuição de JCP. Cadastrar nos programas de incentivos aplicáveis (PAT, FIA, etc.)." },
        { fase: "8", titulo: "Go-Live e Monitoramento", prazo: "Semana 12+", desc: "Primeira apuração no Lucro Real. Monitoramento contínuo dos indicadores fiscais." }
      ];
      etapas.forEach(function (et) {
        s13 += '<div class="res-timeline-item">';
        s13 += '<div class="res-timeline-marker">' + et.fase + '</div>';
        s13 += '<div class="res-timeline-content">';
        s13 += '<div class="res-timeline-titulo"><strong>' + et.titulo + '</strong> <span class="res-timeline-prazo">' + et.prazo + '</span></div>';
        s13 += '<div class="res-timeline-desc">' + et.desc + '</div>';
        s13 += '</div></div>';
      });
      s13 += '</div>';
      html += _secao(13, 'Cronograma de Implementação', s13);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SEÇÃO 14 — RODAPÉ E AÇÕES
    // ═══════════════════════════════════════════════════════════════════════
    var s14 = '<div class="res-footer">';
    if (elab.nome) {
      s14 += '<div class="res-footer-elaborador"><strong>Elaborado por:</strong> ' + elab.nome;
      if (elab.registro) s14 += ' — ' + elab.registro;
      s14 += '</div>';
    }
    s14 += '<div class="res-footer-data"><strong>Data de geração:</strong> ' + dataFormatada + ' às ' + dataHoje.toLocaleTimeString("pt-BR") + '</div>';
    s14 += '<div class="res-footer-base">Base legal: RIR/2018 (Decreto 9.580/2018), Lei 7.689/1988, Lei 9.430/1996, Lei 10.637/2002, Lei 10.833/2003, Lei 14.689/2023, Lei 14.873/2024, LC 116/2003</div>';
    s14 += '<div class="res-footer-disclaimer">' + cfg.disclaimer + '</div>';
    if (cfg.mostrarMarcaImpost) {
      s14 += '<div class="res-footer-marca">' + cfg.nomeProduto + ' v' + VERSAO + ' — ' + cfg.subtitulo + '</div>';
    }
    s14 += '<div class="res-actions">';
    s14 += '<button class="res-btn" onclick="window.print()">Imprimir</button>';
    s14 += '<button class="res-btn" onclick="LucroRealEstudos.exportarJSON()">Exportar JSON</button>';
    s14 += '<button class="res-btn" onclick="LucroRealEstudos.voltarWizard()">Editar Dados</button>';
    s14 += '<button class="res-btn" onclick="LucroRealEstudos.novoEstudo()">Novo Estudo</button>';
    s14 += '</div>';
    s14 += '</div>';
    html += _secao(14, '', s14);

    // Gráfico alíquota efetiva (gauge)
    html += '<div class="res-chart-container res-chart-aliquota" style="max-width:250px;margin:0 auto 2rem;"><canvas id="chartAliquota" width="250" height="250"></canvas></div>';

    // ═══ Inserir HTML no container ═══
    resContainer.innerHTML = html;

    // ═══ Renderizar gráficos após DOM atualizar ═══
    requestAnimationFrame(function () {
      renderCharts(r);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER GRÁFICOS (Chart.js) — 7 gráficos
  // ═══════════════════════════════════════════════════════════════════════════

  function renderCharts(r) {
    if (typeof Chart === "undefined") {
      console.warn("[IMPOST.] Chart.js não carregado — gráficos não renderizados.");
      return;
    }

    var CORES = {
      irpj: '#E74C3C',
      csll: '#F39C12',
      pisCofins: '#3498DB',
      iss: '#9B59B6',
      economia: '#2ECC71',
      bruto: '#95A5A6',
      otimizado: '#27AE60',
      pessimista: '#E74C3C',
      base: '#3498DB',
      otimista: '#2ECC71'
    };

    var chartDefaults = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#ccc', font: { family: "'DM Sans', sans-serif", size: 12 } } },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              return ctx.dataset.label + ': ' + _m(ctx.parsed.y || ctx.parsed || 0);
            }
          }
        }
      },
      scales: {
        x: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.06)' } },
        y: { ticks: { color: '#aaa', callback: function (v) { return _m(v); } }, grid: { color: 'rgba(255,255,255,0.06)' } }
      }
    };

    // ── Gráfico 1: Doughnut — Composição ──
    var elComp = $("chartComposicao");
    if (elComp && r.composicao) {
      new Chart(elComp, {
        type: 'doughnut',
        data: {
          labels: ['IRPJ', 'CSLL', 'PIS/COFINS', 'ISS'],
          datasets: [{
            data: [r.composicao.irpj.valor, r.composicao.csll.valor, r.composicao.pisCofins.valor, r.composicao.iss.valor],
            backgroundColor: [CORES.irpj, CORES.csll, CORES.pisCofins, CORES.iss],
            borderColor: '#161e31',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { position: 'bottom', labels: { color: '#ccc' } },
            tooltip: {
              callbacks: { label: function (ctx) { return ctx.label + ': ' + _m(ctx.parsed); } }
            }
          }
        }
      });
    }

    // ── Gráfico 2: Bar horizontal — Ranking de economias ──
    var elEcon = $("chartEconomias");
    if (elEcon && r.economia) {
      var econLabels = [];
      var econValues = [];
      var econColors = [];
      var eco = r.economia;
      var items = [
        { label: 'JCP', val: eco.jcp },
        { label: 'SUDAM/SUDENE', val: eco.sudam },
        { label: 'Incentivos Fiscais', val: eco.incentivos },
        { label: 'Depreciação', val: eco.depreciacao },
        { label: 'Créditos PIS/COFINS', val: eco.pisCofinsCreditos },
        { label: 'Gratificação→Pró-labore', val: eco.gratificacao },
        { label: 'CPRB Desoneração', val: eco.cprb },
        { label: 'PDD Fiscal', val: eco.pddFiscal }
      ];
      items.sort(function (a, b) { return (b.val || 0) - (a.val || 0); });
      items.forEach(function (it) {
        if (it.val > 0) {
          econLabels.push(it.label);
          econValues.push(it.val);
          econColors.push(CORES.economia);
        }
      });
      if (econLabels.length > 0) {
        new Chart(elEcon, {
          type: 'bar',
          data: {
            labels: econLabels,
            datasets: [{ label: 'Economia Anual', data: econValues, backgroundColor: econColors, borderRadius: 4 }]
          },
          options: Object.assign({}, chartDefaults, {
            indexAxis: 'y',
            plugins: Object.assign({}, chartDefaults.plugins, {
              tooltip: { callbacks: { label: function (ctx) { return _m(ctx.parsed.x); } } }
            }),
            scales: {
              x: { ticks: { color: '#aaa', callback: function (v) { return _m(v); } }, grid: { color: 'rgba(255,255,255,0.06)' } },
              y: { ticks: { color: '#ccc' }, grid: { display: false } }
            }
          })
        });
      }
    }

    // ── Gráfico 3: Bar agrupado — Antes vs Depois ──
    var elAD = $("chartAntesDepois");
    if (elAD && r.resumo) {
      new Chart(elAD, {
        type: 'bar',
        data: {
          labels: ['Carga Tributária'],
          datasets: [
            { label: 'Sem Otimização', data: [r.resumo.cargaBruta], backgroundColor: CORES.bruto, borderRadius: 4 },
            { label: 'Com Otimização', data: [r.resumo.cargaOtimizada], backgroundColor: CORES.otimizado, borderRadius: 4 }
          ]
        },
        options: chartDefaults
      });
    }

    // ── Gráfico 4: Line — Projeção acumulada ──
    var elProj = $("chartProjecao");
    if (elProj && r.projecao && r.projecao.projecaoCarga) {
      var projLabels = r.projecao.projecaoCarga.map(function (p) { return 'Ano ' + p.ano; });
      var projValues = r.projecao.projecaoCarga.map(function (p) { return p.economiaAcumulada; });
      new Chart(elProj, {
        type: 'line',
        data: {
          labels: projLabels,
          datasets: [{
            label: 'Economia Acumulada',
            data: projValues,
            borderColor: CORES.economia,
            backgroundColor: 'rgba(46,204,113,0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 5,
            pointBackgroundColor: CORES.economia
          }]
        },
        options: chartDefaults
      });
    }

    // ── Gráfico 5: Bar empilhado — Fluxo mensal ──
    var elFluxo = $("chartFluxoMensal");
    if (elFluxo && r.fluxoCaixa && r.fluxoCaixa.meses) {
      var mLabels = r.fluxoCaixa.meses.map(function (m) { return ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"][m.mes - 1]; });
      new Chart(elFluxo, {
        type: 'bar',
        data: {
          labels: mLabels,
          datasets: [
            { label: 'IRPJ', data: r.fluxoCaixa.meses.map(function (m) { return m.irpj; }), backgroundColor: CORES.irpj },
            { label: 'CSLL', data: r.fluxoCaixa.meses.map(function (m) { return m.csll; }), backgroundColor: CORES.csll },
            { label: 'PIS', data: r.fluxoCaixa.meses.map(function (m) { return m.pis; }), backgroundColor: '#2980B9' },
            { label: 'COFINS', data: r.fluxoCaixa.meses.map(function (m) { return m.cofins; }), backgroundColor: CORES.pisCofins },
            { label: 'ISS', data: r.fluxoCaixa.meses.map(function (m) { return m.iss; }), backgroundColor: CORES.iss }
          ]
        },
        options: Object.assign({}, chartDefaults, {
          scales: {
            x: { stacked: true, ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.06)' } },
            y: { stacked: true, ticks: { color: '#aaa', callback: function (v) { return _m(v); } }, grid: { color: 'rgba(255,255,255,0.06)' } }
          }
        })
      });
    }

    // ── Gráfico 6: Bar agrupado — Cenários ──
    var elCen = $("chartCenarios");
    if (elCen && r.cenarios && r.cenarios.length > 0) {
      new Chart(elCen, {
        type: 'bar',
        data: {
          labels: r.cenarios.map(function (c) { return c.nome; }),
          datasets: [
            { label: 'IRPJ+CSLL', data: r.cenarios.map(function (c) { return c.irpjCSLL; }), backgroundColor: CORES.irpj, borderRadius: 4 },
            { label: 'PIS/COFINS', data: r.cenarios.map(function (c) { return c.pisCofins; }), backgroundColor: CORES.pisCofins, borderRadius: 4 },
            { label: 'ISS', data: r.cenarios.map(function (c) { return c.iss; }), backgroundColor: CORES.iss, borderRadius: 4 }
          ]
        },
        options: chartDefaults
      });
    }

    // ── Gráfico 7: Doughnut com texto central — Alíquota efetiva (gauge) ──
    var elAliq = $("chartAliquota");
    if (elAliq && r.resumo) {
      var aliqVal = r.resumo.aliquotaEfetiva || 0;
      var restante = Math.max(100 - aliqVal, 0);
      new Chart(elAliq, {
        type: 'doughnut',
        data: {
          labels: ['Carga Tributária', 'Receita Livre'],
          datasets: [{
            data: [aliqVal, restante],
            backgroundColor: [CORES.irpj, 'rgba(255,255,255,0.08)'],
            borderColor: '#161e31',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          cutout: '70%',
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: { label: function (ctx) { return ctx.label + ': ' + ctx.parsed.toFixed(2) + '%'; } }
            }
          }
        },
        plugins: [{
          id: 'centerText',
          afterDraw: function (chart) {
            var ctx2d = chart.ctx;
            var w = chart.width;
            var h = chart.height;
            ctx2d.save();
            ctx2d.textAlign = 'center';
            ctx2d.textBaseline = 'middle';
            ctx2d.fillStyle = '#ccc';
            ctx2d.font = 'bold 22px "DM Sans", sans-serif';
            ctx2d.fillText(aliqVal.toFixed(2) + '%', w / 2, h / 2 - 8);
            ctx2d.font = '12px "DM Sans", sans-serif';
            ctx2d.fillStyle = '#999';
            ctx2d.fillText('Alíquota Efetiva', w / 2, h / 2 + 16);
            ctx2d.restore();
          }
        }]
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  PREENCHIMENTO DE EXEMPLO (Demo genérico)
  // ═══════════════════════════════════════════════════════════════════════════

  function preencherExemplo() {
    dadosEmpresa = {
      razaoSocial: "Empresa Modelo Consultoria Ltda",
      cnpj: "12.345.678/0001-90",
      cnaePrincipal: "7020-4/00",
      uf: "SP",
      municipio: "São Paulo",
      issAliquota: 5,
      issConhecido: true,
      tipoAtividade: "SERVICOS_GERAL",
      apuracaoLR: "trimestral",
      anoBase: "2026",
      numSocios: "2",
      numFuncionarios: "25",
      prestaServPublico: false,
      ehFinanceira: false,
      receitaBrutaAnual: 3000000,
      receitaServicos: 3000000,
      percentReceitaPublico: 15,
      folhaPagamentoAnual: 1200000,
      cmv: 100000,
      servicosTerceiros: 150000,
      aluguelAnual: 72000,
      energiaAnual: 36000,
      telecomAnual: 18000,
      honorariosContabeis: 36000,
      marketingPublicidade: 24000,
      outrasDespesasOp: 48000,
      temMultas: true,
      multasPunitivas: 5000,
      temBrindes: true,
      brindes: 3000,
      temGratificacaoAdm: true,
      gratificacoesAdm: 24000,
      patrimonioLiquido: 600000,
      capitalSocial: 300000,
      lucrosAcumulados: 300000,
      detalharPL: true,
      tjlp: 7.97,
      prejuizoFiscal: 200000,
      baseNegativaCSLL: 150000,
      irrfRetidoPublico: 21600,
      pisRetido: 2925,
      cofinsRetido: 13500,
      csllRetido: 4500,
      comprasMercadoriasAnual: 80000,
      energiaCredito: 36000,
      alugueisPJCredito: 72000,
      depreciacaoBensCredito: 55000,
      freteVendasAnual: 24000,
      valorVeiculos: 180000,
      valorComputadores: 60000,
      valorMoveis: 30000,
      temPDD: true,
      perdasCreditos6Meses: 50000,
      perdasCreditosJudicial: 30000,
      turnosOperacao: "1",
      gerarCenarios: true,
      variacaoMargemCenario: 5,
      gerarProjecao: true,
      taxaCrescimentoAnual: 10,
      horizonteProjecao: "5",
    };
    currentStep = 0;
    saveToLS();
    renderWizard();

    // MELHORIA #4: Teste de regressão automático
    // Após preencher dados de exemplo, rodar cálculo e validar totais esperados
    setTimeout(function() {
      try {
        analisar();
        var r = resultadosCache;
        if (!r || !r.resumo) { console.warn('[TESTE REGRESSÃO] Sem resultados após analisar()'); return; }
        var checks = [
          // [caminho, valorEsperado, tolerancia]
          ['resumo.cargaBruta', null, 0.02],           // valor real a definir após baseline
          ['resumo.economiaTotal', null, 0.02],
          ['irpj.irpjDevido', null, 0.02]
        ];
        checks.forEach(function(chk) {
          if (chk[1] === null) return; // skip se valor esperado não definido
          var partes = chk[0].split('.');
          var atual = r;
          partes.forEach(function(p) { atual = atual ? atual[p] : null; });
          if (atual === null || atual === undefined) {
            console.error('[TESTE REGRESSÃO] Campo ' + chk[0] + ' não encontrado nos resultados');
          } else if (Math.abs(atual - chk[1]) > chk[2]) {
            console.error('[TESTE REGRESSÃO] ' + chk[0] + ': esperado ' + chk[1] + ', obtido ' + atual);
          } else {
            console.info('[TESTE REGRESSÃO] ✓ ' + chk[0] + ' = ' + atual);
          }
        });
        console.info('[TESTE REGRESSÃO] Para definir baseline, anote: cargaBruta=' + _safe(r, 'resumo', 'cargaBruta') + ', economiaTotal=' + _safe(r, 'resumo', 'economiaTotal') + ', irpjDevido=' + _safe(r, 'irpj', 'irpjDevido'));
      } catch(e) {
        console.error('[TESTE REGRESSÃO] Erro ao executar:', e.message);
      }
    }, 200);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  NOVO ESTUDO
  // ═══════════════════════════════════════════════════════════════════════════

  function novoEstudo() {
    if (confirm("Tem certeza? Os dados atuais serão perdidos.")) {
      dadosEmpresa = {};
      currentStep = 0;
      resultadosCache = null;
      localStorage.removeItem(LS_KEY_DADOS);
      localStorage.removeItem(LS_KEY_STEP);
      localStorage.removeItem(LS_KEY_RESULTADOS);
      renderWizard();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  EXPORTAR JSON / IMPRIMIR
  // ═══════════════════════════════════════════════════════════════════════════

  function exportarJSON() {
    var exportData = {
      versao: VERSAO,
      produto: CONFIG.nomeProduto,
      dataExportacao: new Date().toISOString(),
      dadosEmpresa: dadosEmpresa,
      resultados: resultadosCache,
    };
    var blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download =
      "estudo-lucro-real-" +
      (dadosEmpresa.razaoSocial || "empresa").replace(/\s+/g, "-") +
      "-" +
      new Date().toISOString().split("T")[0] +
      ".json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function imprimir() {
    window.print();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  INIT — Verificação de dependências
  // ═══════════════════════════════════════════════════════════════════════════

  function init() {
    // 1. Verificar mapeamento (obrigatório)
    LR = window.LR || window.LucroRealMap;
    if (!LR) {
      mostrarErro(
        "lucro-real-mapeamento.js não carregado. Verifique se o script foi incluído antes deste arquivo."
      );
      return;
    }

    // 2. Verificar estados.js (obrigatório para municípios)
    ESTADOS = window.ESTADOS || window.Estados || window.EstadosBR;
    if (!ESTADOS) {
      mostrarErro(
        "estados.js não carregado. Verifique se o script foi incluído antes deste arquivo."
      );
      return;
    }

    // 3. Verificar MunicipiosIBGE (obrigatório para select de municípios)
    if (!window.MunicipiosIBGE) {
      mostrarErro(
        "municipios.js não carregado. Verifique se o script foi incluído antes deste arquivo."
      );
      return;
    }

    // 4. Ler white-label config
    var cfg = window.IMPOST_CONFIG || {};
    CONFIG = Object.assign({}, CONFIG_DEFAULTS, cfg);
    if (cfg.elaboradoPor) {
      CONFIG.elaboradoPor = Object.assign(
        {},
        CONFIG_DEFAULTS.elaboradoPor,
        cfg.elaboradoPor
      );
    }

    // 5. Injetar CSS de siglas (tooltips)
    _injectSiglaCSS();

    // 6. Restaurar dados salvos
    loadFromLS();

    // 7. Renderizar wizard
    renderWizard();

    // ═══ FIX BUG #2: Sincronizar badge de versão no header com VERSAO do JS ═══
    var _vBadge = document.getElementById('versionBadge') || document.querySelector('.header-version');
    if (_vBadge) _vBadge.textContent = 'v' + VERSAO;

    console.log(
      "[" + CONFIG.nomeProduto + " LucroRealEstudos] v" + VERSAO + " inicializado. " +
      "LR: ✓ | ESTADOS: ✓ | MunicipiosIBGE: ✓"
    );
  }



  // ═══════════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════════
  // ██████████████████████████████████████████████████████████████████████████
  //  MÓDULO DE EXPORTAÇÃO PDF / EXCEL                                       █
  //  (integrado — anteriormente em lucro-real-estudos-export.js)             █
  //  Gera relatórios profissionais: PDF Simplificado, PDF Completo, Excel    █
  // ██████████████████████████████████████████████████████████████████████████
  // ═══════════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Helpers de data para exportação ──
  function _dataFormatada(iso) {
    if (!iso) return new Date().toLocaleDateString('pt-BR');
    var dt = new Date(iso);
    return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  }
  function _dataHora(iso) {
    if (!iso) return '';
    var dt = new Date(iso);
    return dt.toLocaleDateString('pt-BR') + ' ' + dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  function _dataCurta() {
    return new Date().toISOString().split('T')[0];
  }


  // ═══════════════════════════════════════════════════════════════════════════
  //  CORES & ESTILOS
  // ═══════════════════════════════════════════════════════════════════════════

  var COR = {
    primary: '#2D8C4E',
    primaryDark: '#1E6B38',
    accent: '#2ECC71',
    accentDark: '#27AE60',
    danger: '#E74C3C',
    warning: '#F39C12',
    info: '#3498DB',
    purple: '#9B59B6',
    text: '#1a1a2e',
    textSec: '#5a6170',
    textMuted: '#8b95a5',
    stripe: '#f7f9fb',
    ecoBg: '#eafaf1',
    dangerBg: '#FADBD8',
    warningBg: '#FEF5E7',
    infoBg: '#EBF5FB',
    white: '#FFFFFF',
    headerBg: '#2D8C4E',
    totalBg: '#2D8C4E',
    subtotalBg: '#E2E6EA'
  };

  var FONT = "font-family:'DM Sans','Segoe UI',Helvetica,Arial,sans-serif;";
  var FONT_MONO = "font-family:'JetBrains Mono','Fira Code','Courier New',monospace;";
  var BASE_CSS = FONT + "color:" + COR.text + ";font-size:11px;line-height:1.6;";

  // ═══════════════════════════════════════════════════════════════════════════
  //  LOADING OVERLAY
  // ═══════════════════════════════════════════════════════════════════════════

  function showLoading(msg) {
    hideLoading();
    var overlay = document.createElement('div');
    overlay.id = '__impost_loading';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;background:rgba(10,15,30,0.85);display:flex;align-items:center;justify-content:center;flex-direction:column;';
    overlay.innerHTML =
      '<div style="width:48px;height:48px;border:4px solid rgba(255,255,255,0.15);border-top:4px solid #2ECC71;border-radius:50%;animation:impostSpin 0.8s linear infinite;margin-bottom:16px;"></div>' +
      '<div style="color:#fff;font-size:15px;' + FONT + '">' + (msg || 'Gerando...') + '</div>' +
      '<style>@keyframes impostSpin{to{transform:rotate(360deg)}}</style>';
    document.body.appendChild(overlay);
  }

  function hideLoading() {
    var el = document.getElementById('__impost_loading');
    if (el) el.remove();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  HTML BUILDERS — Blocos reutilizáveis para PDF
  // ═══════════════════════════════════════════════════════════════════════════

  /** Cabeçalho do PDF com logo IMPOST., empresa, data */
  function pdfHeader(r, titulo) {
    var d = r.dadosEmpresa || {};
    var cfg = r.config || {};
    var h = '';
    h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid ' + COR.primary + ';padding-bottom:14px;margin-bottom:18px;">';
    // Logo lado esquerdo
    h += '<div>';
    if (cfg.mostrarMarcaImpost !== false) {
      h += '<div style="font-size:26px;font-weight:800;color:' + COR.primary + ';letter-spacing:1px;' + FONT + '">' + (cfg.nomeProduto || 'IMPOST.') + '</div>';
      h += '<div style="font-size:9px;color:' + COR.textMuted + ';margin-top:2px;' + FONT + '">' + (cfg.subtitulo || '') + '</div>';
    }
    h += '</div>';
    // Info lado direito
    h += '<div style="text-align:right;font-size:10px;color:' + COR.textSec + ';">';
    h += '<div style="font-weight:700;font-size:12px;color:' + COR.text + ';">' + (d.razaoSocial || 'Empresa') + '</div>';
    if (d.cnpj) h += '<div>CNPJ: ' + d.cnpj + '</div>';
    h += '<div>' + (d.municipio || '') + '/' + (d.uf || '') + ' — ' + (d.anoBase || new Date().getFullYear()) + '</div>';
    h += '</div>';
    h += '</div>';
    // Título do relatório
    h += '<div style="text-align:center;margin-bottom:18px;">';
    h += '<div style="font-size:16px;font-weight:700;color:' + COR.primary + ';text-transform:uppercase;letter-spacing:2px;' + FONT + '">' + titulo + '</div>';
    h += '<div style="font-size:9px;color:' + COR.textMuted + ';margin-top:4px;">Gerado em ' + _dataFormatada(r.dataGeracao) + ' — v' + (r.versao || '2.0.0') + '</div>';
    h += '</div>';
    return h;
  }

  /** Rodapé padrão */
  function pdfFooter(r) {
    var cfg = r.config || {};
    var ep = cfg.elaboradoPor || {};
    var h = '<div style="margin-top:30px;border-top:2px solid #e0e4e8;padding-top:14px;font-size:9px;color:' + COR.textMuted + ';">';
    // Disclaimer
    h += '<div style="background:#f8f9fa;border-left:3px solid ' + COR.info + ';padding:10px 14px;margin-bottom:12px;font-size:9px;color:' + COR.textSec + ';line-height:1.5;">';
    h += (cfg.disclaimer || 'Este estudo é uma estimativa automatizada para fins de planejamento tributário. Consulte um profissional habilitado para validação e implementação.');
    h += '</div>';
    // Elaborado por
    if (ep.nome) {
      h += '<div style="margin-top:30px;text-align:center;">';
      h += '<div style="border-top:1px solid #ccc;width:250px;margin:0 auto 6px;"></div>';
      h += '<div style="font-weight:600;color:' + COR.text + ';font-size:11px;">' + ep.nome + '</div>';
      if (ep.registro) h += '<div>' + ep.registro + '</div>';
      if (ep.email) h += '<div>' + ep.email + '</div>';
      if (ep.telefone) h += '<div>' + ep.telefone + '</div>';
      h += '</div>';
    }
    // Powered by
    if (cfg.mostrarMarcaImpost !== false) {
      h += '<div style="text-align:center;margin-top:14px;font-size:8px;color:' + COR.textMuted + ';">Powered by ' + (cfg.nomeProduto || 'IMPOST.') + ' v' + (r.versao || '2.0.0') + '</div>';
    }
    h += '</div>';
    return h;
  }

  /** Título de seção com ícone */
  function secaoTitulo(icone, texto, sub) {
    var h = '<div style="page-break-inside:avoid;margin:22px 0 12px;">';
    h += '<div style="font-size:15px;font-weight:700;color:' + COR.primary + ';border-bottom:2px solid ' + COR.primary + ';padding-bottom:6px;' + FONT + '">';
    if (icone) h += icone + ' ';
    h += texto + '</div>';
    if (sub) h += '<div style="font-size:9px;color:' + COR.textMuted + ';margin-top:3px;">' + sub + '</div>';
    h += '</div>';
    return h;
  }

  /** Card de economia com valor verde */
  function cardEconomia(titulo, valor, sub) {
    return '<div style="background:' + COR.ecoBg + ';border-left:4px solid ' + COR.accentDark + ';padding:10px 14px;margin:6px 0;page-break-inside:avoid;">' +
      '<div style="font-size:9px;color:' + COR.textSec + ';text-transform:uppercase;letter-spacing:0.5px;">' + titulo + '</div>' +
      '<div style="font-size:18px;font-weight:700;color:' + COR.accentDark + ';' + FONT_MONO + '">' + _m(valor) + '</div>' +
      (sub ? '<div style="font-size:9px;color:' + COR.textMuted + ';margin-top:2px;">' + sub + '</div>' : '') +
      '</div>';
  }

  /** Mini card indicador */
  function miniCard(titulo, valor, cor, sub) {
    cor = cor || COR.text;
    return '<div style="background:#fff;border:1px solid #e8ecf0;border-radius:6px;padding:10px 12px;text-align:center;page-break-inside:avoid;">' +
      '<div style="font-size:8px;color:' + COR.textMuted + ';text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">' + titulo + '</div>' +
      '<div style="font-size:16px;font-weight:700;color:' + cor + ';' + FONT_MONO + '">' + valor + '</div>' +
      (sub ? '<div style="font-size:8px;color:' + COR.textMuted + ';margin-top:3px;">' + sub + '</div>' : '') +
      '</div>';
  }

  /** Grid de N colunas */
  function grid(cols, items) {
    var w = Math.floor(100 / cols) - 2;
    var h = '<div style="display:flex;flex-wrap:wrap;gap:8px;margin:10px 0;">';
    items.forEach(function (item) {
      h += '<div style="flex:0 0 ' + w + '%;max-width:' + w + '%;">' + item + '</div>';
    });
    h += '</div>';
    return h;
  }

  /** Tabela genérica com zebra-striping */
  function tabelaHTML(headers, rows, opts) {
    opts = opts || {};
    var h = '<table style="width:100%;border-collapse:collapse;margin:8px 0;page-break-inside:avoid;font-size:10px;' + FONT + '">';
    // Header
    h += '<thead><tr>';
    headers.forEach(function (hdr, i) {
      var align = (i > 0 && !opts.noAlignRight) ? 'text-align:right;' : 'text-align:left;';
      h += '<th style="background:' + COR.headerBg + ';color:#fff;padding:7px 10px;font-weight:600;font-size:9px;text-transform:uppercase;letter-spacing:0.5px;' + align + '">' + hdr + '</th>';
    });
    h += '</tr></thead>';
    // Body
    h += '<tbody>';
    rows.forEach(function (row, ri) {
      var isTotal = row._total || false;
      var isSubtotal = row._subtotal || false;
      var isEco = row._eco || false;
      var bg = isTotal ? COR.totalBg : isSubtotal ? COR.subtotalBg : (ri % 2 === 1 ? COR.stripe : '#fff');
      var txtColor = isTotal ? '#fff' : COR.text;
      var fw = (isTotal || isSubtotal) ? 'font-weight:700;' : '';
      h += '<tr style="background:' + bg + ';color:' + txtColor + ';' + fw + '">';
      (row.cells || row).forEach(function (cell, ci) {
        var align = (ci > 0 && !opts.noAlignRight) ? 'text-align:right;' : 'text-align:left;';
        var ecoStyle = (isEco && ci > 0) ? 'color:' + COR.accentDark + ';font-weight:700;' + FONT_MONO : '';
        var indent = (row._indent && ci === 0) ? 'padding-left:' + (row._indent * 14) + 'px;' : '';
        h += '<td style="padding:6px 10px;border-bottom:1px solid #eee;' + align + ecoStyle + indent + '">' + cell + '</td>';
      });
      h += '</tr>';
    });
    h += '</tbody></table>';
    return h;
  }

  /** Box de alerta */
  function alertaBox(tipo, msg) {
    var cores = {
      critico: { bg: COR.dangerBg, borda: COR.danger, ico: '🔴' },
      aviso: { bg: COR.warningBg, borda: COR.warning, ico: '🟡' },
      economia: { bg: COR.ecoBg, borda: COR.accentDark, ico: '🟢' },
      info: { bg: COR.infoBg, borda: COR.info, ico: '🔵' }
    };
    var c = cores[tipo] || cores.info;
    return '<div style="background:' + c.bg + ';border-left:4px solid ' + c.borda + ';padding:8px 12px;margin:5px 0;font-size:10px;page-break-inside:avoid;">' +
      c.ico + ' ' + msg + '</div>';
  }

  /** Barra visual de percentual */
  function barraVisual(valor, max, cor, label) {
    var pct = max > 0 ? Math.min((valor / max) * 100, 100) : 0;
    return '<div style="display:flex;align-items:center;margin:3px 0;">' +
      '<div style="flex:0 0 120px;font-size:9px;color:' + COR.textSec + ';">' + (label || '') + '</div>' +
      '<div style="flex:1;background:#eee;border-radius:4px;height:14px;overflow:hidden;">' +
      '<div style="width:' + pct.toFixed(1) + '%;background:' + (cor || COR.primary) + ';height:100%;border-radius:4px;"></div>' +
      '</div>' +
      '<div style="flex:0 0 90px;text-align:right;font-size:10px;font-weight:600;' + FONT_MONO + 'color:' + (cor || COR.text) + ';">' + _m(valor) + '</div>' +
      '</div>';
  }

  /** Page break */
  function pageBreak() {
    return '<div style="page-break-before:always;margin:0;padding:0;height:0;"></div>';
  }

  /** Badge colorido */
  function badge(texto, cor) {
    return '<span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:8px;font-weight:600;background:' + cor + '20;color:' + cor + ';margin:0 3px;">' + texto + '</span>';
  }

  function badgeComplexidade(c) {
    var cores = { 'Baixa': COR.accentDark, 'Média': COR.warning, 'Alta': COR.danger };
    return badge(c || 'N/A', cores[c] || COR.info);
  }
  function badgeRisco(r) {
    var cores = { 'Baixo': COR.accentDark, 'Médio': COR.warning, 'Alto': COR.danger };
    return badge(r || 'N/A', cores[r] || COR.info);
  }

  /** Nomes das fontes de economia */
  var ECONOMIA_NOMES = {
    jcp: { nome: 'Juros sobre Capital Próprio (JCP)', base: 'Art. 355-358 RIR/2018' },
    prejuizo: { nome: 'Compensação de Prejuízo Fiscal', base: 'Art. 579-586 RIR/2018' },
    sudam: { nome: 'Redução SUDAM/SUDENE (75%)', base: 'Art. 612-613 RIR/2018' },
    incentivos: { nome: 'Incentivos Fiscais (PAT, Rouanet, etc.)', base: 'Legislação específica' },
    depreciacao: { nome: 'Economia Fiscal com Depreciação', base: 'Art. 317-323 RIR/2018' },
    pisCofinsCreditos: { nome: 'Créditos PIS/COFINS Não-Cumulativo', base: 'Art. 3º Lei 10.637/02 e 10.833/03' },
    gratificacao: { nome: 'Conversão Gratificação → Pró-labore', base: 'Art. 311 RIR/2018' },
    cprb: { nome: 'Desoneração da Folha (CPRB)', base: 'Lei 12.546/2011' },
    pddFiscal: { nome: 'PDD — Provisão para Devedores Duvidosos', base: 'Art. 340-342 RIR/2018' }
  };

  /** Nomes dos meses */
  var MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  // ═══════════════════════════════════════════════════════════════════════════
  //  GERADOR DO HTML2PDF — wrapper
  // ═══════════════════════════════════════════════════════════════════════════

  function gerarPDF(htmlContent, filename, onDone) {
    if (typeof html2pdf === 'undefined') {
      alert('html2pdf.js não foi carregado. Verifique as dependências.');
      if (onDone) onDone();
      return;
    }
    var wrapper = '<div style="' + BASE_CSS + 'max-width:700px;margin:0 auto;padding:10px 15px;">' + htmlContent + '</div>';
    var tempDiv = document.createElement('div');
    tempDiv.innerHTML = wrapper;
    document.body.appendChild(tempDiv);

    html2pdf().set({
      margin: [10, 10, 15, 10],
      filename: filename,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true, logging: false, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    }).from(tempDiv).save().then(function () {
      document.body.removeChild(tempDiv);
      if (onDone) onDone();
    }).catch(function (err) {
      document.body.removeChild(tempDiv);
      console.error('Erro PDF:', err);
      alert('Erro ao gerar PDF. Veja o console.');
      if (onDone) onDone();
    });
  }


  // ═══════════════════════════════════════════════════════════════════════════════
  // ███████████████████████████████████████████████████████████████████████████████
  //  PDF SIMPLIFICADO — Para o empresário (3-5 páginas)
  // ███████████████████████████████████████████████████████████████████████████████
  // ═══════════════════════════════════════════════════════════════════════════════

  function pdfSimplificado() {
    var r = window.LucroRealEstudos ? window.LucroRealEstudos.getResultados() : null;
    if (!r) { alert('Gere o estudo antes de exportar.'); return; }

    showLoading('Gerando Relatório Simplificado...');

    var d = r.dadosEmpresa || {};
    var res = r.resumo || {};
    var eco = r.economia || {};
    var ops = (r.oportunidades || []).slice(0, 5);
    var fc = r.fluxoCaixa || {};
    var ca = r.comparativoApuracao || {};
    var proj = r.projecao || {};

    var h = '';

    // ══════════════════════════════════════════════════════════════
    //  PÁGINA 1: CAPA + RESUMO EXECUTIVO
    // ══════════════════════════════════════════════════════════════

    h += pdfHeader(r, 'RELATÓRIO EXECUTIVO — ESTUDO DE LUCRO REAL');

    // 6 Cards de resumo (grid 3x2)
    h += grid(3, [
      miniCard('ECONOMIA IDENTIFICADA', _m(res.economiaTotal), COR.accentDark, 'Potencial de economia anual'),
      miniCard('TRIBUTOS DEVIDOS (Bruto)', _m(res.cargaBruta), COR.danger, _m(res.cargaBrutaMensal) + '/mês'),
      miniCard('ALÍQUOTA EFETIVA', _pp(res.aliquotaEfetiva), COR.text),
      miniCard('CARGA OTIMIZADA', _m(res.cargaOtimizada), COR.accentDark, _pp(res.aliquotaOtimizada) + ' efetiva'),
      miniCard('RETENÇÕES A COMPENSAR', _m(res.totalRetencoes), COR.info),
      miniCard('SALDO A PAGAR', _m(res.saldoEfetivo), COR.text, 'Após retenções')
    ]);

    // Box economia destaque
    if (res.economiaTotal > 0) {
      h += '<div style="background:' + COR.ecoBg + ';border:2px solid ' + COR.accentDark + ';border-radius:8px;padding:16px 20px;margin:16px 0;text-align:center;page-break-inside:avoid;">';
      h += '<div style="font-size:10px;color:' + COR.textSec + ';text-transform:uppercase;letter-spacing:1px;">ECONOMIA TOTAL IDENTIFICADA</div>';
      h += '<div style="font-size:32px;font-weight:800;color:' + COR.accentDark + ';' + FONT_MONO + 'margin:6px 0;">' + _m(res.economiaTotal) + ' /ano</div>';
      h += '<div style="font-size:10px;color:' + COR.textSec + ';">' + _m(res.economiaTotal / 12) + ' por mês &bull; Redução de ' + _pp(res.aliquotaEfetiva - res.aliquotaOtimizada) + ' na alíquota efetiva</div>';
      h += '</div>';
    }

    // Box explicativo
    h += '<div style="background:#f8f9fa;border-radius:6px;padding:12px 16px;margin:12px 0;font-size:10px;color:' + COR.textSec + ';line-height:1.7;page-break-inside:avoid;">';
    h += '<div style="font-weight:700;color:' + COR.text + ';margin-bottom:4px;">💡 O que isso significa para sua empresa?</div>';
    if (res.economiaTotal > 0) {
      h += 'Identificamos <strong style="color:' + COR.accentDark + ';">' + (res.numOportunidades || ops.length) + ' oportunidades de economia</strong> que podem reduzir sua carga tributária de ';
      h += '<strong>' + _m(res.cargaBruta) + '</strong> para <strong style="color:' + COR.accentDark + ';">' + _m(res.cargaOtimizada) + '</strong> por ano. ';
      h += 'A economia de <strong style="color:' + COR.accentDark + ';">' + _m(res.economiaTotal) + '</strong> representa uma redução de ';
      h += '<strong>' + (res.cargaBruta > 0 ? _pp(res.economiaTotal / res.cargaBruta * 100) : '0%') + '</strong> na carga tributária total.';
    } else {
      h += 'A empresa já opera com carga tributária otimizada no regime de Lucro Real. Recomendamos revisão periódica para identificar novas oportunidades.';
    }
    h += '</div>';


    // ══════════════════════════════════════════════════════════════
    //  PÁGINA 2: MAPA DE ECONOMIA
    // ══════════════════════════════════════════════════════════════

    h += pageBreak();
    h += secaoTitulo('💰', 'DE ONDE VEM A ECONOMIA', 'Fontes identificadas de economia tributária');

    // Tabela de fontes de economia (apenas > 0)
    var ecoRows = [];
    var ecoKeys = ['jcp', 'prejuizo', 'sudam', 'incentivos', 'depreciacao', 'pisCofinsCreditos', 'gratificacao', 'cprb', 'pddFiscal'];
    ecoKeys.forEach(function (k) {
      if (eco[k] > 0) {
        var info = ECONOMIA_NOMES[k] || {};
        ecoRows.push({ cells: [info.nome || k, _m(eco[k]), info.base || '—'], _eco: true });
      }
    });
    if (ecoRows.length > 0) {
      ecoRows.push({ cells: ['ECONOMIA TOTAL', _m(eco.total || res.economiaTotal), ''], _total: true });
      h += tabelaHTML(['Fonte de Economia', 'Valor Anual', 'Base Legal'], ecoRows);
    } else {
      h += '<div style="font-size:10px;color:' + COR.textMuted + ';padding:10px;">Nenhuma fonte de economia adicional identificada neste estudo.</div>';
    }

    // Barra ANTES x DEPOIS
    h += '<div style="margin:18px 0;page-break-inside:avoid;">';
    h += '<div style="font-size:11px;font-weight:700;color:' + COR.text + ';margin-bottom:8px;">COMPARATIVO: ANTES × DEPOIS</div>';
    h += barraVisual(res.cargaBruta, res.cargaBruta, COR.danger, 'Carga Bruta');
    if (res.economiaTotal > 0) {
      h += barraVisual(res.economiaTotal, res.cargaBruta, COR.accentDark, '(-) Economia');
    }
    h += barraVisual(res.cargaOtimizada, res.cargaBruta, COR.primary, 'Carga Otimizada');
    h += '</div>';

    // Projeção de economia acumulada
    if (res.economiaTotal > 0) {
      h += '<div style="margin:14px 0;page-break-inside:avoid;">';
      h += '<div style="font-size:11px;font-weight:700;color:' + COR.text + ';margin-bottom:8px;">PROJEÇÃO DE ECONOMIA ACUMULADA</div>';
      var projAnos = [1, 3, 5, 10];
      var projRows = [];
      projAnos.forEach(function (a) {
        // Se tiver projeção com crescimento, usar
        if (proj.projecaoCarga && proj.projecaoCarga.length >= a) {
          projRows.push({ cells: [a + (a === 1 ? ' ano' : ' anos'), _m(proj.projecaoCarga[a - 1].economiaAcumulada)], _eco: true });
        } else {
          projRows.push({ cells: [a + (a === 1 ? ' ano' : ' anos'), _m(res.economiaTotal * a)], _eco: true });
        }
      });
      h += tabelaHTML(['Horizonte', 'Economia Acumulada'], projRows);
      h += '</div>';
    }

    // ══════════════════════════════════════════════════════════════
    //  PÁGINA 3: TOP OPORTUNIDADES + AÇÕES
    // ══════════════════════════════════════════════════════════════

    if (ops.length > 0) {
      h += pageBreak();
      h += secaoTitulo('🎯', 'TOP ' + ops.length + ' OPORTUNIDADES DE ECONOMIA');

      ops.forEach(function (op, i) {
        h += '<div style="background:#fff;border:1px solid #e8ecf0;border-radius:6px;padding:12px 16px;margin:8px 0;page-break-inside:avoid;' + (i === 0 ? 'border-left:4px solid ' + COR.accentDark + ';' : '') + '">';
        h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;">';
        h += '<div>';
        h += '<span style="display:inline-block;background:' + COR.primary + ';color:#fff;border-radius:50%;width:22px;height:22px;text-align:center;line-height:22px;font-size:10px;font-weight:700;margin-right:8px;">#' + (i + 1) + '</span>';
        h += '<strong style="font-size:12px;color:' + COR.text + ';">' + (op.titulo || '') + '</strong>';
        h += '</div>';
        h += '<div style="font-size:14px;font-weight:700;color:' + COR.accentDark + ';' + FONT_MONO + '">' + _m(op.economiaAnual || 0) + '/ano</div>';
        h += '</div>';
        // Tags
        h += '<div style="margin:6px 0;">';
        h += badge(op.tipo || 'N/A', COR.primary);
        h += badgeComplexidade(op.complexidade);
        h += badgeRisco(op.risco);
        h += badge(op.prazoImplementacao || '', COR.info);
        h += '</div>';
        // Descrição + Ação
        if (op.descricao) h += '<div style="font-size:9px;color:' + COR.textSec + ';margin:4px 0;">' + op.descricao + '</div>';
        if (op.acaoRecomendada) {
          h += '<div style="font-size:9px;color:' + COR.primary + ';font-weight:600;margin-top:4px;">→ ' + op.acaoRecomendada + '</div>';
        }
        h += '</div>';
      });

      // Box recomendação de apuração
      if (ca.recomendacao) {
        h += '<div style="background:' + COR.infoBg + ';border-left:4px solid ' + COR.info + ';padding:12px 16px;margin:14px 0;page-break-inside:avoid;">';
        h += '<div style="font-weight:700;color:' + COR.text + ';font-size:11px;">📋 Recomendação de Forma de Apuração</div>';
        h += '<div style="font-size:10px;color:' + COR.textSec + ';margin-top:4px;">';
        h += 'Forma recomendada: <strong style="color:' + COR.primary + ';">' + (ca.recomendacao.formaRecomendada === 'anual' ? 'ANUAL por Estimativa' : 'TRIMESTRAL') + '</strong>';
        if (ca.recomendacao.justificativa) h += '<br>' + ca.recomendacao.justificativa;
        if (ca.recomendacao.diferenca) h += '<br>Diferença estimada: <strong style="color:' + COR.accentDark + ';">' + _m(Math.abs(ca.recomendacao.diferenca)) + '</strong>';
        h += '</div></div>';
      }
    }

    // ══════════════════════════════════════════════════════════════
    //  PÁGINA 4: FLUXO MENSAL + PRÓXIMOS PASSOS
    // ══════════════════════════════════════════════════════════════

    h += pageBreak();
    h += secaoTitulo('📅', 'FLUXO DE CAIXA TRIBUTÁRIO MENSAL', 'Desembolso estimado mês a mês');

    if (fc.meses && fc.meses.length > 0) {
      var fcHeaders = ['Mês', 'IRPJ', 'CSLL', 'PIS', 'COFINS', 'ISS', 'TOTAL'];
      var fcRows = [];
      fc.meses.forEach(function (m, i) {
        fcRows.push({ cells: [MESES[i] || m.mes, _m(m.irpj), _m(m.csll), _m(m.pis), _m(m.cofins), _m(m.iss), _m(m.total)] });
      });
      // ═══ FIX BUG #3: Usar valores anuais exatos nos totais do PDF ═══
      var _fcTotIRPJ = fc.irpjAnualExato !== undefined ? fc.irpjAnualExato : fc.meses.reduce(function (s, m) { return s + (m.irpj || 0); }, 0);
      var _fcTotCSLL = fc.csllAnualExato !== undefined ? fc.csllAnualExato : fc.meses.reduce(function (s, m) { return s + (m.csll || 0); }, 0);
      var _fcTotPIS = fc.pisAnualExato !== undefined ? fc.pisAnualExato : fc.meses.reduce(function (s, m) { return s + (m.pis || 0); }, 0);
      var _fcTotCOF = fc.cofinsAnualExato !== undefined ? fc.cofinsAnualExato : fc.meses.reduce(function (s, m) { return s + (m.cofins || 0); }, 0);
      var _fcTotISS = fc.meses.reduce(function (s, m) { return s + (m.iss || 0); }, 0);
      fcRows.push({ cells: ['TOTAL ANUAL', _m(_r(_fcTotIRPJ)), _m(_r(_fcTotCSLL)), _m(_r(_fcTotPIS)), _m(_r(_fcTotCOF)), _m(_r(_fcTotISS)), _m(fc.totalAnual || 0)], _total: true });
      if (fc.mediaMensal) {
        fcRows.push({ cells: ['MÉDIA MENSAL', '', '', '', '', '', _m(fc.mediaMensal)], _subtotal: true });
      }
      h += tabelaHTML(fcHeaders, fcRows);
    } else {
      h += '<div style="font-size:10px;color:' + COR.textMuted + ';padding:8px;">Fluxo mensal não disponível.</div>';
    }

    // Próximos Passos
    h += '<div style="background:#f8f9fa;border-radius:8px;padding:14px 18px;margin:18px 0;page-break-inside:avoid;">';
    h += '<div style="font-size:13px;font-weight:700;color:' + COR.primary + ';margin-bottom:8px;">📌 Próximos Passos</div>';
    h += '<div style="font-size:10px;color:' + COR.textSec + ';line-height:1.8;">';
    var passos = [];
    if (eco.jcp > 0) passos.push('Deliberar distribuição de JCP em ata de sócios/assembleia');
    if (eco.prejuizo > 0) passos.push('Verificar controle de prejuízos na Parte B do LALUR');
    if (eco.sudam > 0) passos.push('Confirmar laudo de projeto SUDAM/SUDENE vigente');
    if (eco.pisCofinsCreditos > 0) passos.push('Revisar escrituração de créditos PIS/COFINS');
    if (eco.depreciacao > 0) passos.push('Avaliar depreciação acelerada e controle patrimonial');
    if (ops.length > 0) passos.push('Implementar as oportunidades acima em ordem de prioridade');
    passos.push('Agendar revisão tributária com profissional habilitado');
    passos.push('Manter escrituração contábil regular para aproveitamento de todas as deduções');
    passos.forEach(function (p, i) {
      h += '<div style="margin:3px 0;"><strong style="color:' + COR.primary + ';">' + (i + 1) + '.</strong> ' + p + '</div>';
    });
    h += '</div></div>';

    // ══════════════════════════════════════════════════════════════
    //  NOVA PÁGINA: FÓRMULA MESTRE + MAPA ECONOMIA + COMPLIANCE
    // ══════════════════════════════════════════════════════════════

    h += pageBreak();

    // Fórmula Mestre (Seção 7)
    if (LR.formulaMestre && LR.formulaMestre.passos) {
      h += secaoTitulo('📐', 'FÓRMULA MESTRE DO LUCRO REAL', 'Sequência de cálculo — ' + (LR.formulaMestre.artigo || 'Art. 258-261'));
      var vfPdf = {};
      vfPdf[1] = res.cargaBruta ? (r.dre ? r.dre.lucroLiquido : 0) : 0;
      vfPdf[2] = r.lalur ? r.lalur.totalAdicoes : 0;
      vfPdf[3] = r.lalur ? r.lalur.totalExclusoes : 0;
      vfPdf[4] = r.lalur ? r.lalur.lucroAjustado : 0;
      var compTotPdf = 0;
      if (r.compensacao && r.compensacao.resumo && r.compensacao.resumo.compensacaoEfetiva) {
        // CORREÇÃO BUG FÓRMULA MESTRE (PDF): Apenas compensação IRPJ, não somar CSLL
        compTotPdf = (r.compensacao.resumo.compensacaoEfetiva.prejuizoOperacional || 0);
      }
      // Fallback: ler do resultado do IRPJ se a compensação veio zerada
      if (compTotPdf === 0 && r.irpj) {
        compTotPdf = r.irpj.compensacaoPrejuizo || r.irpj.passo5_compensacao || 0;
      }
      vfPdf[5] = compTotPdf;
      vfPdf[6] = r.lucroRealFinal || 0;
      vfPdf[7] = r.irpj ? (r.irpj.irpjNormal || 0) : 0;
      vfPdf[8] = r.irpj ? (r.irpj.irpjAdicional || r.irpj.adicional || 0) : 0;
      vfPdf[9] = r.irpjAntesReducao || 0;
      vfPdf[10] = (r.incentivosFiscais ? (r.incentivosFiscais.totalDeducaoFinal || r.incentivosFiscais.economiaTotal || 0) : 0) + (r.reducaoSUDAM || 0);
      var retFormPdf = (r.retencoes ? r.retencoes.irrf : 0) || 0;
      vfPdf[11] = retFormPdf;
      vfPdf[12] = r.irpjAposReducao ? _r(r.irpjAposReducao - retFormPdf) : 0;

      var fmRows = [];
      LR.formulaMestre.passos.forEach(function (p) {
        var opI = p.operacao === '+' ? '(+)' : p.operacao === '-' ? '(-)' : p.operacao === '×' ? '(×)' : '(=)';
        var isT = (p.operacao === '=' && (p.passo === 6 || p.passo === 9 || p.passo === 12));
        var row = { cells: [opI, p.descricao + (p.artigo && p.artigo !== '-' ? ' — ' + p.artigo : ''), _m(vfPdf[p.passo] || 0)] };
        if (isT) row._subtotal = true;
        fmRows.push(row);
      });
      h += tabelaHTML(['Op.', 'Passo', 'Valor'], fmRows, { noAlignRight: false });
    }

    // Mapa Economia top 5 oportunidades (Seção 8)
    if (ops.length > 0) {
      h += secaoTitulo('🗺️', 'MAPA DE ECONOMIA — TOP 5');
      ops.slice(0, 5).forEach(function (op, i) {
        h += '<div style="background:#fff;border:1px solid #e8ecf0;border-left:4px solid ' + COR.accentDark + ';padding:8px 12px;margin:5px 0;page-break-inside:avoid;">';
        h += '<div style="display:flex;justify-content:space-between;align-items:center;">';
        h += '<div><strong style="font-size:10px;">#' + (i + 1) + ' ' + (op.titulo || '') + '</strong> ';
        h += badge(op.tipo || '', COR.primary) + badgeRisco(op.risco) + '</div>';
        h += '<div style="font-size:13px;font-weight:700;color:' + COR.accentDark + ';' + FONT_MONO + '">' + _m(op.economiaAnual || 0) + '/ano</div>';
        h += '</div></div>';
      });
    }

    // Alertas de compliance (Seção 4 — só se houver)
    var omissaoPdf = r.omissaoResult;
    if (omissaoPdf && omissaoPdf.indicadores && omissaoPdf.indicadores.length > 0) {
      h += secaoTitulo('⚠️', 'ALERTAS DE COMPLIANCE');
      omissaoPdf.indicadores.forEach(function (ind) {
        var tipoAl = ind.gravidade === 'CRITICO' ? 'critico' : ind.gravidade === 'ALTO' ? 'aviso' : 'info';
        h += alertaBox(tipoAl, '<strong>' + (ind.descricao || '') + '</strong>' + (ind.artigo ? ' (' + ind.artigo + ')' : '') + (ind.resolucao ? '<br>→ ' + ind.resolucao : ''));
      });
    }

    // Reforma Tributária disclaimer (Seção 6)
    if (LR.reformaTributaria) {
      h += '<div style="background:#f8f9fa;border-left:3px solid ' + COR.info + ';padding:10px 14px;margin:14px 0;font-size:9px;color:' + COR.textSec + ';line-height:1.5;page-break-inside:avoid;">';
      h += '<strong>⚖️ Reforma Tributária (LC 214/2025):</strong> ';
      h += (LR.reformaTributaria.disclaimer || '');
      if (LR.reformaTributaria.dataUltimaRevisao) h += ' <em>(Revisão: ' + LR.reformaTributaria.dataUltimaRevisao + ')</em>';
      h += '</div>';
    }

    // Footer
    h += pdfFooter(r);

    // Gerar
    var filename = 'relatorio-simplificado-' + (d.razaoSocial || 'empresa').replace(/[^a-zA-Z0-9]/g, '-').substring(0, 40) + '-' + _dataCurta() + '.pdf';
    gerarPDF(h, filename, function () { hideLoading(); });
  }


  // ═══════════════════════════════════════════════════════════════════════════════
  // ███████████████████████████████████████████████████████████████████████████████
  //  PDF COMPLETO — Para o contador (10-18 páginas, 14 seções)
  // ███████████████████████████████████████████████████████████████████████████████
  // ═══════════════════════════════════════════════════════════════════════════════

  function pdfCompleto() {
    var r = window.LucroRealEstudos ? window.LucroRealEstudos.getResultados() : null;
    if (!r) { alert('Gere o estudo antes de exportar.'); return; }

    showLoading('Gerando Relatório Completo — 14 seções...');

    var d = r.dadosEmpresa || {};
    var res = r.resumo || {};
    var eco = r.economia || {};
    var dre = r.dre || {};
    var lalur = r.lalur || {};
    var irpj = r.irpj || {};
    var csll = r.csll || {};
    var pc = r.pisCofins || {};
    var iss = r.iss || {};
    var comp = r.composicao || {};
    var ops = r.oportunidades || [];
    var ca = r.comparativoApuracao || {};
    var cen = r.cenarios || [];
    var proj = r.projecao || {};
    var fc = r.fluxoCaixa || {};
    var alertas = r.alertas || [];
    var obr = r.obrigacoes || [];
    var darfs = r.darfs || [];
    var cfg = r.config || {};

    var h = '';

    // ═════════════════════════════════════════════════════
    //  SEÇÃO 1 — CAPA PROFISSIONAL
    // ═════════════════════════════════════════════════════

    h += '<div style="text-align:center;padding:40px 20px 30px;page-break-after:always;">';
    // Logo
    h += '<div style="font-size:36px;font-weight:800;color:' + COR.primary + ';letter-spacing:2px;' + FONT + '">' + (cfg.nomeProduto || 'IMPOST.') + '</div>';
    h += '<div style="font-size:11px;color:' + COR.textMuted + ';margin-top:4px;">' + (cfg.subtitulo || '') + '</div>';
    h += '<div style="width:80px;height:3px;background:' + COR.primary + ';margin:20px auto;"></div>';
    // Título
    h += '<div style="font-size:20px;font-weight:700;color:' + COR.text + ';margin:24px 0 8px;">ESTUDO DE LUCRO REAL</div>';
    h += '<div style="font-size:13px;color:' + COR.textSec + ';">Relatório Completo de Análise Tributária</div>';
    // Dados da empresa
    h += '<div style="margin:30px auto;max-width:400px;text-align:left;background:#f8f9fa;border-radius:8px;padding:18px 24px;">';
    h += '<div style="font-size:14px;font-weight:700;color:' + COR.text + ';margin-bottom:8px;">' + (d.razaoSocial || 'Empresa') + '</div>';
    var dadosCapa = [];
    if (d.cnpj) dadosCapa.push(['CNPJ', d.cnpj]);
    if (d.cnaePrincipal) dadosCapa.push(['CNAE', d.cnaePrincipal]);
    if (d.uf) dadosCapa.push(['UF/Município', (d.municipio || '') + '/' + d.uf]);
    if (d.tipoAtividade) dadosCapa.push(['Atividade', d.tipoAtividade]);
    dadosCapa.push(['Apuração', (d.apuracaoLR === 'anual' ? 'Anual por Estimativa' : 'Trimestral')]);
    dadosCapa.push(['Ano-base', d.anoBase || new Date().getFullYear()]);
    dadosCapa.forEach(function (item) {
      h += '<div style="display:flex;justify-content:space-between;font-size:10px;padding:3px 0;border-bottom:1px solid #eee;">';
      h += '<span style="color:' + COR.textMuted + ';">' + item[0] + '</span>';
      h += '<span style="color:' + COR.text + ';font-weight:600;">' + item[1] + '</span>';
      h += '</div>';
    });
    h += '</div>';
    // Elaborado por
    var ep = cfg.elaboradoPor || {};
    if (ep.nome) {
      h += '<div style="margin-top:20px;font-size:10px;color:' + COR.textSec + ';">Elaborado por: <strong>' + ep.nome + '</strong>';
      if (ep.registro) h += ' — ' + ep.registro;
      h += '</div>';
    }
    h += '<div style="font-size:9px;color:' + COR.textMuted + ';margin-top:12px;">' + _dataFormatada(r.dataGeracao) + ' — v' + (r.versao || '2.0.0') + '</div>';
    h += '</div>';


    // ═════════════════════════════════════════════════════
    //  SEÇÃO 2 — RESUMO EXECUTIVO
    // ═════════════════════════════════════════════════════

    h += secaoTitulo('📊', 'SEÇÃO 2 — RESUMO EXECUTIVO');

    h += grid(3, [
      miniCard('ECONOMIA TOTAL', _m(res.economiaTotal), COR.accentDark),
      miniCard('CARGA BRUTA', _m(res.cargaBruta), COR.danger, _m(res.cargaBrutaMensal) + '/mês'),
      miniCard('ALÍQUOTA EFETIVA', _pp(res.aliquotaEfetiva), COR.text),
      miniCard('CARGA OTIMIZADA', _m(res.cargaOtimizada), COR.accentDark, _pp(res.aliquotaOtimizada)),
      miniCard('RETENÇÕES', _m(res.totalRetencoes), COR.info),
      miniCard('SALDO A PAGAR', _m(res.saldoEfetivo), COR.text)
    ]);

    if (res.economiaTotal > 0) {
      h += cardEconomia('ECONOMIA TOTAL IDENTIFICADA', res.economiaTotal, _m(res.economiaTotal / 12) + ' por mês — ' + (res.numOportunidades || 0) + ' oportunidades');
    }


    // ═════════════════════════════════════════════════════
    //  SEÇÃO 3 — DRE + LALUR
    // ═════════════════════════════════════════════════════

    h += pageBreak();
    h += secaoTitulo('📋', 'SEÇÃO 3 — DEMONSTRAÇÃO DO RESULTADO (DRE) E LALUR');

    // DRE
    h += '<div style="font-weight:700;font-size:11px;color:' + COR.text + ';margin:10px 0 6px;">Demonstração do Resultado do Exercício (DRE)</div>';
    var pdfDeducoesRec = r.pisCofins ? _r((r.pisCofins.debitoPIS || 0) + (r.pisCofins.debitoCOFINS || 0)) : (dre.pisCofinsDebitos || 0);
    var pdfRecLiquida = _r(dre.receitaBruta - pdfDeducoesRec);
    var dreRows = [
      { cells: ['Receita Bruta', _m(dre.receitaBruta)] },
      { cells: ['(-) PIS/COFINS sobre Receita', _m(-pdfDeducoesRec)], _indent: 1 },
      { cells: ['= RECEITA LÍQUIDA', _m(pdfRecLiquida)], _subtotal: true },
      { cells: ['(-) Custos Totais', _m(-(dre.custosTotais || 0))], _indent: 1 },
    ];
    if (dre.cmv) dreRows.push({ cells: ['    CMV / CPV', _m(-dre.cmv)], _indent: 2 });
    if (dre.folhaPagamento) dreRows.push({ cells: ['    Folha de Pagamento', _m(-dre.folhaPagamento)], _indent: 2 });
    if (dre.servicosTerceiros) dreRows.push({ cells: ['    Serviços de Terceiros', _m(-dre.servicosTerceiros)], _indent: 2 });
    dreRows.push({ cells: ['= LUCRO BRUTO', _m(dre.lucroBruto || _r(pdfRecLiquida - dre.custosTotais))], _subtotal: true });
    dreRows.push({ cells: ['(-) Despesas Totais', _m(-(dre.despesasTotais || 0))], _indent: 1 });
    if (dre.depreciacao) dreRows.push({ cells: ['    Depreciação', _m(-dre.depreciacao)], _indent: 2 });
    if (dre.receitaFinanceiras) dreRows.push({ cells: ['(+) Receitas Financeiras', _m(dre.receitaFinanceiras)], _indent: 1 });
    dreRows.push({ cells: ['= LUCRO LÍQUIDO CONTÁBIL', _m(dre.lucroLiquido)], _subtotal: true });
    if (dre.margemLucro !== undefined) dreRows.push({ cells: ['Margem de Lucro', _pp(dre.margemLucro)] });
    h += tabelaHTML(['Item', 'Valor'], dreRows);

    // LALUR
    h += '<div style="font-weight:700;font-size:11px;color:' + COR.text + ';margin:14px 0 6px;">LALUR — Livro de Apuração do Lucro Real (Parte A)</div>';
    var lalurRows = [
      { cells: ['Lucro Líquido Contábil', _m(lalur.lucroLiquido), ''] }
    ];
    // Adições
    if (lalur.adicoes && lalur.adicoes.length > 0) {
      lalurRows.push({ cells: ['ADIÇÕES', '', ''], _subtotal: true });
      lalur.adicoes.forEach(function (a) {
        lalurRows.push({ cells: ['(+) ' + (a.desc || a.descricao || ''), _m(a.valor), a.artigo || ''], _indent: 1 });
      });
      lalurRows.push({ cells: ['Total Adições', _m(lalur.totalAdicoes), ''], _subtotal: true });
    }
    // Exclusões
    if (lalur.exclusoes && lalur.exclusoes.length > 0) {
      lalurRows.push({ cells: ['EXCLUSÕES', '', ''], _subtotal: true });
      lalur.exclusoes.forEach(function (e) {
        lalurRows.push({ cells: ['(-) ' + (e.desc || e.descricao || ''), _m(e.valor), e.artigo || ''], _indent: 1, _eco: e.valor > 0 });
      });
      lalurRows.push({ cells: ['Total Exclusões', _m(lalur.totalExclusoes), ''], _subtotal: true });
    }
    lalurRows.push({ cells: ['= LUCRO AJUSTADO', _m(lalur.lucroAjustado), ''], _subtotal: true });
    // Compensação
    if (r.compensacao && r.compensacao.resumo) {
      var compRes = r.compensacao.resumo;
      if (compRes.economia && compRes.economia.total > 0) {
        lalurRows.push({ cells: ['(-) Compensação Prejuízo Fiscal (30%)', _m(compRes.economia.total > 0 ? (lalur.lucroAjustado - r.lucroRealFinal) : 0), 'Art. 579-586 RIR/2018'], _eco: true });
      }
    }
    lalurRows.push({ cells: ['= LUCRO REAL FINAL', _m(r.lucroRealFinal), ''], _total: true });
    if (r.baseCSLLFinal !== undefined && r.baseCSLLFinal !== r.lucroRealFinal) {
      lalurRows.push({ cells: ['Base da CSLL Final', _m((r.csll && r.csll.baseCalculo !== undefined) ? r.csll.baseCalculo : r.baseCSLLFinal), ''] });
    }
    h += tabelaHTML(['Descrição', 'Valor', 'Base Legal'], lalurRows);


    // ═════════════════════════════════════════════════════
    //  SEÇÃO 4 — CÁLCULO DETALHADO DE TRIBUTOS
    // ═════════════════════════════════════════════════════

    h += pageBreak();
    h += secaoTitulo('🧮', 'SEÇÃO 4 — CÁLCULO DETALHADO DE TRIBUTOS');

    // IRPJ
    h += '<div style="font-weight:700;font-size:11px;color:' + COR.text + ';margin:10px 0 6px;">4.1 — IRPJ (Imposto de Renda Pessoa Jurídica)</div>';
    var irpjRows = [
      { cells: ['Lucro Real (Base de Cálculo)', _m((r.irpj && r.irpj.lucroReal !== undefined) ? r.irpj.lucroReal : r.lucroRealFinal)] },
      { cells: ['IRPJ Normal (15%)', _m(irpj.irpjNormal || 0)] },
      { cells: ['IRPJ Adicional (10% s/ excedente R$ 240k)', _m(irpj.adicional || 0)] },
      { cells: ['= IRPJ Bruto', _m(irpj.totalBruto || (irpj.irpjNormal || 0) + (irpj.adicional || 0))], _subtotal: true }
    ];
    if (r.incentivosFiscais && r.incentivosFiscais.economiaTotal > 0) {
      irpjRows.push({ cells: ['(-) Incentivos Fiscais', _m(-r.incentivosFiscais.economiaTotal)], _eco: true });
    }
    if (r.reducaoSUDAM > 0) {
      irpjRows.push({ cells: ['(-) Redução SUDAM/SUDENE (75%)', _m(-r.reducaoSUDAM)], _eco: true });
    }
    irpjRows.push({ cells: ['= IRPJ FINAL', _m(r.irpjAposReducao)], _total: true });
    h += tabelaHTML(['Item', 'Valor'], irpjRows);

    // CSLL
    h += '<div style="font-weight:700;font-size:11px;color:' + COR.text + ';margin:14px 0 6px;">4.2 — CSLL (Contribuição Social sobre o Lucro Líquido)</div>';
    h += tabelaHTML(['Item', 'Valor'], [
      { cells: ['Base da CSLL', _m((csll.baseCalculo !== undefined) ? csll.baseCalculo : (r.baseCSLLFinal || r.lucroRealFinal))] },
      { cells: ['Alíquota', _pp((csll.aliquota || 0.09) * 100)] },
      { cells: ['= CSLL DEVIDA', _m(csll.csllDevida)], _total: true }
    ]);

    // PIS/COFINS
    h += '<div style="font-weight:700;font-size:11px;color:' + COR.text + ';margin:14px 0 6px;">4.3 — PIS/COFINS (Não-Cumulativo)</div>';
    var pcRows = [
      { cells: ['Receita Tributável', _m(pc.receitaTributavel)] },
      { cells: ['Débito PIS (1,65%)', _m(pc.debitoPIS)] },
      { cells: ['Débito COFINS (7,6%)', _m(pc.debitoCOFINS)] },
      { cells: ['Total Débitos', _m((pc.debitoPIS || 0) + (pc.debitoCOFINS || 0))], _subtotal: true },
      { cells: ['(-) Crédito PIS', _m(-(pc.creditoPIS || 0))], _eco: pc.creditoPIS > 0 },
      { cells: ['(-) Crédito COFINS', _m(-(pc.creditoCOFINS || 0))], _eco: pc.creditoCOFINS > 0 }
    ];
    var pdfPisRetido = _n(d.pisRetido);
    var pdfCofinsRetido = _n(d.cofinsRetido);
    if (pdfPisRetido > 0) pcRows.push({ cells: ['(-) PIS Retido na Fonte', _m(-pdfPisRetido)] });
    if (pdfCofinsRetido > 0) pcRows.push({ cells: ['(-) COFINS Retido na Fonte', _m(-pdfCofinsRetido)] });
    var pdfPisCofinsLiq = _r(Math.max(pc.totalAPagarBruto - pdfPisRetido - pdfCofinsRetido, 0));
    pcRows.push({ cells: ['= PIS/COFINS A PAGAR', _m(pdfPisCofinsLiq)], _total: true });
    if (pc.economiaCreditos > 0) {
      pcRows.push({ cells: ['Economia com Créditos Não-Cumulativos', _m(pc.economiaCreditos)], _eco: true });
    }
    h += tabelaHTML(['Item', 'Valor'], pcRows);

    // ISS
    if (iss && (iss.issAnual > 0 || iss.receitaServicos > 0)) {
      h += '<div style="font-weight:700;font-size:11px;color:' + COR.text + ';margin:14px 0 6px;">4.4 — ISS (Imposto sobre Serviços)</div>';
      h += tabelaHTML(['Item', 'Valor'], [
        { cells: ['Receita de Serviços', _m(iss.receitaServicos)] },
        { cells: ['Alíquota ISS (' + (iss.municipio || '') + ')', _pp((iss.aliquota || 0) * 100)] },
        { cells: ['= ISS Anual', _m(iss.issAnual)], _total: true },
        { cells: ['ISS Mensal', _m(iss.issMensal)] }
      ]);
    }


    // ═════════════════════════════════════════════════════
    //  SEÇÃO 5 — COMPOSIÇÃO DA CARGA
    // ═════════════════════════════════════════════════════

    h += pageBreak();
    h += secaoTitulo('📊', 'SEÇÃO 5 — COMPOSIÇÃO DA CARGA TRIBUTÁRIA');

    h += tabelaHTML(['Tributo', 'Valor Anual', '% da Carga'], [
      { cells: ['IRPJ', _m(comp.irpj ? comp.irpj.valor : 0), _pp(comp.irpj ? comp.irpj.percentual : 0)] },
      { cells: ['CSLL', _m(comp.csll ? comp.csll.valor : 0), _pp(comp.csll ? comp.csll.percentual : 0)] },
      { cells: ['PIS/COFINS', _m(comp.pisCofins ? comp.pisCofins.valor : 0), _pp(comp.pisCofins ? comp.pisCofins.percentual : 0)] },
      { cells: ['ISS', _m(comp.iss ? comp.iss.valor : 0), _pp(comp.iss ? comp.iss.percentual : 0)] },
      { cells: ['TOTAL', _m(res.cargaBruta), '100,00%'], _total: true }
    ]);

    // Barras visuais
    h += '<div style="margin:12px 0;">';
    var maxComp = res.cargaBruta || 1;
    h += barraVisual(comp.irpj ? comp.irpj.valor : 0, maxComp, '#E74C3C', 'IRPJ');
    h += barraVisual(comp.csll ? comp.csll.valor : 0, maxComp, '#F39C12', 'CSLL');
    h += barraVisual(comp.pisCofins ? comp.pisCofins.valor : 0, maxComp, '#3498DB', 'PIS/COFINS');
    h += barraVisual(comp.iss ? comp.iss.valor : 0, maxComp, '#9B59B6', 'ISS');
    h += '</div>';


    // ═════════════════════════════════════════════════════
    //  SEÇÃO 6 — MAPA DA ECONOMIA
    // ═════════════════════════════════════════════════════

    h += secaoTitulo('💰', 'SEÇÃO 6 — MAPA DA ECONOMIA (ANTES × DEPOIS)');

    // Diagrama antes/depois
    h += '<div style="display:flex;align-items:center;justify-content:space-around;margin:12px 0;page-break-inside:avoid;">';
    h += '<div style="text-align:center;padding:14px 20px;background:#fff;border:2px solid ' + COR.danger + ';border-radius:8px;">';
    h += '<div style="font-size:9px;color:' + COR.textMuted + ';text-transform:uppercase;">Carga Bruta</div>';
    h += '<div style="font-size:20px;font-weight:700;color:' + COR.danger + ';' + FONT_MONO + '">' + _m(res.cargaBruta) + '</div></div>';
    h += '<div style="font-size:24px;color:' + COR.accentDark + ';">→</div>';
    h += '<div style="text-align:center;padding:14px 20px;background:' + COR.ecoBg + ';border:2px solid ' + COR.accentDark + ';border-radius:8px;">';
    h += '<div style="font-size:9px;color:' + COR.textMuted + ';text-transform:uppercase;">Economia</div>';
    h += '<div style="font-size:20px;font-weight:700;color:' + COR.accentDark + ';' + FONT_MONO + '">' + _m(res.economiaTotal) + '</div></div>';
    h += '<div style="font-size:24px;color:' + COR.primary + ';">→</div>';
    h += '<div style="text-align:center;padding:14px 20px;background:#fff;border:2px solid ' + COR.primary + ';border-radius:8px;">';
    h += '<div style="font-size:9px;color:' + COR.textMuted + ';text-transform:uppercase;">Carga Otimizada</div>';
    h += '<div style="font-size:20px;font-weight:700;color:' + COR.primary + ';' + FONT_MONO + '">' + _m(res.cargaOtimizada) + '</div></div>';
    h += '</div>';

    // Tabela detalhada de economia
    var ecoRows2 = [];
    var ecoKeys2 = ['jcp', 'prejuizo', 'sudam', 'incentivos', 'depreciacao', 'pisCofinsCreditos', 'gratificacao', 'cprb', 'pddFiscal'];
    ecoKeys2.forEach(function (k) {
      if (eco[k] > 0) {
        var info = ECONOMIA_NOMES[k] || {};
        ecoRows2.push({ cells: [info.nome || k, _m(eco[k]), info.base || '—'], _eco: true });
      }
    });
    if (ecoRows2.length > 0) {
      ecoRows2.push({ cells: ['ECONOMIA TOTAL', _m(eco.total || res.economiaTotal), ''], _total: true });
      h += tabelaHTML(['Fonte de Economia', 'Valor Anual', 'Base Legal'], ecoRows2);
    }

    // Projeção acumulada
    if (res.economiaTotal > 0) {
      h += '<div style="font-weight:700;font-size:11px;color:' + COR.text + ';margin:12px 0 6px;">Projeção de Economia Acumulada</div>';
      var projAnos2 = [1, 3, 5, 10];
      var projR2 = [];
      projAnos2.forEach(function (a) {
        if (proj.projecaoCarga && proj.projecaoCarga.length >= a) {
          projR2.push({ cells: [a + (a === 1 ? ' ano' : ' anos'), _m(proj.projecaoCarga[a - 1].economiaAcumulada)], _eco: true });
        } else {
          projR2.push({ cells: [a + (a === 1 ? ' ano' : ' anos'), _m(res.economiaTotal * a)], _eco: true });
        }
      });
      h += tabelaHTML(['Horizonte', 'Economia Acumulada'], projR2);
    }


    // ═════════════════════════════════════════════════════
    //  SEÇÃO 7 — OPORTUNIDADES
    // ═════════════════════════════════════════════════════

    if (ops.length > 0) {
      h += pageBreak();
      h += secaoTitulo('🎯', 'SEÇÃO 7 — OPORTUNIDADES DE ECONOMIA (' + ops.length + ')');

      ops.forEach(function (op, i) {
        h += '<div style="background:#fff;border:1px solid #e0e4e8;border-left:4px solid ' + COR.primary + ';padding:12px 16px;margin:8px 0;page-break-inside:avoid;">';
        // Header
        h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px;">';
        h += '<div><span style="background:' + COR.primary + ';color:#fff;padding:2px 8px;border-radius:10px;font-size:9px;font-weight:700;margin-right:6px;">#' + (op.ranking || i + 1) + '</span>';
        h += '<strong style="font-size:11px;">' + (op.titulo || '') + '</strong></div>';
        h += '<div style="font-size:14px;font-weight:700;color:' + COR.accentDark + ';' + FONT_MONO + '">' + _m(op.economiaAnual || 0) + '/ano</div>';
        h += '</div>';
        // Tags
        h += '<div style="margin:4px 0;">';
        h += badge(op.tipo || '', COR.primary);
        h += badgeComplexidade(op.complexidade);
        h += badgeRisco(op.risco);
        h += badge(op.prazoImplementacao || '', COR.info);
        h += '</div>';
        // Detalhes
        if (op.descricao) h += '<div style="font-size:9px;color:' + COR.textSec + ';margin:4px 0;line-height:1.5;">' + op.descricao + '</div>';
        if (op.baseLegal) h += '<div style="font-size:9px;color:' + COR.textMuted + ';"><em>Base legal: ' + op.baseLegal + '</em></div>';
        if (op.acaoRecomendada) h += '<div style="font-size:9px;color:' + COR.primary + ';font-weight:600;margin-top:4px;">→ Ação: ' + op.acaoRecomendada + '</div>';
        h += '</div>';
      });
    }


    // ═════════════════════════════════════════════════════
    //  SEÇÃO 8 — COMPARATIVO TRIMESTRAL vs ANUAL
    // ═════════════════════════════════════════════════════

    h += pageBreak();
    h += secaoTitulo('📈', 'SEÇÃO 8 — COMPARATIVO: TRIMESTRAL vs ANUAL POR ESTIMATIVA');

    // Trimestral
    if (ca.trimestral && ca.trimestral.trimestres) {
      h += '<div style="font-weight:700;font-size:11px;color:' + COR.text + ';margin:10px 0 6px;">8.1 — Apuração Trimestral</div>';
      var trimHeaders = ['Trim.', 'Lucro Ajust.', 'Comp. Prej.', 'Lucro Real', 'IRPJ Normal', 'IRPJ Adic.', 'IRPJ Total', 'CSLL'];
      var trimRows = [];
      ca.trimestral.trimestres.forEach(function (t) {
        trimRows.push({ cells: [t.trimestre + 'º', _m(t.lucroAjustado), _m(t.compensacaoPrejuizo), _m(t.lucroReal), _m(t.irpjNormal), _m(t.irpjAdicional), _m(t.irpjTotal), _m(t.csll)] });
      });
      trimRows.push({ cells: ['TOTAL', '', '', '', '', '', _m(ca.trimestral.totalIRPJ), _m(ca.trimestral.totalCSLL)], _total: true });
      h += tabelaHTML(trimHeaders, trimRows);
    }

    // Anual
    if (ca.anual && ca.anual.meses) {
      h += '<div style="font-weight:700;font-size:11px;color:' + COR.text + ';margin:14px 0 6px;">8.2 — Apuração Anual por Estimativa</div>';
      var anualHeaders = ['Mês', 'Receita Bruta', 'Est. IRPJ', 'Est. CSLL', 'Total Mês'];
      var anualRows = [];
      ca.anual.meses.forEach(function (m, i) {
        anualRows.push({ cells: [MESES[i] || m.mes, _m(m.receitaBruta), _m(m.irpjEstimativa), _m(m.csllEstimativa), _m(m.totalMes)] });
      });
      anualRows.push({ cells: ['TOTAL ESTIMATIVAS', '', _m(ca.anual.totalEstimativasIRPJ), _m(ca.anual.totalEstimativasCSLL), _m(ca.anual.totalEstimativas)], _total: true });
      // Ajuste anual
      if (ca.anual.ajusteTotal !== undefined) {
        anualRows.push({ cells: ['IRPJ Real Anual', '', _m(ca.anual.irpjRealAnual), _m(ca.anual.csllRealAnual), ''], _subtotal: true });
        anualRows.push({ cells: ['Ajuste (Real - Estimativas)', '', _m(ca.anual.ajusteIRPJ), _m(ca.anual.ajusteCSLL), _m(ca.anual.ajusteTotal)], _subtotal: true });
      }
      h += tabelaHTML(anualHeaders, anualRows);
    }

    // Suspensão/Redução
    if (ca.suspensao && ca.suspensao.meses && ca.suspensao.meses.length > 0) {
      h += '<div style="font-weight:700;font-size:11px;color:' + COR.text + ';margin:14px 0 6px;">8.3 — Oportunidades de Suspensão/Redução</div>';
      var suspHeaders = ['Mês', 'Situação', 'Est. IRPJ', 'IRPJ Pago', 'Est. CSLL', 'CSLL Paga', 'Economia'];
      var suspRows = [];
      ca.suspensao.meses.forEach(function (m, i) {
        var isEco = (m.economia || 0) > 0;
        suspRows.push({ cells: [MESES[i] || m.mes, m.situacao || '', _m(m.estimativaIRPJ), _m(m.irpjPago), _m(m.estimativaCSLL), _m(m.csllPaga), _m(m.economia)], _eco: isEco });
      });
      if (ca.suspensao.economiaTotalSuspensao > 0) {
        suspRows.push({ cells: ['TOTAL', ca.suspensao.mesesSuspensos + ' meses suspensos', '', '', '', '', _m(ca.suspensao.economiaTotalSuspensao)], _total: true });
      }
      h += tabelaHTML(suspHeaders, suspRows);
    }

    // Recomendação
    if (ca.recomendacao) {
      h += '<div style="background:' + COR.infoBg + ';border-left:4px solid ' + COR.info + ';padding:12px 16px;margin:12px 0;page-break-inside:avoid;">';
      h += '<div style="font-weight:700;color:' + COR.text + ';font-size:11px;">📋 Recomendação</div>';
      h += '<div style="font-size:10px;color:' + COR.textSec + ';margin-top:4px;">';
      h += 'Forma recomendada: <strong style="color:' + COR.primary + ';">' + (ca.recomendacao.formaRecomendada === 'anual' ? 'ANUAL por Estimativa' : 'TRIMESTRAL') + '</strong>';
      if (ca.recomendacao.justificativa) h += '<br>' + ca.recomendacao.justificativa;
      if (ca.recomendacao.diferenca) h += '<br>Diferença: <strong style="color:' + COR.accentDark + ';">' + _m(Math.abs(ca.recomendacao.diferenca)) + '</strong>';
      h += '</div></div>';
    }


    // ═════════════════════════════════════════════════════
    //  SEÇÃO 9 — CENÁRIOS
    // ═════════════════════════════════════════════════════

    if (cen && cen.length > 0) {
      h += pageBreak();
      h += secaoTitulo('📉', 'SEÇÃO 9 — CENÁRIOS (Pessimista / Base / Otimista)');

      var cenHeaders = ['Indicador'];
      cen.forEach(function (c) { cenHeaders.push(c.nome || ''); });
      var indicadores = ['margem', 'lucro', 'irpjCSLL', 'pisCofins', 'iss', 'cargaTotal', 'aliquotaEfetiva'];
      var labels = { margem: 'Margem (%)', lucro: 'Lucro', irpjCSLL: 'IRPJ + CSLL', pisCofins: 'PIS/COFINS', iss: 'ISS', cargaTotal: 'Carga Total', aliquotaEfetiva: 'Alíquota Efetiva (%)' };
      var cenRows = [];
      indicadores.forEach(function (ind) {
        var row = [labels[ind] || ind];
        cen.forEach(function (c) {
          var v = c[ind];
          if (ind === 'margem' || ind === 'aliquotaEfetiva') row.push(_pp(v));
          else row.push(_m(v));
        });
        cenRows.push({ cells: row });
      });
      h += tabelaHTML(cenHeaders, cenRows);
    }

    // Projeção plurianual
    if (proj.projecaoCarga && proj.projecaoCarga.length > 0) {
      h += '<div style="font-weight:700;font-size:11px;color:' + COR.text + ';margin:14px 0 6px;">Projeção Plurianual</div>';
      var projHeaders = ['Ano', 'Receita', 'Carga', 'Economia Ano', 'Economia Acumulada'];
      var projRows = [];
      proj.projecaoCarga.forEach(function (p) {
        projRows.push({ cells: ['Ano ' + p.ano, _m(p.receita), _m(p.carga), _m(p.economiaAno), _m(p.economiaAcumulada)], _eco: true });
      });
      h += tabelaHTML(projHeaders, projRows);
    }


    // ═════════════════════════════════════════════════════
    //  SEÇÃO 10 — FLUXO DE CAIXA
    // ═════════════════════════════════════════════════════

    h += pageBreak();
    h += secaoTitulo('📅', 'SEÇÃO 10 — FLUXO DE CAIXA TRIBUTÁRIO MENSAL');

    if (fc.meses && fc.meses.length > 0) {
      var fcHeaders2 = ['Mês', 'IRPJ', 'CSLL', 'PIS', 'COFINS', 'ISS', 'TOTAL'];
      var fcRows2 = [];
      fc.meses.forEach(function (m, i) {
        fcRows2.push({ cells: [MESES[i] || m.mes, _m(m.irpj), _m(m.csll), _m(m.pis), _m(m.cofins), _m(m.iss), _m(m.total)] });
      });
      // ═══ FIX BUG #3: Usar valores anuais exatos nos totais do PDF completo ═══
      var _fcPdf2IRPJ = fc.irpjAnualExato !== undefined ? fc.irpjAnualExato : fc.meses.reduce(function (s, m) { return s + (m.irpj || 0); }, 0);
      var _fcPdf2CSLL = fc.csllAnualExato !== undefined ? fc.csllAnualExato : fc.meses.reduce(function (s, m) { return s + (m.csll || 0); }, 0);
      var _fcPdf2PIS = fc.pisAnualExato !== undefined ? fc.pisAnualExato : fc.meses.reduce(function (s, m) { return s + (m.pis || 0); }, 0);
      var _fcPdf2COF = fc.cofinsAnualExato !== undefined ? fc.cofinsAnualExato : fc.meses.reduce(function (s, m) { return s + (m.cofins || 0); }, 0);
      var _fcPdf2ISS = fc.meses.reduce(function (s, m) { return s + (m.iss || 0); }, 0);
      fcRows2.push({ cells: ['TOTAL ANUAL', _m(_r(_fcPdf2IRPJ)), _m(_r(_fcPdf2CSLL)), _m(_r(_fcPdf2PIS)), _m(_r(_fcPdf2COF)), _m(_r(_fcPdf2ISS)), _m(fc.totalAnual || 0)], _total: true });
      if (fc.mediaMensal) {
        fcRows2.push({ cells: ['Média Mensal', '', '', '', '', '', _m(fc.mediaMensal)], _subtotal: true });
      }
      h += tabelaHTML(fcHeaders2, fcRows2);
      h += '<div style="font-size:9px;color:' + COR.textMuted + ';margin-top:6px;">Forma de apuração: ' + (fc.apuracao || d.apuracaoLR || 'N/A') + '</div>';
    }


    // ═════════════════════════════════════════════════════
    //  SEÇÃO 11 — ALERTAS E COMPLIANCE
    // ═════════════════════════════════════════════════════

    h += pageBreak();
    h += secaoTitulo('⚠️', 'SEÇÃO 11 — ALERTAS E COMPLIANCE');

    // Obrigatoriedade
    if (r.obrigatoriedade) {
      if (r.obrigatoriedade.obrigado) {
        h += alertaBox('critico', '<strong>OBRIGATÓRIO:</strong> Esta empresa é obrigatória ao Lucro Real. Motivo: ' + (r.obrigatoriedade.motivo || 'Legislação vigente.'));
      } else {
        h += alertaBox('info', 'A empresa pode optar pelo Lucro Real (não obrigatória). ' + (r.obrigatoriedade.motivo || ''));
      }
    }

    // Alerta da Reforma Tributária
    h += alertaBox('aviso', '<strong>Reforma Tributária (LC 214/2025):</strong> A CBS e o IBS substituirão PIS/COFINS e ISS/ICMS a partir de 2026 (transição até 2033). Os cálculos de PIS/COFINS e ISS neste estudo seguem a legislação atual vigente. Recomenda-se acompanhar a regulamentação.');

    // Vedações
    if (r.vedacoes && r.vedacoes.length > 0) {
      r.vedacoes.forEach(function (v) {
        h += alertaBox('aviso', '<strong>Vedação:</strong> ' + (v.msg || v.descricao || v));
      });
    }

    // Alertas do motor
    if (alertas.length > 0) {
      alertas.forEach(function (a) {
        h += alertaBox(a.tipo || 'info', a.msg || '');
      });
    } else {
      h += alertaBox('info', 'Nenhum alerta adicional identificado na análise.');
    }


    // ═════════════════════════════════════════════════════
    //  SEÇÃO 12 — OBRIGAÇÕES ACESSÓRIAS E DARFs
    // ═════════════════════════════════════════════════════

    h += secaoTitulo('📝', 'SEÇÃO 12 — OBRIGAÇÕES ACESSÓRIAS E DARFs');

    if (obr.length > 0) {
      h += '<div style="font-weight:700;font-size:10px;margin:8px 0 4px;">Obrigações Acessórias do Lucro Real</div>';
      var obrRows = [];
      obr.forEach(function (o) {
        var _perPdf = '';
        if (o.prazo) {
          var _plp = o.prazo.toLowerCase();
          if (_plp.indexOf('mensal') >= 0 || _plp.indexOf('mês') >= 0 || _plp.indexOf('15º') >= 0 || _plp.indexOf('10º') >= 0) _perPdf = 'Mensal';
          else if (_plp.indexOf('trimestral') >= 0 || _plp.indexOf('trimestre') >= 0) _perPdf = 'Trimestral';
          else if (_plp.indexOf('anual') >= 0 || _plp.indexOf('ano') >= 0 || _plp.indexOf('julho') >= 0 || _plp.indexOf('maio') >= 0 || _plp.indexOf('fevereiro') >= 0) _perPdf = 'Anual';
          else if (_plp.indexOf('contínuo') >= 0 || _plp.indexOf('continuo') >= 0) _perPdf = 'Contínuo';
          else if (_plp.indexOf('período') >= 0 || _plp.indexOf('periodo') >= 0) _perPdf = 'Por Período';
          else if (_plp.indexOf('prescrever') >= 0 || _plp.indexOf('5 anos') >= 0) _perPdf = 'Permanente';
          else if (_plp.indexOf('varia') >= 0) _perPdf = 'Varia por UF';
          else _perPdf = o.prazo.split('(')[0].trim() || '';
        }
        obrRows.push({ cells: [o.obrigacao || o.nome || '', _perPdf, o.prazo || '', o.descricao || ''] });
      });
      h += tabelaHTML(['Obrigação', 'Periodicidade', 'Prazo', 'Descrição'], obrRows, { noAlignRight: true });
    }

    if (darfs.length > 0) {
      h += '<div style="font-weight:700;font-size:10px;margin:12px 0 4px;">Códigos DARF</div>';
      var darfRows = [];
      darfs.forEach(function (df) {
        if (df) darfRows.push({ cells: [df.tributo || '', df.codigo || '', df.periodicidade || '', df.prazo || ''] });
      });
      if (darfRows.length > 0) {
        h += tabelaHTML(['Tributo', 'Código DARF', 'Periodicidade', 'Prazo'], darfRows, { noAlignRight: true });
      }
    }


    // ═════════════════════════════════════════════════════
    //  SEÇÃO 13 — DETALHAMENTOS COMPLEMENTARES
    // ═════════════════════════════════════════════════════

    h += pageBreak();
    h += secaoTitulo('📎', 'SEÇÃO 13 — DETALHAMENTOS COMPLEMENTARES');

    // JCP
    if (r.jcpDetalhado && r.jcpDetalhado.jcpDedutivel > 0) {
      h += '<div style="font-weight:700;font-size:10px;margin:10px 0 4px;">13.1 — Juros sobre Capital Próprio (JCP)</div>';
      h += tabelaHTML(['Item', 'Valor'], [
        { cells: ['JCP Dedutível (PL × TJLP)', _m(r.jcpDetalhado.jcpDedutivel)] },
        { cells: ['IRRF sobre JCP (17,5%)', _m(r.jcpDetalhado.irpjJCP || r.jcpDetalhado.irrfJCP)] },
        { cells: ['Economia Líquida (34% - 17,5%)', _m(r.jcpDetalhado.economiaLiquida)], _eco: true },
        { cells: ['Limite (Lucro Líquido)', _m(r.jcpDetalhado.limiteLucro)] }
      ]);
    }

    // Compensação de prejuízo
    if (r.compensacao && r.compensacao.resumo && r.compensacao.resumo.economia && r.compensacao.resumo.economia.total > 0) {
      h += '<div style="font-weight:700;font-size:10px;margin:14px 0 4px;">13.2 — Compensação de Prejuízo Fiscal</div>';
      var compEco = r.compensacao.resumo.economia;
      var compSaldos = r.compensacao.resumo.saldosPosCompensacao || {};
      h += tabelaHTML(['Item', 'Valor'], [
        { cells: ['Economia com IRPJ', _m(compEco.irpj || compEco.total)], _eco: true },
        { cells: ['Economia com CSLL', _m(compEco.csll || 0)], _eco: true },
        { cells: ['Economia Total', _m(compEco.total)], _eco: true },
        { cells: ['Saldo Remanescente Prejuízo Fiscal', _m(compSaldos.prejuizoOperacional || compSaldos.prejuizoFiscal || 0)] },
        { cells: ['Saldo Remanescente Base Negativa CSLL', _m(compSaldos.baseNegativaCSLL || 0)] }
      ]);
    }

    // Depreciação
    if (r.depreciacaoDetalhada && r.depreciacaoDetalhada.bens && r.depreciacaoDetalhada.bens.length > 0) {
      h += '<div style="font-weight:700;font-size:10px;margin:14px 0 4px;">13.3 — Depreciação Detalhada</div>';
      var depHeaders = ['Tipo de Bem', 'Valor Original', 'Taxa', 'Deprec. Normal', 'Deprec. Acelerada'];
      var depRows = [];
      r.depreciacaoDetalhada.bens.forEach(function (b) {
        depRows.push({ cells: [b.tipo || '', _m(b.valorOriginal), _pp(b.taxa * 100), _m(b.depreciaNormal), _m(b.depreciaAcelerada)] });
      });
      depRows.push({ cells: ['TOTAL', '', '', _m(r.depreciacaoDetalhada.depreciaNormal), _m(r.depreciacaoDetalhada.depreciaAcelerada)], _subtotal: true });
      depRows.push({ cells: ['Economia Fiscal com Depreciação', '', '', '', _m(r.depreciacaoDetalhada.economiaFiscal)], _eco: true });
      h += tabelaHTML(depHeaders, depRows);
      if (r.depreciacaoDetalhada.turnos > 1) {
        h += '<div style="font-size:9px;color:' + COR.textMuted + ';">Turnos de operação: ' + r.depreciacaoDetalhada.turnos + ' (multiplicador: ' + r.depreciacaoDetalhada.multiplicador + 'x)</div>';
      }
    }

    // SUDAM/SUDENE
    if (r.sudamDetalhado && r.sudamDetalhado.resumo) {
      var sudR = r.sudamDetalhado.resumo;
      if ((sudR.economiaReducao75 || 0) + (sudR.economiaReinvestimento30 || 0) > 0) {
        h += '<div style="font-weight:700;font-size:10px;margin:14px 0 4px;">13.4 — SUDAM/SUDENE</div>';
        h += tabelaHTML(['Item', 'Valor'], [
          { cells: ['Economia Redução 75%', _m(sudR.economiaReducao75)], _eco: true },
          { cells: ['Economia Reinvestimento 30%', _m(sudR.economiaReinvestimento30)], _eco: true }
        ]);
      }
    }

    // CPRB
    if (r.cprb && r.cprb.optou && r.cprb.economia > 0) {
      h += '<div style="font-weight:700;font-size:10px;margin:14px 0 4px;">13.5 — CPRB (Desoneração da Folha)</div>';
      h += tabelaHTML(['Item', 'Valor'], [
        { cells: ['Alíquota CPRB', _pp(r.cprb.aliquota * 100)] },
        { cells: ['Base CPRB', _m(r.cprb.baseCPRB)] },
        { cells: ['Custo CPRB', _m(r.cprb.custoCPRB)] },
        { cells: ['CPP Normal (sem desoneração)', _m(r.cprb.cppNormal)] },
        { cells: ['Economia', _m(r.cprb.economia)], _eco: true },
        { cells: ['Compensa?', r.cprb.compensa ? 'SIM' : 'NÃO'] }
      ]);
    }

    // Incentivos Fiscais
    if (r.incentivosFiscais && r.incentivosFiscais.incentivos && r.incentivosFiscais.incentivos.length > 0) {
      h += '<div style="font-weight:700;font-size:10px;margin:14px 0 4px;">13.6 — Incentivos Fiscais</div>';
      var incRows = [];
      r.incentivosFiscais.incentivos.forEach(function (inc) {
        incRows.push({ cells: [inc.nome || inc.tipo || '', _m(inc.valor || inc.economia || 0), inc.baseLegal || ''] });
      });
      incRows.push({ cells: ['TOTAL INCENTIVOS', _m(r.incentivosFiscais.economiaTotal), ''], _total: true });
      h += tabelaHTML(['Incentivo', 'Economia', 'Base Legal'], incRows);
    }

    // Retenções compensadas
    if (r.retencoesCompensadas && r.retencoesCompensadas.tributosARecolher) {
      h += '<div style="font-weight:700;font-size:10px;margin:14px 0 4px;">13.7 — Retenções Compensadas</div>';
      var retObj = r.retencoesCompensadas.tributosARecolher;
      var retRows = [];
      Object.keys(retObj).forEach(function (k) {
        if (k !== 'total') retRows.push({ cells: [k.toUpperCase(), _m(retObj[k])] });
      });
      retRows.push({ cells: ['TOTAL A RECOLHER APÓS RETENÇÕES', _m(retObj.total)], _total: true });
      h += tabelaHTML(['Tributo', 'Valor a Recolher'], retRows);
    }


    // ═════════════════════════════════════════════════════
    //  SEÇÃO NOVA PDF 1 — DIAGNÓSTICO DESPESAS COM LIMITES
    // ═════════════════════════════════════════════════════

    var vdlPdf = r.validacaoDespesasLimites;
    if (vdlPdf && (vdlPdf.doacoes || vdlPdf.previdencia || vdlPdf.royalties)) {
      h += pageBreak();
      h += secaoTitulo('📋', 'DIAGNÓSTICO DE DESPESAS COM LIMITES LEGAIS');
      var dlRows = [];
      if (vdlPdf.doacoes) {
        var excDPdf = vdlPdf.doacoes.excesso || vdlPdf.doacoes.excedenteTotal || 0;
        dlRows.push({ cells: ['Doações', _m(vdlPdf.doacoes.totalInformado || 0), _m(vdlPdf.doacoes.limiteCalculado || vdlPdf.doacoes.limiteTotal || 0), excDPdf > 0 ? _m(excDPdf) : '—'] });
      }
      if (vdlPdf.previdencia) {
        var excPPdf = vdlPdf.previdencia.excesso || vdlPdf.previdencia.excedente || 0;
        dlRows.push({ cells: ['Previdência Complementar', _m(vdlPdf.previdencia.contribuicao || vdlPdf.previdencia.totalInformado || 0), _m(vdlPdf.previdencia.limite || vdlPdf.previdencia.limiteCalculado || 0), excPPdf > 0 ? _m(excPPdf) : '—'] });
      }
      if (vdlPdf.royalties) {
        var excRPdf = vdlPdf.royalties.excesso || vdlPdf.royalties.excedente || 0;
        dlRows.push({ cells: ['Royalties', _m(vdlPdf.royalties.royaltiesPagos || vdlPdf.royalties.totalInformado || 0), _m(vdlPdf.royalties.limite || vdlPdf.royalties.limiteCalculado || 0), excRPdf > 0 ? _m(excRPdf) : '—'] });
      }
      h += tabelaHTML(['Despesa', 'Valor Informado', 'Limite Legal', 'Excesso'], dlRows);
    }

    // ═════════════════════════════════════════════════════
    //  SEÇÃO NOVA PDF 2 — DESPESAS INDEDUTÍVEIS
    // ═════════════════════════════════════════════════════

    var diPdf = r.despesasIndedutivelDetalhe;
    if (diPdf && diPdf.length > 0) {
      h += secaoTitulo('🚫', 'DESPESAS INDEDUTÍVEIS IDENTIFICADAS');
      var diRowsPdf = [];
      var totalIndPdf = 0;
      var totalImpPdf = 0;
      diPdf.forEach(function (di) {
        var impDi = _r((di.valor || 0) * 0.34);
        totalIndPdf += (di.valor || 0);
        totalImpPdf += impDi;
        diRowsPdf.push({ cells: [di.descricao || di.desc || '', di.artigo || '', _m(di.valor), _m(impDi)] });
      });
      diRowsPdf.push({ cells: ['TOTAL', '', _m(totalIndPdf), _m(totalImpPdf)], _total: true });
      h += tabelaHTML(['Despesa', 'Artigo', 'Valor', 'Impacto (34%)'], diRowsPdf);
    }

    // ═════════════════════════════════════════════════════
    //  SEÇÃO NOVA PDF 3 — SUBCAPITALIZAÇÃO
    // ═════════════════════════════════════════════════════

    if (r.subcapResult) {
      h += secaoTitulo('🏦', 'ANÁLISE DE SUBCAPITALIZAÇÃO');
      if (r.subcapResult.excedeu) {
        h += alertaBox('critico', '<strong>Juros indedutíveis:</strong> ' + _m(r.subcapResult.jurosIndedutiveis || 0) + ' — Ação: reestruturar dívida (Art. 249-251)');
      } else {
        h += alertaBox('info', 'Dívidas com vinculadas dentro dos limites de subcapitalização.');
      }
    }

    // ═════════════════════════════════════════════════════
    //  SEÇÃO NOVA PDF 4 — ALERTAS COMPLIANCE / OMISSÃO
    // ═════════════════════════════════════════════════════

    var omPdf = r.omissaoResult;
    if (omPdf && omPdf.indicadores && omPdf.indicadores.length > 0) {
      h += secaoTitulo('🔍', 'ALERTAS DE COMPLIANCE E OMISSÃO DE RECEITA');
      omPdf.indicadores.forEach(function (ind) {
        var tipoAlPdf = ind.gravidade === 'CRITICO' ? 'critico' : ind.gravidade === 'ALTO' ? 'aviso' : 'info';
        h += alertaBox(tipoAlPdf, '<strong>' + (ind.descricao || '') + '</strong>' + (ind.artigo ? ' (' + ind.artigo + ')' : '') + (ind.resolucao ? '<br>→ ' + ind.resolucao : ''));
      });
    }

    // ═════════════════════════════════════════════════════
    //  SEÇÃO NOVA PDF 5 — AMORTIZAÇÃO, EXAUSTÃO, PRÉ-OPER.
    // ═════════════════════════════════════════════════════

    if (r.goodwillResult || r.exaustaoResult || r.preOperacionalResult) {
      h += secaoTitulo('📊', 'AMORTIZAÇÃO, EXAUSTÃO E PRÉ-OPERACIONAIS');
      var aeRows = [];
      if (r.goodwillResult) {
        var gwDedPdf = r.goodwillResult.amortizacaoAnual || r.goodwillResult.deducaoAnual || 0;
        aeRows.push({ cells: ['Goodwill', _m(r.goodwillResult.valorGoodwill || 0), _m(gwDedPdf), _m(_r(gwDedPdf * 0.34)), 'Lei 12.973, Art. 20-22'], _eco: true });
      }
      if (r.exaustaoResult) {
        var exDedPdf = r.exaustaoResult.exaustaoAnual || r.exaustaoResult.deducaoAnual || 0;
        aeRows.push({ cells: ['Exaustão', _m(r.exaustaoResult.custoAquisicao || 0), _m(exDedPdf), _m(_r(exDedPdf * 0.34)), 'Art. 334-337 RIR'], _eco: true });
      }
      if (r.preOperacionalResult) {
        var poDedPdf = r.preOperacionalResult.amortizacaoAnual || r.preOperacionalResult.deducaoAnual || 0;
        aeRows.push({ cells: ['Pré-Operacionais', _m(r.preOperacionalResult.valorTotal || 0), _m(poDedPdf), _m(_r(poDedPdf * 0.34)), 'Art. 11 Lei 12.973'], _eco: true });
      }
      h += tabelaHTML(['Item', 'Valor Original', 'Dedução Anual', 'Economia (34%)', 'Base Legal'], aeRows);
    }

    // ═════════════════════════════════════════════════════
    //  SEÇÃO NOVA PDF 6 — REFORMA TRIBUTÁRIA
    // ═════════════════════════════════════════════════════

    if (LR.reformaTributaria) {
      h += pageBreak();
      h += secaoTitulo('⚖️', 'REFORMA TRIBUTÁRIA — IMPACTOS LC 214/2025');
      if (LR.reformaTributaria.impactosLucroReal) {
        var rtRows = [];
        LR.reformaTributaria.impactosLucroReal.forEach(function (imp) {
          rtRows.push({ cells: [imp.tema || '', imp.descricao || '', imp.impacto || '', imp.statusRegulamentacao || imp.status || ''] });
        });
        h += tabelaHTML(['Tema', 'Descrição', 'Impacto', 'Status'], rtRows, { noAlignRight: true });
      }
      h += '<div style="font-style:italic;font-size:9px;color:' + COR.textMuted + ';margin:8px 0;">' + (LR.reformaTributaria.disclaimer || '') + '</div>';
      if (LR.reformaTributaria.dataUltimaRevisao) {
        h += '<div style="font-size:8px;color:' + COR.textMuted + ';">Última revisão: ' + LR.reformaTributaria.dataUltimaRevisao + '</div>';
      }
    }

    // ═════════════════════════════════════════════════════
    //  SEÇÃO NOVA PDF 7 — FÓRMULA MESTRE
    // ═════════════════════════════════════════════════════

    if (LR.formulaMestre && LR.formulaMestre.passos) {
      h += secaoTitulo('📐', 'FÓRMULA MESTRE DO LUCRO REAL');
      var vfPdfC = {};
      vfPdfC[1] = dre.lucroLiquido || 0;
      vfPdfC[2] = lalur.totalAdicoes || 0;
      vfPdfC[3] = lalur.totalExclusoes || 0;
      vfPdfC[4] = lalur.lucroAjustado || 0;
      var compTotPdfC = 0;
      if (r.compensacao && r.compensacao.resumo && r.compensacao.resumo.compensacaoEfetiva) {
        // CORREÇÃO BUG FÓRMULA MESTRE (PDF Completo): Apenas compensação IRPJ, não somar CSLL
        compTotPdfC = (r.compensacao.resumo.compensacaoEfetiva.prejuizoOperacional || 0);
      }
      // Fallback: ler do resultado do IRPJ se a compensação veio zerada
      if (compTotPdfC === 0 && r.irpj) {
        compTotPdfC = r.irpj.compensacaoPrejuizo || r.irpj.passo5_compensacao || 0;
      }
      vfPdfC[5] = compTotPdfC;
      vfPdfC[6] = r.lucroRealFinal || 0;
      vfPdfC[7] = irpj.irpjNormal || 0;
      vfPdfC[8] = irpj.irpjAdicional || irpj.adicional || 0;
      vfPdfC[9] = r.irpjAntesReducao || 0;
      vfPdfC[10] = (r.incentivosFiscais ? (r.incentivosFiscais.totalDeducaoFinal || r.incentivosFiscais.economiaTotal || 0) : 0) + (r.reducaoSUDAM || 0);
      var retFormPdfC = r.retencoes ? (r.retencoes.irrf || 0) : 0;
      vfPdfC[11] = retFormPdfC;
      vfPdfC[12] = r.irpjAposReducao ? _r(r.irpjAposReducao - retFormPdfC) : 0;

      var fmRowsC = [];
      LR.formulaMestre.passos.forEach(function (p) {
        var opI = p.operacao === '+' ? '(+)' : p.operacao === '-' ? '(-)' : p.operacao === '×' ? '(×)' : '(=)';
        var isT = (p.operacao === '=' && (p.passo === 6 || p.passo === 9 || p.passo === 12));
        var row = { cells: [opI, p.descricao + (p.artigo && p.artigo !== '-' ? ' — ' + p.artigo : ''), _m(vfPdfC[p.passo] || 0)] };
        if (isT) row._subtotal = true;
        fmRowsC.push(row);
      });
      h += tabelaHTML(['Op.', 'Passo', 'Valor'], fmRowsC);
    }

    // ═════════════════════════════════════════════════════
    //  SEÇÃO NOVA PDF 8 — MAPA ESTRATÉGIAS RANKINGS
    // ═════════════════════════════════════════════════════

    if (LR.estrategiasEconomia && LR.estrategiasEconomia.length > 0 && ops.length > 0) {
      h += secaoTitulo('🗺️', 'MAPA DE ESTRATÉGIAS DE ECONOMIA — RANKINGS');
      var estRows = [];
      LR.estrategiasEconomia.forEach(function (est) {
        var econEstPdf = 0;
        var ecoKeyPdf = est.nome.toLowerCase();
        if (ecoKeyPdf.indexOf('jcp') >= 0) econEstPdf = eco.jcp || 0;
        else if (ecoKeyPdf.indexOf('prejuízo') >= 0 || ecoKeyPdf.indexOf('prejuizo') >= 0) econEstPdf = eco.prejuizo || 0;
        else if (ecoKeyPdf.indexOf('sudam') >= 0) econEstPdf = eco.sudam || 0;
        else if (ecoKeyPdf.indexOf('incentiv') >= 0) econEstPdf = eco.incentivos || 0;
        else if (ecoKeyPdf.indexOf('deprecia') >= 0) econEstPdf = eco.depreciacao || 0;
        else if (ecoKeyPdf.indexOf('pis') >= 0 || ecoKeyPdf.indexOf('cofins') >= 0) econEstPdf = eco.pisCofinsCreditos || 0;
        estRows.push({ cells: [est.nome, est.tipo || '', _m(econEstPdf), est.complexidade || '', est.risco || '', est.artigo || ''], _eco: econEstPdf > 0 });
      });
      h += tabelaHTML(['Estratégia', 'Tipo', 'Economia Real', 'Complexidade', 'Risco', 'Artigo'], estRows, { noAlignRight: true });
    }

    // ═════════════════════════════════════════════════════
    //  SEÇÃO NOVA PDF 9 — ESTRUTURA LALUR
    // ═════════════════════════════════════════════════════

    if (LR.lalur) {
      h += secaoTitulo('📑', 'ESTRUTURA LALUR — PARTE A E PARTE B');

      // Parte A
      h += '<div style="font-weight:700;font-size:10px;margin:8px 0 4px;">Parte A — Demonstração do Lucro Real</div>';
      var lalurRowsPdf = [];
      if (lalur.adicoes && lalur.adicoes.length > 0) {
        lalur.adicoes.forEach(function (a) {
          lalurRowsPdf.push({ cells: ['(+) Adição', a.desc || a.descricao || '', _m(a.valor), a.artigo || ''] });
        });
      }
      if (lalur.exclusoes && lalur.exclusoes.length > 0) {
        lalur.exclusoes.forEach(function (e) {
          lalurRowsPdf.push({ cells: ['(-) Exclusão', e.desc || e.descricao || '', _m(e.valor), e.artigo || ''], _eco: true });
        });
      }
      if (lalurRowsPdf.length > 0) {
        h += tabelaHTML(['Tipo', 'Descrição', 'Valor', 'Artigo'], lalurRowsPdf, { noAlignRight: true });
      }

      // Parte B
      h += '<div style="font-weight:700;font-size:10px;margin:12px 0 4px;">Parte B — Controles Futuros</div>';
      var parteBRows = [];
      var saldoPrejPdf = 0;
      if (r.compensacao && r.compensacao.resumo && r.compensacao.resumo.saldosPosCompensacao) {
        saldoPrejPdf = r.compensacao.resumo.saldosPosCompensacao.prejuizoOperacional || r.compensacao.resumo.saldosPosCompensacao.prejuizoFiscal || 0;
      }
      if (saldoPrejPdf > 0) parteBRows.push({ cells: ['Prejuízos Fiscais', _m(saldoPrejPdf), '30% do lucro ajustado por período'] });
      var saldoBNPdf = 0;
      if (r.compensacao && r.compensacao.resumo && r.compensacao.resumo.saldosPosCompensacao) {
        saldoBNPdf = r.compensacao.resumo.saldosPosCompensacao.baseNegativaCSLL || 0;
      }
      if (saldoBNPdf > 0) parteBRows.push({ cells: ['Base Negativa CSLL', _m(saldoBNPdf), '30% da base positiva'] });
      if (parteBRows.length > 0) {
        h += tabelaHTML(['Controle', 'Saldo', 'Projeção Reversão'], parteBRows);
      }
    }

    // ═════════════════════════════════════════════════════
    //  SEÇÃO NOVA PDF 10 — ALÍQUOTAS APLICÁVEIS (PARTE 5B)
    // ═════════════════════════════════════════════════════

    if (LR.aliquotas) {
      h += secaoTitulo('📊', 'ALÍQUOTAS APLICÁVEIS — REFERÊNCIA');
      var aliqRowsPdf = [];
      var aIRPJ = LR.aliquotas.irpj || {};
      var aCSLL = LR.aliquotas.csll || {};
      var aPC = LR.aliquotas.pisCofins || {};
      aliqRowsPdf.push({ cells: ['IRPJ Normal', _pp((aIRPJ.normal || 0.15) * 100), aIRPJ.artigoBase || 'Art. 225'] });
      aliqRowsPdf.push({ cells: ['IRPJ Adicional', _pp((aIRPJ.adicional || 0.10) * 100), 'Excedente R$ 20.000/mês'] });
      aliqRowsPdf.push({ cells: ['CSLL Geral', _pp((aCSLL.geral || 0.09) * 100), aCSLL.artigoBase || 'Lei 7.689'] });
      aliqRowsPdf.push({ cells: ['CSLL Financeiras', _pp((aCSLL.financeiras || 0.15) * 100), 'Lei 13.169/2015'] });
      aliqRowsPdf.push({ cells: ['PIS NC', _pp((aPC.pisNaoCumulativo || 0.0165) * 100), 'Lei 10.637/02'] });
      aliqRowsPdf.push({ cells: ['COFINS NC', _pp((aPC.cofinsNaoCumulativo || 0.076) * 100), 'Lei 10.833/03'] });
      aliqRowsPdf.push({ cells: ['JCP IRRF', '17,50%', 'Art. 355-358 + LC 224/2025'] });
      aliqRowsPdf.push({ cells: ['Trava Compensação', '30,00%', 'Art. 580-590'] });
      h += tabelaHTML(['Tributo', 'Alíquota', 'Base Legal'], aliqRowsPdf, { noAlignRight: true });
    }

    // ═════════════════════════════════════════════════════
    //  SEÇÃO NOVA PDF 11 — HIPÓTESES OBRIGATORIEDADE (PARTE 5B)
    // ═════════════════════════════════════════════════════

    if (LR.obrigatoriedadeLucroReal && LR.obrigatoriedadeLucroReal.hipoteses) {
      h += secaoTitulo('📋', 'HIPÓTESES DE OBRIGATORIEDADE DO LUCRO REAL');
      var hipRowsPdf = [];
      LR.obrigatoriedadeLucroReal.hipoteses.forEach(function (hip) {
        var apl = false;
        if (hip.id === 'RECEITA' && _n(d.receitaBrutaAnual) > (hip.valor || 78000000)) apl = true;
        else if (hip.id === 'FINANCEIRA' && (d.ehInstituicaoFinanceira === true || d.ehInstituicaoFinanceira === "true")) apl = true;
        else if (hip.id === 'LUCRO_EXTERIOR' && (d.temLucroExterior === true || d.temLucroExterior === "true")) apl = true;
        else if (hip.id === 'BENEFICIO_FISCAL' && (d.temBeneficioFiscalIsencao === true || d.temBeneficioFiscalIsencao === "true")) apl = true;
        else if (hip.id === 'FACTORING' && (d.ehFactoring === true || d.ehFactoring === "true")) apl = true;
        else if (hip.id === 'SECURITIZADORA' && (d.ehSecuritizadora === true || d.ehSecuritizadora === "true")) apl = true;
        hipRowsPdf.push({ cells: [hip.inciso || '', hip.descricao || '', apl ? '✅ SIM' : '—'] });
      });
      h += tabelaHTML(['Inciso', 'Hipótese', 'Aplicável?'], hipRowsPdf, { noAlignRight: true });
    }


    // ═════════════════════════════════════════════════════
    //  SEÇÃO NOVA PDF 12 — ACRÉSCIMOS MORATÓRIOS (Bloco H)
    // ═════════════════════════════════════════════════════

    if (r.acrescimosMoratorios || r.multaOficio || LR.multasEMora) {
      h += pageBreak();
      h += secaoTitulo('⚖️', 'ACRÉSCIMOS MORATÓRIOS E MULTAS (Arts. 44, 47, 61, 63)');

      if (LR.multasEMora) {
        var mmPdf = LR.multasEMora;
        var moraRefRows = [];
        if (mmPdf.multaMora) {
          moraRefRows.push({ cells: ['Multa de Mora (diária)', _pp((mmPdf.multaMora.taxaDiaria || 0.0033) * 100), mmPdf.multaMora.artigo || 'Art. 61'] });
          moraRefRows.push({ cells: ['Teto Multa de Mora', _pp((mmPdf.multaMora.teto || 0.20) * 100), 'Art. 61'] });
        }
        if (mmPdf.jurosMora) {
          moraRefRows.push({ cells: ['Juros de Mora', 'SELIC + 1%/mês', mmPdf.jurosMora.artigo || 'Art. 61, §3º'] });
        }
        if (mmPdf.multaOficio) {
          moraRefRows.push({ cells: ['Multa Ofício Padrão', _pp((mmPdf.multaOficio.padrao || 0.75) * 100), mmPdf.multaOficio.artigo || 'Art. 44'] });
          moraRefRows.push({ cells: ['Multa Ofício Fraude', _pp((mmPdf.multaOficio.fraude || 1.50) * 100), 'Art. 44, §1º'] });
          if (mmPdf.multaOficio.reducoes && mmPdf.multaOficio.reducoes.conformidadeLei14689) {
            moraRefRows.push({ cells: ['Redução Lei 14.689/2023', 'Até -' + _pp((mmPdf.multaOficio.reducoes.conformidadeLei14689.comTransacao || 0.50) * 100), mmPdf.multaOficio.reducoes.conformidadeLei14689.artigo || 'Lei 14.689/2023'] });
          }
        }
        if (mmPdf.prazoEspontaneo) {
          moraRefRows.push({ cells: ['Prazo Espontâneo', (mmPdf.prazoEspontaneo.diasAposTermoFiscalizacao || 20) + ' dias', mmPdf.prazoEspontaneo.artigo || 'Art. 47'] });
        }
        if (moraRefRows.length > 0) {
          h += '<div style="font-weight:700;font-size:10px;margin:8px 0 4px;">Parâmetros Legais</div>';
          h += tabelaHTML(['Parâmetro', 'Valor', 'Base Legal'], moraRefRows, { noAlignRight: true });
        }
      }

      if (r.acrescimosMoratorios) {
        var amPdf = r.acrescimosMoratorios;
        h += '<div style="font-weight:700;font-size:10px;margin:12px 0 4px;">Simulação de Acréscimos Moratórios</div>';
        var amRows = [];
        amRows.push({ cells: ['Valor Original', _m(amPdf.valorOriginal || 0)] });
        amRows.push({ cells: ['(+) Multa de Mora', _m(amPdf.multaMora || 0)] });
        amRows.push({ cells: ['(+) Juros SELIC', _m(amPdf.jurosMora || 0)] });
        amRows.push({ cells: ['(=) Total a Pagar', _m(amPdf.valorTotal || 0)], _highlight: true });
        h += tabelaHTML(['Item', 'Valor'], amRows);
      }

      if (r.multaOficio) {
        var moPdf = r.multaOficio;
        h += '<div style="font-weight:700;font-size:10px;margin:12px 0 4px;">Simulação de Multa de Ofício</div>';
        h += '<div style="font-size:9px;color:' + COR.text + ';">Percentual: ' + _pp((moPdf.percentualAplicado || 0.75) * 100) + ' — Multa: ' + _m(moPdf.multaOficio || moPdf.valorFinal || 0) + '</div>';
        if (moPdf.reducoes && moPdf.reducoes.length > 0) {
          h += '<div style="font-size:9px;color:' + COR.acento + ';margin-top:4px;">Reduções: ' + moPdf.reducoes.join('; ') + '</div>';
        }
      }

      if (r.suspensaoMulta && r.suspensaoMulta.suspensa) {
        h += '<div style="font-size:9px;color:' + COR.acento + ';margin-top:6px;">✅ Multa de ofício suspensa — ' + (r.suspensaoMulta.motivo || 'Liminar/Tutela') + ' (Art. 63)</div>';
      }
    }


    // ═════════════════════════════════════════════════════
    //  SEÇÃO NOVA PDF 13 — COMPENSAÇÃO PER/DCOMP (Bloco I)
    // ═════════════════════════════════════════════════════

    if (r.compensacaoPERDCOMP || r.compensacaoJudicial || LR.compensacaoPERDCOMP) {
      h += pageBreak();
      h += secaoTitulo('🔄', 'COMPENSAÇÃO PER/DCOMP (Arts. 73, 74, 74-A)');

      if (LR.compensacaoPERDCOMP) {
        var cpPdf = LR.compensacaoPERDCOMP;
        if (cpPdf.vedacoes && cpPdf.vedacoes.length > 0) {
          h += '<div style="font-weight:700;font-size:10px;margin:8px 0 4px;">Vedações (§3º do Art. 74)</div>';
          var vedRows = [];
          cpPdf.vedacoes.forEach(function (v) {
            vedRows.push({ cells: [v.id || '', v.descricao || '', v.artigo || ''] });
          });
          h += tabelaHTML(['Hipótese', 'Descrição', 'Artigo'], vedRows, { noAlignRight: true });
        }
        if (cpPdf.multaCompensacaoIndevida) {
          h += '<div style="font-size:9px;color:#e74c3c;margin:6px 0;">⚠️ Multa compensação indevida: ' + _pp((cpPdf.multaCompensacaoIndevida.percentual || 0.50) * 100) + ' sobre valor não homologado (' + (cpPdf.multaCompensacaoIndevida.artigo || '§17') + ')</div>';
        }
      }

      if (r.compensacaoPERDCOMP) {
        var pdcPdf = r.compensacaoPERDCOMP;
        h += '<div style="font-weight:700;font-size:10px;margin:12px 0 4px;">Análise da Compensação</div>';
        h += '<div style="font-size:9px;color:' + (pdcPdf.compensacaoPermitida ? COR.acento : '#e74c3c') + ';">' + (pdcPdf.compensacaoPermitida ? '✅ Compensação Permitida' : '❌ Compensação Vedada') + '</div>';
        if (pdcPdf.vedacoes && pdcPdf.vedacoes.length > 0) {
          h += '<div style="font-size:9px;color:#e74c3c;margin-top:4px;">Vedações: ' + pdcPdf.vedacoes.join(', ') + '</div>';
        }
        if (pdcPdf.riscoMulta50 && pdcPdf.riscoMulta50.aplicavel) {
          h += '<div style="font-size:9px;color:#e74c3c;margin-top:4px;">Risco multa 50%: ' + _m(pdcPdf.riscoMulta50.valor || 0) + '</div>';
        }
      }

      if (r.compensacaoJudicial && r.compensacaoJudicial.sujeito) {
        var cjPdf = r.compensacaoJudicial;
        h += '<div style="font-weight:700;font-size:10px;margin:12px 0 4px;">Compensação Judicial (Art. 74-A)</div>';
        h += '<div style="font-size:9px;color:' + COR.text + ';">Limite mensal: ' + _m(cjPdf.limiteMensal || 0) + ' — Prazo: ' + (cjPdf.prazoTotal || 60) + ' meses</div>';
        if (cjPdf.cronograma && cjPdf.cronograma.length > 0 && cjPdf.cronograma.length <= 12) {
          var cjRows = [];
          cjPdf.cronograma.forEach(function (p) {
            cjRows.push({ cells: [p.mes || p.parcela || '', _m(p.valor || p.compensacao || 0), _m(p.saldo || p.saldoRemanescente || 0)] });
          });
          h += tabelaHTML(['Mês', 'Compensação', 'Saldo'], cjRows);
        }
      }
    }


    // ═════════════════════════════════════════════════════
    //  SEÇÃO 14 — DISCLAIMER + RODAPÉ
    // ═════════════════════════════════════════════════════

    h += pageBreak();
    h += secaoTitulo('📜', 'SEÇÃO 14 — NOTAS FINAIS E DISCLAIMER');
    h += pdfFooter(r);


    // GERAR PDF
    var filename = 'relatorio-completo-' + (d.razaoSocial || 'empresa').replace(/[^a-zA-Z0-9]/g, '-').substring(0, 40) + '-' + _dataCurta() + '.pdf';
    gerarPDF(h, filename, function () { hideLoading(); });
  }


  // ═══════════════════════════════════════════════════════════════════════════════
  // ███████████████████████████████████████████████████████████████████████████████
  //  EXPORTAR EXCEL — 6 abas com SheetJS
  // ███████████████████████████████████████████████████████████████████████████████
  // ═══════════════════════════════════════════════════════════════════════════════

  function exportarExcel() {
    var r = window.LucroRealEstudos ? window.LucroRealEstudos.getResultados() : null;
    if (!r) { alert('Gere o estudo antes de exportar.'); return; }
    if (typeof XLSX === 'undefined') { alert('SheetJS (XLSX) não foi carregado.'); return; }

    showLoading('Gerando planilha Excel...');

    var d = r.dadosEmpresa || {};
    var res = r.resumo || {};
    var eco = r.economia || {};
    var dre = r.dre || {};
    var lalur = r.lalur || {};
    var irpj = r.irpj || {};
    var csll = r.csll || {};
    var pc = r.pisCofins || {};
    var iss = r.iss || {};
    var comp = r.composicao || {};
    var ops = r.oportunidades || [];
    var fc = r.fluxoCaixa || {};
    var cen = r.cenarios || [];
    var proj = r.projecao || {};

    var wb = XLSX.utils.book_new();

    // Helper: criar worksheet com largura de colunas
    function addSheet(name, aoa, colWidths) {
      var ws = XLSX.utils.aoa_to_sheet(aoa);
      if (colWidths) ws['!cols'] = colWidths.map(function (w) { return { wch: w }; });
      XLSX.utils.book_append_sheet(wb, ws, name);
    }

    // Formatador numérico para Excel
    function mv(v) { return _r(v || 0); }
    function pv(v) { return _r((v || 0) * 100); }

    // ═════════════════════════════════════════════════════
    //  ABA 1 — RESUMO
    // ═════════════════════════════════════════════════════

    var aba1 = [];
    aba1.push(['ESTUDO DE LUCRO REAL — RESUMO EXECUTIVO']);
    aba1.push([]);
    aba1.push(['DADOS DA EMPRESA']);
    aba1.push(['Razão Social', d.razaoSocial || '']);
    aba1.push(['CNPJ', d.cnpj || '']);
    aba1.push(['CNAE', d.cnaePrincipal || '']);
    aba1.push(['UF/Município', (d.municipio || '') + '/' + (d.uf || '')]);
    aba1.push(['Atividade', d.tipoAtividade || '']);
    aba1.push(['Apuração', d.apuracaoLR === 'anual' ? 'Anual por Estimativa' : 'Trimestral']);
    aba1.push(['Ano-base', d.anoBase || '']);
    aba1.push(['Receita Bruta Anual', mv(d.receitaBrutaAnual)]);
    aba1.push([]);
    aba1.push(['INDICADORES PRINCIPAIS']);
    aba1.push(['Economia Total Identificada', mv(res.economiaTotal)]);
    aba1.push(['Carga Tributária Bruta', mv(res.cargaBruta)]);
    aba1.push(['Carga Tributária Mensal', mv(res.cargaBrutaMensal)]);
    aba1.push(['Alíquota Efetiva (%)', pv(res.aliquotaEfetiva / 100)]);
    aba1.push(['Carga Otimizada', mv(res.cargaOtimizada)]);
    aba1.push(['Alíquota Otimizada (%)', pv(res.aliquotaOtimizada / 100)]);
    aba1.push(['Retenções a Compensar', mv(res.totalRetencoes)]);
    aba1.push(['Saldo Federal a Pagar', mv(res.saldoEfetivo)]);
    aba1.push([]);
    aba1.push(['FONTES DE ECONOMIA', 'Valor Anual', 'Base Legal']);
    var ecoKeys3 = ['jcp', 'prejuizo', 'sudam', 'incentivos', 'depreciacao', 'pisCofinsCreditos', 'gratificacao', 'cprb', 'pddFiscal'];
    ecoKeys3.forEach(function (k) {
      if (eco[k] > 0) {
        var info = ECONOMIA_NOMES[k] || {};
        aba1.push([info.nome || k, mv(eco[k]), info.base || '']);
      }
    });
    aba1.push(['ECONOMIA TOTAL', mv(eco.total || res.economiaTotal), '']);
    addSheet('Resumo', aba1, [40, 18, 30]);


    // ═════════════════════════════════════════════════════
    //  ABA 2 — DRE-LALUR
    // ═════════════════════════════════════════════════════

    var aba2 = [];
    aba2.push(['DRE — DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO']);
    aba2.push(['Item', 'Valor']);
    aba2.push(['Receita Bruta', mv(dre.receitaBruta)]);
    var xlDeducoesRec = r.pisCofins ? _r((r.pisCofins.debitoPIS || 0) + (r.pisCofins.debitoCOFINS || 0)) : (dre.pisCofinsDebitos || 0);
    aba2.push(['(-) PIS/COFINS sobre Receita', mv(-xlDeducoesRec)]);
    aba2.push(['= RECEITA LÍQUIDA', mv(_r(dre.receitaBruta - xlDeducoesRec))]);
    aba2.push(['(-) Custos Totais', mv(-(dre.custosTotais || 0))]);
    if (dre.cmv) aba2.push(['    CMV / CPV', mv(-dre.cmv)]);
    if (dre.folhaPagamento) aba2.push(['    Folha de Pagamento', mv(-dre.folhaPagamento)]);
    if (dre.servicosTerceiros) aba2.push(['    Serviços de Terceiros', mv(-dre.servicosTerceiros)]);
    aba2.push(['= LUCRO BRUTO', mv(dre.lucroBruto || _r(dre.receitaBruta - xlDeducoesRec - dre.custosTotais))]);
    aba2.push(['(-) Despesas Totais', mv(-(dre.despesasTotais || 0))]);
    if (dre.depreciacao) aba2.push(['    Depreciação', mv(-dre.depreciacao)]);
    if (dre.receitaFinanceiras) aba2.push(['(+) Receitas Financeiras', mv(dre.receitaFinanceiras)]);
    aba2.push(['= LUCRO LÍQUIDO CONTÁBIL', mv(dre.lucroLiquido)]);
    if (dre.margemLucro !== undefined) aba2.push(['Margem de Lucro (%)', pv(dre.margemLucro / 100)]);
    aba2.push([]);
    aba2.push(['LALUR — LIVRO DE APURAÇÃO DO LUCRO REAL']);
    aba2.push(['Descrição', 'Valor', 'Base Legal']);
    aba2.push(['Lucro Líquido Contábil', mv(lalur.lucroLiquido), '']);
    if (lalur.adicoes && lalur.adicoes.length > 0) {
      aba2.push(['--- ADIÇÕES ---', '', '']);
      lalur.adicoes.forEach(function (a) {
        aba2.push(['(+) ' + (a.desc || a.descricao || ''), mv(a.valor), a.artigo || '']);
      });
      aba2.push(['Total Adições', mv(lalur.totalAdicoes), '']);
    }
    if (lalur.exclusoes && lalur.exclusoes.length > 0) {
      aba2.push(['--- EXCLUSÕES ---', '', '']);
      lalur.exclusoes.forEach(function (e) {
        aba2.push(['(-) ' + (e.desc || e.descricao || ''), mv(e.valor), e.artigo || '']);
      });
      aba2.push(['Total Exclusões', mv(lalur.totalExclusoes), '']);
    }
    aba2.push(['= LUCRO AJUSTADO', mv(lalur.lucroAjustado), '']);
    aba2.push(['= LUCRO REAL FINAL', mv(r.lucroRealFinal), '']);
    if (r.baseCSLLFinal !== undefined) aba2.push(['Base CSLL Final', mv((r.csll && r.csll.baseCalculo !== undefined) ? r.csll.baseCalculo : r.baseCSLLFinal), '']);
    addSheet('DRE-LALUR', aba2, [40, 18, 30]);


    // ═════════════════════════════════════════════════════
    //  ABA 3 — TRIBUTOS
    // ═════════════════════════════════════════════════════

    var aba3 = [];
    aba3.push(['CÁLCULO DETALHADO DE TRIBUTOS']);
    aba3.push([]);
    aba3.push(['IRPJ']);
    var xlBaseIRPJ = (r.irpj && r.irpj.lucroReal !== undefined) ? r.irpj.lucroReal : r.lucroRealFinal;
    aba3.push(['Lucro Real (Base de Cálculo)', mv(xlBaseIRPJ)]);
    aba3.push(['IRPJ Normal (15%)', mv(irpj.irpjNormal)]);
    aba3.push(['IRPJ Adicional (10%)', mv(irpj.adicional)]);
    aba3.push(['IRPJ Bruto', mv(irpj.totalBruto || (irpj.irpjNormal || 0) + (irpj.adicional || 0))]);
    if (r.reducaoSUDAM > 0) aba3.push(['(-) Redução SUDAM/SUDENE', mv(-r.reducaoSUDAM)]);
    if (r.incentivosFiscais && r.incentivosFiscais.economiaTotal > 0) aba3.push(['(-) Incentivos Fiscais', mv(-r.incentivosFiscais.economiaTotal)]);
    aba3.push(['IRPJ FINAL', mv(r.irpjAposReducao)]);
    aba3.push([]);
    aba3.push(['CSLL']);
    aba3.push(['Base CSLL', mv((r.csll && r.csll.baseCalculo !== undefined) ? r.csll.baseCalculo : (r.baseCSLLFinal || r.lucroRealFinal))]);
    aba3.push(['Alíquota (%)', pv(csll.aliquota)]);
    aba3.push(['CSLL Devida', mv(csll.csllDevida)]);
    aba3.push([]);
    aba3.push(['PIS/COFINS (Não-Cumulativo)']);
    aba3.push(['Receita Tributável', mv(pc.receitaTributavel)]);
    aba3.push(['Débito PIS (1,65%)', mv(pc.debitoPIS)]);
    aba3.push(['Débito COFINS (7,6%)', mv(pc.debitoCOFINS)]);
    aba3.push(['(-) Crédito PIS', mv(-(pc.creditoPIS || 0))]);
    aba3.push(['(-) Crédito COFINS', mv(-(pc.creditoCOFINS || 0))]);
    var xlPisRet = _n(d.pisRetido), xlCofRet = _n(d.cofinsRetido);
    if (xlPisRet > 0) aba3.push(['(-) PIS Retido na Fonte', mv(-xlPisRet)]);
    if (xlCofRet > 0) aba3.push(['(-) COFINS Retido na Fonte', mv(-xlCofRet)]);
    aba3.push(['PIS/COFINS a Pagar', mv(Math.max(pc.totalAPagarBruto - xlPisRet - xlCofRet, 0))]);
    if (pc.economiaCreditos > 0) aba3.push(['Economia com Créditos', mv(pc.economiaCreditos)]);
    aba3.push([]);
    aba3.push(['ISS']);
    if (iss) {
      aba3.push(['Receita de Serviços', mv(iss.receitaServicos)]);
      aba3.push(['Alíquota ISS (%)', pv(iss.aliquota)]);
      aba3.push(['ISS Anual', mv(iss.issAnual)]);
      aba3.push(['ISS Mensal', mv(iss.issMensal)]);
    }
    aba3.push([]);
    aba3.push(['COMPOSIÇÃO DA CARGA']);
    aba3.push(['Tributo', 'Valor Anual', '% da Carga']);
    aba3.push(['IRPJ', mv(comp.irpj ? comp.irpj.valor : 0), pv((comp.irpj ? comp.irpj.percentual : 0) / 100)]);
    aba3.push(['CSLL', mv(comp.csll ? comp.csll.valor : 0), pv((comp.csll ? comp.csll.percentual : 0) / 100)]);
    aba3.push(['PIS/COFINS', mv(comp.pisCofins ? comp.pisCofins.valor : 0), pv((comp.pisCofins ? comp.pisCofins.percentual : 0) / 100)]);
    aba3.push(['ISS', mv(comp.iss ? comp.iss.valor : 0), pv((comp.iss ? comp.iss.percentual : 0) / 100)]);
    aba3.push(['TOTAL', mv(res.cargaBruta), '100.00']);
    addSheet('Tributos', aba3, [35, 18, 14]);


    // ═════════════════════════════════════════════════════
    //  ABA 4 — OPORTUNIDADES
    // ═════════════════════════════════════════════════════

    var aba4 = [];
    aba4.push(['OPORTUNIDADES DE ECONOMIA TRIBUTÁRIA']);
    aba4.push(['#', 'Título', 'Tipo', 'Economia Anual', 'Complexidade', 'Risco', 'Prazo', 'Base Legal', 'Descrição', 'Ação Recomendada']);
    ops.forEach(function (op, i) {
      aba4.push([
        op.ranking || i + 1,
        op.titulo || '',
        op.tipo || '',
        mv(op.economiaAnual),
        op.complexidade || '',
        op.risco || '',
        op.prazoImplementacao || '',
        op.baseLegal || '',
        op.descricao || '',
        op.acaoRecomendada || ''
      ]);
    });
    addSheet('Oportunidades', aba4, [5, 30, 12, 16, 12, 10, 12, 25, 50, 50]);


    // ═════════════════════════════════════════════════════
    //  ABA 5 — FLUXO MENSAL
    // ═════════════════════════════════════════════════════

    var aba5 = [];
    aba5.push(['FLUXO DE CAIXA TRIBUTÁRIO MENSAL']);
    aba5.push(['Mês', 'IRPJ', 'CSLL', 'PIS', 'COFINS', 'ISS', 'TOTAL']);
    if (fc.meses) {
      fc.meses.forEach(function (m, i) {
        aba5.push([MESES[i] || m.mes, mv(m.irpj), mv(m.csll), mv(m.pis), mv(m.cofins), mv(m.iss), mv(m.total)]);
      });
      // ═══ FIX BUG #3: Usar valores anuais exatos nos totais do Excel ═══
      var _fcXlsIRPJ = fc.irpjAnualExato !== undefined ? fc.irpjAnualExato : fc.meses.reduce(function (s, m) { return s + (m.irpj || 0); }, 0);
      var _fcXlsCSLL = fc.csllAnualExato !== undefined ? fc.csllAnualExato : fc.meses.reduce(function (s, m) { return s + (m.csll || 0); }, 0);
      var _fcXlsPIS = fc.pisAnualExato !== undefined ? fc.pisAnualExato : fc.meses.reduce(function (s, m) { return s + (m.pis || 0); }, 0);
      var _fcXlsCOF = fc.cofinsAnualExato !== undefined ? fc.cofinsAnualExato : fc.meses.reduce(function (s, m) { return s + (m.cofins || 0); }, 0);
      var _fcXlsISS = fc.meses.reduce(function (s, m) { return s + (m.iss || 0); }, 0);
      aba5.push([
        'TOTAL ANUAL',
        mv(_r(_fcXlsIRPJ)),
        mv(_r(_fcXlsCSLL)),
        mv(_r(_fcXlsPIS)),
        mv(_r(_fcXlsCOF)),
        mv(_r(_fcXlsISS)),
        mv(fc.totalAnual || 0)
      ]);
      if (fc.mediaMensal) {
        aba5.push(['Média Mensal', '', '', '', '', '', mv(fc.mediaMensal)]);
      }
    }
    addSheet('Fluxo Mensal', aba5, [14, 14, 14, 14, 14, 14, 16]);


    // ═════════════════════════════════════════════════════
    //  ABA 6 — CENÁRIOS + PROJEÇÃO
    // ═════════════════════════════════════════════════════

    var aba6 = [];
    if (cen && cen.length > 0) {
      aba6.push(['CENÁRIOS — ANÁLISE DE SENSIBILIDADE']);
      var cenH = ['Indicador'];
      cen.forEach(function (c) { cenH.push(c.nome || ''); });
      aba6.push(cenH);
      var indicadores2 = [
        { k: 'margem', l: 'Margem (%)' },
        { k: 'lucro', l: 'Lucro' },
        { k: 'irpjCSLL', l: 'IRPJ + CSLL' },
        { k: 'pisCofins', l: 'PIS/COFINS' },
        { k: 'iss', l: 'ISS' },
        { k: 'cargaTotal', l: 'Carga Total' },
        { k: 'aliquotaEfetiva', l: 'Alíquota Efetiva (%)' }
      ];
      indicadores2.forEach(function (ind) {
        var row = [ind.l];
        cen.forEach(function (c) {
          if (ind.k === 'margem' || ind.k === 'aliquotaEfetiva') row.push(pv(c[ind.k] / 100));
          else row.push(mv(c[ind.k]));
        });
        aba6.push(row);
      });
      aba6.push([]);
    }

    if (proj.projecaoCarga && proj.projecaoCarga.length > 0) {
      aba6.push(['PROJEÇÃO PLURIANUAL']);
      aba6.push(['Ano', 'Receita', 'Carga', 'Economia Ano', 'Economia Acumulada']);
      proj.projecaoCarga.forEach(function (p) {
        aba6.push(['Ano ' + p.ano, mv(p.receita), mv(p.carga), mv(p.economiaAno), mv(p.economiaAcumulada)]);
      });
    }

    if (aba6.length === 0) {
      aba6.push(['Cenários e projeção não gerados']);
      aba6.push(['Ative as opções "Gerar Cenários" e "Gerar Projeção" na Etapa 7 do wizard.']);
    }
    addSheet('Cenários-Projeção', aba6, [20, 18, 18, 18, 20]);


    // ═════════════════════════════════════════════════════
    //  ABA 7 — DESPESAS LIMITES
    // ═════════════════════════════════════════════════════

    var aba7 = [];
    aba7.push(['DESPESAS COM LIMITES LEGAIS']);
    aba7.push(['Despesa', 'Valor Informado', 'Limite Legal', 'Excesso Indedutível']);
    var vdlXls = r.validacaoDespesasLimites;
    if (vdlXls) {
      if (vdlXls.doacoes) {
        aba7.push(['Doações', mv(vdlXls.doacoes.totalInformado || 0), mv(vdlXls.doacoes.limiteCalculado || vdlXls.doacoes.limiteTotal || 0), mv(vdlXls.doacoes.excesso || vdlXls.doacoes.excedenteTotal || 0)]);
      }
      if (vdlXls.previdencia) {
        aba7.push(['Previdência Complementar', mv(vdlXls.previdencia.contribuicao || vdlXls.previdencia.totalInformado || 0), mv(vdlXls.previdencia.limite || vdlXls.previdencia.limiteCalculado || 0), mv(vdlXls.previdencia.excesso || vdlXls.previdencia.excedente || 0)]);
      }
      if (vdlXls.royalties) {
        aba7.push(['Royalties', mv(vdlXls.royalties.royaltiesPagos || vdlXls.royalties.totalInformado || 0), mv(vdlXls.royalties.limite || vdlXls.royalties.limiteCalculado || 0), mv(vdlXls.royalties.excesso || vdlXls.royalties.excedente || 0)]);
      }
    } else {
      aba7.push(['Nenhuma despesa com limite informada', '', '', '']);
    }
    addSheet('Despesas Limites', aba7, [30, 18, 18, 18]);


    // ═════════════════════════════════════════════════════
    //  ABA 8 — INDEDUTÍVEIS
    // ═════════════════════════════════════════════════════

    var aba8 = [];
    aba8.push(['DESPESAS INDEDUTÍVEIS']);
    aba8.push(['Descrição', 'Artigo', 'Valor', 'Impacto Fiscal (34%)']);
    var diXls = r.despesasIndedutivelDetalhe;
    if (diXls && diXls.length > 0) {
      var totalIndXls = 0;
      var totalImpXls = 0;
      diXls.forEach(function (di) {
        var impXls = _r((di.valor || 0) * 0.34);
        totalIndXls += (di.valor || 0);
        totalImpXls += impXls;
        aba8.push([di.descricao || di.desc || '', di.artigo || '', mv(di.valor), mv(impXls)]);
      });
      aba8.push(['TOTAL', '', mv(totalIndXls), mv(totalImpXls)]);
    } else {
      aba8.push(['Nenhuma despesa indedutível identificada', '', '', '']);
    }
    addSheet('Indedutíveis', aba8, [40, 25, 18, 18]);


    // ═════════════════════════════════════════════════════
    //  ABA 9 — SUBCAPITALIZAÇÃO
    // ═════════════════════════════════════════════════════

    var aba9 = [];
    aba9.push(['ANÁLISE DE SUBCAPITALIZAÇÃO']);
    aba9.push([]);
    if (r.subcapResult) {
      aba9.push(['Limite Excedido?', r.subcapResult.excedeu ? 'SIM' : 'NÃO']);
      if (r.subcapResult.excedeu) {
        aba9.push(['Juros Indedutíveis', mv(r.subcapResult.jurosIndedutiveis || 0)]);
      }
      aba9.push([]);
      aba9.push(['LIMITES DE SUBCAPITALIZAÇÃO (Art. 249-251)']);
      aba9.push(['Tipo', 'Regra', 'Artigo']);
      if (LR.subcapitalizacao) {
        if (LR.subcapitalizacao.vinculadaComParticipacao) {
          aba9.push(['Vinculada c/ Participação', LR.subcapitalizacao.vinculadaComParticipacao.descricao || '', LR.subcapitalizacao.vinculadaComParticipacao.artigo || '']);
        }
        if (LR.subcapitalizacao.vinculadaSemParticipacao) {
          aba9.push(['Vinculada s/ Participação', LR.subcapitalizacao.vinculadaSemParticipacao.descricao || '', LR.subcapitalizacao.vinculadaSemParticipacao.artigo || '']);
        }
        if (LR.subcapitalizacao.paraisoFiscal) {
          aba9.push(['Paraíso Fiscal', LR.subcapitalizacao.paraisoFiscal.descricao || '', LR.subcapitalizacao.paraisoFiscal.artigo || '']);
        }
      }
    } else {
      aba9.push(['Dados de subcapitalização não informados']);
    }
    addSheet('Subcapitalização', aba9, [30, 50, 15]);


    // ═════════════════════════════════════════════════════
    //  ABA 10 — LALUR
    // ═════════════════════════════════════════════════════

    var aba10 = [];
    aba10.push(['LALUR — PARTE A E PARTE B']);
    aba10.push([]);
    aba10.push(['PARTE A — Adições e Exclusões Efetivas']);
    aba10.push(['Tipo', 'Descrição', 'Valor', 'Artigo']);
    if (lalur.adicoes && lalur.adicoes.length > 0) {
      lalur.adicoes.forEach(function (a) {
        aba10.push(['(+) Adição', a.desc || a.descricao || '', mv(a.valor), a.artigo || '']);
      });
      aba10.push(['Total Adições', '', mv(lalur.totalAdicoes), '']);
    }
    if (lalur.exclusoes && lalur.exclusoes.length > 0) {
      lalur.exclusoes.forEach(function (e) {
        aba10.push(['(-) Exclusão', e.desc || e.descricao || '', mv(e.valor), e.artigo || '']);
      });
      aba10.push(['Total Exclusões', '', mv(lalur.totalExclusoes), '']);
    }
    aba10.push([]);
    aba10.push(['PARTE B — Controles Futuros']);
    aba10.push(['Controle', 'Saldo Remanescente', 'Projeção']);
    var saldoPrejXls = 0;
    if (r.compensacao && r.compensacao.resumo && r.compensacao.resumo.saldosPosCompensacao) {
      saldoPrejXls = r.compensacao.resumo.saldosPosCompensacao.prejuizoOperacional || r.compensacao.resumo.saldosPosCompensacao.prejuizoFiscal || 0;
    }
    if (saldoPrejXls > 0) aba10.push(['Prejuízos Fiscais a Compensar', mv(saldoPrejXls), 'Compensável a 30% do lucro ajustado']);
    var saldoBNXls = 0;
    if (r.compensacao && r.compensacao.resumo && r.compensacao.resumo.saldosPosCompensacao) {
      saldoBNXls = r.compensacao.resumo.saldosPosCompensacao.baseNegativaCSLL || 0;
    }
    if (saldoBNXls > 0) aba10.push(['Base Negativa CSLL', mv(saldoBNXls), 'Compensável a 30% da base positiva']);
    var provNDXls = _n(d.provisoesContingencias) + _n(d.provisoesGarantias);
    if (provNDXls > 0) aba10.push(['Provisões Não Dedutíveis', mv(provNDXls), 'Exclusão na reversão/liquidação']);
    addSheet('LALUR', aba10, [15, 40, 18, 25]);


    // ═════════════════════════════════════════════════════
    //  ABA 11 — MAPA ECONOMIA
    // ═════════════════════════════════════════════════════

    var aba11 = [];
    aba11.push(['MAPA DE ECONOMIA — OPORTUNIDADES RANQUEADAS']);
    aba11.push(['#', 'Título', 'Tipo', 'Economia Anual', 'Complexidade', 'Risco', 'Base Legal', 'Descrição']);
    var opsRank = (r.oportunidades || []).slice().sort(function (a, b) { return (b.economiaAnual || 0) - (a.economiaAnual || 0); });
    opsRank.forEach(function (op, i) {
      aba11.push([
        op._isConsolidada ? '⊕' : (i + 1),
        (op._isConsolidada ? '[CONSOLIDAÇÃO] ' : '') + (op.titulo || ''),
        op.tipo || '',
        mv(op.economiaAnual),
        op.complexidade || '',
        op.risco || '',
        op.baseLegal || '',
        op.descricao || ''
      ]);
    });
    if (opsRank.length > 0) {
      var econTotalXls = 0;
      opsRank.forEach(function (op) { if (!op._isConsolidada) econTotalXls += (op.economiaAnual || 0); });
      aba11.push(['', 'TOTAL', '', mv(econTotalXls), '', '', '', '']);
    }
    addSheet('Mapa Economia', aba11, [5, 30, 12, 16, 12, 10, 25, 50]);


    // ═════════════════════════════════════════════════════
    //  ABA 12 — ALÍQUOTAS REFERÊNCIA (PARTE 5B)
    // ═════════════════════════════════════════════════════

    if (LR.aliquotas) {
      var aba12 = [];
      aba12.push(['ALÍQUOTAS APLICÁVEIS — REFERÊNCIA']);
      aba12.push(['Tributo', 'Alíquota (%)', 'Base Legal']);
      var aI = LR.aliquotas.irpj || {};
      var aC = LR.aliquotas.csll || {};
      var aP = LR.aliquotas.pisCofins || {};
      aba12.push(['IRPJ Normal', pv(aI.normal || 0.15), aI.artigoBase || 'Art. 225']);
      aba12.push(['IRPJ Adicional', pv(aI.adicional || 0.10), 'Excedente R$ 20.000/mês']);
      aba12.push(['CSLL Geral', pv(aC.geral || 0.09), aC.artigoBase || 'Lei 7.689']);
      aba12.push(['CSLL Financeiras', pv(aC.financeiras || 0.15), 'Lei 13.169/2015']);
      aba12.push(['PIS NC', pv(aP.pisNaoCumulativo || 0.0165), 'Lei 10.637/02']);
      aba12.push(['COFINS NC', pv(aP.cofinsNaoCumulativo || 0.076), 'Lei 10.833/03']);
      aba12.push(['JCP IRRF', 17.50, 'Art. 355-358 + LC 224/2025']);
      aba12.push(['Trava Compensação', 30.00, 'Art. 580-590']);
      addSheet('Alíquotas', aba12, [25, 15, 30]);
    }

    // ═════════════════════════════════════════════════════
    //  ABA 13 — HIPÓTESES OBRIGATORIEDADE (PARTE 5B)
    // ═════════════════════════════════════════════════════

    if (LR.obrigatoriedadeLucroReal && LR.obrigatoriedadeLucroReal.hipoteses) {
      var aba13 = [];
      aba13.push(['HIPÓTESES DE OBRIGATORIEDADE DO LUCRO REAL']);
      aba13.push(['Inciso', 'Hipótese', 'Aplicável?']);
      LR.obrigatoriedadeLucroReal.hipoteses.forEach(function (hip) {
        var aplXls = false;
        if (hip.id === 'RECEITA' && _n(d.receitaBrutaAnual) > (hip.valor || 78000000)) aplXls = true;
        else if (hip.id === 'FINANCEIRA' && (d.ehInstituicaoFinanceira === true || d.ehInstituicaoFinanceira === "true")) aplXls = true;
        else if (hip.id === 'LUCRO_EXTERIOR' && (d.temLucroExterior === true || d.temLucroExterior === "true")) aplXls = true;
        else if (hip.id === 'BENEFICIO_FISCAL' && (d.temBeneficioFiscalIsencao === true || d.temBeneficioFiscalIsencao === "true")) aplXls = true;
        else if (hip.id === 'FACTORING' && (d.ehFactoring === true || d.ehFactoring === "true")) aplXls = true;
        else if (hip.id === 'SECURITIZADORA' && (d.ehSecuritizadora === true || d.ehSecuritizadora === "true")) aplXls = true;
        aba13.push([hip.inciso || '', hip.descricao || '', aplXls ? 'SIM' : '—']);
      });
      addSheet('Obrigatoriedade', aba13, [10, 60, 12]);
    }

    // ═════════════════════════════════════════════════════
    //  ABA 14 — RELATÓRIO CONSOLIDADO (PARTE 5B)
    // ═════════════════════════════════════════════════════

    if (r.relatorioConsolidado) {
      var aba14 = [];
      aba14.push(['RELATÓRIO CONSOLIDADO']);
      aba14.push([]);
      if (r.relatorioConsolidado.resumo) {
        var rcRes = r.relatorioConsolidado.resumo;
        Object.keys(rcRes).forEach(function (k) {
          var val = rcRes[k];
          aba14.push([k, typeof val === 'number' ? mv(val) : String(val || '')]);
        });
      } else {
        aba14.push(['Dados consolidados disponíveis', 'Sim']);
      }
      addSheet('Consolidado', aba14, [35, 25]);
    }


    // ═════════════════════════════════════════════════════
    //  ABA 15 — ACRÉSCIMOS MORATÓRIOS E MULTAS (Bloco H)
    // ═════════════════════════════════════════════════════

    if (r.acrescimosMoratorios || r.multaOficio || LR.multasEMora) {
      var aba15 = [];
      aba15.push(['ACRÉSCIMOS MORATÓRIOS E MULTAS — Arts. 44, 47, 61, 63']);
      aba15.push([]);

      // Parâmetros legais
      if (LR.multasEMora) {
        var mmXls = LR.multasEMora;
        aba15.push(['PARÂMETROS LEGAIS']);
        aba15.push(['Parâmetro', 'Valor', 'Base Legal']);
        if (mmXls.multaMora) {
          aba15.push(['Multa de Mora (diária)', pv(mmXls.multaMora.taxaDiaria || 0.0033), mmXls.multaMora.artigo || 'Art. 61']);
          aba15.push(['Teto Multa de Mora', pv(mmXls.multaMora.teto || 0.20), 'Art. 61']);
        }
        if (mmXls.jurosMora) {
          aba15.push(['Juros de Mora', 'SELIC acum. + 1%/mês', mmXls.jurosMora.artigo || 'Art. 61, §3º']);
        }
        if (mmXls.multaOficio) {
          aba15.push(['Multa Ofício Padrão', pv(mmXls.multaOficio.padrao || 0.75), mmXls.multaOficio.artigo || 'Art. 44']);
          aba15.push(['Multa Ofício Fraude', pv(mmXls.multaOficio.fraude || 1.50), 'Art. 44, §1º']);
          if (mmXls.multaOficio.reducoes && mmXls.multaOficio.reducoes.pagamentoOuParcelamento30dias) {
            aba15.push(['Redução pgto 30 dias', '-' + pv(mmXls.multaOficio.reducoes.pagamentoOuParcelamento30dias || 0.50), 'Art. 44, §3º']);
          }
          if (mmXls.multaOficio.reducoes && mmXls.multaOficio.reducoes.conformidadeLei14689) {
            aba15.push(['Redução Lei 14.689/2023', 'Até -' + pv(mmXls.multaOficio.reducoes.conformidadeLei14689.comTransacao || 0.50), mmXls.multaOficio.reducoes.conformidadeLei14689.artigo || 'Lei 14.689/2023']);
          }
        }
        if (mmXls.prazoEspontaneo) {
          aba15.push(['Prazo Espontâneo', (mmXls.prazoEspontaneo.diasAposTermoFiscalizacao || 20) + ' dias', mmXls.prazoEspontaneo.artigo || 'Art. 47']);
        }
      }

      // Simulação calculada
      if (r.acrescimosMoratorios) {
        var amXls = r.acrescimosMoratorios;
        aba15.push([]);
        aba15.push(['SIMULAÇÃO — ACRÉSCIMOS MORATÓRIOS']);
        aba15.push(['Item', 'Valor']);
        aba15.push(['Valor Original', mv(amXls.valorOriginal || 0)]);
        aba15.push(['(+) Multa de Mora', mv(amXls.multaMora || 0)]);
        aba15.push(['(+) Juros SELIC', mv(amXls.jurosMora || 0)]);
        aba15.push(['(=) Total a Pagar', mv(amXls.valorTotal || 0)]);
        aba15.push(['Pagamento Espontâneo?', amXls.espontaneo ? 'Sim' : 'Não']);
      }

      // Multa de ofício
      if (r.multaOficio) {
        var moXls = r.multaOficio;
        aba15.push([]);
        aba15.push(['SIMULAÇÃO — MULTA DE OFÍCIO']);
        aba15.push(['Percentual Aplicado', pv(moXls.percentualAplicado || 0.75)]);
        aba15.push(['Multa Calculada', mv(moXls.multaOficio || moXls.valorFinal || 0)]);
        if (moXls.reducoes && moXls.reducoes.length > 0) {
          aba15.push(['Reduções', moXls.reducoes.join('; ')]);
        }
      }

      // Suspensão
      if (r.suspensaoMulta && r.suspensaoMulta.suspensa) {
        aba15.push([]);
        aba15.push(['SUSPENSÃO MULTA DE OFÍCIO', 'Sim — ' + (r.suspensaoMulta.motivo || 'Liminar/Tutela'), 'Art. 63']);
      }

      addSheet('Mora e Multas', aba15, [30, 25, 30]);
    }


    // ═════════════════════════════════════════════════════
    //  ABA 16 — COMPENSAÇÃO PER/DCOMP (Bloco I)
    // ═════════════════════════════════════════════════════

    if (r.compensacaoPERDCOMP || r.compensacaoJudicial || LR.compensacaoPERDCOMP) {
      var aba16 = [];
      aba16.push(['COMPENSAÇÃO PER/DCOMP — Arts. 73, 74, 74-A']);
      aba16.push([]);

      // Vedações — referência
      if (LR.compensacaoPERDCOMP && LR.compensacaoPERDCOMP.vedacoes) {
        aba16.push(['VEDAÇÕES À COMPENSAÇÃO (§3º do Art. 74)']);
        aba16.push(['Hipótese', 'Descrição', 'Artigo']);
        LR.compensacaoPERDCOMP.vedacoes.forEach(function (v) {
          aba16.push([v.id || '', v.descricao || '', v.artigo || '']);
        });
        aba16.push([]);
      }

      // Hipóteses "não declarada"
      if (LR.compensacaoPERDCOMP && LR.compensacaoPERDCOMP.hipotesesNaoDeclarada) {
        aba16.push(['HIPÓTESES DE "NÃO DECLARADA" (§12 do Art. 74)']);
        aba16.push(['Hipótese', 'Descrição', 'Artigo']);
        LR.compensacaoPERDCOMP.hipotesesNaoDeclarada.forEach(function (h) {
          aba16.push([h.id || '', h.descricao || '', h.artigo || '']);
        });
        aba16.push([]);
      }

      // Multa compensação indevida
      if (LR.compensacaoPERDCOMP && LR.compensacaoPERDCOMP.multaCompensacaoIndevida) {
        aba16.push(['Multa compensação indevida', pv(LR.compensacaoPERDCOMP.multaCompensacaoIndevida.percentual || 0.50), LR.compensacaoPERDCOMP.multaCompensacaoIndevida.artigo || '§17']);
      }

      // Análise calculada
      if (r.compensacaoPERDCOMP) {
        var pdcXls = r.compensacaoPERDCOMP;
        aba16.push([]);
        aba16.push(['ANÁLISE DA COMPENSAÇÃO']);
        aba16.push(['Compensação Permitida?', pdcXls.compensacaoPermitida ? 'SIM' : 'NÃO']);
        if (pdcXls.vedacoes && pdcXls.vedacoes.length > 0) {
          aba16.push(['Vedações Identificadas', pdcXls.vedacoes.join(', ')]);
        }
        if (pdcXls.hipotesesNaoDeclarada && pdcXls.hipotesesNaoDeclarada.length > 0) {
          aba16.push(['Risco "Não Declarada"', pdcXls.hipotesesNaoDeclarada.join(', ')]);
        }
        if (pdcXls.riscoMulta50 && pdcXls.riscoMulta50.aplicavel) {
          aba16.push(['Risco Multa 50%', mv(pdcXls.riscoMulta50.valor || 0)]);
        }
        if (pdcXls.impactoLucroReal) {
          if ((pdcXls.impactoLucroReal.reducaoIRPJ || 0) > 0) aba16.push(['Redução IRPJ', mv(pdcXls.impactoLucroReal.reducaoIRPJ)]);
          if ((pdcXls.impactoLucroReal.reducaoCSLL || 0) > 0) aba16.push(['Redução CSLL', mv(pdcXls.impactoLucroReal.reducaoCSLL)]);
        }
      }

      // Cronograma judicial
      if (r.compensacaoJudicial && r.compensacaoJudicial.sujeito) {
        var cjXls = r.compensacaoJudicial;
        aba16.push([]);
        aba16.push(['COMPENSAÇÃO JUDICIAL (Art. 74-A, Lei 14.873/2024)']);
        aba16.push(['Limite Mensal', mv(cjXls.limiteMensal || 0)]);
        aba16.push(['Prazo Total', (cjXls.prazoTotal || 60) + ' meses']);
        if (cjXls.cronograma && cjXls.cronograma.length > 0) {
          aba16.push([]);
          aba16.push(['Mês', 'Compensação', 'Saldo Remanescente']);
          cjXls.cronograma.forEach(function (p) {
            aba16.push([p.mes || p.parcela || '', mv(p.valor || p.compensacao || 0), mv(p.saldo || p.saldoRemanescente || 0)]);
          });
        }
      }

      addSheet('PER-DCOMP', aba16, [25, 40, 20]);
    }


    // ═════════════════════════════════════════════════════
    //  SALVAR ARQUIVO
    // ═════════════════════════════════════════════════════

    try {
      var filename = 'estudo-lucro-real-' + (d.razaoSocial || 'empresa').replace(/[^a-zA-Z0-9]/g, '-').substring(0, 40) + '-' + _dataCurta() + '.xlsx';
      XLSX.writeFile(wb, filename);
    } catch (err) {
      console.error('Erro Excel:', err);
      alert('Erro ao gerar Excel. Veja o console.');
    }

    hideLoading();
  }


  // ═══════════════════════════════════════════════════════════════════════════
  //  EXPORT PÚBLICO
  // ═══════════════════════════════════════════════════════════════════════════



  // ═══════════════════════════════════════════════════════════════════════════
  //  EXPORT PÚBLICO (Wizard + Motor + Exportação PDF/Excel)
  // ═══════════════════════════════════════════════════════════════════════════

  window.LucroRealEstudos = {
    VERSAO: VERSAO,
    init: init,
    nextStep: nextStep,
    prevStep: prevStep,
    goToStep: goToStep,
    analisar: analisar,
    voltarWizard: voltarWizard,
    saveField: saveField,
    saveMoney: saveMoney,
    onMunicipioChanged: onMunicipioChanged,
    preencherExemplo: preencherExemplo,
    novoEstudo: novoEstudo,
    getDados: function () { return dadosEmpresa; },
    getResultados: function () { return resultadosCache; },
    exportarJSON: exportarJSON,
    imprimir: imprimir,
    // ── Exportação PDF / Excel (integrado) ──
    pdfSimplificado: pdfSimplificado,
    pdfCompleto: pdfCompleto,
    exportarExcel: exportarExcel
  };

  // Aliases globais para compatibilidade com onclick nos botões do relatório
  window.IMPOSTExport = {
    pdfSimplificado: pdfSimplificado,
    pdfCompleto: pdfCompleto,
    exportarExcel: exportarExcel
  };
  window.pdfSimplificado = pdfSimplificado;
  window.pdfCompleto = pdfCompleto;
  window.exportarExcel = exportarExcel;

  document.addEventListener("DOMContentLoaded", init);
})();
