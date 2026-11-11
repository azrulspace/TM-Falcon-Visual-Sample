import React, { useState } from 'react';
import {
  Copy,
  Navigation,
  ChevronDown,
  ChevronUp,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { RelativeTime } from '@/components/common/RelativeTime';
import { formatAbsoluteMYT } from '@/lib/dateTime';
import { formatCoordinates } from '@/lib/geo';
import { useToast } from '@/contexts/ToastContext';
import type { PoleWithRelations } from '@/types/assets';
import type { PolePermissions } from '@/lib/permissions';

export interface PoleInfoCardProps {
  pole: PoleWithRelations;
  permissions: PolePermissions;
  onAddLocation: () => void;
}

/**
 * Clean key-value summary card for the pole record: verbatim identifier, optional distinct name,
 * lifecycle badge, location (or No location warning with Add location CTA), protection,
 * MYT timestamps, and collapsible long note.
 */
export const PoleInfoCard: React.FC<PoleInfoCardProps> = ({
  pole,
  permissions,
  onAddLocation,
}) => {
  const { addToast } = useToast();
  const [noteExpanded, setNoteExpanded] = useState(false);

  const handleCopy = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    addToast('info', `Copied ${label}: ${value}`);
  };

  const hasLongNote = Boolean(pole.note && pole.note.length > 140);
  const displayedNote =
    pole.note && hasLongNote && !noteExpanded
      ? `${pole.note.slice(0, 140)}...`
      : pole.note;

  return (
    <section
      aria-label="Pole details"
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">Pole details</h2>
        <span className="text-[11px] text-muted-foreground">{pole.siteName}</span>
      </div>

      {pole.lifecycle === 'Deleted' && (
        <div className="px-5 py-2.5 bg-status-offline-tint border-b border-status-offline-border text-xs flex flex-wrap items-center gap-2 text-foreground">
          <Trash2 className="size-3.5 text-status-offline shrink-0" />
          <span>
            Deleted {pole.deletedAt ? formatAbsoluteMYT(pole.deletedAt) : ''}{' '}
            {pole.deletedBy ? `by ${pole.deletedBy}` : ''}
            {pole.deleteReason ? ` — Reason: "${pole.deleteReason}"` : ''}
          </span>
        </div>
      )}

      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 p-5 text-xs">
        {/* Identifier */}
        <div>
          <dt className="text-[11px] font-medium text-muted-foreground mb-1">Identifier</dt>
          <dd className="flex items-center gap-1.5 font-mono font-semibold text-foreground text-sm">
            <span>{pole.identifier}</span>
            <button
              type="button"
              onClick={() => handleCopy(pole.identifier, 'identifier')}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Copy identifier"
              title="Copy identifier"
            >
              <Copy className="size-3" />
            </button>
          </dd>
        </div>

        {/* Name */}
        <div>
          <dt className="text-[11px] font-medium text-muted-foreground mb-1">Name</dt>
          <dd className="text-foreground font-medium text-sm">
            {pole.name && pole.name !== pole.identifier ? (
              pole.name
            ) : (
              <span className="text-muted-foreground font-normal">Same as identifier</span>
            )}
          </dd>
        </div>

        {/* Lifecycle */}
        <div>
          <dt className="text-[11px] font-medium text-muted-foreground mb-1">Lifecycle</dt>
          <dd className="flex items-center gap-2">
            <StatusBadge status={pole.lifecycle} />
          </dd>
        </div>

        {/* Location */}
        <div>
          <dt className="text-[11px] font-medium text-muted-foreground mb-1">Location</dt>
          <dd>
            {pole.location ? (
              <span className="inline-flex items-center gap-1.5 font-mono text-foreground">
                <span>{formatCoordinates(pole.location)}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(formatCoordinates(pole.location), 'coordinates')}
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label="Copy coordinates"
                  title="Copy coordinates"
                >
                  <Copy className="size-3" />
                </button>
              </span>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-status-warning-tint border border-status-warning-border text-status-warning">
                  No location
                </span>
                {pole.lifecycle !== 'Deleted' && permissions.canRelocate && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={onAddLocation}
                    className="h-6 px-2 text-[11px] gap-1 cursor-pointer"
                  >
                    <Navigation className="size-3" />
                    <span>Add location</span>
                  </Button>
                )}
              </div>
            )}
          </dd>
        </div>

        {/* Protection */}
        <div>
          <dt className="text-[11px] font-medium text-muted-foreground mb-1">Protection</dt>
          <dd className="text-foreground">
            {pole.protection ? (
              <span>{pole.protection}</span>
            ) : (
              <span className="text-muted-foreground">No protection recorded</span>
            )}
          </dd>
        </div>

        {/* Registered */}
        <div>
          <dt className="text-[11px] font-medium text-muted-foreground mb-1">Registered</dt>
          <dd className="space-y-0.5">
            <div className="text-foreground font-medium">
              {formatAbsoluteMYT(pole.registeredAt)}
            </div>
            <div className="text-[11px] text-muted-foreground">
              <RelativeTime date={pole.registeredAt} />
            </div>
          </dd>
        </div>

        {/* Last updated */}
        <div>
          <dt className="text-[11px] font-medium text-muted-foreground mb-1">Last updated</dt>
          <dd className="space-y-0.5">
            <div className="text-foreground font-medium">
              {formatAbsoluteMYT(pole.lastUpdatedAt)}
            </div>
            <div className="text-[11px] text-muted-foreground">
              <RelativeTime date={pole.lastUpdatedAt} />
            </div>
          </dd>
        </div>

        {/* Note */}
        <div className="sm:col-span-2">
          <dt className="text-[11px] font-medium text-muted-foreground mb-1">Note</dt>
          <dd className="text-foreground leading-relaxed">
            {displayedNote ? (
              <div className="space-y-1">
                <p className="whitespace-pre-wrap break-words">{displayedNote}</p>
                {hasLongNote && (
                  <button
                    type="button"
                    onClick={() => setNoteExpanded((v) => !v)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline cursor-pointer"
                  >
                    {noteExpanded ? (
                      <>
                        <span>Show less</span>
                        <ChevronUp className="size-3" />
                      </>
                    ) : (
                      <>
                        <span>Show full note</span>
                        <ChevronDown className="size-3" />
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">No note recorded</span>
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
};
