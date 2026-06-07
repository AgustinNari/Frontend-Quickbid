import React, { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import BottomNavBar, { BOTTOM_NAV_HEIGHT } from '../components/BottomNavBar';
import { ScreenHeader } from '../components/ScreenHeader';
import { EmptyState, Icon, Loader } from '../ui';
import { colors, fontSize, fontWeight, layout, radius, spacing } from '../theme';
import { mediosPagoApi } from '../api/mediosPago';
import { MedioPagoDto } from '../types/mediosPago';

type Props = NativeStackScreenProps<RootStackParamList, 'MetodosPago'>;

export default function MetodosPagoScreen({ navigation }: Props) {
  const [items, setItems] = useState<MedioPagoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      setItems(await mediosPagoApi.listar());
    } catch (loadError) {
      setItems([]);
      setError(loadError instanceof Error ? loadError.message : 'No pudimos cargar los medios.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const principal = (item: MedioPagoDto) => Alert.alert(
    'Cambiar medio principal',
    `Usar ${item.aliasVisible} como principal para ${item.moneda}?`,
    [{ text: 'Cancelar', style: 'cancel' }, { text: 'Confirmar', onPress: async () => {
      try { await mediosPagoApi.marcarPrincipal(item.id); cargar(); } catch (actionError) { Alert.alert('No se pudo actualizar', message(actionError)); }
    }}],
  );

  const eliminar = (item: MedioPagoDto) => Alert.alert(
    'Eliminar medio',
    `Dar de baja ${item.aliasVisible}?`,
    [{ text: 'Cancelar', style: 'cancel' }, { text: 'Eliminar', style: 'destructive', onPress: async () => {
      try { await mediosPagoApi.eliminar(item.id); cargar(); } catch (actionError) { Alert.alert('No se pudo eliminar', message(actionError)); }
    }}],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={() => navigation.goBack()} />
      {loading ? <Loader fullScreen label="Cargando medios de pago..." /> : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => cargar(true)} />}
        >
          <Text style={styles.title}>Metodos de pago</Text>
          <Text style={styles.subtitle}>Gestiona tus medios y su estado de verificacion.</Text>
          <TouchableOpacity style={styles.add} onPress={() => navigation.navigate('SeleccionTipoPago')}><Text style={styles.addText}>+ Agregar nuevo</Text></TouchableOpacity>
          {error ? (
            <EmptyState icon={<Icon name="alert" size={48} color={colors.textSubtle} />} title="No pudimos cargar tus medios" description={error} actionLabel="Reintentar" onAction={() => cargar()} />
          ) : items.length === 0 ? (
            <EmptyState icon={<Icon name="card" size={48} color={colors.textSubtle} />} title="Sin medios guardados" description="Agrega un medio para enviarlo a verificacion." />
          ) : items.map(item => <PaymentCard key={item.id} item={item} onPrincipal={() => principal(item)} onDelete={() => eliminar(item)} />)}
        </ScrollView>
      )}
      <BottomNavBar activeTab="menu" navigation={navigation} />
    </SafeAreaView>
  );
}

function PaymentCard({ item, onPrincipal, onDelete }: { item: MedioPagoDto; onPrincipal: () => void; onDelete: () => void }) {
  const verified = item.estado === 'verificado';
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.icon}><Icon name={item.tipo === 'tarjeta' ? 'card' : item.tipo === 'cuenta_bancaria' ? 'bank' : 'check-doc'} size={22} color={colors.primary} /></View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.aliasVisible}</Text>
          <Text style={styles.detail}>{item.banco ?? typeLabel(item.tipo)}{item.ultimos4 ? ` - termina en ${item.ultimos4}` : ''}</Text>
          <Text style={styles.detail}>{item.moneda}{item.verificadoHasta ? ` - verificado hasta ${new Date(item.verificadoHasta).toLocaleDateString('es-AR')}` : ''}</Text>
        </View>
        {item.principal ? <View style={styles.primaryBadge}><Text style={styles.primaryText}>PRINCIPAL</Text></View> : null}
      </View>
      <View style={[styles.stateBadge, verified ? styles.stateVerified : styles.statePending]}><Text style={styles.stateText}>{item.estado.replaceAll('_', ' ')}</Text></View>
      {!verified ? <Text style={styles.warning}>Este medio todavia no esta habilitado para acciones que requieran verificacion.</Text> : null}
      <View style={styles.actions}>
        {!item.principal ? <TouchableOpacity onPress={onPrincipal} disabled={!verified}><Text style={[styles.action, !verified && styles.disabled]}>Marcar principal</Text></TouchableOpacity> : null}
        <TouchableOpacity onPress={onDelete}><Text style={styles.delete}>Eliminar</Text></TouchableOpacity>
      </View>
    </View>
  );
}

function typeLabel(type: MedioPagoDto['tipo']) {
  return type === 'tarjeta' ? 'Tarjeta' : type === 'cuenta_bancaria' ? 'Cuenta bancaria' : 'Cheque certificado';
}
function message(error: unknown) { return error instanceof Error ? error.message : 'Intenta nuevamente.'; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: layout.screenPaddingHorizontal, paddingBottom: BOTTOM_NAV_HEIGHT + spacing.xl },
  title: { fontSize: fontSize['4xl'], fontWeight: fontWeight.bold, color: colors.text },
  subtitle: { color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.base },
  add: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginBottom: spacing.base },
  addText: { color: colors.white, fontWeight: fontWeight.semibold },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderMuted, borderRadius: radius.lg, padding: spacing.base, marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  icon: { width: 42, height: 42, borderRadius: radius.md, backgroundColor: colors.infoSoft, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  name: { color: colors.text, fontWeight: fontWeight.semibold, fontSize: fontSize.base },
  detail: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 2 },
  primaryBadge: { backgroundColor: colors.primary, borderRadius: radius.xs, paddingHorizontal: spacing.xs, paddingVertical: 3 },
  primaryText: { color: colors.white, fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  stateBadge: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4, marginTop: spacing.md },
  stateVerified: { backgroundColor: colors.successSoft },
  statePending: { backgroundColor: colors.warningSoft },
  stateText: { color: colors.text, fontSize: fontSize.xs, fontWeight: fontWeight.bold, textTransform: 'uppercase' },
  warning: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.sm },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.lg, marginTop: spacing.md },
  action: { color: colors.primary, fontWeight: fontWeight.semibold },
  disabled: { color: colors.textSubtle },
  delete: { color: colors.danger, fontWeight: fontWeight.semibold },
});
