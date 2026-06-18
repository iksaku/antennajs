import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    sourcemap: true,
    minify: false,
    lib: {
      entry: {
        index: 'src/index.ts',
        'util/index': 'src/util.ts',
      },
      fileName: '[name]',
      formats: ['es', 'cjs'],
    },
  },
})
