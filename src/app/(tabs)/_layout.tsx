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
        options={{ title: '코스 찾기', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>✦</Text> }}
      />
      <Tabs.Screen
        name="courses"
        options={{ title: '내 코스', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>◎</Text> }}
      />
    </Tabs>
  );
}
