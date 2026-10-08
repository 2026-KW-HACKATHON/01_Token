import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '../../theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.rose,
        tabBarInactiveTintColor: colors.muted,
        headerStyle: { backgroundColor: colors.paper },
        headerShadowVisible: false,
        headerTintColor: colors.ink,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: '걷기', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>👟</Text> }}
      />
      <Tabs.Screen
        name="map"
        options={{ title: '혜택 지도', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>◎</Text> }}
      />
      <Tabs.Screen
        name="coupons"
        options={{ title: '쿠폰함', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🎟</Text> }}
      />
      <Tabs.Screen
        name="explore"
        options={{ title: '동네 탐색', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>⌕</Text> }}
      />
      {/* 이전 코스 추천 화면: 코드는 유지하고 탭에서만 숨김 (월계 들름길 전환) */}
      <Tabs.Screen name="course-find" options={{ href: null, title: '코스 찾기' }} />
      <Tabs.Screen name="courses" options={{ href: null, title: '내 코스' }} />
      <Tabs.Screen name="manage" options={{ href: null, title: '운영' }} />
    </Tabs>
  );
}
