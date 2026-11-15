import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En desarrollo, las llamadas a /api se redirigen al backend Spring Boot (puerto 8080),
// así no hay problemas de CORS ni hace falta configurar URLs en el código.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
});
