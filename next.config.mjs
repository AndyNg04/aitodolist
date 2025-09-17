import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
    serverComponentsExternalPackages: ['better-sqlite3']
  },
  typescript: {
    ignoreBuildErrors: false
  }
};

export default nextConfig;
