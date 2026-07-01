import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '../PrimaryButton';
import { SheetFrame } from './SheetFrame';
import { colors, spacing, typography } from '@/ui/tokens';

interface ConfirmSheetProps {
  readonly visible: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

export function ConfirmSheet({ visible, onCancel, onConfirm }: ConfirmSheetProps) {
  return (
    <SheetFrame visible={visible} title="Начать заново?" onClose={onCancel} alert>
      <Text style={styles.message}>Текущая партия будет заменена новой.</Text>
      <View style={styles.actions}>
        <PrimaryButton label="Отмена" variant="quiet" onPress={onCancel} style={styles.action} />
        <PrimaryButton label="Начать заново" onPress={onConfirm} style={styles.action} />
      </View>
    </SheetFrame>
  );
}

const styles = StyleSheet.create({
  message: { color: colors.textMuted, fontFamily: typography.regular, fontSize: 15 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
});
