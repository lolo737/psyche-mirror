/*
 * PSYCHE MIRROR — local persistence.
 *
 * Progress is kept only in the visitor's own browser (localStorage), under a
 * single key. Every access is wrapped in try/catch: private windows, blocked
 * site data or a full quota simply mean progress is not remembered — the
 * mirror still works.
 *
 * The storage object is injected, so the same code runs against
 * window.localStorage in the browser and an in-memory fake under node:test.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./scoring.js'));
  } else {
    root.PsycheStorage = factory(root.PsycheScoring);
  }
})(typeof self !== 'undefined' ? self : this, function (Scoring) {
  'use strict';

  var STORAGE_KEY = 'psyche-mirror:v1';
  var VERSION = 1;

  function emptyState() {
    return { version: VERSION, answers: {}, activeRealm: null, updatedAt: null };
  }

  /** Collect the set of legitimate item ids and realm ids. */
  function index(realms) {
    var items = {};
    var realmIds = {};
    realms.forEach(function (realm) {
      realmIds[realm.id] = true;
      realm.items.forEach(function (item) {
        items[item.id] = true;
      });
    });
    return { items: items, realms: realmIds };
  }

  /**
   * Clean an untrusted object (e.g. parsed from storage) into a valid state.
   * Unknown item ids and out-of-range answers are dropped.
   */
  function sanitise(raw, realms) {
    var state = emptyState();
    if (!raw || typeof raw !== 'object' || raw.version !== VERSION) return state;
    var idx = index(realms);

    if (raw.answers && typeof raw.answers === 'object') {
      Object.keys(raw.answers).forEach(function (id) {
        var v = raw.answers[id];
        if (Object.prototype.hasOwnProperty.call(idx.items, id) && Scoring.isValidAnswer(v)) {
          state.answers[id] = v;
        }
      });
    }
    if (typeof raw.activeRealm === 'string' && idx.realms[raw.activeRealm]) {
      state.activeRealm = raw.activeRealm;
    }
    if (typeof raw.updatedAt === 'string') state.updatedAt = raw.updatedAt;
    return state;
  }

  /** Load state; never throws. */
  function load(storage, realms) {
    try {
      if (!storage) return emptyState();
      var text = storage.getItem(STORAGE_KEY);
      if (!text) return emptyState();
      return sanitise(JSON.parse(text), realms);
    } catch (e) {
      return emptyState();
    }
  }

  /** Save state; returns true on success, false if storage is unavailable. */
  function save(storage, state, now) {
    try {
      if (!storage) return false;
      var copy = {
        version: VERSION,
        answers: state.answers || {},
        activeRealm: state.activeRealm || null,
        updatedAt: (now || new Date()).toISOString()
      };
      storage.setItem(STORAGE_KEY, JSON.stringify(copy));
      return true;
    } catch (e) {
      return false;
    }
  }

  /** Remove everything PSYCHE MIRROR has stored; returns true on success. */
  function clear(storage) {
    try {
      if (!storage) return false;
      storage.removeItem(STORAGE_KEY);
      return true;
    } catch (e) {
      return false;
    }
  }

  /** Safely obtain window.localStorage (merely touching it can throw). */
  function browserStorage() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      var probe = STORAGE_KEY + ':probe';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      return window.localStorage;
    } catch (e) {
      return null;
    }
  }

  return {
    STORAGE_KEY: STORAGE_KEY,
    VERSION: VERSION,
    emptyState: emptyState,
    sanitise: sanitise,
    load: load,
    save: save,
    clear: clear,
    browserStorage: browserStorage
  };
});
