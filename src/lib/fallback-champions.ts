import type { Champion } from "./types";

// Used only when Data Dragon cannot be reached (offline development).
// The live site always loads the full champion list from Data Dragon.
const RAW: [id: string, key: string, name: string, tags: string[]][] = [
  ["Ahri", "103", "Ahri", ["Mage", "Assassin"]],
  ["Zed", "238", "Zed", ["Assassin"]],
  ["Yasuo", "157", "Yasuo", ["Fighter", "Assassin"]],
  ["Syndra", "134", "Syndra", ["Mage"]],
  ["Orianna", "61", "Orianna", ["Mage"]],
  ["Darius", "122", "Darius", ["Fighter", "Tank"]],
  ["Garen", "86", "Garen", ["Fighter", "Tank"]],
  ["Malphite", "54", "Malphite", ["Tank", "Mage"]],
  ["LeeSin", "64", "Lee Sin", ["Fighter", "Assassin"]],
  ["Graves", "104", "Graves", ["Marksman"]],
  ["MonkeyKing", "62", "Wukong", ["Fighter", "Tank"]],
  ["Jinx", "222", "Jinx", ["Marksman"]],
  ["Caitlyn", "51", "Caitlyn", ["Marksman"]],
  ["Thresh", "412", "Thresh", ["Support", "Fighter"]],
  ["Lulu", "117", "Lulu", ["Support", "Mage"]],
  ["KSante", "897", "K'Sante", ["Tank", "Fighter"]],
];

export const FALLBACK_CHAMPIONS: Omit<Champion, "slug">[] = RAW.map(
  ([id, key, name, tags]) => ({ id, key, name, tags }),
);
