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
import { devices } from '@/data/devices';
import { events } from '@/data/events';
import { cases } from '@/data/cases';
import { segments } from '@/data/segments';
import { AlertCircle, Briefcase, Camera, Cable } from 'lucide-react';

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

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search poles, spans, devices, events and cases... (Esc to close)" />
      <CommandList>
        <CommandEmpty>No matching infrastructure assets or events found.</CommandEmpty>

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
          {devices.map((dev) => (
            <CommandItem
              key={dev.id}
              value={`${dev.id} ${dev.name} ${dev.type} ${dev.site} ${dev.asset}`}
              onSelect={() => handleSelect('device', dev.id, `/assets/inventory/devices/${dev.id}`)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Camera className="size-4 text-primary" />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-primary">{dev.id}</span>
                  <span className="text-xs text-foreground">{dev.type} ({dev.status})</span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Site: {dev.site} • Pole/Asset: {dev.asset} • Last: {dev.lastContact}
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
              value={`${c.id} ${c.title} ${c.type} ${c.team}`}
              onSelect={() => handleSelect('case', c.id, '/planned/cases')}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Briefcase className="size-4 text-success" />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-primary">{c.id}</span>
                  <span className="text-xs text-foreground">{c.title}</span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Type: {c.type} • Next: {c.next} • Team: {c.team}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
