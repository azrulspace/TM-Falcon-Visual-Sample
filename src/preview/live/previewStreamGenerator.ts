import { formatAbsoluteMYT } from '@/lib/dateTime';

/**
 * Synthetic Canvas Stream Generator for Live Preview & Demo Mode.
 * Creates a 1280x720 15fps MediaStream with animated control-room scene or real monkey-fiber footage,
 * burned-in OSD text (real MYT clock, camera name, telemetry, demo stream tag),
 * and interactive pan, tilt, and zoom transformations.
 */

export interface PreviewStreamController {
  stream: MediaStream;
  canvas: HTMLCanvasElement;
  updatePtz: (panOffset: { x: number; y: number }, zoomFactor: number) => void;
  captureSnapshot: () => string; // returns data URL
  setPaused: (paused: boolean) => void;
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

  let animationFrameId: number | null = null;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let panX = 0; // -300 to +300
  let panY = 0; // -200 to +200
  let zoom = 1.0; // 1.0 to 4.0
  let isDestroyed = false;
  let isPaused = false;

  let tick = 0;

  // Load wildlife telecommunications backdrop for DEV-001
  let bgImg: HTMLImageElement | null = null;
  let isImgLoaded = false;
  if (camera.identifier === 'DEV-001') {
    bgImg = new Image();
    bgImg.src = '/monkey-fiber.jpg';
    bgImg.onload = () => {
      isImgLoaded = true;
    };
    if (bgImg.complete) {
      isImgLoaded = true;
    }
  }

  function render() {
    if (isDestroyed || !ctx) return;
    if (!isPaused) {
      tick += 1;
    }

    // 1. Dark neutral surveillance background
    ctx.fillStyle = '#0a0c0e';
    ctx.fillRect(0, 0, 1280, 720);

    ctx.save();
    // Center of canvas
    ctx.translate(640, 360);
    ctx.scale(zoom, zoom);

    // Subtle natural camera sway drift on live pole
    const driftX = !isPaused ? Math.sin(tick * 0.02) * 4 : 0;
    const driftY = !isPaused ? Math.cos(tick * 0.015) * 2.5 : 0;
    ctx.translate(-640 + panX + driftX, -360 + panY + driftY);

    if (bgImg && isImgLoaded) {
      // 2A. Real wildlife & fiber optic cable footage
      ctx.drawImage(bgImg, 0, 0, 1280, 720);

      // Subtle live scanline effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      for (let y = 0; y < 720; y += 4) {
        ctx.fillRect(0, y, 1280, 1.5);
      }
    } else {
      // 2B. Simulated telecom infrastructure silhouettes
      // Grid lines
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

      // Sweeping radar scan line
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

      // Pole structure in center
      ctx.fillStyle = '#1c2128';
      ctx.strokeStyle = '#383f49';
      ctx.lineWidth = 3;
      ctx.fillRect(625, 180, 30, 380);
      ctx.strokeRect(625, 180, 30, 380);

      // Crossarm
      ctx.fillRect(520, 220, 240, 14);
      ctx.strokeRect(520, 220, 240, 14);

      // Hanging cable catenary curves
      ctx.beginPath();
      ctx.moveTo(-200, 220);
      ctx.quadraticCurveTo(240, 310, 520, 226);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(760, 226);
      ctx.quadraticCurveTo(1040, 310, 1480, 220);
      ctx.stroke();

      // Green heartbeat indicator light on pole
      const pulseOpacity = (Math.sin(tick * 0.1) + 1) / 2;
      ctx.fillStyle = `rgba(16, 185, 129, ${0.4 + pulseOpacity * 0.6})`;
      ctx.beginPath();
      ctx.arc(640, 210, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // 3. Burned-In On-Screen Display (OSD) Text
    ctx.fillStyle = 'rgba(252, 211, 77, 0.94)';
    ctx.font = '600 15px "JetBrains Mono", "Courier New", monospace';
    ctx.textBaseline = 'top';

    // Top-Left: Live Real Clock in MYT (Ticks every second)
    const now = new Date();
    const mytClock = formatAbsoluteMYT(now, { showSeconds: true });
    ctx.fillText(mytClock, 24, 24);

    // Top-Right: Battery / Mobile data / Demo Stream Watermark
    const topRightInfo = camera.isMobileData
      ? '[4G 📶 -68dBm · 🔋 94%] · [DEMO STREAM]'
      : '[ETH 1000Mbps · 🔌 MAINS] · [DEMO STREAM]';
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
    ctx.fillText(`${zoomText} · 1080p 25fps`, 1280 - 24, 720 - 24);

    // Paused Overlay if playback paused
    if (isPaused) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(0, 0, 1280, 720);
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('VIDEO PAUSED', 640, 360);
    }
  }

  // Start rendering loop with both rAF and reliable interval for headless/background execution
  render();
  intervalId = setInterval(render, 50);

  // Capture MediaStream at 15 FPS
  const stream = canvas.captureStream ? canvas.captureStream(20) : (canvas as any).mozCaptureStream?.(20);

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
    setPaused: (paused: boolean) => {
      isPaused = paused;
    },
    destroy: () => {
      isDestroyed = true;
      if (intervalId) clearInterval(intervalId);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (stream) {
        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      }
    },
  };
}
