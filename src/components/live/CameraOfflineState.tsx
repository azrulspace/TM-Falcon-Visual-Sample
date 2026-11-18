import React from 'react';
import { WifiOff, ChevronRight, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface CameraOfflineStateProps {
  identifier: string;
  lastContactRelative?: string | null;
  onViewDevice: () => void;
  onRefreshStatus?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

export const CameraOfflineState: React.FC<CameraOfflineStateProps> = ({
  identifier,
  lastContactRelative,
  onViewDevice,
  onRefreshStatus,
  isRefreshing = false,
  className = '',
}) => {
  return (
    <div
      className={`relative z-10 flex flex-col items-center max-w-sm w-full mx-4 p-6 rounded-xl bg-card border border-border shadow-2xl text-center select-none ${className}`}
      data-testid="camera-offline-state"
    >
      {/* Icon badge */}
      <div className="size-12 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mb-3">
        <WifiOff className="size-6 stroke-[1.5]" />
      </div>

      {/* Primary heading */}
      <h3 className="text-sm font-semibold text-foreground mb-1">
        Camera offline
      </h3>

      {/* Operational explanation */}
      <p className="text-xs text-muted-foreground leading-relaxed mb-4">
        Live video is unavailable.
        {lastContactRelative && lastContactRelative !== 'Never' ? (
          <> Last connected <span className="font-medium text-foreground">{lastContactRelative}</span>.</>
        ) : (
          <> No recent connection established.</>
        )}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onViewDevice}
          className="h-8 px-3 text-xs font-medium border-border bg-card hover:bg-muted text-foreground cursor-pointer rounded-lg gap-1.5"
          aria-label={`View device details for ${identifier}`}
        >
          <span>View device details</span>
          <ChevronRight className="size-3.5 stroke-[1.5]" />
        </Button>

        {onRefreshStatus && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefreshStatus}
            disabled={isRefreshing}
            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer rounded-lg gap-1.5"
            aria-label="Refresh camera status"
            title="Refresh camera connectivity status"
          >
            <RotateCw className={`size-3.5 stroke-[1.5] ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
            <span>{isRefreshing ? 'Checking...' : 'Refresh status'}</span>
          </Button>
        )}
      </div>
    </div>
  );
};
