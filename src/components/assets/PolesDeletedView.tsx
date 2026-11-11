import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, RotateCcw, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RelativeTime } from '@/components/common/RelativeTime';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatAbsoluteMYT } from '@/lib/dateTime';
import type { PoleWithRelations, BackendCapabilities } from '@/types/assets';
import type { PolePermissions } from '@/lib/permissions';

export interface PolesDeletedViewProps {
  poles: PoleWithRelations[];
  capabilities: BackendCapabilities;
  permissions: PolePermissions;
  onRestore?: (pole: PoleWithRelations) => void;
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
}

/**
 * Read-only Deleted view for Poles: displays verbatim Identifier, Name, Site, Deleted MYT timestamp,
 * Deleted by actor, and Delete reason. Restore action is omitted unless backend capability supports restore.
 */
export const PolesDeletedView: React.FC<PolesDeletedViewProps> = ({
  poles,
  capabilities,
  permissions,
  onRestore,
  onClearFilters,
  hasActiveFilters = false,
}) => {
  if (poles.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center space-y-2.5">
        <div className="size-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center mx-auto">
          <Trash2 className="size-5" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">
          {hasActiveFilters ? 'No matching deleted poles' : 'No deleted poles'}
        </h3>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          {hasActiveFilters
            ? 'No soft-deleted pole records match the active search or site filters.'
            : 'Soft-deleted poles will appear here with their deletion timestamp, actor, and reason.'}
        </p>
        {hasActiveFilters && onClearFilters && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="h-8 px-3 text-xs mt-1 cursor-pointer"
          >
            Clear filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!capabilities.restore && (
        <div className="rounded-lg border border-border bg-card px-4 py-2.5 text-xs text-muted-foreground flex items-center justify-between gap-2">
          <span>
            Deleted pole records are read-only. Restore endpoint is not available yet in the staging API.
          </span>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-muted text-muted-foreground border-b border-border">
              <tr>
                <th className="py-3 px-3 font-semibold">Identifier</th>
                <th className="py-3 px-3 font-semibold">Name</th>
                <th className="py-3 px-3 font-semibold">Site</th>
                <th className="py-3 px-3 font-semibold">Deleted</th>
                <th className="py-3 px-3 font-semibold">Deleted by</th>
                <th className="py-3 px-3 font-semibold">Reason</th>
                {capabilities.restore && (
                  <th className="py-3 px-3 font-semibold text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {poles.map((pole) => (
                <tr key={pole.identifier} className="hover:bg-muted/30">
                  <td className="py-3 px-3 font-mono font-semibold whitespace-nowrap">
                    <Link
                      to={`/assets/poles/${encodeURIComponent(pole.identifier)}`}
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <span>{pole.identifier}</span>
                    </Link>
                  </td>
                  <td className="py-3 px-3">
                    {pole.name && pole.name !== pole.identifier ? (
                      <span className="font-medium text-foreground">{pole.name}</span>
                    ) : (
                      <span className="text-muted-foreground">{pole.identifier}</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">
                    {pole.siteName}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="font-mono text-foreground">
                      {pole.deletedAt ? formatAbsoluteMYT(pole.deletedAt) : '—'}
                    </div>
                    {pole.deletedAt && (
                      <div className="text-[11px] text-muted-foreground">
                        <RelativeTime date={pole.deletedAt} />
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-foreground whitespace-nowrap">
                    {pole.deletedBy || '—'}
                  </td>
                  <td className="py-3 px-3 text-muted-foreground max-w-xs">
                    {pole.deleteReason || 'No reason recorded'}
                  </td>
                  {capabilities.restore && (
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <span className="inline-flex">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={!permissions.canRestore}
                                  onClick={() => onRestore?.(pole)}
                                  className="h-7 px-2.5 text-[11px] gap-1 cursor-pointer"
                                >
                                  <RotateCcw className="size-3" />
                                  <span>Restore</span>
                                </Button>
                              </span>
                            }
                          />
                          {!permissions.canRestore && (
                            <TooltipContent className="text-xs bg-popover text-popover-foreground border border-border">
                              {permissions.restoreDisabledReason || 'Permission required to restore'}
                            </TooltipContent>
                          )}
                        </Tooltip>
                        <Link
                          to={`/assets/poles/${encodeURIComponent(pole.identifier)}`}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Inspect deleted pole"
                        >
                          <ArrowRight className="size-3.5" />
                        </Link>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
