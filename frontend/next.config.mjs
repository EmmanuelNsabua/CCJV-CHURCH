/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Vignettes des vidéos YouTube (aucun hébergement vidéo côté CCJV).
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      // Médias servis par Supabase Storage : l'API renvoie des URL absolues
      // (`/storage/v1/object/public/…`) qu'aucun chemin local ne couvre.
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};

export default nextConfig;
