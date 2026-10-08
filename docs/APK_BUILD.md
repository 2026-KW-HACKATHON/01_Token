# 안드로이드 APK 만들기 (월계 들름길)

UI 작업이 끝난 뒤 **마지막에** 빌드한다. 한 번에 20~40분(무료 대기열) 걸리고, 이후 화면을 바꾸면 다시 빌드해야 한다.

## 안드로이드 APK에서 달라지는 점
- **지도(A안)**: 구글 지도 키를 넣지 않았다. 설치형 안드로이드 앱에서는 앱 안 지도 대신 "네이버 지도 / 카카오맵" 버튼으로 지도 앱을 연다(`src/lib/mapSupport.ts`의 `CAN_EMBED_MAP`). 아이폰과 Expo Go는 기존처럼 앱 안 지도가 보인다.
- **걸음**: 안드로이드는 "앱 실행 중 측정"이다. 앱을 완전히 종료한 동안의 걸음은 포함되지 않을 수 있다. 아이폰의 "앱 밖 기록 조회"와 다르므로 발표에서 구분한다. 시연용 데이터 모드는 같다.
- **키**: 카카오·네이버 키가 APK 안에 들어간다. 팀원·심사위원에게만 공유하고 공개 배포하지 않는다.

## 준비물
- Expo 계정(Expo Go 로그인 계정), 안드로이드 폰 1대
- `.env`에 넣은 카카오·네이버 키 값

## 빌드 순서 (Windows 명령 프롬프트, 01_Token 폴더)
1. EAS 도구 설치와 로그인
   ```
   npm install -g eas-cli
   eas login
   ```
2. 프로젝트 연결 (처음 한 번). `app.json`에 projectId가 추가되므로 커밋한다.
   ```
   eas init
   ```
3. 키를 Expo 환경 변수로 등록 (처음 한 번, preview 환경). 값은 `.env`와 같게.
   ```
   eas env:create --environment preview --name EXPO_PUBLIC_KAKAO_REST_KEY --value 카카오키 --visibility sensitive
   eas env:create --environment preview --name EXPO_PUBLIC_NAVER_CLIENT_ID --value 네이버ID --visibility sensitive
   eas env:create --environment preview --name EXPO_PUBLIC_NAVER_CLIENT_SECRET --value 네이버Secret --visibility sensitive
   ```
   명령 옵션이 다르다는 오류가 나면 `eas env:create --help`로 확인한다. `EXPO_PUBLIC_` 변수는 앱에 포함되므로 secret 공개 범위는 쓸 수 없다.
4. 빌드
   ```
   eas build -p android --profile preview
   ```
   "Generate a new Android Keystore?"에는 Yes. 끝나면 APK 다운로드 링크와 QR이 나온다.
5. 안드로이드 폰에서 링크를 열어 설치. "출처를 알 수 없는 앱 설치"를 허용한다.

## 설치 후 확인
- 첫 화면에서 신체 활동 권한 허용 → 몇 걸음 걸으면 "앱 실행 중 측정" 숫자가 오르는지
- 혜택 지도·가게 상세에서 지도 대신 "네이버 지도 / 카카오맵" 버튼이 보이고 열리는지
- 동네 탐색 검색(키 등록이 맞는지)
- 시연용 데이터 → 보상 → 쿠폰 교환 → 쿠폰함 → 사장님 화면

이 문서 작성 시점에는 실제 EAS 빌드와 안드로이드 설치를 실행하지 않았다.
