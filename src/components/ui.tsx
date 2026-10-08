import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../theme';

/* ───────── 버튼 ───────── */

type BtnKind = 'primary' | 'secondary' | 'ghost' | 'danger' | 'text';

const BTN_BG: Record<BtnKind, string> = {
  primary: colors.primary, secondary: colors.primarySoft, ghost: colors.fill, danger: colors.dangerSoft, text: 'transparent',
};
const BTN_FG: Record<BtnKind, string> = {
  primary: '#FFFFFF', secondary: colors.primary, ghost: colors.sub, danger: colors.danger, text: colors.muted,
};

export function Btn({ label, onPress, kind = 'ghost', disabled, style, size = 'md' }: {
  label: string; onPress: () => void; kind?: BtnKind; disabled?: boolean; style?: ViewStyle; size?: 'md' | 'lg';
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.btn,
        size === 'lg' && s.btnLg,
        { backgroundColor: disabled ? colors.line : BTN_BG[kind] },
        pressed && !disabled && { backgroundColor: kind === 'primary' ? colors.primaryPressed : kind === 'text' ? colors.fill : BTN_BG[kind], transform: [{ scale: 0.98 }] },
        style,
      ]}
    >
      <Text style={[s.btnText, size === 'lg' && { fontSize: 17 }, { color: disabled ? colors.faint : BTN_FG[kind] }]}>
        {label}
      </Text>
    </Pressable>
  );
}

/** 화면 아래에 붙는 큰 버튼 영역 */
export function BottomCTA({ children, note }: { children: React.ReactNode; note?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.cta, { paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>
      {note ? <Text style={s.ctaNote}>{note}</Text> : null}
      {children}
    </View>
  );
}

/* ───────── 칩 ───────── */

export function Chip({ label, on, onPress, muted }: { label: string; on: boolean; onPress: () => void; muted?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={({ pressed }) => [s.chip, on && s.chipOn, muted && !on && s.chipMuted, pressed && { opacity: 0.75 }]}
    >
      <Text style={[s.chipText, on && { color: '#FFFFFF' }]}>{label}</Text>
    </Pressable>
  );
}

export function ChipGroup({ label, options, value, onChange, allowSkip = true, labels }: {
  label: string; options: readonly string[]; value?: string; onChange: (v?: string) => void;
  allowSkip?: boolean; labels?: Record<string, string>;
}) {
  return (
    <View style={s.group}>
      <Text style={s.groupLabel}>{label}</Text>
      <View style={s.chips}>
        {options.map((o) => (
          <Chip key={o} label={labels?.[o] ?? o} on={value === o}
            onPress={() => onChange(value === o && allowSkip ? undefined : o)} />
        ))}
        {allowSkip && <Chip label="상관없음" muted on={value === undefined} onPress={() => onChange(undefined)} />}
      </View>
    </View>
  );
}

export function MultiChipGroup({ label, options, values, onChange, hint }: {
  label: string; options: { value: string; label: string }[]; values: string[];
  onChange: (v: string[]) => void; hint?: string;
}) {
  const toggle = (v: string) => onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  return (
    <View style={s.group}>
      <Text style={s.groupLabel}>{label}</Text>
      {hint ? <Text style={s.hint}>{hint}</Text> : null}
      <View style={s.chips}>
        {options.map((o) => <Chip key={o.value} label={o.label} on={values.includes(o.value)} onPress={() => toggle(o.value)} />)}
        <Chip label="상관없음" muted on={values.length === 0} onPress={() => onChange([])} />
      </View>
    </View>
  );
}

/* ───────── 작은 표시 ───────── */

export function Tag({ label, tone = 'rose' }: { label: string; tone?: 'rose' | 'route' | 'done' | 'muted' | 'warn' }) {
  const bg = { rose: colors.primarySoft, route: colors.primarySoft, done: colors.successSoft, muted: colors.fill, warn: colors.warnBg }[tone];
  const fg = { rose: colors.primary, route: colors.primary, done: colors.success, muted: colors.sub, warn: colors.warnText }[tone];
  return <Text style={[s.tag, { backgroundColor: bg, color: fg }]}>{label}</Text>;
}

/** 시연용 안내 등 노란 알림 띠 */
export function Notice({ text, style }: { text: string; style?: ViewStyle }) {
  return (
    <View style={[s.notice, style]}>
      <Text style={s.noticeIcon}>ⓘ</Text>
      <Text style={s.noticeText}>{text}</Text>
    </View>
  );
}

/** 둥근 사각 아이콘 상자 */
export function IconBox({ icon, size = 44, bg = colors.fill }: { icon: string; size?: number; bg?: string }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.32, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.5 }}>{icon}</Text>
    </View>
  );
}

export function ProgressBar({ value, color = colors.primary, height = 8, style }: { value: number; color?: string; height?: number; style?: ViewStyle }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View style={[{ height, borderRadius: height / 2, backgroundColor: colors.fill, overflow: 'hidden' }, style]}>
      <View style={{ width: `${pct}%`, height, borderRadius: height / 2, backgroundColor: color }} />
    </View>
  );
}

/** 목록 한 줄: 아이콘 · 제목/부제 · 오른쪽 값 · › */
export function ListRow({ icon, title, sub, subColor, right, onPress, last }: {
  icon?: string; title: string; sub?: string; subColor?: string; right?: React.ReactNode; onPress?: () => void; last?: boolean;
}) {
  const body = (
    <View style={[s.row, !last && s.rowGap]}>
      {icon ? <IconBox icon={icon} /> : null}
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle} numberOfLines={1}>{title}</Text>
        {sub ? <Text style={[s.rowSub, subColor ? { color: subColor } : null]} numberOfLines={2}>{sub}</Text> : null}
      </View>
      {typeof right === 'string' ? <Text style={s.rowRight}>{right}</Text> : right}
      {onPress ? <Text style={s.chev}>›</Text> : null}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
      {body}
    </Pressable>
  );
}

/** 표 형식 한 줄 (왼쪽 이름 · 오른쪽 값) */
export function InfoRow({ label, value, valueStyle }: { label: string; value: string; valueStyle?: TextStyle }) {
  return (
    <View style={s.info}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={[s.infoValue, valueStyle]}>{value}</Text>
    </View>
  );
}

/* ───────── 레이아웃 ───────── */

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <View style={s.group}>
      <Text style={s.groupLabel}>{label}</Text>
      {hint ? <Text style={s.hint}>{hint}</Text> : null}
      {children}
    </View>
  );
}

export function Section({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <View style={{ marginTop: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 4 }}>
        <Text style={s.section}>{title}</Text>
        {right}
      </View>
      {children}
    </View>
  );
}

export function Disclosure({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={[cardStyle, { paddingVertical: 6 }]}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)}
        style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Text style={{ color: colors.ink, fontSize: 16, fontWeight: '600' }}>{title}</Text>
        <Text style={{ color: colors.faint, fontSize: 18, transform: [{ rotate: open ? '-90deg' : '90deg' }] }}>›</Text>
      </Pressable>
      {open && <View style={{ paddingBottom: 16 }}>{children}</View>}
    </View>
  );
}

export const inputStyle = {
  backgroundColor: colors.card, borderWidth: 0, borderRadius: 14,
  paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: colors.ink, minHeight: 50,
} as const;

export const cardStyle = {
  backgroundColor: colors.card, borderRadius: radius.card, padding: 22, marginBottom: 12,
} as const;

/** 공통 글자 스타일 */
export const T = StyleSheet.create({
  hero: { fontSize: 26, lineHeight: 35, fontWeight: '700', color: colors.ink, letterSpacing: -0.6 },
  title: { fontSize: 20, lineHeight: 28, fontWeight: '700', color: colors.ink, letterSpacing: -0.4 },
  label: { fontSize: 16, fontWeight: '600', color: colors.sub },
  body: { fontSize: 15, lineHeight: 22, color: colors.sub },
  caption: { fontSize: 14, lineHeight: 20, color: colors.muted, fontWeight: '500' },
  num: { fontWeight: '700', color: colors.ink, fontVariant: ['tabular-nums'], letterSpacing: -1 },
});

const s = StyleSheet.create({
  btn: { minHeight: 48, paddingVertical: 13, paddingHorizontal: 18, borderRadius: radius.btn, alignItems: 'center', justifyContent: 'center' },
  btnLg: { minHeight: 56, borderRadius: radius.btn },
  btnText: { fontSize: 15, fontWeight: '600' },
  cta: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: colors.card, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  ctaNote: { fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: 10 },
  group: { marginBottom: 22 },
  groupLabel: { fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 38, justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 19, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipMuted: { backgroundColor: colors.card },
  chipText: { fontSize: 15, fontWeight: '600', color: colors.sub },
  hint: { fontSize: 14, color: colors.muted, marginTop: -6, marginBottom: 8 },
  section: { fontSize: 20, fontWeight: '700', letterSpacing: -0.4, color: colors.ink },
  tag: { fontSize: 13, fontWeight: '700', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, overflow: 'hidden' },
  notice: { flexDirection: 'row', gap: 8, backgroundColor: colors.warnBg, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14 },
  noticeIcon: { color: colors.warnText, fontSize: 13, fontWeight: '700', lineHeight: 19 },
  noticeText: { flex: 1, color: colors.warnText, fontSize: 14, fontWeight: '500', lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 56 },
  rowGap: { marginBottom: 18 },
  rowTitle: { fontSize: 17, fontWeight: '700', color: colors.ink, letterSpacing: -0.2 },
  rowSub: { fontSize: 15, color: colors.muted, marginTop: 3, lineHeight: 19 },
  rowRight: { fontSize: 15, fontWeight: '600', color: colors.ink },
  chev: { fontSize: 22, color: colors.faint, marginLeft: 2, marginTop: -2 },
  info: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, paddingVertical: 9 },
  infoLabel: { fontSize: 16, color: colors.muted },
  infoValue: { fontSize: 16, fontWeight: '600', color: colors.ink, flexShrink: 1, textAlign: 'right' },
});
