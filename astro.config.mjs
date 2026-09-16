import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://ffdev.studio',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  devToolbar: { enabled: false },
});
