import assert from "node:assert/strict";
import { test } from "node:test";
import { buildFixture, TEST_ITEMS } from "./fixtures";
import { maxOrder, parseMatch } from "./parse";

test("parses a ranked game into match and participant rows", () => {
  const { match, timeline } = buildFixture({ matchId: "EUW1_1", midBuysSeekers: true });
  const parsed = parseMatch(match, timeline, 5, TEST_ITEMS)!;

  assert.deepEqual(parsed.match, {
    match_id: "EUW1_1",
    platform: "euw1",
    patch: "16.19",
    tier: 5,
    game_start: new Date(Date.UTC(2026, 9, 1)),
    duration_s: 1800,
  });
  assert.equal(parsed.participants.length, 10);

  const ahri = parsed.participants.find((p) => p.champion_id === 103)!;
  assert.equal(ahri.position, "MIDDLE");
  assert.equal(ahri.cs, 210);
  assert.equal(ahri.cs10, 80);
  assert.equal(ahri.cs15, 120);
  assert.equal(ahri.gold10, 3800);
  assert.equal(ahri.solo_kills, 1, "the assisted kill is not a solo kill");
  assert.equal(ahri.first_blood, true);
  assert.deepEqual(ahri.spells, [4, 14]);
  assert.deepEqual(ahri.perks, [8112, 8139, 8140, 8106, 8226, 8237]);
  assert.deepEqual(ahri.shards, [5005, 5008, 5001]);
  // Potions and wards are left out; the undone Boots purchase is removed.
  assert.deepEqual(ahri.start_items, [1056]);
  assert.deepEqual(ahri.first_back, [3802, 1001, 2420]);
  assert.deepEqual(ahri.core_items, [6655, 3157, 3089]);
  assert.equal(ahri.boots, 3020);
  assert.equal(ahri.skill_order, "QWEQQRQWQWRWWEEREE");
  assert.equal(ahri.max_order, "QWE");
  assert.equal(ahri.purchases["2420"], 415);
  assert.equal(ahri.purchases["1001"], 410);
});

test("skips remakes and other queues", () => {
  const short = buildFixture({ matchId: "EUW1_2", durationS: 200 });
  assert.equal(parseMatch(short.match, short.timeline, 5, TEST_ITEMS), null);
  const normals = buildFixture({ matchId: "EUW1_3", queueId: 400 });
  assert.equal(parseMatch(normals.match, normals.timeline, 5, TEST_ITEMS), null);
});

test("max order handles games that end before skills are maxed", () => {
  assert.equal(maxOrder("QWEQQRQEQ"), "QEW");
  assert.equal(maxOrder("EQWEERE"), "EQW");
});
