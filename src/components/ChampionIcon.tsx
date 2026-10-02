import Image from "next/image";
import { championIcon } from "@/lib/ddragon";
import type { Champion } from "@/lib/types";

export function ChampionIcon({
  champion,
  version,
  size = 48,
  className = "",
}: {
  champion: Pick<Champion, "id" | "name">;
  version: string;
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={championIcon(version, champion.id)}
      alt={champion.name}
      width={size}
      height={size}
      className={`rounded-md bg-surface-2 ${className}`}
    />
  );
}
