import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TILE_COLORS } from '../game/balance';
import { Coord, Special, TileColor } from '../game/model';
import { colors, radii, typography } from '../ui/tokens';

const colorMap: Record<TileColor, string> = {
  coral: colors.coral,
  sky: colors.sky,
  mint: colors.mint,
  sun: colors.sun,
  plum: colors.plum,
};

interface TileViewProps {
  readonly color: TileColor;
  readonly special: Special;
  readonly coord: Coord;
  readonly size: number;
  readonly selected?: boolean;
  readonly disabled?: boolean;
  readonly onPress: (coord: Coord) => void;
}

export const TileView = memo(function TileView({ color, special, coord, size, selected = false, disabled = false, onPress }: TileViewProps) {
  const mark = specialMark(special);
  const isRainbow = special === 'rainbow';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={tileAccessibilityLabel(color, special, coord, selected)}
      accessibilityState={{ selected }}
      disabled={disabled}
      onPress={() => onPress(coord)}
      style={({ pressed }) => [
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: Math.min(radii.tile, size / 3),
          backgroundColor: isRainbow ? colors.surfaceRaised : colorMap[color],
        },
        selected && styles.selected,
        pressed && !disabled && styles.pressed,
      ]}
    >
      {isRainbow ? (
        <View
          testID={`rainbow-tile-${coord.row}-${coord.col}`}
          style={[styles.rainbow, { borderRadius: Math.min(radii.tile, size / 3) }]}
        >
          {TILE_COLORS.map((stripe) => (
            <View
              key={stripe}
              testID={`rainbow-stripe-${stripe}-${coord.row}-${coord.col}`}
              style={[styles.rainbowStripe, { backgroundColor: colorMap[stripe] }]}
            />
          ))}
        </View>
      ) : null}
      {mark ? (
        <View style={styles.innerMark}>
          <Text style={styles.mark}>{mark}</Text>
        </View>
      ) : null}
    </Pressable>
  );
});

export function tileAccessibilityLabel(color: TileColor, special: Special, coord: Coord, selected: boolean): string {
  const parts = [`Блок ${color}`, `строка ${coord.row + 1}`, `столбец ${coord.col + 1}`];
  if (special) parts.push(`бонус ${special}`);
  if (selected) parts.push('выбран');
  return parts.join(', ');
}

function specialMark(special: Special): string | null {
  switch (special) {
    case 'row': return '↔';
    case 'column': return '↕';
    case 'bomb': return '✹';
    default: return null;
  }
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  selected: {
    borderColor: colors.focus,
    borderWidth: 3,
  },
  pressed: {
    opacity: 0.88,
  },
  rainbow: {
    position: 'absolute',
    inset: 0,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  rainbowStripe: {
    flex: 1,
  },
  innerMark: {
    width: '52%',
    height: '52%',
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(7, 20, 38, 0.18)',
  },
  mark: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 18,
    fontWeight: '900',
  },
});
