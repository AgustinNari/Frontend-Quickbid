# Sistema visual de QuickBid

Esta carpeta contiene el sistema de UI base de la app: componentes reutilizables y design tokens.

> **Regla principal**: cualquier nueva pantalla debe usar estos componentes y los tokens de `src/theme`. **No hardcodear colores, spacing ni font sizes** en pantallas — si falta algo, agregarlo acá primero.

## Cómo se importa

```tsx
// Componentes
import { Button, TextField, Card, Badge, Icon, ScreenContainer, Body } from '../ui';
import type { IconName } from '../ui';

// Tokens (colores, spacing, radius, etc.)
import { colors, spacing, radius, fontSize, fontWeight } from '../theme';
```

## Tokens (`src/theme/tokens.ts`)

| Categoría | Tokens | Ejemplo |
|---|---|---|
| Colores | `primary`, `background`, `surface`, `text`, `textMuted`, `textSubtle`, `textLabel`, `textInverse`, `border`, `borderMuted`, `danger`, `success`, `warning`, `info` (+ `Soft` variantes) | `colors.primary` → `#0055D1` |
| Spacing | `xs`(4), `sm`(8), `md`(12), `base`(16), `lg`(20), `xl`(24), `2xl`(32), `3xl`(40), `4xl`(48), `5xl`(64) | `spacing.lg` → 20 |
| Radius | `xs`(4), `sm`(6), `md`(8), `base`(10), `lg`(12), `xl`(16), `2xl`(20), `pill`(999) | `radius.base` → 10 |
| Font size | `xs`(10) ... `6xl`(40) | `fontSize.lg` → 16 |
| Font weight | `regular`, `medium`, `semibold`, `bold` | `fontWeight.semibold` → `'600'` |
| Shadows | `sm`, `md`, `lg`, `topBar` | `...shadow.md` |
| Control height | `sm`(36), `md`(44), `base`(52), `lg`(60) | `controlHeight.base` → 52 |

## Componentes

### `<Typography>` y aliases

```tsx
<Heading>Entrar a QuickBid</Heading>        // h1, bold, 28px
<Subheading>Detalle</Subheading>            // h2, semibold, 20px
<Body>Texto principal</Body>                // 16px, regular
<Body muted>Texto secundario</Body>         // 16px, muted color
<Label>CORREO ELECTRÓNICO</Label>           // 12px, medium, label color
<Caption>Helper text</Caption>              // 12px, muted

<Typography variant="display" primary>QuickBid</Typography>
<Typography weight="bold" align="center" danger>Error</Typography>
```

Props: `variant`, `muted` | `subtle` | `primary` | `danger` | `inverse`, `color`, `weight`, `align`, `style`, todas las de `<Text>`.

### `<Button>`

```tsx
<Button onPress={handleLogin}>Iniciar Sesión</Button>
<Button variant="secondary">Volver</Button>
<Button variant="ghost">Cancelar</Button>
<Button variant="danger">Eliminar</Button>

<Button leftIcon={<Icon name="plus" color={colors.textInverse} />}>
  Agregar nuevo
</Button>

<Button loading>Procesando...</Button>
<Button disabled>Deshabilitado</Button>

<Button size="sm" fullWidth={false}>Compacto</Button>
```

Props: `variant` (`primary` | `secondary` | `ghost` | `danger`), `size` (`sm` | `md` | `base` | `lg`), `loading`, `fullWidth`, `leftIcon`, `rightIcon`, `disabled`, `onPress`, `style`, `textStyle`.

### `<TextField>`

```tsx
<TextField
  label="CORREO ELECTRÓNICO"
  placeholder="nombre@ejemplo.com"
  leftIcon={<Icon name="mail" color={colors.textSubtle} />}
  value={email}
  onChangeText={setEmail}
  keyboardType="email-address"
  autoCapitalize="none"
/>

<TextField
  label="CONTRASEÑA"
  secureTextEntry
  leftIcon={<Icon name="lock" color={colors.textSubtle} />}
  rightIcon={<Icon name="eye" />}
  error="La contraseña es muy corta"
/>

<TextField label="DESHABILITADO" value="..." editable={false} />
```

Props: `label`, `helperText`, `error`, `leftIcon`, `rightIcon`, `containerStyle`, todas las de `<TextInput>`.

### `<Card>`

```tsx
<Card>...</Card>                              // flat (border, sin shadow)
<Card variant="elevated">...</Card>           // con shadow
<Card variant="outlined">...</Card>           // transparente con borde
<Card padding="lg">...</Card>                 // none | sm | md | lg
<Card onPress={() => ...}>...</Card>          // pressable (TouchableOpacity)
```

### `<Badge>`

```tsx
<Badge>PRINCIPAL</Badge>                              // primary solid
<Badge tone="success">VERIFICADO</Badge>
<Badge tone="warning" variant="soft">PENDIENTE</Badge>
```

Tones: `primary` | `success` | `warning` | `danger` | `info` | `neutral`. Variants: `solid` | `soft`.

### `<ScreenContainer>`

Encapsula `SafeArea + KeyboardAvoidingView + ScrollView + padding`. Reemplaza ese boilerplate en todas las pantallas.

```tsx
<ScreenContainer>
  <Heading>Mi pantalla</Heading>
  <Body>Contenido</Body>
</ScreenContainer>

// Sin scroll (pantallas full-screen tipo splash)
<ScreenContainer scrollable={false} avoidKeyboard={false}>
  ...
</ScreenContainer>

// Sin padding (cuando hay header full-bleed)
<ScreenContainer padded={false}>
  <Header />
  <View style={{ paddingHorizontal: 24 }}>...</View>
</ScreenContainer>
```

### `<EmptyState>`

```tsx
<EmptyState
  icon={<Icon name="inbox" size={48} color={colors.textSubtle} />}
  title="No hay subastas todavía"
  description="Vuelve más tarde para descubrir nuevas oportunidades."
  actionLabel="Recargar"
  onAction={refetch}
/>
```

### `<Loader>`

```tsx
<Loader />                                  // inline grande, primary
<Loader size="small" />
<Loader fullScreen label="Validando..." />  // overlay pantalla completa con label
```

### `<Icon>`

Sistema centralizado de iconos SVG. La lista completa de nombres está en `IconName` (auto-completable desde TypeScript).

```tsx
<Icon name="user" />                                  // 20px, color text
<Icon name="lock" size={24} />
<Icon name="trash" color={colors.danger} />
<Icon name="check" color={colors.success} strokeWidth={2.4} />
```

**Si necesitás un icono nuevo**: agregalo a `Icon.tsx` con un identificador en kebab-case y un SVG outline desde [Lucide](https://lucide.dev) o equivalente. Mantenelo en el mismo formato (`viewBox="0 0 24 24"`, `stroke={color}`, etc.) que los existentes.

## Convenciones

- **No hardcodear** valores en pantallas: siempre importar desde `theme`.
- **Componentes nuevos** van en esta carpeta (`src/ui/`) y se exportan desde `index.ts`.
- **No tocar las pantallas viejas** del compañero por ahora — el sistema visual es para pantallas nuevas y eventuales migraciones futuras.
- **Iconos** centralizados en `Icon.tsx` — no más SVG inline en pantallas.
- Si te falta una variante / un componente, primero **agregarlo acá** y después usarlo. No hacer estilos one-off.
