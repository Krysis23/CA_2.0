import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubline?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', showSubline = false }) => {
  const sizes = {
    sm: {
      badge: 'w-7 h-7 rounded-lg',
      iconSize: 14,
      title: 'text-sm font-extrabold tracking-tight',
      subline: 'text-[8px] tracking-[0.2em]',
      gap: 'gap-2',
    },
    md: {
      badge: 'w-9 h-9 rounded-xl',
      iconSize: 18,
      title: 'text-lg font-black tracking-tight',
      subline: 'text-[9px] tracking-[0.22em]',
      gap: 'gap-2.5',
    },
    lg: {
      badge: 'w-12 h-12 rounded-2xl',
      iconSize: 24,
      title: 'text-2xl font-black tracking-tight',
      subline: 'text-[10px] tracking-[0.25em]',
      gap: 'gap-3.5',
    },
  };

  const s = sizes[size];

  return (
    <div className={`flex items-center ${s.gap} select-none`}>
      {/* FinPilot Geometric Hex/Shield Emblem */}
      <div className={`relative ${s.badge} flex items-center justify-center bg-gradient-to-br from-emerald-500 via-teal-500 to-indigo-600 shadow-lg shadow-emerald-500/20 border border-white/20 shrink-0 group`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white drop-shadow-sm transition-transform duration-300 group-hover:scale-110"
          style={{ width: s.iconSize, height: s.iconSize }}
        >
          {/* Compass needle & upward financial trend arrow */}
          <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" fill="currentColor" fillOpacity="0.25" />
          <path d="M12 4L14 10L20 12L14 14L12 20L10 14L4 12L10 10L12 4Z" />
          <circle cx="12" cy="12" r="2" fill="white" />
        </svg>
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
      </div>

      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-display ${s.title} text-white`}>
            FIN<span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">PILOT</span>
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold tracking-wider">
            AI
          </span>
        </div>

        {showSubline && (
          <span className={`font-mono text-muted-foreground font-semibold uppercase mt-1 ${s.subline} text-emerald-400/80`}>
            MULTI-DOCUMENT FINANCIAL REASONING AND GUIDED TAX FILING
          </span>
        )}
      </div>
    </div>
  );
};

export default Logo;
