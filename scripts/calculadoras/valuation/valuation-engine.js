// ============================================================================
// valuation-engine.js — Motor de Precificação de Empresas (Unificado)
// Versão 2.0.0 — Self-contained
// ============================================================================
// Integra 6 módulos: Core, Indicadores, DCF, Múltiplos, Patrimonial,
//                     Comparativo.
// Exporta: ValuationEngine (browser) / module.exports (Node.js)
// ============================================================================

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.ValuationEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';


  // ╔═══════════════════════════════════════════════════════════════════════════╗
  // ║  MÓDULO 1/6 — CORE                                                      ║
  // ║  Constantes, Glossário, Utilitários, DRE, Balanço, Histórico,            ║
  // ║  Orquestração (executarPrecificacao, executarDemonstracao)                ║
  // ╚═══════════════════════════════════════════════════════════════════════════╝


  var VERSION = '2.0.0';

  // ═══════════════════════════════════════════════════════════════════════════
  // GLOSSÁRIO — 44 termos financeiros explicados
  // ═══════════════════════════════════════════════════════════════════════════

  var GLOSSARIO = {
    "DRE": {
      sigla: "DRE", nome: "Demonstração do Resultado do Exercício",
      explicacao: "Relatório contábil que mostra todas as receitas e despesas da empresa em um período (geralmente 1 ano). Começa com a receita bruta e vai subtraindo custos até chegar ao lucro líquido."
    },
    "EBIT": {
      sigla: "EBIT", nome: "Earnings Before Interest and Taxes",
      explicacao: "Lucro Antes de Juros e Impostos. Mostra quanto a empresa ganha com sua operação principal, sem considerar financiamento ou tributação."
    },
    "EBITDA": {
      sigla: "EBITDA", nome: "Earnings Before Interest, Taxes, Depreciation and Amortization",
      explicacao: "Lucro antes de Juros, Impostos, Depreciação e Amortização. Mede a geração de caixa operacional. É o indicador mais usado para comparar empresas."
    },
    "NOPAT": {
      sigla: "NOPAT", nome: "Net Operating Profit After Tax",
      explicacao: "Lucro Operacional Líquido Após Impostos. EBIT menos impostos sobre o resultado operacional."
    },
    "FCF": {
      sigla: "FCF", nome: "Free Cash Flow (Fluxo de Caixa Livre)",
      explicacao: "Caixa disponível após custos operacionais e investimentos. FCF = NOPAT + D&A - CAPEX - ΔCapital de Giro."
    },
    "FCFF": {
      sigla: "FCFF", nome: "Free Cash Flow to Firm",
      explicacao: "Fluxo de Caixa Livre para a Firma. Disponível para todos os financiadores (donos e credores)."
    },
    "DCF": {
      sigla: "DCF", nome: "Discounted Cash Flow",
      explicacao: "Método que estima o valor de uma empresa somando todo o dinheiro futuro trazido a valor presente."
    },
    "EV": {
      sigla: "EV", nome: "Enterprise Value (Valor da Firma)",
      explicacao: "Valor total da empresa: Equity + Dívida Líquida. É o preço de compra total da firma."
    },
    "Equity Value": {
      sigla: "Equity Value", nome: "Valor do Capital Próprio",
      explicacao: "Valor que pertence aos sócios. EV menos dívida líquida."
    },
    "Valor Terminal": {
      sigla: "TV", nome: "Terminal Value",
      explicacao: "Valor da empresa após o período de projeção, assumindo crescimento perpétuo estável. Geralmente 60-80% do valor total no DCF."
    },
    "VP": {
      sigla: "VP", nome: "Valor Presente",
      explicacao: "Quanto vale hoje um valor futuro, descontado pelo custo de oportunidade."
    },
    "WACC": {
      sigla: "WACC", nome: "Weighted Average Cost of Capital",
      explicacao: "Custo Médio Ponderado de Capital. Taxa mínima de retorno exigida. Combina custo do equity (Ke) e custo da dívida (Kd). Usada para descontar fluxos no DCF."
    },
    "CAPM": {
      sigla: "CAPM", nome: "Capital Asset Pricing Model",
      explicacao: "Modelo para calcular o retorno mínimo exigido: Ke = Rf + β × (Rm - Rf) + Risco País."
    },
    "Ke": {
      sigla: "Ke", nome: "Custo do Capital Próprio",
      explicacao: "Retorno que os sócios esperam pelo risco de investir. Calculado pelo CAPM."
    },
    "Kd": {
      sigla: "Kd", nome: "Custo da Dívida",
      explicacao: "Taxa de juros média paga nos empréstimos e financiamentos."
    },
    "Beta": {
      sigla: "\u03B2", nome: "Beta (Risco Setorial)",
      explicacao: "Volatilidade do setor vs mercado. β=1.0 = risco igual ao mercado. β>1.0 = mais arriscado."
    },
    "Taxa Livre de Risco": {
      sigla: "Rf", nome: "Risk-Free Rate",
      explicacao: "Retorno de investimento sem risco (Tesouro Selic). No Brasil, entre 10-13% a.a."
    },
    "Prêmio de Risco": {
      sigla: "Rm - Rf", nome: "Prêmio de Risco de Mercado",
      explicacao: "Retorno extra exigido para investir em ações vs títulos do governo. Brasil: 5-7%."
    },
    "Risco País": {
      sigla: "CRP", nome: "Country Risk Premium",
      explicacao: "Prêmio adicional por investir em país emergente. Brasil: 2-4%."
    },
    "CAPEX": {
      sigla: "CAPEX", nome: "Capital Expenditure",
      explicacao: "Investimento em bens duráveis: equipamentos, veículos, imóveis, tecnologia."
    },
    "Capital de Giro": {
      sigla: "WC", nome: "Working Capital",
      explicacao: "Recursos para operação diária. Ativo Circulante - Passivo Circulante operacional."
    },
    "Dívida Líquida": {
      sigla: "DL", nome: "Dívida Líquida",
      explicacao: "Total de dívidas bancárias menos caixa disponível. Negativa = mais caixa que dívida."
    },
    "Depreciação": {
      sigla: "D&A", nome: "Depreciação e Amortização",
      explicacao: "Perda de valor dos bens ao longo do tempo. Não é saída real de caixa."
    },
    "EV/EBITDA": {
      sigla: "EV/EBITDA", nome: "Enterprise Value sobre EBITDA",
      explicacao: "Quantos anos de EBITDA para pagar o valor da empresa. Quanto menor, mais barata."
    },
    "P/L": {
      sigla: "P/L", nome: "Preço sobre Lucro",
      explicacao: "Quantas vezes o lucro anual o mercado paga pela empresa."
    },
    "EV/Receita": {
      sigla: "EV/Receita", nome: "Enterprise Value sobre Receita",
      explicacao: "Compara valor da firma com faturamento. Útil para empresas sem lucro."
    },
    "P/VPA": {
      sigla: "P/VPA", nome: "Preço sobre Valor Patrimonial",
      explicacao: "Compara preço de mercado com valor contábil. Abaixo de 1.0× pode indicar subvalorização."
    },
    "Ativo Circulante": {
      sigla: "AC", nome: "Ativo Circulante",
      explicacao: "Bens conversíveis em dinheiro em até 12 meses: caixa, recebíveis, estoques."
    },
    "Ativo Não Circulante": {
      sigla: "ANC", nome: "Ativo Não Circulante",
      explicacao: "Bens de longo prazo: imóveis, máquinas, equipamentos, investimentos."
    },
    "Passivo": {
      sigla: "PC + PNC", nome: "Passivo (Obrigações)",
      explicacao: "Tudo que a empresa deve: fornecedores, salários, impostos, empréstimos."
    },
    "Patrimônio Líquido": {
      sigla: "PL", nome: "Patrimônio Líquido",
      explicacao: "Ativos menos Passivos. O que sobra para os sócios."
    },
    "Intangíveis": {
      sigla: "AI", nome: "Ativos Intangíveis",
      explicacao: "Bens sem forma física: marca, carteira de clientes, contratos, licenças, know-how."
    },
    "Goodwill": {
      sigla: "GW", nome: "Goodwill (Ágio)",
      explicacao: "Valor pago acima do PL contábil, baseado em reputação e expectativa de lucros futuros."
    },
    "PDD": {
      sigla: "PDD", nome: "Provisão para Devedores Duvidosos",
      explicacao: "Percentual dos recebíveis que provavelmente não será pago (inadimplência)."
    },
    "Perpetuidade": {
      sigla: "g", nome: "Taxa de Crescimento na Perpetuidade",
      explicacao: "Crescimento constante após projeção. Deve ser menor que o PIB. Conservador: 2-3%."
    },
    "Sensibilidade": {
      sigla: "—", nome: "Análise de Sensibilidade",
      explicacao: "Tabela que mostra como o valor muda ao variar WACC e crescimento."
    },
    "Football Field": {
      sigla: "—", nome: "Football Field Chart",
      explicacao: "Gráfico que compara faixas de valor dos diferentes métodos lado a lado."
    },
    "Iliquidez": {
      sigla: "DLOM", nome: "Discount for Lack of Marketability",
      explicacao: "Desconto para empresas de capital fechado (15-25%) por dificuldade de venda."
    },
    "Simples Nacional": {
      sigla: "SN", nome: "Regime Tributário Simples Nacional",
      explicacao: "Regime simplificado para micro e pequenas empresas. Alíquota 6-15%. Limite: R$ 4,8M/ano."
    },
    "Lucro Presumido": {
      sigla: "LP", nome: "Regime de Lucro Presumido",
      explicacao: "Regime com lucro presumido sobre receita. Alíquota efetiva 11-17%. Até R$ 78M/ano."
    },
    "Lucro Real": {
      sigla: "LR", nome: "Regime de Lucro Real",
      explicacao: "Impostos sobre lucro efetivo. ~34% (IRPJ+CSLL). Obrigatório acima de R$ 78M/ano."
    },
    "Balanço Patrimonial": {
      sigla: "BP", nome: "Balanço Patrimonial",
      explicacao: "Foto da saúde financeira: o que a empresa tem (ativos) e deve (passivos) numa data."
    },
    "Margem EBITDA": {
      sigla: "—", nome: "Margem EBITDA",
      explicacao: "EBITDA / Receita. Percentual da receita que vira caixa operacional."
    },
    "Alíquota Efetiva": {
      sigla: "t", nome: "Alíquota Efetiva de Impostos",
      explicacao: "Percentual real de impostos. Simples: 6-15%, Presumido: 11-17%, Real: ~34%."
    }
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // CONSTANTES — Setores (fonte única de verdade)
  // ═══════════════════════════════════════════════════════════════════════════

  var SETORES_KEYS = [
    "agronegocio", "tecnologia", "varejo", "servicos", "saude",
    "construcao", "industria", "alimentacao", "educacao", "transporte",
    "energia", "financeiro", "imobiliario", "telecomunicacoes", "meioambiente"
  ];

  var SETORES_LABEL = {
    "agronegocio":      "Agronegócio",
    "tecnologia":       "Tecnologia / SaaS",
    "varejo":           "Varejo",
    "servicos":         "Serviços / Consultoria",
    "saude":            "Saúde",
    "construcao":       "Construção Civil",
    "industria":        "Indústria / Manufatura",
    "alimentacao":      "Alimentação",
    "educacao":         "Educação",
    "transporte":       "Transporte / Logística",
    "energia":          "Energia",
    "financeiro":       "Financeiro",
    "imobiliario":      "Imobiliário",
    "telecomunicacoes": "Telecomunicações",
    "meioambiente":     "Meio Ambiente / Sustentabilidade"
  };

  var PORTES = {
    "micro":   { label: "Micro (até R$ 360 mil/ano)",           desconto: 0.20 },
    "pequena": { label: "Pequena (até R$ 4,8 milhões/ano)",     desconto: 0.15 },
    "media":   { label: "Média (até R$ 300 milhões/ano)",       desconto: 0.05 },
    "grande":  { label: "Grande (acima de R$ 300 milhões/ano)", desconto: 0.00 }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSTANTES — Betas setoriais (Damodaran, ajustados Brasil)
  // ═══════════════════════════════════════════════════════════════════════════

  var BETAS_SETORIAIS = {
    "agronegocio":      0.75,
    "tecnologia":       1.20,
    "varejo":           0.95,
    "servicos":         0.85,
    "saude":            0.90,
    "construcao":       1.10,
    "industria":        1.00,
    "alimentacao":      0.80,
    "educacao":         0.85,
    "transporte":       1.05,
    "energia":          0.70,
    "financeiro":       1.15,
    "imobiliario":      0.90,
    "telecomunicacoes": 0.80,
    "meioambiente":     0.85
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSTANTES — WACC e Regime Tributário
  // ═══════════════════════════════════════════════════════════════════════════

  var WACC_SUGERIDO = {
    "micro":   { min: 0.18, sugerido: 0.22, max: 0.25 },
    "pequena": { min: 0.15, sugerido: 0.18, max: 0.22 },
    "media":   { min: 0.12, sugerido: 0.14, max: 0.16 },
    "grande":  { min: 0.08, sugerido: 0.10, max: 0.12 }
  };

  var TAXA_PERPETUA_LIMITES = {
    conservador: { min: 0.02, max: 0.04 },
    moderado:    { min: 0.04, max: 0.06 },
    absolutoMax: 0.06
  };

  var ALIQUOTAS_REGIME = {
    "simples":   { label: "Simples Nacional",  faixa: "6% a 15%",  tipica: 0.10 },
    "presumido": { label: "Lucro Presumido",   faixa: "11% a 17%", tipica: 0.14 },
    "real":      { label: "Lucro Real",         faixa: "~34%",      tipica: 0.34 }
  };

  var DESCONTOS_ILIQUIDEZ = {
    "aberto":  0.00,
    "fechado": 0.20
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // FUNÇÕES UTILITÁRIAS
  // ═══════════════════════════════════════════════════════════════════════════

  function arredondar(valor, casas) {
    if (casas === undefined) casas = 2;
    if (!isFinite(valor)) return 0;
    var fator = Math.pow(10, casas);
    return Math.round(valor * fator) / fator;
  }

  function dividirSeguro(numerador, denominador) {
    if (denominador === 0 || !isFinite(denominador) || !isFinite(numerador)) return 0;
    return numerador / denominador;
  }

  function validarNumero(valor, padrao) {
    if (padrao === undefined) padrao = 0;
    if (valor === null || valor === undefined || !isFinite(valor)) return padrao;
    return Number(valor);
  }

  function clonarObjeto(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    return JSON.parse(JSON.stringify(obj));
  }

  function formatarMoeda(valor) {
    if (valor === null || valor === undefined || !isFinite(valor)) return 'R$ 0,00';
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function formatarMoedaCurta(valor) {
    if (!isFinite(valor) || valor === 0) return 'R$ 0';
    var abs = Math.abs(valor);
    var sinal = valor < 0 ? '-' : '';
    if (abs >= 1e9) return sinal + 'R$ ' + (abs / 1e9).toFixed(1) + 'B';
    if (abs >= 1e6) return sinal + 'R$ ' + (abs / 1e6).toFixed(1) + 'M';
    if (abs >= 1e3) return sinal + 'R$ ' + (abs / 1e3).toFixed(0) + ' mil';
    return sinal + 'R$ ' + abs.toFixed(0);
  }

  function formatarPct(valor) {
    if (!isFinite(valor)) return '0,0%';
    return (valor * 100).toFixed(1).replace('.', ',') + '%';
  }

  function hoje() {
    return new Date().toISOString().slice(0, 10);
  }

  function obterBetaSetor(setor) {
    return BETAS_SETORIAIS[setor] || BETAS_SETORIAIS["servicos"];
  }

  function sugerirWACC(porte) {
    return WACC_SUGERIDO[porte] || WACC_SUGERIDO["pequena"];
  }

  function obterDescontoPorte(porte) {
    return (PORTES[porte] || PORTES["pequena"]).desconto;
  }

  function obterDescontoIliquidez(tipoCapital) {
    return DESCONTOS_ILIQUIDEZ[tipoCapital] !== undefined
      ? DESCONTOS_ILIQUIDEZ[tipoCapital]
      : DESCONTOS_ILIQUIDEZ["fechado"];
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // DRE — Demonstração do Resultado do Exercício
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Cria uma DRE completa a partir de inputs primários.
   * Campos derivados são calculados automaticamente.
   *
   * @param {Object} inputs
   *   - receitaBruta {number}           (obrigatório)
   *   - deducoesReceita {number}        (ou deducoesPercentual: 0-1)
   *   - cmv {number}                    (ou margemBruta: 0-1 sobre receitaLiquida)
   *   - despesasAdministrativas {number}
   *   - despesasComerciais {number}
   *   - despesasGerais {number}
   *   - outrasReceitasDespesas {number}  (positivo = receita, negativo = despesa)
   *   - depreciacaoAmortizacao {number}
   *   - resultadoFinanceiro {number}    (ou despesasFinanceiras + receitasFinanceiras)
   *   - irCsll {number}                 (ou aliquotaEfetiva: 0-1)
   * @returns {Object} DRE completa com todos os campos derivados
   */
  function criarDRE(inputs) {
    if (!inputs || !inputs.receitaBruta) {
      return { erro: true, mensagem: 'receitaBruta é obrigatório', valido: false };
    }

    var rb = validarNumero(inputs.receitaBruta);

    // Deduções da receita (impostos sobre vendas: ISS, ICMS, PIS, COFINS)
    var deducoes;
    if (inputs.deducoesReceita !== undefined) {
      deducoes = validarNumero(inputs.deducoesReceita);
    } else if (inputs.deducoesPercentual !== undefined) {
      deducoes = rb * validarNumero(inputs.deducoesPercentual);
    } else {
      deducoes = 0;
    }

    var rl = rb - deducoes;

    // CMV / Custo das Mercadorias Vendidas
    var cmv;
    if (inputs.cmv !== undefined) {
      cmv = validarNumero(inputs.cmv);
    } else if (inputs.margemBruta !== undefined) {
      cmv = rl * (1 - validarNumero(inputs.margemBruta));
    } else {
      cmv = 0;
    }

    var lucroBruto = rl - cmv;

    // Despesas operacionais
    var despAdm = validarNumero(inputs.despesasAdministrativas);
    var despCom = validarNumero(inputs.despesasComerciais);
    var despGer = validarNumero(inputs.despesasGerais);
    var totalDespOp = despAdm + despCom + despGer;

    // Outras receitas/despesas operacionais
    var outrasRD = validarNumero(inputs.outrasReceitasDespesas);

    // Depreciação e Amortização
    var da = validarNumero(inputs.depreciacaoAmortizacao);

    // EBIT = Lucro Bruto - Despesas Operacionais + Outras Receitas/Despesas - D&A
    var ebit = lucroBruto - totalDespOp + outrasRD - da;

    // EBITDA = EBIT + D&A (add-back de item não-caixa)
    var ebitda = ebit + da;

    // Resultado financeiro
    var resultadoFinanceiro;
    if (inputs.resultadoFinanceiro !== undefined) {
      resultadoFinanceiro = validarNumero(inputs.resultadoFinanceiro);
    } else {
      var recFin = validarNumero(inputs.receitasFinanceiras);
      var despFin = validarNumero(inputs.despesasFinanceiras);
      resultadoFinanceiro = recFin - despFin;
    }

    var despesasFinanceiras = validarNumero(inputs.despesasFinanceiras);
    if (despesasFinanceiras === 0 && resultadoFinanceiro < 0) {
      despesasFinanceiras = Math.abs(resultadoFinanceiro);
    }

    // LAIR
    var lair = ebit + resultadoFinanceiro;

    // IR/CSLL
    var ircsll;
    var aliquotaEfetiva;
    if (inputs.irCsll !== undefined) {
      ircsll = validarNumero(inputs.irCsll);
      aliquotaEfetiva = lair > 0 ? dividirSeguro(ircsll, lair) : 0;
    } else if (inputs.aliquotaEfetiva !== undefined) {
      aliquotaEfetiva = validarNumero(inputs.aliquotaEfetiva);
      ircsll = Math.max(0, lair * aliquotaEfetiva);
    } else {
      aliquotaEfetiva = 0.34;
      ircsll = Math.max(0, lair * aliquotaEfetiva);
    }

    // Lucro Líquido
    var lucroLiquido = lair - ircsll;

    // NOPAT
    var nopat = ebit * (1 - aliquotaEfetiva);

    // Margens
    var margemBruta     = dividirSeguro(lucroBruto, rl);
    var margemEBIT      = dividirSeguro(ebit, rl);
    var margemEBITDA    = dividirSeguro(ebitda, rl);
    var margemLiquida   = dividirSeguro(lucroLiquido, rl);

    return {
      valido: true,
      receitaBruta: rb,
      deducoesReceita: deducoes,
      receitaLiquida: rl,
      cmv: cmv,
      lucroBruto: lucroBruto,
      despesasAdministrativas: despAdm,
      despesasComerciais: despCom,
      despesasGerais: despGer,
      totalDespesasOperacionais: totalDespOp,
      outrasReceitasDespesas: outrasRD,
      ebit: ebit,
      depreciacaoAmortizacao: da,
      ebitda: ebitda,
      resultadoFinanceiro: resultadoFinanceiro,
      despesasFinanceiras: despesasFinanceiras,
      lair: lair,
      irCsll: ircsll,
      aliquotaEfetiva: aliquotaEfetiva,
      lucroLiquido: lucroLiquido,
      nopat: nopat,
      margemBruta: margemBruta,
      margemEBIT: margemEBIT,
      margemEBITDA: margemEBITDA,
      margemLiquida: margemLiquida
    };
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // BALANÇO PATRIMONIAL
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Cria um Balanço Patrimonial completo a partir de inputs.
   * Valida que Ativo = Passivo + PL (com tolerância).
   *
   * @param {Object} inputs
   *   Ativo Circulante:
   *     - caixa, aplicacoesFinanceiras, contasReceber, estoques, outrosCirculantes
   *   Ativo Não Circulante:
   *     - imobilizado, intangivel, investimentos, outrosNaoCirculantes
   *     - imobilizadoValorMercado, veiculos, veiculosValorMercado, maquinas, maquinasValorMercado
   *   Passivo Circulante:
   *     - fornecedores, emprestimosCP, salarios, impostos, outrosPassivosCirculantes
   *   Passivo Não Circulante:
   *     - emprestimosLP, provisoes, outrosPassivosNaoCirculantes
   *   - patrimonioLiquido
   *   Intangíveis detalhados:
   *     - marca, carteiraClientes, contratos, licencas, knowHow, goodwill
   * @returns {Object} Balanço completo com totais e validação
   */
  function criarBalanco(inputs) {
    if (!inputs) {
      return { erro: true, mensagem: 'inputs é obrigatório', valido: false };
    }

    // Ativo Circulante
    var caixa           = validarNumero(inputs.caixa);
    var aplicacoes      = validarNumero(inputs.aplicacoesFinanceiras);
    var contasReceber   = validarNumero(inputs.contasReceber);
    var estoques        = validarNumero(inputs.estoques);
    var outrosAC        = validarNumero(inputs.outrosCirculantes);
    var totalAC = caixa + aplicacoes + contasReceber + estoques + outrosAC;

    // Ativo Não Circulante
    var imobilizado     = validarNumero(inputs.imobilizado);
    var intangivel      = validarNumero(inputs.intangivel);
    var investimentos   = validarNumero(inputs.investimentos);
    var outrosANC       = validarNumero(inputs.outrosNaoCirculantes);
    var veiculos        = validarNumero(inputs.veiculos);
    var maquinas        = validarNumero(inputs.maquinas);
    var totalANC = imobilizado + intangivel + investimentos + outrosANC + veiculos + maquinas;

    var totalAtivo = totalAC + totalANC;

    // Passivo Circulante
    var fornecedores    = validarNumero(inputs.fornecedores);
    var emprestimosCP   = validarNumero(inputs.emprestimosCP);
    var salarios        = validarNumero(inputs.salarios);
    var impostos        = validarNumero(inputs.impostos);
    var outrosPC        = validarNumero(inputs.outrosPassivosCirculantes);
    var totalPC = fornecedores + emprestimosCP + salarios + impostos + outrosPC;

    // Passivo Não Circulante
    var emprestimosLP   = validarNumero(inputs.emprestimosLP);
    var provisoes       = validarNumero(inputs.provisoes);
    var outrosPNC       = validarNumero(inputs.outrosPassivosNaoCirculantes);
    var totalPNC = emprestimosLP + provisoes + outrosPNC;

    var totalPassivo = totalPC + totalPNC;

    // Patrimônio Líquido
    var pl = validarNumero(inputs.patrimonioLiquido);

    // Validação: Ativo = Passivo + PL
    var somaPassivoPL = totalPassivo + pl;
    var diferencaAP = totalAtivo - somaPassivoPL;
    var tolerancia = Math.max(totalAtivo, somaPassivoPL) * 0.01; // 1%
    var balanceado = Math.abs(diferencaAP) <= tolerancia;

    // Métricas derivadas
    var dividaBruta = emprestimosCP + emprestimosLP;
    var dividaLiquida = dividaBruta - caixa - aplicacoes;
    var capitalDeGiro = totalAC - totalPC;

    // Intangíveis detalhados
    var marca           = validarNumero(inputs.marca);
    var carteiraClientes = validarNumero(inputs.carteiraClientes);
    var contratosInt    = validarNumero(inputs.contratos);
    var licencas        = validarNumero(inputs.licencas);
    var knowHow         = validarNumero(inputs.knowHow);
    var goodwill        = validarNumero(inputs.goodwill);
    var totalIntangiveis = marca + carteiraClientes + contratosInt + licencas + knowHow + goodwill;
    // Se detalhados foram preenchidos, prevalecem sobre o total genérico
    if (totalIntangiveis > 0 && totalIntangiveis > intangivel) {
      var diffIntang = totalIntangiveis - intangivel;
      intangivel = totalIntangiveis;
      totalANC += diffIntang;
      totalAtivo += diffIntang;
    }

    // Valores de mercado (se informados)
    var imobilizadoVM   = validarNumero(inputs.imobilizadoValorMercado, imobilizado);
    var veiculosVM      = validarNumero(inputs.veiculosValorMercado, veiculos);
    var maquinasVM      = validarNumero(inputs.maquinasValorMercado, maquinas);

    // PDD e obsolescência
    var inadimplencia   = validarNumero(inputs.inadimplencia, 0.05);
    var obsolescencia   = validarNumero(inputs.obsolescencia, 0.10);

    return {
      valido: true,
      balanceado: balanceado,
      diferencaAP: arredondar(diferencaAP),
      ativo: {
        circulante: {
          caixa: caixa,
          aplicacoesFinanceiras: aplicacoes,
          contasReceber: contasReceber,
          estoques: estoques,
          outrosCirculantes: outrosAC,
          totalCirculante: totalAC
        },
        naoCirculante: {
          imobilizado: imobilizado,
          imobilizadoValorMercado: imobilizadoVM,
          veiculos: veiculos,
          veiculosValorMercado: veiculosVM,
          maquinas: maquinas,
          maquinasValorMercado: maquinasVM,
          intangivel: intangivel,
          investimentos: investimentos,
          outrosNaoCirculantes: outrosANC,
          totalNaoCirculante: totalANC
        },
        totalAtivo: totalAtivo
      },
      passivo: {
        circulante: {
          fornecedores: fornecedores,
          emprestimosCP: emprestimosCP,
          salarios: salarios,
          impostos: impostos,
          outrosPassivosCirculantes: outrosPC,
          totalCirculante: totalPC
        },
        naoCirculante: {
          emprestimosLP: emprestimosLP,
          provisoes: provisoes,
          outrosPassivosNaoCirculantes: outrosPNC,
          totalNaoCirculante: totalPNC
        },
        totalPassivo: totalPassivo
      },
      patrimonioLiquido: pl,
      intangiveis: {
        marca: marca,
        carteiraClientes: carteiraClientes,
        contratos: contratosInt,
        licencas: licencas,
        knowHow: knowHow,
        goodwill: goodwill,
        total: totalIntangiveis
      },
      dividaBruta: dividaBruta,
      dividaLiquida: dividaLiquida,
      capitalDeGiro: capitalDeGiro,
      inadimplencia: inadimplencia,
      obsolescencia: obsolescencia
    };
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // INPUT MAPPER — DRE/Balanço → inputs de cada módulo
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Mapeia DRE + Balanço + Premissas para os inputs de cada método.
   *
   * @param {Object} dre       - Resultado de criarDRE()
   * @param {Object} balanco   - Resultado de criarBalanco()
   * @param {Object} premissas - Premissas adicionais do usuário
   *   - nomeEmpresa, setor, porte, tipoCapital
   *   - horizonteAnos, taxaCrescimento, taxaPerpetua
   *   - capex, variacaoCapitalGiro
   *   - waccManual ou waccAssistido: { taxaLivreRisco, premioRiscoMercado, ... }
   *   - anosOperacao
   * @returns {Object} { dcf, multiplos, patrimonial, premissas }
   */
  function mapearInputsDRE(dre, balanco, premissas) {
    if (!dre || !dre.valido) {
      return { erro: true, mensagem: 'DRE inválida' };
    }
    if (!balanco || !balanco.valido) {
      return { erro: true, mensagem: 'Balanço inválido' };
    }

    var p = premissas || {};
    var setor = p.setor || 'servicos';
    var porte = p.porte || 'pequena';
    var tipoCapital = p.tipoCapital || 'fechado';

    // DCF inputs
    var dcfInputs = {
      nomeEmpresa: p.nomeEmpresa || '',
      setor: setor,
      porte: porte,
      receita: dre.receitaLiquida,
      custos: dre.cmv + dre.totalDespesasOperacionais + dre.depreciacaoAmortizacao,
      depreciacaoAmortizacao: dre.depreciacaoAmortizacao,
      aliquotaImposto: dre.aliquotaEfetiva,
      capex: validarNumero(p.capex, dre.depreciacaoAmortizacao),
      variacaoCapitalGiro: validarNumero(p.variacaoCapitalGiro, 0),
      dividaLiquida: balanco.dividaLiquida,
      horizonteAnos: validarNumero(p.horizonteAnos, 5),
      taxaCrescimento: validarNumero(p.taxaCrescimento, 0.05),
      taxaPerpetua: validarNumero(p.taxaPerpetua, 0.03),
      tipoCapital: tipoCapital
    };

    // WACC
    if (p.waccManual) {
      dcfInputs.waccManual = p.waccManual;
    } else if (p.waccAssistido) {
      dcfInputs.waccAssistido = p.waccAssistido;
    }

    // Premissas de projeção por fases
    if (p.fases) {
      dcfInputs.fases = p.fases;
    }

    // Múltiplos inputs
    var multiplosInputs = {
      nomeEmpresa: p.nomeEmpresa || '',
      setor: setor,
      porte: porte,
      tipoCapital: tipoCapital,
      receita: dre.receitaLiquida,
      ebitda: dre.ebitda,
      ebit: dre.ebit,
      lucroLiquido: dre.lucroLiquido,
      fcf: dre.nopat + dre.depreciacaoAmortizacao
        - validarNumero(p.capex, dre.depreciacaoAmortizacao)
        - validarNumero(p.variacaoCapitalGiro, 0),
      patrimonioLiquido: balanco.patrimonioLiquido,
      dividaLiquida: balanco.dividaLiquida,
      depreciacaoAmortizacao: dre.depreciacaoAmortizacao
    };

    if (p.multiplosCustom) {
      multiplosInputs.multiplosCustom = p.multiplosCustom;
    }
    if (p.pesosMetodos) {
      multiplosInputs.pesosMetodos = p.pesosMetodos;
    }

    // Patrimonial inputs
    var patrimonialInputs = {
      nomeEmpresa: p.nomeEmpresa || '',
      setor: setor,
      anosOperacao: validarNumero(p.anosOperacao, 5),
      caixa: balanco.ativo.circulante.caixa,
      aplicacoesFinanceiras: balanco.ativo.circulante.aplicacoesFinanceiras,
      contasReceber: balanco.ativo.circulante.contasReceber,
      inadimplencia: balanco.inadimplencia,
      estoques: balanco.ativo.circulante.estoques,
      obsolescencia: balanco.obsolescencia,
      outrosCirculantes: balanco.ativo.circulante.outrosCirculantes,
      imoveis: balanco.ativo.naoCirculante.imobilizado,
      imoveisValorMercado: balanco.ativo.naoCirculante.imobilizadoValorMercado,
      veiculos: balanco.ativo.naoCirculante.veiculos,
      veiculosValorMercado: balanco.ativo.naoCirculante.veiculosValorMercado,
      maquinas: balanco.ativo.naoCirculante.maquinas,
      maquinasValorMercado: balanco.ativo.naoCirculante.maquinasValorMercado,
      investimentos: balanco.ativo.naoCirculante.investimentos,
      outrosNaoCirculantes: balanco.ativo.naoCirculante.outrosNaoCirculantes,
      fornecedores: balanco.passivo.circulante.fornecedores,
      salarios: balanco.passivo.circulante.salarios,
      impostos: balanco.passivo.circulante.impostos,
      emprestimosCP: balanco.passivo.circulante.emprestimosCP,
      outrosPassivosCirculantes: balanco.passivo.circulante.outrosPassivosCirculantes,
      emprestimosLP: balanco.passivo.naoCirculante.emprestimosLP,
      provisoes: balanco.passivo.naoCirculante.provisoes,
      processosJudiciais: validarNumero(p.processosJudiciais),
      outrosPassivosNaoCirculantes: balanco.passivo.naoCirculante.outrosPassivosNaoCirculantes,
      marca: balanco.intangiveis.marca,
      carteiraClientes: balanco.intangiveis.carteiraClientes,
      contratos: balanco.intangiveis.contratos,
      licencas: balanco.intangiveis.licencas,
      knowHow: balanco.intangiveis.knowHow,
      goodwill: balanco.intangiveis.goodwill
    };

    // Contingências
    if (p.contingencias) {
      patrimonialInputs.contingencias = p.contingencias;
    }

    // VRD
    if (p.vrd) {
      patrimonialInputs.vrd = p.vrd;
    }

    // Intangíveis por fluxo
    if (p.taxaRetornoNormal !== undefined) {
      patrimonialInputs.taxaRetornoNormal = p.taxaRetornoNormal;
      patrimonialInputs.lucroLiquido = dre.lucroLiquido;
    }

    return {
      dcf: dcfInputs,
      multiplos: multiplosInputs,
      patrimonial: patrimonialInputs,
      premissas: p
    };
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // HISTÓRICO — Suporte a múltiplos períodos (3-5 anos)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * CAGR — Compound Annual Growth Rate
   */
  function calcularCAGR(valorInicial, valorFinal, anos) {
    if (valorInicial <= 0 || valorFinal <= 0 || anos <= 0) return 0;
    return Math.pow(valorFinal / valorInicial, 1 / anos) - 1;
  }

  /**
   * Crescimento YoY
   */
  function calcularCrescimentoYoY(valorAtual, valorAnterior) {
    if (valorAnterior === 0) return 0;
    return (valorAtual - valorAnterior) / Math.abs(valorAnterior);
  }

  /**
   * Tendência via regressão linear simples
   * @param {number[]} valores - Série temporal (mais antigo primeiro)
   * @returns {Object} { inclinacao, classificacao: "subindo"|"estavel"|"caindo" }
   */
  function calcularTendencia(valores) {
    if (!valores || valores.length < 2) {
      return { inclinacao: 0, classificacao: 'estavel' };
    }
    var n = valores.length;
    var sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (var i = 0; i < n; i++) {
      sumX += i;
      sumY += valores[i];
      sumXY += i * valores[i];
      sumX2 += i * i;
    }
    var inclinacao = dividirSeguro(n * sumXY - sumX * sumY, n * sumX2 - sumX * sumX);

    var media = sumY / n;
    var inclinacaoNorm = media !== 0 ? inclinacao / Math.abs(media) : 0;

    var classificacao;
    if (inclinacaoNorm > 0.03) classificacao = 'subindo';
    else if (inclinacaoNorm < -0.03) classificacao = 'caindo';
    else classificacao = 'estavel';

    return { inclinacao: arredondar(inclinacao), classificacao: classificacao };
  }

  /**
   * Volatilidade (desvio padrão / média)
   */
  function calcularVolatilidade(valores) {
    if (!valores || valores.length < 2) return 0;
    var n = valores.length;
    var media = 0;
    for (var i = 0; i < n; i++) media += valores[i];
    media /= n;
    var somaDif2 = 0;
    for (var j = 0; j < n; j++) {
      somaDif2 += Math.pow(valores[j] - media, 2);
    }
    var dp = Math.sqrt(somaDif2 / (n - 1));
    return media !== 0 ? dp / Math.abs(media) : 0;
  }

  /**
   * Cria e analisa histórico de múltiplos períodos.
   *
   * @param {Array} periodos - [{ ano, dre: criarDRE(...), balanco: criarBalanco(...) }, ...]
   * @returns {Object} Análise completa do histórico
   */
  function criarHistorico(periodos) {
    if (!periodos || periodos.length === 0) {
      return { valido: false, mensagem: 'Nenhum período informado' };
    }

    // Ordenar por ano
    var sorted = periodos.slice().sort(function (a, b) { return a.ano - b.ano; });

    // Extrair séries
    var anos = [];
    var receitas = [], ebitdas = [], lucros = [], margensBruta = [];
    var margensEBITDA = [], margensLiquida = [];
    var capexReceita = [], daReceita = [];

    for (var i = 0; i < sorted.length; i++) {
      var p = sorted[i];
      var dre = p.dre;
      var bal = p.balanco;
      anos.push(p.ano);
      receitas.push(dre.receitaLiquida);
      ebitdas.push(dre.ebitda);
      lucros.push(dre.lucroLiquido);
      margensBruta.push(dre.margemBruta);
      margensEBITDA.push(dre.margemEBITDA);
      margensLiquida.push(dre.margemLiquida);
      capexReceita.push(dre.receitaLiquida > 0
        ? dividirSeguro(validarNumero(p.capex), dre.receitaLiquida) : 0);
      daReceita.push(dre.receitaLiquida > 0
        ? dividirSeguro(dre.depreciacaoAmortizacao, dre.receitaLiquida) : 0);
    }

    var nAnos = sorted.length;
    var primeiro = sorted[0];
    var ultimo = sorted[nAnos - 1];

    // CAGRs
    var cagrReceita = calcularCAGR(primeiro.dre.receitaLiquida, ultimo.dre.receitaLiquida, nAnos - 1);
    var cagrEbitda = calcularCAGR(
      Math.max(1, primeiro.dre.ebitda), Math.max(1, ultimo.dre.ebitda), nAnos - 1
    );
    var cagrLucro = (primeiro.dre.lucroLiquido > 0 && ultimo.dre.lucroLiquido > 0)
      ? calcularCAGR(primeiro.dre.lucroLiquido, ultimo.dre.lucroLiquido, nAnos - 1)
      : 0;

    // Tendências
    var tendenciaReceita = calcularTendencia(receitas);
    var tendenciaMargemBruta = calcularTendencia(margensBruta);
    var tendenciaMargemEBITDA = calcularTendencia(margensEBITDA);
    var tendenciaMargemLiquida = calcularTendencia(margensLiquida);

    // Volatilidades
    var volReceita = calcularVolatilidade(receitas);
    var volMargemEBITDA = calcularVolatilidade(margensEBITDA);

    // Médias históricas para premissas
    var mediaCapexReceita = 0;
    var mediaDaReceita = 0;
    for (var k = 0; k < nAnos; k++) {
      mediaCapexReceita += capexReceita[k];
      mediaDaReceita += daReceita[k];
    }
    mediaCapexReceita /= nAnos;
    mediaDaReceita /= nAnos;

    // Crescimento YoY por período
    var crescimentoYoY = [];
    for (var y = 1; y < nAnos; y++) {
      crescimentoYoY.push({
        de: anos[y - 1],
        para: anos[y],
        receita: calcularCrescimentoYoY(receitas[y], receitas[y - 1]),
        ebitda: calcularCrescimentoYoY(ebitdas[y], ebitdas[y - 1]),
        lucro: calcularCrescimentoYoY(lucros[y], lucros[y - 1])
      });
    }

    return {
      valido: true,
      periodos: sorted,
      anos: anos,
      numeroPeriodos: nAnos,
      cagr: {
        receita: arredondar(cagrReceita, 4),
        ebitda: arredondar(cagrEbitda, 4),
        lucro: arredondar(cagrLucro, 4)
      },
      tendencias: {
        receita: tendenciaReceita,
        margemBruta: tendenciaMargemBruta,
        margemEBITDA: tendenciaMargemEBITDA,
        margemLiquida: tendenciaMargemLiquida
      },
      volatilidade: {
        receita: arredondar(volReceita, 4),
        margemEBITDA: arredondar(volMargemEBITDA, 4)
      },
      mediasHistoricas: {
        capexReceita: arredondar(mediaCapexReceita, 4),
        daReceita: arredondar(mediaDaReceita, 4)
      },
      crescimentoYoY: crescimentoYoY,
      series: {
        receitas: receitas,
        ebitdas: ebitdas,
        lucros: lucros,
        margensBruta: margensBruta,
        margensEBITDA: margensEBITDA,
        margensLiquida: margensLiquida
      }
    };
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // REGISTRO DE MÓDULOS
  // ═══════════════════════════════════════════════════════════════════════════

  var _modulos = {};

  function _registrarModulo(nome, api) {
    _modulos[nome] = api;
    API[nome] = api;
  }

  function _obterModulo(nome) {
    return _modulos[nome] || null;
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // ORQUESTRAÇÃO — executarPrecificacao
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Detecta se inputs estão no formato novo (dre+balanco) ou antigo (dcf/multiplos/patrimonial).
   */
  function _detectarFormatoInputs(inputs) {
    if (inputs.dre && inputs.balanco) return 'novo';
    if (inputs.dcf || inputs.multiplos || inputs.patrimonial) return 'legado';
    return 'desconhecido';
  }

  /**
   * Executa a precificação completa usando todos os módulos disponíveis.
   *
   * Aceita tanto o formato novo (dre+balanco+premissas) quanto o legado
   * (dcf/multiplos/patrimonial separados). Detecta automaticamente.
   *
   * @param {Object} inputs
   *   Formato novo: { dre: {...}, balanco: {...}, premissas: {...} }
   *   Formato legado: { dcf: {...}, multiplos: {...}, patrimonial: {...} }
   * @param {Object} [opcoes]
   *   - pesos: { dcf, multiplos, patrimonial } (override pesos adaptativos)
   * @returns {Object} Resultado completo da precificação
   */
  function executarPrecificacao(inputs, opcoes) {
    if (!inputs) return { erro: true, mensagem: 'inputs é obrigatório' };

    var opc = opcoes || {};
    var formato = _detectarFormatoInputs(inputs);
    var dcfInputs, multiplosInputs, patrimonialInputs;

    if (formato === 'novo') {
      // Formato novo: DRE + Balanço + Premissas
      var dreObj = inputs.dre.valido ? inputs.dre : criarDRE(inputs.dre);
      var balObj = inputs.balanco.valido ? inputs.balanco : criarBalanco(inputs.balanco);
      var mapped = mapearInputsDRE(dreObj, balObj, inputs.premissas || {});
      if (mapped.erro) return mapped;
      dcfInputs = mapped.dcf;
      multiplosInputs = mapped.multiplos;
      patrimonialInputs = mapped.patrimonial;
    } else if (formato === 'legado') {
      // Formato legado: inputs diretos por módulo
      dcfInputs = inputs.dcf;
      multiplosInputs = inputs.multiplos;
      patrimonialInputs = inputs.patrimonial;
    } else {
      return { erro: true, mensagem: 'Formato de inputs não reconhecido. Use {dre,balanco,premissas} ou {dcf,multiplos,patrimonial}.' };
    }

    var resultados = {};
    var alertas = [];

    // DCF
    var modDCF = _obterModulo('DCF');
    if (modDCF && dcfInputs) {
      try {
        resultados.dcf = modDCF.calcular(dcfInputs);
      } catch (e) {
        resultados.dcf = { erro: true, mensagem: 'Erro no DCF: ' + e.message };
        alertas.push({ tipo: 'erro', modulo: 'DCF', mensagem: e.message });
      }
    }

    // Múltiplos
    var modMultiplos = _obterModulo('Multiplos');
    if (modMultiplos && multiplosInputs) {
      try {
        resultados.multiplos = modMultiplos.calcular(multiplosInputs);
      } catch (e) {
        resultados.multiplos = { erro: true, mensagem: 'Erro em Múltiplos: ' + e.message };
        alertas.push({ tipo: 'erro', modulo: 'Multiplos', mensagem: e.message });
      }
    }

    // Patrimonial
    var modPatrimonial = _obterModulo('Patrimonial');
    if (modPatrimonial && patrimonialInputs) {
      try {
        resultados.patrimonial = modPatrimonial.calcular(patrimonialInputs);
      } catch (e) {
        resultados.patrimonial = { erro: true, mensagem: 'Erro no Patrimonial: ' + e.message };
        alertas.push({ tipo: 'erro', modulo: 'Patrimonial', mensagem: e.message });
      }
    }

    // Indicadores
    var modIndicadores = _obterModulo('Indicadores');
    if (modIndicadores && formato === 'novo') {
      try {
        var dreObj2 = inputs.dre.valido ? inputs.dre : criarDRE(inputs.dre);
        var balObj2 = inputs.balanco.valido ? inputs.balanco : criarBalanco(inputs.balanco);
        var historico = inputs.historico || null;
        resultados.indicadores = modIndicadores.calcularTodosIndicadores(
          dreObj2, balObj2, (inputs.premissas || {}).setor || 'servicos', historico
        );
      } catch (e) {
        alertas.push({ tipo: 'aviso', modulo: 'Indicadores', mensagem: e.message });
      }
    }

    // Consolidação / Comparativo
    var modComparativo = _obterModulo('Comparativo');
    if (modComparativo) {
      try {
        resultados.consolidado = modComparativo.consolidar(resultados, opc.pesos || null);
      } catch (e) {
        alertas.push({ tipo: 'erro', modulo: 'Comparativo', mensagem: e.message });
      }
    }

    return {
      versao: VERSION,
      dataCalculo: hoje(),
      formato: formato,
      resultados: resultados,
      alertas: alertas,
      erro: false
    };
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // DEMONSTRAÇÃO / TESTES
  // ═══════════════════════════════════════════════════════════════════════════

  function executarDemonstracao() {
    var testes = [];
    var erros = [];

    function _assert(condicao, nome, detalhe) {
      if (condicao) {
        testes.push({ nome: nome, ok: true });
      } else {
        var err = { nome: nome, ok: false, detalhe: detalhe || '' };
        testes.push(err);
        erros.push(err);
      }
    }

    // ─── Teste 1: criarDRE ───
    try {
      var dre = criarDRE({
        receitaBruta: 5000000,
        deducoesReceita: 500000,
        cmv: 1500000,
        despesasAdministrativas: 600000,
        despesasComerciais: 400000,
        despesasGerais: 200000,
        outrasReceitasDespesas: 50000,
        depreciacaoAmortizacao: 300000,
        resultadoFinanceiro: -150000,
        aliquotaEfetiva: 0.34
      });
      _assert(dre.valido, 'DRE: válida');
      _assert(dre.receitaLiquida === 4500000, 'DRE: receitaLiquida = 4.5M',
        'esperado 4500000, obtido ' + dre.receitaLiquida);
      _assert(dre.lucroBruto === 3000000, 'DRE: lucroBruto = 3M',
        'esperado 3000000, obtido ' + dre.lucroBruto);
      _assert(dre.ebit === 1550000, 'DRE: ebit = 1.55M',
        'esperado 1550000, obtido ' + dre.ebit);
      _assert(dre.ebitda === 1850000, 'DRE: ebitda = 1.85M',
        'esperado 1850000, obtido ' + dre.ebitda);
      _assert(dre.lucroLiquido > 0, 'DRE: lucroLiquido positivo');
      _assert(dre.nopat > 0, 'DRE: nopat positivo');
      _assert(dre.margemBruta > 0 && dre.margemBruta < 1, 'DRE: margemBruta entre 0-1');
      _assert(dre.margemEBITDA > 0, 'DRE: margemEBITDA positiva');
    } catch (e) {
      erros.push({ nome: 'DRE', ok: false, detalhe: e.message });
    }

    // ─── Teste 2: criarDRE com margemBruta ───
    try {
      var dre2 = criarDRE({
        receitaBruta: 1000000,
        margemBruta: 0.60
      });
      _assert(dre2.valido, 'DRE margem: válida');
      _assert(dre2.cmv === 400000, 'DRE margem: cmv = 400k',
        'esperado 400000, obtido ' + dre2.cmv);
    } catch (e) {
      erros.push({ nome: 'DRE margem', ok: false, detalhe: e.message });
    }

    // ─── Teste 3: criarBalanco ───
    try {
      var bal = criarBalanco({
        caixa: 500000,
        aplicacoesFinanceiras: 200000,
        contasReceber: 800000,
        estoques: 600000,
        outrosCirculantes: 100000,
        imobilizado: 2000000,
        intangivel: 300000,
        investimentos: 100000,
        outrosNaoCirculantes: 50000,
        veiculos: 400000,
        maquinas: 500000,
        fornecedores: 400000,
        emprestimosCP: 300000,
        salarios: 200000,
        impostos: 150000,
        outrosPassivosCirculantes: 50000,
        emprestimosLP: 1000000,
        provisoes: 200000,
        outrosPassivosNaoCirculantes: 50000,
        patrimonioLiquido: 3200000,
        marca: 500000,
        carteiraClientes: 300000,
        contratos: 100000,
        licencas: 50000,
        knowHow: 200000,
        goodwill: 150000
      });
      _assert(bal.valido, 'Balanço: válido');
      _assert(bal.ativo.circulante.totalCirculante === 2200000, 'Balanço: AC = 2.2M',
        'esperado 2200000, obtido ' + bal.ativo.circulante.totalCirculante);
      _assert(bal.ativo.naoCirculante.totalNaoCirculante === 4350000, 'Balanço: ANC = 4.35M',
        'esperado 4350000, obtido ' + bal.ativo.naoCirculante.totalNaoCirculante);
      _assert(bal.ativo.totalAtivo === 6550000, 'Balanço: totalAtivo = 6.55M',
        'esperado 6550000, obtido ' + bal.ativo.totalAtivo);
      _assert(bal.dividaLiquida === 600000, 'Balanço: dividaLiquida = 600k',
        'esperado 600000, obtido ' + bal.dividaLiquida);
      _assert(bal.intangiveis.total === 1300000, 'Balanço: intangíveis = 1.3M',
        'esperado 1300000, obtido ' + bal.intangiveis.total);
    } catch (e) {
      erros.push({ nome: 'Balanço', ok: false, detalhe: e.message });
    }

    // ─── Teste 4: mapearInputsDRE ───
    try {
      var dreMap = criarDRE({
        receitaBruta: 5000000, deducoesReceita: 500000,
        cmv: 1500000, despesasAdministrativas: 600000,
        despesasComerciais: 400000, despesasGerais: 200000,
        depreciacaoAmortizacao: 300000, aliquotaEfetiva: 0.34
      });
      var balMap = criarBalanco({
        caixa: 500000, contasReceber: 800000, estoques: 600000,
        imobilizado: 2000000, emprestimosCP: 300000, emprestimosLP: 1000000,
        patrimonioLiquido: 3200000
      });
      var mapped = mapearInputsDRE(dreMap, balMap, {
        nomeEmpresa: 'TechBrasil Ltda', setor: 'tecnologia', porte: 'media'
      });
      _assert(!mapped.erro, 'Mapper: sem erro');
      _assert(mapped.dcf.setor === 'tecnologia', 'Mapper: DCF setor correto');
      _assert(mapped.multiplos.ebitda > 0, 'Mapper: Múltiplos ebitda positivo');
      _assert(mapped.patrimonial.caixa === 500000, 'Mapper: Patrimonial caixa correto');
    } catch (e) {
      erros.push({ nome: 'Mapper', ok: false, detalhe: e.message });
    }

    // ─── Teste 5: Histórico ───
    try {
      var hist = criarHistorico([
        { ano: 2022, dre: criarDRE({ receitaBruta: 3000000, cmv: 1000000, depreciacaoAmortizacao: 200000, aliquotaEfetiva: 0.34 }),
          balanco: criarBalanco({ caixa: 200000, patrimonioLiquido: 1500000 }) },
        { ano: 2023, dre: criarDRE({ receitaBruta: 3500000, cmv: 1100000, depreciacaoAmortizacao: 220000, aliquotaEfetiva: 0.34 }),
          balanco: criarBalanco({ caixa: 300000, patrimonioLiquido: 1800000 }) },
        { ano: 2024, dre: criarDRE({ receitaBruta: 4200000, cmv: 1300000, depreciacaoAmortizacao: 250000, aliquotaEfetiva: 0.34 }),
          balanco: criarBalanco({ caixa: 400000, patrimonioLiquido: 2200000 }) }
      ]);
      _assert(hist.valido, 'Histórico: válido');
      _assert(hist.numeroPeriodos === 3, 'Histórico: 3 períodos');
      _assert(hist.cagr.receita > 0, 'Histórico: CAGR receita positivo');
      _assert(hist.tendencias.receita.classificacao === 'subindo', 'Histórico: tendência receita subindo');
    } catch (e) {
      erros.push({ nome: 'Histórico', ok: false, detalhe: e.message });
    }

    // ─── Teste 6: Setores — chave "meioambiente" ───
    try {
      _assert(BETAS_SETORIAIS["meioambiente"] === 0.85,
        'Setores: beta meioambiente existe',
        'valor: ' + BETAS_SETORIAIS["meioambiente"]);
      _assert(BETAS_SETORIAIS["meio_ambiente"] === undefined,
        'Setores: meio_ambiente NÃO existe (snake_case eliminado)');
      _assert(SETORES_LABEL["meioambiente"] !== undefined,
        'Setores: label meioambiente existe');
      _assert(SETORES_KEYS.indexOf("meioambiente") !== -1,
        'Setores: meioambiente em SETORES_KEYS');
    } catch (e) {
      erros.push({ nome: 'Setores', ok: false, detalhe: e.message });
    }

    // ─── Teste 7: Utilitários ───
    try {
      _assert(arredondar(1.23456, 2) === 1.23, 'Utils: arredondar');
      _assert(dividirSeguro(10, 0) === 0, 'Utils: dividirSeguro por zero');
      _assert(validarNumero(null, 5) === 5, 'Utils: validarNumero null → default');
      _assert(validarNumero(undefined) === 0, 'Utils: validarNumero undefined → 0');
      _assert(formatarPct(0.15) === '15,0%', 'Utils: formatarPct');
    } catch (e) {
      erros.push({ nome: 'Utilitários', ok: false, detalhe: e.message });
    }

    // ─── Teste 8: Edge case — empresa sem lucro ───
    try {
      var dreSemLucro = criarDRE({
        receitaBruta: 1000000, cmv: 800000,
        despesasAdministrativas: 300000, aliquotaEfetiva: 0.34
      });
      _assert(dreSemLucro.valido, 'Edge: DRE sem lucro válida');
      _assert(dreSemLucro.lucroLiquido < 0, 'Edge: lucroLiquido negativo');
    } catch (e) {
      erros.push({ nome: 'Edge sem lucro', ok: false, detalhe: e.message });
    }

    // ─── Teste 9: Edge case — PL negativo ───
    try {
      var balPLNeg = criarBalanco({
        caixa: 100000, emprestimosLP: 500000, patrimonioLiquido: -200000
      });
      _assert(balPLNeg.valido, 'Edge: Balanço PL negativo válido');
      _assert(balPLNeg.patrimonioLiquido < 0, 'Edge: PL realmente negativo');
    } catch (e) {
      erros.push({ nome: 'Edge PL negativo', ok: false, detalhe: e.message });
    }

    // ─── Teste 10: Edge case — sem dívida ───
    try {
      var balSemDiv = criarBalanco({
        caixa: 1000000, patrimonioLiquido: 2000000
      });
      _assert(balSemDiv.dividaLiquida < 0, 'Edge: dívida líquida negativa (caixa > dívida)',
        'valor: ' + balSemDiv.dividaLiquida);
    } catch (e) {
      erros.push({ nome: 'Edge sem dívida', ok: false, detalhe: e.message });
    }

    // ─── Teste 11: Edge case — CMV zero (serviços puro) ───
    try {
      var dreServ = criarDRE({
        receitaBruta: 2000000, cmv: 0,
        despesasAdministrativas: 500000, despesasComerciais: 300000,
        aliquotaEfetiva: 0.34
      });
      _assert(dreServ.valido, 'Edge: DRE serviços válida');
      _assert(dreServ.margemBruta === 1, 'Edge: margem bruta 100% (serviços)',
        'valor: ' + dreServ.margemBruta);
    } catch (e) {
      erros.push({ nome: 'Edge CMV zero', ok: false, detalhe: e.message });
    }

    // ─── Teste 12: Módulos satélite (se carregados) ───
    var modulosDisponiveis = Object.keys(_modulos);
    testes.push({ nome: 'Módulos carregados', ok: true, detalhe: modulosDisponiveis.join(', ') || 'nenhum' });

    // DCF (se disponível)
    var modDCF = _obterModulo('DCF');
    if (modDCF && modDCF.calcular) {
      try {
        var resDCF = modDCF.calcular({
          nomeEmpresa: 'TechBrasil Ltda',
          setor: 'tecnologia',
          porte: 'media',
          receita: 4500000,
          custos: 2700000,
          depreciacaoAmortizacao: 300000,
          aliquotaImposto: 0.34,
          capex: 350000,
          variacaoCapitalGiro: 100000,
          dividaLiquida: 600000,
          horizonteAnos: 5,
          taxaCrescimento: 0.10,
          taxaPerpetua: 0.03,
          tipoCapital: 'fechado',
          waccAssistido: {
            taxaLivreRisco: 0.1075,
            premioRiscoMercado: 0.06,
            betaSetor: 1.20,
            premioRiscoPais: 0.03,
            custoDivida: 0.14,
            proporcaoDivida: 0.30,
            aliquotaImposto: 0.34
          }
        });
        _assert(!resDCF.erro, 'DCF: cálculo sem erro', resDCF.mensagem);
        if (!resDCF.erro) {
          _assert(resDCF.equityValue > 0, 'DCF: equity positivo');
          _assert(resDCF.detalhes && resDCF.detalhes.cenarios, 'DCF: tem cenários');
          if (resDCF.detalhes && resDCF.detalhes.cenarios) {
            _assert(
              resDCF.detalhes.cenarios.pessimista.equityValue <
              resDCF.detalhes.cenarios.base.equityValue,
              'DCF: pessimista < base'
            );
            _assert(
              resDCF.detalhes.cenarios.base.equityValue <
              resDCF.detalhes.cenarios.otimista.equityValue,
              'DCF: base < otimista'
            );
          }
        }
      } catch (e) {
        erros.push({ nome: 'DCF', ok: false, detalhe: e.message });
      }
    }

    // Múltiplos (se disponível)
    var modMult = _obterModulo('Multiplos');
    if (modMult && modMult.calcular) {
      try {
        var resMult = modMult.calcular({
          nomeEmpresa: 'TechBrasil Ltda',
          setor: 'tecnologia',
          porte: 'media',
          tipoCapital: 'fechado',
          receita: 4500000,
          ebitda: 1850000,
          ebit: 1550000,
          lucroLiquido: 924000,
          fcf: 770000,
          patrimonioLiquido: 3200000,
          dividaLiquida: 600000,
          depreciacaoAmortizacao: 300000
        });
        _assert(!resMult.erro, 'Múltiplos: cálculo sem erro', resMult.mensagem);
        if (!resMult.erro) {
          _assert(resMult.equityValue > 0, 'Múltiplos: equity positivo');
        }
      } catch (e) {
        erros.push({ nome: 'Múltiplos', ok: false, detalhe: e.message });
      }
    }

    // Patrimonial (se disponível)
    var modPat = _obterModulo('Patrimonial');
    if (modPat && modPat.calcular) {
      try {
        var resPat = modPat.calcular({
          nomeEmpresa: 'TechBrasil Ltda',
          setor: 'tecnologia',
          anosOperacao: 10,
          caixa: 500000,
          aplicacoesFinanceiras: 200000,
          contasReceber: 800000,
          inadimplencia: 0.05,
          estoques: 600000,
          obsolescencia: 0.10,
          outrosCirculantes: 100000,
          imoveis: 2000000,
          imoveisValorMercado: 2500000,
          veiculos: 400000,
          maquinas: 500000,
          investimentos: 100000,
          fornecedores: 400000,
          salarios: 200000,
          impostos: 150000,
          emprestimosCP: 300000,
          emprestimosLP: 1000000,
          provisoes: 200000,
          marca: 500000,
          carteiraClientes: 300000,
          contratos: 100000,
          licencas: 50000,
          knowHow: 200000,
          goodwill: 150000,
          contingencias: [
            { descricao: 'Trabalhista', valor: 200000, probabilidade: 'provavel' },
            { descricao: 'Tributário', valor: 500000, probabilidade: 'possivel' },
            { descricao: 'Ambiental', valor: 1000000, probabilidade: 'remoto' }
          ]
        });
        _assert(!resPat.erro, 'Patrimonial: cálculo sem erro', resPat.mensagem);
        if (!resPat.erro) {
          _assert(resPat.valorMinimo <= resPat.valorMediano, 'Patrimonial: min <= mediano');
          _assert(resPat.valorMediano <= resPat.valorMaximo, 'Patrimonial: mediano <= max');
        }
      } catch (e) {
        erros.push({ nome: 'Patrimonial', ok: false, detalhe: e.message });
      }
    }

    // Indicadores (se disponível)
    var modInd = _obterModulo('Indicadores');
    if (modInd && modInd.calcularTodosIndicadores) {
      try {
        var dreInd = criarDRE({
          receitaBruta: 5000000, deducoesReceita: 500000,
          cmv: 1500000, despesasAdministrativas: 600000,
          despesasComerciais: 400000, despesasGerais: 200000,
          depreciacaoAmortizacao: 300000, despesasFinanceiras: 150000,
          aliquotaEfetiva: 0.34
        });
        var balInd = criarBalanco({
          caixa: 500000, aplicacoesFinanceiras: 200000,
          contasReceber: 800000, estoques: 600000,
          imobilizado: 2000000, veiculos: 400000, maquinas: 500000,
          fornecedores: 400000, emprestimosCP: 300000, emprestimosLP: 1000000,
          patrimonioLiquido: 3200000
        });
        var resInd = modInd.calcularTodosIndicadores(dreInd, balInd, 'tecnologia');
        _assert(resInd && resInd.rentabilidade, 'Indicadores: rentabilidade calculada');
        _assert(resInd && resInd.scorecard, 'Indicadores: scorecard gerado');
        if (resInd && resInd.scorecard) {
          _assert(resInd.scorecard.notaGeral >= 0 && resInd.scorecard.notaGeral <= 10,
            'Indicadores: nota 0-10');
        }
      } catch (e) {
        erros.push({ nome: 'Indicadores', ok: false, detalhe: e.message });
      }
    }

    // Comparativo / executarPrecificacao completo (se todos módulos carregados)
    if (modDCF && modMult && modPat) {
      try {
        var dreComp = criarDRE({
          receitaBruta: 5000000, deducoesReceita: 500000,
          cmv: 1500000, despesasAdministrativas: 600000,
          despesasComerciais: 400000, despesasGerais: 200000,
          outrasReceitasDespesas: 50000,
          depreciacaoAmortizacao: 300000,
          resultadoFinanceiro: -150000,
          aliquotaEfetiva: 0.34
        });
        var balComp = criarBalanco({
          caixa: 500000, aplicacoesFinanceiras: 200000,
          contasReceber: 800000, estoques: 600000, outrosCirculantes: 100000,
          imobilizado: 2000000, intangivel: 300000, investimentos: 100000,
          veiculos: 400000, maquinas: 500000,
          fornecedores: 400000, emprestimosCP: 300000, salarios: 200000,
          impostos: 150000, outrosPassivosCirculantes: 50000,
          emprestimosLP: 1000000, provisoes: 200000,
          patrimonioLiquido: 3200000,
          marca: 500000, carteiraClientes: 300000,
          contratos: 100000, licencas: 50000, knowHow: 200000, goodwill: 150000
        });

        var resCompleto = executarPrecificacao({
          dre: dreComp,
          balanco: balComp,
          premissas: {
            nomeEmpresa: 'TechBrasil Ltda',
            setor: 'tecnologia',
            porte: 'media',
            tipoCapital: 'fechado',
            horizonteAnos: 5,
            taxaCrescimento: 0.10,
            taxaPerpetua: 0.03,
            capex: 350000,
            variacaoCapitalGiro: 100000,
            anosOperacao: 10,
            waccAssistido: {
              taxaLivreRisco: 0.1075,
              premioRiscoMercado: 0.06,
              betaSetor: 1.20,
              premioRiscoPais: 0.03,
              custoDivida: 0.14,
              proporcaoDivida: 0.30,
              aliquotaImposto: 0.34
            }
          }
        });
        _assert(!resCompleto.erro, 'Precificação completa: sem erro');
        _assert(resCompleto.resultados.dcf, 'Precificação: tem DCF');
        _assert(resCompleto.resultados.multiplos, 'Precificação: tem Múltiplos');
        _assert(resCompleto.resultados.patrimonial, 'Precificação: tem Patrimonial');

        // Retrocompatibilidade: formato legado
        var resLegado = executarPrecificacao({
          dcf: {
            nomeEmpresa: 'Legado Test',
            setor: 'servicos', porte: 'pequena',
            receita: 2000000, custos: 1200000,
            depreciacaoAmortizacao: 100000, aliquotaImposto: 0.34,
            capex: 120000, variacaoCapitalGiro: 50000, dividaLiquida: 300000,
            horizonteAnos: 5, taxaCrescimento: 0.05, taxaPerpetua: 0.03,
            waccManual: 0.18, tipoCapital: 'fechado'
          },
          multiplos: {
            nomeEmpresa: 'Legado Test',
            setor: 'servicos', porte: 'pequena', tipoCapital: 'fechado',
            receita: 2000000, ebitda: 500000, ebit: 400000,
            lucroLiquido: 264000, patrimonioLiquido: 1000000,
            dividaLiquida: 300000, depreciacaoAmortizacao: 100000
          },
          patrimonial: {
            nomeEmpresa: 'Legado Test',
            setor: 'servicos', anosOperacao: 5,
            caixa: 200000, contasReceber: 500000, estoques: 300000,
            inadimplencia: 0.05, obsolescencia: 0.10,
            imoveis: 800000, fornecedores: 200000, emprestimosCP: 100000,
            emprestimosLP: 200000, patrimonioLiquido: 1000000
          }
        });
        _assert(resLegado.formato === 'legado', 'Retrocompat: formato detectado como legado');
        _assert(!resLegado.erro, 'Retrocompat: sem erro');
      } catch (e) {
        erros.push({ nome: 'Precificação completa', ok: false, detalhe: e.message });
      }

      // Setor meioambiente nos módulos
      try {
        var resMeio = modMult.calcular({
          nomeEmpresa: 'EcoTest',
          setor: 'meioambiente', porte: 'pequena', tipoCapital: 'fechado',
          receita: 1000000, ebitda: 200000, ebit: 150000,
          lucroLiquido: 100000, patrimonioLiquido: 500000,
          dividaLiquida: 100000, depreciacaoAmortizacao: 50000
        });
        _assert(!resMeio.erro, 'Meioambiente: Múltiplos sem erro',
          resMeio.mensagem);
      } catch (e) {
        erros.push({ nome: 'Meioambiente Múltiplos', ok: false, detalhe: e.message });
      }
    }

    return {
      ok: erros.length === 0,
      totalTestes: testes.length,
      passaram: testes.filter(function (t) { return t.ok; }).length,
      falharam: erros.length,
      testes: testes,
      erros: erros,
      modulosCarregados: Object.keys(_modulos)
    };
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // API PÚBLICA
  // ═══════════════════════════════════════════════════════════════════════════

  var API = {
    VERSION: VERSION,

    // Constantes
    GLOSSARIO: GLOSSARIO,
    SETORES_KEYS: SETORES_KEYS,
    SETORES_LABEL: SETORES_LABEL,
    PORTES: PORTES,
    BETAS_SETORIAIS: BETAS_SETORIAIS,
    WACC_SUGERIDO: WACC_SUGERIDO,
    TAXA_PERPETUA_LIMITES: TAXA_PERPETUA_LIMITES,
    ALIQUOTAS_REGIME: ALIQUOTAS_REGIME,
    DESCONTOS_ILIQUIDEZ: DESCONTOS_ILIQUIDEZ,

    // Utilitários
    arredondar: arredondar,
    dividirSeguro: dividirSeguro,
    validarNumero: validarNumero,
    clonarObjeto: clonarObjeto,
    formatarMoeda: formatarMoeda,
    formatarMoedaCurta: formatarMoedaCurta,
    formatarPct: formatarPct,
    hoje: hoje,
    obterBetaSetor: obterBetaSetor,
    sugerirWACC: sugerirWACC,
    obterDescontoPorte: obterDescontoPorte,
    obterDescontoIliquidez: obterDescontoIliquidez,

    // DRE e Balanço
    criarDRE: criarDRE,
    criarBalanco: criarBalanco,
    mapearInputsDRE: mapearInputsDRE,

    // Histórico
    criarHistorico: criarHistorico,
    calcularCAGR: calcularCAGR,
    calcularCrescimentoYoY: calcularCrescimentoYoY,
    calcularTendencia: calcularTendencia,
    calcularVolatilidade: calcularVolatilidade,

    // Registro de módulos
    _registrarModulo: _registrarModulo,
    _obterModulo: _obterModulo,

    // Orquestração
    executarPrecificacao: executarPrecificacao,
    executarDemonstracao: executarDemonstracao
  };



  // ╔═══════════════════════════════════════════════════════════════════════════╗
  // ║  MÓDULO 2/6 — INDICADORES — Rentabilidade, Margens, Liquidez, Eficiência, Dupon║
  // ╚═══════════════════════════════════════════════════════════════════════════╝

  (function (Core) {

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITÁRIOS DO CORE
  // ═══════════════════════════════════════════════════════════════════════════

  var arredondar = Core.arredondar;
  var dividirSeguro = Core.dividirSeguro;
  var validarNumero = Core.validarNumero;
  var formatarPct = Core.formatarPct;
  var formatarMoeda = Core.formatarMoeda;
  var calcularCAGRCore = Core.calcularCAGR;
  var calcularCrescimentoYoYCore = Core.calcularCrescimentoYoY;
  var calcularTendencia = Core.calcularTendencia;
  var SETORES_KEYS = Core.SETORES_KEYS;


  // ═══════════════════════════════════════════════════════════════════════════
  // REFERÊNCIAS SETORIAIS — 15 setores × 12 indicadores (ETAPA 8)
  // ═══════════════════════════════════════════════════════════════════════════
  // Valores calibrados para o mercado brasileiro (PMEs e médias empresas).
  // Fontes de referência: CVM, Economatica, Valor Econômico, IBGE-PIA.
  //
  // Para a maioria dos indicadores: ruim < regular < bom < excelente
  // Para indicadores INVERSOS (menor=melhor): excelente < bom < regular < ruim
  //   → dividaEbitda, pmr, cicloFinanceiro
  // ═══════════════════════════════════════════════════════════════════════════

  var REFERENCIAS_SETORIAIS = {

    // ─── Serviços / Consultoria ───
    "servicos": {
      margemBruta:      { ruim: 0.25, regular: 0.40, bom: 0.55, excelente: 0.70 },
      margemEBITDA:     { ruim: 0.08, regular: 0.15, bom: 0.25, excelente: 0.35 },
      margemLiquida:    { ruim: 0.03, regular: 0.08, bom: 0.15, excelente: 0.25 },
      roe:              { ruim: 0.05, regular: 0.12, bom: 0.20, excelente: 0.30 },
      roa:              { ruim: 0.02, regular: 0.06, bom: 0.12, excelente: 0.20 },
      liquidezCorrente: { ruim: 0.80, regular: 1.20, bom: 1.80, excelente: 2.50 },
      dividaEbitda:     { excelente: 1.0, bom: 2.0, regular: 3.5, ruim: 5.0 },
      giroAtivo:        { ruim: 0.40, regular: 0.80, bom: 1.20, excelente: 1.80 },
      coberturaJuros:   { ruim: 1.5, regular: 3.0, bom: 5.0, excelente: 8.0 },
      roic:             { ruim: 0.05, regular: 0.10, bom: 0.18, excelente: 0.28 },
      pmr:              { excelente: 25, bom: 45, regular: 70, ruim: 100 },
      cicloFinanceiro:  { excelente: 20, bom: 45, regular: 75, ruim: 120 }
    },

    // ─── Tecnologia / SaaS ───
    "tecnologia": {
      margemBruta:      { ruim: 0.40, regular: 0.55, bom: 0.70, excelente: 0.85 },
      margemEBITDA:     { ruim: 0.05, regular: 0.15, bom: 0.28, excelente: 0.40 },
      margemLiquida:    { ruim: 0.02, regular: 0.08, bom: 0.18, excelente: 0.30 },
      roe:              { ruim: 0.06, regular: 0.14, bom: 0.25, excelente: 0.40 },
      roa:              { ruim: 0.03, regular: 0.08, bom: 0.15, excelente: 0.25 },
      liquidezCorrente: { ruim: 0.90, regular: 1.30, bom: 2.00, excelente: 3.00 },
      dividaEbitda:     { excelente: 0.5, bom: 1.5, regular: 3.0, ruim: 5.0 },
      giroAtivo:        { ruim: 0.30, regular: 0.60, bom: 1.00, excelente: 1.50 },
      coberturaJuros:   { ruim: 2.0, regular: 4.0, bom: 7.0, excelente: 12.0 },
      roic:             { ruim: 0.06, regular: 0.12, bom: 0.22, excelente: 0.35 },
      pmr:              { excelente: 20, bom: 40, regular: 65, ruim: 90 },
      cicloFinanceiro:  { excelente: 10, bom: 30, regular: 55, ruim: 90 }
    },

    // ─── Agronegócio ───
    "agronegocio": {
      margemBruta:      { ruim: 0.15, regular: 0.25, bom: 0.35, excelente: 0.50 },
      margemEBITDA:     { ruim: 0.06, regular: 0.12, bom: 0.20, excelente: 0.30 },
      margemLiquida:    { ruim: 0.02, regular: 0.06, bom: 0.12, excelente: 0.20 },
      roe:              { ruim: 0.04, regular: 0.10, bom: 0.18, excelente: 0.28 },
      roa:              { ruim: 0.02, regular: 0.05, bom: 0.10, excelente: 0.16 },
      liquidezCorrente: { ruim: 0.70, regular: 1.10, bom: 1.60, excelente: 2.20 },
      dividaEbitda:     { excelente: 1.0, bom: 2.5, regular: 4.0, ruim: 6.0 },
      giroAtivo:        { ruim: 0.30, regular: 0.55, bom: 0.85, excelente: 1.20 },
      coberturaJuros:   { ruim: 1.2, regular: 2.5, bom: 4.5, excelente: 7.0 },
      roic:             { ruim: 0.04, regular: 0.08, bom: 0.14, excelente: 0.22 },
      pmr:              { excelente: 20, bom: 40, regular: 65, ruim: 95 },
      cicloFinanceiro:  { excelente: 30, bom: 60, regular: 100, ruim: 150 }
    },

    // ─── Varejo ───
    "varejo": {
      margemBruta:      { ruim: 0.18, regular: 0.28, bom: 0.38, excelente: 0.50 },
      margemEBITDA:     { ruim: 0.03, regular: 0.07, bom: 0.12, excelente: 0.18 },
      margemLiquida:    { ruim: 0.01, regular: 0.03, bom: 0.06, excelente: 0.10 },
      roe:              { ruim: 0.04, regular: 0.10, bom: 0.18, excelente: 0.28 },
      roa:              { ruim: 0.02, regular: 0.05, bom: 0.09, excelente: 0.14 },
      liquidezCorrente: { ruim: 0.70, regular: 1.00, bom: 1.40, excelente: 2.00 },
      dividaEbitda:     { excelente: 1.0, bom: 2.0, regular: 3.5, ruim: 5.5 },
      giroAtivo:        { ruim: 0.80, regular: 1.30, bom: 1.80, excelente: 2.50 },
      coberturaJuros:   { ruim: 1.5, regular: 3.0, bom: 5.0, excelente: 8.0 },
      roic:             { ruim: 0.04, regular: 0.09, bom: 0.15, excelente: 0.24 },
      pmr:              { excelente: 10, bom: 25, regular: 45, ruim: 70 },
      cicloFinanceiro:  { excelente: 15, bom: 35, regular: 60, ruim: 100 }
    },

    // ─── Saúde ───
    "saude": {
      margemBruta:      { ruim: 0.25, regular: 0.35, bom: 0.50, excelente: 0.65 },
      margemEBITDA:     { ruim: 0.06, regular: 0.12, bom: 0.20, excelente: 0.30 },
      margemLiquida:    { ruim: 0.02, regular: 0.06, bom: 0.12, excelente: 0.20 },
      roe:              { ruim: 0.05, regular: 0.12, bom: 0.20, excelente: 0.30 },
      roa:              { ruim: 0.02, regular: 0.06, bom: 0.11, excelente: 0.18 },
      liquidezCorrente: { ruim: 0.75, regular: 1.10, bom: 1.60, excelente: 2.30 },
      dividaEbitda:     { excelente: 1.0, bom: 2.0, regular: 3.5, ruim: 5.5 },
      giroAtivo:        { ruim: 0.35, regular: 0.65, bom: 1.00, excelente: 1.50 },
      coberturaJuros:   { ruim: 1.5, regular: 3.0, bom: 5.5, excelente: 9.0 },
      roic:             { ruim: 0.05, regular: 0.10, bom: 0.17, excelente: 0.26 },
      pmr:              { excelente: 20, bom: 45, regular: 75, ruim: 110 },
      cicloFinanceiro:  { excelente: 15, bom: 40, regular: 70, ruim: 110 }
    },

    // ─── Construção Civil ───
    "construcao": {
      margemBruta:      { ruim: 0.15, regular: 0.22, bom: 0.32, excelente: 0.45 },
      margemEBITDA:     { ruim: 0.05, regular: 0.10, bom: 0.18, excelente: 0.28 },
      margemLiquida:    { ruim: 0.02, regular: 0.05, bom: 0.10, excelente: 0.18 },
      roe:              { ruim: 0.04, regular: 0.10, bom: 0.17, excelente: 0.25 },
      roa:              { ruim: 0.01, regular: 0.04, bom: 0.08, excelente: 0.14 },
      liquidezCorrente: { ruim: 0.80, regular: 1.10, bom: 1.50, excelente: 2.00 },
      dividaEbitda:     { excelente: 1.5, bom: 3.0, regular: 4.5, ruim: 7.0 },
      giroAtivo:        { ruim: 0.20, regular: 0.40, bom: 0.65, excelente: 1.00 },
      coberturaJuros:   { ruim: 1.0, regular: 2.0, bom: 3.5, excelente: 6.0 },
      roic:             { ruim: 0.03, regular: 0.07, bom: 0.13, excelente: 0.20 },
      pmr:              { excelente: 30, bom: 55, regular: 90, ruim: 130 },
      cicloFinanceiro:  { excelente: 40, bom: 75, regular: 120, ruim: 180 }
    },

    // ─── Indústria / Manufatura ───
    "industria": {
      margemBruta:      { ruim: 0.18, regular: 0.28, bom: 0.38, excelente: 0.50 },
      margemEBITDA:     { ruim: 0.06, regular: 0.12, bom: 0.20, excelente: 0.30 },
      margemLiquida:    { ruim: 0.02, regular: 0.05, bom: 0.10, excelente: 0.18 },
      roe:              { ruim: 0.05, regular: 0.11, bom: 0.18, excelente: 0.28 },
      roa:              { ruim: 0.02, regular: 0.05, bom: 0.10, excelente: 0.16 },
      liquidezCorrente: { ruim: 0.75, regular: 1.10, bom: 1.50, excelente: 2.10 },
      dividaEbitda:     { excelente: 1.0, bom: 2.5, regular: 4.0, ruim: 6.0 },
      giroAtivo:        { ruim: 0.40, regular: 0.70, bom: 1.00, excelente: 1.40 },
      coberturaJuros:   { ruim: 1.5, regular: 3.0, bom: 5.0, excelente: 8.0 },
      roic:             { ruim: 0.04, regular: 0.09, bom: 0.15, excelente: 0.24 },
      pmr:              { excelente: 25, bom: 50, regular: 75, ruim: 110 },
      cicloFinanceiro:  { excelente: 30, bom: 55, regular: 85, ruim: 130 }
    },

    // ─── Alimentação ───
    "alimentacao": {
      margemBruta:      { ruim: 0.20, regular: 0.30, bom: 0.42, excelente: 0.55 },
      margemEBITDA:     { ruim: 0.04, regular: 0.08, bom: 0.15, excelente: 0.22 },
      margemLiquida:    { ruim: 0.01, regular: 0.04, bom: 0.08, excelente: 0.14 },
      roe:              { ruim: 0.05, regular: 0.12, bom: 0.20, excelente: 0.30 },
      roa:              { ruim: 0.02, regular: 0.05, bom: 0.10, excelente: 0.16 },
      liquidezCorrente: { ruim: 0.70, regular: 1.00, bom: 1.40, excelente: 1.90 },
      dividaEbitda:     { excelente: 1.0, bom: 2.0, regular: 3.5, ruim: 5.5 },
      giroAtivo:        { ruim: 0.60, regular: 1.00, bom: 1.50, excelente: 2.20 },
      coberturaJuros:   { ruim: 1.2, regular: 2.5, bom: 4.5, excelente: 7.0 },
      roic:             { ruim: 0.04, regular: 0.09, bom: 0.15, excelente: 0.23 },
      pmr:              { excelente: 8, bom: 20, regular: 40, ruim: 65 },
      cicloFinanceiro:  { excelente: 10, bom: 25, regular: 50, ruim: 80 }
    },

    // ─── Educação ───
    "educacao": {
      margemBruta:      { ruim: 0.30, regular: 0.42, bom: 0.55, excelente: 0.70 },
      margemEBITDA:     { ruim: 0.08, regular: 0.15, bom: 0.25, excelente: 0.35 },
      margemLiquida:    { ruim: 0.03, regular: 0.08, bom: 0.15, excelente: 0.25 },
      roe:              { ruim: 0.05, regular: 0.12, bom: 0.22, excelente: 0.32 },
      roa:              { ruim: 0.02, regular: 0.06, bom: 0.12, excelente: 0.20 },
      liquidezCorrente: { ruim: 0.70, regular: 1.00, bom: 1.50, excelente: 2.20 },
      dividaEbitda:     { excelente: 0.8, bom: 1.8, regular: 3.0, ruim: 5.0 },
      giroAtivo:        { ruim: 0.30, regular: 0.55, bom: 0.85, excelente: 1.30 },
      coberturaJuros:   { ruim: 1.5, regular: 3.0, bom: 5.5, excelente: 9.0 },
      roic:             { ruim: 0.05, regular: 0.10, bom: 0.18, excelente: 0.28 },
      pmr:              { excelente: 15, bom: 30, regular: 55, ruim: 85 },
      cicloFinanceiro:  { excelente: 10, bom: 25, regular: 50, ruim: 80 }
    },

    // ─── Transporte / Logística ───
    "transporte": {
      margemBruta:      { ruim: 0.15, regular: 0.22, bom: 0.32, excelente: 0.45 },
      margemEBITDA:     { ruim: 0.05, regular: 0.10, bom: 0.18, excelente: 0.28 },
      margemLiquida:    { ruim: 0.01, regular: 0.04, bom: 0.08, excelente: 0.15 },
      roe:              { ruim: 0.04, regular: 0.10, bom: 0.17, excelente: 0.25 },
      roa:              { ruim: 0.01, regular: 0.04, bom: 0.08, excelente: 0.14 },
      liquidezCorrente: { ruim: 0.65, regular: 0.95, bom: 1.30, excelente: 1.80 },
      dividaEbitda:     { excelente: 1.5, bom: 3.0, regular: 4.5, ruim: 7.0 },
      giroAtivo:        { ruim: 0.35, regular: 0.60, bom: 0.90, excelente: 1.30 },
      coberturaJuros:   { ruim: 1.0, regular: 2.0, bom: 3.5, excelente: 6.0 },
      roic:             { ruim: 0.03, regular: 0.07, bom: 0.13, excelente: 0.20 },
      pmr:              { excelente: 20, bom: 40, regular: 65, ruim: 95 },
      cicloFinanceiro:  { excelente: 15, bom: 35, regular: 60, ruim: 95 }
    },

    // ─── Energia ───
    "energia": {
      margemBruta:      { ruim: 0.20, regular: 0.30, bom: 0.45, excelente: 0.60 },
      margemEBITDA:     { ruim: 0.10, regular: 0.20, bom: 0.35, excelente: 0.50 },
      margemLiquida:    { ruim: 0.03, regular: 0.08, bom: 0.15, excelente: 0.25 },
      roe:              { ruim: 0.04, regular: 0.10, bom: 0.16, excelente: 0.24 },
      roa:              { ruim: 0.02, regular: 0.05, bom: 0.09, excelente: 0.14 },
      liquidezCorrente: { ruim: 0.70, regular: 1.00, bom: 1.40, excelente: 2.00 },
      dividaEbitda:     { excelente: 1.5, bom: 3.0, regular: 4.5, ruim: 6.5 },
      giroAtivo:        { ruim: 0.15, regular: 0.30, bom: 0.50, excelente: 0.80 },
      coberturaJuros:   { ruim: 1.5, regular: 2.5, bom: 4.5, excelente: 7.0 },
      roic:             { ruim: 0.04, regular: 0.08, bom: 0.13, excelente: 0.20 },
      pmr:              { excelente: 20, bom: 40, regular: 65, ruim: 95 },
      cicloFinanceiro:  { excelente: 10, bom: 30, regular: 55, ruim: 85 }
    },

    // ─── Financeiro ───
    "financeiro": {
      margemBruta:      { ruim: 0.30, regular: 0.45, bom: 0.60, excelente: 0.80 },
      margemEBITDA:     { ruim: 0.10, regular: 0.20, bom: 0.35, excelente: 0.50 },
      margemLiquida:    { ruim: 0.05, regular: 0.12, bom: 0.20, excelente: 0.30 },
      roe:              { ruim: 0.08, regular: 0.15, bom: 0.22, excelente: 0.35 },
      roa:              { ruim: 0.01, regular: 0.03, bom: 0.06, excelente: 0.10 },
      liquidezCorrente: { ruim: 0.90, regular: 1.20, bom: 1.60, excelente: 2.20 },
      dividaEbitda:     { excelente: 1.0, bom: 2.5, regular: 4.0, ruim: 6.0 },
      giroAtivo:        { ruim: 0.08, regular: 0.15, bom: 0.25, excelente: 0.40 },
      coberturaJuros:   { ruim: 1.5, regular: 3.0, bom: 5.0, excelente: 8.0 },
      roic:             { ruim: 0.06, regular: 0.12, bom: 0.20, excelente: 0.30 },
      pmr:              { excelente: 15, bom: 35, regular: 60, ruim: 90 },
      cicloFinanceiro:  { excelente: 5, bom: 20, regular: 45, ruim: 75 }
    },

    // ─── Imobiliário ───
    "imobiliario": {
      margemBruta:      { ruim: 0.18, regular: 0.28, bom: 0.38, excelente: 0.50 },
      margemEBITDA:     { ruim: 0.08, regular: 0.15, bom: 0.25, excelente: 0.38 },
      margemLiquida:    { ruim: 0.03, regular: 0.08, bom: 0.15, excelente: 0.25 },
      roe:              { ruim: 0.04, regular: 0.10, bom: 0.16, excelente: 0.24 },
      roa:              { ruim: 0.01, regular: 0.03, bom: 0.06, excelente: 0.10 },
      liquidezCorrente: { ruim: 0.80, regular: 1.10, bom: 1.50, excelente: 2.10 },
      dividaEbitda:     { excelente: 2.0, bom: 3.5, regular: 5.0, ruim: 7.5 },
      giroAtivo:        { ruim: 0.10, regular: 0.20, bom: 0.35, excelente: 0.55 },
      coberturaJuros:   { ruim: 1.0, regular: 2.0, bom: 3.5, excelente: 5.5 },
      roic:             { ruim: 0.03, regular: 0.06, bom: 0.11, excelente: 0.18 },
      pmr:              { excelente: 25, bom: 50, regular: 85, ruim: 130 },
      cicloFinanceiro:  { excelente: 40, bom: 80, regular: 130, ruim: 200 }
    },

    // ─── Telecomunicações ───
    "telecomunicacoes": {
      margemBruta:      { ruim: 0.30, regular: 0.42, bom: 0.55, excelente: 0.68 },
      margemEBITDA:     { ruim: 0.15, regular: 0.25, bom: 0.35, excelente: 0.48 },
      margemLiquida:    { ruim: 0.03, regular: 0.08, bom: 0.15, excelente: 0.22 },
      roe:              { ruim: 0.05, regular: 0.12, bom: 0.18, excelente: 0.28 },
      roa:              { ruim: 0.02, regular: 0.05, bom: 0.09, excelente: 0.15 },
      liquidezCorrente: { ruim: 0.70, regular: 1.00, bom: 1.40, excelente: 2.00 },
      dividaEbitda:     { excelente: 1.5, bom: 2.5, regular: 4.0, ruim: 6.0 },
      giroAtivo:        { ruim: 0.20, regular: 0.35, bom: 0.55, excelente: 0.80 },
      coberturaJuros:   { ruim: 1.5, regular: 3.0, bom: 5.0, excelente: 8.0 },
      roic:             { ruim: 0.04, regular: 0.08, bom: 0.14, excelente: 0.22 },
      pmr:              { excelente: 20, bom: 40, regular: 60, ruim: 90 },
      cicloFinanceiro:  { excelente: 10, bom: 25, regular: 50, ruim: 80 }
    },

    // ─── Meio Ambiente / Sustentabilidade ───
    "meioambiente": {
      margemBruta:      { ruim: 0.20, regular: 0.30, bom: 0.42, excelente: 0.55 },
      margemEBITDA:     { ruim: 0.06, regular: 0.12, bom: 0.22, excelente: 0.32 },
      margemLiquida:    { ruim: 0.02, regular: 0.06, bom: 0.12, excelente: 0.20 },
      roe:              { ruim: 0.04, regular: 0.10, bom: 0.18, excelente: 0.28 },
      roa:              { ruim: 0.02, regular: 0.05, bom: 0.10, excelente: 0.16 },
      liquidezCorrente: { ruim: 0.75, regular: 1.10, bom: 1.60, excelente: 2.20 },
      dividaEbitda:     { excelente: 1.0, bom: 2.5, regular: 4.0, ruim: 6.0 },
      giroAtivo:        { ruim: 0.25, regular: 0.50, bom: 0.80, excelente: 1.20 },
      coberturaJuros:   { ruim: 1.2, regular: 2.5, bom: 4.5, excelente: 7.0 },
      roic:             { ruim: 0.04, regular: 0.08, bom: 0.14, excelente: 0.22 },
      pmr:              { excelente: 20, bom: 45, regular: 70, ruim: 100 },
      cicloFinanceiro:  { excelente: 20, bom: 45, regular: 75, ruim: 115 }
    }
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // CLASSIFICADOR — Enquadra valor nas faixas setoriais
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Classifica um valor com base nas referências do setor.
   *
   * @param {number} valor - Valor do indicador
   * @param {Object} ref   - { ruim, regular, bom, excelente } ou inverso
   * @param {boolean} inverso - true para métricas onde menor = melhor
   * @returns {string} 'excelente' | 'bom' | 'regular' | 'ruim' | 'sem_referencia'
   */
  function classificar(valor, ref, inverso) {
    if (!ref) return 'sem_referencia';
    if (!isFinite(valor)) return 'ruim';

    if (inverso) {
      // Menor = melhor (dívida/EBITDA, PMR, ciclo financeiro)
      if (valor <= ref.excelente) return 'excelente';
      if (valor <= ref.bom) return 'bom';
      if (valor <= ref.regular) return 'regular';
      return 'ruim';
    }

    // Maior = melhor (margens, ROE, ROA, liquidez, etc.)
    if (valor >= ref.excelente) return 'excelente';
    if (valor >= ref.bom) return 'bom';
    if (valor >= ref.regular) return 'regular';
    return 'ruim';
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS INTERNOS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Obtém as referências de um indicador para o setor informado.
   * Retorna null se não houver referência.
   */
  function _obterReferencia(setor, indicador) {
    var setorRef = REFERENCIAS_SETORIAIS[setor];
    if (!setorRef) return null;
    return setorRef[indicador] || null;
  }

  /**
   * Formata um valor percentual para exibição (ex: '21,6%').
   */
  function _formatarPercentual(valor) {
    if (!isFinite(valor)) return '0,0%';
    return (valor * 100).toFixed(1).replace('.', ',') + '%';
  }

  /**
   * Formata um valor numérico com casas decimais para exibição.
   */
  function _formatarNumero(valor, casas) {
    if (casas === undefined) casas = 2;
    if (!isFinite(valor)) return '0,00';
    return valor.toFixed(casas).replace('.', ',');
  }

  /**
   * Formata dias para exibição.
   */
  function _formatarDias(valor) {
    if (!isFinite(valor)) return '0 dias';
    return Math.round(valor) + ' dias';
  }

  /**
   * Formata um valor como múltiplo (ex: '2,5×').
   */
  function _formatarMultiplo(valor) {
    if (!isFinite(valor)) return '0,0x';
    return valor.toFixed(1).replace('.', ',') + 'x';
  }

  /**
   * Verifica se um indicador é inverso (menor = melhor).
   */
  var INDICADORES_INVERSOS = {
    dividaEbitda: true,
    dividaPL: true,
    pmr: true,
    pme: true,
    pmp: false,  // PMP é ambíguo, mas normalmente maior = melhor (mais prazo)
    cicloOperacional: true,
    cicloFinanceiro: true
  };

  function _ehInverso(nomeIndicador) {
    return INDICADORES_INVERSOS[nomeIndicador] === true;
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // 3.1 — INDICADORES DE RENTABILIDADE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * ROI — Retorno sobre o Investimento
   * ROI = Lucro Líquido / Capital Investido
   */
  function calcularROI(lucroLiquido, capitalInvestido, setor) {
    var ll = validarNumero(lucroLiquido);
    var ci = validarNumero(capitalInvestido);
    var valor = dividirSeguro(ll, ci);
    var ref = _obterReferencia(setor, 'roe'); // ROI usa referência similar ao ROE
    var alertas = [];

    if (ci <= 0) {
      alertas.push('Capital investido zero ou negativo; ROI não calculável.');
    }
    if (valor < 0) {
      alertas.push('ROI negativo indica que o investimento está gerando prejuízo.');
    }

    return {
      sigla: 'ROI',
      nome: 'Retorno sobre o Investimento',
      valor: arredondar(valor, 4),
      valorFormatado: _formatarPercentual(valor),
      formula: 'Lucro Líquido / Capital Investido',
      componentes: {
        lucroLiquido: ll,
        capitalInvestido: ci
      },
      interpretacao: ci > 0
        ? 'Para cada R$ 1,00 investido, a empresa gera R$ ' + _formatarNumero(valor, 2) + ' de retorno.'
        : 'Capital investido insuficiente para cálculo do ROI.',
      classificacao: classificar(valor, ref, false),
      referenciasSetor: ref,
      alertas: alertas
    };
  }

  /**
   * ROE — Retorno sobre o Patrimônio Líquido
   * ROE = Lucro Líquido / Patrimônio Líquido Médio
   */
  function calcularROE(lucroLiquido, plMedio, setor) {
    var ll = validarNumero(lucroLiquido);
    var pl = validarNumero(plMedio);
    var valor = dividirSeguro(ll, pl);
    var ref = _obterReferencia(setor, 'roe');
    var alertas = [];

    if (pl <= 0) {
      alertas.push('Patrimônio Líquido zero ou negativo; ROE distorcido. Possível passivo a descoberto.');
    }
    if (valor > 0.50) {
      alertas.push('ROE acima de 50% pode indicar alavancagem excessiva ou PL muito baixo.');
    }
    if (valor < 0) {
      alertas.push('ROE negativo: empresa teve prejuízo no período.');
    }

    return {
      sigla: 'ROE',
      nome: 'Retorno sobre Patrimônio Líquido',
      valor: arredondar(valor, 4),
      valorFormatado: _formatarPercentual(valor),
      formula: 'Lucro Líquido / PL Médio',
      componentes: {
        lucroLiquido: ll,
        plMedio: pl
      },
      interpretacao: pl > 0
        ? 'Para cada R$ 1,00 investido pelos sócios, a empresa gera R$ ' + _formatarNumero(valor, 2) + ' de lucro.'
        : 'Patrimônio Líquido negativo impossibilita interpretação direta.',
      classificacao: classificar(valor, ref, false),
      referenciasSetor: ref,
      alertas: alertas
    };
  }

  /**
   * ROA — Retorno sobre o Ativo Total
   * ROA = Lucro Líquido / Ativo Total Médio
   */
  function calcularROA(lucroLiquido, ativoTotalMedio, setor) {
    var ll = validarNumero(lucroLiquido);
    var at = validarNumero(ativoTotalMedio);
    var valor = dividirSeguro(ll, at);
    var ref = _obterReferencia(setor, 'roa');
    var alertas = [];

    if (at <= 0) {
      alertas.push('Ativo total zero ou negativo; ROA não calculável.');
    }
    if (valor < 0) {
      alertas.push('ROA negativo: empresa não está gerando retorno sobre seus ativos.');
    }

    return {
      sigla: 'ROA',
      nome: 'Retorno sobre o Ativo Total',
      valor: arredondar(valor, 4),
      valorFormatado: _formatarPercentual(valor),
      formula: 'Lucro Líquido / Ativo Total Médio',
      componentes: {
        lucroLiquido: ll,
        ativoTotalMedio: at
      },
      interpretacao: at > 0
        ? 'Para cada R$ 1,00 em ativos, a empresa gera R$ ' + _formatarNumero(valor, 2) + ' de lucro.'
        : 'Ativo total insuficiente para cálculo do ROA.',
      classificacao: classificar(valor, ref, false),
      referenciasSetor: ref,
      alertas: alertas
    };
  }

  /**
   * ROIC — Retorno sobre o Capital Investido
   * ROIC = NOPAT / Capital Investido (PL + Dívida Líquida)
   */
  function calcularROIC(nopat, capitalInvestido, setor) {
    var np = validarNumero(nopat);
    var ci = validarNumero(capitalInvestido);
    var valor = dividirSeguro(np, ci);
    var ref = _obterReferencia(setor, 'roic');
    var alertas = [];

    if (ci <= 0) {
      alertas.push('Capital investido zero ou negativo; ROIC distorcido.');
    }
    if (valor < 0) {
      alertas.push('ROIC negativo indica destruição de valor operacional.');
    }

    return {
      sigla: 'ROIC',
      nome: 'Retorno sobre Capital Investido',
      valor: arredondar(valor, 4),
      valorFormatado: _formatarPercentual(valor),
      formula: 'NOPAT / (PL + Dívida Líquida)',
      componentes: {
        nopat: np,
        capitalInvestido: ci
      },
      interpretacao: ci > 0
        ? 'A operação gera um retorno de ' + _formatarPercentual(valor) + ' sobre o capital total investido.'
        : 'Capital investido insuficiente para análise.',
      classificacao: classificar(valor, ref, false),
      referenciasSetor: ref,
      alertas: alertas
    };
  }

  /**
   * EVA — Economic Value Added (Valor Econômico Agregado)
   * EVA = NOPAT - (Capital Investido × WACC)
   */
  function calcularEVA(nopat, capitalInvestido, wacc, setor) {
    var np = validarNumero(nopat);
    var ci = validarNumero(capitalInvestido);
    var w = validarNumero(wacc);
    var custoCapital = ci * w;
    var valor = np - custoCapital;
    var alertas = [];

    if (w <= 0) {
      alertas.push('WACC não informado ou zero; EVA calculado sem custo de capital.');
    }
    if (valor < 0) {
      alertas.push('EVA negativo: a empresa não cobre o custo de oportunidade do capital.');
    }

    return {
      sigla: 'EVA',
      nome: 'Valor Econômico Agregado',
      valor: arredondar(valor, 2),
      valorFormatado: formatarMoeda(valor),
      formula: 'NOPAT - (Capital Investido × WACC)',
      componentes: {
        nopat: np,
        capitalInvestido: ci,
        wacc: w,
        custoCapital: arredondar(custoCapital, 2)
      },
      interpretacao: valor >= 0
        ? 'A empresa gerou R$ ' + formatarMoeda(valor) + ' acima do custo de capital, criando valor para os sócios.'
        : 'A empresa destruiu R$ ' + formatarMoeda(Math.abs(valor)) + ' de valor, pois não cobre o custo de oportunidade.',
      classificacao: valor > 0 ? 'bom' : (valor === 0 ? 'regular' : 'ruim'),
      referenciasSetor: null,
      alertas: alertas
    };
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // 3.2 — INDICADORES DE MARGENS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Margem Bruta = Lucro Bruto / Receita Líquida
   */
  function calcularMargemBruta(lucroBruto, receitaLiquida, setor) {
    var lb = validarNumero(lucroBruto);
    var rl = validarNumero(receitaLiquida);
    var valor = dividirSeguro(lb, rl);
    var ref = _obterReferencia(setor, 'margemBruta');
    var alertas = [];

    if (rl <= 0) {
      alertas.push('Receita Líquida zero ou negativa; margem não calculável.');
    }
    if (valor < 0.15) {
      alertas.push('Margem bruta muito baixa; avaliar política de preços e custos de produção.');
    }

    return {
      sigla: 'MB',
      nome: 'Margem Bruta',
      valor: arredondar(valor, 4),
      valorFormatado: _formatarPercentual(valor),
      formula: 'Lucro Bruto / Receita Líquida',
      componentes: {
        lucroBruto: lb,
        receitaLiquida: rl
      },
      interpretacao: rl > 0
        ? 'De cada R$ 1,00 de receita, R$ ' + _formatarNumero(valor, 2) + ' ficam após custos diretos de produção.'
        : 'Receita insuficiente para análise.',
      classificacao: classificar(valor, ref, false),
      referenciasSetor: ref,
      alertas: alertas
    };
  }

  /**
   * Margem Operacional = EBIT / Receita Líquida
   */
  function calcularMargemOperacional(ebit, receitaLiquida, setor) {
    var eb = validarNumero(ebit);
    var rl = validarNumero(receitaLiquida);
    var valor = dividirSeguro(eb, rl);
    var ref = _obterReferencia(setor, 'margemEBITDA'); // Usa EBITDA como proxy
    var alertas = [];

    if (rl <= 0) {
      alertas.push('Receita Líquida zero ou negativa; margem não calculável.');
    }
    if (valor < 0) {
      alertas.push('Margem operacional negativa indica prejuízo na atividade principal.');
    }

    return {
      sigla: 'MO',
      nome: 'Margem Operacional (EBIT)',
      valor: arredondar(valor, 4),
      valorFormatado: _formatarPercentual(valor),
      formula: 'EBIT / Receita Líquida',
      componentes: {
        ebit: eb,
        receitaLiquida: rl
      },
      interpretacao: rl > 0
        ? 'De cada R$ 1,00 de receita, R$ ' + _formatarNumero(valor, 2) + ' são lucro operacional (antes de juros e impostos).'
        : 'Receita insuficiente para análise.',
      classificacao: classificar(valor, ref, false),
      referenciasSetor: ref,
      alertas: alertas
    };
  }

  /**
   * Margem EBITDA = EBITDA / Receita Líquida
   */
  function calcularMargemEBITDA(ebitda, receitaLiquida, setor) {
    var ebt = validarNumero(ebitda);
    var rl = validarNumero(receitaLiquida);
    var valor = dividirSeguro(ebt, rl);
    var ref = _obterReferencia(setor, 'margemEBITDA');
    var alertas = [];

    if (rl <= 0) {
      alertas.push('Receita Líquida zero ou negativa; margem não calculável.');
    }
    if (valor < 0) {
      alertas.push('EBITDA negativo: a operação não gera caixa operacional.');
    }
    if (valor > 0.60) {
      alertas.push('Margem EBITDA muito alta; validar se D&A foi corretamente somada ao EBIT.');
    }

    return {
      sigla: 'MEBITDA',
      nome: 'Margem EBITDA',
      valor: arredondar(valor, 4),
      valorFormatado: _formatarPercentual(valor),
      formula: 'EBITDA / Receita Líquida',
      componentes: {
        ebitda: ebt,
        receitaLiquida: rl
      },
      interpretacao: rl > 0
        ? 'De cada R$ 1,00 de receita, R$ ' + _formatarNumero(valor, 2) + ' viram caixa operacional (antes de juros, impostos, depreciação e amortização).'
        : 'Receita insuficiente para análise.',
      classificacao: classificar(valor, ref, false),
      referenciasSetor: ref,
      alertas: alertas
    };
  }

  /**
   * Margem Líquida = Lucro Líquido / Receita Líquida
   */
  function calcularMargemLiquida(lucroLiquido, receitaLiquida, setor) {
    var ll = validarNumero(lucroLiquido);
    var rl = validarNumero(receitaLiquida);
    var valor = dividirSeguro(ll, rl);
    var ref = _obterReferencia(setor, 'margemLiquida');
    var alertas = [];

    if (rl <= 0) {
      alertas.push('Receita Líquida zero ou negativa; margem não calculável.');
    }
    if (valor < 0) {
      alertas.push('Margem líquida negativa: empresa operou com prejuízo.');
    }
    if (valor < 0.03 && valor >= 0) {
      alertas.push('Margem líquida muito apertada; qualquer oscilação pode gerar prejuízo.');
    }

    return {
      sigla: 'ML',
      nome: 'Margem Líquida',
      valor: arredondar(valor, 4),
      valorFormatado: _formatarPercentual(valor),
      formula: 'Lucro Líquido / Receita Líquida',
      componentes: {
        lucroLiquido: ll,
        receitaLiquida: rl
      },
      interpretacao: rl > 0
        ? 'De cada R$ 1,00 de receita, R$ ' + _formatarNumero(valor, 2) + ' ficam como lucro final para os sócios.'
        : 'Receita insuficiente para análise.',
      classificacao: classificar(valor, ref, false),
      referenciasSetor: ref,
      alertas: alertas
    };
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // 3.3 — INDICADORES DE LIQUIDEZ / SOLVÊNCIA
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Liquidez Corrente = Ativo Circulante / Passivo Circulante
   */
  function calcularLiquidezCorrente(ac, pc, setor) {
    var ativoCirc = validarNumero(ac);
    var passivoCirc = validarNumero(pc);
    var valor = dividirSeguro(ativoCirc, passivoCirc);
    var ref = _obterReferencia(setor, 'liquidezCorrente');
    var alertas = [];

    if (passivoCirc <= 0) {
      alertas.push('Passivo circulante zero; empresa sem obrigações de curto prazo registradas.');
    }
    if (valor < 1.0 && passivoCirc > 0) {
      alertas.push('Liquidez corrente abaixo de 1,0: ativo circulante não cobre passivo de curto prazo.');
    }
    if (valor > 3.0) {
      alertas.push('Liquidez muito elevada pode indicar capital ocioso ou baixo aproveitamento de ativos.');
    }

    return {
      sigla: 'LC',
      nome: 'Liquidez Corrente',
      valor: arredondar(valor, 4),
      valorFormatado: _formatarMultiplo(valor),
      formula: 'Ativo Circulante / Passivo Circulante',
      componentes: {
        ativoCirculante: ativoCirc,
        passivoCirculante: passivoCirc
      },
      interpretacao: passivoCirc > 0
        ? 'Para cada R$ 1,00 de dívida de curto prazo, a empresa possui R$ ' + _formatarNumero(valor, 2) + ' em ativos de curto prazo.'
        : 'Sem passivo circulante para referência.',
      classificacao: classificar(valor, ref, false),
      referenciasSetor: ref,
      alertas: alertas
    };
  }

  /**
   * Liquidez Seca = (AC - Estoques) / PC
   */
  function calcularLiquidezSeca(ac, estoques, pc, setor) {
    var ativoCirc = validarNumero(ac);
    var est = validarNumero(estoques);
    var passivoCirc = validarNumero(pc);
    var numerador = ativoCirc - est;
    var valor = dividirSeguro(numerador, passivoCirc);
    var ref = _obterReferencia(setor, 'liquidezCorrente'); // Proxy: LC com desconto
    var alertas = [];

    if (passivoCirc <= 0) {
      alertas.push('Passivo circulante zero.');
    }
    if (valor < 0.80 && passivoCirc > 0) {
      alertas.push('Liquidez seca abaixo de 0,8: sem estoques, não há cobertura para o curto prazo.');
    }

    return {
      sigla: 'LS',
      nome: 'Liquidez Seca',
      valor: arredondar(valor, 4),
      valorFormatado: _formatarMultiplo(valor),
      formula: '(AC - Estoques) / PC',
      componentes: {
        ativoCirculante: ativoCirc,
        estoques: est,
        passivoCirculante: passivoCirc
      },
      interpretacao: passivoCirc > 0
        ? 'Excluindo estoques, a empresa possui R$ ' + _formatarNumero(valor, 2) + ' para cada R$ 1,00 de dívida de curto prazo.'
        : 'Sem passivo circulante para referência.',
      classificacao: classificar(valor, ref, false),
      referenciasSetor: ref,
      alertas: alertas
    };
  }

  /**
   * Liquidez Imediata = (Caixa + Aplicações Financeiras) / PC
   */
  function calcularLiquidezImediata(caixa, aplicacoes, pc, setor) {
    var cx = validarNumero(caixa);
    var ap = validarNumero(aplicacoes);
    var passivoCirc = validarNumero(pc);
    var numerador = cx + ap;
    var valor = dividirSeguro(numerador, passivoCirc);
    var alertas = [];

    if (passivoCirc <= 0) {
      alertas.push('Passivo circulante zero.');
    }
    if (valor < 0.20 && passivoCirc > 0) {
      alertas.push('Liquidez imediata muito baixa; empresa pode ter dificuldade para honrar pagamentos imediatos.');
    }

    return {
      sigla: 'LI',
      nome: 'Liquidez Imediata',
      valor: arredondar(valor, 4),
      valorFormatado: _formatarMultiplo(valor),
      formula: '(Caixa + Aplicações) / PC',
      componentes: {
        caixa: cx,
        aplicacoesFinanceiras: ap,
        passivoCirculante: passivoCirc
      },
      interpretacao: passivoCirc > 0
        ? 'Com o dinheiro disponível imediatamente, a empresa cobre ' + _formatarPercentual(valor) + ' do passivo de curto prazo.'
        : 'Sem passivo circulante para referência.',
      classificacao: valor >= 0.40 ? 'bom' : (valor >= 0.20 ? 'regular' : 'ruim'),
      referenciasSetor: null,
      alertas: alertas
    };
  }

  /**
   * Dívida Líquida / EBITDA (INVERSO — menor = melhor)
   */
  function calcularDividaEBITDA(dividaLiquida, ebitda, setor) {
    var dl = validarNumero(dividaLiquida);
    var ebt = validarNumero(ebitda);
    var valor = dividirSeguro(dl, ebt);
    var ref = _obterReferencia(setor, 'dividaEbitda');
    var alertas = [];

    if (ebt <= 0) {
      alertas.push('EBITDA zero ou negativo; indicador DL/EBITDA distorcido.');
    }
    if (dl < 0) {
      alertas.push('Dívida líquida negativa: a empresa possui mais caixa do que dívida (posição excelente).');
    }
    if (valor > 4.0 && ebt > 0) {
      alertas.push('Endividamento elevado (acima de 4x EBITDA). Risco de estresse financeiro.');
    }
    if (valor > 6.0 && ebt > 0) {
      alertas.push('ATENÇÃO: Endividamento crítico. Renegociação de dívidas pode ser necessária.');
    }

    return {
      sigla: 'DL/EBITDA',
      nome: 'Dívida Líquida / EBITDA',
      valor: arredondar(valor, 2),
      valorFormatado: _formatarMultiplo(valor),
      formula: 'Dívida Líquida / EBITDA',
      componentes: {
        dividaLiquida: dl,
        ebitda: ebt
      },
      interpretacao: ebt > 0
        ? 'Seriam necessários ' + _formatarNumero(valor, 1) + ' anos de geração de caixa operacional para quitar a dívida líquida.'
        : 'EBITDA insuficiente para análise de endividamento.',
      classificacao: classificar(valor, ref, true),
      referenciasSetor: ref,
      alertas: alertas
    };
  }

  /**
   * Dívida / PL (Debt-to-Equity)
   */
  function calcularDividaPL(dividaTotal, pl, setor) {
    var dt = validarNumero(dividaTotal);
    var patrimonio = validarNumero(pl);
    var valor = dividirSeguro(dt, patrimonio);
    var alertas = [];

    if (patrimonio <= 0) {
      alertas.push('Patrimônio Líquido zero ou negativo; D/PL distorcido.');
    }
    if (valor > 2.0) {
      alertas.push('Dívida ultrapassa 2x o patrimônio; empresa muito alavancada.');
    }
    if (valor > 3.0) {
      alertas.push('ATENÇÃO: Alavancagem excessiva. Risco elevado de insolvência.');
    }

    return {
      sigla: 'D/PL',
      nome: 'Dívida Total / Patrimônio Líquido',
      valor: arredondar(valor, 4),
      valorFormatado: _formatarMultiplo(valor),
      formula: 'Dívida Total / PL',
      componentes: {
        dividaTotal: dt,
        patrimonioLiquido: patrimonio
      },
      interpretacao: patrimonio > 0
        ? 'Para cada R$ 1,00 de capital próprio, a empresa deve R$ ' + _formatarNumero(valor, 2) + ' a terceiros.'
        : 'PL negativo impossibilita interpretação.',
      classificacao: valor <= 0.50 ? 'excelente' : (valor <= 1.0 ? 'bom' : (valor <= 2.0 ? 'regular' : 'ruim')),
      referenciasSetor: null,
      alertas: alertas
    };
  }

  /**
   * Cobertura de Juros = EBIT / Despesas Financeiras
   */
  function calcularCoberturaJuros(ebit, despesasFinanceiras, setor) {
    var eb = validarNumero(ebit);
    var df = validarNumero(despesasFinanceiras);
    // despesasFinanceiras deve ser positivo (é uma despesa)
    var dfPos = Math.abs(df);
    var valor = dividirSeguro(eb, dfPos);
    var ref = _obterReferencia(setor, 'coberturaJuros');
    var alertas = [];

    if (dfPos <= 0) {
      alertas.push('Sem despesas financeiras registradas; empresa sem endividamento bancário.');
    }
    if (valor < 1.5 && dfPos > 0) {
      alertas.push('Cobertura de juros insuficiente; EBIT mal cobre os juros da dívida.');
    }
    if (valor < 1.0 && dfPos > 0) {
      alertas.push('ATENÇÃO: EBIT não cobre juros. Empresa consome caixa para pagar financiamentos.');
    }

    return {
      sigla: 'ICJ',
      nome: 'Índice de Cobertura de Juros',
      valor: arredondar(valor, 2),
      valorFormatado: _formatarMultiplo(valor),
      formula: 'EBIT / Despesas Financeiras',
      componentes: {
        ebit: eb,
        despesasFinanceiras: dfPos
      },
      interpretacao: dfPos > 0
        ? 'O lucro operacional cobre ' + _formatarNumero(valor, 1) + ' vezes as despesas financeiras.'
        : 'Empresa sem despesas financeiras relevantes.',
      classificacao: classificar(valor, ref, false),
      referenciasSetor: ref,
      alertas: alertas
    };
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // 3.4 — INDICADORES DE EFICIÊNCIA
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Giro do Ativo = Receita Líquida / Ativo Total Médio
   */
  function calcularGiroAtivo(receitaLiquida, ativoTotalMedio, setor) {
    var rl = validarNumero(receitaLiquida);
    var at = validarNumero(ativoTotalMedio);
    var valor = dividirSeguro(rl, at);
    var ref = _obterReferencia(setor, 'giroAtivo');
    var alertas = [];

    if (at <= 0) {
      alertas.push('Ativo total zero ou negativo; giro não calculável.');
    }
    if (valor < 0.30) {
      alertas.push('Giro do ativo muito baixo; empresa pode estar com ativos subutilizados.');
    }

    return {
      sigla: 'GA',
      nome: 'Giro do Ativo',
      valor: arredondar(valor, 4),
      valorFormatado: _formatarMultiplo(valor),
      formula: 'Receita Líquida / Ativo Total Médio',
      componentes: {
        receitaLiquida: rl,
        ativoTotalMedio: at
      },
      interpretacao: at > 0
        ? 'Cada R$ 1,00 em ativos gera R$ ' + _formatarNumero(valor, 2) + ' de receita por ano.'
        : 'Ativo insuficiente para análise.',
      classificacao: classificar(valor, ref, false),
      referenciasSetor: ref,
      alertas: alertas
    };
  }

  /**
   * PMR — Prazo Médio de Recebimento (dias)
   * PMR = (Contas a Receber / Receita Bruta) × 360
   * INVERSO — menor = melhor
   */
  function calcularPMR(contasReceber, receitaBruta, setor) {
    var cr = validarNumero(contasReceber);
    var rb = validarNumero(receitaBruta);
    var valor = dividirSeguro(cr, rb) * 360;
    var ref = _obterReferencia(setor, 'pmr');
    var alertas = [];

    if (rb <= 0) {
      alertas.push('Receita bruta zero; PMR não calculável.');
    }
    if (valor > 90) {
      alertas.push('Prazo de recebimento acima de 90 dias. Avaliar política de crédito e cobrança.');
    }
    if (valor > 120) {
      alertas.push('ATENÇÃO: PMR crítico. Risco de inadimplência e descasamento de caixa.');
    }

    return {
      sigla: 'PMR',
      nome: 'Prazo Médio de Recebimento',
      valor: arredondar(valor, 0),
      valorFormatado: _formatarDias(valor),
      formula: '(Contas a Receber / Receita Bruta) × 360',
      componentes: {
        contasReceber: cr,
        receitaBruta: rb
      },
      interpretacao: rb > 0
        ? 'A empresa leva em média ' + Math.round(valor) + ' dias para receber de seus clientes.'
        : 'Receita insuficiente para análise.',
      classificacao: classificar(valor, ref, true),
      referenciasSetor: ref,
      alertas: alertas
    };
  }

  /**
   * PMP — Prazo Médio de Pagamento (dias)
   * PMP = (Fornecedores / CMV) × 360
   */
  function calcularPMP(fornecedores, cmv, setor) {
    var fn = validarNumero(fornecedores);
    var c = validarNumero(cmv);
    var valor = dividirSeguro(fn, c) * 360;
    var alertas = [];

    if (c <= 0) {
      alertas.push('CMV zero; PMP não calculável (possível empresa de serviços puro).');
    }
    if (valor > 120) {
      alertas.push('PMP acima de 120 dias pode indicar atraso nos pagamentos a fornecedores.');
    }

    return {
      sigla: 'PMP',
      nome: 'Prazo Médio de Pagamento',
      valor: arredondar(valor, 0),
      valorFormatado: _formatarDias(valor),
      formula: '(Fornecedores / CMV) × 360',
      componentes: {
        fornecedores: fn,
        cmv: c
      },
      interpretacao: c > 0
        ? 'A empresa demora em média ' + Math.round(valor) + ' dias para pagar seus fornecedores.'
        : 'Sem CMV; empresa pode não ter compras significativas.',
      classificacao: valor >= 45 ? 'bom' : (valor >= 30 ? 'regular' : 'ruim'),
      referenciasSetor: null,
      alertas: alertas
    };
  }

  /**
   * PME — Prazo Médio de Estoque (dias)
   * PME = (Estoques / CMV) × 360
   * INVERSO — menor = melhor (giro mais rápido)
   */
  function calcularPME(estoques, cmv, setor) {
    var est = validarNumero(estoques);
    var c = validarNumero(cmv);
    var valor = dividirSeguro(est, c) * 360;
    var alertas = [];

    if (c <= 0) {
      alertas.push('CMV zero; PME não calculável (possível empresa de serviços).');
    }
    if (valor > 90) {
      alertas.push('Estoque parado acima de 90 dias. Avaliar obsolescência e giro.');
    }
    if (valor > 150) {
      alertas.push('ATENÇÃO: Estoque muito parado; risco de perda por obsolescência.');
    }

    return {
      sigla: 'PME',
      nome: 'Prazo Médio de Estoque',
      valor: arredondar(valor, 0),
      valorFormatado: _formatarDias(valor),
      formula: '(Estoques / CMV) × 360',
      componentes: {
        estoques: est,
        cmv: c
      },
      interpretacao: c > 0
        ? 'O estoque leva em média ' + Math.round(valor) + ' dias para ser vendido.'
        : 'Sem CMV; empresa pode não ter estoques relevantes.',
      classificacao: valor <= 30 ? 'excelente' : (valor <= 60 ? 'bom' : (valor <= 90 ? 'regular' : 'ruim')),
      referenciasSetor: null,
      alertas: alertas
    };
  }

  /**
   * Ciclo Operacional = PMR + PME
   */
  function calcularCicloOperacional(pmr, pme) {
    var p = validarNumero(pmr);
    var e = validarNumero(pme);
    var valor = p + e;
    var alertas = [];

    if (valor > 150) {
      alertas.push('Ciclo operacional longo; capital fica preso por muitos dias.');
    }

    return {
      sigla: 'CO',
      nome: 'Ciclo Operacional',
      valor: arredondar(valor, 0),
      valorFormatado: _formatarDias(valor),
      formula: 'PMR + PME',
      componentes: {
        pmr: p,
        pme: e
      },
      interpretacao: 'Da compra do insumo até o recebimento do cliente, passam-se ' + Math.round(valor) + ' dias.',
      classificacao: valor <= 45 ? 'excelente' : (valor <= 75 ? 'bom' : (valor <= 120 ? 'regular' : 'ruim')),
      referenciasSetor: null,
      alertas: alertas
    };
  }

  /**
   * Ciclo Financeiro = PMR + PME - PMP
   * INVERSO — menor = melhor (menos dias financiando operação)
   */
  function calcularCicloFinanceiro(pmr, pme, pmp, setor) {
    var p = validarNumero(pmr);
    var e = validarNumero(pme);
    var m = validarNumero(pmp);
    var valor = p + e - m;
    var ref = _obterReferencia(setor, 'cicloFinanceiro');
    var alertas = [];

    if (valor < 0) {
      alertas.push('Ciclo financeiro negativo: empresa recebe antes de pagar (posição favorável de caixa).');
    }
    if (valor > 100) {
      alertas.push('Ciclo financeiro longo: a empresa precisa financiar muitos dias de operação com capital próprio.');
    }

    return {
      sigla: 'CF',
      nome: 'Ciclo Financeiro',
      valor: arredondar(valor, 0),
      valorFormatado: _formatarDias(valor),
      formula: 'PMR + PME - PMP',
      componentes: {
        pmr: p,
        pme: e,
        pmp: m
      },
      interpretacao: valor >= 0
        ? 'A empresa financia ' + Math.round(valor) + ' dias de operação com recursos próprios.'
        : 'A empresa opera com ciclo negativo: recebe antes de pagar (capital de giro positivo natural).',
      classificacao: classificar(valor, ref, true),
      referenciasSetor: ref,
      alertas: alertas
    };
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // 3.5 — INDICADORES DE CRESCIMENTO
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * CAGR — delega para Core
   */
  function calcularCAGR(valorInicial, valorFinal, anos) {
    var vi = validarNumero(valorInicial);
    var vf = validarNumero(valorFinal);
    var a = validarNumero(anos);
    var valor = calcularCAGRCore(vi, vf, a);
    var alertas = [];

    if (vi <= 0 || vf <= 0) {
      alertas.push('Valores iniciais ou finais negativos/zero; CAGR não calculável.');
    }
    if (a <= 0) {
      alertas.push('Período inválido para cálculo do CAGR.');
    }

    return {
      sigla: 'CAGR',
      nome: 'Taxa de Crescimento Anual Composta',
      valor: arredondar(valor, 4),
      valorFormatado: _formatarPercentual(valor),
      formula: '(Valor Final / Valor Inicial) ^ (1/n) - 1',
      componentes: {
        valorInicial: vi,
        valorFinal: vf,
        anos: a
      },
      interpretacao: a > 0 && vi > 0 && vf > 0
        ? 'O valor cresceu a uma taxa média de ' + _formatarPercentual(valor) + ' ao ano nos últimos ' + a + ' anos.'
        : 'Dados insuficientes para cálculo do CAGR.',
      classificacao: valor > 0.15 ? 'excelente' : (valor > 0.08 ? 'bom' : (valor > 0.03 ? 'regular' : 'ruim')),
      referenciasSetor: null,
      alertas: alertas
    };
  }

  /**
   * Crescimento YoY — delega para Core
   */
  function calcularCrescimentoYoY(valorAtual, valorAnterior) {
    var va = validarNumero(valorAtual);
    var vant = validarNumero(valorAnterior);
    var valor = calcularCrescimentoYoYCore(va, vant);
    var alertas = [];

    if (vant === 0) {
      alertas.push('Valor anterior zero; crescimento YoY não calculável.');
    }
    if (valor < -0.20) {
      alertas.push('Queda superior a 20% no período. Investigar causas.');
    }

    return {
      sigla: 'YoY',
      nome: 'Crescimento Ano a Ano',
      valor: arredondar(valor, 4),
      valorFormatado: _formatarPercentual(valor),
      formula: '(Valor Atual - Valor Anterior) / |Valor Anterior|',
      componentes: {
        valorAtual: va,
        valorAnterior: vant
      },
      interpretacao: vant !== 0
        ? (valor >= 0
          ? 'Crescimento de ' + _formatarPercentual(valor) + ' em relação ao período anterior.'
          : 'Queda de ' + _formatarPercentual(Math.abs(valor)) + ' em relação ao período anterior.')
        : 'Sem valor anterior para comparação.',
      classificacao: valor > 0.15 ? 'excelente' : (valor > 0.05 ? 'bom' : (valor >= 0 ? 'regular' : 'ruim')),
      referenciasSetor: null,
      alertas: alertas
    };
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // 3.6 — ANÁLISE DUPONT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Decompõe o ROE em 3 componentes (Análise Dupont):
   *   ROE = Margem Líquida × Giro do Ativo × Multiplicador de Alavancagem
   *
   * @param {number} lucroLiquido
   * @param {number} receita - Receita Líquida
   * @param {number} ativo   - Ativo Total
   * @param {number} pl      - Patrimônio Líquido
   * @returns {Object} Decomposição Dupont com análise e recomendações
   */
  function calcularDupont(lucroLiquido, receita, ativo, pl) {
    var ll = validarNumero(lucroLiquido);
    var r = validarNumero(receita);
    var a = validarNumero(ativo);
    var p = validarNumero(pl);

    var margemLiq = dividirSeguro(ll, r);
    var giroAt = dividirSeguro(r, a);
    var multiplicadorAlavancagem = dividirSeguro(a, p);
    var roe = margemLiq * giroAt * multiplicadorAlavancagem;

    // Verificação: ROE via Dupont deve bater com cálculo direto
    var roeDireto = dividirSeguro(ll, p);
    var diferencaROE = Math.abs(roe - roeDireto);

    // Identificar qual componente mais contribui para o ROE
    // Normalizar componentes para comparação relativa
    var componentes = [
      { nome: 'margemLiquida', valor: margemLiq, label: 'Margem Líquida' },
      { nome: 'giroAtivo', valor: giroAt, label: 'Giro do Ativo' },
      { nome: 'alavancagem', valor: multiplicadorAlavancagem, label: 'Alavancagem Financeira' }
    ];

    // O principal driver é o que mais se destaca (positiva ou negativamente)
    // Benchmark teórico: margem ~10%, giro ~1.0x, alavancagem ~2.0x
    var benchmarks = { margemLiquida: 0.10, giroAtivo: 1.0, alavancagem: 2.0 };
    var desvios = [];
    for (var i = 0; i < componentes.length; i++) {
      var comp = componentes[i];
      var bench = benchmarks[comp.nome];
      var desvio = bench > 0 ? (comp.valor - bench) / bench : 0;
      desvios.push({ nome: comp.nome, label: comp.label, valor: comp.valor, desvio: desvio });
    }

    // Ordenar por desvio absoluto (maior desvio = maior influência)
    desvios.sort(function (x, y) { return Math.abs(y.desvio) - Math.abs(x.desvio); });
    var principalDriver = desvios[0].label;

    // Recomendações baseadas nos componentes
    var recomendacoes = [];

    if (margemLiq < 0.05) {
      recomendacoes.push('Aumentar margem líquida: revisar precificação, reduzir custos fixos ou renegociar tributação.');
    }
    if (margemLiq > 0.25) {
      recomendacoes.push('Margem líquida elevada. Boa eficiência de custos. Manter controle sobre despesas.');
    }
    if (giroAt < 0.50) {
      recomendacoes.push('Giro do ativo baixo: empresa pode ter ativos ociosos. Avaliar venda de ativos improdutivos ou aumento de receita.');
    }
    if (giroAt > 1.50) {
      recomendacoes.push('Excelente giro do ativo. Empresa usa seus recursos de forma eficiente.');
    }
    if (multiplicadorAlavancagem > 3.0) {
      recomendacoes.push('Alavancagem elevada: risco financeiro maior. Considerar aumento do PL ou redução de dívidas.');
    }
    if (multiplicadorAlavancagem < 1.5) {
      recomendacoes.push('Baixa alavancagem: empresa é conservadora. Pode explorar financiamento para crescer, se o custo for inferior ao ROIC.');
    }
    if (roe < 0) {
      recomendacoes.push('ROE negativo: priorizar retorno à lucratividade antes de qualquer decisão de investimento.');
    }
    if (recomendacoes.length === 0) {
      recomendacoes.push('Indicadores Dupont dentro de faixas saudáveis. Manter monitoramento periódico.');
    }

    return {
      margemLiquida: arredondar(margemLiq, 4),
      giroAtivo: arredondar(giroAt, 4),
      multiplicadorAlavancagem: arredondar(multiplicadorAlavancagem, 4),
      roe: arredondar(roe, 4),
      roeDireto: arredondar(roeDireto, 4),
      consistente: diferencaROE < 0.0001,
      componentes: {
        lucroLiquido: ll,
        receita: r,
        ativo: a,
        patrimonioLiquido: p
      },
      analise: {
        principalDriver: principalDriver,
        ranking: desvios,
        recomendacoes: recomendacoes
      },
      interpretacao: 'ROE de ' + _formatarPercentual(roe) + ' é composto por: '
        + 'Margem Líquida ' + _formatarPercentual(margemLiq) + ' × '
        + 'Giro do Ativo ' + _formatarMultiplo(giroAt) + ' × '
        + 'Alavancagem ' + _formatarMultiplo(multiplicadorAlavancagem) + '. '
        + 'Principal driver: ' + principalDriver + '.'
    };
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // 3.7 — SCORECARD
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Converte classificação em nota numérica (0-10).
   */
  function _notaDaClassificacao(classificacao) {
    switch (classificacao) {
      case 'excelente': return 10;
      case 'bom': return 7.5;
      case 'regular': return 5;
      case 'ruim': return 2.5;
      default: return 0;
    }
  }

  /**
   * Calcula a média de notas de um grupo de indicadores.
   */
  function _mediaNotas(indicadores) {
    if (!indicadores || indicadores.length === 0) return 0;
    var soma = 0;
    var count = 0;
    for (var i = 0; i < indicadores.length; i++) {
      var nota = _notaDaClassificacao(indicadores[i].classificacao);
      if (nota > 0 || indicadores[i].classificacao === 'ruim') {
        soma += nota;
        count++;
      }
    }
    return count > 0 ? soma / count : 0;
  }

  /**
   * Gera um scorecard consolidado da empresa, agrupando indicadores
   * em 4 categorias com pesos diferenciados.
   *
   * @param {Object} indicadores - Resultado de calcularTodosIndicadores()
   * @param {string} setor       - Chave do setor
   * @returns {Object} Scorecard com notas por grupo e nota geral
   */
  function gerarScorecard(indicadores, setor) {
    // Agrupa indicadores por categoria
    var grupoRentabilidade = [];
    var grupoMargens = [];
    var grupoLiquidez = [];
    var grupoEficiencia = [];

    // Rentabilidade
    if (indicadores.rentabilidade) {
      var rent = indicadores.rentabilidade;
      if (rent.roi) grupoRentabilidade.push(rent.roi);
      if (rent.roe) grupoRentabilidade.push(rent.roe);
      if (rent.roa) grupoRentabilidade.push(rent.roa);
      if (rent.roic) grupoRentabilidade.push(rent.roic);
    }

    // Margens
    if (indicadores.margens) {
      var marg = indicadores.margens;
      if (marg.margemBruta) grupoMargens.push(marg.margemBruta);
      if (marg.margemOperacional) grupoMargens.push(marg.margemOperacional);
      if (marg.margemEBITDA) grupoMargens.push(marg.margemEBITDA);
      if (marg.margemLiquida) grupoMargens.push(marg.margemLiquida);
    }

    // Liquidez/Solvência
    if (indicadores.liquidez) {
      var liq = indicadores.liquidez;
      if (liq.liquidezCorrente) grupoLiquidez.push(liq.liquidezCorrente);
      if (liq.liquidezSeca) grupoLiquidez.push(liq.liquidezSeca);
      if (liq.liquidezImediata) grupoLiquidez.push(liq.liquidezImediata);
      if (liq.dividaEBITDA) grupoLiquidez.push(liq.dividaEBITDA);
      if (liq.dividaPL) grupoLiquidez.push(liq.dividaPL);
      if (liq.coberturaJuros) grupoLiquidez.push(liq.coberturaJuros);
    }

    // Eficiência
    if (indicadores.eficiencia) {
      var ef = indicadores.eficiencia;
      if (ef.giroAtivo) grupoEficiencia.push(ef.giroAtivo);
      if (ef.pmr) grupoEficiencia.push(ef.pmr);
      if (ef.cicloFinanceiro) grupoEficiencia.push(ef.cicloFinanceiro);
    }

    // Calcula notas por grupo
    var notaRentabilidade = arredondar(_mediaNotas(grupoRentabilidade), 1);
    var notaMargens = arredondar(_mediaNotas(grupoMargens), 1);
    var notaLiquidez = arredondar(_mediaNotas(grupoLiquidez), 1);
    var notaEficiencia = arredondar(_mediaNotas(grupoEficiencia), 1);

    // Nota geral ponderada
    // Pesos: rentabilidade 30%, margens 25%, liquidez 25%, eficiência 20%
    var PESO_RENTABILIDADE = 0.30;
    var PESO_MARGENS = 0.25;
    var PESO_LIQUIDEZ = 0.25;
    var PESO_EFICIENCIA = 0.20;

    var notaGeral = arredondar(
      notaRentabilidade * PESO_RENTABILIDADE
      + notaMargens * PESO_MARGENS
      + notaLiquidez * PESO_LIQUIDEZ
      + notaEficiencia * PESO_EFICIENCIA,
      1
    );

    // Classificação geral
    var classificacaoGeral;
    if (notaGeral >= 8.5) classificacaoGeral = 'excelente';
    else if (notaGeral >= 6.5) classificacaoGeral = 'bom';
    else if (notaGeral >= 4.5) classificacaoGeral = 'regular';
    else classificacaoGeral = 'ruim';

    // Resumo em texto
    var setorLabel = Core.SETORES_LABEL[setor] || setor;
    var resumo = 'Scorecard da empresa no setor de ' + setorLabel + ': '
      + 'nota geral ' + _formatarNumero(notaGeral, 1) + '/10 (' + classificacaoGeral + '). '
      + 'Rentabilidade: ' + _formatarNumero(notaRentabilidade, 1) + ', '
      + 'Margens: ' + _formatarNumero(notaMargens, 1) + ', '
      + 'Liquidez: ' + _formatarNumero(notaLiquidez, 1) + ', '
      + 'Eficiência: ' + _formatarNumero(notaEficiencia, 1) + '.';

    // Identificar pontos fortes e fracos
    var grupos = [
      { nome: 'Rentabilidade', nota: notaRentabilidade },
      { nome: 'Margens', nota: notaMargens },
      { nome: 'Liquidez/Solvência', nota: notaLiquidez },
      { nome: 'Eficiência', nota: notaEficiencia }
    ];

    grupos.sort(function (a, b) { return b.nota - a.nota; });
    var pontoForte = grupos[0].nome;
    var pontoFraco = grupos[grupos.length - 1].nome;

    if (grupos[0].nota > grupos[grupos.length - 1].nota + 2) {
      resumo += ' Destaque positivo em ' + pontoForte + '. Atenção a ' + pontoFraco + '.';
    }

    return {
      grupos: {
        rentabilidade: {
          nota: notaRentabilidade,
          peso: PESO_RENTABILIDADE,
          indicadores: grupoRentabilidade
        },
        margens: {
          nota: notaMargens,
          peso: PESO_MARGENS,
          indicadores: grupoMargens
        },
        liquidez: {
          nota: notaLiquidez,
          peso: PESO_LIQUIDEZ,
          indicadores: grupoLiquidez
        },
        eficiencia: {
          nota: notaEficiencia,
          peso: PESO_EFICIENCIA,
          indicadores: grupoEficiencia
        }
      },
      notaGeral: notaGeral,
      classificacaoGeral: classificacaoGeral,
      pontoForte: pontoForte,
      pontoFraco: pontoFraco,
      resumo: resumo
    };
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // 3.8 — CÁLCULO CONSOLIDADO DE TODOS OS INDICADORES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Calcula todos os indicadores financeiros a partir de DRE e Balanço.
   *
   * @param {Object} dre       - Resultado de Core.criarDRE()
   * @param {Object} balanco   - Resultado de Core.criarBalanco()
   * @param {string} setor     - Chave do setor (ex: 'tecnologia')
   * @param {Object} historico - Resultado opcional de Core.criarHistorico()
   * @returns {Object} Todos os indicadores agrupados + scorecard + dupont
   */
  function calcularTodosIndicadores(dre, balanco, setor, historico) {
    // Validação de inputs
    if (!dre || !dre.valido) {
      return { erro: true, mensagem: 'DRE inválida para cálculo de indicadores.' };
    }
    if (!balanco || !balanco.valido) {
      return { erro: true, mensagem: 'Balanço inválido para cálculo de indicadores.' };
    }

    // Normalizar setor
    var setorNorm = setor || 'servicos';
    if (SETORES_KEYS.indexOf(setorNorm) === -1) {
      setorNorm = 'servicos';
    }

    // Extrair dados do DRE
    var receitaLiquida = dre.receitaLiquida;
    var receitaBruta = dre.receitaBruta;
    var lucroBruto = dre.lucroBruto;
    var ebit = dre.ebit;
    var ebitda = dre.ebitda;
    var lucroLiquido = dre.lucroLiquido;
    var nopat = dre.nopat;
    var cmv = dre.cmv;
    var despesasFinanceiras = dre.despesasFinanceiras;

    // Extrair dados do Balanço
    var caixa = balanco.ativo.circulante.caixa;
    var aplicacoes = balanco.ativo.circulante.aplicacoesFinanceiras;
    var contasReceber = balanco.ativo.circulante.contasReceber;
    var estoques = balanco.ativo.circulante.estoques;
    var totalAC = balanco.ativo.circulante.totalCirculante;
    var totalAtivo = balanco.ativo.totalAtivo;
    var fornecedores = balanco.passivo.circulante.fornecedores;
    var totalPC = balanco.passivo.circulante.totalCirculante;
    var pl = balanco.patrimonioLiquido;
    var dividaBruta = balanco.dividaBruta;
    var dividaLiquida = balanco.dividaLiquida;

    // Capital investido (PL + Dívida Líquida)
    var capitalInvestido = pl + Math.max(0, dividaLiquida);

    // ─── RENTABILIDADE ───
    var roi = calcularROI(lucroLiquido, capitalInvestido, setorNorm);
    var roe = calcularROE(lucroLiquido, pl, setorNorm);
    var roa = calcularROA(lucroLiquido, totalAtivo, setorNorm);
    var roic = calcularROIC(nopat, capitalInvestido, setorNorm);
    // EVA precisa de WACC — estimamos com base no setor/porte
    var waccEstimado = 0.15; // Valor médio para PMEs brasileiras
    var eva = calcularEVA(nopat, capitalInvestido, waccEstimado, setorNorm);

    var rentabilidade = {
      roi: roi,
      roe: roe,
      roa: roa,
      roic: roic,
      eva: eva
    };

    // ─── MARGENS ───
    var margemBruta = calcularMargemBruta(lucroBruto, receitaLiquida, setorNorm);
    var margemOperacional = calcularMargemOperacional(ebit, receitaLiquida, setorNorm);
    var margemEBITDA = calcularMargemEBITDA(ebitda, receitaLiquida, setorNorm);
    var margemLiquida = calcularMargemLiquida(lucroLiquido, receitaLiquida, setorNorm);

    var margens = {
      margemBruta: margemBruta,
      margemOperacional: margemOperacional,
      margemEBITDA: margemEBITDA,
      margemLiquida: margemLiquida
    };

    // ─── LIQUIDEZ / SOLVÊNCIA ───
    var liqCorrente = calcularLiquidezCorrente(totalAC, totalPC, setorNorm);
    var liqSeca = calcularLiquidezSeca(totalAC, estoques, totalPC, setorNorm);
    var liqImediata = calcularLiquidezImediata(caixa, aplicacoes, totalPC, setorNorm);
    var divEbitda = calcularDividaEBITDA(dividaLiquida, ebitda, setorNorm);
    var divPL = calcularDividaPL(dividaBruta, pl, setorNorm);
    var cobJuros = calcularCoberturaJuros(ebit, despesasFinanceiras, setorNorm);

    var liquidez = {
      liquidezCorrente: liqCorrente,
      liquidezSeca: liqSeca,
      liquidezImediata: liqImediata,
      dividaEBITDA: divEbitda,
      dividaPL: divPL,
      coberturaJuros: cobJuros
    };

    // ─── EFICIÊNCIA ───
    var giroAt = calcularGiroAtivo(receitaLiquida, totalAtivo, setorNorm);
    var pmr = calcularPMR(contasReceber, receitaBruta, setorNorm);
    var pmp = calcularPMP(fornecedores, cmv, setorNorm);
    var pme = calcularPME(estoques, cmv, setorNorm);
    var cicloOp = calcularCicloOperacional(pmr.valor, pme.valor);
    var cicloFin = calcularCicloFinanceiro(pmr.valor, pme.valor, pmp.valor, setorNorm);

    var eficiencia = {
      giroAtivo: giroAt,
      pmr: pmr,
      pmp: pmp,
      pme: pme,
      cicloOperacional: cicloOp,
      cicloFinanceiro: cicloFin
    };

    // ─── CRESCIMENTO (se houver histórico) ───
    var crescimento = null;
    if (historico && historico.valido && historico.numeroPeriodos >= 2) {
      var series = historico.series;
      var numPeriodos = historico.numeroPeriodos;

      var cagrReceita = calcularCAGR(
        series.receitas[0],
        series.receitas[numPeriodos - 1],
        numPeriodos - 1
      );
      var cagrEbitda = calcularCAGR(
        Math.max(1, series.ebitdas[0]),
        Math.max(1, series.ebitdas[numPeriodos - 1]),
        numPeriodos - 1
      );
      var cagrLucro = (series.lucros[0] > 0 && series.lucros[numPeriodos - 1] > 0)
        ? calcularCAGR(series.lucros[0], series.lucros[numPeriodos - 1], numPeriodos - 1)
        : null;

      var yoyReceita = calcularCrescimentoYoY(
        series.receitas[numPeriodos - 1],
        series.receitas[numPeriodos - 2]
      );

      crescimento = {
        cagrReceita: cagrReceita,
        cagrEbitda: cagrEbitda,
        cagrLucro: cagrLucro,
        yoyReceita: yoyReceita,
        tendencias: historico.tendencias,
        volatilidade: historico.volatilidade
      };
    }

    // ─── ADICIONAR TENDÊNCIA E HISTÓRICO AOS INDICADORES (se houver histórico) ───
    if (historico && historico.valido && historico.numeroPeriodos >= 2) {
      var periodos = historico.periodos;

      // Coletar séries históricas de indicadores
      var seriesROE = [];
      var seriesROA = [];
      var seriesMB = [];
      var seriesMEBITDA = [];
      var seriesML = [];
      var seriesLC = [];
      var seriesGA = [];

      for (var hi = 0; hi < periodos.length; hi++) {
        var pDre = periodos[hi].dre;
        var pBal = periodos[hi].balanco;
        if (!pDre || !pDre.valido) continue;

        seriesROE.push(dividirSeguro(pDre.lucroLiquido, pBal ? pBal.patrimonioLiquido : 0));
        seriesROA.push(dividirSeguro(pDre.lucroLiquido, pBal ? pBal.ativo.totalAtivo : 0));
        seriesMB.push(dividirSeguro(pDre.lucroBruto, pDre.receitaLiquida));
        seriesMEBITDA.push(dividirSeguro(pDre.ebitda, pDre.receitaLiquida));
        seriesML.push(dividirSeguro(pDre.lucroLiquido, pDre.receitaLiquida));
        if (pBal && pBal.valido) {
          seriesLC.push(dividirSeguro(pBal.ativo.circulante.totalCirculante, pBal.passivo.circulante.totalCirculante));
          seriesGA.push(dividirSeguro(pDre.receitaLiquida, pBal.ativo.totalAtivo));
        }
      }

      // Adicionar tendência aos indicadores
      _adicionarTendencia(roe, seriesROE);
      _adicionarTendencia(roa, seriesROA);
      _adicionarTendencia(margemBruta, seriesMB);
      _adicionarTendencia(margemEBITDA, seriesMEBITDA);
      _adicionarTendencia(margemLiquida, seriesML);
      _adicionarTendencia(liqCorrente, seriesLC);
      _adicionarTendencia(giroAt, seriesGA);
    }

    // ─── DUPONT ───
    var dupont = calcularDupont(lucroLiquido, receitaLiquida, totalAtivo, pl);

    // ─── SCORECARD ───
    var indicadoresParaScore = {
      rentabilidade: rentabilidade,
      margens: margens,
      liquidez: liquidez,
      eficiencia: eficiencia
    };
    var scorecard = gerarScorecard(indicadoresParaScore, setorNorm);

    return {
      setor: setorNorm,
      setorLabel: Core.SETORES_LABEL[setorNorm] || setorNorm,
      rentabilidade: rentabilidade,
      margens: margens,
      liquidez: liquidez,
      eficiencia: eficiencia,
      crescimento: crescimento,
      dupont: dupont,
      scorecard: scorecard
    };
  }

  /**
   * Adiciona tendência e valores históricos a um indicador.
   */
  function _adicionarTendencia(indicador, serieHistorica) {
    if (!indicador || !serieHistorica || serieHistorica.length < 2) return;
    var tendencia = calcularTendencia(serieHistorica);
    indicador.tendencia = tendencia.classificacao;
    indicador.historicoValores = serieHistorica.map(function (v) {
      return arredondar(v, 4);
    });
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // API PÚBLICA
  // ═══════════════════════════════════════════════════════════════════════════

  var API = {
    VERSION: '2.0.0',

    // Referências setoriais
    REFERENCIAS_SETORIAIS: REFERENCIAS_SETORIAIS,

    // Classificador
    classificar: classificar,

    // Rentabilidade
    calcularROI: calcularROI,
    calcularROE: calcularROE,
    calcularROA: calcularROA,
    calcularROIC: calcularROIC,
    calcularEVA: calcularEVA,

    // Margens
    calcularMargemBruta: calcularMargemBruta,
    calcularMargemOperacional: calcularMargemOperacional,
    calcularMargemEBITDA: calcularMargemEBITDA,
    calcularMargemLiquida: calcularMargemLiquida,

    // Liquidez / Solvência
    calcularLiquidezCorrente: calcularLiquidezCorrente,
    calcularLiquidezSeca: calcularLiquidezSeca,
    calcularLiquidezImediata: calcularLiquidezImediata,
    calcularDividaEBITDA: calcularDividaEBITDA,
    calcularDividaPL: calcularDividaPL,
    calcularCoberturaJuros: calcularCoberturaJuros,

    // Eficiência
    calcularGiroAtivo: calcularGiroAtivo,
    calcularPMR: calcularPMR,
    calcularPMP: calcularPMP,
    calcularPME: calcularPME,
    calcularCicloOperacional: calcularCicloOperacional,
    calcularCicloFinanceiro: calcularCicloFinanceiro,

    // Crescimento
    calcularCAGR: calcularCAGR,
    calcularCrescimentoYoY: calcularCrescimentoYoY,

    // Dupont
    calcularDupont: calcularDupont,

    // Scorecard
    gerarScorecard: gerarScorecard,

    // Consolidado
    calcularTodosIndicadores: calcularTodosIndicadores
  };

  // Registrar no Core
  if (Core && Core._registrarModulo) {
    Core._registrarModulo('Indicadores', API);
  }

  return API;
  })(API);


  // ╔═══════════════════════════════════════════════════════════════════════════╗
  // ║  MÓDULO 3/6 — DCF — Fluxo de Caixa Descontado (CAPM, WACC, Cenários, Sensibilid║
  // ╚═══════════════════════════════════════════════════════════════════════════╝

  (function (Core) {

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITÁRIOS IMPORTADOS DO CORE
  // ═══════════════════════════════════════════════════════════════════════════

  var arredondar = Core.arredondar;
  var dividirSeguro = Core.dividirSeguro;
  var validarNumero = Core.validarNumero;
  var clonarObjeto = Core.clonarObjeto;
  var formatarMoeda = Core.formatarMoeda;
  var formatarMoedaCurta = Core.formatarMoedaCurta;
  var formatarPct = Core.formatarPct;
  var hoje = Core.hoje;
  var obterBetaSetor = Core.obterBetaSetor;
  var sugerirWACC = Core.sugerirWACC;
  var obterDescontoPorte = Core.obterDescontoPorte;
  var obterDescontoIliquidez = Core.obterDescontoIliquidez;


  // ═══════════════════════════════════════════════════════════════════════════
  // CONSTANTES
  // ═══════════════════════════════════════════════════════════════════════════

  var VERSION = '2.0.0';

  // Limiar para alerta sobre proporção do valor terminal
  var PERCENTUAL_TERMINAL_ALERTA = 0.80;

  // Limites de validação
  var WACC_MIN_ALERTA = 0.08;
  var WACC_MAX_ALERTA = 0.30;
  var HORIZONTE_MIN = 3;
  var HORIZONTE_MAX = 10;
  var CRESCIMENTO_MAX_RAZOAVEL = 0.30;


  // ═══════════════════════════════════════════════════════════════════════════
  // CAPM — Capital Asset Pricing Model
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Calcula o custo do capital próprio (Ke) pelo CAPM.
   * Ke = Rf + β × (Rm - Rf) + CRP
   *
   * @param {number} taxaLivreRisco    Rf — Taxa livre de risco (Tesouro Selic)
   * @param {number} premioRiscoMercado (Rm - Rf) — Prêmio de risco do mercado
   * @param {number} betaSetor         β — Beta desalavancado do setor
   * @param {number} premioRiscoPais   CRP — Prêmio de risco país (EMBI+)
   * @returns {number} Ke — Custo do capital próprio
   */
  function calcularCAPM(taxaLivreRisco, premioRiscoMercado, betaSetor, premioRiscoPais) {
    var rf  = validarNumero(taxaLivreRisco, 0.1075);
    var prm = validarNumero(premioRiscoMercado, 0.06);
    var b   = validarNumero(betaSetor, 1.0);
    var crp = validarNumero(premioRiscoPais, 0.03);

    return rf + b * prm + crp;
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // WACC — Custo Médio Ponderado de Capital
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Calcula o WACC.
   * WACC = Ke × (E/(D+E)) + Kd × (1-t) × (D/(D+E))
   *
   * @param {number} ke               Custo do capital próprio
   * @param {number} kd               Custo da dívida (pré-imposto)
   * @param {number} proporcaoDivida  D/(D+E) — Proporção de dívida na estrutura
   * @param {number} aliquotaImposto  t — Alíquota efetiva de impostos
   * @returns {number} WACC
   */
  function calcularWACC(ke, kd, proporcaoDivida, aliquotaImposto) {
    var keVal = validarNumero(ke, 0.18);
    var kdVal = validarNumero(kd, 0.14);
    var propD = validarNumero(proporcaoDivida, 0.30);
    var t     = validarNumero(aliquotaImposto, 0.34);

    // Limitar proporção entre 0 e 1
    propD = Math.max(0, Math.min(1, propD));
    var propE = 1 - propD;

    return keVal * propE + kdVal * (1 - t) * propD;
  }

  /**
   * Calcula WACC de forma assistida, usando CAPM para obter Ke.
   * Recebe parâmetros detalhados e retorna Ke, WACC e detalhamento.
   *
   * @param {Object} params
   *   - taxaLivreRisco {number}
   *   - premioRiscoMercado {number}
   *   - betaSetor {number}           (ou setor para buscar automaticamente)
   *   - premioRiscoPais {number}
   *   - custoDivida {number}         Kd pré-imposto
   *   - proporcaoDivida {number}     D/(D+E)
   *   - aliquotaImposto {number}
   *   - setor {string}               Usado se betaSetor não informado
   * @returns {Object} { ke, wacc, detalhes }
   */
  function calcularWACCAssistido(params) {
    var p = params || {};

    // Obter beta
    var beta;
    if (p.betaSetor !== undefined && p.betaSetor !== null) {
      beta = validarNumero(p.betaSetor, 1.0);
    } else if (p.setor) {
      beta = obterBetaSetor(p.setor);
    } else {
      beta = 1.0;
    }

    var rf  = validarNumero(p.taxaLivreRisco, 0.1075);
    var prm = validarNumero(p.premioRiscoMercado, 0.06);
    var crp = validarNumero(p.premioRiscoPais, 0.03);
    var kd  = validarNumero(p.custoDivida, 0.14);
    var propD = validarNumero(p.proporcaoDivida, 0.30);
    var t   = validarNumero(p.aliquotaImposto, 0.34);

    var ke = calcularCAPM(rf, prm, beta, crp);
    var wacc = calcularWACC(ke, kd, propD, t);

    return {
      ke: arredondar(ke, 4),
      wacc: arredondar(wacc, 4),
      detalhes: {
        taxaLivreRisco: rf,
        premioRiscoMercado: prm,
        beta: beta,
        premioRiscoPais: crp,
        custoDivida: kd,
        custoDividaPosImposto: arredondar(kd * (1 - t), 4),
        proporcaoDivida: propD,
        proporcaoEquity: arredondar(1 - propD, 4),
        aliquotaImposto: t,
        formulaKe: 'Ke = ' + formatarPct(rf) + ' + ' + arredondar(beta, 2) +
          ' × ' + formatarPct(prm) + ' + ' + formatarPct(crp) +
          ' = ' + formatarPct(ke),
        formulaWACC: 'WACC = ' + formatarPct(ke) + ' × ' +
          formatarPct(1 - propD) + ' + ' + formatarPct(kd) +
          ' × (1-' + formatarPct(t) + ') × ' + formatarPct(propD) +
          ' = ' + formatarPct(wacc)
      }
    };
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // FUNÇÕES CORE DO DCF
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Calcula o EBIT (Lucro Antes de Juros e Impostos).
   * EBIT = Receita - Custos
   *
   * @param {number} receita   Receita líquida
   * @param {number} custos    CMV + Despesas Operacionais (incluindo D&A)
   * @returns {number} EBIT
   */
  function calcularEBIT(receita, custos) {
    return validarNumero(receita) - validarNumero(custos);
  }

  /**
   * Calcula o NOPAT (Lucro Operacional Líquido Após Impostos).
   * NOPAT = EBIT × (1 - t)
   *
   * @param {number} ebit       EBIT
   * @param {number} aliquota   Alíquota efetiva de impostos
   * @returns {number} NOPAT
   */
  function calcularNOPAT(ebit, aliquota) {
    var e = validarNumero(ebit);
    var t = validarNumero(aliquota, 0.34);
    return e * (1 - t);
  }

  /**
   * Calcula o FCF (Fluxo de Caixa Livre).
   * FCF = NOPAT + D&A - CAPEX - ΔCapital de Giro
   *
   * @param {number} nopat     NOPAT
   * @param {number} da        Depreciação e Amortização
   * @param {number} capex     Investimentos em capital
   * @param {number} deltaWC   Variação do capital de giro
   * @returns {number} FCF
   */
  function calcularFCF(nopat, da, capex, deltaWC) {
    return validarNumero(nopat) + validarNumero(da) -
      validarNumero(capex) - validarNumero(deltaWC);
  }

  /**
   * Calcula o Valor Terminal pela fórmula de Gordon Growth.
   * VT = FCF_último × (1 + g) / (WACC - g)
   *
   * @param {number} fcfUltimoAno  FCF do último ano projetado
   * @param {number} taxaPerpetua  Taxa de crescimento na perpetuidade (g)
   * @param {number} wacc          WACC
   * @returns {number} Valor Terminal
   */
  function calcularValorTerminal(fcfUltimoAno, taxaPerpetua, wacc) {
    var fcf = validarNumero(fcfUltimoAno);
    var g   = validarNumero(taxaPerpetua, 0.03);
    var w   = validarNumero(wacc, 0.15);

    // Proteção: g deve ser menor que WACC
    if (g >= w) {
      g = w - 0.03;
    }

    var denominador = w - g;
    if (denominador <= 0) return 0;

    return fcf * (1 + g) / denominador;
  }

  /**
   * Calcula o Valor Presente do Valor Terminal.
   * VP(VT) = VT / (1 + WACC)^n
   *
   * @param {number} valorTerminal  Valor Terminal
   * @param {number} wacc           WACC
   * @param {number} n              Número de anos (horizonte de projeção)
   * @returns {number} VP do Valor Terminal
   */
  function calcularVPTerminal(valorTerminal, wacc, n) {
    var vt = validarNumero(valorTerminal);
    var w  = validarNumero(wacc, 0.15);
    var anos = validarNumero(n, 5);

    if (anos <= 0) return vt;
    return vt / Math.pow(1 + w, anos);
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // PROJEÇÃO DE FLUXOS — Crescimento uniforme (legado)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Projeta fluxos de caixa com taxa de crescimento uniforme.
   * Modo simples: aplica mesma taxa a receita e custos.
   *
   * @param {Object} params
   *   - receita {number}
   *   - custos {number}
   *   - depreciacaoAmortizacao {number}
   *   - aliquotaImposto {number}
   *   - capex {number}
   *   - variacaoCapitalGiro {number}
   *   - horizonteAnos {number}
   *   - taxaCrescimento {number}
   *   - wacc {number}
   * @returns {Array} Projeção anual [{ano, receita, custos, ebit, nopat, da, capex, deltaWC, fcf, vpFcf}]
   */
  function projetarFluxosUniforme(params) {
    var p = params || {};
    var receita   = validarNumero(p.receita);
    var custos    = validarNumero(p.custos);
    var da        = validarNumero(p.depreciacaoAmortizacao);
    var aliquota  = validarNumero(p.aliquotaImposto, 0.34);
    var capex     = validarNumero(p.capex);
    var deltaWC   = validarNumero(p.variacaoCapitalGiro);
    var horizonte = validarNumero(p.horizonteAnos, 5);
    var taxaCresc = validarNumero(p.taxaCrescimento, 0.05);
    var wacc      = validarNumero(p.wacc, 0.15);

    var projecao = [];

    for (var i = 1; i <= horizonte; i++) {
      var fatorCresc = Math.pow(1 + taxaCresc, i);
      var recAno   = receita * fatorCresc;
      var custosAno = custos * fatorCresc;
      var daAno    = da * fatorCresc;
      var capexAno = capex * fatorCresc;
      var dwcAno   = deltaWC * fatorCresc;

      var ebitAno  = calcularEBIT(recAno, custosAno);
      var nopatAno = calcularNOPAT(ebitAno, aliquota);
      var fcfAno   = calcularFCF(nopatAno, daAno, capexAno, dwcAno);
      var vpFcf    = fcfAno / Math.pow(1 + wacc, i);

      projecao.push({
        ano: i,
        receita: arredondar(recAno),
        custos: arredondar(custosAno),
        ebit: arredondar(ebitAno),
        margemEBIT: arredondar(dividirSeguro(ebitAno, recAno), 4),
        nopat: arredondar(nopatAno),
        da: arredondar(daAno),
        capex: arredondar(capexAno),
        deltaWC: arredondar(dwcAno),
        fcf: arredondar(fcfAno),
        vpFcf: arredondar(vpFcf)
      });
    }

    return projecao;
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // PROJEÇÃO DE FLUXOS POR FASES (ETAPA 4.1, 4.2)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Projeta receita, custos e FCF com taxas diferenciadas por fase.
   *
   * Cada ano projetado calcula componente por componente:
   * - Receita: aplica taxa de crescimento da fase
   * - CMV: como % da receita (custosCmvPercentualReceita)
   * - SG&A: parte fixa + parte variável (% da receita)
   * - D&A: como % do imobilizado acumulado
   * - CAPEX: como % da receita
   * - ΔWC: variação do capital de giro (% receita × receita)
   * - EBIT = Receita - CMV - SG&A - D&A
   * - NOPAT = EBIT × (1 - alíquota)
   * - FCF = NOPAT + D&A - CAPEX - ΔWC
   * - vpFcf = FCF / (1+WACC)^ano
   *
   * Se `fases` não for fornecido, delega para projeção uniforme.
   *
   * @param {Object} params
   *   - anoBase: { receita, cmv, despesas, da, capex, deltaWC, aliquota }
   *   - fases: [
   *       { anosInicio: 1, anosFim: 3, taxaCrescimentoReceita: 0.15, taxaCrescimentoCustos: 0.12 },
   *       { anosInicio: 4, anosFim: 5, taxaCrescimentoReceita: 0.08, taxaCrescimentoCustos: 0.07 }
   *     ]
   *   - custosCmvPercentualReceita: 0.33
   *   - sgaFixo: 200000
   *   - sgaVariavelPercentual: 0.10
   *   - daPercentualImobilizado: 0.10
   *   - capexPercentualReceita: 0.08
   *   - capitalGiroPercentualReceita: 0.15
   *   - aliquotaImposto: 0.34
   *   - wacc: 0.15
   *   - horizonteAnos: 5
   * @returns {Array} [{ano, receita, cmv, sga, da, ebit, nopat, capex, deltaWC, fcf, vpFcf, imobilizado, capitalGiro}, ...]
   */
  function projetarFluxosPorFases(params) {
    var p = params || {};

    // Se não tem fases nem anoBase, usar projeção uniforme
    if (!p.fases && !p.anoBase) {
      return projetarFluxosUniforme(p);
    }

    // Extrair dados do ano base
    var base = p.anoBase || {};
    var receitaBase     = validarNumero(base.receita);
    var cmvBase         = validarNumero(base.cmv);
    var despesasBase    = validarNumero(base.despesas);
    var daBase          = validarNumero(base.da);
    var capexBase       = validarNumero(base.capex);
    var deltaWCBase     = validarNumero(base.deltaWC);
    var aliquotaBase    = validarNumero(base.aliquota, validarNumero(p.aliquotaImposto, 0.34));

    // Parâmetros de projeção detalhada
    var cmvPctReceita   = validarNumero(p.custosCmvPercentualReceita,
      receitaBase > 0 ? cmvBase / receitaBase : 0.33);
    var sgaFixo         = validarNumero(p.sgaFixo, 0);
    var sgaVariavelPct  = validarNumero(p.sgaVariavelPercentual, 0);
    var daPctImob       = validarNumero(p.daPercentualImobilizado, 0.10);
    var capexPctReceita = validarNumero(p.capexPercentualReceita,
      receitaBase > 0 ? capexBase / receitaBase : 0.08);
    var wkPctReceita    = validarNumero(p.capitalGiroPercentualReceita, 0.15);
    var aliquota        = validarNumero(p.aliquotaImposto, aliquotaBase);
    var wacc            = validarNumero(p.wacc, 0.15);

    // Determinar horizonte
    var horizonte = validarNumero(p.horizonteAnos, 5);
    var fases = p.fases || [];

    // Se não há fases definidas, criar uma fase única com taxa de crescimento
    if (fases.length === 0) {
      var taxaCresc = validarNumero(p.taxaCrescimento, 0.05);
      fases = [{ anosInicio: 1, anosFim: horizonte, taxaCrescimentoReceita: taxaCresc, taxaCrescimentoCustos: taxaCresc }];
    }

    // Deduzir SGA se não explícito: despesas - cmv = SGA total do ano base
    var sgaTotalBase = despesasBase > 0 ? despesasBase : 0;
    if (sgaFixo === 0 && sgaVariavelPct === 0 && sgaTotalBase > 0) {
      // Se o usuário não informou sgaFixo/sgaVariavelPct,
      // calcular automaticamente a partir das despesas do ano base
      // Assumir 40% fixo, 60% variável como heurística
      sgaFixo = sgaTotalBase * 0.40;
      sgaVariavelPct = receitaBase > 0
        ? (sgaTotalBase * 0.60) / receitaBase
        : 0.10;
    }

    // Estado acumulado
    var receitaAnterior = receitaBase;
    var imobilizado = receitaBase > 0
      ? validarNumero(base.imobilizado, receitaBase * capexPctReceita / daPctImob)
      : capexBase / Math.max(daPctImob, 0.01);
    var capitalGiroAnterior = receitaBase * wkPctReceita;

    var projecao = [];

    for (var i = 1; i <= horizonte; i++) {
      // Identificar a fase deste ano
      var faseAtual = null;
      for (var f = 0; f < fases.length; f++) {
        var fase = fases[f];
        if (i >= fase.anosInicio && i <= fase.anosFim) {
          faseAtual = fase;
          break;
        }
      }

      // Se nenhuma fase cobre este ano, usar a última fase definida
      if (!faseAtual) {
        faseAtual = fases[fases.length - 1];
      }

      var taxaCrescReceita = validarNumero(faseAtual.taxaCrescimentoReceita, 0.05);
      var taxaCrescCustos  = validarNumero(faseAtual.taxaCrescimentoCustos, taxaCrescReceita);

      // Calcular componentes
      var receitaAno = receitaAnterior * (1 + taxaCrescReceita);
      var cmvAno     = receitaAno * cmvPctReceita;

      // SG&A: fixo cresce com custos, variável cresce com receita
      var sgaFixoAno;
      if (i === 1) {
        sgaFixoAno = sgaFixo * (1 + taxaCrescCustos);
      } else {
        sgaFixoAno = sgaFixo * Math.pow(1 + taxaCrescCustos, i);
      }
      var sgaVariavelAno = receitaAno * sgaVariavelPct;
      var sgaTotalAno    = sgaFixoAno + sgaVariavelAno;

      // CAPEX e imobilizado
      var capexAno = receitaAno * capexPctReceita;
      imobilizado  = imobilizado + capexAno; // acumula investimentos

      // D&A sobre imobilizado acumulado
      var daAno = imobilizado * daPctImob;

      // Descontar depreciação do imobilizado
      imobilizado = imobilizado - daAno;
      if (imobilizado < 0) imobilizado = 0;

      // EBIT
      var ebitAno = receitaAno - cmvAno - sgaTotalAno - daAno;

      // NOPAT
      var nopatAno = calcularNOPAT(ebitAno, aliquota);

      // Capital de giro e variação
      var capitalGiroAtual = receitaAno * wkPctReceita;
      var deltaWCAno = capitalGiroAtual - capitalGiroAnterior;

      // FCF
      var fcfAno = nopatAno + daAno - capexAno - deltaWCAno;

      // VP do FCF
      var vpFcf = fcfAno / Math.pow(1 + wacc, i);

      projecao.push({
        ano: i,
        fase: faseAtual.anosInicio + '-' + faseAtual.anosFim,
        taxaCrescimentoReceita: taxaCrescReceita,
        receita: arredondar(receitaAno),
        cmv: arredondar(cmvAno),
        sga: arredondar(sgaTotalAno),
        sgaFixo: arredondar(sgaFixoAno),
        sgaVariavel: arredondar(sgaVariavelAno),
        da: arredondar(daAno),
        ebit: arredondar(ebitAno),
        margemEBIT: arredondar(dividirSeguro(ebitAno, receitaAno), 4),
        nopat: arredondar(nopatAno),
        capex: arredondar(capexAno),
        deltaWC: arredondar(deltaWCAno),
        fcf: arredondar(fcfAno),
        vpFcf: arredondar(vpFcf),
        imobilizado: arredondar(imobilizado),
        capitalGiro: arredondar(capitalGiroAtual)
      });

      // Atualizar estado para próximo ano
      receitaAnterior = receitaAno;
      capitalGiroAnterior = capitalGiroAtual;
    }

    return projecao;
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // DESCONTOS — Iliquidez e Porte (ETAPA 4.3)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Aplica descontos de iliquidez e porte ao equity bruto.
   *
   * - Iliquidez: 0% (capital aberto) ou 20% (capital fechado)
   * - Porte: 0-20% conforme classificação (micro/pequena/média/grande)
   *
   * equityAjustado = equityBruto × (1 - descIliq) × (1 - descPorte)
   *
   * @param {number} equityBruto   Valor do equity antes dos descontos
   * @param {string} tipoCapital   "aberto" ou "fechado"
   * @param {string} porte         "micro", "pequena", "media" ou "grande"
   * @returns {Object} { equityBruto, descontoIliquidez, descontoPorte, equityAjustado, fatorDesconto }
   */
  function aplicarDescontos(equityBruto, tipoCapital, porte) {
    var eq = validarNumero(equityBruto);
    var descIliq  = obterDescontoIliquidez(tipoCapital || 'fechado');
    var descPorte = obterDescontoPorte(porte || 'pequena');

    var fatorDesconto = (1 - descIliq) * (1 - descPorte);
    var equityAjustado = eq * fatorDesconto;

    return {
      equityBruto: arredondar(eq),
      descontoIliquidez: descIliq,
      descontoIliquidezLabel: tipoCapital === 'aberto'
        ? 'Sem desconto (capital aberto)'
        : formatarPct(descIliq) + ' (capital fechado — DLOM)',
      descontoPorte: descPorte,
      descontoPorteLabel: formatarPct(descPorte) + ' (' + (porte || 'pequena') + ')',
      fatorDesconto: arredondar(fatorDesconto, 4),
      equityAjustado: arredondar(equityAjustado)
    };
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // ANÁLISE DE SENSIBILIDADE — Matriz 5×5
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Gera uma matriz 5×5 de sensibilidade variando WACC e taxa de crescimento
   * na perpetuidade. Para cada combinação, calcula o Enterprise Value
   * completo (VP dos fluxos + VP do valor terminal).
   *
   * @param {Object} inputs         Inputs padrão do DCF (mesmo formato do calcular)
   * @param {number} waccCentral    WACC base (centro da matriz)
   * @param {number} taxaPerpetuaCentral  Taxa de crescimento perpétuo base (centro)
   * @returns {Object} { linhas: [WACC1..5], colunas: [g1..5], valores: [[EV_11,...],[...]] }
   */
  function gerarMatrizSensibilidade(inputs, waccCentral, taxaPerpetuaCentral) {
    var wc = validarNumero(waccCentral, 0.15);
    var gc = validarNumero(taxaPerpetuaCentral, 0.03);

    // Variações: -0.02, -0.01, 0, +0.01, +0.02
    var deltaWACC = [-0.02, -0.01, 0, 0.01, 0.02];
    var deltaG    = [-0.02, -0.01, 0, 0.01, 0.02];

    var linhas  = []; // WACCs
    var colunas = []; // taxas de crescimento perpétuo
    var valores = [];

    // Gerar colunas (taxas de perpetuidade)
    for (var j = 0; j < deltaG.length; j++) {
      colunas.push(arredondar(gc + deltaG[j], 4));
    }

    for (var i = 0; i < deltaWACC.length; i++) {
      var waccVar = wc + deltaWACC[i];
      // WACC mínimo de 1% para evitar divisão por zero
      if (waccVar < 0.01) waccVar = 0.01;
      linhas.push(arredondar(waccVar, 4));

      var linha = [];
      for (var k = 0; k < deltaG.length; k++) {
        var gVar = gc + deltaG[k];
        // g deve ser < WACC
        if (gVar >= waccVar) {
          gVar = waccVar - 0.01;
        }
        if (gVar < 0) gVar = 0;

        var ev = _calcularEVParaSensibilidade(inputs, waccVar, gVar);
        linha.push(arredondar(ev));
      }
      valores.push(linha);
    }

    return {
      linhas: linhas,
      linhasLabel: 'WACC',
      colunas: colunas,
      colunasLabel: 'Crescimento Perpétuo (g)',
      valores: valores,
      central: {
        wacc: wc,
        taxaPerpetua: gc,
        valor: valores[2][2] // centro da matriz (índice 2,2)
      }
    };
  }

  /**
   * Calcula EV para uma combinação específica de WACC e g (uso interno na sensibilidade).
   */
  function _calcularEVParaSensibilidade(inputs, wacc, taxaPerpetua) {
    var p = inputs || {};
    var receita   = validarNumero(p.receita);
    var custos    = validarNumero(p.custos);
    var da        = validarNumero(p.depreciacaoAmortizacao);
    var aliquota  = validarNumero(p.aliquotaImposto, 0.34);
    var capex     = validarNumero(p.capex);
    var deltaWC   = validarNumero(p.variacaoCapitalGiro);
    var horizonte = validarNumero(p.horizonteAnos, 5);
    var taxaCresc = validarNumero(p.taxaCrescimento, 0.05);

    // Projetar fluxos com o WACC variado
    var somaVPFluxos = 0;
    var ultimoFCF = 0;

    for (var i = 1; i <= horizonte; i++) {
      var fator = Math.pow(1 + taxaCresc, i);
      var recAno   = receita * fator;
      var custAno  = custos * fator;
      var daAno    = da * fator;
      var capAno   = capex * fator;
      var dwcAno   = deltaWC * fator;

      var ebitAno  = recAno - custAno;
      var nopatAno = ebitAno * (1 - aliquota);
      var fcfAno   = nopatAno + daAno - capAno - dwcAno;

      somaVPFluxos += fcfAno / Math.pow(1 + wacc, i);
      if (i === horizonte) ultimoFCF = fcfAno;
    }

    // Valor terminal
    var vt = calcularValorTerminal(ultimoFCF, taxaPerpetua, wacc);
    var vpVT = calcularVPTerminal(vt, wacc, horizonte);

    return somaVPFluxos + vpVT;
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // CENÁRIOS AUTOMÁTICOS (ETAPA 4.5)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Gera 3 cenários automáticos: pessimista, base e otimista.
   *
   * - Pessimista: crescimento × 0.5, WACC + 0.02, perpetuidade - 0.01
   * - Base: conforme calculado
   * - Otimista: crescimento × 1.5, WACC - 0.01, perpetuidade + 0.01
   *
   * @param {Object} inputsBase  Inputs do DCF (mesmo formato do calcular)
   * @param {number} wacc        WACC base
   * @returns {Object} { pessimista, base, otimista } cada um com { equityValue, detalhes }
   */
  function gerarCenarios(inputsBase, wacc) {
    var p = inputsBase || {};
    var waccBase = validarNumero(wacc, 0.15);
    var taxaCresc = validarNumero(p.taxaCrescimento, 0.05);
    var taxaPerp  = validarNumero(p.taxaPerpetua, 0.03);
    var dividaLiquida = validarNumero(p.dividaLiquida, 0);
    var tipoCapital = p.tipoCapital || 'fechado';
    var porte = p.porte || 'pequena';

    // ─── Cenário Pessimista ───
    var crescPess = taxaCresc * 0.5;
    var waccPess  = waccBase + 0.02;
    var perpPess  = Math.max(0.01, taxaPerp - 0.01);

    var resPess = _calcularCenario(p, crescPess, waccPess, perpPess, dividaLiquida, tipoCapital, porte);

    // ─── Cenário Base ───
    var resBase = _calcularCenario(p, taxaCresc, waccBase, taxaPerp, dividaLiquida, tipoCapital, porte);

    // ─── Cenário Otimista ───
    var crescOtim = taxaCresc * 1.5;
    var waccOtim  = Math.max(0.05, waccBase - 0.01);
    var perpOtim  = taxaPerp + 0.01;
    // Garantir que g < WACC no otimista
    if (perpOtim >= waccOtim - 0.02) {
      perpOtim = waccOtim - 0.03;
    }

    var resOtim = _calcularCenario(p, crescOtim, waccOtim, perpOtim, dividaLiquida, tipoCapital, porte);

    return {
      pessimista: {
        equityValue: resPess.equityAjustado,
        enterpriseValue: resPess.ev,
        equityBruto: resPess.equityBruto,
        equityAjustado: resPess.equityAjustado,
        wacc: waccPess,
        taxaCrescimento: crescPess,
        taxaPerpetua: perpPess,
        vpFluxos: resPess.vpFluxos,
        vpTerminal: resPess.vpTerminal,
        percentualTerminal: resPess.percentualTerminal
      },
      base: {
        equityValue: resBase.equityAjustado,
        enterpriseValue: resBase.ev,
        equityBruto: resBase.equityBruto,
        equityAjustado: resBase.equityAjustado,
        wacc: waccBase,
        taxaCrescimento: taxaCresc,
        taxaPerpetua: taxaPerp,
        vpFluxos: resBase.vpFluxos,
        vpTerminal: resBase.vpTerminal,
        percentualTerminal: resBase.percentualTerminal
      },
      otimista: {
        equityValue: resOtim.equityAjustado,
        enterpriseValue: resOtim.ev,
        equityBruto: resOtim.equityBruto,
        equityAjustado: resOtim.equityAjustado,
        wacc: waccOtim,
        taxaCrescimento: crescOtim,
        taxaPerpetua: perpOtim,
        vpFluxos: resOtim.vpFluxos,
        vpTerminal: resOtim.vpTerminal,
        percentualTerminal: resOtim.percentualTerminal
      }
    };
  }

  /**
   * Calcula um cenário individual (uso interno).
   */
  function _calcularCenario(inputs, taxaCrescimento, wacc, taxaPerpetua, dividaLiquida, tipoCapital, porte) {
    var p = inputs || {};
    var receita   = validarNumero(p.receita);
    var custos    = validarNumero(p.custos);
    var da        = validarNumero(p.depreciacaoAmortizacao);
    var aliquota  = validarNumero(p.aliquotaImposto, 0.34);
    var capex     = validarNumero(p.capex);
    var deltaWC   = validarNumero(p.variacaoCapitalGiro);
    var horizonte = validarNumero(p.horizonteAnos, 5);

    // Garantir g < WACC
    var gEfetivo = taxaPerpetua;
    if (gEfetivo >= wacc - 0.02) {
      gEfetivo = wacc - 0.03;
    }
    if (gEfetivo < 0) gEfetivo = 0;

    // Projetar fluxos
    var somaVPFluxos = 0;
    var ultimoFCF = 0;

    for (var i = 1; i <= horizonte; i++) {
      var fator = Math.pow(1 + taxaCrescimento, i);
      var recAno   = receita * fator;
      var custAno  = custos * fator;
      var daAno    = da * fator;
      var capAno   = capex * fator;
      var dwcAno   = deltaWC * fator;

      var ebitAno  = recAno - custAno;
      var nopatAno = ebitAno * (1 - aliquota);
      var fcfAno   = nopatAno + daAno - capAno - dwcAno;

      somaVPFluxos += fcfAno / Math.pow(1 + wacc, i);
      if (i === horizonte) ultimoFCF = fcfAno;
    }

    var vt   = calcularValorTerminal(ultimoFCF, gEfetivo, wacc);
    var vpVT = calcularVPTerminal(vt, wacc, horizonte);

    var ev = somaVPFluxos + vpVT;
    var equityBruto = ev - validarNumero(dividaLiquida);

    // Equity não pode ser negativo no cenário
    if (equityBruto < 0) equityBruto = 0;

    var descontos = aplicarDescontos(equityBruto, tipoCapital, porte);

    var percentualTerminal = ev > 0 ? vpVT / ev : 0;

    return {
      ev: arredondar(ev),
      vpFluxos: arredondar(somaVPFluxos),
      vpTerminal: arredondar(vpVT),
      percentualTerminal: arredondar(percentualTerminal, 4),
      equityBruto: arredondar(equityBruto),
      equityAjustado: descontos.equityAjustado
    };
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDAÇÃO E ALERTAS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Valida os inputs do DCF e retorna alertas.
   *
   * @param {Object} inputs  Inputs brutos do DCF
   * @returns {Object} { valido, erros, alertas }
   */
  function _validarInputs(inputs) {
    var p = inputs || {};
    var erros = [];
    var alertas = [];

    // Validações obrigatórias
    if (!p.receita || p.receita <= 0) {
      erros.push('Receita deve ser maior que zero.');
    }

    if (p.custos !== undefined && p.custos < 0) {
      alertas.push({
        tipo: 'aviso',
        mensagem: 'Custos negativos podem indicar erro de lançamento.'
      });
    }

    // Horizonte de projeção
    var horizonte = validarNumero(p.horizonteAnos, 5);
    if (horizonte < HORIZONTE_MIN) {
      alertas.push({
        tipo: 'aviso',
        mensagem: 'Horizonte de ' + horizonte + ' anos é curto. Recomenda-se mínimo de ' + HORIZONTE_MIN + ' anos.'
      });
    }
    if (horizonte > HORIZONTE_MAX) {
      alertas.push({
        tipo: 'aviso',
        mensagem: 'Horizonte de ' + horizonte + ' anos é longo. Projeções além de ' + HORIZONTE_MAX + ' anos são muito incertas.'
      });
    }

    // Taxa de crescimento
    var taxaCresc = validarNumero(p.taxaCrescimento, 0.05);
    if (taxaCresc > CRESCIMENTO_MAX_RAZOAVEL) {
      alertas.push({
        tipo: 'atencao',
        mensagem: 'Taxa de crescimento de ' + formatarPct(taxaCresc) +
          ' é muito alta. Pouquíssimas empresas sustentam crescimento acima de ' +
          formatarPct(CRESCIMENTO_MAX_RAZOAVEL) + ' por período prolongado.'
      });
    }
    if (taxaCresc < 0) {
      alertas.push({
        tipo: 'aviso',
        mensagem: 'Taxa de crescimento negativa (' + formatarPct(taxaCresc) +
          '). A empresa está em declínio?'
      });
    }

    // Taxa de perpetuidade
    var taxaPerp = validarNumero(p.taxaPerpetua, 0.03);
    var limites = Core.TAXA_PERPETUA_LIMITES;
    if (taxaPerp > limites.absolutoMax) {
      alertas.push({
        tipo: 'atencao',
        mensagem: 'Taxa de perpetuidade de ' + formatarPct(taxaPerp) +
          ' excede o limite máximo razoável de ' + formatarPct(limites.absolutoMax) +
          '. Valor conservador recomendado: ' + formatarPct(limites.conservador.min) +
          ' a ' + formatarPct(limites.conservador.max) + '.'
      });
    }

    // Dívida líquida negativa (mais caixa que dívida)
    var divLiq = validarNumero(p.dividaLiquida);
    if (divLiq < 0) {
      alertas.push({
        tipo: 'info',
        mensagem: 'Dívida líquida negativa (' + formatarMoedaCurta(divLiq) +
          '): a empresa tem mais caixa do que dívida. Isso aumenta o equity value.'
      });
    }

    // CAPEX vs D&A
    var capex = validarNumero(p.capex);
    var da = validarNumero(p.depreciacaoAmortizacao);
    if (capex > 0 && da > 0 && capex > da * 3) {
      alertas.push({
        tipo: 'aviso',
        mensagem: 'CAPEX (' + formatarMoedaCurta(capex) + ') é mais que 3× a D&A (' +
          formatarMoedaCurta(da) + '). Verificar se o investimento é pontual ou recorrente.'
      });
    }

    return {
      valido: erros.length === 0,
      erros: erros,
      alertas: alertas
    };
  }

  /**
   * Adiciona alertas pós-cálculo (valor terminal, WACC, FCF negativo).
   */
  function _alertasPosCalculo(alertas, detalhes, wacc, taxaPerpetua) {
    // Alerta: valor terminal > 80% do EV
    if (detalhes.composicao && detalhes.composicao.percentualTerminal > PERCENTUAL_TERMINAL_ALERTA) {
      alertas.push({
        tipo: 'atencao',
        mensagem: 'O valor terminal representa ' +
          formatarPct(detalhes.composicao.percentualTerminal) +
          ' do Enterprise Value. Valores acima de ' +
          formatarPct(PERCENTUAL_TERMINAL_ALERTA) +
          ' indicam forte dependência de premissas de longo prazo. ' +
          'Considere revisar a taxa de perpetuidade ou o horizonte de projeção.'
      });
    }

    // Alerta: WACC fora da faixa razoável
    if (wacc < WACC_MIN_ALERTA) {
      alertas.push({
        tipo: 'atencao',
        mensagem: 'WACC de ' + formatarPct(wacc) +
          ' está abaixo de ' + formatarPct(WACC_MIN_ALERTA) +
          '. Para empresas brasileiras, esse valor é incomum. Verifique os parâmetros do CAPM.'
      });
    }
    if (wacc > WACC_MAX_ALERTA) {
      alertas.push({
        tipo: 'atencao',
        mensagem: 'WACC de ' + formatarPct(wacc) +
          ' está acima de ' + formatarPct(WACC_MAX_ALERTA) +
          '. Taxa muito alta pode subestimar significativamente o valor da empresa.'
      });
    }

    // Alerta: crescimento > 2× WACC
    var taxaCresc = detalhes.taxaCrescimento || 0;
    if (taxaCresc > wacc * 2) {
      alertas.push({
        tipo: 'atencao',
        mensagem: 'Taxa de crescimento (' + formatarPct(taxaCresc) +
          ') é mais que o dobro do WACC (' + formatarPct(wacc) +
          '). Isso é insustentável no longo prazo e pode superestimar o valor.'
      });
    }

    // Alerta: FCF do ano 1 negativo
    if (detalhes.projecaoAnual && detalhes.projecaoAnual.length > 0) {
      var fcfAno1 = detalhes.projecaoAnual[0].fcf;
      if (fcfAno1 < 0) {
        alertas.push({
          tipo: 'aviso',
          mensagem: 'O FCF do Ano 1 é negativo (' + formatarMoedaCurta(fcfAno1) +
            '). Empresas com fluxo de caixa negativo no curto prazo dependem ' +
            'fortemente da recuperação nos anos seguintes.'
        });
      }
    }

    // Alerta: taxa de perpetuidade foi forçada
    if (detalhes._taxaPerpetuaForcada) {
      alertas.push({
        tipo: 'atencao',
        mensagem: 'A taxa de perpetuidade foi reduzida de ' +
          formatarPct(detalhes._taxaPerpetuaOriginal) + ' para ' +
          formatarPct(taxaPerpetua) +
          ' pois estava próxima demais do WACC (' + formatarPct(wacc) +
          '). g deve ser significativamente menor que WACC para evitar superestimação.'
      });
    }
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // FUNÇÃO PRINCIPAL — calcularDCF
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Calcula a precificação completa pelo método DCF (Fluxo de Caixa Descontado).
   *
   * Passo a passo:
   * 1. Validar inputs
   * 2. Calcular WACC (manual ou assistido)
   * 3. Projetar fluxos (uniforme ou por fases)
   * 4. Calcular valor terminal
   * 5. Calcular Enterprise Value
   * 6. Aplicar descontos (iliquidez, porte)
   * 7. Gerar cenários (pessimista/base/otimista)
   * 8. Gerar matriz de sensibilidade
   * 9. Montar resultado final
   *
   * @param {Object} inputs
   *   - nomeEmpresa {string}
   *   - setor {string}
   *   - porte {string}
   *   - tipoCapital {string}
   *   - receita {number}
   *   - custos {number}
   *   - depreciacaoAmortizacao {number}
   *   - aliquotaImposto {number}
   *   - capex {number}
   *   - variacaoCapitalGiro {number}
   *   - dividaLiquida {number}
   *   - horizonteAnos {number}
   *   - taxaCrescimento {number}
   *   - taxaPerpetua {number}
   *   - waccManual {number}   OU
   *   - waccAssistido {Object} — parâmetros para calcularWACCAssistido
   *   - fases {Array}         (opcional, para projeção por fases)
   *   - anoBase {Object}      (opcional, para projeção detalhada por fases)
   *   - custosCmvPercentualReceita, sgaFixo, sgaVariavelPercentual,
   *     daPercentualImobilizado, capexPercentualReceita,
   *     capitalGiroPercentualReceita (opcionais, para projeção por fases)
   * @returns {Object} Resultado completo do DCF
   */
  function calcularDCF(inputs) {
    var p = inputs || {};

    // ─── 1. Validação ───
    var validacao = _validarInputs(p);
    if (!validacao.valido) {
      return {
        modulo: 'DCF',
        nomeEmpresa: p.nomeEmpresa || '',
        dataCalculo: hoje(),
        valorMinimo: 0,
        valorMediano: 0,
        valorMaximo: 0,
        equityValue: 0,
        erro: true,
        mensagem: validacao.erros.join(' '),
        alertas: validacao.alertas
      };
    }

    var alertas = validacao.alertas.slice(); // copiar alertas da validação

    // ─── 2. WACC ───
    var wacc;
    var waccDetalhes = null;

    if (p.waccManual !== undefined && p.waccManual !== null) {
      wacc = validarNumero(p.waccManual, 0.15);
      waccDetalhes = {
        tipo: 'manual',
        valor: wacc
      };
    } else if (p.waccAssistido) {
      var waccRes = calcularWACCAssistido(p.waccAssistido);
      wacc = waccRes.wacc;
      waccDetalhes = {
        tipo: 'assistido',
        ke: waccRes.ke,
        valor: wacc,
        detalhes: waccRes.detalhes
      };
    } else {
      // Usar WACC sugerido pelo porte
      var sugerido = sugerirWACC(p.porte || 'pequena');
      wacc = sugerido.sugerido;
      waccDetalhes = {
        tipo: 'sugerido',
        valor: wacc,
        faixa: sugerido
      };
      alertas.push({
        tipo: 'info',
        mensagem: 'WACC não informado. Usando valor sugerido de ' + formatarPct(wacc) +
          ' para porte "' + (p.porte || 'pequena') + '".'
      });
    }

    // ─── 3. Parâmetros do ano base ───
    var receita   = validarNumero(p.receita);
    var custos    = validarNumero(p.custos);
    var da        = validarNumero(p.depreciacaoAmortizacao);
    var aliquota  = validarNumero(p.aliquotaImposto, 0.34);
    var capex     = validarNumero(p.capex);
    var deltaWC   = validarNumero(p.variacaoCapitalGiro);
    var divLiquida = validarNumero(p.dividaLiquida);
    var horizonte = validarNumero(p.horizonteAnos, 5);
    var taxaCresc = validarNumero(p.taxaCrescimento, 0.05);
    var taxaPerp  = validarNumero(p.taxaPerpetua, 0.03);
    var tipoCapital = p.tipoCapital || 'fechado';
    var porte     = p.porte || 'pequena';

    // Limitar horizonte
    horizonte = Math.max(HORIZONTE_MIN, Math.min(HORIZONTE_MAX, horizonte));

    // ─── 4. Terminal Value Cap (ETAPA 4.4) ───
    var taxaPerpetuaOriginal = taxaPerp;
    var taxaPerpetuaForcada = false;

    if (taxaPerp >= wacc - 0.02) {
      taxaPerp = wacc - 0.03;
      if (taxaPerp < 0) taxaPerp = 0.01;
      taxaPerpetuaForcada = true;
    }

    // ─── 5. Ano Base — cálculos ───
    var ebitBase  = calcularEBIT(receita, custos);
    var nopatBase = calcularNOPAT(ebitBase, aliquota);
    var fcfBase   = calcularFCF(nopatBase, da, capex, deltaWC);

    var anoBaseDetalhe = {
      receita: arredondar(receita),
      custos: arredondar(custos),
      ebit: arredondar(ebitBase),
      margemEBIT: arredondar(dividirSeguro(ebitBase, receita), 4),
      nopat: arredondar(nopatBase),
      da: arredondar(da),
      capex: arredondar(capex),
      deltaWC: arredondar(deltaWC),
      fcf: arredondar(fcfBase),
      margemFCF: arredondar(dividirSeguro(fcfBase, receita), 4)
    };

    // ─── 6. Projeção de fluxos ───
    var projecaoAnual;
    var usouFases = false;

    if (p.fases && p.fases.length > 0) {
      // Projeção por fases
      usouFases = true;

      // Montar anoBase se não fornecido explicitamente
      var anoBaseParam = p.anoBase || {
        receita: receita,
        cmv: custos * 0.5, // heurística: metade dos custos é CMV
        despesas: custos * 0.5,
        da: da,
        capex: capex,
        deltaWC: deltaWC,
        aliquota: aliquota
      };

      projecaoAnual = projetarFluxosPorFases({
        anoBase: anoBaseParam,
        fases: p.fases,
        custosCmvPercentualReceita: p.custosCmvPercentualReceita,
        sgaFixo: p.sgaFixo,
        sgaVariavelPercentual: p.sgaVariavelPercentual,
        daPercentualImobilizado: p.daPercentualImobilizado,
        capexPercentualReceita: p.capexPercentualReceita,
        capitalGiroPercentualReceita: p.capitalGiroPercentualReceita,
        aliquotaImposto: aliquota,
        wacc: wacc,
        horizonteAnos: horizonte,
        taxaCrescimento: taxaCresc
      });
    } else {
      // Projeção uniforme
      projecaoAnual = projetarFluxosUniforme({
        receita: receita,
        custos: custos,
        depreciacaoAmortizacao: da,
        aliquotaImposto: aliquota,
        capex: capex,
        variacaoCapitalGiro: deltaWC,
        horizonteAnos: horizonte,
        taxaCrescimento: taxaCresc,
        wacc: wacc
      });
    }

    // ─── 7. Somar VP dos fluxos ───
    var somaVPFluxos = 0;
    for (var i = 0; i < projecaoAnual.length; i++) {
      somaVPFluxos += projecaoAnual[i].vpFcf;
    }

    // ─── 8. Valor Terminal ───
    var ultimoAno = projecaoAnual[projecaoAnual.length - 1];
    var fcfUltimoAno = ultimoAno ? ultimoAno.fcf : fcfBase;

    var valorTerminal  = calcularValorTerminal(fcfUltimoAno, taxaPerp, wacc);
    var vpValorTerminal = calcularVPTerminal(valorTerminal, wacc, horizonte);

    // ─── 9. Enterprise Value ───
    var enterpriseValue = somaVPFluxos + vpValorTerminal;

    // ─── 10. Composição ───
    var percentualFluxos   = dividirSeguro(somaVPFluxos, enterpriseValue);
    var percentualTerminal = dividirSeguro(vpValorTerminal, enterpriseValue);

    var composicao = {
      valorFluxos: arredondar(somaVPFluxos),
      valorTerminal: arredondar(vpValorTerminal),
      percentualFluxos: arredondar(percentualFluxos, 4),
      percentualTerminal: arredondar(percentualTerminal, 4)
    };

    // ─── 11. Equity Value ───
    var equityBruto = enterpriseValue - divLiquida;
    if (equityBruto < 0) {
      equityBruto = 0;
      alertas.push({
        tipo: 'atencao',
        mensagem: 'Enterprise Value (' + formatarMoedaCurta(enterpriseValue) +
          ') é menor que a dívida líquida (' + formatarMoedaCurta(divLiquida) +
          '). O equity bruto foi definido como zero.'
      });
    }

    // ─── 12. Descontos ───
    var descontos = aplicarDescontos(equityBruto, tipoCapital, porte);

    // ─── 13. Cenários (ETAPA 4.5) ───
    var cenarios = gerarCenarios(p, wacc);

    // ─── 14. Sensibilidade ───
    var sensibilidade = gerarMatrizSensibilidade(p, wacc, taxaPerp);

    // ─── 15. Alertas pós-cálculo ───
    var detalhesParaAlertas = {
      composicao: composicao,
      taxaCrescimento: taxaCresc,
      projecaoAnual: projecaoAnual,
      _taxaPerpetuaForcada: taxaPerpetuaForcada,
      _taxaPerpetuaOriginal: taxaPerpetuaOriginal
    };
    _alertasPosCalculo(alertas, detalhesParaAlertas, wacc, taxaPerp);

    // ─── 16. Resultado final ───
    return {
      modulo: 'DCF',
      nomeEmpresa: p.nomeEmpresa || '',
      dataCalculo: hoje(),
      valorMinimo: cenarios.pessimista.equityValue,
      valorMediano: cenarios.base.equityValue,
      valorMaximo: cenarios.otimista.equityValue,
      equityValue: descontos.equityAjustado,
      erro: false,
      alertas: alertas,
      detalhes: {
        enterpriseValue: arredondar(enterpriseValue),
        equityValue: descontos.equityAjustado,
        equityBruto: arredondar(equityBruto),
        descontos: descontos,
        wacc: arredondar(wacc, 4),
        waccDetalhes: waccDetalhes,
        taxaCrescimento: taxaCresc,
        taxaPerpetua: arredondar(taxaPerp, 4),
        taxaPerpetuaOriginal: taxaPerpetuaForcada ? taxaPerpetuaOriginal : undefined,
        horizonteAnos: horizonte,
        dividaLiquida: arredondar(divLiquida),
        tipoCapital: tipoCapital,
        porte: porte,
        setor: p.setor || 'servicos',
        usouFases: usouFases,
        anoBase: anoBaseDetalhe,
        projecaoAnual: projecaoAnual,
        valorTerminal: arredondar(valorTerminal),
        vpValorTerminal: arredondar(vpValorTerminal),
        composicao: composicao,
        sensibilidade: sensibilidade,
        cenarios: cenarios,
        resumo: {
          enterpriseValue: formatarMoedaCurta(enterpriseValue),
          equityBruto: formatarMoedaCurta(equityBruto),
          equityAjustado: formatarMoedaCurta(descontos.equityAjustado),
          wacc: formatarPct(wacc),
          taxaCrescimento: formatarPct(taxaCresc),
          taxaPerpetua: formatarPct(taxaPerp),
          margemEBIT: formatarPct(anoBaseDetalhe.margemEBIT),
          margemFCF: formatarPct(anoBaseDetalhe.margemFCF),
          percentualTerminal: formatarPct(percentualTerminal),
          pessimista: formatarMoedaCurta(cenarios.pessimista.equityValue),
          base: formatarMoedaCurta(cenarios.base.equityValue),
          otimista: formatarMoedaCurta(cenarios.otimista.equityValue)
        }
      }
    };
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // API PÚBLICA
  // ═══════════════════════════════════════════════════════════════════════════

  var API = {
    VERSION: VERSION,

    // Função principal
    calcular: calcularDCF,

    // CAPM e WACC
    calcularCAPM: calcularCAPM,
    calcularWACC: calcularWACC,
    calcularWACCAssistido: calcularWACCAssistido,

    // Core DCF
    calcularEBIT: calcularEBIT,
    calcularNOPAT: calcularNOPAT,
    calcularFCF: calcularFCF,

    // Projeção
    projetarFluxosPorFases: projetarFluxosPorFases,

    // Valor Terminal
    calcularValorTerminal: calcularValorTerminal,
    calcularVPTerminal: calcularVPTerminal,

    // Sensibilidade
    gerarMatrizSensibilidade: gerarMatrizSensibilidade,

    // Descontos e Cenários
    aplicarDescontos: aplicarDescontos,
    gerarCenarios: gerarCenarios
  };

  // Registrar no Core
  if (Core && Core._registrarModulo) {
    Core._registrarModulo('DCF', API);
  }

  return API;
  })(API);


  // ╔═══════════════════════════════════════════════════════════════════════════╗
  // ║  MÓDULO 4/6 — MÚLTIPLOS — EV/EBITDA, EV/EBIT, P/L, P/VPA, EV/Receita, EV/FCF   ║
  // ╚═══════════════════════════════════════════════════════════════════════════╝

  (function (Core) {

  // ─────────────────────────────────────────────────────────────────────────
  // Importações do Core
  // ─────────────────────────────────────────────────────────────────────────

  var arredondar = Core.arredondar;
  var dividirSeguro = Core.dividirSeguro;
  var validarNumero = Core.validarNumero;
  var SETORES_KEYS = Core.SETORES_KEYS;
  var obterDescontoPorte = Core.obterDescontoPorte;
  var obterDescontoIliquidez = Core.obterDescontoIliquidez;
  var hoje = Core.hoje;


  // ═══════════════════════════════════════════════════════════════════════════
  // MÚLTIPLOS SETORIAIS — Damodaran ajustado Brasil (6 múltiplos × 15 setores)
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Fontes: Damodaran Online (NYU Stern), adaptadas para mercado brasileiro
  // considerando prêmio de risco-país, iliquidez e porte das empresas.
  //
  // Cada setor possui 6 múltiplos: EV/EBITDA, EV/EBIT, EV/FCF, P/L,
  // EV/Receita e P/VPA, com faixas min/mediana/max representando
  // os percentis 25%, 50% e 75% das transações observadas.
  // ═══════════════════════════════════════════════════════════════════════════

  var MULTIPLOS_SETORIAIS = {

    // ─── Agronegócio ───────────────────────────────────────────────────────
    // Commodities, pecuária, grãos, insumos agrícolas, cooperativas.
    // Múltiplos moderados; alta dependência de ciclos de safra e câmbio.
    "agronegocio": {
      evEbitda:  { min: 4.0, mediana: 6.5, max: 10.0 },
      evEbit:    { min: 5.0, mediana: 8.0, max: 13.0 },
      evFcf:     { min: 6.0, mediana: 10.0, max: 16.0 },
      pl:        { min: 6.0, mediana: 10.0, max: 16.0 },
      evReceita: { min: 0.4, mediana: 0.9, max: 1.8 },
      pvpa:      { min: 0.8, mediana: 1.5, max: 2.5 }
    },

    // ─── Tecnologia / SaaS ────────────────────────────────────────────────
    // Software, SaaS, fintechs, startups tech. Múltiplos elevados por
    // escalabilidade, recorrência de receita e margens altas.
    "tecnologia": {
      evEbitda:  { min: 8.0, mediana: 14.0, max: 25.0 },
      evEbit:    { min: 10.0, mediana: 18.0, max: 30.0 },
      evFcf:     { min: 12.0, mediana: 20.0, max: 35.0 },
      pl:        { min: 10.0, mediana: 20.0, max: 40.0 },
      evReceita: { min: 1.5, mediana: 3.5, max: 8.0 },
      pvpa:      { min: 2.0, mediana: 4.0, max: 8.0 }
    },

    // ─── Varejo ────────────────────────────────────────────────────────────
    // Comércio físico e e-commerce. Margens apertadas, alto giro de
    // estoque. EV/Receita baixo, P/L moderado.
    "varejo": {
      evEbitda:  { min: 4.0, mediana: 7.0, max: 12.0 },
      evEbit:    { min: 5.5, mediana: 9.0, max: 15.0 },
      evFcf:     { min: 6.0, mediana: 10.0, max: 17.0 },
      pl:        { min: 7.0, mediana: 12.0, max: 20.0 },
      evReceita: { min: 0.3, mediana: 0.7, max: 1.5 },
      pvpa:      { min: 1.0, mediana: 1.8, max: 3.0 }
    },

    // ─── Serviços / Consultoria ────────────────────────────────────────────
    // Serviços profissionais, consultoria, TI services, BPO.
    // Asset-light: pouco ativo imobilizado, valor em capital humano.
    "servicos": {
      evEbitda:  { min: 5.0, mediana: 8.0, max: 13.0 },
      evEbit:    { min: 6.0, mediana: 9.5, max: 15.0 },
      evFcf:     { min: 7.0, mediana: 11.0, max: 18.0 },
      pl:        { min: 8.0, mediana: 13.0, max: 22.0 },
      evReceita: { min: 0.5, mediana: 1.2, max: 2.5 },
      pvpa:      { min: 1.5, mediana: 2.5, max: 4.5 }
    },

    // ─── Saúde ─────────────────────────────────────────────────────────────
    // Hospitais, clínicas, laboratórios, farmacêuticas, healthtechs.
    // Demanda inelástica, regulação pesada, múltiplos acima da média.
    "saude": {
      evEbitda:  { min: 6.0, mediana: 10.0, max: 16.0 },
      evEbit:    { min: 7.5, mediana: 12.0, max: 20.0 },
      evFcf:     { min: 8.0, mediana: 14.0, max: 22.0 },
      pl:        { min: 8.0, mediana: 15.0, max: 25.0 },
      evReceita: { min: 0.8, mediana: 1.8, max: 3.5 },
      pvpa:      { min: 1.2, mediana: 2.0, max: 3.5 }
    },

    // ─── Construção Civil ──────────────────────────────────────────────────
    // Incorporadoras, construtoras, infraestrutura. Alta ciclicidade,
    // capital intensivo, projetos longos. P/VPA é muito relevante.
    "construcao": {
      evEbitda:  { min: 3.5, mediana: 6.0, max: 10.0 },
      evEbit:    { min: 4.5, mediana: 7.5, max: 12.0 },
      evFcf:     { min: 5.0, mediana: 8.0, max: 14.0 },
      pl:        { min: 5.0, mediana: 8.0, max: 14.0 },
      evReceita: { min: 0.3, mediana: 0.7, max: 1.5 },
      pvpa:      { min: 0.6, mediana: 1.2, max: 2.0 }
    },

    // ─── Indústria / Manufatura ────────────────────────────────────────────
    // Metalurgia, automotivo, bens de capital, químico. Capital intensivo,
    // depreciação relevante. EV/EBIT mais informativo que EV/EBITDA.
    "industria": {
      evEbitda:  { min: 4.0, mediana: 6.5, max: 11.0 },
      evEbit:    { min: 5.5, mediana: 8.5, max: 14.0 },
      evFcf:     { min: 6.0, mediana: 9.5, max: 15.0 },
      pl:        { min: 6.0, mediana: 10.0, max: 16.0 },
      evReceita: { min: 0.4, mediana: 0.8, max: 1.6 },
      pvpa:      { min: 0.8, mediana: 1.4, max: 2.2 }
    },

    // ─── Alimentação ───────────────────────────────────────────────────────
    // Alimentos e bebidas, food service, restaurantes. Demanda resiliente,
    // margens moderadas, branding relevante em premium.
    "alimentacao": {
      evEbitda:  { min: 5.0, mediana: 8.0, max: 13.0 },
      evEbit:    { min: 6.0, mediana: 10.0, max: 16.0 },
      evFcf:     { min: 7.0, mediana: 11.0, max: 18.0 },
      pl:        { min: 7.0, mediana: 12.0, max: 20.0 },
      evReceita: { min: 0.5, mediana: 1.0, max: 2.0 },
      pvpa:      { min: 1.0, mediana: 1.8, max: 3.0 }
    },

    // ─── Educação ──────────────────────────────────────────────────────────
    // Ensino superior, cursos livres, edtechs. Receita recorrente,
    // regulação do MEC, consolidação do setor.
    "educacao": {
      evEbitda:  { min: 5.0, mediana: 8.0, max: 14.0 },
      evEbit:    { min: 6.0, mediana: 10.0, max: 16.0 },
      evFcf:     { min: 7.0, mediana: 11.0, max: 19.0 },
      pl:        { min: 7.0, mediana: 12.0, max: 22.0 },
      evReceita: { min: 0.6, mediana: 1.3, max: 2.8 },
      pvpa:      { min: 1.0, mediana: 2.0, max: 3.5 }
    },

    // ─── Transporte / Logística ────────────────────────────────────────────
    // Transporte rodoviário, aéreo, marítimo, operadores logísticos.
    // Capital intensivo (frota), margens pressionadas por diesel/pedágio.
    "transporte": {
      evEbitda:  { min: 3.5, mediana: 5.5, max: 9.0 },
      evEbit:    { min: 4.5, mediana: 7.0, max: 11.0 },
      evFcf:     { min: 5.0, mediana: 8.0, max: 13.0 },
      pl:        { min: 5.0, mediana: 9.0, max: 15.0 },
      evReceita: { min: 0.3, mediana: 0.6, max: 1.2 },
      pvpa:      { min: 0.7, mediana: 1.2, max: 2.0 }
    },

    // ─── Energia ───────────────────────────────────────────────────────────
    // Geração, transmissão, distribuição, renováveis. Regulação ANEEL,
    // contratos de longo prazo, fluxo de caixa previsível.
    "energia": {
      evEbitda:  { min: 5.0, mediana: 8.0, max: 12.0 },
      evEbit:    { min: 6.0, mediana: 9.5, max: 15.0 },
      evFcf:     { min: 7.0, mediana: 11.0, max: 17.0 },
      pl:        { min: 6.0, mediana: 10.0, max: 16.0 },
      evReceita: { min: 0.8, mediana: 1.5, max: 3.0 },
      pvpa:      { min: 0.8, mediana: 1.5, max: 2.5 }
    },

    // ─── Financeiro ────────────────────────────────────────────────────────
    // Bancos, seguradoras, gestoras, corretoras, fintechs financeiras.
    // P/VPA é o múltiplo mais relevante. EV/EBITDA menos aplicável.
    "financeiro": {
      evEbitda:  { min: 6.0, mediana: 10.0, max: 16.0 },
      evEbit:    { min: 7.0, mediana: 11.0, max: 18.0 },
      evFcf:     { min: 8.0, mediana: 13.0, max: 20.0 },
      pl:        { min: 6.0, mediana: 10.0, max: 18.0 },
      evReceita: { min: 1.0, mediana: 2.5, max: 5.0 },
      pvpa:      { min: 0.8, mediana: 1.5, max: 3.0 }
    },

    // ─── Imobiliário ───────────────────────────────────────────────────────
    // FIIs, administradoras de shopping, locação comercial.
    // P/VPA é o múltiplo mais importante (NAV). EV/FCF menos confiável.
    "imobiliario": {
      evEbitda:  { min: 6.0, mediana: 10.0, max: 16.0 },
      evEbit:    { min: 7.0, mediana: 11.0, max: 18.0 },
      evFcf:     { min: 7.0, mediana: 12.0, max: 20.0 },
      pl:        { min: 6.0, mediana: 10.0, max: 18.0 },
      evReceita: { min: 1.0, mediana: 2.5, max: 5.0 },
      pvpa:      { min: 0.5, mediana: 1.0, max: 1.8 }
    },

    // ─── Telecomunicações ──────────────────────────────────────────────────
    // Operadoras fixas/móveis, ISPs, torres, data centers.
    // Alto CAPEX, receita recorrente, consolidação intensa.
    "telecomunicacoes": {
      evEbitda:  { min: 4.0, mediana: 6.5, max: 10.0 },
      evEbit:    { min: 5.5, mediana: 8.5, max: 13.0 },
      evFcf:     { min: 6.0, mediana: 9.0, max: 15.0 },
      pl:        { min: 6.0, mediana: 10.0, max: 17.0 },
      evReceita: { min: 0.8, mediana: 1.5, max: 2.8 },
      pvpa:      { min: 0.8, mediana: 1.3, max: 2.2 }
    },

    // ─── Meio Ambiente / Sustentabilidade ──────────────────────────────────
    // Saneamento, resíduos, reciclagem, créditos de carbono, ESG.
    // Contratos de concessão, regulação, crescente apelo ESG.
    "meioambiente": {
      evEbitda:  { min: 5.0, mediana: 8.0, max: 13.0 },
      evEbit:    { min: 6.0, mediana: 9.5, max: 15.0 },
      evFcf:     { min: 7.0, mediana: 11.0, max: 18.0 },
      pl:        { min: 7.0, mediana: 12.0, max: 20.0 },
      evReceita: { min: 0.6, mediana: 1.3, max: 2.5 },
      pvpa:      { min: 0.9, mediana: 1.6, max: 2.8 }
    }
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // PESOS POR MÉTODO E POR SETOR (ETAPA 5.3)
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Pesos padrão para ponderação dos 6 sub-métodos. Setores específicos
  // possuem pesos diferenciados que refletem a relevância de cada múltiplo
  // para aquele tipo de negócio.
  // ═══════════════════════════════════════════════════════════════════════════

  var PESOS_METODOS_PADRAO = {
    evEbitda: 0.25,
    evEbit:   0.10,
    evFcf:    0.10,
    pl:       0.25,
    evReceita: 0.15,
    pvpa:     0.15
  };

  var PESOS_METODOS_POR_SETOR = {

    // Serviços: P/L mais importante (capital humano, sem ativos fixos relevantes)
    "servicos": {
      evEbitda: 0.20, evEbit: 0.10, evFcf: 0.10,
      pl: 0.30, evReceita: 0.15, pvpa: 0.15
    },

    // Tecnologia: EV/Receita ganha peso (muitas empresas sem lucro ainda)
    "tecnologia": {
      evEbitda: 0.25, evEbit: 0.05, evFcf: 0.15,
      pl: 0.20, evReceita: 0.25, pvpa: 0.10
    },

    // Indústria: EV/EBIT e P/VPA relevantes (capital intensivo, depreciação alta)
    "industria": {
      evEbitda: 0.25, evEbit: 0.20, evFcf: 0.10,
      pl: 0.15, evReceita: 0.10, pvpa: 0.20
    },

    // Imobiliário: P/VPA é o principal (NAV = Net Asset Value)
    "imobiliario": {
      evEbitda: 0.15, evEbit: 0.10, evFcf: 0.05,
      pl: 0.15, evReceita: 0.10, pvpa: 0.45
    },

    // Financeiro: P/VPA e P/L dominam, EV/EBITDA menos aplicável
    "financeiro": {
      evEbitda: 0.10, evEbit: 0.05, evFcf: 0.10,
      pl: 0.30, evReceita: 0.10, pvpa: 0.35
    },

    // Energia: EV/EBITDA e EV/FCF relevantes (fluxo previsível)
    "energia": {
      evEbitda: 0.30, evEbit: 0.10, evFcf: 0.15,
      pl: 0.20, evReceita: 0.10, pvpa: 0.15
    },

    // Construção: P/VPA relevante (ativos tangíveis), EV/EBITDA cíclico
    "construcao": {
      evEbitda: 0.20, evEbit: 0.15, evFcf: 0.10,
      pl: 0.15, evReceita: 0.10, pvpa: 0.30
    },

    // Transporte: EV/EBIT relevante (depreciação de frota)
    "transporte": {
      evEbitda: 0.25, evEbit: 0.20, evFcf: 0.10,
      pl: 0.15, evReceita: 0.10, pvpa: 0.20
    },

    // Telecomunicações: EV/EBITDA dominante (padrão do setor globalmente)
    "telecomunicacoes": {
      evEbitda: 0.35, evEbit: 0.10, evFcf: 0.10,
      pl: 0.15, evReceita: 0.15, pvpa: 0.15
    },

    // Saúde: EV/EBITDA e P/L balanceados
    "saude": {
      evEbitda: 0.25, evEbit: 0.10, evFcf: 0.10,
      pl: 0.25, evReceita: 0.15, pvpa: 0.15
    },

    // Varejo: EV/EBITDA e P/L, EV/Receita por margens apertadas
    "varejo": {
      evEbitda: 0.25, evEbit: 0.10, evFcf: 0.10,
      pl: 0.25, evReceita: 0.15, pvpa: 0.15
    },

    // Alimentação: similar a varejo, com mais peso em marca (P/L)
    "alimentacao": {
      evEbitda: 0.25, evEbit: 0.10, evFcf: 0.10,
      pl: 0.25, evReceita: 0.15, pvpa: 0.15
    },

    // Educação: receita recorrente, P/L e EV/EBITDA importantes
    "educacao": {
      evEbitda: 0.25, evEbit: 0.10, evFcf: 0.10,
      pl: 0.25, evReceita: 0.15, pvpa: 0.15
    },

    // Agronegócio: EV/EBITDA e P/VPA (terras e ativos biológicos)
    "agronegocio": {
      evEbitda: 0.25, evEbit: 0.10, evFcf: 0.10,
      pl: 0.20, evReceita: 0.10, pvpa: 0.25
    },

    // Meio Ambiente: EV/EBITDA e EV/FCF (concessões de longo prazo)
    "meioambiente": {
      evEbitda: 0.25, evEbit: 0.10, evFcf: 0.15,
      pl: 0.20, evReceita: 0.15, pvpa: 0.15
    }
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // NOMES DOS MÉTODOS (para relatórios)
  // ═══════════════════════════════════════════════════════════════════════════

  var NOMES_METODOS = {
    evEbitda:  'EV/EBITDA',
    evEbit:    'EV/EBIT',
    evFcf:     'EV/FCF',
    pl:        'P/L (Preço/Lucro)',
    evReceita: 'EV/Receita',
    pvpa:      'P/VPA'
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // FUNÇÕES AUXILIARES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Cria uma faixa { min, mediana, max } arredondada.
   *
   * @param {number} minV  - Valor mínimo
   * @param {number} medV  - Valor mediano
   * @param {number} maxV  - Valor máximo
   * @returns {Object} { min, mediana, max }
   */
  function criarFaixa(minV, medV, maxV) {
    return {
      min:     arredondar(validarNumero(minV)),
      mediana: arredondar(validarNumero(medV)),
      max:     arredondar(validarNumero(maxV))
    };
  }

  /**
   * Multiplica uma faixa por um valor escalar.
   *
   * @param {Object} faixa    - { min, mediana, max }
   * @param {number} escalar  - Valor a multiplicar
   * @returns {Object} { min, mediana, max }
   */
  function multiplicarFaixa(faixa, escalar) {
    var e = validarNumero(escalar);
    return criarFaixa(faixa.min * e, faixa.mediana * e, faixa.max * e);
  }

  /**
   * Subtrai um valor escalar de uma faixa (ex.: EV - Dívida Líquida).
   *
   * @param {Object} faixa    - { min, mediana, max }
   * @param {number} escalar  - Valor a subtrair
   * @returns {Object} { min, mediana, max }
   */
  function subtrairFaixa(faixa, escalar) {
    var e = validarNumero(escalar);
    return criarFaixa(faixa.min - e, faixa.mediana - e, faixa.max - e);
  }

  /**
   * Média ponderada de duas faixas de múltiplos.
   * Usado para blending de múltiplos setoriais + custom.
   *
   * @param {Object} faixaA - { min, mediana, max }
   * @param {Object} faixaB - { min, mediana, max }
   * @param {number} pesoA  - Peso da faixa A (0-1)
   * @param {number} pesoB  - Peso da faixa B (0-1)
   * @returns {Object} { min, mediana, max }
   */
  function blendarFaixas(faixaA, faixaB, pesoA, pesoB) {
    var somaP = pesoA + pesoB;
    if (somaP === 0) return criarFaixa(0, 0, 0);
    var pA = pesoA / somaP;
    var pB = pesoB / somaP;
    return criarFaixa(
      faixaA.min * pA + faixaB.min * pB,
      faixaA.mediana * pA + faixaB.mediana * pB,
      faixaA.max * pA + faixaB.max * pB
    );
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // OBTER MÚLTIPLOS DO SETOR
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Retorna os múltiplos de referência para um setor.
   * Se o setor não existir, retorna "servicos" como fallback.
   *
   * @param {string} setor - Chave do setor (ex.: "tecnologia")
   * @returns {Object} Múltiplos do setor com 6 métricas
   */
  function obterMultiplosSetor(setor) {
    return MULTIPLOS_SETORIAIS[setor] || MULTIPLOS_SETORIAIS["servicos"];
  }

  /**
   * Retorna os pesos dos métodos para um setor.
   *
   * @param {string} setor - Chave do setor
   * @returns {Object} Pesos { evEbitda, evEbit, evFcf, pl, evReceita, pvpa }
   */
  function obterPesosSetor(setor) {
    return PESOS_METODOS_POR_SETOR[setor] || PESOS_METODOS_PADRAO;
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // MÚLTIPLOS CUSTOMIZADOS (ETAPA 5.1) — Blending M&A
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Calcula a média dos múltiplos customizados de transações M&A.
   * Múltiplos não informados (undefined/null/0) são ignorados.
   *
   * @param {Array} multiplosCustom - Array de objetos com múltiplos de transações
   *   Cada item: { fonteNome, evEbitda, evEbit, evFcf, pl, evReceita, pvpa }
   * @returns {Object|null} Média dos múltiplos custom ou null se vazio
   */
  function calcularMediaCustom(multiplosCustom) {
    if (!multiplosCustom || multiplosCustom.length === 0) return null;

    var chaves = ['evEbitda', 'evEbit', 'evFcf', 'pl', 'evReceita', 'pvpa'];
    var somas = {};
    var contagens = {};

    for (var c = 0; c < chaves.length; c++) {
      somas[chaves[c]] = 0;
      contagens[chaves[c]] = 0;
    }

    for (var i = 0; i < multiplosCustom.length; i++) {
      var trans = multiplosCustom[i];
      for (var j = 0; j < chaves.length; j++) {
        var chave = chaves[j];
        var val = validarNumero(trans[chave]);
        if (val > 0) {
          somas[chave] += val;
          contagens[chave] += 1;
        }
      }
    }

    var resultado = {};
    var temAlgum = false;
    for (var k = 0; k < chaves.length; k++) {
      var ch = chaves[k];
      if (contagens[ch] > 0) {
        var media = somas[ch] / contagens[ch];
        // Usar a média como mediana, com ±20% para min/max
        resultado[ch] = {
          min:     arredondar(media * 0.80),
          mediana: arredondar(media),
          max:     arredondar(media * 1.20)
        };
        temAlgum = true;
      } else {
        resultado[ch] = null;
      }
    }

    return temAlgum ? resultado : null;
  }

  /**
   * Mescla múltiplos setoriais com múltiplos customizados.
   * Custom recebe 40% de peso, setor 60%.
   *
   * @param {Object} setorial   - Múltiplos do setor
   * @param {Object} custom     - Múltiplos customizados (de calcularMediaCustom)
   * @returns {Object} Múltiplos mesclados
   */
  function mesclarMultiplos(setorial, custom) {
    if (!custom) return setorial;

    var PESO_SETOR = 0.60;
    var PESO_CUSTOM = 0.40;
    var chaves = ['evEbitda', 'evEbit', 'evFcf', 'pl', 'evReceita', 'pvpa'];
    var resultado = {};

    for (var i = 0; i < chaves.length; i++) {
      var ch = chaves[i];
      if (custom[ch]) {
        resultado[ch] = blendarFaixas(setorial[ch], custom[ch], PESO_SETOR, PESO_CUSTOM);
      } else {
        resultado[ch] = setorial[ch];
      }
    }

    return resultado;
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // DESCONTOS (Iliquidez + Porte)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Aplica descontos de iliquidez e porte sobre o equity bruto.
   *
   * @param {number} equityBruto - Valor bruto do equity
   * @param {string} tipoCapital - "aberto" ou "fechado"
   * @param {string} porte       - "micro", "pequena", "media", "grande"
   * @returns {number} Equity ajustado após descontos
   */
  function aplicarDescontos(equityBruto, tipoCapital, porte) {
    var descIliq = obterDescontoIliquidez(tipoCapital);
    var descPorte = obterDescontoPorte(porte);
    var valor = validarNumero(equityBruto);
    return arredondar(valor * (1 - descIliq) * (1 - descPorte));
  }

  /**
   * Aplica descontos sobre uma faixa inteira { min, mediana, max }.
   *
   * @param {Object} faixa       - { min, mediana, max }
   * @param {string} tipoCapital - "aberto" ou "fechado"
   * @param {string} porte       - "micro", "pequena", "media", "grande"
   * @returns {Object} Faixa ajustada { min, mediana, max }
   */
  function aplicarDescontosFaixa(faixa, tipoCapital, porte) {
    return {
      min:     aplicarDescontos(faixa.min, tipoCapital, porte),
      mediana: aplicarDescontos(faixa.mediana, tipoCapital, porte),
      max:     aplicarDescontos(faixa.max, tipoCapital, porte)
    };
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // CÁLCULOS INDIVIDUAIS POR MÉTODO
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Conveniência: calcula EBITDA a partir de EBIT + D&A.
   *
   * @param {number} ebit - Lucro operacional (EBIT)
   * @param {number} da   - Depreciação e Amortização
   * @returns {number} EBITDA
   */
  function calcularEBITDA(ebit, da) {
    return arredondar(validarNumero(ebit) + validarNumero(da));
  }

  /**
   * EV/EBITDA — Enterprise Value / EBITDA.
   * Múltiplo mais utilizado em M&A e avaliação. Neutro em relação à
   * estrutura de capital e depreciação.
   *
   * @param {number} ebitda         - EBITDA anual
   * @param {number} dividaLiquida  - Dívida líquida (dívida bruta - caixa)
   * @param {Object|number} multiplo - Faixa { min, mediana, max } ou número
   * @returns {Object} Resultado do método
   */
  function calcularPorEVEBITDA(ebitda, dividaLiquida, multiplo) {
    var eb = validarNumero(ebitda);
    var dl = validarNumero(dividaLiquida);

    if (eb <= 0) {
      return {
        metodo: 'EV/EBITDA',
        aplicavel: false,
        motivoNaoAplicavel: 'EBITDA negativo ou zero — múltiplo não aplicável',
        multiploUsado: null,
        enterpriseValue: criarFaixa(0, 0, 0),
        equityBruto: criarFaixa(0, 0, 0),
        equityAjustado: criarFaixa(0, 0, 0)
      };
    }

    var faixaM = _normalizarMultiplo(multiplo);
    var ev = multiplicarFaixa(faixaM, eb);
    var equity = subtrairFaixa(ev, dl);

    return {
      metodo: 'EV/EBITDA',
      aplicavel: true,
      motivoNaoAplicavel: null,
      multiploUsado: faixaM,
      enterpriseValue: ev,
      equityBruto: equity,
      equityAjustado: equity // será ajustado na consolidação
    };
  }

  /**
   * EV/EBIT — Enterprise Value / EBIT (ETAPA 5.2).
   * Mais preciso que EV/EBITDA para empresas capital-intensivas, pois
   * inclui o efeito da depreciação (desgaste real dos ativos).
   *
   * @param {number} ebit           - Lucro operacional (EBIT)
   * @param {number} dividaLiquida  - Dívida líquida
   * @param {Object|number} multiplo - Faixa { min, mediana, max } ou número
   * @returns {Object} Resultado do método
   */
  function calcularPorEVEBIT(ebit, dividaLiquida, multiplo) {
    var eb = validarNumero(ebit);
    var dl = validarNumero(dividaLiquida);

    if (eb <= 0) {
      return {
        metodo: 'EV/EBIT',
        aplicavel: false,
        motivoNaoAplicavel: 'EBIT negativo ou zero — múltiplo não aplicável',
        multiploUsado: null,
        enterpriseValue: criarFaixa(0, 0, 0),
        equityBruto: criarFaixa(0, 0, 0),
        equityAjustado: criarFaixa(0, 0, 0)
      };
    }

    var faixaM = _normalizarMultiplo(multiplo);
    var ev = multiplicarFaixa(faixaM, eb);
    var equity = subtrairFaixa(ev, dl);

    return {
      metodo: 'EV/EBIT',
      aplicavel: true,
      motivoNaoAplicavel: null,
      multiploUsado: faixaM,
      enterpriseValue: ev,
      equityBruto: equity,
      equityAjustado: equity
    };
  }

  /**
   * EV/FCF — Enterprise Value / Free Cash Flow (ETAPA 5.2).
   * Múltiplo mais rigoroso: considera CAPEX e variação de capital de giro.
   * Mais preciso que EV/EBITDA, porém mais volátil.
   *
   * @param {number} fcf            - Fluxo de Caixa Livre (FCF)
   * @param {number} dividaLiquida  - Dívida líquida
   * @param {Object|number} multiplo - Faixa { min, mediana, max } ou número
   * @returns {Object} Resultado do método
   */
  function calcularPorEVFCF(fcf, dividaLiquida, multiplo) {
    var f = validarNumero(fcf);
    var dl = validarNumero(dividaLiquida);

    if (f <= 0) {
      return {
        metodo: 'EV/FCF',
        aplicavel: false,
        motivoNaoAplicavel: 'Fluxo de Caixa Livre (FCF) negativo ou zero — múltiplo não aplicável',
        multiploUsado: null,
        enterpriseValue: criarFaixa(0, 0, 0),
        equityBruto: criarFaixa(0, 0, 0),
        equityAjustado: criarFaixa(0, 0, 0)
      };
    }

    var faixaM = _normalizarMultiplo(multiplo);
    var ev = multiplicarFaixa(faixaM, f);
    var equity = subtrairFaixa(ev, dl);

    return {
      metodo: 'EV/FCF',
      aplicavel: true,
      motivoNaoAplicavel: null,
      multiploUsado: faixaM,
      enterpriseValue: ev,
      equityBruto: equity,
      equityAjustado: equity
    };
  }

  /**
   * P/L — Preço / Lucro Líquido.
   * Múltiplo direto sobre equity (não passa por Enterprise Value).
   * Amplamente utilizado, mas sensível a estrutura de capital e impostos.
   *
   * @param {number} lucroLiquido   - Lucro líquido anual
   * @param {Object|number} multiplo - Faixa { min, mediana, max } ou número
   * @returns {Object} Resultado do método
   */
  function calcularPorPL(lucroLiquido, multiplo) {
    var ll = validarNumero(lucroLiquido);

    if (ll <= 0) {
      return {
        metodo: 'P/L (Preço/Lucro)',
        aplicavel: false,
        motivoNaoAplicavel: 'Lucro Líquido negativo ou zero — múltiplo não aplicável',
        multiploUsado: null,
        enterpriseValue: null,
        equityBruto: criarFaixa(0, 0, 0),
        equityAjustado: criarFaixa(0, 0, 0)
      };
    }

    var faixaM = _normalizarMultiplo(multiplo);
    var equity = multiplicarFaixa(faixaM, ll);

    return {
      metodo: 'P/L (Preço/Lucro)',
      aplicavel: true,
      motivoNaoAplicavel: null,
      multiploUsado: faixaM,
      enterpriseValue: null, // P/L é direto sobre equity
      equityBruto: equity,
      equityAjustado: equity
    };
  }

  /**
   * EV/Receita — Enterprise Value / Receita Líquida.
   * Útil para empresas sem lucro (startups, turnaround).
   * Menos preciso em setores com margens muito variáveis.
   *
   * @param {number} receita        - Receita líquida anual
   * @param {number} dividaLiquida  - Dívida líquida
   * @param {Object|number} multiplo - Faixa { min, mediana, max } ou número
   * @returns {Object} Resultado do método
   */
  function calcularPorEVReceita(receita, dividaLiquida, multiplo) {
    var rec = validarNumero(receita);
    var dl = validarNumero(dividaLiquida);

    if (rec <= 0) {
      return {
        metodo: 'EV/Receita',
        aplicavel: false,
        motivoNaoAplicavel: 'Receita negativa ou zero — múltiplo não aplicável',
        multiploUsado: null,
        enterpriseValue: criarFaixa(0, 0, 0),
        equityBruto: criarFaixa(0, 0, 0),
        equityAjustado: criarFaixa(0, 0, 0)
      };
    }

    var faixaM = _normalizarMultiplo(multiplo);
    var ev = multiplicarFaixa(faixaM, rec);
    var equity = subtrairFaixa(ev, dl);

    return {
      metodo: 'EV/Receita',
      aplicavel: true,
      motivoNaoAplicavel: null,
      multiploUsado: faixaM,
      enterpriseValue: ev,
      equityBruto: equity,
      equityAjustado: equity
    };
  }

  /**
   * P/VPA — Preço / Valor Patrimonial por Ação.
   * Compara valor de mercado com valor contábil dos sócios.
   * Essencial para setores imobiliário e financeiro.
   *
   * @param {number} patrimonioLiquido - Patrimônio Líquido contábil
   * @param {Object|number} multiplo    - Faixa { min, mediana, max } ou número
   * @returns {Object} Resultado do método
   */
  function calcularPorPVPA(patrimonioLiquido, multiplo) {
    var pl = validarNumero(patrimonioLiquido);

    if (pl <= 0) {
      return {
        metodo: 'P/VPA',
        aplicavel: false,
        motivoNaoAplicavel: 'Patrimônio Líquido negativo ou zero — múltiplo não aplicável',
        multiploUsado: null,
        enterpriseValue: null,
        equityBruto: criarFaixa(0, 0, 0),
        equityAjustado: criarFaixa(0, 0, 0)
      };
    }

    var faixaM = _normalizarMultiplo(multiplo);
    var equity = multiplicarFaixa(faixaM, pl);

    return {
      metodo: 'P/VPA',
      aplicavel: true,
      motivoNaoAplicavel: null,
      multiploUsado: faixaM,
      enterpriseValue: null, // P/VPA é direto sobre equity
      equityBruto: equity,
      equityAjustado: equity
    };
  }

  /**
   * Normaliza um múltiplo: aceita número escalar ou faixa { min, mediana, max }.
   *
   * @param {number|Object} multiplo - Escalar ou faixa
   * @returns {Object} { min, mediana, max }
   * @private
   */
  function _normalizarMultiplo(multiplo) {
    if (multiplo && typeof multiplo === 'object' &&
        multiplo.min !== undefined && multiplo.mediana !== undefined && multiplo.max !== undefined) {
      return {
        min:     validarNumero(multiplo.min),
        mediana: validarNumero(multiplo.mediana),
        max:     validarNumero(multiplo.max)
      };
    }
    var val = validarNumero(multiplo);
    return { min: val, mediana: val, max: val };
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // CONSOLIDAÇÃO COM PESOS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Consolida os resultados dos 6 métodos em uma faixa ponderada.
   *
   * A mediana consolidada é a média ponderada das medianas dos métodos
   * aplicáveis. Os pesos dos métodos não aplicáveis são redistribuídos
   * proporcionalmente entre os aplicáveis.
   *
   * Min consolidado = menor min entre os aplicáveis.
   * Max consolidado = maior max entre os aplicáveis.
   *
   * @param {Object} metodos - { evEbitda, evEbit, evFcf, pl, evReceita, pvpa }
   *   Cada um é o resultado de calcularPor*()
   * @param {Object} pesos   - { evEbitda: 0.25, evEbit: 0.10, ... }
   * @returns {Object} { minimo, mediano, maximo, metodosPonderados }
   */
  function consolidarResultados(metodos, pesos) {
    var chaves = ['evEbitda', 'evEbit', 'evFcf', 'pl', 'evReceita', 'pvpa'];
    var pesosEfetivos = pesos || PESOS_METODOS_PADRAO;

    // Separar métodos aplicáveis
    var aplicaveis = [];
    var somaPesosAplicaveis = 0;

    for (var i = 0; i < chaves.length; i++) {
      var ch = chaves[i];
      var metodo = metodos[ch];
      if (metodo && metodo.aplicavel) {
        aplicaveis.push({
          chave: ch,
          metodo: metodo,
          pesoOriginal: validarNumero(pesosEfetivos[ch])
        });
        somaPesosAplicaveis += validarNumero(pesosEfetivos[ch]);
      }
    }

    // Sem métodos aplicáveis
    if (aplicaveis.length === 0) {
      return {
        minimo: 0,
        mediano: 0,
        maximo: 0,
        metodosPonderados: []
      };
    }

    // Redistribuir pesos proporcionalmente
    var medianaConsolidada = 0;
    var minConsolidado = Infinity;
    var maxConsolidado = -Infinity;
    var metodosPonderados = [];

    for (var j = 0; j < aplicaveis.length; j++) {
      var item = aplicaveis[j];
      var pesoRedistribuido = somaPesosAplicaveis > 0
        ? item.pesoOriginal / somaPesosAplicaveis
        : 1 / aplicaveis.length;

      var eqAjustado = item.metodo.equityAjustado;

      medianaConsolidada += eqAjustado.mediana * pesoRedistribuido;

      if (eqAjustado.min < minConsolidado) {
        minConsolidado = eqAjustado.min;
      }
      if (eqAjustado.max > maxConsolidado) {
        maxConsolidado = eqAjustado.max;
      }

      metodosPonderados.push({
        chave: item.chave,
        nome: NOMES_METODOS[item.chave] || item.chave,
        pesoOriginal: arredondar(item.pesoOriginal, 4),
        pesoRedistribuido: arredondar(pesoRedistribuido, 4),
        mediana: arredondar(eqAjustado.mediana),
        contribuicao: arredondar(eqAjustado.mediana * pesoRedistribuido)
      });
    }

    // Proteger contra Infinity (se nenhum min/max válido)
    if (!isFinite(minConsolidado)) minConsolidado = 0;
    if (!isFinite(maxConsolidado)) maxConsolidado = 0;

    return {
      minimo:  arredondar(minConsolidado),
      mediano: arredondar(medianaConsolidada),
      maximo:  arredondar(maxConsolidado),
      metodosPonderados: metodosPonderados
    };
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // FUNÇÃO PRINCIPAL: calcularMultiplos(inputs)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Calcula o valor da empresa pelo método de Múltiplos de Mercado.
   *
   * Executa os 6 sub-métodos (EV/EBITDA, EV/EBIT, EV/FCF, P/L, EV/Receita,
   * P/VPA), aplica descontos de iliquidez e porte, e consolida com pesos
   * setoriais (ou customizados).
   *
   * @param {Object} inputs
   *   - nomeEmpresa {string}           Nome da empresa
   *   - setor {string}                  Chave do setor (ex.: "tecnologia")
   *   - porte {string}                  "micro"|"pequena"|"media"|"grande"
   *   - tipoCapital {string}            "aberto"|"fechado"
   *   - receita {number}                Receita líquida anual
   *   - ebitda {number}                 EBITDA anual
   *   - ebit {number}                   EBIT anual
   *   - lucroLiquido {number}           Lucro líquido anual
   *   - fcf {number}                    Fluxo de Caixa Livre (FCF) anual
   *   - patrimonioLiquido {number}      Patrimônio líquido contábil
   *   - dividaLiquida {number}          Dívida líquida (dívida bruta - caixa)
   *   - depreciacaoAmortizacao {number} D&A (para calcular EBITDA se não informado)
   *   - multiplosCustom {Array}         [opcional] Múltiplos de transações M&A
   *     Cada item: { fonteNome, evEbitda, evEbit, evFcf, pl, evReceita, pvpa }
   *   - pesosMetodos {Object}           [opcional] Override dos pesos
   *     { evEbitda: 0.25, evEbit: 0.10, evFcf: 0.10, pl: 0.25, evReceita: 0.15, pvpa: 0.15 }
   *
   * @returns {Object} Resultado completo da avaliação por múltiplos
   *   - modulo {string}         'MULTIPLOS'
   *   - nomeEmpresa {string}
   *   - dataCalculo {string}    ISO date
   *   - valorMinimo {number}    Menor valor estimado (equity ajustado)
   *   - valorMediano {number}   Valor central estimado (equity ajustado)
   *   - valorMaximo {number}    Maior valor estimado (equity ajustado)
   *   - equityValue {number}    = valorMediano (mediano ajustado)
   *   - erro {boolean}
   *   - mensagem {string|null}
   *   - alertas {Array}         Lista de alertas/avisos
   *   - detalhes {Object}       Detalhamento completo
   */
  function calcularMultiplos(inputs) {
    // ── Validação de entrada ───────────────────────────────────────────────
    if (!inputs) {
      return _criarErro('Inputs não fornecidos');
    }

    var nomeEmpresa = inputs.nomeEmpresa || '';
    var setor = inputs.setor || 'servicos';
    var porte = inputs.porte || 'pequena';
    var tipoCapital = inputs.tipoCapital || 'fechado';

    // Validar setor
    if (SETORES_KEYS.indexOf(setor) === -1) {
      setor = 'servicos';
    }

    var receita   = validarNumero(inputs.receita);
    var ebitda    = validarNumero(inputs.ebitda);
    var ebit      = validarNumero(inputs.ebit);
    var ll        = validarNumero(inputs.lucroLiquido);
    var fcf       = validarNumero(inputs.fcf);
    var plContab  = validarNumero(inputs.patrimonioLiquido);
    var dl        = validarNumero(inputs.dividaLiquida);
    var da        = validarNumero(inputs.depreciacaoAmortizacao);

    // Se EBITDA não informado mas EBIT + D&A sim, calcular
    if (ebitda === 0 && ebit > 0 && da > 0) {
      ebitda = calcularEBITDA(ebit, da);
    }

    // Se EBIT não informado mas EBITDA - D&A sim, calcular
    if (ebit === 0 && ebitda > 0 && da > 0) {
      ebit = arredondar(ebitda - da);
    }

    var alertas = [];

    // ── Obter múltiplos de referência ──────────────────────────────────────
    var multiplosSetor = obterMultiplosSetor(setor);
    var multiplosCustomMedia = null;
    var multiplosFinais = multiplosSetor;
    var usandoCustom = false;

    if (inputs.multiplosCustom && inputs.multiplosCustom.length > 0) {
      multiplosCustomMedia = calcularMediaCustom(inputs.multiplosCustom);
      if (multiplosCustomMedia) {
        multiplosFinais = mesclarMultiplos(multiplosSetor, multiplosCustomMedia);
        usandoCustom = true;
        alertas.push(
          'Múltiplos customizados de ' + inputs.multiplosCustom.length +
          ' transação(ões) M&A incorporados (peso 40% custom, 60% setorial).'
        );
      }
    }

    // ── Calcular cada método ───────────────────────────────────────────────
    var metodos = {
      evEbitda:  calcularPorEVEBITDA(ebitda, dl, multiplosFinais.evEbitda),
      evEbit:    calcularPorEVEBIT(ebit, dl, multiplosFinais.evEbit),
      evFcf:     calcularPorEVFCF(fcf, dl, multiplosFinais.evFcf),
      pl:        calcularPorPL(ll, multiplosFinais.pl),
      evReceita: calcularPorEVReceita(receita, dl, multiplosFinais.evReceita),
      pvpa:      calcularPorPVPA(plContab, multiplosFinais.pvpa)
    };

    // ── Aplicar descontos em cada método ───────────────────────────────────
    var chavesMetodos = ['evEbitda', 'evEbit', 'evFcf', 'pl', 'evReceita', 'pvpa'];
    for (var m = 0; m < chavesMetodos.length; m++) {
      var ch = chavesMetodos[m];
      if (metodos[ch].aplicavel) {
        metodos[ch].equityAjustado = aplicarDescontosFaixa(
          metodos[ch].equityBruto, tipoCapital, porte
        );
      }
    }

    // ── Gerar alertas de métricas negativas ────────────────────────────────
    if (ebitda <= 0) {
      alertas.push('EBITDA negativo ou zero: método EV/EBITDA não aplicável.');
    }
    if (ebit <= 0) {
      alertas.push('EBIT negativo ou zero: método EV/EBIT não aplicável.');
    }
    if (fcf <= 0) {
      alertas.push('FCF negativo ou zero: método EV/FCF não aplicável.');
    }
    if (ll <= 0) {
      alertas.push('Lucro Líquido negativo ou zero: método P/L não aplicável.');
    }
    if (plContab <= 0) {
      alertas.push('Patrimônio Líquido negativo ou zero: método P/VPA não aplicável.');
    }

    // ── Verificar se ao menos um método é aplicável ────────────────────────
    var algumAplicavel = false;
    for (var n = 0; n < chavesMetodos.length; n++) {
      if (metodos[chavesMetodos[n]].aplicavel) {
        algumAplicavel = true;
        break;
      }
    }

    if (!algumAplicavel) {
      return _criarErro(
        'Nenhum método de múltiplos é aplicável — todas as métricas (EBITDA, EBIT, ' +
        'FCF, Lucro Líquido, PL, Receita) são negativas ou zero.'
      );
    }

    // ── Determinar pesos ───────────────────────────────────────────────────
    var pesos;
    if (inputs.pesosMetodos) {
      pesos = _normalizarPesos(inputs.pesosMetodos);
    } else {
      pesos = obterPesosSetor(setor);
    }

    // ── Consolidar resultados ──────────────────────────────────────────────
    var consolidado = consolidarResultados(metodos, pesos);

    // ── Alertas de dispersão ───────────────────────────────────────────────
    if (consolidado.minimo > 0 && consolidado.maximo > 0) {
      var razaoDispersao = dividirSeguro(consolidado.maximo, consolidado.minimo);
      if (razaoDispersao > 3.0) {
        alertas.push(
          'Alta dispersão entre métodos: faixa máx/mín = ' +
          arredondar(razaoDispersao, 1) + 'x. ' +
          'Considere revisar os inputs ou dar mais peso aos métodos mais confiáveis para este setor.'
        );
      }
    }

    // ── Calcular descontos aplicados ───────────────────────────────────────
    var descIliq = obterDescontoIliquidez(tipoCapital);
    var descPorte = obterDescontoPorte(porte);
    var descTotal = 1 - (1 - descIliq) * (1 - descPorte);

    // ── Montar resultado final ─────────────────────────────────────────────
    return {
      modulo: 'MULTIPLOS',
      nomeEmpresa: nomeEmpresa,
      dataCalculo: hoje(),
      valorMinimo:  consolidado.minimo,
      valorMediano: consolidado.mediano,
      valorMaximo:  consolidado.maximo,
      equityValue:  consolidado.mediano,
      erro: false,
      mensagem: null,
      alertas: alertas,
      detalhes: {
        setor: setor,
        porte: porte,
        tipoCapital: tipoCapital,
        metodos: metodos,
        descontos: {
          iliquidez: arredondar(descIliq, 4),
          porte:     arredondar(descPorte, 4),
          total:     arredondar(descTotal, 4)
        },
        faixaConsolidada: {
          minimo:  consolidado.minimo,
          mediano: consolidado.mediano,
          maximo:  consolidado.maximo
        },
        pesos: pesos,
        multiplosReferencia: {
          fonte: usandoCustom
            ? 'Damodaran (ajustado Brasil) + Transações M&A customizadas'
            : 'Damodaran (ajustado Brasil)',
          setor: setor,
          multiplos: multiplosFinais
        },
        multiplosCustom: usandoCustom ? inputs.multiplosCustom : null,
        metodosPonderados: consolidado.metodosPonderados
      }
    };
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // FUNÇÕES INTERNAS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Cria objeto de erro padronizado.
   * @param {string} mensagem
   * @returns {Object}
   * @private
   */
  function _criarErro(mensagem) {
    return {
      modulo: 'MULTIPLOS',
      nomeEmpresa: '',
      dataCalculo: hoje(),
      valorMinimo: 0,
      valorMediano: 0,
      valorMaximo: 0,
      equityValue: 0,
      erro: true,
      mensagem: mensagem,
      alertas: [],
      detalhes: null
    };
  }

  /**
   * Normaliza pesos customizados, garantindo que somem 1.0 e que todas
   * as 6 chaves estejam presentes.
   *
   * @param {Object} pesosInput - Pesos informados pelo usuário
   * @returns {Object} Pesos normalizados
   * @private
   */
  function _normalizarPesos(pesosInput) {
    var chaves = ['evEbitda', 'evEbit', 'evFcf', 'pl', 'evReceita', 'pvpa'];
    var resultado = {};
    var soma = 0;

    // Primeiro, capturar valores informados ou usar padrão
    for (var i = 0; i < chaves.length; i++) {
      var ch = chaves[i];
      var val = pesosInput[ch] !== undefined
        ? validarNumero(pesosInput[ch])
        : validarNumero(PESOS_METODOS_PADRAO[ch]);
      resultado[ch] = val;
      soma += val;
    }

    // Normalizar para somar 1.0
    if (soma > 0 && soma !== 1.0) {
      for (var j = 0; j < chaves.length; j++) {
        resultado[chaves[j]] = arredondar(resultado[chaves[j]] / soma, 4);
      }
    }

    return resultado;
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDAÇÃO — Verificar integridade dos dados setoriais
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Verifica se todos os 15 setores possuem os 6 múltiplos corretamente.
   * Útil para testes automatizados e debugging.
   *
   * @returns {Object} { ok, erros }
   */
  function validarDadosSetoriais() {
    var erros = [];
    var multiplosEsperados = ['evEbitda', 'evEbit', 'evFcf', 'pl', 'evReceita', 'pvpa'];

    for (var s = 0; s < SETORES_KEYS.length; s++) {
      var setor = SETORES_KEYS[s];
      var dados = MULTIPLOS_SETORIAIS[setor];

      if (!dados) {
        erros.push('Setor "' + setor + '" não encontrado em MULTIPLOS_SETORIAIS');
        continue;
      }

      for (var m = 0; m < multiplosEsperados.length; m++) {
        var mult = multiplosEsperados[m];
        var faixa = dados[mult];

        if (!faixa) {
          erros.push('Setor "' + setor + '": múltiplo "' + mult + '" ausente');
          continue;
        }

        if (faixa.min === undefined || faixa.mediana === undefined || faixa.max === undefined) {
          erros.push('Setor "' + setor + '", "' + mult + '": faixa incompleta');
          continue;
        }

        if (faixa.min > faixa.mediana || faixa.mediana > faixa.max) {
          erros.push(
            'Setor "' + setor + '", "' + mult +
            '": ordem incorreta (min=' + faixa.min +
            ' med=' + faixa.mediana + ' max=' + faixa.max + ')'
          );
        }

        if (faixa.min < 0) {
          erros.push('Setor "' + setor + '", "' + mult + '": min negativo');
        }
      }
    }

    // Validar pesos por setor
    for (var p = 0; p < SETORES_KEYS.length; p++) {
      var setorP = SETORES_KEYS[p];
      var pesosSetor = PESOS_METODOS_POR_SETOR[setorP];
      if (!pesosSetor) {
        // Setor usa PESOS_METODOS_PADRAO — ok
        continue;
      }
      var somaPesos = 0;
      for (var q = 0; q < multiplosEsperados.length; q++) {
        somaPesos += validarNumero(pesosSetor[multiplosEsperados[q]]);
      }
      if (Math.abs(somaPesos - 1.0) > 0.01) {
        erros.push(
          'Setor "' + setorP + '": pesos somam ' +
          arredondar(somaPesos, 4) + ' (esperado: 1.0)'
        );
      }
    }

    return {
      ok: erros.length === 0,
      totalSetores: SETORES_KEYS.length,
      totalMultiplos: SETORES_KEYS.length * multiplosEsperados.length,
      erros: erros
    };
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // DEMONSTRAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Executa uma demonstração completa do módulo de Múltiplos.
   * Usa dados fictícios de uma empresa de tecnologia.
   *
   * @returns {Object} { validacao, resultadoBase, resultadoComCustom }
   */
  function executarDemonstracao() {
    // 1) Validar integridade dos dados
    var validacao = validarDadosSetoriais();

    // 2) Cenário base — empresa de tecnologia
    var resultadoBase = calcularMultiplos({
      nomeEmpresa: 'TechBR Soluções Ltda',
      setor: 'tecnologia',
      porte: 'pequena',
      tipoCapital: 'fechado',
      receita: 5000000,       // R$ 5M/ano
      ebitda: 1200000,        // R$ 1.2M (margem 24%)
      ebit: 900000,           // R$ 900k
      lucroLiquido: 600000,   // R$ 600k
      fcf: 800000,            // R$ 800k
      patrimonioLiquido: 1500000, // R$ 1.5M
      dividaLiquida: 200000,  // R$ 200k
      depreciacaoAmortizacao: 300000 // R$ 300k
    });

    // 3) Cenário com múltiplos customizados de transações M&A
    var resultadoComCustom = calcularMultiplos({
      nomeEmpresa: 'TechBR Soluções Ltda (com comparáveis)',
      setor: 'tecnologia',
      porte: 'pequena',
      tipoCapital: 'fechado',
      receita: 5000000,
      ebitda: 1200000,
      ebit: 900000,
      lucroLiquido: 600000,
      fcf: 800000,
      patrimonioLiquido: 1500000,
      dividaLiquida: 200000,
      depreciacaoAmortizacao: 300000,
      multiplosCustom: [
        {
          fonteNome: 'Aquisição SoftwareABC por FundoXYZ (2025)',
          evEbitda: 12.0, evEbit: 15.0, evFcf: 18.0,
          pl: 18.0, evReceita: 3.0, pvpa: 3.5
        },
        {
          fonteNome: 'Fusão DevCo + CloudCo (2024)',
          evEbitda: 10.0, evEbit: 13.0, evFcf: 16.0,
          pl: 15.0, evReceita: 2.5, pvpa: 3.0
        }
      ]
    });

    // 4) Cenário empresa com prejuízo (poucos métodos aplicáveis)
    var resultadoPrejuizo = calcularMultiplos({
      nomeEmpresa: 'StartupXYZ (pre-profit)',
      setor: 'tecnologia',
      porte: 'micro',
      tipoCapital: 'fechado',
      receita: 2000000,       // R$ 2M receita
      ebitda: -100000,        // EBITDA negativo
      ebit: -200000,          // EBIT negativo
      lucroLiquido: -300000,  // Prejuízo
      fcf: -150000,           // FCF negativo
      patrimonioLiquido: 500000,  // PL positivo (investimentos)
      dividaLiquida: 100000,
      depreciacaoAmortizacao: 100000
    });

    return {
      modulo: 'MULTIPLOS',
      versao: API.VERSION,
      validacao: validacao,
      resultadoBase: resultadoBase,
      resultadoComCustom: resultadoComCustom,
      resultadoPrejuizo: resultadoPrejuizo
    };
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // API PÚBLICA
  // ═══════════════════════════════════════════════════════════════════════════

  var API = {
    VERSION: '2.0.0',

    // Dados de referência
    MULTIPLOS_SETORIAIS:    MULTIPLOS_SETORIAIS,
    PESOS_METODOS_PADRAO:   PESOS_METODOS_PADRAO,
    PESOS_METODOS_POR_SETOR: PESOS_METODOS_POR_SETOR,
    NOMES_METODOS:          NOMES_METODOS,

    // Função principal
    calcular:               calcularMultiplos,

    // Cálculos individuais por método
    calcularEBITDA:         calcularEBITDA,
    calcularPorEVEBITDA:    calcularPorEVEBITDA,
    calcularPorEVEBIT:      calcularPorEVEBIT,
    calcularPorEVFCF:       calcularPorEVFCF,
    calcularPorPL:          calcularPorPL,
    calcularPorEVReceita:   calcularPorEVReceita,
    calcularPorPVPA:        calcularPorPVPA,

    // Descontos
    aplicarDescontos:       aplicarDescontos,
    aplicarDescontosFaixa:  aplicarDescontosFaixa,

    // Consolidação
    consolidarResultados:   consolidarResultados,

    // Consulta de dados
    obterMultiplosSetor:    obterMultiplosSetor,
    obterPesosSetor:        obterPesosSetor,

    // Múltiplos customizados
    calcularMediaCustom:    calcularMediaCustom,
    mesclarMultiplos:       mesclarMultiplos,

    // Validação e demonstração
    validarDadosSetoriais:  validarDadosSetoriais,
    executarDemonstracao:   executarDemonstracao
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // REGISTRO NO CORE
  // ═══════════════════════════════════════════════════════════════════════════

  if (Core && Core._registrarModulo) {
    Core._registrarModulo('Multiplos', API);
  }

  return API;
  })(API);


  // ╔═══════════════════════════════════════════════════════════════════════════╗
  // ║  MÓDULO 5/6 — PATRIMONIAL — Avaliação Asset-Based (CPC 25, VRD, Contingências) ║
  // ╚═══════════════════════════════════════════════════════════════════════════╝

  (function (Core) {

  // =========================================================================
  // Utilitarios do Core
  // =========================================================================

  var arredondar = Core.arredondar;
  var dividirSeguro = Core.dividirSeguro;
  var validarNumero = Core.validarNumero;
  var formatarMoeda = Core.formatarMoeda;
  var formatarPct = Core.formatarPct;
  var hoje = Core.hoje;


  // =========================================================================
  // CONSTANTES
  // =========================================================================

  /** Desconto de liquidacao forcada sobre ativos tangiveis (cenario conservador) */
  var DESCONTO_LIQUIDACAO = 0.25;

  /** Percentual de intangiveis considerado no cenario moderado */
  var PERCENTUAL_INTANGIVEIS_MODERADO = 0.50;

  /** Percentual de intangiveis considerado no cenario otimista */
  var PERCENTUAL_INTANGIVEIS_OTIMISTA = 1.00;

  /** Limite maximo: intangiveis nao podem exceder N vezes os tangiveis */
  var LIMITE_INTANGIVEIS_SOBRE_TANGIVEIS = 3.0;

  /** Limite maximo: goodwill nao pode exceder N% do total de intangiveis */
  var LIMITE_GOODWILL_SOBRE_INTANGIVEIS = 0.50;

  /**
   * Probabilidades de contingencias conforme CPC 25 / IAS 37.
   * - provavel:  provisao obrigatoria (reconhecimento no balanco)
   * - possivel:  divulgacao em notas explicativas, sem provisao
   * - remoto:    nenhuma acao necessaria
   */
  var PROBABILIDADE_CONTINGENCIA = {
    'provavel': 1.00,
    'possivel': 0.50,
    'remoto':   0.00
  };


  // =========================================================================
  // AJUSTAR ATIVOS CIRCULANTES
  // =========================================================================

  /**
   * Ajusta ativos circulantes aplicando PDD e obsolescencia.
   *
   * - Contas a receber: desconto pela taxa de inadimplencia (PDD)
   * - Estoques: desconto pela taxa de obsolescencia
   * - Caixa, aplicacoes e outros: mantidos pelo valor contabil
   *
   * @param {Object} inputs
   *   - caixa {number}
   *   - aplicacoesFinanceiras {number}
   *   - contasReceber {number}
   *   - inadimplencia {number} (0 a 1, default 0.05)
   *   - estoques {number}
   *   - obsolescencia {number} (0 a 1, default 0.10)
   *   - outrosCirculantes {number}
   * @returns {Object} Circulantes ajustados com detalhamento
   */
  function ajustarCirculantes(inputs) {
    var caixa       = validarNumero(inputs.caixa);
    var aplicacoes  = validarNumero(inputs.aplicacoesFinanceiras);
    var cr          = validarNumero(inputs.contasReceber);
    var inadim      = validarNumero(inputs.inadimplencia, 0.05);
    var estoques    = validarNumero(inputs.estoques);
    var obsol       = validarNumero(inputs.obsolescencia, 0.10);
    var outros      = validarNumero(inputs.outrosCirculantes);

    // Limitar taxas entre 0 e 1
    inadim = Math.max(0, Math.min(1, inadim));
    obsol  = Math.max(0, Math.min(1, obsol));

    var crAjustado       = arredondar(cr * (1 - inadim));
    var estoquesAjustado = arredondar(estoques * (1 - obsol));

    var total = arredondar(caixa + aplicacoes + crAjustado + estoquesAjustado + outros);

    return {
      caixa: caixa,
      aplicacoes: aplicacoes,
      contasReceber: {
        original: cr,
        ajustado: crAjustado,
        inadimplencia: inadim,
        pdd: arredondar(cr - crAjustado)
      },
      estoques: {
        original: estoques,
        ajustado: estoquesAjustado,
        obsolescencia: obsol,
        perdaObsolescencia: arredondar(estoques - estoquesAjustado)
      },
      outros: outros,
      total: total
    };
  }


  // =========================================================================
  // AJUSTAR ATIVOS NAO CIRCULANTES
  // =========================================================================

  /**
   * Ajusta ativos nao circulantes utilizando valor de mercado quando disponivel.
   *
   * Para cada categoria (imoveis, veiculos, maquinas): se o valor de mercado
   * foi informado, utiliza-o; caso contrario, mantem o valor contabil.
   * Registra cada ajuste aplicado para transparencia.
   *
   * @param {Object} inputs
   *   - imoveis {number} (valor contabil)
   *   - imoveisValorMercado {number} (opcional)
   *   - veiculos {number}
   *   - veiculosValorMercado {number} (opcional)
   *   - maquinas {number}
   *   - maquinasValorMercado {number} (opcional)
   *   - investimentos {number}
   *   - outrosNaoCirculantes {number}
   * @returns {Object} Nao circulantes ajustados
   */
  function ajustarNaoCirculantes(inputs) {
    var imoveis      = validarNumero(inputs.imoveis);
    var imoveisVM    = inputs.imoveisValorMercado !== undefined && inputs.imoveisValorMercado !== null
                       ? validarNumero(inputs.imoveisValorMercado) : null;
    var veiculos     = validarNumero(inputs.veiculos);
    var veiculosVM   = inputs.veiculosValorMercado !== undefined && inputs.veiculosValorMercado !== null
                       ? validarNumero(inputs.veiculosValorMercado) : null;
    var maquinas     = validarNumero(inputs.maquinas);
    var maquinasVM   = inputs.maquinasValorMercado !== undefined && inputs.maquinasValorMercado !== null
                       ? validarNumero(inputs.maquinasValorMercado) : null;
    var investimentos = validarNumero(inputs.investimentos);
    var outros        = validarNumero(inputs.outrosNaoCirculantes);

    var ajustesAplicados = [];

    // Imoveis
    var imoveisUsado = imoveis;
    if (imoveisVM !== null && imoveisVM !== imoveis) {
      imoveisUsado = imoveisVM;
      ajustesAplicados.push({
        item: 'Imoveis',
        contabil: imoveis,
        ajustado: imoveisVM,
        diferenca: arredondar(imoveisVM - imoveis),
        motivo: 'Valor de mercado informado (laudo/avaliacao)'
      });
    }

    // Veiculos
    var veiculosUsado = veiculos;
    if (veiculosVM !== null && veiculosVM !== veiculos) {
      veiculosUsado = veiculosVM;
      ajustesAplicados.push({
        item: 'Veiculos',
        contabil: veiculos,
        ajustado: veiculosVM,
        diferenca: arredondar(veiculosVM - veiculos),
        motivo: 'Valor de mercado informado (FIPE/avaliacao)'
      });
    }

    // Maquinas
    var maquinasUsado = maquinas;
    if (maquinasVM !== null && maquinasVM !== maquinas) {
      maquinasUsado = maquinasVM;
      ajustesAplicados.push({
        item: 'Maquinas e equipamentos',
        contabil: maquinas,
        ajustado: maquinasVM,
        diferenca: arredondar(maquinasVM - maquinas),
        motivo: 'Valor de mercado informado (avaliacao tecnica)'
      });
    }

    var total = arredondar(imoveisUsado + veiculosUsado + maquinasUsado + investimentos + outros);

    return {
      imoveis: { contabil: imoveis, usado: imoveisUsado, valorMercado: imoveisVM },
      veiculos: { contabil: veiculos, usado: veiculosUsado, valorMercado: veiculosVM },
      maquinas: { contabil: maquinas, usado: maquinasUsado, valorMercado: maquinasVM },
      investimentos: investimentos,
      outros: outros,
      total: total,
      ajustesAplicados: ajustesAplicados
    };
  }


  // =========================================================================
  // CALCULAR PASSIVOS
  // =========================================================================

  /**
   * Totaliza passivos circulantes e nao circulantes.
   *
   * @param {Object} inputs
   *   Circulantes:
   *     - fornecedores, salarios, impostos, emprestimosCP, outrosPassivosCirculantes
   *   Nao circulantes:
   *     - emprestimosLP, provisoes, processosJudiciais, outrosPassivosNaoCirculantes
   * @returns {Object} Passivos detalhados com subtotais
   */
  function calcularPassivos(inputs) {
    // Circulantes
    var fornecedores = validarNumero(inputs.fornecedores);
    var salarios     = validarNumero(inputs.salarios);
    var impostos     = validarNumero(inputs.impostos);
    var emprestimosCP = validarNumero(inputs.emprestimosCP);
    var outrosPC     = validarNumero(inputs.outrosPassivosCirculantes);
    var totalCirculante = arredondar(fornecedores + salarios + impostos + emprestimosCP + outrosPC);

    // Nao circulantes
    var emprestimosLP = validarNumero(inputs.emprestimosLP);
    var provisoes     = validarNumero(inputs.provisoes);
    var processos     = validarNumero(inputs.processosJudiciais);
    var outrosPNC     = validarNumero(inputs.outrosPassivosNaoCirculantes);
    var totalNaoCirculante = arredondar(emprestimosLP + provisoes + processos + outrosPNC);

    var total = arredondar(totalCirculante + totalNaoCirculante);

    return {
      circulantes: {
        fornecedores: fornecedores,
        salarios: salarios,
        impostos: impostos,
        emprestimosCP: emprestimosCP,
        outros: outrosPC,
        totalCirculante: totalCirculante
      },
      naoCirculantes: {
        emprestimosLP: emprestimosLP,
        provisoes: provisoes,
        processosJudiciais: processos,
        outros: outrosPNC,
        totalNaoCirculante: totalNaoCirculante
      },
      total: total
    };
  }


  // =========================================================================
  // CALCULAR INTANGIVEIS
  // =========================================================================

  /**
   * Calcula o valor total dos ativos intangiveis declarados, aplicando limites
   * de razoabilidade (cap) para evitar superavaliacao.
   *
   * Limites:
   *   - Total intangiveis <= totalTangiveis x LIMITE_INTANGIVEIS_SOBRE_TANGIVEIS
   *   - Goodwill <= totalIntangiveis x LIMITE_GOODWILL_SOBRE_INTANGIVEIS
   *
   * @param {Object} inputs
   *   - marca, carteiraClientes, contratos, licencas, knowHow, goodwill {number}
   * @param {number} totalTangiveis - Total de ativos tangiveis (para cap)
   * @returns {Object} Intangiveis detalhados com limites
   */
  function calcularIntangiveis(inputs, totalTangiveis) {
    var marca            = validarNumero(inputs.marca);
    var carteiraClientes = validarNumero(inputs.carteiraClientes);
    var contratos        = validarNumero(inputs.contratos);
    var licencas         = validarNumero(inputs.licencas);
    var knowHow          = validarNumero(inputs.knowHow);
    var goodwill         = validarNumero(inputs.goodwill);

    var limitesAplicados = [];

    // Total bruto antes dos caps
    var totalBruto = marca + carteiraClientes + contratos + licencas + knowHow + goodwill;

    // Cap do goodwill
    var goodwillCap = totalBruto > 0
      ? totalBruto * LIMITE_GOODWILL_SOBRE_INTANGIVEIS
      : 0;
    var goodwillUsado = goodwill;
    if (goodwill > goodwillCap && goodwillCap > 0) {
      goodwillUsado = arredondar(goodwillCap);
      limitesAplicados.push({
        tipo: 'goodwill',
        original: goodwill,
        limitado: goodwillUsado,
        motivo: 'Goodwill limitado a ' + (LIMITE_GOODWILL_SOBRE_INTANGIVEIS * 100) + '% do total de intangiveis'
      });
    }

    // Total com goodwill ajustado
    var totalIntangiveis = marca + carteiraClientes + contratos + licencas + knowHow + goodwillUsado;

    // Cap sobre tangiveis
    var tangiveisRef = validarNumero(totalTangiveis, 0);
    var capTangiveis = tangiveisRef * LIMITE_INTANGIVEIS_SOBRE_TANGIVEIS;
    if (tangiveisRef > 0 && totalIntangiveis > capTangiveis) {
      var totalAntes = totalIntangiveis;
      totalIntangiveis = arredondar(capTangiveis);
      limitesAplicados.push({
        tipo: 'cap_tangiveis',
        original: totalAntes,
        limitado: totalIntangiveis,
        motivo: 'Intangiveis limitados a ' + LIMITE_INTANGIVEIS_SOBRE_TANGIVEIS + 'x os ativos tangiveis'
      });
    }

    return {
      marca: marca,
      carteiraClientes: carteiraClientes,
      contratos: contratos,
      licencas: licencas,
      knowHow: knowHow,
      goodwill: goodwillUsado,
      goodwillOriginal: goodwill,
      totalBruto: arredondar(totalBruto),
      total: arredondar(totalIntangiveis),
      limitesAplicados: limitesAplicados
    };
  }


  // =========================================================================
  // VRD — VALOR DE REPOSICAO DEPRECIADO (ETAPA 6.1)
  // =========================================================================

  /**
   * Calcula o Valor de Reposicao Depreciado de um ativo.
   *
   * O VRD representa o custo de repor o ativo por um equivalente,
   * ajustado pela depreciacao acumulada (vida util consumida).
   *
   * Formula: VRD = valorAquisicao x (vidaUtilRestante / vidaUtilTotal)
   *
   * @param {number} valorAquisicao - Valor original de aquisicao
   * @param {number} vidaUtilTotal - Vida util total em anos
   * @param {number} vidaUtilRestante - Vida util restante em anos
   * @returns {Object} { valorOriginal, vidaUtilTotal, vidaUtilRestante, vrd, percentualDepreciado }
   */
  function calcularVRD(valorAquisicao, vidaUtilTotal, vidaUtilRestante) {
    var valor    = validarNumero(valorAquisicao);
    var vuTotal  = validarNumero(vidaUtilTotal, 1);
    var vuRest   = validarNumero(vidaUtilRestante, 0);

    // Protecao: vida util total deve ser > 0
    if (vuTotal <= 0) vuTotal = 1;

    // Vida restante nao pode exceder total nem ser negativa
    vuRest = Math.max(0, Math.min(vuRest, vuTotal));

    var vrd = arredondar(valor * dividirSeguro(vuRest, vuTotal));
    var percentualDepreciado = arredondar(1 - dividirSeguro(vuRest, vuTotal), 4);

    return {
      valorOriginal: valor,
      vidaUtilTotal: vuTotal,
      vidaUtilRestante: vuRest,
      vrd: vrd,
      percentualDepreciado: percentualDepreciado
    };
  }

  /**
   * Aplica VRD a uma lista de ativos.
   *
   * @param {Array} ativos - [{ descricao, valorAquisicao, vidaUtilTotal, vidaUtilRestante }, ...]
   * @returns {Object} { itens: [{descricao, ...vrd}], totalOriginal, totalVRD }
   */
  function calcularVRDLista(ativos) {
    if (!ativos || !Array.isArray(ativos) || ativos.length === 0) {
      return { itens: [], totalOriginal: 0, totalVRD: 0 };
    }

    var itens = [];
    var totalOriginal = 0;
    var totalVRD = 0;

    for (var i = 0; i < ativos.length; i++) {
      var ativo = ativos[i];
      var descricao = ativo.descricao || ('Ativo ' + (i + 1));
      var resultado = calcularVRD(
        validarNumero(ativo.valorAquisicao),
        validarNumero(ativo.vidaUtilTotal, 10),
        validarNumero(ativo.vidaUtilRestante, 5)
      );

      itens.push({
        descricao: descricao,
        valorOriginal: resultado.valorOriginal,
        vidaUtilTotal: resultado.vidaUtilTotal,
        vidaUtilRestante: resultado.vidaUtilRestante,
        vrd: resultado.vrd,
        percentualDepreciado: resultado.percentualDepreciado
      });

      totalOriginal += resultado.valorOriginal;
      totalVRD += resultado.vrd;
    }

    return {
      itens: itens,
      totalOriginal: arredondar(totalOriginal),
      totalVRD: arredondar(totalVRD)
    };
  }


  // =========================================================================
  // INTANGIVEIS POR FLUXO — LUCRO EXCEDENTE (ETAPA 6.2)
  // =========================================================================

  /**
   * Estima valor de intangiveis pelo metodo do lucro excedente.
   *
   * Logica: se a empresa gera lucro acima do retorno "normal" esperado
   * sobre os ativos tangiveis, esse excedente e atribuivel aos intangiveis
   * (marca, carteira de clientes, know-how, etc.).
   *
   * O excedente e capitalizado por um multiplicador (anos) para obter
   * o valor presente dos intangiveis.
   *
   * @param {number} lucroLiquido - Lucro liquido anual
   * @param {number} ativosTangiveis - Total de ativos tangiveis (ajustados)
   * @param {number} taxaRetornoNormal - Taxa de retorno "normal" para o setor (ex: 0.10 = 10%)
   * @param {number} [multiplicador=5] - Multiplo de anos para capitalizar o excedente
   * @returns {Object} { lucroLiquido, retornoNormal, lucroExcedente, multiplicador, valorIntangiveis }
   */
  function estimarIntangiveisPorFluxo(lucroLiquido, ativosTangiveis, taxaRetornoNormal, multiplicador) {
    var ll     = validarNumero(lucroLiquido);
    var at     = validarNumero(ativosTangiveis);
    var taxa   = validarNumero(taxaRetornoNormal, 0.10);
    var mult   = validarNumero(multiplicador, 5);

    // Multiplicador minimo 1, maximo 10
    mult = Math.max(1, Math.min(10, mult));

    // Taxa minima 1%, maxima 50%
    taxa = Math.max(0.01, Math.min(0.50, taxa));

    var retornoNormal  = arredondar(at * taxa);
    var lucroExcedente = arredondar(Math.max(0, ll - retornoNormal));
    var valorIntangiveis = arredondar(lucroExcedente * mult);

    return {
      lucroLiquido: ll,
      ativosTangiveis: at,
      taxaRetornoNormal: taxa,
      retornoNormal: retornoNormal,
      lucroExcedente: lucroExcedente,
      multiplicador: mult,
      valorIntangiveis: valorIntangiveis,
      nota: lucroExcedente <= 0
        ? 'Lucro nao excede o retorno normal sobre tangiveis; intangiveis por fluxo = zero.'
        : 'Lucro excedente de ' + formatarMoeda(lucroExcedente) + '/ano capitalizado por ' + mult + ' anos.'
    };
  }


  // =========================================================================
  // CONTINGENCIAS COM PROBABILIDADE — CPC 25 (ETAPA 6.3)
  // =========================================================================

  /**
   * Calcula o valor provisionado de contingencias baseado em probabilidade CPC 25.
   *
   * CPC 25 (Provisoes, Passivos Contingentes e Ativos Contingentes):
   *   - Provavel: provisao obrigatoria (reconhecida no balanco)
   *   - Possivel: divulgacao em notas explicativas
   *   - Remoto: nenhuma acao necessaria
   *
   * @param {Array} contingencias - [
   *   { descricao: "Trabalhista", valor: 500000, probabilidade: "provavel" },
   *   { descricao: "Tributario", valor: 1000000, probabilidade: "possivel" },
   *   { descricao: "Ambiental", valor: 2000000, probabilidade: "remoto" }
   * ]
   * @returns {Object} { itens, totalProvisionado, totalBruto }
   */
  function calcularContingencias(contingencias) {
    if (!contingencias || !Array.isArray(contingencias) || contingencias.length === 0) {
      return { itens: [], totalProvisionado: 0, totalBruto: 0 };
    }

    var itens = [];
    var totalProvisionado = 0;
    var totalBruto = 0;

    for (var i = 0; i < contingencias.length; i++) {
      var c = contingencias[i];
      var descricao = c.descricao || ('Contingencia ' + (i + 1));
      var valor = validarNumero(c.valor);
      var prob  = (c.probabilidade || 'possivel').toLowerCase();

      // Garantir probabilidade valida
      var fator = PROBABILIDADE_CONTINGENCIA[prob];
      if (fator === undefined) {
        fator = PROBABILIDADE_CONTINGENCIA['possivel']; // default: 50%
        prob = 'possivel';
      }

      var valorProvisionado = arredondar(valor * fator);

      itens.push({
        descricao: descricao,
        valorBruto: valor,
        probabilidade: prob,
        fator: fator,
        valorProvisionado: valorProvisionado
      });

      totalBruto += valor;
      totalProvisionado += valorProvisionado;
    }

    return {
      itens: itens,
      totalProvisionado: arredondar(totalProvisionado),
      totalBruto: arredondar(totalBruto)
    };
  }


  // =========================================================================
  // CENARIOS DE AVALIACAO
  // =========================================================================

  /**
   * Cenario Conservador — Liquidacao Forcada.
   *
   * Premissas:
   *   - Ativos tangiveis com desconto de liquidacao (25%)
   *   - Intangiveis NAO considerados (dificil vender separadamente)
   *   - Contingencias provaveis integralmente deduzidas
   *
   * @param {number} totalTangiveis - Ativos tangiveis ajustados
   * @param {number} totalPassivos - Total de passivos
   * @param {number} contingenciasProvaveis - Contingencias com probabilidade "provavel"
   * @returns {Object} { valor, descricao, componentes }
   */
  function cenarioConservador(totalTangiveis, totalPassivos, contingenciasProvaveis) {
    var contProv = validarNumero(contingenciasProvaveis);
    var plTangivel = totalTangiveis - totalPassivos;
    var valor = arredondar(plTangivel * (1 - DESCONTO_LIQUIDACAO) - contProv);

    return {
      valor: valor,
      descricao: 'Liquidacao forcada: PL tangivel com desconto de ' +
                 (DESCONTO_LIQUIDACAO * 100) + '%, sem intangiveis, contingencias provaveis deduzidas.',
      componentes: {
        ativosTangiveis: totalTangiveis,
        passivos: totalPassivos,
        plTangivel: plTangivel,
        descontoLiquidacao: DESCONTO_LIQUIDACAO,
        plAposDesconto: arredondar(plTangivel * (1 - DESCONTO_LIQUIDACAO)),
        contingenciasProvaveis: contProv,
        intangiveis: 0
      }
    };
  }

  /**
   * Cenario Moderado — Valor Justo (Fair Value).
   *
   * Premissas:
   *   - PL ajustado tangivel a valor justo
   *   - 50% dos intangiveis reconhecidos (com cap)
   *   - Contingencias provaveis (100%) + possiveis (50%)
   *   - Se VRD disponivel, substitui valor contabil
   *   - Se intangiveis por fluxo calculado, usa o maior valor
   *
   * @param {number} plAjustadoTangivel - PL tangivel ajustado
   * @param {number} totalIntangiveis - Intangiveis (com cap)
   * @param {number} contingenciasPonderadas - Total provavel + 50% possivel
   * @returns {Object} { valor, descricao, componentes }
   */
  function cenarioModerado(plAjustadoTangivel, totalIntangiveis, contingenciasPonderadas) {
    var intangiveisUsados = arredondar(totalIntangiveis * PERCENTUAL_INTANGIVEIS_MODERADO);
    var contPond = validarNumero(contingenciasPonderadas);
    var valor = arredondar(plAjustadoTangivel + intangiveisUsados - contPond);

    return {
      valor: valor,
      descricao: 'Valor justo: PL tangivel ajustado + ' +
                 (PERCENTUAL_INTANGIVEIS_MODERADO * 100) + '% dos intangiveis, ' +
                 'contingencias provaveis + possiveis ponderadas.',
      componentes: {
        plAjustadoTangivel: plAjustadoTangivel,
        intangiveisTotal: totalIntangiveis,
        percentualIntangiveis: PERCENTUAL_INTANGIVEIS_MODERADO,
        intangiveisUsados: intangiveisUsados,
        contingenciasPonderadas: contPond
      }
    };
  }

  /**
   * Cenario Otimista — Going Concern (continuidade operacional).
   *
   * Premissas:
   *   - PL ajustado tangivel integral
   *   - 100% dos intangiveis reconhecidos
   *   - Somente contingencias provaveis deduzidas
   *
   * @param {number} plAjustadoTangivel - PL tangivel ajustado
   * @param {number} totalIntangiveis - Intangiveis (com cap)
   * @param {number} contingenciasProvaveis - Somente provaveis
   * @returns {Object} { valor, descricao, componentes }
   */
  function cenarioOtimista(plAjustadoTangivel, totalIntangiveis, contingenciasProvaveis) {
    var intangiveisUsados = arredondar(totalIntangiveis * PERCENTUAL_INTANGIVEIS_OTIMISTA);
    var contProv = validarNumero(contingenciasProvaveis);
    var valor = arredondar(plAjustadoTangivel + intangiveisUsados - contProv);

    return {
      valor: valor,
      descricao: 'Going concern: PL tangivel ajustado + ' +
                 (PERCENTUAL_INTANGIVEIS_OTIMISTA * 100) + '% dos intangiveis, ' +
                 'somente contingencias provaveis.',
      componentes: {
        plAjustadoTangivel: plAjustadoTangivel,
        intangiveisTotal: totalIntangiveis,
        percentualIntangiveis: PERCENTUAL_INTANGIVEIS_OTIMISTA,
        intangiveisUsados: intangiveisUsados,
        contingenciasProvaveis: contProv
      }
    };
  }


  // =========================================================================
  // GERAR ALERTAS
  // =========================================================================

  /**
   * Gera alertas de validacao e atencao com base nos dados de entrada.
   *
   * @param {Object} inputs - Inputs originais
   * @param {Object} detalhes - Detalhes do calculo
   * @returns {Array} Lista de alertas [{ tipo, mensagem }]
   */
  function gerarAlertas(inputs, detalhes) {
    var alertas = [];

    // PL tangivel negativo
    if (detalhes.plAjustadoTangivel < 0) {
      alertas.push({
        tipo: 'critico',
        mensagem: 'Patrimonio liquido ajustado tangivel e NEGATIVO (' +
                  formatarMoeda(detalhes.plAjustadoTangivel) +
                  '). Passivos excedem ativos tangiveis — risco de insolvencia.'
      });
    }

    // Inadimplencia alta
    var inadim = validarNumero(inputs.inadimplencia, 0.05);
    if (inadim > 0.15) {
      alertas.push({
        tipo: 'alto',
        mensagem: 'Taxa de inadimplencia elevada (' + formatarPct(inadim) +
                  '). Revisar politica de credito e cobranca.'
      });
    }

    // Obsolescencia alta
    var obsol = validarNumero(inputs.obsolescencia, 0.10);
    if (obsol > 0.20) {
      alertas.push({
        tipo: 'alto',
        mensagem: 'Taxa de obsolescencia de estoques elevada (' + formatarPct(obsol) +
                  '). Avaliar giro e perecibilidade dos produtos.'
      });
    }

    // Intangiveis com caps aplicados
    if (detalhes.intangiveis && detalhes.intangiveis.declarados &&
        detalhes.intangiveis.declarados.limitesAplicados &&
        detalhes.intangiveis.declarados.limitesAplicados.length > 0) {
      alertas.push({
        tipo: 'atencao',
        mensagem: 'Limites de razoabilidade foram aplicados aos intangiveis. ' +
                  'Verificar: ' + detalhes.intangiveis.declarados.limitesAplicados
                    .map(function(l) { return l.motivo; }).join('; ')
      });
    }

    // Contingencias altas
    if (detalhes.contingencias && detalhes.contingencias.totalBruto > 0) {
      var ratioContingencia = dividirSeguro(
        detalhes.contingencias.totalProvisionado,
        detalhes.totalAtivosTangiveis
      );
      if (ratioContingencia > 0.20) {
        alertas.push({
          tipo: 'alto',
          mensagem: 'Contingencias provisionadas representam ' + formatarPct(ratioContingencia) +
                    ' dos ativos tangiveis. Risco juridico significativo.'
        });
      }
    }

    // VRD com depreciacao elevada
    if (detalhes.vrd && detalhes.vrd.totalOriginal > 0) {
      var ratioVRD = dividirSeguro(detalhes.vrd.totalVRD, detalhes.vrd.totalOriginal);
      if (ratioVRD < 0.30) {
        alertas.push({
          tipo: 'atencao',
          mensagem: 'Ativos com VRD retiveram apenas ' + formatarPct(ratioVRD) +
                    ' do valor original. Imobilizado altamente depreciado — considerar reinvestimento.'
        });
      }
    }

    // Ajustes a valor de mercado significativos
    if (detalhes.ativosNaoCirculantes && detalhes.ativosNaoCirculantes.ajustes &&
        detalhes.ativosNaoCirculantes.ajustes.length > 0) {
      var totalAjuste = 0;
      for (var a = 0; a < detalhes.ativosNaoCirculantes.ajustes.length; a++) {
        totalAjuste += Math.abs(detalhes.ativosNaoCirculantes.ajustes[a].diferenca);
      }
      if (totalAjuste > detalhes.totalAtivosTangiveis * 0.15) {
        alertas.push({
          tipo: 'info',
          mensagem: 'Ajustes a valor de mercado totalizam ' + formatarMoeda(totalAjuste) +
                    ', representando variacao significativa sobre o valor contabil.'
        });
      }
    }

    // Empresa sem ativos nao circulantes (asset-light)
    if (detalhes.ativosNaoCirculantes && detalhes.ativosNaoCirculantes.total === 0) {
      alertas.push({
        tipo: 'info',
        mensagem: 'Empresa sem ativos nao circulantes (asset-light). ' +
                  'Metodo patrimonial pode subestimar o valor — considerar DCF ou Multiplos.'
      });
    }

    return alertas;
  }


  // =========================================================================
  // GERAR INSIGHTS
  // =========================================================================

  /**
   * Gera insights de inteligencia de negocios baseados nos numeros patrimoniais.
   *
   * @param {Object} inputs - Inputs originais
   * @param {Object} detalhes - Detalhes do calculo
   * @returns {Array} Lista de insights [{ categoria, titulo, descricao, relevancia }]
   */
  function gerarInsights(inputs, detalhes) {
    var insights = [];
    var anosOperacao = validarNumero(inputs.anosOperacao, 0);
    var totalTangiveis = detalhes.totalAtivosTangiveis;
    var totalIntangiveis = detalhes.intangiveis ? detalhes.intangiveis.totalUsado : 0;

    // 1) Maturidade vs intangiveis
    if (anosOperacao > 0) {
      var ratioIntTang = dividirSeguro(totalIntangiveis, totalTangiveis);
      if (anosOperacao >= 10 && ratioIntTang < 0.10 && totalTangiveis > 0) {
        insights.push({
          categoria: 'maturidade',
          titulo: 'Empresa madura com poucos intangiveis',
          descricao: 'Com ' + anosOperacao + ' anos de operacao, intangiveis representam apenas ' +
                     formatarPct(ratioIntTang) + ' dos tangiveis. Possivel subavaliacao de marca, ' +
                     'carteira de clientes e know-how acumulado ao longo dos anos.',
          relevancia: 'alta'
        });
      } else if (anosOperacao < 5 && ratioIntTang > 1.0) {
        insights.push({
          categoria: 'maturidade',
          titulo: 'Empresa jovem com intangiveis elevados',
          descricao: 'Com apenas ' + anosOperacao + ' anos, intangiveis (' +
                     formatarPct(ratioIntTang) + ' dos tangiveis) parecem otimistas. ' +
                     'Recomenda-se laudo independente para validar marca e goodwill.',
          relevancia: 'alta'
        });
      }
    }

    // 2) Nivel de PDD (inadimplencia)
    var inadim = validarNumero(inputs.inadimplencia, 0.05);
    if (inadim <= 0.03) {
      insights.push({
        categoria: 'qualidade_ativos',
        titulo: 'Baixa inadimplencia — carteira saudavel',
        descricao: 'PDD de ' + formatarPct(inadim) + ' indica boa politica de credito. ' +
                   'Clientes com perfil pagador acima da media, o que favorece a previsibilidade de caixa.',
        relevancia: 'media'
      });
    } else if (inadim >= 0.10) {
      insights.push({
        categoria: 'qualidade_ativos',
        titulo: 'Inadimplencia preocupante',
        descricao: 'PDD de ' + formatarPct(inadim) + ' esta acima da media de mercado. ' +
                   'Risco de deterioracao da carteira de recebiveis. Sugere-se revisao dos termos de credito.',
        relevancia: 'alta'
      });
    }

    // 3) Ajustes a valor de mercado
    if (detalhes.ativosNaoCirculantes && detalhes.ativosNaoCirculantes.ajustes &&
        detalhes.ativosNaoCirculantes.ajustes.length > 0) {
      var ajustesPositivos = 0;
      var ajustesNegativos = 0;
      for (var j = 0; j < detalhes.ativosNaoCirculantes.ajustes.length; j++) {
        var dif = detalhes.ativosNaoCirculantes.ajustes[j].diferenca;
        if (dif > 0) ajustesPositivos += dif;
        else ajustesNegativos += Math.abs(dif);
      }

      if (ajustesPositivos > 0) {
        insights.push({
          categoria: 'valor_mercado',
          titulo: 'Ativos valorizados acima do contabil',
          descricao: 'Ajustes a valor de mercado somam ' + formatarMoeda(ajustesPositivos) +
                     ' positivos. Imoveis e/ou equipamentos valem mais que o registrado no balanco, ' +
                     'gerando reserva oculta de valor (hidden assets).',
          relevancia: 'alta'
        });
      }
      if (ajustesNegativos > 0) {
        insights.push({
          categoria: 'valor_mercado',
          titulo: 'Ativos desvalorizados vs contabil',
          descricao: 'Ajustes negativos de ' + formatarMoeda(ajustesNegativos) +
                     '. Alguns ativos podem estar superavaliados no balanco — possivel necessidade de impairment (CPC 01).',
          relevancia: 'media'
        });
      }
    }

    // 4) Intangiveis > tangiveis
    if (totalIntangiveis > totalTangiveis && totalTangiveis > 0) {
      insights.push({
        categoria: 'estrutura',
        titulo: 'Intangiveis superam tangiveis',
        descricao: 'Ativos intangiveis (' + formatarMoeda(totalIntangiveis) + ') excedem os tangiveis (' +
                   formatarMoeda(totalTangiveis) + '). Empresa intensiva em capital intelectual. ' +
                   'O valor patrimonial depende fortemente de premissas sobre intangiveis.',
        relevancia: 'alta'
      });
    }

    // 5) PL negativo
    if (detalhes.plAjustadoTangivel < 0) {
      insights.push({
        categoria: 'solvencia',
        titulo: 'Patrimonio liquido tangivel negativo',
        descricao: 'A empresa deve mais do que possui em ativos tangiveis. ' +
                   'PL tangivel ajustado: ' + formatarMoeda(detalhes.plAjustadoTangivel) + '. ' +
                   'Em cenario de liquidacao, credores nao seriam integralmente pagos. ' +
                   'Avaliar viabilidade de continuidade operacional.',
        relevancia: 'critica'
      });
    }

    // 6) Contingencias
    if (detalhes.contingencias && detalhes.contingencias.totalBruto > 0) {
      var impactoPercentual = dividirSeguro(
        detalhes.contingencias.totalProvisionado,
        Math.abs(detalhes.plAjustadoTangivel) || 1
      );

      if (impactoPercentual > 0.50) {
        insights.push({
          categoria: 'risco_juridico',
          titulo: 'Contingencias comprometem mais de 50% do PL',
          descricao: 'Contingencias provisionadas representam ' + formatarPct(impactoPercentual) +
                     ' do patrimonio liquido tangivel. Risco juridico elevado que pode comprometer ' +
                     'a capacidade de geracao de valor. Due diligence juridica recomendada.',
          relevancia: 'critica'
        });
      } else if (impactoPercentual > 0.10) {
        insights.push({
          categoria: 'risco_juridico',
          titulo: 'Contingencias relevantes',
          descricao: 'Contingencias provisionadas correspondem a ' + formatarPct(impactoPercentual) +
                     ' do PL tangivel. Monitorar evolucao dos processos e provisionar adequadamente.',
          relevancia: 'media'
        });
      }

      // Classificacao CPC 25
      var nProvaveis = 0;
      var nPossiveis = 0;
      var nRemotos = 0;
      for (var c = 0; c < detalhes.contingencias.itens.length; c++) {
        var prob = detalhes.contingencias.itens[c].probabilidade;
        if (prob === 'provavel') nProvaveis++;
        else if (prob === 'possivel') nPossiveis++;
        else nRemotos++;
      }
      insights.push({
        categoria: 'risco_juridico',
        titulo: 'Perfil de contingencias (CPC 25)',
        descricao: nProvaveis + ' provavel(is), ' + nPossiveis + ' possivel(is), ' +
                   nRemotos + ' remoto(s). Total bruto: ' +
                   formatarMoeda(detalhes.contingencias.totalBruto) +
                   '; provisionado: ' + formatarMoeda(detalhes.contingencias.totalProvisionado) + '.',
        relevancia: 'info'
      });
    }

    // 7) VRD — depreciacao do imobilizado
    if (detalhes.vrd && detalhes.vrd.totalOriginal > 0) {
      var retencaoVRD = dividirSeguro(detalhes.vrd.totalVRD, detalhes.vrd.totalOriginal);
      if (retencaoVRD < 0.40) {
        insights.push({
          categoria: 'imobilizado',
          titulo: 'Imobilizado altamente depreciado',
          descricao: 'Ativos com VRD retiveram apenas ' + formatarPct(retencaoVRD) +
                     ' do valor de aquisicao. Parque produtivo envelhecido — necessidade de ' +
                     'reinvestimento (CAPEX de reposicao) nos proximos anos.',
          relevancia: 'alta'
        });
      } else if (retencaoVRD > 0.80) {
        insights.push({
          categoria: 'imobilizado',
          titulo: 'Imobilizado recente e bem conservado',
          descricao: 'Ativos com VRD retiveram ' + formatarPct(retencaoVRD) +
                     ' do valor original. Parque produtivo moderno com baixa depreciacao acumulada.',
          relevancia: 'media'
        });
      }
    }

    // 8) Intangiveis por fluxo vs declarados
    if (detalhes.intangiveis && detalhes.intangiveis.porFluxo && detalhes.intangiveis.declarados) {
      var declarado = detalhes.intangiveis.declarados.total;
      var porFluxo  = detalhes.intangiveis.porFluxo.valorIntangiveis;

      if (porFluxo > declarado * 2 && declarado > 0) {
        insights.push({
          categoria: 'intangiveis',
          titulo: 'Intangiveis por fluxo muito superiores aos declarados',
          descricao: 'Intangiveis estimados pelo lucro excedente (' + formatarMoeda(porFluxo) +
                     ') sao ' + arredondar(dividirSeguro(porFluxo, declarado), 1) +
                     'x os declarados (' + formatarMoeda(declarado) +
                     '). Sugere que a empresa gera valor intangivel nao capturado no balanco.',
          relevancia: 'alta'
        });
      } else if (porFluxo < declarado * 0.50 && declarado > 0) {
        insights.push({
          categoria: 'intangiveis',
          titulo: 'Intangiveis declarados podem estar superavaliados',
          descricao: 'Intangiveis pelo metodo do fluxo (' + formatarMoeda(porFluxo) +
                     ') sao inferiores a 50% dos declarados (' + formatarMoeda(declarado) +
                     '). Os intangiveis contabeis podem nao estar gerando o retorno esperado.',
          relevancia: 'media'
        });
      }
    }

    // 9) Spread entre cenarios
    if (detalhes.cenarios) {
      var spread = detalhes.cenarios.otimista.valor - detalhes.cenarios.conservador.valor;
      var mediano = detalhes.cenarios.moderado.valor;
      if (mediano > 0) {
        var spreadPct = dividirSeguro(spread, mediano);
        if (spreadPct > 1.50) {
          insights.push({
            categoria: 'incerteza',
            titulo: 'Alta dispersao entre cenarios',
            descricao: 'Diferenca entre otimista e conservador e ' + formatarPct(spreadPct) +
                       ' do valor moderado (' + formatarMoeda(spread) + '). ' +
                       'Alta incerteza no valor patrimonial — intangiveis e contingencias sao os principais drivers.',
            relevancia: 'alta'
          });
        }
      }
    }

    // 10) Composicao do ativo
    var totalAtivo = detalhes.totalAtivosTangiveis + totalIntangiveis;
    if (totalAtivo > 0) {
      var pctCirculante = dividirSeguro(detalhes.ativosCirculantes.total, totalAtivo);
      if (pctCirculante > 0.70) {
        insights.push({
          categoria: 'estrutura',
          titulo: 'Empresa com liquidez elevada',
          descricao: formatarPct(pctCirculante) + ' dos ativos sao circulantes. ' +
                     'Alta liquidez pode indicar oportunidade de investimento ou distribuicao de lucros, ' +
                     'mas tambem pode sinalizar ociosidade de capital.',
          relevancia: 'media'
        });
      } else if (pctCirculante < 0.20 && totalAtivo > 0) {
        insights.push({
          categoria: 'estrutura',
          titulo: 'Ativo predominantemente imobilizado',
          descricao: 'Apenas ' + formatarPct(pctCirculante) + ' dos ativos sao circulantes. ' +
                     'Empresa intensiva em capital fixo — avaliar capacidade de honrar obrigacoes de curto prazo.',
          relevancia: 'media'
        });
      }
    }

    return insights;
  }


  // =========================================================================
  // FUNCAO PRINCIPAL — calcularPatrimonial
  // =========================================================================

  /**
   * Calcula a avaliacao patrimonial completa da empresa.
   *
   * Recebe todos os dados do balanco patrimonial (ativos, passivos, intangiveis),
   * opcionalmente contingencias, VRD e dados para estimativa de intangiveis por fluxo.
   *
   * Retorna tres cenarios (conservador, moderado, otimista), detalhamentos
   * completos, ajustes aplicados, alertas e insights de negocios.
   *
   * @param {Object} inputs - Ver documentacao do modulo
   * @returns {Object} Resultado completo da avaliacao patrimonial
   */
  function calcularPatrimonial(inputs) {
    if (!inputs) {
      return {
        modulo: 'PATRIMONIAL',
        erro: true,
        mensagem: 'Inputs sao obrigatorios para avaliacao patrimonial.'
      };
    }

    var nomeEmpresa = inputs.nomeEmpresa || '';
    var setor       = inputs.setor || 'servicos';
    var anosOp      = validarNumero(inputs.anosOperacao, 0);
    var alertas     = [];

    // ─── 1. Ativos Circulantes Ajustados ─────────────────────────────────
    var circulantes = ajustarCirculantes(inputs);

    // ─── 2. Ativos Nao Circulantes Ajustados ─────────────────────────────
    var naoCirculantes = ajustarNaoCirculantes(inputs);

    // ─── 3. VRD (se fornecido) ───────────────────────────────────────────
    var vrdResultado = null;
    if (inputs.vrd && Array.isArray(inputs.vrd) && inputs.vrd.length > 0) {
      vrdResultado = calcularVRDLista(inputs.vrd);

      // Se VRD fornecido, substituir o total de nao circulantes pelo VRD
      // Isto e: o VRD representa o valor depreciado real dos ativos imobilizados
      // Manter investimentos e outros que nao tem VRD
      if (vrdResultado.totalVRD > 0) {
        // Recalcular nao circulantes: VRD substitui imoveis+veiculos+maquinas
        var ncInvestimentos = validarNumero(inputs.investimentos);
        var ncOutros = validarNumero(inputs.outrosNaoCirculantes);
        naoCirculantes.total = arredondar(vrdResultado.totalVRD + ncInvestimentos + ncOutros);
        naoCirculantes.vrdAplicado = true;
      }
    }

    // ─── 4. Total de Ativos Tangiveis ────────────────────────────────────
    var totalAtivosTangiveis = arredondar(circulantes.total + naoCirculantes.total);

    // ─── 5. Passivos ─────────────────────────────────────────────────────
    var passivos = calcularPassivos(inputs);

    // ─── 6. Contingencias ────────────────────────────────────────────────
    var contingenciasResultado = null;
    var contingenciasProvaveis = 0;
    var contingenciasPonderadas = 0;

    if (inputs.contingencias && Array.isArray(inputs.contingencias) && inputs.contingencias.length > 0) {
      contingenciasResultado = calcularContingencias(inputs.contingencias);

      // Calcular subtotais por probabilidade para cenarios
      for (var ci = 0; ci < contingenciasResultado.itens.length; ci++) {
        var item = contingenciasResultado.itens[ci];
        if (item.probabilidade === 'provavel') {
          contingenciasProvaveis += item.valorProvisionado;
        }
        // Ponderado: provavel(100%) + possivel(50%) — usado no cenario moderado
        contingenciasPonderadas += item.valorProvisionado;
      }

      contingenciasProvaveis = arredondar(contingenciasProvaveis);
      contingenciasPonderadas = arredondar(contingenciasPonderadas);
    }

    // ─── 7. PL Ajustado Tangivel ─────────────────────────────────────────
    var plAjustadoTangivel = arredondar(totalAtivosTangiveis - passivos.total);

    // ─── 8. Intangiveis Declarados ───────────────────────────────────────
    var intangiveisDec = calcularIntangiveis(inputs, totalAtivosTangiveis);

    // ─── 9. Intangiveis por Fluxo (se disponivel) ────────────────────────
    var intangiveisPorFluxo = null;
    if (inputs.taxaRetornoNormal !== undefined && inputs.lucroLiquido !== undefined) {
      intangiveisPorFluxo = estimarIntangiveisPorFluxo(
        validarNumero(inputs.lucroLiquido),
        totalAtivosTangiveis,
        validarNumero(inputs.taxaRetornoNormal, 0.10),
        validarNumero(inputs.multiplicadorIntangiveis, 5)
      );
    }

    // Total de intangiveis usado nos cenarios: max(declarados, porFluxo)
    var totalIntangiveisUsado = intangiveisDec.total;
    if (intangiveisPorFluxo && intangiveisPorFluxo.valorIntangiveis > totalIntangiveisUsado) {
      totalIntangiveisUsado = intangiveisPorFluxo.valorIntangiveis;
    }

    // Reaplicar cap sobre tangiveis ao total final
    var capFinal = totalAtivosTangiveis * LIMITE_INTANGIVEIS_SOBRE_TANGIVEIS;
    if (totalAtivosTangiveis > 0 && totalIntangiveisUsado > capFinal) {
      totalIntangiveisUsado = arredondar(capFinal);
    }

    // ─── 10. Cenarios ────────────────────────────────────────────────────
    var cConservador = cenarioConservador(totalAtivosTangiveis, passivos.total, contingenciasProvaveis);
    var cModerado    = cenarioModerado(plAjustadoTangivel, totalIntangiveisUsado, contingenciasPonderadas);
    var cOtimista    = cenarioOtimista(plAjustadoTangivel, totalIntangiveisUsado, contingenciasProvaveis);

    // Garantir ordenacao logica: conservador <= moderado <= otimista
    // Em casos extremos (ex: intangiveis muito altos), reordenar
    var valores = [cConservador.valor, cModerado.valor, cOtimista.valor].sort(function (a, b) { return a - b; });

    // ─── 11. Construir lista de ajustes ──────────────────────────────────
    var listaAjustes = [];

    // Ajuste PDD
    if (circulantes.contasReceber.pdd > 0) {
      listaAjustes.push({
        item: 'Contas a Receber',
        contabil: circulantes.contasReceber.original,
        ajustado: circulantes.contasReceber.ajustado,
        diferenca: arredondar(circulantes.contasReceber.ajustado - circulantes.contasReceber.original),
        motivo: 'PDD — inadimplencia de ' + formatarPct(circulantes.contasReceber.inadimplencia)
      });
    }

    // Ajuste obsolescencia
    if (circulantes.estoques.perdaObsolescencia > 0) {
      listaAjustes.push({
        item: 'Estoques',
        contabil: circulantes.estoques.original,
        ajustado: circulantes.estoques.ajustado,
        diferenca: arredondar(circulantes.estoques.ajustado - circulantes.estoques.original),
        motivo: 'Obsolescencia de ' + formatarPct(circulantes.estoques.obsolescencia)
      });
    }

    // Ajustes de valor de mercado (nao circulantes)
    for (var ai = 0; ai < naoCirculantes.ajustesAplicados.length; ai++) {
      listaAjustes.push(naoCirculantes.ajustesAplicados[ai]);
    }

    // ─── 12. Detalhes completos ──────────────────────────────────────────
    var detalhes = {
      ativosCirculantes: {
        caixa: circulantes.caixa,
        contasReceber: {
          original: circulantes.contasReceber.original,
          ajustado: circulantes.contasReceber.ajustado
        },
        estoques: {
          original: circulantes.estoques.original,
          ajustado: circulantes.estoques.ajustado
        },
        outros: circulantes.outros + circulantes.aplicacoes,
        total: circulantes.total
      },
      ativosNaoCirculantes: {
        imoveis: naoCirculantes.imoveis,
        veiculos: naoCirculantes.veiculos,
        maquinas: naoCirculantes.maquinas,
        investimentos: naoCirculantes.investimentos,
        outros: naoCirculantes.outros,
        total: naoCirculantes.total,
        ajustes: naoCirculantes.ajustesAplicados
      },
      totalAtivosTangiveis: totalAtivosTangiveis,
      passivos: {
        circulantes: passivos.circulantes,
        naoCirculantes: passivos.naoCirculantes,
        total: passivos.total
      },
      contingencias: contingenciasResultado,
      plAjustadoTangivel: plAjustadoTangivel,
      intangiveis: {
        declarados: intangiveisDec,
        porFluxo: intangiveisPorFluxo,
        totalUsado: totalIntangiveisUsado
      },
      vrd: vrdResultado,
      cenarios: {
        conservador: cConservador,
        moderado: cModerado,
        otimista: cOtimista
      },
      ajustes: listaAjustes
    };

    // ─── 13. Insights ────────────────────────────────────────────────────
    detalhes.insights = gerarInsights(inputs, detalhes);

    // ─── 14. Alertas ─────────────────────────────────────────────────────
    alertas = gerarAlertas(inputs, detalhes);

    // ─── 15. Resultado final ─────────────────────────────────────────────
    return {
      modulo: 'PATRIMONIAL',
      nomeEmpresa: nomeEmpresa,
      dataCalculo: hoje(),
      valorMinimo: valores[0],
      valorMediano: valores[1],
      valorMaximo: valores[2],
      equityValue: cModerado.valor,
      erro: false,
      alertas: alertas,
      detalhes: detalhes
    };
  }


  // =========================================================================
  // API PUBLICA
  // =========================================================================

  var API = {
    VERSION: '2.0.0',

    // Constantes
    DESCONTO_LIQUIDACAO: DESCONTO_LIQUIDACAO,
    PERCENTUAL_INTANGIVEIS_MODERADO: PERCENTUAL_INTANGIVEIS_MODERADO,
    PERCENTUAL_INTANGIVEIS_OTIMISTA: PERCENTUAL_INTANGIVEIS_OTIMISTA,
    LIMITE_INTANGIVEIS_SOBRE_TANGIVEIS: LIMITE_INTANGIVEIS_SOBRE_TANGIVEIS,
    LIMITE_GOODWILL_SOBRE_INTANGIVEIS: LIMITE_GOODWILL_SOBRE_INTANGIVEIS,
    PROBABILIDADE_CONTINGENCIA: PROBABILIDADE_CONTINGENCIA,

    // Funcao principal
    calcular: calcularPatrimonial,

    // Subfuncoes (expostas para testes e composicao)
    ajustarCirculantes: ajustarCirculantes,
    ajustarNaoCirculantes: ajustarNaoCirculantes,
    calcularPassivos: calcularPassivos,
    calcularIntangiveis: calcularIntangiveis,

    // ETAPA 6.1 — VRD
    calcularVRD: calcularVRD,
    calcularVRDLista: calcularVRDLista,

    // ETAPA 6.2 — Intangiveis por fluxo
    estimarIntangiveisPorFluxo: estimarIntangiveisPorFluxo,

    // ETAPA 6.3 — Contingencias CPC 25
    calcularContingencias: calcularContingencias,

    // Insights e alertas
    gerarInsights: gerarInsights,
    gerarAlertas: gerarAlertas
  };

  // Registrar no Core se disponivel
  if (Core && Core._registrarModulo) {
    Core._registrarModulo('Patrimonial', API);
  }

  return API;
  })(API);


  // ╔═══════════════════════════════════════════════════════════════════════════╗
  // ║  MÓDULO 6/6 — COMPARATIVO — Consolidação, Football Field, Waterfall, Resumo Exe║
  // ╚═══════════════════════════════════════════════════════════════════════════╝

  (function (Core) {

  // ─── Utilitários do Core ───
  var arredondar = Core.arredondar;
  var dividirSeguro = Core.dividirSeguro;
  var validarNumero = Core.validarNumero;
  var formatarMoeda = Core.formatarMoeda;
  var formatarMoedaCurta = Core.formatarMoedaCurta;
  var formatarPct = Core.formatarPct;
  var hoje = Core.hoje;


  // ═══════════════════════════════════════════════════════════════════════════
  // 1. PESOS ADAPTATIVOS POR TIPO DE EMPRESA (Etapa 7.1)
  // ═══════════════════════════════════════════════════════════════════════════

  var PESOS_POR_TIPO = {
    startup:      { dcf: 0.20, multiplos: 0.50, patrimonial: 0.30 },
    crescimento:  { dcf: 0.45, multiplos: 0.35, patrimonial: 0.20 },
    madura:       { dcf: 0.40, multiplos: 0.35, patrimonial: 0.25 },
    asset_heavy:  { dcf: 0.25, multiplos: 0.25, patrimonial: 0.50 },
    servicos:     { dcf: 0.45, multiplos: 0.40, patrimonial: 0.15 },
    dificuldade:  { dcf: 0.15, multiplos: 0.20, patrimonial: 0.65 }
  };

  var PESOS_PADRAO = { dcf: 0.40, multiplos: 0.35, patrimonial: 0.25 };


  /**
   * Sugere pesos adaptativos com base no perfil da empresa.
   * Analisa setor, porte, saúde financeira e composição de ativos.
   *
   * @param {Object} resultados - { dcf, multiplos, patrimonial }
   * @returns {Object} { tipo, pesos: { dcf, multiplos, patrimonial }, justificativa }
   */
  function sugerirPesos(resultados) {
    var dcf = resultados.dcf || {};
    var mult = resultados.multiplos || {};
    var patr = resultados.patrimonial || {};

    // Extrair informações para classificação
    var setor = _extrairSetor(dcf, mult, patr);
    var lucroPositivo = _temLucroPositivo(dcf);
    var plPositivo = _temPLPositivo(patr);
    var altoImobilizado = _temAltoImobilizado(patr);
    var crescimento = _extrairCrescimento(dcf);

    // Setores tipicamente de serviços / tecnologia
    var setoresServicos = ['servicos', 'educacao', 'tecnologia'];
    var setoresAssetHeavy = ['industria', 'construcao', 'imobiliario', 'agronegocio'];
    var setoresCrescimento = ['tecnologia', 'saude'];

    var tipo, justificativa;

    // Regra 1: Dificuldade financeira (prioridade máxima)
    if (!lucroPositivo && !plPositivo) {
      tipo = 'dificuldade';
      justificativa = 'Empresa com prejuízo e PL negativo — foco no valor patrimonial de liquidação.';
    }
    // Regra 2: Startup (sem lucro + setor de tecnologia/serviços)
    else if (!lucroPositivo && (setor === 'tecnologia' || setor === 'servicos')) {
      tipo = 'startup';
      justificativa = 'Empresa sem lucro em setor de inovação — múltiplos de mercado ganham peso por refletir expectativa de crescimento.';
    }
    // Regra 3: Asset heavy (setor intensivo em ativos + alto imobilizado)
    else if (setoresAssetHeavy.indexOf(setor) !== -1 && altoImobilizado) {
      tipo = 'asset_heavy';
      justificativa = 'Setor intensivo em ativos com alto imobilizado — valor patrimonial é referência principal.';
    }
    // Regra 4: Serviços puros (setor de serviços + baixo imobilizado)
    else if (setoresServicos.indexOf(setor) !== -1 && !altoImobilizado) {
      tipo = 'servicos';
      justificativa = 'Empresa de serviços com poucos ativos tangíveis — DCF e múltiplos captam melhor o valor.';
    }
    // Regra 5: Crescimento (crescimento > 15% ou setor dinâmico com lucro)
    else if ((crescimento > 0.15 || setoresCrescimento.indexOf(setor) !== -1) && lucroPositivo) {
      tipo = 'crescimento';
      justificativa = 'Empresa em crescimento acelerado — DCF projeta potencial futuro, múltiplos confirmam posição setorial.';
    }
    // Regra 6: Madura (default)
    else {
      tipo = 'madura';
      justificativa = 'Empresa madura e estável — ponderação equilibrada entre os três métodos.';
    }

    return {
      tipo: tipo,
      pesos: PESOS_POR_TIPO[tipo],
      justificativa: justificativa
    };
  }


  // ─── Funções auxiliares de classificação ───

  function _extrairSetor(dcf, mult, patr) {
    if (dcf && dcf.detalhes && dcf.detalhes.setor) return dcf.detalhes.setor;
    if (dcf && dcf.setor) return dcf.setor;
    if (mult && mult.detalhes && mult.detalhes.setor) return mult.detalhes.setor;
    if (mult && mult.setor) return mult.setor;
    if (patr && patr.detalhes && patr.detalhes.setor) return patr.detalhes.setor;
    if (patr && patr.setor) return patr.setor;
    return 'servicos';
  }

  function _temLucroPositivo(dcf) {
    if (!dcf || dcf.erro) return true; // Presume positivo se DCF indisponível
    return dcf.equityValue > 0;
  }

  function _temPLPositivo(patr) {
    if (!patr || patr.erro) return true; // Presume positivo se Patrimonial indisponível
    return patr.valorMediano > 0;
  }

  function _temAltoImobilizado(patr) {
    if (!patr || patr.erro || !patr.detalhes) return false;
    var det = patr.detalhes;
    // Se detalhes contêm ativosNaoCirculantes com totalNaoCirculantes
    var totalNC = 0;
    if (det.ativosNaoCirculantes && det.ativosNaoCirculantes.totalNaoCirculantes !== undefined) {
      totalNC = validarNumero(det.ativosNaoCirculantes.totalNaoCirculantes);
    } else if (det.totalAtivosTangiveis !== undefined) {
      totalNC = validarNumero(det.totalAtivosTangiveis);
    }
    // Comparar com valor total — se > 50% do valor mediano, é asset_heavy
    var valorRef = Math.abs(validarNumero(patr.valorMediano, 1));
    return totalNC > 0 && totalNC > valorRef * 0.50;
  }

  function _extrairCrescimento(dcf) {
    if (!dcf || dcf.erro || !dcf.detalhes) return 0;
    if (dcf.detalhes.taxaCrescimento !== undefined) {
      return validarNumero(dcf.detalhes.taxaCrescimento, 0);
    }
    return 0;
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // 2. CONSOLIDAÇÃO PRINCIPAL
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Consolida resultados dos 3 métodos usando pesos adaptativos.
   *
   * @param {Object} resultados - { dcf, multiplos, patrimonial } (cada um do calcular() do módulo)
   * @param {Object} [pesosOverride] - Override manual { dcf, multiplos, patrimonial }
   * @returns {Object} Resultado consolidado completo
   */
  function consolidar(resultados, pesosOverride) {
    if (!resultados) {
      return { erro: true, mensagem: 'resultados é obrigatório' };
    }

    var dcf = resultados.dcf || null;
    var mult = resultados.multiplos || null;
    var patr = resultados.patrimonial || null;

    // 1. Determinar métodos disponíveis (sem erro)
    var temDCF = dcf && dcf.erro !== true;
    var temMult = mult && mult.erro !== true;
    var temPatr = patr && patr.erro !== true;

    var metodosDisponiveis = 0;
    if (temDCF) metodosDisponiveis++;
    if (temMult) metodosDisponiveis++;
    if (temPatr) metodosDisponiveis++;

    if (metodosDisponiveis === 0) {
      return {
        erro: true,
        mensagem: 'Nenhum método retornou resultado válido'
      };
    }

    // 2. Determinar pesos (override ou adaptativos)
    var pesosInfo;
    if (pesosOverride && pesosOverride.dcf !== undefined) {
      pesosInfo = {
        tipo: 'manual',
        pesos: {
          dcf: validarNumero(pesosOverride.dcf, PESOS_PADRAO.dcf),
          multiplos: validarNumero(pesosOverride.multiplos, PESOS_PADRAO.multiplos),
          patrimonial: validarNumero(pesosOverride.patrimonial, PESOS_PADRAO.patrimonial)
        },
        justificativa: 'Pesos definidos manualmente pelo usuário.'
      };
    } else {
      pesosInfo = sugerirPesos(resultados);
    }

    // 3. Normalizar pesos para métodos disponíveis
    var pesosNorm = _normalizarPesos(pesosInfo.pesos, temDCF, temMult, temPatr);

    // 4. Calcular média ponderada (mediana)
    var somaPonderada = 0;
    var totalPeso = 0;

    if (temDCF) {
      var valDCF = validarNumero(dcf.equityValue);
      somaPonderada += valDCF * pesosNorm.dcf;
      totalPeso += pesosNorm.dcf;
    }
    if (temMult) {
      var valMult = validarNumero(mult.equityValue);
      somaPonderada += valMult * pesosNorm.multiplos;
      totalPeso += pesosNorm.multiplos;
    }
    if (temPatr) {
      var valPatr = validarNumero(patr.equityValue || patr.valorMediano);
      somaPonderada += valPatr * pesosNorm.patrimonial;
      totalPeso += pesosNorm.patrimonial;
    }

    var valorMediano = totalPeso > 0 ? arredondar(somaPonderada / totalPeso) : 0;

    // 5. Min/Max absolutos (entre todos os métodos)
    var todosMin = [];
    var todosMax = [];
    if (temDCF) {
      todosMin.push(validarNumero(dcf.valorMinimo));
      todosMax.push(validarNumero(dcf.valorMaximo));
    }
    if (temMult) {
      todosMin.push(validarNumero(mult.valorMinimo));
      todosMax.push(validarNumero(mult.valorMaximo));
    }
    if (temPatr) {
      todosMin.push(validarNumero(patr.valorMinimo));
      todosMax.push(validarNumero(patr.valorMaximo));
    }

    // Filtrar zeros
    var minsFiltrados = todosMin.filter(function (v) { return v !== 0 && isFinite(v); });
    var maxsFiltrados = todosMax.filter(function (v) { return v !== 0 && isFinite(v); });

    var valorMinimo = minsFiltrados.length > 0 ? Math.min.apply(null, minsFiltrados) : 0;
    var valorMaximo = maxsFiltrados.length > 0 ? Math.max.apply(null, maxsFiltrados) : 0;

    // 6. Faixa de negociação (+-15%)
    var faixaNegociacao = {
      minimo: arredondar(valorMediano * 0.85),
      recomendado: arredondar(valorMediano),
      maximo: arredondar(valorMediano * 1.15)
    };

    // 7. Alertas cruzados
    var alertas = gerarAlertasCruzados(resultados);

    // 8. Football field
    var footballField = gerarFootballField(resultados, {
      valorMinimo: valorMinimo,
      valorMaximo: valorMaximo,
      faixaNegociacao: faixaNegociacao,
      valorRecomendado: valorMediano
    });

    // 9. Waterfall (apenas se DCF disponível)
    var waterfall = temDCF ? gerarWaterfall(dcf) : null;

    // 10. Percentis
    var percentis = calcularPercentis(resultados);

    // 11. Resumo executivo
    var resumo = gerarResumo({
      valorMinimo: valorMinimo,
      valorMediano: valorMediano,
      valorMaximo: valorMaximo,
      faixaNegociacao: faixaNegociacao,
      pesos: pesosNorm,
      pesosInfo: pesosInfo,
      metodosDisponiveis: metodosDisponiveis,
      temDCF: temDCF,
      temMult: temMult,
      temPatr: temPatr
    }, resultados);

    // 12. Dados para PDF
    var dadosPDF = gerarDadosPDF({
      valorMinimo: valorMinimo,
      valorMediano: valorMediano,
      valorMaximo: valorMaximo,
      valorRecomendado: valorMediano,
      faixaNegociacao: faixaNegociacao,
      pesos: pesosNorm,
      pesosInfo: pesosInfo,
      alertas: alertas,
      footballField: footballField,
      waterfall: waterfall,
      percentis: percentis,
      resumo: resumo
    }, resultados);

    return {
      erro: false,
      valorMinimo: arredondar(valorMinimo),
      valorMediano: arredondar(valorMediano),
      valorMaximo: arredondar(valorMaximo),
      valorRecomendado: arredondar(valorMediano),
      faixaNegociacao: faixaNegociacao,
      pesos: {
        tipo: pesosInfo.tipo,
        dcf: pesosNorm.dcf,
        multiplos: pesosNorm.multiplos,
        patrimonial: pesosNorm.patrimonial,
        justificativa: pesosInfo.justificativa
      },
      alertas: alertas,
      footballField: footballField,
      waterfall: waterfall,
      percentis: percentis,
      resumo: resumo,
      dadosPDF: dadosPDF
    };
  }


  /**
   * Normaliza pesos para que somem 1.0, zerando métodos indisponíveis.
   */
  function _normalizarPesos(pesos, temDCF, temMult, temPatr) {
    var d = temDCF ? validarNumero(pesos.dcf) : 0;
    var m = temMult ? validarNumero(pesos.multiplos) : 0;
    var p = temPatr ? validarNumero(pesos.patrimonial) : 0;
    var soma = d + m + p;

    if (soma <= 0) {
      // Fallback: distribuir igualmente entre os disponíveis
      var qtd = (temDCF ? 1 : 0) + (temMult ? 1 : 0) + (temPatr ? 1 : 0);
      var cada = qtd > 0 ? arredondar(1 / qtd, 4) : 0;
      return {
        dcf: temDCF ? cada : 0,
        multiplos: temMult ? cada : 0,
        patrimonial: temPatr ? cada : 0
      };
    }

    return {
      dcf: arredondar(d / soma, 4),
      multiplos: arredondar(m / soma, 4),
      patrimonial: arredondar(p / soma, 4)
    };
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // 3. FOOTBALL FIELD
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Gera dados formatados para o Football Field Chart.
   * Inclui apenas barras dos métodos disponíveis (sem erro).
   *
   * @param {Object} resultados - { dcf, multiplos, patrimonial }
   * @param {Object} consolidado - Dados consolidados parciais
   * @returns {Object} { barras: [...], escala: { min, max }, faixaNegociacao: { min, max } }
   */
  function gerarFootballField(resultados, consolidado) {
    var barras = [];
    var todosValores = [];

    var dcf = resultados.dcf;
    var mult = resultados.multiplos;
    var patr = resultados.patrimonial;

    // DCF
    if (dcf && dcf.erro !== true) {
      var dcfMin = validarNumero(dcf.valorMinimo);
      var dcfMed = validarNumero(dcf.equityValue);
      var dcfMax = validarNumero(dcf.valorMaximo);
      barras.push({
        label: 'DCF',
        min: arredondar(dcfMin),
        mediana: arredondar(dcfMed),
        max: arredondar(dcfMax),
        cor: '#1E40AF',
        destaque: false
      });
      todosValores.push(dcfMin, dcfMed, dcfMax);
    }

    // Múltiplos
    if (mult && mult.erro !== true) {
      var multMin = validarNumero(mult.valorMinimo);
      var multMed = validarNumero(mult.equityValue);
      var multMax = validarNumero(mult.valorMaximo);
      barras.push({
        label: 'Múltiplos',
        min: arredondar(multMin),
        mediana: arredondar(multMed),
        max: arredondar(multMax),
        cor: '#047857',
        destaque: false
      });
      todosValores.push(multMin, multMed, multMax);
    }

    // Patrimonial
    if (patr && patr.erro !== true) {
      var patrMin = validarNumero(patr.valorMinimo);
      var patrMed = validarNumero(patr.equityValue || patr.valorMediano);
      var patrMax = validarNumero(patr.valorMaximo);
      barras.push({
        label: 'Patrimonial',
        min: arredondar(patrMin),
        mediana: arredondar(patrMed),
        max: arredondar(patrMax),
        cor: '#B45309',
        destaque: false
      });
      todosValores.push(patrMin, patrMed, patrMax);
    }

    // Barra consolidada
    if (consolidado) {
      var fnMin = consolidado.faixaNegociacao
        ? validarNumero(consolidado.faixaNegociacao.minimo)
        : validarNumero(consolidado.valorMinimo);
      var fnRec = consolidado.valorRecomendado !== undefined
        ? validarNumero(consolidado.valorRecomendado)
        : validarNumero(consolidado.faixaNegociacao ? consolidado.faixaNegociacao.recomendado : 0);
      var fnMax = consolidado.faixaNegociacao
        ? validarNumero(consolidado.faixaNegociacao.maximo)
        : validarNumero(consolidado.valorMaximo);

      barras.push({
        label: 'Consolidado',
        min: arredondar(fnMin),
        mediana: arredondar(fnRec),
        max: arredondar(fnMax),
        cor: '#7C3AED',
        destaque: true
      });
      todosValores.push(fnMin, fnRec, fnMax);
    }

    // Escala global
    var valoresPositivos = todosValores.filter(function (v) { return isFinite(v) && v > 0; });
    var escalaMin = valoresPositivos.length > 0 ? Math.min.apply(null, valoresPositivos) : 0;
    var escalaMax = valoresPositivos.length > 0 ? Math.max.apply(null, valoresPositivos) : 0;

    // Margem de 10% na escala para visualização
    var margem = (escalaMax - escalaMin) * 0.10;
    escalaMin = Math.max(0, escalaMin - margem);
    escalaMax = escalaMax + margem;

    // Faixa de negociação para destaque no gráfico
    var faixaNG = { min: 0, max: 0 };
    if (consolidado && consolidado.faixaNegociacao) {
      faixaNG.min = validarNumero(consolidado.faixaNegociacao.minimo);
      faixaNG.max = validarNumero(consolidado.faixaNegociacao.maximo);
    }

    return {
      barras: barras,
      escala: {
        min: arredondar(escalaMin),
        max: arredondar(escalaMax)
      },
      faixaNegociacao: faixaNG
    };
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // 4. WATERFALL CHART (Etapa 7.2)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Gera dados de waterfall chart a partir do resultado do DCF.
   * Mostra a construção do valor:
   *   Receita -> (-Custos) -> (-Impostos) -> (-CAPEX) -> FCF -> (+Terminal) -> EV -> (-Dívida) -> Equity -> (-Descontos) -> Valor Final
   *
   * @param {Object} resultadoDCF - Resultado do módulo DCF (calcular())
   * @returns {Object|null} { etapas: [...] } ou null se DCF indisponível
   */
  function gerarWaterfall(resultadoDCF) {
    if (!resultadoDCF || resultadoDCF.erro === true) {
      return null;
    }

    var det = resultadoDCF.detalhes || {};
    var anoBase = det.anoBase || {};
    var composicao = det.composicao || {};

    // Extrair valores
    var receita = validarNumero(anoBase.receitaBruta || det.receita);
    var custos = validarNumero(anoBase.custosOperacionais || det.custos);
    var ebit = validarNumero(anoBase.ebit);
    var da = validarNumero(anoBase.depreciacaoAmortizacao);
    var nopat = validarNumero(anoBase.nopat);
    var capex = validarNumero(anoBase.capex);
    var varCG = validarNumero(anoBase.variacaoCapitalGiro);
    var fcf = validarNumero(anoBase.fcf);

    var vpFluxos = validarNumero(composicao.valorFluxosProjetados);
    var vpTerminal = validarNumero(composicao.valorTerminal);
    var ev = validarNumero(det.enterpriseValue);
    var dividaLiquida = validarNumero(det.dividaLiquida);
    var equityFinal = validarNumero(resultadoDCF.equityValue);

    // Se não temos dados suficientes no anoBase, tentar reconstruir
    if (receita === 0 && det.receita) receita = validarNumero(det.receita);
    if (custos === 0 && ebit > 0 && receita > 0) custos = receita - ebit - da;

    // Impostos operacionais (EBIT - NOPAT)
    var impostos = ebit - nopat;
    if (impostos < 0) impostos = 0;

    // Construir etapas
    var etapas = [];
    var acumulado = 0;

    // Etapa 1: Receita
    if (receita > 0) {
      acumulado = receita;
      etapas.push({
        label: 'Receita',
        valor: arredondar(receita),
        tipo: 'positivo',
        acumulado: arredondar(acumulado)
      });
    }

    // Etapa 2: Custos operacionais
    if (custos !== 0) {
      var custosNeg = -Math.abs(custos);
      acumulado += custosNeg;
      etapas.push({
        label: 'Custos Operacionais',
        valor: arredondar(custosNeg),
        tipo: 'negativo',
        acumulado: arredondar(acumulado)
      });
    }

    // Etapa 3: D&A (já subtraída nos custos mas soma de volta)
    if (da > 0) {
      // D&A está incluída nos custos, mas soma de volta para EBITDA
      // Mostramos EBIT como subtotal
      etapas.push({
        label: 'EBIT',
        valor: arredondar(ebit),
        tipo: 'subtotal',
        acumulado: arredondar(ebit)
      });
      acumulado = ebit;
    }

    // Etapa 4: Impostos operacionais
    if (impostos > 0) {
      acumulado -= impostos;
      etapas.push({
        label: 'Impostos',
        valor: arredondar(-impostos),
        tipo: 'negativo',
        acumulado: arredondar(acumulado)
      });
    }

    // Etapa 5: NOPAT como subtotal
    if (nopat !== 0) {
      etapas.push({
        label: 'NOPAT',
        valor: arredondar(nopat),
        tipo: 'subtotal',
        acumulado: arredondar(nopat)
      });
      acumulado = nopat;
    }

    // Etapa 6: +D&A (adiciona de volta, pois não é caixa)
    if (da > 0) {
      acumulado += da;
      etapas.push({
        label: '+Depreciação',
        valor: arredondar(da),
        tipo: 'positivo',
        acumulado: arredondar(acumulado)
      });
    }

    // Etapa 7: -CAPEX
    if (capex > 0) {
      acumulado -= capex;
      etapas.push({
        label: 'CAPEX',
        valor: arredondar(-capex),
        tipo: 'negativo',
        acumulado: arredondar(acumulado)
      });
    }

    // Etapa 8: -Variação Capital de Giro
    if (varCG !== 0) {
      acumulado -= varCG;
      etapas.push({
        label: 'Var. Capital de Giro',
        valor: arredondar(-varCG),
        tipo: varCG > 0 ? 'negativo' : 'positivo',
        acumulado: arredondar(acumulado)
      });
    }

    // Etapa 9: FCF como subtotal
    etapas.push({
      label: 'FCF (Ano Base)',
      valor: arredondar(fcf || acumulado),
      tipo: 'subtotal',
      acumulado: arredondar(fcf || acumulado)
    });

    // Etapa 10: VP dos Fluxos Projetados
    if (vpFluxos > 0) {
      etapas.push({
        label: 'VP Fluxos Projetados',
        valor: arredondar(vpFluxos),
        tipo: 'positivo',
        acumulado: arredondar(vpFluxos)
      });
    }

    // Etapa 11: VP do Valor Terminal
    if (vpTerminal > 0) {
      etapas.push({
        label: 'VP Valor Terminal',
        valor: arredondar(vpTerminal),
        tipo: 'positivo',
        acumulado: arredondar(vpFluxos + vpTerminal)
      });
    }

    // Etapa 12: Enterprise Value como subtotal
    if (ev !== 0) {
      etapas.push({
        label: 'Enterprise Value',
        valor: arredondar(ev),
        tipo: 'subtotal',
        acumulado: arredondar(ev)
      });
    }

    // Etapa 13: -Dívida Líquida
    if (dividaLiquida !== 0) {
      etapas.push({
        label: 'Dívida Líquida',
        valor: arredondar(-dividaLiquida),
        tipo: dividaLiquida > 0 ? 'negativo' : 'positivo',
        acumulado: arredondar(ev - dividaLiquida)
      });
    }

    // Etapa 14: Equity Value como subtotal final
    etapas.push({
      label: 'Equity Value',
      valor: arredondar(equityFinal),
      tipo: 'subtotal',
      acumulado: arredondar(equityFinal)
    });

    return {
      etapas: etapas
    };
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // 5. PERCENTIS / INTERVALOS DE CONFIANÇA (Etapa 7.3)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Calcula percentis a partir de todos os pontos de avaliação disponíveis.
   * Coleta cenários de cada método e calcula P10, P25, P50, P75, P90.
   *
   * @param {Object} resultados - { dcf, multiplos, patrimonial }
   * @returns {Object} { p10, p25, p50, p75, p90, valores: sorted array }
   */
  function calcularPercentis(resultados) {
    var valores = [];

    var dcf = resultados.dcf;
    var mult = resultados.multiplos;
    var patr = resultados.patrimonial;

    // DCF: cenários pessimista, base, otimista
    if (dcf && dcf.erro !== true) {
      if (dcf.detalhes && dcf.detalhes.cenarios) {
        var cen = dcf.detalhes.cenarios;
        if (cen.pessimista && cen.pessimista.equityValue !== undefined) {
          valores.push(validarNumero(cen.pessimista.equityValue));
        }
        if (cen.base && cen.base.equityValue !== undefined) {
          valores.push(validarNumero(cen.base.equityValue));
        }
        if (cen.otimista && cen.otimista.equityValue !== undefined) {
          valores.push(validarNumero(cen.otimista.equityValue));
        }
      }
      // Fallback: min, mediana, max
      if (valores.length === 0) {
        _adicionarMinMedMax(valores, dcf);
      }
    }

    // Múltiplos: min, mediana, max
    if (mult && mult.erro !== true) {
      _adicionarMinMedMax(valores, mult);
    }

    // Patrimonial: conservador, moderado, otimista (= min, mediana, max)
    if (patr && patr.erro !== true) {
      _adicionarMinMedMax(valores, patr);
    }

    // Filtrar valores inválidos
    valores = valores.filter(function (v) { return isFinite(v) && v !== 0; });

    if (valores.length === 0) {
      return { p10: 0, p25: 0, p50: 0, p75: 0, p90: 0, valores: [] };
    }

    // Ordenar crescente
    valores.sort(function (a, b) { return a - b; });

    return {
      p10: arredondar(_percentil(valores, 0.10)),
      p25: arredondar(_percentil(valores, 0.25)),
      p50: arredondar(_percentil(valores, 0.50)),
      p75: arredondar(_percentil(valores, 0.75)),
      p90: arredondar(_percentil(valores, 0.90)),
      valores: valores.map(function (v) { return arredondar(v); })
    };
  }


  /**
   * Adiciona valorMinimo, equityValue/valorMediano e valorMaximo ao array.
   */
  function _adicionarMinMedMax(arr, resultado) {
    var min = validarNumero(resultado.valorMinimo);
    var med = validarNumero(resultado.equityValue || resultado.valorMediano);
    var max = validarNumero(resultado.valorMaximo);
    if (min !== 0) arr.push(min);
    if (med !== 0) arr.push(med);
    if (max !== 0) arr.push(max);
  }


  /**
   * Calcula percentil por interpolação linear.
   * Método: posição = p * (n - 1), interpola entre vizinhos.
   *
   * @param {number[]} valoresOrdenados - Array já ordenado
   * @param {number} p - Percentil desejado (0 a 1)
   * @returns {number} Valor interpolado
   */
  function _percentil(valoresOrdenados, p) {
    var n = valoresOrdenados.length;
    if (n === 0) return 0;
    if (n === 1) return valoresOrdenados[0];

    var posicao = p * (n - 1);
    var inferior = Math.floor(posicao);
    var superior = Math.ceil(posicao);
    var fracao = posicao - inferior;

    if (inferior === superior || superior >= n) {
      return valoresOrdenados[inferior];
    }

    return valoresOrdenados[inferior] + fracao * (valoresOrdenados[superior] - valoresOrdenados[inferior]);
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // 6. ALERTAS CRUZADOS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Gera alertas cruzados entre os métodos de avaliação.
   * Detecta inconsistências, riscos e observações relevantes.
   *
   * @param {Object} resultados - { dcf, multiplos, patrimonial }
   * @returns {Array} Lista de alertas { tipo, titulo, mensagem }
   */
  function gerarAlertasCruzados(resultados) {
    var alertas = [];

    var dcf = resultados.dcf;
    var mult = resultados.multiplos;
    var patr = resultados.patrimonial;

    var temDCF = dcf && dcf.erro !== true;
    var temMult = mult && mult.erro !== true;
    var temPatr = patr && patr.erro !== true;

    // Coletar valores para comparação
    var valoresMediana = [];
    var valoresMin = [];
    var valoresMax = [];

    if (temDCF) {
      valoresMediana.push(validarNumero(dcf.equityValue));
      valoresMin.push(validarNumero(dcf.valorMinimo));
      valoresMax.push(validarNumero(dcf.valorMaximo));
    }
    if (temMult) {
      valoresMediana.push(validarNumero(mult.equityValue));
      valoresMin.push(validarNumero(mult.valorMinimo));
      valoresMax.push(validarNumero(mult.valorMaximo));
    }
    if (temPatr) {
      var patrEq = validarNumero(patr.equityValue || patr.valorMediano);
      valoresMediana.push(patrEq);
      valoresMin.push(validarNumero(patr.valorMinimo));
      valoresMax.push(validarNumero(patr.valorMaximo));
    }

    // ─── Alerta 1: Dispersão significativa entre métodos ───
    var todosValoresAbsolutos = valoresMin.concat(valoresMax).filter(function (v) {
      return isFinite(v) && v > 0;
    });
    if (todosValoresAbsolutos.length >= 2) {
      var minAbs = Math.min.apply(null, todosValoresAbsolutos);
      var maxAbs = Math.max.apply(null, todosValoresAbsolutos);
      if (minAbs > 0 && maxAbs / minAbs > 3) {
        alertas.push({
          tipo: 'aviso',
          titulo: 'Divergência significativa entre métodos',
          mensagem: 'A razão entre o maior e menor valor é de ' +
            arredondar(maxAbs / minAbs, 1) + 'x. ' +
            'Isso indica premissas muito diferentes ou características atípicas da empresa. ' +
            'Revise os inputs e considere priorizar o método mais adequado ao perfil do negócio.'
        });
      }
    }

    // ─── Alerta 2: Patrimonial > DCF (destruição de valor operacional) ───
    if (temPatr && temDCF) {
      var dcfEq = validarNumero(dcf.equityValue);
      var patrEq2 = validarNumero(patr.equityValue || patr.valorMediano);
      if (patrEq2 > 0 && dcfEq > 0 && patrEq2 > dcfEq) {
        alertas.push({
          tipo: 'alerta',
          titulo: 'Possível destruição de valor operacional',
          mensagem: 'O valor patrimonial (' + formatarMoedaCurta(patrEq2) +
            ') supera o DCF (' + formatarMoedaCurta(dcfEq) +
            '). A empresa pode não gerar retorno adequado sobre seus ativos. ' +
            'Avalie se a operação atual justifica o investimento nos ativos.'
        });
      }
    }

    // ─── Alerta 3: Múltiplos muito acima do DCF ───
    if (temMult && temDCF) {
      var dcfEq3 = validarNumero(dcf.equityValue);
      var multEq = validarNumero(mult.equityValue);
      if (multEq > 0 && dcfEq3 > 0 && multEq > dcfEq3 * 2) {
        alertas.push({
          tipo: 'info',
          titulo: 'Setor aquecido ou DCF conservador',
          mensagem: 'Múltiplos de mercado (' + formatarMoedaCurta(multEq) +
            ') indicam valor mais de 2x superior ao DCF (' + formatarMoedaCurta(dcfEq3) +
            '). O setor pode estar aquecido ou as premissas do DCF estão conservadoras. ' +
            'Considere ajustar a taxa de crescimento ou revisar os múltiplos utilizados.'
        });
      }
    }

    // ─── Alerta 4: DCF negativo com outros positivos ───
    if (temDCF && validarNumero(dcf.equityValue) < 0) {
      var outrosPositivos = false;
      if (temMult && validarNumero(mult.equityValue) > 0) outrosPositivos = true;
      if (temPatr && validarNumero(patr.equityValue || patr.valorMediano) > 0) outrosPositivos = true;

      if (outrosPositivos) {
        alertas.push({
          tipo: 'alerta',
          titulo: 'Fluxo de caixa insuficiente',
          mensagem: 'O DCF retornou valor negativo, mas outros métodos indicam valor positivo. ' +
            'A empresa pode ter ativos valiosos mas não gera caixa suficiente para justificá-los. ' +
            'Verifique se há potencial de recuperação operacional ou se a liquidação dos ativos é mais vantajosa.'
        });
      }
    }

    // ─── Alerta 5: Alta dispersão nos cenários DCF ───
    if (temDCF && dcf.detalhes && dcf.detalhes.cenarios) {
      var cenarios = dcf.detalhes.cenarios;
      var pessEq = validarNumero(cenarios.pessimista ? cenarios.pessimista.equityValue : 0);
      var otimEq = validarNumero(cenarios.otimista ? cenarios.otimista.equityValue : 0);
      if (pessEq > 0 && otimEq > 0 && otimEq / pessEq > 3) {
        alertas.push({
          tipo: 'info',
          titulo: 'Alta incerteza nas projeções',
          mensagem: 'Os cenários do DCF variam de ' + formatarMoedaCurta(pessEq) +
            ' a ' + formatarMoedaCurta(otimEq) +
            ' (razão de ' + arredondar(otimEq / pessEq, 1) + 'x). ' +
            'Há alta sensibilidade às premissas de crescimento e taxa de desconto. ' +
            'Recomenda-se usar cenários específicos para negociação.'
        });
      }
    }

    // ─── Alerta 6: Patrimonial conservador negativo (risco de insolvência) ───
    if (temPatr) {
      var patrMin = validarNumero(patr.valorMinimo);
      if (patrMin < 0) {
        alertas.push({
          tipo: 'critico',
          titulo: 'Risco de insolvência no cenário de liquidação',
          mensagem: 'O valor patrimonial conservador é negativo (' + formatarMoedaCurta(patrMin) +
            '). No cenário de liquidação, os passivos superam o valor realizável dos ativos. ' +
            'Isso representa risco significativo para credores e investidores.'
        });
      }
    }

    // ─── Alerta 7: Apenas 1 método disponível ───
    var metDisponiveis = (temDCF ? 1 : 0) + (temMult ? 1 : 0) + (temPatr ? 1 : 0);
    if (metDisponiveis === 1) {
      alertas.push({
        tipo: 'info',
        titulo: 'Avaliação baseada em método único',
        mensagem: 'Apenas um método de avaliação retornou resultado válido. ' +
          'A confiabilidade da estimativa é menor sem a validação cruzada entre métodos. ' +
          'Recomenda-se revisar os inputs dos métodos que falharam.'
      });
    }

    return alertas;
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // 7. RESUMO EXECUTIVO
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Gera resumo executivo em português com base nos resultados consolidados.
   *
   * @param {Object} consolidado - Dados consolidados
   * @param {Object} resultados - { dcf, multiplos, patrimonial }
   * @returns {string} Texto do resumo executivo
   */
  function gerarResumo(consolidado, resultados) {
    var dcf = resultados.dcf;
    var mult = resultados.multiplos;
    var patr = resultados.patrimonial;

    var temDCF = consolidado.temDCF;
    var temMult = consolidado.temMult;
    var temPatr = consolidado.temPatr;

    // Nome da empresa
    var nomeEmpresa = _extrairNomeEmpresa(dcf, mult, patr);

    // Construir texto
    var partes = [];

    // Introdução
    var qtdMetodos = consolidado.metodosDisponiveis || 0;
    var nomeMetodos = [];
    if (temDCF) nomeMetodos.push('Fluxo de Caixa Descontado (DCF)');
    if (temMult) nomeMetodos.push('Múltiplos de Mercado');
    if (temPatr) nomeMetodos.push('Valor Patrimonial Ajustado');

    partes.push(
      'A empresa ' + nomeEmpresa + ' foi avaliada por ' +
      qtdMetodos + ' método' + (qtdMetodos !== 1 ? 's' : '') +
      ' independente' + (qtdMetodos !== 1 ? 's' : '') +
      ': ' + nomeMetodos.join(', ') + '.'
    );

    // Resultado de cada método
    if (temDCF) {
      partes.push(
        'O DCF, que projeta os fluxos de caixa futuros da empresa, indica um valor de equity de ' +
        formatarMoedaCurta(validarNumero(dcf.equityValue)) + '.'
      );
    }
    if (temMult) {
      partes.push(
        'A avaliação por Múltiplos de Mercado, que compara a empresa com pares do setor, aponta para ' +
        formatarMoedaCurta(validarNumero(mult.equityValue)) + '.'
      );
    }
    if (temPatr) {
      partes.push(
        'O Valor Patrimonial Ajustado, baseado nos ativos e passivos a valor de mercado, sugere ' +
        formatarMoedaCurta(validarNumero(patr.equityValue || patr.valorMediano)) + '.'
      );
    }

    // Ponderação e resultado
    var pesos = consolidado.pesos || {};
    var pesosInfo = consolidado.pesosInfo || {};
    var pesosTexto = [];
    if (temDCF) pesosTexto.push('DCF ' + _pctTexto(pesos.dcf));
    if (temMult) pesosTexto.push('Múltiplos ' + _pctTexto(pesos.multiplos));
    if (temPatr) pesosTexto.push('Patrimonial ' + _pctTexto(pesos.patrimonial));

    partes.push(
      'Considerando a ponderação ' +
      (pesosInfo.tipo === 'manual' ? 'definida pelo usuário' : 'adaptativa (' + (pesosInfo.tipo || 'madura') + ')') +
      ' (' + pesosTexto.join(', ') + '), ' +
      'o valor estimado da empresa é de ' + formatarMoeda(consolidado.valorMediano) + '.'
    );

    // Faixa de negociação
    var fn = consolidado.faixaNegociacao || {};
    partes.push(
      'A faixa de negociação recomendada situa-se entre ' +
      formatarMoeda(validarNumero(fn.minimo)) + ' e ' +
      formatarMoeda(validarNumero(fn.maximo)) + '.'
    );

    // Justificativa dos pesos
    if (pesosInfo.justificativa) {
      partes.push(pesosInfo.justificativa);
    }

    // Observações sobre riscos (baseado nos alertas)
    var alertasCriticos = (consolidado.alertas || []).filter(function (a) {
      return a.tipo === 'critico' || a.tipo === 'alerta';
    });
    if (alertasCriticos.length > 0) {
      partes.push(
        'Atenção: foram identificado' + (alertasCriticos.length > 1 ? 's ' + alertasCriticos.length + ' pontos' : ' 1 ponto') +
        ' de atenção que podem impactar significativamente a avaliação. ' +
        'Consulte a seção de alertas para detalhes.'
      );
    }

    return partes.join(' ');
  }


  /**
   * Extrai o nome da empresa dos resultados disponíveis.
   */
  function _extrairNomeEmpresa(dcf, mult, patr) {
    if (dcf && dcf.nomeEmpresa) return dcf.nomeEmpresa;
    if (dcf && dcf.detalhes && dcf.detalhes.nomeEmpresa) return dcf.detalhes.nomeEmpresa;
    if (mult && mult.nomeEmpresa) return mult.nomeEmpresa;
    if (mult && mult.detalhes && mult.detalhes.nomeEmpresa) return mult.detalhes.nomeEmpresa;
    if (patr && patr.nomeEmpresa) return patr.nomeEmpresa;
    if (patr && patr.detalhes && patr.detalhes.nomeEmpresa) return patr.detalhes.nomeEmpresa;
    return 'Empresa';
  }


  /**
   * Formata percentual para texto (ex: 0.40 → "40%").
   */
  function _pctTexto(valor) {
    return (validarNumero(valor) * 100).toFixed(0) + '%';
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // 8. DADOS PARA PDF
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Gera estrutura de dados completa para exportação em PDF.
   *
   * @param {Object} consolidado - Resultado consolidado completo
   * @param {Object} resultados - { dcf, multiplos, patrimonial }
   * @returns {Object} Dados estruturados para PDF
   */
  function gerarDadosPDF(consolidado, resultados) {
    var dcf = resultados.dcf || {};
    var mult = resultados.multiplos || {};
    var patr = resultados.patrimonial || {};

    var nomeEmpresa = _extrairNomeEmpresa(dcf, mult, patr);

    // Resultados por método
    var resultadoPorMetodo = [];

    if (dcf && dcf.erro !== true) {
      resultadoPorMetodo.push({
        metodo: 'DCF (Fluxo de Caixa Descontado)',
        valorMinimo: formatarMoeda(validarNumero(dcf.valorMinimo)),
        valorMediano: formatarMoeda(validarNumero(dcf.equityValue)),
        valorMaximo: formatarMoeda(validarNumero(dcf.valorMaximo)),
        peso: _pctTexto(consolidado.pesos ? consolidado.pesos.dcf : PESOS_PADRAO.dcf),
        detalhes: dcf.detalhes || null
      });
    }

    if (mult && mult.erro !== true) {
      resultadoPorMetodo.push({
        metodo: 'Múltiplos de Mercado',
        valorMinimo: formatarMoeda(validarNumero(mult.valorMinimo)),
        valorMediano: formatarMoeda(validarNumero(mult.equityValue)),
        valorMaximo: formatarMoeda(validarNumero(mult.valorMaximo)),
        peso: _pctTexto(consolidado.pesos ? consolidado.pesos.multiplos : PESOS_PADRAO.multiplos),
        detalhes: mult.detalhes || null
      });
    }

    if (patr && patr.erro !== true) {
      resultadoPorMetodo.push({
        metodo: 'Valor Patrimonial Ajustado',
        valorMinimo: formatarMoeda(validarNumero(patr.valorMinimo)),
        valorMediano: formatarMoeda(validarNumero(patr.equityValue || patr.valorMediano)),
        valorMaximo: formatarMoeda(validarNumero(patr.valorMaximo)),
        peso: _pctTexto(consolidado.pesos ? consolidado.pesos.patrimonial : PESOS_PADRAO.patrimonial),
        detalhes: patr.detalhes || null
      });
    }

    return {
      titulo: 'Relatório de Precificação',
      data: hoje(),
      nomeEmpresa: nomeEmpresa,
      resumoExecutivo: consolidado.resumo || '',
      resultadoPorMetodo: resultadoPorMetodo,
      consolidado: {
        valorMinimo: formatarMoeda(validarNumero(consolidado.valorMinimo)),
        valorMediano: formatarMoeda(validarNumero(consolidado.valorMediano)),
        valorMaximo: formatarMoeda(validarNumero(consolidado.valorMaximo)),
        valorRecomendado: formatarMoeda(validarNumero(consolidado.valorRecomendado || consolidado.valorMediano)),
        faixaNegociacao: {
          minimo: formatarMoeda(validarNumero(consolidado.faixaNegociacao ? consolidado.faixaNegociacao.minimo : 0)),
          recomendado: formatarMoeda(validarNumero(consolidado.faixaNegociacao ? consolidado.faixaNegociacao.recomendado : 0)),
          maximo: formatarMoeda(validarNumero(consolidado.faixaNegociacao ? consolidado.faixaNegociacao.maximo : 0))
        },
        pesos: consolidado.pesos || {},
        tipoPerfil: consolidado.pesos ? consolidado.pesos.tipo : 'madura'
      },
      footballField: consolidado.footballField || null,
      waterfall: consolidado.waterfall || null,
      percentis: consolidado.percentis || null,
      alertas: (consolidado.alertas || []).map(function (a) {
        return {
          tipo: a.tipo,
          titulo: a.titulo,
          mensagem: a.mensagem
        };
      }),
      glossario: Core.GLOSSARIO,
      disclaimer: 'Este relatório é uma estimativa técnica simplificada e não substitui ' +
        'uma avaliação formal realizada por profissional habilitado (CVM, CORECON ou CRC). ' +
        'Os valores apresentados são baseados em projeções e premissas que podem não se concretizar. ' +
        'Recomenda-se consultar assessoria especializada antes de tomar decisões financeiras.'
    };
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // API PÚBLICA
  // ═══════════════════════════════════════════════════════════════════════════

  var API = {
    VERSION: '2.0.0',

    // Constantes
    PESOS_POR_TIPO: PESOS_POR_TIPO,
    PESOS_PADRAO: PESOS_PADRAO,

    // Funções principais
    consolidar: consolidar,
    sugerirPesos: sugerirPesos,
    gerarFootballField: gerarFootballField,
    gerarWaterfall: gerarWaterfall,
    calcularPercentis: calcularPercentis,
    gerarAlertasCruzados: gerarAlertasCruzados,
    gerarResumo: gerarResumo,
    gerarDadosPDF: gerarDadosPDF
  };

  // Registrar no Core
  if (Core && Core._registrarModulo) {
    Core._registrarModulo('Comparativo', API);
  }

  return API;
  })(API);


  // ╔═══════════════════════════════════════════════════════════════════════════╗
  // ║  API PÚBLICA UNIFICADA — Todos os módulos registrados em API via         ║
  // ║  _registrarModulo(). Acesso: API.DCF, API.Indicadores, etc.              ║
  // ╚═══════════════════════════════════════════════════════════════════════════╝

  return API;
});
