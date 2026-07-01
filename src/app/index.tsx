import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlayerCard } from '@/components/PlayerCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ConfirmSheet } from '@/components/sheets/ConfirmSheet';
import { ModeSheet } from '@/components/sheets/ModeSheet';
import { ProfileSheet } from '@/components/sheets/ProfileSheet';
import { SettingsSheet } from '@/components/sheets/SettingsSheet';
import { xpRequiredForLevel } from '@/game/session';
import { useApp } from '@/state/AppProvider';
import { colors, spacing, typography } from '@/ui/tokens';

type OpenSheet = 'mode' | 'profile' | 'settings' | 'confirm' | null;

export default function HomeScreen() {
  const app = useApp();
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);
  const disabled = !app.hydrated;

  const chooseEndless = () => {
    setOpenSheet(app.activeSession ? 'confirm' : null);
    if (!app.activeSession) app.startGame();
  };

  const replaceSession = () => {
    app.discardAndStart();
    setOpenSheet(null);
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.titleMark} />
          <Text style={styles.title}>COLOR SHIFT</Text>
          <Text style={styles.subtitle}>Собирайте цвета в своём ритме</Text>
        </View>

        <PlayerCard
          profile={app.profile}
          xpGoal={xpRequiredForLevel(app.profile.level)}
          disabled={disabled}
          onPress={() => setOpenSheet('profile')}
        />

        <View style={styles.actions}>
          {!app.loading && app.activeSession && (
            <PrimaryButton label="Продолжить" onPress={() => { app.continueGame(); }} disabled={disabled} />
          )}
          <PrimaryButton
            label="Новая игра"
            variant={app.activeSession ? 'secondary' : 'primary'}
            disabled={disabled}
            onPress={() => setOpenSheet('mode')}
          />
          <PrimaryButton label="Настройки" variant="quiet" disabled={disabled} onPress={() => setOpenSheet('settings')} />
          {app.loading && <Text accessibilityRole="text" style={styles.loading}>Загрузка…</Text>}
        </View>
      </SafeAreaView>

      <ModeSheet visible={openSheet === 'mode'} onClose={() => setOpenSheet(null)} onEndless={chooseEndless} />
      {openSheet === 'profile' && (
        <ProfileSheet
          visible
          profile={app.profile}
          onClose={() => setOpenSheet(null)}
          onSave={app.updateNickname}
        />
      )}
      <SettingsSheet
        visible={openSheet === 'settings'}
        settings={app.settings}
        onClose={() => setOpenSheet(null)}
        onUpdate={app.updateSettings}
      />
      <ConfirmSheet visible={openSheet === 'confirm'} onCancel={() => setOpenSheet(null)} onConfirm={replaceSession} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  header: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.lg },
  titleMark: { width: 36, height: 8, borderRadius: 4, backgroundColor: colors.coral },
  title: { color: colors.text, fontFamily: typography.bold, fontSize: 32, letterSpacing: 2.5 },
  subtitle: { color: colors.textMuted, fontFamily: typography.regular, fontSize: 14, textAlign: 'center' },
  actions: { gap: spacing.sm, paddingBottom: spacing.md },
  loading: { color: colors.textMuted, fontFamily: typography.regular, textAlign: 'center', minHeight: 20 },
});
