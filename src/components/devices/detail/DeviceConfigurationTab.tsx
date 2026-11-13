import React, { useState, useMemo } from 'react';
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Send,
  Eye,
  X,
  History,
  Radio,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useDevices } from '@/contexts/DevicesContext';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';
import type { DeviceRecord } from '@/types/devices';

export interface DeviceConfigurationTabProps {
  device: DeviceRecord;
  onOpenVersionHistory?: () => void;
}

export const DeviceConfigurationTab: React.FC<DeviceConfigurationTabProps> = ({
  device,
  onOpenVersionHistory,
}) => {
  const { updateSettings } = useDevices();
  const { addToast } = useToast();

  const baseSettings: Record<string, any> = useMemo(() => {
    return {
      alarmMessage: 'Spoken text',
      clip: '',
      spokenText: 'Warning. This is a restricted area. Please keep away.',
      voice: 'Male',
      language: 'English',
      alarmVolume: 100,
      playMode: 'Once, in order',
      playTime: 60,
      suddenLoudSound: false,
      loudSoundSensitivity: 50,
      loudSoundThreshold: 50,
      suddenDropInSound: false,
      soundDropSensitivity: 50,
      speakerVolume: 90,
      playbackMode: 'Real time',
      soundProfile: 'Balanced',
      talkMicrophoneVolume: 90,
      ...(device.reportedSettings || device.currentSettings || {}),
    };
  }, [device]);

  // Form working state
  const [form, setForm] = useState<Record<string, any>>(baseSettings);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reason, setReason] = useState('Configuration update from dashboard');
  const [isSending, setIsSending] = useState(false);
  const [recentResult, setRecentResult] = useState<{
    versionLabel: string;
    results: { key: string; label: string; status: 'Applied' | 'Pending' | 'Failed' }[];
  } | null>(null);

  // Compute diff between form and reportedSettings
  const changedKeys = useMemo(() => {
    return Object.keys(form).filter((k) => form[k] !== baseSettings[k]);
  }, [form, baseSettings]);

  const hasChanges = changedKeys.length > 0;

  const handleResetField = (key: string) => {
    setForm((prev) => ({ ...prev, [key]: baseSettings[key] }));
  };

  const handleUndoAll = () => {
    setForm(baseSettings);
    addToast('info', 'Reverted all unsaved changes to device values.');
  };

  const handleSendToDevice = async () => {
    setIsSending(true);
    try {
      const payload: Record<string, any> = {};
      for (const k of changedKeys) {
        payload[k] = form[k];
      }

      const res = await updateSettings(device.identifier, payload, reason);
      if (res.ok) {
        setRecentResult({
          versionLabel: res.versionLabel || 'cfg-1',
          results: changedKeys.map((k) => ({
            key: k,
            label: k,
            status: 'Applied',
          })),
        });
        setReviewDialogOpen(false);
      }
    } finally {
      setIsSending(false);
    }
  };

  const reportedTimestamp = device.reportedSettingsTimestamp || 'Nov 12, 2026, 6:59 AM MYT';

  return (
    <div className="space-y-6 pb-24 select-none">
      {/* 1. Edge Synchronization Notice Banner */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-3">
          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <Radio className="size-4" />
          </div>
          <div className="space-y-0.5">
            <span className="font-semibold text-foreground">
              Edge applies only the settings that changed.
            </span>
            <p className="text-muted-foreground leading-relaxed">
              Reported configuration baseline synchronized from device at {reportedTimestamp}. Changes are validated against OpenAPI schemas.
            </p>
          </div>
        </div>

        {device.configVersions && device.configVersions.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenVersionHistory}
            className="h-8 gap-1.5 text-xs shrink-0 cursor-pointer"
          >
            <History className="size-3.5 text-muted-foreground" />
            <span>Version history ({device.configVersions.length})</span>
          </Button>
        )}
      </div>

      {/* 2. Success Result Banner (if changes just applied) */}
      {recentResult && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-emerald-500">
              <CheckCircle2 className="size-4" />
              <span>Applied configuration version {recentResult.versionLabel}</span>
            </div>
            <button
              type="button"
              onClick={() => setRecentResult(null)}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {recentResult.results.map((r) => (
              <span
                key={r.key}
                className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1"
              >
                <span>{r.label}: Applied</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 3. Form Sections (Grid 2 cols on lg) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Section 1: Alarm Message */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
          <div className="border-b border-border/80 pb-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Alarm message
              </h3>
              <span className="text-[10px] text-muted-foreground">
                Reported at {reportedTimestamp}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              What the speaker plays when an alarm trigger starts.
            </p>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Alarm Message Mode */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="cfg-alarm-msg" className="font-semibold text-foreground">
                  Alarm message
                </label>
                {form.alarmMessage !== baseSettings.alarmMessage && (
                  <button
                    type="button"
                    onClick={() => handleResetField('alarmMessage')}
                    className="text-[10px] text-primary flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <RotateCcw className="size-2.5" />
                    <span>Reset to &ldquo;{baseSettings.alarmMessage}&rdquo;</span>
                  </button>
                )}
              </div>
              <select
                id="cfg-alarm-msg"
                value={form.alarmMessage}
                onChange={(e) => setForm({ ...form, alarmMessage: e.target.value })}
                className="w-full h-8.5 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="Spoken text">Spoken text</option>
                <option value="Stored clip">Stored clip</option>
                <option value="None">None</option>
              </select>
            </div>

            {/* Clip (dependent on Stored clip) */}
            <div className={cn('space-y-1', form.alarmMessage !== 'Stored clip' && 'opacity-50')}>
              <label htmlFor="cfg-clip" className="font-semibold text-foreground">
                Clip
              </label>
              <select
                id="cfg-clip"
                disabled={form.alarmMessage !== 'Stored clip'}
                value={form.clip}
                onChange={(e) => setForm({ ...form, clip: e.target.value })}
                className="w-full h-8.5 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed"
              >
                <option value="">Choose a value</option>
                <option value="Siren 1">Siren 1 (Warning)</option>
                <option value="Chime 1">Chime 1 (Attention)</option>
                <option value="Voice Alert 1">Voice Alert 1</option>
              </select>
              <p className="text-[11px] text-muted-foreground">
                Applies when Alarm message is Stored clip.
              </p>
            </div>

            {/* Spoken text (dependent on Spoken text) */}
            <div className={cn('space-y-1', form.alarmMessage !== 'Spoken text' && 'opacity-50')}>
              <div className="flex items-center justify-between">
                <label htmlFor="cfg-spoken-text" className="font-semibold text-foreground">
                  Spoken text
                </label>
                {form.spokenText !== baseSettings.spokenText && (
                  <button
                    type="button"
                    onClick={() => handleResetField('spokenText')}
                    className="text-[10px] text-primary flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <RotateCcw className="size-2.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
              <input
                id="cfg-spoken-text"
                type="text"
                disabled={form.alarmMessage !== 'Spoken text'}
                value={form.spokenText}
                onChange={(e) => setForm({ ...form, spokenText: e.target.value })}
                className="w-full h-8.5 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed"
              />
              <p className="text-[11px] text-muted-foreground">
                Synthesized by on-device text-to-speech engine.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Voice */}
              <div className="space-y-1">
                <label htmlFor="cfg-voice" className="font-semibold text-foreground">
                  Voice
                </label>
                <select
                  id="cfg-voice"
                  value={form.voice}
                  onChange={(e) => setForm({ ...form, voice: e.target.value })}
                  className="w-full h-8.5 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              {/* Language */}
              <div className="space-y-1">
                <label htmlFor="cfg-lang" className="font-semibold text-foreground">
                  Language
                </label>
                <select
                  id="cfg-lang"
                  value={form.language}
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                  className="w-full h-8.5 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="English">English</option>
                  <option value="Malay">Malay</option>
                </select>
              </div>
            </div>

            {/* Alarm Volume: 0 to 200 */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between">
                <label htmlFor="cfg-alarm-vol" className="font-semibold text-foreground">
                  Alarm volume
                </label>
                <span className="font-mono text-xs font-bold text-foreground">
                  {form.alarmVolume} / 200
                </span>
              </div>
              <input
                id="cfg-alarm-vol"
                type="number"
                min={0}
                max={200}
                value={form.alarmVolume}
                onChange={(e) => setForm({ ...form, alarmVolume: Number(e.target.value) })}
                className="w-full h-8.5 rounded-md border border-border bg-background px-2.5 font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Scale: 0 to 200</span>
                {form.alarmVolume > 100 && (
                  <span className="text-amber-500 font-medium flex items-center gap-1">
                    <AlertTriangle className="size-3" />
                    <span>Above 100 the alarm is louder than the speaker</span>
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Play Mode */}
              <div className="space-y-1">
                <label htmlFor="cfg-play-mode" className="font-semibold text-foreground">
                  Playback mode
                </label>
                <select
                  id="cfg-play-mode"
                  value={form.playMode}
                  onChange={(e) => setForm({ ...form, playMode: e.target.value })}
                  className="w-full h-8.5 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="Once, in order">Once, in order</option>
                  <option value="Loop">Loop continuous</option>
                </select>
              </div>

              {/* Play Time */}
              <div className="space-y-1">
                <label htmlFor="cfg-play-time" className="font-semibold text-foreground">
                  Play duration (s)
                </label>
                <input
                  id="cfg-play-time"
                  type="number"
                  min={1}
                  max={86399}
                  value={form.playTime}
                  onChange={(e) => setForm({ ...form, playTime: Number(e.target.value) })}
                  className="w-full h-8.5 rounded-md border border-border bg-background px-2.5 font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Sound Detection */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
          <div className="border-b border-border/80 pb-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Sound detection
              </h3>
              <span className="text-[10px] text-muted-foreground">
                Reported at {reportedTimestamp}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Audio thresholds that trigger an automatic speaker alarm.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Sudden Loud Sound */}
            <div className="rounded-lg border border-border/80 p-3 bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-foreground block">
                    Sudden loud sound
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Triggers alarm on high decibel spike
                  </span>
                </div>
                <Switch
                  checked={form.suddenLoudSound}
                  onCheckedChange={(checked) => setForm({ ...form, suddenLoudSound: checked })}
                />
              </div>

              <div className={cn('grid grid-cols-2 gap-3 pt-1', !form.suddenLoudSound && 'opacity-40')}>
                <div>
                  <label htmlFor="cfg-loud-sens" className="text-[11px] text-muted-foreground block mb-1">
                    Sensitivity (1–100)
                  </label>
                  <input
                    id="cfg-loud-sens"
                    type="number"
                    min={1}
                    max={100}
                    disabled={!form.suddenLoudSound}
                    value={form.loudSoundSensitivity}
                    onChange={(e) => setForm({ ...form, loudSoundSensitivity: Number(e.target.value) })}
                    className="w-full h-8 rounded-md border border-border bg-background px-2 font-mono text-xs text-foreground disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label htmlFor="cfg-loud-thresh" className="text-[11px] text-muted-foreground block mb-1">
                    Threshold (1–100)
                  </label>
                  <input
                    id="cfg-loud-thresh"
                    type="number"
                    min={1}
                    max={100}
                    disabled={!form.suddenLoudSound}
                    value={form.loudSoundThreshold}
                    onChange={(e) => setForm({ ...form, loudSoundThreshold: Number(e.target.value) })}
                    className="w-full h-8 rounded-md border border-border bg-background px-2 font-mono text-xs text-foreground disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Sudden Drop in Sound */}
            <div className="rounded-lg border border-border/80 p-3 bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-foreground block">
                    Sudden drop in sound
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Triggers on background noise cessation
                  </span>
                </div>
                <Switch
                  checked={form.suddenDropInSound}
                  onCheckedChange={(checked) => setForm({ ...form, suddenDropInSound: checked })}
                />
              </div>

              <div className={cn('pt-1', !form.suddenDropInSound && 'opacity-40')}>
                <label htmlFor="cfg-drop-sens" className="text-[11px] text-muted-foreground block mb-1">
                  Sensitivity (0–100)
                </label>
                <input
                  id="cfg-drop-sens"
                  type="number"
                  min={0}
                  max={100}
                  disabled={!form.suddenDropInSound}
                  value={form.soundDropSensitivity}
                  onChange={(e) => setForm({ ...form, soundDropSensitivity: Number(e.target.value) })}
                  className="w-full h-8 rounded-md border border-border bg-background px-2 font-mono text-xs text-foreground disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Speaker Output */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
          <div className="border-b border-border/80 pb-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Speaker output
              </h3>
              <span className="text-[10px] text-muted-foreground">
                Reported at {reportedTimestamp}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              The loudness and acoustic acoustics of the physical horn.
            </p>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Speaker Volume: 0 to 100% */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="cfg-spk-vol" className="font-semibold text-foreground">
                  Speaker volume
                </label>
                <span className="font-mono text-xs font-bold text-foreground">
                  {form.speakerVolume}%
                </span>
              </div>
              <input
                id="cfg-spk-vol"
                type="number"
                min={0}
                max={100}
                value={form.speakerVolume}
                onChange={(e) => setForm({ ...form, speakerVolume: Number(e.target.value) })}
                className="w-full h-8.5 rounded-md border border-border bg-background px-2.5 font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <p className="text-[11px] text-muted-foreground">
                Range: 0 to 100 percent.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Playback Mode */}
              <div className="space-y-1">
                <label htmlFor="cfg-playback-mode" className="font-semibold text-foreground">
                  Playback mode
                </label>
                <select
                  id="cfg-playback-mode"
                  value={form.playbackMode}
                  onChange={(e) => setForm({ ...form, playbackMode: e.target.value })}
                  className="w-full h-8.5 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="Real time">Real time</option>
                  <option value="Buffer">Buffer</option>
                </select>
              </div>

              {/* Sound Profile */}
              <div className="space-y-1">
                <label htmlFor="cfg-sound-profile" className="font-semibold text-foreground">
                  Sound profile
                </label>
                <select
                  id="cfg-sound-profile"
                  value={form.soundProfile}
                  onChange={(e) => setForm({ ...form, soundProfile: e.target.value })}
                  className="w-full h-8.5 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="Balanced">Balanced</option>
                  <option value="Clarity">Clarity</option>
                  <option value="Bass">Bass</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Two-way Audio */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
          <div className="border-b border-border/80 pb-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Two-way audio
              </h3>
              <span className="text-[10px] text-muted-foreground">
                Reported at {reportedTimestamp}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Microphone talkback gain and intercom settings.
            </p>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Talk Microphone Volume */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="cfg-mic-vol" className="font-semibold text-foreground">
                  Talk microphone volume
                </label>
                <span className="font-mono text-xs font-bold text-foreground">
                  {form.talkMicrophoneVolume}%
                </span>
              </div>
              <input
                id="cfg-mic-vol"
                type="number"
                min={0}
                max={100}
                value={form.talkMicrophoneVolume}
                onChange={(e) => setForm({ ...form, talkMicrophoneVolume: Number(e.target.value) })}
                className="w-full h-8.5 rounded-md border border-border bg-background px-2.5 font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <p className="text-[11px] text-muted-foreground">
                Gain: 0 to 100 percent.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Sticky Bottom Action Bar (Never covers fields due to pb-24) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border shadow-2xl p-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            {hasChanges ? (
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary animate-pulse" />
                <span>{changedKeys.length} settings changed</span>
              </span>
            ) : (
              <span className="text-muted-foreground">
                No setting changed.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {hasChanges && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUndoAll}
                  className="h-8.5 px-3 text-xs gap-1 cursor-pointer"
                >
                  <RotateCcw className="size-3" />
                  <span>Undo changes</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReviewDialogOpen(true)}
                  className="h-8.5 px-3 text-xs gap-1 cursor-pointer border-primary/30 text-primary"
                >
                  <Eye className="size-3" />
                  <span>Review changes</span>
                </Button>
              </>
            )}

            <Button
              size="sm"
              disabled={!hasChanges}
              onClick={() => setReviewDialogOpen(true)}
              className="h-8.5 px-4 text-xs gap-1.5 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 cursor-pointer shadow-sm"
            >
              <Send className="size-3" />
              <span>Send to device</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 5. Review & Confirmation Dialog */}
      {reviewDialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none"
          onClick={() => setReviewDialogOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="size-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">
                  Review configuration changes
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewDialogOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-muted-foreground">
                You are sending changes to <strong className="font-mono text-foreground">{device.identifier}</strong> (mounted on {device.installedOnPoleId || 'Not installed'}).
              </p>

              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-muted/40 border-b border-border text-[11px] font-semibold text-muted-foreground">
                    <tr>
                      <th className="py-2 px-3">Setting</th>
                      <th className="py-2 px-3">Device Value</th>
                      <th className="py-2 px-3">New Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-mono text-[11px]">
                    {changedKeys.map((k) => (
                      <tr key={k}>
                        <td className="py-2 px-3 font-sans text-foreground font-medium">
                          {k}
                        </td>
                        <td className="py-2 px-3 text-rose-500 line-through">
                          {String(baseSettings[k]) || '—'}
                        </td>
                        <td className="py-2 px-3 text-emerald-500 font-bold">
                          {String(form[k]) || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-1.5 pt-2">
                <label
                  htmlFor="cfg-change-reason"
                  className="font-semibold text-foreground flex items-center justify-between"
                >
                  <span>Reason for change</span>
                  <span className="text-[10px] text-muted-foreground">Optional</span>
                </label>
                <input
                  id="cfg-change-reason"
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Nighttime volume adjustment"
                  className="w-full h-8.5 rounded-md border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReviewDialogOpen(false)}
                className="h-8.5 px-3 text-xs cursor-pointer"
              >
                Cancel
              </Button>

              <Button
                size="sm"
                disabled={isSending}
                onClick={handleSendToDevice}
                className="h-8.5 px-4 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-sm"
              >
                {isSending ? 'Sending to device...' : 'Send to device'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
