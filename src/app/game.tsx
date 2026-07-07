import { useState } from 'react';
import { useWindowDimensions, StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdaptiveBackground } from '../components/AdaptiveBackground';
import { BoardView } from '../components/Board';
import { GameHud } from '../components/GameHud';
import { useApp } from '../state/AppProvider';
import { createGameControllerState, GameControllerState, tapTile } from '../hooks/useGameController';
import { colors, spacing, typography } from '../ui/tokens';

export default function GameScreen() {
  const app = useApp();
  const { width } = useWindowDimensions();
  const session = app.activeSession;
  const [controller, setController] = useState<GameControllerState | null>(() => session ? createGameControllerState(session) : null);

  if (!session) {
    return (
      <AdaptiveBackground color={null} reducedMotion={app.settings.reducedMotion}>
        <SafeAreaView style={styles.center}>
          <Text style={styles.empty}>Нет активной партии</Text>
        </SafeAreaView>
      </AdaptiveBackground>
    );
  }

  const activeController = controller?.session.sessionId === session.sessionId ? controller : createGameControllerState(session);
  return (
    <AdaptiveBackground color={session.backgroundColor} reducedMotion={app.settings.reducedMotion}>
      <SafeAreaView style={styles.safeArea}>
        <GameHud session={session} bestScore={app.profile.bestScore} onPause={app.pauseGame} />
        <View style={styles.boardWrap}>
          <BoardView
            session={session}
            width={width}
            selected={activeController.selected}
            onTapTile={(coord) => {
              const result = tapTile(activeController, coord, { reducedMotion: app.settings.reducedMotion });
              setController(result.state);
              if (result.accepted) app.settleSession(result.state.session);
            }}
          />
        </View>
      </SafeAreaView>
    </AdaptiveBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    padding: spacing.lg,
  },
  boardWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    color: colors.textMuted,
    fontFamily: typography.family,
  },
});
