export type PlacementSide = 'top' | 'bottom' | 'left' | 'right' | 'center';

export interface ViewportInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface PlacementInput {
  marker: { x: number; y: number };
  popupSize: { width: number; height: number };
  containerSize: { width: number; height: number };
  insets?: Partial<ViewportInsets>;
}

export interface PlacementResult {
  side: PlacementSide;
  x: number;
  y: number;
  tailOffset: number; // offset along the edge where the tail points to the marker
  panNeeded?: { x: number; y: number };
}

const DEFAULT_INSETS: ViewportInsets = {
  top: 16,
  right: 16,
  bottom: 104, // Space for 94px TimeBar + margin
  left: 16,
};

const TAIL_HEIGHT = 10;
const MARKER_RADIUS = 16;

/**
 * Computes the optimal collision-aware position for an anchored map popup.
 * Preferred order: top -> bottom -> right -> left.
 * If unlocated, returns 'center'.
 */
export function computePopupPlacement(input: PlacementInput): PlacementResult {
  const { marker, popupSize, containerSize } = input;
  const insets: ViewportInsets = { ...DEFAULT_INSETS, ...input.insets };

  // Unlocated or off-screen fallback
  if (marker.x <= 0 && marker.y <= 0) {
    return {
      side: 'center',
      x: Math.max(insets.left, (containerSize.width - popupSize.width) / 2),
      y: Math.max(insets.top, (containerSize.height - popupSize.height) / 2),
      tailOffset: popupSize.width / 2,
    };
  }

  // 1. Try 'top' (above marker)
  const topY = marker.y - MARKER_RADIUS - TAIL_HEIGHT - popupSize.height;
  const topFit = topY >= insets.top;

  // 2. Try 'bottom' (below marker)
  const bottomY = marker.y + MARKER_RADIUS + TAIL_HEIGHT;
  const bottomFit = bottomY + popupSize.height <= containerSize.height - insets.bottom;

  let side: PlacementSide = 'top';
  let targetY = topY;

  if (topFit) {
    side = 'top';
    targetY = topY;
  } else if (bottomFit) {
    side = 'bottom';
    targetY = bottomY;
  } else {
    // Pick whichever has more space
    if (marker.y - insets.top > containerSize.height - insets.bottom - marker.y) {
      side = 'top';
      targetY = Math.max(insets.top, topY);
    } else {
      side = 'bottom';
      targetY = Math.min(containerSize.height - insets.bottom - popupSize.height, bottomY);
    }
  }

  // Horizontal clamping
  let targetX = marker.x - popupSize.width / 2;
  const minX = insets.left;
  const maxX = containerSize.width - insets.right - popupSize.width;

  if (targetX < minX) {
    targetX = minX;
  } else if (targetX > maxX) {
    targetX = maxX;
  }

  // Tail offset relative to popup left edge
  const rawTailOffset = marker.x - targetX;
  const tailOffset = Math.max(24, Math.min(popupSize.width - 24, rawTailOffset));

  return {
    side,
    x: Math.round(targetX),
    y: Math.round(targetY),
    tailOffset: Math.round(tailOffset),
  };
}
