// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [{ find: '@', replacement: '/src' }],
  },
  build: {
    // Cache busting configuration
    rollupOptions: {
      output: {
        // Generate unique hash for each build
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Force chunk splitting for better cache invalidation
    chunkSizeWarningLimit: 1000,
  },
  server: {
    proxy: {
      '/assets/uploads/lampiran': {
        target: 'https://apidev.jaja.id',
        changeOrigin: true,
        secure: false, // Abaikan SSL sementara untuk dev
      },
    },
  },
});