import { PropsWithChildren } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, controlSize, radii, spacing, typography } from '@/ui/tokens';

interface SheetFrameProps extends PropsWithChildren {
  readonly visible: boolean;
  readonly title: string;
  readonly onClose: () => void;
  readonly alert?: boolean;
}

export function SheetFrame({ visible, title, onClose, alert = false, children }: SheetFrameProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.heading}>
            <Text
              style={styles.title}
              accessible={alert}
              accessibilityRole={alert ? 'alert' : undefined}
              accessibilityLabel={alert ? title : undefined}>
              {title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Закрыть"
              onPress={onClose}
              hitSlop={8}
              style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(3, 10, 20, 0.72)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceRaised,
  },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: colors.text, fontFamily: typography.bold, fontSize: 24 },
  close: { width: controlSize, height: controlSize, alignItems: 'center', justifyContent: 'center', borderRadius: 24 },
  pressed: { backgroundColor: colors.surfaceRaised },
  closeText: { color: colors.textMuted, fontFamily: typography.regular, fontSize: 30, lineHeight: 34 },
});
