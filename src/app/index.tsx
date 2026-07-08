import { useState } from 'react';
import { Href, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PlayerCard } from '../components/PlayerCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { ConfirmSheet } from '../components/sheets/ConfirmSheet';
import { ModeSheet } from '../components/sheets/ModeSheet';
import { ProfileSheet } from '../components/sheets/ProfileSheet';
import { SettingsSheet } from '../components/sheets/SettingsSheet';
import { useApp } from '../state/AppProvider';
import { colors, radii, spacing, typography } from '../ui/tokens';

type ActiveSheet = 'mode' | 'profile' | 'settings' | 'replace' | null;
const GAME_ROUTE = '/game' as Href;

export default function HomeScreen() {
  const app = useApp();
  const router = useRouter();
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
  const hasSession = app.activeSession !== null;

  const startEndless = () => {
    app.startGame();
    setActiveSheet(null);
    router.push(GAME_ROUTE);
  };

  const replaceSession = () => {
    app.discardAndStart();
    setActiveSheet(null);
    router.push(GAME_ROUTE);
  };

  const continueSession = () => {
    app.continueGame();
    router.push(GAME_ROUTE);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <PlayerCard profile={app.profile} onPress={() => setActiveSheet('profile')} />

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>спокойная головоломка</Text>
          <Text style={styles.title}>COLOR SHIFT</Text>
          <Text style={styles.subtitle}>Собирай мягкие цветовые цепочки, запускай каскады и играй в своём темпе.</Text>
        </View>

        <View style={styles.actions}>
          {hasSession ? <PrimaryButton label="Продолжить" onPress={continueSession} disabled={!app.hydrated} /> : null}
          <PrimaryButton
            label="Новая игра"
            variant={hasSession ? 'secondary' : 'primary'}
            onPress={() => setActiveSheet(hasSession ? 'replace' : 'mode')}
            disabled={!app.hydrated}
          />
          <PrimaryButton label="Настройки" variant="ghost" onPress={() => setActiveSheet('settings')} disabled={!app.hydrated} />
        </View>

        <View style={styles.progressDock}>
          <Text style={styles.progressTitle}>Твой прогресс</Text>
          <Text style={styles.progressValue}>Уровень {app.profile.level}</Text>
          <Text style={styles.progressMuted}>Лучший счёт: {app.profile.bestScore}</Text>
        </View>
      </SafeAreaView>

      {activeSheet === 'mode' ? <ModeSheet onClose={() => setActiveSheet(null)} onStartEndless={startEndless} /> : null}
      {activeSheet === 'profile' ? <ProfileSheet profile={app.profile} onClose={() => setActiveSheet(null)} onSave={app.updateNickname} /> : null}
      {activeSheet === 'settings' ? <SettingsSheet settings={app.settings} onClose={() => setActiveSheet(null)} onUpdate={app.updateSettings} /> : null}
      {activeSheet === 'replace' ? (
        <ConfirmSheet
          title="Начать заново?"
          message="Текущая сохранённая партия будет заменена новой Endless-сессией."
          confirmLabel="Начать новую"
          onCancel={() => setActiveSheet(null)}
          onConfirm={replaceSession}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.lg,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
  eyebrow: {
    color: colors.mint,
    fontFamily: typography.family,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: typography.titleSpacing,
  },
  subtitle: {
    maxWidth: 340,
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 16,
    lineHeight: 24,
  },
  actions: {
    gap: spacing.sm,
  },
  progressDock: {
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  progressTitle: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: 13,
  },
  progressValue: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 18,
    fontWeight: '800',
  },
  progressMuted: {
    color: colors.textSubtle,
    fontFamily: typography.family,
  },
});
