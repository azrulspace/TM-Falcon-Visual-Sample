import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/contexts/ToastContext';
import { useLiveStream } from '@/contexts/LiveStreamContext';
import {
  isLivePreviewEnabled,
  getPreviewSessionState,
  setPreviewSessionState,
  resetPreviewSessionState,
  type PreviewSessionState,
} from '@/preview/live/previewConfig';
import type { UserRole } from '@/lib/permissions';
import type { DeviceConnectivityState } from '@/types/devices';
import { FlaskConical, RotateCcw, Zap, Shield, Radio, Volume2 } from 'lucide-react';

const CAMERAS = [
  'DEV-001', 'DEV-002', 'DEV-003', 'DEV-004', 'DEV-005',
  'DEV-006', 'DEV-007', 'DEV-008', 'DEV-009', 'DEV-010',
  'DEV-011', 'DEV-012', 'DEV-013', 'DEV-014', 'DEV-015',
];

export const PreviewLabSheet: React.FC = () => {
  const { addToast } = useToast();
  const { stopStream, activeStreamingDeviceId, streamState } = useLiveStream();
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<PreviewSessionState>(getPreviewSessionState);
  const [selectedCam, setSelectedCam] = useState<string>('DEV-001');

  // Sync session state on custom events
  useEffect(() => {
    const handleStateChange = (e: Event) => {
      const custom = e as CustomEvent<PreviewSessionState>;
      if (custom.detail) {
        setSession(custom.detail);
      } else {
        setSession(getPreviewSessionState());
      }
    };
    window.addEventListener('falcon-preview-state-changed', handleStateChange);
    return () => window.removeEventListener('falcon-preview-state-changed', handleStateChange);
  }, []);

  // Keyboard shortcut: Shift + P or 'p' when no input focused
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'p' || e.key === 'P') {
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          setIsOpen((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isLivePreviewEnabled()) {
    return null;
  }

  const handleUpdate = (partial: Partial<PreviewSessionState>) => {
    setPreviewSessionState(partial);
    setSession(getPreviewSessionState());
  };

  const handleCameraStateChange = (camId: string, state: DeviceConnectivityState) => {
    const overrides = { ...session.cameraStateOverrides, [camId]: state };
    handleUpdate({ cameraStateOverrides: overrides });
    addToast('info', `Simulating ${camId} as ${state.toUpperCase()}`, 'Preview Override');
  };

  const handleReset = () => {
    resetPreviewSessionState();
    setSession(getPreviewSessionState());
    addToast('success', 'Reset all reviewer overrides to default scenario matrix.', 'Lab Defaults Restored');
  };

  const handleDropStream = () => {
    if (activeStreamingDeviceId && streamState === 'live') {
      stopStream('connection_lost');
      addToast('info', `Stream connection for ${activeStreamingDeviceId} abruptly dropped.`, 'Stream Dropped');
    } else {
      addToast('info', 'No active live stream to drop.', 'Notice');
    }
  };

  const currentCamOverride = session.cameraStateOverrides[selectedCam];

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-4 right-4 z-40">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="h-8 px-2.5 text-xs font-medium gap-1.5 border-border bg-card hover:bg-muted text-foreground cursor-pointer shadow-none"
          aria-label="Open Preview Lab Sheet"
        >
          <FlaskConical className="size-3.5 text-primary stroke-[1.5]" />
          <span>Preview Lab</span>
          <Badge
            variant="outline"
            className="text-[10px] px-1 py-0 h-4 border-border bg-muted text-muted-foreground font-mono"
          >
            P
          </Badge>
        </Button>
      </div>

      {/* Reviewer Lab Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[420px] p-0 flex flex-col justify-between overflow-y-auto">
          <SheetHeader className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <FlaskConical className="size-4 text-primary stroke-[1.5]" />
              <SheetTitle className="text-sm font-semibold">Preview Lab</SheetTitle>
              <Badge variant="outline" className="text-xs px-1.5 py-0 border-border text-muted-foreground">
                Reviewer Overrides
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Simulate operational conditions, failure variants, and reviewer roles without backend mutations.
            </p>
          </SheetHeader>

          <div className="p-4 space-y-5 flex-1">
            {/* SECTION 1: CAMERA STATE OVERRIDE */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">1. Camera State Override</span>
                {currentCamOverride && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = { ...session.cameraStateOverrides };
                      delete next[selectedCam];
                      handleUpdate({ cameraStateOverrides: next });
                    }}
                    className="text-[11px] text-primary hover:underline cursor-pointer"
                  >
                    Clear override
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedCam}
                  onChange={(e) => setSelectedCam(e.target.value)}
                  className="h-8 flex-1 rounded-md border border-border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {CAMERAS.map((cam) => (
                    <option key={cam} value={cam}>
                      {cam} {session.cameraStateOverrides[cam] ? `(${session.cameraStateOverrides[cam]})` : ''}
                    </option>
                  ))}
                </select>

                <div className="inline-flex rounded-md border border-border bg-muted/40 p-0.5">
                  {(['online', 'stale', 'offline'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleCameraStateChange(selectedCam, st)}
                      className={`h-7 px-2.5 text-xs rounded capitalize transition-colors cursor-pointer ${
                        currentCamOverride === st
                          ? 'bg-card text-foreground font-semibold border border-border'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Overrides device connectivity and relative contact timestamp for testing.
              </p>
            </div>

            {/* SECTION 2: NEXT START RESULT */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-foreground">2. Next Start Result</span>
              <select
                value={session.nextStartResult}
                onChange={(e) => handleUpdate({ nextStartResult: e.target.value as any })}
                className="h-8 w-full rounded-md border border-border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="success">Success (Connects cleanly to stream)</option>
                <option value="edge_timeout">Edge service timeout (504 Gateway)</option>
                <option value="vendor_unknown">Vendor unknown (Registration missing)</option>
                <option value="stream_unsupported">Stream unsupported (No video feed)</option>
                <option value="camera_offline">Camera offline (No contact &gt; 24h)</option>
              </select>
              <p className="text-[11px] text-muted-foreground">
                Triggered on next Start click, then automatically resets to Success.
              </p>
            </div>

            {/* SECTION 3: QUICK ACTIONS */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-foreground">3. Quick Actions</span>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDropStream}
                  disabled={!activeStreamingDeviceId || streamState !== 'live'}
                  className="h-8 text-xs border-border bg-card hover:bg-muted text-foreground cursor-pointer disabled:opacity-40"
                >
                  <Zap className="size-3 mr-1 text-destructive" />
                  <span>Drop stream now</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReset}
                  className="h-8 text-xs border-border bg-card hover:bg-muted text-foreground cursor-pointer"
                >
                  <RotateCcw className="size-3 mr-1 text-muted-foreground" />
                  <span>Reset defaults</span>
                </Button>
              </div>
            </div>

            {/* SECTION 4: FAST TIMERS */}
            <div className="rounded-lg border border-border p-3 space-y-2 bg-card">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Radio className="size-3.5 text-primary" />
                    <span>Fast Timers</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Accelerate connection (600ms), hidden page (10s), inactivity (20s).
                  </div>
                </div>
                <Switch
                  checked={session.fastTimers}
                  onCheckedChange={(checked) => handleUpdate({ fastTimers: checked })}
                />
              </div>
            </div>

            {/* SECTION 5: ROLE SIMULATION */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Shield className="size-3.5 text-primary" />
                <span>5. Role Switcher (RBAC)</span>
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Viewer', 'Operator', 'Admin'] as const).map((r) => {
                  const roleValue: UserRole = r;
                  const isSelected = session.roleOverride === roleValue;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleUpdate({ roleOverride: roleValue })}
                      className={`h-8 rounded-md border text-xs font-medium cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Viewer disables live watching. Operator allows live and PTZ.
              </p>
            </div>

            {/* SECTION 6: BACKEND & SECURITY OPTIONS */}
            <div className="rounded-lg border border-border p-3 space-y-3 bg-card">
              <span className="text-xs font-semibold text-foreground">6. Backend &amp; Security Options</span>

              <div className="flex items-center justify-between">
                <div className="text-xs text-foreground">Log sessions to audit</div>
                <Switch
                  checked={session.viewingSessionsRecorded}
                  onCheckedChange={(checked) => handleUpdate({ viewingSessionsRecorded: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-foreground">Simulate groups backend API</div>
                <Switch
                  checked={session.groupsApiAvailable}
                  onCheckedChange={(checked) => handleUpdate({ groupsApiAvailable: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-xs text-foreground flex items-center gap-1.5">
                    <Volume2 className="size-3 text-status-warning" />
                    <span>Insecure HTTP (Block Talk)</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Simulate non-HTTPS origin to test mic restriction.
                  </div>
                </div>
                <Switch
                  checked={session.simulateInsecureHttp}
                  onCheckedChange={(checked) => handleUpdate({ simulateInsecureHttp: checked })}
                />
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              Overrides saved in sessionStorage.
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="h-8 text-xs border-border bg-card"
            >
              Close
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
