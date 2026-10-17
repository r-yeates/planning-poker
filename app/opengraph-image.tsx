import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const alt = 'Sprintro: free planning poker for agile teams'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpengraphImage() {
  const logo = await readFile(join(process.cwd(), 'public/logo.png'))
  const logoSrc = `data:image/png;base64,${logo.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #0f0f0f 0%, #181818 55%, #1e1b4b 100%)',
          color: '#f1f1f1',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 48 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} width={96} height={86} alt="" />
          <span style={{ fontSize: 48, fontWeight: 700 }}>Sprintro</span>
        </div>
        <div style={{ display: 'flex', fontSize: 84, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>
          Free Planning Poker
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 84,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -2,
            paddingBottom: 16, // stops background-clip cutting off descenders ("g")
            backgroundImage: 'linear-gradient(90deg, #60a5fa, #a78bfa, #22d3ee)',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          for Agile Teams
        </div>
        <div style={{ display: 'flex', fontSize: 34, color: '#aaaaaa', marginTop: 40 }}>
          Real-time story point estimation · Anonymous voting · No signup
        </div>
      </div>
    ),
    size,
  )
}
