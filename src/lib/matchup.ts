import type { LaneSlug } from "./constants";
import { getRealMatchup } from "./db-matchup";
import { getSampleMatchup } from "./sample-data";
import type { Champion, Filters, MatchupData } from "./types";

/**
 * Single entry point the matchup page reads from: real numbers from the
 * database when there are enough games, sample numbers otherwise.
 */
export async function getMatchup(
  champion: Champion,
  opponent: Champion,
  lane: LaneSlug,
  filters: Filters,
): Promise<MatchupData> {
  const real = await getRealMatchup(champion, opponent, lane, filters).catch((err) => {
    console.error("Matchup query failed", err);
    return null;
  });
  if (real && "champion" in real) return real;
  return { ...getSampleMatchup(champion, opponent, lane, filters), realGames: real?.games };
}
