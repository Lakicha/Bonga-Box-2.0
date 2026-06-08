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
    <div className={`inline-flex items-center select-none ${className}`}>
      {/* Real company logo from uploaded PNG */}
      <div 
        className="relative flex items-center justify-center transition-all duration-300 ease-out group-hover:scale-105"
        style={{ width: size, height: size }}
      >
        <img
          src="https://i.postimg.cc/R3JFgcQC/Copy-of-O-20260608-113048-0000.png"
          alt="Bonga Box Logo"
          className="object-contain rounded-lg aspect-square"
          style={{ width: '100%', height: '100%' }}
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
};

export default Logo;
