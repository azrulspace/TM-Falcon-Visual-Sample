import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  ArrowLeft,
  Navigation,
  Pencil,
  MoreHorizontal,
  Copy,
  ExternalLink,
  Trash2,
  RotateCcw,
  Cpu,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatCoordinates } from '@/lib/geo';
import { useToast } from '@/contexts/ToastContext';
import type { PoleWithRelations, BackendCapabilities } from '@/types/assets';
import type { PolePermissions } from '@/lib/permissions';

export type PoleDetailTabKey = 'history' | 'devices' | 'events' | 'spans';

export interface PoleDetailHeaderProps {
  pole: PoleWithRelations;
  permissions: PolePermissions;
  capabilities: BackendCapabilities;
  onSelectTab: (tab: PoleDetailTabKey) => void;
  onRelocate: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRestore?: () => void;
}

/**
 * Detail header for a Pole: breadcrumb, back button restoring previous Poles filter URL,
 * verbatim identifier with neutral Pole chip, clickable summary relation chips,
 * and secondary actions + destructive Delete inside the overflow menu.
 */
export const PoleDetailHeader: React.FC<PoleDetailHeaderProps> = ({
  pole,
  permissions,
  capabilities,
  onSelectTab,
  onRelocate,
  onEdit,
  onDelete,
  onRestore,
}) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const isDeleted = pole.lifecycle === 'Deleted';

  const handleBack = () => {
    const lastUrl = sessionStorage.getItem('last_poles_url');
    navigate(lastUrl || '/assets/poles');
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/assets/poles/${encodeURIComponent(pole.identifier)}`;
    navigator.clipboard.writeText(url);
    addToast('info', 'Pole detail link copied to clipboard.');
  };

  const handleCopyCoords = () => {
    if (!pole.location) return;
    const text = formatCoordinates(pole.location);
    navigator.clipboard.writeText(text);
    addToast('info', `Copied ${text}`);
  };

  return (
    <div className="mb-5 select-none space-y-3">
      {/* Breadcrumb + Back */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
          <button
            type="button"
            onClick={() => navigate('/overview')}
            className="hover:text-foreground transition-colors cursor-pointer shrink-0"
          >
            Falcon
          </button>
          <ChevronRight className="size-3 text-muted-foreground shrink-0" />
          <button
            type="button"
            onClick={() => navigate('/assets/poles')}
            className="hover:text-foreground transition-colors cursor-pointer shrink-0"
          >
            Assets and devices
          </button>
          <ChevronRight className="size-3 text-muted-foreground shrink-0" />
          <button
            type="button"
            onClick={handleBack}
            className="hover:text-foreground transition-colors cursor-pointer shrink-0"
          >
            Poles
          </button>
          <ChevronRight className="size-3 text-muted-foreground shrink-0" />
          <span className="font-mono font-semibold text-foreground truncate">
            {pole.identifier}
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
          className="h-7 px-2.5 text-xs gap-1.5 bg-card border-border cursor-pointer"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Poles</span>
        </Button>
      </div>

      {/* Main Title Row + Actions */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="space-y-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold font-mono tracking-tight text-foreground leading-tight">
              {pole.identifier}
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border">
              Pole
            </span>
            <StatusBadge status={pole.lifecycle} />
          </div>

          {pole.name && pole.name !== pole.identifier && (
            <p className="text-sm text-muted-foreground">{pole.name}</p>
          )}

          {/* Clickable Summary Relation Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => onSelectTab('devices')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-card hover:bg-muted text-xs text-foreground transition-colors cursor-pointer"
            >
              <Cpu className="size-3.5 text-primary" />
              <span className="font-mono font-semibold">{pole.linkedDevicesCount}</span>
              <span className="text-muted-foreground">
                {pole.linkedDevicesCount === 1 ? 'linked device' : 'linked devices'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('spans')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-card hover:bg-muted text-xs text-foreground transition-colors cursor-pointer"
            >
              <Layers className="size-3.5 text-status-info" />
              <span className="font-mono font-semibold">{pole.cableSpansCount}</span>
              <span className="text-muted-foreground">
                {pole.cableSpansCount === 1 ? 'cable span' : 'cable spans'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('events')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-card hover:bg-muted text-xs text-foreground transition-colors cursor-pointer"
            >
              <AlertTriangle
                className={
                  pole.events30dCount > 0 ? 'size-3.5 text-status-warning' : 'size-3.5 text-muted-foreground'
                }
              />
              <span className="font-mono font-semibold">{pole.events30dCount}</span>
              <span className="text-muted-foreground">
                {pole.events30dCount === 1 ? 'event' : 'events'} (30 days)
              </span>
            </button>
          </div>
        </div>

        {/* Right Action Cluster (No prominent red button — Delete lives inside More menu) */}
        <div className="flex items-center gap-2 shrink-0">
          {!isDeleted && (
            <>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span className="inline-flex">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!permissions.canRelocate}
                        onClick={onRelocate}
                        className="h-9 px-3 text-xs gap-1.5 bg-card border-border cursor-pointer"
                      >
                        <Navigation className="size-3.5" />
                        <span>{pole.location ? 'Relocate' : 'Add location'}</span>
                      </Button>
                    </span>
                  }
                />
                {!permissions.canRelocate && (
                  <TooltipContent className="text-xs bg-popover text-popover-foreground border border-border">
                    Requires Admin or Operator role
                  </TooltipContent>
                )}
              </Tooltip>

              <Tooltip>
                <TooltipTrigger
                  render={
                    <span className="inline-flex">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!permissions.canEdit}
                        onClick={onEdit}
                        className="h-9 px-3 text-xs gap-1.5 bg-card border-border cursor-pointer"
                      >
                        <Pencil className="size-3.5" />
                        <span>Edit</span>
                      </Button>
                    </span>
                  }
                />
                {!permissions.canEdit && (
                  <TooltipContent className="text-xs bg-popover text-popover-foreground border border-border">
                    Requires Admin or Operator role
                  </TooltipContent>
                )}
              </Tooltip>
            </>
          )}

          {isDeleted && capabilities.restore && onRestore && (
            <Button
              variant="outline"
              size="sm"
              disabled={!permissions.canDelete}
              onClick={onRestore}
              className="h-9 px-3 text-xs gap-1.5 bg-card border-border cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              <span>Restore pole</span>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="More pole actions"
                  className="h-9 w-9 p-0 bg-card border-border cursor-pointer"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-52 bg-popover border-border">
              <DropdownMenuItem onClick={handleCopyLink} className="gap-2 text-xs cursor-pointer">
                <Copy className="size-3.5" />
                <span>Copy link</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate(`/overview?asset=${encodeURIComponent(pole.identifier)}`)}
                className="gap-2 text-xs cursor-pointer"
              >
                <ExternalLink className="size-3.5" />
                <span>Open on Overview map</span>
              </DropdownMenuItem>
              {pole.location && (
                <DropdownMenuItem onClick={handleCopyCoords} className="gap-2 text-xs cursor-pointer">
                  <Copy className="size-3.5" />
                  <span>Copy coordinates</span>
                </DropdownMenuItem>
              )}
              {!isDeleted && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={!permissions.canDelete}
                    onClick={onDelete}
                    className="gap-2 text-xs text-destructive focus:text-destructive cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                    <span>
                      {permissions.canDelete ? 'Delete pole' : 'Delete (Admin / Operator only)'}
                    </span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
