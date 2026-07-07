import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Coord, Special, TileColor } from '../game/model';
import { colors, radii, typography } from '../ui/tokens';

const colorMap: Record<TileColor, string> = {
  coral: colors.coral,
  sky: colors.sky,
  mint: colors.mint,
  sun: colors.sun,
  plum: colors.plum,
};

const markMap: Record<TileColor, string> = {
  coral: '◆',
  sky: '●',
  mint: '■',
  sun: '▲',
  plum: '✦',
};

interface TileViewProps {
  readonly color: TileColor;
  readonly special: Special;
  readonly coord: Coord;
  readonly size: number;
  readonly selected?: boolean;
  readonly onPress: (coord: Coord) => void;
}

export function TileView({ color, special, coord, size, selected = false, onPress }: TileViewProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={tileAccessibilityLabel(color, special, coord, selected)}
      accessibilityState={{ selected }}
      onPress={() => onPress(coord)}
      style={({ pressed }) => [
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: Math.min(radii.tile, size / 3),
          backgroundColor: colorMap[color],
        },
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.innerMark}>
        <Text style={styles.mark}>{specialMark(special) ?? markMap[color]}</Text>
      </View>
    </Pressable>
  );
}

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
    case 'rainbow': return '◎';
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
