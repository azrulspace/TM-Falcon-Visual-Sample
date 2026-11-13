import React from 'react';
import {
  History,
  X,
  RotateCcw,
  Clock,
  User,
  Sliders,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatAbsoluteMYT } from '@/lib/dateTime';
import type { DeviceRecord, DeviceConfigVersion } from '@/types/devices';

export interface VersionHistorySheetProps {
  isOpen: boolean;
  onClose: () => void;
  device: DeviceRecord | null;
  onSelectRollback: (version: DeviceConfigVersion) => void;
}

export const VersionHistorySheet: React.FC<VersionHistorySheetProps> = ({
  isOpen,
  onClose,
  device,
  onSelectRollback,
}) => {
  if (!isOpen || !device) return null;

  const versions = device.configVersions || [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ver-history-title"
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="h-full w-full max-w-xl bg-card border-l border-border p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <History className="size-4" />
              </div>
              <div>
                <h2 id="ver-history-title" className="text-base font-bold text-foreground">
                  Configuration version history
                </h2>
                <p className="text-xs text-muted-foreground">
                  Applied settings on <strong className="font-mono text-foreground">{device.identifier}</strong>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Versions List */}
          <div className="space-y-3">
            {versions.length === 0 ? (
              <div className="py-16 text-center text-xs text-muted-foreground space-y-2">
                <Sliders className="size-8 text-muted-foreground/40 mx-auto" />
                <p className="font-semibold text-foreground">No configuration versions yet</p>
                <p className="max-w-xs mx-auto">
                  Changes sent to the device via Edge will create versioned snapshots here with per-setting results.
                </p>
              </div>
            ) : (
              versions.map((ver, idx) => {
                const isLatest = idx === 0;
                return (
                  <div
                    key={ver.versionNumber}
                    className="rounded-xl border border-border bg-muted/20 p-4 space-y-3 hover:border-border/80 transition-all text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-primary text-primary-foreground">
                          {ver.versionLabel}
                        </span>
                        {isLatest && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            Current
                          </span>
                        )}
                      </div>

                      {!isLatest && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            onClose();
                            onSelectRollback(ver);
                          }}
                          className="h-7 px-2.5 text-[11px] gap-1 cursor-pointer"
                        >
                          <RotateCcw className="size-3 text-muted-foreground" />
                          <span>Roll back to this</span>
                        </Button>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="font-semibold text-foreground block">
                        Reason: {ver.reason}
                      </span>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono">
                        <span className="flex items-center gap-1">
                          <User className="size-3" />
                          <span>{ver.appliedBy}</span>
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          <span>{formatAbsoluteMYT(ver.appliedAt)}</span>
                        </span>
                      </div>
                    </div>

                    {/* Setting results */}
                    <div className="pt-2 border-t border-border/60">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold block mb-1">
                        Edge Setting Results ({ver.results.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                        {ver.results.map((r) => (
                          <span
                            key={r.settingKey}
                            className="px-2 py-0.5 rounded bg-card border border-border text-foreground flex items-center gap-1"
                          >
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            <span>{r.settingKey}: {String(ver.settings[r.settingKey])}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-border flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8.5 px-4 text-xs cursor-pointer"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
