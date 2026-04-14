import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../utils/theme';

/**
 * Velum shell — ink void + teal aurora (shared by splash, auth, tabs, analysis).
 * Component name kept as AetherScreen for stable imports across the app.
 */
export function AetherScreen({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[COLORS.bg.canvas, COLORS.bg.primary, COLORS.bg.deep]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
      />
      <LinearGradient
        colors={['rgba(45,212,191,0.14)', 'transparent', 'rgba(13,148,136,0.08)']}
        style={styles.aurora}
        start={{ x: 0, y: 0.2 }}
        end={{ x: 1, y: 0.8 }}
        pointerEvents="none"
      />
      <View style={styles.orbTeal} />
      <View style={styles.orbDeep} />
      <View style={styles.gridLine1} pointerEvents="none" />
      <View style={styles.gridLine2} pointerEvents="none" />
      <LinearGradient
        colors={['transparent', 'rgba(2,6,10,0.55)']}
        style={styles.bottomVeil}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg.deep },
  aurora: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.9,
  },
  orbTeal: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? -100 : -80,
    right: -120,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: COLORS.brand.primary,
    opacity: 0.07,
  },
  orbDeep: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#0F766E',
    opacity: 0.09,
  },
  gridLine1: {
    position: 'absolute',
    top: '22%',
    left: -40,
    right: -40,
    height: 1,
    backgroundColor: 'rgba(94,234,212,0.06)',
    transform: [{ rotate: '-8deg' }],
  },
  gridLine2: {
    position: 'absolute',
    top: '58%',
    left: -60,
    right: -60,
    height: 1,
    backgroundColor: 'rgba(148,163,184,0.05)',
    transform: [{ rotate: '5deg' }],
  },
  bottomVeil: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '42%',
  },
});
