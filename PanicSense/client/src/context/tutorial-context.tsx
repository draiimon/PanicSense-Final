import React, { createContext, useContext, useState, useEffect } from 'react';

interface TutorialContextType {
  showTutorial: boolean;
  completedTutorial: boolean;
  startTutorial: () => void;
  closeTutorial: () => void;
  completeTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

const STORAGE_KEY = 'panicsense-tutorial-completed';

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [completedTutorial, setCompletedTutorial] = useState(true); // Mark as completed by default
  const [initialCheck, setInitialCheck] = useState(true); // Skip initial check
  
  // Modified behavior: never show tutorial automatically
  useEffect(() => {
    // Always set as completed in local storage to prevent future popups
    localStorage.setItem(STORAGE_KEY, 'true');
  }, []);
  
  const startTutorial = () => {
    setShowTutorial(true);
  };
  
  const closeTutorial = () => {
    setShowTutorial(false);
  };
  
  const completeTutorial = () => {
    setShowTutorial(false);
    setCompletedTutorial(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  };
  
  return (
    <TutorialContext.Provider
      value={{
        showTutorial,
        completedTutorial,
        startTutorial,
        closeTutorial,
        completeTutorial
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};