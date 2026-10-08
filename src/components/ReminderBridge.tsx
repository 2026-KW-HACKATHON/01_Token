import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useWalk } from '../store/WalkStore';

/**
 * 알림을 눌러 앱이 열리면 걷기 홈으로 이동하고 걸음을 다시 읽는다.
 * 받을 보상이 있으면 RewardReadyPopup이 이어서 뜬다.
 */
export function ReminderBridge() {
  const w = useWalk();
  const refresh = w.refresh;
  const last = Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (!w.ready || !last) return;
    const id = last.notification.request.identifier + last.notification.date;
    if (handled.current === id) return;
    handled.current = id;
    router.navigate('/');
    refresh('알림으로 열기');
  }, [last, w.ready, refresh]);

  return null;
}
