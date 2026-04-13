/** VISAGE Clinic Anteprima — clinical light theme (distinct from template “dark luxury”) */
export const COLORS = {
  bg: {
    primary: '#F4F6F8',
    secondary: '#FFFFFF',
    tertiary: '#E8ECEF',
    overlay: 'rgba(15, 23, 42, 0.45)',
  },
  surface: {
    glass: 'rgba(255, 255, 255, 0.72)',
    glassBorder: 'rgba(15, 23, 42, 0.08)',
    card: '#FFFFFF',
    elevated: '#FAFBFC',
  },
  brand: {
    primary: '#0D5C5E',
    secondary: '#C9A227',
    accent: '#1E3A5F',
  },
  gradient: {
    teal: ['#0D5C5E', '#1A7A7D'] as const,
    gold: ['#D4AF37', '#C9A227'] as const,
    navy: ['#1E3A5F', '#0F2744'] as const,
  },
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    tertiary: '#64748B',
    inverse: '#FFFFFF',
  },
  status: { success: '#0F766E', warning: '#B45309', error: '#B91C1C', info: '#1D4ED8' },
  border: { subtle: 'rgba(15, 23, 42, 0.08)', strong: 'rgba(13, 92, 94, 0.25)' },
};

export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const RADIUS = { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 };

export const SHADOWS = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  soft: {
    shadowColor: '#0D5C5E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
};

export const FONT = {
  h1: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 26, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 20, fontWeight: '600' as const },
  h4: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  bodyLg: { fontSize: 18, fontWeight: '400' as const },
  small: { fontSize: 14, fontWeight: '400' as const },
  xs: { fontSize: 12, fontWeight: '400' as const },
};
