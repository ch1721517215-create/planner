import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NOW. MUST. TILL DONE.',
    short_name: 'NMTD',
    description: 'Eisenhower Matrix 할 일 관리',
    start_url: '/',
    display: 'standalone',
    background_color: '#1a2a52',
    theme_color: '#1a2a52',
    icons: [
      {
        src: '/apple-icon',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
