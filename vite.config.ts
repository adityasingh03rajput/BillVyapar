import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Dev-only: serve admin.html for all /admin and /admin/* routes
    {
      name: 'admin-html-fallback',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url && (req.url === '/admin' || req.url.startsWith('/admin/')) && !req.url.includes('.')) {
            req.url = '/admin.html';
          }
          next();
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
  base: process.env.ELECTRON === 'true' ? './' : '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        admin: path.resolve(__dirname, 'admin.html'),
      },
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    fs: { allow: ['.'] },
  },
})
