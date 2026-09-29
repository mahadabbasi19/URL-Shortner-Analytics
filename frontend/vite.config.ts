import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    // Docker bind mounts on macOS (via virtiofs/colima) often don't deliver
    // native filesystem change events into the container, so chokidar's
    // default watcher silently misses edits made on the host. Polling
    // trades a little CPU for hot reload actually working.
    watch: {
      usePolling: true,
      interval: 300,
    },
  },
})
