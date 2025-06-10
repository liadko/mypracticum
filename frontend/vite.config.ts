import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    host: true, // This tells Vite to listen on all network interfaces
    port: 5173,  // You can explicitly set the port here too
      // Add this watch object to enable polling
    watch: {
      usePolling: true,
    },

  }

})

