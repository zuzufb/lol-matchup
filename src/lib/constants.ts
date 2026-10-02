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
