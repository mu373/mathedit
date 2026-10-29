import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [{
      // Monaco vendors DOMPurify, so a lockfile override alone does not patch it.
      find: /^\.\/dompurify\/dompurify\.js$/,
      replacement: path.resolve(__dirname, 'node_modules/dompurify/dist/purify.es.mjs'),
    }],
  },
  base: './', // Use relative paths for macOS app bundle
  build: {
    outDir: 'dist',
    // Embed all assets inline for bundling into macOS app
    assetsInlineLimit: 100000000, // 100MB - inline everything
    rollupOptions: {
      output: {
        // Single bundle file for easy embedding
        manualChunks: undefined,
        // Flat structure for macOS bundle Resources folder
        entryFileNames: '[name]-[hash].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name]-[hash].[ext]',
      },
    },
  },
  server: {
    port: 5173,
  },
});
