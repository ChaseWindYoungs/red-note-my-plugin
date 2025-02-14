import { defineConfig } from 'vite'
import { resolve } from 'path'
import type { UserConfig } from 'vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite';
import { VantResolver } from '@vant/auto-import-resolver';
// import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

export default defineConfig(({ command, mode }): UserConfig => ({
  resolve: {
    alias: {
      '@': resolve(process.cwd(), 'src')
    }
  },
  plugins: [
    vue(),
    vueJsx(),
    AutoImport({
      resolvers: [VantResolver()],
    }),
    Components({
      resolvers: [VantResolver()],
    }),
  ],
  build: {
    outDir: 'dist',
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        content: resolve(process.cwd(), 'src/index.ts')
      },
      output: {
        entryFileNames: 'index.js',
        format: 'iife',
        globals: {
          jquery: 'jQuery',
          vue: 'Vue'
        },
        extend: true,
        assetFileNames: (assetInfo: { name: string }) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'style.css';
          }
          return '[name][extname]';
        },
        inlineDynamicImports: true,
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        // pure_funcs: ['console.log'],
        drop_debugger: true,
      }
    }
  },
  optimizeDeps: {
    include: ['vue', 'element-plus']
  }
}))
