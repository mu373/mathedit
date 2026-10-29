import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') },
      {
        // Replace Monaco's vendored sanitizer as well as its npm dependency.
        find: /^\.\/dompurify\/dompurify\.js$/,
        replacement: path.resolve(__dirname, 'node_modules/dompurify/dist/purify.es.mjs'),
      },
    ],
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
