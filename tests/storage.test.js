'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { REALMS } = require('../public/js/realms.js');
const Store = require('../public/js/storage.js');
const { MemoryStorage, HostileStorage } = require('./helpers.js');

const FIXED = new Date('2026-10-31T23:00:00.000Z');

test('load: empty storage gives a fresh empty state', () => {
  const s = Store.load(new MemoryStorage(), REALMS);
  assert.deepEqual(s, Store.emptyState());
});

test('save then load round-trips answers and the active realm', () => {
  const storage = new MemoryStorage();
  const state = { answers: { lan01: 5, clk02: 1, poo10: 3 }, activeRealm: 'clockwork' };
  assert.equal(Store.save(storage, state, FIXED), true);

  const raw = JSON.parse(storage.getItem(Store.STORAGE_KEY));
  assert.equal(raw.version, Store.VERSION);
  assert.equal(raw.updatedAt, FIXED.toISOString());

  const loaded = Store.load(storage, REALMS);
  assert.deepEqual(loaded.answers, state.answers);
  assert.equal(loaded.activeRealm, 'clockwork');
  assert.equal(loaded.updatedAt, FIXED.toISOString());
});

test('load: corrupt JSON is ignored, not thrown', () => {
  const storage = new MemoryStorage();
  storage.setItem(Store.STORAGE_KEY, '{not json');
  assert.deepEqual(Store.load(storage, REALMS), Store.emptyState());
});

test('load: a different schema version is discarded', () => {
  const storage = new MemoryStorage();
  storage.setItem(Store.STORAGE_KEY, JSON.stringify({ version: 99, answers: { lan01: 5 } }));
  assert.deepEqual(Store.load(storage, REALMS).answers, {});
});

test('load: unknown items, out-of-range values and bogus realms are stripped', () => {
  const storage = new MemoryStorage();
  storage.setItem(Store.STORAGE_KEY, JSON.stringify({
    version: 1,
    answers: { lan01: 4, lan02: 0, lan03: 6, lan04: '5', lan05: 2.5, nope: 3, __proto__x: 3, toString: 2 },
    activeRealm: 'attic'
  }));
  const s = Store.load(storage, REALMS);
  assert.deepEqual(s.answers, { lan01: 4 });
  assert.equal(s.activeRealm, null);
});

test('load: answers is not an object', () => {
  const storage = new MemoryStorage();
  storage.setItem(Store.STORAGE_KEY, JSON.stringify({ version: 1, answers: 'lots' }));
  assert.deepEqual(Store.load(storage, REALMS).answers, {});
});

test('clear removes stored progress', () => {
  const storage = new MemoryStorage();
  Store.save(storage, { answers: { lan01: 5 } }, FIXED);
  assert.equal(Store.clear(storage), true);
  assert.equal(storage.getItem(Store.STORAGE_KEY), null);
  assert.deepEqual(Store.load(storage, REALMS), Store.emptyState());
});

test('clear only touches the PSYCHE MIRROR key', () => {
  const storage = new MemoryStorage();
  storage.setItem('someone-else', 'keep me');
  Store.save(storage, { answers: { lan01: 5 } }, FIXED);
  Store.clear(storage);
  assert.equal(storage.getItem('someone-else'), 'keep me');
});

test('hostile storage (private mode / blocked): nothing throws, failures are reported', () => {
  const storage = new HostileStorage();
  assert.deepEqual(Store.load(storage, REALMS), Store.emptyState());
  assert.equal(Store.save(storage, { answers: { lan01: 5 } }), false);
  assert.equal(Store.clear(storage), false);
});

test('missing storage (null) degrades gracefully', () => {
  assert.deepEqual(Store.load(null, REALMS), Store.emptyState());
  assert.equal(Store.save(null, { answers: {} }), false);
  assert.equal(Store.clear(null), false);
});

test('browserStorage returns null outside a browser', () => {
  assert.equal(Store.browserStorage(), null);
});

test('emptyState returns a fresh object each time', () => {
  const a = Store.emptyState();
  a.answers.lan01 = 5;
  assert.deepEqual(Store.emptyState().answers, {});
});
