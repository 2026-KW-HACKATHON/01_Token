import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppStoreProvider } from '../store/AppStore';
import { WalkStoreProvider } from '../store/WalkStore';
import { colors } from '../theme';

export default function RootLayout() {
  return (
    <AppStoreProvider>
      <WalkStoreProvider>
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
        <Stack.Screen name="place/[id]" options={{ title: '장소' }} />
        <Stack.Screen name="review/[id]" options={{ title: '후기 쓰기' }} />
        <Stack.Screen name="report" options={{ title: '정보 수정 요청', presentation: 'modal' }} />
        <Stack.Screen name="owner-apply" options={{ title: '운영 권한 신청' }} />
        <Stack.Screen name="owner-edit" options={{ title: '영업 정보 수정' }} />
        <Stack.Screen name="store/[id]" options={{ title: '가게' }} />
      </Stack>
      </WalkStoreProvider>
    </AppStoreProvider>
  );
}
