import React from 'react';
import type { RiskSegment } from '@/types/risk';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SegmentDetailContent } from './SegmentDetailContent';

export interface SegmentDetailSheetProps {
  segment: RiskSegment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvestigate: (segment: RiskSegment) => void;
  onDismiss: (segment: RiskSegment) => void;
  onShowOnMap: (segment: RiskSegment) => void;
}

export const SegmentDetailSheet: React.FC<SegmentDetailSheetProps> = ({
  segment,
  open,
  onOpenChange,
  onInvestigate,
  onDismiss,
  onShowOnMap,
}) => {
  if (!segment) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 bg-card border-border shadow-2xl flex flex-col z-50"
      >
        <SegmentDetailContent
          segment={segment}
          onClose={() => onOpenChange(false)}
          onInvestigate={(s) => {
            onInvestigate(s);
            onOpenChange(false);
          }}
          onDismiss={(s) => {
            onDismiss(s);
            onOpenChange(false);
          }}
          onShowOnMap={(s) => {
            onShowOnMap(s);
            onOpenChange(false);
          }}
          isSheet={true}
        />
      </SheetContent>
    </Sheet>
  );
};
