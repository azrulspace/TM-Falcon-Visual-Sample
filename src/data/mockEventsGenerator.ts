/**
 * Generates an SVG Data URI for realistic surveillance snapshot frames.
 */
export function generateSnapshotSvg(
  eventId: string,
  type: string,
  device: string,
  timestamp: string,
  frameIndex = 1
): string {
  const isMonkey = type.toLowerCase().includes('monkey');
  const isVegetation = type.toLowerCase().includes('vegetation');
  const isVehicle = type.toLowerCase().includes('vehicle');
  const isPower = type.toLowerCase().includes('power') || type.toLowerCase().includes('fault');
  const isCable = type.toLowerCase().includes('cable');

  // Accent color for detection box
  let boxColor = '#f97316'; // orange default
  if (isMonkey) boxColor = '#ef4444'; // red
  else if (isVegetation) boxColor = '#10b981'; // green
  else if (isVehicle) boxColor = '#fbbf24'; // amber
  else if (isPower) boxColor = '#f59e0b'; // amber
  else if (isCable) boxColor = '#38bdf8'; // blue

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="100%" height="100%">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#070c14" />
        <stop offset="50%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="#090e17" />
      </linearGradient>
      <linearGradient id="glow" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${boxColor}" stop-opacity="0.2" />
        <stop offset="100%" stop-color="${boxColor}" stop-opacity="0.0" />
      </linearGradient>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1" />
      </pattern>
    </defs>
    <!-- Background -->
    <rect width="640" height="360" fill="url(#bg)" />
    <rect width="640" height="360" fill="url(#grid)" />

    <!-- Simulated telemetry horizon and optical lines -->
    <line x1="0" y1="220" x2="640" y2="220" stroke="rgba(56,189,248,0.15)" stroke-width="1" stroke-dasharray="8 4" />
    <line x1="320" y1="0" x2="320" y2="360" stroke="rgba(56,189,248,0.1)" stroke-width="1" stroke-dasharray="8 4" />

    <!-- Optical perspective cable span -->
    <path d="M 0 160 Q 320 280 640 180" fill="none" stroke="rgba(148,163,184,0.3)" stroke-width="3" />
    <path d="M 0 150 Q 320 270 640 170" fill="none" stroke="rgba(148,163,184,0.2)" stroke-width="2" stroke-dasharray="4 2" />

    <!-- Target Bounding Box -->
    <rect x="${220 + frameIndex * 15}" y="${140 + frameIndex * 5}" width="160" height="110" rx="4" fill="url(#glow)" stroke="${boxColor}" stroke-width="2" />
    <!-- Corner brackets -->
    <path d="M ${215 + frameIndex * 15} ${150 + frameIndex * 5} L ${215 + frameIndex * 15} ${135 + frameIndex * 5} L ${230 + frameIndex * 15} ${135 + frameIndex * 5}" fill="none" stroke="${boxColor}" stroke-width="3" />
    <path d="M ${365 + frameIndex * 15} ${135 + frameIndex * 5} L ${385 + frameIndex * 15} ${135 + frameIndex * 5} L ${385 + frameIndex * 15} ${150 + frameIndex * 5}" fill="none" stroke="${boxColor}" stroke-width="3" />
    <path d="M ${215 + frameIndex * 15} ${240 + frameIndex * 5} L ${215 + frameIndex * 15} ${255 + frameIndex * 5} L ${230 + frameIndex * 15} ${255 + frameIndex * 5}" fill="none" stroke="${boxColor}" stroke-width="3" />
    <path d="M ${385 + frameIndex * 15} ${240 + frameIndex * 5} L ${385 + frameIndex * 15} ${255 + frameIndex * 5} L ${365 + frameIndex * 15} ${255 + frameIndex * 5}" fill="none" stroke="${boxColor}" stroke-width="3" />

    <!-- Detection Tag Badge -->
    <rect x="${220 + frameIndex * 15}" y="${118 + frameIndex * 5}" width="140" height="18" rx="2" fill="${boxColor}" />
    <text x="${225 + frameIndex * 15}" y="${131 + frameIndex * 5}" fill="#ffffff" font-size="10" font-family="monospace" font-weight="bold">${type.slice(0, 16)} 94%</text>

    <!-- Top Left Camera Status Banner -->
    <rect x="16" y="14" width="220" height="24" rx="4" fill="rgba(15,23,42,0.8)" stroke="rgba(255,255,255,0.1)" />
    <circle cx="28" cy="26" r="4" fill="#ef4444" />
    <text x="38" y="29" fill="#e2e8f0" font-size="11" font-family="monospace" font-weight="600">REC  ${device} • F#0${frameIndex}</text>

    <!-- Top Right Battery & Telemetry -->
    <rect x="520" y="14" width="104" height="24" rx="4" fill="rgba(15,23,42,0.8)" stroke="rgba(255,255,255,0.1)" />
    <text x="532" y="29" fill="#94a3b8" font-size="10" font-family="monospace">1080p 60fps</text>

    <!-- Bottom Left Timestamp Overlay (MYT) -->
    <rect x="16" y="322" width="230" height="22" rx="3" fill="rgba(0,0,0,0.7)" />
    <text x="24" y="337" fill="#f8fafc" font-size="11" font-family="monospace">${timestamp} MYT</text>

    <!-- Bottom Right Watermark & ID -->
    <rect x="460" y="322" width="164" height="22" rx="3" fill="rgba(0,0,0,0.7)" />
    <text x="470" y="337" fill="#38bdf8" font-size="11" font-family="monospace">${eventId} • TM FALCON</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
