'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { REALMS, LIKERT } = require('../public/js/realms.js');
const S = require('../public/js/scoring.js');
const { answerAll, answerKeyed } = require('./helpers.js');

const realmById = (id) => REALMS.find((r) => r.id === id);

test('item bank: five realms of ten items, unique ids, valid keying, both directions present', () => {
  assert.equal(REALMS.length, 5);
  const ids = new Set();
  for (const realm of REALMS) {
    assert.equal(realm.items.length, 10, realm.id);
    assert.ok(realm.items.some((i) => i.keyed === '+'), `${realm.id} has a positively keyed item`);
    assert.ok(realm.items.some((i) => i.keyed === '-'), `${realm.id} has a reverse-keyed item`);
    for (const item of realm.items) {
      assert.ok(['+', '-'].includes(item.keyed), item.id);
      assert.ok(!ids.has(item.id), `duplicate id ${item.id}`);
      ids.add(item.id);
    }
    for (const band of ['low', 'mid', 'high']) {
      assert.ok(realm.bands[band].title && realm.bands[band].text, `${realm.id}.${band}`);
    }
  }
  assert.equal(ids.size, 50);
  assert.deepEqual(LIKERT.map((o) => o.value), [1, 2, 3, 4, 5]);
});

test('item bank: no clinical or diagnostic vocabulary anywhere in the realms', () => {
  const text = JSON.stringify(REALMS).toLowerCase();
  for (const word of ['adhd', 'autis', 'ptsd', 'depress', 'narcissis', 'disorder', 'diagnos', 'anxiety', 'bipolar']) {
    assert.ok(!text.includes(word), `found "${word}"`);
  }
});

test('scoreItem: positive keying passes the answer through', () => {
  const item = { id: 'x', keyed: '+' };
  for (const v of [1, 2, 3, 4, 5]) assert.equal(S.scoreItem(item, v), v);
});

test('scoreItem: reverse keying maps 1..5 to 5..1', () => {
  const item = { id: 'x', keyed: '-' };
  assert.deepEqual([1, 2, 3, 4, 5].map((v) => S.scoreItem(item, v)), [5, 4, 3, 2, 1]);
});

test('scoreItem: unanswered or invalid answers score null', () => {
  const item = { id: 'x', keyed: '+' };
  for (const bad of [undefined, null, 0, 6, 2.5, '3', NaN, -1]) {
    assert.equal(S.scoreItem(item, bad), null, String(bad));
  }
});

test('scoreItem: unknown keying is a programming error', () => {
  assert.throws(() => S.scoreItem({ id: 'x', keyed: '?' }, 3), /unknown keying/);
});

test('bandFor: thresholds at 40 and 60', () => {
  assert.equal(S.bandFor(0), 'low');
  assert.equal(S.bandFor(39), 'low');
  assert.equal(S.bandFor(39.99), 'low');
  assert.equal(S.bandFor(40), 'mid');
  assert.equal(S.bandFor(50), 'mid');
  assert.equal(S.bandFor(59), 'mid');
  assert.equal(S.bandFor(60), 'high');
  assert.equal(S.bandFor(100), 'high');
  assert.equal(S.bandFor(NaN), null);
  assert.equal(S.bandFor(undefined), null);
});

test('scoreRealm: all-high keyed answers give 100 / high, all-low give 0 / low', () => {
  for (const realm of REALMS) {
    const hi = S.scoreRealm(realm, answerKeyed(realm, 'high'));
    assert.equal(hi.percent, 100, realm.id);
    assert.equal(hi.band, 'high');
    assert.equal(hi.mean, 5);
    assert.equal(hi.complete, true);
    assert.equal(hi.provisional, false);

    const lo = S.scoreRealm(realm, answerKeyed(realm, 'low'));
    assert.equal(lo.percent, 0, realm.id);
    assert.equal(lo.band, 'low');
  }
});

test('scoreRealm: answering "3" everywhere is exactly the midpoint regardless of keying', () => {
  for (const realm of REALMS) {
    const r = S.scoreRealm(realm, answerAll(realm, 3));
    assert.equal(r.percent, 50);
    assert.equal(r.band, 'mid');
  }
});

test('scoreRealm: reverse-keyed items pull a straight-line "5" response towards the middle', () => {
  // The Lantern: 7 positive, 3 reverse. All 5s -> (7*5 + 3*1) / 10 = 3.8 -> 70%.
  const lantern = realmById('lantern');
  const r = S.scoreRealm(lantern, answerAll(lantern, 5));
  assert.equal(r.mean, 3.8);
  assert.equal(r.percent, 70);
  assert.equal(r.band, 'high');

  // The Still Pool: 2 positive, 8 reverse. All 5s -> (2*5 + 8*1) / 10 = 1.8 -> 20%.
  const pool = realmById('pool');
  const p = S.scoreRealm(pool, answerAll(pool, 5));
  assert.equal(p.mean, 1.8);
  assert.equal(p.percent, 20);
  assert.equal(p.band, 'low');
});

test('scoreRealm: a hand-worked mixed example', () => {
  const realm = {
    id: 't', name: 'Test', trait: 'Test',
    items: [
      { id: 'a', keyed: '+' }, { id: 'b', keyed: '-' },
      { id: 'c', keyed: '+' }, { id: 'd', keyed: '-' }
    ]
  };
  // a=4 -> 4, b=2 -> 4, c=3 -> 3, d=5 -> 1  => sum 12, mean 3.0 -> 50%
  const r = S.scoreRealm(realm, { a: 4, b: 2, c: 3, d: 5 });
  assert.equal(r.mean, 3);
  assert.equal(r.percent, 50);
  assert.equal(r.band, 'mid');
});

test('scoreRealm: band boundaries land where expected from real answers', () => {
  const realm = {
    id: 't', name: 'T', trait: 'T',
    items: Array.from({ length: 10 }, (_, i) => ({ id: 'i' + i, keyed: '+' }))
  };
  const answers = (values) => Object.fromEntries(values.map((v, i) => ['i' + i, v]));
  // mean 2.6 -> 40% -> mid (lower edge of mid)
  assert.deepEqual(
    pick(S.scoreRealm(realm, answers([3, 3, 3, 3, 3, 3, 2, 2, 2, 2]))),
    { percent: 40, band: 'mid' }
  );
  // mean 2.5 -> 37.5% -> rounds to 38 -> low
  assert.deepEqual(
    pick(S.scoreRealm(realm, answers([3, 3, 3, 3, 3, 2, 2, 2, 2, 2]))),
    { percent: 38, band: 'low' }
  );
  // mean 3.4 -> 60% -> high (lower edge of high)
  assert.deepEqual(
    pick(S.scoreRealm(realm, answers([4, 4, 4, 4, 3, 3, 3, 3, 3, 3]))),
    { percent: 60, band: 'high' }
  );
  // mean 3.3 -> 57.5% -> rounds to 58 -> mid
  assert.deepEqual(
    pick(S.scoreRealm(realm, answers([4, 4, 4, 3, 3, 3, 3, 3, 3, 3]))),
    { percent: 58, band: 'mid' }
  );
  function pick(r) { return { percent: r.percent, band: r.band }; }
});

test('partial completion: fewer than half answered is unscored, not guessed', () => {
  const realm = realmById('clockwork');
  const answers = {};
  realm.items.slice(0, 4).forEach((i) => { answers[i.id] = 5; });
  const r = S.scoreRealm(realm, answers);
  assert.equal(r.answered, 4);
  assert.equal(r.scored, false);
  assert.equal(r.percent, null);
  assert.equal(r.band, null);
  assert.equal(r.mean, null);
  assert.equal(r.provisional, false);
});

test('partial completion: half or more answered is scored over answered items and flagged provisional', () => {
  const realm = realmById('clockwork');
  // first five items: clk01 +, clk02 -, clk03 +, clk04 -, clk05 +
  const answers = { clk01: 5, clk02: 1, clk03: 5, clk04: 1, clk05: 5 };
  const r = S.scoreRealm(realm, answers);
  assert.equal(S.minimumAnswered(realm), 5);
  assert.equal(r.answered, 5);
  assert.equal(r.scored, true);
  assert.equal(r.provisional, true);
  assert.equal(r.complete, false);
  assert.equal(r.percent, 100);
  assert.equal(r.band, 'high');
});

test('partial completion: invalid stored values do not count as answers', () => {
  const realm = realmById('hearth');
  const answers = answerAll(realm, 4);
  answers.hea01 = 9;
  answers.hea02 = '4';
  const r = S.scoreRealm(realm, answers);
  assert.equal(r.answered, 8);
  assert.equal(r.provisional, true);
});

test('scoreRealm: no answers at all', () => {
  const r = S.scoreRealm(REALMS[0], undefined);
  assert.equal(r.answered, 0);
  assert.equal(r.scored, false);
});

test('scoreAll and progress across the whole mirror', () => {
  const answers = { ...answerAll(REALMS[0], 3), ...answerAll(REALMS[1], 3) };
  answers[REALMS[2].items[0].id] = 4;
  const results = S.scoreAll(REALMS, answers);
  assert.equal(results.length, 5);
  assert.deepEqual(results.map((r) => r.scored), [true, true, false, false, false]);
  assert.ok(S.anyScored(results));
  assert.ok(!S.anyScored(S.scoreAll(REALMS, {})));

  assert.deepEqual(S.progress(REALMS, answers), { answered: 21, total: 50, percent: 42 });
  assert.deepEqual(S.progress(REALMS, {}), { answered: 0, total: 50, percent: 0 });
});
