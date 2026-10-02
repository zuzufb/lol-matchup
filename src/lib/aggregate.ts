// Turns raw per-game rows for one matchup into the numbers the page shows.
// Pure functions, no database access, so they are easy to test.

import { STAT_SHARDS, SUMMONER_SPELLS } from "./constants";
import type {
  BuildStep,
  Choice,
  Item,
  ItemInsight,
  ItemSet,
  ItemTiming,
  Rune,
  RunePage,
  SideStats,
  SkillOrder,
  SpellPair,
} from "./types";

/** Stats of one player in one game (the champion's or the opponent's). */
export interface SideRow {
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  cs10: number | null;
  cs15: number | null;
  gold10: number | null;
  gold15: number | null;
  first_blood: boolean;
  solo_kills: number;
}

export interface GameRow extends SideRow {
  duration_s: number;
  spells: number[];
  primary_style: number;
  sub_style: number;
  perks: number[];
  shards: number[];
  start_items: number[];
  first_back: number[];
  core_items: number[];
  boots: number | null;
  skill_order: string;
  max_order: string;
  purchases: Record<string, number>;
  opponent: SideRow;
}

export interface Names {
  item: (id: number) => string;
  rune: (id: number) => string;
}

/** Item id with the share of all the champion's games in this lane that bought it before 15:00. */
export type BaselineRates = Record<string, number>;

export interface Aggregated {
  games: number;
  avgDurationSeconds: number;
  self: SideStats;
  enemy: SideStats;
  runePages: RunePage[];
  spells: SpellPair[];
  skillOrders: SkillOrder[];
  startingItems: ItemSet[];
  itemTimings: ItemTiming[];
  build: BuildStep[];
  insights: ItemInsight[];
}

const EARLY_S = 15 * 60;
const round = (n: number, digits = 1) => Math.round(n * 10 ** digits) / 10 ** digits;
const avg = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);
const rate = (part: number, total: number) => (total ? round((part / total) * 100) : 0);

function sideStats(rows: SideRow[]): SideStats {
  const known = (pick: (r: SideRow) => number | null) =>
    rows.map(pick).filter((v): v is number => v !== null);
  return {
    winRate: rate(rows.filter((r) => r.win).length, rows.length),
    kills: round(avg(rows.map((r) => r.kills))),
    deaths: round(avg(rows.map((r) => r.deaths))),
    assists: round(avg(rows.map((r) => r.assists))),
    cs: Math.round(avg(rows.map((r) => r.cs))),
    csAt10: round(avg(known((r) => r.cs10))),
    csAt15: round(avg(known((r) => r.cs15))),
    goldAt10: Math.round(avg(known((r) => r.gold10))),
    goldAt15: Math.round(avg(known((r) => r.gold15))),
    soloKillRate: rate(rows.filter((r) => r.solo_kills > 0).length, rows.length),
    firstBloodRate: rate(rows.filter((r) => r.first_blood).length, rows.length),
  };
}

interface Group<T> {
  key: string;
  value: T;
  rows: GameRow[];
}

/** Groups rows by key, most common first. */
function groupBy<T>(rows: GameRow[], pick: (r: GameRow) => T | null | undefined, key: (v: T) => string = String) {
  const groups = new Map<string, Group<T>>();
  for (const row of rows) {
    const value = pick(row);
    if (value === null || value === undefined) continue;
    const k = key(value);
    const group = groups.get(k) ?? { key: k, value, rows: [] };
    group.rows.push(row);
    groups.set(k, group);
  }
  return [...groups.values()].sort((a, b) => b.rows.length - a.rows.length);
}

function choiceOf(rows: GameRow[], total: number): Choice {
  return {
    games: rows.length,
    pickRate: rate(rows.length, total),
    winRate: rate(rows.filter((r) => r.win).length, rows.length),
  };
}

/** Enough games for a win rate to mean something. */
const minGames = (total: number) => Math.max(10, Math.round(total * 0.05));

export function aggregate(rows: GameRow[], names: Names, baseline: BaselineRates, opponentName: string): Aggregated {
  const total = rows.length;
  const item = (id: number): Item => ({ id, name: names.item(id) });
  const rune = (id: number): Rune => ({ id, name: STAT_SHARDS[id] ?? names.rune(id) });

  // Runes: whole pages, most popular plus the best-performing alternatives.
  const pageGroups = groupBy(
    rows,
    (r) => r,
    (r) => [r.primary_style, r.sub_style, ...r.perks, ...r.shards].join(","),
  ).slice(0, 8);
  const pages = pageGroups.map((g, k): RunePage => {
    const r = g.value;
    return {
      label: k === 0 ? "Most Popular" : "Alternative",
      primaryStyle: rune(r.primary_style),
      primary: r.perks.slice(0, 4).map(rune),
      secondaryStyle: rune(r.sub_style),
      secondary: r.perks.slice(4, 6).map(rune),
      shards: r.shards.map(rune),
      ...choiceOf(g.rows, total),
    };
  });
  const contenders = pages.slice(1).filter((p) => p.games >= minGames(total));
  const best = contenders.reduce<RunePage | null>((b, p) => (!b || p.winRate > b.winRate ? p : b), null);
  if (best && best.winRate > pages[0].winRate) best.label = "Highest Win Rate";
  const runePages = [pages[0], ...(best ? [best] : []), ...pages.slice(1).filter((p) => p !== best)]
    .filter(Boolean)
    .slice(0, 4);

  const spells = groupBy(rows, (r) => r.spells, (s) => s.join(","))
    .slice(0, 3)
    .map(
      (g): SpellPair => ({
        spells: g.value.map((id) => SUMMONER_SPELLS[id] ?? { id: "SummonerFlash", name: `Spell ${id}` }),
        ...choiceOf(g.rows, total),
      }),
    );

  const skillOrders = groupBy(rows, (r) => r.max_order)
    .slice(0, 2)
    .map((g): SkillOrder => {
      const common = groupBy(g.rows, (r) => (r.skill_order.length >= 6 ? r.skill_order : null))[0];
      return {
        maxOrder: g.value.split(""),
        levels: (common?.value ?? "").split("") as SkillOrder["levels"],
        ...choiceOf(g.rows, total),
      };
    });

  const startingItems = groupBy(rows, (r) => (r.start_items.length ? r.start_items : null), (s) => s.join(","))
    .slice(0, 3)
    .map((g): ItemSet => ({ items: g.value.map(item), ...choiceOf(g.rows, total) }));

  // Item timings: early items bought in a meaningful share of games.
  const firstPurchase = new Map<number, number[]>();
  for (const r of rows) {
    for (const [id, seconds] of Object.entries(r.purchases)) {
      if (seconds < 90 || seconds > 20 * 60) continue;
      const list = firstPurchase.get(Number(id)) ?? [];
      list.push(seconds);
      firstPurchase.set(Number(id), list);
    }
  }
  const itemTimings = [...firstPurchase.entries()]
    .filter(([, times]) => times.length >= total * 0.15)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 6)
    .map(([id, times]): ItemTiming => ({
      item: item(id),
      avgSeconds: Math.round(avg(times)),
      firstRecallRate: rate(rows.filter((r) => r.first_back.includes(id)).length, total),
    }))
    .sort((a, b) => a.avgSeconds - b.avgSeconds);

  const itemStep = (label: string, pick: (r: GameRow) => number[], limit = 3): BuildStep => {
    const counts = new Map<number, GameRow[]>();
    for (const r of rows) {
      for (const id of new Set(pick(r))) {
        const list = counts.get(id) ?? [];
        list.push(r);
        counts.set(id, list);
      }
    }
    return {
      label,
      options: [...counts.entries()]
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, limit)
        .map(([id, list]) => ({ item: item(id), ...choiceOf(list, total) })),
    };
  };
  const build = [
    {
      label: "Başlangıç",
      options: startingItems.slice(0, 2).map((s) => ({ ...s, item: s.items[0] })),
    },
    itemStep("İlk recall", (r) => r.first_back),
    itemStep("İlk item", (r) => r.core_items.slice(0, 1)),
    itemStep("İkinci item", (r) => r.core_items.slice(1, 2)),
    itemStep("Üçüncü item", (r) => r.core_items.slice(2, 3)),
    itemStep("Ayakkabı", (r) => (r.boots ? [r.boots] : [])),
    itemStep("Full build (4.-6. item)", (r) => r.core_items.slice(3, 6)),
  ].filter((step) => step.options.length);

  // Insights: items bought before 15:00 noticeably more often in this matchup than
  // in the champion's games overall, with how those games went.
  const insights = [...firstPurchase.keys()]
    .map((id) => {
      const withRows = rows.filter((r) => (r.purchases[id] ?? Infinity) < EARLY_S);
      const share = rate(withRows.length, total);
      return { id, withRows, share, lift: share - (baseline[id] ?? 0) };
    })
    .filter((x) => x.withRows.length >= 10 && total - x.withRows.length >= 10 && x.lift >= 3)
    .sort((a, b) => b.lift - a.lift)
    .slice(0, 2)
    .map(({ id, withRows, share }): ItemInsight => {
      const bought = new Set(withRows);
      const withoutRows = rows.filter((r) => !bought.has(r));
      return {
        item: item(id),
        condition: "15. dakikadan önce alındığında",
        withItem: { games: withRows.length, winRate: rate(withRows.filter((r) => r.win).length, withRows.length) },
        withoutItem: {
          games: withoutRows.length,
          winRate: rate(withoutRows.filter((r) => r.win).length, withoutRows.length),
        },
        note: `${opponentName} karşısında oyuncuların %${share.toFixed(0)}'i bu item'ı erken alıyor, genelde bu oran %${(baseline[id] ?? 0).toFixed(0)}.`,
      };
    });

  return {
    games: total,
    avgDurationSeconds: Math.round(avg(rows.map((r) => r.duration_s))),
    self: sideStats(rows),
    enemy: sideStats(rows.map((r) => r.opponent)),
    runePages,
    spells,
    skillOrders,
    startingItems,
    itemTimings,
    build,
    insights,
  };
}
