/**
 * Staging V1 Token Crosswalk & Mapping Module
 *
 * Maps Antigravity design tokens to the Staging V1 palette (Navy surfaces, Indigo accents)
 * to verify strict palette independence. No hardcoded colors should ever bypass these tokens.
 */

export interface PaletteMapping {
  // Surfaces
  background: string;
  card: string;
  cardElevated: string;
  muted: string;
  stageBackground: string;

  // Borders
  border: string;
  borderSecondary: string;

  // Typography Levels
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textDisabled: string;

  // Brand / Primary
  primary: string;
  primaryHover: string;
  primaryForeground: string;

  // Status & Severity
  severityCritical: string;
  severityHigh: string;
  severityMedium: string;
  severityLow: string;
  statusOnline: string;
  statusOffline: string;
}

/**
 * Canonical Staging V1 Palette (Navy surfaces, Indigo accents)
 */
export const STAGING_V1_PALETTE: PaletteMapping = {
  background: '#0c1322',      // Deep navy canvas
  card: '#131b2e',            // Dark navy card surface
  cardElevated: '#1a243c',    // Elevated card surface / popover
  muted: '#182238',           // Subtle navy hover / inactive tile
  stageBackground: '#070a10', // Pitch neutral canvas for evidence stage

  border: '#23304e',          // Slate navy border
  borderSecondary: '#2d3d63', // Slightly lighter divider

  textPrimary: '#ffffff',     // Pure white (Paper)
  textSecondary: '#cbd5e1',   // Light slate (Mist, ~11.5:1 on card)
  textTertiary: '#94a3b8',    // Muted slate (Fog, ~6.8:1 on card, meets AA)
  textDisabled: '#64748b',    // Slate 500 (Ash, placeholders & disabled only)

  primary: '#4361ee',         // Staging V1 royal indigo
  primaryHover: '#3b54d6',
  primaryForeground: '#ffffff',

  severityCritical: '#ef4444',
  severityHigh: '#f97316',
  severityMedium: '#f59e0b',
  severityLow: '#3b82f6',
  statusOnline: '#10b981',
  statusOffline: '#ef4444',
};

/**
 * Current Antigravity Tokens (Carbon/Void neutrals, Brand purple/blue accent)
 */
export const ANTIGRAVITY_V2_PALETTE: PaletteMapping = {
  background: '#08090a',      // Void canvas
  card: '#0f1011',            // Carbon card surface
  cardElevated: '#161718',    // Obsidian surface
  muted: '#1c1e22',           // Graphite muted
  stageBackground: '#08090a', // Canvas neutral black

  border: '#23252a',          // Graphite border
  borderSecondary: '#383b3f', // Smoke divider

  textPrimary: '#ffffff',     // Paper
  textSecondary: '#d0d6e0',   // Mist (~12:1)
  textTertiary: '#8a8f98',    // Fog (~5.9:1, meets AA)
  textDisabled: '#62666d',    // Ash (disabled/placeholders only)

  primary: '#3b82f6',         // Brand blue
  primaryHover: '#2563eb',
  primaryForeground: '#ffffff',

  severityCritical: '#ef4444',
  severityHigh: '#f97316',
  severityMedium: '#eab308',
  severityLow: '#3b82f6',
  statusOnline: '#10b981',
  statusOffline: '#ef4444',
};

/**
 * Standard Design System Primitives & Token Classes
 */
export const DETAIL_TOKENS = {
  // Type Scale (Strict: 24, 14, 12px only)
  type: {
    pageTitle: 'text-2xl font-bold tracking-tight text-foreground',
    cardTitle: 'text-sm font-semibold text-foreground',
    bodyText: 'text-xs text-foreground',
    bodyTextSecondary: 'text-xs text-foreground/80',
    label: 'text-xs font-normal text-muted-foreground',
    caption: 'text-xs text-muted-foreground',
    monoId: 'font-mono text-xs font-semibold',
  },

  // Spacing Scale (Strict: multiples of 4px)
  spacing: {
    pagePadding: 'px-6 2xl:px-8 py-6',
    columnGap: 'gap-6',
    stackedCardGap: 'gap-4',
    cardBodyPadding: 'p-5',
    cardHeaderPadding: 'px-4 h-12',
    rowHeight: 'min-h-[44px]',
  },

  // Radii Scale (Strict: 6, 8, 12, full)
  radius: {
    chip: 'rounded-md',      // 6px
    button: 'rounded-lg',    // 8px
    tile: 'rounded-lg',      // 8px
    card: 'rounded-xl',      // 12px
    full: 'rounded-full',    // 9999px
  },

  // Icon Specifications (Strict: 16px controls/rows, 20px tiles/empty, stroke 1.5, currentColor)
  icon: {
    control: 'size-4 stroke-[1.5] shrink-0',
    tile: 'size-5 stroke-[1.5] shrink-0',
    chip: 'size-3 stroke-[1.5] shrink-0',
  },

  // Focus Ring
  focusRing: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',

  // Shared Card Anatomy
  card: {
    shell: 'flex flex-col rounded-xl border border-border bg-card shadow-xs overflow-hidden',
    header: 'h-12 px-4 flex items-center justify-between border-b border-border bg-muted/20 select-none',
    headerTitle: 'text-sm font-semibold text-foreground flex items-center gap-2',
    body: 'p-5 flex flex-col text-xs',
  },

  // Shared Chip Anatomy (height 24px, px-2, 12/16 medium)
  chip: {
    base: 'h-6 px-2 rounded-md text-xs font-medium inline-flex items-center gap-1.5 shrink-0 select-none border',
    neutral: 'bg-muted/40 text-muted-foreground border-border',
    primary: 'bg-primary/10 text-primary border-primary/20',
  },

  // Definition Row Anatomy (44px height, 1px divider, label left, value right)
  row: {
    container: 'flex items-center justify-between min-h-[44px] py-2 border-b border-border last:border-b-0 text-xs',
    label: 'text-xs text-muted-foreground font-normal shrink-0',
    value: 'text-xs text-foreground font-medium flex items-center gap-2 text-right',
  },
} as const;

/**
 * Runtime Theme Switcher for Staging V1 dual-palette verification
 */
export function applyStagingV1Theme(enable: boolean) {
  const root = document.documentElement;
  const STYLE_ID = 'staging-v1-palette-override';

  let styleTag = document.getElementById(STYLE_ID) as HTMLStyleElement | null;

  if (!enable) {
    if (styleTag) styleTag.remove();
    root.classList.remove('staging-v1-active');
    return;
  }

  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = STYLE_ID;
    document.head.appendChild(styleTag);
  }

  styleTag.textContent = `
    .staging-v1-active,
    .staging-v1-active.dark,
    [data-palette="staging-v1"] {
      --background: ${STAGING_V1_PALETTE.background};
      --card: ${STAGING_V1_PALETTE.card};
      --card-foreground: ${STAGING_V1_PALETTE.textPrimary};
      --popover: ${STAGING_V1_PALETTE.cardElevated};
      --popover-foreground: ${STAGING_V1_PALETTE.textPrimary};
      --primary: ${STAGING_V1_PALETTE.primary};
      --primary-foreground: ${STAGING_V1_PALETTE.primaryForeground};
      --secondary: ${STAGING_V1_PALETTE.muted};
      --secondary-foreground: ${STAGING_V1_PALETTE.textSecondary};
      --muted: ${STAGING_V1_PALETTE.muted};
      --muted-foreground: ${STAGING_V1_PALETTE.textTertiary};
      --border: ${STAGING_V1_PALETTE.border};
      --input: ${STAGING_V1_PALETTE.border};
      --ring: ${STAGING_V1_PALETTE.primary};
    }
  `;

  root.classList.add('staging-v1-active');
}
