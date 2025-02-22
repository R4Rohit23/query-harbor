import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'QueryHarbor',
      fileName: (format) => `query-harbor.${format}.js`
    },
    rollupOptions: {
      external: ['react', 'react-dom', '@tanstack/react-query', 'axios', 'react-cookie'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@tanstack/react-query': 'ReactQuery',
          axios: 'axios',
          'react-cookie': 'ReactCookie'
        }
      }
    }
  }
})