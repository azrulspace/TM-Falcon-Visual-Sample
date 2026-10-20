import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EventDetailHeader } from '@/components/events/detail/EventDetailHeader';
import { EvidenceStudioCard } from '@/components/events/detail/EvidenceStudioCard';
import { LightboxModal } from '@/components/events/dialogs/LightboxModal';
import { CreateCaseDialog } from '@/components/events/dialogs/CreateCaseDialog';
import { DismissEventDialog } from '@/components/events/dialogs/DismissEventDialog';
import { AssignEventDialog } from '@/components/events/dialogs/AssignEventDialog';
import { KeyboardShortcutsDialog } from '@/components/events/dialogs/KeyboardShortcutsDialog';
import { useEvents } from '@/contexts/EventsContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Check, Briefcase, ArrowLeft, SearchX } from 'lucide-react';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { events, acknowledgeEvent } = useEvents();
  const { addToast } = useToast();

  // Find target event
  const event = useMemo(() => {
    if (!id) return null;
    return events.find((e) => e.id.toLowerCase() === id.toLowerCase()) || null;
  }, [events, id]);

  // Position control: "3 of 258"
  const eventIndex = useMemo(() => {
    if (!event) return -1;
    return events.findIndex((e) => e.id === event.id);
  }, [events, event]);

  const hasPrev = eventIndex > 0;
  const hasNext = eventIndex >= 0 && eventIndex < events.length - 1;

  const handlePrev = () => {
    if (hasPrev) {
      navigate(`/events/${events[eventIndex - 1].id}`);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      navigate(`/events/${events[eventIndex + 1].id}`);
    }
  };

  const positionText = eventIndex >= 0 ? `${eventIndex + 1} of ${events.length}` : '';

  // Dialog states
  const [createCaseOpen, setCreateCaseOpen] = useState(false);
  const [dismissOpen, setDismissOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxFrame, setLightboxFrame] = useState(0);

  // Keyboard navigation: J/K, Enter, Esc, E, C, ?
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.tagName === 'SELECT';

      if (e.key === '?' && !isInput) {
        e.preventDefault();
        setShortcutsOpen((o) => !o);
        return;
      }

      if (isInput) return;

      if (e.key === 'j' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
        return;
      }

      if (e.key === 'k' || e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
        return;
      }

      if (e.key === 'e' || e.key === 'E') {
        if (event && event.state === 'New') {
          e.preventDefault();
          acknowledgeEvent(event.id);
          addToast('success', `Event ${event.id} acknowledged`);
        }
        return;
      }

      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setCreateCaseOpen(true);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [event, hasPrev, hasNext, eventIndex, events, acknowledgeEvent, addToast]);

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 text-center select-none">
        <div className="size-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
          <SearchX className="size-8" />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-foreground">Event Dossier Not Found</h2>
          <p className="text-xs text-muted-foreground max-w-sm">
            Event ID <span className="font-mono font-semibold">{id}</span> does not exist in the active telemetry store.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/events')}
          className="border-border text-xs gap-1.5"
        >
          <ArrowLeft className="size-3.5" />
          <span>Return to Event Inbox</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground antialiased pb-20 sm:pb-8">
      <main className="flex-1 flex flex-col p-4 sm:p-6 gap-6 max-w-[1920px] w-full mx-auto">
        {/* 1. Header (Breadcrumb, Title, Stepper, SLA, Quick Actions) */}
        <EventDetailHeader
          event={event}
          positionText={positionText}
          onPrev={handlePrev}
          onNext={handleNext}
          hasPrev={hasPrev}
          hasNext={hasNext}
          onOpenCreateCase={() => setCreateCaseOpen(true)}
          onOpenDismiss={() => setDismissOpen(true)}
          onOpenAssign={() => setAssignOpen(true)}
        />

        {/* 2. Responsive 2-Column Grid (Main 8 of 12, Side 4 of 12) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Main Column (8 of 12) */}
          <div className="xl:col-span-8 flex flex-col gap-6">
            {/* Evidence Card */}
            <EvidenceStudioCard
              event={event}
              onOpenLightbox={(frameIndex) => {
                setLightboxFrame(frameIndex);
                setLightboxOpen(true);
              }}
            />

            {/* Main Tabs (Overview, Timeline, Related Events, Raw Vendor Data) */}
            <div id="detail-tabs-section">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="bg-muted/60 p-1 border border-border rounded-xl">
                  <TabsTrigger value="overview" className="text-xs font-medium">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="timeline" className="text-xs font-medium">
                    Timeline ({event.timeline?.length || 1})
                  </TabsTrigger>
                  <TabsTrigger value="related" className="text-xs font-medium">
                    Related Events
                  </TabsTrigger>
                  <TabsTrigger value="vendor" className="text-xs font-medium">
                    Raw Vendor Data
                  </TabsTrigger>
                </TabsList>

                {/* Tabs Content - Populated fully in Phase 8 */}
                <TabsContent value="overview" className="pt-4">
                  <div className="p-4 rounded-xl border border-border bg-card text-xs text-muted-foreground">
                    Overview details rendered here.
                  </div>
                </TabsContent>

                <TabsContent value="timeline" className="pt-4">
                  <div className="p-4 rounded-xl border border-border bg-card text-xs text-muted-foreground">
                    Timeline audit trail rendered here.
                  </div>
                </TabsContent>

                <TabsContent value="related" className="pt-4">
                  <div className="p-4 rounded-xl border border-border bg-card text-xs text-muted-foreground">
                    Related events rendered here.
                  </div>
                </TabsContent>

                <TabsContent value="vendor" className="pt-4">
                  <div className="p-4 rounded-xl border border-border bg-card text-xs text-muted-foreground">
                    Raw vendor data rendered here.
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Side Column (4 of 12) */}
          <div className="xl:col-span-4 flex flex-col gap-6">
            <div className="p-4 rounded-xl border border-border bg-card text-xs text-muted-foreground">
              Side column cards rendered here.
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Bottom Action Bar (<768px mobile) */}
      <div className="fixed bottom-0 inset-x-0 z-30 md:hidden p-3 bg-card/95 backdrop-blur-md border-t border-border flex items-center justify-between gap-2">
        {event.state === 'New' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              acknowledgeEvent(event.id);
              addToast('success', `Event ${event.id} acknowledged`);
            }}
            className="flex-1 h-9 text-xs border-border text-emerald-600 dark:text-emerald-400 gap-1.5"
          >
            <Check className="size-4" />
            <span>Acknowledge</span>
          </Button>
        )}

        <Button
          size="sm"
          onClick={() => setCreateCaseOpen(true)}
          className="flex-1 h-9 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-1.5"
        >
          <Briefcase className="size-4" />
          <span>Create Case</span>
        </Button>
      </div>

      {/* Action Dialogs */}
      <CreateCaseDialog
        open={createCaseOpen}
        onOpenChange={setCreateCaseOpen}
        event={event}
      />

      <DismissEventDialog
        open={dismissOpen}
        onOpenChange={setDismissOpen}
        event={event}
      />

      <AssignEventDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        event={event}
      />

      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />

      <LightboxModal
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        event={event}
        initialFrameIndex={lightboxFrame}
      />
    </div>
  );
}
