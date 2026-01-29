import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/CASSAB-solidario/', // Substitua pelo nome exato do seu repositório no GitHub
})
