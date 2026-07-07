import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { PrimaryButton } from '../PrimaryButton';
import { Profile } from '../../storage/schema';
import { colors, radii, spacing, typography } from '../../ui/tokens';
import { SheetFrame } from './SheetFrame';

interface ProfileSheetProps {
  readonly profile: Profile;
  readonly onClose: () => void;
  readonly onSave: (nickname: string) => boolean;
}

export function ProfileSheet({ profile, onClose, onSave }: ProfileSheetProps) {
  const [nickname, setNickname] = useState(profile.nickname);
  const [error, setError] = useState<string | null>(null);
  return (
    <SheetFrame title="Профиль" onClose={onClose}>
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>Аватар позже</Text>
      </View>
      <TextInput
        accessibilityLabel="Никнейм"
        placeholder="Никнейм"
        placeholderTextColor={colors.textSubtle}
        value={nickname}
        onChangeText={(value) => {
          setNickname(value);
          setError(null);
        }}
        style={styles.input}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton
        label="Сохранить"
        accessibilityLabel="Сохранить никнейм"
        onPress={() => {
          if (onSave(nickname)) {
            onClose();
            return;
          }
          setError('Никнейм должен быть от 2 до 16 символов');
        }}
      />
    </SheetFrame>
  );
}

const styles = StyleSheet.create({
  avatarPlaceholder: {
    minHeight: 72,
    borderRadius: radii.card,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
  },
  avatarText: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontWeight: '700',
  },
  input: {
    minHeight: 48,
    borderRadius: radii.control,
    paddingHorizontal: spacing.md,
    color: colors.text,
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
    fontFamily: typography.family,
    fontSize: 16,
  },
  error: {
    color: colors.danger,
    fontFamily: typography.family,
  },
});
