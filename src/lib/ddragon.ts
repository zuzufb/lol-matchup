import { FALLBACK_CHAMPIONS } from "./fallback-champions";
import type { Champion } from "./types";

// Data Dragon is Riot's free static data CDN (no API key needed).
// https://developer.riotgames.com/docs/lol#data-dragon
const BASE = "https://ddragon.leagueoflegends.com";
const FALLBACK_VERSION = "16.19.1";
const ONE_DAY = 60 * 60 * 24;

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate: ONE_DAY } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function getVersions(): Promise<string[]> {
  const versions = await getJson<string[]>(`${BASE}/api/versions.json`);
  return versions?.length ? versions : [FALLBACK_VERSION];
}

export async function getLatestVersion(): Promise<string> {
  return (await getVersions())[0];
}

/** The most recent `count` patches as "major.minor" (e.g. "16.19"), newest first. */
export async function getRecentPatches(count = 6): Promise<string[]> {
  const seen = new Set<string>();
  for (const v of await getVersions()) {
    if (!/^\d+\.\d+\.\d+$/.test(v)) continue; // skip "lolpatch_*" entries
    seen.add(v.split(".").slice(0, 2).join("."));
    if (seen.size === count) break;
  }
  return [...seen];
}

/**
 * Data Dragon versions run 10 behind the in-game patch name since Riot
 * switched to year-based patches in 2025 (Data Dragon 16.19 = patch 26.19).
 */
export function patchLabel(patch: string): string {
  const [major, minor] = patch.split(".").map(Number);
  return major >= 15 ? `${major + 10}.${minor}` : patch;
}

export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface DDragonChampionFile {
  data: Record<string, { id: string; key: string; name: string; tags: string[] }>;
}

export async function getChampions(): Promise<Champion[]> {
  const version = await getLatestVersion();
  const file = await getJson<DDragonChampionFile>(
    `${BASE}/cdn/${version}/data/en_US/champion.json`,
  );
  const raw = file ? Object.values(file.data) : FALLBACK_CHAMPIONS;
  return raw
    .map(({ id, key, name, tags }) => ({ id, key, name, tags, slug: slugify(name) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getChampionBySlug(slug: string): Promise<Champion | undefined> {
  return (await getChampions()).find((c) => c.slug === slug);
}

interface DDragonRuneTree {
  id: number;
  name: string;
  icon: string;
  slots: { runes: { id: number; name: string; icon: string }[] }[];
}

export interface RuneData {
  icons: Record<number, string>;
  names: Record<number, string>;
}

/** Rune and rune tree names and icon URLs by id. Empty if Data Dragon is unreachable. */
export async function getRuneData(): Promise<RuneData> {
  const version = await getLatestVersion();
  const trees = await getJson<DDragonRuneTree[]>(
    `${BASE}/cdn/${version}/data/en_US/runesReforged.json`,
  );
  const data: RuneData = { icons: {}, names: {} };
  for (const tree of trees ?? []) {
    data.icons[tree.id] = `${BASE}/cdn/img/${tree.icon}`;
    data.names[tree.id] = tree.name;
    for (const slot of tree.slots) {
      for (const rune of slot.runes) {
        data.icons[rune.id] = `${BASE}/cdn/img/${rune.icon}`;
        data.names[rune.id] = rune.name;
      }
    }
  }
  return data;
}

interface DDragonItem {
  name: string;
  into?: string[];
  from?: string[];
  tags?: string[];
  depth?: number;
  gold: { total: number; purchasable: boolean };
  maps: Record<string, boolean>;
  consumed?: boolean;
}

export interface ItemInfo {
  name: string;
  /** A finished legendary item (counts toward "1st item, 2nd item, ..."). */
  completed: boolean;
  /** Tier 2 boots, e.g. Sorcerer's Shoes. */
  boots: boolean;
  /** Potions, wards, trinkets: left out of build analysis. */
  consumable: boolean;
}

export async function getItems(): Promise<Record<number, ItemInfo>> {
  const version = await getLatestVersion();
  const file = await getJson<{ data: Record<string, DDragonItem> }>(
    `${BASE}/cdn/${version}/data/en_US/item.json`,
  );
  const all = file?.data ?? {};
  const purchasable = (id: string) => Boolean(all[id]?.gold.purchasable);
  const items: Record<number, ItemInfo> = {};
  for (const [id, item] of Object.entries(all)) {
    if (!item.maps?.["11"]) continue; // Summoner's Rift only
    const tags = item.tags ?? [];
    const boots = tags.includes("Boots") && id !== "1001" && (item.depth ?? 1) === 2;
    const consumable =
      Boolean(item.consumed) ||
      tags.includes("Consumable") ||
      tags.includes("Trinket") ||
      (tags.includes("Vision") && item.gold.total <= 100);
    items[Number(id)] = {
      name: item.name,
      boots,
      consumable,
      // Items like Manamune only "build into" a transformed, unbuyable form.
      completed:
        !boots &&
        !consumable &&
        item.gold.purchasable &&
        item.gold.total >= 2200 &&
        !(item.into ?? []).some(purchasable),
    };
  }
  return items;
}

export const championIcon = (version: string, championId: string) =>
  `${BASE}/cdn/${version}/img/champion/${championId}.png`;

export const championSplash = (championId: string) =>
  `${BASE}/cdn/img/champion/splash/${championId}_0.jpg`;

export const itemIcon = (version: string, itemId: number) =>
  `${BASE}/cdn/${version}/img/item/${itemId}.png`;

export const spellIcon = (version: string, spellId: string) =>
  `${BASE}/cdn/${version}/img/spell/${spellId}.png`;
