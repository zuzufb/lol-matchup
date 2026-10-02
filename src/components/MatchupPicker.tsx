"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LANES, type LaneSlug } from "@/lib/constants";
import { matchupPath } from "@/lib/paths";
import type { Champion } from "@/lib/types";
import { ChampionIcon } from "./ChampionIcon";

type Step = "champion" | "opponent";

export function MatchupPicker({ champions, version }: { champions: Champion[]; version: string }) {
  const router = useRouter();
  const [champion, setChampion] = useState<Champion | null>(null);
  const [opponent, setOpponent] = useState<Champion | null>(null);
  const [lane, setLane] = useState<LaneSlug>("mid");
  const [step, setStep] = useState<Step>("champion");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? champions.filter((c) => c.name.toLowerCase().includes(q)) : champions;
  }, [champions, query]);

  function pick(c: Champion) {
    if (step === "champion") {
      setChampion(c);
      if (opponent?.id === c.id) setOpponent(null);
      setStep("opponent");
    } else {
      if (c.id === champion?.id) return;
      setOpponent(c);
    }
    setQuery("");
  }

  const ready = champion && opponent;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-xl border border-border bg-surface p-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <Slot
          label="Champion"
          champion={champion}
          version={version}
          active={step === "champion"}
          onClick={() => setStep("champion")}
        />
        <div className="flex flex-col items-center gap-3">
          <span className="text-sm font-bold text-gold">VS</span>
          <div className="flex flex-wrap justify-center gap-1">
            {LANES.map((l) => (
              <button
                key={l.slug}
                onClick={() => setLane(l.slug)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  lane === l.slug ? "bg-gold text-background" : "bg-surface-2 text-muted hover:text-foreground"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
        <Slot
          label="Opponent"
          champion={opponent}
          version={version}
          active={step === "opponent"}
          onClick={() => champion && setStep("opponent")}
        />
        <button
          disabled={!ready}
          onClick={() => ready && router.push(matchupPath(champion.slug, opponent.slug, lane))}
          className="rounded-lg bg-gold px-6 py-3 font-semibold text-background transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 sm:col-span-3"
        >
          {ready ? `${champion.name} vs ${opponent.name} analizini aç` : "Champion ve rakip seç"}
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">
            {step === "champion" ? "1. Champion'ını seç" : `2. ${champion?.name} için rakibi seç`}
          </h2>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Champion ara..."
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-gold sm:w-64"
          />
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-2">
          {filtered.map((c) => {
            const selected = c.id === champion?.id || c.id === opponent?.id;
            const disabled = step === "opponent" && c.id === champion?.id;
            return (
              <button
                key={c.id}
                onClick={() => pick(c)}
                disabled={disabled}
                className={`group flex flex-col items-center gap-1 rounded-lg p-1.5 transition ${
                  selected ? "bg-gold/20 ring-1 ring-gold" : "hover:bg-surface-2"
                } disabled:opacity-30`}
              >
                <ChampionIcon champion={c} version={version} size={56} />
                <span className="w-full truncate text-center text-[11px] text-muted group-hover:text-foreground">
                  {c.name}
                </span>
              </button>
            );
          })}
        </div>
        {filtered.length === 0 && <p className="text-sm text-muted">Champion bulunamadı.</p>}
      </div>
    </div>
  );
}

function Slot({
  label,
  champion,
  version,
  active,
  onClick,
}: {
  label: string;
  champion: Champion | null;
  version: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg border p-3 text-left transition ${
        active ? "border-gold bg-surface-2" : "border-border hover:border-muted"
      }`}
    >
      {champion ? (
        <ChampionIcon champion={champion} version={version} size={56} />
      ) : (
        <div className="h-14 w-14 rounded-md border border-dashed border-border" />
      )}
      <div>
        <div lang="en" className="text-xs uppercase tracking-wider text-muted">{label}</div>
        <div className="text-lg font-semibold">{champion?.name ?? "Seçilmedi"}</div>
      </div>
    </button>
  );
}
