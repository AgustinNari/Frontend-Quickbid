# AGENTS.md — QuickBid Frontend

Este archivo define reglas de trabajo para modificaciones dentro del frontend mobile de QuickBid.

## Alcance

Este directorio contiene el frontend mobile:

`BE/FE-DAI/FrontendQuickbid/`

El backend está en:

`BE/-Backend-Desarrollo-de-Aplicaciones-I/`

Salvo indicación explícita, no modificar backend desde tareas frontend.

## Stack frontend

- React Native CLI.
- TypeScript.
- React Navigation.
- UI custom con `StyleSheet`.
- Android como plataforma principal.
- Axios solo si ya está instalado o si se justifica claramente.
- TanStack Query solo si realmente ayuda para server state.
- Zustand solo si realmente ayuda para estado global local.
- WebSocket/STOMP para realtime, usando WebSocket nativo con `@stomp/stompjs` si corresponde.

No usar Expo salvo que el proyecto sea migrado explícitamente, cosa que no está prevista.

## Reglas generales

- Cambiar/agregar solo lo necesario para el bloque pedido.
- No hacer refactors masivos sin justificación.
- No implementar toda la app en un solo bloque.
- Mantener el estilo visual general del diseño: blanco/azul, cards, chips, bottom navigation, botones principales azules, modales claros.
- No agregar pantallas admin ni flujos admin en la app mobile.
- No modificar `android/` o `ios/` salvo que sea imprescindible y se justifique.
- No bajar versiones de React/React Native salvo error concreto y justificado.
- No instalar dependencias sin justificar.
- No agregar `sockjs-client` salvo que el backend lo requiera explícitamente.
- No corregir lint global o tests fuera del alcance del bloque pedido, salvo que sea imprescindible para compilar.

## Backend como fuente de verdad

Los endpoints, payloads, DTOs, enums y reglas finales deben salir de:

- `BE/-Backend-Desarrollo-de-Aplicaciones-I/docs/API_CONTRATO_FINAL.md`
- `BE/-Backend-Desarrollo-de-Aplicaciones-I/docs/00_decisiones_finales.md`
- `BE/-Backend-Desarrollo-de-Aplicaciones-I/quickbid/README.md`
- `.http` finales en `BE/-Backend-Desarrollo-de-Aplicaciones-I/quickbid/docs/`
- código real del backend, si hace falta confirmar algo.

La carpeta `source_material` puede usarse solo como contexto secundario. Puede estar desactualizada.

## Referencias visuales

Las imágenes de Figma/pantallas están en:

`design-reference/`

Leer:

`design-reference/README_DESIGN_REFERENCE.md`

Las imágenes son guía visual/UX, no contrato técnico.

Los endpoints escritos en rojo sobre las imágenes pueden estar desactualizados. No derivar endpoints, payloads, DTOs ni reglas finales desde esas imágenes si contradicen backend, `.http` o documentación final.

## Estados de cuenta

El frontend debe respetar:

- `activa`
- `restriccion_multa`
- `bloqueada_permanente`

Reglas:

- `activa`: navegación normal.
- `restriccion_multa`: puede navegar, pero no puede realizar acciones económicas bloqueadas, como pujar o inscribirse.
- `bloqueada_permanente`: puede hacer login limitado, pero debe quedar en pantalla de bloqueo/estado y no navegar normalmente.
- Invitado: puede ver contenido público, pero no acceder a acciones protegidas.

## WebSocket

El backend usa STOMP sobre WebSocket nativo:

`ws://localhost:8080/ws`

El token va en el frame STOMP `CONNECT`:

`Authorization: Bearer <accessToken>`

Topics públicos:

- `/topic/subastas/{subastaId}/estado`
- `/topic/subastas/{subastaId}/items/{itemId}/pujas`

Colas privadas:

- `/user/queue/pujas`
- `/user/queue/notificaciones`

La puja se envía por HTTP, no por WebSocket.

Toda puja debe incluir `idempotencyKey`.

## Verificación esperada

Después de cada bloque, ejecutar cuando sea posible:

- `npx tsc --noEmit`
- `npm run lint`

`npm test` solo si el setup actual lo permite y no consume demasiado tiempo. Si falla por configuración preexistente, reportarlo sin arreglar fuera del alcance.

Si el backend está levantado, validar endpoints reales contra localhost:8080; si no, reportar pendiente.

Siempre reportar:

- archivos modificados;
- qué se implementó;
- comandos ejecutados;
- errores pendientes;
- si se instaló alguna dependencia;
- confirmación de que no se tocó backend ni admin mobile.