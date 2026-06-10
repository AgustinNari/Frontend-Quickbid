import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import BottomNavBar, { BOTTOM_NAV_HEIGHT } from '../components/BottomNavBar';
import { ScreenHeader } from '../components/ScreenHeader';
import { EmptyState, Icon, Loader } from '../ui';
import {
  colors,
  fontSize,
  fontWeight,
  layout,
  radius,
  spacing,
} from '../theme';
import { direccionesApi } from '../api/direcciones';
import { CrearDireccionRequest, DireccionEnvioDto } from '../types/direcciones';

type Props = NativeStackScreenProps<RootStackParamList, 'DireccionesEnvio'>;
const EMPTY: CrearDireccionRequest = {
  alias: '',
  destinatario: '',
  calle: '',
  numero: '',
  piso: null,
  codigoPostal: '',
  localidad: '',
  provincia: '',
  pais: 'Argentina',
  telefono: null,
};

export default function DireccionesEnvioScreen({ navigation }: Props) {
  const [items, setItems] = useState<DireccionEnvioDto[]>([]);
  const [form, setForm] = useState<CrearDireccionRequest>(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await direccionesApi.listar());
    } catch (loadError) {
      setItems([]);
      setError(message(loadError));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    cargar();
  }, [cargar]);

  const crear = async () => {
    const required = [
      form.alias,
      form.destinatario,
      form.calle,
      form.numero,
      form.codigoPostal,
      form.localidad,
      form.provincia,
      form.pais,
    ];
    if (required.some(value => !value.trim()))
      return Alert.alert(
        'Campos requeridos',
        'Completa todos los campos obligatorios.',
      );
    setSaving(true);
    try {
      await direccionesApi.crear(form);
      setForm(EMPTY);
      setShowForm(false);
      cargar();
    } catch (saveError) {
      Alert.alert('No se pudo crear', message(saveError));
    } finally {
      setSaving(false);
    }
  };
  const principal = (item: DireccionEnvioDto) =>
    Alert.alert('Direccion principal', `Usar ${item.alias} como principal?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          try {
            await direccionesApi.marcarPrincipal(item.id);
            cargar();
          } catch (e) {
            Alert.alert('No se pudo actualizar', message(e));
          }
        },
      },
    ]);
  const eliminar = (item: DireccionEnvioDto) =>
    Alert.alert('Eliminar direccion', `Dar de baja ${item.alias}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await direccionesApi.eliminar(item.id);
            cargar();
          } catch (e) {
            Alert.alert('No se pudo eliminar', message(e));
          }
        },
      },
    ]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={() => navigation.goBack()} />
      {loading ? (
        <Loader fullScreen label="Cargando direcciones..." />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Direcciones de envio</Text>
          <Text style={styles.subtitle}>
            Gestiona hasta cinco direcciones activas.
          </Text>
          <TouchableOpacity
            style={styles.add}
            onPress={() => setShowForm(value => !value)}
          >
            <Text style={styles.addText}>
              {showForm ? 'Cancelar' : '+ Nueva direccion'}
            </Text>
          </TouchableOpacity>
          {showForm ? (
            <AddressForm
              form={form}
              onChange={setForm}
              onSubmit={crear}
              saving={saving}
            />
          ) : null}
          {error ? (
            <EmptyState
              icon={<Icon name="alert" size={48} color={colors.textSubtle} />}
              title="No pudimos cargar las direcciones"
              description={error}
              actionLabel="Reintentar"
              onAction={cargar}
            />
          ) : items.length === 0 ? (
            <EmptyState
              icon={
                <Icon name="check-doc" size={48} color={colors.textSubtle} />
              }
              title="Sin direcciones"
              description="Agrega una direccion de envio."
            />
          ) : (
            items.map(item => (
              <AddressCard
                key={item.id}
                item={item}
                onPrincipal={() => principal(item)}
                onDelete={() => eliminar(item)}
              />
            ))
          )}
        </ScrollView>
      )}
      <BottomNavBar activeTab="menu" navigation={navigation} />
    </SafeAreaView>
  );
}

function AddressForm({
  form,
  onChange,
  onSubmit,
  saving,
}: {
  form: CrearDireccionRequest;
  onChange: (value: CrearDireccionRequest) => void;
  onSubmit: () => void;
  saving: boolean;
}) {
  const field = (key: keyof CrearDireccionRequest, placeholder: string) => (
    <TextInput
      style={styles.input}
      value={form[key] ?? ''}
      onChangeText={value => onChange({ ...form, [key]: value || null })}
      placeholder={placeholder}
      placeholderTextColor={colors.textSubtle}
    />
  );
  return (
    <View style={styles.form}>
      {field('alias', 'Alias, ej. Casa')}
      {field('destinatario', 'Destinatario')}
      <View style={styles.fieldsRow}>
        <View style={styles.flex}>{field('calle', 'Calle')}</View>
        <View style={styles.number}>{field('numero', 'Numero')}</View>
      </View>
      {field('piso', 'Piso / departamento (opcional)')}
      {field('codigoPostal', 'Codigo postal')}
      {field('localidad', 'Localidad')}
      {field('provincia', 'Provincia')}
      {field('pais', 'Pais')}
      {field('telefono', 'Telefono (opcional)')}
      <TouchableOpacity
        style={styles.submit}
        onPress={onSubmit}
        disabled={saving}
      >
        <Text style={styles.addText}>
          {saving ? 'Guardando...' : 'Guardar direccion'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function AddressCard({
  item,
  onPrincipal,
  onDelete,
}: {
  item: DireccionEnvioDto;
  onPrincipal: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.alias}</Text>
        {item.principal ? <Text style={styles.primary}>PRINCIPAL</Text> : null}
      </View>
      <Text style={styles.detail}>{item.destinatario}</Text>
      <Text style={styles.detail}>
        {item.calle} {item.numero}
        {item.piso ? `, ${item.piso}` : ''}
      </Text>
      <Text style={styles.detail}>
        {item.localidad}, {item.provincia} - {item.codigoPostal}
      </Text>
      <Text style={styles.detail}>
        {item.pais}
        {item.telefono ? ` - ${item.telefono}` : ''}
      </Text>
      <View style={styles.actions}>
        {!item.principal ? (
          <TouchableOpacity onPress={onPrincipal}>
            <Text style={styles.action}>Marcar principal</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity onPress={onDelete}>
          <Text style={styles.delete}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
function message(error: unknown) {
  return error instanceof Error ? error.message : 'Intenta nuevamente.';
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
    marginTop: spacing.xs,
    marginBottom: spacing.base,
  },
  add: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.base,
  },
  addText: { color: colors.white, fontWeight: fontWeight.semibold },
  form: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.xl,
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    color: colors.text,
    marginBottom: spacing.sm,
    backgroundColor: colors.white,
  },
  fieldsRow: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  number: { width: 100 },
  submit: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  cardTitle: {
    color: colors.text,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.lg,
  },
  primary: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  detail: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 3 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  action: { color: colors.primary, fontWeight: fontWeight.semibold },
  delete: { color: colors.danger, fontWeight: fontWeight.semibold },
});
