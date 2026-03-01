/**
 * IMPOST. — Exportador Lucro Presumido v1.0.0
 * Modulo de exportacao profissional: PDF + Excel (.xlsx)
 * Dependencias: jsPDF 2.5.2, jspdf-autotable 3.8.4, Chart.js 4.4.1, SheetJS (xlsx) 0.20.3
 * Motor base: LucroPresumido v3.11.0 + EstudoLP v1.0.0
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else if (typeof globalThis !== 'undefined') globalThis.ExportadorLP = factory();
  if (typeof window !== 'undefined') window.ExportadorLP = factory();
})(this, function () {
  'use strict';

  const VERSION = '1.0.0';

  // ═══════════════════════════════════════════════════
  // CONSTANTES DE DESIGN
  // ═══════════════════════════════════════════════════

  const CORES = {
    azulEscuro:    [6, 10, 19],
    azulMedio:     [22, 30, 49],
    azulClaro:     [30, 45, 70],
    verde:         [16, 185, 129],
    verdeClaro:    [209, 250, 229],
    vermelho:      [239, 68, 68],
    vermelhoClaro: [254, 226, 226],
    amarelo:       [245, 158, 11],
    amareloClaro:  [254, 243, 199],
    azulAccent:    [59, 130, 246],
    branco:        [255, 255, 255],
    cinzaClaro:    [200, 210, 220],
    cinzaMedio:    [120, 130, 150],
    headerBg:      [22, 30, 49],
    headerText:    [255, 255, 255],
    rowEven:       [248, 250, 252],
    rowOdd:        [255, 255, 255],
    totalRow:      [16, 185, 129],
    totalText:     [255, 255, 255],
  };

  const CHART_COLORS = {
    irpj:    'rgba(239, 68, 68, 0.8)',
    csll:    'rgba(245, 158, 11, 0.8)',
    pis:     'rgba(59, 130, 246, 0.8)',
    cofins:  'rgba(139, 92, 246, 0.8)',
    iss:     'rgba(16, 185, 129, 0.8)',
    inss:    'rgba(107, 114, 128, 0.8)',
    lp:      'rgba(16, 185, 129, 1)',
    lr:      'rgba(59, 130, 246, 1)',
  };

  const LAYOUT = {
    marginLeft: 20,
    marginRight: 15,
    marginTop: 25,
    marginBottom: 20,
    pageWidth: 210,
    pageHeight: 297,
    contentWidth: 175, // 210 - 20 - 15
  };

  const FONTSIZES = {
    titulo: 22,
    subtitulo: 16,
    secao: 13,
    corpo: 10,
    rodape: 7,
    tabela: 8,
    kpi: 9,
  };

  const OPCOES_PADRAO = {
    incluirCapa: true,
    incluirSumario: true,
    incluirGraficos: true,
    incluirAnexoLegal: true,
    incluirDisclaimer: true,
    incluirMarcaDagua: false,
    orientacao: 'portrait',
    qualidadeGraficos: 2,
    incluirFormulas: true,
    incluirFormatacao: true,
    abaSeparadaPorSocio: false,
    idioma: 'pt-BR',
    moeda: 'BRL',
    nomeArquivoPDF: null,
    nomeArquivoExcel: null,
    logoBase64: null,
    logoWidth: 40,
    logoHeight: 15,
  };

  const MESES_NOMES = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const MESES_CURTOS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  // ═══════════════════════════════════════════════════
  // HELPERS — Formatacao
  // ═══════════════════════════════════════════════════

  function _safe(valor, fallback) {
    if (fallback === undefined) fallback = 0;
    if (valor === null || valor === undefined || (typeof valor === 'number' && isNaN(valor))) return fallback;
    return valor;
  }

  function _fmtR$(valor) {
    var v = _safe(valor, 0);
    if (typeof v !== 'number') v = parseFloat(v) || 0;
    return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function _fmtPct(valor) {
    var v = _safe(valor, 0);
    if (typeof v === 'string') {
      v = parseFloat(v.replace('%', '').replace(',', '.')) || 0;
    }
    return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
  }

  function _fmtNum(valor) {
    var v = _safe(valor, 0);
    return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function _fmtCNPJ(cnpj) {
    if (!cnpj) return '';
    var c = String(cnpj).replace(/\D/g, '');
    if (c.length !== 14) return cnpj;
    return c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }

  function _sanitizarNome(nome) {
    if (!nome) return 'empresa';
    return nome.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 50);
  }

  function _dataFormatada() {
    var d = new Date();
    var dd = String(d.getDate()).padStart(2, '0');
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var yyyy = d.getFullYear();
    return dd + '/' + mm + '/' + yyyy;
  }

  function _dataArquivo() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function _getAtividadeDescricao(atividadeId) {
    if (!atividadeId) return 'Nao informada';
    if (typeof LucroPresumido !== 'undefined' && LucroPresumido.getAtividadesDisponiveis) {
      var atividades = LucroPresumido.getAtividadesDisponiveis();
      for (var i = 0; i < atividades.length; i++) {
        if (atividades[i].id === atividadeId) return atividades[i].descricao || atividadeId;
      }
    }
    return atividadeId;
  }

  // ═══════════════════════════════════════════════════
  // HELPERS — PDF
  // ═══════════════════════════════════════════════════

  var _paginas = {}; // mapa secao -> pagina

  function _checkPage(doc, alturaMinima) {
    var y = doc.__lastY || LAYOUT.marginTop;
    if (y + (alturaMinima || 30) > LAYOUT.pageHeight - LAYOUT.marginBottom) {
      doc.addPage();
      _addHeaderFooter(doc);
      doc.__lastY = LAYOUT.marginTop + 5;
      return doc.__lastY;
    }
    return y;
  }

  function _setY(doc, y) {
    doc.__lastY = y;
    return y;
  }

  function _getY(doc) {
    return doc.__lastY || LAYOUT.marginTop;
  }

  function _addHeaderFooter(doc, secaoTitulo) {
    var pag = doc.getNumberOfPages();
    if (pag <= 1) return; // capa nao tem header/footer
    var empresa = doc.__empresa || '';
    var titulo = secaoTitulo || doc.__secaoAtual || '';

    // Header
    doc.setFontSize(7);
    doc.setTextColor(120, 130, 150);
    doc.setFont('helvetica', 'normal');
    doc.text(empresa, LAYOUT.marginLeft, 12);
    doc.text(titulo, LAYOUT.pageWidth / 2, 12, { align: 'center' });
    doc.text('IMPOST.', LAYOUT.pageWidth - LAYOUT.marginRight, 12, { align: 'right' });
    doc.setDrawColor(200, 210, 220);
    doc.setLineWidth(0.3);
    doc.line(LAYOUT.marginLeft, 15, LAYOUT.pageWidth - LAYOUT.marginRight, 15);

    // Footer
    var dataEstudo = doc.__dataEstudo || _dataFormatada();
    doc.setFontSize(7);
    doc.setTextColor(120, 130, 150);
    doc.text('Estudo Tributario — Lucro Presumido | Pag ' + pag + ' | ' + dataEstudo, LAYOUT.marginLeft, LAYOUT.pageHeight - 10);
    doc.text('Documento gerado por IMPOST. — Uso exclusivo do destinatario', LAYOUT.pageWidth - LAYOUT.marginRight, LAYOUT.pageHeight - 10, { align: 'right' });
  }

  function _novaPagina(doc, secaoTitulo) {
    doc.addPage();
    doc.__secaoAtual = secaoTitulo || '';
    _addHeaderFooter(doc, secaoTitulo);
    doc.__lastY = LAYOUT.marginTop + 5;
    return doc.__lastY;
  }

  function _tituloSecao(doc, opts) {
    var y = _checkPage(doc, 30);
    var numero = opts.numero || '';
    var titulo = opts.titulo || '';
    var subtitulo = opts.subtitulo || '';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(FONTSIZES.secao);
    doc.setTextColor(22, 30, 49);
    var textoTitulo = numero ? numero + '. ' + titulo : titulo;
    doc.text(textoTitulo, LAYOUT.marginLeft, y);
    y += 2;

    // Linha decorativa verde
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.8);
    doc.line(LAYOUT.marginLeft, y, LAYOUT.marginLeft + 50, y);
    y += 4;

    if (subtitulo) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(120, 130, 150);
      doc.text(subtitulo, LAYOUT.marginLeft, y);
      y += 5;
    }

    y += 2;
    return _setY(doc, y);
  }

  function _kpiBox(doc, x, y, w, h, opts) {
    var label = opts.label || '';
    var valor = opts.valor || '';
    var sublabel = opts.sublabel || '';
    var corBorda = opts.corBorda || CORES.azulAccent;

    // Fundo
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, w, h, 2, 2, 'F');
    // Borda esquerda colorida
    doc.setFillColor(corBorda[0], corBorda[1], corBorda[2]);
    doc.rect(x, y, 2, h, 'F');

    // Label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(120, 130, 150);
    doc.text(label, x + 5, y + 6);

    // Valor
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(22, 30, 49);
    var valorStr = String(valor);
    if (valorStr.length > 18) {
      doc.setFontSize(9);
    }
    doc.text(valorStr, x + 5, y + 14);

    // Sublabel
    if (sublabel) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(120, 130, 150);
      doc.text(sublabel, x + 5, y + 19);
    }
  }

  function _kpiGrid(doc, y, kpis, cols) {
    cols = cols || 3;
    var kpiW = (LAYOUT.contentWidth - (cols - 1) * 4) / cols;
    var kpiH = 22;
    var row = 0;
    for (var i = 0; i < kpis.length; i++) {
      var col = i % cols;
      if (i > 0 && col === 0) { row++; y += kpiH + 3; }
      y = _checkPage(doc, kpiH + 5);
      var x = LAYOUT.marginLeft + col * (kpiW + 4);
      _kpiBox(doc, x, y, kpiW, kpiH, kpis[i]);
    }
    y += kpiH + 5;
    return _setY(doc, y);
  }

  function _tabelaProfissional(doc, opts) {
    var head = opts.head || [];
    var body = opts.body || [];
    var startY = opts.startY || _getY(doc);
    var totalRow = opts.totalRow; // indice(s) das linhas de total
    var notaRodape = opts.notaRodape || '';
    var fontSize = opts.fontSize || FONTSIZES.tabela;
    var columnStyles = opts.columnStyles || {};

    startY = _checkPage(doc, 40);

    var totalRows = Array.isArray(totalRow) ? totalRow : (totalRow !== undefined ? [totalRow] : []);

    doc.autoTable({
      head: [head],
      body: body,
      startY: startY,
      margin: { left: LAYOUT.marginLeft, right: LAYOUT.marginRight },
      styles: {
        fontSize: fontSize,
        cellPadding: 2,
        lineColor: [200, 210, 220],
        lineWidth: 0.2,
        font: 'helvetica',
        textColor: [30, 30, 30],
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: CORES.headerBg,
        textColor: CORES.headerText,
        fontStyle: 'bold',
        halign: 'center',
      },
      alternateRowStyles: {
        fillColor: CORES.rowEven,
      },
      columnStyles: columnStyles,
      didParseCell: function(data) {
        if (data.section === 'body') {
          // Linhas de total
          if (totalRows.indexOf(data.row.index) !== -1) {
            data.cell.styles.fillColor = CORES.totalRow;
            data.cell.styles.textColor = CORES.totalText;
            data.cell.styles.fontStyle = 'bold';
          }
          // Valores negativos em vermelho
          var cellText = String(data.cell.raw || '');
          if (cellText.indexOf('-') === 0 || cellText.indexOf('(-)') !== -1) {
            if (totalRows.indexOf(data.row.index) === -1) {
              data.cell.styles.textColor = CORES.vermelho;
            }
          }
        }
      },
    });

    var finalY = doc.lastAutoTable.finalY + 3;

    if (notaRodape) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(120, 130, 150);
      var lines = doc.splitTextToSize(notaRodape, LAYOUT.contentWidth);
      doc.text(lines, LAYOUT.marginLeft, finalY);
      finalY += lines.length * 3.5;
    }

    return _setY(doc, finalY + 2);
  }

  function _alertaBox(doc, opts) {
    var tipo = opts.tipo || 'info';
    var titulo = opts.titulo || '';
    var texto = opts.texto || '';
    var baseLegal = opts.baseLegal || '';
    var y = opts.y || _getY(doc);

    var cores = {
      verde: { bg: [230, 255, 243], borda: [16, 185, 129], texto: [10, 80, 55] },
      amarelo: { bg: [255, 249, 230], borda: [245, 158, 11], texto: [120, 80, 5] },
      vermelho: { bg: [255, 235, 235], borda: [239, 68, 68], texto: [120, 30, 30] },
      info: { bg: [235, 245, 255], borda: [59, 130, 246], texto: [20, 50, 100] },
    };
    var c = cores[tipo] || cores.info;

    var lines = doc.splitTextToSize(texto, LAYOUT.contentWidth - 14);
    var h = 12 + lines.length * 4 + (baseLegal ? 8 : 0);
    y = _checkPage(doc, h + 5);

    // Fundo
    doc.setFillColor(c.bg[0], c.bg[1], c.bg[2]);
    doc.roundedRect(LAYOUT.marginLeft, y, LAYOUT.contentWidth, h, 2, 2, 'F');
    // Borda esquerda
    doc.setFillColor(c.borda[0], c.borda[1], c.borda[2]);
    doc.rect(LAYOUT.marginLeft, y, 3, h, 'F');

    // Titulo
    if (titulo) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(c.texto[0], c.texto[1], c.texto[2]);
      doc.text(titulo, LAYOUT.marginLeft + 7, y + 6);
    }

    // Texto
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(c.texto[0], c.texto[1], c.texto[2]);
    doc.text(lines, LAYOUT.marginLeft + 7, y + (titulo ? 12 : 6));

    // Base legal
    if (baseLegal) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.text('Base Legal: ' + baseLegal, LAYOUT.marginLeft + 7, y + h - 4);
    }

    y += h + 4;
    return _setY(doc, y);
  }

  function _refLegal(doc, opts) {
    var y = opts.y || _getY(doc);
    y = _checkPage(doc, 10);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(120, 130, 150);
    var text = opts.texto || '';
    if (opts.lei) text += ' — ' + opts.lei;
    if (opts.artigo) text += ', ' + opts.artigo;
    var lines = doc.splitTextToSize(text, LAYOUT.contentWidth);
    doc.text(lines, LAYOUT.marginLeft, y);
    y += lines.length * 3.5 + 2;
    return _setY(doc, y);
  }

  function _notaExplicativa(doc, opts) {
    var y = opts.y || _getY(doc);
    y = _checkPage(doc, 10);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(100, 110, 130);
    var lines = doc.splitTextToSize(opts.texto || '', LAYOUT.contentWidth);
    doc.text(lines, LAYOUT.marginLeft, y);
    y += lines.length * 3.5 + 2;
    return _setY(doc, y);
  }

  function _textoCorpo(doc, texto, y, opts) {
    opts = opts || {};
    y = y || _getY(doc);
    y = _checkPage(doc, 15);
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    doc.setFontSize(opts.fontSize || FONTSIZES.corpo);
    doc.setTextColor(opts.color || [30, 30, 30]);
    var maxW = opts.maxWidth || LAYOUT.contentWidth;
    var lines = doc.splitTextToSize(texto, maxW);
    doc.text(lines, opts.x || LAYOUT.marginLeft, y);
    y += lines.length * (opts.lineHeight || 4.5) + 3;
    return _setY(doc, y);
  }

  // ═══════════════════════════════════════════════════
  // HELPERS — Graficos (off-screen Chart.js → PNG)
  // ═══════════════════════════════════════════════════

  function _renderChartToImage(config, width, height, scale) {
    if (typeof Chart === 'undefined') return null;
    scale = scale || 2;
    try {
      var canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      canvas.style.display = 'none';
      document.body.appendChild(canvas);

      var ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);

      var chart = new Chart(ctx, {
        type: config.type,
        data: config.data,
        options: Object.assign({}, config.options || {}, {
          responsive: false,
          animation: false,
          devicePixelRatio: scale,
          plugins: Object.assign({}, (config.options || {}).plugins || {}, {
            legend: Object.assign({ labels: { font: { size: 10 } } }, ((config.options || {}).plugins || {}).legend || {}),
          }),
        }),
      });

      var imgData = canvas.toDataURL('image/png');
      chart.destroy();
      document.body.removeChild(canvas);
      return imgData;
    } catch (e) {
      console.error('[ExportadorLP] Erro ao renderizar grafico:', e);
      return null;
    }
  }

  function _inserirGrafico(doc, opts) {
    var y = opts.y || _getY(doc);
    var w = opts.w || 170;
    var h = opts.h || 80;
    y = _checkPage(doc, h + 10);

    var img = _renderChartToImage(opts.config, w * 2, h * 2, opts.scale || 2);
    if (img) {
      var x = opts.x || LAYOUT.marginLeft;
      doc.addImage(img, 'PNG', x, y, w, h);
      y += h + 5;
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('[Grafico nao disponivel — Chart.js nao carregado]', LAYOUT.marginLeft, y + 10);
      y += 20;
    }
    return _setY(doc, y);
  }

  // ═══════════════════════════════════════════════════
  // SECAO 0: CAPA
  // ═══════════════════════════════════════════════════

  function _gerarCapaPDF(doc, dados) {
    var fd = dados.formData || {};
    var y = 40;

    // Logo IMPOST. estilizado
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(36);
    doc.setTextColor(16, 185, 129);
    doc.text('IMPOST.', LAYOUT.pageWidth / 2, y, { align: 'center' });
    y += 20;

    // Titulo
    doc.setFontSize(28);
    doc.setTextColor(22, 30, 49);
    doc.text('ESTUDO TRIBUTARIO', LAYOUT.pageWidth / 2, y, { align: 'center' });
    y += 12;

    // Subtitulo
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(120, 130, 150);
    var anoCalendario = fd.anoCalendario || 2026;
    doc.text('Regime de Lucro Presumido — Exercicio ' + anoCalendario, LAYOUT.pageWidth / 2, y, { align: 'center' });
    y += 8;

    // Linha decorativa verde
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(1.5);
    doc.line(60, y, 150, y);
    y += 20;

    // Box dados da empresa
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(35, y, 140, 80, 3, 3, 'F');
    doc.setDrawColor(200, 210, 220);
    doc.setLineWidth(0.3);
    doc.roundedRect(35, y, 140, 80, 3, 3, 'S');

    var bx = 42;
    var by = y + 10;

    function _capaLinha(label, valor) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(120, 130, 150);
      doc.text(label, bx, by);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(22, 30, 49);
      doc.text(String(valor || '—'), bx + 45, by);
      by += 8;
    }

    _capaLinha('Razao Social', fd.razaoSocial || 'Nao informada');
    _capaLinha('CNPJ', _fmtCNPJ(fd.cnpj));
    _capaLinha('CNAE', fd.cnaePrincipal || 'Nao informado');
    _capaLinha('UF/Municipio', (fd.estado || '') + (fd.municipio ? ' / ' + fd.municipio : ''));
    _capaLinha('Atividade', _getAtividadeDescricao(fd.atividadeId));

    // Receita destaque
    y += 88;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(120, 130, 150);
    doc.text('Receita Bruta Anual', LAYOUT.pageWidth / 2, y, { align: 'center' });
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(16, 185, 129);
    doc.text(_fmtR$(fd.receitaBrutaAnual), LAYOUT.pageWidth / 2, y, { align: 'center' });
    y += 15;

    // Data do estudo
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(120, 130, 150);
    doc.text('Data do Estudo: ' + _dataFormatada(), LAYOUT.pageWidth / 2, y, { align: 'center' });
    y += 6;

    // Versoes do motor
    var lpVer = (typeof LucroPresumido !== 'undefined' && LucroPresumido.VERSION) ? LucroPresumido.VERSION : '3.11.0';
    var estVer = (typeof EstudoLP !== 'undefined' && EstudoLP.VERSION) ? EstudoLP.VERSION : '1.0.0';
    doc.setFontSize(8);
    doc.text('Motor: LucroPresumido v' + lpVer + ' | EstudoLP v' + estVer + ' | Exportador v' + VERSION, LAYOUT.pageWidth / 2, y, { align: 'center' });

    // Rodape capa
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Documento confidencial — Uso exclusivo do destinatario', LAYOUT.pageWidth / 2, LAYOUT.pageHeight - 15, { align: 'center' });
  }

  // ═══════════════════════════════════════════════════
  // SECAO 1: SUMARIO
  // ═══════════════════════════════════════════════════

  function _gerarSumarioPDF(doc, dados) {
    _novaPagina(doc, 'Sumario');
    var y = _tituloSecao(doc, { titulo: 'Sumario', subtitulo: 'Indice do Estudo Tributario' });

    var itens = [
      { num: '1', titulo: 'Resumo Executivo', key: 'resumoExecutivo' },
      { num: '2', titulo: 'Simulacao Rapida', key: 'simulacao' },
      { num: '3', titulo: 'Apuracao Trimestral IRPJ/CSLL', key: 'trimestral' },
      { num: '4', titulo: 'Apuracao Mensal PIS/COFINS', key: 'piscofins' },
      { num: '5', titulo: 'Consolidacao Anual', key: 'anual' },
      { num: '6', titulo: 'Distribuicao de Lucros', key: 'anual' },
      { num: '7', titulo: 'Analise Break-Even LP vs LR', key: 'breakeven' },
      { num: '8', titulo: 'Otimizacao de Pro-Labore', key: 'proLabore' },
      { num: '9', titulo: 'Simulacao JCP', key: 'jcp' },
      { num: '10', titulo: 'Beneficio ECD', key: 'ecd' },
      { num: '11', titulo: 'Regime de Caixa vs Competencia', key: 'regimeCaixa' },
      { num: '12', titulo: 'Impacto LC 224/2025', key: 'lc224' },
      { num: '13', titulo: 'Calendario Tributario', key: '_always' },
      { num: '14', titulo: 'Dicas de Economia Tributaria', key: 'dicas' },
      { num: '15', titulo: 'Economia Potencial Consolidada', key: 'economiaPotencial' },
      { num: '16', titulo: 'Vantagens e Desvantagens do LP', key: 'vantagens' },
      { num: '17', titulo: 'Obrigacoes Acessorias', key: '_always' },
      { num: '18', titulo: 'Riscos Fiscais', key: '_always' },
      { num: '19', titulo: 'Incentivos Regionais', key: 'reducaoRegional' },
      { num: '20', titulo: 'Transicao de Regime', key: '_always' },
      { num: '21', titulo: 'Anexo: Fundamentacao Legal', key: '_always' },
      { num: '22', titulo: 'Disclaimer Juridico', key: '_always' },
    ];

    var results = dados.results || {};

    for (var i = 0; i < itens.length; i++) {
      var item = itens[i];
      var disponivel = item.key === '_always' || !!results[item.key];
      if (item.key === 'proLabore') disponivel = results.proLabore && results.proLabore.length > 0;
      if (item.key === 'dicas') disponivel = results.dicas && results.dicas.length > 0;
      if (item.key === 'reducaoRegional') {
        disponivel = (results.reducaoRegional && results.reducaoRegional.ativo) ||
                     (results.beneficiosZFM && results.beneficiosZFM.zonaFranca) ||
                     !!results.comparativoRegional;
      }

      doc.setFont('helvetica', disponivel ? 'normal' : 'normal');
      doc.setFontSize(10);
      doc.setTextColor(disponivel ? [22, 30, 49] : [180, 180, 180]);

      var texto = item.num + '. ' + item.titulo;
      doc.text(texto, LAYOUT.marginLeft + 5, y);

      // Pontilhado
      var tw = doc.getTextWidth(texto);
      doc.setTextColor(180, 180, 180);
      var dots = '';
      var dotsW = 0;
      while (dotsW < LAYOUT.contentWidth - tw - 35) {
        dots += '.';
        dotsW = doc.getTextWidth(dots);
      }
      doc.text(dots, LAYOUT.marginLeft + 5 + tw + 2, y);

      y += 9;
      y = _checkPage(doc, 10);
    }

    return _setY(doc, y);
  }

  // ═══════════════════════════════════════════════════
  // SECAO 2: RESUMO EXECUTIVO
  // ═══════════════════════════════════════════════════

  function _gerarSumarioExecutivoPDF(doc, dados) {
    var res = dados.results || {};
    var re = res.resumoExecutivo;
    if (!re) return;
    var fd = dados.formData || {};

    _novaPagina(doc, 'Resumo Executivo');
    var y = _tituloSecao(doc, { numero: '1', titulo: 'Resumo Executivo', subtitulo: 'Visao geral do estudo tributario' });

    // 2.1 KPIs 3x2
    var kpis = [
      { label: 'Receita Bruta Anual', valor: _fmtR$(re.receitaBrutaAnual), corBorda: CORES.azulAccent },
      { label: 'Carga Tributaria Total', valor: _fmtR$(re.cargaTributariaTotal), corBorda: CORES.vermelho },
      { label: '% Carga sobre Receita', valor: re.percentualCargaTributaria || '—', corBorda: CORES.amarelo },
      { label: 'Lucro Distribuivel Isento', valor: _fmtR$(re.lucroDistribuivelIsento), corBorda: CORES.verde },
      { label: 'Economia Potencial', valor: _fmtR$(re.economiaPotencial), corBorda: CORES.verde },
      { label: 'Regime Recomendado', valor: re.regimeRecomendado || 'LP', corBorda: re.regimeRecomendado === 'LR' ? CORES.vermelho : CORES.verde },
    ];
    y = _kpiGrid(doc, y, kpis, 3);

    // 2.2 Texto descritivo
    var percentualPresuncao = re.percentualPresuncao || '32%';
    var texto1 = 'A empresa ' + (re.empresa || fd.razaoSocial || '') + ', inscrita sob CNPJ ' + _fmtCNPJ(re.cnpj || fd.cnpj) +
      ', enquadrada na atividade de ' + (re.atividade || _getAtividadeDescricao(fd.atividadeId)) +
      ' com percentual de presuncao de ' + percentualPresuncao + ' para IRPJ, apresenta receita bruta anual de ' +
      _fmtR$(re.receitaBrutaAnual) + '. A carga tributaria total estimada no regime de Lucro Presumido e de ' +
      _fmtR$(re.cargaTributariaTotal) + ', representando ' + (re.percentualCargaTributaria || '—') + ' da receita bruta.';
    y = _textoCorpo(doc, texto1, y);

    var breakEvenMargem = re.breakEvenMargem || (res.breakeven ? res.breakeven.breakEvenMargem : null);
    var margemOp = re.margemOperacionalBruta || (res.breakeven ? res.breakeven.margemOperacionalBruta : null);
    if (breakEvenMargem || margemOp) {
      var texto2 = 'O break-even em relacao ao Lucro Real ocorre na margem de lucro de ' +
        (breakEvenMargem ? breakEvenMargem + '%' : 'N/A') + '. A margem operacional bruta estimada da empresa e de ' +
        (margemOp ? _fmtPct(margemOp) : 'N/A') + '.';
      y = _textoCorpo(doc, texto2, y);
    }

    y = _textoCorpo(doc, 'O regime recomendado e: ' + (re.regimeRecomendado || 'Lucro Presumido') + '.', y, { bold: true });

    // 2.3 Top Acoes de Economia
    if (re.acoesEconomia && re.acoesEconomia.length > 0) {
      y = _checkPage(doc, 40);
      y = _tituloSecao(doc, { titulo: 'Acoes de Economia Identificadas' });
      var headAcoes = ['#', 'Acao', 'Valor Estimado', 'Tipo', 'Aplicada?'];
      var bodyAcoes = [];
      var top = Math.min(re.acoesEconomia.length, 5);
      for (var i = 0; i < top; i++) {
        var a = re.acoesEconomia[i];
        bodyAcoes.push([
          String(i + 1),
          a.acao || '',
          _fmtR$(_safe(a.valor)),
          a.tipo || '',
          a.jaAplicada ? 'Sim' : 'Nao'
        ]);
      }
      y = _tabelaProfissional(doc, { head: headAcoes, body: bodyAcoes, startY: y });
    }

    // 2.4 Proximos Passos
    if (re.proximosPassos && re.proximosPassos.length > 0) {
      y = _checkPage(doc, 30);
      y = _tituloSecao(doc, { titulo: 'Proximos Passos Priorizados' });
      var headPassos = ['Prioridade', 'Acao', 'Valor Estimado', 'Descricao'];
      var bodyPassos = re.proximosPassos.map(function(p) {
        var prio = p.prioridade === 'urgente' ? 'URGENTE' :
                   p.prioridade === 'medio_prazo' ? 'MEDIO PRAZO' : 'ESTRATEGICO';
        return [prio, p.acao || '', p.valor ? _fmtR$(p.valor) : '—', p.descricao || ''];
      });
      y = _tabelaProfissional(doc, { head: headPassos, body: bodyPassos, startY: y });
    }

    // 2.5 Retencoes
    if (_safe(re.irrfRetidoAnual) > 0 || _safe(re.csllRetidaAnual) > 0) {
      y = _alertaBox(doc, {
        tipo: 'info',
        titulo: 'Nota sobre retencoes na fonte',
        texto: 'A empresa possui ' + _fmtR$(re.irrfRetidoAnual) + ' de IRRF retido e ' + _fmtR$(re.csllRetidaAnual) +
          ' de CSLL retida na fonte no exercicio, que ja foram deduzidos dos tributos devidos.',
        baseLegal: 'IN RFB 1.234/2012',
        y: y
      });
    }
  }

  // ═══════════════════════════════════════════════════
  // SECAO 3: SIMULACAO RAPIDA
  // ═══════════════════════════════════════════════════

  function _gerarSimulacaoPDF(doc, dados) {
    var sim = (dados.results || {}).simulacao;
    if (!sim) return;

    _novaPagina(doc, 'Simulacao Rapida');
    var y = _tituloSecao(doc, { numero: '2', titulo: 'Simulacao Rapida', subtitulo: 'Estimativa trimestral simplificada' });

    var kpis = [
      { label: 'Receita Bruta Trimestral', valor: _fmtR$(sim.receitaBrutaTrimestral), corBorda: CORES.azulAccent },
      { label: 'Base Presumida IRPJ', valor: _fmtR$(sim.baseIRPJ), corBorda: CORES.azulClaro },
      { label: 'IRPJ (Normal + Adicional)', valor: _fmtR$(_safe(sim.irpj && sim.irpj.total, _safe(sim.irpjTotal))), sublabel: sim.irpj ? '(normal: ' + _fmtR$(sim.irpj.normal) + ' + adic: ' + _fmtR$(sim.irpj.adicional) + ')' : '', corBorda: CORES.vermelho },
      { label: 'CSLL', valor: _fmtR$(sim.csll), corBorda: CORES.amarelo },
      { label: 'PIS + COFINS Trimestral', valor: _fmtR$(_safe(sim.pisTrimestral) + _safe(sim.cofinsTrimestral)), corBorda: CORES.azulAccent },
      { label: 'Total Tributos Federais', valor: _fmtR$(sim.totalTributosFederais), corBorda: CORES.vermelho },
      { label: 'Aliquota Efetiva Total', valor: sim.aliquotaEfetivaTotal || _fmtPct(sim.aliquotaEfetiva), corBorda: CORES.amarelo },
    ];
    y = _kpiGrid(doc, y, kpis, 3);

    // Info atividade
    if (sim.atividade) {
      y = _alertaBox(doc, {
        tipo: 'info',
        titulo: 'Detalhes da Atividade',
        texto: 'Atividade: ' + (sim.atividade.descricao || '') + '\n' +
          'Percentual IRPJ: ' + _fmtPct(_safe(sim.percentualPresuncaoIRPJ, sim.atividade.percentualIRPJ) * 100) + '\n' +
          'Percentual CSLL: ' + _fmtPct(_safe(sim.percentualPresuncaoCSLL, sim.atividade.percentualCSLL) * 100) +
          (_safe(sim.issEstimado) > 0 ? '\nISS estimado: ' + _fmtR$(sim.issEstimado) : ''),
        y: y
      });
    }

    // Referencias legais
    y = _refLegal(doc, { texto: 'Percentuais de presuncao conforme Lei 9.249/95, Art. 15 e RIR/2018, Art. 595', y: y });
    y = _refLegal(doc, { texto: 'PIS/COFINS cumulativo: Lei 9.718/1998 (0,65% + 3%)', y: y });
    y = _refLegal(doc, { texto: 'Adicional IRPJ 10% sobre excedente de R$ 60.000/trimestre: RIR/2018, Art. 624', y: y });
  }

  // ═══════════════════════════════════════════════════
  // SECAO 4: APURACAO TRIMESTRAL IRPJ/CSLL
  // ═══════════════════════════════════════════════════

  function _gerarTrimestralPDF(doc, dados) {
    var trim = (dados.results || {}).trimestral;
    if (!trim || trim.length === 0) return;

    _novaPagina(doc, 'Apuracao Trimestral IRPJ/CSLL');
    var y = _tituloSecao(doc, { numero: '3', titulo: 'Apuracao Trimestral IRPJ/CSLL', subtitulo: 'Detalhamento por trimestre — Exercicio ' + (_safe((dados.formData || {}).anoCalendario, 2026)) });

    // 4.1 Tabela principal
    var itens = [
      'Receita Bruta', '(-) Deducoes da Receita', '(=) Receita Ajustada',
      'Base Presumida IRPJ', 'Base Presumida CSLL', '(+) Adicoes Obrigatorias',
      '(=) Base Calculo IRPJ', '(=) Base Calculo CSLL',
      'IRPJ Normal (15%)', 'IRPJ Adicional (10%)', 'IRPJ Bruto',
      '(-) IRRF Retido', 'IRPJ Devido',
      'CSLL Bruta', '(-) CSLL Retida', 'CSLL Devida',
      'Total IRPJ + CSLL', 'Aliq. Efetiva Federal'
    ];
    var campos = [
      'receitaBrutaTotal', 'deducoesDaReceita', 'receitaBrutaAjustada',
      'basePresumidaIRPJ', 'basePresumidaCSLL', 'adicoesObrigatorias',
      'baseCalculoIRPJ', 'baseCalculoCSLL',
      'irpjNormal', 'irpjAdicional', 'irpjBruto',
      'irrfRetidoFonte', 'irpjDevido',
      'csllBruta', 'csllRetidaFonte', 'csllDevida',
      'totalIRPJCSLL', 'aliquotaEfetivaReceita'
    ];

    var head = ['Item', '1o Tri', '2o Tri', '3o Tri', '4o Tri', 'Total Anual'];
    var body = [];

    for (var i = 0; i < itens.length; i++) {
      var row = [itens[i]];
      var somaAnual = 0;
      var isPct = campos[i] === 'aliquotaEfetivaReceita';

      for (var t = 0; t < 4; t++) {
        var r = (trim[t] && trim[t].resumo) ? trim[t].resumo : {};
        var val = r[campos[i]];
        if (isPct) {
          row.push(val || '—');
        } else {
          row.push(_fmtR$(_safe(val)));
          somaAnual += _safe(val);
        }
      }

      if (isPct) {
        row.push('—');
      } else {
        row.push(_fmtR$(somaAnual));
      }
      body.push(row);
    }

    var totalRowsIdx = [10, 12, 13, 15, 16]; // irpjBruto, irpjDevido, csllBruta, csllDevida, totalIRPJCSLL
    y = _tabelaProfissional(doc, {
      head: head,
      body: body,
      startY: y,
      totalRow: totalRowsIdx,
      fontSize: 7,
      columnStyles: {
        0: { cellWidth: 45, halign: 'left' },
        1: { cellWidth: 24, halign: 'right', font: 'courier' },
        2: { cellWidth: 24, halign: 'right', font: 'courier' },
        3: { cellWidth: 24, halign: 'right', font: 'courier' },
        4: { cellWidth: 24, halign: 'right', font: 'courier' },
        5: { cellWidth: 28, halign: 'right', font: 'courier', fontStyle: 'bold' },
      },
      notaRodape: 'Valores em R$. Aliquota efetiva federal = (IRPJ + CSLL) / Receita Bruta.'
    });

    // 4.2 Parcelamento
    var temParcelamento = false;
    for (var t = 0; t < 4; t++) {
      if (trim[t] && trim[t].parcelamento && trim[t].parcelamento.irpj && trim[t].parcelamento.irpj.length > 1) {
        temParcelamento = true;
        break;
      }
    }

    if (temParcelamento) {
      y = _checkPage(doc, 50);
      y = _tituloSecao(doc, { titulo: 'Parcelamento IRPJ/CSLL' });
      var headParc = ['Trimestre', 'Tributo', 'Quota Unica', '1a Quota', '2a Quota (+SELIC)', '3a Quota (+SELIC)'];
      var bodyParc = [];
      for (var t = 0; t < 4; t++) {
        var parc = trim[t] && trim[t].parcelamento;
        if (!parc) continue;
        ['irpj', 'csll'].forEach(function(tipo) {
          var q = parc[tipo];
          if (!q || q.length <= 1) return;
          bodyParc.push([
            (t + 1) + 'o Tri',
            tipo.toUpperCase(),
            _fmtR$(q[0] ? q[0].valorComJuros || q[0].valor : 0),
            _fmtR$(q[0] ? q[0].valor : 0),
            q[1] ? _fmtR$(q[1].valorComJuros) + ' (juros: ' + _fmtR$(q[1].juros) + ')' : '—',
            q[2] ? _fmtR$(q[2].valorComJuros) + ' (juros: ' + _fmtR$(q[2].juros) + ')' : '—',
          ]);
        });
      }
      if (bodyParc.length > 0) {
        y = _tabelaProfissional(doc, {
          head: headParc, body: bodyParc, startY: y,
          notaRodape: 'Art. 5o, Lei 9.430/96 — quotas nao inferiores a R$ 1.000,00, acrescidas de SELIC.'
        });
      }
    }

    // 4.3 Detalhamento por atividade (receitas mistas)
    var det0 = trim[0] && trim[0].detalhamento;
    if (det0 && det0.irpj && det0.irpj.length > 1) {
      y = _checkPage(doc, 40);
      y = _tituloSecao(doc, { titulo: 'Detalhamento por Atividade' });
      var headDet = ['Atividade', 'Receita', '% IRPJ', 'Base IRPJ', '% CSLL', 'Base CSLL'];
      var bodyDet = [];
      det0.irpj.forEach(function(d) {
        bodyDet.push([
          d.atividade || d.atividadeId || '',
          _fmtR$(d.receitaBruta),
          d.percentualPresuncaoFormatado || _fmtPct(d.percentualPresuncao * 100),
          _fmtR$(d.basePresumida),
          '', ''
        ]);
      });
      if (det0.csll) {
        for (var i = 0; i < det0.csll.length && i < bodyDet.length; i++) {
          bodyDet[i][4] = det0.csll[i].percentualPresuncaoFormatado || _fmtPct(det0.csll[i].percentualPresuncao * 100);
          bodyDet[i][5] = _fmtR$(det0.csll[i].basePresumida);
        }
      }
      y = _tabelaProfissional(doc, { head: headDet, body: bodyDet, startY: y });
    }

    // 4.4 LC 224 condicional
    var temLC224Trim = false;
    for (var t = 0; t < 4; t++) {
      if (trim[t] && trim[t].lc224 && trim[t].lc224.aplicada) { temLC224Trim = true; break; }
    }
    if (temLC224Trim) {
      y = _checkPage(doc, 40);
      y = _tituloSecao(doc, { titulo: 'Impacto LC 224/2025 — Majoracao 10% na Base Presumida' });
      var headLC = ['Trimestre', 'Impacto Base IRPJ', 'Impacto Base CSLL', 'Imposto Extra IRPJ', 'Imposto Extra CSLL'];
      var bodyLC = [];
      for (var t = 0; t < 4; t++) {
        var lc = trim[t] && trim[t].lc224;
        if (!lc || !lc.aplicada) { bodyLC.push(['Q' + (t + 1), '—', '—', '—', '—']); continue; }
        bodyLC.push([
          'Q' + (t + 1),
          _fmtR$(lc.impactoBaseIRPJ), _fmtR$(lc.impactoBaseCSLL),
          _fmtR$(lc.impactoIRPJ), _fmtR$(lc.impactoCSLL)
        ]);
      }
      y = _tabelaProfissional(doc, { head: headLC, body: bodyLC, startY: y });
      y = _alertaBox(doc, {
        tipo: 'amarelo',
        titulo: 'LC 224/2025 — Majoracao',
        texto: 'A LC 224/2025, vigente a partir de 01/04/2026, acresce 10% ao percentual de presuncao para empresas com receita bruta acumulada superior a R$ 5.000.000,00/ano (Art. 14, I, "a"). Excecao: atividades com percentual de 1,6% e 8%.',
        y: y
      });
    }

    // 4.5 Percentual reduzido
    var pr = trim[0] && trim[0].percentualReduzido;
    if (pr && pr.elegivel) {
      y = _alertaBox(doc, {
        tipo: 'verde',
        titulo: 'Percentual Reduzido 16%',
        texto: 'Empresa elegivel ao percentual reduzido de 16% para CSLL (IN RFB 1.700/2017, Art. 215, par. 10). Receita bruta anual estimada de ' + _fmtR$(pr.receitaAnualEstimada) + ', dentro do limite de R$ 120.000,00/ano.',
        y: y
      });
    }

    // 4.6 Codigos DARF
    y = _checkPage(doc, 30);
    y = _tabelaProfissional(doc, {
      head: ['Tributo', 'Codigo DARF', 'Fundamentacao'],
      body: [
        ['IRPJ Lucro Presumido', '2089', 'IN RFB 1.234/2012'],
        ['CSLL Lucro Presumido', '2372', 'IN RFB 1.234/2012'],
      ],
      startY: y,
    });

    // Refs legais
    y = _refLegal(doc, { texto: 'Lei 9.249/95, Art. 15 — Percentuais de presuncao IRPJ | Lei 9.249/95, Art. 20 — Percentuais CSLL | RIR/2018, Arts. 595, 624 | Lei 7.689/1988, Art. 3o — CSLL 9% | IN RFB 1.700/2017, Arts. 215, 238 | Lei 9.430/96, Art. 5o — Parcelamento', y: y });
  }

  // ═══════════════════════════════════════════════════
  // SECAO 5: PIS/COFINS MENSAL
  // ═══════════════════════════════════════════════════

  function _gerarPISCOFINSPDF(doc, dados) {
    var pc = (dados.results || {}).piscofins;
    if (!pc || pc.length === 0) return;

    _novaPagina(doc, 'Apuracao Mensal PIS/COFINS');
    var y = _tituloSecao(doc, { numero: '4', titulo: 'Apuracao Mensal PIS/COFINS', subtitulo: 'Regime cumulativo — Lei 9.718/1998' });

    var head = ['Mes', 'Receita Bruta', 'Base Calculo', 'PIS (0,65%)', 'COFINS (3%)', 'Total PIS+COFINS'];
    var body = [];
    var totais = { receita: 0, base: 0, pis: 0, cofins: 0, total: 0 };

    for (var i = 0; i < Math.min(pc.length, 12); i++) {
      var m = pc[i] || {};
      var recBruta = _safe(m.receitaBrutaMensal, _safe(m.receitaBruta));
      var baseCal = _safe(m.baseCalculo, recBruta);
      var pis = _safe(m.pis && m.pis.devido, _safe(m.pisDevido));
      var cofins = _safe(m.cofins && m.cofins.devida, _safe(m.cofinsDevida));
      var totalPC = _safe(m.totalPISCOFINS, pis + cofins);

      totais.receita += recBruta;
      totais.base += baseCal;
      totais.pis += pis;
      totais.cofins += cofins;
      totais.total += totalPC;

      body.push([
        MESES_NOMES[i],
        _fmtR$(recBruta),
        _fmtR$(baseCal),
        _fmtR$(pis),
        _fmtR$(cofins),
        _fmtR$(totalPC),
      ]);
    }

    // Linha total
    body.push([
      'TOTAL',
      _fmtR$(totais.receita),
      _fmtR$(totais.base),
      _fmtR$(totais.pis),
      _fmtR$(totais.cofins),
      _fmtR$(totais.total),
    ]);

    y = _tabelaProfissional(doc, {
      head: head, body: body, startY: y,
      totalRow: [body.length - 1],
      fontSize: 7,
      columnStyles: {
        0: { cellWidth: 28, halign: 'left' },
        1: { cellWidth: 28, halign: 'right', font: 'courier' },
        2: { cellWidth: 28, halign: 'right', font: 'courier' },
        3: { cellWidth: 24, halign: 'right', font: 'courier' },
        4: { cellWidth: 24, halign: 'right', font: 'courier' },
        5: { cellWidth: 28, halign: 'right', font: 'courier' },
      },
    });

    // Codigos DARF
    y = _tabelaProfissional(doc, {
      head: ['Tributo', 'Codigo DARF', 'Vencimento'],
      body: [
        ['PIS Cumulativo', '8109', '25o dia do mes subsequente'],
        ['COFINS Cumulativo', '2172', '25o dia do mes subsequente'],
      ],
      startY: y,
    });

    y = _refLegal(doc, { texto: 'Lei 9.718/1998 — PIS 0,65% e COFINS 3% cumulativos | Lei 10.833/2003, Art. 30 — CSRF | IN RFB 1.234/2012 — Retencoes | IN RFB 2.055/2021 — PER/DCOMP', y: y });
  }

  // ═══════════════════════════════════════════════════
  // SECAO 6: CONSOLIDACAO ANUAL
  // ═══════════════════════════════════════════════════

  function _gerarAnualPDF(doc, dados) {
    var anual = (dados.results || {}).anual;
    if (!anual) return;
    var fd = dados.formData || {};

    _novaPagina(doc, 'Consolidacao Anual');
    var y = _tituloSecao(doc, { numero: '5', titulo: 'Consolidacao Anual', subtitulo: 'Todos os tributos — Exercicio ' + _safe(fd.anoCalendario, 2026) });

    var trib = anual.tributos || {};
    var cons = anual.consolidacao || {};
    var dist = anual.distribuicaoLucros || {};

    // KPIs
    var kpis = [
      { label: 'Receita Bruta Anual', valor: _fmtR$(anual.receitaBrutaAnual), corBorda: CORES.azulAccent },
      { label: 'IRPJ Anual', valor: _fmtR$(_safe(trib.irpj && trib.irpj.anual)), corBorda: CORES.vermelho },
      { label: 'CSLL Anual', valor: _fmtR$(_safe(trib.csll && trib.csll.anual)), corBorda: CORES.vermelho },
      { label: 'PIS Anual', valor: _fmtR$(_safe(trib.pis && trib.pis.anual)), corBorda: CORES.amarelo },
      { label: 'COFINS Anual', valor: _fmtR$(_safe(trib.cofins && trib.cofins.anual)), corBorda: CORES.amarelo },
      { label: 'ISS Anual', valor: _fmtR$(_safe(trib.iss && trib.iss.anual)), corBorda: CORES.amarelo },
      { label: 'INSS Patronal Anual', valor: _fmtR$(_safe(trib.inssPatronal && trib.inssPatronal.anual)), corBorda: CORES.amarelo },
      { label: 'Carga Tributaria Total', valor: _fmtR$(_safe(cons.cargaTributariaTotal)), corBorda: CORES.vermelho },
      { label: '% sobre Receita', valor: cons.percentualCargaTributaria || '—', corBorda: CORES.vermelho },
      { label: 'Lucro Distribuivel Isento', valor: _fmtR$(_safe(dist.lucroDistribuivelFinal)), corBorda: CORES.verde },
    ];
    y = _kpiGrid(doc, y, kpis, 3);

    // Grafico pizza composicao
    if (typeof Chart !== 'undefined') {
      y = _checkPage(doc, 90);
      y = _tituloSecao(doc, { titulo: 'Composicao Tributaria' });
      y = _inserirGrafico(doc, {
        config: {
          type: 'doughnut',
          data: {
            labels: ['IRPJ', 'CSLL', 'PIS', 'COFINS', 'ISS', 'INSS Patronal'],
            datasets: [{
              data: [
                _safe(trib.irpj && trib.irpj.anual),
                _safe(trib.csll && trib.csll.anual),
                _safe(trib.pis && trib.pis.anual),
                _safe(trib.cofins && trib.cofins.anual),
                _safe(trib.iss && trib.iss.anual),
                _safe(trib.inssPatronal && trib.inssPatronal.anual),
              ],
              backgroundColor: [
                CHART_COLORS.irpj, CHART_COLORS.csll, CHART_COLORS.pis,
                CHART_COLORS.cofins, CHART_COLORS.iss, CHART_COLORS.inss
              ],
            }]
          },
          options: {
            plugins: {
              legend: { position: 'right', labels: { font: { size: 11 } } },
              title: { display: true, text: 'Composicao da Carga Tributaria Anual', font: { size: 13 } },
            }
          }
        },
        w: 140, h: 80, y: y
      });
    }

    // Grafico barras empilhadas trimestral
    var trim = (dados.results || {}).trimestral;
    var piscofins = (dados.results || {}).piscofins;
    if (typeof Chart !== 'undefined' && trim && trim.length === 4) {
      y = _checkPage(doc, 95);
      y = _tituloSecao(doc, { titulo: 'Evolucao Trimestral' });

      var irpjData = [], csllData = [], pcData = [];
      for (var t = 0; t < 4; t++) {
        var r = (trim[t] && trim[t].resumo) || {};
        irpjData.push(_safe(r.irpjDevido));
        csllData.push(_safe(r.csllDevida));
        var pcTrim = 0;
        var mesInicio = t * 3;
        for (var m = mesInicio; m < mesInicio + 3 && piscofins && m < piscofins.length; m++) {
          pcTrim += _safe(piscofins[m] && piscofins[m].totalPISCOFINS, _safe((piscofins[m] && piscofins[m].pis && piscofins[m].pis.devido || 0) + (piscofins[m] && piscofins[m].cofins && piscofins[m].cofins.devida || 0)));
        }
        pcData.push(pcTrim);
      }

      y = _inserirGrafico(doc, {
        config: {
          type: 'bar',
          data: {
            labels: ['1o Trim', '2o Trim', '3o Trim', '4o Trim'],
            datasets: [
              { label: 'IRPJ', data: irpjData, backgroundColor: CHART_COLORS.irpj },
              { label: 'CSLL', data: csllData, backgroundColor: CHART_COLORS.csll },
              { label: 'PIS+COFINS', data: pcData, backgroundColor: CHART_COLORS.pis },
            ]
          },
          options: {
            plugins: { title: { display: true, text: 'Evolucao Trimestral dos Tributos Federais', font: { size: 13 } } },
            scales: { x: { stacked: true }, y: { stacked: true, ticks: { callback: function(v) { return 'R$ ' + (v/1000).toFixed(0) + 'k'; } } } },
          }
        },
        w: 170, h: 80, y: y
      });
    }

    // Tabela resumo anual
    y = _checkPage(doc, 60);
    y = _tituloSecao(doc, { titulo: 'Resumo Anual por Tributo' });
    var recAnual = _safe(anual.receitaBrutaAnual, 1);
    var bodyResumo = [
      ['IRPJ (15% + adicional 10%)', _fmtR$(_safe(trib.irpj && trib.irpj.anual)), _fmtPct(_safe(trib.irpj && trib.irpj.anual) / recAnual * 100), 'Lei 9.249/95, Art. 15; RIR/2018, Art. 624'],
      ['CSLL (9%)', _fmtR$(_safe(trib.csll && trib.csll.anual)), _fmtPct(_safe(trib.csll && trib.csll.anual) / recAnual * 100), 'Lei 7.689/1988, Art. 3o'],
      ['PIS Cumulativo (0,65%)', _fmtR$(_safe(trib.pis && trib.pis.anual)), _fmtPct(_safe(trib.pis && trib.pis.anual) / recAnual * 100), 'Lei 9.718/1998, Art. 2o'],
      ['COFINS Cumulativo (3%)', _fmtR$(_safe(trib.cofins && trib.cofins.anual)), _fmtPct(_safe(trib.cofins && trib.cofins.anual) / recAnual * 100), 'Lei 9.718/1998, Art. 2o'],
      ['ISS', _fmtR$(_safe(trib.iss && trib.iss.anual)), _fmtPct(_safe(trib.iss && trib.iss.anual) / recAnual * 100), 'LC 116/2003'],
      ['INSS Patronal', _fmtR$(_safe(trib.inssPatronal && trib.inssPatronal.anual)), _fmtPct(_safe(trib.inssPatronal && trib.inssPatronal.anual) / recAnual * 100), 'Lei 8.212/91, Art. 22'],
      ['TOTAL', _fmtR$(_safe(cons.cargaTributariaTotal)), cons.percentualCargaTributaria || '—', '—'],
    ];

    y = _tabelaProfissional(doc, {
      head: ['Tributo', 'Valor Anual', '% da Receita', 'Base Legal'],
      body: bodyResumo, startY: y,
      totalRow: [bodyResumo.length - 1],
    });

    // INSS Patronal detalhado
    if (trib.inssPatronal) {
      var ip = trib.inssPatronal;
      y = _checkPage(doc, 40);
      y = _tituloSecao(doc, { titulo: 'INSS Patronal Detalhado' });
      y = _tabelaProfissional(doc, {
        head: ['Componente', 'Base', 'Aliquota', 'Valor', 'Referencia'],
        body: [
          ['INSS s/ Folha CLT', _fmtR$(_safe(ip.folhaCLT)), ip.aliquotaCLT || '20%+RAT+Terc', _fmtR$(_safe(ip.sobreFolhaCLT)), 'Lei 8.212/91, Art. 22, I'],
          ['INSS s/ Pro-Labore', _fmtR$(_safe(ip.proLaboreTotal)), ip.aliquotaProLabore || '20%', _fmtR$(_safe(ip.sobreProLabore)), 'Lei 8.212/91, Art. 22, III'],
          ['Total', '—', '—', _fmtR$(_safe(ip.anual)), '—'],
        ],
        startY: y,
        totalRow: [2],
        notaRodape: 'RAT e Terceiros incidem apenas sobre a folha de empregados CLT, nao sobre pro-labore de socios (Lei 8.212/91, Art. 22).'
      });
    }

    // Beneficios aplicados
    var benef = anual.beneficiosAplicados;
    if (benef && benef.economiaTotal > 0) {
      y = _checkPage(doc, 40);
      y = _tituloSecao(doc, { titulo: 'Beneficios Aplicados' });
      var bodyBenef = [];
      var benefItems = [
        { key: 'issApenasServicos', nome: 'ISS apenas servicos', campo: 'economiaISS' },
        { key: 'inssSeparado', nome: 'INSS separado CLT/Pro-labore', campo: 'economiaRAT' },
        { key: 'zonFrancaVendas', nome: 'Zona Franca de Manaus', campo: 'economiaPISCOFINS' },
        { key: 'suframaSediada', nome: 'SUFRAMA sediada', campo: 'economiaPISCOFINS' },
        { key: 'exportacao', nome: 'Exportacoes (PIS/COFINS)', campo: 'economiaPISCOFINS' },
        { key: 'percentualReduzido16', nome: 'Percentual reduzido 16%', campo: null },
      ];
      benefItems.forEach(function(b) {
        var item = benef[b.key];
        if (item && item.ativo) {
          bodyBenef.push([b.nome, b.campo ? _fmtR$(_safe(item[b.campo])) : 'Aplicado', 'Aplicado']);
        }
      });
      if (bodyBenef.length > 0) {
        y = _tabelaProfissional(doc, {
          head: ['Beneficio', 'Economia', 'Status'],
          body: bodyBenef, startY: y
        });
      }
    }
  }

  // ═══════════════════════════════════════════════════
  // SECAO 7: DISTRIBUICAO DE LUCROS
  // ═══════════════════════════════════════════════════

  function _gerarDistribuicaoPDF(doc, dados) {
    var anual = (dados.results || {}).anual;
    if (!anual || !anual.distribuicaoLucros) return;
    var dist = anual.distribuicaoLucros;

    _novaPagina(doc, 'Distribuicao de Lucros');
    var y = _tituloSecao(doc, { numero: '6', titulo: 'Distribuicao de Lucros', subtitulo: 'Isentos de IR para socios' });

    // Fluxograma textual
    var fluxo = [
      ['Receita Bruta Anual', _fmtR$(anual.receitaBrutaAnual)],
      ['(-) Base Presumida IRPJ+CSLL', _fmtR$(_safe(dist.basePresumidaAnual))],
      ['(-) Tributos Federais Apurados (IRPJ+CSLL+PIS+COFINS)', _fmtR$(_safe(dist.tributosDescontados))],
      ['(=) Lucro Distribuivel Presumido', _fmtR$(_safe(dist.lucroDistribuivelPresumido))],
    ];

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(LAYOUT.marginLeft, y, LAYOUT.contentWidth, fluxo.length * 10 + 8, 2, 2, 'F');
    var fy = y + 8;
    fluxo.forEach(function(line) {
      doc.setFont('courier', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(30, 30, 30);
      var dots = '';
      var baseW = doc.getTextWidth(line[0]);
      var valW = doc.getTextWidth(line[1]);
      var dotsNeeded = LAYOUT.contentWidth - 20 - baseW - valW;
      while (doc.getTextWidth(dots) < dotsNeeded) dots += '.';
      doc.text(line[0] + ' ' + dots + ' ' + line[1], LAYOUT.marginLeft + 8, fy);
      fy += 10;
    });
    y = fy + 5;

    // Alerta importante
    y = _alertaBox(doc, {
      tipo: 'verde',
      titulo: 'Base de calculo da distribuicao isenta',
      texto: 'O lucro distribuivel isento e calculado com base nos tributos brutos (IRPJ bruto + CSLL bruta), NAO nos tributos devidos (apos retencoes). Fundamentacao: IN RFB 1.700/2017, Art. 238 c/c RIR/2018, Art. 725.',
      y: y
    });

    // Tabela por socio
    if (dist.porSocio && dist.porSocio.length > 0) {
      var headSocio = ['Socio', 'Participacao', 'Lucro Isento', 'Base Legal'];
      var bodySocio = dist.porSocio.map(function(s) {
        return [s.nome || '', s.percentualFormatado || _fmtPct(s.percentual * 100), _fmtR$(_safe(s.valorIsento)), 'IN RFB 1.700/2017, Art. 238'];
      });
      bodySocio.push(['TOTAL', '100%', _fmtR$(_safe(dist.lucroDistribuivelFinal)), '—']);
      y = _tabelaProfissional(doc, {
        head: headSocio, body: bodySocio, startY: y,
        totalRow: [bodySocio.length - 1],
      });
    }

    // Alertas
    if (dist.alertaDistribuicao) {
      y = _alertaBox(doc, { tipo: 'amarelo', titulo: 'Alerta', texto: dist.alertaDistribuicao, y: y });
    }
    if (dist.alertaFolhaSocios) {
      y = _alertaBox(doc, { tipo: 'vermelho', titulo: 'Alerta Folha de Socios', texto: dist.alertaFolhaSocios, y: y });
    }
    if (dist.notaLC224Distribuicao) {
      y = _notaExplicativa(doc, { texto: dist.notaLC224Distribuicao, y: y });
    }

    y = _refLegal(doc, { texto: 'IN RFB 1.700/2017, Art. 238 — Limite de distribuicao isenta | RIR/2018, Art. 725 — Lucros distribuidos com isencao | IN RFB 1.774/2017 — ECD e distribuicao ampliada', y: y });
  }

  // ═══════════════════════════════════════════════════
  // SECAO 8: BREAK-EVEN LP vs LR
  // ═══════════════════════════════════════════════════

  function _gerarBreakEvenPDF(doc, dados) {
    var be = (dados.results || {}).breakeven;
    if (!be) return;

    _novaPagina(doc, 'Analise Break-Even LP vs LR');
    var y = _tituloSecao(doc, { numero: '7', titulo: 'Analise Break-Even LP vs LR', subtitulo: 'Comparativo de carga tributaria federal' });

    // KPIs
    var beLabel = be.breakEvenMargem ? be.breakEvenMargem + '%' : (be.lpSempreVantajoso ? 'LP sempre vantajoso' : 'LR sempre vantajoso');
    var beCor = be.lpSempreVantajoso ? CORES.verde : (be.lrSempreVantajoso ? CORES.vermelho : CORES.amarelo);
    var kpis = [
      { label: 'Carga LP (Federal)', valor: _fmtR$(_safe(be.cargaFederalLP, be.cargaTributariaLP)), corBorda: CORES.azulAccent },
      { label: 'Break-Even', valor: beLabel, corBorda: beCor },
      { label: 'Margem Operacional Bruta', valor: be.margemOperacionalBruta != null ? _fmtPct(be.margemOperacionalBruta) : '—', corBorda: CORES.azulAccent },
      { label: 'Margem Liquida Pos-Tributos', valor: be.margemLiquidaPosTributos != null ? _fmtPct(be.margemLiquidaPosTributos) : '—', corBorda: CORES.cinzaMedio },
    ];
    y = _kpiGrid(doc, y, kpis, 2);

    // Grafico break-even (OBRIGATORIO)
    if (typeof Chart !== 'undefined' && be.margens && be.margens.length > 0) {
      y = _checkPage(doc, 100);
      y = _tituloSecao(doc, { titulo: 'Curva Break-Even: Carga LP vs LR' });

      var labels = be.margens.map(function(m) { return m.margem + '%'; });
      var lpData = be.margens.map(function(m) { return m.cargaLP; });
      var lrData = be.margens.map(function(m) { return m.cargaLR; });

      var annotation = {};
      if (be.breakEvenMargem) {
        annotation = {
          annotations: {
            breakeven: {
              type: 'line',
              xMin: be.breakEvenMargem - 1,
              xMax: be.breakEvenMargem - 1,
              borderColor: 'rgba(245, 158, 11, 0.8)',
              borderWidth: 2,
              borderDash: [5, 5],
              label: { display: true, content: 'Break-Even: ' + be.breakEvenMargem + '%', position: 'start' }
            }
          }
        };
      }

      y = _inserirGrafico(doc, {
        config: {
          type: 'line',
          data: {
            labels: labels,
            datasets: [
              { label: 'Carga LP (Federal)', data: lpData, borderColor: CHART_COLORS.lp, borderWidth: 2, pointRadius: 0, fill: false },
              { label: 'Carga LR (Federal)', data: lrData, borderColor: CHART_COLORS.lr, borderWidth: 2, pointRadius: 0, fill: false },
            ]
          },
          options: {
            plugins: {
              title: { display: true, text: 'Ponto de Equilibrio: Lucro Presumido vs Lucro Real', font: { size: 13 } },
              annotation: annotation.annotations ? annotation : undefined,
            },
            scales: {
              x: { title: { display: true, text: 'Margem de Lucro (%)' }, ticks: { maxTicksLimit: 20 } },
              y: { title: { display: true, text: 'Carga Tributaria (R$)' }, ticks: { callback: function(v) { return 'R$ ' + (v/1000).toFixed(0) + 'k'; } } },
            }
          }
        },
        w: 170, h: 90, y: y
      });
    }

    // Texto interpretativo
    y = _checkPage(doc, 30);
    if (be.lpSempreVantajoso) {
      y = _alertaBox(doc, {
        tipo: 'verde', titulo: 'Analise',
        texto: 'Para o perfil tributario desta empresa, o Lucro Presumido e mais vantajoso em TODAS as faixas de margem analisadas (1% a 99%). A presuncao ja e inferior a qualquer cenario realista de margem.',
        y: y
      });
    } else if (be.lrSempreVantajoso) {
      y = _alertaBox(doc, {
        tipo: 'vermelho', titulo: 'Analise',
        texto: 'O Lucro Real e mais vantajoso em todas as margens. A empresa deve considerar fortemente a migracao.',
        y: y
      });
    } else if (be.breakEvenMargem) {
      var regFav = be.margemOperacionalBruta && be.margemOperacionalBruta > be.breakEvenMargem ? 'Lucro Presumido' : 'Lucro Real';
      y = _alertaBox(doc, {
        tipo: 'info', titulo: 'Analise do Break-Even',
        texto: 'O ponto de equilibrio entre LP e LR ocorre na margem de ' + be.breakEvenMargem + '%. Abaixo desta margem, o Lucro Real e mais vantajoso; acima, o Lucro Presumido. A margem operacional estimada da empresa e de ' + _fmtPct(be.margemOperacionalBruta) + ', portanto o regime ' + regFav + ' e mais adequado.',
        y: y
      });
    }

    // Premissas
    if (be.premissas) {
      y = _checkPage(doc, 40);
      y = _tituloSecao(doc, { titulo: 'Premissas do Calculo' });
      y = _tabelaProfissional(doc, {
        head: ['Premissa', 'Valor', 'Observacao'],
        body: [
          ['PIS/COFINS LP (cumulativo)', '3,65%', 'Lei 9.718/1998'],
          ['PIS/COFINS LR (nao-cumulativo)', '9,25%', 'Lei 10.637/2002 + Lei 10.833/2003'],
          ['Creditos PIS/COFINS LR', be.premissas.creditosPISCOFINS || '—', 'Estimativa de creditos sobre despesas'],
          ['ISS', 'Desconsiderado', 'Igual nos dois regimes'],
          ['INSS', 'Desconsiderado', 'Igual nos dois regimes'],
        ],
        startY: y,
      });
    }

    // Recomendacao
    if (be.recomendacao) {
      y = _checkPage(doc, 20);
      y = _textoCorpo(doc, be.recomendacao, y, { fontSize: 9 });
    }

    y = _refLegal(doc, { texto: 'Lei 9.249/95, Art. 15 — Presuncao IRPJ | Lei 9.430/96 — LR trimestral | Lei 10.637/2002 — PIS NC | Lei 10.833/2003 — COFINS NC | RIR/2018, Art. 257 — Opcao pelo LP', y: y });
  }

  // ═══════════════════════════════════════════════════
  // SECAO 9: PRO-LABORE
  // ═══════════════════════════════════════════════════

  function _gerarProLaborePDF(doc, dados) {
    var pl = (dados.results || {}).proLabore;
    if (!pl || pl.length === 0) return;

    for (var s = 0; s < pl.length; s++) {
      var socio = pl[s];
      if (!socio) continue;

      _novaPagina(doc, 'Otimizacao Pro-Labore' + (pl.length > 1 ? ' — Socio ' + (s + 1) : ''));
      var y = _tituloSecao(doc, {
        numero: s === 0 ? '8' : '',
        titulo: 'Otimizacao de Pro-Labore' + (socio.nome ? ' — ' + socio.nome : ''),
        subtitulo: 'Analise de custo-beneficio da remuneracao do socio'
      });

      // KPIs
      var rec = socio.recomendado || socio.otimo || {};
      var kpis = [
        { label: 'Pro-Labore Otimo', valor: _fmtR$(_safe(rec.proLaboreMensal)), corBorda: CORES.verde },
        { label: 'Economia Anual', valor: _fmtR$(_safe(socio.economiaAnual)), corBorda: CORES.verde },
        { label: 'Pro-Labore Atual', valor: _fmtR$(_safe(socio.atual && socio.atual.proLaboreMensal)), corBorda: CORES.azulAccent },
        { label: 'Minimo Anti-Autuacao', valor: _fmtR$(_safe(socio.minimoAntiAutuacao)), corBorda: CORES.amarelo },
      ];
      y = _kpiGrid(doc, y, kpis, 2);

      // Cenarios-chave
      if (socio.cenariosChave || socio.cenarios) {
        var cenarios = socio.cenariosChave || socio.cenarios || [];
        if (cenarios.length > 0) {
          var headCen = ['Cenario', 'Pro-Labore', 'INSS Patronal', 'INSS Retido', 'IRPF', 'Liquido', 'Custo Empresa'];
          var bodyCen = [];
          var maxCen = Math.min(cenarios.length, 10);
          for (var c = 0; c < maxCen; c++) {
            var cen = cenarios[c];
            bodyCen.push([
              cen.cenario || cen.label || '',
              _fmtR$(_safe(cen.proLaboreMensal)),
              _fmtR$(_safe(cen.inssPatronal)),
              _fmtR$(_safe(cen.inssRetido)),
              _fmtR$(_safe(cen.irpf)),
              _fmtR$(_safe(cen.liquidoSocio || cen.liquido)),
              _fmtR$(_safe(cen.custoEmpresa || cen.custoEmpresaMensal)),
            ]);
          }
          y = _tabelaProfissional(doc, { head: headCen, body: bodyCen, startY: y, fontSize: 7 });
        }
      }

      // Grafico
      if (typeof Chart !== 'undefined' && (socio.cenarios || socio.cenariosChave)) {
        var cens = socio.cenarios || socio.cenariosChave || [];
        if (cens.length > 5) {
          y = _checkPage(doc, 90);
          var labels = cens.map(function(c) { return _fmtR$(c.proLaboreMensal); });
          var custoData = cens.map(function(c) { return _safe(c.custoEmpresaAnual, _safe(c.custoEmpresa) * 12); });
          var liqData = cens.map(function(c) { return _safe(c.liquidoSocioAnual, _safe(c.liquidoSocio || c.liquido) * 12); });

          y = _inserirGrafico(doc, {
            config: {
              type: 'line',
              data: {
                labels: labels,
                datasets: [
                  { label: 'Custo Empresa (Anual)', data: custoData, borderColor: CHART_COLORS.irpj, fill: false, pointRadius: 1 },
                  { label: 'Liquido Socio (Anual)', data: liqData, borderColor: CHART_COLORS.lp, fill: false, pointRadius: 1 },
                ]
              },
              options: {
                plugins: { title: { display: true, text: 'Custo Empresa vs Liquido Socio', font: { size: 13 } } },
                scales: {
                  x: { title: { display: true, text: 'Pro-Labore Mensal' }, ticks: { maxTicksLimit: 10 } },
                  y: { ticks: { callback: function(v) { return 'R$ ' + (v/1000).toFixed(0) + 'k'; } } },
                }
              }
            },
            w: 170, h: 80, y: y
          });
        }
      }

      // Risco autuacao
      y = _alertaBox(doc, {
        tipo: 'amarelo',
        titulo: 'Risco de Autuacao',
        texto: 'O valor minimo de pro-labore para reduzir risco de autuacao e de ' + _fmtR$(_safe(socio.minimoAntiAutuacao)) + '/mes (referencia: IN RFB 971/2009). Pro-labore abaixo do salario minimo ou incompativel com a funcao exercida pode ser questionado pela RFB.',
        y: y
      });

      // Recomendacao
      if (socio.recomendacao) {
        y = _textoCorpo(doc, socio.recomendacao, y, { fontSize: 9 });
      }
    }

    var y2 = _getY(doc);
    _refLegal(doc, { texto: 'Lei 8.212/91, Arts. 21, 22 — INSS | EC 103/2019 — INSS progressivo | IN RFB 971/2009 — Obrigatoriedade pro-labore | Lei 15.270/2025 — IRPF 2026', y: y2 });
  }

  // ═══════════════════════════════════════════════════
  // SECAO 10: JCP
  // ═══════════════════════════════════════════════════

  function _gerarJCPPDF(doc, dados) {
    var jcp = (dados.results || {}).jcp;
    if (!jcp) return;

    _novaPagina(doc, 'Simulacao JCP');
    var y = _tituloSecao(doc, { numero: '9', titulo: 'Simulacao JCP (Juros sobre Capital Proprio)', subtitulo: 'Remuneracao sobre o patrimonio liquido' });

    var kpis = [
      { label: 'JCP Bruto Maximo', valor: _fmtR$(_safe(jcp.jcpBruto)), corBorda: CORES.azulAccent },
      { label: 'IRRF Retido', valor: _fmtR$(_safe(jcp.irrfRetido)), sublabel: 'Aliquota: ' + (jcp.aliquotaIRRFPercentual || '15%'), corBorda: CORES.vermelho },
      { label: 'JCP Liquido', valor: _fmtR$(_safe(jcp.jcpLiquido)), corBorda: CORES.verde },
      { label: 'Limite Deducao (50% Lucro)', valor: _fmtR$(_safe(jcp.limiteDeducao)), corBorda: CORES.amarelo },
    ];
    y = _kpiGrid(doc, y, kpis, 2);

    // Comparativo 3 vias
    if (jcp.comparativo) {
      var comp = jcp.comparativo;
      y = _tituloSecao(doc, { titulo: 'Comparativo de Vias de Remuneracao' });
      y = _tabelaProfissional(doc, {
        head: ['Via de Remuneracao', 'Valor Bruto', 'Custo Total', 'Liquido Socio', 'Aliquota Efetiva'],
        body: [
          ['Distribuicao Isenta', _fmtR$(_safe(comp.viaDistribuicaoIsenta && comp.viaDistribuicaoIsenta.valorBruto)), 'R$ 0,00', _fmtR$(_safe(comp.viaDistribuicaoIsenta && comp.viaDistribuicaoIsenta.liquido)), '0%'],
          ['JCP', _fmtR$(_safe(comp.viaJCP && comp.viaJCP.valorBruto)), _fmtR$(_safe(comp.viaJCP && comp.viaJCP.custo)), _fmtR$(_safe(comp.viaJCP && comp.viaJCP.liquido)), comp.viaJCP && comp.viaJCP.aliquotaEfetiva ? _fmtPct(comp.viaJCP.aliquotaEfetiva) : '—'],
          ['Pro-Labore', _fmtR$(_safe(comp.viaProlabore && comp.viaProlabore.valorBruto)), _fmtR$(_safe(comp.viaProlabore && comp.viaProlabore.custoTotal)), _fmtR$(_safe(comp.viaProlabore && comp.viaProlabore.liquido)), comp.viaProlabore && comp.viaProlabore.aliquotaEfetiva ? _fmtPct(comp.viaProlabore.aliquotaEfetiva) : '—'],
        ],
        startY: y,
      });
    }

    // Analise JCP no LP
    y = _alertaBox(doc, {
      tipo: 'info', titulo: 'JCP no Lucro Presumido',
      texto: 'O JCP permite deduzir o valor pago da base de calculo do IRPJ/CSLL no Lucro Real. No Lucro Presumido, a deducao NAO se aplica, mas o JCP ainda pode ser vantajoso como alternativa ao pro-labore para remuneracao acima do lucro distribuivel isento.' +
        (_safe(jcp.aliquotaIRRF) === 0.175 ? '\n\nA partir de 01/04/2026, a aliquota IRRF sobre JCP passa de 15% para 17,5% (LC 224/2025, Art. 8).' : ''),
      y: y
    });

    if (jcp.recomendacao) {
      y = _textoCorpo(doc, jcp.recomendacao, y, { fontSize: 9 });
    }

    y = _refLegal(doc, { texto: 'Lei 9.249/95, Art. 9o — JCP | IN RFB 1.700/2017 — Calculo JCP | LC 224/2025, Art. 8 — IRRF 17,5% | Lei 9.430/96 — Deducao JCP', y: y });
  }

  // ═══════════════════════════════════════════════════
  // SECAO 11: ECD
  // ═══════════════════════════════════════════════════

  function _gerarECDPDF(doc, dados) {
    var ecd = (dados.results || {}).ecd;
    if (!ecd) return;

    _novaPagina(doc, 'Beneficio ECD');
    var y = _tituloSecao(doc, { numero: '10', titulo: 'Beneficio ECD (Escrituracao Completa)', subtitulo: 'Comparativo: presuncao vs escrituracao contabil' });

    var kpis = [
      { label: 'Limite Presumido', valor: _fmtR$(_safe(ecd.limitePresumido)), corBorda: CORES.azulAccent },
      { label: 'Limite Contabil (ECD)', valor: _fmtR$(_safe(ecd.limiteContabil)), corBorda: CORES.verde },
      { label: 'Dist. Isenta Adicional (liq.)', valor: _fmtR$(_safe(ecd.beneficioLiquido)), corBorda: CORES.verde },
      { label: 'Custo ECD Anual', valor: _fmtR$(_safe(ecd.custoECD)), corBorda: CORES.cinzaMedio },
    ];
    y = _kpiGrid(doc, y, kpis, 2);

    // Fluxo de calculo
    var fluxoTexto = 'Lucro Contabil Real: ' + _fmtR$(_safe(ecd.lucroContabilReal)) + '\n' +
      '(-) Tributos Federais: ' + _fmtR$(_safe(ecd.tributosFederaisAnuais)) + '\n' +
      '(=) Limite Contabil (ECD): ' + _fmtR$(_safe(ecd.limiteContabil)) + '\n\n' +
      'Base Presumida Anual: ' + _fmtR$(_safe(ecd.basePresumidaAnual)) + '\n' +
      '(-) Tributos Federais: ' + _fmtR$(_safe(ecd.tributosFederaisAnuais)) + '\n' +
      '(=) Limite Presumido: ' + _fmtR$(_safe(ecd.limitePresumido)) + '\n\n' +
      'Distribuicao Extra = MAX(0, Contabil - Presumido) = ' + _fmtR$(_safe(ecd.distribuicaoExtra)) + '\n' +
      '(-) Custo ECD: ' + _fmtR$(_safe(ecd.custoECD)) + '\n' +
      '(=) Beneficio Liquido: ' + _fmtR$(_safe(ecd.beneficioLiquido));
    y = _textoCorpo(doc, fluxoTexto, y, { fontSize: 9 });

    // Veredicto
    if (ecd.valeAPena) {
      y = _alertaBox(doc, {
        tipo: 'verde', titulo: 'ECD vale a pena',
        texto: 'A escrituracao completa (ECD) vale a pena. O beneficio liquido de ' + _fmtR$(_safe(ecd.beneficioLiquido)) + ' supera o custo de ' + _fmtR$(_safe(ecd.custoECD)) + '.',
        y: y
      });
    } else {
      y = _alertaBox(doc, {
        tipo: 'amarelo', titulo: 'ECD pode nao compensar',
        texto: ecd.motivo || 'O custo da escrituracao completa supera o beneficio adicional de distribuicao.',
        y: y
      });
    }

    if (ecd.alertaLucroInferior) {
      y = _alertaBox(doc, {
        tipo: 'vermelho', titulo: 'Lucro contabil inferior',
        texto: 'O lucro contabil informado e INFERIOR ao lucro presumido. Neste cenario, a ECD NAO amplia a distribuicao isenta.',
        y: y
      });
    }

    y = _refLegal(doc, { texto: 'IN RFB 1.700/2017, Art. 238 — Distribuicao isenta com escrituracao | IN RFB 1.774/2017 — Obrigatoriedade ECD | RIR/2018, Art. 725 — Lucros distribuidos', y: y });
  }

  // ═══════════════════════════════════════════════════
  // SECAO 12: REGIME DE CAIXA vs COMPETENCIA
  // ═══════════════════════════════════════════════════

  function _gerarRegimeCaixaPDF(doc, dados) {
    var rc = (dados.results || {}).regimeCaixa;
    if (!rc) return;

    _novaPagina(doc, 'Regime de Caixa vs Competencia');
    var y = _tituloSecao(doc, { numero: '11', titulo: 'Regime de Caixa vs Competencia', subtitulo: 'Comparativo de fluxo tributario' });

    var kpis = [
      { label: 'Total Faturado', valor: _fmtR$(_safe(rc.totalFaturado)), corBorda: CORES.azulAccent },
      { label: 'Total Recebido', valor: _fmtR$(_safe(rc.totalRecebido)), corBorda: CORES.verde },
      { label: 'Total Diferido (Beneficio)', valor: _fmtR$(_safe(rc.totalDiferido)), corBorda: CORES.verde },
    ];
    y = _kpiGrid(doc, y, kpis, 3);

    // Tabela mensal
    if (rc.comparativoMensal || rc.meses) {
      var meses = rc.comparativoMensal || rc.meses || [];
      var headRC = ['Mes', 'Faturado', 'Recebido', 'Tributo (Comp.)', 'Tributo (Caixa)', 'Diferido'];
      var bodyRC = [];
      var totRC = { fat: 0, rec: 0, comp: 0, caixa: 0, dif: 0 };
      for (var i = 0; i < Math.min(meses.length, 12); i++) {
        var m = meses[i] || {};
        var fat = _safe(m.faturado, _safe(m.faturamento));
        var rec = _safe(m.recebido, _safe(m.recebimento));
        var tribComp = _safe(m.tributoCompetencia, _safe(m.totalCompetencia));
        var tribCaixa = _safe(m.tributoCaixa, _safe(m.totalCaixa));
        var dif = _safe(m.diferido, tribComp - tribCaixa);
        totRC.fat += fat; totRC.rec += rec; totRC.comp += tribComp; totRC.caixa += tribCaixa; totRC.dif += dif;
        bodyRC.push([MESES_NOMES[i], _fmtR$(fat), _fmtR$(rec), _fmtR$(tribComp), _fmtR$(tribCaixa), _fmtR$(dif)]);
      }
      bodyRC.push(['TOTAL', _fmtR$(totRC.fat), _fmtR$(totRC.rec), _fmtR$(totRC.comp), _fmtR$(totRC.caixa), _fmtR$(totRC.dif)]);
      y = _tabelaProfissional(doc, { head: headRC, body: bodyRC, startY: y, totalRow: [bodyRC.length - 1], fontSize: 7 });
    }

    // Grafico barras duplas
    if (typeof Chart !== 'undefined' && (rc.comparativoMensal || rc.meses)) {
      var meses2 = rc.comparativoMensal || rc.meses || [];
      if (meses2.length > 0) {
        y = _checkPage(doc, 90);
        var compData = meses2.map(function(m) { return _safe(m.tributoCompetencia, _safe(m.totalCompetencia)); });
        var caixaData = meses2.map(function(m) { return _safe(m.tributoCaixa, _safe(m.totalCaixa)); });
        y = _inserirGrafico(doc, {
          config: {
            type: 'bar',
            data: {
              labels: MESES_CURTOS.slice(0, meses2.length),
              datasets: [
                { label: 'Tributos Competencia', data: compData, backgroundColor: CHART_COLORS.irpj },
                { label: 'Tributos Caixa', data: caixaData, backgroundColor: CHART_COLORS.lp },
              ]
            },
            options: {
              plugins: { title: { display: true, text: 'Comparativo Mensal: Competencia vs Caixa', font: { size: 13 } } },
              scales: { y: { ticks: { callback: function(v) { return 'R$ ' + (v/1000).toFixed(1) + 'k'; } } } },
            }
          },
          w: 170, h: 80, y: y
        });
      }
    }

    if (rc.recomendacao) {
      y = _textoCorpo(doc, rc.recomendacao, y, { fontSize: 9 });
    }

    y = _refLegal(doc, { texto: 'IN RFB 1.700/2017, Art. 223 — Regime de caixa no LP | Lei 9.430/96, Art. 25 — Opcao pelo regime de caixa | Lei 9.718/1998 — PIS/COFINS no regime de caixa', y: y });
  }

  // ═══════════════════════════════════════════════════
  // SECAO 13: LC 224/2025
  // ═══════════════════════════════════════════════════

  function _gerarLC224PDF(doc, dados) {
    var lc = (dados.results || {}).lc224;
    if (!lc) return;

    _novaPagina(doc, 'Impacto LC 224/2025');
    var y = _tituloSecao(doc, { numero: '12', titulo: 'Impacto LC 224/2025', subtitulo: 'Majoracao de 10% na base presumida' });

    y = _alertaBox(doc, {
      tipo: 'amarelo', titulo: 'ATENCAO',
      texto: 'A LC 224/2025 impacta esta empresa. Vigencia: 01/04/2026. Receita bruta acumulada superior a R$ 5.000.000,00/ano.',
      y: y
    });

    // Tabela trimestral
    if (lc.trimestres) {
      var headLC = ['Trimestre', 'Base sem LC 224', 'Base com LC 224', 'Impacto (+10%)'];
      var bodyLC = [];
      var totSem = 0, totCom = 0, totImp = 0;
      lc.trimestres.forEach(function(t) {
        var sem = _safe(t.baseSemLC224);
        var com = _safe(t.baseComLC224);
        var imp = _safe(t.impacto, com - sem);
        totSem += sem; totCom += com; totImp += imp;
        bodyLC.push(['Q' + t.trimestre, _fmtR$(sem), _fmtR$(com), _fmtR$(imp)]);
      });
      bodyLC.push(['TOTAL', _fmtR$(totSem), _fmtR$(totCom), _fmtR$(totImp)]);
      y = _tabelaProfissional(doc, { head: headLC, body: bodyLC, startY: y, totalRow: [bodyLC.length - 1] });
    }

    // Imposto extra
    y = _textoCorpo(doc, 'Imposto federal extra estimado: ' + _fmtR$(_safe(lc.impostoExtraEstimado)) + '/ano', y, { bold: true });
    if (lc.aliquotaEfetiva) {
      y = _textoCorpo(doc, 'Aliquota efetiva majorada: ' + _fmtPct(lc.aliquotaEfetiva * 100), y);
    }

    // Explicacao
    y = _textoCorpo(doc, 'A LC 224/2025 acresce 10% ao percentual de presuncao para empresas cuja receita bruta acumulada no ano-calendario ultrapasse R$ 5.000.000,00. Exemplo: uma empresa de servicos com presuncao de 32% passa a ter presuncao de 35,2% sobre o excedente. Este acrescimo afeta tanto o IRPJ quanto a CSLL.', y, { fontSize: 9 });

    y = _refLegal(doc, { texto: 'LC 224/2025, Art. 14, I, "a"; Art. 4, par. 4, VII', y: y });
  }

  // ═══════════════════════════════════════════════════
  // SECAO 14: CALENDARIO TRIBUTARIO
  // ═══════════════════════════════════════════════════

  function _gerarCalendarioPDF(doc, dados) {
    var fd = dados.formData || {};
    var res = dados.results || {};
    var cal = null;

    // Tentar gerar o calendario se nao existir
    if (typeof LucroPresumido !== 'undefined' && LucroPresumido.gerarCalendarioTributario && res.anual) {
      try {
        cal = LucroPresumido.gerarCalendarioTributario({
          anualConsolidado: res.anual,
          anoCalendario: fd.anoCalendario || 2026,
          aliquotaISS: (_safe(fd.aliquotaISS) || 5) / 100,
          folhaPagamentoMensal: _safe(fd.folhaPagamentoAnual, _safe(fd.folhaPagamento)) / 12,
          parcelarIRPJCSLL: true,
          receitas: fd.receitas,
          receitaBrutaAnual: fd.receitaBrutaAnual,
        });
      } catch (e) {
        console.error('[ExportadorLP] Erro calendario:', e);
      }
    }
    if (!cal) return;

    _novaPagina(doc, 'Calendario Tributario');
    var y = _tituloSecao(doc, { numero: '13', titulo: 'Calendario Tributario', subtitulo: 'Fluxo de caixa tributario mensal — ' + _safe(fd.anoCalendario, 2026) });

    // KPIs
    var kpis = [
      { label: 'Total Anual Estimado', valor: _fmtR$(_safe(cal.totais && cal.totais.total)), corBorda: CORES.vermelho },
      { label: 'Media Mensal', valor: _fmtR$(_safe(cal.mediaMensal)), corBorda: CORES.amarelo },
      { label: 'Pico de Caixa', valor: cal.picosCaixa && cal.picosCaixa[0] ? cal.picosCaixa[0].mes + ': ' + _fmtR$(cal.picosCaixa[0].valor) : '—', corBorda: CORES.vermelho },
    ];
    y = _kpiGrid(doc, y, kpis, 3);

    // Tabela 12 meses
    if (cal.calendario && cal.calendario.length > 0) {
      var headCal = ['Mes', 'PIS', 'COFINS', 'IRPJ', 'CSLL', 'ISS', 'INSS', 'Total Mes'];
      var bodyCal = [];
      cal.calendario.forEach(function(m) {
        var t = m.tributos || {};
        bodyCal.push([
          m.mesNome || '',
          _fmtR$(_safe(t.pis && t.pis.valor)),
          _fmtR$(_safe(t.cofins && t.cofins.valor)),
          t.irpj && t.irpj.valor > 0 ? _fmtR$(t.irpj.valor) : '—',
          t.csll && t.csll.valor > 0 ? _fmtR$(t.csll.valor) : '—',
          _fmtR$(_safe(t.iss && t.iss.valor)),
          _fmtR$(_safe(t.inssPatronal && t.inssPatronal.valor)),
          _fmtR$(_safe(m.totalMes)),
        ]);
      });
      // Totais
      var tot = cal.totais || {};
      bodyCal.push([
        'TOTAL',
        _fmtR$(_safe(tot.pis)), _fmtR$(_safe(tot.cofins)),
        _fmtR$(_safe(tot.irpj)), _fmtR$(_safe(tot.csll)),
        _fmtR$(_safe(tot.iss)), _fmtR$(_safe(tot.inssPatronal)),
        _fmtR$(_safe(tot.total)),
      ]);
      y = _tabelaProfissional(doc, { head: headCal, body: bodyCal, startY: y, totalRow: [bodyCal.length - 1], fontSize: 6.5 });
    }

    // Grafico barras empilhadas
    if (typeof Chart !== 'undefined' && cal.calendario && cal.calendario.length > 0) {
      y = _checkPage(doc, 100);
      var labels = cal.calendario.map(function(m) { return (m.mesNome || '').substring(0, 3); });
      var datasets = [
        { label: 'PIS', data: cal.calendario.map(function(m) { return _safe(m.tributos && m.tributos.pis && m.tributos.pis.valor); }), backgroundColor: CHART_COLORS.pis },
        { label: 'COFINS', data: cal.calendario.map(function(m) { return _safe(m.tributos && m.tributos.cofins && m.tributos.cofins.valor); }), backgroundColor: CHART_COLORS.cofins },
        { label: 'IRPJ', data: cal.calendario.map(function(m) { return _safe(m.tributos && m.tributos.irpj && m.tributos.irpj.valor); }), backgroundColor: CHART_COLORS.irpj },
        { label: 'CSLL', data: cal.calendario.map(function(m) { return _safe(m.tributos && m.tributos.csll && m.tributos.csll.valor); }), backgroundColor: CHART_COLORS.csll },
        { label: 'ISS', data: cal.calendario.map(function(m) { return _safe(m.tributos && m.tributos.iss && m.tributos.iss.valor); }), backgroundColor: CHART_COLORS.iss },
        { label: 'INSS', data: cal.calendario.map(function(m) { return _safe(m.tributos && m.tributos.inssPatronal && m.tributos.inssPatronal.valor); }), backgroundColor: CHART_COLORS.inss },
      ];

      y = _inserirGrafico(doc, {
        config: {
          type: 'bar',
          data: { labels: labels, datasets: datasets },
          options: {
            plugins: { title: { display: true, text: 'Fluxo de Caixa Tributario Mensal', font: { size: 13 } } },
            scales: { x: { stacked: true }, y: { stacked: true, ticks: { callback: function(v) { return 'R$ ' + (v/1000).toFixed(0) + 'k'; } } } },
          }
        },
        w: 170, h: 90, y: y
      });
    }

    // Codigos DARF
    y = _checkPage(doc, 40);
    y = _tabelaProfissional(doc, {
      head: ['Tributo', 'Codigo DARF', 'Periodicidade', 'Vencimento'],
      body: [
        ['IRPJ Presumido', '2089', 'Trimestral', 'Ultimo dia util do mes seguinte'],
        ['CSLL Presumido', '2372', 'Trimestral', 'Ultimo dia util do mes seguinte'],
        ['PIS Cumulativo', '8109', 'Mensal', '25o dia do mes seguinte'],
        ['COFINS Cumulativo', '2172', 'Mensal', '25o dia do mes seguinte'],
      ],
      startY: y,
    });

    // Picos de caixa
    if (cal.picosCaixa && cal.picosCaixa.length > 0) {
      var picos = cal.picosCaixa.slice(0, 3).map(function(p) { return p.mes + ' (' + _fmtR$(p.valor) + ')'; }).join(', ');
      y = _alertaBox(doc, {
        tipo: 'amarelo', titulo: 'Picos de Caixa',
        texto: 'Meses de maior impacto no caixa: ' + picos + '. Planeje reservas financeiras.',
        y: y
      });
    }

    y = _refLegal(doc, { texto: 'Lei 9.430/96, Arts. 5-6 — Vencimentos e parcelamento | RIR/2018, Art. 856 — Prazo recolhimento | Lei 9.718/1998 — PIS/COFINS vencimentos', y: y });
  }

  // ═══════════════════════════════════════════════════
  // SECAO 15: DICAS DE ECONOMIA
  // ═══════════════════════════════════════════════════

  function _gerarDicasPDF(doc, dados) {
    var dicas = (dados.results || {}).dicas;
    if (!dicas || dicas.length === 0) return;

    _novaPagina(doc, 'Dicas de Economia Tributaria');
    var y = _tituloSecao(doc, { numero: '14', titulo: 'Dicas de Economia Tributaria', subtitulo: 'Recomendacoes baseadas no perfil da empresa' });

    // Agrupar por categoria
    var categorias = { otimizacao_lp: [], migracao_lr: [], ja_aplicado: [], geral: [] };
    dicas.forEach(function(d) {
      var cat = d.categoria || 'geral';
      if (!categorias[cat]) categorias[cat] = [];
      categorias[cat].push(d);
    });

    var catNomes = {
      otimizacao_lp: 'Otimizacoes no Lucro Presumido',
      migracao_lr: 'Oportunidades com Migracao para LR',
      ja_aplicado: 'Beneficios Ja Aplicados',
      geral: 'Informacoes Gerais'
    };

    var corPorTipo = { economia: 'verde', alerta: 'vermelho', acao: 'info', beneficio: 'verde', info: 'info' };

    Object.keys(categorias).forEach(function(cat) {
      var items = categorias[cat];
      if (items.length === 0) return;

      y = _checkPage(doc, 20);
      y = _tituloSecao(doc, { titulo: catNomes[cat] || cat });

      items.forEach(function(d) {
        var tipo = corPorTipo[d.tipo] || 'info';
        var texto = d.descricao || '';
        if (d.impactoEstimado) {
          texto += '\n\nImpacto estimado: ' + _fmtR$(d.impactoEstimado);
        }
        y = _alertaBox(doc, {
          tipo: tipo,
          titulo: '[' + (d.tipo || 'info').toUpperCase() + '] ' + (d.titulo || ''),
          texto: texto,
          y: y
        });
      });
    });
  }

  // ═══════════════════════════════════════════════════
  // SECAO 16: ECONOMIA POTENCIAL
  // ═══════════════════════════════════════════════════

  function _gerarEconomiaPotencialPDF(doc, dados) {
    var ep = (dados.results || {}).economiaPotencial;
    if (!ep) return;

    _novaPagina(doc, 'Economia Potencial Consolidada');
    var y = _tituloSecao(doc, { numero: '15', titulo: 'Economia Potencial Consolidada', subtitulo: 'Oportunidades identificadas' });

    // KPI grande destaque
    y = _checkPage(doc, 35);
    doc.setFillColor(230, 255, 243);
    doc.roundedRect(LAYOUT.marginLeft, y, LAYOUT.contentWidth, 30, 3, 3, 'F');
    doc.setFillColor(16, 185, 129);
    doc.rect(LAYOUT.marginLeft, y, 3, 30, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(10, 80, 55);
    doc.text('ECONOMIA POTENCIAL ANUAL', LAYOUT.pageWidth / 2, y + 8, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(_fmtR$(_safe(ep.totalEconomiaAnual)), LAYOUT.pageWidth / 2, y + 18, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Melhor cenario: ' + (ep.melhorCenario || '—') + ' | Nivel: ' + (ep.nivelOportunidade || '—'), LAYOUT.pageWidth / 2, y + 26, { align: 'center' });
    y += 38;
    _setY(doc, y);

    // Cenario A
    if (ep.otimizacoesLP && ep.otimizacoesLP.length > 0) {
      y = _tituloSecao(doc, { titulo: 'Cenario A: Otimizacoes mantendo Lucro Presumido' });
      var bodyA = ep.otimizacoesLP.map(function(f) { return [f.fonte, _fmtR$(_safe(f.valor)), f.descricao || '']; });
      bodyA.push(['Subtotal', _fmtR$(_safe(ep.totalOtimizacoesLP)), '—']);
      y = _tabelaProfissional(doc, { head: ['Fonte', 'Valor', 'Descricao'], body: bodyA, startY: y, totalRow: [bodyA.length - 1] });
    }

    // Cenario B
    if (ep.migracaoLR && ep.migracaoLR.length > 0) {
      y = _tituloSecao(doc, { titulo: 'Cenario B: Migracao para Lucro Real' });
      var bodyB = ep.migracaoLR.map(function(f) { return [f.fonte, _fmtR$(_safe(f.valor)), f.descricao || '']; });
      bodyB.push(['Subtotal', _fmtR$(_safe(ep.totalMigracaoLR)), '—']);
      y = _tabelaProfissional(doc, { head: ['Fonte', 'Valor', 'Descricao'], body: bodyB, startY: y, totalRow: [bodyB.length - 1] });
    }

    // Ja aplicados
    if (ep.jaAplicados && ep.jaAplicados.length > 0) {
      y = _tituloSecao(doc, { titulo: 'Beneficios Ja Aplicados' });
      var bodyJA = ep.jaAplicados.map(function(f) { return [f.fonte, _fmtR$(_safe(f.valor)), f.descricao || '']; });
      bodyJA.push(['Subtotal', _fmtR$(_safe(ep.totalJaAplicados)), '—']);
      y = _tabelaProfissional(doc, { head: ['Fonte', 'Valor', 'Descricao'], body: bodyJA, startY: y, totalRow: [bodyJA.length - 1] });
    }

    // Diferimentos
    if (ep.diferimentos && ep.diferimentos.length > 0) {
      y = _tituloSecao(doc, { titulo: 'Diferimentos (postergacao, nao economia)' });
      var bodyDif = ep.diferimentos.map(function(f) { return [f.fonte, _fmtR$(_safe(f.valor)), f.descricao || '']; });
      y = _tabelaProfissional(doc, { head: ['Fonte', 'Valor', 'Descricao'], body: bodyDif, startY: y });
    }

    // Nota
    y = _alertaBox(doc, {
      tipo: 'info', titulo: 'Nota',
      texto: 'A economia potencial reflete o MAIOR valor entre os cenarios A (otimizar LP) e B (migrar para LR). Os valores NAO sao cumulativos entre cenarios. Beneficios ja aplicados sao adicionais a qualquer cenario.',
      y: y
    });
  }

  // ═══════════════════════════════════════════════════
  // SECAO 17: VANTAGENS E DESVANTAGENS
  // ═══════════════════════════════════════════════════

  function _gerarVantagensDesvantagensPDF(doc, dados) {
    var vant = (dados.results || {}).vantagens;
    if (!vant) return;

    _novaPagina(doc, 'Vantagens e Desvantagens do LP');
    var y = _tituloSecao(doc, { numero: '16', titulo: 'Vantagens e Desvantagens do LP' });

    var vantagens = vant.vantagens || [];
    var desvantagens = vant.desvantagens || [];

    // Tabela duas colunas
    var maxRows = Math.max(vantagens.length, desvantagens.length);
    var body = [];
    for (var i = 0; i < maxRows; i++) {
      body.push([
        vantagens[i] ? '+ ' + (vantagens[i].texto || vantagens[i]) : '',
        desvantagens[i] ? '- ' + (desvantagens[i].texto || desvantagens[i]) : '',
      ]);
    }
    y = _tabelaProfissional(doc, {
      head: ['Vantagens do Lucro Presumido', 'Desvantagens do Lucro Presumido'],
      body: body, startY: y,
    });

    // Score
    var kpis = [
      { label: 'Vantagens Aplicaveis', valor: String(_safe(vant.vantagensAplicaveis, vantagens.length)), corBorda: CORES.verde },
      { label: 'Desvantagens Aplicaveis', valor: String(_safe(vant.desvantagensAplicaveis, desvantagens.length)), corBorda: CORES.vermelho },
      { label: 'Criticas', valor: String(_safe(vant.desvantagensCriticas, 0)), corBorda: CORES.vermelho },
    ];
    y = _kpiGrid(doc, y, kpis, 3);

    // Analise
    if (vant.analise) {
      y = _textoCorpo(doc, typeof vant.analise === 'string' ? vant.analise : (vant.analise.texto || ''), y, { fontSize: 9 });
    }
  }

  // ═══════════════════════════════════════════════════
  // SECAO 18: OBRIGACOES ACESSORIAS
  // ═══════════════════════════════════════════════════

  function _gerarObrigacoesPDF(doc, dados) {
    _novaPagina(doc, 'Obrigacoes Acessorias');
    var y = _tituloSecao(doc, { numero: '17', titulo: 'Obrigacoes Acessorias', subtitulo: 'Declaracoes e entregas obrigatorias no Lucro Presumido' });

    var obrigacoes = (typeof LucroPresumido !== 'undefined' && LucroPresumido.OBRIGACOES_ACESSORIAS) ? LucroPresumido.OBRIGACOES_ACESSORIAS : {};

    var headObr = ['Obrigacao', 'Periodicidade', 'Prazo', 'Base Legal'];
    var bodyObr = [];
    var ordem = ['DCTF', 'ECF', 'ECD', 'EFD_CONTRIBUICOES', 'EFD_REINF', 'DIRF', 'ESOCIAL'];
    ordem.forEach(function(key) {
      var o = obrigacoes[key];
      if (!o) return;
      bodyObr.push([
        o.nome || key,
        o.periodicidade || '',
        o.prazo || '',
        o.baseLegal || '',
      ]);
    });

    if (bodyObr.length === 0) {
      // Fallback
      bodyObr = [
        ['DCTF', 'Mensal', '15o dia util do 2o mes seguinte', 'IN RFB 2.005/2021'],
        ['ECF', 'Anual', 'Ultimo dia util de julho', 'IN RFB 2.004/2021'],
        ['ECD', 'Anual', 'Ultimo dia util de maio', 'IN RFB 1.774/2017'],
        ['EFD-Contribuicoes', 'Mensal', '10o dia util do 2o mes seguinte', 'IN RFB 1.252/2012'],
        ['EFD-REINF', 'Mensal', '15o dia util do mes seguinte', 'IN RFB 2.043/2021'],
        ['DIRF', 'Anual', 'Ultimo dia util de fevereiro', 'IN RFB 1.990/2020'],
        ['eSocial', 'Mensal', '15o dia util do mes seguinte', 'Decreto 8.373/2014'],
      ];
    }

    y = _tabelaProfissional(doc, { head: headObr, body: bodyObr, startY: y });
  }

  // ═══════════════════════════════════════════════════
  // SECAO 19: RISCOS FISCAIS
  // ═══════════════════════════════════════════════════

  function _gerarRiscosPDF(doc, dados) {
    _novaPagina(doc, 'Riscos Fiscais');
    var y = _tituloSecao(doc, { numero: '18', titulo: 'Riscos Fiscais', subtitulo: 'Principais riscos e medidas de mitigacao' });

    var riscos = (typeof LucroPresumido !== 'undefined' && LucroPresumido.RISCOS_FISCAIS) ? LucroPresumido.RISCOS_FISCAIS : [];

    if (riscos.length === 0) return;

    riscos.forEach(function(risco) {
      var gravidade = risco.gravidade || 'media';
      var tipo = gravidade === 'critica' || gravidade === 'alta' ? 'vermelho' : (gravidade === 'media' ? 'amarelo' : 'verde');

      y = _alertaBox(doc, {
        tipo: tipo,
        titulo: '[' + gravidade.toUpperCase() + '] ' + (risco.titulo || ''),
        texto: (risco.descricao || '') + '\n\nConsequencia: ' + (risco.consequencia || '') + '\n\nPrevencao: ' + (risco.prevencao || ''),
        y: y
      });
    });
  }

  // ═══════════════════════════════════════════════════
  // SECAO 20: INCENTIVOS REGIONAIS
  // ═══════════════════════════════════════════════════

  function _gerarIncentivosRegionaisPDF(doc, dados) {
    var res = dados.results || {};
    var temReducao = res.reducaoRegional && res.reducaoRegional.ativo;
    var temZFM = res.beneficiosZFM && res.beneficiosZFM.zonaFranca;
    var temComparativo = res.comparativoRegional && res.comparativoRegional.aplicavel;

    if (!temReducao && !temZFM && !temComparativo) return;

    _novaPagina(doc, 'Incentivos Regionais');
    var y = _tituloSecao(doc, { numero: '19', titulo: 'Incentivos Regionais', subtitulo: 'SUDAM, SUDENE, Zona Franca de Manaus' });

    // Reducao Regional
    if (temReducao) {
      var rr = res.reducaoRegional;
      y = _alertaBox(doc, {
        tipo: 'info', titulo: 'Reducao Regional — ' + (rr.tipo || ''),
        texto: 'Reducao IRPJ: ' + _fmtPct(_safe(rr.percentualReducao) * 100) + '\nIMPORTANTE: Beneficio disponivel APENAS no Lucro Real.',
        baseLegal: 'MP 2.199-14/2001',
        y: y
      });
    }

    // Comparativo LP vs LR+Incentivo
    if (temComparativo) {
      var comp = res.comparativoRegional;
      y = _tituloSecao(doc, { titulo: 'Comparativo LP vs LR + Incentivo Regional' });
      y = _tabelaProfissional(doc, {
        head: ['Item', 'Lucro Presumido', 'Lucro Real + Incentivo'],
        body: [
          ['IRPJ', _fmtR$(_safe(comp.lpIRPJ)), _fmtR$(_safe(comp.lrIRPJ))],
          ['Reducao Regional', '—', _fmtR$(_safe(comp.reducaoRegional))],
          ['CSLL', _fmtR$(_safe(comp.lpCSLL)), _fmtR$(_safe(comp.lrCSLL))],
          ['PIS/COFINS', _fmtR$(_safe(comp.lpPISCOFINS)), _fmtR$(_safe(comp.lrPISCOFINS))],
          ['Total', _fmtR$(_safe(comp.totalLP)), _fmtR$(_safe(comp.totalLR))],
          ['Economia', '—', _fmtR$(_safe(comp.economia))],
        ],
        startY: y,
        totalRow: [4, 5],
      });
    }

    // ZFM
    if (temZFM) {
      var zfm = res.beneficiosZFM;
      y = _alertaBox(doc, {
        tipo: 'verde', titulo: 'Zona Franca de Manaus / SUFRAMA',
        texto: 'Empresa sediada em area de beneficio fiscal. Beneficios de PIS/COFINS, IPI e ICMS aplicaveis conforme legislacao vigente.',
        y: y
      });
    }
  }

  // ═══════════════════════════════════════════════════
  // SECAO 21: TRANSICAO DE REGIME
  // ═══════════════════════════════════════════════════

  function _gerarTransicaoPDF(doc, dados) {
    _novaPagina(doc, 'Transicao de Regime');
    var y = _tituloSecao(doc, { numero: '20', titulo: 'Transicao de Regime', subtitulo: 'Procedimentos para mudanca de regime tributario' });

    var transicoes = (typeof LucroPresumido !== 'undefined' && LucroPresumido.TRANSICOES) ? LucroPresumido.TRANSICOES : null;
    if (!transicoes) return;

    var chaves = [
      { key: 'SIMPLES_PARA_PRESUMIDO', titulo: '1. Simples Nacional para Lucro Presumido' },
      { key: 'PRESUMIDO_PARA_REAL', titulo: '2. Lucro Presumido para Lucro Real' },
      { key: 'REAL_PARA_PRESUMIDO', titulo: '3. Lucro Real para Lucro Presumido' },
    ];

    chaves.forEach(function(item) {
      var t = transicoes[item.key];
      if (!t) return;

      y = _checkPage(doc, 50);
      y = _tituloSecao(doc, { titulo: item.titulo });

      if (t.descricao) {
        y = _textoCorpo(doc, t.descricao, y, { fontSize: 9 });
      }

      if (t.procedimentos && t.procedimentos.length > 0) {
        var texto = 'Procedimentos:\n' + t.procedimentos.map(function(p, i) { return (i + 1) + '. ' + p; }).join('\n');
        y = _textoCorpo(doc, texto, y, { fontSize: 9 });
      }

      if (t.alertas && t.alertas.length > 0) {
        t.alertas.forEach(function(alerta) {
          y = _alertaBox(doc, { tipo: 'amarelo', titulo: 'Alerta', texto: alerta, y: y });
        });
      }

      if (t.baseLegal) {
        y = _refLegal(doc, { texto: t.baseLegal, y: y });
      }
    });
  }

  // ═══════════════════════════════════════════════════
  // SECAO 22: ANEXO LEGAL
  // ═══════════════════════════════════════════════════

  function _gerarAnexoLegalPDF(doc, dados) {
    _novaPagina(doc, 'Anexo: Fundamentacao Legal');
    var y = _tituloSecao(doc, { numero: '21', titulo: 'Anexo: Fundamentacao Legal', subtitulo: 'Base juridica dos calculos realizados' });

    // Tabela legislacao base
    y = _tabelaProfissional(doc, {
      head: ['Norma', 'Assunto', 'Artigos Relevantes'],
      body: [
        ['Lei 9.249/95', 'IRPJ/CSLL — Presuncao', 'Arts. 9, 15, 20'],
        ['Lei 9.718/1998', 'PIS/COFINS cumulativo', 'Arts. 2, 3, 13'],
        ['Lei 7.689/1988', 'CSLL', 'Art. 3o'],
        ['RIR/2018 (Dec. 9.580)', 'Regulamento IR', 'Arts. 257, 587-610, 624, 725, 856'],
        ['IN RFB 1.700/2017', 'Base de calculo LP', 'Arts. 215, 223, 238'],
        ['LC 116/2003', 'ISS', 'Arts. 3, 7'],
        ['Lei 8.212/91', 'INSS', 'Arts. 21, 22'],
        ['LC 224/2025', 'Majoracao 10%', 'Arts. 4, 8, 14'],
        ['Lei 15.270/2025', 'IRPF 2026', 'Tabela + redutor'],
        ['EC 103/2019', 'INSS progressivo', '—'],
        ['Lei 10.637/2002', 'PIS nao-cumulativo', '(ref. comparativa)'],
        ['Lei 10.833/2003', 'COFINS nao-cumulativo', 'Art. 30'],
        ['Lei 9.430/96', 'Opcao LP, vencimentos', 'Arts. 5, 6, 25'],
        ['IN RFB 1.234/2012', 'Retencoes CSRF', 'Arts. 30, 31'],
        ['IN RFB 1.774/2017', 'ECD', '—'],
        ['MP 2.199-14/2001', 'SUDAM/SUDENE', '—'],
      ],
      startY: y,
      fontSize: 7,
    });

    // Percentuais de presuncao
    if (typeof LucroPresumido !== 'undefined' && LucroPresumido.getAtividadesDisponiveis) {
      y = _checkPage(doc, 40);
      y = _tituloSecao(doc, { titulo: 'Percentuais de Presuncao IRPJ' });
      var atividades = LucroPresumido.getAtividadesDisponiveis();
      var bodyPerc = atividades.map(function(a) {
        return [
          a.id || '',
          (a.descricao || '').substring(0, 50),
          _fmtPct(_safe(a.percentualIRPJ, a.percentual) * 100),
          _fmtPct(_safe(a.percentualCSLL) * 100),
        ];
      });
      y = _tabelaProfissional(doc, {
        head: ['ID', 'Descricao', '% IRPJ', '% CSLL'],
        body: bodyPerc, startY: y, fontSize: 6.5,
      });
    }

    // Vedacoes
    if (typeof LucroPresumido !== 'undefined' && LucroPresumido.VEDACOES_LP_DETALHADAS) {
      y = _checkPage(doc, 40);
      y = _tituloSecao(doc, { titulo: 'Vedacoes ao Lucro Presumido' });
      var vedacoes = LucroPresumido.VEDACOES_LP_DETALHADAS;
      vedacoes.forEach(function(v) {
        y = _textoCorpo(doc, 'Inciso ' + v.inciso + ': ' + v.descricao + (v.baseLegal ? ' (' + v.baseLegal + ')' : ''), y, { fontSize: 8 });
      });
    }
  }

  // ═══════════════════════════════════════════════════
  // SECAO 23: DISCLAIMER
  // ═══════════════════════════════════════════════════

  function _gerarDisclaimerPDF(doc, dados) {
    _novaPagina(doc, 'Disclaimer Juridico');
    var y = 50;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(239, 68, 68);
    doc.text('AVISO LEGAL', LAYOUT.pageWidth / 2, y, { align: 'center' });
    y += 15;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);

    var disclaimer = [
      'Este documento tem carater exclusivamente INFORMATIVO e EDUCACIONAL.',
      '',
      '1. NAO constitui parecer juridico, contabil ou tributario.',
      '2. NAO substitui a consulta a profissionais habilitados (advogados, contadores, consultores tributarios).',
      '3. Os calculos baseiam-se na legislacao vigente ate a data de elaboracao (' + _dataFormatada() + ') e podem sofrer alteracoes por novas leis, instrucoes normativas ou jurisprudencia.',
      '4. Valores estimados de economia sao projecoes baseadas nos dados informados pelo usuario e nas premissas do modelo. Resultados reais podem divergir.',
      '5. A empresa e inteiramente responsavel pela implementacao de qualquer estrategia tributaria, devendo sempre buscar orientacao profissional qualificada.',
      '6. Este estudo NAO considera particularidades tributarias especificas que possam nao ter sido informadas (acordos, regimes especiais, processos administrativos, etc.).',
      '7. A LC 224/2025 ainda pode sofrer regulamentacao complementar que altere os efeitos aqui estimados.',
    ];

    disclaimer.forEach(function(line) {
      if (line === '') { y += 5; return; }
      var lines = doc.splitTextToSize(line, LAYOUT.contentWidth);
      doc.text(lines, LAYOUT.marginLeft, y);
      y += lines.length * 5 + 3;
    });

    y += 10;
    doc.setFontSize(9);
    doc.setTextColor(120, 130, 150);
    doc.text('Legislacao base: Lei 9.249/95, Lei 9.718/1998, RIR/2018 (Decreto 9.580/2018), IN RFB 1.700/2017, LC 224/2025, Lei 15.270/2025.', LAYOUT.marginLeft, y);
    y += 10;

    var lpVer = (typeof LucroPresumido !== 'undefined' && LucroPresumido.VERSION) ? LucroPresumido.VERSION : '3.11.0';
    doc.text('Motor de calculo: IMPOST. v' + lpVer, LAYOUT.marginLeft, y);
    y += 5;
    doc.text('Data de geracao: ' + _dataFormatada(), LAYOUT.marginLeft, y);
  }

  // ═══════════════════════════════════════════════════
  // GERADOR PDF — Orquestrador
  // ═══════════════════════════════════════════════════

  function gerarPDF(appData, opcoes) {
    opcoes = Object.assign({}, OPCOES_PADRAO, opcoes || {});

    if (!appData || !appData.results) {
      throw new Error('appData.results e obrigatorio para gerar o PDF.');
    }

    // Verificar jsPDF
    var jsPDF;
    if (typeof window !== 'undefined' && window.jspdf && window.jspdf.jsPDF) {
      jsPDF = window.jspdf.jsPDF;
    } else if (typeof window !== 'undefined' && window.jsPDF) {
      jsPDF = window.jsPDF;
    } else {
      throw new Error('jsPDF nao encontrado. Carregue jsPDF antes de usar o exportador.');
    }

    var doc = new jsPDF(opcoes.orientacao === 'landscape' ? 'l' : 'p', 'mm', 'a4');
    var fd = appData.formData || {};

    // Metadata do doc
    doc.__empresa = fd.razaoSocial || 'Empresa';
    doc.__dataEstudo = _dataFormatada();
    doc.__secaoAtual = '';
    doc.__lastY = LAYOUT.marginTop;

    // Metadata PDF
    doc.setProperties({
      title: 'Estudo Tributario LP — ' + (fd.razaoSocial || 'Empresa'),
      subject: 'Estudo Tributario — Lucro Presumido',
      author: 'IMPOST.',
      creator: 'ExportadorLP v' + VERSION,
    });

    // Marca dagua
    if (opcoes.incluirMarcaDagua) {
      var totalPages = doc.getNumberOfPages();
      for (var p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFontSize(50);
        doc.setTextColor(200, 200, 200);
        doc.text('RASCUNHO', LAYOUT.pageWidth / 2, LAYOUT.pageHeight / 2, { align: 'center', angle: 45 });
      }
    }

    // Secao 0: Capa
    if (opcoes.incluirCapa) {
      _gerarCapaPDF(doc, appData);
    }

    // Secao 1: Sumario
    if (opcoes.incluirSumario) {
      _gerarSumarioPDF(doc, appData);
    }

    // Secao 2: Resumo Executivo
    _gerarSumarioExecutivoPDF(doc, appData);

    // Secao 3: Simulacao Rapida
    _gerarSimulacaoPDF(doc, appData);

    // Secao 4: Trimestral
    _gerarTrimestralPDF(doc, appData);

    // Secao 5: PIS/COFINS
    _gerarPISCOFINSPDF(doc, appData);

    // Secao 6: Anual
    _gerarAnualPDF(doc, appData);

    // Secao 7: Distribuicao
    _gerarDistribuicaoPDF(doc, appData);

    // Secao 8: Break-Even
    _gerarBreakEvenPDF(doc, appData);

    // Secao 9: Pro-Labore
    _gerarProLaborePDF(doc, appData);

    // Secao 10: JCP
    _gerarJCPPDF(doc, appData);

    // Secao 11: ECD
    _gerarECDPDF(doc, appData);

    // Secao 12: Regime Caixa
    _gerarRegimeCaixaPDF(doc, appData);

    // Secao 13: LC 224
    _gerarLC224PDF(doc, appData);

    // Secao 14: Calendario
    _gerarCalendarioPDF(doc, appData);

    // Secao 15: Dicas
    _gerarDicasPDF(doc, appData);

    // Secao 16: Economia Potencial
    _gerarEconomiaPotencialPDF(doc, appData);

    // Secao 17: Vantagens/Desvantagens
    _gerarVantagensDesvantagensPDF(doc, appData);

    // Secao 18: Obrigacoes
    _gerarObrigacoesPDF(doc, appData);

    // Secao 19: Riscos
    _gerarRiscosPDF(doc, appData);

    // Secao 20: Incentivos Regionais
    _gerarIncentivosRegionaisPDF(doc, appData);

    // Secao 21: Transicao
    _gerarTransicaoPDF(doc, appData);

    // Secao 22: Anexo Legal
    if (opcoes.incluirAnexoLegal) {
      _gerarAnexoLegalPDF(doc, appData);
    }

    // Secao 23: Disclaimer
    if (opcoes.incluirDisclaimer) {
      _gerarDisclaimerPDF(doc, appData);
    }

    // Marca dagua em todas as paginas (pos-geracao)
    if (opcoes.incluirMarcaDagua) {
      var total = doc.getNumberOfPages();
      for (var p = 1; p <= total; p++) {
        doc.setPage(p);
        doc.setFontSize(50);
        doc.setTextColor(230, 230, 230);
        doc.text('RASCUNHO', LAYOUT.pageWidth / 2, LAYOUT.pageHeight / 2, { align: 'center', angle: 45, opacity: 0.15 });
      }
    }

    // Adicionar header/footer em todas as paginas (exceto primeira/capa)
    var totalPags = doc.getNumberOfPages();
    for (var p = 2; p <= totalPags; p++) {
      doc.setPage(p);
      // Footer
      doc.setFontSize(7);
      doc.setTextColor(120, 130, 150);
      doc.setFont('helvetica', 'normal');
      doc.text('Estudo Tributario — Lucro Presumido | Pag ' + p + ' de ' + totalPags + ' | ' + _dataFormatada(), LAYOUT.marginLeft, LAYOUT.pageHeight - 10);
      doc.text('Documento gerado por IMPOST. — Uso exclusivo do destinatario', LAYOUT.pageWidth - LAYOUT.marginRight, LAYOUT.pageHeight - 10, { align: 'right' });
    }

    // Download
    var nomeArquivo = opcoes.nomeArquivoPDF || 'Estudo_LP_' + _sanitizarNome(fd.razaoSocial) + '_' + _dataArquivo() + '.pdf';
    doc.save(nomeArquivo);
  }

  // ═══════════════════════════════════════════════════
  // GERADOR EXCEL — 15 Abas
  // ═══════════════════════════════════════════════════

  function _excelHeader(fd) {
    return [
      ['IMPOST. — Estudo Tributario Lucro Presumido'],
      [(fd.razaoSocial || 'Empresa') + ' | CNPJ: ' + _fmtCNPJ(fd.cnpj) + ' | ' + (fd.estado || '')],
      ['Exercicio ' + _safe(fd.anoCalendario, 2026) + ' | Gerado em ' + _dataFormatada()],
      [],
    ];
  }

  function _fmtExcel(valor) {
    return _safe(valor, 0);
  }

  function _criarAbaResumo(wb, dados) {
    var fd = dados.formData || {};
    var re = (dados.results || {}).resumoExecutivo;
    if (!re) return;

    var aoa = _excelHeader(fd);
    aoa.push(['RESUMO EXECUTIVO']);
    aoa.push([]);
    aoa.push(['Indicador', 'Valor']);
    aoa.push(['Receita Bruta Anual', _fmtExcel(re.receitaBrutaAnual)]);
    aoa.push(['Carga Tributaria Total', _fmtExcel(re.cargaTributariaTotal)]);
    aoa.push(['% Carga sobre Receita', re.percentualCargaTributaria || '']);
    aoa.push(['Lucro Distribuivel Isento', _fmtExcel(re.lucroDistribuivelIsento)]);
    aoa.push(['Economia Potencial', _fmtExcel(re.economiaPotencial)]);
    aoa.push(['Regime Recomendado', re.regimeRecomendado || 'LP']);
    aoa.push(['Break-Even Margem', re.breakEvenMargem || '—']);
    aoa.push(['Margem Operacional Bruta', re.margemOperacionalBruta || '—']);
    aoa.push([]);

    // Acoes
    if (re.acoesEconomia && re.acoesEconomia.length > 0) {
      aoa.push(['ACOES DE ECONOMIA']);
      aoa.push(['#', 'Acao', 'Valor', 'Tipo', 'Aplicada?']);
      re.acoesEconomia.forEach(function(a, i) {
        aoa.push([i + 1, a.acao || '', _fmtExcel(a.valor), a.tipo || '', a.jaAplicada ? 'Sim' : 'Nao']);
      });
      aoa.push([]);
    }

    // Proximos passos
    if (re.proximosPassos && re.proximosPassos.length > 0) {
      aoa.push(['PROXIMOS PASSOS']);
      aoa.push(['Prioridade', 'Acao', 'Valor', 'Descricao']);
      re.proximosPassos.forEach(function(p) {
        aoa.push([p.prioridade || '', p.acao || '', _fmtExcel(p.valor), p.descricao || '']);
      });
    }

    var ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Resumo Executivo');
  }

  function _criarAbaSimulacao(wb, dados) {
    var fd = dados.formData || {};
    var sim = (dados.results || {}).simulacao;
    if (!sim) return;

    var aoa = _excelHeader(fd);
    aoa.push(['SIMULACAO RAPIDA (TRIMESTRAL)']);
    aoa.push([]);
    aoa.push(['Indicador', 'Valor']);
    aoa.push(['Receita Bruta Trimestral', _fmtExcel(sim.receitaBrutaTrimestral)]);
    aoa.push(['Base Presumida IRPJ', _fmtExcel(sim.baseIRPJ)]);
    aoa.push(['IRPJ Total', _fmtExcel(sim.irpj && sim.irpj.total || sim.irpjTotal)]);
    aoa.push(['IRPJ Normal', _fmtExcel(sim.irpj && sim.irpj.normal)]);
    aoa.push(['IRPJ Adicional', _fmtExcel(sim.irpj && sim.irpj.adicional)]);
    aoa.push(['CSLL', _fmtExcel(sim.csll)]);
    aoa.push(['PIS Trimestral', _fmtExcel(sim.pisTrimestral)]);
    aoa.push(['COFINS Trimestral', _fmtExcel(sim.cofinsTrimestral)]);
    aoa.push(['Total Tributos Federais', _fmtExcel(sim.totalTributosFederais)]);
    aoa.push(['Aliquota Efetiva Total', sim.aliquotaEfetivaTotal || '']);

    var ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Simulacao');
  }

  function _criarAbaTrimestral(wb, dados) {
    var fd = dados.formData || {};
    var trim = (dados.results || {}).trimestral;
    if (!trim || trim.length === 0) return;

    var aoa = _excelHeader(fd);
    aoa.push(['IRPJ-CSLL TRIMESTRAL']);
    aoa.push([]);

    var itens = ['Receita Bruta', '(-) Deducoes', '(=) Receita Ajustada', 'Base Presumida IRPJ', 'Base Presumida CSLL', '(+) Adicoes', '(=) Base Calculo IRPJ', '(=) Base Calculo CSLL', 'IRPJ Normal (15%)', 'IRPJ Adicional (10%)', 'IRPJ Bruto', '(-) IRRF Retido', 'IRPJ Devido', 'CSLL Bruta', '(-) CSLL Retida', 'CSLL Devida', 'Total IRPJ+CSLL', 'Aliq. Efetiva'];
    var campos = ['receitaBrutaTotal', 'deducoesDaReceita', 'receitaBrutaAjustada', 'basePresumidaIRPJ', 'basePresumidaCSLL', 'adicoesObrigatorias', 'baseCalculoIRPJ', 'baseCalculoCSLL', 'irpjNormal', 'irpjAdicional', 'irpjBruto', 'irrfRetidoFonte', 'irpjDevido', 'csllBruta', 'csllRetidaFonte', 'csllDevida', 'totalIRPJCSLL', 'aliquotaEfetivaReceita'];

    aoa.push(['Item', '1o Tri', '2o Tri', '3o Tri', '4o Tri', 'Total Anual']);

    for (var i = 0; i < itens.length; i++) {
      var row = [itens[i]];
      var soma = 0;
      var isPct = campos[i] === 'aliquotaEfetivaReceita';
      for (var t = 0; t < 4; t++) {
        var r = (trim[t] && trim[t].resumo) || {};
        var v = r[campos[i]];
        if (isPct) { row.push(v || ''); }
        else { row.push(_fmtExcel(v)); soma += _safe(v); }
      }
      row.push(isPct ? '' : soma);
      aoa.push(row);
    }

    var ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [{ wch: 28 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws, 'IRPJ-CSLL Trimestral');
  }

  function _criarAbaPISCOFINS(wb, dados) {
    var fd = dados.formData || {};
    var pc = (dados.results || {}).piscofins;
    if (!pc || pc.length === 0) return;

    var aoa = _excelHeader(fd);
    aoa.push(['PIS-COFINS MENSAL']);
    aoa.push([]);
    aoa.push(['Mes', 'Receita Bruta', 'Base Calculo', 'PIS (0,65%)', 'COFINS (3%)', 'Total PIS+COFINS']);

    var totais = { rec: 0, base: 0, pis: 0, cofins: 0, total: 0 };
    for (var i = 0; i < Math.min(pc.length, 12); i++) {
      var m = pc[i] || {};
      var rec = _safe(m.receitaBrutaMensal, m.receitaBruta);
      var base = _safe(m.baseCalculo, rec);
      var pis = _safe(m.pis && m.pis.devido, m.pisDevido);
      var cofins = _safe(m.cofins && m.cofins.devida, m.cofinsDevida);
      var total = _safe(m.totalPISCOFINS, pis + cofins);
      totais.rec += rec; totais.base += base; totais.pis += pis; totais.cofins += cofins; totais.total += total;
      aoa.push([MESES_NOMES[i], rec, base, pis, cofins, total]);
    }
    aoa.push(['TOTAL', totais.rec, totais.base, totais.pis, totais.cofins, totais.total]);

    var ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [{ wch: 15 }, { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws, 'PIS-COFINS Mensal');
  }

  function _criarAbaConsolidacao(wb, dados) {
    var fd = dados.formData || {};
    var anual = (dados.results || {}).anual;
    if (!anual) return;

    var trib = anual.tributos || {};
    var cons = anual.consolidacao || {};
    var dist = anual.distribuicaoLucros || {};

    var aoa = _excelHeader(fd);
    aoa.push(['CONSOLIDACAO ANUAL']);
    aoa.push([]);
    aoa.push(['Tributo', 'Valor Anual', '% da Receita', 'Base Legal']);
    var recAnual = _safe(anual.receitaBrutaAnual, 1);

    aoa.push(['IRPJ', _fmtExcel(trib.irpj && trib.irpj.anual), _safe(trib.irpj && trib.irpj.anual) / recAnual, 'Lei 9.249/95, Art. 15']);
    aoa.push(['CSLL', _fmtExcel(trib.csll && trib.csll.anual), _safe(trib.csll && trib.csll.anual) / recAnual, 'Lei 7.689/1988, Art. 3o']);
    aoa.push(['PIS', _fmtExcel(trib.pis && trib.pis.anual), _safe(trib.pis && trib.pis.anual) / recAnual, 'Lei 9.718/1998']);
    aoa.push(['COFINS', _fmtExcel(trib.cofins && trib.cofins.anual), _safe(trib.cofins && trib.cofins.anual) / recAnual, 'Lei 9.718/1998']);
    aoa.push(['ISS', _fmtExcel(trib.iss && trib.iss.anual), _safe(trib.iss && trib.iss.anual) / recAnual, 'LC 116/2003']);
    aoa.push(['INSS Patronal', _fmtExcel(trib.inssPatronal && trib.inssPatronal.anual), _safe(trib.inssPatronal && trib.inssPatronal.anual) / recAnual, 'Lei 8.212/91, Art. 22']);
    aoa.push(['TOTAL', _fmtExcel(cons.cargaTributariaTotal), cons.percentualCargaTributaria || '', '']);
    aoa.push([]);

    // Distribuicao
    aoa.push(['DISTRIBUICAO DE LUCROS']);
    aoa.push(['Lucro Distribuivel Isento', _fmtExcel(dist.lucroDistribuivelFinal)]);
    aoa.push(['Tipo Base', dist.tipoBase || 'Presumido']);
    if (dist.porSocio) {
      aoa.push([]);
      aoa.push(['Socio', 'Participacao', 'Lucro Isento']);
      dist.porSocio.forEach(function(s) {
        aoa.push([s.nome || '', s.percentualFormatado || '', _fmtExcel(s.valorIsento)]);
      });
    }

    var ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Consolidacao Anual');
  }

  function _criarAbaDistribuicao(wb, dados) {
    var fd = dados.formData || {};
    var anual = (dados.results || {}).anual;
    if (!anual || !anual.distribuicaoLucros) return;
    var dist = anual.distribuicaoLucros;

    var aoa = _excelHeader(fd);
    aoa.push(['DISTRIBUICAO DE LUCROS']);
    aoa.push([]);
    aoa.push(['Receita Bruta Anual', _fmtExcel(anual.receitaBrutaAnual)]);
    aoa.push(['Base Presumida IRPJ+CSLL', _fmtExcel(dist.basePresumidaAnual)]);
    aoa.push(['(-) Tributos Federais Apurados (IRPJ+CSLL+PIS+COFINS)', _fmtExcel(dist.tributosDescontados)]);
    aoa.push(['(=) Lucro Distribuivel Presumido', _fmtExcel(dist.lucroDistribuivelPresumido)]);
    aoa.push(['Lucro Distribuivel Final', _fmtExcel(dist.lucroDistribuivelFinal)]);
    aoa.push(['Tipo Base', dist.tipoBase || 'Presumido']);
    aoa.push([]);

    if (dist.porSocio) {
      aoa.push(['Socio', 'Participacao (%)', 'Lucro Isento (R$)', 'Base Legal']);
      dist.porSocio.forEach(function(s) {
        aoa.push([s.nome, _safe(s.percentual) * 100, _fmtExcel(s.valorIsento), 'IN RFB 1.700/2017, Art. 238']);
      });
    }

    var ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [{ wch: 35 }, { wch: 18 }, { wch: 18 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Distribuicao Lucros');
  }

  function _criarAbaBreakEven(wb, dados) {
    var fd = dados.formData || {};
    var be = (dados.results || {}).breakeven;
    if (!be || !be.margens) return;

    var aoa = _excelHeader(fd);
    aoa.push(['BREAK-EVEN LP vs LR']);
    aoa.push([]);
    aoa.push(['Break-Even Margem (%)', be.breakEvenMargem || (be.lpSempreVantajoso ? 'LP sempre vantajoso' : 'LR sempre vantajoso')]);
    aoa.push(['Margem Operacional Bruta (%)', be.margemOperacionalBruta || '']);
    aoa.push([]);

    // 99 linhas de dados para graficos
    aoa.push(['Margem (%)', 'Carga LP (R$)', 'Carga LR (R$)', 'Diferenca LP - LR (R$)', 'Resultado']);

    be.margens.forEach(function(m) {
      aoa.push([
        m.margem,
        m.cargaLP,
        m.cargaLR,
        m.diferencaLPvsLR || (m.cargaLP - m.cargaLR),
        (m.cargaLP - m.cargaLR) > 0 ? 'LP mais caro' : 'LP mais barato'
      ]);
    });

    var ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [{ wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Break-Even');
  }

  function _criarAbaProLabore(wb, dados) {
    var fd = dados.formData || {};
    var pl = (dados.results || {}).proLabore;
    if (!pl || pl.length === 0) return;

    var aoa = _excelHeader(fd);
    aoa.push(['OTIMIZACAO PRO-LABORE']);
    aoa.push([]);

    pl.forEach(function(socio, idx) {
      if (!socio) return;
      if (idx > 0) aoa.push([]);
      aoa.push(['SOCIO: ' + (socio.nome || 'Socio ' + (idx + 1))]);
      aoa.push(['Pro-Labore Otimo', _fmtExcel((socio.recomendado || socio.otimo || {}).proLaboreMensal)]);
      aoa.push(['Economia Anual', _fmtExcel(socio.economiaAnual)]);
      aoa.push(['Minimo Anti-Autuacao', _fmtExcel(socio.minimoAntiAutuacao)]);
      aoa.push([]);

      // Todos os cenarios
      var cenarios = socio.cenarios || socio.cenariosChave || [];
      if (cenarios.length > 0) {
        aoa.push(['Pro-Labore Mensal', 'INSS Patronal', 'INSS Retido', 'IRPF', 'Liquido Socio', 'Custo Empresa Mensal', 'Custo Empresa Anual', 'Tributos Anuais', 'Retorno/R$ Tributo', 'Cenario']);
        cenarios.forEach(function(c) {
          aoa.push([
            _fmtExcel(c.proLaboreMensal),
            _fmtExcel(c.inssPatronal),
            _fmtExcel(c.inssRetido),
            _fmtExcel(c.irpf),
            _fmtExcel(c.liquidoSocio || c.liquido),
            _fmtExcel(c.custoEmpresa || c.custoEmpresaMensal),
            _fmtExcel(c.custoEmpresaAnual || (_safe(c.custoEmpresa || c.custoEmpresaMensal) * 12)),
            _fmtExcel(c.tributosAnuais || 0),
            _fmtExcel(c.retornoPorRealTributo || 0),
            c.cenario || c.label || '',
          ]);
        });
      }
    });

    var ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [{ wch: 18 }, { wch: 15 }, { wch: 13 }, { wch: 12 }, { wch: 15 }, { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 18 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Pro-Labore');
  }

  function _criarAbaJCPECD(wb, dados) {
    var fd = dados.formData || {};
    var jcp = (dados.results || {}).jcp;
    var ecd = (dados.results || {}).ecd;
    if (!jcp && !ecd) return;

    var aoa = _excelHeader(fd);

    // JCP
    if (jcp) {
      aoa.push(['SIMULACAO JCP']);
      aoa.push([]);
      aoa.push(['JCP Bruto Maximo', _fmtExcel(jcp.jcpBruto)]);
      aoa.push(['IRRF Retido', _fmtExcel(jcp.irrfRetido)]);
      aoa.push(['JCP Liquido', _fmtExcel(jcp.jcpLiquido)]);
      aoa.push(['Aliquota IRRF', jcp.aliquotaIRRFPercentual || '15%']);
      aoa.push(['Limite Deducao', _fmtExcel(jcp.limiteDeducao)]);
      aoa.push([]);

      if (jcp.comparativo) {
        aoa.push(['Via', 'Valor Bruto', 'Custo Total', 'Liquido Socio', 'Aliquota Efetiva']);
        var comp = jcp.comparativo;
        if (comp.viaDistribuicaoIsenta) aoa.push(['Distribuicao Isenta', _fmtExcel(comp.viaDistribuicaoIsenta.valorBruto), 0, _fmtExcel(comp.viaDistribuicaoIsenta.liquido), '0%']);
        if (comp.viaJCP) aoa.push(['JCP', _fmtExcel(comp.viaJCP.valorBruto), _fmtExcel(comp.viaJCP.custo), _fmtExcel(comp.viaJCP.liquido), comp.viaJCP.aliquotaEfetiva || '']);
        if (comp.viaProlabore) aoa.push(['Pro-Labore', _fmtExcel(comp.viaProlabore.valorBruto), _fmtExcel(comp.viaProlabore.custoTotal), _fmtExcel(comp.viaProlabore.liquido), comp.viaProlabore.aliquotaEfetiva || '']);
      }
      aoa.push([]);
    }

    // ECD
    if (ecd) {
      aoa.push(['BENEFICIO ECD']);
      aoa.push([]);
      aoa.push(['Limite Presumido', _fmtExcel(ecd.limitePresumido)]);
      aoa.push(['Limite Contabil (ECD)', _fmtExcel(ecd.limiteContabil)]);
      aoa.push(['Dist. Isenta Adicional (liq.)', _fmtExcel(ecd.beneficioLiquido)]);
      aoa.push(['Custo ECD Anual', _fmtExcel(ecd.custoECD)]);
      aoa.push(['Vale a pena?', ecd.valeAPena ? 'SIM' : 'NAO']);
    }

    var ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [{ wch: 30 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws, 'JCP-ECD');
  }

  function _criarAbaCaixaComp(wb, dados) {
    var fd = dados.formData || {};
    var rc = (dados.results || {}).regimeCaixa;
    if (!rc) return;

    var aoa = _excelHeader(fd);
    aoa.push(['CAIXA vs COMPETENCIA']);
    aoa.push([]);
    aoa.push(['Total Faturado', _fmtExcel(rc.totalFaturado)]);
    aoa.push(['Total Recebido', _fmtExcel(rc.totalRecebido)]);
    aoa.push(['Total Diferido', _fmtExcel(rc.totalDiferido)]);
    aoa.push([]);

    var meses = rc.comparativoMensal || rc.meses || [];
    if (meses.length > 0) {
      aoa.push(['Mes', 'Faturado', 'Recebido', 'Tributo (Comp.)', 'Tributo (Caixa)', 'Diferido']);
      for (var i = 0; i < Math.min(meses.length, 12); i++) {
        var m = meses[i] || {};
        aoa.push([
          MESES_NOMES[i],
          _fmtExcel(m.faturado || m.faturamento),
          _fmtExcel(m.recebido || m.recebimento),
          _fmtExcel(m.tributoCompetencia || m.totalCompetencia),
          _fmtExcel(m.tributoCaixa || m.totalCaixa),
          _fmtExcel(m.diferido),
        ]);
      }
    }

    var ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [{ wch: 15 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Caixa vs Competencia');
  }

  function _criarAbaCalendario(wb, dados) {
    var fd = dados.formData || {};
    var res = dados.results || {};
    var cal = null;

    if (typeof LucroPresumido !== 'undefined' && LucroPresumido.gerarCalendarioTributario && res.anual) {
      try {
        cal = LucroPresumido.gerarCalendarioTributario({
          anualConsolidado: res.anual,
          anoCalendario: fd.anoCalendario || 2026,
          aliquotaISS: (_safe(fd.aliquotaISS) || 5) / 100,
          folhaPagamentoMensal: _safe(fd.folhaPagamentoAnual, _safe(fd.folhaPagamento)) / 12,
          parcelarIRPJCSLL: true,
          receitas: fd.receitas,
          receitaBrutaAnual: fd.receitaBrutaAnual,
        });
      } catch (e) { /* skip */ }
    }
    if (!cal || !cal.calendario) return;

    var aoa = _excelHeader(fd);
    aoa.push(['CALENDARIO TRIBUTARIO']);
    aoa.push([]);
    aoa.push(['Mes', 'PIS', 'COFINS', 'IRPJ', 'CSLL', 'ISS', 'INSS Patronal', 'Total Mes', 'Acumulado']);

    cal.calendario.forEach(function(m) {
      var t = m.tributos || {};
      aoa.push([
        m.mesNome || '',
        _fmtExcel(t.pis && t.pis.valor),
        _fmtExcel(t.cofins && t.cofins.valor),
        _fmtExcel(t.irpj && t.irpj.valor),
        _fmtExcel(t.csll && t.csll.valor),
        _fmtExcel(t.iss && t.iss.valor),
        _fmtExcel(t.inssPatronal && t.inssPatronal.valor),
        _fmtExcel(m.totalMes),
        _fmtExcel(m.totalAcumulado),
      ]);
    });

    var tot = cal.totais || {};
    aoa.push(['TOTAL', _fmtExcel(tot.pis), _fmtExcel(tot.cofins), _fmtExcel(tot.irpj), _fmtExcel(tot.csll), _fmtExcel(tot.iss), _fmtExcel(tot.inssPatronal), _fmtExcel(tot.total), '']);

    var ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [{ wch: 15 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Calendario');
  }

  function _criarAbaDicas(wb, dados) {
    var fd = dados.formData || {};
    var dicas = (dados.results || {}).dicas;
    if (!dicas || dicas.length === 0) return;

    var aoa = _excelHeader(fd);
    aoa.push(['DICAS DE ECONOMIA TRIBUTARIA']);
    aoa.push([]);
    aoa.push(['#', 'Titulo', 'Tipo', 'Impacto Estimado (R$)', 'Categoria', 'Descricao']);

    dicas.forEach(function(d, i) {
      aoa.push([i + 1, d.titulo || '', d.tipo || '', _fmtExcel(d.impactoEstimado), d.categoria || '', d.descricao || '']);
    });

    var ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [{ wch: 5 }, { wch: 35 }, { wch: 12 }, { wch: 20 }, { wch: 18 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Dicas Economia');
  }

  function _criarAbaEconomia(wb, dados) {
    var fd = dados.formData || {};
    var ep = (dados.results || {}).economiaPotencial;
    if (!ep) return;

    var aoa = _excelHeader(fd);
    aoa.push(['ECONOMIA POTENCIAL CONSOLIDADA']);
    aoa.push([]);
    aoa.push(['Economia Potencial Total', _fmtExcel(ep.totalEconomiaAnual)]);
    aoa.push(['Melhor Cenario', ep.melhorCenario || '']);
    aoa.push(['Nivel Oportunidade', ep.nivelOportunidade || '']);
    aoa.push([]);

    // Cenario A
    if (ep.otimizacoesLP && ep.otimizacoesLP.length > 0) {
      aoa.push(['CENARIO A: OTIMIZACOES NO LP']);
      aoa.push(['Fonte', 'Valor (R$)', 'Descricao']);
      ep.otimizacoesLP.forEach(function(f) { aoa.push([f.fonte, _fmtExcel(f.valor), f.descricao || '']); });
      aoa.push(['Subtotal', _fmtExcel(ep.totalOtimizacoesLP), '']);
      aoa.push([]);
    }

    // Cenario B
    if (ep.migracaoLR && ep.migracaoLR.length > 0) {
      aoa.push(['CENARIO B: MIGRACAO PARA LR']);
      aoa.push(['Fonte', 'Valor (R$)', 'Descricao']);
      ep.migracaoLR.forEach(function(f) { aoa.push([f.fonte, _fmtExcel(f.valor), f.descricao || '']); });
      aoa.push(['Subtotal', _fmtExcel(ep.totalMigracaoLR), '']);
      aoa.push([]);
    }

    // Ja aplicados
    if (ep.jaAplicados && ep.jaAplicados.length > 0) {
      aoa.push(['BENEFICIOS JA APLICADOS']);
      aoa.push(['Fonte', 'Valor (R$)', 'Descricao']);
      ep.jaAplicados.forEach(function(f) { aoa.push([f.fonte, _fmtExcel(f.valor), f.descricao || '']); });
      aoa.push(['Subtotal', _fmtExcel(ep.totalJaAplicados), '']);
    }

    var ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [{ wch: 35 }, { wch: 18 }, { wch: 45 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Economia Potencial');
  }

  function _criarAbaObrigacoesRiscos(wb, dados) {
    var fd = dados.formData || {};
    var aoa = _excelHeader(fd);

    // Obrigacoes
    aoa.push(['OBRIGACOES ACESSORIAS']);
    aoa.push([]);
    aoa.push(['Obrigacao', 'Periodicidade', 'Prazo', 'Base Legal']);

    var obrigacoes = (typeof LucroPresumido !== 'undefined' && LucroPresumido.OBRIGACOES_ACESSORIAS) ? LucroPresumido.OBRIGACOES_ACESSORIAS : {};
    var ordem = ['DCTF', 'ECF', 'ECD', 'EFD_CONTRIBUICOES', 'EFD_REINF', 'DIRF', 'ESOCIAL'];
    ordem.forEach(function(key) {
      var o = obrigacoes[key];
      if (!o) {
        // Fallback
        var fallbacks = {
          DCTF: ['DCTF', 'Mensal', '15o dia util do 2o mes seguinte', 'IN RFB 2.005/2021'],
          ECF: ['ECF', 'Anual', 'Ultimo dia util de julho', 'IN RFB 2.004/2021'],
          ECD: ['ECD', 'Anual', 'Ultimo dia util de maio', 'IN RFB 1.774/2017'],
          EFD_CONTRIBUICOES: ['EFD-Contribuicoes', 'Mensal', '10o dia util do 2o mes seguinte', 'IN RFB 1.252/2012'],
          EFD_REINF: ['EFD-REINF', 'Mensal', '15o dia util do mes seguinte', 'IN RFB 2.043/2021'],
          DIRF: ['DIRF', 'Anual', 'Ultimo dia util de fevereiro', 'IN RFB 1.990/2020'],
          ESOCIAL: ['eSocial', 'Mensal', '15o dia util do mes seguinte', 'Decreto 8.373/2014'],
        };
        aoa.push(fallbacks[key] || [key, '', '', '']);
        return;
      }
      aoa.push([o.nome || key, o.periodicidade || '', o.prazo || '', o.baseLegal || '']);
    });

    aoa.push([]);
    aoa.push([]);

    // Riscos
    aoa.push(['RISCOS FISCAIS']);
    aoa.push([]);
    aoa.push(['Titulo', 'Gravidade', 'Descricao', 'Consequencia', 'Prevencao']);

    var riscos = (typeof LucroPresumido !== 'undefined' && LucroPresumido.RISCOS_FISCAIS) ? LucroPresumido.RISCOS_FISCAIS : [];
    riscos.forEach(function(r) {
      aoa.push([r.titulo || '', r.gravidade || '', r.descricao || '', r.consequencia || '', r.prevencao || '']);
    });

    var ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 40 }, { wch: 35 }, { wch: 35 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Obrigacoes-Riscos');
  }

  function _criarAbaBaseLegal(wb, dados) {
    var fd = dados.formData || {};
    var aoa = _excelHeader(fd);

    aoa.push(['FUNDAMENTACAO LEGAL']);
    aoa.push([]);
    aoa.push(['Norma', 'Assunto', 'Artigos Relevantes']);
    var leis = [
      ['Lei 9.249/95', 'IRPJ/CSLL — Presuncao', 'Arts. 9, 15, 20'],
      ['Lei 9.718/1998', 'PIS/COFINS cumulativo', 'Arts. 2, 3, 13'],
      ['Lei 7.689/1988', 'CSLL', 'Art. 3o'],
      ['RIR/2018 (Dec. 9.580)', 'Regulamento IR', 'Arts. 257, 587-610, 624, 725, 856'],
      ['IN RFB 1.700/2017', 'Base de calculo LP', 'Arts. 215, 223, 238'],
      ['LC 116/2003', 'ISS', 'Arts. 3, 7'],
      ['Lei 8.212/91', 'INSS', 'Arts. 21, 22'],
      ['LC 224/2025', 'Majoracao 10%', 'Arts. 4, 8, 14'],
      ['Lei 15.270/2025', 'IRPF 2026', 'Tabela + redutor'],
      ['EC 103/2019', 'INSS progressivo', '—'],
      ['Lei 10.637/2002', 'PIS nao-cumulativo', '(ref. comparativa)'],
      ['Lei 10.833/2003', 'COFINS nao-cumulativo', 'Art. 30'],
      ['Lei 9.430/96', 'Opcao LP, vencimentos', 'Arts. 5, 6, 25'],
      ['IN RFB 1.234/2012', 'Retencoes CSRF', 'Arts. 30, 31'],
      ['IN RFB 1.774/2017', 'ECD', '—'],
      ['MP 2.199-14/2001', 'SUDAM/SUDENE', '—'],
    ];
    leis.forEach(function(l) { aoa.push(l); });

    // Percentuais
    if (typeof LucroPresumido !== 'undefined' && LucroPresumido.getAtividadesDisponiveis) {
      aoa.push([]);
      aoa.push(['PERCENTUAIS DE PRESUNCAO']);
      aoa.push(['ID', 'Descricao', '% IRPJ', '% CSLL']);
      var atividades = LucroPresumido.getAtividadesDisponiveis();
      atividades.forEach(function(a) {
        aoa.push([a.id, a.descricao || '', _safe(a.percentualIRPJ || a.percentual, 0) * 100, _safe(a.percentualCSLL, 0) * 100]);
      });
    }

    // Vedacoes
    if (typeof LucroPresumido !== 'undefined' && LucroPresumido.VEDACOES_LP_DETALHADAS) {
      aoa.push([]);
      aoa.push(['VEDACOES AO LUCRO PRESUMIDO']);
      aoa.push(['Inciso', 'Descricao', 'Base Legal']);
      LucroPresumido.VEDACOES_LP_DETALHADAS.forEach(function(v) {
        aoa.push([v.inciso, v.descricao, v.baseLegal || '']);
      });
    }

    var ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [{ wch: 25 }, { wch: 45 }, { wch: 35 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Base Legal');
  }

  function gerarExcel(appData, opcoes) {
    opcoes = Object.assign({}, OPCOES_PADRAO, opcoes || {});

    if (!appData || !appData.results) {
      throw new Error('appData.results e obrigatorio para gerar o Excel.');
    }

    if (typeof XLSX === 'undefined') {
      throw new Error('SheetJS (XLSX) nao encontrado. Adicione <script src="https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js"></script> ao HTML.');
    }

    var wb = XLSX.utils.book_new();
    var fd = appData.formData || {};

    // 15 abas
    _criarAbaResumo(wb, appData);
    _criarAbaSimulacao(wb, appData);
    _criarAbaTrimestral(wb, appData);
    _criarAbaPISCOFINS(wb, appData);
    _criarAbaConsolidacao(wb, appData);
    _criarAbaDistribuicao(wb, appData);
    _criarAbaBreakEven(wb, appData);
    _criarAbaProLabore(wb, appData);
    _criarAbaJCPECD(wb, appData);
    _criarAbaCaixaComp(wb, appData);
    _criarAbaCalendario(wb, appData);
    _criarAbaDicas(wb, appData);
    _criarAbaEconomia(wb, appData);
    _criarAbaObrigacoesRiscos(wb, appData);
    _criarAbaBaseLegal(wb, appData);

    // Download
    var nomeArquivo = opcoes.nomeArquivoExcel || 'Estudo_LP_' + _sanitizarNome(fd.razaoSocial) + '_' + _dataArquivo() + '.xlsx';
    XLSX.writeFile(wb, nomeArquivo);
  }

  function gerarAmbos(appData, opcoes) {
    gerarPDF(appData, opcoes);
    gerarExcel(appData, opcoes);
  }

  // ═══════════════════════════════════════════════════
  // API PUBLICA
  // ═══════════════════════════════════════════════════

  var ExportadorLP = {
    VERSION: VERSION,
    gerarPDF: gerarPDF,
    gerarExcel: gerarExcel,
    gerarAmbos: gerarAmbos,

    // Helpers exportados para debug/teste
    _gerarCapaPDF: _gerarCapaPDF,
    _gerarSumarioExecutivoPDF: _gerarSumarioExecutivoPDF,
    _gerarTrimestralPDF: _gerarTrimestralPDF,
    _gerarPISCOFINSPDF: _gerarPISCOFINSPDF,
    _gerarAnualPDF: _gerarAnualPDF,
    _gerarDistribuicaoPDF: _gerarDistribuicaoPDF,
    _gerarBreakEvenPDF: _gerarBreakEvenPDF,
    _gerarProLaborePDF: _gerarProLaborePDF,
    _gerarJCPPDF: _gerarJCPPDF,
    _gerarRegimeCaixaPDF: _gerarRegimeCaixaPDF,
    _gerarECDPDF: _gerarECDPDF,
    _gerarLC224PDF: _gerarLC224PDF,
    _gerarDicasPDF: _gerarDicasPDF,
    _gerarCalendarioPDF: _gerarCalendarioPDF,
    _gerarObrigacoesPDF: _gerarObrigacoesPDF,
    _gerarRiscosPDF: _gerarRiscosPDF,
    _gerarVantagensDesvantagensPDF: _gerarVantagensDesvantagensPDF,
    _gerarTransicaoPDF: _gerarTransicaoPDF,
    _gerarIncentivosRegionaisPDF: _gerarIncentivosRegionaisPDF,
    _gerarDisclaimerPDF: _gerarDisclaimerPDF,
    _gerarAnexoLegalPDF: _gerarAnexoLegalPDF,
  };

  return ExportadorLP;
});
