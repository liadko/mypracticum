import { defineConfig, loadEnv, type ConfigEnv, type UserConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }: ConfigEnv): UserConfig => {
  const env = loadEnv(mode, process.cwd(), ''); // The third argument '' means load all prefixes, not just VITE_

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: true,
      port: 5173,
      watch: { usePolling: true },
      proxy: {
        '/api': {
          target: env.VITE_PROXY_TARGET,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),  // <-- drop the "/api"
        },
      },
    },
  }
})
