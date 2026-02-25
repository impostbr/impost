/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  COMPARADOR INTELIGENTE DE REGIMES TRIBUTÁRIOS  v3.0                       ║
 * ║  Motor unificado: Simples Nacional × Lucro Presumido × Lucro Real         ║
 * ║  INTEGRADO COM ESTADOS.JS — Dados reais por UF                            ║
 * ║  Fonte única de verdade para o Consultor de CNAE                          ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  AGROGEO BRASIL — Geotecnologia e Consultoria Ambiental                  ║
 * ║  Autor: Luis Fernando | Proprietário AGROGEO BRASIL                       ║
 * ║  Versão: 3.0.0 | Data: Fevereiro/2026                                    ║
 * ║  Localização: Novo Progresso, Pará (Amazônia Legal — SUDAM)              ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  NOVIDADES v3.0:                                                          ║
 * ║   ✅ Integração total com estados.js — leitura de dados reais por UF     ║
 * ║   ✅ ICMS real por estado (não mais 18% fixo)                            ║
 * ║   ✅ ISS real da capital do estado (não mais 5% fixo)                    ║
 * ║   ✅ FECOP/FECOEP por estado                                             ║
 * ║   ✅ Incentivos estaduais reais (programas além de SUDAM/SUDENE)        ║
 * ║   ✅ Sublimite ICMS/ISS real por estado                                  ║
 * ║   ✅ Taxas estaduais na composição de custo                              ║
 * ║   ✅ Dados da reforma tributária por estado                               ║
 * ║   ✅ Ficha tributária completa por estado para o consultor CNAE          ║
 * ║   ✅ Fallback gracioso se estados.js não estiver carregado               ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  Base Legal Consolidada:                                                   ║
 * ║   Simples Nacional:                                                        ║
 * ║    - LC 123/2006, LC 155/2016, Resolução CGSN 140/2018                   ║
 * ║   Lucro Presumido:                                                         ║
 * ║    - Lei 9.249/1995, Lei 9.430/1996, Lei 9.718/1998, RIR/2018            ║
 * ║   Lucro Real:                                                              ║
 * ║    - Decreto 9.580/2018 (RIR/2018), Lei 12.973/2014                      ║
 * ║   Reforma Tributária:                                                      ║
 * ║    - LC 214/2025 (IBS/CBS — impactos futuros)                            ║
 * ║   Incentivos Regionais:                                                    ║
 * ║    - SUDAM: Lei 12.973/2014, Art. 615-627 do RIR/2018                    ║
 * ║    - SUDENE: LC 125/2007, Art. 627 do RIR/2018                           ║
 * ║    - ZFM: Decreto-Lei 288/1967                                            ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  USO:                                                                      ║
 * ║   Browser: <script src="estados/[todos].js"></script>                     ║
 * ║            <script src="scripts/estados.js"></script>                      ║
 * ║            <script src="scripts/comparador-regimes.js"></script>          ║
 * ║            const resultado = ComparadorRegimes.comparar({...});            ║
 * ║                                                                            ║
 * ║   Node.js: const CR = require('./comparador-regimes');                     ║
 * ║            const resultado = CR.comparar({...});                           ║
 * ║                                                                            ║
 * ║  INTEGRAÇÃO COM CONSULTOR CNAE:                                           ║
 * ║   O consultor-cnae.js chama:                                              ║
 * ║     ComparadorRegimes.compararParaCNAE()  → ranking + recomendação       ║
 * ║     ComparadorRegimes.fichaTributariaUF() → dados completos do estado    ║
 * ║     ComparadorRegimes.dadosEstadoParaCNAE() → tributos reais             ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

(function (root) {
  'use strict';

  const CR = {};

  // ═══════════════════════════════════════════════════════════════════════════
  // 0. INTEGRAÇÃO COM ESTADOS.JS — PONTE DE DADOS REAIS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Obtém referência ao módulo Estados (browser ou Node)
   * @returns {Object|null}
   */
  function _getEstadosModule() {
    if (typeof window !== 'undefined') {
      return window.Estados || window.EstadosBR || null;
    }
    try {
      return require('./estados');
    } catch (e) {
      try {
        return require('../scripts/estados');
      } catch (e2) {
        return null;
      }
    }
  }

  /** Flag: indica se o módulo de estados está disponível */
  CR._estadosDisponivel = false;
  CR._estadosModule = null;

  /**
   * Inicializa a ponte com estados.js
   * Chamado automaticamente na primeira utilização
   */
  CR._initEstados = function () {
    if (CR._estadosModule) return CR._estadosModule;
    CR._estadosModule = _getEstadosModule();
    CR._estadosDisponivel = !!CR._estadosModule;
    if (CR._estadosDisponivel) {
      console.log('[ComparadorRegimes v3] ✅ estados.js detectado — usando dados reais por UF');
    } else {
      console.warn('[ComparadorRegimes v3] ⚠️ estados.js NÃO encontrado — usando fallback com valores estimados');
    }
    return CR._estadosModule;
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // 0.1 EXTRATOR DE DADOS REAIS DO ESTADO
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Cache de dados de estados já extraídos (evita reprocessamento)
   * @private
   */
  const _cacheEstadoDados = {};

  /**
   * Extrai TODOS os dados tributários relevantes de um estado via estados.js.
   * Retorna objeto padronizado com fallback para valores default se o dado
   * não estiver disponível.
   *
   * ESTE É O MÉTODO CENTRAL — todo o comparador usa ele para obter dados reais.
   *
   * @param {string} uf - Sigla do estado (ex: 'PA', 'SP', 'MT')
   * @returns {Object} Dados tributários completos e normalizados
   */
  CR.extrairDadosEstado = function (uf) {
    if (!uf) return _fallbackEstado('??');

    const sigla = uf.toUpperCase().trim();

    // Cache hit
    if (_cacheEstadoDados[sigla]) return _cacheEstadoDados[sigla];

    const E = CR._initEstados();

    // Se estados.js não está disponível, retorna fallback
    if (!E) {
      const fb = _fallbackEstado(sigla);
      _cacheEstadoDados[sigla] = fb;
      return fb;
    }

    // ── Extrair cada seção via APIs normalizadas do estados.js ──
    const icmsNorm   = E.getICMSNormalizado   ? E.getICMSNormalizado(sigla)   : null;
    const issNorm    = E.getISSNormalizado     ? E.getISSNormalizado(sigla)    : null;
    const snNorm     = E.getSimplesNacionalNormalizado ? E.getSimplesNacionalNormalizado(sigla) : null;
    const fedNorm    = E.getFederalNormalizado ? E.getFederalNormalizado(sigla) : null;
    const incNorm    = E.getIncentivosNormalizado ? E.getIncentivosNormalizado(sigla) : null;
    const ipvaNorm   = E.getIPVANormalizado   ? E.getIPVANormalizado(sigla)   : null;
    const itcmdNorm  = E.getITCMDNormalizado  ? E.getITCMDNormalizado(sigla)  : null;
    const taxas      = E.getTaxas  ? E.getTaxas(sigla)  : null;
    const itbi       = E.getITBI   ? E.getITBI(sigla)   : null;
    const iptu       = E.getIPTU   ? E.getIPTU(sigla)   : null;
    const reforma    = E.getReformaTributaria ? E.getReformaTributaria(sigla) : null;
    const dadosGerais = E.getDadosGerais ? E.getDadosGerais(sigla) : null;
    const cobertura  = E.getCobertura ? E.getCobertura(sigla) : null;

    // ── ICMS ──
    const icmsPadrao     = icmsNorm ? icmsNorm.aliquota_padrao : null;
    const fecopDados     = icmsNorm ? icmsNorm.fecop : { existe: false, nome: 'N/A', adicional: 0 };
    const icmsEfetivo    = icmsNorm ? icmsNorm.aliquota_efetiva : null;
    const icmsDiferenciadas = icmsNorm ? icmsNorm.aliquotas_diferenciadas : {};
    const icmsInterestaduais = icmsNorm ? icmsNorm.interestaduais : null;
    const icmsST         = icmsNorm ? icmsNorm.substituicao_tributaria : null;
    const icmsDifal      = icmsNorm ? icmsNorm.difal : null;

    // ── ISS ──
    const issGeral       = issNorm ? issNorm.aliquota_geral : null;
    const issMinima      = issNorm ? issNorm.aliquota_minima : 0.02;
    const issMaxima      = issNorm ? issNorm.aliquota_maxima : 0.05;
    const issMunicipio   = issNorm ? issNorm.municipio_referencia : 'Capital';
    const issPorServico  = issNorm ? issNorm.por_tipo_servico : {};

    // ── Simples Nacional ──
    const sublimiteICMSISS = snNorm && snNorm.sublimite_estadual
      ? snNorm.sublimite_estadual
      : 3_600_000.00;

    // ── Incentivos ──
    const sudamAtivo  = _checkIncentivo(incNorm, 'sudam');
    const sudeneAtivo = _checkIncentivo(incNorm, 'sudene');
    const sudecoAtivo = _checkIncentivo(incNorm, 'sudeco');
    const zfmAtivo    = _checkIncentivo(incNorm, 'zona_franca');
    const suframaAtivo = _checkIncentivo(incNorm, 'suframa');
    const alcAtivo    = _checkIncentivo(incNorm, 'alc');
    const incentivosEstaduais = incNorm ? incNorm.incentivos_estaduais : {};

    // ── Federal (confirmação das alíquotas padrão) ──
    const federal = _extrairFederalReal(fedNorm);

    // ── IPVA ──
    const ipvaAuto  = ipvaNorm ? ipvaNorm.automovel : null;
    const ipvaMoto  = ipvaNorm ? ipvaNorm.motocicleta : null;
    const ipvaCaminhao = ipvaNorm ? ipvaNorm.caminhao : null;

    // ── ITCMD ──
    const itcmdDados = itcmdNorm || null;

    // ── ITBI ──
    const itbiAliq = itbi ? (itbi.aliquota_geral || itbi.aliquota || null) : null;

    // ── IPTU ──
    const iptuDados = iptu || null;

    // ── Taxas estaduais/municipais ──
    const taxasDados = taxas || null;

    // ── Reforma Tributária ──
    const reformaDados = reforma || null;

    // ── Dados Gerais ──
    const capital  = dadosGerais ? (dadosGerais.capital || 'N/D') : 'N/D';
    const regiao   = dadosGerais ? (dadosGerais.regiao || _REGIAO_FALLBACK[sigla] || 'N/D') : (_REGIAO_FALLBACK[sigla] || 'N/D');
    const nomeEstado = dadosGerais ? (dadosGerais.nome || dadosGerais.nome_completo || sigla) : sigla;

    // ── Montar resultado consolidado ──
    const resultado = {
      // Identificação
      sigla: sigla,
      nome: nomeEstado,
      capital: capital,
      regiao: regiao,
      fonte: 'estados.js',
      completude: cobertura ? (cobertura.completude_estimada || 'N/D') : 'N/D',

      // ══════════════════════════════════════════
      // ICMS — Dados reais do estado
      // ══════════════════════════════════════════
      icms: {
        aliquotaPadrao: icmsPadrao,                           // decimal (ex: 0.19)
        aliquotaPadraoPerc: _fmtPctSafe(icmsPadrao),         // formatado (ex: "19,0%")
        fecop: {
          existe: fecopDados.existe,
          nome: fecopDados.nome,
          adicional: fecopDados.adicional,                    // decimal (ex: 0.02)
          adicionalPerc: _fmtPctSafe(fecopDados.adicional),
        },
        aliquotaEfetiva: icmsEfetivo,                         // icms + fecop
        aliquotaEfetivaPerc: _fmtPctSafe(icmsEfetivo),
        diferenciadas: icmsDiferenciadas,
        interestaduais: icmsInterestaduais,
        substituicaoTributaria: icmsST,
        difal: icmsDifal,
      },

      // ══════════════════════════════════════════
      // ISS — Dados reais da capital do estado
      // ══════════════════════════════════════════
      iss: {
        municipioReferencia: issMunicipio,
        aliquotaGeral: issGeral,                              // decimal (ex: 0.05)
        aliquotaGeralPerc: _fmtPctSafe(issGeral),
        aliquotaMinima: issMinima,
        aliquotaMaxima: issMaxima,
        porTipoServico: issPorServico,
        totalServicosDetalhados: Object.keys(issPorServico).length,
      },

      // ══════════════════════════════════════════
      // Simples Nacional — Sublimite por estado
      // ══════════════════════════════════════════
      simplesNacional: {
        sublimiteEstadual: sublimiteICMSISS,
        sublimiteFormatado: _fmtBRL(sublimiteICMSISS),
        dadosCompletos: snNorm,
      },

      // ══════════════════════════════════════════
      // Incentivos — Reais do estado
      // ══════════════════════════════════════════
      incentivos: {
        sudam:  sudamAtivo,
        sudene: sudeneAtivo,
        sudeco: sudecoAtivo,
        zfm:    zfmAtivo,
        suframa: suframaAtivo,
        alc:    alcAtivo,
        temIncentivoFederal: sudamAtivo || sudeneAtivo,
        tipoIncentivo: sudamAtivo ? 'SUDAM' : (sudeneAtivo ? 'SUDENE' : (sudecoAtivo ? 'SUDECO' : '')),
        reducaoIRPJ: (sudamAtivo || sudeneAtivo) ? 0.75 : 0,
        programasEstaduais: incentivosEstaduais,
        totalProgramasEstaduais: Object.keys(incentivosEstaduais).length,
      },

      // ══════════════════════════════════════════
      // Federal — Alíquotas confirmadas
      // ══════════════════════════════════════════
      federal: federal,

      // ══════════════════════════════════════════
      // Outros tributos estaduais/municipais
      // ══════════════════════════════════════════
      ipva: {
        automovel: ipvaAuto,
        motocicleta: ipvaMoto,
        caminhao: ipvaCaminhao,
        detalhes: ipvaNorm,
      },
      itcmd: itcmdDados,
      itbi: { aliquota: itbiAliq, detalhes: itbi },
      iptu: iptuDados,
      taxas: taxasDados,

      // ══════════════════════════════════════════
      // Reforma Tributária
      // ══════════════════════════════════════════
      reformaTributaria: reformaDados,
    };

    _cacheEstadoDados[sigla] = resultado;
    return resultado;
  };

  /**
   * Verifica se um incentivo está ativo em qualquer formato de dados
   * @private
   */
  function _checkIncentivo(incNorm, key) {
    if (!incNorm || !incNorm[key]) return false;
    const inc = incNorm[key];
    if (typeof inc === 'boolean') return inc;
    if (inc.ativo === true || inc.existe === true) return true;
    if (inc.abrangencia && inc.abrangencia !== 'nao_abrangido') return true;
    return false;
  }

  /**
   * Extrai alíquotas federais reais (ou usa default)
   * @private
   */
  function _extrairFederalReal(fedNorm) {
    const defaults = {
      irpj: { normal: 0.15, adicional: 0.10, limiteAdicionalMensal: 20_000 },
      csll: { geral: 0.09, financeira: 0.15 },
      pisCumulativo: 0.0065,
      cofinsCumulativo: 0.03,
      pisNaoCumulativo: 0.0165,
      cofinsNaoCumulativo: 0.076,
      inssPatronal: 0.20,
      rat: 0.02,
      terceiros: 0.058,
      fgts: 0.08,
    };

    if (!fedNorm) return defaults;

    // Tentar extrair valores reais
    const irpjData = fedNorm.irpj || {};
    const csllData = fedNorm.csll || {};
    const pisData  = fedNorm.pis_pasep || {};
    const cofinsData = fedNorm.cofins || {};
    const inssData = fedNorm.inss || {};
    const fgtsData = fedNorm.fgts || {};

    return {
      irpj: {
        normal: _extractRate(irpjData, ['aliquota_normal', 'aliquota', 'aliquota_basica']) || defaults.irpj.normal,
        adicional: _extractRate(irpjData, ['adicional', 'aliquota_adicional', 'adicional_aliquota']) || defaults.irpj.adicional,
        limiteAdicionalMensal: irpjData.limite_adicional_mensal || irpjData.excedente_mensal || defaults.irpj.limiteAdicionalMensal,
      },
      csll: {
        geral: _extractRate(csllData, ['aliquota', 'aliquota_geral']) || defaults.csll.geral,
        financeira: _extractRate(csllData, ['aliquota_financeira', 'financeiras']) || defaults.csll.financeira,
      },
      pisCumulativo: _extractRate(pisData, ['cumulativo', 'aliquota_cumulativa', 'aliquota_cumulativo']) || defaults.pisCumulativo,
      cofinsCumulativo: _extractRate(cofinsData, ['cumulativo', 'aliquota_cumulativa', 'aliquota_cumulativo']) || defaults.cofinsCumulativo,
      pisNaoCumulativo: _extractRate(pisData, ['nao_cumulativo', 'aliquota_nao_cumulativa', 'aliquota_nao_cumulativo']) || defaults.pisNaoCumulativo,
      cofinsNaoCumulativo: _extractRate(cofinsData, ['nao_cumulativo', 'aliquota_nao_cumulativa', 'aliquota_nao_cumulativo']) || defaults.cofinsNaoCumulativo,
      inssPatronal: _extractRate(inssData, ['patronal', 'aliquota_patronal', 'empregador']) || defaults.inssPatronal,
      rat: _extractRate(inssData, ['rat', 'rat_medio']) || defaults.rat,
      terceiros: _extractRate(inssData, ['terceiros', 'outras_entidades']) || defaults.terceiros,
      fgts: _extractRate(fgtsData, ['aliquota', 'aliquota_mensal']) || defaults.fgts,
    };
  }

  /**
   * Tenta extrair uma taxa de um objeto por múltiplas chaves possíveis
   * @private
   */
  function _extractRate(obj, keys) {
    if (!obj || typeof obj !== 'object') return null;
    for (let i = 0; i < keys.length; i++) {
      const val = obj[keys[i]];
      if (typeof val === 'number' && val > 0 && val <= 1) return val;
      if (typeof val === 'object' && val && typeof val.aliquota === 'number') return val.aliquota;
    }
    // Tenta chave direta 'aliquota'
    if (typeof obj.aliquota === 'number' && obj.aliquota > 0 && obj.aliquota <= 1) return obj.aliquota;
    return null;
  }

  /**
   * Fallback de regiões (caso estados.js não esteja disponível)
   * @private
   */
  const _REGIAO_FALLBACK = {
    AC: 'Norte', AL: 'Nordeste', AP: 'Norte', AM: 'Norte',
    BA: 'Nordeste', CE: 'Nordeste', DF: 'Centro-Oeste', ES: 'Sudeste',
    GO: 'Centro-Oeste', MA: 'Nordeste', MT: 'Centro-Oeste', MS: 'Centro-Oeste',
    MG: 'Sudeste', PA: 'Norte', PB: 'Nordeste', PR: 'Sul',
    PE: 'Nordeste', PI: 'Nordeste', RJ: 'Sudeste', RN: 'Nordeste',
    RS: 'Sul', RO: 'Norte', RR: 'Norte', SC: 'Sul',
    SP: 'Sudeste', SE: 'Nordeste', TO: 'Norte',
  };

  /**
   * ICMS fallback por estado (valores de referência quando estados.js não disponível)
   * @private
   */
  const _ICMS_FALLBACK = {
    AC: 0.19, AL: 0.19, AP: 0.18, AM: 0.20,
    BA: 0.205, CE: 0.20, DF: 0.20, ES: 0.17,
    GO: 0.19, MA: 0.22, MT: 0.17, MS: 0.17,
    MG: 0.18, PA: 0.19, PB: 0.20, PR: 0.195,
    PE: 0.205, PI: 0.21, RJ: 0.22, RN: 0.20,
    RS: 0.17, RO: 0.195, RR: 0.20, SC: 0.17,
    SP: 0.18, SE: 0.19, TO: 0.20,
  };

  /**
   * ISS fallback por capital (valores de referência)
   * @private
   */
  const _ISS_FALLBACK = {
    AC: 0.05, AL: 0.05, AP: 0.05, AM: 0.05,
    BA: 0.05, CE: 0.05, DF: 0.05, ES: 0.05,
    GO: 0.05, MA: 0.05, MT: 0.05, MS: 0.05,
    MG: 0.05, PA: 0.05, PB: 0.05, PR: 0.05,
    PE: 0.05, PI: 0.05, RJ: 0.05, RN: 0.05,
    RS: 0.05, RO: 0.05, RR: 0.05, SC: 0.05,
    SP: 0.05, SE: 0.05, TO: 0.05,
  };

  /**
   * Dados de fallback quando estados.js não está disponível
   * @private
   */
  function _fallbackEstado(sigla) {
    const incentivos_fb = CR.INCENTIVOS_REGIONAIS[sigla] || {};
    return {
      sigla: sigla,
      nome: incentivos_fb.nome || sigla,
      capital: 'N/D',
      regiao: _REGIAO_FALLBACK[sigla] || 'N/D',
      fonte: 'fallback',
      completude: 'N/D (estados.js não carregado)',

      icms: {
        aliquotaPadrao: _ICMS_FALLBACK[sigla] || 0.18,
        aliquotaPadraoPerc: _fmtPctSafe(_ICMS_FALLBACK[sigla] || 0.18),
        fecop: { existe: false, nome: 'N/A', adicional: 0, adicionalPerc: '0,00%' },
        aliquotaEfetiva: _ICMS_FALLBACK[sigla] || 0.18,
        aliquotaEfetivaPerc: _fmtPctSafe(_ICMS_FALLBACK[sigla] || 0.18),
        diferenciadas: {},
        interestaduais: null,
        substituicaoTributaria: null,
        difal: null,
      },
      iss: {
        municipioReferencia: 'Capital',
        aliquotaGeral: _ISS_FALLBACK[sigla] || 0.05,
        aliquotaGeralPerc: _fmtPctSafe(_ISS_FALLBACK[sigla] || 0.05),
        aliquotaMinima: 0.02,
        aliquotaMaxima: 0.05,
        porTipoServico: {},
        totalServicosDetalhados: 0,
      },
      simplesNacional: {
        sublimiteEstadual: 3_600_000.00,
        sublimiteFormatado: 'R$ 3.600.000,00',
        dadosCompletos: null,
      },
      incentivos: {
        sudam: incentivos_fb.sudam || false,
        sudene: incentivos_fb.sudene || false,
        sudeco: false,
        zfm: incentivos_fb.zfm || false,
        suframa: false,
        alc: false,
        temIncentivoFederal: (incentivos_fb.sudam || incentivos_fb.sudene) || false,
        tipoIncentivo: incentivos_fb.sudam ? 'SUDAM' : (incentivos_fb.sudene ? 'SUDENE' : ''),
        reducaoIRPJ: (incentivos_fb.sudam || incentivos_fb.sudene) ? 0.75 : 0,
        programasEstaduais: {},
        totalProgramasEstaduais: 0,
      },
      federal: {
        irpj: { normal: 0.15, adicional: 0.10, limiteAdicionalMensal: 20_000 },
        csll: { geral: 0.09, financeira: 0.15 },
        pisCumulativo: 0.0065,
        cofinsCumulativo: 0.03,
        pisNaoCumulativo: 0.0165,
        cofinsNaoCumulativo: 0.076,
        inssPatronal: 0.20,
        rat: 0.02,
        terceiros: 0.058,
        fgts: 0.08,
      },
      ipva: { automovel: null, motocicleta: null, caminhao: null, detalhes: null },
      itcmd: null,
      itbi: { aliquota: null, detalhes: null },
      iptu: null,
      taxas: null,
      reformaTributaria: null,
    };
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // 1. CONSTANTES GLOBAIS UNIFICADAS
  // ═══════════════════════════════════════════════════════════════════════════

  CR.VERSAO = '3.0.0';
  CR.DATA_BASE = '2026-02-11';

  /**
   * Limites de elegibilidade por regime.
   */
  CR.LIMITES = {
    simplesNacional: {
      receitaBrutaAnual: 4_800_000.00,
      sublimiteICMSISS: 3_600_000.00,   // default — pode ser sobrescrito pelo estado
      microempresa: 360_000.00,
      baseLegal: 'LC 123/2006, Art. 3º'
    },
    lucroPresumido: {
      receitaBrutaAnual: 78_000_000.00,
      baseLegal: 'Lei 9.718/1998, Art. 13; RIR/2018, Art. 587'
    },
    lucroReal: {
      obrigatorioAcimaDe: 78_000_000.00,
      baseLegal: 'RIR/2018, Art. 257'
    }
  };

  /**
   * Alíquotas de referência consolidadas (usadas como fallback).
   * A v3 prioriza valores reais de CR.extrairDadosEstado().
   */
  CR.ALIQUOTAS = {
    irpj: {
      normal: 0.15,
      adicional: 0.10,
      limiteAdicionalMensal: 20_000.00,
      limiteAdicionalTrimestral: 60_000.00
    },
    csll: {
      geral: 0.09,
      financeira: 0.15
    },
    pisCofins: {
      pisCumulativo: 0.0065,
      cofinsCumulativo: 0.03,
      totalCumulativo: 0.0365,
      pisNaoCumulativo: 0.0165,
      cofinsNaoCumulativo: 0.076,
      totalNaoCumulativo: 0.0925
    },
    encargos: {
      inssPatronal: 0.20,
      rat: 0.02,
      terceiros: 0.058,
      fgts: 0.08,
      totalEncargos: 0.278   // INSS 20% + RAT 2% + Terceiros 5,8%
    },
    sudam: {
      reducaoIRPJ: 0.75,
      baseLegal: 'Art. 615-627 do RIR/2018; Lei 12.973/2014'
    },
    sudene: {
      reducaoIRPJ: 0.75,
      baseLegal: 'Art. 627 do RIR/2018; LC 125/2007'
    }
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // 2. TABELAS DO SIMPLES NACIONAL (Anexos I-V, 6 faixas)
  // ═══════════════════════════════════════════════════════════════════════════

  CR.SIMPLES = {
    ANEXO_I: {
      nome: 'Comércio',
      cppInclusa: true,
      faixas: [
        { faixa: 1, limite: 180_000.00,   aliquota: 0.0400, deducao: 0 },
        { faixa: 2, limite: 360_000.00,   aliquota: 0.0730, deducao: 5_940 },
        { faixa: 3, limite: 720_000.00,   aliquota: 0.0950, deducao: 13_860 },
        { faixa: 4, limite: 1_800_000.00, aliquota: 0.1070, deducao: 22_500 },
        { faixa: 5, limite: 3_600_000.00, aliquota: 0.1430, deducao: 87_300 },
        { faixa: 6, limite: 4_800_000.00, aliquota: 0.1900, deducao: 378_000 }
      ]
    },
    ANEXO_II: {
      nome: 'Indústria',
      cppInclusa: true,
      faixas: [
        { faixa: 1, limite: 180_000.00,   aliquota: 0.0450, deducao: 0 },
        { faixa: 2, limite: 360_000.00,   aliquota: 0.0780, deducao: 5_940 },
        { faixa: 3, limite: 720_000.00,   aliquota: 0.1000, deducao: 13_860 },
        { faixa: 4, limite: 1_800_000.00, aliquota: 0.1120, deducao: 22_500 },
        { faixa: 5, limite: 3_600_000.00, aliquota: 0.1470, deducao: 85_500 },
        { faixa: 6, limite: 4_800_000.00, aliquota: 0.3000, deducao: 720_000 }
      ]
    },
    ANEXO_III: {
      nome: 'Serviços (Fator "r" ≥ 28%)',
      cppInclusa: true,
      faixas: [
        { faixa: 1, limite: 180_000.00,   aliquota: 0.0600, deducao: 0 },
        { faixa: 2, limite: 360_000.00,   aliquota: 0.1120, deducao: 9_360 },
        { faixa: 3, limite: 720_000.00,   aliquota: 0.1350, deducao: 17_640 },
        { faixa: 4, limite: 1_800_000.00, aliquota: 0.1600, deducao: 35_640 },
        { faixa: 5, limite: 3_600_000.00, aliquota: 0.2100, deducao: 125_640 },
        { faixa: 6, limite: 4_800_000.00, aliquota: 0.3300, deducao: 648_000 }
      ]
    },
    ANEXO_IV: {
      nome: 'Serviços (sem CPP no DAS)',
      cppInclusa: false,
      faixas: [
        { faixa: 1, limite: 180_000.00,   aliquota: 0.0450, deducao: 0 },
        { faixa: 2, limite: 360_000.00,   aliquota: 0.0900, deducao: 8_100 },
        { faixa: 3, limite: 720_000.00,   aliquota: 0.1020, deducao: 12_420 },
        { faixa: 4, limite: 1_800_000.00, aliquota: 0.1400, deducao: 39_780 },
        { faixa: 5, limite: 3_600_000.00, aliquota: 0.2200, deducao: 183_780 },
        { faixa: 6, limite: 4_800_000.00, aliquota: 0.3300, deducao: 828_000 }
      ]
    },
    ANEXO_V: {
      nome: 'Serviços (Fator "r" < 28%)',
      cppInclusa: true,
      faixas: [
        { faixa: 1, limite: 180_000.00,   aliquota: 0.1550, deducao: 0 },
        { faixa: 2, limite: 360_000.00,   aliquota: 0.1800, deducao: 4_500 },
        { faixa: 3, limite: 720_000.00,   aliquota: 0.1950, deducao: 9_900 },
        { faixa: 4, limite: 1_800_000.00, aliquota: 0.2050, deducao: 17_100 },
        { faixa: 5, limite: 3_600_000.00, aliquota: 0.2300, deducao: 62_100 },
        { faixa: 6, limite: 4_800_000.00, aliquota: 0.3050, deducao: 540_000 }
      ]
    }
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // 3. TABELA DE PRESUNÇÃO (Lucro Presumido + Estimativa do Lucro Real)
  // ═══════════════════════════════════════════════════════════════════════════

  CR.PRESUNCAO = {
    combustivel:             { irpj: 0.016, csll: 0.12, descricao: 'Revenda de combustíveis',            baseLegal: 'Art. 15, §1º, I' },
    comercio_industria:      { irpj: 0.08,  csll: 0.12, descricao: 'Comércio / Indústria / Transp. Carga', baseLegal: 'Art. 15, caput' },
    transporte_passageiros:  { irpj: 0.16,  csll: 0.12, descricao: 'Transporte de passageiros',          baseLegal: 'Art. 15, §1º, II, a' },
    servicos_gerais:         { irpj: 0.32,  csll: 0.32, descricao: 'Serviços em geral',                  baseLegal: 'Art. 15, §1º, III, a' },
    intermediacao:           { irpj: 0.32,  csll: 0.32, descricao: 'Intermediação de negócios',           baseLegal: 'Art. 15, §1º, III, b' },
    locacao_cessao:          { irpj: 0.32,  csll: 0.32, descricao: 'Locação / Cessão de bens',           baseLegal: 'Art. 15, §1º, III, c' },
    construcao_empreitada:   { irpj: 0.08,  csll: 0.12, descricao: 'Construção por empreitada (materiais)', baseLegal: 'Art. 15, §1º, III, e' },
    construcao_concessao:    { irpj: 0.32,  csll: 0.32, descricao: 'Construção vinculada a concessão',    baseLegal: 'Art. 15, §1º, III, e' },
    saude_hospitalar:        { irpj: 0.08,  csll: 0.12, descricao: 'Serviços hospitalares',              baseLegal: 'Art. 15, §2º' },
    factoring:               { irpj: 0.32,  csll: 0.32, descricao: 'Factoring',                          baseLegal: 'Art. 15, §1º, III, d' },
    esc:                     { irpj: 0.384, csll: 0.384, descricao: 'Empresa Simples de Crédito',         baseLegal: 'LC 167/2019' }
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // 4. MAPEAMENTO CNAE → TIPO DE ATIVIDADE + ANEXO SIMPLES
  // ═══════════════════════════════════════════════════════════════════════════

  CR.MAPEAMENTO_CATEGORIAS = {
    comercio: {
      anexo: 'I',
      fatorR: false,
      vedado: false,
      presuncao: 'comercio_industria',
      tipoTributo: 'ICMS',
      descricao: 'Comércio varejista e atacadista'
    },
    industria: {
      anexo: 'II',
      fatorR: false,
      vedado: false,
      presuncao: 'comercio_industria',
      tipoTributo: 'ICMS',
      descricao: 'Indústria e transformação'
    },
    servico: {
      anexo: 'III',
      fatorR: true,
      vedado: false,
      presuncao: 'servicos_gerais',
      tipoTributo: 'ISS',
      descricao: 'Prestação de serviços em geral'
    }
  };

  CR.EXCECOES_CNAE = {
    '81.21': { anexo: 'IV', fatorR: false, presuncao: 'servicos_gerais', nota: 'Limpeza — INSS por fora' },
    '80.11': { anexo: 'IV', fatorR: false, presuncao: 'servicos_gerais', nota: 'Vigilância — INSS por fora' },
    '41.20': { anexo: 'IV', fatorR: false, presuncao: 'construcao_empreitada', nota: 'Construção civil — INSS por fora' },
    '42':    { anexo: 'IV', fatorR: false, presuncao: 'construcao_empreitada', nota: 'Obras infraestrutura — INSS por fora' },
    '43':    { anexo: 'IV', fatorR: false, presuncao: 'construcao_empreitada', nota: 'Serviços especializados construção — INSS por fora' },
    '69.11': { anexo: 'IV', fatorR: false, presuncao: 'servicos_gerais', nota: 'Advocacia — INSS por fora' },
    '71.19': { anexo: 'III', fatorR: true, presuncao: 'servicos_gerais', nota: 'Engenharia / Geotecnologia' },
    '71.12': { anexo: 'III', fatorR: true, presuncao: 'servicos_gerais', nota: 'Engenharia consultiva' },
    '62.01': { anexo: 'III', fatorR: true, presuncao: 'servicos_gerais', nota: 'Desenvolvimento de software' },
    '62.02': { anexo: 'III', fatorR: true, presuncao: 'servicos_gerais', nota: 'Software SaaS/licenciamento' },
    '62.03': { anexo: 'III', fatorR: true, presuncao: 'servicos_gerais', nota: 'Desenvolvimento de software customizável' },
    '62.04': { anexo: 'III', fatorR: true, presuncao: 'servicos_gerais', nota: 'Consultoria em TI' },
    '62.09': { anexo: 'III', fatorR: true, presuncao: 'servicos_gerais', nota: 'Suporte técnico / TI' },
    '63.11': { anexo: 'III', fatorR: true, presuncao: 'servicos_gerais', nota: 'Hospedagem / Data centers' },
    '69.20': { anexo: 'III', fatorR: true, presuncao: 'servicos_gerais', nota: 'Contabilidade / Auditoria' },
    '70.20': { anexo: 'III', fatorR: true, presuncao: 'servicos_gerais', nota: 'Consultoria empresarial' },
    '73.11': { anexo: 'III', fatorR: true, presuncao: 'servicos_gerais', nota: 'Publicidade / Propaganda' },
    '73.19': { anexo: 'III', fatorR: true, presuncao: 'servicos_gerais', nota: 'Marketing / Pesquisa de mercado' },
    '74.10': { anexo: 'III', fatorR: true, presuncao: 'servicos_gerais', nota: 'Design' },
    '74.90': { anexo: 'III', fatorR: true, presuncao: 'servicos_gerais', nota: 'Serviços técnicos diversos' },
    '86.30': { anexo: 'III', fatorR: true, presuncao: 'servicos_gerais', nota: 'Clínicas médicas' },
    '86.40': { anexo: 'III', fatorR: true, presuncao: 'servicos_gerais', nota: 'Serviços de saúde complementar' },
    '86.50': { anexo: 'III', fatorR: true, presuncao: 'servicos_gerais', nota: 'Atividades de atenção à saúde' },
    '86.60': { anexo: 'III', fatorR: true, presuncao: 'servicos_gerais', nota: 'Atividades de atenção à saúde' },
    '86.90': { anexo: 'III', fatorR: true, presuncao: 'servicos_gerais', nota: 'Outras atividades de saúde' },
    '66.12': { anexo: 'III', fatorR: false, presuncao: 'intermediacao', nota: 'Corretagem — sempre Anexo III' },
    '56.11': { anexo: 'III', fatorR: false, presuncao: 'servicos_gerais', nota: 'Restaurantes — Anexo III' },
    '56.12': { anexo: 'III', fatorR: false, presuncao: 'servicos_gerais', nota: 'Lanchonetes / Fast food' },
    '86.10': { anexo: 'III', fatorR: true, presuncao: 'saude_hospitalar', nota: 'Hospitais — presunção 8%' },
    '86.20': { anexo: 'III', fatorR: true, presuncao: 'saude_hospitalar', nota: 'Laboratórios — presunção 8%' },
    '49.21': { anexo: 'III', fatorR: false, presuncao: 'transporte_passageiros', nota: 'Transporte ferroviário passageiros' },
    '49.22': { anexo: 'III', fatorR: false, presuncao: 'transporte_passageiros', nota: 'Transporte rodoviário passageiros' },
    '49.29': { anexo: 'III', fatorR: false, presuncao: 'transporte_passageiros', nota: 'Outros transportes passageiros' },
    '49.30': { anexo: 'III', fatorR: false, presuncao: 'comercio_industria', nota: 'Transporte rodoviário de cargas — presunção 8%', tipoTributo: 'ICMS' },
    '47.31': { anexo: 'I', fatorR: false, presuncao: 'combustivel', nota: 'Revenda de combustíveis — presunção 1,6%' },
    '77.11': { anexo: 'III', fatorR: false, presuncao: 'locacao_cessao', nota: 'Locação de automóveis' },
    '77.19': { anexo: 'III', fatorR: false, presuncao: 'locacao_cessao', nota: 'Locação de outros meios de transporte' },
    '77.21': { anexo: 'III', fatorR: false, presuncao: 'locacao_cessao', nota: 'Locação de equip. recreativos' },
    '77.22': { anexo: 'III', fatorR: false, presuncao: 'locacao_cessao', nota: 'Locação de fitas, DVDs etc.' },
    '77.23': { anexo: 'III', fatorR: false, presuncao: 'locacao_cessao', nota: 'Locação de máquinas e equipamentos' },
    '77.29': { anexo: 'III', fatorR: false, presuncao: 'locacao_cessao', nota: 'Locação de objetos pessoais' },
    '77.31': { anexo: 'III', fatorR: false, presuncao: 'locacao_cessao', nota: 'Locação de máquinas agrícolas' },
    '77.32': { anexo: 'III', fatorR: false, presuncao: 'locacao_cessao', nota: 'Locação de máquinas construção' },
    '77.33': { anexo: 'III', fatorR: false, presuncao: 'locacao_cessao', nota: 'Locação de máquinas escritório' },
    '77.39': { anexo: 'III', fatorR: false, presuncao: 'locacao_cessao', nota: 'Locação de outras máquinas' },
    '68.10': { anexo: 'III', fatorR: false, presuncao: 'locacao_cessao', nota: 'Atividades imobiliárias' },
    '64.10': { vedado: true, presuncao: 'servicos_gerais', nota: 'Banco comercial — vedado (Art. 17, I)' },
    '64.21': { vedado: true, presuncao: 'servicos_gerais', nota: 'Banco múltiplo — vedado' },
    '64.22': { vedado: true, presuncao: 'servicos_gerais', nota: 'Banco investimento — vedado' },
    '64.91': { vedado: true, presuncao: 'factoring', nota: 'Factoring — vedado (Art. 17, IV)' },
    '65.11': { vedado: true, presuncao: 'servicos_gerais', nota: 'Seguros de vida — vedado (Art. 17, II)' },
    '65.12': { vedado: true, presuncao: 'servicos_gerais', nota: 'Seguros não-vida — vedado' },
    '65.20': { vedado: true, presuncao: 'servicos_gerais', nota: 'Previdência complementar — vedado' },
    '66.11': { vedado: true, presuncao: 'intermediacao', nota: 'Administração de bolsas — vedado' }
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // 5. MAPEAMENTO DE ESTADOS — INCENTIVOS REGIONAIS (fallback)
  // ═══════════════════════════════════════════════════════════════════════════

  CR.INCENTIVOS_REGIONAIS = {
    AC: { sudam: true, sudene: false, zfm: false, nome: 'Acre' },
    AM: { sudam: true, sudene: false, zfm: true,  nome: 'Amazonas' },
    AP: { sudam: true, sudene: false, zfm: false, nome: 'Amapá' },
    PA: { sudam: true, sudene: false, zfm: false, nome: 'Pará' },
    RO: { sudam: true, sudene: false, zfm: false, nome: 'Rondônia' },
    RR: { sudam: true, sudene: false, zfm: false, nome: 'Roraima' },
    TO: { sudam: true, sudene: false, zfm: false, nome: 'Tocantins' },
    MT: { sudam: true, sudene: false, zfm: false, nome: 'Mato Grosso' },
    MA: { sudam: true, sudene: true,  zfm: false, nome: 'Maranhão' },
    AL: { sudam: false, sudene: true, zfm: false, nome: 'Alagoas' },
    BA: { sudam: false, sudene: true, zfm: false, nome: 'Bahia' },
    CE: { sudam: false, sudene: true, zfm: false, nome: 'Ceará' },
    PB: { sudam: false, sudene: true, zfm: false, nome: 'Paraíba' },
    PE: { sudam: false, sudene: true, zfm: false, nome: 'Pernambuco' },
    PI: { sudam: false, sudene: true, zfm: false, nome: 'Piauí' },
    RN: { sudam: false, sudene: true, zfm: false, nome: 'Rio Grande do Norte' },
    SE: { sudam: false, sudene: true, zfm: false, nome: 'Sergipe' },
    DF: { sudam: false, sudene: false, zfm: false, nome: 'Distrito Federal' },
    ES: { sudam: false, sudene: false, zfm: false, nome: 'Espírito Santo' },
    GO: { sudam: false, sudene: false, zfm: false, nome: 'Goiás' },
    MG: { sudam: false, sudene: false, zfm: false, nome: 'Minas Gerais' },
    MS: { sudam: false, sudene: false, zfm: false, nome: 'Mato Grosso do Sul' },
    PR: { sudam: false, sudene: false, zfm: false, nome: 'Paraná' },
    RJ: { sudam: false, sudene: false, zfm: false, nome: 'Rio de Janeiro' },
    RS: { sudam: false, sudene: false, zfm: false, nome: 'Rio Grande do Sul' },
    SC: { sudam: false, sudene: false, zfm: false, nome: 'Santa Catarina' },
    SP: { sudam: false, sudene: false, zfm: false, nome: 'São Paulo' }
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // 6. HELPERS / UTILITÁRIOS
  // ═══════════════════════════════════════════════════════════════════════════

  function _r(v) { return Math.round(v * 100) / 100; }

  function _fmtBRL(v) {
    return 'R$ ' + (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function _fmtPct(v) {
    return (v * 100).toFixed(2).replace('.', ',') + '%';
  }

  function _fmtPctSafe(v) {
    if (v == null || isNaN(v)) return 'N/D';
    return (v * 100).toFixed(2).replace('.', ',') + '%';
  }

  CR.helpers = { round: _r, formatarMoeda: _fmtBRL, formatarPercentual: _fmtPct };


  // ═══════════════════════════════════════════════════════════════════════════
  // 7. OBTER REGRAS POR CNAE
  // ═══════════════════════════════════════════════════════════════════════════

  CR.obterRegras = function (codigoCNAE, categoriaCNAE) {
    const cod = (codigoCNAE || '').replace(/[^0-9.]/g, '');

    const prefixos = [
      cod.substring(0, 5),
      cod.substring(0, 4),
      cod.substring(0, 2)
    ];

    let excecao = null;
    for (const prefixo of prefixos) {
      if (CR.EXCECOES_CNAE[prefixo]) {
        excecao = CR.EXCECOES_CNAE[prefixo];
        break;
      }
    }

    // ═══ CORREÇÃO BUG 1: Normalização robusta de categoria ═══
    const catRaw = (categoriaCNAE || '').toString().trim();
    const catNorm = catRaw
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')  // Remove acentos
      .replace(/[^a-z0-9]/g, '');       // Remove tudo que não é alfanumérico

    let catBase = 'servico'; // fallback padrão

    // Match amplo para comércio
    if (
      catNorm.includes('comercio') ||
      catNorm.includes('varejo') ||
      catNorm.includes('atacado') ||
      catNorm.includes('revenda') ||
      catNorm.includes('loja') ||
      catNorm === 'com' ||
      catNorm === 'comercial' ||
      catNorm === '1' ||
      catNorm === 'i'
    ) {
      catBase = 'comercio';
    }
    // Match amplo para indústria
    else if (
      catNorm.includes('industria') ||
      catNorm.includes('fabricacao') ||
      catNorm.includes('fabricante') ||
      catNorm.includes('transformacao') ||
      catNorm.includes('manufatura') ||
      catNorm === 'ind' ||
      catNorm === 'industrial' ||
      catNorm === '2' ||
      catNorm === 'ii'
    ) {
      catBase = 'industria';
    }

    // Log de diagnóstico (remover em produção se quiser)
    if (catBase === 'servico' && catRaw !== '' && !catNorm.includes('servico') && !catNorm.includes('prestacao')) {
      console.warn(`[obterRegras] ⚠️ Categoria "${catRaw}" (normalizada: "${catNorm}") não reconhecida como comércio/indústria. Usando fallback "servico". Verifique se a UI está passando o valor correto.`);
    }

    const padrao = CR.MAPEAMENTO_CATEGORIAS[catBase];

    const regras = {
      cnae: codigoCNAE,
      categoria: catBase,
      anexo: excecao ? (excecao.anexo || padrao.anexo) : padrao.anexo,
      fatorR: excecao ? (excecao.fatorR === true) : padrao.fatorR,
      vedado: excecao ? (excecao.vedado === true) : false,
      presuncao: excecao ? (excecao.presuncao || padrao.presuncao) : padrao.presuncao,
      presuncaoIRPJ: 0,
      presuncaoCSLL: 0,
      tipoTributo: excecao && excecao.tipoTributo ? excecao.tipoTributo : padrao.tipoTributo,
      nota: excecao ? excecao.nota : '',
      fonte: excecao ? 'mapeamento' : 'categoria'
    };

    const p = CR.PRESUNCAO[regras.presuncao];
    if (p) {
      regras.presuncaoIRPJ = p.irpj;
      regras.presuncaoCSLL = p.csll;
    }

    return regras;
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // 8. MOTOR DE CÁLCULO — SIMPLES NACIONAL (v3: usa sublimite real)
  // ═══════════════════════════════════════════════════════════════════════════

  CR.calcularSimples = function (faturamentoMensal, folhaMensal, regras, dadosUF) {
    const rbt12 = faturamentoMensal * 12;

    if (rbt12 > CR.LIMITES.simplesNacional.receitaBrutaAnual) return null;
    if (regras.vedado) return null;

    // v3: sublimite real do estado
    const sublimite = dadosUF
      ? dadosUF.simplesNacional.sublimiteEstadual
      : CR.LIMITES.simplesNacional.sublimiteICMSISS;

    const fatorR = folhaMensal > 0 ? folhaMensal / faturamentoMensal : 0;
    let anexo = regras.anexo;
    if (regras.fatorR) {
      anexo = (fatorR >= 0.28) ? 'III' : 'V';
    }

    const tabelaKey = 'ANEXO_' + anexo;
    const tabela = CR.SIMPLES[tabelaKey];
    if (!tabela) return null;

    const faixas = tabela.faixas;
    let faixa = faixas[faixas.length - 1];
    for (let i = 0; i < faixas.length; i++) {
      if (rbt12 <= faixas[i].limite) {
        faixa = faixas[i];
        break;
      }
    }

    const aliqEfetiva = Math.max(0, (rbt12 * faixa.aliquota - faixa.deducao) / rbt12);
    const das = faturamentoMensal * aliqEfetiva;

    // CPP por fora se Anexo IV
    const totalEncargos = dadosUF
      ? (dadosUF.federal.inssPatronal + dadosUF.federal.rat + dadosUF.federal.terceiros)
      : CR.ALIQUOTAS.encargos.totalEncargos;

    let cppFora = 0;
    if (anexo === 'IV') {
      cppFora = folhaMensal * totalEncargos;
    }

    // v3: Alerta de sublimite com valor real do estado
    const sublimiteAlerta = rbt12 > sublimite;

    // v3: Se ultrapassou sublimite, ICMS/ISS por fora
    let icmsIssPorFora = 0;
    if (sublimiteAlerta) {
      if (regras.tipoTributo === 'ISS') {
        const issReal = dadosUF ? (dadosUF.iss.aliquotaGeral || 0.05) : 0.05;
        icmsIssPorFora = faturamentoMensal * issReal;
      } else {
        const icmsReal = dadosUF ? (dadosUF.icms.aliquotaPadrao || 0.18) : 0.18;
        // Estimativa: ICMS por fora com créditos parciais
        icmsIssPorFora = faturamentoMensal * icmsReal * 0.40;
      }
    }

    const total = _r(das + cppFora + icmsIssPorFora);

    return {
      regime: 'Simples Nacional',
      total: total,
      das: _r(das),
      cppFora: _r(cppFora),
      icmsIssPorFora: _r(icmsIssPorFora),
      aliqEfetiva: faturamentoMensal > 0 ? total / faturamentoMensal : 0,
      aliqEfetivaFormatada: faturamentoMensal > 0 ? _fmtPct(total / faturamentoMensal) : '0,00%',
      anexoEfetivo: anexo,
      nomeAnexo: tabela.nome,
      faixa: faixa.faixa,
      fatorR: _r(fatorR),
      fatorRFormatado: _fmtPct(fatorR),
      rbt12: rbt12,
      cppInclusa: tabela.cppInclusa,
      sublimiteEstadual: sublimite,
      sublimiteAlerta: sublimiteAlerta,
      baseLegal: 'LC 123/2006, Anexo ' + anexo
    };
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // 9. MOTOR DE CÁLCULO — LUCRO PRESUMIDO (v3: dados reais do estado)
  // ═══════════════════════════════════════════════════════════════════════════

  CR.calcularPresumido = function (faturamentoMensal, folhaMensal, regras, uf, opcoes) {
    opcoes = opcoes || {};
    const dadosUF = CR.extrairDadosEstado(uf);
    const fed = dadosUF.federal;

    // v3: ISS real do estado (ou override manual)
    const aliqISS = opcoes.aliquotaISS || dadosUF.iss.aliquotaGeral || 0.05;
    // v3: ICMS real do estado
    const aliqICMS = opcoes.aliquotaICMS || dadosUF.icms.aliquotaEfetiva || dadosUF.icms.aliquotaPadrao || 0.18;

    // Bases de cálculo mensais
    const baseIRPJ = faturamentoMensal * regras.presuncaoIRPJ;
    const baseCSLL = faturamentoMensal * regras.presuncaoCSLL;

    // IRPJ (15% + adicional 10% sobre excedente de R$ 20k/mês)
    let irpj = baseIRPJ * fed.irpj.normal;
    if (baseIRPJ > fed.irpj.limiteAdicionalMensal) {
      irpj += (baseIRPJ - fed.irpj.limiteAdicionalMensal) * fed.irpj.adicional;
    }

    // CSLL
    const csll = baseCSLL * fed.csll.geral;

    // PIS/COFINS cumulativo
    const pis = faturamentoMensal * fed.pisCumulativo;
    const cofins = faturamentoMensal * fed.cofinsCumulativo;

    // Encargos trabalhistas
    const totalEncargos = fed.inssPatronal + fed.rat + fed.terceiros;
    const cpp = folhaMensal * totalEncargos;
    const fgts = folhaMensal * fed.fgts;

    // v3: Incentivos reais do estado
    let reducaoIRPJ = 0;
    let temIncentivo = false;
    let tipoIncentivo = '';

    if (dadosUF.incentivos.temIncentivoFederal) {
      reducaoIRPJ = irpj * dadosUF.incentivos.reducaoIRPJ;
      temIncentivo = true;
      tipoIncentivo = dadosUF.incentivos.tipoIncentivo;
    }

    const irpjFinal = _r(irpj - reducaoIRPJ);

    // ═══ CORREÇÃO BUG 6: Determinar ISS vs ICMS SOMENTE pelo tipoTributo ═══
    const isServico = regras.tipoTributo === 'ISS';
    const iss = isServico ? faturamentoMensal * aliqISS : 0;
    // ICMS: alíquota real do estado, estimativa com créditos ~30% (compras com NF)
    const creditoICMS = opcoes.percentualCreditoICMS || 0.30;
    const icms = !isServico ? faturamentoMensal * aliqICMS * (1 - creditoICMS) : 0;

    // v3: FECOP se aplicável e não serviço
    let fecopValor = 0;
    if (!isServico && dadosUF.icms.fecop.existe && dadosUF.icms.fecop.adicional > 0) {
      fecopValor = faturamentoMensal * dadosUF.icms.fecop.adicional * (1 - creditoICMS);
    }

    const total = _r(irpjFinal + csll + pis + cofins + cpp + fgts + iss + icms + fecopValor);

    return {
      regime: 'Lucro Presumido',
      total: total,
      irpj: _r(irpj),
      irpjReducao: _r(reducaoIRPJ),
      irpjFinal: irpjFinal,
      csll: _r(csll),
      pis: _r(pis),
      cofins: _r(cofins),
      cpp: _r(cpp),
      fgts: _r(fgts),
      iss: _r(iss),
      icms: _r(icms),
      fecop: _r(fecopValor),
      presuncaoIRPJ: regras.presuncaoIRPJ,
      presuncaoCSLL: regras.presuncaoCSLL,
      aliqEfetiva: faturamentoMensal > 0 ? total / faturamentoMensal : 0,
      aliqEfetivaFormatada: faturamentoMensal > 0 ? _fmtPct(total / faturamentoMensal) : '0,00%',
      temIncentivo: temIncentivo,
      tipoIncentivo: tipoIncentivo,

      // v3: Dados do estado usados no cálculo
      dadosEstadoUsados: {
        icmsAliquota: aliqICMS,
        icmsAliquotaPerc: _fmtPct(aliqICMS),
        issAliquota: aliqISS,
        issAliquotaPerc: _fmtPct(aliqISS),
        fecopAdicional: dadosUF.icms.fecop.adicional,
        fecopNome: dadosUF.icms.fecop.nome,
        fonte: dadosUF.fonte,
      },
      baseLegal: 'Lei 9.249/1995, Art. 15/20; RIR/2018, Art. 587-601'
    };
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // 10. MOTOR DE CÁLCULO — LUCRO REAL (v3: dados reais do estado)
  // ═══════════════════════════════════════════════════════════════════════════

  CR.calcularReal = function (faturamentoMensal, folhaMensal, regras, uf, opcoes) {
    opcoes = opcoes || {};
    const dadosUF = CR.extrairDadosEstado(uf);
    const fed = dadosUF.federal;

    const margemLucro = opcoes.margemLucro || 0.20;
    const creditoEstimado = opcoes.percentualCreditos || 0.30;
    const aliqISS = opcoes.aliquotaISS || dadosUF.iss.aliquotaGeral || 0.05;
    const aliqICMS = opcoes.aliquotaICMS || dadosUF.icms.aliquotaEfetiva || dadosUF.icms.aliquotaPadrao || 0.18;

    const lucro = faturamentoMensal * margemLucro;

    // IRPJ sobre lucro real
    let irpj = lucro * fed.irpj.normal;
    if (lucro > fed.irpj.limiteAdicionalMensal) {
      irpj += (lucro - fed.irpj.limiteAdicionalMensal) * fed.irpj.adicional;
    }

    // CSLL
    const csll = lucro * fed.csll.geral;

    // PIS/COFINS não cumulativo (com créditos)
    const baseCreditosPISCOFINS = faturamentoMensal * creditoEstimado;
    const pis = Math.max(0, (faturamentoMensal * fed.pisNaoCumulativo) - (baseCreditosPISCOFINS * fed.pisNaoCumulativo));
    const cofins = Math.max(0, (faturamentoMensal * fed.cofinsNaoCumulativo) - (baseCreditosPISCOFINS * fed.cofinsNaoCumulativo));

    // Encargos trabalhistas
    const totalEncargos = fed.inssPatronal + fed.rat + fed.terceiros;
    const cpp = folhaMensal * totalEncargos;
    const fgts = folhaMensal * fed.fgts;

    // Incentivos regionais reais
    let reducaoIRPJ = 0;
    let temIncentivo = false;
    let tipoIncentivo = '';

    if (dadosUF.incentivos.temIncentivoFederal) {
      reducaoIRPJ = irpj * dadosUF.incentivos.reducaoIRPJ;
      temIncentivo = true;
      tipoIncentivo = dadosUF.incentivos.tipoIncentivo;
    }

    const irpjFinal = _r(irpj - reducaoIRPJ);

    // ═══ CORREÇÃO BUG 6: Determinar ISS vs ICMS SOMENTE pelo tipoTributo ═══
    const isServico = regras.tipoTributo === 'ISS';
    const iss = isServico ? faturamentoMensal * aliqISS : 0;
    const creditoICMS = opcoes.percentualCreditoICMS || 0.30;
    const icms = !isServico ? faturamentoMensal * aliqICMS * (1 - creditoICMS) : 0;

    // FECOP
    let fecopValor = 0;
    if (!isServico && dadosUF.icms.fecop.existe && dadosUF.icms.fecop.adicional > 0) {
      fecopValor = faturamentoMensal * dadosUF.icms.fecop.adicional * (1 - creditoICMS);
    }

    const total = _r(irpjFinal + csll + pis + cofins + cpp + fgts + iss + icms + fecopValor);

    return {
      regime: 'Lucro Real',
      total: total,
      irpj: _r(irpj),
      irpjReducao: _r(reducaoIRPJ),
      irpjFinal: irpjFinal,
      csll: _r(csll),
      pis: _r(pis),
      cofins: _r(cofins),
      cpp: _r(cpp),
      fgts: _r(fgts),
      iss: _r(iss),
      icms: _r(icms),
      fecop: _r(fecopValor),
      margemLucroUsada: margemLucro,
      creditosPISCOFINSUsado: creditoEstimado,
      aliqEfetiva: faturamentoMensal > 0 ? total / faturamentoMensal : 0,
      aliqEfetivaFormatada: faturamentoMensal > 0 ? _fmtPct(total / faturamentoMensal) : '0,00%',
      temIncentivo: temIncentivo,
      tipoIncentivo: tipoIncentivo,
      otimizacoes: {
        jcpDisponivel: temIncentivo || lucro > 50000,
        compensacaoPrejuizo: true,
        depreciacaoAcelerada: temIncentivo,
        creditoPISCOFINS: true
      },

      // v3: Dados do estado usados
      dadosEstadoUsados: {
        icmsAliquota: aliqICMS,
        icmsAliquotaPerc: _fmtPct(aliqICMS),
        issAliquota: aliqISS,
        issAliquotaPerc: _fmtPct(aliqISS),
        fecopAdicional: dadosUF.icms.fecop.adicional,
        fecopNome: dadosUF.icms.fecop.nome,
        fonte: dadosUF.fonte,
      },
      baseLegal: 'RIR/2018, Art. 257-261; Lei 12.973/2014'
    };
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // 11. COMPARAÇÃO UNIFICADA — RANKING + RECOMENDAÇÃO (v3)
  // ═══════════════════════════════════════════════════════════════════════════

  CR.comparar = function (params) {
    const {
      faturamentoMensal,
      folhaMensal = 0,
      cnae,
      categoria,
      uf = 'SP',
      opcoes = {}
    } = params;

    // v3: Extrair dados reais do estado PRIMEIRO
    const dadosUF = CR.extrairDadosEstado(uf);

    // 1. Obter regras do CNAE
    const regras = CR.obterRegras(cnae, categoria);

    // 2. Calcular cada regime (passando dadosUF para Simples)
    const simples = CR.calcularSimples(faturamentoMensal, folhaMensal, regras, dadosUF);
    const presumido = CR.calcularPresumido(faturamentoMensal, folhaMensal, regras, uf, opcoes);
    const real = CR.calcularReal(faturamentoMensal, folhaMensal, regras, uf, opcoes);

    // 3. Montar ranking
    const regimes = [];

    if (simples) {
      regimes.push({
        id: 'simples', nome: 'Simples Nacional', nomeAbreviado: 'Simples',
        total: simples.total, aliqEfetiva: simples.aliqEfetiva,
        detalhes: simples, elegivel: true, vedado: false
      });
    } else {
      regimes.push({
        id: 'simples', nome: 'Simples Nacional', nomeAbreviado: 'Simples',
        total: null, aliqEfetiva: null,
        detalhes: null, elegivel: false, vedado: regras.vedado
      });
    }

    regimes.push({
      id: 'presumido', nome: 'Lucro Presumido', nomeAbreviado: 'Presumido',
      total: presumido.total, aliqEfetiva: presumido.aliqEfetiva,
      detalhes: presumido, elegivel: true, vedado: false
    });

    regimes.push({
      id: 'real', nome: 'Lucro Real', nomeAbreviado: 'L. Real',
      total: real.total, aliqEfetiva: real.aliqEfetiva,
      detalhes: real, elegivel: true, vedado: false
    });

    // 4. Ordenar por carga
    const ranking = regimes.filter(r => r.total !== null).sort((a, b) => a.total - b.total);
    ranking.forEach((r, i) => { r.posicao = i + 1; });

    const melhor = ranking[0] || null;
    const pior = ranking[ranking.length - 1] || null;
    const economiaMensal = melhor && pior ? _r(pior.total - melhor.total) : 0;
    const economiaAnual = _r(economiaMensal * 12);

    // 5. Vantagens
    const vantagens = melhor ? CR._gerarVantagens(melhor, regras, uf, {
      faturamentoMensal, folhaMensal, simples, presumido, real, dadosUF
    }) : [];

    // 6. Recomendação
    const recomendacao = melhor ? CR._gerarRecomendacao(melhor, regras, uf, {
      faturamentoMensal, folhaMensal, economiaMensal, economiaAnual,
      simples, presumido, real, dadosUF
    }) : 'Não foi possível determinar o regime ideal com os dados fornecidos.';

    // 7. Alertas
    const alertas = CR._gerarAlertas(regras, uf, {
      faturamentoMensal, folhaMensal, simples, presumido, real, dadosUF
    });

    return {
      cnae: cnae,
      categoria: regras.categoria,
      uf: uf,
      regras: regras,
      faturamentoMensal: faturamentoMensal,
      folhaMensal: folhaMensal,

      // Resultados individuais
      simples: simples,
      presumido: presumido,
      real: real,

      // Ranking
      ranking: ranking,
      melhorRegime: melhor ? melhor.nome : null,
      melhorRegimeId: melhor ? melhor.id : null,
      cargaMenorMensal: melhor ? melhor.total : null,
      cargaMenorAnual: melhor ? _r(melhor.total * 12) : null,

      // Economia
      economiaMensal: economiaMensal,
      economiaAnual: economiaAnual,
      economiaMensalFormatada: _fmtBRL(economiaMensal),
      economiaAnualFormatada: _fmtBRL(economiaAnual),

      // Análise qualitativa
      vantagens: vantagens,
      recomendacao: recomendacao,
      alertas: alertas,

      // v3: Dados completos do estado usados no cálculo
      dadosEstado: dadosUF,

      // v3: Ficha tributária resumida para exibição rápida
      fichaTributaria: {
        estado: dadosUF.nome,
        sigla: dadosUF.sigla,
        capital: dadosUF.capital,
        regiao: dadosUF.regiao,
        icmsPadrao: dadosUF.icms.aliquotaPadraoPerc,
        icmsEfetivo: dadosUF.icms.aliquotaEfetivaPerc,
        fecop: dadosUF.icms.fecop.existe ? dadosUF.icms.fecop.adicionalPerc : 'Não possui',
        issCapital: dadosUF.iss.aliquotaGeralPerc,
        issMunicipio: dadosUF.iss.municipioReferencia,
        sublimiteSN: dadosUF.simplesNacional.sublimiteFormatado,
        incentivo: dadosUF.incentivos.tipoIncentivo || 'Nenhum federal',
        incentivosEstaduais: dadosUF.incentivos.totalProgramasEstaduais,
        fonte: dadosUF.fonte,
      },

      // Metadados
      versao: CR.VERSAO,
      dataCalculo: new Date().toISOString()
    };
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // 12. INTERFACE PARA CONSULTOR CNAE (v3: com dados do estado)
  // ═══════════════════════════════════════════════════════════════════════════

  CR.compararParaCNAE = function (codigoCNAE, categoriaCNAE, faturamentoMensal, folhaMensal, uf) {
    const resultado = CR.comparar({
      faturamentoMensal: faturamentoMensal,
      folhaMensal: folhaMensal,
      cnae: codigoCNAE,
      categoria: categoriaCNAE,
      uf: uf
    });

    return {
      regras: resultado.regras,
      simples: resultado.simples,
      presumido: resultado.presumido,
      real: resultado.real,
      melhorRegime: resultado.melhorRegime,
      menorTotal: resultado.cargaMenorMensal,
      economiaAnual: resultado.economiaAnual,
      vantagens: resultado.vantagens,
      recomendacao: resultado.recomendacao,
      alertas: resultado.alertas,

      // v3: Dados do estado para o consultor
      dadosEstado: resultado.dadosEstado,
      fichaTributaria: resultado.fichaTributaria,
    };
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // 12.1 FICHA TRIBUTÁRIA COMPLETA DO ESTADO (v3 — NOVO)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Retorna a ficha tributária COMPLETA de um estado para o consultor CNAE.
   * Inclui TODOS os dados que um consultor precisa para tomar decisões:
   *   - Todos os impostos com alíquotas reais
   *   - Incentivos federais e estaduais
   *   - Custos extras (taxas, FECOP, ST)
   *   - Impacto da reforma tributária
   *   - Comparação rápida dos 3 regimes para cenários padrão
   *
   * @param {string} uf - Sigla do estado
   * @returns {Object} Ficha tributária completa
   */
  CR.fichaTributariaUF = function (uf) {
    const dados = CR.extrairDadosEstado(uf);

    // Cenários de comparação rápida (para dar contexto)
    const cenarios = {};
    const faixas = [
      { nome: 'ME (R$10k/mês)', fat: 10_000, folha: 3_000 },
      { nome: 'EPP (R$50k/mês)', fat: 50_000, folha: 15_000 },
      { nome: 'Média (R$200k/mês)', fat: 200_000, folha: 60_000 },
      { nome: 'Grande (R$500k/mês)', fat: 500_000, folha: 150_000 },
    ];

    for (const f of faixas) {
      // Serviço
      const resServ = CR.comparar({
        faturamentoMensal: f.fat, folhaMensal: f.folha,
        cnae: '71.19', categoria: 'Serviço', uf: uf
      });
      // Comércio
      const resCom = CR.comparar({
        faturamentoMensal: f.fat, folhaMensal: f.folha,
        cnae: '47.11', categoria: 'Comércio', uf: uf
      });

      cenarios[f.nome] = {
        servico: {
          melhor: resServ.melhorRegime,
          cargaMensal: resServ.cargaMenorMensal,
          aliqEfetiva: resServ.ranking[0] ? resServ.ranking[0].aliqEfetiva : 0,
          economiaAnual: resServ.economiaAnual,
        },
        comercio: {
          melhor: resCom.melhorRegime,
          cargaMensal: resCom.cargaMenorMensal,
          aliqEfetiva: resCom.ranking[0] ? resCom.ranking[0].aliqEfetiva : 0,
          economiaAnual: resCom.economiaAnual,
        },
      };
    }

    return {
      identificacao: {
        sigla: dados.sigla,
        nome: dados.nome,
        capital: dados.capital,
        regiao: dados.regiao,
        fonte: dados.fonte,
        completude: dados.completude,
      },

      tributosEstaduais: {
        icms: dados.icms,
        iss: dados.iss,
        ipva: dados.ipva,
        itcmd: dados.itcmd,
        itbi: dados.itbi,
        iptu: dados.iptu,
        taxas: dados.taxas,
      },

      tributosFederais: dados.federal,

      simplesNacional: dados.simplesNacional,

      incentivos: dados.incentivos,

      reformaTributaria: dados.reformaTributaria,

      cenariosComparativos: cenarios,

      resumoConsultor: {
        // Informações-chave para decisão rápida
        icmsReal: dados.icms.aliquotaEfetivaPerc,
        issReal: dados.iss.aliquotaGeralPerc,
        temFECOP: dados.icms.fecop.existe,
        fecopValor: dados.icms.fecop.adicionalPerc,
        temST: !!dados.icms.substituicaoTributaria,
        temIncentivo: dados.incentivos.temIncentivoFederal,
        tipoIncentivo: dados.incentivos.tipoIncentivo,
        reducaoIRPJ: dados.incentivos.reducaoIRPJ > 0 ? _fmtPct(dados.incentivos.reducaoIRPJ) : 'N/A',
        programasEstaduais: dados.incentivos.totalProgramasEstaduais,
        temZFM: dados.incentivos.zfm,
        sublimiteSN: dados.simplesNacional.sublimiteFormatado,
      },

      versao: CR.VERSAO,
      dataExtracao: new Date().toISOString(),
    };
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // 12.2 DADOS DO ESTADO PARA CNAE ESPECÍFICO (v3 — NOVO)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Retorna dados tributários do estado filtrados para um CNAE específico.
   * O consultor CNAE usa isso para mostrar apenas as informações relevantes.
   *
   * @param {string} uf - Sigla do estado
   * @param {string} cnae - Código CNAE
   * @param {string} categoria - 'Comércio', 'Indústria', 'Serviço'
   * @returns {Object}
   */
  CR.dadosEstadoParaCNAE = function (uf, cnae, categoria) {
    const dados = CR.extrairDadosEstado(uf);
    const regras = CR.obterRegras(cnae, categoria);

    const isServico = regras.tipoTributo === 'ISS';
    const isComercio = regras.categoria === 'comercio';
    const isIndustria = regras.categoria === 'industria';

    // ISS por tipo de serviço (se disponível)
    let issEspecifico = null;
    if (isServico && dados.iss.porTipoServico) {
      const cnaeNorm = cnae.replace(/[^0-9]/g, '');
      const servicos = dados.iss.porTipoServico;
      for (const key of Object.keys(servicos)) {
        if (key.includes(cnaeNorm) || key.includes(cnae)) {
          issEspecifico = servicos[key];
          break;
        }
      }
    }

    // ICMS diferenciado por produto (se disponível)
    let icmsDiferenciado = null;
    if (!isServico && dados.icms.diferenciadas) {
      icmsDiferenciado = dados.icms.diferenciadas;
    }

    return {
      uf: dados.sigla,
      nomeEstado: dados.nome,
      capital: dados.capital,
      regiao: dados.regiao,
      cnae: cnae,
      categoria: regras.categoria,

      // Tributo principal deste CNAE
      tributoPrincipal: isServico ? 'ISS' : 'ICMS',
      aliquotaPrincipal: isServico
        ? (issEspecifico || dados.iss.aliquotaGeral)
        : dados.icms.aliquotaEfetiva,
      aliquotaPrincipalPerc: isServico
        ? _fmtPctSafe(issEspecifico || dados.iss.aliquotaGeral)
        : dados.icms.aliquotaEfetivaPerc,

      // Detalhes ISS (se serviço)
      iss: isServico ? {
        aliquotaGeral: dados.iss.aliquotaGeral,
        aliquotaEspecifica: issEspecifico,
        municipio: dados.iss.municipioReferencia,
        faixa: `${_fmtPctSafe(dados.iss.aliquotaMinima)} a ${_fmtPctSafe(dados.iss.aliquotaMaxima)}`,
      } : null,

      // Detalhes ICMS (se comércio/indústria)
      icms: !isServico ? {
        aliquotaPadrao: dados.icms.aliquotaPadrao,
        aliquotaPadraoPerc: dados.icms.aliquotaPadraoPerc,
        fecop: dados.icms.fecop,
        aliquotaEfetiva: dados.icms.aliquotaEfetiva,
        aliquotaEfetivaPerc: dados.icms.aliquotaEfetivaPerc,
        diferenciadas: icmsDiferenciado,
        st: dados.icms.substituicaoTributaria,
        interestaduais: dados.icms.interestaduais,
      } : null,

      // Simples Nacional
      simplesNacional: {
        sublimite: dados.simplesNacional.sublimiteEstadual,
        sublimiteFormatado: dados.simplesNacional.sublimiteFormatado,
        anexo: regras.anexo,
        fatorR: regras.fatorR,
        vedado: regras.vedado,
      },

      // Incentivos
      incentivos: dados.incentivos,

      // Encargos trabalhistas
      encargos: {
        inssPatronal: dados.federal.inssPatronal,
        rat: dados.federal.rat,
        terceiros: dados.federal.terceiros,
        fgts: dados.federal.fgts,
        totalEncargos: _r(dados.federal.inssPatronal + dados.federal.rat + dados.federal.terceiros),
        totalComFGTS: _r(dados.federal.inssPatronal + dados.federal.rat + dados.federal.terceiros + dados.federal.fgts),
      },

      // Info complementar
      fonte: dados.fonte,
    };
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // 12.3 COMPARAR ENTRE ESTADOS (v3 — NOVO)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Compara o mesmo CNAE em múltiplos estados para encontrar o mais vantajoso.
   *
   * @param {Object} params
   * @param {string} params.cnae
   * @param {string} params.categoria
   * @param {number} params.faturamentoMensal
   * @param {number} params.folhaMensal
   * @param {string[]} [params.ufs] - Lista de UFs (default: todos os 27)
   * @returns {Array<Object>} Ranking de estados
   */
  CR.compararEntreEstados = function (params) {
    const { cnae, categoria, faturamentoMensal, folhaMensal, ufs } = params;

    const listaUFs = ufs || Object.keys(CR.INCENTIVOS_REGIONAIS);

    const resultados = listaUFs.map(uf => {
      const res = CR.comparar({
        faturamentoMensal, folhaMensal, cnae, categoria, uf
      });

      return {
        uf: uf,
        nome: res.dadosEstado.nome,
        regiao: res.dadosEstado.regiao,
        melhorRegime: res.melhorRegime,
        cargaMensal: res.cargaMenorMensal,
        cargaAnual: res.cargaMenorAnual,
        aliqEfetiva: res.ranking[0] ? res.ranking[0].aliqEfetiva : 0,
        economiaAnual: res.economiaAnual,
        temIncentivo: res.dadosEstado.incentivos.temIncentivoFederal,
        tipoIncentivo: res.dadosEstado.incentivos.tipoIncentivo,
        icmsReal: res.dadosEstado.icms.aliquotaEfetivaPerc,
        issReal: res.dadosEstado.iss.aliquotaGeralPerc,
        fecop: res.dadosEstado.icms.fecop.existe ? res.dadosEstado.icms.fecop.adicionalPerc : '-',
        fonte: res.dadosEstado.fonte,
      };
    });

    // Ordenar por menor carga
    resultados.sort((a, b) => (a.cargaMensal || 999999) - (b.cargaMensal || 999999));

    return {
      cnae: cnae,
      categoria: categoria,
      faturamentoMensal: faturamentoMensal,
      folhaMensal: folhaMensal,
      totalEstados: resultados.length,
      ranking: resultados,
      melhorEstado: resultados[0] || null,
      piorEstado: resultados[resultados.length - 1] || null,
      economiaMaxima: resultados.length >= 2
        ? _r((resultados[resultados.length - 1].cargaAnual || 0) - (resultados[0].cargaAnual || 0))
        : 0,
      versao: CR.VERSAO,
    };
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // 13. GERADOR DE VANTAGENS POR REGIME (v3: inclui dados do estado)
  // ═══════════════════════════════════════════════════════════════════════════

  CR._gerarVantagens = function (melhor, regras, uf, ctx) {
    const vantagens = [];
    const dadosUF = ctx.dadosUF || CR.extrairDadosEstado(uf);

    if (melhor.id === 'simples') {
      vantagens.push({
        icone: '📋', titulo: 'Guia única (DAS)',
        descricao: 'Até 8 tributos recolhidos em uma única guia mensal, reduzindo burocracia e custos contábeis.',
        impacto: 'alto', baseLegal: 'LC 123/2006, Art. 13'
      });
      vantagens.push({
        icone: '💰', titulo: 'Alíquota efetiva reduzida: ' + ctx.simples.aliqEfetivaFormatada,
        descricao: 'Alíquota progressiva sobre a RBT12 — quanto menor o faturamento, menor a alíquota.',
        impacto: 'alto', baseLegal: 'LC 123/2006, Anexo ' + ctx.simples.anexoEfetivo
      });
      if (ctx.simples.cppInclusa) {
        vantagens.push({
          icone: '🏢', titulo: 'CPP incluída no DAS',
          descricao: 'Contribuição Previdenciária Patronal (20%) já inclusa — sem pagamento separado.',
          impacto: 'alto', baseLegal: 'LC 123/2006, Anexo ' + ctx.simples.anexoEfetivo
        });
      }
      vantagens.push({
        icone: '📊', titulo: 'Obrigações acessórias simplificadas',
        descricao: 'Dispensa de ECD, ECF e EFD-Contribuições. Apenas PGDAS-D mensal e DEFIS anual.',
        impacto: 'medio', baseLegal: 'LC 123/2006, Art. 25-26'
      });
      // v3: ICMS/ISS info real
      if (regras.tipoTributo === 'ICMS') {
        vantagens.push({
          icone: '🏛️', titulo: `ICMS de ${dadosUF.icms.aliquotaPadraoPerc} incluído no DAS`,
          descricao: `Em ${dadosUF.nome} o ICMS padrão é ${dadosUF.icms.aliquotaPadraoPerc}` +
            (dadosUF.icms.fecop.existe ? ` (+${dadosUF.icms.fecop.adicionalPerc} ${dadosUF.icms.fecop.nome})` : '') +
            `. No Simples, está incluído na guia única com alíquota progressiva.`,
          impacto: 'alto', baseLegal: 'LC 123/2006'
        });
      }
      if (ctx.simples.fatorR >= 0.28 && regras.fatorR) {
        vantagens.push({
          icone: '✅', titulo: 'Fator "r" favorável: ' + ctx.simples.fatorRFormatado,
          descricao: 'Folha/faturamento ≥ 28% garante enquadramento no Anexo III (alíquotas menores que Anexo V).',
          impacto: 'alto', baseLegal: 'Resolução CGSN 140/2018, Art. 18, §5º-J'
        });
      }
      vantagens.push({
        icone: '💵', titulo: 'Distribuição de lucros isenta',
        descricao: 'Lucros distribuídos a sócios são isentos de IR na pessoa física.',
        impacto: 'alto', baseLegal: 'LC 123/2006, Art. 14'
      });
    }

    else if (melhor.id === 'presumido') {
      vantagens.push({
        icone: '📊', titulo: 'Simplicidade de apuração',
        descricao: 'Base de cálculo por percentual de presunção — sem necessidade de LALUR.',
        impacto: 'alto', baseLegal: 'Lei 9.249/95, Art. 15/20'
      });
      vantagens.push({
        icone: '💰', titulo: 'Presunção favorável: IRPJ ' + _fmtPct(regras.presuncaoIRPJ) + ' / CSLL ' + _fmtPct(regras.presuncaoCSLL),
        descricao: 'Se o lucro real supera a presunção, tributação é sobre base menor.',
        impacto: regras.presuncaoIRPJ <= 0.08 ? 'alto' : 'medio', baseLegal: 'Lei 9.249/95, Art. 15, §1º'
      });
      // v3: ISS real
      if (regras.tipoTributo === 'ISS') {
        vantagens.push({
          icone: '🏛️', titulo: `ISS de ${dadosUF.iss.aliquotaGeralPerc} em ${dadosUF.iss.municipioReferencia}`,
          descricao: `Alíquota ISS real de ${dadosUF.nome} (${dadosUF.capital}). Faixa: ${_fmtPctSafe(dadosUF.iss.aliquotaMinima)} a ${_fmtPctSafe(dadosUF.iss.aliquotaMaxima)}.`,
          impacto: 'info', baseLegal: 'LC 116/2003'
        });
      } else {
        vantagens.push({
          icone: '🏛️', titulo: `ICMS de ${dadosUF.icms.aliquotaEfetivaPerc} em ${dadosUF.nome}`,
          descricao: `ICMS padrão: ${dadosUF.icms.aliquotaPadraoPerc}` +
            (dadosUF.icms.fecop.existe ? ` + ${dadosUF.icms.fecop.adicionalPerc} ${dadosUF.icms.fecop.nome}` : '') +
            `. Direito a créditos nas compras com NF.`,
          impacto: 'info', baseLegal: 'Lei Kandir (LC 87/96)'
        });
      }
      if (ctx.presumido.temIncentivo) {
        vantagens.push({
          icone: '🏆', titulo: ctx.presumido.tipoIncentivo + ': redução de 75% no IRPJ',
          descricao: 'Economia mensal de ' + _fmtBRL(ctx.presumido.irpjReducao) + '.',
          impacto: 'critico', baseLegal: ctx.presumido.tipoIncentivo === 'SUDAM' ? 'Art. 615-627 RIR/2018' : 'Art. 627 RIR/2018'
        });
      }
      vantagens.push({
        icone: '💵', titulo: 'Distribuição de lucros isenta',
        descricao: 'Lucro presumido menos tributos é distribuível aos sócios isento de IR.',
        impacto: 'alto', baseLegal: 'Lei 9.249/95, Art. 10'
      });
      vantagens.push({
        icone: '📋', titulo: 'PIS/COFINS cumulativo (3,65%)',
        descricao: 'Alíquotas de PIS (0,65%) e COFINS (3%) sem regime de créditos — mais simples.',
        impacto: 'medio', baseLegal: 'Lei 10.637/02; Lei 10.833/03'
      });
    }

    else if (melhor.id === 'real') {
      vantagens.push({
        icone: '📊', titulo: 'Tributa lucro efetivo',
        descricao: 'IRPJ/CSLL sobre lucro contábil real — vantajoso para margem baixa.',
        impacto: 'alto', baseLegal: 'RIR/2018, Art. 258-261'
      });
      vantagens.push({
        icone: '💳', titulo: 'Créditos de PIS/COFINS (não cumulativo)',
        descricao: 'Creditar insumos contra PIS/COFINS devidos. Economia estimada de ' +
          _fmtBRL(_r((ctx.faturamentoMensal * 0.30) * 0.0925)) + '/mês.',
        impacto: 'alto', baseLegal: 'Lei 10.637/02, Art. 3º; Lei 10.833/03, Art. 3º'
      });
      vantagens.push({
        icone: '📉', titulo: 'Compensação de prejuízos fiscais',
        descricao: 'Compensar prejuízos com lucros futuros (até 30%/período), sem expiração.',
        impacto: 'alto', baseLegal: 'RIR/2018, Art. 261, III'
      });
      vantagens.push({
        icone: '💼', titulo: 'JCP — Juros sobre Capital Próprio',
        descricao: 'JCP dedutível do IRPJ/CSLL (economia de até 34% menos 15% IRRF).',
        impacto: 'alto', baseLegal: 'RIR/2018, Art. 355-358'
      });
      if (ctx.real.temIncentivo) {
        vantagens.push({
          icone: '🏆', titulo: ctx.real.tipoIncentivo + ': redução de 75% no IRPJ',
          descricao: 'Economia mensal de ' + _fmtBRL(ctx.real.irpjReducao) + '.',
          impacto: 'critico', baseLegal: ctx.real.tipoIncentivo === 'SUDAM' ? 'Art. 615-627 RIR/2018' : 'Art. 627 RIR/2018'
        });
      }
      // v3: Incentivos estaduais
      if (dadosUF.incentivos.totalProgramasEstaduais > 0) {
        vantagens.push({
          icone: '📜', titulo: `${dadosUF.incentivos.totalProgramasEstaduais} programa(s) de incentivo estadual em ${dadosUF.nome}`,
          descricao: 'Verifique programas estaduais que podem complementar os benefícios federais com reduções adicionais de ICMS e outras vantagens.',
          impacto: 'medio', baseLegal: 'Legislação estadual'
        });
      }
      if (dadosUF.incentivos.zfm) {
        vantagens.push({
          icone: '🏭', titulo: 'Zona Franca de Manaus',
          descricao: 'Isenção de IPI + redução de ICMS + créditos fiscais especiais.',
          impacto: 'critico', baseLegal: 'Decreto-Lei 288/1967'
        });
      }
    }

    return vantagens;
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // 14. GERADOR DE RECOMENDAÇÃO TEXTUAL (v3: com dados reais)
  // ═══════════════════════════════════════════════════════════════════════════

  CR._gerarRecomendacao = function (melhor, regras, uf, ctx) {
    const dadosUF = ctx.dadosUF || CR.extrairDadosEstado(uf);
    let texto = '';

    if (melhor.id === 'simples') {
      texto = `O Simples Nacional (Anexo ${ctx.simples.anexoEfetivo}) é o regime mais econômico para este CNAE em ${dadosUF.nome}. `;
      texto += `A alíquota efetiva de ${ctx.simples.aliqEfetivaFormatada} resulta em uma carga mensal de ${_fmtBRL(ctx.simples.total)}, `;
      texto += `com economia de ${_fmtBRL(ctx.economiaAnual)}/ano em relação ao regime mais caro. `;

      if (regras.tipoTributo === 'ICMS') {
        texto += `O ICMS de ${dadosUF.icms.aliquotaEfetivaPerc} de ${dadosUF.nome} está incluído no DAS. `;
      }
      if (regras.fatorR && ctx.simples.fatorR >= 0.28) {
        texto += `O Fator "r" de ${ctx.simples.fatorRFormatado} garante o Anexo III. Mantenha a folha acima de 28% do faturamento. `;
      } else if (regras.fatorR && ctx.simples.fatorR < 0.28) {
        texto += `⚠️ Fator "r" de ${ctx.simples.fatorRFormatado} enquadra no Anexo V. Avalie aumentar a folha para migrar ao Anexo III. `;
      }
      if (ctx.simples.sublimiteAlerta) {
        texto += `⚠️ Faturamento acima do sublimite de ${dadosUF.simplesNacional.sublimiteFormatado}: ICMS/ISS recolhidos por fora do DAS. `;
      }
    }

    else if (melhor.id === 'presumido') {
      texto = `O Lucro Presumido é o regime mais econômico para este CNAE em ${dadosUF.nome}. `;
      texto += `Com presunção de ${_fmtPct(regras.presuncaoIRPJ)} (IRPJ) e ${_fmtPct(regras.presuncaoCSLL)} (CSLL), `;
      texto += `a carga mensal é de ${_fmtBRL(ctx.presumido.total)} (${ctx.presumido.aliqEfetivaFormatada} efetiva). `;

      if (regras.tipoTributo === 'ISS') {
        texto += `ISS de ${dadosUF.iss.aliquotaGeralPerc} (${dadosUF.iss.municipioReferencia}). `;
      } else {
        texto += `ICMS de ${dadosUF.icms.aliquotaEfetivaPerc}`;
        if (dadosUF.icms.fecop.existe) texto += ` (inclui ${dadosUF.icms.fecop.adicionalPerc} de ${dadosUF.icms.fecop.nome})`;
        texto += `. `;
      }

      if (ctx.presumido.temIncentivo) {
        texto += `O benefício ${ctx.presumido.tipoIncentivo} reduz o IRPJ em 75%, economia adicional de ${_fmtBRL(ctx.presumido.irpjReducao)}/mês. `;
      }
      texto += `Economia de ${_fmtBRL(ctx.economiaAnual)}/ano vs regime mais caro. `;
    }

    else if (melhor.id === 'real') {
      texto = `O Lucro Real é o regime mais econômico para este CNAE em ${dadosUF.nome}. `;
      texto += `Tributando o lucro efetivo (margem estimada de ${_fmtPct(ctx.real.margemLucroUsada)}), `;
      texto += `a carga mensal é de ${_fmtBRL(ctx.real.total)} (${ctx.real.aliqEfetivaFormatada} efetiva). `;

      if (regras.tipoTributo === 'ISS') {
        texto += `ISS de ${dadosUF.iss.aliquotaGeralPerc} (${dadosUF.iss.municipioReferencia}). `;
      } else {
        texto += `ICMS efetivo de ${dadosUF.icms.aliquotaEfetivaPerc} em ${dadosUF.nome}. `;
      }

      if (ctx.real.temIncentivo) {
        texto += `O benefício ${ctx.real.tipoIncentivo} (75% de redução no IRPJ) torna o Lucro Real especialmente vantajoso. `;
      }
      texto += `Economia de ${_fmtBRL(ctx.economiaAnual)}/ano. `;
      texto += 'Permite créditos de PIS/COFINS, JCP, e compensação de prejuízos. ';
    }

    return texto.trim();
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // 15. GERADOR DE ALERTAS (v3: com dados reais)
  // ═══════════════════════════════════════════════════════════════════════════

  CR._gerarAlertas = function (regras, uf, ctx) {
    const alertas = [];
    const dadosUF = ctx.dadosUF || CR.extrairDadosEstado(uf);
    const rbt12 = ctx.faturamentoMensal * 12;

    // Proximidade do limite do Simples
    if (rbt12 > 4_000_000 && rbt12 <= 4_800_000) {
      alertas.push({
        tipo: 'atencao', icone: '⚠️',
        titulo: 'Faturamento próximo do limite do Simples Nacional',
        descricao: `RBT12 de ${_fmtBRL(rbt12)} está a ${_fmtBRL(4_800_000 - rbt12)} do teto. Planeje transição.`
      });
    }

    // Fator "r"
    if (regras.fatorR && ctx.folhaMensal > 0) {
      const fatorR = ctx.folhaMensal / ctx.faturamentoMensal;
      if (fatorR >= 0.25 && fatorR < 0.28) {
        alertas.push({
          tipo: 'critico', icone: '🔴',
          titulo: 'Fator "r" em zona de risco',
          descricao: `Fator "r" de ${_fmtPct(fatorR)} — muito próximo do limiar de 28%.`
        });
      } else if (fatorR >= 0.28 && fatorR <= 0.31) {
        alertas.push({
          tipo: 'atencao', icone: '⚡',
          titulo: 'Fator "r" em margem estreita',
          descricao: `Fator "r" de ${_fmtPct(fatorR)} — acima do limiar mas com margem apertada.`
        });
      }
    }

    // CNAE vedado
    if (regras.vedado) {
      alertas.push({
        tipo: 'info', icone: '⛔',
        titulo: 'CNAE vedado ao Simples Nacional',
        descricao: `Compare apenas Lucro Presumido e Real. ${regras.nota || ''}`
      });
    }

    // v3: Incentivo regional com dados reais
    if (dadosUF.incentivos.temIncentivoFederal) {
      alertas.push({
        tipo: 'oportunidade', icone: '🏆',
        titulo: `Incentivo ${dadosUF.incentivos.tipoIncentivo} disponível em ${dadosUF.nome}`,
        descricao: `Redução de até 75% do IRPJ. Especialmente vantajoso no Lucro Real com projeto aprovado.`
      });
    }

    // v3: ZFM
    if (dadosUF.incentivos.zfm) {
      alertas.push({
        tipo: 'oportunidade', icone: '🏭',
        titulo: 'Zona Franca de Manaus',
        descricao: 'Incentivos ZFM: isenção de IPI, redução de ICMS e créditos fiscais especiais.'
      });
    }

    // v3: FECOP
    if (dadosUF.icms.fecop.existe) {
      alertas.push({
        tipo: 'info', icone: '📌',
        titulo: `${dadosUF.icms.fecop.nome} de ${dadosUF.icms.fecop.adicionalPerc} em ${dadosUF.nome}`,
        descricao: `Adicional de ${dadosUF.icms.fecop.adicionalPerc} sobre determinados produtos. ICMS efetivo: ${dadosUF.icms.aliquotaEfetivaPerc}.`
      });
    }

    // v3: Sublimite real do estado
    const sublimite = dadosUF.simplesNacional.sublimiteEstadual;
    if (rbt12 > sublimite && rbt12 <= CR.LIMITES.simplesNacional.receitaBrutaAnual) {
      alertas.push({
        tipo: 'atencao', icone: '📋',
        titulo: 'Sublimite estadual ultrapassado',
        descricao: `RBT12 de ${_fmtBRL(rbt12)} ultrapassou o sublimite de ${_fmtBRL(sublimite)} de ${dadosUF.nome}. ICMS/ISS por fora do DAS.`
      });
    }

    // v3: Programas estaduais
    if (dadosUF.incentivos.totalProgramasEstaduais > 0) {
      alertas.push({
        tipo: 'oportunidade', icone: '📜',
        titulo: `${dadosUF.incentivos.totalProgramasEstaduais} programa(s) de incentivo estadual`,
        descricao: `${dadosUF.nome} possui programas estaduais de incentivo fiscal. Consulte a SEFAZ para verificar elegibilidade.`
      });
    }

    // v3: Fonte dos dados
    if (dadosUF.fonte === 'fallback') {
      alertas.push({
        tipo: 'atencao', icone: '⚠️',
        titulo: 'Dados estimados (estados.js não carregado)',
        descricao: 'Os valores de ICMS, ISS e incentivos são estimativas. Carregue os arquivos de estado para dados reais.'
      });
    }

    // Reforma Tributária
    alertas.push({
      tipo: 'info', icone: '📜',
      titulo: 'Reforma Tributária (LC 214/2025)',
      descricao: 'IBS e CBS substituirão ICMS, ISS, PIS, COFINS e IPI entre 2026-2033. Monitore impactos.'
    });

    return alertas;
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // 16. ANÁLISE DE CENÁRIOS (v3: com dados reais)
  // ═══════════════════════════════════════════════════════════════════════════

  CR.analisarCenarios = function (params) {
    const {
      cnae, categoria, uf,
      percentualFolha = 0.40,
      faixas = [10_000, 30_000, 50_000, 100_000, 200_000, 300_000, 400_000, 500_000]
    } = params;

    return faixas.map(fat => {
      const folha = fat * percentualFolha;
      const resultado = CR.comparar({
        faturamentoMensal: fat,
        folhaMensal: folha,
        cnae: cnae,
        categoria: categoria,
        uf: uf
      });

      return {
        faturamentoMensal: fat,
        faturamentoAnual: fat * 12,
        folhaMensal: folha,
        melhorRegime: resultado.melhorRegime,
        cargaMensal: resultado.cargaMenorMensal,
        cargaAnual: resultado.cargaMenorAnual,
        aliqEfetiva: resultado.ranking[0] ? resultado.ranking[0].aliqEfetiva : 0,
        economiaAnual: resultado.economiaAnual
      };
    });
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // 16.1 LIMPAR CACHE (v3 — NOVO)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Limpa o cache de dados de estados.
   * Útil se os dados de estados.js foram atualizados dinamicamente.
   */
  CR.limparCache = function () {
    Object.keys(_cacheEstadoDados).forEach(k => delete _cacheEstadoDados[k]);
    CR._estadosModule = null;
    CR._estadosDisponivel = false;
    console.log('[ComparadorRegimes v3] Cache limpo');
  };

  /**
   * Status do módulo
   */
  CR.status = function () {
    CR._initEstados();
    return {
      versao: CR.VERSAO,
      estadosDisponivel: CR._estadosDisponivel,
      cacheEstados: Object.keys(_cacheEstadoDados).length,
      dataBase: CR.DATA_BASE,
    };
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // 17. EXPORTAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════

  if (typeof window !== 'undefined') {
    window.ComparadorRegimes = CR;
    window.CR = CR;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CR;
  }

  if (typeof define === 'function' && define.amd) {
    define(function () { return CR; });
  }

})(this);
