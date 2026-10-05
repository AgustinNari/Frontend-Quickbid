# QuickBid — App móvil

Aplicación de subastas desarrollada en equipo con React Native y TypeScript. Incluye registro y autenticación, consulta de subastas y catálogos, pujas en tiempo real, compras, medios de pago, consignaciones, perfil y notificaciones. Integra la API de [Backend-Quickbid](https://github.com/AgustinNari/Backend-Quickbid).

La aplicación detecta cambios de conectividad y permite guardar borradores de consignación en el dispositivo para enviarlos posteriormente. Las pujas y las operaciones que requieren confirmación del servidor necesitan conexión.

## Stack y requisitos

React Native 0.85.3, React 19.2.3, TypeScript, React Navigation, Context para autenticación/conectividad, AsyncStorage y STOMP sobre WebSocket. El proyecto está en `FrontendQuickbid/`.

- Node.js 22.11 o superior y npm.
- Android: JDK 17, Android Studio/SDK 36, NDK 27.1.12297006 y un emulador o dispositivo con depuración USB. Android mínimo: API 24.
- iOS: macOS, Xcode, Ruby/Bundler y CocoaPods.

## Instalación

```sh
cd FrontendQuickbid
npm ci
```

Para iOS, desde esa carpeta ejecutar además `bundle install` y `cd ios && bundle exec pod install`, y regresar a `FrontendQuickbid/`.

## Configuración del backend

La configuración se encuentra en `FrontendQuickbid/src/api/config.ts`. No hay un cargador de `.env` configurado para la app.

| `API_MODE` | Conexión |
| --- | --- |
| `public` | URL de demo definida por `PUBLIC_API_BASE_URL`; es el modo actual. |
| `localReverse` | `http://localhost:8080`, con `adb reverse` para Android. |
| `emulator` | `http://10.0.2.2:8080`, para el emulador Android. |

Para utilizar otro backend público, ajustar `PUBLIC_API_BASE_URL`. La URL WebSocket se deriva de la URL HTTP/HTTPS. Elegir el modo apropiado antes de iniciar la app; los scripts `android:local` y `android:public` configuran la conexión ADB, pero no cambian `API_MODE`.

El backend debe configurarse para enviar enlaces de autenticación a `quickbid://auth`. La app procesa enlaces de registro y recuperación de contraseña.

## Ejecución

Desde `FrontendQuickbid/`, iniciar Metro en una terminal:

```sh
npm start
```

En otra terminal, ejecutar `npm run android` o, en macOS, `npm run ios`. Para Android por USB con backend local, seleccionar `localReverse` y ejecutar `npm run android:local`; para el backend público, seleccionar `public` y ejecutar `npm run android:public`. Ambos scripts presuponen Metro ya iniciado y un dispositivo disponible por ADB.

## Validación

Desde `FrontendQuickbid/`:

```sh
npm test -- --runInBand
npm run lint
```

Los tests Jest cubren componentes, conectividad, mappers, medios de pago, documentos y borradores de consignación. El proyecto también incluye configuración TypeScript: con las dependencias instaladas, ejecutar `npx --no-install tsc --noEmit`. No hay un script independiente de typecheck.

## Alcance de demostración

La URL pública configurada corresponde a un backend de demo y su disponibilidad depende de ese servicio. Los pagos y los datos de demostración siguen el comportamiento del backend. Android conserva la firma de depuración incluso para el build `release`; no representa una configuración de distribución comercial. Los proyectos nativos, wrappers y configuración de build forman parte del repositorio.
