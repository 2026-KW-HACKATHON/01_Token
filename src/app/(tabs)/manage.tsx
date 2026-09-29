import * as Location from 'expo-location';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { regionName } from '../../api/kakao';
import { Btn, cardStyle, Chip, Section, Tag } from '../../components/ui';
import { FOCUS_DONG } from '../../lib/focus';
import { closedDaysText, hoursText, paymentLabel, perkWindow } from '../../lib/hours';
import { HOME_RADIUS_M, homeVerifiedCount, isResident, RESIDENT_MIN_VERIFIED, STAT_LABEL, statSummary } from '../../lib/local';
import { monthLabel, openPlace } from '../../lib/nav';
import { useAppStore } from '../../store/AppStore';
import { colors } from '../../theme';
import type { PlaceInfo, ReviewStatus, Role } from '../../types';

const ROLE_LABEL: Record<Role, string> = { user: '일반 사용자', owner: '매장 운영자', admin: '관리자' };
const STATUS: Record<ReviewStatus, { label: string; tone: 'muted' | 'done' | 'rose' }> = {
  pending: { label: '검토 중', tone: 'muted' }, approved: { label: '승인', tone: 'done' }, rejected: { label: '반려', tone: 'rose' },
};
const date = (t: number) => { const d = new Date(t); return `${d.getMonth() + 1}/${d.getDate()}`; };

function infoLines(i: PlaceInfo | null) {
  if (!i) return '등록된 정보 없음';
  return [`영업 ${hoursText(i) ?? '미입력'}`, `휴무 ${closedDaysText(i) ?? '미입력'}`, i.menu && `메뉴 ${i.menu}`, i.intro && `소개 ${i.intro}`,
    i.payments?.length && `결제 ${i.payments.map(paymentLabel).join(', ')}`,
    i.perk && `혜택 ${i.perk}${perkWindow(i) ? ` (${perkWindow(i)})` : ''}`]
    .filter(Boolean).join('\n');
}

/** R-WFNRMT 장소 정보 운영 및 지역 콘텐츠 관리 (운영자·관리자) + 내 활동 */
export default function Manage() {
  const store = useAppStore();
  const role = store.role;

  return (
    <ScrollView style={{ backgroundColor: colors.paper }} contentContainerStyle={s.wrap}>
      <Text style={s.label}>역할 전환 (시연용)</Text>
      <View style={s.chips}>
        {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
          <Chip key={r} label={ROLE_LABEL[r]} on={role === r} onPress={() => store.setRole(r)} />
        ))}
      </View>
      <Text style={s.hint}>로그인 기능 전이라 역할을 직접 바꿔 시연해요. 데이터는 이 기기에만 저장돼요.</Text>

      {role === 'user' && userPanel()}
      {role === 'owner' && ownerPanel()}
      {role === 'admin' && adminPanel()}
    </ScrollView>
  );

  async function setMyHome() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('위치 권한이 꺼져 있어요', '내 동네는 현재 위치로만 설정할 수 있어요.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const name = (await regionName(lat, lng)) ?? '내 동네';
      store.setHome({ lat, lng, name, setAt: Date.now() });
    } catch {
      Alert.alert('현재 위치를 확인하지 못했어요', '잠시 후 다시 시도해 주세요.');
    }
  }

  function userPanel() {
    const count = homeVerifiedCount(store.home, store.reviews);
    const resident = isResident(store.home, store.reviews);
    return (
      <>
        <Section title="내 동네">
          <View style={cardStyle}>
            {store.home ? (
              <>
                <View style={s.between}>
                  <Text style={s.name}>{store.home.name}</Text>
                  {resident ? <Tag label="🏠 동네 주민" tone="rose" /> : <Tag label={`주민 인증 ${count}/${RESIDENT_MIN_VERIFIED}`} tone="muted" />}
                </View>
                <Text style={s.muted}>
                  {resident
                    ? `반경 ${HOME_RADIUS_M / 1000}km 안 가게에 남긴 방문 인증 후기에 '주민 추천' 배지가 붙어요.`
                    : `반경 ${HOME_RADIUS_M / 1000}km 안 가게에서 방문 인증 후기를 ${RESIDENT_MIN_VERIFIED - count}개 더 남기면 동네 주민이 돼요.`}
                </Text>
                <Btn label="현재 위치로 다시 설정" onPress={setMyHome} style={{ marginTop: 10 }} />
              </>
            ) : (
              <>
                <Text style={s.muted}>내 동네를 설정하고 동네 가게를 방문 인증하면, 내 후기에 '주민 추천' 배지가 붙어요.</Text>
                <Btn label="현재 위치를 내 동네로 설정" kind="primary" onPress={setMyHome} style={{ marginTop: 10 }} />
              </>
            )}
          </View>
        </Section>
        <Section title={`내 후기 ${store.reviews.length}`}>
          {store.reviews.length === 0 && <Text style={s.muted}>장소 상세 화면에서 후기를 남길 수 있어요.</Text>}
          {store.reviews.map((r) => (
            <View key={r.id} style={cardStyle}>
              <Text style={s.name}>{r.placeName}</Text>
              <Text style={s.muted}>{'★'.repeat(r.satisfaction)} {monthLabel(r.visitedMonth)}, {r.companion}와(과)</Text>
              <View style={s.tags}>{r.verified ? <Tag label="방문 인증" tone="done" /> : <Tag label="일반 후기" tone="muted" />}</View>
            </View>
          ))}
        </Section>
        <Section title={`내 정보 수정 요청 ${store.reports.length}`}>
          {store.reports.map((r) => (
            <View key={r.id} style={cardStyle}>
              <Text style={s.name}>{r.placeName}, {r.field}</Text>
              <Text style={s.muted}>{r.content}</Text>
              <View style={s.tags}><Tag label={r.status === 'resolved' ? '처리 완료' : '접수'} tone={r.status === 'resolved' ? 'done' : 'muted'} /></View>
            </View>
          ))}
        </Section>
      </>
    );
  }

  function ownerPanel() {
    const approved = store.ownerRequests.filter((r) => r.status === 'approved');
    return (
      <>
        <Section title="운영 권한 신청">
          {store.ownerRequests.length === 0 && (
            <Text style={s.muted}>코스 찾기나 주변 탐색에서 내 가게를 찾아 상세 화면의 '운영 권한 신청'을 눌러 주세요.</Text>
          )}
          {store.ownerRequests.map((r) => (
            <View key={r.id} style={cardStyle}>
              <Text style={s.name}>{r.place.name}</Text>
              <Text style={s.muted}>{date(r.createdAt)} 신청{r.decidedAt ? `, ${date(r.decidedAt)} 처리` : ''}</Text>
              <View style={s.tags}><Tag label={STATUS[r.status].label} tone={STATUS[r.status].tone} /></View>
              {r.status === 'approved' && <Btn label="가게 화면 열기" onPress={() => openPlace(r.place)} style={{ marginTop: 10 }} />}
            </View>
          ))}
        </Section>
        {approved.length > 0 && (
          <Section title="가게 리포트">
            {approved.map((a) => {
              const rows = statSummary(store.events[a.place.id]);
              const empty = rows.every((r) => r.total === 0);
              return (
                <View key={a.id} style={cardStyle}>
                  <Text style={s.name}>{a.place.name}</Text>
                  <View style={s.grid}>
                    {rows.map((r) => (
                      <View key={r.t} style={s.stat}>
                        <Text style={s.statVal}>{r.week}</Text>
                        <Text style={s.muted}>{STAT_LABEL[r.t]} (7일)</Text>
                        <Text style={s.muted}>누적 {r.total}</Text>
                      </View>
                    ))}
                  </View>
                  {empty && <Text style={[s.muted, { marginTop: 8 }]}>아직 기록이 없어요. 영업시간과 혜택을 등록하면 추천에 더 자주 나와요.</Text>}
                </View>
              );
            })}
            <Text style={s.hint}>지금은 이 기기에서 일어난 노출·저장·코스 담기·방문 인증만 집계돼요.</Text>
          </Section>
        )}
        {approved.length > 0 && (
          <Section title="정보 변경 이력">
            {store.infoEdits.filter((e) => approved.some((a) => a.place.id === e.placeId)).map((e) => (
              <View key={e.id} style={cardStyle}>
                <View style={s.between}>
                  <Text style={s.name}>{e.placeName}</Text>
                  <Tag label={STATUS[e.status].label} tone={STATUS[e.status].tone} />
                </View>
                <Text style={s.muted}>{date(e.createdAt)} 제출</Text>
                <Text style={s.diffLabel}>변경 전</Text><Text style={s.muted}>{infoLines(e.before)}</Text>
                <Text style={s.diffLabel}>변경 후</Text><Text style={s.body}>{infoLines(e.after)}</Text>
              </View>
            ))}
          </Section>
        )}
      </>
    );
  }

  function adminPanel() {
    const pendingOwners = store.ownerRequests.filter((r) => r.status === 'pending');
    const pendingEdits = store.infoEdits.filter((e) => e.status === 'pending');
    const openReports = store.reports.filter((r) => r.status === 'received');
    const hidden = Object.entries(store.hidden);
    const stops = store.courses.flatMap((c) => c.stops.map((st) => st.place)).filter((p) => p.dong);
    const focusRate = stops.length ? Math.round((stops.filter((p) => p.dong === FOCUS_DONG).length / stops.length) * 100) : null;
    const stats: [string, string][] = [
      [`코스 속 ${FOCUS_DONG} 가게`, focusRate == null ? '기록 없음' : `${focusRate}%`],
      ['코스', `${store.courses.length} (완료 ${store.courses.filter((c) => c.status === 'done').length})`],
      ['저장 장소', `${store.saved.length}`],
      ['후기', `${store.reviews.length} (인증 ${store.reviews.filter((r) => r.verified).length})`],
      ['정보 신고', `접수 ${openReports.length}, 처리 ${store.reports.length - openReports.length}`],
      ['운영자 등록 가게', `${store.ownerRequests.filter((r) => r.status === 'approved').length}`],
      ['비공개 장소', `${hidden.length}`],
    ];
    return (
      <>
        <Section title="운영 현황">
          <View style={s.grid}>
            {stats.map(([k, v]) => (
              <View key={k} style={s.stat}><Text style={s.statVal}>{v}</Text><Text style={s.muted}>{k}</Text></View>
            ))}
          </View>
        </Section>

        <Section title={`운영 권한 신청 ${pendingOwners.length}`}>
          {pendingOwners.length === 0 && <Text style={s.muted}>검토할 신청이 없어요.</Text>}
          {pendingOwners.map((r) => (
            <View key={r.id} style={cardStyle}>
              <Text style={s.name}>{r.place.name}</Text>
              <Text style={s.muted}>{r.applicant}, {r.contact}{'\n'}증빙: {r.proof}</Text>
              <View style={s.btnRow}>
                <Btn label="승인" kind="primary" onPress={() => store.decideOwner(r.id, true)} style={{ flex: 1 }} />
                <Btn label="거절" kind="danger" onPress={() => store.decideOwner(r.id, false)} style={{ flex: 1 }} />
              </View>
            </View>
          ))}
        </Section>

        <Section title={`정보 변경 검수 ${pendingEdits.length}`}>
          {pendingEdits.length === 0 && <Text style={s.muted}>검수할 변경이 없어요.</Text>}
          {pendingEdits.map((e) => (
            <View key={e.id} style={cardStyle}>
              <Text style={s.name}>{e.placeName}</Text>
              <Text style={s.diffLabel}>변경 전</Text><Text style={s.muted}>{infoLines(e.before)}</Text>
              <Text style={s.diffLabel}>변경 후</Text><Text style={s.body}>{infoLines(e.after)}</Text>
              <View style={s.btnRow}>
                <Btn label="게시" kind="primary" onPress={() => store.decideInfoEdit(e.id, true)} style={{ flex: 1 }} />
                <Btn label="반려" kind="danger" onPress={() => store.decideInfoEdit(e.id, false)} style={{ flex: 1 }} />
              </View>
            </View>
          ))}
        </Section>

        <Section title={`정보 신고 ${openReports.length}`}>
          {openReports.length === 0 && <Text style={s.muted}>처리할 신고가 없어요.</Text>}
          {openReports.map((r) => (
            <View key={r.id} style={cardStyle}>
              <Text style={s.name}>{r.placeName}, {r.field}</Text>
              <Text style={s.muted}>{r.content}</Text>
              <Btn label="처리 완료" onPress={() => store.resolveReport(r.id)} style={{ marginTop: 10 }} />
            </View>
          ))}
        </Section>

        <Section title={`비공개 장소 ${hidden.length}`}>
          {hidden.length === 0 && <Text style={s.muted}>장소 상세 화면에서 중복·허위 장소를 비공개 처리할 수 있어요.</Text>}
          {hidden.map(([id, h]) => (
            <View key={id} style={[cardStyle, s.between]}>
              <View style={{ flex: 1 }}><Text style={s.name}>{h.name}</Text><Text style={s.muted}>{h.reason}</Text></View>
              <Btn label="다시 공개" onPress={() => store.unhidePlace(id)} />
            </View>
          ))}
        </Section>
      </>
    );
  }
}

const s = StyleSheet.create({
  wrap: { padding: 20, paddingBottom: 60 },
  label: { fontSize: 15, fontWeight: '700', color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  hint: { fontSize: 12, color: colors.muted, marginTop: 8, lineHeight: 17 },
  muted: { fontSize: 13, color: colors.muted, marginTop: 2, lineHeight: 19 },
  body: { fontSize: 13, color: colors.ink, lineHeight: 19 },
  name: { fontSize: 15, fontWeight: '700', color: colors.ink },
  tags: { flexDirection: 'row', gap: 6, marginTop: 8 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  diffLabel: { fontSize: 12, fontWeight: '700', color: colors.ink, marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: { width: '48%', backgroundColor: colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.line },
  statVal: { fontSize: 18, fontWeight: '800', color: colors.ink },
});
