import React, { useState } from 'react';
import {
  RadioTower,
  Monitor,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  X,
  ShieldAlert,
  Camera,
  Activity,
  UserCheck,
  CheckCircle2,
  FilePlus2,
  ExternalLink,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  const [snapshotLightboxOpen, setSnapshotLightboxOpen] = useState(false);
  const [assignUser, setAssignUser] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filter incidents based on KPI filter
  const displayedIncidents = incidentList.filter((item) => {
    if (kpiFilter === 'offline') return item.badge === 'Offline';
    if (kpiFilter === 'stale') return item.badge === 'Stale';
    return true;
  });

  // Check if current selection matches any incident in the list
  const activeIncident = incidentList.find(
    (item) => formatId(item.id) === (selectedId ? formatId(selectedId) : null)
  );

  const isInspectorMode = Boolean(activeIncident);

  return (
    <>
      <div
        style={{
          width: isInspectorMode ? '360px' : '280px',
        }}
        className="pointer-events-auto flex flex-col rounded-[12px] border dark:border-[#222b38] border-slate-200/90 dark:bg-[#141b23]/95 bg-white/95 backdrop-blur-md shadow-2xl overflow-hidden transition-all duration-200 select-none z-30"
        data-node-id="138:13630"
        data-name="Incidents and attention"
      >
        {!activeIncident ? (
          /* ================= DEFAULT 280px LIST VIEW ================= */
          <>
            {/* Header (42px) */}
            <div
              className="flex items-center justify-between h-[42px] px-[15px] border-b dark:border-[#222b38] border-slate-200 shrink-0"
              data-node-id="138:13631"
              data-name="Incident panel header"
            >
              <span className="text-[12px] font-semibold text-slate-800 dark:text-[#e2e7ef] tracking-tight">
                Incidents &amp; attention ({displayedIncidents.length})
              </span>
              <button
                onClick={() => setViewAllOpen(true)}
                className="flex items-center gap-[5px] text-[10px] font-normal text-[#6c9cd8] hover:text-[#90b9ee] transition-colors cursor-pointer"
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
                        ? 'dark:bg-[#1e2632] bg-sky-50/70 border-primary ring-1 ring-primary/40'
                        : 'dark:bg-[#161c24] bg-white border-slate-200/60 dark:border-[#222b38] hover:dark:bg-[#1c2430] hover:bg-slate-50 shadow-xs'
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
                        <span className="font-semibold text-xs dark:text-[#e2e7ef] text-slate-800 font-mono">
                          {formatId(incident.id)}
                        </span>

                        {/* Status badge */}
                        <div
                          className={`h-[18px] px-1.5 rounded flex items-center justify-center text-[10px] font-medium leading-none ${
                            isOffline
                              ? 'dark:bg-[#e33f50]/15 bg-[#e33f50]/10 text-[#e33f50] border border-[#e33f50]/30'
                              : 'dark:bg-slate-700/50 bg-slate-200 text-slate-700 dark:text-slate-300'
                          }`}
                          data-name="Status badge"
                        >
                          {incident.badge}
                        </div>
                      </div>

                      {/* Age / Duration right-aligned */}
                      <span
                        className={`text-[10px] font-mono ${
                          isOffline ? 'text-[#e33f50]' : 'dark:text-[#a3adbd] text-slate-500'
                        }`}
                      >
                        {incident.duration}
                      </span>
                    </div>

                    {/* Line 2: Type icon, Location - Cause, and right-aligned chevron */}
                    <div className="flex items-center justify-between w-full pl-0.5 text-xs text-slate-500 dark:text-[#a3adbd]">
                      <div className="flex items-center gap-1.5 min-w-0 truncate text-[11px]">
                        {incident.type === 'tower' ? (
                          <RadioTower className="size-3.5 shrink-0 text-slate-400 dark:text-[#8895a7]" />
                        ) : (
                          <Monitor className="size-3.5 shrink-0 text-slate-400 dark:text-[#8895a7]" />
                        )}
                        <span className="font-medium dark:text-slate-300 text-slate-700 truncate">
                          {incident.location}
                        </span>
                        <span className="text-slate-400 dark:text-[#64748b]">•</span>
                        <span className="truncate text-slate-500 dark:text-[#94a3b8]">
                          {incident.issue}
                        </span>
                      </div>

                      <ChevronRight className="size-3.5 text-slate-400 dark:text-[#718096] shrink-0" />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* ================= EXPANDED 360px INSPECTOR MODE ================= */
          <div className="flex flex-col max-h-[640px] overflow-hidden">
            {/* Inspector Header */}
            <div className="flex items-center justify-between h-[44px] px-3.5 border-b dark:border-[#2a323d] border-slate-200 bg-black/10 shrink-0">
              <button
                onClick={() => onSelectItem(null)}
                className="flex items-center gap-1.5 text-xs text-primary hover:text-sky-400 transition-colors font-medium cursor-pointer"
              >
                <ArrowLeft className="size-3.5" />
                <span>Back to incidents</span>
              </button>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-foreground">
                  {formatId(activeIncident.id)}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                    activeIncident.badge === 'Offline'
                      ? 'bg-[#b83243] text-white'
                      : 'bg-[#a5acb8] text-[#272d37]'
                  }`}
                >
                  {activeIncident.badge}
                </span>
                <button
                  onClick={() => onSelectItem(null)}
                  className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Close inspector"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Inspector Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 text-xs no-scrollbar">
              {/* Key Facts Definition Grid */}
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-black/15 border dark:border-[#2a323d] border-slate-200">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Facility Site</span>
                  <span className="font-medium text-foreground text-[11px] truncate block">
                    {activeIncident.site}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Coordinates</span>
                  <span className="font-mono text-[11px] text-foreground block">
                    {activeIncident.coords}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Last Telemetry</span>
                  <span className="text-[11px] text-foreground font-mono block">
                    {activeIncident.lastSeenRelative} ({activeIncident.lastSeenAbsolute})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Annual Uptime SLA</span>
                  <span className="text-[11px] text-emerald-400 font-mono font-semibold block">
                    {activeIncident.uptime}
                  </span>
                </div>
              </div>

              {/* Evidence Snapshot Frame */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-foreground">Field Evidence Snapshot</span>
                  <button
                    onClick={() => setSnapshotLightboxOpen(true)}
                    className="text-[10px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Enlarge</span>
                    <ExternalLink className="size-2.5" />
                  </button>
                </div>
                <div
                  onClick={() => setSnapshotLightboxOpen(true)}
                  className="relative h-28 rounded-lg overflow-hidden border dark:border-[#2a323d] border-slate-200 cursor-pointer group bg-slate-900"
                >
                  <img
                    src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80"
                    alt="Telemetry field station"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-white/90">
                    <span className="bg-black/60 px-1.5 py-0.5 rounded">{activeIncident.issue}</span>
                    <span>{activeIncident.lastSeenAbsolute}</span>
                  </div>
                </div>
              </div>

              {/* Connected Cable Route & Poles */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-foreground">Connected Cable Route</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-sky-500/15 text-sky-400 font-mono text-[10px] border border-sky-500/30 font-semibold">
                    {activeIncident.connectedRoute} (Single-mode)
                  </span>
                  {activeIncident.poles.map((pole) => (
                    <span
                      key={pole}
                      className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[10px]"
                    >
                      {pole}
                    </span>
                  ))}
                </div>
              </div>

              {/* Nearby Surveillance CCTV */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-foreground">Nearby Optical Feeds</span>
                <div className="space-y-1">
                  {activeIncident.nearbyCameras.map((cam) => (
                    <div
                      key={cam}
                      className="flex items-center justify-between p-1.5 rounded bg-black/10 border dark:border-[#2a323d] border-slate-200 hover:bg-black/20 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Camera className="size-3.5 text-primary" />
                        <span className="text-[11px] text-foreground">{cam}</span>
                      </div>
                      <span className="text-[10px] text-emerald-400">● LIVE</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Incident State Transitions */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-foreground">Telemetry Transition History</span>
                <div className="border-l border-border/80 ml-2 pl-3 space-y-2 text-[10px]">
                  <div>
                    <div className="font-semibold text-rose-400">{activeIncident.issue} Alert Triggered</div>
                    <div className="text-muted-foreground font-mono">{activeIncident.lastSeenRelative}</div>
                  </div>
                  <div>
                    <div className="text-foreground">Signal Degradation Check (-3.2dB)</div>
                    <div className="text-muted-foreground font-mono">10m prior</div>
                  </div>
                  <div>
                    <div className="text-foreground">Nominal Heartbeat Received</div>
                    <div className="text-muted-foreground font-mono">25m prior</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="p-3 border-t dark:border-[#2a323d] border-slate-200 bg-[#151a22] flex items-center justify-between gap-2 shrink-0">
              <button
                onClick={() => showToast(`Investigation dispatched for ${formatId(activeIncident.id)}`)}
                className="flex-1 py-1.5 px-3 rounded-md bg-[#1850a0] hover:bg-sky-600 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Activity className="size-3.5" />
                <span>Investigate</span>
              </button>

              <button
                onClick={() => showToast(`Incident acknowledged by Ahmad Syukri`)}
                className="py-1.5 px-2.5 rounded-md border dark:border-[#2a323d] border-slate-300 hover:bg-white/5 text-foreground text-xs transition-colors flex items-center gap-1 cursor-pointer"
                title="Acknowledge alert"
              >
                <CheckCircle2 className="size-3.5 text-emerald-400" />
                <span>Ack</span>
              </button>

              <Popover>
                <PopoverTrigger
                  render={
                    <button
                      className="py-1.5 px-2.5 rounded-md border dark:border-[#2a323d] border-slate-300 hover:bg-white/5 text-foreground text-xs transition-colors flex items-center gap-1 cursor-pointer"
                      title="Assign field crew"
                    >
                      <UserCheck className="size-3.5 text-primary" />
                      <span>{assignUser || 'Assign'}</span>
                    </button>
                  }
                />
                <PopoverContent side="top" className="w-48 p-2 text-xs bg-popover border border-border shadow-2xl z-50">
                  <div className="font-semibold text-foreground mb-1.5 px-1">Dispatch Crew Member</div>
                  {['Ahmad Syukri (Lead)', 'Farhan Zain (Kuching East)', 'Siti Nurhaliza (Fiber Tech)'].map(
                    (user) => (
                      <div
                        key={user}
                        onClick={() => {
                          setAssignUser(user.split(' ')[0]);
                          showToast(`Assigned to ${user}`);
                        }}
                        className="p-1.5 rounded hover:bg-muted cursor-pointer transition-colors"
                      >
                        {user}
                      </div>
                    )
                  )}
                </PopoverContent>
              </Popover>

              <button
                onClick={() => showToast(`Field ticket case created for ${formatId(activeIncident.id)}`)}
                className="p-1.5 rounded-md border dark:border-[#2a323d] border-slate-300 hover:bg-white/5 text-foreground transition-colors cursor-pointer"
                title="Create case"
              >
                <FilePlus2 className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Dialog for Evidence Snapshot */}
      <Dialog open={snapshotLightboxOpen} onOpenChange={setSnapshotLightboxOpen}>
        <DialogContent className="max-w-2xl bg-[#141b23] border border-[#2a323d] text-white p-4">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Inspection Snapshot — {activeIncident ? formatId(activeIncident.id) : ''} ({activeIncident?.site})
            </DialogTitle>
          </DialogHeader>
          <div className="relative rounded-lg overflow-hidden border border-[#2a323d] mt-2">
            <img
              src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=85"
              alt="Telemetry high resolution snapshot"
              className="w-full h-auto max-h-[480px] object-cover"
            />
            <div className="absolute bottom-3 left-3 bg-black/75 px-3 py-1.5 rounded text-xs font-mono">
              Timestamp: {activeIncident?.lastSeenAbsolute} MYT • Status: {activeIncident?.issue}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* "View all" Full Right Sheet matching Section 5.5 */}
      <Sheet open={viewAllOpen} onOpenChange={setViewAllOpen}>
        <SheetContent
          side="right"
          className="p-0 sm:max-w-[460px] w-full border-l dark:border-[#2a323d] border-slate-200 dark:bg-[#151a22] bg-white text-foreground shadow-2xl h-full flex flex-col z-50"
        >
          <SheetHeader className="p-4 border-b dark:border-[#2a323d] border-slate-200 flex flex-row items-center justify-between shrink-0">
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
                className="p-3.5 rounded-xl border dark:border-[#2a323d] border-slate-200 dark:bg-[#1a212c] bg-slate-50 hover:dark:bg-[#202937] hover:bg-slate-100 transition-all cursor-pointer"
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

      {/* Floating Action Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-28 right-8 bg-[#1850a0] text-white px-4 py-2 rounded-lg shadow-2xl text-xs font-medium z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
          {toastMessage}
        </div>
      )}
    </>
  );
};
