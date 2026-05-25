import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Card, Typography, Badge, Button, Icon, IconName } from '../ui';
import { colors, spacing, radius, fontSize, fontWeight, letterSpacing } from '../theme';
import {
  SubastaResumen,
  SubastaSegmento,
  SEGMENTO_LABEL,
  CATEGORIA_LABEL,
} from '../types/subasta';

/**
 * Tarjeta GRANDE para subastas activas — usada en carrusel horizontal.
 *
 * Layout (alineado al Figma):
 *   ┌─────────────────────────────────┐
 *   │  [imagen grande del producto]   │
 *   │  [● ACTIVA]            [MONEDA] │
 *   ├─────────────────────────────────┤
 *   │  SEGMENTO                       │
 *   │  Categoría: X                   │
 *   │  Título grande                  │
 *   │  🏛 Rematador                   │
 *   │  [    Entrar →    ]             │
 *   └─────────────────────────────────┘
 *
 * Como todavía no hay imágenes reales del backend, usamos un placeholder
 * tematizado por segmento (color soft de fondo + icono grande).
 */

type Props = {
  subasta: SubastaResumen;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function SubastaCard({ subasta, onPress, style }: Props) {
  const segmentoTheme = SEGMENTO_THEME[subasta.segmento];

  return (
    <Card
      variant="elevated"
      padding="none"
      style={[styles.card, style]}
    >
      {/* Placeholder de imagen (mientras no haya foto real) */}
      <View style={[styles.imageArea, { backgroundColor: segmentoTheme.bg }]}>
        <Icon name={segmentoTheme.icon} size={72} color={segmentoTheme.fg} />

        {/* Badge "ACTIVA" top-left */}
        <View style={styles.imageTopLeft}>
          <Badge tone="primary">{`● ${subasta.estado === 'activa' ? 'ACTIVA' : subasta.estado.toUpperCase()}`}</Badge>
        </View>

        {/* Badge de moneda bottom-right */}
        <View style={styles.imageBottomRight}>
          <View style={styles.currencyBadge}>
            <Typography style={styles.currencyText}>{subasta.moneda}</Typography>
          </View>
        </View>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Typography style={styles.segmentoLabel}>
          {SEGMENTO_LABEL[subasta.segmento].toUpperCase()}
        </Typography>
        <Typography variant="caption" muted style={styles.categoria}>
          Categoría: {CATEGORIA_LABEL[subasta.categoria]}
        </Typography>

        <Typography variant="h3" numberOfLines={2} style={styles.titulo}>
          {subasta.titulo}
        </Typography>

        <View style={styles.metaRow}>
          <Icon name="bank" size={14} color={colors.textMuted} />
          <Typography variant="caption" muted numberOfLines={1} style={styles.metaText}>
            {subasta.rematador}
          </Typography>
        </View>

        <Button onPress={onPress} rightIcon={<Icon name="arrow-right" color={colors.textInverse} size={18} />}>
          Entrar
        </Button>
      </View>
    </Card>
  );
}

/**
 * Tarjeta COMPACTA horizontal — usada en lista de subastas próximas.
 *
 * Layout (alineado al Figma):
 *   ┌──────┬───────────────────────────────┐
 *   │      │ [PRÓXIMA]  Segmento: X        │
 *   │ IMG  │ Título                        │
 *   │ [$$] │ 📅 Fecha                      │
 *   │      │ 📍 Ubicación                  │
 *   │      │ Categoría: X                  │
 *   └──────┴───────────────────────────────┘
 */
export function SubastaCardCompact({ subasta, onPress, style }: Props) {
  const segmentoTheme = SEGMENTO_THEME[subasta.segmento];

  return (
    <Card
      onPress={onPress as any}
      variant="flat"
      padding="none"
      style={[styles.cardCompact, style]}
    >
      {/* Imagen cuadrada izquierda */}
      <View style={[styles.compactImage, { backgroundColor: segmentoTheme.bg }]}>
        <Icon name={segmentoTheme.icon} size={36} color={segmentoTheme.fg} />
        <View style={styles.compactCurrencyWrap}>
          <View style={styles.currencyBadgeSmall}>
            <Typography style={styles.currencyTextSmall}>{subasta.moneda}</Typography>
          </View>
        </View>
      </View>

      {/* Body derecho */}
      <View style={styles.compactBody}>
        <View style={styles.compactHeaderRow}>
          <Badge tone="info">PRÓXIMA</Badge>
          <Typography variant="caption" muted style={styles.compactSegmento} numberOfLines={1}>
            Segmento: {SEGMENTO_LABEL[subasta.segmento]}
          </Typography>
        </View>

        <Typography variant="h3" numberOfLines={2} style={styles.compactTitulo}>
          {subasta.titulo}
        </Typography>

        <View style={styles.metaRow}>
          <Icon name="calendar" size={14} color={colors.textMuted} />
          <Typography variant="caption" muted style={styles.metaText}>
            {formatFecha(subasta.fechaInicio)}
          </Typography>
        </View>

        <View style={styles.metaRow}>
          <Icon name="search" size={14} color={colors.textMuted} />
          <Typography variant="caption" muted numberOfLines={1} style={styles.metaText}>
            {subasta.ubicacion}
          </Typography>
        </View>

        <Typography variant="caption" muted>
          Categoría: {CATEGORIA_LABEL[subasta.categoria]}
        </Typography>
      </View>
    </Card>
  );
}

// ── Mapeo segmento → tema visual del placeholder ─────────────────────────────

type SegmentoTheme = { bg: string; fg: string; icon: IconName };

const SEGMENTO_THEME: Record<SubastaSegmento, SegmentoTheme> = {
  arte: { bg: '#F5E6F8', fg: '#9333EA', icon: 'image' },
  joyas: { bg: colors.warningSoft, fg: colors.warning, icon: 'star' },
  vehiculos: { bg: colors.infoSoft, fg: colors.info, icon: 'check-doc' },
  relojeria: { bg: colors.successSoft, fg: colors.success, icon: 'clock' },
  antiguedades: { bg: '#FEF3E2', fg: '#C2410C', icon: 'inbox' },
  diseno: { bg: '#DBEAFE', fg: '#1D4ED8', icon: 'image' },
  coleccion: { bg: '#F3E8FF', fg: '#6D28D9', icon: 'bag' },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatFecha(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const dia = d.getDate();
  const mes = meses[d.getMonth()];
  const hora = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dia} ${mes} - ${hora}:${min}`;
}

// ── Estilos ──────────────────────────────────────────────────────────────────

const CARD_WIDTH = 280;

const styles = StyleSheet.create({
  // ── Card grande (activa) ──
  card: {
    width: CARD_WIDTH,
    overflow: 'hidden',
  },
  imageArea: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageTopLeft: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
  },
  imageBottomRight: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
  },
  currencyBadge: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  currencyText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.text,
    letterSpacing: letterSpacing.wider,
  },
  body: {
    padding: spacing.base,
    gap: 2,
  },
  segmentoLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    letterSpacing: letterSpacing.wider,
  },
  categoria: {
    marginBottom: spacing.xs,
  },
  titulo: {
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginBottom: spacing.sm,
  },
  metaText: {
    flexShrink: 1,
  },

  // ── Card compacta (próxima) ──
  cardCompact: {
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: 140,
  },
  compactImage: {
    width: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactCurrencyWrap: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
  },
  currencyBadgeSmall: {
    backgroundColor: colors.surface,
    borderRadius: radius.xs,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  currencyTextSmall: {
    fontSize: 9,
    fontWeight: fontWeight.bold,
    color: colors.text,
    letterSpacing: letterSpacing.wider,
  },
  compactBody: {
    flex: 1,
    padding: spacing.md,
    gap: 4,
  },
  compactHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  compactSegmento: {
    flexShrink: 1,
  },
  compactTitulo: {
    marginBottom: spacing.xs,
  },
});
