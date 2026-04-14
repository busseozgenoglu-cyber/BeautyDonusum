import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../utils/theme';

/** Shared full-screen backdrop: deep warm canvas + soft gold/rose orbs (distinct from generic AI purple). */
export function AetherScreen({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#070504', COLORS.bg.deep, '#050408']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.orbGold} />
      <View style={styles.orbRose} />
      <View style={styles.orbChampagne} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.35)']}
        style={styles.bottomVeil}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050408' },
  orbGold: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? -120 : -100,
    left: -100,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: COLORS.accent.bloomGold,
    opacity: 0.09,
  },
  orbRose: {
    position: 'absolute',
    bottom: -80,
    right: -90,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: COLORS.accent.bloomRose,
    opacity: 0.08,
  },
  orbChampagne: {
    position: 'absolute',
    top: '38%',
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.accent.champagne,
    opacity: 0.05,
  },
  bottomVeil: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '45%',
  },
});
