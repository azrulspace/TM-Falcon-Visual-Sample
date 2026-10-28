import React from 'react';
import { cn } from '@/lib/utils';
import type { RiskConfidence } from '@/types/risk';

export interface RiskConfidenceMeterProps {
  confidence: RiskConfidence | string;
  size?: 'sm' | 'default';
  showLabel?: boolean;
  className?: string;
}

/**
 * 3-Segment Neutral Confidence Meter (Section 5.7).
 * Strictly uses neutral and primary tones (NEVER red, orange or priority colors).
 */
export const RiskConfidenceMeter: React.FC<RiskConfidenceMeterProps> = ({
  confidence,
  size = 'default',
  showLabel = true,
  className = '',
}) => {
  const norm = (confidence || '').toLowerCase();
  const activeCount = norm === 'high' ? 3 : norm === 'medium' ? 2 : 1;
  const label = norm === 'high' ? 'High' : norm === 'medium' ? 'Medium' : 'Low';

  const barHeight = size === 'sm' ? 'h-1.5' : 'h-2';
  const barWidth = size === 'sm' ? 'w-2.5' : 'w-3.5';

  return (
    <div
      className={cn('inline-flex items-center gap-1.5 select-none', className)}
      title={`Confidence: ${label} (${activeCount}/3 segments)`}
    >
      <div className="flex items-center gap-0.5">
        {[1, 2, 3].map((idx) => {
          const isActive = idx <= activeCount;
          return (
            <div
              key={idx}
              className={cn(
                'rounded-xs transition-colors',
                barHeight,
                barWidth,
                isActive ? 'bg-primary' : 'bg-muted-foreground/25 dark:bg-muted-foreground/30'
              )}
            />
          );
        })}
      </div>
      {showLabel && (
        <span
          className={cn(
            'font-medium text-muted-foreground',
            size === 'sm' ? 'text-[11px]' : 'text-xs'
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
};
