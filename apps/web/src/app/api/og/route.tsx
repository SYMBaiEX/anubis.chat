import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

const fontBold = fetch(
  new URL('../../../../public/fonts/Inter-Bold.ttf', import.meta.url)
).then((res) => res.arrayBuffer());

const fontRegular = fetch(
  new URL('../../../../public/fonts/Inter-Regular.ttf', import.meta.url)
).then((res) => res.arrayBuffer());

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get dynamic parameters
    const title = searchParams.get('title') || 'ANUBIS Chat';
    const description =
      searchParams.get('description') ||
      'Next-generation AI-powered chat platform';
    const theme = searchParams.get('theme') || 'dark';
    const type = searchParams.get('type') || 'default';

    const [fontBoldData, fontRegularData] = await Promise.all([
      fontBold,
      fontRegular,
    ]);

    // Different layouts based on type
    if (type === 'chat') {
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
            fontFamily: 'Inter',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 40,
            }}
          >
            <svg
              fill="none"
              height="80"
              style={{ marginRight: 20 }}
              viewBox="0 0 100 100"
              width="80"
            >
              <path
                d="M50 10 L70 30 L70 60 L50 90 L30 60 L30 30 Z"
                fill={theme === 'dark' ? '#8b5cf6' : '#ffffff'}
                opacity="0.9"
              />
              <path
                d="M50 25 L60 35 L60 55 L50 75 L40 55 L40 35 Z"
                fill={theme === 'dark' ? '#a78bfa' : '#f3f4f6'}
              />
            </svg>
            <h1
              style={{
                fontSize: 60,
                fontWeight: 700,
                background:
                  theme === 'dark'
                    ? 'linear-gradient(90deg, #8b5cf6 0%, #ec4899 100%)'
                    : 'linear-gradient(90deg, #ffffff 0%, #f3f4f6 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                margin: 0,
              }}
            >
              {title}
            </h1>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              color: theme === 'dark' ? '#e5e7eb' : '#ffffff',
              fontSize: 20,
            }}
          >
            <span>💬 Real-time Chat</span>
            <span>🤖 AI-Powered</span>
            <span>🔒 Secure</span>
          </div>
        </div>,
        {
          width: 1200,
          height: 630,
          fonts: [
            { name: 'Inter', data: fontBoldData, weight: 700 },
            { name: 'Inter', data: fontRegularData, weight: 400 },
          ],
        }
      );
    }

    if (type === 'profile') {
      const username = searchParams.get('username') || 'User';
      const avatar = searchParams.get('avatar') || '';

      return new ImageResponse(
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background:
              theme === 'dark'
                ? 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)'
                : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            fontFamily: 'Inter',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {avatar ? (
              <img
                alt=""
                height={150}
                src={avatar}
                style={{
                  borderRadius: '50%',
                  border: '4px solid rgba(255, 255, 255, 0.2)',
                  marginBottom: 30,
                }}
                width={150}
              />
            ) : (
              <div
                style={{
                  width: 150,
                  height: 150,
                  borderRadius: '50%',
                  background:
                    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 60,
                  fontWeight: 700,
                  color: 'white',
                  marginBottom: 30,
                }}
              >
                {username[0].toUpperCase()}
              </div>
            )}
            <h1
              style={{
                fontSize: 48,
                fontWeight: 700,
                color: theme === 'dark' ? '#ffffff' : '#ffffff',
                margin: '0 0 10px 0',
              }}
            >
              @{username}
            </h1>
            <p
              style={{
                fontSize: 24,
                color:
                  theme === 'dark' ? '#a1a1aa' : 'rgba(255, 255, 255, 0.9)',
                margin: 0,
              }}
            >
              {description}
            </p>
          </div>
        </div>,
        {
          width: 1200,
          height: 630,
          fonts: [
            { name: 'Inter', data: fontBoldData, weight: 700 },
            { name: 'Inter', data: fontRegularData, weight: 400 },
          ],
        }
      );
    }

    // Default layout
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
              ? 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          fontFamily: 'Inter',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <svg fill="none" height="100" viewBox="0 0 100 100" width="100">
            <path
              d="M50 10 L70 30 L70 60 L50 90 L30 60 L30 30 Z"
              fill={theme === 'dark' ? '#8b5cf6' : '#ffffff'}
              opacity="0.9"
            />
            <path
              d="M50 25 L60 35 L60 55 L50 75 L40 55 L40 35 Z"
              fill={theme === 'dark' ? '#a78bfa' : '#f3f4f6'}
            />
          </svg>
        </div>
        <h1
          style={{
            fontSize: 72,
            fontWeight: 700,
            background:
              theme === 'dark'
                ? 'linear-gradient(90deg, #8b5cf6 0%, #ec4899 100%)'
                : 'linear-gradient(90deg, #ffffff 0%, #f3f4f6 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            margin: '0 0 20px 0',
            padding: '0 20px',
            textAlign: 'center',
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: 28,
            color: theme === 'dark' ? '#a1a1aa' : 'rgba(255, 255, 255, 0.95)',
            margin: '0 0 40px 0',
            padding: '0 40px',
            textAlign: 'center',
            maxWidth: 800,
          }}
        >
          {description}
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 30,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 100,
              color: theme === 'dark' ? '#e5e7eb' : '#ffffff',
              fontSize: 18,
            }}
          >
            <svg fill="currentColor" height="20" viewBox="0 0 24 24" width="20">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            <span>Secure</span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 100,
              color: theme === 'dark' ? '#e5e7eb' : '#ffffff',
              fontSize: 18,
            }}
          >
            <svg fill="currentColor" height="20" viewBox="0 0 24 24" width="20">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span>Fast</span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 100,
              color: theme === 'dark' ? '#e5e7eb' : '#ffffff',
              fontSize: 18,
            }}
          >
            <svg fill="currentColor" height="20" viewBox="0 0 24 24" width="20">
              <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
            </svg>
            <span>Modern</span>
          </div>
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
        fonts: [
          { name: 'Inter', data: fontBoldData, weight: 700 },
          { name: 'Inter', data: fontRegularData, weight: 400 },
        ],
      }
    );
  } catch (e: any) {
    console.error('OG Image generation failed:', e);
    return new Response('Failed to generate image', { status: 500 });
  }
}
