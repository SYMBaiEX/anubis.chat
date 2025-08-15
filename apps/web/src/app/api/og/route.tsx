import { GeistSans } from 'geist/font/sans';
import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

export function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get dynamic parameters
    const title = searchParams.get('title') || 'ANUBIS Chat';
    const description =
      searchParams.get('description') ||
      'Next-generation AI-powered chat platform';
    const theme = searchParams.get('theme') || 'dark';

    return new ImageResponse(
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            theme === 'dark'
              ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          fontFamily: GeistSans.style.fontFamily,
        }}
      >
        {/* Logo and Title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 30,
          }}
        >
          {/* Simple Anubis Logo */}
          <div
            style={{
              width: 80,
              height: 80,
              marginRight: 20,
              background: theme === 'dark' ? '#8b5cf6' : '#ffffff',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 48,
            }}
          >
            A
          </div>
          <h1
            style={{
              fontSize: 60,
              fontWeight: 700,
              color: theme === 'dark' ? '#ffffff' : '#ffffff',
              margin: 0,
            }}
          >
            {title}
          </h1>
        </div>

        {/* Description */}
        <p
          style={{
            fontSize: 24,
            color: theme === 'dark' ? '#a1a1aa' : '#f3f4f6',
            margin: '0 60px',
            textAlign: 'center',
            maxWidth: '800px',
          }}
        >
          {description}
        </p>

        {/* Features */}
        <div
          style={{
            display: 'flex',
            gap: 30,
            marginTop: 40,
            color: theme === 'dark' ? '#e5e7eb' : '#ffffff',
            fontSize: 18,
          }}
        >
          <span>✨ AI-Powered</span>
          <span>🚀 Blockchain</span>
          <span>🔒 Secure</span>
        </div>

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: theme === 'dark' ? '#6b7280' : '#e5e7eb',
            fontSize: 16,
          }}
        >
          <span>anubis.chat</span>
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    console.log(`${e instanceof Error ? e.message : String(e)}`);
    return new Response('Failed to generate the image', {
      status: 500,
    });
  }
}
