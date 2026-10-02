// Generated sample numbers so the matchup page can be built before real
// Riot match data is collected. Every value is deterministic for a given
// matchup + filters, so pages look stable between reloads. This whole file
// gets replaced by database queries in phase 2.

import type { LaneSlug } from "./constants";
import type {
  BuildStep,
  Champion,
  Filters,
  Item,
  ItemInsight,
  ItemSet,
  ItemTiming,
  MatchupData,
  Rune,
  RunePage,
  SideStats,
  SkillOrder,
  SpellPair,
} from "./types";

type Archetype = "mage" | "assassin" | "fighter" | "tank" | "marksman" | "support" | "jungle";

function archetypeOf(champion: Champion, lane: LaneSlug): Archetype {
  if (lane === "jungle") return "jungle";
  if (lane === "support") return "support";
  if (lane === "adc") return "marksman";
  const tag = champion.tags[0];
  if (tag === "Mage") return "mage";
  if (tag === "Assassin") return "assassin";
  if (tag === "Tank") return "tank";
  if (tag === "Marksman") return "marksman";
  if (tag === "Support") return "mage";
  return "fighter";
}

// ---------------------------------------------------------------- random

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededRandom(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (n: number, digits = 1) => Math.round(n * 10 ** digits) / 10 ** digits;

// ---------------------------------------------------------------- static pools

const i = (id: number, name: string): Item => ({ id, name });
const r = (id: number, name: string): Rune => ({ id, name });

const ITEMS = {
  dRing: i(1056, "Doran's Ring"),
  dShield: i(1054, "Doran's Shield"),
  dBlade: i(1055, "Doran's Blade"),
  potion: i(2003, "Health Potion"),
  darkSeal: i(1082, "Dark Seal"),
  longSword: i(1036, "Long Sword"),
  cull: i(1083, "Cull"),
  worldAtlas: i(3865, "World Atlas"),
  scorchclaw: i(1101, "Scorchclaw Pup"),
  gustwalker: i(1102, "Gustwalker Hatchling"),
  mosstomper: i(1103, "Mosstomper Seedling"),
  boots: i(1001, "Boots"),
  lostChapter: i(3802, "Lost Chapter"),
  seekers: i(2420, "Seeker's Armguard"),
  tome: i(1052, "Amplifying Tome"),
  blastingWand: i(1026, "Blasting Wand"),
  dirk: i(3134, "Serrated Dirk"),
  caulfield: i(3133, "Caulfield's Warhammer"),
  phage: i(3044, "Phage"),
  ruby: i(1028, "Ruby Crystal"),
  bami: i(6660, "Bami's Cinder"),
  chainVest: i(1031, "Chain Vest"),
  noonquiver: i(6670, "Noonquiver"),
  cloak: i(1018, "Cloak of Agility"),
  kindlegem: i(3067, "Kindlegem"),
  sorcs: i(3020, "Sorcerer's Shoes"),
  mercs: i(3111, "Mercury's Treads"),
  plated: i(3047, "Plated Steelcaps"),
  ionian: i(3158, "Ionian Boots of Lucidity"),
  berserkers: i(3006, "Berserker's Greaves"),
  luden: i(6655, "Luden's Companion"),
  malignance: i(3118, "Malignance"),
  stormsurge: i(4646, "Stormsurge"),
  zhonya: i(3157, "Zhonya's Hourglass"),
  banshee: i(3102, "Banshee's Veil"),
  rabadon: i(3089, "Rabadon's Deathcap"),
  shadowflame: i(4645, "Shadowflame"),
  voidStaff: i(3135, "Void Staff"),
  youmuu: i(3142, "Youmuu's Ghostblade"),
  eclipse: i(6692, "Eclipse"),
  opportunity: i(6701, "Opportunity"),
  edgeOfNight: i(3814, "Edge of Night"),
  serylda: i(6694, "Serylda's Grudge"),
  blackCleaver: i(3071, "Black Cleaver"),
  trinity: i(3078, "Trinity Force"),
  sterak: i(3053, "Sterak's Gage"),
  deathsDance: i(6333, "Death's Dance"),
  sunderedSky: i(6610, "Sundered Sky"),
  sunfire: i(3068, "Sunfire Aegis"),
  heartsteel: i(3084, "Heartsteel"),
  thornmail: i(3075, "Thornmail"),
  kaenic: i(2504, "Kaenic Rookern"),
  jaksho: i(6665, "Jak'Sho, The Protean"),
  infinity: i(3031, "Infinity Edge"),
  kraken: i(6672, "Kraken Slayer"),
  phantom: i(3046, "Phantom Dancer"),
  ldr: i(3036, "Lord Dominik's Regards"),
  bloodthirster: i(3072, "Bloodthirster"),
  moonstone: i(6617, "Moonstone Renewer"),
  redemption: i(3107, "Redemption"),
  locket: i(3190, "Locket of the Iron Solari"),
  mikael: i(3222, "Mikael's Blessing"),
  knightsVow: i(3109, "Knight's Vow"),
};

interface Pool {
  starts: Item[][];
  recall: Item[];
  boots: Item[];
  core: Item[][]; // options per completed-item slot
  defensive: Item[]; // items an insight card talks about
}

const POOLS: Record<Archetype, Pool> = {
  mage: {
    starts: [[ITEMS.dRing, ITEMS.potion, ITEMS.potion], [ITEMS.dShield, ITEMS.potion], [ITEMS.darkSeal, ITEMS.potion]],
    recall: [ITEMS.lostChapter, ITEMS.darkSeal, ITEMS.seekers, ITEMS.boots, ITEMS.tome],
    boots: [ITEMS.sorcs, ITEMS.mercs],
    core: [
      [ITEMS.luden, ITEMS.malignance, ITEMS.stormsurge],
      [ITEMS.shadowflame, ITEMS.zhonya, ITEMS.stormsurge],
      [ITEMS.rabadon, ITEMS.zhonya, ITEMS.banshee],
      [ITEMS.voidStaff, ITEMS.banshee, ITEMS.rabadon],
    ],
    defensive: [ITEMS.seekers, ITEMS.zhonya],
  },
  assassin: {
    starts: [[ITEMS.dBlade, ITEMS.potion], [ITEMS.longSword, ITEMS.potion, ITEMS.potion], [ITEMS.dShield, ITEMS.potion]],
    recall: [ITEMS.dirk, ITEMS.caulfield, ITEMS.longSword, ITEMS.boots],
    boots: [ITEMS.ionian, ITEMS.plated],
    core: [
      [ITEMS.youmuu, ITEMS.eclipse, ITEMS.opportunity],
      [ITEMS.opportunity, ITEMS.edgeOfNight, ITEMS.eclipse],
      [ITEMS.serylda, ITEMS.blackCleaver, ITEMS.edgeOfNight],
      [ITEMS.deathsDance, ITEMS.serylda, ITEMS.edgeOfNight],
    ],
    defensive: [ITEMS.edgeOfNight, ITEMS.deathsDance],
  },
  fighter: {
    starts: [[ITEMS.dBlade, ITEMS.potion], [ITEMS.dShield, ITEMS.potion]],
    recall: [ITEMS.phage, ITEMS.caulfield, ITEMS.boots, ITEMS.chainVest],
    boots: [ITEMS.plated, ITEMS.mercs],
    core: [
      [ITEMS.trinity, ITEMS.blackCleaver, ITEMS.sunderedSky],
      [ITEMS.sterak, ITEMS.deathsDance, ITEMS.blackCleaver],
      [ITEMS.deathsDance, ITEMS.sterak, ITEMS.kaenic],
      [ITEMS.thornmail, ITEMS.kaenic, ITEMS.serylda],
    ],
    defensive: [ITEMS.plated, ITEMS.deathsDance],
  },
  tank: {
    starts: [[ITEMS.dShield, ITEMS.potion], [ITEMS.dRing, ITEMS.potion, ITEMS.potion]],
    recall: [ITEMS.bami, ITEMS.ruby, ITEMS.chainVest, ITEMS.boots],
    boots: [ITEMS.plated, ITEMS.mercs],
    core: [
      [ITEMS.sunfire, ITEMS.heartsteel, ITEMS.jaksho],
      [ITEMS.heartsteel, ITEMS.thornmail, ITEMS.sunfire],
      [ITEMS.thornmail, ITEMS.kaenic, ITEMS.jaksho],
      [ITEMS.kaenic, ITEMS.jaksho, ITEMS.thornmail],
    ],
    defensive: [ITEMS.chainVest, ITEMS.thornmail],
  },
  marksman: {
    starts: [[ITEMS.dBlade, ITEMS.potion], [ITEMS.cull]],
    recall: [ITEMS.noonquiver, ITEMS.cloak, ITEMS.boots, ITEMS.longSword],
    boots: [ITEMS.berserkers, ITEMS.plated],
    core: [
      [ITEMS.kraken, ITEMS.infinity, ITEMS.bloodthirster],
      [ITEMS.infinity, ITEMS.phantom, ITEMS.kraken],
      [ITEMS.ldr, ITEMS.phantom, ITEMS.bloodthirster],
      [ITEMS.bloodthirster, ITEMS.ldr, ITEMS.infinity],
    ],
    defensive: [ITEMS.plated, ITEMS.bloodthirster],
  },
  support: {
    starts: [[ITEMS.worldAtlas, ITEMS.potion, ITEMS.potion]],
    recall: [ITEMS.kindlegem, ITEMS.boots, ITEMS.ruby],
    boots: [ITEMS.ionian, ITEMS.mercs],
    core: [
      [ITEMS.moonstone, ITEMS.locket, ITEMS.knightsVow],
      [ITEMS.redemption, ITEMS.mikael, ITEMS.locket],
      [ITEMS.mikael, ITEMS.redemption, ITEMS.knightsVow],
      [ITEMS.locket, ITEMS.knightsVow, ITEMS.redemption],
    ],
    defensive: [ITEMS.locket, ITEMS.mercs],
  },
  jungle: {
    starts: [[ITEMS.gustwalker, ITEMS.potion], [ITEMS.scorchclaw, ITEMS.potion], [ITEMS.mosstomper, ITEMS.potion]],
    recall: [ITEMS.longSword, ITEMS.caulfield, ITEMS.boots, ITEMS.ruby],
    boots: [ITEMS.ionian, ITEMS.plated],
    core: [
      [ITEMS.youmuu, ITEMS.blackCleaver, ITEMS.sunfire],
      [ITEMS.blackCleaver, ITEMS.sterak, ITEMS.serylda],
      [ITEMS.deathsDance, ITEMS.sterak, ITEMS.thornmail],
      [ITEMS.serylda, ITEMS.deathsDance, ITEMS.kaenic],
    ],
    defensive: [ITEMS.plated, ITEMS.deathsDance],
  },
};

const STYLES = {
  precision: r(8000, "Precision"),
  domination: r(8100, "Domination"),
  sorcery: r(8200, "Sorcery"),
  inspiration: r(8300, "Inspiration"),
  resolve: r(8400, "Resolve"),
};

const SHARDS = {
  adaptive: r(5008, "Adaptive Force"),
  attackSpeed: r(5005, "Attack Speed"),
  haste: r(5007, "Ability Haste"),
  healthScaling: r(5001, "Health Scaling"),
  health: r(5011, "Health"),
  tenacity: r(5013, "Tenacity and Slow Resist"),
};

type PageTemplate = Omit<RunePage, "games" | "pickRate" | "winRate">;

const domElectrocute = (label: string): PageTemplate => ({
  label,
  primaryStyle: STYLES.domination,
  primary: [r(8112, "Electrocute"), r(8139, "Taste of Blood"), r(8140, "Grisly Mementos"), r(8106, "Ultimate Hunter")],
  secondaryStyle: STYLES.sorcery,
  secondary: [r(8226, "Manaflow Band"), r(8237, "Scorch")],
  shards: [SHARDS.attackSpeed, SHARDS.adaptive, SHARDS.healthScaling],
});

const sorceryComet = (label: string): PageTemplate => ({
  label,
  primaryStyle: STYLES.sorcery,
  primary: [r(8229, "Arcane Comet"), r(8226, "Manaflow Band"), r(8210, "Transcendence"), r(8237, "Scorch")],
  secondaryStyle: STYLES.inspiration,
  secondary: [r(8345, "Biscuit Delivery"), r(8347, "Cosmic Insight")],
  shards: [SHARDS.adaptive, SHARDS.adaptive, SHARDS.healthScaling],
});

const resolveSecond = (base: PageTemplate, label: string): PageTemplate => ({
  ...base,
  label,
  secondaryStyle: STYLES.resolve,
  secondary: [r(8444, "Second Wind"), r(8451, "Overgrowth")],
  shards: [base.shards[0], base.shards[1], SHARDS.health],
});

const conqueror = (label: string): PageTemplate => ({
  label,
  primaryStyle: STYLES.precision,
  primary: [r(8010, "Conqueror"), r(9111, "Triumph"), r(9104, "Legend: Alacrity"), r(8299, "Last Stand")],
  secondaryStyle: STYLES.resolve,
  secondary: [r(8444, "Second Wind"), r(8451, "Overgrowth")],
  shards: [SHARDS.attackSpeed, SHARDS.adaptive, SHARDS.healthScaling],
});

const grasp = (label: string): PageTemplate => ({
  label,
  primaryStyle: STYLES.resolve,
  primary: [r(8437, "Grasp of the Undying"), r(8446, "Demolish"), r(8444, "Second Wind"), r(8451, "Overgrowth")],
  secondaryStyle: STYLES.inspiration,
  secondary: [r(8304, "Magical Footwear"), r(8347, "Cosmic Insight")],
  shards: [SHARDS.haste, SHARDS.health, SHARDS.healthScaling],
});

const lethalTempo = (label: string): PageTemplate => ({
  label,
  primaryStyle: STYLES.precision,
  primary: [r(8008, "Lethal Tempo"), r(8009, "Presence of Mind"), r(9103, "Legend: Bloodline"), r(8017, "Cut Down")],
  secondaryStyle: STYLES.inspiration,
  secondary: [r(8345, "Biscuit Delivery"), r(8347, "Cosmic Insight")],
  shards: [SHARDS.attackSpeed, SHARDS.adaptive, SHARDS.healthScaling],
});

const firstStrike = (label: string): PageTemplate => ({
  label,
  primaryStyle: STYLES.inspiration,
  primary: [r(8369, "First Strike"), r(8304, "Magical Footwear"), r(8321, "Cash Back"), r(8347, "Cosmic Insight")],
  secondaryStyle: STYLES.sorcery,
  secondary: [r(8226, "Manaflow Band"), r(8237, "Scorch")],
  shards: [SHARDS.adaptive, SHARDS.adaptive, SHARDS.healthScaling],
});

const guardian = (label: string): PageTemplate => ({
  label,
  primaryStyle: STYLES.resolve,
  primary: [r(8465, "Guardian"), r(8463, "Font of Life"), r(8473, "Bone Plating"), r(8453, "Revitalize")],
  secondaryStyle: STYLES.inspiration,
  secondary: [r(8345, "Biscuit Delivery"), r(8347, "Cosmic Insight")],
  shards: [SHARDS.haste, SHARDS.health, SHARDS.healthScaling],
});

const RUNE_TEMPLATES: Record<Archetype, PageTemplate[]> = {
  mage: [domElectrocute("Most Popular"), sorceryComet("Scaling"), firstStrike("Highest Win Rate"), resolveSecond(domElectrocute(""), "Defensive")],
  assassin: [domElectrocute("Most Popular"), conqueror("Scaling"), firstStrike("Highest Win Rate"), resolveSecond(domElectrocute(""), "Defensive")],
  fighter: [conqueror("Most Popular"), grasp("Defensive"), resolveSecond(domElectrocute(""), "Aggressive"), firstStrike("Highest Win Rate")],
  tank: [grasp("Most Popular"), conqueror("Aggressive"), firstStrike("Scaling")],
  marksman: [lethalTempo("Most Popular"), conqueror("Scaling"), firstStrike("Highest Win Rate")],
  support: [guardian("Most Popular"), firstStrike("Aggressive"), sorceryComet("Poke")],
  jungle: [conqueror("Most Popular"), domElectrocute("Aggressive"), firstStrike("Scaling")],
};

const SPELLS = {
  flash: { id: "SummonerFlash", name: "Flash" },
  ignite: { id: "SummonerDot", name: "Ignite" },
  teleport: { id: "SummonerTeleport", name: "Teleport" },
  barrier: { id: "SummonerBarrier", name: "Barrier" },
  exhaust: { id: "SummonerExhaust", name: "Exhaust" },
  cleanse: { id: "SummonerBoost", name: "Cleanse" },
  heal: { id: "SummonerHeal", name: "Heal" },
  smite: { id: "SummonerSmite", name: "Smite" },
  ghost: { id: "SummonerHaste", name: "Ghost" },
};

const SPELL_SETS: Record<Archetype, { id: string; name: string }[][]> = {
  mage: [[SPELLS.flash, SPELLS.ignite], [SPELLS.flash, SPELLS.teleport], [SPELLS.flash, SPELLS.barrier]],
  assassin: [[SPELLS.flash, SPELLS.ignite], [SPELLS.flash, SPELLS.teleport]],
  fighter: [[SPELLS.flash, SPELLS.teleport], [SPELLS.flash, SPELLS.ignite], [SPELLS.ghost, SPELLS.teleport]],
  tank: [[SPELLS.flash, SPELLS.teleport], [SPELLS.flash, SPELLS.ignite]],
  marksman: [[SPELLS.flash, SPELLS.heal], [SPELLS.flash, SPELLS.cleanse], [SPELLS.flash, SPELLS.barrier]],
  support: [[SPELLS.flash, SPELLS.ignite], [SPELLS.flash, SPELLS.exhaust], [SPELLS.flash, SPELLS.heal]],
  jungle: [[SPELLS.flash, SPELLS.smite], [SPELLS.ghost, SPELLS.smite]],
};

// ---------------------------------------------------------------- generator

/** Splits 100% into `n` shares, the first one largest. */
function shares(rand: () => number, n: number): number[] {
  const weights = Array.from({ length: n }, (_, k) => (rand() + 0.3) / (k + 1) ** 1.6);
  const total = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => round((w / total) * 100));
}

function choice(rand: () => number, games: number, pickRate: number, baseWin: number) {
  const g = Math.max(1, Math.round((games * pickRate) / 100));
  // Small samples swing further from the matchup's base win rate.
  const spread = 2 + 18 / Math.sqrt(g);
  return { games: g, pickRate, winRate: round(baseWin + (rand() - 0.5) * spread) };
}

function sideStats(rand: () => number, winRate: number, lane: LaneSlug): SideStats {
  const csBase = lane === "jungle" ? 60 : lane === "support" ? 12 : 78;
  const csAt10 = round(csBase + rand() * 12);
  return {
    winRate,
    kills: round(3 + rand() * 5),
    deaths: round(3 + rand() * 3.5),
    assists: round(lane === "support" ? 10 + rand() * 6 : 4 + rand() * 4),
    cs: Math.round(csAt10 * (lane === "support" ? 3 : 2.6) + rand() * 30),
    csAt10,
    csAt15: round(csAt10 * 1.58 + rand() * 6),
    goldAt10: Math.round(3300 + rand() * 600),
    goldAt15: Math.round(5300 + rand() * 900),
    soloKillRate: round(10 + rand() * 25),
    firstBloodRate: round(12 + rand() * 20),
  };
}

const SKILL_PATTERNS: { maxOrder: string[]; start: ("Q" | "W" | "E")[] }[] = [
  { maxOrder: ["Q", "W", "E"], start: ["Q", "W", "E"] },
  { maxOrder: ["Q", "E", "W"], start: ["Q", "E", "W"] },
  { maxOrder: ["E", "Q", "W"], start: ["E", "Q", "W"] },
  { maxOrder: ["W", "Q", "E"], start: ["Q", "W", "E"] },
];

function levelsFor(maxOrder: string[], start: ("Q" | "W" | "E")[]): SkillOrder["levels"] {
  const levels: SkillOrder["levels"] = [...start];
  const points: Record<string, number> = { Q: 1, W: 1, E: 1, R: 0 };
  for (let level = 4; level <= 18; level++) {
    if ([6, 11, 16].includes(level)) {
      levels.push("R");
      points.R++;
      continue;
    }
    const next = maxOrder.find((s) => points[s] < 5)!;
    points[next]++;
    levels.push(next as "Q" | "W" | "E");
  }
  return levels;
}

export function getSampleMatchup(
  champion: Champion,
  opponent: Champion,
  lane: LaneSlug,
  filters: Filters,
): MatchupData {
  const rand = seededRandom(hash(`${champion.id}|${opponent.id}|${lane}|${filters.rank}|${filters.region}|${filters.patch}`));
  const type = archetypeOf(champion, lane);
  const pool = POOLS[type];

  const games = Math.round(400 + rand() * 4600);
  const winRate = round(44 + rand() * 12);
  const self = sideStats(rand, winRate, lane);
  const enemy = sideStats(rand, round(100 - winRate), lane);

  const templates = RUNE_TEMPLATES[type];
  const runeShares = shares(rand, templates.length);
  const runePages = templates.map((t, k) => ({ ...t, ...choice(rand, games, runeShares[k], winRate) }));
  // Label the real best performer instead of trusting the template.
  const best = runePages.slice(1).reduce((b, p) => (p.winRate > b.winRate ? p : b));
  for (const page of runePages) {
    if (page === best) page.label = "Highest Win Rate";
    else if (page.label === "Highest Win Rate") page.label = "Alternative";
  }

  const spellSets = SPELL_SETS[type];
  const spellShares = shares(rand, spellSets.length);
  const spells: SpellPair[] = spellSets.map((s, k) => ({ spells: s, ...choice(rand, games, spellShares[k], winRate) }));

  const skillShares = shares(rand, 2);
  const skillOrders: SkillOrder[] = [SKILL_PATTERNS[hash(champion.id) % 4], SKILL_PATTERNS[(hash(champion.id) + 1) % 4]].map(
    (p, k) => ({ maxOrder: p.maxOrder, levels: levelsFor(p.maxOrder, p.start), ...choice(rand, games, skillShares[k], winRate) }),
  );

  const startShares = shares(rand, pool.starts.length);
  const startingItems: ItemSet[] = pool.starts.map((items, k) => ({ items, ...choice(rand, games, startShares[k], winRate) }));

  const itemTimings: ItemTiming[] = pool.recall
    .map((item) => ({
      item,
      avgSeconds: Math.round(item.id === ITEMS.boots.id ? 290 + rand() * 90 : 330 + rand() * 150),
      firstRecallRate: round(15 + rand() * 60),
    }))
    .sort((a, b) => a.avgSeconds - b.avgSeconds);

  const build: BuildStep[] = [
    {
      label: "Başlangıç",
      options: startingItems.slice(0, 2).map((s) => ({ ...s, item: s.items[0] })),
    },
    {
      label: "İlk recall",
      options: itemTimings.slice(0, 3).map((t) => ({ item: t.item, ...choice(rand, games, t.firstRecallRate, winRate) })),
    },
    ...pool.core.slice(0, 3).map((slot, k) => {
      const s = shares(rand, slot.length);
      return {
        label: ["İlk item", "İkinci item", "Üçüncü item"][k],
        options: slot.map((item, j) => ({ item, ...choice(rand, games, s[j], winRate) })),
      };
    }),
    {
      label: "Ayakkabı",
      options: pool.boots.map((item, j) => ({ item, ...choice(rand, games, j === 0 ? 70 : 25, winRate) })),
    },
  ];
  const lateShares = shares(rand, pool.core[3].length);
  build.push({
    label: "Full build (4.-6. item)",
    options: pool.core[3].map((item, j) => ({ item, ...choice(rand, games, lateShares[j], winRate) })),
  });

  const insights: ItemInsight[] = pool.defensive.map((item, k) => {
    const withGames = Math.round(games * (0.12 + rand() * 0.25));
    const gain = round(1 + rand() * 4.5);
    return {
      item,
      condition: k === 0 ? "10. dakikadan önce alındığında" : "İlk iki item içinde alındığında",
      withItem: { games: withGames, winRate: round(winRate + gain / 2) },
      withoutItem: { games: games - withGames, winRate: round(winRate - gain / 2) },
      note: `${opponent.name} karşısında erken alınan ${item.name} ile kazanma oranı arasındaki fark.`,
    };
  });

  return {
    champion,
    opponent,
    lane,
    filters,
    isSample: true,
    games,
    avgDurationSeconds: Math.round(1560 + rand() * 360),
    self,
    enemy,
    runePages,
    spells,
    skillOrders,
    startingItems,
    itemTimings,
    build,
    insights,
  };
}
