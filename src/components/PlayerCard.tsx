import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Profile } from '../storage/schema';
import { colors, componentTokens, radii, spacing, typography } from '../ui/tokens';

interface PlayerCardProps {
  readonly profile: Profile;
  readonly onPress: () => void;
}

export function PlayerCard({ profile, onPress }: PlayerCardProps) {
  const progress = Math.min(1, profile.xp / Math.max(1, 100 + 20 * (profile.level - 1)));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Профиль игрока"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.avatar} accessibilityLabel="Аватар будет доступен позже">
        <Text style={styles.avatarText}>{profile.nickname.slice(0, 1).toUpperCase()}</Text>
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.nickname}>{profile.nickname}</Text>
        <Text style={styles.level}>Уровень {profile.level}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: componentTokens.playerCard.minHeight,
    borderRadius: componentTokens.playerCard.radius,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    alignSelf: 'flex-end',
    maxWidth: 220,
  },
  pressed: {
    opacity: 0.86,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
  },
  avatarText: {
    color: colors.mint,
    fontFamily: typography.family,
    fontSize: 18,
    fontWeight: '800',
  },
  textBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  nickname: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 14,
    fontWeight: '800',
  },
  level: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 12,
  },
  progressTrack: {
    height: 5,
    borderRadius: radii.pill,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.mint,
  },
});
