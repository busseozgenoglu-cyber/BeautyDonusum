/** Jewel & luxury palette: warm gold + dusty rose on near-black (no generic purple UI). */
export const COLORS = {
  bg: {
    primary: '#0A0A0A',
    secondary: '#141414',
    tertiary: '#1F1F1F',
    overlay: 'rgba(10,10,10,0.7)',
    deep: '#06060C',
    canvas: '#0C0A08',
  },
  surface: { glass: 'rgba(255,255,255,0.05)', glassBorder: 'rgba(255,255,255,0.1)', card: '#121212', elevated: '#1A1A1A' },
  brand: { primary: '#E5C07B', secondary: '#B76E79', accent: '#F5F5F7' },
  gradient: { gold: ['#F3D088', '#D1A354'] as const, rose: ['#CD828D', '#9F5B66'] as const },
  /** Medikal / ikincil vurgular (mor yerine gül / şampanya) */
  accent: {
    rose: '#B76E79',
    roseLight: '#D4A0AA',
    roseDeep: '#8E4E59',
    champagne: '#C9A86C',
    bloomGold: '#E5C07B',
    bloomRose: '#B76E79',
  },
  text: { primary: '#FFFFFF', secondary: '#A1A1AA', tertiary: '#71717A', inverse: '#000000' },
  status: { success: '#34C759', warning: '#FF9F0A', error: '#FF453A', info: '#0A84FF' },
};

export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const RADIUS = { sm: 8, md: 16, lg: 24, xl: 32, full: 9999 };

export const SHADOWS = {
  card: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  glow: { shadowColor: '#E5C07B', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  glowRose: { shadowColor: '#B76E79', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.35, shadowRadius: 18, elevation: 12 },
};

/** expo-google-fonts family names (load in root _layout). */
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
