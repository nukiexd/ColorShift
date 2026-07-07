import { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { TileColor } from '../game/model';
import { colors } from '../ui/tokens';

const glowColor: Record<TileColor, string> = {
  coral: 'rgba(217, 107, 104, 0.22)',
  sky: 'rgba(103, 169, 201, 0.22)',
  mint: 'rgba(113, 183, 151, 0.22)',
  sun: 'rgba(216, 182, 95, 0.2)',
  plum: 'rgba(154, 114, 158, 0.22)',
};

interface AdaptiveBackgroundProps extends PropsWithChildren {
  readonly color: TileColor | null;
  readonly reducedMotion?: boolean;
}

export function adaptiveGlowConfig(color: TileColor | null, reducedMotion: boolean) {
  return {
    backgroundColor: color ? glowColor[color] : 'transparent',
    opacity: color ? 0.18 : 0,
    transitionMs: reducedMotion ? 80 : 220,
  };
}

export function AdaptiveBackground({ color, reducedMotion = false, children }: AdaptiveBackgroundProps) {
  const glow = adaptiveGlowConfig(color, reducedMotion);
  return (
    <View style={styles.base}>
      <View pointerEvents="none" testID="adaptive-background-glow" style={[styles.glow, { backgroundColor: glow.backgroundColor, opacity: glow.opacity }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    backgroundColor: colors.background,
  },
  glow: {
    position: 'absolute',
    top: -120,
    right: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
  },
});
