import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import BottomNavBar, { BOTTOM_NAV_HEIGHT } from '../components/BottomNavBar';
import { ScreenHeader } from '../components/ScreenHeader';
import { Icon } from '../ui';
import { colors, fontSize, fontWeight, layout, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Ayuda'>;

const TOPICS = [
  ['Consignaciones', 'Como cargar y vender un bien'],
  ['Pujas y subastas', 'Reglas, incrementos y resultados'],
  ['Pagos y cobros', 'Depositos, comisiones y facturacion'],
  ['Cuenta y seguridad', 'Acceso, contrasena y datos'],
  ['Sistema de categorias', 'Como acumular puntos'],
];

export default function AyudaScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Ayuda y soporte</Text>
        <Text style={styles.subtitle}>En que podemos ayudarte?</Text>
        <Text style={styles.section}>CATEGORIAS FRECUENTES</Text>
        {TOPICS.map(([title, subtitle]) => (
          <TouchableOpacity key={title} style={styles.card} activeOpacity={0.75}>
            <View style={styles.icon}><Icon name="check-doc" size={20} color={colors.primary} /></View>
            <View style={styles.body}><Text style={styles.cardTitle}>{title}</Text><Text style={styles.cardSubtitle}>{subtitle}</Text></View>
            <Icon name="arrow-right" size={18} color={colors.textSubtle} />
          </TouchableOpacity>
        ))}
        <View style={styles.contact}>
          <Text style={styles.contactTitle}>Tenes otra consulta?</Text>
          <Text style={styles.contactText}>Contactanos en ayuda@quickbid.com</Text>
          <Text style={styles.contactNote}>QuickBid no tiene integracion de chat o tickets en este bloque.</Text>
        </View>
      </ScrollView>
      <BottomNavBar activeTab="menu" navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: layout.screenPaddingHorizontal, paddingBottom: BOTTOM_NAV_HEIGHT + spacing.xl },
  title: { fontSize: fontSize['4xl'], fontWeight: fontWeight.bold, color: colors.text },
  subtitle: { color: colors.textMuted, fontSize: fontSize.base, marginTop: spacing.xs, marginBottom: spacing.xl },
  section: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: fontWeight.bold, letterSpacing: 0.8, marginBottom: spacing.sm },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderMuted, padding: spacing.base, marginBottom: spacing.sm },
  icon: { width: 40, height: 40, borderRadius: radius.base, backgroundColor: colors.infoSoft, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  cardTitle: { color: colors.text, fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  cardSubtitle: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 2 },
  contact: { alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  contactTitle: { color: colors.primary, fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  contactText: { color: colors.text, fontSize: fontSize.sm },
  contactNote: { color: colors.textMuted, fontSize: fontSize.xs, textAlign: 'center' },
});
