import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  base: '/paper-game/',
  plugins: [
    viteSingleFile()
  ],
  build: {
    target: 'esnext',
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000000,
    minify: false,
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        format: 'iife',
        entryFileNames: 'game.js',
        manualChunks: undefined
      }
    }
  }
})
