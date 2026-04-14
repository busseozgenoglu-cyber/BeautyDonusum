/**
 * Velum — deep ink + bioluminescent teal (distinct from generic “gold luxury” AI apps).
 */
export const COLORS = {
  bg: {
    primary: '#040B12',
    secondary: '#0A1520',
    tertiary: '#0F1F2E',
    overlay: 'rgba(4, 11, 18, 0.88)',
    deep: '#02060A',
    canvas: '#061018',
  },
  surface: {
    glass: 'rgba(45, 212, 191, 0.06)',
    glassBorder: 'rgba(94, 234, 212, 0.14)',
    card: 'rgba(10, 21, 32, 0.92)',
    elevated: '#0F1C28',
  },
  brand: {
    primary: '#2DD4BF',
    secondary: '#5EEAD4',
    accent: '#E8FDF9',
  },
  gradient: {
    beam: ['#5EEAD4', '#2DD4BF', '#14B8A6'] as const,
    depth: ['#0D9488', '#115E59', '#042F2E'] as const,
    warm: ['#F0AB8C', '#E07A5F'] as const,
    /** @deprecated use beam — kept for gradual migration */
    gold: ['#5EEAD4', '#2DD4BF'] as const,
    rose: ['#34D399', '#059669'] as const,
  },
  accent: {
    rose: '#E07A5F',
    roseLight: '#F0AB8C',
    roseDeep: '#C45C42',
    champagne: '#94A3B8',
    bloomGold: '#2DD4BF',
    bloomRose: '#0D9488',
  },
  text: { primary: '#F8FAFC', secondary: '#94A3B8', tertiary: '#64748B', inverse: '#020617' },
  status: { success: '#34D399', warning: '#FBBF24', error: '#F87171', info: '#38BDF8' },
};

export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const RADIUS = { sm: 8, md: 16, lg: 24, xl: 32, full: 9999 };

export const SHADOWS = {
  card: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 12 },
  glow: { shadowColor: '#2DD4BF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.45, shadowRadius: 24, elevation: 14 },
  glowRose: { shadowColor: '#14B8A6', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 12 },
};

export const FONT = {
  h1: { fontSize: 36, fontFamily: 'CormorantGaramond_700Bold', letterSpacing: -0.5 },
  h2: { fontSize: 28, fontFamily: 'CormorantGaramond_700Bold', letterSpacing: -0.3 },
  h3: { fontSize: 22, fontFamily: 'CormorantGaramond_600SemiBold' },
  h4: { fontSize: 18, fontFamily: 'Outfit_600SemiBold' },
  body: { fontSize: 16, fontFamily: 'Outfit_400Regular' },
  bodyLg: { fontSize: 18, fontFamily: 'Outfit_400Regular' },
  small: { fontSize: 14, fontFamily: 'Outfit_400Regular' },
  xs: { fontSize: 12, fontFamily: 'Outfit_400Regular' },
};
