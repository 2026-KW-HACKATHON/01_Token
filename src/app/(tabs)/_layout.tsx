import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '../../theme';

const icon = (glyph: string) => ({ focused }: { focused: boolean }) => (
  <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{glyph}</Text>
);

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerStyle: { backgroundColor: colors.paper },
        headerShadowVisible: false,
        headerTintColor: colors.ink,
        headerTitleAlign: 'left',
        headerTitleStyle: { fontSize: 20, fontWeight: '700' },
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.line },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700', marginTop: 2 },
        sceneStyle: { backgroundColor: colors.paper },
      }}
    >
      <Tabs.Screen name="index" options={{ title: '걷기', headerShown: false, tabBarIcon: icon('👟') }} />
      <Tabs.Screen name="map" options={{ title: '혜택', headerShown: false, tabBarIcon: icon('🗺️') }} />
      <Tabs.Screen name="coupons" options={{ title: '쿠폰함', headerShown: false, tabBarIcon: icon('🎟️') }} />
      <Tabs.Screen name="explore" options={{ title: '동네 탐색', headerShown: false, tabBarIcon: icon('🔍') }} />
      {/* 이전 코스 추천 화면: 코드는 유지하고 탭에서만 숨김 (월계 들름길 전환) */}
      <Tabs.Screen name="course-find" options={{ href: null, title: '코스 찾기' }} />
      <Tabs.Screen name="courses" options={{ href: null, title: '내 코스' }} />
      <Tabs.Screen name="manage" options={{ href: null, title: '운영' }} />
    </Tabs>
  );
}
