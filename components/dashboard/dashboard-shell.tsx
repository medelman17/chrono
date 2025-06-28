'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CasesSidebar } from '@/components/dashboard/cases-sidebar';
import { DashboardProvider, useDashboard } from '@/components/dashboard/dashboard-context';
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  PanelLeftClose,
  PanelRightClose,
} from 'lucide-react';

interface DashboardShellProps {
  children: React.ReactNode;
}

function DashboardShellContent({ children }: DashboardShellProps) {
  const { rightPanelContent, rightPanelTitle } = useDashboard();
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setLeftPanelCollapsed(true);
        setRightPanelCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="flex h-screen bg-background">
      {/* Left Panel - Navigation/Cases List */}
      <aside
        className={cn(
          'border-r bg-muted/10 transition-all duration-300 ease-in-out',
          leftPanelCollapsed ? 'w-16' : 'w-64',
          isMobile && !mobileMenuOpen && 'hidden'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center justify-between border-b px-4">
            {!leftPanelCollapsed && (
              <h2 className="text-lg font-semibold">Cases</h2>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
              className="h-8 w-8"
            >
              {leftPanelCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <CasesSidebar collapsed={leftPanelCollapsed} />
          </ScrollArea>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        {/* Mobile Header */}
        {isMobile && (
          <header className="flex h-14 items-center justify-between border-b bg-background px-4 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
            <h1 className="text-lg font-semibold">Chrono</h1>
            <div className="w-10" /> {/* Spacer for centering */}
          </header>
        )}

        {/* Center Panel - Main Content */}
        <main className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="container py-6">
              {children}
            </div>
          </ScrollArea>
        </main>
      </div>

      {/* Right Panel - Details/Actions */}
      <aside
        className={cn(
          'border-l bg-muted/10 transition-all duration-300 ease-in-out',
          rightPanelCollapsed ? 'w-16' : 'w-80',
          isMobile && 'hidden'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center justify-between border-b px-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
              className="h-8 w-8"
            >
              {rightPanelCollapsed ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <PanelRightClose className="h-4 w-4" />
              )}
            </Button>
            {!rightPanelCollapsed && (
              <h2 className="text-lg font-semibold">{rightPanelTitle}</h2>
            )}
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4">
              {!rightPanelCollapsed && (
                rightPanelContent || (
                  <div className="text-sm text-muted-foreground">
                    Select an item to view details
                  </div>
                )
              )}
            </div>
          </ScrollArea>
        </div>
      </aside>

      {/* Mobile Overlay Menu */}
      {isMobile && mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <aside
            className="absolute left-0 top-0 h-full w-64 bg-background shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-14 items-center justify-between border-b px-4">
              <h2 className="text-lg font-semibold">Cases</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <ScrollArea className="h-[calc(100%-3.5rem)]">
              <CasesSidebar collapsed={false} />
            </ScrollArea>
          </aside>
        </div>
      )}
    </div>
  );
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <DashboardProvider>
      <DashboardShellContent>{children}</DashboardShellContent>
    </DashboardProvider>
  );
}