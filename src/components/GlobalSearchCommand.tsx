import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import { events } from '@/data/events';
import { cases } from '@/data/cases';
import { segments } from '@/data/segments';
import { AlertCircle, Briefcase, Camera, Cable, Compass, Tablet, Laptop, Sparkles } from 'lucide-react';
import { getFlattenedNavRoutes } from '@/config/navigation';
import { useUiMode } from '@/hooks/useUiMode';
import { useAssets } from '@/contexts/AssetsContext';

interface GlobalSearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectItem?: (type: 'event' | 'device' | 'case' | 'segment', id: string) => void;
}

export const GlobalSearchCommand: React.FC<GlobalSearchCommandProps> = ({
  open,
  onOpenChange,
  onSelectItem,
}) => {
  const navigate = useNavigate();
  const navRoutes = getFlattenedNavRoutes();
  const { setModeSetting, resolvedMode } = useUiMode();
  const { richDevices } = useAssets();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName))) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  const handleSelect = (type: 'event' | 'device' | 'case' | 'segment', id: string, route?: string) => {
    onOpenChange(false);
    if (onSelectItem) {
      onSelectItem(type, id);
    } else if (route) {
      navigate(route);
    }
  };

  const handleNavSelect = (route: string) => {
    onOpenChange(false);
    navigate(route);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search navigation, poles, spans, devices, events and cases... (Esc to close)" />
      <CommandList>
        <CommandEmpty>No matching infrastructure assets or events found.</CommandEmpty>

        <CommandGroup heading="System & Display Modes">
          <CommandItem
            value="Switch to tablet mode touch layout"
            onSelect={() => {
              setModeSetting('tablet');
              onOpenChange(false);
            }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Tablet className="size-4 text-primary shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">Switch to tablet mode</span>
              <span className="text-[11px] text-muted-foreground">
                Touch-optimized 44px targets, bottom sheets, tablet navigation
              </span>
            </div>
          </CommandItem>
          <CommandItem
            value="Switch to desktop mode density"
            onSelect={() => {
              setModeSetting('desktop');
              onOpenChange(false);
            }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Laptop className="size-4 text-primary shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">Switch to desktop mode</span>
              <span className="text-[11px] text-muted-foreground">
                High-density layout, full tables, hover menus
              </span>
            </div>
          </CommandItem>
          <CommandItem
            value="Switch to auto mode responsive"
            onSelect={() => {
              setModeSetting('auto');
              onOpenChange(false);
            }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="size-4 text-primary shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">Switch to auto UI mode</span>
              <span className="text-[11px] text-muted-foreground">
                Detects touch screens and viewport automatically (currently: {resolvedMode})
              </span>
            </div>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation & Workflows">
          {navRoutes.map((item) => {
            const Icon = item.icon || Compass;
            return (
              <CommandItem
                key={item.id + item.route}
                value={`${item.fullPath.join(' ')} ${item.label}`}
                onSelect={() => handleNavSelect(item.route)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Icon className="size-4 text-primary shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-foreground">{item.label}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {item.fullPath.join(' › ')}
                  </span>
                </div>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Events">
          {events.map((evt) => (
            <CommandItem
              key={evt.id}
              value={`${evt.id} ${evt.type} ${evt.priority} ${evt.asset || ''}`}
              onSelect={() => handleSelect('event', evt.id, '/events')}
              className="flex items-center gap-2 cursor-pointer"
            >
              <AlertCircle className="size-4 text-warning" />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-primary">{evt.id}</span>
                  <span className="text-xs text-foreground">{evt.type}</span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Asset: {evt.asset || 'N/A'} • Priority: {evt.priority} • {evt.captured}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Devices">
          {richDevices.map((dev) => (
            <CommandItem
              key={dev.identifier}
              value={`${dev.identifier} ${dev.name} ${dev.type} ${dev.serial} ${dev.siteName || 'Unassigned'} ${dev.installedPoleId || ''}`}
              onSelect={() =>
                handleSelect(
                  'device',
                  dev.identifier,
                  `/assets/inventory/devices/${encodeURIComponent(dev.identifier)}`
                )
              }
              className="flex items-center gap-2 cursor-pointer"
            >
              <Camera className="size-4 text-primary" />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-primary">
                    {dev.identifier}
                  </span>
                  <span className="text-xs text-foreground">
                    {dev.type} ({dev.connectivityState})
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Site: {dev.siteName || 'Unassigned'} • Pole: {dev.installedPoleId || 'Not installed'} • Serial: {dev.serial}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Poles & Cable Spans">
          {segments.map((seg) => (
            <CommandItem
              key={seg.id}
              value={`${seg.id} ${seg.route} ${seg.from} ${seg.to}`}
              onSelect={() => handleSelect('segment', seg.id, '/risk')}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Cable className="size-4 text-info" />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-primary">{seg.id}</span>
                  <span className="text-xs text-foreground">{seg.route}: {seg.from} to {seg.to}</span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Priority: {seg.priority} • Action: {seg.action}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Cases">
          {cases.map((c) => (
            <CommandItem
              key={c.id}
              value={`${c.id} ${c.title} ${c.status} ${c.assignee || 'Unassigned'}`}
              onSelect={() => handleSelect('case', c.id, `/cases/${c.id}`)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Briefcase className="size-4 text-primary" />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-primary">{c.id}</span>
                  <span className="text-xs text-foreground">{c.title}</span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Status: {c.status} • Assignee: {c.assignee || 'Unassigned'}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
