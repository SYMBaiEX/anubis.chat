'use client';

import { useEffect, useState } from 'react';

export function RosettaHieroglyphs() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Fade in after mount
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`pointer-events-none fixed inset-0 overflow-hidden transition-opacity duration-[3000ms] ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ zIndex: 0 }}
    >
      {/* First fragment - top left */}
      <div
        className="hieroglyphic_version absolute"
        style={{
          top: '10%',
          left: '5%',
          fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
          color: 'rgba(64, 64, 64, 0.08)',
          animation: 'fadeInOut 20s infinite',
          animationDelay: '0s',
        }}
      >
        <div className="x-1 horizontal-rtl">
          <span className="vert">
            <span className="hori">
              <span className="lost fade75 half_quadrates_vertical">𓋴</span>
            </span>
            <span className="damaged-13">𓎡</span>
          </span>
          <span className="insert_bottom_left">
            𓆓<span className="vert">𓂧𓈖𓊃</span>
          </span>
          <span className="vert">
            <span className="vertkerning">𓏴𓂡</span>
            <span className="hori">𓍱𓏤</span>
          </span>
          <span className="vert">𓀎𓏥</span>
          <span className="vert">𓃹𓈖𓊃</span>𓏪
          <span className="vert">
            𓐝<span className="hori">𓍱𓏤</span>
            𓊃𓈖
          </span>
        </div>
      </div>

      {/* Second fragment - top right */}
      <div
        className="hieroglyphic_version absolute"
        style={{
          top: '15%',
          right: '8%',
          fontSize: 'clamp(1.2rem, 2.5vw, 2rem)',
          color: 'rgba(64, 64, 64, 0.06)',
          animation: 'fadeInOut 25s infinite',
          animationDelay: '5s',
        }}
      >
        <div className="x-3">
          <span className="vert">𓏲𓏰𓏏</span>
          <span className="vert">
            𓎟<span className="vertkerning">𓐍𓂤</span>𓐝
          </span>
          <span className="vert">𓉔𓂋𓏲</span>
          <span className="vert">𓂋𓁹𓊃𓈖</span>
          𓏪𓏥
          <span className="vert">
            𓈖<span className="hori">𓁶𓏤</span>
            𓂝𓏥
          </span>
        </div>
      </div>

      {/* Third fragment - middle left */}
      <div
        className="hieroglyphic_version absolute"
        style={{
          top: '40%',
          left: '10%',
          fontSize: 'clamp(1rem, 2vw, 1.8rem)',
          color: 'rgba(64, 64, 64, 0.05)',
          animation: 'fadeInOut 30s infinite',
          animationDelay: '10s',
        }}
      >
        <div className="x-6">
          <span className="cartouche">
            <span className="vert">𓊪𓏏</span>𓍯<span className="vert">𓃭𓐝</span>
            𓇋𓇋𓋴
            <span className="insert_bottom_left">
              𓆓
              <span className="hori">
                𓋹
                <span className="vert">
                  <span>𓏸</span>𓏏
                </span>
              </span>
            </span>
            <span className="vert">𓊪𓏏</span>
            𓎛𓌸𓇋𓇋
          </span>
        </div>
      </div>

      {/* Fourth fragment - bottom right */}
      <div
        className="hieroglyphic_version absolute"
        style={{
          bottom: '20%',
          right: '15%',
          fontSize: 'clamp(1.3rem, 2.2vw, 2rem)',
          color: 'rgba(64, 64, 64, 0.07)',
          animation: 'fadeInOut 22s infinite',
          animationDelay: '15s',
        }}
      >
        <div className="x-9">
          <span className="vert">
            𓎟<span className="hori">𓁷𓏤</span>
            <span className="hori">𓁶𓏤</span>
          </span>
          <span className="vert">𓍿𓈖𓐝</span>
          𓄯𓋔
          <span className="vert">𓅨𓂋</span>
          <span className="vert">𓏏𓏏</span>
          <span className="vert">
            𓃹𓈖
            <span className="hori">𓏸𓏤</span>
          </span>
        </div>
      </div>

      {/* Fifth fragment - bottom left */}
      <div
        className="hieroglyphic_version absolute"
        style={{
          bottom: '15%',
          left: '20%',
          fontSize: 'clamp(1.1rem, 2vw, 1.7rem)',
          color: 'rgba(64, 64, 64, 0.04)',
          animation: 'fadeInOut 28s infinite',
          animationDelay: '8s',
        }}
      >
        <div className="x-11">
          <span className="vert">𓍊𓏏</span>
          𓇋𓅱𓅖𓇋𓇋
          <span className="vert">
            𓁹<span className="hori">𓏲𓏏</span>
            <span className="hori">𓉐𓇳</span>
          </span>
          𓏪𓇋
          <span className="vert">𓊪𓏌</span>
          <span className="vert">𓇳𓎆</span>
        </div>
      </div>

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-transparent" />
    </div>
  );
}
