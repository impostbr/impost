/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * IMPOSTOS_FEDERAIS.JS
 * Base de Dados Completa de Tributos Federais Brasileiros — 2026
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Sistema profissional de dados e cálculos tributários federais para integração
 * com o projeto IMPOST (Inteligência em Modelagem de Otimização Tributária).
 *
 * Escopo:
 *   • Simples Nacional (Anexos I–V, repartição completa por faixa, Fator R)
 *   • Lucro Presumido (IRPJ, CSLL, PIS, Cofins — regime cumulativo)
 *   • Lucro Real (IRPJ, CSLL, PIS, Cofins — regime não-cumulativo)
 *   • IRPF 2026 (tabela progressiva + redutor Lei 15.270/2025 + IRPFM)
 *   • INSS 2026 (empregado progressivo + patronal + contribuinte individual)
 *   • Ganho de Capital, Rendimentos de Capital, PLR, Apostas
 *   • Reforma Tributária CBS/IBS (fase de teste 2026)
 *   • Encargos Trabalhistas (FGTS, Sistema S, RAT/FAP)
 *   • Produtos Monofásicos (PIS/Cofins zerado na revenda)
 *
 * Fontes normativas:
 *   • LC 123/2006 (Simples Nacional)
 *   • Lei 15.270/2025 (Reforma da Renda — isenção até R$ 5.000)
 *   • Portaria Interministerial MPS/MF nº 13/2026 (INSS 2026)
 *   • EC 132/2023 + LC 214/2025 (Reforma Tributária CBS/IBS)
 *   • IN RFB 2299/2025 (normas IRPF 2026)
 *   • Lei 9.249/1995, Lei 9.250/1995 (IRPJ/IRPF)
 *
 * Autor: AGROGEO BRASIL — Inteligência Tributária
 * Versão: 2.0.0
 * Data: 08/02/2026
 * Compatível: CommonJS (Node.js) + Browser (script tag)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.ImpostosFederais = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {

  'use strict';

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. CONSTANTES NACIONAIS E PARÂMETROS GERAIS 2026
  // ═══════════════════════════════════════════════════════════════════════════

  const PARAMETROS_GERAIS = {
    ano_referencia: 2026,
    salario_minimo: 1621.00,                      // Decreto de janeiro/2026
    teto_inss: 8475.55,                           // Portaria MPS/MF 13/2026
    ufir_extinta: true,                           // UFIR extinta desde 2000

    // ── Limites de enquadramento ──
    teto_simples_nacional: 4800000.00,            // R$ 4,8M (LC 123/2006)
    sublimite_icms_iss: 3600000.00,               // R$ 3,6M — Portaria CGSN 54/2025
    teto_mei: 81000.00,                           // R$ 81.000/ano
    teto_lucro_presumido: 78000000.00,            // R$ 78M

    // ── Deduções IRPF 2026 ──
    deducoes_irpf: {
      dependente_mensal: 189.59,
      dependente_anual: 2275.08,
      educacao_anual_por_pessoa: 3561.50,
      desconto_simplificado_mensal: 607.20,       // 25% de R$ 2.428,80
      desconto_simplificado_anual: 17640.00,      // Lei 15.270/2025 art. 10
      pensao_alimenticia: 'integral',             // Sem limite — judicial
      previdencia_oficial: 'integral',            // Limitado ao teto INSS
      previdencia_privada: 0.12,                  // 12% da renda bruta anual (PGBL)
      isencao_aposentado_65_anos: 1903.98,        // Parcela isenta mensal
      despesas_medicas: 'sem_limite'
    },

    // ── FGTS ──
    fgts: {
      aliquota_padrao: 0.08,                      // 8% sobre remuneração
      aliquota_aprendiz: 0.02,                    // 2% para aprendiz
      aliquota_domestico: 0.08,                   // 8% + 3,2% antecipação rescisória
      antecipacao_rescisoria_domestico: 0.032,    // 3,2%
      multa_demissao_sem_justa_causa: 0.40        // 40% sobre saldo
    },

    // ── Salário-Família 2026 ──
    salario_familia: {
      valor_cota: 67.54,                          // Por dependente até 14 anos
      limite_remuneracao: 1980.38                  // Portaria MPS/MF 13/2026
    }
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // 2. SIMPLES NACIONAL — TABELAS COMPLETAS (LC 123/2006)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Cada faixa contém:
   *   faixa      — Número da faixa (1-6)
   *   limite     — Receita bruta acumulada máxima em 12 meses (RBT12)
   *   aliquota   — Alíquota nominal do anexo
   *   deducao    — Parcela a deduzir (R$)
   *
   * Fórmula da alíquota efetiva:
   *   Ae = (RBT12 × An - Pd) / RBT12
   *   onde An = alíquota nominal, Pd = parcela a deduzir
   */

  const SIMPLES_NACIONAL = {

    // ── ANEXO I — COMÉRCIO ──
    ANEXO_I: {
      descricao: 'Comércio',
      cnae_exemplos: ['Varejo', 'Atacado', 'E-commerce', 'Comércio de peças'],
      faixas: [
        { faixa: 1, limite:  180000.00, aliquota: 0.0400, deducao:      0.00 },
        { faixa: 2, limite:  360000.00, aliquota: 0.0730, deducao:   5940.00 },
        { faixa: 3, limite:  720000.00, aliquota: 0.0950, deducao:  13860.00 },
        { faixa: 4, limite: 1800000.00, aliquota: 0.1070, deducao:  22500.00 },
        { faixa: 5, limite: 3600000.00, aliquota: 0.1430, deducao:  87300.00 },
        { faixa: 6, limite: 4800000.00, aliquota: 0.1900, deducao: 378000.00 }
      ],
      // Repartição tributos por faixa (% dentro da alíquota efetiva)
      // Fonte: LC 123/2006, Anexo I
      reparticao: [
        { faixa: 1, irpj: 0.0550, csll: 0.0350, cofins: 0.1274, pis: 0.0276, cpp: 0.4150, icms: 0.3400, iss: 0, ipi: 0 },
        { faixa: 2, irpj: 0.0550, csll: 0.0350, cofins: 0.1274, pis: 0.0276, cpp: 0.4150, icms: 0.3400, iss: 0, ipi: 0 },
        { faixa: 3, irpj: 0.0550, csll: 0.0350, cofins: 0.1274, pis: 0.0276, cpp: 0.4200, icms: 0.3350, iss: 0, ipi: 0 },
        { faixa: 4, irpj: 0.0550, csll: 0.0350, cofins: 0.1274, pis: 0.0276, cpp: 0.4200, icms: 0.3350, iss: 0, ipi: 0 },
        { faixa: 5, irpj: 0.0550, csll: 0.0350, cofins: 0.1274, pis: 0.0276, cpp: 0.4200, icms: 0.3350, iss: 0, ipi: 0 },
        { faixa: 6, irpj: 0.1350, csll: 0.1000, cofins: 0.2827, pis: 0.0613, cpp: 0.4210, icms: 0.0000, iss: 0, ipi: 0 }
      ]
    },

    // ── ANEXO II — INDÚSTRIA ──
    ANEXO_II: {
      descricao: 'Indústria',
      cnae_exemplos: ['Fabricação em geral', 'Transformação', 'Confecção'],
      faixas: [
        { faixa: 1, limite:  180000.00, aliquota: 0.0450, deducao:      0.00 },
        { faixa: 2, limite:  360000.00, aliquota: 0.0780, deducao:   5940.00 },
        { faixa: 3, limite:  720000.00, aliquota: 0.1000, deducao:  13860.00 },
        { faixa: 4, limite: 1800000.00, aliquota: 0.1120, deducao:  22500.00 },
        { faixa: 5, limite: 3600000.00, aliquota: 0.1470, deducao:  85500.00 },
        { faixa: 6, limite: 4800000.00, aliquota: 0.3000, deducao: 720000.00 }
      ],
      reparticao: [
        { faixa: 1, irpj: 0.0550, csll: 0.0350, cofins: 0.1151, pis: 0.0249, cpp: 0.3750, icms: 0.3200, iss: 0, ipi: 0.0750 },
        { faixa: 2, irpj: 0.0550, csll: 0.0350, cofins: 0.1151, pis: 0.0249, cpp: 0.3750, icms: 0.3200, iss: 0, ipi: 0.0750 },
        { faixa: 3, irpj: 0.0550, csll: 0.0350, cofins: 0.1151, pis: 0.0249, cpp: 0.3750, icms: 0.3200, iss: 0, ipi: 0.0750 },
        { faixa: 4, irpj: 0.0550, csll: 0.0350, cofins: 0.1151, pis: 0.0249, cpp: 0.3750, icms: 0.3200, iss: 0, ipi: 0.0750 },
        { faixa: 5, irpj: 0.0550, csll: 0.0350, cofins: 0.1151, pis: 0.0249, cpp: 0.3750, icms: 0.3200, iss: 0, ipi: 0.0750 },
        { faixa: 6, irpj: 0.0850, csll: 0.0750, cofins: 0.2096, pis: 0.0454, cpp: 0.2350, icms: 0.3500, iss: 0, ipi: 0.0000 }
      ]
    },

    // ── ANEXO III — SERVIÇOS (Manutenção, Reparos, Academias, etc.) ──
    ANEXO_III: {
      descricao: 'Serviços — Receitas do art. 25-A, § 1º, III a V (CPP inclusa)',
      cnae_exemplos: ['Manutenção', 'Reparos', 'Academias', 'Laboratórios', 'Medicina', 'Odontologia'],
      faixas: [
        { faixa: 1, limite:  180000.00, aliquota: 0.0600, deducao:      0.00 },
        { faixa: 2, limite:  360000.00, aliquota: 0.1120, deducao:   9360.00 },
        { faixa: 3, limite:  720000.00, aliquota: 0.1350, deducao:  17640.00 },
        { faixa: 4, limite: 1800000.00, aliquota: 0.1600, deducao:  35640.00 },
        { faixa: 5, limite: 3600000.00, aliquota: 0.2100, deducao: 125640.00 },
        { faixa: 6, limite: 4800000.00, aliquota: 0.3300, deducao: 648000.00 }
      ],
      reparticao: [
        { faixa: 1, irpj: 0.0400, csll: 0.0350, cofins: 0.1282, pis: 0.0278, cpp: 0.4340, icms: 0, iss: 0.3350, ipi: 0 },
        { faixa: 2, irpj: 0.0400, csll: 0.0350, cofins: 0.1405, pis: 0.0305, cpp: 0.4340, icms: 0, iss: 0.3200, ipi: 0 },
        { faixa: 3, irpj: 0.0400, csll: 0.0350, cofins: 0.1364, pis: 0.0296, cpp: 0.4340, icms: 0, iss: 0.3250, ipi: 0 },
        { faixa: 4, irpj: 0.0400, csll: 0.0350, cofins: 0.1364, pis: 0.0296, cpp: 0.4340, icms: 0, iss: 0.3250, ipi: 0 },
        { faixa: 5, irpj: 0.0400, csll: 0.0350, cofins: 0.1282, pis: 0.0278, cpp: 0.4340, icms: 0, iss: 0.3350, ipi: 0 },
        { faixa: 6, irpj: 0.3500, csll: 0.1500, cofins: 0.1603, pis: 0.0347, cpp: 0.3050, icms: 0, iss: 0.0000, ipi: 0 }
      ]
    },

    // ── ANEXO IV — SERVIÇOS (Limpeza, Obras, Advocacia — CPP fora do DAS) ──
    ANEXO_IV: {
      descricao: 'Serviços — CPP paga em separado (INSS patronal de 20%)',
      cnae_exemplos: ['Limpeza', 'Vigilância', 'Construção civil', 'Advocacia'],
      nota: 'CPP não está inclusa no DAS. Empresa paga 20% INSS patronal separadamente.',
      faixas: [
        { faixa: 1, limite:  180000.00, aliquota: 0.0450, deducao:      0.00 },
        { faixa: 2, limite:  360000.00, aliquota: 0.0900, deducao:   8100.00 },
        { faixa: 3, limite:  720000.00, aliquota: 0.1020, deducao:  16740.00 },
        { faixa: 4, limite: 1800000.00, aliquota: 0.1400, deducao:  44100.00 },
        { faixa: 5, limite: 3600000.00, aliquota: 0.2200, deducao: 188100.00 },
        { faixa: 6, limite: 4800000.00, aliquota: 0.3300, deducao: 828000.00 }
      ],
      reparticao: [
        { faixa: 1, irpj: 0.1880, csll: 0.1520, cofins: 0.1767, pis: 0.0383, cpp: 0, icms: 0, iss: 0.4450, ipi: 0 },
        { faixa: 2, irpj: 0.1980, csll: 0.1520, cofins: 0.2055, pis: 0.0445, cpp: 0, icms: 0, iss: 0.4000, ipi: 0 },
        { faixa: 3, irpj: 0.2080, csll: 0.1520, cofins: 0.1973, pis: 0.0427, cpp: 0, icms: 0, iss: 0.4000, ipi: 0 },
        { faixa: 4, irpj: 0.1780, csll: 0.1920, cofins: 0.1890, pis: 0.0410, cpp: 0, icms: 0, iss: 0.4000, ipi: 0 },
        { faixa: 5, irpj: 0.1880, csll: 0.1920, cofins: 0.1808, pis: 0.0392, cpp: 0, icms: 0, iss: 0.4000, ipi: 0 },
        { faixa: 6, irpj: 0.5350, csll: 0.2150, cofins: 0.2055, pis: 0.0445, cpp: 0, icms: 0, iss: 0.0000, ipi: 0 }
      ]
    },

    // ── ANEXO V — SERVIÇOS INTELECTUAIS (Fator R < 28%) ──
    ANEXO_V: {
      descricao: 'Serviços intelectuais, tecnologia, auditoria, consultoria',
      cnae_exemplos: ['TI', 'Consultoria', 'Auditoria', 'Engenharia', 'Publicidade', 'Jornalismo'],
      nota: 'Se Fator R >= 28%, empresa é tributada pelo ANEXO III (mais vantajoso).',
      faixas: [
        { faixa: 1, limite:  180000.00, aliquota: 0.1550, deducao:      0.00 },
        { faixa: 2, limite:  360000.00, aliquota: 0.1800, deducao:   4500.00 },
        { faixa: 3, limite:  720000.00, aliquota: 0.1950, deducao:   9900.00 },
        { faixa: 4, limite: 1800000.00, aliquota: 0.2050, deducao:  17100.00 },
        { faixa: 5, limite: 3600000.00, aliquota: 0.2300, deducao:  62100.00 },
        { faixa: 6, limite: 4800000.00, aliquota: 0.3050, deducao: 540000.00 }
      ],
      reparticao: [
        { faixa: 1, irpj: 0.2500, csll: 0.1500, cofins: 0.1474, pis: 0.0326, cpp: 0.2850, icms: 0, iss: 0.1400, ipi: 0 },
        { faixa: 2, irpj: 0.2300, csll: 0.1500, cofins: 0.1274, pis: 0.0276, cpp: 0.2750, icms: 0, iss: 0.1700, ipi: 0 },
        { faixa: 3, irpj: 0.2400, csll: 0.1500, cofins: 0.1274, pis: 0.0276, cpp: 0.2350, icms: 0, iss: 0.1950, ipi: 0 },
        { faixa: 4, irpj: 0.2100, csll: 0.1500, cofins: 0.1274, pis: 0.0276, cpp: 0.2350, icms: 0, iss: 0.2350, ipi: 0 },
        { faixa: 5, irpj: 0.2300, csll: 0.1250, cofins: 0.1274, pis: 0.0276, cpp: 0.2350, icms: 0, iss: 0.2350, ipi: 0 },
        { faixa: 6, irpj: 0.3500, csll: 0.1500, cofins: 0.1603, pis: 0.0347, cpp: 0.3050, icms: 0, iss: 0.0000, ipi: 0 }
      ]
    },

    // ── FATOR R ──
    fator_r: {
      limite: 0.28,  // 28%
      descricao: 'Folha de salários ÷ Receita bruta dos últimos 12 meses',
      regra: 'Se Fator R >= 0.28, atividades do Anexo V migram para Anexo III'
    }
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // 3. LUCRO PRESUMIDO
  // ═══════════════════════════════════════════════════════════════════════════

  const LUCRO_PRESUMIDO = {
    descricao: 'Regime para empresas com faturamento até R$ 78M/ano',
    periodicidade_irpj_csll: 'trimestral',     // Apuração trimestral
    periodicidade_pis_cofins: 'mensal',

    // ── Alíquotas sobre a base presumida ──
    irpj: {
      aliquota: 0.15,                            // 15%
      adicional_aliquota: 0.10,                   // 10% sobre excedente
      adicional_limite_mensal: 20000.00,          // R$ 20.000/mês
      adicional_limite_trimestral: 60000.00       // R$ 60.000/trimestre
    },
    csll: {
      aliquota: 0.09                              // 9%
    },

    // ── PIS e Cofins (Regime Cumulativo — sem crédito) ──
    pis: 0.0065,                                  // 0,65%
    cofins: 0.03,                                 // 3,00%

    // ── Percentuais de Presunção IRPJ (por atividade) ──
    presuncao_irpj: {
      revenda_combustiveis:       0.016,          // 1,6%
      comercio_geral:             0.08,           // 8%
      industria:                  0.08,           // 8%
      transporte_cargas:          0.08,           // 8%
      servicos_hospitalares:      0.08,           // 8%
      construcao_civil_empreitada: 0.08,          // 8% (com emprego de materiais)
      atividade_imobiliaria:      0.08,           // 8% (venda de imóveis)
      transporte_passageiros:     0.16,           // 16%
      servicos_gerais:            0.32,           // 32% (regra geral de serviços)
      servicos_profissionais:     0.32,           // 32% (profissões regulamentadas)
      intermediacao_negocios:     0.32,           // 32%
      administracao_bens:         0.32,           // 32%
      locacao_bens_moveis:        0.32,           // 32%
      factoring:                  0.32            // 32%
    },

    // ── Percentuais de Presunção CSLL (por atividade) ──
    presuncao_csll: {
      regra_geral:                0.12,           // 12% (comércio, indústria, transporte)
      servicos_gerais:            0.32,           // 32%
      servicos_profissionais:     0.32,           // 32%
      intermediacao_negocios:     0.32,           // 32%
      administracao_bens:         0.32,           // 32%
      factoring:                  0.32            // 32%
    }
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // 4. LUCRO REAL
  // ═══════════════════════════════════════════════════════════════════════════

  const LUCRO_REAL = {
    descricao: 'Regime obrigatório para faturamento > R$ 78M ou setores específicos',
    obrigatorio_para: [
      'Faturamento anual > R$ 78 milhões',
      'Instituições financeiras (bancos, seguradoras)',
      'Empresas com lucros ou rendimentos do exterior',
      'Empresas que usufruem benefícios fiscais (redução/isenção de IR)',
      'Factoring (fomento mercantil)'
    ],

    // ── Alíquotas sobre o lucro contábil ajustado ──
    irpj: {
      aliquota: 0.15,
      adicional_aliquota: 0.10,
      adicional_limite_mensal: 20000.00,
      adicional_limite_trimestral: 60000.00,
      adicional_limite_anual: 240000.00
    },
    csll: {
      aliquota_geral: 0.09,                      // 9%
      aliquota_financeiras: 0.15                  // 15% (bancos, seguradoras — até 2025)
    },

    // ── PIS e Cofins (Regime Não-Cumulativo — com créditos) ──
    pis: 0.0165,                                  // 1,65%
    cofins: 0.076,                                // 7,60%

    creditos_permitidos: [
      'Bens adquiridos para revenda',
      'Bens e serviços utilizados como insumo',
      'Energia elétrica e térmica',
      'Aluguéis de prédios, máquinas e equipamentos',
      'Depreciação de bens do ativo imobilizado',
      'Frete sobre vendas (CIF)',
      'Arrendamento mercantil (leasing operacional)',
      'Armazenagem de mercadorias',
      'Vale-transporte, vale-refeição e fardamento (pago a pessoa jurídica)'
    ],

    // ── Apuração ──
    modalidades: {
      trimestral: 'Apuração definitiva a cada trimestre (sem compensação entre trimestres)',
      anual: 'Apuração com estimativas mensais e ajuste anual em 31/dez'
    }
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // 5. IRPF 2026 — TABELA PROGRESSIVA + REDUTOR (Lei 15.270/2025)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * IMPORTANTE — Mecânica de cálculo 2026:
   *
   * 1) Calcula-se o IR pela tabela progressiva tradicional (inalterada desde 2025)
   * 2) Aplica-se o REDUTOR ADICIONAL (art. 3-A, Lei 9.250/1995):
   *    • Rendimento até R$ 5.000,00 → Redutor de até R$ 312,89 (zera o imposto)
   *    • Rendimento de R$ 5.000,01 a R$ 7.350,00 → Redutor decrescente por fórmula
   *    • Rendimento acima de R$ 7.350,00 → Sem redutor
   *
   * 3) O redutor é LIMITADO ao imposto calculado (nunca gera valor negativo)
   * 4) A elegibilidade ao redutor usa o RENDIMENTO TRIBUTÁVEL (bruto),
   *    não a base de cálculo após deduções.
   */

  const IRPF = {

    // ── Tabela Progressiva Mensal (base de cálculo) ──
    tabela_mensal: [
      { faixa: 1, ate:  2428.80, aliquota: 0.000, deducao:   0.00, descricao: 'Isento'  },
      { faixa: 2, ate:  2826.65, aliquota: 0.075, deducao: 182.16, descricao: '7,5%'    },
      { faixa: 3, ate:  3751.05, aliquota: 0.150, deducao: 394.16, descricao: '15,0%'   },
      { faixa: 4, ate:  4664.68, aliquota: 0.225, deducao: 675.49, descricao: '22,5%'   },
      { faixa: 5, ate: Infinity, aliquota: 0.275, deducao: 908.73, descricao: '27,5%'   }
    ],

    // ── Tabela Progressiva Anual (exercício 2027, ano-calendário 2026) ──
    tabela_anual: [
      { faixa: 1, ate:  29145.60, aliquota: 0.000, deducao:     0.00, descricao: 'Isento' },
      { faixa: 2, ate:  33919.80, aliquota: 0.075, deducao:  2185.92, descricao: '7,5%'   },
      { faixa: 3, ate:  45012.60, aliquota: 0.150, deducao:  4729.91, descricao: '15,0%'  },
      { faixa: 4, ate:  55976.16, aliquota: 0.225, deducao:  8105.85, descricao: '22,5%'  },
      { faixa: 5, ate: Infinity,  aliquota: 0.275, deducao: 10904.66, descricao: '27,5%'  }
    ],

    // ── Redutor Mensal (Lei 15.270/2025 — art. 3-A, Lei 9.250/1995) ──
    redutor_mensal: {
      // Faixa 1: Rendimento até R$ 5.000 → redutor de até R$ 312,89
      faixa_isencao_limite: 5000.00,
      redutor_maximo: 312.89,
      // Faixa 2: Rendimento de R$ 5.000,01 a R$ 7.350 → fórmula decrescente
      faixa_transicao_inicio: 5000.01,
      faixa_transicao_fim: 7350.00,
      formula_base: 978.62,                       // Valor base da fórmula
      formula_coeficiente: 0.133145,              // Coeficiente multiplicador
      // Fórmula: Redutor = 978,62 - (0,133145 × rendimento_tributavel)
      // Nota: resultado limitado ao IR apurado pela tabela progressiva
      fonte_legal: 'Lei 15.270/2025, art. 3-A da Lei 9.250/1995'
    },

    // ── Redutor Anual (Lei 15.270/2025 — art. 11-A, Lei 9.250/1995) ──
    redutor_anual: {
      faixa_isencao_limite: 60000.00,             // R$ 60.000 (= R$ 5.000 × 12)
      redutor_maximo: 3754.68,                    // R$ 312,89 × 12
      faixa_transicao_inicio: 60000.01,
      faixa_transicao_fim: 88200.00,              // R$ 7.350 × 12
      formula_base: 11743.39,                     // 978,62 × 12 ≈ 11.743,44 (ajuste: 0,133145 × 88200)
      formula_coeficiente: 0.133145,
      fonte_legal: 'Lei 15.270/2025, art. 11-A da Lei 9.250/1995'
    },

    // ── IRPFM — Imposto Mínimo sobre Altas Rendas (Lei 15.270/2025) ──
    irpfm: {
      descricao: 'Tributação mínima para pessoa física com renda anual > R$ 600 mil',
      limite_anual: 600000.00,                    // R$ 600.000/ano
      aliquota_maxima: 0.10,                      // 10%
      renda_aliquota_maxima: 1200000.00,          // R$ 1,2M/ano → 10% fixo
      // Fórmula progressiva: alíquota = 10% × (Renda - 600.000) / 600.000
      // Limitada a 10% para renda >= R$ 1.200.000
      rendimentos_excluidos: [
        'Ganhos de capital (exceto operações em bolsa)',
        'Rendimentos recebidos acumuladamente',
        'Rendimentos de poupança',
        'Indenizações por acidente de trabalho',
        'Aposentadoria isenta por doença grave',
        'Investimentos em infraestrutura/imobiliário/agro incentivados'
      ],
      fonte_legal: 'Lei 15.270/2025, art. 16-A da Lei 9.250/1995'
    },

    // ── Tributação de Dividendos (novidade 2026) ──
    dividendos: {
      aliquota_retencao: 0.10,                    // 10% na fonte
      limite_mensal_isento: 50000.00,             // Até R$ 50.000/mês por PJ = isento
      regra: 'Retenção de 10% sobre dividendos > R$ 50 mil/mês pagos pela mesma PJ à mesma PF',
      compensavel: true,                           // Compensável na declaração anual
      fonte_legal: 'Lei 15.270/2025, art. 6-A da Lei 9.250/1995'
    }
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // 6. INSS 2026 — CONTRIBUIÇÃO DO SEGURADO (Portaria MPS/MF 13/2026)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * CÁLCULO PROGRESSIVO por faixas (desde Reforma da Previdência EC 103/2019):
   *   Cada parcela do salário é tributada pela alíquota da respectiva faixa.
   *   Contribuição = Σ (valor_na_faixa × alíquota_da_faixa)
   *
   * Método simplificado equivalente:
   *   Contribuição = (salário × alíquota_faixa) - parcela_a_deduzir
   */

  const INSS = {

    // ── Tabela Empregado / Doméstico / Avulso (progressiva) ──
    tabela_empregado: [
      { faixa: 1, de:    0.01, ate: 1621.00, aliquota: 0.075, deducao:   0.00, descricao: '7,5%'  },
      { faixa: 2, de: 1621.01, ate: 2902.84, aliquota: 0.090, deducao:  24.32, descricao: '9,0%'  },
      { faixa: 3, de: 2902.85, ate: 4354.27, aliquota: 0.120, deducao: 111.40, descricao: '12,0%' },
      { faixa: 4, de: 4354.28, ate: 8475.55, aliquota: 0.140, deducao: 198.49, descricao: '14,0%' }
    ],

    teto: 8475.55,
    contribuicao_maxima: 988.07,                  // Desconto máximo no teto

    // ── Contribuinte Individual (pró-labore, autônomo) ──
    contribuinte_individual: {
      aliquota_padrao: 0.20,                      // 20% sobre o salário de contribuição
      aliquota_simplificada: 0.11,                // 11% sobre salário mínimo (plano simplificado)
      base_minima: 1621.00,                       // Salário mínimo
      base_maxima: 8475.55,                       // Teto
      valor_11_porcento: 178.31,                  // R$ 1.621 × 11%
      nota: '20% sobre pró-labore, limitado ao teto. Autônomo que presta a PJ: empresa retém 11%.'
    },

    // ── Contribuinte Facultativo ──
    contribuinte_facultativo: {
      aliquota_padrao: 0.20,                      // 20% (entre SM e teto)
      aliquota_simplificada: 0.11,                // 11% sobre SM
      aliquota_baixa_renda: 0.05,                 // 5% sobre SM (donas de casa baixa renda)
      valor_5_porcento: 81.05                     // R$ 1.621 × 5%
    },

    // ── MEI ──
    mei: {
      aliquota: 0.05,                             // 5% sobre SM
      valor_mensal: 81.05,                        // R$ 1.621 × 5%
      icms_adicional: 1.00,                       // R$ 1,00 se comércio/indústria
      iss_adicional: 5.00                         // R$ 5,00 se serviço
    },

    // ── INSS Patronal (encargos sobre folha) ──
    patronal: {
      inss_patronal: 0.20,                        // 20% (regra geral — empresas não desoneradas)
      rat: {
        minimo: 0.01,                             // 1% (risco leve)
        medio: 0.02,                              // 2% (risco médio)
        maximo: 0.03                              // 3% (risco grave)
      },
      fap: {
        minimo: 0.50,                             // Fator 0,5 (reduz RAT)
        maximo: 2.00                              // Fator 2,0 (dobra RAT)
      },
      terceiros: {
        salario_educacao: 0.025,                  // 2,5%
        incra: 0.002,                             // 0,2%
        senai_sesi: 0.015,                        // 1,5% (indústria) ou SESC/SENAC (comércio)
        sebrae: 0.006,                            // 0,6%
        total_estimado: 0.048                     // ~4,8% (varia por setor)
      },
      total_estimado: {
        minimo: 0.265,                            // ~26,5% (RAT leve + FAP favorável)
        medio: 0.288,                             // ~28,8% (RAT médio + FAP 1,0)
        maximo: 0.328                             // ~32,8% (RAT grave + FAP máximo)
      },
      desonerada: {
        descricao: 'Empresas com CPRB (desoneração da folha) pagam % sobre receita bruta em vez de 20% sobre folha',
        aliquotas_receita: [0.01, 0.015, 0.02, 0.025, 0.03, 0.045],
        nota: 'Desoneração prorrogada até 2027. Reoneração gradual de 2025 a 2028.'
      }
    }
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // 7. GANHO DE CAPITAL — PESSOA FÍSICA (Lei 13.259/2016)
  // ═══════════════════════════════════════════════════════════════════════════

  const GANHO_CAPITAL = {
    descricao: 'IRPF sobre ganho na alienação de bens e direitos',
    tabela: [
      { ate:  5000000.00, aliquota: 0.150, descricao: '15% — Até R$ 5 milhões'             },
      { ate: 10000000.00, aliquota: 0.175, descricao: '17,5% — De R$ 5M a R$ 10 milhões'   },
      { ate: 30000000.00, aliquota: 0.200, descricao: '20% — De R$ 10M a R$ 30 milhões'     },
      { ate: Infinity,    aliquota: 0.225, descricao: '22,5% — Acima de R$ 30 milhões'      }
    ],
    isencoes: [
      { tipo: 'pequeno_valor', limite_mensal: 35000.00, descricao: 'Alienação até R$ 35 mil/mês — isento' },
      { tipo: 'imovel_unico', limite: 440000.00, descricao: 'Venda de imóvel único até R$ 440 mil — isento (se não vendeu outro em 5 anos)' },
      { tipo: 'imovel_residencial_180_dias', descricao: 'Venda de imóvel residencial com aplicação em outro imóvel residencial em até 180 dias — isento' },
      { tipo: 'acoes_bolsa', limite_mensal: 20000.00, descricao: 'Vendas de ações até R$ 20 mil/mês — isento (operações comuns)' }
    ],
    // Fator de redução para imóveis adquiridos até 1988
    fator_reducao_imoveis: {
      descricao: 'Imóveis adquiridos entre 1969 e 1988 têm redução do ganho',
      ate_1969: 'Isento (redução de 100%)',
      de_1969_a_1988: 'Redução de 5% ao ano (ex: 1980 = 40% de redução)'
    }
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // 8. RENDIMENTOS DE CAPITAL / APLICAÇÕES FINANCEIRAS
  // ═══════════════════════════════════════════════════════════════════════════

  const RENDIMENTOS_CAPITAL = {

    // ── Renda Fixa e Fundos de Longo Prazo (tabela regressiva) ──
    renda_fixa_longo_prazo: [
      { prazo: 'Até 180 dias',      aliquota: 0.225, descricao: '22,5%' },
      { prazo: '181 a 360 dias',    aliquota: 0.200, descricao: '20,0%' },
      { prazo: '361 a 720 dias',    aliquota: 0.175, descricao: '17,5%' },
      { prazo: 'Acima de 720 dias', aliquota: 0.150, descricao: '15,0%' }
    ],

    // ── Fundos de Curto Prazo ──
    fundos_curto_prazo: [
      { prazo: 'Até 180 dias',      aliquota: 0.225, descricao: '22,5%' },
      { prazo: 'Acima de 180 dias', aliquota: 0.200, descricao: '20,0%' }
    ],

    // ── Fundos de Ações ──
    fundos_acoes: { aliquota: 0.15, descricao: '15% fixo' },

    // ── Previdência Privada (PGBL/VGBL) — Tabela Regressiva ──
    previdencia_regressiva: [
      { prazo: 'Até 2 anos',      aliquota: 0.35, descricao: '35%' },
      { prazo: '2 a 4 anos',      aliquota: 0.30, descricao: '30%' },
      { prazo: '4 a 6 anos',      aliquota: 0.25, descricao: '25%' },
      { prazo: '6 a 8 anos',      aliquota: 0.20, descricao: '20%' },
      { prazo: '8 a 10 anos',     aliquota: 0.15, descricao: '15%' },
      { prazo: 'Acima de 10 anos', aliquota: 0.10, descricao: '10%' }
    ],

    // ── Renda Variável ──
    renda_variavel: {
      operacoes_comuns: { aliquota: 0.15, descricao: '15% sobre ganho líquido' },
      day_trade: { aliquota: 0.20, descricao: '20% sobre ganho líquido' },
      irrf_operacoes_comuns: { aliquota: 0.00005, descricao: '0,005% sobre vendas (dedo-duro)' },
      irrf_day_trade: { aliquota: 0.01, descricao: '1% sobre ganho líquido' },
      fii_rendimentos: { aliquota: 0.00, descricao: 'Isento (PF com < 10% das cotas, fundo com ≥ 50 cotistas em bolsa)' },
      fii_ganho_capital: { aliquota: 0.20, descricao: '20% sobre ganho na venda de cotas' }
    },

    // ── Rendimentos Isentos ──
    isentos: [
      'Poupança',
      'LCI e LCA',
      'CRI e CRA',
      'Debêntures incentivadas (Lei 12.431)',
      'Rendimentos de FIIs (PF, condições acima)',
      'Fiagro (mesmas regras de FII)'
    ]
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // 9. PLR — PARTICIPAÇÃO NOS LUCROS OU RESULTADOS
  // ═══════════════════════════════════════════════════════════════════════════

  const PLR = {
    descricao: 'Tributação exclusiva na fonte. Não soma com salário.',
    tabela: [
      { faixa: 1, ate:  8214.40, aliquota: 0.000, deducao:    0.00, descricao: 'Isento'  },
      { faixa: 2, ate:  9922.28, aliquota: 0.075, deducao:  616.08, descricao: '7,5%'    },
      { faixa: 3, ate: 13167.00, aliquota: 0.150, deducao: 1360.25, descricao: '15,0%'   },
      { faixa: 4, ate: 16380.38, aliquota: 0.225, deducao: 2347.78, descricao: '22,5%'   },
      { faixa: 5, ate: Infinity, aliquota: 0.275, deducao: 3166.80, descricao: '27,5%'   }
    ]
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // 10. OUTROS RENDIMENTOS TRIBUTÁVEIS
  // ═══════════════════════════════════════════════════════════════════════════

  const OUTROS_RENDIMENTOS = {
    premios_sorteios_dinheiro: { aliquota: 0.30, descricao: '30% — prêmios/sorteios em dinheiro' },
    premios_bens_servicos:     { aliquota: 0.20, descricao: '20% — prêmios em bens ou serviços' },
    apostas_loteria:           { aliquota: 0.15, descricao: '15% — prêmios líquidos de apostas/loteria' },
    apostas_online_bet:        { aliquota: 0.15, descricao: '15% — apuração anual sobre ganho líquido (ComprovaBet)' },
    servicos_propaganda:       { aliquota: 0.015, descricao: '1,5% — serviços de propaganda, comissões' },
    remessas_exterior:         { aliquota: 0.25, descricao: '25% — rendimentos pagos a não-residentes (regra geral)' },
    juros_sobre_capital_proprio: { aliquota: 0.15, descricao: '15% na fonte — JCP pago a sócio/acionista' },
    alugueis_pf: {
      descricao: 'Aluguéis recebidos por PF — carnê-leão pela tabela progressiva',
      tabela: 'Usa IRPF.tabela_mensal + redutor mensal se aplicável'
    }
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // 11. PRODUTOS MONOFÁSICOS (PIS/Cofins zerado na revenda)
  // ═══════════════════════════════════════════════════════════════════════════

  const PRODUTOS_MONOFASICOS = {
    descricao: 'Produtos cuja tributação de PIS/Cofins ocorre apenas na indústria/importador. Na revenda, alíquota zero.',
    impacto_simples: 'Empresas do Simples Nacional que revendem monofásicos podem excluir PIS/Cofins do DAS, reduzindo a carga.',
    categorias: [
      {
        grupo: 'Combustíveis e Derivados',
        ncm_exemplos: ['2710.12', '2710.19', '2711.19'],
        cnae_exemplos: ['4731-8/00'],
        descricao: 'Gasolina, diesel, álcool combustível, GLP'
      },
      {
        grupo: 'Produtos Farmacêuticos',
        ncm_exemplos: ['3003', '3004'],
        cnae_exemplos: ['4771-7/01'],
        descricao: 'Medicamentos, princípios ativos, fórmulas'
      },
      {
        grupo: 'Cosméticos e Perfumaria',
        ncm_exemplos: ['3303', '3304', '3305'],
        cnae_exemplos: ['4772-5/00'],
        descricao: 'Perfumes, maquiagem, produtos capilares'
      },
      {
        grupo: 'Bebidas Frias',
        ncm_exemplos: ['2201', '2202', '2203'],
        cnae_exemplos: ['4723-7/00'],
        descricao: 'Águas, refrigerantes, cervejas, isotônicos'
      },
      {
        grupo: 'Autopeças e Pneus',
        ncm_exemplos: ['4011', '8708'],
        cnae_exemplos: ['4530-7/03', '4530-7/05'],
        descricao: 'Peças automotivas, pneumáticos, câmaras-de-ar'
      },
      {
        grupo: 'Máquinas e Veículos',
        ncm_exemplos: ['8429', '8432', '8433', '8701', '8702'],
        cnae_exemplos: ['4511-1/01', '4512-9/01'],
        descricao: 'Veículos, máquinas agrícolas, implementos'
      },
      {
        grupo: 'Cigarros e Tabaco',
        ncm_exemplos: ['2402', '2403'],
        descricao: 'Cigarros, charutos, fumo'
      },
      {
        grupo: 'Produtos de Higiene Pessoal',
        ncm_exemplos: ['3306', '3307', '4818'],
        descricao: 'Produtos de higiene oral, papel higiênico, fraldas'
      }
    ]
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // 12. REFORMA TRIBUTÁRIA 2026 — CBS e IBS (EC 132/2023 + LC 214/2025)
  // ═══════════════════════════════════════════════════════════════════════════

  const REFORMA_TRIBUTARIA = {
    descricao: 'Transição para IVA Dual (CBS + IBS) substituindo PIS, Cofins, IPI, ICMS e ISS',

    // ── Fase de teste 2026 ──
    teste_2026: {
      cbs_aliquota: 0.009,                        // 0,9%
      ibs_aliquota: 0.001,                        // 0,1%
      total: 0.010,                               // 1,0%
      efetivamente_cobrado: false,                 // Não gera pagamento adicional
      descricao: 'Valores destacados em NF-e para teste. PIS/Cofins pagos compensam CBS.',
      obrigacao: 'Destaque obrigatório em documento fiscal a partir de jan/2026',
      inicio: '2026-01-01',
      fim: '2026-12-31'
    },

    // ── Cronograma completo ──
    cronograma: [
      { ano: 2026, evento: 'Fase de teste — CBS 0,9% + IBS 0,1% (não cobrado efetivamente)' },
      { ano: 2027, evento: 'Extinção de PIS e Cofins. CBS entra com alíquota plena. IPI zerado (exceto ZFM).' },
      { ano: 2029, evento: 'Início da transição IBS: redução de 10% de ICMS/ISS por ano' },
      { ano: 2030, evento: 'ICMS e ISS reduzidos em 20%' },
      { ano: 2031, evento: 'ICMS e ISS reduzidos em 30%' },
      { ano: 2032, evento: 'ICMS e ISS reduzidos em 40%' },
      { ano: 2033, evento: 'Extinção total de ICMS e ISS. IBS com alíquota plena.' }
    ],

    // ── Alíquota de referência prevista ──
    aliquota_referencia: {
      cbs_estimada: 0.088,                        // ~8,8% (estimativa Fazenda)
      ibs_estimado: 0.177,                        // ~17,7% (estimativa)
      total_estimado: 0.265,                      // ~26,5% (alíquota padrão combinada)
      nota: 'Alíquota de referência será definida por Resolução do Senado. Sujeita a ajuste.'
    },

    // ── Regimes especiais na reforma ──
    regimes_especiais: {
      simples_nacional: 'Mantido. Optantes podem aderir ao regime geral de CBS/IBS.',
      zona_franca_manaus: 'Mantida com incentivos até 2073.',
      cesta_basica_nacional: 'Alíquota zero de CBS e IBS para itens da Cesta Básica Nacional.',
      aliquota_reduzida_60: [
        'Educação', 'Saúde', 'Dispositivos médicos', 'Medicamentos genéricos',
        'Transporte coletivo', 'Produtos agropecuários in natura',
        'Insumos agropecuários', 'Higiene pessoal e limpeza'
      ],
      aliquota_reduzida_30: ['Profissões regulamentadas (advocacia, contabilidade, medicina, engenharia, etc.)'],
      cashback: 'Devolução de CBS/IBS para famílias de baixa renda (CadÚnico)'
    },

    // ── Fundo de Compensação ──
    fundo_compensacao: {
      descricao: 'Compensa empresas que perderem benefícios fiscais de ICMS na transição',
      vigencia: '2029 a 2032',
      financiamento: 'Recursos da União'
    }
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // 13. FUNÇÕES DE CÁLCULO
  // ═══════════════════════════════════════════════════════════════════════════

  const Calculos = {

    /**
     * Encontra a faixa correspondente em uma tabela progressiva
     * @param {number} valor - Valor a enquadrar
     * @param {Array} tabela - Array de faixas com propriedade 'ate' ou 'limite'
     * @returns {Object|null} Faixa encontrada
     */
    _encontrarFaixa: function (valor, tabela) {
      var campo = tabela[0].ate !== undefined ? 'ate' : 'limite';
      for (var i = 0; i < tabela.length; i++) {
        if (valor <= tabela[i][campo]) return tabela[i];
      }
      return tabela[tabela.length - 1];
    },

    // ── Simples Nacional ──

    /**
     * Calcula alíquota efetiva e DAS mensal do Simples Nacional
     * @param {number} rbt12 - Receita bruta acumulada nos últimos 12 meses
     * @param {string} anexo - 'ANEXO_I', 'ANEXO_II', etc.
     * @param {number} [receita_mensal] - Receita do mês para calcular DAS
     * @returns {Object} { faixa, aliquota_nominal, deducao, aliquota_efetiva, das_mensal, das_anual, reparticao }
     */
    calcularSimples: function (rbt12, anexo, receita_mensal) {
      var anx = SIMPLES_NACIONAL[anexo];
      if (!anx) return { erro: 'Anexo inválido: ' + anexo };
      if (rbt12 > PARAMETROS_GERAIS.teto_simples_nacional) return { erro: 'RBT12 acima do teto de R$ 4.800.000' };
      if (rbt12 <= 0) return { erro: 'RBT12 deve ser maior que zero' };

      var faixa = this._encontrarFaixa(rbt12, anx.faixas);
      var ae = ((rbt12 * faixa.aliquota) - faixa.deducao) / rbt12;
      ae = Math.max(0, ae);

      var rm = receita_mensal || (rbt12 / 12);
      var das_mensal = rm * ae;

      // Repartição dos tributos
      var rep = anx.reparticao ? anx.reparticao[faixa.faixa - 1] : null;
      var reparticao_valores = null;
      if (rep) {
        reparticao_valores = {
          irpj:   +(das_mensal * rep.irpj).toFixed(2),
          csll:   +(das_mensal * rep.csll).toFixed(2),
          cofins: +(das_mensal * rep.cofins).toFixed(2),
          pis:    +(das_mensal * rep.pis).toFixed(2),
          cpp:    +(das_mensal * rep.cpp).toFixed(2),
          icms:   +(das_mensal * rep.icms).toFixed(2),
          iss:    +(das_mensal * rep.iss).toFixed(2),
          ipi:    +(das_mensal * rep.ipi).toFixed(2)
        };
      }

      // Verificação sublimite
      var acima_sublimite = rbt12 > PARAMETROS_GERAIS.sublimite_icms_iss;

      return {
        anexo: anexo,
        faixa: faixa.faixa,
        rbt12: rbt12,
        aliquota_nominal: faixa.aliquota,
        deducao: faixa.deducao,
        aliquota_efetiva: +ae.toFixed(6),
        aliquota_efetiva_percentual: +(ae * 100).toFixed(4) + '%',
        receita_mensal: +rm.toFixed(2),
        das_mensal: +das_mensal.toFixed(2),
        das_anual: +(das_mensal * 12).toFixed(2),
        reparticao: reparticao_valores,
        acima_sublimite_icms_iss: acima_sublimite,
        nota_sublimite: acima_sublimite
          ? 'ICMS e ISS devem ser pagos fora do DAS, pelo regime normal do estado/município.'
          : null
      };
    },

    /**
     * Calcula o Fator R e determina se empresa do Anexo V migra para Anexo III
     * @param {number} folha_12m - Total da folha de salários nos últimos 12 meses
     * @param {number} rbt12 - Receita bruta dos últimos 12 meses
     * @returns {Object} { fator_r, anexo_aplicavel, migrou }
     */
    calcularFatorR: function (folha_12m, rbt12) {
      if (rbt12 <= 0) return { erro: 'RBT12 deve ser maior que zero' };
      var fr = folha_12m / rbt12;
      var migrou = fr >= SIMPLES_NACIONAL.fator_r.limite;
      return {
        fator_r: +fr.toFixed(4),
        fator_r_percentual: +(fr * 100).toFixed(2) + '%',
        limite: SIMPLES_NACIONAL.fator_r.limite,
        migrou: migrou,
        anexo_aplicavel: migrou ? 'ANEXO_III' : 'ANEXO_V',
        descricao: migrou
          ? 'Fator R >= 28% — tributação pelo Anexo III (mais vantajoso)'
          : 'Fator R < 28% — tributação permanece no Anexo V'
      };
    },

    // ── INSS Empregado (Progressivo) ──

    /**
     * Calcula INSS do empregado pelo método progressivo por faixas
     * @param {number} salario - Salário de contribuição
     * @returns {Object} { salario, contribuicao, aliquota_efetiva, detalhamento }
     */
    calcularINSSEmpregado: function (salario) {
      if (salario <= 0) return { erro: 'Salário deve ser maior que zero' };

      var tabela = INSS.tabela_empregado;
      var contribuicao = 0;
      var detalhamento = [];
      var anterior = 0;

      for (var i = 0; i < tabela.length; i++) {
        var faixa = tabela[i];
        var topo = Math.min(salario, faixa.ate);
        var base = topo - anterior;

        if (base > 0) {
          var valor = base * faixa.aliquota;
          contribuicao += valor;
          detalhamento.push({
            faixa: faixa.faixa,
            de: +anterior.toFixed(2),
            ate: +topo.toFixed(2),
            base: +base.toFixed(2),
            aliquota: faixa.aliquota,
            valor: +valor.toFixed(2)
          });
        }

        anterior = faixa.ate;
        if (salario <= faixa.ate) break;
      }

      // Limitar ao teto
      contribuicao = Math.min(contribuicao, INSS.contribuicao_maxima);
      var aliquota_efetiva = salario > 0 ? contribuicao / Math.min(salario, INSS.teto) : 0;

      return {
        salario: +salario.toFixed(2),
        salario_contribuicao: +Math.min(salario, INSS.teto).toFixed(2),
        contribuicao: +contribuicao.toFixed(2),
        aliquota_efetiva: +aliquota_efetiva.toFixed(6),
        aliquota_efetiva_percentual: +(aliquota_efetiva * 100).toFixed(2) + '%',
        acima_teto: salario > INSS.teto,
        detalhamento: detalhamento
      };
    },

    // ── IRPF Mensal (com redutor 2026) ──

    /**
     * Calcula IRPF mensal com redutor da Lei 15.270/2025
     * @param {number} rendimento_tributavel - Rendimento bruto mensal (antes das deduções, para checar redutor)
     * @param {Object} [opcoes] - { dependentes, inss, pensao, simplificado }
     * @returns {Object} Resultado completo do cálculo
     */
    calcularIRPFMensal: function (rendimento_tributavel, opcoes) {
      opcoes = opcoes || {};
      var dependentes = opcoes.dependentes || 0;
      var inss = opcoes.inss || 0;
      var pensao = opcoes.pensao || 0;
      var usar_simplificado = opcoes.simplificado !== false; // Padrão: usar

      // Base de cálculo
      var deducao_dependentes = dependentes * PARAMETROS_GERAIS.deducoes_irpf.dependente_mensal;
      var deducoes_legais = inss + pensao + deducao_dependentes;
      var desconto_simplificado = PARAMETROS_GERAIS.deducoes_irpf.desconto_simplificado_mensal;

      // Escolher o mais vantajoso
      var deducao_usada, tipo_deducao;
      if (usar_simplificado && desconto_simplificado > deducoes_legais) {
        deducao_usada = desconto_simplificado;
        tipo_deducao = 'simplificado';
      } else {
        deducao_usada = deducoes_legais;
        tipo_deducao = 'legal';
      }

      var base_calculo = Math.max(0, rendimento_tributavel - deducao_usada);

      // Cálculo pela tabela progressiva
      var faixa = this._encontrarFaixa(base_calculo, IRPF.tabela_mensal);
      var ir_tabela = Math.max(0, (base_calculo * faixa.aliquota) - faixa.deducao);

      // Aplicar redutor 2026
      var redutor = 0;
      var red = IRPF.redutor_mensal;

      if (rendimento_tributavel <= red.faixa_isencao_limite) {
        // Até R$ 5.000 → redutor de até R$ 312,89 (limitado ao IR calculado)
        redutor = Math.min(red.redutor_maximo, ir_tabela);
      } else if (rendimento_tributavel <= red.faixa_transicao_fim) {
        // R$ 5.000,01 a R$ 7.350 → fórmula decrescente
        redutor = red.formula_base - (red.formula_coeficiente * rendimento_tributavel);
        redutor = Math.max(0, Math.min(redutor, ir_tabela));
      }
      // Acima de R$ 7.350 → sem redutor

      var ir_final = +Math.max(0, ir_tabela - redutor).toFixed(2);

      return {
        rendimento_tributavel: +rendimento_tributavel.toFixed(2),
        tipo_deducao: tipo_deducao,
        deducao_usada: +deducao_usada.toFixed(2),
        base_calculo: +base_calculo.toFixed(2),
        faixa: faixa.faixa,
        aliquota_faixa: faixa.aliquota,
        ir_tabela_progressiva: +ir_tabela.toFixed(2),
        redutor_2026: +redutor.toFixed(2),
        ir_devido: ir_final,
        aliquota_efetiva: rendimento_tributavel > 0 ? +((ir_final / rendimento_tributavel) * 100).toFixed(2) + '%' : '0%',
        isento: ir_final <= 0
      };
    },

    // ── Lucro Presumido ──

    /**
     * Calcula tributos federais no Lucro Presumido
     * @param {number} receita_trimestral - Receita bruta do trimestre
     * @param {string} atividade - Chave da atividade (ex: 'comercio_geral', 'servicos_profissionais')
     * @returns {Object} Detalhamento completo dos tributos
     */
    calcularLucroPresumido: function (receita_trimestral, atividade) {
      var presuncao_irpj = LUCRO_PRESUMIDO.presuncao_irpj[atividade];
      if (!presuncao_irpj) return { erro: 'Atividade não encontrada: ' + atividade };

      // Determinar presunção CSLL
      var presuncao_csll = LUCRO_PRESUMIDO.presuncao_csll.regra_geral;
      if (LUCRO_PRESUMIDO.presuncao_csll[atividade]) {
        presuncao_csll = LUCRO_PRESUMIDO.presuncao_csll[atividade];
      }

      var base_irpj = receita_trimestral * presuncao_irpj;
      var base_csll = receita_trimestral * presuncao_csll;

      // IRPJ
      var irpj = base_irpj * LUCRO_PRESUMIDO.irpj.aliquota;
      var adicional = 0;
      if (base_irpj > LUCRO_PRESUMIDO.irpj.adicional_limite_trimestral) {
        adicional = (base_irpj - LUCRO_PRESUMIDO.irpj.adicional_limite_trimestral) * LUCRO_PRESUMIDO.irpj.adicional_aliquota;
      }

      // CSLL
      var csll = base_csll * LUCRO_PRESUMIDO.csll.aliquota;

      // PIS e Cofins (mensal, então × 3 para trimestral)
      var pis = receita_trimestral * LUCRO_PRESUMIDO.pis;
      var cofins = receita_trimestral * LUCRO_PRESUMIDO.cofins;

      var total = irpj + adicional + csll + pis + cofins;
      var carga_efetiva = receita_trimestral > 0 ? total / receita_trimestral : 0;

      return {
        receita_trimestral: +receita_trimestral.toFixed(2),
        atividade: atividade,
        presuncao_irpj: presuncao_irpj,
        presuncao_csll: presuncao_csll,
        base_irpj: +base_irpj.toFixed(2),
        base_csll: +base_csll.toFixed(2),
        irpj: +irpj.toFixed(2),
        adicional_irpj: +adicional.toFixed(2),
        csll: +csll.toFixed(2),
        pis: +pis.toFixed(2),
        cofins: +cofins.toFixed(2),
        total_tributos: +total.toFixed(2),
        carga_efetiva: +(carga_efetiva * 100).toFixed(2) + '%'
      };
    },

    // ── Ganho de Capital ──

    /**
     * Calcula IR sobre ganho de capital (pessoa física)
     * @param {number} ganho - Ganho de capital apurado
     * @returns {Object} { ganho, imposto, aliquota_efetiva }
     */
    calcularGanhoCapital: function (ganho) {
      if (ganho <= 0) return { ganho: 0, imposto: 0, aliquota_efetiva: '0%' };

      var tabela = GANHO_CAPITAL.tabela;
      var imposto = 0;
      var anterior = 0;

      for (var i = 0; i < tabela.length; i++) {
        var topo = Math.min(ganho, tabela[i].ate === Infinity ? ganho : tabela[i].ate);
        var base = topo - anterior;
        if (base > 0) {
          imposto += base * tabela[i].aliquota;
        }
        anterior = tabela[i].ate === Infinity ? ganho : tabela[i].ate;
        if (ganho <= tabela[i].ate) break;
      }

      return {
        ganho: +ganho.toFixed(2),
        imposto: +imposto.toFixed(2),
        aliquota_efetiva: ganho > 0 ? +((imposto / ganho) * 100).toFixed(2) + '%' : '0%'
      };
    },

    // ── IRPFM (Imposto Mínimo Alta Renda) ──

    /**
     * Calcula o IRPFM sobre altas rendas
     * @param {number} renda_anual - Soma de todos os rendimentos no ano
     * @returns {Object} { sujeito, aliquota, imposto_minimo }
     */
    calcularIRPFM: function (renda_anual) {
      var irpfm = IRPF.irpfm;
      if (renda_anual <= irpfm.limite_anual) {
        return { sujeito: false, renda_anual: renda_anual, aliquota: 0, imposto_minimo: 0 };
      }

      var aliquota;
      if (renda_anual >= irpfm.renda_aliquota_maxima) {
        aliquota = irpfm.aliquota_maxima;
      } else {
        // Progressivo: 10% × (renda - 600.000) / 600.000
        aliquota = irpfm.aliquota_maxima * (renda_anual - irpfm.limite_anual) / irpfm.limite_anual;
      }

      var imposto = renda_anual * aliquota;

      return {
        sujeito: true,
        renda_anual: +renda_anual.toFixed(2),
        aliquota: +aliquota.toFixed(6),
        aliquota_percentual: +(aliquota * 100).toFixed(2) + '%',
        imposto_minimo: +imposto.toFixed(2),
        nota: 'IR já retido na fonte (salários, dividendos) pode ser compensado.'
      };
    },

    // ── PLR ──

    /**
     * Calcula IR sobre PLR (tributação exclusiva na fonte)
     * @param {number} valor_plr - Valor bruto da PLR
     * @returns {Object} { valor_bruto, ir, valor_liquido }
     */
    calcularPLR: function (valor_plr) {
      var faixa = this._encontrarFaixa(valor_plr, PLR.tabela);
      var ir = Math.max(0, (valor_plr * faixa.aliquota) - faixa.deducao);
      return {
        valor_bruto: +valor_plr.toFixed(2),
        faixa: faixa.faixa,
        aliquota: faixa.aliquota,
        ir: +ir.toFixed(2),
        valor_liquido: +(valor_plr - ir).toFixed(2)
      };
    },

    // ── Custo Total do Empregado ──

    /**
     * Calcula custo total estimado de um empregado para a empresa
     * @param {number} salario - Salário bruto mensal
     * @param {Object} [opcoes] - { rat, fap, decimo_terceiro, ferias, provisao_rescisao }
     * @returns {Object} Detalhamento completo dos encargos
     */
    calcularCustoEmpregado: function (salario, opcoes) {
      opcoes = opcoes || {};
      var rat = opcoes.rat || INSS.patronal.rat.medio;
      var fap = opcoes.fap || 1.0;

      var inss_patronal = salario * INSS.patronal.inss_patronal;
      var rat_fap = salario * rat * fap;
      var terceiros = salario * INSS.patronal.terceiros.total_estimado;
      var fgts = salario * PARAMETROS_GERAIS.fgts.aliquota_padrao;

      // Provisões mensais
      var prov_13o = salario / 12;
      var prov_ferias = (salario / 12) * (4 / 3); // Férias + 1/3
      var encargos_sobre_provisoes = (prov_13o + prov_ferias) *
        (INSS.patronal.inss_patronal + rat * fap + INSS.patronal.terceiros.total_estimado + PARAMETROS_GERAIS.fgts.aliquota_padrao);

      var custo_total = salario + inss_patronal + rat_fap + terceiros + fgts + prov_13o + prov_ferias + encargos_sobre_provisoes;

      return {
        salario_bruto: +salario.toFixed(2),
        inss_patronal: +inss_patronal.toFixed(2),
        rat_fap: +rat_fap.toFixed(2),
        terceiros: +terceiros.toFixed(2),
        fgts: +fgts.toFixed(2),
        provisao_13o: +prov_13o.toFixed(2),
        provisao_ferias: +prov_ferias.toFixed(2),
        encargos_sobre_provisoes: +encargos_sobre_provisoes.toFixed(2),
        custo_total_mensal: +custo_total.toFixed(2),
        multiplicador: +(custo_total / salario).toFixed(4),
        custo_total_anual: +(custo_total * 12).toFixed(2)
      };
    },

    // ── Comparativo de Regimes ──

    /**
     * Compara carga tributária entre Simples, Presumido e Real
     * @param {number} receita_anual - Receita bruta anual
     * @param {string} atividade_presumido - Atividade para Lucro Presumido
     * @param {string} anexo_simples - Anexo do Simples Nacional
     * @param {number} [lucro_real_estimado] - Lucro contábil estimado para Lucro Real
     * @returns {Object} Comparativo com recomendação
     */
    compararRegimes: function (receita_anual, atividade_presumido, anexo_simples, lucro_real_estimado) {
      var resultado = { receita_anual: receita_anual, regimes: {} };

      // Simples Nacional
      if (receita_anual <= PARAMETROS_GERAIS.teto_simples_nacional) {
        var simples = this.calcularSimples(receita_anual, anexo_simples, receita_anual / 12);
        if (!simples.erro) {
          resultado.regimes.simples_nacional = {
            carga_anual: simples.das_anual,
            carga_percentual: simples.aliquota_efetiva_percentual
          };
        }
      }

      // Lucro Presumido
      if (receita_anual <= PARAMETROS_GERAIS.teto_lucro_presumido) {
        var presumido = this.calcularLucroPresumido(receita_anual, atividade_presumido);
        if (!presumido.erro) {
          resultado.regimes.lucro_presumido = {
            carga_anual: presumido.total_tributos,
            carga_percentual: presumido.carga_efetiva
          };
        }
      }

      // Lucro Real (se lucro estimado informado)
      if (lucro_real_estimado !== undefined) {
        var irpj_lr = lucro_real_estimado * LUCRO_REAL.irpj.aliquota;
        var adicional_lr = lucro_real_estimado > LUCRO_REAL.irpj.adicional_limite_anual
          ? (lucro_real_estimado - LUCRO_REAL.irpj.adicional_limite_anual) * LUCRO_REAL.irpj.adicional_aliquota
          : 0;
        var csll_lr = lucro_real_estimado * LUCRO_REAL.csll.aliquota_geral;
        var pis_lr = receita_anual * LUCRO_REAL.pis;
        var cofins_lr = receita_anual * LUCRO_REAL.cofins;
        var total_lr = irpj_lr + adicional_lr + csll_lr + pis_lr + cofins_lr;

        resultado.regimes.lucro_real = {
          carga_anual: +total_lr.toFixed(2),
          carga_percentual: +(total_lr / receita_anual * 100).toFixed(2) + '%',
          nota: 'Estimativa sem considerar créditos de PIS/Cofins. Carga real pode ser menor.'
        };
      }

      // Determinar melhor regime
      var melhor = null;
      var menor_carga = Infinity;
      for (var regime in resultado.regimes) {
        if (resultado.regimes[regime].carga_anual < menor_carga) {
          menor_carga = resultado.regimes[regime].carga_anual;
          melhor = regime;
        }
      }
      resultado.recomendacao = melhor;
      resultado.menor_carga_anual = +menor_carga.toFixed(2);

      return resultado;
    }
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // 14. INFORMAÇÕES DE VERSÃO
  // ═══════════════════════════════════════════════════════════════════════════

  const VERSAO = {
    versao: '2.0.0',
    data: '2026-02-08',
    autor: 'AGROGEO BRASIL — Inteligência Tributária',
    projeto: 'IMPOST — Inteligência em Modelagem de Otimização Tributária',

    changelog: [
      {
        versao: '2.0.0',
        data: '2026-02-08',
        mudancas: [
          'Reescrita completa — estrutura profissional para produção',
          'IRPF 2026: redutor Lei 15.270/2025 (isenção até R$ 5.000, transição até R$ 7.350)',
          'IRPFM: Imposto Mínimo sobre altas rendas (> R$ 600 mil/ano)',
          'Tributação de dividendos: 10% retenção sobre > R$ 50 mil/mês',
          'INSS: cálculo progressivo real por faixas (Portaria MPS/MF 13/2026)',
          'Simples Nacional: repartição completa por faixa para todos os 5 anexos',
          'Lucro Presumido: presunção separada para IRPJ e CSLL por atividade',
          'Lucro Real: créditos permitidos, modalidades de apuração',
          'Ganho de capital: tabela progressiva + isenções',
          'Rendimentos de capital: renda fixa, variável, FII, previdência',
          'Reforma Tributária: CBS/IBS teste 2026, cronograma completo, regimes especiais',
          'Encargos trabalhistas: FGTS, RAT/FAP, Sistema S, salário-família',
          'Monofásicos: categorias expandidas com NCM e CNAE',
          'Funções: Simples, IRPF, INSS, Presumido, Ganho Capital, IRPFM, PLR, Custo Empregado, Comparativo',
          'Redutor anual corrigido (fórmula e coeficientes verificados pela Receita Federal)',
          'Compatibilidade: CommonJS (Node.js) + Browser (script tag)'
        ]
      }
    ],

    fontes: [
      'LC 123/2006 — Simples Nacional',
      'Lei 15.270/2025 — Reforma da Renda (isenção IR até R$ 5.000)',
      'IN RFB 2299/2025 — Normas IRPF 2026',
      'Portaria Interministerial MPS/MF nº 13/2026 — INSS 2026',
      'EC 132/2023 + LC 214/2025 — Reforma Tributária CBS/IBS',
      'Lei 9.249/1995 — Lucro Presumido e Real',
      'Lei 9.250/1995 — IRPF (atualizada pela Lei 15.270/2025)',
      'Lei 13.259/2016 — Ganho de Capital progressivo',
      'Receita Federal do Brasil — gov.br/receitafederal'
    ]
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // EXPORTAÇÃO DO MÓDULO
  // ═══════════════════════════════════════════════════════════════════════════

  return {
    PARAMETROS_GERAIS:      PARAMETROS_GERAIS,
    SIMPLES_NACIONAL:       SIMPLES_NACIONAL,
    LUCRO_PRESUMIDO:        LUCRO_PRESUMIDO,
    LUCRO_REAL:             LUCRO_REAL,
    IRPF:                   IRPF,
    INSS:                   INSS,
    GANHO_CAPITAL:          GANHO_CAPITAL,
    RENDIMENTOS_CAPITAL:    RENDIMENTOS_CAPITAL,
    PLR:                    PLR,
    OUTROS_RENDIMENTOS:     OUTROS_RENDIMENTOS,
    PRODUTOS_MONOFASICOS:   PRODUTOS_MONOFASICOS,
    REFORMA_TRIBUTARIA:     REFORMA_TRIBUTARIA,
    Calculos:               Calculos,
    VERSAO:                 VERSAO
  };

});
