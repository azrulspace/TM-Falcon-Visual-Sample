import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { DeviceWithRelations } from '@/types/devices';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ChevronDown, Search, Video, Check, Filter } from 'lucide-react';
import { computeUnifiedDeviceState } from '@/lib/liveCameras';

interface CameraSwitcherComboboxProps {
  currentCamera: DeviceWithRelations;
  cameras: DeviceWithRelations[];
  onSelectCamera: (camera: DeviceWithRelations) => void;
}

export const CameraSwitcherCombobox: React.FC<CameraSwitcherComboboxProps> = ({
  currentCamera,
  cameras,
  onSelectCamera,
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<string>('all');
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Vendors list
  const vendors = useMemo(() => {
    const set = new Set<string>();
    cameras.forEach((c) => {
      if (c.manufacturer) set.add(c.manufacturer);
    });
    return Array.from(set);
  }, [cameras]);

  // Sites list
  const sites = useMemo(() => {
    const set = new Set<string>();
    cameras.forEach((c) => {
      if (c.siteName) set.add(c.siteName);
    });
    return Array.from(set);
  }, [cameras]);

  // Filtered cameras
  const filteredCameras = useMemo(() => {
    return cameras.filter((c) => {
      if (selectedVendor !== 'all' && c.manufacturer !== selectedVendor) return false;
      if (selectedSite !== 'all' && c.siteName !== selectedSite) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      return (
        c.identifier.toLowerCase().includes(q) ||
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.model && c.model.toLowerCase().includes(q)) ||
        (c.installedPoleId && c.installedPoleId.toLowerCase().includes(q)) ||
        (c.vendorDeviceId && c.vendorDeviceId.toLowerCase().includes(q))
      );
    });
  }, [cameras, selectedVendor, selectedSite, searchQuery]);

  // Reset highlighted index on filter or search change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredCameras.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredCameras.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredCameras.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCameras[highlightedIndex]) {
        onSelectCamera(filteredCameras[highlightedIndex]);
        setOpen(false);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <h1 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
        {currentCamera.identifier}
      </h1>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 gap-2 text-xs font-medium border-border bg-card hover:bg-muted text-foreground cursor-pointer rounded-lg shadow-xs"
              aria-label="Switch camera"
              aria-haspopup="listbox"
              aria-expanded={open}
            >
              <Video className="size-3.5 text-muted-foreground" />
              <span>Switch camera</span>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </Button>
          }
        />

        <PopoverContent
          align="start"
          sideOffset={8}
          className="w-[360px] sm:w-[420px] p-0 bg-popover text-popover-foreground border-border shadow-2xl rounded-xl overflow-hidden z-50"
        >
          {/* Search header */}
          <div className="p-3 border-b border-border bg-muted/20 space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search identifier, model, or pole..."
                className="w-full pl-9 pr-3 h-9 text-xs rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                autoFocus
              />
            </div>

            {/* Inline filters for Vendor and Site */}
            <div className="flex items-center gap-2 pt-1 text-xs">
              <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                <Filter className="size-3" />
                <span className="text-xs">Filter:</span>
              </div>
              {/* Vendor Select */}
              <select
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
                className="h-8 px-2 text-xs rounded-lg bg-background border border-border text-foreground hover:bg-muted/50 cursor-pointer flex-1"
              >
                <option value="all">All vendors ({cameras.length})</option>
                {vendors.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>

              {/* Site Select */}
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="h-8 px-2 text-xs rounded-lg bg-background border border-border text-foreground hover:bg-muted/50 cursor-pointer flex-1"
              >
                <option value="all">All sites</option>
                {sites.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Camera List */}
          <div
            ref={listRef}
            role="listbox"
            className="max-h-[320px] overflow-y-auto divide-y divide-border p-1"
          >
            {filteredCameras.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No matching cameras found
              </div>
            ) : (
              filteredCameras.map((camera, index) => {
                const isSelected = camera.identifier === currentCamera.identifier;
                const isHighlighted = index === highlightedIndex;
                const unifiedState = computeUnifiedDeviceState(camera.lastContactAt, camera.connectivityState);

                return (
                  <button
                    key={camera.identifier}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onSelectCamera(camera);
                      setOpen(false);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-primary/10 text-foreground font-medium'
                        : isHighlighted
                        ? 'bg-muted/70 text-foreground'
                        : 'hover:bg-muted/60 text-foreground'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <Video className={`size-4 mt-0.5 shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-foreground">
                            {camera.identifier}
                          </span>
                          {isSelected && (
                            <Check className="size-3 text-primary shrink-0" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground truncate">
                          {camera.model} • {camera.installedPoleId ? `Pole ${camera.installedPoleId}` : 'Unmounted'}
                        </span>
                      </div>
                    </div>

                    {/* Connectivity State Dot + Label */}
                    <div className="flex items-center gap-1.5 shrink-0 pl-2">
                      <span
                        className={`size-2 rounded-full ${
                          unifiedState.state === 'online'
                            ? 'bg-emerald-500'
                            : unifiedState.state === 'stale'
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                      />
                      <span className="text-xs text-muted-foreground capitalize">
                        {unifiedState.state}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
