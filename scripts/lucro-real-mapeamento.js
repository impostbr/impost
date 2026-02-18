/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  LUCRO REAL — MAPEAMENTO UNIFICADO DE DADOS  v3.3 (CORREÇÕES FISCAIS)    ║
 * ║  Fonte única de verdade para alimentar qualquer HTML ou JS                 ║
 * ║  Base Legal: RIR/2018 (Decreto 9.580/2018) + Lei 12.973/2014              ║
 * ║  Ano-Base: 2026                                                           ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  CORREÇÕES v3.3 (alinhamento com Motor v5.0 — riscos fiscais):            ║
 * ║                                                                            ║
 * ║  [FIX #1] Gratificações a Administradores — tratamento detalhado           ║
 * ║    - Adicionados subtipos: ADMINISTRADOR_ESTATUTARIO, DIRETOR_EMPREGADO_  ║
 * ║      CLT, EMPREGADO_GERAL com distinção IRPJ vs CSLL (LALUR vs LACS)     ║
 * ║    - Ref: Art. 315 RIR/2018, IN RFB 1.700/17 Anexo I item 85             ║
 * ║                                                                            ║
 * ║  [FIX #2] Créditos PIS/COFINS — Aluguel PF vs PJ                         ║
 * ║    - Novo parâmetro alugueisPF (sem crédito) com alerta automático         ║
 * ║    - Ref: Lei 10.637/2002, Art. 3º, IV                                    ║
 * ║                                                                            ║
 * ║  [FIX #3] Taxa TJLP não hardcoded                                         ║
 * ║    - Removido default de 6% a.a. — TJLP agora é obrigatória               ║
 * ║    - Validação com mensagem orientadora e referência a taxas recentes      ║
 * ║    - JCP fallback e simulacaoCompleta retornam erro se TJLP ausente       ║
 * ║                                                                            ║
 * ║  [FIX #4] Créditos PIS/COFINS sobre depreciação                           ║
 * ║    - Novos parâmetros: depreciacaoBensMetodo, custoAquisicaoImobilizado,  ║
 * ║      mesesUsoImobilizado para cálculo fiscal (1/48 ou 1/60)               ║
 * ║    - Alertas quando usado método contábil                                  ║
 * ║    - Ref: Lei 10.637/02, Art. 3º, VI; Lei 14.592/2023                    ║
 * ║                                                                            ║
 * ║  [FIX #5] Alíquota efetiva PIS/COFINS — duas métricas claras             ║
 * ║    - aliquotaEfetiva = líquida (a pagar / receita bruta)                  ║
 * ║    - aliquotaEfetivaBruta = (débitos / receita bruta)                     ║
 * ║    - aliquotaEfetivaDescricao explica cada métrica                         ║
 * ║                                                                            ║
 * ║  [FIX #6] Carga total — bruta vs líquida                                  ║
 * ║    - totalAPagar agora contém cargaTotalBruta e cargaTotalLiquida          ║
 * ║    - PIS/COFINS integrado em simulacaoCompleta                             ║
 * ║    - dadosPISCOFINS e retencoesPISCOFINS como novos parâmetros            ║
 * ║                                                                            ║
 * ║  [FIX #7] PIS/COFINS proporcional nos cenários                            ║
 * ║    - Cenários pessimista/otimista recalculam PIS/COFINS proporcionalmente ║
 * ║    - Antes: PIS/COFINS era fixo mesmo com receita variando ±5%           ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  CORREÇÕES v3.2:                                                           ║
 * ║  #1 — ARQUITETURAL: Integração com Estados/EstadosBR (27 UFs dinâmicas)  ║
 * ║       LR.setEstado(), LR.getEstado(), LR.ehSUDAM(), LR.ehSUDENE()       ║
 * ║       ISS dinâmico via LR.getAliquotaISS(), helpers delegam a estados.js ║
 * ║  #2 — CRÍTICA: lucroExploracao() operador || com zero falsy corrigido     ║
 * ║  #3 — MÉDIA: compensarIntegrado() resumo.compensacaoEfetiva no motor     ║
 * ║  #4 — BAIXA: estimativaMensal() campos saldoNegativo na delegação        ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  CORREÇÕES v3.0:                                                           ║
 * ║  Todas as funções de LR.calcular.* agora delegam ao motor principal        ║
 * ║  (window.MotorLR). Eliminada reimplementação duplicada. Fallback para      ║
 * ║  código original caso motor não carregue.                                  ║
 * ║                                                                            ║
 * ║  MAPEAMENTO DE DELEGAÇÃO:                                                  ║
 * ║  irpj()              → MotorLR.calcularIRPJLucroReal()     (Etapa 1)     ║
 * ║  csll()              → MotorLR.calcularCSLL()               (Etapa 1)     ║
 * ║  jcp()               → MotorLR.calcularJCP()               (Etapa 2)     ║
 * ║  pisCofins()         → MotorLR.calcularPISCOFINSNaoCumulativo() (Et. 2)  ║
 * ║  retencoesNF()       → MotorLR.calcularRetencaoIntegrada() (Etapa 2)     ║
 * ║  compensarRetencoes()→ MotorLR.compensarRetencoes()         (Etapa 3)     ║
 * ║  compensarIntegrado()→ MotorLR.compensarIntegrado()         (Etapa 3)     ║
 * ║  saldoNegativo()     → MotorLR.calcularSaldoNegativo()     (Etapa 3)     ║
 * ║  estimativaMensal()  → MotorLR.calcularEstimativaMensal()   (Etapa 4)     ║
 * ║  depreciacaoCompleta()→MotorLR.calcularDepreciacaoCompleta() (Etapa 4)    ║
 * ║  incentivos()        → MotorLR.calcularIncentivos()         (Etapa 4)     ║
 * ║  lucroExploracao()   → MotorLR.calcularLucroExploracao()    (Etapa 4)     ║
 * ║  suspensaoReducao()  → MotorLR.calcularSuspensaoReducao()  (Etapa 4)     ║
 * ║  acrescimosMoratorios()→MotorLR.calcularAcrescimosMoratorios()(Etapa 4)  ║
 * ║  multaOficio()       → MotorLR.calcularMultaOficio()        (Etapa 4)     ║
 * ║  recomendarRegime()  → MotorLR.recomendarRegime()           (Etapa 4)     ║
 * ║  simulacaoCompleta() → MotorLR.simularLucroRealCompleto()  (Etapa 4)     ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  FALHAS CORRIGIDAS:                                                        ║
 * ║  #1 — Depreciação: depreciacaoNormal separada de incentivada (DRE)        ║
 * ║  #4 — Simulação: delegação ao motor elimina lucro -R$36.000 incorreto     ║
 * ║  #6 — IRPJ: saldo negativo permitido (PER/DCOMP)                         ║
 * ║  #7 — Economia prejuízo: motor calcula IRPJ real (normal+adicional)      ║
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

  // v3.3 FIX E2#5: Flag de modo fallback — indica quando motor fiscal não está carregado
  // Se true, cálculos podem ter divergências com o motor fiscal completo
  LR._modoFallback = false;
  LR._fallbackUsado = []; // Rastreia quais funções rodaram em fallback

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
      irrfAliquota: 0.175,              // 17,5% IRRF na fonte (LC 224/2025)
      limiteLucroLiquido: 0.50,          // 50% do lucro líquido
      limiteLucrosAcumulados: 0.50,      // 50% de lucros acumulados + reservas
      artigoBase: 'Art. 355-358 do RIR/2018',
      // v3.3 FIX #3: TJLP é obrigatória — referência informativa apenas
      tjlpNota: 'TJLP deve ser informada pelo usuário. Consultar BACEN para taxa vigente.',
      tjlpReferencia: {
        Q1_2025: 0.0797,   // 7,97% a.a.
        Q2_2025: 0.0850,   // ~8,50% a.a.
        Q3_Q4_2025: 0.0877, // ~8,77% a.a.
        Q1_2026: null,      // Consultar BACEN
        fonteConsulta: 'https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/pagamentos-e-parcelamentos/taxa-de-juros-de-longo-prazo-tjlp'
      }
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
      exemploMunicipio: 0.05,             // 5% alíquota exemplo (região Norte)
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
      aliquotaEfetivaIRPJ: 0.024, aliquotaEfetivaCSLL: 0.018,
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
    {
      id: 19,
      descricao: 'Gratificações/participações no resultado a dirigentes/administradores estatutários (indedutíveis p/ IRPJ)',
      artigo: 'Art. 315 + Art. 527 (Lei 4.506/64, Art. 45, §3º; DL 1.598/77, Art. 58, p.ú.)',
      tipo: 'D',
      estrategia: 'Converter em pró-labore (dedutível) ou JCP. ATENÇÃO: (1) Gratificações a empregados em geral são '
        + 'dedutíveis sem limite (IN 1.700/17, Art. 80). (2) Para CSLL, gratificações a administradores SÃO dedutíveis '
        + '(IN 1.700/17, Anexo I, item 85 — "não aplicável à CSLL"). (3) Diretores-empregados CLT: tema controvertido '
        + '— CARF tem decisões favoráveis à dedutibilidade (Ac. 1301003.760); STJ diverge (REsp 1.948.478/SP). '
        + 'Avaliar risco antes de adicionar ou excluir.',
      subtipos: {
        ADMINISTRADOR_ESTATUTARIO: {
          descricao: 'Dirigente/administrador estatutário (sem vínculo CLT)',
          dedutivelIRPJ: false,
          dedutivelCSLL: true,
          artigo: 'Art. 315 (IRPJ) / IN 1.700/17, Anexo I, item 85 (CSLL)',
          nota: 'Indedutível no LALUR (Parte A), mas NÃO adicionado no LACS (CSLL)'
        },
        DIRETOR_EMPREGADO_CLT: {
          descricao: 'Diretor com vínculo empregatício CLT e subordinação',
          dedutivelIRPJ: 'CONTROVERTIDO',
          dedutivelCSLL: true,
          artigo: 'CARF Ac. 9101-004.773 / REsp 1.746.268/SP (STJ favorável) / REsp 1.948.478/SP (STJ desfavorável)',
          nota: 'Risco médio — favorável no CARF, oscilante no STJ. Documentar subordinação CLT.'
        },
        EMPREGADO_GERAL: {
          descricao: 'Gratificações a empregados em geral (não administradores)',
          dedutivelIRPJ: true,
          dedutivelCSLL: true,
          artigo: 'IN RFB 1.700/2017, Art. 80 — dedutível sem limite',
          nota: 'Dedutível integralmente — não adicionar no LALUR nem no LACS'
        }
      }
    },
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
    irpjMensal:            { codigo: '2362', tributo: 'IRPJ', descricao: 'IRPJ — Estimativa Mensal', periodicidade: 'Mensal', prazo: 'Último dia útil do mês subsequente' },
    irpjTrimestral:        { codigo: '0220', tributo: 'IRPJ', descricao: 'IRPJ — Apuração Trimestral', periodicidade: 'Trimestral', prazo: 'Último dia útil do mês subsequente ao trimestre (em até 3 quotas)' },
    irpjAnualAjuste:       { codigo: '2430', tributo: 'IRPJ', descricao: 'IRPJ — Ajuste Anual', periodicidade: 'Anual', prazo: 'Último dia útil de março do ano seguinte (em até 3 quotas)' },
    // CSLL
    csllMensal:            { codigo: '2484', tributo: 'CSLL', descricao: 'CSLL — Estimativa Mensal', periodicidade: 'Mensal', prazo: 'Último dia útil do mês subsequente' },
    csllTrimestral:        { codigo: '6012', tributo: 'CSLL', descricao: 'CSLL — Apuração Trimestral', periodicidade: 'Trimestral', prazo: 'Último dia útil do mês subsequente ao trimestre (em até 3 quotas)' },
    csllAnualAjuste:       { codigo: '6773', tributo: 'CSLL', descricao: 'CSLL — Ajuste Anual', periodicidade: 'Anual', prazo: 'Último dia útil de março do ano seguinte' },
    // PIS/COFINS
    pisNaoCumulativo:      { codigo: '6912', tributo: 'PIS', descricao: 'PIS — Não-Cumulativo', periodicidade: 'Mensal', prazo: 'Dia 25 do mês subsequente ao fato gerador' },
    cofinsNaoCumulativo:   { codigo: '5856', tributo: 'COFINS', descricao: 'COFINS — Não-Cumulativo', periodicidade: 'Mensal', prazo: 'Dia 25 do mês subsequente ao fato gerador' },
    // Retenções
    irrfServicos:          { codigo: '1708', tributo: 'IRRF', descricao: 'IRRF — Serviços PJ a PJ (1,5%)', periodicidade: 'Por evento', prazo: 'Até o último dia útil do 2º decêndio do mês subsequente' },
    irrfServicosPF:        { codigo: '0588', tributo: 'IRRF', descricao: 'IRRF — Rendimentos do Trabalho', periodicidade: 'Mensal', prazo: 'Até o último dia útil do 2º decêndio do mês subsequente' },
    irrfAdmPublica:        { codigo: '1708', tributo: 'IRRF', descricao: 'IRRF — Adm. Pública', periodicidade: 'Por evento', prazo: 'Até o 3º dia útil após o decêndio da retenção' },
    csrfPis:               { codigo: '5979', tributo: 'PIS Retido', descricao: 'PIS Retido — CSRF', periodicidade: 'Quinzenal', prazo: 'Até o último dia útil da quinzena subsequente' },
    csrfCofins:            { codigo: '5960', tributo: 'COFINS Retido', descricao: 'COFINS Retido — CSRF', periodicidade: 'Quinzenal', prazo: 'Até o último dia útil da quinzena subsequente' },
    csrfCsll:              { codigo: '5987', tributo: 'CSLL Retido', descricao: 'CSLL Retido — CSRF', periodicidade: 'Quinzenal', prazo: 'Até o último dia útil da quinzena subsequente' },
    csrfUnificado:         { codigo: '5952', tributo: 'CSRF', descricao: 'CSRF Unificado — Adm. Pública', periodicidade: 'Por evento', prazo: 'Até o 3º dia útil após o decêndio da retenção' },
    // JCP
    jcpIrrf:               { codigo: '5706', tributo: 'IRRF s/ JCP', descricao: 'IRRF — JCP (17,5% — LC 224/2025)', periodicidade: 'Por evento', prazo: 'Até o 3º dia útil após o pagamento ou crédito' },
    // Outros
    beneficiarioNaoId:     { codigo: '2063', tributo: 'IRRF', descricao: 'IRRF — Beneficiário Não Identificado (35%)', periodicidade: 'Por evento', prazo: 'Data do pagamento' }
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
      artigo: 'Art. 726 + Art. 355-358 + LC 224/2025',
      aliquota: 0.175,
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
      exemploMunicipio: 0.05,
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
    exemploMunicipio: { estado: 'PA', ibge: '1505031', elegivel: true },
    getExemploMunicipio: function() {
      var uf = LR._estadoAtual;
      if (uf && LR.sudam.estados.indexOf(uf) >= 0) {
        var dados = LR.getSecaoEstado('dados_gerais');
        if (dados && dados.municipios_principais && dados.municipios_principais.length > 0) {
          var m = dados.municipios_principais[0];
          return { estado: uf, nome: m.nome, ibge: m.codigo_ibge, elegivel: true };
        }
      }
      return { estado: uf || 'N/D', elegivel: LR.ehSUDAM(uf) };
    },
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
      { id: 'SERVICOS_TEC', label: 'Serviços Técnicos Especializados', relevante: true },
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
      { id: 'FERIAS', descricao: 'Férias + 1/3 + encargos', artigo: 'Art. 342' },
      { id: '13_SALARIO', descricao: '13º salário + encargos', artigo: 'Art. 342' },
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
    { id: 1, nome: 'JCP — Juros sobre Capital Próprio', tipo: 'Dedução', complexidade: 'Baixa', risco: 'Baixo', impacto: '16,5% líquido do JCP pago (LC 224/2025)', artigo: 'Art. 355-358' },
    { id: 2, nome: 'Compensação de Prejuízos Fiscais', tipo: 'Compensação', complexidade: 'Baixa', risco: 'Baixo', impacto: 'Até 30% do lucro ajustado', artigo: 'Art. 580-590' },
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
    anoBase: 2026,
    faixas: [
      { ate: 2428.80, aliquota: 0, deducao: 0, descricao: 'Isento' },
      { ate: 2826.65, aliquota: 0.075, deducao: 182.16 },
      { ate: 3751.05, aliquota: 0.15, deducao: 394.16 },
      { ate: 4664.68, aliquota: 0.225, deducao: 675.49 },
      { acima: 4664.68, aliquota: 0.275, deducao: 908.73 }
    ],
    deducaoDependente: 189.59,
    descontoSimplificado: 607.20,
    redutorMaximo: 312.89,
    faixaIsencaoRedutor: 5000.00,
    faixaReducaoParcial: 7350.00,
    nota: 'MP 1.294/2025 (faixas) + Lei 15.270/2025 (redutor até R$5.000 isento)'
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPER INTERNO — arredondamento 2 casas
  // ═══════════════════════════════════════════════════════════════════════════

  function _r(v) {
    var n = Number(v);
    if (isNaN(n)) {
      console.warn('[IMPOST][_r] NaN detectado:', v);
      return 0;
    }
    return Math.round(n * 100) / 100;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INTEGRAÇÃO COM ESTADOS — Dados dinâmicos por UF (v3.2)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Estado atualmente selecionado pelo assinante.
   * Quando o HTML muda o <select>, chamar LR.setEstado('SP') para atualizar.
   */
  LR._estadoAtual = null;
  LR._dadosEstadoAtual = null;

  /**
   * Define o estado ativo e carrega seus dados de estados.js
   * @param {string} sigla - Ex: 'SP', 'RJ', 'PA', 'MT'
   * @returns {boolean} true se carregou com sucesso
   */
  LR.setEstado = function(sigla) {
    if (!sigla) return false;

    var Estados = window.Estados || window.EstadosBR;
    if (!Estados || typeof Estados.getEstado !== 'function') {
      console.warn('[LR] estados.js não carregado — dados estaduais indisponíveis');
      LR._estadoAtual = sigla.toUpperCase();
      LR._dadosEstadoAtual = null;
      return false;
    }

    var dados = Estados.getEstado(sigla);
    if (!dados) {
      console.warn('[LR] Estado não encontrado:', sigla);
      return false;
    }

    LR._estadoAtual = sigla.toUpperCase();
    LR._dadosEstadoAtual = dados;
    return true;
  };

  /**
   * Retorna o estado atualmente selecionado
   * @returns {string|null}
   */
  LR.getEstado = function() {
    return LR._estadoAtual;
  };

  /**
   * Retorna dados de uma seção do estado atual
   * @param {string} secao - 'icms', 'iss', 'ipva', 'incentivos', etc.
   * @returns {object|null}
   */
  LR.getSecaoEstado = function(secao) {
    return LR._dadosEstadoAtual ? (LR._dadosEstadoAtual[secao] || null) : null;
  };

  /**
   * Retorna a alíquota de ISS do estado/município atual
   * Fonte primária: estados.js iss.aliquota_geral
   * Fallback: 0.05 (máximo federal LC 116/2003)
   * @returns {number} Alíquota ISS (ex: 0.05 para 5%)
   */
  LR.getAliquotaISS = function() {
    // 1) Tentar seção ISS do estado carregado via setEstado()
    var iss = LR.getSecaoEstado('iss');
    if (iss && typeof iss.aliquota_geral === 'number') return iss.aliquota_geral;

    // 2) Tentar diretamente via API de estados.js (caso setEstado não foi chamado)
    if (LR._estadoAtual) {
      var Estados = window.Estados || window.EstadosBR;
      if (Estados && typeof Estados.getISS === 'function') {
        var issApi = Estados.getISS(LR._estadoAtual);
        if (issApi && typeof issApi.aliquota_geral === 'number') return issApi.aliquota_geral;
      }
    }

    // 3) Fallback federal máximo LC 116/2003
    return 0.05;
  };

  /**
   * Verifica se um estado é SUDAM (Amazônia Legal)
   * Fonte primária: estados.js incentivos.sudam.ativo
   * Fallback: lista hardcoded (compatibilidade)
   * @param {string} [uf] - Opcional, se não passar usa o estado atual
   * @returns {boolean}
   */
  LR.ehSUDAM = function(uf) {
    var sigla = (uf || LR._estadoAtual || '').toUpperCase();
    if (!sigla) return false;

    // Tentar ler de estados.js primeiro (fonte confiável)
    var Estados = window.Estados || window.EstadosBR;
    if (Estados && typeof Estados.getIncentivos === 'function') {
      var inc = Estados.getIncentivos(sigla);
      if (inc && inc.sudam) return inc.sudam.ativo === true;
    }

    // Fallback: lista hardcoded
    return LR.sudam.estados.indexOf(sigla) >= 0;
  };

  /**
   * Verifica se um estado é SUDENE (Nordeste + parciais)
   * Fonte primária: estados.js incentivos.sudene.ativo
   * Fallback: lista hardcoded (compatibilidade)
   * @param {string} [uf] - Opcional, se não passar usa o estado atual
   * @returns {boolean}
   */
  LR.ehSUDENE = function(uf) {
    var sigla = (uf || LR._estadoAtual || '').toUpperCase();
    if (!sigla) return false;

    var Estados = window.Estados || window.EstadosBR;
    if (Estados && typeof Estados.getIncentivos === 'function') {
      var inc = Estados.getIncentivos(sigla);
      if (inc && inc.sudene) return inc.sudene.ativo === true;
    }

    // Fallback: lista hardcoded
    return LR.sudene.estados.indexOf(sigla) >= 0;
  };

  // (helpers _calcIRPJ e _calcIRPJTrimestral removidos na v2.3 — delegação ao motor)

  // ═══════════════════════════════════════════════════════════════════════════
  // 30. FUNÇÕES DE CÁLCULO ESSENCIAIS (CORRIGIDAS)
  // ═══════════════════════════════════════════════════════════════════════════

  LR.calcular = {

    /**
     * Calcular IRPJ pelo Lucro Real
     * Base Legal: Art. 258-261
     */
    irpj: function (dados) {
      // DELEGAÇÃO AO MOTOR (v2.2) — MotorLR.calcularIRPJLucroReal()
      // Correção Falha #6: motor permite saldo negativo (PER/DCOMP)
      if (typeof MotorLR !== 'undefined' && MotorLR.calcularIRPJLucroReal) {
        var d = Object.assign({
          lucroLiquido: 0, adicoes: 0, exclusoes: 0,
          prejuizoFiscal: 0, numMeses: 12, incentivos: 0,
          retencoesFonte: 0, estimativasPagas: 0
        }, dados);

        // Mapear parâmetros mapeamento → motor
        var resultado = MotorLR.calcularIRPJLucroReal({
          lucroLiquidoContabil: d.lucroLiquido,
          totalAdicoes: d.adicoes,
          totalExclusoes: d.exclusoes,
          saldoPrejuizoFiscal: d.prejuizoFiscal,
          numMeses: d.numMeses,
          incentivosDedutiveis: d.incentivos,
          retencoesFonte: d.retencoesFonte,
          estimativasPagas: d.estimativasPagas
        });

        // Mapear retorno motor → interface esperada pelo mapeamento
        return {
          lucroLiquido: resultado.passo1_lucroLiquido,
          adicoes: resultado.passo2_adicoes,
          exclusoes: resultado.passo3_exclusoes,
          lucroAntesCompensacao: resultado.passo4_lucroAntesCompensacao,
          compensacaoPrejuizo: _r(resultado.passo5_compensacao),
          prejuizoRemanescente: _r(resultado.saldoPrejuizoRemanescente),
          lucroReal: _r(resultado.passo6_lucroReal),
          irpjNormal: _r(resultado.passo7_irpjNormal),
          irpjAdicional: _r(resultado.passo8_adicionalIRPJ),
          irpjDevido: _r(resultado.passo9_irpjDevido),
          deducoes: _r(resultado.passo10_deducoes),
          retencoesFonte: d.retencoesFonte,
          estimativasPagas: d.estimativasPagas,
          irpjAPagar: _r(resultado.passo12_irpjAPagar),
          saldoNegativo: resultado.saldoNegativo ? _r(resultado.valorSaldoNegativo) : 0,
          aliquotaEfetiva: resultado.aliquotaEfetiva
        };
      }

      // FALLBACK: implementação original caso o motor não esteja carregado
      var d = Object.assign({
        lucroLiquido: 0, adicoes: 0, exclusoes: 0,
        prejuizoFiscal: 0, numMeses: 12, incentivos: 0,
        retencoesFonte: 0, estimativasPagas: 0
      }, dados);

      var lucroAntesComp = d.lucroLiquido + d.adicoes - d.exclusoes;
      var limiteCompensacao = Math.max(lucroAntesComp, 0) * 0.30;
      var compensacao = Math.min(limiteCompensacao, d.prejuizoFiscal, Math.max(lucroAntesComp, 0));
      var lucroReal = Math.max(lucroAntesComp - compensacao, 0);

      var limiteAdicional = LR.aliquotas.irpj.limiteAdicionalMes * d.numMeses;
      var irpjNormal = lucroReal * LR.aliquotas.irpj.normal;
      var irpjAdicional = Math.max(lucroReal - limiteAdicional, 0) * LR.aliquotas.irpj.adicional;
      var irpjDevido = irpjNormal + irpjAdicional;
      var deducoes = Math.min(d.incentivos, irpjNormal);
      var irpjAPagar = irpjDevido - deducoes - d.retencoesFonte - d.estimativasPagas;

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
     * Base Legal: Lei 7.689/88 + Lei 9.249/95
     */
    csll: function (dados) {
      // DELEGAÇÃO AO MOTOR (v2.2) — MotorLR.calcularCSLL()
      if (typeof MotorLR !== 'undefined' && MotorLR.calcularCSLL) {
        var d = Object.assign({
          lucroLiquido: 0, adicoes: 0, exclusoes: 0,
          baseNegativa: 0, financeira: false
        }, dados);

        // Mapear parâmetros mapeamento → motor
        var resultado = MotorLR.calcularCSLL({
          lucroLiquidoContabil: d.lucroLiquido,
          adicoesCSLL: d.adicoes,
          exclusoesCSLL: d.exclusoes,
          saldoBaseNegativa: d.baseNegativa,
          ehInstituicaoFinanceira: d.financeira
        });

        // Mapear retorno motor → interface esperada pelo mapeamento
        return {
          baseAntesCompensacao: _r(resultado.baseAjustada),
          compensacao: _r(resultado.compensacaoBaseNegativa),
          baseNegativaRemanescente: _r(resultado.saldoBaseNegativaRemanescente),
          baseCalculo: _r(resultado.basePositiva),
          aliquota: resultado.aliquota,
          csllDevida: _r(resultado.csllDevida)
        };
      }

      // FALLBACK: implementação original caso o motor não esteja carregado
      var d = Object.assign({
        lucroLiquido: 0, adicoes: 0, exclusoes: 0,
        baseNegativa: 0, financeira: false
      }, dados);

      var base = d.lucroLiquido + d.adicoes - d.exclusoes;
      var limiteComp = Math.max(base, 0) * 0.30;
      var compensacao = Math.min(limiteComp, d.baseNegativa, Math.max(base, 0));
      var baseCalculo = Math.max(base - compensacao, 0);
      var aliq = d.financeira ? LR.aliquotas.csll.financeiras : LR.aliquotas.csll.geral;
      var csllDevida = baseCalculo * aliq;

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
     * Base Legal: Art. 355-358
     *
     * DELEGAÇÃO: MotorLR.calcularJCP() + fallback
     */
    jcp: function (dados) {
      // DELEGAÇÃO AO MOTOR (v3.3) — MotorLR.calcularJCP()
      if (typeof MotorLR !== 'undefined' && MotorLR.calcularJCP) {
        var resultado = MotorLR.calcularJCP(dados);

        // v3.3 FIX #3: Motor retorna erro se TJLP não informada — propagar ao chamador
        if (resultado.erro) {
          return {
            erro: true,
            mensagem: resultado.mensagem,
            taxasReferencia: resultado.taxasReferencia || null,
            artigo: resultado.artigo || 'Art. 355 c/c Lei 9.249/95, Art. 9º',
            jcpDedutivel: 0,
            economiaLiquida: 0,
            jcpMaximoTJLP: 0,
            limite50LL: 0,
            limite50Reservas: 0,
            economiaIRPJ: 0,
            economiaCSLL: 0,
            economiaTotal: 0,
            custoIRRF: 0,
            limiteUtilizado: 'N/A'
          };
        }

        // Mapear retorno motor → interface esperada pelo mapeamento
        return {
          jcpMaximoTJLP: _r(resultado.jcpMaximoTJLP),
          limite50LL: _r(resultado.limite1_50LL),
          limite50Reservas: _r(resultado.limite2_50Reservas),
          jcpDedutivel: _r(resultado.jcpDedutivel),
          economiaIRPJ: _r(resultado.economiaIRPJ),
          economiaCSLL: _r(resultado.economiaCSLL),
          economiaTotal: _r(resultado.economiaTotal),
          custoIRRF: _r(resultado.custoIRRF),
          economiaLiquida: _r(resultado.economiaLiquida),
          limiteUtilizado: resultado.limiteUtilizado
        };
      }

      // FALLBACK: implementação original caso o motor não esteja carregado
      // v3.3 FIX #3: TJLP NÃO tem default — deve ser informada explicitamente
      var d = Object.assign({
        patrimonioLiquido: 0, tjlp: null,
        lucroLiquidoAntes: 0, lucrosAcumulados: 0, numMeses: 12
      }, dados);

      // v3.3 FIX #3: Se TJLP não informada, retornar erro informativo
      if (d.tjlp === undefined || d.tjlp === null || d.tjlp === 0) {
        return {
          erro: true,
          mensagem: 'TJLP é OBRIGATÓRIA para cálculo do JCP e não possui valor default. '
            + 'A TJLP é divulgada trimestralmente pelo BACEN. '
            + 'Em 2025: Q1=7,97%, Q2≈8,50%, Q3/Q4≈8,77% a.a.',
          taxasReferencia: {
            'Q1_2025': '7,97% a.a. (0.0797)',
            'Q2_2025': '~8,50% a.a.',
            'Q3_Q4_2025': '~8,77% a.a.',
            'Q1_2026': 'Consultar BACEN'
          },
          artigo: 'Art. 355 c/c Lei 9.249/95, Art. 9º',
          jcpDedutivel: 0,
          economiaLiquida: 0,
          jcpMaximoTJLP: 0,
          limite50LL: 0,
          limite50Reservas: 0,
          economiaIRPJ: 0,
          economiaCSLL: 0,
          economiaTotal: 0,
          custoIRRF: 0,
          limiteUtilizado: 'N/A'
        };
      }

      var tjlpProp = d.tjlp * (d.numMeses / 12);
      // v3.3 FIX BUG MÉDIO 2: PL para JCP deve excluir LL do exercício corrente
      // Ref: IN RFB 1.700/2017, art. 75 — base PL = PL - LL do período
      var plParaJCP = _r(d.patrimonioLiquido - (d.lucroLiquidoAntes || 0));
      if (plParaJCP < 0) plParaJCP = 0; // PL base não pode ser negativo
      var maxTJLP = plParaJCP * tjlpProp;
      var lim1 = d.lucroLiquidoAntes * 0.50;
      var lim2 = d.lucrosAcumulados * 0.50;
      var limiteLegal = Math.max(lim1, lim2);
      var jcpDedutivel = Math.max(0, Math.min(maxTJLP, limiteLegal));
      var limAdicPeriodo = LR.aliquotas.irpj.limiteAdicionalMes * (d.numMeses || 12);
      var baseAntes = Math.max(d.lucroLiquidoAntes || 0, 0);
      var baseApos = Math.max(baseAntes - jcpDedutivel, 0);
      var irpjAntes = baseAntes * LR.aliquotas.irpj.normal + Math.max(0, baseAntes - limAdicPeriodo) * LR.aliquotas.irpj.adicional;
      var irpjApos = baseApos * LR.aliquotas.irpj.normal + Math.max(0, baseApos - limAdicPeriodo) * LR.aliquotas.irpj.adicional;
      var economiaIRPJ = irpjAntes - irpjApos;
      var economiaCSLL = jcpDedutivel * (LR.aliquotas.csll.geral || 0.09);
      var custoIRRF = jcpDedutivel * LR.aliquotas.jcp.irrfAliquota;

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
        limiteUtilizado: jcpDedutivel === maxTJLP ? 'TJLP' : jcpDedutivel === limiteLegal ? (lim1 >= lim2 ? '50% Lucro' : '50% Reservas') : 'TJLP'
      };
    },

    /**
     * Calcular Estimativa Mensal (CORRIGIDA — aceita objeto com campos detalhados)
     * Base Legal: Art. 219-225
     */
    estimativaMensal: function (dados) {
      // Compatibilidade: aceita (receitaBruta, tipoAtividade) OU objeto
      var d;
      if (typeof dados === 'number') {
        d = { receitaBruta: dados, tipoAtividade: arguments[1] || 'SERVICOS_GERAL' };
      } else {
        d = Object.assign({
          receitaBruta: 0, tipoAtividade: 'SERVICOS_GERAL',
          ganhosCapital: 0, demaisReceitas: 0,
          irrfCompensavel: 0, incentivosDedutiveis: 0
        }, dados);
      }

      // DELEGAÇÃO AO MOTOR (v3.0) — MotorLR.calcularEstimativaMensal()
      if (typeof MotorLR !== 'undefined' && MotorLR.calcularEstimativaMensal) {
        var resultado = MotorLR.calcularEstimativaMensal({
          receitaBrutaMensal: d.receitaBruta,
          tipoAtividade: d.tipoAtividade,
          ganhosCapital: d.ganhosCapital || 0,
          demaisReceitas: d.demaisReceitas || 0,
          irrfCompensavel: d.irrfCompensavel || 0,
          incentivosDedutiveis: d.incentivosDedutiveis || 0,
          financeira: d.financeira || false
        });

        // Mapear retorno motor → interface esperada pelo mapeamento
        return {
          atividade: resultado.presuncaoUtilizada,
          receitaBruta: resultado.receitaBruta,
          presuncaoIRPJ: parseFloat(resultado.percentualPresuncaoIRPJ) / 100 || 0,
          presuncaoCSLL: parseFloat(resultado.percentualPresuncaoCSLL) / 100 || 0,
          baseIRPJ: _r(resultado.basePresumidaIRPJ + (resultado.ganhosCapital || 0) + (resultado.demaisReceitas || 0)),
          baseCSLL: _r(resultado.csll ? resultado.csll.baseCSLL : 0),
          irpjNormal: _r(resultado.irpjNormal),
          irpjAdicional: _r(resultado.irpjAdicional),
          irpjDevido: _r(resultado.irpjDevido),
          deducoes: _r(resultado.deducoes),
          irrfCompensavel: resultado.irrfCompensavel || 0,
          irpjAPagar: _r(resultado.irpjAPagar),
          csllDevida: _r(resultado.csll ? resultado.csll.csllDevida : 0),
          totalAPagar: _r(resultado.totalAPagar),
          // v3.2: Campos para consistência com fallback
          saldoNegativo: 0,
          saldoNegativoDestinacao: null
        };
      }

      // FALLBACK: implementação original caso o motor não esteja carregado
      var p = LR.presuncoes[d.tipoAtividade];
      if (!p) return { erro: 'Tipo de atividade não encontrado: ' + d.tipoAtividade };

      var baseIRPJ = d.receitaBruta * p.irpj + (d.ganhosCapital || 0) + (d.demaisReceitas || 0);
      var baseCSLL = d.receitaBruta * p.csll + (d.ganhosCapital || 0) + (d.demaisReceitas || 0);
      var irpjNormal = baseIRPJ * 0.15;
      var irpjAdicional = Math.max(baseIRPJ - 20000, 0) * 0.10;
      var irpjDevido = irpjNormal + irpjAdicional;
      var deducoes = Math.min(d.incentivosDedutiveis || 0, irpjNormal);
      var irpjAPagar = Math.max(irpjDevido - deducoes - (d.irrfCompensavel || 0), 0);
      // CORREÇÃO: Usar alíquota correta de CSLL (15% para inst. financeiras, 9% demais)
      var aliqCSLL = (d.financeira === true || d.financeira === 'true') ? 0.15 : 0.09;
      var csllDevida = baseCSLL * aliqCSLL;

      return {
        atividade: p.label,
        receitaBruta: d.receitaBruta,
        presuncaoIRPJ: p.irpj,
        presuncaoCSLL: p.csll,
        baseIRPJ: _r(baseIRPJ),
        baseCSLL: _r(baseCSLL),
        irpjNormal: _r(irpjNormal),
        irpjAdicional: _r(irpjAdicional),
        irpjDevido: _r(irpjDevido),
        deducoes: _r(deducoes),
        irrfCompensavel: d.irrfCompensavel || 0,
        irpjAPagar: _r(irpjAPagar),
        saldoNegativo: irpjAPagar < 0 ? _r(Math.abs(irpjAPagar)) : 0,
        saldoNegativoDestinacao: irpjAPagar < 0 ? 'Compensável via PER/DCOMP (IN RFB 2.055/2021)' : null,
        csllDevida: _r(csllDevida),
        totalAPagar: _r(irpjAPagar + csllDevida)
      };
    },

    /**
     * ═══════════════════════════════════════════════════════════════════════
     * Calcular PIS/COFINS Não-Cumulativo
     * ═══════════════════════════════════════════════════════════════════════
     *
     * Aceita TANTO o campo consolidado "baseCreditos" QUANTO os campos
     * individuais (comprasBensRevenda, insumosProducao, etc.).
     *
     * DELEGAÇÃO: MotorLR.calcularPISCOFINSNaoCumulativo() + fallback
     * Base Legal: Lei 10.637/02 (PIS) + Lei 10.833/03 (COFINS)
     */
    pisCofins: function (dados) {
      var d = Object.assign({
        receitaBruta: 0, isentas: 0, exportacao: 0,
        // Campo consolidado (retrocompatível)
        baseCreditos: 0,
        // Campos individuais (do motor v4.6)
        comprasBensRevenda: 0,
        insumosProducao: 0,
        energiaEletrica: 0,
        alugueisPJ: 0,
        alugueisPF: 0,                          // v3.3 FIX #2: Aluguel PF — NÃO gera crédito (Lei 10.637/02, Art. 3º, IV)
        depreciacaoBens: 0,
        depreciacaoBensCredito: 0,               // v3.3 FIX #4: Renomeado para distinguir de depreciação contábil
        depreciacaoBensMetodo: 'CONTABIL',       // v3.3 FIX #4: 'CONTABIL' | 'FISCAL_1_48' | 'FISCAL_1_60'
        custoAquisicaoImobilizado: 0,            // v3.3 FIX #4: Para cálculo fiscal (1/48 ou 1/60 por mês)
        mesesUsoImobilizado: 0,                  // v3.3 FIX #4: Meses de uso do imobilizado para crédito fiscal
        devolucoes: 0,
        freteArmazenagem: 0,
        leasing: 0,
        outrosCreditos: 0,
        // CORREÇÃO BUG #8: Campo valeTransporteRefeicao agora é aceito e repassado ao motor
        valeTransporteRefeicao: 0
      }, dados);

      // ─── Se baseCreditos consolidado foi passado, distribuir para campos individuais ───
      // O motor só aceita campos individuais, não o consolidado "baseCreditos"
      var creditosIndividuais = {
        comprasBensRevenda: d.comprasBensRevenda,
        insumosProducao: d.insumosProducao,
        energiaEletrica: d.energiaEletrica,
        alugueisPJ: d.alugueisPJ,
        alugueisPF: d.alugueisPF,                               // v3.3 FIX #2: Repassar ao motor (sem crédito)
        depreciacaoBens: d.depreciacaoBens,
        depreciacaoBensCredito: d.depreciacaoBensCredito || d.depreciacaoBens || 0,  // v3.3 FIX #4: Retrocompatibilidade
        depreciacaoBensMetodo: d.depreciacaoBensMetodo,          // v3.3 FIX #4: Método de cálculo
        custoAquisicaoImobilizado: d.custoAquisicaoImobilizado,  // v3.3 FIX #4: Custo para método fiscal
        mesesUsoImobilizado: d.mesesUsoImobilizado,              // v3.3 FIX #4: Meses de uso
        devolucoes: d.devolucoes,
        freteArmazenagem: d.freteArmazenagem,
        leasing: d.leasing,
        // CORREÇÃO BUG #8: valeTransporteRefeicao somado em outrosCreditos (motor não tem campo separado)
        outrosCreditos: d.outrosCreditos + (d.valeTransporteRefeicao || 0)
      };

      // Se baseCreditos consolidado foi passado e campos individuais estão zerados,
      // colocar tudo em outrosCreditos para o motor somar corretamente
      // CORREÇÃO BUG #8: inclui valeTransporteRefeicao na verificação
      var somaIndividuais = d.comprasBensRevenda + d.insumosProducao
        + d.energiaEletrica + d.alugueisPJ + d.depreciacaoBens
        + d.devolucoes + d.freteArmazenagem + d.leasing + d.outrosCreditos
        + (d.valeTransporteRefeicao || 0);

      if (d.baseCreditos > 0 && somaIndividuais === 0) {
        creditosIndividuais.outrosCreditos = d.baseCreditos;
      }

      // DELEGAÇÃO AO MOTOR (v3.3) — MotorLR.calcularPISCOFINSNaoCumulativo()
      if (typeof MotorLR !== 'undefined' && MotorLR.calcularPISCOFINSNaoCumulativo) {
        var resultado = MotorLR.calcularPISCOFINSNaoCumulativo({
          receitaBruta: d.receitaBruta,
          receitasIsentas: d.isentas,
          receitasExportacao: d.exportacao,
          comprasBensRevenda: creditosIndividuais.comprasBensRevenda,
          insumosProducao: creditosIndividuais.insumosProducao,
          energiaEletrica: creditosIndividuais.energiaEletrica,
          alugueisPJ: creditosIndividuais.alugueisPJ,
          alugueisPF: creditosIndividuais.alugueisPF,                               // v3.3 FIX #2
          depreciacaoBensCredito: creditosIndividuais.depreciacaoBensCredito,         // v3.3 FIX #4: Campo renomeado
          depreciacaoBensMetodo: creditosIndividuais.depreciacaoBensMetodo,           // v3.3 FIX #4
          custoAquisicaoImobilizado: creditosIndividuais.custoAquisicaoImobilizado,   // v3.3 FIX #4
          mesesUsoImobilizado: creditosIndividuais.mesesUsoImobilizado,               // v3.3 FIX #4
          devolucoes: creditosIndividuais.devolucoes,
          freteArmazenagem: creditosIndividuais.freteArmazenagem,
          leasing: creditosIndividuais.leasing,
          outrosCreditos: creditosIndividuais.outrosCreditos
        });

        // Mapear retorno motor → interface esperada pelo mapeamento
        // Motor retorna: debitos.pis/cofins, creditos.*, aPagar.*, saldoCredor.*
        // Mapeamento espera campos flat adicionais: debitoPIS, creditoPIS, pisAPagar, totalAPagar
        return {
          receitaTributavel: _r(resultado.receitaTributavel),
          debitoPIS: _r(resultado.debitos.pis),
          debitoCOFINS: _r(resultado.debitos.cofins),
          creditoPIS: _r(resultado.creditos.pis),
          creditoCOFINS: _r(resultado.creditos.cofins),
          creditos: {
            baseTotal: _r(resultado.creditos.baseTotal),
            pis: _r(resultado.creditos.pis),
            cofins: _r(resultado.creditos.cofins),
            total: _r(resultado.creditos.total),
            detalhamento: resultado.creditos.detalhamento
          },
          pisAPagar: _r(resultado.aPagar.pis),
          cofinsAPagar: _r(resultado.aPagar.cofins),
          aPagar: {
            pis: _r(resultado.aPagar.pis),
            cofins: _r(resultado.aPagar.cofins),
            total: _r(resultado.aPagar.total)
          },
          saldoCredor: {
            pis: _r(resultado.saldoCredor.pis),
            cofins: _r(resultado.saldoCredor.cofins),
            total: _r(resultado.saldoCredor.total)
          },
          totalAPagar: _r(resultado.aPagar.total),
          // v3.3 FIX #5: Duas métricas de alíquota efetiva com labels claros
          aliquotaEfetiva: resultado.aliquotaEfetiva,
          aliquotaEfetivaBruta: resultado.aliquotaEfetivaBruta,
          aliquotaEfetivaDescricao: resultado.aliquotaEfetivaDescricao,
          economiaCreditos: _r(resultado.economiaCreditos),
          // v3.3 FIX #2 + #4: Alertas do motor (aluguel PF, depreciação, etc.)
          alertas: resultado.alertas || [],
          artigos: resultado.artigos
        };
      }

      // FALLBACK: implementação original caso o motor não esteja carregado
      // v3.3 FIX E2#5: Indicar modo fallback
      LR._modoFallback = true;
      if (LR._fallbackUsado.indexOf('pisCofins') === -1) LR._fallbackUsado.push('pisCofins');
      var alertasFallback = [];
      var totalBaseCreditos = d.baseCreditos;
      if (!totalBaseCreditos || totalBaseCreditos === 0) {
        totalBaseCreditos = somaIndividuais;
      }

      // v3.3 FIX #2: Aluguel PF não gera crédito — alertar
      if (d.alugueisPF > 0) {
        alertasFallback.push({
          tipo: 'ALERTA_ALUGUEL_PF',
          mensagem: 'Aluguel pago a Pessoa Física (R$ ' + d.alugueisPF.toFixed(2) + ') NÃO gera crédito PIS/COFINS. '
            + 'Apenas aluguéis pagos a Pessoa Jurídica permitem aproveitamento de crédito.',
          artigo: 'Lei 10.637/2002, Art. 3º, IV',
          valorSemCredito: d.alugueisPF
        });
      }

      // v3.3 FIX #4: Alerta sobre método contábil de depreciação
      if ((d.depreciacaoBens > 0 || d.depreciacaoBensCredito > 0) && d.depreciacaoBensMetodo === 'CONTABIL') {
        alertasFallback.push({
          tipo: 'ALERTA_DEPRECIACAO_CONTABIL',
          mensagem: 'Crédito de PIS/COFINS sobre depreciação calculado pela taxa contábil. '
            + 'O crédito fiscal correto segue regras próprias (1/48 do custo de aquisição para bens a partir de jan/2024, ou 1/60 para anteriores).',
          artigo: 'Lei 10.637/02, Art. 3º, VI',
          risco: 'Crédito calculado pode divergir do crédito fiscal permitido.'
        });
      }

      var tributavel = d.receitaBruta - d.isentas - d.exportacao;
      var debPIS = tributavel * LR.aliquotas.pisCofins.pisNaoCumulativo;
      var debCOFINS = tributavel * LR.aliquotas.pisCofins.cofinsNaoCumulativo;
      var credPIS = totalBaseCreditos * LR.aliquotas.pisCofins.pisNaoCumulativo;
      var credCOFINS = totalBaseCreditos * LR.aliquotas.pisCofins.cofinsNaoCumulativo;

      var pisAPagar = Math.max(debPIS - credPIS, 0);
      var cofinsAPagar = Math.max(debCOFINS - credCOFINS, 0);
      var saldoCredorPIS = Math.max(credPIS - debPIS, 0);
      var saldoCredorCOFINS = Math.max(credCOFINS - debCOFINS, 0);

      // v3.3 FIX #5: Duas métricas de alíquota efetiva
      var totalBrutoFB = debPIS + debCOFINS;
      var totalLiquidoFB = pisAPagar + cofinsAPagar;

      return {
        receitaTributavel: _r(tributavel),
        debitoPIS: _r(debPIS),
        debitoCOFINS: _r(debCOFINS),
        creditoPIS: _r(credPIS),
        creditoCOFINS: _r(credCOFINS),
        creditos: {
          baseTotal: _r(totalBaseCreditos),
          pis: _r(credPIS),
          cofins: _r(credCOFINS),
          total: _r(credPIS + credCOFINS),
          detalhamento: {
            comprasBensRevenda: d.comprasBensRevenda,
            insumosProducao: d.insumosProducao,
            energiaEletrica: d.energiaEletrica,
            alugueisPJ: d.alugueisPJ,
            alugueisPF_semCredito: d.alugueisPF,
            depreciacaoBens: d.depreciacaoBens,
            depreciacaoMetodoUsado: d.depreciacaoBensMetodo || 'CONTABIL',
            devolucoes: d.devolucoes,
            freteArmazenagem: d.freteArmazenagem,
            leasing: d.leasing,
            outrosCreditos: d.outrosCreditos
          }
        },
        pisAPagar: _r(pisAPagar),
        cofinsAPagar: _r(cofinsAPagar),
        aPagar: {
          pis: _r(pisAPagar),
          cofins: _r(cofinsAPagar),
          total: _r(pisAPagar + cofinsAPagar)
        },
        saldoCredor: {
          pis: _r(saldoCredorPIS),
          cofins: _r(saldoCredorCOFINS),
          total: _r(saldoCredorPIS + saldoCredorCOFINS)
        },
        totalAPagar: _r(pisAPagar + cofinsAPagar),
        // v3.3 FIX #5: Duas métricas claras
        aliquotaEfetiva: d.receitaBruta > 0
          ? _r(totalLiquidoFB / d.receitaBruta * 100) + '%'
          : '0%',
        aliquotaEfetivaBruta: d.receitaBruta > 0
          ? _r(totalBrutoFB / d.receitaBruta * 100) + '%'
          : '0%',
        aliquotaEfetivaDescricao: {
          liquida: 'Alíquota efetiva LÍQUIDA = (PIS+COFINS a pagar) ÷ Receita Bruta — carga real após créditos',
          bruta: 'Alíquota efetiva BRUTA = (débitos PIS+COFINS) ÷ Receita Bruta — antes dos créditos',
          nota: 'Use LÍQUIDA para carga tributária real. BRUTA para composição analítica e benchmarking.'
        },
        economiaCreditos: _r(credPIS + credCOFINS),
        alertas: alertasFallback,
        artigos: 'Lei 10.637/02, Lei 10.833/03'
      };
    },

    /**
     * Calcular retenções integradas de uma NF
     * DELEGAÇÃO: MotorLR.calcularRetencaoIntegrada() + fallback
     * Base Legal: Art. 714-786
     */
    retencoesNF: function (valorNF, opts) {
      var o = Object.assign({ admPublica: false, simplesNacional: false, temCSRF: true, iss: 0 }, opts);

      // Simples Nacional — sem retenções federais (atalho, não precisa chamar motor)
      if (o.simplesNacional) return { irrf: 0, csrf: 0, iss: 0, total: 0, liquido: valorNF, nota: 'Simples Nacional — sem retenções federais' };

      // DELEGAÇÃO AO MOTOR (v2.3) — MotorLR.calcularRetencaoIntegrada()
      if (typeof MotorLR !== 'undefined' && MotorLR.calcularRetencaoIntegrada) {
        var resultado = MotorLR.calcularRetencaoIntegrada({
          valorBrutoNF: valorNF,
          tipoServico: 'SERVICOS_PROFISSIONAIS',
          prestadorSimples: false,
          retencaoISS: o.iss > 0,
          aliquotaISS: o.iss || LR.getAliquotaISS(),
          tomadorAdmPublica: o.admPublica,
          tipoReceitaAdmPublica: 'SERVICOS'
        });

        // Mapear retorno motor → interface esperada pelo mapeamento
        // Motor retorna estrutura mais detalhada; mapeamento espera campos flat
        var csrfTotal = o.temCSRF ? resultado.csrf.total : 0;
        var totalRetido = resultado.irrf.valor + csrfTotal + resultado.iss.valor;

        return {
          valorBruto: _r(valorNF),
          irrf: _r(resultado.irrf.valor),
          irrfAliquota: o.admPublica ? '4,8%' : '1,5%',
          csrfPIS: _r(o.temCSRF ? resultado.csrf.pis : 0),
          csrfCOFINS: _r(o.temCSRF ? resultado.csrf.cofins : 0),
          csrfCSLL: _r(o.temCSRF ? resultado.csrf.csll : 0),
          csrfTotal: _r(csrfTotal),
          iss: _r(resultado.iss.valor),
          totalRetido: _r(totalRetido),
          liquido: _r(valorNF - totalRetido)
        };
      }

      // FALLBACK: implementação original caso o motor não esteja carregado
      var irrf = o.admPublica ? valorNF * 0.048 : valorNF * 0.015;
      var csrf = o.temCSRF ? valorNF * 0.0465 : 0;
      var iss = valorNF * o.iss;
      var total = irrf + csrf + iss;

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
     * Base Legal: Art. 615-627
     */
    lucroExploracao: function (dados) {
      // DELEGAÇÃO AO MOTOR (v3.0) — MotorLR.calcularLucroExploracao()
      if (typeof MotorLR !== 'undefined' && MotorLR.calcularLucroExploracao) {
        var d = Object.assign({
          lucroLiquido: 0, receitasFinanceirasLiquidas: 0,
          resultadoMEP: 0, resultadoNaoOperacional: 0,
          receitasAnteriores: 0, csllDevida: 0, despFinLiquidas: 0
        }, dados);

        // Mapear parâmetros mapeamento → motor
        var resultado = MotorLR.calcularLucroExploracao({
          lucroLiquido: d.lucroLiquido,
          receitasFinanceiras: Math.max(d.receitasFinanceirasLiquidas, 0),
          despesasFinanceiras: Math.max(-d.receitasFinanceirasLiquidas, 0) + d.despFinLiquidas,
          resultadoParticipacoes: d.resultadoMEP,
          ganhosCapitalAtivoNaoCirc: Math.max(d.resultadoNaoOperacional, 0),
          perdasCapitalAtivoNaoCirc: Math.max(-d.resultadoNaoOperacional, 0),
          receitasExerciciosAnteriores: d.receitasAnteriores,
          csllDevida: d.csllDevida
        });

        // Mapear retorno motor → interface esperada pelo mapeamento
        // v3.2 FIX: null-safe — 0 é falsy em JS, usar != null em vez de ||
        var lucroExp = (resultado.lucroExploracao != null)
          ? resultado.lucroExploracao
          : (resultado.lucroExploracaoBruto != null ? resultado.lucroExploracaoBruto : 0);
        var reducao75 = Math.max(lucroExp, 0) * LR.aliquotas.irpj.normal * 0.75;

        return {
          lucroLiquido: d.lucroLiquido,
          exclusoes: _r(resultado.exclusoes ? resultado.exclusoes.total : 0),
          adicoes: _r(resultado.adicoes ? resultado.adicoes.total : 0),
          lucroExploracao: _r(lucroExp),
          irpjSobreExploracao: _r(Math.max(lucroExp, 0) * 0.15),
          reducao75: _r(reducao75),
          irpjAposReducao: _r(Math.max(lucroExp, 0) * 0.15 - reducao75)
        };
      }

      // FALLBACK: implementação original caso o motor não esteja carregado
      var d = Object.assign({
        lucroLiquido: 0, receitasFinanceirasLiquidas: 0,
        resultadoMEP: 0, resultadoNaoOperacional: 0,
        receitasAnteriores: 0, csllDevida: 0, despFinLiquidas: 0
      }, dados);

      var exclusoes = d.receitasFinanceirasLiquidas + Math.max(d.resultadoMEP, 0) +
        Math.max(d.resultadoNaoOperacional, 0) + d.receitasAnteriores;
      var adicoes = d.csllDevida + d.despFinLiquidas + Math.abs(Math.min(d.resultadoMEP, 0));
      var lucroExploracao = d.lucroLiquido - exclusoes + adicoes;
      var reducao75 = Math.max(lucroExploracao, 0) * LR.aliquotas.irpj.normal * 0.75;

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
     * ═══════════════════════════════════════════════════════════════════════
     * Compensar Integrado — Prejuízos operacionais, não-operacionais e CSLL
     * ═══════════════════════════════════════════════════════════════════════
     *
     * DELEGAÇÃO: MotorLR.compensarIntegrado() + fallback
     * Correção Falha #7: Motor calcula economia IRPJ corretamente (normal+adicional)
     * Correção Falha #4: Motor elimina simulação "lucro líquido = -R$" incorreta
     * Base Legal: Art. 579-586
     */
    compensarIntegrado: function (dados) {
      // DELEGAÇÃO AO MOTOR (v2.3) — MotorLR.compensarIntegrado()
      // Interface idêntica: mesmos parâmetros e mesma estrutura de retorno
      if (typeof MotorLR !== 'undefined' && MotorLR.compensarIntegrado) {
        var resultado = MotorLR.compensarIntegrado(dados);

        // v3.2: Consolidar compensacaoEfetiva no resumo (downstream acessa este campo)
        if (resultado && resultado.resumo && !resultado.resumo.compensacaoEfetiva) {
          resultado.resumo.compensacaoEfetiva = {
            prejuizoOperacional: resultado.etapa3_compensacaoOperacional
              ? (resultado.etapa3_compensacaoOperacional.compensacaoEfetiva || 0)
              : 0,
            prejuizoNaoOperacional: resultado.etapa2_compensacaoNaoOperacional
              ? (resultado.etapa2_compensacaoNaoOperacional.compensacaoEfetiva || 0)
              : 0,
            baseNegativaCSLL: resultado.etapa4_compensacaoCSLL
              ? (resultado.etapa4_compensacaoCSLL.compensacaoEfetiva || 0)
              : 0
          };
        }

        return resultado;
      }

      // FALLBACK: implementação original caso o motor não esteja carregado
      // v3.3 FIX E2#3: Adicionado 'financeira' para alíquota CSLL correta (9% geral / 15% financeiras)
      // v3.3 FIX E2#5: Indicar modo fallback
      LR._modoFallback = true;
      if (LR._fallbackUsado.indexOf('compensarIntegrado') === -1) LR._fallbackUsado.push('compensarIntegrado');
      var d = Object.assign({
        lucroLiquido: 0, adicoes: 0, exclusoes: 0,
        saldoPrejuizoOperacional: 0,
        saldoPrejuizoNaoOperacional: 0,
        saldoBaseNegativaCSLL: 0,
        lucroNaoOperacional: 0,
        atividadeRural: false,
        trimestral: true,
        financeira: false
      }, dados);

      var lucroAjustado = d.lucroLiquido + d.adicoes - d.exclusoes;

      var resultado = {
        etapa1_lucroAjustado: {
          lucroLiquido: d.lucroLiquido,
          adicoes: d.adicoes,
          exclusoes: d.exclusoes,
          lucroRealAjustado: lucroAjustado,
          temLucro: lucroAjustado > 0,
          temPrejuizo: lucroAjustado < 0,
          artigo: 'Art. 579-580'
        },
        etapa2_compensacaoNaoOperacional: null,
        etapa3_compensacaoOperacional: null,
        etapa4_compensacaoCSLL: null,
        resumo: {
          lucroRealAntes: lucroAjustado,
          totalCompensado: 0,
          lucroRealFinal: lucroAjustado,
          baseCSLLFinal: lucroAjustado,
          saldosPosCompensacao: {
            prejuizoOperacional: d.saldoPrejuizoOperacional,
            prejuizoNaoOperacional: d.saldoPrejuizoNaoOperacional,
            baseNegativaCSLL: d.saldoBaseNegativaCSLL
          },
          economia: { irpj: 0, csll: 0, total: 0 }
        },
        artigo: 'Art. 579-586',
        trimestral: d.trimestral
      };

      if (lucroAjustado <= 0) {
        var novoPrejuizo = Math.abs(lucroAjustado);
        var prejNaoOp = d.lucroNaoOperacional < 0 ? Math.abs(d.lucroNaoOperacional) : 0;
        var prejOp = novoPrejuizo - prejNaoOp;

        resultado.resumo.novoPrejuizoOperacional = Math.max(0, prejOp);
        resultado.resumo.novoPrejuizoNaoOperacional = prejNaoOp;
        resultado.resumo.saldosPosCompensacao.prejuizoOperacional = d.saldoPrejuizoOperacional + Math.max(0, prejOp);
        resultado.resumo.saldosPosCompensacao.prejuizoNaoOperacional = d.saldoPrejuizoNaoOperacional + prejNaoOp;
        resultado.resumo.saldosPosCompensacao.baseNegativaCSLL = d.saldoBaseNegativaCSLL + novoPrejuizo;
        resultado.resumo.lucroRealFinal = 0;
        resultado.resumo.baseCSLLFinal = 0;
        resultado.resumo.observacao = 'Prejuízo fiscal no período: R$ ' + novoPrejuizo.toFixed(2) + ' — registrar na Parte B do LALUR/LACS';
        return resultado;
      }

      var lucroRealCorrente = lucroAjustado;
      var baseCSLLCorrente = lucroAjustado;

      // Helper local para IRPJ (fallback — usa limiar correto por período)
      var _limAdicFallback = d.trimestral ? LR.aliquotas.irpj.limiteAdicionalTrimestre : LR.aliquotas.irpj.limiteAdicionalAno;
      function _calcIRPJFallback(lr) {
        if (lr <= 0) return 0;
        var n = lr * LR.aliquotas.irpj.normal;
        var a = Math.max(0, lr - _limAdicFallback) * LR.aliquotas.irpj.adicional;
        return n + a;
      }

      if (d.lucroNaoOperacional > 0 && d.saldoPrejuizoNaoOperacional > 0) {
        var limNaoOp = d.lucroNaoOperacional * 0.30;
        var compNaoOp = Math.min(limNaoOp, d.saldoPrejuizoNaoOperacional);

        resultado.etapa2_compensacaoNaoOperacional = {
          lucroNaoOperacional: d.lucroNaoOperacional,
          saldoPrejuizoAnterior: d.saldoPrejuizoNaoOperacional,
          compensacaoPermitida: _r(limNaoOp),
          compensacaoEfetiva: _r(compNaoOp),
          saldoPrejuizoRemanescente: _r(d.saldoPrejuizoNaoOperacional - compNaoOp),
          artigo: 'Art. 581'
        };

        lucroRealCorrente -= compNaoOp;
        baseCSLLCorrente -= compNaoOp;
        resultado.resumo.totalCompensado += compNaoOp;
        resultado.resumo.saldosPosCompensacao.prejuizoNaoOperacional = _r(d.saldoPrejuizoNaoOperacional - compNaoOp);
      }

      if (lucroRealCorrente > 0 && d.saldoPrejuizoOperacional > 0) {
        var limOp = d.atividadeRural ? lucroRealCorrente : lucroRealCorrente * 0.30;
        var compOp = Math.min(limOp, d.saldoPrejuizoOperacional);

        var irpjSem = _calcIRPJFallback(lucroRealCorrente);
        var irpjCom = _calcIRPJFallback(lucroRealCorrente - compOp);

        resultado.etapa3_compensacaoOperacional = {
          lucroRealAjustado: _r(lucroRealCorrente),
          saldoPrejuizoAnterior: d.saldoPrejuizoOperacional,
          compensacaoPermitida: _r(limOp),
          compensacaoEfetiva: _r(compOp),
          lucroRealAposCompensacao: _r(lucroRealCorrente - compOp),
          saldoPrejuizoRemanescente: _r(d.saldoPrejuizoOperacional - compOp),
          atividadeRural: d.atividadeRural,
          economia: { irpj: _r(irpjSem - irpjCom) },
          artigo: d.atividadeRural ? 'Art. 583' : 'Art. 580'
        };

        lucroRealCorrente -= compOp;
        // baseCSLLCorrente -= compOp; // REMOVIDO: prejuízo fiscal operacional (Art. 580-581 RIR/2018) é exclusivo do IRPJ; CSLL usa base negativa própria (Lei 9.065/1995, art. 16)
        resultado.resumo.totalCompensado += compOp;
        resultado.resumo.saldosPosCompensacao.prejuizoOperacional = _r(d.saldoPrejuizoOperacional - compOp);
        resultado.resumo.economia.irpj += _r(irpjSem - irpjCom);
      }

      if (baseCSLLCorrente > 0 && d.saldoBaseNegativaCSLL > 0) {
        var limCSLL = baseCSLLCorrente * 0.30;
        var compCSLL = Math.min(limCSLL, d.saldoBaseNegativaCSLL);
        // v3.3 FIX E2#3: Alíquota CSLL dinâmica — 15% para financeiras (Lei 13.169/2015), 9% geral
        var aliqCSLLComp = (d.financeira === true || d.financeira === 'true') ? 0.15 : 0.09;
        var economiaCSLL = compCSLL * aliqCSLLComp;

        resultado.etapa4_compensacaoCSLL = {
          baseCalculoCSLL: _r(baseCSLLCorrente),
          saldoBaseNegativaAnterior: d.saldoBaseNegativaCSLL,
          compensacaoPermitida: _r(limCSLL),
          compensacaoEfetiva: _r(compCSLL),
          baseCSLLAposCompensacao: _r(baseCSLLCorrente - compCSLL),
          saldoBaseNegativaRemanescente: _r(d.saldoBaseNegativaCSLL - compCSLL),
          economia: { csll: _r(economiaCSLL) },
          artigo: 'Lei 9.065/1995, art. 16'
        };

        baseCSLLCorrente -= compCSLL;
        resultado.resumo.saldosPosCompensacao.baseNegativaCSLL = _r(d.saldoBaseNegativaCSLL - compCSLL);
        resultado.resumo.economia.csll += _r(economiaCSLL);
      }

      resultado.resumo.lucroRealFinal = _r(Math.max(0, lucroRealCorrente));
      resultado.resumo.baseCSLLFinal = _r(Math.max(0, baseCSLLCorrente));
      resultado.resumo.economia.total = (function() {
        var _ecoPisCofins = resultado.resumo.economia.pisCofins
          || resultado.resumo.economia.creditosPisCofins || 0;
        return _r(
          resultado.resumo.economia.irpj +
          resultado.resumo.economia.csll +
          _ecoPisCofins
        );
      })();

      // CORREÇÃO v3.1: Adicionar compensacaoEfetiva ao resumo para estudos.js
      // estudos.js acessa r.compensacao.resumo.compensacaoEfetiva.prejuizoOperacional
      resultado.resumo.compensacaoEfetiva = {
        prejuizoOperacional: resultado.etapa3_compensacaoOperacional
          ? (resultado.etapa3_compensacaoOperacional.compensacaoEfetiva || 0)
          : 0,
        prejuizoNaoOperacional: resultado.etapa2_compensacaoNaoOperacional
          ? (resultado.etapa2_compensacaoNaoOperacional.compensacaoEfetiva || 0)
          : 0,
        baseNegativaCSLL: resultado.etapa4_compensacaoCSLL
          ? (resultado.etapa4_compensacaoCSLL.compensacaoEfetiva || 0)
          : 0
      };

      return resultado;
    },

    /**
     * ═══════════════════════════════════════════════════════════════════════
     * Compensar Retenções
     * ═══════════════════════════════════════════════════════════════════════
     *
     * Compensa retenções sofridas (IRRF, PIS, COFINS, CSLL) com tributos devidos.
     * IRRF → IRPJ; PIS → PIS; COFINS → COFINS; CSLL → CSLL
     *
     * DELEGAÇÃO: MotorLR.compensarRetencoes() + fallback
     * Base Legal: Art. 717 (IRRF); Lei 10.833/2003, art. 36 (CSRF)
     */
    compensarRetencoes: function (params) {
      // DELEGAÇÃO AO MOTOR (v2.3) — MotorLR.compensarRetencoes()
      // Interface idêntica: { retencoesSofridas, tributosDevidos }
      if (typeof MotorLR !== 'undefined' && MotorLR.compensarRetencoes) {
        return MotorLR.compensarRetencoes(params);
      }

      // FALLBACK: implementação original caso o motor não esteja carregado
      var ret = params.retencoesSofridas || {};
      var trib = params.tributosDevidos || {};

      var irrfCompensavel = Math.min(ret.irrf || 0, trib.irpj || 0);
      var saldoIRRF = _r((ret.irrf || 0) - irrfCompensavel);

      var pisCompensavel = Math.min(ret.pis || 0, trib.pis || 0);
      var saldoPIS = _r((ret.pis || 0) - pisCompensavel);

      var cofinsCompensavel = Math.min(ret.cofins || 0, trib.cofins || 0);
      var saldoCOFINS = _r((ret.cofins || 0) - cofinsCompensavel);

      var csllCompensavel = Math.min(ret.csll || 0, trib.csll || 0);
      var saldoCSLL = _r((ret.csll || 0) - csllCompensavel);

      var totalCompensado = _r(irrfCompensavel + pisCompensavel + cofinsCompensavel + csllCompensavel);
      var totalSaldoCredor = _r(saldoIRRF + saldoPIS + saldoCOFINS + saldoCSLL);

      return {
        descricao: 'Compensação de retenções sofridas com tributos devidos',
        baseLegal: 'Art. 717 (IRRF); Lei 10.833/2003, art. 36 (CSRF)',
        retencoesSofridas: {
          irrf: ret.irrf || 0, pis: ret.pis || 0,
          cofins: ret.cofins || 0, csll: ret.csll || 0,
          total: _r((ret.irrf || 0) + (ret.pis || 0) + (ret.cofins || 0) + (ret.csll || 0))
        },
        tributosDevidos: {
          irpj: trib.irpj || 0, csll: trib.csll || 0,
          pis: trib.pis || 0, cofins: trib.cofins || 0,
          total: _r((trib.irpj || 0) + (trib.csll || 0) + (trib.pis || 0) + (trib.cofins || 0))
        },
        compensacao: {
          irrf_com_irpj: _r(irrfCompensavel),
          pis_com_pis: _r(pisCompensavel),
          cofins_com_cofins: _r(cofinsCompensavel),
          csll_com_csll: _r(csllCompensavel),
          totalCompensado: totalCompensado
        },
        tributosARecolher: {
          irpj: _r((trib.irpj || 0) - irrfCompensavel),
          csll: _r((trib.csll || 0) - csllCompensavel),
          pis: _r((trib.pis || 0) - pisCompensavel),
          cofins: _r((trib.cofins || 0) - cofinsCompensavel),
          total: _r(
            (trib.irpj || 0) - irrfCompensavel +
            (trib.csll || 0) - csllCompensavel +
            (trib.pis || 0) - pisCompensavel +
            (trib.cofins || 0) - cofinsCompensavel
          ),
          saldoCredorPorTributo: {
            irpj: (trib.irpj || 0) - irrfCompensavel < 0 ? { valor: _r(Math.abs((trib.irpj || 0) - irrfCompensavel)), destinacao: 'PER/DCOMP ou restituição' } : null,
            csll: (trib.csll || 0) - csllCompensavel < 0 ? { valor: _r(Math.abs((trib.csll || 0) - csllCompensavel)), destinacao: 'PER/DCOMP ou restituição' } : null,
            pis: (trib.pis || 0) - pisCompensavel < 0 ? { valor: _r(Math.abs((trib.pis || 0) - pisCompensavel)), destinacao: 'PER/DCOMP ou restituição' } : null,
            cofins: (trib.cofins || 0) - cofinsCompensavel < 0 ? { valor: _r(Math.abs((trib.cofins || 0) - cofinsCompensavel)), destinacao: 'PER/DCOMP ou restituição' } : null
          }
        },
        saldoCredor: {
          irrf: saldoIRRF, pis: saldoPIS,
          cofins: saldoCOFINS, csll: saldoCSLL,
          total: totalSaldoCredor,
          destinacao: totalSaldoCredor > 0
            ? 'Saldo credor pode ser compensado em períodos seguintes via PER/DCOMP ou pedido de restituição'
            : 'Sem saldo credor'
        }
      };
    },

    /**
     * ═══════════════════════════════════════════════════════════════════════
     * Saldo Negativo de IRPJ
     * ═══════════════════════════════════════════════════════════════════════
     *
     * DELEGAÇÃO: MotorLR.calcularSaldoNegativo() + fallback
     * Base Legal: Art. 235
     */
    saldoNegativo: function (irpjDevido, retencoesFonte, estimativasPagas, taxaSelic) {
      // CORREÇÃO v3.1: Aceitar TANTO objeto QUANTO parâmetros posicionais
      // estudos.js chama com { irpjDevido, retencoesFonte, estimativasPagas }
      if (typeof irpjDevido === 'object' && irpjDevido !== null) {
        var _obj = irpjDevido;
        irpjDevido = _obj.irpjDevido || 0;
        retencoesFonte = _obj.retencoesFonte || 0;
        estimativasPagas = _obj.estimativasPagas || 0;
        taxaSelic = _obj.taxaSelic || 0;
      }

      // DELEGAÇÃO AO MOTOR (v2.3) — MotorLR.calcularSaldoNegativo()
      if (typeof MotorLR !== 'undefined' && MotorLR.calcularSaldoNegativo) {
        return MotorLR.calcularSaldoNegativo(irpjDevido, retencoesFonte, estimativasPagas, taxaSelic || 0);
      }

      // FALLBACK: implementação original caso o motor não esteja carregado
      taxaSelic = taxaSelic || 0;
      var totalPago = (retencoesFonte || 0) + (estimativasPagas || 0);
      var saldo = totalPago - irpjDevido;

      if (saldo <= 0) {
        return { temSaldoNegativo: false, irpjAPagar: _r(Math.abs(saldo)) };
      }

      return {
        temSaldoNegativo: true,
        saldoNegativo: _r(saldo),
        valorOriginal: _r(saldo),
        atualizacaoSelic: _r(saldo * taxaSelic),
        valorAtualizado: _r(saldo * (1 + taxaSelic)),
        compensacao: 'Via PER/DCOMP (compensação com outros tributos federais)',
        restituicao: 'Possível via PER/DCOMP (mais demorado)',
        prazoDecadencial: '5 anos',
        alerta: 'Verificar retenções não compensadas — dinheiro potencialmente "esquecido"',
        artigo: 'Art. 235'
      };
    },

    /**
     * ═══════════════════════════════════════════════════════════════════════
     * Depreciação Completa — Portado do motor v4.6
     * ═══════════════════════════════════════════════════════════════════════
     *
     * Calcula depreciação com suporte a: bens usados (Art. 322),
     * aceleração por turnos (Art. 323), incentivada (Art. 324-329),
     * proporcional ao período de uso.
     *
     * Base Legal: Art. 311-330
     */
    depreciacaoCompleta: function (bem) {
      // DELEGAÇÃO AO MOTOR (v3.0) — MotorLR.calcularDepreciacaoCompleta()
      // CORREÇÃO FALHA #1: Motor retorna depreciacaoNormal (contábil/linear para DRE)
      // separada de depreciacaoIncentivada (diferença fiscal para exclusão no LALUR)
      if (typeof MotorLR !== 'undefined' && MotorLR.calcularDepreciacaoCompleta) {
        var resultado = MotorLR.calcularDepreciacaoCompleta(bem);

        // Motor retorna erro como { erro: string }
        if (resultado.erro) return resultado;

        // Motor retorna casos especiais (não-produção, pequeno valor) diretamente
        if (resultado.dedutivel === false || resultado.depreciacaoPeriodo !== undefined) {
          return resultado;
        }

        // Garantir que depreciacaoNormal e depreciacaoIncentivada estejam presentes
        // (o motor já os retorna separados — Falha #1 corrigida)
        return resultado;
      }

      // FALLBACK: implementação original caso o motor não esteja carregado
      var d = Object.assign({
        tipo: null, custoAquisicao: 0, depreciacaoAcumulada: 0,
        usado: false, vidaUtilRestante: null, turnos: 1,
        incentivo: null, mesesUso: 12, relacionadoProducao: true
      }, bem);

      if (!d.tipo || d.custoAquisicao <= 0) {
        return { erro: 'Tipo do bem e custo de aquisição positivo são obrigatórios' };
      }

      if (!d.relacionadoProducao) {
        return {
          tipo: d.tipo, custoAquisicao: d.custoAquisicao,
          depreciacaoPeriodo: 0, dedutivel: false,
          artigo: 'Art. 317 §5º',
          motivo: 'Bem não relacionado com produção/comercialização — depreciação indedutível'
        };
      }

      // Art. 313 §1º: Bem de pequeno valor
      if (d.custoAquisicao <= LR.limites.ativoDespesaDireta) {
        return {
          tipo: d.tipo, custoAquisicao: d.custoAquisicao,
          depreciacaoPeriodo: d.custoAquisicao, dedutivel: true,
          artigo: 'Art. 313 §1º I',
          motivo: 'Valor ≤ R$ ' + LR.limites.ativoDespesaDireta + ' — dedução integral como despesa'
        };
      }

      // Tabela de taxas fiscais (mapeamento tipo → dados)
      var TAXAS = {
        edificios:          { taxa: 0.04, vidaUtil: 25 },
        instalacoes:        { taxa: 0.10, vidaUtil: 10 },
        maquinas:           { taxa: 0.10, vidaUtil: 10 },
        moveis:             { taxa: 0.10, vidaUtil: 10 },
        veiculosPassageiro: { taxa: 0.20, vidaUtil: 5 },
        veiculosCarga:      { taxa: 0.20, vidaUtil: 5 },
        computadores:       { taxa: 0.20, vidaUtil: 5 },
        software:           { taxa: 0.20, vidaUtil: 5 },
        ferramentas:        { taxa: 0.20, vidaUtil: 5 },
        tratores:           { taxa: 0.25, vidaUtil: 4 },
        drones:             { taxa: 0.20, vidaUtil: 5 },
        gps_topografia:     { taxa: 0.20, vidaUtil: 5 }
      };

      var ACELERADA = {
        atividadeRural:    { taxa: 1.0, multiplicador: null },
        pesquisaInovacao:  { taxa: 1.0, multiplicador: null },
        sudamSudene:       { taxa: 1.0, multiplicador: null },
        veiculosCarga3x:   { taxa: null, multiplicador: 3 }
      };

      var TURNOS = { 1: 1.0, 2: 1.5, 3: 2.0 };

      var infoBem = TAXAS[d.tipo];
      if (!infoBem) {
        return { erro: 'Tipo de bem "' + d.tipo + '" não encontrado na tabela de depreciação' };
      }

      var taxaAnual = infoBem.taxa;
      var vidaUtilEfetiva = infoBem.vidaUtil;

      // Art. 322: Bens usados
      if (d.usado) {
        var metadeVidaNovo = infoBem.vidaUtil / 2;
        var restante = d.vidaUtilRestante || metadeVidaNovo;
        vidaUtilEfetiva = Math.max(metadeVidaNovo, restante);
        taxaAnual = 1 / vidaUtilEfetiva;
      }

      // Art. 323: Aceleração por turnos
      var multiplicadorTurnos = 1;
      if (d.tipo !== 'edificios' && d.turnos >= 2) {
        multiplicadorTurnos = TURNOS[d.turnos] || 1;
      }

      var taxaEfetiva = taxaAnual * multiplicadorTurnos;
      var depreciacaoAnualBruta = d.custoAquisicao * taxaEfetiva;

      var fatorProporcional = d.mesesUso / 12;
      var depreciacaoPeriodo = depreciacaoAnualBruta * fatorProporcional;

      // Art. 317 §3º: Limite
      var saldoDepreciavel = Math.max(0, d.custoAquisicao - d.depreciacaoAcumulada);
      depreciacaoPeriodo = Math.min(depreciacaoPeriodo, saldoDepreciavel);

      // Depreciação incentivada (Art. 324-329)
      var depreciacaoIncentivada = 0;
      var exclusaoLalur = 0;
      var adicaoFuturaLalur = false;

      if (d.incentivo && ACELERADA[d.incentivo]) {
        var inc = ACELERADA[d.incentivo];
        if (inc.taxa === 1.0) {
          depreciacaoIncentivada = Math.max(0, saldoDepreciavel - depreciacaoPeriodo);
          exclusaoLalur = depreciacaoIncentivada;
        } else if (inc.multiplicador) {
          var depAcelerada = d.custoAquisicao * taxaAnual * inc.multiplicador * fatorProporcional;
          depreciacaoIncentivada = Math.max(0, Math.min(depAcelerada - depreciacaoPeriodo, saldoDepreciavel - depreciacaoPeriodo));
          exclusaoLalur = depreciacaoIncentivada;
        }
        adicaoFuturaLalur = true;
      }

      var depreciacaoTotalPeriodo = depreciacaoPeriodo + depreciacaoIncentivada;
      var novaDepreciacaoAcumulada = d.depreciacaoAcumulada + depreciacaoTotalPeriodo;
      var limiteAtingido = novaDepreciacaoAcumulada >= d.custoAquisicao;

      return {
        tipo: d.tipo,
        custoAquisicao: d.custoAquisicao,
        depreciacaoAcumuladaAnterior: d.depreciacaoAcumulada,
        saldoDepreciavelAnterior: saldoDepreciavel,
        taxaNormal: infoBem.taxa,
        taxaEfetiva: taxaEfetiva,
        multiplicadorTurnos: multiplicadorTurnos,
        mesesUso: d.mesesUso,
        depreciacaoNormal: _r(depreciacaoPeriodo),
        depreciacaoIncentivada: _r(depreciacaoIncentivada),
        exclusaoLalur: _r(exclusaoLalur),
        depreciacaoTotalPeriodo: _r(depreciacaoTotalPeriodo),
        novaDepreciacaoAcumulada: _r(novaDepreciacaoAcumulada),
        saldoDepreciavelRestante: _r(Math.max(0, d.custoAquisicao - novaDepreciacaoAcumulada)),
        limiteAtingido: limiteAtingido,
        adicaoFuturaLalur: adicaoFuturaLalur,
        dedutivel: true,
        vidaUtilEfetiva: vidaUtilEfetiva,
        bemUsado: d.usado,
        incentivo: d.incentivo || null,
        economia: {
          irpj: _r(depreciacaoTotalPeriodo * 0.25),
          csll: _r(depreciacaoTotalPeriodo * 0.09),
          total: _r(depreciacaoTotalPeriodo * 0.34)
        },
        alertas: limiteAtingido
          ? ['Limite de depreciação atingido. A partir do próximo período, depreciação contábil deverá ser ADICIONADA ao lucro real (Art. 324 §3º / Art. 321 §único)']
          : []
      };
    },

    /**
     * ═══════════════════════════════════════════════════════════════════════
     * Incentivos Fiscais — Portado do motor v4.6
     * ═══════════════════════════════════════════════════════════════════════
     *
     * Calcula deduções do IRPJ por incentivos fiscais.
     * Base Legal: Art. 226 + Art. 228 + Art. 625-646
     */
    incentivos: function (irpjNormal, despesas) {
      // DELEGAÇÃO AO MOTOR (v3.0) — MotorLR.calcularIncentivos()
      if (typeof MotorLR !== 'undefined' && MotorLR.calcularIncentivos) {
        // Motor usa mesma assinatura: (irpjNormal, despesas)
        // Motor pode usar IDs diferentes (IDOSO vs FUNDO_IDOSO, PRONAS vs PRONAS_PCD)
        // Mapear IDs do mapeamento → motor se necessário
        var despesasMotor = Object.assign({}, despesas || {});
        if (despesasMotor.FUNDO_IDOSO && !despesasMotor.IDOSO) {
          despesasMotor.IDOSO = despesasMotor.FUNDO_IDOSO;
        }
        if (despesasMotor.PRONAS_PCD && !despesasMotor.PRONAS) {
          despesasMotor.PRONAS = despesasMotor.PRONAS_PCD;
        }

        return MotorLR.calcularIncentivos(irpjNormal, despesasMotor);
      }

      // FALLBACK: implementação original caso o motor não esteja carregado
      despesas = despesas || {};

      var INCENTIVOS = [
        { id: 'PAT', descricao: 'Programa de Alimentação do Trabalhador', limitePercentualIRPJ: 0.04 },
        { id: 'FIA', descricao: 'Fundo da Criança e do Adolescente', limitePercentualIRPJ: 0.01 },
        { id: 'FUNDO_IDOSO', descricao: 'Fundo do Idoso', limitePercentualIRPJ: 0.01 },
        { id: 'ROUANET', descricao: 'Lei Rouanet — Atividades Culturais', limitePercentualIRPJ: 0.04 },
        { id: 'VALE_CULTURA', descricao: 'Vale-Cultura', limitePercentualIRPJ: 0.01 },
        { id: 'AUDIOVISUAL', descricao: 'Atividades Audiovisuais (FUNCINES)', limitePercentualIRPJ: 0.03 },
        { id: 'ESPORTE', descricao: 'Lei do Esporte', limitePercentualIRPJ: 0.01 },
        { id: 'LICENCA_MATERNIDADE', descricao: 'Prorrogação Licença-Maternidade', limitePercentualIRPJ: null },
        { id: 'PRONON', descricao: 'PRONON — Apoio à Oncologia', limitePercentualIRPJ: 0.01 },
        { id: 'PRONAS_PCD', descricao: 'PRONAS/PCD — Pessoa com Deficiência', limitePercentualIRPJ: 0.01 }
      ];

      var resultado = [];
      var totalDeducao = 0;

      for (var i = 0; i < INCENTIVOS.length; i++) {
        var inc = INCENTIVOS[i];
        var despesaIncentivo = despesas[inc.id] || 0;
        if (despesaIncentivo <= 0) continue;

        var deducaoCalculada = 0;
        if (inc.id === 'PAT') {
          deducaoCalculada = despesaIncentivo * 0.15;
        } else if (inc.id === 'LICENCA_MATERNIDADE') {
          deducaoCalculada = despesaIncentivo;
        } else {
          deducaoCalculada = despesaIncentivo;
        }

        var limiteIndividual = inc.limitePercentualIRPJ
          ? irpjNormal * inc.limitePercentualIRPJ
          : deducaoCalculada;

        var deducaoFinal = Math.min(deducaoCalculada, limiteIndividual);

        resultado.push({
          incentivo: inc.id,
          descricao: inc.descricao,
          despesa: despesaIncentivo,
          deducaoCalculada: _r(deducaoCalculada),
          limiteIndividual: _r(limiteIndividual),
          deducaoFinal: _r(deducaoFinal)
        });

        totalDeducao += deducaoFinal;
      }

      // Art. 625, RIR/2018: limite global de 4% do IRPJ normal para incentivos sujeitos
      var IDS_SUJEITOS_TETO = ['PAT','FIA','FUNDO_IDOSO','ROUANET','AUDIOVISUAL','ESPORTE'];
      var limiteGlobal4 = irpjNormal * 0.04;
      var totalSujeito = 0;
      for (var j = 0; j < resultado.length; j++) {
        if (IDS_SUJEITOS_TETO.indexOf(resultado[j].incentivo) >= 0) totalSujeito += resultado[j].deducaoFinal;
      }
      if (totalSujeito > limiteGlobal4 && limiteGlobal4 > 0) {
        var fatorCorte = limiteGlobal4 / totalSujeito;
        totalDeducao = 0;
        for (var k = 0; k < resultado.length; k++) {
          if (IDS_SUJEITOS_TETO.indexOf(resultado[k].incentivo) >= 0) {
            resultado[k].deducaoFinal = _r(resultado[k].deducaoFinal * fatorCorte);
          }
          totalDeducao += resultado[k].deducaoFinal;
        }
      }

      var totalFinal = Math.min(totalDeducao, irpjNormal);

      return {
        incentivos: resultado,
        totalDeducaoCalculada: _r(totalDeducao),
        totalDeducaoFinal: _r(totalFinal),
        limiteGlobal4Pct: _r(limiteGlobal4),
        tetoGlobalAplicado: totalSujeito > limiteGlobal4,
        irpjNormal: irpjNormal,
        percentualUtilizado: irpjNormal > 0
          ? _r(totalFinal / irpjNormal * 100) + '%'
          : '0%',
        artigos: 'Art. 226, 228, 625-646'
      };
    },

    /**
     * ═══════════════════════════════════════════════════════════════════════
     * Suspensão/Redução de Estimativa — Portado do motor v4.6
     * ═══════════════════════════════════════════════════════════════════════
     *
     * Base Legal: Art. 227-230
     */
    suspensaoReducao: function (dados) {
      // DELEGAÇÃO AO MOTOR (v3.0) — MotorLR.calcularSuspensaoReducao()
      // Interface idêntica: mesmos parâmetros e mesma estrutura de retorno
      if (typeof MotorLR !== 'undefined' && MotorLR.calcularSuspensaoReducao) {
        return MotorLR.calcularSuspensaoReducao(dados);
      }

      // FALLBACK: implementação original caso o motor não esteja carregado
      var d = Object.assign({
        estimativaDevidaMes: 0, irpjRealAcumulado: 0,
        irpjPagoAcumulado: 0, csllRealAcumulada: 0,
        csllPagaAcumulada: 0, estimativaCSLLMes: 0
      }, dados);

      var irpjMes, situacaoIRPJ;
      if (d.irpjRealAcumulado <= d.irpjPagoAcumulado) {
        irpjMes = 0; situacaoIRPJ = 'SUSPENSAO';
      } else if (d.irpjRealAcumulado < d.irpjPagoAcumulado + d.estimativaDevidaMes) {
        irpjMes = d.irpjRealAcumulado - d.irpjPagoAcumulado; situacaoIRPJ = 'REDUCAO';
      } else {
        irpjMes = d.estimativaDevidaMes; situacaoIRPJ = 'INTEGRAL';
      }

      var csllMes, situacaoCSLL;
      if (d.csllRealAcumulada <= d.csllPagaAcumulada) {
        csllMes = 0; situacaoCSLL = 'SUSPENSAO';
      } else if (d.csllRealAcumulada < d.csllPagaAcumulada + d.estimativaCSLLMes) {
        csllMes = d.csllRealAcumulada - d.csllPagaAcumulada; situacaoCSLL = 'REDUCAO';
      } else {
        csllMes = d.estimativaCSLLMes; situacaoCSLL = 'INTEGRAL';
      }

      return {
        irpj: {
          estimativaDevida: d.estimativaDevidaMes,
          irpjRealAcumulado: d.irpjRealAcumulado,
          irpjPagoAcumulado: d.irpjPagoAcumulado,
          valorAPagar: _r(Math.max(irpjMes, 0)),
          situacao: situacaoIRPJ
        },
        csll: {
          estimativaDevida: d.estimativaCSLLMes,
          csllRealAcumulada: d.csllRealAcumulada,
          csllPagaAcumulada: d.csllPagaAcumulada,
          valorAPagar: _r(Math.max(csllMes, 0)),
          situacao: situacaoCSLL
        },
        economiaMes: _r(d.estimativaDevidaMes - Math.max(irpjMes, 0) + d.estimativaCSLLMes - Math.max(csllMes, 0)),
        requisitos: [
          'Balanço/balancete mensal levantado e transcrito no Diário (Art. 227, §1º, I)',
          'Observar leis comerciais e fiscais (Art. 227, §1º, I)',
          'Efeitos apenas para o período em curso (Art. 227, §1º, II)'
        ],
        artigos: 'Art. 227 a 230'
      };
    },

    /**
     * ═══════════════════════════════════════════════════════════════════════
     * Acréscimos Moratórios — Portado do motor v4.6
     * ═══════════════════════════════════════════════════════════════════════
     *
     * Base Legal: Lei 9.430/96, Art. 61
     */
    acrescimosMoratorios: function (dados) {
      // DELEGAÇÃO AO MOTOR (v3.0) — MotorLR.calcularAcrescimosMoratorios()
      if (typeof MotorLR !== 'undefined' && MotorLR.calcularAcrescimosMoratorios) {
        var resultado = MotorLR.calcularAcrescimosMoratorios(dados);

        // Mapear retorno motor → interface esperada pelo mapeamento
        // Motor retorna detalhamento.multa e detalhamento.juros como sub-objetos
        // Mapeamento espera detalhamento flat com diasAtraso, percentualMulta etc.
        return {
          baseLegal: resultado.baseLegal,
          valorOriginal: _r(resultado.valorOriginal),
          multaMora: _r(resultado.multaMora),
          jurosMora: _r(resultado.jurosMora),
          totalAcrescimos: _r(resultado.totalAcrescimos),
          totalAPagar: _r(resultado.totalAPagar),
          detalhamento: resultado.detalhamento && resultado.detalhamento.multa ? {
            diasAtraso: resultado.detalhamento.multa.diasAtraso || (dados && dados.diasAtraso) || 0,
            percentualMulta: resultado.detalhamento.multa.percentualAplicavel
              ? _r(resultado.detalhamento.multa.percentualAplicavel * 100) + '%'
              : '0%',
            atingiuTetoMulta: resultado.detalhamento.multa.atingiuTeto || false,
            selicAcumulada: resultado.detalhamento.juros ? resultado.detalhamento.juros.selicAcumulada || 0 : 0,
            jurosMesPagamento: resultado.detalhamento.juros ? resultado.detalhamento.juros.jurosMesPagamento || 0.01 : 0.01,
            taxaTotalJuros: resultado.detalhamento.juros ? resultado.detalhamento.juros.taxaTotalJuros || 0 : 0
          } : resultado.detalhamento
        };
      }

      // FALLBACK: implementação original caso o motor não esteja carregado
      var d = Object.assign({
        valorTributo: 0, diasAtraso: 0, taxasSelicMes: []
      }, dados);

      // CORREÇÃO v3.1: Aceitar campos alternativos vindos de estudos.js
      if (!d.valorTributo && d.valorPrincipal) d.valorTributo = d.valorPrincipal;
      // Calcular diasAtraso a partir de datas se fornecidas
      if (!d.diasAtraso && d.dataVencimento && d.dataPagamento) {
        try {
          var dv = new Date(d.dataVencimento);
          var dp = new Date(d.dataPagamento);
          if (!isNaN(dv.getTime()) && !isNaN(dp.getTime())) {
            d.diasAtraso = Math.max(0, Math.round((dp - dv) / 86400000));
          }
        } catch(_e) {}
      }

      // Multa de mora: 0,33% por dia, teto 20%
      var percentualBruto = d.diasAtraso * 0.0033;
      var percentualAplicavel = Math.min(percentualBruto, 0.20);
      var multaMora = _r(d.valorTributo * percentualAplicavel);

      // Juros SELIC
      var selicAcumulada = d.taxasSelicMes.reduce(function (acc, t) { return acc + t; }, 0);
      var jurosMesPagamento = 0.01;
      var taxaTotalJuros = selicAcumulada + jurosMesPagamento;
      var jurosMora = _r(d.valorTributo * taxaTotalJuros);

      var totalAcrescimos = _r(multaMora + jurosMora);

      return {
        baseLegal: 'Lei 9.430/1996, art. 61',
        valorOriginal: _r(d.valorTributo),
        multaMora: multaMora,
        jurosMora: jurosMora,
        totalAcrescimos: totalAcrescimos,
        totalAPagar: _r(d.valorTributo + totalAcrescimos),
        detalhamento: {
          diasAtraso: d.diasAtraso,
          percentualMulta: _r(percentualAplicavel * 100) + '%',
          atingiuTetoMulta: d.diasAtraso >= 61,
          selicAcumulada: selicAcumulada,
          jurosMesPagamento: jurosMesPagamento,
          taxaTotalJuros: taxaTotalJuros
        }
      };
    },

    /**
     * ═══════════════════════════════════════════════════════════════════════
     * Multa de Ofício — Portado do motor v4.6
     * ═══════════════════════════════════════════════════════════════════════
     *
     * Base Legal: Lei 9.430/96, Art. 44 (redação Lei 14.689/2023)
     */
    multaOficio: function (dados) {
      // DELEGAÇÃO AO MOTOR (v3.0) — MotorLR.calcularMultaOficio()
      if (typeof MotorLR !== 'undefined' && MotorLR.calcularMultaOficio) {
        var resultado = MotorLR.calcularMultaOficio(dados);

        // Mapear retorno motor → interface esperada pelo mapeamento
        // Motor retorna percentuais como sub-objeto { base, agravamento, final }
        return {
          baseLegal: resultado.baseLegal,
          valorDiferenca: _r(resultado.valorDiferenca),
          tipoInfracao: resultado.tipoInfracao,
          percentualBase: resultado.percentuais ? resultado.percentuais.base : 0,
          percentualFinal: resultado.percentuais ? resultado.percentuais.final : 0,
          multaBruta: _r(resultado.multaBruta),
          reducao: resultado.reducao ? {
            percentual: resultado.reducao.percentual,
            valor: _r(resultado.reducao.valor)
          } : { percentual: 0, valor: 0 },
          multaLiquida: _r(resultado.multaLiquida),
          totalDevido: _r(resultado.totalDevido)
        };
      }

      // FALLBACK: implementação original caso o motor não esteja carregado
      var d = Object.assign({
        valorDiferenca: 0, tipoInfracao: 'normal',
        estimativaIsolada: false, naoAtendeuIntimacao: false,
        pagamento30Dias: false, pagamentoAntesRecurso: false
      }, dados);

      // CORREÇÃO v3.1: Aceitar campos alternativos vindos de estudos.js
      if (!d.valorDiferenca && d.valorTributo) d.valorDiferenca = d.valorTributo;
      if (d.tipo && !dados.tipoInfracao) {
        d.tipoInfracao = d.tipo === 'PADRAO' ? 'normal' : (d.tipo || 'normal').toLowerCase();
      }
      if (d.pagouEm30Dias === true && !dados.pagamento30Dias) d.pagamento30Dias = true;

      if (d.valorDiferenca <= 0) {
        return { baseLegal: 'Lei 9.430/1996, art. 44', valorDiferenca: 0, multaOficio: 0 };
      }

      var percentualBase;
      if (d.estimativaIsolada) {
        percentualBase = 0.50;
      } else if (d.tipoInfracao === 'qualificada') {
        percentualBase = 1.00;
      } else if (d.tipoInfracao === 'reincidente') {
        percentualBase = 1.50;
      } else {
        percentualBase = 0.75;
      }

      var percentualFinal = percentualBase;
      if (d.naoAtendeuIntimacao) {
        percentualFinal = percentualBase * 1.50;
      }

      var reducao = 0;
      if (d.pagamento30Dias) { reducao = 0.50; }
      else if (d.pagamentoAntesRecurso) { reducao = 0.30; }

      var multaBruta = _r(d.valorDiferenca * percentualFinal);
      var valorReducao = _r(multaBruta * reducao);
      var multaLiquida = _r(multaBruta - valorReducao);

      return {
        baseLegal: 'Lei 9.430/1996, art. 44 (redação Lei 14.689/2023)',
        valorDiferenca: _r(d.valorDiferenca),
        tipoInfracao: d.tipoInfracao,
        percentualBase: percentualBase,
        percentualFinal: percentualFinal,
        multaBruta: multaBruta,
        reducao: { percentual: reducao, valor: valorReducao },
        multaLiquida: multaLiquida,
        totalDevido: _r(d.valorDiferenca + multaLiquida)
      };
    },

    /**
     * ═══════════════════════════════════════════════════════════════════════
     * Recomendar Regime (Trimestral vs Anual) — Portado do motor v4.6
     * ═══════════════════════════════════════════════════════════════════════
     *
     * Base Legal: Art. 217-219, Art. 227-229
     */
    recomendarRegime: function (dados) {
      // DELEGAÇÃO AO MOTOR (v3.0) — MotorLR.recomendarRegime()
      // Interface idêntica: { lucrosMensais, prejuizoAcumulado, temInvestimento }
      if (typeof MotorLR !== 'undefined' && MotorLR.recomendarRegime) {
        var resultado = MotorLR.recomendarRegime(dados);

        // Motor retorna mesma estrutura base + campos extras (anual.lucroRealFinal etc.)
        // Garantir compatibilidade com interface do mapeamento
        return {
          recomendacao: resultado.recomendacao,
          motivos: resultado.motivos,
          simulacao: {
            trimestral: {
              irpjTotal: _r(resultado.simulacao.trimestral.irpjTotal),
              detalhamentoTrimestres: resultado.simulacao.trimestral.detalhamentoTrimestres,
              saldoPrejuizoRemanescente: _r(resultado.simulacao.trimestral.saldoPrejuizoRemanescente)
            },
            anual: {
              irpjTotal: _r(resultado.simulacao.anual.irpjTotal),
              saldoPrejuizoRemanescente: _r(resultado.simulacao.anual.saldoPrejuizoRemanescente)
            },
            economia: _r(resultado.simulacao.economia),
            regimeMaisBarato: resultado.simulacao.regimeMaisBarato
          },
          alerta: resultado.alerta,
          artigos: resultado.artigos
        };
      }

      // FALLBACK: implementação original caso o motor não esteja carregado
      var d = Object.assign({
        lucrosMensais: [], prejuizoAcumulado: 0, temInvestimento: false
      }, dados);

      // CORREÇÃO v3.1: Aceitar campos alternativos vindos de estudos.js
      // estudos.js passa: { lucroAjustado, prejuizoFiscal, mesesReceita, ... }
      if ((!d.lucrosMensais || d.lucrosMensais.length === 0) && d.mesesReceita && d.mesesReceita.length > 0) {
        d.lucrosMensais = d.mesesReceita;
      }
      if (d.prejuizoFiscal !== undefined && !d.prejuizoAcumulado) {
        d.prejuizoAcumulado = d.prejuizoFiscal || 0;
      }
      // Se lucrosMensais ainda vazio, distribuir lucroAjustado uniformemente
      if ((!d.lucrosMensais || d.lucrosMensais.length === 0) && d.lucroAjustado) {
        d.lucrosMensais = [];
        for (var _mi = 0; _mi < 12; _mi++) d.lucrosMensais.push(d.lucroAjustado / 12);
      }
      // Garantir 12 meses
      if (!d.lucrosMensais || d.lucrosMensais.length === 0) {
        d.lucrosMensais = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      }

      var lucroTotal = d.lucrosMensais.reduce(function (a, b) { return a + b; }, 0);
      var temPrejuizoEmAlgunsMeses = d.lucrosMensais.some(function (l) { return l < 0; });
      var lucroConcentradoNoFinal = d.lucrosMensais.slice(9, 12).reduce(function (a, b) { return a + b; }, 0) > lucroTotal * 0.5;

      // Simulação Trimestral
      var trimestres = [
        d.lucrosMensais.slice(0, 3).reduce(function (a, b) { return a + b; }, 0),
        d.lucrosMensais.slice(3, 6).reduce(function (a, b) { return a + b; }, 0),
        d.lucrosMensais.slice(6, 9).reduce(function (a, b) { return a + b; }, 0),
        d.lucrosMensais.slice(9, 12).reduce(function (a, b) { return a + b; }, 0)
      ];

      var irpjTrimestral = 0;
      var saldoPrejTri = d.prejuizoAcumulado;
      for (var i = 0; i < trimestres.length; i++) {
        var lucroTri = trimestres[i];
        if (lucroTri <= 0) {
          saldoPrejTri += Math.abs(lucroTri);
          continue;
        }
        var lim30 = lucroTri * 0.30;
        var comp = Math.min(lim30, saldoPrejTri);
        saldoPrejTri -= comp;
        var lrFinal = lucroTri - comp;
        if (lrFinal > 0) {
          irpjTrimestral += lrFinal * 0.15;
          irpjTrimestral += Math.max(lrFinal - 60000, 0) * 0.10;
        }
      }

      // Simulação Anual
      var irpjAnual = 0;
      var saldoPrejAnual = d.prejuizoAcumulado;
      if (lucroTotal > 0) {
        var lim30a = lucroTotal * 0.30;
        var compA = Math.min(lim30a, saldoPrejAnual);
        saldoPrejAnual -= compA;
        var lrAnual = lucroTotal - compA;
        if (lrAnual > 0) {
          irpjAnual = lrAnual * 0.15;
          irpjAnual += Math.max(lrAnual - 240000, 0) * 0.10;
        }
      }

      var recomendacao, motivos = [];
      if (lucroConcentradoNoFinal || temPrejuizoEmAlgunsMeses) {
        recomendacao = 'ANUAL';
        motivos.push('Lucro concentrado no final ou meses com prejuízo → suspensão/redução economiza');
      } else {
        recomendacao = irpjAnual <= irpjTrimestral ? 'ANUAL' : 'TRIMESTRAL';
        motivos.push('Simulação: IRPJ Trimestral = R$ ' + _r(irpjTrimestral).toFixed(2) + ' vs Anual = R$ ' + _r(irpjAnual).toFixed(2));
      }

      if (temPrejuizoEmAlgunsMeses) {
        motivos.push('ANUAL permite suspensão de estimativas com balanço mensal (Art. 227)');
      }
      if (d.prejuizoAcumulado > 0) {
        motivos.push('Prejuízo acumulado: no trimestral, trava de 30% aplica por trimestre (4 vezes); no anual, aplica uma vez');
      }

      return {
        recomendacao: recomendacao,
        motivos: motivos,
        simulacao: {
          trimestral: { irpjTotal: _r(irpjTrimestral), detalhamentoTrimestres: trimestres, saldoPrejuizoRemanescente: _r(saldoPrejTri) },
          anual: { irpjTotal: _r(irpjAnual), saldoPrejuizoRemanescente: _r(saldoPrejAnual) },
          economia: _r(Math.abs(irpjTrimestral - irpjAnual)),
          regimeMaisBarato: irpjAnual <= irpjTrimestral ? 'ANUAL' : 'TRIMESTRAL'
        },
        alerta: 'Art. 229: A opção é IRRETRATÁVEL para todo o ano-calendário',
        artigos: 'Art. 217-219, Art. 227-229'
      };
    },

    /**
     * Simulação completa — tudo junto
     * v3.3: Integra PIS/COFINS, cenários proporcionais, TJLP obrigatória, carga bruta/líquida
     */
    simulacaoCompleta: function (empresa) {
      // DELEGAÇÃO AO MOTOR (v3.3) — MotorLR.simularLucroRealCompleto()
      if (typeof MotorLR !== 'undefined' && MotorLR.simularLucroRealCompleto) {
        var e = Object.assign({
          lucroLiquido: 0, receitaBruta: 0, adicoes: 0, exclusoes: 0,
          prejuizoFiscal: 0, baseNegativaCSLL: 0,
          patrimonioLiquido: 0, tjlp: null, lucrosAcumulados: 0,  // v3.3 FIX #3: TJLP sem default
          retencoesFonte: 0, estimativasPagas: 0, numMeses: 12,
          dadosPISCOFINS: null,                                    // v3.3 FIX #6: PIS/COFINS integrado
          retencoesPISCOFINS: 0,                                   // v3.3 FIX #6: Retenções PIS/COFINS
          variacaoCenarios: { pessimista: -0.05, otimista: 0.05 }  // v3.3 FIX #7: Variação cenários
        }, empresa);

        // Mapear parâmetros mapeamento → motor
        var resultado = MotorLR.simularLucroRealCompleto({
          lucroLiquidoContabil: e.lucroLiquido,
          receitaBruta: e.receitaBruta,
          totalAdicoes: e.adicoes,
          totalExclusoes: e.exclusoes,
          saldoPrejuizoFiscal: e.prejuizoFiscal,
          saldoBaseNegativaCSLL: e.baseNegativaCSLL,
          patrimonioLiquido: e.patrimonioLiquido,
          tjlp: e.tjlp,                              // v3.3 FIX #3: Sem default — motor valida
          lucrosAcumulados: e.lucrosAcumulados,
          despesasIncentivos: e.despesasIncentivos || {},
          retencoesFonte: e.retencoesFonte,
          estimativasPagas: e.estimativasPagas,
          numMeses: e.numMeses,
          ehInstituicaoFinanceira: e.financeira || false,
          dadosPISCOFINS: e.dadosPISCOFINS,           // v3.3 FIX #6: PIS/COFINS integrado
          retencoesPISCOFINS: e.retencoesPISCOFINS,   // v3.3 FIX #6: Retenções
          variacaoCenarios: e.variacaoCenarios         // v3.3 FIX #7: Cenários proporcionais
        });

        // Mapear retorno motor → interface esperada pelo mapeamento
        return {
          semOtimizacao: {
            irpjDevido: _r(resultado.semOtimizacao.irpjDevido),
            aliquotaEfetiva: resultado.semOtimizacao.aliquotaEfetiva
          },
          comOtimizacao: {
            irpj: resultado.comOtimizacao.irpj,
            csll: resultado.comOtimizacao.csll,
            jcp: resultado.comOtimizacao.jcp,
            pisCofins: resultado.comOtimizacao.pisCofins || null  // v3.3 FIX #6
          },
          economia: {
            jcp: _r(resultado.economia.jcp),
            irpj: _r(resultado.economia.totalIRPJ || resultado.economia.compensacaoPrejuizo || 0),
            // v3.3 FIX E2#1: Incluir economia CSLL também na delegação ao motor
            csll: _r(resultado.economia.csll || resultado.economia.totalCSLL || 0),
            total: _r((resultado.economia.totalIRPJ || 0) + (resultado.economia.jcp || 0) + (resultado.economia.csll || resultado.economia.totalCSLL || 0) + (resultado.economia.pisCofins || resultado.economia.creditosPisCofins || 0))
          },
          // v3.3 FIX #6: Carga total com bruta e líquida separadas
          totalAPagar: {
            irpj: _r(resultado.totalAPagar.irpj),
            csll: _r(resultado.totalAPagar.csll),
            subtotalIRPJ_CSLL: _r(resultado.totalAPagar.subtotalIRPJ_CSLL),
            pisCofins: resultado.totalAPagar.pisCofins || null,
            // v3.3 FIX #6: Labels claros — total legado é a carga líquida
            total: _r(resultado.totalAPagar.cargaTotalLiquida || (resultado.totalAPagar.irpj + resultado.totalAPagar.csll)),
            cargaTotalBruta: _r(resultado.totalAPagar.cargaTotalBruta || 0),
            cargaTotalBrutaDescricao: resultado.totalAPagar.cargaTotalBrutaDescricao || 'IRPJ + CSLL + PIS/COFINS débitos',
            cargaTotalLiquida: _r(resultado.totalAPagar.cargaTotalLiquida || 0),
            cargaTotalLiquidaDescricao: resultado.totalAPagar.cargaTotalLiquidaDescricao || 'IRPJ + CSLL + PIS/COFINS a pagar',
            nota: resultado.totalAPagar.nota || 'A carga LÍQUIDA é o desembolso efetivo. A BRUTA inclui PIS/COFINS antes dos créditos.'
          },
          // v3.3 FIX #7: Cenários com PIS/COFINS proporcional
          cenarios: resultado.cenarios || null,
          cenarioNota: resultado.cenarioNota || 'PIS/COFINS recalculado proporcionalmente à receita em cada cenário.',
          saldoNegativo: resultado.saldoNegativo || null
        };
      }

      // FALLBACK: implementação original caso o motor não esteja carregado
      // v3.3 FIX E2#5: Indicar modo fallback
      LR._modoFallback = true;
      if (LR._fallbackUsado.indexOf('simulacaoCompleta') === -1) LR._fallbackUsado.push('simulacaoCompleta');
      var e = Object.assign({
        lucroLiquido: 0, receitaBruta: 0, adicoes: 0, exclusoes: 0,
        prejuizoFiscal: 0, baseNegativaCSLL: 0,
        patrimonioLiquido: 0, tjlp: null, lucrosAcumulados: 0,  // v3.3 FIX #3: Sem default
        retencoesFonte: 0, estimativasPagas: 0, numMeses: 12,
        dadosPISCOFINS: null, retencoesPISCOFINS: 0
      }, empresa);

      var jcp = LR.calcular.jcp(e);
      var jcpValido = !jcp.erro;
      var jcpDedutivel = jcpValido ? jcp.jcpDedutivel : 0;
      var lucroAjustado = e.lucroLiquido - jcpDedutivel;

      var irpjSem = LR.calcular.irpj({ lucroLiquido: e.lucroLiquido, adicoes: e.adicoes, exclusoes: e.exclusoes, numMeses: e.numMeses });
      var irpjCom = LR.calcular.irpj({
        lucroLiquido: lucroAjustado, adicoes: e.adicoes, exclusoes: e.exclusoes,
        prejuizoFiscal: e.prejuizoFiscal, numMeses: e.numMeses,
        retencoesFonte: e.retencoesFonte, estimativasPagas: e.estimativasPagas
      });
      var csll = LR.calcular.csll({ lucroLiquido: lucroAjustado, adicoes: e.adicoes, exclusoes: e.exclusoes, baseNegativa: e.baseNegativaCSLL });

      // v3.3 FIX E2#1: Calcular economia CSLL (comparando cenário sem vs com base negativa)
      var csllSem = LR.calcular.csll({ lucroLiquido: lucroAjustado, adicoes: e.adicoes, exclusoes: e.exclusoes, baseNegativa: 0 });
      var economiaCSLL = _r(csllSem.csllDevida - csll.csllDevida);

      var economiaJCP = jcpValido ? jcp.economiaLiquida : 0;
      var economiaIRPJ = irpjSem.irpjDevido - irpjCom.irpjDevido;

      // v3.3 FIX #6: PIS/COFINS integrado no fallback
      var pisCofins = null;
      var pisCofinsLiquido = 0;
      var pisCofinsBruto = 0;
      if (e.dadosPISCOFINS) {
        pisCofins = LR.calcular.pisCofins(e.dadosPISCOFINS);
        pisCofinsBruto = (pisCofins.debitoPIS || 0) + (pisCofins.debitoCOFINS || 0);
        pisCofinsLiquido = pisCofins.totalAPagar || 0;
      }

      var cargaIRPJ_CSLL = _r(irpjCom.irpjAPagar + csll.csllDevida);
      var cargaTotalBruta = _r(cargaIRPJ_CSLL + pisCofinsBruto);
      var cargaTotalLiquida = _r(cargaIRPJ_CSLL + Math.max(pisCofinsLiquido - e.retencoesPISCOFINS, 0));

      // v3.3 FIX #7: Cenários com PIS/COFINS proporcional no fallback
      var cenariosFB = {};
      var variacoes = { base: 0, pessimista: -0.05, otimista: 0.05 };
      for (var nomeCenFB in variacoes) {
        if (!variacoes.hasOwnProperty(nomeCenFB)) continue;
        var varFB = variacoes[nomeCenFB];
        var fatorFB = 1 + varFB;
        var receitaCenFB = e.receitaBruta * fatorFB;
        var lucroCenFB = e.lucroLiquido * fatorFB;

        var pcCenFB = pisCofinsLiquido;
        var pcCenBrutoFB = pisCofinsBruto;
        if (e.dadosPISCOFINS && varFB !== 0) {
          var pcCalc = LR.calcular.pisCofins(Object.assign({}, e.dadosPISCOFINS, { receitaBruta: receitaCenFB }));
          pcCenFB = pcCalc.totalAPagar || 0;
          pcCenBrutoFB = (pcCalc.debitoPIS || 0) + (pcCalc.debitoCOFINS || 0);
        }

        var irpjCenFB, csllCenFB;
        if (varFB === 0) {
          irpjCenFB = irpjCom.irpjAPagar;
          csllCenFB = csll.csllDevida;
        } else {
          var irpjCalcFB = LR.calcular.irpj({
            lucroLiquido: lucroCenFB - jcpDedutivel, adicoes: e.adicoes * fatorFB, exclusoes: e.exclusoes * fatorFB,
            prejuizoFiscal: e.prejuizoFiscal, numMeses: e.numMeses,
            retencoesFonte: e.retencoesFonte, estimativasPagas: e.estimativasPagas
          });
          var csllCalcFB = LR.calcular.csll({
            lucroLiquido: lucroCenFB - jcpDedutivel, adicoes: e.adicoes * fatorFB, exclusoes: e.exclusoes * fatorFB,
            baseNegativa: e.baseNegativaCSLL
          });
          irpjCenFB = irpjCalcFB.irpjAPagar;
          csllCenFB = csllCalcFB.csllDevida;
        }

        var totalCenBrutoFB = _r(irpjCenFB + csllCenFB + pcCenBrutoFB);
        var totalCenLiquidoFB = _r(irpjCenFB + csllCenFB + Math.max(pcCenFB - e.retencoesPISCOFINS, 0));

        cenariosFB[nomeCenFB] = {
          variacao: _r(varFB * 100) + '%',
          receita: _r(receitaCenFB),
          irpj: _r(irpjCenFB),
          csll: _r(csllCenFB),
          pisCofins: _r(pcCenFB),
          pisCofinsNota: varFB !== 0 ? 'PIS/COFINS recalculado proporcionalmente' : 'Cenário base',
          cargaTotalBruta: totalCenBrutoFB,
          cargaTotalLiquida: totalCenLiquidoFB,
          cargaEfetiva: receitaCenFB > 0 ? _r(totalCenLiquidoFB / receitaCenFB * 100) + '%' : '0%'
        };
      }

      // v3.3 FIX BUG CRÍTICO 2: Economia PIS/COFINS (créditos não-cumulativos) incluída no total
      var economiaPisCofins = pisCofins ? _r((pisCofins.totalCreditos || 0) + (pisCofins.creditoPIS || 0) + (pisCofins.creditoCOFINS || 0) > 0
        ? (pisCofins.totalCreditos || ((pisCofins.creditoPIS || 0) + (pisCofins.creditoCOFINS || 0)))
        : (pisCofinsBruto - pisCofinsLiquido)) : 0;

      return {
        semOtimizacao: { irpjDevido: irpjSem.irpjDevido, aliquotaEfetiva: irpjSem.aliquotaEfetiva },
        comOtimizacao: { irpj: irpjCom, csll: csll, jcp: jcp, pisCofins: pisCofins },
        economia: { jcp: economiaJCP, irpj: _r(economiaIRPJ), csll: economiaCSLL, pisCofins: _r(economiaPisCofins), total: _r(economiaIRPJ + economiaJCP + economiaCSLL + economiaPisCofins) },
        totalAPagar: {
          irpj: irpjCom.irpjAPagar,
          csll: csll.csllDevida,
          subtotalIRPJ_CSLL: cargaIRPJ_CSLL,
          pisCofins: pisCofins ? {
            bruto: _r(pisCofinsBruto),
            liquido: _r(pisCofinsLiquido),
            retencoesFonte: e.retencoesPISCOFINS,
            aPagar: _r(Math.max(pisCofinsLiquido - e.retencoesPISCOFINS, 0))
          } : null,
          total: cargaTotalLiquida,
          cargaTotalBruta: cargaTotalBruta,
          cargaTotalBrutaDescricao: 'IRPJ + CSLL + PIS/COFINS débitos (antes de créditos e retenções)',
          cargaTotalLiquida: cargaTotalLiquida,
          cargaTotalLiquidaDescricao: 'IRPJ + CSLL + PIS/COFINS a pagar (após créditos e retenções)',
          nota: 'A carga LÍQUIDA é o desembolso efetivo. A BRUTA inclui PIS/COFINS antes dos créditos.'
        },
        cenarios: cenariosFB,
        cenarioNota: 'PIS/COFINS recalculado proporcionalmente à receita em cada cenário.',
        saldoNegativo: null
      };
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 31. HELPERS — FORMATAÇÃO E UTILITÁRIOS
  // ═══════════════════════════════════════════════════════════════════════════

  LR.helpers = {
    // v3.3 FIX E2#5: Verificar se sistema está em modo fallback
    isFallback: function () {
      return LR._modoFallback === true;
    },
    getFallbackInfo: function () {
      if (!LR._modoFallback) return null;
      return {
        modoFallback: true,
        funcoesAfetadas: LR._fallbackUsado,
        aviso: 'Cálculos executados em modo simplificado — resultados podem divergir do motor fiscal completo.',
        motivo: 'Motor fiscal (motor-lucro-real-v4.6-unificado.js) não carregado ou indisponível.'
      };
    },
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
      return LR.ehSUDAM(uf);  // v3.2: delega a função que lê de estados.js
    },
    ehSUDENE: function (uf) {
      return LR.ehSUDENE(uf);  // v3.2: delega a função que lê de estados.js
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
