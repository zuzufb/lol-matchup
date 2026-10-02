import { aggregate, type BaselineRates, type GameRow } from "./aggregate";
import { positionOf, regionPlatform, tierRange, type LaneSlug } from "./constants";
import { getSql } from "./db";
import { getItems, getRuneData } from "./ddragon";
import type { Champion, Filters, MatchupData } from "./types";

/** Below this many games the page falls back to sample data. */
export const MIN_REAL_GAMES = 20;

/** Real matchup numbers from the database, or the number of games found if too few. */
export async function getRealMatchup(
  champion: Champion,
  opponent: Champion,
  lane: LaneSlug,
  filters: Filters,
): Promise<MatchupData | { games: number } | null> {
  const sql = getSql();
  if (!sql) return null;

  const position = positionOf(lane);
  const platform = regionPlatform(filters.region);
  const [minTier, maxTier] = tierRange(filters.rank);
  const championId = Number(champion.key);
  const opponentId = Number(opponent.key);

  const rows = await sql<GameRow[]>`
    select
      p.win, p.kills, p.deaths, p.assists, p.cs, p.cs10, p.cs15, p.gold10, p.gold15,
      p.first_blood, p.solo_kills, p.spells, p.primary_style, p.sub_style, p.perks, p.shards,
      p.start_items, p.first_back, p.core_items, p.boots, p.skill_order, p.max_order, p.purchases,
      m.duration_s,
      json_build_object(
        'win', o.win, 'kills', o.kills, 'deaths', o.deaths, 'assists', o.assists, 'cs', o.cs,
        'cs10', o.cs10, 'cs15', o.cs15, 'gold10', o.gold10, 'gold15', o.gold15,
        'first_blood', o.first_blood, 'solo_kills', o.solo_kills
      ) as opponent
    from participants p
    join matches m on m.match_id = p.match_id
    join participants o
      on o.match_id = p.match_id and o.position = p.position and o.team_id <> p.team_id
    where p.champion_id = ${championId}
      and o.champion_id = ${opponentId}
      and p.position = ${position}
      and m.platform = ${platform}
      and m.patch = ${filters.patch}
      and m.tier between ${minTier} and ${maxTier}`;

  if (rows.length < MIN_REAL_GAMES) return { games: rows.length };

  // How often the champion buys each item before 15:00 against everyone,
  // so the page can point out what changes in this specific matchup.
  const baselineRows = await sql<{ item: string; share: number }[]>`
    with games as (
      select p.purchases
      from participants p
      join matches m on m.match_id = p.match_id
      where p.champion_id = ${championId}
        and p.position = ${position}
        and m.platform = ${platform}
        and m.patch = ${filters.patch}
        and m.tier between ${minTier} and ${maxTier}
    )
    select e.key as item, 100.0 * count(*) / (select count(*) from games) as share
    from games, jsonb_each_text(games.purchases) e
    where e.value::int < 900
    group by e.key`;
  const baseline: BaselineRates = Object.fromEntries(baselineRows.map((r) => [r.item, Number(r.share)]));

  const [items, runes] = await Promise.all([getItems(), getRuneData()]);
  const names = {
    item: (id: number) => items[id]?.name ?? `Item ${id}`,
    rune: (id: number) => runes.names[id] ?? `Rune ${id}`,
  };

  return {
    champion,
    opponent,
    lane,
    filters,
    isSample: false,
    ...aggregate(rows, names, baseline, opponent.name),
  };
}
