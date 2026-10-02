import type { LaneSlug } from "./constants";
import { getSampleMatchup } from "./sample-data";
import type { Champion, Filters, MatchupData } from "./types";

/**
 * Single entry point the matchup page reads from. Today it returns sample
 * numbers; in phase 2 it will query the aggregated tables built from
 * Riot Match-V5 + timeline data.
 */
export async function getMatchup(
  champion: Champion,
  opponent: Champion,
  lane: LaneSlug,
  filters: Filters,
): Promise<MatchupData> {
  return getSampleMatchup(champion, opponent, lane, filters);
}

export function matchupPath(championSlug: string, opponentSlug: string, lane: string) {
  return `/matchup/${championSlug}-vs-${opponentSlug}/${lane}`;
}

export function parseMatchupSlug(slug: string): [string, string] | null {
  const parts = slug.split("-vs-");
  return parts.length === 2 && parts[0] && parts[1] ? [parts[0], parts[1]] : null;
}
