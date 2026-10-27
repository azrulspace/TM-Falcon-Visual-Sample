import React, { useState } from 'react';
import { ChevronDown, Copy, Check } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useUiMode } from '@/hooks/useUiMode';
import { cn } from '@/lib/utils';
import type { FalconEvent } from '@/data/events';
import type { EventDetailViewModel } from '@/types/eventDetail';

export interface VendorDataCardProps {
  event: FalconEvent | EventDetailViewModel;
  defaultExpanded?: boolean;
}

export const VendorDataCard: React.FC<VendorDataCardProps> = ({
  event,
  defaultExpanded,
}) => {
  const { addToast } = useToast();
  const { isTablet } = useUiMode();

  // Desktop: expanded by default; Tablet and Phone: collapsed by default (Section 6.4)
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    if (defaultExpanded !== undefined) return defaultExpanded;
    return !isTablet;
  });

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    addToast('info', `${label} copied to clipboard`);
    setTimeout(() => {
      setCopiedField((prev) => (prev === fieldKey ? null : prev));
    }, 2000);
  };

  // Extract vendor telemetry
  const v = (event as any).vendorData || {};
  const rawJson = v.rawJson || (event as any).rawJson || {};

  const vendorCode = v.vendorCode || rawJson.vendorCode || '10002';
  const ruleName = v.rule || rawJson.rule || (event as any).detection || 'CCTV-01-Motion Detection';
  const ruleId = v.ruleId || rawJson.ruleId || '2111032826769051648';
  const category = v.category || rawJson.category || 'alarmCategoryVideo';
  const subCategory = v.subCategory || rawJson.subCategory || 'alarmSubCategoryCamera';
  const vendorPriority = v.vendorPriority || rawJson.vendorPriority || '1';
  const vendorPriorityColor = v.vendorPriorityColor || rawJson.vendorPriorityColor || '#F40B0B';
  const state = v.state !== undefined ? v.state : (rawJson.state !== undefined ? rawJson.state : '1');
  const channel = v.channel || rawJson.channel || 'CCTV-01';
  const channelId = v.channelId || rawJson.channelId || '#ff75f3ca638e4075b45951f65cdd31dc';
  const channelType = v.channelType || rawJson.channelType || 'camera';

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      {/* 1. Collapsible Card Header */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full text-left p-4 sm:p-5 border-b border-border bg-muted/20 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer select-none"
        aria-expanded={isExpanded}
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-bold text-foreground">Vendor data</h2>
          <p className="text-xs text-muted-foreground">
            The event type is FALCON's reading of the vendor code.
          </p>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground ml-3 shrink-0">
          <ChevronDown
            className={cn(
              'size-4 transition-transform duration-200',
              isExpanded && 'rotate-180'
            )}
          />
        </div>
      </button>

      {/* 2. Definition List Content */}
      {isExpanded && (
        <div className="p-4 sm:p-5 flex flex-col gap-5 text-xs animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {/* Column 1: Vendor Code */}
            <div className="flex flex-col gap-1 pb-3 border-b border-border">
              <span className="text-[11px] font-mono text-muted-foreground">
                Vendor code
              </span>
              <span className="text-xs font-mono font-semibold text-foreground">
                {vendorCode}
              </span>
            </div>

            {/* Column 2: Rule with ID and Copy button */}
            <div className="flex flex-col gap-1 pb-3 border-b border-border">
              <span className="text-[11px] font-mono text-muted-foreground">
                Rule
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-foreground truncate">
                  {ruleName} · {ruleId}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(ruleId, 'Rule ID', 'ruleId');
                  }}
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
                  title="Copy Rule ID"
                  aria-label="Copy Rule ID"
                >
                  {copiedField === 'ruleId' ? (
                    <Check className="size-3 text-emerald-500" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                </button>
              </div>
            </div>

            {/* Column 1: Category */}
            <div className="flex flex-col gap-1 pb-3 border-b border-border">
              <span className="text-[11px] font-mono text-muted-foreground">
                Category
              </span>
              <span className="text-xs font-mono text-foreground">
                {category} · {subCategory}
              </span>
            </div>

            {/* Column 2: Vendor Priority with Swatch */}
            <div className="flex flex-col gap-1 pb-3 border-b border-border">
              <span className="text-[11px] font-mono text-muted-foreground">
                Vendor priority
              </span>
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full shrink-0 border border-black/20 dark:border-white/20"
                  style={{ backgroundColor: vendorPriorityColor }}
                  aria-hidden="true"
                />
                <span className="text-xs font-mono text-foreground">
                  {vendorPriority} · {vendorPriorityColor}
                </span>
              </div>
            </div>

            {/* Column 1: State */}
            <div className="flex flex-col gap-1 pb-3 border-b border-border md:border-b-0">
              <span className="text-[11px] font-mono text-muted-foreground">
                State
              </span>
              <span className="text-xs font-mono font-semibold text-foreground">
                {state}
              </span>
            </div>

            {/* Column 2: Channel with ID, type, and Copy button */}
            <div className="flex flex-col gap-1 pb-3 border-b border-border md:border-b-0">
              <span className="text-[11px] font-mono text-muted-foreground">
                Channel
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-foreground truncate">
                  {channel} · {channelId} · {channelType}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(channelId, 'Channel ID', 'channelId');
                  }}
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
                  title="Copy Channel ID"
                  aria-label="Copy Channel ID"
                >
                  {copiedField === 'channelId' ? (
                    <Check className="size-3 text-emerald-500" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
