import { useState } from 'react';
import { Text, View } from 'react-native';
import { PrimaryButton } from '../PrimaryButton';
import { colors, spacing, typography } from '../../ui/tokens';
import { ConfirmSheet } from './ConfirmSheet';
import { SheetFrame } from './SheetFrame';

interface PauseSheetProps {
  readonly onContinue: () => void;
  readonly onRestart: () => void;
  readonly onFinish: () => void;
}

export function PauseSheet({ onContinue, onRestart, onFinish }: PauseSheetProps) {
  const [confirmRestart, setConfirmRestart] = useState(false);

  if (confirmRestart) {
    return (
      <ConfirmSheet
        title="Начать заново?"
        message="Текущая партия будет заменена новой Endless-сессией."
        confirmLabel="Начать новую"
        onCancel={() => setConfirmRestart(false)}
        onConfirm={onRestart}
      />
    );
  }

  return (
    <SheetFrame title="Пауза" onClose={onContinue}>
      <Text style={{ color: colors.textMuted, fontFamily: typography.family }}>
        Можно продолжить с этого места, начать заново или завершить игру и получить XP.
      </Text>
      <View style={{ gap: spacing.sm }}>
        <PrimaryButton label="Продолжить" onPress={onContinue} />
        <PrimaryButton variant="secondary" label="Начать заново" onPress={() => setConfirmRestart(true)} />
        <PrimaryButton variant="ghost" label="Завершить игру" onPress={onFinish} />
      </View>
    </SheetFrame>
  );
}
