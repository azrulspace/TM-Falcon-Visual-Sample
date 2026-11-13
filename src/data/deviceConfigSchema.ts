import type { DeviceRecord, DeviceTypeCategory } from '../types/devices.ts';

export type ConfigFieldControl = 'select' | 'text' | 'textarea' | 'number' | 'toggle';

export interface ConfigDependencyRule {
  fieldKey: string;
  equals: string | boolean | number;
  reasonText: string;
}

export interface ConfigWarningRule {
  check: (val: unknown, allValues: Record<string, unknown>) => boolean;
  message: string;
}

export interface DeviceConfigFieldSchema {
  key: string;
  label: string;
  control: ConfigFieldControl;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  rangeLabel?: string;
  dependsOn?: ConfigDependencyRule;
  warningRule?: ConfigWarningRule;
  placeholder?: string;
}

export interface DeviceConfigSectionSchema {
  id: string;
  title: string;
  description: string;
  fields: DeviceConfigFieldSchema[];
}

export const SPEAKER_CONFIG_SECTIONS: DeviceConfigSectionSchema[] = [
  {
    id: 'alarm_message',
    title: 'Alarm message',
    description: 'What the speaker plays when an alarm starts.',
    fields: [
      {
        key: 'alarm_message_mode',
        label: 'Alarm message',
        control: 'select',
        options: [
          { value: 'Spoken text', label: 'Spoken text' },
          { value: 'Stored clip', label: 'Stored clip' },
        ],
      },
      {
        key: 'alarm_clip',
        label: 'Clip',
        control: 'select',
        options: [
          { value: 'siren_alert_01.wav', label: 'siren_alert_01.wav' },
          { value: 'restricted_zone.wav', label: 'restricted_zone.wav' },
          { value: 'perimeter_breach.wav', label: 'perimeter_breach.wav' },
        ],
        dependsOn: {
          fieldKey: 'alarm_message_mode',
          equals: 'Stored clip',
          reasonText: 'Applies when Alarm message is Stored clip.',
        },
        placeholder: 'Choose a value',
      },
      {
        key: 'spoken_text',
        label: 'Spoken text',
        control: 'textarea',
        dependsOn: {
          fieldKey: 'alarm_message_mode',
          equals: 'Spoken text',
          reasonText: 'Applies when Alarm message is Spoken text.',
        },
        placeholder: 'Enter spoken alert message...',
      },
      {
        key: 'voice',
        label: 'Voice',
        control: 'select',
        options: [
          { value: 'Male', label: 'Male' },
          { value: 'Female', label: 'Female' },
        ],
        dependsOn: {
          fieldKey: 'alarm_message_mode',
          equals: 'Spoken text',
          reasonText: 'Applies when Alarm message is Spoken text.',
        },
      },
      {
        key: 'language',
        label: 'Language',
        control: 'select',
        options: [
          { value: 'English', label: 'English' },
          { value: 'Bahasa Melayu', label: 'Bahasa Melayu' },
          { value: 'Mandarin', label: 'Mandarin' },
        ],
        dependsOn: {
          fieldKey: 'alarm_message_mode',
          equals: 'Spoken text',
          reasonText: 'Applies when Alarm message is Spoken text.',
        },
      },
      {
        key: 'alarm_volume',
        label: 'Alarm volume',
        control: 'number',
        min: 0,
        max: 200,
        step: 1,
        rangeLabel: '0 to 200',
        warningRule: {
          check: (val) => {
            const num = Number(val);
            return !Number.isNaN(num) && num > 100;
          },
          message: 'Above 100 the alarm is louder than the speaker.',
        },
      },
      {
        key: 'play_repeat_count',
        label: 'Repeat count',
        control: 'number',
        min: 0,
        max: 15,
        step: 1,
        rangeLabel: '0 to 15',
      },
      {
        key: 'play_mode',
        label: 'Play mode',
        control: 'select',
        options: [
          { value: 'Once, in order', label: 'Once, in order' },
          { value: 'Loop continuously', label: 'Loop continuously' },
          { value: 'For a time', label: 'For a time' },
        ],
      },
      {
        key: 'play_time_seconds',
        label: 'Play time',
        control: 'number',
        min: 1,
        max: 86399,
        step: 1,
        unit: 's',
        rangeLabel: '1 to 86399 s',
        dependsOn: {
          fieldKey: 'play_mode',
          equals: 'For a time',
          reasonText: 'Applies when Play mode is For a time.',
        },
      },
    ],
  },
  {
    id: 'sound_detection',
    title: 'Sound detection',
    description: 'Sounds that start a speaker alarm.',
    fields: [
      {
        key: 'sudden_loud_sound',
        label: 'Sudden loud sound',
        control: 'toggle',
      },
      {
        key: 'loud_sound_sensitivity',
        label: 'Loud sound sensitivity',
        control: 'number',
        min: 1,
        max: 100,
        step: 1,
        rangeLabel: '1 to 100',
        dependsOn: {
          fieldKey: 'sudden_loud_sound',
          equals: true,
          reasonText: 'Applies when Sudden loud sound is on.',
        },
      },
      {
        key: 'loud_sound_threshold',
        label: 'Loud sound threshold',
        control: 'number',
        min: 1,
        max: 100,
        step: 1,
        rangeLabel: '1 to 100',
        dependsOn: {
          fieldKey: 'sudden_loud_sound',
          equals: true,
          reasonText: 'Applies when Sudden loud sound is on.',
        },
      },
      {
        key: 'sudden_drop_in_sound',
        label: 'Sudden drop in sound',
        control: 'toggle',
      },
      {
        key: 'sound_drop_sensitivity',
        label: 'Sound drop sensitivity',
        control: 'number',
        min: 0,
        max: 100,
        step: 1,
        rangeLabel: '0 to 100',
        dependsOn: {
          fieldKey: 'sudden_drop_in_sound',
          equals: true,
          reasonText: 'Applies when Sudden drop in sound is on.',
        },
      },
    ],
  },
  {
    id: 'speaker_output',
    title: 'Speaker output',
    description: 'The loudness and sound of the speaker.',
    fields: [
      {
        key: 'speaker_volume',
        label: 'Speaker volume',
        control: 'number',
        min: 0,
        max: 100,
        step: 1,
        unit: '%',
        rangeLabel: '0 to 100 %',
      },
      {
        key: 'playback_mode',
        label: 'Playback mode',
        control: 'select',
        options: [
          { value: 'Real time', label: 'Real time' },
          { value: 'Buffered', label: 'Buffered' },
        ],
      },
      {
        key: 'sound_profile',
        label: 'Sound profile',
        control: 'select',
        options: [
          { value: 'Balanced', label: 'Balanced' },
          { value: 'Voice clarity', label: 'Voice clarity' },
          { value: 'Outdoor high gain', label: 'Outdoor high gain' },
        ],
      },
    ],
  },
  {
    id: 'two_way_audio',
    title: 'Two-way audio',
    description: 'Talk through the device.',
    fields: [
      {
        key: 'talk_mic_volume',
        label: 'Talk microphone volume',
        control: 'number',
        min: 0,
        max: 100,
        step: 1,
        unit: '%',
        rangeLabel: '0 to 100 %',
      },
    ],
  },
];

export const CAMERA_CONFIG_SECTIONS: DeviceConfigSectionSchema[] = [
  {
    id: 'video_stream',
    title: 'Video stream',
    description: 'Main stream encoding and frame rate.',
    fields: [
      {
        key: 'stream_resolution',
        label: 'Resolution',
        control: 'select',
        options: [
          { value: '2688x1520', label: '2688 x 1520 (4 MP)' },
          { value: '1920x1080', label: '1920 x 1080 (1080p)' },
          { value: '1280x720', label: '1280 x 720 (720p)' },
        ],
      },
      {
        key: 'frame_rate_fps',
        label: 'Frame rate',
        control: 'number',
        min: 1,
        max: 30,
        step: 1,
        unit: 'fps',
        rangeLabel: '1 to 30 fps',
      },
      {
        key: 'bitrate_kbps',
        label: 'Max bitrate',
        control: 'number',
        min: 256,
        max: 8192,
        step: 128,
        unit: 'kbps',
        rangeLabel: '256 to 8192 kbps',
        warningRule: {
          check: (val) => Number(val) > 4096,
          message: 'High bitrate may saturate cellular backhaul on remote poles.',
        },
      },
    ],
  },
  {
    id: 'detection_analytics',
    title: 'Detection & analytics',
    description: 'Edge AI rules running on the camera.',
    fields: [
      {
        key: 'line_crossing_enabled',
        label: 'Perimeter line crossing',
        control: 'toggle',
      },
      {
        key: 'detection_sensitivity',
        label: 'Detection sensitivity',
        control: 'number',
        min: 1,
        max: 100,
        step: 1,
        rangeLabel: '1 to 100',
        dependsOn: {
          fieldKey: 'line_crossing_enabled',
          equals: true,
          reasonText: 'Applies when Perimeter line crossing is on.',
        },
      },
      {
        key: 'snapshot_on_trigger',
        label: 'Upload snapshot on trigger',
        control: 'toggle',
      },
    ],
  },
];

export const LIDAR_CONFIG_SECTIONS: DeviceConfigSectionSchema[] = [
  {
    id: 'scan_profile',
    title: 'LiDAR scan profile',
    description: 'Point cloud sampling frequency and clearance threshold.',
    fields: [
      {
        key: 'scan_rate_hz',
        label: 'Scan rate',
        control: 'number',
        min: 5,
        max: 20,
        step: 1,
        unit: 'Hz',
        rangeLabel: '5 to 20 Hz',
      },
      {
        key: 'encroachment_distance_m',
        label: 'Encroachment alert distance',
        control: 'number',
        min: 1,
        max: 15,
        step: 0.5,
        unit: 'm',
        rangeLabel: '1 to 15 m',
      },
    ],
  },
];

export const GATEWAY_CONFIG_SECTIONS: DeviceConfigSectionSchema[] = [
  {
    id: 'uplink_telemetry',
    title: 'Gateway uplink & heartbeat',
    description: 'Edge relay interval and cellular failover settings.',
    fields: [
      {
        key: 'heartbeat_interval_s',
        label: 'Heartbeat interval',
        control: 'number',
        min: 15,
        max: 600,
        step: 15,
        unit: 's',
        rangeLabel: '15 to 600 s',
      },
      {
        key: 'cellular_failover',
        label: 'Automatic 4G failover',
        control: 'toggle',
      },
    ],
  },
];

export function getConfigSchemaForDevice(device: Pick<DeviceRecord, 'type' | 'library'>): DeviceConfigSectionSchema[] {
  switch (device.type) {
    case 'Speaker':
      return SPEAKER_CONFIG_SECTIONS;
    case 'Camera':
      return CAMERA_CONFIG_SECTIONS;
    case 'LiDAR sensor':
      return LIDAR_CONFIG_SECTIONS;
    case 'Gateway':
      return GATEWAY_CONFIG_SECTIONS;
    default:
      return CAMERA_CONFIG_SECTIONS;
  }
}

export function getDefaultConfigValuesForType(type: DeviceTypeCategory): Record<string, unknown> {
  if (type === 'Speaker') {
    return {
      alarm_message_mode: 'Spoken text',
      alarm_clip: '',
      spoken_text: 'Warning. This is a restricted area. Please keep away.',
      voice: 'Male',
      language: 'English',
      alarm_volume: 100,
      play_repeat_count: 3,
      play_mode: 'Once, in order',
      play_time_seconds: 60,
      sudden_loud_sound: false,
      loud_sound_sensitivity: 50,
      loud_sound_threshold: 50,
      sudden_drop_in_sound: false,
      sound_drop_sensitivity: 50,
      speaker_volume: 90,
      playback_mode: 'Real time',
      sound_profile: 'Balanced',
      talk_mic_volume: 90,
    };
  }
  if (type === 'LiDAR sensor') {
    return {
      scan_rate_hz: 10,
      encroachment_distance_m: 3.5,
    };
  }
  if (type === 'Gateway') {
    return {
      heartbeat_interval_s: 60,
      cellular_failover: true,
    };
  }
  return {
    stream_resolution: '2688x1520',
    frame_rate_fps: 25,
    bitrate_kbps: 2048,
    line_crossing_enabled: true,
    detection_sensitivity: 75,
    snapshot_on_trigger: true,
  };
}

export function isConfigFieldActive(
  field: DeviceConfigFieldSchema,
  values: Record<string, unknown>
): boolean {
  if (!field.dependsOn) return true;
  return values[field.dependsOn.fieldKey] === field.dependsOn.equals;
}

export function getChangedConfigKeys(
  schema: DeviceConfigSectionSchema[],
  draftValues: Record<string, unknown>,
  baselineValues: Record<string, unknown>
): { key: string; label: string; fromValue: unknown; toValue: unknown }[] {
  const changes: { key: string; label: string; fromValue: unknown; toValue: unknown }[] = [];
  for (const section of schema) {
    for (const field of section.fields) {
      const fromVal = baselineValues[field.key];
      const toVal = draftValues[field.key];
      if (String(fromVal ?? '') !== String(toVal ?? '')) {
        changes.push({
          key: field.key,
          label: field.label,
          fromValue: fromVal,
          toValue: toVal,
        });
      }
    }
  }
  return changes;
}
