import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const API = process.env.VITE_API_PROXY || 'http://localhost:5000';

export default defineConfig({
  plugins: [react()],
  // keep paths as written: on some Windows setups the real path of the folder differs from the one Node can open
  resolve: { preserveSymlinks: true },
  server: {
    port: 5173,
    proxy: {
      '/api': API,
      '/uploads': API,
      '/media': API,
    },
  },
});
