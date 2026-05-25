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
import { colors, layout, spacing } from '../theme';

/**
 * Contenedor estándar de pantalla.
 *
 * Encapsula el patrón repetido en todas las pantallas: SafeArea + KeyboardAvoiding
 * + ScrollView + padding horizontal estandarizado.
 *
 * Uso:
 *   <ScreenContainer>
 *     <Heading>Título</Heading>
 *     <TextField ... />
 *     <Button>Aceptar</Button>
 *   </ScreenContainer>
 *
 *   // Sin scroll (pantallas con altura fija):
 *   <ScreenContainer scrollable={false}>
 *     ...
 *   </ScreenContainer>
 *
 *   // Sin padding (cuando hay header full-bleed):
 *   <ScreenContainer padded={false}>
 *     <CustomHeader />
 *     <View style={{ padding: 24 }}>...</View>
 *   </ScreenContainer>
 */

type ScreenContainerProps = {
  children: React.ReactNode;
  /** Color de fondo del SafeArea. Default: `colors.background` */
  background?: string;
  /** Si true (default), envuelve con ScrollView */
  scrollable?: boolean;
  /** Si true (default), aplica padding horizontal estandarizado */
  padded?: boolean;
  /** Si false, omite KeyboardAvoidingView (útil para pantallas sin inputs) */
  avoidKeyboard?: boolean;
  /** Override de estilo del contenedor de contenido */
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Override de estilo del SafeArea raíz */
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

// ── Estilos ──────────────────────────────────────────────────────────────────

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
