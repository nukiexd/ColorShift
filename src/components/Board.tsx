import { StyleSheet, View } from 'react-native';
import { Coord } from '../game/model';
import { GameSession } from '../game/session';
import { colors, radii } from '../ui/tokens';
import { TileView } from './Tile';

export interface BoardLayout {
  readonly gutter: number;
  readonly boardPadding: number;
  readonly gap: number;
  readonly available: number;
  readonly tileSize: number;
  readonly pitch: number;
  readonly boardSize: number;
}

interface BoardViewProps {
  readonly session: GameSession;
  readonly width: number;
  readonly selected?: Coord | null;
  readonly onTapTile: (coord: Coord) => void;
}

export function calculateBoardLayout(width: number): BoardLayout {
  const gutter = width < 380 ? 12 : 20;
  const boardPadding = width < 380 ? 8 : 12;
  const gap = 4;
  const available = Math.min(width - gutter * 2 - boardPadding * 2, 356);
  const tileSize = Math.min(56, Math.floor((available - gap * 5) / 6));
  const pitch = tileSize + gap;
  return { gutter, boardPadding, gap, available, tileSize, pitch, boardSize: tileSize * 6 + gap * 5 + boardPadding * 2 };
}

export function BoardView({ session, width, selected = null, onTapTile }: BoardViewProps) {
  const layout = calculateBoardLayout(width);
  return (
    <View style={[styles.board, { width: layout.boardSize, height: layout.boardSize, padding: layout.boardPadding, gap: layout.gap }]}>
      {session.board.map((row, rowIndex) => row.map((tile, colIndex) => tile ? (
        <TileView
          key={tile.id}
          color={tile.color}
          special={tile.special}
          coord={{ row: rowIndex, col: colIndex }}
          size={layout.tileSize}
          selected={selected?.row === rowIndex && selected.col === colIndex}
          onPress={onTapTile}
        />
      ) : null))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
});
