import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import BottomNavBar, {
  NavTab,
  BOTTOM_NAV_HEIGHT,
} from '../components/BottomNavBar';
import { colors, spacing, radius, fontSize, controlHeight } from '../theme';
import { ScreenHeader } from '../components/ScreenHeader';
import { mediosPagoApi } from '../api/mediosPago';
import { ApiError } from '../api/client';
import { useNetwork } from '../context/NetworkContext';
import { MobileImage, pickImages } from '../mobile/mediaPicker';

type Props = NativeStackScreenProps<RootStackParamList, 'ChequeCertificado'>;

type Foto = MobileImage | null;

function UploadIcon({ done }: { done: boolean }) {
  const c = done ? colors.primary : colors.primary;
  return (
    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      {done ? (
        <Path
          d="M20 6L9 17l-5-5"
          stroke={c}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <>
          <Path
            d="M12 16V4M8 8l4-4 4 4"
            stroke={c}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
            stroke={c}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </>
      )}
    </Svg>
  );
}

function formatFecha(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length >= 5)
    return (
      digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4)
    );
  if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
  return digits;
}

function fechaParaApi(display: string): string {
  const [dd, mm, aaaa] = display.split('/');
  return `${aaaa}-${mm}-${dd}`;
}

export default function ChequeCertificadoScreen({ navigation }: Props) {
  const [titular, setTitular] = useState('');
  const [banco, setBanco] = useState('');
  const [moneda, setMoneda] = useState<'ARS' | 'USD'>('ARS');
  const [nacional, setNacional] = useState(true);
  const [numero, setNumero] = useState('');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState('');
  const [anverso, setAnverso] = useState<Foto>(null);
  const [reverso, setReverso] = useState<Foto>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>('subastas');
  const { confirmHeavyAction } = useNetwork();

  async function pickFoto(lado: 'anverso' | 'reverso') {
    const [foto] = await pickImages({
      selectionLimit: 1,
      quality: 0.8,
      fallbackBaseName: `cheque-${lado}`,
    });
    if (!foto) return;
    if (lado === 'anverso') setAnverso(foto);
    else setReverso(foto);
  }

  async function handleEnviar() {
    if (
      !titular.trim() ||
      !banco.trim() ||
      !numero.trim() ||
      !monto.trim() ||
      !fecha.trim()
    ) {
      Alert.alert(
        'Campos requeridos',
        'Completa titular, banco, numero, monto y fecha.',
      );
      return;
    }
    if (!anverso || !reverso) {
      Alert.alert(
        'Fotos requeridas',
        'Subí la foto del frente y del dorso del cheque.',
      );
      return;
    }
    const partes = fecha.split('/');
    if (partes.length !== 3 || partes[2].length !== 4) {
      Alert.alert('Fecha inválida', 'Usá el formato DD/MM/AAAA.');
      return;
    }
    const montoNum = parseFloat(monto.replace(',', '.'));
    if (isNaN(montoNum) || montoNum <= 0) {
      Alert.alert('Monto inválido', 'Ingresá un monto válido.');
      return;
    }

    if (!(await confirmHeavyAction())) return;
    setLoading(true);
    try {
      await mediosPagoApi.crearCheque({
        moneda,
        nacional,
        titular: titular.trim(),
        numeroCheque: numero.trim(),
        monto: montoNum,
        fechaVencimiento: fechaParaApi(fecha),
        bancoEmisor: banco.trim(),
        fotoAnverso: anverso,
        fotoReverso: reverso,
      });
      navigation.navigate('ValidandoPago');
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : 'No se pudo conectar con el servidor.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Cheque Certificado</Text>
          <Text style={styles.subtitle}>
            Pre-aprobación para depósitos físicos.
          </Text>

          <Text style={styles.label}>TITULAR</Text>
          <TextInput
            style={styles.input}
            value={titular}
            onChangeText={setTitular}
            placeholder="Titular"
            placeholderTextColor={colors.textSubtle}
          />

          <Text style={styles.label}>BANCO EMISOR</Text>
          <TextInput
            style={styles.input}
            value={banco}
            onChangeText={setBanco}
            placeholder="Banco emisor"
            placeholderTextColor={colors.textSubtle}
          />

          <Text style={styles.label}>NÚMERO DE CHEQUE</Text>
          <TextInput
            style={styles.input}
            value={numero}
            onChangeText={v => setNumero(v.replace(/\D/g, ''))}
            placeholder="Ej: 0000123456"
            placeholderTextColor={colors.textSubtle}
            keyboardType="numeric"
            autoCorrect={false}
          />

          <Text style={styles.label}>MONTO ($)</Text>
          <TextInput
            style={styles.input}
            value={monto}
            onChangeText={setMonto}
            placeholder="Ej: 100000"
            placeholderTextColor={colors.textSubtle}
            keyboardType="numeric"
            autoCorrect={false}
          />

          <Text style={styles.label}>FECHA DE VENCIMIENTO</Text>
          <TextInput
            style={styles.input}
            value={fecha}
            onChangeText={v => setFecha(formatFecha(v))}
            placeholder="DD/MM/AAAA"
            placeholderTextColor={colors.textSubtle}
            keyboardType="numeric"
            maxLength={10}
            autoCorrect={false}
          />

          <Choice
            label="MONEDA"
            values={['ARS', 'USD']}
            selected={moneda}
            onSelect={value => setMoneda(value as 'ARS' | 'USD')}
          />
          <Choice
            label="ORIGEN"
            values={['Nacional', 'Extranjero']}
            selected={nacional ? 'Nacional' : 'Extranjero'}
            onSelect={value => setNacional(value === 'Nacional')}
          />

          <Text style={styles.label}>FOTO FRENTE</Text>
          <TouchableOpacity
            style={[styles.uploadBox, anverso && styles.uploadBoxDone]}
            activeOpacity={0.7}
            onPress={() => pickFoto('anverso')}
          >
            {anverso ? (
              <Image
                source={{ uri: anverso.uri }}
                style={styles.preview}
                resizeMode="cover"
              />
            ) : (
              <>
                <UploadIcon done={false} />
                <Text style={styles.uploadText}>Toca para subir el frente</Text>
                <Text style={styles.uploadFormats}>JPG o PNG</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.label}>FOTO DORSO</Text>
          <TouchableOpacity
            style={[styles.uploadBox, reverso && styles.uploadBoxDone]}
            activeOpacity={0.7}
            onPress={() => pickFoto('reverso')}
          >
            {reverso ? (
              <Image
                source={{ uri: reverso.uri }}
                style={styles.preview}
                resizeMode="cover"
              />
            ) : (
              <>
                <UploadIcon done={false} />
                <Text style={styles.uploadText}>Toca para subir el dorso</Text>
                <Text style={styles.uploadFormats}>JPG o PNG</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.spacer} />

          <TouchableOpacity
            style={styles.btn}
            activeOpacity={0.85}
            onPress={handleEnviar}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.btnText}>Enviar para verificación</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomNavBar
        activeTab={activeTab}
        onTabPress={setActiveTab}
        navigation={navigation}
      />
    </SafeAreaView>
  );
}

function Choice({
  label,
  values,
  selected,
  onSelect,
}: {
  label: string;
  values: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.choiceRow}>
        {values.map(value => (
          <TouchableOpacity
            key={value}
            style={[styles.choice, selected === value && styles.choiceActive]}
            onPress={() => onSelect(value)}
          >
            <Text
              style={[
                styles.choiceText,
                selected === value && styles.choiceTextActive,
              ]}
            >
              {value}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  spacer: { minHeight: 16 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 28,
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing.lg,
  },

  title: {
    fontSize: fontSize['4xl'],
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.textMuted,
    marginBottom: 28,
  },

  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textLabel,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    height: 48,
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: 18,
  },
  choiceRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: 18 },
  choice: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceActive: {
    borderColor: colors.primary,
    backgroundColor: colors.infoSoft,
  },
  choiceText: { color: colors.textMuted, fontWeight: '600' },
  choiceTextActive: { color: colors.primary },

  uploadBox: {
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    borderStyle: 'dashed',
    borderRadius: radius.base,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFF',
    gap: spacing.xs,
    marginBottom: 18,
    minHeight: 100,
    overflow: 'hidden',
  },
  uploadBoxDone: {
    borderStyle: 'solid',
    borderColor: colors.primary,
    paddingVertical: 0,
  },
  preview: { width: '100%', height: 120 },
  uploadText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.primary,
  },
  uploadFormats: { fontSize: fontSize.sm, color: colors.textSubtle },

  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.base,
    height: controlHeight.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: colors.textInverse,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
});
