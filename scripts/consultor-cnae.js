/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * IMPOST. — Consultor de CNAE v3.0
 * Motor de busca inteligente + Ranking tributário
 * ═══════════════════════════════════════════════════════════════════════════════
 * INTEGRADO COM COMPARADOR-REGIMES.JS v3.0
 *   → Usa dados REAIS por UF (ICMS, ISS, FECOP, incentivos, sublimite)
 *   → Cálculos delegados ao ComparadorRegimes (fonte única de verdade)
 *   → Painel do estado com ficha tributária completa
 *   → Alertas, vantagens e recomendação do motor unificado
 * ═══════════════════════════════════════════════════════════════════════════════
 * Paleta unificada (tema claro) — Compatível com analise-pf.html
 * Importa dados de: cnae.js, estados/[todos].js, estados.js,
 *                    comparador-regimes.js, cnae-mapeamento.js
 * ═══════════════════════════════════════════════════════════════════════════════
 * AGROGEO BRASIL — Geotecnologia e Consultoria Ambiental
 * Autor: Luis Fernando | Proprietário AGROGEO BRASIL
 * Versão: 3.0.0 | Data: Fevereiro/2026
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOVIDADES v3.0:
 *  ✅ Integração total com ComparadorRegimes v3.0
 *  ✅ Cálculos delegados: Simples, Presumido, Real com dados reais do estado
 *  ✅ ICMS real por UF (não mais 18% fixo)
 *  ✅ ISS real da capital (não mais 5% fixo)
 *  ✅ FECOP/FECOEP por estado no cálculo
 *  ✅ Incentivos SUDAM/SUDENE/ZFM reais com redução de 75% IRPJ
 *  ✅ Sublimite estadual real do Simples Nacional
 *  ✅ Painel do estado com ficha tributária completa
 *  ✅ Alertas inteligentes (sublimite, fator R, incentivos, reforma)
 *  ✅ Vantagens detalhadas por regime com base legal
 *  ✅ Recomendação textual contextualizada
 *  ✅ Fallback gracioso se ComparadorRegimes não estiver carregado
 *  ✅ Cards com economia anual e dados do estado usados
 * ═══════════════════════════════════════════════════════════════════════════════
 */
(function () {
    "use strict";

    // ═══ DOM SHORTCUTS ═══
    const $ = id => document.getElementById(id);
    const $$ = sel => document.querySelectorAll(sel);

    // ═══ GLOBALS ═══
    let CR;          // ComparadorRegimes — motor de cálculo v3
    let CM;          // CnaeMapeamento — fallback de regras
    let IF;          // ImpostosFederais — fallback tabelas Simples
    let ES;          // Dados de estados (compat ou via CR)
    let CNAE;        // Banco de CNAEs
    let debounceTimer = null;
    let searchCache = new Map();
    let lastResults = [];
    let cnaeIndex = null;
    let _usandoComparador = false;  // flag: indica se ComparadorRegimes está ativo

    // ═══════════════════════════════════════════════════════════════
    //  VERSÃO E CONSTANTES
    // ═══════════════════════════════════════════════════════════════

    const VERSAO = '3.0.0';
    const DATA_BASE = '2026-02-11';

    // ═══════════════════════════════════════════════════════════════
    //  DICIONÁRIO DE SINÔNIMOS
    // ═══════════════════════════════════════════════════════════════

    const DICIONARIO = {
        // Alimentação
        "restaurante":    ["restaurante", "alimentacao", "refeicao", "refeicoes"],
        "lanchonete":     ["lanchonete", "fast food", "alimentacao rapida"],
        "padaria":        ["padaria", "panificacao", "paes", "confeitaria"],
        "bar":            ["bar", "bebidas", "pub", "choperia"],
        "pizzaria":       ["pizzaria", "pizza", "alimentacao"],
        "hamburgueria":   ["hamburgueria", "lanchonete", "alimentacao"],
        "acougue":        ["acougue", "carnes", "frigorifico"],
        "sorveteria":     ["sorvete", "gelados", "sorveteria"],
        "food truck":     ["ambulante", "alimentacao", "comida"],
        "delivery":       ["entrega", "alimentacao", "refeicoes", "preparacao"],
        "doceria":        ["doces", "confeitaria", "bombons", "chocolates"],
        "cafeteria":      ["cafe", "cafeteria", "bebidas"],

        // Comércio
        "loja":           ["comercio", "varejo", "varejista", "venda", "vendas", "loja"],
        "mercado":        ["mercado", "supermercado", "minimercado", "mercearia", "generos alimenticios"],
        "farmacia":       ["farmacia", "medicamento", "medicamentos", "drogaria"],
        "pet shop":       ["pet", "animal", "animais", "veterinaria", "racao"],
        "posto":          ["combustivel", "combustiveis", "lubrificante", "gasolina", "etanol", "posto"],
        "materiais":      ["material", "materiais", "construcao", "ferragem", "tintas"],
        "roupas":         ["vestuario", "roupa", "roupas", "confeccao", "confeccoes", "moda"],
        "calcados":       ["calcados", "sapatos", "calcado"],
        "eletronicos":    ["informatica", "computador", "eletronico", "eletronicos", "celular", "telefone"],
        "autopecas":      ["autopecas", "pecas", "acessorios", "veiculos", "automotivo"],
        "otica":          ["otica", "oculos", "lentes", "optometria"],
        "joias":          ["joias", "bijouteria", "relogios", "ouro", "prata"],
        "papelaria":      ["papelaria", "artigos", "escritorio", "escolar"],
        "brinquedos":     ["brinquedos", "brinquedo", "diversoes", "jogos"],
        "moveis":         ["moveis", "mobiliario", "movel", "colchoes", "decoracao"],
        "ecommerce":      ["comercio eletronico", "internet", "varejo", "nao-especializado", "correio"],
        "marketplace":    ["comercio eletronico", "internet", "plataforma"],
        "importacao":     ["importacao", "importados", "importado", "comercio exterior"],
        "atacado":        ["atacadista", "atacado", "distribuicao", "distribuidora"],
        "sex shop":       ["sex shop", "artigos eroticos", "adulto"],
        "floricultura":   ["flores", "floricultura", "plantas", "ornamentais"],
        "livraria":       ["livraria", "livros", "livro", "publicacoes"],
        "conveniencia":   ["conveniencia", "loja", "varejo", "tabacaria"],

        // TI e Digital
        "software":       ["software", "programa", "programas", "sistemas", "desenvolvimento", "customizavel"],
        "site":           ["internet", "web", "consultoria em tecnologia", "desenvolvimento", "portais"],
        "app":            ["software", "aplicativo", "desenvolvimento", "customizavel"],
        "programacao":    ["desenvolvimento", "software", "sistemas", "tecnologia"],
        "ti":             ["tecnologia", "informacao", "informatica", "consultoria", "suporte tecnico"],
        "suporte tecnico":["suporte tecnico", "manutencao", "informatica", "equipamentos"],
        "hospedagem":     ["hospedagem", "internet", "servicos de informacao", "processamento de dados"],
        "marketing digital": ["publicidade", "marketing", "propaganda", "promocao", "digital"],
        "design":         ["design", "comunicacao visual", "grafico", "atividades de design"],
        "fotografia":     ["fotografia", "fotografico", "filmagem", "video"],
        "streaming":      ["streaming", "audio", "video", "internet", "transmissao"],
        "games":          ["jogos", "games", "eletronico", "software", "entretenimento"],

        // Saúde
        "medico":         ["medico", "medicina", "clinica", "atividade medica", "ambulatorial"],
        "dentista":       ["odontologia", "odontologica", "dental", "dentista", "dentario"],
        "psicologo":      ["psicologia", "psicologica", "terapia"],
        "fisioterapia":   ["fisioterapia", "fisioterapica", "reabilitacao"],
        "nutricao":       ["nutricao", "nutricionista", "dietetica"],
        "enfermagem":     ["enfermagem", "cuidados", "home care"],
        "laboratorio":    ["laboratorio", "analises clinicas", "patologia", "diagnostico"],
        "clinica":        ["clinica", "ambulatorial", "medica", "consultorio"],
        "hospital":       ["hospital", "hospitalar", "internacao", "pronto-socorro"],
        "farmacia manipulacao": ["farmacia", "manipulacao", "formulas", "homeopatia"],
        "otica saude":    ["otica", "optometria", "oftalmologia"],
        "fonoaudiologia": ["fonoaudiologia", "fono", "audiologia"],

        // Construção
        "construcao":     ["construcao", "obra", "edificacao", "edificio", "predial"],
        "pedreiro":       ["construcao", "alvenaria", "obras"],
        "eletricista":    ["instalacoes eletricas", "eletrica", "eletricidade"],
        "encanador":      ["hidraulica", "instalacoes hidraulicas", "hidrossanitarias"],
        "pintor":         ["pintura", "acabamento", "obra"],
        "reforma":        ["reforma", "manutencao", "acabamento", "construcao"],
        "terraplanagem":  ["terraplanagem", "terraplenagem", "movimentacao de terra", "escavacao"],
        "incorporacao":   ["incorporacao", "imobiliario", "imobiliaria"],
        "ar condicionado":["ar condicionado", "climatizacao", "refrigeracao", "instalacao"],

        // Transporte
        "frete":          ["transporte", "cargas", "mudanca", "frete"],
        "caminhao":       ["transporte", "cargas", "rodoviario"],
        "motorista":      ["transporte", "passageiros", "taxi", "motorista"],
        "uber":           ["transporte", "passageiros", "aplicativo", "taxi"],
        "motoboy":        ["entrega", "motoboy", "motocicleta", "courrier"],
        "logistica":      ["logistica", "armazenamento", "distribuicao", "deposito"],
        "mudanca":        ["mudanca", "transporte", "cargas", "frete"],
        "onibus":         ["onibus", "transporte", "passageiros", "coletivo", "rodoviario"],

        // Agro
        "agro":           ["agropecuaria", "agricola", "agricultura", "rural"],
        "pecuaria":       ["pecuaria", "bovino", "gado", "criacao de animais"],
        "fazenda":        ["agropecuaria", "cultivo", "lavoura", "producao agricola"],
        "soja":           ["soja", "cereais", "graos", "cultivo", "lavoura temporaria"],
        "milho":          ["milho", "cereais", "graos", "cultivo"],
        "gado":           ["bovino", "bovinos", "pecuaria", "criacao"],
        "madeira":        ["madeira", "serraria", "madeireira", "desdobramento", "florestal"],
        "peixe":          ["pesca", "piscicultura", "aquicultura", "peixes"],
        "frango":         ["aves", "avicultura", "frango", "criacao"],
        "leite":          ["leite", "laticinios", "lacticinios", "pecuaria leiteira"],
        "cafe":           ["cafe", "cafeicultura", "cultivo", "lavoura permanente"],

        // Serviços Profissionais
        "engenharia":     ["engenharia", "engenheiro", "projetos", "tecnico"],
        "arquitetura":    ["arquitetura", "arquitetonico", "urbanismo"],
        "consultoria":    ["consultoria", "assessoria", "gestao empresarial"],
        "contabilidade":  ["contabilidade", "contabil", "contabilista", "auditoria"],
        "advocacia":      ["advocacia", "juridica", "direito", "advogado"],
        "ambiental":      ["ambiental", "meio ambiente", "licenciamento", "gerenciamento ambiental"],
        "georeferenciamento": ["cartografia", "georreferenciamento", "geodesia", "topografia", "mapeamento", "analises tecnicas"],
        "topografia":     ["topografia", "agrimensura", "geodesia", "levantamento"],
        "pericia":        ["pericia", "perito", "avaliacao", "laudo"],
        "corretora":      ["corretora", "seguros", "corretagem", "intermediacao"],
        "despachante":    ["despachante", "documentos", "registro", "servicos administrativos"],

        // Serviços Pessoais / Beleza
        "salao":          ["salao", "cabeleireiro", "cabeleireiros", "beleza", "estetica"],
        "barbearia":      ["barbearia", "barbeiro", "cabeleireiro"],
        "manicure":       ["manicure", "pedicure", "unhas", "estetica"],
        "estetica":       ["estetica", "beleza", "tratamento", "depilacao"],
        "tatuagem":       ["tatuagem", "piercing", "corporal"],
        "academia":       ["academia", "ginastica", "musculacao", "fitness", "atividades fisicas"],
        "spa":            ["spa", "massagem", "relaxamento", "bem-estar"],

        // Educação
        "escola":         ["ensino", "educacao", "escola", "escolar", "instrucao"],
        "curso":          ["curso", "treinamento", "capacitacao", "educacao profissional"],
        "aula particular":["ensino", "instrucao", "educacao", "treinamento"],
        "idiomas":        ["idiomas", "linguas", "curso de linguas"],
        "autoescola":     ["autoescola", "formacao de condutores", "habilitacao"],
        "creche":         ["creche", "educacao infantil", "pre-escola"],

        // Imóveis
        "imobiliaria":    ["imobiliaria", "imoveis", "imovel", "aluguel", "locacao", "compra e venda"],
        "aluguel":        ["locacao", "aluguel", "imoveis", "administracao"],
        "condominio":     ["condominio", "condominios", "administracao predial"],

        // Eventos e Entretenimento
        "eventos":        ["eventos", "festas", "buffet", "organizacao", "cerimonial"],
        "fotografo":      ["fotografia", "fotografo", "filmagem"],
        "dj":             ["musica", "sonorizacao", "entretenimento", "artistico"],
        "grafica":        ["grafica", "impressao", "impressos", "editorial"],
        "propaganda":     ["publicidade", "propaganda", "marketing", "promocao"],

        // Outros
        "seguranca":      ["vigilancia", "seguranca", "monitoramento", "alarme"],
        "limpeza":        ["limpeza", "conservacao", "higienizacao", "lavanderia"],
        "energia solar":  ["energia solar", "fotovoltaica", "instalacoes eletricas", "energia"],
        "veterinario":    ["veterinaria", "veterinario", "animal", "pet"],
        "funilaria":      ["funilaria", "lanternagem", "pintura automotiva"],
        "borracharia":    ["borracharia", "pneu", "pneus", "vulcanizacao"],
        "vidraceiro":     ["vidros", "vidracaria", "espelhos", "temperado"],
        "serralheria":    ["serralheria", "metalurgica", "estrutura metalica"],
        "mecanica":       ["mecanica", "manutencao", "reparacao", "veiculos", "automotivo"],
        "oficina":        ["oficina", "manutencao", "reparacao", "conserto"],
        "lavagem":        ["lavagem", "lava-jato", "limpeza de veiculos"],
        "reciclagem":     ["reciclagem", "residuos", "sucata", "materiais reciclaveis"],
        "dedetizacao":    ["dedetizacao", "controle de pragas", "desinfeccao"],
        "funeraria":      ["funeraria", "funebre", "sepultamento", "cemiterio"],
        "banco":          ["banco", "financeira", "instituicao financeira", "credito"],
        "factoring":      ["factoring", "fomento mercantil", "cessao de creditos"],
    };

    // ═══════════════════════════════════════════════════════════════
    //  NORMALIZAÇÃO E TOKENIZAÇÃO
    // ═══════════════════════════════════════════════════════════════

    function normStr(s) {
        return (s || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s\-\/]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function tokenize(text) {
        return normStr(text).split(/\s+/).filter(t => t.length >= 2);
    }

    function expandTokens(tokens) {
        const expanded = new Set(tokens);
        tokens.forEach(token => {
            if (DICIONARIO[token]) {
                DICIONARIO[token].forEach(s => expanded.add(normStr(s)));
            }
            Object.keys(DICIONARIO).forEach(key => {
                const normKey = normStr(key);
                if (normKey === token || normKey.includes(token) || token.includes(normKey)) {
                    DICIONARIO[key].forEach(s => expanded.add(normStr(s)));
                }
            });
        });
        return [...expanded];
    }

    // ═══════════════════════════════════════════════════════════════
    //  ÍNDICE DE BUSCA
    // ═══════════════════════════════════════════════════════════════

    function buildIndex() {
        if (!CNAE) return;
        cnaeIndex = CNAE.map(item => ({
            ...item,
            descNorm: normStr(item.descricao),
            catNorm: normStr(item.categoria),
            codNum: item.codigoNumerico || item.codigo.replace(/[-\/]/g, ''),
        }));
    }

    // ═══════════════════════════════════════════════════════════════
    //  MOTOR DE BUSCA — SCORING
    // ═══════════════════════════════════════════════════════════════

    function buscar(textoUsuario) {
        if (!cnaeIndex) buildIndex();
        if (!cnaeIndex) return [];

        const textNorm = normStr(textoUsuario);
        if (searchCache.has(textNorm)) return searchCache.get(textNorm);

        const tokens = tokenize(textoUsuario);
        if (tokens.length === 0) return [];

        const isCodeSearch = /^\d{4}/.test(textNorm.replace(/\s/g, ''));
        const codeQuery = textNorm.replace(/[\s-\/]/g, '');
        const expanded = expandTokens(tokens);
        const results = [];

        for (let i = 0; i < cnaeIndex.length; i++) {
            const item = cnaeIndex[i];
            let score = 0;

            if (item.codNum === codeQuery || item.codigo.replace(/[-\/\s]/g, '') === codeQuery) {
                score = 100;
            } else if (isCodeSearch && item.codNum.startsWith(codeQuery)) {
                score = 80;
            } else {
                let tokenMatches = 0;
                tokens.forEach(token => {
                    if (item.descNorm.includes(token)) {
                        score += 25;
                        tokenMatches++;
                        if (item.descNorm.startsWith(token) || item.descNorm.includes(' ' + token)) {
                            score += 5;
                        }
                    }
                });
                expanded.forEach(syn => {
                    if (!tokens.includes(syn) && item.descNorm.includes(syn)) {
                        score += 15;
                    }
                });
                tokens.forEach(token => {
                    if (item.catNorm.includes(token)) {
                        score += 10;
                    }
                });
                if (tokens.length > 1 && tokenMatches === tokens.length) {
                    score += 30;
                }
            }

            if (score >= 30) {
                results.push({ ...item, score });
            }
        }

        results.sort((a, b) => b.score - a.score || a.descricao.length - b.descricao.length);
        const top = results.slice(0, 20);

        if (searchCache.size > 10) {
            const firstKey = searchCache.keys().next().value;
            searchCache.delete(firstKey);
        }
        searchCache.set(textNorm, top);
        return top;
    }


    // ═══════════════════════════════════════════════════════════════
    //  CÁLCULOS TRIBUTÁRIOS — v3: DELEGADOS AO COMPARADOR-REGIMES
    // ═══════════════════════════════════════════════════════════════

    /**
     * Calcula impostos para um CNAE usando o ComparadorRegimes v3.
     * Se o ComparadorRegimes não estiver disponível, usa cálculo local (fallback).
     *
     * @param {string} codigo - Código CNAE
     * @param {string} categoria - Categoria (Comércio, Indústria, Serviço)
     * @param {number} faturamento - Faturamento mensal
     * @param {number} folha - Folha de pagamento mensal
     * @param {string} uf - Sigla do estado
     * @returns {Object} Resultado completo com regras, simples, presumido, real, alertas, etc.
     */
    function calcularTributosViaComparador(codigo, categoria, faturamento, folha, uf) {
        if (!_usandoComparador || !CR) {
            return _calcularFallbackLocal(codigo, categoria, faturamento, folha, uf);
        }

        // ── Usar ComparadorRegimes.compararParaCNAE() — fonte única de verdade ──
        const resultado = CR.compararParaCNAE(codigo, categoria, faturamento, folha, uf);

        // Determinar melhor regime
        const menorTotal = Math.min(
            resultado.simples ? resultado.simples.total : Infinity,
            resultado.presumido.total,
            resultado.real.total
        );

        let melhorRegime = resultado.melhorRegime || 'Lucro Real';

        // Verificar monofásico via CnaeMapeamento (se disponível)
        const monofasico = CM && CM.isMonofasico ? CM.isMonofasico(codigo) : false;

        return {
            regras: resultado.regras,
            simples: resultado.simples,
            presumido: resultado.presumido,
            real: resultado.real,
            menorTotal: menorTotal === Infinity ? 0 : menorTotal,
            melhorRegime: melhorRegime,
            monofasico: monofasico,
            // v3: dados extras do ComparadorRegimes
            vantagens: resultado.vantagens || [],
            recomendacao: resultado.recomendacao || '',
            alertas: resultado.alertas || [],
            economiaAnual: resultado.economiaAnual || 0,
            dadosEstado: resultado.dadosEstado || null,
            fichaTributaria: resultado.fichaTributaria || null,
            fonte: 'comparador-regimes-v3',
        };
    }

    /**
     * Fallback: cálculo local quando ComparadorRegimes não está disponível.
     * Usa lógica simplificada da v2.0 como backup.
     */
    function _calcularFallbackLocal(codigo, categoria, faturamento, folha, uf) {
        // Obter regras via CnaeMapeamento ou CR
        let regras;
        if (CR && CR.obterRegras) {
            regras = CR.obterRegras(codigo, categoria);
        } else if (CM && CM.obterRegrasCNAE) {
            regras = CM.obterRegrasCNAE(codigo, categoria);
        } else {
            regras = _regrasFallback(codigo, categoria);
        }

        const simples = _calcularSimplesFallback(faturamento, folha, regras);
        const presumido = _calcularPresumidoFallback(faturamento, folha, regras, uf);
        const real = _calcularRealFallback(faturamento, folha, regras, uf);

        const menorTotal = Math.min(
            simples ? simples.total : Infinity,
            presumido.total,
            real.total
        );
        let melhorRegime = 'Lucro Real';
        if (presumido.total <= real.total && presumido.total <= (simples ? simples.total : Infinity)) melhorRegime = 'Lucro Presumido';
        if (simples && simples.total <= presumido.total && simples.total <= real.total) melhorRegime = 'Simples Nacional';

        const monofasico = CM && CM.isMonofasico ? CM.isMonofasico(codigo) : false;

        return {
            regras, simples, presumido, real,
            menorTotal: menorTotal === Infinity ? 0 : menorTotal,
            melhorRegime, monofasico,
            vantagens: [],
            recomendacao: '',
            alertas: [{ tipo: 'atencao', icone: '⚠️', titulo: 'Dados estimados', descricao: 'ComparadorRegimes não carregado — valores são estimativas. Carregue comparador-regimes.js para dados reais.' }],
            economiaAnual: 0,
            dadosEstado: null,
            fichaTributaria: null,
            fonte: 'fallback-local',
        };
    }

    /** Regras fallback mínimas */
    function _regrasFallback(codigo, categoria) {
        const catNorm = (categoria || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        let catBase = 'servico';
        if (catNorm.includes('comercio') || catNorm.includes('varejo')) catBase = 'comercio';
        else if (catNorm.includes('industria') || catNorm.includes('fabricacao')) catBase = 'industria';

        const presuncaoMap = {
            comercio:  { irpj: 0.08, csll: 0.12, anexo: 'I',   tipoTributo: 'ICMS' },
            industria: { irpj: 0.08, csll: 0.12, anexo: 'II',  tipoTributo: 'ICMS' },
            servico:   { irpj: 0.32, csll: 0.32, anexo: 'III', tipoTributo: 'ISS' },
        };
        const p = presuncaoMap[catBase];
        return {
            cnae: codigo, categoria: catBase,
            anexo: p.anexo, fatorR: catBase === 'servico',
            vedado: false, presuncao: catBase === 'comercio' ? 'comercio_industria' : 'servicos_gerais',
            presuncaoIRPJ: p.irpj, presuncaoCSLL: p.csll,
            tipoTributo: p.tipoTributo,
            nota: '', fonte: 'fallback',
        };
    }

    /** Simples Nacional — fallback */
    function _calcularSimplesFallback(faturamento, folha, regras) {
        const rbt12 = faturamento * 12;
        if (rbt12 > 4800000 || regras.vedado) return null;

        const fatorR = folha > 0 ? folha / faturamento : 0;
        let anexo = regras.anexo;
        if (regras.fatorR) anexo = (fatorR >= 0.28) ? 'III' : 'V';

        // Tabelas simplificadas
        const tabelas = {
            I:   [{ l: 180000, a: 0.04, d: 0 }, { l: 360000, a: 0.073, d: 5940 }, { l: 720000, a: 0.095, d: 13860 }, { l: 1800000, a: 0.107, d: 22500 }, { l: 3600000, a: 0.143, d: 87300 }, { l: 4800000, a: 0.19, d: 378000 }],
            II:  [{ l: 180000, a: 0.045, d: 0 }, { l: 360000, a: 0.078, d: 5940 }, { l: 720000, a: 0.10, d: 13860 }, { l: 1800000, a: 0.112, d: 22500 }, { l: 3600000, a: 0.147, d: 85500 }, { l: 4800000, a: 0.30, d: 720000 }],
            III: [{ l: 180000, a: 0.06, d: 0 }, { l: 360000, a: 0.112, d: 9360 }, { l: 720000, a: 0.135, d: 17640 }, { l: 1800000, a: 0.16, d: 35640 }, { l: 3600000, a: 0.21, d: 125640 }, { l: 4800000, a: 0.33, d: 648000 }],
            IV:  [{ l: 180000, a: 0.045, d: 0 }, { l: 360000, a: 0.09, d: 8100 }, { l: 720000, a: 0.102, d: 12420 }, { l: 1800000, a: 0.14, d: 39780 }, { l: 3600000, a: 0.22, d: 183780 }, { l: 4800000, a: 0.33, d: 828000 }],
            V:   [{ l: 180000, a: 0.155, d: 0 }, { l: 360000, a: 0.18, d: 4500 }, { l: 720000, a: 0.195, d: 9900 }, { l: 1800000, a: 0.205, d: 17100 }, { l: 3600000, a: 0.23, d: 62100 }, { l: 4800000, a: 0.305, d: 540000 }],
        };

        // Se temos IF com tabelas completas, usar
        if (IF && IF.SIMPLES_NACIONAL && IF.SIMPLES_NACIONAL['ANEXO_' + anexo]) {
            const faixas = IF.SIMPLES_NACIONAL['ANEXO_' + anexo].faixas;
            let faixa = faixas[faixas.length - 1];
            for (let i = 0; i < faixas.length; i++) {
                if (rbt12 <= faixas[i].limite) { faixa = faixas[i]; break; }
            }
            const aliqEfetiva = (rbt12 * faixa.aliquota - faixa.deducao) / rbt12;
            const das = faturamento * Math.max(0, aliqEfetiva);
            const cppFora = anexo === 'IV' ? folha * 0.278 : 0;
            return { total: das + cppFora, das, cppFora, aliqEfetiva: Math.max(0, aliqEfetiva), anexoEfetivo: anexo, faixa: faixa.faixa };
        }

        // Usar tabelas inline
        const faixas = tabelas[anexo] || tabelas['III'];
        let faixa = faixas[faixas.length - 1];
        for (let i = 0; i < faixas.length; i++) {
            if (rbt12 <= faixas[i].l) { faixa = faixas[i]; break; }
        }
        const aliqEfetiva = Math.max(0, (rbt12 * faixa.a - faixa.d) / rbt12);
        const das = faturamento * aliqEfetiva;
        const cppFora = anexo === 'IV' ? folha * 0.278 : 0;
        return { total: das + cppFora, das, cppFora, aliqEfetiva, anexoEfetivo: anexo, faixa: 0 };
    }

    /** Presumido — fallback */
    function _calcularPresumidoFallback(faturamento, folha, regras, uf) {
        const baseIRPJ = faturamento * regras.presuncaoIRPJ;
        const baseCSLL = faturamento * regras.presuncaoCSLL;
        let irpj = baseIRPJ * 0.15;
        if (baseIRPJ > 20000) irpj += (baseIRPJ - 20000) * 0.10;
        const csll = baseCSLL * 0.09;
        const pis = faturamento * 0.0065;
        const cofins = faturamento * 0.03;
        const cpp = folha * 0.278;
        const estado = ES ? ES[uf] : null;
        if (estado && estado.beneficios && estado.beneficios.tem_sudam) irpj *= 0.25;
        const isServico = regras.presuncaoIRPJ >= 0.32 || ['III', 'IV', 'V'].includes(regras.anexo);
        const iss = isServico ? faturamento * 0.05 : 0;
        const icmsRate = estado ? (estado.icms.padrao || 0.18) : 0.18;
        const icms = !isServico ? faturamento * icmsRate * 0.3 : 0;
        const total = irpj + csll + pis + cofins + cpp + iss + icms;
        return { total, irpj, csll, pis, cofins, cpp, iss, icms, aliqEfetiva: total / faturamento };
    }

    /** Lucro Real — fallback */
    function _calcularRealFallback(faturamento, folha, regras, uf) {
        const margem = 0.20;
        const lucro = faturamento * margem;
        let irpj = lucro * 0.15;
        if (lucro > 20000) irpj += (lucro - 20000) * 0.10;
        const csll = lucro * 0.09;
        const creditoEstimado = faturamento * 0.30;
        const pis = Math.max(0, (faturamento * 0.0165) - (creditoEstimado * 0.0165));
        const cofins = Math.max(0, (faturamento * 0.076) - (creditoEstimado * 0.076));
        const cpp = folha * 0.278;
        const estado = ES ? ES[uf] : null;
        if (estado && estado.beneficios && estado.beneficios.tem_sudam) irpj *= 0.25;
        const isServico = regras.presuncaoIRPJ >= 0.32;
        const iss = isServico ? faturamento * 0.05 : 0;
        const icmsRate = estado ? (estado.icms.padrao || 0.18) : 0.18;
        const icms = !isServico ? faturamento * icmsRate * 0.3 : 0;
        const total = irpj + csll + pis + cofins + cpp + iss + icms;
        return { total, irpj, csll, pis, cofins, cpp, iss, icms, aliqEfetiva: total / faturamento };
    }


    // ═══════════════════════════════════════════════════════════════
    //  FORMATAÇÃO
    // ═══════════════════════════════════════════════════════════════

    function formatBRL(n) {
        if (n === null || n === undefined) return '—';
        return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function formatPct(n) {
        if (n === null || n === undefined) return '—';
        return (n * 100).toFixed(2).replace('.', ',') + '%';
    }

    function formatBRLShort(n) {
        if (n === null || n === undefined) return '—';
        if (n >= 1000000) return 'R$ ' + (n / 1000000).toFixed(1).replace('.', ',') + 'M';
        if (n >= 1000) return 'R$ ' + (n / 1000).toFixed(1).replace('.', ',') + 'k';
        return formatBRL(n);
    }

    function aplicarMascaraMoney(el) {
        let v = el.value.replace(/\D/g, '');
        if (!v) { el.value = ''; return; }
        v = (parseInt(v, 10) / 100).toFixed(2);
        v = v.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        el.value = 'R$ ' + v;
    }

    function parseMoney(el) {
        const raw = (typeof el === 'string' ? el : el.value) || '';
        const num = raw.replace(/[^\d,]/g, '').replace(',', '.');
        return parseFloat(num) || 0;
    }

    // ═══════════════════════════════════════════════════════════════
    //  HIGHLIGHT MATCHING TERMS
    // ═══════════════════════════════════════════════════════════════

    function highlightTerms(text, searchText) {
        const tokens = tokenize(searchText);
        const expanded = expandTokens(tokens);
        let result = text;
        const allTerms = [...new Set([...tokens, ...expanded])].sort((a, b) => b.length - a.length);

        allTerms.forEach(term => {
            if (term.length < 3) return;
            const regex = new RegExp('(' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
            result = result.replace(regex, '<mark class="hl">$1</mark>');
        });
        return result;
    }

    // ═══════════════════════════════════════════════════════════════
    //  CATEGORY BADGE
    // ═══════════════════════════════════════════════════════════════

    function getCategoryBadge(categoria) {
        const catNorm = normStr(categoria);
        if (catNorm.includes('comercio')) return '<span class="badge badge-comercio">Comércio</span>';
        if (catNorm.includes('industria')) return '<span class="badge badge-industria">Indústria</span>';
        return '<span class="badge badge-servico">Serviço</span>';
    }

    // ═══════════════════════════════════════════════════════════════
    //  RENDER — REGIME BOX (winner card)
    // ═══════════════════════════════════════════════════════════════

    function renderRegimeBox(label, valor, isBest, isVedado) {
        if (isVedado && label === 'Simples') {
            return `<div class="regime-box vedado">
                <div class="regime-box-label">${label}</div>
                <div class="regime-box-value">⛔ Vedado</div>
            </div>`;
        }
        if (valor === null) {
            return `<div class="regime-box">
                <div class="regime-box-label">${label}</div>
                <div class="regime-box-value" style="color:var(--text-light);font-size:.82rem;">Inelegível</div>
            </div>`;
        }
        return `<div class="regime-box${isBest ? ' best' : ''}">
            <div class="regime-box-label">${label}${isBest ? ' 🏆' : ''}</div>
            <div class="regime-box-value">${formatBRL(valor)}</div>
        </div>`;
    }

    // ═══════════════════════════════════════════════════════════════
    //  RENDER — REGIME LINE (card)
    // ═══════════════════════════════════════════════════════════════

    function renderRegimeLine(label, valor, isBest, isVedado) {
        if (isVedado && label === 'Simples') {
            return `<div class="regime-line">
                <span class="regime-line-label">${label}</span>
                <span class="regime-line-value vedado">⛔ Vedado</span>
            </div>`;
        }
        if (valor === null) {
            return `<div class="regime-line">
                <span class="regime-line-label">${label}</span>
                <span class="regime-line-value inelegivel">Inelegível</span>
            </div>`;
        }
        return `<div class="regime-line">
            <span class="regime-line-label">${label}${isBest ? ' 🏆' : ''}</span>
            <span class="regime-line-value${isBest ? ' best' : ''}">${formatBRL(valor)}</span>
        </div>`;
    }


    // ═══════════════════════════════════════════════════════════════
    //  RENDER — v3: ALERTAS E DADOS DO ESTADO NO CARD
    // ═══════════════════════════════════════════════════════════════

    /**
     * Renderiza badges de alertas e dados do estado dentro do card.
     * Só aparece se o ComparadorRegimes estiver ativo.
     */
    function renderCardExtras(item) {
        if (item.fonte !== 'comparador-regimes-v3') return '';

        let html = '';

        // Dados do estado usados no cálculo
        if (item.fichaTributaria) {
            const ft = item.fichaTributaria;
            html += `<div class="card-estado-info">`;
            html += `<span class="card-estado-tag" title="ICMS real de ${ft.estado}">ICMS ${ft.icmsPadrao}</span>`;
            html += `<span class="card-estado-tag" title="ISS real de ${ft.issMunicipio}">ISS ${ft.issCapital}</span>`;
            if (ft.fecop !== 'Não possui') {
                html += `<span class="card-estado-tag fecop" title="FECOP">FECOP ${ft.fecop}</span>`;
            }
            if (ft.incentivo && ft.incentivo !== 'Nenhum federal') {
                html += `<span class="card-estado-tag incentivo" title="Incentivo federal">${ft.incentivo} -75% IRPJ</span>`;
            }
            html += `</div>`;
        }

        // Economia anual
        if (item.economiaAnual > 0) {
            html += `<div class="card-economia">💡 Economia: ${formatBRL(item.economiaAnual)}/ano vs pior regime</div>`;
        }

        // Alertas resumidos (max 2 no card)
        if (item.alertas && item.alertas.length > 0) {
            const alertasPrioritarios = item.alertas
                .filter(a => a.tipo === 'critico' || a.tipo === 'oportunidade')
                .slice(0, 2);
            if (alertasPrioritarios.length > 0) {
                html += `<div class="card-alertas">`;
                alertasPrioritarios.forEach(a => {
                    html += `<div class="card-alerta-mini ${a.tipo}">${a.icone} ${a.titulo}</div>`;
                });
                html += `</div>`;
            }
        }

        return html;
    }

    // ═══════════════════════════════════════════════════════════════
    //  RENDER — RESULT CARD
    // ═══════════════════════════════════════════════════════════════

    function renderCard(item, pos, searchText) {
        const { regras, simples, presumido, real, melhorRegime, monofasico, score } = item;
        const scorePct = Math.min(100, Math.round((score / 100) * 100));

        return `
            <div class="result-card fade-in">
                <div class="result-card-pos">#${pos}</div>
                <div class="result-card-code">${item.codigo}</div>
                <div class="result-card-desc">${highlightTerms(item.descricao, searchText)}</div>
                <div class="result-card-badges">
                    ${getCategoryBadge(item.categoria)}
                    <span class="badge badge-anexo">Anexo ${regras.fatorR ? regras.anexo + ' (FR)' : regras.anexo}</span>
                    ${monofasico ? '<span class="badge badge-mono">💊 Monofásico</span>' : ''}
                    ${regras.vedado ? '<span class="badge badge-vedado">⛔ Vedado</span>' : ''}
                </div>

                <div class="result-card-regimes">
                    ${renderRegimeLine('Simples', simples ? simples.total : null, melhorRegime === 'Simples Nacional', regras.vedado)}
                    ${renderRegimeLine('Presumido', presumido.total, melhorRegime === 'Lucro Presumido', false)}
                    ${renderRegimeLine('L. Real', real.total, melhorRegime === 'Lucro Real', false)}
                </div>

                ${renderCardExtras(item)}

                <div class="score-bar">
                    <div class="score-bar-track"><div class="score-bar-fill" style="width:${scorePct}%"></div></div>
                    <span class="score-bar-pct">${scorePct}%</span>
                </div>

                <div class="result-card-actions">
                    <button onclick="window._consultorNavAnalise('${item.codigo}','${item.categoria}')" class="btn-card primary">📊 Análise</button>
                    <button onclick="window._consultorCopiar('${item.codigo}')" class="btn-card outline">📋 Copiar</button>
                </div>
                ${(regras.fonte === 'categoria' || regras.fonte === 'padrao' || regras.fonte === 'fallback') ? '<div class="result-card-aviso">⚠️ Classificação estimada — consulte um contador</div>' : ''}
            </div>
        `;
    }

    // ═══════════════════════════════════════════════════════════════
    //  RENDER — COMPARATIVE TABLE
    // ═══════════════════════════════════════════════════════════════

    function renderTabelaComparativa(resultados) {
        let html = `
            <div style="margin-top:20px;">
                <button id="btnToggleTabela" class="toggle-tabela" onclick="
                    var t=document.getElementById('tabelaComp');
                    var isHidden=t.style.display==='none';
                    t.style.display=isHidden?'block':'none';
                    this.querySelector('.arrow').textContent=isHidden?'▼':'▶';
                ">
                    <span class="arrow">▶</span> 📊 Tabela Comparativa Completa
                </button>
                <div id="tabelaComp" class="tabela-comp">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>CNAE</th>
                                <th>Descrição</th>
                                <th>Cat.</th>
                                <th>Anexo</th>
                                <th style="text-align:right">Simples</th>
                                <th style="text-align:right">Presumido</th>
                                <th style="text-align:right">L. Real</th>
                                <th>Melhor</th>
                                ${_usandoComparador ? '<th style="text-align:right">Economia/ano</th>' : ''}
                            </tr>
                        </thead>
                        <tbody>
        `;

        resultados.forEach((item, i) => {
            const isBest = i === 0;
            html += `
                <tr class="${isBest ? 'row-best' : ''}">
                    <td>${i + 1}</td>
                    <td style="color:var(--green);white-space:nowrap;">${item.codigo}</td>
                    <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${item.descricao}</td>
                    <td style="text-align:center;">${getCategoryBadge(item.categoria)}</td>
                    <td style="text-align:center;font-weight:600;">${item.regras.vedado ? '⛔' : item.regras.anexo}${item.regras.fatorR ? '*' : ''}</td>
                    <td style="text-align:right;font-weight:${item.melhorRegime === 'Simples Nacional' ? '700' : '500'};color:${item.melhorRegime === 'Simples Nacional' ? 'var(--green-dark)' : 'inherit'};">${item.simples ? formatBRL(item.simples.total) : (item.regras.vedado ? '⛔' : '—')}</td>
                    <td style="text-align:right;font-weight:${item.melhorRegime === 'Lucro Presumido' ? '700' : '500'};color:${item.melhorRegime === 'Lucro Presumido' ? 'var(--green-dark)' : 'inherit'};">${formatBRL(item.presumido.total)}</td>
                    <td style="text-align:right;font-weight:${item.melhorRegime === 'Lucro Real' ? '700' : '500'};color:${item.melhorRegime === 'Lucro Real' ? 'var(--green-dark)' : 'inherit'};">${formatBRL(item.real.total)}</td>
                    <td style="text-align:center;font-size:.72rem;font-weight:700;color:var(--green);">${item.melhorRegime.replace('Lucro ', 'L. ')}</td>
                    ${_usandoComparador ? `<td style="text-align:right;font-size:.72rem;color:var(--green-dark);">${item.economiaAnual > 0 ? formatBRL(item.economiaAnual) : '—'}</td>` : ''}
                </tr>
            `;
        });

        html += `
                        </tbody>
                    </table>
                    <div class="nota-tabela">
                        * Sujeito ao Fator R (Folha/Faturamento ≥ 28% migra para Anexo III)
                        ${_usandoComparador ? '<br>📊 Valores calculados com dados reais do estado via ComparadorRegimes v3.0' : '<br>⚠️ Valores estimados — carregue comparador-regimes.js para dados reais'}
                    </div>
                </div>
            </div>
        `;

        return html;
    }


    // ═══════════════════════════════════════════════════════════════
    //  v3: RENDER — ALERTAS DO COMPARADOR NO WINNER CARD
    // ═══════════════════════════════════════════════════════════════

    function renderAlertasWinner(item) {
        if (!item.alertas || item.alertas.length === 0) return '';

        let html = '<div class="winner-alertas">';
        item.alertas.forEach(a => {
            html += `<div class="alerta-item alerta-${a.tipo}">
                <span class="alerta-icone">${a.icone}</span>
                <div class="alerta-body">
                    <div class="alerta-titulo">${a.titulo}</div>
                    <div class="alerta-desc">${a.descricao}</div>
                </div>
            </div>`;
        });
        html += '</div>';
        return html;
    }

    /**
     * v3: Renderiza recomendação textual e vantagens do regime vencedor
     */
    function renderRecomendacaoWinner(item) {
        let html = '';

        // Recomendação textual
        if (item.recomendacao) {
            html += `<div class="winner-recomendacao">
                <div class="recomendacao-titulo">📋 Recomendação</div>
                <div class="recomendacao-texto">${item.recomendacao}</div>
            </div>`;
        }

        // Vantagens (top 3)
        if (item.vantagens && item.vantagens.length > 0) {
            html += '<div class="winner-vantagens">';
            item.vantagens.slice(0, 3).forEach(v => {
                html += `<div class="vantagem-item">
                    <span class="vantagem-icone">${v.icone}</span>
                    <div class="vantagem-body">
                        <div class="vantagem-titulo">${v.titulo}</div>
                        <div class="vantagem-desc">${v.descricao}</div>
                    </div>
                </div>`;
            });
            html += '</div>';
        }

        return html;
    }


    // ═══════════════════════════════════════════════════════════════
    //  RENDERIZAÇÃO DE RESULTADOS — v3 INTEGRADO
    // ═══════════════════════════════════════════════════════════════

    function renderResultados(resultados, textoBusca, uf, faturamento, folha) {
        const container = $('resultsArea');
        const searchText = textoBusca;

        // Hide welcome
        const welcome = $('welcomeMsg');
        if (welcome) welcome.style.display = 'none';

        if (resultados.length === 0) {
            container.innerHTML = `
                <div class="welcome-msg">
                    <div class="icon">🔍</div>
                    <h3>Nenhum CNAE encontrado para "${textoBusca}"</h3>
                    <p>Tente termos diferentes ou mais específicos.<br>Exemplos: "restaurante", "loja de roupas", "consultoria"</p>
                </div>
            `;
            container.style.display = 'block';
            return;
        }

        // ── v3: Calcular via ComparadorRegimes ──
        const resultadosComImpostos = resultados.map(item => {
            const calc = calcularTributosViaComparador(item.codigo, item.categoria, faturamento, folha, uf);
            return {
                ...item,
                regras: calc.regras,
                simples: calc.simples,
                presumido: calc.presumido,
                real: calc.real,
                menorTotal: calc.menorTotal,
                melhorRegime: calc.melhorRegime,
                monofasico: calc.monofasico,
                // v3 extras
                vantagens: calc.vantagens,
                recomendacao: calc.recomendacao,
                alertas: calc.alertas,
                economiaAnual: calc.economiaAnual,
                dadosEstado: calc.dadosEstado,
                fichaTributaria: calc.fichaTributaria,
                fonte: calc.fonte,
            };
        });

        // Sort by lowest tax
        resultadosComImpostos.sort((a, b) => a.menorTotal - b.menorTotal);
        lastResults = resultadosComImpostos;

        // ── v3: Obter dados do estado para header ──
        let dadosEstadoHeader = null;
        if (_usandoComparador && CR) {
            dadosEstadoHeader = CR.extrairDadosEstado(uf);
        }

        let html = '';

        // ── Summary Bar (v3: com dados reais do estado) ──
        const estadoNome = dadosEstadoHeader ? dadosEstadoHeader.nome : (ES && ES[uf] ? ES[uf].nome : uf);
        html += `
            <div class="summary-bar fade-in">
                <div class="summary-item">
                    <div class="summary-label">🔍 Busca</div>
                    <div class="summary-value">"${textoBusca}"</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">📍 Estado</div>
                    <div class="summary-value">${estadoNome} (${uf})</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">💰 Faturamento</div>
                    <div class="summary-value mono">${formatBRL(faturamento)}/mês</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">📊 Encontrados</div>
                    <div class="summary-value accent">${resultadosComImpostos.length} CNAEs</div>
                </div>
                ${_usandoComparador && dadosEstadoHeader ? `
                <div class="summary-item">
                    <div class="summary-label">🏛️ ICMS Real</div>
                    <div class="summary-value mono">${dadosEstadoHeader.icms.aliquotaEfetivaPerc || dadosEstadoHeader.icms.aliquotaPadraoPerc}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">📋 ISS Real</div>
                    <div class="summary-value mono">${dadosEstadoHeader.iss.aliquotaGeralPerc}</div>
                </div>` : ''}
            </div>
        `;

        // ── v3: Badge de fonte de dados ──
        if (_usandoComparador) {
            html += `<div class="fonte-badge fade-in">✅ Calculado com dados reais de ${estadoNome} via ComparadorRegimes v3.0</div>`;
        } else {
            html += `<div class="fonte-badge fonte-fallback fade-in">⚠️ Dados estimados — carregue comparador-regimes.js para dados reais por estado</div>`;
        }

        // ── Winner Card ──
        if (resultadosComImpostos.length > 0) {
            const champ = resultadosComImpostos[0];
            const piorTotal = Math.max(
                champ.simples ? champ.simples.total : 0,
                champ.presumido.total,
                champ.real.total
            );
            const economiaAnual = champ.economiaAnual > 0 ? champ.economiaAnual : (piorTotal - champ.menorTotal) * 12;

            html += `
                <div class="winner-card fade-in">
                    <div class="winner-top">
                        <div class="winner-info">
                            <div class="winner-tag">🏆 CNAE MAIS ECONÔMICO</div>
                            <div class="winner-code">${champ.codigo}</div>
                            <div class="winner-desc">${highlightTerms(champ.descricao, searchText)}</div>
                            <div class="result-card-badges">
                                ${getCategoryBadge(champ.categoria)}
                                <span class="badge badge-anexo">Anexo ${champ.regras.fatorR ? champ.regras.anexo + ' (Fator R)' : champ.regras.anexo}</span>
                                ${champ.monofasico ? '<span class="badge badge-mono">💊 Monofásico</span>' : ''}
                                ${champ.regras.vedado ? '<span class="badge badge-vedado">⛔ Vedado ao Simples</span>' : ''}
                            </div>
                        </div>
                        <div class="winner-regimes">
                            ${renderRegimeBox('Simples', champ.simples ? champ.simples.total : null, champ.melhorRegime === 'Simples Nacional', champ.regras.vedado)}
                            ${renderRegimeBox('Presumido', champ.presumido.total, champ.melhorRegime === 'Lucro Presumido', false)}
                            ${renderRegimeBox('L. Real', champ.real.total, champ.melhorRegime === 'Lucro Real', false)}
                        </div>
                    </div>
                    ${economiaAnual > 0 ? `<div class="winner-economia">💡 Economia de ${formatBRL(economiaAnual)}/ano vs pior regime</div>` : ''}

                    ${renderCardExtras(champ)}
                    ${renderRecomendacaoWinner(champ)}
                    ${renderAlertasWinner(champ)}

                    <div class="winner-actions">
                        <button onclick="window._consultorNavAnalise('${champ.codigo}','${champ.categoria}')" class="btn-card primary" style="padding:8px 18px;font-size:.85rem;">📊 Análise Completa</button>
                        <button onclick="window._consultorCopiar('${champ.codigo}')" class="btn-card outline" style="padding:8px 18px;font-size:.85rem;">📋 Copiar CNAE</button>
                    </div>
                    ${(champ.regras.fonte === 'categoria' || champ.regras.fonte === 'padrao' || champ.regras.fonte === 'fallback') ? '<div class="winner-aviso">⚠️ Classificação estimada — consulte um contador</div>' : ''}
                </div>
            `;
        }

        // ── Cards Grid ──
        if (resultadosComImpostos.length > 1) {
            html += '<div class="results-grid">';
            for (let i = 1; i < resultadosComImpostos.length; i++) {
                html += renderCard(resultadosComImpostos[i], i + 1, searchText);
            }
            html += '</div>';
        }

        // ── Comparative Table ──
        html += renderTabelaComparativa(resultadosComImpostos);

        // ── Pro Teaser ──
        html += `
            <div class="pro-teaser fade-in">
                <h3>⭐ IMPOST. PRO — Consultor com Inteligência Artificial</h3>
                <div class="pro-features">
                    <span>✅ Resultados ilimitados</span>
                    <span>✅ IA entende linguagem natural</span>
                    <span>✅ Análise de risco</span>
                    <span>✅ CNAE secundário otimizado</span>
                    <span>✅ Relatório PDF</span>
                </div>
                <a href="javascript:void(0)" class="pro-btn">🚀 Conhecer o IMPOST. PRO</a>
            </div>
        `;

        container.innerHTML = html;
        container.style.display = 'block';

        // Staggered card animation
        requestAnimationFrame(() => {
            const cards = container.querySelectorAll('.result-card');
            cards.forEach((card, i) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(16px)';
                setTimeout(() => {
                    card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 60 * i);
            });
        });

        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }


    // ═══════════════════════════════════════════════════════════════
    //  PAINEL LATERAL — v3: FICHA TRIBUTÁRIA COMPLETA DO ESTADO
    // ═══════════════════════════════════════════════════════════════

    function renderPainelEstado(uf) {
        const panel = $('statePanel');
        if (!uf) { panel.style.display = 'none'; return; }

        // ── v3: Usar ComparadorRegimes.fichaTributariaUF() se disponível ──
        if (_usandoComparador && CR && CR.fichaTributariaUF) {
            const ficha = CR.fichaTributariaUF(uf);
            _renderPainelComFicha(panel, uf, ficha);
            return;
        }

        // ── Fallback: dados locais do ES ──
        if (!ES || !ES[uf]) { panel.style.display = 'none'; return; }
        _renderPainelFallback(panel, uf);
    }

    /**
     * v3: Renderiza painel com ficha tributária completa do ComparadorRegimes
     */
    function _renderPainelComFicha(panel, uf, ficha) {
        const id = ficha.identificacao;
        const resumo = ficha.resumoConsultor;
        const icms = ficha.tributosEstaduais.icms;
        const iss = ficha.tributosEstaduais.iss;
        const incentivos = ficha.incentivos;
        const sn = ficha.simplesNacional;

        let html = `
            <div class="panel-title">📍 ${id.nome} (${id.sigla})</div>
            <div class="panel-subtitle">${id.capital} — ${id.regiao}</div>

            <div class="panel-section">
                <div class="panel-section-title">🏛️ Tributos Reais</div>
                <div class="panel-row"><span>ICMS padrão</span><span class="panel-row-value">${resumo.icmsReal}</span></div>
                ${resumo.temFECOP ? `<div class="panel-row"><span>${icms.fecop.nome}</span><span class="panel-row-value fecop-val">+${resumo.fecopValor}</span></div>` : ''}
                <div class="panel-row"><span>ISS geral (${iss.municipioReferencia})</span><span class="panel-row-value">${resumo.issReal}</span></div>
                <div class="panel-row"><span>ISS faixa</span><span class="panel-row-value">${formatPct(iss.aliquotaMinima)} a ${formatPct(iss.aliquotaMaxima)}</span></div>
                ${resumo.temST ? '<div class="panel-row"><span>Substituição Tributária</span><span class="panel-row-value">Sim</span></div>' : ''}
            </div>

            <div class="panel-section">
                <div class="panel-section-title">📋 Simples Nacional</div>
                <div class="panel-row"><span>Sublimite ICMS/ISS</span><span class="panel-row-value">${resumo.sublimiteSN}</span></div>
            </div>
        `;

        // Incentivos
        if (resumo.temIncentivo || resumo.temZFM || resumo.programasEstaduais > 0) {
            html += '<div class="panel-section"><div class="panel-section-title">🏆 Incentivos</div>';

            if (incentivos.sudam) {
                html += `<div class="panel-benefit sudam">
                    <div class="panel-benefit-title">✅ SUDAM ativo</div>
                    <div class="panel-benefit-desc">Redução de ${resumo.reducaoIRPJ} no IRPJ (Presumido e Real)</div>
                </div>`;
            }
            if (incentivos.sudene) {
                html += `<div class="panel-benefit sudene">
                    <div class="panel-benefit-title">✅ SUDENE ativo</div>
                    <div class="panel-benefit-desc">Redução de ${resumo.reducaoIRPJ} no IRPJ</div>
                </div>`;
            }
            if (incentivos.sudeco) {
                html += `<div class="panel-benefit sudeco">
                    <div class="panel-benefit-title">✅ SUDECO ativo</div>
                    <div class="panel-benefit-desc">Incentivos Centro-Oeste</div>
                </div>`;
            }
            if (incentivos.zfm) {
                html += `<div class="panel-benefit zf">
                    <div class="panel-benefit-title">✅ Zona Franca de Manaus</div>
                    <div class="panel-benefit-desc">Isenção de IPI + redução de ICMS</div>
                </div>`;
            }
            if (incentivos.suframa) {
                html += `<div class="panel-benefit suframa">
                    <div class="panel-benefit-title">✅ SUFRAMA</div>
                    <div class="panel-benefit-desc">Área de Livre Comércio</div>
                </div>`;
            }
            if (resumo.programasEstaduais > 0) {
                html += `<div class="panel-benefit estadual">
                    <div class="panel-benefit-title">📜 ${resumo.programasEstaduais} programa(s) estadual(is)</div>
                    <div class="panel-benefit-desc">Consulte a SEFAZ de ${id.nome} para elegibilidade</div>
                </div>`;
            }

            html += '</div>';
        }

        // Cenários comparativos
        if (ficha.cenariosComparativos) {
            html += `<div class="panel-section">
                <div class="panel-section-title">📊 Cenários em ${id.nome}</div>`;
            for (const [faixa, dados] of Object.entries(ficha.cenariosComparativos)) {
                html += `<div class="panel-cenario">
                    <div class="panel-cenario-faixa">${faixa}</div>
                    <div class="panel-cenario-dados">
                        <span>Serviço: <strong>${dados.servico.melhor}</strong> (${formatPct(dados.servico.aliqEfetiva)})</span>
                        <span>Comércio: <strong>${dados.comercio.melhor}</strong> (${formatPct(dados.comercio.aliqEfetiva)})</span>
                    </div>
                </div>`;
            }
            html += '</div>';
        }

        // Fonte
        html += `<div class="panel-fonte">
            Fonte: ${id.fonte === 'estados.js' ? '✅ Dados reais' : '⚠️ Estimativa'}
            ${id.completude !== 'N/D' ? ` | ${id.completude}` : ''}
        </div>`;

        panel.innerHTML = html;
        panel.style.display = 'block';
    }

    /**
     * Fallback: painel com dados locais quando ComparadorRegimes não está disponível
     */
    function _renderPainelFallback(panel, uf) {
        const estado = ES[uf];
        const municipios = (estado.municipios || []).slice().sort((a, b) => a.iss - b.iss).slice(0, 5);

        let html = `
            <div class="panel-title">📍 ${estado.nome} (${uf})</div>
            <div class="panel-row"><span>ICMS padrão</span><span class="panel-row-value">${(estado.icms.padrao * 100).toFixed(0)}%</span></div>
            <div class="panel-row"><span>ICMS cesta básica</span><span class="panel-row-value">${(estado.icms.cesta_basica * 100).toFixed(0)}%</span></div>
            <div class="panel-row"><span>Sublimite Simples</span><span class="panel-row-value">${formatBRLShort(estado.sublimite_simples)}</span></div>
        `;

        const beneficios = estado.beneficios || {};
        if (beneficios.tem_sudam) {
            html += `<div class="panel-benefit sudam" style="margin-top:12px;">
                <div class="panel-benefit-title">✅ SUDAM ativo</div>
                <div class="panel-benefit-desc">75% desconto no IRPJ para Presumido e Real</div>
            </div>`;
        }
        if (beneficios.tem_sudene) {
            html += `<div class="panel-benefit sudene">
                <div class="panel-benefit-title">✅ SUDENE ativo</div>
                <div class="panel-benefit-desc">Incentivos fiscais para a região Nordeste</div>
            </div>`;
        }
        if (beneficios.zona_franca) {
            html += `<div class="panel-benefit zf">
                <div class="panel-benefit-title">✅ Zona Franca</div>
                <div class="panel-benefit-desc">Isenção de IPI e redução de ICMS</div>
            </div>`;
        }
        if (beneficios.dica_economia) {
            html += `<div class="panel-dica">💡 ${beneficios.dica_economia}</div>`;
        }
        if (municipios.length > 0) {
            html += `<div class="panel-muni-title">Municípios com menor ISS:</div>`;
            municipios.forEach(m => {
                html += `<div class="panel-muni-row">
                    <span>${m.nome}</span>
                    <span class="panel-muni-iss">${m.iss.toFixed(1).replace('.', ',')}%</span>
                </div>`;
            });
        }

        html += `<div class="panel-fonte">⚠️ Dados estimados — carregue comparador-regimes.js</div>`;

        panel.innerHTML = html;
        panel.style.display = 'block';
    }


    // ═══════════════════════════════════════════════════════════════
    //  AÇÕES GLOBAIS
    // ═══════════════════════════════════════════════════════════════

    window._consultorCopiar = function (codigo) {
        navigator.clipboard.writeText(codigo).then(() => {
            const toast = document.createElement('div');
            toast.textContent = '✅ ' + codigo + ' copiado!';
            toast.style.cssText = 'position:fixed;bottom:20px;right:20px;background:var(--green);color:#fff;padding:10px 20px;border-radius:8px;font-weight:600;font-size:0.88rem;z-index:9999;animation:fadeIn 0.3s ease;box-shadow:0 4px 12px rgba(0,0,0,.15);';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);
        });
    };

    window._consultorNavAnalise = function (codigo, categoria) {
        const uf = $('selectEstado').value;
        const fat = parseMoney($('inputFaturamento'));
        const folha = parseMoney($('inputFolha'));

        localStorage.setItem('impost_prefill', JSON.stringify({
            cnae: codigo, categoria, uf, faturamento: fat, folha,
        }));

        window.location.href = 'analise.html';
    };


    // ═══════════════════════════════════════════════════════════════
    //  EXECUTAR BUSCA
    // ═══════════════════════════════════════════════════════════════

    function executarBusca() {
        const texto = $('inputBusca').value.trim();
        const uf = $('selectEstado').value;
        const faturamento = parseMoney($('inputFaturamento'));

        if (!texto) {
            $('inputBusca').focus();
            return;
        }
        if (faturamento <= 0) {
            $('inputFaturamento').focus();
            $('inputFaturamento').style.borderColor = 'var(--red)';
            $('inputFaturamento').style.boxShadow = '0 0 0 3px rgba(244,67,54,0.15)';
            setTimeout(() => {
                $('inputFaturamento').style.borderColor = '';
                $('inputFaturamento').style.boxShadow = '';
            }, 2000);
            return;
        }

        let folha = parseMoney($('inputFolha'));
        if (folha <= 0) {
            folha = faturamento * 0.30;
        }

        // Show loading
        $('resultsArea').innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;gap:16px;padding:60px 20px;">
                <div class="spinner"></div>
                <div style="color:var(--text-muted);font-size:0.92rem;">Analisando ${CNAE ? CNAE.length.toLocaleString() : '7.800'} CNAEs com dados reais de ${uf}...</div>
            </div>
        `;
        $('resultsArea').style.display = 'block';

        setTimeout(() => {
            const resultados = buscar(texto);
            renderResultados(resultados, texto, uf, faturamento, folha);
            renderPainelEstado(uf);
        }, 350);
    }


    // ═══════════════════════════════════════════════════════════════
    //  POPULAR ESTADOS
    // ═══════════════════════════════════════════════════════════════

    function popularEstados() {
        const sel = $('selectEstado');

        // v3: Se ComparadorRegimes disponível, usar seus dados de estado
        if (_usandoComparador && CR && CR.INCENTIVOS_REGIONAIS) {
            const estados = Object.entries(CR.INCENTIVOS_REGIONAIS)
                .map(([sigla, e]) => ({ sigla, nome: e.nome || sigla }))
                .sort((a, b) => a.nome.localeCompare(b.nome));

            estados.forEach(e => {
                const opt = document.createElement('option');
                opt.value = e.sigla;
                opt.textContent = `${e.nome} (${e.sigla})`;
                if (e.sigla === 'PA') opt.selected = true;
                sel.appendChild(opt);
            });
            return;
        }

        // Fallback: usar ES local
        if (!ES || Object.keys(ES).length === 0) return;
        const estados = Object.entries(ES)
            .map(([sigla, e]) => ({ sigla, nome: e.nome }))
            .sort((a, b) => a.nome.localeCompare(b.nome));

        estados.forEach(e => {
            const opt = document.createElement('option');
            opt.value = e.sigla;
            opt.textContent = `${e.nome} (${e.sigla})`;
            if (e.sigla === 'PA') opt.selected = true;
            sel.appendChild(opt);
        });
    }


    // ═══════════════════════════════════════════════════════════════
    //  EVENT BINDINGS
    // ═══════════════════════════════════════════════════════════════

    function bindEventos() {
        $('btnBuscar').addEventListener('click', executarBusca);

        $('inputBusca').addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                executarBusca();
            }
        });

        $$('[data-type="money"]').forEach(el => {
            el.addEventListener('input', () => aplicarMascaraMoney(el));
            el.addEventListener('blur', () => aplicarMascaraMoney(el));
        });

        $$('.sugestao-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                $('inputBusca').value = tag.dataset.busca;
                $('inputBusca').focus();
            });
        });

        $('selectEstado').addEventListener('change', () => {
            renderPainelEstado($('selectEstado').value);
            // v3: Limpar cache de busca quando muda estado (resultados mudam)
            searchCache.clear();
        });

        const btnDetalhes = $('btnMaisDetalhes');
        if (btnDetalhes) {
            btnDetalhes.addEventListener('click', () => {
                const extra = $('detalhesExtra');
                const isOpen = extra.style.display !== 'none';
                extra.style.display = isOpen ? 'none' : 'block';
                btnDetalhes.textContent = isOpen ? '+ Mais detalhes' : '− Menos detalhes';
            });
        }

        document.addEventListener('keydown', e => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                executarBusca();
            }
        });
    }


    // ═══════════════════════════════════════════════════════════════
    //  INICIALIZAÇÃO — v3 COM DETECÇÃO DO COMPARADOR-REGIMES
    // ═══════════════════════════════════════════════════════════════

    /**
     * Constrói dicionário de compatibilidade ES a partir do Estados API (fallback).
     * Usado apenas quando ComparadorRegimes NÃO está disponível.
     */
    function buildEstadosCompat() {
        const API = window.Estados || window.EstadosBR;
        if (!API) {
            console.warn('[Consultor CNAE v3] window.Estados não encontrado — tentando ESTADOS legado');
            return (typeof ESTADOS !== 'undefined') ? ESTADOS : (window.ESTADOS || {});
        }

        const compat = {};
        const siglas = API.listarSiglas ? API.listarSiglas() : Object.keys(API.UF_REGISTRY || {});

        siglas.forEach(sigla => {
            const dados = API.getEstado(sigla);
            const reg = API.UF_REGISTRY ? API.UF_REGISTRY[sigla] : null;
            if (!dados && !reg) return;

            const nome = (reg && reg.nome)
                || (dados && dados.dados_gerais && dados.dados_gerais.nome)
                || sigla;

            let icmsPadrao = 0.18;
            let icmsCesta = 0.07;
            if (dados && dados.icms) {
                const icms = dados.icms;
                if (typeof icms.aliquota_padrao === 'number') icmsPadrao = icms.aliquota_padrao;
                else if (typeof icms.aliquota_interna_padrao === 'number') icmsPadrao = icms.aliquota_interna_padrao;
                else if (typeof icms.aliquota_interna === 'number') icmsPadrao = icms.aliquota_interna;
                else if (typeof icms.aliquota_geral === 'number') icmsPadrao = icms.aliquota_geral;
                else if (icms.aliquotas_internas && icms.aliquotas_internas.geral) {
                    const g = icms.aliquotas_internas.geral;
                    icmsPadrao = typeof g === 'number' ? g : (g.aliquota || 0.18);
                }
                if (typeof icms.aliquota_cesta_basica === 'number') icmsCesta = icms.aliquota_cesta_basica;
                else if (icms.aliquotas_diferenciadas) {
                    const dif = icms.aliquotas_diferenciadas;
                    const cestaKey = Object.keys(dif).find(k =>
                        k.toLowerCase().includes('cesta') || k.toLowerCase().includes('basica') || k.toLowerCase().includes('alimentos')
                    );
                    if (cestaKey) {
                        const v = dif[cestaKey];
                        icmsCesta = typeof v === 'number' ? v : (v && v.aliquota ? v.aliquota : 0.07);
                    }
                }
                else if (icms.aliquotas_internas) {
                    const cestaKey = Object.keys(icms.aliquotas_internas).find(k =>
                        k.toLowerCase().includes('cesta') || k.toLowerCase().includes('basica')
                    );
                    if (cestaKey) {
                        const v = icms.aliquotas_internas[cestaKey];
                        icmsCesta = typeof v === 'number' ? v : (v && v.aliquota ? v.aliquota : 0.07);
                    }
                }
            }
            if (API._helpers && API._helpers.extrairICMSPadrao && dados && dados.icms) {
                const extracted = API._helpers.extrairICMSPadrao(dados.icms);
                if (typeof extracted === 'number') icmsPadrao = extracted;
            }

            let sublimite = 3600000;
            if (dados && dados.simples_nacional) {
                const sn = dados.simples_nacional;
                if (typeof sn.sublimite_estadual === 'number') sublimite = sn.sublimite_estadual;
                else if (sn.limites && typeof sn.limites.epp === 'number') sublimite = sn.limites.epp;
            }

            const beneficios = { tem_sudam: false, tem_sudene: false, zona_franca: false, dica_economia: '' };
            if (dados && dados.incentivos) {
                const inc = dados.incentivos;
                beneficios.tem_sudam = !!(inc.sudam && (inc.sudam.ativo === true || inc.sudam.existe === true));
                beneficios.tem_sudene = !!(inc.sudene && (inc.sudene.ativo === true || inc.sudene.existe === true));
                beneficios.zona_franca = !!(inc.zona_franca && (inc.zona_franca.ativo === true || inc.zona_franca.existe === true));
                if (inc.dica_economia) beneficios.dica_economia = inc.dica_economia;
                else if (inc.observacoes) beneficios.dica_economia = inc.observacoes;
            }
            if (dados && dados.dados_gerais) {
                const dg = dados.dados_gerais;
                if (!beneficios.tem_sudam && dg.sudam && (dg.sudam.ativo || dg.sudam === true)) beneficios.tem_sudam = true;
                if (!beneficios.tem_sudene && dg.sudene && (dg.sudene.ativo || dg.sudene === true)) beneficios.tem_sudene = true;
                if (!beneficios.zona_franca && dg.zona_franca && (dg.zona_franca.ativo || dg.zona_franca === true)) beneficios.zona_franca = true;
            }

            let municipios = [];
            if (dados && dados.iss) {
                const iss = dados.iss;
                if (Array.isArray(iss.municipios)) {
                    municipios = iss.municipios;
                } else if (iss.por_municipio && typeof iss.por_municipio === 'object') {
                    municipios = Object.entries(iss.por_municipio).map(([nome, info]) => ({
                        nome,
                        iss: typeof info === 'number' ? info * 100 : (info.aliquota ? info.aliquota * 100 : 5)
                    }));
                }
            }

            compat[sigla] = {
                nome,
                icms: { padrao: icmsPadrao, cesta_basica: icmsCesta },
                sublimite_simples: sublimite,
                beneficios,
                municipios,
                _dados: dados,
            };
        });

        console.log(`[Consultor CNAE v3] ${Object.keys(compat).length} estados carregados via Estados API (fallback)`);
        return compat;
    }


    function init() {
        // ── v3: Detectar ComparadorRegimes PRIMEIRO ──
        CR = window.ComparadorRegimes || window.CR || null;
        if (CR && CR.compararParaCNAE && CR.extrairDadosEstado) {
            _usandoComparador = true;
            console.log(`%c🔗 Consultor CNAE v3.0 ↔ ComparadorRegimes v${CR.VERSAO || '?'} INTEGRADO`, 'color: #2ECC40; font-size: 14px; font-weight: bold;');
        } else {
            _usandoComparador = false;
            console.warn('[Consultor CNAE v3] ⚠️ ComparadorRegimes NÃO encontrado — usando cálculos de fallback');
        }

        // Módulos auxiliares (fallback)
        IF = window.ImpostosFederais;
        CM = window.CnaeMapeamento;
        ES = buildEstadosCompat();

        if (!window.BANCO_CNAE) {
            window.addEventListener('cnae-loaded', init);
            return;
        }
        CNAE = window.BANCO_CNAE;

        console.log(`%c🔍 IMPOST. Consultor CNAE v${VERSAO}`, 'color: #3D9970; font-size: 16px; font-weight: bold;');
        console.log(`📊 ${CNAE.length} CNAEs carregados | Motor: ${_usandoComparador ? 'ComparadorRegimes v3 (dados reais)' : 'Fallback local (estimativas)'}`);

        const loading = $('loadingOverlay');
        if (loading) loading.style.display = 'none';
        const main = $('mainContent');
        if (main) main.style.display = 'block';

        buildIndex();
        popularEstados();
        renderPainelEstado('PA');
        bindEventos();

        setTimeout(() => {
            $('inputBusca').focus();
        }, 100);
    }

    document.addEventListener('DOMContentLoaded', init);

})();
