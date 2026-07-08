import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, radii, spacing, typography } from '../ui/tokens';

const HOME_ROUTE = '/' as Href;

export default function ResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    score?: string;
    bestCascade?: string;
    clearedTiles?: string;
    xpEarned?: string;
    isNewBest?: string;
  }>();
  const score = safeNumber(params.score);
  const bestCascade = safeNumber(params.bestCascade);
  const clearedTiles = safeNumber(params.clearedTiles);
  const xpEarned = safeNumber(params.xpEarned);
  const isNewBest = params.isNewBest === 'true';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Итоги</Text>
        <Text style={styles.title}>Партия завершена</Text>
        {isNewBest ? <Text style={styles.badge}>Новый рекорд</Text> : null}
      </View>

      <View style={styles.scorePanel}>
        <Text style={styles.scoreLabel}>Счёт</Text>
        <Text style={styles.score}>{score}</Text>
      </View>

      <View style={styles.stats}>
        <Stat label="Лучший каскад" value={`Каскад ×${bestCascade}`} />
        <Stat label="Очищено" value={`${clearedTiles} плиток`} />
        <Stat label="Опыт" value={`+${xpEarned} XP`} />
      </View>

      <PrimaryButton label="На главный экран" onPress={() => router.replace(HOME_ROUTE)} />
    </SafeAreaView>
  );
}

function Stat({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function safeNumber(value: string | readonly string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : 0;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.lg,
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  header: {
    gap: spacing.sm,
  },
  eyebrow: {
    color: colors.mint,
    fontFamily: typography.family,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 34,
    fontWeight: '900',
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    color: colors.background,
    backgroundColor: colors.sun,
    fontFamily: typography.family,
    fontWeight: '800',
  },
  scorePanel: {
    borderRadius: radii.card,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  scoreLabel: {
    color: colors.textMuted,
    fontFamily: typography.family,
  },
  score: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 44,
    fontWeight: '900',
  },
  stats: {
    gap: spacing.sm,
  },
  stat: {
    minHeight: 64,
    borderRadius: radii.card,
    padding: spacing.md,
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderWidth: 1,
  },
  statLabel: {
    color: colors.textSubtle,
    fontFamily: typography.family,
    fontSize: 12,
  },
  statValue: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 18,
    fontWeight: '800',
  },
});
