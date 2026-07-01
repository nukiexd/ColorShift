import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '../PrimaryButton';
import { SheetFrame } from './SheetFrame';
import { Profile } from '@/storage/schema';
import { colors, radii, spacing, typography } from '@/ui/tokens';

interface ProfileSheetProps {
  readonly visible: boolean;
  readonly profile: Profile;
  readonly onClose: () => void;
  readonly onSave: (nickname: string) => boolean;
}

export function ProfileSheet({ visible, profile, onClose, onSave }: ProfileSheetProps) {
  const [nickname, setNickname] = useState(profile.nickname);
  const [error, setError] = useState(false);

  const save = () => {
    if (!onSave(nickname)) {
      setError(true);
      return;
    }
    setError(false);
    onClose();
  };

  return (
    <SheetFrame visible={visible} title="Профиль" onClose={onClose}>
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel="Аватар недоступен"
        accessibilityState={{ disabled: true }}
        style={styles.avatar}>
        <View style={styles.avatarMark} />
      </View>
      <Text style={styles.hint}>Смена аватара появится позже</Text>
      <Text style={styles.label}>Никнейм</Text>
      <TextInput
        accessibilityLabel="Никнейм"
        value={nickname}
        onChangeText={(value) => { setNickname(value); setError(false); }}
        maxLength={32}
        autoCapitalize="words"
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor={colors.textMuted}
      />
      {error && <Text accessibilityRole="alert" style={styles.error}>От 2 до 16 символов</Text>}
      <PrimaryButton label="Сохранить никнейм" onPress={save} />
    </SheetFrame>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 72,
    height: 72,
    alignSelf: 'center',
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 2,
    borderColor: colors.textMuted,
    opacity: 0.65,
  },
  avatarMark: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.textMuted },
  hint: { textAlign: 'center', color: colors.textMuted, fontFamily: typography.regular, fontSize: 13 },
  label: { color: colors.text, fontFamily: typography.semibold, fontSize: 14 },
  input: {
    minHeight: 48,
    color: colors.text,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.sky,
    borderRadius: radii.control,
    paddingHorizontal: spacing.md,
    fontFamily: typography.regular,
    fontSize: 16,
  },
  inputError: { borderColor: colors.coral },
  error: { color: colors.coral, fontFamily: typography.semibold, fontSize: 13 },
});
