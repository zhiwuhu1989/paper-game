// import { defineConfig } from 'vite'

// export default defineConfig({
//   base: './',
//   build: {
//     outDir: 'dist',
//     assetsDir: 'assets',
//     rollupOptions: {
//       output: {
//         format: 'iife',            // ✅ 核心：非 module
//         entryFileNames: 'game.js', // 固定文件名
//         manualChunks: undefined
//       }
//     }
//   }
// })

import { defineConfig } from 'vite'

export default defineConfig({
  base: '/paper-game/',   // ← 改成你的仓库名，前后斜杠要对
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})