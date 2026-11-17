import React from 'react';
import type { ThemeMode, SpotlightIntensity } from '../types';

interface CarriageSpotlightProps {
  caretX: number;
  trackY: number; // Viewport Y position of the track (around 62vh + line offset)
  theme: ThemeMode;
  intensity: SpotlightIntensity;
  isFocused: boolean;
}

export const CarriageSpotlight: React.FC<CarriageSpotlightProps> = ({
  caretX,
  trackY,
  theme,
  intensity,
  isFocused,
}) => {
  // Numeric opacity multiplier based on intensity
  const intensityMap: Record<SpotlightIntensity, number> = {
    off: 0,
    subtle: 0.35,
    atmospheric: 0.75,
    dramatic: 1.0,
  };

  const rawOpacity = intensityMap[intensity];
  const activeOpacity = isFocused ? rawOpacity : rawOpacity * 0.5;

  // Track colors per theme
  const trackColor = {
    slate: 'rgba(30, 30, 36, 0.16)',
    midnight: 'rgba(255, 255, 255, 0.12)',
    sepia: 'rgba(80, 50, 30, 0.15)',
  }[theme];

  // Pill styling per theme
  const pillStyle = {
    slate: 'from-[#e4e4e7] via-[#a1a1aa] to-[#71717a] border-white/60 shadow-[0_2px_6px_rgba(0,0,0,0.25)]',
    midnight: 'from-[#a1a1aa] via-[#52525b] to-[#27272a] border-zinc-400/30 shadow-[0_2px_8px_rgba(0,0,0,0.6)]',
    sepia: 'from-[#faeed7] via-[#c9a674] to-[#8c6534] border-amber-200/50 shadow-[0_2px_6px_rgba(80,50,30,0.3)]',
  }[theme];

  // Warm light beam colors
  const lightColor = {
    slate: 'rgba(255, 248, 225, 0.75)',
    midnight: 'rgba(255, 245, 215, 0.82)',
    sepia: 'rgba(255, 250, 225, 0.85)',
  }[theme];

  // Clamp caretX to reasonable bounds
  const clampedX = Math.max(20, Math.min(window.innerWidth - 20, caretX || window.innerWidth / 2));

  return (
    <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
      {/* 1. UPWARD HEADLIGHT / SPOTLIGHT CONE ILLUMINATION */}
      {activeOpacity > 0 && (
        <div
          className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
          style={{ opacity: activeOpacity }}
        >
          {/* Main Cone Beam Container centered on the Caret X position */}
          <div
            className="absolute bottom-0 w-[580px] -translate-x-1/2 pointer-events-none"
            style={{
              left: `${clampedX}px`,
              bottom: `calc(100vh - ${trackY}px)`,
              height: `${trackY}px`,
              transition: 'left 50ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Layer A: Upward Radiating Soft-Light Conical Beam */}
            <div
              className="w-full h-full"
              style={{
                clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)',
                background: `linear-gradient(to top,
                  ${lightColor} 0%,
                  rgba(255, 248, 225, 0.45) 35%,
                  rgba(255, 248, 225, 0.18) 70%,
                  transparent 100%
                )`,
                mixBlendMode: theme === 'midnight' ? 'screen' : 'soft-light',
                filter: 'blur(16px)',
              }}
            />

            {/* Layer B: Crisp Core Illuminator Beam directly above the active line */}
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[340px] h-[320px] pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at 50% 100%,
                  ${lightColor} 0%,
                  rgba(255, 246, 218, 0.35) 45%,
                  transparent 75%
                )`,
                mixBlendMode: theme === 'midnight' ? 'screen' : 'overlay',
                filter: 'blur(8px)',
              }}
            />

            {/* Layer C: Warm Filament Glow at carriage anchor point */}
            <div
              className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-28 h-14 rounded-full pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 50%,
                  rgba(255, 252, 235, 0.95) 0%,
                  rgba(255, 238, 175, 0.5) 45%,
                  transparent 80%
                )`,
                filter: 'blur(4px)',
                mixBlendMode: 'screen',
              }}
            />
          </div>

          {/* Atmospheric ambient top fall-off shadow: older lines at top fade into soft moody shadow */}
          <div
            className="absolute top-0 left-0 right-0 pointer-events-none"
            style={{
              height: `calc(${trackY}px - 140px)`,
              background:
                theme === 'midnight'
                  ? 'linear-gradient(to bottom, rgba(14, 14, 16, 0.85) 0%, rgba(14, 14, 16, 0.45) 55%, transparent 100%)'
                  : theme === 'sepia'
                  ? 'linear-gradient(to bottom, rgba(180, 165, 145, 0.4) 0%, rgba(180, 165, 145, 0.15) 55%, transparent 100%)'
                  : 'linear-gradient(to bottom, rgba(120, 120, 128, 0.42) 0%, rgba(135, 135, 142, 0.18) 55%, transparent 100%)',
            }}
          />
        </div>
      )}

      {/* 2. FIXED HORIZONTAL CARRIAGE TRACK (1px hairline) */}
      <div
        className="absolute left-0 right-0 w-full pointer-events-none z-20"
        style={{
          top: `${trackY}px`,
          height: '1px',
          backgroundColor: trackColor,
          boxShadow:
            theme === 'midnight'
              ? '0 1px 0 rgba(255, 255, 255, 0.04)'
              : '0 1px 0 rgba(255, 255, 255, 0.35)',
        }}
      >
        {/* Subtle graduation marks along the carriage track (typewriter character ruler) */}
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, ${trackColor} 0px, ${trackColor} 1px, transparent 1px, transparent 24px)`,
          }}
        />

        {/* 3. SLEEK METALLIC FROSTED CARRIAGE PILL SLIDER */}
        <div
          className={`absolute top-0 -translate-y-1/2 w-[28px] h-[6px] rounded-full bg-gradient-to-b border ${pillStyle} carriage-pill-transition z-30 cursor-default flex items-center justify-center`}
          style={{
            transform: `translateX(calc(${clampedX}px - 14px)) translateY(-50%)`,
          }}
        >
          {/* Central engraved hairline index notch on the pill */}
          <div
            className="w-[2px] h-[3px] rounded-full"
            style={{
              backgroundColor: theme === 'midnight' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
            }}
          />
          {/* Subtle tiny optical lamp aperture reflection on top edge */}
          <div className="absolute top-0 w-3 h-[1px] bg-white/70 rounded-full" />
        </div>
      </div>
    </div>
  );
};
