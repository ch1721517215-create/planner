import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  const pad = 64
  const gap = 28
  const tile = (size.width - pad * 2 - gap) / 2 // 178

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#1a2a52',
        borderRadius: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: gap,
          width: tile * 2 + gap,
          height: tile * 2 + gap,
        }}
      >
        <div style={{ width: tile, height: tile, background: '#38bdf8', borderRadius: 28 }} />
        <div style={{ width: tile, height: tile, background: '#a89cf0', borderRadius: 28 }} />
        <div style={{ width: tile, height: tile, background: '#f0a020', borderRadius: 28 }} />
        <div style={{ width: tile, height: tile, background: '#e0392f', borderRadius: 28 }} />
      </div>
    </div>,
    { ...size },
  )
}
