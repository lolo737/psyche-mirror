/*
 * PSYCHE MIRROR — the page itself.
 * Renders the five realms as accessible tabs, records answers locally,
 * and draws the reflection. Nothing here talks to a network.
 */
(function () {
  'use strict';

  var REALMS = window.PsycheRealms.REALMS;
  var LIKERT = window.PsycheRealms.LIKERT;
  var Scoring = window.PsycheScoring;
  var Store = window.PsycheStorage;
  var Charts = window.PsycheCharts;

  var RESULTS_ID = 'results';
  var storage = Store.browserStorage();
  var state = Store.load(storage, REALMS);
  var charts = { radar: null, bar: null };

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') node.textContent = attrs[k];
      else if (k === 'className') node.className = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  /* ---------------------------------------------------------- rendering */

  function renderTabs() {
    var list = $('#tablist');
    REALMS.forEach(function (realm) {
      list.appendChild(el('button', {
        type: 'button', role: 'tab', id: 'tab-' + realm.id, className: 'tab',
        'aria-controls': 'panel-' + realm.id, 'aria-selected': 'false', tabindex: '-1',
        'data-target': realm.id
      }, [
        el('span', { className: 'tab__numeral', 'aria-hidden': 'true', text: realm.numeral }),
        el('span', { className: 'tab__name', text: realm.name.replace(/^The /, '') }),
        el('span', { className: 'tab__count', id: 'count-' + realm.id, text: '0/10' })
      ]));
    });
    list.appendChild(el('button', {
      type: 'button', role: 'tab', id: 'tab-results', className: 'tab tab--results',
      'aria-controls': 'panel-results', 'aria-selected': 'false', tabindex: '-1',
      'data-target': RESULTS_ID
    }, [
      el('span', { className: 'tab__numeral', 'aria-hidden': 'true', text: '\u2726' }),
      el('span', { className: 'tab__name', text: 'Reflection' }),
      el('span', { className: 'tab__count', text: 'results' })
    ]));
  }

  function renderPanels() {
    var host = $('#panels');
    REALMS.forEach(function (realm, rIndex) {
      var items = el('ol', { className: 'items' });
      realm.items.forEach(function (item, i) {
        var scale = el('div', { className: 'scale' });
        LIKERT.forEach(function (opt) {
          var input = el('input', {
            type: 'radio', name: item.id, value: String(opt.value), id: item.id + '-' + opt.value
          });
          if (state.answers[item.id] === opt.value) input.checked = true;
          scale.appendChild(el('label', { for: item.id + '-' + opt.value }, [
            input,
            el('span', { className: 'wick', 'aria-hidden': 'true' }),
            el('span', { text: opt.label })
          ]));
        });
        items.appendChild(el('li', { className: 'item' }, [
          el('fieldset', {}, [
            el('legend', {}, [
              el('span', { className: 'item__num', 'aria-hidden': 'true', text: String(i + 1) }),
              el('span', { text: item.text })
            ]),
            scale
          ])
        ]));
      });

      var prev = rIndex > 0 ? REALMS[rIndex - 1] : null;
      var next = rIndex < REALMS.length - 1 ? REALMS[rIndex + 1] : null;
      var nav = el('div', { className: 'panel__nav' }, [
        prev
          ? el('button', { type: 'button', className: 'btn btn--ghost', 'data-go': prev.id, text: '\u2190 ' + prev.name })
          : el('span'),
        el('button', {
          type: 'button', className: 'btn btn--primary',
          'data-go': next ? next.id : RESULTS_ID,
          text: next ? next.name + ' \u2192' : 'Gaze into the mirror \u2192'
        })
      ]);

      host.appendChild(el('section', {
        className: 'panel', id: 'panel-' + realm.id, role: 'tabpanel',
        'aria-labelledby': 'tab-' + realm.id, tabindex: '0', hidden: ''
      }, [
        el('header', { className: 'panel__header' }, [
          el('p', { className: 'panel__numeral', 'aria-hidden': 'true', text: 'Realm ' + realm.numeral }),
          el('h2', { className: 'panel__title', text: realm.name }),
          el('p', { className: 'panel__trait', text: realm.trait }),
          el('p', { className: 'panel__invitation', text: realm.invitation })
        ]),
        el('p', { className: 'visually-hidden', text: 'For each statement, choose how accurately it describes you as you generally are now.' }),
        items,
        nav
      ]));
    });
  }

  /* ---------------------------------------------------------- tabs */

  function tabs() { return $$('[role="tab"]', $('#tablist')); }

  function selectTab(target, opts) {
    opts = opts || {};
    tabs().forEach(function (tab) {
      var on = tab.getAttribute('data-target') === target;
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;
      if (on && opts.focusTab) tab.focus();
    });
    $$('[role="tabpanel"]').forEach(function (p) {
      p.hidden = p.id !== 'panel-' + target;
    });
    if (target === RESULTS_ID) renderResults();
    state.activeRealm = target === RESULTS_ID ? null : target;
    persist();
    if (opts.scroll) {
      var top = $('.tabs-wrap').getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      var panel = document.getElementById('panel-' + target);
      if (panel) panel.focus({ preventScroll: true });
    }
  }

  function onTabKeydown(e) {
    var list = tabs();
    var i = list.indexOf(document.activeElement);
    if (i < 0) return;
    var next = null;
    if (e.key === 'ArrowRight') next = list[(i + 1) % list.length];
    else if (e.key === 'ArrowLeft') next = list[(i - 1 + list.length) % list.length];
    else if (e.key === 'Home') next = list[0];
    else if (e.key === 'End') next = list[list.length - 1];
    if (next) {
      e.preventDefault();
      selectTab(next.getAttribute('data-target'), { focusTab: true });
    }
  }

  /* ---------------------------------------------------------- state */

  function persist() { Store.save(storage, state); }

  function updateProgress() {
    var p = Scoring.progress(REALMS, state.answers);
    $('#progress-text').textContent = p.answered + ' of ' + p.total;
    $('#progress-fill').style.width = p.percent + '%';
    var bar = $('#progress-bar');
    bar.setAttribute('aria-valuenow', String(p.percent));
    bar.setAttribute('aria-valuetext', p.answered + ' of ' + p.total + ' statements answered');

    Scoring.scoreAll(REALMS, state.answers).forEach(function (r) {
      var c = document.getElementById('count-' + r.id);
      c.textContent = r.answered + '/' + r.total;
      c.parentNode.classList.toggle('tab--done', r.complete);
      c.parentNode.setAttribute('aria-label', r.name + ', ' + r.answered + ' of ' + r.total + ' answered');
    });
  }

  function onAnswer(e) {
    var t = e.target;
    if (!t || t.type !== 'radio') return;
    var v = parseInt(t.value, 10);
    if (!Scoring.isValidAnswer(v)) return;
    state.answers[t.name] = v;
    $('#announce').textContent = '';
    persist();
    updateProgress();
  }

  /* ---------------------------------------------------------- results */

  function prefersReducedMotion() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  }

  function currentResults() { return Scoring.scoreAll(REALMS, state.answers); }

  function renderResults() {
    var results = currentResults();
    var ready = Scoring.anyScored(results);
    $('#results-empty').hidden = ready;
    $('#results').hidden = !ready;
    $('#btn-pdf').disabled = !ready || !window.jspdf;
    if (!ready) { destroyCharts(); return; }

    // table
    var tbody = $('#score-table tbody');
    tbody.textContent = '';
    results.forEach(function (r) {
      tbody.appendChild(el('tr', {}, [
        el('th', { scope: 'row', text: r.name }),
        el('td', { text: r.trait }),
        el('td', { text: r.scored ? String(r.percent) : '\u2014' }),
        el('td', { text: r.scored ? window.PsycheRealms.BAND_NAMES[r.band].label + (r.provisional ? ' (provisional)' : '') : 'Unscored' }),
        el('td', { text: r.answered + ' / ' + r.total })
      ]));
    });

    // readings
    var host = $('#readings');
    host.textContent = '';
    results.forEach(function (r, i) {
      var realm = REALMS[i];
      if (r.scored) {
        var band = realm.bands[r.band];
        host.appendChild(el('article', { className: 'reading' }, [
          el('h3', { text: realm.numeral + '. ' + realm.name + ' \u2014 ' + realm.trait }),
          el('p', { className: 'reading__band', text: band.title + ' \u00b7 ' + r.percent + '/100' }),
          el('p', { text: band.text }),
          r.provisional
            ? el('p', { className: 'reading__meta', text: 'Provisional: drawn from ' + r.answered + ' of ' + r.total + ' statements.' })
            : null
        ]));
      } else {
        host.appendChild(el('article', { className: 'reading reading--unscored' }, [
          el('h3', { text: realm.numeral + '. ' + realm.name + ' \u2014 ' + realm.trait }),
          el('p', { className: 'reading__meta', text: 'The glass is dark here: answer at least ' + Scoring.minimumAnswered(realm) + ' of ' + r.total + ' statements (' + r.answered + ' so far).' })
        ]));
      }
    });

    drawCharts(results);
  }

  function destroyCharts() {
    if (charts.radar) { charts.radar.destroy(); charts.radar = null; }
    if (charts.bar) { charts.bar.destroy(); charts.bar = null; }
  }

  function drawCharts(results) {
    if (!window.Chart) return;
    destroyCharts();
    window.Chart.defaults.font.family = "'EB Garamond', Georgia, serif";
    charts.radar = new window.Chart($('#radar-chart'), Charts.radarConfig(results, 'night'));
    charts.bar = new window.Chart($('#bar-chart'), Charts.barConfig(results, 'night'));
    var summary = results.map(function (r) {
      return r.name + ' ' + (r.scored ? r.percent + ' out of 100' : 'unscored');
    }).join('; ');
    $('#radar-chart').setAttribute('aria-label', 'Radar chart of your realm scores: ' + summary);
    $('#bar-chart').setAttribute('aria-label', 'Bar chart of your realm scores: ' + summary);
  }

  function status(msg) {
    var s = $('#status');
    s.textContent = msg;
  }

  function exportPdf() {
    var results = currentResults();
    if (!Scoring.anyScored(results) || !window.jspdf) return;
    try {
      var images = {
        radar: Charts.renderToImage(Charts.radarConfig(results, 'parchment', { static: true, pixelRatio: 1, labelSize: 22, tickSize: 16 }), 800, 800),
        bar: Charts.renderToImage(Charts.barConfig(results, 'parchment', { static: true, pixelRatio: 1, labelSize: 20, tickSize: 18 }), 800, 800)
      };
      var now = new Date();
      var doc = window.PsychePDF.build(window.jspdf.jsPDF, REALMS, results, images, now);
      doc.save(window.PsychePDF.filename(now));
      status('Your reflection has been sealed. Check your downloads.');
    } catch (e) {
      status('The seal would not take \u2014 the PDF could not be made in this browser.');
    }
  }

  /* ---------------------------------------------------------- reset */

  function doReset() {
    Store.clear(storage);
    state = Store.emptyState();
    $$('input[type="radio"]').forEach(function (i) { i.checked = false; });
    updateProgress();
    destroyCharts();
    status('');
    selectTab(REALMS[0].id, { scroll: true });
    // selectTab persists the active tab; clear again so nothing at all is left behind.
    Store.clear(storage);
    // The results panel (and its status line) is now hidden, so announce via the page-level region.
    var note = $('#announce');
    note.textContent = '';
    window.setTimeout(function () {
      note.textContent = 'Every candle snuffed. Your answers are gone from this browser.';
    }, 50);
  }

  function onReset() {
    var dlg = $('#confirm-reset');
    if (dlg && typeof dlg.showModal === 'function') {
      dlg.returnValue = '';
      dlg.showModal();
    } else if (window.confirm('Clear all your answers from this browser? This cannot be undone.')) {
      doReset();
    }
  }

  /* ---------------------------------------------------------- support */

  function setupSupport() {
    var link = (window.PSYCHE_CONFIG && window.PSYCHE_CONFIG.stripePaymentLink) || '';
    if (/^https:\/\/(buy|donate)\.stripe\.com\/[A-Za-z0-9_\-/]+$/.test(link)) {
      $('#support-link').href = link;
      $('#support').hidden = false;
    }
  }

  /* ---------------------------------------------------------- boot */

  function init() {
    renderTabs();
    renderPanels();
    updateProgress();
    setupSupport();

    $('#tablist').addEventListener('click', function (e) {
      var tab = e.target.closest('[role="tab"]');
      if (tab) selectTab(tab.getAttribute('data-target'));
    });
    $('#tablist').addEventListener('keydown', onTabKeydown);
    $('#panels').addEventListener('change', onAnswer);
    $('#panels').addEventListener('click', function (e) {
      var go = e.target.closest('[data-go]');
      if (go) selectTab(go.getAttribute('data-go'), { scroll: true });
    });
    $('#btn-pdf').addEventListener('click', exportPdf);
    $('#btn-reset').addEventListener('click', onReset);
    var dlg = $('#confirm-reset');
    if (dlg) {
      dlg.addEventListener('close', function () {
        if (dlg.returnValue === 'confirm') doReset();
      });
    }

    var start = state.activeRealm || REALMS[0].id;
    if (/^#reflection$/.test(window.location.hash)) start = RESULTS_ID;
    selectTab(start);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
