export const COLORS = {
  bg: { primary: '#0A0A14', secondary: '#141414', tertiary: '#1F1F1F', overlay: 'rgba(10,10,10,0.7)' },
  surface: { glass: 'rgba(255,255,255,0.05)', glassBorder: 'rgba(255,255,255,0.1)', card: '#121212', elevated: '#1A1A1A' },
  brand: { primary: '#E5C07B', secondary: '#B76E79', accent: '#F5F5F7' },
  gradient: {
    gold: ['#F3D088', '#D1A354'] as const,
    rose: ['#CD828D', '#9F5B66'] as const,
    vibrant: ['#B06EFF', '#6EAEFF'] as const,
    logoBorder: ['#FF6EC7', '#B06EFF', '#6EAEFF'] as const,
    bg: ['#0A0A14', '#12091E', '#0D1422'] as const,
  },
  text: { primary: '#FFFFFF', secondary: '#A1A1AA', tertiary: '#71717A', inverse: '#000000' },
  status: { success: '#34C759', warning: '#FF9F0A', error: '#FF453A', info: '#0A84FF' },
};

export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const RADIUS = { sm: 8, md: 16, lg: 24, xl: 32, full: 9999 };

export const SHADOWS = {
  card: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  glow: { shadowColor: '#E5C07B', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
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
