import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Data Dragon görselleri zaten küçük ve optimize; Next'in yeniden işlemesine gerek yok.
    unoptimized: true,
    remotePatterns: [new URL("https://ddragon.leagueoflegends.com/**")],
  },
};

export default nextConfig;
