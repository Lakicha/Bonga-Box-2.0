import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  variant?: 'light' | 'dark';
}

const Logo: React.FC<LogoProps> = ({ 
  size = 40, 
  className = "", 
  showText = true,
  variant = 'light' 
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Dynamic inline SVG Logo with speech element and safety shield */}
      <div 
        className="relative flex items-center justify-center transition-transform duration-300 ease-out group-hover:scale-105"
        style={{ width: size, height: size }}
      >
        <svg 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_4px_10px_rgba(79,70,229,0.12)]"
        >
          {/* Defs for premium gradients */}
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4F46E5" /> {/* Indigo */}
              <stop offset="50%" stopColor="#3F37C9" /> {/* Royal Purple */}
              <stop offset="100%" stopColor="#06B6D4" /> {/* Cyan */}
            </linearGradient>
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F1F5F9" />
            </linearGradient>
          </defs>

          {/* Glowing active outer backring */}
          <circle cx="50" cy="50" r="45" fill="url(#logoGrad)" opacity="0.08" />
          
          {/* Main Speech bubble shape (Bonga: Speak Out) */}
          <path 
            d="M 22 70 C 13.5 61.5 10 49 14.5 37.5 C 19 26 31 18 44 18 C 62 18 76.5 30 79 47.5 C 81.5 65 71 80.5 54 82 C 45.5 82.5 35.5 78.5 28.5 83.5 C 27.5 84 26.5 84 25.5 83 C 25 82 25 80.5 25.5 79 C 26.5 75 24 72 22 70 Z" 
            fill="url(#logoGrad)" 
          />
          
          {/* Protection Shield inside representing safety */}
          <path 
            d="M 36 36 L 64 36 C 64 36 64 54 50 63 C 36 54 36 36 36 36 Z" 
            fill="url(#shieldGrad)" 
          />

          {/* Active soundwave pulsing dots within shield for child alert voice */}
          <circle cx="50" cy="45" r="4" fill="#4F46E5" />
          <circle cx="43" cy="45" r="2.5" fill="#06B6D4" />
          <circle cx="57" cy="45" r="2.5" fill="#3F37C9" />
          
          {/* Checkmark of completion / shield crest */}
          <path 
            d="M 45 52 L 49 55 L 55 49" 
            stroke="#4F46E5" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col items-start leading-none">
          <span className="text-xl font-black tracking-tight text-slate-900 group-hover:text-purple-primary transition-colors">
            Bonga
          </span>
          <span className="text-[10px] font-bold tracking-widest uppercase text-purple-primary mt-0.5 whitespace-nowrap">
            Box
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
