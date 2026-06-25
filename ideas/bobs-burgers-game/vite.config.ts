import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  server: { port: 5173, open: true },
  preview: {
    host: '0.0.0.0',
    port: parseInt(process.env['PORT'] ?? '4173'),
    allowedHosts: ['.railway.app'],
  },
  build: { outDir: 'dist', sourcemap: true },
  resolve: { alias: { '@': '/src' } },
});
