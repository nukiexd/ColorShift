import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GameSession } from '../game/session';
import { colors, radii, spacing, typography } from '../ui/tokens';

interface GameHudProps {
  readonly session: GameSession;
  readonly bestScore: number;
  readonly onPause: () => void;
}

export function GameHud({ session, bestScore, onPause }: GameHudProps) {
  return (
    <View style={styles.row}>
      <View>
        <Text style={styles.label}>Счёт</Text>
        <Text style={styles.value}>{session.score}</Text>
        <Text style={styles.best}>Рекорд {bestScore}</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Пауза" onPress={onPause} style={styles.pause}>
        <Text style={styles.pauseText}>Ⅱ</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 12,
  },
  value: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 28,
    fontWeight: '900',
  },
  best: {
    color: colors.textSubtle,
    fontFamily: typography.family,
  },
  pause: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  pauseText: {
    color: colors.text,
    fontSize: 22,
    marginLeft: spacing.xs / 2,
  },
});
