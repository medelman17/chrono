'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface DashboardContextType {
  rightPanelContent: ReactNode | null;
  setRightPanelContent: (content: ReactNode | null) => void;
  rightPanelTitle: string;
  setRightPanelTitle: (title: string) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [rightPanelContent, setRightPanelContent] = useState<ReactNode | null>(null);
  const [rightPanelTitle, setRightPanelTitle] = useState('Details');

  return (
    <DashboardContext.Provider
      value={{
        rightPanelContent,
        setRightPanelContent,
        rightPanelTitle,
        setRightPanelTitle,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}