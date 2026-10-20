import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-512-maskable.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,png,webp,svg}'],
        // los iconos grandes solo se necesitan al instalar la app, no para funcionar sin conexión
        globIgnores: ['icon-512*.png'],
      },
      manifest: {
        name: 'Modelito',
        short_name: 'Modelito',
        description: 'Diario personal de outfits con el tiempo de cada día',
        lang: 'es',
        theme_color: '#f6f2ec',
        background_color: '#f6f2ec',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
