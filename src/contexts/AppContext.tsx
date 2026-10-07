import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface AppContextType {
  reviewMode: boolean;
  setReviewMode: (val: boolean) => void;
  accountLabel: string | null;
  setAccountLabel: (val: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [reviewMode, setReviewMode] = useState(false);
  const [accountLabel, setAccountLabel] = useState<string | null>(localStorage.getItem("ds_account"));

  const updateAccountLabel = (val: string | null) => {
    if (val) {
      localStorage.setItem("ds_account", val);
    } else {
      localStorage.removeItem("ds_account");
    }
    setAccountLabel(val);
  };

  return (
    <AppContext.Provider value={{ reviewMode, setReviewMode, accountLabel, setAccountLabel: updateAccountLabel }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
