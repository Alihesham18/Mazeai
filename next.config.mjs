import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL;
const directusRemotePattern = (() => {
  if (!directusUrl) return [];
  try {
    const url = new URL(directusUrl);
    return [
      {
        protocol: url.protocol.replace(":", ""),
        hostname: url.hostname,
        port: url.port,
        pathname: "/**"
      }
    ];
  } catch {
    return [];
  }
})();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: { remotePatterns: directusRemotePattern }
};

export default withNextIntl(nextConfig);
