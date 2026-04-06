import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    root: '.',
    publicDir: 'public',
    server: {
      port: parseInt(env.VITE_SERVER_PORT) || 5173,
      host: env.VITE_SERVER_HOST || 'localhost',
      open: true
    },
    build: {
      outDir: 'dist'
    }
  }
})
