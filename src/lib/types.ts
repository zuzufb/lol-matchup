import type { LaneSlug } from "./constants";

export interface Champion {
  /** Data Dragon id, also the image file name (e.g. "MonkeyKing"). */
  id: string;
  /** Numeric champion id as a string (matches `championId` in Match-V5). */
  key: string;
  name: string;
  /** URL slug derived from the display name (e.g. "wukong"). */
  slug: string;
  tags: string[];
}

export interface Filters {
  rank: string;
  region: string;
  /** Data Dragon version prefix, e.g. "16.19". */
  patch: string;
}

/** A value with how often it was picked and how often it won. */
export interface Choice {
  games: number;
  pickRate: number; // 0-100
  winRate: number; // 0-100
}

export interface Rune {
  id: number;
  name: string;
}

export interface RunePage extends Choice {
  label: string;
  primaryStyle: Rune;
  primary: Rune[]; // keystone + 3
  secondaryStyle: Rune;
  secondary: Rune[]; // 2
  shards: Rune[]; // 3
}

export interface Item {
  id: number;
  name: string;
}

export interface ItemSet extends Choice {
  items: Item[];
}

export interface ItemTiming {
  item: Item;
  /** Average game time of purchase, in seconds. */
  avgSeconds: number;
  /** Share of games where it was bought on the first recall. */
  firstRecallRate: number;
}

export interface BuildStep {
  label: string;
  options: (Choice & { item: Item })[];
}

export interface SpellPair extends Choice {
  spells: { id: string; name: string }[];
}

export interface SkillOrder extends Choice {
  /** Max order, e.g. ["Q", "W", "E"]. */
  maxOrder: string[];
  /** Ability leveled at each champion level 1-18. */
  levels: ("Q" | "W" | "E" | "R")[];
}

export interface ItemInsight {
  item: Item;
  condition: string;
  withItem: { games: number; winRate: number };
  withoutItem: { games: number; winRate: number };
  note: string;
}

export interface SideStats {
  winRate: number;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  csAt10: number;
  csAt15: number;
  goldAt10: number;
  goldAt15: number;
  soloKillRate: number; // % of games with at least one solo kill on the lane opponent
  firstBloodRate: number;
}

export interface MatchupData {
  champion: Champion;
  opponent: Champion;
  lane: LaneSlug;
  filters: Filters;
  /** True while the page is showing generated sample numbers. */
  isSample: boolean;
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
