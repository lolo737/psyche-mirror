/*
 * PSYCHE MIRROR — chart configuration shared by the page and the PDF.
 * Two themes: "night" for the screen, "parchment" for the printed PDF.
 */
(function (root) {
  'use strict';

  var THEMES = {
    night: {
      text: '#efe4cf',
      muted: '#c9b9a0',
      grid: 'rgba(201, 185, 160, 0.18)',
      angle: 'rgba(232, 182, 90, 0.35)',
      line: '#e8b65a',
      fill: 'rgba(232, 182, 90, 0.22)',
      point: '#f6d58e',
      bars: ['#e8b65a', '#d98a44', '#c4572e', '#b0404a', '#8e1f2b'],
      barBorder: '#f6d58e'
    },
    parchment: {
      text: '#2a1a12',
      muted: '#5a4232',
      grid: 'rgba(90, 66, 50, 0.25)',
      angle: 'rgba(90, 66, 50, 0.35)',
      line: '#8e1f2b',
      fill: 'rgba(142, 31, 43, 0.18)',
      point: '#8e1f2b',
      bars: ['#a8742a', '#a35a2c', '#9a4329', '#8e2f32', '#6e1720'],
      barBorder: '#2a1a12'
    }
  };

  function reducedMotion() {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
      return false;
    }
  }

  function labels(results) {
    return results.map(function (r) {
      return r.name.replace(/^The /, '');
    });
  }

  function values(results) {
    return results.map(function (r) {
      return r.scored ? r.percent : null;
    });
  }

  function font(size, family) {
    return { family: family || "'EB Garamond', Georgia, serif", size: size };
  }

  function radarConfig(results, themeName, opts) {
    var t = THEMES[themeName];
    opts = opts || {};
    return {
      type: 'radar',
      data: {
        labels: labels(results),
        datasets: [{
          label: 'Score (0\u2013100)',
          data: values(results),
          borderColor: t.line,
          backgroundColor: t.fill,
          pointBackgroundColor: t.point,
          pointBorderColor: t.line,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2,
          spanGaps: true
        }]
      },
      options: {
        responsive: !opts.static,
        maintainAspectRatio: false,
        animation: opts.static || reducedMotion() ? false : { duration: 900 },
        devicePixelRatio: opts.pixelRatio || undefined,
        scales: {
          r: {
            min: 0, max: 100,
            // Tick numbers are left off the radar to keep the pentacle legible; the bar chart carries the scale.
            ticks: { stepSize: 20, display: false },
            grid: { color: t.grid },
            angleLines: { color: t.angle },
            pointLabels: { color: t.text, padding: 10, font: font(opts.labelSize || 14, "'Cinzel', Georgia, serif") }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: !opts.static }
        }
      }
    };
  }

  function barConfig(results, themeName, opts) {
    var t = THEMES[themeName];
    opts = opts || {};
    return {
      type: 'bar',
      data: {
        labels: labels(results),
        datasets: [{
          label: 'Score (0\u2013100)',
          data: values(results),
          backgroundColor: t.bars,
          borderColor: t.barBorder,
          borderWidth: 1,
          borderRadius: 3,
          maxBarThickness: 56
        }]
      },
      options: {
        responsive: !opts.static,
        maintainAspectRatio: false,
        animation: opts.static || reducedMotion() ? false : { duration: 900 },
        devicePixelRatio: opts.pixelRatio || undefined,
        scales: {
          y: {
            min: 0, max: 100,
            ticks: { stepSize: 20, color: t.muted, font: font(opts.tickSize || 12) },
            grid: { color: t.grid }
          },
          x: {
            ticks: { color: t.text, font: font(opts.labelSize || 13, "'Cinzel', Georgia, serif") },
            grid: { display: false }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: !opts.static }
        }
      }
    };
  }

  /** Render a chart off-screen and return a PNG data URL (used by the PDF). */
  function renderToImage(config, width, height) {
    var holder = document.createElement('div');
    holder.setAttribute('aria-hidden', 'true');
    holder.style.cssText = 'position:fixed;left:-10000px;top:0;width:' + width + 'px;height:' + height + 'px;';
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    holder.appendChild(canvas);
    document.body.appendChild(holder);
    var chart = new window.Chart(canvas.getContext('2d'), config);
    var url = chart.toBase64Image('image/png', 1);
    chart.destroy();
    document.body.removeChild(holder);
    return url;
  }

  root.PsycheCharts = {
    THEMES: THEMES,
    radarConfig: radarConfig,
    barConfig: barConfig,
    renderToImage: renderToImage
  };
})(typeof self !== 'undefined' ? self : this);
