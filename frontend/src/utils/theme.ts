export const COLORS = {
  bg: { primary: '#050D0F', secondary: '#0A1518', tertiary: '#0F1D21', overlay: 'rgba(5,13,15,0.85)' },
  surface: { glass: 'rgba(255,255,255,0.04)', glassBorder: 'rgba(255,255,255,0.08)', card: '#0C1619', elevated: '#111F23' },
  brand: { primary: '#2DD4A8', secondary: '#F7856E', accent: '#58E0C0' },
  gradient: { teal: ['#2DD4A8', '#1A9B7A'] as const, coral: ['#F7856E', '#E05A42'] as const, emerald: ['#0F7A5C', '#2DD4A8'] as const },
  text: { primary: '#F0F6F4', secondary: '#8BA5A0', tertiary: '#5A7A74', inverse: '#050D0F' },
  status: { success: '#2DD4A8', warning: '#F5B731', error: '#F7564A', info: '#3AAFFF' },
};

export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const RADIUS = { sm: 10, md: 18, lg: 26, xl: 34, full: 9999 };

export const SHADOWS = {
  card: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 10 },
  glow: { shadowColor: '#2DD4A8', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 12 },
};

export const FONT = {
  h1: { fontSize: 38, fontWeight: '800' as const, letterSpacing: -0.8 },
  h2: { fontSize: 30, fontWeight: '700' as const, letterSpacing: -0.5 },
  h3: { fontSize: 23, fontWeight: '600' as const, letterSpacing: -0.2 },
  h4: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  bodyLg: { fontSize: 18, fontWeight: '400' as const },
  small: { fontSize: 14, fontWeight: '400' as const },
  xs: { fontSize: 12, fontWeight: '400' as const },
};
