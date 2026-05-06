import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/BET3D5.2/',   // ← AFEGEIX AQUESTA LÍNIA
  plugins: [react()],
})
