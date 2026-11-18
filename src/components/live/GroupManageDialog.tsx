import React, { useState, useEffect, useMemo } from 'react';
import type { DeviceWithRelations } from '@/types/devices';
import type { LiveCameraGroup } from '@/lib/liveGroups';
import {
  saveLiveGroup,
  MAX_CAMERAS_PER_GROUP,
} from '@/lib/liveGroups';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Trash2, ArrowUp, ArrowDown, Video, Info } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

interface GroupManageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupToEdit?: LiveCameraGroup | null;
  allCameras: DeviceWithRelations[];
  onSaved: (group: LiveCameraGroup) => void;
}

export const GroupManageDialog: React.FC<GroupManageDialogProps> = ({
  open,
  onOpenChange,
  groupToEdit,
  allCameras,
  onSaved,
}) => {
  const { addToast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCameraIds, setSelectedCameraIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVendor, setFilterVendor] = useState('all');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isEdit = Boolean(groupToEdit);
  const isSystem = Boolean(groupToEdit?.isSystem);

  // Initialize form state
  useEffect(() => {
    if (open) {
      if (groupToEdit) {
        setName(groupToEdit.name);
        setDescription(groupToEdit.description || '');
        setSelectedCameraIds([...groupToEdit.cameraIds]);
      } else {
        setName('');
        setDescription('');
        setSelectedCameraIds([]);
      }
      setSearchQuery('');
      setFilterVendor('all');
      setErrorMessage(null);
    }
  }, [open, groupToEdit]);

  // Unique vendors for filter
  const vendors = useMemo(() => {
    const set = new Set<string>();
    allCameras.forEach((c) => {
      if (c.manufacturer) set.add(c.manufacturer);
    });
    return Array.from(set);
  }, [allCameras]);

  // Filtered cameras available for selection
  const filteredAvailableCameras = useMemo(() => {
    return allCameras.filter((c) => {
      if (filterVendor !== 'all' && c.manufacturer !== filterVendor) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        c.identifier.toLowerCase().includes(q) ||
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.installedPoleId && c.installedPoleId.toLowerCase().includes(q))
      );
    });
  }, [allCameras, filterVendor, searchQuery]);

  const handleToggleCamera = (id: string) => {
    if (selectedCameraIds.includes(id)) {
      setSelectedCameraIds((prev) => prev.filter((item) => item !== id));
    } else {
      if (selectedCameraIds.length >= MAX_CAMERAS_PER_GROUP) {
        setErrorMessage(`Cannot add more than ${MAX_CAMERAS_PER_GROUP} cameras to a group.`);
        return;
      }
      setSelectedCameraIds((prev) => [...prev, id]);
      setErrorMessage(null);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    setSelectedCameraIds((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index >= selectedCameraIds.length - 1) return;
    setSelectedCameraIds((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setErrorMessage('Group name is required.');
      return;
    }

    if (selectedCameraIds.length === 0) {
      setErrorMessage('Please select at least 1 camera for this group.');
      return;
    }

    const res = saveLiveGroup(
      {
        id: groupToEdit?.id,
        name: trimmed,
        description: description.trim(),
        cameraIds: selectedCameraIds,
      },
      allCameras
    );

    if (res.success && res.group) {
      addToast(
        'success',
        isEdit
          ? `Group "${res.group.name}" updated successfully.`
          : `Created new group "${res.group.name}" with ${selectedCameraIds.length} cameras.`,
        isEdit ? 'Group Updated' : 'Group Created'
      );
      onSaved(res.group);
      onOpenChange(false);
    } else {
      setErrorMessage(res.error || 'Failed to save group.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border text-foreground p-6 rounded-xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Video className="size-5 text-primary" />
            <span>{isEdit ? 'Edit camera group' : 'Create new camera group'}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Configure camera membership and custom display sequence for the Monitor wall.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {errorMessage && (
            <div className="p-3 text-xs bg-destructive/10 border border-destructive/30 text-destructive rounded-lg">
              {errorMessage}
            </div>
          )}

          {/* Group Name & Description */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Group name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setName(e.target.value);
                  setErrorMessage(null);
                }}
                disabled={isSystem}
                maxLength={40}
                placeholder="e.g. North Sector Feeders"
                className="w-full h-9 px-3 text-xs rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-50"
              />
              {isSystem && (
                <span className="text-xs text-muted-foreground mt-0.5 block">
                  System group names cannot be renamed.
                </span>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                maxLength={120}
                placeholder="Brief description of the cameras included in this group..."
                className="w-full h-16 p-3 text-xs rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-none"
              />
            </div>
          </div>

          {/* Camera Selection & Ordering */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border">
            {/* Left: Available Cameras with search & filter */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">
                  Available cameras ({filteredAvailableCameras.length})
                </span>
              </div>

              {/* Search & Vendor */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    placeholder="Search camera..."
                    className="w-full h-8 pl-8 pr-3 text-xs rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>
                <select
                  value={filterVendor}
                  onChange={(e) => setFilterVendor(e.target.value)}
                  className="h-8 px-2 text-xs rounded-lg bg-background border border-border text-foreground hover:bg-muted/50 cursor-pointer"
                >
                  <option value="all">All</option>
                  {vendors.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              {/* List */}
              <div className="h-56 overflow-y-auto border border-border rounded-lg p-1 divide-y divide-border/40">
                {filteredAvailableCameras.map((cam) => {
                  const isChecked = selectedCameraIds.includes(cam.identifier);
                  return (
                    <div
                      key={cam.identifier}
                      onClick={() => handleToggleCamera(cam.identifier)}
                      className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer transition-colors ${
                        isChecked ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="size-3.5 rounded accent-primary cursor-pointer"
                        />
                        <span className="font-mono font-semibold">{cam.identifier}</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {cam.installedPoleId ? `Pole ${cam.installedPoleId}` : 'Unmounted'}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs px-1.5 py-0 capitalize">
                        {cam.manufacturer || 'Camera'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Selected Cameras & Ordering */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">
                  In this group ({selectedCameraIds.length} / {MAX_CAMERAS_PER_GROUP})
                </span>
                {selectedCameraIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedCameraIds([])}
                    className="text-xs text-destructive hover:underline cursor-pointer"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Ordered list */}
              <div className="h-[268px] overflow-y-auto border border-border rounded-lg p-1 divide-y divide-border/40">
                {selectedCameraIds.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-4 text-center text-xs text-muted-foreground">
                    <span>No cameras selected yet.</span>
                    <span className="text-xs text-muted-foreground/80 mt-1">
                      Check cameras from the left column to add them to this group.
                    </span>
                  </div>
                ) : (
                  selectedCameraIds.map((camId, index) => {
                    return (
                      <div
                        key={camId}
                        className="flex items-center justify-between p-2 rounded text-xs hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono text-muted-foreground text-xs w-4 text-center">
                            {index + 1}
                          </span>
                          <span className="font-mono font-semibold text-foreground">
                            {camId}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={index === 0}
                            onClick={() => handleMoveUp(index)}
                            className="size-6 p-0"
                            title="Move up"
                          >
                            <ArrowUp className="size-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={index === selectedCameraIds.length - 1}
                            onClick={() => handleMoveDown(index)}
                            className="size-6 p-0"
                            title="Move down"
                          >
                            <ArrowDown className="size-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleCamera(camId)}
                            className="size-6 p-0 text-muted-foreground hover:text-destructive"
                            title="Remove from group"
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Honest Disclaimer Notice */}
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/60 text-xs text-muted-foreground">
            <Info className="size-4 text-primary shrink-0 mt-0.5" />
            <span>
              <strong>Note:</strong> Camera groups are saved locally on this browser. Server sync API is pending backend implementation.
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-9 px-4 text-xs">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} className="h-9 px-4 text-xs font-semibold">
            {isEdit ? 'Save changes' : 'Create group'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
