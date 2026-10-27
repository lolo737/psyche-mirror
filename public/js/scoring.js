/*
 * PSYCHE MIRROR — scoring.
 *
 * Pure functions, no DOM, no storage: easy to reason about, easy to test.
 *
 *   item score   = answer            for "+" keyed items
 *                = 6 − answer        for "−" (reverse) keyed items
 *   realm mean   = average item score over the items actually answered
 *   realm %      = (mean − 1) / 4 × 100, rounded to a whole number (0–100)
 *   band         = low  if % < 40
 *                  mid  if 40 ≤ % < 60
 *                  high if % ≥ 60
 *
 * Partial completion: a realm is scored once at least half of its items are
 * answered (5 of 10). Below that it is reported as "unscored" rather than
 * guessed at. A scored-but-incomplete realm is flagged `provisional`.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PsycheScoring = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var MIN_VALUE = 1;
  var MAX_VALUE = 5;
  var BAND_LOW_BELOW = 40; // percent < 40  -> low
  var BAND_HIGH_FROM = 60; // percent >= 60 -> high

  function isValidAnswer(value) {
    return (
      typeof value === 'number' &&
      Number.isInteger(value) &&
      value >= MIN_VALUE &&
      value <= MAX_VALUE
    );
  }

  /** Score a single item, applying reverse keying. Returns null if unanswered/invalid. */
  function scoreItem(item, answer) {
    if (!isValidAnswer(answer)) return null;
    if (item.keyed === '-') return MAX_VALUE + MIN_VALUE - answer;
    if (item.keyed === '+') return answer;
    throw new Error('Item ' + item.id + ' has an unknown keying: ' + item.keyed);
  }

  /** Map a 0–100 percentage to a band key. */
  function bandFor(percent) {
    if (typeof percent !== 'number' || Number.isNaN(percent)) return null;
    if (percent < BAND_LOW_BELOW) return 'low';
    if (percent >= BAND_HIGH_FROM) return 'high';
    return 'mid';
  }

  function minimumAnswered(realm) {
    return Math.ceil(realm.items.length / 2);
  }

  /** Score one realm against an answers map { itemId: 1..5 }. */
  function scoreRealm(realm, answers) {
    answers = answers || {};
    var total = realm.items.length;
    var answered = 0;
    var sum = 0;

    realm.items.forEach(function (item) {
      var s = scoreItem(item, answers[item.id]);
      if (s !== null) {
        answered += 1;
        sum += s;
      }
    });

    var scored = answered >= minimumAnswered(realm);
    var mean = answered > 0 ? sum / answered : null;
    // Integer arithmetic before the single division keeps .5 cases exact (no 57.4999… surprises).
    var percent = scored
      ? Math.round(((sum - answered * MIN_VALUE) * 100) / (answered * (MAX_VALUE - MIN_VALUE)))
      : null;

    return {
      id: realm.id,
      name: realm.name,
      trait: realm.trait,
      answered: answered,
      total: total,
      complete: answered === total,
      scored: scored,
      provisional: scored && answered < total,
      mean: scored ? Math.round(mean * 100) / 100 : null,
      percent: percent,
      band: scored ? bandFor(percent) : null
    };
  }

  /** Score every realm. */
  function scoreAll(realms, answers) {
    return realms.map(function (realm) {
      return scoreRealm(realm, answers);
    });
  }

  /** Overall progress across all realms. */
  function progress(realms, answers) {
    answers = answers || {};
    var total = 0;
    var answered = 0;
    realms.forEach(function (realm) {
      realm.items.forEach(function (item) {
        total += 1;
        if (isValidAnswer(answers[item.id])) answered += 1;
      });
    });
    return {
      answered: answered,
      total: total,
      percent: total ? Math.round((answered / total) * 100) : 0
    };
  }

  /** True when at least one realm has enough answers to be scored. */
  function anyScored(results) {
    return results.some(function (r) {
      return r.scored;
    });
  }

  return {
    MIN_VALUE: MIN_VALUE,
    MAX_VALUE: MAX_VALUE,
    BAND_LOW_BELOW: BAND_LOW_BELOW,
    BAND_HIGH_FROM: BAND_HIGH_FROM,
    isValidAnswer: isValidAnswer,
    scoreItem: scoreItem,
    bandFor: bandFor,
    minimumAnswered: minimumAnswered,
    scoreRealm: scoreRealm,
    scoreAll: scoreAll,
    progress: progress,
    anyScored: anyScored
  };
});
