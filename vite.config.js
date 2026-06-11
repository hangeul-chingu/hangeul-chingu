import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'hc-pages',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 5, maxAgeSeconds: 0 }
            }
          },
          {
            urlPattern: /\/assets\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'hc-assets',
              expiration: { maxEntries: 50, maxAgeSeconds: 2592000 }
            }
          },
          {
            urlPattern: /^https:\/\/(firestore|identitytoolkit|api\.anthropic)\.googleapis?\.com/,
            handler: 'NetworkOnly'
          }
        ],
        skipWaiting: true,
        clientsClaim: true
      },
      manifest: {
        name: '한글 친구',
        short_name: '한글 친구',
        description: '이주배경 학습자를 위한 24시간 디지털 브릿지',
        theme_color: '#ff6b9d',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ]
})
