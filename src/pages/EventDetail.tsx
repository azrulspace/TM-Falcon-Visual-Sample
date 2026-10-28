import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { EventDetailHeader } from '@/components/events/detail/EventDetailHeader';
import { EvidenceViewer } from '@/components/evidence/EvidenceViewer';
import { LocationCard } from '@/components/events/detail/LocationCard';
import { KeyFactsCard } from '@/components/events/detail/KeyFactsCard';
import { DetectionSpecificationCard } from '@/components/events/detail/DetectionSpecificationCard';
import { VendorDataCard } from '@/components/events/detail/VendorDataCard';
import { AlertHistoryCard } from '@/components/events/detail/AlertHistoryCard';
import { LightboxModal } from '@/components/events/dialogs/LightboxModal';
import { CreateCaseDialog } from '@/components/events/dialogs/CreateCaseDialog';
import { DismissEventDialog } from '@/components/events/dialogs/DismissEventDialog';
import { AssignEventDialog } from '@/components/events/dialogs/AssignEventDialog';
import { ResolveEventDialog } from '@/components/events/dialogs/ResolveEventDialog';
import { VendorDataDialog } from '@/components/events/dialogs/VendorDataDialog';
import { KeyboardShortcutsDialog } from '@/components/events/dialogs/KeyboardShortcutsDialog';
import { useEvents } from '@/contexts/EventsContext';
import { useToast } from '@/contexts/ToastContext';
import { useEventDetail } from '@/hooks/useEventDetail';
import { Button } from '@/components/ui/button';
import { Briefcase, ArrowLeft, Video, AlertTriangle } from 'lucide-react';
import { devices } from '@/data/devices';
import { formatAbsoluteMYT } from '@/lib/dateTime';
import { formatId } from '@/lib/utils';
import { useUiMode } from '@/hooks/useUiMode';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { events, acknowledgeEvent } = useEvents();
  const { addToast } = useToast();
  const { isTablet, orientation } = useUiMode();
  const isPortrait = isTablet && orientation === 'portrait';

  // Load canonical ViewModel & neighbors via useEventDetail
  const {
    viewModel,
    neighbors,
    handleAcknowledge: hookAcknowledge,
  } = useEventDetail({
    eventId: id,
    listContextIds: (location.state as any)?.eventIds,
  });

  // Fallback to active store event if viewModel is not ready
  const rawEvent = useMemo(() => {
    if (!id) return null;
    return events.find((e) => e.id.toLowerCase() === id.toLowerCase()) || null;
  }, [events, id]);

  const event = viewModel || rawEvent;

  // Dialog states
  const [createCaseOpen, setCreateCaseOpen] = useState(false);
  const [dismissOpen, setDismissOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [vendorDataOpen, setVendorDataOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxFrame, setLightboxFrame] = useState(0);
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  // Live update and conflict handling (Section 6.5)
  const [updatedNotice, setUpdatedNotice] = useState<{ time: string; changes: string[] } | null>(null);
  const [conflictNotice, setConflictNotice] = useState<string | null>(null);
  const prevEventRef = useRef<any>(null);

  useEffect(() => {
    if (!event) return;
    if (prevEventRef.current && prevEventRef.current.id === event.id) {
      const changes: string[] = [];
      const prev = prevEventRef.current;
      if (prev.priority !== event.priority) changes.push(`Priority changed to ${event.priority}`);
      if (prev.caseId !== (event as any).caseId) {
        changes.push((event as any).caseId ? `Case ${(event as any).caseId} attached` : 'Case detached');
      }
      if (prev.status !== (event as any).status && prev.state !== (event as any).state) {
        changes.push('Status updated');
      }
      if ((event as any).evidence?.version && prev.evidence?.version !== (event as any).evidence?.version) {
        changes.push('Clip updated');
      }
      if (changes.length > 0) {
        const nowStr = new Date().toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setUpdatedNotice({ time: nowStr, changes });
        const timer = setTimeout(() => {
          setUpdatedNotice(null);
        }, 10000);
        return () => clearTimeout(timer);
      }
    }
    prevEventRef.current = {
      id: event.id,
      priority: event.priority,
      caseId: (event as any).caseId,
      status: (event as any).status,
      state: (event as any).state,
      evidence: (event as any).evidence,
    };
  }, [event]);

  // Position control navigation
  const handlePrev = useCallback(() => {
    if (neighbors.hasPrev && neighbors.prevId) {
      navigate(`/events/${neighbors.prevId}`, { state: location.state });
    }
  }, [neighbors.hasPrev, neighbors.prevId, navigate, location.state]);

  const handleNext = useCallback(() => {
    if (neighbors.hasNext && neighbors.nextId) {
      navigate(`/events/${neighbors.nextId}`, { state: location.state });
    }
  }, [neighbors.hasNext, neighbors.nextId, navigate, location.state]);

  // Optimistic Acknowledge Action
  const handleAcknowledge = useCallback(async () => {
    if (!event || isAcknowledging) return;
    setIsAcknowledging(true);
    try {
      if (hookAcknowledge) {
        await hookAcknowledge();
      } else {
        acknowledgeEvent(event.id);
      }
      addToast('success', `Event ${event.id} acknowledged`);
    } catch (err: any) {
      addToast('error', err?.message || `Failed to acknowledge event ${event.id}`);
    } finally {
      setIsAcknowledging(false);
    }
  }, [event, isAcknowledging, hookAcknowledge, acknowledgeEvent, addToast]);

  // Keyboard navigation: J/K, Enter, Esc, E, C, ?
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.tagName === 'SELECT' ||
        (activeEl as HTMLElement)?.isContentEditable;

      const isDialogOpen = Boolean(
        createCaseOpen ||
        dismissOpen ||
        assignOpen ||
        shortcutsOpen ||
        lightboxOpen ||
        document.querySelector('[role="dialog"]') ||
        activeEl?.closest('[role="dialog"]')
      );

      // '?' opens shortcuts dialog
      if (e.key === '?' && !isInput && !isDialogOpen) {
        e.preventDefault();
        setShortcutsOpen((o) => !o);
        return;
      }

      // Guard: strictly ignore shortcuts when user is in input or dialog
      if (isInput || isDialogOpen) return;

      // J / ArrowRight: Next event in list context
      if (e.key === 'j' || e.key === 'ArrowRight') {
        if (neighbors.hasNext) {
          e.preventDefault();
          handleNext();
        }
        return;
      }

      // K / ArrowLeft: Previous event in list context
      if (e.key === 'k' || e.key === 'ArrowLeft') {
        if (neighbors.hasPrev) {
          e.preventDefault();
          handlePrev();
        }
        return;
      }

      // E: Acknowledge event
      if (e.key === 'e' || e.key === 'E') {
        const currentStatus = (event as any)?.status || (event as any)?.state;
        if (currentStatus === 'New') {
          e.preventDefault();
          handleAcknowledge();
        }
        return;
      }

      // C: Create operational case
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setCreateCaseOpen(true);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    event,
    neighbors.hasNext,
    neighbors.hasPrev,
    createCaseOpen,
    dismissOpen,
    assignOpen,
    shortcutsOpen,
    lightboxOpen,
    handleNext,
    handlePrev,
    handleAcknowledge,
  ]);

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 text-center select-none">
        <div className="size-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
          <AlertTriangle className="size-8 text-amber-500" />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-foreground">This event is no longer available</h2>
          <p className="text-xs text-muted-foreground max-w-sm">
            The event may have been deleted, archived, or is no longer accessible with your current permissions.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/events')}
          className="border-border text-xs gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Event inbox</span>
        </Button>
      </div>
    );
  }

  // Derived properties for EvidenceViewer and Device status
  const rawDeviceId = (event as any).device || (event as any).sourceDevice?.id || 'DEV-001';
  const devRecord = devices.find(
    (d) => d.id === rawDeviceId || formatId(d.id) === formatId(rawDeviceId)
  );
  const isDeviceOnline = devRecord ? devRecord.status === 'online' : true;
  const capturedAbsolute = formatAbsoluteMYT((event as any).captured || (event as any).capturedAt);
  const channelLabel = (event as any).vendorData?.channel || 'CCTV-01';
  const ruleLabel = (event as any).detectionRule || (event as any).detection || 'CCTV-01-Motion Detection';
  const frames = (event as any).evidence?.frames || [(event as any).snapshotUrl || '/monkey-fiber.jpg'];

  const hasAlertHistory = Boolean((event as any).hasAlertHistory);

  const handleWatchLive = () => {
    if (!isDeviceOnline) return;
    addToast('info', `Connecting to ${formatId(rawDeviceId)} live camera stream...`);
  };

  const handleOpenCreateCase = () => {
    if (event.caseId) {
      setConflictNotice('This event was updated. An operational case is already attached.');
      return;
    }
    setCreateCaseOpen(true);
  };

  return (
    <div className={`flex flex-col min-h-screen bg-background text-foreground antialiased ${isPortrait ? 'pb-24' : 'pb-20 sm:pb-8'}`}>
      <main className="flex-1 flex flex-col p-4 sm:p-6 gap-6 max-w-[1920px] w-full mx-auto">
        {/* 1. Header (Breadcrumb, Title, Chips, Create case, Watch live, Overflow menu) */}
        <EventDetailHeader
          event={event as any}
          isAcknowledging={isAcknowledging}
          onAcknowledge={handleAcknowledge}
          onOpenCreateCase={handleOpenCreateCase}
          onOpenAssign={() => setAssignOpen(true)}
          onOpenResolve={() => setResolveOpen(true)}
          onOpenVendorData={() => setVendorDataOpen(true)}
          onWatchLive={handleWatchLive}
          updatedNotice={updatedNotice}
        />

        {/* Optimistic Concurrency Conflict Banner (Section 6.5) */}
        {conflictNotice && (
          <div className="flex items-center justify-between p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 shrink-0 text-amber-500" />
              <span className="font-medium text-foreground">{conflictNotice} Review the changes.</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConflictNotice(null)}
                className="h-7 px-2.5 text-xs border-border hover:bg-muted cursor-pointer"
              >
                Dismiss
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setConflictNotice(null);
                  window.location.reload();
                }}
                className="h-7 px-2.5 text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium cursor-pointer"
              >
                Reload
              </Button>
            </div>
          </div>
        )}

        {/* 2. Responsive Layout */}
        {isPortrait ? (
          /* Portrait Tablet Order: Evidence, Key Facts, Location (collapsible), Detection Spec, Vendor Data */
          <div className="flex flex-col gap-6">
            <EvidenceViewer
              eventId={event.id}
              snapshots={frames}
              capturedTimeMYT={capturedAbsolute}
              channelName={channelLabel}
              detectionRule={ruleLabel}
              deviceIsOnline={isDeviceOnline}
              deviceSupportsVideo={true}
              hasPermission={true}
              onOpenLightbox={(frameIndex) => {
                setLightboxFrame(frameIndex);
                setLightboxOpen(true);
              }}
              onWatchLive={handleWatchLive}
            />

            <KeyFactsCard
              event={event as any}
              onOpenCreateCase={() => setCreateCaseOpen(true)}
              onOpenAssign={() => setAssignOpen(true)}
            />

            <LocationCard event={event as any} defaultCollapsed={true} />

            <DetectionSpecificationCard event={event as any} />

            <VendorDataCard event={event as any} />

            {hasAlertHistory && <AlertHistoryCard event={event as any} />}
          </div>
        ) : (
          /* Landscape & Desktop: 2-Column Grid (~60% and ~40%) matching Staging Screenshots 3 & 4 */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Main Column (60% on tablet, 66% on desktop) */}
            <div className="md:col-span-7 xl:col-span-8 flex flex-col gap-6">
              <EvidenceViewer
                eventId={event.id}
                snapshots={frames}
                capturedTimeMYT={capturedAbsolute}
                channelName={channelLabel}
                detectionRule={ruleLabel}
                deviceIsOnline={isDeviceOnline}
                deviceSupportsVideo={true}
                hasPermission={true}
                onOpenLightbox={(frameIndex) => {
                  setLightboxFrame(frameIndex);
                  setLightboxOpen(true);
                }}
                onWatchLive={handleWatchLive}
              />
              <DetectionSpecificationCard event={event as any} />
              <VendorDataCard event={event as any} />
            </div>

            {/* Side Column (40% on tablet, 33% on desktop) */}
            <div className="md:col-span-5 xl:col-span-4 flex flex-col gap-6">
              <LocationCard event={event as any} defaultCollapsed={false} />
              <KeyFactsCard
                event={event as any}
                onOpenCreateCase={() => setCreateCaseOpen(true)}
                onOpenAssign={() => setAssignOpen(true)}
              />
              {hasAlertHistory && <AlertHistoryCard event={event as any} />}
            </div>
          </div>
        )}
      </main>

      {/* Sticky Bottom Action Bar (<768px mobile or Portrait Tablet) */}
      <div className={`fixed bottom-0 inset-x-0 z-30 ${isPortrait ? 'flex' : 'flex md:hidden'} p-3 bg-card border-t border-border items-center justify-between gap-3 shadow-lg`}>
        {/* Primary Action: Create Case */}
        <Button
          size="sm"
          onClick={() => setCreateCaseOpen(true)}
          className={`flex-1 ${isTablet ? 'h-[44px] text-sm' : 'h-9 text-xs'} bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 shadow-xs cursor-pointer`}
        >
          <Briefcase className="size-4" />
          <span>Create Case</span>
        </Button>

        {/* Secondary Action: Watch live */}
        <Button
          variant="outline"
          size="sm"
          disabled={!isDeviceOnline}
          onClick={handleWatchLive}
          className={`flex-1 ${isTablet ? 'h-[44px] text-sm' : 'h-9 text-xs'} border-border hover:bg-muted font-medium text-foreground gap-2 cursor-pointer disabled:opacity-40`}
        >
          <Video className="size-4" />
          <span>Watch live</span>
        </Button>
      </div>

      {/* Action Dialogs */}
      <CreateCaseDialog
        open={createCaseOpen}
        onOpenChange={setCreateCaseOpen}
        event={event as any}
      />

      <DismissEventDialog
        open={dismissOpen}
        onOpenChange={setDismissOpen}
        event={event as any}
      />

      <AssignEventDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        event={event as any}
      />

      <ResolveEventDialog
        open={resolveOpen}
        onOpenChange={setResolveOpen}
        event={event as any}
      />

      <VendorDataDialog
        open={vendorDataOpen}
        onOpenChange={setVendorDataOpen}
        event={event as any}
      />

      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />

      <LightboxModal
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        event={event as any}
        initialFrameIndex={lightboxFrame}
      />
    </div>
  );
}
