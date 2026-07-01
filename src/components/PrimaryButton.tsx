import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { colors, controlSize, radii, spacing, typography } from '@/ui/tokens';

interface PrimaryButtonProps {
  readonly label: string;
  readonly onPress: () => void;
  readonly disabled?: boolean;
  readonly variant?: 'primary' | 'secondary' | 'quiet';
  readonly style?: ViewStyle;
}

export function PrimaryButton({ label, onPress, disabled = false, variant = 'primary', style }: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' ? styles.primary : variant === 'secondary' ? styles.secondary : styles.quiet,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      <Text style={[styles.label, variant === 'quiet' && styles.quietLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: controlSize,
    minWidth: controlSize,
    borderRadius: radii.control,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  primary: { backgroundColor: colors.coral },
  secondary: { backgroundColor: colors.surfaceRaised, borderColor: colors.sky },
  quiet: { backgroundColor: 'transparent', borderColor: colors.textMuted },
  pressed: { opacity: 0.72, borderColor: colors.focus },
  disabled: { opacity: 0.42 },
  label: { color: colors.text, fontFamily: typography.semibold, fontSize: 16 },
  quietLabel: { color: colors.textMuted },
});
