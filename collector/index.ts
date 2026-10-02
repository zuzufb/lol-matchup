// Collects ranked solo queue games from Riot's API into Postgres.
//
//   npm run collect                      # EUW, runs for 50 minutes
//   npm run collect -- --minutes 5 --platform tr1
//
// Needs RIOT_API_KEY and DATABASE_URL in the environment (or .env.local).

import { parseArgs } from "node:util";
import { REGIONS, TIERS } from "../src/lib/constants";
import { getSql } from "../src/lib/db";
import { getItems } from "../src/lib/ddragon";
import { migrate } from "./migrate";
import { RANKED_SOLO_QUEUE, parseMatch } from "./parse";
import { RiotClient, RiotKeyError } from "./riot";
import type { RiotMatch, RiotTimeline } from "./riot-types";
import { getState, knownMatches, markSkipped, saveMatch, setState } from "./store";

const QUEUE = "RANKED_SOLO_5x5";
const LADDER_REFRESH_MS = 24 * 60 * 60 * 1000;
const HISTORY_WINDOW_S = 7 * 24 * 60 * 60;
const DIVISION_TIERS = ["GOLD", "PLATINUM", "EMERALD", "DIAMOND"];
const APEX_TIERS = ["master", "grandmaster", "challenger"];

interface LeagueEntry {
  puuid: string;
}

async function main() {
  const { values } = parseArgs({
    options: {
      minutes: { type: "string", default: "50" },
      platform: { type: "string", default: "euw1" },
    },
  });
  const platform = values.platform!;
  const region = REGIONS.find((r) => r.platform === platform);
  if (!region) throw new Error(`Bilinmeyen platform: ${platform}`);
  const deadline = Date.now() + Number(values.minutes) * 60_000;

  const apiKey = process.env.RIOT_API_KEY;
  const sql = getSql();
  if (!apiKey) throw new Error("RIOT_API_KEY tanımlı değil.");
  if (!sql) throw new Error("DATABASE_URL tanımlı değil.");

  await migrate();
  const items = await getItems();
  if (!Object.keys(items).length) throw new Error("Data Dragon item listesi alınamadı.");
  const riot = new RiotClient(apiKey);

  // 1. Refresh the list of ladder players once a day.
  const ladderKey = `ladder_refreshed:${platform}`;
  const lastRefresh = Number((await getState(sql, ladderKey)) ?? 0);
  if (Date.now() - lastRefresh > LADDER_REFRESH_MS) {
    let total = 0;
    const save = async (entries: LeagueEntry[], tier: string) => {
      const rows = entries
        .filter((e) => e.puuid)
        .map((e) => ({ puuid: e.puuid, platform, tier: TIERS.indexOf(tier as (typeof TIERS)[number]) }));
      if (!rows.length) return;
      await sql`
        insert into players ${sql(rows)}
        on conflict (puuid) do update set tier = excluded.tier, platform = excluded.platform`;
      total += rows.length;
    };
    for (const apex of APEX_TIERS) {
      const league = await riot.get<{ entries: LeagueEntry[] }>(platform, `/lol/league/v4/${apex}leagues/by-queue/${QUEUE}`);
      await save(league?.entries ?? [], apex.toUpperCase());
    }
    for (const tier of DIVISION_TIERS) {
      for (const division of ["I", "II", "III", "IV"]) {
        const entries = await riot.get<LeagueEntry[]>(platform, `/lol/league/v4/entries/${QUEUE}/${tier}/${division}?page=1`);
        await save(entries ?? [], tier);
      }
    }
    await setState(sql, ladderKey, String(Date.now()));
    console.log(`Ladder güncellendi: ${total} oyuncu.`);
  }

  // 2. Walk players' recent games until time runs out.
  let saved = 0;
  let skipped = 0;
  while (Date.now() < deadline) {
    const players = await sql<{ puuid: string; tier: number; last_checked: Date | null }[]>`
      select puuid, tier, last_checked from players
      where platform = ${platform}
      order by last_checked nulls first, random()
      limit 50`;
    if (!players.length) break;

    for (const player of players) {
      if (Date.now() >= deadline) break;
      const since = Math.max(
        Math.floor(Date.now() / 1000) - HISTORY_WINDOW_S,
        player.last_checked ? Math.floor(player.last_checked.getTime() / 1000) : 0,
      );
      const ids =
        (await riot.get<string[]>(
          region.routing,
          `/lol/match/v5/matches/by-puuid/${player.puuid}/ids?queue=${RANKED_SOLO_QUEUE}&type=ranked&startTime=${since}&count=20`,
        )) ?? [];
      await sql`update players set last_checked = now() where puuid = ${player.puuid}`;

      const known = await knownMatches(sql, ids);
      for (const id of ids) {
        if (known.has(id) || Date.now() >= deadline) continue;
        const match = await riot.get<RiotMatch>(region.routing, `/lol/match/v5/matches/${id}`);
        const timeline = match && (await riot.get<RiotTimeline>(region.routing, `/lol/match/v5/matches/${id}/timeline`));
        const parsed = match && timeline ? parseMatch(match, timeline, player.tier, items) : null;
        if (!parsed) {
          if (match) await markSkipped(sql, id);
          skipped++;
          continue;
        }
        await saveMatch(sql, parsed.match, parsed.participants);
        saved++;
        if (saved % 50 === 0) console.log(`${saved} maç kaydedildi (${riot.requests} istek)`);
      }
    }
  }

  const [{ count }] = await sql`select count(*)::int as count from matches where platform = ${platform}`;
  const summary = `${saved} yeni maç, ${skipped} atlandı, toplam ${count} maç (${platform}).`;
  // On GitHub Actions, also show it as an annotation on the run page.
  console.log(process.env.GITHUB_ACTIONS ? `::notice title=Toplama bitti::${summary}` : `Bitti: ${summary}`);
  await sql.end();
}

main().catch((err) => {
  console.error(err instanceof RiotKeyError ? err.message : err);
  process.exit(1);
});
