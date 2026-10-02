import Image from "next/image";
import { itemIcon } from "@/lib/ddragon";
import { num, pct } from "@/lib/format";
import type { Choice, Item } from "@/lib/types";

export function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function ItemIcon({ item, version, size = 36 }: { item: Item; version: string; size?: number }) {
  return (
    <Image
      src={itemIcon(version, item.id)}
      alt={item.name}
      title={item.name}
      width={size}
      height={size}
      className="rounded border border-border bg-surface-2"
    />
  );
}

export function winColor(winRate: number) {
  if (winRate >= 51) return "text-win";
  if (winRate <= 49) return "text-lose";
  return "text-foreground";
}

/** Pick rate / win rate / games, the trio shown next to every option. */
export function ChoiceStats({ choice }: { choice: Choice }) {
  return (
    <div className="flex gap-4 text-right text-sm tabular-nums">
      <Stat label="Pick" value={pct(choice.pickRate)} />
      <Stat label="Win" value={pct(choice.winRate)} className={winColor(choice.winRate)} />
      <Stat label="Maç" value={num(choice.games)} />
    </div>
  );
}

function Stat({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className="min-w-14">
      <div className={`font-semibold ${className}`}>{value}</div>
      <div lang="en" className="text-[11px] uppercase text-muted">{label}</div>
    </div>
  );
}
