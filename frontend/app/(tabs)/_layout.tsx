import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS } from '../../src/utils/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.bar,
        tabBarActiveTintColor: COLORS.brand.primary,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.32)',
        tabBarLabelStyle: styles.label,
        tabBarBackground: () => (
          <BlurView
            intensity={Platform.OS === 'ios' ? 48 : 32}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Keşfet',
          tabBarIcon: ({ color, size }) => <Ionicons name="compass-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Geçmiş',
          tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: Platform.OS === 'android' ? 'rgba(8,6,6,0.94)' : 'transparent',
    borderTopColor: 'rgba(45,212,191,0.22)',
    borderTopWidth: StyleSheet.hairlineWidth,
    height: 88,
    paddingBottom: 26,
    paddingTop: 10,
    elevation: 0,
  },
  label: { fontSize: 10, fontFamily: 'Outfit_600SemiBold', letterSpacing: 0.2 },
});
