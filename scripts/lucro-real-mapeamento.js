/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  LUCRO REAL — MAPEAMENTO UNIFICADO DE DADOS  v1.0                         ║
 * ║  Fonte única de verdade para alimentar qualquer HTML ou JS                 ║
 * ║  Base Legal: RIR/2018 (Decreto 9.580/2018) + Lei 12.973/2014              ║
 * ║  Ano-Base: 2026                                                           ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 *
 * USO:
 *   <script src="lucro-real-mapeamento.js"></script>
 *   const dados = window.LucroRealMap;
 *
 *   // Exemplos:
 *   dados.aliquotas.irpj.normal           → 0.15
 *   dados.presuncoes.SERVICOS_GERAL       → { irpj: 0.32, csll: 0.32, ... }
 *   dados.adicoes[0].descricao            → "Custos/despesas não dedutíveis"
 *   dados.obrigacoes[0].obrigacao         → "LALUR"
 *   dados.darf.irpjMensal                 → "2362"
 *   dados.helpers.formatarMoeda(1234.56)  → "R$ 1.234,56"
 *   dados.calcular.irpj({...})            → { irpjDevido, ... }
 */

(function (root) {
  'use strict';

  const LR = {};

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. ALÍQUOTAS E CONSTANTES GLOBAIS
  // ═══════════════════════════════════════════════════════════════════════════

  LR.aliquotas = {
    irpj: {
      normal: 0.15,                      // Art. 225 — 15%
      adicional: 0.10,                   // Art. 225 §ú — 10%
      limiteAdicionalMes: 20000,         // R$ 20.000/mês
      limiteAdicionalTrimestre: 60000,   // R$ 60.000/trimestre
      limiteAdicionalAno: 240000,        // R$ 240.000/ano
      artigoBase: 'Art. 225 do RIR/2018'
    },
    csll: {
      geral: 0.09,                       // 9% para empresas em geral
      financeiras: 0.15,                 // 15% para instituições financeiras
      artigoBase: 'Lei 7.689/1988 + Lei 13.169/2015'
    },
    pisCofins: {
      pisNaoCumulativo: 0.0165,          // 1,65%
      cofinsNaoCumulativo: 0.076,        // 7,6%
      totalNaoCumulativo: 0.0925,        // 9,25%
      pisCumulativo: 0.0065,             // 0,65%
      cofinsCumulativo: 0.03,            // 3,0%
      totalCumulativo: 0.0365,           // 3,65%
      artigoBase: 'Lei 10.637/02 (PIS) + Lei 10.833/03 (COFINS)'
    },
    jcp: {
      irrfAliquota: 0.15,               // 15% IRRF na fonte
      limiteLucroLiquido: 0.50,          // 50% do lucro líquido
      limiteLucrosAcumulados: 0.50,      // 50% de lucros acumulados + reservas
      artigoBase: 'Art. 355-358 do RIR/2018'
    },
    compensacaoPrejuizo: {
      trava30: 0.30,                     // Art. 261, III — limite de 30%
      artigoBase: 'Art. 580-590 do RIR/2018'
    },
    retencaoFonte: {
      irrfServicos: 0.015,               // 1,5% sobre NF
      irrfServicos32: 0.048,             // 4,8% (15% × 32%) para Adm. Pública
      csrfTotal: 0.0465,                 // 4,65% (PIS 0,65% + COFINS 3% + CSLL 1%)
      csrfPis: 0.0065,
      csrfCofins: 0.03,
      csrfCsll: 0.01,
      admPublicaTotal: 0.0945,           // 9,45% retenção combinada
      artigoBase: 'Art. 714-786 do RIR/2018 + Lei 10.833/03'
    },
    issRetido: {
      minima: 0.02,                      // 2% (piso constitucional)
      maxima: 0.05,                      // 5%
      novoProgresso: 0.05,               // 5% em Novo Progresso-PA
      artigoBase: 'LC 116/2003, art. 3º e 6º'
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. LIMITES E OBRIGATORIEDADE
  // ═══════════════════════════════════════════════════════════════════════════

  LR.limites = {
    receitaObrigatoriedade: 78000000,    // Art. 257, I — R$ 78 milhões
    ativoDespesaDireta: 1200,            // Art. 313 §1º — R$ 1.200
    dispensaCSRF: 10,                    // CSRF dispensada se ≤ R$ 10
    artigoBase: 'Art. 257 do RIR/2018'
  };

  LR.obrigatoriedadeLucroReal = {
    artigo: 'Art. 257',
    hipoteses: [
      { id: 'RECEITA', inciso: 'I', descricao: 'Receita total ano anterior > R$ 78 milhões', valor: 78000000 },
      { id: 'FINANCEIRA', inciso: 'II', descricao: 'Instituições financeiras (bancos, seguradoras, financeiras)' },
      { id: 'LUCRO_EXTERIOR', inciso: 'III', descricao: 'Lucros, rendimentos ou ganhos de capital oriundos do exterior' },
      { id: 'BENEFICIO_FISCAL', inciso: 'IV', descricao: 'Benefício fiscal de isenção ou redução do imposto (ex: SUDAM/SUDENE)' },
      { id: 'ESTIMATIVA', inciso: 'V', descricao: 'Optou por pagamento por estimativa mensal (lucro real anual)' },
      { id: 'FACTORING', inciso: 'VI', descricao: 'Factoring / assessoria creditícia' },
      { id: 'SECURITIZADORA', inciso: 'VII', descricao: 'Securitizadora de créditos imobiliários, financeiros ou do agronegócio' }
    ]
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. TRIMESTRES E PERÍODOS
  // ═══════════════════════════════════════════════════════════════════════════

  LR.trimestres = [
    { numero: 1, nome: '1º Trimestre', inicio: '01-01', fim: '03-31', meses: [1, 2, 3], vencimentoDARF: '30/04' },
    { numero: 2, nome: '2º Trimestre', inicio: '04-01', fim: '06-30', meses: [4, 5, 6], vencimentoDARF: '31/07' },
    { numero: 3, nome: '3º Trimestre', inicio: '07-01', fim: '09-30', meses: [7, 8, 9], vencimentoDARF: '31/10' },
    { numero: 4, nome: '4º Trimestre', inicio: '10-01', fim: '12-31', meses: [10, 11, 12], vencimentoDARF: '31/01 do ano seguinte' }
  ];

  LR.meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. PRESUNÇÕES (ESTIMATIVA MENSAL / LUCRO PRESUMIDO)
  // ═══════════════════════════════════════════════════════════════════════════

  LR.presuncoes = {
    COMERCIO_INDUSTRIA: {
      label: 'Comércio / Indústria / Transporte de Carga',
      irpj: 0.08, csll: 0.12,
      aliquotaEfetivaIRPJ: 0.012, aliquotaEfetivaCSLL: 0.0108,
      artigo: 'Art. 220, caput'
    },
    REVENDA_COMBUSTIVEIS: {
      label: 'Revenda de Combustíveis',
      irpj: 0.016, csll: 0.12,
      aliquotaEfetivaIRPJ: 0.0024, aliquotaEfetivaCSLL: 0.0108,
      artigo: 'Art. 220, §1º, I'
    },
    TRANSPORTE_PASSAGEIROS: {
      label: 'Transporte de Passageiros',
      irpj: 0.16, csll: 0.12,
      aliquotaEfetivaIRPJ: 0.024, aliquotaEfetivaCSLL: 0.0108,
      artigo: 'Art. 220, §1º, II, a'
    },
    INSTITUICOES_FINANCEIRAS: {
      label: 'Instituições Financeiras',
      irpj: 0.16, csll: 0.12,
      aliquotaEfetivaIRPJ: 0.024, aliquotaEfetivaCSLL: 0.0108,
      artigo: 'Art. 220, §1º, II, b + Art. 223'
    },
    SERVICOS_GERAL: {
      label: 'Prestação de Serviços em Geral',
      irpj: 0.32, csll: 0.32,
      aliquotaEfetivaIRPJ: 0.048, aliquotaEfetivaCSLL: 0.0288,
      artigo: 'Art. 220, §1º, III, a'
    },
    SERVICOS_HOSPITALARES: {
      label: 'Serviços Hospitalares',
      irpj: 0.08, csll: 0.12,
      aliquotaEfetivaIRPJ: 0.012, aliquotaEfetivaCSLL: 0.0108,
      artigo: 'Art. 220, §2º',
      requisitos: ['Sociedade empresária', 'Atender normas ANVISA']
    },
    INTERMEDIACAO_NEGOCIOS: {
      label: 'Intermediação de Negócios',
      irpj: 0.32, csll: 0.32,
      aliquotaEfetivaIRPJ: 0.048, aliquotaEfetivaCSLL: 0.0288,
      artigo: 'Art. 220, §1º, III, b'
    },
    ADMINISTRACAO_LOCACAO: {
      label: 'Administração / Locação / Cessão de Bens',
      irpj: 0.32, csll: 0.32,
      aliquotaEfetivaIRPJ: 0.048, aliquotaEfetivaCSLL: 0.0288,
      artigo: 'Art. 220, §1º, III, c'
    },
    FACTORING: {
      label: 'Factoring / Assessoria Creditícia',
      irpj: 0.32, csll: 0.32,
      aliquotaEfetivaIRPJ: 0.048, aliquotaEfetivaCSLL: 0.0288,
      artigo: 'Art. 220, §1º, III, d'
    },
    CONSTRUCAO_CONCESSAO: {
      label: 'Construção vinculada a Concessão',
      irpj: 0.32, csll: 0.32,
      aliquotaEfetivaIRPJ: 0.048, aliquotaEfetivaCSLL: 0.0288,
      artigo: 'Art. 220, §1º, III, e'
    },
    SERVICOS_ATE_120K: {
      label: 'Serviços até R$ 120.000/ano (IRPJ reduzido)',
      irpj: 0.16, csll: 0.32,
      aliquotaEfetivaIRPJ: 0.024, aliquotaEfetivaCSLL: 0.0288,
      artigo: 'Art. 220, §4º',
      requisitos: ['Receita bruta anual ≤ R$ 120.000', 'Não hospitalar', 'Não profissão regulamentada']
    },
    ATIVIDADE_IMOBILIARIA: {
      label: 'Atividade Imobiliária',
      irpj: 0.08, csll: 0.12,
      aliquotaEfetivaIRPJ: 0.012, aliquotaEfetivaCSLL: 0.0108,
      artigo: 'Art. 220, §7º + Art. 224',
      nota: 'Receita = montante efetivamente recebido (regime de caixa)'
    },
    TRANSPORTE_CARGA: {
      label: 'Transporte de Carga',
      irpj: 0.08, csll: 0.12,
      aliquotaEfetivaIRPJ: 0.012, aliquotaEfetivaCSLL: 0.0108,
      artigo: 'Art. 220, caput'
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. ADIÇÕES AO LUCRO LÍQUIDO (Art. 260)
  // ═══════════════════════════════════════════════════════════════════════════

  LR.adicoes = [
    { id: 1,  descricao: 'Custos/despesas/encargos não dedutíveis', artigo: 'Art. 260, I', tipo: 'D', estrategia: 'Revisar classificação contábil; reclassificar se possível' },
    { id: 2,  descricao: 'Resultados/receitas não incluídos no LL mas tributáveis', artigo: 'Art. 260, II', tipo: 'D', estrategia: 'Garantir que todas as receitas estejam na contabilidade' },
    { id: 3,  descricao: 'Quantias de lucros/fundos não tributados p/ aumento de capital', artigo: 'Art. 260, §ú, I', tipo: 'D', estrategia: 'Planejar distribuição de lucros tributados' },
    { id: 4,  descricao: 'Pagamentos a soc. simples controlada por diretores/parentes', artigo: 'Art. 260, §ú, II', tipo: 'D', estrategia: 'Evitar pagamentos a sociedades controladas por diretores' },
    { id: 5,  descricao: 'Perdas em operações day-trade', artigo: 'Art. 260, §ú, III', tipo: 'C', estrategia: 'Compensar apenas com ganhos day-trade (Art. 261, IV)' },
    { id: 6,  descricao: 'Alimentação de sócios, acionistas e administradores', artigo: 'Art. 260, §ú, IV', tipo: 'D', estrategia: 'Usar PAT para alimentação dedutível' },
    { id: 7,  descricao: 'Contribuições não compulsórias (exceto seguro/saúde/previdência)', artigo: 'Art. 260, §ú, V', tipo: 'D', estrategia: 'Direcionar para planos de saúde/previdência (dedutíveis)' },
    { id: 8,  descricao: 'Doações não enquadradas nos Art. 377/385', artigo: 'Art. 260, §ú, VI', tipo: 'D', estrategia: 'Doar dentro dos limites legais (até 2% lucro operacional)' },
    { id: 9,  descricao: 'Despesas com brindes', artigo: 'Art. 260, §ú, VII', tipo: 'D', estrategia: 'Reclassificar como material de propaganda se possível' },
    { id: 10, descricao: 'CSLL registrada como despesa operacional', artigo: 'Art. 260, §ú, VIII', tipo: 'D', estrategia: 'Inevitável — CSLL nunca é dedutível do IRPJ' },
    { id: 11, descricao: 'Perdas em renda variável/swap que excedem ganhos', artigo: 'Art. 260, §ú, IX', tipo: 'T', estrategia: 'Controlar Parte B do LALUR; compensar com ganhos futuros' },
    { id: 12, descricao: 'Receitas de previdência complementar (regime competência)', artigo: 'Art. 260, §ú, X', tipo: 'T', estrategia: 'Excluir na realização (Art. 261, VI)' },
    { id: 13, descricao: 'Resultados negativos de cooperativas com não-associados', artigo: 'Art. 260, §ú, XI', tipo: 'D', estrategia: 'Segregar atos cooperativos dos não-cooperativos' },
    { id: 14, descricao: 'Depreciação/amortização após atingir custo de aquisição', artigo: 'Art. 260, §ú, XII', tipo: 'D', estrategia: 'Controlar depreciação acumulada por bem' },
    { id: 15, descricao: 'Saldo de depreciação acelerada incentivada na alienação', artigo: 'Art. 260, §ú, XIII', tipo: 'T', estrategia: 'Planejar alienação considerando saldo' },
    { id: 16, descricao: 'Multas por infrações fiscais (punitivas)', artigo: 'Art. 311, §5º', tipo: 'D', estrategia: 'Distinguir multas compensatórias (dedutíveis) de punitivas' },
    { id: 17, descricao: 'Provisões não dedutíveis (exceto férias, 13º, PDD)', artigo: 'Art. 340-352', tipo: 'T', estrategia: 'Reverter quando liquidada → exclusão futura' },
    { id: 18, descricao: 'Resultado negativo de equivalência patrimonial (MEP)', artigo: 'Art. 389', tipo: 'T', estrategia: 'Controlado na Parte B; excluir na realização' },
    { id: 19, descricao: 'Gratificações a administradores', artigo: 'Art. 358, §1º', tipo: 'D', estrategia: 'Converter em pró-labore (dedutível) ou JCP' },
    { id: 20, descricao: 'Pagamento sem causa / beneficiário não identificado', artigo: 'Art. 674', tipo: 'D', estrategia: 'SEMPRE identificar beneficiário; tributação 35%' },
    { id: 21, descricao: 'Excesso de JCP acima dos limites legais', artigo: 'Art. 355-358', tipo: 'D', estrategia: 'Calcular JCP dentro dos limites PL × TJLP e 50%' },
    { id: 22, descricao: 'Depreciação contábil acima das taxas fiscais', artigo: 'Art. 311-323', tipo: 'T', estrategia: 'Usar taxas fiscais = contábeis; controlar diferença' },
    { id: 23, descricao: 'Despesas com tributos contestados (sem depósito judicial)', artigo: 'Art. 311, §2º', tipo: 'T', estrategia: 'Depositar judicialmente permite dedução imediata' },
    { id: 24, descricao: 'Royalties pagos acima dos limites a vinculadas', artigo: 'Art. 362-365', tipo: 'D', estrategia: 'Respeitar limites de dedutibilidade' },
    { id: 25, descricao: 'Excesso de preço de transferência (importações vinculadas)', artigo: 'Art. 242, §8º', tipo: 'D', estrategia: 'Documentar preços com métodos PIC, PRL ou CPL' },
    { id: 26, descricao: 'Juros de subcapitalização acima dos limites', artigo: 'Art. 250-251', tipo: 'D', estrategia: 'Manter dívida/PL dentro dos limites (2:1 / 0.3:1)' },
    { id: 27, descricao: 'Despesas não comprovadas ou sem documentação', artigo: 'Art. 311', tipo: 'D', estrategia: 'Sempre manter documentação fiscal completa' },
    { id: 28, descricao: 'Perdas em créditos não enquadradas nos critérios legais', artigo: 'Art. 340-345', tipo: 'D', estrategia: 'Enquadrar perdas nos critérios da PDD fiscal' }
  ];
  // tipo: D = definitiva, T = temporária, C = condicional

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. EXCLUSÕES DO LUCRO LÍQUIDO (Art. 261)
  // ═══════════════════════════════════════════════════════════════════════════

  LR.exclusoes = [
    { id: 1,  descricao: 'Valores dedutíveis não computados no lucro líquido', artigo: 'Art. 261, I', tipo: 'D', economia: 'Até 25% do valor' },
    { id: 2,  descricao: 'Resultados/receitas incluídos no LL mas não tributáveis', artigo: 'Art. 261, II', tipo: 'D', economia: 'Até 25% do valor' },
    { id: 3,  descricao: 'Compensação de prejuízos fiscais (trava 30%)', artigo: 'Art. 261, III', tipo: 'D', economia: 'Até 7,5% do lucro ajustado' },
    { id: 4,  descricao: 'Rendimentos de reforma agrária (desapropriação)', artigo: 'Art. 261, §ú, I', tipo: 'D', economia: '25% do ganho' },
    { id: 5,  descricao: 'Dividendos do FND', artigo: 'Art. 261, §ú, II', tipo: 'D', economia: '25% dos dividendos' },
    { id: 6,  descricao: 'Juros reais de NTN (PND) — na realização', artigo: 'Art. 261, §ú, III', tipo: 'T', economia: '25% dos juros' },
    { id: 7,  descricao: 'Perdas variável/swap adicionadas anteriormente', artigo: 'Art. 261, §ú, IV', tipo: 'T', economia: '25% das perdas recuperadas' },
    { id: 8,  descricao: 'Reversão de provisões não dedutíveis', artigo: 'Art. 261, §ú, V', tipo: 'T', economia: '25% da reversão' },
    { id: 9,  descricao: 'Receitas previdência complementar (na realização)', artigo: 'Art. 261, §ú, VI', tipo: 'T', economia: '25% do valor' },
    { id: 10, descricao: 'Compensação fiscal — horário gratuito rádio/TV', artigo: 'Art. 261, §ú, VII', tipo: 'D', economia: '25%' },
    { id: 11, descricao: 'Créditos de ICMS/ISS (programas nota fiscal)', artigo: 'Art. 261, §ú, VIII', tipo: 'D', economia: '25% dos créditos' },
    { id: 12, descricao: 'Redução multas/juros (REFIS/parcelamentos)', artigo: 'Art. 261, §ú, IX', tipo: 'D', economia: '25% da redução' },
    { id: 13, descricao: 'Quotas fundo cobertura seguro rural', artigo: 'Art. 261, §ú, X', tipo: 'D', economia: '25%' },
    { id: 14, descricao: 'Crédito presumido IPI — Inovar-Auto', artigo: 'Art. 261, §ú, XI', tipo: 'D', economia: '25%' },
    { id: 15, descricao: 'Resultado positivo de equivalência patrimonial (MEP)', artigo: 'Art. 389', tipo: 'D', economia: '25% do MEP positivo' },
    { id: 16, descricao: 'Lucros e dividendos recebidos de PJ brasileira', artigo: 'Art. 261, II + Lei 9.249, Art. 10', tipo: 'D', economia: '25%', nota: 'Verificar LC 214/2025' },
    { id: 17, descricao: 'Depreciação acelerada incentivada (SUDAM/SUDENE)', artigo: 'Art. 324-328', tipo: 'T', economia: 'Antecipação de 25% do valor do bem' },
    { id: 18, descricao: 'Subvenção para investimento', artigo: 'Art. 261, II + Lei 12.973, Art. 30', tipo: 'C', economia: '25%', nota: 'Verificar Lei 14.789/2023' },
    { id: 19, descricao: 'Ganho de capital diferido — permuta imobiliária', artigo: 'Art. 261, II', tipo: 'T', economia: '25% do ganho diferido' }
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. DEPRECIAÇÃO FISCAL (Art. 311-330)
  // ═══════════════════════════════════════════════════════════════════════════

  LR.depreciacao = {
    tabela: [
      { bem: 'Edifícios e construções',  taxaAnual: 0.04,  vidaUtil: 25 },
      { bem: 'Instalações',              taxaAnual: 0.10,  vidaUtil: 10 },
      { bem: 'Máquinas e equipamentos',  taxaAnual: 0.10,  vidaUtil: 10 },
      { bem: 'Móveis e utensílios',      taxaAnual: 0.10,  vidaUtil: 10 },
      { bem: 'Veículos de passageiros',  taxaAnual: 0.20,  vidaUtil: 5 },
      { bem: 'Veículos de carga',        taxaAnual: 0.20,  vidaUtil: 5 },
      { bem: 'Computadores/periféricos', taxaAnual: 0.20,  vidaUtil: 5 },
      { bem: 'Software (adquirido)',     taxaAnual: 0.20,  vidaUtil: 5 },
      { bem: 'Equipamentos comunicação', taxaAnual: 0.10,  vidaUtil: 10 },
      { bem: 'Ferramentas',             taxaAnual: 0.20,  vidaUtil: 5 },
      { bem: 'Tratores',                taxaAnual: 0.25,  vidaUtil: 4 },
      { bem: 'Semoventes/rebanho',       taxaAnual: 0.20,  vidaUtil: 5 },
      { bem: 'Drones',                  taxaAnual: 0.20,  vidaUtil: 5 },
      { bem: 'GPS / Topografia',         taxaAnual: 0.20,  vidaUtil: 5 }
    ],
    aceleracaoTurnos: [
      { turno: 1, horas: 8,  multiplicador: 1.0, artigo: 'Art. 323, I' },
      { turno: 2, horas: 16, multiplicador: 1.5, artigo: 'Art. 323, II' },
      { turno: 3, horas: 24, multiplicador: 2.0, artigo: 'Art. 323, III' }
    ],
    bensUsados: {
      artigo: 'Art. 322',
      regra: 'Vida útil = MAX(metade da vida útil normal, restante da vida útil)'
    },
    aceleradaIncentivada: {
      atividadeRural: { taxa: 1.0, artigo: 'Art. 325', descricao: 'Integral no ano (exceto terra nua)' },
      pesquisaInovacao: { taxa: 1.0, artigo: 'Art. 326', descricao: 'Integral no ano — máquinas novas P&D' },
      sudamSudene: { taxa: 1.0, artigo: 'Art. 329', descricao: 'Integral no ano ou até 4º ano subsequente' }
    },
    limiteAtivoDespesa: 1200,
    artigoBase: 'Art. 311-330 do RIR/2018'
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. INCENTIVOS FISCAIS (Art. 226/228/625-646)
  // ═══════════════════════════════════════════════════════════════════════════

  LR.incentivos = [
    { id: 'PAT',              label: 'Programa de Alimentação do Trabalhador', limiteIRPJ: 0.04, artigo: 'Art. 226, I + Art. 641-646', requisitos: ['Registro no MTE', 'Até 5 SM'] },
    { id: 'FIA',              label: 'Fundo da Criança e do Adolescente', limiteIRPJ: 0.01, artigo: 'Art. 226, II + Art. 636' },
    { id: 'FUNDO_IDOSO',      label: 'Fundo do Idoso', limiteIRPJ: 0.01, artigo: 'Art. 226, II + Lei 12.213/10' },
    { id: 'ROUANET',          label: 'Lei Rouanet — Atividades Culturais', limiteIRPJ: 0.04, artigo: 'Art. 226, III + Lei 8.313/91' },
    { id: 'VALE_CULTURA',     label: 'Vale-Cultura', limiteIRPJ: 0.01, artigo: 'Art. 226, IV + Lei 12.761/12' },
    { id: 'AUDIOVISUAL',      label: 'Atividades Audiovisuais (FUNCINES)', limiteIRPJ: 0.03, artigo: 'Art. 226, V' },
    { id: 'ESPORTE',          label: 'Lei do Esporte', limiteIRPJ: 0.01, artigo: 'Art. 226, VI + Lei 11.438/06' },
    { id: 'LICENCA_MATERNIDADE', label: 'Prorrogação Licença-Maternidade (Empresa Cidadã)', limiteIRPJ: null, artigo: 'Art. 226, VII + Lei 11.770/08' },
    { id: 'PRONON',           label: 'PRONON — Apoio à Oncologia', limiteIRPJ: 0.01, artigo: 'Art. 628 + Lei 12.715/12' },
    { id: 'PRONAS_PCD',       label: 'PRONAS/PCD — Pessoa com Deficiência', limiteIRPJ: 0.01, artigo: 'Art. 628 + Lei 12.715/12' },
    { id: 'PD_LEI_BEM',       label: 'P&D — Lei do Bem', limiteIRPJ: null, artigo: 'Lei 11.196/05', nota: 'Exclusão de 60% a 80% dos dispêndios da base IRPJ/CSLL' }
  ];

  LR.limiteGlobalIncentivos = {
    artigo: 'Art. 625',
    regra: 'Soma dos incentivos ≤ percentual do IRPJ normal (sem adicional)',
    nota: 'Cada incentivo tem seu limite individual dentro do global'
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. SUBCAPITALIZAÇÃO (Art. 249-251)
  // ═══════════════════════════════════════════════════════════════════════════

  LR.subcapitalizacao = {
    vinculadaComParticipacao: { limiteDividaPL: 2.0, artigo: 'Art. 250, I', descricao: 'Dívida ≤ 2× participação da vinculada no PL' },
    vinculadaSemParticipacao: { limiteDividaPL: 2.0, artigo: 'Art. 250, II', descricao: 'Dívida ≤ 2× PL total' },
    somatorioVinculadas:      { limiteDividaPL: 2.0, artigo: 'Art. 250, III', descricao: 'Total ≤ 2× somatório participações' },
    paraisoFiscal:            { limiteDividaPL: 0.30, artigo: 'Art. 251', descricao: 'Dívida ≤ 30% do PL' }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. OBRIGAÇÕES ACESSÓRIAS (Art. 262-287)
  // ═══════════════════════════════════════════════════════════════════════════

  LR.obrigacoes = [
    { obrigacao: 'LALUR',           artigo: 'Art. 277', prazo: 'Anual (via ECF)',     digital: true, descricao: 'Parte A: ajustes | Parte B: controle de valores' },
    { obrigacao: 'Livro Diário',    artigo: 'Art. 273', prazo: 'Contínuo (SPED ECD)', digital: true, descricao: 'Todas as operações dia a dia' },
    { obrigacao: 'Livro Razão',     artigo: 'Art. 274', prazo: 'Contínuo (SPED ECD)', digital: true, descricao: 'Totalização por conta. Ausência = arbitramento' },
    { obrigacao: 'Registro Inventário', artigo: 'Art. 275-276', prazo: 'Final período apuração', digital: true, descricao: 'Arrolamento de mercadorias/produtos' },
    { obrigacao: 'Registro Entradas', artigo: 'Art. 275, II', prazo: 'Contínuo', digital: true, descricao: 'Compras de mercadorias e matérias-primas' },
    { obrigacao: 'Apuração ICMS',   artigo: 'Art. 275, IV', prazo: 'Mensal', digital: true, descricao: 'Apuração do ICMS' },
    { obrigacao: 'ECF',             artigo: 'IN RFB 1.422/13', prazo: 'Anual (último dia útil de julho)', digital: true, descricao: 'Escrituração Contábil Fiscal — substitui DIPJ' },
    { obrigacao: 'ECD',             artigo: 'IN RFB 1.420/13', prazo: 'Anual (último dia útil de maio)', digital: true, descricao: 'Escrituração Contábil Digital (SPED Contábil)' },
    { obrigacao: 'EFD-Contribuições', artigo: 'IN RFB 1.252/12', prazo: 'Mensal (10º dia útil do 2º mês)', digital: true, descricao: 'PIS/COFINS — créditos e débitos' },
    { obrigacao: 'DCTF',            artigo: 'IN RFB 1.599/15', prazo: 'Mensal (15º dia útil do 2º mês)', digital: true, descricao: 'Declaração de Débitos e Créditos Tributários Federais' }
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. CÓDIGOS DARF
  // ═══════════════════════════════════════════════════════════════════════════

  LR.darf = {
    // IRPJ
    irpjMensal:            { codigo: '2362', descricao: 'IRPJ — Estimativa Mensal' },
    irpjTrimestral:        { codigo: '0220', descricao: 'IRPJ — Apuração Trimestral' },
    irpjAnualAjuste:       { codigo: '2430', descricao: 'IRPJ — Ajuste Anual' },
    // CSLL
    csllMensal:            { codigo: '2484', descricao: 'CSLL — Estimativa Mensal' },
    csllTrimestral:        { codigo: '6012', descricao: 'CSLL — Apuração Trimestral' },
    csllAnualAjuste:       { codigo: '6773', descricao: 'CSLL — Ajuste Anual' },
    // PIS/COFINS
    pisNaoCumulativo:      { codigo: '6912', descricao: 'PIS — Não-Cumulativo' },
    cofinsNaoCumulativo:   { codigo: '5856', descricao: 'COFINS — Não-Cumulativo' },
    // Retenções
    irrfServicos:          { codigo: '1708', descricao: 'IRRF — Serviços PJ a PJ (1,5%)' },
    irrfServicosPF:        { codigo: '0588', descricao: 'IRRF — Rendimentos do Trabalho' },
    irrfAdmPublica:        { codigo: '1708', descricao: 'IRRF — Adm. Pública' },
    csrfPis:               { codigo: '5979', descricao: 'PIS Retido — CSRF' },
    csrfCofins:            { codigo: '5960', descricao: 'COFINS Retido — CSRF' },
    csrfCsll:              { codigo: '5987', descricao: 'CSLL Retido — CSRF' },
    csrfUnificado:         { codigo: '5952', descricao: 'CSRF Unificado — Adm. Pública' },
    // JCP
    jcpIrrf:               { codigo: '5706', descricao: 'IRRF — JCP (15%)' },
    // Outros
    beneficiarioNaoId:     { codigo: '2063', descricao: 'IRRF — Beneficiário Não Identificado (35%)' }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. RETENÇÕES NA FONTE (Bloco G)
  // ═══════════════════════════════════════════════════════════════════════════

  LR.retencoes = {
    irrfServicosPJ: {
      artigo: 'Art. 714',
      aliquota: 0.015,
      tratamento: 'ANTECIPAÇÃO',
      descricao: '1,5% sobre serviços profissionais (lista completa no Art. 714)',
      dispensa: 'Optantes Simples Nacional, pagamentos até R$ 10,00'
    },
    irrfAdmPublica: {
      artigo: 'Art. 720 + IN RFB 1.234/12',
      aliquota: 0.048,
      descricao: '4,8% (15% × 32%) para serviços prestados a órgãos públicos',
      tratamento: 'ANTECIPAÇÃO'
    },
    csrf: {
      artigo: 'Lei 10.833/03, art. 30-36',
      aliquotas: { pis: 0.0065, cofins: 0.03, csll: 0.01, total: 0.0465 },
      servicosSujeitos: [
        'Serviços profissionais (lista Art. 714)',
        'Limpeza, conservação, manutenção',
        'Segurança e vigilância',
        'Locação de mão-de-obra',
        'Assessoria creditícia e mercadológica',
        'Transporte de valores'
      ],
      dispensas: {
        simplesNacional: true,
        valorMinimo: 10,
        descricao: 'Dispensada se retenção ≤ R$ 10 ou optante Simples Nacional'
      },
      tratamento: 'Cada contribuição compensa apenas com ela mesma (PIS→PIS, COFINS→COFINS, CSLL→CSLL)'
    },
    beneficiarioNaoIdentificado: {
      artigo: 'Art. 730-731',
      aliquota: 0.35,
      tratamento: 'EXCLUSIVAMENTE NA FONTE',
      formulaBruto: 'Bruto = Líquido / 0,65'
    },
    jcp: {
      artigo: 'Art. 726 + Art. 355-358',
      aliquota: 0.15,
      tratamento: 'ANTECIPAÇÃO (compensável com IRPJ devido)'
    },
    dividendos: {
      artigo: 'Art. 725 + Lei 9.249, Art. 10',
      aliquota: 0,
      descricao: 'Lucros/dividendos apurados a partir de jan/1996 — ISENTOS'
    },
    iss: {
      artigo: 'LC 116/2003',
      aliquotaMin: 0.02,
      aliquotaMax: 0.05,
      novoProgresso: 0.05,
      nota: 'ISS NÃO deduz do IRPJ — é tributo municipal tratado na DRE'
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 13. SUDAM / SUDENE / INCENTIVOS REGIONAIS (Bloco E)
  // ═══════════════════════════════════════════════════════════════════════════

  LR.sudam = {
    artigo: 'Art. 630-633',
    lei: 'LC 124/2007',
    estados: ['AC', 'AP', 'AM', 'MA', 'MT', 'PA', 'RO', 'RR', 'TO'],
    descricao: 'Amazônia Legal',
    novoProgresso: { estado: 'PA', ibge: '1505031', elegivel: true },
    reducao75: {
      percentual: 0.75,
      prazo: 10,
      artigo: 'Art. 634',
      baseLegal: 'MP 2.199-14/2001 + Lei 13.799/2019',
      tipos: ['Instalação', 'Ampliação', 'Modernização', 'Diversificação'],
      requisitos: [
        'Lucro Real obrigatório',
        'Projeto aprovado pela SUDAM até 31/12/2023',
        'Laudo Constitutivo emitido',
        'Setor prioritário (Decreto 4.212/2002)',
        'CND/CPEN federal + regularidade FGTS',
        'Produção efetiva > 20% da capacidade instalada'
      ]
    },
    reinvestimento30: {
      percentual: 0.30,
      artigo: 'Art. 638-651',
      banco: 'BASA (Banco da Amazônia)',
      capitalGiro: 0.50,
      destinacao: ['Modernização', 'Complementação equipamentos', 'Montagem/instalação', 'Capital de giro (até 50%)']
    },
    setoresPrioritarios: [
      { id: 'AGROIND', label: 'Agroindústria' },
      { id: 'BIOTECH', label: 'Biotecnologia' },
      { id: 'FLORESTAL', label: 'Florestal' },
      { id: 'INFRA', label: 'Infraestrutura' },
      { id: 'MINERAL', label: 'Mineral' },
      { id: 'PESCA', label: 'Pesca e Aquicultura' },
      { id: 'SERVICOS_TEC', label: 'Serviços Técnicos Especializados', relevanteAGROGEO: true },
      { id: 'DIGITAL', label: 'Inclusão Digital' },
      { id: 'TURISMO', label: 'Turismo' },
      { id: 'QUIMICA', label: 'Química' },
      { id: 'METAL', label: 'Metalurgia e Metal-Mecânica' },
      { id: 'TEXTIL', label: 'Têxtil e Calçados' },
      { id: 'ELETROELETRO', label: 'Eletroeletrônica' },
      { id: 'CULTURA', label: 'Cultura' }
    ]
  };

  LR.sudene = {
    artigo: 'Art. 627',
    lei: 'LC 125/2007',
    estados: ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'],
    parcial: { MG: 'Municípios do Polígono das Secas / ex-DNOCS', ES: 'Norte do ES (ex-ADENE)' }
  };

  LR.exclusoesLucroExploracao = {
    excluir: [
      { id: 'REC_FIN_LIQUIDA', label: 'Receitas financeiras líquidas', artigo: 'Art. 618, I' },
      { id: 'RESULT_PARTIC_SOC', label: 'Resultados positivos participações societárias (MEP)', artigo: 'Art. 618, II' },
      { id: 'RESULT_NAO_OPERAC', label: 'Resultados não operacionais (ganhos/perdas capital)', artigo: 'Art. 618, III' },
      { id: 'RECEITAS_ANTERIOR', label: 'Receitas de exercícios anteriores', artigo: 'Art. 618, IV' },
      { id: 'RESERVA_REAV', label: 'Valores baixados reserva reavaliação', artigo: 'Art. 618, V' },
      { id: 'SUBVENCOES', label: 'Subvenções para investimento', artigo: 'Art. 618, VI' },
      { id: 'TRIB_SUSPENSOS', label: 'Tributos com exigibilidade suspensa', artigo: 'Art. 618, VIII' }
    ],
    adicionar: [
      { id: 'CSLL_DEVIDA', label: 'CSLL devida no período', artigo: 'IN SRF 267/2002, art. 2º §1º' },
      { id: 'DESP_FIN_LIQUIDA', label: 'Despesas financeiras líquidas (se > receitas fin.)', artigo: 'IN SRF 267/2002, art. 2º §2º' },
      { id: 'PREJUIZO_PARTIC', label: 'Resultados negativos participações societárias', artigo: 'IN SRF 267/2002, art. 2º §3º' }
    ]
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 14. DESPESAS INDEDUTÍVEIS E COM LIMITES
  // ═══════════════════════════════════════════════════════════════════════════

  LR.despesasIndedutiveis = [
    { id: 'BRINDES', artigo: 'Art. 13, VII Lei 9.249', descricao: 'Despesas com brindes' },
    { id: 'ALIMENTACAO_SOCIOS', artigo: 'Art. 13, IV Lei 9.249', descricao: 'Alimentação de sócios/acionistas/administradores' },
    { id: 'CONTRIBUICAO_NAO_COMPULSORIA', artigo: 'Art. 13, V Lei 9.249', descricao: 'Contribuições não compulsórias (exceto saúde/previdência)' },
    { id: 'DOACAO_IRREGULAR', artigo: 'Art. 13, VI Lei 9.249', descricao: 'Doações fora dos limites legais' },
    { id: 'MULTA_PUNITIVA', artigo: 'Art. 311, §5º', descricao: 'Multas por infrações fiscais (punitivas)' },
    { id: 'GRATIFICACAO_ADM', artigo: 'Art. 358, §1º', descricao: 'Gratificações a administradores' },
    { id: 'CSLL', artigo: 'Lei 9.316/96, Art. 1º', descricao: 'CSLL registrada como despesa' },
    { id: 'ROYALTIES_SOCIOS', artigo: 'Art. 363, I', descricao: 'Royalties pagos a sócios PF/PJ e parentes' },
    { id: 'PENA_CRIMINAL', artigo: 'Art. 352, §4º', descricao: 'Reparação de pena criminal' },
    { id: 'DEPRECIACAO_EXCESSO', artigo: 'Art. 260, §ú, XII', descricao: 'Depreciação além do custo de aquisição' }
  ];

  LR.despesasComLimites = {
    doacoes: {
      operacionais: { limite: 0.02, base: 'Lucro operacional', artigo: 'Art. 377' },
      oscip: { limite: 0.02, base: 'Lucro operacional', artigo: 'Art. 377, §1º' },
      entidadesEnsino: { limite: 0.015, base: 'Lucro operacional', artigo: 'Art. 385' }
    },
    previdenciaComplementar: {
      limite: 0.20, base: 'Folha salarial', artigo: 'Art. 369, §1º'
    },
    royalties: {
      limiteGeral: 0.05, base: 'Receita líquida', artigo: 'Art. 365'
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 15. PROVISÕES DEDUTÍVEIS E NÃO DEDUTÍVEIS
  // ═══════════════════════════════════════════════════════════════════════════

  LR.provisoes = {
    dedutiveis: [
      { id: 'FERIAS', descricao: '13º salário + encargos', artigo: 'Art. 342' },
      { id: '13_SALARIO', descricao: 'Férias + 1/3 + encargos', artigo: 'Art. 342' },
      { id: 'PDD', descricao: 'PDD — Provisão para Devedores Duvidosos (critérios Art. 347)', artigo: 'Art. 347-351' }
    ],
    naoDedutiveis: [
      { id: 'CONTINGENCIAS', descricao: 'Provisão para contingências (trabalhistas, cíveis, fiscais)', artigo: 'Art. 340', ajuste: 'Adição ao lucro; exclusão na reversão/liquidação' },
      { id: 'GARANTIAS', descricao: 'Provisão para garantia de produtos', artigo: 'Art. 340' },
      { id: 'PERDAS_INVESTIMENTOS', descricao: 'Provisão para perdas em investimentos', artigo: 'Art. 340' }
    ]
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 16. PDD — CRITÉRIOS (Art. 347-351)
  // ═══════════════════════════════════════════════════════════════════════════

  LR.pdd = {
    artigo: 'Art. 347-351',
    criterios: [
      { id: 'JUDICIAL', descricao: 'Crédito com cobrança judicial em andamento', artigo: 'Art. 347, §1º, I' },
      { id: 'CONCORDATA', descricao: 'Devedor declarado falido ou em recuperação judicial', artigo: 'Art. 347, §1º, II' },
      { id: 'VENCIDO', descricao: 'Crédito vencido há mais de 6 meses com providências de cobrança', artigo: 'Art. 347, §1º, III' },
      { id: 'INSOLVENTE', descricao: 'Devedor notoriamente insolvente', artigo: 'Art. 347, §1º, IV' }
    ],
    vedacoes: [
      'Créditos com garantia real (até limite da garantia)',
      'Créditos com devedor parte relacionada',
      'Créditos com empresa do mesmo grupo econômico'
    ],
    faixasValor: [
      { ate: 5000, descricao: 'Até R$ 5.000 — sem cobrança judicial: 6 meses + procedimentos', artigo: 'Art. 347, §3º' },
      { ate: 30000, descricao: 'De R$ 5.000 a R$ 30.000 — autos de cobrança administrativos', artigo: 'Art. 347, §4º' },
      { acima: 30000, descricao: 'Acima de R$ 30.000 — exige procedimento judicial', artigo: 'Art. 347, §5º' }
    ]
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 17. ESTOQUE (Art. 304-310)
  // ═══════════════════════════════════════════════════════════════════════════

  LR.estoques = {
    metodosPermitidos: [
      { id: 'CUSTO_MEDIO', label: 'Custo Médio Ponderado', artigo: 'Art. 307' },
      { id: 'PEPS', label: 'PEPS / FIFO', artigo: 'Art. 307' },
      { id: 'PRECO_VENDA_MARGEM', label: 'Preço de Venda menos Margem', artigo: 'Art. 307' },
      { id: 'MERCADO_RURAL', label: 'Preços correntes de mercado (apenas rural/extrativo)', artigo: 'Art. 309' }
    ],
    vedacoes: [
      'Reduções globais de valores inventariados (Art. 310, I)',
      'Depreciações estimadas ou provisões para oscilação preços (Art. 310, II)',
      'Estoques básicos a preços constantes ou nominais (Art. 310, III)',
      'Provisão ajuste ao valor de mercado se < custo (Art. 310, IV)'
    ]
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 18. OMISSÃO DE RECEITA (Art. 293-300)
  // ═══════════════════════════════════════════════════════════════════════════

  LR.indicadoresOmissao = [
    { id: 'SALDO_CAIXA_NEGATIVO', artigo: 'Art. 293, I', gravidade: 'CRITICO', descricao: 'Saldo negativo de caixa' },
    { id: 'FALTA_ESCRITURACAO', artigo: 'Art. 293, II', gravidade: 'CRITICO', descricao: 'Falta de escrituração de pagamentos' },
    { id: 'PASSIVO_FICTICIO', artigo: 'Art. 293, III', gravidade: 'CRITICO', descricao: 'Manutenção de obrigações já pagas ou inexigíveis' },
    { id: 'SUPRIMENTO_CAIXA', artigo: 'Art. 294', gravidade: 'ALTO', descricao: 'Recursos de sócios sem comprovação de origem' },
    { id: 'FALTA_NOTA_FISCAL', artigo: 'Art. 295', gravidade: 'CRITICO', descricao: 'Falta de NF ou NF com valor inferior' },
    { id: 'DEPOSITOS_SEM_ORIGEM', artigo: 'Art. 299', gravidade: 'ALTO', descricao: 'Créditos bancários sem comprovação' },
    { id: 'DIVERGENCIA_ESTOQUE', artigo: 'Art. 298', gravidade: 'MEDIO', descricao: 'Diferença no levantamento quantitativo' }
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  // 19. LEI 12.973/2014 — AJUSTES RELEVANTES
  // ═══════════════════════════════════════════════════════════════════════════

  LR.lei12973 = {
    vigencia: '01/01/2015',
    temas: [
      { id: 'RECEITA_BRUTA', label: 'Nova definição de receita bruta', artigo: 'Art. 2º → DL 1.598, Art. 12' },
      { id: 'AVP', label: 'Ajuste a Valor Presente — tributação diferida', artigo: 'Arts. 4-5' },
      { id: 'VALOR_JUSTO', label: 'Ganho/perda valor justo — diferimento via subconta', artigo: 'Arts. 13-14' },
      { id: 'GOODWILL', label: 'Amortização goodwill — dedutível em 1/60 avos', artigo: 'Arts. 20-22' },
      { id: 'MAIS_MENOS_VALIA', label: 'Mais-valia e menos-valia — realização via depreciação', artigo: 'Arts. 20-21' },
      { id: 'JCP_PL', label: 'Base do JCP = PL fiscal (capital + reservas - tesouraria - prejuízo)', artigo: 'Art. 9º → Lei 9.249, §8º' },
      { id: 'DIVIDENDOS', label: 'Isenção ampliada para todas as espécies de ações', artigo: 'Art. 9º → Lei 9.249, Art. 10' },
      { id: 'SUBVENCAO', label: 'Subvenção para investimento — reserva de lucros', artigo: 'Art. 30 (revogado Lei 14.789/2023)' },
      { id: 'PRE_OPERACIONAL', label: 'Despesas pré-operacionais — amortização diferida', artigo: 'Art. 11' }
    ]
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 20. VALOR JUSTO, MEP, OPERAÇÕES EXTERIOR
  // ═══════════════════════════════════════════════════════════════════════════

  LR.valorJusto = {
    artigo: 'CPC 46 / Arts. 13-14 Lei 12.973',
    ganho: { ajuste: 'EXCLUSÃO do lucro real (diferimento via subconta)', artigo: 'Art. 13' },
    perda: { ajuste: 'ADIÇÃO ao lucro real (não dedutível, controlada Parte B)', artigo: 'Art. 14' },
    realizacao: 'Na alienação, depreciação ou baixa — ganho vira adição / perda vira exclusão'
  };

  LR.mep = {
    artigo: 'Art. 389 + CPC 18',
    positivo: 'EXCLUSÃO do lucro real',
    negativo: 'ADIÇÃO ao lucro real',
    descricao: 'Resultado de equivalência patrimonial — neutro para fins fiscais'
  };

  LR.operacoesExterior = {
    artigo: 'Art. 446-451',
    regras: [
      'Taxa de câmbio para venda na data da contabilização (Art. 446, §1º)',
      'Prejuízos no exterior NÃO compensáveis com lucros no País (Art. 446, §7º)',
      'Sem incentivos fiscais sobre IR de lucros no exterior (Art. 446, §10)'
    ],
    creditoIR: {
      descricao: 'Crédito de IR pago no exterior',
      limite: 'IRPJ brasileiro sobre a mesma renda',
      artigo: 'Art. 448'
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 21. FÓRMULA MESTRE — PASSOS DO CÁLCULO
  // ═══════════════════════════════════════════════════════════════════════════

  LR.formulaMestre = {
    descricao: 'Sequência de cálculo do IRPJ pelo Lucro Real',
    artigo: 'Art. 258-261',
    passos: [
      { passo: 1, descricao: 'Lucro Líquido Contábil (antes de IRPJ/CSLL)', artigo: 'Art. 259', operacao: '=' },
      { passo: 2, descricao: 'Adições obrigatórias', artigo: 'Art. 260', operacao: '+' },
      { passo: 3, descricao: 'Exclusões permitidas', artigo: 'Art. 261, I e II', operacao: '-' },
      { passo: 4, descricao: 'Lucro Real antes compensação', artigo: '-', operacao: '=' },
      { passo: 5, descricao: 'Compensação prejuízos fiscais (trava 30%)', artigo: 'Art. 261, III', operacao: '-' },
      { passo: 6, descricao: 'LUCRO REAL (base de cálculo)', artigo: '-', operacao: '=' },
      { passo: 7, descricao: 'IRPJ Normal (15%)', artigo: 'Art. 225', operacao: '×' },
      { passo: 8, descricao: 'IRPJ Adicional (10% sobre excedente)', artigo: 'Art. 225, §ú', operacao: '+' },
      { passo: 9, descricao: 'IRPJ Devido', artigo: '-', operacao: '=' },
      { passo: 10, descricao: 'Deduções (incentivos fiscais)', artigo: 'Art. 226/228', operacao: '-' },
      { passo: 11, descricao: 'Compensação retenções na fonte', artigo: '-', operacao: '-' },
      { passo: 12, descricao: 'IRPJ A RECOLHER', artigo: '-', operacao: '=' }
    ]
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 22. MAPA DE ESTRATÉGIAS DE ECONOMIA
  // ═══════════════════════════════════════════════════════════════════════════

  LR.estrategiasEconomia = [
    { id: 1, nome: 'JCP — Juros sobre Capital Próprio', tipo: 'Dedução', complexidade: 'Baixa', risco: 'Baixo', impacto: '19% líquido do JCP pago', artigo: 'Art. 355-358' },
    { id: 2, nome: 'Compensação de Prejuízos Fiscais', tipo: 'Dedução', complexidade: 'Baixa', risco: 'Baixo', impacto: 'Até 30% do lucro ajustado', artigo: 'Art. 261, III' },
    { id: 3, nome: 'Incentivos Fiscais (PAT, FIA, Rouanet)', tipo: 'Dedução IRPJ', complexidade: 'Média', risco: 'Baixo', impacto: '~10% do IRPJ normal', artigo: 'Art. 226/228' },
    { id: 4, nome: 'Balanço de Suspensão/Redução', tipo: 'Timing', complexidade: 'Média', risco: 'Baixo', impacto: 'Até 100% da estimativa mensal', artigo: 'Art. 227-230' },
    { id: 5, nome: 'Depreciação Acelerada', tipo: 'Timing', complexidade: 'Média', risco: 'Baixo', impacto: '1-5% da receita', artigo: 'Art. 311-330' },
    { id: 6, nome: 'Créditos PIS/COFINS', tipo: 'Crédito', complexidade: 'Alta', risco: 'Médio', impacto: '3-7% dos custos', artigo: 'Lei 10.637/02' },
    { id: 7, nome: 'SUDAM — Redução 75% IRPJ', tipo: 'Redução', complexidade: 'Alta', risco: 'Baixo', impacto: 'Até 75% do IRPJ', artigo: 'Art. 615-627' },
    { id: 8, nome: 'Reclassificação Despesas Indedutíveis', tipo: 'Dedução', complexidade: 'Alta', risco: 'Médio', impacto: 'Variável', artigo: 'Art. 311' }
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  // 23. VARIAÇÃO CAMBIAL (Art. 446-451)
  // ═══════════════════════════════════════════════════════════════════════════

  LR.variacaoCambial = {
    regimeCaixa: {
      descricao: 'Variações cambiais reconhecidas na liquidação da operação',
      artigo: 'MP 2.158-35/2001, Art. 30',
      opcao: 'Opção irretratável para o ano-calendário'
    },
    regimeCompetencia: {
      descricao: 'Variações cambiais reconhecidas mensalmente',
      artigo: 'Art. 311',
      padrao: true
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 24. RECEITA BRUTA — COMPOSIÇÃO (DL 1.598 + Lei 12.973)
  // ═══════════════════════════════════════════════════════════════════════════

  LR.receitaBruta = {
    composicao: [
      { inciso: 'I', descricao: 'Produto da venda de bens (conta própria)', campo: 'vendaBens' },
      { inciso: 'II', descricao: 'Preço da prestação de serviços', campo: 'prestacaoServicos' },
      { inciso: 'III', descricao: 'Resultado de operações de conta alheia', campo: 'contaAlheia' },
      { inciso: 'IV', descricao: 'Receitas da atividade principal não em I-III', campo: 'outrasReceitas' }
    ],
    deducoes: [
      { inciso: 'I', descricao: 'Devoluções e vendas canceladas', campo: 'devolucoes' },
      { inciso: 'II', descricao: 'Descontos concedidos incondicionalmente', campo: 'descontosIncondicionais' },
      { inciso: 'III', descricao: 'Tributos sobre ela incidentes', campo: 'tributosIncidentes' },
      { inciso: 'IV', descricao: 'Ajuste a valor presente', campo: 'ajusteValorPresente' }
    ],
    artigo: 'Art. 12 do DL 1.598/1977 (redação Lei 12.973/2014)'
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 25. LALUR — ESTRUTURA
  // ═══════════════════════════════════════════════════════════════════════════

  LR.lalur = {
    parteA: {
      descricao: 'Demonstração do lucro real — adições e exclusões do período',
      artigo: 'Art. 277',
      conteudo: ['Lucro líquido do período', 'Adições (Art. 260)', 'Exclusões (Art. 261)', 'Lucro Real apurado']
    },
    parteB: {
      descricao: 'Controle de valores que afetarão períodos futuros',
      artigo: 'Art. 277',
      exemplos: [
        'Prejuízos fiscais a compensar',
        'Base negativa de CSLL',
        'Depreciação acelerada incentivada (diferença fiscal × contábil)',
        'Provisões não dedutíveis (a reverter futuramente)',
        'Perdas de renda variável/swap',
        'Resultado negativo MEP'
      ]
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 26. TABELA IRPF (para retenções PF)
  // ═══════════════════════════════════════════════════════════════════════════

  LR.tabelaIRPF = {
    anoBase: 2025,
    faixas: [
      { ate: 2259.20, aliquota: 0, deducao: 0, descricao: 'Isento' },
      { ate: 2826.65, aliquota: 0.075, deducao: 169.44 },
      { ate: 3751.05, aliquota: 0.15, deducao: 381.44 },
      { ate: 4664.68, aliquota: 0.225, deducao: 662.77 },
      { acima: 4664.68, aliquota: 0.275, deducao: 896.00 }
    ],
    deducaoDependente: 189.59,
    nota: 'Verificar tabela atualizada para 2026'
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 30. FUNÇÕES DE CÁLCULO ESSENCIAIS
  // ═══════════════════════════════════════════════════════════════════════════

  LR.calcular = {

    /**
     * Calcular IRPJ pelo Lucro Real
     */
    irpj: function (dados) {
      const d = Object.assign({
        lucroLiquido: 0, adicoes: 0, exclusoes: 0,
        prejuizoFiscal: 0, numMeses: 12, incentivos: 0,
        retencoesFonte: 0, estimativasPagas: 0
      }, dados);

      const lucroAntesComp = d.lucroLiquido + d.adicoes - d.exclusoes;
      const limiteCompensacao = Math.max(lucroAntesComp, 0) * 0.30;
      const compensacao = Math.min(limiteCompensacao, d.prejuizoFiscal, Math.max(lucroAntesComp, 0));
      const lucroReal = Math.max(lucroAntesComp - compensacao, 0);

      const limiteAdicional = LR.aliquotas.irpj.limiteAdicionalMes * d.numMeses;
      const irpjNormal = lucroReal * LR.aliquotas.irpj.normal;
      const irpjAdicional = Math.max(lucroReal - limiteAdicional, 0) * LR.aliquotas.irpj.adicional;
      const irpjDevido = irpjNormal + irpjAdicional;
      const deducoes = Math.min(d.incentivos, irpjNormal);
      const irpjAPagar = Math.max(irpjDevido - deducoes - d.retencoesFonte - d.estimativasPagas, 0);

      return {
        lucroLiquido: d.lucroLiquido,
        adicoes: d.adicoes,
        exclusoes: d.exclusoes,
        lucroAntesCompensacao: lucroAntesComp,
        compensacaoPrejuizo: _r(compensacao),
        prejuizoRemanescente: _r(d.prejuizoFiscal - compensacao),
        lucroReal: _r(lucroReal),
        irpjNormal: _r(irpjNormal),
        irpjAdicional: _r(irpjAdicional),
        irpjDevido: _r(irpjDevido),
        deducoes: _r(deducoes),
        retencoesFonte: d.retencoesFonte,
        estimativasPagas: d.estimativasPagas,
        irpjAPagar: _r(irpjAPagar),
        saldoNegativo: irpjAPagar < 0 ? _r(Math.abs(irpjAPagar)) : 0,
        aliquotaEfetiva: lucroReal > 0 ? _r(irpjDevido / lucroReal * 100) + '%' : '0%'
      };
    },

    /**
     * Calcular CSLL
     */
    csll: function (dados) {
      const d = Object.assign({
        lucroLiquido: 0, adicoes: 0, exclusoes: 0,
        baseNegativa: 0, financeira: false
      }, dados);

      const base = d.lucroLiquido + d.adicoes - d.exclusoes;
      const limiteComp = Math.max(base, 0) * 0.30;
      const compensacao = Math.min(limiteComp, d.baseNegativa, Math.max(base, 0));
      const baseCalculo = Math.max(base - compensacao, 0);
      const aliq = d.financeira ? LR.aliquotas.csll.financeiras : LR.aliquotas.csll.geral;
      const csllDevida = baseCalculo * aliq;

      return {
        baseAntesCompensacao: _r(base),
        compensacao: _r(compensacao),
        baseNegativaRemanescente: _r(d.baseNegativa - compensacao),
        baseCalculo: _r(baseCalculo),
        aliquota: aliq,
        csllDevida: _r(csllDevida)
      };
    },

    /**
     * Calcular JCP máximo dedutível
     */
    jcp: function (dados) {
      const d = Object.assign({
        patrimonioLiquido: 0, tjlp: 0.06,
        lucroLiquidoAntes: 0, lucrosAcumulados: 0, numMeses: 12
      }, dados);

      const tjlpProp = d.tjlp * (d.numMeses / 12);
      const maxTJLP = d.patrimonioLiquido * tjlpProp;
      const lim1 = d.lucroLiquidoAntes * 0.50;
      const lim2 = d.lucrosAcumulados * 0.50;
      const jcpDedutivel = Math.max(0, Math.min(maxTJLP, lim1, lim2));
      const economiaIRPJ = jcpDedutivel * 0.25;
      const economiaCSLL = jcpDedutivel * 0.09;
      const custoIRRF = jcpDedutivel * 0.15;

      return {
        jcpMaximoTJLP: _r(maxTJLP),
        limite50LL: _r(lim1),
        limite50Reservas: _r(lim2),
        jcpDedutivel: _r(jcpDedutivel),
        economiaIRPJ: _r(economiaIRPJ),
        economiaCSLL: _r(economiaCSLL),
        economiaTotal: _r(economiaIRPJ + economiaCSLL),
        custoIRRF: _r(custoIRRF),
        economiaLiquida: _r(economiaIRPJ + economiaCSLL - custoIRRF),
        limiteUtilizado: jcpDedutivel === maxTJLP ? 'TJLP' : jcpDedutivel === lim1 ? '50% Lucro' : '50% Reservas'
      };
    },

    /**
     * Calcular Estimativa Mensal
     */
    estimativaMensal: function (receitaBruta, tipoAtividade) {
      const p = LR.presuncoes[tipoAtividade];
      if (!p) return { erro: 'Tipo de atividade não encontrado' };

      const baseIRPJ = receitaBruta * p.irpj;
      const baseCSLL = receitaBruta * p.csll;
      const irpjNormal = baseIRPJ * 0.15;
      const irpjAdicional = Math.max(baseIRPJ - 20000, 0) * 0.10;
      const csllDevida = baseCSLL * 0.09;

      return {
        atividade: p.label,
        receitaBruta: receitaBruta,
        presuncaoIRPJ: p.irpj,
        presuncaoCSLL: p.csll,
        baseIRPJ: _r(baseIRPJ),
        baseCSLL: _r(baseCSLL),
        irpjNormal: _r(irpjNormal),
        irpjAdicional: _r(irpjAdicional),
        irpjDevido: _r(irpjNormal + irpjAdicional),
        csllDevida: _r(csllDevida),
        totalAPagar: _r(irpjNormal + irpjAdicional + csllDevida)
      };
    },

    /**
     * Calcular PIS/COFINS Não-Cumulativo
     */
    pisCofins: function (dados) {
      const d = Object.assign({
        receitaBruta: 0, isentas: 0, exportacao: 0, baseCreditos: 0
      }, dados);

      const tributavel = d.receitaBruta - d.isentas - d.exportacao;
      const debPIS = tributavel * LR.aliquotas.pisCofins.pisNaoCumulativo;
      const debCOFINS = tributavel * LR.aliquotas.pisCofins.cofinsNaoCumulativo;
      const credPIS = d.baseCreditos * LR.aliquotas.pisCofins.pisNaoCumulativo;
      const credCOFINS = d.baseCreditos * LR.aliquotas.pisCofins.cofinsNaoCumulativo;

      return {
        receitaTributavel: _r(tributavel),
        debitoPIS: _r(debPIS), debitoCOFINS: _r(debCOFINS),
        creditoPIS: _r(credPIS), creditoCOFINS: _r(credCOFINS),
        pisAPagar: _r(Math.max(debPIS - credPIS, 0)),
        cofinsAPagar: _r(Math.max(debCOFINS - credCOFINS, 0)),
        totalAPagar: _r(Math.max(debPIS - credPIS, 0) + Math.max(debCOFINS - credCOFINS, 0)),
        aliquotaEfetiva: d.receitaBruta > 0
          ? _r((Math.max(debPIS - credPIS, 0) + Math.max(debCOFINS - credCOFINS, 0)) / d.receitaBruta * 100) + '%'
          : '0%'
      };
    },

    /**
     * Calcular retenções integradas de uma NF
     */
    retencoesNF: function (valorNF, opts) {
      const o = Object.assign({ admPublica: false, simplesNacional: false, temCSRF: true, iss: 0 }, opts);
      if (o.simplesNacional) return { irrf: 0, csrf: 0, iss: 0, total: 0, liquido: valorNF, nota: 'Simples Nacional — sem retenções federais' };

      const irrf = o.admPublica ? valorNF * 0.048 : valorNF * 0.015;
      const csrf = o.temCSRF ? valorNF * 0.0465 : 0;
      const iss = valorNF * o.iss;
      const total = irrf + csrf + iss;

      return {
        valorBruto: _r(valorNF),
        irrf: _r(irrf), irrfAliquota: o.admPublica ? '4,8%' : '1,5%',
        csrfPIS: _r(valorNF * 0.0065), csrfCOFINS: _r(valorNF * 0.03), csrfCSLL: _r(valorNF * 0.01),
        csrfTotal: _r(csrf),
        iss: _r(iss),
        totalRetido: _r(total),
        liquido: _r(valorNF - total)
      };
    },

    /**
     * Calcular Lucro da Exploração (SUDAM/SUDENE)
     */
    lucroExploracao: function (dados) {
      const d = Object.assign({
        lucroLiquido: 0, receitasFinanceirasLiquidas: 0,
        resultadoMEP: 0, resultadoNaoOperacional: 0,
        receitasAnteriores: 0, csllDevida: 0, despFinLiquidas: 0
      }, dados);

      const exclusoes = d.receitasFinanceirasLiquidas + Math.max(d.resultadoMEP, 0) +
        d.resultadoNaoOperacional + d.receitasAnteriores;
      const adicoes = d.csllDevida + d.despFinLiquidas + Math.abs(Math.min(d.resultadoMEP, 0));
      const lucroExploracao = d.lucroLiquido - exclusoes + adicoes;
      const reducao75 = Math.max(lucroExploracao, 0) * LR.aliquotas.irpj.normal * 0.75;

      return {
        lucroLiquido: d.lucroLiquido,
        exclusoes: _r(exclusoes), adicoes: _r(adicoes),
        lucroExploracao: _r(lucroExploracao),
        irpjSobreExploracao: _r(Math.max(lucroExploracao, 0) * 0.15),
        reducao75: _r(reducao75),
        irpjAposReducao: _r(Math.max(lucroExploracao, 0) * 0.15 - reducao75)
      };
    },

    /**
     * Simulação completa — tudo junto
     */
    simulacaoCompleta: function (empresa) {
      const e = Object.assign({
        lucroLiquido: 0, receitaBruta: 0, adicoes: 0, exclusoes: 0,
        prejuizoFiscal: 0, baseNegativaCSLL: 0,
        patrimonioLiquido: 0, tjlp: 0.06, lucrosAcumulados: 0,
        retencoesFonte: 0, estimativasPagas: 0, numMeses: 12
      }, empresa);

      const jcp = LR.calcular.jcp(e);
      const lucroAjustado = e.lucroLiquido - jcp.jcpDedutivel;

      const irpjSem = LR.calcular.irpj({ lucroLiquido: e.lucroLiquido, adicoes: e.adicoes, exclusoes: e.exclusoes, numMeses: e.numMeses });
      const irpjCom = LR.calcular.irpj({
        lucroLiquido: lucroAjustado, adicoes: e.adicoes, exclusoes: e.exclusoes,
        prejuizoFiscal: e.prejuizoFiscal, numMeses: e.numMeses,
        retencoesFonte: e.retencoesFonte, estimativasPagas: e.estimativasPagas
      });
      const csll = LR.calcular.csll({ lucroLiquido: lucroAjustado, adicoes: e.adicoes, exclusoes: e.exclusoes, baseNegativa: e.baseNegativaCSLL });

      const economiaJCP = jcp.economiaLiquida;
      const economiaIRPJ = irpjSem.irpjDevido - irpjCom.irpjDevido;

      return {
        semOtimizacao: { irpjDevido: irpjSem.irpjDevido, aliquotaEfetiva: irpjSem.aliquotaEfetiva },
        comOtimizacao: { irpj: irpjCom, csll: csll, jcp: jcp },
        economia: { jcp: economiaJCP, irpj: _r(economiaIRPJ), total: _r(economiaIRPJ + economiaJCP) },
        totalAPagar: { irpj: irpjCom.irpjAPagar, csll: csll.csllDevida, total: _r(irpjCom.irpjAPagar + csll.csllDevida) }
      };
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 31. HELPERS — FORMATAÇÃO E UTILITÁRIOS
  // ═══════════════════════════════════════════════════════════════════════════

  function _r(v) { return Math.round(v * 100) / 100; }

  LR.helpers = {
    formatarMoeda: function (v) {
      return 'R$ ' + (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
    formatarPercentual: function (v) {
      return (v * 100).toFixed(2) + '%';
    },
    round: _r,
    getTrimestreAtual: function () {
      var m = new Date().getMonth();
      return LR.trimestres[Math.floor(m / 3)];
    },
    getMesAtual: function () {
      return LR.meses[new Date().getMonth()];
    },
    buscarPresuncao: function (chave) {
      return LR.presuncoes[chave] || null;
    },
    listarPresuncoes: function () {
      return Object.keys(LR.presuncoes).map(function (k) {
        return { chave: k, label: LR.presuncoes[k].label, irpj: LR.presuncoes[k].irpj, csll: LR.presuncoes[k].csll };
      });
    },
    buscarDepreciacao: function (nomeBem) {
      return LR.depreciacao.tabela.find(function (t) {
        return t.bem.toLowerCase().indexOf(nomeBem.toLowerCase()) >= 0;
      }) || null;
    },
    buscarIncentivo: function (id) {
      return LR.incentivos.find(function (i) { return i.id === id; }) || null;
    },
    buscarAdicao: function (id) {
      return LR.adicoes.find(function (a) { return a.id === id; }) || null;
    },
    buscarExclusao: function (id) {
      return LR.exclusoes.find(function (e) { return e.id === id; }) || null;
    },
    buscarDARF: function (id) {
      return LR.darf[id] || null;
    },
    ehSUDAM: function (uf) {
      return LR.sudam.estados.indexOf(uf.toUpperCase()) >= 0;
    },
    ehSUDENE: function (uf) {
      return LR.sudene.estados.indexOf(uf.toUpperCase()) >= 0;
    },
    verificarObrigatoriedade: function (dados) {
      var motivos = [];
      if (dados.receitaAnual > LR.limites.receitaObrigatoriedade) motivos.push('Receita > R$ 78 milhões');
      if (dados.financeira) motivos.push('Instituição financeira');
      if (dados.lucroExterior) motivos.push('Lucros do exterior');
      if (dados.beneficioFiscal) motivos.push('Benefício fiscal isenção/redução');
      if (dados.estimativaMensal) motivos.push('Paga por estimativa mensal');
      if (dados.factoring) motivos.push('Factoring');
      if (dados.securitizadora) motivos.push('Securitizadora');
      return { obrigada: motivos.length > 0, motivos: motivos };
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 32. CONTEXTO AGROGEO BRASIL
  // ═══════════════════════════════════════════════════════════════════════════

  LR.agrogeo = {
    razaoSocial: 'AGROGEO BRASIL',
    municipio: 'Novo Progresso',
    uf: 'PA',
    regiao: 'SUDAM — Amazônia Legal',
    atividade: 'Geotecnologia e consultoria ambiental',
    servicos: ['Georeferenciamento', 'CAR', 'PRA', 'LAR', 'Topografia', 'Defesa Ambiental', 'Titulação de Terras'],
    tipoPresuncao: 'SERVICOS_GERAL',
    cnaeGrupo: '71 — Serviços de arquitetura e engenharia; testes e análises técnicas',
    setorSUDAM: 'SERVICOS_TEC',
    participacao: { luis: 0.65, elton: 0.35 },
    regimeAtual: 'Simples Nacional',
    receitaAnual: 2350000,
    folhaAnual: 1000000,
    nota: 'Se migrar para Lucro Real: retenção de 9,45% em NFs para órgãos públicos + elegível redução 75% IRPJ via SUDAM'
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPORT — Exposição global
  // ═══════════════════════════════════════════════════════════════════════════

  // Browser
  if (typeof window !== 'undefined') {
    window.LucroRealMap = LR;
    window.LR = LR; // atalho
  }

  // Node.js / CommonJS
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = LR;
  }

  // AMD
  if (typeof define === 'function' && define.amd) {
    define(function () { return LR; });
  }

})(this);
