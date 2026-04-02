import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  variant?: 'light' | 'dark';
}

const Logo: React.FC<LogoProps> = ({ size = 40, className = "", showText = false, variant = 'dark' }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div 
        className="relative flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
        style={{ width: size, height: size }}
      >
        <div className="absolute inset-0 bg-linear-to-br from-purple-primary to-magenta-accent rounded-xl rotate-12 opacity-20" />
        <div className="absolute inset-0 bg-linear-to-br from-purple-primary to-magenta-accent rounded-xl -rotate-6 opacity-20" />
        <div className="relative w-full h-full bg-linear-to-br from-purple-primary to-magenta-accent rounded-xl flex items-center justify-center shadow-lg">
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="w-1/2 h-1/2 text-white"
          >
            <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15.54 8.46C16.4774 9.39764 17.004 10.6692 17.004 11.995C17.004 13.3208 16.4774 14.5924 15.54 15.53" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M19.07 4.93C20.9447 6.80528 21.9979 9.34836 21.9979 12C21.9979 14.6516 20.9447 17.1947 19.07 19.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-display font-black tracking-tighter leading-none text-white">
            BONGA
          </span>
          <span className="text-xs font-display font-bold tracking-widest leading-none text-purple-primary uppercase">
            Box
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
