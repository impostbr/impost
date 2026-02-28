/**
 * ═══════════════════════════════════════════════════════════
 * IMPOST. — Dados Tributários 2026
 * Base de dados completa: CNAEs, Simples Nacional, Presunções,
 * Municípios, IRPF, ICMS-PA
 * ═══════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════
//  CNAEs CADASTRADOS
// ═══════════════════════════════════════════
const CNAES = [
    // ── COMÉRCIO (Anexo I) ──
    { codigo: "4711-3/02", descricao: "Minimercados / Supermercados", tipo: "Comércio", anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
    { codigo: "4712-1/00", descricao: "Comércio varejista (predominância alimentícia)", tipo: "Comércio", anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
    { codigo: "4721-1/02", descricao: "Padaria e confeitaria (revenda)", tipo: "Comércio", anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
    { codigo: "4721-1/04", descricao: "Comércio varejista de doces, balas e bombons", tipo: "Comércio", anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
    { codigo: "4723-7/00", descricao: "Comércio varejista de bebidas", tipo: "Comércio", anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
    { codigo: "4744-0/99", descricao: "Materiais de construção em geral", tipo: "Comércio", anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
    { codigo: "4753-9/00", descricao: "Eletrodomésticos e áudio/vídeo", tipo: "Comércio", anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
    { codigo: "4771-7/01", descricao: "Farmácia (sem manipulação)", tipo: "Comércio", anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
    { codigo: "4781-4/00", descricao: "Vestuário e acessórios", tipo: "Comércio", anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
    { codigo: "4530-7/03", descricao: "Peças e acessórios para veículos", tipo: "Comércio", anexo: "I", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
    { codigo: "4731-8/00", descricao: "Comércio de combustíveis", tipo: "Comércio", anexo: "I", fatorR: false, presuncaoIRPJ: 0.016, presuncaoCSLL: 0.12 },

    // ── INDÚSTRIA (Anexo II) ──
    { codigo: "1091-1/01", descricao: "Panificação industrial", tipo: "Indústria", anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
    { codigo: "1091-1/02", descricao: "Padaria e confeitaria (produção própria)", tipo: "Indústria", anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
    { codigo: "1412-6/01", descricao: "Confecção de vestuário", tipo: "Indústria", anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
    { codigo: "2539-0/01", descricao: "Usinagem, tornearia e solda", tipo: "Indústria", anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
    { codigo: "3101-2/00", descricao: "Fabricação de móveis (madeira)", tipo: "Indústria", anexo: "II", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },

    // ── SERVIÇOS - ANEXO III (Sem Fator R) ──
    { codigo: "4321-5/00", descricao: "Instalação e manutenção elétrica", tipo: "Serviço", anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
    { codigo: "4322-3/01", descricao: "Instalações hidráulicas e de gás", tipo: "Serviço", anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
    { codigo: "4520-0/01", descricao: "Reparação mecânica de veículos", tipo: "Serviço", anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
    { codigo: "9511-8/00", descricao: "Reparação de computadores", tipo: "Serviço", anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
    { codigo: "6920-6/01", descricao: "Atividades de contabilidade", tipo: "Serviço", anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
    { codigo: "8513-9/00", descricao: "Ensino fundamental", tipo: "Serviço", anexo: "III", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },

    // ── SERVIÇOS - FATOR R (Anexo III ou V) ──
    { codigo: "6201-5/01", descricao: "Desenvolvimento de software sob encomenda", tipo: "Serviço", anexo: "III/V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
    { codigo: "6204-0/00", descricao: "Consultoria em TI", tipo: "Serviço", anexo: "III/V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
    { codigo: "7111-1/00", descricao: "Serviços de arquitetura", tipo: "Serviço", anexo: "III/V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
    { codigo: "7112-0/00", descricao: "Serviços de engenharia", tipo: "Serviço", anexo: "III/V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
    { codigo: "7311-4/00", descricao: "Agências de publicidade", tipo: "Serviço", anexo: "III/V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
    { codigo: "7020-4/00", descricao: "Consultoria em gestão empresarial", tipo: "Serviço", anexo: "III/V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
    { codigo: "7500-1/00", descricao: "Atividades veterinárias", tipo: "Serviço", anexo: "III/V", fatorR: true, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
    { codigo: "8630-5/03", descricao: "Atividade médica ambulatorial", tipo: "Serviço", anexo: "III/V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
    { codigo: "8630-5/04", descricao: "Atividade odontológica", tipo: "Serviço", anexo: "III/V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
    { codigo: "8650-0/04", descricao: "Atividades de fisioterapia", tipo: "Serviço", anexo: "III/V", fatorR: true, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },

    // ── SERVIÇOS - ANEXO IV (CPP fora do DAS) ──
    { codigo: "4120-4/00", descricao: "Construção de edifícios", tipo: "Serviço", anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
    { codigo: "8121-4/00", descricao: "Limpeza em prédios e domicílios", tipo: "Serviço", anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
    { codigo: "6911-7/01", descricao: "Serviços advocatícios", tipo: "Serviço", anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
    { codigo: "8011-1/01", descricao: "Vigilância e segurança privada", tipo: "Serviço", anexo: "IV", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },

    // ── VEDADOS AO SIMPLES ──
    { codigo: "6421-2/00", descricao: "Bancos comerciais", tipo: "Serviço", anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, vedado: true, motivoVedacao: "Atividade financeira — Lucro Real obrigatório" },
    { codigo: "6613-4/00", descricao: "Administração de cartões de crédito", tipo: "Serviço", anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, vedado: true, motivoVedacao: "Atividade financeira — Lucro Real obrigatório" },
    { codigo: "1210-7/00", descricao: "Processamento industrial do fumo", tipo: "Indústria", anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12, vedado: true, motivoVedacao: "Produção de cigarros" },
    { codigo: "6434-4/00", descricao: "Factoring (fomento mercantil)", tipo: "Serviço", anexo: "VEDADO", fatorR: false, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32, vedado: true, motivoVedacao: "Atividade financeira" },
];


// ═══════════════════════════════════════════
//  SIMPLES NACIONAL — FAIXAS POR ANEXO
// ═══════════════════════════════════════════
// Cada faixa: [rbt12_min, rbt12_max, aliquota_nominal, parcela_deduzir]
const SIMPLES_FAIXAS = {
    I: [
        [0,        180000,    0.04,   0],
        [180000.01, 360000,   0.073,  5940],
        [360000.01, 720000,   0.095,  13860],
        [720000.01, 1800000,  0.107,  22500],
        [1800000.01, 3600000, 0.143,  87300],
        [3600000.01, 4800000, 0.19,   378000],
    ],
    II: [
        [0,        180000,    0.045,  0],
        [180000.01, 360000,   0.078,  5940],
        [360000.01, 720000,   0.10,   13860],
        [720000.01, 1800000,  0.112,  22500],
        [1800000.01, 3600000, 0.147,  85500],
        [3600000.01, 4800000, 0.30,   720000],
    ],
    III: [
        [0,        180000,    0.06,   0],
        [180000.01, 360000,   0.112,  9360],
        [360000.01, 720000,   0.135,  17640],
        [720000.01, 1800000,  0.16,   35640],
        [1800000.01, 3600000, 0.21,   125640],
        [3600000.01, 4800000, 0.33,   648000],
    ],
    IV: [
        [0,        180000,    0.045,  0],
        [180000.01, 360000,   0.09,   8100],
        [360000.01, 720000,   0.102,  12420],
        [720000.01, 1800000,  0.14,   39780],
        [1800000.01, 3600000, 0.22,   183780],
        [3600000.01, 4800000, 0.33,   828000],
    ],
    V: [
        [0,        180000,    0.155,  0],
        [180000.01, 360000,   0.18,   4500],
        [360000.01, 720000,   0.195,  9900],
        [720000.01, 1800000,  0.205,  17100],
        [1800000.01, 3600000, 0.23,   62100],
        [3600000.01, 4800000, 0.305,  540000],
    ],
};


// ═══════════════════════════════════════════
//  SIMPLES NACIONAL — REPARTIÇÃO DOS TRIBUTOS
// ═══════════════════════════════════════════
// Cada faixa: { irpj, csll, cofins, pis, cpp, icms, iss, ipi }
// Percentuais sobre o valor do DAS
const SIMPLES_REPARTICAO = {
    I: [
        { irpj: 0.0550, csll: 0.0350, cofins: 0.1274, pis: 0.0276, cpp: 0.4150, icms: 0.3400, iss: 0, ipi: 0 },
        { irpj: 0.0550, csll: 0.0350, cofins: 0.1274, pis: 0.0276, cpp: 0.4150, icms: 0.3400, iss: 0, ipi: 0 },
        { irpj: 0.0550, csll: 0.0350, cofins: 0.1274, pis: 0.0276, cpp: 0.4200, icms: 0.3350, iss: 0, ipi: 0 },
        { irpj: 0.0550, csll: 0.0350, cofins: 0.1274, pis: 0.0276, cpp: 0.4200, icms: 0.3350, iss: 0, ipi: 0 },
        { irpj: 0.0550, csll: 0.0350, cofins: 0.1274, pis: 0.0276, cpp: 0.4200, icms: 0.3350, iss: 0, ipi: 0 },
        { irpj: 0.1350, csll: 0.1000, cofins: 0.2827, pis: 0.0613, cpp: 0.4210, icms: 0,      iss: 0, ipi: 0 },
    ],
    II: [
        { irpj: 0.0550, csll: 0.0350, cofins: 0.1151, pis: 0.0249, cpp: 0.3750, icms: 0.3200, iss: 0, ipi: 0.0750 },
        { irpj: 0.0550, csll: 0.0350, cofins: 0.1151, pis: 0.0249, cpp: 0.3750, icms: 0.3200, iss: 0, ipi: 0.0750 },
        { irpj: 0.0550, csll: 0.0350, cofins: 0.1151, pis: 0.0249, cpp: 0.3750, icms: 0.3200, iss: 0, ipi: 0.0750 },
        { irpj: 0.0550, csll: 0.0350, cofins: 0.1151, pis: 0.0249, cpp: 0.3750, icms: 0.3200, iss: 0, ipi: 0.0750 },
        { irpj: 0.0550, csll: 0.0350, cofins: 0.1151, pis: 0.0249, cpp: 0.3750, icms: 0.3200, iss: 0, ipi: 0.0750 },
        { irpj: 0.0850, csll: 0.0750, cofins: 0.2096, pis: 0.0454, cpp: 0.2350, icms: 0,      iss: 0, ipi: 0.3500 },
    ],
    III: [
        { irpj: 0.0400, csll: 0.0350, cofins: 0.1282, pis: 0.0278, cpp: 0.4340, icms: 0, iss: 0.3350, ipi: 0 },
        { irpj: 0.0400, csll: 0.0350, cofins: 0.1405, pis: 0.0305, cpp: 0.4340, icms: 0, iss: 0.3200, ipi: 0 },
        { irpj: 0.0400, csll: 0.0350, cofins: 0.1364, pis: 0.0296, cpp: 0.4340, icms: 0, iss: 0.3250, ipi: 0 },
        { irpj: 0.0400, csll: 0.0350, cofins: 0.1364, pis: 0.0296, cpp: 0.4340, icms: 0, iss: 0.3250, ipi: 0 },
        { irpj: 0.0400, csll: 0.0350, cofins: 0.1282, pis: 0.0278, cpp: 0.4340, icms: 0, iss: 0.3350, ipi: 0 },
        { irpj: 0.3500, csll: 0.1500, cofins: 0.1603, pis: 0.0347, cpp: 0.3050, icms: 0, iss: 0,      ipi: 0 },
    ],
    IV: [
        { irpj: 0.1880, csll: 0.1520, cofins: 0.1767, pis: 0.0383, cpp: 0, icms: 0, iss: 0.4450, ipi: 0 },
        { irpj: 0.1980, csll: 0.1520, cofins: 0.2055, pis: 0.0445, cpp: 0, icms: 0, iss: 0.4000, ipi: 0 },
        { irpj: 0.2080, csll: 0.1520, cofins: 0.1973, pis: 0.0427, cpp: 0, icms: 0, iss: 0.4000, ipi: 0 },
        { irpj: 0.1780, csll: 0.1920, cofins: 0.1890, pis: 0.0410, cpp: 0, icms: 0, iss: 0.4000, ipi: 0 },
        { irpj: 0.1880, csll: 0.1920, cofins: 0.1808, pis: 0.0392, cpp: 0, icms: 0, iss: 0.4000, ipi: 0 },
        { irpj: 0.5350, csll: 0.2150, cofins: 0.2055, pis: 0.0445, cpp: 0, icms: 0, iss: 0,      ipi: 0 },
    ],
    V: [
        { irpj: 0.2500, csll: 0.1500, cofins: 0.1410, pis: 0.0305, cpp: 0.2885, icms: 0, iss: 0.1400, ipi: 0 },
        { irpj: 0.2300, csll: 0.1500, cofins: 0.1410, pis: 0.0305, cpp: 0.2785, icms: 0, iss: 0.1700, ipi: 0 },
        { irpj: 0.2400, csll: 0.1500, cofins: 0.1492, pis: 0.0323, cpp: 0.2385, icms: 0, iss: 0.1900, ipi: 0 },
        { irpj: 0.2100, csll: 0.1500, cofins: 0.1574, pis: 0.0341, cpp: 0.2385, icms: 0, iss: 0.2100, ipi: 0 },
        { irpj: 0.2300, csll: 0.1250, cofins: 0.1410, pis: 0.0305, cpp: 0.2385, icms: 0, iss: 0.2350, ipi: 0 },
        { irpj: 0.3500, csll: 0.1550, cofins: 0.1644, pis: 0.0356, cpp: 0.2950, icms: 0, iss: 0,      ipi: 0 },
    ],
};


// ═══════════════════════════════════════════
//  MUNICÍPIOS DO PARÁ — ALÍQUOTAS ISS
// ═══════════════════════════════════════════
const MUNICIPIOS_ISS = [
    { nome: "Altamira",           iss: 5.00, issSaude: null, issEducacao: null },
    { nome: "Ananindeua",         iss: 5.00, issSaude: null, issEducacao: null },
    { nome: "Barcarena",          iss: 5.00, issSaude: null, issEducacao: null },
    { nome: "Belém",              iss: 5.00, issSaude: 3.00, issEducacao: null },
    { nome: "Canaã dos Carajás",  iss: 5.00, issSaude: null, issEducacao: null },
    { nome: "Castanhal",          iss: 5.00, issSaude: null, issEducacao: null },
    { nome: "Itaituba",           iss: 5.00, issSaude: null, issEducacao: null },
    { nome: "Marabá",             iss: 5.00, issSaude: null, issEducacao: null },
    { nome: "Marituba",           iss: 5.00, issSaude: null, issEducacao: null },
    { nome: "Novo Progresso",     iss: 5.00, issSaude: 3.00, issEducacao: 3.00 },
    { nome: "Parauapebas",        iss: 5.00, issSaude: null, issEducacao: null },
    { nome: "Redenção",           iss: 5.00, issSaude: null, issEducacao: null },
    { nome: "Santarém",           iss: 5.00, issSaude: null, issEducacao: null },
    { nome: "Tucuruí",            iss: 5.00, issSaude: null, issEducacao: null },
];


// ═══════════════════════════════════════════
//  IRPF 2026 — TABELA PROGRESSIVA MENSAL
// ═══════════════════════════════════════════
// [limite_inferior, limite_superior, aliquota, parcela_deduzir]
const IRPF_TABELA = [
    [0,        2428.80,  0,     0],
    [2428.81,  2826.65,  0.075, 182.16],
    [2826.66,  3751.05,  0.15,  394.16],
    [3751.06,  4664.68,  0.225, 675.49],
    [4664.69,  Infinity, 0.275, 908.73],
];

// Redutor de isenção até R$ 5.000
const IRPF_REDUCAO_MAX = 312.89;
const IRPF_FAIXA_ISENCAO = 5000;
const IRPF_FAIXA_TRANSICAO = 7350;


// ═══════════════════════════════════════════
//  ICMS DO PARÁ
// ═══════════════════════════════════════════
const ICMS_PA = {
    geral: 0.19,
    cestaBasica: 0.07,
    energiaTelecom: 0.25,
    bebidasCigarros: 0.30,
    interestadualNorte: 0.12, // Norte/Nordeste/CO/ES
    interestadualSul: 0.07,   // Sul/Sudeste (exceto ES)
    importados: 0.04,
};


// ═══════════════════════════════════════════
//  CONSTANTES GERAIS
// ═══════════════════════════════════════════
const CPP_PATRONAL = 0.278;        // 20% INSS + 2% RAT + 5,8% Terceiros
const CPP_ANEXO_IV = 0.2785;       // Inclui arredondamento
const LIMITE_SIMPLES = 4800000;    // Teto anual Simples Nacional
const SUBLIMITE_PA = 3600000;      // Sublimite estadual do Pará
const LIMITE_PRESUMIDO = 78000000; // Acima = Lucro Real obrigatório
const LC224_LIMITE = 5000000;      // LC 224/2025 majoração de presunção
const DIVIDENDOS_ISENCAO = 50000;  // Isenção mensal de dividendos
const DIVIDENDOS_ALIQ = 0.10;     // 10% sobre excedente
const TRIB_MINIMA_INICIO = 600000; // Renda anual início da tributação mínima
const TRIB_MINIMA_TETO = 1200000;  // Renda anual alíquota máxima 10%


// ═══════════════════════════════════════════
//  HELPERS DE FORMATAÇÃO
// ═══════════════════════════════════════════

/** Formata número como moeda brasileira */
function formatarMoeda(valor) {
    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

/** Formata como percentual */
function formatarPct(valor, casas = 2) {
    return (valor * 100).toFixed(casas).replace(".", ",") + "%";
}

/** Remove formatação e converte para número */
function parseMoeda(str) {
    if (typeof str === "number") return str;
    if (!str) return 0;
    return parseFloat(
        str.replace(/\s/g, "")
           .replace("R$", "")
           .replace(/\./g, "")
           .replace(",", ".")
    ) || 0;
}

/** Arredonda para cima (a favor do fisco) */
function arredondarFisco(valor) {
    return Math.ceil(valor * 100) / 100;
}
