import { useEffect, useRef, useState } from 'react';
import { useWindowDimensions, StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdaptiveBackground } from '../components/AdaptiveBackground';
import { BoardView } from '../components/Board';
import { GameHud } from '../components/GameHud';
import { useApp } from '../state/AppProvider';
import { MoveAnimationPlan } from '../hooks/animationPlan';
import { createGameControllerState, GameControllerState, releasePan, tapTile, updatePan } from '../hooks/useGameController';
import { colors, spacing, typography } from '../ui/tokens';

export default function GameScreen() {
  const app = useApp();
  const { width } = useWindowDimensions();
  const session = app.activeSession;
  const [controller, setController] = useState<GameControllerState | null>(() => session ? createGameControllerState(session) : null);
  const controllerRef = useRef<GameControllerState | null>(controller);
  const [pendingPlan, setPendingPlan] = useState<MoveAnimationPlan | null>(null);
  const [pendingSession, setPendingSession] = useState<GameControllerState['session'] | null>(null);
  const activeController = session ? controller?.session.sessionId === session.sessionId ? controller : createGameControllerState(session) : null;

  useEffect(() => {
    if (activeController) controllerRef.current = activeController;
  }, [activeController]);

  if (!session) {
    return (
      <AdaptiveBackground color={null} reducedMotion={app.settings.reducedMotion}>
        <SafeAreaView style={styles.center}>
          <Text style={styles.empty}>Нет активной партии</Text>
        </SafeAreaView>
      </AdaptiveBackground>
    );
  }
  if (!activeController) return null;

  return (
    <AdaptiveBackground color={session.backgroundColor} reducedMotion={app.settings.reducedMotion}>
      <SafeAreaView style={styles.safeArea}>
        <GameHud session={session} bestScore={app.profile.bestScore} onPause={app.pauseGame} />
        <View style={styles.boardWrap}>
          <BoardView
            session={session}
            width={width}
            selected={activeController.selected}
            preview={activeController.preview}
            animationPlan={pendingPlan}
            onTapTile={(coord) => {
              if (pendingPlan) return;
              const result = tapTile(activeController, coord, { reducedMotion: app.settings.reducedMotion });
              controllerRef.current = result.state;
              setController(result.state);
              if (result.accepted && result.animationPlan) {
                setPendingPlan(result.animationPlan);
                setPendingSession(result.state.session);
              }
            }}
            onPanMove={(coord, dx, dy, pitch) => {
              if (pendingPlan) return;
              setController((current) => {
                const next = updatePan(current?.session.sessionId === session.sessionId ? current : activeController, coord, dx, dy, pitch);
                controllerRef.current = next;
                return next;
              });
            }}
            onPanRelease={() => {
              if (pendingPlan) return;
              const baseController = controllerRef.current?.session.sessionId === session.sessionId ? controllerRef.current : activeController;
              const result = releasePan(baseController, { reducedMotion: app.settings.reducedMotion });
              controllerRef.current = result.state;
              setController(result.state);
              if (result.accepted && result.animationPlan) {
                setPendingPlan(result.animationPlan);
                setPendingSession(result.state.session);
              }
            }}
            onAnimationPlanComplete={() => {
              if (pendingSession) app.settleSession(pendingSession);
              setPendingPlan(null);
              setPendingSession(null);
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
