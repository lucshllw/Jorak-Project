import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  poweredByHeader: false,
  distDir: process.env.JORAK_VERIFY_INSTANCE === 'true' ? '.next-verification' : '.next',
  outputFileTracingExcludes: { '/*': ['./.local-data/**/*', './ACESSO-LOCAL.txt', './.env*', './research/**/*'] },
  images: { remotePatterns: [{ protocol: 'https', hostname: 'i.scdn.co' }, { protocol: 'https', hostname: '*.supabase.co' }] },
  async headers() { return [{ source: '/(.*)', headers: [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' }
  ] }]; }
};
export default nextConfig;
