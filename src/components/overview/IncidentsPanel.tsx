import React, { useState } from 'react';
import {
  RadioTower,
  Monitor,
  ChevronRight,
  ArrowRight,
  X,
  ShieldAlert,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatId } from '@/lib/utils';
import { useOverview } from '@/contexts/OverviewContext';

export interface IncidentData {
  id: string;
  badge: 'Offline' | 'Stale';
  duration: string;
  type: 'tower' | 'monitor';
  location: string;
  issue: string;
  site: string;
  coords: string;
  lastSeenRelative: string;
  lastSeenAbsolute: string;
  uptime: string;
  connectedRoute: string;
  poles: string[];
  nearbyCameras: string[];
}

export const incidentList: IncidentData[] = [
  {
    id: 'DEV-004',
    badge: 'Offline',
    duration: '2h 14m',
    type: 'tower',
    location: 'Batu Lintang',
    issue: 'No signal',
    site: 'Batu Lintang Relay Tower',
    coords: '1.5342° N, 110.3582° E',
    lastSeenRelative: '2h 14m ago',
    lastSeenAbsolute: '12:18 MYT',
    uptime: '99.12%',
    connectedRoute: 'CBL-KCH-10',
    poles: ['POL-024', 'POL-025', 'POL-026'],
    nearbyCameras: ['CAM-004 Batu Lintang Bridge'],
  },
  {
    id: 'DEV-011',
    badge: 'Offline',
    duration: '5h 03m',
    type: 'tower',
    location: 'Pending',
    issue: 'Power loss',
    site: 'Pending Industrial Substation',
    coords: '1.5584° N, 110.3812° E',
    lastSeenRelative: '5h 03m ago',
    lastSeenAbsolute: '09:29 MYT',
    uptime: '98.74%',
    connectedRoute: 'CBL-KCH-02',
    poles: ['POL-011', 'POL-012'],
    nearbyCameras: ['CAM-002 Petra North Junction'],
  },
  {
    id: 'DEV-003',
    badge: 'Stale',
    duration: '8h 27m',
    type: 'monitor',
    location: 'Petra Jaya',
    issue: 'Last data 08:14',
    site: 'Petra Jaya Hub Cabinet B',
    coords: '1.5721° N, 110.3340° E',
    lastSeenRelative: '8h 27m ago',
    lastSeenAbsolute: '08:14 MYT',
    uptime: '99.85%',
    connectedRoute: 'CBL-KCH-05',
    poles: ['POL-031', 'POL-032'],
    nearbyCameras: ['CAM-001 Kuching River West'],
  },
  {
    id: 'DEV-008',
    badge: 'Stale',
    duration: '6h 11m',
    type: 'monitor',
    location: 'Telaga Air',
    issue: 'Last data 10:31',
    site: 'Telaga Air Coastal Station',
    coords: '1.6852° N, 110.2114° E',
    lastSeenRelative: '6h 11m ago',
    lastSeenAbsolute: '10:31 MYT',
    uptime: '99.64%',
    connectedRoute: 'CBL-KCH-03',
    poles: ['POL-007', 'POL-008'],
    nearbyCameras: ['CAM-007 Damai Coast'],
  },
];

interface IncidentsPanelProps {
  selectedId: string | null;
  onSelectItem: (id: string | null) => void;
}

export const IncidentsPanel: React.FC<IncidentsPanelProps> = ({
  selectedId,
  onSelectItem,
}) => {
  const { kpiFilter } = useOverview();
  const [viewAllOpen, setViewAllOpen] = useState(false);

  // Filter incidents based on KPI filter
  const displayedIncidents = incidentList.filter((item) => {
    if (kpiFilter === 'offline') return item.badge === 'Offline';
    if (kpiFilter === 'stale') return item.badge === 'Stale';
    return true;
  });

  return (
    <>
      <div
        style={{ width: '280px' }}
        className="pointer-events-auto flex flex-col rounded-[12px] border border-border bg-popover/95 backdrop-blur-md shadow-2xl overflow-hidden transition-all duration-200 select-none z-30"
        data-node-id="138:13630"
        data-name="Incidents and attention"
      >
        {/* Header (42px) */}
        <div
          className="flex items-center justify-between h-[42px] px-[15px] border-b border-border shrink-0"
          data-node-id="138:13631"
          data-name="Incident panel header"
        >
          <span className="text-[12px] font-semibold text-foreground tracking-tight">
            Incidents &amp; attention ({displayedIncidents.length})
          </span>
          <button
            onClick={() => setViewAllOpen(true)}
            className="flex items-center gap-[5px] text-[10px] font-normal text-primary hover:text-primary/80 transition-colors cursor-pointer"
            data-node-id="132:10720"
            data-name="View all incidents"
          >
            <span>View all</span>
            <ArrowRight className="size-[12px]" />
          </button>
        </div>

        {/* Incident Rows (61px tall each matching Figma node 138:13643) */}
        <div className="flex flex-col p-2 gap-1.5">
          {displayedIncidents.map((incident) => {
            const isSelected = selectedId && formatId(selectedId) === formatId(incident.id);
            const isOffline = incident.badge === 'Offline';

            return (
              <div
                key={incident.id}
                onClick={() => onSelectItem(incident.id)}
                className={`flex flex-col justify-between h-[61px] p-2.5 rounded-lg border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-primary/10 border-primary ring-1 ring-primary/40'
                    : 'bg-card border-border/60 hover:bg-muted shadow-xs'
                }`}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSelectItem(incident.id);
                }}
                data-name="Incident"
              >
                {/* Line 1: Attention indicator, Device ID, Status badge, and right-aligned Age */}
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    {/* Attention circle indicator 16px */}
                    <div
                      className={`size-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border ${
                        isOffline
                          ? 'bg-[#e33f50] border-[#f7808b] text-white animate-pulse'
                          : 'bg-[#a5acb8] border-[#cbd0d8] text-[#424a57]'
                      }`}
                      data-name="Attention indicator"
                    >
                      !
                    </div>

                    {/* Device ID (11px semibold font-mono) */}
                    <span className="font-semibold text-xs text-foreground font-mono">
                      {formatId(incident.id)}
                    </span>

                    {/* Status badge */}
                    <div
                      className={`h-[18px] px-1.5 rounded flex items-center justify-center text-[10px] font-medium leading-none ${
                        isOffline
                          ? 'dark:bg-[#e33f50]/15 bg-[#e33f50]/10 text-[#e33f50] border border-[#e33f50]/30'
                          : 'bg-muted text-muted-foreground'
                      }`}
                      data-name="Status badge"
                    >
                      {incident.badge}
                    </div>
                  </div>

                  {/* Age / Duration right-aligned */}
                  <span
                    className={`text-[10px] font-mono ${
                      isOffline ? 'text-[#e33f50]' : 'text-muted-foreground'
                    }`}
                  >
                    {incident.duration}
                  </span>
                </div>

                {/* Line 2: Type icon, Location - Cause, and right-aligned chevron */}
                <div className="flex items-center justify-between w-full pl-0.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5 min-w-0 truncate text-[11px]">
                    {incident.type === 'tower' ? (
                      <RadioTower className="size-3.5 shrink-0 text-muted-foreground" />
                    ) : (
                      <Monitor className="size-3.5 shrink-0 text-muted-foreground" />
                    )}
                    <span className="font-medium text-foreground/90 truncate">
                      {incident.location}
                    </span>
                    <span className="text-muted-foreground/60">•</span>
                    <span className="truncate text-muted-foreground">
                      {incident.issue}
                    </span>
                  </div>

                  <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* "View all" Full Right Sheet matching Section 5.5 */}
      <Sheet open={viewAllOpen} onOpenChange={setViewAllOpen}>
        <SheetContent
          side="right"
          className="p-0 sm:max-w-[460px] w-full border-l border-border bg-card text-foreground shadow-2xl h-full flex flex-col z-50"
        >
          <SheetHeader className="p-4 border-b border-border flex flex-row items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-[#e33f50]" />
              <SheetTitle className="text-sm font-bold text-foreground">
                All Active Incidents &amp; Triage ({incidentList.length})
              </SheetTitle>
            </div>
            <button
              onClick={() => setViewAllOpen(false)}
              className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {incidentList.map((card) => (
              <div
                key={card.id}
                onClick={() => {
                  onSelectItem(card.id);
                  setViewAllOpen(false);
                }}
                className="p-3.5 rounded-xl border border-border bg-muted/40 hover:bg-muted transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-2.5 rounded-full ${
                        card.badge === 'Offline' ? 'bg-[#e33f50]' : 'bg-[#a5acb8]'
                      }`}
                    />
                    <span className="font-mono font-bold text-sm text-foreground">
                      {formatId(card.id)}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        card.badge === 'Offline'
                          ? 'bg-[#b83243] text-white'
                          : 'bg-[#a5acb8] text-[#272d37]'
                      }`}
                    >
                      {card.badge}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">{card.duration}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{card.location}</span>: {card.issue} ({card.site})
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
