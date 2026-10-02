// End-to-end check against a real Postgres: collector rows in, matchup page numbers out.
// Runs only when TEST_DATABASE_URL points at a throwaway database.
import assert from "node:assert/strict";
import { test } from "node:test";
import type { Champion } from "../src/lib/types";
import { buildFixture, TEST_ITEMS } from "./fixtures";
import { parseMatch } from "./parse";

const url = process.env.TEST_DATABASE_URL;
const ahri: Champion = { id: "Ahri", key: "103", name: "Ahri", slug: "ahri", tags: ["Mage"] };
const zed: Champion = { id: "Zed", key: "238", name: "Zed", slug: "zed", tags: ["Assassin"] };
const filters = { rank: "emerald_plus", region: "euw", patch: "16.19" };

test("matchup numbers come from collected games", { skip: !url }, async (t) => {
  process.env.DATABASE_URL = url;
  const { getSql } = await import("../src/lib/db");
  const { migrate } = await import("./migrate");
  const { saveMatch } = await import("./store");
  const { getRealMatchup } = await import("../src/lib/db-matchup");
  const sql = getSql()!;
  t.after(() => sql.end());

  await sql`drop table if exists participants, matches, players, collector_state, skipped_matches cascade`;
  await migrate();

  // 30 Ahri vs Zed games (Ahri wins 18, buys Seeker's in the first 15),
  // and 30 Ahri vs Syndra games without Seeker's.
  for (let n = 0; n < 60; n++) {
    const vsZed = n < 30;
    const champions = [122, 64, 103, 222, 412, 86, 104, vsZed ? 238 : 134, 51, 117];
    const { match, timeline } = buildFixture({
      matchId: `EUW1_${n}`,
      champions,
      blueWins: n % 5 < 3,
      midBuysSeekers: vsZed && n < 15,
    });
    const parsed = parseMatch(match, timeline, 6, TEST_ITEMS)!;
    await saveMatch(sql, parsed.match, parsed.participants);
    await saveMatch(sql, parsed.match, parsed.participants); // duplicates are ignored
  }

  const data = await getRealMatchup(ahri, zed, "mid", filters);
  assert.ok(data && "champion" in data, "enough games for real data");
  assert.equal(data.isSample, false);
  assert.equal(data.games, 30);
  assert.equal(data.self.winRate, 60);
  assert.equal(data.enemy.winRate, 40);
  assert.equal(data.self.csAt10, 80);
  assert.equal(data.enemy.csAt10, 70);
  assert.equal(data.self.goldAt15 - data.enemy.goldAt15, 450);
  assert.equal(data.self.soloKillRate, 100);
  assert.equal(data.runePages[0].label, "Most Popular");
  assert.equal(data.runePages[0].primary[0].id, 8112);
  assert.equal(data.runePages[0].shards[0].name, "Attack Speed");
  assert.equal(data.spells[0].spells[0].name, "Flash");
  assert.deepEqual(data.skillOrders[0].maxOrder, ["Q", "W", "E"]);
  assert.deepEqual(data.startingItems[0].items.map((i) => i.id), [1056]);
  const step = (label: string) => data.build.find((s) => s.label === label)!;
  assert.equal(step("İlk item").options[0].item.id, 6655);
  assert.equal(step("Ayakkabı").options[0].item.id, 3020);

  const seekers = data.itemTimings.find((t) => t.item.id === 2420)!;
  assert.equal(seekers.avgSeconds, 415);
  assert.equal(seekers.firstRecallRate, 50);

  // Seeker's is bought by half of Ahri players against Zed but a quarter overall.
  assert.equal(data.insights[0].item.id, 2420);
  assert.equal(data.insights[0].withItem.games, 15);
  assert.equal(data.insights[0].withoutItem.games, 15);

  // Other filters have no games.
  const kr = await getRealMatchup(ahri, zed, "mid", { ...filters, region: "kr" });
  assert.deepEqual(kr, { games: 0 });
  const challenger = await getRealMatchup(ahri, zed, "mid", { ...filters, rank: "challenger" });
  assert.deepEqual(challenger, { games: 0 });
});
