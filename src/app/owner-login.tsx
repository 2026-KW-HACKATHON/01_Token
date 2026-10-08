import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BottomCTA, Btn, cardStyle, IconBox, Notice, T } from '../components/ui';
import { WALK_STORES } from '../data/walkStores';
import { checkOwnerPin, saveOwnerSession } from '../lib/ownerSession';
import { colors, STORE_ICON } from '../theme';

/** 시연용 사장님 로그인: 가게 선택 + 4자리 PIN → 자기 가게 성과만 보기 */
export default function OwnerLogin() {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  async function login() {
    if (!storeId) { setError('가게를 먼저 골라 주세요.'); return; }
    if (!checkOwnerPin(storeId, pin)) { setError('PIN이 맞지 않아요. 다시 입력해 주세요.'); setPin(''); return; }
    await saveOwnerSession(storeId);
    setError('');
    router.replace('/store-report');
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <Stack.Screen options={{ title: '사장님 로그인' }} />
      <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
        <Text style={[T.hero, s.hero]}>우리 가게 성과는{'\n'}사장님만 볼 수 있어요</Text>
        <Notice
          text="시연용 로그인이에요. PIN은 앱에 정해 둔 시연용 번호이고, 성과는 이 기기의 기록만 집계해요. 실제 서비스에서는 사업자 확인을 거친 서버 계정으로 로그인해요."
          style={{ marginBottom: 12 }}
        />

        <View style={cardStyle}>
          <Text style={s.label}>1. 내 가게 선택</Text>
          {WALK_STORES.map((st, i) => {
            const on = storeId === st.id;
            return (
              <Pressable
                key={st.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                onPress={() => { setStoreId(st.id); setError(''); }}
                style={[s.store, on && s.storeOn, i > 0 && { marginTop: 8 }]}
              >
                <IconBox icon={STORE_ICON[st.category] ?? '🏪'} size={40} bg={on ? colors.card : colors.fill} />
                <Text style={[s.storeName, on && { color: colors.primary }]} numberOfLines={1}>{st.name}</Text>
                <View style={[s.radio, on && s.radioOn]}>{on && <View style={s.radioDot} />}</View>
              </Pressable>
            );
          })}
        </View>

        <View style={cardStyle}>
          <Text style={s.label}>2. 사장님 PIN (4자리)</Text>
          <TextInput
            value={pin}
            onChangeText={(t) => { setPin(t.replace(/[^0-9]/g, '').slice(0, 4)); setError(''); }}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            placeholder="● ● ● ●"
            placeholderTextColor={colors.faint}
            style={s.pin}
            onSubmitEditing={login}
          />
          {error ? <Text style={s.error}>{error}</Text> : null}
        </View>
      </ScrollView>
      <BottomCTA>
        <Btn label="로그인하고 성과 보기" kind="primary" size="lg" disabled={!storeId || pin.length !== 4} onPress={login} />
      </BottomCTA>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 24 },
  hero: { marginHorizontal: 4, marginBottom: 14 },
  label: { fontSize: 16, fontWeight: '700', color: colors.ink, marginBottom: 12 },
  store: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, backgroundColor: colors.fill, borderWidth: 2, borderColor: colors.fill },
  storeOn: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  storeName: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.ink },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.faint, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  pin: { backgroundColor: colors.fill, borderRadius: 14, paddingVertical: 14, fontSize: 24, letterSpacing: 12, textAlign: 'center', color: colors.ink, fontWeight: '700' },
  error: { color: colors.danger, fontSize: 14, fontWeight: '600', marginTop: 10 },
});
