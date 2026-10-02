export function matchupPath(championSlug: string, opponentSlug: string, lane: string) {
  return `/matchup/${championSlug}-vs-${opponentSlug}/${lane}`;
}

export function parseMatchupSlug(slug: string): [string, string] | null {
  const parts = slug.split("-vs-");
  return parts.length === 2 && parts[0] && parts[1] ? [parts[0], parts[1]] : null;
}
