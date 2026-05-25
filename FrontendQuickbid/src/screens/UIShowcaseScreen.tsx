import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import {
  Heading,
  Subheading,
  Body,
  Caption,
  Typography,
  Button,
  TextField,
  Card,
  Badge,
  ScreenContainer,
  EmptyState,
  Loader,
  Icon,
} from '../ui';
import { colors, spacing, radius } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'UIShowcase'>;

/**
 * Pantalla showcase del sistema visual.
 *
 * Sirve como referencia viva para el equipo: cada sección muestra un componente
 * con sus variantes y props relevantes. Cuando se agreguen componentes nuevos,
 * sumar acá un Section que los demuestre.
 *
 * No es parte del producto final — es solo herramienta interna de diseño.
 */

export default function UIShowcaseScreen(_props: Props) {
  const [text, setText] = useState('');
  const [errorText, setErrorText] = useState('');
  const [showLoader, setShowLoader] = useState(false);

  return (
    <ScreenContainer>
      <Heading>UI Showcase</Heading>
      <Body muted style={styles.subtitle}>
        Sistema visual de QuickBid. Referencia de componentes.
      </Body>

      {/* Tipografía */}
      <Section title="Tipografía">
        <Typography variant="displayLg">Display Lg</Typography>
        <Typography variant="display">Display</Typography>
        <Heading>Heading (h1)</Heading>
        <Subheading>Subheading (h2)</Subheading>
        <Typography variant="h3">Heading (h3)</Typography>
        <Body>Body — texto principal.</Body>
        <Body muted>Body muted — texto secundario.</Body>
        <Typography variant="bodySm">Body small.</Typography>
        <Typography variant="label">LABEL</Typography>
        <Caption>Caption / helper text</Caption>
      </Section>

      {/* Paleta */}
      <Section title="Paleta">
        <View style={styles.palette}>
          <Swatch color={colors.primary} name="primary" />
          <Swatch color={colors.background} name="bg" border />
          <Swatch color={colors.surface} name="surface" border />
          <Swatch color={colors.text} name="text" />
          <Swatch color={colors.textMuted} name="muted" />
          <Swatch color={colors.danger} name="danger" />
          <Swatch color={colors.success} name="success" />
          <Swatch color={colors.warning} name="warning" />
        </View>
      </Section>

      {/* Buttons */}
      <Section title="Botones">
        <Button onPress={() => Alert.alert('Primary')}>Primary</Button>
        <View style={styles.gap} />
        <Button variant="secondary" onPress={() => Alert.alert('Secondary')}>
          Secondary
        </Button>
        <View style={styles.gap} />
        <Button variant="ghost" onPress={() => Alert.alert('Ghost')}>
          Ghost
        </Button>
        <View style={styles.gap} />
        <Button variant="danger" onPress={() => Alert.alert('Danger')}>
          Danger
        </Button>
        <View style={styles.gap} />
        <Button leftIcon={<Icon name="plus" color={colors.textInverse} />}>
          Con icono
        </Button>
        <View style={styles.gap} />
        <Button loading={showLoader} onPress={() => {
          setShowLoader(true);
          setTimeout(() => setShowLoader(false), 1500);
        }}>
          {showLoader ? 'Cargando...' : 'Probar loading'}
        </Button>
        <View style={styles.gap} />
        <Button disabled>Deshabilitado</Button>
        <View style={styles.gap} />
        <View style={styles.row}>
          <Button size="sm" fullWidth={false}>Small</Button>
          <Button size="md" fullWidth={false}>Medium</Button>
        </View>
      </Section>

      {/* Inputs */}
      <Section title="Inputs">
        <TextField
          label="CORREO ELECTRÓNICO"
          placeholder="nombre@ejemplo.com"
          leftIcon={<Icon name="mail" color={colors.textSubtle} />}
          value={text}
          onChangeText={setText}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextField
          label="CONTRASEÑA"
          placeholder="••••••••"
          leftIcon={<Icon name="lock" color={colors.textSubtle} />}
          rightIcon={<Icon name="eye" color={colors.textSubtle} />}
          secureTextEntry
          helperText="Mínimo 8 caracteres."
        />
        <TextField
          label="CON ERROR"
          placeholder="Ingresar algo..."
          value={errorText}
          onChangeText={setErrorText}
          error={errorText.length === 0 ? 'Este campo es obligatorio' : undefined}
        />
        <TextField
          label="DESHABILITADO"
          value="No se puede editar"
          editable={false}
        />
      </Section>

      {/* Cards */}
      <Section title="Cards">
        <Card>
          <Subheading>Flat</Subheading>
          <Body muted>Variant default — border sin shadow.</Body>
        </Card>
        <View style={styles.gap} />
        <Card variant="elevated">
          <Subheading>Elevated</Subheading>
          <Body muted>Con shadow.</Body>
        </Card>
        <View style={styles.gap} />
        <Card onPress={() => Alert.alert('Card pressed')}>
          <Subheading>Pressable</Subheading>
          <Body muted>Tocá esta card.</Body>
        </Card>
      </Section>

      {/* Badges */}
      <Section title="Badges">
        <View style={styles.row}>
          <Badge>PRINCIPAL</Badge>
          <Badge tone="success">VERIFICADO</Badge>
          <Badge tone="warning">PENDIENTE</Badge>
          <Badge tone="danger">BLOQUEADO</Badge>
        </View>
        <View style={styles.gap} />
        <View style={styles.row}>
          <Badge variant="soft" tone="primary">SOFT</Badge>
          <Badge variant="soft" tone="success">SOFT</Badge>
          <Badge variant="soft" tone="warning">SOFT</Badge>
          <Badge variant="soft" tone="danger">SOFT</Badge>
          <Badge variant="soft" tone="neutral">SOFT</Badge>
        </View>
      </Section>

      {/* Icons */}
      <Section title="Iconos (sample)">
        <View style={styles.iconGrid}>
          {(['user', 'lock', 'mail', 'eye', 'arrow-left', 'check', 'check-circle',
             'x', 'plus', 'star', 'trash', 'edit', 'card', 'bank', 'bell',
             'bag', 'menu', 'search', 'filter', 'calendar', 'info', 'alert',
             'inbox', 'image', 'camera', 'upload'] as const).map((n) => (
            <View key={n} style={styles.iconCell}>
              <Icon name={n} color={colors.text} size={24} />
              <Caption>{n}</Caption>
            </View>
          ))}
        </View>
      </Section>

      {/* Loader */}
      <Section title="Loader">
        <Loader size="small" />
        <View style={styles.gap} />
        <Loader label="Validando tus datos..." />
      </Section>

      {/* Empty state */}
      <Section title="Empty state">
        <View style={styles.emptyWrap}>
          <EmptyState
            icon={<Icon name="inbox" size={48} color={colors.textSubtle} />}
            title="No hay subastas todavía"
            description="Vuelve más tarde para descubrir nuevas oportunidades."
            actionLabel="Recargar"
            onAction={() => Alert.alert('Recargar')}
          />
        </View>
      </Section>
    </ScreenContainer>
  );
}

// ── Sub-componentes locales del showcase ─────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Typography variant="overline" color={colors.primary} style={styles.sectionTitle}>
        {title.toUpperCase()}
      </Typography>
      {children}
    </View>
  );
}

function Swatch({ color, name, border }: { color: string; name: string; border?: boolean }) {
  return (
    <View style={styles.swatchWrap}>
      <View
        style={[
          styles.swatch,
          { backgroundColor: color },
          border ? styles.swatchBorder : null,
        ]}
      />
      <Caption>{name}</Caption>
    </View>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing['2xl'],
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  gap: {
    height: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  palette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  swatchWrap: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  swatch: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
  },
  swatchBorder: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.base,
  },
  iconCell: {
    alignItems: 'center',
    gap: spacing.xs,
    width: 72,
  },
  emptyWrap: {
    minHeight: 280,
  },
});
