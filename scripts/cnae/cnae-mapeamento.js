/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CNAE-MAPEAMENTO.JS — Motor de Classificação Tributária de CNAEs
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Este arquivo é a PONTE entre o banco genérico de CNAEs (cnae.js) e o motor
 * de cálculo tributário (analise.js). O cnae.js contém ~7.800 atividades com
 * apenas código + descrição + categoria. Este arquivo adiciona a inteligência
 * tributária: Anexo do Simples, Fator R, Presunções do Lucro Presumido,
 * vedações e regras especiais.
 *
 * HIERARQUIA DE RESOLUÇÃO (prioridade decrescente):
 *   1° → MAPEAMENTO ESPECÍFICO (código exato do CNAE)
 *   2° → REGRAS POR PREFIXO (divisão/grupo/classe CNAE)
 *   3° → FALLBACK POR CATEGORIA (Comércio/Indústria/Serviço)
 *
 * FONTES:
 *   • LC 123/2006 — Anexos I a V do Simples Nacional
 *   • Resolução CGSN 140/2018 — Enquadramento de atividades
 *   • Lei 9.249/1995 — Presunções do Lucro Presumido
 *   • Lei 9.718/1998 — PIS/COFINS cumulativo
 *   • IBGE — Tabela CNAE 2.3
 *
 * Compatível: Browser (script tag) + Node.js (CommonJS)
 * Versão: 1.0.0
 * Data: 08/02/2026
 * Projeto: IMPOST. — Inteligência em Modelagem de Otimização Tributária
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else {
        root.CnaeMapeamento = factory();
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {

    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // 1. MAPEAMENTO ESPECÍFICO — CNAEs com regras tributárias conhecidas
    // ═══════════════════════════════════════════════════════════════════════════
    //
    // Cada entrada define:
    //   anexo          → Anexo do Simples Nacional (I, II, III, IV, V)
    //   fatorR         → Se a atividade está sujeita ao Fator R (Anexo V↔III)
    //   presuncaoIRPJ  → % de presunção para base do IRPJ no Lucro Presumido
    //   presuncaoCSLL  → % de presunção para base da CSLL no Lucro Presumido
    //   vedado         → Se vedado ao Simples Nacional
    //   motivoVedacao  → Texto explicando a vedação (se aplicável)
    //   obs            → Observação especial (opcional)
    // ═══════════════════════════════════════════════════════════════════════════

    const MAPEAMENTO_ESPECIFICO = {

        // ─────────────────────────────────────────
        //  COMÉRCIO — ANEXO I
        // ─────────────────────────────────────────

        // Supermercados e Alimentação
        "4711-3/01": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4711-3/02": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4712-1/00": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4721-1/02": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4721-1/04": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4729-6/01": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4729-6/99": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },

        // Bebidas
        "4723-7/00": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },

        // Materiais de Construção
        "4744-0/01": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4744-0/02": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4744-0/03": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4744-0/04": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4744-0/05": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4744-0/99": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },

        // Eletrodomésticos e Eletrônicos
        "4753-9/00": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4751-2/01": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4754-7/01": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },

        // Farmácia (sem manipulação = comércio)
        "4771-7/01": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12, obs: "Monofásico: PIS/COFINS zerados sobre medicamentos" },
        "4771-7/02": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4771-7/03": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },

        // Vestuário
        "4781-4/00": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4782-2/01": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },

        // Veículos e Peças
        "4511-1/01": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4511-1/02": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4512-9/01": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4512-9/02": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4530-7/01": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4530-7/02": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4530-7/03": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12, obs: "Monofásico: autopeças podem ter PIS/COFINS zerados" },
        "4530-7/04": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4530-7/05": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4530-7/06": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4541-2/01": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4541-2/02": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4542-1/01": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4542-1/02": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4543-9/00": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },

        // ★ COMBUSTÍVEIS — Presunção especial 1,6%
        "4731-8/00": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.016, presuncaoCSLL: 0.12, obs: "Revenda de combustíveis: presunção IRPJ reduzida (1,6%). Monofásico." },
        "4732-6/00": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.016, presuncaoCSLL: 0.12, obs: "Lubrificantes: presunção IRPJ 1,6%" },

        // Cosméticos
        "4772-5/00": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12, obs: "Monofásico: cosméticos/perfumaria com PIS/COFINS zerados" },

        // GLP/Gás
        "4784-9/00": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.016, presuncaoCSLL: 0.12, obs: "Revenda GLP: presunção 1,6%" },

        // Livraria e Papelaria
        "4761-0/01": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4761-0/02": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4761-0/03": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },

        // Agropecuária (comércio)
        "4771-7/04": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4789-0/01": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4789-0/02": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4789-0/04": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4789-0/05": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4789-0/07": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4789-0/08": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4789-0/09": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4789-0/99": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },

        // Atacado
        "4691-5/00": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4693-1/00": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },

        // E-commerce
        "4713-0/01": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4713-0/02": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4713-0/04": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4713-0/05": { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },


        // ─────────────────────────────────────────
        //  INDÚSTRIA — ANEXO II
        // ─────────────────────────────────────────

        // Panificação e Alimentos
        "1091-1/01": { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "1091-1/02": { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "1092-9/00": { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "1093-7/01": { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "1099-6/99": { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },

        // Confecção e Têxtil
        "1411-8/01": { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "1411-8/02": { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "1412-6/01": { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "1412-6/02": { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "1412-6/03": { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },

        // Metalurgia e Serralheria
        "2539-0/01": { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "2511-0/00": { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "2512-8/00": { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "2542-0/00": { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "2543-8/00": { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "2599-3/99": { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },

        // Madeira e Móveis
        "1610-2/01": { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "1610-2/02": { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "1621-8/00": { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "1622-6/01": { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "1622-6/02": { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "1629-3/01": { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "1629-3/02": { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "3101-2/00": { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "3102-1/00": { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "3103-9/00": { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "3104-7/00": { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },

        // Gráfica
        "1811-3/01": { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "1812-1/00": { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "1813-0/01": { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },

        // Construção pré-fabricada
        "2330-3/01": { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "2330-3/02": { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "2330-3/03": { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "2330-3/04": { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "2330-3/05": { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "2330-3/99": { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },


        // ─────────────────────────────────────────
        //  SERVIÇOS — ANEXO III (sem Fator R)
        // ─────────────────────────────────────────

        // Manutenção e Reparação
        "4520-0/01": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, obs: "Oficina mecânica" },
        "4520-0/02": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4520-0/03": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4520-0/04": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4520-0/05": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4520-0/06": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4520-0/07": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4520-0/08": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },

        // Instalações elétricas, hidráulicas
        "4321-5/00": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4322-3/01": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4322-3/02": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4322-3/03": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4329-1/01": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4329-1/02": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4329-1/03": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4329-1/04": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4329-1/05": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4329-1/99": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },

        // Reparação de equipamentos
        "9511-8/00": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "9512-6/00": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "9521-5/00": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "9529-1/01": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "9529-1/02": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "9529-1/03": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "9529-1/04": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "9529-1/05": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "9529-1/99": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },

        // Contabilidade
        "6920-6/01": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "6920-6/02": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },

        // Educação (Anexo III sem Fator R)
        "8511-2/00": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "8512-1/00": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "8513-9/00": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "8520-1/00": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "8531-7/00": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "8532-5/00": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "8533-3/00": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "8541-4/00": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "8542-2/00": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "8550-3/01": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "8550-3/02": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "8591-1/00": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "8592-9/01": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "8592-9/02": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "8592-9/03": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "8592-9/99": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "8593-7/00": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "8599-6/01": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "8599-6/02": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "8599-6/03": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "8599-6/04": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "8599-6/05": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "8599-6/99": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },

        // ★ Transporte de cargas — Presunção 8% (equiparado a comércio)
        "4930-2/01": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12, obs: "Transporte rodoviário de cargas: presunção IRPJ 8% (Lei 9.249/95)" },
        "4930-2/02": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4930-2/03": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "4930-2/04": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },

        // ★ Transporte de passageiros — Presunção 16%
        "4921-3/01": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.16, presuncaoCSLL: 0.12, obs: "Transporte municipal de passageiros: presunção IRPJ 16%" },
        "4921-3/02": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.16, presuncaoCSLL: 0.12 },
        "4922-1/01": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.16, presuncaoCSLL: 0.12 },
        "4922-1/02": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.16, presuncaoCSLL: 0.12 },
        "4922-1/03": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.16, presuncaoCSLL: 0.12 },
        "4923-0/01": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.16, presuncaoCSLL: 0.12 },
        "4923-0/02": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.16, presuncaoCSLL: 0.12 },
        "4924-8/00": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.16, presuncaoCSLL: 0.12 },
        "4929-9/01": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.16, presuncaoCSLL: 0.12 },
        "4929-9/02": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.16, presuncaoCSLL: 0.12 },
        "4929-9/03": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.16, presuncaoCSLL: 0.12 },
        "4929-9/04": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.16, presuncaoCSLL: 0.12 },
        "4929-9/99": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.16, presuncaoCSLL: 0.12 },

        // Alojamento e Alimentação (como serviço)
        "5510-8/01": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "5510-8/02": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "5590-6/01": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "5590-6/02": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "5590-6/03": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "5611-2/01": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "5611-2/02": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "5611-2/03": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "5612-1/00": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },

        // Agências de viagem / Turismo
        "7911-2/00": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "7912-1/00": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },

        // Academias / Esporte
        "9311-5/00": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "9312-3/00": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "9313-1/00": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "9319-1/01": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "9319-1/99": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },

        // Serviços pessoais
        "9601-7/01": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "9601-7/02": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "9602-5/01": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "9602-5/02": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "9603-3/01": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "9603-3/02": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "9603-3/03": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "9603-3/04": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "9603-3/05": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "9609-2/02": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "9609-2/04": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "9609-2/05": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "9609-2/06": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "9609-2/07": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "9609-2/08": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "9609-2/99": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },

        // Imobiliário
        "6810-2/01": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12, obs: "Atividade imobiliária (compra/venda): presunção IRPJ 8%" },
        "6810-2/02": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, obs: "Aluguel de imóveis próprios: presunção 32%" },
        "6810-2/03": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },

        // Locação de veículos / equipamentos
        "7711-0/00": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, obs: "Locação de bens móveis: presunção 32%" },
        "7719-5/01": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "7719-5/02": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "7719-5/99": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },

        // Correios / Entregas
        "5310-5/01": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "5310-5/02": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "5320-2/01": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "5320-2/02": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },

        // Corretagem de seguros (permitido no Simples)
        "6622-3/00": { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },


        // ─────────────────────────────────────────
        //  SERVIÇOS — FATOR R (Anexo V ↔ III)
        //  Se folha/faturamento >= 28% → Anexo III
        //  Se folha/faturamento < 28%  → Anexo V
        // ─────────────────────────────────────────

        // TI e Software
        "6201-5/01": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "6201-5/02": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "6202-3/00": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "6203-1/00": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "6204-0/00": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "6209-1/00": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "6311-9/00": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "6319-4/00": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },

        // Engenharia e Arquitetura
        "7111-1/00": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "7112-0/00": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "7119-7/01": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "7119-7/02": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "7119-7/03": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "7119-7/04": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "7119-7/99": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },

        // ★ Georeferenciamento e Consultoria Ambiental (AGROGEO BRASIL)
        "7120-1/00": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, obs: "Testes, análises técnicas, cartografia, georeferenciamento" },
        "7490-1/04": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, obs: "Atividades de gerenciamento ambiental" },

        // Consultoria empresarial / gestão
        "7020-4/00": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },

        // P&D
        "7210-0/00": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "7220-7/00": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },

        // Publicidade e Marketing
        "7311-4/00": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "7312-2/00": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "7319-0/01": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "7319-0/02": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "7319-0/03": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "7319-0/04": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "7319-0/99": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },

        // Pesquisa de mercado e opinião
        "7320-3/00": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },

        // Design, Fotografia, Tradução
        "7410-2/01": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "7410-2/02": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "7410-2/03": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "7410-2/99": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "7420-0/01": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "7420-0/02": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "7420-0/03": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "7420-0/04": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "7490-1/01": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "7490-1/02": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "7490-1/03": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "7490-1/05": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "7490-1/99": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },

        // Veterinária
        "7500-1/00": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },

        // Auditoria e Perícia
        "6920-6/02": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, obs: "Auditoria e consultoria contábil — Fator R" },
        "6910-8/00": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },

        // Jornalismo
        "6391-7/00": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "6399-2/00": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },

        // ★ SAÚDE — Fator R + Presunção especial 8%/12%
        //   Serviços hospitalares e equiparados: presunção IRPJ 8%, CSLL 12%
        //   (Lei 11.727/2008 + Lei 9.249/1995 §1° do art. 15)
        "8610-1/01": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12, obs: "Hospital geral: presunção hospitalar 8%" },
        "8610-1/02": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "8621-6/01": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "8621-6/02": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "8622-4/00": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "8630-5/01": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "8630-5/02": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "8630-5/03": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12, obs: "Consulta médica ambulatorial" },
        "8630-5/04": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12, obs: "Odontologia" },
        "8630-5/06": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12, obs: "Vacinação e imunização" },
        "8630-5/07": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "8630-5/99": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "8640-2/01": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "8640-2/02": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "8640-2/03": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "8640-2/04": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "8640-2/05": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "8640-2/06": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "8640-2/07": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "8640-2/08": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "8640-2/09": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "8640-2/10": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "8640-2/11": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "8640-2/12": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "8640-2/13": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "8640-2/14": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "8640-2/99": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "8650-0/01": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12, obs: "Psicologia" },
        "8650-0/02": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12, obs: "Fonoaudiologia" },
        "8650-0/03": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12, obs: "Terapia ocupacional" },
        "8650-0/04": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12, obs: "Fisioterapia" },
        "8650-0/05": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12, obs: "Quiropraxia" },
        "8650-0/06": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12, obs: "Nutrição" },
        "8650-0/07": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12, obs: "Optometria" },
        "8650-0/99": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "8660-7/00": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "8690-9/01": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "8690-9/02": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "8690-9/03": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "8690-9/99": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },

        // Artes / Produção cultural (Fator R)
        "9001-9/01": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "9001-9/02": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "9001-9/03": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "9001-9/99": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "9002-7/01": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "9002-7/02": { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },


        // ─────────────────────────────────────────
        //  SERVIÇOS — ANEXO IV (CPP fora do DAS)
        //  INSS Patronal NÃO está incluído no DAS
        //  Pago via GPS separada: 20% + RAT + Terceiros
        // ─────────────────────────────────────────

        // Construção Civil
        "4110-7/00": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12, obs: "Incorporação imobiliária: presunção 8%" },
        "4120-4/00": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, obs: "Construção de edifícios — Anexo IV, CPP fora do DAS" },
        "4211-1/01": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4211-1/02": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4212-0/00": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4213-8/00": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4221-9/01": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4221-9/02": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4221-9/03": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4221-9/04": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4221-9/05": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4222-7/01": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4223-5/00": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4291-0/00": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4292-8/01": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4292-8/02": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4299-5/01": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4299-5/99": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4311-8/01": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4311-8/02": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4312-6/00": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4313-4/00": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4319-3/00": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4330-4/01": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4330-4/02": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4330-4/03": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4330-4/04": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4330-4/05": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4330-4/99": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4391-6/00": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4399-1/01": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4399-1/02": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4399-1/03": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4399-1/04": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4399-1/05": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "4399-1/99": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },

        // ★ Construção com materiais: presunção IRPJ 8%
        "4120-4/00_empreitada": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12, obs: "Empreitada com materiais: presunção 8%" },

        // Advocacia
        "6911-7/01": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, obs: "Advocacia — Anexo IV, CPP fora do DAS" },
        "6911-7/02": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "6911-7/03": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },

        // Vigilância e Segurança
        "8011-1/01": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, obs: "Vigilância e segurança — Anexo IV" },
        "8012-9/00": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "8020-0/01": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "8020-0/02": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },

        // Limpeza e Conservação
        "8111-7/00": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "8112-5/00": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "8121-4/00": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, obs: "Limpeza — Anexo IV, CPP fora do DAS" },
        "8122-2/00": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
        "8129-0/00": { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },


        // ─────────────────────────────────────────
        //  VEDADOS AO SIMPLES NACIONAL
        // ─────────────────────────────────────────

        // Financeiras
        "6421-2/00": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, vedado: true, motivoVedacao: "Bancos comerciais — atividade financeira vedada (art. 3° §4° LC 123/2006)" },
        "6422-1/00": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, vedado: true, motivoVedacao: "Bancos múltiplos — atividade financeira vedada" },
        "6423-9/00": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, vedado: true, motivoVedacao: "Caixa econômica — vedado" },
        "6424-7/01": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, vedado: true, motivoVedacao: "Cooperativa de crédito — vedada ao Simples" },
        "6431-0/00": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, vedado: true, motivoVedacao: "Bancos múltiplos sem carteira comercial" },
        "6432-8/00": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, vedado: true, motivoVedacao: "Bancos de investimento" },
        "6433-6/00": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, vedado: true, motivoVedacao: "Bancos de desenvolvimento" },
        "6434-4/00": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, vedado: true, motivoVedacao: "Factoring (fomento mercantil)" },
        "6435-2/01": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, vedado: true, motivoVedacao: "Sociedade de crédito imobiliário" },
        "6435-2/02": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, vedado: true, motivoVedacao: "Associação de poupança e empréstimo" },
        "6435-2/03": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, vedado: true, motivoVedacao: "Companhia hipotecária" },
        "6436-1/00": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, vedado: true, motivoVedacao: "Sociedade de crédito, financiamento e investimento (financeira)" },
        "6437-9/00": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, vedado: true, motivoVedacao: "Sociedade de crédito ao microempreendedor" },
        "6438-7/01": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, vedado: true, motivoVedacao: "Banco de câmbio" },
        "6440-9/00": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, vedado: true, motivoVedacao: "Arrendamento mercantil" },
        "6450-6/00": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, vedado: true, motivoVedacao: "Sociedade de capitalização" },
        "6611-8/01": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, vedado: true, motivoVedacao: "Bolsas de valores" },
        "6611-8/02": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, vedado: true, motivoVedacao: "Bolsas de mercadorias e futuros" },
        "6612-6/01": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, vedado: true, motivoVedacao: "Corretora de títulos e valores mobiliários" },
        "6612-6/02": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, vedado: true, motivoVedacao: "Distribuidora de títulos e valores mobiliários" },
        "6612-6/03": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, vedado: true, motivoVedacao: "Corretora de câmbio" },
        "6612-6/04": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, vedado: true, motivoVedacao: "Corretora de contratos de mercadorias" },
        "6612-6/05": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, vedado: true, motivoVedacao: "Agente de investimentos" },
        "6613-4/00": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, vedado: true, motivoVedacao: "Administração de cartões de crédito" },

        // Seguros
        "6511-1/01": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, vedado: true, motivoVedacao: "Seguros de vida" },
        "6511-1/02": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, vedado: true, motivoVedacao: "Seguros não vida" },
        "6512-0/00": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, vedado: true, motivoVedacao: "Seguros saúde" },
        "6520-1/00": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, vedado: true, motivoVedacao: "Previdência complementar" },
        "6530-8/00": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, vedado: true, motivoVedacao: "Resseguros" },

        // Tabaco
        "1210-7/00": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12, vedado: true, motivoVedacao: "Processamento industrial do fumo" },
        "1220-4/01": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12, vedado: true, motivoVedacao: "Fabricação de cigarros" },
        "1220-4/02": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12, vedado: true, motivoVedacao: "Fabricação de cigarrilhas e charutos" },
        "1220-4/03": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12, vedado: true, motivoVedacao: "Fabricação de fumo de mascar e rapé" },
        "1220-4/99": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12, vedado: true, motivoVedacao: "Fabricação de outros produtos de fumo" },

        // Armas e Munições
        "2550-1/01": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12, vedado: true, motivoVedacao: "Fabricação de armas de fogo (exceto de uso militar)" },
        "2550-1/02": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12, vedado: true, motivoVedacao: "Fabricação de munição" },

        // Bebidas Alcoólicas (fabricação)
        "1111-9/01": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12, vedado: true, motivoVedacao: "Fabricação de aguardente de cana" },
        "1111-9/02": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12, vedado: true, motivoVedacao: "Fabricação de outras aguardentes e bebidas destiladas" },
        "1112-7/00": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12, vedado: true, motivoVedacao: "Fabricação de vinho" },
        "1113-5/01": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12, vedado: true, motivoVedacao: "Fabricação de malte" },
        "1113-5/02": { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12, vedado: true, motivoVedacao: "Fabricação de cerveja e chope" },
    };


    // ═══════════════════════════════════════════════════════════════════════════
    // 2. REGRAS POR PREFIXO — Padrões para classes inteiras de CNAE
    // ═══════════════════════════════════════════════════════════════════════════
    //
    // Quando o CNAE não está no mapeamento específico, usamos o prefixo (divisão
    // CNAE, 2 primeiros dígitos) para inferir as regras. A lista é verificada
    // do prefixo MAIS longo para o mais curto (mais específico primeiro).
    // ═══════════════════════════════════════════════════════════════════════════

    const REGRAS_POR_PREFIXO = [
        // ── Agropecuária / Extração (01-09) → Anexo II ou I ──
        { prefixo: "01",   regra: { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 }, desc: "Agricultura e pecuária" },
        { prefixo: "02",   regra: { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 }, desc: "Produção florestal" },
        { prefixo: "03",   regra: { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 }, desc: "Pesca e aquicultura" },
        { prefixo: "05",   regra: { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 }, desc: "Extração de carvão mineral" },
        { prefixo: "06",   regra: { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 }, desc: "Extração de petróleo e gás" },
        { prefixo: "07",   regra: { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 }, desc: "Extração de minerais metálicos" },
        { prefixo: "08",   regra: { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 }, desc: "Extração de minerais não metálicos" },
        { prefixo: "09",   regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Serviços de apoio à extração mineral" },

        // ── Indústria de Transformação (10-33) → Anexo II ──
        { prefixo: "10",   regra: { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 }, desc: "Fabricação de alimentos" },
        // 11 = bebidas (vedadas no específico para alcoólicas; não-alcoólicas = Anexo II)
        { prefixo: "1121", regra: { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 }, desc: "Fabricação de águas e refrigerantes" },
        { prefixo: "1122", regra: { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 }, desc: "Fabricação de chá e mate" },
        // 12 = fumo → vedado (já no específico)
        { prefixo: "13",   regra: { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 }, desc: "Fabricação têxtil" },
        { prefixo: "14",   regra: { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 }, desc: "Confecção de artigos do vestuário" },
        { prefixo: "15",   regra: { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 }, desc: "Couro, artigos para viagem e calçados" },
        { prefixo: "16",   regra: { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 }, desc: "Madeira" },
        { prefixo: "17",   regra: { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 }, desc: "Celulose e papel" },
        { prefixo: "18",   regra: { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 }, desc: "Impressão e reprodução" },
        { prefixo: "19",   regra: { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 }, desc: "Derivados de petróleo e biocombustíveis" },
        { prefixo: "20",   regra: { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 }, desc: "Químicos" },
        { prefixo: "21",   regra: { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 }, desc: "Farmacêuticos" },
        { prefixo: "22",   regra: { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 }, desc: "Borracha e plástico" },
        { prefixo: "23",   regra: { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 }, desc: "Minerais não metálicos" },
        { prefixo: "24",   regra: { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 }, desc: "Metalurgia" },
        { prefixo: "25",   regra: { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 }, desc: "Produtos de metal" },
        { prefixo: "26",   regra: { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 }, desc: "Informática e eletrônicos" },
        { prefixo: "27",   regra: { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 }, desc: "Máquinas e equipamentos elétricos" },
        { prefixo: "28",   regra: { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 }, desc: "Máquinas e equipamentos" },
        { prefixo: "29",   regra: { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 }, desc: "Veículos automotores" },
        { prefixo: "30",   regra: { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 }, desc: "Outros equipamentos de transporte" },
        { prefixo: "31",   regra: { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 }, desc: "Móveis" },
        { prefixo: "32",   regra: { anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 }, desc: "Fabricação de produtos diversos" },
        { prefixo: "33",   regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Manutenção e reparação de máquinas" },

        // ── Eletricidade / Água / Esgoto (35-39) ──
        { prefixo: "35",   regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Eletricidade e gás" },
        { prefixo: "36",   regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Captação e distribuição de água" },
        { prefixo: "37",   regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Esgoto e gestão de resíduos" },
        { prefixo: "38",   regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Coleta e reciclagem" },
        { prefixo: "39",   regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Descontaminação e recuperação ambiental" },

        // ── Construção (41-43) → Anexo IV ──
        { prefixo: "41",   regra: { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Construção de edifícios" },
        { prefixo: "42",   regra: { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Obras de infraestrutura" },
        { prefixo: "431",  regra: { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Demolição e preparação do terreno" },
        { prefixo: "432",  regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Instalações (elétrica, hidráulica) — Anexo III" },
        { prefixo: "433",  regra: { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Obras de acabamento" },
        { prefixo: "439",  regra: { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Outros serviços especializados para construção" },

        // ── Comércio (45-47) → Anexo I ──
        { prefixo: "45",   regra: { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 }, desc: "Comércio e reparação de veículos" },
        { prefixo: "46",   regra: { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 }, desc: "Comércio atacadista" },
        { prefixo: "47",   regra: { anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 }, desc: "Comércio varejista" },

        // ── Transporte (49-53) ──
        { prefixo: "491",  regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.16, presuncaoCSLL: 0.12 }, desc: "Transporte ferroviário" },
        { prefixo: "4921", regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.16, presuncaoCSLL: 0.12 }, desc: "Transporte rodoviário de passageiros (municipal)" },
        { prefixo: "4922", regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.16, presuncaoCSLL: 0.12 }, desc: "Transporte rodoviário de passageiros (intermunicipal)" },
        { prefixo: "4923", regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.16, presuncaoCSLL: 0.12 }, desc: "Transporte de passageiros (táxi/app)" },
        { prefixo: "4924", regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.16, presuncaoCSLL: 0.12 }, desc: "Transporte escolar" },
        { prefixo: "4929", regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.16, presuncaoCSLL: 0.12 }, desc: "Outros transportes de passageiros" },
        { prefixo: "4930", regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 }, desc: "Transporte rodoviário de cargas (presunção 8%)" },
        { prefixo: "50",   regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.16, presuncaoCSLL: 0.12 }, desc: "Transporte aquaviário" },
        { prefixo: "51",   regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.16, presuncaoCSLL: 0.12 }, desc: "Transporte aéreo" },
        { prefixo: "52",   regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Armazenamento e atividades auxiliares de transporte" },
        { prefixo: "53",   regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Correio e entregas" },

        // ── Alojamento e Alimentação (55-56) ──
        { prefixo: "55",   regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Alojamento (hotéis, pousadas)" },
        { prefixo: "56",   regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Alimentação (restaurantes, bares)" },

        // ── Informação e Comunicação (58-63) ──
        { prefixo: "58",   regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Edição e edição integrada à impressão" },
        { prefixo: "59",   regra: { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Cinema, som e vídeo" },
        { prefixo: "60",   regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Rádio e televisão" },
        { prefixo: "61",   regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Telecomunicações" },
        { prefixo: "62",   regra: { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "TI (software, consultoria)" },
        { prefixo: "63",   regra: { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Serviços de informação" },

        // ── Financeiras (64-66) → Maioria vedada ──
        { prefixo: "64",   regra: { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, vedado: true, motivoVedacao: "Atividade financeira — vedada ao Simples" }, desc: "Financeiras" },
        { prefixo: "65",   regra: { anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, vedado: true, motivoVedacao: "Seguros e previdência — vedados ao Simples" }, desc: "Seguros" },
        // 66 = auxiliares financeiros — nem todos vedados
        { prefixo: "6621", regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Avaliação de riscos e perdas" },
        { prefixo: "6622", regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Corretagem de seguros (permitido)" },
        { prefixo: "6629", regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Atividades auxiliares de seguros" },

        // ── Imobiliário (68) ──
        { prefixo: "68",   regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Atividades imobiliárias" },

        // ── Profissionais (69-75) ──
        { prefixo: "6911", regra: { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Advocacia — Anexo IV" },
        { prefixo: "6920", regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Contabilidade — Anexo III" },
        { prefixo: "70",   regra: { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Consultoria em gestão" },
        { prefixo: "71",   regra: { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Engenharia e arquitetura" },
        { prefixo: "72",   regra: { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Pesquisa e desenvolvimento" },
        { prefixo: "73",   regra: { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Publicidade e pesquisa de mercado" },
        { prefixo: "74",   regra: { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Atividades profissionais diversas" },
        { prefixo: "75",   regra: { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Veterinária" },

        // ── Administrativas (77-82) ──
        { prefixo: "77",   regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Locação de bens" },
        { prefixo: "78",   regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Agências de emprego" },
        { prefixo: "79",   regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Agências de viagem / turismo" },
        { prefixo: "80",   regra: { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Vigilância e segurança — Anexo IV" },
        { prefixo: "811",  regra: { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Administração de condomínios" },
        { prefixo: "812",  regra: { anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Limpeza — Anexo IV" },
        { prefixo: "82",   regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Serviços administrativos e complementares" },

        // ── Administração Pública (84) — geralmente não se aplica ──
        { prefixo: "84",   regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Administração pública" },

        // ── Educação (85) → Anexo III ──
        { prefixo: "85",   regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Educação" },

        // ── Saúde (86-88) ──
        { prefixo: "86",   regra: { anexo: "V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 }, desc: "Saúde (presunção hospitalar 8%)" },
        { prefixo: "87",   regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Residencial para cuidados" },
        { prefixo: "88",   regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Assistência social" },

        // ── Artes, Cultura, Esporte (90-93) ──
        { prefixo: "90",   regra: { anexo: "V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Atividades artísticas e culturais" },
        { prefixo: "91",   regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Bibliotecas, museus e patrimônio" },
        { prefixo: "92",   regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Jogos de azar e apostas" },
        { prefixo: "93",   regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Atividades esportivas e de recreação" },

        // ── Outras Atividades de Serviço (94-96) ──
        { prefixo: "94",   regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Organizações associativas" },
        { prefixo: "95",   regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Reparação de equipamentos" },
        { prefixo: "96",   regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Serviços pessoais" },

        // ── Serviços Domésticos / Organismos Internacionais (97-99) ──
        { prefixo: "97",   regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Serviços domésticos" },
        { prefixo: "99",   regra: { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 }, desc: "Organismos internacionais" },
    ];

    // Ordenar por prefixo mais longo primeiro (mais específico)
    REGRAS_POR_PREFIXO.sort((a, b) => b.prefixo.length - a.prefixo.length || a.prefixo.localeCompare(b.prefixo));


    // ═══════════════════════════════════════════════════════════════════════════
    // 3. FALLBACK POR CATEGORIA
    // ═══════════════════════════════════════════════════════════════════════════

    const FALLBACK_POR_CATEGORIA = {
        "Comércio":  { anexo: "I",   fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "Indústria": { anexo: "II",  fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
        "Serviço":   { anexo: "III", fatorR: true,  presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
    };

    // Fallback absoluto (se nada funcionar)
    const FALLBACK_PADRAO = { anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, vedado: false };


    // ═══════════════════════════════════════════════════════════════════════════
    // 4. FUNÇÃO PRINCIPAL — obterRegrasCNAE(codigo, categoria)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Retorna as regras tributárias completas para um CNAE.
     *
     * @param {string} codigo    — Código CNAE formatado (ex: "7112-0/00")
     * @param {string} categoria — Categoria do CNAE ("Comércio"|"Indústria"|"Serviço")
     * @returns {Object} Regras tributárias:
     *   {
     *     anexo: string,          // "I"|"II"|"III"|"IV"|"V"|"VEDADO"
     *     fatorR: boolean,        // true se sujeito ao Fator R
     *     presuncaoIRPJ: number,  // ex: 0.08, 0.16, 0.32
     *     presuncaoCSLL: number,  // ex: 0.12, 0.32
     *     vedado: boolean,        // true se vedado ao Simples Nacional
     *     motivoVedacao: string,  // razão da vedação (se vedado)
     *     obs: string,            // observação especial
     *     fonte: string,          // "especifico"|"prefixo"|"categoria"|"padrao"
     *   }
     */
    function obterRegrasCNAE(codigo, categoria) {
        // Normalizar código (remover espaços)
        const cod = (codigo || '').trim();

        // 1° — Busca no mapeamento específico
        if (MAPEAMENTO_ESPECIFICO[cod]) {
            const r = { ...MAPEAMENTO_ESPECIFICO[cod] };
            r.vedado = r.vedado || false;
            r.motivoVedacao = r.motivoVedacao || '';
            r.obs = r.obs || '';
            r.fonte = 'especifico';
            return r;
        }

        // 2° — Busca por prefixo (somente números)
        const numerico = cod.replace(/[-\/\s]/g, '');
        for (const { prefixo, regra } of REGRAS_POR_PREFIXO) {
            if (numerico.startsWith(prefixo)) {
                const r = { ...regra };
                r.vedado = r.vedado || false;
                r.motivoVedacao = r.motivoVedacao || '';
                r.obs = r.obs || '';
                r.fonte = 'prefixo';
                return r;
            }
        }

        // 3° — Fallback por categoria
        const cat = (categoria || '').trim();
        if (FALLBACK_POR_CATEGORIA[cat]) {
            const r = { ...FALLBACK_POR_CATEGORIA[cat] };
            r.vedado = false;
            r.motivoVedacao = '';
            r.obs = 'Regra estimada por categoria — consulte um contador para confirmação';
            r.fonte = 'categoria';
            return r;
        }

        // 4° — Fallback absoluto
        return {
            ...FALLBACK_PADRAO,
            obs: 'CNAE não mapeado — usando regra padrão. Consulte um contador.',
            fonte: 'padrao',
        };
    }


    // ═══════════════════════════════════════════════════════════════════════════
    // 5. FUNÇÕES AUXILIARES
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Verifica se um CNAE é vedado ao Simples Nacional.
     * @param {string} codigo — Código CNAE
     * @returns {boolean|string} false se permitido, ou string com motivo da vedação
     */
    function isVedado(codigo) {
        const regras = obterRegrasCNAE(codigo, '');
        return regras.vedado ? (regras.motivoVedacao || 'Atividade vedada ao Simples Nacional') : false;
    }

    /**
     * Retorna o Anexo efetivo considerando o Fator R.
     * @param {string} codigo    — Código CNAE
     * @param {string} categoria — Categoria
     * @param {number} fatorR    — Valor do Fator R (folha/faturamento), ex: 0.35
     * @returns {string} Anexo efetivo: "I"|"II"|"III"|"IV"|"V"|"VEDADO"
     */
    function obterAnexoEfetivo(codigo, categoria, fatorR) {
        const regras = obterRegrasCNAE(codigo, categoria);
        if (regras.vedado) return 'VEDADO';
        if (regras.fatorR) {
            return (fatorR >= 0.28) ? 'III' : 'V';
        }
        return regras.anexo;
    }

    /**
     * Retorna se a atividade é monofásica (PIS/COFINS zerados na revenda).
     * Baseado em CNAEs típicos — para precisão real, verificar pelo NCM do produto.
     * @param {string} codigo — Código CNAE
     * @returns {boolean|string} false ou descrição do grupo monofásico
     */
    function isMonofasico(codigo) {
        const MONOFASICOS = {
            "4731-8/00": "Combustíveis",
            "4732-6/00": "Lubrificantes",
            "4771-7/01": "Farmácia (medicamentos)",
            "4772-5/00": "Cosméticos e perfumaria",
            "4530-7/03": "Autopeças",
            "4530-7/05": "Autopeças (motocicletas)",
            "4511-1/01": "Veículos (automóveis)",
            "4511-1/02": "Veículos (caminhonetas)",
            "4512-9/01": "Veículos (caminhões)",
            "4541-2/01": "Motocicletas",
            "4784-9/00": "GLP e gás",
            "4723-7/00": "Bebidas (revenda)",
        };
        return MONOFASICOS[codigo] || false;
    }

    /**
     * Retorna estatísticas do mapeamento para debug/documentação.
     */
    function getEstatisticas() {
        const especificos = Object.keys(MAPEAMENTO_ESPECIFICO).length;
        const vedados = Object.values(MAPEAMENTO_ESPECIFICO).filter(r => r.vedado).length;
        const fatorR = Object.values(MAPEAMENTO_ESPECIFICO).filter(r => r.fatorR).length;
        const prefixos = REGRAS_POR_PREFIXO.length;

        return {
            cnae_especificos: especificos,
            cnae_vedados: vedados,
            cnae_fator_r: fatorR,
            regras_prefixo: prefixos,
            categorias_fallback: Object.keys(FALLBACK_POR_CATEGORIA).length,
        };
    }


    // ═══════════════════════════════════════════════════════════════════════════
    // 6. API PÚBLICA
    // ═══════════════════════════════════════════════════════════════════════════

    return {
        // Função principal
        obterRegrasCNAE,

        // Funções auxiliares
        isVedado,
        obterAnexoEfetivo,
        isMonofasico,
        getEstatisticas,

        // Dados brutos (para debug ou UI)
        MAPEAMENTO_ESPECIFICO,
        REGRAS_POR_PREFIXO,
        FALLBACK_POR_CATEGORIA,

        // Metadados
        VERSION: '1.0.0',
        DATA_ATUALIZACAO: '2026-02-08',
    };
});
