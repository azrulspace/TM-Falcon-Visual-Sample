import React, { useState, useEffect } from 'react';
import type { DeviceWithRelations } from '@/types/devices';
import type { LiveCameraGroup } from '@/lib/liveGroups';
import {
  getLiveGroups,
  addCameraToGroup,
  removeCameraFromGroup,
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
import { Bookmark, Plus, Check } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

interface AddToGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  camera: DeviceWithRelations;
  onOpenNewGroup: () => void;
}

export const AddToGroupDialog: React.FC<AddToGroupDialogProps> = ({
  open,
  onOpenChange,
  camera,
  onOpenNewGroup,
}) => {
  const { addToast } = useToast();
  const [groups, setGroups] = useState<LiveCameraGroup[]>([]);
  const [membership, setMembership] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (open) {
      const allGroups = getLiveGroups();
      setGroups(allGroups);

      const initialMap: Record<string, boolean> = {};
      allGroups.forEach((g) => {
        initialMap[g.id] = g.cameraIds.some(
          (id) => id.toLowerCase() === camera.identifier.toLowerCase()
        );
      });
      setMembership(initialMap);
    }
  }, [open, camera.identifier]);

  const handleToggle = (groupId: string) => {
    setMembership((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleSave = () => {
    groups.forEach((g) => {
      const currentlyIn = g.cameraIds.some(
        (id) => id.toLowerCase() === camera.identifier.toLowerCase()
      );
      const shouldBeIn = Boolean(membership[g.id]);

      if (shouldBeIn && !currentlyIn) {
        addCameraToGroup(g.id, camera.identifier);
      } else if (!shouldBeIn && !g.isSystem && currentlyIn) {
        removeCameraFromGroup(g.id, camera.identifier);
      }
    });

    addToast(
      'success',
      `Updated group memberships for camera ${camera.identifier}.`,
      'Groups Updated'
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border text-foreground p-6 rounded-xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Bookmark className="size-4 text-primary" />
            <span>Add {camera.identifier} to groups</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Select the custom camera groups where {camera.identifier} should appear on the Monitor wall.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-3">
          <div className="max-h-60 overflow-y-auto divide-y divide-border border border-border rounded-lg p-1">
            {groups.map((group) => {
              const isChecked = Boolean(membership[group.id]);
              return (
                <div
                  key={group.id}
                  onClick={() => handleToggle(group.id)}
                  className={`flex items-center justify-between p-2.5 rounded-lg text-xs cursor-pointer transition-colors ${
                    isChecked ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="size-4 rounded accent-primary cursor-pointer"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-foreground truncate">{group.name}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {group.cameraIds.length} cameras {group.isSystem ? '• System' : ''}
                      </span>
                    </div>
                  </div>

                  {isChecked && <Check className="size-3.5 text-primary shrink-0" />}
                </div>
              );
            })}
          </div>

          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onOpenNewGroup();
              }}
              className="w-full h-8 text-xs gap-1.5 cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>Create new group</span>
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-9 px-4 text-xs">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} className="h-9 px-4 text-xs font-semibold">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
