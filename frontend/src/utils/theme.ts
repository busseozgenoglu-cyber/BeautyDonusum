export const COLORS = {
  bg: { primary: '#FAFBFE', secondary: '#F0F2F8', tertiary: '#E8EAF2', overlay: 'rgba(15,20,40,0.55)' },
  surface: { glass: 'rgba(255,255,255,0.85)', glassBorder: 'rgba(0,0,0,0.06)', card: '#FFFFFF', elevated: '#FFFFFF' },
  brand: { primary: '#3B82F6', secondary: '#8B5CF6', accent: '#06B6D4' },
  gradient: { blue: ['#3B82F6', '#2563EB'] as const, purple: ['#8B5CF6', '#7C3AED'] as const, teal: ['#06B6D4', '#0891B2'] as const, warm: ['#F59E0B', '#D97706'] as const },
  text: { primary: '#0F172A', secondary: '#475569', tertiary: '#94A3B8', inverse: '#FFFFFF' },
  status: { success: '#10B981', warning: '#F59E0B', error: '#EF4444', info: '#3B82F6' },
};

export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const RADIUS = { sm: 10, md: 16, lg: 22, xl: 28, full: 9999 };

export const SHADOWS = {
  card: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  glow: { shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 6 },
  soft: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
};

export const FONT = {
  h1: { fontSize: 34, fontWeight: '800' as const, letterSpacing: -0.8 },
  h2: { fontSize: 26, fontWeight: '700' as const, letterSpacing: -0.4 },
  h3: { fontSize: 21, fontWeight: '600' as const, letterSpacing: -0.2 },
  h4: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyLg: { fontSize: 17, fontWeight: '400' as const },
  small: { fontSize: 13, fontWeight: '400' as const },
  xs: { fontSize: 11, fontWeight: '400' as const },
};
