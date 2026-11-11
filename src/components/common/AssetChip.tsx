import React from 'react';
import { Link } from 'react-router-dom';
import { formatId, cn } from '@/lib/utils';

export interface AssetChipProps {
  assetId: string | null | undefined;
  className?: string;
  type?: string;
}

export const AssetChip: React.FC<AssetChipProps> = ({
  assetId,
  className,
  type,
}) => {
  if (!assetId) return <span className="text-muted-foreground font-mono text-xs">—</span>;

  const isSpan =
    (type && type.toLowerCase().includes('span')) || /^cbl[-_]/i.test(assetId) || /span/i.test(assetId);
  const isLegacyUnderscoreSystem = /^(AST|CBL)_\d+$/i.test(assetId);
  const label = isLegacyUnderscoreSystem ? formatId(assetId) : assetId;
  const href = isSpan
    ? `/assets/cable-spans?selected=${encodeURIComponent(label)}`
    : `/assets/poles/${encodeURIComponent(label)}`;

  return (
    <Link
      to={href}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] bg-muted/60 hover:bg-muted border border-border/80 text-foreground hover:text-primary transition-colors font-mono text-xs font-medium cursor-pointer',
        className
      )}
      title={type ? `${type}: ${label}` : `Asset ${label}`}
    >
      <span>{label}</span>
    </Link>
  );
};
