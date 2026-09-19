import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : undefined;

export default defineConfig({
  site: productionUrl ?? 'http://localhost:4877',
  output: 'static',
  // The stylesheets are a few KiB; inlining them removes two render-blocking requests before first paint.
  build: { inlineStylesheets: 'always' },
  adapter: vercel(),
  integrations: [react(), markdoc(), keystatic(), sitemap()],
  server: { port: 4877 },
});
