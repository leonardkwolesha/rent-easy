// Shared design tokens for all 3 mobile apps. Mirrors the web client's
// BRAND constants in client/CLAUDE.md so that web and mobile stay aligned.

export const COLORS = {
  // Brand
  orange:        '#f97316',  // gradient start, primary
  red:           '#dc2626',  // gradient end, errors, destructive
  activeOrange:  '#e8521a',  // active nav icons, links, prices, badges
  dark:          '#1a1a2e',  // restaurant header bg, headings on white
  white:         '#ffffff',

  // Status — pill bg + matching dark text per status type
  successText:   '#15803d',  successBg:   '#dcfce7',  // Open, Delivered, Available
  errorText:     '#991b1b',  errorBg:     '#fee2e2',  // Closed, Cancelled
  infoText:      '#1e40af',  infoBg:      '#dbeafe',  // Ready, Preparing
  warningText:   '#854d0e',  warningBg:   '#fef3c7',  // Confirmed
  pendingText:   '#9a3412',  pendingBg:   '#ffedd5',  // Placed, Pending

  // Surfaces
  pageBg:        '#f9fafb',
  cardBg:        '#ffffff',
  border:        '#e5e7eb',
  divider:       '#f1f1f1',

  // Text
  textPrimary:   '#111827',  // headings, primary content on light bg
  textBody:      '#374151',  // body copy
  textMuted:     '#6b7280',  // secondary, captions
  textLight:     '#9ca3af',  // disabled, hints
};

export const GRADIENTS = {
  primary:      ['#f97316', '#dc2626'],
  primaryDeep:  ['#ea580c', '#b91c1c'],
};

export const SPACING = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32,
};

export const RADIUS = {
  sm: 6, md: 10, lg: 12, xl: 18, pill: 999,
};

export const FONT_SIZE = {
  xs: 10, sm: 12, base: 14, md: 15, lg: 16, xl: 18, xxl: 20, xxxl: 22, display: 24, hero: 28,
};

export const FONT_WEIGHT = {
  regular: '400', medium: '500', semibold: '600', bold: '700', heavy: '900',
};

export const SHADOW = {
  sm: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius:  2,
    elevation:     1,
  },
  md: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius:  8,
    elevation:     3,
  },
  lg: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius:  16,
    elevation:     6,
  },
};

// Status → badge styling. Single source of truth; OrderCard / Badge consume this.
export const STATUS_BADGE = {
  placed:     { bg: COLORS.pendingBg, text: COLORS.pendingText, label: 'Placed' },
  confirmed:  { bg: COLORS.warningBg, text: COLORS.warningText, label: 'Confirmed' },
  preparing:  { bg: COLORS.infoBg,    text: COLORS.infoText,    label: 'Preparing' },
  ready:      { bg: COLORS.infoBg,    text: COLORS.infoText,    label: 'Ready' },
  on_the_way: { bg: COLORS.pendingBg, text: COLORS.pendingText, label: 'On the way' },
  delivered:  { bg: COLORS.successBg, text: COLORS.successText, label: 'Delivered' },
  cancelled:  { bg: COLORS.errorBg,   text: COLORS.errorText,   label: 'Cancelled' },
  // Restaurant statuses
  open:       { bg: COLORS.successBg, text: COLORS.successText, label: 'Open' },
  closed:     { bg: COLORS.errorBg,   text: COLORS.errorText,   label: 'Closed' },
  // Rider statuses
  available:  { bg: COLORS.successBg, text: COLORS.successText, label: 'Available' },
  offline:    { bg: '#f3f4f6',        text: COLORS.textMuted,   label: 'Offline' },
  // Generic pending
  pending:    { bg: COLORS.pendingBg, text: COLORS.pendingText, label: 'Pending' },
};

// ── Backwards-compatible export ───────────────────────────────────────────
// Existing screens import { BRAND } — keep this stable so we don't break them.
export const BRAND = {
  gradientPrimary: GRADIENTS.primary,
  orange:          COLORS.orange,
  red:             COLORS.red,
  activeOrange:    COLORS.activeOrange,
  dark:            COLORS.dark,
  pageBg:          COLORS.pageBg,
  cardBg:          COLORS.cardBg,
  cardBorder:      COLORS.border,
  cardRadius:      RADIUS.md,
  pillRadius:      RADIUS.pill,
  cardShadow:      SHADOW.sm,
  cardShadowHover: SHADOW.lg,
  font:            'System',
  currency:        'TSh',
};

export const ORDER_STATUSES = [
  'placed', 'confirmed', 'preparing', 'ready', 'on_the_way', 'delivered', 'cancelled',
];

export const STATUS_LABELS = Object.fromEntries(
  Object.entries(STATUS_BADGE).map(([k, v]) => [k, v.label])
);
