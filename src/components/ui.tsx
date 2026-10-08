import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors } from '../theme';

type BtnKind = 'primary' | 'ghost' | 'danger';

export function Btn({ label, onPress, kind = 'ghost', disabled, style }: {
  label: string; onPress: () => void; kind?: BtnKind; disabled?: boolean; style?: ViewStyle;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [s.btn, s[kind], disabled && s.disabled, pressed && { opacity: 0.7 }, style]}
    >
      <Text style={[s.btnText, kind === 'primary' && { color: '#fff' }, kind === 'danger' && { color: colors.danger }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Chip({ label, on, onPress, muted }: { label: string; on: boolean; onPress: () => void; muted?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={[s.chip, muted && s.chipMuted, on && (muted ? s.chipMutedOn : s.chipOn)]}
    >
      <Text style={[s.chipText, on && !muted && { color: '#fff' }, on && muted && { color: colors.ink }]}>{label}</Text>
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

export function Tag({ label, tone = 'rose' }: { label: string; tone?: 'rose' | 'route' | 'done' | 'muted' }) {
  const bg = { rose: colors.roseSoft, route: colors.routeSoft, done: colors.doneSoft, muted: colors.line }[tone];
  const fg = { rose: colors.rose, route: colors.route, done: colors.done, muted: colors.muted }[tone];
  return <Text style={[s.tag, { backgroundColor: bg, color: fg }]}>{label}</Text>;
}

const s = StyleSheet.create({
  btn: { minHeight: 48, paddingVertical: 14, paddingHorizontal: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: colors.rose },
  ghost: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  danger: { backgroundColor: '#FFF3F3', borderWidth: 1, borderColor: '#F2D9DD' },
  disabled: { opacity: 0.48 },
  btnText: { fontSize: 15, fontWeight: '700', color: colors.ink },
  group: { marginBottom: 22 },
  groupLabel: { fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 24, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  chipOn: { backgroundColor: colors.rose, borderColor: colors.rose },
  chipMuted: { borderStyle: 'dashed' },
  chipMutedOn: { backgroundColor: colors.line, borderColor: colors.muted },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.ink },
  hint: { fontSize: 12, color: colors.muted, marginTop: -6, marginBottom: 8 },
  section: { fontSize: 19, fontWeight: '800', letterSpacing: -0.4, color: colors.ink },
  tag: { fontSize: 12, fontWeight: '600', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 10, overflow: 'hidden' },
});

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
    <View style={{ marginTop: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
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
    <View style={[cardStyle, { padding: 16 }]}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)}
        style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Text style={{ color: colors.ink, fontSize: 15, fontWeight: '700' }}>{title}</Text>
        <Text style={{ color: colors.muted, fontSize: 13 }}>{open ? '접기 −' : '펼치기 +'}</Text>
      </Pressable>
      {open && <View style={{ marginTop: 12 }}>{children}</View>}
    </View>
  );
}

export const inputStyle = {
  backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 12,
  paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: colors.ink, minHeight: 44,
} as const;

export const cardStyle = {
  backgroundColor: colors.card, borderRadius: 24, padding: 20, marginBottom: 10, borderWidth: 1, borderColor: colors.line,
} as const;
