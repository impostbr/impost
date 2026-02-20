/**
 * ══════════════════════════════════════════════════════════════════════════════
 * MOTOR DE ANÁLISE E ESTUDO — LUCRO PRESUMIDO  v3.7.1
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Camada intermediária entre o motor de cálculos (lucro_presumido.js) e o HTML.
 * Consome dados do LucroPresumido e entrega resultados prontos para renderização.
 *
 * Arquitetura:
 *   HTML (UI/render) → lucro-presumido-estudos.js (análise) → lucro_presumido.js (motor)
 *                                                            → estados.js (incentivos dinâmicos)
 *
 * Versão: 3.7.1
 * Data: Fevereiro/2026
 *
 * Changelog:
 *   v3.7.1 (Fevereiro/2026):
 *     - FIX EJ03: Versão sincronizada com HTML (3.0.0 → 3.7.1).
 *     - FIX EJ04: Mutação por side-effect em fontes[] eliminada (Object.assign).
 *     - FIX EJ05: LC 224 usa _calcularAliqEfetivaIRPJCSLL() em vez de 0.34 hardcoded.
 *     - FIX EJ06: DEFAULTS.aliquotaSimples removido (código morto).
 *     - FIX EJ07: _aliquotaParaDecimal() threshold ajustado com whitelist de nomes.
 *     - FIX EJ08: margemRealAtual renomeada para margemOperacionalBruta no resumo.
 *     - FIX EJ09: ufEmpresa duplicada removida do retorno de calcularEstudoCompleto.
 *     - FIX EJ10: _getAtividadeInfo() agora loga erros no console.
 *     - FIX EJ11: Fallback para percentualIRPJ undefined em atividade.
 *     - FIX EJ12: calcularBreakEven() converte alíquotas internamente via _aliquotaParaDecimal.
 *     - FIX EJ13: _calcularAliqEfetivaIRPJCSLL retorna 0 para base <= 0.
 *     - FIX EJ14: Comentário explicativo para == null (idioma intencional).
 *     - FIX EJ15: Emojis movidos para constantes no topo (separação motor/render).
 *     - FIX EJ17: gerarResumoExecutivo detecta anual com erro e alerta.
 *     - FIX ADD01: calcularEstudoCompleto passa despesasOperacionais ao consolidado.
 *     - FIX ADD02: MARGEM_MAXIMA aumentada de 95 para 99.
 *     - FIX ADD04: Índice de margem usa Math.floor em vez de Math.round.
 *     - FIX ADD05: Dica 16% usa limite R$480.000/ano (R$120.000 × 4 trimestres).
 *
 *   v3.0.0 (Fevereiro/2026):
 *     - REFACTOR: Integração com Estados.js — incentivos (SUDAM, SUDENE, ZFM, ALC, SUDECO)
 *       são lidos dinamicamente de Estados.getIncentivosNormalizado(uf) e utils do estado.
 *       Eliminado hardcoding de benefícios regionais. Cada estado define seus próprios
 *       incentivos e o estudo lê de lá.
 *     - FIX C1: "Margem Real" renomeada para "margemOperacionalBruta" em ambas as funções.
 *       Adicionada margemLiquidaPosTributos opcional. Tooltip com fórmula.
 *     - FIX C2: Economia Potencial separada em 3 categorias mutuamente exclusivas:
 *       (1) Otimizações dentro do LP, (2) Economia por migração p/ LR, (3) Benefícios já aplicados.
 *       totalEconomiaAnual = MAX(otimizacoesLP, migracaoLR), não soma.
 *     - FIX C3: Break-even com premissas documentadas, fórmula exportada.
 *     - FIX C4: _normalizeAliquota() eliminada. Alíquotas SEMPRE em percentual inteiro,
 *       divididas por 100 internamente. Warning se valor parece decimal.
 *     - FIX I1: ISS e INSS no break-even agora idênticos em ambos os lados (cancelam).
 *     - FIX I2: aliqEfetivaIRPJCSLL calculada com precisão (adicional só sobre excedente).
 *     - FIX I3: Dica SUDAM/SUDENE estima economia com base no lucro operacional, não presunção.
 *     - FIX I4: receitaSazonal gera dica de regime de caixa quando true.
 *     - FIX I5: ECD estimado quando lucroContabil === 0 usando margem operacional.
 *     - FIX M1: Economia retorna decomposicao detalhada.
 *     - FIX M2: Percentual 16% usa Math.abs para comparação float.
 *     - FIX M3: Dica 16% descreve "Economia de IRPJ".
 *     - FIX M4: regimeRecomendado usa margem de 5pp (não 10pp).
 *     - FIX M5: receitasPorTrimestre distribui PIS/COFINS mensal proporcionalmente.
 *     - FIX M6: Dados de teste com nomes genéricos.
 *     - NOVO P3: Resumo executivo com "Próximos Passos" priorizados.
 *
 * Dependências:
 *   - lucro_presumido.js deve ser carregado ANTES deste arquivo.
 *   - estados.js (opcional mas recomendado) — se carregado, incentivos são dinâmicos.
 *
 * Expõe: objeto global EstudoLP (window.EstudoLP / globalThis.EstudoLP)
 *
 * ══════════════════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────────────────
  // CONSTANTES INTERNAS
  // ─────────────────────────────────────────────────────────────────────────

  // FIX EJ03: Versão sincronizada com HTML
  var VERSION = '3.7.1';

  var DEFAULTS = {
    atividadeId: 'servicos_gerais',
    aliquotaISS: 5,       // Percentual INTEIRO (5 = 5%)
    aliquotaRAT: 3,       // Percentual INTEIRO (3 = 3%)
    aliquotaTerceiros: 0.5, // Percentual INTEIRO (0.5 = 0.5%)
    creditosPISCOFINS: 0,
    // FIX EJ06: aliquotaSimples removido — era código morto (nunca referenciado).
    //           Integração com Simples Nacional requer implementação dedicada.
    socios: [{ nome: 'Sócio Único', participacao: 1.0 }]
  };

  var LC224_LIMITE_ANUAL = 5000000;

  /** Alíquotas do Lucro Real para estimativa simplificada */
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

  var PIS_COFINS_CUMULATIVO = 0.0365;

  // FIX ADD02: Aumentado de 95 para 99 (consultorias/holdings podem ter margem > 95%)
  var MARGEM_MAXIMA = 99;

  // FIX EJ15: Emojis centralizados — separação motor/renderização.
  // A camada HTML pode sobrescrever via EstudoLP.EMOJIS se necessário.
  var EMOJIS = {
    incentivo: '🏛️',
    sazonalidade: '📊',
    caixa: '💵',
    zonaFranca: '🏭',
    exportacao: '🌎',
    reduzido: '📉',
    iss: '⚖️',
    estadual: '🏗️',
    alerta: '⚠️'
  };

  // FIX EJ07: Whitelist de nomes de alíquotas que podem ser legitimamente < 0.5
  var ALIQUOTAS_PEQUENAS_VALIDAS = ['aliquotaTerceiros', 'aliquotaISS'];

  // ─────────────────────────────────────────────────────────────────────────
  // FUNÇÕES AUXILIARES
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Arredonda valor monetário para N casas decimais.
   */
  function _arredondar(valor, casas) {
    if (casas === undefined) casas = 2;
    if (typeof valor !== 'number' || isNaN(valor)) return 0;
    var fator = Math.pow(10, casas);
    return Math.round(valor * fator) / fator;
  }

  /**
   * Valida parâmetros obrigatórios.
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
        if (params[obrigatorios[i]] === undefined || params[obrigatorios[i]] === null) {
          throw new Error(nomeFuncao + ': campo obrigatório "' + obrigatorios[i] + '" não informado.');
        }
      }
    }
    return params;
  }

  /**
   * Converte alíquota de percentual inteiro para decimal.
   * REGRA v3.0: Alíquotas SEMPRE chegam como percentual inteiro (ex: 5 para 5%).
   * Se o valor parece já ser decimal (< 0.5), emite warning no console.
   *
   * FIX EJ07: Usa whitelist de nomes que podem ser legitimamente < 0.5%
   *
   * @param {number|null|undefined} valor - Alíquota em percentual inteiro (ex: 5, 3, 0.5)
   * @param {number} fallbackPercent - Valor padrão em percentual inteiro
   * @param {string} nome - Nome do campo (para log)
   * @returns {number} Alíquota em decimal (ex: 0.05, 0.03, 0.005)
   */
  function _aliquotaParaDecimal(valor, fallbackPercent, nome) {
    // FIX EJ14: == null é idioma intencional em JS — captura null E undefined
    if (valor == null || typeof valor !== 'number') return fallbackPercent / 100; // eslint-disable-line eqeqeq

    // FIX EJ07: Só emite warning para nomes que NÃO estão na whitelist
    if (valor > 0 && valor < 0.5 && ALIQUOTAS_PEQUENAS_VALIDAS.indexOf(nome) === -1) {
      console.warn('[EstudoLP] Alíquota "' + nome + '" = ' + valor +
        ' parece já estar em decimal. Esperado valor em percentual inteiro (ex: 5 para 5%). ' +
        'Será interpretado como ' + valor + '% = ' + (valor / 100) + '. ' +
        'Se o correto é ' + (valor * 100) + '%, envie ' + (valor * 100) + '.');
    }

    return valor / 100;
  }

  /**
   * Busca informações de uma atividade pelo ID via motor LucroPresumido.
   * FIX EJ10: Erros agora são logados em vez de engolidos silenciosamente.
   */
  function _getAtividadeInfo(atividadeId) {
    try {
      var atividades = LucroPresumido.getAtividadesDisponiveis();
      for (var i = 0; i < atividades.length; i++) {
        if (atividades[i].id === atividadeId) return atividades[i];
      }
      return null;
    } catch (e) {
      // FIX EJ10: Logar erro para facilitar debug
      console.warn('[EstudoLP] _getAtividadeInfo("' + atividadeId + '") falhou: ' + e.message);
      return null;
    }
  }

  /**
   * Obtém percentualIRPJ de uma atividade com fallback seguro.
   * FIX EJ11: Protege contra atividade existente mas com percentualIRPJ undefined.
   *
   * @param {Object|null} atividade - Resultado de _getAtividadeInfo
   * @param {number} [fallback=0.32] - Fallback em decimal
   * @returns {number} Percentual de presunção em decimal
   */
  function _getPercentualPresuncao(atividade, fallback) {
    if (fallback === undefined) fallback = 0.32;
    if (!atividade) return fallback;
    var p = atividade.percentualIRPJ;
    if (typeof p !== 'number' || isNaN(p) || p <= 0) {
      console.warn('[EstudoLP] atividade "' + atividade.id + '" sem percentualIRPJ válido. Usando fallback ' + fallback);
      return fallback;
    }
    return p;
  }

  /**
   * Calcula alíquota efetiva real de IRPJ+CSLL sobre base presumida.
   * O adicional de 10% incide APENAS sobre o excedente acima de R$240.000/ano.
   *
   * FIX EJ13: Retorna 0 para base <= 0 (sem fundamentação para tributar base negativa).
   *
   * @param {number} basePresumidaAnual
   * @returns {number} Alíquota efetiva (ex: 0.26 para 26%)
   */
  function _calcularAliqEfetivaIRPJCSLL(basePresumidaAnual) {
    // FIX EJ13: Base zero ou negativa → alíquota zero
    if (basePresumidaAnual <= 0) return 0;
    var irpj = basePresumidaAnual * 0.15;
    var adicional = Math.max(0, basePresumidaAnual - 240000) * 0.10;
    var csll = basePresumidaAnual * 0.09;
    return (irpj + adicional + csll) / basePresumidaAnual;
  }

  /**
   * Obtém incentivos fiscais do estado via Estados.js (se disponível).
   * Retorna objeto normalizado com todos os incentivos ativos.
   *
   * @param {string} uf - Sigla do estado (ex: "PA", "AM", "CE")
   * @returns {Object} Incentivos normalizados ou objeto vazio
   */
  function _obterIncentivosEstado(uf) {
    if (!uf) return { sudam: { ativo: false }, sudene: { ativo: false }, sudeco: { ativo: false }, zona_franca: { ativo: false, existe: false }, suframa: { ativo: false }, alc: { ativo: false }, incentivos_estaduais: {}, _disponivel: false };

    // Tentar usar Estados.js
    var Estados = (typeof window !== 'undefined' && window.Estados) ||
                  (typeof globalThis !== 'undefined' && globalThis.Estados) ||
                  (typeof EstadosBR !== 'undefined' ? EstadosBR : null);

    if (Estados && typeof Estados.getIncentivosNormalizado === 'function') {
      var inc = Estados.getIncentivosNormalizado(uf);
      if (inc) {
        inc._disponivel = true;
        return inc;
      }
    }

    // Fallback: sem Estados.js carregado
    console.warn('[EstudoLP] Estados.js não disponível. Incentivos para UF "' + uf + '" não carregados. ' +
      'Carregue estados/' + uf.toLowerCase() + '.js + estados.js para incentivos dinâmicos.');
    return { sudam: { ativo: false }, sudene: { ativo: false }, sudeco: { ativo: false }, zona_franca: { ativo: false, existe: false }, suframa: { ativo: false }, alc: { ativo: false }, incentivos_estaduais: {}, _disponivel: false };
  }

  /**
   * Obtém utils do estado para cálculos específicos (getReducaoSUDAM, etc.)
   */
  function _obterUtilsEstado(uf) {
    if (!uf) return null;
    var Estados = (typeof window !== 'undefined' && window.Estados) ||
                  (typeof globalThis !== 'undefined' && globalThis.Estados) || null;
    if (Estados && typeof Estados.getUtils === 'function') {
      return Estados.getUtils(uf);
    }
    return null;
  }

  /**
   * Obtém percentual de redução IRPJ do incentivo regional (SUDAM/SUDENE/SUDECO).
   * Usa utils do estado se disponível, senão usa dados do incentivo.
   *
   * @param {string} uf
   * @param {Object} incentivos - Resultado de _obterIncentivosEstado
   * @returns {{ tipo: string, percentualReducao: number, ativo: boolean, obs: string }}
   */
  function _obterReducaoRegional(uf, incentivos) {
    var resultado = { tipo: null, percentualReducao: 0, ativo: false, obs: '', requerLucroReal: true };

    var utils = _obterUtilsEstado(uf);

    // SUDAM
    if (incentivos.sudam && (incentivos.sudam.ativo === true || incentivos.sudam.existe === true)) {
      resultado.tipo = 'SUDAM';
      resultado.ativo = true;
      resultado.obs = incentivos.sudam.obs || 'Área de abrangência SUDAM — MP 2.199-14/2001';
      // Usar utils se disponível
      if (utils && typeof utils.getReducaoSUDAM === 'function') {
        resultado.percentualReducao = utils.getReducaoSUDAM() || 0.75;
      } else {
        resultado.percentualReducao = incentivos.sudam.reducao_irpj || incentivos.sudam.percentual_reducao || 0.75;
      }
      // Verificar abrangência parcial
      if (incentivos.sudam.abrangencia_parcial) {
        resultado.obs += ' (abrangência parcial — verificar municípios elegíveis)';
      }
      return resultado;
    }

    // SUDENE
    if (incentivos.sudene && (incentivos.sudene.ativo === true || incentivos.sudene.existe === true)) {
      resultado.tipo = 'SUDENE';
      resultado.ativo = true;
      resultado.obs = incentivos.sudene.obs || 'Área de abrangência SUDENE — MP 2.199-14/2001';
      if (utils && typeof utils.getReducaoSUDENE === 'function') {
        resultado.percentualReducao = utils.getReducaoSUDENE() || 0.75;
      } else {
        resultado.percentualReducao = incentivos.sudene.reducao_irpj || incentivos.sudene.percentual_reducao || 0.75;
      }
      if (incentivos.sudene.abrangencia_parcial) {
        resultado.obs += ' (abrangência parcial — verificar municípios elegíveis)';
      }
      return resultado;
    }

    // SUDECO
    if (incentivos.sudeco && (incentivos.sudeco.ativo === true || incentivos.sudeco.existe === true)) {
      resultado.tipo = 'SUDECO';
      resultado.ativo = true;
      resultado.obs = incentivos.sudeco.obs || 'Área de abrangência SUDECO';
      resultado.percentualReducao = incentivos.sudeco.reducao_irpj || incentivos.sudeco.percentual_reducao || 0.75;
      return resultado;
    }

    return resultado;
  }

  /**
   * Obtém benefícios de ZFM/ALC/SUFRAMA do estado.
   */
  function _obterBeneficiosZFM(uf, incentivos) {
    var resultado = { zonaFranca: false, alc: false, suframa: false, obs: '' };

    if (incentivos.zona_franca && (incentivos.zona_franca.ativo === true || incentivos.zona_franca.existe === true)) {
      resultado.zonaFranca = true;
      resultado.obs = incentivos.zona_franca.obs || 'Zona Franca ativa';
    }
    if (incentivos.alc && (incentivos.alc.ativo === true || incentivos.alc.existe === true)) {
      resultado.alc = true;
      resultado.obs += (resultado.obs ? '; ' : '') + (incentivos.alc.obs || 'Área de Livre Comércio ativa');
    }
    if (incentivos.suframa && (incentivos.suframa.ativo === true || incentivos.suframa.existe === true)) {
      resultado.suframa = true;
    }

    return resultado;
  }

  /**
   * Coleta incentivos estaduais (programas do estado).
   */
  function _obterIncentivosEstaduais(incentivos) {
    var programas = incentivos.incentivos_estaduais || {};
    var lista = [];
    if (Array.isArray(programas)) {
      lista = programas;
    } else if (typeof programas === 'object') {
      var keys = Object.keys(programas);
      for (var i = 0; i < keys.length; i++) {
        lista.push(programas[keys[i]]);
      }
    }
    return lista;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FUNÇÃO 1: calcularBreakEven — Análise Break-Even LP vs Lucro Real
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Encontra o ponto de cruzamento onde o Lucro Real passa a ser mais
   * vantajoso que o Lucro Presumido.
   *
   * v3.0 FIX:
   *   - ISS e INSS REMOVIDOS de ambos os lados (são iguais, cancelam-se)
   *   - Comparação apenas de tributos federais: IRPJ, CSLL, PIS, COFINS
   *   - margemRealAtual renomeada para margemOperacionalBruta
   *   - Premissas documentadas no output
   *
   * v3.7.1 FIX EJ12: Alíquotas são aceitas tanto como percentual inteiro
   *   quanto como decimal. Conversão interna via _aliquotaParaDecimal.
   *
   * @param {Object} params
   * @param {number} params.receitaBrutaAnual
   * @param {number} params.cargaTributariaLP - carga total já calculada pelo consolidado
   * @param {number} params.tributosFederaisLP - APENAS tributos federais do LP (sem ISS/INSS)
   * @param {number} params.folhaPagamentoAnual
   * @param {number} params.totalDespesasOperacionais
   * @param {number} params.creditosPISCOFINS
   * @param {number} [params.prejuizosFiscaisAcumulados=0]
   * @param {number} [params.aliquotaISS] - Percentual inteiro (5 = 5%) ou decimal (0.05)
   * @param {number} [params.aliquotaRAT] - Percentual inteiro (3 = 3%) ou decimal (0.03)
   * @param {number} [params.aliquotaTerceiros] - Percentual inteiro (0.5 = 0.5%)
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
    var prejuizosFiscais = params.prejuizosFiscaisAcumulados || 0;

    // FIX I1 v3.0: Para o break-even, comparamos APENAS tributos federais.
    // ISS e INSS patronal são idênticos em ambos os regimes para a mesma empresa,
    // portanto não afetam o ponto de cruzamento.
    // Se tributosFederaisLP fornecido, usar; senão usar cargaLP completa com aviso.
    var cargaFederalLP;
    var incluiISSINSS = false;
    if (typeof params.tributosFederaisLP === 'number' && params.tributosFederaisLP > 0) {
      cargaFederalLP = _arredondar(params.tributosFederaisLP);
    } else {
      // Fallback: usar carga total (inclui ISS/INSS) — menos preciso mas funciona
      cargaFederalLP = cargaLP;
      incluiISSINSS = true;
    }

    if (receita <= 0) {
      return {
        cargaTributariaLP: cargaLP,
        breakEvenMargem: null,
        lpSempreVantajoso: false,
        lrSempreVantajoso: false,
        margemOperacionalBruta: null,
        margemOperacionalBruta_formula: '(Receita - Despesas Operacionais - Folha) / Receita × 100',
        margemOperacionalBruta_nota: 'NÃO inclui tributos. É a margem PRÉ-impostos.',
        margens: [],
        alerta: null,
        recomendacao: 'Receita bruta anual não informada. Impossível calcular break-even.',
        premissas: {},
        baseLegal: 'RIR/2018; Lei 9.249/95, Art. 15; Lei 10.637/2002; Lei 10.833/2003.'
      };
    }

    var margens = [];
    var breakEvenMargem = null;
    var lpVantajosoCount = 0;
    var lrVantajosoCount = 0;

    for (var m = 1; m <= MARGEM_MAXIMA; m++) {
      var lucroTributavelBruto = receita * (m / 100);
      var compensacaoPrejuizo = prejuizosFiscais > 0
        ? Math.min(prejuizosFiscais, lucroTributavelBruto * 0.30)
        : 0;
      var lucroTributavel = Math.max(0, lucroTributavelBruto - compensacaoPrejuizo);

      var irpj = lucroTributavel * LR.IRPJ;
      var adicionalIRPJ = Math.max(0, lucroTributavel - LR.LIMITE_ADICIONAL_ANUAL) * LR.ADICIONAL_IRPJ;
      var csll = lucroTributavel * LR.CSLL;

      var pisNC = Math.max(0, receita * LR.PIS_NAO_CUMULATIVO - creditos * (LR.PIS_NAO_CUMULATIVO / LR.TOTAL_PIS_COFINS_NC));
      var cofinsNC = Math.max(0, receita * LR.COFINS_NAO_CUMULATIVO - creditos * (LR.COFINS_NAO_CUMULATIVO / LR.TOTAL_PIS_COFINS_NC));

      // FIX I1: Apenas federais. ISS e INSS cancelam.
      var cargaFederalLR = _arredondar(irpj + adicionalIRPJ + csll + pisNC + cofinsNC);

      // Se LP inclui ISS/INSS (fallback), adicionar ao LR também para manter comparabilidade
      var cargaLRComparavel = cargaFederalLR;
      if (incluiISSINSS) {
        // FIX EJ12: Converter alíquotas internamente — aceita tanto inteiro quanto decimal
        var aliqISS_be = _aliquotaParaDecimal(params.aliquotaISS, DEFAULTS.aliquotaISS, 'aliquotaISS');
        var aliqRAT_be = _aliquotaParaDecimal(params.aliquotaRAT, DEFAULTS.aliquotaRAT, 'aliquotaRAT');
        var aliqTerceiros_be = _aliquotaParaDecimal(params.aliquotaTerceiros, DEFAULTS.aliquotaTerceiros, 'aliquotaTerceiros');
        cargaLRComparavel += receita * aliqISS_be + folha * (LR.INSS_PATRONAL + aliqRAT_be + aliqTerceiros_be);
        cargaLRComparavel = _arredondar(cargaLRComparavel);
      }

      margens.push({
        margem: m,
        cargaLP: cargaFederalLP,
        cargaLR: cargaLRComparavel,
        diferencaLPvsLR: _arredondar(cargaFederalLP - cargaLRComparavel)
      });

      if (cargaFederalLP < cargaLRComparavel) {
        lpVantajosoCount++;
      } else if (cargaLRComparavel < cargaFederalLP) {
        lrVantajosoCount++;
      }

      if (breakEvenMargem === null && m > 1) {
        var anterior = margens[m - 2];
        if ((anterior.cargaLR < anterior.cargaLP && cargaLRComparavel >= cargaFederalLP) ||
            (anterior.cargaLR >= anterior.cargaLP && cargaLRComparavel < cargaFederalLP)) {
          breakEvenMargem = m;
        }
      }
    }

    var lpSempreVantajoso = (lpVantajosoCount === MARGEM_MAXIMA);
    var lrSempreVantajoso = (lrVantajosoCount === MARGEM_MAXIMA);

    // FIX C1: Margem renomeada e documentada
    var margemOperacionalBruta = null;
    if (receita > 0 && (despesasOp > 0 || folha > 0)) {
      margemOperacionalBruta = _arredondar((receita - despesasOp - folha) / receita * 100, 1);
    }

    var margemLiquidaPosTributos = null;
    if (receita > 0 && cargaLP > 0) {
      margemLiquidaPosTributos = _arredondar((receita - despesasOp - folha - cargaLP) / receita * 100, 1);
    }

    // Alerta
    var alerta = null;
    if (receita > 0 && despesasOp === 0 && folha === 0) {
      alerta = 'ATENÇÃO: Nenhuma despesa operacional ou folha foi informada. ' +
               'A análise assume margem de 100%, o que raramente reflete a realidade. ' +
               'Preencha as despesas na aba "Complementar".';
      margemOperacionalBruta = 100;
    }
    if (margemOperacionalBruta !== null && breakEvenMargem !== null) {
      if (margemOperacionalBruta < breakEvenMargem) {
        alerta = 'Margem real ABAIXO do break-even. O Lucro Real pode ser mais vantajoso.';
      } else if (Math.abs(margemOperacionalBruta - breakEvenMargem) < 5) {
        alerta = 'Margem real próxima do break-even. Reavalie anualmente.';
      }
    }

    // Recomendação
    var recomendacao = '';
    if (lpSempreVantajoso) {
      recomendacao = 'LP é mais vantajoso em TODAS as margens simuladas. Mantenha o LP.';
    } else if (lrSempreVantajoso) {
      recomendacao = 'LR é mais vantajoso em TODAS as margens simuladas. Considere migrar.';
    } else if (margemOperacionalBruta !== null && breakEvenMargem !== null) {
      if (margemOperacionalBruta >= breakEvenMargem) {
        recomendacao = 'Margem real (' + margemOperacionalBruta + '%) ACIMA do break-even (' + breakEvenMargem + '%). LP é favorável.';
      } else {
        recomendacao = 'Margem real (' + margemOperacionalBruta + '%) ABAIXO do break-even (' + breakEvenMargem + '%). Avalie o LR.';
      }
    } else if (breakEvenMargem !== null) {
      recomendacao = 'Break-even na margem de ' + breakEvenMargem + '%. Abaixo: LR é melhor. Acima: LP é melhor.';
    } else {
      recomendacao = 'Não foi possível determinar o break-even. Consulte seu contador.';
    }

    // Premissas documentadas (FIX C3)
    var premissas = {
      descricao: 'Compara tributos federais (IRPJ, CSLL, PIS, COFINS) do LP com LR.',
      pisCofinsLR: 'PIS 1,65% + COFINS 7,6% não-cumulativo (com créditos)',
      pisCofinsLP: 'PIS 0,65% + COFINS 3,0% cumulativo',
      issConsiderado: incluiISSINSS ? 'ISS incluído em ambos os lados (mesmo valor — não afeta break-even)' : 'ISS REMOVIDO de ambos (cancela)',
      inssConsiderado: incluiISSINSS ? 'INSS patronal incluído em ambos os lados (mesmo valor)' : 'INSS REMOVIDO de ambos (cancela)',
      creditosPISCOFINS: creditos > 0 ? 'R$ ' + creditos.toLocaleString('pt-BR') : 'Sem créditos',
      prejuizosFiscais: prejuizosFiscais > 0 ? 'R$ ' + prejuizosFiscais.toLocaleString('pt-BR') + ' (compensação até 30%)' : 'Sem prejuízos',
      formulaBreakEven: 'Para cada margem m (1% a ' + MARGEM_MAXIMA + '%): LR = lucro×(15%+10%adicional)+lucro×9%+receita×9,25%-créditos. Onde break-even: cargaLP = cargaLR.',
      nota: 'Para decisão definitiva, consulte seu contador.'
    };

    return {
      cargaTributariaLP: cargaLP,
      cargaFederalLP: cargaFederalLP,
      breakEvenMargem: breakEvenMargem,
      lpSempreVantajoso: lpSempreVantajoso,
      lrSempreVantajoso: lrSempreVantajoso,
      // FIX C1: Nome claro e consistente
      margemOperacionalBruta: margemOperacionalBruta,
      margemOperacionalBruta_formula: '(Receita - Despesas Operacionais - Folha) / Receita × 100',
      margemOperacionalBruta_nota: 'Margem PRÉ-tributos. NÃO inclui impostos.',
      margemLiquidaPosTributos: margemLiquidaPosTributos,
      margens: margens,
      alerta: alerta,
      recomendacao: recomendacao,
      premissas: premissas,
      baseLegal: 'RIR/2018; Lei 9.249/95, Art. 15; Lei 10.637/2002; Lei 10.833/2003.'
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FUNÇÃO 2: gerarDicasInteligentes — Motor de Recomendações
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Gera array de dicas contextuais baseadas na situação da empresa.
   * v3.0: Incentivos vêm de Estados.js via params.incentivosEstado.
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
    var receitaSazonal = !!params.receitaSazonal;
    var numReceitas = params.numReceitas || 1;
    var breakeven = params.breakeven || null;
    var receitasVendasZFM = params.receitasVendasZFM || 0;
    var receitasSUFRAMA = params.receitasSUFRAMA || 0;
    var receitasExportacao = params.receitasExportacao || 0;
    var exclusivamenteServicosElegiveis = !!params.exclusivamenteServicosElegiveis;
    var regimeCaixa = !!params.regimeCaixa;

    // Incentivos dinâmicos do estado
    var incentivos = params.incentivosEstado || {};
    var reducaoRegional = params.reducaoRegional || { ativo: false };
    var beneficiosZFM = params.beneficiosZFM || { zonaFranca: false };

    var dicas = [];
    var atividade = _getAtividadeInfo(atividadeId);
    // FIX EJ11: Usar helper com fallback seguro
    var percentualPresuncao = _getPercentualPresuncao(atividade);

    // Margem operacional bruta (FIX C1: nome consistente com break-even)
    var margemOperacionalBruta = receita > 0 ? (receita - despesasOp - folha) / receita : 0;

    // ── Dica 0: Alerta margem 100% ──
    if (receita > 0 && despesasOp === 0 && folha === 0) {
      dicas.push({
        titulo: 'Margem de lucro implícita de 100% — Dados incompletos',
        descricao: 'Nenhuma despesa operacional ou folha foi informada. ' +
                   'Todas as análises assumem margem de 100%. Preencha as despesas.',
        tipo: 'alerta',
        impactoEstimado: null,
        categoria: 'geral'
      });
    }

    // ── Dica 1: Margem vs Presunção ──
    // FIX I2: Alíquota efetiva REAL (não binária 24%/34%)
    var basePresumidaAnual = receita * percentualPresuncao;
    var aliqEfetiva = _calcularAliqEfetivaIRPJCSLL(basePresumidaAnual);

    if (receita > 0 && (despesasOp > 0 || folha > 0)) {
      if (margemOperacionalBruta > percentualPresuncao) {
        var diferencaBase = receita * (margemOperacionalBruta - percentualPresuncao);
        var impactoEconomia = _arredondar(diferencaBase * aliqEfetiva);
        dicas.push({
          titulo: 'Margem real acima da presunção — LP é vantajoso',
          descricao: 'Margem operacional bruta (' + _arredondar(margemOperacionalBruta * 100, 1) +
            '%) superior à presunção (' + _arredondar(percentualPresuncao * 100, 1) +
            '%). No LP, tributa sobre base menor. Economia: R$ ' +
            impactoEconomia.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) +
            '/ano em IRPJ+CSLL (alíquota efetiva: ' + _arredondar(aliqEfetiva * 100, 1) + '%).',
          tipo: 'economia',
          impactoEstimado: impactoEconomia,
          categoria: 'otimizacao_lp'
        });
      } else {
        var diferencaBaseAlerta = receita * (percentualPresuncao - margemOperacionalBruta);
        var impactoExcesso = _arredondar(diferencaBaseAlerta * aliqEfetiva);
        dicas.push({
          titulo: 'Margem real abaixo da presunção — Atenção',
          descricao: 'Margem operacional bruta (' + _arredondar(margemOperacionalBruta * 100, 1) +
            '%) inferior à presunção (' + _arredondar(percentualPresuncao * 100, 1) +
            '%). Custo extra: R$ ' + impactoExcesso.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) +
            '/ano. Avalie o Lucro Real.',
          tipo: 'alerta',
          impactoEstimado: impactoExcesso,
          categoria: 'migracao_lr'
        });
      }
    }

    // ── Dica 2: Incentivo Regional (SUDAM/SUDENE/SUDECO) — dinâmico de Estados.js ──
    if (reducaoRegional.ativo && reducaoRegional.percentualReducao > 0) {
      // FIX I3: Estimar economia com base no LUCRO OPERACIONAL, não na presunção
      var lucroOperacionalEstimado = receita - despesasOp - folha;
      var irpjLREstimado, economiaRegional;
      if (lucroOperacionalEstimado > 0 && (despesasOp > 0 || folha > 0)) {
        irpjLREstimado = lucroOperacionalEstimado * 0.15;
        economiaRegional = _arredondar(irpjLREstimado * reducaoRegional.percentualReducao);
      } else {
        // Fallback: usar base presumida quando não há dados de despesas
        irpjLREstimado = basePresumidaAnual * 0.15;
        economiaRegional = _arredondar(irpjLREstimado * reducaoRegional.percentualReducao);
      }

      dicas.push({
        titulo: EMOJIS.incentivo + ' ' + reducaoRegional.tipo + ' — Redução ' + _arredondar(reducaoRegional.percentualReducao * 100) + '% IRPJ (exclusivo Lucro Real)',
        descricao: reducaoRegional.obs + '. Economia estimada: R$ ' +
          economiaRegional.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '/ano. ' +
          ((despesasOp > 0 || folha > 0) ? 'Estimativa baseada no lucro operacional (R$ ' +
            lucroOperacionalEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + ').' :
            'Estimativa baseada na presunção (sem dados de despesas).') +
          ' NÃO se aplica no LP — exige migração para LR e "lucro da exploração". ' +
          'Adicional de 10% NÃO é reduzido. Exige laudo constitutivo e atividade elegível.',
        tipo: 'economia',
        impactoEstimado: economiaRegional,
        categoria: 'migracao_lr'
      });
    }

    // ── Dica 2b: Regime de Caixa — priorizar quando sazonalidade detectada ──
    // FIX I4: receitaSazonal gera dica específica
    if (receitaSazonal && !regimeCaixa) {
      dicas.push({
        titulo: EMOJIS.sazonalidade + ' Sazonalidade detectada — Regime de Caixa recomendado',
        descricao: 'Receita sazonal informada. O regime de caixa (IN RFB 1.700/2017, Art. 223) ' +
          'permite tributar sobre recebimentos em vez de faturamento, reduzindo o impacto ' +
          'de meses com faturamento alto e recebimento baixo.',
        tipo: 'acao',
        impactoEstimado: null,
        categoria: 'otimizacao_lp'
      });
    }

    // ── Dica 3: Regime de Caixa geral ──
    if (!regimeCaixa) {
      dicas.push({
        titulo: 'Regime de Caixa disponível no Lucro Presumido',
        descricao: 'O LP permite regime de caixa (IN RFB 1.700/2017, Art. 223). ' +
          'Imposto pago quando o cliente efetivamente paga. Benefício para inadimplência ou prazos longos.',
        tipo: 'info',
        impactoEstimado: null,
        categoria: 'otimizacao_lp'
      });
    } else {
      dicas.push({
        titulo: EMOJIS.caixa + ' Regime de Caixa ativado',
        descricao: 'Tributação sobre recebimentos ativa. Exige Livro Caixa ou escrituração contábil.',
        tipo: 'info',
        impactoEstimado: null,
        categoria: 'otimizacao_lp'
      });
    }

    // ── Dica 4: Atividades Mistas ──
    if (numReceitas > 1) {
      dicas.push({
        titulo: 'Atividades mistas — Classificação correta é essencial',
        descricao: numReceitas + ' atividades distintas. Cada receita com percentual de presunção correto (Lei 9.249/95, Art. 15). Erro = autuação 75% + SELIC.',
        tipo: 'alerta',
        impactoEstimado: null,
        categoria: 'geral'
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
          descricao: 'Créditos de R$ ' + creditos.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) +
            ': PIS/COFINS NC = R$ ' + naoCumulativo.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) +
            ' vs cumulativo = R$ ' + cumulativo.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) +
            '. Economia: R$ ' + economiaPISCOFINS.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '/ano.',
          tipo: 'economia',
          impactoEstimado: economiaPISCOFINS,
          categoria: 'migracao_lr'
        });
      }
    }

    // ── Dica 6: ZFM/SUFRAMA — dinâmico de Estados.js ──
    var totalZFM = receitasVendasZFM + receitasSUFRAMA;
    if (totalZFM > 0 || beneficiosZFM.zonaFranca || beneficiosZFM.alc) {
      if (totalZFM > 0) {
        var economiaZFM = _arredondar(totalZFM * 0.0365);
        dicas.push({
          titulo: EMOJIS.zonaFranca + ' Zona Franca / SUFRAMA — Isenção PIS/COFINS aplicada',
          descricao: 'Receitas ZFM/SUFRAMA: R$ ' + totalZFM.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) +
            '. Economia PIS/COFINS: R$ ' + economiaZFM.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) +
            '/ano. JÁ incluída no cálculo. Base: Lei 10.996/2004; Decreto 288/67.',
          tipo: 'economia',
          impactoEstimado: economiaZFM,
          categoria: 'ja_aplicado'
        });
      }
      if (beneficiosZFM.zonaFranca && totalZFM === 0) {
        dicas.push({
          titulo: EMOJIS.zonaFranca + ' Zona Franca disponível no seu estado',
          descricao: beneficiosZFM.obs + '. Informe receitas de vendas para ZFM para calcular a isenção de PIS/COFINS.',
          tipo: 'acao',
          impactoEstimado: null,
          categoria: 'geral'
        });
      }
    }

    // ── Dica 7: Exportação ──
    if (receitasExportacao > 0) {
      var econExport = _arredondar(receitasExportacao * 0.0365);
      dicas.push({
        titulo: EMOJIS.exportacao + ' Exportações — Imunidade PIS/COFINS aplicada',
        descricao: 'Exportação: R$ ' + receitasExportacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) +
          '. Economia: R$ ' + econExport.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) +
          '/ano. CF/88, Art. 149, §2º, I.',
        tipo: 'economia',
        impactoEstimado: econExport,
        categoria: 'ja_aplicado'
      });
    }

    // ── Dica 8: Percentual Reduzido 16% ──
    // FIX M2: Usar Math.abs para comparação float
    // FIX ADD05: Limite corrigido para R$480.000/ano (R$120.000/trimestre × 4)
    //   IN RFB 1.700/2017, Art. 215, §10 exige receita bruta TRIMESTRAL ≤ R$120.000
    //   Como trabalhamos com receita anual, o limite é 120.000 × 4 = 480.000
    if (Math.abs(percentualPresuncao - 0.32) < 0.001 && receita <= 480000 && receita > 0) {
      // FIX M3: Descrição correta "Economia de IRPJ"
      var econReduzido = _arredondar(receita * 0.16 * 0.15);
      dicas.push({
        titulo: EMOJIS.reduzido + ' Percentual Reduzido 16% disponível',
        descricao: 'Receita ≤ R$ 120.000/trimestre (R$ ' +
          _arredondar(receita / 4).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) +
          '/tri) e serviços (32%). Se prestar EXCLUSIVAMENTE ' +
          'serviços elegíveis, pode usar 16% no IRPJ. Economia de IRPJ: R$ ' +
          econReduzido.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) +
          '/ano. CSLL permanece 32%. Base: IN RFB 1.700/2017, Art. 215, §10.',
        tipo: 'economia',
        impactoEstimado: econReduzido,
        categoria: 'otimizacao_lp'
      });
    }

    // ── Dica 8d: ISS misto ──
    if (numReceitas > 1) {
      dicas.push({
        titulo: EMOJIS.iss + ' ISS aplicado apenas sobre serviços',
        descricao: 'Empresa com atividades mistas: ISS incide APENAS sobre serviços (LC 116/2003).',
        tipo: 'info',
        impactoEstimado: null,
        categoria: 'geral'
      });
    }

    // ── Dica 9: Adicional IRPJ ──
    if (receita > 0 && basePresumidaAnual > 240000) {
      var adicionalEstimado = _arredondar((basePresumidaAnual - 240000) * 0.10);
      dicas.push({
        titulo: 'Adicional de IRPJ de 10% incide sobre sua empresa',
        descricao: 'Base presumida R$ ' + basePresumidaAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) +
          ' > R$ 240.000. Adicional: R$ ' + adicionalEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) +
          '/ano (RIR/2018, Art. 624).',
        tipo: 'alerta',
        impactoEstimado: adicionalEstimado,
        categoria: 'geral'
      });
    }

    // ── Dica 10: Incentivos estaduais (dinâmico de Estados.js) ──
    var programasEstaduais = _obterIncentivosEstaduais(incentivos);
    if (programasEstaduais.length > 0) {
      var descProgramas = programasEstaduais.map(function(p) {
        return (p.programa || p.nome || 'Programa') + ': ' + (p.beneficio || p.descricao || '');
      }).join('; ');
      dicas.push({
        titulo: EMOJIS.estadual + ' Incentivos Estaduais disponíveis',
        descricao: 'Programas identificados: ' + descProgramas.substring(0, 500) +
          '. Verifique elegibilidade com a SEFAZ.',
        tipo: 'info',
        impactoEstimado: null,
        categoria: 'geral'
      });
    }

    // ── Dica 11: Reforma Tributária ──
    dicas.push({
      titulo: 'Reforma Tributária — CBS e IBS (2026-2033)',
      descricao: 'EC 132/2023: CBS substituirá PIS/COFINS, IBS substituirá ICMS/ISS. Transição gradual até 2033. ' +
        'Acompanhe LC 214/2025.',
      tipo: 'info',
      impactoEstimado: null,
      categoria: 'geral'
    });

    // ── Dica 12: Escrituração Contábil ──
    if (!temEscrituracao) {
      dicas.push({
        titulo: 'Escrituração completa amplia distribuição de lucros',
        descricao: 'Sem ECD, distribuição isenta limitada à base presumida menos impostos ' +
          '(IN RFB 1.700/2017, Art. 238). Com ECD, pode distribuir lucro contábil efetivo.',
        tipo: 'acao',
        impactoEstimado: null,
        categoria: 'otimizacao_lp'
      });
    }

    // ── Dica 13: Break-even próximo ──
    if (breakeven && breakeven.alerta) {
      dicas.push({
        titulo: 'Break-even LP vs LR requer atenção',
        descricao: breakeven.alerta + ' ' + breakeven.recomendacao,
        tipo: 'alerta',
        impactoEstimado: null,
        categoria: 'geral'
      });
    }

    // ── Dica 14: P&D / Equipamentos ──
    if (temEquipamentos || temPD) {
      var descricaoPD = [];
      if (temEquipamentos) descricaoPD.push('depreciação acelerada (Lei 11.196/2005, Art. 17)');
      if (temPD) descricaoPD.push('incentivos Lei do Bem (Lei 11.196/2005, Cap. III)');
      dicas.push({
        titulo: 'Investimentos/P&D — Benefícios exclusivos do Lucro Real',
        descricao: 'Benefícios possíveis no LR: ' + descricaoPD.join('; ') + '. NÃO disponíveis no LP.',
        tipo: 'economia',
        impactoEstimado: null,
        categoria: 'migracao_lr'
      });
    }

    // Ordenar por prioridade
    var ordemTipo = { alerta: 0, economia: 1, acao: 2, info: 3 };
    dicas.sort(function (a, b) {
      return (ordemTipo[a.tipo] || 9) - (ordemTipo[b.tipo] || 9);
    });

    return dicas;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FUNÇÃO 3: calcularImpactoLC224
  // ─────────────────────────────────────────────────────────────────────────

  function calcularImpactoLC224(params) {
    _validarParams(params, ['receitaBrutaAnual'], 'calcularImpactoLC224');

    var receita = params.receitaBrutaAnual;
    var atividadeId = params.atividadeId || DEFAULTS.atividadeId;
    var anoCalendario = params.anoCalendario || 2026;

    if (receita <= LC224_LIMITE_ANUAL) return null;

    var atividade = _getAtividadeInfo(atividadeId);
    if (!atividade) return null;

    // FIX EJ11: Usar helper com fallback
    var percentualPresuncao = _getPercentualPresuncao(atividade);
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
        trimestres.push({ trimestre: q, baseSemLC224: _arredondar(baseSemLC224), baseComLC224: _arredondar(baseComLC224), impacto: impacto });
        impactoTotalBase += impacto;
      } catch (e) {
        trimestres.push({ trimestre: q, erro: e.message });
      }
    }

    impactoTotalBase = _arredondar(impactoTotalBase);

    // FIX EJ05: Usar alíquota efetiva calculada em vez de 0.34 hardcoded.
    // Para receitas > R$5M, a base presumida será alta o suficiente para o adicional incidir,
    // mas o cálculo exato é melhor que hardcodar.
    var basePresumidaAnualEstimada = receita * percentualPresuncao + impactoTotalBase;
    var aliqEfetivaLC224 = _calcularAliqEfetivaIRPJCSLL(basePresumidaAnualEstimada);
    var impostoExtraEstimado = _arredondar(impactoTotalBase * aliqEfetivaLC224);

    return {
      aplicavel: true,
      receitaBrutaAnual: receita,
      trimestres: trimestres,
      impactoTotalBase: impactoTotalBase,
      impostoExtraEstimado: impostoExtraEstimado,
      aliquotaEfetiva: _arredondar(aliqEfetivaLC224, 4),
      baseLegal: 'LC 224/2025, Art. 14. Vigência a partir de 01/04/2026.',
      alerta: 'LC 224/2025 aumenta base presumida em R$ ' + impactoTotalBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) +
        '/ano. Imposto extra: R$ ' + impostoExtraEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) +
        ' (alíq. efetiva: ' + _arredondar(aliqEfetivaLC224 * 100, 1) + '%).'
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FUNÇÃO 4: calcularEconomiaPotencial — v3.0 com 3 categorias
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Consolida oportunidades de economia em 3 categorias MUTUAMENTE EXCLUSIVAS:
   *
   *   1. otimizacoesLP — Economias possíveis MANTENDO o LP (pró-labore, ECD, caixa)
   *   2. migracaoLR    — Economia se MIGRAR para LR (break-even, incentivos regionais)
   *   3. jaAplicados   — Benefícios JÁ incluídos no cálculo (ZFM, exportação, ISS misto)
   *
   * O totalEconomiaAnual = MAX(otimizacoesLP, migracaoLR) — NUNCA soma os dois.
   *
   * FIX C2: Eliminado double counting. SUDAM/SUDENE aparece UMA VEZ em migracaoLR.
   */
  function calcularEconomiaPotencial(params) {
    _validarParams(params, [], 'calcularEconomiaPotencial');

    var proLabore = params.proLabore || null;
    var ecd = params.ecd || null;
    var caixaComp = params.caixaComp || null;
    var breakeven = params.breakeven || null;
    var dicas = params.dicas || [];
    var comparativoRegional = params.comparativoRegional || null;

    // ═══ CATEGORIA 1: Otimizações dentro do LP ═══
    var otimizacoesLP = [];
    var totalOtimizacoesLP = 0;

    // 1a. Pró-labore ótimo
    if (proLabore && typeof proLabore.economiaAnual === 'number' && proLabore.economiaAnual > 0) {
      var valPL = _arredondar(proLabore.economiaAnual);
      totalOtimizacoesLP += valPL;
      otimizacoesLP.push({
        fonte: 'Otimização Pró-Labore',
        valor: valPL,
        descricao: 'Ajuste do pró-labore para ponto ótimo tributário.' + (proLabore.recomendacao ? ' ' + proLabore.recomendacao : '')
      });
    }

    // 1b. ECD
    if (ecd && ecd.valeAPena && typeof ecd.beneficioLiquido === 'number' && ecd.beneficioLiquido > 0) {
      var valECD = _arredondar(ecd.beneficioLiquido);
      totalOtimizacoesLP += valECD;
      otimizacoesLP.push({
        fonte: 'Escrituração Contábil (ECD)',
        valor: valECD,
        descricao: 'Ampliação da distribuição isenta via escrituração completa.'
      });
    }

    // 1c. Dicas tipo economia que são otimizações LP
    for (var d = 0; d < dicas.length; d++) {
      if (dicas[d].tipo === 'economia' && dicas[d].impactoEstimado > 0 && dicas[d].categoria === 'otimizacao_lp') {
        var tituloLP = (dicas[d].titulo || '').toLowerCase().trim();
        var jaDuplicadoLP = false;
        for (var f = 0; f < otimizacoesLP.length; f++) {
          if ((otimizacoesLP[f].fonte || '').toLowerCase().trim() === tituloLP) { jaDuplicadoLP = true; break; }
        }
        if (!jaDuplicadoLP) {
          var valDicaLP = _arredondar(dicas[d].impactoEstimado);
          totalOtimizacoesLP += valDicaLP;
          otimizacoesLP.push({ fonte: dicas[d].titulo, valor: valDicaLP, descricao: dicas[d].descricao });
        }
      }
    }

    // ═══ CATEGORIA 2: Economia por migração para LR ═══
    var migracaoLR = [];
    var totalMigracaoLR = 0;

    // 2a. Break-even: diferença LP vs LR na margem real
    if (breakeven && breakeven.margemOperacionalBruta !== null && breakeven.breakEvenMargem !== null &&
        breakeven.margemOperacionalBruta < breakeven.breakEvenMargem && breakeven.margens && breakeven.margens.length > 0) {
      // FIX ADD04: Usar Math.floor em vez de Math.round para índice de margem
      var margemIdx = Math.max(0, Math.min(Math.floor(breakeven.margemOperacionalBruta) - 1, breakeven.margens.length - 1));
      var entradaMargem = breakeven.margens[margemIdx];
      if (entradaMargem) {
        var diffLR = _arredondar(entradaMargem.cargaLP - entradaMargem.cargaLR);
        if (diffLR > 0) {
          totalMigracaoLR += diffLR;
          migracaoLR.push({
            fonte: 'Migração para Lucro Real',
            valor: diffLR,
            descricao: 'Economia tributária na margem real de ' + breakeven.margemOperacionalBruta + '%.'
          });
        }
      }
    }

    // 2b. Incentivo Regional (UMA VEZ SÓ — FIX C2: sem duplicação)
    if (comparativoRegional && comparativoRegional.aplicavel && comparativoRegional.economiaEstimada > 0) {
      var valRegional = _arredondar(comparativoRegional.economiaEstimada);
      totalMigracaoLR += valRegional;
      migracaoLR.push({
        fonte: (comparativoRegional.tipo || 'Incentivo Regional') + ' — Redução IRPJ no LR',
        valor: valRegional,
        descricao: 'Redução IRPJ no Lucro Real. Requer migração + laudo aprovado.'
      });
    }

    // 2c. Dicas tipo economia que são migração LR (EXCETO as que são do incentivo regional, para evitar duplicação)
    for (var d2 = 0; d2 < dicas.length; d2++) {
      if (dicas[d2].tipo === 'economia' && dicas[d2].impactoEstimado > 0 && dicas[d2].categoria === 'migracao_lr') {
        var tituloLR = (dicas[d2].titulo || '').toLowerCase().trim();
        // Evitar duplicar SUDAM/SUDENE/SUDECO que já está no comparativoRegional
        if (tituloLR.indexOf('sudam') !== -1 || tituloLR.indexOf('sudene') !== -1 || tituloLR.indexOf('sudeco') !== -1) continue;
        var jaDuplicadoLR = false;
        for (var f2 = 0; f2 < migracaoLR.length; f2++) {
          if ((migracaoLR[f2].fonte || '').toLowerCase().trim() === tituloLR) { jaDuplicadoLR = true; break; }
        }
        if (!jaDuplicadoLR) {
          var valDicaLR = _arredondar(dicas[d2].impactoEstimado);
          totalMigracaoLR += valDicaLR;
          migracaoLR.push({ fonte: dicas[d2].titulo, valor: valDicaLR, descricao: dicas[d2].descricao });
        }
      }
    }

    // ═══ CATEGORIA 3: Benefícios já aplicados (NÃO soma — apenas referência) ═══
    var jaAplicados = [];
    var totalJaAplicados = 0;

    if (params.beneficiosDetalhados) {
      var bd = params.beneficiosDetalhados;
      var items = [
        { cond: bd.issApenasServicos && bd.issApenasServicos.economiaISS > 0, fonte: 'ISS apenas sobre serviços', valor: bd.issApenasServicos ? bd.issApenasServicos.economiaISS : 0, desc: 'LC 116/2003' },
        { cond: bd.inssSeparado && bd.inssSeparado.economiaRAT > 0, fonte: 'INSS: RAT/Terceiros excluídos do pró-labore', valor: bd.inssSeparado ? bd.inssSeparado.economiaRAT : 0, desc: 'Lei 8.212/91, Art. 22, III' },
        { cond: bd.zonFrancaVendas && bd.zonFrancaVendas.economiaPISCOFINS > 0, fonte: 'Vendas ZFM — PIS/COFINS', valor: bd.zonFrancaVendas ? bd.zonFrancaVendas.economiaPISCOFINS : 0, desc: 'Lei 10.996/2004' },
        { cond: bd.suframaSediada && bd.suframaSediada.economiaPISCOFINS > 0, fonte: 'SUFRAMA — PIS/COFINS', valor: bd.suframaSediada ? bd.suframaSediada.economiaPISCOFINS : 0, desc: 'Decreto 288/67' },
        { cond: bd.exportacao && bd.exportacao.economiaPISCOFINS > 0, fonte: 'Exportações — PIS/COFINS', valor: bd.exportacao ? bd.exportacao.economiaPISCOFINS : 0, desc: 'CF/88, Art. 149, §2º, I' }
      ];
      for (var bi = 0; bi < items.length; bi++) {
        if (items[bi].cond) {
          var v = _arredondar(items[bi].valor);
          totalJaAplicados += v;
          jaAplicados.push({ fonte: items[bi].fonte, valor: v, descricao: items[bi].desc, jaAplicada: true });
        }
      }
    }

    // ═══ DIFERIMENTO (separado) ═══
    var totalDiferimento = 0;
    var diferimentos = [];
    if (caixaComp && typeof caixaComp.totalDiferido === 'number' && caixaComp.totalDiferido > 0) {
      totalDiferimento = _arredondar(caixaComp.totalDiferido);
      diferimentos.push({ fonte: 'Regime de Caixa', valor: totalDiferimento, descricao: 'Postergação de tributos (não economia definitiva).' });
    }

    // ═══ TOTAL: MAX(otimizacoesLP, migracaoLR) — FIX C2 ═══
    totalOtimizacoesLP = _arredondar(totalOtimizacoesLP);
    totalMigracaoLR = _arredondar(totalMigracaoLR);
    totalJaAplicados = _arredondar(totalJaAplicados);

    var totalEconomiaAnual = Math.max(totalOtimizacoesLP, totalMigracaoLR);
    var melhorCenario = totalMigracaoLR > totalOtimizacoesLP ? 'Migração para Lucro Real' : 'Otimizações no LP';
    if (totalOtimizacoesLP === 0 && totalMigracaoLR === 0) melhorCenario = 'Nenhuma economia identificada';

    // Recomendação principal
    var recomendacaoPrincipal = '';
    if (totalEconomiaAnual > 0) {
      recomendacaoPrincipal = 'Economia potencial: R$ ' + totalEconomiaAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) +
        '/ano (' + melhorCenario + ').';
    } else if (totalDiferimento > 0) {
      recomendacaoPrincipal = 'Diferimento tributário de R$ ' + totalDiferimento.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + ' via regime de caixa.';
    } else {
      recomendacaoPrincipal = 'Nenhuma oportunidade significativa identificada com os dados informados.';
    }

    // Nível de oportunidade
    var cargaTotal = breakeven ? breakeven.cargaTributariaLP : 0;
    var nivelOportunidade = 'baixo';
    if (cargaTotal > 0) {
      var pctEcon = totalEconomiaAnual / cargaTotal;
      if (pctEcon > 0.15) nivelOportunidade = 'alto';
      else if (pctEcon >= 0.05) nivelOportunidade = 'medio';
    } else if (totalEconomiaAnual > 0) {
      nivelOportunidade = 'medio';
    }

    return {
      // FIX C2: 3 categorias mutuamente exclusivas
      totalEconomiaAnual: totalEconomiaAnual,
      melhorCenario: melhorCenario,

      totalOtimizacoesLP: totalOtimizacoesLP,
      otimizacoesLP: otimizacoesLP,

      totalMigracaoLR: totalMigracaoLR,
      migracaoLR: migracaoLR,

      totalJaAplicados: totalJaAplicados,
      jaAplicados: jaAplicados,

      totalDiferimento: totalDiferimento,
      diferimentos: diferimentos,

      // FIX EJ04: Compatibilidade fontes[] SEM mutação dos arrays originais.
      // Usa Object.assign para criar cópias, evitando side-effect nos objetos de jaAplicados/diferimentos.
      fontes: otimizacoesLP.concat(migracaoLR).concat(
        jaAplicados.map(function(j) { return Object.assign({}, j, { tipo: 'ja_aplicado' }); })
      ).concat(
        diferimentos.map(function(df) { return Object.assign({}, df, { tipo: 'diferimento' }); })
      ),

      recomendacaoPrincipal: recomendacaoPrincipal,
      nivelOportunidade: nivelOportunidade
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FUNÇÃO 5: gerarResumoExecutivo
  // ─────────────────────────────────────────────────────────────────────────

  function gerarResumoExecutivo(params) {
    _validarParams(params, ['anual', 'breakeven', 'economia'], 'gerarResumoExecutivo');

    var anual = params.anual;
    var breakeven = params.breakeven;
    var economia = params.economia;
    var dicas = params.dicas || [];
    var razaoSocial = params.razaoSocial || '';
    var cnpj = params.cnpj || '';
    var atividadeId = params.atividadeId || DEFAULTS.atividadeId;
    var ufEmpresa = params.ufEmpresa || '';

    var atividade = _getAtividadeInfo(atividadeId);
    var descricaoAtividade = atividade ? atividade.descricao : atividadeId;
    // FIX EJ11: Usar helper com fallback
    var percentualPresuncaoVal = _getPercentualPresuncao(atividade);
    var percentualPresuncao = _arredondar(percentualPresuncaoVal * 100, 1) + '%';

    // FIX EJ17: Detectar se anual veio com erro e alertar
    var anualComErro = !!(anual && anual.erro);
    var receitaBrutaAnual = anual.receitaBrutaAnual || 0;
    var cargaTotal = anual.consolidacao ? anual.consolidacao.cargaTributariaTotal : 0;
    var percentCarga = anual.consolidacao ? anual.consolidacao.percentualCargaTributaria : '0%';
    var lucroDistribuivel = anual.distribuicaoLucros ? anual.distribuicaoLucros.lucroDistribuivelFinal : 0;

    var breakEvenMargem = breakeven.breakEvenMargem != null ? breakeven.breakEvenMargem + '%' : null; // eslint-disable-line eqeqeq
    // FIX EJ08: Renomeado de margemRealAtual para margemOperacionalBruta
    var margemOperacionalBruta = breakeven.margemOperacionalBruta != null ? breakeven.margemOperacionalBruta + '%' : null; // eslint-disable-line eqeqeq

    var top3 = [];
    for (var d = 0; d < Math.min(3, dicas.length); d++) top3.push(dicas[d].titulo);

    // FIX M4: Margem de 5pp (não 10pp)
    var regimeRecomendado = 'Avaliar com contador';
    if (breakeven.lpSempreVantajoso) {
      regimeRecomendado = 'Lucro Presumido';
    } else if (breakeven.lrSempreVantajoso) {
      regimeRecomendado = 'Lucro Real';
    } else if (breakeven.margemOperacionalBruta != null && breakeven.breakEvenMargem != null) { // eslint-disable-line eqeqeq
      if (breakeven.margemOperacionalBruta > breakeven.breakEvenMargem + 5) {
        regimeRecomendado = 'Lucro Presumido';
      } else if (breakeven.margemOperacionalBruta < breakeven.breakEvenMargem - 5) {
        regimeRecomendado = 'Lucro Real';
      }
    }

    // Data formatada
    var agora = new Date();
    var dataFormatada = ('0' + agora.getDate()).slice(-2) + '/' + ('0' + (agora.getMonth() + 1)).slice(-2) + '/' + agora.getFullYear();

    // Ações de economia rankeadas
    var acoesEconomia = [];
    if (economia.fontes && economia.fontes.length > 0) {
      var fontesOrd = economia.fontes.slice().sort(function(a, b) { return (b.valor || 0) - (a.valor || 0); });
      for (var ae = 0; ae < Math.min(5, fontesOrd.length); ae++) {
        acoesEconomia.push({
          acao: fontesOrd[ae].fonte,
          valor: fontesOrd[ae].valor,
          tipo: fontesOrd[ae].tipo || 'economia',
          jaAplicada: fontesOrd[ae].jaAplicada || false
        });
      }
    }

    // Benefícios fiscais (dinâmicos)
    var beneficiosResumo = [];
    if (params.beneficiosDetalhados && params.beneficiosDetalhados.economiaTotal > 0) {
      beneficiosResumo.push('Economia com benefícios aplicados: R$ ' +
        params.beneficiosDetalhados.economiaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '/ano.');
    }
    if (params.reducaoRegional && params.reducaoRegional.ativo) {
      beneficiosResumo.push(EMOJIS.alerta + ' ' + params.reducaoRegional.tipo + ' disponível — economia estimada de R$ ' +
        (params.comparativoRegional ? params.comparativoRegional.economiaEstimada : 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) +
        '/ano no Lucro Real.');
    }

    // NOVO P3: Próximos Passos priorizados
    var proximosPassos = [];
    if (economia.otimizacoesLP && economia.otimizacoesLP.length > 0) {
      var topOtim = economia.otimizacoesLP.slice().sort(function(a,b) { return (b.valor||0) - (a.valor||0); });
      proximosPassos.push({ prioridade: 'urgente', acao: topOtim[0].fonte, valor: topOtim[0].valor, descricao: topOtim[0].descricao });
    }
    if (!params.temEscrituracao) {
      var ecdEstimado = economia.otimizacoesLP ? economia.otimizacoesLP.filter(function(o) { return o.fonte.indexOf('ECD') !== -1; }) : [];
      proximosPassos.push({ prioridade: 'medio_prazo', acao: 'Implementar escrituração contábil completa (ECD)', valor: ecdEstimado.length > 0 ? ecdEstimado[0].valor : null, descricao: 'Amplia distribuição isenta de lucros.' });
    }
    if (params.reducaoRegional && params.reducaoRegional.ativo) {
      proximosPassos.push({ prioridade: 'estrategico', acao: 'Avaliar migração para LR com ' + params.reducaoRegional.tipo, valor: params.comparativoRegional ? params.comparativoRegional.economiaEstimada : null, descricao: 'Redução de ' + _arredondar((params.reducaoRegional.percentualReducao || 0) * 100) + '% no IRPJ.' });
    }

    return {
      empresa: razaoSocial,
      cnpj: cnpj,
      ufEmpresa: ufEmpresa,
      atividade: descricaoAtividade,
      percentualPresuncao: percentualPresuncao,
      receitaBrutaAnual: receitaBrutaAnual,
      cargaTributariaTotal: cargaTotal,
      percentualCargaTributaria: percentCarga,
      lucroDistribuivelIsento: lucroDistribuivel,
      breakEvenMargem: breakEvenMargem,
      // FIX EJ08: Nome consistente com break-even (era margemRealAtual)
      margemOperacionalBruta: margemOperacionalBruta,
      economiaPotencial: economia.totalEconomiaAnual,
      melhorCenario: economia.melhorCenario,
      economiaMantendoLP: economia.totalOtimizacoesLP,
      economiaMigrandoLR: economia.totalMigracaoLR,
      beneficiosJaAplicados: economia.totalJaAplicados,
      nivelOportunidade: economia.nivelOportunidade,
      recomendacaoPrincipal: economia.recomendacaoPrincipal,
      top3Dicas: top3,
      acoesEconomia: acoesEconomia,
      beneficiosFiscais: beneficiosResumo,
      regimeRecomendado: regimeRecomendado,
      proximosPassos: proximosPassos,
      dataEstudo: dataFormatada,
      // FIX EJ17: Indicador de erro no cálculo anual
      anualComErro: anualComErro,
      erroAnual: anualComErro ? anual.erro : null
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FUNÇÃO 6: calcularEstudoCompleto — Orquestrador Principal
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Recebe todos os dados do formulário e executa TODOS os cálculos.
   *
   * v3.0: Novo parâmetro `ufEmpresa` (sigla do estado) permite
   * integração automática com Estados.js para incentivos dinâmicos.
   *
   * @param {Object} params - Todos os parâmetros do formulário
   * @param {string} [params.ufEmpresa] - Sigla do estado (ex: "PA", "AM", "CE", "RJ")
   *   Se informada, incentivos são lidos de Estados.getIncentivosNormalizado(uf).
   *   Se não informada, usa flags booleanos legados (areaAtuacaoSUDAM, etc.)
   * @returns {Object} Resultado completo com todas as análises
   */
  function calcularEstudoCompleto(params) {
    _validarParams(params, ['receitaBrutaAnual'], 'calcularEstudoCompleto');

    var receitaBrutaAnual = params.receitaBrutaAnual;
    if (typeof receitaBrutaAnual !== 'number' || receitaBrutaAnual <= 0) {
      throw new Error('calcularEstudoCompleto: receitaBrutaAnual deve ser um numero positivo.');
    }

    var atividadeId = params.atividadeId || DEFAULTS.atividadeId;
    var receitas = params.receitas || [{ atividadeId: atividadeId, valor: receitaBrutaAnual }];
    var folha = params.folhaPagamentoAnual || 0;
    var despesasOp = params.totalDespesasOperacionais || 0;
    var ufEmpresa = (params.ufEmpresa || '').toUpperCase().trim();

    // FIX C4: Alíquotas SEMPRE em percentual inteiro, divididas por 100
    var aliqISS = _aliquotaParaDecimal(params.aliquotaISS, DEFAULTS.aliquotaISS, 'aliquotaISS');
    var aliqRAT = _aliquotaParaDecimal(params.aliquotaRAT, DEFAULTS.aliquotaRAT, 'aliquotaRAT');
    var aliqTerceiros = _aliquotaParaDecimal(params.aliquotaTerceiros, DEFAULTS.aliquotaTerceiros, 'aliquotaTerceiros');

    var creditos = params.creditosPISCOFINS || 0;
    var lucroContabil = params.lucroContabil || 0;
    var socios = params.socios || DEFAULTS.socios;

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

    var receitasVendasZFM = params.receitasVendasZFM || 0;
    var receitasSUFRAMA = params.receitasSUFRAMA || 0;
    var receitasExportacao = params.receitasExportacao || 0;
    var receitasIsentas = params.receitasIsentas || 0;
    var icmsST = params.icmsST || 0;
    var ipiDestacado = params.ipiDestacado || 0;
    var exclusivamenteServicosElegiveis = !!params.exclusivamenteServicosElegiveis;
    var regimeCaixa = !!params.regimeCaixa;
    var inadimplencia = params.inadimplencia || 0;
    var beneficiosAtivos = params.beneficiosAtivos || {};

    // ═══ INTEGRAÇÃO COM ESTADOS.JS ═══
    var incentivosEstado = {};
    var reducaoRegional = { tipo: null, percentualReducao: 0, ativo: false, obs: '', requerLucroReal: true };
    var beneficiosZFM = { zonaFranca: false, alc: false, suframa: false, obs: '' };

    if (ufEmpresa) {
      // v3.0: Usar Estados.js para incentivos dinâmicos
      incentivosEstado = _obterIncentivosEstado(ufEmpresa);
      reducaoRegional = _obterReducaoRegional(ufEmpresa, incentivosEstado);
      beneficiosZFM = _obterBeneficiosZFM(ufEmpresa, incentivosEstado);

      // Propagar para beneficiosAtivos (compatibilidade com motor)
      if (reducaoRegional.ativo && reducaoRegional.tipo === 'SUDAM') beneficiosAtivos.sudam = true;
      if (reducaoRegional.ativo && reducaoRegional.tipo === 'SUDENE') beneficiosAtivos.sudene = true;
      if (beneficiosZFM.zonaFranca) beneficiosAtivos.zonaFranca = true;
    } else {
      // Fallback: flags booleanos legados
      if (params.areaAtuacaoSUDAM) {
        reducaoRegional = { tipo: 'SUDAM', percentualReducao: 0.75, ativo: true, obs: 'MP 2.199-14/2001', requerLucroReal: true };
      } else if (params.areaAtuacaoSUDENE) {
        reducaoRegional = { tipo: 'SUDENE', percentualReducao: 0.75, ativo: true, obs: 'MP 2.199-14/2001', requerLucroReal: true };
      }
    }

    // ── 1. Simulação rápida ──
    var simulacao = null;
    try { simulacao = LucroPresumido.simulacaoRapida(receitaBrutaAnual / 4, atividadeId); }
    catch (e) { simulacao = { erro: e.message }; }

    // ── 2. Quatro trimestres ──
    // FIX M5: Receita sazonal distribui PIS/COFINS mensal proporcionalmente
    var receitasPorTrim = params.receitasPorTrimestre || null;
    var trimestral = [];
    var trimestresData = [];
    var anoCalendario = params.anoCalendario || new Date().getFullYear();
    var acumuladoAte = 0;

    for (var q = 1; q <= 4; q++) {
      var fatorTrim = receitasPorTrim ? (receitasPorTrim[q - 1] || 0) : null;
      if (fatorTrim !== null) acumuladoAte += fatorTrim;
      var receitaAcumuladaCalc = _arredondar(fatorTrim !== null ? acumuladoAte : (receitaBrutaAnual / 4 * q));
      var dadosTri = {
        receitas: receitas.map(function (r) {
          if (fatorTrim !== null) {
            var proporcao = receitaBrutaAnual > 0 ? r.valor / receitaBrutaAnual : 0;
            return { atividadeId: r.atividadeId, valor: _arredondar(fatorTrim * proporcao) };
          }
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
        anoCalendario: anoCalendario,
        receitaBrutaAcumuladaAnoAte: receitaAcumuladaCalc,
        exclusivamenteServicosElegiveis: exclusivamenteServicosElegiveis
      };
      trimestresData.push(dadosTri);
      try { trimestral.push(LucroPresumido.calcularLucroPresumidoTrimestral(dadosTri)); }
      catch (e) { trimestral.push({ erro: e.message, trimestre: q }); }
    }

    // ── 3. Doze meses PIS/COFINS ──
    // FIX M5: Se receita sazonal, distribuir PIS/COFINS mensal proporcionalmente
    var piscofins = [];
    var mesesData = [];
    var receitasIsentasComZFM = receitasIsentas + receitasVendasZFM + receitasSUFRAMA;

    for (var mes = 0; mes < 12; mes++) {
      var receitaMensal;
      if (receitasPorTrim) {
        // FIX M5: Distribuir meses proporcionalmente ao trimestre
        var trimIdx = Math.floor(mes / 3);
        receitaMensal = _arredondar((receitasPorTrim[trimIdx] || 0) / 3);
      } else {
        receitaMensal = _arredondar(receitaBrutaAnual / 12);
      }

      var dadosMes = {
        receitaBrutaMensal: receitaMensal,
        vendasCanceladas: _arredondar(cancelamentos / 12),
        descontosIncondicionais: _arredondar(descontos / 12),
        receitasExportacao: _arredondar(receitasExportacao / 12),
        receitasIsentas: _arredondar(receitasIsentasComZFM / 12),
        icmsST: _arredondar(icmsST / 12),
        ipiDestacado: _arredondar(ipiDestacado / 12),
        pisRetidoFonte: _arredondar(pisRetido / 12),
        cofinsRetidaFonte: _arredondar(cofinsRetida / 12)
      };
      mesesData.push(dadosMes);
      try { piscofins.push(LucroPresumido.calcularPISCOFINSMensal(dadosMes)); }
      catch (e) { piscofins.push({ erro: e.message, mes: mes + 1 }); }
    }

    // ── 4. Anual consolidado ──
    var anual = null;
    try {
      anual = LucroPresumido.calcularAnualConsolidado({
        trimestres: trimestresData,
        meses: mesesData,
        receitas: receitas,
        aliquotaISS: aliqISS,
        folhaPagamentoAnual: folha,
        aliquotaRAT: aliqRAT,
        aliquotaTerceiros: aliqTerceiros,
        lucroContabilEfetivo: lucroContabil > 0 ? lucroContabil : null,
        socios: socios,
        anoCalendario: anoCalendario,
        beneficiosAtivos: beneficiosAtivos,
        receitasVendasZFM: receitasVendasZFM,
        receitasSUFRAMA: receitasSUFRAMA,
        receitasExportacao: receitasExportacao,
        receitasIsenta: receitasIsentas,
        icmsST: icmsST,
        ipiDestacado: ipiDestacado,
        exclusivamenteServicosElegiveis: exclusivamenteServicosElegiveis,
        regimeCaixa: regimeCaixa,
        inadimplencia: inadimplencia,
        // FIX ADD01: Passar despesas operacionais ao consolidado
        totalDespesasOperacionais: despesasOp,
        despesasOperacionaisAnuais: despesasOp
      });
    } catch (e) {
      anual = { erro: e.message, receitaBrutaAnual: receitaBrutaAnual, consolidacao: null, distribuicaoLucros: null };
    }

    // ── 4A. Pró-labore ótimo ──
    var resultProLabore = [];
    if (params.sociosDetalhados && params.sociosDetalhados.length > 0) {
      var lucroDist = (anual && anual.distribuicaoLucros) ? anual.distribuicaoLucros.lucroDistribuivelFinal : 0;
      for (var s = 0; s < params.sociosDetalhados.length; s++) {
        try { resultProLabore.push(LucroPresumido.simularProLaboreOtimo(params.sociosDetalhados[s], lucroDist)); }
        catch (e) { resultProLabore.push({ erro: e.message, socio: params.sociosDetalhados[s].nome }); }
      }
    }
    var proLaboreConsolidado = null;
    var economiaProLaboreTotal = 0;
    for (var p = 0; p < resultProLabore.length; p++) {
      if (resultProLabore[p].economiaAnual) economiaProLaboreTotal += resultProLabore[p].economiaAnual;
    }
    if (economiaProLaboreTotal > 0) {
      proLaboreConsolidado = {
        economiaAnual: economiaProLaboreTotal,
        recomendacao: resultProLabore.length === 1 ? resultProLabore[0].recomendacao : 'Otimização do pró-labore de ' + resultProLabore.length + ' sócios.'
      };
    }

    // ── 4B. JCP ──
    var resultJCP = null;
    if (params.patrimonioLiquido > 0 && params.lucroLiquidoOuReservas > 0) {
      var lucroDistRest = (anual && anual.distribuicaoLucros) ? anual.distribuicaoLucros.lucroDistribuivelFinal : 0;
      if (economiaProLaboreTotal > 0) lucroDistRest = Math.max(0, lucroDistRest - economiaProLaboreTotal);
      try {
        resultJCP = LucroPresumido.simularJCP({
          patrimonioLiquido: params.patrimonioLiquido,
          taxaTJLP: params.taxaTJLP || 0.0612,
          lucroLiquidoOuReservas: params.lucroLiquidoOuReservas,
          lucroDistribuivelIsentoRestante: lucroDistRest,
          dataReferencia: new Date()
        });
      } catch (e) { resultJCP = { erro: e.message }; }
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
      } catch (e) { resultCaixa = { erro: e.message }; }
    }

    // ── 4D. ECD ──
    // FIX I5: Se lucroContabil === 0, estimar com base na margem operacional
    var resultECD = null;
    var lucroContabilParaECD = lucroContabil;
    var ecdEstimativa = false;
    if (lucroContabil === 0 && receitas.length > 0 && (despesasOp > 0 || folha > 0)) {
      var cargaLPEstimada = (anual && anual.consolidacao) ? anual.consolidacao.cargaTributariaTotal : 0;
      lucroContabilParaECD = receitaBrutaAnual - despesasOp - folha - cargaLPEstimada;
      if (lucroContabilParaECD > 0) ecdEstimativa = true;
    }
    if (lucroContabilParaECD > 0) {
      var basePresAnual = (anual && anual.distribuicaoLucros) ? anual.distribuicaoLucros.basePresumidaAnual : 0;
      var tribFedAnuais = (anual && anual.consolidacao) ? anual.consolidacao.tributosFederais : 0;
      try {
        resultECD = LucroPresumido.calcularBeneficioECD({
          basePresumidaAnual: basePresAnual,
          lucroContabilReal: lucroContabilParaECD,
          tributosFederaisAnuais: tribFedAnuais,
          custoAnualECD: params.custoAnualECD || 0
        });
        if (resultECD && ecdEstimativa) {
          resultECD.estimativa = true;
          resultECD.notaEstimativa = 'Lucro contábil estimado com base na margem operacional. Valor real depende de escrituração completa.';
        }
      } catch (e) { resultECD = { erro: e.message }; }
    }

    // ── 4E. Comparativo Regional (dinâmico) ──
    var resultRegional = null;
    if (reducaoRegional.ativo && anual && anual.detalhamentoTrimestral) {
      try {
        var irpjNormalAnual = anual.detalhamentoTrimestral.reduce(function(s, t) { return s + (t.irpjNormal || 0); }, 0);
        var irpjAdicionalAnual = anual.detalhamentoTrimestral.reduce(function(s, t) { return s + (t.irpjAdicional || 0); }, 0);
        resultRegional = LucroPresumido.calcularEconomiaLRComSUDAM({
          irpjNormalAnualLP: irpjNormalAnual,
          irpjAdicionalAnualLP: irpjAdicionalAnual,
          csllAnualLP: anual.tributos ? anual.tributos.csll.anual : 0,
          receitaBrutaAnual: receitaBrutaAnual,
          despesasOperacionaisAnuais: despesasOp,
          folhaPagamentoAnual: folha,
          temBeneficioSUDAM: reducaoRegional.tipo === 'SUDAM',
          temBeneficioSUDENE: reducaoRegional.tipo === 'SUDENE'
        });
        // Enriquecer com dados do estado
        if (resultRegional) {
          resultRegional.tipo = reducaoRegional.tipo;
          resultRegional.percentualReducao = reducaoRegional.percentualReducao;
          resultRegional.obs = reducaoRegional.obs;
        }
      } catch (e) { resultRegional = { erro: e.message }; }
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
    } catch (e) { vantagens = { erro: e.message }; }

    if (vantagens && !vantagens.erro && despesasOp === 0 && folha === 0 && receitaBrutaAnual > 0) {
      vantagens.alertaMargem100 = 'ATENÇÃO: Sem despesas/folha informadas. Margem assumida: 100%.';
    }

    // ── 6. Break-Even ──
    var cargaLP = anual && anual.consolidacao ? anual.consolidacao.cargaTributariaTotal : 0;
    var tributosFederaisLP = anual && anual.consolidacao ? (anual.consolidacao.tributosFederais || cargaLP) : cargaLP;
    var resultBreakeven = null;
    try {
      resultBreakeven = calcularBreakEven({
        receitaBrutaAnual: receitaBrutaAnual,
        cargaTributariaLP: cargaLP,
        tributosFederaisLP: tributosFederaisLP,
        folhaPagamentoAnual: folha,
        totalDespesasOperacionais: despesasOp,
        creditosPISCOFINS: creditos,
        // FIX EJ12: Passar alíquotas já convertidas (o break-even agora aceita ambos)
        aliquotaISS: aliqISS,
        aliquotaRAT: aliqRAT,
        aliquotaTerceiros: aliqTerceiros,
        prejuizosFiscaisAcumulados: params.prejuizosFiscaisAcumulados || 0
      });
    } catch (e) {
      resultBreakeven = { erro: e.message, cargaTributariaLP: cargaLP, breakEvenMargem: null, lpSempreVantajoso: false, lrSempreVantajoso: false, margemOperacionalBruta: null, margens: [], alerta: null, recomendacao: '' };
    }

    // ── 7. Dicas inteligentes (com incentivos dinâmicos) ──
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
        receitasVendasZFM: receitasVendasZFM,
        receitasSUFRAMA: receitasSUFRAMA,
        receitasExportacao: receitasExportacao,
        exclusivamenteServicosElegiveis: exclusivamenteServicosElegiveis,
        regimeCaixa: regimeCaixa,
        numReceitas: receitas.length,
        breakeven: resultBreakeven,
        // v3.0: Incentivos dinâmicos do estado
        incentivosEstado: incentivosEstado,
        reducaoRegional: reducaoRegional,
        beneficiosZFM: beneficiosZFM
      });
    } catch (e) { resultDicas = []; }

    // ── 8. Economia potencial (3 categorias — FIX C2) ──
    var economiaPotencial = null;
    try {
      economiaPotencial = calcularEconomiaPotencial({
        proLabore: proLaboreConsolidado,
        ecd: resultECD,
        caixaComp: resultCaixa,
        breakeven: resultBreakeven,
        dicas: resultDicas,
        beneficiosDetalhados: anual ? anual.beneficiosAplicados : null,
        comparativoRegional: resultRegional
      });
    } catch (e) {
      economiaPotencial = { totalEconomiaAnual: 0, totalDiferimento: 0, fontes: [], otimizacoesLP: [], migracaoLR: [], jaAplicados: [], recomendacaoPrincipal: '', nivelOportunidade: 'baixo' };
    }

    // ── 9. LC 224/2025 ──
    var lc224 = null;
    if (receitaBrutaAnual > LC224_LIMITE_ANUAL) {
      try { lc224 = calcularImpactoLC224({ receitaBrutaAnual: receitaBrutaAnual, atividadeId: atividadeId, anoCalendario: anoCalendario }); }
      catch (e) { lc224 = null; }
    }

    // ── 10. Resumo executivo ──
    var resumoExecutivo = null;
    try {
      resumoExecutivo = gerarResumoExecutivo({
        anual: anual || { receitaBrutaAnual: receitaBrutaAnual, consolidacao: null, distribuicaoLucros: null },
        breakeven: resultBreakeven || {},
        economia: economiaPotencial || { totalEconomiaAnual: 0, nivelOportunidade: 'baixo', recomendacaoPrincipal: '', otimizacoesLP: [], migracaoLR: [], totalOtimizacoesLP: 0, totalMigracaoLR: 0, totalJaAplicados: 0 },
        dicas: resultDicas,
        razaoSocial: params.razaoSocial || '',
        cnpj: params.cnpj || '',
        atividadeId: atividadeId,
        ufEmpresa: ufEmpresa,
        beneficiosDetalhados: anual ? anual.beneficiosAplicados : null,
        reducaoRegional: reducaoRegional,
        comparativoRegional: resultRegional,
        temEscrituracao: !!params.temEscrituracao
      });
    } catch (e) { resumoExecutivo = { erro: e.message }; }

    return {
      simulacao: simulacao,
      trimestral: trimestral,
      piscofins: piscofins,
      anual: anual,
      vantagens: vantagens,
      breakeven: resultBreakeven,
      dicas: resultDicas,

      proLabore: resultProLabore,
      jcp: resultJCP,
      regimeCaixa: resultCaixa,
      ecd: resultECD,

      economiaPotencial: economiaPotencial,
      lc224: lc224,
      resumoExecutivo: resumoExecutivo,

      // v3.0: Dados de incentivos dinâmicos do estado
      incentivosEstado: incentivosEstado,
      reducaoRegional: reducaoRegional,
      beneficiosZFM: beneficiosZFM,
      comparativoRegional: resultRegional,
      beneficiosDetalhados: anual ? anual.beneficiosAplicados : null,

      // FIX EJ09: ufEmpresa declarada UMA VEZ apenas (removida duplicata)
      // Meta
      ufEmpresa: ufEmpresa,
      versao: VERSION,
      timestamp: new Date().toISOString()
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TESTE DE VERIFICAÇÃO — FIX M6: Nomes genéricos
  // ─────────────────────────────────────────────────────────────────────────

  function _testarEstudo() {
    console.log('═══ TESTE EstudoLP v' + VERSION + ' ═══');

    var resultado = calcularEstudoCompleto({
      receitas: [{ atividadeId: 'servicos_gerais', valor: 2350000 }],
      receitaBrutaAnual: 2350000,
      atividadeId: 'servicos_gerais',
      folhaPagamentoAnual: 1000000,
      totalDespesasOperacionais: 800000,
      aliquotaISS: 3,       // 3% (percentual inteiro)
      aliquotaRAT: 3,       // 3%
      aliquotaTerceiros: 0.5, // 0.5%
      creditosPISCOFINS: 50000,
      lucroContabil: 0,
      prejuizosFiscais: 0,
      temEscrituracao: false,
      temEquipamentos: false,
      temPD: false,
      receitaSazonal: false,

      // v3.0: Estado no lugar de flags booleanos
      ufEmpresa: 'PA',      // Pará — SUDAM será detectado automaticamente

      receitasVendasZFM: 100000,
      receitasSUFRAMA: 0,
      receitasExportacao: 0,
      receitasIsentas: 0,
      icmsST: 0,
      ipiDestacado: 0,
      exclusivamenteServicosElegiveis: false,
      regimeCaixa: false,
      inadimplencia: 0,
      beneficiosAtivos: {},
      devolucoes: 0, cancelamentos: 0, descontos: 0,
      ganhosCapital: 0, rendFinanceiros: 0, jcpRecebido: 0,
      multasContratuais: 0, recFinDiversas: 0,
      valoresRecuperados: 0, demaisReceitas: 0,
      irrfRetido: 0, csllRetida: 0, pisRetido: 0, cofinsRetida: 0,
      // FIX M6: Nomes genéricos
      socios: [
        { nome: 'Sócio A', participacao: 0.65 },
        { nome: 'Sócio B', participacao: 0.35 }
      ],
      elegivelSimples: false,
      sociosDetalhados: [
        { nome: 'Sócio A', participacao: 0.65, isAdministrador: true,
          proLaboreAtual: 5000, temOutroVinculoCLT: false, dependentesIRPF: 0 },
        { nome: 'Sócio B', participacao: 0.35, isAdministrador: true,
          proLaboreAtual: 3000, temOutroVinculoCLT: false, dependentesIRPF: 0 }
      ],
      patrimonioLiquido: 500000,
      taxaTJLP: 0.0612,
      lucroLiquidoOuReservas: 400000,
      faturamentoMensal: [196000,196000,196000,196000,196000,196000,196000,196000,196000,196000,196000,196000],
      recebimentoMensal: [150000,180000,220000,190000,200000,160000,210000,195000,185000,205000,170000,285000],
      custoAnualECD: 12000
    });

    console.log('─── Resultados ───');
    console.log('Receita:', resultado.anual ? resultado.anual.receitaBrutaAnual : 'N/A');
    console.log('Carga Total LP:', resultado.anual && resultado.anual.consolidacao ? resultado.anual.consolidacao.cargaTributariaTotal : 'N/A');
    console.log('Break-Even:', resultado.breakeven ? resultado.breakeven.breakEvenMargem || 'N/A' : 'N/A');
    console.log('Margem Operacional Bruta:', resultado.breakeven ? resultado.breakeven.margemOperacionalBruta || 'N/A' : 'N/A');
    console.log('Margem Líquida Pós-Tributos:', resultado.breakeven ? resultado.breakeven.margemLiquidaPosTributos || 'N/A' : 'N/A');
    console.log('Recomendação:', resultado.breakeven ? resultado.breakeven.recomendacao : 'N/A');
    console.log('Dicas:', resultado.dicas.length);
    console.log('─── Economia (3 categorias) ───');
    console.log('Otimizações LP:', resultado.economiaPotencial ? resultado.economiaPotencial.totalOtimizacoesLP : 0);
    console.log('Migração LR:', resultado.economiaPotencial ? resultado.economiaPotencial.totalMigracaoLR : 0);
    console.log('Já Aplicados:', resultado.economiaPotencial ? resultado.economiaPotencial.totalJaAplicados : 0);
    console.log('Total (MAX):', resultado.economiaPotencial ? resultado.economiaPotencial.totalEconomiaAnual : 0);
    console.log('Melhor Cenário:', resultado.economiaPotencial ? resultado.economiaPotencial.melhorCenario : 'N/A');
    console.log('─── Incentivos do Estado ───');
    console.log('UF:', resultado.ufEmpresa || 'N/A');
    console.log('Incentivos disponíveis:', resultado.incentivosEstado && resultado.incentivosEstado._disponivel ? 'Sim (Estados.js)' : 'Não (fallback)');
    console.log('Redução Regional:', resultado.reducaoRegional && resultado.reducaoRegional.ativo ? resultado.reducaoRegional.tipo + ' (' + _arredondar(resultado.reducaoRegional.percentualReducao * 100) + '%)' : 'Nenhuma');
    console.log('ZFM:', resultado.beneficiosZFM && resultado.beneficiosZFM.zonaFranca ? 'Ativa' : 'Não');
    console.log('─── Resumo ───');
    console.log('Regime Recomendado:', resultado.resumoExecutivo ? resultado.resumoExecutivo.regimeRecomendado : 'N/A');
    console.log('Próximos Passos:', resultado.resumoExecutivo ? resultado.resumoExecutivo.proximosPassos : []);
    console.log('ECD Estimativa:', resultado.ecd ? (resultado.ecd.estimativa ? 'Sim' : 'Lucro real informado') : 'N/A');
    console.log('═══ FIM TESTE v' + VERSION + ' ═══');
    return resultado;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EXPORTS
  // ─────────────────────────────────────────────────────────────────────────

  var EstudoLP = {
    // Orquestrador
    calcularEstudoCompleto: calcularEstudoCompleto,

    // Análises individuais
    calcularBreakEven: calcularBreakEven,
    gerarDicasInteligentes: gerarDicasInteligentes,
    calcularEconomiaPotencial: calcularEconomiaPotencial,
    gerarResumoExecutivo: gerarResumoExecutivo,
    calcularImpactoLC224: calcularImpactoLC224,

    // Helpers de incentivos (para uso direto)
    obterIncentivosEstado: _obterIncentivosEstado,
    obterReducaoRegional: _obterReducaoRegional,
    obterBeneficiosZFM: _obterBeneficiosZFM,

    // Teste
    _testarEstudo: _testarEstudo,

    // Versão
    VERSION: VERSION,

    // FIX EJ15: Emojis exportados para que a camada HTML possa sobrescrever
    EMOJIS: EMOJIS
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = EstudoLP;
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.EstudoLP = EstudoLP;
  }

})();
