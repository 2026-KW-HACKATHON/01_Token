/** 방문 목적 (매니패스트 S-WGLJGI: 연인 데이트, 가족 나들이, 친구 나들이) */
export interface Purpose {
  key: string;
  label: string;
  courseWord: string;
  hints: string[]; // 어울리는 카카오 분류
  avoid: string[]; // 추천에서 빼는 분류
}

export const PURPOSES: Purpose[] = [
  {
    key: 'couple', label: '연인 데이트', courseWord: '데이트',
    hints: ['이탈리안', '양식', '프랑스', '와인', '디저트', '베이커리', '전망대', '공원', '미술관', '전시'],
    avoid: [],
  },
  {
    key: 'family', label: '가족 나들이', courseWord: '가족 나들이',
    hints: ['한식', '국수', '돈까스', '공원', '박물관', '과학관', '수목원', '체험', '키즈', '동물원', '테마'],
    avoid: ['술집', '호프', '이자카야', '와인바', '칵테일', '포차'],
  },
  {
    key: 'friends', label: '친구 나들이', courseWord: '친구 나들이',
    hints: ['분식', '고기', '치킨', '피자', '술집', '호프', '이자카야', '포차', '전시', '공방', '테마'],
    avoid: [],
  },
];

/** 검색 필터용 방문 목적 (매니패스트 F-NACDUD: 혼밥, 여행, 가족 방문 등) */
export const SEARCH_PURPOSES: Purpose[] = [
  { key: 'solo', label: '혼밥', courseWord: '', hints: ['국수', '라멘', '분식', '김밥', '돈까스', '덮밥', '쌀국수', '카레', '햄버거', '도시락'], avoid: ['술집', '뷔페', '고기'] },
  ...PURPOSES,
];

export const purposeOf = (key?: string) => [...PURPOSES, ...SEARCH_PURPOSES].find((p) => p.key === key);
export const hintHit = (path: string, list: string[]) => list.find((h) => path.includes(h));
