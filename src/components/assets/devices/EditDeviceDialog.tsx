import React, { useState, useEffect, useMemo } from 'react';
import { ArrowRight, Check, Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAssets } from '@/contexts/AssetsContext';
import {
  DEVICE_LIFECYCLE_OPTIONS,
  DEVICE_TYPE_OPTIONS,
  LIBRARY_OPTIONS_BY_MANUFACTURER,
  MANUFACTURER_OPTIONS,
} from '@/data/devicesRegistry';
import type {
  DeviceLifecycleState,
  DeviceTypeCategory,
  DeviceWithRelations,
} from '@/types/devices';

export interface EditDeviceDialogProps {
  device: DeviceWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const INPUT_CLASS =
  'w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50';

export const EditDeviceDialog: React.FC<EditDeviceDialogProps> = ({
  device,
  open,
  onOpenChange,
}) => {
  const { sites, editDevice, devicePermissions } = useAssets();

  const [name, setName] = useState('');
  const [siteName, setSiteName] = useState('Unassigned');
  const [type, setType] = useState<DeviceTypeCategory>('Camera');
  const [manufacturer, setManufacturer] = useState('Hikvision');
  const [library, setLibrary] = useState('HIK_OpenAPI');
  const [model, setModel] = useState('');
  const [serial, setSerial] = useState('');
  const [lifecycle, setLifecycle] = useState<DeviceLifecycleState>('Active');
  const [componentsText, setComponentsText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && device) {
      setName(device.name);
      setSiteName(device.siteName || 'Unassigned');
      setType(device.type);
      setManufacturer(device.manufacturer);
      setLibrary(device.library);
      setModel(device.model);
      setSerial(device.serial);
      setLifecycle(device.lifecycle);
      setComponentsText(device.components.join('\n'));
    }
  }, [open, device]);

  const libraryOptions = useMemo(
    () => LIBRARY_OPTIONS_BY_MANUFACTURER[manufacturer] || [library],
    [manufacturer, library]
  );

  useEffect(() => {
    if (libraryOptions.length > 0 && !libraryOptions.includes(library)) {
      setLibrary(libraryOptions[0]);
    }
  }, [libraryOptions, library]);

  const parsedComponents = useMemo(
    () =>
      componentsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    [componentsText]
  );

  const diffs = useMemo(() => {
    if (!device) return [];
    const list: { field: string; from: string; to: string }[] = [];
    if (name.trim() !== device.name) list.push({ field: 'Name', from: device.name, to: name.trim() });
    if (siteName !== (device.siteName || 'Unassigned')) {
      list.push({ field: 'Site', from: device.siteName || 'Unassigned', to: siteName });
    }
    if (type !== device.type) list.push({ field: 'Type', from: device.type, to: type });
    if (manufacturer !== device.manufacturer) {
      list.push({ field: 'Manufacturer', from: device.manufacturer, to: manufacturer });
    }
    if (library !== device.library) list.push({ field: 'Library', from: device.library, to: library });
    if (model.trim() !== device.model) list.push({ field: 'Model', from: device.model, to: model.trim() });
    if (serial.trim() !== device.serial) list.push({ field: 'Serial', from: device.serial, to: serial.trim() });
    if (lifecycle !== device.lifecycle) {
      list.push({ field: 'Lifecycle', from: device.lifecycle, to: lifecycle });
    }
    if (parsedComponents.join(', ') !== device.components.join(', ')) {
      list.push({
        field: 'Components',
        from: device.components.join(', ') || 'None',
        to: parsedComponents.join(', ') || 'None',
      });
    }
    return list;
  }, [device, name, siteName, type, manufacturer, library, model, serial, lifecycle, parsedComponents]);

  if (!device) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (diffs.length === 0) return;
    setSaving(true);
    const res = await editDevice(device.identifier, {
      name: name.trim() || device.identifier,
      siteName,
      type,
      manufacturer,
      library,
      model: model.trim() || 'Unspecified',
      serial: serial.trim(),
      vendorDeviceId: serial.trim(),
      lifecycle,
      components: parsedComponents,
    });
    setSaving(false);
    if (res.ok) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Pencil className="size-4 text-primary" />
            <span>Edit device · {device.identifier}</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Update hardware details, site placement, or lifecycle. Identifier is locked after registration.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-1 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-foreground block">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground block">Site</label>
              <select
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="Unassigned">Unassigned</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground block">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as DeviceTypeCategory)}
                className={INPUT_CLASS}
              >
                {DEVICE_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground block">Lifecycle</label>
              <select
                value={lifecycle}
                onChange={(e) => setLifecycle(e.target.value as DeviceLifecycleState)}
                className={INPUT_CLASS}
              >
                {DEVICE_LIFECYCLE_OPTIONS.map((lc) => (
                  <option key={lc} value={lc}>
                    {lc}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground block">Manufacturer</label>
              <select
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                className={INPUT_CLASS}
              >
                {MANUFACTURER_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground block">Library</label>
              <select
                value={library}
                onChange={(e) => setLibrary(e.target.value)}
                className={INPUT_CLASS}
              >
                {libraryOptions.map((lib) => (
                  <option key={lib} value={lib}>
                    {lib}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground block">Model</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground block">Serial number</label>
              <input
                type="text"
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                className={`${INPUT_CLASS} font-mono`}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-foreground block">
              Components (one per line)
            </label>
            <textarea
              rows={2}
              value={componentsText}
              onChange={(e) => setComponentsText(e.target.value)}
              className="w-full rounded-lg border border-border bg-background p-2.5 text-xs"
            />
          </div>

          {/* Live Diff Summary */}
          {diffs.length > 0 && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-1.5">
              <div className="text-[11px] font-semibold text-primary">
                Pending changes ({diffs.length})
              </div>
              {diffs.map((d) => (
                <div key={d.field} className="flex items-center gap-2 text-[11px]">
                  <span className="font-medium text-foreground w-24 shrink-0">{d.field}:</span>
                  <span className="text-muted-foreground line-through truncate">{d.from}</span>
                  <ArrowRight className="size-3 text-primary shrink-0" />
                  <span className="font-semibold text-foreground truncate">{d.to}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={diffs.length === 0 || saving || !devicePermissions.canEditDevice}
              className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
            >
              <Check className="size-3.5" />
              <span>{saving ? 'Saving...' : 'Save changes'}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

