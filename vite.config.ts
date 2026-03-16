import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      // Babel transform only for files that actually use JSX/TSX
      include: '**/*.{jsx,tsx}',
    }),
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
    // Target modern browsers — smaller output, no legacy polyfills
    target: 'es2020',
    // Inline small assets directly into CSS/JS to save round-trips
    assetsInlineLimit: 4096,
    // Enable CSS code splitting per chunk
    cssCodeSplit: true,
    // Raise warning threshold — vendor-pdf is intentionally large
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        admin: path.resolve(__dirname, 'admin.html'),
      },
      output: {
        // Keep chunk filenames stable for better browser caching
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          // PDF libs — only loaded when user opens a document
          if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('pdfmake')) return 'vendor-pdf';

          // Charts — only loaded on analytics page
          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';

          // Core React runtime — cached aggressively
          if (id.includes('react-dom') || id.includes('react/') || id.includes('scheduler')) return 'vendor-react';

          // Router — small, but separate so react-dom cache isn't busted
          if (id.includes('react-router')) return 'vendor-router';

          // UI primitives — Radix + lucide + sonner
          if (id.includes('@radix-ui') || id.includes('lucide-react') || id.includes('sonner')) return 'vendor-ui';

          // Form / date utilities
          if (id.includes('react-hook-form') || id.includes('date-fns') || id.includes('react-day-picker')) return 'vendor-forms';

          // Everything else (jose, qrcode, uuid, etc.)
          return 'vendor';
        },
      },
      // Tree-shake unused exports aggressively
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
      },
    },
  },
  server: {
    fs: { allow: ['.'] },
  },
  // Optimize deps pre-bundling — speeds up cold dev starts
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router',
      'lucide-react',
      'sonner',
      'clsx',
      'tailwind-merge',
    ],
    exclude: ['jspdf', 'html2canvas', 'recharts'],
  },
})
