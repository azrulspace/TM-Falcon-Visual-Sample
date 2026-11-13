import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Layers, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiMode } from '@/hooks/useUiMode';
import { useAssets } from '@/contexts/AssetsContext';

export interface AssetsModuleTabsProps {
  activeTab: 'poles' | 'cable_spans' | 'devices';
  polesCount: number;
  cableSpansCount: number;
  devicesCount?: number;
}

export const AssetsModuleTabs: React.FC<AssetsModuleTabsProps> = ({
  activeTab,
  polesCount,
  cableSpansCount,
  devicesCount,
}) => {
  const navigate = useNavigate();
  const { isTablet } = useUiMode();
  const { richDevices } = useAssets();
  const resolvedDevicesCount = devicesCount ?? richDevices.length;

  const tabs: {
    key: 'poles' | 'cable_spans' | 'devices';
    label: string;
    count: number;
    route: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'poles',
      label: 'Poles',
      count: polesCount,
      route: '/assets/poles',
      icon: <MapPin className="size-3.5 shrink-0" />,
    },
    {
      key: 'cable_spans',
      label: 'Cable spans',
      count: cableSpansCount,
      route: '/assets/cable-spans',
      icon: <Layers className="size-3.5 shrink-0" />,
    },
    {
      key: 'devices',
      label: 'Devices',
      count: resolvedDevicesCount,
      route: '/assets/inventory',
      icon: <Cpu className="size-3.5 shrink-0" />,
    },
  ];

  return (
    <div className="border-b border-border mb-4 select-none">
      <nav
        role="tablist"
        aria-label="Assets and devices modules"
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
              onClick={() => navigate(tab.route)}
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

