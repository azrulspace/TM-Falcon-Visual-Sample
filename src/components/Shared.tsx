import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Search, Eye, ShieldAlert, Info, MapPin } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { StatusBadge as CommonStatusBadge } from '@/components/common/StatusBadge';
import { PriorityBadge as CommonPriorityBadge } from '@/components/common/PriorityBadge';

export const PageHeader = ({ title, description, breadcrumbs, actions, openQuestion, pageId, roles, tabs = false }: any) => {
  return (
    <div className={`mb-6 ${tabs ? 'border-b border-secondary pb-4' : ''}`}>
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
        <div>
          <h1 className="h2">{title}</h1>
          {description && <p className="text_sm text-tertiary max-w-[720px] mt-1">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {openQuestion && (
        <div className="mt-4 px-3 py-2 bg-brand-primary border border-brand rounded-lg text_xs flex flex-wrap gap-x-4 gap-y-2">
          <div><span className="font-semibold">Page:</span> {pageId}</div>
          <div><span className="font-semibold">Roles:</span> {roles}</div>
          <div className="flex items-center gap-1"><span className="font-semibold">Question:</span> {openQuestion}</div>
        </div>
      )}
    </div>
  );
};

export const Breadcrumbs = ({ items }: { items: { label: string; href?: string }[] }) => (
  <nav className="flex items-center gap-1 text_sm">
    {items.map((item, i) => (
      <React.Fragment key={i}>
        {i > 0 && <ChevronRight className="w-4 h-4 text-tertiary" />}
        {item.href ? (
          <Link to={item.href} className="text-tertiary hover:text-primary">{item.label}</Link>
        ) : (
          <span className="text-secondary">{item.label}</span>
        )}
      </React.Fragment>
    ))}
  </nav>
);

export const StatCard = ({ overline, number, helper, accent, onShowMap, icon: Icon }: any) => {
  const accentMap: any = {
    error: 'var(--bg_error_solid)',
    brand: 'var(--icon_brand)',
    warning: 'var(--bg_warning_solid)',
  };
  const color = accentMap[accent] || 'transparent';
  return (
    <div 
      className="app_card relative flex flex-col gap-1 !p-4 !pl-6 h-[112px] border-primary shadow-none cursor-pointer hover:bg-row-hover transition-colors" 
      onClick={onShowMap} 
      role="button" 
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onShowMap?.(); }}
    >
      <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full" style={{ backgroundColor: color }}></div>
      <div className="flex items-center justify-between h-5">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5" style={{ color }} />}
          <span className="text_xs font-semibold uppercase tracking-[var(--tracking\_wide)] text-tertiary">{overline}</span>
        </div>
        {onShowMap && (
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-[8px]" aria-label={`Show ${overline.toLowerCase()} on map`} tabIndex={-1}>
            <MapPin className="w-4 h-4" />
          </Button>
        )}
      </div>
      <div className="text-[24px] leading-[32px] font-semibold text-primary mt-1">{number}</div>
      <div className="text_sm text-tertiary">{helper}</div>
    </div>
  );
};

export const StatusBadge = ({ kind, value }: { kind?: 'priority' | 'state' | 'device' | 'action' | 'case', value: string }) => {
  if (kind === 'priority') {
    return <CommonPriorityBadge priority={value} />;
  }
  if (kind === 'state') {
    return <CommonStatusBadge status={value} />;
  }
  if (kind === 'device') {
    return <CommonStatusBadge status={value} />;
  }
  if (kind === 'action') {
    let ActionIcon = ShieldAlert;
    if (value === 'Inspect') ActionIcon = Search;
    if (value === 'Monitor') ActionIcon = Eye;
    if (value === 'Protect') ActionIcon = ShieldAlert;
    return <span className="badge badge_neutral"><ActionIcon className="w-3 h-3" /> {value}</span>;
  }
  if (kind === 'case') {
    return <CommonStatusBadge status="in case" label={value} />;
  }
  
  // fallback for old usages
  return <span className="badge badge_neutral">{value}</span>;
};

export const PendingConfigInfo = ({ text }: { text: string }) => (
  <Tooltip>
    <TooltipTrigger render={
      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-[8px]" aria-label="Pending configuration">
        <Info className="w-4 h-4" />
      </Button>
    } />
    <TooltipContent sideOffset={5} className="max-w-[300px]">
      {text}
    </TooltipContent>
  </Tooltip>
);

export const SegmentedControl = ({ options, value, onChange }: any) => {
  return (
    <div className="flex items-center h-10 bg-tertiary p-1 rounded-[10px] border border-secondary" role="radiogroup">
      {options.map((opt: string) => (
        <button
          key={opt}
          role="radio"
          aria-checked={value === opt}
          onClick={() => onChange(opt)}
          className={`h-8 px-3 text-sm font-medium leading-none rounded-[8px] transition-all flex items-center justify-center focus-visible:outline-none focus-visible:shadow-[var(--ring\_brand)] ${
            value === opt ? 'bg-primary shadow-sm text-primary' : 'text-tertiary hover:text-primary bg-transparent'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
};

export const ConfidenceMeter = ({ level }: { level: string }) => {
  const normalized = level.toLowerCase();
  const pills = [
    ['low', 'medium', 'high'].includes(normalized),
    ['medium', 'high'].includes(normalized),
    normalized === 'high'
  ];
  return (
    <div className="flex items-center gap-2" role="img" aria-label={`Confidence: ${level}`}>
      <div className="flex items-center gap-[3px]">
        {pills.map((filled, i) => (
          <div key={i} className={`w-3 h-1.5 rounded-full ${filled ? 'bg-[var(--icon\_brand)]' : 'bg-quaternary'}`} />
        ))}
      </div>
      <span className="text_sm text-primary">{level}</span>
    </div>
  );
};

export const EmptyState = ({ icon: Icon, title, description, action }: any) => (
  <div className="empty_state flex flex-col items-center justify-center text-center p-12">
    <div className="w-10 h-10 rounded-full bg-tertiary text-[var(--icon\_brand)] flex items-center justify-center mb-4">
      {Icon && <Icon className="w-5 h-5" />}
    </div>
    <div className="text_md font-semibold text-primary mb-1">{title}</div>
    <div className="text_sm text-tertiary max-w-[40ch] mb-4">{description}</div>
    {action && <div>{action}</div>}
  </div>
);
