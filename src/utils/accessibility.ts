/**
 * Accessibility Utilities
 * Helpers for keyboard navigation, ARIA announcements, and screen reader support
 */

export const announceToScreenReader = (message: string) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  document.body.appendChild(announcement);

  setTimeout(() => {
    announcement.remove();
  }, 1000);
};

export const focusElement = (elementId: string) => {
  const element = document.getElementById(elementId);
  if (element) {
    element.focus();
  }
};

export const isKeyboardEvent = (e: React.KeyboardEvent): boolean => {
  return e.code === 'Enter' || e.code === 'Space';
};

export const handleKeyboardClick = (callback: () => void) => (e: React.KeyboardEvent) => {
  if (isKeyboardEvent(e)) {
    e.preventDefault();
    callback();
  }
};

/**
 * Get WCAG-compliant color contrast ratio
 * Returns true if contrast ratio is >= 4.5:1 (AA standard for normal text)
 */
export const isContrastCompliant = (hex1: string, hex2: string): boolean => {
  const getLuminance = (hex: string): number => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance <= 0.03908 ? luminance / 12.92 : Math.pow((luminance + 0.055) / 1.055, 2.4);
  };

  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  const contrast = (lighter + 0.05) / (darker + 0.05);
  return contrast >= 4.5;
};
