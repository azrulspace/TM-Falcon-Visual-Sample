import React from 'react';
import type { CaseWithSourceEvent } from '@/types/cases';
import { EvidenceViewer } from '@/components/evidence/EvidenceViewer';
import { devices } from '@/data/devices';

export interface CaseEvidenceCardProps {
  caseData: CaseWithSourceEvent;
}

export const CaseEvidenceCard: React.FC<CaseEvidenceCardProps> = ({ caseData }) => {
  const event = caseData.sourceEvent;

  // Resolve device status truthfully from devices registry
  const deviceId = event?.device;
  const dev = deviceId
    ? devices.find((d) => d.id === deviceId || d.id === deviceId.replace('-', '_'))
    : null;
  const deviceIsOnline = dev ? dev.status === 'online' : false;

  // Snapshot asset: use event snapshots or default to canonical case evidence asset
  const snapshots = event?.snapshots && event.snapshots.length > 0
    ? event.snapshots
    : [caseData.id === 'CAS-0007' ? '/case-evidence-0007.png' : '/monkey-fiber.jpg'];

  const rawCaptured = event?.captured || caseData.createdAt;
  const capturedMYT = rawCaptured.includes('MYT') ? rawCaptured : `${rawCaptured} MYT`;

  return (
    <div className="rounded-xl overflow-hidden">
      <EvidenceViewer
        eventId={caseData.sourceEventId || caseData.id}
        snapshots={snapshots}
        capturedTimeMYT={capturedMYT}
        channelName={deviceId || 'CCTV-01'}
        detectionRule={event?.detection || event?.ruleCode || event?.type || 'Motion Detection'}
        deviceIsOnline={deviceIsOnline}
        deviceSupportsVideo={true}
        cameraTimestampFootnote="Camera timestamp 16:06:22 (1h clock offset from captured time)"
        initialTab="snapshot"
      />
    </div>
  );
};
