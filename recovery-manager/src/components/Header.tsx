import React, { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

export type NavItem = 'Dashboard' | 'Charges' | 'Evidence' | 'Reviews' | 'Analytics';

interface HeaderProps {
  activeNav: NavItem;
  onSelectNav: (item: NavItem) => void;
  onNavigateHome: () => void;
  fileName?: string;
  isProcessing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeNav,
  onSelectNav,
  onNavigateHome,
  fileName,
  isProcessing = false
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems: NavItem[] = ['Dashboard', 'Charges', 'Evidence', 'Reviews', 'Analytics'];

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-200 ${
        isScrolled
          ? 'bg-[#F5F3EE]/95 backdrop-blur-sm border-b border-[#E2DFD7] shadow-[0_1px_3px_rgba(0,0,0,0.03)]'
          : 'bg-[#F5F3EE] border-b border-[#E2DFD7]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand Lockup */}
        <div className="flex items-center gap-8">
          <button
            onClick={() => onSelectNav('Charges')}
            className="text-left group cursor-pointer focus:outline-none"
            title="Recovery Manager Home"
          >
            <span className="font-heading text-xl font-bold tracking-tight text-[#151515] group-hover:text-[#C64B32] transition-colors">
              Recovery Manager
            </span>
          </button>

          {/* Desktop Horizontal Navigation Bar */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = activeNav === item;

              return (
                <button
                  key={item}
                  onClick={() => {
                    onSelectNav(item);
                    if (item === 'Dashboard') {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className={`relative px-3.5 py-1.5 text-xs font-medium tracking-wide transition-colors cursor-pointer ${
                    isActive
                      ? 'text-[#C64B32] font-semibold'
                      : 'text-[#55524B] hover:text-[#151515]'
                  }`}
                >
                  <span>{item}</span>
                  {isActive && (
                    <span className="absolute bottom-[-18px] left-3.5 right-3.5 h-[2px] bg-[#C64B32]" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Zone: Contextual status & mobile menu trigger */}
        <div className="flex items-center gap-4">
          {fileName && !isProcessing && (
            <span className="hidden lg:inline-block text-xs font-mono text-[#737067] border-l border-[#E2DFD7] pl-4">
              {fileName}
            </span>
          )}

          {isProcessing && (
            <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#C64B32]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C64B32] animate-pulse" />
              <span>Analyzing</span>
            </span>
          )}

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-[#151515] hover:text-[#C64B32] transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu (Stays strictly at the top) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#E2DFD7] bg-[#FAF8F5] px-6 py-4 space-y-2">
          {navItems.map((item) => {
            const isActive = activeNav === item;

            return (
              <button
                key={item}
                onClick={() => {
                  onSelectNav(item);
                  setMobileMenuOpen(false);
                  if (item === 'Dashboard') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className={`block w-full text-left py-2 px-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-[#C64B32] bg-[#FAF3F1] font-semibold border-l-2 border-[#C64B32]'
                    : 'text-[#151515] hover:bg-[#F5F3EE]'
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
