import { useEffect, useState } from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

export function Logo({ className = '', showText = true, textClassName = '' }: LogoProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial theme
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkTheme();

    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const logoSrc = isDark ? '/whitelogo.png' : '/blacklogo.png';
  const defaultTextClassName = 'text-base lg:text-lg font-semibold text-sidebar-foreground';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src={logoSrc} 
        alt="ChatFlow Logo" 
        className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0"
      />
      {showText && (
        <span className={textClassName || defaultTextClassName}>ChatFlow</span>
      )}
    </div>
  );
}

