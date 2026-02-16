/**
 * ══════════════════════════════════════════════════════════════════════════════
 * MOTOR DE ANÁLISE E ESTUDO — LUCRO PRESUMIDO
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Camada intermediária entre o motor de cálculos (lucro_presumido.js) e o HTML.
 * Consome dados do LucroPresumido e entrega resultados prontos para renderização.
 *
 * Arquitetura:
 *   HTML (UI/render) → lucro-presumido-estudos.js (análise) → lucro_presumido.js (motor)
 *
 * Versão: 2.0.0
 * Data: Fevereiro/2026
 *
 * Dependência: lucro_presumido.js deve ser carregado ANTES deste arquivo.
 * Expõe: objeto global EstudoLP (window.EstudoLP / globalThis.EstudoLP)
 *
 * ══════════════════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────────────────
  // CONSTANTES INTERNAS (DEFAULTS E LIMITES)
  // ─────────────────────────────────────────────────────────────────────────

  var DEFAULTS = {
    atividadeId: 'servicos_gerais',
    aliquotaISS: 0.05,
    aliquotaRAT: 0.03,
    aliquotaTerceiros: 0.005,
    creditosPISCOFINS: 0,
    aliquotaSimples: 0.15,
    socios: [{ nome: 'Sócio Único', percentual: 1.0 }]
  };

  /** Limite anual para aplicação da LC 224/2025 */
  var LC224_LIMITE_ANUAL = 5000000;

  /** Alíquotas fixas do Lucro Real usadas na estimativa simplificada */
  var LR = {
    IRPJ: 0.15,
    ADICIONAL_IRPJ: 0.10,
    LIMITE_ADICIONAL_ANUAL: 240000,
    CSLL: 0.09,
    PIS_NAO_CUMULATIVO: 0.0165,
    COFINS_NAO_CUMULATIVO: 0.076,
    TOTAL_PIS_COFINS_NC: 0.0925,
    INSS_PATRONAL: 0.20
  };

  /** Alíquotas PIS/COFINS cumulativo (LP) */
  var PIS_COFINS_CUMULATIVO = 0.0365;

  /** Margem máxima para iteração do break-even */
  var MARGEM_MAXIMA = 95;

  // ─────────────────────────────────────────────────────────────────────────
  // FUNÇÕES AUXILIARES
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Arredonda valor monetário para N casas decimais.
   * @param {number} valor
   * @param {number} [casas=2]
   * @returns {number}
   */
  function _arredondar(valor, casas) {
    if (casas === undefined) casas = 2;
    if (typeof valor !== 'number' || isNaN(valor)) return 0;
    var fator = Math.pow(10, casas);
    return Math.round(valor * fator) / fator;
  }

  /**
   * Valida parâmetros obrigatórios e aplica defaults.
   * @param {Object} params - Parâmetros recebidos
   * @param {Array<string>} obrigatorios - Nomes dos campos obrigatórios
   * @param {string} nomeFuncao - Nome da função chamadora (para mensagens de erro)
   * @returns {Object} params com defaults aplicados
   * @throws {Error} Se LucroPresumido não estiver carregado ou faltar campo obrigatório
   */
  function _validarParams(params, obrigatorios, nomeFuncao) {
    if (typeof LucroPresumido === 'undefined') {
      throw new Error('Motor lucro_presumido.js não carregado. Carregue-o antes de lucro-presumido-estudos.js.');
    }
    if (!params || typeof params !== 'object') {
      throw new Error(nomeFuncao + ': params deve ser um objeto.');
    }
    if (obrigatorios && obrigatorios.length) {
      for (var i = 0; i < obrigatorios.length; i++) {
        var campo = obrigatorios[i];
        if (params[campo] === undefined || params[campo] === null) {
          throw new Error(nomeFuncao + ': campo obrigatório "' + campo + '" não informado.');
        }
      }
    }
    return params;
  }

  /**
   * Busca informações de uma atividade pelo ID via motor LucroPresumido.
   * @param {string} atividadeId - ID da atividade (ex: 'servicos_gerais')
   * @returns {Object|null} { id, descricao, percentualIRPJ, percentualCSLL, irpjMajorado, csllMajorada, ... } ou null
   */
  function _getAtividadeInfo(atividadeId) {
    try {
      var atividades = LucroPresumido.getAtividadesDisponiveis();
      for (var i = 0; i < atividades.length; i++) {
        if (atividades[i].id === atividadeId) {
          return atividades[i];
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FUNÇÃO 1: calcularBreakEven — Análise Break-Even LP vs Lucro Real
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Encontra o ponto de cruzamento onde o Lucro Real passa a ser mais
   * vantajoso que o Lucro Presumido.
   *
   * @param {Object} params
   * @param {number} params.receitaBrutaAnual
   * @param {number} params.cargaTributariaLP - carga total já calculada pelo anual consolidado
   * @param {number} params.folhaPagamentoAnual
   * @param {number} params.totalDespesasOperacionais
   * @param {number} params.creditosPISCOFINS - créditos estimados PIS/COFINS não-cumulativo
   * @param {number} params.aliquotaISS - decimal (ex: 0.05)
   * @param {number} params.aliquotaRAT - decimal (ex: 0.03)
   * @param {number} params.aliquotaTerceiros - decimal (ex: 0.005)
   *
   * @returns {Object} Resultado da análise break-even
   */
  function calcularBreakEven(params) {
    _validarParams(params, ['receitaBrutaAnual', 'cargaTributariaLP'], 'calcularBreakEven');

    var receita = params.receitaBrutaAnual;
    var cargaLP = _arredondar(params.cargaTributariaLP);
    var folha = params.folhaPagamentoAnual || 0;
    var despesasOp = params.totalDespesasOperacionais || 0;
    var creditos = params.creditosPISCOFINS || 0;
    var aliqISS = params.aliquotaISS != null ? params.aliquotaISS : DEFAULTS.aliquotaISS;
    var aliqRAT = params.aliquotaRAT != null ? params.aliquotaRAT : DEFAULTS.aliquotaRAT;
    var aliqTerceiros = params.aliquotaTerceiros != null ? params.aliquotaTerceiros : DEFAULTS.aliquotaTerceiros;

    // Proteção contra receita zero
    if (receita <= 0) {
      return {
        cargaTributariaLP: cargaLP,
        breakEvenMargem: null,
        lpSempreVantajoso: false,
        lrSempreVantajoso: false,
        margemRealAtual: null,
        margens: [],
        alerta: null,
        recomendacao: 'Receita bruta anual não informada. Impossível calcular break-even.',
        baseLegal: 'Comparação simplificada LP (base presumida) vs LR (IRPJ 15%+10%, CSLL 9%, PIS 1,65%, COFINS 7,6% não-cumulativo). RIR/2018; Lei 9.249/95, Art. 15; Lei 10.637/2002; Lei 10.833/2003. Para decisão definitiva, consulte seu contador.'
      };
    }

    // B. Para cada margem de 1% a 95%, calcular carga do Lucro Real
    var margens = [];
    var breakEvenMargem = null;
    var lpVantajosoCount = 0;
    var lrVantajosoCount = 0;

    for (var m = 1; m <= MARGEM_MAXIMA; m++) {
      var lucroTributavel = receita * (m / 100);

      var irpj = lucroTributavel * LR.IRPJ;
      var adicionalIRPJ = Math.max(0, lucroTributavel - LR.LIMITE_ADICIONAL_ANUAL) * LR.ADICIONAL_IRPJ;
      var csll = lucroTributavel * LR.CSLL;

      // PIS não-cumulativo: receita × 1,65% - créditos proporcionais
      var pisNC = Math.max(0, receita * LR.PIS_NAO_CUMULATIVO - creditos * (LR.PIS_NAO_CUMULATIVO / LR.TOTAL_PIS_COFINS_NC));
      // COFINS não-cumulativo: receita × 7,6% - créditos proporcionais
      var cofinsNC = Math.max(0, receita * LR.COFINS_NAO_CUMULATIVO - creditos * (LR.COFINS_NAO_CUMULATIVO / LR.TOTAL_PIS_COFINS_NC));

      var issLR = receita * aliqISS;
      var inssLR = folha * (LR.INSS_PATRONAL + aliqRAT + aliqTerceiros);

      var cargaLR = _arredondar(irpj + adicionalIRPJ + csll + pisNC + cofinsNC + issLR + inssLR);

      margens.push({
        margem: m,
        cargaLP: cargaLP,
        cargaLR: cargaLR
      });

      if (cargaLP < cargaLR) {
        lpVantajosoCount++;
      } else if (cargaLR < cargaLP) {
        lrVantajosoCount++;
      }

      // C. Detectar cruzamento: onde cargaLR cruza cargaLP
      if (breakEvenMargem === null && m > 1) {
        var anterior = margens[m - 2]; // margens[m-2] pois margens é 0-indexed
        // Cruzamento: anterior LR < LP e agora LR >= LP, ou vice-versa
        if ((anterior.cargaLR < anterior.cargaLP && cargaLR >= cargaLP) ||
            (anterior.cargaLR >= anterior.cargaLP && cargaLR < cargaLP)) {
          breakEvenMargem = m;
        }
      }
    }

    var totalMargens = MARGEM_MAXIMA;
    var lpSempreVantajoso = (lpVantajosoCount === totalMargens);
    var lrSempreVantajoso = (lrVantajosoCount === totalMargens);

    // D. Margem real atual
    var margemRealAtual = null;
    if (receita > 0 && (despesasOp > 0 || folha > 0)) {
      margemRealAtual = _arredondar((receita - despesasOp - folha) / receita * 100, 1);
    }

    // E. Alerta
    var alerta = null;
    if (margemRealAtual !== null && breakEvenMargem !== null) {
      var distancia = Math.abs(margemRealAtual - breakEvenMargem);
      if (margemRealAtual < breakEvenMargem) {
        alerta = 'Sua margem real está ABAIXO do break-even. O Lucro Real pode ser mais vantajoso.';
      } else if (distancia < 5) {
        alerta = 'Sua margem real está próxima do break-even. Reavalie anualmente.';
      }
    }

    // F. Recomendação
    var recomendacao = '';
    if (lpSempreVantajoso) {
      recomendacao = 'O Lucro Presumido é mais vantajoso em TODAS as margens de lucro simuladas. Mantenha o LP.';
    } else if (lrSempreVantajoso) {
      recomendacao = 'O Lucro Real é mais vantajoso em TODAS as margens simuladas. Considere migrar para LR.';
    } else if (margemRealAtual !== null && breakEvenMargem !== null) {
      if (margemRealAtual >= breakEvenMargem) {
        recomendacao = 'Sua margem real estimada (' + margemRealAtual + '%) está ACIMA do break-even (' + breakEvenMargem + '%). O Lucro Presumido é favorável.';
      } else {
        recomendacao = 'Sua margem real estimada (' + margemRealAtual + '%) está ABAIXO do break-even (' + breakEvenMargem + '%). Avalie o Lucro Real.';
      }
    } else if (breakEvenMargem !== null) {
      recomendacao = 'O break-even entre LP e LR ocorre na margem de ' + breakEvenMargem + '%. Abaixo: LR é melhor. Acima: LP é melhor.';
    } else {
      recomendacao = 'Não foi possível determinar o break-even. Consulte seu contador para análise detalhada.';
    }

    return {
      cargaTributariaLP: cargaLP,
      breakEvenMargem: breakEvenMargem,
      lpSempreVantajoso: lpSempreVantajoso,
      lrSempreVantajoso: lrSempreVantajoso,
      margemRealAtual: margemRealAtual,
      margens: margens,
      alerta: alerta,
      recomendacao: recomendacao,
      baseLegal: 'Comparação simplificada LP (base presumida) vs LR (IRPJ 15%+10%, CSLL 9%, PIS 1,65%, COFINS 7,6% não-cumulativo). RIR/2018; Lei 9.249/95, Art. 15; Lei 10.637/2002; Lei 10.833/2003. Para decisão definitiva, consulte seu contador.'
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FUNÇÃO 2: gerarDicasInteligentes — Motor de Recomendações
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Gera array de dicas contextuais baseadas na situação específica da empresa.
   *
   * @param {Object} params
   * @param {number} params.receitaBrutaAnual
   * @param {string} params.atividadeId
   * @param {number} params.folhaPagamentoAnual
   * @param {number} params.totalDespesasOperacionais
   * @param {number} params.creditosPISCOFINS
   * @param {boolean} params.temEscrituracao
   * @param {boolean} params.temEquipamentos
   * @param {boolean} params.temPD
   * @param {boolean} params.receitaSazonal
   * @param {boolean} params.areaAtuacaoSUDAM
   * @param {number} params.numReceitas - quantidade de atividades/receitas distintas
   * @param {Object|null} params.breakeven - resultado do calcularBreakEven
   *
   * @returns {Array<{ titulo: string, descricao: string, tipo: string, impactoEstimado: number|null }>}
   */
  function gerarDicasInteligentes(params) {
    _validarParams(params, ['receitaBrutaAnual'], 'gerarDicasInteligentes');

    var receita = params.receitaBrutaAnual;
    var atividadeId = params.atividadeId || DEFAULTS.atividadeId;
    var folha = params.folhaPagamentoAnual || 0;
    var despesasOp = params.totalDespesasOperacionais || 0;
    var creditos = params.creditosPISCOFINS || 0;
    var temEscrituracao = !!params.temEscrituracao;
    var temEquipamentos = !!params.temEquipamentos;
    var temPD = !!params.temPD;
    var areaAtuacaoSUDAM = !!params.areaAtuacaoSUDAM;
    var numReceitas = params.numReceitas || 1;
    var breakeven = params.breakeven || null;

    var dicas = [];

    // Buscar atividade
    var atividade = _getAtividadeInfo(atividadeId);
    var percentualPresuncao = atividade ? atividade.percentualIRPJ : 0.32;

    // Margem real
    var margemReal = receita > 0 ? (receita - despesasOp - folha) / receita : 0;

    // ── Dica 1: Margem vs Presunção ──
    if (receita > 0 && (despesasOp > 0 || folha > 0)) {
      if (margemReal > percentualPresuncao) {
        var diferencaBase = receita * (margemReal - percentualPresuncao);
        var impactoEconomia = _arredondar(diferencaBase * 0.24); // 15% IRPJ + 9% CSLL
        dicas.push({
          titulo: 'Margem real acima da presunção — LP é vantajoso',
          descricao: 'Sua margem real (' + _arredondar(margemReal * 100, 1) + '%) é superior ao percentual de presunção (' + _arredondar(percentualPresuncao * 100, 1) + '%). No Lucro Presumido, você tributa sobre uma base menor que o lucro efetivo. Economia estimada de R$ ' + impactoEconomia.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '/ano em IRPJ+CSLL.',
          tipo: 'economia',
          impactoEstimado: impactoEconomia
        });
      } else {
        var diferencaBaseAlerta = receita * (percentualPresuncao - margemReal);
        var impactoExcesso = _arredondar(diferencaBaseAlerta * 0.24);
        dicas.push({
          titulo: 'Margem real abaixo da presunção — Atenção',
          descricao: 'Sua margem real (' + _arredondar(margemReal * 100, 1) + '%) é inferior ao percentual de presunção (' + _arredondar(percentualPresuncao * 100, 1) + '%). No LP, você tributa sobre base maior que o lucro efetivo. Custo extra estimado: R$ ' + impactoExcesso.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '/ano. Foque em aumentar margem ou avalie o Lucro Real.',
          tipo: 'alerta',
          impactoEstimado: impactoExcesso
        });
      }
    }

    // ── Dica 2: Área SUDAM ──
    if (areaAtuacaoSUDAM) {
      var irpjEstimadoAnual = receita * percentualPresuncao * 0.15;
      var economiaIRPJ75 = _arredondar(irpjEstimadoAnual * 0.75);
      dicas.push({
        titulo: 'Incentivo SUDAM/SUDENE — Redução de 75% no IRPJ (Lucro Real)',
        descricao: 'Empresas em área SUDAM/SUDENE podem obter redução de 75% do IRPJ no Lucro Real (Lei 12.715/2012, Art. 1º). Economia potencial estimada: R$ ' + economiaIRPJ75.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '/ano. Avalie se o benefício compensa a complexidade do LR.',
        tipo: 'economia',
        impactoEstimado: economiaIRPJ75
      });
    }

    // ── Dica 3: Regime de Caixa ──
    dicas.push({
      titulo: 'Regime de Caixa disponível no Lucro Presumido',
      descricao: 'O LP permite optar pelo regime de caixa para reconhecimento de receitas (IN RFB 1.700/2017, Art. 223). O imposto é pago somente quando o cliente efetivamente paga. Benefício especial para empresas com alta inadimplência ou prazos longos de recebimento.',
      tipo: 'info',
      impactoEstimado: null
    });

    // ── Dica 4: Atividades Mistas ──
    if (numReceitas > 1) {
      dicas.push({
        titulo: 'Atividades mistas — Classificação correta é essencial',
        descricao: 'Sua empresa possui ' + numReceitas + ' atividades/receitas distintas. Cada receita deve ser classificada no percentual de presunção correto (Lei 9.249/95, Art. 15). Classificação incorreta pode gerar autuação fiscal com multa de 75% + juros SELIC.',
        tipo: 'alerta',
        impactoEstimado: null
      });
    }

    // ── Dica 5: PIS/COFINS Cumulativo vs Não-Cumulativo ──
    if (creditos > 0) {
      var cumulativo = _arredondar(receita * PIS_COFINS_CUMULATIVO);
      var naoCumulativo = _arredondar(receita * LR.TOTAL_PIS_COFINS_NC - creditos);
      if (naoCumulativo < cumulativo) {
        var economiaPISCOFINS = _arredondar(cumulativo - naoCumulativo);
        dicas.push({
          titulo: 'PIS/COFINS — Não-cumulativo pode ser mais vantajoso',
          descricao: 'Com seus créditos de R$ ' + creditos.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + ', o PIS/COFINS não-cumulativo (Lucro Real) custaria R$ ' + naoCumulativo.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + ' vs R$ ' + cumulativo.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + ' no cumulativo (LP). Economia potencial: R$ ' + economiaPISCOFINS.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '/ano.',
          tipo: 'economia',
          impactoEstimado: economiaPISCOFINS
        });
      }
    }

    // ── Dica 6: Adicional IRPJ ──
    if (receita > 0 && atividade) {
      var basePresumidaAnual = receita * percentualPresuncao;
      if (basePresumidaAnual > 240000) {
        var adicionalEstimado = _arredondar((basePresumidaAnual - 240000) * 0.10);
        dicas.push({
          titulo: 'Adicional de IRPJ de 10% incide sobre sua empresa',
          descricao: 'Base presumida anual estimada de R$ ' + basePresumidaAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + ' excede o limite de R$ 240.000 (R$ 60.000/trimestre). Adicional de 10% sobre o excedente: R$ ' + adicionalEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '/ano (RIR/2018, Art. 624).',
          tipo: 'alerta',
          impactoEstimado: adicionalEstimado
        });
      }
    }

    // ── Dica 7: Reforma Tributária 2026-2033 ──
    dicas.push({
      titulo: 'Reforma Tributária — CBS e IBS (2026-2033)',
      descricao: 'A Reforma Tributária (EC 132/2023) inicia a transição em 2026: CBS (federal) substituirá PIS/COFINS e IBS (estadual/municipal) substituirá ICMS/ISS. A transição é gradual até 2033. Impacto no LP: PIS/COFINS cumulativo será gradualmente substituído pela CBS. Acompanhe a regulamentação (LC 214/2025) e planeje a adaptação.',
      tipo: 'info',
      impactoEstimado: null
    });

    // ── Dica 8: Escrituração Contábil ──
    if (!temEscrituracao) {
      dicas.push({
        titulo: 'Escrituração completa amplia distribuição de lucros',
        descricao: 'Sem escrituração contábil completa (ECD), a distribuição isenta de lucros fica limitada à base presumida menos impostos (IN RFB 1.700/2017, Art. 238). Com ECD, pode distribuir o lucro contábil efetivo (se maior). Investimento em ECD pode gerar retorno significativo.',
        tipo: 'acao',
        impactoEstimado: null
      });
    }

    // ── Dica 9: Break-Even próximo ──
    if (breakeven && breakeven.alerta) {
      dicas.push({
        titulo: 'Break-even LP vs LR requer atenção',
        descricao: breakeven.alerta + ' ' + breakeven.recomendacao + ' Reavalie o regime tributário anualmente com base em dados atualizados.',
        tipo: 'alerta',
        impactoEstimado: null
      });
    }

    // ── Dica 10: Investimentos/P&D ──
    if (temEquipamentos || temPD) {
      var descricaoPD = [];
      if (temEquipamentos) {
        descricaoPD.push('depreciação acelerada de equipamentos (Lei 11.196/2005, Art. 17)');
      }
      if (temPD) {
        descricaoPD.push('incentivos da Lei do Bem para P&D (Lei 11.196/2005, Cap. III)');
      }
      dicas.push({
        titulo: 'Investimentos/P&D — Benefícios exclusivos do Lucro Real',
        descricao: 'Sua empresa possui investimentos que podem gerar benefícios tributários no Lucro Real: ' + descricaoPD.join('; ') + '. Esses incentivos NÃO estão disponíveis no Lucro Presumido. Avalie se o volume de investimentos justifica a migração.',
        tipo: 'economia',
        impactoEstimado: null
      });
    }

    // ── Ordenar: alertas → economia → ação → info ──
    var ordemTipo = { alerta: 0, economia: 1, acao: 2, info: 3 };
    dicas.sort(function (a, b) {
      var oa = ordemTipo[a.tipo] !== undefined ? ordemTipo[a.tipo] : 9;
      var ob = ordemTipo[b.tipo] !== undefined ? ordemTipo[b.tipo] : 9;
      return oa - ob;
    });

    return dicas;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FUNÇÃO 3: calcularImpactoLC224 — Wrapper LC 224/2025
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Calcula o impacto anual da LC 224/2025 (receita > R$ 5M).
   *
   * @param {Object} params
   * @param {number} params.receitaBrutaAnual
   * @param {string} params.atividadeId
   * @param {number} [params.anoCalendario=2026]
   *
   * @returns {Object|null} null se receita <= 5M ou LC 224 não aplicável
   */
  function calcularImpactoLC224(params) {
    _validarParams(params, ['receitaBrutaAnual'], 'calcularImpactoLC224');

    var receita = params.receitaBrutaAnual;
    var atividadeId = params.atividadeId || DEFAULTS.atividadeId;
    var anoCalendario = params.anoCalendario || 2026;

    // Se receita <= 5M, LC 224 não se aplica
    if (receita <= LC224_LIMITE_ANUAL) {
      return null;
    }

    // Buscar percentual de presunção da atividade
    var atividade = _getAtividadeInfo(atividadeId);
    if (!atividade) {
      return null;
    }

    var percentualPresuncao = atividade.percentualIRPJ;
    var receitaTrimestral = receita / 4;
    var trimestres = [];
    var impactoTotalBase = 0;

    for (var q = 1; q <= 4; q++) {
      var receitaAcumulada = receitaTrimestral * q;

      try {
        var resultadoLC224 = LucroPresumido.calcularBasePresumidaLC224({
          receitaBrutaTrimestral: receitaTrimestral,
          receitaBrutaAcumuladaAnoAte: receitaAcumulada,
          percentualPresuncaoOriginal: percentualPresuncao,
          trimestreAtual: q,
          anoCalendario: anoCalendario
        });

        var baseSemLC224 = receitaTrimestral * percentualPresuncao;
        var baseComLC224 = resultadoLC224.basePresumida;
        var impacto = _arredondar(baseComLC224 - baseSemLC224);

        trimestres.push({
          trimestre: q,
          baseSemLC224: _arredondar(baseSemLC224),
          baseComLC224: _arredondar(baseComLC224),
          impacto: impacto
        });

        impactoTotalBase += impacto;
      } catch (e) {
        trimestres.push({
          trimestre: q,
          baseSemLC224: _arredondar(receitaTrimestral * percentualPresuncao),
          baseComLC224: _arredondar(receitaTrimestral * percentualPresuncao),
          impacto: 0
        });
      }
    }

    impactoTotalBase = _arredondar(impactoTotalBase);
    var impostoExtraEstimado = _arredondar(impactoTotalBase * 0.24); // 15% IRPJ + 9% CSLL

    // Se não houve impacto (todos trimestres sem aplicação), retornar null
    if (impactoTotalBase === 0) {
      return null;
    }

    var alertaMsg = 'A LC 224/2025 aumenta a base presumida em R$ ' +
      impactoTotalBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) +
      '/ano, gerando imposto extra estimado de R$ ' +
      impostoExtraEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) +
      '. Vigência a partir de 01/04/2026 (2º trimestre). Receitas até R$ 5M/ano permanecem sem acréscimo.';

    return {
      aplicavel: true,
      receitaBrutaAnual: receita,
      trimestres: trimestres,
      impactoTotalBase: impactoTotalBase,
      impostoExtraEstimado: impostoExtraEstimado,
      baseLegal: 'LC 224/2025, Art. 14. Vigência a partir de 01/04/2026.',
      alerta: alertaMsg
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FUNÇÃO 4: calcularEconomiaPotencial — Resumo de Economias
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Consolida todas as oportunidades de economia identificadas.
   *
   * @param {Object} params
   * @param {Object|null} params.proLabore - resultado do LucroPresumido.simularProLaboreOtimo()
   * @param {Object|null} params.ecd - resultado do LucroPresumido.calcularBeneficioECD()
   * @param {Object|null} params.caixaComp - resultado do LucroPresumido.simularRegimeCaixa()
   * @param {Object|null} params.breakeven - resultado do calcularBreakEven()
   * @param {Array} params.dicas - resultado do gerarDicasInteligentes()
   *
   * @returns {Object} Resumo consolidado de economias
   */
  function calcularEconomiaPotencial(params) {
    _validarParams(params, [], 'calcularEconomiaPotencial');

    var proLabore = params.proLabore || null;
    var ecd = params.ecd || null;
    var caixaComp = params.caixaComp || null;
    var breakeven = params.breakeven || null;
    var dicas = params.dicas || [];

    var totalEconomiaAnual = 0;
    var totalDiferimento = 0;
    var fontes = [];

    // 1. Pró-labore ótimo
    if (proLabore && typeof proLabore.economiaAnual === 'number' && proLabore.economiaAnual > 0) {
      var valPL = _arredondar(proLabore.economiaAnual);
      totalEconomiaAnual += valPL;
      fontes.push({
        fonte: 'Otimização Pró-Labore',
        valor: valPL,
        tipo: 'economia',
        descricao: 'Ajuste do pró-labore para o ponto ótimo tributário.' + (proLabore.recomendacao ? ' ' + proLabore.recomendacao : '')
      });
    }

    // 2. ECD (Escrituração Contábil Digital)
    if (ecd && ecd.valeAPena && typeof ecd.beneficioLiquido === 'number' && ecd.beneficioLiquido > 0) {
      var valECD = _arredondar(ecd.beneficioLiquido);
      totalEconomiaAnual += valECD;
      fontes.push({
        fonte: 'Escrituração Contábil (ECD)',
        valor: valECD,
        tipo: 'economia',
        descricao: 'Ampliação da distribuição isenta de lucros via escrituração contábil completa.'
      });
    }

    // 3. Regime Caixa (diferimento, não economia real)
    if (caixaComp && typeof caixaComp.totalDiferido === 'number' && caixaComp.totalDiferido > 0) {
      var valCaixa = _arredondar(caixaComp.totalDiferido);
      totalDiferimento += valCaixa;
      fontes.push({
        fonte: 'Regime de Caixa',
        valor: valCaixa,
        tipo: 'diferimento',
        descricao: 'Diferimento de tributos pela adoção do regime de caixa. Não é economia definitiva — tributo é postergado.'
      });
    }

    // 4. Break-even: se LR for melhor na margem real, calcular diferença
    if (breakeven && breakeven.margemRealAtual !== null && breakeven.breakEvenMargem !== null &&
        breakeven.margemRealAtual < breakeven.breakEvenMargem && breakeven.margens && breakeven.margens.length > 0) {
      var margemIdx = Math.max(0, Math.min(Math.round(breakeven.margemRealAtual) - 1, breakeven.margens.length - 1));
      var entradaMargem = breakeven.margens[margemIdx];
      if (entradaMargem) {
        var diffLR = _arredondar(breakeven.cargaTributariaLP - entradaMargem.cargaLR);
        if (diffLR > 0) {
          totalEconomiaAnual += diffLR;
          fontes.push({
            fonte: 'Migração para Lucro Real',
            valor: diffLR,
            tipo: 'economia',
            descricao: 'Economia estimada se migrar para Lucro Real, considerando margem real atual de ' + breakeven.margemRealAtual + '%.'
          });
        }
      }
    }

    // 5. Dicas do tipo 'economia' com impactoEstimado > 0
    for (var d = 0; d < dicas.length; d++) {
      if (dicas[d].tipo === 'economia' && dicas[d].impactoEstimado && dicas[d].impactoEstimado > 0) {
        var jaDuplicado = false;
        for (var f = 0; f < fontes.length; f++) {
          if (fontes[f].fonte === dicas[d].titulo) {
            jaDuplicado = true;
            break;
          }
        }
        if (!jaDuplicado) {
          var valDica = _arredondar(dicas[d].impactoEstimado);
          totalEconomiaAnual += valDica;
          fontes.push({
            fonte: dicas[d].titulo,
            valor: valDica,
            tipo: 'economia',
            descricao: dicas[d].descricao
          });
        }
      }
    }

    totalEconomiaAnual = _arredondar(totalEconomiaAnual);
    totalDiferimento = _arredondar(totalDiferimento);

    // Recomendação principal
    var recomendacaoPrincipal = '';
    var fontesEconomia = [];
    for (var fe = 0; fe < fontes.length; fe++) {
      if (fontes[fe].tipo === 'economia') fontesEconomia.push(fontes[fe]);
    }
    if (fontes.length === 0) {
      recomendacaoPrincipal = 'Nenhuma oportunidade de economia significativa identificada com os dados informados.';
    } else if (totalEconomiaAnual > 0) {
      recomendacaoPrincipal = 'Economia potencial de R$ ' + totalEconomiaAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '/ano identificada em ' + fontesEconomia.length + ' fonte(s). Priorize as ações recomendadas.';
    } else if (totalDiferimento > 0) {
      recomendacaoPrincipal = 'Diferimento tributário de R$ ' + totalDiferimento.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + ' possível via regime de caixa.';
    }

    // Nível de oportunidade: alto > 15%, médio 5-15%, baixo < 5%
    var cargaTotal = breakeven ? breakeven.cargaTributariaLP : 0;
    var nivelOportunidade = 'baixo';
    if (cargaTotal > 0) {
      var percentEconomia = totalEconomiaAnual / cargaTotal;
      if (percentEconomia > 0.15) {
        nivelOportunidade = 'alto';
      } else if (percentEconomia >= 0.05) {
        nivelOportunidade = 'medio';
      }
    } else if (totalEconomiaAnual > 0) {
      nivelOportunidade = 'medio';
    }

    return {
      totalEconomiaAnual: totalEconomiaAnual,
      totalDiferimento: totalDiferimento,
      fontes: fontes,
      recomendacaoPrincipal: recomendacaoPrincipal,
      nivelOportunidade: nivelOportunidade
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FUNÇÃO 5: gerarResumoExecutivo — Síntese para PDF/Sidebar
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Gera um objeto com todos os KPIs e textos prontos para exibição.
   *
   * @param {Object} params
   * @param {Object} params.anual - resultado calcularAnualConsolidado
   * @param {Object} params.breakeven - resultado calcularBreakEven
   * @param {Object} params.economia - resultado calcularEconomiaPotencial
   * @param {Array}  params.dicas - resultado gerarDicasInteligentes
   * @param {string} params.razaoSocial
   * @param {string} params.cnpj
   * @param {string} params.atividadeId
   *
   * @returns {Object} Resumo executivo com KPIs prontos para renderização
   */
  function gerarResumoExecutivo(params) {
    _validarParams(params, ['anual', 'breakeven', 'economia'], 'gerarResumoExecutivo');

    var anual = params.anual;
    var breakeven = params.breakeven;
    var economia = params.economia;
    var dicas = params.dicas || [];
    var razaoSocial = params.razaoSocial || '';
    var cnpj = params.cnpj || '';
    var atividadeId = params.atividadeId || DEFAULTS.atividadeId;

    // Buscar informações da atividade
    var atividade = _getAtividadeInfo(atividadeId);
    var descricaoAtividade = atividade ? atividade.descricao : atividadeId;
    var percentualPresuncao = atividade ? _arredondar(atividade.percentualIRPJ * 100, 1) + '%' : 'N/A';

    // KPIs do anual consolidado
    var receitaBrutaAnual = anual.receitaBrutaAnual || 0;
    var cargaTotal = anual.consolidacao ? anual.consolidacao.cargaTributariaTotal : 0;
    var percentCarga = anual.consolidacao ? anual.consolidacao.percentualCargaTributaria : '0%';
    var lucroDistribuivel = anual.distribuicaoLucros ? anual.distribuicaoLucros.lucroDistribuivelFinal : 0;

    // Break-even
    var breakEvenMargem = breakeven.breakEvenMargem !== null && breakeven.breakEvenMargem !== undefined
      ? breakeven.breakEvenMargem + '%' : null;
    var margemReal = breakeven.margemRealAtual !== null && breakeven.margemRealAtual !== undefined
      ? breakeven.margemRealAtual + '%' : null;

    // Top 3 dicas (já ordenadas por prioridade)
    var top3 = [];
    for (var d = 0; d < Math.min(3, dicas.length); d++) {
      top3.push(dicas[d].titulo);
    }

    // Regime recomendado
    var regimeRecomendado = 'Avaliar com contador';
    if (breakeven.lpSempreVantajoso) {
      regimeRecomendado = 'Lucro Presumido';
    } else if (breakeven.lrSempreVantajoso) {
      regimeRecomendado = 'Lucro Real';
    } else if (breakeven.margemRealAtual !== null && breakeven.margemRealAtual !== undefined &&
               breakeven.breakEvenMargem !== null && breakeven.breakEvenMargem !== undefined) {
      if (breakeven.margemRealAtual > breakeven.breakEvenMargem + 10) {
        regimeRecomendado = 'Lucro Presumido';
      } else if (breakeven.margemRealAtual < breakeven.breakEvenMargem - 10) {
        regimeRecomendado = 'Lucro Real';
      }
    }

    // Data formatada pt-BR
    var agora = new Date();
    var dia = ('0' + agora.getDate()).slice(-2);
    var mes = ('0' + (agora.getMonth() + 1)).slice(-2);
    var ano = agora.getFullYear();
    var dataFormatada = dia + '/' + mes + '/' + ano;

    // Ações de economia rankeadas por valor
    var acoesEconomia = [];
    if (economia.fontes && economia.fontes.length > 0) {
      var fontesOrdenadas = economia.fontes.slice().sort(function(a, b) {
        return (b.valor || 0) - (a.valor || 0);
      });
      for (var ae = 0; ae < Math.min(5, fontesOrdenadas.length); ae++) {
        acoesEconomia.push({
          acao: fontesOrdenadas[ae].fonte,
          valor: fontesOrdenadas[ae].valor,
          tipo: fontesOrdenadas[ae].tipo
        });
      }
    }

    return {
      empresa: razaoSocial,
      cnpj: cnpj,
      atividade: descricaoAtividade,
      percentualPresuncao: percentualPresuncao,
      receitaBrutaAnual: receitaBrutaAnual,
      cargaTributariaTotal: cargaTotal,
      percentualCargaTributaria: percentCarga,
      lucroDistribuivelIsento: lucroDistribuivel,
      breakEvenMargem: breakEvenMargem,
      margemRealAtual: margemReal,
      economiaPotencial: economia.totalEconomiaAnual,
      nivelOportunidade: economia.nivelOportunidade,
      recomendacaoPrincipal: economia.recomendacaoPrincipal,
      top3Dicas: top3,
      acoesEconomia: acoesEconomia,
      regimeRecomendado: regimeRecomendado,
      dataEstudo: dataFormatada
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FUNÇÃO 6: calcularEstudoCompleto — Orquestrador Principal
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Recebe todos os dados do formulário e executa TODOS os cálculos de uma
   * vez. O HTML chama esta função quando o usuário avança para Resultados.
   *
   * @param {Object} params
   * @param {Array}  params.receitas - [{ atividadeId: string, valor: number }]
   * @param {number} params.receitaBrutaAnual
   * @param {string} params.atividadeId - atividade principal (default 'servicos_gerais')
   * @param {number} params.folhaPagamentoAnual
   * @param {number} params.totalDespesasOperacionais
   * @param {number} params.aliquotaISS - em percentual (ex: 5 = 5%)
   * @param {number} params.aliquotaRAT - em percentual (ex: 3 = 3%)
   * @param {number} params.aliquotaTerceiros - em percentual (ex: 0.5 = 0.5%)
   * @param {number} params.creditosPISCOFINS
   * @param {number} params.aliquotaSimples - em percentual
   * @param {number} params.lucroContabil
   * @param {number} params.prejuizosFiscais
   * @param {boolean} params.temEscrituracao
   * @param {boolean} params.temEquipamentos
   * @param {boolean} params.temPD
   * @param {boolean} params.receitaSazonal
   * @param {boolean} params.areaAtuacaoSUDAM
   * @param {number} params.devolucoes
   * @param {number} params.cancelamentos
   * @param {number} params.descontos
   * @param {number} params.ganhosCapital
   * @param {number} params.rendFinanceiros
   * @param {number} params.jcpRecebido
   * @param {number} params.multasContratuais
   * @param {number} params.recFinDiversas
   * @param {number} params.valoresRecuperados
   * @param {number} params.demaisReceitas
   * @param {number} params.irrfRetido
   * @param {number} params.csllRetida
   * @param {number} params.pisRetido
   * @param {number} params.cofinsRetida
   * @param {Array}  params.socios - [{ nome: string, percentual: number (0-1) }]
   * @param {boolean} params.elegivelSimples
   * @param {string} params.razaoSocial
   * @param {string} params.cnpj
   *
   * // ── Pró-Labore (para simularProLaboreOtimo) ──
   * @param {Array} [params.sociosDetalhados] - [{nome, participacao, isAdministrador, proLaboreAtual, temOutroVinculoCLT, dependentesIRPF}]
   *
   * // ── JCP (para simularJCP) ──
   * @param {number} [params.patrimonioLiquido] - PL da empresa
   * @param {number} [params.taxaTJLP] - Taxa TJLP vigente (decimal, ex: 0.0612)
   * @param {number} [params.lucroLiquidoOuReservas] - Lucro líquido ou lucros acumulados
   *
   * // ── Regime de Caixa (para simularRegimeCaixa) ──
   * @param {number[]} [params.faturamentoMensal] - Array de 12 valores faturados (R$)
   * @param {number[]} [params.recebimentoMensal] - Array de 12 valores recebidos (R$)
   *
   * // ── ECD (para calcularBeneficioECD) ──
   * @param {number} [params.custoAnualECD] - Custo anual do contador pela escrituração completa
   *
   * @returns {Object} Resultado completo com todas as análises
   */
  function calcularEstudoCompleto(params) {
    _validarParams(params, ['receitaBrutaAnual'], 'calcularEstudoCompleto');

    var receitaBrutaAnual = params.receitaBrutaAnual;
    var atividadeId = params.atividadeId || DEFAULTS.atividadeId;
    var receitas = params.receitas || [{ atividadeId: atividadeId, valor: receitaBrutaAnual }];
    var folha = params.folhaPagamentoAnual || 0;
    var despesasOp = params.totalDespesasOperacionais || 0;

    // Converter percentuais para decimais
    var aliqISS = params.aliquotaISS != null ? params.aliquotaISS / 100 : DEFAULTS.aliquotaISS;
    var aliqRAT = params.aliquotaRAT != null ? params.aliquotaRAT / 100 : DEFAULTS.aliquotaRAT;
    var aliqTerceiros = params.aliquotaTerceiros != null ? params.aliquotaTerceiros / 100 : DEFAULTS.aliquotaTerceiros;

    var creditos = params.creditosPISCOFINS || 0;
    var lucroContabil = params.lucroContabil || 0;
    var socios = params.socios || DEFAULTS.socios;

    // Valores anuais a dividir por 4 (trimestral) ou 12 (mensal)
    var devolucoes = params.devolucoes || 0;
    var cancelamentos = params.cancelamentos || 0;
    var descontos = params.descontos || 0;
    var ganhosCapital = params.ganhosCapital || 0;
    var rendFinanceiros = params.rendFinanceiros || 0;
    var jcpRecebido = params.jcpRecebido || 0;
    var multasContratuais = params.multasContratuais || 0;
    var recFinDiversas = params.recFinDiversas || 0;
    var valoresRecuperados = params.valoresRecuperados || 0;
    var demaisReceitas = params.demaisReceitas || 0;
    var irrfRetido = params.irrfRetido || 0;
    var csllRetida = params.csllRetida || 0;
    var pisRetido = params.pisRetido || 0;
    var cofinsRetida = params.cofinsRetida || 0;

    // ── 1. Simulação rápida ──
    var simulacao = null;
    try {
      simulacao = LucroPresumido.simulacaoRapida(receitaBrutaAnual / 4, atividadeId);
    } catch (e) {
      simulacao = { erro: e.message };
    }

    // ── 2. Quatro trimestres ──
    var trimestral = [];
    var trimestresData = [];
    for (var q = 1; q <= 4; q++) {
      var dadosTri = {
        receitas: receitas.map(function (r) {
          return { atividadeId: r.atividadeId, valor: _arredondar(r.valor / 4) };
        }),
        devolucoes: _arredondar(devolucoes / 4),
        cancelamentos: _arredondar(cancelamentos / 4),
        descontosIncondicionais: _arredondar(descontos / 4),
        ganhosCapital: _arredondar(ganhosCapital / 4),
        rendimentosFinanceiros: _arredondar(rendFinanceiros / 4),
        jcpRecebidos: _arredondar(jcpRecebido / 4),
        multasContratuais: _arredondar(multasContratuais / 4),
        receitasFinanceirasDiversas: _arredondar(recFinDiversas / 4),
        valoresRecuperados: _arredondar(valoresRecuperados / 4),
        demaisReceitas: _arredondar(demaisReceitas / 4),
        irrfRetidoFonte: _arredondar(irrfRetido / 4),
        csllRetidaFonte: _arredondar(csllRetida / 4),
        trimestreAtual: q,
        anoCalendario: 2026,
        receitaBrutaAcumuladaAnoAte: _arredondar(receitaBrutaAnual / 4 * q)
      };
      trimestresData.push(dadosTri);
      try {
        trimestral.push(LucroPresumido.calcularLucroPresumidoTrimestral(dadosTri));
      } catch (e) {
        trimestral.push({ erro: e.message, trimestre: q });
      }
    }

    // ── 3. Doze meses PIS/COFINS ──
    var piscofins = [];
    var mesesData = [];
    var receitaMensal = _arredondar(receitaBrutaAnual / 12);
    for (var m = 0; m < 12; m++) {
      var dadosMes = {
        receitaBrutaMensal: receitaMensal,
        pisRetidoFonte: _arredondar(pisRetido / 12),
        cofinsRetidaFonte: _arredondar(cofinsRetida / 12)
      };
      mesesData.push(dadosMes);
      try {
        piscofins.push(LucroPresumido.calcularPISCOFINSMensal(dadosMes));
      } catch (e) {
        piscofins.push({ erro: e.message, mes: m + 1 });
      }
    }

    // ── 4. Anual consolidado ──
    var anual = null;
    try {
      anual = LucroPresumido.calcularAnualConsolidado({
        trimestres: trimestresData,
        meses: mesesData,
        aliquotaISS: aliqISS,
        folhaPagamentoAnual: folha,
        aliquotaRAT: aliqRAT,
        aliquotaTerceiros: aliqTerceiros,
        lucroContabilEfetivo: lucroContabil > 0 ? lucroContabil : null,
        socios: socios,
        anoCalendario: 2026
      });
    } catch (e) {
      anual = { erro: e.message, receitaBrutaAnual: receitaBrutaAnual, consolidacao: null, distribuicaoLucros: null };
    }

    // ── 4A. Pró-labore ótimo (por sócio) ──
    var resultProLabore = [];
    if (params.sociosDetalhados && params.sociosDetalhados.length > 0) {
      var lucroDistribuivel = (anual && anual.distribuicaoLucros)
        ? anual.distribuicaoLucros.lucroDistribuivelFinal
        : 0;

      for (var s = 0; s < params.sociosDetalhados.length; s++) {
        try {
          var simPL = LucroPresumido.simularProLaboreOtimo(
            params.sociosDetalhados[s],
            lucroDistribuivel
          );
          resultProLabore.push(simPL);
        } catch (e) {
          resultProLabore.push({ erro: e.message, socio: params.sociosDetalhados[s].nome });
        }
      }
    }

    var proLaboreConsolidado = null;
    var economiaProLaboreTotal = 0;
    for (var p = 0; p < resultProLabore.length; p++) {
      if (resultProLabore[p].economiaAnual) {
        economiaProLaboreTotal += resultProLabore[p].economiaAnual;
      }
    }
    if (economiaProLaboreTotal > 0) {
      proLaboreConsolidado = {
        economiaAnual: economiaProLaboreTotal,
        recomendacao: resultProLabore.length === 1
          ? resultProLabore[0].recomendacao
          : 'Otimização do pró-labore de ' + resultProLabore.length + ' sócios.'
      };
    }

    // ── 4B. JCP ──
    var resultJCP = null;
    if (params.patrimonioLiquido > 0 && params.lucroLiquidoOuReservas > 0) {
      var lucroDistribuivelIsentoRestante = (anual && anual.distribuicaoLucros)
        ? anual.distribuicaoLucros.lucroDistribuivelFinal
        : 0;

      // Descontar economia do pró-labore já alocada (se houver)
      if (economiaProLaboreTotal > 0) {
        lucroDistribuivelIsentoRestante = Math.max(0, lucroDistribuivelIsentoRestante - economiaProLaboreTotal);
      }

      try {
        resultJCP = LucroPresumido.simularJCP({
          patrimonioLiquido: params.patrimonioLiquido,
          taxaTJLP: params.taxaTJLP || 0.0612,
          lucroLiquidoOuReservas: params.lucroLiquidoOuReservas,
          lucroDistribuivelIsentoRestante: lucroDistribuivelIsentoRestante,
          dataReferencia: new Date()
        });
      } catch (e) {
        resultJCP = { erro: e.message };
      }
    }

    // ── 4C. Regime Caixa vs Competência ──
    var resultCaixa = null;
    if (params.faturamentoMensal && params.faturamentoMensal.length === 12 &&
        params.recebimentoMensal && params.recebimentoMensal.length === 12) {
      try {
        resultCaixa = LucroPresumido.simularRegimeCaixa({
          faturamentoMensal: params.faturamentoMensal,
          recebimentoMensal: params.recebimentoMensal,
          atividadeId: atividadeId
        });
      } catch (e) {
        resultCaixa = { erro: e.message };
      }
    }

    // ── 4D. ECD (Escrituração Contábil Digital) ──
    var resultECD = null;
    if (lucroContabil > 0) {
      var basePresumidaAnual = (anual && anual.distribuicaoLucros)
        ? anual.distribuicaoLucros.basePresumidaAnual
        : 0;
      var tributosFederaisAnuais = (anual && anual.consolidacao)
        ? anual.consolidacao.tributosFederais
        : 0;

      try {
        resultECD = LucroPresumido.calcularBeneficioECD({
          basePresumidaAnual: basePresumidaAnual,
          lucroContabilReal: lucroContabil,
          tributosFederaisAnuais: tributosFederaisAnuais,
          custoAnualECD: params.custoAnualECD || 0
        });
      } catch (e) {
        resultECD = { erro: e.message };
      }
    }

    // ── 5. Vantagens/Desvantagens ──
    var vantagens = null;
    try {
      vantagens = LucroPresumido.analisarVantagensDesvantagens({
        receitaBrutaAnual: receitaBrutaAnual,
        despesasOperacionaisAnuais: despesasOp + folha,
        atividadeId: atividadeId,
        temReceitasSazonais: !!params.receitaSazonal
      });
    } catch (e) {
      vantagens = { erro: e.message };
    }

    // ── 6. Break-Even LP vs Lucro Real ──
    var cargaLP = anual && anual.consolidacao ? anual.consolidacao.cargaTributariaTotal : 0;
    var resultBreakeven = null;
    try {
      resultBreakeven = calcularBreakEven({
        receitaBrutaAnual: receitaBrutaAnual,
        cargaTributariaLP: cargaLP,
        folhaPagamentoAnual: folha,
        totalDespesasOperacionais: despesasOp,
        creditosPISCOFINS: creditos,
        aliquotaISS: aliqISS,
        aliquotaRAT: aliqRAT,
        aliquotaTerceiros: aliqTerceiros
      });
    } catch (e) {
      resultBreakeven = { erro: e.message, cargaTributariaLP: cargaLP, breakEvenMargem: null, lpSempreVantajoso: false, lrSempreVantajoso: false, margemRealAtual: null, margens: [], alerta: null, recomendacao: '' };
    }

    // ── 7. Dicas inteligentes ──
    var resultDicas = [];
    try {
      resultDicas = gerarDicasInteligentes({
        receitaBrutaAnual: receitaBrutaAnual,
        atividadeId: atividadeId,
        folhaPagamentoAnual: folha,
        totalDespesasOperacionais: despesasOp,
        creditosPISCOFINS: creditos,
        temEscrituracao: !!params.temEscrituracao,
        temEquipamentos: !!params.temEquipamentos,
        temPD: !!params.temPD,
        receitaSazonal: !!params.receitaSazonal,
        areaAtuacaoSUDAM: !!params.areaAtuacaoSUDAM,
        numReceitas: receitas.length,
        breakeven: resultBreakeven
      });
    } catch (e) {
      resultDicas = [];
    }

    // ── 8. Economia potencial ──
    var economiaPotencial = null;
    try {
      economiaPotencial = calcularEconomiaPotencial({
        proLabore: proLaboreConsolidado,
        ecd: resultECD,
        caixaComp: resultCaixa,
        breakeven: resultBreakeven,
        dicas: resultDicas
      });
    } catch (e) {
      economiaPotencial = { totalEconomiaAnual: 0, totalDiferimento: 0, fontes: [], recomendacaoPrincipal: '', nivelOportunidade: 'baixo' };
    }

    // ── 9. LC 224/2025 ──
    var lc224 = null;
    if (receitaBrutaAnual > LC224_LIMITE_ANUAL) {
      try {
        lc224 = calcularImpactoLC224({
          receitaBrutaAnual: receitaBrutaAnual,
          atividadeId: atividadeId,
          anoCalendario: 2026
        });
      } catch (e) {
        lc224 = null;
      }
    }

    // ── 10. Resumo executivo ──
    var resumoExecutivo = null;
    try {
      resumoExecutivo = gerarResumoExecutivo({
        anual: anual || { receitaBrutaAnual: receitaBrutaAnual, consolidacao: null, distribuicaoLucros: null },
        breakeven: resultBreakeven || {},
        economia: economiaPotencial || { totalEconomiaAnual: 0, nivelOportunidade: 'baixo', recomendacaoPrincipal: '' },
        dicas: resultDicas,
        razaoSocial: params.razaoSocial || '',
        cnpj: params.cnpj || '',
        atividadeId: atividadeId
      });
    } catch (e) {
      resumoExecutivo = { erro: e.message };
    }

    return {
      simulacao: simulacao,
      trimestral: trimestral,
      piscofins: piscofins,
      anual: anual,
      vantagens: vantagens,
      breakeven: resultBreakeven,
      dicas: resultDicas,

      // Resultados individuais dos simuladores
      proLabore: resultProLabore,
      jcp: resultJCP,
      regimeCaixa: resultCaixa,
      ecd: resultECD,

      economiaPotencial: economiaPotencial,
      lc224: lc224,
      resumoExecutivo: resumoExecutivo,
      timestamp: new Date().toISOString()
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TESTE DE VERIFICAÇÃO
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Função de teste que pode ser chamada no console do navegador.
   * Executa um estudo completo com dados de exemplo e imprime os resultados.
   * Uso: EstudoLP._testarEstudo()
   */
  function _testarEstudo() {
    console.log('═══ TESTE EstudoLP v' + EstudoLP.VERSION + ' ═══');

    var resultado = EstudoLP.calcularEstudoCompleto({
      receitas: [{ atividadeId: 'servicos_gerais', valor: 2350000 }],
      receitaBrutaAnual: 2350000,
      atividadeId: 'servicos_gerais',
      folhaPagamentoAnual: 1000000,
      totalDespesasOperacionais: 800000,
      aliquotaISS: 3,
      aliquotaRAT: 3,
      aliquotaTerceiros: 0.5,
      creditosPISCOFINS: 50000,
      lucroContabil: 0,
      prejuizosFiscais: 0,
      temEscrituracao: false,
      temEquipamentos: false,
      temPD: false,
      receitaSazonal: false,
      areaAtuacaoSUDAM: true,
      devolucoes: 0, cancelamentos: 0, descontos: 0,
      ganhosCapital: 0, rendFinanceiros: 0, jcpRecebido: 0,
      multasContratuais: 0, recFinDiversas: 0,
      valoresRecuperados: 0, demaisReceitas: 0,
      irrfRetido: 0, csllRetida: 0, pisRetido: 0, cofinsRetida: 0,
      socios: [
        { nome: 'Luis Fernando', percentual: 0.65 },
        { nome: 'Elton Oderdenge', percentual: 0.35 }
      ],
      elegivelSimples: false,

      // Novos parâmetros — simuladores de economia
      sociosDetalhados: [
        { nome: 'Luis Fernando', participacao: 0.65, isAdministrador: true,
          proLaboreAtual: 5000, temOutroVinculoCLT: false, dependentesIRPF: 0 },
        { nome: 'Elton Oderdenge', participacao: 0.35, isAdministrador: true,
          proLaboreAtual: 3000, temOutroVinculoCLT: false, dependentesIRPF: 0 }
      ],
      patrimonioLiquido: 500000,
      taxaTJLP: 0.0612,
      lucroLiquidoOuReservas: 400000,
      faturamentoMensal: [196000,196000,196000,196000,196000,196000,196000,196000,196000,196000,196000,196000],
      recebimentoMensal: [150000,180000,220000,190000,200000,160000,210000,195000,185000,205000,170000,285000],
      custoAnualECD: 12000
    });

    console.log('Receita:', resultado.anual.receitaBrutaAnual);
    console.log('Carga Total LP:', resultado.anual.consolidacao.cargaTributariaTotal);
    console.log('% Carga:', resultado.anual.consolidacao.percentualCargaTributaria);
    console.log('Break-Even:', resultado.breakeven.breakEvenMargem || 'N/A');
    console.log('Margem Real:', resultado.breakeven.margemRealAtual || 'N/A');
    console.log('Recomendação:', resultado.breakeven.recomendacao);
    console.log('Dicas:', resultado.dicas.length);
    console.log('Economia Potencial:', resultado.economiaPotencial.totalEconomiaAnual);
    console.log('Pró-Labore Economia:', resultado.economiaPotencial.totalEconomiaAnual);
    console.log('Regime Caixa Diferimento:', resultado.regimeCaixa ? resultado.regimeCaixa.totalDiferido : 'N/A');
    console.log('ECD Benefício:', resultado.ecd ? resultado.ecd.beneficioLiquido : 'N/A');
    console.log('JCP Bruto:', resultado.jcp ? resultado.jcp.jcpBruto : 'N/A');
    console.log('Ações Economia:', resultado.resumoExecutivo.acoesEconomia || []);
    console.log('Regime Recomendado:', resultado.resumoExecutivo.regimeRecomendado);
    console.log('LC 224:', resultado.lc224 ? 'Aplicável' : 'N/A');
    console.log('═══ FIM TESTE ═══');
    return resultado;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EXPORTS — Objeto Global EstudoLP
  // ─────────────────────────────────────────────────────────────────────────

  var EstudoLP = {
    // Orquestrador
    calcularEstudoCompleto: calcularEstudoCompleto,

    // Análises individuais (para recálculos parciais no HTML)
    calcularBreakEven: calcularBreakEven,
    gerarDicasInteligentes: gerarDicasInteligentes,
    calcularEconomiaPotencial: calcularEconomiaPotencial,
    gerarResumoExecutivo: gerarResumoExecutivo,
    calcularImpactoLC224: calcularImpactoLC224,

    // Teste
    _testarEstudo: _testarEstudo,

    // Versão
    VERSION: '2.0.0'
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = EstudoLP;
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.EstudoLP = EstudoLP;
  }

})();
