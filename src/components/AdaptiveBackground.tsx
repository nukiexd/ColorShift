import { PropsWithChildren, useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { TileColor } from '../game/model';
import { colors } from '../ui/tokens';

const glowColor: Record<TileColor, string> = {
  coral: 'rgba(217, 107, 104, 0.14)',
  sky: 'rgba(103, 169, 201, 0.14)',
  mint: 'rgba(113, 183, 151, 0.14)',
  sun: 'rgba(216, 182, 95, 0.12)',
  plum: 'rgba(154, 114, 158, 0.14)',
};

interface AdaptiveBackgroundProps extends PropsWithChildren {
  readonly color: TileColor | null;
  readonly reducedMotion?: boolean;
}

export function adaptiveGlowConfig(color: TileColor | null, reducedMotion: boolean) {
  return {
    backgroundColor: color ? glowColor[color] : 'transparent',
    opacity: color ? reducedMotion ? 0.1 : 0.12 : 0,
    transitionMs: reducedMotion ? 80 : 320,
  };
}

export function AdaptiveBackground({ color, reducedMotion = false, children }: AdaptiveBackgroundProps) {
  const glow = adaptiveGlowConfig(color, reducedMotion);
  const [opacity] = useState(() => new Animated.Value(glow.opacity));

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: glow.opacity,
      duration: glow.transitionMs,
      useNativeDriver: true,
    }).start();
  }, [glow.opacity, glow.transitionMs, opacity]);

  return (
    <View testID="adaptive-background-root" style={styles.base}>
      <Animated.View pointerEvents="none" testID="adaptive-background-glow" style={[styles.glow, { backgroundColor: glow.backgroundColor, opacity }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -96,
    right: -76,
    width: 220,
    height: 220,
    borderRadius: 110,
  },
});
