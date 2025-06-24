import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    sourcemap: true,
    minify: false,
    lib: {
      entry: {
        index: 'src/index.ts',
        'async/index': 'src/async/index.ts',
      },
      fileName: '[name]',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['node:async_hooks'],
    },
  },
})
