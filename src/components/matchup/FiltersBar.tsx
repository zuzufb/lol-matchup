"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RANKS, REGIONS } from "@/lib/constants";
import type { Filters } from "@/lib/types";

export function FiltersBar({
  filters,
  patches,
}: {
  filters: Filters;
  patches: { value: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(key: keyof Filters, value: string) {
    const params = new URLSearchParams(searchParams);
    params.set(key, value);
    router.replace(`${pathname}?${params}`, { scroll: false });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Select label="Rank" value={filters.rank} options={RANKS} onChange={(v) => update("rank", v)} />
      <Select label="Bölge" value={filters.region} options={REGIONS} onChange={(v) => update("region", v)} />
      <Select label="Patch" value={filters.patch} options={patches} onChange={(v) => update("patch", v)} />
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm">
      <span className="text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent font-medium outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-surface">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
