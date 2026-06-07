# QuickBid Mobile Frontend

Guia final para levantar, probar, presentar y entregar el frontend mobile de
QuickBid.

Este documento cubre exclusivamente la aplicacion React Native para usuarios
finales. No reemplaza la documentacion del backend y no existe un frontend
administrativo dentro de esta app.

## 1. Descripcion general

QuickBid Mobile permite navegar subastas publicas como invitado y operar como
usuario autenticado segun el estado de la cuenta.

Modulos implementados:

- autenticacion, refresh, logout, registro y recuperacion;
- perfil, menu, estadisticas, historial y notificaciones;
- medios de pago y direcciones de envio;
- subastas, catalogos, items, inscripcion y puja en vivo;
- compras, entrega, pagos, multas y documentos;
- consignaciones, documentacion, acuerdos, devoluciones y liquidaciones;
- seguridad y cambio de clave desde una sesion activa.

La navegacion respeta estos estados:

- `activa`: navegacion y operaciones normales;
- `restriccion_multa`: puede navegar, pero no inscribirse ni pujar;
- `bloqueada_permanente`: login limitado y pantalla informativa de bloqueo;
- invitado: contenido publico y acceso limitado a acciones protegidas.

## 2. Stack

- React Native CLI.
- TypeScript.
- React Navigation.
- `@stomp/stompjs` sobre WebSocket nativo.
- AsyncStorage para persistencia de sesion.
- `react-native-image-picker` para seleccionar imagenes admitidas.
- UI custom construida con `StyleSheet`.

## 3. Requisitos

- Node.js `>= 22.11.0` y npm.
- Java JDK y herramientas requeridas por React Native Android.
- Android Studio con un emulador, o un dispositivo Android.
- ADB disponible en `PATH`.
- Backend QuickBid escuchando en `localhost:8080`.
- PostgreSQL y configuracion del backend segun su propio `README.md`.

La guia oficial de entorno de React Native esta en:
<https://reactnative.dev/docs/set-up-your-environment>.

## 4. Instalacion del frontend

Desde `BE/FE-DAI/FrontendQuickbid`:

```powershell
npm install
```

No ejecutar `npm audit fix` sin revisar antes sus cambios de versiones,
compatibilidad con React Native y efectos sobre archivos nativos.

## 5. Levantar el backend

El backend se encuentra en:

```text
BE/-Backend-Desarrollo-de-Aplicaciones-I/quickbid
```

En PowerShell, configurar PostgreSQL y el perfil de desarrollo segun el README
del backend. Luego:

```powershell
cd BE/-Backend-Desarrollo-de-Aplicaciones-I/quickbid
$env:SPRING_PROFILES_ACTIVE='dev'
.\mvnw.cmd spring-boot:run
```

Verificar que este saludable:

```http
GET http://localhost:8080/actuator/health
```

La respuesta debe indicar `status: UP`.

## 6. Levantar Metro

Desde `BE/FE-DAI/FrontendQuickbid`:

```powershell
npm start
```

Ante problemas de cache:

```powershell
npm start -- --reset-cache
```

Mantener Metro activo mientras se usa la aplicacion en desarrollo.

## 7. Android y emulador

Confirmar que Android esta conectado:

```powershell
adb devices
```

Aplicar reverse para Metro y backend:

```powershell
adb reverse tcp:8081 tcp:8081
adb reverse tcp:8080 tcp:8080
```

En otra terminal:

```powershell
npm run android
```

El script `npm run android:device` aplica automaticamente el reverse de Metro,
pero no el del backend. Para una demo local conviene ejecutar ambos comandos
`adb reverse` de forma explicita.

Si no se usa `adb reverse` en el emulador Android, el host de la maquina suele
ser `10.0.2.2`. Los valores alternativos estan centralizados en
`src/api/config.ts`; cualquier cambio de host debe mantener HTTP y WebSocket
alineados.

El error `Unable to load script` se evita manteniendo Metro activo y aplicando
`adb reverse tcp:8081 tcp:8081` antes de abrir o recargar la app.

## 8. Configuracion HTTP y WebSocket

La configuracion central vive en `src/api/config.ts`.

- HTTP por defecto: `http://localhost:8080`.
- WebSocket por defecto: `ws://localhost:8080/ws`.
- Alternativa habitual de emulador sin reverse: `http://10.0.2.2:8080`.
- STOMP envia `Authorization: Bearer <accessToken>` en el frame `CONNECT`.
- Las pujas se envian por HTTP.
- STOMP se usa solo para actualizaciones realtime.
- Cada puja HTTP debe incluir `idempotencyKey`.
- No usar SockJS.

Los canales realtime documentados incluyen:

```text
/topic/subastas/{subastaId}/estado
/topic/subastas/{subastaId}/items/{itemCatalogoId}/pujas
/user/queue/notificaciones
/user/queue/pujas
```

## 9. Comandos de verificacion

Desde el frontend:

```powershell
npx tsc --noEmit
npm run lint
git diff --check
npm test
```

`npm test` puede fallar por la configuracion ESM de React Navigation. Si
ocurre, registrar el resultado sin corregir Jest como parte de una entrega
documental o de una tarea no relacionada.

## 10. Usuarios seed utiles para demo

| Usuario | Estado | Uso sugerido |
| --- | --- | --- |
| `aprobado@quickbid.demo` | `activa` | Login normal, medios, inscripciones y pujas |
| `multa@quickbid.demo` | `restriccion_multa` | Navegacion restringida, compras y multa |
| `bloqueado@quickbid.demo` | `bloqueada_permanente` | Login limitado y pantalla de bloqueo |
| `consignador@quickbid.demo` | `activa` | Flujos de consignacion |

Consultar contrasenas, IDs y datos exactos en la documentacion y pruebas HTTP
del backend, especialmente:

```text
quickbid/README.md
quickbid/docs/00_smoke_readonly.http
quickbid/docs/01_auth_registro_medios.http
quickbid/docs/02_pujas_compras_flujo_exitoso.http
quickbid/docs/04_consignacion_flujo_nuevo_feliz.http
quickbid/docs/05_consignacion_seeds_ramas_independientes.http
```

No cambiar claves ni consumir transiciones importantes de seeds durante una
presentacion salvo que el caso este controlado.

## 11. Flujos principales de demo

### Invitado

- abrir listado publico de subastas;
- entrar al detalle publico y catalogo;
- abrir el detalle de un item;
- comprobar acceso limitado al intentar una accion protegida.

### Auth y estado de cuenta

- iniciar sesion con un usuario activo;
- navegar con una cuenta restringida por multa;
- verificar que la cuenta restringida no pueda inscribirse ni pujar;
- abrir compras y multa de la cuenta restringida;
- iniciar sesion con una cuenta bloqueada permanente;
- comprobar la pantalla de estado y la navegacion limitada;
- revisar perfil, menu, estadisticas, historial y notificaciones.

### Medios de pago

- listar medios y sus estados reales;
- crear tarjeta, cuenta bancaria o cheque certificado;
- marcar un medio compatible como principal;
- eliminar o dar de baja un medio permitido.

Los medios nuevos pueden quedar pendientes de verificacion. No asumir que un
medio recien creado esta habilitado para pujar.

### Direcciones de envio

- listar direcciones;
- crear una direccion;
- marcarla como principal;
- eliminar o dar de baja una direccion permitida.

### Subastas e inscripcion

- recorrer listado, detalle, catalogo y detalle de item;
- abrir la verificacion de inscripcion;
- seleccionar un medio compatible;
- completar o revisar el resultado de la inscripcion.

### Live y puja

- abrir el snapshot de puja actual;
- comprobar actualizaciones STOMP realtime;
- probar una puja invalida controlada;
- confirmar que una puja se envia por HTTP con `idempotencyKey`;
- evitar pujas validas destructivas sobre seeds durante una demo general.

La pantalla de puja ganada ofrece acceso a Compras y permite volver a la
subasta o al live. No redirige automaticamente.

### Compras

- listar compras y abrir un detalle;
- revisar entrega y pago;
- recorrer un caso de pago con multa;
- consultar documentos mostrados como metadata.

### Consignacion

- revisar requisitos;
- crear una solicitud y listar consignaciones;
- abrir el detalle;
- revisar documentacion de origen;
- revisar, aceptar o rechazar un acuerdo solo en un caso controlado;
- recorrer devolucion y pago de envio de devolucion;
- revisar liquidacion y comprobantes como metadata.

### Seguridad

- cambiar clave desde una sesion activa;
- revisar setup de clave por token;
- revisar recuperacion de clave segun el flujo existente.

## 12. Registro y autenticacion

El login guarda:

- `accessToken`;
- `refreshToken`;
- `estadoCuenta`;
- `usuario`.

La sesion se persiste con AsyncStorage. El cliente intenta refresh automatico
ante un `401` protegido y actualiza los tokens rotados. Si el refresh falla,
limpia la sesion local. El logout intenta revocar remotamente el refresh token
y siempre limpia la sesion local.

El cambio de clave autenticado usa:

```http
PUT /api/auth/cambiar-clave
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "claveActual": "...",
  "claveNueva": "...",
  "claveConfirmacion": "..."
}
```

Registro:

- etapa 1 usa Argentina fija con `idPaisOrigen=32`, porque no existe una lista
  publica de paises documentada;
- telefono no se envia porque la etapa 1 del backend no lo acepta;
- DNI acepta JPG/JPEG, PNG y WebP;
- DNI no acepta PDF;
- la etapa final envia `setup_token`.

Los flujos de setup por token, recuperacion y cambio desde sesion activa son
independientes.

## 13. Observaciones conocidas

- Jest puede fallar por configuracion ESM de React Navigation.
- El lint puede mostrar warnings no bloqueantes preexistentes en mocks.
- React Native puede mostrar un warning de deprecacion de `SafeAreaView`.
- Los documentos de compras y consignaciones se muestran como metadata cuando
  el backend no expone descarga binaria.
- No ejecutar pagos reales, pujas validas, acuerdos o transiciones destructivas
  sobre seeds salvo en un caso controlado.
- En Android usar `adb reverse` o ajustar el host centralizado.
- No usar endpoints visibles en referencias de Figma como contrato tecnico.
- Las rutas dev `Home`, `Details` y `UIShowcase` fueron removidas del stack
  productivo final.
- Sin `adb reverse`, el emulador puede requerir `10.0.2.2`.
- No ejecutar `npm audit fix` sin revisar.

## 14. Checklist final antes de entregar

- [ ] Backend arriba.
- [ ] Health del backend en `UP`.
- [ ] Metro arriba.
- [ ] Android arriba y visible en `adb devices`.
- [ ] Reverse de puertos `8081` y `8080` aplicado.
- [ ] TypeScript OK.
- [ ] Lint sin errores.
- [ ] `git diff --check` OK.
- [ ] Smoke test invitado.
- [ ] Smoke test usuario activo.
- [ ] Smoke test cuenta restringida.
- [ ] Smoke test cuenta bloqueada.
- [ ] Smoke test subastas.
- [ ] Smoke test inscripcion.
- [ ] Smoke test live sin puja valida destructiva.
- [ ] Smoke test compras.
- [ ] Smoke test consignacion.
- [ ] Logout remoto y limpieza local OK.

## 15. Troubleshooting

### `Unable to load script`

Confirmar que Metro esta activo y aplicar:

```powershell
adb reverse tcp:8081 tcp:8081
```

Luego recargar la app.

### Backend no accesible desde Android

Confirmar health desde la computadora y aplicar:

```powershell
adb reverse tcp:8080 tcp:8080
```

En emulador sin reverse, usar el host `10.0.2.2` mediante la configuracion
centralizada de HTTP y WS.

### Metro conserva una version vieja

Detener Metro y ejecutar:

```powershell
npm start -- --reset-cache
```

### `401` por sesion expirada

El frontend intenta renovar automaticamente el access token. Si el refresh
token tambien expiro o fue revocado, volver a iniciar sesion.

### STOMP no conecta

Verificar:

- backend disponible en el mismo host configurado para HTTP;
- URL final `ws://<host>:8080/ws`;
- access token vigente;
- `Authorization: Bearer <accessToken>` en `connectHeaders`;
- ausencia de SockJS;
- estado de cuenta habilitado para navegar.

### Documentos sin descarga binaria

El backend puede exponer solo metadata autorizada. La app muestra nombre,
tipo, fecha u otros datos disponibles, sin inventar una descarga.

### Jest falla por ESM

Registrar el fallo y confirmar si proviene de React Navigation o dependencias
ESM. No cambiar configuracion de Jest dentro de una tarea no relacionada.

## Fuentes de verdad

Para contratos y comportamiento backend, consultar:

```text
BE/-Backend-Desarrollo-de-Aplicaciones-I/docs/API_CONTRATO_FINAL.md
BE/-Backend-Desarrollo-de-Aplicaciones-I/docs/06_realtime_websocket.md
BE/-Backend-Desarrollo-de-Aplicaciones-I/quickbid/README.md
BE/-Backend-Desarrollo-de-Aplicaciones-I/quickbid/docs/*.http
```

Las referencias visuales orientan la UI, pero no definen endpoints ni
contratos.
