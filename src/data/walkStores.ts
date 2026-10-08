/**
 * 시연용 가상 가게 (월계 들름길 MVP)
 * - 실제 가게·제휴·쿠폰이 아니다. 이름·메뉴·가격·혜택·위치 모두 시연용.
 * - 위치는 월계1동 광운대역~광운로 일대의 임의 좌표이며 실제 매장 위치가 아니다.
 */
export interface WalkMenu {
  name: string;
  price: number;
}

export interface WalkStore {
  id: string;
  name: string;
  category: '식사' | '카페·디저트' | '분식' | '베이커리';
  lat: number;
  lng: number;
  area: string; // 대략적인 위치 설명
  perk: string; // 쿠폰 혜택
  minOrder?: number; // 최소 주문 금액
  validHours?: string; // 사용 가능 시간
  validDays: number; // 발급 후 유효 일수
  dailyLimit: number; // 하루 발급 수량
  menus: WalkMenu[];
}

export const WALK_STORES: WalkStore[] = [
  {
    id: 'demo-bakery', name: '들름 베이커리 (가상)', category: '베이커리',
    lat: 37.6236, lng: 127.0605, area: '광운대역 서쪽 출구 근처 (가상 위치)',
    perk: '빵 3,000원 이상 구매 시 아메리카노 1잔', minOrder: 3000, validHours: '15:00 ~ 19:00', validDays: 7, dailyLimit: 10,
    menus: [{ name: '소금빵', price: 2800 }, { name: '크림치즈 베이글', price: 3500 }, { name: '아메리카노', price: 2000 }],
  },
  {
    id: 'demo-gukbap', name: '월계 한끼 국밥 (가상)', category: '식사',
    lat: 37.6218, lng: 127.0613, area: '광운로 주변 (가상 위치)',
    perk: '포장 주문 1,000원 할인', minOrder: 8000, validDays: 7, dailyLimit: 15,
    menus: [{ name: '돼지국밥', price: 9000 }, { name: '순대국밥', price: 9000 }, { name: '공기밥 추가', price: 1000 }],
  },
  {
    id: 'demo-tteok', name: '골목 떡볶이 (가상)', category: '분식',
    lat: 37.6205, lng: 127.0597, area: '광운대 정문 아래 골목 (가상 위치)',
    perk: '떡볶이 주문 시 튀김 2개 추가', validHours: '14:00 ~ 17:00', validDays: 5, dailyLimit: 20,
    menus: [{ name: '떡볶이 1인분', price: 4500 }, { name: '모둠튀김', price: 4000 }, { name: '김밥', price: 3500 }],
  },
  {
    id: 'demo-cafe', name: '우이천 쉼 카페 (가상)', category: '카페·디저트',
    lat: 37.6227, lng: 127.0571, area: '우이천 산책로 방향 (가상 위치)',
    perk: '음료 1잔 1,000원 할인', validDays: 7, dailyLimit: 10,
    menus: [{ name: '라떼', price: 4500 }, { name: '수제 레몬에이드', price: 5000 }, { name: '쿠키', price: 2500 }],
  },
];

export const storeById = (id?: string) => WALK_STORES.find((s) => s.id === id);
export const won = (n: number) => `${n.toLocaleString()}원`;
