import React, { createContext, useContext, useState, useEffect } from 'react';

interface TourContextType {
  isTourOpen: boolean;
  isDemoMode: boolean;
  currentStepIndex: number;
  startTour: () => void;
  endTour: () => void;
  setStepIndex: (index: number) => void;
  setIsDemoMode: (enabled: boolean) => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const startTour = () => {
    setIsTourOpen(true);
    setIsDemoMode(true);
    setCurrentStepIndex(0);
  };

  const endTour = () => {
    setIsTourOpen(false);
    setIsDemoMode(false);
    setCurrentStepIndex(0);
  };

  const setStepIndex = (index: number) => {
    setCurrentStepIndex(index);
  };

  return (
    <TourContext.Provider value={{
      isTourOpen,
      isDemoMode,
      currentStepIndex,
      startTour,
      endTour,
      setStepIndex,
      setIsDemoMode
    }}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}
