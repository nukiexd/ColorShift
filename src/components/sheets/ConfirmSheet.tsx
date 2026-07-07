import { Text } from 'react-native';
import { PrimaryButton } from '../PrimaryButton';
import { colors, typography } from '../../ui/tokens';
import { SheetFrame } from './SheetFrame';

interface ConfirmSheetProps {
  readonly title: string;
  readonly message: string;
  readonly confirmLabel: string;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

export function ConfirmSheet({ title, message, confirmLabel, onCancel, onConfirm }: ConfirmSheetProps) {
  return (
    <SheetFrame title={title} onClose={onCancel}>
      <Text style={{ color: colors.textMuted, fontFamily: typography.family }}>{message}</Text>
      <PrimaryButton label={confirmLabel} onPress={onConfirm} />
      <PrimaryButton variant="ghost" label="Отмена" onPress={onCancel} />
    </SheetFrame>
  );
}
