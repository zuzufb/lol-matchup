# LoL Matchup

League of Legends matchup analizi: bir champion, lane ve rakip seçildiğinde o matchup'ta oynanmış maçlardan
win rate, lane istatistikleri, rune'lar, item build, item zamanlaması, summoner spell'ler, skill order ve
veriye dayalı item önerileri gösterir.

Örnek sayfa: `/matchup/ahri-vs-zed/mid?rank=emerald_plus&region=euw`

## Nasıl çalışıyor

1. **Collector** (`collector/`): GitHub Actions her saat başı çalıştırır (`.github/workflows/collect.yml`).
   EUW ladder'ından (Gold'dan Challenger'a) oyuncuları bulur, ranked solo maçlarını ve timeline'larını
   Riot API'den (Match-V5) çeker ve PostgreSQL'e yazar. Rate limit'e kendisi uyar.
2. **Site** (`src/`): matchup sayfası veritabanındaki maçlardan istatistikleri hesaplar. Seçilen filtrelerle
   20'den az maç varsa örnek veri gösterir ve bunu sayfada belirtir.

## Kurulum

GitHub reposunda **Settings → Secrets and variables → Actions** altına iki secret eklenir:

- `RIOT_API_KEY`: developer.riotgames.com'dan alınan anahtar. Development key 24 saatte bir yenilenmeli.
- `DATABASE_URL`: PostgreSQL bağlantı adresi (ör. Neon). Aynı değer Vercel'de de ortam değişkeni olmalı.

Collector'ı elle başlatmak için: **Actions → Collect matches → Run workflow**.

## Bilgisayarda çalıştırma

```bash
npm install
cp .env.example .env.local   # RIOT_API_KEY ve DATABASE_URL değerlerini doldur
npm run dev                  # site: http://localhost:3000
npm run collect -- --minutes 5
npm test                     # TEST_DATABASE_URL verilirse veritabanı testi de çalışır
```

## Yapı

- `src/app/page.tsx`: ana sayfa (champion, lane ve rakip seçimi)
- `src/app/matchup/[matchup]/[lane]/page.tsx`: matchup sayfası
- `src/lib/ddragon.ts`: Data Dragon (champion, rune, item ikonları, patch listesi)
- `src/lib/types.ts`: matchup verisinin şekli (veritabanı da bu şekle göre doldurulacak)
- `src/lib/db-matchup.ts`, `src/lib/aggregate.ts`: veritabanından matchup istatistikleri
- `src/lib/sample-data.ts`: yeterli maç olmadığında gösterilen örnek veri
- `collector/`: Riot API'den maç toplayan program ve veritabanı şeması (`schema.sql`)

LoL Matchup is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or
anyone officially involved in producing or managing Riot Games properties.
