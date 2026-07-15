import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/admin/',           // a build fica servida em /admin pelo Express (substitui o admin/ antigo)
  build: {
    outDir: '../aurum-store/admin-dashboard-dist',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      // Em desenvolvimento (npm run dev neste projecto), reencaminha /api
      // para o servidor Express que corre em paralelo (npm run dev na pasta aurum-store/)
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
});
