// The parts of Riot's Match-V5 responses the collector reads.
// Full reference: https://developer.riotgames.com/apis#match-v5

export interface RiotMatch {
  metadata: { matchId: string };
  info: {
    gameVersion: string; // "16.19.712.3456"
    gameDuration: number; // seconds
    gameStartTimestamp: number;
    queueId: number;
    platformId: string; // "EUW1"
    participants: RiotParticipant[];
  };
}

export interface RiotParticipant {
  participantId: number;
  puuid: string;
  teamId: number;
  championId: number;
  teamPosition: string; // "" when Riot could not assign one
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  firstBloodKill: boolean;
  gameEndedInEarlySurrender: boolean;
  summoner1Id: number;
  summoner2Id: number;
  perks: {
    statPerks: { offense: number; flex: number; defense: number };
    styles: { description: string; style: number; selections: { perk: number }[] }[];
  };
}

export interface RiotTimeline {
  info: {
    frames: {
      timestamp: number;
      participantFrames: Record<
        string,
        { minionsKilled: number; jungleMinionsKilled: number; totalGold: number }
      >;
      events: RiotEvent[];
    }[];
  };
}

export type RiotEvent =
  | { type: "ITEM_PURCHASED"; timestamp: number; participantId: number; itemId: number }
  | { type: "ITEM_UNDO"; timestamp: number; participantId: number; beforeId: number; afterId: number }
  | { type: "SKILL_LEVEL_UP"; timestamp: number; participantId: number; skillSlot: number; levelUpType: string }
  | {
      type: "CHAMPION_KILL";
      timestamp: number;
      killerId: number;
      victimId: number;
      assistingParticipantIds?: number[];
    }
  | { type: string; timestamp: number };
