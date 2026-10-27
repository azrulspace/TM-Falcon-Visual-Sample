import React, { useState } from 'react';
import { X, RotateCw, ExternalLink, Tablet } from 'lucide-react';
import { useUiMode } from '@/hooks/useUiMode';
import { Button } from '@/components/ui/button';

export const PreviewFrameModal: React.FC = () => {
  const { previewFrame, closePreviewFrame, openPreviewFrame } = useUiMode();
  const [scaleFactor, setScaleFactor] = useState<number>(1);

  if (!previewFrame || !previewFrame.isOpen) return null;

  // Build target URL for the iframe, forcing tablet mode inside the preview
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.set('forceUiMode', 'tablet');
  const iframeSrc = currentUrl.toString();

  const handleToggleOrientation = () => {
    openPreviewFrame(previewFrame.orientation === 'landscape' ? 'portrait' : 'landscape');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tablet mode preview container"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none animate-in fade-in-50 duration-200"
    >
      {/* Top Floating Bar */}
      <div className="flex items-center justify-between w-full max-w-5xl px-4 py-2.5 mb-3 rounded-xl bg-card border border-border shadow-2xl text-foreground text-xs">
        <div className="flex items-center gap-2.5">
          <Tablet className="size-4 text-primary shrink-0" />
          <span className="font-semibold">
            Tablet Preview: {previewFrame.orientation === 'landscape' ? 'Landscape (1180 × 820)' : 'Portrait (820 × 1180)'}
          </span>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            Media queries and touch behaviors execute inside this frame
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Rotate Orientation Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleToggleOrientation}
            className="h-7 text-xs px-2.5 gap-1.5 border-border cursor-pointer"
            title="Toggle orientation"
          >
            <RotateCw className="size-3 text-muted-foreground" />
            <span className="capitalize">{previewFrame.orientation === 'landscape' ? 'Portrait' : 'Landscape'}</span>
          </Button>

          {/* Scale toggle (100% vs 85%) */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setScaleFactor((s) => (s === 1 ? 0.85 : 1))}
            className="h-7 text-xs px-2 border-border cursor-pointer font-mono"
            title="Toggle preview zoom scale"
          >
            {Math.round(scaleFactor * 100)}%
          </Button>

          {/* Open in new tab */}
          <a
            href={iframeSrc}
            target="_blank"
            rel="noopener noreferrer"
            className="h-7 px-2 flex items-center gap-1 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer"
            title="Open in standalone tab"
          >
            <ExternalLink className="size-3" />
          </a>

          {/* Close Button */}
          <button
            type="button"
            onClick={closePreviewFrame}
            className="size-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer transition-colors"
            aria-label="Close preview container"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Frame Container simulating real tablet bezel */}
      <div
        style={{
          width: `${previewFrame.width * scaleFactor}px`,
          height: `${previewFrame.height * scaleFactor}px`,
          maxHeight: 'calc(100vh - 100px)',
          maxWidth: 'calc(100vw - 32px)',
        }}
        className="relative rounded-[28px] border-[10px] border-neutral-800 bg-black shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col transition-all duration-300"
      >
        {/* Subtle camera punch hole */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 size-2.5 rounded-full bg-neutral-900 border border-neutral-700/50 z-30 pointer-events-none" />

        <iframe
          src={iframeSrc}
          title="Falcon Tablet Preview"
          className="w-full h-full border-0 bg-background"
          style={{
            borderRadius: '18px',
          }}
        />
      </div>
    </div>
  );
};
