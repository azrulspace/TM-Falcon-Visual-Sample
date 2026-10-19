import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Copy,
  Check,
  Maximize2,
  ExternalLink,
  MapPin,
  Calendar,
  Wifi,
  HardDrive,
  Shield,
  Activity,
  Clock,
  Cable,
  Camera,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { StatusBadge, SeverityBadge } from '@/components/common/StatusBadge';
import { devices } from '@/data/devices';
import { events } from '@/data/events';
import { attention } from '@/data/attention';
import { cases } from '@/data/cases';

interface DetailPanelProps {
  selectedId: string | null;
  onClose: () => void;
  isSheet?: boolean;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({
  selectedId,
  onClose,
  isSheet = false,
}) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('details');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [mediaExpanded, setMediaExpanded] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  if (!selectedId) return null;

  // Resolve matching entity across devices, attention items, events, cases
  const dev = devices.find((d) => d.id === selectedId || d.asset === selectedId);
  const att = attention.find((a) => a.id === selectedId || a.marker === selectedId);
  const evt = events.find((e) => e.id === selectedId || e.device === selectedId);
  const cas = cases.find((c) => c.id === selectedId);

  const isEvent = selectedId.startsWith('EVT_') || att?.kind === 'EVENT';
  const isCase = selectedId.startsWith('CAS_') || att?.kind === 'CASE';

  // Attributes resolution
  const entityId = isEvent ? (evt?.id || att?.id || selectedId) : isCase ? (cas?.id || selectedId) : (dev?.id || selectedId);
  const title = isEvent ? (evt?.type || att?.title || 'Telemetry Incident') : isCase ? (cas?.title || 'Field Work Case') : (dev?.name || 'Infrastructure Device');
  const site = dev?.site || 'Kuching Pilot Sector';
  const pole = dev?.asset || evt?.asset || cas?.asset || 'AST_002';
  const cableRoute = 'C-KCH-01 (Kuching Ring North)';
  const deviceType = dev?.type || 'Camera (Outdoor HD-PTZ)';
  const serial = dev?.serial || 'SN_TM_' + entityId;
  const ipAddress = '10.224.1.' + (dev ? dev.id.replace('DEV_', '') : '104');
  const installedDate = '12 Mar 2025';
  const lastMaintenance = '18 Jun 2025';
  const coordinates = dev?.location || '1.5893° N, 110.3276° E';
  const uptime = dev?.status === 'online' ? '99.8%' : dev?.status === 'stale' ? '94.2%' : '88.5%';
  const status = dev?.status || (isEvent ? (evt?.priority || 'High') : 'In progress');

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Associated event history for this entity
  const relatedHistory = events.filter(
    (e) => e.device === dev?.id || e.asset === pole || e.id === entityId
  );

  return (
    <div
      className={`flex flex-col h-full bg-card ${
        isSheet ? '' : 'rounded-panel border border-border'
      } overflow-hidden select-none`}
    >
      {/* Panel Header */}
      <div className="p-3 border-b border-border bg-card shrink-0 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold tracking-tight text-primary">{entityId}</span>
            {isEvent ? (
              <SeverityBadge severity={status} size="sm" />
            ) : (
              <StatusBadge status={status} size="sm" />
            )}
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="size-7 text-muted-foreground hover:text-foreground"
            aria-label="Close detail panel"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-foreground truncate">{title}</h3>
          <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
            <MapPin className="size-3 text-muted-foreground" />
            <span>{site} • Pole {pole}</span>
          </p>
        </div>
      </div>

      {/* Hero Media Preview (Camera pole snapshot) */}
      <div className="relative bg-muted/40 border-b border-border h-40 overflow-hidden shrink-0 group">
        <img
          src="/assets/sign-up-in-image-awiGwGfS.png"
          alt="Infrastructure pole preview"
          className={`w-full h-full object-cover transition-all duration-300 ${
            mediaExpanded ? 'scale-110' : 'group-hover:scale-105'
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-2 left-2 text-[10px] text-white/90 font-mono flex items-center gap-1.5">
          <Camera className="size-3 text-primary" />
          <span>Live Pole CCTV • {pole}</span>
        </div>
        <Tooltip>
          <TooltipTrigger render={
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setMediaExpanded(!mediaExpanded)}
              className="absolute top-2 right-2 size-7 bg-black/60 hover:bg-black/80 text-white rounded"
            >
              <Maximize2 className="size-3.5" />
            </Button>
          } />
          <TooltipContent side="left" className="text-xs">
            {mediaExpanded ? 'Collapse preview' : 'Expand full snapshot'}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Status Banner */}
      <div
        className={`px-3 py-2 border-b text-xs flex items-center justify-between shrink-0 ${
          status.toLowerCase() === 'offline'
            ? 'bg-status-offline-tint border-status-offline-border text-status-offline'
            : status.toLowerCase() === 'stale'
            ? 'bg-status-stale-tint border-status-stale-border text-status-stale'
            : status.toLowerCase() === 'high' || status.toLowerCase() === 'critical'
            ? 'bg-severity-high-tint border-severity-high/30 text-severity-high'
            : 'bg-status-online-tint border-status-online-border text-status-online'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <Activity className="size-3.5 shrink-0" />
          <span className="font-semibold">
            {status.toLowerCase() === 'offline'
              ? 'Offline since 12:15 (2h 17m ago)'
              : status.toLowerCase() === 'stale'
              ? 'Delayed telemetry reporting (5h ago)'
              : isEvent
              ? 'Active incident triage required'
              : 'Operational and telemetry nominal'}
          </span>
        </div>
        <span className="font-mono text-[10px] opacity-80">MYT</span>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="px-3 pt-2 border-b border-border bg-card">
          <TabsList className="h-7 w-full p-0.5 bg-muted/60 border border-border grid grid-cols-4 rounded-md">
            <TabsTrigger value="details" className="text-[11px] h-6 px-1 data-[state=active]:bg-card font-medium">
              Details
            </TabsTrigger>
            <TabsTrigger value="live" className="text-[11px] h-6 px-1 data-[state=active]:bg-card font-medium">
              Live view
            </TabsTrigger>
            <TabsTrigger value="history" className="text-[11px] h-6 px-1 data-[state=active]:bg-card font-medium">
              History ({relatedHistory.length})
            </TabsTrigger>
            <TabsTrigger value="assets" className="text-[11px] h-6 px-1 data-[state=active]:bg-card font-medium">
              Related
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Definition List */}
        <TabsContent value="details" className="flex-1 overflow-y-auto p-3 space-y-0.5 mt-0 divide-y divide-border/50">
          <DetailRow icon={MapPin} label="Site / POP" value={site} />
          <DetailRow icon={HardDrive} label="Pole asset" value={pole} />
          <DetailRow icon={Cable} label="Cable route" value={cableRoute} />
          <DetailRow icon={Camera} label="Device type" value={deviceType} />
          <DetailRow
            icon={Shield}
            label="Serial number"
            value={serial}
            isMono
            copyable
            onCopy={() => handleCopy(serial, 'serial')}
            copied={copiedKey === 'serial'}
          />
          <DetailRow
            icon={Wifi}
            label="IP address"
            value={ipAddress}
            isMono
            copyable
            onCopy={() => handleCopy(ipAddress, 'ip')}
            copied={copiedKey === 'ip'}
          />
          <DetailRow icon={Calendar} label="Installed date" value={installedDate} />
          <DetailRow icon={Clock} label="Last maintenance" value={lastMaintenance} />
          <DetailRow icon={Activity} label="Telemetry uptime" value={uptime} isMono />
          <DetailRow
            icon={MapPin}
            label="Coordinates"
            value={coordinates}
            isMono
            copyable
            onCopy={() => handleCopy(coordinates, 'coords')}
            copied={copiedKey === 'coords'}
          />
        </TabsContent>

        {/* Tab 2: Live View (CCTV / Sensor Feed) */}
        <TabsContent value="live" className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center text-center text-muted-foreground mt-0">
          <Camera className="size-8 stroke-[1.5] text-primary/80 mb-2" />
          <div className="text-xs font-semibold text-foreground">Live Video Telemetry Stream</div>
          <p className="text-[11px] text-muted-foreground mt-1 max-w-[220px]">
            H.265 RTSP streaming endpoint at {ipAddress}:554/live. Simulation active.
          </p>
          <div className="mt-3 px-2 py-1 rounded bg-muted/60 border border-border text-[10px] font-mono text-muted-foreground">
            Latency: 42ms • FPS: 25 • Bitrate: 4.2 Mbps
          </div>
        </TabsContent>

        {/* Tab 3: History Timeline */}
        <TabsContent value="history" className="flex-1 overflow-y-auto p-3 space-y-2 mt-0">
          {relatedHistory.length > 0 ? (
            relatedHistory.map((item) => (
              <div key={item.id} className="p-2.5 rounded-md border border-border bg-card/60 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-primary">{item.id}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{item.captured}</span>
                </div>
                <div className="text-xs text-foreground font-medium">{item.type}</div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                  <span>State: {item.state}</span>
                  <SeverityBadge severity={item.priority} size="sm" />
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-muted-foreground">
              No previous alert logs recorded for this asset.
            </div>
          )}
        </TabsContent>

        {/* Tab 4: Related Assets */}
        <TabsContent value="assets" className="flex-1 overflow-y-auto p-3 space-y-2 mt-0 text-xs">
          <div className="p-2.5 rounded border border-border bg-card/60 space-y-1">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <Layers className="size-3.5 text-primary" />
              <span>Pole Structure {pole}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">Steel composite pole with grounding lightning arrestor.</p>
          </div>
          <div className="p-2.5 rounded border border-border bg-card/60 space-y-1">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <Cable className="size-3.5 text-info" />
              <span>Cable Span {cableRoute}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">48-core Single Mode Fibre span from AST_002 to AST_003.</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Sticky Action Footer (Section 8.7: one primary button, others secondary) */}
      <div className="p-3 border-t border-border bg-card shrink-0 flex items-center gap-2">
        {isEvent ? (
          <>
            <Button
              variant="default"
              size="sm"
              onClick={() => setAcknowledged(true)}
              className="flex-1 h-8 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {acknowledged ? <><Check className="size-3.5 mr-1" /> Acknowledged</> : 'Acknowledge'}
            </Button>
            <Tooltip>
              <TooltipTrigger render={
                <Button variant="outline" size="sm" className="h-8 text-xs border-border">
                  Assign
                </Button>
              } />
              <TooltipContent side="top" className="text-xs">Dispatch field engineering unit</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger render={
                <Button variant="outline" size="sm" className="h-8 text-xs border-border">
                  Create case
                </Button>
              } />
              <TooltipContent side="top" className="text-xs">Escalate to preventive incident case</TooltipContent>
            </Tooltip>
          </>
        ) : (
          <>
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate(`/assets/inventory/devices/${entityId}`)}
              className="flex-1 h-8 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Activity className="size-3.5 mr-1.5" />
              Investigate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/assets/inventory/devices/${entityId}`)}
              className="h-8 text-xs border-border gap-1"
            >
              <span>Full page</span>
              <ExternalLink className="size-3" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

// Definition list row subcomponent (36px fixed density)
const DetailRow: React.FC<{
  icon: any;
  label: string;
  value: string;
  isMono?: boolean;
  copyable?: boolean;
  copied?: boolean;
  onCopy?: () => void;
}> = ({ icon: Icon, label, value, isMono = false, copyable = false, copied = false, onCopy }) => {
  return (
    <div className="h-9 px-1 flex items-center justify-between text-xs">
      <div className="flex items-center gap-2 text-muted-foreground truncate">
        <Icon className="size-3.5 shrink-0 opacity-70" />
        <span className="truncate">{label}</span>
      </div>
      <div className="flex items-center gap-1.5 text-foreground">
        <span className={`${isMono ? 'font-mono text-[11px] tabular-nums' : 'text-xs font-medium'} truncate`}>
          {value}
        </span>
        {copyable && onCopy && (
          <Tooltip>
            <TooltipTrigger render={
              <button
                onClick={onCopy}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label={`Copy ${label}`}
              >
                {copied ? <Check className="size-3 text-status-online" /> : <Copy className="size-3" />}
              </button>
            } />
            <TooltipContent side="left" className="text-xs font-mono">
              {copied ? 'Copied!' : 'Copy to clipboard'}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
};
