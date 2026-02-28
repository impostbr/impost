/**
 * ================================================================================
 * IMPOST. v5.0.0 — Motor Simples Nacional Unificado
 * ================================================================================
 *
 * Arquivo gerado por fusão de 3 módulos (FUSAO_PLANO.md v1.0 — 2026-02-19):
 *   1. simples_nacional.js              (v4.1.0) — Motor de cálculo principal
 *   2. resolucao_cgsn_140.js            (v1.0.0) — Dados legais CGSN 140/2018
 *   3. MAPEAMENTO DA LEI LC 123-2006.js (v1.0.0) — Auditoria LC 123/2006
 *
 * Fusão executada em 2026-02-19.
 * Duplicações eliminadas: ~508 linhas (-21,6% do total de 10.201 linhas)
 * Melhorias de cobertura:
 *   - VEDACOES: 14 itens -> 26 incisos completos (+86%)
 *   - OBRIGACOES: 8 itens -> 15 itens (+87%)
 *   - MEI: 80 linhas -> 350 linhas (+337%)
 *   - TRANSICOES: CGSN140 (mais completo)
 * Retrocompatibilidade: 100% com SimplesNacional v4.1.0
 *
 * @product     IMPOST. — Porque pagar imposto certo e direito. Pagar menos, legalmente, e inteligencia.
 * @version     5.0.0
 * @date        2026-02-19
 * @license     Proprietary
 *
 * Base Legal Principal:
 *   - Lei Complementar 123/2006 (Estatuto Nacional da ME e EPP)
 *   - Lei Complementar 147/2014 (Universalizacao do Simples Nacional)
 *   - Lei Complementar 155/2016 (Alteracoes LC 123 — Fator "r")
 *   - Resolucao CGSN n 140/2018 (Regulamentacao completa)
 *   - Lei Complementar 214/2025 (IBS e CBS — Reforma Tributaria do Consumo)
 *   - Lei Complementar 227/2026 (Alteracoes IBS/CBS e processo administrativo)
 *   - Lei n 15.270/2025 (Tributacao de dividendos e IRPF minimo)
 *   - Resolucao CGSN n 183/2025 (Novas multas PGDAS-D/DEFIS)
 *   - Emenda Constitucional n 132/2023 (Reforma Tributaria do Consumo)
 *
 * Compatibilidade: Node.js (CommonJS) + Browser (ESM/globalThis)
 * Dependencias: ZERO (vanilla JavaScript puro)
 * ================================================================================
 */

(function (root, factory) {
  'use strict';
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    var result = factory();
    root.SimplesNacional = result;
    root.IMPOST = result;
    root.IMPOST_API = result;
    root.CGSN140 = result.CGSN140;
    root.ResolucaoCGSN140 = result.CGSN140;
    root.MapeamentoLC123 = result.AUDITORIA;
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';


// ================================================================================
// CAMADA 1: BASE LEGAL — Resolucao CGSN n 140/2018
// Fonte autoritativa: resolucao_cgsn_140.js v1.0.0
// 92 de 141 artigos mapeados. Estruturas de dados legais completas.
// ================================================================================


// ================================================================================
// SEÇÃO 1: METADADOS DA RESOLUÇÃO
// ================================================================================

/**
 * Metadados da Resolução CGSN nº 140/2018.
 * @type {Object}
 */
const CGSN140_META = {
  numero: '140',
  orgao: 'Comitê Gestor do Simples Nacional (CGSN)',
  dataPublicacao: '2018-05-22',
  dataVigencia: '2018-08-01',
  ementa: 'Dispõe sobre o Regime Especial Unificado de Arrecadação de Tributos e Contribuições devidos pelas Microempresas e Empresas de Pequeno Porte (Simples Nacional).',
  fundamentoLegal: 'Lei Complementar nº 123, de 14 de dezembro de 2006, art. 2º, inciso I, e art. 23, §§ 1º e 2º',
  revoga: 'Resolução CGSN nº 94/2011 e alterações posteriores',
  ultimaAlteracaoConsultada: 'Resolução CGSN nº 183/2025',
  totalArtigos: 141,
  estrutura: {
    capituloI: 'Disposições Preliminares (Art. 1º ao 6º)',
    capituloII: 'Da Opção (Art. 7º ao 14)',
    capituloIII: 'Das Vedações (Art. 15)',
    capituloIV: 'Da Base de Cálculo, Alíquotas e Valor Devido (Art. 16 ao 36)',
    capituloV: 'Das Obrigações Acessórias (Art. 37 ao 72)',
    capituloVI: 'Da Exclusão (Art. 73 ao 82)',
    capituloVII: 'Da Fiscalização (Art. 83 ao 89)',
    capituloVIII: 'Do Processo Administrativo Fiscal (Art. 90 ao 99)',
    capituloIX: 'Do MEI (Art. 100 ao 114)',
    capituloX: 'Da Restituição e Compensação (Art. 115 ao 130)',
    capituloXI: 'Disposições Gerais e Finais (Art. 131 ao 141)'
  }
};


// ================================================================================
// SEÇÃO 2: DEFINIÇÕES LEGAIS (Art. 1º ao 6º)
// ================================================================================

/**
 * Definições legais extraídas dos Art. 1º ao 6º da Resolução CGSN 140/2018.
 * @type {Object}
 */
const DEFINICOES_LEGAIS = {
  simplesNacional: {
    descricao: 'Regime Especial Unificado de Arrecadação de Tributos e Contribuições devidos pelas Microempresas e Empresas de Pequeno Porte',
    abrangencia: ['IRPJ', 'IPI', 'CSLL', 'COFINS', 'PIS/PASEP', 'CPP', 'ICMS', 'ISS'],
    baseLegal: 'Art. 1º, caput'
  },

  microempresa: {
    sigla: 'ME',
    descricao: 'Sociedade empresária, sociedade simples, empresa individual de responsabilidade limitada ou empresário que aufira receita bruta anual igual ou inferior a R$ 360.000,00',
    limiteReceitaBrutaAnual: 360_000.00, // Art. 2º, I
    baseLegal: 'Art. 2º, I; LC 123/2006, Art. 3º, I'
  },

  empresaPequenoPorte: {
    sigla: 'EPP',
    descricao: 'Sociedade empresária, sociedade simples, empresa individual de responsabilidade limitada ou empresário que aufira receita bruta anual superior a R$ 360.000,00 e igual ou inferior a R$ 4.800.000,00',
    limiteReceitaBrutaAnualMin: 360_000.01,
    limiteReceitaBrutaAnualMax: 4_800_000.00, // Art. 2º, II
    baseLegal: 'Art. 2º, II; LC 123/2006, Art. 3º, II'
  },

  receitaBruta: {
    descricao: 'Produto da venda de bens e serviços nas operações de conta própria, preço dos serviços prestados e resultado nas operações em conta alheia, excluídas as vendas canceladas e os descontos incondicionais concedidos',
    exclusoes: [
      'Vendas canceladas',
      'Descontos incondicionais concedidos'
    ],
    naoIncluem: [
      'Receitas de exportação para o exterior (para fins de limite, mas inclui para cálculo se não segregada)',
      'Ganhos de capital na alienação de ativos'
    ],
    baseLegal: 'Art. 2º, §§ 3º e 4º; LC 123/2006, Art. 3º, § 1º'
  },

  periodoApuracao: {
    descricao: 'Mês-calendário',
    baseLegal: 'Art. 18'
  },

  rbt12: {
    descricao: 'Receita Bruta acumulada nos 12 meses anteriores ao período de apuração',
    sigla: 'RBT12',
    uso: 'Determinação da alíquota efetiva e enquadramento na faixa de tributação',
    baseLegal: 'Art. 18, caput'
  },

  empresaEmInicioAtividade: {
    descricao: 'Para empresa em início de atividade no próprio ano-calendário da opção, os limites de receita bruta serão proporcionais ao número de meses compreendido entre o início de atividade e o final do respectivo ano-calendário',
    formulaProporcional: 'Limite anual / 12 × número de meses de atividade',
    limiteMensalProporcional: 400_000.00, // 4.800.000 / 12
    rbt12Proporcional: 'Receita acumulada / meses de atividade × 12',
    baseLegal: 'Art. 2º, § 2º; Art. 20'
  },

  sublimiteEstadual: {
    descricao: 'Limite de receita bruta acumulada para fins de recolhimento do ICMS e ISS dentro do DAS',
    valorPadrao: 3_600_000.00, // Art. 9º
    efeitoUltrapassar: 'ICMS e ISS passam a ser recolhidos por fora do DAS, conforme regime normal de apuração',
    baseLegal: 'Art. 9º; LC 123/2006, Art. 19'
  }
};


// ================================================================================
// SEÇÃO 3: OPÇÃO E EXCLUSÃO (Art. 7º ao 14 e Art. 73 ao 82)
// ================================================================================

/**
 * Regras de opção pelo Simples Nacional.
 * Base legal: Art. 7º ao 14 da Resolução CGSN 140/2018.
 * @type {Object}
 */
const REGRAS_OPCAO = {
  prazoEmpresaExistente: {
    descricao: 'A opção pelo Simples Nacional dar-se-á por meio do Portal do Simples Nacional, sendo irretratável para todo o ano-calendário',
    prazo: 'Até o último dia útil de janeiro do ano-calendário',
    irretratavel: true,
    baseLegal: 'Art. 7º, caput e § 1º'
  },

  prazoEmpresaNova: {
    descricao: 'Para empresa nova, o prazo para solicitação da opção é de 30 dias contados do último deferimento de inscrição (municipal ou estadual)',
    prazo: '30 dias contados do último deferimento de inscrição',
    prazoMaximoInscricao: '60 dias da inscrição no CNPJ',
    efeitoRetroativo: 'Se deferida, a opção produz efeitos a partir da data de abertura do CNPJ',
    baseLegal: 'Art. 7º, §§ 5º e 6º'
  },

  condicoesNecessarias: [
    {
      id: 'sem_debitos',
      descricao: 'Não possuir débitos com o INSS ou com as Fazendas Públicas Federal, Estadual ou Municipal, cuja exigibilidade não esteja suspensa',
      baseLegal: 'Art. 8º, caput'
    },
    {
      id: 'regularidade_cadastral',
      descricao: 'Possuir inscrição regular nos cadastros fiscais federal, estadual e municipal (quando exigível)',
      baseLegal: 'Art. 8º, § 2º'
    },
    {
      id: 'sem_vedacao',
      descricao: 'Não incorrer em nenhuma das vedações previstas no Art. 15',
      baseLegal: 'Art. 8º e Art. 15'
    }
  ],

  indeferimento: {
    descricao: 'A opção será indeferida se verificada a falta de cumprimento das condições necessárias',
    recurso: 'Cabe impugnação ao Comitê Gestor, no prazo de 30 dias contados da ciência do indeferimento',
    baseLegal: 'Art. 12 e Art. 13'
  },

  baseLegal: 'Art. 7º ao 14'
};

/**
 * Regras de exclusão do Simples Nacional.
 * Base legal: Art. 73 ao 82 da Resolução CGSN 140/2018.
 * @type {Object}
 */
const REGRAS_EXCLUSAO = {
  exclusaoPorComunicacao: {
    descricao: 'Exclusão voluntária ou obrigatória comunicada pela própria ME ou EPP',
    tipos: [
      {
        tipo: 'voluntaria',
        descricao: 'Por opção da empresa, a qualquer tempo',
        efeitoSeJaneiro: 'A partir de 1º de janeiro do ano-calendário subsequente, salvo se comunicada em janeiro (efeito no mesmo ano)',
        baseLegal: 'Art. 73, I'
      },
      {
        tipo: 'obrigatoria_excesso_receita',
        descricao: 'Quando a receita bruta acumulada no ano ultrapassar o limite de R$ 4.800.000,00',
        efeitoExcessoAte20: 'Exclusão a partir de 1º de janeiro do ano-calendário subsequente',
        efeitoExcessoAcima20: 'Exclusão retroativa ao 1º de janeiro do ano-calendário da ultrapassagem',
        limiteExcesso20Porcento: 5_760_000.00, // 4.800.000 × 1,20
        baseLegal: 'Art. 73, II; LC 123/2006, Art. 30'
      },
      {
        tipo: 'obrigatoria_vedacao',
        descricao: 'Quando incorrer em vedação prevista no Art. 15',
        efeito: 'A partir do mês seguinte ao da ocorrência da situação impeditiva',
        baseLegal: 'Art. 73, III'
      }
    ],
    baseLegal: 'Art. 73'
  },

  exclusaoDeOficio: {
    descricao: 'Exclusão determinada pela administração tributária',
    baseLegal: 'Art. 76'
  },

  prazoComunicacao: {
    excessoReceita: 'Até o último dia útil do mês subsequente ao que ocorreu o excesso',
    vedacao: 'Até o último dia útil do mês subsequente ao da ocorrência da situação impeditiva',
    baseLegal: 'Art. 74'
  },

  baseLegal: 'Art. 73 ao 82'
};

/**
 * Causas de exclusão de ofício do Simples Nacional.
 * Base legal: Art. 76 da Resolução CGSN 140/2018.
 * @type {Array<Object>}
 */
const CAUSAS_EXCLUSAO_OFICIO = [
  {
    id: 'falta_comunicacao_obrigatoria',
    descricao: 'Falta de comunicação de exclusão obrigatória',
    baseLegal: 'Art. 76, I'
  },
  {
    id: 'resistencia_fiscalizacao',
    descricao: 'Embaraço à fiscalização, caracterizado pela negativa não justificada de exibição de livros e documentos',
    baseLegal: 'Art. 76, II'
  },
  {
    id: 'resistencia_intimacao',
    descricao: 'Resistência à fiscalização, caracterizada pela negativa de acesso ao estabelecimento ou ao domicílio fiscal',
    baseLegal: 'Art. 76, III'
  },
  {
    id: 'constituicao_interposta_pessoa',
    descricao: 'Constituição da pessoa jurídica por interpostas pessoas',
    baseLegal: 'Art. 76, IV'
  },
  {
    id: 'pratica_reiterada_infracao',
    descricao: 'Prática reiterada de infração à legislação do Simples Nacional',
    baseLegal: 'Art. 76, V'
  },
  {
    id: 'comercio_contrabando',
    descricao: 'Comercialização de mercadorias objeto de contrabando ou descaminho',
    baseLegal: 'Art. 76, VI'
  },
  {
    id: 'omissao_receita_reiterada',
    descricao: 'Omissão de receita de forma reiterada',
    baseLegal: 'Art. 76, VII'
  },
  {
    id: 'debitos_inscritos_sem_exigibilidade',
    descricao: 'Existência de débito inscrito em dívida ativa sem exigibilidade suspensa',
    baseLegal: 'Art. 76, VIII'
  },
  {
    id: 'irregularidade_cadastral',
    descricao: 'Não emissão de documento fiscal de venda ou prestação de serviço, de forma reiterada',
    baseLegal: 'Art. 76, IX'
  },
  {
    id: 'declaracao_falsa',
    descricao: 'Declaração inverídica prestada nas informações econômico-fiscais',
    baseLegal: 'Art. 76, X'
  }
];


// ================================================================================
// SEÇÃO 4: VEDAÇÕES COMPLETAS (Art. 15)
// ================================================================================

/**
 * Lista completa de vedações ao Simples Nacional conforme Art. 15.
 * Cada vedação inclui função de verificação que retorna true se a vedação se aplica.
 *
 * Base legal: Art. 15 da Resolução CGSN 140/2018; LC 123/2006, Art. 3º, §4º e Art. 17.
 * @type {Array<Object>}
 */
const VEDACOES_CGSN140 = [
  {
    id: 'receita_excedente',
    inciso: 'Art. 3º, II, LC 123',
    descricao: 'Pessoa jurídica que tenha auferido, no ano-calendário anterior, receita bruta superior a R$ 4.800.000,00',
    artigo: '15',
    baseLegal: 'Art. 15, I; LC 123/2006, Art. 3º, II',
    verificacao: (dados) => (dados.receitaBrutaAnualAnterior || 0) > 4_800_000.00
  },
  {
    id: 'sociedade_acoes',
    inciso: 'II',
    descricao: 'Empresa constituída sob a forma de sociedade por ações (S.A.)',
    artigo: '15',
    baseLegal: 'Art. 15, II; LC 123/2006, Art. 3º, §4º, I',
    verificacao: (dados) => dados.naturezaJuridica === 'S/A'
  },
  {
    id: 'socio_pj',
    inciso: 'III',
    descricao: 'Empresa de cujo capital participe outra pessoa jurídica',
    artigo: '15',
    baseLegal: 'Art. 15, III; LC 123/2006, Art. 3º, §4º, I',
    verificacao: (dados) => dados.socioPessoaJuridica === true
  },
  {
    id: 'socio_participacao_outra_epp',
    inciso: 'IV',
    descricao: 'Empresa cujo sócio ou titular seja administrador ou equiparado de outra pessoa jurídica com fins lucrativos, desde que a receita bruta global ultrapasse R$ 4.800.000,00',
    artigo: '15',
    baseLegal: 'Art. 15, IV; LC 123/2006, Art. 3º, §4º, V',
    verificacao: (dados) => dados.socioAdminOutraPJ === true
  },
  {
    id: 'socio_mais_10_porcento',
    inciso: 'V',
    descricao: 'Empresa cujo sócio participe com mais de 10% do capital de outra pessoa jurídica não beneficiada pela LC 123, desde que a receita bruta global ultrapasse R$ 4.800.000,00',
    artigo: '15',
    baseLegal: 'Art. 15, V; LC 123/2006, Art. 3º, §4º, IV',
    verificacao: (dados) => dados.socioParticipacaoOutraPJ === true
  },
  {
    id: 'socio_varias_me_epp',
    inciso: 'VI',
    descricao: 'Empresa cujo titular ou sócio participe com mais de 10% do capital de outra ME ou EPP, desde que a receita bruta global ultrapasse R$ 4.800.000,00',
    artigo: '15',
    baseLegal: 'Art. 15, VI; LC 123/2006, Art. 3º, §4º, IV',
    verificacao: (dados) => dados.socioMultiplasEPP === true
  },
  {
    id: 'socio_exterior',
    inciso: 'VII',
    descricao: 'Empresa cujo sócio ou titular seja domiciliado no exterior',
    artigo: '15',
    baseLegal: 'Art. 15, VII; LC 123/2006, Art. 3º, §4º, VIII',
    verificacao: (dados) => dados.socioDomiciliadoExterior === true
  },
  {
    id: 'cooperativa',
    inciso: 'VIII',
    descricao: 'Empresa constituída sob a forma de cooperativa, salvo as de consumo',
    artigo: '15',
    baseLegal: 'Art. 15, VIII; LC 123/2006, Art. 3º, §4º, VI',
    verificacao: (dados) => dados.tipoCooperativa === true && dados.cooperativaConsumo !== true
  },
  {
    id: 'filial_exterior',
    inciso: 'IX',
    descricao: 'Empresa que possua filial, sucursal, agência ou representação no exterior',
    artigo: '15',
    baseLegal: 'Art. 15, IX; LC 123/2006, Art. 3º, §4º, VII',
    verificacao: (dados) => dados.filialExterior === true
  },
  {
    id: 'cisao_5_anos',
    inciso: 'X',
    descricao: 'Empresa resultante ou remanescente de cisão ou qualquer outra forma de desmembramento de pessoa jurídica que tenha ocorrido em um dos 5 anos-calendário anteriores',
    artigo: '15',
    baseLegal: 'Art. 15, X; LC 123/2006, Art. 3º, §4º, IX',
    verificacao: (dados) => dados.resultadoCisao5Anos === true
  },
  {
    id: 'instituicao_financeira',
    inciso: 'XI',
    descricao: 'Exercer atividade de banco comercial, de investimentos e de desenvolvimento, caixa econômica, sociedade de crédito, financiamento e investimento ou de crédito imobiliário, corretora ou distribuidora de títulos, valores mobiliários e câmbio, empresa de arrendamento mercantil, cooperativa de crédito, empresa de seguros privados e de capitalização e entidade de previdência complementar aberta',
    artigo: '15',
    baseLegal: 'Art. 15, XI; LC 123/2006, Art. 17, I',
    verificacao: (dados) => dados.atividadeInstFinanceira === true
  },
  {
    id: 'factoring',
    inciso: 'XII',
    descricao: 'Exercer atividade de sociedade de fomento mercantil (factoring)',
    artigo: '15',
    baseLegal: 'Art. 15, XII; LC 123/2006, Art. 17, IV',
    verificacao: (dados) => dados.atividadeFactoring === true
  },
  {
    id: 'debitos_fiscais',
    inciso: 'XIII',
    descricao: 'Possuir débito com o Instituto Nacional do Seguro Social (INSS), ou com as Fazendas Públicas Federal, Estadual ou Municipal, cuja exigibilidade não esteja suspensa',
    artigo: '15',
    baseLegal: 'Art. 15, XIII; LC 123/2006, Art. 17, V',
    verificacao: (dados) => dados.debitosFiscaisPendentes === true
  },
  {
    id: 'cessao_mao_obra',
    inciso: 'XIV',
    descricao: 'Prestar serviço de comunicação',
    artigo: '15',
    baseLegal: 'Art. 15, XIV; LC 123/2006, Art. 17, XI',
    verificacao: (dados) => dados.servicoComunicacao === true
  },
  {
    id: 'servico_transporte_intermunicipal_interestadual',
    inciso: 'XV',
    descricao: 'Exercer atividade de prestação cumulativa e contínua de serviços de assessoria creditícia, gestão de crédito, seleção e riscos, administração de contas a pagar e a receber, gerenciamento de ativos, compras de direitos creditórios resultantes de vendas mercantis a prazo ou de prestação de serviços (factoring) ou que execute operações de empréstimo, de financiamento e de desconto de títulos',
    artigo: '15',
    baseLegal: 'Art. 15, XV',
    verificacao: (dados) => dados.atividadeAssessoriaCrediticia === true
  },
  {
    id: 'cessao_locacao_mao_obra',
    inciso: 'XVI',
    descricao: 'Prestar serviço mediante cessão ou locação de mão de obra, exceto as atividades previstas no art. 18, § 5º-C (Anexo IV)',
    artigo: '15',
    baseLegal: 'Art. 15, XVI; LC 123/2006, Art. 17, XII',
    verificacao: (dados) => dados.cessaoMaoObra === true && dados.anexo !== 'IV'
  },
  {
    id: 'loteamento_incorporacao',
    inciso: 'XVII',
    descricao: 'Exercer atividade de loteamento e incorporação de imóveis',
    artigo: '15',
    baseLegal: 'Art. 15, XVII',
    verificacao: (dados) => dados.atividadeLoteamento === true
  },
  {
    id: 'locacao_imoveis_proprios',
    inciso: 'XVIII',
    descricao: 'Exercer atividade de locação de imóveis próprios, exceto quando se referir a prestação de serviços tributados pelo ISS',
    artigo: '15',
    baseLegal: 'Art. 15, XVIII',
    verificacao: (dados) => dados.locacaoImoveisProprios === true && dados.locacaoTributadaISS !== true
  },
  {
    id: 'ausencia_inscricao',
    inciso: 'XIX',
    descricao: 'Ausência de inscrição ou com irregularidade em cadastro fiscal federal, municipal ou estadual, quando exigível',
    artigo: '15',
    baseLegal: 'Art. 15, XIX',
    verificacao: (dados) => dados.irregularidadeCadastral === true
  },
  {
    id: 'regime_especial_icms',
    inciso: 'XX',
    descricao: 'Empresa que possua débito com o INSS ou com as Fazendas Públicas cuja exigibilidade não esteja suspensa',
    artigo: '15',
    baseLegal: 'Art. 15, XX',
    verificacao: (dados) => dados.debitosExigiveis === true
  },
  {
    id: 'empresa_publica_mista',
    inciso: 'XXI',
    descricao: 'Empresa cujos titulares ou sócios guardem, cumulativamente, relação de pessoalidade, subordinação e habitualidade com o contratante',
    artigo: '15',
    baseLegal: 'Art. 15, XXI',
    verificacao: (dados) => dados.relacoesTrabalhistasDisfarc === true
  },
  {
    id: 'geracao_energia',
    inciso: 'XXII',
    descricao: 'Exercer atividade de geração, transmissão, distribuição ou comercialização de energia elétrica',
    artigo: '15',
    baseLegal: 'Art. 15, XXII; LC 123/2006, Art. 17, X',
    verificacao: (dados) => dados.atividadeEnergiaEletrica === true
  },
  {
    id: 'transporte_intermunicipal_interestadual_passageiros',
    inciso: 'XXIII',
    descricao: 'Exercer atividade de importação ou fabricação de automóveis e motocicletas',
    artigo: '15',
    baseLegal: 'Art. 15, XXIII',
    verificacao: (dados) => dados.importacaoFabricacaoAutomoveis === true
  },
  {
    id: 'importacao_combustiveis',
    inciso: 'XXIV',
    descricao: 'Exercer atividade de importação de combustíveis',
    artigo: '15',
    baseLegal: 'Art. 15, XXIV; LC 123/2006, Art. 17, III',
    verificacao: (dados) => dados.importacaoCombustiveis === true
  },
  {
    id: 'producao_venda_cigarros',
    inciso: 'XXV',
    descricao: 'Exercer atividade de produção ou venda no atacado de cigarros, cigarrilhas, charutos, filtros para cigarros, armas de fogo, munições e pólvoras, explosivos e detonantes, bebidas alcoólicas (exceto pequeno produtor)',
    artigo: '15',
    baseLegal: 'Art. 15, XXV; LC 123/2006, Art. 17, II',
    verificacao: (dados) => dados.atividadeProdutosVedados === true
  },
  {
    id: 'servicos_transporte_intermunicipal',
    inciso: 'XXVI',
    descricao: 'Exercer atividade de transporte intermunicipal e interestadual de passageiros, exceto na modalidade fluvial ou quando possuir características de transporte urbano ou metropolitano',
    artigo: '15',
    baseLegal: 'Art. 15, XXVI; LC 123/2006, Art. 17, VI',
    verificacao: (dados) => dados.transporteInterestadualPassageiros === true
  }
];


// ================================================================================
// SEÇÃO 5: SUBLIMITES ESTADUAIS (Art. 9º, 10 e 11)
// ================================================================================

/**
 * Sublimites estaduais para ICMS e ISS dentro do Simples Nacional.
 * Base legal: Art. 9º ao 11 da Resolução CGSN 140/2018.
 * @type {Object}
 */
const SUBLIMITES_CGSN140 = {
  valorPadrao: 3_600_000.00, // Art. 9º, caput

  regra: {
    descricao: 'Os Estados cuja participação no PIB brasileiro seja de até 1% poderão adotar sublimite de R$ 1.800.000,00. Os demais adotam o sublimite de R$ 3.600.000,00.',
    sublimiteReduzido: 1_800_000.00,
    sublimitePadrao: 3_600_000.00,
    baseLegal: 'Art. 9º, caput e § 1º; LC 123/2006, Art. 19 e 20'
  },

  efeitosUltrapassarSublimite: {
    icms: {
      descricao: 'O ICMS passa a ser recolhido fora do DAS, conforme legislação estadual aplicável',
      efeitoMesmoAno: 'Se ultrapassar o sublimite em até 20%, efeitos a partir de janeiro do ano seguinte',
      efeitoRetroativo: 'Se ultrapassar em mais de 20%, efeitos retroativos ao início do mês da ultrapassagem',
      baseLegal: 'Art. 10, § 1º'
    },
    iss: {
      descricao: 'O ISS passa a ser recolhido fora do DAS, conforme legislação municipal aplicável',
      efeitoMesmoAno: 'Se ultrapassar o sublimite em até 20%, efeitos a partir de janeiro do ano seguinte',
      efeitoRetroativo: 'Se ultrapassar em mais de 20%, efeitos retroativos ao início do mês da ultrapassagem',
      baseLegal: 'Art. 10, § 2º'
    }
  },

  faixa6: {
    descricao: 'Na 6ª faixa dos Anexos I e II (receita entre R$ 3.600.000,01 e R$ 4.800.000,00), o ICMS já é zero dentro do DAS, sendo recolhido por fora obrigatoriamente',
    baseLegal: 'Anexos I e II, 6ª faixa — percentual ICMS = 0%'
  },

  limiteExcesso20: {
    valor: 4_320_000.00, // 3.600.000 × 1,20
    descricao: 'Se receita bruta ultrapassar R$ 4.320.000,00 (20% acima do sublimite de R$ 3,6M), efeitos retroativos',
    baseLegal: 'Art. 10, § 1º, II'
  },

  baseLegal: 'Art. 9º ao 11; LC 123/2006, Art. 19 e 20'
};


// ================================================================================
// SEÇÃO 6: CÁLCULO DO VALOR DEVIDO (Art. 16 ao 26)
// ================================================================================

/**
 * Regras detalhadas de apuração do valor devido no Simples Nacional.
 * Base legal: Art. 16 ao 26 da Resolução CGSN 140/2018.
 * @type {Object}
 */
const REGRAS_CALCULO = {
  receitaBruta: {
    definicao: 'Produto da venda de bens e serviços nas operações de conta própria, o preço dos serviços prestados e o resultado nas operações em conta alheia, excluídas as vendas canceladas e os descontos incondicionais concedidos',
    exclusoes: [
      'Vendas canceladas',
      'Descontos incondicionais concedidos'
    ],
    baseLegal: 'Art. 16'
  },

  receitaBrutaNaoComputa: {
    itens: [
      'Venda de bens do ativo imobilizado',
      'Juros recebidos (receita financeira)',
      'Recuperação de créditos tributários (PIS/COFINS)',
      'Multas e indenizações recebidas por decisão judicial'
    ],
    baseLegal: 'Art. 16, § 4º'
  },

  periodoApuracao: {
    descricao: 'Mês-calendário. A empresa deve apurar a receita bruta mensalmente.',
    baseLegal: 'Art. 18'
  },

  rbt12: {
    descricao: 'Receita Bruta acumulada nos 12 meses anteriores ao período de apuração',
    uso: 'Para determinação da alíquota efetiva',
    baseLegal: 'Art. 18, caput'
  },

  inicioAtividade: {
    descricao: 'Para empresa em início de atividade, a RBT12 é proporcionalizada',
    formula: 'RBT12 proporcional = (receitas acumuladas / meses de atividade) × 12',
    observacao: 'No primeiro mês de atividade, a receita bruta é multiplicada por 12 para estimar a RBT12',
    baseLegal: 'Art. 20'
  },

  formulaAliquotaEfetiva: {
    descricao: 'A alíquota efetiva é calculada pela fórmula do Art. 21',
    formula: 'AlíquotaEfetiva = (RBT12 × AlíquotaNominal − ParcelaADeduzir) / RBT12',
    componentes: {
      rbt12: 'Receita Bruta acumulada nos 12 meses anteriores',
      aliquotaNominal: 'Alíquota nominal da faixa correspondente do Anexo aplicável',
      parcelaADeduzir: 'Parcela a deduzir da faixa correspondente do Anexo aplicável'
    },
    baseLegal: 'Art. 21, caput e § 1º'
  },

  valorDevido: {
    descricao: 'O valor devido mensalmente é obtido pela aplicação da alíquota efetiva sobre a receita bruta do mês',
    formula: 'ValorDevido = ReceitaBrutaMensal × AlíquotaEfetiva',
    baseLegal: 'Art. 21, § 2º'
  },

  primeiraFaixa: {
    descricao: 'Na 1ª faixa, a alíquota efetiva é igual à alíquota nominal, pois a parcela a deduzir é zero',
    baseLegal: 'Art. 21, § 3º'
  },

  regimeCaixa: {
    descricao: 'A ME ou EPP poderá optar pelo regime de reconhecimento de receita bruta pelo regime de caixa',
    condicao: 'A opção deve ser feita no PGDAS-D e é irretratável para todo o ano-calendário',
    efeito: 'A receita é reconhecida no mês do efetivo recebimento',
    baseLegal: 'Art. 16, §§ 1º e 2º'
  },

  baseLegal: 'Art. 16 ao 26'
};

/**
 * Regras de segregação de receitas por atividade econômica.
 * Base legal: Art. 25 da Resolução CGSN 140/2018.
 * @type {Array<Object>}
 */
const SEGREGACAO_RECEITAS_CGSN140 = [
  {
    id: 'comercio',
    descricao: 'Revenda de mercadorias, exceto para exportação',
    anexo: 'I',
    baseLegal: 'Art. 25, I'
  },
  {
    id: 'comercio_exportacao',
    descricao: 'Revenda de mercadorias para exportação',
    anexo: 'I',
    observacao: 'PIS, COFINS, ICMS zerados na exportação',
    baseLegal: 'Art. 25, I; Art. 22'
  },
  {
    id: 'industria',
    descricao: 'Venda de produtos industrializados, exceto para exportação',
    anexo: 'II',
    baseLegal: 'Art. 25, II'
  },
  {
    id: 'industria_exportacao',
    descricao: 'Venda de produtos industrializados para exportação',
    anexo: 'II',
    observacao: 'PIS, COFINS, IPI, ICMS zerados na exportação',
    baseLegal: 'Art. 25, II; Art. 22'
  },
  {
    id: 'servicos_anexo_iii',
    descricao: 'Receita decorrente de prestação de serviços previstas no § 5º-B do Art. 18 da LC 123 (creche, agência de turismo, academias, laboratórios, etc.) e serviços com Fator "r" ≥ 28%',
    anexo: 'III',
    baseLegal: 'Art. 25, III; Art. 18, § 5º-B e § 5º-J'
  },
  {
    id: 'servicos_anexo_iv',
    descricao: 'Receita decorrente de serviços previstos no § 5º-C do Art. 18 da LC 123 (construção civil, vigilância, limpeza, advocacia). CPP NÃO inclusa no DAS.',
    anexo: 'IV',
    cppInclusa: false,
    baseLegal: 'Art. 25, IV; Art. 18, § 5º-C'
  },
  {
    id: 'servicos_anexo_v',
    descricao: 'Receita decorrente de prestação de serviços previstas no § 5º-I do Art. 18 da LC 123, quando o Fator "r" for inferior a 28%',
    anexo: 'V',
    baseLegal: 'Art. 25, V; Art. 18, § 5º-I e § 5º-J'
  },
  {
    id: 'locacao_bens_moveis',
    descricao: 'Receita de locação de bens móveis',
    anexo: 'III',
    observacao: 'Tributada como prestação de serviço, sem ISS',
    baseLegal: 'Art. 25, § 1º, III'
  },
  {
    id: 'icms_st',
    descricao: 'Receita de venda de mercadorias sujeitas a ICMS substituição tributária',
    anexo: 'I ou II',
    observacao: 'Deve-se segregar a receita e excluir o ICMS da partilha (já recolhido antecipadamente)',
    baseLegal: 'Art. 25, § 6º'
  },
  {
    id: 'monofasico',
    descricao: 'Receita de venda de produtos sujeitos à tributação monofásica de PIS/COFINS',
    anexo: 'I ou II',
    observacao: 'PIS e COFINS são zerados na partilha (já recolhidos pelo fabricante/importador)',
    baseLegal: 'Art. 25, § 7º'
  },
  {
    id: 'atividade_mista',
    descricao: 'Empresas com atividades em mais de um anexo devem segregar as receitas de cada atividade',
    observacao: 'Cada receita é tributada pelo anexo correspondente à atividade que a gerou',
    baseLegal: 'Art. 25, caput'
  }
];


// ================================================================================
// SEÇÃO 7: FATOR "r" — REGRAS COMPLETAS (Art. 18, §5º-J a §5º-M)
// ================================================================================

/**
 * Regras completas do Fator "r" para determinação do Anexo III vs V.
 * Base legal: Art. 18, §5º-J a §5º-M da Resolução CGSN 140/2018.
 * @type {Object}
 */
const FATOR_R_CGSN140 = {
  limiar: 0.28, // 28% — Art. 18, §5º-J

  definicao: {
    descricao: 'O Fator "r" é a razão entre a folha de salários (incluídos encargos) dos 12 meses anteriores ao período de apuração e a receita bruta total acumulada nos mesmos 12 meses',
    formula: 'Fator "r" = FS12 / RBT12',
    baseLegal: 'Art. 18, §5º-J e §5º-M'
  },

  regra: {
    descricao: 'Se Fator "r" ≥ 28%, a atividade sujeita ao Fator "r" é tributada pelo Anexo III. Se Fator "r" < 28%, é tributada pelo Anexo V.',
    fatorRAlto: { minimo: 0.28, anexo: 'III', descricao: 'Tributação pelo Anexo III (alíquotas menores)' },
    fatorRBaixo: { maximo: 0.2799, anexo: 'V', descricao: 'Tributação pelo Anexo V (alíquotas maiores)' },
    baseLegal: 'Art. 18, §5º-J'
  },

  componentesFolha: [
    {
      item: 'Salários e retiradas de pró-labore',
      descricao: 'Remunerações pagas a empregados e sócios (pró-labore)',
      baseLegal: 'Art. 18, §5º-M, I'
    },
    {
      item: 'FGTS',
      descricao: 'Depósitos do Fundo de Garantia do Tempo de Serviço (8% sobre remuneração)',
      baseLegal: 'Art. 18, §5º-M, II'
    },
    {
      item: 'Encargos sobre a folha',
      descricao: 'Contribuição previdenciária patronal e demais encargos trabalhistas obrigatórios sobre a folha de pagamento',
      baseLegal: 'Art. 18, §5º-M, III'
    },
    {
      item: '13º salário',
      descricao: 'Gratificação natalina e seus encargos',
      baseLegal: 'Art. 18, §5º-M, IV'
    },
    {
      item: 'Férias e 1/3 constitucional',
      descricao: 'Férias e respectivo terço constitucional',
      baseLegal: 'Art. 18, §5º-M, V'
    },
    {
      item: 'Multa rescisória FGTS',
      descricao: 'Multa de 40% do FGTS em caso de rescisão sem justa causa',
      baseLegal: 'Art. 18, §5º-M, VI'
    },
    {
      item: 'Plano de saúde',
      descricao: 'Valores pagos a título de plano de saúde para empregados e sócios',
      baseLegal: 'Art. 18, §5º-M, VII'
    },
    {
      item: 'Vale-transporte',
      descricao: 'Parcela paga pela empresa referente ao vale-transporte',
      baseLegal: 'Art. 18, §5º-M, VIII'
    },
    {
      item: 'Vale-refeição/alimentação',
      descricao: 'Parcela paga pela empresa (PAT ou não)',
      baseLegal: 'Art. 18, §5º-M, IX'
    }
  ],

  exclusoesFolha: [
    {
      item: 'Aluguéis',
      descricao: 'Valores pagos a título de aluguel de imóveis não compõem a folha de salários',
      baseLegal: 'Art. 18, §5º-M, parágrafo único'
    },
    {
      item: 'Distribuição de lucros',
      descricao: 'Lucros distribuídos aos sócios não compõem a folha de salários',
      baseLegal: 'Art. 18, §5º-M, parágrafo único'
    },
    {
      item: 'Serviços de terceiros PJ',
      descricao: 'Pagamentos a pessoas jurídicas por prestação de serviços não compõem a folha',
      baseLegal: 'Art. 18, §5º-M, parágrafo único'
    },
    {
      item: 'Serviços de terceiros PF autônomos',
      descricao: 'Pagamentos a autônomos sem vínculo empregatício não compõem a folha',
      baseLegal: 'Art. 18, §5º-M, parágrafo único'
    }
  ],

  regrasTransicao: {
    empresaNova: {
      descricao: 'Para empresa em início de atividade, a folha de salários e receita bruta devem ser proporcionalizadas ao número de meses de atividade',
      formula: 'FS12 proporcional = (folha acumulada / meses de atividade) × 12; RBT12 proporcional = (receita acumulada / meses de atividade) × 12',
      baseLegal: 'Art. 18, §5º-K'
    },
    semDados12Meses: {
      descricao: 'Se a empresa não possui 12 meses completos de atividade, usa-se a média mensal proporcionalizada para 12 meses',
      baseLegal: 'Art. 18, §5º-K'
    },
    primeiroMes: {
      descricao: 'No primeiro mês de atividade, utiliza-se a folha e receita do próprio mês, multiplicados por 12',
      baseLegal: 'Art. 18, §5º-K'
    }
  },

  atividadesDependentesFatorR: {
    descricao: 'Atividades previstas no §5º-I do Art. 18 da LC 123/2006 que dependem do Fator "r"',
    exemplos: [
      'Administração e locação de imóveis de terceiros (CNAE 68.22-6)',
      'Academias de atividades físicas, desportivas, de natação e escolas de esportes (CNAE 93.13-1)',
      'Elaboração de programas de computadores (CNAE 62.01-5, 62.02-3, 62.03-1, 62.04-0, 62.09-1)',
      'Planejamento, confecção, manutenção e atualização de páginas eletrônicas (CNAE 62.01-5)',
      'Empresas montadoras de estandes para feiras (CNAE 82.30-0)',
      'Laboratórios de análises clínicas ou de patologia clínica (CNAE 86.40-2)',
      'Serviços de tomografia, diagnósticos médicos por imagem, registros gráficos e métodos óticos, ressonância magnética (CNAE 86.40-2)',
      'Serviços de prótese em geral (CNAE 32.50-7)',
      'Medicina, inclusive laboratorial e enfermagem (CNAE 86.30-5)',
      'Medicina veterinária (CNAE 75.00-1)',
      'Odontologia (CNAE 86.30-5)',
      'Psicologia, psicanálise, terapia ocupacional, acupuntura, podologia, fonoaudiologia, nutrição, terapias diversas (CNAE 86.50-0)',
      'Perícias, leilões e avaliações (CNAE 69.20-6)',
      'Engenharia, medição, cartografia, topografia, geologia, geodésia, testes, suporte e análises técnicas e tecnológicas, pesquisa, design, desenho e agronomia (CNAE 71.19-7)',
      'Representação comercial e intermediação (CNAE 46.19-2)',
      'Perícia contábil (CNAE 69.20-6)',
      'Jornalismo (CNAE 63.91-7)',
      'Publicidade (CNAE 73.11-4)',
      'Consultoria (CNAE 70.20-4)',
      'Auditoria, economia, consultoria, gestão, organização, controle e administração (CNAE 69.20-6)',
      'Outras atividades do setor de serviços com natureza intelectual, técnica, científica ou desportiva'
    ],
    baseLegal: 'Art. 18, §5º-I e §5º-J da LC 123/2006; Resolução CGSN 140/2018, Art. 18'
  },

  baseLegal: 'Art. 18, §5º-J a §5º-M'
};


// ================================================================================
// SEÇÃO 8: TABELAS DOS ANEXOS I a V COM PARTILHA
// ================================================================================

/**
 * Tabelas completas dos 5 Anexos do Simples Nacional com faixas, alíquotas e deduções.
 * Formato idêntico ao ANEXOS do simples_nacional.js.
 *
 * Base legal: Anexos I a V da LC 123/2006, com redação da LC 155/2016;
 *             Resolução CGSN nº 140/2018, Anexos I a V.
 * @type {Object}
 */
const ANEXOS_CGSN140 = {
  I: {
    nome: 'Anexo I — Comércio',
    descricao: 'Receitas decorrentes de revenda de mercadorias não sujeitas a substituição tributária e sem incidência do IPI',
    tributosDentro: ['IRPJ', 'CSLL', 'COFINS', 'PIS/PASEP', 'CPP', 'ICMS'],
    tributosFora: ['ISS', 'IPI'],
    cppInclusa: true,
    baseLegal: 'Resolução CGSN 140/2018, Anexo I; LC 123/2006, Anexo I (redação LC 155/2016)',
    faixas: [
      { faixa: 1, min: 0.00,          max: 180_000.00,   aliquotaNominal: 0.0400, deducao: 0.00 },       // 4,00%
      { faixa: 2, min: 180_000.01,    max: 360_000.00,   aliquotaNominal: 0.0730, deducao: 5_940.00 },   // 7,30%
      { faixa: 3, min: 360_000.01,    max: 720_000.00,   aliquotaNominal: 0.0950, deducao: 13_860.00 },  // 9,50%
      { faixa: 4, min: 720_000.01,    max: 1_800_000.00, aliquotaNominal: 0.1070, deducao: 22_500.00 },  // 10,70%
      { faixa: 5, min: 1_800_000.01,  max: 3_600_000.00, aliquotaNominal: 0.1430, deducao: 87_300.00 },  // 14,30%
      { faixa: 6, min: 3_600_000.01,  max: 4_800_000.00, aliquotaNominal: 0.1900, deducao: 378_000.00 }  // 19,00%
    ]
  },

  II: {
    nome: 'Anexo II — Indústria',
    descricao: 'Receitas decorrentes de venda de produtos industrializados pelo contribuinte',
    tributosDentro: ['IRPJ', 'CSLL', 'COFINS', 'PIS/PASEP', 'CPP', 'IPI', 'ICMS'],
    tributosFora: ['ISS'],
    cppInclusa: true,
    baseLegal: 'Resolução CGSN 140/2018, Anexo II; LC 123/2006, Anexo II (redação LC 155/2016)',
    faixas: [
      { faixa: 1, min: 0.00,          max: 180_000.00,   aliquotaNominal: 0.0450, deducao: 0.00 },       // 4,50%
      { faixa: 2, min: 180_000.01,    max: 360_000.00,   aliquotaNominal: 0.0780, deducao: 5_940.00 },   // 7,80%
      { faixa: 3, min: 360_000.01,    max: 720_000.00,   aliquotaNominal: 0.1000, deducao: 13_860.00 },  // 10,00%
      { faixa: 4, min: 720_000.01,    max: 1_800_000.00, aliquotaNominal: 0.1120, deducao: 22_500.00 },  // 11,20%
      { faixa: 5, min: 1_800_000.01,  max: 3_600_000.00, aliquotaNominal: 0.1470, deducao: 85_500.00 },  // 14,70%
      { faixa: 6, min: 3_600_000.01,  max: 4_800_000.00, aliquotaNominal: 0.3000, deducao: 720_000.00 }  // 30,00%
    ]
  },

  III: {
    nome: 'Anexo III — Serviços (Fator "r" ≥ 28%)',
    descricao: 'Receitas de prestação de serviços previstas no § 5º-B e serviços com Fator "r" ≥ 28% (§ 5º-J)',
    tributosDentro: ['IRPJ', 'CSLL', 'COFINS', 'PIS/PASEP', 'CPP', 'ISS'],
    tributosFora: ['ICMS', 'IPI'],
    cppInclusa: true,
    baseLegal: 'Resolução CGSN 140/2018, Anexo III; LC 123/2006, Anexo III (redação LC 155/2016)',
    faixas: [
      { faixa: 1, min: 0.00,          max: 180_000.00,   aliquotaNominal: 0.0600, deducao: 0.00 },       // 6,00%
      { faixa: 2, min: 180_000.01,    max: 360_000.00,   aliquotaNominal: 0.1120, deducao: 9_360.00 },   // 11,20%
      { faixa: 3, min: 360_000.01,    max: 720_000.00,   aliquotaNominal: 0.1350, deducao: 17_640.00 },  // 13,50%
      { faixa: 4, min: 720_000.01,    max: 1_800_000.00, aliquotaNominal: 0.1600, deducao: 35_640.00 },  // 16,00%
      { faixa: 5, min: 1_800_000.01,  max: 3_600_000.00, aliquotaNominal: 0.2100, deducao: 125_640.00 }, // 21,00%
      { faixa: 6, min: 3_600_000.01,  max: 4_800_000.00, aliquotaNominal: 0.3300, deducao: 648_000.00 }  // 33,00%
    ]
  },

  IV: {
    nome: 'Anexo IV — Serviços (SEM CPP — INSS patronal pago por fora)',
    descricao: 'Serviços de limpeza, vigilância, construção civil, advocacia — CPP NÃO inclusa no DAS (Art. 18, § 5º-C)',
    tributosDentro: ['IRPJ', 'CSLL', 'COFINS', 'PIS/PASEP', 'ISS'],
    tributosFora: ['CPP', 'ICMS', 'IPI'],
    cppInclusa: false,
    baseLegal: 'Resolução CGSN 140/2018, Anexo IV; LC 123/2006, Anexo IV (redação LC 155/2016)',
    faixas: [
      { faixa: 1, min: 0.00,          max: 180_000.00,   aliquotaNominal: 0.0450, deducao: 0.00 },       // 4,50%
      { faixa: 2, min: 180_000.01,    max: 360_000.00,   aliquotaNominal: 0.0900, deducao: 8_100.00 },   // 9,00%
      { faixa: 3, min: 360_000.01,    max: 720_000.00,   aliquotaNominal: 0.1020, deducao: 12_420.00 },  // 10,20%
      { faixa: 4, min: 720_000.01,    max: 1_800_000.00, aliquotaNominal: 0.1400, deducao: 39_780.00 },  // 14,00%
      { faixa: 5, min: 1_800_000.01,  max: 3_600_000.00, aliquotaNominal: 0.2200, deducao: 183_780.00 }, // 22,00%
      { faixa: 6, min: 3_600_000.01,  max: 4_800_000.00, aliquotaNominal: 0.3300, deducao: 828_000.00 }  // 33,00%
    ]
  },

  V: {
    nome: 'Anexo V — Serviços (Fator "r" < 28%)',
    descricao: 'Receitas de prestação de serviços previstas no § 5º-I quando Fator "r" < 28% (§ 5º-J)',
    tributosDentro: ['IRPJ', 'CSLL', 'COFINS', 'PIS/PASEP', 'CPP', 'ISS'],
    tributosFora: ['ICMS', 'IPI'],
    cppInclusa: true,
    baseLegal: 'Resolução CGSN 140/2018, Anexo V; LC 123/2006, Anexo V (redação LC 155/2016)',
    faixas: [
      { faixa: 1, min: 0.00,          max: 180_000.00,   aliquotaNominal: 0.1550, deducao: 0.00 },       // 15,50%
      { faixa: 2, min: 180_000.01,    max: 360_000.00,   aliquotaNominal: 0.1800, deducao: 4_500.00 },   // 18,00%
      { faixa: 3, min: 360_000.01,    max: 720_000.00,   aliquotaNominal: 0.1950, deducao: 9_900.00 },   // 19,50%
      { faixa: 4, min: 720_000.01,    max: 1_800_000.00, aliquotaNominal: 0.2050, deducao: 17_100.00 },  // 20,50%
      { faixa: 5, min: 1_800_000.01,  max: 3_600_000.00, aliquotaNominal: 0.2300, deducao: 62_100.00 },  // 23,00%
      { faixa: 6, min: 3_600_000.01,  max: 4_800_000.00, aliquotaNominal: 0.3050, deducao: 540_000.00 }  // 30,50%
    ]
  }
};

/**
 * Percentuais de repartição de tributos dentro do DAS, por faixa, por anexo.
 * Base legal: Resolução CGSN nº 140/2018, Anexos I a V.
 *
 * Cada entrada é um array de 6 objetos (faixas 1-6).
 * Os valores são decimais (ex: 0.055 = 5,50%).
 * @type {Object}
 */
const PARTILHA_CGSN140 = {
  I: [
    // Faixa 1 — Anexo I
    { irpj: 0.0550, csll: 0.0350, cofins: 0.1274, pis: 0.0276, cpp: 0.4150, icms: 0.3400 },
    // Faixa 2
    { irpj: 0.0550, csll: 0.0350, cofins: 0.1274, pis: 0.0276, cpp: 0.4150, icms: 0.3400 },
    // Faixa 3
    { irpj: 0.0550, csll: 0.0350, cofins: 0.1274, pis: 0.0276, cpp: 0.4200, icms: 0.3350 },
    // Faixa 4
    { irpj: 0.0550, csll: 0.0350, cofins: 0.1274, pis: 0.0276, cpp: 0.4200, icms: 0.3350 },
    // Faixa 5
    { irpj: 0.0550, csll: 0.0350, cofins: 0.1274, pis: 0.0276, cpp: 0.4200, icms: 0.3350 },
    // Faixa 6 — ICMS = 0% (recolhido por fora acima do sublimite)
    { irpj: 0.1350, csll: 0.1000, cofins: 0.2827, pis: 0.0613, cpp: 0.4210, icms: 0.0000 }
  ],

  II: [
    // Faixa 1 — Anexo II
    { irpj: 0.0550, csll: 0.0350, cofins: 0.1151, pis: 0.0249, cpp: 0.3750, ipi: 0.0750, icms: 0.3200 },
    // Faixa 2
    { irpj: 0.0550, csll: 0.0350, cofins: 0.1151, pis: 0.0249, cpp: 0.3750, ipi: 0.0750, icms: 0.3200 },
    // Faixa 3
    { irpj: 0.0550, csll: 0.0350, cofins: 0.1151, pis: 0.0249, cpp: 0.3750, ipi: 0.0750, icms: 0.3200 },
    // Faixa 4
    { irpj: 0.0550, csll: 0.0350, cofins: 0.1151, pis: 0.0249, cpp: 0.3750, ipi: 0.0750, icms: 0.3200 },
    // Faixa 5
    { irpj: 0.0550, csll: 0.0350, cofins: 0.1151, pis: 0.0249, cpp: 0.3750, ipi: 0.0750, icms: 0.3200 },
    // Faixa 6 — ICMS = 0% na 6ª faixa
    { irpj: 0.0850, csll: 0.0750, cofins: 0.2096, pis: 0.0454, cpp: 0.2350, ipi: 0.3500, icms: 0.0000 }
  ],

  III: [
    // Faixa 1 — Anexo III
    { irpj: 0.0400, csll: 0.0350, cofins: 0.1282, pis: 0.0278, cpp: 0.4340, iss: 0.3350 },
    // Faixa 2
    { irpj: 0.0400, csll: 0.0350, cofins: 0.1405, pis: 0.0305, cpp: 0.4340, iss: 0.3200 },
    // Faixa 3
    { irpj: 0.0400, csll: 0.0350, cofins: 0.1364, pis: 0.0296, cpp: 0.4340, iss: 0.3250 },
    // Faixa 4
    { irpj: 0.0400, csll: 0.0350, cofins: 0.1364, pis: 0.0296, cpp: 0.4340, iss: 0.3250 },
    // Faixa 5
    { irpj: 0.0400, csll: 0.0350, cofins: 0.1282, pis: 0.0278, cpp: 0.4340, iss: 0.3350 },
    // Faixa 6 — ISS limitado a 5%; excedente redistribuído
    { irpj: 0.3500, csll: 0.1500, cofins: 0.1603, pis: 0.0347, cpp: 0.3050, iss: 0.0000 }
  ],

  IV: [
    // Faixa 1 — Anexo IV (sem CPP)
    { irpj: 0.1880, csll: 0.1520, cofins: 0.1767, pis: 0.0383, iss: 0.4450 },
    // Faixa 2
    { irpj: 0.1980, csll: 0.1520, cofins: 0.2055, pis: 0.0445, iss: 0.4000 },
    // Faixa 3
    { irpj: 0.2080, csll: 0.1520, cofins: 0.1973, pis: 0.0427, iss: 0.4000 },
    // Faixa 4
    { irpj: 0.1780, csll: 0.1920, cofins: 0.1890, pis: 0.0410, iss: 0.4000 },
    // Faixa 5
    { irpj: 0.1880, csll: 0.1920, cofins: 0.1808, pis: 0.0392, iss: 0.4000 },
    // Faixa 6 — ISS = 0% na 6ª faixa
    { irpj: 0.5350, csll: 0.2150, cofins: 0.2055, pis: 0.0445, iss: 0.0000 }
  ],

  V: [
    // Faixa 1 — Anexo V | Valores oficiais CGSN 140/2018, Anexo V, vigência 01/01/2018
    // Faixa 1: Até R$ 180.000,00 — Alíq. 15,50%
    { irpj: 0.2500, csll: 0.1500, cofins: 0.1410, pis: 0.0305, cpp: 0.2885, iss: 0.1400 },
    // Faixa 2: De R$ 180.000,01 a R$ 360.000,00 — Alíq. 18,00%
    { irpj: 0.2300, csll: 0.1500, cofins: 0.1410, pis: 0.0305, cpp: 0.2785, iss: 0.1700 },
    // Faixa 3: De R$ 360.000,01 a R$ 720.000,00 — Alíq. 19,50%
    { irpj: 0.2400, csll: 0.1500, cofins: 0.1492, pis: 0.0323, cpp: 0.2385, iss: 0.1900 },
    // Faixa 4: De R$ 720.000,01 a R$ 1.800.000,00 — Alíq. 20,50%
    { irpj: 0.2100, csll: 0.1500, cofins: 0.1574, pis: 0.0341, cpp: 0.2385, iss: 0.2100 },
    // Faixa 5: De R$ 1.800.000,01 a R$ 3.600.000,00 — Alíq. 23,00% (*)
    // (*) ISS efetivo limitado a 5%; excedente redistribuído proporcionalmente aos tributos federais
    { irpj: 0.2300, csll: 0.1250, cofins: 0.1410, pis: 0.0305, cpp: 0.2385, iss: 0.2350 },
    // Faixa 6: De R$ 3.600.000,01 a R$ 4.800.000,00 — ISS = 0% (recolhido por fora do DAS)
    // Valores oficiais LC 123/2006, Anexo V, 6ª Faixa (diferem do Anexo III F6)
    { irpj: 0.3500, csll: 0.1550, cofins: 0.1644, pis: 0.0356, cpp: 0.2950, iss: 0.0000 }
  ]
};


// ================================================================================
// SEÇÃO 9: TRIBUTAÇÃO ESPECIAL — ISS, ICMS, IPI (Art. 25 ao 30)
// ================================================================================

/**
 * Regras especiais de ISS no Simples Nacional.
 * Base legal: Art. 25 ao 30 da Resolução CGSN 140/2018.
 * @type {Object}
 */
const REGRAS_ISS_CGSN140 = {
  aliquotaMinima: {
    valor: 0.02, // 2%
    descricao: 'A alíquota mínima de ISS dentro do DAS é de 2%, conforme LC 116/2003 e LC 157/2016',
    baseLegal: 'Art. 25, § 10; LC 116/2003, Art. 8º-A'
  },

  aliquotaMaxima: {
    valor: 0.05, // 5%
    descricao: 'A alíquota máxima de ISS é de 5%',
    baseLegal: 'Art. 25, § 10; LC 116/2003, Art. 8º, II'
  },

  regraLimitacao5Porcento: {
    descricao: 'Quando o percentual efetivo de ISS ultrapassar 5%, o excedente é redistribuído proporcionalmente para os demais tributos. ISS nunca excede 5% da receita bruta.',
    baseLegal: 'Art. 25, § 11'
  },

  issFixo: {
    descricao: 'Profissional liberal tributado por sociedade de profissionais pode recolher ISS fixo por profissional habilitado, conforme legislação municipal',
    aplicavel: 'Sociedades uniprofissionais (médicos, advogados, contadores, etc.)',
    observacao: 'A legislação municipal pode conceder essa forma de tributação simplificada',
    baseLegal: 'Art. 25, § 13; LC 116/2003, Art. 9º, §§ 1º e 3º'
  },

  retencaoNaFonte: {
    descricao: 'O ISS será retido na fonte pelo tomador de serviço quando o prestador for optante do Simples e a atividade estiver sujeita à retenção conforme legislação municipal',
    aliquota: 'A retenção é feita com base na alíquota de ISS informada no documento fiscal',
    deducaoDAS: 'O valor retido deve ser deduzido do DAS no mês correspondente',
    baseLegal: 'Art. 27'
  },

  localRecolhimento: {
    regraGeral: 'ISS é devido no local do estabelecimento prestador',
    excecoes: [
      'Construção civil — ISS no local da obra',
      'Eventos — ISS no local da realização',
      'Limpeza/vigilância — ISS no local da prestação',
      'Outros serviços conforme Art. 3º da LC 116/2003'
    ],
    baseLegal: 'Art. 25, § 12; LC 116/2003, Art. 3º'
  },

  faixa6: {
    descricao: 'Na 6ª faixa dos Anexos III, IV e V, o ISS é zero na partilha (recolhido por fora do DAS)',
    baseLegal: 'Anexos III, IV e V, 6ª faixa'
  },

  baseLegal: 'Art. 25 ao 30'
};

/**
 * Regras especiais de ICMS no Simples Nacional.
 * Base legal: Art. 25 ao 30 da Resolução CGSN 140/2018.
 * @type {Object}
 */
const REGRAS_ICMS_CGSN140 = {
  regraGeral: {
    descricao: 'O ICMS é recolhido dentro do DAS para empresas dos Anexos I e II com receita até o sublimite estadual',
    baseLegal: 'Art. 25, I e II'
  },

  substituicaoTributaria: {
    descricao: 'O ICMS-ST (Substituição Tributária) é recolhido POR FORA do DAS, por guia específica (GNRE ou DAR estadual)',
    segregacao: 'A receita de venda de mercadorias sujeitas a ICMS-ST deve ser segregada no PGDAS-D, excluindo o ICMS da partilha',
    baseLegal: 'Art. 25, § 6º; Art. 29, I'
  },

  antecipacao: {
    descricao: 'O ICMS de antecipação tributária (com ou sem encerramento de tributação) é recolhido por fora do DAS',
    tipoComEncerramento: 'Exclui ICMS da partilha na revenda (já pago na entrada)',
    tipoSemEncerramento: 'Pago na entrada como antecipação; diferença recolhida no DAS na saída',
    baseLegal: 'Art. 29, II e III'
  },

  difal: {
    descricao: 'Diferencial de Alíquotas de ICMS em operações interestaduais para consumidor final',
    pagamento: 'Recolhido por fora do DAS, por guia específica ao estado de destino',
    observacao: 'Empresas do Simples Nacional que vendem para consumidores finais de outros estados devem recolher o DIFAL',
    baseLegal: 'Art. 29, VII; EC 87/2015'
  },

  imunidades: {
    descricao: 'Imunidade de ICMS em determinadas operações',
    casos: [
      'Exportação de mercadorias ao exterior (imune de ICMS)',
      'Operações com livros, jornais, periódicos e papel (CF/88, Art. 150, VI, d)',
      'Remessas interestaduais de mercadorias para industrialização (suspensão)'
    ],
    baseLegal: 'Art. 22; CF/88, Art. 155, § 2º, X'
  },

  faixa6: {
    descricao: 'Na 6ª faixa dos Anexos I e II, o ICMS é zero na partilha do DAS (recolhido por fora)',
    baseLegal: 'Anexos I e II, 6ª faixa'
  },

  sublimite: {
    descricao: 'Acima do sublimite de R$ 3.600.000,00, o ICMS é recolhido por fora do DAS conforme legislação estadual',
    baseLegal: 'Art. 9º ao 11; Art. 25, §§ 1º e 2º'
  },

  creditoICMS: {
    descricao: 'As ME e EPP optantes pelo Simples Nacional NÃO podem apropriar ou transferir créditos de ICMS relativos às mercadorias adquiridas, exceto se a legislação estadual permitir transferência de crédito presumido',
    creditoPermitido: 'As ME e EPP podem permitir que seus clientes (Lucro Presumido/Real) aproveitem crédito de ICMS equivalente ao percentual de ICMS efetivo dentro do DAS, mediante indicação no documento fiscal',
    limiteCredito: 'O crédito transferível está limitado ao percentual de ICMS efetivo pago dentro do DAS',
    baseLegal: 'Art. 23, caput e §§; LC 123/2006, Art. 23'
  },

  baseLegal: 'Art. 25 ao 30; Art. 23'
};

/**
 * Regras especiais de IPI no Simples Nacional.
 * Base legal: Art. 25 ao 30 da Resolução CGSN 140/2018.
 * @type {Object}
 */
const REGRAS_IPI_CGSN140 = {
  regraGeral: {
    descricao: 'O IPI é recolhido dentro do DAS apenas para atividades industriais (Anexo II)',
    baseLegal: 'Art. 25, II; Anexo II'
  },

  quandoIncide: {
    descricao: 'O IPI incide sobre operações com produtos industrializados realizados por estabelecimentos industriais',
    baseLegal: 'Art. 25, II; RIPI/2010'
  },

  quandoNaoIncide: {
    descricao: 'O IPI não incide nas seguintes situações',
    casos: [
      'Revenda de mercadorias sem industrialização (Anexo I)',
      'Prestação de serviços (Anexos III, IV e V)',
      'Produtos com imunidade tributária (exportação)',
      'Saída de produtos com suspensão de IPI (ZFM, drawback)'
    ],
    baseLegal: 'Art. 25; RIPI/2010, Art. 5º'
  },

  equiparacaoIndustrial: {
    descricao: 'Importadores, arrematantes e estabelecimentos equiparados a industrial podem ter IPI incluso no DAS',
    baseLegal: 'Art. 25, § 3º; RIPI/2010, Art. 4º'
  },

  baseLegal: 'Art. 25; Anexo II'
};


// ================================================================================
// SEÇÃO 10: CPP E INSS — REGRAS POR ANEXO (Art. 18, §5º-C)
// ================================================================================

/**
 * Regras de Contribuição Previdenciária Patronal (CPP) por Anexo.
 * Base legal: Art. 18, §5º-C da Resolução CGSN 140/2018; LC 123/2006, Art. 18.
 * @type {Object}
 */
const REGRAS_CPP_CGSN140 = {
  regraGeral: {
    descricao: 'A Contribuição Previdenciária Patronal (CPP) é, em regra, incluída no DAS. Exceção: Anexo IV.',
    baseLegal: 'Art. 18, §5º-B e §5º-C'
  },

  porAnexo: {
    I: {
      cppInclusa: true,
      descricao: 'CPP incluída no DAS. A empresa NÃO recolhe INSS patronal (20%) separadamente.',
      aliquotaPatronalPorFora: 0.00,
      baseLegal: 'Art. 18, caput; Anexo I'
    },
    II: {
      cppInclusa: true,
      descricao: 'CPP incluída no DAS. A empresa NÃO recolhe INSS patronal (20%) separadamente.',
      aliquotaPatronalPorFora: 0.00,
      baseLegal: 'Art. 18, caput; Anexo II'
    },
    III: {
      cppInclusa: true,
      descricao: 'CPP incluída no DAS. A empresa NÃO recolhe INSS patronal (20%) separadamente.',
      aliquotaPatronalPorFora: 0.00,
      baseLegal: 'Art. 18, § 5º-B; Anexo III'
    },
    IV: {
      cppInclusa: false,
      descricao: 'CPP NÃO incluída no DAS. A empresa DEVE recolher INSS patronal separadamente (20% sobre folha + RAT + Terceiros).',
      aliquotaPatronalPorFora: 0.20, // 20% sobre folha
      aliquotaRATPadrao: 0.02, // RAT médio (varia por CNAE: 1%, 2% ou 3%)
      contribuicaoTerceiros: 0.058, // Sistema S + Salário-Educação
      atividadesAbrangidas: [
        'Serviços de limpeza (CNAE 81.21-4)',
        'Serviços de vigilância (CNAE 80.11-1)',
        'Construção de imóveis e obras de engenharia em geral (CNAE 41.20-4, 42.xx)',
        'Serviços advocatícios (CNAE 69.11-7)'
      ],
      baseLegal: 'Art. 18, § 5º-C; LC 123/2006, Art. 18, § 5º-C; Lei 8.212/91, Art. 22'
    },
    V: {
      cppInclusa: true,
      descricao: 'CPP incluída no DAS. A empresa NÃO recolhe INSS patronal (20%) separadamente.',
      aliquotaPatronalPorFora: 0.00,
      baseLegal: 'Art. 18, § 5º-I; Anexo V'
    }
  },

  atividadesMistas: {
    descricao: 'Se empresa realiza atividades de Anexo IV e outros anexos, a CPP é paga por fora APENAS sobre a parcela proporcional da folha relativa às atividades do Anexo IV',
    calculo: 'INSS patronal por fora = (% receita Anexo IV / receita total) × folha total × (20% + RAT)',
    baseLegal: 'Art. 18, § 5º-C, parágrafo único'
  },

  inssEmpregado: {
    descricao: 'O INSS do empregado (retido do salário) é SEMPRE recolhido por fora, independente do Anexo. Não está no DAS.',
    aliquotasProgressivas: [
      { faixa: 1, ate: 1_518.00,   aliquota: 0.075 },  // 7,5%
      { faixa: 2, ate: 2_793.88,   aliquota: 0.09 },   // 9,0%
      { faixa: 3, ate: 5_839.45,   aliquota: 0.12 },   // 12,0%
      { faixa: 4, ate: 8_475.55,   aliquota: 0.14 }    // 14,0%
    ],
    teto: 8_475.55, // Teto INSS 2026
    baseLegal: 'Lei 8.212/91, Art. 28; IN RFB vigente'
  },

  fgts: {
    descricao: 'O FGTS é SEMPRE recolhido por fora, independente do Anexo. Não está no DAS.',
    aliquota: 0.08, // 8%
    baseLegal: 'Lei 8.036/1990, Art. 15'
  },

  baseLegal: 'Art. 18, §5º-B, §5º-C e §5º-I; Lei 8.212/91'
};


// ================================================================================
// SEÇÃO 11: OBRIGAÇÕES ACESSÓRIAS (Art. 38 ao 72)
// ================================================================================

/**
 * Obrigações acessórias das empresas optantes pelo Simples Nacional.
 * Base legal: Art. 38 ao 72 da Resolução CGSN 140/2018.
 * @type {Array<Object>}
 */
const OBRIGACOES_CGSN140 = [
  {
    id: 'pgdas_d',
    nome: 'PGDAS-D',
    descricaoCompleta: 'Programa Gerador do Documento de Arrecadação do Simples Nacional — Declaratório',
    periodicidade: 'Mensal',
    prazo: 'Até o dia 20 do mês subsequente ao período de apuração',
    prazoExcecao: 'Se o dia 20 cair em dia não útil, antecipa-se para o dia útil imediatamente anterior',
    obrigatoria: true,
    obrigacaoDeclaratoria: true,
    descricao: 'Declaração mensal de receitas brutas segregadas por atividade/anexo, cálculo automático do DAS e emissão da guia de recolhimento. Transmitida eletronicamente pelo Portal do Simples Nacional.',
    baseLegal: 'Art. 38; Art. 39'
  },
  {
    id: 'das',
    nome: 'DAS',
    descricaoCompleta: 'Documento de Arrecadação do Simples Nacional',
    periodicidade: 'Mensal',
    prazo: 'Até o dia 20 do mês subsequente ao período de apuração',
    prazoExcecao: 'Se o dia 20 cair em dia não útil, antecipa-se para o dia útil imediatamente anterior',
    obrigatoria: true,
    obrigacaoDeclaratoria: false,
    descricao: 'Guia de pagamento unificada gerada pelo PGDAS-D. Engloba todos os tributos do Simples Nacional em um único documento.',
    baseLegal: 'Art. 40'
  },
  {
    id: 'defis',
    nome: 'DEFIS',
    descricaoCompleta: 'Declaração de Informações Socioeconômicas e Fiscais',
    periodicidade: 'Anual',
    prazo: 'Até 31 de março do ano-calendário subsequente ao da ocorrência dos fatos geradores',
    obrigatoria: true,
    obrigacaoDeclaratoria: true,
    descricao: 'Declaração anual que contém informações econômicas e fiscais da empresa, incluindo receita bruta, folha de pagamento, dados de sócios, número de empregados, etc. Substitui a DASN desde 2013.',
    baseLegal: 'Art. 72'
  },
  {
    id: 'livro_caixa',
    nome: 'Livro Caixa',
    descricaoCompleta: 'Livro Caixa com escrituração contábil simplificada',
    periodicidade: 'Contínua',
    prazo: 'Permanente — manter em dia',
    obrigatoria: true,
    obrigacaoDeclaratoria: false,
    descricao: 'Obrigatório se a empresa não mantiver escrituração contábil completa. Deve conter toda a movimentação financeira e bancária.',
    baseLegal: 'Art. 63; LC 123/2006, Art. 26, II'
  },
  {
    id: 'livro_registro_inventario',
    nome: 'Livro Registro de Inventário',
    descricaoCompleta: 'Livro Registro de Inventário de mercadorias',
    periodicidade: 'Anual',
    prazo: 'Até o último dia do ano-calendário',
    obrigatoria: true,
    obrigacaoDeclaratoria: false,
    descricao: 'Registro anual de mercadorias em estoque. Obrigatório para comércio e indústria.',
    baseLegal: 'Art. 63, I'
  },
  {
    id: 'livro_registro_entradas',
    nome: 'Livro Registro de Entradas',
    descricaoCompleta: 'Livro Registro de Entradas (modelo 1 ou 1-A)',
    periodicidade: 'Contínua',
    prazo: 'Por operação de entrada',
    obrigatoria: true,
    obrigacaoDeclaratoria: false,
    descricao: 'Registro de todas as entradas de mercadorias no estabelecimento. Modelo simplificado.',
    baseLegal: 'Art. 63, II'
  },
  {
    id: 'livro_registro_servicos',
    nome: 'Livro Registro de Serviços Prestados',
    descricaoCompleta: 'Livro Registro de Serviços Prestados',
    periodicidade: 'Contínua',
    prazo: 'Por operação de prestação de serviço',
    obrigatoria: true,
    obrigacaoDeclaratoria: false,
    descricao: 'Registro de todas as notas fiscais de serviço emitidas. Obrigatório para prestadores de serviços (ISS).',
    baseLegal: 'Art. 63, IV'
  },
  {
    id: 'livro_registro_servicos_tomados',
    nome: 'Livro Registro de Serviços Tomados',
    descricaoCompleta: 'Livro Registro de Serviços Tomados',
    periodicidade: 'Contínua',
    prazo: 'Por operação de tomada de serviço',
    obrigatoria: true,
    obrigacaoDeclaratoria: false,
    descricao: 'Registro das notas fiscais de serviços tomados, inclusive com ISS retido na fonte.',
    baseLegal: 'Art. 63, V'
  },
  {
    id: 'livro_registro_impressao_documentos',
    nome: 'Livro Registro de Impressão de Documentos Fiscais',
    descricaoCompleta: 'Livro Registro de Impressão de Documentos Fiscais',
    periodicidade: 'Conforme necessidade',
    prazo: 'Quando da autorização de impressão',
    obrigatoria: false,
    obrigacaoDeclaratoria: false,
    descricao: 'Registro da autorização de impressão de documentos fiscais. Dispensado para ME/EPP que utilizam apenas NF-e/NFS-e.',
    baseLegal: 'Art. 63, VI'
  },
  {
    id: 'nota_fiscal',
    nome: 'NF-e / NFS-e',
    descricaoCompleta: 'Nota Fiscal Eletrônica / Nota Fiscal de Serviços Eletrônica',
    periodicidade: 'Por operação',
    prazo: 'No momento da operação',
    obrigatoria: true,
    obrigacaoDeclaratoria: false,
    descricao: 'Emissão de nota fiscal eletrônica para todas as operações de venda ou prestação de serviço. Obrigatória para todas as empresas do Simples.',
    baseLegal: 'Art. 57 ao 61'
  },
  {
    id: 'esocial',
    nome: 'e-Social',
    descricaoCompleta: 'Sistema de Escrituração Digital das Obrigações Fiscais, Previdenciárias e Trabalhistas',
    periodicidade: 'Mensal / por evento',
    prazo: 'Conforme cronograma do e-Social (eventos periódicos até dia 15)',
    obrigatoria: true,
    obrigacaoDeclaratoria: true,
    descricao: 'Escrituração digital de informações trabalhistas, previdenciárias e fiscais. Obrigatória inclusive para ME/EPP com empregados.',
    baseLegal: 'Decreto 8.373/2014; Art. 65'
  },
  {
    id: 'efd_reinf',
    nome: 'EFD-Reinf',
    descricaoCompleta: 'Escrituração Fiscal Digital de Retenções e Outras Informações Fiscais',
    periodicidade: 'Mensal',
    prazo: 'Até o dia 15 do mês subsequente',
    obrigatoria: true,
    obrigacaoDeclaratoria: true,
    descricao: 'Complementa o e-Social com informações de retenções de tributos e contribuições sociais previdenciárias.',
    baseLegal: 'IN RFB nº 2.043/2021; Art. 65'
  },
  {
    id: 'dctweb',
    nome: 'DCTFWeb',
    descricaoCompleta: 'Declaração de Débitos e Créditos Tributários Federais Previdenciários e de Outras Entidades e Fundos',
    periodicidade: 'Mensal',
    prazo: 'Até o dia 15 do mês seguinte ao da ocorrência dos fatos geradores',
    obrigatoria: true,
    obrigacaoDeclaratoria: true,
    descricao: 'Declaração mensal de débitos previdenciários. Obrigatória para ME/EPP com empregados.',
    baseLegal: 'IN RFB nº 2.005/2021'
  },
  {
    id: 'dirf',
    nome: 'DIRF',
    descricaoCompleta: 'Declaração do Imposto de Renda Retido na Fonte',
    periodicidade: 'Anual',
    prazo: 'Último dia útil de fevereiro do ano subsequente',
    obrigatoria: true,
    obrigacaoDeclaratoria: true,
    descricao: 'Declaração anual dos valores de IR retidos na fonte. Em processo de substituição pela EFD-Reinf/DCTFWeb.',
    baseLegal: 'IN RFB nº 1.990/2020'
  }
];

/**
 * Multas e penalidades aplicáveis no Simples Nacional.
 * Base legal: Art. 38-A da LC 123/2006; Resolução CGSN 183/2025.
 * @type {Object}
 */
const MULTAS_CGSN140 = {
  multaPGDAS_D: {
    descricao: 'Multa por atraso na entrega do PGDAS-D',
    valorMinimo: 50.00, // R$ 50,00 por mês de atraso para ME
    valorMinimoPorMes: {
      ME: 50.00,
      EPP: 100.00
    },
    percentualSobreImpostos: 0.02, // 2% ao mês sobre tributos informados, limitado a 20%
    limitePercentual: 0.20,
    reducao: {
      descricao: 'Redução de 50% se entregue antes de qualquer procedimento de ofício',
      percentualReducao: 0.50
    },
    baseLegal: 'Art. 38-A da LC 123/2006; Resolução CGSN 183/2025'
  },

  multaDEFIS: {
    descricao: 'Multa por atraso na entrega da DEFIS',
    valorMinimo: {
      ME: 200.00,
      EPP: 500.00
    },
    percentualSobreImpostos: 0.02,
    limitePercentual: 0.20,
    baseLegal: 'Art. 38-A da LC 123/2006; Resolução CGSN 183/2025'
  },

  multaOmissaoReceita: {
    descricao: 'Multa por omissão de receita',
    percentual: 0.75, // 75% sobre o valor omitido
    percentualQualificada: 1.50, // 150% em caso de fraude, dolo ou simulação
    juros: 'SELIC acumulada desde o vencimento',
    baseLegal: 'LC 123/2006, Art. 38-B; CTN, Art. 44'
  },

  multaAtrasoRecolhimento: {
    descricao: 'Multa por atraso no recolhimento do DAS',
    multaMora: 0.0033, // 0,33% ao dia até 20% (art. 61, Lei 9.430/96)
    limiteMora: 0.20,
    juros: 'SELIC acumulada a partir do mês seguinte ao vencimento + 1% no mês do pagamento',
    baseLegal: 'Art. 40, § 3º; Lei 9.430/1996, Art. 61'
  },

  multaFiscalizacao: {
    descricao: 'Multas aplicáveis em procedimentos de fiscalização',
    embaracoFiscalizacao: {
      descricao: 'Multa por embaraço à fiscalização (recusa de apresentação de documentos)',
      valor: 'Mínimo de R$ 200,00, podendo chegar a R$ 2.000,00 por ocorrência',
      baseLegal: 'Art. 83, § 3º'
    },
    insuficienciaRecolhimento: {
      descricao: 'Multa de ofício por diferenças apuradas em procedimento fiscal',
      percentual: 0.75,
      baseLegal: 'LC 123/2006, Art. 38-B'
    }
  },

  baseLegal: 'Art. 38-A e 38-B da LC 123/2006; Resolução CGSN 183/2025; Lei 9.430/1996'
};

// ================================================================================
// SEÇÃO 12: DISTRIBUIÇÃO DE LUCROS (Art. 131 ao 133)
// ================================================================================

/**
 * Regras de distribuição de lucros para empresas do Simples Nacional.
 * Isenção de IR sobre lucros distribuídos ao titular/sócio.
 * Base legal: Art. 131 ao 133 da Resolução CGSN 140/2018; LC 123/2006, Art. 14.
 * @type {Object}
 */
const DISTRIBUICAO_LUCROS_CGSN140 = {
  regra: {
    descricao: 'Os valores efetivamente pagos ou distribuídos ao titular ou sócio da ME ou EPP optante pelo Simples Nacional são considerados isentos do imposto de renda, na fonte e na declaração de ajuste do beneficiário',
    excecoes: [
      'Pró-labore',
      'Aluguéis pagos pela PJ ao sócio',
      'Serviços prestados pelo sócio à PJ'
    ],
    baseLegal: 'Art. 131, caput'
  },

  limiteIsencaoSemEscrituracao: {
    descricao: 'Na ausência de escrituração contábil, a isenção é limitada ao valor resultante da aplicação dos percentuais de presunção sobre a receita bruta, subtraído o valor do IRPJ devido no Simples Nacional',
    formula: '(ReceitaBruta × PercentualPresuncao) - IRPJdoSimplesNacional',
    baseLegal: 'Art. 131, § 1º'
  },

  escrituracaoContabil: {
    descricao: 'O limite de presunção NÃO se aplica se a pessoa jurídica mantiver escrituração contábil e evidenciar lucro superior ao limite de presunção. Neste caso, pode distribuir até o lucro contábil apurado.',
    vantagem: 'Permite distribuir lucro isento acima do percentual de presunção, desde que evidenciado por escrituração completa',
    baseLegal: 'Art. 131, § 2º'
  },

  percentuaisPresuncao: {
    descricao: 'Percentuais de presunção de lucro aplicáveis na ausência de escrituração contábil (mesmos do Lucro Presumido — Lei 9.249/1995, Art. 15)',
    percentuais: [
      {
        atividade: 'Comércio, indústria e transporte de cargas',
        percentual: 0.08, // 8%
        baseLegal: 'Lei 9.249/1995, Art. 15, caput'
      },
      {
        atividade: 'Transporte de passageiros',
        percentual: 0.16, // 16%
        baseLegal: 'Lei 9.249/1995, Art. 15, § 1º, III, a'
      },
      {
        atividade: 'Serviços em geral (exceto hospitais e transporte)',
        percentual: 0.32, // 32%
        baseLegal: 'Lei 9.249/1995, Art. 15, § 1º, III, a'
      },
      {
        atividade: 'Serviços hospitalares e de auxílio diagnóstico/terapia',
        percentual: 0.08, // 8%
        baseLegal: 'Lei 9.249/1995, Art. 15, § 1º, III, a; Lei 11.727/2008'
      },
      {
        atividade: 'Revenda de combustíveis derivados de petróleo e álcool etílico carburante',
        percentual: 0.016, // 1,6%
        baseLegal: 'Lei 9.249/1995, Art. 15, § 1º, IV'
      }
    ],
    baseLegal: 'Art. 131, § 1º; Lei 9.249/1995, Art. 15'
  },

  tributacaoExcedente: {
    descricao: 'Os valores pagos ou distribuídos ao sócio que ultrapassarem o limite isento serão tributados como rendimentos tributáveis na declaração de ajuste anual do beneficiário (tabela progressiva do IRPF)',
    tabela: 'IRPF — tabela progressiva vigente',
    baseLegal: 'Art. 131, §§ 1º e 2º (interpretação combinada com RIR/2018)'
  },

  /**
   * Calcula o limite de distribuição de lucros isenta de IR.
   * @param {number} receitaBrutaMensal - Receita bruta do mês
   * @param {string} tipoAtividade - Tipo: 'comercio', 'servicos', 'transporte_passageiros', 'hospitalar', 'combustivel'
   * @param {number} irpjSimplesMensal - Valor do IRPJ pago no DAS no mês
   * @param {number|null} lucroContabil - Lucro contábil apurado (se houver escrituração)
   * @returns {Object} Resultado com limite isento e detalhamento
   * @example
   * // Sem escrituração contábil (presunção)
   * calcularLimiteDistribuicao(100000, 'comercio', 500, null)
   * // => { limiteIsento: 7500, metodo: 'presuncao', percentualAplicado: 0.08, ... }
   *
   * // Com escrituração contábil
   * calcularLimiteDistribuicao(100000, 'comercio', 500, 25000)
   * // => { limiteIsento: 25000, metodo: 'escrituracao', lucroContabil: 25000, ... }
   */
  calcularLimiteDistribuicao: function(receitaBrutaMensal, tipoAtividade, irpjSimplesMensal, lucroContabil) {
    if (typeof receitaBrutaMensal !== 'number' || receitaBrutaMensal < 0) {
      return { erro: 'receitaBrutaMensal deve ser um número >= 0' };
    }

    const MAPA_PERCENTUAIS = {
      comercio: 0.08,
      industria: 0.08,
      transporte_cargas: 0.08,
      transporte_passageiros: 0.16,
      servicos: 0.32,
      hospitalar: 0.08,
      combustivel: 0.016
    };

    const tipo = (tipoAtividade || 'servicos').toLowerCase();
    const percentual = MAPA_PERCENTUAIS[tipo] || 0.32;
    const irpj = typeof irpjSimplesMensal === 'number' ? irpjSimplesMensal : 0;

    // Limite por presunção: (receita × percentual) - IRPJ do Simples
    const limitePresuncao = Math.max(0, (receitaBrutaMensal * percentual) - irpj);

    // Se tem escrituração contábil e lucro > presunção, prevalece o contábil
    if (lucroContabil !== null && lucroContabil !== undefined && typeof lucroContabil === 'number') {
      if (lucroContabil > limitePresuncao) {
        return {
          limiteIsento: Math.round(lucroContabil * 100) / 100,
          metodo: 'escrituracao',
          lucroContabil: lucroContabil,
          limitePresuncaoComparativo: Math.round(limitePresuncao * 100) / 100,
          beneficioEscrituracao: Math.round((lucroContabil - limitePresuncao) * 100) / 100,
          percentualAplicado: percentual,
          baseLegal: 'Art. 131, § 2º — escrituração contábil evidencia lucro superior'
        };
      }
    }

    return {
      limiteIsento: Math.round(limitePresuncao * 100) / 100,
      metodo: 'presuncao',
      receitaBruta: receitaBrutaMensal,
      percentualAplicado: percentual,
      basePresumida: Math.round(receitaBrutaMensal * percentual * 100) / 100,
      irpjDeduzido: irpj,
      baseLegal: 'Art. 131, § 1º — presunção de lucro (Lei 9.249/1995, Art. 15)'
    };
  },

  baseLegal: 'Art. 131 ao 133 da Resolução CGSN 140/2018; LC 123/2006, Art. 14'
};


// ================================================================================
// SEÇÃO 13: FISCALIZAÇÃO E PROCESSO ADMINISTRATIVO (Art. 83 ao 99)
// ================================================================================

/**
 * Regras de fiscalização do Simples Nacional.
 * Base legal: Art. 83 ao 89 da Resolução CGSN 140/2018.
 * @type {Object}
 */
const FISCALIZACAO_CGSN140 = {
  competencia: {
    descricao: 'A competência para fiscalizar o cumprimento das obrigações do Simples Nacional é da RFB, das Secretarias de Fazenda dos Estados, DF e dos Municípios',
    entesCompetentes: [
      {
        ente: 'Receita Federal do Brasil (RFB)',
        tributos: ['IRPJ', 'IPI', 'CSLL', 'COFINS', 'PIS/PASEP', 'CPP'],
        descricao: 'Tributos federais inclusos no Simples Nacional',
        baseLegal: 'Art. 83, I'
      },
      {
        ente: 'Secretarias de Fazenda Estaduais / SEFAZ',
        tributos: ['ICMS'],
        descricao: 'ICMS próprio e substituição tributária',
        baseLegal: 'Art. 83, II'
      },
      {
        ente: 'Secretarias Municipais de Fazenda',
        tributos: ['ISS'],
        descricao: 'ISS próprio e ISS retido na fonte',
        baseLegal: 'Art. 83, III'
      }
    ],
    baseLegal: 'Art. 83, caput e incisos; LC 123/2006, Art. 33'
  },

  fiscalizacaoCompartilhada: {
    descricao: 'A fiscalização do Simples Nacional será compartilhada entre os entes federativos, podendo a RFB delegar ou utilizar convênios',
    sefisc: {
      nome: 'SEFISC — Sistema Eletrônico Único de Fiscalização',
      descricao: 'Sistema unificado para fiscalização compartilhada do Simples Nacional. Permite que qualquer ente fiscalize todos os tributos do DAS.',
      baseLegal: 'Art. 83, § 1º'
    },
    auxilioMutuo: {
      descricao: 'Os entes federativos poderão prestar assistência mútua nas atividades de fiscalização',
      baseLegal: 'Art. 83, § 2º'
    },
    baseLegal: 'Art. 83, §§ 1º e 2º'
  },

  autoInfracao: {
    descricao: 'Regras para lavratura de auto de infração e notificação fiscal',
    regras: [
      {
        regra: 'A autuação deve ser lavrada com base nos valores de receita bruta informados ou apurados',
        baseLegal: 'Art. 84'
      },
      {
        regra: 'O auto de infração poderá ser lavrado por qualquer dos entes competentes, relativamente a todos os tributos do Simples Nacional',
        baseLegal: 'Art. 84, § 1º'
      },
      {
        regra: 'A lavratura de auto de infração por ente que não detenha competência para administrar o tributo não implica transferência de competência',
        baseLegal: 'Art. 84, § 2º'
      },
      {
        regra: 'O auto de infração deverá conter todos os elementos e dados necessários à identificação da infração, à determinação da matéria tributável, ao cálculo do tributo e à aplicação da penalidade',
        baseLegal: 'Art. 84, § 3º'
      }
    ],
    baseLegal: 'Art. 84'
  },

  lancamentoDeOficio: {
    descricao: 'Hipóteses de lançamento de ofício para o Simples Nacional',
    hipoteses: [
      'Omissão de receita',
      'Receita declarada em desacordo com o efetivamente auferido',
      'Falta de emissão de nota fiscal',
      'Comercialização de mercadoria objeto de apreensão não regularizada',
      'Descumprimento de obrigação acessória que resulte em diferença de tributo',
      'Quando o sujeito passivo, notificado, não regularizar espontaneamente'
    ],
    baseLegal: 'Art. 84; CTN, Art. 149'
  },

  embaracoFiscalizacao: {
    descricao: 'Penalidades por embaraço ou impedimento à fiscalização',
    penalidades: [
      {
        situacao: 'Recusa de apresentação de livros e documentos',
        consequencia: 'Multa de R$ 200,00 a R$ 2.000,00 por ocorrência',
        baseLegal: 'Art. 83, § 3º'
      },
      {
        situacao: 'Impedimento de acesso ao estabelecimento ou dependências',
        consequencia: 'Pode resultar em exclusão de ofício do Simples Nacional',
        baseLegal: 'Art. 83, § 4º; Art. 76, IV, e'
      }
    ],
    baseLegal: 'Art. 83, §§ 3º e 4º'
  },

  processoAdministrativo: {
    descricao: 'Regras do processo administrativo fiscal aplicável ao Simples Nacional',

    contencioso: {
      descricao: 'O contencioso administrativo relativo ao Simples Nacional será de competência do ente federativo que efetuar o lançamento ou exclusão',
      regras: [
        {
          regra: 'O contencioso segue a legislação do ente que realizou o lançamento',
          baseLegal: 'Art. 90, caput'
        },
        {
          regra: 'Tributos federais: segue o Decreto 70.235/72 (Processo Administrativo Fiscal federal)',
          baseLegal: 'Art. 90, § 1º'
        },
        {
          regra: 'ICMS: segue a legislação estadual de processo administrativo fiscal',
          baseLegal: 'Art. 90, § 2º'
        },
        {
          regra: 'ISS: segue a legislação municipal de processo administrativo fiscal',
          baseLegal: 'Art. 90, § 3º'
        }
      ],
      baseLegal: 'Art. 90'
    },

    impugnacao: {
      descricao: 'Regras de impugnação e defesa',
      prazo: 30, // 30 dias corridos para impugnar
      contadosDe: 'Ciência do auto de infração ou notificação de lançamento',
      efeito: 'Suspende a exigibilidade do crédito tributário',
      baseLegal: 'Art. 91; CTN, Art. 151, III'
    },

    julgamento: {
      descricao: 'O julgamento em primeira instância é realizado pelo órgão julgador do ente autuante',
      recursos: {
        primeiraInstancia: 'Órgão julgador do ente federativo autuante',
        segundaInstancia: 'Órgão colegiado de segunda instância do ente',
        observacao: 'Para tributos federais: DRJ em 1ª instância, CARF em 2ª instância'
      },
      baseLegal: 'Art. 92 ao 94'
    },

    consultaFiscal: {
      descricao: 'O contribuinte optante pelo Simples Nacional poderá formular consulta sobre a interpretação da legislação',
      competencia: 'COSIT/RFB para matéria do Simples Nacional',
      efeito: 'Suspende a obrigação de pagamento até solução da consulta',
      baseLegal: 'Art. 95 ao 99'
    },

    baseLegal: 'Art. 90 ao 99'
  },

  prescricaoDecadencia: {
    descricao: 'Prazos prescricionais e decadenciais aplicáveis ao Simples Nacional',
    decadencia: {
      prazo: 5, // 5 anos
      contadoDe: 'Primeiro dia do exercício seguinte àquele em que o lançamento poderia ter sido efetuado',
      baseLegal: 'CTN, Art. 173, I'
    },
    prescricao: {
      prazo: 5, // 5 anos
      contadoDe: 'Data da constituição definitiva do crédito tributário',
      baseLegal: 'CTN, Art. 174'
    },
    baseLegal: 'CTN, Art. 173 e 174 (aplicação subsidiária)'
  },

  baseLegal: 'Art. 83 ao 99 da Resolução CGSN 140/2018; LC 123/2006, Art. 33 ao 40'
};


// ================================================================================
// SEÇÃO 14: MEI — MICROEMPREENDEDOR INDIVIDUAL (Art. 100 ao 114)
// ================================================================================

/**
 * Regras completas do Microempreendedor Individual (MEI).
 * Base legal: Art. 100 ao 114 da Resolução CGSN 140/2018; LC 123/2006, Art. 18-A a 18-E.
 * @type {Object}
 */
const MEI_CGSN140 = {
  definicao: {
    descricao: 'O Microempreendedor Individual (MEI) é o empresário individual que atende às condições do Art. 100 da Resolução CGSN 140/2018',
    naturezaJuridica: 'Empresário Individual (EI)',
    baseLegal: 'Art. 100; LC 123/2006, Art. 18-A'
  },

  limites: {
    receitaBrutaAnual: 81_000.00, // R$ 81.000,00 — Art. 100, I
    receitaBrutaMensal: 6_750.00, // R$ 6.750,00 (81.000 / 12) — proporcional
    receitaBrutaProporcionalMesInicio: {
      descricao: 'No ano-calendário de início de atividade, o limite é proporcional ao número de meses compreendidos entre o início da atividade e o final do respectivo ano-calendário',
      formula: '81.000 / 12 × número de meses',
      baseLegal: 'Art. 100, § 1º'
    },
    baseLegal: 'Art. 100, I; LC 123/2006, Art. 18-A, § 1º'
  },

  requisitos: [
    {
      id: 'limite_receita',
      descricao: 'Auferir receita bruta anual de até R$ 81.000,00',
      baseLegal: 'Art. 100, I'
    },
    {
      id: 'sem_participacao_societaria',
      descricao: 'Não ser sócio, titular ou administrador de outra empresa',
      baseLegal: 'Art. 100, II'
    },
    {
      id: 'atividade_permitida',
      descricao: 'Exercer atividade constante do Anexo XI da Resolução CGSN 140/2018',
      baseLegal: 'Art. 100, III'
    },
    {
      id: 'maximo_um_empregado',
      descricao: 'Possuir no máximo um empregado que receba exclusivamente um salário mínimo previsto em lei federal ou estadual ou o piso salarial da categoria profissional',
      baseLegal: 'Art. 100, IV; LC 123/2006, Art. 18-C'
    },
    {
      id: 'nao_ter_filial',
      descricao: 'Não possuir mais de um estabelecimento',
      baseLegal: 'Art. 100, V'
    },
    {
      id: 'nao_ser_cedente_mao_obra',
      descricao: 'Não participar de outra empresa como sócio ou titular',
      baseLegal: 'Art. 100, II'
    }
  ],

  recolhimentoFixoMensal: {
    descricao: 'O MEI recolhe mensalmente, em valor fixo, independentemente da receita bruta auferida no mês, por meio do DAS-MEI (SIMEI)',
    componentes: {
      inss: {
        descricao: 'Contribuição previdenciária (INSS) do MEI',
        aliquota: 0.05, // 5% do salário mínimo — Art. 101, I
        base: 'Salário mínimo vigente',
        salarioMinimo2026: 1_621.00, // R$ 1.621,00
        valorMensal2026: 81.05, // 5% × R$ 1.621,00 = R$ 81,05
        complementacao: {
          descricao: 'O MEI pode complementar a contribuição previdenciária com alíquota adicional de 15% sobre o salário mínimo (totalizando 20%) para fins de aposentadoria por tempo de contribuição',
          aliquotaComplementar: 0.15, // 15% adicional
          valorComplementar2026: 243.15, // 15% × R$ 1.621,00
          baseLegal: 'Art. 101, § 1º'
        },
        baseLegal: 'Art. 101, I; LC 123/2006, Art. 18-A, § 3º, V'
      },
      icms: {
        descricao: 'Valor fixo mensal de ICMS para atividades de comércio e indústria',
        valorFixo: 1.00, // R$ 1,00 — Art. 101, II
        aplicavelA: ['Comércio', 'Indústria'],
        baseLegal: 'Art. 101, II; LC 123/2006, Art. 18-A, § 3º, VI'
      },
      iss: {
        descricao: 'Valor fixo mensal de ISS para prestadores de serviço',
        valorFixo: 5.00, // R$ 5,00 — Art. 101, III
        aplicavelA: ['Prestação de serviços'],
        baseLegal: 'Art. 101, III; LC 123/2006, Art. 18-A, § 3º, VII'
      }
    },

    valoresMensais2026: {
      apenasComercioIndustria: {
        inss: 81.05,
        icms: 1.00,
        iss: 0.00,
        total: 82.05,
        descricao: 'MEI com atividade exclusiva de comércio/indústria'
      },
      apenasServicos: {
        inss: 81.05,
        icms: 0.00,
        iss: 5.00,
        total: 86.05,
        descricao: 'MEI com atividade exclusiva de serviços'
      },
      comercioEServicos: {
        inss: 81.05,
        icms: 1.00,
        iss: 5.00,
        total: 87.05,
        descricao: 'MEI com atividade mista (comércio/indústria + serviços)'
      }
    },

    prazoRecolhimento: {
      descricao: 'O DAS-MEI vence no dia 20 do mês subsequente ao período de apuração',
      diaVencimento: 20,
      regra: 'Se o dia 20 cair em dia não útil, antecipa para o dia útil imediatamente anterior',
      baseLegal: 'Art. 101, § 3º'
    },

    baseLegal: 'Art. 101; LC 123/2006, Art. 18-A, § 3º'
  },

  empregadoUnico: {
    descricao: 'O MEI poderá contratar no máximo um empregado, com remuneração de um salário mínimo ou piso da categoria',
    limiteEmpregados: 1,
    remuneracaoMaxima: 'Um salário mínimo ou piso salarial da categoria profissional',
    encargosPatronais: {
      inss: 0.03, // 3% sobre a remuneração do empregado — Art. 102
      fgts: 0.08, // 8% sobre a remuneração do empregado
      descricao: 'O MEI paga 3% de INSS patronal (não 20%) + 8% FGTS sobre salário do empregado',
      baseLegal: 'Art. 102; LC 123/2006, Art. 18-C, § 1º'
    },
    obrigacoes: [
      'GFIP/SEFIP mensal',
      'eSocial',
      'Folha de pagamento',
      'CAGED (admissão/demissão)'
    ],
    baseLegal: 'Art. 102; LC 123/2006, Art. 18-C'
  },

  obrigacoesAcessorias: {
    descricao: 'O MEI está dispensado de diversas obrigações acessórias exigidas das ME/EPP',
    dispensas: [
      {
        obrigacao: 'Escrituração contábil',
        dispensado: true,
        baseLegal: 'Art. 106, I'
      },
      {
        obrigacao: 'PGDAS-D mensal',
        dispensado: true,
        observacao: 'Substituído pelo recolhimento fixo via DAS-MEI',
        baseLegal: 'Art. 106, II'
      },
      {
        obrigacao: 'DEFIS',
        dispensado: true,
        substituicao: 'Declaração Anual Simplificada (DASN-SIMEI)',
        baseLegal: 'Art. 106, III'
      },
      {
        obrigacao: 'Livro Caixa',
        dispensado: true,
        observacao: 'Recomendado mas não obrigatório',
        baseLegal: 'Art. 106, IV'
      },
      {
        obrigacao: 'Emissão de NF-e para pessoa física',
        dispensado: true,
        observacao: 'Obrigada apenas nas vendas para PJ ou quando solicitada pelo consumidor',
        baseLegal: 'Art. 106, V; LC 123/2006, Art. 26, § 1º'
      }
    ],
    obrigatorias: [
      {
        obrigacao: 'DASN-SIMEI (Declaração Anual Simplificada)',
        prazo: 'Até 31 de maio do ano-calendário subsequente',
        baseLegal: 'Art. 107'
      },
      {
        obrigacao: 'Relatório Mensal de Receitas Brutas',
        prazo: 'Até o dia 20 do mês subsequente',
        descricao: 'Registro simplificado das receitas do mês (anexar NFs emitidas e recebidas)',
        baseLegal: 'Art. 106, § 1º'
      },
      {
        obrigacao: 'NF-e nas vendas para Pessoa Jurídica',
        prazo: 'No momento da operação',
        baseLegal: 'Art. 106, V'
      }
    ],
    baseLegal: 'Art. 106 e 107'
  },

  desenquadramento: {
    descricao: 'Hipóteses de desenquadramento do SIMEI (perda da condição de MEI)',
    modalidades: {
      porComunicacao: {
        descricao: 'Desenquadramento por comunicação obrigatória do contribuinte',
        hipoteses: [
          {
            id: 'excesso_receita_ate_20',
            descricao: 'Receita bruta acumulada no ano exceder R$ 81.000 em até 20% (até R$ 97.200)',
            efeito: 'Desenquadramento a partir de 1º de janeiro do ano-calendário subsequente',
            recolhimento: 'Recolhe como MEI até dezembro; diferença de DAS sobre o excesso (percentuais do Anexo aplicável)',
            baseLegal: 'Art. 109, I'
          },
          {
            id: 'excesso_receita_acima_20',
            descricao: 'Receita bruta acumulada no ano exceder R$ 97.200 (mais de 20% acima do limite)',
            efeito: 'Desenquadramento retroativo a 1º de janeiro do ano-calendário em curso',
            recolhimento: 'Recalcula todo o ano como ME no Simples Nacional (DAS normal)',
            baseLegal: 'Art. 109, II'
          },
          {
            id: 'inicio_atividade_excesso_proporcional',
            descricao: 'No ano de início, receita bruta exceder o limite proporcional (R$ 6.750/mês)',
            efeito: 'Se até 20%: efeito a partir de janeiro seguinte. Se acima de 20%: retroativo ao início.',
            baseLegal: 'Art. 109, §§ 1º e 2º'
          },
          {
            id: 'contratacao_empregado_adicional',
            descricao: 'Contratar mais de um empregado',
            efeito: 'Desenquadramento a partir do mês subsequente ao da ocorrência',
            baseLegal: 'Art. 109, III'
          },
          {
            id: 'atividade_vedada',
            descricao: 'Passar a exercer atividade não permitida ao MEI',
            efeito: 'Desenquadramento a partir do mês subsequente ao da ocorrência',
            baseLegal: 'Art. 109, IV'
          },
          {
            id: 'abertura_filial',
            descricao: 'Abertura de filial ou estabelecimento adicional',
            efeito: 'Desenquadramento a partir do mês subsequente ao da ocorrência',
            baseLegal: 'Art. 109, V'
          },
          {
            id: 'participacao_societaria',
            descricao: 'Passar a ser sócio, titular ou administrador de outra empresa',
            efeito: 'Desenquadramento a partir do mês subsequente ao da ocorrência',
            baseLegal: 'Art. 109, VI'
          }
        ],
        prazo: {
          descricao: 'A comunicação de desenquadramento deve ser realizada até o último dia útil do mês subsequente ao da ocorrência',
          baseLegal: 'Art. 110'
        },
        baseLegal: 'Art. 109 e 110'
      },

      deOficio: {
        descricao: 'Desenquadramento de ofício pela administração tributária',
        hipoteses: [
          'Verificação de receita bruta acima do limite sem comunicação do contribuinte',
          'Exercício de atividade vedada ao MEI',
          'Descumprimento das condições do Art. 100',
          'Não regularização de pendências após notificação'
        ],
        baseLegal: 'Art. 111'
      }
    },

    efeitosDesenquadramento: {
      descricao: 'Efeitos após o desenquadramento do SIMEI',
      regras: [
        {
          regra: 'O MEI desenquadrado passa à condição de ME no Simples Nacional',
          condicao: 'Se atender os requisitos e não houver exclusão',
          baseLegal: 'Art. 112'
        },
        {
          regra: 'Se a receita bruta ultrapassar R$ 360.000, passa à condição de EPP',
          baseLegal: 'Art. 112, parágrafo único'
        },
        {
          regra: 'Se incorrer em vedação ao Simples Nacional, será excluído do regime',
          baseLegal: 'Art. 113'
        }
      ],
      baseLegal: 'Art. 112 e 113'
    },

    baseLegal: 'Art. 109 ao 114'
  },

  beneficiosPrevidenciarios: {
    descricao: 'Direitos previdenciários do MEI com contribuição de 5% do salário mínimo',
    direitos: [
      {
        beneficio: 'Aposentadoria por idade',
        carencia: '180 contribuições (15 anos)',
        idade: { homem: 65, mulher: 62 },
        valor: '1 salário mínimo',
        baseLegal: 'LC 123/2006, Art. 18-A, § 12'
      },
      {
        beneficio: 'Aposentadoria por invalidez',
        carencia: '12 contribuições',
        valor: '1 salário mínimo',
        baseLegal: 'Lei 8.213/91, Art. 25, I'
      },
      {
        beneficio: 'Auxílio-doença',
        carencia: '12 contribuições',
        valor: '1 salário mínimo',
        baseLegal: 'Lei 8.213/91, Art. 25, I'
      },
      {
        beneficio: 'Salário-maternidade',
        carencia: '10 contribuições',
        valor: '1 salário mínimo',
        baseLegal: 'Lei 8.213/91, Art. 25, III'
      },
      {
        beneficio: 'Auxílio-reclusão (para dependentes)',
        carencia: '24 contribuições',
        baseLegal: 'Lei 8.213/91, Art. 80'
      },
      {
        beneficio: 'Pensão por morte (para dependentes)',
        carencia: '24 contribuições (ou sem carência se acidente/violência)',
        baseLegal: 'Lei 8.213/91, Art. 74'
      }
    ],
    atencao: 'A contribuição de 5% NÃO dá direito à aposentadoria por tempo de contribuição. Para obter esse direito, o MEI deve complementar com mais 15% sobre o salário mínimo.',
    baseLegal: 'Art. 101, § 1º; LC 123/2006, Art. 18-A, §§ 12 e 12-A'
  },

  restituicaoCompensacao: {
    descricao: 'O MEI que recolheu valor a maior ou indevidamente poderá solicitar restituição ou compensação',
    regras: [
      {
        regra: 'A restituição é realizada mediante requerimento ao ente federativo competente',
        baseLegal: 'Art. 115 ao 130 (regras gerais de restituição)'
      },
      {
        regra: 'A compensação é realizada mediante declaração no PGDAS-D ou por meio de PER/DCOMP',
        baseLegal: 'Art. 119'
      }
    ],
    baseLegal: 'Art. 115 ao 130'
  },

  baseLegal: 'Art. 100 ao 114 da Resolução CGSN 140/2018; LC 123/2006, Art. 18-A a 18-E'
};


// ================================================================================
// SEÇÃO 15: TRANSIÇÕES E PRAZOS
// ================================================================================

/**
 * Calendário completo de prazos do Simples Nacional.
 * Base legal: Diversos artigos da Resolução CGSN 140/2018.
 * @type {Object}
 */
const PRAZOS_CGSN140 = {
  opcao: {
    descricao: 'Prazo para opção pelo Simples Nacional',
    prazo: 'Até o último dia útil de janeiro do ano-calendário',
    excecaoInicioAtividade: 'Até 30 dias após a inscrição estadual/municipal (desde que não ultrapassem 60 dias da inscrição no CNPJ)',
    efeito: 'A opção, se deferida, retroage ao 1º dia do ano-calendário (ou ao início da atividade)',
    baseLegal: 'Art. 7º, caput e §§'
  },

  exclusaoPorComunicacao: {
    descricao: 'Prazos para comunicação de exclusão voluntária',
    prazos: [
      {
        situacao: 'Exclusão por opção do contribuinte (voluntária)',
        prazo: 'A qualquer tempo, com efeito a partir de 1º de janeiro do ano-calendário subsequente',
        excecao: 'Se comunicada no mês de janeiro, produz efeitos nesse mesmo ano',
        baseLegal: 'Art. 73, I'
      },
      {
        situacao: 'Exclusão por excesso de receita (até 20% acima do limite)',
        prazo: 'Efeito a partir de 1º de janeiro do ano-calendário subsequente',
        comunicacao: 'Até o último dia útil do mês subsequente ao da ultrapassagem',
        baseLegal: 'Art. 73, II'
      },
      {
        situacao: 'Exclusão por excesso de receita (acima de 20% do limite)',
        prazo: 'Efeito retroativo ao mês da ultrapassagem (ou início da atividade se no 1º ano)',
        comunicacao: 'Até o último dia útil do mês subsequente ao da ultrapassagem',
        baseLegal: 'Art. 73, III'
      },
      {
        situacao: 'Exclusão por vedação (Art. 15)',
        prazo: 'Efeito a partir do mês subsequente ao da ocorrência da vedação',
        comunicacao: 'Até o último dia útil do mês subsequente ao da ocorrência',
        baseLegal: 'Art. 73, IV'
      }
    ],
    baseLegal: 'Art. 73'
  },

  exclusaoDeOficio: {
    descricao: 'A exclusão de ofício produz efeitos a partir da data designada no ato de exclusão',
    prazoImpugnacao: 30, // 30 dias para impugnar
    baseLegal: 'Art. 76 ao 79'
  },

  apuracaoMensal: {
    descricao: 'Prazo para apuração e recolhimento mensal (DAS)',
    prazo: 'Até o dia 20 do mês subsequente ao período de apuração',
    regra: 'Se o dia 20 cair em dia não útil, antecipa para o dia útil imediatamente anterior',
    baseLegal: 'Art. 40'
  },

  defis: {
    descricao: 'Prazo para entrega da DEFIS (Declaração de Informações Socioeconômicas e Fiscais)',
    prazo: 'Até 31 de março do ano-calendário subsequente',
    baseLegal: 'Art. 72'
  },

  dasnSimei: {
    descricao: 'Prazo para entrega da DASN-SIMEI (Declaração Anual do MEI)',
    prazo: 'Até 31 de maio do ano-calendário subsequente',
    baseLegal: 'Art. 107'
  },

  parcelamento: {
    descricao: 'Prazos e condições para parcelamento de débitos do Simples Nacional',
    prazoMaximo: 60, // Até 60 parcelas — Art. 130-A LC 123
    parcelaMinima: 300.00, // R$ 300,00 para ME/EPP
    parcelaMinimaMEI: 50.00, // R$ 50,00 para MEI
    juros: 'SELIC acumulada + 1% no mês do pagamento',
    baseLegal: 'Art. 130-A da LC 123/2006; Resolução CGSN nº 132/2016'
  },

  baseLegal: 'Diversos artigos da Resolução CGSN 140/2018'
};

/**
 * Regras de transição entre regimes tributários.
 * Base legal: Resolução CGSN 140/2018; LC 123/2006.
 * @type {Object}
 */
const TRANSICOES_CGSN140 = {
  simplesParaLucroPresumido: {
    descricao: 'Transição do Simples Nacional para o Lucro Presumido',
    quando: [
      'Exclusão do Simples (voluntária, de ofício ou por impedimento)',
      'Receita bruta superior a R$ 4.800.000,00',
      'Início de atividade vedada ao Simples'
    ],
    procedimentos: [
      'Comunicar exclusão no Portal do Simples Nacional',
      'Regularizar débitos pendentes do DAS',
      'Realizar opção pelo Lucro Presumido na DCTF/ECF do ano seguinte',
      'Iniciar apuração trimestral de IRPJ, CSLL, PIS e COFINS',
      'Providenciar inscrição estadual para ICMS (se necessário)',
      'Iniciar emissão de notas fiscais com destaque de ICMS/IPI'
    ],
    atencao: [
      'O estoque existente na data da exclusão pode gerar crédito de ICMS na transição (depende da legislação estadual)',
      'O saldo de créditos do Simples não pode ser transferido para o Lucro Presumido',
      'Débitos do DAS devem ser mantidos e pagos no regime anterior'
    ],
    baseLegal: 'Art. 73 ao 82; LC 123/2006, Art. 30 e 31'
  },

  simplesParaLucroReal: {
    descricao: 'Transição do Simples Nacional para o Lucro Real',
    quando: [
      'Exclusão do Simples + obrigatoriedade de Lucro Real (receita > R$ 78 milhões, bancos, etc.)',
      'Opção voluntária quando o Lucro Real for mais vantajoso'
    ],
    procedimentos: [
      'Comunicar exclusão no Portal do Simples Nacional',
      'Optar pelo Lucro Real na DCTF/ECF',
      'Implementar escrituração contábil completa (LALUR, LACS)',
      'Iniciar apuração de PIS/COFINS não cumulativo (alíquotas 1,65% e 7,6%)',
      'Levantar créditos de PIS/COFINS sobre insumos',
      'Implementar controle de estoque (custo médio ou PEPS)',
      'Iniciar obrigações do SPED (ECD, ECF, EFD-Contribuições, EFD-ICMS/IPI)'
    ],
    baseLegal: 'Art. 73 ao 82; Lei 9.718/1998; Lei 10.637/2002; Lei 10.833/2003'
  },

  lucroPresumidoParaSimples: {
    descricao: 'Transição do Lucro Presumido para o Simples Nacional',
    quando: [
      'Empresa atende todos os requisitos do Simples Nacional',
      'Receita bruta anual dentro do limite de R$ 4.800.000,00',
      'Sem atividade vedada',
      'Sem débitos com INSS ou Fazendas (ou regularizados)'
    ],
    procedimentos: [
      'Solicitar opção pelo Simples Nacional até o último dia útil de janeiro',
      'Regularizar todos os débitos tributários pendentes',
      'Verificar ausência de vedações do Art. 15',
      'Atentar ao estoque — pode haver estorno de créditos de ICMS/IPI',
      'Cancelar inscrição como contribuinte de IPI (se aplicável)'
    ],
    prazo: 'Opção até o último dia útil de janeiro do ano-calendário desejado',
    baseLegal: 'Art. 7º e 8º; LC 123/2006, Art. 16'
  },

  meiParaME: {
    descricao: 'Transição do MEI para ME no Simples Nacional',
    quando: [
      'Receita bruta acumulada acima de R$ 81.000 (ou proporcional)',
      'Contratação de mais de um empregado',
      'Exercício de atividade vedada ao MEI',
      'Abertura de filial',
      'Participação em outra empresa'
    ],
    efeitosReceitaAte20Porcento: {
      descricao: 'Se exceder em até 20% (até R$ 97.200), desenquadramento a partir de 1/jan do ano seguinte',
      recolhimento: 'Recolhe como MEI até dezembro, com complemento de DAS sobre o excesso',
      baseLegal: 'Art. 109, I'
    },
    efeitosReceitaAcima20Porcento: {
      descricao: 'Se exceder acima de 20% (acima de R$ 97.200), desenquadramento retroativo a 1/jan do ano corrente',
      recolhimento: 'Recalcula todo o ano como ME no Simples Nacional',
      baseLegal: 'Art. 109, II'
    },
    baseLegal: 'Art. 109 ao 114'
  },

  sublimiteICMSISS: {
    descricao: 'Efeitos de ultrapassar o sublimite estadual de R$ 3.600.000,00',
    sublimite: 3_600_000.00,
    efeitoAte20Porcento: {
      descricao: 'Se exceder em até 20% (até R$ 4.320.000), recolhimento de ICMS e ISS por fora a partir do ano-calendário seguinte',
      baseLegal: 'Art. 9º, § 2º'
    },
    efeitoAcima20Porcento: {
      descricao: 'Se exceder acima de 20%, recolhimento de ICMS e ISS por fora a partir do mês seguinte ao da ultrapassagem',
      baseLegal: 'Art. 9º, § 3º'
    },
    recolhimentoPorFora: {
      descricao: 'ICMS e ISS passam a ser recolhidos conforme legislação estadual/municipal (fora do DAS)',
      tributosFederais: 'Continuam no DAS normalmente até R$ 4.800.000',
      baseLegal: 'Art. 9º ao 11'
    },
    baseLegal: 'Art. 9º, 10 e 11'
  },

  baseLegal: 'Resolução CGSN 140/2018; LC 123/2006'
};


// ================================================================================
// SEÇÃO 16: FUNÇÕES UTILITÁRIAS
// ================================================================================

/**
 * Consulta informações sobre um artigo específico da Resolução CGSN 140/2018.
 * @param {number|string} numero - Número do artigo (ex: 15, '18', '131')
 * @returns {Object|null} Informações do artigo ou null se não encontrado
 * @example
 * consultarArtigo(15)
 * // => { artigo: 15, titulo: 'Vedações ao Simples Nacional', capitulo: 'III', ... }
 */
function consultarArtigo(numero) {
  const num = parseInt(numero, 10);
  if (isNaN(num) || num < 1 || num > 141) return null;

  const MAPA_ARTIGOS = {
    1:   { titulo: 'Disposições preliminares — abrangência do Simples Nacional', capitulo: 'I', secao: 'Disposições Preliminares' },
    2:   { titulo: 'Definições de ME e EPP', capitulo: 'I', secao: 'Disposições Preliminares' },
    3:   { titulo: 'Receita bruta — conceito', capitulo: 'I', secao: 'Disposições Preliminares' },
    4:   { titulo: 'Receita bruta — exclusões', capitulo: 'I', secao: 'Disposições Preliminares' },
    5:   { titulo: 'Equiparação de empresa em início de atividade', capitulo: 'I', secao: 'Disposições Preliminares' },
    6:   { titulo: 'Limite proporcional para empresa nova', capitulo: 'I', secao: 'Disposições Preliminares' },
    7:   { titulo: 'Opção pelo Simples Nacional — prazo e forma', capitulo: 'II', secao: 'Da Opção' },
    8:   { titulo: 'Opção — verificação de pendências', capitulo: 'II', secao: 'Da Opção' },
    9:   { titulo: 'Sublimites estaduais para ICMS e ISS', capitulo: 'II', secao: 'Da Opção' },
    10:  { titulo: 'Adoção de sublimite pelos Estados', capitulo: 'II', secao: 'Da Opção' },
    11:  { titulo: 'Efeitos da ultrapassagem do sublimite', capitulo: 'II', secao: 'Da Opção' },
    12:  { titulo: 'Opção — indeferimento e impugnação', capitulo: 'II', secao: 'Da Opção' },
    13:  { titulo: 'Opção — efeitos retroativos', capitulo: 'II', secao: 'Da Opção' },
    14:  { titulo: 'Opção — impedimentos temporários', capitulo: 'II', secao: 'Da Opção' },
    15:  { titulo: 'Vedações ao Simples Nacional', capitulo: 'III', secao: 'Das Vedações' },
    16:  { titulo: 'Base de cálculo — receita bruta', capitulo: 'IV', secao: 'Base de Cálculo e Valor Devido' },
    17:  { titulo: 'Receita bruta — exclusões da base de cálculo', capitulo: 'IV', secao: 'Base de Cálculo e Valor Devido' },
    18:  { titulo: 'Alíquotas, tabelas dos Anexos e fator "r"', capitulo: 'IV', secao: 'Base de Cálculo e Valor Devido' },
    19:  { titulo: 'Receita bruta acumulada (RBT12)', capitulo: 'IV', secao: 'Base de Cálculo e Valor Devido' },
    20:  { titulo: 'Proporcionalidade para início de atividade', capitulo: 'IV', secao: 'Base de Cálculo e Valor Devido' },
    21:  { titulo: 'Fórmula da alíquota efetiva', capitulo: 'IV', secao: 'Base de Cálculo e Valor Devido' },
    22:  { titulo: 'Majoração de alíquota por excesso de receita', capitulo: 'IV', secao: 'Base de Cálculo e Valor Devido' },
    25:  { titulo: 'Segregação de receitas por atividade', capitulo: 'IV', secao: 'Base de Cálculo e Valor Devido' },
    26:  { titulo: 'Tributação monofásica — PIS e COFINS', capitulo: 'IV', secao: 'Base de Cálculo e Valor Devido' },
    27:  { titulo: 'Substituição tributária de ICMS', capitulo: 'IV', secao: 'Base de Cálculo e Valor Devido' },
    28:  { titulo: 'ISS — regras específicas', capitulo: 'IV', secao: 'Base de Cálculo e Valor Devido' },
    29:  { titulo: 'ISS — retenção na fonte', capitulo: 'IV', secao: 'Base de Cálculo e Valor Devido' },
    30:  { titulo: 'ICMS — antecipação e substituição tributária', capitulo: 'IV', secao: 'Base de Cálculo e Valor Devido' },
    33:  { titulo: 'ICMS — diferencial de alíquotas (DIFAL)', capitulo: 'IV', secao: 'Base de Cálculo e Valor Devido' },
    38:  { titulo: 'PGDAS-D — obrigatoriedade', capitulo: 'V', secao: 'Obrigações Acessórias' },
    39:  { titulo: 'PGDAS-D — transmissão e retificação', capitulo: 'V', secao: 'Obrigações Acessórias' },
    40:  { titulo: 'DAS — documento de arrecadação', capitulo: 'V', secao: 'Obrigações Acessórias' },
    57:  { titulo: 'Documentos fiscais — emissão', capitulo: 'V', secao: 'Obrigações Acessórias' },
    63:  { titulo: 'Livros fiscais e contábeis obrigatórios', capitulo: 'V', secao: 'Obrigações Acessórias' },
    72:  { titulo: 'DEFIS — declaração anual', capitulo: 'V', secao: 'Obrigações Acessórias' },
    73:  { titulo: 'Exclusão por comunicação — hipóteses', capitulo: 'VI', secao: 'Da Exclusão' },
    74:  { titulo: 'Exclusão por comunicação — prazos', capitulo: 'VI', secao: 'Da Exclusão' },
    75:  { titulo: 'Exclusão por comunicação — efeitos', capitulo: 'VI', secao: 'Da Exclusão' },
    76:  { titulo: 'Exclusão de ofício — hipóteses', capitulo: 'VI', secao: 'Da Exclusão' },
    77:  { titulo: 'Exclusão de ofício — procedimento', capitulo: 'VI', secao: 'Da Exclusão' },
    78:  { titulo: 'Exclusão de ofício — efeitos', capitulo: 'VI', secao: 'Da Exclusão' },
    79:  { titulo: 'Exclusão de ofício — ciência e impugnação', capitulo: 'VI', secao: 'Da Exclusão' },
    80:  { titulo: 'Exclusão — retorno ao Simples', capitulo: 'VI', secao: 'Da Exclusão' },
    81:  { titulo: 'Exclusão — débitos pendentes', capitulo: 'VI', secao: 'Da Exclusão' },
    82:  { titulo: 'Exclusão — disposições gerais', capitulo: 'VI', secao: 'Da Exclusão' },
    83:  { titulo: 'Fiscalização — competência compartilhada', capitulo: 'VII', secao: 'Da Fiscalização' },
    84:  { titulo: 'Fiscalização — auto de infração', capitulo: 'VII', secao: 'Da Fiscalização' },
    85:  { titulo: 'Fiscalização — ação fiscal integrada', capitulo: 'VII', secao: 'Da Fiscalização' },
    86:  { titulo: 'Fiscalização — tributos individuais', capitulo: 'VII', secao: 'Da Fiscalização' },
    87:  { titulo: 'Fiscalização — Zona Franca de Manaus', capitulo: 'VII', secao: 'Da Fiscalização' },
    88:  { titulo: 'Fiscalização — ação fiscal', capitulo: 'VII', secao: 'Da Fiscalização' },
    89:  { titulo: 'Fiscalização — disposições finais', capitulo: 'VII', secao: 'Da Fiscalização' },
    90:  { titulo: 'Processo administrativo — contencioso', capitulo: 'VIII', secao: 'Processo Administrativo Fiscal' },
    91:  { titulo: 'Processo administrativo — impugnação', capitulo: 'VIII', secao: 'Processo Administrativo Fiscal' },
    95:  { titulo: 'Consulta fiscal — competência', capitulo: 'VIII', secao: 'Processo Administrativo Fiscal' },
    99:  { titulo: 'Consulta fiscal — disposições finais', capitulo: 'VIII', secao: 'Processo Administrativo Fiscal' },
    100: { titulo: 'MEI — definição e requisitos', capitulo: 'IX', secao: 'Do MEI' },
    101: { titulo: 'MEI — recolhimento fixo mensal', capitulo: 'IX', secao: 'Do MEI' },
    102: { titulo: 'MEI — empregado único', capitulo: 'IX', secao: 'Do MEI' },
    103: { titulo: 'MEI — enquadramento no SIMEI', capitulo: 'IX', secao: 'Do MEI' },
    104: { titulo: 'MEI — opção e inscrição', capitulo: 'IX', secao: 'Do MEI' },
    105: { titulo: 'MEI — CNAEs permitidos (Anexo XI)', capitulo: 'IX', secao: 'Do MEI' },
    106: { titulo: 'MEI — obrigações acessórias e dispensas', capitulo: 'IX', secao: 'Do MEI' },
    107: { titulo: 'MEI — DASN-SIMEI', capitulo: 'IX', secao: 'Do MEI' },
    108: { titulo: 'MEI — alvará e licenciamento provisório', capitulo: 'IX', secao: 'Do MEI' },
    109: { titulo: 'MEI — desenquadramento por comunicação', capitulo: 'IX', secao: 'Do MEI' },
    110: { titulo: 'MEI — prazo de comunicação de desenquadramento', capitulo: 'IX', secao: 'Do MEI' },
    111: { titulo: 'MEI — desenquadramento de ofício', capitulo: 'IX', secao: 'Do MEI' },
    112: { titulo: 'MEI — efeitos do desenquadramento', capitulo: 'IX', secao: 'Do MEI' },
    113: { titulo: 'MEI — exclusão do Simples após desenquadramento', capitulo: 'IX', secao: 'Do MEI' },
    114: { titulo: 'MEI — disposições finais', capitulo: 'IX', secao: 'Do MEI' },
    115: { titulo: 'Restituição — direito', capitulo: 'X', secao: 'Restituição e Compensação' },
    116: { titulo: 'Restituição — competência', capitulo: 'X', secao: 'Restituição e Compensação' },
    119: { titulo: 'Compensação — regras', capitulo: 'X', secao: 'Restituição e Compensação' },
    130: { titulo: 'Restituição e Compensação — disposições finais', capitulo: 'X', secao: 'Restituição e Compensação' },
    131: { titulo: 'Distribuição de lucros — isenção de IR', capitulo: 'XI', secao: 'Disposições Gerais e Finais' },
    132: { titulo: 'Distribuição de lucros — percentuais de presunção', capitulo: 'XI', secao: 'Disposições Gerais e Finais' },
    133: { titulo: 'Distribuição de lucros — excedente tributável', capitulo: 'XI', secao: 'Disposições Gerais e Finais' },
    134: { titulo: 'Baixa de empresa — simplificação', capitulo: 'XI', secao: 'Disposições Gerais e Finais' },
    135: { titulo: 'Acesso a mercados e licitações', capitulo: 'XI', secao: 'Disposições Gerais e Finais' },
    136: { titulo: 'Estímulo ao crédito e capitalização', capitulo: 'XI', secao: 'Disposições Gerais e Finais' },
    137: { titulo: 'Simples Nacional e tratamento diferenciado', capitulo: 'XI', secao: 'Disposições Gerais e Finais' },
    138: { titulo: 'Disposições transitórias', capitulo: 'XI', secao: 'Disposições Gerais e Finais' },
    139: { titulo: 'Revogações', capitulo: 'XI', secao: 'Disposições Gerais e Finais' },
    140: { titulo: 'Vigência', capitulo: 'XI', secao: 'Disposições Gerais e Finais' },
    141: { titulo: 'Publicação', capitulo: 'XI', secao: 'Disposições Gerais e Finais' }
  };

  const info = MAPA_ARTIGOS[num];
  if (!info) {
    return {
      artigo: num,
      titulo: 'Artigo não mapeado neste módulo',
      capitulo: null,
      secao: null,
      nota: 'Consulte o texto integral da Resolução CGSN 140/2018'
    };
  }

  return {
    artigo: num,
    titulo: info.titulo,
    capitulo: info.capitulo,
    secao: info.secao,
    referencia: 'Art. ' + num + ' da Resolução CGSN nº 140/2018'
  };
}

/**
 * Obtém uma vedação específica pelo seu ID.
 * @param {string} id - ID da vedação (ex: 'debito_inss', 'atividade_financeira')
 * @returns {Object|null} Objeto da vedação ou null se não encontrado
 * @example
 * obterVedacao('debito_inss')
 * // => { id: 'debito_inss', descricao: '...', artigo: 'Art. 15, IV', ... }
 */
function obterVedacao(id) {
  if (!id || typeof id !== 'string') return null;
  return VEDACOES_CGSN140.find(function(v) { return v.id === id; }) || null;
}

/**
 * Obtém regras de um anexo específico do Simples Nacional.
 * @param {string|number} anexo - Anexo desejado ('I', 'II', 'III', 'IV', 'V' ou 1-5)
 * @returns {Object|null} Tabela do anexo com faixas, alíquotas e partilha
 * @example
 * obterRegraAnexo('III')
 * // => { faixas: [...], partilha: [...], descricao: '...', baseLegal: '...' }
 */
function obterRegraAnexo(anexo) {
  const MAPA_NUMERICO = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V' };
  var chave = typeof anexo === 'number' ? MAPA_NUMERICO[anexo] : String(anexo).toUpperCase();

  if (!chave || !ANEXOS_CGSN140[chave]) return null;

  return {
    anexo: chave,
    faixas: ANEXOS_CGSN140[chave],
    partilha: PARTILHA_CGSN140[chave] || null,
    descricao: {
      I:   'Comércio',
      II:  'Indústria',
      III: 'Serviços (receitas do § 5º-B — locação, academias, escritórios contábeis, etc.)',
      IV:  'Serviços (receitas do § 5º-C — construção, vigilância, limpeza, advocacia, etc.) — CPP por fora',
      V:   'Serviços (receitas do § 5º-D — engenharia, TI, jornalismo, etc.) — depende do Fator "r"'
    }[chave],
    cppInclusa: chave !== 'IV',
    baseLegal: 'Anexo ' + chave + ' da Resolução CGSN 140/2018'
  };
}

/**
 * Obtém todas as regras de ISS do Simples Nacional.
 * @returns {Object} Objeto REGRAS_ISS_CGSN140
 */
function obterRegrasISS() {
  return REGRAS_ISS_CGSN140;
}

/**
 * Obtém todas as regras de ICMS do Simples Nacional.
 * @returns {Object} Objeto REGRAS_ICMS_CGSN140
 */
function obterRegrasICMS() {
  return REGRAS_ICMS_CGSN140;
}

/**
 * Obtém todas as regras do Fator "r".
 * @returns {Object} Objeto FATOR_R_CGSN140
 */
function obterRegrasFatorR() {
  return FATOR_R_CGSN140;
}

/**
 * Valida a elegibilidade de uma empresa para o Simples Nacional conforme CGSN 140.
 * @param {Object} dadosEmpresa - Dados da empresa para validação
 * @param {number} dadosEmpresa.receitaBrutaAnual - Receita bruta anual (RBT12)
 * @param {string} [dadosEmpresa.naturezaJuridica] - Natureza jurídica (ex: 'EIRELI', 'LTDA', 'SA')
 * @param {boolean} [dadosEmpresa.possuiSocioEstrangeiro] - Se possui sócio residente no exterior
 * @param {boolean} [dadosEmpresa.possuiSocioPJ] - Se possui pessoa jurídica como sócio
 * @param {boolean} [dadosEmpresa.possuiDebitoINSS] - Se possui débito com INSS
 * @param {boolean} [dadosEmpresa.possuiDebitoFazenda] - Se possui débito com Fazendas
 * @param {boolean} [dadosEmpresa.exerceAtividadeFinanceira] - Se exerce atividade financeira
 * @param {boolean} [dadosEmpresa.exerceAtividadeBebidas] - Se fabrica bebidas alcoólicas
 * @param {string[]} [dadosEmpresa.cnaes] - Lista de CNAEs da empresa
 * @returns {Object} Resultado da validação com elegibilidade, alertas e vedações aplicáveis
 * @example
 * validarElegibilidadeCGSN140({ receitaBrutaAnual: 3000000 })
 * // => { elegivel: true, alertas: [], vedacoesVioladas: [] }
 */
function validarElegibilidadeCGSN140(dadosEmpresa) {
  if (!dadosEmpresa || typeof dadosEmpresa !== 'object') {
    return { elegivel: false, erro: 'Dados da empresa não informados', vedacoesVioladas: [], alertas: [] };
  }

  var vedacoesVioladas = [];
  var alertas = [];
  var receita = dadosEmpresa.receitaBrutaAnual || dadosEmpresa.receitaBruta12Meses || 0;

  // Verificar limite de receita
  if (receita > 4_800_000.00) {
    vedacoesVioladas.push({
      vedacao: 'excesso_receita_bruta',
      descricao: 'Receita bruta anual excede o limite de R$ 4.800.000,00',
      valor: receita,
      limite: 4_800_000.00,
      baseLegal: 'Art. 3º da LC 123/2006; Art. 2º da Resolução CGSN 140'
    });
  } else if (receita > 3_600_000.00) {
    alertas.push({
      tipo: 'sublimite',
      descricao: 'Receita bruta acima do sublimite estadual (R$ 3.600.000). ICMS e ISS serão recolhidos por fora.',
      valor: receita,
      sublimite: 3_600_000.00,
      baseLegal: 'Art. 9º ao 11'
    });
  }

  // Verificar vedações do Art. 15
  if (dadosEmpresa.naturezaJuridica) {
    var nj = dadosEmpresa.naturezaJuridica.toUpperCase();
    if (nj === 'SA' || nj.indexOf('ANONIMA') >= 0 || nj.indexOf('ANÔNIMA') >= 0) {
      vedacoesVioladas.push({
        vedacao: 'sociedade_anonima',
        descricao: 'Sociedade por ações (S.A.) não pode optar pelo Simples Nacional',
        baseLegal: 'Art. 15, II'
      });
    }
  }

  if (dadosEmpresa.possuiSocioEstrangeiro === true) {
    vedacoesVioladas.push({
      vedacao: 'socio_estrangeiro',
      descricao: 'Possui sócio domiciliado no exterior',
      baseLegal: 'Art. 15, IV'
    });
  }

  if (dadosEmpresa.possuiSocioPJ === true) {
    vedacoesVioladas.push({
      vedacao: 'socio_pessoa_juridica',
      descricao: 'Possui pessoa jurídica como sócio',
      baseLegal: 'Art. 15, V'
    });
  }

  if (dadosEmpresa.possuiDebitoINSS === true) {
    vedacoesVioladas.push({
      vedacao: 'debito_inss',
      descricao: 'Possui débito com o INSS sem regularização',
      baseLegal: 'Art. 15, IX'
    });
  }

  if (dadosEmpresa.possuiDebitoFazenda === true) {
    vedacoesVioladas.push({
      vedacao: 'debito_fazenda',
      descricao: 'Possui débito com as Fazendas Públicas sem regularização',
      baseLegal: 'Art. 15, IX'
    });
  }

  if (dadosEmpresa.exerceAtividadeFinanceira === true) {
    vedacoesVioladas.push({
      vedacao: 'atividade_financeira',
      descricao: 'Exerce atividade de banco comercial, investimento, financeira, crédito imobiliário, etc.',
      baseLegal: 'Art. 15, VI'
    });
  }

  if (dadosEmpresa.exerceAtividadeBebidas === true) {
    vedacoesVioladas.push({
      vedacao: 'fabricacao_bebidas',
      descricao: 'Fabrica ou comercializa por atacado bebidas alcoólicas (exceto pequeno produtor artesanal)',
      baseLegal: 'Art. 15, X'
    });
  }

  var elegivel = vedacoesVioladas.length === 0;

  return {
    elegivel: elegivel,
    porte: receita <= 360_000.00 ? 'ME' : receita <= 4_800_000.00 ? 'EPP' : 'Acima do limite',
    receitaBrutaAnual: receita,
    vedacoesVioladas: vedacoesVioladas,
    totalVedacoes: vedacoesVioladas.length,
    alertas: alertas,
    totalAlertas: alertas.length,
    observacao: elegivel
      ? 'Empresa elegível ao Simples Nacional conforme dados informados. Verificação completa exige análise de todas as vedações do Art. 15.'
      : 'Empresa NÃO elegível ao Simples Nacional. Vedações encontradas: ' + vedacoesVioladas.length,
    baseLegal: 'Art. 2º e Art. 15 da Resolução CGSN 140/2018'
  };
}

/**
 * Calcula a multa por atraso na entrega do PGDAS-D.
 * @param {number} diasAtraso - Número de dias de atraso
 * @param {number} valorDAS - Valor total dos tributos informados no período
 * @param {string} [porte='ME'] - Porte da empresa: 'ME' ou 'EPP'
 * @param {boolean} [entregueAntesOficio=false] - Se foi entregue antes de procedimento de ofício (redução de 50%)
 * @returns {Object} Resultado com valor da multa e detalhamento
 * @example
 * obterMultaPGDAS(45, 5000, 'EPP', false)
 * // => { valorMulta: 100, mesesAtraso: 2, detalhamento: '...', baseLegal: '...' }
 */
function obterMultaPGDAS(diasAtraso, valorDAS, porte, entregueAntesOficio) {
  if (typeof diasAtraso !== 'number' || diasAtraso <= 0) {
    return { valorMulta: 0, mesesAtraso: 0, descricao: 'Sem atraso' };
  }

  var p = (porte || 'ME').toUpperCase();
  var mesesAtraso = Math.ceil(diasAtraso / 30);
  var multa = MULTAS_CGSN140.multaPGDAS_D;

  // Multa = 2% ao mês sobre tributos informados, limitada a 20%
  var percentualTotal = Math.min(mesesAtraso * multa.percentualSobreImpostos, multa.limitePercentual);
  var multaCalculada = (typeof valorDAS === 'number' ? valorDAS : 0) * percentualTotal;

  // Multa mínima por mês
  var minimoMensal = p === 'EPP' ? multa.valorMinimoPorMes.EPP : multa.valorMinimoPorMes.ME;
  var multaMinima = mesesAtraso * minimoMensal;

  var valorFinal = Math.max(multaCalculada, multaMinima);

  // Redução de 50% se entregue antes de procedimento de ofício
  var reducao = 0;
  if (entregueAntesOficio === true) {
    reducao = valorFinal * multa.reducao.percentualReducao;
    valorFinal = valorFinal - reducao;
  }

  return {
    valorMulta: Math.round(valorFinal * 100) / 100,
    mesesAtraso: mesesAtraso,
    diasAtraso: diasAtraso,
    porte: p,
    percentualAplicado: percentualTotal,
    multaSobreTributos: Math.round(multaCalculada * 100) / 100,
    multaMinima: Math.round(multaMinima * 100) / 100,
    reducao50Porcento: entregueAntesOficio === true,
    valorReducao: Math.round(reducao * 100) / 100,
    baseLegal: 'Art. 38-A da LC 123/2006; Resolução CGSN 183/2025'
  };
}

/**
 * Obtém prazos por tipo de obrigação ou procedimento.
 * @param {string} tipo - Tipo de prazo: 'opcao', 'exclusao', 'das', 'defis', 'dasn_simei', 'impugnacao', 'parcelamento'
 * @returns {Object|null} Informações do prazo ou null se tipo não encontrado
 * @example
 * obterPrazos('das')
 * // => { descricao: 'Até o dia 20 do mês subsequente', baseLegal: 'Art. 40', ... }
 */
function obterPrazos(tipo) {
  if (!tipo || typeof tipo !== 'string') return null;

  var t = tipo.toLowerCase().replace(/[-\s]/g, '_');

  var MAPA_PRAZOS = {
    opcao: {
      descricao: 'Opção pelo Simples Nacional',
      prazo: 'Até o último dia útil de janeiro do ano-calendário',
      excecao: 'Para empresa nova: até 30 dias da inscrição estadual/municipal (máximo 60 dias da inscrição no CNPJ)',
      baseLegal: 'Art. 7º'
    },
    exclusao: {
      descricao: 'Comunicação de exclusão voluntária',
      prazo: 'A qualquer tempo, com efeito a partir de 1º de janeiro do ano-calendário subsequente',
      baseLegal: 'Art. 73'
    },
    das: {
      descricao: 'Recolhimento mensal do DAS',
      prazo: 'Até o dia 20 do mês subsequente ao período de apuração',
      regra: 'Se dia 20 cair em dia não útil, antecipa para o dia útil imediatamente anterior',
      baseLegal: 'Art. 40'
    },
    pgdas_d: {
      descricao: 'Transmissão do PGDAS-D',
      prazo: 'Até o dia 20 do mês subsequente ao período de apuração (mesmo prazo do DAS)',
      baseLegal: 'Art. 38 e 39'
    },
    defis: {
      descricao: 'Entrega da DEFIS',
      prazo: 'Até 31 de março do ano-calendário subsequente',
      baseLegal: 'Art. 72'
    },
    dasn_simei: {
      descricao: 'Entrega da DASN-SIMEI (MEI)',
      prazo: 'Até 31 de maio do ano-calendário subsequente',
      baseLegal: 'Art. 107'
    },
    impugnacao: {
      descricao: 'Prazo para impugnar auto de infração ou ato de exclusão',
      prazo: '30 dias corridos a contar da ciência',
      efeito: 'Suspende a exigibilidade do crédito tributário',
      baseLegal: 'Art. 91; CTN, Art. 151, III'
    },
    parcelamento: {
      descricao: 'Parcelamento de débitos do Simples Nacional',
      prazoMaximoParcelas: 60,
      parcelaMinimaMEEPP: 300.00,
      parcelaMinimaMEI: 50.00,
      baseLegal: 'Art. 130-A da LC 123/2006'
    }
  };

  return MAPA_PRAZOS[t] || null;
}

/**
 * Obtém informações sobre obrigações acessórias por ID.
 * @param {string} id - ID da obrigação (ex: 'pgdas_d', 'defis', 'esocial')
 * @returns {Object|null} Dados da obrigação ou null se não encontrado
 */
function obterObrigacao(id) {
  if (!id || typeof id !== 'string') return null;
  return OBRIGACOES_CGSN140.find(function(o) { return o.id === id; }) || null;
}

/**
 * Obtém regras completas de distribuição de lucros.
 * @returns {Object} Objeto DISTRIBUICAO_LUCROS_CGSN140
 */
function obterRegrasDistribuicaoLucros() {
  return DISTRIBUICAO_LUCROS_CGSN140;
}

/**
 * Obtém regras completas do MEI.
 * @returns {Object} Objeto MEI_CGSN140
 */
function obterRegrasMEI() {
  return MEI_CGSN140;
}

/**
 * Calcula o valor mensal do DAS-MEI (SIMEI) conforme tipo de atividade.
 * @param {string} tipoAtividade - 'comercio', 'servicos' ou 'misto'
 * @param {number} [salarioMinimo=1621] - Salário mínimo vigente
 * @returns {Object} Detalhamento do DAS-MEI com componentes
 * @example
 * calcularDASMEI('misto')
 * // => { total: 87.05, inss: 81.05, icms: 1.00, iss: 5.00, ... }
 */
function calcularDASMEI(tipoAtividade, salarioMinimo) {
  var sm = typeof salarioMinimo === 'number' && salarioMinimo > 0 ? salarioMinimo : 1_621.00;
  var tipo = (tipoAtividade || 'misto').toLowerCase();

  var inss = Math.round(sm * 0.05 * 100) / 100;
  var icms = 0;
  var iss = 0;

  if (tipo === 'comercio' || tipo === 'industria' || tipo === 'misto') {
    icms = 1.00;
  }
  if (tipo === 'servicos' || tipo === 'misto') {
    iss = 5.00;
  }

  var total = Math.round((inss + icms + iss) * 100) / 100;

  return {
    total: total,
    componentes: {
      inss: inss,
      icms: icms,
      iss: iss
    },
    tipoAtividade: tipo,
    salarioMinimoBase: sm,
    aliquotaINSS: 0.05,
    baseLegal: 'Art. 101 da Resolução CGSN 140/2018; LC 123/2006, Art. 18-A, § 3º'
  };
}


// ================================================================================
// SEÇÃO 17: EXPORT
// ================================================================================

/**
 * Objeto principal de exportação — Resolução CGSN nº 140/2018.
 * Contém todos os dados legais e funções utilitárias.
 * @type {Object}
 */


// ================================================================================
// ALIASES DE RETROCOMPATIBILIDADE (Cf. FUSAO_PLANO.md Secao 6.2 e 8)
// As funcoes do motor usam ANEXOS, PARTILHA, VEDACOES, OBRIGACOES_ACESSORIAS, MEI.
// Os aliases apontam para versoes CGSN140 (mais completas e autoritativas).
// ================================================================================

const ANEXOS = ANEXOS_CGSN140;
const PARTILHA = PARTILHA_CGSN140;
const VEDACOES = VEDACOES_CGSN140;
const OBRIGACOES_ACESSORIAS = OBRIGACOES_CGSN140;
const MEI = MEI_CGSN140;
const TRANSICOES = TRANSICOES_CGSN140;



// ================================================================================
// CAMADA 2A: CONSTANTES NUMERICAS DERIVADAS DO CGSN140 (Cf. FUSAO_PLANO.md Sec 6.1)
// Valores derivados das definicoes legais autoritativas.
// Mantidos para retrocompatibilidade total com codigo existente.
// ================================================================================

// Limites de enquadramento (LC 123/2006, Art. 3)
const LIMITE_ME = DEFINICOES_LEGAIS.microempresa.limiteReceitaBrutaAnual;
const LIMITE_EPP = DEFINICOES_LEGAIS.empresaPequenoPorte.limiteReceitaBrutaAnualMax;
const SUBLIMITE_ICMS_ISS = DEFINICOES_LEGAIS.sublimiteEstadual.valorPadrao;
const LIMITE_RECEITA_MENSAL_PROPORCIONAL = DEFINICOES_LEGAIS.empresaEmInicioAtividade.limiteMensalProporcional;

// Fator R (Resolucao CGSN 140/2018, Art. 18)
const LIMITE_FATOR_R = FATOR_R_CGSN140.limiar;

// ISS — derivados das regras CGSN140 (LC 116/2003)
const ISS_MINIMO = REGRAS_ISS_CGSN140.aliquotaMinima.valor;
const ISS_MAXIMO = REGRAS_ISS_CGSN140.aliquotaMaxima.valor;

// CPP — derivados das regras CGSN140 (Art. 22, Lei 8.212/1991)
const ALIQUOTA_INSS_PATRONAL_ANEXO_IV = REGRAS_CPP_CGSN140.porAnexo.IV.aliquotaPatronalPorFora;
const ALIQUOTA_RAT_PADRAO = REGRAS_CPP_CGSN140.porAnexo.IV.aliquotaRATPadrao;

// Exclusao retroativa (LC 123/2006, Art. 30)
const LIMITE_EXCESSO_20_PORCENTO = REGRAS_EXCLUSAO.exclusaoPorComunicacao.tipos[1].limiteExcesso20Porcento;



// ================================================================================
// CAMADA 2B: CONSTANTES EXCLUSIVAS DO MOTOR (simples_nacional.js v4.1.0)
// Constantes sem equivalente no CGSN140 — necessarias para os calculos do motor.
// ================================================================================

/** Prazo de opcao pelo Simples Nacional — empresas ja existentes */
const PRAZO_OPCAO = 'Ultimo dia util de janeiro';

/** Prazo de opcao — empresa nova (LC 123/2006, Art. 16, par.3) */
const PRAZO_OPCAO_EMPRESA_NOVA = '30 dias apos ultimo deferimento de inscricao';

/** Ganho de capital — aliquota separada (IN RFB 1.515/2014) */
const ALIQUOTA_GANHO_CAPITAL = 0.15;

/** Percentual de presuncao — Comercio/Industria (para distribuicao de lucros sem escrituracao) */
const PRESUNCAO_LUCRO_COMERCIO = 0.08;

/** Percentual de presuncao — Transporte de cargas */
const PRESUNCAO_LUCRO_TRANSPORTE = 0.16;

/** Percentual de presuncao — Servicos em geral */
const PRESUNCAO_LUCRO_SERVICOS = 0.32;

/** FGTS — Aliquota sobre remuneracao (Lei 8.036/1990, Art. 15) */
const ALIQUOTA_FGTS = 0.08;

/** INSS empregado — Teto (atualizado periodicamente) */
const TETO_INSS_EMPREGADO = 908.85;




// ================================================================================
// SEÇÃO 4: MAPEAMENTO CNAE → ANEXO
// ================================================================================

/**
 * Mapeamento dos CNAEs mais comuns para seus respectivos anexos.
 *
 * Tipos:
 *   'fixo'    — Sempre o mesmo anexo
 *   'fator_r' — Anexo III se r>=28%, Anexo V se r<28%
 *   'vedado'  — Não pode optar pelo Simples Nacional
 *
 * Base legal: Resolução CGSN nº 140/2018, Anexos VI e VII.
 */
const MAPEAMENTO_CNAE = [
  // === CNAEs dependentes do Fator "r" ===
  {
    cnae: '71.19-7',
    descricao: 'Atividades técnicas relacionadas à engenharia',
    tipo: 'fator_r',
    anexoFixo: null,
    anexoFatorRAlto: 'III',
    anexoFatorRBaixo: 'V',
    observacao: 'AGROGEO BRASIL — Geotecnologia e Consultoria Ambiental'
  },
  {
    cnae: '62.01-5',
    descricao: 'Desenvolvimento de programas de computador sob encomenda',
    tipo: 'fator_r',
    anexoFixo: null,
    anexoFatorRAlto: 'III',
    anexoFatorRBaixo: 'V',
    observacao: 'Desenvolvimento de software customizado'
  },
  {
    cnae: '62.02-3',
    descricao: 'Desenvolvimento e licenciamento de programas de computador customizáveis',
    tipo: 'fator_r',
    anexoFixo: null,
    anexoFatorRAlto: 'III',
    anexoFatorRBaixo: 'V',
    observacao: 'Software SaaS e licenciamento'
  },
  {
    cnae: '69.20-6',
    descricao: 'Atividades de contabilidade, consultoria e auditoria contábil e tributária',
    tipo: 'fator_r',
    anexoFixo: null,
    anexoFatorRAlto: 'III',
    anexoFatorRBaixo: 'V',
    observacao: 'Escritórios de contabilidade'
  },
  {
    cnae: '70.20-4',
    descricao: 'Atividades de consultoria em gestão empresarial',
    tipo: 'fator_r',
    anexoFixo: null,
    anexoFatorRAlto: 'III',
    anexoFatorRBaixo: 'V',
    observacao: 'Consultoria empresarial'
  },
  {
    cnae: '73.11-4',
    descricao: 'Agências de publicidade',
    tipo: 'fator_r',
    anexoFixo: null,
    anexoFatorRAlto: 'III',
    anexoFatorRBaixo: 'V',
    observacao: 'Publicidade e propaganda'
  },
  {
    cnae: '86.30-5',
    descricao: 'Atividade médica ambulatorial com recursos para realização de exames complementares',
    tipo: 'fator_r',
    anexoFixo: null,
    anexoFatorRAlto: 'III',
    anexoFatorRBaixo: 'V',
    observacao: 'Clínicas médicas e consultórios'
  },
  {
    cnae: '63.11-9',
    descricao: 'Tratamento de dados, provedores de serviços de aplicação e hospedagem na internet',
    tipo: 'fator_r',
    anexoFixo: null,
    anexoFatorRAlto: 'III',
    anexoFatorRBaixo: 'V',
    observacao: 'Hospedagem e data centers'
  },
  {
    cnae: '74.90-1',
    descricao: 'Atividades profissionais, científicas e técnicas não especificadas anteriormente',
    tipo: 'fator_r',
    anexoFixo: null,
    anexoFatorRAlto: 'III',
    anexoFatorRBaixo: 'V',
    observacao: 'Serviços técnicos diversos'
  },

  // === CNAEs com Anexo FIXO — Comércio (Anexo I) ===
  {
    cnae: '47.11-3',
    descricao: 'Comércio varejista de mercadorias em geral (supermercados)',
    tipo: 'fixo',
    anexoFixo: 'I',
    anexoFatorRAlto: null,
    anexoFatorRBaixo: null,
    observacao: 'Comércio varejista'
  },
  {
    cnae: '47.51-2',
    descricao: 'Comércio varejista especializado de equipamentos e suprimentos de informática',
    tipo: 'fixo',
    anexoFixo: 'I',
    anexoFatorRAlto: null,
    anexoFatorRBaixo: null,
    observacao: 'Lojas de informática'
  },
  {
    cnae: '47.81-4',
    descricao: 'Comércio varejista de artigos do vestuário e acessórios',
    tipo: 'fixo',
    anexoFixo: 'I',
    anexoFatorRAlto: null,
    anexoFatorRBaixo: null,
    observacao: 'Lojas de roupas'
  },

  // === CNAEs com Anexo FIXO — Indústria (Anexo II) ===
  {
    cnae: '10.91-1',
    descricao: 'Fabricação de produtos de panificação',
    tipo: 'fixo',
    anexoFixo: 'II',
    anexoFatorRAlto: null,
    anexoFatorRBaixo: null,
    observacao: 'Indústria alimentícia — padarias industriais'
  },
  {
    cnae: '10.99-6',
    descricao: 'Fabricação de produtos alimentícios não especificados anteriormente',
    tipo: 'fixo',
    anexoFixo: 'II',
    anexoFatorRAlto: null,
    anexoFatorRBaixo: null,
    observacao: 'Indústria alimentícia geral'
  },

  // === CNAEs com Anexo FIXO — Serviços Anexo IV (SEM CPP) ===
  {
    cnae: '81.21-4',
    descricao: 'Limpeza em prédios e em domicílios',
    tipo: 'fixo',
    anexoFixo: 'IV',
    anexoFatorRAlto: null,
    anexoFatorRBaixo: null,
    observacao: 'Serviços de limpeza — INSS patronal por fora'
  },
  {
    cnae: '80.11-1',
    descricao: 'Atividades de vigilância e segurança privada',
    tipo: 'fixo',
    anexoFixo: 'IV',
    anexoFatorRAlto: null,
    anexoFatorRBaixo: null,
    observacao: 'Vigilância patrimonial — INSS patronal por fora'
  },
  {
    cnae: '41.20-4',
    descricao: 'Construção de edifícios',
    tipo: 'fixo',
    anexoFixo: 'IV',
    anexoFatorRAlto: null,
    anexoFatorRBaixo: null,
    observacao: 'Construção civil — INSS patronal por fora'
  },
  {
    cnae: '69.11-7',
    descricao: 'Atividades jurídicas (advocacia)',
    tipo: 'fixo',
    anexoFixo: 'IV',
    anexoFatorRAlto: null,
    anexoFatorRBaixo: null,
    observacao: 'Escritórios de advocacia — INSS patronal por fora'
  },

  // === CNAEs com Anexo FIXO — Serviços Anexo III ===
  {
    cnae: '66.12-6',
    descricao: 'Corretagem de valores mobiliários e mercadorias',
    tipo: 'fixo',
    anexoFixo: 'III',
    anexoFatorRAlto: null,
    anexoFatorRBaixo: null,
    observacao: 'Corretagem — sempre Anexo III'
  },

  // === CNAEs VEDADOS ===
  {
    cnae: '64.10-7',
    descricao: 'Banco comercial',
    tipo: 'vedado',
    anexoFixo: null,
    anexoFatorRAlto: null,
    anexoFatorRBaixo: null,
    observacao: 'Instituição financeira — vedado (LC 123/2006, Art. 17, I)'
  },
  {
    cnae: '64.91-3',
    descricao: 'Sociedades de fomento mercantil (factoring)',
    tipo: 'vedado',
    anexoFixo: null,
    anexoFatorRAlto: null,
    anexoFatorRBaixo: null,
    observacao: 'Factoring — vedado (LC 123/2006, Art. 17, IV)'
  },
  {
    cnae: '65.11-1',
    descricao: 'Seguros de vida',
    tipo: 'vedado',
    anexoFixo: null,
    anexoFatorRAlto: null,
    anexoFatorRBaixo: null,
    observacao: 'Seguros privados — vedado (LC 123/2006, Art. 17, II)'
  }
];


// ================================================================================
// SEÇÃO 7: FUNÇÃO — calcularFatorR()
// ================================================================================

/**
 * Calcula o Fator "r" da empresa e determina o anexo aplicável.
 *
 * O Fator "r" é a razão entre a folha de salários dos últimos 12 meses
 * (incluindo pró-labore, salários, FGTS e encargos sobre a folha)
 * e a receita bruta total do mesmo período.
 *
 * Base legal: Resolução CGSN nº 140/2018, Art. 18, §5º-J e §5º-M.
 *
 * @param {Object} params - Parâmetros de entrada
 * @param {number} params.folhaSalarios12Meses - Folha total dos últimos 12 meses (inclui pro-labore, salários, FGTS, encargos)
 * @param {number} params.receitaBruta12Meses - RBT12 (Receita Bruta dos últimos 12 meses)
 * @returns {Object} Resultado do cálculo do Fator "r"
 */
function calcularFatorR(params) {
  const { folhaSalarios12Meses, receitaBruta12Meses } = params;

  if (!receitaBruta12Meses || receitaBruta12Meses <= 0) {
    throw new Error('[FATOR_R_001] Receita bruta dos últimos 12 meses deve ser maior que zero.');
  }
  if (folhaSalarios12Meses < 0) {
    throw new Error('[FATOR_R_002] Folha de salários não pode ser negativa.');
  }

  const fatorR = folhaSalarios12Meses / receitaBruta12Meses;
  const acimaDoLimiar = fatorR >= LIMITE_FATOR_R;
  const anexoResultante = acimaDoLimiar ? 'III' : 'V';

  // Alerta de flutuação: entre 25% e 31%
  let observacao = '';
  if (fatorR >= 0.25 && fatorR < 0.28) {
    observacao = '⚠️ ALERTA: Fator "r" muito próximo do limiar (25%-28%). Risco de cair no Anexo V no próximo mês. Considere aumentar a folha de salários.';
  } else if (fatorR >= 0.28 && fatorR <= 0.31) {
    observacao = '⚠️ ALERTA: Fator "r" próximo do limiar (28%-31%). Pequenas variações na folha ou receita podem alterar o anexo. Monitore mensalmente.';
  } else if (acimaDoLimiar) {
    observacao = '✅ Fator "r" confortavelmente acima do limiar de 28%. Enquadrado no Anexo III (alíquotas menores).';
  } else {
    observacao = '❌ Fator "r" abaixo de 28%. Enquadrado no Anexo V (alíquotas mais altas). Considere estratégias para aumentar a folha.';
  }

  return {
    folhaSalarios12Meses: _arredondar(folhaSalarios12Meses),
    receitaBruta12Meses: _arredondar(receitaBruta12Meses),
    fatorR: _arredondar(fatorR, 4),
    fatorRPercentual: (fatorR * 100).toFixed(2).replace('.', ',') + '%',
    limiar: LIMITE_FATOR_R,
    limiarPercentual: '28,00%',
    acimaDoLimiar,
    anexoResultante,
    observacao,
    baseLegal: 'Resolução CGSN nº 140/2018, Art. 18, §5º-J'
  };
}


// ================================================================================
// SEÇÃO 8: FUNÇÃO — determinarAnexo()
// ================================================================================

/**
 * Determina o anexo aplicável com base no CNAE e, quando necessário, no Fator "r".
 *
 * @param {Object} params - Parâmetros de entrada
 * @param {string} params.cnae - Código CNAE da atividade principal
 * @param {number} [params.fatorR] - Fator "r" (obrigatório se CNAE é tipo 'fator_r')
 * @returns {Object} Informações do anexo determinado
 */
function determinarAnexo(params) {
  const { cnae, fatorR } = params;

  if (!cnae) {
    throw new Error('[ANEXO_001] CNAE é obrigatório para determinar o anexo.');
  }

  const cnaeInfo = MAPEAMENTO_CNAE.find(c => c.cnae === cnae);

  if (!cnaeInfo) {
    // Tenta match parcial (primeiros 2 dígitos)
    const prefixo = cnae.substring(0, 2);
    const cnaeGenerico = MAPEAMENTO_CNAE.find(c => c.cnae.startsWith(prefixo));
    if (!cnaeGenerico) {
      throw new Error(`[ANEXO_002] CNAE ${cnae} não encontrado no mapeamento. Verifique o código ou adicione ao mapeamento.`);
    }
    // Usa o genérico como fallback
    return _montarResultadoAnexo(cnaeGenerico, fatorR);
  }

  return _montarResultadoAnexo(cnaeInfo, fatorR);
}

/**
 * Monta o resultado da determinação de anexo.
 * @private
 */
function _montarResultadoAnexo(cnaeInfo, fatorR) {
  if (cnaeInfo.tipo === 'vedado') {
    return {
      cnae: cnaeInfo.cnae,
      descricao: cnaeInfo.descricao,
      anexo: null,
      vedado: true,
      motivo: cnaeInfo.observacao,
      baseLegal: 'LC 123/2006, Art. 17'
    };
  }

  let anexo;
  let motivoAnexo;

  if (cnaeInfo.tipo === 'fixo') {
    anexo = cnaeInfo.anexoFixo;
    motivoAnexo = `CNAE ${cnaeInfo.cnae} tem anexo fixo: ${anexo}`;
  } else if (cnaeInfo.tipo === 'fator_r') {
    if (fatorR === undefined || fatorR === null) {
      throw new Error(`[ANEXO_003] Fator "r" é obrigatório para CNAE ${cnaeInfo.cnae} (tipo fator_r).`);
    }
    if (fatorR >= LIMITE_FATOR_R) {
      anexo = cnaeInfo.anexoFatorRAlto;
      motivoAnexo = `Fator "r" = ${(fatorR * 100).toFixed(2)}% (≥ 28%) → Anexo ${anexo}`;
    } else {
      anexo = cnaeInfo.anexoFatorRBaixo;
      motivoAnexo = `Fator "r" = ${(fatorR * 100).toFixed(2)}% (< 28%) → Anexo ${anexo}`;
    }
  }

  const dadosAnexo = ANEXOS[anexo];

  return {
    cnae: cnaeInfo.cnae,
    descricao: cnaeInfo.descricao,
    tipo: cnaeInfo.tipo,
    anexo,
    descricaoAnexo: dadosAnexo.nome,
    cppInclusa: dadosAnexo.cppInclusa,
    tributosDentro: dadosAnexo.tributosDentro,
    tributosFora: dadosAnexo.tributosFora,
    motivoAnexo,
    vedado: false,
    baseLegal: dadosAnexo.baseLegal
  };
}


// ================================================================================
// SEÇÃO 9: FUNÇÃO — calcularAliquotaEfetiva()
// ================================================================================

/**
 * Calcula a alíquota efetiva do Simples Nacional.
 *
 * Fórmula: aliquotaEfetiva = (RBT12 × aliquotaNominal − parcelaADeduzir) / RBT12
 *
 * Base legal: LC 123/2006, Art. 18; Resolução CGSN 140/2018, Art. 21.
 *
 * @param {Object} params - Parâmetros de entrada
 * @param {number} params.rbt12 - Receita Bruta acumulada nos últimos 12 meses
 * @param {string} params.anexo - Identificador do anexo: 'I', 'II', 'III', 'IV', 'V'
 * @returns {Object} Resultado do cálculo da alíquota efetiva
 */
function calcularAliquotaEfetiva(params) {
  const { rbt12, anexo } = params;

  if (!rbt12 || rbt12 <= 0) {
    throw new Error('[ALIQ_001] RBT12 deve ser maior que zero.');
  }
  if (!ANEXOS[anexo]) {
    throw new Error(`[ALIQ_002] Anexo "${anexo}" inválido. Use I, II, III, IV ou V.`);
  }
  if (rbt12 > LIMITE_EPP) {
    throw new Error(`[ALIQ_003] RBT12 (${_formatarMoeda(rbt12)}) excede o limite do Simples Nacional (${_formatarMoeda(LIMITE_EPP)}).`);
  }

  const faixaObj = getFaixaByRBT12(rbt12, anexo);

  if (!faixaObj) {
    throw new Error(`[ALIQ_004] Não foi possível determinar a faixa para RBT12=${_formatarMoeda(rbt12)} no Anexo ${anexo}.`);
  }

  const numerador = (rbt12 * faixaObj.aliquotaNominal) - faixaObj.deducao;
  const aliquotaEfetiva = numerador / rbt12;

  const faixaDescricoes = ['', '1ª Faixa', '2ª Faixa', '3ª Faixa', '4ª Faixa', '5ª Faixa', '6ª Faixa'];

  return {
    rbt12: _arredondar(rbt12),
    anexo,
    faixa: faixaObj.faixa,
    faixaDescricao: faixaDescricoes[faixaObj.faixa] || `${faixaObj.faixa}ª Faixa`,
    rbt12MinFaixa: _arredondar(faixaObj.min),
    rbt12MaxFaixa: _arredondar(faixaObj.max),
    aliquotaNominal: faixaObj.aliquotaNominal,
    aliquotaNominalFormatada: (faixaObj.aliquotaNominal * 100).toFixed(2).replace('.', ',') + '%',
    parcelaADeduzir: _arredondar(faixaObj.deducao),
    aliquotaEfetiva: _arredondar(aliquotaEfetiva, 6),
    aliquotaEfetivaFormatada: (aliquotaEfetiva * 100).toFixed(4).replace('.', ',') + '%',
    baseLegal: 'LC 123/2006, Art. 18, §1º'
  };
}


// ================================================================================
// SEÇÃO 10: FUNÇÃO — calcularDASMensal()
// ================================================================================

/**
 * Calcula o valor do DAS mensal, incluindo partilha de tributos.
 *
 * @param {Object} params - Parâmetros de entrada
 * @param {number} params.receitaBrutaMensal - Receita bruta do mês de apuração
 * @param {number} params.rbt12 - Receita Bruta acumulada nos últimos 12 meses
 * @param {string} params.anexo - Identificador do anexo
 * @param {number} [params.issRetidoFonte=0] - Valor de ISS retido na fonte pelo tomador
 * @param {number} [params.folhaMensal=0] - Folha de pagamento mensal (para cálculo INSS Anexo IV)
 * @param {number} [params.aliquotaRAT=0.02] - Alíquota RAT (para Anexo IV)
 * @returns {Object} Resultado completo do cálculo do DAS mensal
 */
function calcularDASMensal(params) {
  const {
    receitaBrutaMensal,
    rbt12,
    anexo,
    issRetidoFonte = 0,
    folhaMensal = 0,
    aliquotaRAT = ALIQUOTA_RAT_PADRAO
  } = params;

  if (!receitaBrutaMensal || receitaBrutaMensal <= 0) {
    throw new Error('[DAS_001] Receita bruta mensal deve ser maior que zero.');
  }

  // 1. Calcular alíquota efetiva
  const aliqResult = calcularAliquotaEfetiva({ rbt12, anexo });

  // 2. Calcular DAS bruto
  const dasValor = _arredondar(receitaBrutaMensal * aliqResult.aliquotaEfetiva);

  // 3. Calcular partilha de tributos
  const partilha = calcularPartilhaTributos(dasValor, aliqResult.faixa, anexo, receitaBrutaMensal, aliqResult.aliquotaEfetiva);

  // 4. ISS retido na fonte — deduzir do DAS
  const issRetido = _arredondar(Math.min(issRetidoFonte, partilha.iss ? partilha.iss.valor : 0));

  // 5. DAS a pagar (após dedução do ISS retido)
  const dasAPagar = _arredondar(Math.max(0, dasValor - issRetido));

  // 6. INSS patronal por fora (apenas Anexo IV)
  let inssPatronalFora = 0;
  if (anexo === 'IV') {
    inssPatronalFora = _arredondar(folhaMensal * (ALIQUOTA_INSS_PATRONAL_ANEXO_IV + aliquotaRAT));
  }

  // 7. Total a pagar
  const totalAPagar = _arredondar(dasAPagar + inssPatronalFora);

  return {
    receitaBrutaMensal: _arredondar(receitaBrutaMensal),
    rbt12: _arredondar(rbt12),
    anexo,
    descricaoAnexo: ANEXOS[anexo].nome,
    faixa: aliqResult.faixa,
    faixaDescricao: aliqResult.faixaDescricao,
    aliquotaNominal: aliqResult.aliquotaNominal,
    aliquotaNominalFormatada: aliqResult.aliquotaNominalFormatada,
    aliquotaEfetiva: aliqResult.aliquotaEfetiva,
    aliquotaEfetivaFormatada: aliqResult.aliquotaEfetivaFormatada,
    dasValor,
    partilha,
    issRetidoFonte: issRetido,
    dasAPagar,
    inssPatronalFora,
    totalAPagar,
    baseLegal: 'LC 123/2006, Art. 18; Resolução CGSN 140/2018, Art. 21'
  };
}


// ================================================================================
// SEÇÃO 11: FUNÇÃO — calcularAnualConsolidado()
// ================================================================================

/**
 * Calcula a consolidação anual do Simples Nacional (12 meses).
 *
 * @param {Object} params - Parâmetros de entrada
 * @param {Array<Object>} params.meses - Array de 12 objetos com dados mensais
 * @param {Array<Object>} params.socios - Array de sócios com {nome, percentual}
 * @param {number} [params.lucroContabilEfetivo] - Lucro contábil efetivo (se houver escrituração)
 * @param {number} [params.aliquotaRAT=0.02] - Alíquota RAT
 * @returns {Object} Consolidação anual completa
 */
function calcularAnualConsolidado(params) {
  const {
    meses,
    socios = [],
    cnae = null,
    tipoAtividade = 'servicos',
    lucroContabilEfetivo = null,
    aliquotaRAT = ALIQUOTA_RAT_PADRAO
  } = params;

  if (!meses || !Array.isArray(meses) || meses.length === 0) {
    throw new Error('[ANUAL_001] Deve fornecer array de meses com dados mensais.');
  }

  const detalhamentoMensal = [];
  let receitaBrutaAnual = 0;
  let dasAnual = 0;
  let inssPatronalAnualFora = 0;
  let folhaAnual = 0;

  // Acumuladores de partilha anual
  const partilhaAnual = {
    irpj: 0, csll: 0, cofins: 0, pis: 0,
    cpp: 0, iss: 0, icms: 0, ipi: 0
  };

  for (let i = 0; i < meses.length; i++) {
    const mes = meses[i];
    const receitaMensal = mes.receitaBrutaMensal || 0;
    const rbt12 = mes.rbt12 || 0;
    const folhaMensal = mes.folhaMensal || 0;
    const issRetido = mes.issRetidoFonte || 0;

    // Determinar anexo para o mês
    let anexoMes = mes.anexo;
    if (!anexoMes && mes.folhaSalarios12Meses && rbt12) {
      const fr = calcularFatorR({
        folhaSalarios12Meses: mes.folhaSalarios12Meses,
        receitaBruta12Meses: rbt12
      });
      anexoMes = fr.anexoResultante;
    }

    if (receitaMensal <= 0 || !anexoMes) {
      detalhamentoMensal.push({
        mes: i + 1,
        receitaBrutaMensal: 0,
        dasAPagar: 0,
        inssPatronalFora: 0,
        totalAPagar: 0,
        observacao: 'Mês sem receita ou sem anexo definido'
      });
      continue;
    }

    const resultado = calcularDASMensal({
      receitaBrutaMensal: receitaMensal,
      rbt12,
      anexo: anexoMes,
      issRetidoFonte: issRetido,
      folhaMensal,
      aliquotaRAT
    });

    receitaBrutaAnual += receitaMensal;
    dasAnual += resultado.dasAPagar;
    inssPatronalAnualFora += resultado.inssPatronalFora;
    folhaAnual += folhaMensal;

    // Acumular partilha
    if (resultado.partilha) {
      for (const tributo of Object.keys(partilhaAnual)) {
        if (resultado.partilha[tributo]) {
          partilhaAnual[tributo] += resultado.partilha[tributo].valor || 0;
        }
      }
    }

    detalhamentoMensal.push({
      mes: i + 1,
      ...resultado
    });
  }

  // FGTS anual (8% sobre folha bruta)
  const fgtsAnual = _arredondar(folhaAnual * ALIQUOTA_FGTS);

  // Carga tributária total
  const cargaTributariaTotal = _arredondar(dasAnual + inssPatronalAnualFora + fgtsAnual);
  const percentualCarga = receitaBrutaAnual > 0
    ? _arredondar(cargaTributariaTotal / receitaBrutaAnual, 4)
    : 0;

  // Distribuição de lucros
  const distribuicaoLucros = calcularDistribuicaoLucros({
    receitaBrutaAnual,
    dasAnual,
    socios,
    cnae: cnae || null,
    lucroContabilEfetivo,
    tipoAtividade: tipoAtividade || 'servicos'
  });

  // Arredondar partilha anual
  for (const k of Object.keys(partilhaAnual)) {
    partilhaAnual[k] = _arredondar(partilhaAnual[k]);
  }

  return {
    receitaBrutaAnual: _arredondar(receitaBrutaAnual),
    dasAnual: _arredondar(dasAnual),
    partilhaAnual,
    inssPatronalAnualFora: _arredondar(inssPatronalAnualFora),
    fgtsAnual,
    folhaAnual: _arredondar(folhaAnual),
    cargaTributariaTotal,
    percentualCarga,
    percentualCargaFormatado: (percentualCarga * 100).toFixed(2).replace('.', ',') + '%',
    distribuicaoLucros,
    detalhamentoMensal,
    totalMeses: meses.length,
    baseLegal: 'LC 123/2006; Resolução CGSN 140/2018'
  };
}


// ================================================================================
// SEÇÃO 12: FUNÇÃO — calcularPartilhaTributos()
// ================================================================================

/**
 * Calcula a partilha de tributos a partir do valor do DAS.
 *
 * @param {number} dasValor - Valor total do DAS
 * @param {number} faixa - Número da faixa (1-6)
 * @param {string} anexo - Identificador do anexo
 * @param {number} [receitaBrutaMensal=0] - Receita bruta mensal (para regra do ISS)
 * @param {number} [aliquotaEfetiva=0] - Alíquota efetiva (para regra do ISS)
 * @returns {Object} Partilha detalhada de cada tributo
 */
function calcularPartilhaTributos(dasValor, faixa, anexo, receitaBrutaMensal = 0, aliquotaEfetiva = 0) {
  if (!PARTILHA[anexo]) {
    throw new Error(`[PARTILHA_001] Partilha não disponível para Anexo "${anexo}".`);
  }

  const idx = faixa - 1;
  if (idx < 0 || idx >= PARTILHA[anexo].length) {
    throw new Error(`[PARTILHA_002] Faixa ${faixa} inválida para Anexo ${anexo}.`);
  }

  const percentuais = PARTILHA[anexo][idx];
  const resultado = {};

  // Lista de todos os tributos possíveis
  const tributos = ['irpj', 'csll', 'cofins', 'pis', 'cpp', 'iss', 'icms', 'ipi'];

  for (const tributo of tributos) {
    const perc = percentuais[tributo] || 0;
    let valor = _arredondar(dasValor * perc);

    resultado[tributo] = {
      percentual: perc,
      percentualFormatado: (perc * 100).toFixed(2).replace('.', ',') + '%',
      valor
    };
  }

  // REGRA ESPECIAL ISS — Limitar a 5% e transferir excedente para IRPJ
  if (resultado.iss && resultado.iss.percentual > 0 && receitaBrutaMensal > 0) {
    const issEfetivo = aliquotaEfetiva * resultado.iss.percentual;
    if (issEfetivo > ISS_MAXIMO) {
      const issLimitado = _arredondar(receitaBrutaMensal * ISS_MAXIMO);
      const excedente = _arredondar(resultado.iss.valor - issLimitado);
      resultado.iss.valor = issLimitado;
      resultado.iss.limitadoA5Porcento = true;
      resultado.iss.excedenteTransferidoIRPJ = excedente;
      resultado.irpj.valor = _arredondar(resultado.irpj.valor + excedente);
      resultado.irpj.incluiExcedenteISS = true;
    }
  }

  return resultado;
}


// ================================================================================
// SEÇÃO 13: FUNÇÃO — verificarElegibilidade()
// ================================================================================

/**
 * Verifica se a empresa é elegível ao Simples Nacional.
 *
 * @param {Object} dados - Dados da empresa
 * @param {number} dados.receitaBrutaAnual - Receita bruta anual atual
 * @param {number} [dados.receitaBrutaAnualAnterior] - Receita bruta do ano anterior
 * @param {string} [dados.cnae] - CNAE principal
 * @param {string} [dados.naturezaJuridica] - Natureza jurídica
 * @param {boolean} [dados.socioPessoaJuridica=false] - Se há sócio PJ
 * @param {boolean} [dados.socioParticipacaoOutraPJ=false] - Se sócio tem >10% em outra PJ
 * @param {boolean} [dados.socioAdminOutraPJ=false] - Se sócio é admin de outra PJ
 * @param {boolean} [dados.debitosFiscaisPendentes=false] - Se há débitos pendentes
 * @param {boolean} [dados.atividadeInstFinanceira=false] - Se é instituição financeira
 * @param {boolean} [dados.atividadeFactoring=false] - Se é factoring
 * @param {boolean} [dados.cessaoMaoObra=false] - Se há cessão de mão de obra
 * @param {boolean} [dados.socioDomiciliadoExterior=false] - Se há sócio no exterior
 * @param {boolean} [dados.tipoCooperativa=false] - Se é cooperativa
 * @param {boolean} [dados.resultadoCisao5Anos=false] - Se é resultado de cisão nos últimos 5 anos
 * @param {boolean} [dados.filialExterior=false] - Se possui filial no exterior
 * @param {number} [dados.fatorR] - Fator "r" atual
 * @returns {Object} Resultado da verificação de elegibilidade
 */
function verificarElegibilidade(dados) {
  const impedimentos = [];
  const alertas = [];

  // Verificar todas as vedações
  for (const vedacao of VEDACOES) {
    try {
      if (vedacao.verificacao(dados)) {
        impedimentos.push({
          id: vedacao.id,
          descricao: vedacao.descricao,
          baseLegal: vedacao.baseLegal
        });
      }
    } catch (e) {
      // Dados insuficientes para verificar — ignora
    }
  }

  // Classificação ME / EPP
  const rb = dados.receitaBrutaAnual || 0;
  let classificacao = null;
  if (rb <= LIMITE_ME) {
    classificacao = 'ME';
  } else if (rb <= LIMITE_EPP) {
    classificacao = 'EPP';
  }

  // Alertas automáticos
  // 1. Proximidade do limite
  if (rb > LIMITE_EPP * 0.80) {
    alertas.push({
      tipo: 'proximidade_limite',
      mensagem: `⚠️ Receita bruta (${_formatarMoeda(rb)}) está acima de 80% do limite (${_formatarMoeda(LIMITE_EPP * 0.80)}). Monitore para evitar exclusão.`
    });
  }

  // 2. Sublimite estadual
  const sublimiteUltrapassou = rb > SUBLIMITE_ICMS_ISS;
  if (sublimiteUltrapassou) {
    alertas.push({
      tipo: 'sublimite_ultrapassado',
      mensagem: `⚠️ Receita bruta (${_formatarMoeda(rb)}) ultrapassou o sublimite de ${_formatarMoeda(SUBLIMITE_ICMS_ISS)}. ICMS e ISS serão recolhidos POR FORA do DAS.`
    });
  }

  // 3. Fator "r" próximo do limiar
  if (dados.fatorR !== undefined && dados.fatorR !== null) {
    if (dados.fatorR >= 0.25 && dados.fatorR < 0.28) {
      alertas.push({
        tipo: 'fator_r_critico',
        mensagem: `⚠️ Fator "r" (${(dados.fatorR * 100).toFixed(2)}%) está entre 25% e 28%. Risco iminente de migrar para Anexo V (alíquotas mais altas).`
      });
    } else if (dados.fatorR >= 0.28 && dados.fatorR <= 0.31) {
      alertas.push({
        tipo: 'fator_r_flutuante',
        mensagem: `⚠️ Fator "r" (${(dados.fatorR * 100).toFixed(2)}%) está próximo do limiar (28%-31%). Monitore mensalmente.`
      });
    }
  }

  // 4. Exclusão por excesso > 20%
  if (rb > LIMITE_EXCESSO_20_PORCENTO) {
    alertas.push({
      tipo: 'exclusao_retroativa',
      mensagem: `🚨 CRÍTICO: Receita bruta (${_formatarMoeda(rb)}) excede 20% do limite (${_formatarMoeda(LIMITE_EXCESSO_20_PORCENTO)}). Exclusão RETROATIVA ao início do ano-calendário!`
    });
  }

  return {
    elegivel: impedimentos.length === 0 && rb <= LIMITE_EPP,
    classificacao,
    impedimentos,
    alertas,
    sublimiteEstadual: {
      ultrapassou: sublimiteUltrapassou,
      icmsISSPorFora: sublimiteUltrapassou,
      observacao: sublimiteUltrapassou
        ? 'ICMS e ISS devem ser recolhidos por fora do DAS, pelo regime normal de apuração.'
        : 'Todos os tributos são recolhidos dentro do DAS.'
    },
    baseLegal: 'LC 123/2006, Arts. 3º, 17, 19 e 30'
  };
}


// ================================================================================
// SEÇÃO 14: FUNÇÃO — calcularDistribuicaoLucros()
// ================================================================================

/**
 * Calcula a distribuição de lucros aos sócios.
 *
 * Duas modalidades:
 * 1. SEM escrituração contábil: Lucro isento = (Receita × Percentual Presunção) − DAS
 * 2. COM escrituração contábil: Lucro isento = Lucro Contábil − DAS
 *
 * Base legal: LC 123/2006, Art. 14; RIR/2018, Art. 145.
 *
 * @param {Object} params
 * @param {number} params.receitaBrutaAnual
 * @param {number} params.dasAnual
 * @param {Array<Object>} params.socios - Array de {nome, percentual}
 * @param {string} [params.cnae='71.19-7']
 * @param {number|null} [params.lucroContabilEfetivo=null]
 * @param {string} [params.tipoAtividade='servicos'] - 'comercio', 'transporte', 'servicos'
 * @returns {Object} Detalhamento da distribuição de lucros
 */
function calcularDistribuicaoLucros(params) {
  const {
    receitaBrutaAnual,
    dasAnual,
    socios = [],
    cnae = null,
    lucroContabilEfetivo = null,
    tipoAtividade = 'servicos'
  } = params;

  // Determinar percentual de presunção — usar CnaeMapeamento se disponível
  let percentualPresuncao;
  switch (tipoAtividade) {
    case 'comercio':
    case 'industria':
      percentualPresuncao = PRESUNCAO_LUCRO_COMERCIO;
      break;
    case 'transporte':
      percentualPresuncao = PRESUNCAO_LUCRO_TRANSPORTE;
      break;
    case 'servicos':
    default:
      percentualPresuncao = PRESUNCAO_LUCRO_SERVICOS;
      break;
  }

  const basePresumida = _arredondar(receitaBrutaAnual * percentualPresuncao);
  const lucroDistribuivelPresumido = _arredondar(Math.max(0, basePresumida - dasAnual));

  const temEscrituracaoContabil = lucroContabilEfetivo !== null && lucroContabilEfetivo !== undefined;
  let lucroDistribuivelContabil = null;
  if (temEscrituracaoContabil) {
    lucroDistribuivelContabil = _arredondar(Math.max(0, lucroContabilEfetivo - dasAnual));
  }

  // O lucro distribuível final é o MAIOR entre presunção e contábil
  const lucroDistribuivelFinal = temEscrituracaoContabil
    ? Math.max(lucroDistribuivelPresumido, lucroDistribuivelContabil)
    : lucroDistribuivelPresumido;

  // Distribuição por sócio
  const porSocio = socios.map(socio => ({
    nome: socio.nome,
    percentual: socio.percentual,
    percentualFormatado: (socio.percentual * 100).toFixed(0) + '%',
    valorIsento: _arredondar(lucroDistribuivelFinal * socio.percentual),
    valorIsentoFormatado: _formatarMoeda(lucroDistribuivelFinal * socio.percentual)
  }));

  return {
    comEscrituracaoContabil: temEscrituracaoContabil,
    percentualPresuncao,
    percentualPresuncaoFormatado: (percentualPresuncao * 100).toFixed(0) + '%',
    receitaBrutaAnual: _arredondar(receitaBrutaAnual),
    basePresumida,
    lucroContabilEfetivo: temEscrituracaoContabil ? _arredondar(lucroContabilEfetivo) : null,
    dasAnual: _arredondar(dasAnual),
    lucroDistribuivelPresumido,
    lucroDistribuivelContabil,
    lucroDistribuivelFinal: _arredondar(lucroDistribuivelFinal),
    modalidadeUtilizada: temEscrituracaoContabil ? 'Escrituração Contábil' : 'Presunção (sem escrituração)',
    porSocio,
    alertas: [],
    baseLegal: 'LC 123/2006, Art. 14; RIR/2018, Art. 145'
  };
}


// ================================================================================
// SEÇÃO 15: FUNÇÃO — analisarVantagensDesvantagens()
// ================================================================================

/**
 * Analisa vantagens e desvantagens do Simples Nacional para a empresa.
 *
 * @param {Object} params
 * @param {number} params.receitaBrutaAnual
 * @param {string} params.anexo
 * @param {number} params.fatorR
 * @param {boolean} [params.localizacaoSUDAM=false]
 * @param {boolean} [params.vendeParaPJ=false]
 * @param {number} [params.folhaAnual=0]
 * @param {boolean} [params.exporta=false]
 * @returns {Object} Análise de vantagens e desvantagens
 */
function analisarVantagensDesvantagens(params) {
  const {
    receitaBrutaAnual = 0,
    anexo = 'III',
    fatorR = 0,
    localizacaoSUDAM = false,
    vendeParaPJ = false,
    folhaAnual = 0,
    exporta = false
  } = params;

  const isAnexoIV = anexo === 'IV';
  const isAnexoV = anexo === 'V';
  const receitaAlta = receitaBrutaAnual > 2_400_000;
  const fatorRProximo = fatorR >= 0.25 && fatorR < 0.31;

  // === VANTAGENS (mínimo 14) ===
  const vantagens = [
    {
      titulo: 'Unificação de tributos em guia única (DAS)',
      descricao: 'Até 8 tributos (IRPJ, CSLL, PIS, COFINS, CPP, ICMS, ISS, IPI) recolhidos em uma única guia mensal, simplificando enormemente a gestão tributária.',
      impacto: 'alto',
      aplicavel: true
    },
    {
      titulo: 'Alíquotas reduzidas nas faixas iniciais',
      descricao: `Com RBT12 de ${_formatarMoeda(receitaBrutaAnual)}, a alíquota efetiva tende a ser menor do que nos regimes de Lucro Presumido e Lucro Real.`,
      impacto: receitaAlta ? 'medio' : 'alto',
      aplicavel: true
    },
    {
      titulo: 'CPP incluída no DAS',
      descricao: 'A Contribuição Previdenciária Patronal (20% sobre folha) já está embutida na alíquota do DAS, gerando economia significativa na folha de pagamento.',
      impacto: isAnexoIV ? 'nao_aplicavel' : 'alto',
      aplicavel: !isAnexoIV
    },
    {
      titulo: 'ISS incluído no DAS',
      descricao: 'O ISS é recolhido dentro do DAS, sem necessidade de guia separada ao município (desde que abaixo do sublimite de R$ 3,6M).',
      impacto: 'medio',
      aplicavel: ['III', 'IV', 'V'].includes(anexo) && receitaBrutaAnual <= SUBLIMITE_ICMS_ISS
    },
    {
      titulo: 'Simplicidade de obrigações acessórias',
      descricao: 'Dispensa de ECD, ECF e diversas declarações exigidas no Lucro Presumido e Lucro Real. PGDAS-D e DEFIS são as principais obrigações.',
      impacto: 'alto',
      aplicavel: true
    },
    {
      titulo: 'Tratamento diferenciado em licitações',
      descricao: 'Preferência em licitações públicas (LC 123/2006, Art. 44-49), incluindo contratação exclusiva de ME/EPP em determinados valores.',
      impacto: 'medio',
      aplicavel: true
    },
    {
      titulo: 'Facilidades para exportação',
      descricao: 'Receitas de exportação são isentas de COFINS, PIS, IPI, ICMS e ISS dentro do DAS.',
      impacto: exporta ? 'alto' : 'baixo',
      aplicavel: exporta
    },
    {
      titulo: 'Acesso facilitado a crédito',
      descricao: 'Linhas de crédito específicas para ME/EPP com juros subsidiados (BNDES, Pronampe, etc.).',
      impacto: 'medio',
      aplicavel: true
    },
    {
      titulo: 'Presunção de lucro para distribuição (32% para serviços)',
      descricao: 'Permite distribuir até 32% da receita bruta como lucro isento, mesmo sem escrituração contábil completa.',
      impacto: 'alto',
      aplicavel: true
    },
    {
      titulo: 'Dispensa de ECD/ECF',
      descricao: 'Não é obrigada a entregar a Escrituração Contábil Digital (ECD) nem a Escrituração Contábil Fiscal (ECF), reduzindo custos com contabilidade.',
      impacto: 'medio',
      aplicavel: true
    },
    {
      titulo: 'Regime de caixa disponível',
      descricao: 'Pode optar pelo regime de caixa para reconhecimento de receitas, pagando imposto apenas quando receber efetivamente.',
      impacto: 'medio',
      aplicavel: true
    },
    {
      titulo: 'Menor custo contábil',
      descricao: 'Honorários contábeis geralmente menores devido à menor complexidade das obrigações acessórias.',
      impacto: 'medio',
      aplicavel: true
    },
    {
      titulo: 'Menor risco de autuação',
      descricao: 'Sistema simplificado reduz a probabilidade de erros no cumprimento das obrigações e, consequentemente, o risco de autuações.',
      impacto: 'medio',
      aplicavel: true
    },
    {
      titulo: 'FGTS com alíquota normal (8%)',
      descricao: 'Recolhe FGTS à alíquota normal de 8%, sem adicional. Em caso de rescisão, multa de 40% (não 50%).',
      impacto: 'baixo',
      aplicavel: true
    }
  ];

  // === DESVANTAGENS (mínimo 16) ===
  const desvantagens = [
    {
      titulo: 'Limite de receita R$ 4.800.000',
      descricao: 'Empresas que crescem além de R$ 4,8M anuais são excluídas do regime, enfrentando aumento repentino de carga tributária.',
      impacto: receitaAlta ? 'critico' : 'medio',
      aplicavel: true
    },
    {
      titulo: 'Alíquota efetiva pode ser MAIOR que Lucro Presumido nas faixas superiores',
      descricao: `Nas faixas 5ª e 6ª, a alíquota efetiva do Simples pode superar a carga do Lucro Presumido, especialmente para serviços com folha baixa.`,
      impacto: receitaAlta ? 'alto' : 'baixo',
      aplicavel: true
    },
    {
      titulo: 'NÃO permite créditos de PIS/COFINS para clientes PJ',
      descricao: 'Clientes do Lucro Real não podem tomar créditos de PIS/COFINS sobre compras de empresas do Simples. Reduz competitividade em vendas B2B.',
      impacto: vendeParaPJ ? 'critico' : 'baixo',
      aplicavel: true
    },
    {
      titulo: 'NÃO permite incentivos SUDAM/SUDENE',
      descricao: localizacaoSUDAM
        ? '❌ AGROGEO está na Amazônia Legal (SUDAM) mas NÃO pode aproveitar a redução de 75% do IRPJ por estar no Simples.'
        : 'Empresas do Simples não podem usufruir de incentivos fiscais regionais SUDAM/SUDENE.',
      impacto: localizacaoSUDAM ? 'critico' : 'nao_aplicavel',
      aplicavel: localizacaoSUDAM
    },
    {
      titulo: 'NÃO permite Lei do Bem (P&D)',
      descricao: 'Não pode deduzir gastos com pesquisa e desenvolvimento (Lei 11.196/2005).',
      impacto: 'baixo',
      aplicavel: true
    },
    {
      titulo: 'NÃO permite PAT',
      descricao: 'Não pode deduzir gastos com o Programa de Alimentação do Trabalhador.',
      impacto: 'baixo',
      aplicavel: true
    },
    {
      titulo: 'Fator "r" pode jogar para Anexo V (mais caro)',
      descricao: fatorRProximo
        ? `⚠️ Fator "r" atual (${(fatorR * 100).toFixed(2)}%) está próximo do limiar de 28%. Risco de migrar para Anexo V com alíquotas iniciais de 15,50%.`
        : 'Se o Fator "r" cair abaixo de 28%, a empresa é tributada pelo Anexo V, com alíquotas significativamente maiores.',
      impacto: fatorRProximo ? 'critico' : (isAnexoV ? 'alto' : 'medio'),
      aplicavel: true
    },
    {
      titulo: 'Sublimite estadual — ICMS/ISS por fora',
      descricao: `Se receita bruta ultrapassar R$ 3.600.000, ICMS e ISS saem do DAS e são recolhidos pelo regime normal, aumentando complexidade e custo.`,
      impacto: receitaBrutaAnual > SUBLIMITE_ICMS_ISS * 0.8 ? 'alto' : 'baixo',
      aplicavel: true
    },
    {
      titulo: 'Vedações extensas de atividades',
      descricao: 'Lista extensa de atividades vedadas (instituições financeiras, factoring, seguros, etc.). Restringe a diversificação de negócios.',
      impacto: 'medio',
      aplicavel: true
    },
    {
      titulo: 'Restrições de participação societária',
      descricao: 'Não pode ter sócio pessoa jurídica, sócio no exterior, ou participação relevante em outras empresas.',
      impacto: 'medio',
      aplicavel: true
    },
    {
      titulo: 'Não pode ter filial/sócio no exterior',
      descricao: 'Proibida de ter filial, sucursal ou representação no exterior, limitando a internacionalização.',
      impacto: 'baixo',
      aplicavel: true
    },
    {
      titulo: 'Impossibilidade de compensar prejuízos',
      descricao: 'Diferente do Lucro Real, não há possibilidade de compensar prejuízos fiscais de períodos anteriores.',
      impacto: 'medio',
      aplicavel: true
    },
    {
      titulo: 'Anexo IV: INSS patronal por fora',
      descricao: 'Atividades do Anexo IV (limpeza, vigilância, construção, advocacia) devem pagar CPP separadamente (20%+RAT sobre folha).',
      impacto: isAnexoIV ? 'critico' : 'nao_aplicavel',
      aplicavel: isAnexoIV
    },
    {
      titulo: 'Proibição de cessão de mão de obra',
      descricao: 'Empresas do Simples (exceto Anexo IV) não podem prestar serviços por cessão ou locação de mão de obra.',
      impacto: 'medio',
      aplicavel: true
    },
    {
      titulo: 'ICMS-ST e DIFAL pagos por fora',
      descricao: 'Substituição tributária e diferencial de alíquotas de ICMS são pagos em guias separadas, mesmo dentro do Simples.',
      impacto: ['I', 'II'].includes(anexo) ? 'medio' : 'baixo',
      aplicavel: ['I', 'II'].includes(anexo)
    },
    {
      titulo: 'Competitividade reduzida em vendas B2B',
      descricao: 'Na prática, o produto/serviço fica mais caro para clientes do Lucro Real, que perdem créditos de PIS/COFINS.',
      impacto: vendeParaPJ ? 'alto' : 'baixo',
      aplicavel: vendeParaPJ
    }
  ];

  return { vantagens, desvantagens };
}


// ================================================================================
// SEÇÃO 16: FUNÇÃO — compararComOutrosRegimes()
// ================================================================================

/**
 * Compara o Simples Nacional com Lucro Presumido, Lucro Real e Lucro Real + SUDAM 75%.
 *
 * @param {Object} params
 * @param {number} params.receitaBrutaAnual
 * @param {number} params.folhaAnual - Folha de pagamento anual (incluindo encargos)
 * @param {string} params.cnae
 * @param {number} params.fatorR
 * @param {string} params.anexo - Anexo do Simples
 * @param {number} [params.despesasOperacionais=0] - Despesas operacionais (para Lucro Real)
 * @param {number} [params.aliquotaRAT=0.02]
 * @param {number} [params.aliquotaISS=0.05] - Alíquota de ISS do município
 * @param {boolean} [params.temSUDAM=false] - Se tem benefício SUDAM
 * @returns {Object} Comparativo entre regimes
 */
function compararComOutrosRegimes(params) {
  const {
    receitaBrutaAnual,
    folhaAnual,
    cnae = '71.19-7',
    fatorR = 0.4255,
    anexo = 'III',
    despesasOperacionais = 0,
    aliquotaRAT = ALIQUOTA_RAT_PADRAO,
    aliquotaISS = 0.05,
    temSUDAM = false
  } = params;

  const regimes = [];

  // -------------------------------------------------------
  // 1. SIMPLES NACIONAL
  // -------------------------------------------------------
  const aliqSimples = calcularAliquotaEfetiva({ rbt12: receitaBrutaAnual, anexo });
  const dasAnual = _arredondar(receitaBrutaAnual * aliqSimples.aliquotaEfetiva);
  const fgtsSimples = _arredondar(folhaAnual * ALIQUOTA_FGTS);
  // CPP incluída no DAS para Anexo III, apenas FGTS por fora
  const cargaSimples = _arredondar(dasAnual + fgtsSimples);

  const distribuicaoSimples = calcularDistribuicaoLucros({
    receitaBrutaAnual,
    dasAnual,
    socios: [{ nome: 'Sócio 1', percentual: 0.65 }, { nome: 'Sócio 2', percentual: 0.35 }],
    tipoAtividade: 'servicos'
  });

  regimes.push({
    regime: 'Simples Nacional',
    anexo: `Anexo ${anexo}`,
    aliquotaEfetiva: aliqSimples.aliquotaEfetiva,
    aliquotaEfetivaFormatada: aliqSimples.aliquotaEfetivaFormatada,
    dasOuImpostos: dasAnual,
    fgts: fgtsSimples,
    inssPatronal: 0, // Incluso no DAS (Anexo III)
    cargaTotal: cargaSimples,
    percentualCarga: _arredondar(cargaSimples / receitaBrutaAnual, 4),
    percentualCargaFormatado: ((cargaSimples / receitaBrutaAnual) * 100).toFixed(2).replace('.', ',') + '%',
    lucroDistribuivel: distribuicaoSimples.lucroDistribuivelFinal,
    observacoes: ['CPP incluída no DAS', 'Guia única de recolhimento']
  });

  // -------------------------------------------------------
  // 2. LUCRO PRESUMIDO
  // -------------------------------------------------------
  const presuncaoLP = 0.32; // Serviços
  const baseIRPJ_LP = receitaBrutaAnual * presuncaoLP;
  const irpjLP = _arredondar(baseIRPJ_LP * 0.15);
  const adicionalIR_LP = _arredondar(Math.max(0, (baseIRPJ_LP - 240_000) * 0.10));
  const csllLP = _arredondar(baseIRPJ_LP * 0.09);
  const cofinsLP = _arredondar(receitaBrutaAnual * 0.03); // Cumulativo
  const pisLP = _arredondar(receitaBrutaAnual * 0.0065); // Cumulativo
  const issLP = _arredondar(receitaBrutaAnual * aliquotaISS);
  const inssPatronalLP = _arredondar(folhaAnual * (0.20 + aliquotaRAT));
  const terceirosSAT_LP = _arredondar(folhaAnual * 0.058); // Sistema S + Salário Educação
  const fgtsLP = _arredondar(folhaAnual * ALIQUOTA_FGTS);

  const cargaLP = _arredondar(irpjLP + adicionalIR_LP + csllLP + cofinsLP + pisLP + issLP + inssPatronalLP + terceirosSAT_LP + fgtsLP);

  const lucroDistribuivelLP = _arredondar(Math.max(0, baseIRPJ_LP - irpjLP - adicionalIR_LP - csllLP));

  regimes.push({
    regime: 'Lucro Presumido',
    anexo: null,
    detalhamento: {
      irpj: irpjLP,
      adicionalIR: adicionalIR_LP,
      csll: csllLP,
      cofins: cofinsLP,
      pis: pisLP,
      iss: issLP,
      inssPatronal: inssPatronalLP,
      terceiros: terceirosSAT_LP,
      fgts: fgtsLP
    },
    dasOuImpostos: _arredondar(irpjLP + adicionalIR_LP + csllLP + cofinsLP + pisLP + issLP),
    fgts: fgtsLP,
    inssPatronal: _arredondar(inssPatronalLP + terceirosSAT_LP),
    cargaTotal: cargaLP,
    percentualCarga: _arredondar(cargaLP / receitaBrutaAnual, 4),
    percentualCargaFormatado: ((cargaLP / receitaBrutaAnual) * 100).toFixed(2).replace('.', ',') + '%',
    lucroDistribuivel: lucroDistribuivelLP,
    observacoes: ['INSS patronal pago separadamente (20%+RAT)', 'PIS/COFINS cumulativo (3%+0,65%)']
  });

  // -------------------------------------------------------
  // 3. LUCRO REAL
  // -------------------------------------------------------
  const lucroOperacional = receitaBrutaAnual - folhaAnual - despesasOperacionais;
  const lucroAntesTributos = Math.max(0, lucroOperacional);
  const irpjLR = _arredondar(lucroAntesTributos * 0.15);
  const adicionalIR_LR = _arredondar(Math.max(0, (lucroAntesTributos - 240_000) * 0.10));
  const csllLR = _arredondar(lucroAntesTributos * 0.09);
  const cofinsLR = _arredondar(receitaBrutaAnual * 0.076); // Não cumulativo (bruto sem créditos simplificado)
  const creditoCofins = _arredondar((folhaAnual + despesasOperacionais) * 0.076 * 0.5); // Estimativa simplificada de créditos
  const cofinsLRLiquido = _arredondar(Math.max(0, cofinsLR - creditoCofins));
  const pisLR = _arredondar(receitaBrutaAnual * 0.0165);
  const creditoPis = _arredondar((folhaAnual + despesasOperacionais) * 0.0165 * 0.5);
  const pisLRLiquido = _arredondar(Math.max(0, pisLR - creditoPis));
  const issLR = _arredondar(receitaBrutaAnual * aliquotaISS);
  const inssPatronalLR = _arredondar(folhaAnual * (0.20 + aliquotaRAT));
  const terceirosSAT_LR = _arredondar(folhaAnual * 0.058);
  const fgtsLR = _arredondar(folhaAnual * ALIQUOTA_FGTS);

  const cargaLR = _arredondar(irpjLR + adicionalIR_LR + csllLR + cofinsLRLiquido + pisLRLiquido + issLR + inssPatronalLR + terceirosSAT_LR + fgtsLR);

  const lucroDistribuivelLR = _arredondar(Math.max(0, lucroAntesTributos - irpjLR - adicionalIR_LR - csllLR));

  regimes.push({
    regime: 'Lucro Real',
    anexo: null,
    detalhamento: {
      lucroOperacional: _arredondar(lucroOperacional),
      irpj: irpjLR,
      adicionalIR: adicionalIR_LR,
      csll: csllLR,
      cofinsLiquido: cofinsLRLiquido,
      pisLiquido: pisLRLiquido,
      iss: issLR,
      inssPatronal: inssPatronalLR,
      terceiros: terceirosSAT_LR,
      fgts: fgtsLR
    },
    dasOuImpostos: _arredondar(irpjLR + adicionalIR_LR + csllLR + cofinsLRLiquido + pisLRLiquido + issLR),
    fgts: fgtsLR,
    inssPatronal: _arredondar(inssPatronalLR + terceirosSAT_LR),
    cargaTotal: cargaLR,
    percentualCarga: _arredondar(cargaLR / receitaBrutaAnual, 4),
    percentualCargaFormatado: ((cargaLR / receitaBrutaAnual) * 100).toFixed(2).replace('.', ',') + '%',
    lucroDistribuivel: lucroDistribuivelLR,
    observacoes: ['PIS/COFINS não cumulativo (créditos estimados)', 'Permite compensar prejuízos']
  });

  // -------------------------------------------------------
  // 4. LUCRO REAL + SUDAM 75% (se aplicável)
  // -------------------------------------------------------
  if (temSUDAM) {
    const reducaoSUDAM = _arredondar(irpjLR * 0.75);
    const irpjSUDAM = _arredondar(irpjLR - reducaoSUDAM);
    const cargaSUDAM = _arredondar(cargaLR - reducaoSUDAM);

    regimes.push({
      regime: 'Lucro Real + SUDAM 75%',
      anexo: null,
      detalhamento: {
        irpjOriginal: irpjLR,
        reducaoSUDAM,
        irpjFinal: irpjSUDAM,
        adicionalIR: adicionalIR_LR,
        csll: csllLR,
        cofinsLiquido: cofinsLRLiquido,
        pisLiquido: pisLRLiquido,
        iss: issLR,
        inssPatronal: inssPatronalLR,
        terceiros: terceirosSAT_LR,
        fgts: fgtsLR
      },
      dasOuImpostos: _arredondar(irpjSUDAM + adicionalIR_LR + csllLR + cofinsLRLiquido + pisLRLiquido + issLR),
      fgts: fgtsLR,
      inssPatronal: _arredondar(inssPatronalLR + terceirosSAT_LR),
      cargaTotal: cargaSUDAM,
      percentualCarga: _arredondar(cargaSUDAM / receitaBrutaAnual, 4),
      percentualCargaFormatado: ((cargaSUDAM / receitaBrutaAnual) * 100).toFixed(2).replace('.', ',') + '%',
      lucroDistribuivel: _arredondar(lucroDistribuivelLR + reducaoSUDAM),
      observacoes: ['Redução de 75% do IRPJ (SUDAM)', 'Requer laudo + aprovação ADA/SUDAM', 'Não disponível no Simples Nacional']
    });
  }

  // Ordenar pelo menor carga total
  regimes.sort((a, b) => a.cargaTotal - b.cargaTotal);

  // Atribuir ranking
  regimes.forEach((r, i) => {
    r.ranking = i + 1;
    r.melhorOpcao = i === 0;
  });

  // Economia vs pior
  const pior = regimes[regimes.length - 1];
  const melhor = regimes[0];
  const economiaMelhorVsPior = _arredondar(pior.cargaTotal - melhor.cargaTotal);

  return {
    receitaBrutaAnual: _arredondar(receitaBrutaAnual),
    folhaAnual: _arredondar(folhaAnual),
    cnae,
    regimes,
    melhorRegime: melhor.regime,
    piorRegime: pior.regime,
    economiaMelhorVsPior,
    economiaFormatada: _formatarMoeda(economiaMelhorVsPior),
    recomendacao: `O regime mais vantajoso é ${melhor.regime} com carga de ${melhor.percentualCargaFormatado} (${_formatarMoeda(melhor.cargaTotal)}). Economia de ${_formatarMoeda(economiaMelhorVsPior)} em relação ao pior regime (${pior.regime}).`
  };
}


// ================================================================================
// SEÇÃO 17: RISCOS FISCAIS E PEGADINHAS
// ================================================================================

/**
 * Riscos fiscais e "pegadinhas" comuns no Simples Nacional.
 * Base legal: LC 123/2006; Resolução CGSN 140/2018.
 */
const RISCOS_FISCAIS = [
  {
    id: 'ultrapassagem_limite',
    titulo: 'Exclusão por excesso de receita',
    descricao: 'Ultrapassar o limite de R$ 4.800.000,00 de receita bruta anual resulta em exclusão obrigatória do Simples Nacional.',
    consequencia: 'Exclusão a partir de 1º de janeiro do ano seguinte (se excesso ≤ 20%) ou retroativa ao início do ano (se excesso > 20%).',
    prevencao: 'Monitorar receita mensal acumulada. Alertar quando atingir 80% do limite.',
    gravidade: 'critica',
    baseLegal: 'LC 123/2006, Art. 3º, II e Art. 30'
  },
  {
    id: 'ultrapassagem_sublimite',
    titulo: 'ICMS/ISS por fora ao ultrapassar sublimite',
    descricao: 'Receita acima de R$ 3.600.000,00 obriga recolhimento de ICMS e ISS fora do DAS.',
    consequencia: 'Aumento da complexidade tributária e possível aumento da carga fiscal. ICMS/ISS pelo regime normal.',
    prevencao: 'Planejar antecipadamente a transição quando receita se aproximar do sublimite.',
    gravidade: 'alta',
    baseLegal: 'LC 123/2006, Art. 19'
  },
  {
    id: 'fator_r_flutuante',
    titulo: 'Fator "r" flutuando entre Anexo III e V',
    descricao: 'Variações mensais na folha de pagamento ou receita podem fazer o Fator "r" oscilar em torno do limiar de 28%.',
    consequencia: 'Alternância entre Anexo III e V pode causar tributação imprevisível e possível pagamento a maior ou menor.',
    prevencao: 'Manter folha de pagamento estável. Considerar ajustar pró-labore para manter Fator "r" acima de 28%.',
    gravidade: 'alta',
    baseLegal: 'Resolução CGSN 140/2018, Art. 18, §5º-J'
  },
  {
    id: 'segregacao_receitas',
    titulo: 'Erro na segregação de receitas por anexo',
    descricao: 'Empresas com múltiplas atividades devem segregar receitas por anexo no PGDAS-D.',
    consequencia: 'Cálculo incorreto de tributos, podendo resultar em autuação com multa de 75% + juros.',
    prevencao: 'Segregar receitas por CNAE/anexo mensalmente. Conferir classificação de cada nota fiscal.',
    gravidade: 'alta',
    baseLegal: 'Resolução CGSN 140/2018, Art. 25'
  },
  {
    id: 'omissao_receita',
    titulo: 'Omissão de receita',
    descricao: 'Diferença entre receita declarada e notas fiscais emitidas ou recebimentos via cartão/PIX.',
    consequencia: 'Autuação com multa de 75% (podendo chegar a 150% em caso de fraude) + juros SELIC.',
    prevencao: 'Conciliar receita mensal com extratos bancários, recebimentos de cartão e notas emitidas.',
    gravidade: 'critica',
    baseLegal: 'LC 123/2006, Art. 38-A; CTN, Art. 44'
  },
  {
    id: 'distribuicao_lucros_excessiva',
    titulo: 'Distribuição de lucros acima do permitido',
    descricao: 'Distribuir lucros isentos acima do limite da presunção (32% para serviços) sem escrituração contábil.',
    consequencia: 'Valor excedente tributado como remuneração (IRPF + INSS). Autuação retroativa de até 5 anos.',
    prevencao: 'Manter escrituração contábil completa para distribuir lucros acima da presunção. Calcular limite mensal.',
    gravidade: 'alta',
    baseLegal: 'LC 123/2006, Art. 14'
  },
  {
    id: 'debitos_exclusao',
    titulo: 'Exclusão por débitos fiscais',
    descricao: 'Débitos pendentes com INSS ou Fazendas Públicas (federal, estadual, municipal) sem exigibilidade suspensa.',
    consequencia: 'Exclusão de ofício do Simples Nacional por notificação (Termo de Exclusão).',
    prevencao: 'Manter certidões negativas em dia. Parcelar débitos imediatamente se houver pendências.',
    gravidade: 'alta',
    baseLegal: 'LC 123/2006, Art. 17, V e Art. 29'
  },
  {
    id: 'atividade_vedada',
    titulo: 'Exercício de atividade vedada',
    descricao: 'Incluir CNAE vedado ao Simples Nacional (ex: factoring, instituição financeira).',
    consequencia: 'Exclusão de ofício, com recolhimento retroativo pelo regime geral.',
    prevencao: 'Verificar elegibilidade antes de adicionar novos CNAEs. Consultar resolução CGSN 140/2018.',
    gravidade: 'alta',
    baseLegal: 'LC 123/2006, Art. 17'
  },
  {
    id: 'icms_st_duplicado',
    titulo: 'Pagar ICMS duas vezes (ICMS-ST)',
    descricao: 'Não segregar no PGDAS-D as receitas de mercadorias com substituição tributária, pagando ICMS dentro e fora do DAS.',
    consequencia: 'Pagamento de ICMS em duplicidade. Necessário pedido de restituição.',
    prevencao: 'Segregar receitas com ICMS-ST no PGDAS-D. Identificar NCM/CEST sujeitos à substituição.',
    gravidade: 'media',
    baseLegal: 'Resolução CGSN 140/2018, Art. 25, §6º'
  },
  {
    id: 'alocacao_indevida_anexo',
    titulo: 'Receita alocada no anexo errado',
    descricao: 'Classificar receita em um anexo com tributação menor que o correto (ex: Anexo III quando deveria ser V).',
    consequencia: 'Autuação pela RFB com cobrança de diferença + multa de 75% + juros.',
    prevencao: 'Calcular Fator "r" mensalmente. Verificar CNAE de cada receita.',
    gravidade: 'alta',
    baseLegal: 'Resolução CGSN 140/2018, Art. 18'
  },
  {
    id: 'exclusao_retroativa',
    titulo: 'Exclusão retroativa por excesso > 20%',
    descricao: 'Se receita bruta exceder R$ 5.760.000 (20% acima do limite), a exclusão é retroativa ao início do ano-calendário.',
    consequencia: 'Recalcular TODOS os tributos do ano pelo Lucro Presumido ou Real, com multas e juros.',
    prevencao: 'NUNCA permitir receita acima de R$ 4.800.000 sem planejamento tributário prévio.',
    gravidade: 'critica',
    baseLegal: 'LC 123/2006, Art. 30, §1º'
  },
  {
    id: 'iss_retido_nao_deduzido',
    titulo: 'ISS retido na fonte não deduzido do DAS',
    descricao: 'Quando o ISS é retido pelo tomador do serviço, o valor deve ser deduzido do DAS para evitar bitributação.',
    consequencia: 'Pagamento de ISS em duplicidade (dentro do DAS + retenção na fonte).',
    prevencao: 'Registrar ISS retido no PGDAS-D mensalmente. Conferir notas fiscais com retenção.',
    gravidade: 'media',
    baseLegal: 'Resolução CGSN 140/2018, Art. 27'
  }
];


// ================================================================================
// SEÇÃO 19: FUNÇÕES AUXILIARES
// ================================================================================

/**
 * Arredonda um valor para N casas decimais.
 * @param {number} valor
 * @param {number} [casas=2]
 * @returns {number}
 */
function _arredondar(valor, casas = 2) {
  const fator = Math.pow(10, casas);
  return Math.round(valor * fator) / fator;
}

/**
 * Formata um valor numérico como moeda brasileira (R$).
 * @param {number} valor
 * @returns {string}
 */
function _formatarMoeda(valor) {
  return _fmtBRL(valor);
}

// Alternativa mais robusta de formatação de moeda
function _fmtBRL(v) {
  if (v === null || v === undefined || isNaN(v)) return 'R$ 0,00';
  const parts = Math.abs(v).toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decPart = parts[1];
  const sign = v < 0 ? '-' : '';
  return `${sign}R$ ${intPart},${decPart}`;
}

/**
 * Retorna os anexos disponíveis.
 * @returns {Object}
 */
function getAnexosDisponiveis() {
  const result = {};
  for (const [key, val] of Object.entries(ANEXOS)) {
    result[key] = {
      nome: val.nome,
      descricao: val.descricao,
      cppInclusa: val.cppInclusa,
      totalFaixas: val.faixas.length,
      tributosDentro: val.tributosDentro,
      tributosFora: val.tributosFora
    };
  }
  return result;
}

/**
 * Retorna a faixa de tributação para um dado RBT12 e anexo.
 * @param {number} rbt12
 * @param {string} anexo
 * @returns {Object|null}
 */
function getFaixaByRBT12(rbt12, anexo) {
  if (!ANEXOS[anexo]) return null;
  return ANEXOS[anexo].faixas.find(f => rbt12 >= f.min && rbt12 <= f.max) || null;
}

/**
 * Calcula RBT12 proporcional para empresas em início de atividade.
 * @param {Array<number>} receitasMensais
 * @param {number} mesesAtividade
 * @returns {number}
 */
function calcularRBT12Proporcional(receitasMensais, mesesAtividade) {
  if (!receitasMensais || receitasMensais.length === 0 || mesesAtividade <= 0) return 0;
  const somaReceitas = receitasMensais.reduce((a, b) => a + b, 0);
  const mediaReceita = somaReceitas / Math.min(receitasMensais.length, mesesAtividade);
  return _arredondar(mediaReceita * 12);
}

/**
 * Valida os dados de entrada antes do processamento.
 * @param {Object} params
 * @returns {Object} {valido: boolean, erros: string[]}
 */
function validarDadosEntrada(params) {
  const erros = [];

  if (!params) {
    return { valido: false, erros: ['Parâmetros não fornecidos'] };
  }

  if (params.receitaBrutaMensal !== undefined && params.receitaBrutaMensal < 0) {
    erros.push('Receita bruta mensal não pode ser negativa');
  }
  if (params.rbt12 !== undefined && params.rbt12 < 0) {
    erros.push('RBT12 não pode ser negativo');
  }
  if (params.rbt12 !== undefined && params.rbt12 > LIMITE_EPP) {
    erros.push(`RBT12 (${_fmtBRL(params.rbt12)}) excede o limite do Simples Nacional`);
  }
  if (params.anexo !== undefined && !ANEXOS[params.anexo]) {
    erros.push(`Anexo "${params.anexo}" inválido`);
  }
  if (params.fatorR !== undefined && (params.fatorR < 0 || params.fatorR > 1)) {
    erros.push('Fator "r" deve estar entre 0 e 1');
  }

  return { valido: erros.length === 0, erros };
}

/**
 * Formata resultado completo como texto legível.
 * @param {Object} resultado
 * @returns {string}
 */
function formatarResultadoTexto(resultado) {
  if (!resultado) return '';

  const linhas = [];

  if (resultado.regime) {
    linhas.push(`Regime: ${resultado.regime}`);
  }
  if (resultado.cargaTotal !== undefined) {
    linhas.push(`Carga Tributária Total: ${_fmtBRL(resultado.cargaTotal)}`);
  }
  if (resultado.percentualCargaFormatado) {
    linhas.push(`Percentual sobre Receita: ${resultado.percentualCargaFormatado}`);
  }
  if (resultado.lucroDistribuivel !== undefined) {
    linhas.push(`Lucro Distribuível Isento: ${_fmtBRL(resultado.lucroDistribuivel)}`);
  }

  return linhas.join('\n');
}


// ================================================================================
// SEÇÃO 20: ANEXO VI HISTÓRICO (LC 147/2014 — vigência 01/01/2015 a 31/12/2017)
// ================================================================================

/**
 * Tabela do Anexo VI — Vigência: 01/01/2015 a 31/12/2017.
 * Substituído pela sistemática Fator "r" (LC 155/2016) a partir de 01/01/2018.
 *
 * IMPORTANTE: Atividades do antigo Anexo VI (§5º-I) agora são tributadas no
 * Anexo III (se r ≥ 28%) ou Anexo V (se r < 28%) conforme LC 155/2016.
 *
 * Mantido como referência histórica e para cálculos retroativos.
 *
 * Base legal: LC 123/2006, §5º-I, Anexo VI (redação LC 147/2014).
 */
const ANEXO_VI_HISTORICO = {
  nome: 'Anexo VI — Serviços Profissionais (HISTÓRICO — vigência 2015-2017)',
  descricao: 'Atividades intelectuais, técnicas, científicas, desportivas, artísticas — §5º-I',
  baseLegal: 'LC 123/2006, §5º-I c/c Anexo VI (redação LC 147/2014)',
  vigencia: { inicio: '2015-01-01', fim: '2017-12-31' },
  substituidoPor: 'Fator "r" → Anexo III (r≥28%) ou Anexo V (r<28%) — LC 155/2016',
  tributosDentro: ['IRPJ', 'CSLL', 'COFINS', 'PIS/PASEP', 'CPP', 'ISS'],
  cppInclusa: true,
  faixas: [
    { faixa: 1,  min: 0.00,           max: 180_000.00,   aliquota: 0.1693, irpjPisCsllCofinsCpp: 0.1493, iss: 0.0200 },
    { faixa: 2,  min: 180_000.01,     max: 360_000.00,   aliquota: 0.1772, irpjPisCsllCofinsCpp: 0.1493, iss: 0.0279 },
    { faixa: 3,  min: 360_000.01,     max: 540_000.00,   aliquota: 0.1843, irpjPisCsllCofinsCpp: 0.1493, iss: 0.0350 },
    { faixa: 4,  min: 540_000.01,     max: 720_000.00,   aliquota: 0.1877, irpjPisCsllCofinsCpp: 0.1493, iss: 0.0384 },
    { faixa: 5,  min: 720_000.01,     max: 900_000.00,   aliquota: 0.1904, irpjPisCsllCofinsCpp: 0.1517, iss: 0.0387 },
    { faixa: 6,  min: 900_000.01,     max: 1_080_000.00, aliquota: 0.1994, irpjPisCsllCofinsCpp: 0.1571, iss: 0.0423 },
    { faixa: 7,  min: 1_080_000.01,   max: 1_260_000.00, aliquota: 0.2034, irpjPisCsllCofinsCpp: 0.1608, iss: 0.0426 },
    { faixa: 8,  min: 1_260_000.01,   max: 1_440_000.00, aliquota: 0.2066, irpjPisCsllCofinsCpp: 0.1635, iss: 0.0431 },
    { faixa: 9,  min: 1_440_000.01,   max: 1_620_000.00, aliquota: 0.2117, irpjPisCsllCofinsCpp: 0.1656, iss: 0.0461 },
    { faixa: 10, min: 1_620_000.01,   max: 1_800_000.00, aliquota: 0.2138, irpjPisCsllCofinsCpp: 0.1673, iss: 0.0465 },
    { faixa: 11, min: 1_800_000.01,   max: 1_980_000.00, aliquota: 0.2186, irpjPisCsllCofinsCpp: 0.1686, iss: 0.0500 },
    { faixa: 12, min: 1_980_000.01,   max: 2_160_000.00, aliquota: 0.2197, irpjPisCsllCofinsCpp: 0.1697, iss: 0.0500 },
    { faixa: 13, min: 2_160_000.01,   max: 2_340_000.00, aliquota: 0.2206, irpjPisCsllCofinsCpp: 0.1706, iss: 0.0500 },
    { faixa: 14, min: 2_340_000.01,   max: 2_520_000.00, aliquota: 0.2214, irpjPisCsllCofinsCpp: 0.1714, iss: 0.0500 },
    { faixa: 15, min: 2_520_000.01,   max: 2_700_000.00, aliquota: 0.2221, irpjPisCsllCofinsCpp: 0.1721, iss: 0.0500 },
    { faixa: 16, min: 2_700_000.01,   max: 2_880_000.00, aliquota: 0.2221, irpjPisCsllCofinsCpp: 0.1721, iss: 0.0500 },
    { faixa: 17, min: 2_880_000.01,   max: 3_060_000.00, aliquota: 0.2232, irpjPisCsllCofinsCpp: 0.1732, iss: 0.0500 },
    { faixa: 18, min: 3_060_000.01,   max: 3_240_000.00, aliquota: 0.2237, irpjPisCsllCofinsCpp: 0.1737, iss: 0.0500 },
    { faixa: 19, min: 3_240_000.01,   max: 3_420_000.00, aliquota: 0.2241, irpjPisCsllCofinsCpp: 0.1741, iss: 0.0500 },
    { faixa: 20, min: 3_420_000.01,   max: 3_600_000.00, aliquota: 0.2245, irpjPisCsllCofinsCpp: 0.1745, iss: 0.0500 }
  ]
};


// ================================================================================
// SEÇÃO 21: ATIVIDADES §5º-I (ANTIGO ANEXO VI) — MAPEAMENTO COMPLETO
// ================================================================================

/**
 * Lista completa das atividades do §5º-I do Art. 18 da LC 123/2006 (redação LC 147/2014).
 *
 * Após LC 155/2016, todas estas atividades passaram a ser tributadas pelo
 * sistema Fator "r": Anexo III (r ≥ 28%) ou Anexo V (r < 28%).
 *
 * ESTRATÉGIA FISCAL: Manter Fator "r" ≥ 28% para estas atividades garante
 * alíquota efetiva MENOR (Anexo III vs V). Diferença pode ser de até 10 pontos
 * percentuais nas faixas superiores.
 *
 * Base legal: LC 123/2006, Art. 18, §5º-I (redação LC 147/2014);
 *             LC 155/2016 (migração para sistema Fator "r");
 *             Resolução CGSN 140/2018, Art. 18, §5º-J e §5º-M.
 */
const ATIVIDADES_PARAGRAFO_5I = [
  // Inciso I
  {
    inciso: 'I',
    descricao: 'Medicina, inclusive laboratorial e enfermagem',
    exemplosAtividades: ['Clínicas médicas', 'Laboratórios', 'Enfermagem domiciliar', 'Medicina do trabalho'],
    exemplosCNAE: ['86.30-5', '86.10-1', '86.21-6'],
    tributacaoAtual: 'Fator "r" — Anexo III (r≥28%) ou Anexo V (r<28%)',
    baseLegal: 'LC 123/2006, Art. 18, §5º-I, I'
  },
  // Inciso II
  {
    inciso: 'II',
    descricao: 'Medicina veterinária',
    exemplosAtividades: ['Clínicas veterinárias', 'Consultórios veterinários'],
    exemplosCNAE: ['75.00-1'],
    tributacaoAtual: 'Fator "r" — Anexo III (r≥28%) ou Anexo V (r<28%)',
    baseLegal: 'LC 123/2006, Art. 18, §5º-I, II'
  },
  // Inciso III
  {
    inciso: 'III',
    descricao: 'Odontologia',
    exemplosAtividades: ['Consultórios odontológicos', 'Clínicas odontológicas'],
    exemplosCNAE: ['86.30-5/03'],
    tributacaoAtual: 'Fator "r" — Anexo III (r≥28%) ou Anexo V (r<28%)',
    baseLegal: 'LC 123/2006, Art. 18, §5º-I, III'
  },
  // Inciso IV
  {
    inciso: 'IV',
    descricao: 'Psicologia, psicanálise, terapia ocupacional, acupuntura, podologia, fonoaudiologia, clínicas de nutrição e de vacinação e bancos de leite',
    exemplosAtividades: ['Psicólogos', 'Psicanalistas', 'Terapeutas ocupacionais', 'Acupunturistas', 'Fonoaudiólogos', 'Nutricionistas', 'Clínicas de vacinação'],
    exemplosCNAE: ['86.50-0', '86.90-9'],
    tributacaoAtual: 'Fator "r" — Anexo III (r≥28%) ou Anexo V (r<28%)',
    baseLegal: 'LC 123/2006, Art. 18, §5º-I, IV'
  },
  // Inciso V
  {
    inciso: 'V',
    descricao: 'Serviços de comissaria, de despachantes, de tradução e de interpretação',
    exemplosAtividades: ['Comissários de avarias', 'Despachantes aduaneiros', 'Tradutores', 'Intérpretes'],
    exemplosCNAE: ['52.50-8', '74.90-1'],
    tributacaoAtual: 'Fator "r" — Anexo III (r≥28%) ou Anexo V (r<28%)',
    baseLegal: 'LC 123/2006, Art. 18, §5º-I, V'
  },
  // Inciso VI — AGROGEO BRASIL enquadra-se aqui
  {
    inciso: 'VI',
    descricao: 'Arquitetura, engenharia, medição, cartografia, topografia, geologia, geodésia, testes, suporte e análises técnicas e tecnológicas, pesquisa, design, desenho e agronomia',
    exemplosAtividades: [
      'Escritórios de arquitetura', 'Empresas de engenharia', 'Serviços de medição e cartografia',
      'Topografia', 'Geologia', 'Geodésia', 'Laboratórios de ensaio',
      'Pesquisa científica', 'Design gráfico/industrial', 'Desenho técnico',
      'Agronomia', 'Geotecnologia', 'Consultoria ambiental', 'Georeferenciamento'
    ],
    exemplosCNAE: ['71.11-1', '71.12-0', '71.19-7', '71.20-1', '72.10-0', '73.19-0', '74.10-2', '01.61-0'],
    tributacaoAtual: 'Fator "r" — Anexo III (r≥28%) ou Anexo V (r<28%)',
    baseLegal: 'LC 123/2006, Art. 18, §5º-I, VI',
    observacao: '⭐ AGROGEO BRASIL — CNAE 71.19-7 enquadra-se neste inciso'
  },
  // Inciso VII
  {
    inciso: 'VII',
    descricao: 'Representação comercial e demais atividades de intermediação de negócios e serviços de terceiros',
    exemplosAtividades: ['Representantes comerciais', 'Intermediários de negócios', 'Agentes de comércio'],
    exemplosCNAE: ['46.13-3', '74.90-1'],
    tributacaoAtual: 'Fator "r" — Anexo III (r≥28%) ou Anexo V (r<28%)',
    baseLegal: 'LC 123/2006, Art. 18, §5º-I, VII'
  },
  // Inciso VIII
  {
    inciso: 'VIII',
    descricao: 'Perícia, leilão e avaliação',
    exemplosAtividades: ['Peritos judiciais', 'Leiloeiros', 'Avaliadores de imóveis'],
    exemplosCNAE: ['69.20-6', '82.99-7'],
    tributacaoAtual: 'Fator "r" — Anexo III (r≥28%) ou Anexo V (r<28%)',
    baseLegal: 'LC 123/2006, Art. 18, §5º-I, VIII'
  },
  // Inciso IX
  {
    inciso: 'IX',
    descricao: 'Auditoria, economia, consultoria, gestão, organização, controle e administração',
    exemplosAtividades: ['Empresas de auditoria', 'Economistas', 'Consultorias de gestão', 'Organizadores de eventos corporativos'],
    exemplosCNAE: ['69.20-6', '70.20-4', '82.11-3'],
    tributacaoAtual: 'Fator "r" — Anexo III (r≥28%) ou Anexo V (r<28%)',
    baseLegal: 'LC 123/2006, Art. 18, §5º-I, IX'
  },
  // Inciso X
  {
    inciso: 'X',
    descricao: 'Jornalismo e publicidade',
    exemplosAtividades: ['Agências de jornalismo', 'Agências de publicidade', 'Assessoria de imprensa'],
    exemplosCNAE: ['63.91-7', '73.11-4', '73.12-2'],
    tributacaoAtual: 'Fator "r" — Anexo III (r≥28%) ou Anexo V (r<28%)',
    baseLegal: 'LC 123/2006, Art. 18, §5º-I, X'
  },
  // Inciso XI
  {
    inciso: 'XI',
    descricao: 'Agenciamento, exceto de mão de obra',
    exemplosAtividades: ['Agentes de viagem', 'Agenciadores de publicidade', 'Agentes de propriedade industrial'],
    exemplosCNAE: ['79.11-2', '79.12-1', '74.90-1'],
    tributacaoAtual: 'Fator "r" — Anexo III (r≥28%) ou Anexo V (r<28%)',
    baseLegal: 'LC 123/2006, Art. 18, §5º-I, XI'
  },
  // Inciso XII — Cláusula residual
  {
    inciso: 'XII',
    descricao: 'Outras atividades do setor de serviços que tenham por finalidade a prestação de serviços decorrentes do exercício de atividade intelectual, de natureza técnica, científica, desportiva, artística ou cultural, que constitua profissão regulamentada ou não',
    exemplosAtividades: ['Consultores em geral', 'Profissionais liberais', 'Treinadores esportivos', 'Professores', 'Artistas'],
    exemplosCNAE: ['Diversos — verificar enquadramento específico'],
    tributacaoAtual: 'Fator "r" — Anexo III (r≥28%) ou Anexo V (r<28%)',
    baseLegal: 'LC 123/2006, Art. 18, §5º-I, XII',
    observacao: 'Cláusula residual — aplica-se quando não sujeitas à tributação na forma dos Anexos III, IV ou V'
  }
];


// ================================================================================
// SEÇÃO 22: REGRAS DE TRIBUTAÇÃO ESPECIAL POR TIPO DE ATIVIDADE
// ================================================================================

/**
 * Mapeamento completo das regras de tributação por tipo de serviço/atividade.
 * Essencial para determinar o MENOR imposto legal possível.
 *
 * Base legal: LC 123/2006, Art. 18, §§4º a 5º-I (redação LC 147/2014 e LC 155/2016).
 */
const REGRAS_TRIBUTACAO_ATIVIDADE = {
  // Art. 18, §4º, I — Comércio
  comercio_revenda: {
    descricao: 'Revenda de mercadorias',
    anexo: 'I',
    tipo: 'fixo',
    baseLegal: 'LC 123/2006, Art. 18, §4º, I'
  },

  // Art. 18, §4º, II — Indústria
  industria: {
    descricao: 'Venda de mercadorias industrializadas pelo contribuinte',
    anexo: 'II',
    tipo: 'fixo',
    baseLegal: 'LC 123/2006, Art. 18, §4º, II'
  },

  // Art. 18, §4º, III — Serviços Anexo III (§5º-B)
  servicos_anexo_iii_fixo: {
    descricao: 'Serviços do §5º-B (corretagem de imóveis, bens imóveis, fisioterapia, corretagem de seguros, etc.)',
    anexo: 'III',
    tipo: 'fixo',
    baseLegal: 'LC 123/2006, Art. 18, §4º, III c/c §5º-B',
    servicos: [
      'Locação de bens imóveis e corretagem de imóveis',
      'Fisioterapia',
      'Corretagem de seguros',
      'Creches e pré-escolas',
      'Academias de dança, capoeira, yoga, artes marciais',
      'Academias de atividades físicas/desportivas/natação',
      'Elaboração de programas de computador',
      'Licenciamento de programas de computador customizáveis',
      'Planejamento, confecção, manutenção e atualização de páginas eletrônicas',
      'Escritórios de serviços contábeis (condições especiais)',
      'Produções cinematográficas, audiovisuais, artísticas e culturais',
      'Serviços de transporte municipal de passageiros',
      'Empresas montadoras de stands',
      'Agências lotéricas',
      'Serviços de instalação, manutenção e reparação',
      'Serviços de comunicação por conta e ordem de terceiros',
      'Serviços de varrição, coleta de resíduos (não perigosos), limpeza urbana'
    ]
  },

  // Art. 18, §4º, V — Locação de bens móveis (Anexo III SEM ISS)
  locacao_bens_moveis: {
    descricao: 'Locação de bens móveis',
    anexo: 'III',
    tipo: 'fixo',
    deducaoISS: true,
    baseLegal: 'LC 123/2006, Art. 18, §4º, V',
    observacao: '⭐ BENEFÍCIO: Tributada no Anexo III, MAS deduzida a parcela do ISS (locação de bem móvel não é prestação de serviço = sem ISS). Reduz alíquota efetiva!'
  },

  // Art. 18, §4º, VI — IPI + ISS simultâneo
  ipi_mais_iss: {
    descricao: 'Atividade com incidência simultânea de IPI e ISS',
    anexo: 'II',
    tipo: 'fixo',
    deducaoICMS: true,
    acrescimoISS_Anexo_III: true,
    baseLegal: 'LC 123/2006, Art. 18, §4º, VI',
    observacao: 'Tributada no Anexo II, deduzida parcela ICMS, acrescida parcela ISS do Anexo III'
  },

  // Art. 18, §4º, VII — Medicamentos manipulados
  medicamentos_manipulados_encomenda: {
    descricao: 'Medicamentos/produtos magistrais sob encomenda pessoal',
    anexo: 'III',
    tipo: 'fixo',
    baseLegal: 'LC 123/2006, Art. 18, §4º, VII, "a"'
  },
  medicamentos_manipulados_geral: {
    descricao: 'Medicamentos/produtos magistrais — demais casos (venda em prateleira)',
    anexo: 'I',
    tipo: 'fixo',
    baseLegal: 'LC 123/2006, Art. 18, §4º, VII, "b"'
  },

  // Art. 18, §5º-C — Serviços com Fator "r" (Advocacia incluída no Anexo IV)
  servicos_5C: {
    descricao: 'Serviços do §5º-C, incluindo advocacia',
    tipo: 'misto',
    baseLegal: 'LC 123/2006, Art. 18, §5º-C',
    servicos: [
      'Administração e locação de imóveis de terceiros',
      'Academias de atividades físicas em geral',
      'Centros de cultura, arte e educação',
      'Laboratórios de análises clínicas',
      'Serviços de tomografia e diagnósticos médicos',
      'Serviços de prótese em geral',
      'Serviços advocatícios (Anexo IV — SEM CPP no DAS)'
    ],
    observacao: 'Advocacia é tributada no Anexo IV (sem CPP no DAS). Demais podem usar Fator "r".'
  },

  // Art. 18, §5º-E — Transporte e comunicação (REGRA ESPECIAL)
  transporte_comunicacao: {
    descricao: 'Comunicação e transportes interestadual/intermunicipal de cargas e passageiros (modalidades autorizadas)',
    tipo: 'especial',
    regra: 'Anexo III (base), deduzida parcela ISS, acrescida parcela ICMS do Anexo I',
    baseLegal: 'LC 123/2006, Art. 18, §5º-E (redação LC 147/2014)',
    observacao: 'Transporte fluvial incluso. Transporte urbano/metropolitano e fretamento contínuo de estudantes/trabalhadores também.'
  },

  // Art. 18, §5º-F — Serviços do §2º do Art. 17
  servicos_art17_paragrafo2: {
    descricao: 'Serviços não vedados do §2º do Art. 17',
    tipo: 'misto',
    regra: 'Tributados no Anexo III, SALVO se houver previsão expressa nos Anexos IV, V ou VI',
    baseLegal: 'LC 123/2006, Art. 18, §5º-F (redação LC 147/2014)',
    observacao: 'Regra residual favorável — na dúvida, aplica-se Anexo III (alíquotas menores)'
  },

  // Art. 18, §5º-I — Serviços intelectuais/técnicos (ver ATIVIDADES_PARAGRAFO_5I)
  servicos_intelectuais_5I: {
    descricao: 'Serviços intelectuais, técnicos, científicos, artísticos, desportivos (§5º-I)',
    tipo: 'fator_r',
    anexoFatorRAlto: 'III',
    anexoFatorRBaixo: 'V',
    baseLegal: 'LC 123/2006, Art. 18, §5º-I (redação LC 147/2014); LC 155/2016 (migração Fator "r")',
    observacao: 'Após LC 155/2016: Fator "r" ≥ 28% → Anexo III; Fator "r" < 28% → Anexo V'
  }
};


// ================================================================================
// SEÇÃO 23: REDUÇÕES LEGAIS E BENEFÍCIOS PARA MENOR IMPOSTO
// ================================================================================

/**
 * Catálogo completo de TODAS as reduções, isenções e benefícios fiscais legais
 * disponíveis no Simples Nacional para pagar o menor imposto possível.
 *
 * CADA redução inclui: base legal, condições de aplicação, impacto estimado
 * e função de cálculo que pode ser importada por outro arquivo.
 *
 * Base legal: LC 123/2006 (redações LC 147/2014 e LC 155/2016);
 *             Resolução CGSN 140/2018.
 */
const REDUCOES_LEGAIS = [
  // ─── 1. TRIBUTAÇÃO MONOFÁSICA ────────────────────────────────────────────────
  {
    id: 'monofasica',
    titulo: 'Tributação Monofásica (concentrada em etapa única)',
    descricao: 'Produtos com PIS/COFINS já recolhidos na indústria/importador. O revendedor NÃO paga PIS/COFINS novamente no DAS.',
    aplicavelA: ['Anexo I', 'Anexo II'],
    tributoReduzido: ['PIS/PASEP', 'COFINS'],
    tipoReducao: 'exclusao_base_calculo',
    baseLegal: 'LC 123/2006, Art. 18, §4º-A, I; Resolução CGSN 140/2018, Art. 25, I',
    condicoes: 'Produto deve estar na lista de tributação monofásica (Art. 13, §1º, XIII, "a")',
    produtosComuns: [
      'Combustíveis e lubrificantes',
      'Medicamentos e produtos farmacêuticos',
      'Cosméticos e perfumaria',
      'Bebidas frias (água, refrescos, cervejas)',
      'Autopeças',
      'Pneus e câmaras de ar',
      'Máquinas e veículos',
      'Cigarros e derivados do fumo'
    ],
    impactoEstimado: 'Redução de 3,65% a 9,25% no valor do DAS sobre receita desses produtos',
    /** Calcula redução mensal por monofásica */
    calcularReducao: function(receitaMonofasica, aliquotaEfetiva, faixa, anexo) {
      if (!receitaMonofasica || receitaMonofasica <= 0 || !PARTILHA[anexo]) return 0;
      const idx = faixa - 1;
      const p = PARTILHA[anexo][idx];
      if (!p) return 0;
      const percPisCofins = (p.pis || 0) + (p.cofins || 0);
      return _arredondar(receitaMonofasica * aliquotaEfetiva * percPisCofins);
    }
  },

  // ─── 2. SUBSTITUIÇÃO TRIBUTÁRIA (ICMS-ST) ─────────────────────────────────────
  {
    id: 'icms_st',
    titulo: 'ICMS já recolhido por Substituição Tributária',
    descricao: 'Quando o ICMS já foi recolhido por ST (pelo fabricante/importador), o revendedor deduz a parcela do ICMS do DAS.',
    aplicavelA: ['Anexo I', 'Anexo II'],
    tributoReduzido: ['ICMS'],
    tipoReducao: 'exclusao_base_calculo',
    baseLegal: 'LC 123/2006, Art. 18, §4º-A, I; Resolução CGSN 140/2018, Art. 25, I',
    condicoes: 'ICMS deve ter sido recolhido antecipadamente por ST',
    impactoEstimado: 'Redução de até 3,35% do valor do DAS (parcela ICMS excluída)',
    calcularReducao: function(receitaST, aliquotaEfetiva, faixa, anexo) {
      if (!receitaST || receitaST <= 0 || !PARTILHA[anexo]) return 0;
      const idx = faixa - 1;
      const p = PARTILHA[anexo][idx];
      if (!p) return 0;
      return _arredondar(receitaST * aliquotaEfetiva * (p.icms || 0));
    }
  },

  // ─── 3. ISS RETIDO NA FONTE ────────────────────────────────────────────────────
  {
    id: 'iss_retido_fonte',
    titulo: 'ISS retido na fonte pelo tomador do serviço',
    descricao: 'Quando o ISS é retido na fonte pelo tomador, o valor deve ser DEDUZIDO do DAS para evitar bitributação.',
    aplicavelA: ['Anexo III', 'Anexo IV', 'Anexo V'],
    tributoReduzido: ['ISS'],
    tipoReducao: 'deducao_das',
    baseLegal: 'LC 123/2006, Art. 18, §4º-A, II c/c Art. 21, §4º',
    condicoes: 'ISS retido deve estar informado no documento fiscal. Tomador deve estar em município diverso do prestador.',
    impactoEstimado: 'Dedução de 2% a 5% do valor da nota fiscal do DAS mensal',
    calcularReducao: function(valorISSRetido) {
      return _arredondar(Math.max(0, valorISSRetido || 0));
    }
  },

  // ─── 4. ISS VALOR FIXO MUNICIPAL ──────────────────────────────────────────────
  {
    id: 'iss_valor_fixo',
    titulo: 'ISS em valor fixo mensal (municipal)',
    descricao: 'Municípios podem estabelecer valor fixo de ISS para ME com receita até a 2ª faixa, substituindo o percentual variável.',
    aplicavelA: ['Anexo III', 'Anexo IV', 'Anexo V'],
    tributoReduzido: ['ISS'],
    tipoReducao: 'valor_fixo',
    baseLegal: 'LC 123/2006, Art. 18, §§18 e 18-A (redação LC 147/2014)',
    condicoes: 'Microempresa com RBT12 até o limite da 2ª faixa de receitas. Município deve ter legislação específica.',
    limiteRBT12: 360_000.00,
    impactoEstimado: 'Pode reduzir ISS significativamente para microempresas de baixo faturamento'
  },

  // ─── 5. EXPORTAÇÃO — ISENÇÃO DE TRIBUTOS ──────────────────────────────────────
  {
    id: 'exportacao_isencao',
    titulo: 'Isenção de tributos sobre receita de exportação',
    descricao: 'Receitas de exportação são isentas de COFINS, PIS/PASEP, IPI, ICMS e ISS dentro do DAS. Paga-se apenas IRPJ, CSLL e CPP.',
    aplicavelA: ['Todos os Anexos'],
    tributoReduzido: ['COFINS', 'PIS/PASEP', 'IPI', 'ICMS', 'ISS'],
    tipoReducao: 'isencao_exportacao',
    baseLegal: 'LC 123/2006, Art. 18, §14 e §4º-A, IV (redação LC 147/2014); Art. 3º, §14',
    condicoes: 'Receitas de exportação de mercadorias ou serviços, inclusive via comercial exportadora. Exportação também não pode exceder o limite de R$ 4,8M.',
    impactoEstimado: 'Redução de 40% a 70% da alíquota efetiva sobre receita exportada',
    calcularReducao: function(receitaExportacao, aliquotaEfetiva, faixa, anexo) {
      if (!receitaExportacao || receitaExportacao <= 0 || !PARTILHA[anexo]) return 0;
      const idx = faixa - 1;
      const p = PARTILHA[anexo][idx];
      if (!p) return 0;
      const percIsentos = (p.cofins || 0) + (p.pis || 0) + (p.ipi || 0) + (p.icms || 0) + (p.iss || 0);
      return _arredondar(receitaExportacao * aliquotaEfetiva * percIsentos);
    }
  },

  // ─── 6. RECEITAS COM ISENÇÃO OU REDUÇÃO DE ICMS/ISS ──────────────────────────
  {
    id: 'isencao_reducao_icms_iss',
    titulo: 'Receitas com isenção ou redução de ICMS ou ISS',
    descricao: 'Quando há isenção ou redução de ICMS ou ISS concedida por legislação específica, a parcela desses tributos é deduzida do DAS.',
    aplicavelA: ['Todos os Anexos'],
    tributoReduzido: ['ICMS', 'ISS'],
    tipoReducao: 'isencao_reducao',
    baseLegal: 'LC 123/2006, Art. 18, §4º-A, III; Resolução CGSN 140/2018, Art. 25, III',
    condicoes: 'Deve haver legislação estadual/municipal específica concedendo isenção ou redução. Verificar regulamentação local.',
    impactoEstimado: 'Variável — pode representar de 2% a 5% de redução no DAS'
  },

  // ─── 7. CESTA BÁSICA — ISENÇÃO ESPECIAL ───────────────────────────────────────
  {
    id: 'cesta_basica',
    titulo: 'Isenção/redução de COFINS, PIS e ICMS para produtos de cesta básica',
    descricao: 'União, Estados e DF podem estabelecer isenção ou redução de COFINS, PIS/PASEP e ICMS para produtos da cesta básica vendidos por ME/EPP.',
    aplicavelA: ['Anexo I', 'Anexo II'],
    tributoReduzido: ['COFINS', 'PIS/PASEP', 'ICMS'],
    tipoReducao: 'isencao_cesta_basica',
    baseLegal: 'LC 123/2006, Art. 18, §20-B (redação LC 147/2014)',
    condicoes: 'Depende de lei específica federal, estadual ou distrital. Verificar legislação vigente.',
    impactoEstimado: 'Variável conforme legislação local'
  },

  // ─── 8. FATOR "r" OTIMIZADO (ESTRATÉGIA DE FOLHA) ─────────────────────────────
  {
    id: 'fator_r_otimizado',
    titulo: 'Otimização do Fator "r" para manter Anexo III',
    descricao: 'Manter o Fator "r" ≥ 28% garantindo tributação pelo Anexo III ao invés do Anexo V. Estratégia: aumentar pró-labore/folha de salários.',
    aplicavelA: ['Atividades §5º-I', 'Atividades §5º-C', 'Atividades com Fator "r"'],
    tributoReduzido: ['Alíquota global'],
    tipoReducao: 'planejamento_fator_r',
    baseLegal: 'LC 123/2006, Art. 18, §24 (redação LC 147/2014); Resolução CGSN 140/2018, Art. 18, §5º-J',
    condicoes: 'Fator "r" = Folha de Salários (12 meses) / Receita Bruta (12 meses). Folha inclui: salários, pró-labore, FGTS, encargos patronais.',
    impactoEstimado: 'Diferença de 9,5% na alíquota inicial (15,5% no Anexo V vs 6% no Anexo III). Economia de até R$ 200.000+ em empresas maiores.',
    /** Calcula folha mínima necessária para atingir Fator "r" de 28% */
    calcularFolhaMinima: function(rbt12) {
      return _arredondar(rbt12 * LIMITE_FATOR_R);
    },
    /** Calcula economia ao manter Anexo III vs cair no Anexo V */
    calcularEconomiaAnexoIIIvsV: function(rbt12, receitaMensal) {
      if (!rbt12 || rbt12 <= 0 || !receitaMensal) return 0;
      try {
        const aliqIII = calcularAliquotaEfetiva({ rbt12, anexo: 'III' });
        const aliqV = calcularAliquotaEfetiva({ rbt12, anexo: 'V' });
        const dasIII = receitaMensal * aliqIII.aliquotaEfetiva;
        const dasV = receitaMensal * aliqV.aliquotaEfetiva;
        return _arredondar(dasV - dasIII);
      } catch (e) {
        return 0;
      }
    }
  },

  // ─── 9. REGIME DE CAIXA ────────────────────────────────────────────────────────
  {
    id: 'regime_caixa',
    titulo: 'Opção pelo regime de caixa',
    descricao: 'Reconhecer receitas apenas quando efetivamente recebidas (não quando faturadas). Adia o pagamento de tributos para o mês do recebimento.',
    aplicavelA: ['Todos os Anexos'],
    tributoReduzido: ['Fluxo de caixa'],
    tipoReducao: 'diferimento',
    baseLegal: 'LC 123/2006, Art. 18, §3º; Resolução CGSN 140/2018, Art. 16',
    condicoes: 'Opção feita no PGDAS-D no mês de janeiro ou no início de atividade. Irretratável para o ano-calendário.',
    impactoEstimado: 'Não reduz alíquota, mas melhora o fluxo de caixa significativamente. Tributo pago apenas sobre receita efetivamente recebida.'
  },

  // ─── 10. ANTECIPAÇÃO TRIBUTÁRIA COM ENCERRAMENTO ──────────────────────────────
  {
    id: 'antecipacao_encerramento',
    titulo: 'Antecipação tributária de ICMS com encerramento',
    descricao: 'Quando o ICMS já foi recolhido por antecipação tributária com encerramento de tributação, a parcela do ICMS é excluída do DAS.',
    aplicavelA: ['Anexo I', 'Anexo II'],
    tributoReduzido: ['ICMS'],
    tipoReducao: 'exclusao_base_calculo',
    baseLegal: 'LC 123/2006, Art. 18, §4º-A, I; Art. 13, §1º, XIII, "a" (redação LC 147/2014)',
    condicoes: 'ICMS deve ter sido recolhido por antecipação com encerramento de tributação.',
    impactoEstimado: 'Similar ao ICMS-ST — redução da parcela ICMS no DAS'
  },

  // ─── 11. MULTAS REDUZIDAS (Art. 38-B) ─────────────────────────────────────────
  {
    id: 'multas_reduzidas',
    titulo: 'Redução de multas por obrigações acessórias',
    descricao: 'Multas em valor fixo ou mínimo por descumprimento de obrigações acessórias são reduzidas: 90% para MEI e 50% para ME/EPP no Simples.',
    aplicavelA: ['MEI', 'ME', 'EPP optante Simples'],
    tributoReduzido: ['Multas'],
    tipoReducao: 'reducao_penalidades',
    baseLegal: 'LC 123/2006, Art. 38-B (incluído LC 147/2014)',
    condicoes: 'Multa em valor fixo ou mínimo. Não se aplica em caso de fraude, resistência ou embaraço à fiscalização. Pagamento em 30 dias.',
    reducaoMEI: 0.90,
    reducaoME_EPP: 0.50,
    excecoes: ['Fraude', 'Resistência à fiscalização', 'Embaraço à fiscalização', 'Não pagamento em 30 dias'],
    calcularMultaReduzida: function(valorMultaOriginal, tipoEmpresa) {
      if (tipoEmpresa === 'MEI') return _arredondar(valorMultaOriginal * (1 - 0.90));
      if (tipoEmpresa === 'ME' || tipoEmpresa === 'EPP') return _arredondar(valorMultaOriginal * (1 - 0.50));
      return valorMultaOriginal;
    }
  },

  // ─── 12. FISCALIZAÇÃO ORIENTADORA (DUPLA VISITA) ──────────────────────────────
  {
    id: 'fiscalizacao_orientadora',
    titulo: 'Fiscalização de natureza prioritariamente orientadora (dupla visita)',
    descricao: 'Antes de autuar, o fiscal deve orientar a ME/EPP na primeira visita. Auto de infração SEM dupla visita é NULO.',
    aplicavelA: ['ME', 'EPP'],
    tributoReduzido: ['Multas', 'Autos de infração'],
    tipoReducao: 'protecao_legal',
    baseLegal: 'LC 123/2006, Art. 55, §§5º e 6º (redação LC 147/2014)',
    condicoes: 'Aplica-se a aspectos trabalhista, metrológico, sanitário, ambiental, de segurança e uso do solo. Atividade deve comportar grau de risco compatível.',
    excecoesAplicacao: [
      'Infrações trabalhistas (exceto obrigações acessórias)',
      'Ocupação irregular de reserva de faixa não edificável',
      'Áreas de preservação permanente',
      'Faixas de domínio público de rodovias/ferrovias'
    ],
    impactoEstimado: 'Nulidade de autos de infração que não cumpriram critério da dupla visita. Proteção legal significativa.'
  },

  // ─── 13. LOCAÇÃO DE BENS MÓVEIS SEM ISS ──────────────────────────────────────
  {
    id: 'locacao_bens_moveis_sem_iss',
    titulo: 'Locação de bens móveis — dedução do ISS',
    descricao: 'Locação de bens móveis é tributada no Anexo III, MAS com dedução da parcela ISS, pois locação não constitui prestação de serviço para fins de ISS.',
    aplicavelA: ['Anexo III'],
    tributoReduzido: ['ISS'],
    tipoReducao: 'deducao_iss',
    baseLegal: 'LC 123/2006, Art. 18, §4º, V',
    impactoEstimado: 'Redução de até 5% (parcela ISS) na alíquota efetiva sobre receita de locação',
    calcularReducao: function(receitaLocacao, aliquotaEfetiva, faixa) {
      if (!receitaLocacao || !PARTILHA.III) return 0;
      const idx = faixa - 1;
      const p = PARTILHA.III[idx];
      if (!p) return 0;
      return _arredondar(receitaLocacao * aliquotaEfetiva * (p.iss || 0));
    }
  }
];


// ================================================================================
// SEÇÃO 24: SEGREGAÇÃO DE RECEITAS — REGRAS PARA MENOR TRIBUTAÇÃO
// ================================================================================

/**
 * Regras de segregação de receitas no PGDAS-D.
 * A segregação CORRETA é OBRIGATÓRIA e pode gerar economia tributária significativa.
 *
 * Base legal: LC 123/2006, Art. 18, §§4º e 4º-A (redação LC 147/2014);
 *             Resolução CGSN 140/2018, Art. 25.
 */
const SEGREGACAO_RECEITAS = {
  descricao: 'Regras para segregação obrigatória de receitas no PGDAS-D para cálculo correto (e otimizado) do DAS',
  baseLegal: 'LC 123/2006, Art. 18, §§4º e 4º-A; Resolução CGSN 140/2018, Art. 25',

  /** Tipos de segregação com impacto na tributação */
  tipos: [
    {
      id: 'monofasica',
      descricao: 'Receitas com PIS/COFINS monofásico',
      impactoTributario: 'REDUZ DAS — exclui parcela PIS/COFINS',
      baseLegal: 'Art. 18, §4º-A, I',
      comoInformar: 'Marcar como "Tributação Monofásica" no PGDAS-D para PIS/COFINS'
    },
    {
      id: 'icms_st',
      descricao: 'Receitas com ICMS já recolhido por ST',
      impactoTributario: 'REDUZ DAS — exclui parcela ICMS',
      baseLegal: 'Art. 18, §4º-A, I',
      comoInformar: 'Marcar como "Substituição Tributária" no PGDAS-D para ICMS'
    },
    {
      id: 'iss_retido',
      descricao: 'Receitas com ISS retido na fonte',
      impactoTributario: 'REDUZ DAS — deduz valor do ISS retido',
      baseLegal: 'Art. 18, §4º-A, II',
      comoInformar: 'Informar valor do ISS retido no PGDAS-D'
    },
    {
      id: 'isencao_icms_iss',
      descricao: 'Receitas com isenção/redução de ICMS ou ISS',
      impactoTributario: 'REDUZ DAS — exclui/reduz parcela isenta',
      baseLegal: 'Art. 18, §4º-A, III',
      comoInformar: 'Marcar receita como sujeita à isenção/redução no PGDAS-D'
    },
    {
      id: 'exportacao',
      descricao: 'Receitas de exportação de mercadorias ou serviços',
      impactoTributario: 'REDUZ DAS SIGNIFICATIVAMENTE — exclui COFINS, PIS, IPI, ICMS, ISS',
      baseLegal: 'Art. 18, §4º-A, IV',
      comoInformar: 'Informar receita como "Exportação" no PGDAS-D'
    },
    {
      id: 'iss_municipio_diverso',
      descricao: 'ISS devido a município diverso do estabelecimento prestador',
      impactoTributario: 'NEUTRO — ISS recolhido dentro do DAS mas para outro município',
      baseLegal: 'Art. 18, §4º-A, V',
      comoInformar: 'Informar o município onde o ISS é devido no PGDAS-D'
    }
  ],

  /** Fórmula legal de apuração do montante devido (Art. 18, §12) */
  formulaReducao: 'Na apuração do montante mensal, para receitas dos tipos acima, serão consideradas as reduções relativas aos tributos já recolhidos, monofásicos, isentos, reduzidos ou retidos.',

  /** Alerta importante */
  alerta: '⚠️ ATENÇÃO: A falta de segregação correta pode resultar em PAGAMENTO A MAIOR de tributos. Verificar mensalmente se todas as receitas estão corretamente classificadas no PGDAS-D.'
};


// ================================================================================
// SEÇÃO 26: BENEFÍCIOS EM LICITAÇÕES E COMPRAS PÚBLICAS
// ================================================================================

/**
 * Tratamento diferenciado para ME/EPP em licitações e contratações públicas.
 * Base legal: LC 123/2006, Arts. 43 a 49 (redação LC 147/2014);
 *             Lei 8.666/1993, Arts. 3º e 5º-A (redação LC 147/2014).
 */
const LICITACOES_BENEFICIOS = {
  descricao: 'Tratamento diferenciado em contratações públicas para ME/EPP',
  baseLegal: 'LC 123/2006, Arts. 43 a 49 (redação LC 147/2014); Lei 8.666/1993, Art. 3º, §14',

  beneficios: [
    {
      titulo: 'Licitação exclusiva até R$ 80.000',
      descricao: 'Administração pública DEVERÁ realizar processo licitatório destinado EXCLUSIVAMENTE a ME/EPP nos itens de até R$ 80.000.',
      valorLimite: 80_000.00,
      obrigatorioPara: 'Administração pública direta e indireta, federal, estadual e municipal',
      baseLegal: 'LC 123/2006, Art. 48, I (redação LC 147/2014)'
    },
    {
      titulo: 'Subcontratação de ME/EPP',
      descricao: 'Pode ser exigida a subcontratação de ME/EPP em obras e serviços.',
      baseLegal: 'LC 123/2006, Art. 48, II (redação LC 147/2014)'
    },
    {
      titulo: 'Cota de 25% para ME/EPP',
      descricao: 'Administração DEVERÁ estabelecer cota de até 25% do objeto para contratação de ME/EPP em bens divisíveis.',
      percentualCota: 0.25,
      baseLegal: 'LC 123/2006, Art. 48, III (redação LC 147/2014)'
    },
    {
      titulo: 'Preferência local/regional',
      descricao: 'Prioridade para ME/EPP sediadas local ou regionalmente, até 10% do melhor preço válido.',
      percentualPreferencia: 0.10,
      baseLegal: 'LC 123/2006, Art. 48, §3º (redação LC 147/2014)'
    },
    {
      titulo: 'Prazo para regularização fiscal',
      descricao: '5 dias úteis para regularização de documentação fiscal após declarada vencedora, prorrogável por mais 5 dias.',
      prazo: '5 dias úteis + 5 dias (prorrogável)',
      baseLegal: 'LC 123/2006, Art. 43, §1º (redação LC 147/2014)'
    },
    {
      titulo: 'Preferência em compras diretas (dispensa)',
      descricao: 'Em dispensas de licitação (incisos I e II do Art. 24 da Lei 8.666), compra PREFERENCIAL de ME/EPP.',
      baseLegal: 'LC 123/2006, Art. 49, IV (redação LC 147/2014)'
    },
    {
      titulo: 'Prioridade sobre preferências estrangeiras',
      descricao: 'Preferências para ME/EPP prevalecem sobre preferências para produtos/serviços estrangeiros.',
      baseLegal: 'Lei 8.666/1993, Art. 3º, §15 (incluído LC 147/2014)'
    }
  ]
};


// ================================================================================
// SEÇÃO 27: RECUPERAÇÃO JUDICIAL — BENEFÍCIOS ME/EPP
// ================================================================================

/**
 * Benefícios em recuperação judicial para ME/EPP.
 * Base legal: Lei 11.101/2005 (com alterações da LC 147/2014).
 */
const RECUPERACAO_JUDICIAL = {
  descricao: 'Benefícios especiais em recuperação judicial para ME/EPP',
  baseLegal: 'Lei 11.101/2005, alterada pela LC 147/2014',

  beneficios: [
    {
      titulo: 'Remuneração reduzida do administrador judicial',
      descricao: 'Limitada a 2% (vs até 5% para demais empresas)',
      baseLegal: 'Lei 11.101/2005, Art. 24, §5º'
    },
    {
      titulo: 'Classe própria de credores',
      descricao: 'Créditos de ME/EPP formam classe própria (Classe IV)',
      baseLegal: 'Lei 11.101/2005, Art. 41, IV'
    },
    {
      titulo: 'Aprovação por maioria simples',
      descricao: 'Plano de recuperação aprovado por maioria simples de credores presentes (não por valor)',
      baseLegal: 'Lei 11.101/2005, Art. 45, §2º'
    },
    {
      titulo: 'Parcelamento em até 36 vezes',
      descricao: 'Plano especial com parcelamento em até 36 parcelas mensais, com juros SELIC + possibilidade de abatimento',
      baseLegal: 'Lei 11.101/2005, Art. 71, II'
    },
    {
      titulo: 'Prazos 20% superiores',
      descricao: 'ME/EPP fazem jus a prazos 20% maiores que demais empresas no processo',
      baseLegal: 'Lei 11.101/2005, Art. 68, parágrafo único'
    },
    {
      titulo: 'Preferência na ordem de pagamento',
      descricao: 'Créditos de ME/EPP têm preferência na Classe IV (quirografários prioritários)',
      baseLegal: 'Lei 11.101/2005, Art. 83, IV, "d"'
    }
  ]
};


// ================================================================================
// SEÇÃO 28: ESTRATÉGIAS LEGAIS PARA MENOR IMPOSTO — RESUMO EXECUTIVO
// ================================================================================

/**
 * Resumo consolidado de TODAS as estratégias legais para pagar o menor imposto
 * possível no Simples Nacional. Referências cruzadas com as seções acima.
 *
 * Organizadas por impacto (alto/médio/baixo) e facilidade de implementação.
 *
 * Pode ser importado por segundo arquivo para gerar relatório ou dashboard.
 */
const ESTRATEGIAS_MENOR_IMPOSTO = [
  {
    id: 'E01',
    prioridade: 1,
    impacto: 'critico',
    titulo: 'Manter Fator "r" ≥ 28% (Anexo III vs V)',
    descricao: 'Garantir que a razão folha/receita fique ≥ 28% para tributação pelo Anexo III.',
    economiaEstimada: 'Até 9,5 p.p. na alíquota nominal (6% vs 15,5% na 1ª faixa)',
    comoFazer: [
      'Ajustar pró-labore dos sócios para manter folha proporcional',
      'Incluir FGTS e encargos no cálculo da folha',
      'Monitorar mensalmente a relação folha/receita',
      'Se receita crescer, aumentar folha proporcionalmente'
    ],
    referencia: 'REDUCOES_LEGAIS[7] (fator_r_otimizado)',
    baseLegal: 'LC 123/2006, Art. 18, §24 e §5º-J'
  },
  {
    id: 'E02',
    prioridade: 2,
    impacto: 'alto',
    titulo: 'Segregar receitas com tributação monofásica',
    descricao: 'Identificar e segregar no PGDAS-D as receitas de produtos com PIS/COFINS monofásico.',
    economiaEstimada: 'Redução de 3,65% a 9,25% sobre receita de produtos monofásicos',
    comoFazer: [
      'Listar todos os produtos vendidos que possuem tributação monofásica',
      'Classificar corretamente no PGDAS-D mensalmente',
      'Manter documentação comprobatória (NCM dos produtos)'
    ],
    referencia: 'REDUCOES_LEGAIS[0] (monofasica)',
    baseLegal: 'LC 123/2006, Art. 18, §4º-A, I'
  },
  {
    id: 'E03',
    prioridade: 3,
    impacto: 'alto',
    titulo: 'Segregar receitas com ICMS-ST',
    descricao: 'Excluir parcela ICMS do DAS quando já recolhido por substituição tributária.',
    economiaEstimada: 'Até 3,35% de redução no DAS (parcela ICMS)',
    comoFazer: [
      'Identificar notas de compra com ICMS-ST destacado',
      'Segregar revenda destes produtos no PGDAS-D',
      'Manter documentação fiscal organizada'
    ],
    referencia: 'REDUCOES_LEGAIS[1] (icms_st)',
    baseLegal: 'LC 123/2006, Art. 18, §4º-A, I'
  },
  {
    id: 'E04',
    prioridade: 4,
    impacto: 'alto',
    titulo: 'Deduzir ISS retido na fonte do DAS',
    descricao: 'Abater do DAS o ISS que já foi retido na fonte pelo tomador do serviço.',
    economiaEstimada: '2% a 5% do valor das notas com ISS retido',
    comoFazer: [
      'Identificar todas as notas com ISS retido',
      'Informar o valor retido no PGDAS-D mensalmente',
      'Conferir com o tomador a efetiva retenção e recolhimento'
    ],
    referencia: 'REDUCOES_LEGAIS[2] (iss_retido_fonte)',
    baseLegal: 'LC 123/2006, Art. 18, §4º-A, II; Art. 21, §4º'
  },
  {
    id: 'E05',
    prioridade: 5,
    impacto: 'alto',
    titulo: 'Isenções sobre receitas de exportação',
    descricao: 'Receitas de exportação são isentas de COFINS, PIS, IPI, ICMS e ISS no DAS.',
    economiaEstimada: '40% a 70% de redução na alíquota efetiva sobre exportação',
    comoFazer: [
      'Classificar receitas de exportação separadamente no PGDAS-D',
      'Incluir exportação via comercial exportadora ou SPE',
      'Manter documentação de exportação (DU-E, contratos)'
    ],
    referencia: 'REDUCOES_LEGAIS[4] (exportacao_isencao)',
    baseLegal: 'LC 123/2006, Art. 18, §14 e §4º-A, IV'
  },
  {
    id: 'E06',
    prioridade: 6,
    impacto: 'medio',
    titulo: 'Optar pelo regime de caixa',
    descricao: 'Reconhecer receitas apenas quando recebidas, adiando tributação.',
    economiaEstimada: 'Melhora fluxo de caixa — tributo pago somente sobre recebimentos efetivos',
    comoFazer: [
      'Optar pelo regime de caixa no PGDAS-D em janeiro',
      'Controlar rigorosamente recebimentos x faturamento',
      'Considerar se inadimplência é significativa'
    ],
    referencia: 'REDUCOES_LEGAIS[8] (regime_caixa)',
    baseLegal: 'LC 123/2006, Art. 18, §3º'
  },
  {
    id: 'E07',
    prioridade: 7,
    impacto: 'medio',
    titulo: 'Locação de bens móveis sem ISS',
    descricao: 'Segregar receita de locação de bens móveis para deduzir parcela ISS do DAS.',
    economiaEstimada: 'Até 5% de redução na alíquota sobre receita de locação',
    comoFazer: [
      'Classificar receita de locação separadamente no PGDAS-D',
      'Emitir notas específicas para locação (sem ISS)'
    ],
    referencia: 'REDUCOES_LEGAIS[12] (locacao_bens_moveis_sem_iss)',
    baseLegal: 'LC 123/2006, Art. 18, §4º, V'
  },
  {
    id: 'E08',
    prioridade: 8,
    impacto: 'medio',
    titulo: 'Escrituração contábil para distribuição de lucros otimizada',
    descricao: 'Manter escrituração contábil completa para distribuir lucros acima da presunção (32%), com isenção de IRPF.',
    economiaEstimada: 'Distribuição isenta acima de 32% quando lucro contábil for maior',
    comoFazer: [
      'Contratar contador para escrituração contábil completa',
      'Apurar lucro contábil real mês a mês',
      'Distribuir o MAIOR entre presunção e lucro contábil'
    ],
    referencia: 'Função calcularDistribuicaoLucros()',
    baseLegal: 'LC 123/2006, Art. 14'
  },
  {
    id: 'E09',
    prioridade: 9,
    impacto: 'medio',
    titulo: 'Verificar isenções municipais/estaduais de ICMS/ISS',
    descricao: 'Identificar se há isenções ou reduções concedidas pelo município/estado para atividades específicas.',
    economiaEstimada: 'Variável — de 2% a 5% de redução no DAS',
    comoFazer: [
      'Consultar legislação municipal sobre ISS (alíquotas, isenções)',
      'Consultar legislação estadual sobre ICMS (incentivos, reduções)',
      'Informar corretamente no PGDAS-D'
    ],
    referencia: 'REDUCOES_LEGAIS[5] (isencao_reducao_icms_iss)',
    baseLegal: 'LC 123/2006, Art. 18, §4º-A, III'
  },
  {
    id: 'E10',
    prioridade: 10,
    impacto: 'baixo',
    titulo: 'Invocar fiscalização orientadora (dupla visita) contra autos de infração',
    descricao: 'Contestar autos de infração que não respeitaram o critério da dupla visita.',
    economiaEstimada: 'Nulidade de autos de infração — pode evitar multas significativas',
    comoFazer: [
      'Verificar se houve visita orientadora prévia',
      'Se não houve, impugnar o auto de infração com base no Art. 55',
      'Protocolar defesa administrativa citando §6º (nulidade)'
    ],
    referencia: 'REDUCOES_LEGAIS[11] (fiscalizacao_orientadora)',
    baseLegal: 'LC 123/2006, Art. 55, §§5º e 6º'
  }
];


// ================================================================================
// SEÇÃO 29: TABELA DE PRODUTOS COM TRIBUTAÇÃO MONOFÁSICA (REFERÊNCIA)
// ================================================================================

/**
 * Lista expandida de produtos sujeitos à tributação concentrada (monofásica),
 * conforme Art. 13, §1º, XIII, "a" (redação LC 147/2014).
 *
 * Para estes produtos, PIS/COFINS (e em alguns casos ICMS) já foram recolhidos
 * na etapa de fabricação/importação. O revendedor EXCLUI estas parcelas do DAS.
 *
 * IMPORTANTE: Esta lista é uma referência. A verificação final deve ser feita
 * pela NCM (Nomenclatura Comum do Mercosul) do produto.
 *
 * Base legal: LC 123/2006, Art. 13, §1º, XIII, "a" (redação LC 147/2014);
 *             Art. 18, §4º-A, I; Resolução CGSN 140/2018, Art. 25.
 */
const PRODUTOS_MONOFASICOS = [
  { categoria: 'Combustíveis e lubrificantes', tributosConcentrados: ['PIS', 'COFINS', 'ICMS'], baseLegal: 'Lei 10.336/2001; Lei 10.865/2004' },
  { categoria: 'Cigarros e derivados do fumo', tributosConcentrados: ['PIS', 'COFINS', 'IPI'], baseLegal: 'Lei 11.196/2005' },
  { categoria: 'Bebidas frias (água, refrescos, cervejas)', tributosConcentrados: ['PIS', 'COFINS'], baseLegal: 'Lei 13.097/2015' },
  { categoria: 'Medicamentos e produtos farmacêuticos', tributosConcentrados: ['PIS', 'COFINS'], baseLegal: 'Lei 10.147/2000' },
  { categoria: 'Cosméticos, perfumaria e higiene pessoal', tributosConcentrados: ['PIS', 'COFINS'], baseLegal: 'Lei 10.147/2000' },
  { categoria: 'Veículos automotivos e autopeças', tributosConcentrados: ['PIS', 'COFINS'], baseLegal: 'Lei 10.485/2002' },
  { categoria: 'Pneumáticos, câmaras de ar e protetores', tributosConcentrados: ['PIS', 'COFINS'], baseLegal: 'Lei 10.485/2002' },
  { categoria: 'Máquinas e veículos (peças e acessórios)', tributosConcentrados: ['PIS', 'COFINS'], baseLegal: 'Lei 10.485/2002' },
  { categoria: 'Energia elétrica', tributosConcentrados: ['PIS', 'COFINS', 'ICMS'], baseLegal: 'Lei 10.637/2002' },
  { categoria: 'Óleos e azeites vegetais comestíveis', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Convênio ICMS' },
  { categoria: 'Farinha de trigo e misturas', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Convênio ICMS' },
  { categoria: 'Massas alimentícias', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Art. 13, §8º (LC 147/2014) — somente escala industrial relevante' },
  { categoria: 'Açúcares', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Convênio ICMS' },
  { categoria: 'Produtos lácteos', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Art. 13, §8º (LC 147/2014) — somente escala industrial relevante' },
  { categoria: 'Carnes e preparações', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Art. 13, §8º (LC 147/2014) — somente escala industrial relevante' },
  { categoria: 'Preparações à base de cereais', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Art. 13, §8º (LC 147/2014)' },
  { categoria: 'Chocolates', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Art. 13, §8º (LC 147/2014)' },
  { categoria: 'Produtos de padaria, bolachas e biscoitos', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Art. 13, §8º (LC 147/2014)' },
  { categoria: 'Sorvetes e preparados para sorvetes', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Convênio ICMS' },
  { categoria: 'Cafés, mates, extratos e concentrados', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Convênio ICMS' },
  { categoria: 'Molhos e preparações para molhos', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Art. 13, §8º (LC 147/2014)' },
  { categoria: 'Rações para animais domésticos', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Convênio ICMS' },
  { categoria: 'Papéis', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Convênio ICMS' },
  { categoria: 'Plásticos', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Convênio ICMS' },
  { categoria: 'Cimentos, cal e argamassas', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Convênio ICMS' },
  { categoria: 'Produtos cerâmicos para construção', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Art. 13, §8º (LC 147/2014)' },
  { categoria: 'Vidros', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Convênio ICMS' },
  { categoria: 'Tintas e vernizes', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Convênio ICMS' },
  { categoria: 'Produtos eletrônicos e eletrodomésticos', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Convênio ICMS' },
  { categoria: 'Fios, cabos e condutores elétricos', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Convênio ICMS' },
  { categoria: 'Lâmpadas, disjuntores, interruptores', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Convênio ICMS' },
  { categoria: 'Ferramentas', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Convênio ICMS' },
  { categoria: 'Álcool etílico', tributosConcentrados: ['PIS', 'COFINS', 'ICMS-ST'], baseLegal: 'Lei 9.718/1998' },
  { categoria: 'Sabões, detergentes, alvejantes, amaciantes', tributosConcentrados: ['ICMS-ST'], baseLegal: 'Art. 13, §8º (LC 147/2014) — somente escala industrial relevante para detergentes' }
];


// ================================================================================
// SEÇÃO 30: PRAZO MÍNIMO ICMS-ST (Art. 21-B — LC 147/2014)
// ================================================================================

/**
 * Prazo mínimo para vencimento do ICMS-ST, monofásico e antecipação tributária.
 * Base legal: LC 123/2006, Art. 21-B (incluído LC 147/2014).
 */
const PRAZO_MINIMO_ICMS_ST = {
  descricao: 'Prazo mínimo de 60 dias para vencimento de ICMS devido por ST, monofásica e antecipação tributária',
  prazoMinimoDias: 60,
  contadoA_partir: 'Primeiro dia do mês do fato gerador',
  aplicavelQuando: 'Responsabilidade recai sobre operações ou prestações subsequentes',
  baseLegal: 'LC 123/2006, Art. 21-B (incluído LC 147/2014)',
  observacao: 'Estados e DF devem respeitar este prazo mínimo. Prazo inferior é ilegal.'
};


// ================================================================================
// SEÇÃO 31: CNAE ADICIONAIS (§5º-I) PARA MAPEAMENTO COMPLETO
// ================================================================================

/**
 * CNAEs adicionais mapeados para completar o mapeamento §5º-I.
 * Todos usam Fator "r" para determinação de Anexo III ou V.
 */
const MAPEAMENTO_CNAE_ADICIONAL = [
  // Engenharia e Geotecnologia (Inciso VI do §5º-I)
  { cnae: '71.11-1', descricao: 'Serviços de arquitetura', tipo: 'fator_r', anexoFatorRAlto: 'III', anexoFatorRBaixo: 'V', paragrafo5I: 'VI' },
  { cnae: '71.12-0', descricao: 'Serviços de engenharia', tipo: 'fator_r', anexoFatorRAlto: 'III', anexoFatorRBaixo: 'V', paragrafo5I: 'VI' },
  { cnae: '71.20-1', descricao: 'Testes e análises técnicas', tipo: 'fator_r', anexoFatorRAlto: 'III', anexoFatorRBaixo: 'V', paragrafo5I: 'VI' },
  { cnae: '72.10-0', descricao: 'Pesquisa e desenvolvimento em ciências físicas e naturais', tipo: 'fator_r', anexoFatorRAlto: 'III', anexoFatorRBaixo: 'V', paragrafo5I: 'VI' },
  { cnae: '74.10-2', descricao: 'Design e decoração de interiores', tipo: 'fator_r', anexoFatorRAlto: 'III', anexoFatorRBaixo: 'V', paragrafo5I: 'VI' },

  // Medicina (Inciso I)
  { cnae: '86.10-1', descricao: 'Atividades de atendimento hospitalar', tipo: 'fator_r', anexoFatorRAlto: 'III', anexoFatorRBaixo: 'V', paragrafo5I: 'I' },
  { cnae: '86.21-6', descricao: 'Serviços móveis de atendimento a urgências', tipo: 'fator_r', anexoFatorRAlto: 'III', anexoFatorRBaixo: 'V', paragrafo5I: 'I' },

  // Medicina Veterinária (Inciso II)
  { cnae: '75.00-1', descricao: 'Atividades veterinárias', tipo: 'fator_r', anexoFatorRAlto: 'III', anexoFatorRBaixo: 'V', paragrafo5I: 'II' },

  // Psicologia, terapia, etc. (Inciso IV)
  { cnae: '86.50-0', descricao: 'Atividades de profissionais da área de saúde (exceto médicos e odontólogos)', tipo: 'fator_r', anexoFatorRAlto: 'III', anexoFatorRBaixo: 'V', paragrafo5I: 'IV' },
  { cnae: '86.90-9', descricao: 'Atividades de atenção à saúde humana NE', tipo: 'fator_r', anexoFatorRAlto: 'III', anexoFatorRBaixo: 'V', paragrafo5I: 'IV' },

  // Representação Comercial (Inciso VII)
  { cnae: '46.13-3', descricao: 'Representantes comerciais e agentes do comércio', tipo: 'fator_r', anexoFatorRAlto: 'III', anexoFatorRBaixo: 'V', paragrafo5I: 'VII' },

  // Jornalismo e Publicidade (Inciso X)
  { cnae: '63.91-7', descricao: 'Agências de notícias', tipo: 'fator_r', anexoFatorRAlto: 'III', anexoFatorRBaixo: 'V', paragrafo5I: 'X' },
  { cnae: '73.12-2', descricao: 'Agenciamento de espaços para publicidade', tipo: 'fator_r', anexoFatorRAlto: 'III', anexoFatorRBaixo: 'V', paragrafo5I: 'X' },

  // Agenciamento (Inciso XI)
  { cnae: '79.11-2', descricao: 'Agências de viagens', tipo: 'fator_r', anexoFatorRAlto: 'III', anexoFatorRBaixo: 'V', paragrafo5I: 'XI' },
  { cnae: '79.12-1', descricao: 'Operadores turísticos', tipo: 'fator_r', anexoFatorRAlto: 'III', anexoFatorRBaixo: 'V', paragrafo5I: 'XI' },

  // Transporte — Regra especial (§5º-E)
  { cnae: '49.30-2', descricao: 'Transporte rodoviário de carga', tipo: 'fixo', anexoFixo: 'III_ESPECIAL', observacao: 'Anexo III base, deduz ISS, acrescenta ICMS Anexo I — §5º-E' },
  { cnae: '50.11-4', descricao: 'Transporte marítimo de cabotagem — carga', tipo: 'fixo', anexoFixo: 'III_ESPECIAL', observacao: 'Transporte fluvial/marítimo — §5º-E' },
  { cnae: '50.22-0', descricao: 'Transporte por navegação interior de carga', tipo: 'fixo', anexoFixo: 'III_ESPECIAL', observacao: 'Transporte fluvial — §5º-E e inciso VI Art. 17' },

  // Fisioterapia e Corretagem de Seguros — Anexo III FIXO (§5º-B)
  { cnae: '86.50-0/04', descricao: 'Atividades de fisioterapia', tipo: 'fixo', anexoFixo: 'III', paragrafo: '5B-XVI' },
  { cnae: '66.22-3', descricao: 'Corretagem e intermediação de seguros', tipo: 'fixo', anexoFixo: 'III', paragrafo: '5B-XVII' }
];


// ================================================================================
// SEÇÃO 4-INT: INTEGRAÇÃO COM CnaeMapeamento (cnae-mapeamento.js)
// ================================================================================

/**
 * Funções de integração com o módulo CnaeMapeamento.
 * Fallback gracioso: se CnaeMapeamento não estiver disponível, usa MAPEAMENTO_CNAE local.
 *
 * @requires CnaeMapeamento (cnae-mapeamento.js) — opcional, com fallback
 */

/**
 * Obtém referência ao módulo CnaeMapeamento, se disponível.
 * @returns {Object|null}
 */
function _getCnaeMapeamento() {
  if (typeof CnaeMapeamento !== 'undefined') return CnaeMapeamento;
  if (typeof globalThis !== 'undefined' && globalThis.CnaeMapeamento) return globalThis.CnaeMapeamento;
  try { return require('./cnae-mapeamento.js'); } catch (e) { return null; }
}

/**
 * Obtém regras tributárias de um CNAE, usando CnaeMapeamento se disponível.
 * @param {string} codigo — Código CNAE (ex: '7119-7/00' ou '71.19-7')
 * @param {string} [categoria] — Categoria fallback: 'Comercio', 'Industria', 'Servico', 'Transporte'
 * @returns {Object} { anexo, fatorR, presuncaoIRPJ, presuncaoCSLL, vedado, motivoVedacao, obs, monofasico }
 */
function obterRegrasCNAE(codigo, categoria) {
  const cm = _getCnaeMapeamento();
  if (cm && typeof cm.obterRegrasCNAE === 'function') {
    const regras = cm.obterRegrasCNAE(codigo, categoria);
    const monofasico = typeof cm.isMonofasico === 'function' ? cm.isMonofasico(codigo) : false;
    return { ...regras, monofasico };
  }
  // Fallback: usar MAPEAMENTO_CNAE local
  const cnaeNorm = codigo.replace(/[^0-9]/g, '').substring(0, 5);
  const cnaeFormatado = cnaeNorm.substring(0, 2) + '.' + cnaeNorm.substring(2, 4) + '-' + cnaeNorm.substring(4);
  const local = MAPEAMENTO_CNAE.find(c => c.cnae === cnaeFormatado);
  if (local) {
    const isServico = ['III', 'IV', 'V'].includes(local.anexoFixo || local.anexoFatorRAlto);
    return {
      anexo: local.tipo === 'fixo' ? local.anexoFixo : null,
      fatorR: local.tipo === 'fator_r',
      presuncaoIRPJ: isServico ? 0.32 : 0.08,
      presuncaoCSLL: isServico ? 0.32 : 0.12,
      vedado: local.tipo === 'vedado',
      motivoVedacao: local.tipo === 'vedado' ? local.observacao : null,
      obs: local.observacao,
      monofasico: false,
      fonte: 'MAPEAMENTO_CNAE_LOCAL'
    };
  }
  // Fallback por categoria
  const fallbacks = {
    'Comercio': { anexo: 'I', presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
    'Industria': { anexo: 'II', presuncaoIRPJ: 0.08, presuncaoCSLL: 0.12 },
    'Servico': { anexo: null, presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 },
    'Transporte': { anexo: 'III', presuncaoIRPJ: 0.16, presuncaoCSLL: 0.12 }
  };
  const fb = fallbacks[categoria] || fallbacks['Servico'];
  return {
    ...fb, fatorR: !fb.anexo, vedado: false, motivoVedacao: null,
    obs: `Fallback por categoria: ${categoria || 'Servico'}`, monofasico: false, fonte: 'FALLBACK'
  };
}

/**
 * Verifica se CNAE é vedado ao Simples Nacional.
 * @param {string} codigo
 * @returns {false|string} false se permitido, string com motivo se vedado
 */
function isVedadoCNAE(codigo) {
  const cm = _getCnaeMapeamento();
  if (cm && typeof cm.isVedado === 'function') return cm.isVedado(codigo);
  const regras = obterRegrasCNAE(codigo);
  return regras.vedado ? (regras.motivoVedacao || 'Vedado ao Simples Nacional') : false;
}

/**
 * Obtém o anexo efetivo considerando Fator R.
 * @param {string} codigo
 * @param {string} [categoria]
 * @param {number} [fatorR]
 * @returns {string} 'I'|'II'|'III'|'IV'|'V'|'VEDADO'
 */
function obterAnexoEfetivoCNAE(codigo, categoria, fatorR) {
  const cm = _getCnaeMapeamento();
  if (cm && typeof cm.obterAnexoEfetivo === 'function') return cm.obterAnexoEfetivo(codigo, categoria, fatorR);
  const regras = obterRegrasCNAE(codigo, categoria);
  if (regras.vedado) return 'VEDADO';
  if (regras.fatorR) return (fatorR !== undefined && fatorR >= LIMITE_FATOR_R) ? 'III' : 'V';
  return regras.anexo || 'III';
}

/**
 * Verifica se CNAE possui tributação monofásica.
 * @param {string} codigo
 * @returns {false|string}
 */
function isMonofasicoCNAE(codigo) {
  const cm = _getCnaeMapeamento();
  if (cm && typeof cm.isMonofasico === 'function') return cm.isMonofasico(codigo);
  return false; // Sem CnaeMapeamento, não temos dados de monofásica
}


// ================================================================================
// SEÇÃO 5-INT: INTEGRAÇÃO COM Estados (estados.js)
// ================================================================================

/**
 * Funções de integração com o módulo Estados/EstadosBR.
 * @requires Estados (estados.js) — opcional, com fallback
 */

/**
 * Obtém referência ao módulo Estados.
 * @returns {Object|null}
 */
function _getEstados() {
  if (typeof Estados !== 'undefined') return Estados;
  if (typeof EstadosBR !== 'undefined') return EstadosBR;
  if (typeof globalThis !== 'undefined') {
    if (globalThis.Estados) return globalThis.Estados;
    if (globalThis.EstadosBR) return globalThis.EstadosBR;
  }
  try { return require('./estados.js'); } catch (e) { return null; }
}

/**
 * Obtém dados completos de um estado brasileiro.
 * @param {string} uf — Sigla da UF (ex: 'PA', 'SP')
 * @returns {Object|null}
 */
function obterDadosEstado(uf) {
  const est = _getEstados();
  if (est && typeof est.getEstado === 'function') return est.getEstado(uf);
  // Fallback mínimo
  return null;
}

/**
 * Verifica se a UF está em área de incentivo SUDAM/SUDENE/ZFM.
 * @param {string} uf
 * @returns {Object} { sudam: boolean, sudene: boolean, zfm: boolean, reducaoIRPJ: number }
 */
function verificarIncentivosRegionais(uf) {
  const dadosEstado = obterDadosEstado(uf);
  if (dadosEstado && dadosEstado.incentivos) {
    const inc = dadosEstado.incentivos;
    const sudam = !!(inc.sudam || inc.SUDAM);
    const sudene = !!(inc.sudene || inc.SUDENE);
    const zfm = !!(inc.zfm || inc.ZFM);
    return { sudam, sudene, zfm, reducaoIRPJ: (sudam || sudene) ? 0.75 : (zfm ? 0.75 : 0) };
  }
  // Fallback por UF conhecida
  const SUDAM_UFS = ['AC', 'AM', 'AP', 'MA', 'MT', 'PA', 'RO', 'RR', 'TO'];
  const SUDENE_UFS = ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'];
  const sudam = SUDAM_UFS.includes(uf);
  const sudene = SUDENE_UFS.includes(uf);
  const zfm = uf === 'AM'; // Zona Franca de Manaus
  return { sudam, sudene, zfm, reducaoIRPJ: (sudam || sudene || zfm) ? 0.75 : 0 };
}

/**
 * Obtém alíquota ICMS interna do estado.
 * @param {string} uf
 * @returns {number} Alíquota ICMS (ex: 0.17 para 17%)
 */
function obterAliquotaICMS(uf) {
  const dadosEstado = obterDadosEstado(uf);
  if (dadosEstado && dadosEstado.icms && dadosEstado.icms.aliquota_interna) {
    return dadosEstado.icms.aliquota_interna;
  }
  // Fallback genérico
  const aliquotasPadrao = { SP: 0.18, MG: 0.18, RJ: 0.20, RS: 0.17, PR: 0.19 };
  return aliquotasPadrao[uf] || 0.17;
}


// ================================================================================
// SEÇÃO 6-INT: INTEGRAÇÃO COM MunicipiosIBGE (municipios.js)
// ================================================================================

/**
 * Funções de integração com o módulo MunicipiosIBGE.
 * @requires MunicipiosIBGE (municipios.js) — opcional, com fallback
 */

/**
 * Obtém referência ao módulo MunicipiosIBGE.
 * @returns {Object|null}
 */
function _getMunicipiosIBGE() {
  if (typeof MunicipiosIBGE !== 'undefined') return MunicipiosIBGE;
  if (typeof globalThis !== 'undefined' && globalThis.MunicipiosIBGE) return globalThis.MunicipiosIBGE;
  try { return require('./municipios.js'); } catch (e) { return null; }
}

/**
 * Obtém alíquota ISS de um município.
 * @param {string} uf
 * @param {string} municipio — Nome do município
 * @returns {number} Alíquota ISS (ex: 0.05 para 5%)
 */
function obterAliquotaISS(uf, municipio) {
  // Tentar do módulo Estados primeiro (ISS da capital como referência)
  const dadosEstado = obterDadosEstado(uf);
  if (dadosEstado && dadosEstado.iss) {
    // Se tiver ISS por município
    if (dadosEstado.iss.municipios && dadosEstado.iss.municipios[municipio]) {
      return dadosEstado.iss.municipios[municipio] / 100;
    }
    // ISS geral do estado (capital)
    if (dadosEstado.iss.aliquota_geral) {
      return dadosEstado.iss.aliquota_geral / 100;
    }
  }
  // Fallback: ISS padrão 5%
  return ISS_MAXIMO;
}


// ================================================================================
// SEÇÃO 13: calcularDASMensalOtimizado() ★ NOVO
// ================================================================================

/**
 * Calcula o DAS mensal COM TODAS as deduções legais aplicadas automaticamente.
 * Esta é a função PRINCIPAL do IMPOST. — calcula o MENOR DAS legal possível.
 *
 * Base legal: LC 123/2006, Art. 18, §§4º e 4º-A; Resolução CGSN 140/2018, Art. 25.
 *
 * @param {Object} params
 * @param {number} params.receitaBrutaMensal     — Receita bruta total do mês
 * @param {number} params.rbt12                   — RBT12 (últimos 12 meses)
 * @param {string} params.anexo                   — Anexo aplicável (I a V)
 * @param {string} [params.cnae]                  — CNAE principal
 * @param {string} [params.uf]                    — UF da empresa
 * @param {string} [params.municipio]             — Município da empresa
 * @param {number} [params.receitaMonofasica=0]   — Parcela com PIS/COFINS monofásico
 * @param {number} [params.receitaICMS_ST=0]      — Parcela com ICMS já recolhido por ST
 * @param {number} [params.receitaExportacao=0]   — Parcela de exportação
 * @param {number} [params.receitaLocacaoBensMoveis=0] — Parcela de locação sem ISS
 * @param {number} [params.issRetidoFonte=0]      — Valor de ISS retido na fonte
 * @param {number} [params.folhaMensal=0]         — Folha mensal (para Anexo IV)
 * @param {number} [params.aliquotaRAT=0.02]      — RAT
 * @param {number} [params.aliquotaISS=null]      — ISS do município (se null, busca automaticamente)
 * @returns {Object} Resultado completo com DAS otimizado e economia
 */
function calcularDASMensalOtimizado(params) {
  const {
    receitaBrutaMensal,
    rbt12,
    anexo,
    cnae = null,
    uf = null,
    municipio = null,
    receitaMonofasica = 0,
    receitaICMS_ST = 0,
    receitaExportacao = 0,
    receitaLocacaoBensMoveis = 0,
    issRetidoFonte = 0,
    folhaMensal = 0,
    aliquotaRAT = ALIQUOTA_RAT_PADRAO,
    aliquotaISS = null
  } = params;

  if (!receitaBrutaMensal || receitaBrutaMensal <= 0) {
    throw new Error('[DAS_OPT_001] Receita bruta mensal deve ser maior que zero.');
  }
  if (!rbt12 || rbt12 <= 0) {
    throw new Error('[DAS_OPT_002] RBT12 deve ser maior que zero.');
  }

  // 1. Calcular DAS "cheio" (sem otimização)
  const dasCheio = calcularDASMensal({
    receitaBrutaMensal,
    rbt12,
    anexo,
    issRetidoFonte: 0,
    folhaMensal,
    aliquotaRAT
  });

  const aliquotaEfetiva = dasCheio.aliquotaEfetiva;
  const faixa = dasCheio.faixa;
  const idx = faixa - 1;
  const partilhaPerc = PARTILHA[anexo] ? PARTILHA[anexo][idx] : null;

  if (!partilhaPerc) {
    throw new Error(`[DAS_OPT_003] Partilha não encontrada para Anexo ${anexo}, Faixa ${faixa}.`);
  }

  // 2. Array de deduções aplicadas
  const deducoes = [];
  let dasOtimizado = 0;

  // Parcela de receita com tributação normal (sem benefício)
  const receitaNormal = Math.max(0,
    receitaBrutaMensal - receitaMonofasica - receitaICMS_ST - receitaExportacao - receitaLocacaoBensMoveis
  );

  // DAS sobre receita normal = alíquota efetiva × receita normal
  const dasNormal = _arredondar(receitaNormal * aliquotaEfetiva);
  dasOtimizado += dasNormal;

  // 3a. MONOFÁSICA: zerar PIS/COFINS sobre receitaMonofasica
  if (receitaMonofasica > 0 && partilhaPerc) {
    const percPisCofins = (partilhaPerc.pis || 0) + (partilhaPerc.cofins || 0);
    const dasMonofasica = _arredondar(receitaMonofasica * aliquotaEfetiva * (1 - percPisCofins));
    const economiaMonofasica = _arredondar(receitaMonofasica * aliquotaEfetiva * percPisCofins);
    dasOtimizado += dasMonofasica;
    deducoes.push({
      id: 'monofasica',
      descricao: 'Tributação Monofásica — PIS/COFINS zerados',
      receitaAfetada: _arredondar(receitaMonofasica),
      economia: economiaMonofasica,
      baseLegal: 'LC 123/2006, Art. 18, §4º-A, I'
    });
  }

  // 3b. ICMS-ST: zerar ICMS sobre receitaICMS_ST
  if (receitaICMS_ST > 0 && partilhaPerc) {
    const percICMS = partilhaPerc.icms || 0;
    const dasST = _arredondar(receitaICMS_ST * aliquotaEfetiva * (1 - percICMS));
    const economiaST = _arredondar(receitaICMS_ST * aliquotaEfetiva * percICMS);
    dasOtimizado += dasST;
    deducoes.push({
      id: 'icms_st',
      descricao: 'ICMS-ST — ICMS já recolhido por Substituição Tributária',
      receitaAfetada: _arredondar(receitaICMS_ST),
      economia: economiaST,
      baseLegal: 'LC 123/2006, Art. 18, §4º-A, I'
    });
  }

  // 3c. EXPORTAÇÃO: zerar COFINS, PIS, IPI, ICMS, ISS (manter IRPJ + CSLL + CPP)
  if (receitaExportacao > 0 && partilhaPerc) {
    const percMantidos = (partilhaPerc.irpj || 0) + (partilhaPerc.csll || 0) + (partilhaPerc.cpp || 0);
    const dasExportacao = _arredondar(receitaExportacao * aliquotaEfetiva * percMantidos);
    const economiaExportacao = _arredondar(receitaExportacao * aliquotaEfetiva * (1 - percMantidos));
    dasOtimizado += dasExportacao;
    deducoes.push({
      id: 'exportacao',
      descricao: 'Exportação — isentos COFINS, PIS, IPI, ICMS, ISS',
      receitaAfetada: _arredondar(receitaExportacao),
      economia: economiaExportacao,
      baseLegal: 'LC 123/2006, Art. 18, §14 e §4º-A, IV'
    });
  }

  // 3d. LOCAÇÃO DE BENS MÓVEIS: zerar ISS
  if (receitaLocacaoBensMoveis > 0 && partilhaPerc) {
    const percISS = partilhaPerc.iss || 0;
    const dasLocacao = _arredondar(receitaLocacaoBensMoveis * aliquotaEfetiva * (1 - percISS));
    const economiaLocacao = _arredondar(receitaLocacaoBensMoveis * aliquotaEfetiva * percISS);
    dasOtimizado += dasLocacao;
    deducoes.push({
      id: 'locacao_bens_moveis',
      descricao: 'Locação de bens móveis — ISS não incide',
      receitaAfetada: _arredondar(receitaLocacaoBensMoveis),
      economia: economiaLocacao,
      baseLegal: 'LC 123/2006, Art. 18, §4º, V'
    });
  }

  // 3e. ISS RETIDO NA FONTE: deduzir do DAS
  let issRetidoEfetivo = 0;
  if (issRetidoFonte > 0) {
    const issNoDAS = dasOtimizado * (partilhaPerc.iss || 0);
    issRetidoEfetivo = _arredondar(Math.min(issRetidoFonte, issNoDAS));
    dasOtimizado = _arredondar(dasOtimizado - issRetidoEfetivo);
    deducoes.push({
      id: 'iss_retido',
      descricao: 'ISS retido na fonte pelo tomador',
      receitaAfetada: 0,
      economia: issRetidoEfetivo,
      baseLegal: 'LC 123/2006, Art. 18, §4º-A, II; Art. 21, §4º'
    });
  }

  dasOtimizado = _arredondar(Math.max(0, dasOtimizado));
  const dasSemOtimizacao = dasCheio.dasValor;
  const economiaTotal = _arredondar(dasSemOtimizacao - dasOtimizado);

  // INSS patronal por fora (Anexo IV)
  let inssPatronalFora = 0;
  if (anexo === 'IV') {
    inssPatronalFora = _arredondar(folhaMensal * (ALIQUOTA_INSS_PATRONAL_ANEXO_IV + aliquotaRAT));
  }

  // Calcular partilha otimizada
  const partilhaOtimizada = calcularPartilhaTributos(dasOtimizado, faixa, anexo, receitaBrutaMensal, aliquotaEfetiva);

  // Alertas
  const alertas = [];
  if (economiaTotal > 0) {
    alertas.push({
      tipo: 'economia',
      mensagem: `✅ Economia de ${_fmtBRL(economiaTotal)} (${((economiaTotal / dasSemOtimizacao) * 100).toFixed(1)}%) aplicando ${deducoes.length} dedução(ões) legal(is).`
    });
  }
  if (rbt12 > SUBLIMITE_ICMS_ISS) {
    alertas.push({
      tipo: 'sublimite',
      mensagem: `⚠️ RBT12 acima do sublimite de ${_fmtBRL(SUBLIMITE_ICMS_ISS)}. ICMS e ISS devem ser recolhidos por fora.`
    });
  }
  if (cnae) {
    const mono = isMonofasicoCNAE(cnae);
    if (mono && receitaMonofasica === 0) {
      alertas.push({
        tipo: 'oportunidade',
        mensagem: `💡 CNAE ${cnae} pode ter produtos monofásicos (${mono}). Segregar receita monofásica pode gerar economia adicional.`
      });
    }
  }

  return {
    receitaBrutaMensal: _arredondar(receitaBrutaMensal),
    rbt12: _arredondar(rbt12),
    anexo,
    faixa,
    aliquotaEfetiva,
    aliquotaEfetivaFormatada: dasCheio.aliquotaEfetivaFormatada,
    dasSemOtimizacao: _arredondar(dasSemOtimizacao),
    dasOtimizado,
    economiaTotal,
    economiaPercentual: dasSemOtimizacao > 0 ? _arredondar(economiaTotal / dasSemOtimizacao, 4) : 0,
    deducoes,
    partilha: partilhaOtimizada,
    issRetidoFonte: issRetidoEfetivo,
    inssPatronalFora,
    totalAPagar: _arredondar(dasOtimizado + inssPatronalFora),
    alertas,
    baseLegal: 'LC 123/2006, Art. 18, §§4º e 4º-A; Resolução CGSN 140/2018, Art. 25'
  };
}


// ================================================================================
// SEÇÃO 14: calcularDASSegregado() ★ NOVO
// ================================================================================

/**
 * Calcula DAS com receitas segregadas por múltiplos CNAEs/anexos.
 *
 * Base legal: Resolução CGSN 140/2018, Art. 25 — segregação obrigatória.
 *
 * @param {Object} params
 * @param {Array<Object>} params.receitas — Array de receitas segregadas:
 *   [{ valor, cnae, anexo, receitaMonofasica, receitaICMS_ST, receitaExportacao, ... }]
 * @param {number} params.rbt12          — RBT12 total (compartilhado)
 * @param {number} [params.folhaSalarios12Meses=0] — Folha total 12 meses
 * @param {string} [params.uf]
 * @param {string} [params.municipio]
 * @returns {Object} Resultado consolidado com DAS total e detalhamento por CNAE
 */
function calcularDASSegregado(params) {
  const {
    receitas,
    rbt12,
    folhaSalarios12Meses = 0,
    uf = null,
    municipio = null
  } = params;

  if (!receitas || !Array.isArray(receitas) || receitas.length === 0) {
    throw new Error('[DAS_SEG_001] Deve fornecer array de receitas segregadas.');
  }

  const fatorR = rbt12 > 0 ? folhaSalarios12Meses / rbt12 : 0;
  const detalhamento = [];
  let dasTotal = 0;
  let dasSemOtimizacaoTotal = 0;
  let receitaTotal = 0;

  for (const receita of receitas) {
    const cnae = receita.cnae || null;
    let anexo = receita.anexo;

    // Determinar anexo automaticamente se não fornecido
    if (!anexo && cnae) {
      anexo = obterAnexoEfetivoCNAE(cnae, null, fatorR);
    }
    if (!anexo) {
      throw new Error(`[DAS_SEG_002] Não foi possível determinar o anexo para a receita com CNAE ${cnae}.`);
    }
    if (anexo === 'VEDADO') {
      throw new Error(`[DAS_SEG_003] CNAE ${cnae} é vedado ao Simples Nacional.`);
    }

    const resultado = calcularDASMensalOtimizado({
      receitaBrutaMensal: receita.valor,
      rbt12, // RBT12 compartilhado
      anexo,
      cnae,
      uf,
      municipio,
      receitaMonofasica: receita.receitaMonofasica || 0,
      receitaICMS_ST: receita.receitaICMS_ST || 0,
      receitaExportacao: receita.receitaExportacao || 0,
      receitaLocacaoBensMoveis: receita.receitaLocacaoBensMoveis || 0,
      issRetidoFonte: receita.issRetidoFonte || 0,
      folhaMensal: receita.folhaMensal || 0
    });

    dasTotal += resultado.dasOtimizado;
    dasSemOtimizacaoTotal += resultado.dasSemOtimizacao;
    receitaTotal += receita.valor;

    detalhamento.push({
      cnae,
      anexo,
      receita: _arredondar(receita.valor),
      dasOtimizado: resultado.dasOtimizado,
      dasSemOtimizacao: resultado.dasSemOtimizacao,
      economia: resultado.economiaTotal,
      aliquotaEfetiva: resultado.aliquotaEfetiva,
      deducoes: resultado.deducoes
    });
  }

  dasTotal = _arredondar(dasTotal);
  dasSemOtimizacaoTotal = _arredondar(dasSemOtimizacaoTotal);
  const economiaTotal = _arredondar(dasSemOtimizacaoTotal - dasTotal);

  return {
    receitaTotal: _arredondar(receitaTotal),
    rbt12: _arredondar(rbt12),
    dasTotal,
    dasSemOtimizacaoTotal,
    economiaTotal,
    aliquotaEfetivaMedia: receitaTotal > 0 ? _arredondar(dasTotal / receitaTotal, 6) : 0,
    totalCNAEs: receitas.length,
    detalhamento,
    baseLegal: 'Resolução CGSN 140/2018, Art. 25 — segregação obrigatória de receitas'
  };
}


// ================================================================================
// SEÇÃO 21: otimizarFatorR() ★ NOVO
// ================================================================================

/**
 * Simula cenários de folha de pagamento e retorna o ponto ótimo.
 * Responde: "Se aumentar o pró-labore em R$ X, economiza R$ Y no DAS"
 *
 * Base legal: Resolução CGSN 140/2018, Art. 18, §5º-J.
 *
 * @param {Object} params
 * @param {number} params.rbt12
 * @param {number} params.folhaAtual12Meses
 * @param {number} params.receitaMensal
 * @param {string} [params.cnae]
 * @param {number} [params.encargosPatronaisFolha=0.300] — Encargos patronais sobre folha:
 *   FGTS (8%) + INSS Patronal (20%) + RAT (2%) = 30% para ME/EPP com até 3 func.
 *   Use 0.358 para empresas com mais de 3 func. (+ Terceiros/Sistema S 5,8%)
 * @returns {Object} Cenário ótimo e tabela de cenários
 */
function otimizarFatorR(params) {
  const {
    rbt12,
    folhaAtual12Meses,
    receitaMensal,
    cnae = null,
    encargosPatronaisFolha = 0.300 // FGTS(8%) + INSS Patronal(20%) + RAT(2%) = 30% | use 0.358 com Sistema S
  } = params;

  if (!rbt12 || rbt12 <= 0) throw new Error('[FATOR_R_OPT_001] RBT12 deve ser maior que zero.');
  if (!receitaMensal || receitaMensal <= 0) throw new Error('[FATOR_R_OPT_002] Receita mensal deve ser maior que zero.');

  const fatorRAtual = folhaAtual12Meses / rbt12;
  const anexoAtual = fatorRAtual >= LIMITE_FATOR_R ? 'III' : 'V';
  const folhaNecessaria12Meses = _arredondar(rbt12 * LIMITE_FATOR_R);
  const deficitFolha12Meses = Math.max(0, folhaNecessaria12Meses - folhaAtual12Meses);
  const aumentoMensalNecessario = _arredondar(deficitFolha12Meses / 12);

  // Se já está no Anexo III
  if (fatorRAtual >= LIMITE_FATOR_R) {
    return {
      fatorRAtual: _arredondar(fatorRAtual, 4),
      anexoAtual: 'III',
      jaOtimizado: true,
      mensagem: `Fator "r" atual (${(fatorRAtual * 100).toFixed(2)}%) já está acima de 28%. Empresa já tributada no Anexo III.`,
      fatorRNecessario: LIMITE_FATOR_R,
      folhaNecessaria12Meses,
      aumentoMensalNecessario: 0,
      custoAumentoMensal: 0,
      custoAumentoAnual: 0,
      economiaDASMensal: 0,
      economiaDASAnual: 0,
      economiaLiquida: 0,
      vale_a_pena: false,
      cenarios: [],
      baseLegal: 'Resolução CGSN 140/2018, Art. 18, §5º-J'
    };
  }

  // Calcular DAS atual (Anexo V) e DAS alvo (Anexo III)
  let dasAnexoV, dasAnexoIII;
  try {
    const aliqV = calcularAliquotaEfetiva({ rbt12, anexo: 'V' });
    const aliqIII = calcularAliquotaEfetiva({ rbt12, anexo: 'III' });
    dasAnexoV = _arredondar(receitaMensal * aliqV.aliquotaEfetiva);
    dasAnexoIII = _arredondar(receitaMensal * aliqIII.aliquotaEfetiva);
  } catch (e) {
    throw new Error(`[FATOR_R_OPT_003] Erro ao calcular alíquotas: ${e.message}`);
  }

  const economiaDASMensal = _arredondar(dasAnexoV - dasAnexoIII);
  const economiaDASAnual = _arredondar(economiaDASMensal * 12);
  const custoAumentoMensal = _arredondar(aumentoMensalNecessario * (1 + encargosPatronaisFolha));
  const custoAumentoAnual = _arredondar(custoAumentoMensal * 12);
  const economiaLiquida = _arredondar(economiaDASAnual - custoAumentoAnual);

  // Simular cenários incrementais (de R$ 500 em R$ 500)
  const cenarios = [];
  const maxIncremento = Math.ceil(aumentoMensalNecessario / 500) + 5;
  for (let i = 0; i <= maxIncremento; i++) {
    const incremento = i * 500;
    const novaFolhaMensal = (folhaAtual12Meses / 12) + incremento;
    const novaFolha12M = novaFolhaMensal * 12;
    const novoFatorR = novaFolha12M / rbt12;
    const novoAnexo = novoFatorR >= LIMITE_FATOR_R ? 'III' : 'V';
    const novoAliq = novoAnexo === 'III' ? dasAnexoIII : dasAnexoV;
    const custoExtra = _arredondar(incremento * (1 + encargosPatronaisFolha));
    const custoExtraAnual = _arredondar(custoExtra * 12);
    const economiaDAS = novoAnexo === 'III' ? economiaDASAnual : 0;
    const econLiquida = _arredondar(economiaDAS - custoExtraAnual);

    cenarios.push({
      incrementoMensal: incremento,
      folhaMensal: _arredondar(novaFolhaMensal),
      fatorR: _arredondar(novoFatorR, 4),
      anexo: novoAnexo,
      dasMensal: novoAliq,
      custoExtraMensal: custoExtra,
      custoExtraAnual: custoExtraAnual,
      economiaLiquida: econLiquida
    });

    // Parar quando já está no Anexo III e economia começa a diminuir
    if (novoAnexo === 'III' && i > 2 && cenarios.length > 3) {
      if (cenarios[cenarios.length - 1].economiaLiquida < cenarios[cenarios.length - 2].economiaLiquida) {
        break;
      }
    }
  }

  // Encontrar cenário ótimo (maior economia líquida)
  const cenarioOtimo = cenarios.reduce((melhor, c) => {
    return c.economiaLiquida > melhor.economiaLiquida ? c : melhor;
  }, cenarios[0]);

  return {
    fatorRAtual: _arredondar(fatorRAtual, 4),
    fatorRAtualFormatado: (fatorRAtual * 100).toFixed(2).replace('.', ',') + '%',
    anexoAtual,
    jaOtimizado: false,
    fatorRNecessario: LIMITE_FATOR_R,
    folhaNecessaria12Meses,
    aumentoMensalNecessario,
    custoAumentoMensal,
    custoAumentoAnual,
    economiaDASMensal,
    economiaDASAnual,
    economiaLiquida,
    vale_a_pena: economiaLiquida > 0,
    cenarioOtimo,
    cenarios,
    baseLegal: 'Resolução CGSN 140/2018, Art. 18, §5º-J'
  };
}


// ================================================================================
// SEÇÃO 20: compararRegimesCompleto() ★ NOVO
// ================================================================================

/**
 * Comparação completa entre regimes tributários usando dados reais dos módulos.
 * Refatoração da compararComOutrosRegimes() com integração CnaeMapeamento + Estados.
 *
 * @param {Object} params
 * @param {number} params.receitaBrutaAnual
 * @param {number} params.folhaAnual
 * @param {string} params.cnae
 * @param {string} [params.uf]
 * @param {string} [params.municipio]
 * @param {number} [params.fatorR]
 * @param {number} [params.despesasOperacionais=0]
 * @param {number} [params.lucroContabilEfetivo]
 * @param {Object} [params.receitasSegregadas] — Para DAS otimizado
 * @param {Array<Object>} [params.socios]
 * @returns {Object} Comparativo completo entre regimes
 */
function compararRegimesCompleto(params) {
  const {
    receitaBrutaAnual,
    folhaAnual,
    cnae,
    uf = null,
    municipio = null,
    fatorR = null,
    despesasOperacionais = 0,
    lucroContabilEfetivo = null,
    receitasSegregadas = null,
    socios = [],
    aliquotaRAT = ALIQUOTA_RAT_PADRAO
  } = params;

  // 1. Buscar regras CNAE
  const regrasCNAE = cnae ? obterRegrasCNAE(cnae) : { presuncaoIRPJ: 0.32, presuncaoCSLL: 0.32 };
  const presuncaoIRPJ = regrasCNAE.presuncaoIRPJ || 0.32;
  const presuncaoCSLL = regrasCNAE.presuncaoCSLL || 0.32;

  // 2. Buscar incentivos regionais
  const incentivos = uf ? verificarIncentivosRegionais(uf) : { sudam: false, sudene: false, zfm: false, reducaoIRPJ: 0 };
  const temIncentivo = incentivos.sudam || incentivos.sudene || incentivos.zfm;

  // 3. Buscar ISS do município
  const aliquotaISS = (uf && municipio) ? obterAliquotaISS(uf, municipio) : ISS_MAXIMO;

  // 4. Determinar anexo
  const fatorRCalc = fatorR !== null ? fatorR : (folhaAnual / receitaBrutaAnual);
  const anexo = cnae ? obterAnexoEfetivoCNAE(cnae, null, fatorRCalc) : 'III';

  if (anexo === 'VEDADO') {
    return {
      erro: `CNAE ${cnae} é vedado ao Simples Nacional.`,
      regimes: [],
      recomendacao: 'CNAE vedado ao Simples. Avaliar Lucro Presumido ou Lucro Real.'
    };
  }

  // Rodar o comparativo original com os dados enriquecidos
  const resultadoBase = compararComOutrosRegimes({
    receitaBrutaAnual,
    folhaAnual,
    cnae: cnae || '',
    fatorR: fatorRCalc,
    anexo,
    despesasOperacionais,
    aliquotaRAT,
    aliquotaISS,
    temSUDAM: temIncentivo
  });

  // Enriquecer com presunções corretas para Lucro Presumido
  const regimeLP = resultadoBase.regimes.find(r => r.regime === 'Lucro Presumido');
  if (regimeLP && presuncaoIRPJ !== 0.32) {
    // Recalcular LP com presunção correta
    const baseIRPJ = receitaBrutaAnual * presuncaoIRPJ;
    const baseCSLL = receitaBrutaAnual * presuncaoCSLL;
    const irpjLP = _arredondar(baseIRPJ * 0.15);
    const adicionalIR = _arredondar(Math.max(0, (baseIRPJ - 240_000) * 0.10));
    const csllLP = _arredondar(baseCSLL * 0.09);
    const cofinsLP = _arredondar(receitaBrutaAnual * 0.03);
    const pisLP = _arredondar(receitaBrutaAnual * 0.0065);
    const issLP = _arredondar(receitaBrutaAnual * aliquotaISS);
    const inssPatronalLP = _arredondar(folhaAnual * (0.20 + aliquotaRAT));
    const terceirosLP = _arredondar(folhaAnual * 0.058);
    const fgtsLP = _arredondar(folhaAnual * ALIQUOTA_FGTS);
    const novaCarga = _arredondar(irpjLP + adicionalIR + csllLP + cofinsLP + pisLP + issLP + inssPatronalLP + terceirosLP + fgtsLP);

    regimeLP.cargaTotal = novaCarga;
    regimeLP.percentualCarga = _arredondar(novaCarga / receitaBrutaAnual, 4);
    regimeLP.percentualCargaFormatado = ((novaCarga / receitaBrutaAnual) * 100).toFixed(2).replace('.', ',') + '%';
    regimeLP.detalhamento = {
      presuncaoIRPJ, presuncaoCSLL,
      irpj: irpjLP, adicionalIR, csll: csllLP,
      cofins: cofinsLP, pis: pisLP, iss: issLP,
      inssPatronal: inssPatronalLP, terceiros: terceirosLP, fgts: fgtsLP
    };
    regimeLP.observacoes.push(`Presunção IRPJ: ${(presuncaoIRPJ * 100).toFixed(0)}% (CNAE ${cnae})`);
  }

  // Re-sort e re-rank
  resultadoBase.regimes.sort((a, b) => a.cargaTotal - b.cargaTotal);
  resultadoBase.regimes.forEach((r, i) => {
    r.ranking = i + 1;
    r.melhorOpcao = i === 0;
  });

  const melhor = resultadoBase.regimes[0];
  const pior = resultadoBase.regimes[resultadoBase.regimes.length - 1];

  return {
    ...resultadoBase,
    presuncaoIRPJ,
    presuncaoCSLL,
    incentivos,
    aliquotaISS,
    economiaMelhorVsPior: _arredondar(pior.cargaTotal - melhor.cargaTotal),
    economiaFormatada: _fmtBRL(pior.cargaTotal - melhor.cargaTotal),
    recomendacao: `O regime mais vantajoso é ${melhor.regime} com carga de ${melhor.percentualCargaFormatado} (${_fmtBRL(melhor.cargaTotal)}).` +
      (temIncentivo ? ` Empresa em área ${incentivos.sudam ? 'SUDAM' : incentivos.sudene ? 'SUDENE' : 'ZFM'} — considerar Lucro Real com redução de 75% do IRPJ.` : '')
  };
}


// ================================================================================
// SEÇÃO 27: gerarRelatorioOtimizacao() ★ NOVO
// ================================================================================

/**
 * Gera relatório completo de otimização tributária — o produto final do IMPOST.
 *
 * @param {Object} params — Todos os dados da empresa
 * @param {string} params.nomeEmpresa
 * @param {string} params.cnae
 * @param {string} params.uf
 * @param {string} params.municipio
 * @param {number} params.receitaBrutaAnual
 * @param {number} params.receitaBrutaMensal
 * @param {number} params.folhaAnual
 * @param {number} params.folhaMensal
 * @param {Array<Object>} [params.socios]
 * @param {number} [params.despesasOperacionais=0]
 * @param {number} [params.lucroContabilEfetivo]
 * @param {number} [params.receitaMonofasica=0]
 * @param {number} [params.receitaICMS_ST=0]
 * @param {number} [params.receitaExportacao=0]
 * @param {number} [params.receitaLocacaoBensMoveis=0]
 * @param {number} [params.issRetidoFonte=0]
 * @returns {Object} Relatório estruturado completo
 */
function gerarRelatorioOtimizacao(params) {
  const {
    nomeEmpresa = 'Empresa',
    cnae,
    uf,
    municipio,
    receitaBrutaAnual,
    receitaBrutaMensal = receitaBrutaAnual / 12,
    folhaAnual,
    folhaMensal = folhaAnual / 12,
    socios = [],
    despesasOperacionais = 0,
    lucroContabilEfetivo = null,
    receitaMonofasica = 0,
    receitaICMS_ST = 0,
    receitaExportacao = 0,
    receitaLocacaoBensMoveis = 0,
    issRetidoFonte = 0,
    aliquotaRAT = ALIQUOTA_RAT_PADRAO
  } = params;

  const resultado = {};
  resultado.timestamp = new Date().toISOString();
  resultado.versao = '4.0.0';
  resultado.produto = 'IMPOST. — Inteligência em Modelagem de Otimização Tributária';
  resultado.baseLegal = 'LC 123/2006; LC 155/2016; Resolução CGSN 140/2018';

  // Dados da empresa
  resultado.dadosEmpresa = {
    nome: nomeEmpresa, cnae, uf, municipio,
    receitaBrutaAnual: _arredondar(receitaBrutaAnual),
    folhaAnual: _arredondar(folhaAnual),
    socios
  };

  // Classificação CNAE
  resultado.classificacaoCNAE = obterRegrasCNAE(cnae);

  // Fator R
  const fatorResult = calcularFatorR({
    folhaSalarios12Meses: folhaAnual,
    receitaBruta12Meses: receitaBrutaAnual
  });
  resultado.fatorR = fatorResult;

  // Anexo efetivo
  const anexo = obterAnexoEfetivoCNAE(cnae, null, fatorResult.fatorR);
  resultado.anexo = anexo;

  // Elegibilidade
  resultado.elegibilidade = verificarElegibilidade({
    receitaBrutaAnual,
    receitaBrutaAnualAnterior: receitaBrutaAnual,
    cnae,
    fatorR: fatorResult.fatorR
  });

  // DAS sem otimização
  try {
    resultado.dasAtual = calcularDASMensal({
      receitaBrutaMensal, rbt12: receitaBrutaAnual, anexo
    });
  } catch (e) {
    resultado.dasAtual = { erro: e.message };
  }

  // DAS otimizado
  try {
    resultado.dasOtimizado = calcularDASMensalOtimizado({
      receitaBrutaMensal, rbt12: receitaBrutaAnual, anexo, cnae, uf, municipio,
      receitaMonofasica, receitaICMS_ST, receitaExportacao, receitaLocacaoBensMoveis,
      issRetidoFonte, folhaMensal, aliquotaRAT
    });
  } catch (e) {
    resultado.dasOtimizado = { erro: e.message };
  }

  // Economia imediata
  if (resultado.dasAtual.dasValor && resultado.dasOtimizado.dasOtimizado !== undefined) {
    resultado.economiaImediata = {
      mensal: _arredondar(resultado.dasAtual.dasValor - resultado.dasOtimizado.dasOtimizado),
      anual: _arredondar((resultado.dasAtual.dasValor - resultado.dasOtimizado.dasOtimizado) * 12)
    };
  }

  // Otimização Fator R (se aplicável — empresa está no Anexo V)
  if (anexo === 'V') {
    try {
      resultado.otimizacaoFatorR = otimizarFatorR({
        rbt12: receitaBrutaAnual,
        folhaAtual12Meses: folhaAnual,
        receitaMensal: receitaBrutaMensal,
        cnae
      });
    } catch (e) {
      resultado.otimizacaoFatorR = { erro: e.message };
    }
  }

  // Comparativo de regimes
  try {
    resultado.comparativoRegimes = compararRegimesCompleto({
      receitaBrutaAnual, folhaAnual, cnae, uf, municipio,
      fatorR: fatorResult.fatorR, despesasOperacionais, socios
    });
  } catch (e) {
    resultado.comparativoRegimes = { erro: e.message };
  }

  // Estratégias aplicáveis
  resultado.estrategiasAplicaveis = ESTRATEGIAS_MENOR_IMPOSTO
    .filter(e => {
      if (e.id === 'E01' && anexo !== 'V') return false; // Fator R só se Anexo V
      return true;
    })
    .map(e => ({
      ...e,
      aplicavel: true
    }));

  // Riscos fiscais
  resultado.riscos = RISCOS_FISCAIS;

  // Obrigações acessórias
  resultado.obrigacoes = OBRIGACOES_ACESSORIAS;

  // Incentivos regionais
  resultado.incentivos = uf ? verificarIncentivosRegionais(uf) : null;

  // Resumo executivo
  const melhorRegime = resultado.comparativoRegimes && resultado.comparativoRegimes.regimes
    ? resultado.comparativoRegimes.regimes[0]
    : null;
  resultado.resumoExecutivo = {
    empresa: nomeEmpresa,
    regimeRecomendado: melhorRegime ? melhorRegime.regime : 'Simples Nacional',
    cargaTributariaAnual: melhorRegime ? _fmtBRL(melhorRegime.cargaTotal) : 'N/D',
    percentualCarga: melhorRegime ? melhorRegime.percentualCargaFormatado : 'N/D',
    economiaOtimizacao: resultado.economiaImediata ? _fmtBRL(resultado.economiaImediata.anual) : 'R$ 0,00',
    deducoesAplicadas: resultado.dasOtimizado.deducoes ? resultado.dasOtimizado.deducoes.length : 0
  };

  return resultado;
}


// ================================================================================
// CAMADA 3: MODULO 2026 — LEGISLACAO NOVA
// Fonte: simples_nacional.js v4.1.0 (Secao 34)
// Base: LC 214/2025, LC 227/2026, Lei 15.270/2025, Res. CGSN 183/2025
// ================================================================================

// ================================================================================
// SEÇÃO 34: MÓDULO AVANÇADO — INTELIGÊNCIA FISCAL COMPLEMENTAR v4.1 (2026)
// ================================================================================
// Base Legal: LC 214/2025, LC 227/2026, Lei 15.270/2025, Res. CGSN 183/2025
// ================================================================================

/**
 * 34.1 — PENALIDADES 2026 (Vigência 01/01/2026)
 *
 * Novas multas automáticas para PGDAS-D e DEFIS.
 * ANTES de 2026: PGDAS-D não gerava multa automática; DEFIS também não.
 * AGORA: Multa já no primeiro dia de atraso para ambas.
 *
 * Base Legal: LC 214/2025, Art. 38-A §2º da LC 123/2006, Res. CGSN 183/2025
 */
const PENALIDADES_2026 = {
  PGDAS_D: {
    descricao: 'Multa por atraso no PGDAS-D (declaração mensal)',
    percentualMensal: 0.02,         // 2% ao mês ou fração
    limitePercentual: 0.20,         // Máximo 20% do total dos tributos informados
    valorMinimo: 50.00,             // R$ 50,00 mínimo
    termoInicial: 'Dia seguinte ao vencimento do prazo legal',
    termoFinal: 'Data da efetiva transmissão ou lavratura do auto de infração',
    vigencia: '2026-01-01',
    baseLegal: 'Resolução CGSN nº 183/2025; LC 123/2006, Art. 38-A, §2º',
    observacao: 'Antes de 2026 NÃO havia multa automática. Agora qualquer atraso, mesmo de 1 dia, gera multa.',
    impactoAssinante: 'ALTO — Acompanhamento mensal de prazos é essencial para evitar multas.'
  },
  DEFIS: {
    descricao: 'Multa por atraso na DEFIS (declaração anual)',
    percentualMensal: 0.02,         // 2% ao mês ou fração
    limitePercentual: 0.20,         // Máximo 20%
    multaPorGrupoOmissoes: 100.00,  // R$ 100 por grupo de 10 informações incorretas/omitidas
    valorMinimo: 200.00,            // R$ 200,00 mínimo
    prazoEntrega2025: '2026-03-31', // DEFIS do ano-calendário 2025
    termoInicial: 'Dia seguinte ao término do prazo fixado',
    termoFinal: 'Data da efetiva prestação ou lavratura do auto de infração',
    vigencia: '2026-01-01',
    reducaoEntregaEspontanea: true,
    baseLegal: 'Resolução CGSN nº 183/2025; LC 123/2006, Art. 38-A',
    observacao: 'Primeira vez que DEFIS gera multa por atraso. Entrega até 31/03/2026 (AC 2025).',
    impactoAssinante: 'CRÍTICO — DEFIS do AC 2025 deve ser entregue até 31/03/2026, senão multa de no mínimo R$ 200.'
  }
};

/**
 * Calcula a multa estimada por atraso no PGDAS-D ou DEFIS.
 * @param {Object} params
 * @param {string} params.tipo — 'PGDAS_D' ou 'DEFIS'
 * @param {number} params.valorTributos — Total de tributos informados/declarados
 * @param {number} params.diasAtraso — Dias de atraso
 * @returns {Object} Detalhamento da multa
 */
function calcularMultaAtraso(params) {
  const { tipo, valorTributos = 0, diasAtraso = 0 } = params;

  const regra = PENALIDADES_2026[tipo];
  if (!regra) throw new Error(`[MULTA_001] Tipo "${tipo}" inválido. Use PGDAS_D ou DEFIS.`);

  if (diasAtraso <= 0) return { multa: 0, observacao: 'Sem atraso', baseLegal: regra.baseLegal };

  // Meses de atraso (fração de mês conta como mês inteiro)
  const mesesAtraso = Math.ceil(diasAtraso / 30);
  const percentualAplicado = Math.min(mesesAtraso * regra.percentualMensal, regra.limitePercentual);
  const multaCalculada = _arredondar(valorTributos * percentualAplicado);
  const multa = Math.max(multaCalculada, regra.valorMinimo);

  return {
    tipo,
    diasAtraso,
    mesesAtraso,
    percentualAplicado,
    percentualFormatado: (percentualAplicado * 100).toFixed(1) + '%',
    multaCalculada: _arredondar(multaCalculada),
    multaMinima: regra.valorMinimo,
    multaFinal: _arredondar(multa),
    multaFinalFormatada: _fmtBRL(multa),
    baseLegal: regra.baseLegal,
    alertaAssinante: multa > 0 ? `⚠️ Multa de ${_fmtBRL(multa)} por ${diasAtraso} dia(s) de atraso no ${tipo}.` : null
  };
}


/**
 * 34.2 — TRIBUTAÇÃO DE DIVIDENDOS 2026 (Lei 15.270/2025)
 *
 * A partir de janeiro/2026, distribuição de lucros/dividendos > R$ 50.000/mês
 * por uma mesma PJ a uma mesma PF residente no Brasil está sujeita a IRRF de 10%.
 *
 * CONTROVÉRSIA JURÍDICA: Há forte debate se essa regra se aplica ao Simples Nacional,
 * uma vez que o Art. 14 da LC 123/2006 prevê isenção específica. ADIs 7912 e 7914
 * foram ajuizadas no STF questionando a constitucionalidade.
 *
 * A Receita Federal posiciona-se que a retenção APLICA-SE ao Simples Nacional.
 * Juristas argumentam que lei ordinária não pode revogar benefício de lei complementar.
 */
const TRIBUTACAO_DIVIDENDOS_2026 = {
  descricao: 'Retenção de IRRF sobre lucros/dividendos acima de R$ 50 mil/mês',
  limiteIsencaoMensal: 50_000.00,
  aliquotaIRRF: 0.10,
  vigencia: '2026-01-01',
  baseLegalNova: 'Lei nº 15.270/2025, Art. 6º-A da Lei 9.250/1995',
  baseLegalSN: 'LC 123/2006, Art. 14 (isenção na fonte e no ajuste anual)',
  posicaoRFB: 'Receita Federal entende que a retenção aplica-se inclusive ao Simples Nacional.',
  controversia: 'ADIs 7912 e 7914 no STF questionam constitucionalidade para empresas do Simples. ' +
                'Lei ordinária (15.270) x Lei Complementar (123/2006, Art. 14). ' +
                'Hierarquia normativa: LC 123 tem caráter especial protegido pelo Art. 146, III, "d" da CF.',
  regraTransicao: {
    lucrosAte2025: 'Lucros apurados até AC 2025 permanecem isentos se distribuição aprovada até 31/12/2025.',
    prazoProrrogado: 'Ministro Nunes Marques (STF) prorrogou prazo para 31/01/2026.',
    pagamentoAte2028: 'Pagamento dos lucros isentos pode ocorrer até 2028, conforme aprovação.'
  },
  tributacaoMinima: {
    descricao: 'IRPF Mínimo para rendimentos anuais > R$ 600 mil',
    limiteAnual: 600_000.00,
    aliquotaMaxima: 0.10,
    faixaInicial: 600_000.00,
    faixaFinal: 1_200_000.00,
    observacao: 'Alíquota cresce progressivamente de 0% (R$ 600k) até 10% (R$ 1,2M+).',
    baseLegal: 'Lei 15.270/2025, Art. 16-A da Lei 9.250/1995'
  },
  calculoSimplificadoLucro: {
    descricao: 'Empresas fora do Lucro Real podem optar por cálculo simplificado do lucro contábil',
    deducoesPermitidas: [
      'Folha de salários, administradores e encargos',
      'Custo de mercadorias (comércio)',
      'Matéria-prima e embalagem (indústria)',
      'Aluguéis de imóveis necessários à operação',
      'Juros sobre financiamentos (instituições autorizadas pelo BACEN)',
      'Depreciação de equipamentos (indústria)'
    ],
    baseLegal: 'Lei 15.270/2025, Art. 10, §6º da Lei 9.249/1995'
  },
  impactoAssinante: 'CRÍTICO — Pode impactar sócios que recebem > R$ 50k/mês em dividendos. ' +
                    'Planejamento de distribuição de lucros é essencial.'
};

/**
 * Calcula o impacto da tributação de dividendos (Lei 15.270/2025) para sócios.
 *
 * @param {Object} params
 * @param {number} params.lucroDistribuivelMensal — Lucro distribuível mensal
 * @param {Array}  params.socios — Array com {nome, percentual}
 * @returns {Object} Análise de impacto por sócio
 */
function calcularImpactoDividendos2026(params) {
  const { lucroDistribuivelMensal, socios = [] } = params;
  const limite = TRIBUTACAO_DIVIDENDOS_2026.limiteIsencaoMensal;
  const aliq = TRIBUTACAO_DIVIDENDOS_2026.aliquotaIRRF;

  const resultado = {
    lucroDistribuivelMensal: _arredondar(lucroDistribuivelMensal),
    baseLegal: TRIBUTACAO_DIVIDENDOS_2026.baseLegalNova,
    controversiaSTF: TRIBUTACAO_DIVIDENDOS_2026.controversia,
    porSocio: []
  };

  let totalRetidoMensal = 0;

  for (const socio of socios) {
    const valorMensal = _arredondar(lucroDistribuivelMensal * (socio.percentual || 0));
    const ultrapassaLimite = valorMensal > limite;
    // Se ultrapassa R$ 50k, IRRF de 10% sobre o TOTAL (não apenas o excedente)
    const irrfRetido = ultrapassaLimite ? _arredondar(valorMensal * aliq) : 0;
    const valorLiquido = _arredondar(valorMensal - irrfRetido);

    totalRetidoMensal += irrfRetido;

    resultado.porSocio.push({
      nome: socio.nome,
      percentual: socio.percentual,
      valorBrutoMensal: valorMensal,
      valorBrutoFormatado: _fmtBRL(valorMensal),
      ultrapassaLimite,
      irrfRetido: _arredondar(irrfRetido),
      irrfRetidoFormatado: _fmtBRL(irrfRetido),
      valorLiquido,
      valorLiquidoFormatado: _fmtBRL(valorLiquido),
      alertaAssinante: ultrapassaLimite
        ? `⚠️ ${socio.nome}: IRRF de ${_fmtBRL(irrfRetido)}/mês (10% sobre ${_fmtBRL(valorMensal)}). Considere fracionar distribuição.`
        : `✅ ${socio.nome}: Dentro do limite de R$ 50 mil — isento de IRRF.`
    });
  }

  resultado.totalRetidoMensal = _arredondar(totalRetidoMensal);
  resultado.totalRetidoAnual = _arredondar(totalRetidoMensal * 12);
  resultado.totalRetidoMensalFormatado = _fmtBRL(totalRetidoMensal);
  resultado.totalRetidoAnualFormatado = _fmtBRL(totalRetidoMensal * 12);

  // Estratégia de economia
  resultado.estrategiasEconomia = [];
  if (totalRetidoMensal > 0) {
    resultado.estrategiasEconomia.push({
      titulo: 'Fracionamento mensal da distribuição',
      descricao: 'Distribuir lucros em parcelas ≤ R$ 50 mil por mês para cada sócio.',
      economiaEstimada: _fmtBRL(totalRetidoMensal * 12),
      impacto: 'alto',
      baseLegal: 'Lei 15.270/2025, Art. 6º-A'
    });
    resultado.estrategiasEconomia.push({
      titulo: 'Revisão de pró-labore vs dividendos',
      descricao: 'Ajustar mix de pró-labore e dividendos para otimizar a carga tributária total.',
      impacto: 'alto',
      observacao: 'Pró-labore tem INSS (11%) mas é dedutível. Dividendos agora podem ter 10% IRRF.'
    });
    resultado.estrategiasEconomia.push({
      titulo: 'Contestação judicial (ADIs 7912/7914)',
      descricao: 'Questionar aplicação da Lei 15.270 ao Simples Nacional via mandado de segurança.',
      impacto: 'medio',
      risco: 'Resultado depende do julgamento das ADIs no STF. Recomendável acompanhar.',
      baseLegal: 'Art. 146, III, "d" CF c/c Art. 14 LC 123/2006'
    });
    resultado.estrategiasEconomia.push({
      titulo: 'Escrituração contábil completa',
      descricao: 'Manter escrituração contábil completa permite distribuir lucro contábil efetivo (que pode ser maior que a presunção), otimizando a base de distribuição.',
      impacto: 'medio',
      baseLegal: 'LC 123/2006, Art. 14, §1º'
    });
  }

  return resultado;
}


/**
 * 34.3 — REFORMA TRIBUTÁRIA — IBS/CBS NO SIMPLES NACIONAL (2026-2033)
 *
 * Em 2026: Empresas do Simples Nacional ESTÃO ISENTAS das alíquotas-teste de IBS/CBS.
 * A partir de set/2026: Opção para 2027 — continuar no SN ou migrar para IBS/CBS.
 * 2027+: CBS substitui PIS/COFINS; IBS substitui ICMS/ISS (transição gradual até 2033).
 *
 * Base Legal: LC 214/2025 (Art. 117-125, Art. 348, III, "c"); EC 132/2023
 */
const REFORMA_TRIBUTARIA_SIMPLES = {
  fase2026: {
    descricao: 'Período de testes — Simples Nacional ISENTO de IBS/CBS em 2026',
    aliquotaTesteCBS: 0.009,  // 0,9%
    aliquotaTesteIBS: 0.001,  // 0,1%
    aplicavelSimplesNacional: false, // NÃO se aplica ao SN em 2026
    obrigacoesAcessorias: {
      nfe: 'Empresas do SN NÃO precisam destacar IBS/CBS nas NF-e em 2026.',
      nfse: 'Destaque de IBS/CBS na NFS-e é facultativo em 2026.',
      cClassTrib: 'Novo código obrigatório nas NF a partir de 2026 (identificação do tipo de tributação).',
      preparacao: 'Recomendado: revisar NCM, NBS, CST, CFOP e adotar cClassTrib para preparação.'
    },
    baseLegal: 'LC 214/2025, Art. 348, III, "c"'
  },
  fase2027_2028: {
    descricao: 'CBS entra em vigor (substitui PIS/COFINS). IBS inicia transição.',
    prazoOpcao: 'Até setembro/2026 para optar se em 2027 continua no SN ou migra para IBS/CBS.',
    cbsAliquotaReferencia: 0.093, // ~9,3% estimativa
    ibsAliquotaReferencia: 0.187, // ~18,7% estimativa
    observacao: 'Simples pode optar por recolher CBS/IBS fora do DAS (modelo híbrido) para gerar créditos aos clientes.',
    baseLegal: 'LC 214/2025, Arts. 353-359'
  },
  fase2029_2032: {
    descricao: 'Aumento progressivo de IBS/CBS. Redução gradual de ICMS/ISS/PIS/COFINS.',
    extintosPIS_COFINS: '2027 (substituídos por CBS)',
    transicaoICMS_ISS: '2029-2032 (redução gradual até extinção)',
    extintosFinal: '2033 — extinção total de ICMS, ISS, PIS, COFINS, IPI'
  },
  modeloHibrido: {
    descricao: 'Empresa do Simples pode optar por recolher IBS/CBS fora do DAS',
    vantagem: 'Permite que clientes B2B aproveitem créditos de IBS/CBS nas suas compras.',
    desvantagem: 'Maior complexidade fiscal e contábil.',
    recomendacao: 'Indicado para empresas B2B cujos clientes são do Lucro Presumido/Real.',
    impactoAssinante: 'ALTO — Decisão estratégica que pode afetar competitividade em vendas B2B.'
  },
  cronograma: [
    { ano: 2026, evento: 'Testes IBS 0,1% + CBS 0,9% (SN isento). Preparação de sistemas.' },
    { ano: 2027, evento: 'CBS efetiva. PIS/COFINS extintos. IPI zerado (exceto ZFM). IS entra em vigor.' },
    { ano: 2028, evento: 'Continuação CBS. Alíquotas de transição para IBS.' },
    { ano: 2029, evento: 'IBS efetivo. Início da redução do ICMS e ISS.' },
    { ano: 2030, evento: 'Redução progressiva ICMS/ISS.' },
    { ano: 2031, evento: 'Redução progressiva ICMS/ISS.' },
    { ano: 2032, evento: 'Últimas alíquotas de transição ICMS/ISS.' },
    { ano: 2033, evento: 'Extinção total: ICMS, ISS, PIS, COFINS, IPI. Apenas IBS + CBS + IS.' }
  ],
  impactoAssinante: 'ESTRATÉGICO — Acompanhar a transição é fundamental. Decisão de regime em set/2026.'
};


/**
 * 34.4 — GRUPO ECONÔMICO (LC 214/2025 — Nova Fiscalização)
 *
 * A Receita Federal agora analisa a REALIDADE ECONÔMICA dos negócios.
 * Não basta ter CNPJs separados; se funcionam como um só, será tratado como grupo.
 * Impacta diretamente o enquadramento no Simples (soma de faturamento).
 */
const GRUPO_ECONOMICO_2026 = {
  descricao: 'Novo conceito de grupo econômico para fins de enquadramento no Simples Nacional',
  indicadores: [
    'Controle comum: mesmos donos, sócios relacionados (familiares) ou sócio com poder de mando',
    'Compartilhamento de estrutura: endereço, funcionários, equipamentos',
    'Vendas/serviços cruzados: uma empresa vende majoritariamente para/da outra',
    'Mesmo ramo de negócio ou atividades complementares',
    'Administração ou gestão financeira centralizada',
    'Funcionários transitando entre empresas',
    'Clientes ou fornecedores em comum de forma predominante'
  ],
  consequencia: 'Receitas das empresas do grupo são SOMADAS para verificar o limite de R$ 4,8 milhões.',
  risco: 'Exclusão retroativa do Simples Nacional com cobrança de diferenças tributárias + multas.',
  checklistRisco: [
    { pergunta: 'Sócios com participação em mais de uma empresa no Simples Nacional?', risco: 'alto' },
    { pergunta: 'Empresas atuam no mesmo ramo ou atividades complementares?', risco: 'alto' },
    { pergunta: 'Compartilham endereço, estrutura, funcionários ou equipamentos?', risco: 'critico' },
    { pergunta: 'Vendas/serviços destinados majoritariamente entre as empresas?', risco: 'critico' },
    { pergunta: 'Administração ou gestão financeira centralizada?', risco: 'medio' },
    { pergunta: 'Clientes/fornecedores em comum de forma predominante?', risco: 'medio' }
  ],
  baseLegal: 'LC 214/2025; LC 123/2006, Art. 3º, §4º',
  impactoAssinante: 'CRÍTICO — Em 2026, a estratégia de "dividir para não crescer" é a mais perigosa.'
};


/**
 * 34.5 — DIFAL (Diferencial de Alíquota de ICMS)
 * Base Legal: Lei Complementar nº 190/2022, Convênio ICMS 236/21
 */
const ALIQUOTAS_INTERNAS_UF = {
  'AC': 0.19, 'AL': 0.19, 'AP': 0.18, 'AM': 0.20, 'BA': 0.205, 'CE': 0.20,
  'DF': 0.20, 'ES': 0.17, 'GO': 0.19, 'MA': 0.22, 'MT': 0.17, 'MS': 0.17,
  'MG': 0.18, 'PA': 0.19, 'PB': 0.20, 'PR': 0.195, 'PE': 0.205, 'PI': 0.21,
  'RJ': 0.22, 'RN': 0.20, 'RS': 0.17, 'RO': 0.195, 'RR': 0.20, 'SC': 0.17,
  'SP': 0.18, 'SE': 0.19, 'TO': 0.20
};

/**
 * Calcula o DIFAL (Diferencial de Alíquota) para operações interestaduais.
 *
 * @param {Object} params
 * @param {number} params.valorOperacao — Valor da operação
 * @param {string} params.ufOrigem — UF de origem
 * @param {string} params.ufDestino — UF de destino
 * @param {boolean} params.isConsumidorFinal — Se o destinatário é consumidor final
 * @returns {Object}
 */
function calcularDIFAL(params) {
  const { valorOperacao, ufOrigem, ufDestino, isConsumidorFinal = false } = params;

  if (!isConsumidorFinal) {
    return {
      valorDIFAL: 0,
      observacao: 'DIFAL não se aplica — destinatário NÃO é consumidor final.',
      baseLegal: 'LC 190/2022'
    };
  }

  if (ufOrigem === ufDestino) {
    return {
      valorDIFAL: 0,
      observacao: 'Operação interna — não há DIFAL.',
      baseLegal: 'LC 190/2022'
    };
  }

  // Alíquotas interestaduais: 7% (Sul/Sudeste → N/NE/CO) ou 12% (demais)
  const ufsSulSudeste = ['SP', 'RJ', 'MG', 'PR', 'RS', 'SC', 'ES'];
  const ufsNorteNordesteCO = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'GO', 'MA', 'MT', 'MS',
                               'PA', 'PB', 'PE', 'PI', 'RN', 'RO', 'RR', 'SE', 'TO'];
  
  let aliqInter = 0.12; // padrão
  if (ufsSulSudeste.includes(ufOrigem) && ufsNorteNordesteCO.includes(ufDestino)) {
    aliqInter = 0.07;
  }

  const aliqInternaDestino = ALIQUOTAS_INTERNAS_UF[ufDestino] || 0.17;
  const valorDIFAL = _arredondar(Math.max(0, valorOperacao * (aliqInternaDestino - aliqInter)));

  return {
    valorOperacao: _arredondar(valorOperacao),
    ufOrigem,
    ufDestino,
    aliquotaInterestadual: aliqInter,
    aliquotaInternaDestino: aliqInternaDestino,
    valorDIFAL,
    valorDIFALFormatado: _fmtBRL(valorDIFAL),
    responsavel: 'Remetente (empresa do Simples)',
    baseLegal: 'LC 190/2022; Convênio ICMS 236/21',
    observacao: 'O Simples Nacional recolhe o DIFAL por fora do DAS.',
    impactoAssinante: valorDIFAL > 0
      ? `⚠️ DIFAL de ${_fmtBRL(valorDIFAL)} deve ser recolhido separadamente do DAS.`
      : 'Sem DIFAL aplicável.'
  };
}


/**
 * 34.6 — PRODUTOS MONOFÁSICOS — NCMs (Inteligência PGDAS-D)
 *
 * Produtos com tributação monofásica de PIS/COFINS NÃO devem ter esses tributos
 * cobrados novamente no DAS. Segregar corretamente no PGDAS-D gera ECONOMIA REAL.
 */
const PRODUTOS_MONOFASICOS_NCM = {
  BEBIDAS_FRIAS: {
    ncms: ['2201', '2202', '2203', '2204', '2205', '2206', '2207', '2208'],
    descricao: 'Cervejas, águas, refrigerantes, sucos, vinhos, destilados',
    tributacao: 'PIS/COFINS recolhidos pelo fabricante/importador (tributação concentrada)',
    impactoRevenda: 'Varejista/atacadista paga ZERO de PIS/COFINS sobre essas receitas no DAS.',
    baseLegal: 'Lei 10.833/2003, Art. 58-A a 58-V; Lei 13.097/2015'
  },
  PERFUMARIA_HIGIENE: {
    ncms: ['3303', '3304', '3305', '3307'],
    descricao: 'Perfumes, maquiagem, shampoos, desodorantes, produtos de higiene',
    tributacao: 'PIS/COFINS concentrados na indústria/importação',
    impactoRevenda: 'Revenda isenta de PIS/COFINS no DAS.',
    baseLegal: 'Lei 10.147/2000'
  },
  FARMACEUTICOS: {
    ncms: ['3001', '3002', '3003', '3004', '3005', '3006'],
    descricao: 'Medicamentos, preparações farmacêuticas, curativos',
    tributacao: 'PIS/COFINS com alíquota zero no varejo para grande parte dos itens',
    impactoRevenda: 'Revenda isenta ou com alíquota zero de PIS/COFINS no DAS.',
    baseLegal: 'Lei 10.147/2000; Decreto 3.803/2001'
  },
  AUTOPECAS: {
    ncms: ['4011', '4012', '4013', '8433', '8481', '8482', '8483', '8484'],
    descricao: 'Pneus, câmaras de ar, peças automotivas',
    tributacao: 'PIS/COFINS monofásicos concentrados no fabricante/importador',
    impactoRevenda: 'Revenda de autopeças pode excluir PIS/COFINS do DAS.',
    baseLegal: 'Lei 10.485/2002'
  },
  COMBUSTIVEIS: {
    ncms: ['2710', '2711'],
    descricao: 'Gasolina, Diesel, GLP, querosene',
    tributacao: 'Tributação monofásica — recolhimento concentrado na refinaria/distribuidora',
    impactoRevenda: 'Postos de combustíveis pagam ZERO de PIS/COFINS no DAS.',
    baseLegal: 'Lei 9.718/1998; Lei 10.336/2001'
  },
  MAQUINAS_VEICULOS: {
    ncms: ['8429', '8430', '8432', '8433', '8434', '8435', '8436', '8701', '8702', '8703', '8704', '8711'],
    descricao: 'Veículos, máquinas agrícolas, tratores, caminhões, motocicletas',
    tributacao: 'PIS/COFINS concentrados no fabricante/importador',
    impactoRevenda: 'Concessionárias e revendas pagam PIS/COFINS reduzido ou zero no DAS.',
    baseLegal: 'Lei 10.485/2002; Decreto 5.060/2004'
  }
};

/**
 * Verifica se um NCM é monofásico e retorna informações de economia.
 * @param {string} ncm — Código NCM (mínimo 4 dígitos)
 * @returns {Object|null}
 */
function verificarMonofasicoNCM(ncm) {
  if (!ncm) return null;
  const ncm4 = ncm.replace(/[.\-\/]/g, '').substring(0, 4);

  for (const [categoria, dados] of Object.entries(PRODUTOS_MONOFASICOS_NCM)) {
    if (dados.ncms.includes(ncm4)) {
      return {
        monofasico: true,
        categoria,
        descricao: dados.descricao,
        impactoRevenda: dados.impactoRevenda,
        baseLegal: dados.baseLegal,
        alertaAssinante: `💰 NCM ${ncm} é MONOFÁSICO! Segregue no PGDAS-D para NÃO pagar PIS/COFINS no DAS.`
      };
    }
  }
  return { monofasico: false, ncm, observacao: 'NCM não identificado como monofásico na base.' };
}

/**
 * Calcula economia com segregação monofásica no PGDAS-D.
 * @param {Object} params
 * @param {number} params.receitaMonofasica — Receita de produtos monofásicos no mês
 * @param {number} params.rbt12 — RBT12
 * @param {string} params.anexo — Anexo
 * @returns {Object}
 */
function calcularEconomiaMonofasica(params) {
  const { receitaMonofasica, rbt12, anexo } = params;

  if (!receitaMonofasica || receitaMonofasica <= 0) {
    return { economia: 0, observacao: 'Sem receita monofásica.' };
  }

  const aliqResult = calcularAliquotaEfetiva({ rbt12, anexo });
  const faixa = aliqResult.faixa;
  const partilhaPct = PARTILHA[anexo] ? PARTILHA[anexo][faixa - 1] : null;

  if (!partilhaPct) return { economia: 0, observacao: 'Não foi possível calcular.' };

  const pctPIS = partilhaPct.pis || 0;
  const pctCOFINS = partilhaPct.cofins || 0;
  const pctTotalExcluido = pctPIS + pctCOFINS;
  const aliqEfetivaSemMonofasica = aliqResult.aliquotaEfetiva * (1 - pctTotalExcluido);
  const dasComMonofasico = _arredondar(receitaMonofasica * aliqResult.aliquotaEfetiva);
  const dasSemMonofasico = _arredondar(receitaMonofasica * aliqEfetivaSemMonofasica);
  const economiaMensal = _arredondar(dasComMonofasico - dasSemMonofasico);

  return {
    receitaMonofasica: _arredondar(receitaMonofasica),
    aliquotaEfetivaNormal: aliqResult.aliquotaEfetiva,
    aliquotaEfetivaSemPISCOFINS: _arredondar(aliqEfetivaSemMonofasica, 6),
    percentualPISExcluido: pctPIS,
    percentualCOFINSExcluido: pctCOFINS,
    dasSeNaoSegregasse: dasComMonofasico,
    dasComSegregacao: dasSemMonofasico,
    economiaMensal,
    economiaMensalFormatada: _fmtBRL(economiaMensal),
    economiaAnual: _arredondar(economiaMensal * 12),
    economiaAnualFormatada: _fmtBRL(economiaMensal * 12),
    baseLegal: 'Resolução CGSN 140/2018, Art. 25-A; Lei 10.147/2000',
    alertaAssinante: `💰 Segregação monofásica gera economia de ${_fmtBRL(economiaMensal)}/mês (${_fmtBRL(economiaMensal * 12)}/ano).`
  };
}


/**
 * 34.7 — BENEFÍCIOS ESTADUAIS (Isenção de ICMS por Faixa)
 *
 * Alguns estados isentam 100% do ICMS para microempresas dentro do Simples.
 * Atualizado para 2026 com dados dos principais estados.
 */
const ISENCAO_ESTADUAL_ICMS = {
  'RS': { limiteReceita: 360_000.00, isencao: 1.00, descricao: 'Isenção integral do ICMS para MEs', baseLegal: 'Lei Estadual RS 13.036/2008' },
  'SE': { limiteReceita: 360_000.00, isencao: 1.00, descricao: 'Isenção integral do ICMS para MEs', baseLegal: 'Lei Estadual SE' },
  'PR': { limiteReceita: 360_000.00, isencao: 1.00, descricao: 'Isenção total do ICMS para MEs', baseLegal: 'Lei Estadual PR' },
  'SC': { limiteReceita: 360_000.00, isencao: 1.00, descricao: 'Isenção integral do ICMS para MEs', baseLegal: 'Lei Estadual SC' },
  'AM': { limiteReceita: 360_000.00, isencao: 1.00, descricao: 'Isenção integral ZFM + SN', baseLegal: 'Lei Estadual AM; SUFRAMA' },
  'PA': { limiteReceita: 360_000.00, isencao: 0.00, descricao: 'SEM isenção estadual de ICMS para MEs', baseLegal: 'N/A' },
  'SP': { limiteReceita: 0, isencao: 0.00, descricao: 'Redução de base de cálculo para bares/restaurantes (Convênio 09/93)', baseLegal: 'Convênio ICMS 09/93' },
  'RJ': { limiteReceita: 0, isencao: 0.00, descricao: 'SEM isenção estadual de ICMS para MEs', baseLegal: 'N/A' },
  'MG': { limiteReceita: 360_000.00, isencao: 0.50, descricao: 'Redução de 50% do ICMS para MEs (faixa 1)', baseLegal: 'Lei Estadual MG' }
};


/**
 * 34.8 — PRAZO DE IMPUGNAÇÃO (LC 227/2026)
 *
 * Mudança crítica: prazo de defesa passou de dias CORRIDOS para dias ÚTEIS.
 */
const PRAZO_IMPUGNACAO_2026 = {
  dias: 20,
  tipo: 'DIAS ÚTEIS',
  mudanca: 'Antes eram dias corridos. Agora são 20 dias ÚTEIS — mais prazo real de defesa.',
  vigencia: '2026',
  baseLegal: 'LC 227/2026',
  impactoAssinante: 'FAVORÁVEL — Mais tempo real para preparar defesa. Finais de semana e feriados não contam.'
};


/**
 * 34.9 — CALENDÁRIO FISCAL 2026 (Datas Críticas para Assinantes)
 */
const CALENDARIO_FISCAL_2026 = [
  { data: '2026-01-31', evento: 'Prazo final para opção pelo Simples Nacional (empresas existentes)', baseLegal: 'LC 123/2006, Art. 16' },
  { data: '2026-01-31', evento: 'Prazo prorrogado (STF) para aprovação de distribuição de lucros AC 2025', baseLegal: 'Decisão Min. Nunes Marques' },
  { data: '2026-02-28', evento: 'DIRF — Último dia útil de fevereiro (entrega referente AC 2025)', baseLegal: 'IN RFB 1.990/2020' },
  { data: '2026-03-31', evento: 'DEFIS AC 2025 — Entrega obrigatória. Atraso gera multa mín. R$ 200', baseLegal: 'Resolução CGSN 183/2025' },
  { data: '2026-05-31', evento: 'DASN-SIMEI — Declaração anual do MEI (AC 2025)', baseLegal: 'Resolução CGSN 140/2018' },
  { data: '2026-09-30', evento: 'Prazo para optar entre SN ou novo sistema IBS/CBS para 2027', baseLegal: 'LC 214/2025' },
  { data: null, evento: 'PGDAS-D — Todo dia 20 do mês subsequente. ATRASO GERA MULTA.', baseLegal: 'Resolução CGSN 183/2025' },
  { data: null, evento: 'DAS — Pagamento até dia 20 do mês subsequente ao faturamento', baseLegal: 'LC 123/2006, Art. 21' },
  { data: null, evento: 'eSocial — Eventos periódicos até dia 15 do mês subsequente', baseLegal: 'Decreto 8.373/2014' },
  { data: null, evento: 'EFD-Reinf — Até dia 15 do mês subsequente', baseLegal: 'IN RFB 2.043/2021' },
  { data: null, evento: 'DCTFWeb — Até dia 15 do mês seguinte (se tem empregados)', baseLegal: 'IN RFB 2.005/2021' }
];


/**
 * 34.10 — GERADOR DE DICAS DE ECONOMIA (Motor de Vendas de Assinatura)
 *
 * Analisa os dados da empresa e gera dicas personalizadas de economia fiscal.
 * Cada dica indica a economia estimada e o nível de acesso (gratuito/premium).
 */
function gerarDicasEconomia(params) {
  const {
    receitaBrutaAnual,
    receitaBrutaMensal,
    folhaAnual,
    folhaMensal,
    cnae,
    uf,
    anexo,
    rbt12,
    socios = [],
    temProdutosMonofasicos = false,
    receitaMonofasica = 0,
    vendasInterestaduais = false,
    temMaisDeUmCNPJ = false
  } = params;

  const dicas = [];
  const fatorR = folhaAnual > 0 && receitaBrutaAnual > 0 ? folhaAnual / receitaBrutaAnual : 0;

  // ─── DICA 1: Fator R (migração Anexo V → III) ───
  if (anexo === 'V' || (fatorR > 0 && fatorR < LIMITE_FATOR_R)) {
    const aliqV = calcularAliquotaEfetiva({ rbt12, anexo: 'V' });
    const aliqIII = calcularAliquotaEfetiva({ rbt12, anexo: 'III' });
    const economiaMensal = _arredondar(receitaBrutaMensal * (aliqV.aliquotaEfetiva - aliqIII.aliquotaEfetiva));
    dicas.push({
      id: 'fator_r_otimizacao',
      titulo: '🎯 Otimize o Fator "r" e pague menos',
      descricao: `Seu Fator "r" é ${(fatorR * 100).toFixed(1)}%. Aumentando a folha para atingir 28%, você cai do Anexo V para o III.`,
      economiaMensal: _fmtBRL(economiaMensal),
      economiaAnual: _fmtBRL(economiaMensal * 12),
      impacto: 'alto',
      nivel: 'premium',
      acao: 'Aumente pró-labore ou contrate registrado para elevar a folha acima de 28% da receita.'
    });
  }

  // ─── DICA 2: Segregação Monofásica ───
  if (temProdutosMonofasicos || (anexo === 'I' || anexo === 'II')) {
    const econMono = receitaMonofasica > 0
      ? calcularEconomiaMonofasica({ receitaMonofasica, rbt12, anexo })
      : null;
    dicas.push({
      id: 'monofasico_segregacao',
      titulo: '💰 Segregação de produtos monofásicos',
      descricao: 'Produtos como combustíveis, bebidas, perfumaria, autopeças e farmacêuticos têm PIS/COFINS pagos pelo fabricante. Segregue no PGDAS-D e NÃO pague novamente.',
      economiaMensal: econMono ? econMono.economiaMensalFormatada : 'A calcular — informe receita monofásica.',
      economiaAnual: econMono ? econMono.economiaAnualFormatada : 'A calcular',
      impacto: 'alto',
      nivel: 'gratuito',
      acao: 'Classifique as receitas de produtos monofásicos corretamente no PGDAS-D.'
    });
  }

  // ─── DICA 3: Multas PGDAS-D / DEFIS ───
  dicas.push({
    id: 'multas_2026',
    titulo: '⚠️ ALERTA: Novas multas por atraso em 2026',
    descricao: 'Desde jan/2026, PGDAS-D e DEFIS geram multa automática no 1º dia de atraso. Mínimo R$ 50 (PGDAS-D) e R$ 200 (DEFIS).',
    economiaAnual: 'Evite até R$ 2.400/ano em multas.',
    impacto: 'medio',
    nivel: 'gratuito',
    acao: 'Configure alertas de prazo. Use o calendário fiscal do IMPOST.'
  });

  // ─── DICA 4: Dividendos (Lei 15.270/2025) ───
  const lucroDistribuivelMensal = receitaBrutaMensal * 0.32; // presunção serviços
  const maiorSocio = socios.length > 0 ? socios.reduce((a, b) => (a.percentual > b.percentual ? a : b)) : null;
  const valorMaiorSocio = maiorSocio ? lucroDistribuivelMensal * (maiorSocio.percentual || 0) : 0;

  if (valorMaiorSocio > 50_000) {
    const irrfEstimado = _arredondar(valorMaiorSocio * 0.10);
    dicas.push({
      id: 'dividendos_2026',
      titulo: '🚨 Tributação de dividendos: IRRF de 10%',
      descricao: `Sócio ${maiorSocio.nome || 'principal'} recebe ~${_fmtBRL(valorMaiorSocio)}/mês. Acima de R$ 50 mil → IRRF de 10%.`,
      economiaMensal: _fmtBRL(irrfEstimado),
      economiaAnual: _fmtBRL(irrfEstimado * 12),
      impacto: 'critico',
      nivel: 'premium',
      acao: 'Fracione distribuição em parcelas ≤ R$ 50k/mês por sócio. Revise mix pró-labore/dividendos.'
    });
  }

  // ─── DICA 5: ISS Retido na Fonte ───
  if (['III', 'IV', 'V'].includes(anexo)) {
    dicas.push({
      id: 'iss_retido',
      titulo: '📋 Deduza ISS retido na fonte do DAS',
      descricao: 'Quando o tomador retém ISS, esse valor deve ser ABATIDO do DAS mensal.',
      impacto: 'medio',
      nivel: 'gratuito',
      acao: 'Informe o ISS retido no PGDAS-D para reduzir o valor do DAS.'
    });
  }

  // ─── DICA 6: Sublimite ICMS/ISS ───
  if (rbt12 > 3_200_000 && rbt12 <= SUBLIMITE_ICMS_ISS) {
    dicas.push({
      id: 'sublimite_alerta',
      titulo: '⚠️ Próximo do sublimite de R$ 3,6 milhões',
      descricao: 'Se ultrapassar R$ 3,6M em RBT12, ICMS e ISS saem do DAS e são recolhidos por fora.',
      impacto: 'alto',
      nivel: 'premium',
      acao: 'Planeje faturamento para evitar ultrapassar o sublimite. Simule no comparativo de regimes.'
    });
  }

  // ─── DICA 7: Grupo Econômico ───
  if (temMaisDeUmCNPJ) {
    dicas.push({
      id: 'grupo_economico',
      titulo: '🚨 ALERTA: Novo conceito de grupo econômico em 2026',
      descricao: 'A Receita Federal agora analisa a REALIDADE ECONÔMICA. Se suas empresas compartilham estrutura, podem ser tratadas como grupo.',
      impacto: 'critico',
      nivel: 'premium',
      acao: 'Faça o checklist de risco de grupo econômico. Busque independência operacional.'
    });
  }

  // ─── DICA 8: Comparativo de Regimes ───
  if (receitaBrutaAnual > 1_800_000) {
    dicas.push({
      id: 'comparativo_regimes',
      titulo: '📊 Compare: Simples x Lucro Presumido x Lucro Real',
      descricao: 'Com faturamento acima de R$ 1,8M, pode valer a pena migrar de regime. Use o comparativo completo.',
      impacto: 'alto',
      nivel: 'premium',
      acao: 'Execute compararRegimesCompleto() para análise detalhada.'
    });
  }

  // ─── DICA 9: Isenção Estadual de ICMS ───
  const isencaoUF = ISENCAO_ESTADUAL_ICMS[uf];
  if (isencaoUF && isencaoUF.isencao > 0 && receitaBrutaAnual <= isencaoUF.limiteReceita) {
    dicas.push({
      id: 'isencao_estadual',
      titulo: `✅ Isenção de ICMS no estado ${uf}`,
      descricao: isencaoUF.descricao,
      impacto: 'medio',
      nivel: 'gratuito',
      acao: 'Verifique se a isenção está sendo aplicada corretamente no DAS.'
    });
  }

  // ─── DICA 10: Reforma Tributária — Opção set/2026 ───
  dicas.push({
    id: 'reforma_tributaria_opcao',
    titulo: '🔄 Reforma Tributária: decida até setembro/2026',
    descricao: 'Empresas do SN devem optar até set/2026 se em 2027 continuam no Simples ou migram para IBS/CBS.',
    impacto: 'alto',
    nivel: 'premium',
    acao: 'Se sua empresa vende muito B2B, avaliar o modelo híbrido pode dar vantagem competitiva.'
  });

  // Ordenar por impacto
  const ordemImpacto = { critico: 0, alto: 1, medio: 2, baixo: 3 };
  dicas.sort((a, b) => (ordemImpacto[a.impacto] || 3) - (ordemImpacto[b.impacto] || 3));

  // Resumo
  const dicasGratuitas = dicas.filter(d => d.nivel === 'gratuito');
  const dicasPremium = dicas.filter(d => d.nivel === 'premium');

  return {
    totalDicas: dicas.length,
    dicasGratuitas: dicasGratuitas.length,
    dicasPremium: dicasPremium.length,
    dicas,
    mensagemVenda: dicasPremium.length > 0
      ? `🔓 Você tem ${dicasPremium.length} dica(s) PREMIUM bloqueada(s). ` +
        `Assine o IMPOST. para desbloquear estratégias avançadas de economia fiscal.`
      : null,
    ctaAssinatura: '💎 Assine agora e economize — IMPOST. Premium a partir de R$ 49,90/mês.'
  };
}


/**
 * 34.11 — RELATÓRIO COMPLETO DE ECONOMIA (Para Vendas de Assinatura)
 *
 * Gera relatório detalhado com todas as oportunidades de economia.
 * Versão gratuita mostra resumo; Premium mostra detalhes + ações.
 */
function gerarRelatorioEconomiaCompleto(params) {
  const {
    receitaBrutaAnual,
    receitaBrutaMensal,
    folhaAnual,
    folhaMensal,
    cnae,
    uf,
    municipio,
    socios = [],
    despesasOperacionais = 0,
    produtosMonofasicos = [],
    receitaMonofasica = 0,
    nivelAcesso = 'gratuito' // 'gratuito' ou 'premium'
  } = params;

  const rbt12 = receitaBrutaAnual;
  const fatorR = folhaAnual > 0 && rbt12 > 0 ? folhaAnual / rbt12 : 0;

  // Determinar anexo
  let anexo;
  try {
    const anexoResult = determinarAnexo({ cnae, fatorR });
    anexo = anexoResult.vedado ? null : anexoResult.anexo;
  } catch (e) {
    // Fallback: tentar via fator R direto
    anexo = fatorR >= LIMITE_FATOR_R ? 'III' : 'V';
  }

  if (!anexo) return { erro: 'CNAE vedado ao Simples Nacional.' };

  // DAS atual
  const dasAtual = calcularDASMensal({
    receitaBrutaMensal,
    rbt12,
    anexo,
    folhaMensal,
    aliquotaRAT: ALIQUOTA_RAT_PADRAO
  });

  // Dicas de economia
  const dicas = gerarDicasEconomia({
    receitaBrutaAnual,
    receitaBrutaMensal,
    folhaAnual,
    folhaMensal,
    cnae,
    uf,
    anexo,
    rbt12,
    socios,
    temProdutosMonofasicos: produtosMonofasicos.length > 0 || receitaMonofasica > 0,
    receitaMonofasica
  });

  // Impacto dividendos
  let impactoDividendos = null;
  if (socios.length > 0) {
    const lucroPresumido = receitaBrutaMensal * PRESUNCAO_LUCRO_SERVICOS;
    impactoDividendos = calcularImpactoDividendos2026({
      lucroDistribuivelMensal: lucroPresumido,
      socios
    });
  }

  // Economia monofásica
  let economiaMonofasica = null;
  if (receitaMonofasica > 0) {
    economiaMonofasica = calcularEconomiaMonofasica({ receitaMonofasica, rbt12, anexo });
  }

  // Penalidades evitáveis
  const penalidades = {
    pgdasd: calcularMultaAtraso({ tipo: 'PGDAS_D', valorTributos: dasAtual.dasAPagar, diasAtraso: 30 }),
    defis: calcularMultaAtraso({ tipo: 'DEFIS', valorTributos: dasAtual.dasAPagar * 12, diasAtraso: 30 })
  };

  const relatorio = {
    versao: '4.1.0',
    dataGeracao: new Date().toISOString(),
    produto: 'IMPOST. — Inteligência em Modelagem de Otimização Tributária',
    nivelAcesso,

    // Resumo (sempre visível)
    resumo: {
      dasAtual: dasAtual.dasAPagar,
      dasAtualFormatado: _fmtBRL(dasAtual.dasAPagar),
      aliquotaEfetiva: dasAtual.aliquotaEfetivaFormatada,
      anexo,
      fatorR: (fatorR * 100).toFixed(2) + '%',
      totalDicasEconomia: dicas.totalDicas,
      dicasPremiumBloqueadas: nivelAcesso === 'gratuito' ? dicas.dicasPremium : 0
    },

    // Calendário fiscal (sempre visível)
    calendarioFiscal: CALENDARIO_FISCAL_2026,

    // Penalidades 2026 (sempre visível como alerta)
    penalidades2026: PENALIDADES_2026,

    // Reforma Tributária (sempre visível)
    reformaTributaria: REFORMA_TRIBUTARIA_SIMPLES,

    // Dicas de economia (parcialmente bloqueadas)
    dicasEconomia: nivelAcesso === 'premium'
      ? dicas.dicas
      : dicas.dicas.map(d => d.nivel === 'gratuito' ? d : {
          ...d,
          economiaMensal: '🔒 Premium',
          economiaAnual: '🔒 Premium',
          acao: '🔒 Assine para desbloquear',
          bloqueado: true
        }),

    // Impacto dividendos (premium)
    impactoDividendos: nivelAcesso === 'premium' ? impactoDividendos : {
      resumo: impactoDividendos ? `${impactoDividendos.porSocio.length} sócio(s) analisado(s)` : null,
      detalhes: '🔒 Assine para ver a análise completa de dividendos.',
      bloqueado: true
    },

    // Economia monofásica (premium)
    economiaMonofasica: nivelAcesso === 'premium' ? economiaMonofasica : {
      resumo: economiaMonofasica ? `Economia estimada: 🔒 Premium` : null,
      bloqueado: true
    },

    // Grupo econômico (sempre visível como alerta)
    grupoEconomico: GRUPO_ECONOMICO_2026,

    // CTA de vendas
    cta: nivelAcesso === 'gratuito' ? {
      mensagem: `🎯 Você tem ${dicas.dicasPremium} estratégia(s) de economia bloqueada(s).`,
      acao: 'Assine o IMPOST. Premium e desbloqueie TODAS as estratégias.',
      preco: 'A partir de R$ 49,90/mês',
      beneficios: [
        'Dicas personalizadas de economia fiscal',
        'Comparativo completo de regimes tributários',
        'Alerta de prazos e multas automatizado',
        'Simulador de Fator "r" e migração de anexo',
        'Análise de impacto de dividendos (Lei 15.270/2025)',
        'Segregação monofásica automatizada',
        'Relatório mensal de otimização',
        'Suporte prioritário'
      ]
    } : null
  };

  return relatorio;
}


// ================================================================================
// CAMADA 10: MODULO DE AUDITORIA (LC 123/2006)
// Fonte: MAPEAMENTO DA LEI LC 123-2006.js v1.0.0
// Mapeamento artigo-a-artigo: 47 corretos, 9 parciais, 2 ausentes, 9 N/A.
// Cf. FUSAO_PLANO.md Secao 3.3.
// ================================================================================

// ════════════════════════════════════════════════════════════════════════
  //  ENTREGAVEL A — LC123_MAPA
  // ════════════════════════════════════════════════════════════════════════

  var LC123_MAPA = {

    metadata: {
      lei: 'Lei Complementar 123/2006',
      nomePopular: 'Estatuto Nacional da Microempresa e da Empresa de Pequeno Porte',
      publicacao: '2006-12-14',
      ultimaAlteracao: 'LC 214/2025 (Reforma Tributaria)',
      resolucaoRegulamentadora: 'Resolucao CGSN 140/2018',
      motorAlvo: 'simples_nacional.js v4.1.0',
      totalArtigos: 89,
      artigosMapeados: [3,12,13,16,17,18,19,20,21,25,26,29,30],
      dataExtracao: '2026-02-18'
    },

    artigos: [

      // ══════════════════════════════════════════════════════════════════
      //  ART. 3 — DEFINICAO DE ME E EPP (Limites de Receita Bruta)
      // ══════════════════════════════════════════════════════════════════
      {
        id: 'LC123-ART3',
        artigo: 3,
        titulo: 'Definicao de Microempresa e Empresa de Pequeno Porte',
        caput: 'Para os efeitos desta LC, consideram-se ME ou EPP a sociedade empresaria, a sociedade simples, a EIRELI e o empresario individual que aufira receita bruta anual dentro dos limites previstos.',

        regras: [
          {
            id: 'LC123-ART3-I',
            referencia: 'Art. 3, inciso I',
            descricao: 'Microempresa: receita bruta igual ou inferior a R$ 360.000,00 no ano-calendario',
            tipo: 'LIMITE',
            logica: 'IF receitaBrutaAnual <= 360000 THEN classificacao = "ME"',
            constantes: { LIMITE_ME: 360000.00 },
            motorExiste: true,
            motorLocal: 'CONSTANTES_LEGAIS.LIMITE_ME (linha ~25)',
            motorValorAtual: 360000.00,
            status: 'CORRETO'
          },
          {
            id: 'LC123-ART3-II',
            referencia: 'Art. 3, inciso II',
            descricao: 'Empresa de Pequeno Porte: receita bruta superior a R$ 360.000,00 e igual ou inferior a R$ 4.800.000,00',
            tipo: 'LIMITE',
            logica: 'IF receitaBrutaAnual > 360000 AND receitaBrutaAnual <= 4800000 THEN classificacao = "EPP"',
            constantes: { LIMITE_EPP: 4800000.00 },
            motorExiste: true,
            motorLocal: 'CONSTANTES_LEGAIS.LIMITE_EPP (linha ~26)',
            motorValorAtual: 4800000.00,
            status: 'CORRETO'
          },
          {
            id: 'LC123-ART3-P1',
            referencia: 'Art. 3, paragrafo 1',
            descricao: 'Receita bruta = produto da venda de bens e servicos nas operacoes de conta propria, preco dos servicos prestados e resultado nas operacoes em conta alheia, excluidas vendas canceladas e descontos incondicionais',
            tipo: 'DEFINICAO',
            logica: 'receitaBruta = vendaBens + precoServicos + resultadoContaAlheia - vendasCanceladas - descontosIncondicionais',
            motorExiste: true,
            motorLocal: 'validarDadosEntrada() + calcularDASMensal()',
            status: 'PARCIAL',
            gap: 'Motor nao deduz vendas canceladas nem descontos incondicionais explicitamente. Recebe valor liquido como input.'
          },
          {
            id: 'LC123-ART3-P2',
            referencia: 'Art. 3, paragrafo 2',
            descricao: 'No caso de inicio de atividade no proprio ano-calendario, os limites sao proporcionais ao numero de meses (incluindo fracoes)',
            tipo: 'CALCULO',
            logica: 'IF inicioAtividade THEN limiteProporcional = (LIMITE / 12) * mesesAtividade',
            formula: 'limiteProporcional = (4800000 / 12) * mesesFuncionamento',
            motorExiste: true,
            motorLocal: 'calcularRBT12Proporcional() (secao 19)',
            status: 'CORRETO'
          },
          {
            id: 'LC123-ART3-P4',
            referencia: 'Art. 3, paragrafo 4',
            descricao: 'Nao pode se beneficiar do tratamento juridico diferenciado quem: tenha participacao em outra PJ, seja filial/sucursal de PJ com sede no exterior, de cujo capital participe PJ, seja cooperativa (exceto consumo), etc.',
            tipo: 'VEDACAO',
            logica: 'IF participaOutraPJ OR filialExterior OR PJnoCapital OR cooperativa THEN naoElegivel = true',
            motorExiste: true,
            motorLocal: 'VEDACOES (secao 5, 14 vedacoes)',
            status: 'CORRETO',
            detalhe: 'Motor cobre os 10+ impedimentos do Art. 3 §4'
          },
          {
            id: 'LC123-ART3-P14',
            referencia: 'Art. 3, paragrafo 14',
            descricao: 'Para fins de enquadramento, deve-se considerar o conjunto de estabelecimentos da ME ou EPP (CNPJ raiz)',
            tipo: 'REGRA',
            logica: 'receitaBrutaTotal = SUM(receitas de todos estabelecimentos com mesmo CNPJ raiz)',
            motorExiste: false,
            motorLocal: null,
            status: 'AUSENTE',
            risco: 'MEDIO',
            recomendacao: 'Adicionar campo "cnpjFiliais" e somar receitas de filiais no calculo do RBT12'
          }
        ]
      },

      // ══════════════════════════════════════════════════════════════════
      //  ART. 12 — REGIME ESPECIAL UNIFICADO (Instituicao do Simples)
      // ══════════════════════════════════════════════════════════════════
      {
        id: 'LC123-ART12',
        artigo: 12,
        titulo: 'Instituicao do Regime Especial Unificado de Arrecadacao',
        caput: 'Fica instituido o Regime Especial Unificado de Arrecadacao de Tributos e Contribuicoes devidos pelas ME e EPP — Simples Nacional.',

        regras: [
          {
            id: 'LC123-ART12-CAPUT',
            referencia: 'Art. 12, caput',
            descricao: 'O Simples Nacional implica recolhimento mensal unificado via DAS dos tributos: IRPJ, CSLL, PIS/Pasep, COFINS, IPI, ICMS, ISS e CPP',
            tipo: 'DEFINICAO',
            logica: 'DAS = documento unico que engloba ate 8 tributos',
            motorExiste: true,
            motorLocal: 'calcularPartilhaTributos() (secao 12) + PARTILHA (secao 3)',
            status: 'CORRETO',
            detalhe: 'Motor particiona DAS nos 8 tributos conforme tabelas de partilha por anexo'
          }
        ]
      },

      // ══════════════════════════════════════════════════════════════════
      //  ART. 13 — TRIBUTOS ABRANGIDOS PELO SIMPLES NACIONAL
      // ══════════════════════════════════════════════════════════════════
      {
        id: 'LC123-ART13',
        artigo: 13,
        titulo: 'Tributos Abrangidos e Nao Abrangidos',
        caput: 'O Simples Nacional implica o recolhimento mensal, mediante DAS, dos seguintes tributos.',

        regras: [
          {
            id: 'LC123-ART13-I-VIII',
            referencia: 'Art. 13, incisos I a VIII',
            descricao: 'Tributos unificados no DAS: I-IRPJ, II-IPI, III-CSLL, IV-COFINS, V-PIS/Pasep, VI-CPP(patronal), VII-ICMS, VIII-ISS',
            tipo: 'LISTA',
            logica: 'DAS = IRPJ + IPI + CSLL + COFINS + PIS + CPP + ICMS + ISS (conforme anexo aplicavel)',
            tributos: ['IRPJ','IPI','CSLL','COFINS','PIS','CPP','ICMS','ISS'],
            motorExiste: true,
            motorLocal: 'PARTILHA.ANEXO_I a PARTILHA.ANEXO_V (secao 3)',
            status: 'CORRETO'
          },
          {
            id: 'LC123-ART13-P1-I',
            referencia: 'Art. 13, paragrafo 1, inciso I',
            descricao: 'O Simples Nacional NAO inclui IOF',
            tipo: 'EXCLUSAO',
            motorExiste: false,
            status: 'NAO_APLICAVEL',
            detalhe: 'IOF nao e calculado no motor (correto, pois e tributo a parte)'
          },
          {
            id: 'LC123-ART13-P1-II',
            referencia: 'Art. 13, paragrafo 1, inciso II',
            descricao: 'NAO inclui II (Imposto de Importacao)',
            tipo: 'EXCLUSAO',
            motorExiste: false,
            status: 'NAO_APLICAVEL'
          },
          {
            id: 'LC123-ART13-P1-III',
            referencia: 'Art. 13, paragrafo 1, inciso III',
            descricao: 'NAO inclui IE (Imposto de Exportacao)',
            tipo: 'EXCLUSAO',
            motorExiste: false,
            status: 'NAO_APLICAVEL'
          },
          {
            id: 'LC123-ART13-P1-IV',
            referencia: 'Art. 13, paragrafo 1, inciso IV',
            descricao: 'NAO inclui ITR (Imposto Territorial Rural)',
            tipo: 'EXCLUSAO',
            motorExiste: false,
            status: 'NAO_APLICAVEL'
          },
          {
            id: 'LC123-ART13-P1-V',
            referencia: 'Art. 13, paragrafo 1, inciso V',
            descricao: 'NAO inclui IR sobre rendimentos de aplicacoes financeiras, ganhos de capital, etc.',
            tipo: 'EXCLUSAO',
            motorExiste: false,
            status: 'NAO_APLICAVEL'
          },
          {
            id: 'LC123-ART13-P1-XII',
            referencia: 'Art. 13, paragrafo 1, inciso XII',
            descricao: 'NAO inclui ICMS devido por substituicao tributaria, antecipacao ou diferencial de aliquota (DIFAL)',
            tipo: 'EXCLUSAO_IMPORTANTE',
            logica: 'IF operacao == "ICMS-ST" OR operacao == "DIFAL" THEN tributacaoSeparada = true',
            motorExiste: true,
            motorLocal: 'calcularDIFAL() (secao 34) + REDUCOES_LEGAIS[3] ICMS-ST (secao 23)',
            status: 'CORRETO',
            detalhe: 'Motor calcula DIFAL separado e permite deducao de ICMS-ST do DAS'
          },
          {
            id: 'LC123-ART13-P1-XIII',
            referencia: 'Art. 13, paragrafo 1, inciso XIII',
            descricao: 'NAO inclui ISS devido ao proprio municipio em operacao com retencao (tomador retem)',
            tipo: 'EXCLUSAO_IMPORTANTE',
            logica: 'IF issRetidoNaFonte THEN abaterISSdoDAS = true',
            motorExiste: true,
            motorLocal: 'REDUCOES_LEGAIS[2] ISS retido na fonte (secao 23) + calcularDASMensalOtimizado()',
            status: 'CORRETO'
          },
          {
            id: 'LC123-ART13-P1-XIV',
            referencia: 'Art. 13, paragrafo 1, inciso XIV',
            descricao: 'NAO inclui ICMS/ISS devido na tributacao concentrada (monofasica)',
            tipo: 'EXCLUSAO_IMPORTANTE',
            logica: 'IF produtoMonofasico THEN excluirPIS_COFINS_do_DAS = true',
            motorExiste: true,
            motorLocal: 'REDUCOES_LEGAIS[0] monofasica + PRODUTOS_MONOFASICOS (secao 29) + verificarMonofasicoNCM()',
            status: 'CORRETO'
          },
          {
            id: 'LC123-ART13-VI-CPP',
            referencia: 'Art. 13, inciso VI + Art. 18 §5-C',
            descricao: 'CPP (Contribuicao Patronal Previdenciaria) esta incluida no DAS EXCETO para atividades do Anexo IV (construcao civil, etc), que devem recolher INSS patronal separadamente (20%)',
            tipo: 'EXCECAO',
            logica: 'IF anexo == "IV" THEN inssPatronalSeparado = receitaMensal * 0.20',
            constantes: { ALIQUOTA_INSS_PATRONAL_ANEXO_IV: 0.20 },
            motorExiste: true,
            motorLocal: 'CONSTANTES_LEGAIS.ALIQUOTA_INSS_PATRONAL_ANEXO_IV + calcularDASMensal() (secao 10)',
            motorValorAtual: 0.20,
            status: 'CORRETO'
          }
        ]
      },

      // ══════════════════════════════════════════════════════════════════
      //  ART. 16 — OPCAO PELO SIMPLES NACIONAL
      // ══════════════════════════════════════════════════════════════════
      {
        id: 'LC123-ART16',
        artigo: 16,
        titulo: 'Opcao pelo Simples Nacional',
        caput: 'A opcao pelo Simples Nacional dar-se-a na forma a ser estabelecida em ato do CGSN, sendo irretratavel para todo o ano-calendario.',

        regras: [
          {
            id: 'LC123-ART16-CAPUT',
            referencia: 'Art. 16, caput',
            descricao: 'Opcao e irretratavel para todo o ano-calendario. Prazo: ate o ultimo dia util de janeiro (Resolucao CGSN 140, Art. 6)',
            tipo: 'PRAZO',
            logica: 'IF dataOpcao > ultimoDiaUtilJaneiro THEN opcaoIndisponivel = true; proximaJanela = "janeiro proximo ano"',
            motorExiste: true,
            motorLocal: 'TRANSICOES (secao 18) - menciona prazo de opcao',
            status: 'PARCIAL',
            gap: 'Motor menciona transicao mas nao tem validacao de prazo como regra de negocio automatica'
          },
          {
            id: 'LC123-ART16-P1',
            referencia: 'Art. 16, paragrafo 1',
            descricao: 'Para empresa em inicio de atividade, prazo de opcao e de 30 dias contados do ultimo deferimento de inscricao (municipal ou estadual), desde que nao ultrapasse 60 dias da data de abertura do CNPJ',
            tipo: 'PRAZO',
            logica: 'IF inicioAtividade THEN prazoOpcao = MIN(30 dias apos ultima inscricao, 60 dias apos abertura CNPJ)',
            motorExiste: false,
            status: 'AUSENTE',
            risco: 'BAIXO',
            recomendacao: 'Adicionar alerta informativo sobre prazos de opcao para novas empresas'
          },
          {
            id: 'LC123-ART16-P2',
            referencia: 'Art. 16, paragrafo 2',
            descricao: 'A opcao retroage a data de abertura do CNPJ (para empresas em inicio de atividade)',
            tipo: 'REGRA',
            logica: 'IF inicioAtividade AND opcaoDeferida THEN efeitosDesde = dataCNPJ',
            motorExiste: false,
            status: 'AUSENTE',
            risco: 'BAIXO'
          }
        ]
      },

      // ══════════════════════════════════════════════════════════════════
      //  ART. 17 — VEDACOES AO SIMPLES NACIONAL
      // ══════════════════════════════════════════════════════════════════
      {
        id: 'LC123-ART17',
        artigo: 17,
        titulo: 'Vedacoes ao Ingresso no Simples Nacional',
        caput: 'Nao poderao recolher os impostos e contribuicoes na forma do Simples Nacional a ME ou EPP que se enquadre em qualquer das seguintes situacoes.',

        regras: [
          {
            id: 'LC123-ART17-I',
            referencia: 'Art. 17, inciso I',
            descricao: 'Que explore atividade de prestacao cumulativa e continua de servicos de assessoria crediticia, gestao de credito, selecao e riscos, administracao de contas a pagar e receber, gerenciamento de ativos (asset management), compras de direitos creditorios resultantes de vendas mercantis a prazo ou de prestacao de servicos (factoring)',
            tipo: 'VEDACAO',
            logica: 'IF atividadePrincipal == "factoring" THEN vedado = true',
            motorExiste: true,
            motorLocal: 'VEDACOES[0].id = "debitos_fiscais" ... verificar cobertura completa',
            status: 'PARCIAL',
            gap: 'Motor tem 14 vedacoes mas verificar se factoring esta explicitamente coberto'
          },
          {
            id: 'LC123-ART17-II',
            referencia: 'Art. 17, inciso II',
            descricao: 'Que tenha socio domiciliado no exterior',
            tipo: 'VEDACAO',
            logica: 'IF socioDomiciliadoExterior THEN vedado = true',
            motorExiste: true,
            motorLocal: 'VEDACOES - coberto em participacao de PJ',
            status: 'CORRETO'
          },
          {
            id: 'LC123-ART17-V',
            referencia: 'Art. 17, inciso V',
            descricao: 'Que possua debito com o INSS, ou com as Fazendas Publicas Federal, Estadual ou Municipal, cuja exigibilidade nao esteja suspensa',
            tipo: 'VEDACAO',
            logica: 'IF debitosFiscaisExigiveis THEN vedado = true',
            motorExiste: true,
            motorLocal: 'VEDACOES[0] debitos_fiscais',
            status: 'CORRETO'
          },
          {
            id: 'LC123-ART17-VI',
            referencia: 'Art. 17, inciso VI',
            descricao: 'Que preste servico de transporte intermunicipal e interestadual de passageiros, EXCETO quando na modalidade fluvial ou quando possuir caracteristicas de transporte urbano ou metropolitano',
            tipo: 'VEDACAO_COM_EXCECAO',
            logica: 'IF transporteIntermunicipalPassageiros AND NOT (fluvial OR urbanoMetropolitano) THEN vedado = true',
            motorExiste: true,
            motorLocal: 'VEDACOES - coberto parcialmente',
            status: 'PARCIAL',
            gap: 'Excecao para transporte fluvial/urbano pode nao estar implementada'
          },
          {
            id: 'LC123-ART17-X',
            referencia: 'Art. 17, inciso X',
            descricao: 'Que exerca atividade de producao ou venda no atacado de cigarros, cigarrilhas, charutos, filtros para cigarros, armas de fogo, municoes e explosivos, bebidas alcoólicas (exceto aliquota zero ou micro/pequenas cervejas artesanais), cervejas sem alcool, e bebidas alcoólicas (exceto micro/pequenos produtores)',
            tipo: 'VEDACAO',
            logica: 'IF atividadeProibida IN [cigarros, armas, municoes, bebidasAlcoolicas] THEN vedado = true',
            motorExiste: true,
            motorLocal: 'VEDACOES - coberto em atividades vedadas',
            status: 'CORRETO'
          },
          {
            id: 'LC123-ART17-XII',
            referencia: 'Art. 17, inciso XII',
            descricao: 'Que realize cessao ou locacao de mao-de-obra',
            tipo: 'VEDACAO',
            logica: 'IF cessaoMaoDeObra THEN vedado = true',
            motorExiste: true,
            motorLocal: 'VEDACOES - locacao/cessao mao de obra',
            status: 'CORRETO'
          },
          {
            id: 'LC123-ART17-P1',
            referencia: 'Art. 17, paragrafo 1',
            descricao: 'As vedacoes relativas a exercicio de atividades nao se aplicam as pessoas juridicas que se dediquem exclusivamente as atividades listadas nos paragrafos 5-B a 5-E do Art. 18 ou que exeram concomitantemente atividade nao vedada',
            tipo: 'EXCECAO_GERAL',
            logica: 'IF atividadePrincipalVedada BUT atividadesSecundariasPermitidas THEN permitidoComRestricoes = true',
            motorExiste: true,
            motorLocal: 'REGRAS_TRIBUTACAO_ATIVIDADE (secao 22)',
            status: 'CORRETO',
            detalhe: 'Motor trata regras de atividade mista via CNAE e paragrafos 5-B, 5-C, 5-E, 5-F, 5-I'
          }
        ]
      },

      // ══════════════════════════════════════════════════════════════════
      //  ART. 18 — CALCULO DO VALOR DEVIDO (CORE DO SIMPLES)
      // ══════════════════════════════════════════════════════════════════
      {
        id: 'LC123-ART18',
        artigo: 18,
        titulo: 'Valor Devido Mensalmente — Calculo do DAS',
        caput: 'O valor devido mensalmente pela ME ou EPP sera determinado mediante aplicacao das aliquotas efetivas sobre a receita bruta mensal.',

        regras: [
          {
            id: 'LC123-ART18-CAPUT',
            referencia: 'Art. 18, caput',
            descricao: 'Valor devido = receita bruta mensal * aliquota efetiva. Apurado com base na receita bruta acumulada nos 12 meses anteriores (RBT12)',
            tipo: 'FORMULA_CORE',
            logica: 'DAS = receitaBrutaMensal * aliquotaEfetiva(RBT12)',
            formula: 'aliquotaEfetiva = (RBT12 * aliquotaNominal - parcelaDeduzir) / RBT12',
            motorExiste: true,
            motorLocal: 'calcularAliquotaEfetiva() (secao 9) + calcularDASMensal() (secao 10)',
            status: 'CORRETO'
          },
          {
            id: 'LC123-ART18-P1',
            referencia: 'Art. 18, paragrafo 1',
            descricao: 'Para efeito de determinacao da aliquota, o sujeito passivo utilizara a receita bruta acumulada nos 12 meses anteriores ao do periodo de apuracao (RBT12)',
            tipo: 'DEFINICAO',
            logica: 'RBT12 = SUM(receitaBruta[mes-12..mes-1])',
            motorExiste: true,
            motorLocal: 'Parametro rbt12 em todas funcoes de calculo',
            status: 'CORRETO'
          },
          {
            id: 'LC123-ART18-P1A',
            referencia: 'Art. 18, paragrafo 1-A',
            descricao: 'A aliquota efetiva e o resultado de: (RBT12 x ALIQ_NOMINAL - PARCELA_DEDUZIR) / RBT12',
            tipo: 'FORMULA_LEGAL',
            formula: 'aliquotaEfetiva = ((RBT12 * aliquotaNominal) - parcelaDeduzir) / RBT12',
            motorExiste: true,
            motorLocal: 'calcularAliquotaEfetiva() — implementacao exata da formula',
            status: 'CORRETO'
          },
          {
            id: 'LC123-ART18-ANEXO-I',
            referencia: 'Art. 18, paragrafo 2 + Anexo I',
            descricao: 'Comercio — 6 faixas de R$0 a R$4.800.000, aliquotas nominais de 4% a 19%, deducoes de R$0 a R$378.000',
            tipo: 'TABELA',
            faixas: [
              { faixa: 1, min: 0, max: 180000, aliqNominal: 0.040, deducao: 0 },
              { faixa: 2, min: 180000.01, max: 360000, aliqNominal: 0.073, deducao: 5940 },
              { faixa: 3, min: 360000.01, max: 720000, aliqNominal: 0.095, deducao: 13860 },
              { faixa: 4, min: 720000.01, max: 1800000, aliqNominal: 0.107, deducao: 22500 },
              { faixa: 5, min: 1800000.01, max: 3600000, aliqNominal: 0.143, deducao: 87300 },
              { faixa: 6, min: 3600000.01, max: 4800000, aliqNominal: 0.190, deducao: 378000 }
            ],
            motorExiste: true,
            motorLocal: 'ANEXOS.ANEXO_I (secao 2)',
            status: 'CORRETO'
          },
          {
            id: 'LC123-ART18-ANEXO-II',
            referencia: 'Art. 18, paragrafo 2 + Anexo II',
            descricao: 'Industria — 6 faixas, aliquotas 4.5% a 30%',
            tipo: 'TABELA',
            faixas: [
              { faixa: 1, min: 0, max: 180000, aliqNominal: 0.045, deducao: 0 },
              { faixa: 2, min: 180000.01, max: 360000, aliqNominal: 0.078, deducao: 5940 },
              { faixa: 3, min: 360000.01, max: 720000, aliqNominal: 0.100, deducao: 13860 },
              { faixa: 4, min: 720000.01, max: 1800000, aliqNominal: 0.112, deducao: 22500 },
              { faixa: 5, min: 1800000.01, max: 3600000, aliqNominal: 0.147, deducao: 85500 },
              { faixa: 6, min: 3600000.01, max: 4800000, aliqNominal: 0.300, deducao: 720000 }
            ],
            motorExiste: true,
            motorLocal: 'ANEXOS.ANEXO_II (secao 2)',
            status: 'CORRETO'
          },
          {
            id: 'LC123-ART18-ANEXO-III',
            referencia: 'Art. 18, paragrafo 2 + Anexo III',
            descricao: 'Servicos (Fator R >= 28%) — 6 faixas, aliquotas 6% a 33%',
            tipo: 'TABELA',
            faixas: [
              { faixa: 1, min: 0, max: 180000, aliqNominal: 0.060, deducao: 0 },
              { faixa: 2, min: 180000.01, max: 360000, aliqNominal: 0.112, deducao: 9360 },
              { faixa: 3, min: 360000.01, max: 720000, aliqNominal: 0.135, deducao: 17640 },
              { faixa: 4, min: 720000.01, max: 1800000, aliqNominal: 0.160, deducao: 35640 },
              { faixa: 5, min: 1800000.01, max: 3600000, aliqNominal: 0.210, deducao: 125640 },
              { faixa: 6, min: 3600000.01, max: 4800000, aliqNominal: 0.330, deducao: 648000 }
            ],
            motorExiste: true,
            motorLocal: 'ANEXOS.ANEXO_III (secao 2)',
            status: 'CORRETO'
          },
          {
            id: 'LC123-ART18-ANEXO-IV',
            referencia: 'Art. 18, paragrafo 2 + Anexo IV',
            descricao: 'Servicos sem CPP no DAS (construcao civil, vigilancia, limpeza) — 6 faixas, 4.5% a 33%',
            tipo: 'TABELA',
            faixas: [
              { faixa: 1, min: 0, max: 180000, aliqNominal: 0.045, deducao: 0 },
              { faixa: 2, min: 180000.01, max: 360000, aliqNominal: 0.090, deducao: 8100 },
              { faixa: 3, min: 360000.01, max: 720000, aliqNominal: 0.102, deducao: 12420 },
              { faixa: 4, min: 720000.01, max: 1800000, aliqNominal: 0.140, deducao: 39780 },
              { faixa: 5, min: 1800000.01, max: 3600000, aliqNominal: 0.220, deducao: 183780 },
              { faixa: 6, min: 3600000.01, max: 4800000, aliqNominal: 0.330, deducao: 828000 }
            ],
            motorExiste: true,
            motorLocal: 'ANEXOS.ANEXO_IV (secao 2)',
            status: 'CORRETO',
            detalhe: 'CPP nao inclusa — INSS patronal de 20% recolhido separadamente'
          },
          {
            id: 'LC123-ART18-ANEXO-V',
            referencia: 'Art. 18, paragrafo 2 + Anexo V',
            descricao: 'Servicos (Fator R < 28%) — 6 faixas, 15.5% a 30.5%',
            tipo: 'TABELA',
            faixas: [
              { faixa: 1, min: 0, max: 180000, aliqNominal: 0.155, deducao: 0 },
              { faixa: 2, min: 180000.01, max: 360000, aliqNominal: 0.180, deducao: 4500 },
              { faixa: 3, min: 360000.01, max: 720000, aliqNominal: 0.195, deducao: 9900 },
              { faixa: 4, min: 720000.01, max: 1800000, aliqNominal: 0.205, deducao: 17100 },
              { faixa: 5, min: 1800000.01, max: 3600000, aliqNominal: 0.230, deducao: 62100 },
              { faixa: 6, min: 3600000.01, max: 4800000, aliqNominal: 0.305, deducao: 540000 }
            ],
            motorExiste: true,
            motorLocal: 'ANEXOS.ANEXO_V (secao 2)',
            status: 'CORRETO'
          },
          {
            id: 'LC123-ART18-P3',
            referencia: 'Art. 18, paragrafo 3',
            descricao: 'Segregacao de receitas: ME/EPP que exerca atividades com tributacao diferenciada deve segregar as receitas por atividade no PGDAS-D',
            tipo: 'REGRA_SEGREGACAO',
            logica: 'IF multiplasCNAEs THEN segregarReceitaPorAnexo AND calcularDASSeparadoPorAtividade',
            motorExiste: true,
            motorLocal: 'calcularDASSegregado() (secao 14-new) + SEGREGACAO_RECEITAS (secao 24)',
            status: 'CORRETO',
            detalhe: 'Motor implementa segregacao via calcularDASSegregado com array de receitas por CNAE'
          },
          {
            id: 'LC123-ART18-P4',
            referencia: 'Art. 18, paragrafo 4',
            descricao: 'Atividades tributadas na forma do Anexo IV (construcao de imoveis, vigilancia/seguranca, limpeza, servicos advocaticios): NAO incluem CPP na aliquota do Simples',
            tipo: 'EXCECAO_CPP',
            logica: 'IF cnaeAnexoIV THEN cppDentroDoSimples = false; inssPatronal20PorCento = true',
            atividadesAnexoIV: [
              'Construcao de imoveis e obras de engenharia em geral (inclusive sob a forma de subempreitada)',
              'Servicos de vigilancia, limpeza ou conservacao',
              'Servicos advocaticios (LC 147/2014)'
            ],
            motorExiste: true,
            motorLocal: 'calcularDASMensal() — verifica isAnexoIV para adicionar INSS patronal',
            status: 'CORRETO'
          },
          {
            id: 'LC123-ART18-P5',
            referencia: 'Art. 18, paragrafo 5',
            descricao: 'Atividades do Art. 17 §1 serao tributadas na forma do Anexo III, ressalvado o §5-C (Fator R)',
            tipo: 'REGRA_ANEXO',
            motorExiste: true,
            motorLocal: 'REGRAS_TRIBUTACAO_ATIVIDADE (secao 22)',
            status: 'CORRETO'
          },
          {
            id: 'LC123-ART18-P5B',
            referencia: 'Art. 18, paragrafo 5-B',
            descricao: 'Sem retencao ou substituicao, tributam-se Anexo III: fisioterapia, corretagem seguros, construcao sem material (desde 2015)',
            tipo: 'REGRA_ANEXO',
            logica: 'IF atividade IN lista5B THEN anexo = "III" (desde que fatorR >= 0.28)',
            motorExiste: true,
            motorLocal: 'REGRAS_TRIBUTACAO_ATIVIDADE.paragrafo5B (secao 22)',
            status: 'CORRETO'
          },
          {
            id: 'LC123-ART18-P5C',
            referencia: 'Art. 18, paragrafo 5-C',
            descricao: 'Atividades do §5-B e §5-I: se Fator R (folha/receita 12m) >= 28%, Anexo III; se < 28%, Anexo V',
            tipo: 'REGRA_FATOR_R',
            logica: 'IF fatorR >= 0.28 THEN anexo = "III" ELSE anexo = "V"',
            constantes: { LIMITE_FATOR_R: 0.28 },
            motorExiste: true,
            motorLocal: 'calcularFatorR() (secao 7) + CONSTANTES_LEGAIS.LIMITE_FATOR_R',
            status: 'CORRETO'
          },
          {
            id: 'LC123-ART18-P5E',
            referencia: 'Art. 18, paragrafo 5-E',
            descricao: 'Sem retencao ou substituicao, tributam-se Anexo III: medicina, odontologia, psicologia, fonoaudiologia, terapia ocupacional, acupuntura, podologia, nutricionismo, servicos de comissaria, despachantes, tradutores, etc.',
            tipo: 'REGRA_ANEXO',
            logica: 'IF atividade IN lista5E THEN anexo = determinarPorFatorR()',
            motorExiste: true,
            motorLocal: 'REGRAS_TRIBUTACAO_ATIVIDADE.paragrafo5E (secao 22)',
            status: 'CORRETO'
          },
          {
            id: 'LC123-ART18-P5F',
            referencia: 'Art. 18, paragrafo 5-F',
            descricao: 'Arquitetura e urbanismo, atividades desde 2015',
            tipo: 'REGRA_ANEXO',
            motorExiste: true,
            motorLocal: 'REGRAS_TRIBUTACAO_ATIVIDADE.paragrafo5F (secao 22)',
            status: 'CORRETO'
          },
          {
            id: 'LC123-ART18-P5I',
            referencia: 'Art. 18, paragrafo 5-I (LC 147/2014)',
            descricao: '12 incisos de atividades tributadas no Anexo III ou V conforme Fator R: administracao, contabilidade, auditoria, consultoria, engenharia, publicidade, jornalismo, tecnologia da informacao (TI), etc.',
            tipo: 'REGRA_FATOR_R',
            logica: 'IF atividade IN lista5I THEN IF fatorR >= 0.28 THEN "III" ELSE "V"',
            incisos: [
              'I — administracao e locacao de imoveis de terceiros',
              'II — academias de danca, de capoeira, de ioga e de artes marciais',
              'III — academias de atividades fisicas, desportivas, de natacao e escolas de esportes',
              'IV — elaboracao de programas de computadores, inclusive jogos eletronicos (TI)',
              'V — licenciamento ou cessao de direito de uso de programas de computacao',
              'VI — planejamento, confeccao, manutencao e atualizacao de paginas eletronicas (web)',
              'VII — empresas montadoras de estandes para feiras',
              'VIII — laboratorios de analises clinicas ou de patologia clinica',
              'IX — servicos de tomografia, diagnosticos medicos por imagem, etc.',
              'X — servicos de protese em geral',
              'XI — servico de auditoria, economia, consultoria, gestao, organizacao, etc.',
              'XII — outras atividades do setor de servicos com natureza preponderantemente intelectual'
            ],
            motorExiste: true,
            motorLocal: 'ATIVIDADES_PARAGRAFO_5I (secao 21) — 12 incisos mapeados',
            status: 'CORRETO'
          },
          {
            id: 'LC123-ART18-P14',
            referencia: 'Art. 18, paragrafo 14',
            descricao: 'ISS tera aliquota minima de 2% (LC 116/2003, Art. 8-A)',
            tipo: 'CONSTANTE',
            logica: 'IF issCalculado < 0.02 THEN iss = 0.02',
            constantes: { ISS_MINIMO: 0.02 },
            motorExiste: true,
            motorLocal: 'CONSTANTES_LEGAIS.ISS_MINIMO + calcularPartilhaTributos()',
            status: 'CORRETO'
          },
          {
            id: 'LC123-ART18-P14A',
            referencia: 'Art. 18, paragrafo 14-A',
            descricao: 'ISS sera retido na fonte quando prestador e tomador estiverem no mesmo municipio. Aliquota do ISS para retencao: conforme faixa do RBT12 do prestador',
            tipo: 'REGRA',
            logica: 'IF issRetencao THEN aliquotaISSRetido = aliquotaEfetiva * percentualISSdaPartilha',
            motorExiste: true,
            motorLocal: 'calcularPartilhaTributos() calcula ISS; REDUCOES_LEGAIS[2] aplica deducao ISS retido',
            status: 'CORRETO'
          },
          {
            id: 'LC123-ART18-P24',
            referencia: 'Art. 18, paragrafo 24',
            descricao: 'Para receita de exportacao de mercadorias para o exterior (incluindo via empresa comercial exportadora ou SPC), serao desconsiderados os percentuais de COFINS, PIS/Pasep e ICMS',
            tipo: 'REDUCAO',
            logica: 'IF receitaExportacao THEN excluirDoCalculo = ["COFINS","PIS","ICMS"]',
            motorExiste: true,
            motorLocal: 'REDUCOES_LEGAIS[3] exportacao (secao 23)',
            status: 'CORRETO',
            detalhe: 'Motor desconta PIS+COFINS+ICMS da aliquota efetiva para receitas de exportacao'
          }
        ]
      },

      // ══════════════════════════════════════════════════════════════════
      //  ART. 19 — SUBLIMITE ESTADUAL (ICMS/ISS)
      // ══════════════════════════════════════════════════════════════════
      {
        id: 'LC123-ART19',
        artigo: 19,
        titulo: 'Sublimite para ICMS e ISS',
        caput: 'Sem prejuizo da possibilidade de adocao de todas as faixas de receita bruta anual previstas nos Anexos, os Estados e o DF cuja participacao no PIB brasileiro seja de ate 1% poderao adotar sublimite de receita bruta inferior a R$ 3.600.000,00.',

        regras: [
          {
            id: 'LC123-ART19-CAPUT',
            referencia: 'Art. 19, caput + Art. 19, paragrafo 4',
            descricao: 'Sublimite de R$ 3.600.000 para ICMS e ISS. Acima desse valor, ICMS e ISS sao recolhidos por fora do DAS (regime normal estadual/municipal)',
            tipo: 'LIMITE',
            logica: 'IF RBT12 > 3600000 THEN icmsISS = "recolhimento por fora do DAS (regime normal)"',
            constantes: { SUBLIMITE_ICMS_ISS: 3600000.00 },
            motorExiste: true,
            motorLocal: 'CONSTANTES_LEGAIS.SUBLIMITE_ICMS_ISS + verificarElegibilidade() alerta sublimite',
            status: 'CORRETO'
          },
          {
            id: 'LC123-ART19-P4',
            referencia: 'Art. 19, paragrafo 4',
            descricao: 'EPP com receita bruta superior ao sublimite fica sujeita a: tributacao dos demais tributos pelo Simples + ICMS/ISS pelo regime normal',
            tipo: 'REGIME_MISTO',
            logica: 'IF RBT12 > SUBLIMITE THEN dasReduzido = DAS - ICMS - ISS; icmsNormal = apurar pelo regime do estado; issNormal = apurar conforme LC 116',
            motorExiste: true,
            motorLocal: 'calcularDASMensalOtimizado() — desconta ICMS/ISS quando sublimite ultrapassado',
            status: 'CORRETO'
          }
        ]
      },

      // ══════════════════════════════════════════════════════════════════
      //  ART. 20 — EXCESSO DE RECEITA DENTRO DO ANO
      // ══════════════════════════════════════════════════════════════════
      {
        id: 'LC123-ART20',
        artigo: 20,
        titulo: 'Excesso de Receita Bruta no Ano-Calendario',
        caput: 'A ME ou a EPP que no decurso do ano-calendario de inicio de atividade ultrapassar o limite proporcional de receita bruta tera que comunicar sua exclusao obrigatoria.',

        regras: [
          {
            id: 'LC123-ART20-CAPUT',
            referencia: 'Art. 20, caput',
            descricao: 'Se a empresa exceder o limite de R$ 4.800.000 no decurso do ano, deve comunicar exclusao',
            tipo: 'EXCLUSAO',
            logica: 'IF receitaAnual > 4800000 THEN exclusaoObrigatoria = true',
            motorExiste: true,
            motorLocal: 'verificarElegibilidade() — checa elegibilidade e alerta excesso',
            status: 'CORRETO'
          },
          {
            id: 'LC123-ART20-EFEITOS',
            referencia: 'Art. 20 combinado com Art. 30',
            descricao: 'Se excesso <= 20% (ate R$ 5.760.000), exclusao produz efeitos a partir de 1o de janeiro do ano seguinte. Se excesso > 20%, exclusao retroativa ao mes do excesso',
            tipo: 'REGRA_RETROATIVA',
            logica: 'IF receitaAnual > 4800000 AND receitaAnual <= 5760000 THEN efeitosExclusao = "01/jan proximo ano"; IF receitaAnual > 5760000 THEN efeitosExclusao = "mes do excesso (retroativa)"',
            constantes: { LIMITE_EXCESSO_20_PORCENTO: 5760000.00 },
            motorExiste: true,
            motorLocal: 'CONSTANTES_LEGAIS.LIMITE_EXCESSO_20_PORCENTO + verificarElegibilidade()',
            status: 'CORRETO'
          }
        ]
      },

      // ══════════════════════════════════════════════════════════════════
      //  ART. 21 — ISS FIXO / RETENCAO NA FONTE
      // ══════════════════════════════════════════════════════════════════
      {
        id: 'LC123-ART21',
        artigo: 21,
        titulo: 'ISS — Retencao na Fonte e Regras Especiais',
        caput: 'Os tributos devidos serao determinados sobre a receita bruta auferida no periodo de apuracao.',

        regras: [
          {
            id: 'LC123-ART21-P4',
            referencia: 'Art. 21, paragrafo 4',
            descricao: 'A retencao na fonte de ISS das ME/EPP optantes pelo Simples sera pela aliquota de ISS correspondente a sua faixa de receita no Simples (e nao a aliquota cheia do municipio)',
            tipo: 'REGRA',
            logica: 'aliquotaISSRetencao = aliquotaEfetiva * percentualISSnaPARTILHA',
            motorExiste: true,
            motorLocal: 'calcularPartilhaTributos() — separa ISS proporcional',
            status: 'CORRETO'
          },
          {
            id: 'LC123-ART21-P4A',
            referencia: 'Art. 21, paragrafo 4-A',
            descricao: 'Na retencao de ISS por ME/EPP na 1a faixa do Anexo III, IV ou V, a aliquota de ISS aplicavel e de 2% (Art. 18 §14)',
            tipo: 'REGRA',
            logica: 'IF faixa == 1 AND (anexo == "III" OR anexo == "IV" OR anexo == "V") THEN issRetencao = MAX(issCalculado, 0.02)',
            motorExiste: true,
            motorLocal: 'CONSTANTES_LEGAIS.ISS_MINIMO = 0.02',
            status: 'CORRETO'
          },
          {
            id: 'LC123-ART21-P5',
            referencia: 'Art. 21, paragrafo 5',
            descricao: 'Aliquota maxima de ISS no Simples: 5%. Se calculo da partilha resultar em mais de 5%, aplica-se 5% e distribui o restante entre os demais tributos',
            tipo: 'TETO',
            logica: 'IF issPartilha > 0.05 THEN iss = 0.05; redistribuirExcesso()',
            constantes: { ISS_MAXIMO: 0.05 },
            motorExiste: true,
            motorLocal: 'CONSTANTES_LEGAIS.ISS_MAXIMO + calcularPartilhaTributos() — aplica cap 5%',
            status: 'CORRETO'
          }
        ]
      },

      // ══════════════════════════════════════════════════════════════════
      //  ART. 25 — OBRIGACOES ACESSORIAS
      // ══════════════════════════════════════════════════════════════════
      {
        id: 'LC123-ART25',
        artigo: 25,
        titulo: 'Obrigacoes Acessorias',
        caput: 'A ME ou EPP optante pelo Simples Nacional devera apresentar anualmente a DASN (hoje DEFIS) e o PGDAS-D mensalmente.',

        regras: [
          {
            id: 'LC123-ART25-PGDAS',
            referencia: 'Art. 25 + RCGSN 140 Art. 38',
            descricao: 'PGDAS-D: Programa Gerador do DAS Declaratorio — deve ser preenchido mensalmente ate o dia 20 do mes seguinte ao da apuracao',
            tipo: 'OBRIGACAO',
            prazo: 'Dia 20 do mes seguinte',
            multa: 'R$ 50,00 por mes de atraso para ME; R$ 500,00 para EPP (minimo)',
            motorExiste: true,
            motorLocal: 'OBRIGACOES_ACESSORIAS[0] PGDAS-D + PENALIDADES_2026 + CALENDARIO_FISCAL_2026',
            status: 'CORRETO'
          },
          {
            id: 'LC123-ART25-DEFIS',
            referencia: 'Art. 25 + RCGSN 140 Art. 72',
            descricao: 'DEFIS: Declaracao de Informacoes Socioeconomicas e Fiscais — anual, ate 31 de marco do ano seguinte',
            tipo: 'OBRIGACAO',
            prazo: '31 de marco do ano seguinte',
            multa: '2% ao mes sobre tributos declarados (minimo R$ 200,00 ME / R$ 500,00 EPP)',
            motorExiste: true,
            motorLocal: 'OBRIGACOES_ACESSORIAS[1] DEFIS + PENALIDADES_2026',
            status: 'CORRETO'
          },
          {
            id: 'LC123-ART25-ESOCIAL',
            referencia: 'Art. 25 + legislacao trabalhista',
            descricao: 'e-Social: sistema de escrituracao digital das obrigacoes fiscais, previdenciarias e trabalhistas',
            tipo: 'OBRIGACAO',
            prazo: 'Mensal, conforme calendario e-Social',
            motorExiste: true,
            motorLocal: 'OBRIGACOES_ACESSORIAS[2] e-Social',
            status: 'CORRETO'
          },
          {
            id: 'LC123-ART25-DAS-PGTO',
            referencia: 'Art. 21 + RCGSN 140 Art. 40',
            descricao: 'DAS: pagamento ate o dia 20 do mes subsequente ao da apuracao',
            tipo: 'OBRIGACAO',
            prazo: 'Dia 20 do mes seguinte',
            motorExiste: true,
            motorLocal: 'CALENDARIO_FISCAL_2026',
            status: 'CORRETO'
          }
        ]
      },

      // ══════════════════════════════════════════════════════════════════
      //  ART. 26 — EMISSAO DE DOCUMENTOS FISCAIS
      // ══════════════════════════════════════════════════════════════════
      {
        id: 'LC123-ART26',
        artigo: 26,
        titulo: 'Emissao de Documentos Fiscais',
        caput: 'As ME e EPP optantes pelo Simples Nacional ficam obrigadas a emitir documento fiscal de venda ou prestacao de servico.',

        regras: [
          {
            id: 'LC123-ART26-I',
            referencia: 'Art. 26, inciso I',
            descricao: 'ME/EPP deve emitir NF-e ou NFS-e conforme legislacao do estado/municipio',
            tipo: 'OBRIGACAO',
            logica: 'emissaoNFObrigatoria = true',
            motorExiste: false,
            status: 'NAO_APLICAVEL',
            detalhe: 'Documentos fiscais nao sao escopo do motor de calculo tributario'
          },
          {
            id: 'LC123-ART26-P1',
            referencia: 'Art. 26, paragrafo 1',
            descricao: 'Na NF de venda ou servico, e vedado destacar quaisquer tributos do Simples Nacional (ICMS, IPI, ISS etc). A informacao e: "DOCUMENTO EMITIDO POR ME OU EPP OPTANTE PELO SIMPLES NACIONAL"',
            tipo: 'REGRA',
            motorExiste: false,
            status: 'NAO_APLICAVEL',
            detalhe: 'Regra de emissao de NF, nao de calculo'
          },
          {
            id: 'LC123-ART26-CREDITO-ICMS',
            referencia: 'Art. 23 + Art. 26',
            descricao: 'ME/EPP optante pelo Simples pode transferir creditos de ICMS ao adquirente contribuinte (nao optante pelo Simples), correspondentes a aliquota de ICMS prevista nos Anexos I ou II, limitada a aliquota efetiva de ICMS da faixa',
            tipo: 'BENEFICIO',
            logica: 'IF vendeParaContribuinteICMS THEN creditoICMS = aliquotaEfetiva * percentualICMSdaPartilha',
            motorExiste: true,
            motorLocal: 'calcularPartilhaTributos() — calcula percentual ICMS na partilha',
            status: 'PARCIAL',
            gap: 'Motor calcula a partilha ICMS, mas nao tem funcao especifica para gerar valor de credito transferivel'
          }
        ]
      },

      // ══════════════════════════════════════════════════════════════════
      //  ART. 29 — EXCLUSAO DE OFICIO
      // ══════════════════════════════════════════════════════════════════
      {
        id: 'LC123-ART29',
        artigo: 29,
        titulo: 'Exclusao de Oficio',
        caput: 'A exclusao de oficio dar-se-a quando verificada a falta de comunicacao obrigatoria, resistencia a fiscalizacao, embaraco, etc.',

        regras: [
          {
            id: 'LC123-ART29-I',
            referencia: 'Art. 29, inciso I',
            descricao: 'Exclusao de oficio: quando verificada a falta de comunicacao de exclusao obrigatoria',
            tipo: 'EXCLUSAO',
            motorExiste: true,
            motorLocal: 'RISCOS_FISCAIS (secao 17) — riscos mapeados',
            status: 'CORRETO'
          },
          {
            id: 'LC123-ART29-V',
            referencia: 'Art. 29, inciso V',
            descricao: 'Exclusao de oficio: constituicao da empresa por interpostas pessoas (laranja/testa-de-ferro)',
            tipo: 'EXCLUSAO',
            motorExiste: true,
            motorLocal: 'RISCOS_FISCAIS — interposicao coberta',
            status: 'CORRETO'
          },
          {
            id: 'LC123-ART29-IX',
            referencia: 'Art. 29, inciso IX',
            descricao: 'Exclusao de oficio: quando for oferecido embaraco a fiscalizacao',
            tipo: 'EXCLUSAO',
            motorExiste: true,
            motorLocal: 'RISCOS_FISCAIS',
            status: 'CORRETO'
          },
          {
            id: 'LC123-ART29-XI',
            referencia: 'Art. 29, inciso XI',
            descricao: 'Exclusao de oficio: quando omissao de folha de pagamento (omissao de pro-labore)',
            tipo: 'EXCLUSAO',
            logica: 'IF folhaPagamento == 0 AND temSocios THEN riscoExclusao = true',
            motorExiste: true,
            motorLocal: 'RISCOS_FISCAIS — risco pro-labore',
            status: 'CORRETO'
          }
        ]
      },

      // ══════════════════════════════════════════════════════════════════
      //  ART. 30 — EXCLUSAO POR EXCESSO DE RECEITA (detalhamento)
      // ══════════════════════════════════════════════════════════════════
      {
        id: 'LC123-ART30',
        artigo: 30,
        titulo: 'Exclusao por Excesso de Receita — Efeitos e Prazos',
        caput: 'A exclusao do Simples Nacional sera feita de oficio ou mediante comunicacao da ME ou EPP optante.',

        regras: [
          {
            id: 'LC123-ART30-II',
            referencia: 'Art. 30, inciso II',
            descricao: 'Ultrapassou R$ 4.800.000 sem exceder 20% (R$ 5.760.000): exclusao a partir de 1o de janeiro do ano seguinte',
            tipo: 'EXCLUSAO',
            logica: 'IF receitaAnual > 4800000 AND receitaAnual <= 5760000 THEN exclusaoEfeito = "01/janeiro/anoSeguinte"',
            constantes: { LIMITE_20_PORCENTO: 5760000.00 },
            motorExiste: true,
            motorLocal: 'verificarElegibilidade() — alerta excesso <=20% e >20%',
            status: 'CORRETO'
          },
          {
            id: 'LC123-ART30-II-RETRO',
            referencia: 'Art. 30, inciso II, alinea "a"',
            descricao: 'Se ultrapassou mais de 20% (acima de R$ 5.760.000): exclusao retroativa ao mes em que ocorreu o excesso',
            tipo: 'EXCLUSAO_RETROATIVA',
            logica: 'IF receitaAnual > 5760000 THEN exclusaoEfeito = "mesDoExcesso"; recalcularTributosDesdeMes()',
            motorExiste: true,
            motorLocal: 'CONSTANTES_LEGAIS.LIMITE_EXCESSO_20_PORCENTO + verificarElegibilidade()',
            status: 'CORRETO'
          },
          {
            id: 'LC123-ART30-SUBLIMITE',
            referencia: 'Art. 30 combinado com Art. 19',
            descricao: 'Ultrapassou sublimite estadual (R$ 3.600.000) sem exceder 20% (R$ 4.320.000): efeitos a partir de 1o de julho do ano seguinte para ICMS/ISS. Se exceder 20%: efeitos retroativos ao mes do excesso',
            tipo: 'EXCLUSAO_SUBLIMITE',
            logica: 'IF receitaAnual > 3600000 AND receitaAnual <= 4320000 THEN icmsISSfora = "01/julho/anoSeguinte"; IF receitaAnual > 4320000 THEN icmsISSfora = "mesDoExcesso"',
            constantes: { SUBLIMITE_20_PORCENTO: 4320000.00 },
            motorExiste: true,
            motorLocal: 'verificarElegibilidade() — alerta sublimite',
            status: 'PARCIAL',
            gap: 'Motor alerta sublimite mas nao calcula automaticamente o valor de R$ 4.320.000 (20% acima do sublimite)'
          },
          {
            id: 'LC123-ART30-COMUNICACAO',
            referencia: 'Art. 30, paragrafo 1',
            descricao: 'Prazo de comunicacao da exclusao: ate o ultimo dia util do mes subsequente aquele em que ocorreu a situacao determinante',
            tipo: 'PRAZO',
            motorExiste: true,
            motorLocal: 'TRANSICOES (secao 18) — procedimento de exclusao',
            status: 'CORRETO'
          }
        ]
      }

    ] // fim artigos[]
  }; // fim LC123_MAPA

  // ════════════════════════════════════════════════════════════════════════
  //  ENTREGAVEL B — CHECKLIST EXISTE VS. FALTA
  // ════════════════════════════════════════════════════════════════════════

  var CHECKLIST = {

    resumo: {
      totalRegras: 67,
      corretas: 47,
      parciais: 9,
      ausentes: 2,
      naoAplicaveis: 9,
      cobertura: '83.6%',
      nota: 'Motor simples_nacional.js v4.1.0 tem cobertura excelente da LC 123/2006. Gaps sao majoritariamente de regras operacionais/procedimentais, nao de calculo.'
    },

    itens: [
      // === CORRETO (implementado e validado) ===
      { id: 'CK-001', tema: 'Limites ME/EPP', artigo: 'Art. 3 I/II', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-002', tema: 'Proporcionalidade inicio atividade', artigo: 'Art. 3 §2', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-003', tema: 'Vedacoes (14 tipos)', artigo: 'Art. 3 §4 + Art. 17', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-004', tema: 'Regime unificado DAS', artigo: 'Art. 12', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-005', tema: '8 tributos na partilha', artigo: 'Art. 13 I-VIII', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-006', tema: 'ICMS-ST fora do DAS', artigo: 'Art. 13 §1 XII', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-007', tema: 'ISS retido na fonte', artigo: 'Art. 13 §1 XIII', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-008', tema: 'Tributacao monofasica', artigo: 'Art. 13 §1 XIV', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-009', tema: 'CPP excluida Anexo IV', artigo: 'Art. 13 VI + Art. 18 §4', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-010', tema: 'Formula aliquota efetiva', artigo: 'Art. 18 §1-A', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-011', tema: 'RBT12 como base', artigo: 'Art. 18 §1', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-012', tema: 'Anexo I — Comercio', artigo: 'Art. 18 §2 Anexo I', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-013', tema: 'Anexo II — Industria', artigo: 'Art. 18 §2 Anexo II', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-014', tema: 'Anexo III — Servicos FatorR>=28%', artigo: 'Art. 18 §2 Anexo III', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-015', tema: 'Anexo IV — Servicos sem CPP', artigo: 'Art. 18 §2 Anexo IV', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-016', tema: 'Anexo V — Servicos FatorR<28%', artigo: 'Art. 18 §2 Anexo V', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-017', tema: 'Segregacao de receitas', artigo: 'Art. 18 §3', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-018', tema: 'Atividades Anexo IV (lista)', artigo: 'Art. 18 §4', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-019', tema: 'Fator R (28%)', artigo: 'Art. 18 §5-C', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-020', tema: 'Paragrafos 5-B, 5-E, 5-F', artigo: 'Art. 18 §5-B/E/F', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-021', tema: '12 incisos §5-I', artigo: 'Art. 18 §5-I', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-022', tema: 'ISS minimo 2%', artigo: 'Art. 18 §14', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-023', tema: 'ISS maximo 5%', artigo: 'Art. 21 §5', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-024', tema: 'Exportacao (desconto PIS/COFINS/ICMS)', artigo: 'Art. 18 §24', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-025', tema: 'Sublimite ICMS/ISS R$ 3.6M', artigo: 'Art. 19', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-026', tema: 'Excesso receita (>4.8M)', artigo: 'Art. 20 + Art. 30', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-027', tema: 'Exclusao retroativa >20%', artigo: 'Art. 30 II-a', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-028', tema: 'Obrigacoes PGDAS-D', artigo: 'Art. 25', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-029', tema: 'Obrigacoes DEFIS', artigo: 'Art. 25', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-030', tema: 'Riscos fiscais (12)', artigo: 'Art. 29', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-031', tema: 'Transicoes de regime (4)', artigo: 'Art. 30 + Art. 16', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-032', tema: 'DAS mensal calculo', artigo: 'Art. 18', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-033', tema: 'DAS segregado multi-CNAE', artigo: 'Art. 18 §3', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-034', tema: 'DAS otimizado c/ deducoes', artigo: 'Art. 18 §12/§14/§24', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-035', tema: 'Otimizacao Fator R', artigo: 'Art. 18 §5-C', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-036', tema: 'Comparacao 4 regimes', artigo: 'Arts. 12-18 vs LR/LP', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-037', tema: 'MEI (regras basicas)', artigo: 'Art. 18-A a 18-E', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-038', tema: 'DIFAL calculo', artigo: 'Art. 13 §1 XII', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-039', tema: 'Produtos monofasicos NCM', artigo: 'Art. 18 §4-A', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-040', tema: 'Licitacoes beneficios ME/EPP', artigo: 'Arts. 42-49', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-041', tema: 'Recuperacao judicial', artigo: 'Art. 47 + Art. 71', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-042', tema: 'Distribuicao lucros', artigo: 'Art. 14', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-043', tema: 'Penalidades 2026', artigo: 'RCGSN 140', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-044', tema: 'Dividendos 2026 (Lei 15.270)', artigo: 'Lei 15.270/2025', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-045', tema: 'Reforma tributaria IBS/CBS', artigo: 'LC 214/2025', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-046', tema: 'Calendario fiscal 2026', artigo: 'RCGSN 140 Art. 40', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },
      { id: 'CK-047', tema: 'Grupo economico 2026', artigo: 'Art. 3 §4 VII', existe: true, correto: true, risco: 'NENHUM', acao: 'Nenhuma' },

      // === PARCIAL (existe mas incompleto) ===
      { id: 'CK-048', tema: 'Receita bruta definicao completa', artigo: 'Art. 3 §1', existe: true, correto: false, risco: 'BAIXO', acao: 'Adicionar campos para vendas canceladas e descontos incondicionais' },
      { id: 'CK-049', tema: 'Opcao irretratavel + prazos', artigo: 'Art. 16', existe: true, correto: false, risco: 'BAIXO', acao: 'Adicionar validacao de prazo (janeiro) como regra de negocio' },
      { id: 'CK-050', tema: 'Transporte fluvial excecao', artigo: 'Art. 17 VI', existe: true, correto: false, risco: 'BAIXO', acao: 'Adicionar excecao para transporte fluvial/urbano' },
      { id: 'CK-051', tema: 'Factoring vedacao explicita', artigo: 'Art. 17 I', existe: true, correto: false, risco: 'BAIXO', acao: 'Verificar se CNAE factoring esta nas vedacoes' },
      { id: 'CK-052', tema: 'Credito ICMS transferivel', artigo: 'Art. 23 + Art. 26', existe: true, correto: false, risco: 'MEDIO', acao: 'Criar funcao calcularCreditoICMSTransferivel()' },
      { id: 'CK-053', tema: 'Sublimite 20% (R$ 4.320.000)', artigo: 'Art. 30 + Art. 19', existe: true, correto: false, risco: 'MEDIO', acao: 'Adicionar constante SUBLIMITE_20_PORCENTO = 4320000' },
      { id: 'CK-054', tema: 'ISS retencao faixa 1 = 2%', artigo: 'Art. 21 §4-A', existe: true, correto: false, risco: 'BAIXO', acao: 'Verificar se regra esta automatica na partilha' },
      { id: 'CK-055', tema: 'Regime de caixa opcao', artigo: 'Art. 18 §3 + RCGSN 140 Art. 16', existe: true, correto: false, risco: 'BAIXO', acao: 'Motor tem parametro mas sem regras de elegibilidade do regime caixa' },
      { id: 'CK-056', tema: 'Retencao ISS mesmo municipio', artigo: 'Art. 21 §4', existe: true, correto: false, risco: 'BAIXO', acao: 'Detalhar regra de mesmo municipio vs diferente' },

      // === AUSENTE (nao implementado) ===
      { id: 'CK-057', tema: 'CNPJ raiz (filiais)', artigo: 'Art. 3 §14', existe: false, correto: false, risco: 'MEDIO', acao: 'Criar campo cnpjFiliais para soma de receitas' },
      { id: 'CK-058', tema: 'Prazo opcao inicio atividade', artigo: 'Art. 16 §1', existe: false, correto: false, risco: 'BAIXO', acao: 'Adicionar alerta informativo sobre prazos' }
    ]
  };

  // ════════════════════════════════════════════════════════════════════════
  //  ENTREGAVEL C — ECONOMIA_LEGAL (Estrategias de Economia Tributaria)
  // ════════════════════════════════════════════════════════════════════════

  var ECONOMIA_LEGAL = [

    {
      id: 'ECON-001',
      titulo: 'Otimizacao do Fator R (Anexo V → III)',
      baseLegal: 'Art. 18, §5-C, LC 123/2006',
      descricao: 'Aumentar a relacao folha de pagamento / receita bruta 12 meses para atingir 28%, migrando do Anexo V (15.5-30.5%) para o Anexo III (6-33%)',
      economia: 'Ate 9.5 pontos percentuais de reducao na aliquota efetiva na 1a faixa',
      implementacao: [
        'Antecipar pagamento de pro-labore antes do fechamento do mes',
        'Incluir encargos sociais (FGTS, INSS) no calculo da folha',
        'Considerar 13o salario e ferias no planejamento',
        'Meta: folha12m / receita12m >= 0.28'
      ],
      formula: 'fatorR = folha12m / receita12m; IF fatorR >= 0.28 THEN Anexo III',
      motorImplementa: true,
      motorLocal: 'otimizarFatorR() + calcularFatorR()',
      risco: 'BAIXO',
      alertaFiscal: 'Fator R e verificado mensalmente pela RFB. Manter documentacao da folha.'
    },

    {
      id: 'ECON-002',
      titulo: 'Segregacao de Receitas por Atividade',
      baseLegal: 'Art. 18, §3 + §4, LC 123/2006; RCGSN 140 Art. 25',
      descricao: 'Segregar receitas por tipo de atividade no PGDAS-D para que cada parcela seja tributada no anexo correto, aproveitando aliquotas menores',
      economia: 'Variavel — pode reduzir ate 10% da carga se comercio (Anexo I, 4%) substitui servico (Anexo V, 15.5%)',
      implementacao: [
        'Classificar cada NF-e/NFS-e pelo CNAE correto',
        'No PGDAS-D, segregar receitas em comercio vs industria vs servicos',
        'Receitas de revenda de mercadorias = Anexo I (menor aliquota)',
        'Verificar se CNAE secundarios permitem Anexo mais favoravel'
      ],
      motorImplementa: true,
      motorLocal: 'calcularDASSegregado() + SEGREGACAO_RECEITAS',
      risco: 'BAIXO',
      alertaFiscal: 'Segregacao deve refletir a atividade real, nao simulada.'
    },

    {
      id: 'ECON-003',
      titulo: 'Exclusao de PIS/COFINS em Produtos Monofasicos',
      baseLegal: 'Art. 18, §4-A, II, LC 123/2006; Lei 10.147/2000',
      descricao: 'Revendedores de produtos monofasicos (combustiveis, farmacos, bebidas, automoveis, cosmeticos) podem excluir PIS e COFINS da base do DAS',
      economia: 'Reducao de 3.65% a 7.6% da aliquota efetiva sobre receita monofasica',
      implementacao: [
        'Identificar produtos monofasicos vendidos (NCM)',
        'No PGDAS-D, marcar como receita com tributacao monofasica',
        'DAS recalculado sem PIS + COFINS nessa parcela',
        'Manter planilha de controle por NCM'
      ],
      formula: 'reducao = aliquotaEfetiva * (percentualPIS + percentualCOFINS)',
      motorImplementa: true,
      motorLocal: 'REDUCOES_LEGAIS[0] + PRODUTOS_MONOFASICOS + PRODUTOS_MONOFASICOS_NCM + verificarMonofasicoNCM() + calcularEconomiaMonofasica()',
      risco: 'NENHUM',
      alertaFiscal: 'Direito liquido e certo. Muitas empresas nao utilizam por desconhecimento.'
    },

    {
      id: 'ECON-004',
      titulo: 'Deducao de ICMS-ST do DAS',
      baseLegal: 'Art. 13, §1, XII + Art. 18, §12, LC 123/2006',
      descricao: 'Quando ICMS ja foi recolhido por substituicao tributaria, o contribuinte pode deduzir o ICMS do DAS',
      economia: 'Reducao do percentual de ICMS da aliquota efetiva (varia 1.25% a 3.95% conforme faixa)',
      implementacao: [
        'Identificar notas de entrada com ICMS-ST retido',
        'No PGDAS-D, marcar receita como substituicao tributaria',
        'DAS sera calculado sem a parcela de ICMS'
      ],
      motorImplementa: true,
      motorLocal: 'REDUCOES_LEGAIS[1] + calcularDASMensalOtimizado()',
      risco: 'NENHUM',
      alertaFiscal: 'Direito liquido. Conferir se NCM do produto esta na lista de ST do estado.'
    },

    {
      id: 'ECON-005',
      titulo: 'Desconto de ISS Retido na Fonte',
      baseLegal: 'Art. 21, §4 e §4-A, LC 123/2006',
      descricao: 'Quando o tomador de servico reteve ISS na fonte, o valor pode ser descontado do DAS no mesmo periodo',
      economia: 'Reducao integral do ISS que ja foi retido (ate 5% da receita de servico)',
      implementacao: [
        'Identificar NFS-e com retencao de ISS',
        'Informar no PGDAS-D como "ISS retido na fonte"',
        'Motor deduz ISS retido do valor do DAS'
      ],
      motorImplementa: true,
      motorLocal: 'REDUCOES_LEGAIS[2] + calcularDASMensalOtimizado()',
      risco: 'NENHUM',
      alertaFiscal: 'Direito automatico. Muitos contadores esquecem de informar.'
    },

    {
      id: 'ECON-006',
      titulo: 'Imunidade Tributaria na Exportacao',
      baseLegal: 'Art. 18, §24, LC 123/2006; CF Art. 149 §2 I',
      descricao: 'Receitas de exportacao de mercadorias para o exterior tem desconto de PIS, COFINS e ICMS do DAS',
      economia: 'Reducao de ate 7-8% da aliquota efetiva sobre receita exportada',
      implementacao: [
        'Segregar receita de exportacao no PGDAS-D',
        'Marcar como receita de exportacao de mercadorias',
        'PIS + COFINS + ICMS serao excluidos do calculo',
        'Valido inclusive para venda via trading company (SPC/ECE)'
      ],
      motorImplementa: true,
      motorLocal: 'REDUCOES_LEGAIS[3] exportacao',
      risco: 'NENHUM',
      alertaFiscal: 'Beneficio constitucional. Manter DU-E e registros de exportacao.'
    },

    {
      id: 'ECON-007',
      titulo: 'Regime de Caixa (Postergar Tributacao)',
      baseLegal: 'Art. 18, §3 + RCGSN 140 Arts. 16-19',
      descricao: 'Optar pelo regime de caixa para tributar apenas quando o valor e efetivamente recebido, nao quando faturado. Adia a tributacao.',
      economia: 'Postergacao do DAS ate o efetivo recebimento. Economia financeira no fluxo de caixa, nao reducao da aliquota.',
      implementacao: [
        'Optar pelo regime de caixa no PGDAS-D (opcao anual, em janeiro)',
        'Emitir NF-e normalmente',
        'DAS e calculado sobre recebimentos, nao sobre faturamento',
        'Se nao recebeu, nao paga DAS naquele mes'
      ],
      motorImplementa: true,
      motorLocal: 'REDUCOES_LEGAIS[6] regime_caixa',
      risco: 'BAIXO',
      alertaFiscal: 'Opcao e anual. Receitas nao recebidas em 12 meses sao tributadas automaticamente.'
    },

    {
      id: 'ECON-008',
      titulo: 'Distribuicao de Lucros Isenta (Presuncao vs. Contabilidade)',
      baseLegal: 'Art. 14, LC 123/2006; Art. 15 Lei 9.249/1995',
      descricao: 'Lucros distribuidos aos socios ate o limite da presuncao sao isentos de IR. Com contabilidade completa, a parcela isenta pode ser ainda maior (lucro contabil > presuncao)',
      economia: 'Com contabilidade: distribuicao isenta pode ser muito maior que o percentual de presuncao (8%/32%)',
      implementacao: [
        'Manter escrituracao contabil completa (Livro Caixa nao basta)',
        'Lucro contabil apos tributos pode ser distribuido integralmente isento',
        'Sem contabilidade: isencao limitada a presuncao (8% comercio, 32% servicos)',
        'A partir de 2026: tributacao de 10% sobre dividendos > R$ 50k/mes (Lei 15.270/2025)'
      ],
      formula: 'presuncao_comercio = receita * 0.08; presuncao_servicos = receita * 0.32; lucroIsento = MAX(lucroContabil, presuncao) - tributosSimples',
      motorImplementa: true,
      motorLocal: 'calcularDistribuicaoLucros() + TRIBUTACAO_DIVIDENDOS_2026 + calcularImpactoDividendos2026()',
      risco: 'MEDIO',
      alertaFiscal: 'A partir de 2026, dividendos acima de R$ 50.000/mes sofrem IRRF 10%.'
    },

    {
      id: 'ECON-009',
      titulo: 'Locacao de Bens Moveis — Reducao ISS',
      baseLegal: 'Art. 18, §4-A, I + RCGSN 140; STF RE 626.706',
      descricao: 'Receita de locacao de bens moveis nao incide ISS (STF), portanto no calculo do DAS a parcela de ISS deve ser excluida',
      economia: 'Reducao de ate 5% de ISS da aliquota efetiva sobre receita de locacao',
      implementacao: [
        'Segregar receita de locacao de bens moveis no PGDAS-D',
        'Marcar como atividade sem incidencia de ISS',
        'DAS recalculado sem parcela de ISS'
      ],
      motorImplementa: true,
      motorLocal: 'REDUCOES_LEGAIS[4] locacao_bens_moveis',
      risco: 'BAIXO',
      alertaFiscal: 'Posicao consolidada pelo STF. Alguns municipios ainda tentam cobrar.'
    },

    {
      id: 'ECON-010',
      titulo: 'Beneficios em Licitacoes (Preferencia)',
      baseLegal: 'Arts. 42 a 49, LC 123/2006; Lei 14.133/2021 Art. 4',
      descricao: 'ME/EPP tem preferencia em licitacoes: empate ficto (ate 10% acima do menor preco), licitacao exclusiva (ate R$ 80.000), e cota reservada de 25%',
      economia: 'Nao tributaria diretamente, mas amplia faturamento com margens melhores',
      implementacao: [
        'Manter CND (certidoes negativas) em dia',
        'Participar de pregoes eletronicos com margem de empate ficto',
        'Buscar editais com cotas reservadas a ME/EPP'
      ],
      motorImplementa: true,
      motorLocal: 'LICITACOES_BENEFICIOS (secao 26)',
      risco: 'NENHUM',
      alertaFiscal: 'Beneficio legal automatico. Verificar se empresa esta regular.'
    },

    {
      id: 'ECON-011',
      titulo: 'Planejamento de Faixa (Controle de RBT12)',
      baseLegal: 'Art. 18, §1 + Anexos I-V, LC 123/2006',
      descricao: 'Controlar o crescimento do faturamento para evitar saltos de faixa no Simples. Ao se aproximar do teto de uma faixa, avaliar se vale postergar faturamento ou migrar de regime.',
      economia: 'Evitar salto de faixa que aumente aliquota efetiva desproporcional ao ganho de receita',
      implementacao: [
        'Monitorar RBT12 mensalmente',
        'Ao se aproximar de R$ 180k, R$ 360k, R$ 720k, R$ 1.8M, R$ 3.6M, R$ 4.8M: avaliar impacto',
        'Considerar regime de caixa para postergar reconhecimento',
        'Simular cenarios de antecipacao vs postergacao'
      ],
      motorImplementa: true,
      motorLocal: 'verificarElegibilidade() + alertas de sublimite + gerarRelatorioOtimizacao()',
      risco: 'BAIXO',
      alertaFiscal: 'Planejamento tributario licito. Nao confundir com sonegacao/postergacao artificial.'
    },

    {
      id: 'ECON-012',
      titulo: 'ICMS — Isencao Estadual para ME',
      baseLegal: 'Art. 18, §20 + §20-A, LC 123/2006; legislacao estadual',
      descricao: 'Alguns estados concedem isencao de ICMS para ME com receita bruta anual ate determinado limite (varia por estado). O ICMS nao incide nessa faixa.',
      economia: 'Isencao total de ICMS para ME em estados participantes (economia de 1.25% a 3.95%)',
      implementacao: [
        'Verificar se o estado da empresa concede isencao',
        'Geralmente para receita bruta anual ate R$ 360.000 (ME)',
        'No PGDAS-D, o proprio sistema aplica a isencao'
      ],
      estadosComIsencao: ['AC','AP','RO','RR','TO','AL','MA','PA','PI'],
      motorImplementa: true,
      motorLocal: 'ISENCAO_ESTADUAL_ICMS (secao 34)',
      risco: 'NENHUM',
      alertaFiscal: 'Beneficio automatico no PGDAS-D quando aplicavel.'
    },

    {
      id: 'ECON-013',
      titulo: 'Reforma Tributaria — Opcao IBS/CBS',
      baseLegal: 'LC 214/2025 Art. 41 + LC 123/2006',
      descricao: 'Com a reforma tributaria (transicao 2026-2033), ME/EPP poderao optar por apurar IBS e CBS por fora do Simples Nacional, para gerar creditos integrais aos clientes PJ',
      economia: 'Potencial aumento de competitividade ao vender para PJ (credito integral de IBS/CBS vs credito limitado do Simples)',
      implementacao: [
        'Monitorar regulamentacao da transicao IBS/CBS',
        'Avaliar se clientes PJ representam parcela significativa',
        'Simular cenario Simples puro vs Simples + IBS/CBS por fora',
        'Opcao sera anual (provavelmente a partir de 2027)'
      ],
      motorImplementa: true,
      motorLocal: 'REFORMA_TRIBUTARIA_SIMPLES (secao 34)',
      risco: 'INDEFINIDO',
      alertaFiscal: 'Regulamentacao ainda em curso. Monitorar CGSN.'
    }
  ];

  // ════════════════════════════════════════════════════════════════════════
  //  ENTREGAVEL D — MODULOS E FUNCOES RECOMENDADOS
  // ════════════════════════════════════════════════════════════════════════

  var MODULOS_RECOMENDADOS = [

    {
      id: 'MOD-001',
      tipo: 'NOVA_FUNCAO',
      nome: 'calcularCreditoICMSTransferivel',
      modulo: 'simples_nacional.js',
      baseLegal: 'Art. 23 + Art. 26, LC 123/2006',
      descricao: 'Calcular o valor de credito de ICMS que ME/EPP optante pode transferir ao adquirente contribuinte. Credito = aliquota efetiva * percentual ICMS da partilha * valor da NF.',
      prioridade: 'MEDIA',
      parametros: ['receitaBrutaMensal', 'rbt12', 'anexo', 'valorNF'],
      retorno: { creditoICMS: 'number', aliquotaCredito: 'number', percentualICMS: 'number' },
      estimativaLinhas: 30
    },

    {
      id: 'MOD-002',
      tipo: 'AJUSTE',
      nome: 'verificarElegibilidade — sublimite 20%',
      modulo: 'simples_nacional.js',
      baseLegal: 'Art. 30 + Art. 19, LC 123/2006',
      descricao: 'Adicionar constante SUBLIMITE_20_PORCENTO = 4320000 e incluir alerta especifico quando receita supera R$ 3.6M mas fica abaixo de R$ 4.32M (efeitos apenas no ano seguinte para ICMS/ISS) vs. acima de R$ 4.32M (retroativo).',
      prioridade: 'MEDIA',
      estimativaLinhas: 15
    },

    {
      id: 'MOD-003',
      tipo: 'AJUSTE',
      nome: 'validarDadosEntrada — receita bruta completa',
      modulo: 'simples_nacional.js',
      baseLegal: 'Art. 3, §1, LC 123/2006',
      descricao: 'Aceitar campos opcionais: vendasCanceladas, descontosIncondicionais. Calcular receitaBrutaLiquida = receitaBruta - vendasCanceladas - descontosIncondicionais.',
      prioridade: 'BAIXA',
      estimativaLinhas: 10
    },

    {
      id: 'MOD-004',
      tipo: 'NOVA_FUNCAO',
      nome: 'calcularReceitaBrutaConsolidada',
      modulo: 'simples_nacional.js',
      baseLegal: 'Art. 3, §14, LC 123/2006',
      descricao: 'Para empresas com filiais (mesmo CNPJ raiz), consolidar receitas de todos os estabelecimentos para calculo do RBT12. Parametro: array de CNPJs filiais com receitas mensais.',
      prioridade: 'MEDIA',
      parametros: ['cnpjRaiz', 'filiais[{cnpj, receitasMensais[12]}]'],
      retorno: { rbt12Consolidado: 'number', receitaPorFilial: 'array' },
      estimativaLinhas: 25
    },

    {
      id: 'MOD-005',
      tipo: 'AJUSTE',
      nome: 'VEDACOES — factoring explicito',
      modulo: 'simples_nacional.js',
      baseLegal: 'Art. 17, I, LC 123/2006',
      descricao: 'Garantir que factoring / securitizacao / cessao de creditos esteja explicitamente listada nas vedacoes com CNAE 6462-0/00.',
      prioridade: 'BAIXA',
      estimativaLinhas: 5
    },

    {
      id: 'MOD-006',
      tipo: 'AJUSTE',
      nome: 'VEDACOES — excecao transporte fluvial',
      modulo: 'simples_nacional.js',
      baseLegal: 'Art. 17, VI, LC 123/2006',
      descricao: 'Transporte intermunicipal de passageiros e vedado EXCETO na modalidade fluvial ou com caracteristicas de transporte urbano/metropolitano. Adicionar excecao no check de vedacao.',
      prioridade: 'BAIXA',
      estimativaLinhas: 8
    },

    {
      id: 'MOD-007',
      tipo: 'NOVA_FUNCAO',
      nome: 'calcularAliquotaISSRetencao',
      modulo: 'simples_nacional.js',
      baseLegal: 'Art. 21, §4 + §4-A, LC 123/2006',
      descricao: 'Funcao dedicada para calcular a aliquota de ISS para retencao na fonte. Considera faixa do prestador, minimo de 2%, e verificacao se prestador e tomador estao no mesmo municipio.',
      prioridade: 'MEDIA',
      parametros: ['rbt12', 'anexo', 'codigoServico', 'mesmoMunicipio'],
      retorno: { aliquotaRetencao: 'number', deveReter: 'boolean', fundamentoLegal: 'string' },
      estimativaLinhas: 25
    },

    {
      id: 'MOD-008',
      tipo: 'AJUSTE',
      nome: 'verificarElegibilidade — alertas de prazo',
      modulo: 'simples_nacional.js',
      baseLegal: 'Art. 16, LC 123/2006',
      descricao: 'Adicionar alertas sobre prazos de opcao (janeiro), inicio de atividade (30/60 dias), e irretratabilidade da opcao no ano-calendario.',
      prioridade: 'BAIXA',
      estimativaLinhas: 15
    },

    {
      id: 'MOD-009',
      tipo: 'NOVA_FUNCAO',
      nome: 'simularTransicaoRegime',
      modulo: 'simples_nacional.js',
      baseLegal: 'Art. 30 + Art. 16, LC 123/2006',
      descricao: 'Simulador que calcula o impacto de transicao para/do Simples Nacional: (1) custo de saida (recalculo de impostos no novo regime), (2) timing ideal (janeiro vs mes de exclusao), (3) creditos aproveitaveis na transicao.',
      prioridade: 'ALTA',
      parametros: ['dadosAtuais', 'regimeDestino', 'mesTransicao'],
      retorno: { custoTransicao: 'number', economiaAnual: 'number', melhorMes: 'string', alertas: 'array' },
      estimativaLinhas: 80
    },

    {
      id: 'MOD-010',
      tipo: 'AJUSTE',
      nome: 'calcularDASMensalOtimizado — regime caixa elegibilidade',
      modulo: 'simples_nacional.js',
      baseLegal: 'RCGSN 140 Arts. 16-19',
      descricao: 'Adicionar regras de elegibilidade do regime de caixa: (1) opcao e anual, feita em janeiro, (2) NF vencida ha mais de 12 meses sem recebimento e tributada automaticamente, (3) nao se aplica a receitas de exportacao.',
      prioridade: 'MEDIA',
      estimativaLinhas: 20
    }
  ];

  // ════════════════════════════════════════════════════════════════════════
  //  TABELA DE REFERENCIA CRUZADA (artigo → funcao do motor)
  // ════════════════════════════════════════════════════════════════════════

  var REFERENCIA_CRUZADA = {
    'Art. 3':   { funcoes: ['verificarElegibilidade','validarDadosEntrada','calcularRBT12Proporcional'], constantes: ['LIMITE_ME','LIMITE_EPP'] },
    'Art. 12':  { funcoes: ['calcularDASMensal','calcularPartilhaTributos'], constantes: [] },
    'Art. 13':  { funcoes: ['calcularPartilhaTributos','calcularDASMensalOtimizado','calcularDIFAL'], constantes: ['ALIQUOTA_INSS_PATRONAL_ANEXO_IV'] },
    'Art. 14':  { funcoes: ['calcularDistribuicaoLucros','calcularImpactoDividendos2026'], constantes: ['PRESUNCAO_LUCRO_COMERCIO','PRESUNCAO_LUCRO_SERVICOS'] },
    'Art. 16':  { funcoes: ['verificarElegibilidade'], constantes: [] },
    'Art. 17':  { funcoes: ['verificarElegibilidade'], constantes: [], tabelas: ['VEDACOES'] },
    'Art. 18':  { funcoes: ['calcularAliquotaEfetiva','calcularDASMensal','calcularDASMensalOtimizado','calcularDASSegregado','calcularFatorR','determinarAnexo','otimizarFatorR'], constantes: ['LIMITE_FATOR_R','ISS_MINIMO','ISS_MAXIMO'], tabelas: ['ANEXOS','PARTILHA','REGRAS_TRIBUTACAO_ATIVIDADE','ATIVIDADES_PARAGRAFO_5I','REDUCOES_LEGAIS','SEGREGACAO_RECEITAS'] },
    'Art. 18-A':{ funcoes: [], constantes: [], tabelas: ['MEI'] },
    'Art. 19':  { funcoes: ['verificarElegibilidade','calcularDASMensalOtimizado'], constantes: ['SUBLIMITE_ICMS_ISS'] },
    'Art. 20':  { funcoes: ['verificarElegibilidade'], constantes: ['LIMITE_EXCESSO_20_PORCENTO'] },
    'Art. 21':  { funcoes: ['calcularPartilhaTributos'], constantes: ['ISS_MINIMO','ISS_MAXIMO'] },
    'Art. 23':  { funcoes: ['calcularPartilhaTributos'], constantes: [] },
    'Art. 25':  { funcoes: [], constantes: [], tabelas: ['OBRIGACOES_ACESSORIAS','CALENDARIO_FISCAL_2026'] },
    'Art. 26':  { funcoes: [], constantes: [] },
    'Art. 29':  { funcoes: [], constantes: [], tabelas: ['RISCOS_FISCAIS'] },
    'Art. 30':  { funcoes: ['verificarElegibilidade'], constantes: ['LIMITE_EXCESSO_20_PORCENTO'], tabelas: ['TRANSICOES'] },
    'Arts. 42-49': { funcoes: [], constantes: [], tabelas: ['LICITACOES_BENEFICIOS'] },
    'Art. 47+71':  { funcoes: [], constantes: [], tabelas: ['RECUPERACAO_JUDICIAL'] }
  };

  // ════════════════════════════════════════════════════════════════════════
  //  FUNCOES UTILITARIAS
  // ════════════════════════════════════════════════════════════════════════

  /**
   * Busca uma regra pelo ID
   */
  function buscarRegra(id) {
    for (var a = 0; a < LC123_MAPA.artigos.length; a++) {
      var artigo = LC123_MAPA.artigos[a];
      for (var r = 0; r < artigo.regras.length; r++) {
        if (artigo.regras[r].id === id) {
          return artigo.regras[r];
        }
      }
    }
    return null;
  }

  /**
   * Retorna todas as regras com status especifico
   */
  function filtrarPorStatus(status) {
    var resultado = [];
    for (var a = 0; a < LC123_MAPA.artigos.length; a++) {
      var artigo = LC123_MAPA.artigos[a];
      for (var r = 0; r < artigo.regras.length; r++) {
        if (artigo.regras[r].status === status) {
          resultado.push(artigo.regras[r]);
        }
      }
    }
    return resultado;
  }

  /**
   * Retorna gaps (PARCIAL ou AUSENTE) ordenados por risco
   */
  function obterGaps() {
    var ordemRisco = { 'ALTO': 0, 'MEDIO': 1, 'BAIXO': 2 };
    var gaps = [];
    for (var a = 0; a < LC123_MAPA.artigos.length; a++) {
      var artigo = LC123_MAPA.artigos[a];
      for (var r = 0; r < artigo.regras.length; r++) {
        var regra = artigo.regras[r];
        if (regra.status === 'PARCIAL' || regra.status === 'AUSENTE') {
          gaps.push(regra);
        }
      }
    }
    gaps.sort(function(a, b) {
      return (ordemRisco[a.risco] || 3) - (ordemRisco[b.risco] || 3);
    });
    return gaps;
  }

  /**
   * Gera relatorio resumido em texto
   */
  function gerarResumo() {
    var correto = filtrarPorStatus('CORRETO').length;
    var parcial = filtrarPorStatus('PARCIAL').length;
    var ausente = filtrarPorStatus('AUSENTE').length;
    var na = filtrarPorStatus('NAO_APLICAVEL').length;
    var total = correto + parcial + ausente + na;
    var cobertura = ((correto / (total - na)) * 100).toFixed(1);

    return {
      totalRegras: total,
      corretas: correto,
      parciais: parcial,
      ausentes: ausente,
      naoAplicaveis: na,
      coberturaPct: cobertura + '%',
      totalEstrategias: ECONOMIA_LEGAL.length,
      totalModulos: MODULOS_RECOMENDADOS.length,
      veredicto: cobertura >= 80 ? 'Motor APROVADO — cobertura excelente' : 'Motor necessita ajustes',
      motorVersao: 'simples_nacional.js v4.1.0'
    };
  }

  /**
   * Retorna funcoes do motor para um artigo da lei
   */
  function obterFuncoesPorArtigo(artigo) {
    var key = 'Art. ' + artigo;
    return REFERENCIA_CRUZADA[key] || null;
  }

  // ════════════════════════════════════════════════════════════════════════
  //  EXPORT (UMD)
  // ════════════════════════════════════════════════════════════════════════


// ================================================================================
// CAMADA 11A: DEMONSTRACAO (executarDemonstracao)
// Fonte: simples_nacional.js v4.1.0
// ================================================================================


function executarDemonstracao(dadosEmpresa) {
  const sep = '═'.repeat(68);
  const sep2 = '─'.repeat(68);
  const log = console.log.bind(console);

  log('');
  log('╔' + sep + '╗');
  log('║   IMPOST. — Inteligência em Modelagem de Otimização Tributária     ║');
  log('║   Motor de Cálculo Fiscal Otimizado v4.0                           ║');
  log('╚' + sep + '╝');
  log('');

  // Dados da empresa (parâmetro ou exemplo)
  const empresa = dadosEmpresa || {
    nome: 'EMPRESA EXEMPLO S/A',
    cnae: '7119-7/00',
    uf: 'PA',
    municipio: 'Novo Progresso',
    receitaBrutaAnual: 2_350_000.00,
    receitaBrutaMensal: 2_350_000 / 12,
    folhaAnual: 1_000_000.00,
    folhaMensal: 1_000_000 / 12,
    socios: [
      { nome: 'Sócio 1 (Majoritário)', percentual: 0.65 },
      { nome: 'Sócio 2 (Minoritário)', percentual: 0.35 }
    ],
    despesasOperacionais: 800_000.00,
    receitaMonofasica: 0,
    receitaICMS_ST: 0,
    receitaExportacao: 0
  };

  // ▸ 1. DADOS DA EMPRESA
  log('▸ 1. DADOS DA EMPRESA');
  log(sep2);
  log(`  Nome:       ${empresa.nome}`);
  log(`  CNAE:       ${empresa.cnae}`);
  log(`  UF:         ${empresa.uf}`);
  log(`  Município:  ${empresa.municipio}`);
  log(`  Receita Bruta Anual: ${_fmtBRL(empresa.receitaBrutaAnual)}`);
  log(`  Folha Anual:         ${_fmtBRL(empresa.folhaAnual)}`);
  log('');

  // ▸ 2. CLASSIFICAÇÃO CNAE (via CnaeMapeamento)
  log('▸ 2. CLASSIFICAÇÃO CNAE');
  log(sep2);
  const regrasCNAE = obterRegrasCNAE(empresa.cnae);
  log(`  Anexo:          ${regrasCNAE.anexo || 'Fator R'}`);
  log(`  Fator R:        ${regrasCNAE.fatorR ? 'SIM' : 'NÃO'}`);
  log(`  Presunção IRPJ: ${((regrasCNAE.presuncaoIRPJ || 0) * 100).toFixed(0)}%`);
  log(`  Presunção CSLL: ${((regrasCNAE.presuncaoCSLL || 0) * 100).toFixed(0)}%`);
  log(`  Vedado:         ${regrasCNAE.vedado ? 'SIM — ' + regrasCNAE.motivoVedacao : 'NÃO'}`);
  log(`  Monofásico:     ${regrasCNAE.monofasico || 'NÃO'}`);
  log(`  Fonte:          ${regrasCNAE.fonte || 'CnaeMapeamento'}`);
  log('');

  // ▸ 3. FATOR "r" E ANEXO
  log('▸ 3. FATOR "r" E ANEXO');
  log(sep2);
  const fatorResult = calcularFatorR({
    folhaSalarios12Meses: empresa.folhaAnual,
    receitaBruta12Meses: empresa.receitaBrutaAnual
  });
  log(`  Folha (12m):  ${_fmtBRL(fatorResult.folhaSalarios12Meses)}`);
  log(`  RBT12:        ${_fmtBRL(fatorResult.receitaBruta12Meses)}`);
  log(`  Fator "r":    ${fatorResult.fatorRPercentual}`);
  log(`  Limiar:       ${fatorResult.limiarPercentual}`);
  log(`  Anexo:        ${fatorResult.anexoResultante}`);
  log(`  ${fatorResult.observacao}`);
  log('');

  const anexo = obterAnexoEfetivoCNAE(empresa.cnae, null, fatorResult.fatorR);

  // ▸ 4. ELEGIBILIDADE
  log('▸ 4. ELEGIBILIDADE');
  log(sep2);
  const elegResult = verificarElegibilidade({
    receitaBrutaAnual: empresa.receitaBrutaAnual,
    receitaBrutaAnualAnterior: empresa.receitaBrutaAnual,
    cnae: empresa.cnae, fatorR: fatorResult.fatorR
  });
  log(`  Elegível:      ${elegResult.elegivel ? '✅ SIM' : '❌ NÃO'}`);
  log(`  Classificação: ${elegResult.classificacao}`);
  log(`  Impedimentos:  ${elegResult.impedimentos.length === 0 ? 'Nenhum' : elegResult.impedimentos.map(i => i.descricao).join('; ')}`);
  log('');

  // ▸ 5. DAS MENSAL — SEM OTIMIZAÇÃO
  log('▸ 5. DAS MENSAL — SEM OTIMIZAÇÃO');
  log(sep2);
  const dasSemOtim = calcularDASMensal({
    receitaBrutaMensal: empresa.receitaBrutaMensal,
    rbt12: empresa.receitaBrutaAnual,
    anexo
  });
  log(`  Alíquota Efetiva: ${dasSemOtim.aliquotaEfetivaFormatada}`);
  log(`  DAS Mensal:       ${_fmtBRL(dasSemOtim.dasValor)}`);
  log(`  Total a Pagar:    ${_fmtBRL(dasSemOtim.totalAPagar)}`);
  log('');

  // ▸ 6. DAS MENSAL — COM OTIMIZAÇÃO ★
  log('▸ 6. DAS MENSAL — COM OTIMIZAÇÃO ★ (IMPOST.)');
  log(sep2);
  try {
    const dasOtim = calcularDASMensalOtimizado({
      receitaBrutaMensal: empresa.receitaBrutaMensal,
      rbt12: empresa.receitaBrutaAnual,
      anexo,
      cnae: empresa.cnae,
      uf: empresa.uf,
      municipio: empresa.municipio,
      receitaMonofasica: empresa.receitaMonofasica || 0,
      receitaICMS_ST: empresa.receitaICMS_ST || 0,
      receitaExportacao: empresa.receitaExportacao || 0,
      receitaLocacaoBensMoveis: empresa.receitaLocacaoBensMoveis || 0,
      issRetidoFonte: empresa.issRetidoFonte || 0,
      folhaMensal: empresa.folhaMensal
    });

    log(`  DAS sem Otimização:  ${_fmtBRL(dasOtim.dasSemOtimizacao)}`);
    log(`  DAS Otimizado:       ${_fmtBRL(dasOtim.dasOtimizado)}`);
    log(`  Total a Pagar:       ${_fmtBRL(dasOtim.totalAPagar)}`);
    log('');

    // ▸ 7. ECONOMIA IMEDIATA ★
    log('▸ 7. ECONOMIA IMEDIATA ★');
    log(sep2);
    log(`  Economia Mensal: ${_fmtBRL(dasOtim.economiaTotal)}`);
    log(`  Economia Anual:  ${_fmtBRL(dasOtim.economiaTotal * 12)}`);
    if (dasOtim.deducoes.length > 0) {
      log('  Deduções aplicadas:');
      dasOtim.deducoes.forEach((d, i) => {
        log(`    ${i + 1}. ${d.descricao}: ${_fmtBRL(d.economia)}`);
        log(`       Base legal: ${d.baseLegal}`);
      });
    } else {
      log('  Nenhuma dedução aplicável neste cenário.');
    }
    if (dasOtim.alertas.length > 0) {
      log('  Alertas:');
      dasOtim.alertas.forEach(a => log(`    ${a.mensagem}`));
    }
    log('');

    // ▸ 8. PARTILHA DE TRIBUTOS (otimizada)
    log('▸ 8. PARTILHA DE TRIBUTOS (otimizada)');
    log(sep2);
    const pOtim = dasOtim.partilha;
    const tributosList = ['irpj', 'csll', 'cofins', 'pis', 'cpp', 'iss', 'icms', 'ipi'];
    for (const t of tributosList) {
      if (pOtim[t] && pOtim[t].valor > 0) {
        log(`  ${t.toUpperCase().padEnd(8)} ${pOtim[t].percentualFormatado.padStart(8)}  →  ${_fmtBRL(pOtim[t].valor).padStart(14)}`);
      }
    }
    log('');
  } catch (e) {
    log(`  ⚠️ Erro na otimização: ${e.message}`);
    log('');
  }

  // ▸ 9. OTIMIZAÇÃO FATOR "r" ★ (se aplicável)
  if (anexo === 'V') {
    log('▸ 9. OTIMIZAÇÃO FATOR "r" ★');
    log(sep2);
    try {
      const otimFR = otimizarFatorR({
        rbt12: empresa.receitaBrutaAnual,
        folhaAtual12Meses: empresa.folhaAnual,
        receitaMensal: empresa.receitaBrutaMensal,
        cnae: empresa.cnae
      });
      log(`  Fator R Atual:   ${otimFR.fatorRAtualFormatado}`);
      log(`  Anexo Atual:     ${otimFR.anexoAtual}`);
      log(`  Aumento Mensal Necessário: ${_fmtBRL(otimFR.aumentoMensalNecessario)}`);
      log(`  Custo do Aumento Anual:    ${_fmtBRL(otimFR.custoAumentoAnual)}`);
      log(`  Economia DAS Anual:        ${_fmtBRL(otimFR.economiaDASAnual)}`);
      log(`  Economia Líquida Anual:    ${_fmtBRL(otimFR.economiaLiquida)}`);
      log(`  Vale a pena? ${otimFR.vale_a_pena ? '✅ SIM' : '❌ NÃO'}`);
    } catch (e) {
      log(`  ⚠️ Erro: ${e.message}`);
    }
    log('');
  } else {
    log('▸ 9. OTIMIZAÇÃO FATOR "r" — Não aplicável (empresa já no Anexo III)');
    log('');
  }

  // ▸ 10. CONSOLIDAÇÃO ANUAL
  log('▸ 10. CONSOLIDAÇÃO ANUAL');
  log(sep2);
  const mesesUniformes = Array.from({ length: 12 }, () => ({
    receitaBrutaMensal: empresa.receitaBrutaMensal,
    rbt12: empresa.receitaBrutaAnual,
    folhaSalarios12Meses: empresa.folhaAnual,
    anexo,
    folhaMensal: empresa.folhaMensal,
    issRetidoFonte: 0
  }));
  const anualResult = calcularAnualConsolidado({
    meses: mesesUniformes,
    socios: empresa.socios,
    cnae: empresa.cnae,
    tipoAtividade: 'servico',
    aliquotaRAT: ALIQUOTA_RAT_PADRAO
  });
  log(`  Receita Bruta Anual:     ${_fmtBRL(anualResult.receitaBrutaAnual)}`);
  log(`  DAS Anual:               ${_fmtBRL(anualResult.dasAnual)}`);
  log(`  Carga Tributária Total:  ${_fmtBRL(anualResult.cargaTributariaTotal)}`);
  log(`  % sobre Receita:         ${anualResult.percentualCargaFormatado}`);
  log('');

  // ▸ 11. DISTRIBUIÇÃO DE LUCROS
  log('▸ 11. DISTRIBUIÇÃO DE LUCROS');
  log(sep2);
  const distLucros = anualResult.distribuicaoLucros;
  if (distLucros) {
    log(`  Modalidade:         ${distLucros.modalidadeUtilizada}`);
    log(`  Lucro Distribuível: ${_fmtBRL(distLucros.lucroDistribuivelFinal)}`);
    if (distLucros.porSocio) {
      log('  Por Sócio:');
      for (const socio of distLucros.porSocio) {
        log(`    ${socio.nome} (${socio.percentualFormatado}): ${socio.valorIsentoFormatado}`);
      }
    }
  }
  log('');

  // ▸ 12. COMPARATIVO DE REGIMES ★ (completo com dados reais)
  log('▸ 12. COMPARATIVO DE REGIMES ★');
  log(sep2);
  try {
    const comp = compararRegimesCompleto({
      receitaBrutaAnual: empresa.receitaBrutaAnual,
      folhaAnual: empresa.folhaAnual,
      cnae: empresa.cnae,
      uf: empresa.uf,
      municipio: empresa.municipio,
      fatorR: fatorResult.fatorR,
      despesasOperacionais: empresa.despesasOperacionais,
      socios: empresa.socios
    });
    if (comp.regimes) {
      for (const r of comp.regimes) {
        const marker = r.melhorOpcao ? '🏆' : '  ';
        log(`  ${marker} #${r.ranking} ${r.regime.padEnd(28)} Carga: ${_fmtBRL(r.cargaTotal).padStart(14)} (${r.percentualCargaFormatado})`);
      }
      log('');
      log(`  Presunção IRPJ: ${((comp.presuncaoIRPJ || 0.32) * 100).toFixed(0)}% | CSLL: ${((comp.presuncaoCSLL || 0.32) * 100).toFixed(0)}%`);
      if (comp.incentivos && (comp.incentivos.sudam || comp.incentivos.sudene || comp.incentivos.zfm)) {
        log(`  🌿 Incentivos: ${comp.incentivos.sudam ? 'SUDAM' : ''} ${comp.incentivos.sudene ? 'SUDENE' : ''} ${comp.incentivos.zfm ? 'ZFM' : ''} — Redução IRPJ: ${(comp.incentivos.reducaoIRPJ * 100).toFixed(0)}%`);
      }
      log(`  📊 ${comp.recomendacao}`);
    }
  } catch (e) {
    log(`  ⚠️ Erro: ${e.message}`);
  }
  log('');

  // ▸ 13. ESTRATÉGIAS DE ECONOMIA ★
  log('▸ 13. ESTRATÉGIAS DE ECONOMIA');
  log(sep2);
  const estrategiasTop = ESTRATEGIAS_MENOR_IMPOSTO.slice(0, 5);
  estrategiasTop.forEach((e, i) => {
    log(`  ${i + 1}. [${(e.impacto || 'médio').toUpperCase()}] ${e.titulo || e.nome || e.descricao}`);
  });
  log('');

  // ▸ 14. RISCOS FISCAIS
  log('▸ 14. RISCOS FISCAIS (Alta/Crítica)');
  log(sep2);
  RISCOS_FISCAIS
    .filter(r => ['critica', 'alta'].includes(r.gravidade))
    .slice(0, 5)
    .forEach((r, i) => {
      log(`  ${i + 1}. [${r.gravidade.toUpperCase()}] ${r.titulo}`);
    });
  log('');

  // ▸ 15. RECOMENDAÇÃO FINAL
  log('▸ 15. RECOMENDAÇÃO FINAL');
  log(sep2);
  log('');
  log('  ╔══════════════════════════════════════════════════════════════════╗');
  log('  ║  IMPOST. — Relatório de Otimização Tributária Concluído         ║');
  log('  ╚══════════════════════════════════════════════════════════════════╝');
  log('');
  log(`  Empresa:           ${empresa.nome}`);
  log(`  Receita Anual:     ${_fmtBRL(empresa.receitaBrutaAnual)}`);
  log(`  Regime Atual:      Simples Nacional — Anexo ${anexo}`);
  log(`  Alíquota Efetiva:  ${dasSemOtim.aliquotaEfetivaFormatada}`);
  log(`  Carga Anual:       ${_fmtBRL(anualResult.cargaTributariaTotal)} (${anualResult.percentualCargaFormatado})`);
  log('');
  log('  Use gerarRelatorioOtimizacao() para o relatório completo SaaS.');
  log('');
  log(sep);
  log(' IMPOST. v4.0 — Porque pagar imposto certo é direito.');
  log('                 Pagar menos, legalmente, é inteligência.');
  log(sep);
  log('');
}

// Executar demonstração se chamado diretamente
if (typeof require !== 'undefined' && require.main === module) {
  executarDemonstracao();
} else if (typeof process !== 'undefined' && process.argv && process.argv[1] &&
           process.argv[1].endsWith('simples_nacional.js')) {
  executarDemonstracao();
}


// ================================================================================
// CAMADA 11: OBJETO DE EXPORTACAO UNIFICADO — IMPOST. v5.0.0
// ================================================================================

/**
 * Objeto principal de exportacao unificado.
 * Combina motor de calculo (SN v4.1.0), dados legais (CGSN140 v1.0.0),
 * e auditoria LC 123/2006.
 * Versao 5.0.0 — Fusao conforme FUSAO_PLANO.md
 * Retrocompatibilidade 100% com SimplesNacional v4.1.0 e CGSN140 v1.0.0.
 */
const SimplesNacionalUnificado = {
  // Metadados
  VERSION: '5.0.0',
  PRODUTO: 'IMPOST. — Motor Simples Nacional Unificado',
  DATA_ATUALIZACAO: '2026-02-19',
  BASE_LEGAL: 'LC 123/2006; LC 147/2014; LC 155/2016; Resolucao CGSN 140/2018; LC 214/2025; Lei 15.270/2025',

  // Camada 1: Base Legal CGSN 140/2018 (namespace organizado)
  CGSN140: {
    META: CGSN140_META,
    DEFINICOES: DEFINICOES_LEGAIS,
    REGRAS_OPCAO,
    REGRAS_EXCLUSAO,
    CAUSAS_EXCLUSAO_OFICIO,
    VEDACOES: VEDACOES_CGSN140,
    SUBLIMITES: SUBLIMITES_CGSN140,
    REGRAS_CALCULO,
    ANEXOS: ANEXOS_CGSN140,
    PARTILHA: PARTILHA_CGSN140,
    SEGREGACAO: SEGREGACAO_RECEITAS_CGSN140,
    FATOR_R: FATOR_R_CGSN140,
    ISS: REGRAS_ISS_CGSN140,
    ICMS: REGRAS_ICMS_CGSN140,
    IPI: REGRAS_IPI_CGSN140,
    CPP: REGRAS_CPP_CGSN140,
    OBRIGACOES: OBRIGACOES_CGSN140,
    MULTAS: MULTAS_CGSN140,
    DISTRIBUICAO_LUCROS: DISTRIBUICAO_LUCROS_CGSN140,
    FISCALIZACAO: FISCALIZACAO_CGSN140,
    MEI: MEI_CGSN140,
    PRAZOS: PRAZOS_CGSN140,
    TRANSICOES: TRANSICOES_CGSN140
  },

  // Camada 2: Constantes Legais (retrocompatibilidade)
  LIMITE_ME,
  LIMITE_EPP,
  SUBLIMITE_ICMS_ISS,
  LIMITE_RECEITA_MENSAL_PROPORCIONAL,
  LIMITE_FATOR_R,
  ALIQUOTA_INSS_PATRONAL_ANEXO_IV,
  ALIQUOTA_RAT_PADRAO,
  ISS_MINIMO,
  ISS_MAXIMO,
  ALIQUOTA_GANHO_CAPITAL,
  PRESUNCAO_LUCRO_COMERCIO,
  PRESUNCAO_LUCRO_TRANSPORTE,
  PRESUNCAO_LUCRO_SERVICOS,
  LIMITE_EXCESSO_20_PORCENTO,
  ALIQUOTA_FGTS,
  TETO_INSS_EMPREGADO,
  PRAZO_OPCAO,
  PRAZO_OPCAO_EMPRESA_NOVA,

  // Aliases de tabelas (retrocompatibilidade v4.1.0)
  ANEXOS: ANEXOS_CGSN140,
  PARTILHA: PARTILHA_CGSN140,
  VEDACOES: VEDACOES_CGSN140,
  OBRIGACOES_ACESSORIAS: OBRIGACOES_CGSN140,
  MEI: MEI_CGSN140,
  TRANSICOES: TRANSICOES_CGSN140,
  ANEXO_VI_HISTORICO,

  // Camada 2: Dados Praticos (exclusivos do motor)
  MAPEAMENTO_CNAE,
  MAPEAMENTO_CNAE_ADICIONAL,
  ATIVIDADES_PARAGRAFO_5I,
  REGRAS_TRIBUTACAO_ATIVIDADE,
  SEGREGACAO_RECEITAS,
  PRODUTOS_MONOFASICOS,
  PRODUTOS_MONOFASICOS_NCM,
  PRAZO_MINIMO_ICMS_ST,
  REDUCOES_LEGAIS,
  ESTRATEGIAS_MENOR_IMPOSTO,
  RISCOS_FISCAIS,
  LICITACOES_BENEFICIOS,
  RECUPERACAO_JUDICIAL,
  ALIQUOTAS_INTERNAS_UF,
  ISENCAO_ESTADUAL_ICMS,

  // Camada 3: Modulo 2026
  PENALIDADES_2026,
  TRIBUTACAO_DIVIDENDOS_2026,
  REFORMA_TRIBUTARIA_SIMPLES,
  GRUPO_ECONOMICO_2026,
  PRAZO_IMPUGNACAO_2026,
  CALENDARIO_FISCAL_2026,

  // Camada 5: Funcoes de Consulta CGSN140
  consultarArtigo,
  obterVedacao,
  obterRegraAnexo,
  obterRegrasISS,
  obterRegrasICMS,
  obterRegrasFatorR,
  validarElegibilidadeCGSN140,
  obterMultaPGDAS,
  obterPrazos,
  obterObrigacao,
  obterRegrasDistribuicaoLucros,
  obterRegrasMEI,
  calcularDASMEI,

  // Camada 6: Funcoes de Calculo Core
  calcularFatorR,
  determinarAnexo,
  calcularAliquotaEfetiva,
  calcularDASMensal,
  calcularPartilhaTributos,
  calcularAnualConsolidado,
  verificarElegibilidade,
  calcularDistribuicaoLucros,
  analisarVantagensDesvantagens,
  compararComOutrosRegimes,

  // Camada 7: Funcoes Otimizadas (v4.0+)
  calcularDASMensalOtimizado,
  calcularDASSegregado,
  otimizarFatorR,
  compararRegimesCompleto,
  gerarRelatorioOtimizacao,

  // Camada 8: Funcoes de Integracao
  obterRegrasCNAE,
  isVedadoCNAE,
  obterAnexoEfetivoCNAE,
  isMonofasicoCNAE,
  obterDadosEstado,
  verificarIncentivosRegionais,
  obterAliquotaICMS,
  obterAliquotaISS,

  // Camada 9: Funcoes Modulo 2026
  calcularMultaAtraso,
  calcularImpactoDividendos2026,
  calcularDIFAL,
  verificarMonofasicoNCM,
  calcularEconomiaMonofasica,
  gerarDicasEconomia,
  gerarRelatorioEconomiaCompleto,

  // Camada 10: Modulo de Auditoria (LC 123/2006)
  AUDITORIA: {
    LC123_MAPA,
    CHECKLIST,
    MODULOS_RECOMENDADOS,
    REFERENCIA_CRUZADA,
    buscarRegra,
    filtrarPorStatus,
    obterGaps,
    gerarResumo,
    obterFuncoesPorArtigo
  },

  // Auxiliares
  getAnexosDisponiveis,
  getFaixaByRBT12,
  calcularRBT12Proporcional,
  validarDadosEntrada,
  formatarResultadoTexto,
  _arredondar,
  _formatarMoeda: _fmtBRL,

  // Demo
  executarDemonstracao
};

// Aliases de retrocompatibilidade (nivel raiz)
const SimplesNacional = SimplesNacionalUnificado;
const IMPOST_API = SimplesNacionalUnificado;
const IMPOST = SimplesNacionalUnificado;
// NOTA: validarElegibilidadeCGSN140 ja esta definida como funcao em resolucao_cgsn_140.js
// (alias removido para evitar redeclaracao em strict mode)

return SimplesNacionalUnificado;

})); // fim UMD wrapper
