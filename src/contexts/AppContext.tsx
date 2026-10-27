import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { ClipStatus } from '@/components/evidence/clipStateMachine';

interface AppContextType {
  reviewMode: boolean;
  setReviewMode: (val: boolean) => void;
  accountLabel: string | null;
  setAccountLabel: (val: string | null) => void;
  previewClipStatus: ClipStatus | null;
  setPreviewClipStatus: (status: ClipStatus | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [reviewMode, setReviewMode] = useState(false);
  const [accountLabel, setAccountLabel] = useState<string | null>(localStorage.getItem("ds_account"));
  const [previewClipStatus, setPreviewClipStatus] = useState<ClipStatus | null>(null);

  const updateAccountLabel = (val: string | null) => {
    if (val) {
      localStorage.setItem("ds_account", val);
    } else {
      localStorage.removeItem("ds_account");
    }
    setAccountLabel(val);
  };

  return (
    <AppContext.Provider
      value={{
        reviewMode,
        setReviewMode,
        accountLabel,
        setAccountLabel: updateAccountLabel,
        previewClipStatus,
        setPreviewClipStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
