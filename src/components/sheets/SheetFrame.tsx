import { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
      <KeyboardAvoidingView
        testID="sheet-keyboard-avoider"
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView
          testID="sheet-panel"
          edges={['bottom']}
          style={styles.sheet}>
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
          <ScrollView
            testID="sheet-scroll"
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(3, 10, 20, 0.72)' },
  sheet: {
    maxHeight: '90%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceRaised,
  },
  scroll: { flexGrow: 0, flexShrink: 1 },
  content: { gap: spacing.md },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: colors.text, fontFamily: typography.bold, fontSize: 24 },
  close: { width: controlSize, height: controlSize, alignItems: 'center', justifyContent: 'center', borderRadius: 24 },
  pressed: { backgroundColor: colors.surfaceRaised },
  closeText: { color: colors.textMuted, fontFamily: typography.regular, fontSize: 30, lineHeight: 34 },
});
