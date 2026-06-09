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
  showText = false,
  variant = 'light' 
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div 
        className="relative flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
        style={{ width: size, height: size }}
      >
        <img 
          src="https://i.postimg.cc/R3JFgcQC/Copy-of-O-20260608-113048-0000.png" 
          alt="Bonga Box Logo" 
          className="w-full h-full object-contain rounded-lg"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
};

export default Logo;
