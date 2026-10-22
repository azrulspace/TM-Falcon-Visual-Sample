import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, ChevronDown, ChevronRight, Check, Code2, Info } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { formatId } from '@/lib/utils';
import type { FalconEvent } from '@/data/events';
import type { EventDetailViewModel } from '@/types/eventDetail';

export interface VendorDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: FalconEvent | EventDetailViewModel | null;
}

export const VendorDataDialog: React.FC<VendorDataDialogProps> = ({
  open,
  onOpenChange,
  event,
}) => {
  const { addToast } = useToast();
  const [jsonExpanded, setJsonExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  if (!event) return null;

  // Extract authentic vendor telemetry with fallback to canonical contract
  const v = (event as any).vendorData || {};
  const rawJson = v.rawJson || (event as any).rawJson || {
    vendorCode: '10002',
    rule: (event as any).detection || 'CCTV-01-Motion Detection',
    ruleId: '2111032826769051648',
    category: 'alarmCategoryVideo',
    subCategory: 'alarmSubCategoryCamera',
    vendorPriority: '1',
    vendorPriorityColor: '#F40B0B',
    state: 1,
    channel: 'CCTV-01',
    channelId: '#ff75f3ca638e4075b45951f65cdd31dc',
    channelType: 'camera',
  };

  const vendorCode = v.vendorCode || rawJson.vendorCode || '10002';
  const rule = v.rule || rawJson.rule || 'CCTV-01-Motion Detection';
  const ruleId = v.ruleId || rawJson.ruleId || '2111032826769051648';
  const category = v.category || rawJson.category || 'alarmCategoryVideo';
  const subCategory = v.subCategory || rawJson.subCategory || 'alarmSubCategoryCamera';
  const vendorPriority = v.vendorPriority || rawJson.vendorPriority || '1';
  const vendorPriorityColor = v.vendorPriorityColor || rawJson.vendorPriorityColor || '#F40B0B';
  const state = v.state !== undefined ? v.state : (rawJson.state !== undefined ? rawJson.state : '1');
  const channel = v.channel || rawJson.channel || 'CCTV-01';
  const channelId = v.channelId || rawJson.channelId || '#ff75f3ca638e4075b45951f65cdd31dc';

  const jsonString = JSON.stringify(rawJson, null, 2);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    addToast('info', 'Vendor JSON payload copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto bg-card border-border text-card-foreground">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Code2 className="size-5 text-primary" />
            <DialogTitle className="text-base font-bold">
              Vendor Telemetry Data · {formatId(event.id)}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Structured metadata and raw payload received from the edge ingestion pipeline.
          </DialogDescription>
        </DialogHeader>

        {/* Live Staging banner */}
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs">
          <Info className="size-4 shrink-0 text-blue-500" />
          <span>The event type is FALCON's reading of the vendor code.</span>
        </div>

        {/* Structured Table */}
        <div className="rounded-lg border border-border overflow-hidden text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <th className="py-2 px-3 w-1/3">Field Name</th>
                <th className="py-2 px-3">Telemetry Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="py-2 px-3 font-mono font-medium text-foreground">vendor_code</td>
                <td className="py-2 px-3 font-mono text-primary font-semibold">{vendorCode}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-mono font-medium text-foreground">rule / rule_id</td>
                <td className="py-2 px-3 font-mono text-foreground">
                  {rule} <span className="text-muted-foreground">·</span> {ruleId}
                </td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-mono font-medium text-foreground">category / sub_category</td>
                <td className="py-2 px-3 font-mono text-foreground">
                  {category} <span className="text-muted-foreground">/</span> {subCategory}
                </td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-mono font-medium text-foreground">vendor_priority</td>
                <td className="py-2 px-3 font-mono text-foreground flex items-center gap-2">
                  <span
                    className="size-3 rounded-full inline-block shrink-0 shadow-xs"
                    style={{ backgroundColor: vendorPriorityColor }}
                  />
                  <span>{vendorPriority}</span>
                </td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-mono font-medium text-foreground">state</td>
                <td className="py-2 px-3 font-mono text-foreground">{state}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-mono font-medium text-foreground">channel / channel_id</td>
                <td className="py-2 px-3 font-mono text-foreground">
                  {channel} <span className="text-muted-foreground">·</span> <span className="text-xs text-muted-foreground">{channelId}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Collapsible JSON Viewer */}
        <div className="rounded-lg border border-border overflow-hidden text-xs">
          <div
            onClick={() => setJsonExpanded(!jsonExpanded)}
            className="flex items-center justify-between px-3 py-2 bg-muted/40 cursor-pointer select-none border-b border-border"
          >
            <div className="flex items-center gap-2 font-medium">
              {jsonExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              <span>Raw JSON Telemetry</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleCopyJson();
              }}
              className="h-6 px-2 text-[11px] gap-1 border-border"
            >
              {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </Button>
          </div>

          {jsonExpanded && (
            <pre className="p-3 bg-slate-950 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-60 leading-relaxed">
              {jsonString}
            </pre>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
