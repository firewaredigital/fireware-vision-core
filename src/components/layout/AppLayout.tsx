import { ReactNode } from 'react';
import { AppSidebar, MobileSidebar } from './AppSidebar';
import { AppTopbar } from './AppTopbar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState } from 'react';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop Sidebar — hidden on mobile */}
      {!isMobile && <AppSidebar />}

      {/* Mobile Drawer */}
      {isMobile && (
        <MobileSidebar
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main content area */}
      <div className={`flex flex-1 flex-col min-w-0 ${!isMobile ? 'ml-[312px]' : ''}`}>
        <AppTopbar
          showHamburger={isMobile}
          onHamburgerClick={() => setMobileMenuOpen((v) => !v)}
        />
        <main className="flex-1 overflow-auto bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
