# 데이트 코스 (kw 해커톤 MVP)

매니패스트 프로젝트 "동네 주민과 미식 여행자를 위한 검증 기반 지역 맛집·상점 탐색 서비스"의
데이트 추천(R-VOMNHC)과 코스 만들기·공유(R-LMCTDG) 요구사항을 구현한 Expo 앱입니다.

## 실행

1. https://developers.kakao.com 에서 앱을 만들고 REST API 키를 복사합니다.
   콘솔에서 카카오맵(로컬) API 사용 설정이 켜져 있어야 검색이 됩니다.
2. `.env.example`을 `.env`로 복사하고 키를 넣습니다.
3. `npm install` 후 `npx expo start`, 휴대폰의 Expo Go로 QR을 스캔합니다.

에뮬레이터는 기본 위치가 미국이라 "현재 위치"로는 결과가 없습니다. 지역을 직접 입력해 테스트하세요.

## 화면과 기능 매핑

| 화면 | 파일 | 매니패스트 기능 |
|---|---|---|
| 코스 찾기 | src/app/(tabs)/index.tsx | F-OZVLQS 데이트 선호·조건 입력 |
| 추천 결과 | src/app/recommend.tsx | F-IBCYQW 개인화 장소 추천, F-CZKUBF 코스 추천·피드백 |
| 코스에 추가 | src/app/pick-course.tsx | F-JIOKIJ 코스 생성·장소 구성 |
| 코스 편집 | src/app/course/[id].tsx | F-JIOKIJ, F-JUUEEV 일정·메모·동선, F-GKKPJJ 상태·공유 |
| 내 코스 | src/app/(tabs)/courses.tsx | F-GKKPJJ 코스 목록·상태 |

추천 로직은 src/lib/recommend.ts, 카카오 API 호출은 src/api/kakao.ts, 로컬 저장은 src/store/AppStore.tsx에 있습니다.

## 알려진 한계

- 로그인과 서버가 없어 코스·저장·피드백은 기기에만 저장됩니다.
- 공유는 텍스트(장소 순서, 시간, 카카오맵 링크)로 보냅니다. 개인 메모는 넣지 않습니다.
- 카카오 로컬 API에는 사진과 가격 정보가 없어 카테고리 아이콘과 분류명으로 대신합니다.
- REST 키가 앱 번들에 포함됩니다. 데모 이후에는 서버 프록시로 옮기세요.
