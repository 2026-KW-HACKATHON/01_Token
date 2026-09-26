import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppStoreProvider } from '../store/AppStore';
import { colors } from '../theme';

export default function RootLayout() {
  return (
    <AppStoreProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTintColor: colors.ink,
          headerStyle: { backgroundColor: colors.paper },
          headerShadowVisible: false,
          headerBackTitle: '뒤로',
          contentStyle: { backgroundColor: colors.paper },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="recommend" options={{ title: '추천 결과' }} />
        <Stack.Screen name="pick-course" options={{ title: '코스에 추가', presentation: 'modal' }} />
        <Stack.Screen name="course/[id]" options={{ title: '코스' }} />
      </Stack>
    </AppStoreProvider>
  );
}
