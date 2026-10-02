import type postgres from "postgres";
import type { MatchRow, ParticipantRow } from "./parse";

export async function saveMatch(sql: postgres.Sql, match: MatchRow, participants: ParticipantRow[]) {
  await sql.begin(async (tx) => {
    const inserted = await tx`insert into matches ${tx(match)} on conflict do nothing returning match_id`;
    if (!inserted.length) return;
    await tx`insert into participants ${tx(
      participants.map((p) => ({ ...p, purchases: tx.json(p.purchases) })),
    )}`;
  });
}

export async function knownMatches(sql: postgres.Sql, ids: string[]): Promise<Set<string>> {
  if (!ids.length) return new Set();
  const rows = await sql`
    select match_id from matches where match_id in ${sql(ids)}
    union all
    select match_id from skipped_matches where match_id in ${sql(ids)}`;
  return new Set(rows.map((r) => r.match_id as string));
}

export async function getState(sql: postgres.Sql, key: string): Promise<string | undefined> {
  const [row] = await sql`select value from collector_state where key = ${key}`;
  return row?.value;
}

export async function setState(sql: postgres.Sql, key: string, value: string) {
  await sql`
    insert into collector_state (key, value) values (${key}, ${value})
    on conflict (key) do update set value = excluded.value`;
}

export async function markSkipped(sql: postgres.Sql, matchId: string) {
  await sql`insert into skipped_matches (match_id) values (${matchId}) on conflict do nothing`;
}
