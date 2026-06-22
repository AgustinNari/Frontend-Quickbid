import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import BottomNavBar, { BOTTOM_NAV_HEIGHT } from '../components/BottomNavBar';
import { ScreenHeader } from '../components/ScreenHeader';
import { Icon } from '../ui';
import {
  colors,
  fontSize,
  fontWeight,
  layout,
  radius,
  spacing,
} from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Ayuda'>;

const TOPICS = [
  {
    title: 'Consignaciones',
    subtitle: 'Como cargar y vender un bien',
    content:
      'Carga fotos y datos claros del bien. Vas a poder seguir la revision, aceptar el acuerdo y, si corresponde, elegir retiro o una direccion guardada para la devolucion.',
  },
  {
    title: 'Pujas y subastas',
    subtitle: 'Reglas, incrementos y resultados',
    content:
      'La inscripcion reserva tu acceso, pero no realiza una puja. En vivo debes elegir un medio verificado, compatible con la moneda y con limite suficiente para el monto ofertado.',
  },
  {
    title: 'Pagos y cobros',
    subtitle: 'Medios, comisiones y comprobantes',
    content:
      'Cada pago muestra solo medios compatibles y vigentes. Los cobros por una venta se informan en el detalle de la consignacion; los pagos y envios de esta version son simulados.',
  },
  {
    title: 'Cuenta y seguridad',
    subtitle: 'Acceso, contrasena y datos',
    content:
      'Desde Perfil podes actualizar tus datos, direcciones y medios de pago. Nunca compartas tu contrasena ni codigos recibidos por correo.',
  },
  {
    title: 'Sistema de categorias',
    subtitle: 'Como acumular puntos',
    content:
      'Tu categoria depende de la actividad y los puntos registrados por QuickBid. Algunas subastas exigen una categoria minima; la pantalla de acceso explica cuando no se cumple.',
  },
];

export default function AyudaScreen({ navigation }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Ayuda y soporte</Text>
        <Text style={styles.subtitle}>En que podemos ayudarte?</Text>
        <Text style={styles.section}>CATEGORIAS FRECUENTES</Text>
        {TOPICS.map(topic => {
          const isExpanded = expanded === topic.title;
          return (
            <View key={topic.title} style={styles.topic}>
              <TouchableOpacity
                style={[styles.card, isExpanded ? styles.cardExpanded : null]}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityState={{ expanded: isExpanded }}
                onPress={() => setExpanded(isExpanded ? null : topic.title)}
              >
                <View style={styles.icon}>
                  <Icon name="check-doc" size={20} color={colors.primary} />
                </View>
                <View style={styles.body}>
                  <Text style={styles.cardTitle}>{topic.title}</Text>
                  <Text style={styles.cardSubtitle}>{topic.subtitle}</Text>
                </View>
                <Icon
                  name={isExpanded ? 'minus' : 'plus'}
                  size={18}
                  color={colors.primary}
                />
              </TouchableOpacity>
              {isExpanded ? (
                <View style={styles.answer}>
                  <Text style={styles.answerText}>{topic.content}</Text>
                </View>
              ) : null}
            </View>
          );
        })}
        <View style={styles.contact}>
          <Text style={styles.contactTitle}>Tenes otra consulta?</Text>
          <Text style={styles.contactText}>
            Contactanos en ayuda@quickbid.com
          </Text>
          <Text style={styles.contactNote}>
            La asistencia se gestiona por correo; no hay chat en esta version.
          </Text>
        </View>
      </ScrollView>
      <BottomNavBar activeTab="menu" navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    padding: layout.screenPaddingHorizontal,
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing.xl,
  },
  title: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.base,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  section: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    padding: spacing.base,
  },
  topic: { marginBottom: spacing.sm },
  cardExpanded: {
    borderColor: colors.primary,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  answer: {
    backgroundColor: colors.infoSoft,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.primary,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    padding: spacing.base,
  },
  answerText: {
    color: colors.text,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.base,
    backgroundColor: colors.infoSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  cardTitle: {
    color: colors.text,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  cardSubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  contact: { alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  contactTitle: {
    color: colors.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  contactText: { color: colors.text, fontSize: fontSize.sm },
  contactNote: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textAlign: 'center',
  },
});
