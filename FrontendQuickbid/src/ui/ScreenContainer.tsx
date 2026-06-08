import React from 'react';
import {
  View,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { colors, layout } from '../theme';

type ScreenContainerProps = {
  children: React.ReactNode;
  background?: string;
  scrollable?: boolean;
  padded?: boolean;
  avoidKeyboard?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
};

export function ScreenContainer({
  children,
  background = colors.background,
  scrollable = true,
  padded = true,
  avoidKeyboard = true,
  contentContainerStyle,
  style,
}: ScreenContainerProps) {
  const paddingStyle = padded ? styles.padded : null;

  const inner = scrollable ? (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        paddingStyle,
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, paddingStyle, contentContainerStyle]}>
      {children}
    </View>
  );

  const body = avoidKeyboard ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {inner}
    </KeyboardAvoidingView>
  ) : (
    inner
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: background }, style]}>
      {body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: layout.screenPaddingVertical,
  },
  padded: {
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
});
