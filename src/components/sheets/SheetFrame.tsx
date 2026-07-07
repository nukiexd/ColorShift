import { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, componentTokens, spacing, typography } from '../../ui/tokens';

interface SheetFrameProps extends PropsWithChildren {
  readonly title: string;
  readonly onClose: () => void;
}

export function SheetFrame({ title, onClose, children }: SheetFrameProps) {
  return (
    <View style={styles.backdrop}>
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Закрыть" onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        </View>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(3, 8, 18, 0.58)',
  },
  sheet: {
    borderTopLeftRadius: componentTokens.sheet.radius,
    borderTopRightRadius: componentTokens.sheet.radius,
    padding: componentTokens.sheet.padding,
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  header: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    fontFamily: typography.family,
    fontSize: 22,
    fontWeight: '800',
  },
  closeButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: colors.textMuted,
    fontSize: 30,
    lineHeight: 34,
  },
});
