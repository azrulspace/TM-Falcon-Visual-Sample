import React from 'react';
import { cn } from '@/lib/utils';
import type { DeviceRecord } from '@/types/devices';

export type DeviceDetailTabKey =
  | 'overview'
  | 'configuration'
  | 'history'
  | 'installation'
  | 'events'
  | 'health_reports';

export interface DeviceDetailTabsProps {
  device: DeviceRecord;
  activeTab: DeviceDetailTabKey;
  onSelectTab: (tab: DeviceDetailTabKey) => void;
}

export const DeviceDetailTabs: React.FC<DeviceDetailTabsProps> = ({
  device,
  activeTab,
  onSelectTab,
}) => {
  const tabs: {
    key: DeviceDetailTabKey;
    label: string;
    count?: number | string;
    badgeVariant?: 'default' | 'accent' | 'warning';
  }[] = [
    {
      key: 'overview',
      label: 'Overview',
    },
    {
      key: 'configuration',
      label: 'Configuration',
      count: device.appliedConfigVersion || 'None',
      badgeVariant: device.appliedConfigVersion ? 'accent' : 'default',
    },
    {
      key: 'history',
      label: 'History',
      count:
        (device.connectivityHistory?.length || 0) +
        (device.timeline?.length || 0),
    },
    {
      key: 'installation',
      label: 'Installation',
      count: device.installationHistory?.length || (device.installedOnPoleId ? 1 : 0),
    },
    {
      key: 'events',
      label: 'Events',
      count: device.events30dCount || 0,
    },
    {
      key: 'health_reports',
      label: 'Health reports',
      count: device.healthReports?.length || 0,
    },
  ];

  return (
    <div className="border-b border-border mb-6">
      <nav className="flex space-x-6 overflow-x-auto scrollbar-none" aria-label="Device tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onSelectTab(tab.key)}
              className={cn(
                'py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer',
                isActive
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded-full text-[10px] font-mono',
                    isActive
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
