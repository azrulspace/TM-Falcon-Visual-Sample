import React from 'react';
import { BookOpen, Clock, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiMode } from '@/hooks/useUiMode';

export type ReportsTabKey = 'library' | 'scheduled' | 'history';

export interface ReportsTabsProps {
  activeTab: ReportsTabKey;
  onSelectTab: (tab: ReportsTabKey) => void;
  libraryCount?: number;
  scheduledCount?: number;
  historyCount?: number;
}

export const ReportsTabs: React.FC<ReportsTabsProps> = ({
  activeTab,
  onSelectTab,
  libraryCount = 12,
  scheduledCount = 0,
  historyCount = 0,
}) => {
  const { isTablet } = useUiMode();

  const tabs: {
    key: ReportsTabKey;
    label: string;
    count: number;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'library',
      label: 'Library',
      count: libraryCount,
      icon: <BookOpen className="size-3.5 shrink-0" />,
    },
    {
      key: 'scheduled',
      label: 'Scheduled',
      count: scheduledCount,
      icon: <Clock className="size-3.5 shrink-0" />,
    },
    {
      key: 'history',
      label: 'History',
      count: historyCount,
      icon: <History className="size-3.5 shrink-0" />,
    },
  ];

  return (
    <div className="border-b border-border mb-4 select-none">
      <nav
        role="tablist"
        aria-label="Reports tabs"
        className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar -mb-px"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelectTab(tab.key)}
              className={cn(
                'flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary',
                isTablet ? 'px-4 py-3 text-sm min-h-[44px]' : 'px-3.5 py-2.5 text-xs font-medium',
                isActive
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.2 rounded-full tabular-nums font-mono',
                  isActive
                    ? 'bg-primary/15 text-primary font-bold'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
