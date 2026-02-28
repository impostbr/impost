/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ESTADOS.JS — Agregador Central de Dados Tributários de Todas as Unidades Federativas
 * ═══════════════════════════════════════════════════════════════════════════════════
 *
 * Versão: 1.0.0
 * Data: 10/02/2026
 * Autor: AGROGEO BRASIL — Calculadora de Impostos
 *
 * DESCRIÇÃO:
 *   Módulo centralizador que importa, valida e disponibiliza os dados tributários
 *   completos de todas as 27 Unidades Federativas do Brasil (26 Estados + DF).
 *   Projetado para alimentar a aba de Estados na Calculadora de Impostos.
 *
 * ESTRUTURA DE CADA ESTADO (13 seções + utils):
 *   01. dados_gerais        — Identificação, sigla, região, capital, links SEFAZ
 *   02. icms                — Alíquotas, diferenciadas, FECOP, DIFAL, ST, interestaduais
 *   03. ipva                — Alíquotas por tipo, calendário, descontos, isenções
 *   04. itcmd               — Alíquotas causa mortis/doação, faixas progressivas
 *   05. iss                 — Alíquotas por serviço (município-capital referência)
 *   06. iptu                — Residencial, comercial, terreno, isenções
 *   07. itbi                — Alíquota, base de cálculo
 *   08. taxas               — Estaduais e municipais (capital)
 *   09. federal             — IRPJ, CSLL, PIS, COFINS, IOF, INSS, FGTS, IRPF
 *   10. simples_nacional    — Anexos I-V, faixas, sublimite, MEI
 *   11. incentivos          — SUDAM, SUDENE, SUDECO, ZFM, ALC, programas estaduais
 *   12. reforma_tributaria  — IBS, CBS, IS, cronograma transição 2026-2033
 *   13. cobertura           — Versão, completude, itens localizados/pendentes
 *   +   utils               — Funções auxiliares de cálculo específicas do estado
 *
 * USO:
 *   // Node.js
 *   const { Estados, getEstado, listarEstados } = require('./scripts/estados');
 *
 *   // Browser (após carregar todos os scripts de estado)
 *   <script src="estados/acre.js"></script>
 *   ...todos os 27 scripts...
 *   <script src="scripts/estados.js"></script>
 *   const mt = Estados.getEstado('MT');
 *
 * ═══════════════════════════════════════════════════════════════════════════════════
 */

(function (root, factory) {
  // ─── Browser FIRST (evita conflito com 'module' global de bundlers) ───
  if (typeof window !== "undefined") {
    try {
      var result = factory(false);
      window.Estados = result;
      window.EstadosBR = result; // alias
    } catch (e) {
      console.error('[Estados.js] Erro ao inicializar:', e);
    }
  } else if (typeof module !== "undefined" && module.exports) {
    // ─── Node.js / CommonJS ───
    module.exports = factory(true);
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (isNode) {

  "use strict";

  // ═══════════════════════════════════════════════════════════════════════════
  //  REGISTRO DAS 27 UNIDADES FEDERATIVAS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Mapeamento completo: sigla → { arquivo, constGlobal, utilsGlobal, nomeCompleto, região }
   * Usado para importação dinâmica (Node) e referência por window (Browser)
   */
  const UF_REGISTRY = {
    AC: { arquivo: "acre",                constGlobal: "ACRE_TRIBUTARIO",                utilsGlobal: "AcreTributario",              nome: "Acre",                     regiao: "Norte" },
    AL: { arquivo: "alagoas",             constGlobal: "ALAGOAS_TRIBUTARIO",             utilsGlobal: "AlagoasTributario",           nome: "Alagoas",                  regiao: "Nordeste" },
    AP: { arquivo: "amapa",               constGlobal: "AMAPA_TRIBUTARIO",               utilsGlobal: "AmapaTributario",             nome: "Amapá",                    regiao: "Norte" },
    AM: { arquivo: "amazonas",            constGlobal: "AMAZONAS_TRIBUTARIO",            utilsGlobal: "AmazonasTributario",          nome: "Amazonas",                 regiao: "Norte" },
    BA: { arquivo: "bahia",               constGlobal: "BAHIA_TRIBUTARIO",               utilsGlobal: "BahiaTributario",             nome: "Bahia",                    regiao: "Nordeste" },
    CE: { arquivo: "ceara",               constGlobal: "CEARA_TRIBUTARIO",               utilsGlobal: "CearaTributario",             nome: "Ceará",                    regiao: "Nordeste" },
    DF: { arquivo: "distrito_federal",    constGlobal: "DISTRITO_FEDERAL_TRIBUTARIO",    utilsGlobal: "DistritoFederalTributario",   nome: "Distrito Federal",         regiao: "Centro-Oeste" },
    ES: { arquivo: "espirito_santo",      constGlobal: "ESPIRITO_SANTO_TRIBUTARIO",      utilsGlobal: "EspiritoSantoTributario",     nome: "Espírito Santo",           regiao: "Sudeste" },
    GO: { arquivo: "goias",               constGlobal: "GOIAS_TRIBUTARIO",               utilsGlobal: "GoiasTributario",             nome: "Goiás",                    regiao: "Centro-Oeste" },
    MA: { arquivo: "maranhao",            constGlobal: "MARANHAO_TRIBUTARIO",            utilsGlobal: "MaranhaoTributario",          nome: "Maranhão",                 regiao: "Nordeste" },
    MT: { arquivo: "mato_grosso",         constGlobal: "MATO_GROSSO_TRIBUTARIO",         utilsGlobal: "MatoGrossoTributario",        nome: "Mato Grosso",              regiao: "Centro-Oeste" },
    MS: { arquivo: "mato_grosso_do_sul",  constGlobal: "MATO_GROSSO_DO_SUL_TRIBUTARIO",  utilsGlobal: "MatoGrossoDoSulTributario",   nome: "Mato Grosso do Sul",       regiao: "Centro-Oeste" },
    MG: { arquivo: "minas_gerais",        constGlobal: "MINAS_GERAIS_TRIBUTARIO",        utilsGlobal: "MinasGeraisTributario",       nome: "Minas Gerais",             regiao: "Sudeste" },
    PA: { arquivo: "para",                constGlobal: "PARA_TRIBUTARIO",                utilsGlobal: "ParaTributario",              nome: "Pará",                     regiao: "Norte" },
    PB: { arquivo: "paraiba",             constGlobal: "PARAIBA_TRIBUTARIO",             utilsGlobal: "ParaibaTributario",           nome: "Paraíba",                  regiao: "Nordeste" },
    PR: { arquivo: "parana",              constGlobal: "PARANA_TRIBUTARIO",              utilsGlobal: "ParanaTributario",            nome: "Paraná",                   regiao: "Sul" },
    PE: { arquivo: "pernambuco",          constGlobal: "PERNAMBUCO_TRIBUTARIO",          utilsGlobal: "PernambucoTributario",        nome: "Pernambuco",               regiao: "Nordeste" },
    PI: { arquivo: "piaui",               constGlobal: "PIAUI_TRIBUTARIO",               utilsGlobal: "PiauiTributario",             nome: "Piauí",                    regiao: "Nordeste" },
    RJ: { arquivo: "rio_de_janeiro",      constGlobal: "RIO_DE_JANEIRO_TRIBUTARIO",      utilsGlobal: "RioDeJaneiroTributario",      nome: "Rio de Janeiro",           regiao: "Sudeste" },
    RN: { arquivo: "rio_grande_do_norte", constGlobal: "RIO_GRANDE_DO_NORTE_TRIBUTARIO", utilsGlobal: "RioGrandeDoNorteTributario",  nome: "Rio Grande do Norte",      regiao: "Nordeste" },
    RS: { arquivo: "rio_grande_do_sul",   constGlobal: "RIO_GRANDE_DO_SUL_TRIBUTARIO",   utilsGlobal: "RioGrandeDoSulTributario",    nome: "Rio Grande do Sul",        regiao: "Sul" },
    RO: { arquivo: "rondonia",            constGlobal: "RONDONIA_TRIBUTARIO",            utilsGlobal: "RondoniaTributario",          nome: "Rondônia",                 regiao: "Norte" },
    RR: { arquivo: "roraima",             constGlobal: "RORAIMA_TRIBUTARIO",             utilsGlobal: "RoraimaTributario",           nome: "Roraima",                  regiao: "Norte" },
    SC: { arquivo: "santa_catarina",      constGlobal: "SANTA_CATARINA_TRIBUTARIO",      utilsGlobal: "SantaCatarinaTributario",     nome: "Santa Catarina",           regiao: "Sul" },
    SP: { arquivo: "sao_paulo",           constGlobal: "SAO_PAULO_TRIBUTARIO",           utilsGlobal: "SaoPauloTributario",          nome: "São Paulo",                regiao: "Sudeste" },
    SE: { arquivo: "sergipe",             constGlobal: "SERGIPE_TRIBUTARIO",             utilsGlobal: "SergipeTributario",           nome: "Sergipe",                  regiao: "Nordeste" },
    TO: { arquivo: "tocantins",           constGlobal: "TOCANTINS_TRIBUTARIO",           utilsGlobal: "TocantinsTributario",         nome: "Tocantins",                regiao: "Norte" },
  };

  // Seções obrigatórias que todo estado deve ter
  const SECOES_OBRIGATORIAS = [
    "dados_gerais", "icms", "ipva", "itcmd", "iss", "iptu", "itbi",
    "taxas", "federal", "simples_nacional", "incentivos", "reforma_tributaria", "cobertura"
  ];

  // Nota: RJ usa "itd" ao invés de "itcmd" — tratar na normalização
  const SECOES_ALTERNATIVAS = {
    itcmd: ["itd", "itcd"],
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  CARREGAMENTO DOS DADOS
  // ═══════════════════════════════════════════════════════════════════════════

  /** @type {Object<string, object>} Cache central: sigla → dados completos */
  const _cache = {};

  /** @type {Object<string, object>} Cache de utils: sigla → funções utilitárias */
  const _utilsCache = {};

  /** @type {string[]} Log de erros de carregamento */
  const _errosCarregamento = [];

  /**
   * Carrega dados de um estado individual
   * @param {string} sigla - Sigla do estado (ex: "MT")
   * @returns {{ dados: object|null, utils: object|null, erro: string|null }}
   */
  function _carregarEstado(sigla) {
    const reg = UF_REGISTRY[sigla];
    if (!reg) {
      return { dados: null, utils: null, erro: `Sigla '${sigla}' não encontrada no registro` };
    }

    let dados = null;
    let utils = null;

    if (isNode) {
      // ─── Node.js: require do arquivo ───
      try {
        const caminho = __dirname + "/../estados/" + reg.arquivo + ".js";
        const mod = require(caminho);
        // Separar dados e utils
        if (mod.utils) {
          utils = mod.utils;
          dados = {};
          Object.keys(mod).forEach(function (k) {
            if (k !== "utils") dados[k] = mod[k];
          });
        } else {
          dados = mod;
        }
      } catch (e) {
        // Tentar caminho alternativo (mesmo diretório que estados.js)
        try {
          const caminhoAlt = __dirname + "/" + reg.arquivo + ".js";
          const mod = require(caminhoAlt);
          if (mod.utils) {
            utils = mod.utils;
            dados = {};
            Object.keys(mod).forEach(function (k) {
              if (k !== "utils") dados[k] = mod[k];
            });
          } else {
            dados = mod;
          }
        } catch (e2) {
          return { dados: null, utils: null, erro: `Falha ao carregar '${reg.arquivo}.js': ${e2.message}` };
        }
      }
    } else {
      // ─── Browser: leitura via window globals ───
      if (typeof window !== "undefined") {
        dados = window[reg.constGlobal] || null;
        utils = window[reg.utilsGlobal] || null;

        if (!dados) {
          return { dados: null, utils: null, erro: `window.${reg.constGlobal} não encontrado — verifique se '${reg.arquivo}.js' foi carregado via <script>` };
        }
      }
    }

    return { dados: dados, utils: utils, erro: null };
  }

  /**
   * Normaliza seções do estado (ex: RJ usa "itd" em vez de "itcmd")
   * @param {object} dados
   * @returns {object}
   */
  function _normalizarSecoes(dados) {
    if (!dados) return dados;

    // Tratar nomes alternativos de seções
    Object.keys(SECOES_ALTERNATIVAS).forEach(function (secaoPadrao) {
      if (!dados[secaoPadrao]) {
        var alternativas = SECOES_ALTERNATIVAS[secaoPadrao];
        for (var i = 0; i < alternativas.length; i++) {
          if (dados[alternativas[i]]) {
            dados[secaoPadrao] = dados[alternativas[i]];
            break;
          }
        }
      }
    });

    return dados;
  }

  /**
   * Valida se o estado possui todas as seções obrigatórias
   * @param {string} sigla
   * @param {object} dados
   * @returns {{ valido: boolean, faltantes: string[] }}
   */
  function _validarSecoes(sigla, dados) {
    if (!dados) return { valido: false, faltantes: SECOES_OBRIGATORIAS.slice() };

    var faltantes = [];
    SECOES_OBRIGATORIAS.forEach(function (secao) {
      if (!dados[secao]) {
        faltantes.push(secao);
      }
    });

    return { valido: faltantes.length === 0, faltantes: faltantes };
  }

  /**
   * Inicializa e carrega todos os 27 estados no cache
   * @returns {{ total: number, carregados: number, erros: string[] }}
   */
  function _inicializarTodos() {
    var total = Object.keys(UF_REGISTRY).length;
    var carregados = 0;

    Object.keys(UF_REGISTRY).forEach(function (sigla) {
      if (_cache[sigla]) {
        carregados++;
        return;
      }

      var resultado = _carregarEstado(sigla);

      if (resultado.erro) {
        _errosCarregamento.push(sigla + ": " + resultado.erro);
      } else {
        var dadosNorm = _normalizarSecoes(resultado.dados);
        _cache[sigla] = dadosNorm;
        _utilsCache[sigla] = resultado.utils;
        carregados++;
      }
    });

    return { total: total, carregados: carregados, erros: _errosCarregamento.slice() };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  API PÚBLICA — ACESSO AOS DADOS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Obtém os dados tributários completos de um estado
   * @param {string} siglaOuNome - Sigla (ex: "MT") ou nome (ex: "Mato Grosso")
   * @returns {object|null} Dados tributários completos do estado ou null se não encontrado
   */
  function getEstado(siglaOuNome) {
    var sigla = _resolverSigla(siglaOuNome);
    if (!sigla) return null;

    // Lazy load
    if (!_cache[sigla]) {
      var resultado = _carregarEstado(sigla);
      if (resultado.erro) {
        console.warn("[Estados] " + resultado.erro);
        return null;
      }
      _cache[sigla] = _normalizarSecoes(resultado.dados);
      _utilsCache[sigla] = resultado.utils;
    }

    return _cache[sigla];
  }

  /**
   * Obtém as funções utilitárias de um estado
   * @param {string} siglaOuNome
   * @returns {object|null} Objeto com funções utilitárias ou null
   */
  function getUtils(siglaOuNome) {
    var sigla = _resolverSigla(siglaOuNome);
    if (!sigla) return null;

    // Garantir carregamento
    if (!_utilsCache[sigla]) {
      getEstado(sigla);
    }

    return _utilsCache[sigla] || null;
  }

  /**
   * Obtém dados tributários completos + utils em um único objeto
   * @param {string} siglaOuNome
   * @returns {{ dados: object, utils: object, sigla: string, nome: string }|null}
   */
  function getEstadoCompleto(siglaOuNome) {
    var sigla = _resolverSigla(siglaOuNome);
    if (!sigla) return null;

    var dados = getEstado(sigla);
    var utils = getUtils(sigla);
    var reg = UF_REGISTRY[sigla];

    if (!dados) return null;

    return {
      sigla: sigla,
      nome: reg.nome,
      regiao: reg.regiao,
      dados: dados,
      utils: utils || {},
    };
  }

  /**
   * Obtém uma seção específica de um estado
   * @param {string} siglaOuNome - Sigla ou nome do estado
   * @param {string} secao - Nome da seção (ex: "icms", "ipva", "itcmd")
   * @returns {object|null}
   */
  function getSecao(siglaOuNome, secao) {
    var estado = getEstado(siglaOuNome);
    if (!estado) return null;
    return estado[secao] || null;
  }

  /**
   * Obtém o ICMS de um estado (seção mais consultada)
   * @param {string} siglaOuNome
   * @returns {object|null}
   */
  function getICMS(siglaOuNome) {
    return getSecao(siglaOuNome, "icms");
  }

  /**
   * Obtém o IPVA de um estado
   * @param {string} siglaOuNome
   * @returns {object|null}
   */
  function getIPVA(siglaOuNome) {
    return getSecao(siglaOuNome, "ipva");
  }

  /**
   * Obtém o ITCMD de um estado
   * @param {string} siglaOuNome
   * @returns {object|null}
   */
  function getITCMD(siglaOuNome) {
    return getSecao(siglaOuNome, "itcmd");
  }

  /**
   * Obtém o ISS (capital) de um estado
   * @param {string} siglaOuNome
   * @returns {object|null}
   */
  function getISS(siglaOuNome) {
    return getSecao(siglaOuNome, "iss");
  }

  /**
   * Obtém o IPTU (capital) de um estado
   * @param {string} siglaOuNome
   * @returns {object|null}
   */
  function getIPTU(siglaOuNome) {
    return getSecao(siglaOuNome, "iptu");
  }

  /**
   * Obtém o ITBI (capital) de um estado
   * @param {string} siglaOuNome
   * @returns {object|null}
   */
  function getITBI(siglaOuNome) {
    return getSecao(siglaOuNome, "itbi");
  }

  /**
   * Obtém as taxas de um estado
   * @param {string} siglaOuNome
   * @returns {object|null}
   */
  function getTaxas(siglaOuNome) {
    return getSecao(siglaOuNome, "taxas");
  }

  /**
   * Obtém os impostos federais aplicáveis ao estado
   * @param {string} siglaOuNome
   * @returns {object|null}
   */
  function getFederal(siglaOuNome) {
    return getSecao(siglaOuNome, "federal");
  }

  /**
   * Obtém dados do Simples Nacional para o estado
   * @param {string} siglaOuNome
   * @returns {object|null}
   */
  function getSimplesNacional(siglaOuNome) {
    return getSecao(siglaOuNome, "simples_nacional");
  }

  /**
   * Obtém incentivos fiscais do estado
   * @param {string} siglaOuNome
   * @returns {object|null}
   */
  function getIncentivos(siglaOuNome) {
    return getSecao(siglaOuNome, "incentivos");
  }

  /**
   * Obtém dados da reforma tributária para o estado
   * @param {string} siglaOuNome
   * @returns {object|null}
   */
  function getReformaTributaria(siglaOuNome) {
    return getSecao(siglaOuNome, "reforma_tributaria");
  }

  /**
   * Obtém dados de cobertura/completude do estado
   * @param {string} siglaOuNome
   * @returns {object|null}
   */
  function getCobertura(siglaOuNome) {
    return getSecao(siglaOuNome, "cobertura");
  }

  /**
   * Obtém os dados gerais de um estado
   * @param {string} siglaOuNome
   * @returns {object|null}
   */
  function getDadosGerais(siglaOuNome) {
    return getSecao(siglaOuNome, "dados_gerais");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  API PÚBLICA — LISTAGENS E CONSULTAS AGREGADAS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Lista todas as UFs disponíveis com informações básicas
   * @returns {Array<{ sigla: string, nome: string, regiao: string, arquivo: string }>}
   */
  function listarEstados() {
    return Object.keys(UF_REGISTRY).sort().map(function (sigla) {
      var reg = UF_REGISTRY[sigla];
      return {
        sigla: sigla,
        nome: reg.nome,
        regiao: reg.regiao,
        arquivo: reg.arquivo + ".js",
      };
    });
  }

  /**
   * Lista estados por região
   * @param {string} regiao - "Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"
   * @returns {Array<{ sigla: string, nome: string }>}
   */
  function listarPorRegiao(regiao) {
    var regiaoNorm = _normalizar(regiao);
    return Object.keys(UF_REGISTRY).filter(function (sigla) {
      return _normalizar(UF_REGISTRY[sigla].regiao) === regiaoNorm;
    }).sort().map(function (sigla) {
      return { sigla: sigla, nome: UF_REGISTRY[sigla].nome };
    });
  }

  /**
   * Retorna lista de siglas disponíveis
   * @returns {string[]}
   */
  function listarSiglas() {
    return Object.keys(UF_REGISTRY).sort();
  }

  /**
   * Retorna dados para popular um <select> de estados no HTML
   * @param {{ incluirVazio: boolean, textoVazio: string }} [opcoes]
   * @returns {Array<{ value: string, label: string, regiao: string }>}
   */
  function opcoesSelect(opcoes) {
    var opts = opcoes || {};
    var resultado = [];

    if (opts.incluirVazio !== false) {
      resultado.push({
        value: "",
        label: opts.textoVazio || "Selecione um estado...",
        regiao: "",
      });
    }

    Object.keys(UF_REGISTRY).sort().forEach(function (sigla) {
      var reg = UF_REGISTRY[sigla];
      resultado.push({
        value: sigla,
        label: reg.nome + " (" + sigla + ")",
        regiao: reg.regiao,
      });
    });

    return resultado;
  }

  /**
   * Retorna opções de select agrupadas por região (para <optgroup>)
   * @returns {Object<string, Array<{ value: string, label: string }>>}
   */
  function opcoesSelectPorRegiao() {
    var regioes = {
      "Norte": [],
      "Nordeste": [],
      "Centro-Oeste": [],
      "Sudeste": [],
      "Sul": [],
    };

    Object.keys(UF_REGISTRY).sort().forEach(function (sigla) {
      var reg = UF_REGISTRY[sigla];
      if (regioes[reg.regiao]) {
        regioes[reg.regiao].push({
          value: sigla,
          label: reg.nome + " (" + sigla + ")",
        });
      }
    });

    return regioes;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  API PÚBLICA — COMPARATIVOS ENTRE ESTADOS
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── Normalizadores internos para variações estruturais ───

  /**
   * Extrai a alíquota padrão de ICMS independente da estrutura do arquivo
   * Trata: aliquota_padrao, aliquota_interna_padrao, aliquotas_internas.geral.aliquota
   * @param {object} icms
   * @returns {number|null}
   */
  function _extrairICMSPadrao(icms) {
    if (!icms) return null;
    if (typeof icms.aliquota_padrao === "number") return icms.aliquota_padrao;
    if (typeof icms.aliquota_interna_padrao === "number") return icms.aliquota_interna_padrao;
    if (typeof icms.aliquota_interna === "number") return icms.aliquota_interna;
    if (icms.aliquotas_internas && icms.aliquotas_internas.geral && typeof icms.aliquotas_internas.geral.aliquota === "number") {
      return icms.aliquotas_internas.geral.aliquota;
    }
    if (typeof icms.aliquota_geral === "number") return icms.aliquota_geral;
    return null;
  }

  /**
   * Extrai a alíquota geral de ISS independente da estrutura
   * Trata: aliquota_geral (número), aliquotas.geral, aliquotas.padrao
   * @param {object} iss
   * @returns {number|null}
   */
  function _extrairISSGeral(iss) {
    if (!iss) return null;
    if (typeof iss.aliquota_geral === "number") return iss.aliquota_geral;
    if (iss.aliquotas) {
      if (typeof iss.aliquotas.geral === "number") return iss.aliquotas.geral;
      if (iss.aliquotas.geral && typeof iss.aliquotas.geral.aliquota === "number") return iss.aliquotas.geral.aliquota;
      if (typeof iss.aliquotas.padrao === "number") return iss.aliquotas.padrao;
    }
    if (typeof iss.aliquota_maxima === "number") return iss.aliquota_maxima;
    return null;
  }

  /**
   * Extrai dados do FECOP/FECOEP/FUNCEP de qualquer padrão de nome
   * @param {object} icms
   * @returns {{ existe: boolean, nome: string, adicional: number }}
   */
  function _extrairFECOP(icms) {
    if (!icms) return { existe: false, nome: "N/A", adicional: 0 };

    var nomes = ["fecop", "fecoep", "funcep", "fumacop", "fecep"];
    for (var i = 0; i < nomes.length; i++) {
      var f = icms[nomes[i]];
      if (f && (f.existe === true || f.ativo === true || (typeof f.adicional === "number" && f.adicional > 0) || (typeof f.aliquota === "number" && f.aliquota > 0))) {
        return {
          existe: true,
          nome: nomes[i].toUpperCase(),
          adicional: f.adicional || f.aliquota || f.percentual_adicional || 0,
        };
      }
    }
    return { existe: false, nome: "N/A", adicional: 0 };
  }

  /**
   * Extrai os anexos do Simples Nacional independente da estrutura
   * Trata: anexos.anexo_i e anexo_i_comercio (raiz do simples)
   * @param {object} sn - Objeto simples_nacional
   * @returns {object} Anexos normalizados
   */
  function _extrairAnexosSN(sn) {
    if (!sn) return {};

    // Padrão 1: sn.anexos.anexo_i
    if (sn.anexos && Object.keys(sn.anexos).length > 0) return sn.anexos;

    // Padrão 2: sn.anexo_i_comercio, sn.anexo_ii_industria, etc.
    var anexos = {};
    var mapeamento = {
      "anexo_i_comercio": "anexo_i",
      "anexo_ii_industria": "anexo_ii",
      "anexo_iii_servicos": "anexo_iii",
      "anexo_iv_servicos_profissionais": "anexo_iv",
      "anexo_v_servicos_transportes": "anexo_v",
      "anexo_v_servicos": "anexo_v",
    };

    Object.keys(sn).forEach(function (key) {
      if (mapeamento[key]) {
        anexos[mapeamento[key]] = sn[key];
      } else if (key.match(/^anexo_[iv]+/i)) {
        anexos[key] = sn[key];
      }
    });

    return Object.keys(anexos).length > 0 ? anexos : {};
  }

  /**
   * Extrai alíquotas interestaduais independente da estrutura
   * Trata: aliquotas_interestaduais, interestaduais
   * @param {object} icms
   * @returns {object|null}
   */
  function _extrairInterestaduais(icms) {
    if (!icms) return null;
    if (icms.aliquotas_interestaduais) return icms.aliquotas_interestaduais;
    if (icms.interestaduais) return icms.interestaduais;
    return null;
  }

  /**
   * Compara alíquotas de ICMS padrão entre estados
   * @param {string[]} [siglas] - Lista de siglas. Se vazio, compara todos
   * @returns {Array<{ sigla: string, nome: string, icms_padrao: number|null, icms_percentual: string, fecop: object }>}
   */
  function compararICMS(siglas) {
    var lista = siglas || Object.keys(UF_REGISTRY);

    return lista.map(function (s) {
      var sigla = _resolverSigla(s);
      if (!sigla) return null;

      var estado = getEstado(sigla);
      var reg = UF_REGISTRY[sigla];

      if (!estado || !estado.icms) {
        return { sigla: sigla, nome: reg.nome, icms_padrao: null, icms_percentual: "N/D", fecop: { existe: false, adicional: 0 } };
      }

      var aliq = _extrairICMSPadrao(estado.icms);
      var fecop = _extrairFECOP(estado.icms);
      var efetivo = aliq != null ? aliq + fecop.adicional : null;
      var perc = aliq != null ? (aliq * 100).toFixed(1) + "%" : "N/D";
      var percEfetivo = efetivo != null ? (efetivo * 100).toFixed(1) + "%" : "N/D";

      return {
        sigla: sigla,
        nome: reg.nome,
        icms_padrao: aliq,
        icms_percentual: perc,
        fecop: fecop,
        icms_efetivo: efetivo,
        icms_efetivo_percentual: percEfetivo,
      };
    }).filter(Boolean).sort(function (a, b) {
      if (a.icms_padrao === null) return 1;
      if (b.icms_padrao === null) return -1;
      return a.icms_padrao - b.icms_padrao;
    });
  }

  /**
   * Compara alíquotas de IPVA entre estados para um tipo de veículo
   * @param {string} tipoVeiculo - "automovel", "motocicleta", "caminhao" etc.
   * @param {string[]} [siglas]
   * @returns {Array<{ sigla: string, nome: string, aliquota: number|null, percentual: string }>}
   */
  function compararIPVA(tipoVeiculo, siglas) {
    var lista = siglas || Object.keys(UF_REGISTRY);
    var tipo = _normalizar(tipoVeiculo);

    return lista.map(function (s) {
      var sigla = _resolverSigla(s);
      if (!sigla) return null;

      var estado = getEstado(sigla);
      var reg = UF_REGISTRY[sigla];

      if (!estado || !estado.ipva || !estado.ipva.aliquotas) {
        return { sigla: sigla, nome: reg.nome, aliquota: null, percentual: "N/D" };
      }

      // Buscar por chave exata ou parcial
      var aliquotas = estado.ipva.aliquotas;
      var encontrado = null;

      Object.keys(aliquotas).forEach(function (key) {
        if (_normalizar(key).indexOf(tipo) !== -1 && !encontrado) {
          var val = aliquotas[key];
          if (typeof val === "object" && val.aliquota != null) {
            encontrado = val;
          } else if (typeof val === "number") {
            encontrado = { aliquota: val };
          }
        }
      });

      var aliq = encontrado ? encontrado.aliquota : null;
      var perc = aliq != null ? (aliq * 100).toFixed(1) + "%" : "N/D";

      return { sigla: sigla, nome: reg.nome, aliquota: aliq, percentual: perc };
    }).filter(Boolean).sort(function (a, b) {
      if (a.aliquota === null) return 1;
      if (b.aliquota === null) return -1;
      return a.aliquota - b.aliquota;
    });
  }

  /**
   * Gera resumo tributário consolidado de todos os estados
   * Usa normalizadores para tratar todas as variações estruturais
   * @param {string[]} [siglas]
   * @returns {Array<object>}
   */
  function resumoTodos(siglas) {
    var lista = siglas || Object.keys(UF_REGISTRY);

    return lista.map(function (s) {
      var sigla = _resolverSigla(s);
      if (!sigla) return null;

      var estado = getEstado(sigla);
      var reg = UF_REGISTRY[sigla];
      if (!estado) return null;

      // Tentar utils.resumoTributario() primeiro
      var utils = getUtils(sigla);
      if (utils && typeof utils.resumoTributario === "function") {
        try {
          var resumo = utils.resumoTributario();
          // Garantir que campos essenciais existam
          resumo.sigla = resumo.sigla || sigla;
          resumo.estado = resumo.estado || reg.nome;
          resumo.regiao = resumo.regiao || reg.regiao;
          return resumo;
        } catch (e) { /* fallback below */ }
      }

      // Fallback: construir resumo normalizado manualmente
      var icmsPadrao = _extrairICMSPadrao(estado.icms);
      var fecop = _extrairFECOP(estado.icms);
      var issGeral = _extrairISSGeral(estado.iss);
      var ipvaAuto = _extrairAliquotaIPVA(estado, "automovel");
      var ipvaMoto = _extrairAliquotaIPVA(estado, "motocicleta");
      var anexos = _extrairAnexosSN(estado.simples_nacional);

      return {
        estado: reg.nome,
        sigla: sigla,
        regiao: reg.regiao,
        capital: estado.dados_gerais ? (estado.dados_gerais.capital || "N/D") : "N/D",
        icms_padrao: icmsPadrao,
        icms_padrao_percentual: icmsPadrao != null ? (icmsPadrao * 100).toFixed(1) + "%" : "N/D",
        fecop: fecop,
        icms_efetivo: icmsPadrao != null ? icmsPadrao + fecop.adicional : null,
        ipva_automovel: ipvaAuto,
        ipva_motocicleta: ipvaMoto,
        iss_geral: issGeral,
        itbi: estado.itbi ? (estado.itbi.aliquota_geral || estado.itbi.aliquota || null) : null,
        sublimite_simples: estado.simples_nacional ? estado.simples_nacional.sublimite_estadual : null,
        anexos_simples: Object.keys(anexos).length,
        tem_federal: !!estado.federal,
        tem_irpj: estado.federal ? !!estado.federal.irpj : false,
        tem_inss: estado.federal ? !!estado.federal.inss : false,
        tem_irpf: estado.federal ? !!estado.federal.irpf : false,
        completude: estado.cobertura ? (estado.cobertura.completude_estimada || "N/D") : "N/D",
      };
    }).filter(Boolean);
  }

  /**
   * Lista estados com determinado incentivo fiscal ativo
   * @param {string} tipoIncentivo - "sudam", "sudene", "sudeco", "zona_franca", "suframa"
   * @returns {Array<{ sigla: string, nome: string, parcial: boolean, detalhes: object }>}
   */
  function estadosComIncentivo(tipoIncentivo) {
    var tipo = _normalizar(tipoIncentivo);
    var resultado = [];

    Object.keys(UF_REGISTRY).forEach(function (sigla) {
      var estado = getEstado(sigla);
      if (!estado || !estado.incentivos) return;

      var incentivo = estado.incentivos[tipo];
      if (incentivo && (incentivo.ativo === true || incentivo.existe === true)) {
        resultado.push({
          sigla: sigla,
          nome: UF_REGISTRY[sigla].nome,
          parcial: incentivo.abrangencia_parcial || false,
          detalhes: incentivo,
        });
      }
    });

    return resultado;
  }

  /**
   * Calcula DIFAL entre dois estados
   * @param {string} ufOrigem
   * @param {string} ufDestino
   * @returns {{ origem: string, destino: string, aliquota_origem: number, aliquota_destino: number, difal: number, difal_percentual: string }|null}
   */
  function calcularDIFAL(ufOrigem, ufDestino) {
    var siglaOrigem = _resolverSigla(ufOrigem);
    var siglaDestino = _resolverSigla(ufDestino);
    if (!siglaOrigem || !siglaDestino) return null;

    var estadoDestino = getEstado(siglaDestino);
    if (!estadoDestino || !estadoDestino.icms) return null;

    // Determinar alíquota interestadual baseada nas regiões
    var regiaoOrigem = UF_REGISTRY[siglaOrigem].regiao;
    var regiaoDestino = UF_REGISTRY[siglaDestino].regiao;

    var aliquotaInter;
    if (siglaOrigem === siglaDestino) {
      return null; // DIFAL não se aplica em operações internas
    }

    // Regra geral interestadual
    var regioesSulSudeste = ["Sul", "Sudeste"];
    var isOrigemSulSudeste = regioesSulSudeste.indexOf(regiaoOrigem) !== -1 && siglaOrigem !== "ES";
    var isDestinoSulSudeste = regioesSulSudeste.indexOf(regiaoDestino) !== -1 && siglaDestino !== "ES";

    if (isOrigemSulSudeste && isDestinoSulSudeste) {
      aliquotaInter = 0.12;
    } else if (isOrigemSulSudeste && !isDestinoSulSudeste) {
      aliquotaInter = 0.07;
    } else {
      aliquotaInter = 0.12;
    }

    var aliquotaInterna = estadoDestino.icms.aliquota_padrao || 0;
    var difal = Math.max(0, aliquotaInterna - aliquotaInter);

    return {
      origem: siglaOrigem,
      destino: siglaDestino,
      regiao_origem: regiaoOrigem,
      regiao_destino: regiaoDestino,
      aliquota_interestadual: aliquotaInter,
      aliquota_interestadual_percentual: (aliquotaInter * 100).toFixed(0) + "%",
      aliquota_interna_destino: aliquotaInterna,
      aliquota_interna_destino_percentual: (aliquotaInterna * 100).toFixed(1) + "%",
      difal: difal,
      difal_percentual: (difal * 100).toFixed(1) + "%",
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  API PÚBLICA — TABELAS FEDERAIS (CONSOLIDADAS)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Retorna os impostos federais (são iguais para todos os estados)
   * Pega de qualquer estado carregado como referência
   * @returns {object|null}
   */
  function getFederalConsolidado() {
    var siglas = Object.keys(UF_REGISTRY);
    for (var i = 0; i < siglas.length; i++) {
      var estado = getEstado(siglas[i]);
      if (estado && estado.federal) {
        return estado.federal;
      }
    }
    return null;
  }

  /**
   * Retorna tabela do Simples Nacional (Anexos I-V são federais, iguais em todos)
   * @returns {object|null}
   */
  function getSimplesNacionalConsolidado() {
    var siglas = Object.keys(UF_REGISTRY);
    for (var i = 0; i < siglas.length; i++) {
      var estado = getEstado(siglas[i]);
      if (estado && estado.simples_nacional && estado.simples_nacional.anexos) {
        return estado.simples_nacional;
      }
    }
    return null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  API PÚBLICA — VALIDAÇÃO E DIAGNÓSTICO
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Retorna status de carregamento de todos os estados
   * @returns {{ total: number, carregados: number, pendentes: string[], erros: string[] }}
   */
  function statusCarregamento() {
    var carregados = Object.keys(_cache);
    var todas = Object.keys(UF_REGISTRY);
    var pendentes = todas.filter(function (s) { return !_cache[s]; });

    return {
      total: todas.length,
      carregados: carregados.length,
      pendentes: pendentes,
      erros: _errosCarregamento.slice(),
    };
  }

  /**
   * Carrega todos os estados e retorna relatório completo
   * @returns {object}
   */
  function carregarTodos() {
    return _inicializarTodos();
  }

  /**
   * Valida a integridade de todos os estados carregados
   * @returns {Array<{ sigla: string, nome: string, valido: boolean, faltantes: string[], secoes: number, utils: number }>}
   */
  function validarTodos() {
    var resultado = [];

    Object.keys(UF_REGISTRY).forEach(function (sigla) {
      var estado = getEstado(sigla);
      var utils = getUtils(sigla);
      var reg = UF_REGISTRY[sigla];

      var validacao = _validarSecoes(sigla, estado);
      resultado.push({
        sigla: sigla,
        nome: reg.nome,
        carregado: !!estado,
        valido: validacao.valido,
        faltantes: validacao.faltantes,
        secoes: estado ? Object.keys(estado).length : 0,
        utils: utils ? Object.keys(utils).length : 0,
      });
    });

    return resultado;
  }

  /**
   * Retorna relatório de completude (percentual estimado de preenchimento)
   * @returns {Array<{ sigla: string, nome: string, completude: string }>}
   */
  function relatorioCompletude() {
    return Object.keys(UF_REGISTRY).sort().map(function (sigla) {
      var estado = getEstado(sigla);
      var reg = UF_REGISTRY[sigla];
      var completude = "N/D";

      if (estado && estado.cobertura && estado.cobertura.completude_estimada) {
        completude = estado.cobertura.completude_estimada;
      }

      return { sigla: sigla, nome: reg.nome, completude: completude };
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  API PÚBLICA — ACESSORES NORMALIZADOS (para HTML)
  //  Estas funções garantem dados consistentes independente da estrutura interna
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Retorna ICMS normalizado com todos os dados em formato padronizado
   * USAR ESTA FUNÇÃO NO HTML em vez de getICMS() para resultados consistentes
   * @param {string} siglaOuNome
   * @returns {object}
   */
  function getICMSNormalizado(siglaOuNome) {
    var sigla = _resolverSigla(siglaOuNome);
    if (!sigla) return null;

    var estado = getEstado(sigla);
    if (!estado || !estado.icms) return null;

    var icms = estado.icms;
    var aliqPadrao = _extrairICMSPadrao(icms);
    var fecop = _extrairFECOP(icms);
    var interestaduais = _extrairInterestaduais(icms);

    // Extrair alíquotas diferenciadas
    var diferenciadas = icms.aliquotas_diferenciadas || {};
    if (icms.aliquotas_internas && !icms.aliquotas_diferenciadas) {
      diferenciadas = {};
      Object.keys(icms.aliquotas_internas).forEach(function (k) {
        if (k !== "geral") diferenciadas[k] = icms.aliquotas_internas[k];
      });
    }

    return {
      sigla: sigla,
      aliquota_padrao: aliqPadrao,
      aliquota_padrao_percentual: aliqPadrao != null ? (aliqPadrao * 100).toFixed(1) + "%" : "N/D",
      fecop: fecop,
      aliquota_efetiva: aliqPadrao != null ? aliqPadrao + fecop.adicional : null,
      aliquota_efetiva_percentual: aliqPadrao != null ? ((aliqPadrao + fecop.adicional) * 100).toFixed(1) + "%" : "N/D",
      aliquotas_diferenciadas: diferenciadas,
      interestaduais: interestaduais,
      substituicao_tributaria: icms.substituicao_tributaria || null,
      difal: icms.difal || null,
      importacao: icms.importacao || null,
      base_legal: icms.base_legal || null,
      _raw: icms, // dados brutos originais para consultas avançadas
    };
  }

  /**
   * Retorna ISS normalizado
   * @param {string} siglaOuNome
   * @returns {object}
   */
  function getISSNormalizado(siglaOuNome) {
    var sigla = _resolverSigla(siglaOuNome);
    if (!sigla) return null;

    var estado = getEstado(sigla);
    if (!estado || !estado.iss) return null;

    var iss = estado.iss;
    var aliqGeral = _extrairISSGeral(iss);

    // Extrair serviços detalhados
    var servicos = iss.por_tipo_servico || {};
    var totalServicos = Object.keys(servicos).length;

    return {
      sigla: sigla,
      municipio_referencia: iss.municipio_referencia || iss.municipio || "Capital",
      aliquota_geral: aliqGeral,
      aliquota_geral_percentual: aliqGeral != null ? (aliqGeral * 100).toFixed(1) + "%" : "N/D",
      aliquota_minima: iss.aliquota_minima || iss.aliquota_minima_federal || 0.02,
      aliquota_maxima: iss.aliquota_maxima || iss.aliquota_maxima_federal || 0.05,
      total_servicos_detalhados: totalServicos,
      por_tipo_servico: servicos,
      base_legal: iss.base_legal || null,
      _raw: iss,
    };
  }

  /**
   * Retorna Simples Nacional normalizado com anexos padronizados
   * @param {string} siglaOuNome
   * @returns {object}
   */
  function getSimplesNacionalNormalizado(siglaOuNome) {
    var sigla = _resolverSigla(siglaOuNome);
    if (!sigla) return null;

    var estado = getEstado(sigla);
    if (!estado || !estado.simples_nacional) return null;

    var sn = estado.simples_nacional;
    var anexos = _extrairAnexosSN(sn);

    return {
      sigla: sigla,
      sublimite_estadual: sn.sublimite_estadual || null,
      sublimite_formatado: sn.sublimite_estadual_formatado || sn.sublimite_formatado ||
        (sn.sublimite_estadual ? "R$ " + sn.sublimite_estadual.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "N/D"),
      mei: sn.mei || sn.limites ? {
        limite_anual: (sn.mei && sn.mei.limite_anual) || (sn.limites && sn.limites.mei) || 81000,
      } : { limite_anual: 81000 },
      limites: sn.limites || {
        mei: 81000,
        microempresa: 360000,
        epp: 4800000,
      },
      anexos: anexos,
      total_anexos: Object.keys(anexos).length,
      _raw: sn,
    };
  }

  /**
   * Retorna IPVA normalizado
   * @param {string} siglaOuNome
   * @returns {object}
   */
  function getIPVANormalizado(siglaOuNome) {
    var sigla = _resolverSigla(siglaOuNome);
    if (!sigla) return null;

    var estado = getEstado(sigla);
    if (!estado || !estado.ipva) return null;

    var ipva = estado.ipva;
    var aliquotas = ipva.aliquotas || {};

    // Handle AM-style aliquotas_2026 / aliquotas_2025
    if (Object.keys(aliquotas).length === 0) {
      var anos = ["2026", "2025", "2024"];
      for (var a = 0; a < anos.length; a++) {
        if (ipva["aliquotas_" + anos[a]] && Object.keys(ipva["aliquotas_" + anos[a]]).length > 0) {
          aliquotas = ipva["aliquotas_" + anos[a]];
          break;
        }
      }
    }

    var tipos = Object.keys(aliquotas);

    // Normalizar cada tipo de veículo
    var aliquotasNorm = {};
    tipos.forEach(function (tipo) {
      var val = aliquotas[tipo];
      if (typeof val === "number") {
        aliquotasNorm[tipo] = { aliquota: val, percentual: (val * 100).toFixed(1) + "%" };
      } else if (typeof val === "object" && val !== null) {
        aliquotasNorm[tipo] = val;
      }
    });

    return {
      sigla: sigla,
      total_tipos: tipos.length,
      aliquotas: aliquotasNorm,
      automovel: _extrairAliquotaIPVA(estado, "automovel"),
      motocicleta: _extrairAliquotaIPVA(estado, "motocicleta"),
      caminhao: _extrairAliquotaIPVA(estado, "caminhao") || _extrairAliquotaIPVA(estado, "onibus"),
      isencoes: ipva.isencoes || [],
      descontos: ipva.descontos || {},
      calendario: ipva.calendario_vencimento || ipva.calendario || null,
      base_legal: ipva.base_legal || null,
      _raw: ipva,
    };
  }

  /**
   * Retorna ITCMD normalizado (trata "itd" do RJ e "itcd" do MT)
   * @param {string} siglaOuNome
   * @returns {object}
   */
  function getITCMDNormalizado(siglaOuNome) {
    var sigla = _resolverSigla(siglaOuNome);
    if (!sigla) return null;

    var estado = getEstado(sigla);
    if (!estado) return null;

    var itcmd = estado.itcmd || estado.itd || estado.itcd || null;
    if (!itcmd) return null;

    return {
      sigla: sigla,
      nome_local: itcmd.nome_local || itcmd.nome || "ITCMD",
      tipo: itcmd.tipo || itcmd.tipo_aliquota || "N/D",
      aliquotas_causa_mortis: itcmd.aliquotas_causa_mortis || itcmd.causa_mortis || null,
      aliquotas_doacao: itcmd.aliquotas_doacao || itcmd.doacao || null,
      base_calculo: itcmd.base_calculo || null,
      isencoes: itcmd.isencoes || null,
      base_legal: itcmd.base_legal || null,
      _raw: itcmd,
    };
  }

  /**
   * Retorna Federal normalizado
   * @param {string} siglaOuNome
   * @returns {object}
   */
  function getFederalNormalizado(siglaOuNome) {
    var sigla = _resolverSigla(siglaOuNome);
    if (!sigla) return null;

    var estado = getEstado(sigla);
    if (!estado || !estado.federal) return null;

    var fed = estado.federal;
    return {
      sigla: sigla,
      irpj: fed.irpj || null,
      csll: fed.csll || null,
      pis_pasep: fed.pis_pasep || fed.pis || null,
      cofins: fed.cofins || null,
      ipi: fed.ipi || null,
      iof: fed.iof || null,
      inss: fed.inss || null,
      fgts: fed.fgts || null,
      irpf: fed.irpf || null,
      itr: fed.itr || null,
      ii: fed.ii || null,
      ie: fed.ie || null,
      _raw: fed,
    };
  }

  /**
   * Retorna Incentivos normalizados (SUDAM, SUDENE, SUDECO, ZFM, ALC, etc.)
   * @param {string} siglaOuNome
   * @returns {object}
   */
  function getIncentivosNormalizado(siglaOuNome) {
    var sigla = _resolverSigla(siglaOuNome);
    if (!sigla) return null;

    var estado = getEstado(sigla);
    if (!estado || !estado.incentivos) return null;

    var inc = estado.incentivos;
    var dg = estado.dados_gerais || {};

    // Consolidar de incentivos + dados_gerais
    return {
      sigla: sigla,
      sudam: inc.sudam || dg.sudam || { ativo: false },
      sudene: inc.sudene || dg.sudene || { ativo: false },
      sudeco: inc.sudeco || dg.sudeco || { ativo: false },
      zona_franca: inc.zona_franca || dg.zona_franca || { ativo: false, existe: false },
      suframa: inc.suframa || dg.suframa || { ativo: false },
      alc: inc.alc || dg.alc || dg.area_livre_comercio || { ativo: false },
      incentivos_estaduais: inc.incentivos_estaduais || inc.programas_estaduais || {},
      _raw: inc,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  API PÚBLICA — GERAÇÃO DE HTML PARA ABA DE ESTADOS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Gera HTML de um <select> de estados
   * @param {string} [id] - ID do elemento select
   * @param {string} [className] - Classe CSS
   * @param {boolean} [agruparPorRegiao] - Se true, usa <optgroup>
   * @returns {string} HTML
   */
  function gerarSelectHTML(id, className, agruparPorRegiao) {
    var selectId = id || "select-estado";
    var selectClass = className || "form-select";
    var html = '<select id="' + selectId + '" class="' + selectClass + '">\n';
    html += '  <option value="">Selecione um estado...</option>\n';

    if (agruparPorRegiao) {
      var regioes = opcoesSelectPorRegiao();
      Object.keys(regioes).forEach(function (regiao) {
        html += '  <optgroup label="' + regiao + '">\n';
        regioes[regiao].forEach(function (estado) {
          html += '    <option value="' + estado.value + '">' + estado.label + '</option>\n';
        });
        html += '  </optgroup>\n';
      });
    } else {
      opcoesSelect({ incluirVazio: false }).forEach(function (opt) {
        html += '  <option value="' + opt.value + '">' + opt.label + '</option>\n';
      });
    }

    html += '</select>';
    return html;
  }

  /**
   * Gera array de <script src="..."> tags para carregar todos os estados no browser
   * @param {string} [basePath] - Caminho base (ex: "estados/")
   * @returns {string} Tags HTML
   */
  function gerarScriptTags(basePath) {
    var base = basePath || "estados/";
    var tags = "<!-- ═══ Scripts de Estados — Base Tributária Completa ═══ -->\n";

    Object.keys(UF_REGISTRY).sort().forEach(function (sigla) {
      var reg = UF_REGISTRY[sigla];
      tags += '<script src="' + base + reg.arquivo + '.js"></script>\n';
    });

    tags += '<script src="scripts/estados.js"></script>\n';
    tags += "<!-- ═══ Fim Scripts de Estados ═══ -->\n";

    return tags;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  FUNÇÕES INTERNAS AUXILIARES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Normaliza string (lowercase, sem acentos, sem espaços extras)
   * @param {string} str
   * @returns {string}
   */
  function _normalizar(str) {
    if (!str) return "";
    return str.toString().toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_").trim();
  }

  /**
   * Resolve sigla a partir de sigla, nome ou arquivo
   * @param {string} input
   * @returns {string|null} Sigla (ex: "MT") ou null
   */
  function _resolverSigla(input) {
    if (!input) return null;

    var upper = input.toString().toUpperCase().trim();

    // Busca direta por sigla
    if (UF_REGISTRY[upper]) return upper;

    // Busca por nome ou arquivo
    var norm = _normalizar(input);
    var siglas = Object.keys(UF_REGISTRY);

    for (var i = 0; i < siglas.length; i++) {
      var reg = UF_REGISTRY[siglas[i]];
      if (_normalizar(reg.nome) === norm || _normalizar(reg.arquivo) === norm) {
        return siglas[i];
      }
    }

    // Busca parcial (ex: "mato grosso" encontra "MT" e "MS" — retorna primeiro match exato)
    for (var j = 0; j < siglas.length; j++) {
      var reg2 = UF_REGISTRY[siglas[j]];
      if (_normalizar(reg2.nome).indexOf(norm) !== -1) {
        return siglas[j];
      }
    }

    return null;
  }

  /**
   * Extrai alíquota IPVA para automóvel de um estado
   * @param {object} estado
   * @param {string} tipo
   * @returns {number|null}
   */
  function _extrairAliquotaIPVA(estado, tipo) {
    if (!estado || !estado.ipva) return null;

    var ipva = estado.ipva;
    var aliquotas = ipva.aliquotas || null;

    // AM e outros usam aliquotas_2026 / aliquotas_2025
    if (!aliquotas || (typeof aliquotas === "object" && Object.keys(aliquotas).length === 0)) {
      var anos = ["2026", "2025", "2024"];
      for (var a = 0; a < anos.length; a++) {
        if (ipva["aliquotas_" + anos[a]] && Object.keys(ipva["aliquotas_" + anos[a]]).length > 0) {
          aliquotas = ipva["aliquotas_" + anos[a]];
          break;
        }
      }
    }

    if (!aliquotas) return null;

    var keys = Object.keys(aliquotas);
    var tipoNorm = _normalizar(tipo);

    for (var i = 0; i < keys.length; i++) {
      if (_normalizar(keys[i]).indexOf(tipoNorm) !== -1) {
        var val = aliquotas[keys[i]];
        if (val && typeof val === "object" && val.aliquota != null) return val.aliquota;
        if (typeof val === "number") return val;
      }
    }

    var variacoes = {
      "automovel": ["automovel", "automoveis", "auto", "passeio", "carro", "utilitario", "veiculos_leves", "veiculos_passeio", "automoveis_passeio", "automovel_utilitario", "veiculos_particulares", "automoveis_camionetes", "automoveis_caminhonetes", "automoveis_utilitarios", "acima_1000cc"],
      "motocicleta": ["motocicleta", "motocicletas", "moto", "ciclomotor", "motociclo", "motocicletas_acima"],
      "caminhao": ["caminhao", "caminhoes", "onibus", "caminhao_onibus", "pesados", "onibus_caminhao", "carga_pesada", "caminhoes_onibus"],
    };

    var varsDoTipo = variacoes[tipoNorm] || [tipoNorm];

    for (var j = 0; j < varsDoTipo.length; j++) {
      for (var k = 0; k < keys.length; k++) {
        if (_normalizar(keys[k]).indexOf(varsDoTipo[j]) !== -1) {
          var val2 = aliquotas[keys[k]];
          if (val2 && typeof val2 === "object" && val2.aliquota != null) return val2.aliquota;
          if (typeof val2 === "number") return val2;
        }
      }
    }

    return null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  CONSTANTES ÚTEIS
  // ═══════════════════════════════════════════════════════════════════════════

  var REGIOES = {
    NORTE:         { sigla: "N",  nome: "Norte",         estados: ["AC", "AM", "AP", "PA", "RO", "RR", "TO"] },
    NORDESTE:      { sigla: "NE", nome: "Nordeste",      estados: ["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"] },
    CENTRO_OESTE:  { sigla: "CO", nome: "Centro-Oeste",  estados: ["DF", "GO", "MS", "MT"] },
    SUDESTE:       { sigla: "SE", nome: "Sudeste",       estados: ["ES", "MG", "RJ", "SP"] },
    SUL:           { sigla: "S",  nome: "Sul",           estados: ["PR", "RS", "SC"] },
  };

  var TOTAL_UF = 27;

  // ═══════════════════════════════════════════════════════════════════════════
  //  EXPORTAÇÃO — INTERFACE PÚBLICA DO MÓDULO
  // ═══════════════════════════════════════════════════════════════════════════

  return {

    // ── Versão ──
    versao: "1.0.0",
    dataAtualizacao: "2026-02-10",
    totalUF: TOTAL_UF,

    // ── Constantes ──
    REGIOES: REGIOES,
    UF_REGISTRY: UF_REGISTRY,
    SECOES_OBRIGATORIAS: SECOES_OBRIGATORIAS,

    // ── Acesso Individual ──
    getEstado: getEstado,
    getEstadoCompleto: getEstadoCompleto,
    getUtils: getUtils,
    getSecao: getSecao,
    getDadosGerais: getDadosGerais,

    // ── Acesso por Imposto (dados brutos) ──
    getICMS: getICMS,
    getIPVA: getIPVA,
    getITCMD: getITCMD,
    getISS: getISS,
    getIPTU: getIPTU,
    getITBI: getITBI,
    getTaxas: getTaxas,
    getFederal: getFederal,
    getSimplesNacional: getSimplesNacional,
    getIncentivos: getIncentivos,
    getReformaTributaria: getReformaTributaria,
    getCobertura: getCobertura,

    // ── Acesso Normalizado (USAR NO HTML — formato consistente) ──
    getICMSNormalizado: getICMSNormalizado,
    getISSNormalizado: getISSNormalizado,
    getSimplesNacionalNormalizado: getSimplesNacionalNormalizado,
    getIPVANormalizado: getIPVANormalizado,
    getITCMDNormalizado: getITCMDNormalizado,
    getFederalNormalizado: getFederalNormalizado,
    getIncentivosNormalizado: getIncentivosNormalizado,

    // ── Consolidados (Federais) ──
    getFederalConsolidado: getFederalConsolidado,
    getSimplesNacionalConsolidado: getSimplesNacionalConsolidado,

    // ── Listagens ──
    listarEstados: listarEstados,
    listarPorRegiao: listarPorRegiao,
    listarSiglas: listarSiglas,
    opcoesSelect: opcoesSelect,
    opcoesSelectPorRegiao: opcoesSelectPorRegiao,

    // ── Comparativos ──
    compararICMS: compararICMS,
    compararIPVA: compararIPVA,
    resumoTodos: resumoTodos,
    estadosComIncentivo: estadosComIncentivo,
    calcularDIFAL: calcularDIFAL,

    // ── Geração HTML ──
    gerarSelectHTML: gerarSelectHTML,
    gerarScriptTags: gerarScriptTags,

    // ── Validação e Diagnóstico ──
    carregarTodos: carregarTodos,
    statusCarregamento: statusCarregamento,
    validarTodos: validarTodos,
    relatorioCompletude: relatorioCompletude,

    // ── Helpers de Normalização (uso avançado) ──
    _helpers: {
      extrairICMSPadrao: _extrairICMSPadrao,
      extrairISSGeral: _extrairISSGeral,
      extrairFECOP: _extrairFECOP,
      extrairAnexosSN: _extrairAnexosSN,
      extrairInterestaduais: _extrairInterestaduais,
      resolverSigla: _resolverSigla,
      normalizar: _normalizar,
    },
  };

});
