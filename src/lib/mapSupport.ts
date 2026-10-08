import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * 앱 안 지도(react-native-maps) 표시 가능 여부
 * - iOS: 애플 지도라 키 불필요 → 항상 표시
 * - Android + Expo Go: Expo Go에 지도 키가 들어 있어 표시 가능
 * - Android 설치형(APK): 구글 지도 키를 넣지 않았으므로 표시하지 않고, 지도 앱 연결 버튼으로 대신한다(A안)
 */
export const CAN_EMBED_MAP = Platform.OS !== 'android' || Constants.executionEnvironment === 'storeClient';

const appName = () =>
  Constants.executionEnvironment === 'storeClient'
    ? Platform.OS === 'ios' ? 'host.exp.Exponent' : 'host.exp.exponent'
    : Constants.expoConfig?.android?.package ?? Constants.expoConfig?.ios?.bundleIdentifier ?? 'datecourse';

type Pt = { name: string; lat: number; lng: number };

/** 네이버 지도 앱: 해당 좌표에 장소 표시 */
export const naverPlaceUrl = (p: Pt) =>
  `nmap://place?lat=${p.lat}&lng=${p.lng}&name=${encodeURIComponent(p.name)}&appname=${appName()}`;

/** 네이버 지도 앱: 도보 길찾기 */
export const naverWalkUrl = (p: Pt) =>
  `nmap://route/walk?dlat=${p.lat}&dlng=${p.lng}&dname=${encodeURIComponent(p.name)}&appname=${appName()}`;

/** 카카오맵 웹 링크: 좌표에 마커 표시 (앱이 있으면 앱으로 열림) */
export const kakaoMapUrl = (p: Pt) =>
  `https://map.kakao.com/link/map/${encodeURIComponent(p.name)},${p.lat},${p.lng}`;
