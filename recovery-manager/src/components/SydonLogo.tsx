import React from 'react';

interface SydonLogoProps {
  className?: string;
  showSubtitle?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const SydonLogo: React.FC<SydonLogoProps> = ({
  className = '',
  showSubtitle = true,
  size = 'md'
}) => {
  const iconSize = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';
  const titleSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg';

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Sydon Geometric Prism Icon */}
      <div className={`${iconSize} rounded-lg bg-[#151515] flex items-center justify-center shadow-[0_2px_8px_rgba(21,21,21,0.15)] shrink-0 relative overflow-hidden group-hover:bg-[#C64B32] transition-colors duration-200`}>
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
        >
          {/* Outer isometric hexagon */}
          <polygon
            points="16,3 27,9.5 27,22.5 16,29 5,22.5 5,9.5"
            stroke="#FAF8F5"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          {/* Inner isometric Y-junction */}
          <path
            d="M16 16L16 3M16 16L27 22.5M16 16L5 22.5"
            stroke="#FAF8F5"
            strokeWidth="1.2"
            strokeOpacity="0.35"
            strokeLinejoin="round"
          />
          {/* Dynamic 'S' flow lines inside the prism */}
          <path
            d="M11 11H21L11 21H21"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Strategic precision node in Sydon terracotta */}
          <circle cx="21" cy="11" r="1.6" fill="#C64B32" />
          <circle cx="11" cy="21" r="1.6" fill="#10B981" />
        </svg>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-2">
          <span className={`font-heading font-black tracking-tight text-[#151515] group-hover:text-[#C64B32] transition-colors ${titleSize}`}>
            SYDON
          </span>
          <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 bg-[#151515] text-[#FAF8F5] font-semibold rounded-[3px]">
            RCM PRO
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[10px] font-mono tracking-wider uppercase text-[#737067] mt-1">
            Recovery Manager
          </span>
        )}
      </div>
    </div>
  );
};
