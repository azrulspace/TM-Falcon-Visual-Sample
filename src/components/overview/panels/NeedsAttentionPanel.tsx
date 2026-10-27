import React, { useState, useMemo } from 'react';
import {
  Camera,
  RadioTower,
  Cpu,
  AlertTriangle,
  ChevronRight,
  ChevronUp,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatId } from '@/lib/utils';
import { useOverview } from '@/contexts/OverviewContext';

export interface AttentionItem {
  id: string; // Formatted ID e.g. DEV-004, EVT-0010
  rawId: string;
  type: 'device' | 'event';
  deviceType?: 'camera' | 'tower' | 'gateway' | 'lidar';
  severity: 'critical' | 'high' | 'offline' | 'stale';
  badgeLabel: string;
  age: string;
  location: string;
  reason: string;
}

const attentionDevicesList: AttentionItem[] = [
  {
    id: 'DEV-004',
    rawId: 'DEV_004',
    type: 'device',
    deviceType: 'lidar',
    severity: 'offline',
    badgeLabel: 'Offline',
    age: '2h 14m',
    location: 'Batu Lintang',
    reason: 'No signal',
  },
  {
    id: 'DEV-011',
    rawId: 'DEV_011',
    type: 'device',
    deviceType: 'tower',
    severity: 'offline',
    badgeLabel: 'Offline',
    age: '5h 03m',
    location: 'Pending',
    reason: 'Power loss',
  },
  {
    id: 'DEV-003',
    rawId: 'DEV_003',
    type: 'device',
    deviceType: 'camera',
    severity: 'stale',
    badgeLabel: 'Stale',
    age: '8h 27m',
    location: 'Petra Jaya',
    reason: 'Last data 08:14',
  },
  {
    id: 'DEV-008',
    rawId: 'DEV_008',
    type: 'device',
    deviceType: 'camera',
    severity: 'stale',
    badgeLabel: 'Stale',
    age: '6h 11m',
    location: 'Telaga Air',
    reason: 'Last data 10:31',
  },
];

const attentionEventsList: AttentionItem[] = [
  {
    id: 'EVT-0010',
    rawId: 'EVT_0010',
    type: 'event',
    severity: 'high',
    badgeLabel: 'High priority',
    age: '14m ago',
    location: 'Jalan Utama • CBL-001',
    reason: 'Monkey near cable',
  },
  {
    id: 'EVT-0128',
    rawId: 'EVT_0128',
    type: 'event',
    severity: 'high',
    badgeLabel: 'High priority',
    age: '1h 05m ago',
    location: 'Batu Lintang • CBL-041',
    reason: 'Vegetation encroaching span',
  },
  {
    id: 'EVT-0007',
    rawId: 'EVT_0007',
    type: 'event',
    severity: 'high',
    badgeLabel: 'No location',
    age: '3h 22m ago',
    location: 'Asset AST-009',
    reason: 'Unlocated telemetry alarm',
  },
];

export interface NeedsAttentionPanelProps {
  onClose: () => void;
}

export const NeedsAttentionPanel: React.FC<NeedsAttentionPanelProps> = ({ onClose }) => {
  const { selectEntity, selectedEntity, selectedId } = useOverview();
  const [activeTab, setActiveTab] = useState<'devices' | 'events'>('devices');

  // Compute total count
  const totalCount = attentionDevicesList.length + attentionEventsList.length;

  // Active items based on selected tab
  const items = useMemo(() => {
    return activeTab === 'devices' ? attentionDevicesList : attentionEventsList;
  }, [activeTab]);

  const renderDeviceIcon = (item: AttentionItem) => {
    if (item.type === 'event') {
      return <AlertTriangle className="size-3.5 shrink-0 text-amber-500" />;
    }
    if (item.deviceType === 'camera') {
      return <Camera className="size-3.5 shrink-0 text-slate-400 dark:text-[#8895a7]" />;
    }
    if (item.deviceType === 'tower') {
      return <RadioTower className="size-3.5 shrink-0 text-slate-400 dark:text-[#8895a7]" />;
    }
    return <Cpu className="size-3.5 shrink-0 text-slate-400 dark:text-[#8895a7]" />;
  };

  return (
    <div
      id="needs-attention-panel"
      className="flex flex-col w-[300px] max-h-[calc(100vh-220px)] text-foreground select-none overflow-hidden"
    >
      {/* 1. Sticky Header */}
      <div className="flex items-center justify-between h-[42px] px-3.5 border-b dark:border-[#222b38] border-slate-200 shrink-0 dark:bg-[#121720]/80 bg-slate-50/80">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground tracking-tight">
            Needs attention
          </span>
          {totalCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono bg-[#e33f50] text-white">
              {totalCount}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          aria-label="Collapse Needs attention panel"
          title="Collapse panel"
        >
          <ChevronUp className="size-4" />
        </button>
      </div>

      {/* 2. Type Tabs (Shown only for types that have items) */}
      <div className="flex items-center px-3 pt-2 gap-1.5 border-b dark:border-[#222b38] border-slate-200/60 shrink-0">
        <button
          onClick={() => setActiveTab('devices')}
          className={`flex items-center gap-1.5 pb-2 px-2 text-xs font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === 'devices'
              ? 'border-primary text-foreground font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span>Devices</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeTab === 'devices'
                ? 'bg-primary/20 text-primary'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {attentionDevicesList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`flex items-center gap-1.5 pb-2 px-2 text-xs font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === 'events'
              ? 'border-primary text-foreground font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span>Events</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeTab === 'events'
                ? 'bg-primary/20 text-primary'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {attentionEventsList.length}
          </span>
        </button>
      </div>

      {/* 3. Scrolling Body with Rich 2-Line Rows */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 no-scrollbar min-h-[160px]">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground space-y-1.5">
            <CheckCircle className="size-6 text-emerald-500" />
            <p className="text-xs font-medium text-foreground">Nothing needs attention</p>
            <p className="text-[11px]">All {activeTab} operating within nominal thresholds.</p>
          </div>
        ) : (
          items.map((item) => {
            const isSelected =
              (selectedEntity && (selectedEntity.id === item.id || selectedEntity.rawId === item.rawId)) ||
              (selectedId && formatId(selectedId) === item.id);
            const isOffline = item.severity === 'offline';
            const isHigh = item.severity === 'high';

            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  selectEntity(item.type, item.id, { fly: true, source: 'panel' });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    selectEntity(item.type, item.id, { fly: true, source: 'panel' });
                  }
                }}
                className={`flex flex-col justify-between p-2.5 rounded-lg border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'border-l-2 border-l-primary border-primary/50 dark:bg-[#1e2632] bg-sky-50/70 shadow-sm'
                    : 'dark:bg-[#161c24] bg-white border-slate-200/60 dark:border-[#222b38] hover:dark:bg-[#1c2430] hover:bg-slate-50'
                }`}
              >
                {/* Line 1: Semantic icon, Mono ID, Status badge, and Age */}
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Semantic Type Icon */}
                    {renderDeviceIcon(item)}

                    {/* Product ID (mono) */}
                    <span className="font-mono text-xs font-bold text-foreground truncate">
                      {item.id}
                    </span>

                    {/* Status badge */}
                    <span
                      className={`h-[18px] px-1.5 rounded flex items-center justify-center text-[10px] font-medium leading-none font-sans shrink-0 ${
                        isOffline || isHigh
                          ? 'dark:bg-[#e33f50]/15 bg-[#e33f50]/10 text-[#e33f50] border border-[#e33f50]/30'
                          : 'dark:bg-amber-500/15 bg-amber-500/10 text-amber-500 border border-amber-500/30'
                      }`}
                    >
                      {item.badgeLabel}
                    </span>
                  </div>

                  {/* Age */}
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0 pl-1">
                    {item.age}
                  </span>
                </div>

                {/* Line 2: Location and Reason on line two */}
                <div className="flex items-center justify-between w-full pt-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5 min-w-0 truncate text-[11px]">
                    <span className="font-medium text-foreground/90 truncate">{item.location}</span>
                    <span className="text-muted-foreground/60">•</span>
                    <span className="truncate text-muted-foreground">{item.reason}</span>
                  </div>
                  <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Sticky Footer with Navigation Link */}
      <div className="p-2.5 px-3.5 border-t dark:border-[#222b38] border-slate-200 shrink-0 dark:bg-[#121720]/90 bg-slate-50/90 flex items-center justify-between">
        {activeTab === 'devices' ? (
          <Link
            to="/assets/inventory"
            className="flex items-center justify-between w-full text-xs text-primary hover:text-sky-400 transition-colors font-medium cursor-pointer"
          >
            <span>View all devices</span>
            <ArrowRight className="size-3.5" />
          </Link>
        ) : (
          <Link
            to="/events"
            className="flex items-center justify-between w-full text-xs text-primary hover:text-sky-400 transition-colors font-medium cursor-pointer"
          >
            <span>View all events</span>
            <ArrowRight className="size-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
};
