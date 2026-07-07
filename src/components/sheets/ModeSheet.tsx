import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../PrimaryButton';
import { colors, radii, spacing, typography } from '../../ui/tokens';
import { SheetFrame } from './SheetFrame';

interface ModeSheetProps {
  readonly onClose: () => void;
  readonly onStartEndless: () => void;
}

export function ModeSheet({ onClose, onStartEndless }: ModeSheetProps) {
  return (
    <SheetFrame title="Выбери режим" onClose={onClose}>
      <PrimaryButton label="Бесконечный" accessibilityLabel="Бесконечный режим" onPress={onStartEndless} />
      <LockedMode title="На время" />
      <LockedMode title="Разминирование" />
    </SheetFrame>
  );
}

function LockedMode({ title }: { readonly title: string }) {
  return (
    <View style={styles.locked}>
      <View>
        <Text style={styles.modeTitle}>{title}</Text>
        <Text style={styles.modeDescription}>Добавим после полировки Endless</Text>
      </View>
      <Text style={styles.badge}>Скоро</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  locked: {
    minHeight: 64,
    borderRadius: radii.control,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    opacity: 0.72,
  },
  modeTitle: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 16,
    fontWeight: '800',
  },
  modeDescription: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 12,
  },
  badge: {
    overflow: 'hidden',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    color: colors.sun,
    backgroundColor: 'rgba(216, 182, 95, 0.12)',
    fontFamily: typography.family,
    fontWeight: '800',
  },
});
