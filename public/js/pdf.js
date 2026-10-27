/*
 * PSYCHE MIRROR — PDF export with jsPDF.
 * The PDF is built entirely in the browser and handed straight to the
 * download prompt; it is never uploaded anywhere.
 */
(function (root) {
  'use strict';

  var PAGE = { w: 210, h: 297, margin: 18 }; // A4, millimetres
  var INK = [42, 26, 18];
  var MUTED = [90, 66, 50];
  var OXBLOOD = [142, 31, 43];
  var PARCHMENT = [248, 241, 226];
  var BAND_LABELS = { low: 'Lower', mid: 'Middling', high: 'Higher' };

  /** jsPDF's built-in Times font is WinAnsi; fold typographic marks to plain ones. */
  function plain(text) {
    return String(text)
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/\u2013/g, '-')
      .replace(/\s*\u2014\s*/g, ' - ')
      .replace(/\u2026/g, '...')
      .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, '');
  }

  function isoDate(d) {
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function paintPage(doc) {
    doc.setFillColor(PARCHMENT[0], PARCHMENT[1], PARCHMENT[2]);
    doc.rect(0, 0, PAGE.w, PAGE.h, 'F');
    doc.setDrawColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.setLineWidth(0.3);
    doc.rect(8, 8, PAGE.w - 16, PAGE.h - 16);
    doc.setLineWidth(0.15);
    doc.rect(10, 10, PAGE.w - 20, PAGE.h - 20);
  }

  function footer(doc, pageNo) {
    doc.setFont('times', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(
      'PSYCHE MIRROR - for self-reflection only. Not a psychological test, not a diagnosis, not a substitute for a professional.',
      PAGE.w / 2, PAGE.h - 13, { align: 'center' }
    );
    doc.text(String(pageNo), PAGE.w - PAGE.margin, PAGE.h - 13, { align: 'right' });
  }

  /**
   * Build the PDF document. `images` = { radar, bar } PNG data URLs.
   * Returns the jsPDF instance (caller saves it).
   */
  function build(jsPDF, realms, results, images, now) {
    now = now || new Date();
    var doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    doc.setProperties({
      title: 'PSYCHE MIRROR - Your Reflection',
      subject: 'Personality self-reflection (not a diagnosis)',
      creator: 'PSYCHE MIRROR'
    });
    var page = 1;
    var x = PAGE.margin;
    var width = PAGE.w - PAGE.margin * 2;
    var y;

    paintPage(doc);

    // Title block
    doc.setTextColor(OXBLOOD[0], OXBLOOD[1], OXBLOOD[2]);
    doc.setFont('times', 'bold');
    doc.setFontSize(30);
    doc.text('PSYCHE MIRROR', PAGE.w / 2, 32, { align: 'center', charSpace: 1.2 });
    doc.setFont('times', 'italic');
    doc.setFontSize(13);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text('The Reflection, sealed on ' + isoDate(now), PAGE.w / 2, 40, { align: 'center' });
    doc.setDrawColor(OXBLOOD[0], OXBLOOD[1], OXBLOOD[2]);
    doc.setLineWidth(0.4);
    doc.line(PAGE.w / 2 - 30, 44, PAGE.w / 2 + 30, 44);

    // Charts side by side
    var chartW = (width - 6) / 2;
    if (images && images.radar) doc.addImage(images.radar, 'PNG', x, 50, chartW, chartW, undefined, 'FAST');
    if (images && images.bar) doc.addImage(images.bar, 'PNG', x + chartW + 6, 50, chartW, chartW, undefined, 'FAST');
    y = 50 + chartW + 8;

    // Score table
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(INK[0], INK[1], INK[2]);
    var cols = [x, x + 46, x + 112, x + 132, x + 156];
    ['Realm', 'Trait', 'Score', 'Band', 'Answered'].forEach(function (h, i) { doc.text(h, cols[i], y); });
    doc.setLineWidth(0.2);
    doc.line(x, y + 1.5, x + width, y + 1.5);
    y += 7;
    doc.setFont('times', 'normal');
    results.forEach(function (r) {
      doc.text(plain(r.name), cols[0], y);
      doc.text(plain(r.trait), cols[1], y);
      doc.text(r.scored ? String(r.percent) : '-', cols[2], y);
      doc.text(r.scored ? BAND_LABELS[r.band] + (r.provisional ? '*' : '') : 'Unscored', cols[3], y);
      doc.text(r.answered + ' / ' + r.total, cols[4], y);
      y += 6;
    });
    if (results.some(function (r) { return r.provisional; })) {
      doc.setFont('times', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
      doc.text('* provisional: scored from a partly completed realm', x, y);
      y += 5;
    }

    footer(doc, page);

    // Readings
    function ensureSpace(h) {
      if (y + h > PAGE.h - 22) {
        doc.addPage();
        page += 1;
        paintPage(doc);
        footer(doc, page);
        y = 26;
      }
    }

    y += 4;
    ensureSpace(14);
    doc.setFont('times', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(OXBLOOD[0], OXBLOOD[1], OXBLOOD[2]);
    doc.text('The Readings', x, y);
    y += 8;

    results.forEach(function (r, i) {
      var realm = realms[i];
      var title = plain(realm.numeral + '. ' + realm.name + ' - ' + realm.trait);
      var bandTitle;
      var body;
      if (r.scored) {
        var band = realm.bands[r.band];
        bandTitle = plain(band.title + '  (' + r.percent + '/100' + (r.provisional ? ', provisional' : '') + ')');
        body = plain(band.text);
      } else {
        bandTitle = 'Unscored';
        body = 'Fewer than half of this realm\'s statements were answered, so the glass stays dark here.';
      }
      var lines = doc.setFont('times', 'normal').setFontSize(11).splitTextToSize(body, width);
      ensureSpace(14 + lines.length * 5);

      doc.setFont('times', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(INK[0], INK[1], INK[2]);
      doc.text(title, x, y);
      y += 5.5;
      doc.setFont('times', 'italic');
      doc.setFontSize(11);
      doc.setTextColor(OXBLOOD[0], OXBLOOD[1], OXBLOOD[2]);
      doc.text(bandTitle, x, y);
      y += 5.5;
      doc.setFont('times', 'normal');
      doc.setTextColor(INK[0], INK[1], INK[2]);
      doc.text(lines, x, y);
      y += lines.length * 5 + 5;
    });

    // Closing note
    var note = plain(
      'Scores run from 0 to 100 and describe only how you answered on this day, relative to the midpoint of the ' +
      'scale - not compared with other people and not against any clinical norm. Statements are from the ' +
      'International Personality Item Pool (ipip.ori.org), which is in the public domain. ' +
      'This reflection is for curiosity and self-reflection only. It is not a psychological assessment, ' +
      'not a diagnosis, and not a substitute for a qualified professional.'
    );
    var noteLines = doc.setFont('times', 'italic').setFontSize(9.5).splitTextToSize(note, width);
    ensureSpace(noteLines.length * 4.4 + 6);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(noteLines, x, y);

    return doc;
  }

  function filename(now) {
    return 'psyche-mirror-reflection-' + isoDate(now || new Date()) + '.pdf';
  }

  root.PsychePDF = { build: build, filename: filename, plain: plain };
})(typeof self !== 'undefined' ? self : this);
