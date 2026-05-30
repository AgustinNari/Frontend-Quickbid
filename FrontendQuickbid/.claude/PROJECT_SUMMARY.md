# QuickBid — Resumen del Proyecto para Sesiones Futuras

> **Última actualización:** 2026-05-30  
> **Rama activa:** `setup/windows-build-fix`  
> **Repo:** https://github.com/AgustinNari/FE-DAI.git

---

## ¿Qué es este proyecto?

App de subastas en React Native (TypeScript) para la materia **FE-DAI**.  
Nombre: **QuickBid**. Es un rematador online donde los usuarios:
- Se registran con verificación de identidad (DNI)
- Vinculan métodos de pago (tarjeta / CBU / cheque)
- Navegan y se inscriben a subastas en vivo
- Pujan en tiempo real sobre lotes del catálogo

---

## Estructura del proyecto

```
src/
├── screens/          # Pantallas (navegación stack)
├── components/       # Componentes propios de QuickBid (BottomNavBar, SubastaCard, etc.)
├── ui/               # Sistema de UI genérico reutilizable (Button, TextField, Badge, etc.)
├── theme/            # Design tokens centralizados
│   ├── tokens.ts     # Fuente de verdad de colores, spacing, radius, etc.
│   └── index.ts      # Re-export de tokens.ts
├── types/            # TypeScript types (subasta.ts, medioPago.ts, inscripcion.ts, usuario.ts)
├── mocks/            # Datos hardcodeados hasta que el backend esté listo
│   ├── subastas.ts
│   ├── mediosPago.ts
│   ├── inscripciones.ts
│   └── usuarioActual.ts
└── utils/
    └── format.ts     # Helpers de formateo (precios, fechas, etc.)
```

---

## Sistema de Tokens (src/theme/tokens.ts)

**Regla clave:** Nunca usar colores hex hardcodeados en pantallas/componentes.  
Siempre importar de `../theme` (o `../../theme` desde ui/).

```typescript
import { colors, spacing, radius, fontSize, controlHeight, shadow, fontWeight } from '../theme';
```

### Colors principales
| Token | Valor | Uso |
|-------|-------|-----|
| `colors.primary` | `#0055D1` | Botones, links, acentos |
| `colors.background` | `#F3F4F6` | Fondo de pantallas |
| `colors.surface` / `colors.white` | `#FFFFFF` | Cards, inputs |
| `colors.surfaceMuted` | `#F9FAFB` | Fondos suaves, iconCards |
| `colors.text` | `#111827` | Texto principal |
| `colors.textMuted` | `#6B7280` | Texto secundario |
| `colors.textSubtle` | `#9CA3AF` | Placeholders, hints |
| `colors.textLabel` | `#374151` | Labels de inputs |
| `colors.textInverse` | `#FFFFFF` | Texto sobre botones primarios |
| `colors.border` | `#D1D5DB` | Bordes de inputs |
| `colors.borderMuted` | `#E5E7EB` | Bordes suaves, separadores de headers |
| `colors.danger` | `#EF4444` | Errores, eliminar |
| `colors.infoSoft` | `#DBEAFE` | Fondos informativos (`#EFF6FF` no existe, usar este) |

### Dos excepciones sin token (mantener hardcodeadas)
- `'#93C5FD'` — borde punteado del upload box (IdentityScreen, ChequeCertificadoScreen)
- `'#F8FAFF'` — fondo del upload box

### Spacing
`xs:4, sm:8, md:12, base:16, lg:20, xl:24, 2xl:32, 3xl:40, 4xl:48, 5xl:64`

### Radius
`xs:4, sm:6, md:8, base:10, lg:12, xl:16, 2xl:20, pill:999`

### Control Height (para botones e inputs)
`sm:36, md:44, base:52, lg:60`

---

## Sistema UI (src/ui/)

Biblioteca de componentes genéricos. Importar desde `'../ui'`:

```typescript
import { Button, TextField, Card, Badge, Icon, Typography, Heading, Body,
         Caption, Subheading, ScreenContainer, EmptyState, Loader } from '../ui';
```

### Button
```tsx
<Button onPress={fn}>Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Danger</Button>
<Button size="sm" fullWidth={false}>Small</Button>
<Button loading>Cargando...</Button>
<Button disabled>Off</Button>
<Button leftIcon={<Icon name="plus" color={colors.textInverse} />}>Con icono</Button>
```

### TextField
```tsx
<TextField label="CORREO" placeholder="..." leftIcon={...} value={v} onChangeText={fn} />
<TextField label="PASS" secureTextEntry helperText="Mínimo 8 caracteres." />
<TextField label="ERROR" error="Campo requerido" />
<TextField label="OFF" editable={false} />
```

### Card
```tsx
<Card>Contenido</Card>
<Card variant="elevated">Con shadow</Card>
<Card onPress={fn}>Pressable</Card>
```

### Badge
```tsx
<Badge>PRINCIPAL</Badge>
<Badge tone="success">VERIFICADO</Badge>
<Badge tone="warning">PENDIENTE</Badge>
<Badge tone="danger">BLOQUEADO</Badge>
<Badge variant="soft" tone="primary">SOFT</Badge>
```

### Icon
```tsx
<Icon name="user" size={24} color={colors.text} />
```
Nombres disponibles: `user, lock, mail, eye, arrow-left, check, check-circle, x, plus, star, trash, edit, card, bank, bell, bag, menu, search, filter, calendar, info, alert, inbox, image, camera, upload`

### Typography
```tsx
<Typography variant="displayLg">Texto</Typography>
// Variants: displayLg, display, h1, h2, h3, body, bodyMd, bodySm, label, caption, overline
// Shortcuts: <Heading>, <Subheading>, <Body muted>, <Caption>, <Label>, <Overline>
```

### UIShowcaseScreen
Pantalla de referencia visual viva. Navegar a ella desde `navigation.navigate('UIShowcase')`.  
**No es parte del producto final.** Es herramienta interna de diseño.

---

## Pantallas implementadas

### Flujo de autenticación / registro
```
Splash → Login → Register → Identity → Verifying
         ↓                              ↓
         RecuperacionCuenta          (espera validación por mail)
         ↓
         Security → LimitedAccess → MetodosPago
         
         Login → EnlaceRegistro → Security (si ya registró antes)
```

### Flujo de métodos de pago
```
MetodosPago → SeleccionTipoPago → NuevaTarjeta      → ValidandoPago
                                → CuentaBancaria    → ValidandoPago
                                → ChequeCertificado → ValidandoPago
```

### Flujo de subastas (funcionalidad principal)
```
Subastas (lista) → SubastaDetail → InscripcionSubasta → InscripcionExito
                 → CatalogoSubasta → ItemDetail
```

### Otras
- `Home` — placeholder inicial
- `Details` — placeholder
- `UIShowcase` — showcase del sistema visual

---

## Tipos principales (src/types/)

### subasta.ts
- `SubastaEstado`: `'activa' | 'proxima' | 'finalizada'`
- `SubastaCategoria`: `'comun' | 'especial' | 'plata' | 'oro' | 'platino'`
- `SubastaSegmento`: `'arte' | 'joyas' | 'vehiculos' | 'relojeria' | 'antiguedades' | 'diseno' | 'coleccion'`
- `SubastaMoneda`: `'ARS' | 'USD'`
- `SubastaModalidad`: `'virtual' | 'presencial' | 'mixta'`
- `SubastaResumen` — para cards en listado
- `SubastaDetalle` — para pantalla de detalle (hereda Resumen)
- `ItemCatalogo` — lote en el catálogo
- `ItemDetalle` — lote con descripción completa
- Labels: `SEGMENTO_LABEL, CATEGORIA_LABEL, ESTADO_LABEL, MODALIDAD_LABEL`

### medioPago.ts, inscripcion.ts, usuario.ts
Contienen tipos para las entidades de pago, inscripciones y usuario actual.

---

## Componentes de dominio (src/components/)

| Componente | Descripción |
|-----------|-------------|
| `BottomNavBar` | Barra inferior con logo central elevado. Tabs: `notif, consignar, subastas, compras, menu` |
| `SubastaCard` | Card grande de subasta (carrusel) + `SubastaCardCompact` (lista horizontal) |
| `FilterChips` | Chips de filtro horizontal con scroll |
| `ItemCatalogoCard` | Card de lote en el catálogo |
| `ScreenHeader` | Header reutilizable con back button y brand |
| `SubastaInfoRow` | Fila de info (icono + texto) para detalle de subasta |

---

## Mocks (src/mocks/)

Datos temporales hasta que el backend esté listo:
- `MOCK_SUBASTAS` — lista de subastas activas y próximas
- `MOCK_MEDIOS_PAGO` — métodos de pago del usuario
- `MOCK_INSCRIPCIONES` — inscripciones del usuario actual
- `MOCK_USUARIO_ACTUAL` — usuario logueado

**Cuando el backend esté listo:** reemplazar con `TanStack Query` + `zod` para validación de respuestas.  
Los endpoints están en `Material/Endpoints.docx`.

---

## Comandos útiles

```bash
# Levantar Metro
npm start

# Build + instalar en Android (macOS/Linux)
npm run android

# Build + instalar en Android con dispositivo físico en Windows ← EL QUE FUNCIONA ACÁ
npm run android:device
# Equivale a: adb reverse tcp:8081 tcp:8081 && react-native run-android --no-packager

# Si Metro ya corre y perdiste conexión con el celu (ej. reiniciaste la PC):
npm run reverse   # solo reenvía el puerto, luego sacudí el celu → Reload

# Ver pantalla UIShowcase directamente (para revisar componentes UI)
# Cambiar initialRouteName a 'UIShowcase' en App.tsx (temporalmente), revertir después
```

## Configuración del entorno Windows (este equipo)

| Variable | Valor |
|----------|-------|
| `ANDROID_HOME` | `E:\Android\Sdk` |
| `adb` | `E:\Android\Sdk\platform-tools\adb.exe` |
| Dispositivo de prueba | Redmi Note 9 Pro (Android 12 / API 31) |

**`android/local.properties`** apunta al SDK en `E:\Android\Sdk`.  
Este archivo **no se commitea** (está en `.gitignore`). Si alguien clona el repo en Windows tiene que crearlo manualmente con:
```
sdk.dir=E\:\\Android\\Sdk
```
(o el path donde tenga instalado el SDK).

### Por qué se necesita `adb reverse`
Con dispositivo físico conectado por USB, el celular intenta conectar a `localhost:8081` en **sí mismo**, no en la PC. `adb reverse tcp:8081 tcp:8081` redirige ese puerto al Metro que corre en la PC. Sin esto la app abre pero muestra pantalla en blanco o "Unable to load script".

---

## Estado del proyecto (al 2026-05-30)

### ✅ Completado
- Sistema de tokens (`src/theme/tokens.ts`) — **todas las screens migradas**
- Sistema UI completo (`src/ui/`) con Button, TextField, Card, Badge, Icon, Typography, Loader, EmptyState, ScreenContainer
- Flujo completo de autenticación/registro (15 pantallas)
- Flujo completo de métodos de pago (6 pantallas)
- Pantalla de subastas con listado, filtros, carrusel
- Detalle de subasta con tabs
- Catálogo de ítems con detalle
- Flujo de inscripción a subasta
- UIShowcaseScreen como referencia viva del sistema visual

### 🔲 Pendiente / próximo
- Conectar al backend real (reemplazar mocks)
- Pantalla de puja en vivo (sala de remates en tiempo real)
- Perfil de usuario
- Notificaciones
- TanStack Query para fetching de datos
- Validación con zod/valibot en respuestas de API

---

## Notas importantes

1. **No usar `globalStyles.ts`** — quedó como legacy, nadie lo importa. Todos usan tokens.
2. **Los componentes en `src/ui/`** son genéricos y reutilizables. Los de `src/components/` son específicos de QuickBid.
3. **`App.tsx`** registra todas las rutas. Agregar nuevas pantallas ahí.
4. **`BottomNavBar`** tiene un logo que sobresale (overhang de 26px). El wrapper tiene `height: LOGO_OVERHANG + BAR_HEIGHT`. No es `position: absolute` — empuja contenido normalmente.
5. **Git branch:** `setup/windows-build-fix` es la rama de desarrollo activa. No hay PR mergeado a main todavía.
