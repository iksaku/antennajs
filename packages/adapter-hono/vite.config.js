import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    sourcemap: true,
    minify: false,
    lib: {
      entry: 'src/index.ts',
      fileName: '[name]',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: [],
    },
  },
})
