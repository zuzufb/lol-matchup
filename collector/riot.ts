// Minimal Riot API client that stays inside the key's rate limits.
// Limits are read from Riot's X-App-Rate-Limit header, so a personal or
// production key automatically gets its higher limits.

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class RiotKeyError extends Error {}

class RateLimiter {
  // [max requests, window in ms]. Development key defaults until Riot tells us otherwise.
  private limits: [number, number][] = [
    [20, 1_000],
    [100, 120_000],
  ];
  private sent: number[] = [];

  async wait() {
    for (;;) {
      const now = Date.now();
      const longest = Math.max(...this.limits.map(([, w]) => w));
      this.sent = this.sent.filter((t) => now - t < longest);
      let delay = 0;
      for (const [max, windowMs] of this.limits) {
        const inWindow = this.sent.filter((t) => now - t < windowMs);
        // Keep one request of headroom per window.
        if (inWindow.length >= max - 1) delay = Math.max(delay, inWindow[0] + windowMs - now + 50);
      }
      if (delay === 0) break;
      await sleep(delay);
    }
    this.sent.push(Date.now());
  }

  update(header: string | null) {
    if (!header) return;
    const parsed = header.split(",").map((part) => {
      const [max, seconds] = part.split(":").map(Number);
      return [max, seconds * 1000] as [number, number];
    });
    if (parsed.every(([m, w]) => m > 0 && w > 0)) this.limits = parsed;
  }
}

export class RiotClient {
  // Riot counts limits per routing value (euw1, europe, ...).
  private limiters = new Map<string, RateLimiter>();
  requests = 0;

  constructor(private apiKey: string) {}

  async get<T>(host: string, path: string): Promise<T | null> {
    const limiter = this.limiters.get(host) ?? new RateLimiter();
    this.limiters.set(host, limiter);

    for (let attempt = 0; attempt < 4; attempt++) {
      await limiter.wait();
      this.requests++;
      let res: Response;
      try {
        res = await fetch(`https://${host}.api.riotgames.com${path}`, {
          headers: { "X-Riot-Token": this.apiKey },
        });
      } catch {
        await sleep(2000 * (attempt + 1));
        continue;
      }
      limiter.update(res.headers.get("x-app-rate-limit"));

      if (res.ok) return (await res.json()) as T;
      if (res.status === 404) return null;
      if (res.status === 401 || res.status === 403) {
        throw new RiotKeyError(
          `Riot API ${res.status}: anahtar geçersiz veya süresi dolmuş. ` +
            "Development key 24 saatte bir yenilenmeli (developer.riotgames.com).",
        );
      }
      if (res.status === 429) {
        const retryAfter = Number(res.headers.get("retry-after") ?? 10);
        await sleep(retryAfter * 1000);
        continue;
      }
      if (res.status >= 500) {
        await sleep(2000 * (attempt + 1));
        continue;
      }
      throw new Error(`Riot API ${res.status} for ${path}`);
    }
    return null;
  }
}
