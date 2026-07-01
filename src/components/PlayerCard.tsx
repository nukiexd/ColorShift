import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Profile } from '@/storage/schema';
import { colors, controlSize, radii, spacing, typography } from '@/ui/tokens';

interface PlayerCardProps {
  readonly profile: Profile;
  readonly xpGoal: number;
  readonly disabled?: boolean;
  readonly onPress: () => void;
}

export function PlayerCard({ profile, xpGoal, disabled = false, onPress }: PlayerCardProps) {
  const progress = xpGoal > 0 ? Math.min(1, profile.xp / xpGoal) : 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Открыть профиль"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed, disabled && styles.disabled]}>
      <View style={styles.avatar} accessible accessibilityRole="image" accessibilityLabel="Нейтральный аватар">
        <View style={styles.avatarMark} />
      </View>
      <View style={styles.details}>
        <Text style={styles.nickname}>{profile.nickname}</Text>
        <Text style={styles.level}>Уровень {profile.level}</Text>
        <View
          style={styles.progressTrack}
          accessibilityRole="progressbar"
          accessibilityLabel="Прогресс опыта"
          accessibilityValue={{ min: 0, max: xpGoal, now: profile.xp }}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.xp}>{profile.xp} / {xpGoal} XP</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: controlSize,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.control,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceRaised,
  },
  pressed: { opacity: 0.76, borderColor: colors.focus },
  disabled: { opacity: 0.45 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 2,
    borderColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMark: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.textMuted },
  details: { flex: 1, gap: spacing.xs },
  nickname: { color: colors.text, fontFamily: typography.bold, fontSize: 18 },
  level: { color: colors.textMuted, fontFamily: typography.regular, fontSize: 14 },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: colors.background, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: colors.mint },
  xp: { color: colors.textMuted, fontFamily: typography.regular, fontSize: 12 },
});
