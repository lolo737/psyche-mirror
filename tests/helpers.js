'use strict';

/** A minimal in-memory stand-in for window.localStorage. */
class MemoryStorage {
  constructor() { this.map = new Map(); }
  getItem(k) { return this.map.has(k) ? this.map.get(k) : null; }
  setItem(k, v) { this.map.set(k, String(v)); }
  removeItem(k) { this.map.delete(k); }
  clear() { this.map.clear(); }
}

/** A storage whose every method throws, like Safari private mode or blocked cookies. */
class HostileStorage {
  getItem() { throw new Error('SecurityError'); }
  setItem() { throw new Error('QuotaExceededError'); }
  removeItem() { throw new Error('SecurityError'); }
}

/** Build an answers map giving every item in a realm the same raw answer. */
function answerAll(realm, value) {
  const out = {};
  realm.items.forEach((item) => { out[item.id] = value; });
  return out;
}

/** Answers that push every item towards the high (or low) end after keying. */
function answerKeyed(realm, direction) {
  const out = {};
  realm.items.forEach((item) => {
    const high = item.keyed === '+' ? 5 : 1;
    out[item.id] = direction === 'high' ? high : 6 - high;
  });
  return out;
}

module.exports = { MemoryStorage, HostileStorage, answerAll, answerKeyed };
