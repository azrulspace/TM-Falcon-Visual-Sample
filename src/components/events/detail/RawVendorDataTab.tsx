import React, { useState } from 'react';
import { Copy, ChevronDown, ChevronRight, Check, Code2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/contexts/ToastContext';
import type { FalconEvent } from '@/data/events';

export interface RawVendorDataTabProps {
  event: FalconEvent;
}

export const RawVendorDataTab: React.FC<RawVendorDataTabProps> = ({ event }) => {
  const { addToast } = useToast();
  const [jsonExpanded, setJsonExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  // Generate realistic vendor payload matching the camera / IoT vendor format
  const vendorPayload = {
    header: {
      protocol_version: 'v2.4-rtsp-ai',
      vendor: 'Hikvision-EdgeAI / Dahua Industrial',
      device_serial: event.device ? `SN-${event.device}-9823X` : 'SN-VIRT-001',
      firmware: 'FW_4.2.19_build261019',
      utc_timestamp: new Date(event.captured).toISOString(),
    },
    detection_payload: {
      vendor_code: event.vendorCode || 10002,
      vendor_rule: event.detection || 'CCTV-01-Motion Detection',
      bounding_box: {
        x_min: 0.24,
        y_min: 0.38,
        x_max: 0.72,
        y_max: 0.86,
        confidence_score: 0.942,
      },
      class_id: 'wildlife_primate_foliage',
      raw_telemetry: {
        lux_level: 420,
        ir_active: false,
        fps_at_capture: 25,
        bitrate_kbps: 4096,
        storage_buffer_id: `BUF-${event.id}`,
      },
    },
    network_context: {
      gateway_ip: '10.24.118.1',
      span_asset_tag: event.asset,
      uplink_type: 'GPON 1Gbps Backhaul',
      crc_errors: 0,
    },
  };

  const jsonString = JSON.stringify(vendorPayload, null, 2);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    addToast('info', 'Vendor JSON payload copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4 p-5 rounded-xl border border-border bg-card shadow-xs text-xs">
      {/* 1. Header & Helper Notice */}
      <div className="flex flex-col gap-2 pb-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="size-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Raw Vendor Payload</h3>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
            format: JSON-Schema 2020-12
          </span>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs">
          <Info className="size-4 shrink-0 text-blue-500" />
          <span>The event type is FALCON's reading of the vendor code.</span>
        </div>
      </div>

      {/* 2. Structured Key-Value Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
              <th className="py-2 px-3 w-1/3">Field Name</th>
              <th className="py-2 px-3">Telemetry Value</th>
              <th className="py-2 px-3 w-1/4">Origin Definition</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr>
              <td className="py-2 px-3 font-mono font-medium text-foreground">vendor_code</td>
              <td className="py-2 px-3 font-mono text-primary font-semibold">{event.vendorCode || '10002'}</td>
              <td className="py-2 px-3 text-muted-foreground">Standard Alarm Type</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-mono font-medium text-foreground">vendor_rule</td>
              <td className="py-2 px-3 font-mono text-foreground">{event.detection}</td>
              <td className="py-2 px-3 text-muted-foreground">Hardware Algorithm Filter</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-mono font-medium text-foreground">device_serial</td>
              <td className="py-2 px-3 font-mono text-foreground">SN-{event.device || 'VIRT'}-9823X</td>
              <td className="py-2 px-3 text-muted-foreground">Hardware Board Serial</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-mono font-medium text-foreground">firmware_ver</td>
              <td className="py-2 px-3 font-mono text-foreground">FW_4.2.19_build261019</td>
              <td className="py-2 px-3 text-muted-foreground">Embedded Linux OS</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-mono font-medium text-foreground">confidence_score</td>
              <td className="py-2 px-3 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">0.942 (94.2%)</td>
              <td className="py-2 px-3 text-muted-foreground">YOLOv8 Edge Neural Net</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 3. Collapsible JSON Viewer */}
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
