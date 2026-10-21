import React, { useState } from 'react';
import {
  Send,
  Radio,
  Cpu,
  UserCheck,
  Briefcase,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEvents } from '@/contexts/EventsContext';
import { useToast } from '@/contexts/ToastContext';
import { formatAbsoluteMYT } from '@/lib/dateTime';
import { RelativeTime } from '@/components/common/RelativeTime';
import type { FalconEvent } from '@/data/events';

export interface TimelineTabProps {
  event: FalconEvent;
}

export const TimelineTab: React.FC<TimelineTabProps> = ({ event }) => {
  const { addTimelineNote } = useEvents();
  const { addToast } = useToast();
  const [noteText, setNoteText] = useState('');

  const timelineEntries = event.timeline || [];

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    addTimelineNote(event.id, noteText.trim(), 'Azrul (Senior Ops)');
    addToast('success', 'Audit note appended to timeline');
    setNoteText('');
  };

  const getActionIcon = (iconType: string, text: string) => {
    if (iconType === 'received') return <Radio className="size-3.5 text-blue-500" />;
    if (iconType === 'classified') return <Cpu className="size-3.5 text-indigo-500" />;
    if (iconType === 'acknowledged') return <CheckCircle2 className="size-3.5 text-emerald-500" />;
    if (iconType === 'case') return <Briefcase className="size-3.5 text-amber-500" />;
    if (iconType === 'dismissed') return <XCircle className="size-3.5 text-red-500" />;
    if (iconType === 'assigned') return <UserCheck className="size-3.5 text-primary" />;

    const lower = text.toLowerCase();
    if (lower.includes('case')) return <Briefcase className="size-3.5 text-amber-500" />;
    if (lower.includes('ack')) return <CheckCircle2 className="size-3.5 text-emerald-500" />;
    return <MessageSquare className="size-3.5 text-muted-foreground" />;
  };

  return (
    <div className="flex flex-col gap-5 p-5 rounded-xl border border-border bg-card shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold text-foreground">Operational Audit Trail</h3>
          <span className="text-xs text-muted-foreground">
            Immutable log of telemetry reception, automated classification, and human interventions.
          </span>
        </div>
        <span className="text-xs font-mono font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {timelineEntries.length} entries
        </span>
      </div>

      {/* Vertical Timeline */}
      <div className="relative pl-6 flex flex-col gap-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
        {timelineEntries.map((entry, idx) => (
          <div key={entry.id || idx} className="relative flex flex-col gap-1 text-xs group">
            {/* Dot marker */}
            <div className="absolute -left-6 top-0.5 size-5 rounded-full bg-card border-2 border-border group-hover:border-primary flex items-center justify-center transition-colors">
              {getActionIcon(entry.icon, entry.text)}
            </div>

            {/* Entry Header */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{entry.text}</span>
                <span className="text-muted-foreground">by</span>
                <span className="px-1.5 py-0.2 rounded bg-muted text-[11px] font-medium text-foreground">
                  {entry.actor}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-muted-foreground tabular-nums">
                <RelativeTime date={entry.time} />
                <span title={formatAbsoluteMYT(entry.time)}>
                  <Clock className="size-3 inline ml-0.5 opacity-60" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Note Input */}
      <form onSubmit={handleAddNote} className="pt-4 border-t border-border flex items-center gap-2">
        <input
          type="text"
          placeholder="Append verification note to audit timeline..."
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!noteText.trim()}
          className="h-9 px-3 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shrink-0"
        >
          <Send className="size-3.5" />
          <span>Add Note</span>
        </Button>
      </form>
    </div>
  );
};
