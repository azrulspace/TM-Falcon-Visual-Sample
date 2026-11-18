import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { DeviceWithRelations } from '@/types/devices';
import type { LiveCameraGroup } from '@/lib/liveGroups';
import {
  getLiveGroups,
  deleteLiveGroup,
  restoreLiveGroup,
  setActiveGroupId,
} from '@/lib/liveGroups';
import { MonitorTile } from './MonitorTile';
import { GroupManageDialog } from './GroupManageDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Play,
  Square,
  Maximize2,
  ChevronDown,
  Plus,
  Edit2,
  Trash2,
  Check,
  Video,
  Grid2X2,
  Grid3X3,
  Columns2,
  Square as SingleSquare,
  Info,
  Radio,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

interface MonitorWallProps {
  currentGroupId: string;
  allCameras: DeviceWithRelations[];
  onSelectGroup: (groupId: string) => void;
}

export const MonitorWall: React.FC<MonitorWallProps> = ({
  currentGroupId,
  allCameras,
  onSelectGroup,
}) => {
  const { addToast } = useToast();
  const wallContainerRef = useRef<HTMLDivElement>(null);

  const [groups, setGroups] = useState<LiveCameraGroup[]>([]);
  const [layout, setLayout] = useState<'1' | '2' | '4' | '6'>('4');
  const [activeStreamingIds, setActiveStreamingIds] = useState<Set<string>>(new Set());
  const [audioCameraId, setAudioCameraId] = useState<string | null>(null);
  const [spotlightCameraId, setSpotlightCameraId] = useState<string | null>(null);
  const [groupManageOpen, setGroupManageOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<LiveCameraGroup | null>(null);
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);

  // Load groups and layout on mount
  useEffect(() => {
    const loaded = getLiveGroups(allCameras);
    setGroups(loaded);

    const storedLayout = localStorage.getItem('falcon_live_wall_layout') as any;
    if (['1', '2', '4', '6'].includes(storedLayout)) {
      setLayout(storedLayout);
    }
  }, [allCameras]);

  // Current active group
  const activeGroup = useMemo(() => {
    return groups.find((g) => g.id.toLowerCase() === currentGroupId.toLowerCase()) || groups[0] || null;
  }, [groups, currentGroupId]);

  // Sync active group to localStorage
  useEffect(() => {
    if (activeGroup) {
      setActiveGroupId(activeGroup.id);
    }
  }, [activeGroup]);

  // Resolve camera records in this group in order
  const groupCameras = useMemo(() => {
    if (!activeGroup) return [];
    return activeGroup.cameraIds
      .map((id) => allCameras.find((c) => c.identifier.toLowerCase() === id.toLowerCase()))
      .filter((c): c is DeviceWithRelations => Boolean(c));
  }, [activeGroup, allCameras]);

  // Max visible tiles according to layout
  const layoutLimit = parseInt(layout, 10);
  const visibleCameras = useMemo(() => {
    return groupCameras.slice(0, layoutLimit);
  }, [groupCameras, layoutLimit]);

  // Check if any visible camera uses mobile data
  const hasMobileDataCamera = useMemo(() => {
    return visibleCameras.some((c) => {
      const model = (c.model || '').toLowerCase();
      const name = (c.name || '').toLowerCase();
      return model.includes('4g') || model.includes('lte') || name.includes('4g') || name.includes('lte');
    });
  }, [visibleCameras]);

  const handleLayoutChange = (newLayout: '1' | '2' | '4' | '6') => {
    setLayout(newLayout);
    localStorage.setItem('falcon_live_wall_layout', newLayout);
  };

  const handleToggleStream = (cameraId: string) => {
    setActiveStreamingIds((prev) => {
      const next = new Set(prev);
      if (next.has(cameraId)) {
        next.delete(cameraId);
        if (audioCameraId === cameraId) setAudioCameraId(null);
      } else {
        if (next.size >= 4) {
          addToast(
            'warning',
            'Bandwidth safety policy: Maximum 4 simultaneous streams allowed.',
            'Stream Limit Reached'
          );
          return prev;
        }
        next.add(cameraId);
      }
      return next;
    });
  };

  const handleToggleAudio = (cameraId: string) => {
    setAudioCameraId((prev) => (prev === cameraId ? null : cameraId));
  };

  const handleToggleSpotlight = (cameraId: string) => {
    setSpotlightCameraId((prev) => (prev === cameraId ? null : cameraId));
  };

  const handleStartAll = () => {
    // Hard limit: only start up to 4 streams
    const targetCameras = visibleCameras.slice(0, 4);
    const newStreaming = new Set<string>();
    targetCameras.forEach((c) => newStreaming.add(c.identifier));
    setActiveStreamingIds(newStreaming);

    if (visibleCameras.length > 4) {
      addToast(
        'info',
        'Started 4 streams. Remaining visible cameras kept on standby (stream limit policy).',
        'Streams Started'
      );
    } else {
      addToast(
        'success',
        `Started ${targetCameras.length} camera stream${targetCameras.length > 1 ? 's' : ''}.`,
        'Streams Active'
      );
    }
  };

  const handleStopAll = () => {
    const count = activeStreamingIds.size;
    setActiveStreamingIds(new Set());
    setAudioCameraId(null);
    if (count > 0) {
      addToast('info', `Stopped ${count} active stream${count > 1 ? 's' : ''}.`, 'Streams Stopped');
    }
  };

  const handleFullscreenWall = () => {
    if (!wallContainerRef.current) return;
    if (!document.fullscreenElement) {
      wallContainerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    const res = deleteLiveGroup(groupId);
    if (res.success && res.deletedGroup) {
      const deleted = res.deletedGroup;
      setGroups(getLiveGroups(allCameras));
      onSelectGroup('grp-all');

      addToast(
        'info',
        `Group "${deleted.name}" deleted.`,
        'Group Deleted',
        {
          action: {
            label: 'Undo',
            onClick: () => {
              restoreLiveGroup(deleted);
              setGroups(getLiveGroups(allCameras));
              onSelectGroup(deleted.id);
            },
          },
        }
      );
    } else {
      addToast('error', res.error || 'Cannot delete group', 'Delete Failed');
    }
  };

  return (
    <div ref={wallContainerRef} className="flex flex-col gap-4 w-full">
      {/* 1. Wall Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-card border border-border">
        {/* Left: Group Selector & Management */}
        <div className="flex items-center gap-2">
          <Popover open={groupDropdownOpen} onOpenChange={setGroupDropdownOpen}>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 gap-2 text-xs font-semibold border-border bg-card hover:bg-muted text-foreground cursor-pointer rounded-lg"
                  aria-label="Select camera group"
                >
                  <Video className="size-4 text-primary" />
                  <span>{activeGroup?.name || 'All cameras'}</span>
                  <Badge variant="outline" className="text-xs px-1.5 py-0 font-mono">
                    {groupCameras.length}
                  </Badge>
                  <ChevronDown className="size-3.5 text-muted-foreground ml-1" />
                </Button>
              }
            />
            <PopoverContent align="start" className="w-72 p-2 bg-popover text-popover-foreground border-border shadow-2xl rounded-xl">
              <div className="text-xs font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider">
                Camera Groups
              </div>
              <div className="space-y-1 pt-1 max-h-60 overflow-y-auto">
                {groups.map((g) => {
                  const isSelected = g.id === activeGroup?.id;
                  return (
                    <div
                      key={g.id}
                      onClick={() => {
                        onSelectGroup(g.id);
                        setGroupDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">{g.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {g.cameraIds.length} cameras {g.isSystem ? '• System' : ''}
                        </span>
                      </div>
                      {isSelected && <Check className="size-3.5 text-primary shrink-0" />}
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 mt-2 border-t border-border flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingGroup(null);
                    setGroupManageOpen(true);
                    setGroupDropdownOpen(false);
                  }}
                  className="w-full h-8 text-xs justify-start gap-2"
                >
                  <Plus className="size-3.5 text-primary" />
                  <span>New group</span>
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Edit current group button */}
          {activeGroup && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingGroup(activeGroup);
                setGroupManageOpen(true);
              }}
              className="h-9 px-2.5 text-xs gap-1.5 cursor-pointer"
              title="Edit camera group"
            >
              <Edit2 className="size-3.5" />
              <span className="hidden sm:inline">Edit group</span>
            </Button>
          )}

          {/* Delete group button (only non-system) */}
          {activeGroup && !activeGroup.isSystem && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteGroup(activeGroup.id)}
              className="size-9 p-0 text-muted-foreground hover:text-rose-500 cursor-pointer"
              title="Delete group"
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>

        {/* Center: Layout Selector (1, 2, 4, 6 tiles) */}
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border">
          <span className="text-xs font-semibold text-muted-foreground px-2 hidden md:inline">
            Layout:
          </span>
          <Button
            variant={layout === '1' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleLayoutChange('1')}
            className={`h-7 px-2 text-xs gap-1 cursor-pointer ${
              layout === '1' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground'
            }`}
            title="1 tile layout"
          >
            <SingleSquare className="size-3.5" />
            <span>1</span>
          </Button>
          <Button
            variant={layout === '2' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleLayoutChange('2')}
            className={`h-7 px-2 text-xs gap-1 cursor-pointer ${
              layout === '2' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground'
            }`}
            title="2 tiles layout"
          >
            <Columns2 className="size-3.5" />
            <span>2</span>
          </Button>
          <Button
            variant={layout === '4' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleLayoutChange('4')}
            className={`h-7 px-2 text-xs gap-1 cursor-pointer ${
              layout === '4' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground'
            }`}
            title="4 tiles (2x2) layout"
          >
            <Grid2X2 className="size-3.5" />
            <span>4</span>
          </Button>
          <Button
            variant={layout === '6' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleLayoutChange('6')}
            className={`h-7 px-2 text-xs gap-1 cursor-pointer ${
              layout === '6' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground'
            }`}
            title="6 tiles (3x2) layout"
          >
            <Grid3X3 className="size-3.5" />
            <span>6</span>
          </Button>
        </div>

        {/* Right: Stream Actions (Start all, Stop all, Fullscreen) */}
        <div className="flex items-center gap-2">
          {activeStreamingIds.size === 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartAll}
              className="h-9 px-3 text-xs gap-1.5 font-semibold border-border hover:bg-muted text-foreground cursor-pointer"
            >
              <Play className="size-3.5 fill-current" />
              <span>Start all</span>
            </Button>
          ) : (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleStopAll}
              className="h-9 px-3 text-xs gap-1.5 font-semibold cursor-pointer"
            >
              <Square className="size-3.5 fill-current" />
              <span>Stop all ({activeStreamingIds.size})</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleFullscreenWall}
            className="size-9 p-0 cursor-pointer"
            title="Fullscreen wall view"
          >
            <Maximize2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* 2. Status Line & Bandwidth Disclaimer */}
      <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground px-1 gap-2">
        <div className="flex items-center gap-3">
          <span className="font-medium text-foreground">
            Streaming {activeStreamingIds.size} / 4 active
          </span>
          <span className="text-border">•</span>
          <span>Showing {visibleCameras.length} of {groupCameras.length} cameras</span>
          {hasMobileDataCamera && (
            <>
              <span className="text-border">•</span>
              <span className="inline-flex items-center gap-1 text-amber-500 font-medium">
                <Radio className="size-3" />
                Mobile data cameras included
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground/80">
          <Info className="size-3 text-primary" />
          <span>Groups are saved on this device only</span>
        </div>
      </div>

      {/* 3. Grid Display or Spotlight View */}
      {visibleCameras.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-border bg-card space-y-3">
          <Video className="size-8 text-muted-foreground/40 mx-auto" />
          <div className="font-semibold text-foreground text-sm">No cameras in this group</div>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Click "Edit group" to select cameras for this view, or choose another group from the dropdown.
          </p>
          <Button
            size="sm"
            onClick={() => {
              setEditingGroup(activeGroup);
              setGroupManageOpen(true);
            }}
            className="h-8 text-xs font-semibold mt-2"
          >
            <Edit2 className="size-3.5 mr-1" />
            Edit group cameras
          </Button>
        </div>
      ) : spotlightCameraId ? (
        /* Spotlight Layout: 2/3 prominent tile + 1/3 vertical stack */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-8 flex flex-col gap-2">
            {(() => {
              const spotCamera = allCameras.find((c) => c.identifier === spotlightCameraId);
              if (!spotCamera) return null;
              return (
                <div className="relative">
                  <MonitorTile
                    camera={spotCamera}
                    isStreaming={activeStreamingIds.has(spotCamera.identifier)}
                    hasAudio={audioCameraId === spotCamera.identifier}
                    isSpotlight={true}
                    onToggleStream={handleToggleStream}
                    onToggleAudio={handleToggleAudio}
                    onToggleSpotlight={handleToggleSpotlight}
                  />
                  <div className="absolute top-3 left-14 z-30 pointer-events-none">
                    <Badge variant="outline" className="bg-primary/20 text-primary border-primary/40 text-xs px-2 py-0.5 font-semibold gap-1">
                      <Sparkles className="size-3" />
                      Spotlight
                    </Badge>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="lg:col-span-4 flex flex-col gap-3 max-h-[720px] overflow-y-auto pr-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              Other cameras in group
            </span>
            {visibleCameras
              .filter((c) => c.identifier !== spotlightCameraId)
              .map((camera) => (
                <MonitorTile
                  key={camera.identifier}
                  camera={camera}
                  isStreaming={activeStreamingIds.has(camera.identifier)}
                  hasAudio={audioCameraId === camera.identifier}
                  isSpotlight={false}
                  onToggleStream={handleToggleStream}
                  onToggleAudio={handleToggleAudio}
                  onToggleSpotlight={handleToggleSpotlight}
                />
              ))}
          </div>
        </div>
      ) : (
        /* Standard Grid Layout */
        <div
          className={`grid gap-4 ${
            layout === '1'
              ? 'grid-cols-1'
              : layout === '2'
              ? 'grid-cols-1 md:grid-cols-2'
              : layout === '4'
              ? 'grid-cols-1 md:grid-cols-2'
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {visibleCameras.map((camera) => (
            <MonitorTile
              key={camera.identifier}
              camera={camera}
              isStreaming={activeStreamingIds.has(camera.identifier)}
              hasAudio={audioCameraId === camera.identifier}
              isSpotlight={false}
              onToggleStream={handleToggleStream}
              onToggleAudio={handleToggleAudio}
              onToggleSpotlight={handleToggleSpotlight}
            />
          ))}
        </div>
      )}

      {/* Group Create/Edit Dialog */}
      <GroupManageDialog
        open={groupManageOpen}
        onOpenChange={setGroupManageOpen}
        groupToEdit={editingGroup}
        allCameras={allCameras}
        onSaved={(saved) => {
          setGroups(getLiveGroups(allCameras));
          onSelectGroup(saved.id);
        }}
      />
    </div>
  );
};
