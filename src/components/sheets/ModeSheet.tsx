import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SheetFrame } from './SheetFrame';
import { colors, controlSize, radii, spacing, typography } from '@/ui/tokens';

interface ModeSheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onEndless: () => void;
}

export function ModeSheet({ visible, onClose, onEndless }: ModeSheetProps) {
  return (
    <SheetFrame visible={visible} title="Режим игры" onClose={onClose}>
      <ModeOption label="Бесконечный" description="Спокойная игра без таймера" onPress={onEndless} />
      <ModeOption label="На время" description="Скоро" disabled />
      <ModeOption label="Разминирование" description="Скоро" disabled />
    </SheetFrame>
  );
}

interface ModeOptionProps {
  readonly label: string;
  readonly description: string;
  readonly disabled?: boolean;
  readonly onPress?: () => void;
}

function ModeOption({ label, description, disabled = false, onPress }: ModeOptionProps) {
  const accessibilityLabel = disabled ? `${label}, ${description}` : label;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.option, pressed && styles.pressed, disabled && styles.disabled]}>
      <View style={styles.modeMark} />
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    minHeight: controlSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.sky,
  },
  pressed: { opacity: 0.75, borderColor: colors.focus },
  disabled: { opacity: 0.45, borderColor: colors.textMuted },
  modeMark: { width: 16, height: 16, borderRadius: 4, borderWidth: 2, borderColor: colors.mint },
  copy: { flex: 1 },
  label: { color: colors.text, fontFamily: typography.semibold, fontSize: 16 },
  description: { color: colors.textMuted, fontFamily: typography.regular, fontSize: 13 },
});
