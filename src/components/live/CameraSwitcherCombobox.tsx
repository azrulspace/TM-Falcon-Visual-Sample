import React, { useState, useMemo } from 'react';
import type { DeviceWithRelations } from '@/types/devices';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ChevronDown, Search, Video, Check, Filter } from 'lucide-react';

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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="group flex items-center gap-2 px-3 py-1.5 -ml-3 rounded-lg hover:bg-muted/60 transition-colors cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Select camera"
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                {currentCamera.identifier}
              </span>
              <ChevronDown className="size-5 text-muted-foreground group-hover:text-foreground transition-transform duration-200" />
            </div>
          </button>
        }
      />

      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[360px] sm:w-[420px] p-0 bg-popover text-popover-foreground border-border shadow-xl rounded-xl overflow-hidden z-50"
      >
        {/* Search header */}
        <div className="p-3 border-b border-border bg-muted/20 space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              placeholder="Search identifier, model, or pole..."
              className="w-full pl-9 pr-3 h-9 text-xs rounded-md bg-background border border-border text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              autoFocus
            />
          </div>

          {/* Inline filters for Vendor and Site */}
          <div className="flex items-center gap-2 pt-1 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground shrink-0">
              <Filter className="size-3" />
              <span className="text-[11px]">Filter:</span>
            </div>
            {/* Vendor Select */}
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="h-7 px-2 text-[11px] rounded bg-background border border-border text-foreground hover:bg-muted/50 cursor-pointer flex-1"
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
              className="h-7 px-2 text-[11px] rounded bg-background border border-border text-foreground hover:bg-muted/50 cursor-pointer flex-1"
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
        <div className="max-h-[320px] overflow-y-auto divide-y divide-border/40 p-1">
          {filteredCameras.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No matching cameras found
            </div>
          ) : (
            filteredCameras.map((camera) => {
              const isSelected = camera.identifier === currentCamera.identifier;
              const isOnline = camera.connectivityState === 'online';
              const isStale = camera.connectivityState === 'stale';

              return (
                <button
                  key={camera.identifier}
                  type="button"
                  onClick={() => {
                    onSelectCamera(camera);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-primary/10 text-foreground font-medium'
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
                      <span className="text-[11px] text-muted-foreground truncate">
                        {camera.model} • {camera.installedPoleId ? `Pole ${camera.installedPoleId}` : 'Unmounted'}
                      </span>
                    </div>
                  </div>

                  {/* Connectivity State Dot + Label */}
                  <div className="flex items-center gap-1.5 shrink-0 pl-2">
                    <span
                      className={`size-2 rounded-full ${
                        isOnline
                          ? 'bg-emerald-500'
                          : isStale
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                    />
                    <span className="text-[11px] text-muted-foreground capitalize">
                      {camera.connectivityState}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
