import React, { createContext, useContext, useEffect, useState } from 'react';

export type GraphicsMode = 'high-end' | 'performance';

interface GraphicsContextType {
  graphicsMode: GraphicsMode;
  setGraphicsMode: (mode: GraphicsMode) => void;
  toggleGraphicsMode: () => void;
  isLowEnd: boolean;
  autoDetected: boolean;
  contrastEnhanced: boolean; // low-end displays typically benefit from enhanced text/border contrast
  toggleContrast: () => void;
  // CSS Helpers for easy integration
  blurClass: (fallback: string) => string;
  glowClass: (fallback?: string) => string;
  borderClass: (fallbackWeight?: string) => string;
  textMutedClass: () => string;
  springConfig: any; // framer-motion config suited to the hardware context
}

const GraphicsContext = createContext<GraphicsContextType>({
  graphicsMode: 'high-end',
  setGraphicsMode: () => {},
  toggleGraphicsMode: () => {},
  isLowEnd: false,
  autoDetected: false,
  contrastEnhanced: false,
  toggleContrast: () => {},
  blurClass: () => '',
  glowClass: () => '',
  borderClass: () => '',
  textMutedClass: () => '',
  springConfig: {},
});

export const GraphicsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [graphicsMode, setGraphicsModeState] = useState<GraphicsMode>(() => {
    const saved = localStorage.getItem('bonga_graphics_mode');
    return (saved as GraphicsMode) || 'high-end';
  });

  const [contrastEnhanced, setContrastEnhanced] = useState<boolean>(() => {
    const saved = localStorage.getItem('bonga_contrast_enhanced');
    return saved === 'true' || graphicsMode === 'performance';
  });

  const [autoDetected, setAutoDetected] = useState<boolean>(false);

  // CPU/Hardware performance inspection & auto-detection
  useEffect(() => {
    const savedMode = localStorage.getItem('bonga_graphics_mode');
    if (savedMode) return; // respect user preference if already saved

    let isPerformanceRecommended = false;

    // 1. Memory Detection (Typical for low-end / mid-range mobiles)
    if ('deviceMemory' in navigator) {
      const memory = (navigator as any).deviceMemory;
      if (memory && memory <= 4) {
        isPerformanceRecommended = true;
      }
    }

    // 2. CPU Cores Inspection
    if ('hardwareConcurrency' in navigator) {
      const cores = navigator.hardwareConcurrency;
      if (cores && cores <= 4) {
        isPerformanceRecommended = true;
      }
    }

    // 3. User Agent keywords (budget devices / old Android devices)
    const ua = navigator.userAgent.toLowerCase();
    if (
      ua.includes('mobi') && 
      (ua.includes('android 8') || ua.includes('android 9') || ua.includes('redmi') || ua.includes('tecno') || ua.includes('itel'))
    ) {
      isPerformanceRecommended = true;
    }

    // 4. Heavy render performance measurement (Frame Rate check)
    // Run a quick baseline RAF lag test to check for rendering overhead
    let frameTimes: number[] = [];
    let lastTime = performance.now();
    let frameCount = 0;
    const checkFrames = (time: number) => {
      frameCount++;
      const duration = time - lastTime;
      lastTime = time;
      if (frameCount > 5) {
        frameTimes.push(duration);
      }
      if (frameCount < 12) {
        requestAnimationFrame(checkFrames);
      } else {
        const averageFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
        // If frames regularly exceed ~25ms on layout, force performance profile
        if (averageFrameTime > 25) {
          console.warn('Graphics performance stutter detected (avg frame space:', averageFrameTime, 'ms). Swapped to Performance Mode.');
          setGraphicsModeState('performance');
          setContrastEnhanced(true);
          setAutoDetected(true);
          localStorage.setItem('bonga_graphics_mode', 'performance');
        }
      }
    };
    requestAnimationFrame(checkFrames);

    if (isPerformanceRecommended) {
      console.log('Low-spec hardware parameters recognized. Initializing with Performance Profile.');
      setGraphicsModeState('performance');
      setContrastEnhanced(true);
      setAutoDetected(true);
      localStorage.setItem('bonga_graphics_mode', 'performance');
    }
  }, []);

  const setGraphicsMode = (mode: GraphicsMode) => {
    setGraphicsModeState(mode);
    localStorage.setItem('bonga_graphics_mode', mode);
    // Auto-link contrast enhancement with performance mode
    if (mode === 'performance') {
      setContrastEnhanced(true);
      localStorage.setItem('bonga_contrast_enhanced', 'true');
    } else {
      setContrastEnhanced(false);
      localStorage.setItem('bonga_contrast_enhanced', 'false');
    }
    window.dispatchEvent(new CustomEvent('bonga_graphics_changed', { detail: { mode } }));
  };

  const toggleGraphicsMode = () => {
    setGraphicsMode(graphicsMode === 'high-end' ? 'performance' : 'high-end');
  };

  const toggleContrast = () => {
    const nextVal = !contrastEnhanced;
    setContrastEnhanced(nextVal);
    localStorage.setItem('bonga_contrast_enhanced', nextVal ? 'true' : 'false');
  };

  const isLowEnd = graphicsMode === 'performance';

  // CSS Helpers to guarantee uniform, responsive styling consistency across high-end screens & low-end screens:
  
  // 1. Backdrop Blur: low-end displays don't support or suffer lag from blur-filters
  const blurClass = (fallback: string = 'bg-white/95') => {
    return isLowEnd ? fallback : 'backdrop-blur-md bg-white/90';
  };

  // 2. Glow shadows: low-end displays have poor black representation and high shadow rendering stutters
  const glowClass = (fallback: string = 'shadow-sm') => {
    return isLowEnd ? `${fallback} border-slate-200` : 'shadow-glow hover:shadow-glow-strong';
  };

  // 3. Gray contrasts: low-end monitors wash out borders under slate-100 or indigo-100
  const borderClass = (fallbackWeight: 'light' | 'normal' | 'strong' = 'normal') => {
    if (contrastEnhanced || isLowEnd) {
      if (fallbackWeight === 'light') return 'border-slate-250';
      if (fallbackWeight === 'strong') return 'border-slate-400';
      return 'border-slate-300';
    }
    if (fallbackWeight === 'light') return 'border-slate-50/50';
    if (fallbackWeight === 'strong') return 'border-slate-200';
    return 'border-slate-100';
  };

  // 4. Core readability: text-slate-400 is heavily washed out on budget screens
  const textMutedClass = () => {
    return (contrastEnhanced || isLowEnd) ? 'text-slate-650 font-medium' : 'text-slate-400 font-normal';
  };

  // 5. Motion Spring configuration (use simpler and lighter animations to prevent CPU throttling)
  const springConfig = isLowEnd 
    ? { transition: { duration: 0.1, ease: 'easeOut' } } // direct, fast, simple translation
    : { type: 'spring', stiffness: 350, damping: 25 }; // organic bounce physics for GPU-accel desktop layouts

  return (
    <GraphicsContext.Provider
      value={{
        graphicsMode,
        setGraphicsMode,
        toggleGraphicsMode,
        isLowEnd,
        autoDetected,
        contrastEnhanced,
        toggleContrast,
        blurClass,
        glowClass,
        borderClass,
        textMutedClass,
        springConfig,
      }}
    >
      <div 
        className={`graphics-profile-${graphicsMode} ${contrastEnhanced ? 'display-contrast-enhanced' : ''}`}
        id="app-graphics-root"
      >
        {children}
      </div>
    </GraphicsContext.Provider>
  );
};

export const useGraphics = () => useContext(GraphicsContext);
