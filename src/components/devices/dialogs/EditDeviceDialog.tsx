import React, { useState } from 'react';
import {
  Pencil,
  X,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDevices } from '@/contexts/DevicesContext';
import type { DeviceRecord, DeviceHardwareType } from '@/types/devices';

export interface EditDeviceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  device: DeviceRecord | null;
}

const HARDWARE_TYPES: DeviceHardwareType[] = [
  'Camera',
  'Speaker',
  'Sensor',
  'Gateway',
  'LiDAR sensor',
];

const MANUFACTURERS = [
  'Hikvision',
  'Dahua',
  'Axis',
  'Hanwha',
  'Uniview',
  'Other',
];

const LIBRARIES = [
  'HIK_OpenAPI',
  'DAHUA_RPC',
  'AXIS_VAPIX',
  'ONVIF',
  'RTSP_GENERIC',
];

export const EditDeviceDialog: React.FC<EditDeviceDialogProps> = ({
  isOpen,
  onClose,
  device,
}) => {
  const { editDevice } = useDevices();

  const [name, setName] = useState(device?.name || '');
  const [type, setType] = useState<DeviceHardwareType>(device?.type || 'Camera');
  const [manufacturer, setManufacturer] = useState(device?.manufacturer || 'Hikvision');
  const [model, setModel] = useState(device?.model || '');
  const [serialNumber, setSerialNumber] = useState(device?.serialNumber || '');
  const [library, setLibrary] = useState(device?.library || 'HIK_OpenAPI');
  const [componentsText, setComponentsText] = useState(
    (device?.components || []).join('\n')
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !device) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const components = componentsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await editDevice(device.identifier, {
        name: name.trim() || device.identifier,
        type,
        manufacturer,
        model: model.trim(),
        serialNumber: serialNumber.trim(),
        library,
        components,
      });

      if (res.ok) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-dev-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Pencil className="size-4" />
            </div>
            <div>
              <h2 id="edit-dev-title" className="text-base font-bold text-foreground">
                Edit device details
              </h2>
              <p className="text-xs text-muted-foreground">
                Update specifications for <strong className="font-mono text-foreground">{device.identifier}</strong>.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Readonly Identifier */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-foreground flex items-center gap-1">
                <span>Identifier</span>
                <Lock className="size-3 text-muted-foreground" />
              </label>
              <span className="text-[10px] text-muted-foreground">
                Immutable primary key
              </span>
            </div>
            <input
              type="text"
              disabled
              value={device.identifier}
              className="w-full h-8.5 rounded-md border border-border bg-muted/40 px-3 font-mono text-xs text-muted-foreground cursor-not-allowed"
            />
          </div>

          {/* Name */}
          <div className="space-y-1">
            <label htmlFor="edit-dev-name" className="font-semibold text-foreground">
              Name
            </label>
            <input
              id="edit-dev-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-8.5 rounded-md border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Type */}
            <div className="space-y-1">
              <label htmlFor="edit-dev-type" className="font-semibold text-foreground">
                Type
              </label>
              <select
                id="edit-dev-type"
                value={type}
                onChange={(e) => setType(e.target.value as DeviceHardwareType)}
                className="w-full h-8.5 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {HARDWARE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Manufacturer */}
            <div className="space-y-1">
              <label htmlFor="edit-dev-mfg" className="font-semibold text-foreground">
                Manufacturer
              </label>
              <select
                id="edit-dev-mfg"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                className="w-full h-8.5 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {MANUFACTURERS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Model */}
            <div className="space-y-1">
              <label htmlFor="edit-dev-model" className="font-semibold text-foreground">
                Model
              </label>
              <input
                id="edit-dev-model"
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full h-8.5 rounded-md border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Library */}
            <div className="space-y-1">
              <label htmlFor="edit-dev-lib" className="font-semibold text-foreground">
                Library
              </label>
              <select
                id="edit-dev-lib"
                value={library}
                onChange={(e) => setLibrary(e.target.value)}
                className="w-full h-8.5 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {LIBRARIES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Serial Number */}
          <div className="space-y-1">
            <label htmlFor="edit-dev-serial" className="font-semibold text-foreground">
              Serial number
            </label>
            <input
              id="edit-dev-serial"
              type="text"
              required
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value.trim())}
              className="w-full h-8.5 rounded-md border border-border bg-background px-3 font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Components */}
          <div className="space-y-1">
            <label htmlFor="edit-dev-components" className="font-semibold text-foreground">
              Components (one per line)
            </label>
            <textarea
              id="edit-dev-components"
              rows={2}
              value={componentsText}
              onChange={(e) => setComponentsText(e.target.value)}
              className="w-full rounded-md border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8.5 px-3 text-xs cursor-pointer"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-8.5 px-4 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-sm"
            >
              {isSubmitting ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
