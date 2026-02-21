/**
 * ════════════════════════════════════════════════════════════════════════════════
 * SIMPLES-ESTUDO-COMPLETO.JS — Motor Unificado de Estudo Tributário + Relatório
 * Versão 5.0.0
 *
 * Arquivo UNIFICADO que combina toda a lógica de:
 *   - Cálculo e otimização do Simples Nacional
 *   - Diagnóstico inteligente de oportunidades
 *   - Score de saúde tributária
 *   - Simulação de cenários "E se?"
 *   - Plano de ação priorizado
 *   - Explicações com base legal completa
 *   - Relatório HTML profissional (Parte 2)
 *   - Exportação PDF/Excel (Parte 2)
 *
 * PARTE 1: Módulos 1 a 14 — Lógica de cálculo, diagnóstico, otimização e comparativo
 *   - Módulo 11: PlanoAcao v5.0 — Plano de ação priorizado real (7 ações concretas)
 *   - Módulo 13: SimuladorCenarios — 6 cenários "E se?" (pró-labore, CNAE, segregação, receita, sócio, exportação)
 *   - Módulo 14: CompararRegimes — SN × LP × LR com cálculo local completo
 * PARTE 2: Módulos 15 a 19 — Relatório, renderização HTML e exportação
 *
 * Base Legal Principal:
 *   - LC 123/2006 (Estatuto Nacional da ME e EPP)
 *   - LC 155/2016 (Alterações — Fator R)
 *   - LC 147/2014 (Universalização do Simples Nacional)
 *   - Resolução CGSN nº 140/2018 (Regulamentação completa)
 *   - LC 116/2003 (ISS — Art. 8-A mínimo 2%; Art. 8, II máximo 5%)
 *
 * Compatibilidade: Node.js (CommonJS) + Browser (globalThis)
 * Dependências: ZERO externas — consome apenas os 4 módulos globais:
 *   - IMPOST / SimplesNacional (simples_nacional.js)
 *   - CnaeMapeamento (cnae-mapeamento.js)
 *   - Estados / EstadosBR (estados.js)
 *   - MunicipiosIBGE (municipios.js)
 *
 * @product  IMPOST. — Porque pagar imposto certo é direito. Pagar menos, legalmente, é inteligência.
 * @version  5.0.0
 * @license  Proprietary
 * ════════════════════════════════════════════════════════════════════════════════
 */
(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else {
        root.SimplesEstudoCompleto = factory();
        root.SimplesEstudos = root.SimplesEstudoCompleto; // Alias retrocompatibilidade
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════
    //  REFERÊNCIAS AOS 4 MÓDULOS BASE (externos)
    //  IMPOST (simples_nacional.js), CnaeMapeamento, Estados, MunicipiosIBGE
    // ═══════════════════════════════════════════════════════════════

    const _IMPOST = (typeof IMPOST !== 'undefined') ? IMPOST :
                    (typeof SimplesNacional !== 'undefined') ? SimplesNacional : null;
    const _CnaeMapeamento = (typeof CnaeMapeamento !== 'undefined') ? CnaeMapeamento : null;
    const _Estados = (typeof Estados !== 'undefined') ? Estados :
                     (typeof EstadosBR !== 'undefined') ? EstadosBR : null;
    const _MunicipiosIBGE = (typeof MunicipiosIBGE !== 'undefined') ? MunicipiosIBGE : null;


    // ─── Constantes globais da factory ───

    /** Versão canônica — única fonte de verdade */
    var _VERSION = '5.1.0';

    /** Salário mínimo 2026 (Lei 15.XXX/2025) */
    var SALARIO_MINIMO_2026 = 1621;

    /** DAS fixo do MEI 2026: 5% × R$ 1.621 + ISS R$ 5 + ICMS R$ 1 ≈ R$ 87 */
    var DAS_MEI_2026 = 87;

    /** Nomes amigáveis para as categorias do Score */
    var NOMES_CATEGORIA_SCORE = {
        fatorR: 'Fator R',
        segregacao: 'Segregação de Receitas',
        iss: 'ISS Otimizado',
        proLabore: 'Pró-labore',
        semRiscos: 'Gestão de Riscos'
    };

    /**
     * Helper seguro: chama função do IMPOST com try/catch.
     * Compartilhado por todos os módulos (Calculadora, Diagnostico, Simulador).
     * @param {string} nome — nome da função
     * @param {*} params — parâmetros (posicional ou objeto)
     * @param {string} [contexto] — nome do módulo chamador (para log)
     * @returns {*} resultado ou null
     */
    function _chamarIMPOST(nome, params, contexto) {
        if (!_IMPOST || typeof _IMPOST[nome] !== 'function') return null;
        try {
            return _IMPOST[nome](params);
        } catch (e) {
            console.warn('[SimplesEstudoCompleto' + (contexto ? '.' + contexto : '') + '] Erro ao chamar IMPOST.' + nome + ':', e.message);
            return null;
        }
    }

    /**
     * Versão ESTRITA de _chamarIMPOST: lança erro claro em vez de retornar null.
     * Usar em cálculos críticos onde fallback inventado é inaceitável.
     * @param {string} nome — nome da função IMPOST
     * @param {*} params — parâmetros
     * @param {string} [contexto] — módulo chamador
     * @returns {*} resultado (nunca null)
     * @throws {Error} se IMPOST não estiver carregado, função não existir ou retornar null
     */
    function _chamarIMPOSTCritico(nome, params, contexto) {
        var ctx = contexto ? '.' + contexto : '';
        if (!_IMPOST) {
            throw new Error('[IMPOST AUSENTE' + ctx + '] O módulo IMPOST (simples_nacional.js) não está carregado. '
                + 'Não é possível realizar o cálculo "' + nome + '". Carregue simples_nacional.js antes deste arquivo.');
        }
        if (typeof _IMPOST[nome] !== 'function') {
            throw new Error('[IMPOST.' + nome + ' NÃO ENCONTRADA' + ctx + '] A função IMPOST.' + nome
                + ' não existe. Verifique se simples_nacional.js v5.0+ está carregado.');
        }
        var resultado = _IMPOST[nome](params);
        if (resultado === null || resultado === undefined) {
            throw new Error('[IMPOST.' + nome + ' RETORNOU NULL' + ctx + '] Parâmetros fornecidos: '
                + JSON.stringify(params, null, 0).substring(0, 300));
        }
        return resultado;
    }


    // ═══════════════════════════════════════════════════════════════
    //  MÓDULO 1: EVENTOS — Sistema de pub/sub para comunicação
    //  Base legal: Resolução CGSN 140/2018
    // ═══════════════════════════════════════════════════════════════

    const Eventos = (function () {

        /** @type {Object<string, Function[]>} */
        const _listeners = {};

        /**
         * Registra um listener para um evento.
         * @param {string} evento — Nome do evento (ex: 'cnae:selecionado')
         * @param {Function} callback — Função a ser chamada quando o evento for emitido
         */
        function on(evento, callback) {
            if (typeof callback !== 'function') return;
            if (!_listeners[evento]) _listeners[evento] = [];
            _listeners[evento].push(callback);
        }

        /**
         * Remove um listener específico.
         * @param {string} evento
         * @param {Function} callback
         */
        function off(evento, callback) {
            if (!_listeners[evento]) return;
            _listeners[evento] = _listeners[evento].filter(fn => fn !== callback);
        }

        /**
         * Emite um evento, chamando todos os listeners registrados.
         * @param {string} evento
         * @param {*} dados — Dados a serem passados ao callback
         */
        function emit(evento, dados) {
            if (!_listeners[evento]) return;
            _listeners[evento].forEach(fn => {
                try { fn(dados); } catch (e) {
                    console.error(`[SimplesEstudoCompleto.Eventos] Erro no listener '${evento}':`, e);
                }
            });
        }

        /**
         * Remove TODOS os listeners de um evento, ou todos se nenhum evento for informado.
         * @param {string} [evento]
         */
        function limpar(evento) {
            if (evento) {
                delete _listeners[evento];
            } else {
                Object.keys(_listeners).forEach(k => delete _listeners[k]);
            }
        }

        return { on, off, emit, limpar };
    })();


    // ═══════════════════════════════════════════════════════════════
    //  MÓDULO 2: UTILS — Formatação e Utilitários
    // ═══════════════════════════════════════════════════════════════

    const Utils = (function () {

        /**
         * Formata valor numérico como moeda brasileira.
         * @param {number} valor
         * @returns {string} Ex: "R$ 1.234,56"
         */
        function formatarMoeda(valor) {
            if (valor == null || isNaN(valor)) return 'R$ 0,00';
            return 'R$ ' + Number(valor).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }

        /**
         * Formata valor decimal como percentual.
         * @param {number} valor — Ex: 0.1241
         * @returns {string} Ex: "12,41%"
         */
        function formatarPercentual(valor) {
            if (valor == null || isNaN(valor)) return '0,00%';
            return (Number(valor) * 100).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }) + '%';
        }

        /**
         * Formata código CNAE com pontuação padrão.
         * @param {string} codigo — Ex: "71197/00" ou "7119700"
         * @returns {string} Ex: "71.19-7/00"
         */
        function formatarCNAE(codigo) {
            if (!codigo) return '';
            const nums = codigo.replace(/\D/g, '');
            if (nums.length < 7) return codigo;
            return nums.slice(0, 2) + '.' + nums.slice(2, 4) + '-' + nums.slice(4, 5) + '/' + nums.slice(5, 7);
        }

        /**
         * Parse de string monetária para número.
         * @param {string} str — Ex: "R$ 1.234,56" ou "1234.56"
         * @returns {number}
         */
        function parseMoeda(str) {
            if (typeof str === 'number') return str;
            if (!str) return 0;
            const limpo = str.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.').trim();
            const val = parseFloat(limpo);
            return isNaN(val) ? 0 : val;
        }

        /**
         * Valida CNPJ (algoritmo módulo 11).
         * @param {string} cnpj
         * @returns {boolean}
         */
        function validarCNPJ(cnpj) {
            if (!cnpj) return false;
            const nums = cnpj.replace(/\D/g, '');
            if (nums.length !== 14) return false;
            if (/^(\d)\1{13}$/.test(nums)) return false;

            const calcDigito = (base, pesos) => {
                let soma = 0;
                for (let i = 0; i < pesos.length; i++) {
                    soma += parseInt(base[i]) * pesos[i];
                }
                const resto = soma % 11;
                return resto < 2 ? 0 : 11 - resto;
            };

            const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
            const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

            const d1 = calcDigito(nums, pesos1);
            const d2 = calcDigito(nums, pesos2);

            return parseInt(nums[12]) === d1 && parseInt(nums[13]) === d2;
        }

        /**
         * Formata CNPJ.
         * @param {string} cnpj
         * @returns {string} Ex: "12.345.678/0001-90"
         */
        function formatarCNPJ(cnpj) {
            if (!cnpj) return '';
            const nums = cnpj.replace(/\D/g, '');
            if (nums.length !== 14) return cnpj;
            return nums.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
        }

        /**
         * Normaliza texto para busca: remove acentos, lowercase, trim.
         * @param {string} str
         * @returns {string}
         */
        function normalizarTexto(str) {
            if (!str) return '';
            return str.normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .trim();
        }

        /**
         * Cria função debounce (atrasa execução até parar de chamar).
         * @param {Function} fn
         * @param {number} delay — Milissegundos (default 300)
         * @returns {Function}
         */
        function debounce(fn, delay) {
            let timer = null;
            return function (...args) {
                if (timer) clearTimeout(timer);
                timer = setTimeout(() => fn.apply(this, args), delay || 300);
            };
        }

        /**
         * Compara dois valores para ordenação.
         * @param {*} a
         * @param {*} b
         * @returns {number} -1, 0 ou 1
         */
        function compararValores(a, b) {
            if (a == null && b == null) return 0;
            if (a == null) return 1;
            if (b == null) return -1;
            if (typeof a === 'number' && typeof b === 'number') return a - b;
            return String(a).localeCompare(String(b), 'pt-BR');
        }

        return {
            formatarMoeda,
            formatarPercentual,
            formatarCNAE,
            parseMoeda,
            validarCNPJ,
            formatarCNPJ,
            normalizarTexto,
            debounce,
            compararValores
        };
    })();


    // ═══════════════════════════════════════════════════════════════
    //  MÓDULO 3: BUSCA INTELIGENTE DE CNAE
    //  Base legal: Resolução CGSN nº 140/2018, Anexos VI e VII
    // ═══════════════════════════════════════════════════════════════

    const BuscaCNAE = (function () {

        /**
         * Palavras-chave adicionais para melhorar a descoberta na busca.
         * @type {Object<string, string[]>}
         */
        const _KEYWORDS = {
            'farmacia farmaceutico drogaria medicamento remedio': ['4771-7/01', '4771-7/02', '4771-7/03'],
            'combustivel gasolina diesel etanol posto gasolina': ['4731-8/00', '4732-6/00'],
            'gas glp botijao': ['4784-9/00'],
            'supermercado mercado mercearia': ['4711-3/01', '4711-3/02', '4712-1/00'],
            'padaria panificacao confeitaria': ['1091-1/01', '1091-1/02'],
            'informatica computador notebook celular': ['4751-2/01', '4753-9/00'],
            'roupa loja vestuario moda confeccao': ['4781-4/00', '4782-2/01'],
            'dentista odontologia odontologico': ['8630-5/04'],
            'medico clinica consultorio medicina': ['8630-5/01', '8630-5/02', '8630-5/03'],
            'psicologo psicologia terapia terapeuta': ['8650-0/01'],
            'fisioterapia fisioterapeuta': ['8650-0/04'],
            'nutricionista nutricao': ['8650-0/06'],
            'cabelereiro salao beleza estetica barbearia': ['9602-5/01', '9602-5/02'],
            'academia musculacao ginastica crossfit': ['9311-5/00', '9312-3/00'],
            'hotel pousada hospedagem hostel': ['5510-8/01', '5510-8/02'],
            'restaurante lanchonete pizzaria bar churrascaria': ['5611-2/01', '5611-2/02', '5611-2/03'],
            'escola ensino educacao curso treinamento': ['8511-2/00', '8520-1/00', '8599-6/99'],
            'automovel carro concessionaria veiculos': ['4511-1/01', '4511-1/02'],
            'cosmetico perfumaria perfume maquiagem': ['4772-5/00'],
            'lavanderia tinturaria': ['9601-7/01', '9601-7/02'],
            'pet shop veterinario animal': ['7500-1/00'],
            'imovel imobiliaria incorporacao': ['6810-2/01', '6810-2/02'],
            'agencia viagem turismo': ['7911-2/00', '7912-1/00'],
            'correio entrega motoboy': ['5320-2/01', '5320-2/02'],
        };

        /** @type {Array|null} Índice de busca unificado (lazy-built) */
        let _indice = null;

        /** @type {Object} Cache de buscas recentes */
        const _cacheBusca = {};
        const CACHE_MAX = 50;

        /**
         * Constrói o índice unificado a partir dos 3 módulos de dados.
         * @returns {Array}
         * @private
         */
        function _construirIndice() {
            if (_indice) return _indice;
            _indice = [];

            const jaAdicionados = new Set();

            const _mapaIMPOST = {};
            if (_IMPOST && _IMPOST.MAPEAMENTO_CNAE) {
                _IMPOST.MAPEAMENTO_CNAE.forEach(m => {
                    const num = (m.cnae || '').replace(/\D/g, '');
                    if (num) _mapaIMPOST[num] = m;
                });
            }

            // 1° — MAPEAMENTO_ESPECIFICO (maior prioridade)
            if (_CnaeMapeamento && _CnaeMapeamento.MAPEAMENTO_ESPECIFICO) {
                const mapa = _CnaeMapeamento.MAPEAMENTO_ESPECIFICO;
                Object.keys(mapa).forEach(codigo => {
                    const regra = mapa[codigo];
                    const obs = regra.obs || '';
                    let descricao = '';
                    const codKey = codigo.replace(/\D/g, '');
                    const matchExato = _mapaIMPOST[codKey];
                    const matchPrefixo = !matchExato && codKey.length >= 5 ? _mapaIMPOST[codKey.substring(0, 5)] : null;
                    const match = matchExato || matchPrefixo;
                    if (match && match.descricao) {
                        descricao = match.descricao;
                    } else {
                        descricao = obs;
                    }

                    const item = {
                        codigo: codigo,
                        descricao: descricao || `CNAE ${codigo}`,
                        anexo: regra.vedado ? null : (regra.fatorR ? null : regra.anexo),
                        fatorR: !!regra.fatorR,
                        anexoComFatorRAlto: regra.fatorR ? 'III' : null,
                        anexoComFatorRBaixo: regra.fatorR ? 'V' : null,
                        presuncaoIRPJ: regra.presuncaoIRPJ || 0.32,
                        presuncaoCSLL: regra.presuncaoCSLL || 0.32,
                        vedado: !!regra.vedado,
                        motivoVedacao: regra.motivoVedacao || null,
                        monofasico: _CnaeMapeamento.isMonofasico ? _CnaeMapeamento.isMonofasico(codigo) : false,
                        observacao: obs,
                        fonte: 'especifico',
                        baseLegal: 'Resolução CGSN 140/2018, Anexos VI e VII',
                        _busca: Utils.normalizarTexto(
                            codigo + ' ' + (descricao || '') + ' ' + obs +
                            ' ' + (regra.motivoVedacao || '') +
                            (match && match.observacao ? ' ' + match.observacao : '')
                        )
                    };
                    _indice.push(item);
                    jaAdicionados.add(codKey);
                });
            }

            // 2° — IMPOST.MAPEAMENTO_CNAE (CNAEs do motor fiscal)
            if (_IMPOST && _IMPOST.MAPEAMENTO_CNAE) {
                _IMPOST.MAPEAMENTO_CNAE.forEach(m => {
                    const codNum = (m.cnae || '').replace(/\D/g, '');
                    if (jaAdicionados.has(codNum)) return;

                    let codigoFormatado = m.cnae || '';
                    if (codNum.length >= 5 && !codigoFormatado.includes('-')) {
                        codigoFormatado = Utils.formatarCNAE(codNum);
                    }

                    let regras = null;
                    if (_CnaeMapeamento && _CnaeMapeamento.obterRegrasCNAE) {
                        regras = _CnaeMapeamento.obterRegrasCNAE(codigoFormatado, '');
                    }

                    const item = {
                        codigo: codigoFormatado,
                        descricao: m.descricao || `CNAE ${codigoFormatado}`,
                        anexo: m.tipo === 'vedado' ? null : (m.tipo === 'fator_r' ? null : (m.anexoFixo || (regras && regras.anexo) || null)),
                        fatorR: m.tipo === 'fator_r',
                        anexoComFatorRAlto: m.tipo === 'fator_r' ? (m.anexoFatorRAlto || 'III') : null,
                        anexoComFatorRBaixo: m.tipo === 'fator_r' ? (m.anexoFatorRBaixo || 'V') : null,
                        presuncaoIRPJ: (regras && regras.presuncaoIRPJ) || 0.32,
                        presuncaoCSLL: (regras && regras.presuncaoCSLL) || 0.32,
                        vedado: m.tipo === 'vedado',
                        motivoVedacao: m.tipo === 'vedado' ? (m.observacao || 'Atividade vedada ao Simples Nacional') : null,
                        monofasico: _CnaeMapeamento && _CnaeMapeamento.isMonofasico ? _CnaeMapeamento.isMonofasico(codigoFormatado) : false,
                        observacao: m.observacao || '',
                        fonte: (regras && regras.fonte) || 'mapeamento',
                        baseLegal: 'Resolução CGSN 140/2018, Anexos VI e VII',
                        _busca: Utils.normalizarTexto(codigoFormatado + ' ' + (m.descricao || '') + ' ' + (m.observacao || ''))
                    };
                    _indice.push(item);
                    jaAdicionados.add(codNum);
                });
            }

            // 3° — REGRAS_POR_PREFIXO (para completar com prefixos genéricos)
            if (_CnaeMapeamento && _CnaeMapeamento.REGRAS_POR_PREFIXO) {
                _CnaeMapeamento.REGRAS_POR_PREFIXO.forEach(p => {
                    const regra = p.regra || {};
                    const item = {
                        codigo: p.prefixo + '*',
                        descricao: p.desc || `Atividades com prefixo ${p.prefixo}`,
                        anexo: regra.vedado ? null : (regra.fatorR ? null : regra.anexo),
                        fatorR: !!regra.fatorR,
                        anexoComFatorRAlto: regra.fatorR ? 'III' : null,
                        anexoComFatorRBaixo: regra.fatorR ? 'V' : null,
                        presuncaoIRPJ: regra.presuncaoIRPJ || 0.32,
                        presuncaoCSLL: regra.presuncaoCSLL || 0.32,
                        vedado: !!regra.vedado,
                        motivoVedacao: regra.motivoVedacao || null,
                        monofasico: false,
                        observacao: '',
                        fonte: 'prefixo',
                        baseLegal: 'Resolução CGSN 140/2018',
                        _busca: Utils.normalizarTexto(p.prefixo + ' ' + (p.desc || ''))
                    };
                    _indice.push(item);
                });
            }

            // 4° — Enriquecer _busca com palavras-chave adicionais
            const keywordMap = {};
            Object.entries(_KEYWORDS).forEach(([termos, codigos]) => {
                codigos.forEach(cod => {
                    if (!keywordMap[cod]) keywordMap[cod] = '';
                    keywordMap[cod] += ' ' + termos;
                });
            });
            _indice.forEach(item => {
                const kw = keywordMap[item.codigo];
                if (kw) {
                    item._busca += ' ' + Utils.normalizarTexto(kw);
                }
            });

            return _indice;
        }

        /**
         * Busca CNAEs por código ou descrição.
         * @param {string} termo — Texto de busca (número ou descrição)
         * @returns {Array<Object>} Até 20 resultados
         */
        function buscar(termo) {
            if (!termo || termo.trim().length < 2) return [];

            const termoNorm = Utils.normalizarTexto(termo);
            const termoNumerico = termo.replace(/\D/g, '');

            if (_cacheBusca[termoNorm]) return _cacheBusca[termoNorm];

            const indice = _construirIndice();
            const resultados = [];

            const pesoFonte = { especifico: 100, mapeamento: 50, prefixo: 10, categoria: 5, padrao: 1 };

            for (let i = 0; i < indice.length; i++) {
                const item = indice[i];
                let score = 0;

                if (termoNumerico.length >= 2) {
                    const codNum = item.codigo.replace(/\D/g, '');
                    if (codNum.startsWith(termoNumerico)) {
                        score += 200;
                        if (codNum === termoNumerico) score += 300;
                    }
                    if (item.codigo.includes(termo.trim())) {
                        score += 150;
                    }
                }

                if (item._busca.includes(termoNorm)) {
                    score += 100;
                    if (Utils.normalizarTexto(item.descricao).startsWith(termoNorm)) {
                        score += 50;
                    }
                }

                if (score === 0) {
                    const palavras = termoNorm.split(/\s+/).filter(p => p.length >= 3);
                    let todasEncontradas = palavras.length > 0;
                    let alguma = false;
                    for (const p of palavras) {
                        if (item._busca.includes(p)) {
                            alguma = true;
                        } else {
                            todasEncontradas = false;
                        }
                    }
                    if (todasEncontradas) score += 80;
                    else if (alguma) score += 30;
                }

                if (score > 0) {
                    score += (pesoFonte[item.fonte] || 0);
                    if (item.codigo.includes('*')) score -= 50;
                    resultados.push({ ...item, _score: score });
                }
            }

            resultados.sort((a, b) => b._score - a._score);

            const limitado = resultados.slice(0, 20).map(r => {
                const { _score, _busca, ...item } = r;
                return item;
            });

            if (Object.keys(_cacheBusca).length >= CACHE_MAX) {
                const primeiraChave = Object.keys(_cacheBusca)[0];
                delete _cacheBusca[primeiraChave];
            }
            _cacheBusca[termoNorm] = limitado;

            return limitado;
        }

        /**
         * Ao selecionar um CNAE, retorna o pacote tributário completo.
         * @param {string} codigo — Código CNAE (ex: "7119-7/00")
         * @returns {Object} Pacote tributário completo
         */
        function selecionarCNAE(codigo) {
            if (!codigo) return null;

            let regras = null;
            if (_CnaeMapeamento && _CnaeMapeamento.obterRegrasCNAE) {
                regras = _CnaeMapeamento.obterRegrasCNAE(codigo, '');
            }

            let dadosIMPOST = null;
            if (_IMPOST && _IMPOST.MAPEAMENTO_CNAE) {
                const codNum = codigo.replace(/\D/g, '');
                dadosIMPOST = _IMPOST.MAPEAMENTO_CNAE.find(m => {
                    const mNum = (m.cnae || '').replace(/\D/g, '');
                    return mNum === codNum || codNum.startsWith(mNum);
                });
            }

            const fatorR = (regras && regras.fatorR) || (dadosIMPOST && dadosIMPOST.tipo === 'fator_r') || false;
            const vedado = (regras && regras.vedado) || (dadosIMPOST && dadosIMPOST.tipo === 'vedado') || false;
            const anexoBase = vedado ? null : (fatorR ? null : ((regras && regras.anexo) || (dadosIMPOST && dadosIMPOST.anexoFixo) || 'III'));

            const anexosAplicaveis = [];
            if (vedado) {
                // Nenhum anexo
            } else if (fatorR) {
                anexosAplicaveis.push(
                    { anexo: 'III', condicao: 'Fator R ≥ 28%', baseLegal: 'Resolução CGSN 140/2018, Art. 18, §5º-J' },
                    { anexo: 'V', condicao: 'Fator R < 28%', baseLegal: 'Resolução CGSN 140/2018, Art. 18, §5º-J' }
                );
            } else if (anexoBase) {
                const anexoData = _IMPOST && _IMPOST.ANEXOS ? _IMPOST.ANEXOS[anexoBase] : null;
                anexosAplicaveis.push({
                    anexo: anexoBase,
                    condicao: 'Fixo',
                    baseLegal: anexoData ? anexoData.baseLegal : 'LC 123/2006'
                });
            }

            let tributosDentro = [];
            let tributosFora = [];
            let cppInclusa = true;

            if (!vedado && _IMPOST && _IMPOST.ANEXOS) {
                const anexoRef = fatorR ? 'III' : anexoBase;
                if (anexoRef && _IMPOST.ANEXOS[anexoRef]) {
                    tributosDentro = _IMPOST.ANEXOS[anexoRef].tributosDentro || [];
                    tributosFora = _IMPOST.ANEXOS[anexoRef].tributosFora || [];
                    cppInclusa = _IMPOST.ANEXOS[anexoRef].cppInclusa !== false;
                }
            }

            const alertas = [];
            if (vedado) {
                alertas.push({
                    tipo: 'erro',
                    mensagem: `CNAE ${codigo} é VEDADO ao Simples Nacional.`,
                    baseLegal: 'LC 123/2006, Art. 17'
                });
                if (regras && regras.motivoVedacao) {
                    alertas.push({ tipo: 'erro', mensagem: regras.motivoVedacao });
                }
            }
            if (fatorR) {
                alertas.push({
                    tipo: 'info',
                    mensagem: 'Esta atividade depende do Fator R para determinar o anexo. Se a folha de pagamento representar ≥ 28% da receita → Anexo III (menor alíquota). Caso contrário → Anexo V.',
                    baseLegal: 'Resolução CGSN 140/2018, Art. 18, §5º-J'
                });
            }
            if (anexoBase === 'IV') {
                alertas.push({
                    tipo: 'aviso',
                    mensagem: 'Atividades do Anexo IV: a CPP (INSS patronal de 20% + RAT) é paga POR FORA do DAS, via GPS separada.',
                    baseLegal: 'LC 123/2006, Art. 18, §5º-C; Lei 8.212/1991, Art. 22'
                });
            }

            const monofasico = _CnaeMapeamento && _CnaeMapeamento.isMonofasico ? _CnaeMapeamento.isMonofasico(codigo) : false;
            if (monofasico) {
                alertas.push({
                    tipo: 'economia',
                    mensagem: `Produto monofásico detectado (${monofasico}). PIS e COFINS são zerados na revenda — segregar essa receita para pagar menos DAS.`,
                    baseLegal: 'Lei 10.147/2000; Resolução CGSN 140/2018, Art. 25-A'
                });
            }

            const dicasEconomia = [];
            if (fatorR) {
                dicasEconomia.push({
                    titulo: 'Otimização do Fator R',
                    descricao: 'Aumentar a folha de pagamento (pró-labore) para atingir 28% pode migrar do Anexo V para o III, reduzindo significativamente o DAS.',
                    impacto: 'alto',
                    baseLegal: 'LC 123/2006, Art. 18, §24; Resolução CGSN 140/2018, Art. 18, §5º-J'
                });
            }
            if (monofasico) {
                dicasEconomia.push({
                    titulo: 'Segregação de receita monofásica',
                    descricao: 'Segregar receitas de produtos monofásicos elimina PIS e COFINS dessa parcela no DAS.',
                    impacto: 'medio',
                    baseLegal: 'Lei 10.147/2000; Resolução CGSN 140/2018, Art. 25-A'
                });
            }

            const resultado = {
                codigo: codigo,
                descricao: (dadosIMPOST && dadosIMPOST.descricao) || (regras && regras.obs) || `CNAE ${codigo}`,
                anexo: anexoBase,
                fatorR: fatorR,
                anexoComFatorRAlto: fatorR ? 'III' : null,
                anexoComFatorRBaixo: fatorR ? 'V' : null,
                presuncaoIRPJ: (regras && regras.presuncaoIRPJ) || 0.32,
                presuncaoCSLL: (regras && regras.presuncaoCSLL) || 0.32,
                vedado: vedado,
                motivoVedacao: vedado ? ((regras && regras.motivoVedacao) || 'Atividade vedada ao Simples Nacional') : null,
                monofasico: monofasico,
                observacao: (regras && regras.obs) || (dadosIMPOST && dadosIMPOST.observacao) || '',
                fonte: (regras && regras.fonte) || 'padrao',
                baseLegal: 'Resolução CGSN 140/2018, Anexos VI e VII',
                anexosAplicaveis: anexosAplicaveis,
                tributosDentro: tributosDentro,
                tributosFora: tributosFora,
                cppInclusa: cppInclusa,
                alertas: alertas,
                dicasEconomia: dicasEconomia
            };

            Eventos.emit('cnae:selecionado', resultado);
            return resultado;
        }

        /**
         * Limpa o cache de buscas.
         */
        function limparCache() {
            Object.keys(_cacheBusca).forEach(k => delete _cacheBusca[k]);
            _indice = null;
        }

        /**
         * Retorna estatísticas do índice de busca.
         * @returns {Object}
         */
        function getEstatisticas() {
            const indice = _construirIndice();
            return {
                totalItens: indice.length,
                especificos: indice.filter(i => i.fonte === 'especifico').length,
                prefixos: indice.filter(i => i.fonte === 'prefixo').length,
                comFatorR: indice.filter(i => i.fatorR).length,
                vedados: indice.filter(i => i.vedado).length,
                monofasicos: indice.filter(i => i.monofasico).length,
                cacheBuscas: Object.keys(_cacheBusca).length
            };
        }

        return { buscar, selecionarCNAE, limparCache, getEstatisticas };
    })();


    // ═══════════════════════════════════════════════════════════════
    //  MÓDULO 4: DADOS DO ESTADO
    //  Base legal: CF/1988; LC 123/2006, Art. 19 (sublimite ICMS/ISS)
    // ═══════════════════════════════════════════════════════════════

    const DadosEstado = (function () {

        /** @type {Object|null} Estado atualmente selecionado */
        let _estadoAtual = null;

        /**
         * Seleciona um estado e retorna dados tributários completos.
         *
         * @param {string} sigla — Sigla do estado (ex: "PA", "SP")
         * @returns {Object|null} Dados tributários completos do estado
         */
        function selecionarEstado(sigla) {
            if (!sigla || !_Estados) return null;

            const siglaUpper = sigla.toUpperCase().trim();

            // Dados gerais do registro
            const estadoCompleto = _Estados.getEstadoCompleto ? _Estados.getEstadoCompleto(siglaUpper) : null;
            const estado = _Estados.getEstado ? _Estados.getEstado(siglaUpper) : null;
            if (!estado && !estadoCompleto) return null;

            // ICMS normalizado
            const icmsNorm = _Estados.getICMSNormalizado ? _Estados.getICMSNormalizado(siglaUpper) : null;
            const icms = {
                padrao: icmsNorm ? icmsNorm.aliquota_padrao : null,
                padraoFormatado: icmsNorm ? icmsNorm.aliquota_padrao_percentual : 'N/D',
                diferenciadas: icmsNorm ? icmsNorm.aliquotas_diferenciadas : {},
                fecop: icmsNorm ? icmsNorm.fecop : { existe: false, adicional: 0 },
                interestaduais: icmsNorm ? icmsNorm.interestaduais : null
            };

            // ISS normalizado
            const issNorm = _Estados.getISSNormalizado ? _Estados.getISSNormalizado(siglaUpper) : null;
            const iss = {
                geral: issNorm ? issNorm.aliquota_geral : null,
                geralFormatado: issNorm ? issNorm.aliquota_geral_percentual : 'N/D',
                faixas: issNorm ? issNorm.por_tipo_servico : {},
                municipioReferencia: issNorm ? issNorm.municipio_referencia : 'Capital'
            };

            // Simples Nacional normalizado
            const snNorm = _Estados.getSimplesNacionalNormalizado ? _Estados.getSimplesNacionalNormalizado(siglaUpper) : null;
            const simplesNacional = {
                sublimite: snNorm ? snNorm.sublimite_estadual : 3600000,
                sublimiteFormatado: snNorm ? snNorm.sublimite_formatado : 'R$ 3.600.000,00',
                anexos: snNorm ? snNorm.anexos : {},
                mei: snNorm ? snNorm.mei : { limite_anual: 81000 }
            };

            // Incentivos normalizados
            const incNorm = _Estados.getIncentivosNormalizado ? _Estados.getIncentivosNormalizado(siglaUpper) : null;
            const temSUDAM = incNorm && incNorm.sudam && (incNorm.sudam.ativo === true || incNorm.sudam.existe === true);
            const temSUDENE = incNorm && incNorm.sudene && (incNorm.sudene.ativo === true || incNorm.sudene.existe === true);
            const temZFM = incNorm && incNorm.zona_franca && (incNorm.zona_franca.ativo === true || incNorm.zona_franca.existe === true);

            const incentivos = {
                sudam: temSUDAM,
                sudene: temSUDENE,
                zfm: temZFM,
                reducaoIRPJ: (temSUDAM || temSUDENE) ? 0.75 : 0,
                programasEstaduais: incNorm ? (incNorm.incentivos_estaduais || {}) : {},
                baseLegal: temSUDAM ? 'Lei 12.715/2012, Art. 1° (SUDAM — redução 75% IRPJ)' :
                           temSUDENE ? 'Lei 12.715/2012, Art. 1° (SUDENE — redução 75% IRPJ)' :
                           temZFM ? 'DL 288/1967; Lei 8.387/1991 (Zona Franca de Manaus)' :
                           'Sem incentivos regionais específicos'
            };

            // Reforma tributária
            const reformaNorm = _Estados.getReformaTributaria ? _Estados.getReformaTributaria(siglaUpper) : null;

            // Dados gerais
            const dadosGerais = _Estados.getDadosGerais ? _Estados.getDadosGerais(siglaUpper) : null;
            const regEntry = _Estados.UF_REGISTRY ? _Estados.UF_REGISTRY[siglaUpper] : null;

            _estadoAtual = {
                sigla: siglaUpper,
                nome: (regEntry && regEntry.nome) || (estadoCompleto && estadoCompleto.nome) || siglaUpper,
                regiao: (regEntry && regEntry.regiao) || (estadoCompleto && estadoCompleto.regiao) || '',
                capital: (dadosGerais && dadosGerais.capital) || '',
                icms: icms,
                iss: iss,
                simplesNacional: simplesNacional,
                incentivos: incentivos,
                reformaTributaria: reformaNorm || {},
                baseLegal: 'CF/1988; LC 123/2006, Art. 19 (sublimite ICMS/ISS)'
            };

            // Emitir evento
            Eventos.emit('estado:selecionado', _estadoAtual);

            return _estadoAtual;
        }

        /**
         * Lista estados para popular um <select>, agrupada por região.
         * @returns {Array<{valor: string, texto: string, regiao: string}>}
         */
        function listarParaSelect() {
            if (!_Estados) return [];

            const resultado = [];

            if (_Estados.opcoesSelectPorRegiao) {
                const porRegiao = _Estados.opcoesSelectPorRegiao();
                const ordemRegioes = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];
                ordemRegioes.forEach(regiao => {
                    if (porRegiao[regiao]) {
                        porRegiao[regiao].forEach(e => {
                            resultado.push({
                                valor: e.value,
                                texto: `${e.value} \u2014 ${e.label.replace(` (${e.value})`, '')} (${regiao})`,
                                regiao: regiao
                            });
                        });
                    }
                });
            } else if (_Estados.listarEstados) {
                _Estados.listarEstados().forEach(e => {
                    resultado.push({
                        valor: e.sigla,
                        texto: `${e.sigla} \u2014 ${e.nome} (${e.regiao})`,
                        regiao: e.regiao
                    });
                });
            }

            return resultado;
        }

        /**
         * Verifica incentivos regionais de um estado e calcula impacto.
         * @param {string} sigla
         * @returns {Object} Análise de incentivos
         */
        function verificarIncentivosRegionais(sigla) {
            const dados = selecionarEstado(sigla);
            if (!dados) return { temIncentivo: false };

            const inc = dados.incentivos;
            return {
                temIncentivo: inc.sudam || inc.sudene || inc.zfm,
                tipo: inc.sudam ? 'SUDAM' : inc.sudene ? 'SUDENE' : inc.zfm ? 'ZFM' : null,
                reducaoIRPJ: inc.reducaoIRPJ,
                reducaoIRPJFormatada: inc.reducaoIRPJ > 0 ? Utils.formatarPercentual(inc.reducaoIRPJ) : 'N/A',
                impactoEstimado: inc.reducaoIRPJ > 0 ? 'Redução de 75% no IRPJ no regime de Lucro Real pode torná-lo competitivo frente ao Simples Nacional para receitas maiores.' : null,
                baseLegal: inc.baseLegal
            };
        }

        /**
         * Retorna o estado atualmente selecionado.
         * @returns {Object|null}
         */
        function getEstadoAtual() {
            return _estadoAtual;
        }

        return { selecionarEstado, listarParaSelect, verificarIncentivosRegionais, getEstadoAtual };
    })();


    // ═══════════════════════════════════════════════════════════════
    //  MÓDULO 5: DADOS DO MUNICÍPIO
    //  Base legal: LC 116/2003 (ISS — Art. 8-A mínimo 2%; Art. 8, II máximo 5%)
    // ═══════════════════════════════════════════════════════════════

    const DadosMunicipio = (function () {

        /** @type {Array|null} Lista de municípios carregados */
        let _municipios = null;

        /** @type {string|null} UF dos municípios carregados */
        let _ufCarregada = null;

        /** @type {Object|null} Município atualmente selecionado */
        let _municipioAtual = null;

        /** @type {number} ISS atual (editável pelo usuário) */
        let _issAtual = 5.00;

        /**
         * Carrega municípios ao trocar o estado.
         * Usa MunicipiosIBGE.buscarMunicipios com fallback.
         *
         * @param {string} uf — Sigla do estado (ex: "PA")
         * @returns {Promise<Array<{nome: string, ibgeId: number, iss: number, issConhecido: boolean}>>}
         */
        async function carregarMunicipios(uf) {
            if (!uf) return [];

            const sigla = uf.toUpperCase().trim();

            // Se já carregou esta UF, retornar do cache
            if (_ufCarregada === sigla && _municipios) {
                return _municipios;
            }

            // Referência aos dados de estados.js (para merge de ISS)
            const estadosRef = (typeof ESTADOS !== 'undefined') ? ESTADOS :
                               (_Estados && _Estados.getEstado ? { [sigla]: _Estados.getEstado(sigla) } : null);

            let municipios = [];

            if (_MunicipiosIBGE && _MunicipiosIBGE.buscarMunicipios) {
                try {
                    municipios = await _MunicipiosIBGE.buscarMunicipios(sigla, estadosRef);
                } catch (e) {
                    console.warn(`[SimplesEstudoCompleto.DadosMunicipio] Erro ao buscar municípios via IBGE para ${sigla}:`, e.message);
                    // Fallback
                    if (_MunicipiosIBGE.fallbackEstadosJS) {
                        municipios = _MunicipiosIBGE.fallbackEstadosJS(sigla, estadosRef);
                    }
                }
            }

            _municipios = municipios;
            _ufCarregada = sigla;
            _municipioAtual = null;
            _issAtual = 5.00;

            return municipios;
        }

        /**
         * Ao selecionar município, retorna dados ISS completos.
         *
         * @param {string} nome — Nome do município
         * @param {string} uf — Sigla do estado
         * @returns {Object} Dados do município com ISS
         */
        function selecionarMunicipio(nome, uf) {
            if (!nome) return null;

            const sigla = (uf || _ufCarregada || '').toUpperCase().trim();

            // Buscar no array carregado
            let municipio = null;
            if (_municipios) {
                const nomeNorm = Utils.normalizarTexto(nome);
                municipio = _municipios.find(m => Utils.normalizarTexto(m.nome) === nomeNorm);
            }

            const issConhecido = municipio ? !!municipio.issConhecido : false;
            const issValor = municipio ? municipio.iss : 5.00;
            _issAtual = issValor;

            // Mensagem dinâmica
            let mensagem;
            if (issConhecido) {
                mensagem = `\u2713 Alíquota ISS de ${nome} cadastrada no sistema (${issValor.toFixed(1).replace('.', ',')}%). Você pode ajustar manualmente se necessário.`;
            } else {
                mensagem = `\u2139 A alíquota de ISS varia entre 2% e 5% conforme o município (LC 116/2003, Art. 8-A e Art. 8, II). O padrão usado é 5% (teto). Consulte a legislação de ${nome} e ajuste abaixo se necessário.`;
            }

            _municipioAtual = {
                nome: nome,
                uf: sigla,
                ibgeId: municipio ? municipio.ibgeId : null,
                iss: {
                    aliquota: issValor,
                    issConhecido: issConhecido,
                    minimo: 2.00,
                    maximo: 5.00,
                    editavel: true,
                    mensagem: mensagem,
                    baseLegal: 'LC 116/2003, Art. 8-A (mínimo 2%); Art. 8, II (máximo 5%)'
                }
            };

            // Emitir evento
            Eventos.emit('municipio:selecionado', _municipioAtual);

            return _municipioAtual;
        }

        /**
         * Atualiza ISS manualmente (o usuário pode editar).
         * Valida faixa de 2% a 5%.
         *
         * @param {number} aliquota — Nova alíquota ISS (ex: 3.5)
         * @returns {Object} Resultado da validação
         */
        function atualizarISS(aliquota) {
            const val = parseFloat(aliquota);

            if (isNaN(val)) {
                return {
                    valido: false,
                    aliquota: _issAtual,
                    mensagem: 'Valor inválido. Mantendo alíquota anterior.',
                    baseLegal: 'LC 116/2003'
                };
            }

            if (val < 2.00) {
                return {
                    valido: false,
                    aliquota: val,
                    mensagem: `Alíquota ${val.toFixed(2).replace('.', ',')}% está abaixo do mínimo legal de 2% (LC 116/2003, Art. 8-A). Verifique a legislação municipal.`,
                    baseLegal: 'LC 116/2003, Art. 8-A'
                };
            }

            if (val > 5.00) {
                return {
                    valido: false,
                    aliquota: val,
                    mensagem: `Alíquota ${val.toFixed(2).replace('.', ',')}% está acima do máximo legal de 5% (LC 116/2003, Art. 8, II). Verifique a legislação municipal.`,
                    baseLegal: 'LC 116/2003, Art. 8, II'
                };
            }

            _issAtual = val;

            // Atualizar no municipioAtual
            if (_municipioAtual) {
                _municipioAtual.iss.aliquota = val;
            }

            // Emitir evento de atualização
            Eventos.emit('municipio:issAtualizado', { aliquota: val, municipio: _municipioAtual });

            return {
                valido: true,
                aliquota: val,
                mensagem: `Alíquota ISS atualizada para ${val.toFixed(2).replace('.', ',')}%.`,
                baseLegal: 'LC 116/2003'
            };
        }

        /**
         * Retorna município atualmente selecionado.
         * @returns {Object|null}
         */
        function getMunicipioAtual() {
            return _municipioAtual;
        }

        /**
         * Retorna ISS atual.
         * @returns {number}
         */
        function getISSAtual() {
            return _issAtual;
        }

        /**
         * Retorna lista de municípios carregados.
         * @returns {Array|null}
         */
        function getMunicipios() {
            return _municipios;
        }

        return {
            carregarMunicipios,
            selecionarMunicipio,
            atualizarISS,
            getMunicipioAtual,
            getISSAtual,
            getMunicipios
        };
    })();


    // ═══════════════════════════════════════════════════════════════
    //  MÓDULO 6: FORMULÁRIO INTELIGENTE
    //  Gerencia estado completo do formulário com validações
    //  Base legal: LC 123/2006; Resolução CGSN 140/2018
    // ═══════════════════════════════════════════════════════════════

    const Formulario = (function () {

        /**
         * Estado interno do formulário com TODOS os campos.
         * @type {Object}
         */
        let _dados = _criarDadosVazios();

        /**
         * Cria objeto de dados vazio (estado inicial).
         * @returns {Object}
         * @private
         */
        function _criarDadosVazios() {
            return {
                // Identificação
                nomeEmpresa: '',
                cnpj: '',

                // Atividade
                cnae: '',
                descricaoCNAE: '',
                atividadeSecundaria: [],

                // Localização
                uf: '',
                municipio: '',
                issAliquota: 5.00,

                // Faturamento
                receitaBrutaMensal: 0,
                receitaBrutaAnual: 0,
                modoReceita: 'mensal',
                receitaBrutaAnualAnterior: 0,

                // Folha de Pagamento
                folhaMensal: 0,
                folhaAnual: 0,
                proLabore: 0,
                qtdFuncionarios: 0,

                // Sócios
                socios: [],

                // Receitas Especiais
                receitaMonofasica: 0,
                receitaICMS_ST: 0,
                receitaExportacao: 0,
                receitaLocacaoBensMoveis: 0,
                issRetidoFonte: 0,

                // Despesas
                despesasOperacionais: 0,

                // Elegibilidade (flags)
                socioPessoaJuridica: false,
                socioParticipacaoOutraPJ: false,
                socioAdminOutraPJ: false,
                debitosFiscaisPendentes: false,
                cessaoMaoObra: false,
                socioDomiciliadoExterior: false,
                empresaNova: false
            };
        }

        /**
         * Cálculos derivados automáticos.
         * Recalcula valores dependentes sempre que um campo muda.
         * @returns {Object}
         * @private
         */
        function _calcularDerivados() {
            const d = _dados;

            // Receita: mensal ↔ anual
            if (d.modoReceita === 'mensal' && d.receitaBrutaMensal > 0) {
                d.receitaBrutaAnual = d.receitaBrutaMensal * 12;
            } else if (d.modoReceita === 'anual' && d.receitaBrutaAnual > 0) {
                d.receitaBrutaMensal = d.receitaBrutaAnual / 12;
            }

            // Folha anual
            d.folhaAnual = d.folhaMensal * 12;

            // Fator R
            let fatorR = null;
            let fatorRPercentual = null;
            let acimaDoLimiar = null;
            let zonaDeRisco = false;
            let anexoResultante = null;

            // Calcular Fator R se tiver receita e folha
            const rbt12 = d.receitaBrutaAnual || 0;
            const folha12 = d.folhaAnual || 0;

            if (rbt12 > 0 && folha12 >= 0) {
                fatorR = folha12 / rbt12;
                fatorRPercentual = Utils.formatarPercentual(fatorR);
                acimaDoLimiar = fatorR >= 0.28;
                zonaDeRisco = fatorR >= 0.25 && fatorR < 0.31;
            }

            // Determinar Anexo baseado no CNAE + Fator R
            let dadosCNAE = null;
            if (d.cnae && _CnaeMapeamento && _CnaeMapeamento.obterRegrasCNAE) {
                dadosCNAE = _CnaeMapeamento.obterRegrasCNAE(d.cnae, '');
            }

            if (dadosCNAE) {
                if (dadosCNAE.vedado) {
                    anexoResultante = 'VEDADO';
                } else if (dadosCNAE.fatorR && fatorR !== null) {
                    anexoResultante = fatorR >= 0.28 ? 'III' : 'V';
                } else {
                    anexoResultante = dadosCNAE.anexo;
                }
            }

            // Classificação ME/EPP
            let classificacao = null;
            if (rbt12 > 0) {
                if (rbt12 <= 360000) {
                    classificacao = { tipo: 'ME', descricao: 'Microempresa', baseLegal: 'LC 123/2006, Art. 3º, I' };
                } else if (rbt12 <= 4800000) {
                    classificacao = { tipo: 'EPP', descricao: 'Empresa de Pequeno Porte', baseLegal: 'LC 123/2006, Art. 3º, II' };
                } else {
                    classificacao = { tipo: 'EXCEDEU', descricao: 'Receita excede limite do Simples Nacional (R$ 4.800.000)', baseLegal: 'LC 123/2006, Art. 3º, II' };
                }
            }

            // Alíquota efetiva estimada
            let aliquotaEfetiva = null;
            if (anexoResultante && anexoResultante !== 'VEDADO' && rbt12 > 0 && _IMPOST && _IMPOST.calcularAliquotaEfetiva) {
                try {
                    aliquotaEfetiva = _IMPOST.calcularAliquotaEfetiva({ rbt12: rbt12, anexo: anexoResultante });
                } catch (e) {
                    // Silenciar — pode não ter dados suficientes
                }
            }

            // DAS estimado mensal
            let dasEstimado = null;
            if (aliquotaEfetiva && d.receitaBrutaMensal > 0) {
                dasEstimado = d.receitaBrutaMensal * (aliquotaEfetiva.aliquotaEfetiva || 0);
            }

            // Verificar sublimite ICMS/ISS (R$ 3.600.000)
            const acimaSubLimite = rbt12 > 3600000;

            // MEI possível?
            const meiPossivel = rbt12 > 0 && rbt12 <= 81000 && d.socios.length <= 1;

            return {
                fatorR: {
                    valor: fatorR,
                    percentual: fatorRPercentual,
                    acimaDoLimiar: acimaDoLimiar,
                    zonaDeRisco: zonaDeRisco,
                    limiar: '28%',
                    baseLegal: 'LC 123/2006, Art. 18, §24; Resolução CGSN 140/2018, Art. 18, §5º-J'
                },
                anexo: {
                    anexo: anexoResultante,
                    nome: anexoResultante && _IMPOST && _IMPOST.ANEXOS && _IMPOST.ANEXOS[anexoResultante]
                        ? _IMPOST.ANEXOS[anexoResultante].nome : null,
                    cppInclusa: anexoResultante && _IMPOST && _IMPOST.ANEXOS && _IMPOST.ANEXOS[anexoResultante]
                        ? _IMPOST.ANEXOS[anexoResultante].cppInclusa !== false : true,
                    motivo: dadosCNAE && dadosCNAE.fatorR
                        ? `Fator R = ${fatorRPercentual || 'N/D'} (${acimaDoLimiar ? '≥' : '<'} 28%) → Anexo ${anexoResultante}`
                        : dadosCNAE ? `CNAE ${d.cnae} → Anexo ${anexoResultante} (fixo)`
                        : null,
                    baseLegal: 'Resolução CGSN 140/2018'
                },
                classificacao: classificacao,
                aliquotaEfetiva: aliquotaEfetiva,
                dasEstimado: dasEstimado,
                dasEstimadoFormatado: dasEstimado != null ? Utils.formatarMoeda(dasEstimado) : null,
                acimaSubLimite: acimaSubLimite,
                meiPossivel: meiPossivel,
                receitaBrutaAnual: d.receitaBrutaAnual,
                receitaBrutaMensal: d.receitaBrutaMensal,
                folhaAnual: d.folhaAnual
            };
        }

        /**
         * Validação em tempo real do formulário.
         * Retorna erros e alertas.
         *
         * @returns {Object} { valido: boolean, erros: [{campo, mensagem}], alertas: [{campo, mensagem, tipo}] }
         */
        function validar() {
            const erros = [];
            const alertas = [];
            const d = _dados;

            // === ERROS (impedem cálculo) ===

            if (!d.cnae) {
                erros.push({ campo: 'cnae', mensagem: 'CNAE é obrigatório.' });
            }

            if (!d.uf) {
                erros.push({ campo: 'uf', mensagem: 'Estado (UF) é obrigatório.' });
            }

            if (!d.municipio) {
                erros.push({ campo: 'municipio', mensagem: 'Município é obrigatório.' });
            }

            if (d.modoReceita === 'mensal' && (!d.receitaBrutaMensal || d.receitaBrutaMensal <= 0)) {
                erros.push({ campo: 'receitaBrutaMensal', mensagem: 'Receita bruta mensal é obrigatória e deve ser maior que zero.' });
            }

            if (d.modoReceita === 'anual' && (!d.receitaBrutaAnual || d.receitaBrutaAnual <= 0)) {
                erros.push({ campo: 'receitaBrutaAnual', mensagem: 'Receita bruta anual é obrigatória e deve ser maior que zero.' });
            }

            // Fator R: folha obrigatória se CNAE depende do Fator R
            if (d.cnae && _CnaeMapeamento && _CnaeMapeamento.obterRegrasCNAE) {
                const regras = _CnaeMapeamento.obterRegrasCNAE(d.cnae, '');
                if (regras && regras.fatorR && (!d.folhaMensal || d.folhaMensal <= 0)) {
                    erros.push({
                        campo: 'folhaMensal',
                        mensagem: 'Folha de pagamento mensal é obrigatória para CNAEs sujeitos ao Fator R (determina se Anexo III ou V).'
                    });
                }
            }

            // CNPJ: se informado, deve ser válido
            if (d.cnpj && !Utils.validarCNPJ(d.cnpj)) {
                erros.push({ campo: 'cnpj', mensagem: 'CNPJ informado é inválido.' });
            }

            // ISS: faixa 2% a 5%
            if (d.issAliquota < 2.00 || d.issAliquota > 5.00) {
                erros.push({
                    campo: 'issAliquota',
                    mensagem: `Alíquota ISS (${d.issAliquota}%) fora do limite legal: mínimo 2%, máximo 5% (LC 116/2003).`
                });
            }

            // Sócios: percentuais devem somar ~100%
            if (d.socios.length > 0) {
                const somaPercentual = d.socios.reduce((acc, s) => acc + (s.percentual || 0), 0);
                if (Math.abs(somaPercentual - 1) > 0.01) {
                    erros.push({
                        campo: 'socios',
                        mensagem: `Participação dos sócios soma ${Utils.formatarPercentual(somaPercentual)} — deve somar 100%.`
                    });
                }
            }

            // === ALERTAS (informativos, não impedem cálculo) ===

            // Receita excede limite
            const rbt = d.receitaBrutaAnual || (d.receitaBrutaMensal * 12);
            if (rbt > 4800000) {
                alertas.push({
                    campo: 'receitaBrutaAnual',
                    mensagem: `Receita bruta anual de ${Utils.formatarMoeda(rbt)} excede o limite do Simples Nacional (R$ 4.800.000). A empresa está obrigada a migrar para Lucro Presumido ou Lucro Real.`,
                    tipo: 'erro',
                    baseLegal: 'LC 123/2006, Art. 3º, II'
                });
            } else if (rbt > 3600000) {
                alertas.push({
                    campo: 'receitaBrutaAnual',
                    mensagem: `Receita bruta anual de ${Utils.formatarMoeda(rbt)} excede o sublimite de R$ 3.600.000. ICMS e ISS serão recolhidos POR FORA do DAS, nas regras normais.`,
                    tipo: 'aviso',
                    baseLegal: 'LC 123/2006, Art. 19'
                });
            }

            // Fator R na zona de risco (25%-31%)
            if (d.folhaMensal > 0 && rbt > 0) {
                const fr = (d.folhaMensal * 12) / rbt;
                if (fr >= 0.25 && fr < 0.31) {
                    alertas.push({
                        campo: 'folhaMensal',
                        mensagem: `Fator R = ${Utils.formatarPercentual(fr)} — ZONA DE RISCO. Está muito próximo do limiar de 28%. Pequenas variações na folha ou receita podem mudar o anexo (III ↔ V) e impactar significativamente o imposto.`,
                        tipo: 'aviso',
                        baseLegal: 'Resolução CGSN 140/2018, Art. 18, §5º-J'
                    });
                }
            }

            // CNAE vedado
            if (d.cnae && _CnaeMapeamento && _CnaeMapeamento.isVedado) {
                const vedacao = _CnaeMapeamento.isVedado(d.cnae);
                if (vedacao) {
                    alertas.push({
                        campo: 'cnae',
                        mensagem: `CNAE ${d.cnae} é VEDADO ao Simples Nacional: ${vedacao}`,
                        tipo: 'erro',
                        baseLegal: 'LC 123/2006, Art. 17'
                    });
                }
            }

            // MEI possível
            if (rbt > 0 && rbt <= 81000 && d.socios.length <= 1) {
                alertas.push({
                    campo: 'receitaBrutaAnual',
                    mensagem: `Receita anual de ${Utils.formatarMoeda(rbt)} permite enquadramento como MEI (limite R$ 81.000/ano). Considere esta opção mais econômica.`,
                    tipo: 'info',
                    baseLegal: 'LC 123/2006, Art. 18-A'
                });
            }

            // Anexo IV: CPP fora do DAS
            if (d.cnae && _CnaeMapeamento && _CnaeMapeamento.obterRegrasCNAE) {
                const regras = _CnaeMapeamento.obterRegrasCNAE(d.cnae, '');
                if (regras && regras.anexo === 'IV') {
                    alertas.push({
                        campo: 'cnae',
                        mensagem: 'Anexo IV: CPP (INSS patronal de 20% + RAT 2%) é pago POR FORA do DAS. Lembre-se de incluir esse custo no planejamento.',
                        tipo: 'aviso',
                        baseLegal: 'LC 123/2006, Art. 18, §5º-C; Lei 8.212/1991, Art. 22'
                    });
                }
            }

            // Receitas especiais
            if (d.receitaMonofasica > 0) {
                alertas.push({
                    campo: 'receitaMonofasica',
                    mensagem: `Receita monofásica de ${Utils.formatarMoeda(d.receitaMonofasica)}/mês. PIS e COFINS serão zerados nessa parcela na segregação do DAS.`,
                    tipo: 'economia',
                    baseLegal: 'Lei 10.147/2000; Resolução CGSN 140/2018, Art. 25-A'
                });
            }

            if (d.receitaExportacao > 0) {
                alertas.push({
                    campo: 'receitaExportacao',
                    mensagem: `Receita de exportação de ${Utils.formatarMoeda(d.receitaExportacao)}/mês é imune de ICMS, PIS e COFINS. Será segregada para reduzir o DAS.`,
                    tipo: 'economia',
                    baseLegal: 'CF/1988, Art. 153, §3º, III; LC 123/2006, Art. 18, §14'
                });
            }

            // Flags de elegibilidade
            if (d.socioPessoaJuridica) {
                alertas.push({
                    campo: 'socioPessoaJuridica',
                    mensagem: 'Empresa com sócio pessoa jurídica: elegibilidade ao Simples Nacional pode estar comprometida.',
                    tipo: 'aviso',
                    baseLegal: 'LC 123/2006, Art. 3º, §4º, I'
                });
            }

            if (d.debitosFiscaisPendentes) {
                alertas.push({
                    campo: 'debitosFiscaisPendentes',
                    mensagem: 'Débitos fiscais pendentes impedem a opção ou permanência no Simples Nacional.',
                    tipo: 'erro',
                    baseLegal: 'LC 123/2006, Art. 17, V'
                });
            }

            if (d.cessaoMaoObra) {
                alertas.push({
                    campo: 'cessaoMaoObra',
                    mensagem: 'Cessão de mão de obra (exceto construção civil, vigilância e limpeza): pode impedir o Simples Nacional.',
                    tipo: 'aviso',
                    baseLegal: 'LC 123/2006, Art. 17, XII'
                });
            }

            if (d.socioDomiciliadoExterior) {
                alertas.push({
                    campo: 'socioDomiciliadoExterior',
                    mensagem: 'Sócio domiciliado no exterior impede a opção pelo Simples Nacional.',
                    tipo: 'erro',
                    baseLegal: 'LC 123/2006, Art. 3º, §4º, IX'
                });
            }

            // Empresa nova: receita proporcional
            if (d.empresaNova && rbt > 0) {
                alertas.push({
                    campo: 'empresaNova',
                    mensagem: 'Empresa recém-constituída (< 12 meses): a RBT12 será calculada proporcionalmente ao número de meses de atividade.',
                    tipo: 'info',
                    baseLegal: 'LC 123/2006, Art. 18, §2º'
                });
            }

            const valido = erros.length === 0;

            // Emitir eventos
            if (!valido) {
                Eventos.emit('validacao:erro', erros);
            }

            return { valido, erros, alertas };
        }

        /**
         * Atualiza um campo do formulário e recalcula dependências.
         *
         * @param {string} nomeCampo — Nome do campo a atualizar
         * @param {*} valor — Novo valor
         * @returns {Object} Estado atualizado { dados, validacao, calculosDerivados }
         */
        function atualizarCampo(nomeCampo, valor) {
            if (!(nomeCampo in _dados)) {
                console.warn(`[SimplesEstudoCompleto.Formulario] Campo '${nomeCampo}' não existe.`);
                return getEstado();
            }

            const valorAnterior = _dados[nomeCampo];
            _dados[nomeCampo] = valor;

            // Ações especiais por campo
            switch (nomeCampo) {
                case 'cnae':
                    // Ao mudar CNAE, buscar dados e atualizar descrição
                    if (valor) {
                        const dadosCNAE = BuscaCNAE.selecionarCNAE(valor);
                        if (dadosCNAE) {
                            _dados.descricaoCNAE = dadosCNAE.descricao;
                        }
                    }
                    break;

                case 'uf':
                    // Ao mudar UF, selecionar estado e resetar município
                    if (valor) {
                        DadosEstado.selecionarEstado(valor);
                        _dados.municipio = '';
                    }
                    break;

                case 'municipio':
                    // Ao mudar município, buscar ISS
                    if (valor && _dados.uf) {
                        const dadosMun = DadosMunicipio.selecionarMunicipio(valor, _dados.uf);
                        if (dadosMun && dadosMun.iss) {
                            _dados.issAliquota = dadosMun.iss.aliquota;
                        }
                    }
                    break;

                case 'issAliquota':
                    // Validar e atualizar ISS no módulo DadosMunicipio
                    DadosMunicipio.atualizarISS(valor);
                    break;

                case 'receitaBrutaMensal':
                    _dados.modoReceita = 'mensal';
                    break;

                case 'receitaBrutaAnual':
                    _dados.modoReceita = 'anual';
                    break;
            }

            // Recalcular derivados
            const derivados = _calcularDerivados();

            // Emitir eventos específicos
            if (nomeCampo === 'folhaMensal' || nomeCampo === 'receitaBrutaMensal' || nomeCampo === 'receitaBrutaAnual') {
                if (derivados.fatorR.valor !== null) {
                    Eventos.emit('fatorR:mudou', derivados.fatorR);
                }
            }

            if (nomeCampo === 'cnae' || nomeCampo === 'folhaMensal' || nomeCampo === 'receitaBrutaMensal' || nomeCampo === 'receitaBrutaAnual') {
                if (derivados.anexo.anexo) {
                    Eventos.emit('anexo:mudou', derivados.anexo);
                }
            }

            // Emitir atualização geral
            const estado = { dados: { ..._dados }, validacao: validar(), calculosDerivados: derivados };
            Eventos.emit('formulario:atualizado', estado);

            return estado;
        }

        /**
         * Retorna estado completo atual do formulário.
         * @returns {Object} { dados, validacao, calculosDerivados }
         */
        function getEstado() {
            return {
                dados: { ..._dados },
                validacao: validar(),
                calculosDerivados: _calcularDerivados()
            };
        }

        /**
         * Retorna apenas os dados brutos do formulário.
         * @returns {Object}
         */
        function getDados() {
            return { ..._dados };
        }

        /**
         * Reseta todo o formulário ao estado inicial.
         * @returns {Object} Estado vazio
         */
        function resetar() {
            _dados = _criarDadosVazios();
            Eventos.emit('formulario:resetado', {});
            return getEstado();
        }

        /**
         * Carrega dados de uma vez (bulk update sem emitir eventos individuais).
         * Útil para restaurar estado salvo.
         * @param {Object} dados — Objeto parcial ou completo com campos a serem carregados
         * @returns {Object} Estado atualizado
         */
        function carregarDados(dados) {
            if (!dados || typeof dados !== 'object') return getEstado();

            Object.keys(dados).forEach(campo => {
                if (campo in _dados) {
                    _dados[campo] = dados[campo];
                }
            });

            // Recalcular tudo
            const derivados = _calcularDerivados();
            const estado = { dados: { ..._dados }, validacao: validar(), calculosDerivados: derivados };
            Eventos.emit('formulario:atualizado', estado);

            return estado;
        }

        return {
            validar,
            atualizarCampo,
            getEstado,
            getDados,
            resetar,
            carregarDados
        };
    })();

    // ═══════════════════════════════════════════════════════════════
    //  MÓDULO 7: MOTOR DE CÁLCULO INTEGRADO — Calculadora
    // ═══════════════════════════════════════════════════════════════

    const Calculadora = (function () {

        /**
         * Helper: monta array de 12 meses a partir de dados uniformes do formulário.
         * Necessário para calcularAnualConsolidado que espera meses[].
         * @param {Object} d — dados do formulário
         * @param {string} anexo — anexo determinado
         * @returns {Array<Object>}
         * @private
         */
        function _montarMeses(d, anexo) {
            const meses = [];
            for (let i = 0; i < 12; i++) {
                meses.push({
                    receitaBrutaMensal: d.receitaBrutaMensal || 0,
                    rbt12: d.receitaBrutaAnual || (d.receitaBrutaMensal * 12),
                    anexo: anexo || 'III',
                    folhaMensal: d.folhaMensal || 0,
                    issRetidoFonte: d.issRetidoFonte || 0,
                    aliquotaRAT: 0.02
                });
            }
            return meses;
        }

        /**
         * Cálculo COMPLETO — função principal do sistema.
         * Pega dados do Formulário e executa TODOS os cálculos usando as funções do IMPOST.
         *
         * Retorna objeto abrangente com: empresa, classificação, elegibilidade, fatorR,
         * anexo, alíquotaEfetiva, DAS mensal (com e sem otimização), consolidação anual,
         * distribuição de lucros, otimização fatorR, economia total,
         * estratégias, riscos, obrigações, calendário, reforma tributária e metadados.
         *
         * NOTA: A comparação entre regimes tributários é feita em arquivo separado.
         *
         * @returns {Object} Resultado completo de todos os cálculos
         *
         * Base legal: LC 123/2006; LC 155/2016; Resolução CGSN nº 140/2018
         */
        function calcularTudo() {
            const t0 = Date.now();
            const estadoForm = Formulario.getEstado();
            const d = estadoForm.dados;
            const derivados = estadoForm.calculosDerivados;
            const validacao = estadoForm.validacao;

            if (!_IMPOST) {
                return { erro: 'Módulo IMPOST (simples_nacional.js) não carregado.', _meta: { versao: _VERSION } };
            }

            // ── Dados da Empresa ──
            const empresa = {
                nome: d.nomeEmpresa || 'Empresa',
                cnpj: d.cnpj || null,
                cnae: d.cnae,
                descricaoCNAE: d.descricaoCNAE,
                uf: d.uf,
                municipio: d.municipio,
                receitaAnual: d.receitaBrutaAnual,
                receitaMensal: d.receitaBrutaMensal,
                folhaMensal: d.folhaMensal,
                folhaAnual: d.folhaAnual || d.folhaMensal * 12,
                proLabore: d.proLabore,
                qtdFuncionarios: d.qtdFuncionarios,
                socios: d.socios || []
            };

            // ── Classificação ME/EPP ──
            const rbt12 = d.receitaBrutaAnual || (d.receitaBrutaMensal * 12);
            let classificacao;
            if (rbt12 <= 0) {
                classificacao = { tipo: null, baseLegal: 'LC 123/2006, Art. 3º', limiteUtilizado: 'N/A' };
            } else if (rbt12 <= 360000) {
                classificacao = { tipo: 'ME', baseLegal: 'LC 123/2006, Art. 3º, I', limiteUtilizado: 'R$ 360.000' };
            } else if (rbt12 <= 4800000) {
                classificacao = { tipo: 'EPP', baseLegal: 'LC 123/2006, Art. 3º, II', limiteUtilizado: 'R$ 4.800.000' };
            } else {
                classificacao = { tipo: 'EXCEDEU', baseLegal: 'LC 123/2006, Art. 3º, II', limiteUtilizado: 'R$ 4.800.000' };
            }

            // ── Elegibilidade ──
            const elegibilidadeParams = {
                receitaBrutaAnual: rbt12,
                receitaBrutaAnualAnterior: d.receitaBrutaAnualAnterior || 0,
                cnae: d.cnae,
                socioPessoaJuridica: d.socioPessoaJuridica,
                socioParticipacaoOutraPJ: d.socioParticipacaoOutraPJ,
                socioAdminOutraPJ: d.socioAdminOutraPJ,
                debitosFiscaisPendentes: d.debitosFiscaisPendentes,
                cessaoMaoObra: d.cessaoMaoObra,
                socioDomiciliadoExterior: d.socioDomiciliadoExterior
            };
            const elegibilidadeRaw = _chamarIMPOST('verificarElegibilidade', elegibilidadeParams);
            const elegibilidade = {
                elegivel: elegibilidadeRaw ? elegibilidadeRaw.elegivel : true,
                classificacao: elegibilidadeRaw ? elegibilidadeRaw.classificacao : (classificacao.tipo !== 'EXCEDEU' ? classificacao.tipo : null),
                impedimentos: elegibilidadeRaw ? (elegibilidadeRaw.impedimentos || []).map(function (imp) {
                    return { descricao: typeof imp === 'string' ? imp : imp.descricao || imp.impedimento || String(imp), baseLegal: imp.baseLegal || 'LC 123/2006, Art. 17' };
                }) : [],
                alertas: elegibilidadeRaw ? (elegibilidadeRaw.alertas || []).map(function (a) {
                    return { mensagem: typeof a === 'string' ? a : a.mensagem || a.alerta || String(a), tipo: a.tipo || 'aviso' };
                }) : [],
                sublimite: elegibilidadeRaw ? elegibilidadeRaw.sublimiteEstadual : null,
                baseLegal: 'LC 123/2006, Art. 3º e Art. 17'
            };

            // ── Fator R ──
            const folha12 = d.folhaAnual || (d.folhaMensal * 12);
            const fatorRRaw = _chamarIMPOST('calcularFatorR', {
                folhaSalarios12Meses: folha12,
                receitaBruta12Meses: rbt12
            });
            const fatorR = {
                valor: fatorRRaw ? fatorRRaw.fatorR : (rbt12 > 0 ? folha12 / rbt12 : 0),
                percentual: fatorRRaw ? fatorRRaw.fatorRPercentual : (rbt12 > 0 ? Utils.formatarPercentual(folha12 / rbt12) : '0,00%'),
                acimaDoLimiar: fatorRRaw ? fatorRRaw.acimaDoLimiar : (rbt12 > 0 ? (folha12 / rbt12) >= 0.28 : false),
                limiar: '28%',
                anexoResultante: fatorRRaw ? fatorRRaw.anexoResultante : null,
                observacao: fatorRRaw ? fatorRRaw.observacao : '',
                baseLegal: 'LC 123/2006, Art. 18, §24; Resolução CGSN 140/2018, Art. 18, §5º-J'
            };

            // ── Anexo Determinado ──
            const anexoRaw = _chamarIMPOST('determinarAnexo', {
                cnae: d.cnae,
                fatorR: fatorR.valor
            });
            const anexoFinal = anexoRaw ? anexoRaw.anexo : (derivados.anexo ? derivados.anexo.anexo : 'III');
            const anexoInfo = _IMPOST.ANEXOS ? _IMPOST.ANEXOS[anexoFinal] : null;
            const anexo = {
                anexo: anexoFinal,
                nome: anexoInfo ? anexoInfo.nome : 'Anexo ' + anexoFinal,
                descricao: anexoInfo ? anexoInfo.descricao : '',
                motivo: anexoRaw && anexoRaw.motivo ? anexoRaw.motivo
                    : (fatorRRaw && fatorRRaw.anexoResultante
                        ? 'Fator R = ' + fatorR.percentual + ' (' + (fatorR.acimaDoLimiar ? '≥' : '<') + ' 28%) → Anexo ' + anexoFinal
                        : 'CNAE ' + d.cnae + ' → Anexo ' + anexoFinal),
                cppInclusa: anexoRaw ? (anexoRaw.cppInclusa !== false) : (anexoInfo ? anexoInfo.cppInclusa !== false : true),
                tributosDentro: anexoRaw ? (anexoRaw.tributosDentro || []) : (anexoInfo ? (anexoInfo.tributosDentro || []) : []),
                tributosFora: anexoRaw ? (anexoRaw.tributosFora || []) : (anexoInfo ? (anexoInfo.tributosFora || []) : []),
                baseLegal: anexoRaw ? (anexoRaw.baseLegal || 'Resolução CGSN 140/2018') : 'Resolução CGSN 140/2018'
            };

            // ── Alíquota Efetiva ──
            const aliqRaw = rbt12 > 0 ? _chamarIMPOST('calcularAliquotaEfetiva', { rbt12: rbt12, anexo: anexoFinal }) : null;
            const aliquotaEfetiva = {
                valor: aliqRaw ? aliqRaw.aliquotaEfetiva : 0,
                formatada: aliqRaw ? aliqRaw.aliquotaEfetivaFormatada : '0,00%',
                faixa: aliqRaw ? aliqRaw.faixa : 0,
                faixaDescricao: aliqRaw ? aliqRaw.faixaDescricao : '',
                aliquotaNominal: aliqRaw ? aliqRaw.aliquotaNominal : 0,
                aliquotaNominalFormatada: aliqRaw ? aliqRaw.aliquotaNominalFormatada : '0,00%',
                parcelaADeduzir: aliqRaw ? aliqRaw.parcelaADeduzir : 0,
                baseLegal: 'LC 123/2006, Art. 18, §1º'
            };

            // ── DAS Mensal ──
            // Sem otimização
            const dasParams = {
                receitaBrutaMensal: d.receitaBrutaMensal,
                rbt12: rbt12,
                anexo: anexoFinal,
                issRetidoFonte: d.issRetidoFonte || 0,
                folhaMensal: d.folhaMensal || 0,
                aliquotaRAT: 0.02
            };
            const dasSemOtim = d.receitaBrutaMensal > 0 ? _chamarIMPOST('calcularDASMensal', dasParams) : null;

            // Com otimização
            const dasOtimParams = {
                receitaBrutaMensal: d.receitaBrutaMensal,
                rbt12: rbt12,
                anexo: anexoFinal,
                cnae: d.cnae,
                uf: d.uf,
                municipio: d.municipio,
                receitaMonofasica: d.receitaMonofasica || 0,
                receitaICMS_ST: d.receitaICMS_ST || 0,
                receitaExportacao: d.receitaExportacao || 0,
                receitaLocacaoBensMoveis: d.receitaLocacaoBensMoveis || 0,
                issRetidoFonte: d.issRetidoFonte || 0,
                folhaMensal: d.folhaMensal || 0,
                aliquotaRAT: 0.02,
                aliquotaISS: d.issAliquota || 5.00
            };
            const dasComOtim = d.receitaBrutaMensal > 0 ? _chamarIMPOST('calcularDASMensalOtimizado', dasOtimParams) : null;

            const dasMensal = {
                semOtimizacao: {
                    valor: dasSemOtim ? (dasSemOtim.dasAPagar || dasSemOtim.dasValor || 0) : 0,
                    dasValor: dasSemOtim ? (dasSemOtim.dasValor || 0) : 0,
                    partilha: dasSemOtim ? dasSemOtim.partilha : {},
                    totalAPagar: dasSemOtim ? (dasSemOtim.totalAPagar || 0) : 0,
                    inssPatronalFora: dasSemOtim ? (dasSemOtim.inssPatronalFora || 0) : 0,
                    aliquotaEfetiva: dasSemOtim ? dasSemOtim.aliquotaEfetiva : 0,
                    aliquotaEfetivaFormatada: dasSemOtim ? dasSemOtim.aliquotaEfetivaFormatada : '0,00%'
                },
                comOtimizacao: {
                    valor: dasComOtim ? (dasComOtim.dasOtimizado || dasComOtim.totalAPagar || 0) : 0,
                    dasSemOtimizacao: dasComOtim ? (dasComOtim.dasSemOtimizacao || 0) : 0,
                    dasOtimizado: dasComOtim ? (dasComOtim.dasOtimizado || 0) : 0,
                    economia: dasComOtim ? (dasComOtim.economiaTotal || 0) : 0,
                    economiaPercentual: dasComOtim ? (dasComOtim.economiaPercentual || '0,00%') : '0,00%',
                    deducoes: dasComOtim ? (dasComOtim.deducoes || []) : [],
                    alertas: dasComOtim ? (dasComOtim.alertas || []) : [],
                    partilha: dasComOtim ? dasComOtim.partilha : {},
                    totalAPagar: dasComOtim ? (dasComOtim.totalAPagar || 0) : 0,
                    inssPatronalFora: dasComOtim ? (dasComOtim.inssPatronalFora || 0) : 0
                }
            };

            // ── Consolidação Anual ──
            const mesesArray = _montarMeses(d, anexoFinal);
            const anualParams = {
                meses: mesesArray,
                socios: d.socios && d.socios.length > 0 ? d.socios : undefined,
                cnae: d.cnae,
                tipoAtividade: d.cnae ? undefined : undefined,
                aliquotaRAT: 0.02
            };
            const anualRaw = _chamarIMPOST('calcularAnualConsolidado', anualParams);
            const anual = {
                receitaBrutaAnual: anualRaw ? anualRaw.receitaBrutaAnual : rbt12,
                dasAnual: anualRaw ? anualRaw.dasAnual : (dasMensal.semOtimizacao.valor * 12),
                cargaTributariaTotal: anualRaw ? anualRaw.cargaTributariaTotal : 0,
                percentualCarga: anualRaw ? anualRaw.percentualCargaFormatado : aliquotaEfetiva.formatada,
                fgtsAnual: anualRaw ? (anualRaw.fgtsAnual || 0) : 0,
                inssPatronalAnualFora: anualRaw ? (anualRaw.inssPatronalAnualFora || 0) : (dasMensal.semOtimizacao.inssPatronalFora * 12),
                partilhaAnual: anualRaw ? anualRaw.partilhaAnual : {},
                detalhamentoMensal: anualRaw ? (anualRaw.detalhamentoMensal || []) : [],
                baseLegal: 'LC 123/2006; Resolução CGSN 140/2018'
            };

            // ── Distribuição de Lucros ──
            const distParams = {
                receitaBrutaAnual: rbt12,
                dasAnual: anual.dasAnual,
                socios: d.socios && d.socios.length > 0 ? d.socios : [{ nome: 'Sócio Único', percentual: 1.0 }],
                cnae: d.cnae,
                tipoAtividade: undefined
            };
            const distRaw = _chamarIMPOST('calcularDistribuicaoLucros', distParams);
            const distribuicaoLucros = {
                modalidade: distRaw ? (distRaw.modalidadeUtilizada || 'presuncao') : 'presuncao',
                lucroDistribuivel: distRaw ? distRaw.lucroDistribuivelFinal : 0,
                lucroDistribuivelPresumido: distRaw ? distRaw.lucroDistribuivelPresumido : 0,
                percentualPresuncao: distRaw ? distRaw.percentualPresuncao : 0.32,
                percentualPresuncaoFormatado: distRaw ? distRaw.percentualPresuncaoFormatado : '32,00%',
                porSocio: distRaw ? (distRaw.porSocio || []) : [],
                alertas: distRaw ? (distRaw.alertas || []) : [],
                baseLegal: distRaw ? distRaw.baseLegal : 'LC 123/2006, Art. 14; ADI SRF 04/2007'
            };

            // ── Otimização Fator R (se aplicável) ──
            let otimizacaoFatorR = { aplicavel: false };
            if (d.cnae) {
                var regrasCnae = _CnaeMapeamento && _CnaeMapeamento.obterRegrasCNAE ? _CnaeMapeamento.obterRegrasCNAE(d.cnae, '') : null;
                // Fallback: checar via IMPOST.determinarAnexo se o CNAE depende do Fator R
                var cnaeUsaFatorR = (regrasCnae && regrasCnae.fatorR) || (anexoRaw && anexoRaw.tipo === 'fator_r');
                if (cnaeUsaFatorR) {
                    const otimParams = {
                        rbt12: rbt12,
                        folhaAtual12Meses: folha12,
                        receitaMensal: d.receitaBrutaMensal,
                        cnae: d.cnae
                    };
                    const otimRaw = _chamarIMPOST('otimizarFatorR', otimParams);
                    if (otimRaw) {
                        otimizacaoFatorR = {
                            aplicavel: true,
                            fatorRAtual: otimRaw.fatorRAtualFormatado || Utils.formatarPercentual(fatorR.valor),
                            anexoAtual: otimRaw.anexoAtual || anexoFinal,
                            jaOtimizado: !!otimRaw.jaOtimizado,
                            fatorRNecessario: otimRaw.fatorRNecessario || 0.28,
                            aumentoNecessario: otimRaw.aumentoMensalNecessario || 0,
                            aumentoNecessarioFormatado: Utils.formatarMoeda(otimRaw.aumentoMensalNecessario || 0),
                            custoAumentoAnual: otimRaw.custoAumentoAnual || 0,
                            economiaDASAnual: otimRaw.economiaDASAnual || 0,
                            economiaLiquida: otimRaw.economiaLiquida || 0,
                            valeAPena: !!otimRaw.vale_a_pena,
                            cenarios: otimRaw.cenarios || [],
                            explicacao: otimRaw.jaOtimizado
                                ? 'O Fator R já está acima de 28%. A empresa já tributa pelo Anexo III (alíquotas menores).'
                                : otimRaw.vale_a_pena
                                    ? 'Aumentar a folha em ' + Utils.formatarMoeda(otimRaw.aumentoMensalNecessario || 0)
                                      + '/mês permite migrar do Anexo V para o III, economizando '
                                      + Utils.formatarMoeda(otimRaw.economiaLiquida || 0) + '/ano líquido.'
                                    : 'O custo para atingir o Fator R de 28% supera a economia de DAS. Não compensa aumentar a folha apenas para trocar de anexo.',
                            baseLegal: 'LC 123/2006, Art. 18, §24; Resolução CGSN 140/2018, Art. 18, §5º-J'
                        };
                    }
                }
            }

            // ── Economia Total Possível ──
            var fonteEconomia = [];
            var economiaTotalValor = 0;

            // Economia com otimização DAS
            if (dasComOtim && (dasComOtim.economiaTotal || 0) > 0) {
                var ecoDAS = (dasComOtim.economiaTotal || 0) * 12;
                fonteEconomia.push({
                    fonte: 'Otimização DAS (monofásicos, exportação, ISS retido, etc.)',
                    valorMensal: dasComOtim.economiaTotal,
                    valorAnual: ecoDAS,
                    baseLegal: 'Resolução CGSN 140/2018, Art. 25-A e Art. 18, §14'
                });
                economiaTotalValor += ecoDAS;
            }

            // Economia com Fator R
            if (otimizacaoFatorR.aplicavel && !otimizacaoFatorR.jaOtimizado && otimizacaoFatorR.valeAPena) {
                fonteEconomia.push({
                    fonte: 'Fator R (migração Anexo V → III)',
                    valorMensal: (otimizacaoFatorR.economiaLiquida || 0) / 12,
                    valorAnual: otimizacaoFatorR.economiaLiquida || 0,
                    baseLegal: 'LC 123/2006, Art. 18, §24'
                });
                economiaTotalValor += (otimizacaoFatorR.economiaLiquida || 0);
            }

            // Incentivos regionais (informativo — economia potencial com SUDAM/SUDENE)
            var estadoAtual = DadosEstado.getEstadoAtual();
            if (estadoAtual && estadoAtual.incentivos && (estadoAtual.incentivos.sudam || estadoAtual.incentivos.sudene)) {
                fonteEconomia.push({
                    fonte: 'Incentivos regionais disponíveis (' + (estadoAtual.incentivos.sudam ? 'SUDAM' : 'SUDENE') + ' — redução 75% IRPJ no Lucro Real)',
                    valorMensal: 0,
                    valorAnual: 0,
                    baseLegal: 'Lei 12.715/2012, Art. 1°; MP 2.199-14/2001',
                    tipo: 'informativo',
                    nota: 'Verifique na aba de comparação de regimes se o Lucro Real com incentivo é mais vantajoso.'
                });
            }

            var economiaTotal = {
                economiaMensal: economiaTotalValor / 12,
                economiaAnual: economiaTotalValor,
                economiaMensalFormatada: Utils.formatarMoeda(economiaTotalValor / 12),
                economiaAnualFormatada: Utils.formatarMoeda(economiaTotalValor),
                percentualEconomia: anual.dasAnual > 0 ? Utils.formatarPercentual(economiaTotalValor / anual.dasAnual) : '0,00%',
                fontes: fonteEconomia,
                explicacao: fonteEconomia.length > 0
                    ? 'Economia total estimada de ' + Utils.formatarMoeda(economiaTotalValor) + '/ano através de: '
                      + fonteEconomia.map(function (f) { return f.fonte + ' (' + Utils.formatarMoeda(f.valorAnual) + ')'; }).join('; ') + '.'
                    : 'Nenhuma otimização adicional identificada com os dados informados.'
            };

            // ── Estratégias de Economia ──
            var estrategiasRaw = [];
            if (_IMPOST.ESTRATEGIAS_MENOR_IMPOSTO) {
                estrategiasRaw = _IMPOST.ESTRATEGIAS_MENOR_IMPOSTO;
            }
            var dicasRaw = _chamarIMPOST('gerarDicasEconomia', {
                receitaBrutaAnual: rbt12,
                receitaBrutaMensal: d.receitaBrutaMensal,
                folhaAnual: folha12,
                folhaMensal: d.folhaMensal,
                cnae: d.cnae,
                uf: d.uf,
                anexo: anexoFinal,
                rbt12: rbt12,
                socios: d.socios,
                temProdutosMonofasicos: (d.receitaMonofasica || 0) > 0,
                receitaMonofasica: d.receitaMonofasica || 0
            });

            var estrategias = [];
            if (Array.isArray(estrategiasRaw)) {
                estrategiasRaw.forEach(function (e) {
                    estrategias.push({
                        titulo: e.titulo || e.estrategia || e.nome || '',
                        descricao: e.descricao || e.detalhamento || '',
                        impacto: e.impacto || 'medio',
                        baseLegal: e.baseLegal || 'LC 123/2006',
                        aplicavel: true
                    });
                });
            }
            if (dicasRaw && dicasRaw.dicas) {
                dicasRaw.dicas.forEach(function (d) {
                    estrategias.push({
                        titulo: d.titulo || d.dica || '',
                        descricao: d.descricao || d.detalhamento || '',
                        impacto: d.impacto || 'medio',
                        baseLegal: d.baseLegal || 'LC 123/2006',
                        aplicavel: true
                    });
                });
            }

            // ── Riscos Fiscais ──
            var riscos = [];
            if (_IMPOST.RISCOS_FISCAIS && Array.isArray(_IMPOST.RISCOS_FISCAIS)) {
                _IMPOST.RISCOS_FISCAIS.forEach(function (r) {
                    riscos.push({
                        titulo: r.titulo || r.risco || r.nome || '',
                        descricao: r.descricao || '',
                        gravidade: r.gravidade || r.severidade || 'media',
                        baseLegal: r.baseLegal || 'LC 123/2006',
                        recomendacao: r.recomendacao || r.mitigacao || ''
                    });
                });
            }

            // ── Obrigações Acessórias ──
            var obrigacoes = [];
            if (_IMPOST.OBRIGACOES_ACESSORIAS && Array.isArray(_IMPOST.OBRIGACOES_ACESSORIAS)) {
                _IMPOST.OBRIGACOES_ACESSORIAS.forEach(function (o) {
                    obrigacoes.push({
                        nome: o.nome || o.obrigacao || '',
                        descricao: o.descricao || '',
                        periodicidade: o.periodicidade || o.frequencia || '',
                        prazo: o.prazo || o.vencimento || '',
                        baseLegal: o.baseLegal || 'Resolução CGSN 140/2018'
                    });
                });
            }

            // ── Calendário Fiscal 2026 ──
            var calendario = _IMPOST.CALENDARIO_FISCAL_2026 || {};

            // ── Reforma Tributária ──
            var reformaTributaria = {
                cronograma: _IMPOST.REFORMA_TRIBUTARIA_SIMPLES ? (_IMPOST.REFORMA_TRIBUTARIA_SIMPLES.cronograma || '') : 'Transição 2026-2033',
                impactoSimples: _IMPOST.REFORMA_TRIBUTARIA_SIMPLES ? (_IMPOST.REFORMA_TRIBUTARIA_SIMPLES.impacto || _IMPOST.REFORMA_TRIBUTARIA_SIMPLES.impactoSimples || '') : 'Simples Nacional permanece com tratamento diferenciado na reforma tributária.',
                dados: _IMPOST.REFORMA_TRIBUTARIA_SIMPLES || {},
                baseLegal: 'EC 132/2023; LC 214/2025; LC 227/2026'
            };

            // ── MEI (se aplicável) ──
            var meiInfo = null;
            if (rbt12 > 0 && rbt12 <= 81000 && d.socios.length <= 1) {
                meiInfo = {
                    elegivel: true,
                    limiteAnual: 81000,
                    limiteAnualFormatado: 'R$ 81.000,00',
                    dados: _IMPOST.MEI || {},
                    recomendacao: 'Receita anual de ' + Utils.formatarMoeda(rbt12)
                        + ' permite enquadramento como MEI. O custo mensal é fixo e significativamente menor que o Simples Nacional.',
                    baseLegal: 'LC 123/2006, Art. 18-A'
                };
            }

            // ── Impacto Dividendos 2026 ──
            var dividendos = null;
            if (distribuicaoLucros.lucroDistribuivel > 0 && d.socios.length > 0) {
                var lucroMensal = distribuicaoLucros.lucroDistribuivel / 12;
                dividendos = _chamarIMPOST('calcularImpactoDividendos2026', {
                    lucroDistribuivelMensal: lucroMensal,
                    socios: d.socios.map(function (s) {
                        return { nome: s.nome || 'Sócio', percentual: s.percentual || 1.0 };
                    })
                });
            }

            // ── Metadados ──
            var _meta = {
                versao: _VERSION,
                calculadoEm: new Date().toISOString(),
                modulosUtilizados: [
                    _IMPOST ? 'IMPOST (simples_nacional.js)' : null,
                    _CnaeMapeamento ? 'CnaeMapeamento (cnae-mapeamento.js)' : null,
                    _Estados ? 'Estados (estados.js)' : null,
                    _MunicipiosIBGE ? 'MunicipiosIBGE (municipios.js)' : null
                ].filter(Boolean),
                tempoCalculo: (Date.now() - t0) + 'ms',
                validacaoFormulario: validacao
            };

            var resultado = {
                empresa: empresa,
                classificacao: classificacao,
                elegibilidade: elegibilidade,
                fatorR: fatorR,
                anexo: anexo,
                aliquotaEfetiva: aliquotaEfetiva,
                dasMensal: dasMensal,
                anual: anual,
                distribuicaoLucros: distribuicaoLucros,
                otimizacaoFatorR: otimizacaoFatorR,
                economiaTotal: economiaTotal,
                estrategias: estrategias,
                riscos: riscos,
                obrigacoes: obrigacoes,
                calendario: calendario,
                reformaTributaria: reformaTributaria,
                mei: meiInfo,
                dividendos2026: dividendos,
                _meta: _meta
            };

            // Emitir evento
            Eventos.emit('calculo:concluido', resultado);

            return resultado;
        }

        /**
         * Cálculo rápido apenas do Fator R (para atualização em tempo real).
         *
         * @returns {Object} { valor, percentual, acimaDoLimiar, anexoResultante, zonaDeRisco, baseLegal }
         *
         * Base legal: LC 123/2006, Art. 18, §24; Resolução CGSN 140/2018, Art. 18, §5º-J
         */
        function calcularFatorR() {
            var d = Formulario.getDados();
            var rbt12 = d.receitaBrutaAnual || (d.receitaBrutaMensal * 12);
            var folha12 = d.folhaAnual || (d.folhaMensal * 12);

            if (rbt12 <= 0) {
                return {
                    valor: 0,
                    percentual: '0,00%',
                    acimaDoLimiar: false,
                    anexoResultante: null,
                    zonaDeRisco: false,
                    baseLegal: 'LC 123/2006, Art. 18, §24'
                };
            }

            var raw = _chamarIMPOST('calcularFatorR', {
                folhaSalarios12Meses: folha12,
                receitaBruta12Meses: rbt12
            });

            if (raw) {
                var fr = raw.fatorR || 0;
                return {
                    valor: fr,
                    percentual: raw.fatorRPercentual || Utils.formatarPercentual(fr),
                    acimaDoLimiar: !!raw.acimaDoLimiar,
                    anexoResultante: raw.anexoResultante || (fr >= 0.28 ? 'III' : 'V'),
                    zonaDeRisco: fr >= 0.25 && fr < 0.31,
                    observacao: raw.observacao || '',
                    baseLegal: raw.baseLegal || 'LC 123/2006, Art. 18, §24; Resolução CGSN 140/2018, Art. 18, §5º-J'
                };
            }

            // Fallback manual
            var frManual = folha12 / rbt12;
            return {
                valor: frManual,
                percentual: Utils.formatarPercentual(frManual),
                acimaDoLimiar: frManual >= 0.28,
                anexoResultante: frManual >= 0.28 ? 'III' : 'V',
                zonaDeRisco: frManual >= 0.25 && frManual < 0.31,
                observacao: '',
                baseLegal: 'LC 123/2006, Art. 18, §24; Resolução CGSN 140/2018, Art. 18, §5º-J'
            };
        }

        /**
         * Cálculo rápido do DAS mensal (para atualização em tempo real).
         * Inclui versão sem otimização e com otimização.
         *
         * @returns {Object} { semOtimizacao, comOtimizacao, economia, aliquotaEfetiva }
         *
         * Base legal: LC 123/2006, Art. 18; Resolução CGSN 140/2018
         */
        function calcularDASRapido() {
            var d = Formulario.getDados();
            var rbt12 = d.receitaBrutaAnual || (d.receitaBrutaMensal * 12);

            if (!_IMPOST || d.receitaBrutaMensal <= 0 || rbt12 <= 0) {
                return {
                    semOtimizacao: { valor: 0, totalAPagar: 0 },
                    comOtimizacao: { valor: 0, economia: 0, totalAPagar: 0 },
                    economia: 0,
                    aliquotaEfetiva: { valor: 0, formatada: '0,00%' }
                };
            }

            // Determinar anexo (com fallback via IMPOST.determinarAnexo)
            var folha12 = d.folhaAnual || (d.folhaMensal * 12);
            var derivados = Formulario.getEstado().calculosDerivados;
            var anexoFinal = derivados.anexo ? derivados.anexo.anexo : null;
            if (!anexoFinal || anexoFinal === 'VEDADO') {
                var frLocal = folha12 > 0 && rbt12 > 0 ? folha12 / rbt12 : 0;
                var detAnexo = _chamarIMPOST('determinarAnexo', { cnae: d.cnae, fatorR: frLocal });
                anexoFinal = detAnexo ? detAnexo.anexo : 'III';
                if (!anexoFinal || anexoFinal === 'VEDADO') anexoFinal = 'III';
            }

            // DAS sem otimização
            var dasSem = _chamarIMPOST('calcularDASMensal', {
                receitaBrutaMensal: d.receitaBrutaMensal,
                rbt12: rbt12,
                anexo: anexoFinal,
                issRetidoFonte: d.issRetidoFonte || 0,
                folhaMensal: d.folhaMensal || 0,
                aliquotaRAT: 0.02
            });

            // DAS com otimização
            var dasCom = _chamarIMPOST('calcularDASMensalOtimizado', {
                receitaBrutaMensal: d.receitaBrutaMensal,
                rbt12: rbt12,
                anexo: anexoFinal,
                cnae: d.cnae,
                uf: d.uf,
                municipio: d.municipio,
                receitaMonofasica: d.receitaMonofasica || 0,
                receitaICMS_ST: d.receitaICMS_ST || 0,
                receitaExportacao: d.receitaExportacao || 0,
                receitaLocacaoBensMoveis: d.receitaLocacaoBensMoveis || 0,
                issRetidoFonte: d.issRetidoFonte || 0,
                folhaMensal: d.folhaMensal || 0,
                aliquotaRAT: 0.02,
                aliquotaISS: d.issAliquota || 5.00
            });

            var valorSem = dasSem ? (dasSem.totalAPagar || dasSem.dasAPagar || dasSem.dasValor || 0) : 0;
            var valorCom = dasCom ? (dasCom.totalAPagar || dasCom.dasOtimizado || 0) : valorSem;
            var economia = dasCom ? (dasCom.economiaTotal || 0) : 0;

            return {
                semOtimizacao: {
                    valor: dasSem ? (dasSem.dasAPagar || dasSem.dasValor || 0) : 0,
                    totalAPagar: valorSem,
                    partilha: dasSem ? dasSem.partilha : {},
                    inssPatronalFora: dasSem ? (dasSem.inssPatronalFora || 0) : 0,
                    aliquotaEfetiva: dasSem ? dasSem.aliquotaEfetiva : 0,
                    aliquotaEfetivaFormatada: dasSem ? dasSem.aliquotaEfetivaFormatada : '0,00%'
                },
                comOtimizacao: {
                    valor: valorCom,
                    economia: economia,
                    economiaPercentual: dasCom ? (dasCom.economiaPercentual || '0,00%') : '0,00%',
                    deducoes: dasCom ? (dasCom.deducoes || []) : [],
                    totalAPagar: valorCom,
                    alertas: dasCom ? (dasCom.alertas || []) : []
                },
                economia: economia,
                economiaAnual: economia * 12,
                aliquotaEfetiva: {
                    valor: dasSem ? (dasSem.aliquotaEfetiva || 0) : 0,
                    formatada: dasSem ? (dasSem.aliquotaEfetivaFormatada || '0,00%') : '0,00%'
                },
                baseLegal: 'LC 123/2006, Art. 18; Resolução CGSN 140/2018'
            };
        }

        // ── Métodos individuais de cálculo — chamam IMPOST diretamente, sem fallback ──

        /**
         * Calcula DAS mensal usando IMPOST real. Sem fallback inventado.
         * Se IMPOST retornar null, lança erro explicando o que falta.
         *
         * @param {Object} dados - { receitaBrutaMensal, rbt12, anexo?, cnae?, fatorR?, issRetidoFonte?, folhaMensal?, aliquotaRAT? }
         * @returns {Object} Resultado de IMPOST.calcularDASMensal
         * @throws {Error} se IMPOST ausente ou retornar null
         *
         * Base legal: LC 123/2006, Art. 18; Resolução CGSN 140/2018
         */
        function calcularDASMensal(dados) {
            if (!dados || !dados.receitaBrutaMensal || !dados.rbt12) {
                throw new Error('[Calculadora.calcularDASMensal] Parâmetros obrigatórios: receitaBrutaMensal, rbt12.');
            }
            var anexo = dados.anexo;
            if (!anexo && dados.cnae) {
                var det = _chamarIMPOSTCritico('determinarAnexo', {
                    cnae: dados.cnae, fatorR: dados.fatorR || 0
                }, 'Calculadora.calcularDASMensal');
                anexo = det.anexo;
            }
            if (!anexo) {
                throw new Error('[Calculadora.calcularDASMensal] Anexo não informado e não foi possível determinar via CNAE. Informe dados.anexo ou dados.cnae.');
            }
            return _chamarIMPOSTCritico('calcularDASMensal', {
                receitaBrutaMensal: dados.receitaBrutaMensal,
                rbt12: dados.rbt12,
                anexo: anexo,
                issRetidoFonte: dados.issRetidoFonte || 0,
                folhaMensal: dados.folhaMensal || 0,
                aliquotaRAT: dados.aliquotaRAT || 0.02
            }, 'Calculadora.calcularDASMensal');
        }

        /**
         * Calcula alíquota efetiva usando IMPOST real. Sem fallback.
         * Fórmula: (RBT12 × alíquotaNominal − parcelaADeduzir) / RBT12
         *
         * @param {Object} dados - { rbt12, anexo }
         * @returns {Object} Resultado de IMPOST.calcularAliquotaEfetiva
         * @throws {Error} se IMPOST ausente ou retornar null
         *
         * Base legal: LC 123/2006, Art. 18, §1º
         */
        function calcularAliquotaEfetiva(dados) {
            if (!dados || !dados.rbt12 || !dados.anexo) {
                throw new Error('[Calculadora.calcularAliquotaEfetiva] Parâmetros obrigatórios: rbt12, anexo.');
            }
            return _chamarIMPOSTCritico('calcularAliquotaEfetiva', {
                rbt12: dados.rbt12, anexo: dados.anexo
            }, 'Calculadora.calcularAliquotaEfetiva');
        }

        /**
         * Calcula Fator R usando IMPOST real. Sem fallback.
         * Fator R = folhaSalarios12Meses / receitaBruta12Meses.
         * Se Fator R ≥ 28%, o anexo resultante é III; caso contrário, V.
         *
         * @param {Object} dados - { folhaSalarios12Meses, receitaBruta12Meses }
         * @returns {Object} Resultado de IMPOST.calcularFatorR
         * @throws {Error} se IMPOST ausente ou retornar null
         *
         * Base legal: LC 123/2006, Art. 18, §24; Resolução CGSN 140/2018, Art. 18, §5º-J
         */
        function calcularFatorRDireto(dados) {
            if (!dados || dados.receitaBruta12Meses == null) {
                throw new Error('[Calculadora.calcularFatorR] Parâmetro obrigatório: receitaBruta12Meses.');
            }
            return _chamarIMPOSTCritico('calcularFatorR', {
                folhaSalarios12Meses: dados.folhaSalarios12Meses || 0,
                receitaBruta12Meses: dados.receitaBruta12Meses
            }, 'Calculadora.calcularFatorR');
        }

        /**
         * Determina anexo usando IMPOST real. Sem fallback. Nunca hardcoda o anexo.
         *
         * @param {string} cnae — Código CNAE (ex: "62.01-5")
         * @param {number} [fatorR] — Valor do Fator R (decimal, ex: 0.30)
         * @returns {Object} Resultado de IMPOST.determinarAnexo
         * @throws {Error} se IMPOST ausente ou retornar null
         *
         * Base legal: Resolução CGSN 140/2018, Anexos VI e VII
         */
        function determinarAnexo(cnae, fatorR) {
            if (!cnae) throw new Error('[Calculadora.determinarAnexo] CNAE é obrigatório.');
            return _chamarIMPOSTCritico('determinarAnexo', {
                cnae: cnae, fatorR: fatorR || 0
            }, 'Calculadora.determinarAnexo');
        }

        /**
         * Calcula partilha de tributos usando IMPOST real.
         * Distribui o DAS entre: IRPJ, CSLL, COFINS, PIS/PASEP, CPP, ICMS/ISS.
         *
         * @param {number} dasValor — Valor total do DAS
         * @param {number} faixa — Faixa (1-6)
         * @param {string} anexo — Anexo (I a V)
         * @param {number} [receitaBrutaMensal] — Receita bruta mensal
         * @param {number} [aliquotaEfetiva] — Alíquota efetiva
         * @returns {Object} Partilha com { irpj, csll, cofins, pis, cpp, iss, icms, ipi }
         * @throws {Error} se IMPOST ausente
         *
         * Base legal: LC 123/2006, Art. 18; Resolução CGSN 140/2018
         */
        function calcularPartilhaTributos(dasValor, faixa, anexo, receitaBrutaMensal, aliquotaEfetiva) {
            if (!_IMPOST) {
                throw new Error('[Calculadora.calcularPartilhaTributos] IMPOST (simples_nacional.js) não carregado.');
            }
            if (typeof _IMPOST.calcularPartilhaTributos !== 'function') {
                throw new Error('[Calculadora.calcularPartilhaTributos] Função IMPOST.calcularPartilhaTributos não encontrada.');
            }
            var resultado = _IMPOST.calcularPartilhaTributos(dasValor, faixa, anexo, receitaBrutaMensal || 0, aliquotaEfetiva || 0);
            if (!resultado) {
                throw new Error('[Calculadora.calcularPartilhaTributos] IMPOST retornou null. Params: dasValor=' + dasValor
                    + ', faixa=' + faixa + ', anexo=' + anexo);
            }
            return resultado;
        }

        /**
         * Calcula consolidado anual com RBT12 dinâmico (cada mês recalcula RBT12).
         * Recebe array com dados dos 12 meses e retorna consolidado anual.
         *
         * @param {Array<Object>} meses — Array de objetos mensais (até 12)
         *   Cada objeto: { receitaBrutaMensal, folhaMensal, issRetidoFonte?, aliquotaRAT?, anexo? }
         * @param {Object} [opcoes] — { socios?, cnae?, tipoAtividade?, aliquotaRAT? }
         * @returns {Object} Resultado de IMPOST.calcularAnualConsolidado
         * @throws {Error} se IMPOST ausente ou retornar null
         *
         * Base legal: LC 123/2006; Resolução CGSN 140/2018
         */
        function calcularAnualConsolidado(meses, opcoes) {
            if (!Array.isArray(meses) || meses.length === 0) {
                throw new Error('[Calculadora.calcularAnualConsolidado] Array de meses é obrigatório (1 a 12 elementos).');
            }
            var opts = opcoes || {};
            return _chamarIMPOSTCritico('calcularAnualConsolidado', {
                meses: meses,
                socios: opts.socios,
                cnae: opts.cnae,
                tipoAtividade: opts.tipoAtividade,
                aliquotaRAT: opts.aliquotaRAT || 0.02
            }, 'Calculadora.calcularAnualConsolidado');
        }

        return {
            calcularTudo: calcularTudo,
            calcularFatorR: calcularFatorR,
            calcularDASRapido: calcularDASRapido,
            // Métodos individuais — chamam IMPOST diretamente, sem fallback
            calcularDASMensal: calcularDASMensal,
            calcularAliquotaEfetiva: calcularAliquotaEfetiva,
            calcularFatorRDireto: calcularFatorRDireto,
            determinarAnexo: determinarAnexo,
            calcularPartilhaTributos: calcularPartilhaTributos,
            calcularAnualConsolidado: calcularAnualConsolidado
        };
    })();


    // ═══════════════════════════════════════════════════════════════
    //  MÓDULO 8: DIAGNÓSTICO INTELIGENTE
    //  Motor de diagnóstico que analisa ~18 verificações automáticas
    //  e identifica oportunidades de economia com valor em R$
    //  Base legal: LC 123/2006; Resolução CGSN nº 140/2018
    // ═══════════════════════════════════════════════════════════════

    const Diagnostico = (function () {

        /** @type {Object|null} Último resultado do diagnóstico */
        let _ultimoDiagnostico = null;

        /**
         * Helper: obtém percentuais reais da partilha de tributos do IMPOST.
         * Retorna os percentuais de cada tributo dentro do DAS para um dado anexo/faixa.
         * @param {string} anexo — Anexo (I a V)
         * @param {number} faixa — Faixa (1-6), base 1
         * @returns {Object|null} { irpj, csll, cofins, pis, cpp, iss, icms, ipi } ou null
         * @private
         */
        function _obterPartilhaReal(anexo, faixa) {
            if (!_IMPOST || !_IMPOST.PARTILHA || !_IMPOST.PARTILHA[anexo]) return null;
            var faixaIdx = Math.max(0, (faixa || 1) - 1);
            var partilha = _IMPOST.PARTILHA[anexo];
            if (faixaIdx >= partilha.length) faixaIdx = partilha.length - 1;
            return partilha[faixaIdx] || null;
        }

        /**
         * Helper: calcula DAS mensal para parâmetros arbitrários (cenário).
         * @param {Object} params
         * @returns {number} Valor do DAS
         * @private
         */
        function _calcularDASCenario(receitaMensal, rbt12, anexo, folhaMensal) {
            var das = _chamarIMPOST('calcularDASMensal', {
                receitaBrutaMensal: receitaMensal,
                rbt12: rbt12,
                anexo: anexo,
                folhaMensal: folhaMensal || 0,
                issRetidoFonte: 0,
                aliquotaRAT: 0.02
            });
            return das ? (das.dasAPagar || das.dasValor || 0) : 0;
        }

        // ──────────────────────────────────────────
        //  VERIFICAÇÕES INDIVIDUAIS (cada uma retorna oportunidade ou null)
        // ──────────────────────────────────────────

        /**
         * V1: Fator R — Migração Anexo V → III
         */
        function _verificarFatorRMigracao(resultado, d) {
            if (!resultado.otimizacaoFatorR || !resultado.otimizacaoFatorR.aplicavel) return null;
            var otim = resultado.otimizacaoFatorR;
            if (otim.jaOtimizado) return null;

            // Calcular EXATAMENTE quanto de pró-labore adicional é necessário para FR = 28%
            var rbt12 = d.receitaBrutaAnual || (d.receitaBrutaMensal * 12);
            var folha12Atual = d.folhaAnual || (d.folhaMensal * 12);
            var folha12Necessaria = rbt12 * 0.28;
            var aumentoAnual = Math.max(0, folha12Necessaria - folha12Atual);
            var aumentoMensal = aumentoAnual / 12;

            // Calcular economia EXATA: DAS com Anexo V (atual) vs DAS com Anexo III (novo)
            var dasAnexoV = _calcularDASCenario(d.receitaBrutaMensal, rbt12, 'V', d.folhaMensal);
            var dasAnexoIII = _calcularDASCenario(d.receitaBrutaMensal, rbt12, 'III', d.folhaMensal + aumentoMensal);
            var economiaDASMensal = dasAnexoV - dasAnexoIII;
            var economiaDAS = economiaDASMensal * 12;

            // Custo do aumento: encargos sobre o pró-labore adicional
            var encargos = 0.300; // FGTS(8%) + INSS Patronal(20%) + RAT(2%) = 30% — use 0.358 para empresas com >3 func. (+Terceiros 5,8%)
            if (otim && otim.custoAumentoAnual) {
                // Se IMPOST já calculou, usar
                encargos = otim.custoAumentoAnual / (aumentoAnual || 1);
            }
            var custoAnual = aumentoAnual * (1 + encargos);
            var retornoLiq = economiaDAS - custoAnual;

            // Se IMPOST.otimizarFatorR forneceu dados melhores, usar esses
            if (otim.economiaLiquida != null && otim.economiaLiquida > 0) {
                retornoLiq = otim.economiaLiquida;
                custoAnual = otim.custoAumentoAnual || custoAnual;
                economiaDAS = otim.economiaDASAnual || economiaDAS;
            }

            if (retornoLiq <= 0 && !otim.valeAPena) return null;

            return {
                id: 'fator_r_migracao',
                titulo: 'Migrar do Anexo V para o Anexo III via Fator R',
                descricao: 'Aumentando a folha de pagamento (pró-labore) para que o Fator R atinja 28%, '
                    + 'a empresa passa do Anexo V (alíquotas mais altas) para o Anexo III (alíquotas menores).',
                economiaAnual: retornoLiq,
                economiaMensal: retornoLiq / 12,
                economiaBrutaAnual: economiaDAS,
                custoImplementacao: custoAnual,
                retornoLiquido: retornoLiq,
                dificuldade: 'media',
                tempoImplementacao: '1 mês',
                categoria: 'fator_r',
                acao: 'Aumentar folha de ' + Utils.formatarMoeda(d.folhaMensal || 0)
                    + ' para ' + Utils.formatarMoeda((d.folhaMensal || 0) + aumentoMensal)
                    + '/mês (+' + Utils.formatarMoeda(aumentoMensal) + ')',
                passoAPasso: [
                    '1. Calcular o valor exato de pró-labore necessário para Fator R ≥ 28%',
                    '2. Formalizar alteração no contrato social ou ata (se pró-labore de sócio)',
                    '3. Recolher INSS sobre o novo pró-labore (GPS ou DARF)',
                    '4. No mês seguinte, apurar PGDAS-D com o novo Fator R — o sistema já usará o Anexo III',
                    '5. Monitorar mensalmente para manter o Fator R acima de 28%'
                ],
                baseLegal: 'LC 123/2006, Art. 18, §24; Resolução CGSN 140/2018, Art. 18, §5º-J',
                riscos: 'Custo adicional de INSS (11% do segurado + 20% patronal se Anexo IV) sobre o pró-labore incrementado. '
                    + 'Se a receita crescer sem ajuste proporcional da folha, o Fator R pode cair abaixo de 28%.'
            };
        }

        /**
         * V2: Fator R — Zona de risco (25%-31%)
         */
        function _verificarFatorRZonaRisco(resultado, d) {
            var fr = resultado.fatorR;
            if (!fr || fr.valor == null) return null;
            if (fr.valor < 0.25 || fr.valor >= 0.31) return null;

            var regrasCnae = _CnaeMapeamento && _CnaeMapeamento.obterRegrasCNAE
                ? _CnaeMapeamento.obterRegrasCNAE(d.cnae, '') : null;
            if (!regrasCnae || !regrasCnae.fatorR) return null;

            var rbt12 = d.receitaBrutaAnual || (d.receitaBrutaMensal * 12);
            // Estimar impacto de cair para Anexo V vs manter no III
            var dasIII = _calcularDASCenario(d.receitaBrutaMensal, rbt12, 'III', d.folhaMensal);
            var dasV = _calcularDASCenario(d.receitaBrutaMensal, rbt12, 'V', d.folhaMensal);
            var diferencaMensal = Math.abs(dasV - dasIII);
            var diferencaAnual = diferencaMensal * 12;

            return {
                id: 'fator_r_zona_risco',
                titulo: 'Fator R na zona de risco (' + Utils.formatarPercentual(fr.valor) + ')',
                descricao: 'O Fator R está entre 25% e 31%, muito próximo do limiar de 28%. '
                    + 'Pequenas variações na receita ou folha podem mudar o anexo de III para V (ou vice-versa), '
                    + 'causando impacto de até ' + Utils.formatarMoeda(diferencaAnual) + '/ano.',
                economiaAnual: 0,
                economiaMensal: 0,
                riscoAnual: diferencaAnual,
                dificuldade: 'facil',
                tempoImplementacao: 'Imediato',
                categoria: 'fator_r',
                acao: 'Estabilizar o Fator R acima de 28% com margem de segurança',
                passoAPasso: [
                    '1. Monitorar mensalmente a relação folha/receita',
                    '2. Se necessário, ajustar pró-labore para manter margem de segurança (Fator R ≥ 30%)',
                    '3. Em meses de pico de receita, avaliar se a folha acompanha proporcionalmente',
                    '4. Considerar distribuir receita de forma mais uniforme ao longo do ano'
                ],
                baseLegal: 'LC 123/2006, Art. 18, §24; Resolução CGSN 140/2018, Art. 18, §5º-J e §5º-M',
                riscos: 'Variações sazonais de receita podem derrubar o Fator R abaixo de 28% e elevar o DAS mensalmente.'
            };
        }

        /**
         * V3: Segregação de receita monofásica
         */
        function _verificarMonofasico(resultado, d) {
            var receitaMono = d.receitaMonofasica || 0;
            if (receitaMono <= 0) return null;

            var rbt12 = d.receitaBrutaAnual || (d.receitaBrutaMensal * 12);
            var anexo = resultado.anexo ? resultado.anexo.anexo : 'III';

            // Calcular economia: PIS (0,65%) + COFINS (3%) zerados sobre a parcela monofásica
            // Na prática, depende da partilha dentro do DAS — usar IMPOST se disponível
            var ecoMono = _chamarIMPOST('calcularEconomiaMonofasica', {
                receitaBrutaMensal: d.receitaBrutaMensal,
                receitaMonofasica: receitaMono,
                rbt12: rbt12,
                anexo: anexo
            });

            var economiaMensal = ecoMono ? (ecoMono.economiaMensal || ecoMono.economia || 0) : 0;
            if (economiaMensal <= 0) {
                // Calcular PIS+COFINS zerados usando partilha REAL do IMPOST
                var faixa = resultado.aliquotaEfetiva ? resultado.aliquotaEfetiva.faixa : 1;
                var aliqEf = resultado.aliquotaEfetiva ? resultado.aliquotaEfetiva.valor : 0;
                var partReal = _obterPartilhaReal(anexo, faixa);
                if (partReal && aliqEf > 0) {
                    // Economia = receita monofásica × alíquota efetiva × (% PIS + % COFINS na partilha)
                    var partilhaPISCOFINS = (partReal.pis || 0) + (partReal.cofins || 0);
                    economiaMensal = receitaMono * aliqEf * partilhaPISCOFINS;
                } else {
                    // Último recurso se PARTILHA indisponível — 3,65% é PIS+COFINS cumulativo padrão
                    economiaMensal = receitaMono * 0.0365;
                }
            }

            if (economiaMensal <= 0) return null;

            return {
                id: 'segregacao_monofasica',
                titulo: 'Segregar receita de produtos monofásicos',
                descricao: 'Produtos monofásicos (farmácia, combustíveis, autopeças, bebidas, cosméticos) '
                    + 'já tiveram PIS e COFINS recolhidos pelo fabricante. Na revenda, essas contribuições '
                    + 'devem ser ZERADAS no PGDAS-D, reduzindo o DAS.',
                economiaAnual: economiaMensal * 12,
                economiaMensal: economiaMensal,
                custoImplementacao: 0,
                retornoLiquido: economiaMensal * 12,
                dificuldade: 'facil',
                tempoImplementacao: 'Próximo PGDAS-D',
                categoria: 'segregacao',
                acao: 'Classificar ' + Utils.formatarMoeda(receitaMono) + '/mês como receita monofásica no PGDAS-D',
                passoAPasso: [
                    '1. Identificar todos os produtos monofásicos vendidos (NCM e legislação específica)',
                    '2. Separar as receitas de revenda monofásica das demais',
                    '3. No PGDAS-D, marcar essas receitas como "Revenda de mercadorias sujeitas à tributação monofásica"',
                    '4. O sistema automaticamente zerará PIS e COFINS sobre essa parcela',
                    '5. Manter documentação dos NCMs e notas fiscais de compra como suporte'
                ],
                baseLegal: 'Lei 10.147/2000; Lei 10.865/2004; Resolução CGSN 140/2018, Art. 25-A',
                riscos: 'Se classificar incorretamente um produto como monofásico, haverá diferença de tributo. '
                    + 'Manter controle rigoroso dos NCMs.'
            };
        }

        /**
         * V4: Exportação — imunidade ICMS/PIS/COFINS
         */
        function _verificarExportacao(resultado, d) {
            var recExp = d.receitaExportacao || 0;
            if (recExp <= 0) return null;

            var rbt12 = d.receitaBrutaAnual || (d.receitaBrutaMensal * 12);
            var aliqEf = resultado.aliquotaEfetiva ? resultado.aliquotaEfetiva.valor : 0;
            var faixa = resultado.aliquotaEfetiva ? resultado.aliquotaEfetiva.faixa : 1;
            var anexo = resultado.anexo ? resultado.anexo.anexo : 'III';

            // Usar partilha REAL do IMPOST: exportação zera ICMS, PIS, COFINS, IPI, ISS
            var economiaMensal = 0;
            var partReal = _obterPartilhaReal(anexo, faixa);
            if (partReal && aliqEf > 0) {
                var percentualImune = (partReal.icms || 0) + (partReal.pis || 0) + (partReal.cofins || 0)
                    + (partReal.ipi || 0) + (partReal.iss || 0);
                economiaMensal = recExp * aliqEf * percentualImune;
            } else {
                // Fallback conservador somente se PARTILHA indisponível
                economiaMensal = recExp * aliqEf * 0.45;
            }

            if (economiaMensal <= 0) return null;

            return {
                id: 'exportacao_imunidade',
                titulo: 'Imunidade tributária sobre receita de exportação',
                descricao: 'Receitas de exportação são imunes de ICMS, PIS e COFINS. '
                    + 'Essa parcela deve ser segregada no PGDAS-D para reduzir o DAS.',
                economiaAnual: economiaMensal * 12,
                economiaMensal: economiaMensal,
                custoImplementacao: 0,
                retornoLiquido: economiaMensal * 12,
                dificuldade: 'facil',
                tempoImplementacao: 'Próximo PGDAS-D',
                categoria: 'segregacao',
                acao: 'Segregar ' + Utils.formatarMoeda(recExp) + '/mês como receita de exportação no PGDAS-D',
                passoAPasso: [
                    '1. Identificar todas as receitas de exportação (notas fiscais com CFOP de exportação)',
                    '2. No PGDAS-D, informar separadamente a receita de exportação',
                    '3. O sistema zerará ICMS, PIS e COFINS sobre essa parcela',
                    '4. Manter Registro de Exportação (RE) e DU-E como suporte documental'
                ],
                baseLegal: 'CF/1988, Art. 153, §3º, III; LC 123/2006, Art. 18, §14; Resolução CGSN 140/2018, Art. 25, §8º',
                riscos: 'Exportação indireta (via trading) deve ter documentação correta para fruição da imunidade.'
            };
        }

        /**
         * V5: ISS retido na fonte — dedução do DAS
         */
        function _verificarISSRetido(resultado, d) {
            var issRetido = d.issRetidoFonte || 0;
            if (issRetido <= 0) return null;

            return {
                id: 'iss_retido_deducao',
                titulo: 'Deduzir ISS retido na fonte do DAS',
                descricao: 'Quando o tomador do serviço retém o ISS na fonte, esse valor deve ser '
                    + 'deduzido do DAS no PGDAS-D, evitando pagamento em duplicidade.',
                economiaAnual: issRetido * 12,
                economiaMensal: issRetido,
                custoImplementacao: 0,
                retornoLiquido: issRetido * 12,
                dificuldade: 'facil',
                tempoImplementacao: 'Próximo PGDAS-D',
                categoria: 'iss',
                acao: 'Informar ISS retido de ' + Utils.formatarMoeda(issRetido) + '/mês no PGDAS-D',
                passoAPasso: [
                    '1. Verificar nas notas fiscais quais tomadores retiveram ISS',
                    '2. No PGDAS-D, informar o valor do ISS retido na fonte',
                    '3. O sistema deduzirá automaticamente do DAS a pagar',
                    '4. Manter comprovantes de retenção (notas fiscais e recibos)'
                ],
                baseLegal: 'LC 116/2003, Art. 6º; Resolução CGSN 140/2018, Art. 27',
                riscos: 'Se o ISS informado como retido não corresponder à retenção real, haverá diferença.'
            };
        }

        /**
         * V6: ISS municipal reduzido
         */
        function _verificarISSMunicipal(resultado, d) {
            var issAtual = d.issAliquota || 5.00;
            if (issAtual >= 5.00) {
                // Verificar se o município tem alíquota menor que 5%
                var mun = DadosMunicipio.getMunicipioAtual();
                if (!mun || !mun.iss || !mun.iss.issConhecido) {
                    return {
                        id: 'iss_municipal_verificar',
                        titulo: 'Verificar alíquota real de ISS do município',
                        descricao: 'O sistema está usando a alíquota padrão de 5%. Muitos municípios têm '
                            + 'alíquotas menores (entre 2% e 5%). Usar a alíquota correta reduz o DAS.',
                        economiaAnual: 0,
                        economiaMensal: 0,
                        dificuldade: 'facil',
                        tempoImplementacao: 'Imediato',
                        categoria: 'iss',
                        tipo: 'investigar',
                        acao: 'Consultar a legislação do município para identificar a alíquota ISS real do CNAE',
                        passoAPasso: [
                            '1. Consultar a legislação tributária municipal (site da prefeitura)',
                            '2. Identificar a alíquota de ISS para o código de serviço correspondente ao CNAE',
                            '3. Se for menor que 5%, atualizar no PGDAS-D',
                            '4. Ajustar o campo ISS neste sistema para recalcular a economia'
                        ],
                        baseLegal: 'LC 116/2003, Art. 8-A (mínimo 2%); Art. 8, II (máximo 5%)',
                        riscos: 'Nenhum — usar a alíquota correta é uma obrigação, não uma estratégia.'
                    };
                }
                return null;
            }
            return null;
        }

        /**
         * V7: ICMS-ST — substituição tributária
         */
        function _verificarICMS_ST(resultado, d) {
            var recST = d.receitaICMS_ST || 0;
            if (recST <= 0) return null;

            var aliqEf = resultado.aliquotaEfetiva ? resultado.aliquotaEfetiva.valor : 0;
            var faixa = resultado.aliquotaEfetiva ? resultado.aliquotaEfetiva.faixa : 1;
            var anexo = resultado.anexo ? resultado.anexo.anexo : 'I';

            // Usar partilha REAL do IMPOST para obter percentual de ICMS dentro do DAS
            var economiaMensal = 0;
            var partReal = _obterPartilhaReal(anexo, faixa);
            if (partReal && aliqEf > 0) {
                economiaMensal = recST * aliqEf * (partReal.icms || 0);
            } else {
                economiaMensal = recST * aliqEf * 0.335;
            }

            if (economiaMensal <= 0) return null;

            return {
                id: 'icms_st_segregacao',
                titulo: 'Segregar receita com ICMS por Substituição Tributária',
                descricao: 'Produtos com ICMS-ST já tiveram o ICMS recolhido antecipadamente pelo fabricante ou importador. '
                    + 'Essa receita deve ser segregada no PGDAS-D para zerar o ICMS no DAS.',
                economiaAnual: economiaMensal * 12,
                economiaMensal: economiaMensal,
                custoImplementacao: 0,
                retornoLiquido: economiaMensal * 12,
                dificuldade: 'facil',
                tempoImplementacao: 'Próximo PGDAS-D',
                categoria: 'segregacao',
                acao: 'Segregar ' + Utils.formatarMoeda(recST) + '/mês como receita com ICMS-ST no PGDAS-D',
                passoAPasso: [
                    '1. Identificar produtos com ICMS recolhido por substituição tributária (notas de compra)',
                    '2. Classificar a receita de revenda desses produtos separadamente',
                    '3. No PGDAS-D, informar como "Revenda de mercadorias com substituição tributária de ICMS"',
                    '4. O ICMS será zerado sobre essa parcela no DAS'
                ],
                baseLegal: 'LC 123/2006, Art. 18, §4º-A, I; Resolução CGSN 140/2018, Art. 25, §1º',
                riscos: 'Classificação incorreta pode gerar cobrança retroativa de ICMS.'
            };
        }

        /**
         * V8: Locação de bens móveis — ISS não incide
         */
        function _verificarLocacaoBensMoveis(resultado, d) {
            var recLocacao = d.receitaLocacaoBensMoveis || 0;
            if (recLocacao <= 0) return null;

            var aliqEf = resultado.aliquotaEfetiva ? resultado.aliquotaEfetiva.valor : 0;
            var faixa = resultado.aliquotaEfetiva ? resultado.aliquotaEfetiva.faixa : 1;
            var anexo = resultado.anexo ? resultado.anexo.anexo : 'III';

            // Usar partilha REAL do IMPOST para obter percentual de ISS dentro do DAS
            var economiaMensal = 0;
            var partReal = _obterPartilhaReal(anexo, faixa);
            if (partReal && aliqEf > 0) {
                economiaMensal = recLocacao * aliqEf * (partReal.iss || 0);
            } else {
                economiaMensal = recLocacao * aliqEf * 0.15;
            }

            if (economiaMensal <= 0) return null;

            return {
                id: 'locacao_bens_moveis',
                titulo: 'Segregar receita de locação de bens móveis (ISS não incide)',
                descricao: 'A locação de bens móveis não constitui prestação de serviço, portanto o ISS não incide '
                    + '(Súmula Vinculante 31 do STF). Essa receita deve ser segregada no PGDAS-D.',
                economiaAnual: economiaMensal * 12,
                economiaMensal: economiaMensal,
                custoImplementacao: 0,
                retornoLiquido: economiaMensal * 12,
                dificuldade: 'facil',
                tempoImplementacao: 'Próximo PGDAS-D',
                categoria: 'segregacao',
                acao: 'Segregar ' + Utils.formatarMoeda(recLocacao) + '/mês como locação de bens móveis no PGDAS-D',
                passoAPasso: [
                    '1. Identificar contratos de locação de bens móveis (equipamentos, veículos, etc.)',
                    '2. Emitir nota fiscal específica para locação (não confundir com prestação de serviço)',
                    '3. No PGDAS-D, segregar essa receita — ISS será zerado',
                    '4. Manter contratos de locação como suporte documental'
                ],
                baseLegal: 'Súmula Vinculante 31/STF; LC 116/2003, Lista de Serviços',
                riscos: 'Se a operação tiver componente de serviço junto à locação, o fisco pode questionar.'
            };
        }

        /**
         * V9: Sublimite estadual
         */
        function _verificarSublimite(resultado, d) {
            var rbt12 = d.receitaBrutaAnual || (d.receitaBrutaMensal * 12);
            if (rbt12 <= 3600000) return null;
            if (rbt12 > 4800000) return null;

            var estadoAtual = DadosEstado.getEstadoAtual();
            var nomeEstado = estadoAtual ? estadoAtual.nome : d.uf;

            // Calcular impacto real: quanto de ICMS + ISS sairia do DAS
            var aliqEf = resultado.aliquotaEfetiva ? resultado.aliquotaEfetiva.valor : 0;
            var faixa = resultado.aliquotaEfetiva ? resultado.aliquotaEfetiva.faixa : 1;
            var anexo = resultado.anexo ? resultado.anexo.anexo : 'I';
            var impactoMensal = 0;
            var partReal = _obterPartilhaReal(anexo, faixa);
            if (partReal && aliqEf > 0) {
                var percICMSISS = (partReal.icms || 0) + (partReal.iss || 0);
                // A parcela ICMS+ISS sai do DAS mas deve ser paga nas regras normais
                impactoMensal = d.receitaBrutaMensal * aliqEf * percICMSISS;
            }
            // Estimar custo fora do DAS (ICMS normal ~18%, ISS ~5% sobre serviços)
            var icmsNormal = estadoAtual && estadoAtual.icms ? (estadoAtual.icms.padrao || 0.18) : 0.18;
            var issNormal = (d.issAliquota || 5) / 100;
            var custoForaDAS = d.receitaBrutaMensal * Math.max(icmsNormal, issNormal) * 0.3; // Estimativa conservadora

            return {
                id: 'sublimite_estadual',
                titulo: 'Receita excede sublimite — ICMS e ISS por fora do DAS',
                descricao: 'A receita bruta anual de ' + Utils.formatarMoeda(rbt12)
                    + ' excede o sublimite de R$ 3.600.000 (' + nomeEstado + '). '
                    + 'O ICMS e o ISS passam a ser recolhidos por FORA do DAS, nas regras normais. '
                    + 'Parcela ICMS+ISS dentro do DAS era de ~' + Utils.formatarMoeda(impactoMensal) + '/mês.',
                economiaAnual: 0,
                economiaMensal: 0,
                impactoEstimadoMensal: custoForaDAS,
                impactoEstimadoAnual: custoForaDAS * 12,
                dificuldade: 'dificil',
                tempoImplementacao: 'Automático',
                categoria: 'sublimite',
                tipo: 'alerta',
                acao: 'Avaliar impacto do ICMS/ISS por fora do DAS no fluxo de caixa',
                passoAPasso: [
                    '1. Calcular o ICMS e ISS que serão devidos pelas regras normais (fora do DAS)',
                    '2. Verificar se há incentivos estaduais que reduzam o ICMS',
                    '3. Avaliar impactos do recolhimento separado de ICMS/ISS acima do sublimite',
                    '4. Preparar obrigações acessórias adicionais (SPED, EFD, etc.)'
                ],
                baseLegal: 'LC 123/2006, Art. 19; Resolução CGSN 140/2018, Art. 9º a 12',
                riscos: 'Custo total pode ser significativamente maior. Avaliar migração de regime.'
            };
        }

        /**
         * V10: MEI como alternativa
         */
        function _verificarMEI(resultado, d) {
            var rbt12 = d.receitaBrutaAnual || (d.receitaBrutaMensal * 12);
            if (rbt12 <= 0 || rbt12 > 81000) return null;
            if (d.socios && d.socios.length > 1) return null;

            var dasMensal = resultado.dasMensal ? resultado.dasMensal.semOtimizacao.valor : 0;

            // Calcular DAS MEI real usando IMPOST se disponível
            var meiMensal = DAS_MEI_2026;
            var tipoAtivMEI = 'comercio_servicos';
            var anexoAtual = resultado.anexo ? resultado.anexo.anexo : null;
            if (anexoAtual === 'I') tipoAtivMEI = 'comercio';
            else if (anexoAtual === 'II') tipoAtivMEI = 'comercio'; // indústria → comércio no MEI
            else if (anexoAtual === 'III' || anexoAtual === 'IV' || anexoAtual === 'V') tipoAtivMEI = 'servicos';

            var meiCalc = _chamarIMPOST('calcularDASMEI', tipoAtivMEI);
            if (!meiCalc && _IMPOST && typeof _IMPOST.calcularDASMEI === 'function') {
                // Tentar com parâmetros posicionais: (tipoAtividade, salarioMinimo)
                try { meiCalc = _IMPOST.calcularDASMEI(tipoAtivMEI, SALARIO_MINIMO_2026); } catch (e) {}
            }
            if (meiCalc && meiCalc.dasTotal) {
                meiMensal = meiCalc.dasTotal;
            } else if (_IMPOST && _IMPOST.MEI && _IMPOST.MEI.recolhimentoFixoMensal) {
                // Buscar nos dados estáticos do MEI
                var valMEI = _IMPOST.MEI.recolhimentoFixoMensal.valoresMensais2026;
                if (valMEI) {
                    if (tipoAtivMEI === 'comercio' && valMEI.apenasComercioIndustria) meiMensal = valMEI.apenasComercioIndustria.total;
                    else if (tipoAtivMEI === 'servicos' && valMEI.apenasServicos) meiMensal = valMEI.apenasServicos.total;
                    else if (valMEI.comercioEServicos) meiMensal = valMEI.comercioEServicos.total;
                }
            }

            var economiaMensal = dasMensal - meiMensal;
            if (economiaMensal <= 0) return null;

            return {
                id: 'mei_alternativa',
                titulo: 'Receita compatível com MEI',
                descricao: 'Com receita anual de ' + Utils.formatarMoeda(rbt12) + ' e até 1 sócio, '
                    + 'sua receita permite enquadramento como MEI, com custo fixo mensal de '
                    + Utils.formatarMoeda(meiMensal) + ' (vs. DAS de '
                    + Utils.formatarMoeda(dasMensal) + '). Consulte seu contador sobre esta possibilidade.',
                economiaAnual: economiaMensal * 12,
                economiaMensal: economiaMensal,
                custoImplementacao: 0,
                retornoLiquido: economiaMensal * 12,
                dificuldade: 'informativo',
                tempoImplementacao: '1-2 meses',
                categoria: 'mei',
                acao: 'Consulte seu contador sobre a possibilidade de enquadramento como MEI',
                passoAPasso: [
                    '1. Verificar se o CNAE permite enquadramento como MEI (consultar Portal do Empreendedor)',
                    '2. Avaliar limitações do MEI: máximo 1 empregado, atividades restritas',
                    '3. O DAS fixo do MEI em 2026 é de ' + Utils.formatarMoeda(meiMensal) + '/mês',
                    '4. Limite de receita: R$ 81.000/ano'
                ],
                baseLegal: 'LC 123/2006, Art. 18-A; Resolução CGSN 140/2018, Seção V',
                riscos: 'MEI tem limitações: máximo 1 empregado, atividades restritas, contribuição ao INSS '
                    + 'sobre 1 salário mínimo (aposentadoria limitada).'
            };
        }

        /**
         * V11: Pró-labore × Distribuição de lucros
         */
        function _verificarProLabore(resultado, d) {
            var proLabore = d.proLabore || 0;
            if (proLabore <= 0) return null;

            var salarioMinimo2026 = SALARIO_MINIMO_2026;
            if (proLabore <= salarioMinimo2026 * 1.1) return null; // Já está otimizado

            var dist = resultado.distribuicaoLucros;
            if (!dist || dist.lucroDistribuivel <= 0) return null;

            // Economia: reduzir pró-labore para 1 SM e distribuir a diferença como lucro isento
            var reducao = proLabore - salarioMinimo2026;
            // INSS do sócio: 11% contribuinte obrigatório
            var economiaINSS = reducao * 0.11;
            // Se Anexo IV, tem CPP patronal por fora: 20%
            var anexo = resultado.anexo ? resultado.anexo.anexo : 'III';
            var economiaCPP = (anexo === 'IV') ? (reducao * 0.20) : 0;
            var economiaMensal = economiaINSS + economiaCPP;

            if (economiaMensal <= 50) return null; // Muito pequena para recomendar

            // Multiplicar por número de sócios
            var numSocios = Math.max(1, (d.socios || []).length);
            var economiaTotal = economiaMensal * numSocios;

            return {
                id: 'prolabore_otimizar',
                titulo: 'Reduzir pró-labore e distribuir como lucro isento',
                descricao: 'O pró-labore atual de ' + Utils.formatarMoeda(proLabore) + ' está acima do necessário. '
                    + 'Reduzindo para ' + Utils.formatarMoeda(salarioMinimo2026) + ' (1 salário mínimo) '
                    + 'e distribuindo a diferença como lucro isento, economiza-se INSS.',
                economiaAnual: economiaTotal * 12,
                economiaMensal: economiaTotal,
                custoImplementacao: 0,
                retornoLiquido: economiaTotal * 12,
                dificuldade: 'facil',
                tempoImplementacao: '1 mês',
                categoria: 'prolabore',
                acao: 'Reduzir pró-labore para R$ ' + Utils.formatarMoeda(salarioMinimo2026)
                    + ' e distribuir ' + Utils.formatarMoeda(reducao) + '/mês como lucro isento',
                passoAPasso: [
                    '1. Definir novo pró-labore no valor de 1 salário mínimo (R$ ' + salarioMinimo2026.toLocaleString('pt-BR') + ')',
                    '2. Atualizar contrato social ou ata de assembleia com o novo valor',
                    '3. O valor excedente pode ser distribuído como lucro isento (LC 123/2006, Art. 14)',
                    '4. Recolher INSS apenas sobre o novo pró-labore',
                    '5. ATENÇÃO: Se o CNAE depende do Fator R, verifique se a redução não prejudica o Fator R'
                ],
                baseLegal: 'LC 123/2006, Art. 14; ADI SRF 04/2007; IN RFB 1.251/2012',
                riscos: 'A RFB pode questionar pró-labore muito baixo se houver evidência de remuneração disfarçada. '
                    + 'Reduzir o pró-labore também reduz o Fator R — se o CNAE depende do Fator R, avaliar o impacto cruzado.'
            };
        }

        /**
         * V12: Regime de caixa
         */
        function _verificarRegimeCaixa(resultado, d) {
            // Regime de caixa é vantajoso quando há alta inadimplência ou prazo longo de recebimento
            // Como não temos dado de inadimplência, apenas informamos a possibilidade
            var rbt12 = d.receitaBrutaAnual || (d.receitaBrutaMensal * 12);
            if (rbt12 <= 0) return null;

            return {
                id: 'regime_caixa',
                titulo: 'Avaliar opção pelo regime de caixa no PGDAS-D',
                descricao: 'No regime de caixa, o DAS é calculado sobre a receita RECEBIDA (e não faturada). '
                    + 'Se a empresa tem vendas a prazo, inadimplência ou sazonalidade de recebimentos, '
                    + 'o regime de caixa pode postergar o pagamento do tributo.',
                economiaAnual: 0,
                economiaMensal: 0,
                dificuldade: 'media',
                tempoImplementacao: 'Início do ano-calendário',
                categoria: 'regime',
                tipo: 'investigar',
                acao: 'Avaliar se o regime de caixa é mais vantajoso para o fluxo de caixa da empresa',
                passoAPasso: [
                    '1. Levantar prazo médio de recebimento e taxa de inadimplência',
                    '2. Comparar o fluxo de DAS no regime de competência vs regime de caixa',
                    '3. A opção pelo regime de caixa deve ser feita no início do ano-calendário via PGDAS-D',
                    '4. Uma vez optado, vale para o ano inteiro (não pode trocar mês a mês)'
                ],
                baseLegal: 'Resolução CGSN 140/2018, Art. 16 a 19',
                riscos: 'O regime de caixa exige escrituração contábil mais detalhada. '
                    + 'Se a empresa recebe tudo à vista, não há benefício.'
            };
        }

        /**
         * V13: Atividade mista (múltiplos anexos)
         */
        function _verificarAtividadeMista(resultado, d) {
            var ativSecundarias = d.atividadeSecundaria || [];
            if (ativSecundarias.length === 0) return null;

            return {
                id: 'atividade_mista',
                titulo: 'Segregar receitas por atividade (múltiplos anexos)',
                descricao: 'A empresa possui atividades secundárias que podem ser tributadas em anexos diferentes. '
                    + 'Segregar corretamente as receitas por anexo pode resultar em alíquotas menores para parte do faturamento.',
                economiaAnual: 0,
                economiaMensal: 0,
                dificuldade: 'media',
                tempoImplementacao: 'Próximo PGDAS-D',
                categoria: 'segregacao',
                tipo: 'investigar',
                acao: 'Classificar cada receita pela atividade (CNAE) correspondente no PGDAS-D',
                passoAPasso: [
                    '1. Mapear cada CNAE secundário ao respectivo anexo do Simples Nacional',
                    '2. Separar as receitas mensais por atividade/CNAE',
                    '3. No PGDAS-D, informar cada parcela de receita com o anexo correto',
                    '4. Se alguma atividade for do Anexo I ou II (comércio/indústria), as alíquotas serão menores'
                ],
                baseLegal: 'Resolução CGSN 140/2018, Art. 25, §1º a §3º',
                riscos: 'Segregação incorreta pode gerar autuação. Cada receita deve corresponder à atividade efetivamente exercida.'
            };
        }

        /**
         * V14: CPP no Anexo IV
         */
        function _verificarCPPAnexoIV(resultado, d) {
            var anexo = resultado.anexo ? resultado.anexo.anexo : null;
            if (anexo !== 'IV') return null;

            var folha = d.folhaMensal || 0;
            var cppMensal = folha * 0.22; // 20% patronal + 2% RAT

            return {
                id: 'cpp_anexo_iv',
                titulo: 'CPP por fora do DAS — Planejar custo adicional (Anexo IV)',
                descricao: 'No Anexo IV, a CPP (INSS patronal de 20% + RAT de ~2%) NÃO está incluída no DAS '
                    + 'e deve ser recolhida por fora via GPS/DARF. Custo estimado: ' + Utils.formatarMoeda(cppMensal) + '/mês.',
                economiaAnual: 0,
                economiaMensal: 0,
                custoAdicionalMensal: cppMensal,
                custoAdicionalAnual: cppMensal * 12,
                dificuldade: 'facil',
                tempoImplementacao: 'Mensal',
                categoria: 'cpp',
                tipo: 'alerta',
                acao: 'Incluir CPP de ' + Utils.formatarMoeda(cppMensal) + '/mês no planejamento financeiro',
                passoAPasso: [
                    '1. Calcular CPP mensal: (folha total × 20%) + (folha total × 2% RAT)',
                    '2. Recolher via GPS (ou DARF eSocial) até o dia 20 do mês seguinte',
                    '3. Declarar na GFIP/eSocial',
                    '4. Incluir esse custo no DRE e no fluxo de caixa'
                ],
                baseLegal: 'LC 123/2006, Art. 18, §5º-C; Lei 8.212/1991, Art. 22',
                riscos: 'O não recolhimento da CPP gera multa e juros, além de impedir certidão negativa.'
            };
        }

        /**
         * V15: Multas por atraso
         */
        function _verificarMultasAtraso(resultado, d) {
            if (!d.debitosFiscaisPendentes) return null;

            return {
                id: 'multas_atraso',
                titulo: 'URGENTE — Regularizar débitos fiscais pendentes',
                descricao: 'A empresa possui débitos fiscais pendentes, o que pode gerar exclusão do Simples Nacional '
                    + 'e multas crescentes. A multa moratória do DAS é de 0,33% ao dia, limitada a 20% '
                    + '(Resolução CGSN nº 183/2025).',
                economiaAnual: 0,
                economiaMensal: 0,
                dificuldade: 'facil',
                tempoImplementacao: 'Imediato',
                categoria: 'regularizacao',
                tipo: 'urgente',
                acao: 'Regularizar todos os débitos pendentes via PGDAS-D ou parcelamento',
                passoAPasso: [
                    '1. Consultar débitos pendentes no e-CAC ou Portal do Simples Nacional',
                    '2. Verificar se é possível parcelamento (até 60 parcelas para débitos do Simples)',
                    '3. Pagar ou parcelar todos os débitos pendentes',
                    '4. Monitorar para evitar novos atrasos',
                    '5. Se já recebeu termo de exclusão, regularizar dentro do prazo de 30 dias'
                ],
                baseLegal: 'Resolução CGSN nº 183/2025; LC 123/2006, Art. 17, V; Art. 29 a 33',
                riscos: 'Exclusão do Simples Nacional por inadimplência. Multa e juros crescentes.'
            };
        }

        /**
         * V16: Dividendos 2026 — Lei 15.270/2025
         */
        function _verificarDividendos2026(resultado, d) {
            if (!resultado.dividendos2026) return null;
            var div = resultado.dividendos2026;
            if (!div.impacto && !div.temImpacto) return null;

            return {
                id: 'dividendos_2026',
                titulo: 'Impacto da nova tributação de dividendos (Lei 15.270/2025)',
                descricao: 'A Lei 15.270/2025 pode impor retenção de IRRF sobre dividendos que excedam '
                    + 'determinados limites. Avaliar o impacto na distribuição de lucros da empresa.',
                economiaAnual: 0,
                economiaMensal: 0,
                dificuldade: 'media',
                tempoImplementacao: '1-3 meses',
                categoria: 'dividendos',
                tipo: 'alerta',
                acao: 'Avaliar se o volume de distribuição de lucros será impactado pela nova lei',
                passoAPasso: [
                    '1. Calcular o lucro distribuível anual da empresa',
                    '2. Verificar se excede os limites de isenção da Lei 15.270/2025',
                    '3. Se sim, calcular o IRRF retido e o impacto líquido para cada sócio',
                    '4. Avaliar estratégias: antecipar distribuição, ajustar pró-labore, etc.'
                ],
                baseLegal: 'Lei 15.270/2025; LC 123/2006, Art. 14',
                riscos: 'Mudanças legislativas podem alterar limites e alíquotas. Acompanhar regulamentação.'
            };
        }

        /**
         * V17: Incentivos regionais (SUDAM/SUDENE)
         */
        function _verificarIncentivosRegionais(resultado, d) {
            var estadoAtual = DadosEstado.getEstadoAtual();
            if (!estadoAtual || !estadoAtual.incentivos) return null;
            var inc = estadoAtual.incentivos;
            if (!inc.sudam && !inc.sudene && !inc.zfm) return null;

            var tipo = inc.sudam ? 'SUDAM' : (inc.sudene ? 'SUDENE' : 'ZFM');

            return {
                id: 'incentivos_regionais',
                titulo: 'Incentivos regionais disponíveis (' + tipo + ')',
                descricao: 'O estado ' + (estadoAtual.nome || d.uf) + ' está na área de atuação da ' + tipo
                    + '. Empresas em outros regimes tributários podem obter redução de até 75% no IRPJ. '
                    + 'Consulte seu contador para avaliar se essa possibilidade se aplica ao seu caso.',
                economiaAnual: 0,
                economiaMensal: 0,
                dificuldade: 'dificil',
                tempoImplementacao: '3-6 meses',
                categoria: 'incentivos',
                tipo: 'informativo',
                acao: 'Consultar contador sobre incentivos regionais ' + tipo,
                passoAPasso: [
                    '1. Verificar se a atividade da empresa se enquadra nos setores incentivados pela ' + tipo,
                    '2. Consultar contador sobre a viabilidade e requisitos de habilitação',
                    '3. Avaliar o custo-benefício considerando obrigações acessórias adicionais',
                    '4. Se vantajoso, iniciar procedimento de habilitação junto à ' + tipo
                ],
                baseLegal: inc.baseLegal || 'Lei 12.715/2012, Art. 1°; MP 2.199-14/2001',
                riscos: 'Incentivos regionais normalmente se aplicam a empresas no Lucro Real, que exige '
                    + 'contabilidade completa e obrigações acessórias mais pesadas (SPED, EFD).'
            };
        }

        /**
         * V18: Reforma Tributária
         */
        function _verificarReformaTributaria(resultado, d) {
            if (!_IMPOST || !_IMPOST.REFORMA_TRIBUTARIA_SIMPLES) return null;
            var reforma = _IMPOST.REFORMA_TRIBUTARIA_SIMPLES;

            return {
                id: 'reforma_tributaria',
                titulo: 'Impactos da Reforma Tributária (EC 132/2023)',
                descricao: 'A Reforma Tributária (transição 2026-2033) mantém o Simples Nacional com tratamento '
                    + 'diferenciado, mas introduz mudanças na compensação de créditos tributários '
                    + 'e na relação com clientes optantes pelo regime regular (IBS/CBS).',
                economiaAnual: 0,
                economiaMensal: 0,
                dificuldade: 'dificil',
                tempoImplementacao: 'Longo prazo (2026-2033)',
                categoria: 'reforma',
                tipo: 'informativo',
                acao: 'Acompanhar a regulamentação e preparar a empresa para a transição',
                passoAPasso: [
                    '1. Acompanhar a regulamentação complementar da EC 132/2023',
                    '2. Avaliar se a opção de recolher IBS/CBS "por fora" (regime normal) será vantajosa',
                    '3. Entender o impacto na competitividade junto a clientes do Lucro Real',
                    '4. Preparar sistemas e processos para a transição gradual'
                ],
                baseLegal: 'EC 132/2023; LC 214/2025; LC 227/2026',
                riscos: 'A legislação complementar ainda está em formação. Cenários podem mudar.'
            };
        }

        /**
         * Executa TODAS as verificações e retorna diagnóstico completo.
         * Requer que Calculadora.calcularTudo() tenha sido executado antes.
         *
         * @param {Object} [resultadoCalculo] — resultado de calcularTudo (opcional, busca automaticamente)
         * @returns {Object} Diagnóstico completo
         */
        function executar(resultadoCalculo) {
            var t0 = Date.now();
            var resultado = resultadoCalculo || Calculadora.calcularTudo();
            var d = Formulario.getDados();

            var oportunidades = [];
            var alertas = [];
            var informativos = [];

            // Lista de todas as verificações
            var verificacoes = [
                _verificarFatorRMigracao,
                _verificarFatorRZonaRisco,
                _verificarMonofasico,
                _verificarExportacao,
                _verificarISSRetido,
                _verificarISSMunicipal,
                _verificarICMS_ST,
                _verificarLocacaoBensMoveis,
                _verificarSublimite,
                _verificarMEI,
                _verificarProLabore,
                _verificarRegimeCaixa,
                _verificarAtividadeMista,
                _verificarCPPAnexoIV,
                _verificarMultasAtraso,
                _verificarDividendos2026,
                _verificarIncentivosRegionais,
                _verificarReformaTributaria
            ];

            verificacoes.forEach(function (fn) {
                try {
                    var res = fn(resultado, d);
                    if (!res) return;

                    if (res.tipo === 'alerta' || res.tipo === 'urgente') {
                        alertas.push(res);
                    } else if (res.tipo === 'informativo' || res.tipo === 'investigar' || res.tipo === 'remeter_comparacao') {
                        informativos.push(res);
                    } else {
                        oportunidades.push(res);
                    }
                } catch (e) {
                    console.warn('[SimplesEstudoCompleto.Diagnostico] Erro na verificação:', e.message);
                }
            });

            // Ordenar oportunidades por economia anual (decrescente)
            oportunidades.sort(function (a, b) { return (b.economiaAnual || 0) - (a.economiaAnual || 0); });

            // Numerar ranking
            oportunidades.forEach(function (op, i) { op.ranking = i + 1; });

            // Calcular economia total
            var economiaTotalAnual = 0;
            var economiaTotalMensal = 0;
            oportunidades.forEach(function (op) {
                economiaTotalAnual += (op.retornoLiquido || op.economiaAnual || 0);
                economiaTotalMensal += (op.economiaMensal || 0);
            });

            _ultimoDiagnostico = {
                oportunidades: oportunidades,
                alertas: alertas,
                informativos: informativos,
                economiaTotal: {
                    anual: economiaTotalAnual,
                    mensal: economiaTotalMensal,
                    anualFormatada: Utils.formatarMoeda(economiaTotalAnual),
                    mensalFormatada: Utils.formatarMoeda(economiaTotalMensal)
                },
                totalVerificacoes: verificacoes.length,
                oportunidadesEncontradas: oportunidades.length,
                alertasEncontrados: alertas.length,
                informativosEncontrados: informativos.length,
                _meta: {
                    executadoEm: new Date().toISOString(),
                    tempoExecucao: (Date.now() - t0) + 'ms'
                }
            };

            // Emitir evento
            Eventos.emit('diagnostico:concluido', _ultimoDiagnostico);

            return _ultimoDiagnostico;
        }

        /**
         * Retorna ranking de oportunidades do último diagnóstico.
         * @returns {Array}
         */
        function getOportunidades() {
            return _ultimoDiagnostico ? _ultimoDiagnostico.oportunidades : [];
        }

        /**
         * Retorna alertas do último diagnóstico.
         * @returns {Array}
         */
        function getAlertas() {
            return _ultimoDiagnostico ? _ultimoDiagnostico.alertas : [];
        }

        /**
         * Retorna último diagnóstico completo.
         * @returns {Object|null}
         */
        function getUltimoDiagnostico() {
            return _ultimoDiagnostico;
        }

        return {
            executar: executar,
            getOportunidades: getOportunidades,
            getAlertas: getAlertas,
            getUltimoDiagnostico: getUltimoDiagnostico
        };
    })();


    // ═══════════════════════════════════════════════════════════════
    //  MÓDULO 9: SCORE DE SAÚDE TRIBUTÁRIA
    //  Nota de 0 a 100 que mostra o quanto a empresa está otimizada
    //  Base legal: LC 123/2006; Resolução CGSN nº 140/2018
    // ═══════════════════════════════════════════════════════════════

    const Score = (function () {

        /** @type {Object|null} Último score calculado */
        var _ultimoScore = null;

        /**
         * Pesos das categorias do score (somam 100).
         * Conforme especificação:
         *   fatorR: 0-25, segregacao: 0-25, iss: 0-15, proLabore: 0-20, semRiscos: 0-15
         */
        var PESOS = {
            fatorR: 25,
            segregacao: 25,
            iss: 15,
            proLabore: 20,
            semRiscos: 15
        };

        /**
         * Faixas do score:
         *   80-100: Otimizado (verde)
         *   60-79:  Bom (azul)
         *   40-59:  Regular (amarelo)
         *   0-39:   Crítico (vermelho)
         */
        var FAIXAS = [
            { min: 80, max: 100, nome: 'OTIMIZADO', cor: '#10B981', icone: '🏆',
              descricao: 'Aproveitando todas (ou quase todas) as oportunidades legais de economia.' },
            { min: 60, max: 79, nome: 'BOM', cor: '#3B82F6', icone: '🟢',
              descricao: 'Empresa bem otimizada. Pequenos ajustes podem trazer ganhos adicionais.' },
            { min: 40, max: 59, nome: 'REGULAR', cor: '#EAB308', icone: '🟡',
              descricao: 'Algumas otimizações importantes não estão sendo aproveitadas.' },
            { min: 0, max: 39, nome: 'CRÍTICO', cor: '#DC2626', icone: '🔴',
              descricao: 'Está pagando muito mais do que deveria. Há economias significativas a serem aproveitadas.' }
        ];

        /**
         * Calcula o score de saúde tributária com dados reais.
         * Cada categoria usa lógica específica baseada em dados do IMPOST.
         *
         * @param {Object} [diagnosticoResult] — resultado do Diagnostico.executar (opcional)
         * @param {Object} [calculoResult] — resultado do Calculadora.calcularTudo (opcional)
         * @returns {Object} Score detalhado
         *
         * Base legal: LC 123/2006; Resolução CGSN nº 140/2018
         */
        function calcular(diagnosticoResult, calculoResult) {
            var diag = diagnosticoResult || Diagnostico.getUltimoDiagnostico();
            var calc = calculoResult || Calculadora.calcularTudo();
            var d = Formulario.getDados();

            if (!diag) {
                diag = Diagnostico.executar(calc);
            }

            var categorias = {};
            var oportunidades = diag.oportunidades || [];
            var alertas = diag.alertas || [];
            var rbt12 = d.receitaBrutaAnual || (d.receitaBrutaMensal * 12);
            var folha12 = d.folhaAnual || (d.folhaMensal * 12);

            // ══════════════════════════════════════════
            // FATOR R (0-25 pontos)
            // Se Fator R ≥ 28% → 25 pts
            // Se entre 20%-28% → proporcional
            // Se < 20% → 0 pts
            // Se CNAE não depende do Fator R → 25 pts (N/A)
            // ══════════════════════════════════════════
            var scoreFatorR = PESOS.fatorR;
            var motivoFR = 'N/A — CNAE não depende do Fator R';
            var regrasCnae = _CnaeMapeamento && _CnaeMapeamento.obterRegrasCNAE
                ? _CnaeMapeamento.obterRegrasCNAE(d.cnae, '') : null;
            // Fallback: checar via resultado do IMPOST.determinarAnexo
            var cnaeUsaFatorR = (regrasCnae && regrasCnae.fatorR)
                || (calc.anexo && calc.anexo.motivo && calc.anexo.motivo.indexOf('Fator R') >= 0)
                || (calc.otimizacaoFatorR && calc.otimizacaoFatorR.aplicavel);

            if (cnaeUsaFatorR) {
                var fr = calc.fatorR ? calc.fatorR.valor : (rbt12 > 0 ? folha12 / rbt12 : 0);
                if (fr >= 0.28) {
                    scoreFatorR = PESOS.fatorR; // 25 pts
                    motivoFR = 'Fator R = ' + Utils.formatarPercentual(fr) + ' (≥ 28%) — Anexo III, otimizado';
                } else if (fr >= 0.20) {
                    // Proporcional entre 20% e 28%: de 0 a 25 pts
                    scoreFatorR = Math.round(PESOS.fatorR * ((fr - 0.20) / 0.08));
                    motivoFR = 'Fator R = ' + Utils.formatarPercentual(fr) + ' — entre 20% e 28%, parcialmente otimizado';
                } else {
                    scoreFatorR = 0;
                    motivoFR = 'Fator R = ' + Utils.formatarPercentual(fr) + ' (< 20%) — Anexo V, não otimizado';
                }
            }
            categorias.fatorR = { pontos: scoreFatorR, maximo: PESOS.fatorR, motivo: motivoFR };

            // ══════════════════════════════════════════
            // SEGREGAÇÃO (0-25 pontos)
            // Se empresa tem receitas segregadas corretamente → pontos cheios
            // Se tem receitas especiais mas não segrega → 0 pts
            // Se não tem receitas especiais → pontos cheios (N/A)
            // ══════════════════════════════════════════
            var scoreSegregacao = PESOS.segregacao;
            var motivoSeg = 'Nenhuma receita especial informada — segregação N/A';
            var temReceitaEspecial = (d.receitaMonofasica > 0) || (d.receitaExportacao > 0)
                || (d.receitaICMS_ST > 0) || (d.receitaLocacaoBensMoveis > 0);

            if (temReceitaEspecial) {
                var dasOtim = calc.dasMensal ? calc.dasMensal.comOtimizacao : null;
                if (dasOtim && dasOtim.economia > 0) {
                    scoreSegregacao = PESOS.segregacao; // 25 pts
                    motivoSeg = 'Receitas especiais segregadas — economia de '
                        + Utils.formatarMoeda(dasOtim.economia) + '/mês';
                } else {
                    var ecoSegAnual = 0;
                    oportunidades.forEach(function (op) {
                        if (op.categoria === 'segregacao') ecoSegAnual += (op.economiaAnual || 0);
                    });
                    if (ecoSegAnual > 0) {
                        scoreSegregacao = 0;
                        motivoSeg = 'Receitas especiais NÃO segregadas — perdendo ' + Utils.formatarMoeda(ecoSegAnual) + '/ano';
                    } else {
                        scoreSegregacao = Math.round(PESOS.segregacao * 0.5);
                        motivoSeg = 'Receitas especiais presentes — verificar segregação no PGDAS-D';
                    }
                }
            }
            categorias.segregacao = { pontos: scoreSegregacao, maximo: PESOS.segregacao, motivo: motivoSeg };

            // ══════════════════════════════════════════
            // ISS (0-15 pontos)
            // Se ISS ≤ 2% → 15 pts
            // Se ISS = 5% → 0 pts
            // Linear entre 2% e 5%
            // ══════════════════════════════════════════
            var scoreISS = 0;
            var motivoISS = '';
            var issAtual = d.issAliquota || 5.00;

            if (issAtual <= 2.00) {
                scoreISS = PESOS.iss; // 15 pts
                motivoISS = 'ISS na alíquota mínima legal (2%) — otimizado';
            } else if (issAtual >= 5.00) {
                scoreISS = 0;
                motivoISS = 'ISS na alíquota máxima (5%) — verificar se o município tem alíquota menor';
            } else {
                // Linear: 2% → 15 pts, 5% → 0 pts
                scoreISS = Math.round(PESOS.iss * (5.00 - issAtual) / 3.00);
                motivoISS = 'ISS em ' + issAtual.toFixed(2).replace('.', ',') + '% — há margem de otimização';
            }
            // Bônus se ISS retido na fonte está sendo deduzido
            if (d.issRetidoFonte > 0) {
                scoreISS = Math.min(PESOS.iss, scoreISS + 2);
                motivoISS += '. ISS retido na fonte deduzido do DAS.';
            }
            categorias.iss = { pontos: scoreISS, maximo: PESOS.iss, motivo: motivoISS };

            // ══════════════════════════════════════════
            // PRÓ-LABORE (0-20 pontos)
            // Se pró-labore ≥ 28% da RBT12 → 20 pts
            // Se < 28% → proporcional
            // Se não informado → 10 pts (indeterminado)
            // ══════════════════════════════════════════
            var scorePL = 0;
            var motivoPL = '';
            var proLabore12 = (d.proLabore || 0) * 12;

            if (d.proLabore <= 0 && d.socios && d.socios.length > 0) {
                scorePL = Math.round(PESOS.proLabore * 0.5);
                motivoPL = 'Pró-labore não informado — não foi possível avaliar';
            } else if (rbt12 > 0) {
                var ratioPL = proLabore12 / rbt12;
                if (ratioPL >= 0.28) {
                    scorePL = PESOS.proLabore; // 20 pts
                    motivoPL = 'Pró-labore representa ' + Utils.formatarPercentual(ratioPL)
                        + ' da RBT12 (≥ 28%) — otimizado para Fator R';
                } else {
                    // Proporcional: 0% → 0 pts, 28% → 20 pts
                    scorePL = Math.round(PESOS.proLabore * (ratioPL / 0.28));
                    motivoPL = 'Pró-labore representa ' + Utils.formatarPercentual(ratioPL)
                        + ' da RBT12 (< 28%) — considerar ajuste';
                }
            } else {
                scorePL = PESOS.proLabore;
                motivoPL = 'Sem receita informada — N/A';
            }
            categorias.proLabore = { pontos: scorePL, maximo: PESOS.proLabore, motivo: motivoPL };

            // ══════════════════════════════════════════
            // SEM RISCOS (0-15 pontos)
            // Cada risco fiscal identificado desconta pontos
            // Débitos pendentes → 0 pts
            // ══════════════════════════════════════════
            var scoreRiscos = PESOS.semRiscos;
            var motivoRiscos = 'Nenhum risco identificado';
            if (d.debitosFiscaisPendentes) {
                scoreRiscos = 0;
                motivoRiscos = 'DÉBITOS FISCAIS PENDENTES — risco de exclusão do Simples Nacional';
            } else {
                // Cada alerta do diagnóstico desconta 3 pts
                var desconto = alertas.length * 3;
                // Flags de elegibilidade negativas descontam 5 pts cada
                if (d.socioPessoaJuridica) desconto += 5;
                if (d.cessaoMaoObra) desconto += 5;
                if (d.socioDomiciliadoExterior) desconto += 5;
                scoreRiscos = Math.max(0, PESOS.semRiscos - desconto);
                if (desconto > 0) {
                    motivoRiscos = alertas.length + ' alerta(s) identificado(s) (-' + desconto + ' pts)';
                }
            }
            categorias.semRiscos = { pontos: scoreRiscos, maximo: PESOS.semRiscos, motivo: motivoRiscos };

            // ══════════════════════════════════════════
            // SCORE TOTAL
            // ══════════════════════════════════════════
            var total = 0;
            Object.keys(categorias).forEach(function (cat) { total += categorias[cat].pontos; });
            total = Math.max(0, Math.min(100, total));

            // Determinar faixa
            var faixaInfo = FAIXAS[FAIXAS.length - 1]; // Default: CRÍTICO
            for (var fi = 0; fi < FAIXAS.length; fi++) {
                if (total >= FAIXAS[fi].min && total <= FAIXAS[fi].max) {
                    faixaInfo = FAIXAS[fi];
                    break;
                }
            }

            _ultimoScore = {
                total: total,
                faixa: faixaInfo.nome,
                corFaixa: faixaInfo.cor,
                iconeFaixa: faixaInfo.icone,
                descricaoFaixa: faixaInfo.descricao,
                categorias: categorias,
                economiaPotencialAnual: diag.economiaTotal ? diag.economiaTotal.anual : 0,
                economiaPotencialAnualFormatada: diag.economiaTotal ? diag.economiaTotal.anualFormatada : 'R$ 0,00',
                _meta: { calculadoEm: new Date().toISOString() }
            };

            Eventos.emit('score:calculado', _ultimoScore);

            return _ultimoScore;
        }

        /**
         * Retorna detalhamento do score por categoria.
         * @returns {Object|null}
         */
        function getDetalhamento() {
            return _ultimoScore ? _ultimoScore.categorias : null;
        }

        /**
         * Retorna último score calculado.
         * @returns {Object|null}
         */
        function getUltimoScore() {
            return _ultimoScore;
        }

        return {
            calcular: calcular,
            getDetalhamento: getDetalhamento,
            getUltimoScore: getUltimoScore,
            PESOS: PESOS,
            FAIXAS: FAIXAS
        };
    })();


    // ═══════════════════════════════════════════════════════════════
    //  MÓDULO 10: SIMULADOR "E SE?"
    //  Permite testar cenários interativos e comparar impactos
    //  Base legal: LC 123/2006; Resolução CGSN nº 140/2018
    // ═══════════════════════════════════════════════════════════════

    const Simulador = (function () {

        /** @type {Array} Histórico de simulações */
        var _historico = [];

        /**
         * Calcula cenário base (situação atual) para comparação.
         * @returns {Object}
         * @private
         */
        function _calcularBase() {
            var d = Formulario.getDados();
            var rbt12 = d.receitaBrutaAnual || (d.receitaBrutaMensal * 12);
            var folha12 = d.folhaAnual || (d.folhaMensal * 12);
            var fatorR = rbt12 > 0 ? folha12 / rbt12 : 0;

            var detAnexo = _chamarIMPOST('determinarAnexo', { cnae: d.cnae, fatorR: fatorR });
            var anexo = detAnexo ? detAnexo.anexo : 'III';
            if (!anexo || anexo === 'VEDADO') anexo = 'III';

            var das = _chamarIMPOST('calcularDASMensal', {
                receitaBrutaMensal: d.receitaBrutaMensal,
                rbt12: rbt12,
                anexo: anexo,
                folhaMensal: d.folhaMensal || 0,
                issRetidoFonte: d.issRetidoFonte || 0,
                aliquotaRAT: 0.02
            });

            var aliq = _chamarIMPOST('calcularAliquotaEfetiva', { rbt12: rbt12, anexo: anexo });

            return {
                receitaMensal: d.receitaBrutaMensal,
                receitaAnual: rbt12,
                folhaMensal: d.folhaMensal || 0,
                proLabore: d.proLabore || 0,
                fatorR: fatorR,
                fatorRFormatado: Utils.formatarPercentual(fatorR),
                anexo: anexo,
                dasMensal: das ? (das.dasAPagar || das.dasValor || 0) : 0,
                dasAnual: das ? (das.dasAPagar || das.dasValor || 0) * 12 : 0,
                aliquotaEfetiva: aliq ? aliq.aliquotaEfetiva : 0,
                aliquotaEfetivaFormatada: aliq ? aliq.aliquotaEfetivaFormatada : '0,00%'
            };
        }

        /**
         * Simula cenário "E se?" e compara com situação atual.
         *
         * @param {Object} cenario — Tipo e parâmetros do cenário
         * @param {string} cenario.tipo — 'fatorR' | 'receita' | 'monofasico' | 'proLabore'
         * @returns {Object} Resultado da simulação com comparativo
         */
        function simular(cenario) {
            if (!cenario || !cenario.tipo) {
                return { erro: 'Tipo de cenário é obrigatório (fatorR, receita, monofasico, proLabore).' };
            }

            var d = Formulario.getDados();
            var base = _calcularBase();
            var resultado = null;

            switch (cenario.tipo) {
                case 'fatorR':
                    resultado = _simularFatorR(cenario, d, base);
                    break;
                case 'receita':
                    resultado = _simularReceita(cenario, d, base);
                    break;
                case 'monofasico':
                    resultado = _simularMonofasico(cenario, d, base);
                    break;
                case 'proLabore':
                    resultado = _simularProLabore(cenario, d, base);
                    break;
                default:
                    return { erro: 'Tipo de cenário não reconhecido: ' + cenario.tipo };
            }

            if (resultado && !resultado.erro) {
                resultado.base = base;
                resultado.tipo = cenario.tipo;
                resultado.simuladoEm = new Date().toISOString();
                _historico.push(resultado);
                Eventos.emit('simulacao:resultado', resultado);
            }

            return resultado;
        }

        /**
         * Simula alteração na folha de pagamento → impacto no Fator R e DAS.
         * @private
         */
        function _simularFatorR(cenario, d, base) {
            var novaFolha = cenario.novaFolhaMensal;
            if (novaFolha == null || novaFolha < 0) {
                return { erro: 'Informe novaFolhaMensal para simular Fator R.' };
            }

            var rbt12 = base.receitaAnual;
            var novaFolha12 = novaFolha * 12;
            var novoFatorR = rbt12 > 0 ? novaFolha12 / rbt12 : 0;

            var detAnexo = _chamarIMPOST('determinarAnexo', { cnae: d.cnae, fatorR: novoFatorR });
            var novoAnexo = detAnexo ? detAnexo.anexo : base.anexo;
            if (!novoAnexo || novoAnexo === 'VEDADO') novoAnexo = base.anexo;

            var novoDAS = _chamarIMPOST('calcularDASMensal', {
                receitaBrutaMensal: d.receitaBrutaMensal,
                rbt12: rbt12,
                anexo: novoAnexo,
                folhaMensal: novaFolha,
                issRetidoFonte: d.issRetidoFonte || 0,
                aliquotaRAT: 0.02
            });

            var novoDASValor = novoDAS ? (novoDAS.dasAPagar || novoDAS.dasValor || 0) : base.dasMensal;
            var diferencaMensal = base.dasMensal - novoDASValor;
            var delta = novaFolha - base.folhaMensal;
            var custoINSSSegurado = delta * 0.11;
            var custoFGTS = delta * 0.08; // FGTS sobre funcionários CLT
            var isAnexoIV = (novoAnexo === 'IV');
            var custoPatronal = isAnexoIV ? (delta * 0.20) : 0; // CPP fora do DAS no Anexo IV
            var custoAdicionalFolha = custoINSSSegurado + custoFGTS + custoPatronal;
            var economieLiquidaMensal = diferencaMensal - custoAdicionalFolha;

            return {
                cenario: {
                    descricao: 'Alterar folha de pagamento para ' + Utils.formatarMoeda(novaFolha) + '/mês',
                    novaFolhaMensal: novaFolha
                },
                simulado: {
                    folhaMensal: novaFolha,
                    fatorR: novoFatorR,
                    fatorRFormatado: Utils.formatarPercentual(novoFatorR),
                    anexo: novoAnexo,
                    dasMensal: novoDASValor,
                    dasAnual: novoDASValor * 12,
                    mudouAnexo: novoAnexo !== base.anexo
                },
                comparativo: {
                    diferencaDASMensal: diferencaMensal,
                    diferencaDASAnual: diferencaMensal * 12,
                    custoAdicionalFolhaMensal: custoAdicionalFolha,
                    economieLiquidaMensal: economieLiquidaMensal,
                    economieLiquidaAnual: economieLiquidaMensal * 12,
                    valeAPena: economieLiquidaMensal > 0,
                    mudouAnexo: novoAnexo !== base.anexo,
                    resumo: novoAnexo !== base.anexo
                        ? 'Mudou de Anexo ' + base.anexo + ' para Anexo ' + novoAnexo
                            + '. Economia líquida de ' + Utils.formatarMoeda(economieLiquidaMensal) + '/mês.'
                        : 'Sem mudança de anexo. Diferença no DAS: ' + Utils.formatarMoeda(diferencaMensal) + '/mês.'
                }
            };
        }

        /**
         * Simula alteração na receita mensal → impacto na faixa, alíquota e DAS.
         * @private
         */
        function _simularReceita(cenario, d, base) {
            var novaReceita = cenario.novaReceitaMensal;
            if (novaReceita == null || novaReceita <= 0) {
                return { erro: 'Informe novaReceitaMensal para simular receita.' };
            }

            var novaRBT12 = novaReceita * 12;
            var folha12 = d.folhaAnual || (d.folhaMensal * 12);
            var novoFatorR = novaRBT12 > 0 ? folha12 / novaRBT12 : 0;

            var detAnexo = _chamarIMPOST('determinarAnexo', { cnae: d.cnae, fatorR: novoFatorR });
            var novoAnexo = detAnexo ? detAnexo.anexo : base.anexo;
            if (!novoAnexo || novoAnexo === 'VEDADO') novoAnexo = base.anexo;

            var novoDAS = _chamarIMPOST('calcularDASMensal', {
                receitaBrutaMensal: novaReceita,
                rbt12: novaRBT12,
                anexo: novoAnexo,
                folhaMensal: d.folhaMensal || 0,
                issRetidoFonte: d.issRetidoFonte || 0,
                aliquotaRAT: 0.02
            });

            var novaAliq = _chamarIMPOST('calcularAliquotaEfetiva', { rbt12: novaRBT12, anexo: novoAnexo });

            var novoDASValor = novoDAS ? (novoDAS.dasAPagar || novoDAS.dasValor || 0) : 0;
            var excedeSublimite = novaRBT12 > 3600000;
            var excedeLimite = novaRBT12 > 4800000;

            // Classificação
            var novaClassif = novaRBT12 <= 360000 ? 'ME' : (novaRBT12 <= 4800000 ? 'EPP' : 'EXCEDEU');

            return {
                cenario: {
                    descricao: 'Alterar receita mensal para ' + Utils.formatarMoeda(novaReceita),
                    novaReceitaMensal: novaReceita
                },
                simulado: {
                    receitaMensal: novaReceita,
                    receitaAnual: novaRBT12,
                    fatorR: novoFatorR,
                    fatorRFormatado: Utils.formatarPercentual(novoFatorR),
                    anexo: novoAnexo,
                    aliquotaEfetiva: novaAliq ? novaAliq.aliquotaEfetiva : 0,
                    aliquotaEfetivaFormatada: novaAliq ? novaAliq.aliquotaEfetivaFormatada : '0,00%',
                    dasMensal: novoDASValor,
                    dasAnual: novoDASValor * 12,
                    classificacao: novaClassif,
                    excedeSublimite: excedeSublimite,
                    excedeLimite: excedeLimite
                },
                comparativo: {
                    diferencaDASMensal: novoDASValor - base.dasMensal,
                    diferencaDASAnual: (novoDASValor - base.dasMensal) * 12,
                    variacaoReceita: novaReceita - base.receitaMensal,
                    variacaoReceitaPercentual: base.receitaMensal > 0
                        ? Utils.formatarPercentual((novaReceita - base.receitaMensal) / base.receitaMensal)
                        : 'N/A',
                    mudouAnexo: novoAnexo !== base.anexo,
                    alertas: [].concat(
                        excedeLimite ? ['ATENÇÃO: Receita anual de ' + Utils.formatarMoeda(novaRBT12) + ' EXCEDE o limite do Simples Nacional (R$ 4.800.000). Obrigatório migrar para outro regime.'] : [],
                        excedeSublimite && !excedeLimite ? ['Receita acima do sublimite de R$ 3.600.000. ICMS e ISS serão recolhidos por fora do DAS.'] : [],
                        novoAnexo !== base.anexo ? ['Mudança de Anexo ' + base.anexo + ' para Anexo ' + novoAnexo + ' devido à alteração no Fator R.'] : []
                    ),
                    resumo: 'Receita de ' + Utils.formatarMoeda(novaReceita) + '/mês → DAS de '
                        + Utils.formatarMoeda(novoDASValor) + '/mês'
                        + (novoDASValor > base.dasMensal ? ' (+' + Utils.formatarMoeda(novoDASValor - base.dasMensal) + ')'
                            : ' (' + Utils.formatarMoeda(novoDASValor - base.dasMensal) + ')')
                }
            };
        }

        /**
         * Simula percentual de receita monofásica → economia de PIS/COFINS.
         * @private
         */
        function _simularMonofasico(cenario, d, base) {
            var percentual = cenario.percentualMonofasico;
            if (percentual == null || percentual < 0 || percentual > 1) {
                return { erro: 'Informe percentualMonofasico (0 a 1) para simular monofásico.' };
            }

            var receitaMono = d.receitaBrutaMensal * percentual;
            var rbt12 = base.receitaAnual;
            var anexo = base.anexo;

            // Calcular DAS segregado
            var dasSeg = _chamarIMPOST('calcularDASSegregado', {
                receitaBrutaMensal: d.receitaBrutaMensal,
                receitaMonofasica: receitaMono,
                rbt12: rbt12,
                anexo: anexo,
                folhaMensal: d.folhaMensal || 0,
                aliquotaRAT: 0.02
            });

            // Fallback: estimar economia manualmente
            var economiaMensal = 0;
            if (dasSeg && (dasSeg.economiaTotal || dasSeg.economia)) {
                economiaMensal = dasSeg.economiaTotal || dasSeg.economia;
            } else {
                // PIS+COFINS ~3,65% sobre parcela monofásica (zerados na segregação)
                economiaMensal = receitaMono * 0.0365;
            }

            return {
                cenario: {
                    descricao: Utils.formatarPercentual(percentual) + ' da receita como monofásica',
                    percentualMonofasico: percentual,
                    receitaMonofasicaMensal: receitaMono
                },
                simulado: {
                    receitaMonofasica: receitaMono,
                    receitaNormal: d.receitaBrutaMensal - receitaMono,
                    economiaMensal: economiaMensal,
                    economiaAnual: economiaMensal * 12,
                    novoDASEstimado: base.dasMensal - economiaMensal
                },
                comparativo: {
                    economiaMensal: economiaMensal,
                    economiaAnual: economiaMensal * 12,
                    economiaMensalFormatada: Utils.formatarMoeda(economiaMensal),
                    economiaAnualFormatada: Utils.formatarMoeda(economiaMensal * 12),
                    resumo: 'Segregando ' + Utils.formatarPercentual(percentual)
                        + ' como monofásico → economia de ' + Utils.formatarMoeda(economiaMensal) + '/mês ('
                        + Utils.formatarMoeda(economiaMensal * 12) + '/ano)'
                }
            };
        }

        /**
         * Simula alteração no pró-labore → impacto em INSS, Fator R e distribuição.
         * @private
         */
        function _simularProLabore(cenario, d, base) {
            var novoProLabore = cenario.novoProLabore;
            if (novoProLabore == null || novoProLabore < 0) {
                return { erro: 'Informe novoProLabore para simular pró-labore.' };
            }

            // Calcular nova folha (folha - proLabore antigo + proLabore novo)
            var proLaboreAntigo = d.proLabore || 0;
            var delta = novoProLabore - proLaboreAntigo;
            var novaFolha = Math.max(0, (d.folhaMensal || 0) + delta);
            var rbt12 = base.receitaAnual;
            var novaFolha12 = novaFolha * 12;
            var novoFatorR = rbt12 > 0 ? novaFolha12 / rbt12 : 0;

            var detAnexo = _chamarIMPOST('determinarAnexo', { cnae: d.cnae, fatorR: novoFatorR });
            var novoAnexo = detAnexo ? detAnexo.anexo : base.anexo;
            if (!novoAnexo || novoAnexo === 'VEDADO') novoAnexo = base.anexo;

            var novoDAS = _chamarIMPOST('calcularDASMensal', {
                receitaBrutaMensal: d.receitaBrutaMensal,
                rbt12: rbt12,
                anexo: novoAnexo,
                folhaMensal: novaFolha,
                issRetidoFonte: d.issRetidoFonte || 0,
                aliquotaRAT: 0.02
            });

            var novoDASValor = novoDAS ? (novoDAS.dasAPagar || novoDAS.dasValor || 0) : base.dasMensal;
            var diferencaDAS = base.dasMensal - novoDASValor;
            var diferencaINSS = delta * 0.11; // INSS segurado sobre pró-labore
            var isAnexoIV = (novoAnexo === 'IV');
            var custoPatronalPL = isAnexoIV ? (delta * 0.20) : 0; // CPP fora do DAS para Anexo IV
            var diferencaEncargos = diferencaINSS + custoPatronalPL;
            var economieLiquida = diferencaDAS - diferencaEncargos;

            // Lucro distribuível
            var novoLucro = _chamarIMPOST('calcularDistribuicaoLucros', {
                receitaBrutaAnual: rbt12,
                dasAnual: novoDASValor * 12,
                socios: d.socios && d.socios.length > 0 ? d.socios : [{ nome: 'Sócio Único', percentual: 1.0 }],
                cnae: d.cnae
            });

            return {
                cenario: {
                    descricao: 'Alterar pró-labore para ' + Utils.formatarMoeda(novoProLabore),
                    novoProLabore: novoProLabore
                },
                simulado: {
                    proLabore: novoProLabore,
                    folhaMensal: novaFolha,
                    fatorR: novoFatorR,
                    fatorRFormatado: Utils.formatarPercentual(novoFatorR),
                    anexo: novoAnexo,
                    dasMensal: novoDASValor,
                    dasAnual: novoDASValor * 12,
                    inssProLabore: novoProLabore * 0.11,
                    lucroDistribuivel: novoLucro ? novoLucro.lucroDistribuivelFinal : 0,
                    mudouAnexo: novoAnexo !== base.anexo
                },
                comparativo: {
                    diferencaDASMensal: diferencaDAS,
                    diferencaINSSMensal: diferencaINSS,
                    economieLiquidaMensal: economieLiquida,
                    economieLiquidaAnual: economieLiquida * 12,
                    mudouAnexo: novoAnexo !== base.anexo,
                    valeAPena: economieLiquida > 0,
                    resumo: 'Pró-labore de ' + Utils.formatarMoeda(novoProLabore) + ' → '
                        + (novoAnexo !== base.anexo ? 'Migra para Anexo ' + novoAnexo + '. ' : '')
                        + 'Diferença DAS: ' + Utils.formatarMoeda(diferencaDAS) + '/mês. '
                        + 'Diferença INSS: ' + Utils.formatarMoeda(Math.abs(diferencaINSS)) + '/mês. '
                        + 'Economia líquida: ' + Utils.formatarMoeda(economieLiquida) + '/mês.'
                }
            };
        }

        /**
         * Compara múltiplos cenários lado a lado.
         *
         * @param {Array<Object>} cenarios — Lista de cenários para simular
         * @returns {Object} Comparativo com todos os cenários
         */
        function compararCenarios(cenarios) {
            if (!Array.isArray(cenarios) || cenarios.length === 0) {
                return { erro: 'Informe um array de cenários para comparar.' };
            }

            var base = _calcularBase();
            var resultados = cenarios.map(function (c) { return simular(c); });

            // Encontrar melhor cenário
            var melhor = null;
            var melhorEconomia = -Infinity;
            resultados.forEach(function (r, i) {
                if (r.erro) return;
                var eco = r.comparativo
                    ? (r.comparativo.economieLiquidaAnual || r.comparativo.economiaAnual || -(r.comparativo.diferencaDASAnual || 0))
                    : 0;
                if (eco > melhorEconomia) {
                    melhorEconomia = eco;
                    melhor = i;
                }
            });

            return {
                base: base,
                cenarios: resultados,
                melhorCenario: melhor,
                melhorEconomiaAnual: melhorEconomia,
                comparadoEm: new Date().toISOString()
            };
        }

        /**
         * Retorna histórico de simulações.
         * @returns {Array}
         */
        function getHistorico() {
            return _historico;
        }

        /**
         * Limpa histórico de simulações.
         */
        function limparHistorico() {
            _historico = [];
        }

        return {
            simular: simular,
            compararCenarios: compararCenarios,
            getHistorico: getHistorico,
            limparHistorico: limparHistorico
        };
    })();


    // ═══════════════════════════════════════════════════════════════
    //  MÓDULO 11: PLANO DE AÇÃO ESTRUTURADO
    //  Gera plano de ação com cronograma a partir do diagnóstico
    //  Base legal: LC 123/2006; Resolução CGSN nº 140/2018
    // ═══════════════════════════════════════════════════════════════

    const PlanoAcao = (function () {

        /** @type {Object|null} Último plano gerado */
        var _ultimoPlano = null;

        /** @type {number} Contador de IDs */
        var _nextId = 1;

        /**
         * Helper: calcula DAS mensal para cenário arbitrário.
         * @private
         */
        function _calcDAS(receitaMensal, rbt12, anexo, folhaMensal) {
            var das = _chamarIMPOST('calcularDASMensal', {
                receitaBrutaMensal: receitaMensal,
                rbt12: rbt12,
                anexo: anexo,
                folhaMensal: folhaMensal || 0,
                issRetidoFonte: 0,
                aliquotaRAT: 0.02
            });
            return das ? (das.dasAPagar || das.dasValor || 0) : 0;
        }

        /**
         * Helper: determina se CNAE é de serviço ou comércio.
         * @private
         */
        function _ehServico(cnae) {
            if (!cnae) return true;
            var grupo = parseInt(String(cnae).replace(/\D/g, '').substring(0, 2));
            // Grupos 01-43 são geralmente comércio/indústria; 44+ serviços
            // Mas simplificando: se começa com 47 (comércio varejista) → comércio
            return grupo >= 60; // Heurística: 60+ tende a ser serviço
        }

        // ──────────────────────────────────────────
        //  AÇÕES DE OTIMIZAÇÃO CONCRETAS
        // ──────────────────────────────────────────

        /**
         * Ação 1: Otimização do Fator R — calcular pró-labore ideal para atingir 28%
         * @private
         */
        function _acaoFatorROtimizacao(resultado, d) {
            var fr = resultado.fatorR;
            if (!fr || fr.valor == null || fr.acimaDoLimiar) return null;

            var regrasCnae = _CnaeMapeamento && _CnaeMapeamento.obterRegrasCNAE
                ? _CnaeMapeamento.obterRegrasCNAE(d.cnae, '') : null;
            if (!regrasCnae || !regrasCnae.fatorR) return null;

            var rbt12 = d.receitaBrutaAnual || (d.receitaBrutaMensal * 12);
            var folha12Atual = d.folhaAnual || (d.folhaMensal * 12);
            var folha12Necessaria = rbt12 * 0.28;
            var aumentoAnual = Math.max(0, folha12Necessaria - folha12Atual);
            var aumentoMensal = aumentoAnual / 12;
            var novaFolhaMensal = (d.folhaMensal || 0) + aumentoMensal;

            // DAS atual (Anexo V) vs DAS novo (Anexo III)
            var dasAtualMensal = _calcDAS(d.receitaBrutaMensal, rbt12, 'V', d.folhaMensal);
            var dasNovoMensal = _calcDAS(d.receitaBrutaMensal, rbt12, 'III', novaFolhaMensal);
            var economiaDASAnual = (dasAtualMensal - dasNovoMensal) * 12;

            // Custo: INSS sócio 11% sobre aumento + encargos
            var custoINSSSocio = aumentoMensal * 0.11 * 12;
            var anexoAtual = resultado.anexo ? resultado.anexo.anexo : 'V';
            var custoPatronal = (anexoAtual === 'IV') ? (aumentoMensal * 0.20 * 12) : 0;
            var custoTotal = custoINSSSocio + custoPatronal;
            var economiaLiquida = economiaDASAnual - custoTotal;

            if (economiaLiquida <= 0) return null;

            var proLaboreIdeal = (d.proLabore || 0) + aumentoMensal;

            return {
                id: 'fator_r_otimizacao',
                titulo: 'Otimizar Fator R para migrar ao Anexo III',
                descricao: 'Aumentar pró-labore de ' + Utils.formatarMoeda(d.proLabore || 0)
                    + ' para ' + Utils.formatarMoeda(proLaboreIdeal) + '/mês para atingir 28% do RBT12',
                economiaAnual: economiaDASAnual,
                economiaPercentual: dasAtualMensal > 0
                    ? ((economiaDASAnual / (dasAtualMensal * 12)) * 100).toFixed(1).replace('.', ',') + '%' : '0%',
                prazo: '1 mês',
                dificuldade: 'baixa',
                baseLegal: 'Art. 18, §5º-M, LC 123/2006; Resolução CGSN 140/2018, Art. 25-A',
                comoFazer: 'Aumentar o pró-labore registrado em folha de '
                    + Utils.formatarMoeda(d.proLabore || 0) + ' para ' + Utils.formatarMoeda(proLaboreIdeal)
                    + '/mês. Atenção: aumenta INSS do sócio em ' + Utils.formatarMoeda(aumentoMensal * 0.11) + '/mês.',
                riscos: ['Aumento de INSS patronal sobre pró-labore adicional de '
                    + Utils.formatarMoeda(custoINSSSocio / 12) + '/mês',
                    'Se receita crescer, o Fator R pode cair abaixo de 28%'
                ],
                economiaLiquida: economiaLiquida,
                custoImplementacao: custoTotal,
                detalhes: {
                    proLaboreAtual: d.proLabore || 0,
                    proLaboreIdeal: proLaboreIdeal,
                    fatorRAtual: fr.valor,
                    fatorRNovo: 0.28,
                    anexoAtual: anexoAtual,
                    anexoNovo: 'III',
                    dasAtualMensal: dasAtualMensal,
                    dasNovoMensal: dasNovoMensal
                }
            };
        }

        /**
         * Ação 2: Segregação de Receitas mistas — calcular DAS separado por CNAE
         * @private
         */
        function _acaoSegregacaoReceitas(resultado, d) {
            var ativSecundarias = d.atividadeSecundaria || d.cnaeSecundarios || [];
            if (ativSecundarias.length === 0) return null;

            var rbt12 = d.receitaBrutaAnual || (d.receitaBrutaMensal * 12);
            var anexoPrincipal = resultado.anexo ? resultado.anexo.anexo : 'III';

            // Calcular DAS se 100% no anexo principal
            var dasTudoJuntoMensal = _calcDAS(d.receitaBrutaMensal, rbt12, anexoPrincipal, d.folhaMensal);

            // Verificar se alguma atividade secundária cai em anexo mais barato
            var economiaEstimada = 0;
            var receitasSegregaveis = [];

            ativSecundarias.forEach(function (ativ) {
                var cnaeSecundario = ativ.cnae || ativ;
                var receitaSecundaria = ativ.receita || (d.receitaBrutaMensal * 0.2); // Estimar 20% se não informado

                var detAnexo = _chamarIMPOST('determinarAnexo', {
                    cnae: cnaeSecundario,
                    fatorR: resultado.fatorR ? resultado.fatorR.valor : 0
                });
                var anexoSec = detAnexo ? detAnexo.anexo : anexoPrincipal;

                if (anexoSec !== anexoPrincipal && anexoSec !== 'VEDADO') {
                    var dasSec = _calcDAS(receitaSecundaria, rbt12, anexoSec, 0);
                    var dasPrincipalProporcional = _calcDAS(receitaSecundaria, rbt12, anexoPrincipal, 0);
                    var eco = dasPrincipalProporcional - dasSec;
                    if (eco > 0) {
                        economiaEstimada += eco;
                        receitasSegregaveis.push({
                            cnae: cnaeSecundario,
                            anexo: anexoSec,
                            receita: receitaSecundaria,
                            economia: eco
                        });
                    }
                }
            });

            if (economiaEstimada <= 0) return null;

            return {
                id: 'segregacao_receitas',
                titulo: 'Segregar receitas por CNAE (atividades mistas)',
                descricao: 'Separar faturamento por atividade no PGDAS-D para tributar cada receita no anexo correto. '
                    + receitasSegregaveis.length + ' atividade(s) em anexo(s) diferente(s) do principal.',
                economiaAnual: economiaEstimada * 12,
                economiaPercentual: dasTudoJuntoMensal > 0
                    ? ((economiaEstimada / dasTudoJuntoMensal) * 100).toFixed(1).replace('.', ',') + '%' : '0%',
                prazo: 'Próximo PGDAS-D',
                dificuldade: 'media',
                baseLegal: 'Resolução CGSN 140/2018, Art. 25, §1º a §3º; LC 123/2006, Art. 18',
                comoFazer: 'No PGDAS-D, informar cada parcela de receita com o CNAE e anexo correspondentes. '
                    + 'Receitas segregáveis: ' + receitasSegregaveis.map(function (r) {
                        return Utils.formatarCNAE(r.cnae) + ' (Anexo ' + r.anexo + ')';
                    }).join(', '),
                riscos: ['Segregação incorreta pode gerar autuação',
                    'Cada receita deve corresponder à atividade efetivamente exercida'],
                economiaLiquida: economiaEstimada * 12,
                custoImplementacao: 0,
                detalhes: { receitasSegregaveis: receitasSegregaveis }
            };
        }

        /**
         * Ação 3: Distribuição de Lucros isenta de IR
         * @private
         */
        function _acaoDistribuicaoLucros(resultado, d) {
            var rbt12 = d.receitaBrutaAnual || (d.receitaBrutaMensal * 12);
            var dasAnual = resultado.anual ? resultado.anual.dasAnual : 0;

            // Percentual de presunção conforme Art. 14 LC 123
            var percPresuncao = _ehServico(d.cnae) ? 0.32 : 0.08;
            var lucroPresumido = rbt12 * percPresuncao;
            var lucroDistribuivelIsento = lucroPresumido - dasAnual;
            if (lucroDistribuivelIsento <= 0) lucroDistribuivelIsento = 0;

            // Se tem escrituração contábil, pode distribuir mais
            var lucroContabil = rbt12 * 0.20; // Margem estimada de 20%
            var lucroMaiorContabil = Math.max(lucroDistribuivelIsento, lucroContabil);

            var socios = d.socios || [{ nome: 'Sócio Único', percentual: 1.0 }];
            var numSocios = socios.length;
            var proLaboreTotal = (d.proLabore || 0) * numSocios * 12;

            // Economia: diferença entre tributar como pró-labore vs distribuir como lucro isento
            var inssEconomiaPotencial = 0;
            if ((d.proLabore || 0) > SALARIO_MINIMO_2026 && lucroDistribuivelIsento > 0) {
                var reducaoPL = Math.min((d.proLabore || 0) - SALARIO_MINIMO_2026, lucroDistribuivelIsento / 12 / numSocios);
                inssEconomiaPotencial = reducaoPL * 0.11 * numSocios * 12; // INSS segurado evitado
            }

            if (lucroDistribuivelIsento <= 0 && inssEconomiaPotencial <= 0) return null;

            return {
                id: 'distribuicao_lucros',
                titulo: 'Distribuir lucros isentos de IR (Art. 14, LC 123/2006)',
                descricao: 'Os sócios podem retirar até ' + Utils.formatarMoeda(lucroDistribuivelIsento)
                    + '/ano como lucro isento de IR (presunção ' + (percPresuncao * 100).toFixed(0) + '%). '
                    + 'Com escrituração contábil, o valor pode ser maior.',
                economiaAnual: inssEconomiaPotencial,
                economiaPercentual: proLaboreTotal > 0
                    ? ((inssEconomiaPotencial / proLaboreTotal) * 100).toFixed(1).replace('.', ',') + '%' : '0%',
                prazo: '1 mês',
                dificuldade: 'baixa',
                baseLegal: 'Art. 10, Lei 9.249/95; Art. 14, LC 123/2006; ADI SRF nº 04/2007',
                comoFazer: 'Manter pró-labore no mínimo legal (1 SM = ' + Utils.formatarMoeda(SALARIO_MINIMO_2026)
                    + ') e distribuir o restante como lucro isento. Por sócio: até '
                    + Utils.formatarMoeda(lucroDistribuivelIsento / numSocios) + '/ano.',
                riscos: ['RFB pode questionar pró-labore incompatível com atividade exercida',
                    'Distribuição acima do lucro apurado é tributável'],
                economiaLiquida: inssEconomiaPotencial,
                custoImplementacao: 0,
                detalhes: {
                    lucroDistribuivelIsento: lucroDistribuivelIsento,
                    percPresuncao: percPresuncao,
                    porSocio: socios.map(function (s) {
                        return {
                            nome: s.nome || 'Sócio',
                            percentual: s.percentual || (1 / numSocios),
                            valorIsento: lucroDistribuivelIsento * (s.percentual || (1 / numSocios))
                        };
                    })
                }
            };
        }

        /**
         * Ação 4: Redução de ISS — verificar alíquota mínima do município
         * @private
         */
        function _acaoReducaoISS(resultado, d) {
            var issAtual = d.issAliquota || 5.00;
            if (issAtual <= 2) return null;

            var rbt12 = d.receitaBrutaAnual || (d.receitaBrutaMensal * 12);
            var aliqEf = resultado.aliquotaEfetiva ? resultado.aliquotaEfetiva.valor : 0;
            var faixa = resultado.aliquotaEfetiva ? resultado.aliquotaEfetiva.faixa : 1;
            var anexo = resultado.anexo ? resultado.anexo.anexo : 'III';

            // Apenas para serviços
            if (anexo === 'I' || anexo === 'II') return null;

            // Usar partilha real
            var partReal = null;
            if (_IMPOST && _IMPOST.PARTILHA && _IMPOST.PARTILHA[anexo]) {
                var faixaIdx = Math.max(0, (faixa || 1) - 1);
                var partArr = _IMPOST.PARTILHA[anexo];
                if (faixaIdx < partArr.length) partReal = partArr[faixaIdx];
            }
            var percISS = partReal ? (partReal.iss || 0) : 0.15;

            // Economia se ISS caísse para 2% (mínimo legal)
            var issNoDASTaxa = aliqEf * percISS;
            // A economia real no DAS depende da redução proporcional dentro da partilha
            // Estimativa conservadora: se município cobrar menos, a parcela ISS no DAS não muda
            // Mas se ISS é retido na fonte a 2% ao invés de 5%, economia na retenção
            var economiaMensal = d.receitaBrutaMensal * (issNoDASTaxa) * ((issAtual - 2) / issAtual);

            if (economiaMensal <= 0) return null;

            return {
                id: 'reducao_iss',
                titulo: 'Verificar alíquota de ISS municipal (potencial redução)',
                descricao: 'Alíquota atual: ' + issAtual.toFixed(2).replace('.', ',') + '%. '
                    + 'Mínimo legal: 2% (LC 116/2003, Art. 8-A). '
                    + 'Verificar se o município oferece alíquota incentivada.',
                economiaAnual: economiaMensal * 12,
                economiaPercentual: '0%',
                prazo: '1-2 meses',
                dificuldade: 'media',
                baseLegal: 'LC 116/2003, Art. 8-A (mínimo 2%); Art. 8, II (máximo 5%)',
                comoFazer: 'Consultar a legislação tributária municipal no site da prefeitura. '
                    + 'Verificar se há programa de incentivo, isenção para startups ou alíquota reduzida '
                    + 'para o código de serviço do CNAE.',
                riscos: ['Nem todos os municípios oferecem redução',
                    'Incentivos podem ter contrapartidas (empregos, investimento mínimo)'],
                economiaLiquida: economiaMensal * 12,
                custoImplementacao: 0,
                detalhes: {
                    issAtual: issAtual,
                    issMinimo: 2,
                    percISSNoDAS: percISS
                }
            };
        }

        /**
         * Ação 5: Sublimite ICMS — avaliar regime normal se RBT12 entre 3,6M e 4,8M
         * @private
         */
        function _acaoSublimiteICMS(resultado, d) {
            var rbt12 = d.receitaBrutaAnual || (d.receitaBrutaMensal * 12);
            if (rbt12 <= 3600000 || rbt12 > 4800000) return null;

            var estadoAtual = DadosEstado.getEstadoAtual();
            var icmsNormal = estadoAtual && estadoAtual.icms ? (estadoAtual.icms.padrao || 0.18) : 0.18;
            var aliqEf = resultado.aliquotaEfetiva ? resultado.aliquotaEfetiva.valor : 0;
            var faixa = resultado.aliquotaEfetiva ? resultado.aliquotaEfetiva.faixa : 1;
            var anexo = resultado.anexo ? resultado.anexo.anexo : 'I';

            var partReal = null;
            if (_IMPOST && _IMPOST.PARTILHA && _IMPOST.PARTILHA[anexo]) {
                var faixaIdx = Math.max(0, (faixa || 1) - 1);
                var partArr = _IMPOST.PARTILHA[anexo];
                if (faixaIdx < partArr.length) partReal = partArr[faixaIdx];
            }
            var percICMS = partReal ? (partReal.icms || 0) : 0.335;

            // Custo ICMS dentro do DAS
            var icmsNoDASMensal = d.receitaBrutaMensal * aliqEf * percICMS;
            // Custo ICMS regime normal (estimativa: alíquota estadual × valor agregado 40%)
            var icmsRegimeNormalMensal = d.receitaBrutaMensal * icmsNormal * 0.40;

            var diferencaMensal = icmsRegimeNormalMensal - icmsNoDASMensal;

            return {
                id: 'sublimite_icms',
                titulo: 'Sublimite ICMS — Avaliar impacto do regime normal',
                descricao: 'RBT12 de ' + Utils.formatarMoeda(rbt12) + ' excede o sublimite de R$ 3,6M. '
                    + 'ICMS e ISS serão recolhidos POR FORA do DAS. '
                    + 'Custo adicional estimado: ' + Utils.formatarMoeda(Math.abs(diferencaMensal)) + '/mês.',
                economiaAnual: 0,
                economiaPercentual: '0%',
                prazo: 'Automático',
                dificuldade: 'alta',
                baseLegal: 'LC 123/2006, Art. 19; Resolução CGSN 140/2018, Art. 9º a 12',
                comoFazer: 'Calcular ICMS nas regras normais do estado e comparar com a parcela que sairia do DAS. '
                    + 'Verificar créditos de ICMS disponíveis. '
                    + 'Avaliar se vale migrar para Lucro Presumido.',
                riscos: ['Custo total pode ser significativamente maior',
                    'Obrigações acessórias adicionais (SPED, EFD)',
                    'Necessidade de apuração mensal de ICMS fora do Simples'],
                economiaLiquida: 0,
                custoImplementacao: Math.abs(diferencaMensal) * 12,
                detalhes: {
                    rbt12: rbt12,
                    icmsNoDAS: icmsNoDASMensal,
                    icmsRegimeNormal: icmsRegimeNormalMensal,
                    aliquotaICMSEstadual: icmsNormal
                }
            };
        }

        /**
         * Ação 6: Monofásico — verificar e calcular exclusão do DAS
         * @private
         */
        function _acaoMonofasico(resultado, d) {
            var receitaMono = d.receitaMonofasica || 0;
            if (receitaMono <= 0) {
                // Se não informado, alertar sobre possibilidade
                var anexo = resultado.anexo ? resultado.anexo.anexo : 'III';
                if (anexo !== 'I') return null; // Monofásico é principalmente comércio

                return {
                    id: 'monofasico_verificar',
                    titulo: 'Verificar produtos monofásicos (PIS/COFINS zerados no DAS)',
                    descricao: 'Se a empresa revende produtos de tributação monofásica '
                        + '(farmácia, combustíveis, autopeças, bebidas, cosméticos), '
                        + 'PIS e COFINS devem ser ZERADOS no PGDAS-D.',
                    economiaAnual: 0,
                    economiaPercentual: '0%',
                    prazo: 'Próximo PGDAS-D',
                    dificuldade: 'baixa',
                    baseLegal: 'Lei 10.147/2000; Lei 10.865/2004; Resolução CGSN 140/2018, Art. 25-A',
                    comoFazer: 'Levantar NCMs dos produtos vendidos e verificar se estão na lista de tributação monofásica. '
                        + 'Se sim, segregar no PGDAS-D como "Revenda de mercadorias sujeitas à tributação monofásica".',
                    riscos: ['Classificação incorreta pode gerar diferença de tributo'],
                    economiaLiquida: 0,
                    custoImplementacao: 0,
                    detalhes: {}
                };
            }

            // Calcular economia com dados reais
            var rbt12 = d.receitaBrutaAnual || (d.receitaBrutaMensal * 12);
            var anexo = resultado.anexo ? resultado.anexo.anexo : 'I';
            var aliqEf = resultado.aliquotaEfetiva ? resultado.aliquotaEfetiva.valor : 0;
            var faixa = resultado.aliquotaEfetiva ? resultado.aliquotaEfetiva.faixa : 1;

            var partReal = null;
            if (_IMPOST && _IMPOST.PARTILHA && _IMPOST.PARTILHA[anexo]) {
                var faixaIdx = Math.max(0, (faixa || 1) - 1);
                var partArr = _IMPOST.PARTILHA[anexo];
                if (faixaIdx < partArr.length) partReal = partArr[faixaIdx];
            }

            var economiaMensal = 0;
            if (partReal && aliqEf > 0) {
                var percPISCOFINS = (partReal.pis || 0) + (partReal.cofins || 0);
                economiaMensal = receitaMono * aliqEf * percPISCOFINS;
            } else {
                economiaMensal = receitaMono * 0.0365;
            }

            if (economiaMensal <= 0) return null;

            return {
                id: 'monofasico_segregacao',
                titulo: 'Segregar receita monofásica — economia de PIS/COFINS no DAS',
                descricao: 'Receita monofásica de ' + Utils.formatarMoeda(receitaMono) + '/mês '
                    + 'gera economia de ' + Utils.formatarMoeda(economiaMensal) + '/mês ao zerar PIS/COFINS no PGDAS-D.',
                economiaAnual: economiaMensal * 12,
                economiaPercentual: (d.receitaBrutaMensal > 0)
                    ? ((economiaMensal / d.receitaBrutaMensal) * 100).toFixed(1).replace('.', ',') + '%' : '0%',
                prazo: 'Próximo PGDAS-D',
                dificuldade: 'baixa',
                baseLegal: 'Lei 10.147/2000; Lei 10.865/2004; Resolução CGSN 140/2018, Art. 25-A',
                comoFazer: 'No PGDAS-D, marcar receitas de revenda monofásica separadamente. '
                    + 'O sistema zerará automaticamente PIS e COFINS sobre essa parcela.',
                riscos: ['NCMs devem corresponder à lista oficial de produtos monofásicos',
                    'Manter notas fiscais de compra como suporte'],
                economiaLiquida: economiaMensal * 12,
                custoImplementacao: 0,
                detalhes: {
                    receitaMonofasica: receitaMono,
                    percPISCOFINS: partReal ? ((partReal.pis || 0) + (partReal.cofins || 0)) : 0.0365,
                    economiaMensal: economiaMensal
                }
            };
        }

        /**
         * Ação 7: Comparativo LP vs LR — chamar CompararRegimes e mostrar melhor regime
         * @private
         */
        function _acaoComparativoRegimes(resultado, d) {
            var rbt12 = d.receitaBrutaAnual || (d.receitaBrutaMensal * 12);
            var dasAnual = resultado.anual ? resultado.anual.dasAnual : 0;

            // Calcular LP simplificado
            var percPresIRPJ = _ehServico(d.cnae) ? 0.32 : 0.08;
            var percPresCSLL = _ehServico(d.cnae) ? 0.32 : 0.12;
            var baseIRPJ = rbt12 * percPresIRPJ;
            var baseCSLL = rbt12 * percPresCSLL;
            var irpjLP = baseIRPJ * 0.15;
            var adicionalIRPJ = Math.max(0, baseIRPJ - 240000) * 0.10;
            var csllLP = baseCSLL * 0.09;
            var pisLP = rbt12 * 0.0065;
            var cofinsLP = rbt12 * 0.03;
            var totalLP = irpjLP + adicionalIRPJ + csllLP + pisLP + cofinsLP;
            var aliqEfetivaLP = rbt12 > 0 ? totalLP / rbt12 : 0;

            // Calcular LR simplificado (margem 20%)
            var margemEstimada = 0.20;
            var lucroReal = rbt12 * margemEstimada;
            var irpjLR = lucroReal * 0.15;
            var adicionalLR = Math.max(0, lucroReal - 240000) * 0.10;
            var csllLR = lucroReal * 0.09;
            var pisLR = rbt12 * 0.0165;
            var cofinsLR = rbt12 * 0.076;
            var creditosPISCOFINS = (pisLR + cofinsLR) * 0.40;
            var totalLR = irpjLR + adicionalLR + csllLR + pisLR + cofinsLR - creditosPISCOFINS;
            var aliqEfetivaLR = rbt12 > 0 ? totalLR / rbt12 : 0;

            // Simples Nacional
            var aliqEfetivaSN = resultado.aliquotaEfetiva ? resultado.aliquotaEfetiva.valor : 0;

            // Identificar melhor regime
            var menorCarga = Math.min(dasAnual, totalLP, totalLR);
            var melhorRegime = 'Simples Nacional';
            var economiaRegime = 0;
            if (menorCarga === totalLP) {
                melhorRegime = 'Lucro Presumido';
                economiaRegime = dasAnual - totalLP;
            } else if (menorCarga === totalLR) {
                melhorRegime = 'Lucro Real';
                economiaRegime = dasAnual - totalLR;
            }

            return {
                id: 'comparativo_regimes',
                titulo: 'Comparativo: Simples Nacional × Lucro Presumido × Lucro Real',
                descricao: economiaRegime > 0
                    ? 'O regime ' + melhorRegime + ' pode ser mais econômico, '
                        + 'com economia estimada de ' + Utils.formatarMoeda(economiaRegime) + '/ano.'
                    : 'O Simples Nacional permanece como regime mais econômico para sua empresa.',
                economiaAnual: Math.max(0, economiaRegime),
                economiaPercentual: dasAnual > 0
                    ? ((Math.max(0, economiaRegime) / dasAnual) * 100).toFixed(1).replace('.', ',') + '%' : '0%',
                prazo: 'Início do ano-calendário',
                dificuldade: 'alta',
                baseLegal: 'LC 123/2006, Art. 16 (opção pelo SN); Lei 9.249/95 (LP); DL 1.598/77 (LR)',
                comoFazer: 'Solicitar estudo comparativo detalhado ao contador. '
                    + 'A mudança de regime só pode ser feita no início do ano-calendário (janeiro).',
                riscos: ['LP e LR exigem contabilidade completa e obrigações acessórias mais pesadas',
                    'Custos operacionais maiores (honorários contábeis, SPED)',
                    'Cálculo simplificado — valores reais dependem de análise aprofundada'],
                economiaLiquida: Math.max(0, economiaRegime),
                custoImplementacao: 0,
                detalhes: {
                    simplesNacional: {
                        cargaAnual: dasAnual,
                        aliquotaEfetiva: aliqEfetivaSN,
                        aliquotaEfetivaFormatada: Utils.formatarPercentual(aliqEfetivaSN)
                    },
                    lucroPresumido: {
                        cargaAnual: totalLP,
                        aliquotaEfetiva: aliqEfetivaLP,
                        aliquotaEfetivaFormatada: Utils.formatarPercentual(aliqEfetivaLP),
                        irpj: irpjLP + adicionalIRPJ,
                        csll: csllLP,
                        pis: pisLP,
                        cofins: cofinsLP
                    },
                    lucroReal: {
                        cargaAnual: totalLR,
                        aliquotaEfetiva: aliqEfetivaLR,
                        aliquotaEfetivaFormatada: Utils.formatarPercentual(aliqEfetivaLR),
                        irpj: irpjLR + adicionalLR,
                        csll: csllLR,
                        pisCofinsLiquido: pisLR + cofinsLR - creditosPISCOFINS,
                        creditosPISCOFINS: creditosPISCOFINS,
                        margemEstimada: margemEstimada
                    },
                    melhorRegime: melhorRegime,
                    economiaVsSN: economiaRegime
                }
            };
        }

        /**
         * Gera plano de ação COMPLETO a partir do diagnóstico e cálculo.
         * Prioriza ações por economia potencial (maior primeiro).
         *
         * @param {Object} [diagnosticoResult] — resultado do Diagnostico.executar
         * @param {Object} [calculoResult] — resultado do Calculadora.calcularTudo
         * @returns {Object} Plano de ação completo com ações priorizadas
         */
        function gerar(diagnosticoResult, calculoResult) {
            var calculo = calculoResult || Calculadora.calcularTudo();
            var diag = diagnosticoResult || Diagnostico.getUltimoDiagnostico();
            if (!diag) {
                diag = Diagnostico.executar(calculo);
            }

            var d = Formulario.getDados();
            var acoes = [];

            // ── Gerar ações de otimização concretas ──
            var acoesOtimizacao = [
                _acaoFatorROtimizacao,
                _acaoSegregacaoReceitas,
                _acaoDistribuicaoLucros,
                _acaoReducaoISS,
                _acaoSublimiteICMS,
                _acaoMonofasico,
                _acaoComparativoRegimes
            ];

            acoesOtimizacao.forEach(function (fn) {
                try {
                    var res = fn(calculo, d);
                    if (res) acoes.push(res);
                } catch (e) {
                    console.warn('[PlanoAcao] Erro ao gerar ação:', e.message);
                }
            });

            // ── Incorporar oportunidades do diagnóstico não cobertas ──
            (diag.oportunidades || []).forEach(function (op) {
                var jaExiste = acoes.some(function (a) {
                    return a.id === op.id || a.id === op.id.replace('_migracao', '_otimizacao');
                });
                if (!jaExiste && (op.economiaAnual || 0) > 0) {
                    acoes.push({
                        id: op.id,
                        titulo: op.titulo,
                        descricao: op.descricao,
                        economiaAnual: op.economiaAnual || 0,
                        economiaPercentual: '0%',
                        prazo: op.tempoImplementacao || 'A definir',
                        dificuldade: op.dificuldade || 'media',
                        baseLegal: op.baseLegal || '',
                        comoFazer: op.acao || '',
                        riscos: op.riscos ? (typeof op.riscos === 'string' ? [op.riscos] : op.riscos) : [],
                        economiaLiquida: op.retornoLiquido || op.economiaAnual || 0,
                        custoImplementacao: op.custoImplementacao || 0
                    });
                }
            });

            // ── Incorporar alertas urgentes ──
            (diag.alertas || []).forEach(function (al) {
                acoes.push({
                    id: al.id,
                    titulo: 'URGENTE — ' + al.titulo,
                    descricao: al.descricao,
                    economiaAnual: al.economiaAnual || 0,
                    economiaPercentual: '0%',
                    prazo: al.tempoImplementacao || 'Imediato',
                    dificuldade: al.dificuldade || 'media',
                    baseLegal: al.baseLegal || '',
                    comoFazer: al.acao || '',
                    riscos: al.riscos ? (typeof al.riscos === 'string' ? [al.riscos] : al.riscos) : [],
                    economiaLiquida: 0,
                    custoImplementacao: al.custoAdicionalAnual || 0,
                    _urgente: true
                });
            });

            // ── Ordenar por economia anual (maior primeiro), urgentes no topo ──
            acoes.sort(function (a, b) {
                if (a._urgente && !b._urgente) return -1;
                if (!a._urgente && b._urgente) return 1;
                return (b.economiaLiquida || b.economiaAnual || 0) - (a.economiaLiquida || a.economiaAnual || 0);
            });

            // Numerar
            acoes.forEach(function (a, i) { a.prioridade = i + 1; });

            // ── Classificar por cronograma ──
            var cronograma = {
                imediato: [],
                curtoPrazo: [],
                medioPrazo: [],
                acompanhamento: []
            };

            acoes.forEach(function (a) {
                var prazo = (a.prazo || '').toLowerCase();
                if (a._urgente || prazo.indexOf('imediato') >= 0 || prazo.indexOf('próximo') >= 0) {
                    cronograma.imediato.push(a);
                } else if (prazo.indexOf('1 mês') >= 0 || prazo.indexOf('baixa') >= 0) {
                    cronograma.curtoPrazo.push(a);
                } else if (prazo.indexOf('início') >= 0 || a.dificuldade === 'alta') {
                    cronograma.medioPrazo.push(a);
                } else {
                    cronograma.curtoPrazo.push(a);
                }
            });

            var economiaTotal = 0;
            acoes.forEach(function (a) { economiaTotal += (a.economiaLiquida || a.economiaAnual || 0); });

            _ultimoPlano = {
                resumo: acoes.length > 0
                    ? 'Identificamos ' + Utils.formatarMoeda(economiaTotal) + '/ano em economia potencial, '
                        + 'com ' + acoes.length + ' ação(ões) recomendadas ordenadas por impacto.'
                    : 'Nenhuma ação de otimização identificada com os dados informados.',
                economiaTotal: economiaTotal,
                economiaTotalFormatada: Utils.formatarMoeda(economiaTotal),
                totalAcoes: acoes.length,
                acoes: acoes,
                cronograma: cronograma,
                _meta: { geradoEm: new Date().toISOString(), versao: _VERSION }
            };

            Eventos.emit('planoAcao:gerado', _ultimoPlano);

            return _ultimoPlano;
        }

        /**
         * Atualiza status de uma ação.
         * @param {string|number} id — ID da ação
         * @param {string} novoStatus — 'pendente' | 'em_andamento' | 'concluido'
         * @returns {Object|null} Ação atualizada
         */
        function atualizarStatus(id, novoStatus) {
            if (!_ultimoPlano || !_ultimoPlano.acoes) return null;
            var statusValidos = ['pendente', 'em_andamento', 'concluido'];
            if (statusValidos.indexOf(novoStatus) === -1) return null;

            var acao = _ultimoPlano.acoes.find(function (a) { return a.id === id; });
            if (!acao) return null;

            acao.status = novoStatus;
            if (novoStatus === 'concluido') acao.concluidoEm = new Date().toISOString();

            Eventos.emit('planoAcao:statusAtualizado', { id: id, status: novoStatus, acao: acao });
            return acao;
        }

        /**
         * Retorna progresso do plano.
         * @returns {Object}
         */
        function getProgresso() {
            if (!_ultimoPlano || !_ultimoPlano.acoes) return { total: 0, concluidas: 0, percentual: 0 };
            var total = _ultimoPlano.acoes.length;
            var concluidas = _ultimoPlano.acoes.filter(function (a) { return a.status === 'concluido'; }).length;
            var emAndamento = _ultimoPlano.acoes.filter(function (a) { return a.status === 'em_andamento'; }).length;
            return {
                total: total,
                concluidas: concluidas,
                emAndamento: emAndamento,
                pendentes: total - concluidas - emAndamento,
                percentual: total > 0 ? Math.round((concluidas / total) * 100) : 0,
                economiaImplementada: _ultimoPlano.acoes
                    .filter(function (a) { return a.status === 'concluido'; })
                    .reduce(function (acc, a) { return acc + (a.economiaLiquida || a.economiaAnual || 0); }, 0)
            };
        }

        /**
         * Retorna último plano gerado.
         * @returns {Object|null}
         */
        function getUltimoPlano() {
            return _ultimoPlano;
        }

        return {
            gerar: gerar,
            atualizarStatus: atualizarStatus,
            getProgresso: getProgresso,
            getUltimoPlano: getUltimoPlano
        };
    })();


    // ═══════════════════════════════════════════════════════════════
    //  MÓDULO 12: EXPLICAÇÕES E CITAÇÕES LEGAIS
    //  Gera textos explicativos com citações legais para cada resultado
    //  Base legal: LC 123/2006; Resolução CGSN nº 140/2018
    // ═══════════════════════════════════════════════════════════════

    const Explicacoes = (function () {

        /**
         * Helper: formata valor como moeda, com fallback.
         * @param {number} v
         * @returns {string}
         * @private
         */
        function _fm(v) { return Utils.formatarMoeda(v || 0); }

        /**
         * Helper: formata valor como percentual, com fallback.
         * @param {number} v
         * @returns {string}
         * @private
         */
        function _fp(v) { return Utils.formatarPercentual(v || 0); }

        /**
         * Explica o enquadramento no Anexo do Simples Nacional.
         *
         * @param {Object} resultado — Objeto retornado por Calculadora.calcularTudo()
         * @returns {string} Texto explicativo com citações legais
         *
         * Base legal: Resolução CGSN nº 140/2018; LC 123/2006, Art. 18
         */
        function explicarAnexo(resultado) {
            if (!resultado || !resultado.anexo) return 'Dados insuficientes para explicar o enquadramento no anexo.';

            var a = resultado.anexo;
            var fr = resultado.fatorR;
            var aliq = resultado.aliquotaEfetiva;
            var emp = resultado.empresa || {};

            var texto = 'Sua empresa' + (emp.nome ? ' (' + emp.nome + ')' : '') + ' foi enquadrada no '
                + (a.nome || ('Anexo ' + a.anexo)) + ' do Simples Nacional';

            // Motivo do enquadramento
            if (fr && fr.valor != null && fr.valor > 0 && a.motivo && a.motivo.indexOf('Fator R') >= 0) {
                texto += ' porque o Fator R (' + fr.percentual + ') é '
                    + (fr.acimaDoLimiar ? 'superior ou igual' : 'inferior')
                    + ' ao limiar de 28%, conforme Resolução CGSN nº 140/2018, Art. 18, §5º-J.';
            } else {
                texto += ', conforme classificação da atividade CNAE ' + (emp.cnae || '')
                    + ' na Resolução CGSN nº 140/2018, Anexos VI e VII.';
            }

            // Tributos incluídos
            if (a.tributosDentro && a.tributosDentro.length > 0) {
                texto += ' Isso significa que os tributos ' + a.tributosDentro.join(', ')
                    + ' estão todos incluídos no DAS (guia única de pagamento)';
            }

            if (a.tributosFora && a.tributosFora.length > 0) {
                texto += ', enquanto ' + a.tributosFora.join(', ') + ' são recolhidos por fora';
            }

            // CPP
            if (a.cppInclusa === false) {
                texto += '. ATENÇÃO: a CPP (contribuição patronal previdenciária de 20% + RAT) NÃO está incluída no DAS e deve ser recolhida via GPS separada (LC 123/2006, Art. 18, §5º-C; Lei 8.212/1991, Art. 22)';
            }

            // Alíquota efetiva
            if (aliq && aliq.valor > 0) {
                texto += '. A alíquota efetiva resultante é de ' + aliq.formatada
                    + ' (' + aliq.faixaDescricao + ', alíquota nominal ' + aliq.aliquotaNominalFormatada
                    + ' com dedução de ' + _fm(aliq.parcelaADeduzir)
                    + '), conforme LC 123/2006, Art. 18, §1º.';
            } else {
                texto += '.';
            }

            return texto;
        }

        /**
         * Explica o cálculo do Fator R e suas consequências.
         *
         * @param {Object} resultado — Objeto retornado por Calculadora.calcularTudo()
         * @returns {string} Texto explicativo
         *
         * Base legal: LC 123/2006, Art. 18, §24; Resolução CGSN 140/2018, Art. 18, §5º-J
         */
        function explicarFatorR(resultado) {
            if (!resultado || !resultado.fatorR) return 'Dados insuficientes para explicar o Fator R.';

            var fr = resultado.fatorR;
            var emp = resultado.empresa || {};
            var folha12 = emp.folhaAnual || (emp.folhaMensal || 0) * 12;
            var rbt12 = emp.receitaAnual || 0;

            var texto = 'O Fator R é a razão entre a folha de salários dos últimos 12 meses e a receita bruta '
                + 'do mesmo período (LC 123/2006, Art. 18, §24). ';

            if (rbt12 > 0 && folha12 >= 0) {
                texto += 'Sua folha de ' + _fm(folha12)
                    + ' sobre receita de ' + _fm(rbt12)
                    + ' resulta em Fator R = ' + fr.percentual + '. ';
            }

            if (fr.valor != null && fr.valor > 0) {
                if (fr.acimaDoLimiar) {
                    texto += 'Como é ≥ 28%, você paga pelo Anexo III (alíquotas menores) ao invés do Anexo V '
                        + '(Resolução CGSN 140/2018, Art. 18, §5º-J). ';
                    texto += 'Isso representa uma VANTAGEM tributária, pois o Anexo III tem alíquotas efetivas '
                        + 'significativamente menores que o Anexo V para a mesma faixa de receita.';
                } else {
                    texto += 'Como é < 28%, você paga pelo Anexo V (alíquotas maiores). ';
                    texto += 'Para migrar ao Anexo III e reduzir o imposto, seria necessário aumentar a folha '
                        + 'de pagamento (pró-labore ou contratações) até que o Fator R atinja pelo menos 28%.';
                }

                // Zona de risco
                if (fr.valor >= 0.25 && fr.valor < 0.31) {
                    texto += ' ALERTA: seu Fator R está na zona de risco (entre 25% e 31%). '
                        + 'Pequenas variações mensais na folha ou receita podem mudar o anexo aplicável, '
                        + 'causando oscilação no valor do DAS. Planeje com cuidado.';
                }
            } else {
                texto += 'Não há dados de folha de pagamento suficientes para calcular o Fator R. '
                    + 'Se sua atividade depende do Fator R, informe o valor da folha mensal.';
            }

            return texto;
        }

        /**
         * Explica as economias identificadas e como alcançá-las.
         *
         * @param {Object} resultado — Objeto retornado por Calculadora.calcularTudo()
         * @returns {string} Texto explicativo detalhado com base legal
         *
         * Base legal: múltiplas (citadas no texto)
         */
        function explicarEconomia(resultado) {
            if (!resultado) return 'Dados insuficientes para explicar economias.';

            var eco = resultado.economiaTotal;
            var otim = resultado.otimizacaoFatorR;
            var das = resultado.dasMensal;

            if (!eco || eco.fontes.length === 0) {
                return 'Com os dados informados, não foram identificadas otimizações adicionais significativas. '
                    + 'O DAS já está sendo calculado na menor alíquota possível para seu enquadramento atual. '
                    + 'Verifique se há receitas de produtos monofásicos, exportação ou ISS retido na fonte '
                    + 'que possam ser segregadas para reduzir o valor do DAS.';
            }

            var texto = 'ECONOMIA TOTAL IDENTIFICADA: ' + eco.economiaAnualFormatada + '/ano ('
                + eco.economiaMensalFormatada + '/mês). ';
            texto += 'Detalhamento das fontes de economia:\n\n';

            eco.fontes.forEach(function (f, idx) {
                texto += (idx + 1) + ') ' + f.fonte + ': '
                    + _fm(f.valorAnual) + '/ano (' + _fm(f.valorMensal) + '/mês). '
                    + 'Base legal: ' + f.baseLegal + '.\n';
            });

            // Detalhamento da otimização DAS
            if (das && das.comOtimizacao && das.comOtimizacao.deducoes && das.comOtimizacao.deducoes.length > 0) {
                texto += '\nDeduções aplicadas no DAS otimizado:\n';
                das.comOtimizacao.deducoes.forEach(function (d) {
                    texto += '  - ' + (d.descricao || d.tipo || 'Dedução') + ': '
                        + _fm(d.economia || d.valor || 0)
                        + (d.baseLegal ? ' (' + d.baseLegal + ')' : '') + '\n';
                });
            }

            // Otimização Fator R
            if (otim && otim.aplicavel && !otim.jaOtimizado) {
                texto += '\nOtimização do Fator R: ';
                if (otim.valeAPena) {
                    texto += 'Aumentando a folha de pagamento em ' + _fm(otim.aumentoNecessario)
                        + '/mês, o Fator R atinge 28% e a empresa migra do Anexo V para o Anexo III. '
                        + 'Economia líquida estimada: ' + _fm(otim.economiaLiquida) + '/ano '
                        + '(LC 123/2006, Art. 18, §24).';
                } else {
                    texto += 'O custo para atingir o Fator R de 28% (' + _fm(otim.aumentoNecessario)
                        + '/mês adicional na folha) supera a economia de DAS. '
                        + 'Neste caso, não compensa aumentar a folha apenas para trocar de anexo.';
                }
            }

            return texto;
        }

        /**
         * Explica o ISS municipal aplicável.
         *
         * @param {Object} resultado — Objeto retornado por Calculadora.calcularTudo()
         * @returns {string} Texto explicativo sobre ISS
         *
         * Base legal: LC 116/2003, Art. 8-A (mínimo 2%); Art. 8, II (máximo 5%)
         */
        function explicarISS(resultado) {
            if (!resultado) return 'Dados insuficientes para explicar o ISS.';

            var emp = resultado.empresa || {};
            var anexo = resultado.anexo || {};
            var das = resultado.dasMensal || {};
            var munAtual = DadosMunicipio.getMunicipioAtual();
            var issAliq = munAtual ? munAtual.iss.aliquota : 5.00;
            var issConhecido = munAtual ? munAtual.iss.issConhecido : false;

            var texto = 'O ISS (Imposto sobre Serviços) é um tributo municipal com alíquota entre 2% e 5% '
                + '(LC 116/2003, Art. 8-A e Art. 8, II). ';

            if (emp.municipio) {
                texto += 'Para ' + emp.municipio + '/' + emp.uf + ', ';
                if (issConhecido) {
                    texto += 'a alíquota cadastrada no sistema é de ' + issAliq.toFixed(2).replace('.', ',') + '%. ';
                } else {
                    texto += 'foi utilizada a alíquota padrão de ' + issAliq.toFixed(2).replace('.', ',')
                        + '% (teto legal). Consulte a legislação municipal para verificar se há alíquota menor. ';
                }
            }

            // ISS no Simples
            if (anexo.tributosDentro && anexo.tributosDentro.indexOf('ISS') >= 0) {
                texto += 'No Simples Nacional, o ISS está INCLUÍDO no DAS — você não paga separadamente. ';
                texto += 'A parcela do ISS dentro do DAS é calculada conforme a partilha do '
                    + (anexo.nome || 'anexo aplicável') + ' (Resolução CGSN 140/2018).';
            }

            // Sublimite
            if (resultado.aliquotaEfetiva && resultado.empresa) {
                var rbt12 = emp.receitaAnual || 0;
                if (rbt12 > 3600000) {
                    texto += ' ATENÇÃO: como a receita anual (' + _fm(rbt12)
                        + ') excede o sublimite de R$ 3.600.000 (LC 123/2006, Art. 19), '
                        + 'o ISS é recolhido POR FORA do DAS, nas regras normais do município.';
                }
            }

            // ISS retido na fonte
            if (das.semOtimizacao && das.semOtimizacao.partilha && das.semOtimizacao.partilha.iss) {
                texto += ' Se houver ISS retido na fonte pelo tomador do serviço, '
                    + 'esse valor é deduzido da parcela do ISS no DAS (Resolução CGSN 140/2018, Art. 27).';
            }

            return texto;
        }

        /**
         * Explica a CPP (Contribuição Patronal Previdenciária) e seu tratamento no Simples.
         *
         * @param {Object} resultado — Objeto retornado por Calculadora.calcularTudo()
         * @returns {string} Texto explicativo sobre CPP
         *
         * Base legal: LC 123/2006, Art. 18, §5º-B e §5º-C; Lei 8.212/1991, Art. 22
         */
        function explicarCPP(resultado) {
            if (!resultado) return 'Dados insuficientes para explicar a CPP.';

            var anexo = resultado.anexo || {};
            var das = resultado.dasMensal || {};
            var emp = resultado.empresa || {};

            var texto = 'A CPP (Contribuição Patronal Previdenciária) é a contribuição de 20% sobre a folha '
                + 'de pagamento devida pelo empregador ao INSS (Lei 8.212/1991, Art. 22, I). ';

            if (anexo.cppInclusa === false || anexo.anexo === 'IV') {
                // Anexo IV — CPP fora
                texto += 'Para atividades do Anexo IV (como construção civil, vigilância, limpeza e conservação), '
                    + 'a CPP NÃO está incluída no DAS e deve ser recolhida separadamente via GPS '
                    + '(LC 123/2006, Art. 18, §5º-C). ';
                texto += 'O valor é de 20% (INSS patronal) + '
                    + (_IMPOST ? (_IMPOST.ALIQUOTA_RAT_PADRAO * 100).toFixed(0) : '2') + '% (RAT) = '
                    + (_IMPOST ? ((_IMPOST.ALIQUOTA_INSS_PATRONAL_ANEXO_IV + _IMPOST.ALIQUOTA_RAT_PADRAO) * 100).toFixed(0) : '22')
                    + '% sobre a folha de pagamento. ';

                var folha = emp.folhaMensal || 0;
                if (folha > 0) {
                    var aliqCPP = _IMPOST ? (_IMPOST.ALIQUOTA_INSS_PATRONAL_ANEXO_IV + _IMPOST.ALIQUOTA_RAT_PADRAO) : 0.22;
                    var cppMensal = folha * aliqCPP;
                    texto += 'Com sua folha de ' + _fm(folha) + '/mês, o custo adicional da CPP é de '
                        + _fm(cppMensal) + '/mês (' + _fm(cppMensal * 12) + '/ano), '
                        + 'que se SOMA ao valor do DAS.';
                }
            } else {
                // CPP inclusa no DAS
                texto += 'Nos Anexos I, II, III e V, a CPP está INCLUÍDA no DAS — você não paga separadamente. '
                    + 'A parcela da CPP dentro do DAS é calculada conforme a partilha do '
                    + (anexo.nome || 'anexo aplicável') + ' (Resolução CGSN 140/2018). ';
                texto += 'Essa é uma das grandes vantagens do Simples Nacional: a CPP não representa '
                    + 'um custo adicional de 20%+ sobre a folha como nos demais regimes.';
            }

            // FGTS
            texto += '\n\nImportante: o FGTS (8% sobre a folha) NUNCA está incluído no DAS, '
                + 'independentemente do anexo. Deve ser recolhido mensalmente via GRF '
                + '(Lei 8.036/1990, Art. 15).';

            return texto;
        }

        /**
         * Explica uma vedação ao Simples Nacional.
         *
         * @param {Object} impedimento — Objeto de impedimento com { descricao, baseLegal }
         * @returns {string} Texto explicativo sobre a vedação
         *
         * Base legal: LC 123/2006, Art. 17
         */
        function explicarVedacao(impedimento) {
            if (!impedimento) return 'Nenhum impedimento informado.';

            var descricao = typeof impedimento === 'string' ? impedimento : (impedimento.descricao || impedimento.impedimento || '');
            var baseLegal = impedimento.baseLegal || 'LC 123/2006, Art. 17';

            var texto = 'IMPEDIMENTO AO SIMPLES NACIONAL: ' + descricao + '. ';
            texto += 'Base legal: ' + baseLegal + '. ';

            texto += '\n\nA LC 123/2006 estabelece uma série de vedações ao Simples Nacional (Art. 17), '
                + 'incluindo: receita acima do limite, atividades vedadas, existência de sócio pessoa jurídica, '
                + 'débitos fiscais pendentes, entre outros. ';

            texto += 'Se este impedimento se aplica à sua empresa, será necessário optar pelo '
                + 'Lucro Presumido (Lei 9.249/1995) ou Lucro Real (DL 1.598/1977). ';

            texto += 'Recomendamos consultar um contador para verificar se há alternativas '
                + 'ou se o impedimento pode ser sanado (ex: regularizar débitos, alterar composição societária).';

            return texto;
        }

        /**
         * Explica a possibilidade de enquadramento como MEI.
         *
         * @param {Object} resultado — Objeto retornado por Calculadora.calcularTudo()
         * @returns {string} Texto explicativo sobre MEI
         *
         * Base legal: LC 123/2006, Art. 18-A
         */
        function explicarMEI(resultado) {
            if (!resultado) return 'Dados insuficientes para explicar o MEI.';

            var emp = resultado.empresa || {};
            var rbt12 = emp.receitaAnual || 0;
            var mei = resultado.mei;

            if (!mei || !mei.elegivel) {
                var texto = 'O MEI (Microempreendedor Individual) é a forma mais econômica de formalização, '
                    + 'com valor fixo mensal em torno de R$ 75 a R$ 86 (INSS + ISS/ICMS). '
                    + 'Base legal: LC 123/2006, Art. 18-A. ';

                if (rbt12 > 81000) {
                    texto += 'Sua receita anual de ' + _fm(rbt12)
                        + ' excede o limite do MEI (R$ 81.000/ano). '
                        + 'A opção pelo MEI não é possível neste caso.';
                } else if ((emp.socios || []).length > 1) {
                    texto += 'O MEI não permite sócios. Como sua empresa possui mais de um sócio, '
                        + 'a opção pelo MEI não é possível.';
                }

                return texto;
            }

            // MEI elegível
            var texto = 'ÓTIMA NOTÍCIA! Sua empresa pode se enquadrar como MEI (Microempreendedor Individual). ';
            texto += 'Com receita anual de ' + _fm(rbt12)
                + ' (dentro do limite de R$ 81.000/ano), o MEI oferece: ';
            texto += '\n- Valor fixo mensal (INSS + ISS/ICMS), sem cálculo sobre faturamento; ';
            texto += '\n- Sem necessidade de contador obrigatório; ';
            texto += '\n- Emissão simplificada de NF; ';
            texto += '\n- Cobertura previdenciária (aposentadoria, auxílio-doença, etc.). ';

            // Dados do MEI
            if (mei.dados && Object.keys(mei.dados).length > 0) {
                var meiData = mei.dados;
                if (meiData.valorMensal) {
                    texto += '\nValor mensal estimado: ' + _fm(meiData.valorMensal) + '. ';
                }
                if (meiData.limiteAnual) {
                    texto += 'Limite anual: ' + _fm(meiData.limiteAnual) + '. ';
                }
            }

            texto += '\nBase legal: LC 123/2006, Art. 18-A. ';

            // Comparação com Simples
            var das = resultado.dasMensal;
            if (das && das.semOtimizacao && das.semOtimizacao.valor > 0) {
                texto += '\nComparação: no Simples Nacional (regime atual simulado), seu DAS mensal seria de '
                    + _fm(das.semOtimizacao.valor) + '. Como MEI, o custo mensal seria fixo e '
                    + 'significativamente menor. Considere esta opção.';
            }

            return texto;
        }

        /**
         * Explica a distribuição de lucros isenta.
         *
         * @param {Object} resultado — Objeto retornado por Calculadora.calcularTudo()
         * @returns {string} Texto explicativo sobre distribuição de lucros
         *
         * Base legal: LC 123/2006, Art. 14; ADI SRF 04/2007; Lei 15.270/2025
         */
        function explicarDistribuicaoLucros(resultado) {
            if (!resultado || !resultado.distribuicaoLucros) return 'Dados insuficientes para explicar a distribuição de lucros.';

            var dist = resultado.distribuicaoLucros;
            var emp = resultado.empresa || {};

            var texto = 'DISTRIBUIÇÃO DE LUCROS ISENTA DO SIMPLES NACIONAL\n\n';
            texto += 'No Simples Nacional, os lucros distribuídos aos sócios são ISENTOS de Imposto de Renda, '
                + 'desde que respeitado o limite legal (LC 123/2006, Art. 14; ADI SRF nº 04/2007). ';

            texto += '\n\nModalidade utilizada: ' + (dist.modalidade === 'contabil' ? 'Escrituração contábil (lucro efetivo)' : 'Presunção de lucro') + '. ';

            if (dist.percentualPresuncao) {
                texto += 'Percentual de presunção aplicado: ' + dist.percentualPresuncaoFormatado
                    + ' sobre a receita bruta. ';
            }

            texto += 'Valor distribuível isento total: ' + _fm(dist.lucroDistribuivel) + '/ano. ';

            if (dist.porSocio && dist.porSocio.length > 0) {
                texto += '\n\nDistribuição por sócio:';
                dist.porSocio.forEach(function (s) {
                    texto += '\n  - ' + (s.nome || 'Sócio') + ' ('
                        + _fp(s.percentual) + '): ' + _fm(s.valorIsento || s.lucroIsento || s.valor || 0) + '/ano';
                });
            }

            // Alerta dividendos 2026
            if (resultado.dividendos2026) {
                texto += '\n\nATENÇÃO — Tributação de Dividendos 2026 (Lei 15.270/2025): '
                    + 'A nova legislação pode impor retenção de IRRF sobre dividendos que excedam '
                    + 'determinado limite mensal. Verifique o impacto na aba de dividendos.';
            }

            if (dist.alertas && dist.alertas.length > 0) {
                texto += '\n\nAlertas:';
                dist.alertas.forEach(function (a) {
                    texto += '\n  ⚠ ' + (typeof a === 'string' ? a : a.mensagem || a);
                });
            }

            return texto;
        }

        // ──────────────────────────────────────────
        //  EXPLICAÇÕES DE OTIMIZAÇÃO (Parte 2)
        //  Cada estratégia: textoLeigo, textoTecnico, baseLegal, exemploNumerico
        // ──────────────────────────────────────────

        /**
         * Gera explicação completa de uma estratégia de otimização.
         * @param {string} estrategia — ID da estratégia
         * @param {Object} resultado — dados de calcularTudo()
         * @param {Object} [acaoPlano] — ação do PlanoAcao com detalhes calculados
         * @returns {Object} { textoLeigo, textoTecnico, baseLegal, exemploNumerico }
         */
        function explicarOtimizacao(estrategia, resultado, acaoPlano) {
            var explicadores = {
                'fator_r_otimizacao': _explicarOtimFatorR,
                'segregacao_receitas': _explicarOtimSegregacao,
                'distribuicao_lucros': _explicarOtimDistribuicao,
                'reducao_iss': _explicarOtimISS,
                'sublimite_icms': _explicarOtimSublimite,
                'monofasico_segregacao': _explicarOtimMonofasico,
                'comparativo_regimes': _explicarOtimComparativo
            };
            var fn = explicadores[estrategia];
            if (!fn) return {
                textoLeigo: 'Estratégia não reconhecida: ' + estrategia,
                textoTecnico: '',
                baseLegal: '',
                exemploNumerico: ''
            };
            return fn(resultado, acaoPlano);
        }

        /** @private */
        function _explicarOtimFatorR(resultado, acao) {
            var det = (acao && acao.detalhes) || {};
            var emp = resultado.empresa || {};
            return {
                textoLeigo: 'O Fator R é uma conta simples: quanto sua empresa gasta com salários '
                    + 'dividido pelo faturamento. Se esse número chega a 28%, você paga menos imposto '
                    + 'porque muda para uma tabela mais barata (Anexo III ao invés do V). '
                    + 'Na prática, é como se aumentar o salário do dono "devolvesse" dinheiro via redução de imposto.',
                textoTecnico: 'O Fator R (Art. 18, §24, LC 123/2006) é a razão entre a massa salarial dos últimos 12 meses '
                    + '(incluindo pró-labore, FGTS, 13º, férias) e a RBT12. Quando FR ≥ 28%, atividades listadas '
                    + 'no Anexo V migram automaticamente para o Anexo III (Resolução CGSN 140/2018, Art. 18, §5º-J). '
                    + 'O cálculo deve ser feito mês a mês, considerando a folha acumulada.',
                baseLegal: 'LC 123/2006, Art. 18, §5º-J, §5º-M e §24; '
                    + 'Resolução CGSN nº 140/2018, Art. 18, §5º-J e Art. 25-A, §1º, II; '
                    + 'LC 155/2016 (introduziu o Fator R em substituição ao antigo Anexo VI)',
                exemploNumerico: 'Dados da empresa: Receita anual ' + _fm(emp.receitaAnual || 0)
                    + ', folha atual ' + _fm(emp.folhaMensal || 0) + '/mês.\n'
                    + 'Fator R atual: ' + (resultado.fatorR ? resultado.fatorR.percentual : 'N/D') + '\n'
                    + (det.proLaboreIdeal ? ('Pró-labore ideal: ' + _fm(det.proLaboreIdeal) + '/mês\n') : '')
                    + (det.dasAtualMensal ? ('DAS atual (Anexo ' + (det.anexoAtual || 'V') + '): ' + _fm(det.dasAtualMensal) + '/mês\n') : '')
                    + (det.dasNovoMensal ? ('DAS novo (Anexo III): ' + _fm(det.dasNovoMensal) + '/mês\n') : '')
                    + (acao ? ('Economia líquida: ' + _fm(acao.economiaLiquida) + '/ano') : '')
            };
        }

        /** @private */
        function _explicarOtimSegregacao(resultado, acao) {
            return {
                textoLeigo: 'Se sua empresa faz atividades diferentes (ex: vende produtos E presta serviços), '
                    + 'cada tipo de receita pode ser tributado numa tabela diferente. '
                    + 'Separar corretamente pode reduzir o imposto porque comércio (Anexo I) '
                    + 'geralmente tem alíquota menor que serviço (Anexo III ou V).',
                textoTecnico: 'A segregação de receitas no PGDAS-D (Resolução CGSN 140/2018, Art. 25, §1º a §3º) '
                    + 'exige que cada parcela de receita seja classificada conforme o CNAE da atividade efetivamente exercida. '
                    + 'Atividades de comércio (Anexo I, alíquota inicial 4%) têm carga significativamente menor '
                    + 'que serviços (Anexo III/V, alíquota inicial 6%/15,5%). '
                    + 'A receita de cada atividade deve corresponder a notas fiscais segregadas.',
                baseLegal: 'Resolução CGSN 140/2018, Art. 25, §1º a §3º; LC 123/2006, Art. 18, §4º',
                exemploNumerico: acao && acao.detalhes && acao.detalhes.receitasSegregaveis
                    ? 'Receitas segregáveis identificadas:\n' + acao.detalhes.receitasSegregaveis.map(function (r) {
                        return '  - CNAE ' + Utils.formatarCNAE(r.cnae) + ' → Anexo ' + r.anexo
                            + ': ' + _fm(r.receita) + '/mês (economia: ' + _fm(r.economia) + '/mês)';
                    }).join('\n')
                    + '\nEconomia total: ' + _fm(acao.economiaAnual) + '/ano'
                    : 'Dados insuficientes para exemplo numérico.'
            };
        }

        /** @private */
        function _explicarOtimDistribuicao(resultado, acao) {
            var det = (acao && acao.detalhes) || {};
            return {
                textoLeigo: 'Os sócios podem retirar dinheiro da empresa de duas formas: como salário (pró-labore) '
                    + 'ou como lucro. O salário tem desconto de INSS (11%), mas o lucro é ISENTO de imposto de renda. '
                    + 'Portanto, manter o pró-labore no mínimo (1 salário mínimo) e retirar o restante como lucro '
                    + 'pode gerar economia significativa.',
                textoTecnico: 'A distribuição de lucros isenta de IRRF no Simples Nacional está prevista no Art. 14 da LC 123/2006 '
                    + 'e na ADI SRF nº 04/2007. O limite sem escrituração contábil é calculado pela presunção de lucro '
                    + '(mesmos percentuais do Lucro Presumido: 8% comércio, 32% serviços), deduzido o DAS. '
                    + 'Com escrituração contábil completa (livro caixa ou contabilidade formal), '
                    + 'todo o lucro apurado pode ser distribuído isento.',
                baseLegal: 'Art. 10, Lei 9.249/1995; Art. 14, LC 123/2006; '
                    + 'ADI SRF nº 04/2007; IN RFB 1.251/2012, Art. 2º',
                exemploNumerico: det.lucroDistribuivelIsento
                    ? 'Lucro distribuível isento (presunção ' + ((det.percPresuncao || 0.32) * 100).toFixed(0) + '%): '
                        + _fm(det.lucroDistribuivelIsento) + '/ano\n'
                        + (det.porSocio ? det.porSocio.map(function (s) {
                            return '  - ' + s.nome + ' (' + _fp(s.percentual) + '): ' + _fm(s.valorIsento) + '/ano';
                        }).join('\n') : '')
                        + '\nEconomia de INSS: ' + _fm(acao ? acao.economiaLiquida : 0) + '/ano'
                    : 'Informe dados dos sócios para cálculo.'
            };
        }

        /** @private */
        function _explicarOtimISS(resultado, acao) {
            return {
                textoLeigo: 'O ISS é um imposto municipal sobre serviços. A lei diz que a alíquota mínima é 2% '
                    + 'e a máxima é 5%. Muitas empresas pagam 5% sem verificar se o município oferece desconto. '
                    + 'Vale consultar a prefeitura para ver se há incentivo.',
                textoTecnico: 'O ISS é regido pela LC 116/2003, com alíquota mínima de 2% (Art. 8-A, incluído pela LC 157/2016) '
                    + 'e máxima de 5% (Art. 8, II). No Simples Nacional, o ISS está dentro do DAS e a partilha '
                    + 'depende do anexo e faixa de receita. Municípios com leis de incentivo fiscal podem oferecer '
                    + 'alíquotas de 2% a 3% para determinados CNAEs. '
                    + 'ISS retido na fonte pelo tomador é dedutível do DAS (Resolução CGSN 140/2018, Art. 27).',
                baseLegal: 'LC 116/2003, Art. 8-A (mínimo 2%); Art. 8, II (máximo 5%); '
                    + 'LC 157/2016; Resolução CGSN 140/2018, Art. 27',
                exemploNumerico: acao && acao.detalhes
                    ? 'ISS atual: ' + (acao.detalhes.issAtual || 5).toFixed(2).replace('.', ',') + '%\n'
                        + 'ISS mínimo legal: 2%\n'
                        + 'Economia potencial (se reduzir para 2%): ' + _fm(acao.economiaAnual) + '/ano'
                    : 'Consulte a legislação municipal para alíquota real.'
            };
        }

        /** @private */
        function _explicarOtimSublimite(resultado, acao) {
            var det = (acao && acao.detalhes) || {};
            return {
                textoLeigo: 'Quando a empresa fatura mais de R$ 3,6 milhões por ano, o ICMS e o ISS saem do boleto '
                    + 'único (DAS) e passam a ser pagos separadamente, como empresas de fora do Simples. '
                    + 'Isso pode aumentar bastante o custo. É importante calcular o impacto.',
                textoTecnico: 'Acima do sublimite estadual de R$ 3.600.000 (LC 123/2006, Art. 19), '
                    + 'o ICMS e o ISS passam a ser recolhidos fora do DAS, nas regras normais. '
                    + 'O contribuinte deve apurar ICMS pela legislação estadual (alíquota + ICMS-ST) '
                    + 'e ISS pela legislação municipal. Os demais tributos (IRPJ, CSLL, PIS, COFINS, CPP) '
                    + 'permanecem no DAS. Pode compensar migrar para LP se a carga ICMS fora do DAS for alta.',
                baseLegal: 'LC 123/2006, Art. 19 e Art. 20; Resolução CGSN 140/2018, Art. 9º a 12',
                exemploNumerico: det.rbt12
                    ? 'RBT12: ' + _fm(det.rbt12) + ' (excede sublimite de R$ 3.600.000)\n'
                        + 'ICMS dentro do DAS (estimado): ' + _fm(det.icmsNoDAS) + '/mês\n'
                        + 'ICMS regime normal (estimado): ' + _fm(det.icmsRegimeNormal) + '/mês\n'
                        + 'Alíquota ICMS estadual: ' + ((det.aliquotaICMSEstadual || 0.18) * 100).toFixed(0) + '%'
                    : 'Receita dentro do sublimite — sem impacto.'
            };
        }

        /** @private */
        function _explicarOtimMonofasico(resultado, acao) {
            return {
                textoLeigo: 'Alguns produtos (remédios, combustíveis, bebidas, cosméticos, autopeças) já tiveram '
                    + 'o PIS e COFINS pagos pelo fabricante. Quando sua empresa REVENDE esses produtos, '
                    + 'não precisa pagar PIS e COFINS de novo. No boleto do Simples (DAS), esses impostos '
                    + 'são zerados para essa parte da receita. Muita gente não sabe e paga a mais!',
                textoTecnico: 'A tributação monofásica (ou concentrada) aplica-se a produtos listados nas Leis '
                    + '10.147/2000, 10.485/2002, 10.833/2003 e 10.865/2004. O contribuinte substituto '
                    + '(fabricante/importador) recolhe PIS e COFINS com alíquotas majoradas, e os demais '
                    + 'da cadeia (distribuidores e varejistas) têm alíquota zero. '
                    + 'No PGDAS-D, essa receita deve ser segregada como "Revenda de mercadorias sujeitas '
                    + 'à tributação monofásica de PIS/PASEP e COFINS" (Resolução CGSN 140/2018, Art. 25-A). '
                    + 'O ICMS e demais tributos continuam sendo calculados normalmente.',
                baseLegal: 'Lei 10.147/2000; Lei 10.485/2002; Lei 10.865/2004; '
                    + 'Resolução CGSN 140/2018, Art. 25-A; Solução de Consulta COSIT nº 84/2016',
                exemploNumerico: acao && acao.detalhes
                    ? 'Receita monofásica: ' + _fm(acao.detalhes.receitaMonofasica) + '/mês\n'
                        + 'PIS+COFINS na partilha: ' + _fp(acao.detalhes.percPISCOFINS || 0) + '\n'
                        + 'Economia mensal: ' + _fm(acao.detalhes.economiaMensal) + '\n'
                        + 'Economia anual: ' + _fm((acao.detalhes.economiaMensal || 0) * 12)
                    : 'Informe receita de produtos monofásicos para calcular.'
            };
        }

        /** @private */
        function _explicarOtimComparativo(resultado, acao) {
            var det = (acao && acao.detalhes) || {};
            return {
                textoLeigo: 'Existem 3 formas de pagar imposto: Simples Nacional (boleto único), '
                    + 'Lucro Presumido (o governo estima quanto você lucra) e Lucro Real (paga sobre o lucro de verdade). '
                    + 'Cada forma tem vantagens dependendo do tamanho da empresa, do tipo de atividade e da margem de lucro. '
                    + 'A comparação mostra qual é o mais barato para você.',
                textoTecnico: 'SN: DAS unificado com alíquota progressiva (LC 123/2006, Anexos I a V). '
                    + 'LP: IRPJ 15% + adicional 10% sobre base presumida (Lei 9.249/95, Art. 15); '
                    + 'CSLL 9% sobre base presumida (Art. 20); PIS 0,65% e COFINS 3% cumulativo. '
                    + 'LR: IRPJ 15% + adicional 10% sobre lucro real (DL 1.598/77); '
                    + 'CSLL 9%; PIS 1,65% e COFINS 7,6% não cumulativo com creditamento (Lei 10.637/02, 10.833/03). '
                    + 'LP é vantajoso para margens altas (>20%); LR para margens baixas (<15%) ou com muitos créditos.',
                baseLegal: 'LC 123/2006, Art. 16 (SN); Lei 9.249/95, Art. 15-16 (LP); '
                    + 'DL 1.598/77, Lei 10.637/02, Lei 10.833/03 (LR)',
                exemploNumerico: det.simplesNacional
                    ? 'SIMPLES NACIONAL:\n  Carga anual: ' + _fm(det.simplesNacional.cargaAnual)
                        + '\n  Alíquota efetiva: ' + (det.simplesNacional.aliquotaEfetivaFormatada || 'N/D')
                        + '\n\nLUCRO PRESUMIDO:\n  IRPJ: ' + _fm(det.lucroPresumido.irpj)
                        + '\n  CSLL: ' + _fm(det.lucroPresumido.csll)
                        + '\n  PIS: ' + _fm(det.lucroPresumido.pis)
                        + '\n  COFINS: ' + _fm(det.lucroPresumido.cofins)
                        + '\n  Total: ' + _fm(det.lucroPresumido.cargaAnual)
                        + '\n  Alíquota efetiva: ' + (det.lucroPresumido.aliquotaEfetivaFormatada || 'N/D')
                        + '\n\nLUCRO REAL (margem ' + ((det.lucroReal.margemEstimada || 0.20) * 100).toFixed(0) + '%):\n'
                        + '  IRPJ: ' + _fm(det.lucroReal.irpj)
                        + '\n  CSLL: ' + _fm(det.lucroReal.csll)
                        + '\n  PIS+COFINS líquido: ' + _fm(det.lucroReal.pisCofinsLiquido)
                        + '\n  Créditos: -' + _fm(det.lucroReal.creditosPISCOFINS)
                        + '\n  Total: ' + _fm(det.lucroReal.cargaAnual)
                        + '\n  Alíquota efetiva: ' + (det.lucroReal.aliquotaEfetivaFormatada || 'N/D')
                        + '\n\n→ MELHOR REGIME: ' + det.melhorRegime
                        + (det.economiaVsSN > 0 ? ' (economia de ' + _fm(det.economiaVsSN) + '/ano vs SN)' : '')
                    : 'Dados insuficientes para comparativo.'
            };
        }

        /**
         * Gera explicação completa combinando todos os módulos.
         *
         * @param {Object} resultado — Objeto retornado por Calculadora.calcularTudo()
         * @returns {Object} Objeto com todas as explicações
         */
        function gerarExplicacaoCompleta(resultado) {
            return {
                anexo: explicarAnexo(resultado),
                fatorR: explicarFatorR(resultado),
                economia: explicarEconomia(resultado),
                iss: explicarISS(resultado),
                cpp: explicarCPP(resultado),
                mei: explicarMEI(resultado),
                distribuicaoLucros: explicarDistribuicaoLucros(resultado),
                vedacoes: resultado && resultado.elegibilidade && resultado.elegibilidade.impedimentos
                    ? resultado.elegibilidade.impedimentos.map(function (imp) { return explicarVedacao(imp); })
                    : []
            };
        }

        return {
            explicarAnexo: explicarAnexo,
            explicarFatorR: explicarFatorR,
            explicarEconomia: explicarEconomia,
            explicarISS: explicarISS,
            explicarCPP: explicarCPP,
            explicarVedacao: explicarVedacao,
            explicarMEI: explicarMEI,
            explicarDistribuicaoLucros: explicarDistribuicaoLucros,
            explicarOtimizacao: explicarOtimizacao,
            gerarExplicacaoCompleta: gerarExplicacaoCompleta
        };
    })();


    // ═══════════════════════════════════════════════════════════════
    //  MÓDULO 13: SIMULADOR DE CENÁRIOS (SimuladorCenarios)
    //  Motor avançado de simulação "E se?" com 6 tipos de cenário
    //  API: simular({ cenario, parametro, empresa }) → { antes, depois, diferenca }
    //  Base legal: LC 123/2006; Resolução CGSN nº 140/2018
    // ═══════════════════════════════════════════════════════════════

    const SimuladorCenarios = (function () {

        /** @type {Array} Histórico de simulações */
        var _historico = [];

        /**
         * Helper: calcula DAS para cenário.
         * @private
         */
        function _calcDAS(receitaMensal, rbt12, anexo, folhaMensal) {
            var das = _chamarIMPOST('calcularDASMensal', {
                receitaBrutaMensal: receitaMensal,
                rbt12: rbt12,
                anexo: anexo,
                folhaMensal: folhaMensal || 0,
                issRetidoFonte: 0,
                aliquotaRAT: 0.02
            });
            return das ? (das.dasAPagar || das.dasValor || 0) : 0;
        }

        /**
         * Helper: determina anexo para CNAE e fatorR.
         * @private
         */
        function _detAnexo(cnae, fatorR) {
            var res = _chamarIMPOST('determinarAnexo', { cnae: cnae, fatorR: fatorR || 0 });
            return res ? res.anexo : 'III';
        }

        /**
         * Helper: calcula alíquota efetiva.
         * @private
         */
        function _calcAliq(rbt12, anexo) {
            var res = _chamarIMPOST('calcularAliquotaEfetiva', { rbt12: rbt12, anexo: anexo });
            return res ? (res.aliquotaEfetiva || 0) : 0;
        }

        /**
         * Calcula situação base (antes) a partir dos dados da empresa.
         * @param {Object} empresa — dados da empresa
         * @returns {Object} situação atual
         * @private
         */
        function _calcularAntes(empresa) {
            var e = empresa || Formulario.getDados();
            var rbt12 = e.receitaBrutaAnual || (e.receitaBrutaMensal * 12);
            var folha12 = e.folhaAnual || (e.folhaMensal * 12);
            var fatorR = rbt12 > 0 ? folha12 / rbt12 : 0;
            var anexo = _detAnexo(e.cnae, fatorR);
            if (anexo === 'VEDADO') anexo = 'III';
            var dasMensal = _calcDAS(e.receitaBrutaMensal, rbt12, anexo, e.folhaMensal);
            var aliqEfetiva = _calcAliq(rbt12, anexo);
            var inssProLabore = (e.proLabore || 0) * 0.11;
            var numSocios = Math.max(1, (e.socios || []).length);

            return {
                receitaMensal: e.receitaBrutaMensal || 0,
                receitaAnual: rbt12,
                folhaMensal: e.folhaMensal || 0,
                proLabore: e.proLabore || 0,
                fatorR: fatorR,
                anexo: anexo,
                DAS: dasMensal,
                DASAnual: dasMensal * 12,
                aliquotaEfetiva: aliqEfetiva,
                INSSsocio: inssProLabore,
                INSSsocioAnual: inssProLabore * 12,
                numSocios: numSocios,
                cnae: e.cnae
            };
        }

        /**
         * Cenário 1: aumentar_proLabore — Recalcula DAS com novo Fator R + INSS adicional
         * @private
         */
        function _simAumentarProLabore(parametro, empresa) {
            var antes = _calcularAntes(empresa);
            var novoProLabore = parametro;
            var delta = novoProLabore - antes.proLabore;
            var novaFolha = Math.max(0, antes.folhaMensal + delta);
            var novaFolha12 = novaFolha * 12;
            var novoFatorR = antes.receitaAnual > 0 ? novaFolha12 / antes.receitaAnual : 0;
            var novoAnexo = _detAnexo(antes.cnae, novoFatorR);
            if (novoAnexo === 'VEDADO') novoAnexo = antes.anexo;
            var novoDAS = _calcDAS(antes.receitaMensal, antes.receitaAnual, novoAnexo, novaFolha);
            var novoINSS = novoProLabore * 0.11;

            return {
                antes: antes,
                depois: {
                    proLabore: novoProLabore,
                    folhaMensal: novaFolha,
                    fatorR: novoFatorR,
                    anexo: novoAnexo,
                    DAS: novoDAS,
                    DASAnual: novoDAS * 12,
                    INSSsocio: novoINSS,
                    INSSsocioAnual: novoINSS * 12
                },
                diferenca: {
                    DAS: antes.DAS - novoDAS,
                    DASAnual: (antes.DAS - novoDAS) * 12,
                    INSSsocio: novoINSS - antes.INSSsocio,
                    INSSsocioAnual: (novoINSS - antes.INSSsocio) * 12,
                    economiaLiquida: (antes.DAS - novoDAS) - (novoINSS - antes.INSSsocio),
                    economiaLiquidaAnual: ((antes.DAS - novoDAS) - (novoINSS - antes.INSSsocio)) * 12,
                    mudouAnexo: novoAnexo !== antes.anexo,
                    resumo: novoAnexo !== antes.anexo
                        ? 'Migrou de Anexo ' + antes.anexo + ' para ' + novoAnexo
                        : 'Mesmo anexo'
                }
            };
        }

        /**
         * Cenário 2: mudar_cnae — Simula DAS se atividade principal fosse outro CNAE
         * @private
         */
        function _simMudarCnae(parametro, empresa) {
            var antes = _calcularAntes(empresa);
            var novoCNAE = parametro;
            var novoAnexo = _detAnexo(novoCNAE, antes.fatorR);
            if (novoAnexo === 'VEDADO') {
                return {
                    antes: antes,
                    depois: { cnae: novoCNAE, anexo: 'VEDADO', DAS: 0, aviso: 'CNAE vedado no Simples Nacional' },
                    diferenca: { DAS: 0, economiaLiquida: 0, resumo: 'CNAE vedado' }
                };
            }
            var novoDAS = _calcDAS(antes.receitaMensal, antes.receitaAnual, novoAnexo, antes.folhaMensal);

            return {
                antes: antes,
                depois: {
                    cnae: novoCNAE,
                    anexo: novoAnexo,
                    DAS: novoDAS,
                    DASAnual: novoDAS * 12,
                    aliquotaEfetiva: _calcAliq(antes.receitaAnual, novoAnexo)
                },
                diferenca: {
                    DAS: antes.DAS - novoDAS,
                    DASAnual: (antes.DAS - novoDAS) * 12,
                    economiaLiquida: antes.DAS - novoDAS,
                    economiaLiquidaAnual: (antes.DAS - novoDAS) * 12,
                    mudouAnexo: novoAnexo !== antes.anexo,
                    resumo: 'CNAE ' + novoCNAE + ' → Anexo ' + novoAnexo
                        + ' (DAS ' + (novoDAS < antes.DAS ? 'menor' : 'maior') + ')'
                }
            };
        }

        /**
         * Cenário 3: segregar_receitas — Simula separar receitas em 2+ CNAEs
         * @param {Array} parametro — [{ cnae, percentual }] ex: [{ cnae: '47.12-1', percentual: 0.6 }, { cnae: '62.01-5', percentual: 0.4 }]
         * @private
         */
        function _simSegregarReceitas(parametro, empresa) {
            var antes = _calcularAntes(empresa);
            if (!Array.isArray(parametro) || parametro.length < 2) {
                return { erro: 'Informe array com 2+ objetos { cnae, percentual }' };
            }

            var totalSegregado = 0;
            var dasSegregadoMensal = 0;
            var detalhesCNAEs = [];

            parametro.forEach(function (seg) {
                var percRec = seg.percentual || 0;
                totalSegregado += percRec;
                var recMensal = antes.receitaMensal * percRec;
                var folhaProporcional = antes.folhaMensal * percRec;
                var anexoSeg = _detAnexo(seg.cnae, antes.fatorR);
                if (anexoSeg === 'VEDADO') anexoSeg = antes.anexo;
                var dasSeg = _calcDAS(recMensal, antes.receitaAnual, anexoSeg, folhaProporcional);
                dasSegregadoMensal += dasSeg;
                detalhesCNAEs.push({
                    cnae: seg.cnae,
                    percentual: percRec,
                    receitaMensal: recMensal,
                    anexo: anexoSeg,
                    dasMensal: dasSeg
                });
            });

            return {
                antes: antes,
                depois: {
                    cnaes: detalhesCNAEs,
                    DAS: dasSegregadoMensal,
                    DASAnual: dasSegregadoMensal * 12
                },
                diferenca: {
                    DAS: antes.DAS - dasSegregadoMensal,
                    DASAnual: (antes.DAS - dasSegregadoMensal) * 12,
                    economiaLiquida: antes.DAS - dasSegregadoMensal,
                    economiaLiquidaAnual: (antes.DAS - dasSegregadoMensal) * 12,
                    resumo: 'DAS segregado: ' + Utils.formatarMoeda(dasSegregadoMensal)
                        + ' (economia: ' + Utils.formatarMoeda(antes.DAS - dasSegregadoMensal) + '/mês)'
                }
            };
        }

        /**
         * Cenário 4: reduzir_receita — Simula impacto de reduzir receita abaixo da próxima faixa
         * @param {number} parametro — nova receita mensal
         * @private
         */
        function _simReduzirReceita(parametro, empresa) {
            var antes = _calcularAntes(empresa);
            var novaReceitaMensal = parametro;
            var novaRBT12 = novaReceitaMensal * 12;
            var novoFatorR = novaRBT12 > 0 ? (antes.folhaMensal * 12) / novaRBT12 : 0;
            var novoAnexo = _detAnexo(antes.cnae, novoFatorR);
            if (novoAnexo === 'VEDADO') novoAnexo = antes.anexo;
            var novoDAS = _calcDAS(novaReceitaMensal, novaRBT12, novoAnexo, antes.folhaMensal);
            var novaAliq = _calcAliq(novaRBT12, novoAnexo);

            // Faixas do Simples (limites)
            var faixas = [180000, 360000, 720000, 1800000, 3600000, 4800000];
            var faixaAtual = 0;
            var faixaNova = 0;
            faixas.forEach(function (f, i) {
                if (antes.receitaAnual > f) faixaAtual = i + 1;
                if (novaRBT12 > f) faixaNova = i + 1;
            });

            return {
                antes: antes,
                depois: {
                    receitaMensal: novaReceitaMensal,
                    receitaAnual: novaRBT12,
                    fatorR: novoFatorR,
                    anexo: novoAnexo,
                    DAS: novoDAS,
                    DASAnual: novoDAS * 12,
                    aliquotaEfetiva: novaAliq,
                    faixa: faixaNova + 1
                },
                diferenca: {
                    DAS: antes.DAS - novoDAS,
                    DASAnual: (antes.DAS - novoDAS) * 12,
                    receitaPerdida: antes.receitaMensal - novaReceitaMensal,
                    receitaPerdidaAnual: (antes.receitaMensal - novaReceitaMensal) * 12,
                    economiaLiquida: antes.DAS - novoDAS,
                    mudouFaixa: faixaNova < faixaAtual,
                    resumo: 'Receita ' + Utils.formatarMoeda(novaReceitaMensal) + '/mês → '
                        + 'DAS ' + Utils.formatarMoeda(novoDAS) + '/mês '
                        + (faixaNova < faixaAtual ? '(caiu de faixa!)' : '(mesma faixa)')
                }
            };
        }

        /**
         * Cenário 5: incluir_socio — Simula adicionar sócio para divisão de lucros e pró-labore
         * @param {Object} parametro — { novosSocios: 1, proLaborePorSocio: 1621 }
         * @private
         */
        function _simIncluirSocio(parametro, empresa) {
            var antes = _calcularAntes(empresa);
            var novosSocios = parametro.novosSocios || 1;
            var plPorSocio = parametro.proLaborePorSocio || SALARIO_MINIMO_2026;
            var totalSociosDepois = antes.numSocios + novosSocios;
            var novoProLaboreTotal = plPorSocio * totalSociosDepois;
            var proLaboreAtualTotal = antes.proLabore * antes.numSocios;
            var deltaFolha = novoProLaboreTotal - proLaboreAtualTotal;
            var novaFolha = Math.max(0, antes.folhaMensal + deltaFolha);
            var novaFolha12 = novaFolha * 12;
            var novoFatorR = antes.receitaAnual > 0 ? novaFolha12 / antes.receitaAnual : 0;
            var novoAnexo = _detAnexo(antes.cnae, novoFatorR);
            if (novoAnexo === 'VEDADO') novoAnexo = antes.anexo;
            var novoDAS = _calcDAS(antes.receitaMensal, antes.receitaAnual, novoAnexo, novaFolha);
            var novoINSSTotal = novoProLaboreTotal * 0.11;
            var inssAnteriorTotal = proLaboreAtualTotal * 0.11;

            // Distribuição de lucros por sócio
            var rbt12 = antes.receitaAnual;
            var percPresuncao = 0.32; // conservador
            var lucroDistribuivel = Math.max(0, rbt12 * percPresuncao - novoDAS * 12);
            var lucroPorSocio = lucroDistribuivel / totalSociosDepois;

            return {
                antes: antes,
                depois: {
                    numSocios: totalSociosDepois,
                    proLaborePorSocio: plPorSocio,
                    proLaboreTotal: novoProLaboreTotal,
                    folhaMensal: novaFolha,
                    fatorR: novoFatorR,
                    anexo: novoAnexo,
                    DAS: novoDAS,
                    DASAnual: novoDAS * 12,
                    INSSTotal: novoINSSTotal,
                    lucroPorSocioAnual: lucroPorSocio
                },
                diferenca: {
                    DAS: antes.DAS - novoDAS,
                    DASAnual: (antes.DAS - novoDAS) * 12,
                    INSSsocio: novoINSSTotal - inssAnteriorTotal,
                    economiaLiquida: (antes.DAS - novoDAS) - (novoINSSTotal - inssAnteriorTotal),
                    economiaLiquidaAnual: ((antes.DAS - novoDAS) - (novoINSSTotal - inssAnteriorTotal)) * 12,
                    mudouAnexo: novoAnexo !== antes.anexo,
                    resumo: totalSociosDepois + ' sócios, PL ' + Utils.formatarMoeda(plPorSocio) + '/cada → '
                        + 'Anexo ' + novoAnexo + ', DAS ' + Utils.formatarMoeda(novoDAS) + '/mês'
                }
            };
        }

        /**
         * Cenário 6: exportacao — Simula excluir receitas de exportação do cálculo
         * @param {number} parametro — valor mensal de receita de exportação
         * @private
         */
        function _simExportacao(parametro, empresa) {
            var antes = _calcularAntes(empresa);
            var recExportacao = parametro;
            // Art. 3º, §4º, LC 123 — exportação não conta para o limite
            // Mas a receita de exportação AINDA é tributada (com imunidades)
            var receitaMercInterna = antes.receitaMensal - recExportacao;
            var rbt12SemExp = receitaMercInterna * 12;
            // Fator R recalculado com base na receita total (exportação conta na base de cálculo)
            var rbt12Total = antes.receitaAnual;
            var fatorR = rbt12Total > 0 ? (antes.folhaMensal * 12) / rbt12Total : 0;
            var anexo = _detAnexo(antes.cnae, fatorR);
            if (anexo === 'VEDADO') anexo = antes.anexo;

            // DAS sobre receita interna
            var dasInterno = _calcDAS(receitaMercInterna, rbt12Total, anexo, antes.folhaMensal);
            // DAS sobre exportação: zera ICMS, PIS, COFINS, ISS
            // Estimar economia: ~45% da alíquota efetiva sobre exportação
            var aliqEf = _calcAliq(rbt12Total, anexo);
            var dasExportacao = recExportacao * aliqEf * 0.55; // Sobram IRPJ, CSLL, CPP
            var totalDAS = dasInterno + dasExportacao;

            return {
                antes: antes,
                depois: {
                    receitaInterna: receitaMercInterna,
                    receitaExportacao: recExportacao,
                    DAS: totalDAS,
                    DASAnual: totalDAS * 12,
                    dasInterno: dasInterno,
                    dasExportacao: dasExportacao,
                    nota: 'Exportação não conta para o limite de R$ 4,8M (Art. 3º, §14, LC 123)'
                },
                diferenca: {
                    DAS: antes.DAS - totalDAS,
                    DASAnual: (antes.DAS - totalDAS) * 12,
                    economiaLiquida: antes.DAS - totalDAS,
                    economiaLiquidaAnual: (antes.DAS - totalDAS) * 12,
                    resumo: 'Exportação de ' + Utils.formatarMoeda(recExportacao) + '/mês → '
                        + 'economia de ' + Utils.formatarMoeda(antes.DAS - totalDAS) + '/mês '
                        + '(ICMS+PIS+COFINS+ISS zerados sobre exportação)'
                }
            };
        }

        /**
         * Simula um cenário e retorna { antes, depois, diferenca }.
         *
         * @param {Object} opcoes
         * @param {string} opcoes.cenario — Tipo: 'aumentar_proLabore' | 'mudar_cnae' | 'segregar_receitas' | 'reduzir_receita' | 'incluir_socio' | 'exportacao'
         * @param {*} opcoes.parametro — Valor ou objeto de parâmetros
         * @param {Object} [opcoes.empresa] — Dados da empresa (se omitido, usa Formulario.getDados)
         * @returns {Object} { antes, depois, diferenca }
         */
        function simular(opcoes) {
            if (!opcoes || !opcoes.cenario) {
                return { erro: 'Informe { cenario, parametro, empresa }' };
            }

            var handlers = {
                'aumentar_proLabore': _simAumentarProLabore,
                'mudar_cnae': _simMudarCnae,
                'segregar_receitas': _simSegregarReceitas,
                'reduzir_receita': _simReduzirReceita,
                'incluir_socio': _simIncluirSocio,
                'exportacao': _simExportacao
            };

            var fn = handlers[opcoes.cenario];
            if (!fn) {
                return { erro: 'Cenário não reconhecido: ' + opcoes.cenario
                    + '. Válidos: ' + Object.keys(handlers).join(', ') };
            }

            var resultado = fn(opcoes.parametro, opcoes.empresa);
            if (resultado && !resultado.erro) {
                resultado.cenario = opcoes.cenario;
                resultado.simuladoEm = new Date().toISOString();
                _historico.push(resultado);
                Eventos.emit('simuladorCenarios:resultado', resultado);
            }

            return resultado;
        }

        /**
         * Retorna histórico de simulações.
         * @returns {Array}
         */
        function getHistorico() { return _historico; }

        /**
         * Limpa histórico.
         */
        function limparHistorico() { _historico = []; }

        return {
            simular: simular,
            getHistorico: getHistorico,
            limparHistorico: limparHistorico
        };
    })();


    // ═══════════════════════════════════════════════════════════════
    //  MÓDULO 14: COMPARATIVO DE REGIMES TRIBUTÁRIOS (CompararRegimes)
    //  Calcula carga tributária completa: Simples Nacional × Lucro Presumido × Lucro Real
    //  Base legal: LC 123/2006 (SN); Lei 9.249/95 (LP); DL 1.598/77, Lei 10.637/02 (LR)
    // ═══════════════════════════════════════════════════════════════

    const CompararRegimes = (function () {

        /**
         * Helper: determina se CNAE é preponderantemente serviço ou comércio/indústria.
         * @param {string} cnae
         * @returns {string} 'servico' | 'comercio' | 'industria'
         * @private
         */
        function _tipoAtividade(cnae) {
            if (!cnae) return 'servico';
            var grupo = parseInt(String(cnae).replace(/\D/g, '').substring(0, 2));
            if (grupo >= 1 && grupo <= 9) return 'industria';   // Agropecuária
            if (grupo >= 10 && grupo <= 33) return 'industria';  // Indústria de transformação
            if (grupo >= 35 && grupo <= 39) return 'industria';  // Utilidades
            if (grupo >= 41 && grupo <= 43) return 'industria';  // Construção
            if (grupo >= 45 && grupo <= 47) return 'comercio';   // Comércio
            return 'servico'; // 49+ são preponderantemente serviços
        }

        /**
         * Calcula carga tributária no Simples Nacional.
         * @param {Object} params
         * @returns {Object} Detalhamento SN
         */
        function _calcularSimplesNacional(params) {
            var rbt12 = params.receitaBrutaAnual;
            var recMensal = params.receitaBrutaMensal;
            var folhaMensal = params.folhaMensal || 0;
            var proLabore = params.proLabore || 0;
            // LC 123/2006, Art. 18, §5º-M: pró-labore integra a folha para fins de Fator R
            var fatorR = rbt12 > 0 ? ((folhaMensal + proLabore) * 12) / rbt12 : 0;

            var detAnexo = _chamarIMPOST('determinarAnexo', { cnae: params.cnae, fatorR: fatorR });
            var anexo = detAnexo ? detAnexo.anexo : 'III';
            if (anexo === 'VEDADO') return { vedado: true, cargaAnual: Infinity };

            var das = _chamarIMPOST('calcularDASMensal', {
                receitaBrutaMensal: recMensal,
                rbt12: rbt12,
                anexo: anexo,
                folhaMensal: folhaMensal,
                issRetidoFonte: 0,
                aliquotaRAT: 0.02
            });

            var dasValor = das ? (das.dasAPagar || das.dasValor || 0) : 0;
            var dasAnual = dasValor * 12;

            // CPP fora do DAS no Anexo IV
            var cppFora = 0;
            if (anexo === 'IV') {
                cppFora = folhaMensal * 0.22 * 12; // 20% patronal + 2% RAT
            }

            var aliqEf = _chamarIMPOST('calcularAliquotaEfetiva', { rbt12: rbt12, anexo: anexo });

            return {
                regime: 'Simples Nacional',
                anexo: anexo,
                fatorR: fatorR,
                dasAnual: dasAnual,
                dasMensal: dasValor,
                cppForaDAS: cppFora,
                cargaAnual: dasAnual + cppFora,
                cargaMensal: dasValor + (cppFora / 12),
                aliquotaEfetiva: aliqEf ? aliqEf.aliquotaEfetiva : (rbt12 > 0 ? dasAnual / rbt12 : 0),
                aliquotaEfetivaFormatada: aliqEf ? aliqEf.aliquotaEfetivaFormatada
                    : Utils.formatarPercentual(rbt12 > 0 ? dasAnual / rbt12 : 0),
                detalhamento: {
                    das: dasAnual,
                    cppFora: cppFora
                }
            };
        }

        /**
         * Calcula carga tributária no Lucro Presumido.
         * @param {Object} params
         * @returns {Object} Detalhamento LP
         */
        function _calcularLucroPresumido(params) {
            var rbt12 = params.receitaBrutaAnual;
            var tipo = _tipoAtividade(params.cnae);

            // Percentuais de presunção (Lei 9.249/95, Art. 15 e 20)
            var percIRPJ = (tipo === 'servico') ? 0.32 : 0.08;
            var percCSLL = (tipo === 'servico') ? 0.32 : 0.12;

            // Base de cálculo
            var baseIRPJ = rbt12 * percIRPJ;
            var baseCSLL = rbt12 * percCSLL;

            // IRPJ: 15% + adicional 10% sobre excedente de R$ 20.000/mês (R$ 240.000/ano)
            var irpj = baseIRPJ * 0.15;
            var adicionalIRPJ = Math.max(0, baseIRPJ - 240000) * 0.10;

            // CSLL: 9%
            var csll = baseCSLL * 0.09;

            // PIS cumulativo: 0,65%
            var pis = rbt12 * 0.0065;

            // COFINS cumulativo: 3%
            var cofins = rbt12 * 0.03;

            // ISS/ICMS estimado
            var issOuICMS = 0;
            if (tipo === 'servico') {
                var issAliq = (params.issAliquota || 5) / 100;
                issOuICMS = rbt12 * issAliq;
            } else {
                // ICMS: alíquota estadual × margem estimada (simplificação)
                var estadoData = _Estados && params.uf ? _Estados[params.uf] : null;
                var icmsAliq = estadoData && estadoData.icms ? (estadoData.icms.padrao || 0.18) : 0.18;
                // Valor agregado estimado: 30% sobre receita
                issOuICMS = rbt12 * icmsAliq * 0.30;
            }

            // CPP: 20% patronal sobre folha + RAT 2% + FGTS 8%
            var folhaAnual = (params.folhaMensal || 0) * 12;
            var encargos = folhaAnual * 0.30; // 20% patronal + 2% RAT + 8% FGTS

            var totalFederal = irpj + adicionalIRPJ + csll + pis + cofins;
            var totalGeral = totalFederal + issOuICMS + encargos;

            return {
                regime: 'Lucro Presumido',
                cargaAnual: totalGeral,
                cargaMensal: totalGeral / 12,
                aliquotaEfetiva: rbt12 > 0 ? totalGeral / rbt12 : 0,
                aliquotaEfetivaFormatada: Utils.formatarPercentual(rbt12 > 0 ? totalGeral / rbt12 : 0),
                detalhamento: {
                    irpj: irpj,
                    adicionalIRPJ: adicionalIRPJ,
                    csll: csll,
                    pis: pis,
                    cofins: cofins,
                    issOuICMS: issOuICMS,
                    encargos: encargos,
                    totalFederal: totalFederal,
                    baseIRPJ: baseIRPJ,
                    baseCSLL: baseCSLL,
                    percPresuncaoIRPJ: percIRPJ,
                    percPresuncaoCSLL: percCSLL
                }
            };
        }

        /**
         * Calcula carga tributária no Lucro Real (estimativa conservadora).
         * @param {Object} params
         * @returns {Object} Detalhamento LR
         */
        function _calcularLucroReal(params) {
            var rbt12 = params.receitaBrutaAnual;
            var margemEstimada = params.margemLucro || 0.20;
            var tipo = _tipoAtividade(params.cnae);

            // Lucro real estimado
            var lucroReal = rbt12 * margemEstimada;

            // IRPJ: 15% sobre lucro + adicional 10% sobre excedente de R$ 240.000/ano
            var irpj = lucroReal * 0.15;
            var adicionalIRPJ = Math.max(0, lucroReal - 240000) * 0.10;

            // CSLL: 9%
            var csll = lucroReal * 0.09;

            // PIS não cumulativo: 1,65%
            var pisBruto = rbt12 * 0.0165;

            // COFINS não cumulativo: 7,6%
            var cofinsBruto = rbt12 * 0.076;

            // Créditos PIS/COFINS: estimativa de 40% sobre compras/insumos
            var creditoPercentual = params.percentualCreditos || 0.40;
            var creditosPISCOFINS = (pisBruto + cofinsBruto) * creditoPercentual;
            var pisCofinsLiquido = pisBruto + cofinsBruto - creditosPISCOFINS;

            // ISS/ICMS (similar ao LP)
            var issOuICMS = 0;
            if (tipo === 'servico') {
                var issAliq = (params.issAliquota || 5) / 100;
                issOuICMS = rbt12 * issAliq;
            } else {
                var estadoData = _Estados && params.uf ? _Estados[params.uf] : null;
                var icmsAliq = estadoData && estadoData.icms ? (estadoData.icms.padrao || 0.18) : 0.18;
                issOuICMS = rbt12 * icmsAliq * 0.30;
            }

            // Encargos trabalhistas
            var folhaAnual = (params.folhaMensal || 0) * 12;
            var encargos = folhaAnual * 0.30;

            var totalFederal = irpj + adicionalIRPJ + csll + pisCofinsLiquido;
            var totalGeral = totalFederal + issOuICMS + encargos;

            return {
                regime: 'Lucro Real',
                cargaAnual: totalGeral,
                cargaMensal: totalGeral / 12,
                aliquotaEfetiva: rbt12 > 0 ? totalGeral / rbt12 : 0,
                aliquotaEfetivaFormatada: Utils.formatarPercentual(rbt12 > 0 ? totalGeral / rbt12 : 0),
                margemEstimada: margemEstimada,
                detalhamento: {
                    lucroReal: lucroReal,
                    irpj: irpj,
                    adicionalIRPJ: adicionalIRPJ,
                    csll: csll,
                    pisBruto: pisBruto,
                    cofinsBruto: cofinsBruto,
                    creditosPISCOFINS: creditosPISCOFINS,
                    pisCofinsLiquido: pisCofinsLiquido,
                    issOuICMS: issOuICMS,
                    encargos: encargos,
                    totalFederal: totalFederal,
                    percentualCreditos: creditoPercentual
                }
            };
        }

        /**
         * Compara os 3 regimes tributários para a empresa informada.
         *
         * @param {Object} params
         * @param {number} params.receitaBrutaAnual — Receita bruta anual
         * @param {number} params.receitaBrutaMensal — Receita bruta mensal
         * @param {number} params.folhaMensal — Folha de pagamento mensal
         * @param {string} params.cnae — CNAE principal
         * @param {string} params.uf — UF
         * @param {number} [params.margemLucro=0.20] — Margem de lucro estimada (para LR)
         * @param {number} [params.percentualCreditos=0.40] — % de créditos PIS/COFINS (para LR)
         * @returns {Object} Comparativo completo
         */
        function compararRegimesCompleto(params) {
            if (!params || !params.receitaBrutaAnual) {
                return { erro: 'Informe receitaBrutaAnual para comparar regimes.' };
            }

            var sn = _calcularSimplesNacional(params);
            var lp = _calcularLucroPresumido(params);
            var lr = _calcularLucroReal(params);

            // Determinar melhor regime
            var regimes = [
                { nome: 'Simples Nacional', carga: sn.vedado ? Infinity : sn.cargaAnual, dados: sn },
                { nome: 'Lucro Presumido', carga: lp.cargaAnual, dados: lp },
                { nome: 'Lucro Real', carga: lr.cargaAnual, dados: lr }
            ];

            regimes.sort(function (a, b) { return a.carga - b.carga; });
            var melhor = regimes[0];
            var pior = regimes[2];

            // Economia máxima
            var economiaMaior = pior.carga - melhor.carga;

            // Quando vale mudar
            var recomendacao = '';
            if (melhor.nome === 'Simples Nacional') {
                recomendacao = 'O Simples Nacional é o regime mais econômico. Permaneça nele.';
            } else if (melhor.nome === 'Lucro Presumido') {
                recomendacao = 'O Lucro Presumido pode gerar economia de '
                    + Utils.formatarMoeda(sn.cargaAnual - lp.cargaAnual) + '/ano vs. Simples Nacional. '
                    + 'Considere migrar no início do próximo ano-calendário. '
                    + 'Avalie os custos adicionais de contabilidade.';
            } else {
                recomendacao = 'O Lucro Real pode gerar economia de '
                    + Utils.formatarMoeda(sn.cargaAnual - lr.cargaAnual) + '/ano vs. Simples Nacional. '
                    + 'Exige escrituração contábil completa (SPED). '
                    + 'Ideal para empresas com margem de lucro baixa ou muitos créditos de PIS/COFINS.';
            }

            return {
                simplesNacional: sn,
                lucroPresumido: lp,
                lucroReal: lr,
                ranking: regimes.map(function (r) {
                    return {
                        regime: r.nome,
                        cargaAnual: r.carga,
                        cargaMensal: r.carga / 12,
                        aliquotaEfetiva: r.dados.aliquotaEfetivaFormatada,
                        economia: melhor.carga < Infinity ? (r.carga - melhor.carga) : 0
                    };
                }),
                melhorRegime: melhor.nome,
                melhorCargaAnual: melhor.carga,
                economiaMaxima: economiaMaior,
                recomendacao: recomendacao,
                _meta: {
                    calculadoEm: new Date().toISOString(),
                    parametros: {
                        receitaAnual: params.receitaBrutaAnual,
                        cnae: params.cnae,
                        uf: params.uf,
                        margemLucro: params.margemLucro || 0.20,
                        percentualCreditos: params.percentualCreditos || 0.40
                    }
                }
            };
        }

        return {
            compararRegimesCompleto: compararRegimesCompleto,
            calcularSimplesNacional: _calcularSimplesNacional,
            calcularLucroPresumido: _calcularLucroPresumido,
            calcularLucroReal: _calcularLucroReal
        };
    })();


    // ═══════════════════════════════════════════════════════════════
    //  PARTE 2 — MÓDULOS 15 A 19
    //  Relatório, renderização HTML e exportação PDF/Excel
    // ═══════════════════════════════════════════════════════════════


    // ─── Constantes visuais compartilhadas ───

    var CORES = {
        primaria: '#1a365d',
        primariaClara: '#2b6cb0',
        primariaLight: '#ebf4ff',
        dourado: '#d69e2e',
        douradoClaro: '#fefcbf',
        verde: '#38a169',
        verdeClaro: '#f0fff4',
        vermelho: '#e53e3e',
        vermelhoClaro: '#fff5f5',
        laranja: '#dd6b20',
        laranjaClaro: '#fffaf0',
        cinzaTexto: '#2d3748',
        cinzaSecundario: '#718096',
        cinzaBorda: '#e2e8f0',
        cinzaFundo: '#f7fafc',
        branco: '#ffffff'
    };

    var PRODUTO = {
        nome: 'IMPOST.',
        nomeCompleto: 'IMPOST. — Inteligência em Modelagem de Otimização Tributária',
        slogan: 'Pagar menos imposto, legalmente, é inteligência.',
        descricao: 'Sistema de análise e otimização tributária para empresas optantes pelo Simples Nacional. Informe os dados da sua empresa e descubra quanto você pode economizar de forma 100% legal.',
        versao: _VERSION
    };


    // ═══════════════════════════════════════════════════════════════
    //  MÓDULO 13: RELATÓRIO DADOS — Consolidação completa
    //  Unifica todos os módulos em um único objeto para renderização
    // ═══════════════════════════════════════════════════════════════

    /**
     * Armazena os últimos dados consolidados para reutilização em PDF/Excel.
     * @type {Object|null}
     * @private
     */
    var _ultimosDados = null;

    /**
     * Sanitiza string para inserção segura em HTML.
     * @param {*} val
     * @returns {string}
     * @private
     */
    function _sanitize(val) {
        if (val == null) return '';
        return String(val)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Retorna valor formatado como moeda ou 'N/A' se indisponível.
     * @param {*} v
     * @returns {string}
     * @private
     */
    function _moedaOuNA(v) {
        if (v == null || isNaN(v)) return 'N/A';
        return Utils.formatarMoeda(v);
    }

    /**
     * Retorna valor formatado como percentual ou 'N/A'.
     * @param {*} v
     * @returns {string}
     * @private
     */
    function _percOuNA(v) {
        if (v == null || isNaN(v)) return 'N/A';
        return Utils.formatarPercentual(v);
    }

    /**
     * Consolida TODOS os dados calculados em um único objeto pronto para relatório.
     * Puxa de Calculadora, Diagnostico, Score, PlanoAcao, Explicacoes e IMPOST.
     *
     * @returns {Object} Objeto completo com todas as seções do relatório
     */
    function consolidarDados() {
        var calculo = Calculadora.calcularTudo();
        if (calculo && calculo.erro) {
            return null;
        }

        var diag = Diagnostico.executar(calculo);
        var score = Score.calcular(diag, calculo);
        var plano = PlanoAcao.gerar(diag);
        var explicacoes = null;
        try {
            explicacoes = Explicacoes.gerarExplicacaoCompleta(calculo);
        } catch (e) {
            explicacoes = {};
        }

        var d = Formulario.getDados();
        var rbt12 = d.receitaBrutaAnual || (d.receitaBrutaMensal * 12);

        // Dados extras do IMPOST
        var comparativoRegimes = null;
        var relatorioOtimizacao = null;
        var dicasEconomia = null;
        var impactoDividendos = null;

        // Comparativo de Regimes — usar módulo local CompararRegimes (v5.0)
        try {
            comparativoRegimes = CompararRegimes.compararRegimesCompleto({
                receitaBrutaAnual: rbt12,
                receitaBrutaMensal: d.receitaBrutaMensal,
                folhaMensal: d.folhaMensal,
                proLabore: d.proLabore || 0, // LC 123/2006, Art. 18, §5º-M: pró-labore integra a folha para fins de Fator R
                cnae: d.cnae,
                uf: d.uf,
                issAliquota: d.issAliquota || 5
            });
        } catch (e) { /* silenciar */ }

        if (_IMPOST) {
            try {
                if (typeof _IMPOST.gerarRelatorioOtimizacao === 'function') {
                    relatorioOtimizacao = _IMPOST.gerarRelatorioOtimizacao({
                        receitaBrutaAnual: rbt12,
                        receitaBrutaMensal: d.receitaBrutaMensal,
                        folhaMensal: d.folhaMensal,
                        proLabore: d.proLabore || 0, // LC 123/2006, Art. 18, §5º-M: pró-labore integra a folha para fins de Fator R
                        cnae: d.cnae,
                        uf: d.uf,
                        anexo: calculo.anexo ? calculo.anexo.anexo : 'III'
                    });
                }
            } catch (e) { /* silenciar */ }
            try {
                if (typeof _IMPOST.gerarDicasEconomia === 'function') {
                    dicasEconomia = _IMPOST.gerarDicasEconomia({
                        receitaBrutaAnual: rbt12,
                        receitaBrutaMensal: d.receitaBrutaMensal,
                        folhaAnual: d.folhaAnual || d.folhaMensal * 12,
                        folhaMensal: d.folhaMensal,
                        cnae: d.cnae,
                        uf: d.uf,
                        anexo: calculo.anexo ? calculo.anexo.anexo : 'III',
                        rbt12: rbt12,
                        socios: d.socios,
                        temProdutosMonofasicos: (d.receitaMonofasica || 0) > 0,
                        receitaMonofasica: d.receitaMonofasica || 0
                    });
                }
            } catch (e) { /* silenciar */ }
            try {
                if (typeof _IMPOST.calcularImpactoDividendos2026 === 'function' && calculo.distribuicaoLucros) {
                    var lucroMensal = (calculo.distribuicaoLucros.lucroDistribuivel || 0) / 12;
                    if (lucroMensal > 0) {
                        impactoDividendos = _IMPOST.calcularImpactoDividendos2026({
                            lucroDistribuivelMensal: lucroMensal,
                            socios: (d.socios || []).map(function (s) {
                                return { nome: s.nome || 'Sócio', percentual: s.percentual || 1.0 };
                            })
                        });
                    }
                }
            } catch (e) { /* silenciar */ }
        }

        // Montar score
        var scoreObj = {
            total: score ? (score.total || score.pontuacao || 0) : 0,
            faixa: score ? (score.faixa || 'REGULAR') : 'REGULAR',
            icone: '',
            descricao: '',
            categorias: score ? (score.categorias || score.detalhamento || []) : [],
            economiaPotencial: calculo.economiaTotal ? calculo.economiaTotal.economiaAnual : 0
        };
        if (scoreObj.total >= 86) { scoreObj.icone = '\u2605'; scoreObj.descricao = 'Excelente'; }
        else if (scoreObj.total >= 71) { scoreObj.icone = '\u2605'; scoreObj.descricao = 'Bom'; }
        else if (scoreObj.total >= 51) { scoreObj.icone = '\u26A0'; scoreObj.descricao = 'Regular'; }
        else if (scoreObj.total >= 31) { scoreObj.icone = '\u26A0'; scoreObj.descricao = 'Aten\u00e7\u00e3o'; }
        else { scoreObj.icone = '\u2716'; scoreObj.descricao = 'Cr\u00edtico'; }

        // Oportunidades do diagnóstico
        var oportunidades = [];
        if (diag && diag.oportunidades) {
            oportunidades = diag.oportunidades;
        } else if (typeof Diagnostico.getOportunidades === 'function') {
            oportunidades = Diagnostico.getOportunidades() || [];
        }
        oportunidades.sort(function (a, b) {
            return (b.economiaAnual || b.economia || 0) - (a.economiaAnual || a.economia || 0);
        });

        // Alertas
        var alertas = [];
        if (diag && diag.alertas) {
            alertas = diag.alertas;
        } else if (calculo.elegibilidade && calculo.elegibilidade.alertas) {
            alertas = calculo.elegibilidade.alertas;
        }

        // Plano de ação
        var planoAcao = {
            resumo: plano ? (plano.resumo || '') : '',
            economiaTotal: plano ? (plano.economiaTotal || 0) : 0,
            totalAcoes: plano ? (plano.totalAcoes || (plano.acoes ? plano.acoes.length : 0)) : 0,
            acoes: plano ? (plano.acoes || []) : [],
            cronograma: plano ? (plano.cronograma || {}) : {}
        };

        // Partilha de tributos
        var partilhaTributos = {};
        if (calculo.dasMensal && calculo.dasMensal.semOtimizacao && calculo.dasMensal.semOtimizacao.partilha) {
            partilhaTributos = calculo.dasMensal.semOtimizacao.partilha;
        }

        // Penalidades 2026
        var penalidades2026 = [];
        if (_IMPOST && _IMPOST.PENALIDADES_2026) {
            penalidades2026 = _IMPOST.PENALIDADES_2026;
        }

        // ── Simulações de cenários (todos os 6) ──
        var simulacoes = [];
        var _cenariosDef = [
            { cenario: 'aumentar_proLabore', parametro: Math.max((d.proLabore || 3000) * 1.5, SALARIO_MINIMO_2026 * 2) },
            { cenario: 'reduzir_receita', parametro: (d.receitaBrutaMensal || 50000) * 0.8 },
            { cenario: 'incluir_socio', parametro: { novosSocios: 1, proLaborePorSocio: SALARIO_MINIMO_2026 } },
            { cenario: 'exportacao', parametro: (d.receitaBrutaMensal || 50000) * 0.2 },
            { cenario: 'segregar_receitas', parametro: 0.3 },
            { cenario: 'mudar_cnae', parametro: d.cnae || '' }
        ];
        _cenariosDef.forEach(function (def) {
            try {
                var sim = SimuladorCenarios.simular({
                    cenario: def.cenario,
                    parametro: def.parametro,
                    empresa: d
                });
                if (sim && !sim.erro) simulacoes.push(sim);
            } catch (e) { /* cenário não aplicável */ }
        });

        // ── Coletar basesLegais de todas as fontes ──
        var basesLegaisSet = {};
        basesLegaisSet['LC 123/2006'] = 'Estatuto Nacional da Microempresa e da Empresa de Pequeno Porte';
        basesLegaisSet['LC 155/2016'] = 'Alterações no Simples Nacional — Fator R';
        basesLegaisSet['Resolução CGSN 140/2018'] = 'Regulamentação do Simples Nacional';
        basesLegaisSet['Art. 10, Lei 9.249/95'] = 'Isenção de IR sobre distribuição de lucros';
        (oportunidades || []).forEach(function (op) {
            if (op.baseLegal) basesLegaisSet[op.baseLegal] = op.titulo || '';
        });
        (planoAcao.acoes || []).forEach(function (a) {
            if (a.baseLegal) basesLegaisSet[a.baseLegal] = a.titulo || '';
        });
        var basesLegais = Object.keys(basesLegaisSet).map(function (k) {
            return { referencia: k, contexto: basesLegaisSet[k] };
        });

        // ── Estrutura calculoAtual / calculoOtimizado ──
        var _partilhaSimples = {};
        var _tributos = ['irpj', 'csll', 'cofins', 'pis', 'cpp', 'icms', 'iss'];
        _tributos.forEach(function (t) {
            if (partilhaTributos[t] != null) _partilhaSimples[t] = partilhaTributos[t];
        });

        var calculoAtual = {
            das: {
                mensal: calculo.dasMensal ? calculo.dasMensal.semOtimizacao.valor : 0,
                anual: calculo.anual ? calculo.anual.dasAnual : 0,
                aliquotaEfetiva: calculo.aliquotaEfetiva ? calculo.aliquotaEfetiva.valor : 0,
                faixa: calculo.aliquotaEfetiva ? calculo.aliquotaEfetiva.faixa : 0,
                anexo: calculo.anexo ? calculo.anexo.anexo : ''
            },
            partilha: _partilhaSimples,
            fatorR: {
                valor: calculo.fatorR ? calculo.fatorR.valor : 0,
                percentual: calculo.fatorR ? calculo.fatorR.percentual : '0,00%',
                situacao: calculo.fatorR ? (calculo.fatorR.acimaDoLimiar ? 'acima' : 'abaixo') : 'desconhecido'
            }
        };

        var _ecoMensal = calculo.dasMensal ? (calculo.dasMensal.comOtimizacao.economia || 0) : 0;
        var _dasOtimizado = calculo.dasMensal ? (calculo.dasMensal.comOtimizacao.valor || 0) : 0;
        var _dasAtual = calculoAtual.das.mensal;
        var calculoOtimizado = {
            das: {
                mensal: _dasOtimizado,
                anual: _dasOtimizado * 12,
                aliquotaEfetiva: _dasAtual > 0 && d.receitaBrutaMensal > 0 ? _dasOtimizado / d.receitaBrutaMensal : 0
            },
            economia: {
                mensal: _ecoMensal,
                anual: _ecoMensal * 12,
                percentual: _dasAtual > 0 ? _ecoMensal / _dasAtual : 0
            }
        };

        // Data formatada
        var agora = new Date();
        var geradoEmFormatado = agora.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
            + ' \u00e0s ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        var classificacaoTipo = calculo.classificacao ? calculo.classificacao.tipo : '';

        return {
            titulo: 'Relat\u00f3rio de Estudo Tribut\u00e1rio',
            subtitulo: 'Simples Nacional — An\u00e1lise Completa',
            geradoEm: agora.toISOString(),
            geradoEmFormatado: geradoEmFormatado,
            empresa: {
                nome: d.nomeEmpresa || 'Empresa',
                cnpj: d.cnpj || '',
                cnae: d.cnae || '',
                descricaoCNAE: d.descricaoCNAE || '',
                uf: d.uf || '',
                municipio: d.municipio || '',
                estado: d.uf || '',
                receitaMensal: d.receitaBrutaMensal || 0,
                receitaAnual: rbt12,
                folhaMensal: d.folhaMensal || 0,
                proLabore: d.proLabore || 0,
                issAliquota: d.issAliquota || 5,
                classificacao: classificacaoTipo
            },
            score: scoreObj,
            situacaoAtual: {
                anexo: calculo.anexo ? calculo.anexo.anexo : 'III',
                anexoNome: calculo.anexo ? calculo.anexo.nome : 'Anexo III',
                fatorR: calculo.fatorR ? calculo.fatorR.valor : 0,
                fatorRPercentual: calculo.fatorR ? calculo.fatorR.percentual : '0,00%',
                fatorRAcimaLimiar: calculo.fatorR ? calculo.fatorR.acimaDoLimiar : false,
                aliquotaEfetiva: calculo.aliquotaEfetiva ? calculo.aliquotaEfetiva.valor : 0,
                aliquotaEfetivaFormatada: calculo.aliquotaEfetiva ? calculo.aliquotaEfetiva.formatada : '0,00%',
                aliquotaNominal: calculo.aliquotaEfetiva ? calculo.aliquotaEfetiva.aliquotaNominal : 0,
                aliquotaNominalFormatada: calculo.aliquotaEfetiva ? calculo.aliquotaEfetiva.aliquotaNominalFormatada : '0,00%',
                faixa: calculo.aliquotaEfetiva ? calculo.aliquotaEfetiva.faixa : 0,
                faixaDescricao: calculo.aliquotaEfetiva ? calculo.aliquotaEfetiva.faixaDescricao : '',
                dasMensal: calculo.dasMensal ? calculo.dasMensal.semOtimizacao.valor : 0,
                dasAnual: calculo.anual ? calculo.anual.dasAnual : 0,
                dasMensalOtimizado: calculo.dasMensal ? calculo.dasMensal.comOtimizacao.valor : 0,
                economiaOtimizacao: calculo.dasMensal ? calculo.dasMensal.comOtimizacao.economia : 0
            },
            oportunidades: oportunidades,
            alertas: alertas,
            planoAcao: planoAcao,
            distribuicaoLucros: calculo.distribuicaoLucros || {},
            comparativoRegimes: comparativoRegimes,
            relatorioOtimizacao: relatorioOtimizacao,
            dicasEconomia: dicasEconomia,
            impactoDividendos: impactoDividendos,
            partilhaTributos: partilhaTributos,
            explicacoes: explicacoes,
            estrategias: calculo.estrategias || [],
            riscosFiscais: calculo.riscos || [],
            obrigacoesAcessorias: calculo.obrigacoes || [],
            penalidades2026: penalidades2026,
            calendarioFiscal: calculo.calendario || {},
            reformaTributaria: calculo.reformaTributaria || {},
            tributacaoDividendos2026: calculo.dividendos2026 || null,
            otimizacaoFatorR: calculo.otimizacaoFatorR || {},
            mei: calculo.mei || null,
            // Campos do schema unificado (Parte 3)
            calculoAtual: calculoAtual,
            calculoOtimizado: calculoOtimizado,
            simulacoes: simulacoes,
            basesLegais: basesLegais,
            versao: PRODUTO.versao,

            disclaimer: 'Este relat\u00f3rio tem car\u00e1ter exclusivamente informativo e educacional. '
                + 'N\u00e3o substitui consultoria cont\u00e1bil ou jur\u00eddica profissional. '
                + 'Valores calculados com base na legisla\u00e7\u00e3o vigente em ' + agora.getFullYear() + '. '
                + 'Consulte seu contador para decis\u00f5es tributárias.',
            _exportMeta: {
                versao: PRODUTO.versao,
                motor: 'SimplesEstudoCompleto',
                geradoEm: agora.toISOString()
            }
        };
    }


    // ═══════════════════════════════════════════════════════════════
    //  MÓDULO 14: RELATÓRIO HTML — Visual profissional
    //  Gera HTML completo com CSS embutido para tela e PDF
    // ═══════════════════════════════════════════════════════════════

    /**
     * Gera todo o bloco <style> com CSS profissional embutido.
     * @returns {string} Tag <style> completa
     * @private
     */
    function _gerarCSS() {
        return '<style>'
        + '.impost-relatorio{max-width:1100px;margin:0 auto;font-family:"Segoe UI","DM Sans",Arial,sans-serif;color:' + CORES.cinzaTexto + ';line-height:1.6;background:' + CORES.branco + ';}'
        + '.impost-relatorio *{box-sizing:border-box;}'

        /* Capa */
        + '.ir-capa{background:linear-gradient(135deg,' + CORES.primaria + ' 0%,' + CORES.primariaClara + ' 100%);color:#fff;padding:48px 40px;border-radius:12px 12px 0 0;position:relative;overflow:hidden;}'
        + '.ir-capa::after{content:"";position:absolute;top:-50%;right:-20%;width:60%;height:200%;background:rgba(255,255,255,0.03);transform:rotate(-12deg);}'
        + '.ir-capa-logo{font-size:32px;font-weight:800;letter-spacing:-1px;margin-bottom:4px;}'
        + '.ir-capa-logo span{color:' + CORES.dourado + ';}'
        + '.ir-capa-slogan{font-style:italic;font-size:13px;opacity:0.85;margin-bottom:24px;}'
        + '.ir-capa-titulo{font-size:22px;font-weight:700;margin-bottom:20px;}'
        + '.ir-capa-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 32px;font-size:14px;}'
        + '.ir-capa-grid dt{opacity:0.75;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;}'
        + '.ir-capa-grid dd{margin:0 0 8px 0;font-weight:600;}'
        + '.ir-badge-me{display:inline-block;background:' + CORES.dourado + ';color:' + CORES.primaria + ';font-size:11px;font-weight:700;padding:3px 10px;border-radius:12px;text-transform:uppercase;letter-spacing:0.5px;}'

        /* Barra de ações */
        + '.ir-acoes{position:sticky;top:0;z-index:100;background:' + CORES.branco + ';border-bottom:2px solid ' + CORES.cinzaBorda + ';padding:12px 20px;display:flex;gap:12px;justify-content:flex-end;align-items:center;}'
        + '.ir-btn{display:inline-flex;align-items:center;gap:6px;padding:10px 20px;border:none;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer;transition:transform 0.15s,box-shadow 0.15s;color:#fff;}'
        + '.ir-btn:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,0.15);}'
        + '.ir-btn-pdf{background:' + CORES.vermelho + ';}'
        + '.ir-btn-excel{background:' + CORES.verde + ';}'
        + '.ir-btn-print{background:' + CORES.primariaClara + ';}'
        + '.ir-btn svg{width:16px;height:16px;fill:currentColor;}'

        /* Seções */
        + '.ir-secao{padding:32px 40px;border-bottom:1px solid ' + CORES.cinzaBorda + ';}'
        + '.ir-secao:last-child{border-bottom:none;}'
        + '.ir-secao-titulo{font-size:18px;font-weight:700;color:' + CORES.primaria + ';margin-bottom:20px;display:flex;align-items:center;gap:10px;}'
        + '.ir-secao-numero{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:' + CORES.primariaLight + ';color:' + CORES.primariaClara + ';font-size:13px;font-weight:700;flex-shrink:0;}'

        /* Cards grid */
        + '.ir-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;}'
        + '.ir-card{background:' + CORES.cinzaFundo + ';border:1px solid ' + CORES.cinzaBorda + ';border-radius:8px;padding:20px;}'
        + '.ir-card-label{font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:' + CORES.cinzaSecundario + ';margin-bottom:6px;}'
        + '.ir-card-valor{font-size:22px;font-weight:700;color:' + CORES.primaria + ';font-family:"JetBrains Mono","Fira Code",monospace;}'
        + '.ir-card-sub{font-size:12px;color:' + CORES.cinzaSecundario + ';margin-top:4px;}'
        + '.ir-card-destaque{border-color:' + CORES.dourado + ';background:' + CORES.douradoClaro + ';}'
        + '.ir-card-destaque .ir-card-valor{color:' + CORES.dourado + ';}'
        + '.ir-card-verde{border-color:' + CORES.verde + ';background:' + CORES.verdeClaro + ';}'
        + '.ir-card-verde .ir-card-valor{color:' + CORES.verde + ';}'

        /* Tabela */
        + '.ir-tabela{width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;}'
        + '.ir-tabela th{background:' + CORES.primaria + ';color:#fff;padding:10px 14px;text-align:left;font-weight:600;font-size:13px;text-transform:uppercase;letter-spacing:0.3px;}'
        + '.ir-tabela td{padding:10px 14px;border-bottom:1px solid ' + CORES.cinzaBorda + ';}'
        + '.ir-tabela tr:nth-child(even) td{background:' + CORES.cinzaFundo + ';}'
        + '.ir-tabela tr:hover td{background:' + CORES.primariaLight + ';}'
        + '.ir-tabela .ir-td-valor{text-align:right;font-family:"JetBrains Mono","Fira Code",monospace;font-weight:600;}'
        + '.ir-tabela .ir-td-perc{text-align:center;font-family:"JetBrains Mono","Fira Code",monospace;}'

        /* Badge */
        + '.ir-badge{display:inline-block;font-size:11px;font-weight:600;padding:3px 10px;border-radius:12px;text-transform:uppercase;letter-spacing:0.3px;}'
        + '.ir-badge-critico{background:' + CORES.vermelhoClaro + ';color:' + CORES.vermelho + ';}'
        + '.ir-badge-alto{background:' + CORES.laranjaClaro + ';color:' + CORES.laranja + ';}'
        + '.ir-badge-medio{background:' + CORES.douradoClaro + ';color:' + CORES.dourado + ';}'
        + '.ir-badge-baixo{background:' + CORES.verdeClaro + ';color:' + CORES.verde + ';}'
        + '.ir-badge-melhor{background:' + CORES.verde + ';color:#fff;font-size:10px;padding:2px 8px;}'

        /* Alertas */
        + '.ir-alerta{padding:14px 18px;border-radius:6px;margin:10px 0;border-left:4px solid;font-size:14px;}'
        + '.ir-alerta-info{background:' + CORES.primariaLight + ';border-color:' + CORES.primariaClara + ';color:' + CORES.primaria + ';}'
        + '.ir-alerta-aviso{background:' + CORES.laranjaClaro + ';border-color:' + CORES.laranja + ';color:#7b341e;}'
        + '.ir-alerta-perigo{background:' + CORES.vermelhoClaro + ';border-color:' + CORES.vermelho + ';color:#9b2c2c;}'
        + '.ir-alerta-sucesso{background:' + CORES.verdeClaro + ';border-color:' + CORES.verde + ';color:#276749;}'

        /* Explicações */
        + '.ir-explicacao{background:' + CORES.cinzaFundo + ';border:1px solid ' + CORES.cinzaBorda + ';border-radius:6px;padding:16px 20px;margin:12px 0;font-size:13px;line-height:1.7;}'
        + '.ir-explicacao-titulo{font-weight:700;color:' + CORES.primaria + ';margin-bottom:6px;font-size:14px;}'
        + '.ir-explicacao-legal{font-style:italic;color:' + CORES.cinzaSecundario + ';font-size:12px;margin-top:6px;}'

        /* Timeline */
        + '.ir-timeline{position:relative;padding-left:28px;}'
        + '.ir-timeline::before{content:"";position:absolute;left:8px;top:0;bottom:0;width:3px;background:' + CORES.dourado + ';border-radius:2px;}'
        + '.ir-timeline-item{position:relative;margin-bottom:20px;}'
        + '.ir-timeline-item::before{content:"";position:absolute;left:-24px;top:6px;width:12px;height:12px;border-radius:50%;background:' + CORES.dourado + ';border:2px solid ' + CORES.branco + ';box-shadow:0 0 0 2px ' + CORES.dourado + ';}'
        + '.ir-timeline-titulo{font-weight:700;color:' + CORES.primaria + ';font-size:15px;margin-bottom:4px;}'
        + '.ir-timeline-desc{font-size:13px;color:' + CORES.cinzaSecundario + ';}'
        + '.ir-timeline-economia{font-weight:700;color:' + CORES.verde + ';font-size:14px;}'
        + '.ir-timeline-prazo{font-size:12px;color:' + CORES.cinzaSecundario + ';font-style:italic;}'

        /* Score visual */
        + '.ir-score-container{display:flex;align-items:center;gap:32px;flex-wrap:wrap;}'
        + '.ir-score-circulo{width:120px;height:120px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:800;font-size:36px;color:#fff;position:relative;}'
        + '.ir-score-faixa{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;}'
        + '.ir-score-barras{flex:1;min-width:280px;}'
        + '.ir-score-barra{margin-bottom:10px;}'
        + '.ir-score-barra-label{display:flex;justify-content:space-between;font-size:13px;margin-bottom:3px;}'
        + '.ir-score-barra-track{height:8px;background:' + CORES.cinzaBorda + ';border-radius:4px;overflow:hidden;}'
        + '.ir-score-barra-fill{height:100%;border-radius:4px;transition:width 0.5s;}'

        /* Ranking */
        + '.ir-ranking-item{display:flex;gap:16px;align-items:flex-start;padding:16px 0;border-bottom:1px solid ' + CORES.cinzaBorda + ';}'
        + '.ir-ranking-num{width:36px;height:36px;border-radius:50%;background:' + CORES.primariaClara + ';color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;flex-shrink:0;}'
        + '.ir-ranking-body{flex:1;}'
        + '.ir-ranking-titulo{font-weight:700;color:' + CORES.primaria + ';font-size:15px;}'
        + '.ir-ranking-eco{font-weight:700;color:' + CORES.verde + ';font-size:14px;margin-top:2px;}'
        + '.ir-ranking-detalhe{font-size:13px;color:' + CORES.cinzaSecundario + ';margin-top:4px;}'

        /* Rodapé */
        + '.ir-rodape{background:' + CORES.cinzaFundo + ';border-top:3px solid ' + CORES.dourado + ';padding:32px 40px;border-radius:0 0 12px 12px;}'
        + '.ir-rodape-logo{font-size:24px;font-weight:800;color:' + CORES.primaria + ';margin-bottom:4px;}'
        + '.ir-rodape-logo span{color:' + CORES.dourado + ';}'
        + '.ir-rodape-slogan{font-style:italic;font-size:13px;color:' + CORES.cinzaSecundario + ';margin-bottom:16px;}'
        + '.ir-rodape-disclaimer{font-size:11px;color:' + CORES.cinzaSecundario + ';line-height:1.6;border:1px solid ' + CORES.cinzaBorda + ';border-radius:6px;padding:12px 16px;background:' + CORES.branco + ';}'
        + '.ir-rodape-meta{display:flex;justify-content:space-between;font-size:11px;color:' + CORES.cinzaSecundario + ';margin-top:16px;}'

        /* Comparativo melhor opção */
        + '.ir-melhor-col{background:' + CORES.verdeClaro + ' !important;}'
        + '.ir-melhor-col th{background:' + CORES.verde + ' !important;}'

        /* Barra progresso economia */
        + '.ir-progresso{height:12px;background:' + CORES.cinzaBorda + ';border-radius:6px;overflow:hidden;margin:12px 0;}'
        + '.ir-progresso-fill{height:100%;background:linear-gradient(90deg,' + CORES.verde + ',' + CORES.dourado + ');border-radius:6px;transition:width 0.8s;}'

        /* Print */
        + '@media print{.ir-acoes{display:none !important;}.impost-relatorio{max-width:100%;box-shadow:none;}.ir-secao{page-break-inside:avoid;}}'
        + '@media (max-width:768px){.ir-capa{padding:24px 20px;}.ir-capa-grid{grid-template-columns:1fr;}.ir-secao{padding:20px;}.ir-cards{grid-template-columns:1fr;}.ir-score-container{flex-direction:column;align-items:stretch;}.ir-acoes{flex-wrap:wrap;justify-content:center;}.ir-btn{font-size:12px;padding:8px 14px;}}'
        + '</style>';
    }

    /**
     * Gera a capa profissional do relatório.
     * @param {Object} d — dados consolidados
     * @returns {string} HTML
     * @private
     */
    function _htmlCapa(d) {
        var emp = d.empresa || {};
        var classif = emp.classificacao || '';
        var badgeClassif = classif ? ' <span class="ir-badge-me">' + _sanitize(classif) + '</span>' : '';
        var sc = d.score || {};
        var total = sc.total || 0;
        var corScore = total >= 80 ? CORES.verde : total >= 60 ? CORES.primariaClara : total >= 40 ? CORES.dourado : CORES.vermelho;
        var sit = d.situacaoAtual || {};
        var ecoMensal = sit.economiaOtimizacao || 0;
        var ecoAnual = ecoMensal * 12;

        return '<div class="ir-capa">'
            + '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:24px;">'
            + '<div style="flex:1;min-width:280px;">'
            + '<div class="ir-capa-logo">IMPOST<span>.</span></div>'
            + '<div class="ir-capa-slogan">' + _sanitize(PRODUTO.slogan) + '</div>'
            + '<div class="ir-capa-titulo">Relat\u00f3rio de Otimiza\u00e7\u00e3o Tribut\u00e1ria' + badgeClassif + '</div>'
            + '<dl class="ir-capa-grid">'
            + '<dt>Empresa</dt><dd>' + _sanitize(emp.nome) + '</dd>'
            + '<dt>CNPJ</dt><dd>' + _sanitize(emp.cnpj ? Utils.formatarCNPJ(emp.cnpj) : 'N\u00e3o informado') + '</dd>'
            + '<dt>CNAE</dt><dd>' + _sanitize(emp.cnae ? Utils.formatarCNAE(emp.cnae) : '') + ' \u2014 ' + _sanitize(emp.descricaoCNAE) + '</dd>'
            + '<dt>Localiza\u00e7\u00e3o</dt><dd>' + _sanitize(emp.municipio || '') + (emp.uf ? '/' + _sanitize(emp.uf) : '') + '</dd>'
            + '<dt>Receita Anual</dt><dd>' + _sanitize(Utils.formatarMoeda(emp.receitaAnual)) + '</dd>'
            + '<dt>Folha Mensal</dt><dd>' + _sanitize(Utils.formatarMoeda(emp.folhaMensal)) + '</dd>'
            + '<dt>Data</dt><dd>' + _sanitize(d.geradoEmFormatado) + '</dd>'
            + '<dt>Vers\u00e3o</dt><dd>' + _sanitize(PRODUTO.versao) + '</dd>'
            + '</dl>'
            + '</div>'
            // Score em destaque na capa
            + '<div style="text-align:center;min-width:160px;">'
            + '<div style="width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,0.15);border:4px solid ' + corScore + ';display:flex;flex-direction:column;align-items:center;justify-content:center;margin:0 auto 12px;">'
            + '<div style="font-size:48px;font-weight:800;line-height:1;color:#fff;">' + total + '</div>'
            + '<div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:' + corScore + ';">' + _sanitize(sc.faixa || '') + '</div>'
            + '</div>'
            + '<div style="font-size:12px;opacity:0.8;">Score Tribut\u00e1rio</div>'
            + '</div>'
            + '</div>'
            // Resumo executivo na capa
            + (ecoAnual > 0 || sit.dasMensal > 0
                ? '<div style="margin-top:24px;display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;">'
                + '<div style="background:rgba(255,255,255,0.1);border-radius:8px;padding:12px 16px;">'
                + '<div style="font-size:11px;text-transform:uppercase;opacity:0.7;">DAS Atual</div>'
                + '<div style="font-size:22px;font-weight:700;">' + _sanitize(Utils.formatarMoeda(sit.dasMensal || 0)) + '<span style="font-size:12px;opacity:0.7;">/m\u00eas</span></div>'
                + '</div>'
                + '<div style="background:rgba(255,255,255,0.1);border-radius:8px;padding:12px 16px;">'
                + '<div style="font-size:11px;text-transform:uppercase;opacity:0.7;">DAS Otimizado</div>'
                + '<div style="font-size:22px;font-weight:700;color:' + CORES.verde + ';">' + _sanitize(Utils.formatarMoeda(sit.dasMensalOtimizado || 0)) + '<span style="font-size:12px;opacity:0.7;">/m\u00eas</span></div>'
                + '</div>'
                + (ecoAnual > 0
                    ? '<div style="background:rgba(56,161,105,0.2);border:1px solid rgba(56,161,105,0.4);border-radius:8px;padding:12px 16px;">'
                    + '<div style="font-size:11px;text-transform:uppercase;opacity:0.7;">Economia Anual</div>'
                    + '<div style="font-size:22px;font-weight:700;color:#68d391;">' + _sanitize(Utils.formatarMoeda(ecoAnual)) + '</div>'
                    + '</div>'
                    : '')
                + '</div>'
                : '')
            + '</div>';
    }

    /**
     * Gera a barra de botões de ação (PDF, Excel, Imprimir).
     * @returns {string} HTML
     * @private
     */
    function _htmlBotoesAcao() {
        var svgPDF = '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM9 13h2v5H9v-5zm4 0h2v5h-2v-5z"/></svg>';
        var svgExcel = '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8 13l2 3-2 3h1.5l1.25-2 1.25 2H13.5l-2-3 2-3H12l-1.25 2L9.5 13H8z"/></svg>';
        var svgPrint = '<svg viewBox="0 0 24 24"><path d="M19 8h-1V3H6v5H5a3 3 0 0 0-3 3v6h4v4h12v-4h4v-6a3 3 0 0 0-3-3zM8 5h8v3H8V5zm8 14H8v-4h8v4zm2-4v-2H6v2H4v-4a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v4h-2z"/></svg>';

        return '<div class="ir-acoes">'
            + '<button class="ir-btn ir-btn-pdf" onclick="if(window.SimplesEstudoCompleto&&SimplesEstudoCompleto.Relatorio)SimplesEstudoCompleto.Relatorio.exportarPDF()" title="Exportar PDF">' + svgPDF + ' Exportar PDF</button>'
            + '<button class="ir-btn ir-btn-excel" onclick="if(window.SimplesEstudoCompleto&&SimplesEstudoCompleto.Relatorio)SimplesEstudoCompleto.Relatorio.exportarExcel()" title="Exportar Excel">' + svgExcel + ' Exportar Excel</button>'
            + '<button class="ir-btn ir-btn-print" onclick="window.print()" title="Imprimir">' + svgPrint + ' Imprimir</button>'
            + '</div>';
    }

    /**
     * Gera seção de resumo executivo com cards.
     * @param {Object} d
     * @returns {string} HTML
     * @private
     */
    function _htmlResumoExecutivo(d) {
        var sit = d.situacaoAtual || {};
        var sc = d.score || {};
        var eco = sit.economiaOtimizacao || 0;
        var ecoAnual = eco * 12;
        var corScore = sc.total >= 86 ? CORES.verde : sc.total >= 71 ? CORES.primariaClara : sc.total >= 51 ? CORES.dourado : sc.total >= 31 ? CORES.laranja : CORES.vermelho;

        var ecoCard = '';
        if (d.score && d.score.economiaPotencial > 0) {
            ecoCard = '<div class="ir-card ir-card-destaque">'
                + '<div class="ir-card-label">Economia Potencial Anual</div>'
                + '<div class="ir-card-valor">' + _sanitize(Utils.formatarMoeda(d.score.economiaPotencial)) + '</div>'
                + '</div>';
        }

        return '<div class="ir-secao">'
            + '<div class="ir-secao-titulo"><span class="ir-secao-numero">01</span> Resumo Executivo</div>'
            + '<div class="ir-cards">'
            + '<div class="ir-card"><div class="ir-card-label">DAS Mensal Atual</div><div class="ir-card-valor">' + _sanitize(Utils.formatarMoeda(sit.dasMensal)) + '</div></div>'
            + '<div class="ir-card ir-card-verde"><div class="ir-card-label">DAS Otimizado</div><div class="ir-card-valor">' + _sanitize(Utils.formatarMoeda(sit.dasMensalOtimizado)) + '</div>'
            + (eco > 0 ? '<div class="ir-card-sub">' + _sanitize(Utils.formatarMoeda(eco)) + '/m\u00eas de economia</div>' : '')
            + '</div>'
            + '<div class="ir-card"><div class="ir-card-label">Al\u00edquota Efetiva</div><div class="ir-card-valor">' + _sanitize(sit.aliquotaEfetivaFormatada || '0,00%') + '</div>'
            + '<div class="ir-card-sub">Nominal: ' + _sanitize(sit.aliquotaNominalFormatada || 'N/A') + '</div></div>'
            + '<div class="ir-card"><div class="ir-card-label">Score Tribut\u00e1rio</div><div class="ir-card-valor" style="color:' + corScore + '">' + (sc.total || 0) + '/100</div>'
            + '<div class="ir-card-sub">' + _sanitize(sc.descricao || '') + '</div></div>'
            + ecoCard
            + '<div class="ir-card"><div class="ir-card-label">Anexo</div><div class="ir-card-valor">' + _sanitize(sit.anexo || 'N/A') + '</div>'
            + '<div class="ir-card-sub">' + _sanitize(sit.anexoNome || '') + '</div></div>'
            + '</div></div>';
    }

    /**
     * Gera seção visual do score tributário.
     * @param {Object} d
     * @returns {string} HTML
     * @private
     */
    function _htmlScoreTributario(d) {
        var sc = d.score || {};
        var total = sc.total || 0;
        var corBg = total >= 86 ? CORES.verde : total >= 71 ? CORES.primariaClara : total >= 51 ? CORES.dourado : total >= 31 ? CORES.laranja : CORES.vermelho;

        var barrasHTML = '';
        var cats = sc.categorias || {};
        var catsArray = Array.isArray(cats) ? cats : Object.keys(cats).map(function(k) {
            var c = cats[k];
            return { nome: NOMES_CATEGORIA_SCORE[k] || k, pontuacao: c.pontos, maximo: c.maximo, motivo: c.motivo };
        });
        catsArray.forEach(function (cat) {
            var nome = cat.nome || cat.categoria || '';
            var pts = cat.pontuacao || cat.pontos || 0;
            var max = cat.maximo || cat.max || 25;
            var pct = max > 0 ? Math.min(100, (pts / max) * 100) : 0;
            var cor = pct >= 80 ? CORES.verde : pct >= 60 ? CORES.primariaClara : pct >= 40 ? CORES.dourado : CORES.vermelho;
            barrasHTML += '<div class="ir-score-barra">'
                + '<div class="ir-score-barra-label"><span>' + _sanitize(nome) + '</span><span>' + pts + '/' + max + '</span></div>'
                + '<div class="ir-score-barra-track"><div class="ir-score-barra-fill" style="width:' + pct + '%;background:' + cor + '"></div></div>'
                + '</div>';
        });

        return '<div class="ir-secao">'
            + '<div class="ir-secao-titulo"><span class="ir-secao-numero">02</span> Score Tribut\u00e1rio</div>'
            + '<div class="ir-score-container">'
            + '<div class="ir-score-circulo" style="background:' + corBg + ';">' + total + '<div class="ir-score-faixa">' + _sanitize(sc.faixa || '') + '</div></div>'
            + '<div class="ir-score-barras">' + barrasHTML + '</div>'
            + '</div>'
            + (sc.economiaPotencial > 0 ? '<div class="ir-alerta ir-alerta-sucesso" style="margin-top:16px;">Economia potencial identificada: <strong>' + _sanitize(Utils.formatarMoeda(sc.economiaPotencial)) + '/ano</strong></div>' : '')
            + '</div>';
    }

    /**
     * Gera seção de situação atual detalhada.
     * @param {Object} d
     * @returns {string} HTML
     * @private
     */
    function _htmlSituacaoAtual(d) {
        var sit = d.situacaoAtual || {};
        var part = d.partilhaTributos || {};

        // Cards de indicadores principais
        var cardsHTML = '<div class="ir-cards" style="margin-bottom:24px;">'
            + '<div class="ir-card"><div class="ir-card-label">DAS Mensal</div><div class="ir-card-valor">' + _sanitize(Utils.formatarMoeda(sit.dasMensal)) + '</div>'
            + '<div class="ir-card-sub">DAS anual: ' + _sanitize(Utils.formatarMoeda(sit.dasAnual)) + '</div></div>'
            + '<div class="ir-card"><div class="ir-card-label">Al\u00edquota Efetiva</div><div class="ir-card-valor">' + _sanitize(sit.aliquotaEfetivaFormatada || '0,00%') + '</div>'
            + '<div class="ir-card-sub">Nominal: ' + _sanitize(sit.aliquotaNominalFormatada || 'N/A') + '</div></div>'
            + '<div class="ir-card"><div class="ir-card-label">Anexo</div><div class="ir-card-valor" style="font-size:18px;">' + _sanitize(sit.anexo || 'N/A') + '</div>'
            + '<div class="ir-card-sub">' + _sanitize(sit.anexoNome || '') + '</div></div>'
            + '<div class="ir-card"><div class="ir-card-label">Faixa</div><div class="ir-card-valor" style="font-size:18px;">' + _sanitize(sit.faixa || '') + '\u00aa</div>'
            + '<div class="ir-card-sub">' + _sanitize(sit.faixaDescricao || '') + '</div></div>'
            + '</div>';

        // Fator R — barra visual colorida
        var frVal = sit.fatorR || 0;
        var frPct = Math.min(100, typeof frVal === 'number' ? frVal * 100 : parseFloat(frVal) || 0);
        var frCor = sit.fatorRAcimaLimiar ? CORES.verde : CORES.vermelho;
        var frBadge = sit.fatorRAcimaLimiar
            ? '<span class="ir-badge ir-badge-baixo">\u2265 28% \u2014 Pode migrar para Anexo III</span>'
            : '<span class="ir-badge ir-badge-alto">&lt; 28% \u2014 Permanece no Anexo V</span>';

        var fatorRHTML = '<div style="margin-bottom:24px;">'
            + '<h4 style="color:' + CORES.primaria + ';margin-bottom:10px;">Fator R</h4>'
            + '<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">'
            + '<div style="flex:1;min-width:250px;">'
            + '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">'
            + '<span>Fator R: <strong>' + _sanitize(sit.fatorRPercentual || '0,00%') + '</strong></span>'
            + '<span style="color:' + CORES.cinzaSecundario + '">Limiar: 28%</span></div>'
            + '<div style="height:28px;background:' + CORES.cinzaBorda + ';border-radius:14px;overflow:hidden;position:relative;">'
            + '<div style="width:' + frPct + '%;height:100%;background:linear-gradient(90deg,' + frCor + ',' + (sit.fatorRAcimaLimiar ? '#68d391' : '#fc8181') + ');border-radius:14px;transition:width 0.8s;"></div>'
            + '<div style="position:absolute;left:28%;top:0;bottom:0;width:2px;background:' + CORES.primaria + ';opacity:0.6;"></div>'
            + '<div style="position:absolute;left:calc(28% + 4px);top:50%;transform:translateY(-50%);font-size:10px;color:' + CORES.primaria + ';font-weight:600;">28%</div>'
            + '</div>'
            + '<div style="margin-top:6px;">' + frBadge + '</div>'
            + '</div></div></div>';

        // Partilha — tabela + gráfico pizza CSS
        var tributos = ['irpj', 'csll', 'cofins', 'pis', 'cpp', 'icms', 'iss'];
        var nomeTrib = { irpj: 'IRPJ', csll: 'CSLL', cofins: 'COFINS', pis: 'PIS/Pasep', cpp: 'CPP', icms: 'ICMS', iss: 'ISS' };
        var coresTrib = { irpj: '#1a365d', csll: '#2b6cb0', cofins: '#38a169', pis: '#d69e2e', cpp: '#dd6b20', icms: '#e53e3e', iss: '#805ad5' };
        var partData = [];
        var partTotal = 0;
        tributos.forEach(function (t) {
            var val = part[t];
            if (val == null) return;
            var pctVal = 0;
            if (typeof val === 'object' && val !== null) {
                pctVal = (val.percentual || 0) * 100;
            } else if (typeof val === 'number') {
                pctVal = val < 1 ? val * 100 : val;
            } else {
                pctVal = parseFloat(val) || 0;
            }
            if (pctVal > 0.01) {
                partData.push({ nome: nomeTrib[t] || t.toUpperCase(), pct: pctVal, cor: coresTrib[t] || '#718096' });
                partTotal += pctVal;
            }
        });

        var partilhaHTML = '';
        if (partData.length > 0) {
            // Gerar conic-gradient para pizza CSS
            var gradParts = [];
            var acum = 0;
            partData.forEach(function (p) {
                var frac = partTotal > 0 ? (p.pct / partTotal) * 100 : 0;
                gradParts.push(p.cor + ' ' + acum.toFixed(1) + '% ' + (acum + frac).toFixed(1) + '%');
                acum += frac;
            });

            var legendaHTML = '';
            partData.forEach(function (p) {
                legendaHTML += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">'
                    + '<div style="width:14px;height:14px;border-radius:3px;background:' + p.cor + ';flex-shrink:0;"></div>'
                    + '<span style="font-size:13px;flex:1;">' + _sanitize(p.nome) + '</span>'
                    + '<span style="font-size:13px;font-weight:600;font-family:\'JetBrains Mono\',monospace;">' + p.pct.toFixed(2) + '%</span>'
                    + '</div>';
            });

            partilhaHTML = '<h4 style="color:' + CORES.primaria + ';margin:24px 0 12px;">Partilha de Tributos no DAS</h4>'
                + '<div style="display:flex;gap:32px;align-items:center;flex-wrap:wrap;">'
                + '<div style="width:180px;height:180px;border-radius:50%;background:conic-gradient(' + gradParts.join(',') + ');flex-shrink:0;box-shadow:inset 0 0 0 30px ' + CORES.branco + ';"></div>'
                + '<div style="flex:1;min-width:200px;">' + legendaHTML + '</div>'
                + '</div>';
        }

        return '<div class="ir-secao">'
            + '<div class="ir-secao-titulo"><span class="ir-secao-numero">03</span> Situa\u00e7\u00e3o Atual</div>'
            + cardsHTML
            + fatorRHTML
            + partilhaHTML
            + '</div>';
    }

    /**
     * Gera seção de comparativo de regimes tributários.
     * @param {Object} d
     * @returns {string} HTML
     * @private
     */
    function _htmlComparativoRegimes(d) {
        var comp = d.comparativoRegimes;
        if (!comp) {
            return '<div class="ir-secao">'
                + '<div class="ir-secao-titulo"><span class="ir-secao-numero">04</span> Comparativo de Regimes</div>'
                + '<div class="ir-alerta ir-alerta-info">Comparativo de regimes n\u00e3o dispon\u00edvel. Carregue os motores de c\u00e1lculo de Lucro Presumido e Lucro Real para habilitar.</div>'
                + '</div>';
        }

        var sn = comp.simplesNacional || comp.simples || {};
        var lp = comp.lucroPresumido || comp.presumido || {};
        var lr = comp.lucroReal || comp.real || {};

        // Determinar melhor
        var cargaSN = sn.cargaTotal || sn.cargaTributaria || 0;
        var cargaLP = lp.cargaTotal || lp.cargaTributaria || 0;
        var cargaLR = lr.cargaTotal || lr.cargaTributaria || 0;
        var menorCarga = Math.min(cargaSN || Infinity, cargaLP || Infinity, cargaLR || Infinity);
        var melhorSN = cargaSN > 0 && cargaSN === menorCarga;
        var melhorLP = cargaLP > 0 && cargaLP === menorCarga;
        var melhorLR = cargaLR > 0 && cargaLR === menorCarga;

        function _colClass(isMelhor) { return isMelhor ? ' class="ir-melhor-col"' : ''; }
        function _badge(isMelhor) { return isMelhor ? ' <span class="ir-badge ir-badge-melhor">MELHOR OP\u00c7\u00c3O</span>' : ''; }

        return '<div class="ir-secao">'
            + '<div class="ir-secao-titulo"><span class="ir-secao-numero">04</span> Comparativo de Regimes</div>'
            + '<table class="ir-tabela"><thead><tr>'
            + '<th>Indicador</th>'
            + '<th' + _colClass(melhorSN) + '>Simples Nacional' + _badge(melhorSN) + '</th>'
            + '<th' + _colClass(melhorLP) + '>Lucro Presumido' + _badge(melhorLP) + '</th>'
            + '<th' + _colClass(melhorLR) + '>Lucro Real' + _badge(melhorLR) + '</th>'
            + '</tr></thead><tbody>'
            + '<tr><td>Carga Tribut\u00e1ria Anual</td>'
            + '<td class="ir-td-valor">' + _sanitize(_moedaOuNA(cargaSN)) + '</td>'
            + '<td class="ir-td-valor">' + _sanitize(_moedaOuNA(cargaLP)) + '</td>'
            + '<td class="ir-td-valor">' + _sanitize(_moedaOuNA(cargaLR)) + '</td></tr>'
            + '<tr><td>Al\u00edquota Efetiva</td>'
            + '<td class="ir-td-perc">' + _sanitize(_percOuNA(sn.aliquotaEfetiva)) + '</td>'
            + '<td class="ir-td-perc">' + _sanitize(_percOuNA(lp.aliquotaEfetiva)) + '</td>'
            + '<td class="ir-td-perc">' + _sanitize(_percOuNA(lr.aliquotaEfetiva)) + '</td></tr>'
            + '<tr><td>Complexidade</td>'
            + '<td class="ir-td-perc">' + _sanitize(sn.complexidade || 'Baixa') + '</td>'
            + '<td class="ir-td-perc">' + _sanitize(lp.complexidade || 'M\u00e9dia') + '</td>'
            + '<td class="ir-td-perc">' + _sanitize(lr.complexidade || 'Alta') + '</td></tr>'
            + '<tr><td>Obriga\u00e7\u00f5es Acess\u00f3rias</td>'
            + '<td class="ir-td-perc">' + _sanitize(sn.obrigacoes || 'Reduzidas') + '</td>'
            + '<td class="ir-td-perc">' + _sanitize(lp.obrigacoes || 'Intermedi\u00e1rias') + '</td>'
            + '<td class="ir-td-perc">' + _sanitize(lr.obrigacoes || 'Extensas') + '</td></tr>'
            + '</tbody></table>'
            + '<div class="ir-alerta ir-alerta-info" style="margin-top:12px;font-size:12px;">'
            + '<strong>Nota:</strong> Os valores de Lucro Presumido e Lucro Real s\u00e3o meramente estimativos e n\u00e3o consideram todas as vari\u00e1veis de cada regime. '
            + 'Consulte seu contador para uma an\u00e1lise detalhada antes de qualquer decis\u00e3o de mudan\u00e7a de regime tribut\u00e1rio.'
            + '</div></div>';
    }

    /**
     * Gera seção de oportunidades de economia rankeadas.
     * @param {Object} d
     * @returns {string} HTML
     * @private
     */
    function _htmlOportunidadesEconomia(d) {
        var ops = d.oportunidades || [];
        if (ops.length === 0) {
            return '<div class="ir-secao">'
                + '<div class="ir-secao-titulo"><span class="ir-secao-numero">05</span> Oportunidades de Economia</div>'
                + '<div class="ir-alerta ir-alerta-info">Nenhuma oportunidade adicional de economia identificada com os dados informados.</div>'
                + '</div>';
        }

        var totalEco = 0;
        var itensHTML = '';
        ops.forEach(function (op, i) {
            var eco = op.economiaAnual || op.economia || 0;
            totalEco += eco;
            var dif = op.dificuldade || op.complexidade || 'media';
            var badgeClass = dif === 'alta' || dif === 'critico' ? 'ir-badge-alto' : dif === 'baixa' ? 'ir-badge-baixo' : 'ir-badge-medio';
            var passos = op.passos || op.passoAPasso || [];
            var passosHTML = '';
            if (Array.isArray(passos) && passos.length > 0) {
                passosHTML = '<ol style="margin:8px 0 0 16px;font-size:13px;color:' + CORES.cinzaSecundario + '">';
                passos.forEach(function (p) {
                    passosHTML += '<li>' + _sanitize(typeof p === 'string' ? p : p.descricao || p.texto || String(p)) + '</li>';
                });
                passosHTML += '</ol>';
            }

            itensHTML += '<div class="ir-ranking-item">'
                + '<div class="ir-ranking-num">' + (i + 1) + '</div>'
                + '<div class="ir-ranking-body">'
                + '<div class="ir-ranking-titulo">' + _sanitize(op.titulo || op.oportunidade || 'Oportunidade ' + (i + 1)) + '</div>'
                + (eco > 0 ? '<div class="ir-ranking-eco">Economia: ' + _sanitize(Utils.formatarMoeda(eco)) + '/ano</div>' : '')
                + '<div style="margin-top:4px;"><span class="ir-badge ' + badgeClass + '">Dificuldade: ' + _sanitize(dif) + '</span>'
                + (op.tempo || op.prazo ? ' <span style="font-size:12px;color:' + CORES.cinzaSecundario + ';margin-left:8px;">Prazo: ' + _sanitize(op.tempo || op.prazo) + '</span>' : '')
                + '</div>'
                + (op.baseLegal ? '<div class="ir-ranking-detalhe">Base legal: ' + _sanitize(op.baseLegal) + '</div>' : '')
                + passosHTML
                + '</div></div>';
        });

        var barraPercent = totalEco > 0 && d.situacaoAtual && d.situacaoAtual.dasAnual > 0
            ? Math.min(100, (totalEco / d.situacaoAtual.dasAnual) * 100) : 0;

        return '<div class="ir-secao">'
            + '<div class="ir-secao-titulo"><span class="ir-secao-numero">05</span> Oportunidades de Economia</div>'
            + (totalEco > 0 ? '<div style="margin-bottom:16px;font-size:15px;">Economia total potencial: <strong style="color:' + CORES.verde + '">' + _sanitize(Utils.formatarMoeda(totalEco)) + '/ano</strong></div>'
                + '<div class="ir-progresso"><div class="ir-progresso-fill" style="width:' + barraPercent + '%"></div></div>' : '')
            + itensHTML
            + '</div>';
    }

    /**
     * Gera seção de plano de ação com timeline.
     * @param {Object} d
     * @returns {string} HTML
     * @private
     */
    function _htmlPlanoAcao(d) {
        var pa = d.planoAcao || {};
        var acoes = pa.acoes || [];
        if (acoes.length === 0) {
            return '<div class="ir-secao">'
                + '<div class="ir-secao-titulo"><span class="ir-secao-numero">06</span> Plano de A\u00e7\u00e3o</div>'
                + '<div class="ir-alerta ir-alerta-info">Nenhuma a\u00e7\u00e3o recomendada com os dados atuais.</div>'
                + '</div>';
        }

        // Agrupar por prazo
        var grupos = { imediato: [], curto: [], medio: [], continuo: [] };
        acoes.forEach(function (a) {
            var prazo = (a.prazo || a.prioridade || 'medio').toLowerCase();
            if (prazo.indexOf('imediato') >= 0 || prazo.indexOf('semana') >= 0 || prazo === 'alta' || prazo === 'critica') {
                grupos.imediato.push(a);
            } else if (prazo.indexOf('curto') >= 0 || prazo.indexOf('30') >= 0) {
                grupos.curto.push(a);
            } else if (prazo.indexOf('continuo') >= 0 || prazo.indexOf('acompanhamento') >= 0) {
                grupos.continuo.push(a);
            } else {
                grupos.medio.push(a);
            }
        });

        function _renderGrupo(titulo, lista) {
            if (lista.length === 0) return '';
            var html = '<div class="ir-timeline-item"><div class="ir-timeline-titulo">' + _sanitize(titulo) + '</div>';
            lista.forEach(function (a) {
                var prioClass = (a.prioridade === 'alta' || a.prioridade === 'critica') ? 'ir-badge-critico' : a.prioridade === 'media' ? 'ir-badge-medio' : 'ir-badge-baixo';
                html += '<div style="margin:8px 0;padding:8px 12px;background:' + CORES.cinzaFundo + ';border-radius:6px;">'
                    + '<span class="ir-badge ' + prioClass + '">' + _sanitize(a.prioridade || 'normal') + '</span> '
                    + '<strong>' + _sanitize(a.titulo || a.acao || '') + '</strong>'
                    + (a.economia || a.economiaAnual ? '<span class="ir-timeline-economia" style="margin-left:12px;">' + _sanitize(Utils.formatarMoeda(a.economia || a.economiaAnual)) + '</span>' : '')
                    + (a.responsavel ? '<div class="ir-timeline-prazo">Respons\u00e1vel: ' + _sanitize(a.responsavel) + '</div>' : '')
                    + '</div>';
            });
            html += '</div>';
            return html;
        }

        return '<div class="ir-secao">'
            + '<div class="ir-secao-titulo"><span class="ir-secao-numero">06</span> Plano de A\u00e7\u00e3o</div>'
            + (pa.economiaTotal > 0 ? '<div class="ir-alerta ir-alerta-sucesso">Economia total do plano: <strong>' + _sanitize(Utils.formatarMoeda(pa.economiaTotal)) + '/ano</strong> \u2014 ' + pa.totalAcoes + ' a\u00e7\u00f5es recomendadas</div>' : '')
            + '<div class="ir-timeline">'
            + _renderGrupo('A\u00e7\u00f5es Imediatas (Semana 1)', grupos.imediato)
            + _renderGrupo('Curto Prazo (30 dias)', grupos.curto)
            + _renderGrupo('M\u00e9dio Prazo (90 dias)', grupos.medio)
            + _renderGrupo('Acompanhamento Cont\u00ednuo', grupos.continuo)
            + '</div></div>';
    }

    /**
     * Gera seção de distribuição de lucros.
     * @param {Object} d
     * @returns {string} HTML
     * @private
     */
    function _htmlDistribuicaoLucros(d) {
        var dist = d.distribuicaoLucros || {};
        var socios = dist.porSocio || [];
        var divid = d.tributacaoDividendos2026;

        var tabelaSocios = '';
        if (socios.length > 0) {
            tabelaSocios = '<table class="ir-tabela"><thead><tr><th>S\u00f3cio</th><th style="text-align:center">Participa\u00e7\u00e3o</th><th style="text-align:right">Valor Isento Anual</th></tr></thead><tbody>';
            socios.forEach(function (s) {
                var perc = s.percentual || s.participacao || 0;
                var val = s.valorIsento || s.lucroIsento || s.valor || 0;
                tabelaSocios += '<tr><td>' + _sanitize(s.nome || 'S\u00f3cio') + '</td>'
                    + '<td class="ir-td-perc">' + _sanitize(typeof perc === 'number' && perc <= 1 ? Utils.formatarPercentual(perc) : perc + '%') + '</td>'
                    + '<td class="ir-td-valor">' + _sanitize(Utils.formatarMoeda(val)) + '</td></tr>';
            });
            tabelaSocios += '</tbody></table>';
        }

        return '<div class="ir-secao">'
            + '<div class="ir-secao-titulo"><span class="ir-secao-numero">07</span> Distribui\u00e7\u00e3o de Lucros</div>'
            + '<div class="ir-cards" style="margin-bottom:16px;">'
            + '<div class="ir-card"><div class="ir-card-label">Modalidade</div><div class="ir-card-valor" style="font-size:16px;">' + _sanitize(dist.modalidade === 'contabil' ? 'Escritura\u00e7\u00e3o Cont\u00e1bil' : 'Presun\u00e7\u00e3o') + '</div></div>'
            + '<div class="ir-card"><div class="ir-card-label">% Presun\u00e7\u00e3o</div><div class="ir-card-valor">' + _sanitize(dist.percentualPresuncaoFormatado || Utils.formatarPercentual(dist.percentualPresuncao || 0.32)) + '</div></div>'
            + '<div class="ir-card ir-card-verde"><div class="ir-card-label">Lucro Distribu\u00edvel</div><div class="ir-card-valor">' + _sanitize(Utils.formatarMoeda(dist.lucroDistribuivel || 0)) + '</div></div>'
            + '</div>'
            + tabelaSocios
            + '<div class="ir-explicacao" style="margin-top:16px;">'
            + '<div class="ir-explicacao-titulo">Base Legal</div>'
            + '<p>A distribui\u00e7\u00e3o de lucros apurados em escritura\u00e7\u00e3o cont\u00e1bil ou por presun\u00e7\u00e3o (Simples Nacional) \u00e9 isenta de Imposto de Renda na fonte e na declara\u00e7\u00e3o do benefici\u00e1rio.</p>'
            + '<div class="ir-explicacao-legal">Art. 10, Lei 9.249/95 \u2014 "Os lucros ou dividendos calculados com base nos resultados apurados a partir do m\u00eas de janeiro de 1996, pagos ou creditados pelas pessoas jur\u00eddicas tributadas com base no lucro real, presumido ou arbitrado, n\u00e3o ficar\u00e3o sujeitos \u00e0 incid\u00eancia do imposto de renda na fonte, nem integrar\u00e3o a base de c\u00e1lculo do imposto de renda do benefici\u00e1rio."</div>'
            + '</div>'
            + (divid ? '<div class="ir-alerta ir-alerta-aviso"><strong>Alerta \u2014 Dividendos 2026 (Lei 15.270/2025):</strong> Distribui\u00e7\u00f5es acima de R$ 50.000,00/m\u00eas poder\u00e3o ser tributadas na fonte. Consulte seu contador para planejamento.</div>' : '')
            + (dist.alertas && dist.alertas.length > 0 ? dist.alertas.map(function (a) {
                return '<div class="ir-alerta ir-alerta-aviso">' + _sanitize(typeof a === 'string' ? a : a.mensagem || a.alerta || String(a)) + '</div>';
            }).join('') : '')
            + '</div>';
    }

    /**
     * Gera seção de dicas de economia.
     * @param {Object} d
     * @returns {string} HTML
     * @private
     */
    function _htmlDicasEconomia(d) {
        var estrats = d.estrategias || [];
        var dicas = d.dicasEconomia;
        var dicasArr = [];
        if (dicas && dicas.dicas) {
            dicasArr = dicas.dicas;
        }

        var todas = [];
        estrats.forEach(function (e) { todas.push(e); });
        dicasArr.forEach(function (dd) {
            todas.push({
                titulo: dd.titulo || dd.dica || '',
                descricao: dd.descricao || dd.detalhamento || '',
                impacto: dd.impacto || 'medio',
                baseLegal: dd.baseLegal || ''
            });
        });

        if (todas.length === 0) {
            return '<div class="ir-secao">'
                + '<div class="ir-secao-titulo"><span class="ir-secao-numero">08</span> Dicas de Economia</div>'
                + '<div class="ir-alerta ir-alerta-info">Nenhuma dica adicional para o perfil informado.</div>'
                + '</div>';
        }

        var cardsHTML = '';
        todas.forEach(function (t) {
            var impacto = (t.impacto || 'medio').toLowerCase();
            var badgeClass = impacto === 'alto' ? 'ir-badge-alto' : impacto === 'baixo' ? 'ir-badge-baixo' : 'ir-badge-medio';
            cardsHTML += '<div style="padding:14px 18px;border:1px solid ' + CORES.cinzaBorda + ';border-radius:8px;margin-bottom:10px;">'
                + '<div style="font-weight:700;color:' + CORES.primaria + ';margin-bottom:4px;">' + _sanitize(t.titulo) + '</div>'
                + '<div style="font-size:13px;color:' + CORES.cinzaSecundario + ';">' + _sanitize(t.descricao) + '</div>'
                + '<div style="margin-top:6px;"><span class="ir-badge ' + badgeClass + '">Impacto: ' + _sanitize(impacto) + '</span>'
                + (t.baseLegal ? '<span style="font-size:11px;color:' + CORES.cinzaSecundario + ';margin-left:8px;">' + _sanitize(t.baseLegal) + '</span>' : '')
                + '</div></div>';
        });

        return '<div class="ir-secao">'
            + '<div class="ir-secao-titulo"><span class="ir-secao-numero">08</span> Dicas de Economia</div>'
            + cardsHTML + '</div>';
    }

    /**
     * Gera seção de riscos e alertas.
     * @param {Object} d
     * @returns {string} HTML
     * @private
     */
    function _htmlRiscosAlertas(d) {
        var alertas = d.alertas || [];
        var riscos = d.riscosFiscais || [];
        var penalidades = d.penalidades2026 || [];

        if (alertas.length === 0 && riscos.length === 0 && penalidades.length === 0) {
            return '<div class="ir-secao">'
                + '<div class="ir-secao-titulo"><span class="ir-secao-numero">09</span> Riscos e Alertas</div>'
                + '<div class="ir-alerta ir-alerta-sucesso">Nenhum risco fiscal relevante identificado.</div>'
                + '</div>';
        }

        var html = '<div class="ir-secao">'
            + '<div class="ir-secao-titulo"><span class="ir-secao-numero">09</span> Riscos e Alertas</div>';

        if (alertas.length > 0) {
            html += '<h4 style="color:' + CORES.vermelho + ';margin-bottom:10px;">Alertas Priorit\u00e1rios</h4>';
            alertas.forEach(function (a) {
                var msg = typeof a === 'string' ? a : a.mensagem || a.alerta || String(a);
                var tipo = (typeof a === 'object' && a.tipo) ? a.tipo : 'aviso';
                var cls = tipo === 'perigo' || tipo === 'critico' ? 'ir-alerta-perigo' : 'ir-alerta-aviso';
                html += '<div class="ir-alerta ' + cls + '">' + _sanitize(msg) + '</div>';
            });
        }

        if (riscos.length > 0) {
            var _gravOrdem = { critica: 0, critico: 0, alta: 1, alto: 1, media: 2, medio: 2, baixa: 3, baixo: 3 };
            var riscosOrdenados = riscos.slice().sort(function (a, b) {
                var ga = _gravOrdem[(a.gravidade || 'media').toLowerCase()]; if (ga == null) ga = 2;
                var gb = _gravOrdem[(b.gravidade || 'media').toLowerCase()]; if (gb == null) gb = 2;
                return ga - gb;
            });
            var iconesGrav = { critica: '\u26D4', critico: '\u26D4', alta: '\u26A0', alto: '\u26A0', media: '\u2139', medio: '\u2139', baixa: '\u2714', baixo: '\u2714' };
            html += '<h4 style="color:' + CORES.laranja + ';margin:20px 0 10px;">Riscos Fiscais</h4>'
                + '<table class="ir-tabela"><thead><tr><th style="width:40px"></th><th>Risco</th><th>Gravidade</th><th>Recomenda\u00e7\u00e3o</th></tr></thead><tbody>';
            riscosOrdenados.forEach(function (r) {
                var grav = (r.gravidade || 'media').toLowerCase();
                var badgeClass = grav === 'alta' || grav === 'critica' || grav === 'critico' || grav === 'alto' ? 'ir-badge-critico' : grav === 'media' || grav === 'medio' ? 'ir-badge-medio' : 'ir-badge-baixo';
                var icone = iconesGrav[grav] || '\u2139';
                html += '<tr><td style="font-size:18px;text-align:center;">' + icone + '</td>'
                    + '<td><strong>' + _sanitize(r.titulo) + '</strong><br><span style="font-size:12px;color:' + CORES.cinzaSecundario + '">' + _sanitize(r.descricao || '') + '</span></td>'
                    + '<td><span class="ir-badge ' + badgeClass + '">' + _sanitize(grav) + '</span></td>'
                    + '<td style="font-size:13px;">' + _sanitize(r.recomendacao || '') + '</td></tr>';
            });
            html += '</tbody></table>';
        }

        if (penalidades.length > 0) {
            html += '<h4 style="color:' + CORES.vermelho + ';margin:20px 0 10px;">Penalidades 2026</h4>';
            penalidades.forEach(function (p) {
                var desc = typeof p === 'string' ? p : p.descricao || p.penalidade || String(p);
                html += '<div class="ir-alerta ir-alerta-perigo" style="font-size:13px;">' + _sanitize(desc) + '</div>';
            });
        }

        html += '</div>';
        return html;
    }

    /**
     * Gera seção de calendário fiscal.
     * @param {Object} d
     * @returns {string} HTML
     * @private
     */
    function _htmlCalendarioFiscal(d) {
        var cal = d.calendarioFiscal || {};
        var obrig = d.obrigacoesAcessorias || [];
        var temCal = cal && Object.keys(cal).length > 0;
        var temObrig = obrig.length > 0;

        if (!temCal && !temObrig) {
            return '<div class="ir-secao">'
                + '<div class="ir-secao-titulo"><span class="ir-secao-numero">10</span> Calend\u00e1rio Fiscal</div>'
                + '<div class="ir-alerta ir-alerta-info">Calend\u00e1rio fiscal n\u00e3o dispon\u00edvel.</div>'
                + '</div>';
        }

        var html = '<div class="ir-secao">'
            + '<div class="ir-secao-titulo"><span class="ir-secao-numero">10</span> Calend\u00e1rio Fiscal 2026</div>';

        if (temCal) {
            var meses = ['Janeiro', 'Fevereiro', 'Mar\u00e7o', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
            html += '<div class="ir-timeline">';
            var calKeys = Object.keys(cal);
            calKeys.forEach(function (key) {
                var mes = cal[key];
                var nomeMes = meses[parseInt(key) - 1] || key;
                if (typeof mes === 'string') {
                    html += '<div class="ir-timeline-item"><div class="ir-timeline-titulo">' + _sanitize(nomeMes) + '</div>'
                        + '<div class="ir-timeline-desc">' + _sanitize(mes) + '</div></div>';
                } else if (mes && typeof mes === 'object') {
                    var eventos = Array.isArray(mes) ? mes : (mes.eventos || mes.obrigacoes || [mes]);
                    html += '<div class="ir-timeline-item"><div class="ir-timeline-titulo">' + _sanitize(nomeMes) + '</div>';
                    eventos.forEach(function (ev) {
                        var txt = typeof ev === 'string' ? ev : ev.descricao || ev.obrigacao || ev.nome || String(ev);
                        var prazoEv = typeof ev === 'object' ? (ev.prazo || ev.data || '') : '';
                        html += '<div class="ir-timeline-desc">' + _sanitize(txt) + (prazoEv ? ' <em>(' + _sanitize(prazoEv) + ')</em>' : '') + '</div>';
                    });
                    html += '</div>';
                }
            });
            html += '</div>';
        }

        if (temObrig) {
            html += '<h4 style="margin:24px 0 10px;color:' + CORES.primaria + '">Obriga\u00e7\u00f5es Acess\u00f3rias do Simples Nacional</h4>'
                + '<table class="ir-tabela"><thead><tr><th>Obriga\u00e7\u00e3o</th><th>Periodicidade</th><th>Prazo</th><th>Base Legal</th></tr></thead><tbody>';
            obrig.forEach(function (o) {
                html += '<tr><td><strong>' + _sanitize(o.nome) + '</strong><br><span style="font-size:12px;color:' + CORES.cinzaSecundario + '">' + _sanitize(o.descricao || '') + '</span></td>'
                    + '<td>' + _sanitize(o.periodicidade || '') + '</td>'
                    + '<td>' + _sanitize(o.prazo || '') + '</td>'
                    + '<td style="font-size:12px;">' + _sanitize(o.baseLegal || '') + '</td></tr>';
            });
            html += '</tbody></table>';
        }

        html += '</div>';
        return html;
    }

    /**
     * Gera seção informativa sobre reforma tributária.
     * @param {Object} d
     * @returns {string} HTML
     * @private
     */
    function _htmlReformaTributaria(d) {
        var ref = d.reformaTributaria || {};
        if (!ref.cronograma && !ref.impactoSimples && (!ref.dados || Object.keys(ref.dados).length === 0)) {
            return '';
        }

        return '<div class="ir-secao">'
            + '<div class="ir-secao-titulo"><span class="ir-secao-numero">11</span> Reforma Tribut\u00e1ria</div>'
            + '<div class="ir-alerta ir-alerta-info"><strong>Cronograma:</strong> ' + _sanitize(ref.cronograma || 'Transi\u00e7\u00e3o 2026-2033') + '</div>'
            + '<div class="ir-explicacao">'
            + '<div class="ir-explicacao-titulo">Impacto no Simples Nacional</div>'
            + '<p>' + _sanitize(ref.impactoSimples || 'O Simples Nacional permanece com tratamento diferenciado durante a reforma tribut\u00e1ria. As empresas optantes mant\u00eam o recolhimento unificado.') + '</p>'
            + '<div class="ir-explicacao-legal">Base legal: ' + _sanitize(ref.baseLegal || 'EC 132/2023; LC 214/2025; LC 227/2026') + '</div>'
            + '</div></div>';
    }

    /**
     * Gera seção de explicações legais.
     * @param {Object} d
     * @returns {string} HTML
     * @private
     */
    function _htmlExplicacoesLegais(d) {
        var exps = d.explicacoes || {};
        var keys = Object.keys(exps);
        if (keys.length === 0) {
            return '';
        }

        var nomes = {
            anexo: 'Explica\u00e7\u00e3o do Anexo',
            fatorR: 'Fator R',
            economia: 'Economia',
            iss: 'ISS',
            cpp: 'CPP',
            mei: 'MEI'
        };

        var html = '<div class="ir-secao">'
            + '<div class="ir-secao-titulo"><span class="ir-secao-numero">12</span> Explica\u00e7\u00f5es Legais</div>';

        keys.forEach(function (k) {
            var val = exps[k];
            if (!val) return;
            var texto = typeof val === 'string' ? val : val.texto || val.explicacao || '';
            var legal = typeof val === 'object' ? (val.baseLegal || val.citacao || '') : '';
            if (!texto) return;
            html += '<div class="ir-explicacao">'
                + '<div class="ir-explicacao-titulo">' + _sanitize(nomes[k] || k) + '</div>'
                + '<p>' + _sanitize(texto) + '</p>'
                + (legal ? '<div class="ir-explicacao-legal">' + _sanitize(legal) + '</div>' : '')
                + '</div>';
        });

        html += '</div>';
        return html;
    }

    /**
     * Gera rodapé profissional do relatório.
     * @param {Object} d
     * @returns {string} HTML
     * @private
     */
    function _htmlRodape(d) {
        return '<div class="ir-rodape">'
            + '<div class="ir-rodape-logo">IMPOST<span>.</span></div>'
            + '<div class="ir-rodape-slogan">' + _sanitize(PRODUTO.slogan) + '</div>'
            + '<div class="ir-rodape-disclaimer">'
            + '<strong>Aviso Legal:</strong> ' + _sanitize(d.disclaimer || 'Este relat\u00f3rio tem car\u00e1ter exclusivamente informativo.')
            + '</div>'
            + '<div class="ir-rodape-meta">'
            + '<span>Gerado em: ' + _sanitize(d.geradoEmFormatado || new Date().toLocaleDateString('pt-BR')) + '</span>'
            + '<span>Motor fiscal v' + _sanitize(PRODUTO.versao) + '</span>'
            + '</div></div>';
    }

    /**
     * Gera o HTML completo do relatório profissional.
     * @param {Object} [dados] — dados já consolidados (ou null para gerar)
     * @returns {string} HTML completo do relatório
     */
    function gerarHTML(dados) {
        var d = dados || consolidarDados();
        if (!d) return '<p style="padding:40px;text-align:center;color:#e53e3e;">Erro ao gerar relat\u00f3rio. Verifique os dados informados.</p>';

        return _gerarCSS()
            + '<div class="impost-relatorio">'
            + _htmlCapa(d)
            + _htmlBotoesAcao()
            + _htmlResumoExecutivo(d)
            + _htmlScoreTributario(d)
            + _htmlSituacaoAtual(d)
            + _htmlComparativoRegimes(d)
            + _htmlOportunidadesEconomia(d)
            + _htmlPlanoAcao(d)
            + _htmlDistribuicaoLucros(d)
            + _htmlDicasEconomia(d)
            + _htmlRiscosAlertas(d)
            + _htmlCalendarioFiscal(d)
            + _htmlReformaTributaria(d)
            + _htmlExplicacoesLegais(d)
            + _htmlRodape(d)
            + '</div>';
    }

    /**
     * Renderiza o relatório HTML dentro de um container (aba).
     * @param {string|HTMLElement} container — seletor CSS ou elemento DOM
     * @returns {Object|null} dados consolidados ou null em caso de erro
     */
    function renderizarNaAba(container) {
        var el = typeof container === 'string' ? document.querySelector(container) : container;
        if (!el) return null;
        var dados = consolidarDados();
        if (!dados) {
            el.innerHTML = '<p style="padding:40px;text-align:center;color:#e53e3e;">Erro ao consolidar dados.</p>';
            return null;
        }
        el.innerHTML = gerarHTML(dados);
        _ultimosDados = dados;
        Eventos.emit('relatorio:renderizado', dados);
        return dados;
    }


    // ═══════════════════════════════════════════════════════════════
    //  MÓDULO 15: EXPORTAÇÃO PDF — Via html2pdf.js (CDN)
    // ═══════════════════════════════════════════════════════════════

    /**
     * Exporta o relatório como PDF usando html2pdf.js.
     * A biblioteca deve estar carregada via CDN no HTML.
     *
     * @param {Object} [opcoes] — { nomeArquivo }
     */
    function exportarPDF(opcoes) {
        var opt = opcoes || {};
        var dados = _ultimosDados || consolidarDados();
        if (!dados) {
            console.error('[SimplesEstudoCompleto] Sem dados para gerar PDF.');
            return;
        }

        if (typeof html2pdf === 'undefined') {
            alert('Biblioteca html2pdf.js n\u00e3o carregada. Adicione o script via CDN.');
            return;
        }

        var temp = document.createElement('div');
        temp.innerHTML = gerarHTML(dados);
        var acoes = temp.querySelector('.ir-acoes');
        if (acoes) acoes.remove();
        temp.style.position = 'absolute';
        temp.style.left = '-9999px';
        document.body.appendChild(temp);

        var nomeEmpresa = (dados.empresa.nome || 'Empresa').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
        var dataHoje = new Date().toISOString().split('T')[0];
        var nomeArquivo = opt.nomeArquivo || 'IMPOST_Relatorio_' + nomeEmpresa + '_' + dataHoje + '.pdf';

        var configPDF = {
            margin: [10, 10, 15, 10],
            filename: nomeArquivo,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        html2pdf().set(configPDF).from(temp.firstElementChild).save().then(function () {
            document.body.removeChild(temp);
            Eventos.emit('relatorio:pdf:concluido', { nomeArquivo: nomeArquivo });
        }).catch(function (e) {
            if (temp.parentNode) document.body.removeChild(temp);
            console.error('[SimplesEstudoCompleto] Erro PDF:', e);
        });
    }


    // ═══════════════════════════════════════════════════════════════
    //  MÓDULO 16: EXPORTAÇÃO EXCEL — Via SheetJS/xlsx (CDN)
    // ═══════════════════════════════════════════════════════════════

    /**
     * Exporta os dados do relatório como planilha Excel (.xlsx) com 9 abas.
     * Requer SheetJS (XLSX) carregado via CDN.
     *
     * @param {Object} [opcoes] — { nomeArquivo }
     */
    function exportarExcel(opcoes) {
        var opt = opcoes || {};
        var dados = _ultimosDados || consolidarDados();
        if (!dados) {
            console.error('[SimplesEstudoCompleto] Sem dados para gerar Excel.');
            return;
        }

        if (typeof XLSX === 'undefined') {
            alert('Biblioteca SheetJS (xlsx) n\u00e3o carregada. Adicione o script via CDN.');
            return;
        }

        var wb = XLSX.utils.book_new();
        var emp = dados.empresa || {};
        var sit = dados.situacaoAtual || {};
        var sc = dados.score || {};

        // --- Aba 1: Resumo Executivo ---
        var resumo = [
            ['IMPOST. \u2014 Relat\u00f3rio Tribut\u00e1rio'],
            [''],
            ['Empresa', emp.nome || ''],
            ['CNPJ', emp.cnpj || ''],
            ['CNAE', emp.cnae || '', emp.descricaoCNAE || ''],
            ['UF', emp.uf || ''],
            ['Munic\u00edpio', emp.municipio || ''],
            ['Receita Mensal', emp.receitaMensal || 0],
            ['Receita Anual', emp.receitaAnual || 0],
            ['Folha Mensal', emp.folhaMensal || 0],
            [''],
            ['Score Tribut\u00e1rio', sc.total || 0, sc.faixa || ''],
            ['DAS Mensal', sit.dasMensal || 0],
            ['DAS Otimizado', sit.dasMensalOtimizado || 0],
            ['Economia Mensal', sit.economiaOtimizacao || 0],
            ['Al\u00edquota Efetiva', sit.aliquotaEfetiva || 0],
            ['Anexo', sit.anexo || ''],
            ['Economia Potencial Anual', sc.economiaPotencial || 0],
            [''],
            ['Gerado em', dados.geradoEmFormatado || ''],
            ['Vers\u00e3o', PRODUTO.versao]
        ];
        var wsResumo = XLSX.utils.aoa_to_sheet(resumo);
        XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo Executivo');

        // --- Aba 2: DAS Mensal 12 Meses ---
        var dasRows = [['M\u00eas', 'Receita Mensal (R$)', 'RBT12 Estimada (R$)', 'Al\u00edq. Efetiva (%)', 'DAS (R$)', 'Observa\u00e7\u00e3o']];
        var mesesNome = ['Janeiro', 'Fevereiro', 'Mar\u00e7o', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        var recMensal = emp.receitaMensal || 0;
        var rbt12Est = emp.receitaAnual || recMensal * 12;
        var aliqEfetiva = sit.aliquotaEfetiva || 0;
        var dasMensalVal = sit.dasMensal || 0;
        var totalDAS12 = 0;
        var totalRec12 = 0;
        for (var mi = 0; mi < 12; mi++) {
            var recMes = recMensal;
            var dasMes = dasMensalVal;
            var obs = '';
            if (mi === 0) obs = 'Compet\u00eancia jan/' + new Date().getFullYear();
            if (mi === 11) obs = '\u00daltima compet\u00eancia';
            totalDAS12 += dasMes;
            totalRec12 += recMes;
            dasRows.push([mesesNome[mi], recMes, rbt12Est, aliqEfetiva, dasMes, obs]);
        }
        dasRows.push(['']);
        dasRows.push(['TOTAL 12 MESES', totalRec12, '', '', totalDAS12, '']);
        dasRows.push(['M\u00c9DIA MENSAL', totalRec12 / 12, '', '', totalDAS12 / 12, '']);
        var wsDAS = XLSX.utils.aoa_to_sheet(dasRows);
        XLSX.utils.book_append_sheet(wb, wsDAS, 'DAS Mensal 12 Meses');

        // --- Aba 3: Situa\u00e7\u00e3o Atual ---
        var sitRows = [
            ['Indicador', 'Valor'],
            ['Anexo', sit.anexo || ''],
            ['Nome do Anexo', sit.anexoNome || ''],
            ['Fator R', sit.fatorR || 0],
            ['Fator R (%)', sit.fatorRPercentual || ''],
            ['Acima do Limiar 28%', sit.fatorRAcimaLimiar ? 'Sim' : 'N\u00e3o'],
            ['Al\u00edquota Nominal', sit.aliquotaNominal || 0],
            ['Al\u00edquota Efetiva', sit.aliquotaEfetiva || 0],
            ['Faixa', sit.faixaDescricao || ''],
            ['DAS Mensal', sit.dasMensal || 0],
            ['DAS Anual', sit.dasAnual || 0]
        ];
        var part = dados.partilhaTributos || {};
        sitRows.push(['']);
        sitRows.push(['Tributo', 'Percentual']);
        ['irpj', 'csll', 'cofins', 'pis', 'cpp', 'icms', 'iss'].forEach(function (t) {
            if (part[t] != null) {
                sitRows.push([t.toUpperCase(), part[t]]);
            }
        });
        var wsSit = XLSX.utils.aoa_to_sheet(sitRows);
        XLSX.utils.book_append_sheet(wb, wsSit, 'Situa\u00e7\u00e3o Atual');

        // --- Aba 3: Oportunidades ---
        var opsRows = [['#', 'T\u00edtulo', 'Economia Anual (R$)', 'Dificuldade', 'Prazo', 'Base Legal']];
        (dados.oportunidades || []).forEach(function (op, i) {
            opsRows.push([
                i + 1,
                op.titulo || op.oportunidade || '',
                op.economiaAnual || op.economia || 0,
                op.dificuldade || op.complexidade || '',
                op.tempo || op.prazo || '',
                op.baseLegal || ''
            ]);
        });
        var wsOps = XLSX.utils.aoa_to_sheet(opsRows);
        XLSX.utils.book_append_sheet(wb, wsOps, 'Oportunidades');

        // --- Aba 4: Plano de A\u00e7\u00e3o ---
        var paRows = [['Prioridade', 'A\u00e7\u00e3o', 'Economia (R$)', 'Prazo', 'Respons\u00e1vel']];
        (dados.planoAcao.acoes || []).forEach(function (a) {
            paRows.push([
                a.prioridade || '',
                a.titulo || a.acao || '',
                a.economia || a.economiaAnual || 0,
                a.prazo || '',
                a.responsavel || ''
            ]);
        });
        var wsPA = XLSX.utils.aoa_to_sheet(paRows);
        XLSX.utils.book_append_sheet(wb, wsPA, 'Plano de A\u00e7\u00e3o');

        // --- Aba 5: Comparativo Regimes ---
        var compRows = [['Indicador', 'Simples Nacional', 'Lucro Presumido', 'Lucro Real']];
        if (dados.comparativoRegimes) {
            var sn = dados.comparativoRegimes.simplesNacional || dados.comparativoRegimes.simples || {};
            var lp = dados.comparativoRegimes.lucroPresumido || dados.comparativoRegimes.presumido || {};
            var lr = dados.comparativoRegimes.lucroReal || dados.comparativoRegimes.real || {};
            compRows.push(['Carga Tribut\u00e1ria Anual', sn.cargaTotal || sn.dasAnual || 0, lp.cargaTotal || lp.cargaAnual || 0, lr.cargaTotal || lr.cargaAnual || 0]);
            compRows.push(['Carga Mensal', (sn.cargaTotal || sn.dasAnual || 0) / 12, (lp.cargaTotal || lp.cargaAnual || 0) / 12, (lr.cargaTotal || lr.cargaAnual || 0) / 12]);
            compRows.push(['Al\u00edquota Efetiva', sn.aliquotaEfetiva || 0, lp.aliquotaEfetiva || 0, lr.aliquotaEfetiva || 0]);
            compRows.push(['Complexidade', sn.complexidade || 'Baixa', lp.complexidade || 'M\u00e9dia', lr.complexidade || 'Alta']);
            compRows.push(['Obriga\u00e7\u00f5es Acess\u00f3rias', sn.obrigacoes || 'Reduzidas', lp.obrigacoes || 'Intermedi\u00e1rias', lr.obrigacoes || 'Extensas']);
            compRows.push(['']);
            if (lp.detalhamento) {
                compRows.push(['Detalhamento LP', '', '', '']);
                compRows.push(['  IRPJ', '', lp.detalhamento.irpj || 0, '']);
                compRows.push(['  CSLL', '', lp.detalhamento.csll || 0, '']);
                compRows.push(['  PIS', '', lp.detalhamento.pis || 0, '']);
                compRows.push(['  COFINS', '', lp.detalhamento.cofins || 0, '']);
            }
            if (lr.detalhamento) {
                compRows.push(['Detalhamento LR', '', '', '']);
                compRows.push(['  IRPJ', '', '', lr.detalhamento.irpj || 0]);
                compRows.push(['  CSLL', '', '', lr.detalhamento.csll || 0]);
                compRows.push(['  PIS/COFINS L\u00edq.', '', '', lr.detalhamento.pisCofinsLiquido || 0]);
            }
            compRows.push(['']);
            compRows.push(['Melhor Regime', dados.comparativoRegimes.melhorRegime || '', '', '']);
            compRows.push(['Recomenda\u00e7\u00e3o', dados.comparativoRegimes.recomendacao || '', '', '']);
        } else {
            compRows.push(['N\u00e3o dispon\u00edvel', '', '', '']);
        }
        var wsComp = XLSX.utils.aoa_to_sheet(compRows);
        XLSX.utils.book_append_sheet(wb, wsComp, 'Comparativo Regimes');

        // --- Aba 6: Distribui\u00e7\u00e3o Lucros ---
        var distRows = [
            ['Modalidade', dados.distribuicaoLucros.modalidade || ''],
            ['Percentual Presun\u00e7\u00e3o', dados.distribuicaoLucros.percentualPresuncaoFormatado || ''],
            ['Lucro Distribu\u00edvel', dados.distribuicaoLucros.lucroDistribuivel || 0],
            [''],
            ['S\u00f3cio', 'Participa\u00e7\u00e3o', 'Valor Isento Anual']
        ];
        (dados.distribuicaoLucros.porSocio || []).forEach(function (s) {
            distRows.push([s.nome || '', s.percentual || s.participacao || 0, s.valorIsento || s.valor || 0]);
        });
        var wsDist = XLSX.utils.aoa_to_sheet(distRows);
        XLSX.utils.book_append_sheet(wb, wsDist, 'Distribui\u00e7\u00e3o Lucros');

        // --- Aba 7: Riscos e Alertas ---
        var riscosRows = [['Risco', 'Gravidade', 'Descri\u00e7\u00e3o', 'Recomenda\u00e7\u00e3o', 'Base Legal']];
        (dados.riscosFiscais || []).forEach(function (r) {
            riscosRows.push([r.titulo || '', r.gravidade || '', r.descricao || '', r.recomendacao || '', r.baseLegal || '']);
        });
        var wsRiscos = XLSX.utils.aoa_to_sheet(riscosRows);
        XLSX.utils.book_append_sheet(wb, wsRiscos, 'Riscos e Alertas');

        // --- Aba 8: Calend\u00e1rio Fiscal ---
        var calRows = [['M\u00eas', 'Obriga\u00e7\u00e3o']];
        var cal = dados.calendarioFiscal || {};
        Object.keys(cal).forEach(function (k) {
            var val = cal[k];
            if (typeof val === 'string') {
                calRows.push([k, val]);
            } else if (Array.isArray(val)) {
                val.forEach(function (v) {
                    calRows.push([k, typeof v === 'string' ? v : v.descricao || v.nome || String(v)]);
                });
            } else if (val && typeof val === 'object') {
                calRows.push([k, val.descricao || val.nome || JSON.stringify(val)]);
            }
        });
        (dados.obrigacoesAcessorias || []).forEach(function (o) {
            calRows.push([o.periodicidade || '', o.nome + ' \u2014 ' + (o.prazo || '')]);
        });
        var wsCal = XLSX.utils.aoa_to_sheet(calRows);
        XLSX.utils.book_append_sheet(wb, wsCal, 'Calend\u00e1rio Fiscal');

        // --- Aba 9: Score Tribut\u00e1rio ---
        var scoreRows = [
            ['Score Total', sc.total || 0],
            ['Faixa', sc.faixa || ''],
            ['Economia Potencial', sc.economiaPotencial || 0],
            [''],
            ['Categoria', 'Pontua\u00e7\u00e3o', 'M\u00e1ximo']
        ];
        var catsExcel = sc.categorias || {};
        var catsArr = Array.isArray(catsExcel) ? catsExcel : Object.keys(catsExcel).map(function(k) {
            var c = catsExcel[k];
            return { nome: NOMES_CATEGORIA_SCORE[k] || k, pontuacao: c.pontos, maximo: c.maximo };
        });
        catsArr.forEach(function (cat) {
            scoreRows.push([cat.nome || cat.categoria || '', cat.pontuacao || cat.pontos || 0, cat.maximo || cat.max || 25]);
        });
        var wsScore = XLSX.utils.aoa_to_sheet(scoreRows);
        XLSX.utils.book_append_sheet(wb, wsScore, 'Score Tribut\u00e1rio');

        // Gerar arquivo
        var nomeEmpresa = (emp.nome || 'Empresa').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
        var dataHoje = new Date().toISOString().split('T')[0];
        var nomeArquivo = opt.nomeArquivo || 'IMPOST_Relatorio_' + nomeEmpresa + '_' + dataHoje + '.xlsx';

        XLSX.writeFile(wb, nomeArquivo);
        Eventos.emit('relatorio:excel:concluido', { nomeArquivo: nomeArquivo });
    }


    // ═══════════════════════════════════════════════════════════════
    //  MÓDULO 17: INTEGRAÇÃO ABA HTML
    //  Inicialização e renderização na aba do navegador
    // ═══════════════════════════════════════════════════════════════

    /**
     * Inicializa a aba de relatório: verifica pré-requisitos e renderiza.
     * @param {string|HTMLElement} container — seletor CSS ou elemento DOM
     * @returns {Object|null} dados consolidados ou null
     */
    function inicializarAba(container) {
        var el = typeof container === 'string' ? document.querySelector(container) : container;
        if (!el) return null;

        if (!_IMPOST) {
            el.innerHTML = '<div class="ir-alerta ir-alerta-perigo" style="margin:40px;">M\u00f3dulo IMPOST (simples_nacional.js) n\u00e3o carregado. O relat\u00f3rio requer o motor de c\u00e1lculo do Simples Nacional.</div>';
            return null;
        }

        var formDados = Formulario.getDados();
        if (!formDados.receitaBrutaMensal || formDados.receitaBrutaMensal <= 0) {
            el.innerHTML = '<div style="padding:60px 40px;text-align:center;color:' + CORES.cinzaSecundario + ';">'
                + '<div style="font-size:48px;margin-bottom:16px;">📊</div>'
                + '<div style="font-size:18px;font-weight:600;color:' + CORES.primaria + ';margin-bottom:8px;">Preencha os dados da empresa</div>'
                + '<div>Informe a receita bruta mensal e demais dados na aba de simula\u00e7\u00e3o para gerar o relat\u00f3rio completo.</div>'
                + '</div>';
            return null;
        }

        el.innerHTML = '<div style="padding:60px 40px;text-align:center;">'
            + '<div style="font-size:18px;font-weight:600;color:' + CORES.primaria + ';margin-bottom:12px;">Gerando relat\u00f3rio...</div>'
            + '<div style="width:200px;height:6px;background:' + CORES.cinzaBorda + ';border-radius:3px;margin:0 auto;overflow:hidden;">'
            + '<div style="width:60%;height:100%;background:' + CORES.primariaClara + ';border-radius:3px;animation:irPulse 1.5s infinite;"></div>'
            + '</div>'
            + '<style>@keyframes irPulse{0%{width:20%}50%{width:80%}100%{width:20%}}</style>'
            + '</div>';

        setTimeout(function () {
            renderizarNaAba(el);
        }, 100);

        return _ultimosDados;
    }


    // ═══════════════════════════════════════════════════════════════
    //  DEMONSTRAÇÃO — Executa módulos 7, 8 e 9 com dados reais
    // ═══════════════════════════════════════════════════════════════

    /**
     * Executa demonstração completa dos módulos 7 (Calculadora), 8 (Diagnóstico)
     * e 9 (Score) com dados de exemplo reais usando IMPOST.
     *
     * Dados de exemplo: empresa de tecnologia (CNAE 62.01-5) em São Paulo.
     * Receita: R$ 50.000/mês. Folha: R$ 12.000/mês. Pró-labore: R$ 5.000.
     *
     * @returns {Object} { calculo, diagnostico, score }
     */
    function executarDemonstracao() {
        var sep = '═'.repeat(70);
        var lin = '─'.repeat(50);

        console.log('\n' + sep);
        console.log('  SIMPLES-ESTUDOS v' + _VERSION + ' — DEMONSTRAÇÃO DE CÁLCULOS REAIS');
        console.log('  Motor: IMPOST (simples_nacional.js) ' + (_IMPOST ? 'v' + (_IMPOST.VERSION || '?') : 'NÃO CARREGADO'));
        console.log(sep + '\n');

        if (!_IMPOST) {
            console.error('[DEMO] IMPOST não carregado. Carregue simples_nacional.js primeiro.');
            return { erro: 'IMPOST não carregado' };
        }

        // ── Dados de exemplo ──
        var dadosExemplo = {
            nomeEmpresa: 'EMPRESA EXEMPLO LTDA',
            cnae: '62.01-5',
            uf: 'PA',
            municipio: 'Belém',
            receitaBrutaMensal: 50000,
            receitaBrutaAnual: 600000,
            folhaMensal: 12000,
            proLabore: 5000,
            issAliquota: 5.00,
            receitaMonofasica: 0,
            receitaExportacao: 0,
            receitaICMS_ST: 0,
            receitaLocacaoBensMoveis: 0,
            issRetidoFonte: 0,
            socios: [
                { nome: 'Sócio 1', percentual: 0.50 },
                { nome: 'Sócio 2', percentual: 0.50 }
            ]
        };

        console.log('  DADOS DE ENTRADA:');
        console.log('  Empresa: ' + dadosExemplo.nomeEmpresa);
        console.log('  CNAE: ' + dadosExemplo.cnae + ' (Desenvolvimento de software)');
        console.log('  UF: ' + dadosExemplo.uf + ' | Município: ' + dadosExemplo.municipio);
        console.log('  Receita mensal: ' + Utils.formatarMoeda(dadosExemplo.receitaBrutaMensal));
        console.log('  Receita anual:  ' + Utils.formatarMoeda(dadosExemplo.receitaBrutaAnual));
        console.log('  Folha mensal:   ' + Utils.formatarMoeda(dadosExemplo.folhaMensal));
        console.log('  Pró-labore:     ' + Utils.formatarMoeda(dadosExemplo.proLabore));
        console.log('  ISS:            ' + dadosExemplo.issAliquota + '%');
        console.log('  Sócios:         ' + dadosExemplo.socios.length + '\n');

        // ── Carregar dados no Formulário ──
        Formulario.carregarDados(dadosExemplo);

        // ══════════════════════════════════════════
        //  MÓDULO 7: Calculadora
        // ══════════════════════════════════════════
        console.log(lin);
        console.log('  MÓDULO 7: CALCULADORA — Cálculos com IMPOST real');
        console.log(lin);

        // 7a. Fator R
        var fatorR = null;
        try {
            fatorR = Calculadora.calcularFatorRDireto({
                folhaSalarios12Meses: dadosExemplo.folhaMensal * 12,
                receitaBruta12Meses: dadosExemplo.receitaBrutaAnual
            });
            console.log('  [OK] calcularFatorR:');
            console.log('       Fator R = ' + (fatorR.fatorRPercentual || Utils.formatarPercentual(fatorR.fatorR)));
            console.log('       Acima do limiar 28%? ' + (fatorR.acimaDoLimiar ? 'SIM' : 'NÃO'));
            console.log('       Anexo resultante: ' + fatorR.anexoResultante);
        } catch (e) {
            console.error('  [ERRO] calcularFatorR: ' + e.message);
        }

        // 7b. Determinar Anexo
        var anexo = null;
        try {
            var frVal = fatorR ? fatorR.fatorR : 0;
            anexo = Calculadora.determinarAnexo(dadosExemplo.cnae, frVal);
            console.log('  [OK] determinarAnexo:');
            console.log('       CNAE ' + dadosExemplo.cnae + ' → Anexo ' + anexo.anexo);
            console.log('       Tipo: ' + anexo.tipo + ' | CPP inclusa: ' + (anexo.cppInclusa !== false));
        } catch (e) {
            console.error('  [ERRO] determinarAnexo: ' + e.message);
        }

        // 7c. Alíquota Efetiva
        var aliquota = null;
        var anexoFinal = anexo ? anexo.anexo : 'V';
        try {
            aliquota = Calculadora.calcularAliquotaEfetiva({
                rbt12: dadosExemplo.receitaBrutaAnual,
                anexo: anexoFinal
            });
            console.log('  [OK] calcularAliquotaEfetiva:');
            console.log('       Faixa: ' + aliquota.faixa + 'ª | Alíq. nominal: ' + aliquota.aliquotaNominalFormatada);
            console.log('       Parcela a deduzir: ' + Utils.formatarMoeda(aliquota.parcelaADeduzir));
            console.log('       ALÍQUOTA EFETIVA: ' + aliquota.aliquotaEfetivaFormatada);
        } catch (e) {
            console.error('  [ERRO] calcularAliquotaEfetiva: ' + e.message);
        }

        // 7d. DAS Mensal
        var das = null;
        try {
            das = Calculadora.calcularDASMensal({
                receitaBrutaMensal: dadosExemplo.receitaBrutaMensal,
                rbt12: dadosExemplo.receitaBrutaAnual,
                anexo: anexoFinal,
                folhaMensal: dadosExemplo.folhaMensal
            });
            console.log('  [OK] calcularDASMensal:');
            console.log('       DAS valor: ' + Utils.formatarMoeda(das.dasValor || das.dasAPagar));
            console.log('       DAS a pagar: ' + Utils.formatarMoeda(das.dasAPagar || das.dasValor));
            console.log('       INSS patronal fora: ' + Utils.formatarMoeda(das.inssPatronalFora || 0));
            console.log('       TOTAL a pagar: ' + Utils.formatarMoeda(das.totalAPagar || das.dasAPagar || das.dasValor));
        } catch (e) {
            console.error('  [ERRO] calcularDASMensal: ' + e.message);
        }

        // 7e. Partilha de Tributos
        var partilha = null;
        if (das && aliquota) {
            try {
                partilha = Calculadora.calcularPartilhaTributos(
                    das.dasValor || das.dasAPagar || 0,
                    aliquota.faixa,
                    anexoFinal,
                    dadosExemplo.receitaBrutaMensal,
                    aliquota.aliquotaEfetiva
                );
                console.log('  [OK] calcularPartilhaTributos:');
                var tributos = ['irpj', 'csll', 'cofins', 'pis', 'cpp', 'iss', 'icms'];
                tributos.forEach(function (t) {
                    if (partilha[t]) {
                        var p = partilha[t];
                        console.log('       ' + t.toUpperCase().padEnd(7) + ': '
                            + (p.percentualFormatado || Utils.formatarPercentual(p.percentual || 0)).padEnd(8)
                            + ' → ' + Utils.formatarMoeda(p.valor || 0));
                    }
                });
            } catch (e) {
                console.error('  [ERRO] calcularPartilhaTributos: ' + e.message);
            }
        }

        // 7f. Consolidado Anual (calcularTudo)
        var resultado = null;
        try {
            resultado = Calculadora.calcularTudo();
            console.log('  [OK] calcularTudo (consolidado anual):');
            console.log('       DAS anual: ' + Utils.formatarMoeda(resultado.anual ? resultado.anual.dasAnual : 0));
            console.log('       Alíquota efetiva: ' + (resultado.aliquotaEfetiva ? resultado.aliquotaEfetiva.formatada : 'N/D'));
            console.log('       Classificação: ' + (resultado.classificacao ? resultado.classificacao.tipo : 'N/D'));
            console.log('       Elegível: ' + (resultado.elegibilidade ? resultado.elegibilidade.elegivel : 'N/D'));
            if (resultado.otimizacaoFatorR && resultado.otimizacaoFatorR.aplicavel) {
                console.log('       Otimização Fator R: ' + (resultado.otimizacaoFatorR.valeAPena ? 'COMPENSA' : 'Não compensa'));
                if (resultado.otimizacaoFatorR.economiaLiquida) {
                    console.log('       Economia líquida Fator R: ' + Utils.formatarMoeda(resultado.otimizacaoFatorR.economiaLiquida) + '/ano');
                }
            }
        } catch (e) {
            console.error('  [ERRO] calcularTudo: ' + e.message);
        }

        // ══════════════════════════════════════════
        //  MÓDULO 8: Diagnóstico
        // ══════════════════════════════════════════
        console.log('\n' + lin);
        console.log('  MÓDULO 8: DIAGNÓSTICO — Oportunidades e alertas');
        console.log(lin);

        var diagnostico = null;
        try {
            diagnostico = Diagnostico.executar(resultado);
            console.log('  [OK] Diagnóstico executado:');
            console.log('       Verificações: ' + diagnostico.totalVerificacoes);
            console.log('       Oportunidades: ' + diagnostico.oportunidadesEncontradas);
            console.log('       Alertas: ' + diagnostico.alertasEncontrados);
            console.log('       Informativos: ' + diagnostico.informativosEncontrados);
            console.log('       ECONOMIA TOTAL: ' + diagnostico.economiaTotal.anualFormatada + '/ano');

            if (diagnostico.oportunidades.length > 0) {
                console.log('\n       TOP OPORTUNIDADES:');
                diagnostico.oportunidades.forEach(function (op, i) {
                    console.log('       #' + (i + 1) + ' ' + op.titulo);
                    console.log('          Economia: ' + Utils.formatarMoeda(op.economiaAnual || 0) + '/ano');
                    console.log('          Base legal: ' + (op.baseLegal || 'N/D'));
                });
            }

            if (diagnostico.alertas.length > 0) {
                console.log('\n       ALERTAS:');
                diagnostico.alertas.forEach(function (al) {
                    console.log('       ⚠ ' + al.titulo);
                });
            }
        } catch (e) {
            console.error('  [ERRO] Diagnóstico: ' + e.message);
        }

        // ══════════════════════════════════════════
        //  MÓDULO 9: Score
        // ══════════════════════════════════════════
        console.log('\n' + lin);
        console.log('  MÓDULO 9: SCORE — Saúde tributária');
        console.log(lin);

        var score = null;
        try {
            score = Score.calcular(diagnostico, resultado);
            console.log('  [OK] Score calculado:');
            console.log('       NOTA: ' + score.total + '/100 — ' + score.faixa + ' ' + score.iconeFaixa);
            console.log('       ' + score.descricaoFaixa);
            console.log('       Economia potencial: ' + score.economiaPotencialAnualFormatada + '/ano');
            console.log('\n       DETALHAMENTO POR CATEGORIA:');
            Object.keys(score.categorias).forEach(function (cat) {
                var c = score.categorias[cat];
                var nome = NOMES_CATEGORIA_SCORE[cat] || cat;
                var barra = '';
                var cheio = Math.round((c.pontos / c.maximo) * 10);
                for (var bi = 0; bi < 10; bi++) barra += bi < cheio ? '█' : '░';
                console.log('       ' + nome.padEnd(22) + ' ' + barra + ' ' + c.pontos + '/' + c.maximo);
                console.log('         → ' + c.motivo);
            });
        } catch (e) {
            console.error('  [ERRO] Score: ' + e.message);
        }

        // ══════════════════════════════════════════
        //  MÓDULO 11: Plano de Ação (v5.0 — Priorizado Real)
        // ══════════════════════════════════════════
        console.log('\n' + lin);
        console.log('  MÓDULO 11: PLANO DE AÇÃO — Ações priorizadas por economia');
        console.log(lin);

        var plano = null;
        try {
            plano = PlanoAcao.gerar(diagnostico, resultado);
            console.log('  [OK] Plano de Ação gerado:');
            console.log('       Total de ações: ' + plano.totalAcoes);
            console.log('       ECONOMIA TOTAL: ' + plano.economiaTotalFormatada + '/ano');
            console.log('');
            if (plano.acoes.length > 0) {
                console.log('       AÇÕES PRIORIZADAS POR ECONOMIA:');
                plano.acoes.forEach(function (a, i) {
                    console.log('       #' + (i + 1) + ' ' + a.titulo);
                    console.log('          Economia anual: ' + Utils.formatarMoeda(a.economiaAnual || 0));
                    console.log('          Economia líquida: ' + Utils.formatarMoeda(a.economiaLiquida || 0));
                    console.log('          Prazo: ' + (a.prazo || 'N/D') + ' | Dificuldade: ' + (a.dificuldade || 'N/D'));
                    console.log('          Base legal: ' + (a.baseLegal || 'N/D'));
                    if (a.comoFazer) console.log('          Como fazer: ' + a.comoFazer.substring(0, 100) + '...');
                    console.log('');
                });
            }
        } catch (e) {
            console.error('  [ERRO] Plano de Ação: ' + e.message);
        }

        // ══════════════════════════════════════════
        //  MÓDULO 13: SimuladorCenarios
        // ══════════════════════════════════════════
        console.log(lin);
        console.log('  MÓDULO 13: SIMULADOR DE CENÁRIOS — 6 tipos');
        console.log(lin);

        // Cenário 1: aumentar pró-labore
        try {
            var simPL = SimuladorCenarios.simular({
                cenario: 'aumentar_proLabore',
                parametro: 8000,
                empresa: dadosExemplo
            });
            console.log('  [OK] Cenário "aumentar_proLabore" (para R$ 8.000):');
            if (simPL.diferenca) {
                console.log('       DAS antes: ' + Utils.formatarMoeda(simPL.antes.DAS) + '/mês');
                console.log('       DAS depois: ' + Utils.formatarMoeda(simPL.depois.DAS) + '/mês');
                console.log('       Diferença DAS: ' + Utils.formatarMoeda(simPL.diferenca.DAS) + '/mês');
                console.log('       Diferença INSS: ' + Utils.formatarMoeda(simPL.diferenca.INSSsocio) + '/mês');
                console.log('       Economia líquida: ' + Utils.formatarMoeda(simPL.diferenca.economiaLiquida) + '/mês');
                console.log('       ' + (simPL.diferenca.resumo || ''));
            }
        } catch (e) {
            console.error('  [ERRO] SimuladorCenarios.aumentar_proLabore: ' + e.message);
        }

        // Cenário 4: reduzir receita
        try {
            var simRec = SimuladorCenarios.simular({
                cenario: 'reduzir_receita',
                parametro: 30000,
                empresa: dadosExemplo
            });
            console.log('  [OK] Cenário "reduzir_receita" (para R$ 30.000/mês):');
            if (simRec.diferenca) {
                console.log('       DAS antes: ' + Utils.formatarMoeda(simRec.antes.DAS) + '/mês');
                console.log('       DAS depois: ' + Utils.formatarMoeda(simRec.depois.DAS) + '/mês');
                console.log('       Economia: ' + Utils.formatarMoeda(simRec.diferenca.DAS) + '/mês');
                console.log('       ' + (simRec.diferenca.resumo || ''));
            }
        } catch (e) {
            console.error('  [ERRO] SimuladorCenarios.reduzir_receita: ' + e.message);
        }

        // Cenário 5: incluir sócio
        try {
            var simSocio = SimuladorCenarios.simular({
                cenario: 'incluir_socio',
                parametro: { novosSocios: 1, proLaborePorSocio: 1621 },
                empresa: dadosExemplo
            });
            console.log('  [OK] Cenário "incluir_socio" (+1 sócio, PL R$ 1.621):');
            if (simSocio.diferenca) {
                console.log('       Sócios depois: ' + simSocio.depois.numSocios);
                console.log('       DAS: ' + Utils.formatarMoeda(simSocio.depois.DAS) + '/mês');
                console.log('       Economia líquida: ' + Utils.formatarMoeda(simSocio.diferenca.economiaLiquida) + '/mês');
                console.log('       ' + (simSocio.diferenca.resumo || ''));
            }
        } catch (e) {
            console.error('  [ERRO] SimuladorCenarios.incluir_socio: ' + e.message);
        }

        // ══════════════════════════════════════════
        //  MÓDULO 14: CompararRegimes
        // ══════════════════════════════════════════
        console.log('\n' + lin);
        console.log('  MÓDULO 14: COMPARATIVO DE REGIMES — SN × LP × LR');
        console.log(lin);

        var comparativo = null;
        try {
            comparativo = CompararRegimes.compararRegimesCompleto({
                receitaBrutaAnual: dadosExemplo.receitaBrutaAnual,
                receitaBrutaMensal: dadosExemplo.receitaBrutaMensal,
                folhaMensal: dadosExemplo.folhaMensal,
                proLabore: dadosExemplo.proLabore || 0, // LC 123/2006, Art. 18, §5º-M: pró-labore integra a folha para fins de Fator R
                cnae: dadosExemplo.cnae,
                uf: dadosExemplo.uf,
                issAliquota: dadosExemplo.issAliquota,
                margemLucro: 0.20,
                percentualCreditos: 0.40
            });
            console.log('  [OK] Comparativo calculado:');
            console.log('');
            if (comparativo.ranking) {
                comparativo.ranking.forEach(function (r, i) {
                    var badge = i === 0 ? ' ★ MELHOR' : '';
                    console.log('       ' + (i + 1) + '° ' + r.regime + badge);
                    console.log('          Carga anual: ' + Utils.formatarMoeda(r.cargaAnual));
                    console.log('          Carga mensal: ' + Utils.formatarMoeda(r.cargaMensal));
                    console.log('          Alíquota efetiva: ' + r.aliquotaEfetiva);
                    if (r.economia > 0) console.log('          Excesso vs melhor: +' + Utils.formatarMoeda(r.economia));
                    console.log('');
                });
            }
            console.log('       RECOMENDAÇÃO: ' + comparativo.recomendacao);

            // Detalhamento LP
            if (comparativo.lucroPresumido && comparativo.lucroPresumido.detalhamento) {
                var lpDet = comparativo.lucroPresumido.detalhamento;
                console.log('\n       LUCRO PRESUMIDO — Detalhamento:');
                console.log('          IRPJ: ' + Utils.formatarMoeda(lpDet.irpj) + ' + Adicional: ' + Utils.formatarMoeda(lpDet.adicionalIRPJ));
                console.log('          CSLL: ' + Utils.formatarMoeda(lpDet.csll));
                console.log('          PIS: ' + Utils.formatarMoeda(lpDet.pis) + ' | COFINS: ' + Utils.formatarMoeda(lpDet.cofins));
                console.log('          ISS/ICMS: ' + Utils.formatarMoeda(lpDet.issOuICMS));
            }

            // Detalhamento LR
            if (comparativo.lucroReal && comparativo.lucroReal.detalhamento) {
                var lrDet = comparativo.lucroReal.detalhamento;
                console.log('\n       LUCRO REAL — Detalhamento (margem ' + ((lrDet.margemEstimada || 0.20) * 100) + '%):');
                console.log('          Lucro real estimado: ' + Utils.formatarMoeda(lrDet.lucroReal));
                console.log('          IRPJ: ' + Utils.formatarMoeda(lrDet.irpj) + ' + Adicional: ' + Utils.formatarMoeda(lrDet.adicionalIRPJ));
                console.log('          CSLL: ' + Utils.formatarMoeda(lrDet.csll));
                console.log('          PIS+COFINS bruto: ' + Utils.formatarMoeda(lrDet.pisBruto + lrDet.cofinsBruto));
                console.log('          Créditos PIS/COFINS: -' + Utils.formatarMoeda(lrDet.creditosPISCOFINS));
            }
        } catch (e) {
            console.error('  [ERRO] CompararRegimes: ' + e.message);
        }

        // ══════════════════════════════════════════
        //  TESTE ADICIONAL: Comercial ABC Ltda
        // ══════════════════════════════════════════
        console.log('\n' + sep);
        console.log('  TESTE: COMERCIAL ABC LTDA — CNAE 4712-1/00, RBT12 R$ 600.000');
        console.log(sep + '\n');

        var dadosABC = {
            nomeEmpresa: 'COMERCIAL ABC LTDA',
            cnae: '47.12-1/00',
            uf: 'SP',
            municipio: 'São Paulo',
            receitaBrutaMensal: 50000,
            receitaBrutaAnual: 600000,
            folhaMensal: 8400,
            proLabore: 3000,
            issAliquota: 5.00,
            receitaMonofasica: 5000,
            receitaExportacao: 0,
            receitaICMS_ST: 3000,
            receitaLocacaoBensMoveis: 0,
            issRetidoFonte: 0,
            socios: [
                { nome: 'Sócio A', percentual: 0.50 },
                { nome: 'Sócio B', percentual: 0.50 }
            ]
        };

        Formulario.carregarDados(dadosABC);

        console.log('  DADOS DE ENTRADA:');
        console.log('  Empresa: ' + dadosABC.nomeEmpresa);
        console.log('  CNAE: ' + dadosABC.cnae + ' (Comércio varejista)');
        console.log('  UF: ' + dadosABC.uf + ' | Município: ' + dadosABC.municipio);
        console.log('  Receita mensal: ' + Utils.formatarMoeda(dadosABC.receitaBrutaMensal));
        console.log('  Receita anual:  ' + Utils.formatarMoeda(dadosABC.receitaBrutaAnual));
        console.log('  Folha mensal:   ' + Utils.formatarMoeda(dadosABC.folhaMensal));
        console.log('  Pró-labore:     ' + Utils.formatarMoeda(dadosABC.proLabore));
        console.log('  Rec. monofásica: ' + Utils.formatarMoeda(dadosABC.receitaMonofasica));
        console.log('  Rec. ICMS-ST:   ' + Utils.formatarMoeda(dadosABC.receitaICMS_ST));
        console.log('  Sócios: ' + dadosABC.socios.length + '\n');

        try {
            var resultadoABC = Calculadora.calcularTudo();
            console.log('  [OK] calcularTudo:');
            console.log('       Anexo: ' + (resultadoABC.anexo ? resultadoABC.anexo.anexo : 'N/D'));
            console.log('       Fator R: ' + (resultadoABC.fatorR ? resultadoABC.fatorR.percentual : 'N/D'));
            console.log('       Alíquota efetiva: ' + (resultadoABC.aliquotaEfetiva ? resultadoABC.aliquotaEfetiva.formatada : 'N/D'));
            console.log('       DAS mensal: ' + Utils.formatarMoeda(resultadoABC.dasMensal ? resultadoABC.dasMensal.semOtimizacao.valor : 0));
            console.log('       DAS anual:  ' + Utils.formatarMoeda(resultadoABC.anual ? resultadoABC.anual.dasAnual : 0));

            var diagABC = Diagnostico.executar(resultadoABC);
            console.log('\n  [OK] Diagnóstico:');
            console.log('       Oportunidades: ' + diagABC.oportunidadesEncontradas);
            console.log('       Economia total: ' + diagABC.economiaTotal.anualFormatada);

            var planoABC = PlanoAcao.gerar(diagABC, resultadoABC);
            console.log('\n  [OK] Plano de Ação:');
            console.log('       Ações: ' + planoABC.totalAcoes);
            console.log('       Economia: ' + planoABC.economiaTotalFormatada);
            planoABC.acoes.forEach(function (a, i) {
                console.log('       #' + (i + 1) + ' ' + a.titulo + ' → ' + Utils.formatarMoeda(a.economiaLiquida || a.economiaAnual || 0) + '/ano');
            });

            var compABC = CompararRegimes.compararRegimesCompleto({
                receitaBrutaAnual: 600000,
                receitaBrutaMensal: 50000,
                folhaMensal: 8400,
                proLabore: dadosABC.proLabore || 0, // LC 123/2006, Art. 18, §5º-M: pró-labore integra a folha para fins de Fator R
                cnae: '47.12-1/00',
                uf: 'SP',
                issAliquota: 5
            });
            console.log('\n  [OK] Comparativo de Regimes:');
            if (compABC.ranking) {
                compABC.ranking.forEach(function (r, i) {
                    console.log('       ' + (i + 1) + '° ' + r.regime + ': ' + Utils.formatarMoeda(r.cargaAnual) + '/ano (' + r.aliquotaEfetiva + ')');
                });
                console.log('       → ' + compABC.recomendacao);
            }

            // SimuladorCenarios para ABC
            var simABC = SimuladorCenarios.simular({
                cenario: 'exportacao',
                parametro: 10000,
                empresa: dadosABC
            });
            console.log('\n  [OK] Simulação exportação R$ 10.000/mês:');
            if (simABC.diferenca) {
                console.log('       Economia: ' + Utils.formatarMoeda(simABC.diferenca.economiaLiquida) + '/mês');
            }
        } catch (e) {
            console.error('  [ERRO] Teste Comercial ABC: ' + e.message);
        }

        console.log('\n' + sep);
        console.log('  DEMONSTRAÇÃO CONCLUÍDA — v' + _VERSION);
        console.log('  PlanoAcao, SimuladorCenarios, CompararRegimes — TODOS OPERACIONAIS');
        console.log(sep + '\n');

        return {
            calculo: resultado,
            diagnostico: diagnostico,
            score: score,
            plano: plano,
            comparativo: comparativo
        };
    }


    // ═══════════════════════════════════════════════════════════════
    //  EXPORTAÇÃO FINAL — Todos os 19 módulos
    // ═══════════════════════════════════════════════════════════════

    return {
        // Motor de cálculo (Módulos 1-12)
        Eventos: Eventos,
        Utils: Utils,
        BuscaCNAE: BuscaCNAE,
        DadosEstado: DadosEstado,
        DadosMunicipio: DadosMunicipio,
        Formulario: Formulario,
        Calculadora: Calculadora,
        Diagnostico: Diagnostico,
        Score: Score,
        Simulador: Simulador,
        PlanoAcao: PlanoAcao,
        Explicacoes: Explicacoes,

        // Engine de Otimização (Módulos 13-14) — v5.0
        SimuladorCenarios: SimuladorCenarios,
        CompararRegimes: CompararRegimes,

        // Relatório e exportação (Módulos 15-19)
        Relatorio: {
            consolidarDados: consolidarDados,
            gerarDados: consolidarDados,
            gerarHTML: gerarHTML,
            renderizarNaAba: renderizarNaAba,
            inicializarAba: inicializarAba,
            exportarPDF: exportarPDF,
            exportarExcel: exportarExcel,
            imprimir: function () { window.print(); }
        },

        // Constantes visuais
        CORES: CORES,
        PRODUTO: PRODUTO,

        // Demonstração
        executarDemonstracao: executarDemonstracao,

        // Metadados
        VERSION: _VERSION
    };
});
