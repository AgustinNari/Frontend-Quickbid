# QuickBid - checklist de demo con Render y Android

Esta guia usa el backend publico
`https://quickbid-backend-demo.onrender.com` y la configuracion versionada en
`src/api/config.ts`. No copiar URLs privadas de PostgreSQL, API keys, JWT ni
tokens de autenticacion en el repositorio, capturas o tickets.

## 1. Reset seguro de PostgreSQL Render

Hacerlo solo sobre la base dedicada a demo. En Render, copiar temporalmente la
External Database URL desde el panel seguro y conectarse con `psql`:

```powershell
psql "<EXTERNAL_DATABASE_URL>"
```

Confirmar primero la base y el usuario conectados:

```sql
SELECT current_database(), current_user;
```

Si son los de la demo, recrear el schema y sus permisos:

```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public AUTHORIZATION quickbid_user;
GRANT ALL ON SCHEMA public TO quickbid_user;
```

Si el usuario real de Render no es `quickbid_user`, usar el valor de
`current_user`; no inventar ni cambiar propietarios de otra base.

## 2. Redeploy limpio del backend

1. En Render Dashboard abrir el Web Service de QuickBid.
2. Confirmar `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `APP_JWT_SECRET` y las
   variables de mail en el panel, sin mostrarlas en logs.
3. Elegir **Manual Deploy > Deploy latest commit**.
4. Esperar que Flyway aplique V1..V13 y que Hibernate valide el schema.
5. Confirmar que no aparecen errores de migracion ni secretos en los logs.

Smoke publico seguro:

```powershell
$baseUrl = 'https://quickbid-backend-demo.onrender.com'
Invoke-RestMethod "$baseUrl/actuator/health"
Invoke-RestMethod "$baseUrl/api/subastas?page=0&size=5"
```

Render debe usar `/actuator/health` como health check. El mail health permanece
desacoplado con `MANAGEMENT_HEALTH_MAIL_ENABLED=false`.

## 3. Mail simulado y Resend real

Modo seguro/simulado:

```text
APP_MAIL_ENABLED=false
APP_MAIL_NOTIFICATIONS_ENABLED=false
MANAGEMENT_HEALTH_MAIL_ENABLED=false
```

Resend real por HTTPS:

```text
APP_MAIL_ENABLED=true
APP_MAIL_PROVIDER=resend
APP_MAIL_NOTIFICATIONS_ENABLED=false
APP_MAIL_FROM=<sender verificado>
APP_FRONTEND_BASE_URL=quickbid://auth
APP_RESEND_API_KEY=<secreto en Render>
APP_RESEND_API_URL=https://api.resend.com/emails
APP_RESEND_TIMEOUT_SECONDS=10
MANAGEMENT_HEALTH_MAIL_ENABLED=false
```

Probar primero recuperacion o reenvio de registro con una casilla controlada.
Un HTTP 200 es deliberadamente generico: confirmar inbox/spam y revisar que los
logs no contengan destinatario, token, link completo ni API key. Mantener las
notificaciones de negocio desactivadas durante el primer smoke.

## 4. Metro y Android contra backend publico

Desde `FrontendQuickbid`:

```powershell
npm install
npm start
```

En otra terminal, con emulador o dispositivo USB:

```powershell
adb devices
adb reverse tcp:8081 tcp:8081
npm run android
```

No aplicar reverse de `8080`: HTTP y WebSocket salen directamente a Render.
En dispositivo fisico se necesita Internet y el reverse de `8081` solo durante
el desarrollo con Metro. Para un APK empaquetado no se necesita Metro.

## 5. Usuarios y escenarios de demo

Todas las cuentas seed usan `Demo123!`:

| Usuario | Estado | Validacion principal |
| --- | --- | --- |
| `aprobado@quickbid.demo` | activa | perfil, importes autenticados, inscripcion, live y compras |
| `consignador@quickbid.demo` | activa | consignaciones, acuerdos, devolucion y liquidacion |
| `multa@quickbid.demo` | restriccion_multa | navegacion permitida y acciones economicas bloqueadas |
| `bloqueado@quickbid.demo` | bloqueada_permanente | acceso limitado sin navegacion operativa |

Como invitado, validar listado, detalle, catalogo e item sin precios ni datos
live sensibles. No ejecutar pagos, pujas validas, aceptacion/rechazo de acuerdos
o cambios administrativos salvo sobre una base recien reseteada.

## 6. WebSocket/STOMP publico

La app deriva `wss://quickbid-backend-demo.onrender.com/ws`. Para aislar el
canal, abrir:

```text
https://quickbid-backend-demo.onrender.com/ws-test.html
```

Pegar un access token seed vigente, conectar y suscribirse a los topics
documentados. El JWT viaja solo en el frame STOMP `CONNECT`; las pujas siguen
siendo HTTP con `idempotencyKey`. Si Render estaba dormido, esperar el primer
wake-up y reintentar. Un mensaje de reconexion en la app no debe mostrar frames,
headers ni errores internos.

## 7. Documentos y storage efimero

Probar con el propietario del documento:

- listar compras o consignaciones y abrir el detalle;
- descargar un documento existente y confirmar nombre, tipo y bytes recibidos;
- intentar un ID ajeno/inexistente solo si el escenario controlado lo permite y
  confirmar 403/404, nunca datos de otra cuenta.

La app no guarda ni abre el archivo nativamente; informa la recepcion sin
crashear. En Render sin disco persistente, `APP_FILES_STORAGE_PATH` es efimero:
los archivos subidos pueden desaparecer al reiniciar o redesplegar. Los seeds
historicos no garantizan que exista un binario luego de cada deploy.

## 8. Orden final de smoke

1. Health y subastas publicas desde PowerShell.
2. Invitado: listado, detalle, catalogo e item sin datos sensibles.
3. Login activo: perfil, importes enriquecidos y logout/login.
4. Restriccion por multa y cuenta bloqueada.
5. Consignaciones y compras en modo lectura.
6. WebSocket/STOMP y reconexion controlada.
7. PDF generado autorizado: verificar nombre/tipo/tamaño; repetir tras redeploy
   para validar el respaldo PostgreSQL de V14.
8. Mail auth con Resend; notificaciones de negocio siguen desactivadas.
9. Solo si la base fue reseteada, una mutacion seleccionada e idempotente.

## 9. Evidencia y logs

Guardar fecha/hora, commit desplegado, escenario, status HTTP y resultado
visible. En logs buscar errores de Flyway, autenticacion, timeout de Resend,
WebSocket y storage, pero redactar siempre `Authorization`, tokens, URLs de
auth, API keys, passwords y URLs privadas de PostgreSQL.

Para modo público usar `npm run android:public`; no aplicar reverse `8080`.
Para backend local seleccionar `API_MODE='localReverse'` y usar
`npm run android:local`.

## 10. Consignación y presentación final

- [ ] El launcher muestra `QuickBid` y el ícono azul con martillo, sin cambiar package name ni `applicationId`.
- [ ] **Qué define el usuario en consignación:** descripción, segmento/rubro, fotos y documentación.
- [ ] **Qué define la empresa durante revisión:** categoría comercial de subasta y condiciones del acuerdo.
- [ ] La pantalla de alta no muestra ni envía `categoriaSubasta`, porque esa categoría no es una elección del usuario.
- [ ] Un cliente antiguo que envía categoría no logra imponerla: el backend aplica su default controlado.
- [ ] **Límite null no es límite ilimitado:** devolución por envío rechaza el medio sin límite y acepta un medio vigente con límite suficiente.

## 11. Smoke mobile Android

- [ ] Modo avión muestra `Sin conexión` y la recuperación muestra `Reconectando…`.
- [ ] Con Wi-Fi apagado aparece `Usando datos móviles` y se puede continuar o cancelar una acción pesada.
- [ ] DNI, cheque, fotos del bien y documentación ofrecen cámara/galería/cancelar.
- [ ] Denegar cámara no crashea; bloquearla ofrece abrir Configuración.
- [ ] Galería funciona sin permisos amplios de almacenamiento.
- [ ] Un PDF real V14 abre el chooser Android desde compra y consignación.
- [ ] El PDF informa nombre, tamaño y MIME; el JWT sólo viaja en `Authorization`.
- [ ] Sin aplicación compatible o sin red aparece un error de usuario, no un error nativo.
