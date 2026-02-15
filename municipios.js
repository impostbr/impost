/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MUNICIPIOS.JS — Carregamento dinâmico de Municípios via API IBGE
 * Versão 1.0 — Integrado com alíquotas ISS de estados.js
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * FONTES:
 *   • API de Localidades IBGE: servicodados.ibge.gov.br/api/v1/localidades
 *   • Alíquotas ISS conhecidas: estados.js (campo municipios[])
 *
 * COMO FUNCIONA:
 *   1. Ao trocar o estado, busca TODOS os municípios via IBGE API
 *   2. Faz merge com as alíquotas ISS já conhecidas de estados.js
 *   3. Municípios sem alíquota cadastrada recebem ISS padrão = 5%
 *   4. O usuário pode alterar manualmente a alíquota (2% a 5%)
 *   5. Cache em memória evita chamadas repetidas à API
 *
 * ATUALIZAÇÃO: 09/02/2026
 * ═══════════════════════════════════════════════════════════════════════════
 */

const MunicipiosIBGE = (function () {
    "use strict";

    // ═══════════════════════════════════════════════════════════════
    //  CONSTANTES
    // ═══════════════════════════════════════════════════════════════

    const API_BASE = "https://servicodados.ibge.gov.br/api/v1/localidades/estados";
    const ISS_PADRAO = 5.00;       // Alíquota padrão quando não cadastrada
    const ISS_MIN = 2.00;          // Mínimo legal (LC 116/2003, art. 8-A)
    const ISS_MAX = 5.00;          // Máximo legal (LC 116/2003, art. 8, II)
    const CACHE_TTL = 30 * 60 * 1000; // 30 minutos em ms

    // ═══════════════════════════════════════════════════════════════
    //  CACHE EM MEMÓRIA + SESSIONSTORAGE
    // ═══════════════════════════════════════════════════════════════

    const _cache = {};              // Cache em memória (mais rápido)

    /**
     * Tenta ler do sessionStorage (persiste entre reloads na mesma aba)
     */
    function _getFromStorage(uf) {
        try {
            const raw = sessionStorage.getItem(`ibge_mun_${uf}`);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            // Verifica TTL
            if (Date.now() - parsed.ts > CACHE_TTL) {
                sessionStorage.removeItem(`ibge_mun_${uf}`);
                return null;
            }
            return parsed.data;
        } catch {
            return null;
        }
    }

    /**
     * Salva no sessionStorage
     */
    function _saveToStorage(uf, data) {
        try {
            sessionStorage.setItem(`ibge_mun_${uf}`, JSON.stringify({
                ts: Date.now(),
                data: data
            }));
        } catch {
            // sessionStorage cheio ou indisponível — ignora
        }
    }

    // ═══════════════════════════════════════════════════════════════
    //  NORMALIZAÇÃO DE NOMES (para merge)
    // ═══════════════════════════════════════════════════════════════

    /**
     * Remove acentos e converte para minúsculo para comparação
     */
    function _normalizar(str) {
        return (str || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
    }

    // ═══════════════════════════════════════════════════════════════
    //  BUSCAR MUNICÍPIOS (API IBGE + MERGE ISS)
    // ═══════════════════════════════════════════════════════════════

    /**
     * Busca todos os municípios de um estado via IBGE API
     * e faz merge com alíquotas ISS conhecidas de estados.js
     *
     * @param {string} uf - Sigla do estado (ex: "PA", "SP")
     * @param {object} estadosRef - Referência ao objeto ESTADOS de estados.js
     * @returns {Promise<Array<{nome: string, iss: number, issConhecido: boolean, ibgeId: number}>>}
     */
    async function buscarMunicipios(uf, estadosRef) {
        if (!uf) return [];

        // 1. Checar cache em memória
        if (_cache[uf]) {
            return _cache[uf];
        }

        // 2. Checar sessionStorage
        const cached = _getFromStorage(uf);
        if (cached) {
            _cache[uf] = cached;
            return cached;
        }

        // 3. Buscar da API IBGE
        const url = `${API_BASE}/${uf}/municipios?orderBy=nome`;

        const resposta = await fetch(url);
        if (!resposta.ok) {
            throw new Error(`Erro API IBGE: ${resposta.status} ${resposta.statusText}`);
        }

        const ibgeData = await resposta.json();

        // 4. Montar mapa de ISS conhecidos (de estados.js)
        const issMap = {};
        const estado = estadosRef ? estadosRef[uf] : null;
        if (estado && estado.municipios) {
            estado.municipios.forEach(m => {
                issMap[_normalizar(m.nome)] = m.iss;
            });
        }

        // 5. Fazer merge: IBGE + ISS
        const resultado = ibgeData.map(m => {
            const nomeNorm = _normalizar(m.nome);
            const issConhecido = issMap.hasOwnProperty(nomeNorm);
            return {
                nome: m.nome,
                ibgeId: m.id,
                iss: issConhecido ? issMap[nomeNorm] : ISS_PADRAO,
                issConhecido: issConhecido
            };
        });

        // 6. Salvar em ambos os caches
        _cache[uf] = resultado;
        _saveToStorage(uf, resultado);

        return resultado;
    }

    // ═══════════════════════════════════════════════════════════════
    //  FALLBACK — USAR APENAS DADOS DE ESTADOS.JS
    // ═══════════════════════════════════════════════════════════════

    /**
     * Se a API IBGE falhar, retorna os municípios cadastrados em estados.js
     */
    function fallbackEstadosJS(uf, estadosRef) {
        const estado = estadosRef ? estadosRef[uf] : null;
        if (!estado || !estado.municipios) return [];
        return estado.municipios.map(m => ({
            nome: m.nome,
            ibgeId: null,
            iss: m.iss || ISS_PADRAO,
            issConhecido: true
        }));
    }

    // ═══════════════════════════════════════════════════════════════
    //  RENDERIZAR SELECT DE MUNICÍPIOS
    // ═══════════════════════════════════════════════════════════════

    /**
     * Popula um <select> com os municípios
     *
     * @param {HTMLSelectElement} selectEl - Elemento <select> do DOM
     * @param {Array} municipios - Array retornado por buscarMunicipios()
     * @param {object} [opcoes] - Opções de renderização
     * @param {boolean} [opcoes.mostrarISS=true] - Mostrar alíquota ISS no texto
     * @param {boolean} [opcoes.marcarConhecidos=true] - Indicar quais têm ISS cadastrado
     */
    function renderizarSelect(selectEl, municipios, opcoes = {}) {
        const { mostrarISS = true, marcarConhecidos = true } = opcoes;

        selectEl.innerHTML = "";

        // Opção padrão
        const optDefault = document.createElement("option");
        optDefault.value = "";
        optDefault.textContent = `Selecione o município (${municipios.length} disponíveis)...`;
        selectEl.appendChild(optDefault);

        municipios.forEach(m => {
            const opt = document.createElement("option");
            opt.value = m.nome;
            opt.dataset.iss = m.iss;
            opt.dataset.issConhecido = m.issConhecido ? "1" : "0";

            if (mostrarISS) {
                const issStr = m.iss.toFixed(1).replace(".", ",");
                const sufixo = marcarConhecidos && m.issConhecido ? "" : " ≈";
                opt.textContent = `${m.nome} (ISS: ${issStr}%${sufixo})`;
            } else {
                opt.textContent = m.nome;
            }

            selectEl.appendChild(opt);
        });

        selectEl.disabled = false;
    }

    // ═══════════════════════════════════════════════════════════════
    //  GERAR HTML DE DICA ISS
    // ═══════════════════════════════════════════════════════════════

    /**
     * Retorna HTML com a mensagem informativa sobre ISS
     * @param {boolean} issConhecido - Se a alíquota do município é conhecida
     * @param {string} nomeMunicipio - Nome do município selecionado
     * @returns {string} HTML da dica
     */
    function gerarDicaISS(issConhecido, nomeMunicipio) {
        if (issConhecido) {
            return `<span style="color:var(--success,#10b981);">✓</span> 
                    Alíquota ISS de <strong>${nomeMunicipio}</strong> cadastrada no sistema.
                    <span style="opacity:0.7;">Você pode ajustar manualmente se necessário.</span>`;
        }
        return `<span style="color:var(--warning,#f59e0b);">ℹ</span> 
                A alíquota de ISS varia entre <strong>2% e 5%</strong> conforme o município 
                (LC 116/2003). O padrão usado é <strong>5%</strong> (teto). 
                <br><span style="opacity:0.7;">Consulte a legislação de 
                <strong>${nomeMunicipio || "seu município"}</strong> e ajuste abaixo se necessário.</span>`;
    }

    // ═══════════════════════════════════════════════════════════════
    //  UTILITÁRIOS
    // ═══════════════════════════════════════════════════════════════

    /**
     * Valida se uma alíquota ISS está dentro dos limites legais
     */
    function validarISS(aliquota) {
        const v = parseFloat(aliquota);
        if (isNaN(v)) return { valido: false, valor: ISS_PADRAO, msg: "Alíquota inválida. Usando 5% (padrão)." };
        if (v < ISS_MIN) return { valido: false, valor: v, msg: `ISS abaixo do mínimo legal (${ISS_MIN}%). Verifique.` };
        if (v > ISS_MAX) return { valido: false, valor: v, msg: `ISS acima do máximo legal (${ISS_MAX}%). Verifique.` };
        return { valido: true, valor: v, msg: "" };
    }

    /**
     * Limpa todo o cache (memória + sessionStorage)
     */
    function limparCache() {
        Object.keys(_cache).forEach(k => delete _cache[k]);
        try {
            Object.keys(sessionStorage)
                .filter(k => k.startsWith("ibge_mun_"))
                .forEach(k => sessionStorage.removeItem(k));
        } catch { }
    }

    /**
     * Retorna estatísticas do módulo
     */
    function getStats() {
        return {
            cacheEmMemoria: Object.keys(_cache).length,
            ISS_PADRAO,
            ISS_MIN,
            ISS_MAX
        };
    }

    // ═══════════════════════════════════════════════════════════════
    //  EXPORTAÇÃO
    // ═══════════════════════════════════════════════════════════════

    const API = {
        buscarMunicipios,
        fallbackEstadosJS,
        renderizarSelect,
        gerarDicaISS,
        validarISS,
        limparCache,
        getStats,
        ISS_PADRAO,
        ISS_MIN,
        ISS_MAX
    };

    // Compatível com módulos ES e browser
    if (typeof module !== "undefined" && module.exports) {
        module.exports = API;
    }

    // Disponibilizar globalmente
    window.MunicipiosIBGE = API;

    return API;
})();
