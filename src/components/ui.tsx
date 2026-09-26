import React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors } from '../theme';

type BtnKind = 'primary' | 'ghost' | 'danger';

export function Btn({ label, onPress, kind = 'ghost', disabled, style }: {
  label: string; onPress: () => void; kind?: BtnKind; disabled?: boolean; style?: ViewStyle;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [s.btn, s[kind], disabled && s.disabled, pressed && { opacity: 0.7 }, style]}
    >
      <Text style={[s.btnText, kind === 'primary' && { color: '#fff' }, kind === 'danger' && { color: colors.rose }]}>
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

export function ChipGroup({ label, options, value, onChange }: {
  label: string; options: readonly string[]; value?: string; onChange: (v?: string) => void;
}) {
  return (
    <View style={s.group}>
      <Text style={s.groupLabel}>{label}</Text>
      <View style={s.chips}>
        {options.map((o) => (
          <Chip key={o} label={o} on={value === o} onPress={() => onChange(value === o ? undefined : o)} />
        ))}
        <Chip label="상관없음" muted on={value === undefined} onPress={() => onChange(undefined)} />
      </View>
    </View>
  );
}

export function Tag({ label, tone = 'rose' }: { label: string; tone?: 'rose' | 'route' | 'done' }) {
  const bg = tone === 'rose' ? colors.roseSoft : tone === 'route' ? colors.routeSoft : colors.doneSoft;
  const fg = tone === 'rose' ? colors.rose : tone === 'route' ? colors.route : colors.done;
  return <Text style={[s.tag, { backgroundColor: bg, color: fg }]}>{label}</Text>;
}

const s = StyleSheet.create({
  btn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: colors.rose },
  ghost: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  danger: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.roseSoft },
  disabled: { opacity: 0.4 },
  btnText: { fontSize: 15, fontWeight: '600', color: colors.ink },
  group: { marginBottom: 22 },
  groupLabel: { fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  chipOn: { backgroundColor: colors.rose, borderColor: colors.rose },
  chipMuted: { borderStyle: 'dashed' },
  chipMutedOn: { backgroundColor: colors.line, borderColor: colors.muted },
  chipText: { fontSize: 14, color: colors.ink },
  tag: { fontSize: 12, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6, overflow: 'hidden' },
});
