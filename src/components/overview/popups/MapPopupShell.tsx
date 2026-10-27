import React, { useRef, useEffect, useState } from 'react';
import { X, MapPinOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PlacementSide } from '@/lib/popupPlacement';

export interface MapPopupShellProps {
  side: PlacementSide;
  tailOffset?: number;
  typeChip: string;
  typeColor?: 'blue' | 'purple' | 'amber' | 'emerald';
  id: string;
  badge?: React.ReactNode;
  title?: string;
  unlocated?: boolean;
  onClose: () => void;
  children: React.ReactNode;
  footerActions?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export const MapPopupShell: React.FC<MapPopupShellProps> = ({
  side,
  tailOffset = 180,
  typeChip,
  typeColor = 'blue',
  id,
  badge,
  title,
  unlocated = false,
  onClose,
  children,
  footerActions,
  style,
  className = '',
}) => {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [hasScrollMore, setHasScrollMore] = useState(false);

  // Check if body has scrollable content below to display subtle bottom fade
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const checkScroll = () => {
      const more = el.scrollHeight - el.scrollTop - el.clientHeight > 8;
      setHasScrollMore(more);
    };
    checkScroll();
    el.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [children]);

  // Trap Escape key for the popup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  const chipColorClass =
    typeColor === 'purple'
      ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
      : typeColor === 'amber'
      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
      : typeColor === 'emerald'
      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
      : 'bg-primary/15 text-primary border-primary/30';

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={`${typeChip} ${id} details`}
      style={style}
      className={`pointer-events-auto absolute z-40 w-[360px] max-w-[calc(100vw-32px)] max-h-[70vh] flex flex-col rounded-xl border dark:border-[#2a323d] border-slate-200 dark:bg-[#141b23]/95 bg-white/95 backdrop-blur-md shadow-2xl text-foreground select-none overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 ${className}`}
    >
      {/* Visual Tail pointing to marker */}
      {side === 'top' && !unlocated && (
        <div
          style={{ left: `${tailOffset}px` }}
          className="absolute -bottom-2 -translate-x-1/2 w-4 h-4 rotate-45 border-r border-b dark:border-[#2a323d] border-slate-200 dark:bg-[#141b23] bg-white pointer-events-none"
        />
      )}
      {side === 'bottom' && !unlocated && (
        <div
          style={{ left: `${tailOffset}px` }}
          className="absolute -top-2 -translate-x-1/2 w-4 h-4 rotate-45 border-l border-t dark:border-[#2a323d] border-slate-200 dark:bg-[#141b23] bg-white pointer-events-none"
        />
      )}

      {/* Unlocated Notice Banner */}
      {unlocated && (
        <div className="bg-amber-500/15 dark:bg-amber-500/10 border-b border-amber-500/30 px-3.5 py-1.5 flex items-center gap-2 text-xs text-amber-500 font-medium shrink-0">
          <MapPinOff className="size-3.5 shrink-0" />
          <span>This record has no map location</span>
        </div>
      )}

      {/* 1. Sticky Non-Overlapping Header (Strict 44px height) */}
      <div className="flex items-center justify-between h-[44px] px-3.5 border-b dark:border-[#2a323d] border-slate-200 dark:bg-[#121720]/80 bg-slate-50/80 shrink-0 z-10">
        <div className="flex items-center gap-2 min-w-0">
          {/* Type Chip */}
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider border font-sans ${chipColorClass}`}
          >
            {typeChip}
          </span>

          {/* Mono ID */}
          <span className="font-mono text-xs font-bold text-foreground truncate">{id}</span>

          {/* Priority / Status Badge */}
          {badge}
        </div>

        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground h-7 w-7 rounded-md cursor-pointer shrink-0"
          aria-label="Close details"
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* 2. Scrollable Body (Only body scrolls, no nested scroll) */}
      <div
        ref={bodyRef}
        className="flex-1 overflow-y-auto p-3.5 space-y-3.5 text-xs font-sans divide-y divide-border/40 *:pt-3.5 first:*:pt-0 no-scrollbar relative"
      >
        {title && (
          <div className="space-y-0.5 pb-0.5">
            <h3 className="text-sm font-bold text-foreground leading-snug">{title}</h3>
          </div>
        )}
        {children}
      </div>

      {/* Subtle bottom scroll cue */}
      {hasScrollMore && (
        <div className="h-4 -mt-4 bg-gradient-to-t from-black/20 to-transparent pointer-events-none shrink-0" />
      )}

      {/* 3. Sticky Non-Overlapping Footer (Never covers body content) */}
      {footerActions && (
        <div className="p-3 border-t dark:border-[#2a323d] border-slate-200 dark:bg-[#121720]/90 bg-slate-50/90 flex items-center justify-between gap-2 shrink-0 z-10">
          {footerActions}
        </div>
      )}
    </div>
  );
};
