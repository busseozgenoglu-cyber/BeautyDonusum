export const COLORS = {
  bg: { primary: '#08080B', secondary: '#0F0F14', tertiary: '#16161F', overlay: 'rgba(8,8,11,0.85)' },
  surface: {
    glass: 'rgba(255,255,255,0.06)',
    glassBorder: 'rgba(255,255,255,0.12)',
    card: '#0D0D12',
    elevated: '#18181F',
  },
  brand: {
    primary: '#FF006E',
    secondary: '#8338EC',
    accent1: '#3A86FF',
    accent2: '#FFBE0B',
    success: '#06FFA5',
    orange: '#FB5607',
  },
  gradient: {
    primary: ['#FF006E', '#8338EC'] as const,
    secondary: ['#3A86FF', '#8338EC'] as const,
    success: ['#06FFA5', '#3A86FF'] as const,
    warm: ['#FB5607', '#FF006E'] as const,
    gold: ['#FFBE0B', '#FB5607'] as const,
    dark: ['#0F0F14', '#08080B'] as const,
  },
  text: { primary: '#FFFFFF', secondary: '#A1A1B5', tertiary: '#60607A', inverse: '#000000' },
  status: { success: '#06FFA5', warning: '#FFBE0B', error: '#FF453A', info: '#3A86FF' },
};

export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const RADIUS = { sm: 10, md: 16, lg: 24, xl: 32, full: 9999 };

export const SHADOWS = {
  card: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10 },
  glow: { shadowColor: '#FF006E', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 12 },
  glowBlue: { shadowColor: '#3A86FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 12 },
  glowPurple: { shadowColor: '#8338EC', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 12 },
};

export const FONT = {
  h1: { fontSize: 36, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 22, fontWeight: '600' as const },
  h4: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  bodyLg: { fontSize: 18, fontWeight: '400' as const },
  small: { fontSize: 14, fontWeight: '400' as const },
  xs: { fontSize: 12, fontWeight: '400' as const },
};
