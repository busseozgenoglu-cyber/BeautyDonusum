import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/utils/theme';
import { useLang } from '../../src/context/LanguageContext';

export default function TabLayout() {
  const { t } = useLang();
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: COLORS.bg.secondary, borderTopColor: COLORS.surface.glassBorder, borderTopWidth: 0.5, height: 85, paddingBottom: 25, paddingTop: 8 },
      tabBarActiveTintColor: COLORS.brand.primary,
      tabBarInactiveTintColor: COLORS.text.tertiary,
      tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
    }}>
      <Tabs.Screen name="home" options={{ title: t('home'), tabBarIcon: ({ color, size }) => <Ionicons name="sparkles" size={size} color={color} /> }} />
      <Tabs.Screen name="history" options={{ title: t('history'), tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: t('profile'), tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }} />
    </Tabs>
  );
}
