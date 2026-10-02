// Small hand-built Match-V5 responses for tests. Shapes follow Riot's API;
// only the fields the collector reads are filled in.

import type { ItemInfo } from "../src/lib/ddragon";
import type { RiotEvent, RiotMatch, RiotParticipant, RiotTimeline } from "./riot-types";

export const TEST_ITEMS: Record<number, ItemInfo> = {
  1056: { name: "Doran's Ring", completed: false, boots: false, consumable: false },
  2003: { name: "Health Potion", completed: false, boots: false, consumable: true },
  3340: { name: "Stealth Ward", completed: false, boots: false, consumable: true },
  1001: { name: "Boots", completed: false, boots: false, consumable: false },
  3802: { name: "Lost Chapter", completed: false, boots: false, consumable: false },
  2420: { name: "Seeker's Armguard", completed: false, boots: false, consumable: false },
  3020: { name: "Sorcerer's Shoes", completed: false, boots: true, consumable: false },
  6655: { name: "Luden's Companion", completed: true, boots: false, consumable: false },
  3157: { name: "Zhonya's Hourglass", completed: true, boots: false, consumable: false },
  3089: { name: "Rabadon's Deathcap", completed: true, boots: false, consumable: false },
  1055: { name: "Doran's Blade", completed: false, boots: false, consumable: false },
  3142: { name: "Youmuu's Ghostblade", completed: true, boots: false, consumable: false },
};

const POSITIONS = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];

export interface FixtureOptions {
  matchId: string;
  /** Champion ids for participants 1-10 (1-5 blue, 6-10 red, in POSITIONS order). */
  champions?: number[];
  blueWins?: boolean;
  durationS?: number;
  /** Participant 3 (blue mid) buys Seeker's Armguard on first back. */
  midBuysSeekers?: boolean;
  queueId?: number;
}

export function buildFixture(opts: FixtureOptions): { match: RiotMatch; timeline: RiotTimeline } {
  const champions = opts.champions ?? [122, 64, 103, 222, 412, 86, 104, 238, 51, 117];
  const durationS = opts.durationS ?? 1800;
  const blueWins = opts.blueWins ?? true;

  const participants: RiotParticipant[] = champions.map((championId, i) => {
    const id = i + 1;
    const blue = id <= 5;
    return {
      participantId: id,
      puuid: `puuid-${opts.matchId}-${id}`,
      teamId: blue ? 100 : 200,
      championId,
      teamPosition: POSITIONS[i % 5],
      win: blue === blueWins,
      kills: blue ? 6 : 4,
      deaths: blue ? 3 : 5,
      assists: 7,
      totalMinionsKilled: 200,
      neutralMinionsKilled: 10,
      firstBloodKill: id === 3,
      gameEndedInEarlySurrender: false,
      summoner1Id: 4,
      summoner2Id: 14,
      perks: {
        statPerks: { offense: 5005, flex: 5008, defense: 5001 },
        styles: [
          { description: "primaryStyle", style: 8100, selections: [8112, 8139, 8140, 8106].map((perk) => ({ perk })) },
          { description: "subStyle", style: 8200, selections: [8226, 8237].map((perk) => ({ perk })) },
        ],
      },
    };
  });

  const events: RiotEvent[] = [];
  const buy = (participantId: number, itemId: number, seconds: number) =>
    events.push({ type: "ITEM_PURCHASED", participantId, itemId, timestamp: seconds * 1000 });
  for (let id = 1; id <= 10; id++) {
    buy(id, 1056, 2);
    buy(id, 2003, 3);
    buy(id, 2003, 4);
    buy(id, 3340, 5);
    // Bought by mistake and undone: must not show up.
    buy(id, 1001, 6);
    events.push({ type: "ITEM_UNDO", participantId: id, beforeId: 1001, afterId: 0, timestamp: 7000 });
    buy(id, 3802, 400);
    buy(id, 1001, 410);
    if (id === 3 && opts.midBuysSeekers) buy(id, 2420, 415);
    buy(id, 6655, 900);
    buy(id, 3020, 1000);
    buy(id, 3157, 1300);
    buy(id, 3089, 1600);
  }
  // Skills: Q W E then max Q, then W, R at 6/11/16.
  const order = "QWEQQRQWQWRWWEEREE";
  for (let id = 1; id <= 10; id++) {
    order.split("").forEach((s, i) =>
      events.push({
        type: "SKILL_LEVEL_UP",
        participantId: id,
        skillSlot: "QWER".indexOf(s) + 1,
        levelUpType: "NORMAL",
        timestamp: (i + 1) * 60_000,
      }),
    );
  }
  // Blue mid (3) solo kills red mid (8) once, and once more with help.
  events.push({ type: "CHAMPION_KILL", killerId: 3, victimId: 8, timestamp: 300_000 });
  events.push({ type: "CHAMPION_KILL", killerId: 3, victimId: 8, assistingParticipantIds: [2], timestamp: 500_000 });
  events.sort((a, b) => a.timestamp - b.timestamp);

  const minutes = Math.floor(durationS / 60);
  const frames = Array.from({ length: minutes + 1 }, (_, minute) => ({
    timestamp: minute * 60_000,
    participantFrames: Object.fromEntries(
      participants.map((p) => [
        String(p.participantId),
        {
          minionsKilled: minute * (p.teamId === 100 ? 8 : 7),
          jungleMinionsKilled: 0,
          totalGold: 500 + minute * (p.teamId === 100 ? 330 : 300),
        },
      ]),
    ),
    events: events.filter((e) => e.timestamp >= minute * 60_000 && e.timestamp < (minute + 1) * 60_000),
  }));

  return {
    match: {
      metadata: { matchId: opts.matchId },
      info: {
        gameVersion: "16.19.712.3456",
        gameDuration: durationS,
        gameStartTimestamp: Date.UTC(2026, 9, 1),
        queueId: opts.queueId ?? 420,
        platformId: "EUW1",
        participants,
      },
    },
    timeline: { info: { frames } },
  };
}
