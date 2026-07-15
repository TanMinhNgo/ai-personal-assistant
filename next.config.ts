import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Baileys uses dynamic require / __dirname / .proto files and must run from
  // node_modules in the Node process rather than being bundled.
  serverExternalPackages: ['baileys', 'pino', 'pino-pretty'],
};

export default nextConfig;
