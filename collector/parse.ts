import type { ItemInfo } from "../src/lib/ddragon";
import type { RiotEvent, RiotMatch, RiotTimeline } from "./riot-types";

export interface MatchRow {
  match_id: string;
  platform: string;
  patch: string;
  tier: number;
  game_start: Date;
  duration_s: number;
}

export interface ParticipantRow {
  match_id: string;
  participant_id: number;
  team_id: number;
  champion_id: number;
  position: string;
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
}

export const RANKED_SOLO_QUEUE = 420;
const MIN_DURATION_S = 15 * 60; // shorter games are mostly remakes and early surrenders
const START_WINDOW_MS = 90_000;
const SHOPPING_TRIP_MS = 45_000;
const SKILLS = ["", "Q", "W", "E", "R"];

/** Returns null for games that should not count (remakes, other queues, missing roles). */
export function parseMatch(
  match: RiotMatch,
  timeline: RiotTimeline,
  tier: number,
  items: Record<number, ItemInfo>,
): { match: MatchRow; participants: ParticipantRow[] } | null {
  const { info } = match;
  if (info.queueId !== RANKED_SOLO_QUEUE) return null;
  if (info.gameDuration < MIN_DURATION_S) return null;
  if (info.participants.some((p) => p.gameEndedInEarlySurrender || !p.teamPosition)) return null;

  const events = timeline.info.frames.flatMap((f) => f.events);
  const frameAt = (minute: number) => timeline.info.frames[minute]?.participantFrames;

  const participants = info.participants.map((p): ParticipantRow => {
    const id = p.participantId;
    const opponent = info.participants.find((o) => o.teamId !== p.teamId && o.teamPosition === p.teamPosition);
    const at10 = frameAt(10)?.[id];
    const at15 = frameAt(15)?.[id];
    const purchases = purchaseHistory(events, id, items);
    const skills = events
      .filter((e): e is Extract<RiotEvent, { type: "SKILL_LEVEL_UP" }> => e.type === "SKILL_LEVEL_UP")
      .filter((e) => e.participantId === id && e.levelUpType === "NORMAL")
      .map((e) => SKILLS[e.skillSlot])
      .join("");
    const primary = p.perks.styles.find((s) => s.description === "primaryStyle")!;
    const sub = p.perks.styles.find((s) => s.description === "subStyle")!;

    return {
      match_id: match.metadata.matchId,
      participant_id: id,
      team_id: p.teamId,
      champion_id: p.championId,
      position: p.teamPosition,
      win: p.win,
      kills: p.kills,
      deaths: p.deaths,
      assists: p.assists,
      cs: p.totalMinionsKilled + p.neutralMinionsKilled,
      cs10: at10 ? at10.minionsKilled + at10.jungleMinionsKilled : null,
      cs15: at15 ? at15.minionsKilled + at15.jungleMinionsKilled : null,
      gold10: at10?.totalGold ?? null,
      gold15: at15?.totalGold ?? null,
      first_blood: p.firstBloodKill,
      solo_kills: opponent
        ? events.filter(
            (e) =>
              e.type === "CHAMPION_KILL" &&
              "killerId" in e &&
              e.killerId === id &&
              e.victimId === opponent.participantId &&
              !e.assistingParticipantIds?.length,
          ).length
        : 0,
      spells: [p.summoner1Id, p.summoner2Id].sort((a, b) => a - b),
      primary_style: primary.style,
      sub_style: sub.style,
      perks: [...primary.selections, ...sub.selections].map((s) => s.perk),
      shards: [p.perks.statPerks.offense, p.perks.statPerks.flex, p.perks.statPerks.defense],
      ...buildPath(purchases, items),
      skill_order: skills,
      max_order: maxOrder(skills),
      purchases: Object.fromEntries(
        [...purchases].reverse().map((x) => [String(x.itemId), Math.round(x.timestamp / 1000)]),
      ),
    };
  });

  return {
    match: {
      match_id: match.metadata.matchId,
      platform: info.platformId.toLowerCase(),
      patch: info.gameVersion.split(".").slice(0, 2).join("."),
      tier,
      game_start: new Date(info.gameStartTimestamp),
      duration_s: info.gameDuration,
    },
    participants,
  };
}

interface Purchase {
  itemId: number;
  timestamp: number;
}

/** Item purchases in order, with undone purchases removed and consumables left out. */
export function purchaseHistory(events: RiotEvent[], participantId: number, items: Record<number, ItemInfo>): Purchase[] {
  const bought: Purchase[] = [];
  for (const e of events) {
    if (!("participantId" in e) || e.participantId !== participantId) continue;
    if (e.type === "ITEM_PURCHASED" && "itemId" in e) {
      bought.push({ itemId: e.itemId, timestamp: e.timestamp });
    } else if (e.type === "ITEM_UNDO" && "beforeId" in e && e.beforeId && !e.afterId) {
      const last = bought.findLastIndex((b) => b.itemId === e.beforeId);
      if (last !== -1) bought.splice(last, 1);
    }
  }
  return bought.filter((b) => !items[b.itemId]?.consumable);
}

export function buildPath(purchases: Purchase[], items: Record<number, ItemInfo>) {
  const start = purchases.filter((p) => p.timestamp < START_WINDOW_MS);
  const later = purchases.filter((p) => p.timestamp >= START_WINDOW_MS);
  const tripStart = later[0]?.timestamp;
  const firstBack = later.filter((p) => p.timestamp <= tripStart + SHOPPING_TRIP_MS);
  const core: number[] = [];
  for (const p of purchases) {
    if (items[p.itemId]?.completed && !core.includes(p.itemId)) core.push(p.itemId);
  }
  return {
    start_items: start.map((p) => p.itemId).sort((a, b) => a - b),
    first_back: [...new Set(firstBack.map((p) => p.itemId))],
    core_items: core,
    boots: purchases.find((p) => items[p.itemId]?.boots)?.itemId ?? null,
  };
}

/** Order in which Q, W and E were maxed, e.g. "QEW". Ties go to the ability with more points. */
export function maxOrder(skills: string): string {
  const rank = (s: string) => {
    let points = 0;
    for (let i = 0; i < skills.length; i++) {
      if (skills[i] === s && ++points === 5) return [i, 0];
    }
    return [Infinity, -points];
  };
  return ["Q", "W", "E"]
    .map((s) => ({ s, r: rank(s) }))
    .sort((a, b) => a.r[0] - b.r[0] || a.r[1] - b.r[1])
    .map((x) => x.s)
    .join("");
}
