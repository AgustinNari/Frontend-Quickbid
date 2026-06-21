# QuickBid Mobile Frontend

Guia unica para cerrar, desplegar y presentar la demo completa:
[DEMO_FINAL_QUICKBID.md](../../-Backend-Desarrollo-de-Aplicaciones-I/quickbid/docs/DEMO_FINAL_QUICKBID.md).

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
- Backend QuickBid publico disponible o backend local escuchando en
  `localhost:8080`.
- Para backend local, PostgreSQL y configuracion segun su propio `README.md`.

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
adb reverse --list
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

### Como conectar Android con backend local

**Escenario A - Emulador o dispositivo con `adb reverse` (recomendado para pruebas locales)**

- HTTP: `http://localhost:8080`
- WebSocket: `ws://localhost:8080/ws`
- Es la configuracion activa por defecto.

```powershell
adb devices
adb reverse tcp:8081 tcp:8081
adb reverse tcp:8080 tcp:8080
adb reverse --list
```

**Escenario B - Emulador Android Studio sin `adb reverse`**

- HTTP: `http://10.0.2.2:8080`
- WebSocket: `ws://10.0.2.2:8080/ws`
- Seleccionar `API_MODE = 'emulator'` en `src/api/config.ts`. WebSocket se
  deriva de la URL HTTP.

**Escenario C - Celular fisico por Wi-Fi**

- HTTP: `http://IP_DE_LA_PC:8080`
- WebSocket: `ws://IP_DE_LA_PC:8080/ws`
- El celular y la PC deben estar en la misma red.
- El firewall de Windows debe permitir conexiones entrantes al puerto `8080`.
- Antes de abrir la app, probar desde el navegador del celular:
  `http://IP_DE_LA_PC:8080/actuator/health`.

El backend debe estar escuchando en `8080`. Despues de cambiar la API base URL,
reiniciar o recargar la app; si Metro conserva una version anterior, usar
`npm start -- --reset-cache`.

**Escenario D - Backend publico (demo/entrega)**

- La configuracion versionada usa
  `https://quickbid-backend-demo.onrender.com`, sin barra final.
- `API_MODE = 'public'` es el modo activo para la demo.
- La app usa HTTPS y deriva automaticamente `wss://.../ws`.
- No hace falta `adb reverse` para el puerto del backend.

## 8. Configuracion HTTP y WebSocket

La configuracion central vive en `src/api/config.ts`.

- `API_MODE = 'localReverse'`: alternativa local con `adb reverse`.
- `API_MODE = 'emulator'`: emulador Android Studio sin reverse del backend.
- `API_MODE = 'public'`: modo activo; usa `PUBLIC_API_BASE_URL` con el deploy de
  Render.
- `API_BASE_URL` es la unica base consumida por el cliente HTTP.
- `WS_BASE_URL` se deriva de ella: HTTP usa `ws://` y HTTPS usa `wss://`.
- STOMP envia `Authorization: Bearer <accessToken>` en el frame `CONNECT`.
- Las pujas se envian por HTTP.
- STOMP se usa solo para actualizaciones realtime.
- El snapshot inicial live se obtiene por HTTP con
  `GET /api/subastas/{id}/puja-actual`.
- Las pujas se envian por HTTP con `POST /api/subastas/{id}/pujar`.
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
- consultar documentos y ejecutar una descarga autorizada controlada.

### Consignacion

- revisar requisitos;
- crear una solicitud y listar consignaciones;
- abrir el detalle;
- revisar documentacion de origen;
- revisar, aceptar o rechazar un acuerdo solo en un caso controlado;
- recorrer devolucion y pago de envio de devolucion;
- revisar liquidacion y disponibilidad real de sus comprobantes.

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

- etapa 1 carga un selector desplegable, buscable y scrolleable desde el catalogo publico
  `GET /api/catalogos/paises?q=&page=&size=` y envia el `id` del pais
  seleccionado como `idPaisOrigen`;
- ya no usa Argentina fija ni aplica un pais de fallback silencioso; si el
  backend no esta disponible, muestra el error, permite reintentar e impide
  continuar hasta seleccionar un pais valido;
- telefono no se envia porque la etapa 1 del backend no lo acepta;
- DNI acepta JPG/JPEG, PNG y WebP;
- DNI no acepta PDF;
- la etapa final envia `setup_token`.

Los flujos de setup por token, recuperacion y cambio desde sesion activa son
independientes.

### Deep links Android para auth

La app soporta estos deep links:

```text
quickbid://auth/completar-registro?token=...
quickbid://auth/recuperar-clave?token=...
```

Para probarlos en Android local:

```powershell
adb reverse tcp:8080 tcp:8080
adb reverse tcp:8081 tcp:8081
adb shell am start -W -a android.intent.action.VIEW -d "quickbid://auth/completar-registro?token=abc"
adb shell am start -W -a android.intent.action.VIEW -d "quickbid://auth/recuperar-clave?token=abc"
```

Con un token falso como `abc`, la app abre la pantalla correspondiente y el
backend debe responder con error controlado cuando se intenta completar la
operacion.

## 13. Observaciones conocidas

- Jest puede fallar por configuracion ESM de React Navigation.
- El lint puede mostrar warnings no bloqueantes preexistentes en mocks.
- React Native puede mostrar un warning de deprecacion de `SafeAreaView`.
- El backend entrega bytes en descargas autorizadas. La app confirma recepcion,
  nombre, tipo y tamano; todavia no guarda ni abre el archivo nativamente.
- No ejecutar pagos reales, pujas validas, acuerdos o transiciones destructivas
  sobre seeds salvo en un caso controlado.
- En Android usar `adb reverse` o ajustar el host centralizado.
- No usar endpoints visibles en referencias de Figma como contrato tecnico.
- Las rutas dev `Home`, `Details` y `UIShowcase` fueron removidas del stack
  productivo final.
- Sin `adb reverse`, el emulador puede requerir `10.0.2.2`.
- No ejecutar `npm audit fix` sin revisar.
- Los archivos de `src/mocks` quedan como fixtures visuales, datos demo
  aislados y compatibilidad historica de tipos. Ninguna pantalla, API o mapper
  del flujo productivo los importa actualmente; no bloquean la integracion real
  y pueden retirarse en una limpieza separada.

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
- URL final local `ws://<host>:8080/ws` o publica
  `wss://quickbid-backend-demo.onrender.com/ws`;
- access token vigente;
- `Authorization: Bearer <accessToken>` en `connectHeaders`;
- ausencia de SockJS;
- estado de cuenta habilitado para navegar.

### Descarga de documentos

El backend entrega bytes unicamente con autorizacion. La app informa nombre,
tipo y tamano recibidos sin crashear; guardar o abrir el archivo con una app
nativa queda fuera del alcance actual.

### Jest falla por ESM

Registrar el fallo y confirmar si proviene de React Navigation o dependencias
ESM. No cambiar configuracion de Jest dentro de una tarea no relacionada.

## Fuentes de verdad

## Hallazgos live contra backend real

- En Android/Hermes, el WebSocket abria y `@stomp/stompjs` enviaba `CONNECT`,
  pero Spring no procesaba el frame de texto terminado en NULL. Configurar
  `forceBinaryWSFrames: true` conserva el terminador y permite recibir
  `CONNECTED`, registrar las suscripciones y negociar heartbeat.
- `GET /api/subastas/{id}/puja-actual` expone `itemActivoId`,
  `mejorOfertaActual`, `versionEstado`, `puedePujar` y `motivo`, pero no expone
  timestamp de puja, `retencionHasta`, `reservaHasta`, segundos restantes ni la
  identidad de la cuenta que mantiene la mejor oferta.
- Los eventos actuales `MEJOR_OFERTA_ACTUALIZADA`, `ESTADO_ACTUALIZADO`,
  `PUJA_ACEPTADA`, `PUJA_SUPERADA`, `LOTE_CERRADO` y `LOTE_GANADO` tampoco
  incluyen una fecha limite de retencion.
- Por esa falta de datos, el frontend no muestra un countdown de 60 segundos ni
  bloquea back/detalle/catalogo suponiendo una puja ganadora propia. Hacerlo
  seria inventar estado que el backend no confirma.
- El avance fino de lotes requiere eventos como `LOTE_ACTIVADO`,
  `PROXIMO_LOTE_PROGRAMADO` y `SUBASTA_FINALIZADA`, documentados como parciales.
  Mientras no esten disponibles, la sala conserva snapshot/refresco HTTP.

## Countdown y devoluciones con dirección guardada

- El snapshot live consume `serverNow`, `retencionHasta`, `segundosRestantes` y
  `miPujaGanadora`. El countdown se basa en hora servidor y al llegar a cero
  refresca HTTP; nunca adjudica desde frontend.
- Mientras `miPujaGanadora` y la retención estén activos, PujaEnVivo bloquea
  back, detalle y catálogo con un mensaje explicativo.
- Eventos `LOTE_ACTIVADO` refrescan el lote activo y `SUBASTA_FINALIZADA`
  deshabilita nuevas pujas.
- La devolución por envío carga `/api/usuario/direcciones-envio`, permite elegir
  una dirección guardada y envía `direccionEnvioId` a
  `POST /api/consignaciones/{id}/devolucion`.

## Hallazgos de medios de pago y entrega

- `GET /api/usuario/medios-pago` expone `id`, `tipo`, `moneda`, `estado`,
  `principal`, `aliasVisible`, `ultimos4`, `banco`, `saldoGarantia`,
  `verificadoHasta` y `createdAt`.
- Ese contrato no expone limite aprobado, consumo actual, reservas activas ni
  limite disponible. El frontend no puede mostrar ni validar un remanente antes
  de pagar sin inventar datos; conserva el rechazo controlado que informa el
  backend al procesar la operacion.
- La entrega de una compra reutiliza direcciones guardadas mediante
  `direccionEnvioId` en `PUT /api/compras/{id}/entrega`.
- La devolucion de una consignacion recibe direccion, codigo postal, localidad,
  provincia y telefono como texto en `POST /api/consignaciones/{id}/devolucion`.
  Ese contrato no acepta `direccionEnvioId`, por lo que no puede reutilizar de
  forma real la libreta de direcciones sin un cambio backend.
- El backend no expone una cotizacion de envio previa a configurar la entrega.
  El costo final se obtiene despues de confirmar la modalidad y refrescar el
  detalle de la compra.

Para contratos y comportamiento backend, consultar:

```text
BE/-Backend-Desarrollo-de-Aplicaciones-I/docs/API_CONTRATO_FINAL.md
BE/-Backend-Desarrollo-de-Aplicaciones-I/docs/06_realtime_websocket.md
BE/-Backend-Desarrollo-de-Aplicaciones-I/quickbid/README.md
BE/-Backend-Desarrollo-de-Aplicaciones-I/quickbid/docs/*.http
```

Las referencias visuales orientan la UI, pero no definen endpoints ni
contratos.
## Documentos descargables

CompraDetail y ConsignacionDetail muestran acciones de verificacion únicamente
cuando el backend informa `downloadAvailable=true`. La descarga usa JWT en el
header contra el `downloadUrl` relativo; nunca agrega tokens a la URL ni muestra
rutas internas de storage.

La app actual no incluye una dependencia nativa para persistir o abrir archivos.
Por eso el CTA dice `Verificar documento`: valida la respuesta autenticada y
muestra nombre, tamaño y tipo sin afirmar que guardó una copia. Un archivo no
disponible se explica con un mensaje de usuario y nunca muestra rutas internas.

## Scripts Android local y Render

- `npm run reverse:metro`: reverse solo de Metro (`8081`).
- `npm run reverse:local-backend`: reverse solo del backend local (`8080`).
- `npm run android:public`: Render público y reverse únicamente de Metro.
- `npm run android:local`: backend local y Metro; requiere `API_MODE='localReverse'`.

El cliente corta solicitudes a los 20 segundos y muestra que QuickBid puede estar
iniciando, evitando loaders indefinidos durante un cold start de Render.

## Reglas finales de consignación y marca Android

- **Qué define el usuario en consignación:** título, descripción, segmento o rubro, fotos y documentación correspondiente.
- **Qué define la empresa durante revisión:** la categoría comercial de subasta (`comun`, `especial`, `plata`, `oro` o `platino`) y las condiciones posteriores del acuerdo.
- **Por qué el usuario no elige categoría de subasta:** es una clasificación comercial de la empresa; el alta móvil no la muestra ni la envía y el backend ignora el parámetro antiguo si un cliente desactualizado lo manda.
- **Límite null no es límite ilimitado:** un medio que requiere límite o saldo y no tiene `limite_monto` informado no puede pagar el envío de una devolución.

Android muestra `QuickBid` en el launcher y usa un ícono vectorial liviano inspirado en el martillo del logo del proyecto. `AndroidManifest.xml` conserva la etiqueta `@string/app_name`; no se cambiaron package name, `applicationId` ni el nombre interno del componente React Native. Para verificarlo, desinstalar una build anterior si el launcher mantiene caché, ejecutar `npm run android:public` y comprobar nombre e ícono en el launcher. El recurso se puede ajustar sin generadores externos en `android/app/src/main/res/drawable/ic_launcher_quickbid.xml`.
