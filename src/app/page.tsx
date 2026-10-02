import { MatchupPicker } from "@/components/MatchupPicker";
import { getChampions, getLatestVersion } from "@/lib/ddragon";

export default async function Home() {
  const [champions, version] = await Promise.all([getChampions(), getLatestVersion()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Matchup analizi</h1>
        <p className="mt-1 text-muted">
          Champion’ını, lane’ini ve rakibini seç. O matchup’ta oynanmış maçlardan rune, item, item
          zamanlaması ve lane istatistiklerini gör.
        </p>
      </div>
      <MatchupPicker champions={champions} version={version} />
    </div>
  );
}
