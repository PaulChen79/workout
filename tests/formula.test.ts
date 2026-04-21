import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  round25, estimate1RM, suggestWeight, updateProgression,
} from '../src/lib/formula';

test('round25 rounds to nearest 2.5', () => {
  assert.equal(round25(62), 62.5);
  assert.equal(round25(63.75), 65);    // halfway → round up
  assert.equal(round25(64.99), 65);
  assert.equal(round25(61.24), 60);
  assert.equal(round25(0), 0);
});

test('estimate1RM: reps=1 returns the weight', () => {
  assert.equal(estimate1RM(100, 1), 100);
});

test('estimate1RM: 2-5 reps use Epley', () => {
  assert.ok(Math.abs(estimate1RM(100, 5)! - 116.6667) < 0.01);
});

test('estimate1RM: 6-12 reps use Brzycki', () => {
  const v = estimate1RM(100, 10)!;
  assert.ok(Math.abs(v - 133.37) < 0.5);
});

test('estimate1RM: reps > 12 returns null', () => {
  assert.equal(estimate1RM(100, 13), null);
});

test('estimate1RM: reps <= 0 returns null', () => {
  assert.equal(estimate1RM(100, 0), null);
});

test('suggestWeight: trackable uses currentPct', () => {
  const w = suggestWeight({ trackable: true, oneRM: 100, currentPct: 0.8 });
  assert.equal(w, 80);
});

test('suggestWeight: trackable falls back to pctLow when no state', () => {
  const w = suggestWeight({ trackable: true, oneRM: 100, currentPct: null, pctLow: 0.65, pctHigh: 0.75 });
  assert.equal(w, 65);
});

test('suggestWeight: non-trackable uses lastWeight', () => {
  const w = suggestWeight({ trackable: false, lastWeight: 25 });
  assert.equal(w, 25);
});

test('suggestWeight: non-trackable dumbbell fallback from userWeight', () => {
  const w = suggestWeight({ trackable: false, lastWeight: null, equip: 'dumbbell', userWeight: 70 });
  // max(8, round(70*0.15 / 2) * 2) = max(8, round(5.25)*2) = max(8,10) = 10
  assert.equal(w, 10);
});

test('updateProgression: RIR 3+ AND all hit top → bump pct', () => {
  const out = updateProgression({
    sets: [{ done: true, reps: 5 }, { done: true, reps: 5 }],
    rir: 3,
    scheme: { pctLow: 0.8, pctHigh: 0.85, repLow: 3, repHigh: 5 },
    state: { currentPct: 0.80, streak: 0 },
  });
  assert.equal(out.currentPct, 0.825);
  assert.equal(out.streak, 0);
});

test('updateProgression: RIR 0 AND missed top → drop pct', () => {
  const out = updateProgression({
    sets: [{ done: true, reps: 3 }, { done: true, reps: 2 }],
    rir: 0,
    scheme: { pctLow: 0.8, pctHigh: 0.85, repLow: 3, repHigh: 5 },
    state: { currentPct: 0.85, streak: 0 },
  });
  assert.equal(out.currentPct, 0.825);
});

test('updateProgression: no RIR, all top — streak builds then bumps on second', () => {
  const scheme = { pctLow: 0.8, pctHigh: 0.85, repLow: 3, repHigh: 5 };
  const step1 = updateProgression({
    sets: [{ done: true, reps: 5 }, { done: true, reps: 5 }],
    rir: null, scheme, state: { currentPct: 0.80, streak: 0 },
  });
  assert.equal(step1.streak, 1);
  assert.equal(step1.currentPct, 0.80);
  const step2 = updateProgression({
    sets: [{ done: true, reps: 5 }, { done: true, reps: 5 }],
    rir: null, scheme, state: step1,
  });
  assert.equal(step2.streak, 0);
  assert.equal(step2.currentPct, 0.825);
});

test('updateProgression: caps at pctHigh', () => {
  const out = updateProgression({
    sets: [{ done: true, reps: 5 }, { done: true, reps: 5 }],
    rir: 4,
    scheme: { pctLow: 0.8, pctHigh: 0.85, repLow: 3, repHigh: 5 },
    state: { currentPct: 0.85, streak: 0 },
  });
  assert.equal(out.currentPct, 0.85);
});
