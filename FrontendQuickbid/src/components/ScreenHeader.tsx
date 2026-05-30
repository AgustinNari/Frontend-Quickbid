import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon, Typography } from '../ui';
import { colors, layout, spacing } from '../theme';

/**
 * Header estándar para pantallas secundarias de QuickBid.
 *
 * Layout: back (izquierda, oculto si no hay `onBack`) + brand "QuickBid"
 * centrado + spacer fantasma del mismo ancho que el back para mantener el
 * brand visualmente centrado en cualquier caso.
 *
 * Reemplaza la duplicación que había entre `DetailHeader` y `CatalogoHeader`
 * de las pantallas de subastas. Se mantiene exactamente el mismo look & feel.
 */

type Props = {
  /** Si se omite, no se renderiza el botón de back y el espacio queda balanceado. */
  onBack?: () => void;
};

const BACK_SIZE = 24; // tamaño del área táctil del botón back

export function ScreenHeader({ onBack }: Props) {
  return (
    <View style={styles.header}>
      {onBack && (
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          style={styles.backSlot}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="arrow-left" color={colors.primary} size={22} />
        </TouchableOpacity>
      )}

      <Typography variant="h2" primary>
        QuickBid
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  backSlot: {
    width: BACK_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
