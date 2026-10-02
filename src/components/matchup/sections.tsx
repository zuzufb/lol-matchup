import Image from "next/image";
import { spellIcon } from "@/lib/ddragon";
import { formatTime, num, pct, signed } from "@/lib/format";
import type { MatchupData, Rune, SideStats } from "@/lib/types";
import { ChoiceStats, ItemIcon, Section, winColor } from "./ui";

// ---------------------------------------------------------------- stats

const STAT_ROWS: { label: string; get: (s: SideStats) => number; format: (n: number) => string }[] = [
  { label: "Win rate", get: (s) => s.winRate, format: pct },
  { label: "KDA", get: (s) => (s.kills + s.assists) / Math.max(1, s.deaths), format: (n) => n.toFixed(2) },
  { label: "Kill / Death / Assist", get: (s) => s.kills, format: (n) => n.toFixed(1) },
  { label: "Ortalama CS", get: (s) => s.cs, format: (n) => n.toFixed(0) },
  { label: "CS @ 10", get: (s) => s.csAt10, format: (n) => n.toFixed(1) },
  { label: "CS @ 15", get: (s) => s.csAt15, format: (n) => n.toFixed(1) },
  { label: "Gold @ 10", get: (s) => s.goldAt10, format: num },
  { label: "Gold @ 15", get: (s) => s.goldAt15, format: num },
  { label: "Solo kill oranı", get: (s) => s.soloKillRate, format: pct },
  { label: "First Blood oranı", get: (s) => s.firstBloodRate, format: pct },
];

export function StatsSection({ data }: { data: MatchupData }) {
  const { self, enemy, champion, opponent } = data;
  const tiles = [
    { label: "Analiz edilen maç", value: num(data.games) },
    { label: "Ortalama süre", value: formatTime(data.avgDurationSeconds) },
    { label: "Gold farkı @ 10", value: signed(self.goldAt10 - enemy.goldAt10), tone: self.goldAt10 - enemy.goldAt10 },
    { label: "Gold farkı @ 15", value: signed(self.goldAt15 - enemy.goldAt15), tone: self.goldAt15 - enemy.goldAt15 },
    { label: "CS farkı @ 15", value: signed(self.csAt15 - enemy.csAt15, 1), tone: self.csAt15 - enemy.csAt15 },
    { label: "Kill farkı", value: signed(self.kills - enemy.kills, 1), tone: self.kills - enemy.kills },
  ];

  return (
    <Section title="Matchup istatistikleri" subtitle={`${champion.name} oyuncularının ${opponent.name} karşısındaki ortalamaları`}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-lg bg-surface-2 p-3">
            <div className="text-[11px] uppercase text-muted">{t.label}</div>
            <div
              className={`mt-1 text-xl font-bold tabular-nums ${
                t.tone === undefined ? "" : t.tone > 0 ? "text-win" : t.tone < 0 ? "text-lose" : ""
              }`}
            >
              {t.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm tabular-nums">
          <thead>
            <tr className="text-muted">
              <th className="py-2 text-left font-medium">{champion.name}</th>
              <th className="py-2 text-center font-medium" />
              <th className="py-2 text-right font-medium">{opponent.name}</th>
            </tr>
          </thead>
          <tbody>
            {STAT_ROWS.map((row) => {
              const a = row.get(self);
              const b = row.get(enemy);
              const kda = row.label === "Kill / Death / Assist";
              return (
                <tr key={row.label} className="border-t border-border">
                  <td className={`py-2 font-semibold ${a > b ? "text-win" : ""}`}>
                    {kda ? `${self.kills} / ${self.deaths} / ${self.assists}` : row.format(a)}
                  </td>
                  <td className="py-2 text-center text-muted">{row.label}</td>
                  <td className={`py-2 text-right font-semibold ${b > a ? "text-win" : ""}`}>
                    {kda ? `${enemy.kills} / ${enemy.deaths} / ${enemy.assists}` : row.format(b)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------- runes

function RuneIcon({ rune, icons, size }: { rune: Rune; icons: Record<number, string>; size: number }) {
  const src = icons[rune.id];
  return src ? (
    <Image src={src} alt={rune.name} title={rune.name} width={size} height={size} />
  ) : (
    <div
      title={rune.name}
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded-full bg-surface-2 text-[9px] text-muted"
    >
      {rune.name.slice(0, 2)}
    </div>
  );
}

export function RunesSection({ data, runeIcons }: { data: MatchupData; runeIcons: Record<number, string> }) {
  return (
    <Section title="Rune sayfaları" subtitle={`Bu matchup'ta kullanılan rune kombinasyonları`}>
      <div className="grid gap-3 lg:grid-cols-2">
        {data.runePages.map((page, k) => (
          <div key={k} className={`rounded-lg border p-3 ${k === 0 ? "border-gold/60 bg-gold/5" : "border-border"}`}>
            <div className="flex items-start justify-between gap-2">
              <span className={`rounded px-2 py-0.5 text-xs font-semibold ${k === 0 ? "bg-gold text-background" : "bg-surface-2"}`}>
                {page.label}
              </span>
              <ChoiceStats choice={page} />
            </div>
            <div className="mt-3 flex items-center gap-3">
              <RuneIcon rune={page.primary[0]} icons={runeIcons} size={48} />
              <div>
                <div className="font-semibold">{page.primary[0].name}</div>
                <div className="text-xs text-muted">
                  {page.primaryStyle.name} + {page.secondaryStyle.name}
                </div>
              </div>
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {[...page.primary.slice(1), ...page.secondary, ...page.shards].map((rune, j) => (
                <li key={j} className="flex items-center gap-2">
                  <RuneIcon rune={rune} icons={runeIcons} size={20} />
                  <span className={j >= 5 ? "text-muted" : ""}>{rune.name}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------- spells & skills

export function SpellsSkillsSection({ data, version }: { data: MatchupData; version: string }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Section title="Summoner spell'ler">
        <ul className="space-y-2">
          {data.spells.map((s, k) => (
            <li key={k} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {s.spells.map((spell) => (
                  <Image
                    key={spell.id}
                    src={spellIcon(version, spell.id)}
                    alt={spell.name}
                    title={spell.name}
                    width={32}
                    height={32}
                    className="rounded"
                  />
                ))}
                <span className="text-sm">{s.spells.map((x) => x.name).join(" + ")}</span>
              </div>
              <ChoiceStats choice={s} />
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Skill order">
        <div className="space-y-4">
          {data.skillOrders.map((order, k) => (
            <div key={k}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 font-semibold">
                  {order.maxOrder.map((s, j) => (
                    <span key={s} className="flex items-center gap-1">
                      <span className="rounded bg-surface-2 px-2 py-0.5">{s}</span>
                      {j < order.maxOrder.length - 1 && <span className="text-muted">›</span>}
                    </span>
                  ))}
                </div>
                <ChoiceStats choice={order} />
              </div>
              <div className="mt-2 grid grid-cols-[repeat(18,minmax(0,1fr))] gap-0.5 text-center text-[10px]">
                {order.levels.map((s, lvl) => (
                  <div
                    key={lvl}
                    title={`Seviye ${lvl + 1}`}
                    className={`rounded py-1 font-semibold ${s === "R" ? "bg-gold text-background" : "bg-surface-2"}`}
                  >
                    {s}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------- items

export function ItemsSection({ data, version }: { data: MatchupData; version: string }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Section title="Başlangıç item'ları">
        <ul className="space-y-3">
          {data.startingItems.map((set, k) => (
            <li key={k} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                {set.items.map((item, j) => (
                  <ItemIcon key={j} item={item} version={version} />
                ))}
                <span className="ml-2 text-sm">{set.items[0].name}</span>
              </div>
              <ChoiceStats choice={set} />
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Item zamanlaması" subtitle="Ortalama satın alma süresi ve ilk recall'da alınma oranı">
        <ul className="space-y-2">
          {data.itemTimings.map((t) => (
            <li key={t.item.id} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ItemIcon item={t.item} version={version} size={32} />
                <span className="text-sm">{t.item.name}</span>
              </div>
              <div className="flex gap-4 text-right text-sm tabular-nums">
                <div>
                  <div className="font-semibold">{formatTime(t.avgSeconds)}</div>
                  <div className="text-[11px] uppercase text-muted">Ort. alım</div>
                </div>
                <div className="min-w-14">
                  <div className="font-semibold">{pct(t.firstRecallRate)}</div>
                  <div className="text-[11px] uppercase text-muted">1. recall</div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

export function BuildSection({ data, version }: { data: MatchupData; version: string }) {
  return (
    <Section title="Build sırası" subtitle="Her aşamada en çok tercih edilen item'lar">
      <ol className="relative space-y-4 border-l border-border pl-5">
        {data.build.map((step, k) => (
          <li key={k} className="relative">
            <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-gold bg-background" />
            <div className="text-xs font-semibold uppercase tracking-wider text-gold">{step.label}</div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {step.options.map((o, j) => (
                <div key={j} className="flex items-center justify-between gap-2 rounded-lg bg-surface-2 p-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <ItemIcon item={o.item} version={version} size={32} />
                    <span className="truncate text-sm">{o.item.name}</span>
                  </div>
                  <div className="text-right text-xs tabular-nums">
                    <div className={`font-semibold ${winColor(o.winRate)}`}>{pct(o.winRate)}</div>
                    <div className="text-muted">{pct(o.pickRate)} pick</div>
                  </div>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

export function InsightsSection({ data, version }: { data: MatchupData; version: string }) {
  return (
    <Section
      title={`${data.opponent.name} karşısında item önerileri`}
      subtitle="Teorik değil: item'ı alan ve almayan oyuncuların bu matchup'taki sonuçları karşılaştırılır"
    >
      {data.insights.length === 0 && (
        <p className="text-sm text-muted">
          Bu matchup&apos;ta erken alınan item&apos;lar champion&apos;ın genel tercihlerinden belirgin şekilde farklı değil.
        </p>
      )}
      <div className="grid gap-3 lg:grid-cols-2">
        {data.insights.map((ins) => {
          const diff = ins.withItem.winRate - ins.withoutItem.winRate;
          return (
            <div key={ins.item.id} className="rounded-lg border border-border p-3">
              <div className="flex items-center gap-3">
                <ItemIcon item={ins.item} version={version} size={44} />
                <div>
                  <div className="font-semibold">{ins.item.name}</div>
                  <div className="text-xs text-muted">{ins.condition}</div>
                </div>
                <div className={`ml-auto text-lg font-bold ${diff > 0 ? "text-win" : "text-lose"}`}>
                  {signed(diff, 1)} puan
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm tabular-nums">
                <div className="rounded bg-surface-2 p-2">
                  <div className="text-[11px] uppercase text-muted">Alanlar</div>
                  <div className={`font-semibold ${winColor(ins.withItem.winRate)}`}>{pct(ins.withItem.winRate)} win</div>
                  <div className="text-xs text-muted">{num(ins.withItem.games)} maç</div>
                </div>
                <div className="rounded bg-surface-2 p-2">
                  <div className="text-[11px] uppercase text-muted">Almayanlar</div>
                  <div className={`font-semibold ${winColor(ins.withoutItem.winRate)}`}>{pct(ins.withoutItem.winRate)} win</div>
                  <div className="text-xs text-muted">{num(ins.withoutItem.games)} maç</div>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted">{ins.note}</p>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
