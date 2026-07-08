import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../PrimaryButton';
import { Settings } from '../../storage/schema';
import { colors, radii, spacing, typography } from '../../ui/tokens';
import { SheetFrame } from './SheetFrame';

interface SettingsSheetProps {
  readonly settings: Settings;
  readonly onClose: () => void;
  readonly onUpdate: (settings: Partial<Settings>) => void;
}

export function SettingsSheet({ settings, onClose, onUpdate }: SettingsSheetProps) {
  const volumePercent = Math.round(settings.effectsVolume * 100);
  return (
    <SheetFrame title="Настройки" onClose={onClose}>
      <View style={styles.row}>
        <Text style={styles.label}>Громкость {volumePercent}%</Text>
        <PrimaryButton
          variant="secondary"
          label="+"
          accessibilityLabel="Увеличить громкость эффектов"
          onPress={() => onUpdate({ effectsVolume: Math.min(1, settings.effectsVolume + 0.1) })}
          style={styles.smallButton}
        />
      </View>
      <SwitchRow label="Вибрация" checked={settings.haptics} onPress={() => onUpdate({ haptics: !settings.haptics })} />
      <SwitchRow label="Меньше анимации" checked={settings.reducedMotion} onPress={() => onUpdate({ reducedMotion: !settings.reducedMotion })} />
    </SheetFrame>
  );
}

function SwitchRow({ label, checked, onPress }: { readonly label: string; readonly checked: boolean; readonly onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      aria-checked={checked}
      onPress={onPress}
      style={styles.row}
    >
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.switchTrack, checked && styles.switchTrackOn]}>
        <View style={[styles.switchThumb, checked && styles.switchThumbOn]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    borderRadius: radii.control,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
  },
  label: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 16,
    fontWeight: '700',
  },
  smallButton: {
    width: 56,
    paddingHorizontal: 0,
  },
  switchTrack: {
    width: 52,
    height: 32,
    borderRadius: radii.pill,
    padding: 3,
    backgroundColor: colors.surfaceRaised,
  },
  switchTrackOn: {
    backgroundColor: colors.mint,
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: radii.pill,
    backgroundColor: colors.text,
  },
  switchThumbOn: {
    transform: [{ translateX: 20 }],
  },
});
