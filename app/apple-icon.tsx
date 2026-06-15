import { ImageResponse } from 'next/og'

export const size = { width: 192, height: 192 }
export const contentType = 'image/png'

export default function AppleIcon() {
  const pad = 24
  const gap = 10
  const tile = (size.width - pad * 2 - gap) / 2 // 67

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#1a2a52',
        borderRadius: 30,
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
        <div style={{ width: tile, height: tile, background: '#38bdf8', borderRadius: 11 }} />
        <div style={{ width: tile, height: tile, background: '#a89cf0', borderRadius: 11 }} />
        <div style={{ width: tile, height: tile, background: '#f0a020', borderRadius: 11 }} />
        <div style={{ width: tile, height: tile, background: '#e0392f', borderRadius: 11 }} />
      </div>
    </div>,
    { ...size },
  )
}
