import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Card, Typography, Badge, Icon, IconName } from '../ui';
import { colors, spacing, radius, fontSize, fontWeight } from '../theme';
import {
  SubastaResumen,
  SubastaSegmento,
  SEGMENTO_LABEL,
  CATEGORIA_LABEL,
  ESTADO_LABEL,
} from '../types/subasta';

/**
 * Tarjeta para representar una subasta en el listado.
 *
 * Layout:
 *   ┌─────────────────────────────────┐
 *   │  [hero color + icon]            │
 *   │      [estado]      [categoría]  │
 *   ├─────────────────────────────────┤
 *   │  Título                         │
 *   │  por Rematador                  │
 *   │  [segmento] [moneda]            │
 *   │  📍 Ubicación                   │
 *   │  🕐 Inicia el ... (si próxima)  │
 *   │  🧾 N lotes                     │
 *   └─────────────────────────────────┘
 *
 * Si se pasa `onPress`, la card es tappeable.
 */

type Props = {
  subasta: SubastaResumen;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function SubastaCard({ subasta, onPress, style }: Props) {
  const segmentoTheme = SEGMENTO_THEME[subasta.segmento];
  const isActiva = subasta.estado === 'activa';
  const isFutura = subasta.estado === 'proxima';

  return (
    <Card
      onPress={onPress as any}
      variant="elevated"
      padding="none"
      style={[styles.card, style]}
    >
      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: segmentoTheme.bg }]}>
        <Icon name={segmentoTheme.icon} size={56} color={segmentoTheme.fg} />

        {/* Badges sobre el hero */}
        <View style={styles.heroTopRow}>
          <Badge tone={isActiva ? 'danger' : isFutura ? 'info' : 'neutral'}>
            {isActiva ? '● EN VIVO' : ESTADO_LABEL[subasta.estado]}
          </Badge>
          <Badge tone="neutral" variant="soft">
            {CATEGORIA_LABEL[subasta.categoria]}
          </Badge>
        </View>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Typography variant="h3" numberOfLines={2}>
          {subasta.titulo}
        </Typography>
        <Typography variant="caption" muted style={styles.author}>
          por {subasta.rematador}
        </Typography>

        <View style={styles.chipRow}>
          <View style={styles.chip}>
            <Typography style={styles.chipText}>
              {SEGMENTO_LABEL[subasta.segmento]}
            </Typography>
          </View>
          <View style={styles.chip}>
            <Typography style={styles.chipText}>{subasta.moneda}</Typography>
          </View>
          {subasta.cantidadItems != null ? (
            <View style={styles.chip}>
              <Typography style={styles.chipText}>
                {subasta.cantidadItems} lotes
              </Typography>
            </View>
          ) : null}
        </View>

        <View style={styles.metaRow}>
          <Icon name="search" size={14} color={colors.textMuted} />
          <Typography variant="caption" muted style={styles.metaText} numberOfLines={1}>
            {subasta.ubicacion}
          </Typography>
        </View>

        {isFutura ? (
          <View style={styles.metaRow}>
            <Icon name="clock" size={14} color={colors.textMuted} />
            <Typography variant="caption" muted style={styles.metaText}>
              Inicia {formatFecha(subasta.fechaInicio)}
            </Typography>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

// ── Mapeo segmento → tema visual del hero ────────────────────────────────────

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
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const hora = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dia}/${mes} a las ${hora}:${min}`;
}

// ── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  hero: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTopRow: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  body: {
    padding: spacing.base,
    gap: spacing.xs,
  },
  author: {
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  chip: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  chipText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginTop: 2,
  },
  metaText: {
    flexShrink: 1,
  },
});
