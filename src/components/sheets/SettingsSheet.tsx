import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { SheetFrame } from './SheetFrame';
import { Settings } from '@/storage/schema';
import { colors, controlSize, radii, spacing, typography } from '@/ui/tokens';

interface SettingsSheetProps {
  readonly visible: boolean;
  readonly settings: Settings;
  readonly onClose: () => void;
  readonly onUpdate: (settings: Partial<Settings>) => void;
}

export function SettingsSheet({ visible, settings, onClose, onUpdate }: SettingsSheetProps) {
  const updateVolume = (change: number) => {
    const effectsVolume = Math.round(Math.min(1, Math.max(0, settings.effectsVolume + change)) * 100) / 100;
    onUpdate({ effectsVolume });
  };
  return (
    <SheetFrame visible={visible} title="Настройки" onClose={onClose}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={styles.label}>Громкость эффектов</Text>
          <Text style={styles.value}>{Math.round(settings.effectsVolume * 100)}%</Text>
        </View>
        <VolumeButton label="Уменьшить громкость эффектов" mark="−" disabled={settings.effectsVolume <= 0} onPress={() => updateVolume(-0.1)} />
        <VolumeButton label="Увеличить громкость эффектов" mark="+" disabled={settings.effectsVolume >= 1} onPress={() => updateVolume(0.1)} />
      </View>
      <SettingSwitch label="Тактильный отклик" value={settings.haptics} onValueChange={(haptics) => onUpdate({ haptics })} />
      <SettingSwitch label="Уменьшение движения" value={settings.reducedMotion} onValueChange={(reducedMotion) => onUpdate({ reducedMotion })} />
    </SheetFrame>
  );
}

function VolumeButton({ label, mark, disabled, onPress }: { label: string; mark: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.stepper, pressed && styles.pressed, disabled && styles.disabled]}>
      <Text style={styles.stepperText}>{mark}</Text>
    </Pressable>
  );
}

function SettingSwitch({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (value: boolean) => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.background, true: colors.mint }}
        thumbColor={colors.text}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: controlSize, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  copy: { flex: 1 },
  label: { flex: 1, color: colors.text, fontFamily: typography.semibold, fontSize: 16 },
  value: { color: colors.textMuted, fontFamily: typography.regular, fontSize: 13 },
  stepper: {
    width: controlSize,
    height: controlSize,
    borderRadius: radii.control,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.sky,
  },
  pressed: { opacity: 0.7, borderColor: colors.focus },
  disabled: { opacity: 0.4 },
  stepperText: { color: colors.text, fontFamily: typography.semibold, fontSize: 24 },
});
