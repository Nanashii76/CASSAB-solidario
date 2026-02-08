import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Isso permite que o servidor seja acessado externamente (pelo ngrok)
    host: '0.0.0.0', 
    // Isso desativa a trava de segurança de hosts desconhecidos
    allowedHosts: true, 
  }
})
