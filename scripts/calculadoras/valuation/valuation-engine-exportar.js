/**
 * IMPOST — Valuation Engine Exportar v1.0.0
 * Módulo de exportação PDF/Excel para resultados do valuation-engine.js
 *
 * Dependências (carregadas via CDN antes deste script):
 *  - Chart.js 4.4.4
 *  - jsPDF 2.5.1
 *  - jspdf-autotable 3.8.2
 *  - xlsx 0.18.5 (usado na Parte 2)
 *  - valuation-engine.js 2.0.0
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.ValuationExportar = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ─────────────────────────────────────────────
  // CONSTANTES
  // ─────────────────────────────────────────────

  var VERSION = '1.0.0';

  var CORES = {
    primaria:       '#22C55E',
    primariaEscura: '#15803D',
    primariaClara:  '#F0FDF4',
    primaria10:     '#ECFDF5',
    secundaria:     '#1E3A5F',
    dourado:        '#CA8A04',

    texto:          '#1F2937',
    textoSecundario:'#6B7280',
    textoClaro:     '#9CA3AF',

    fundo:          '#FFFFFF',
    fundoCinza:     '#F9FAFB',
    fundoZebra:     '#F3F4F6',
    borda:          '#E5E7EB',

    erro:           '#DC2626',
    aviso:          '#F59E0B',
    info:           '#3B82F6',
    sucesso:        '#22C55E',

    dcf:            '#1E40AF',
    multiplos:      '#047857',
    patrimonial:    '#B45309',
    consolidado:    '#7C3AED',

    positivo:       '#22C55E',
    negativo:       '#DC2626',
    subtotal:       '#3B82F6',
    neutro:         '#9CA3AF'
  };

  // A4 em mm
  var A4 = { largura: 210, altura: 297 };
  var MARGEM = { esquerda: 15, direita: 15, topo: 20, base: 20 };
  var AREA_UTIL = { largura: A4.largura - MARGEM.esquerda - MARGEM.direita, altura: A4.altura - MARGEM.topo - MARGEM.base };

  // ─────────────────────────────────────────────
  // UTILITÁRIOS DE FORMATAÇÃO
  // ─────────────────────────────────────────────

  function _existeEngine() {
    return typeof ValuationEngine !== 'undefined' && ValuationEngine.formatarMoeda;
  }

  function formatarMoeda(valor) {
    if (_existeEngine()) return ValuationEngine.formatarMoeda(valor);
    if (valor == null || isNaN(valor)) return 'R$ 0,00';
    return 'R$ ' + Number(valor).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function formatarMoedaCurta(valor) {
    if (_existeEngine()) return ValuationEngine.formatarMoedaCurta(valor);
    if (valor == null || isNaN(valor)) return 'R$ 0';
    var abs = Math.abs(valor);
    var sinal = valor < 0 ? '-' : '';
    if (abs >= 1e9) return sinal + 'R$ ' + (abs / 1e9).toFixed(1).replace('.', ',') + 'B';
    if (abs >= 1e6) return sinal + 'R$ ' + (abs / 1e6).toFixed(1).replace('.', ',') + 'M';
    if (abs >= 1e3) return sinal + 'R$ ' + (abs / 1e3).toFixed(0).replace('.', ',') + 'k';
    return sinal + 'R$ ' + abs.toFixed(0);
  }

  function formatarPct(valor) {
    if (_existeEngine()) return ValuationEngine.formatarPct(valor);
    if (valor == null || isNaN(valor)) return '0,0%';
    return (valor * 100).toFixed(1).replace('.', ',') + '%';
  }

  function formatarMultiplo(valor) {
    if (valor == null || isNaN(valor)) return '0,0x';
    return Number(valor).toFixed(1).replace('.', ',') + 'x';
  }

  function formatarData(dataStr) {
    if (!dataStr) return '';
    var partes = dataStr.split('-');
    if (partes.length === 3) return partes[2] + '/' + partes[1] + '/' + partes[0];
    return dataStr;
  }

  function formatarNumero(valor, decimais) {
    if (valor == null || isNaN(valor)) return '0';
    decimais = decimais != null ? decimais : 0;
    return Number(valor).toFixed(decimais).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function _hexParaRgb(hex) {
    hex = hex.replace('#', '');
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16)
    };
  }

  function _hexParaRgba(hex, alpha) {
    var rgb = _hexParaRgb(hex);
    return 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + alpha + ')';
  }

  function _interpolarCor(corInicio, corFim, fator) {
    var c1 = _hexParaRgb(corInicio);
    var c2 = _hexParaRgb(corFim);
    var r = Math.round(c1.r + (c2.r - c1.r) * fator);
    var g = Math.round(c1.g + (c2.g - c1.g) * fator);
    var b = Math.round(c1.b + (c2.b - c1.b) * fator);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  // ─────────────────────────────────────────────
  // RENDERIZAÇÃO DE GRÁFICOS (Chart.js → base64)
  // ─────────────────────────────────────────────

  function _renderizarGrafico(largura, altura, configChart) {
    return new Promise(function (resolve) {
      var canvas = document.createElement('canvas');
      canvas.width = largura;
      canvas.height = altura;
      var ctx = canvas.getContext('2d');
      configChart.options = configChart.options || {};
      configChart.options.animation = false;
      configChart.options.responsive = false;
      configChart.options.devicePixelRatio = 1;
      var chart = new Chart(ctx, configChart);
      chart.update('none');
      var img = canvas.toDataURL('image/png');
      chart.destroy();
      canvas = null;
      resolve(img);
    });
  }

  function _renderizarCanvas(largura, altura, drawFn) {
    return new Promise(function (resolve) {
      var canvas = document.createElement('canvas');
      canvas.width = largura;
      canvas.height = altura;
      var ctx = canvas.getContext('2d');
      drawFn(ctx, largura, altura);
      var img = canvas.toDataURL('image/png');
      canvas = null;
      resolve(img);
    });
  }

  var qualidade = 2; // multiplicador de resolução

  function _q(val) { return val * qualidade; }

  // ─────────────────────────────────────────────
  // 5.1 FOOTBALL FIELD (barras horizontais)
  // ─────────────────────────────────────────────

  function gerarGraficoFootballField(data) {
    var barras = data.barras || [];
    var faixa = data.faixaNegociacao || {};
    var labels = barras.map(function (b) { return b.label; });
    var cores = barras.map(function (b) { return b.cor; });
    var corBordas = barras.map(function (b) { return b.destaque ? '#7C3AED' : b.cor; });
    var bordaLarguras = barras.map(function (b) { return b.destaque ? 3 : 1; });

    var dataRanges = barras.map(function (b) { return [b.min, b.max]; });
    var medianas = barras.map(function (b) { return b.mediana; });

    return _renderizarGrafico(_q(800), _q(300), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Faixa de Valor',
            data: dataRanges,
            backgroundColor: cores.map(function (c) { return _hexParaRgba(c, 0.7); }),
            borderColor: corBordas,
            borderWidth: bordaLarguras,
            barPercentage: 0.6
          },
          {
            label: 'Mediana',
            data: medianas.map(function (m, i) { return [m - (barras[i].max - barras[i].min) * 0.005, m + (barras[i].max - barras[i].min) * 0.005]; }),
            backgroundColor: 'rgba(0,0,0,0.8)',
            borderColor: '#000',
            borderWidth: 1,
            barPercentage: 0.6
          }
        ]
      },
      options: {
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        scales: {
          x: {
            ticks: {
              callback: function (v) { return formatarMoedaCurta(v); },
              font: { size: _q(10) }
            },
            grid: { color: '#E5E7EB' }
          },
          y: {
            ticks: { font: { size: _q(12), weight: 'bold' } },
            grid: { display: false }
          }
        }
      }
    });
  }

  // ─────────────────────────────────────────────
  // 5.2 WATERFALL (cascata)
  // ─────────────────────────────────────────────

  function gerarGraficoWaterfall(data) {
    var etapas = data.etapas || [];
    var labels = etapas.map(function (e) { return e.label; });
    var cores = etapas.map(function (e) {
      if (e.tipo === 'positivo') return CORES.positivo;
      if (e.tipo === 'negativo') return CORES.negativo;
      return CORES.subtotal;
    });

    // Calcular bases para floating bars
    var acumulado = 0;
    var dataPoints = [];
    for (var i = 0; i < etapas.length; i++) {
      var e = etapas[i];
      if (e.tipo === 'subtotal') {
        dataPoints.push([0, e.valor]);
        acumulado = e.valor;
      } else {
        var base = acumulado;
        acumulado += e.valor;
        if (e.valor >= 0) {
          dataPoints.push([base, acumulado]);
        } else {
          dataPoints.push([acumulado, base]);
        }
      }
    }

    return _renderizarGrafico(_q(800), _q(400), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          data: dataPoints,
          backgroundColor: cores,
          borderColor: cores,
          borderWidth: 1,
          barPercentage: 0.7
        }]
      },
      options: {
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        scales: {
          y: {
            ticks: {
              callback: function (v) { return formatarMoedaCurta(v); },
              font: { size: _q(10) }
            },
            grid: { color: '#E5E7EB' }
          },
          x: {
            ticks: { font: { size: _q(9) }, maxRotation: 45 },
            grid: { display: false }
          }
        }
      }
    });
  }

  // ─────────────────────────────────────────────
  // 5.3 PROJEÇÃO FCF (barras + linha)
  // ─────────────────────────────────────────────

  function gerarGraficoProjecaoFCF(data) {
    var anoBase = data.anoBase;
    var projecao = data.projecaoAnual || [];

    var labels = ['Ano Base'];
    var fcfData = [anoBase ? anoBase.fcf : 0];
    var receitaData = [anoBase ? anoBase.receita : 0];

    for (var i = 0; i < projecao.length; i++) {
      labels.push('Ano ' + projecao[i].ano);
      fcfData.push(projecao[i].fcf);
      receitaData.push(projecao[i].receita);
    }

    return _renderizarGrafico(_q(800), _q(350), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            type: 'bar',
            label: 'FCF',
            data: fcfData,
            backgroundColor: _hexParaRgba(CORES.positivo, 0.7),
            borderColor: CORES.positivo,
            borderWidth: 1,
            yAxisID: 'y',
            order: 2
          },
          {
            type: 'line',
            label: 'Receita',
            data: receitaData,
            borderColor: CORES.info,
            backgroundColor: _hexParaRgba(CORES.info, 0.1),
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: CORES.info,
            tension: 0.3,
            fill: false,
            yAxisID: 'y1',
            order: 1
          }
        ]
      },
      options: {
        plugins: {
          legend: { position: 'top', labels: { font: { size: _q(11) } } }
        },
        scales: {
          y: {
            position: 'left',
            title: { display: true, text: 'FCF', font: { size: _q(10) } },
            ticks: { callback: function (v) { return formatarMoedaCurta(v); }, font: { size: _q(9) } },
            grid: { color: '#E5E7EB' }
          },
          y1: {
            position: 'right',
            title: { display: true, text: 'Receita', font: { size: _q(10) } },
            ticks: { callback: function (v) { return formatarMoedaCurta(v); }, font: { size: _q(9) } },
            grid: { drawOnChartArea: false }
          },
          x: {
            ticks: { font: { size: _q(10) } },
            grid: { display: false }
          }
        }
      }
    });
  }

  // ─────────────────────────────────────────────
  // 5.4 COMPOSIÇÃO EV (donut)
  // ─────────────────────────────────────────────

  function gerarGraficoComposicaoEV(data) {
    var comp = data.composicao || {};
    var vFluxos = comp.valorFluxos || 0;
    var vTerminal = comp.valorTerminal || 0;
    var pFluxos = comp.percentualFluxos || 0;
    var pTerminal = comp.percentualTerminal || 0;

    return _renderizarGrafico(_q(400), _q(400), {
      type: 'doughnut',
      data: {
        labels: [
          'VP Fluxos (' + formatarPct(pFluxos) + ')',
          'VP Terminal (' + formatarPct(pTerminal) + ')'
        ],
        datasets: [{
          data: [vFluxos, vTerminal],
          backgroundColor: [_hexParaRgba(CORES.info, 0.8), _hexParaRgba(CORES.positivo, 0.8)],
          borderColor: [CORES.info, CORES.positivo],
          borderWidth: 2
        }]
      },
      options: {
        cutout: '55%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { size: _q(12) }, padding: _q(15) }
          },
          tooltip: { enabled: false }
        }
      }
    });
  }

  // ─────────────────────────────────────────────
  // 5.5 SENSIBILIDADE (heatmap direto no canvas)
  // ─────────────────────────────────────────────

  function gerarGraficoSensibilidade(data) {
    var sens = data;
    var linhas = sens.linhas || [];
    var colunas = sens.colunas || [];
    var valores = sens.valores || [];
    var central = sens.central || {};

    var nLinhas = linhas.length;
    var nColunas = colunas.length;

    // Encontrar min/max para escala de cores
    var todosValores = [];
    for (var i = 0; i < nLinhas; i++) {
      for (var j = 0; j < nColunas; j++) {
        todosValores.push(valores[i][j]);
      }
    }
    var minVal = Math.min.apply(null, todosValores);
    var maxVal = Math.max.apply(null, todosValores);

    var celW = 120;
    var celH = 40;
    var headerW = 80;
    var headerH = 40;
    var largura = headerW + nColunas * celW + 20;
    var altura = headerH + nLinhas * celH + 50;

    return _renderizarCanvas(_q(largura), _q(altura), function (ctx, w, h) {
      var s = qualidade;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);

      // Título colunas
      ctx.fillStyle = CORES.texto;
      ctx.font = 'bold ' + (12 * s) + 'px Helvetica';
      ctx.textAlign = 'center';
      ctx.fillText(sens.colunasLabel || 'Crescimento Perpétuo (g)', (headerW + nColunas * celW / 2) * s, 15 * s);

      // Labels de colunas
      ctx.font = (10 * s) + 'px Helvetica';
      for (var j = 0; j < nColunas; j++) {
        var cx = (headerW + j * celW + celW / 2) * s;
        ctx.fillText(formatarPct(colunas[j]), cx, (headerH - 5) * s);
      }

      // Label linhas (título)
      ctx.save();
      ctx.translate(12 * s, (headerH + nLinhas * celH / 2) * s);
      ctx.rotate(-Math.PI / 2);
      ctx.font = 'bold ' + (12 * s) + 'px Helvetica';
      ctx.fillText(sens.linhasLabel || 'WACC', 0, 0);
      ctx.restore();

      // Células
      for (var i = 0; i < nLinhas; i++) {
        // Label da linha
        ctx.fillStyle = CORES.texto;
        ctx.font = (10 * s) + 'px Helvetica';
        ctx.textAlign = 'right';
        var ly = (headerH + i * celH + celH / 2 + 4) * s;
        ctx.fillText(formatarPct(linhas[i]), (headerW - 8) * s, ly);

        for (var j = 0; j < nColunas; j++) {
          var val = valores[i][j];
          var fator = maxVal !== minVal ? (val - minVal) / (maxVal - minVal) : 0.5;

          // Cor: vermelho (baixo) → amarelo (médio) → verde (alto)
          var cor;
          if (fator < 0.5) {
            cor = _interpolarCor('#DC2626', '#F59E0B', fator * 2);
          } else {
            cor = _interpolarCor('#F59E0B', '#22C55E', (fator - 0.5) * 2);
          }

          var rx = (headerW + j * celW) * s;
          var ry = (headerH + i * celH) * s;
          var rw = celW * s;
          var rh = celH * s;

          ctx.fillStyle = cor;
          ctx.fillRect(rx, ry, rw, rh);

          // Borda da célula
          ctx.strokeStyle = '#E5E7EB';
          ctx.lineWidth = 1;
          ctx.strokeRect(rx, ry, rw, rh);

          // Célula central com borda destacada
          var eCentral = central.wacc !== undefined && central.taxaPerpetua !== undefined &&
            Math.abs(linhas[i] - central.wacc) < 0.001 && Math.abs(colunas[j] - central.taxaPerpetua) < 0.001;
          if (eCentral) {
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3 * s;
            ctx.strokeRect(rx + 1, ry + 1, rw - 2, rh - 2);
          }

          // Valor da célula
          ctx.fillStyle = fator > 0.3 && fator < 0.7 ? '#000000' : '#FFFFFF';
          ctx.font = (9 * s) + 'px Helvetica';
          ctx.textAlign = 'center';
          ctx.fillText(formatarMoedaCurta(val), rx + rw / 2, ry + rh / 2 + 3 * s);
        }
      }
    });
  }

  // ─────────────────────────────────────────────
  // 5.6 CENÁRIOS (barras agrupadas)
  // ─────────────────────────────────────────────

  function gerarGraficoCenarios(data) {
    var cenarios = data.cenarios || {};
    var p = cenarios.pessimista || {};
    var b = cenarios.base || {};
    var o = cenarios.otimista || {};

    return _renderizarGrafico(_q(600), _q(350), {
      type: 'bar',
      data: {
        labels: ['Pessimista', 'Base', 'Otimista'],
        datasets: [
          {
            label: 'Equity Value',
            data: [p.equityValue || 0, b.equityValue || 0, o.equityValue || 0],
            backgroundColor: [_hexParaRgba('#9CA3AF', 0.7), _hexParaRgba(CORES.positivo, 0.7), _hexParaRgba(CORES.info, 0.7)],
            borderColor: ['#9CA3AF', CORES.positivo, CORES.info],
            borderWidth: 1
          },
          {
            label: 'Enterprise Value',
            data: [p.enterpriseValue || 0, b.enterpriseValue || 0, o.enterpriseValue || 0],
            backgroundColor: [_hexParaRgba('#9CA3AF', 0.3), _hexParaRgba(CORES.positivo, 0.3), _hexParaRgba(CORES.info, 0.3)],
            borderColor: ['#9CA3AF', CORES.positivo, CORES.info],
            borderWidth: 1,
            borderDash: [5, 5]
          }
        ]
      },
      options: {
        plugins: {
          legend: { position: 'top', labels: { font: { size: _q(11) } } }
        },
        scales: {
          y: {
            ticks: { callback: function (v) { return formatarMoedaCurta(v); }, font: { size: _q(10) } },
            grid: { color: '#E5E7EB' }
          },
          x: {
            ticks: { font: { size: _q(12), weight: 'bold' } },
            grid: { display: false }
          }
        }
      }
    });
  }

  // ─────────────────────────────────────────────
  // 5.7 SCORECARD / RADAR
  // ─────────────────────────────────────────────

  function gerarGraficoScorecard(data) {
    var grupos = data.grupos || {};
    var labels = [];
    var valores = [];
    var chaves = ['rentabilidade', 'margens', 'liquidez', 'eficiencia'];
    var nomes = ['Rentabilidade', 'Margens', 'Liquidez', 'Eficiência'];
    for (var i = 0; i < chaves.length; i++) {
      var g = grupos[chaves[i]];
      labels.push(nomes[i] + (g ? ' (' + g.nota.toFixed(1) + ')' : ''));
      valores.push(g ? g.nota : 0);
    }

    return _renderizarGrafico(_q(450), _q(450), {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Nota',
          data: valores,
          backgroundColor: _hexParaRgba(CORES.positivo, 0.2),
          borderColor: CORES.positivo,
          borderWidth: 2,
          pointBackgroundColor: CORES.positivo,
          pointRadius: 5
        }]
      },
      options: {
        scales: {
          r: {
            min: 0,
            max: 10,
            ticks: { stepSize: 2, font: { size: _q(10) }, backdropColor: 'transparent' },
            pointLabels: { font: { size: _q(11) } },
            grid: { color: '#E5E7EB' }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  // ─────────────────────────────────────────────
  // 5.8 DUPONT (barras horizontais)
  // ─────────────────────────────────────────────

  function gerarGraficoDuPont(data) {
    var dp = data;
    return _renderizarGrafico(_q(600), _q(300), {
      type: 'bar',
      data: {
        labels: ['Margem Líquida', 'Giro do Ativo', 'Alavancagem'],
        datasets: [{
          data: [dp.margemLiquida || 0, dp.giroAtivo || 0, dp.multiplicadorAlavancagem || 0],
          backgroundColor: [
            _hexParaRgba(CORES.positivo, 0.7),
            _hexParaRgba(CORES.info, 0.7),
            _hexParaRgba(CORES.dourado, 0.7)
          ],
          borderColor: [CORES.positivo, CORES.info, CORES.dourado],
          borderWidth: 1,
          barPercentage: 0.5
        }]
      },
      options: {
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        scales: {
          x: {
            ticks: { font: { size: _q(10) } },
            grid: { color: '#E5E7EB' }
          },
          y: {
            ticks: { font: { size: _q(12), weight: 'bold' } },
            grid: { display: false }
          }
        }
      }
    });
  }

  // ─────────────────────────────────────────────
  // 5.9 MÚLTIPLOS COMPARATIVO (barras agrupadas horizontais)
  // ─────────────────────────────────────────────

  function gerarGraficoMultiplos(data) {
    var metodos = data.metodos || {};
    var chaves = ['evEbitda', 'evEbit', 'evFcf', 'pl', 'evReceita', 'pvpa'];
    var nomes = ['EV/EBITDA', 'EV/EBIT', 'EV/FCF', 'P/L', 'EV/Receita', 'P/VPA'];
    var labelsUsados = [];
    var minData = [], medData = [], maxData = [];

    for (var i = 0; i < chaves.length; i++) {
      var m = metodos[chaves[i]];
      if (m && m.aplicavel) {
        labelsUsados.push(nomes[i]);
        var eq = m.equityAjustado || m.equityBruto || {};
        minData.push(eq.min || 0);
        medData.push(eq.mediana || 0);
        maxData.push(eq.max || 0);
      }
    }

    return _renderizarGrafico(_q(800), _q(350), {
      type: 'bar',
      data: {
        labels: labelsUsados,
        datasets: [
          {
            label: 'Mínimo',
            data: minData,
            backgroundColor: _hexParaRgba(CORES.multiplos, 0.3),
            borderColor: CORES.multiplos,
            borderWidth: 1
          },
          {
            label: 'Mediana',
            data: medData,
            backgroundColor: _hexParaRgba(CORES.multiplos, 0.6),
            borderColor: CORES.multiplos,
            borderWidth: 1
          },
          {
            label: 'Máximo',
            data: maxData,
            backgroundColor: _hexParaRgba(CORES.multiplos, 0.9),
            borderColor: CORES.multiplos,
            borderWidth: 1
          }
        ]
      },
      options: {
        indexAxis: 'y',
        plugins: {
          legend: { position: 'top', labels: { font: { size: _q(11) } } }
        },
        scales: {
          x: {
            ticks: { callback: function (v) { return formatarMoedaCurta(v); }, font: { size: _q(10) } },
            grid: { color: '#E5E7EB' }
          },
          y: {
            ticks: { font: { size: _q(11), weight: 'bold' } },
            grid: { display: false }
          }
        }
      }
    });
  }

  // ─────────────────────────────────────────────
  // 5.10 PERCENTIS (box plot simplificado)
  // ─────────────────────────────────────────────

  function gerarGraficoPercentis(data) {
    var perc = data;
    var p10 = perc.p10 || 0;
    var p25 = perc.p25 || 0;
    var p50 = perc.p50 || 0;
    var p75 = perc.p75 || 0;
    var p90 = perc.p90 || 0;
    var minV = p10 * 0.9;
    var maxV = p90 * 1.1;
    var range = maxV - minV;

    var largura = 800;
    var altura = 120;

    return _renderizarCanvas(_q(largura), _q(altura), function (ctx, w, h) {
      var s = qualidade;
      var margemH = 60;
      var linhaY = 60;
      var barraLargura = largura - 2 * margemH;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);

      function xPos(val) {
        return (margemH + (val - minV) / range * barraLargura) * s;
      }

      // Linha central
      ctx.strokeStyle = '#9CA3AF';
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.moveTo(xPos(p10), linhaY * s);
      ctx.lineTo(xPos(p90), linhaY * s);
      ctx.stroke();

      // Região P25-P75 sombreada
      ctx.fillStyle = _hexParaRgba(CORES.positivo, 0.15);
      var x25 = xPos(p25);
      var x75 = xPos(p75);
      ctx.fillRect(x25, (linhaY - 18) * s, x75 - x25, 36 * s);
      ctx.strokeStyle = CORES.positivo;
      ctx.lineWidth = 1 * s;
      ctx.strokeRect(x25, (linhaY - 18) * s, x75 - x25, 36 * s);

      // Marcadores
      var pontos = [
        { val: p10, label: 'P10' },
        { val: p25, label: 'P25' },
        { val: p50, label: 'P50' },
        { val: p75, label: 'P75' },
        { val: p90, label: 'P90' }
      ];

      for (var i = 0; i < pontos.length; i++) {
        var px = xPos(pontos[i].val);
        var isMediana = pontos[i].label === 'P50';

        // Linha vertical
        ctx.strokeStyle = isMediana ? CORES.positivo : '#6B7280';
        ctx.lineWidth = (isMediana ? 3 : 1.5) * s;
        ctx.beginPath();
        ctx.moveTo(px, (linhaY - 22) * s);
        ctx.lineTo(px, (linhaY + 22) * s);
        ctx.stroke();

        // Diamante no P50
        if (isMediana) {
          ctx.fillStyle = CORES.positivo;
          ctx.beginPath();
          ctx.moveTo(px, (linhaY - 8) * s);
          ctx.lineTo(px + 6 * s, linhaY * s);
          ctx.moveTo(px, (linhaY + 8) * s);
          ctx.lineTo(px + 6 * s, linhaY * s);
          ctx.moveTo(px, (linhaY - 8) * s);
          ctx.lineTo(px - 6 * s, linhaY * s);
          ctx.moveTo(px, (linhaY + 8) * s);
          ctx.lineTo(px - 6 * s, linhaY * s);
          ctx.fill();
        }

        // Label
        ctx.fillStyle = CORES.texto;
        ctx.font = 'bold ' + (9 * s) + 'px Helvetica';
        ctx.textAlign = 'center';
        ctx.fillText(pontos[i].label, px, (linhaY - 28) * s);

        // Valor
        ctx.font = (8 * s) + 'px Helvetica';
        ctx.fillText(formatarMoedaCurta(pontos[i].val), px, (linhaY + 38) * s);
      }
    });
  }


  // ─────────────────────────────────────────────
  // AUXILIARES PDF (jsPDF)
  // ─────────────────────────────────────────────

  var _paginaAtual = 0;
  var _totalPaginas = 0;

  function _novaPagina(doc) {
    doc.addPage();
    _paginaAtual++;
  }

  function _adicionarCabecalho(doc, nomeEmpresa, dataCalculo) {
    var rgb = _hexParaRgb(CORES.primaria);
    doc.setDrawColor(rgb.r, rgb.g, rgb.b);
    doc.setLineWidth(0.8);
    doc.line(MARGEM.esquerda, 10, A4.largura - MARGEM.direita, 10);

    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128); // textoSecundario
    doc.setFont('helvetica', 'normal');
    doc.text(nomeEmpresa || '', MARGEM.esquerda, 8);
    doc.text(formatarData(dataCalculo) || '', A4.largura - MARGEM.direita, 8, { align: 'right' });
  }

  function _adicionarRodape(doc, nomeEmpresa) {
    var y = A4.altura - 10;
    var rgb = _hexParaRgb(CORES.primaria);
    doc.setDrawColor(rgb.r, rgb.g, rgb.b);
    doc.setLineWidth(0.5);
    doc.line(MARGEM.esquerda, y - 3, A4.largura - MARGEM.direita, y - 3);

    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175); // textoClaro
    doc.setFont('helvetica', 'normal');
    doc.text('IMPOST. — Relatório de Precificação', MARGEM.esquerda, y);
    doc.text(nomeEmpresa || '', A4.largura / 2, y, { align: 'center' });
    doc.text('Página ' + _paginaAtual + ' de {totalPaginas}', A4.largura - MARGEM.direita, y, { align: 'right' });
  }

  function _corTexto(doc) {
    doc.setTextColor(31, 41, 55);
  }

  function _corSecundaria(doc) {
    doc.setTextColor(107, 114, 128);
  }

  function _tituloSecao(doc, texto, y) {
    var rgb = _hexParaRgb(CORES.primariaEscura);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(rgb.r, rgb.g, rgb.b);
    doc.text(texto, MARGEM.esquerda, y);
    // Linha decorativa
    doc.setDrawColor(rgb.r, rgb.g, rgb.b);
    doc.setLineWidth(0.5);
    doc.line(MARGEM.esquerda, y + 2, MARGEM.esquerda + 50, y + 2);
    return y + 8;
  }

  function _subtituloSecao(doc, texto, y) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    _corTexto(doc);
    doc.text(texto, MARGEM.esquerda, y);
    return y + 6;
  }

  function _textoNormal(doc, texto, y, opts) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    _corTexto(doc);
    var maxW = opts && opts.maxWidth ? opts.maxWidth : AREA_UTIL.largura;
    var linhas = doc.splitTextToSize(texto, maxW);
    doc.text(linhas, MARGEM.esquerda, y);
    return y + linhas.length * 4.5;
  }

  function _adicionarImagem(doc, imgBase64, x, y, largura, altura) {
    if (!imgBase64) return y;
    try {
      doc.addImage(imgBase64, 'PNG', x, y, largura, altura);
    } catch (e) {
      // Falha silenciosa — gráfico não disponível
    }
    return y + altura + 3;
  }

  function _verificarEspacoPagina(doc, yAtual, espacoNecessario, nomeEmpresa, dataCalculo) {
    if (yAtual + espacoNecessario > A4.altura - MARGEM.base - 5) {
      _adicionarRodape(doc, nomeEmpresa);
      _novaPagina(doc);
      _adicionarCabecalho(doc, nomeEmpresa, dataCalculo);
      return MARGEM.topo + 5;
    }
    return yAtual;
  }

  function _tabelaChaveValor(doc, dados, y, opts) {
    var colunaChave = (opts && opts.colunaChave) || 70;
    doc.autoTable({
      startY: y,
      margin: { left: MARGEM.esquerda, right: MARGEM.direita },
      head: [],
      body: dados.map(function (item) { return [item[0], item[1]]; }),
      theme: 'plain',
      styles: {
        fontSize: 9,
        cellPadding: 2,
        textColor: [31, 41, 55],
        lineColor: [229, 231, 235],
        lineWidth: 0.2
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: colunaChave, textColor: [107, 114, 128] },
        1: { cellWidth: 'auto' }
      },
      alternateRowStyles: { fillColor: [249, 250, 251] }
    });
    return doc.lastAutoTable.finalY + 4;
  }

  // Estilos padrão para autotable
  function _estiloTabela() {
    return {
      headStyles: {
        fillColor: [236, 253, 245], // primaria10
        textColor: [21, 128, 61], // primariaEscura
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: 2.5
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 2,
        textColor: [31, 41, 55]
      },
      alternateRowStyles: {
        fillColor: [243, 244, 246] // fundoZebra
      },
      styles: {
        lineColor: [229, 231, 235],
        lineWidth: 0.2,
        overflow: 'linebreak'
      },
      margin: { left: MARGEM.esquerda, right: MARGEM.direita }
    };
  }

  // ─────────────────────────────────────────────
  // PÁGINA 1 — CAPA
  // ─────────────────────────────────────────────

  function _renderizarCapa(doc, resultado, opcoes) {
    var cons = resultado.resultados.consolidado || {};
    var dadosPDF = cons.dadosPDF || {};
    var nomeEmpresa = dadosPDF.nomeEmpresa || resultado.resultados.dcf && resultado.resultados.dcf.nomeEmpresa || 'Empresa';
    var dataCalculo = resultado.dataCalculo || '';

    // Faixa verde topo
    var rgbVerde = _hexParaRgb(CORES.primaria);
    doc.setFillColor(rgbVerde.r, rgbVerde.g, rgbVerde.b);
    doc.rect(0, 0, A4.largura, 45, 'F');

    // Logo IMPOST
    if (opcoes.logo) {
      try {
        doc.addImage(opcoes.logo, 'PNG', A4.largura / 2 - 20, 8, 40, 25);
      } catch (e) {
        _renderizarLogoTexto(doc);
      }
    } else {
      _renderizarLogoTexto(doc);
    }

    // Título principal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(31, 41, 55);
    var titulo = 'RELATÓRIO DE PRECIFICAÇÃO';
    doc.text(titulo, A4.largura / 2, 75, { align: 'center' });
    doc.setFontSize(16);
    doc.text('EMPRESARIAL', A4.largura / 2, 85, { align: 'center' });

    // Nome da empresa
    doc.setFontSize(18);
    doc.setTextColor(rgbVerde.r, rgbVerde.g, rgbVerde.b);
    doc.text(nomeEmpresa, A4.largura / 2, 105, { align: 'center' });

    // Linha decorativa
    doc.setDrawColor(rgbVerde.r, rgbVerde.g, rgbVerde.b);
    doc.setLineWidth(1);
    doc.line(60, 112, 150, 112);

    // Info
    doc.setFontSize(11);
    doc.setTextColor(107, 114, 128);
    doc.setFont('helvetica', 'normal');
    var infoY = 125;
    doc.text('Data do Cálculo: ' + formatarData(dataCalculo), A4.largura / 2, infoY, { align: 'center' });
    infoY += 7;
    doc.text('Valuation Engine v' + (resultado.versao || '2.0.0'), A4.largura / 2, infoY, { align: 'center' });

    // Valor recomendado em destaque
    if (cons.valorRecomendado) {
      infoY += 20;
      doc.setFillColor(236, 253, 245);
      doc.roundedRect(40, infoY - 6, 130, 30, 3, 3, 'F');
      doc.setDrawColor(rgbVerde.r, rgbVerde.g, rgbVerde.b);
      doc.setLineWidth(0.5);
      doc.roundedRect(40, infoY - 6, 130, 30, 3, 3, 'S');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text('VALOR RECOMENDADO', A4.largura / 2, infoY + 2, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(21, 128, 61);
      doc.text(formatarMoeda(cons.valorRecomendado), A4.largura / 2, infoY + 16, { align: 'center' });
    }

    // Consultor
    if (opcoes.nomeConsultor) {
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.setFont('helvetica', 'normal');
      doc.text('Elaborado por: ' + opcoes.nomeConsultor, A4.largura / 2, 210, { align: 'center' });
      if (opcoes.crcConsultor) {
        doc.text(opcoes.crcConsultor, A4.largura / 2, 217, { align: 'center' });
      }
    }

    // Faixa verde base
    doc.setFillColor(rgbVerde.r, rgbVerde.g, rgbVerde.b);
    doc.rect(0, A4.altura - 22, A4.largura, 22, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('Documento Confidencial', A4.largura / 2, A4.altura - 10, { align: 'center' });

    _paginaAtual = 1;
  }

  function _renderizarLogoTexto(doc) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(255, 255, 255);
    doc.text('IMPOST.', A4.largura / 2, 28, { align: 'center' });
    doc.setFontSize(9);
    doc.text('Inteligência em Modelagem de Otimização Tributária', A4.largura / 2, 36, { align: 'center' });
  }

  // ─────────────────────────────────────────────
  // PÁGINA 2 — RESUMO EXECUTIVO
  // ─────────────────────────────────────────────

  function _renderizarResumoExecutivo(doc, resultado, opcoes) {
    var cons = resultado.resultados.consolidado || {};
    var dadosPDF = cons.dadosPDF || {};
    var nomeEmpresa = dadosPDF.nomeEmpresa || 'Empresa';
    var dataCalculo = resultado.dataCalculo || '';

    _novaPagina(doc);
    _adicionarCabecalho(doc, nomeEmpresa, dataCalculo);
    var y = MARGEM.topo + 5;

    y = _tituloSecao(doc, 'Resumo Executivo', y);

    // Texto do resumo
    if (cons.resumo) {
      y = _textoNormal(doc, cons.resumo, y);
      y += 3;
    }

    // Box de valor recomendado
    if (cons.faixaNegociacao) {
      var rgbVerde = _hexParaRgb(CORES.primaria);
      doc.setFillColor(236, 253, 245);
      doc.roundedRect(MARGEM.esquerda, y, AREA_UTIL.largura, 32, 2, 2, 'F');
      doc.setDrawColor(rgbVerde.r, rgbVerde.g, rgbVerde.b);
      doc.setLineWidth(0.8);
      doc.roundedRect(MARGEM.esquerda, y, AREA_UTIL.largura, 32, 2, 2, 'S');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text('VALOR RECOMENDADO', A4.largura / 2, y + 8, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(21, 128, 61);
      doc.text(formatarMoeda(cons.valorRecomendado || 0), A4.largura / 2, y + 19, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text(
        'Faixa de Negociação: ' + formatarMoeda(cons.faixaNegociacao.minimo) + '  a  ' + formatarMoeda(cons.faixaNegociacao.maximo),
        A4.largura / 2, y + 28, { align: 'center' }
      );
      y += 38;
    }

    // Tabela comparativa dos 3 métodos
    if (dadosPDF.resultadoPorMetodo && dadosPDF.resultadoPorMetodo.length > 0) {
      y = _subtituloSecao(doc, 'Resultado por Método', y);

      doc.autoTable(Object.assign({}, _estiloTabela(), {
        startY: y,
        head: [['Método', 'Valor Mínimo', 'Valor Mediano', 'Valor Máximo', 'Peso']],
        body: dadosPDF.resultadoPorMetodo.map(function (m) {
          return [m.metodo, m.valorMinimo, m.valorMediano, m.valorMaximo, m.peso];
        }),
        columnStyles: {
          0: { cellWidth: 60, fontStyle: 'bold' },
          1: { cellWidth: 30, halign: 'right' },
          2: { cellWidth: 30, halign: 'right' },
          3: { cellWidth: 30, halign: 'right' },
          4: { cellWidth: 18, halign: 'center' }
        }
      }));
      y = doc.lastAutoTable.finalY + 5;
    }

    // Pesos e justificativa
    if (cons.pesos) {
      y = _subtituloSecao(doc, 'Ponderação', y);
      var pesosData = [
        ['DCF', formatarPct(cons.pesos.dcf)],
        ['Múltiplos', formatarPct(cons.pesos.multiplos)],
        ['Patrimonial', formatarPct(cons.pesos.patrimonial)],
        ['Perfil', cons.pesos.tipo || '']
      ];
      y = _tabelaChaveValor(doc, pesosData, y);

      if (cons.pesos.justificativa) {
        y = _textoNormal(doc, cons.pesos.justificativa, y);
        y += 3;
      }
    }

    // Alertas
    if (cons.alertas && cons.alertas.length > 0) {
      y = _verificarEspacoPagina(doc, y, 30, nomeEmpresa, dataCalculo);
      y = _subtituloSecao(doc, 'Alertas', y);
      for (var i = 0; i < cons.alertas.length; i++) {
        var alerta = cons.alertas[i];
        var corAlerta = alerta.tipo === 'erro' ? CORES.erro : alerta.tipo === 'aviso' ? CORES.aviso : CORES.info;
        var rgbAlerta = _hexParaRgb(corAlerta);

        y = _verificarEspacoPagina(doc, y, 15, nomeEmpresa, dataCalculo);
        doc.setFillColor(rgbAlerta.r, rgbAlerta.g, rgbAlerta.b);
        doc.rect(MARGEM.esquerda, y - 1, 2, 10, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(rgbAlerta.r, rgbAlerta.g, rgbAlerta.b);
        doc.text((alerta.titulo || alerta.tipo || '').toUpperCase(), MARGEM.esquerda + 5, y + 2);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        _corTexto(doc);
        var alertaLinhas = doc.splitTextToSize(alerta.mensagem || '', AREA_UTIL.largura - 10);
        doc.text(alertaLinhas, MARGEM.esquerda + 5, y + 7);
        y += 7 + alertaLinhas.length * 3.5 + 3;
      }
    }

    _adicionarRodape(doc, nomeEmpresa);
    return y;
  }

  // ─────────────────────────────────────────────
  // PÁGINA 3 — FOOTBALL FIELD + PERCENTIS
  // ─────────────────────────────────────────────

  function _renderizarFootballField(doc, resultado, graficos, opcoes) {
    var cons = resultado.resultados.consolidado || {};
    var dadosPDF = cons.dadosPDF || {};
    var nomeEmpresa = dadosPDF.nomeEmpresa || 'Empresa';
    var dataCalculo = resultado.dataCalculo || '';

    _novaPagina(doc);
    _adicionarCabecalho(doc, nomeEmpresa, dataCalculo);
    var y = MARGEM.topo + 5;

    y = _tituloSecao(doc, 'Comparativo de Métodos — Football Field', y);

    // Gráfico Football Field
    if (graficos.footballField) {
      y = _adicionarImagem(doc, graficos.footballField, MARGEM.esquerda, y, AREA_UTIL.largura, 65);
    }

    // Legenda
    if (cons.footballField && cons.footballField.barras) {
      y += 2;
      var barras = cons.footballField.barras;
      var legendaX = MARGEM.esquerda;
      doc.setFontSize(7);
      for (var i = 0; i < barras.length; i++) {
        var rgb = _hexParaRgb(barras[i].cor);
        doc.setFillColor(rgb.r, rgb.g, rgb.b);
        doc.rect(legendaX, y - 2.5, 4, 4, 'F');
        doc.setFont('helvetica', 'normal');
        _corTexto(doc);
        doc.text(barras[i].label + ': ' + formatarMoedaCurta(barras[i].min) + ' — ' + formatarMoedaCurta(barras[i].max), legendaX + 6, y);
        legendaX += 50;
      }
      y += 8;
    }

    // Percentis
    y = _subtituloSecao(doc, 'Distribuição de Valores — Percentis', y);

    if (cons.percentis) {
      var perc = cons.percentis;
      doc.autoTable(Object.assign({}, _estiloTabela(), {
        startY: y,
        head: [['P10', 'P25', 'P50 (Mediana)', 'P75', 'P90']],
        body: [[
          formatarMoeda(perc.p10),
          formatarMoeda(perc.p25),
          formatarMoeda(perc.p50),
          formatarMoeda(perc.p75),
          formatarMoeda(perc.p90)
        ]],
        columnStyles: {
          0: { halign: 'center' }, 1: { halign: 'center' },
          2: { halign: 'center', fontStyle: 'bold' },
          3: { halign: 'center' }, 4: { halign: 'center' }
        }
      }));
      y = doc.lastAutoTable.finalY + 5;
    }

    // Gráfico Percentis
    if (graficos.percentis) {
      y = _adicionarImagem(doc, graficos.percentis, MARGEM.esquerda, y, AREA_UTIL.largura, 25);
    }

    _adicionarRodape(doc, nomeEmpresa);
    return y;
  }

  // ─────────────────────────────────────────────
  // PÁGINA 4 — DCF: PREMISSAS E WACC
  // ─────────────────────────────────────────────

  function _renderizarDCFPremissas(doc, resultado, graficos, opcoes) {
    var dcf = resultado.resultados.dcf;
    if (!dcf || dcf.erro) return;
    var det = dcf.detalhes || {};
    var dadosPDF = (resultado.resultados.consolidado || {}).dadosPDF || {};
    var nomeEmpresa = dadosPDF.nomeEmpresa || dcf.nomeEmpresa || 'Empresa';
    var dataCalculo = resultado.dataCalculo || '';

    _novaPagina(doc);
    _adicionarCabecalho(doc, nomeEmpresa, dataCalculo);
    var y = MARGEM.topo + 5;

    y = _tituloSecao(doc, 'Fluxo de Caixa Descontado (DCF)', y);

    // Premissas
    y = _subtituloSecao(doc, 'Premissas', y);
    var premissas = [
      ['WACC', formatarPct(det.wacc)],
      ['Tipo de WACC', det.waccDetalhes ? det.waccDetalhes.tipo : ''],
      ['Faixa WACC', det.waccDetalhes && det.waccDetalhes.faixa ? formatarPct(det.waccDetalhes.faixa.min) + ' — ' + formatarPct(det.waccDetalhes.faixa.max) : ''],
      ['Taxa de Crescimento', formatarPct(det.taxaCrescimento)],
      ['Taxa Perpétua (g)', formatarPct(det.taxaPerpetua)],
      ['Horizonte', (det.horizonteAnos || 5) + ' anos'],
      ['Setor', det.setor || ''],
      ['Porte', det.porte || ''],
      ['Tipo de Capital', det.tipoCapital || ''],
      ['Dívida Líquida', formatarMoeda(det.dividaLiquida || 0)]
    ];
    y = _tabelaChaveValor(doc, premissas, y);

    // Descontos
    if (det.descontos) {
      y = _subtituloSecao(doc, 'Descontos Aplicados', y);
      var desc = det.descontos;
      var descontosData = [
        ['Equity Bruto', formatarMoeda(desc.equityBruto || 0)],
        ['Desconto Iliquidez (DLOM)', desc.descontoIliquidezLabel || formatarPct(desc.descontoIliquidez)],
        ['Desconto Porte', desc.descontoPorteLabel || formatarPct(desc.descontoPorte)],
        ['Fator Total de Desconto', formatarPct(desc.fatorDesconto)],
        ['Equity Ajustado', formatarMoeda(desc.equityAjustado || 0)]
      ];
      y = _tabelaChaveValor(doc, descontosData, y);
    }

    // Gráfico Composição EV
    if (graficos.composicaoEV) {
      y = _verificarEspacoPagina(doc, y, 70, nomeEmpresa, dataCalculo);
      y = _subtituloSecao(doc, 'Composição do Enterprise Value', y);
      y = _adicionarImagem(doc, graficos.composicaoEV, MARGEM.esquerda + 40, y, 80, 80);
      // Valores ao lado
    }

    _adicionarRodape(doc, nomeEmpresa);
  }

  // ─────────────────────────────────────────────
  // PÁGINA 5 — DCF: PROJEÇÃO ANO A ANO
  // ─────────────────────────────────────────────

  function _renderizarDCFProjecao(doc, resultado, graficos, opcoes) {
    var dcf = resultado.resultados.dcf;
    if (!dcf || dcf.erro) return;
    var det = dcf.detalhes || {};
    var dadosPDF = (resultado.resultados.consolidado || {}).dadosPDF || {};
    var nomeEmpresa = dadosPDF.nomeEmpresa || dcf.nomeEmpresa || 'Empresa';
    var dataCalculo = resultado.dataCalculo || '';

    _novaPagina(doc);
    _adicionarCabecalho(doc, nomeEmpresa, dataCalculo);
    var y = MARGEM.topo + 5;

    y = _tituloSecao(doc, 'Projeção de Fluxo de Caixa', y);

    // Tabela projeção
    var head = [['', 'Receita', 'Custos', 'EBIT', 'Margem', 'NOPAT', 'D&A', 'CAPEX', 'ΔWC', 'FCF', 'VP(FCF)']];
    var body = [];

    // Ano base
    if (det.anoBase) {
      var ab = det.anoBase;
      body.push([
        { content: 'Ano Base', styles: { fontStyle: 'bold' } },
        formatarMoedaCurta(ab.receita),
        formatarMoedaCurta(ab.custos),
        formatarMoedaCurta(ab.ebit),
        formatarPct(ab.margemEBIT),
        formatarMoedaCurta(ab.nopat),
        formatarMoedaCurta(ab.da),
        formatarMoedaCurta(ab.capex),
        formatarMoedaCurta(ab.deltaWC || 0),
        formatarMoedaCurta(ab.fcf),
        '—'
      ]);
    }

    // Anos projetados
    var projecao = det.projecaoAnual || [];
    for (var i = 0; i < projecao.length; i++) {
      var p = projecao[i];
      body.push([
        'Ano ' + p.ano,
        formatarMoedaCurta(p.receita),
        formatarMoedaCurta(p.custos),
        formatarMoedaCurta(p.ebit),
        formatarPct(p.margemEBIT),
        formatarMoedaCurta(p.nopat),
        formatarMoedaCurta(p.da),
        formatarMoedaCurta(p.capex),
        formatarMoedaCurta(p.deltaWC || 0),
        formatarMoedaCurta(p.fcf),
        formatarMoedaCurta(p.vpFcf)
      ]);
    }

    // Valor terminal
    if (det.valorTerminal) {
      body.push([
        { content: 'Valor Terminal', styles: { fontStyle: 'bold' } },
        '', '', '', '', '', '', '', '',
        formatarMoedaCurta(det.valorTerminal),
        formatarMoedaCurta(det.vpValorTerminal)
      ]);
    }

    // Enterprise Value
    if (det.enterpriseValue) {
      body.push([
        { content: 'Enterprise Value', styles: { fontStyle: 'bold', fillColor: [236, 253, 245] } },
        '', '', '', '', '', '', '', '',
        { content: formatarMoedaCurta(det.enterpriseValue), styles: { fontStyle: 'bold', fillColor: [236, 253, 245] } },
        ''
      ]);
    }

    doc.autoTable(Object.assign({}, _estiloTabela(), {
      startY: y,
      head: head,
      body: body,
      styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak', lineColor: [229, 231, 235], lineWidth: 0.2 },
      headStyles: { fillColor: [236, 253, 245], textColor: [21, 128, 61], fontStyle: 'bold', fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { halign: 'right', cellWidth: 16 },
        2: { halign: 'right', cellWidth: 16 },
        3: { halign: 'right', cellWidth: 16 },
        4: { halign: 'center', cellWidth: 13 },
        5: { halign: 'right', cellWidth: 16 },
        6: { halign: 'right', cellWidth: 14 },
        7: { halign: 'right', cellWidth: 14 },
        8: { halign: 'right', cellWidth: 13 },
        9: { halign: 'right', cellWidth: 16 },
        10: { halign: 'right', cellWidth: 16 }
      }
    }));
    y = doc.lastAutoTable.finalY + 5;

    // Gráfico Projeção FCF
    if (graficos.projecaoFCF) {
      y = _verificarEspacoPagina(doc, y, 65, nomeEmpresa, dataCalculo);
      y = _adicionarImagem(doc, graficos.projecaoFCF, MARGEM.esquerda, y, AREA_UTIL.largura, 60);
    }

    _adicionarRodape(doc, nomeEmpresa);
  }

  // ─────────────────────────────────────────────
  // PÁGINA 6 — DCF: CENÁRIOS E SENSIBILIDADE
  // ─────────────────────────────────────────────

  function _renderizarDCFCenarios(doc, resultado, graficos, opcoes) {
    var dcf = resultado.resultados.dcf;
    if (!dcf || dcf.erro) return;
    var det = dcf.detalhes || {};
    var dadosPDF = (resultado.resultados.consolidado || {}).dadosPDF || {};
    var nomeEmpresa = dadosPDF.nomeEmpresa || dcf.nomeEmpresa || 'Empresa';
    var dataCalculo = resultado.dataCalculo || '';

    _novaPagina(doc);
    _adicionarCabecalho(doc, nomeEmpresa, dataCalculo);
    var y = MARGEM.topo + 5;

    y = _tituloSecao(doc, 'Análise de Cenários', y);

    // Tabela cenários
    if (det.cenarios) {
      var cen = det.cenarios;
      doc.autoTable(Object.assign({}, _estiloTabela(), {
        startY: y,
        head: [['', 'Pessimista', 'Base', 'Otimista']],
        body: [
          ['Equity Value', formatarMoeda(cen.pessimista.equityValue), formatarMoeda(cen.base.equityValue), formatarMoeda(cen.otimista.equityValue)],
          ['Enterprise Value', formatarMoeda(cen.pessimista.enterpriseValue), formatarMoeda(cen.base.enterpriseValue), formatarMoeda(cen.otimista.enterpriseValue)],
          ['WACC', formatarPct(cen.pessimista.wacc), formatarPct(cen.base.wacc), formatarPct(cen.otimista.wacc)],
          ['Taxa Crescimento', formatarPct(cen.pessimista.taxaCrescimento), formatarPct(cen.base.taxaCrescimento), formatarPct(cen.otimista.taxaCrescimento)],
          ['Taxa Perpétua', formatarPct(cen.pessimista.taxaPerpetua), formatarPct(cen.base.taxaPerpetua), formatarPct(cen.otimista.taxaPerpetua)],
          ['% Terminal', formatarPct(cen.pessimista.percentualTerminal), formatarPct(cen.base.percentualTerminal), formatarPct(cen.otimista.percentualTerminal)]
        ],
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 35 },
          1: { halign: 'right', cellWidth: 42 },
          2: { halign: 'right', cellWidth: 42, fillColor: [236, 253, 245] },
          3: { halign: 'right', cellWidth: 42 }
        }
      }));
      y = doc.lastAutoTable.finalY + 5;
    }

    // Gráfico cenários
    if (graficos.cenarios) {
      y = _adicionarImagem(doc, graficos.cenarios, MARGEM.esquerda + 15, y, AREA_UTIL.largura - 30, 55);
    }

    // Sensibilidade
    y = _verificarEspacoPagina(doc, y, 80, nomeEmpresa, dataCalculo);
    y = _subtituloSecao(doc, 'Análise de Sensibilidade (WACC × Crescimento Perpétuo)', y);

    if (graficos.sensibilidade) {
      y = _adicionarImagem(doc, graficos.sensibilidade, MARGEM.esquerda, y, AREA_UTIL.largura, 55);
    }

    if (det.sensibilidade && det.sensibilidade.central) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      _corSecundaria(doc);
      doc.text(
        'Cenário central: WACC ' + formatarPct(det.sensibilidade.central.wacc) +
        ' / g ' + formatarPct(det.sensibilidade.central.taxaPerpetua) +
        ' → EV ' + formatarMoeda(det.sensibilidade.central.valor),
        MARGEM.esquerda, y
      );
      y += 5;
    }

    _adicionarRodape(doc, nomeEmpresa);
  }

  // ─────────────────────────────────────────────
  // PÁGINA 7 — DCF: WATERFALL
  // ─────────────────────────────────────────────

  function _renderizarDCFWaterfall(doc, resultado, graficos, opcoes) {
    var cons = resultado.resultados.consolidado || {};
    if (!cons.waterfall) return;
    var dadosPDF = cons.dadosPDF || {};
    var nomeEmpresa = dadosPDF.nomeEmpresa || 'Empresa';
    var dataCalculo = resultado.dataCalculo || '';

    _novaPagina(doc);
    _adicionarCabecalho(doc, nomeEmpresa, dataCalculo);
    var y = MARGEM.topo + 5;

    y = _tituloSecao(doc, 'Decomposição do Valor — Waterfall', y);

    // Gráfico Waterfall
    if (graficos.waterfall) {
      y = _adicionarImagem(doc, graficos.waterfall, MARGEM.esquerda, y, AREA_UTIL.largura, 85);
    }

    // Tabela detalhada
    var etapas = cons.waterfall.etapas || [];
    if (etapas.length > 0) {
      y = _subtituloSecao(doc, 'Detalhamento', y);
      var acum = 0;
      var body = [];
      for (var i = 0; i < etapas.length; i++) {
        var e = etapas[i];
        if (e.tipo === 'subtotal') {
          acum = e.valor;
        } else {
          acum += e.valor;
        }
        var tipoLabel = e.tipo === 'positivo' ? '+' : e.tipo === 'negativo' ? '−' : '=';
        var corLinha = e.tipo === 'subtotal' ? { fillColor: [236, 253, 245], fontStyle: 'bold' } : {};
        body.push([
          { content: tipoLabel, styles: corLinha },
          { content: e.label, styles: corLinha },
          { content: formatarMoeda(e.valor), styles: Object.assign({}, corLinha, { halign: 'right' }) },
          { content: formatarMoeda(acum), styles: Object.assign({}, corLinha, { halign: 'right' }) }
        ]);
      }

      doc.autoTable(Object.assign({}, _estiloTabela(), {
        startY: y,
        head: [['', 'Etapa', 'Valor', 'Acumulado']],
        body: body,
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 70 },
          2: { cellWidth: 40, halign: 'right' },
          3: { cellWidth: 40, halign: 'right' }
        }
      }));
    }

    _adicionarRodape(doc, nomeEmpresa);
  }

  // ─────────────────────────────────────────────
  // PÁGINA 8 — MÚLTIPLOS DE MERCADO
  // ─────────────────────────────────────────────

  function _renderizarMultiplos(doc, resultado, graficos, opcoes) {
    var mult = resultado.resultados.multiplos;
    if (!mult || mult.erro) return;
    var det = mult.detalhes || {};
    var dadosPDF = (resultado.resultados.consolidado || {}).dadosPDF || {};
    var nomeEmpresa = dadosPDF.nomeEmpresa || mult.nomeEmpresa || 'Empresa';
    var dataCalculo = resultado.dataCalculo || '';

    _novaPagina(doc);
    _adicionarCabecalho(doc, nomeEmpresa, dataCalculo);
    var y = MARGEM.topo + 5;

    y = _tituloSecao(doc, 'Avaliação por Múltiplos de Mercado', y);

    // Tabela dos 6 múltiplos
    var metodos = det.metodos || {};
    var chaves = ['evEbitda', 'evEbit', 'evFcf', 'pl', 'evReceita', 'pvpa'];
    var pesos = det.pesos || {};
    var head = [['Múltiplo', 'Múlt.\nMín', 'Múlt.\nMed', 'Múlt.\nMáx', 'Equity\nMín', 'Equity\nMed', 'Equity\nMáx', 'Peso']];
    var body = [];

    for (var i = 0; i < chaves.length; i++) {
      var m = metodos[chaves[i]];
      if (!m) continue;
      var eq = m.equityAjustado || m.equityBruto || {};
      var mu = m.multiploUsado || {};
      body.push([
        m.metodo || chaves[i],
        m.aplicavel ? formatarMultiplo(mu.min) : 'N/A',
        m.aplicavel ? formatarMultiplo(mu.mediana) : 'N/A',
        m.aplicavel ? formatarMultiplo(mu.max) : 'N/A',
        m.aplicavel ? formatarMoedaCurta(eq.min || 0) : 'N/A',
        m.aplicavel ? formatarMoedaCurta(eq.mediana || 0) : 'N/A',
        m.aplicavel ? formatarMoedaCurta(eq.max || 0) : 'N/A',
        formatarPct(pesos[chaves[i]] || 0)
      ]);
    }

    doc.autoTable(Object.assign({}, _estiloTabela(), {
      startY: y,
      head: head,
      body: body,
      styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak', lineColor: [229, 231, 235], lineWidth: 0.2 },
      headStyles: { fillColor: [236, 253, 245], textColor: [21, 128, 61], fontStyle: 'bold', fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 26, fontStyle: 'bold' },
        1: { cellWidth: 16, halign: 'center' },
        2: { cellWidth: 16, halign: 'center' },
        3: { cellWidth: 16, halign: 'center' },
        4: { cellWidth: 22, halign: 'right' },
        5: { cellWidth: 22, halign: 'right' },
        6: { cellWidth: 22, halign: 'right' },
        7: { cellWidth: 16, halign: 'center' }
      }
    }));
    y = doc.lastAutoTable.finalY + 5;

    // Gráfico múltiplos
    if (graficos.multiplos) {
      y = _verificarEspacoPagina(doc, y, 65, nomeEmpresa, dataCalculo);
      y = _adicionarImagem(doc, graficos.multiplos, MARGEM.esquerda, y, AREA_UTIL.largura, 60);
    }

    // Notas
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    _corSecundaria(doc);
    y = _verificarEspacoPagina(doc, y, 15, nomeEmpresa, dataCalculo);
    if (det.multiplosReferencia) {
      doc.text('Fonte: ' + (det.multiplosReferencia.fonte || 'Damodaran'), MARGEM.esquerda, y);
      y += 3;
      doc.text('Setor: ' + (det.multiplosReferencia.setor || det.setor || ''), MARGEM.esquerda, y);
      y += 3;
    }
    if (det.descontos) {
      doc.text(
        'Descontos aplicados: Iliquidez ' + formatarPct(det.descontos.iliquidez) +
        ' | Porte ' + formatarPct(det.descontos.porte) +
        ' | Total ' + formatarPct(det.descontos.total),
        MARGEM.esquerda, y
      );
    }

    _adicionarRodape(doc, nomeEmpresa);
  }

  // ─────────────────────────────────────────────
  // PÁGINA 9 — PATRIMONIAL
  // ─────────────────────────────────────────────

  function _renderizarPatrimonial(doc, resultado, graficos, opcoes) {
    var pat = resultado.resultados.patrimonial;
    if (!pat || pat.erro) return;
    var det = pat.detalhes || {};
    var dadosPDF = (resultado.resultados.consolidado || {}).dadosPDF || {};
    var nomeEmpresa = dadosPDF.nomeEmpresa || 'Empresa';
    var dataCalculo = resultado.dataCalculo || '';

    _novaPagina(doc);
    _adicionarCabecalho(doc, nomeEmpresa, dataCalculo);
    var y = MARGEM.topo + 5;

    y = _tituloSecao(doc, 'Avaliação Patrimonial', y);

    // Ativos
    y = _subtituloSecao(doc, 'Balanço Ajustado', y);
    var bodyBalanco = [];

    // Ativos Circulantes
    if (det.ativosCirculantes) {
      var ac = det.ativosCirculantes;
      bodyBalanco.push([{ content: 'ATIVOS CIRCULANTES', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [236, 253, 245] } }]);
      if (ac.caixa) bodyBalanco.push(['  Caixa e Equivalentes', formatarMoeda(ac.caixa)]);
      if (ac.contasReceber) bodyBalanco.push(['  Contas a Receber (ajustado)', formatarMoeda(ac.contasReceber.ajustado || ac.contasReceber.original)]);
      if (ac.estoques) bodyBalanco.push(['  Estoques (ajustado)', formatarMoeda(ac.estoques.ajustado || ac.estoques.original)]);
      if (ac.outros) bodyBalanco.push(['  Outros', formatarMoeda(ac.outros)]);
      bodyBalanco.push([{ content: '  Total Circulante', styles: { fontStyle: 'bold' } }, { content: formatarMoeda(ac.total), styles: { fontStyle: 'bold' } }]);
    }

    // Ativos Não Circulantes
    if (det.ativosNaoCirculantes) {
      var anc = det.ativosNaoCirculantes;
      bodyBalanco.push([{ content: 'ATIVOS NÃO CIRCULANTES', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [236, 253, 245] } }]);
      if (anc.imoveis) bodyBalanco.push(['  Imóveis', formatarMoeda(anc.imoveis.valorMercado || anc.imoveis.contabil)]);
      if (anc.veiculos) bodyBalanco.push(['  Veículos', formatarMoeda(anc.veiculos.valorMercado || anc.veiculos.contabil)]);
      if (anc.maquinas) bodyBalanco.push(['  Máquinas e Equipamentos', formatarMoeda(anc.maquinas.valorMercado || anc.maquinas.contabil)]);
      if (anc.investimentos) bodyBalanco.push(['  Investimentos', formatarMoeda(anc.investimentos)]);
      if (anc.outros) bodyBalanco.push(['  Outros', formatarMoeda(anc.outros)]);
      bodyBalanco.push([{ content: '  Total Não Circulante', styles: { fontStyle: 'bold' } }, { content: formatarMoeda(anc.total), styles: { fontStyle: 'bold' } }]);
    }

    // Total Tangíveis
    bodyBalanco.push([{ content: 'TOTAL ATIVOS TANGÍVEIS', styles: { fontStyle: 'bold', fillColor: [220, 252, 231] } }, { content: formatarMoeda(det.totalAtivosTangiveis || 0), styles: { fontStyle: 'bold', fillColor: [220, 252, 231] } }]);

    // Passivos
    if (det.passivos) {
      bodyBalanco.push([{ content: 'PASSIVOS', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [254, 226, 226] } }]);
      var pc = det.passivos.circulantes || {};
      if (pc.fornecedores) bodyBalanco.push(['  Fornecedores', formatarMoeda(pc.fornecedores)]);
      if (pc.salarios) bodyBalanco.push(['  Salários e Encargos', formatarMoeda(pc.salarios)]);
      if (pc.impostos) bodyBalanco.push(['  Impostos', formatarMoeda(pc.impostos)]);
      if (pc.emprestimosCP) bodyBalanco.push(['  Empréstimos CP', formatarMoeda(pc.emprestimosCP)]);
      if (pc.outros) bodyBalanco.push(['  Outros Circulantes', formatarMoeda(pc.outros)]);
      var pnc = det.passivos.naoCirculantes || {};
      if (pnc.emprestimosLP) bodyBalanco.push(['  Empréstimos LP', formatarMoeda(pnc.emprestimosLP)]);
      if (pnc.provisoes) bodyBalanco.push(['  Provisões', formatarMoeda(pnc.provisoes)]);
      if (pnc.outros) bodyBalanco.push(['  Outros Não Circulantes', formatarMoeda(pnc.outros)]);
      bodyBalanco.push([{ content: '  Total Passivos', styles: { fontStyle: 'bold' } }, { content: formatarMoeda(det.passivos.total), styles: { fontStyle: 'bold' } }]);
    }

    // PL Ajustado
    bodyBalanco.push([
      { content: 'PL AJUSTADO (TANGÍVEL)', styles: { fontStyle: 'bold', fillColor: [236, 253, 245], fontSize: 9 } },
      { content: formatarMoeda(det.plAjustadoTangivel || 0), styles: { fontStyle: 'bold', fillColor: [236, 253, 245], fontSize: 9 } }
    ]);

    doc.autoTable(Object.assign({}, _estiloTabela(), {
      startY: y,
      body: bodyBalanco,
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 60, halign: 'right' }
      }
    }));
    y = doc.lastAutoTable.finalY + 5;

    // Intangíveis
    if (det.intangiveis && det.intangiveis.declarados) {
      y = _verificarEspacoPagina(doc, y, 30, nomeEmpresa, dataCalculo);
      y = _subtituloSecao(doc, 'Intangíveis Declarados', y);
      var intg = det.intangiveis.declarados;
      var bodyIntg = [];
      if (intg.marca) bodyIntg.push(['Marca', formatarMoeda(intg.marca)]);
      if (intg.carteiraClientes) bodyIntg.push(['Carteira de Clientes', formatarMoeda(intg.carteiraClientes)]);
      if (intg.contratos) bodyIntg.push(['Contratos', formatarMoeda(intg.contratos)]);
      if (intg.licencas) bodyIntg.push(['Licenças', formatarMoeda(intg.licencas)]);
      if (intg.knowHow) bodyIntg.push(['Know-How', formatarMoeda(intg.knowHow)]);
      if (intg.goodwill) bodyIntg.push(['Goodwill', formatarMoeda(intg.goodwill)]);
      bodyIntg.push([{ content: 'Total Bruto', styles: { fontStyle: 'bold' } }, { content: formatarMoeda(intg.totalBruto || intg.total), styles: { fontStyle: 'bold' } }]);

      doc.autoTable(Object.assign({}, _estiloTabela(), {
        startY: y,
        body: bodyIntg,
        columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 60, halign: 'right' } }
      }));
      y = doc.lastAutoTable.finalY + 5;
    }

    // 3 Cenários
    if (det.cenarios) {
      y = _verificarEspacoPagina(doc, y, 25, nomeEmpresa, dataCalculo);
      y = _subtituloSecao(doc, 'Cenários de Avaliação', y);
      var cen = det.cenarios;
      doc.autoTable(Object.assign({}, _estiloTabela(), {
        startY: y,
        head: [['', 'Conservador', 'Moderado', 'Otimista']],
        body: [
          ['Valor', formatarMoeda(cen.conservador.valor), formatarMoeda(cen.moderado.valor), formatarMoeda(cen.otimista.valor)],
          ['Descrição', cen.conservador.descricao || '', cen.moderado.descricao || '', cen.otimista.descricao || '']
        ],
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 22 },
          1: { cellWidth: 48 }, 2: { cellWidth: 48, fillColor: [236, 253, 245] }, 3: { cellWidth: 48 }
        }
      }));
      y = doc.lastAutoTable.finalY + 5;
    }

    // Ajustes realizados
    if (det.ajustes && det.ajustes.length > 0) {
      y = _verificarEspacoPagina(doc, y, 25, nomeEmpresa, dataCalculo);
      y = _subtituloSecao(doc, 'Ajustes Realizados', y);
      doc.autoTable(Object.assign({}, _estiloTabela(), {
        startY: y,
        head: [['Item', 'Contábil', 'Ajustado', 'Diferença', 'Motivo']],
        body: det.ajustes.map(function (a) {
          return [a.item, formatarMoeda(a.contabil), formatarMoeda(a.ajustado), formatarMoeda(a.diferenca), a.motivo || ''];
        }),
        columnStyles: {
          0: { cellWidth: 30, fontStyle: 'bold' },
          1: { cellWidth: 25, halign: 'right' },
          2: { cellWidth: 25, halign: 'right' },
          3: { cellWidth: 25, halign: 'right' },
          4: { cellWidth: 55 }
        }
      }));
    }

    _adicionarRodape(doc, nomeEmpresa);
  }

  // ─────────────────────────────────────────────
  // PÁGINA 10 — INDICADORES + SCORECARD
  // ─────────────────────────────────────────────

  function _renderizarIndicadores(doc, resultado, graficos, opcoes) {
    var ind = resultado.resultados.indicadores;
    if (!ind) return;
    var dadosPDF = (resultado.resultados.consolidado || {}).dadosPDF || {};
    var nomeEmpresa = dadosPDF.nomeEmpresa || 'Empresa';
    var dataCalculo = resultado.dataCalculo || '';

    _novaPagina(doc);
    _adicionarCabecalho(doc, nomeEmpresa, dataCalculo);
    var y = MARGEM.topo + 5;

    y = _tituloSecao(doc, 'Indicadores Financeiros', y);

    // Scorecard radar
    if (graficos.scorecard && ind.scorecard) {
      var sc = ind.scorecard;
      // Nota geral em destaque
      var rgbVerde = _hexParaRgb(CORES.primaria);
      doc.setFillColor(236, 253, 245);
      doc.roundedRect(MARGEM.esquerda, y, 55, 18, 2, 2, 'F');
      doc.setDrawColor(rgbVerde.r, rgbVerde.g, rgbVerde.b);
      doc.roundedRect(MARGEM.esquerda, y, 55, 18, 2, 2, 'S');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(21, 128, 61);
      doc.text((sc.notaGeral || 0).toFixed(1) + '/10', MARGEM.esquerda + 5, y + 11);
      doc.setFontSize(9);
      doc.text((sc.classificacaoGeral || '').toUpperCase(), MARGEM.esquerda + 32, y + 11);

      // Gráfico radar ao lado
      _adicionarImagem(doc, graficos.scorecard, MARGEM.esquerda + 60, y - 5, 70, 70);
      y += 70;
    }

    // Tabela de indicadores por grupo
    var grupos = ['rentabilidade', 'margens', 'liquidez', 'eficiencia'];
    var grupoNomes = ['Rentabilidade', 'Margens', 'Liquidez', 'Eficiência'];

    for (var g = 0; g < grupos.length; g++) {
      var grupo = ind[grupos[g]];
      if (!grupo) continue;

      y = _verificarEspacoPagina(doc, y, 30, nomeEmpresa, dataCalculo);
      y = _subtituloSecao(doc, grupoNomes[g], y);

      var chaves = Object.keys(grupo);
      var bodyInd = [];
      for (var k = 0; k < chaves.length; k++) {
        var item = grupo[chaves[k]];
        if (!item || !item.sigla) continue;

        var classif = item.classificacao || '';
        var corClassif = classif === 'excelente' ? [34, 197, 94] :
                         classif === 'bom' ? [59, 130, 246] :
                         classif === 'regular' ? [245, 158, 11] :
                         classif === 'ruim' ? [220, 38, 38] : [156, 163, 175];

        bodyInd.push([
          item.sigla,
          chaves[k],
          item.valorFormatado || '',
          { content: classif, styles: { textColor: corClassif, fontStyle: 'bold' } },
          item.referenciasSetor ? 'Bom: ' + (item.referenciasSetor.bom != null ? formatarPct(item.referenciasSetor.bom) : '') : ''
        ]);
      }

      if (bodyInd.length > 0) {
        doc.autoTable(Object.assign({}, _estiloTabela(), {
          startY: y,
          head: [['Sigla', 'Indicador', 'Valor', 'Classificação', 'Ref. Setor']],
          body: bodyInd,
          styles: { fontSize: 7, cellPadding: 1.5 },
          columnStyles: {
            0: { cellWidth: 18, fontStyle: 'bold' },
            1: { cellWidth: 40 },
            2: { cellWidth: 30, halign: 'right' },
            3: { cellWidth: 25, halign: 'center' },
            4: { cellWidth: 35 }
          }
        }));
        y = doc.lastAutoTable.finalY + 4;
      }
    }

    _adicionarRodape(doc, nomeEmpresa);
  }

  // ─────────────────────────────────────────────
  // PÁGINA 11 — DUPONT
  // ─────────────────────────────────────────────

  function _renderizarDuPont(doc, resultado, graficos, opcoes) {
    var ind = resultado.resultados.indicadores;
    if (!ind || !ind.dupont) return;
    var dp = ind.dupont;
    var dadosPDF = (resultado.resultados.consolidado || {}).dadosPDF || {};
    var nomeEmpresa = dadosPDF.nomeEmpresa || 'Empresa';
    var dataCalculo = resultado.dataCalculo || '';

    _novaPagina(doc);
    _adicionarCabecalho(doc, nomeEmpresa, dataCalculo);
    var y = MARGEM.topo + 5;

    y = _tituloSecao(doc, 'Análise DuPont', y);

    // Gráfico
    if (graficos.dupont) {
      y = _adicionarImagem(doc, graficos.dupont, MARGEM.esquerda + 15, y, AREA_UTIL.largura - 30, 50);
    }

    // Fórmula visual
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    _corTexto(doc);
    var formula = formatarPct(dp.margemLiquida) + '  ×  ' + (dp.giroAtivo || 0).toFixed(2).replace('.', ',') + 'x  ×  ' + (dp.multiplicadorAlavancagem || 0).toFixed(2).replace('.', ',') + 'x  =  ROE ' + formatarPct(dp.roe);
    doc.text(formula, A4.largura / 2, y, { align: 'center' });
    y += 8;

    // Interpretação
    if (dp.interpretacao) {
      y = _textoNormal(doc, dp.interpretacao, y);
      y += 3;
    }

    // Ranking de drivers
    if (dp.analise && dp.analise.ranking) {
      y = _subtituloSecao(doc, 'Ranking de Drivers', y);
      doc.autoTable(Object.assign({}, _estiloTabela(), {
        startY: y,
        head: [['#', 'Driver', 'Contribuição']],
        body: dp.analise.ranking.map(function (r, i) {
          return [i + 1, r.driver || r, r.contribuicao || ''];
        }),
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 60 },
          2: { cellWidth: 60 }
        }
      }));
      y = doc.lastAutoTable.finalY + 5;
    }

    // Componentes
    if (dp.componentes) {
      y = _subtituloSecao(doc, 'Componentes', y);
      var compData = [
        ['Lucro Líquido', formatarMoeda(dp.componentes.lucroLiquido)],
        ['Receita', formatarMoeda(dp.componentes.receita)],
        ['Ativo Total', formatarMoeda(dp.componentes.ativo)],
        ['Patrimônio Líquido', formatarMoeda(dp.componentes.patrimonioLiquido)]
      ];
      y = _tabelaChaveValor(doc, compData, y);
    }

    // Recomendações
    if (dp.analise && dp.analise.recomendacoes && dp.analise.recomendacoes.length > 0) {
      y = _verificarEspacoPagina(doc, y, 20, nomeEmpresa, dataCalculo);
      y = _subtituloSecao(doc, 'Recomendações', y);
      for (var i = 0; i < dp.analise.recomendacoes.length; i++) {
        y = _verificarEspacoPagina(doc, y, 8, nomeEmpresa, dataCalculo);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        _corTexto(doc);
        var rec = '• ' + dp.analise.recomendacoes[i];
        var linhas = doc.splitTextToSize(rec, AREA_UTIL.largura);
        doc.text(linhas, MARGEM.esquerda + 3, y);
        y += linhas.length * 4 + 2;
      }
    }

    _adicionarRodape(doc, nomeEmpresa);
  }

  // ─────────────────────────────────────────────
  // PÁGINA 12 — DRE / BALANÇO (se fornecidos)
  // ─────────────────────────────────────────────

  function _renderizarDREBalanco(doc, resultado, opcoes) {
    var temDRE = opcoes.dre && opcoes.dre.valido;
    var temBalanco = opcoes.balanco && opcoes.balanco.valido;
    if (!temDRE && !temBalanco) return;

    var dadosPDF = (resultado.resultados.consolidado || {}).dadosPDF || {};
    var nomeEmpresa = dadosPDF.nomeEmpresa || 'Empresa';
    var dataCalculo = resultado.dataCalculo || '';

    _novaPagina(doc);
    _adicionarCabecalho(doc, nomeEmpresa, dataCalculo);
    var y = MARGEM.topo + 5;

    if (temDRE) {
      y = _tituloSecao(doc, 'Demonstração do Resultado (DRE)', y);
      var dre = opcoes.dre;
      var bodyDRE = [];
      var camposDRE = [
        ['Receita Bruta', 'receitaBruta'], ['(-) Deduções', 'deducoes'], ['(=) Receita Líquida', 'receitaLiquida'],
        ['(-) CPV/CMV', 'custos'], ['(=) Lucro Bruto', 'lucroBruto'],
        ['(-) Despesas Operacionais', 'despesasOperacionais'], ['(=) EBITDA', 'ebitda'],
        ['(-) Depreciação e Amortização', 'depreciacao'], ['(=) EBIT', 'ebit'],
        ['(-) Resultado Financeiro', 'resultadoFinanceiro'], ['(-) IR/CSLL', 'impostos'],
        ['(=) Lucro Líquido', 'lucroLiquido']
      ];
      for (var i = 0; i < camposDRE.length; i++) {
        var val = dre[camposDRE[i][1]];
        if (val != null) {
          var isTotal = camposDRE[i][0].indexOf('(=)') === 0;
          bodyDRE.push([
            { content: camposDRE[i][0], styles: isTotal ? { fontStyle: 'bold', fillColor: [236, 253, 245] } : {} },
            { content: formatarMoeda(val), styles: isTotal ? { fontStyle: 'bold', fillColor: [236, 253, 245], halign: 'right' } : { halign: 'right' } }
          ]);
        }
      }
      doc.autoTable(Object.assign({}, _estiloTabela(), {
        startY: y, body: bodyDRE,
        columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 60, halign: 'right' } }
      }));
      y = doc.lastAutoTable.finalY + 8;
    }

    if (temBalanco) {
      y = _verificarEspacoPagina(doc, y, 40, nomeEmpresa, dataCalculo);
      y = _tituloSecao(doc, 'Balanço Patrimonial', y);
      var bal = opcoes.balanco;
      var bodyBal = [];
      var camposBal = [
        ['ATIVO', null, true], ['Ativo Circulante', 'ativoCirculante'], ['Ativo Não Circulante', 'ativoNaoCirculante'],
        ['Total Ativo', 'ativoTotal', true],
        ['PASSIVO + PL', null, true], ['Passivo Circulante', 'passivoCirculante'], ['Passivo Não Circulante', 'passivoNaoCirculante'],
        ['Total Passivo', 'passivoTotal'], ['Patrimônio Líquido', 'patrimonioLiquido', true],
        ['Total Passivo + PL', 'passivoPLTotal', true]
      ];
      for (var i = 0; i < camposBal.length; i++) {
        var campo = camposBal[i];
        var val = campo[1] ? bal[campo[1]] : null;
        var isBold = campo[2];
        bodyBal.push([
          { content: campo[0], styles: isBold ? { fontStyle: 'bold', fillColor: [236, 253, 245] } : {} },
          { content: val != null ? formatarMoeda(val) : '', styles: isBold ? { fontStyle: 'bold', fillColor: [236, 253, 245], halign: 'right' } : { halign: 'right' } }
        ]);
      }
      doc.autoTable(Object.assign({}, _estiloTabela(), {
        startY: y, body: bodyBal,
        columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 60, halign: 'right' } }
      }));
    }

    _adicionarRodape(doc, nomeEmpresa);
  }

  // ─────────────────────────────────────────────
  // PÁGINA 13 — HISTÓRICO (se fornecido)
  // ─────────────────────────────────────────────

  function _renderizarHistorico(doc, resultado, opcoes) {
    if (!opcoes.historico || !opcoes.historico.valido) return;
    var hist = opcoes.historico;
    var dadosPDF = (resultado.resultados.consolidado || {}).dadosPDF || {};
    var nomeEmpresa = dadosPDF.nomeEmpresa || 'Empresa';
    var dataCalculo = resultado.dataCalculo || '';

    _novaPagina(doc);
    _adicionarCabecalho(doc, nomeEmpresa, dataCalculo);
    var y = MARGEM.topo + 5;

    y = _tituloSecao(doc, 'Evolução Histórica', y);

    // Tabela de evolução por ano
    if (hist.anos && hist.anos.length > 0) {
      var headHist = ['Ano'];
      var metricas = ['receita', 'lucro', 'ebitda', 'margemEBITDA', 'roe'];
      var metricasLabel = ['Receita', 'Lucro Líq.', 'EBITDA', 'Margem EBITDA', 'ROE'];

      for (var m = 0; m < metricas.length; m++) {
        headHist.push(metricasLabel[m]);
      }

      var bodyHist = [];
      for (var i = 0; i < hist.anos.length; i++) {
        var ano = hist.anos[i];
        var linha = [ano.ano || ''];
        for (var m = 0; m < metricas.length; m++) {
          var val = ano[metricas[m]];
          if (metricas[m] === 'margemEBITDA' || metricas[m] === 'roe') {
            linha.push(val != null ? formatarPct(val) : '—');
          } else {
            linha.push(val != null ? formatarMoedaCurta(val) : '—');
          }
        }
        bodyHist.push(linha);
      }

      doc.autoTable(Object.assign({}, _estiloTabela(), {
        startY: y,
        head: [headHist],
        body: bodyHist,
        columnStyles: { 0: { cellWidth: 18, fontStyle: 'bold' } }
      }));
      y = doc.lastAutoTable.finalY + 5;
    }

    // CAGRs
    if (hist.cagrs) {
      y = _subtituloSecao(doc, 'Taxas de Crescimento (CAGR)', y);
      var cagrData = Object.keys(hist.cagrs).map(function (k) {
        return [k, formatarPct(hist.cagrs[k])];
      });
      y = _tabelaChaveValor(doc, cagrData, y);
    }

    // Tendências
    if (hist.tendencias && hist.tendencias.length > 0) {
      y = _subtituloSecao(doc, 'Tendências Observadas', y);
      for (var i = 0; i < hist.tendencias.length; i++) {
        y = _textoNormal(doc, '• ' + hist.tendencias[i], y);
      }
    }

    _adicionarRodape(doc, nomeEmpresa);
  }

  // ─────────────────────────────────────────────
  // PENÚLTIMA PÁGINA — GLOSSÁRIO
  // ─────────────────────────────────────────────

  function _renderizarGlossario(doc, resultado, opcoes) {
    if (opcoes.incluirGlossario === false) return;
    var cons = resultado.resultados.consolidado || {};
    var dadosPDF = cons.dadosPDF || {};
    var glossario = dadosPDF.glossario;
    if (!glossario) return;

    var nomeEmpresa = dadosPDF.nomeEmpresa || 'Empresa';
    var dataCalculo = resultado.dataCalculo || '';

    _novaPagina(doc);
    _adicionarCabecalho(doc, nomeEmpresa, dataCalculo);
    var y = MARGEM.topo + 5;

    y = _tituloSecao(doc, 'Glossário de Termos', y);

    // Converter glossário para array
    var termos = [];
    var chaves = Object.keys(glossario);
    for (var i = 0; i < chaves.length; i++) {
      var g = glossario[chaves[i]];
      termos.push([g.sigla || chaves[i], g.nome || '', g.explicacao || '']);
    }

    // Pode ocupar 2 páginas
    doc.autoTable(Object.assign({}, _estiloTabela(), {
      startY: y,
      head: [['Sigla', 'Termo', 'Explicação']],
      body: termos,
      styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak', lineColor: [229, 231, 235], lineWidth: 0.2 },
      headStyles: { fillColor: [236, 253, 245], textColor: [21, 128, 61], fontStyle: 'bold', fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 22, fontStyle: 'bold' },
        1: { cellWidth: 42 },
        2: { cellWidth: 'auto' }
      },
      didDrawPage: function (data) {
        _adicionarCabecalho(doc, nomeEmpresa, dataCalculo);
        _adicionarRodape(doc, nomeEmpresa);
        _paginaAtual++;
      }
    }));
    // Ajustar contagem (didDrawPage incrementa nas páginas extras)
    _paginaAtual--;
    _adicionarRodape(doc, nomeEmpresa);
  }

  // ─────────────────────────────────────────────
  // ÚLTIMA PÁGINA — DISCLAIMER
  // ─────────────────────────────────────────────

  function _renderizarDisclaimer(doc, resultado, opcoes) {
    if (opcoes.incluirDisclaimer === false) return;
    var cons = resultado.resultados.consolidado || {};
    var dadosPDF = cons.dadosPDF || {};
    var nomeEmpresa = dadosPDF.nomeEmpresa || 'Empresa';
    var dataCalculo = resultado.dataCalculo || '';

    _novaPagina(doc);
    _adicionarCabecalho(doc, nomeEmpresa, dataCalculo);
    var y = MARGEM.topo + 5;

    y = _tituloSecao(doc, 'Limitações e Responsabilidades', y);

    var disclaimer = dadosPDF.disclaimer || 'Este relatório é uma estimativa técnica simplificada e não substitui uma avaliação formal realizada por profissional habilitado. Os valores apresentados são baseados em premissas e projeções que podem não se confirmar. Recomenda-se a consulta com especialistas antes de tomar decisões baseadas neste documento.';

    y = _textoNormal(doc, disclaimer, y);
    y += 10;

    // Linha de assinatura (se consultor)
    if (opcoes.nomeConsultor) {
      y += 15;
      doc.setDrawColor(31, 41, 55);
      doc.setLineWidth(0.3);
      doc.line(MARGEM.esquerda + 20, y, MARGEM.esquerda + 100, y);
      y += 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      _corTexto(doc);
      doc.text(opcoes.nomeConsultor, MARGEM.esquerda + 60, y, { align: 'center' });
      if (opcoes.crcConsultor) {
        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        _corSecundaria(doc);
        doc.text(opcoes.crcConsultor, MARGEM.esquerda + 60, y, { align: 'center' });
      }
      y += 10;
    }

    // Data e local
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    _corSecundaria(doc);
    doc.text(formatarData(dataCalculo), A4.largura / 2, y, { align: 'center' });

    // Rodapé final
    y = A4.altura - 25;
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text(
      'Gerado por IMPOST. — Inteligência em Modelagem de Otimização Tributária v' + (resultado.versao || '2.0.0'),
      A4.largura / 2, y, { align: 'center' }
    );

    _adicionarRodape(doc, nomeEmpresa);
  }

  // ─────────────────────────────────────────────
  // EXPORTAR PDF — FUNÇÃO PRINCIPAL
  // ─────────────────────────────────────────────

  async function exportarPDF(resultado, opcoes) {
    if (!resultado || !resultado.resultados) {
      throw new Error('Resultado de valuation inválido ou ausente.');
    }
    opcoes = opcoes || {};
    qualidade = opcoes.qualidadeGraficos || 2;

    var jsPDF = window.jspdf && window.jspdf.jsPDF ? window.jspdf.jsPDF : window.jsPDF;
    if (!jsPDF) throw new Error('jsPDF não encontrado. Carregue a biblioteca antes deste script.');

    var doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    _paginaAtual = 0;

    var res = resultado.resultados;
    var cons = res.consolidado || {};

    // ── Gerar todos os gráficos em paralelo ──
    var graficos = {};
    var promises = [];

    if (cons.footballField) {
      promises.push(gerarGraficoFootballField(cons.footballField).then(function (img) { graficos.footballField = img; }));
    }
    if (cons.waterfall) {
      promises.push(gerarGraficoWaterfall(cons.waterfall).then(function (img) { graficos.waterfall = img; }));
    }
    if (cons.percentis) {
      promises.push(gerarGraficoPercentis(cons.percentis).then(function (img) { graficos.percentis = img; }));
    }
    if (res.dcf && !res.dcf.erro && res.dcf.detalhes) {
      var det = res.dcf.detalhes;
      if (det.composicao) {
        promises.push(gerarGraficoComposicaoEV(det).then(function (img) { graficos.composicaoEV = img; }));
      }
      if (det.projecaoAnual) {
        promises.push(gerarGraficoProjecaoFCF(det).then(function (img) { graficos.projecaoFCF = img; }));
      }
      if (det.sensibilidade) {
        promises.push(gerarGraficoSensibilidade(det.sensibilidade).then(function (img) { graficos.sensibilidade = img; }));
      }
      if (det.cenarios) {
        promises.push(gerarGraficoCenarios(det).then(function (img) { graficos.cenarios = img; }));
      }
    }
    if (res.multiplos && !res.multiplos.erro && res.multiplos.detalhes) {
      promises.push(gerarGraficoMultiplos(res.multiplos.detalhes).then(function (img) { graficos.multiplos = img; }));
    }
    if (res.indicadores) {
      if (res.indicadores.scorecard) {
        promises.push(gerarGraficoScorecard(res.indicadores.scorecard).then(function (img) { graficos.scorecard = img; }));
      }
      if (res.indicadores.dupont) {
        promises.push(gerarGraficoDuPont(res.indicadores.dupont).then(function (img) { graficos.dupont = img; }));
      }
    }

    await Promise.all(promises);

    // ── Renderizar páginas ──

    // Página 1 — Capa
    if (opcoes.incluirCapa !== false) {
      _renderizarCapa(doc, resultado, opcoes);
    } else {
      _paginaAtual = 0;
    }

    // Página 2 — Resumo Executivo
    _renderizarResumoExecutivo(doc, resultado, opcoes);

    // Página 3 — Football Field + Percentis
    if (cons.footballField || cons.percentis) {
      _renderizarFootballField(doc, resultado, graficos, opcoes);
    }

    // Páginas 4-7 — DCF
    if (res.dcf && !res.dcf.erro) {
      _renderizarDCFPremissas(doc, resultado, graficos, opcoes);
      _renderizarDCFProjecao(doc, resultado, graficos, opcoes);
      _renderizarDCFCenarios(doc, resultado, graficos, opcoes);
      _renderizarDCFWaterfall(doc, resultado, graficos, opcoes);
    }

    // Página 8 — Múltiplos
    if (res.multiplos && !res.multiplos.erro) {
      _renderizarMultiplos(doc, resultado, graficos, opcoes);
    }

    // Página 9 — Patrimonial
    if (res.patrimonial && !res.patrimonial.erro) {
      _renderizarPatrimonial(doc, resultado, graficos, opcoes);
    }

    // Página 10 — Indicadores
    if (res.indicadores) {
      _renderizarIndicadores(doc, resultado, graficos, opcoes);
    }

    // Página 11 — DuPont
    if (res.indicadores && res.indicadores.dupont) {
      _renderizarDuPont(doc, resultado, graficos, opcoes);
    }

    // Página 12 — DRE/Balanço
    _renderizarDREBalanco(doc, resultado, opcoes);

    // Página 13 — Histórico
    _renderizarHistorico(doc, resultado, opcoes);

    // Penúltima — Glossário
    _renderizarGlossario(doc, resultado, opcoes);

    // Última — Disclaimer
    _renderizarDisclaimer(doc, resultado, opcoes);

    // ── Atualizar total de páginas ──
    _totalPaginas = _paginaAtual;
    var totalPagesExp = _totalPaginas;
    var pageCount = doc.internal.getNumberOfPages();
    for (var i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      // Substituir placeholder {totalPaginas}
      // jsPDF não suporta replace nativo — re-renderizar rodapés seria complexo
      // Solução: usar putTotalPages
    }
    // Alternativa simples: usar o jsPDF internal pages
    // Para cada página, buscar e substituir o texto
    doc.putTotalPages('{totalPaginas}');

    return doc.output('blob');
  }

  // ─────────────────────────────────────────────
  // DOWNLOAD
  // ─────────────────────────────────────────────

  function download(blob, nomeArquivo) {
    if (!blob) return;
    nomeArquivo = nomeArquivo || 'Valuation_Relatorio.pdf';
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  // ─────────────────────────────────────────────
  // TESTAR — gera PDF de demo
  // ─────────────────────────────────────────────

  function testar() {
    // Dados de demo mínimos
    var resultadoDemo = {
      versao: '2.0.0',
      dataCalculo: '2026-02-28',
      formato: 'novo',
      erro: false,
      alertas: [],
      resultados: {
        dcf: {
          modulo: 'DCF', nomeEmpresa: 'TechBrasil Ltda (DEMO)',
          dataCalculo: '2026-02-28',
          valorMinimo: 6303548, valorMediano: 8706407, valorMaximo: 11516753,
          equityValue: 8706407, erro: false, alertas: [],
          detalhes: {
            enterpriseValue: 13403539, equityValue: 8706407, equityBruto: 12803539,
            descontos: {
              equityBruto: 12803539, descontoIliquidez: 0.20, descontoIliquidezLabel: '20,0% (capital fechado — DLOM)',
              descontoPorte: 0.15, descontoPorteLabel: '15,0% (pequena)', fatorDesconto: 0.68, equityAjustado: 8706407
            },
            wacc: 0.18, waccDetalhes: { tipo: 'sugerido', valor: 0.18, faixa: { min: 0.15, sugerido: 0.18, max: 0.22 } },
            taxaCrescimento: 0.08, taxaPerpetua: 0.03, horizonteAnos: 5,
            dividaLiquida: 600000, tipoCapital: 'fechado', porte: 'pequena', setor: 'tecnologia',
            anoBase: { receita: 4500000, custos: 2700000, ebit: 1800000, margemEBIT: 0.40, nopat: 1620000, da: 300000, capex: 300000, deltaWC: 0, fcf: 1620000, margemFCF: 0.36 },
            projecaoAnual: [
              { ano: 1, receita: 4860000, custos: 2916000, ebit: 1944000, margemEBIT: 0.40, nopat: 1749600, da: 324000, capex: 324000, deltaWC: 0, fcf: 1749600, vpFcf: 1482712 },
              { ano: 2, receita: 5248800, custos: 3149280, ebit: 2099520, margemEBIT: 0.40, nopat: 1889568, da: 349920, capex: 349920, deltaWC: 0, fcf: 1889568, vpFcf: 1357371 },
              { ano: 3, receita: 5668704, custos: 3401222, ebit: 2267482, margemEBIT: 0.40, nopat: 2040733, da: 377914, capex: 377914, deltaWC: 0, fcf: 2040733, vpFcf: 1242854 },
              { ano: 4, receita: 6114200, custos: 3673320, ebit: 2448880, margemEBIT: 0.40, nopat: 2203992, da: 408027, capex: 408027, deltaWC: 0, fcf: 2203992, vpFcf: 1138043 },
              { ano: 5, receita: 6603336, custos: 3966802, ebit: 2644534, margemEBIT: 0.40, nopat: 2380082, da: 440669, capex: 440669, deltaWC: 0, fcf: 2380082, vpFcf: 1041094 }
            ],
            valorTerminal: 16344806, vpValorTerminal: 7144465,
            composicao: { valorFluxos: 6259074, valorTerminal: 7144465, percentualFluxos: 0.467, percentualTerminal: 0.533 },
            sensibilidade: {
              linhas: [0.16, 0.17, 0.18, 0.19, 0.20],
              linhasLabel: 'WACC', colunas: [0.01, 0.02, 0.03, 0.04, 0.05],
              colunasLabel: 'Crescimento Perpétuo (g)',
              valores: [
                [14201355, 15610488, 17346432, 19592230, 22593710],
                [12509200, 13625157, 14987302, 16675000, 18808640],
                [11120900, 12029100, 13100540, 14385200, 15954680],
                [9963000, 10710036, 11574000, 12590840, 13810600],
                [8978000, 9612000, 10330707, 11156200, 12118500]
              ],
              central: { wacc: 0.18, taxaPerpetua: 0.03, valor: 13100540 }
            },
            cenarios: {
              pessimista: { equityValue: 6303548, enterpriseValue: 9869923, wacc: 0.20, taxaCrescimento: 0.04, taxaPerpetua: 0.02, vpFluxos: 5381403, vpTerminal: 4488519, percentualTerminal: 0.4548 },
              base:       { equityValue: 8706407, enterpriseValue: 13403539, wacc: 0.18, taxaCrescimento: 0.08, taxaPerpetua: 0.03, vpFluxos: 6259074, vpTerminal: 7144465, percentualTerminal: 0.533 },
              otimista:   { equityValue: 11516753, enterpriseValue: 17536400, wacc: 0.17, taxaCrescimento: 0.12, taxaPerpetua: 0.04, vpFluxos: 7118845, vpTerminal: 10417555, percentualTerminal: 0.5941 }
            },
            resumo: { enterpriseValue: 'R$ 13.4M', equityBruto: 'R$ 12.8M', equityAjustado: 'R$ 8.7M', wacc: '18,0%', taxaCrescimento: '8,0%', taxaPerpetua: '3,0%', pessimista: 'R$ 6.3M', base: 'R$ 8.7M', otimista: 'R$ 11.5M' }
          }
        },
        multiplos: {
          modulo: 'MULTIPLOS', nomeEmpresa: 'TechBrasil Ltda (DEMO)',
          valorMinimo: 4182000, valorMediano: 17069700, valorMaximo: 41616000,
          equityValue: 17069700, erro: false,
          detalhes: {
            setor: 'tecnologia', porte: 'pequena', tipoCapital: 'fechado',
            metodos: {
              evEbitda: { metodo: 'EV/EBITDA', aplicavel: true, multiploUsado: { min: 8, mediana: 14, max: 25 }, equityAjustado: { min: 11288000, mediana: 20060000, max: 36142000 } },
              evEbit: { metodo: 'EV/EBIT', aplicavel: true, multiploUsado: { min: 10, mediana: 16, max: 28 }, equityAjustado: { min: 9520000, mediana: 16560000, max: 30800000 } },
              evFcf: { metodo: 'EV/FCF', aplicavel: true, multiploUsado: { min: 12, mediana: 18, max: 30 }, equityAjustado: { min: 12920000, mediana: 19520000, max: 33600000 } },
              pl: { metodo: 'P/L', aplicavel: true, multiploUsado: { min: 10, mediana: 20, max: 40 }, equityAjustado: { min: 10800000, mediana: 21600000, max: 43200000 } },
              evReceita: { metodo: 'EV/Receita', aplicavel: true, multiploUsado: { min: 2, mediana: 4, max: 8 }, equityAjustado: { min: 4182000, mediana: 11016000, max: 23784000 } },
              pvpa: { metodo: 'P/VPA', aplicavel: true, multiploUsado: { min: 1.5, mediana: 3, max: 5 }, equityAjustado: { min: 3264000, mediana: 6528000, max: 10880000 } }
            },
            descontos: { iliquidez: 0.20, porte: 0.15, total: 0.32 },
            pesos: { evEbitda: 0.25, evEbit: 0.05, evFcf: 0.15, pl: 0.20, evReceita: 0.25, pvpa: 0.10 },
            multiplosReferencia: { fonte: 'Damodaran (ajustado Brasil)', setor: 'tecnologia' }
          }
        },
        patrimonial: {
          modulo: 'PATRIMONIAL',
          valorMinimo: 1512500, valorMediano: 3450000, valorMaximo: 4100000,
          equityValue: 3450000, erro: false,
          detalhes: {
            ativosCirculantes: { caixa: 500000, contasReceber: { original: 800000, ajustado: 760000 }, estoques: { original: 600000, ajustado: 540000 }, outros: 300000, total: 2100000 },
            ativosNaoCirculantes: { imoveis: { contabil: 2000000, valorMercado: 2000000 }, veiculos: { contabil: 400000, valorMercado: 400000 }, maquinas: { contabil: 500000, valorMercado: 500000 }, investimentos: 100000, outros: 50000, total: 3050000 },
            totalAtivosTangiveis: 5150000,
            passivos: {
              circulantes: { fornecedores: 400000, salarios: 200000, impostos: 150000, emprestimosCP: 300000, outros: 50000, totalCirculante: 1100000 },
              naoCirculantes: { emprestimosLP: 1000000, provisoes: 200000, outros: 50000, totalNaoCirculante: 1250000 },
              total: 2350000
            },
            plAjustadoTangivel: 2800000,
            intangiveis: { declarados: { marca: 500000, carteiraClientes: 300000, contratos: 100000, licencas: 50000, knowHow: 200000, goodwill: 150000, totalBruto: 1300000, total: 1300000 }, totalUsado: 1300000 },
            cenarios: {
              conservador: { valor: 1512500, descricao: 'Liquidação forçada com 25% de desconto sobre tangíveis' },
              moderado:    { valor: 3450000, descricao: 'Valor justo com 50% dos intangíveis' },
              otimista:    { valor: 4100000, descricao: 'Going concern com 100% dos intangíveis' }
            },
            ajustes: [
              { item: 'Contas a Receber', contabil: 800000, ajustado: 760000, diferenca: -40000, motivo: 'PDD — inadimplência de 5,0%' },
              { item: 'Estoques', contabil: 600000, ajustado: 540000, diferenca: -60000, motivo: 'Obsolescência de 10,0%' }
            ]
          }
        },
        indicadores: {
          setor: 'tecnologia', setorLabel: 'Tecnologia / SaaS',
          rentabilidade: {
            roi: { sigla: 'ROI', valor: 0.4263, valorFormatado: '42,6%', classificacao: 'excelente', referenciasSetor: { ruim: 0.06, regular: 0.14, bom: 0.25, excelente: 0.40 } },
            roe: { sigla: 'ROE', valor: 0.5063, valorFormatado: '50,6%', classificacao: 'excelente', referenciasSetor: { ruim: 0.05, regular: 0.12, bom: 0.20, excelente: 0.35 } }
          },
          margens: {
            bruta: { sigla: 'Margem Bruta', valor: 0.40, valorFormatado: '40,0%', classificacao: 'bom', referenciasSetor: { ruim: 0.15, regular: 0.30, bom: 0.45, excelente: 0.60 } },
            operacional: { sigla: 'Margem Op.', valor: 0.40, valorFormatado: '40,0%', classificacao: 'excelente', referenciasSetor: { ruim: 0.05, regular: 0.12, bom: 0.20, excelente: 0.30 } }
          },
          liquidez: {
            corrente: { sigla: 'LC', valor: 1.91, valorFormatado: '1,91', classificacao: 'bom', referenciasSetor: { ruim: 0.8, regular: 1.0, bom: 1.5, excelente: 2.0 } }
          },
          eficiencia: {
            giroAtivo: { sigla: 'Giro Ativo', valor: 0.81, valorFormatado: '0,81x', classificacao: 'regular', referenciasSetor: { ruim: 0.3, regular: 0.6, bom: 1.0, excelente: 1.5 } }
          },
          dupont: {
            margemLiquida: 0.36, giroAtivo: 0.8108, multiplicadorAlavancagem: 1.7344, roe: 0.5063,
            componentes: { lucroLiquido: 1620000, receita: 4500000, ativo: 5550000, patrimonioLiquido: 3200000 },
            analise: { principalDriver: 'Margem Líquida', ranking: [{ driver: 'Margem Líquida', contribuicao: 'Principal gerador' }, { driver: 'Alavancagem', contribuicao: 'Moderada' }, { driver: 'Giro do Ativo', contribuicao: 'Baixo' }], recomendacoes: ['Focar na manutenção da margem líquida elevada', 'Buscar aumento do giro do ativo para ampliar o ROE'] },
            interpretacao: 'ROE de 50,6% é composto por: Margem Líquida 36,0% × Giro do Ativo 0,8x × Alavancagem 1,7x.'
          },
          scorecard: {
            grupos: {
              rentabilidade: { nota: 10.0, peso: 0.30 },
              margens:       { nota: 8.8,  peso: 0.25 },
              liquidez:      { nota: 7.1,  peso: 0.25 },
              eficiencia:    { nota: 4.2,  peso: 0.20 }
            },
            notaGeral: 7.8, classificacaoGeral: 'bom',
            pontoForte: 'Rentabilidade', pontoFraco: 'Eficiência',
            resumo: 'Scorecard da empresa: nota geral 7,8/10 (bom)'
          }
        },
        consolidado: {
          erro: false,
          valorMinimo: 1512500, valorMediano: 10582278, valorMaximo: 41616000,
          valorRecomendado: 10582278,
          faixaNegociacao: { minimo: 8994936, recomendado: 10582278, maximo: 12169620 },
          pesos: { tipo: 'crescimento', dcf: 0.45, multiplos: 0.35, patrimonial: 0.20, justificativa: 'Perfil de crescimento: DCF com maior peso por capturar potencial futuro.' },
          alertas: [{ tipo: 'aviso', titulo: 'Divergência significativa', mensagem: 'A avaliação por múltiplos apresenta dispersão elevada entre métodos.' }],
          footballField: {
            barras: [
              { label: 'DCF', min: 6303548, mediana: 8706407, max: 11516753, cor: '#1E40AF', destaque: false },
              { label: 'Múltiplos', min: 4182000, mediana: 17069700, max: 41616000, cor: '#047857', destaque: false },
              { label: 'Patrimonial', min: 1512500, mediana: 3450000, max: 4100000, cor: '#B45309', destaque: false },
              { label: 'Consolidado', min: 8994936, mediana: 10582278, max: 12169620, cor: '#7C3AED', destaque: true }
            ],
            escala: { min: 0, max: 45626350 },
            faixaNegociacao: { min: 8994936, max: 12169620 }
          },
          waterfall: {
            etapas: [
              { label: 'Receita', valor: 4500000, tipo: 'positivo' },
              { label: 'Custos', valor: -2700000, tipo: 'negativo' },
              { label: 'EBIT', valor: 1800000, tipo: 'subtotal' },
              { label: 'Impostos', valor: -180000, tipo: 'negativo' },
              { label: 'NOPAT', valor: 1620000, tipo: 'subtotal' },
              { label: 'D&A', valor: 300000, tipo: 'positivo' },
              { label: 'CAPEX', valor: -300000, tipo: 'negativo' },
              { label: 'FCF', valor: 1620000, tipo: 'subtotal' },
              { label: 'VP Terminal', valor: 7144465, tipo: 'positivo' },
              { label: 'EV', valor: 13403539, tipo: 'subtotal' },
              { label: 'Dívida Líq.', valor: -600000, tipo: 'negativo' },
              { label: 'Equity', valor: 8706407, tipo: 'subtotal' }
            ]
          },
          percentis: { p10: 3062500, p25: 4100000, p50: 6303548, p75: 11516753, p90: 21978960 },
          resumo: 'A empresa TechBrasil Ltda foi avaliada por 3 métodos independentes. O valor recomendado é de R$ 10.582.278, com faixa de negociação entre R$ 8.994.936 e R$ 12.169.620.',
          dadosPDF: {
            titulo: 'Relatório de Precificação', data: '2026-02-28',
            nomeEmpresa: 'TechBrasil Ltda (DEMO)',
            resumoExecutivo: 'Relatório demonstrativo gerado automaticamente.',
            resultadoPorMetodo: [
              { metodo: 'DCF (Fluxo de Caixa Descontado)', valorMinimo: 'R$ 6.303.548', valorMediano: 'R$ 8.706.407', valorMaximo: 'R$ 11.516.753', peso: '45%' },
              { metodo: 'Múltiplos de Mercado', valorMinimo: 'R$ 4.182.000', valorMediano: 'R$ 17.069.700', valorMaximo: 'R$ 41.616.000', peso: '35%' },
              { metodo: 'Valor Patrimonial Ajustado', valorMinimo: 'R$ 1.512.500', valorMediano: 'R$ 3.450.000', valorMaximo: 'R$ 4.100.000', peso: '20%' }
            ],
            glossario: {
              dcf: { sigla: 'DCF', nome: 'Discounted Cash Flow', explicacao: 'Método de fluxo de caixa descontado' },
              wacc: { sigla: 'WACC', nome: 'Weighted Average Cost of Capital', explicacao: 'Custo médio ponderado de capital' },
              ebitda: { sigla: 'EBITDA', nome: 'Earnings Before Interest, Taxes, Depreciation and Amortization', explicacao: 'Lucro antes de juros, impostos, depreciação e amortização' },
              ebit: { sigla: 'EBIT', nome: 'Earnings Before Interest and Taxes', explicacao: 'Lucro antes de juros e impostos' },
              fcf: { sigla: 'FCF', nome: 'Free Cash Flow', explicacao: 'Fluxo de caixa livre' },
              nopat: { sigla: 'NOPAT', nome: 'Net Operating Profit After Taxes', explicacao: 'Lucro operacional líquido após impostos' },
              ev: { sigla: 'EV', nome: 'Enterprise Value', explicacao: 'Valor da empresa (firma)' },
              roi: { sigla: 'ROI', nome: 'Return on Investment', explicacao: 'Retorno sobre investimento' },
              roe: { sigla: 'ROE', nome: 'Return on Equity', explicacao: 'Retorno sobre patrimônio líquido' },
              dlom: { sigla: 'DLOM', nome: 'Discount for Lack of Marketability', explicacao: 'Desconto por falta de liquidez de mercado' }
            },
            disclaimer: 'Este relatório é uma estimativa técnica simplificada gerada automaticamente pela plataforma IMPOST. e não substitui uma avaliação formal (laudo de avaliação) elaborada por profissional habilitado (contador, auditor ou analista de investimentos com registro CVM). Os valores apresentados são baseados em premissas, projeções e dados fornecidos pelo usuário, que podem não se confirmar. A IMPOST. não se responsabiliza por decisões tomadas com base neste documento. Recomenda-se a consulta com especialistas qualificados antes de qualquer decisão de investimento, compra, venda ou fusão empresarial.'
          }
        }
      }
    };

    console.log('[ValuationExportar] Gerando PDF de demonstração...');
    return exportarPDF(resultadoDemo, {
      nomeConsultor: 'Demonstração IMPOST.',
      crcConsultor: 'CRC-XX 000000',
      incluirGlossario: true,
      incluirDisclaimer: true,
      incluirCapa: true
    }).then(function (blob) {
      download(blob, 'Valuation_DEMO_' + new Date().toISOString().slice(0, 10) + '.pdf');
      console.log('[ValuationExportar] PDF de demonstração gerado com sucesso!');
      return blob;
    });
  }

  // ─────────────────────────────────────────────
  // EXCEL — EXPORTAÇÃO COMPLETA (Parte 2)
  // ─────────────────────────────────────────────

  // Formatos numéricos Excel
  var XL_MOEDA = '"R$ "#,##0.00';
  var XL_MOEDA_INT = '"R$ "#,##0';
  var XL_PCT = '0.0%';
  var XL_MULT = '0.0"x"';
  var XL_NUM = '#,##0';

  // Estilos (SheetJS community — pode não renderizar na free)
  var XL_S_HEADER = {
    font: { bold: true, color: { rgb: 'FFFFFF' }, name: 'Calibri', sz: 10 },
    fill: { fgColor: { rgb: '22C55E' } },
    border: { bottom: { style: 'thin', color: { rgb: 'E5E7EB' } } }
  };
  var XL_S_TITULO = { font: { bold: true, name: 'Calibri', sz: 14, color: { rgb: '1F2937' } } };
  var XL_S_SECAO = { font: { bold: true, name: 'Calibri', sz: 11, color: { rgb: '15803D' } }, fill: { fgColor: { rgb: 'F0FDF4' } } };
  var XL_S_DESTAQUE = { font: { bold: true, name: 'Calibri', sz: 12, color: { rgb: '15803D' } }, fill: { fgColor: { rgb: 'ECFDF5' } } };
  var XL_S_BOLD = { font: { bold: true, name: 'Calibri', sz: 10 } };
  var XL_S_CLASSIF = {
    excelente: { fill: { fgColor: { rgb: 'DCFCE7' } }, font: { color: { rgb: '15803D' }, name: 'Calibri', sz: 10 } },
    bom:       { fill: { fgColor: { rgb: 'DBEAFE' } }, font: { color: { rgb: '1E40AF' }, name: 'Calibri', sz: 10 } },
    regular:   { fill: { fgColor: { rgb: 'FEF3C7' } }, font: { color: { rgb: '92400E' }, name: 'Calibri', sz: 10 } },
    ruim:      { fill: { fgColor: { rgb: 'FEE2E2' } }, font: { color: { rgb: '991B1B' }, name: 'Calibri', sz: 10 } }
  };

  function _n(v) { return (v == null || isNaN(v)) ? 0 : Number(v); }

  function _xlFmt(ws, r, c, z) {
    var ref = XLSX.utils.encode_cell({ r: r, c: c });
    if (ws[ref] && ws[ref].t === 'n') ws[ref].z = z;
  }

  function _xlS(ws, r, c, s) {
    var ref = XLSX.utils.encode_cell({ r: r, c: c });
    if (ws[ref]) ws[ref].s = s;
  }

  function _xlSLinha(ws, linha, n, s) {
    for (var c = 0; c < n; c++) _xlS(ws, linha, c, s);
  }

  function _xlFmtRange(ws, col, ri, rf, z) {
    for (var r = ri; r <= rf; r++) _xlFmt(ws, r, col, z);
  }

  function _xlRefFmt(ws, refs) {
    // refs: array de [r, c, formato]
    for (var i = 0; i < refs.length; i++) _xlFmt(ws, refs[i][0], refs[i][1], refs[i][2]);
  }

  // ─── ABA 1: RESUMO ───────────────────────────

  function _criarAbaResumo(wb, con, dadosPDF, resultado) {
    var res = resultado.resultados || {};
    var nome = dadosPDF.nomeEmpresa || 'Empresa';
    var data = formatarData(dadosPDF.data || resultado.dataCalculo || '');
    var faixa = con.faixaNegociacao || {};
    var pesos = con.pesos || {};
    var alertas = con.alertas || [];

    var d = [];
    d.push(['RELATÓRIO DE PRECIFICAÇÃO — ' + nome, '', '', '', '', '']);
    d.push(['Data: ' + data + ' | Versão: ' + (resultado.versao || '2.0.0') + ' | Gerado por IMPOST.']);
    d.push([]);
    d.push(['VALOR RECOMENDADO']);
    d.push([_n(con.valorRecomendado || con.valorMediano)]);
    d.push(['Faixa de Negociação: De ' + formatarMoeda(faixa.minimo) + ' a ' + formatarMoeda(faixa.maximo)]);
    d.push([]);

    // Header tabela métodos (row 7)
    d.push(['Método', 'Valor Mínimo', 'Valor Mediano', 'Valor Máximo', 'Peso', 'Justificativa']);
    var ri = d.length;
    var metodos = [
      { nome: 'DCF (Fluxo de Caixa Descontado)', obj: res.dcf, peso: pesos.dcf },
      { nome: 'Múltiplos de Mercado', obj: res.multiplos, peso: pesos.multiplos },
      { nome: 'Valor Patrimonial Ajustado', obj: res.patrimonial, peso: pesos.patrimonial }
    ];
    metodos.forEach(function(m) {
      var o = m.obj || {};
      d.push([m.nome, _n(o.valorMinimo), _n(o.valorMediano), _n(o.valorMaximo), _n(m.peso), '']);
    });
    var rf = d.length - 1;

    d.push([]);
    d.push(['Tipo de Perfil:', (pesos.tipo || '') + ' — ' + (pesos.justificativa || '')]);
    d.push([]);

    if (alertas.length > 0) {
      d.push(['ALERTAS']);
      alertas.forEach(function(a) { d.push([a.tipo || '', a.titulo || '', a.mensagem || '']); });
    }

    var ws = XLSX.utils.aoa_to_sheet(d);
    ws['!cols'] = [{ wch: 38 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 12 }, { wch: 50 }];
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: 5 } },
      { s: { r: 4, c: 0 }, e: { r: 4, c: 5 } },
      { s: { r: 5, c: 0 }, e: { r: 5, c: 5 } }
    ];

    _xlFmt(ws, 4, 0, XL_MOEDA);
    for (var r = ri; r <= rf; r++) {
      _xlFmt(ws, r, 1, XL_MOEDA_INT); _xlFmt(ws, r, 2, XL_MOEDA_INT);
      _xlFmt(ws, r, 3, XL_MOEDA_INT); _xlFmt(ws, r, 4, XL_PCT);
    }

    _xlS(ws, 0, 0, XL_S_TITULO); _xlS(ws, 3, 0, XL_S_SECAO);
    _xlS(ws, 4, 0, XL_S_DESTAQUE); _xlSLinha(ws, 7, 6, XL_S_HEADER);
    XLSX.utils.book_append_sheet(wb, ws, 'Resumo');
  }

  // ─── ABA 2: DCF — PROJEÇÃO ───────────────────

  function _criarAbaDCFProjecao(wb, dcf) {
    var det = dcf.detalhes || {};
    var desc = det.descontos || {};
    var base = det.anoBase || {};
    var proj = det.projecaoAnual || [];
    var comp = det.composicao || {};

    var d = [];
    d.push(['DCF — Projeção de Fluxo de Caixa Descontado']);  // 0
    d.push([]);                                                 // 1
    d.push(['PREMISSAS']);                                       // 2
    d.push(['WACC', _n(det.wacc)]);                             // 3
    d.push(['Taxa de Crescimento', _n(det.taxaCrescimento)]);   // 4
    d.push(['Taxa Perpétua', _n(det.taxaPerpetua)]);            // 5
    d.push(['Horizonte', (det.horizonteAnos || 5) + ' anos']);  // 6
    d.push(['Setor', det.setor || '']);                          // 7
    d.push(['Porte', det.porte || '']);                          // 8
    d.push(['Tipo de Capital', det.tipoCapital || '']);          // 9
    d.push([]);                                                 // 10
    d.push(['DESCONTOS']);                                       // 11
    d.push(['Equity Bruto', _n(desc.equityBruto)]);             // 12
    d.push(['Desc. Iliquidez (DLOM)', _n(desc.descontoIliquidez), desc.descontoIliquidezLabel || '']);
    d.push(['Desc. Porte', _n(desc.descontoPorte), desc.descontoPorteLabel || '']);
    d.push(['Fator Total', _n(desc.fatorDesconto)]);            // 15
    d.push(['Equity Ajustado', _n(desc.equityAjustado)]);       // 16
    d.push([]);                                                 // 17
    d.push(['PROJEÇÃO ANO A ANO']);                              // 18
    d.push(['Período', 'Receita', 'Custos', 'EBIT', 'Margem EBIT', 'NOPAT', 'D&A', 'CAPEX', 'ΔWC', 'FCF', 'VP(FCF)']); // 19
    var ri = d.length; // 20
    d.push(['Ano Base', _n(base.receita), _n(base.custos), _n(base.ebit), _n(base.margemEBIT), _n(base.nopat), _n(base.da), _n(base.capex), _n(base.deltaWC), _n(base.fcf), '']);
    proj.forEach(function(p) {
      d.push(['Ano ' + p.ano, _n(p.receita), _n(p.custos), _n(p.ebit), _n(p.margemEBIT), _n(p.nopat), _n(p.da), _n(p.capex), _n(p.deltaWC), _n(p.fcf), _n(p.vpFcf)]);
    });
    var rf = d.length - 1;
    d.push([]);
    var lt = d.length;
    d.push(['Valor Terminal', '', '', '', '', '', '', '', '', _n(det.valorTerminal), _n(det.vpValorTerminal)]);
    d.push([]);
    d.push(['COMPOSIÇÃO DO VALOR']);
    var lc = d.length;
    d.push(['VP dos Fluxos', _n(comp.valorFluxos), _n(comp.percentualFluxos)]);
    d.push(['VP Valor Terminal', _n(comp.valorTerminal), _n(comp.percentualTerminal)]);
    d.push(['Enterprise Value', _n(det.enterpriseValue), 1]);
    d.push(['(-) Dívida Líquida', _n(det.dividaLiquida)]);
    d.push(['Equity Value (base)', _n(det.equityValue)]);

    var ws = XLSX.utils.aoa_to_sheet(d);
    ws['!cols'] = [{ wch: 22 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 16 }, { wch: 16 }];
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 10 } }];

    _xlRefFmt(ws, [[3, 1, XL_PCT], [4, 1, XL_PCT], [5, 1, XL_PCT], [12, 1, XL_MOEDA_INT], [13, 1, XL_PCT], [14, 1, XL_PCT], [16, 1, XL_MOEDA_INT]]);
    for (var r = ri; r <= rf; r++) {
      for (var c = 1; c <= 3; c++) _xlFmt(ws, r, c, XL_NUM);
      _xlFmt(ws, r, 4, XL_PCT);
      for (c = 5; c <= 10; c++) _xlFmt(ws, r, c, XL_NUM);
    }
    _xlFmt(ws, lt, 9, XL_NUM); _xlFmt(ws, lt, 10, XL_NUM);
    _xlFmt(ws, lc, 1, XL_MOEDA_INT); _xlFmt(ws, lc, 2, XL_PCT);
    _xlFmt(ws, lc + 1, 1, XL_MOEDA_INT); _xlFmt(ws, lc + 1, 2, XL_PCT);
    _xlFmt(ws, lc + 2, 1, XL_MOEDA_INT); _xlFmt(ws, lc + 2, 2, XL_PCT);
    _xlFmt(ws, lc + 3, 1, XL_MOEDA_INT); _xlFmt(ws, lc + 4, 1, XL_MOEDA_INT);

    _xlS(ws, 0, 0, XL_S_TITULO); _xlS(ws, 2, 0, XL_S_SECAO);
    _xlS(ws, 11, 0, XL_S_SECAO); _xlS(ws, 18, 0, XL_S_SECAO);
    _xlSLinha(ws, 19, 11, XL_S_HEADER);
    XLSX.utils.book_append_sheet(wb, ws, 'DCF — Projeção');
  }

  // ─── ABA 3: DCF — SENSIBILIDADE ──────────────

  function _criarAbaDCFSensibilidade(wb, dcf) {
    var sens = (dcf.detalhes || {}).sensibilidade;
    if (!sens) return;
    var linhas = sens.linhas || [];
    var colunas = sens.colunas || [];
    var valores = sens.valores || [];
    var central = sens.central || {};

    var d = [];
    d.push(['Análise de Sensibilidade — Enterprise Value']); // 0
    d.push(['WACC × Crescimento Perpétuo (g)']);              // 1
    d.push([]);                                               // 2

    // Header (row 3)
    var header = [''];
    colunas.forEach(function(g) { header.push('g = ' + formatarPct(g)); });
    d.push(header);

    // Dados (rows 4+)
    var ri = d.length;
    linhas.forEach(function(w, i) {
      var row = ['WACC = ' + formatarPct(w)];
      (valores[i] || []).forEach(function(v) { row.push(_n(v)); });
      d.push(row);
    });
    var rf = d.length - 1;

    d.push([]);
    d.push(['Valor Central (base):', _n(central.valor), 'WACC:', formatarPct(central.wacc), 'g:', formatarPct(central.taxaPerpetua)]);

    var ws = XLSX.utils.aoa_to_sheet(d);
    var numCols = 1 + colunas.length;
    var cols = [{ wch: 20 }];
    for (var c = 0; c < colunas.length; c++) cols.push({ wch: 18 });
    ws['!cols'] = cols;
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } }];

    for (var r = ri; r <= rf; r++) {
      for (c = 1; c < numCols; c++) _xlFmt(ws, r, c, XL_MOEDA_INT);
    }
    _xlFmt(ws, rf + 2, 1, XL_MOEDA_INT);

    _xlS(ws, 0, 0, XL_S_TITULO); _xlSLinha(ws, 3, numCols, XL_S_HEADER);

    // Destacar linha central
    var iCentral = linhas.indexOf(central.wacc);
    if (iCentral >= 0) _xlSLinha(ws, ri + iCentral, numCols, XL_S_DESTAQUE);

    XLSX.utils.book_append_sheet(wb, ws, 'DCF — Sensibilidade');
  }

  // ─── ABA 4: DCF — CENÁRIOS ───────────────────

  function _criarAbaDCFCenarios(wb, dcf) {
    var cen = (dcf.detalhes || {}).cenarios;
    if (!cen) return;
    var p = cen.pessimista || {};
    var b = cen.base || {};
    var o = cen.otimista || {};

    var d = [];
    d.push(['Análise de Cenários']);          // 0
    d.push([]);                               // 1
    d.push(['Parâmetro', 'Pessimista', 'Base', 'Otimista']); // 2

    var ri = d.length;
    d.push(['Equity Value',       _n(p.equityValue),       _n(b.equityValue),       _n(o.equityValue)]);
    d.push(['Enterprise Value',   _n(p.enterpriseValue),   _n(b.enterpriseValue),   _n(o.enterpriseValue)]);
    d.push(['WACC',               _n(p.wacc),              _n(b.wacc),              _n(o.wacc)]);
    d.push(['Taxa Crescimento',   _n(p.taxaCrescimento),   _n(b.taxaCrescimento),   _n(o.taxaCrescimento)]);
    d.push(['Taxa Perpétua',      _n(p.taxaPerpetua),      _n(b.taxaPerpetua),      _n(o.taxaPerpetua)]);
    d.push(['VP Fluxos',          _n(p.vpFluxos),          _n(b.vpFluxos),          _n(o.vpFluxos)]);
    d.push(['VP Terminal',        _n(p.vpTerminal),        _n(b.vpTerminal),        _n(o.vpTerminal)]);
    d.push(['% Terminal',         _n(p.percentualTerminal),_n(b.percentualTerminal),_n(o.percentualTerminal)]);
    var rf = d.length - 1;

    var ws = XLSX.utils.aoa_to_sheet(d);
    ws['!cols'] = [{ wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }];
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];

    // Equity + EV = moeda; WACC/taxas = %; VP = moeda; %Terminal = %
    for (var c = 1; c <= 3; c++) {
      _xlFmt(ws, ri, c, XL_MOEDA_INT); _xlFmt(ws, ri + 1, c, XL_MOEDA_INT);
      _xlFmt(ws, ri + 2, c, XL_PCT); _xlFmt(ws, ri + 3, c, XL_PCT); _xlFmt(ws, ri + 4, c, XL_PCT);
      _xlFmt(ws, ri + 5, c, XL_MOEDA_INT); _xlFmt(ws, ri + 6, c, XL_MOEDA_INT);
      _xlFmt(ws, ri + 7, c, XL_PCT);
    }

    _xlS(ws, 0, 0, XL_S_TITULO); _xlSLinha(ws, 2, 4, XL_S_HEADER);
    XLSX.utils.book_append_sheet(wb, ws, 'DCF — Cenários');
  }

  // ─── ABA 5: MÚLTIPLOS ────────────────────────

  function _criarAbaMultiplos(wb, mult) {
    var det = mult.detalhes || {};
    var metodos = det.metodos || {};
    var descontos = det.descontos || {};
    var pesos = det.pesos || {};
    var chaves = ['evEbitda', 'evEbit', 'evFcf', 'pl', 'evReceita', 'pvpa'];

    var d = [];
    d.push(['Avaliação por Múltiplos de Mercado']);             // 0
    d.push(['Setor: ' + (det.setor || '') + ' | Porte: ' + (det.porte || '') + ' | Capital: ' + (det.tipoCapital || '')]); // 1
    d.push([]);                                                 // 2
    d.push(['MÚLTIPLOS APLICADOS']);                             // 3
    d.push(['Método', 'Múltiplo Mín', 'Múltiplo Med', 'Múltiplo Máx', 'Equity Mín', 'Equity Med', 'Equity Máx', 'Peso']); // 4
    var ri = d.length;
    chaves.forEach(function(k) {
      var m = metodos[k];
      if (!m) return;
      if (m.aplicavel === false) {
        d.push([m.metodo || k, 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', _n(pesos[k])]);
        return;
      }
      var mu = m.multiploUsado || {};
      var eq = m.equityAjustado || {};
      d.push([m.metodo || k, _n(mu.min), _n(mu.mediana), _n(mu.max), _n(eq.min), _n(eq.mediana), _n(eq.max), _n(pesos[k])]);
    });
    var rf = d.length - 1;

    d.push([]);
    d.push(['DESCONTOS APLICADOS']);
    var ld = d.length;
    d.push(['Iliquidez (DLOM)', _n(descontos.iliquidez)]);
    d.push(['Porte', _n(descontos.porte)]);
    d.push(['Desconto Total', _n(descontos.total)]);

    d.push([]);
    d.push(['CONTRIBUIÇÃO PONDERADA']);
    d.push(['Método', 'Peso', 'Valor Mediano', 'Contribuição']);
    var lp = d.length;
    var totalPonderado = 0;
    chaves.forEach(function(k) {
      var m = metodos[k];
      if (!m || m.aplicavel === false) return;
      var eq = (m.equityAjustado || {}).mediana || 0;
      var p = _n(pesos[k]);
      var contrib = eq * p;
      totalPonderado += contrib;
      d.push([m.metodo || k, p, _n(eq), _n(contrib)]);
    });
    var lfp = d.length - 1;
    d.push(['TOTAL (Equity Mediano)', '', '', _n(totalPonderado)]);

    var ws = XLSX.utils.aoa_to_sheet(d);
    ws['!cols'] = [{ wch: 22 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 12 }];
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }];

    for (var r = ri; r <= rf; r++) {
      _xlFmt(ws, r, 1, XL_MULT); _xlFmt(ws, r, 2, XL_MULT); _xlFmt(ws, r, 3, XL_MULT);
      _xlFmt(ws, r, 4, XL_MOEDA_INT); _xlFmt(ws, r, 5, XL_MOEDA_INT); _xlFmt(ws, r, 6, XL_MOEDA_INT);
      _xlFmt(ws, r, 7, XL_PCT);
    }
    _xlFmt(ws, ld, 1, XL_PCT); _xlFmt(ws, ld + 1, 1, XL_PCT); _xlFmt(ws, ld + 2, 1, XL_PCT);
    for (r = lp; r <= lfp; r++) {
      _xlFmt(ws, r, 1, XL_PCT); _xlFmt(ws, r, 2, XL_MOEDA_INT); _xlFmt(ws, r, 3, XL_MOEDA_INT);
    }
    _xlFmt(ws, lfp + 1, 3, XL_MOEDA_INT);

    _xlS(ws, 0, 0, XL_S_TITULO); _xlS(ws, 3, 0, XL_S_SECAO);
    _xlSLinha(ws, 4, 8, XL_S_HEADER);
    _xlS(ws, ld - 1, 0, XL_S_SECAO); _xlS(ws, lp - 2, 0, XL_S_SECAO);
    _xlSLinha(ws, lp - 1, 4, XL_S_HEADER);
    _xlSLinha(ws, lfp + 1, 4, XL_S_BOLD);
    XLSX.utils.book_append_sheet(wb, ws, 'Múltiplos');
  }

  // ─── ABA 6: PATRIMONIAL ──────────────────────

  function _criarAbaPatrimonial(wb, patr) {
    var det = patr.detalhes || {};
    var ac = det.ativosCirculantes || {};
    var anc = det.ativosNaoCirculantes || {};
    var pas = det.passivos || {};
    var pc = pas.circulantes || {};
    var pnc = pas.naoCirculantes || {};
    var intg = det.intangiveis || {};
    var decl = intg.declarados || {};
    var cen = det.cenarios || {};
    var ajustes = det.ajustes || [];

    var d = [];
    d.push(['Avaliação Patrimonial']); // 0
    d.push([]);

    // ATIVOS CIRCULANTES
    d.push(['ATIVOS CIRCULANTES']);
    d.push(['Item', 'Valor Contábil', 'Valor Ajustado', 'Diferença', 'Motivo']);
    var rac = d.length;
    var cr = ac.contasReceber || {};
    var est = ac.estoques || {};
    d.push(['Caixa', _n(ac.caixa), _n(ac.caixa), 0, '—']);
    d.push(['Contas a Receber', _n(cr.original || ac.contasReceber), _n(cr.ajustado || ac.contasReceber), _n((cr.ajustado || 0) - (cr.original || 0)), cr.motivo || '']);
    d.push(['Estoques', _n(est.original || ac.estoques), _n(est.ajustado || ac.estoques), _n((est.ajustado || 0) - (est.original || 0)), est.motivo || '']);
    d.push(['Outros', _n(ac.outros), _n(ac.outros), 0, '—']);
    d.push(['Total AC', _n(ac.total), _n(ac.total), '', '']);
    var rfac = d.length - 1;
    d.push([]);

    // ATIVOS NÃO CIRCULANTES
    d.push(['ATIVOS NÃO CIRCULANTES']);
    d.push(['Item', 'Valor Contábil', 'Valor Mercado', 'Diferença']);
    var ranc = d.length;
    var im = anc.imoveis || {};
    var ve = anc.veiculos || {};
    var ma = anc.maquinas || {};
    d.push(['Imóveis', _n(im.contabil), _n(im.valorMercado), _n((im.valorMercado || 0) - (im.contabil || 0))]);
    d.push(['Veículos', _n(ve.contabil), _n(ve.valorMercado), _n((ve.valorMercado || 0) - (ve.contabil || 0))]);
    d.push(['Máquinas', _n(ma.contabil), _n(ma.valorMercado), _n((ma.valorMercado || 0) - (ma.contabil || 0))]);
    d.push(['Investimentos', _n(anc.investimentos), _n(anc.investimentos), 0]);
    d.push(['Outros', _n(anc.outros), _n(anc.outros), 0]);
    d.push(['TOTAL ATIVOS TANGÍVEIS', '', _n(det.totalAtivosTangiveis), '']);
    var rfanc = d.length - 1;
    d.push([]);

    // PASSIVOS
    d.push(['PASSIVOS']);
    d.push(['Passivos Circulantes']);
    var rpc = d.length;
    d.push(['Fornecedores', _n(pc.fornecedores)]);
    d.push(['Salários', _n(pc.salarios)]);
    d.push(['Impostos', _n(pc.impostos)]);
    d.push(['Empréstimos CP', _n(pc.emprestimosCP)]);
    d.push(['Outros', _n(pc.outros)]);
    d.push(['Total Passivo Circulante', _n(pc.totalCirculante)]);
    d.push(['Passivos Não Circulantes']);
    d.push(['Empréstimos LP', _n(pnc.emprestimosLP)]);
    d.push(['Provisões', _n(pnc.provisoes)]);
    d.push(['Outros', _n(pnc.outros)]);
    d.push(['Total Passivo Não Circulante', _n(pnc.totalNaoCirculante)]);
    d.push(['TOTAL PASSIVOS', _n(pas.total)]);
    var rfp = d.length - 1;
    d.push([]);

    // PL
    d.push(['PL TANGÍVEL AJUSTADO', _n(det.plAjustadoTangivel)]);
    var rpl = d.length - 1;
    d.push([]);

    // INTANGÍVEIS
    d.push(['INTANGÍVEIS']);
    d.push(['Item', 'Valor']);
    var rint = d.length;
    d.push(['Marca', _n(decl.marca)]);
    d.push(['Carteira de Clientes', _n(decl.carteiraClientes)]);
    d.push(['Contratos', _n(decl.contratos)]);
    d.push(['Licenças', _n(decl.licencas)]);
    d.push(['Know-How', _n(decl.knowHow)]);
    d.push(['Goodwill', _n(decl.goodwill)]);
    d.push(['Total Intangíveis', _n(decl.total || intg.totalUsado)]);
    var rfint = d.length - 1;
    d.push([]);

    // CENÁRIOS
    d.push(['CENÁRIOS']);
    d.push(['Cenário', 'Valor', 'Descrição']);
    var rcen = d.length;
    var cs = cen.conservador || {};
    var cm = cen.moderado || {};
    var co = cen.otimista || {};
    d.push(['Conservador (Liquidação)', _n(cs.valor), cs.descricao || '']);
    d.push(['Moderado (Valor Justo)', _n(cm.valor), cm.descricao || '']);
    d.push(['Otimista (Going Concern)', _n(co.valor), co.descricao || '']);

    // AJUSTES
    if (ajustes.length > 0) {
      d.push([]);
      d.push(['AJUSTES REALIZADOS']);
      d.push(['Item', 'Contábil', 'Ajustado', 'Diferença', 'Motivo']);
      var raj = d.length;
      ajustes.forEach(function(a) {
        d.push([a.item || '', _n(a.contabil), _n(a.ajustado), _n(a.diferenca), a.motivo || '']);
      });
      var rfaj = d.length - 1;
    }

    var ws = XLSX.utils.aoa_to_sheet(d);
    ws['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 18 }, { wch: 40 }];
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];

    // Formatos moeda
    for (var r = rac; r <= rfac; r++) { _xlFmt(ws, r, 1, XL_MOEDA_INT); _xlFmt(ws, r, 2, XL_MOEDA_INT); _xlFmt(ws, r, 3, XL_MOEDA_INT); }
    for (r = ranc; r <= rfanc; r++) { _xlFmt(ws, r, 1, XL_MOEDA_INT); _xlFmt(ws, r, 2, XL_MOEDA_INT); _xlFmt(ws, r, 3, XL_MOEDA_INT); }
    for (r = rpc; r <= rfp; r++) { _xlFmt(ws, r, 1, XL_MOEDA_INT); }
    _xlFmt(ws, rpl, 1, XL_MOEDA_INT);
    for (r = rint; r <= rfint; r++) { _xlFmt(ws, r, 1, XL_MOEDA_INT); }
    for (r = rcen; r <= rcen + 2; r++) { _xlFmt(ws, r, 1, XL_MOEDA_INT); }
    if (ajustes.length > 0) {
      for (r = raj; r <= rfaj; r++) { _xlFmt(ws, r, 1, XL_MOEDA_INT); _xlFmt(ws, r, 2, XL_MOEDA_INT); _xlFmt(ws, r, 3, XL_MOEDA_INT); }
    }

    _xlS(ws, 0, 0, XL_S_TITULO); _xlS(ws, rpl, 0, XL_S_DESTAQUE);
    XLSX.utils.book_append_sheet(wb, ws, 'Patrimonial');
  }

  // ─── ABA 7: INDICADORES ──────────────────────

  function _criarAbaIndicadores(wb, ind) {
    var sc = ind.scorecard || {};
    var grupos = sc.grupos || {};

    var d = [];
    d.push(['Indicadores Financeiros — Scorecard']); // 0
    d.push(['Setor: ' + (ind.setorLabel || ind.setor || '') + ' | Nota Geral: ' + formatarNumero(sc.notaGeral, 1) + '/10 (' + (sc.classificacaoGeral || '') + ')']); // 1
    d.push(['Ponto Forte: ' + (sc.pontoForte || '') + ' | Ponto Fraco: ' + (sc.pontoFraco || '')]); // 2
    d.push([]);
    d.push(['NOTAS POR GRUPO']);
    d.push(['Grupo', 'Nota', 'Peso']);
    var rg = d.length;
    var nomesGrupo = { rentabilidade: 'Rentabilidade', margens: 'Margens', liquidez: 'Liquidez', eficiencia: 'Eficiência' };
    Object.keys(nomesGrupo).forEach(function(k) {
      var g = grupos[k];
      if (g) d.push([nomesGrupo[k], _n(g.nota), _n(g.peso)]);
    });
    var rfg = d.length - 1;

    d.push([]);
    d.push(['INDICADORES DETALHADOS']);
    d.push(['Grupo', 'Indicador', 'Valor', 'Classificação', 'Ruim', 'Regular', 'Bom', 'Excelente']);
    var rind = d.length;

    var grupoData = { Rentabilidade: ind.rentabilidade, Margens: ind.margens, Liquidez: ind.liquidez, 'Eficiência': ind.eficiencia };
    Object.keys(grupoData).forEach(function(nomeGrupo) {
      var g = grupoData[nomeGrupo] || {};
      Object.keys(g).forEach(function(k) {
        var i = g[k];
        if (!i || !i.sigla) return;
        var ref = i.referenciasSetor || {};
        d.push([nomeGrupo, i.sigla + (i.nome ? ' (' + i.nome + ')' : ''), i.valorFormatado || formatarPct(i.valor),
          i.classificacao || '', formatarPct(ref.ruim), formatarPct(ref.regular), formatarPct(ref.bom), formatarPct(ref.excelente)]);
      });
    });
    var rfind = d.length - 1;

    var ws = XLSX.utils.aoa_to_sheet(d);
    ws['!cols'] = [{ wch: 18 }, { wch: 28 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }];

    for (var r = rg; r <= rfg; r++) { _xlFmt(ws, r, 2, XL_PCT); }

    // Colorir classificações
    for (r = rind; r <= rfind; r++) {
      var ref2 = XLSX.utils.encode_cell({ r: r, c: 3 });
      if (ws[ref2] && ws[ref2].v && XL_S_CLASSIF[ws[ref2].v]) {
        _xlS(ws, r, 3, XL_S_CLASSIF[ws[ref2].v]);
      }
    }

    _xlS(ws, 0, 0, XL_S_TITULO); _xlSLinha(ws, 5, 3, XL_S_HEADER);
    _xlSLinha(ws, rind - 1, 8, XL_S_HEADER);
    XLSX.utils.book_append_sheet(wb, ws, 'Indicadores');
  }

  // ─── ABA 8: DUPONT ───────────────────────────

  function _criarAbaDuPont(wb, ind) {
    var dp = ind.dupont || {};
    var comp = dp.componentes || {};
    var an = dp.analise || {};
    var ranking = an.ranking || [];
    var recomendacoes = an.recomendacoes || [];

    var d = [];
    d.push(['Análise DuPont']); // 0
    d.push([]);
    d.push(['DECOMPOSIÇÃO DO ROE']);
    d.push(['ROE', '=', 'Margem Líquida', '×', 'Giro do Ativo', '×', 'Alavancagem']);
    d.push([_n(dp.roe), '', _n(dp.margemLiquida), '', _n(dp.giroAtivo), '', _n(dp.multiplicadorAlavancagem)]);
    d.push([]);
    d.push(['COMPONENTES']);
    d.push(['Componente', 'Valor']);
    var rc = d.length;
    d.push(['Lucro Líquido', _n(comp.lucroLiquido)]);
    d.push(['Receita', _n(comp.receita)]);
    d.push(['Ativo Total', _n(comp.ativo)]);
    d.push(['Patrimônio Líquido', _n(comp.patrimonioLiquido)]);
    d.push([]);
    d.push(['RANKING DE DRIVERS']);
    d.push(['Posição', 'Driver', 'Contribuição']);
    var rr = d.length;
    ranking.forEach(function(item, i) {
      d.push([(i + 1) + '°', item.driver || item.label || '', item.contribuicao || '']);
    });
    d.push([]);
    d.push(['Principal Driver:', an.principalDriver || '']);
    d.push(['Interpretação:', dp.interpretacao || '']);
    d.push([]);
    d.push(['RECOMENDAÇÕES']);
    recomendacoes.forEach(function(rec) { d.push(['• ' + rec]); });

    var ws = XLSX.utils.aoa_to_sheet(d);
    ws['!cols'] = [{ wch: 24 }, { wch: 4 }, { wch: 22 }, { wch: 4 }, { wch: 18 }, { wch: 4 }, { wch: 18 }];
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];

    _xlFmt(ws, 4, 0, XL_PCT); _xlFmt(ws, 4, 2, XL_PCT);
    _xlFmt(ws, 4, 4, XL_MULT); _xlFmt(ws, 4, 6, XL_MULT);
    for (var r = rc; r <= rc + 3; r++) _xlFmt(ws, r, 1, XL_MOEDA_INT);

    _xlS(ws, 0, 0, XL_S_TITULO); _xlS(ws, 2, 0, XL_S_SECAO);
    _xlS(ws, 6, 0, XL_S_SECAO); _xlSLinha(ws, 7, 2, XL_S_HEADER);
    XLSX.utils.book_append_sheet(wb, ws, 'DuPont');
  }

  // ─── ABA 9: DRE ──────────────────────────────

  function _criarAbaDRE(wb, dre) {
    if (!dre || !dre.valido) return;
    var rl = _n(dre.receitaLiquida);

    function pctRL(v) { return rl > 0 ? _n(v) / rl : 0; }

    var d = [];
    d.push(['Demonstração do Resultado do Exercício (DRE)']); // 0
    d.push([]);
    d.push(['Conta', 'Valor (R$)', '% da Receita Líquida']); // 2

    var ri = d.length;
    d.push(['Receita Bruta',                  _n(dre.receitaBruta),             '']);
    d.push(['(-) Deduções',                   _n(dre.deducoesReceita),          '']);
    d.push(['= Receita Líquida',              _n(dre.receitaLiquida),           1]);
    d.push(['(-) CMV',                        _n(dre.cmv),                      pctRL(dre.cmv)]);
    d.push(['= Lucro Bruto',                  _n(dre.lucroBruto),               _n(dre.margemBruta)]);
    d.push(['(-) Despesas Administrativas',   _n(dre.despesasAdministrativas),  pctRL(dre.despesasAdministrativas)]);
    d.push(['(-) Despesas Comerciais',        _n(dre.despesasComerciais),       pctRL(dre.despesasComerciais)]);
    d.push(['(-) Despesas Gerais',            _n(dre.despesasGerais),           pctRL(dre.despesasGerais)]);
    d.push(['(+/-) Outras Receitas/Despesas', _n(dre.outrasReceitasDespesas),   pctRL(dre.outrasReceitasDespesas)]);
    d.push(['= EBITDA',                        _n(dre.ebitda),                   _n(dre.margemEBITDA)]);
    d.push(['(-) Depreciação/Amortização',     _n(dre.depreciacaoAmortizacao),   pctRL(dre.depreciacaoAmortizacao)]);
    d.push(['= EBIT (Lucro Operacional)',      _n(dre.ebit),                     _n(dre.margemEBIT)]);
    d.push(['(+/-) Resultado Financeiro',     _n(dre.resultadoFinanceiro),      pctRL(dre.resultadoFinanceiro)]);
    d.push(['= LAIR',                         _n(dre.lair),                     pctRL(dre.lair)]);
    d.push(['(-) IR/CSLL',                    _n(dre.irCsll),                   pctRL(dre.irCsll)]);
    d.push(['= Lucro Líquido',                _n(dre.lucroLiquido),             _n(dre.margemLiquida)]);
    d.push([]);
    d.push(['NOPAT',                          _n(dre.nopat),                    pctRL(dre.nopat)]);
    d.push(['Alíquota Efetiva',               _n(dre.aliquotaEfetiva),          '']);
    var rf = d.length - 1;

    var ws = XLSX.utils.aoa_to_sheet(d);
    ws['!cols'] = [{ wch: 36 }, { wch: 22 }, { wch: 22 }];
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];

    for (var r = ri; r <= rf; r++) {
      _xlFmt(ws, r, 1, XL_MOEDA_INT);
      _xlFmt(ws, r, 2, XL_PCT);
    }
    _xlFmt(ws, rf, 1, XL_PCT); // alíquota efetiva

    _xlS(ws, 0, 0, XL_S_TITULO); _xlSLinha(ws, 2, 3, XL_S_HEADER);
    // Bold nas linhas de subtotal
    [ri + 2, ri + 4, ri + 10, ri + 12, ri + 14, ri + 16].forEach(function(r2) {
      if (r2 <= rf) _xlS(ws, r2, 0, XL_S_BOLD);
    });
    XLSX.utils.book_append_sheet(wb, ws, 'DRE');
  }

  // ─── ABA 10: BALANÇO ─────────────────────────

  function _criarAbaBalanco(wb, bal) {
    if (!bal || !bal.valido) return;
    var at = bal.ativo || {};
    var ac = at.circulante || {};
    var anc = at.naoCirculante || {};
    var ps = bal.passivo || {};
    var pc = ps.circulante || {};
    var pnc = ps.naoCirculante || {};

    var d = [];
    d.push(['Balanço Patrimonial']); // 0
    d.push([]);
    d.push(['ATIVO', 'Valor (R$)']); // 2
    d.push(['Ativo Circulante']);
    var ri = d.length;
    d.push(['  Caixa', _n(ac.caixa)]);
    d.push(['  Aplicações Financeiras', _n(ac.aplicacoesFinanceiras)]);
    d.push(['  Contas a Receber', _n(ac.contasReceber)]);
    d.push(['  Estoques', _n(ac.estoques)]);
    d.push(['  Outros Circulantes', _n(ac.outrosCirculantes)]);
    d.push(['Total Ativo Circulante', _n(ac.totalCirculante)]);
    d.push(['Ativo Não Circulante']);
    d.push(['  Imobilizado', _n(anc.imobilizado)]);
    d.push(['  Veículos', _n(anc.veiculos)]);
    d.push(['  Máquinas', _n(anc.maquinas)]);
    d.push(['  Intangível', _n(anc.intangivel)]);
    d.push(['  Investimentos', _n(anc.investimentos)]);
    d.push(['  Outros Não Circulantes', _n(anc.outrosNaoCirculantes)]);
    d.push(['Total Ativo Não Circulante', _n(anc.totalNaoCirculante)]);
    d.push(['TOTAL DO ATIVO', _n(at.totalAtivo)]);
    d.push([]);

    d.push(['PASSIVO', 'Valor (R$)']);
    d.push(['Passivo Circulante']);
    d.push(['  Fornecedores', _n(pc.fornecedores)]);
    d.push(['  Empréstimos CP', _n(pc.emprestimosCP)]);
    d.push(['  Salários', _n(pc.salarios)]);
    d.push(['  Impostos', _n(pc.impostos)]);
    d.push(['  Outros Passivos Circulantes', _n(pc.outrosPassivosCirculantes)]);
    d.push(['Total Passivo Circulante', _n(pc.totalCirculante)]);
    d.push(['Passivo Não Circulante']);
    d.push(['  Empréstimos LP', _n(pnc.emprestimosLP)]);
    d.push(['  Provisões', _n(pnc.provisoes)]);
    d.push(['  Outros Passivos Não Circ.', _n(pnc.outrosPassivosNaoCirculantes)]);
    d.push(['Total Passivo Não Circulante', _n(pnc.totalNaoCirculante)]);
    d.push(['TOTAL DO PASSIVO', _n(ps.totalPassivo)]);
    d.push([]);
    d.push(['PATRIMÔNIO LÍQUIDO', _n(bal.patrimonioLiquido)]);
    d.push([]);
    d.push(['PASSIVO + PL', _n((_n(ps.totalPassivo)) + _n(bal.patrimonioLiquido))]);
    d.push([]);
    d.push(['MÉTRICAS DERIVADAS']);
    d.push(['Dívida Bruta', _n(bal.dividaBruta)]);
    d.push(['Dívida Líquida', _n(bal.dividaLiquida)]);
    d.push(['Capital de Giro', _n(bal.capitalDeGiro)]);
    var rf = d.length - 1;

    var ws = XLSX.utils.aoa_to_sheet(d);
    ws['!cols'] = [{ wch: 34 }, { wch: 22 }];
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];

    for (var r = ri; r <= rf; r++) _xlFmt(ws, r, 1, XL_MOEDA_INT);

    _xlS(ws, 0, 0, XL_S_TITULO);
    XLSX.utils.book_append_sheet(wb, ws, 'Balanço');
  }

  // ─── ABA 11: HISTÓRICO ───────────────────────

  function _criarAbaHistorico(wb, hist) {
    if (!hist || !hist.valido) return;
    var anos = hist.anos || [];
    var series = hist.series || {};
    var cagr = hist.cagr || {};
    var yoy = hist.crescimentoYoY || [];
    var tend = hist.tendencias || {};
    var vol = hist.volatilidade || {};

    var d = [];
    d.push(['Análise Histórica']); // 0
    d.push(['Períodos: ' + (hist.numeroPeriodos || anos.length) + ' anos (' + (anos[0] || '') + ' a ' + (anos[anos.length - 1] || '') + ')']);
    d.push([]);
    d.push(['EVOLUÇÃO ANUAL']);
    d.push(['Ano', 'Receita Líquida', 'EBITDA', 'Lucro Líquido', 'Margem Bruta', 'Margem EBITDA', 'Margem Líquida']);
    var ri = d.length;
    anos.forEach(function(ano, i) {
      d.push([
        ano,
        _n((series.receitas || [])[i]),
        _n((series.ebitdas || [])[i]),
        _n((series.lucros || [])[i]),
        _n((series.margensBruta || [])[i]),
        _n((series.margensEBITDA || [])[i]),
        _n((series.margensLiquida || [])[i])
      ]);
    });
    var rf = d.length - 1;

    d.push([]);
    d.push(['TAXAS DE CRESCIMENTO (CAGR)']);
    var rcg = d.length;
    d.push(['CAGR Receita', _n(cagr.receita)]);
    d.push(['CAGR EBITDA', _n(cagr.ebitda)]);
    d.push(['CAGR Lucro', _n(cagr.lucro)]);

    d.push([]);
    d.push(['CRESCIMENTO ANO A ANO (YoY)']);
    d.push(['Período', 'Receita', 'EBITDA', 'Lucro']);
    var ry = d.length;
    yoy.forEach(function(y) {
      d.push([(y.de || '') + ' → ' + (y.para || ''), _n(y.receita), _n(y.ebitda), _n(y.lucro)]);
    });
    var rfy = d.length - 1;

    d.push([]);
    d.push(['TENDÊNCIAS']);
    var rt = d.length;
    var tr = tend.receita || {};
    var tmb = tend.margemBruta || {};
    var tme = tend.margemEBITDA || {};
    var tml = tend.margemLiquida || {};
    d.push(['Receita', tr.classificacao || '', tr.inclinacao != null ? 'Inclinação: ' + formatarNumero(tr.inclinacao, 2) : '']);
    d.push(['Margem Bruta', tmb.classificacao || '']);
    d.push(['Margem EBITDA', tme.classificacao || '']);
    d.push(['Margem Líquida', tml.classificacao || '']);

    d.push([]);
    d.push(['VOLATILIDADE']);
    d.push(['Receita', _n(vol.receita)]);
    d.push(['Margem EBITDA', _n(vol.margemEBITDA)]);
    var rvf = d.length - 1;

    var ws = XLSX.utils.aoa_to_sheet(d);
    ws['!cols'] = [{ wch: 18 }, { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];

    for (var r = ri; r <= rf; r++) {
      _xlFmt(ws, r, 1, XL_MOEDA_INT); _xlFmt(ws, r, 2, XL_MOEDA_INT); _xlFmt(ws, r, 3, XL_MOEDA_INT);
      _xlFmt(ws, r, 4, XL_PCT); _xlFmt(ws, r, 5, XL_PCT); _xlFmt(ws, r, 6, XL_PCT);
    }
    _xlFmt(ws, rcg, 1, XL_PCT); _xlFmt(ws, rcg + 1, 1, XL_PCT); _xlFmt(ws, rcg + 2, 1, XL_PCT);
    for (r = ry; r <= rfy; r++) { _xlFmt(ws, r, 1, XL_PCT); _xlFmt(ws, r, 2, XL_PCT); _xlFmt(ws, r, 3, XL_PCT); }
    _xlFmt(ws, rvf - 1, 1, XL_PCT); _xlFmt(ws, rvf, 1, XL_PCT);

    _xlS(ws, 0, 0, XL_S_TITULO); _xlSLinha(ws, 4, 7, XL_S_HEADER);
    XLSX.utils.book_append_sheet(wb, ws, 'Histórico');
  }

  // ─── ABA 12: GLOSSÁRIO ───────────────────────

  function _criarAbaGlossario(wb, glossario) {
    if (!glossario) return;

    var d = [];
    d.push(['Glossário de Termos Financeiros']); // 0
    d.push([]);
    d.push(['Sigla', 'Termo Completo', 'Explicação']); // 2
    var ri = d.length;
    Object.keys(glossario).forEach(function(chave) {
      var t = glossario[chave];
      if (t) d.push([t.sigla || chave.toUpperCase(), t.nome || '', t.explicacao || '']);
    });

    var ws = XLSX.utils.aoa_to_sheet(d);
    ws['!cols'] = [{ wch: 14 }, { wch: 44 }, { wch: 80 }];
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];

    _xlS(ws, 0, 0, XL_S_TITULO); _xlSLinha(ws, 2, 3, XL_S_HEADER);
    XLSX.utils.book_append_sheet(wb, ws, 'Glossário');
  }

  // ─── FUNÇÃO PRINCIPAL: exportarExcel ─────────

  async function exportarExcel(resultado, opcoes) {
    if (typeof XLSX === 'undefined') {
      throw new Error('SheetJS (XLSX) não está carregado. Inclua o CDN antes deste script.');
    }
    if (!resultado || !resultado.resultados) {
      throw new Error('Resultado de precificação não fornecido.');
    }

    var opc = opcoes || {};
    var res = resultado.resultados || {};
    var con = res.consolidado || {};
    var dcf = res.dcf;
    var mult = res.multiplos;
    var patr = res.patrimonial;
    var ind = res.indicadores;
    var dadosPDF = con.dadosPDF || {};

    var wb = XLSX.utils.book_new();

    // ABA 1: Resumo (sempre)
    _criarAbaResumo(wb, con, dadosPDF, resultado);

    // ABAS 2-4: DCF (se disponível)
    if (dcf && !dcf.erro) {
      _criarAbaDCFProjecao(wb, dcf);
      _criarAbaDCFSensibilidade(wb, dcf);
      _criarAbaDCFCenarios(wb, dcf);
    }

    // ABA 5: Múltiplos (se disponível)
    if (mult && !mult.erro) {
      _criarAbaMultiplos(wb, mult);
    }

    // ABA 6: Patrimonial (se disponível)
    if (patr && !patr.erro) {
      _criarAbaPatrimonial(wb, patr);
    }

    // ABA 7: Indicadores (se disponível)
    if (ind) {
      _criarAbaIndicadores(wb, ind);
      // ABA 8: DuPont
      if (ind.dupont) {
        _criarAbaDuPont(wb, ind);
      }
    }

    // ABA 9: DRE (se fornecida)
    if (opc.dre && opc.dre.valido) {
      _criarAbaDRE(wb, opc.dre);
    }

    // ABA 10: Balanço (se fornecido)
    if (opc.balanco && opc.balanco.valido) {
      _criarAbaBalanco(wb, opc.balanco);
    }

    // ABA 11: Histórico (se fornecido)
    if (opc.historico && opc.historico.valido) {
      _criarAbaHistorico(wb, opc.historico);
    }

    // ABA 12: Glossário
    if (opc.incluirGlossario !== false && dadosPDF.glossario) {
      _criarAbaGlossario(wb, dadosPDF.glossario);
    }

    // Gerar blob
    var wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
  }

  // ─── TESTAR EXCEL ────────────────────────────

  function testarExcel() {
    // Reusar dados demo do testar() PDF + adicionar DRE, Balanço e Histórico
    var resultadoDemo = {
      versao: '2.0.0',
      dataCalculo: '2026-02-28',
      formato: 'novo',
      erro: false,
      alertas: [],
      resultados: {
        dcf: {
          modulo: 'DCF', nomeEmpresa: 'TechBrasil Ltda (DEMO)',
          dataCalculo: '2026-02-28',
          valorMinimo: 6303548, valorMediano: 8706407, valorMaximo: 11516753,
          equityValue: 8706407, erro: false, alertas: [],
          detalhes: {
            enterpriseValue: 13403539, equityValue: 8706407, equityBruto: 12803539,
            descontos: {
              equityBruto: 12803539, descontoIliquidez: 0.20, descontoIliquidezLabel: '20,0% (capital fechado — DLOM)',
              descontoPorte: 0.15, descontoPorteLabel: '15,0% (pequena)', fatorDesconto: 0.68, equityAjustado: 8706407
            },
            wacc: 0.18, taxaCrescimento: 0.08, taxaPerpetua: 0.03, horizonteAnos: 5,
            dividaLiquida: 600000, tipoCapital: 'fechado', porte: 'pequena', setor: 'tecnologia',
            anoBase: { receita: 4500000, custos: 2700000, ebit: 1800000, margemEBIT: 0.40, nopat: 1620000, da: 300000, capex: 300000, deltaWC: 0, fcf: 1620000, margemFCF: 0.36 },
            projecaoAnual: [
              { ano: 1, receita: 4860000, custos: 2916000, ebit: 1944000, margemEBIT: 0.40, nopat: 1749600, da: 324000, capex: 324000, deltaWC: 0, fcf: 1749600, vpFcf: 1482712 },
              { ano: 2, receita: 5248800, custos: 3149280, ebit: 2099520, margemEBIT: 0.40, nopat: 1889568, da: 349920, capex: 349920, deltaWC: 0, fcf: 1889568, vpFcf: 1357371 },
              { ano: 3, receita: 5668704, custos: 3401222, ebit: 2267482, margemEBIT: 0.40, nopat: 2040733, da: 377914, capex: 377914, deltaWC: 0, fcf: 2040733, vpFcf: 1242854 },
              { ano: 4, receita: 6114200, custos: 3673320, ebit: 2448880, margemEBIT: 0.40, nopat: 2203992, da: 408027, capex: 408027, deltaWC: 0, fcf: 2203992, vpFcf: 1138043 },
              { ano: 5, receita: 6603336, custos: 3966802, ebit: 2644534, margemEBIT: 0.40, nopat: 2380082, da: 440669, capex: 440669, deltaWC: 0, fcf: 2380082, vpFcf: 1041094 }
            ],
            valorTerminal: 16344806, vpValorTerminal: 7144465,
            composicao: { valorFluxos: 6259074, valorTerminal: 7144465, percentualFluxos: 0.467, percentualTerminal: 0.533 },
            sensibilidade: {
              linhas: [0.16, 0.17, 0.18, 0.19, 0.20],
              colunas: [0.01, 0.02, 0.03, 0.04, 0.05],
              valores: [
                [14201355, 15610488, 17346432, 19592230, 22593710],
                [12509200, 13625157, 14987302, 16675000, 18808640],
                [11120900, 12029100, 13100540, 14385200, 15954680],
                [9963000, 10710036, 11574000, 12590840, 13810600],
                [8978000, 9612000, 10330707, 11156200, 12118500]
              ],
              central: { wacc: 0.18, taxaPerpetua: 0.03, valor: 13100540 }
            },
            cenarios: {
              pessimista: { equityValue: 6303548, enterpriseValue: 9869923, wacc: 0.20, taxaCrescimento: 0.04, taxaPerpetua: 0.02, vpFluxos: 5381403, vpTerminal: 4488519, percentualTerminal: 0.4548 },
              base:       { equityValue: 8706407, enterpriseValue: 13403539, wacc: 0.18, taxaCrescimento: 0.08, taxaPerpetua: 0.03, vpFluxos: 6259074, vpTerminal: 7144465, percentualTerminal: 0.533 },
              otimista:   { equityValue: 11516753, enterpriseValue: 17536400, wacc: 0.17, taxaCrescimento: 0.12, taxaPerpetua: 0.04, vpFluxos: 7118845, vpTerminal: 10417555, percentualTerminal: 0.5941 }
            }
          }
        },
        multiplos: {
          modulo: 'MULTIPLOS', nomeEmpresa: 'TechBrasil Ltda (DEMO)',
          valorMinimo: 4182000, valorMediano: 17069700, valorMaximo: 41616000,
          equityValue: 17069700, erro: false,
          detalhes: {
            setor: 'tecnologia', porte: 'pequena', tipoCapital: 'fechado',
            metodos: {
              evEbitda: { metodo: 'EV/EBITDA', aplicavel: true, multiploUsado: { min: 8, mediana: 14, max: 25 }, equityAjustado: { min: 11288000, mediana: 20060000, max: 36142000 } },
              evEbit:   { metodo: 'EV/EBIT', aplicavel: true, multiploUsado: { min: 10, mediana: 16, max: 28 }, equityAjustado: { min: 9520000, mediana: 16560000, max: 30800000 } },
              evFcf:    { metodo: 'EV/FCF', aplicavel: true, multiploUsado: { min: 12, mediana: 18, max: 30 }, equityAjustado: { min: 12920000, mediana: 19520000, max: 33600000 } },
              pl:       { metodo: 'P/L', aplicavel: true, multiploUsado: { min: 10, mediana: 20, max: 40 }, equityAjustado: { min: 10800000, mediana: 21600000, max: 43200000 } },
              evReceita:{ metodo: 'EV/Receita', aplicavel: true, multiploUsado: { min: 2, mediana: 4, max: 8 }, equityAjustado: { min: 4182000, mediana: 11016000, max: 23784000 } },
              pvpa:     { metodo: 'P/VPA', aplicavel: true, multiploUsado: { min: 1.5, mediana: 3, max: 5 }, equityAjustado: { min: 3264000, mediana: 6528000, max: 10880000 } }
            },
            descontos: { iliquidez: 0.20, porte: 0.15, total: 0.32 },
            pesos: { evEbitda: 0.25, evEbit: 0.05, evFcf: 0.15, pl: 0.20, evReceita: 0.25, pvpa: 0.10 }
          }
        },
        patrimonial: {
          modulo: 'PATRIMONIAL',
          valorMinimo: 1512500, valorMediano: 3450000, valorMaximo: 4100000,
          equityValue: 3450000, erro: false,
          detalhes: {
            ativosCirculantes: { caixa: 500000, contasReceber: { original: 800000, ajustado: 760000 }, estoques: { original: 600000, ajustado: 540000 }, outros: 300000, total: 2100000 },
            ativosNaoCirculantes: { imoveis: { contabil: 2000000, valorMercado: 2000000 }, veiculos: { contabil: 400000, valorMercado: 400000 }, maquinas: { contabil: 500000, valorMercado: 500000 }, investimentos: 100000, outros: 50000, total: 3050000 },
            totalAtivosTangiveis: 5150000,
            passivos: {
              circulantes: { fornecedores: 400000, salarios: 200000, impostos: 150000, emprestimosCP: 300000, outros: 50000, totalCirculante: 1100000 },
              naoCirculantes: { emprestimosLP: 1000000, provisoes: 200000, outros: 50000, totalNaoCirculante: 1250000 },
              total: 2350000
            },
            plAjustadoTangivel: 2800000,
            intangiveis: { declarados: { marca: 500000, carteiraClientes: 300000, contratos: 100000, licencas: 50000, knowHow: 200000, goodwill: 150000, total: 1300000 }, totalUsado: 1300000 },
            cenarios: {
              conservador: { valor: 1512500, descricao: 'Liquidação forçada com 25% de desconto sobre tangíveis' },
              moderado:    { valor: 3450000, descricao: 'Valor justo com 50% dos intangíveis' },
              otimista:    { valor: 4100000, descricao: 'Going concern com 100% dos intangíveis' }
            },
            ajustes: [
              { item: 'Contas a Receber', contabil: 800000, ajustado: 760000, diferenca: -40000, motivo: 'PDD — inadimplência de 5,0%' },
              { item: 'Estoques', contabil: 600000, ajustado: 540000, diferenca: -60000, motivo: 'Obsolescência de 10,0%' }
            ]
          }
        },
        indicadores: {
          setor: 'tecnologia', setorLabel: 'Tecnologia / SaaS',
          rentabilidade: {
            roi: { sigla: 'ROI', nome: 'Retorno sobre Investimento', valor: 0.4263, valorFormatado: '42,6%', classificacao: 'excelente', referenciasSetor: { ruim: 0.06, regular: 0.14, bom: 0.25, excelente: 0.40 }, formula: 'LL / CI' },
            roe: { sigla: 'ROE', nome: 'Retorno sobre PL', valor: 0.5063, valorFormatado: '50,6%', classificacao: 'excelente', referenciasSetor: { ruim: 0.05, regular: 0.12, bom: 0.20, excelente: 0.35 }, formula: 'LL / PL' }
          },
          margens: {
            bruta: { sigla: 'Margem Bruta', valor: 0.40, valorFormatado: '40,0%', classificacao: 'bom', referenciasSetor: { ruim: 0.15, regular: 0.30, bom: 0.45, excelente: 0.60 }, formula: 'LB / RL' },
            operacional: { sigla: 'Margem Op.', valor: 0.40, valorFormatado: '40,0%', classificacao: 'excelente', referenciasSetor: { ruim: 0.05, regular: 0.12, bom: 0.20, excelente: 0.30 }, formula: 'EBIT / RL' }
          },
          liquidez: {
            corrente: { sigla: 'LC', nome: 'Liquidez Corrente', valor: 1.91, valorFormatado: '1,91', classificacao: 'bom', referenciasSetor: { ruim: 0.8, regular: 1.0, bom: 1.5, excelente: 2.0 }, formula: 'AC / PC' }
          },
          eficiencia: {
            giroAtivo: { sigla: 'Giro Ativo', valor: 0.81, valorFormatado: '0,81x', classificacao: 'regular', referenciasSetor: { ruim: 0.3, regular: 0.6, bom: 1.0, excelente: 1.5 }, formula: 'RL / AT' }
          },
          dupont: {
            margemLiquida: 0.36, giroAtivo: 0.8108, multiplicadorAlavancagem: 1.7344, roe: 0.5063,
            componentes: { lucroLiquido: 1620000, receita: 4500000, ativo: 5550000, patrimonioLiquido: 3200000 },
            analise: { principalDriver: 'Margem Líquida', ranking: [{ driver: 'Margem Líquida', contribuicao: 'Principal gerador' }, { driver: 'Alavancagem', contribuicao: 'Moderada' }, { driver: 'Giro do Ativo', contribuicao: 'Baixo' }], recomendacoes: ['Focar na manutenção da margem líquida elevada', 'Buscar aumento do giro do ativo para ampliar o ROE'] },
            interpretacao: 'ROE de 50,6% é composto por: Margem Líquida 36,0% × Giro do Ativo 0,8x × Alavancagem 1,7x.'
          },
          scorecard: {
            grupos: { rentabilidade: { nota: 10.0, peso: 0.30 }, margens: { nota: 8.8, peso: 0.25 }, liquidez: { nota: 7.1, peso: 0.25 }, eficiencia: { nota: 4.2, peso: 0.20 } },
            notaGeral: 7.8, classificacaoGeral: 'bom', pontoForte: 'Rentabilidade', pontoFraco: 'Eficiência'
          }
        },
        consolidado: {
          erro: false,
          valorMinimo: 1512500, valorMediano: 10582278, valorMaximo: 41616000,
          valorRecomendado: 10582278,
          faixaNegociacao: { minimo: 8994936, recomendado: 10582278, maximo: 12169620 },
          pesos: { tipo: 'crescimento', dcf: 0.45, multiplos: 0.35, patrimonial: 0.20, justificativa: 'Perfil de crescimento: DCF com maior peso por capturar potencial futuro.' },
          alertas: [{ tipo: 'aviso', titulo: 'Divergência significativa', mensagem: 'A avaliação por múltiplos apresenta dispersão elevada entre métodos.' }],
          dadosPDF: {
            titulo: 'Relatório de Precificação', data: '2026-02-28',
            nomeEmpresa: 'TechBrasil Ltda (DEMO)',
            glossario: {
              dcf: { sigla: 'DCF', nome: 'Discounted Cash Flow', explicacao: 'Método de fluxo de caixa descontado que projeta fluxos futuros e traz a valor presente.' },
              wacc: { sigla: 'WACC', nome: 'Weighted Average Cost of Capital', explicacao: 'Custo médio ponderado de capital, usado como taxa de desconto.' },
              ebitda: { sigla: 'EBITDA', nome: 'Earnings Before Interest, Taxes, Depreciation and Amortization', explicacao: 'Lucro antes de juros, impostos, depreciação e amortização.' },
              ebit: { sigla: 'EBIT', nome: 'Earnings Before Interest and Taxes', explicacao: 'Lucro antes de juros e impostos (lucro operacional).' },
              fcf: { sigla: 'FCF', nome: 'Free Cash Flow', explicacao: 'Fluxo de caixa livre disponível para investidores.' },
              nopat: { sigla: 'NOPAT', nome: 'Net Operating Profit After Taxes', explicacao: 'Lucro operacional líquido após impostos.' },
              ev: { sigla: 'EV', nome: 'Enterprise Value', explicacao: 'Valor da empresa (firma), inclui dívida líquida.' },
              roi: { sigla: 'ROI', nome: 'Return on Investment', explicacao: 'Retorno sobre o investimento total.' },
              roe: { sigla: 'ROE', nome: 'Return on Equity', explicacao: 'Retorno sobre o patrimônio líquido.' },
              dlom: { sigla: 'DLOM', nome: 'Discount for Lack of Marketability', explicacao: 'Desconto por falta de liquidez de mercado.' }
            }
          }
        }
      }
    };

    // DRE demo
    var dreDemo = {
      valido: true, receitaBruta: 5000000, deducoesReceita: 500000, receitaLiquida: 4500000,
      cmv: 2700000, lucroBruto: 1800000, despesasAdministrativas: 450000, despesasComerciais: 270000,
      despesasGerais: 180000, outrasReceitasDespesas: 0, ebit: 900000, depreciacaoAmortizacao: 300000,
      ebitda: 1200000, resultadoFinanceiro: -120000, lair: 780000, irCsll: 234000, lucroLiquido: 546000,
      nopat: 810000, aliquotaEfetiva: 0.30, margemBruta: 0.40, margemEBIT: 0.20, margemEBITDA: 0.267, margemLiquida: 0.121
    };

    // Balanço demo
    var balancoDemo = {
      valido: true,
      ativo: {
        circulante: { caixa: 500000, aplicacoesFinanceiras: 200000, contasReceber: 800000, estoques: 600000, outrosCirculantes: 100000, totalCirculante: 2200000 },
        naoCirculante: { imobilizado: 2000000, veiculos: 400000, maquinas: 500000, intangivel: 150000, investimentos: 100000, outrosNaoCirculantes: 200000, totalNaoCirculante: 3350000 },
        totalAtivo: 5550000
      },
      passivo: {
        circulante: { fornecedores: 400000, emprestimosCP: 300000, salarios: 200000, impostos: 150000, outrosPassivosCirculantes: 100000, totalCirculante: 1150000 },
        naoCirculante: { emprestimosLP: 1000000, provisoes: 200000, outrosPassivosNaoCirculantes: 0, totalNaoCirculante: 1200000 },
        totalPassivo: 2350000
      },
      patrimonioLiquido: 3200000, dividaBruta: 1300000, dividaLiquida: 600000, capitalDeGiro: 1050000
    };

    // Histórico demo
    var historicoDemo = {
      valido: true, numeroPeriodos: 3, anos: [2023, 2024, 2025],
      series: {
        receitas: [3500000, 4000000, 4500000], ebitdas: [800000, 1000000, 1200000], lucros: [350000, 450000, 546000],
        margensBruta: [0.38, 0.39, 0.40], margensEBITDA: [0.229, 0.250, 0.267], margensLiquida: [0.10, 0.113, 0.121]
      },
      cagr: { receita: 0.134, ebitda: 0.225, lucro: 0.249 },
      crescimentoYoY: [
        { de: 2023, para: 2024, receita: 0.143, ebitda: 0.250, lucro: 0.286 },
        { de: 2024, para: 2025, receita: 0.125, ebitda: 0.200, lucro: 0.213 }
      ],
      tendencias: {
        receita: { classificacao: 'crescente', inclinacao: 500000 },
        margemBruta: { classificacao: 'estável' }, margemEBITDA: { classificacao: 'crescente' }, margemLiquida: { classificacao: 'crescente' }
      },
      volatilidade: { receita: 0.067, margemEBITDA: 0.042 }
    };

    console.log('[ValuationExportar] Gerando Excel de demonstração...');
    return exportarExcel(resultadoDemo, {
      dre: dreDemo,
      balanco: balancoDemo,
      historico: historicoDemo,
      incluirGlossario: true
    }).then(function(blob) {
      download(blob, 'Valuation_DEMO_' + new Date().toISOString().slice(0, 10) + '.xlsx');
      console.log('[ValuationExportar] Excel de demonstração gerado com sucesso!');
      return blob;
    });
  }

  // ─────────────────────────────────────────────
  // API PÚBLICA
  // ─────────────────────────────────────────────

  var API = {
    VERSION: VERSION,
    exportarPDF: exportarPDF,
    exportarExcel: exportarExcel,
    download: download,

    // Gráficos (Chart.js → canvas → base64 PNG)
    gerarGraficoFootballField: gerarGraficoFootballField,
    gerarGraficoWaterfall: gerarGraficoWaterfall,
    gerarGraficoSensibilidade: gerarGraficoSensibilidade,
    gerarGraficoCenarios: gerarGraficoCenarios,
    gerarGraficoScorecard: gerarGraficoScorecard,
    gerarGraficoDuPont: gerarGraficoDuPont,
    gerarGraficoComposicaoEV: gerarGraficoComposicaoEV,
    gerarGraficoProjecaoFCF: gerarGraficoProjecaoFCF,
    gerarGraficoMultiplos: gerarGraficoMultiplos,
    gerarGraficoPercentis: gerarGraficoPercentis,

    testar: testar,
    testarExcel: testarExcel
  };

  return API;
});
