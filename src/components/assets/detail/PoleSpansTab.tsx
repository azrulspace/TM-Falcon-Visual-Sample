import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, ArrowRight, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { PoleWithRelations } from '@/types/assets';
import { cn } from '@/lib/utils';

export interface PoleSpansTabProps {
  pole: PoleWithRelations;
}

/**
 * Connected cable spans tab for Pole detail: displays verbatim span identifiers, names,
 * lifecycle badges, A -> B pole endpoint links (highlighting the current pole), honest length
 * when available, and a "View on map" shortcut.
 */
export const PoleSpansTab: React.FC<PoleSpansTabProps> = ({ pole }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border text-xs text-muted-foreground">
        <span>
          <strong className="font-semibold text-foreground">{pole.cableSpansCount}</strong>{' '}
          connected cable {pole.cableSpansCount === 1 ? 'span' : 'spans'}
        </span>
      </div>

      {pole.connectedSpans.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center space-y-2">
          <div className="size-9 rounded-full bg-muted text-muted-foreground flex items-center justify-center mx-auto">
            <Layers className="size-4" />
          </div>
          <p className="text-xs font-semibold text-foreground">No connected cable spans</p>
          <p className="text-[11px] text-muted-foreground">
            This pole does not terminate or support any fibre cable spans yet.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-muted text-muted-foreground border-b border-border">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Identifier</th>
                <th className="py-2.5 px-3 font-semibold">Name</th>
                <th className="py-2.5 px-3 font-semibold">Lifecycle</th>
                <th className="py-2.5 px-3 font-semibold">Endpoints</th>
                <th className="py-2.5 px-3 font-semibold">Length</th>
                <th className="py-2.5 px-3 font-semibold text-right">Map</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pole.connectedSpans.map((span) => {
                const isFromCurrent = span.fromPole === pole.identifier;
                const isToCurrent = span.toPole === pole.identifier;
                return (
                  <tr key={span.identifier} className="hover:bg-muted/30">
                    <td className="py-2.5 px-3 font-mono font-semibold whitespace-nowrap">
                      <Link
                        to={`/assets/cable-spans?selected=${encodeURIComponent(span.identifier)}`}
                        className="text-primary hover:underline"
                      >
                        {span.identifier}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 text-foreground font-medium">
                      {span.name}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <StatusBadge status={span.lifecycle} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 font-mono">
                        <Link
                          to={`/assets/poles/${encodeURIComponent(span.fromPole)}`}
                          className={cn(
                            'px-1.5 py-0.5 rounded border transition-colors',
                            isFromCurrent
                              ? 'bg-primary/10 border-primary/40 text-primary font-semibold'
                              : 'bg-card border-border text-foreground hover:border-primary/40'
                          )}
                        >
                          {span.fromPole}
                        </Link>
                        <ArrowRight className="size-3 text-muted-foreground shrink-0" />
                        <Link
                          to={`/assets/poles/${encodeURIComponent(span.toPole)}`}
                          className={cn(
                            'px-1.5 py-0.5 rounded border transition-colors',
                            isToCurrent
                              ? 'bg-primary/10 border-primary/40 text-primary font-semibold'
                              : 'bg-card border-border text-foreground hover:border-primary/40'
                          )}
                        >
                          {span.toPole}
                        </Link>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-muted-foreground whitespace-nowrap">
                      {span.lengthKm !== null && span.lengthKm !== undefined
                        ? `${span.lengthKm.toFixed(2)} km`
                        : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          navigate(
                            `/assets/poles?view=map&selected=${encodeURIComponent(pole.identifier)}`
                          )
                        }
                        className="h-7 px-2.5 text-[11px] gap-1 cursor-pointer"
                      >
                        <MapPin className="size-3" />
                        <span>View on map</span>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

