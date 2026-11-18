import type { UserRole } from '@/lib/permissions';

export type LiveStreamState =
  | 'idle'
  | 'connecting'
  | 'live'
  | 'reconnecting'
  | 'failed'
  | 'stopped';

export type LiveFailureVariant =
  | 'camera_offline'
  | 'vendor_unknown'
  | 'edge_timeout'
  | 'no_permission'
  | 'stream_unsupported'
  | 'unknown';

export interface LiveStreamStats {
  resolution: string;
  bitrateMbps: number;
  latencyMs: number;
  fps: number;
  elapsedSeconds: number;
  estimatedDataMb: number;
}

export type PtzDirection =
  | 'pan_left'
  | 'pan_right'
  | 'tilt_up'
  | 'tilt_down'
  | 'zoom_in'
  | 'zoom_out';

export type TalkPreconditionState =
  | 'ready'
  | 'blocked_https'
  | 'blocked_mic';

export interface LiveSessionAuditRecord {
  id: string;
  deviceId: string;
  cameraName: string;
  user: string;
  role: UserRole;
  startedAt: string;
  stoppedAt: string | null;
  durationSeconds: number;
  stopReason:
    | 'user_stopped'
    | 'camera_switched'
    | 'page_hidden'
    | 'inactivity'
    | 'page_unmount'
    | 'tab_closed'
    | 'connection_lost';
  estimatedDataMb: number;
}

export interface LiveCameraCapabilities {
  supportsVideo: boolean;
  supportsAudio: boolean;
  supportsTalk: boolean;
  supportsPtz: boolean;
  supportsPresets: boolean;
  supportsZoom: boolean;
  isMobileData: boolean;
}
