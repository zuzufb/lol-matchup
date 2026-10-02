import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChampionIcon } from "@/components/ChampionIcon";
import { FiltersBar } from "@/components/matchup/FiltersBar";
import {
  BuildSection,
  InsightsSection,
  ItemsSection,
  RunesSection,
  SpellsSkillsSection,
  StatsSection,
} from "@/components/matchup/sections";
import { DEFAULT_RANK, DEFAULT_REGION, LANES, RANKS, REGIONS, isLane, laneLabel } from "@/lib/constants";
import {
  championSplash,
  getChampionBySlug,
  getLatestVersion,
  getRecentPatches,
  getRuneIcons,
  patchLabel,
} from "@/lib/ddragon";
import { pct } from "@/lib/format";
import { getMatchup, matchupPath, parseMatchupSlug } from "@/lib/matchup";
import type { Filters } from "@/lib/types";

type Props = PageProps<"/matchup/[matchup]/[lane]">;

async function resolve(params: Props["params"]) {
  const { matchup, lane } = await params;
  const slugs = parseMatchupSlug(matchup);
  if (!slugs || !isLane(lane)) return null;
  const [champion, opponent] = await Promise.all(slugs.map(getChampionBySlug));
  if (!champion || !opponent || champion.id === opponent.id) return null;
  return { champion, opponent, lane };
}

function pickFilter(value: string | string[] | undefined, allowed: readonly string[], fallback: string) {
  const v = Array.isArray(value) ? value[0] : value;
  return v && allowed.includes(v) ? v : fallback;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const m = await resolve(params);
  if (!m) return {};
  const title = `${m.champion.name} vs ${m.opponent.name} ${laneLabel(m.lane)}`;
  return {
    title,
    description: `${m.champion.name} vs ${m.opponent.name} ${laneLabel(m.lane)} lane matchup: win rate, rune'lar, item build, item zamanlaması, skill order ve lane istatistikleri.`,
    alternates: { canonical: matchupPath(m.champion.slug, m.opponent.slug, m.lane) },
  };
}

export default async function MatchupPage({ params, searchParams }: Props) {
  const m = await resolve(params);
  if (!m) notFound();
  const { champion, opponent, lane } = m;

  const [version, patches, runeIcons, query] = await Promise.all([
    getLatestVersion(),
    getRecentPatches(),
    getRuneIcons(),
    searchParams,
  ]);

  const filters: Filters = {
    rank: pickFilter(query.rank, RANKS.map((r) => r.value), DEFAULT_RANK),
    region: pickFilter(query.region, REGIONS.map((r) => r.value), DEFAULT_REGION),
    patch: pickFilter(query.patch, patches, patches[0]),
  };
  const data = await getMatchup(champion, opponent, lane, filters);
  const favored = data.self.winRate >= data.enemy.winRate ? champion : opponent;
  const edge = Math.abs(data.self.winRate - 50);

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-xl border border-border">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${championSplash(champion.id)})` }}
        />
        <div className="relative space-y-4 bg-gradient-to-r from-background/90 to-background/40 p-5">
          <div className="flex flex-wrap items-center gap-4">
            <ChampionIcon champion={champion} version={version} size={72} className="ring-2 ring-blue" />
            <div className="text-center">
              <div className="text-sm font-bold text-gold">VS</div>
            </div>
            <ChampionIcon champion={opponent} version={version} size={72} className="ring-2 ring-lose" />
            <div>
              <h1 lang="en" className="text-2xl font-bold uppercase sm:text-3xl">
                {champion.name} vs {opponent.name}
              </h1>
              <div lang="en" className="text-sm font-semibold uppercase tracking-wider text-muted">{laneLabel(lane)} lane</div>
            </div>
            <div className="ml-auto flex gap-6 text-right tabular-nums">
              <div>
                <div className="text-2xl font-bold text-blue">{pct(data.self.winRate)}</div>
                <div className="text-xs text-muted">{champion.name} win rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-lose">{pct(data.enemy.winRate)}</div>
                <div className="text-xs text-muted">{opponent.name} win rate</div>
              </div>
            </div>
          </div>
          <p className="text-sm">
            {edge < 1 ? (
              <>Bu matchup dengeli görünüyor.</>
            ) : (
              <>
                <span className="font-semibold text-gold">{favored.name}</span> bu matchup’ta avantajlı (
                {pct(Math.max(data.self.winRate, data.enemy.winRate))} win rate).
              </>
            )}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Suspense>
              <FiltersBar
                filters={filters}
                patches={patches.map((p) => ({ value: p, label: `Patch ${patchLabel(p)}` }))}
              />
            </Suspense>
            <div className="flex flex-wrap gap-1 text-sm">
              {LANES.map((l) => (
                <Link
                  key={l.slug}
                  href={matchupPath(champion.slug, opponent.slug, l.slug)}
                  className={`rounded-md px-2.5 py-1 ${l.slug === lane ? "bg-gold text-background" : "bg-surface-2 text-muted hover:text-foreground"}`}
                >
                  {l.label}
                </Link>
              ))}
              <Link
                href={matchupPath(opponent.slug, champion.slug, lane)}
                className="rounded-md bg-surface-2 px-2.5 py-1 text-muted hover:text-foreground"
                title="Rakibin tarafından bak"
              >
                ⇄ Ters çevir
              </Link>
            </div>
          </div>
        </div>
      </div>

      {data.isSample && (
        <div className="rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm">
          <span className="font-semibold text-gold">Örnek veri:</span> Bu sayfadaki sayılar tasarımı göstermek için
          üretildi. Riot API’den gerçek maç verisi toplanmaya başlayınca gerçek değerlerle değişecek.
        </div>
      )}

      <StatsSection data={data} />
      <RunesSection data={data} runeIcons={runeIcons} />
      <SpellsSkillsSection data={data} version={version} />
      <ItemsSection data={data} version={version} />
      <BuildSection data={data} version={version} />
      <InsightsSection data={data} version={version} />
    </div>
  );
}
