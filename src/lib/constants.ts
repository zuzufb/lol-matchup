export const LANES = [
  { slug: "top", label: "Top", riotPosition: "TOP" },
  { slug: "jungle", label: "Jungle", riotPosition: "JUNGLE" },
  { slug: "mid", label: "Mid", riotPosition: "MIDDLE" },
  { slug: "adc", label: "ADC", riotPosition: "BOTTOM" },
  { slug: "support", label: "Support", riotPosition: "UTILITY" },
] as const;

export type LaneSlug = (typeof LANES)[number]["slug"];

export const RANKS = [
  { value: "all", label: "All Ranks" },
  { value: "gold_plus", label: "Gold+" },
  { value: "platinum_plus", label: "Platinum+" },
  { value: "emerald_plus", label: "Emerald+" },
  { value: "diamond_plus", label: "Diamond+" },
  { value: "master_plus", label: "Master+" },
  { value: "grandmaster_plus", label: "Grandmaster+" },
  { value: "challenger", label: "Challenger" },
] as const;

// `platform` is the Riot API host prefix (e.g. euw1.api.riotgames.com),
// `routing` the regional cluster used by Match-V5.
export const REGIONS = [
  { value: "euw", label: "EUW", platform: "euw1", routing: "europe" },
  { value: "eune", label: "EUNE", platform: "eun1", routing: "europe" },
  { value: "kr", label: "KR", platform: "kr", routing: "asia" },
  { value: "na", label: "NA", platform: "na1", routing: "americas" },
  { value: "tr", label: "TR", platform: "tr1", routing: "europe" },
  { value: "br", label: "BR", platform: "br1", routing: "americas" },
  { value: "jp", label: "JP", platform: "jp1", routing: "asia" },
  { value: "oce", label: "OCE", platform: "oc1", routing: "sea" },
  { value: "lan", label: "LAN", platform: "la1", routing: "americas" },
  { value: "las", label: "LAS", platform: "la2", routing: "americas" },
] as const;

export const DEFAULT_RANK = "emerald_plus";
export const DEFAULT_REGION = "euw";

export function isLane(value: string): value is LaneSlug {
  return LANES.some((l) => l.slug === value);
}

export function laneLabel(slug: LaneSlug): string {
  return LANES.find((l) => l.slug === slug)!.label;
}

export const TIERS = [
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
  "MASTER",
  "GRANDMASTER",
  "CHALLENGER",
] as const;

/** Lowest and highest tier index (see TIERS) included by a rank filter. */
export function tierRange(rank: string): [number, number] {
  const min: Record<string, string> = {
    gold_plus: "GOLD",
    platinum_plus: "PLATINUM",
    emerald_plus: "EMERALD",
    diamond_plus: "DIAMOND",
    master_plus: "MASTER",
    grandmaster_plus: "GRANDMASTER",
    challenger: "CHALLENGER",
  };
  const index = TIERS.indexOf((min[rank] ?? "IRON") as (typeof TIERS)[number]);
  return [index, TIERS.length - 1];
}

export function regionPlatform(region: string): string {
  return REGIONS.find((r) => r.value === region)?.platform ?? "euw1";
}

export function laneFromPosition(position: string): LaneSlug | undefined {
  return LANES.find((l) => l.riotPosition === position)?.slug;
}

export function positionOf(lane: LaneSlug): string {
  return LANES.find((l) => l.slug === lane)!.riotPosition;
}

/** Summoner spell numeric id (Match-V5 summoner1Id) to Data Dragon id and name. */
export const SUMMONER_SPELLS: Record<number, { id: string; name: string }> = {
  1: { id: "SummonerBoost", name: "Cleanse" },
  3: { id: "SummonerExhaust", name: "Exhaust" },
  4: { id: "SummonerFlash", name: "Flash" },
  6: { id: "SummonerHaste", name: "Ghost" },
  7: { id: "SummonerHeal", name: "Heal" },
  11: { id: "SummonerSmite", name: "Smite" },
  12: { id: "SummonerTeleport", name: "Teleport" },
  14: { id: "SummonerDot", name: "Ignite" },
  21: { id: "SummonerBarrier", name: "Barrier" },
};

/** Stat shards are not in Data Dragon's runesReforged.json. */
export const STAT_SHARDS: Record<number, string> = {
  5001: "Health Scaling",
  5002: "Armor",
  5003: "Magic Resist",
  5005: "Attack Speed",
  5007: "Ability Haste",
  5008: "Adaptive Force",
  5010: "Move Speed",
  5011: "Health",
  5013: "Tenacity and Slow Resist",
};
