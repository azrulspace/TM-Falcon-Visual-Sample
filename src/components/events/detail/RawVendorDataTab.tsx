import React, { useState } from 'react';
import { Copy, ChevronDown, ChevronRight, Check, Code2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/contexts/ToastContext';
import type { FalconEvent } from '@/data/events';
import type { EventDetailViewModel } from '@/types/eventDetail';

export interface RawVendorDataTabProps {
  event: FalconEvent | EventDetailViewModel;
}

export const RawVendorDataTab: React.FC<RawVendorDataTabProps> = ({ event }) => {
  const { addToast } = useToast();
  const [jsonExpanded, setJsonExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

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
  const channelType = v.channelType || rawJson.channelType || 'camera';

  const jsonString = JSON.stringify(rawJson, null, 2);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    addToast('info', 'Vendor JSON payload copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4 p-5 rounded-xl border border-border bg-card shadow-xs text-xs">
      {/* 1. Header & Helper Notice */}
      <div className="flex flex-col gap-3 pb-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="size-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Raw Vendor Data</h3>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
            Protocol: Edge Ingestion Telemetry
          </span>
        </div>

        {/* Live Staging banner: The event type is FALCON's reading of the vendor code */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs">
          <Info className="size-4 shrink-0 text-blue-500" />
          <span>The event type is FALCON's reading of the vendor code.</span>
        </div>
      </div>

      {/* 2. Structured Key-Value Table matching spec */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
              <th className="py-2.5 px-3 w-1/4">Field Name</th>
              <th className="py-2.5 px-3">Telemetry Value</th>
              <th className="py-2.5 px-3 w-1/3">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr>
              <td className="py-2.5 px-3 font-mono font-medium text-foreground">vendor_code</td>
              <td className="py-2.5 px-3 font-mono text-primary font-semibold">{vendorCode}</td>
              <td className="py-2.5 px-3 text-muted-foreground">Standard Alarm Code</td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 font-mono font-medium text-foreground">rule</td>
              <td className="py-2.5 px-3 font-mono text-foreground">
                {rule} <span className="text-muted-foreground">·</span> {ruleId}
              </td>
              <td className="py-2.5 px-3 text-muted-foreground">CCTV Motion Detection Rule Definition</td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 font-mono font-medium text-foreground">category</td>
              <td className="py-2.5 px-3 font-mono text-foreground">
                {category} <span className="text-muted-foreground">·</span> {subCategory}
              </td>
              <td className="py-2.5 px-3 text-muted-foreground">Alarm Classification Taxonomy</td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 font-mono font-medium text-foreground">vendor_priority</td>
              <td className="py-2.5 px-3">
                <div className="flex items-center gap-2">
                  <span
                    className="size-3 rounded-full shrink-0 shadow-xs border border-white/20"
                    style={{ backgroundColor: vendorPriorityColor }}
                    title={`Color swatch: ${vendorPriorityColor}`}
                  />
                  <span className="font-mono font-semibold text-foreground">{vendorPriority}</span>
                </div>
              </td>
              <td className="py-2.5 px-3 text-muted-foreground">Hardware Priority Tier (1 = High)</td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 font-mono font-medium text-foreground">state</td>
              <td className="py-2.5 px-3 font-mono text-foreground">{state}</td>
              <td className="py-2.5 px-3 text-muted-foreground">Active Alarm State (1 = Active)</td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 font-mono font-medium text-foreground">channel</td>
              <td className="py-2.5 px-3 font-mono text-foreground">
                {channel} <span className="text-muted-foreground">·</span> {channelId} - {channelType}
              </td>
              <td className="py-2.5 px-3 text-muted-foreground">Ingestion Sensor Camera Endpoint</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 3. Collapsible JSON Viewer with Copy Button */}
      <div className="flex flex-col rounded-lg border border-border bg-[#0B101B] text-slate-200 overflow-hidden">
        <div
          onClick={() => setJsonExpanded(!jsonExpanded)}
          className="flex items-center justify-between px-3 py-2 bg-muted/40 border-b border-border cursor-pointer select-none"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            {jsonExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
            <span>Raw Ingestion Document (JSON)</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleCopyJson();
            }}
            className="h-7 px-2 text-xs gap-1 text-slate-300 hover:text-white hover:bg-slate-800"
          >
            {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
            <span>{copied ? 'Copied' : 'Copy JSON'}</span>
          </Button>
        </div>

        {jsonExpanded && (
          <div className="p-3 overflow-x-auto max-h-96">
            <pre className="font-mono text-xs text-slate-300 leading-relaxed">
              {jsonString}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
