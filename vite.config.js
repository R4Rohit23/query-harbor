import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react(), dts({ insertTypesEntry: true, outputDir: "dist" })],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'QueryHarbor',
      fileName: (format) => `query-harbor.${format}.js`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', '@tanstack/react-query', 'axios', 'react-cookie'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@tanstack/react-query': 'ReactQuery',
          axios: 'axios',
          'react-cookie': 'ReactCookie',
        },
      },
    },
  },
});
