import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

// Configuración de Vite para conectar la App Mobile Vue + Ionic
// directamente con el MISMO backend de BellaStyle Manager (http://localhost:3000)
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const targetBackend = env.API_PROXY_TARGET || 'http://localhost:3000';

  return {
    plugins: [vue()],
    server: {
      port: 5174,
      strictPort: true,
      proxy: {
        '/api': {
          target: targetBackend,
          changeOrigin: true,
        },
        '/img': {
          target: targetBackend,
          changeOrigin: true,
        },
      },
    },
  };
});
