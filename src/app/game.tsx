import { useEffect, useMemo, useRef, useState } from 'react';
import { Href, useRouter } from 'expo-router';
import { useWindowDimensions, StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdaptiveBackground } from '../components/AdaptiveBackground';
import { BoardView } from '../components/Board';
import { GameHud } from '../components/GameHud';
import { PauseSheet } from '../components/sheets/PauseSheet';
import { useApp } from '../state/AppProvider';
import { createFeedback } from '../feedback';
import { MoveAnimationPlan } from '../hooks/animationPlan';
import { createGameControllerState, GameControllerState, releasePan, tapTile, updatePan } from '../hooks/useGameController';
import { colors, spacing, typography } from '../ui/tokens';

export default function GameScreen() {
  const app = useApp();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const session = app.activeSession;
  const [controller, setController] = useState<GameControllerState | null>(() => session ? createGameControllerState(session) : null);
  const controllerRef = useRef<GameControllerState | null>(controller);
  const [pendingPlan, setPendingPlan] = useState<MoveAnimationPlan | null>(null);
  const [pendingSession, setPendingSession] = useState<GameControllerState['session'] | null>(null);
  const [settledOverride, setSettledOverride] = useState<GameControllerState['session'] | null>(null);
  const visibleSession = pendingPlan ? session : settledOverride ?? session;
  const activeController = visibleSession ? controller?.session.sessionId === visibleSession.sessionId ? controller : createGameControllerState(visibleSession) : null;
  const feedback = useMemo(() => createFeedback(app.settings), [app.settings]);

  useEffect(() => {
    if (activeController) controllerRef.current = activeController;
  }, [activeController]);

  useEffect(() => {
    void feedback.preload();
  }, [feedback]);

  const finishGame = () => {
    const outcome = app.finishGame();
    if (!outcome) return;
    router.replace(({
      pathname: '/results',
      params: {
        score: String(outcome.result.score),
        bestCascade: String(outcome.result.bestCascade),
        clearedTiles: String(outcome.result.clearedTiles),
        xpEarned: String(outcome.xpEarned),
        isNewBest: String(outcome.result.isNewBest),
      },
    } as unknown) as Href);
  };

  const restartGame = () => {
    const next = app.discardAndStart();
    if (!next) return;
    const nextController = createGameControllerState(next);
    controllerRef.current = nextController;
    setController(nextController);
    setPendingPlan(null);
    setPendingSession(null);
    setSettledOverride(null);
  };

  if (!session) {
    return (
      <AdaptiveBackground color={null} reducedMotion={app.settings.reducedMotion}>
        <SafeAreaView style={styles.center}>
          <Text style={styles.empty}>Нет активной партии</Text>
        </SafeAreaView>
      </AdaptiveBackground>
    );
  }
  if (!visibleSession || !activeController) return null;

  return (
    <AdaptiveBackground color={visibleSession.backgroundColor} reducedMotion={app.settings.reducedMotion}>
      <SafeAreaView style={styles.safeArea}>
        <GameHud session={visibleSession} bestScore={app.profile.bestScore} onPause={app.pauseGame} />
        <View style={styles.boardWrap}>
          <BoardView
            session={visibleSession}
            width={width}
            selected={activeController.selected}
            preview={activeController.preview}
            animationPlan={pendingPlan}
            onTapTile={(coord) => {
              if (pendingPlan || visibleSession.phase !== 'idle') return;
              const result = tapTile(activeController, coord, { reducedMotion: app.settings.reducedMotion });
              controllerRef.current = result.state;
              setController(result.state);
              if (result.animationPlan && result.animationPlan.steps.length > 0) {
                feedback.play('swap');
                if (result.accepted) feedback.lightImpact();
                setSettledOverride(null);
                setPendingPlan(result.animationPlan);
                setPendingSession(result.accepted ? result.state.session : null);
              }
            }}
            onPanMove={(coord, dx, dy, pitch) => {
              if (pendingPlan || visibleSession.phase !== 'idle') return;
              setController((current) => {
                const next = updatePan(current?.session.sessionId === visibleSession.sessionId ? current : activeController, coord, dx, dy, pitch);
                controllerRef.current = next;
                return next;
              });
            }}
            onPanRelease={() => {
              if (pendingPlan || visibleSession.phase !== 'idle') return;
              const baseController = controllerRef.current?.session.sessionId === visibleSession.sessionId ? controllerRef.current : activeController;
              const result = releasePan(baseController, { reducedMotion: app.settings.reducedMotion });
              controllerRef.current = result.state;
              setController(result.state);
              if (result.animationPlan && result.animationPlan.steps.length > 0) {
                feedback.play('swap');
                if (result.accepted) feedback.lightImpact();
                setSettledOverride(null);
                setPendingPlan(result.animationPlan);
                setPendingSession(result.accepted ? result.state.session : null);
              }
            }}
            onAnimationPlanComplete={() => {
              if (pendingPlan) playResolutionFeedback(feedback, pendingPlan);
              if (pendingSession) {
                setSettledOverride(pendingSession);
                app.settleSession(pendingSession);
                const nextController = createGameControllerState(pendingSession);
                controllerRef.current = nextController;
                setController(nextController);
              }
              setPendingPlan(null);
              setPendingSession(null);
            }}
          />
        </View>
        {session.phase === 'paused' ? (
          <PauseSheet onContinue={app.resumeGame} onRestart={restartGame} onFinish={finishGame} />
        ) : null}
      </SafeAreaView>
    </AdaptiveBackground>
  );
}

function playResolutionFeedback(feedback: ReturnType<typeof createFeedback>, plan: MoveAnimationPlan) {
  const maxCascade = Math.max(0, ...plan.resolution.phases.map((phase) => phase.cascade));
  const hasSpecial = plan.resolution.phases.some((phase) => phase.createdSpecial !== null);
  if (plan.resolution.phases.length > 0) feedback.play(maxCascade > 1 ? 'cascade' : 'match', maxCascade);
  if (hasSpecial) feedback.play('special');
  if (plan.resolution.shuffled) feedback.play('shuffle');
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
