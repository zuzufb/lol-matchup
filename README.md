# LoL Matchup

League of Legends matchup analizi: bir champion, lane ve rakip seçildiğinde o matchup'ta oynanmış maçlardan
win rate, lane istatistikleri, rune'lar, item build, item zamanlaması, summoner spell'ler, skill order ve
veriye dayalı item önerileri gösterir.

Örnek sayfa: `/matchup/ahri-vs-zed/mid?rank=emerald_plus&region=euw`

## Durum

**1. aşama (şu an):** Arayüz hazır. Champion listesi ve ikonlar Riot'un ücretsiz
[Data Dragon](https://developer.riotgames.com/docs/lol#data-dragon) verisinden geliyor. Matchup sayıları
şimdilik **örnek veri** (`src/lib/sample-data.ts`).

**2. aşama:** Riot API'den (Match-V5 + timeline) gerçek maç verisi toplayan bir collector ve PostgreSQL.
`src/lib/matchup.ts` içindeki `getMatchup` o zaman veritabanını okuyacak; sayfalar değişmeden kalacak.

## Çalıştırma

```bash
npm install
npm run dev
```

Sonra http://localhost:3000 adresini aç.

Riot API anahtarı (2. aşamada gerekecek) `.env.local` dosyasına yazılır, GitHub'a gönderilmez:

```bash
cp .env.example .env.local   # sonra RIOT_API_KEY=... satırını doldur
```

## Yapı

- `src/app/page.tsx`: ana sayfa (champion, lane ve rakip seçimi)
- `src/app/matchup/[matchup]/[lane]/page.tsx`: matchup sayfası
- `src/lib/ddragon.ts`: Data Dragon (champion, rune, item ikonları, patch listesi)
- `src/lib/types.ts`: matchup verisinin şekli (veritabanı da bu şekle göre doldurulacak)
- `src/lib/sample-data.ts`: geçici örnek veri

LoL Matchup is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or
anyone officially involved in producing or managing Riot Games properties.
