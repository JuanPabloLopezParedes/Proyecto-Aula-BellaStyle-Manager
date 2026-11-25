import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

// Configuración de Vite conectada por defecto al backend real en Vercel:
// https://proyecto-aula-bella-style-manager.vercel.app
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const targetBackend = env.API_PROXY_TARGET || 'https://proyecto-aula-bella-style-manager.vercel.app';

  return {
    plugins: [vue()],
    server: {
      port: 5174,
      strictPort: true,
      proxy: {
        '/api': {
          target: targetBackend,
          changeOrigin: true,
          secure: true,
        },
        '/img': {
          target: targetBackend,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});
