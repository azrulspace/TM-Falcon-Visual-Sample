import { formatAbsoluteMYT } from '@/lib/dateTime';

/**
 * Synthetic Canvas Stream Generator for Live Preview.
 * Creates a 1280x720 15fps MediaStream with animated control-room scene,
 * burned-in OSD text (real MYT clock, camera name, telemetry),
 * and interactive pan, tilt, and zoom transformations.
 */

export interface PreviewStreamController {
  stream: MediaStream;
  canvas: HTMLCanvasElement;
  updatePtz: (panOffset: { x: number; y: number }, zoomFactor: number) => void;
  captureSnapshot: () => string; // returns data URL
  destroy: () => void;
}

export interface PreviewCameraInfo {
  identifier: string;
  name?: string;
  installedPoleId?: string | null;
  siteName?: string | null;
  isMobileData?: boolean;
}

export function createPreviewCanvasStream(camera: PreviewCameraInfo): PreviewStreamController {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d', { alpha: false });

  let animationFrameId: number;
  let panX = 0; // -300 to +300
  let panY = 0; // -200 to +200
  let zoom = 1.0; // 1.0 to 4.0
  let isDestroyed = false;

  let tick = 0;

  function render() {
    if (isDestroyed || !ctx) return;
    tick += 1;

    // 1. Dark neutral surveillance control room backdrop (#08090A - #161718)
    ctx.fillStyle = '#0a0c0e';
    ctx.fillRect(0, 0, 1280, 720);

    ctx.save();
    // Center of canvas
    ctx.translate(640, 360);
    ctx.scale(zoom, zoom);
    ctx.translate(-640 + panX, -360 + panY);

    // 2. Control-room grid (Neutral dark lines)
    ctx.strokeStyle = '#1b1f24';
    ctx.lineWidth = 1;
    for (let x = -600; x <= 1880; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, -400);
      ctx.lineTo(x, 1120);
      ctx.stroke();
    }
    for (let y = -400; y <= 1120; y += 80) {
      ctx.beginPath();
      ctx.moveTo(-600, y);
      ctx.lineTo(1880, y);
      ctx.stroke();
    }

    // 3. Subtle slow sweeping radar line to clearly verify live frame motion
    const sweepAngle = (tick * 0.02) % (Math.PI * 2);
    ctx.save();
    ctx.translate(640, 360);
    ctx.strokeStyle = '#2a313a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 240, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(sweepAngle) * 240, Math.sin(sweepAngle) * 240);
    ctx.stroke();
    ctx.restore();

    // 4. Simulated telecom infrastructure silhouettes (Pole, cables, junction box)
    ctx.strokeStyle = '#383f49';
    ctx.fillStyle = '#1c2128';
    ctx.lineWidth = 3;

    // Pole structure in center
    ctx.fillRect(625, 180, 30, 380);
    ctx.strokeRect(625, 180, 30, 380);

    // Crossarm
    ctx.fillRect(520, 220, 240, 14);
    ctx.strokeRect(520, 220, 240, 14);

    // Transformer box
    ctx.fillRect(665, 270, 70, 90);
    ctx.strokeRect(665, 270, 70, 90);

    // Hanging cable catenary curves
    ctx.beginPath();
    ctx.moveTo(-200, 220);
    ctx.quadraticCurveTo(240, 310, 520, 226);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(760, 226);
    ctx.quadraticCurveTo(1040, 310, 1480, 220);
    ctx.stroke();

    // Subtle moving indicator light on pole (green heartbeat)
    const pulseOpacity = (Math.sin(tick * 0.1) + 1) / 2;
    ctx.fillStyle = `rgba(16, 185, 129, ${0.4 + pulseOpacity * 0.6})`;
    ctx.beginPath();
    ctx.arc(640, 210, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 5. Burned-In On-Screen Display (OSD) Text (Guaranteed in true camera aspect)
    // OSD uses standard amber surveillance monospaced text (#fcd34d)
    ctx.fillStyle = 'rgba(252, 211, 77, 0.92)';
    ctx.font = '600 15px "JetBrains Mono", "Courier New", monospace';
    ctx.textBaseline = 'top';

    // Top-Left: Live Real Clock in MYT (Ticks every second)
    const now = new Date();
    const mytClock = formatAbsoluteMYT(now, { showSeconds: true });
    ctx.fillText(mytClock, 24, 24);

    // Top-Right: Battery / Mobile data / Resolution
    const topRightInfo = camera.isMobileData ? '[4G 📶 -68dBm · 🔋 94%]' : '[ETH 1000Mbps · 🔌 MAINS]';
    ctx.textAlign = 'right';
    ctx.fillText(topRightInfo, 1280 - 24, 24);

    // Bottom-Left: Camera ID, Name, Pole Location
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    const bottomLine1 = `${camera.identifier} · ${camera.name || 'Surveillance Feed'}`;
    const bottomLine2 = `Pole: ${camera.installedPoleId || 'TGP_P010'} · Site: ${camera.siteName || 'Teluk Panglima Garang'}`;
    ctx.fillText(bottomLine1, 24, 720 - 44);
    ctx.fillStyle = 'rgba(252, 211, 77, 0.75)';
    ctx.font = '500 13px "JetBrains Mono", "Courier New", monospace';
    ctx.fillText(bottomLine2, 24, 720 - 24);

    // Bottom-Right: Camera Preset / OSD Node Tag
    ctx.textAlign = 'right';
    const zoomText = zoom > 1.0 ? `[ZOOM ${zoom.toFixed(1)}x]` : '[WIDE]';
    ctx.fillText(`${zoomText} CH-01`, 1280 - 24, 720 - 24);

    animationFrameId = requestAnimationFrame(render);
  }

  // Start rendering loop
  render();

  // Capture MediaStream at 15 FPS
  const stream = canvas.captureStream ? canvas.captureStream(15) : (canvas as any).mozCaptureStream?.(15);

  return {
    stream,
    canvas,
    updatePtz: (panOffset, zoomFactor) => {
      panX = Math.max(-400, Math.min(400, panOffset.x));
      panY = Math.max(-240, Math.min(240, panOffset.y));
      zoom = Math.max(1.0, Math.min(4.0, zoomFactor));
    },
    captureSnapshot: () => {
      return canvas.toDataURL('image/png');
    },
    destroy: () => {
      isDestroyed = true;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (stream) {
        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      }
    },
  };
}
