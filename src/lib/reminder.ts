import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * 매일 정해진 시간 알림 (휴대폰에 예약해 두므로 앱이 꺼져 있어도 온다)
 * - 걸음 수를 몰래 읽지 않는다. 그래서 알림 문구에 걸음·보상 개수를 쓰지 않는다.
 * - 알림을 눌러 앱을 열면 걸음을 읽고, 받을 보상이 있으면 보상 알림 팝업이 뜬다.
 */
const KEY = '@walk/reminder/v1';
const DAILY_ID = 'walk-daily-reminder';
export const REMINDER_HOUR = 19;
export const REMINDER_MINUTE = 0;

// 앱이 켜져 있을 때도 알림 배너를 보여 준다 (10초 테스트용)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('walk', {
    name: '걷기 보상 알림',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

/** 알림 권한 확인·요청. 허용되면 true */
export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    await ensureChannel();
    let p = await Notifications.getPermissionsAsync();
    if (!p.granted && p.canAskAgain) p = await Notifications.requestPermissionsAsync();
    return p.granted;
  } catch {
    return false;
  }
}

export async function getReminderOn(): Promise<boolean> {
  try { return (await AsyncStorage.getItem(KEY)) === 'on'; } catch { return false; }
}

/** 매일 알림 켜기/끄기. 켜기에 실패(권한 거부)하면 false */
export async function setDailyReminder(on: boolean): Promise<boolean> {
  try {
    await Notifications.cancelScheduledNotificationAsync(DAILY_ID).catch(() => {});
    if (!on) {
      await AsyncStorage.setItem(KEY, 'off');
      return true;
    }
    if (!(await ensureNotificationPermission())) return false;
    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_ID,
      content: {
        title: '월계 들름길 👟',
        body: '오늘 걸은 걸음으로 보상을 받아 가세요. 쌓인 보상은 동네 가게 쿠폰으로 바꿀 수 있어요.',
        data: { to: '/' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: REMINDER_HOUR,
        minute: REMINDER_MINUTE,
        ...(Platform.OS === 'android' ? { channelId: 'walk' } : {}),
      },
    });
    await AsyncStorage.setItem(KEY, 'on');
    return true;
  } catch {
    return false;
  }
}

/** 발표용: 10초 뒤 같은 알림 한 번 */
export async function testReminder(seconds = 10): Promise<boolean> {
  try {
    if (!(await ensureNotificationPermission())) return false;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '월계 들름길 👟 (테스트)',
        body: '오늘 걸은 걸음으로 보상을 받아 가세요. 쌓인 보상은 동네 가게 쿠폰으로 바꿀 수 있어요.',
        data: { to: '/' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
        ...(Platform.OS === 'android' ? { channelId: 'walk' } : {}),
      },
    });
    return true;
  } catch {
    return false;
  }
}
