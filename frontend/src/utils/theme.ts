export const COLORS = {
  bg: {
    primary: '#08111F',
    secondary: '#0E1830',
    tertiary: '#13203B',
    overlay: 'rgba(8,17,31,0.78)',
  },
  surface: {
    glass: 'rgba(255,255,255,0.06)',
    glassBorder: 'rgba(182,205,255,0.16)',
    card: '#101B32',
    elevated: '#172540',
    muted: 'rgba(255,255,255,0.05)',
  },
  brand: {
    primary: '#6BE3C0',
    secondary: '#FFB078',
    accent: '#C6D4FF',
  },
  gradient: {
    lagoon: ['#46C6FF', '#6BE3C0'] as const,
    sunrise: ['#FF8C72', '#FFB078'] as const,
    aurora: ['#7C8CFF', '#46C6FF'] as const,
    midnight: ['#08111F', '#0D1A30', '#15253F'] as const,
    sunset: ['#FF8C72', '#FFB078'] as const,
    hero: ['#08111F', '#11213B', '#1A2E4D'] as const,
    accent: ['#46C6FF', '#6BE3C0'] as const,
    pageShell: ['#08111F', '#0D1A30', '#15253F'] as const,
    highlight: ['#46C6FF', '#6BE3C0'] as const,
  },
  text: {
    primary: '#F8FAFF',
    secondary: '#C9D3EA',
    tertiary: '#8FA2C8',
    inverse: '#06101E',
    muted: '#8FA2C8',
  },
  status: {
    success: '#57D39B',
    warning: '#FFB454',
    error: '#FF7E6B',
    info: '#46C6FF',
  },
};

export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const RADIUS = { sm: 8, md: 16, lg: 24, xl: 32, full: 9999 };

export const SHADOWS = {
  card: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.24, shadowRadius: 18, elevation: 8 },
  glow: { shadowColor: '#46C6FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.28, shadowRadius: 20, elevation: 10 },
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
  overline: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 1.4 },
};
