import React, { useState } from 'react';
import { ChevronDown, Copy, Check, Database } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
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

  // V11 requirement: "Collapsed by default on every width, with a visible chevron button and title and helper line always visible."
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    if (defaultExpanded !== undefined) return defaultExpanded;
    return false;
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
    <div className="flex flex-col rounded-xl border border-border bg-card shadow-xs overflow-hidden select-none">
      {/* 1. Header: Unified 48px anatomy with visible chevron (V8, V11) */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full text-left h-12 px-4 border-b border-border bg-muted/20 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <Database className="size-4 text-primary shrink-0 stroke-[1.5]" />
          <h3 className="text-sm font-semibold text-foreground">Vendor data</h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{isExpanded ? 'Hide details' : 'Show details'}</span>
          <ChevronDown
            className={cn(
              'size-4 transition-transform duration-200 stroke-[1.5]',
              isExpanded && 'rotate-180'
            )}
          />
        </div>
      </button>

      {/* 2. Definition List Content (V3: sans labels, mono for IDs/codes; V4: Fog neutral labels; V9: 20px padding) */}
      {isExpanded && (
        <div className="p-5 flex flex-col gap-4 text-xs font-sans animate-in fade-in duration-150">
          <p className="text-xs text-muted-foreground font-sans">
            The event type is FALCON's reading of the vendor code.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-1">
            {/* Column 1: Vendor Code */}
            <div className="flex flex-col gap-1 pb-3 border-b border-border">
              <span className="text-xs text-muted-foreground font-normal font-sans">
                Vendor code
              </span>
              <span className="text-xs font-mono font-semibold text-foreground">
                {vendorCode}
              </span>
            </div>

            {/* Column 2: Rule with ID and Copy button (32px hit target) */}
            <div className="flex flex-col gap-1 pb-3 border-b border-border">
              <span className="text-xs text-muted-foreground font-normal font-sans">
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
                  className="size-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  title="Copy Rule ID"
                  aria-label="Copy Rule ID"
                >
                  {copiedField === 'ruleId' ? (
                    <Check className="size-4 text-emerald-500 stroke-[1.5]" />
                  ) : (
                    <Copy className="size-4 stroke-[1.5]" />
                  )}
                </button>
              </div>
            </div>

            {/* Column 1: Category */}
            <div className="flex flex-col gap-1 pb-3 border-b border-border">
              <span className="text-xs text-muted-foreground font-normal font-sans">
                Category
              </span>
              <span className="text-xs font-mono text-foreground">
                {category} · {subCategory}
              </span>
            </div>

            {/* Column 2: Vendor Priority with colored dot */}
            <div className="flex flex-col gap-1 pb-3 border-b border-border">
              <span className="text-xs text-muted-foreground font-normal font-sans">
                Vendor priority
              </span>
              <div className="flex items-center gap-1.5 font-mono text-xs text-foreground">
                <span
                  className="size-2 rounded-full shrink-0"
                  style={{ backgroundColor: vendorPriorityColor }}
                />
                <span>{vendorPriority}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{vendorPriorityColor}</span>
              </div>
            </div>

            {/* Column 1: State */}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground font-normal font-sans">
                State
              </span>
              <span className="text-xs font-mono text-foreground">
                {state}
              </span>
            </div>

            {/* Column 2: Channel with ID and Copy button (32px hit target) */}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground font-normal font-sans">
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
                  className="size-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  title="Copy Channel ID"
                  aria-label="Copy Channel ID"
                >
                  {copiedField === 'channelId' ? (
                    <Check className="size-4 text-emerald-500 stroke-[1.5]" />
                  ) : (
                    <Copy className="size-4 stroke-[1.5]" />
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
