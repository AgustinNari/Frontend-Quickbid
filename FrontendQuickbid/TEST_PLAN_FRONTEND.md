# QuickBid - Plan de pruebas manuales controladas

Este documento define una guia manual para validar QuickBid frontend + backend
sin modificar codigo funcional ni contratos. El foco principal es smoke testing
controlado sobre Android, con backend Spring Boot local y frontend React Native
CLI.

Fuentes revisadas para este plan:

- `README_FRONTEND.md`
- `AGENTS.md`
- `App.tsx`
- `package.json`
- `../-Backend-Desarrollo-de-Aplicaciones-I/quickbid/README.md`
- `../-Backend-Desarrollo-de-Aplicaciones-I/quickbid/docs/*.http`
- `../-Backend-Desarrollo-de-Aplicaciones-I/docs/API_CONTRATO_FINAL.md`
- `../-Backend-Desarrollo-de-Aplicaciones-I/docs/00_decisiones_finales.md`
- `../-Backend-Desarrollo-de-Aplicaciones-I/docs/06_realtime_websocket.md`

## 1. Preparacion general

### 1.1 Backend

Desde PowerShell:

```powershell
cd C:\dev\BE\-Backend-Desarrollo-de-Aplicaciones-I\quickbid
$env:SPRING_PROFILES_ACTIVE='dev'
.\mvnw.cmd spring-boot:run
```

Validar health:

```powershell
curl.exe http://localhost:8080/actuator/health
```

Resultado esperado:

```json
{ "status": "UP" }
```

El backend usa PostgreSQL y Flyway. Sobre una base vacia, Flyway aplica las
migraciones y carga los seeds demo. Hibernate valida el esquema; no debe crear
ni modificar tablas por fuera de Flyway.

### 1.2 Frontend y Metro

Desde PowerShell:

```powershell
cd C:\dev\BE\FE-DAI\FrontendQuickbid
npm start
```

Ante cache viejo de Metro:

```powershell
npm start -- --reset-cache
```

No instalar dependencias y no ejecutar `npm audit fix` dentro de este bloque.

### 1.3 Android

Confirmar dispositivo o emulador:

```powershell
adb devices
```

Aplicar reverse para Metro y backend:

```powershell
adb reverse tcp:8081 tcp:8081
adb reverse tcp:8080 tcp:8080
```

Levantar app:

```powershell
cd C:\dev\BE\FE-DAI\FrontendQuickbid
npm run android
```

Si Android no llega al backend, confirmar `adb reverse tcp:8080 tcp:8080`. En
emulador sin reverse, usar el host `10.0.2.2` en la configuracion centralizada
de HTTP y WebSocket, manteniendo ambos alineados.

### 1.4 Verificaciones de repositorio

Estas verificaciones son recomendadas, pero para este bloque documental no hace
falta ejecutarlas todas:

```powershell
cd C:\dev\BE\FE-DAI\FrontendQuickbid
npx tsc --noEmit
npm run lint
git diff --check
```

`npm test` puede fallar por configuracion ESM de React Navigation. Si ocurre,
registrar el resultado sin corregir Jest en una tarea documental.

### 1.5 Reset de base de datos

Resetear o recrear la base solo cuando se vayan a ejecutar pruebas mutantes
controladas, por ejemplo pujas validas, inscripciones nuevas, pagos,
aceptaciones de acuerdo o cargas de consignacion.

No resetear la base si:

- se esta haciendo smoke test no destructivo;
- se quiere conservar el estado de una demo;
- se estan revisando solo pantallas, guards o consultas;
- hay seeds importantes ya consumidos parcialmente y se necesita preservar ese
  estado.

Advertencia: no ejecutar mutaciones destructivas sobre seeds si no se esta en
una base reseteada o en un escenario explicitamente preparado para consumir
datos demo. Para restaurar todos los escenarios, recrear la base y dejar que
Flyway aplique las migraciones. Los endpoints `seed/*` y `reset/demo` del
backend estan documentados como auxiliares dev/test y no reemplazan a Flyway
como fuente del seed.

## 2. Usuarios seed recomendados

La documentacion del backend indica que todas las cuentas operativas demo usan:

```text
Demo123!
```

| Usuario | Estado | Uso sugerido |
| --- | --- | --- |
| `aprobado@quickbid.demo` | `activa` | Login normal, perfil, medios, inscripciones, pujas, compras |
| `multa@quickbid.demo` | `restriccion_multa` | Navegacion restringida, compras con multa, bloqueo de pujas/inscripcion |
| `bloqueado@quickbid.demo` | `bloqueada_permanente` | Login limitado y pantalla informativa de bloqueo |
| `consignador@quickbid.demo` | `activa` | Bandeja de consignaciones y flujos de consignacion |

Consultar IDs, payloads y escenarios exactos en:

- `quickbid/README.md`
- `quickbid/docs/00_smoke_readonly.http`
- `quickbid/docs/01_auth_registro_medios.http`
- `quickbid/docs/02_pujas_compras_flujo_exitoso.http`
- `quickbid/docs/03_multas_alternativas.http`
- `quickbid/docs/04_consignacion_flujo_nuevo_feliz.http`
- `quickbid/docs/05_consignacion_seeds_ramas_independientes.http`
- `quickbid/docs/06_ws_realtime_pujas_privadas.http`

## 3. Smoke test no destructivo

Objetivo: validar navegacion, guards, consultas y pantallas principales sin
consumir seeds ni disparar transiciones reales.

| ID | Flujo | Usuario | Precondicion | Pasos | Resultado esperado | Muta datos | Reset recomendado | Referencia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SMK-01 | Invitado - listado | Invitado | Backend y app arriba | Entrar sin login, abrir subastas | Se ve listado publico | No | No | `00_smoke_readonly.http` |
| SMK-02 | Invitado - detalle publico | Invitado | Subastas seed disponibles | Abrir detalle de subasta publica | Se ven datos descriptivos | No | No | `00_smoke_readonly.http` |
| SMK-03 | Invitado - catalogo | Invitado | Subasta con catalogo | Abrir catalogo e item | Se ven descripciones e imagenes | No | No | `00_smoke_readonly.http` |
| SMK-04 | Invitado - precios ocultos | Invitado | Comparar contra usuario logueado si hace falta | Revisar detalle/catalogo publico | No se muestran precio base, mejor oferta, historial, cantidad de pujas ni item vivo | No | No | `API_CONTRATO_FINAL.md` |
| SMK-05 | Invitado - acceso limitado | Invitado | Sesion invitado | Intentar perfil, compras, consignacion, inscripcion o live protegido | La app muestra acceso limitado o pide login | No | No | `App.tsx` |
| SMK-06 | Activo - login | `aprobado@quickbid.demo` | Usuario seed disponible | Login con clave demo | Entra a navegacion principal | No | No | `00_smoke_readonly.http` |
| SMK-07 | Activo - perfil | `aprobado@quickbid.demo` | Login activo | Abrir perfil | Datos de usuario visibles | No | No | `README_FRONTEND.md` |
| SMK-08 | Activo - estadisticas | `aprobado@quickbid.demo` | Login activo | Abrir estadisticas | Se muestran metricas por periodo o estado disponible | No | No | `00_smoke_readonly.http` |
| SMK-09 | Activo - historial | `aprobado@quickbid.demo` | Login activo | Abrir historial | Se listan pujas/compras historicas | No | No | `00_smoke_readonly.http` |
| SMK-10 | Activo - notificaciones | `aprobado@quickbid.demo` | Login activo | Abrir notificaciones sin marcar si se quiere evitar mutar | Se listan notificaciones | No, si no se marcan como leidas | No | `00_smoke_readonly.http` |
| SMK-11 | Activo - medios de pago | `aprobado@quickbid.demo` | Login activo | Abrir medios de pago | Se listan medios y estados reales | No | No | `01_auth_registro_medios.http` |
| SMK-12 | Activo - direcciones | `aprobado@quickbid.demo` | Login activo | Abrir direcciones | Se listan direcciones disponibles | No | No | `01_auth_registro_medios.http` |
| SMK-13 | Activo - subastas | `aprobado@quickbid.demo` | Login activo | Abrir subastas, detalle, catalogo e item | Se ven datos autenticados, incluidos importes permitidos | No | No | `00_smoke_readonly.http` |
| SMK-14 | Activo - inscripcion existente/verificacion | `aprobado@quickbid.demo` | Login activo | Abrir inscripcion o verificacion sin crear nueva si ya existe | La app muestra estado de inscripcion/verificacion | No, si no se confirma una nueva inscripcion | No | `00_smoke_readonly.http` |
| SMK-15 | Activo - live snapshot | `aprobado@quickbid.demo` | Subasta en vivo seed | Abrir live o snapshot de puja actual | Se ve estado live y posibilidad de pujar segun reglas | No | No | `00_smoke_readonly.http` |
| SMK-16 | Activo - compras | `aprobado@quickbid.demo` | Login activo | Abrir Mis Compras y detalle | Se listan compras y documentos metadata si existen | No | No | `README.md` |
| SMK-17 | Activo - consignacion | `consignador@quickbid.demo` | Login activo | Abrir consignaciones y detalle seed | Se listan estados y detalle de consignacion | No | No | `05_consignacion_seeds_ramas_independientes.http` |
| SMK-18 | Activo - logout | Cualquier activo | Login activo | Cerrar sesion | Se limpia sesion local y vuelve a auth/publico | No relevante | No | `README_FRONTEND.md` |
| SMK-19 | Restriccion multa - login | `multa@quickbid.demo` | Usuario seed disponible | Login | Entra a navegacion permitida con restricciones | No | No | `00_smoke_readonly.http` |
| SMK-20 | Restriccion multa - compras/multa | `multa@quickbid.demo` | Login multa | Abrir compras y detalle de multa | Multa activa visible | No | No | `03_multas_alternativas.http` |
| SMK-21 | Restriccion multa - bloqueo economico | `multa@quickbid.demo` | Login multa | Intentar inscripcion o puja sin confirmar mutaciones validas | La app/backend bloquea la accion economica | No si el intento es rechazado | No | `02_pujas_compras_flujo_exitoso.http` |
| SMK-22 | Bloqueada - login limitado | `bloqueado@quickbid.demo` | Usuario seed disponible | Login | Se muestra pantalla informativa de bloqueo | No | No | `01_auth_registro_medios.http` |
| SMK-23 | Bloqueada - navegacion principal | `bloqueado@quickbid.demo` | Login bloqueado | Intentar navegar a secciones principales | No accede a navegacion real | No | No | `App.tsx` |
| SMK-24 | Bloqueada - logout | `bloqueado@quickbid.demo` | Login bloqueado | Cerrar sesion | Sesion limpiada | No relevante | No | `README_FRONTEND.md` |

## 4. Pruebas controladas no destructivas

Estas pruebas pueden hacerse desde la app o desde `.http`/REST client siempre
que el resultado esperado sea rechazo o lectura. No deben dejar cambios
persistentes relevantes.

| ID | Prueba | Usuario | Precondicion | Pasos | Resultado esperado | Muta datos | Reset recomendado | Referencia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ND-01 | Endpoint protegido sin token | Sin token | Backend arriba | `GET /api/usuario/perfil` sin `Authorization` | `401 UNAUTHORIZED` con envelope de error | No | No | `00_smoke_readonly.http` |
| ND-02 | Token bloqueado en endpoint protegido | `bloqueado@quickbid.demo` | Login limitado y token valido | Usar token en endpoint protegido de usuario/subasta | `403 ACCOUNT_BLOCKED` o bloqueo equivalente | No | No | `01_auth_registro_medios.http` |
| ND-03 | Cuenta con multa intenta verificar | `multa@quickbid.demo` | Login multa | Intentar verificacion/inscripcion protegida | Se informa que puede mirar pero no operar economicamente | No, si se rechaza | No | `00_smoke_readonly.http` |
| ND-04 | Cuenta con multa intenta pujar | `multa@quickbid.demo` | Login multa, subasta en vivo | Enviar intento de puja con monto de prueba o desde app | Rechazo por restriccion de multa; no se acepta oferta | No, si se rechaza | No | `02_pujas_compras_flujo_exitoso.http` |
| ND-05 | Puja invalida monto 0 | `aprobado@quickbid.demo` | Login activo, snapshot consultado | Intentar puja con monto 0 solo en caso manual controlado | Error de validacion; no crea oferta | No, si se rechaza | No | `02_pujas_compras_flujo_exitoso.http` |
| ND-06 | Cambio de clave con clave actual incorrecta | `aprobado@quickbid.demo` | Login activo | Intentar cambio con `claveActual` incorrecta y clave nueva ficticia | Error; la clave real no cambia | No | No | `01_auth_registro_medios.http` |
| ND-07 | Catalogo de paises - busqueda Argentina | Invitado/registro | Backend arriba | Abrir registro, desplegar paises, buscar `arg` | Aparece Argentina desde backend, no hardcodeada | No | No | `01_auth_registro_medios.http` |
| ND-08 | Catalogo de paises - otros paises | Invitado/registro | Backend arriba | Buscar Brasil, Chile o Uruguay si existen en seed | Dropdown filtra y permite seleccionar resultados reales | No | No | `README.md` |
| ND-09 | Registro sin backend para pais | Invitado/registro | Backend detenido o inaccesible | Abrir registro e intentar avanzar sin pais cargado | No permite seleccionar pais valido ni continuar etapa 1 | No | No | `README_FRONTEND.md` |
| ND-10 | DNI PDF rechazado | Invitado/registro | Usar flujo controlado sin completar registro real | Intentar seleccionar/subir PDF como DNI si se valida manualmente | Rechazo; DNI solo imagen | No, si se corta antes o backend rechaza | No | `API_CONTRATO_FINAL.md` |

Para pruebas por `.http`, usar variables y tokens temporales. No reutilizar una
prueba de cambio de clave que altere `Demo123!`.

## 5. Pruebas destructivas opcionales solo con BD reseteada

Esta seccion es opcional y MUTANTE. Ejecutarla solo despues de recrear/resetear
la base para que los seeds queden en estado conocido. Conviene reiniciar el
backend despues de recrear la base para confirmar Flyway y caches limpios.

Despues de estas pruebas, resetear otra vez si se necesita volver a una demo o
smoke test no destructivo.

| ID | Prueba MUTANTE | Usuario | Precondicion | Pasos | Resultado esperado | Reiniciar backend | Reset luego | Referencia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MUT-01 | Inscripcion nueva | `aprobado@quickbid.demo` | BD reseteada, subasta programada/abierta compatible | Inscribirse con medio seed compatible | Inscripcion creada o pendiente de revision segun medio | Opcional | Recomendado | `02_pujas_compras_flujo_exitoso.http` |
| MUT-02 | Puja valida | `aprobado@quickbid.demo` | BD reseteada, subasta `6001` en vivo, snapshot fresco | Enviar puja con `idempotencyKey` unico | Puja aceptada, version aumenta, reserva/estado actualizados | Opcional | Si | `02_pujas_compras_flujo_exitoso.http` |
| MUT-03 | Superacion de puja con dos usuarios | `aprobado@quickbid.demo` y `consignador@quickbid.demo` | BD reseteada, ambos tokens, dos clientes habilitados | Usuario A puja, usuario B supera | A recibe `PUJA_SUPERADA`, B recibe aceptacion | Opcional | Si | `06_ws_realtime_pujas_privadas.http` |
| MUT-04 | Cierre de lote | Admin auxiliar seguro | BD reseteada, admin dev habilitado si corresponde | Cerrar lote con endpoint admin/procesador seguro | Se crea compra o compra interna segun ofertas | No, salvo cambio de env admin | Si | `98_admin_jobs_smoke.http`, `README.md` |
| MUT-05 | Pago de extras | `aprobado@quickbid.demo` | Compra seed segura con extras pendientes | Ejecutar pago de extras | Compra avanza y puede generar documento metadata | Opcional | Si | `02_pujas_compras_flujo_exitoso.http` |
| MUT-06 | Pago de multa | `multa@quickbid.demo` | Multa seed `14001` activa | Pagar articulo + multa o flujo documentado | Multa queda pagada y cuenta puede regularizarse si no quedan multas | Opcional | Si | `03_multas_alternativas.http` |
| MUT-07 | Aceptar acuerdo de consignacion | `consignador@quickbid.demo` | Consignacion `acuerdo_pendiente` | Aceptar acuerdo con ambos checks true | Acuerdo aceptado; luego no corresponde rechazo | Opcional | Si | `05_consignacion_seeds_ramas_independientes.http` |
| MUT-08 | Rechazar acuerdo de consignacion | `consignador@quickbid.demo` | Consignacion `acuerdo_pendiente` en BD fresca alternativa | Rechazar acuerdo | Pasa a devolucion pendiente o estado documentado | Opcional | Si | `05_consignacion_seeds_ramas_independientes.http` |
| MUT-09 | Seleccionar devolucion | `consignador@quickbid.demo` | Consignacion en devolucion pendiente | Elegir modalidad/datos de devolucion | Devolucion registrada | Opcional | Si | `05_consignacion_seeds_ramas_independientes.http` |
| MUT-10 | Pagar envio de devolucion | `consignador@quickbid.demo` | Devolucion con envio pendiente | Pagar envio de devolucion | Pago registrado y comprobante metadata si aplica | Opcional | Si | `05_consignacion_seeds_ramas_independientes.http` |
| MUT-11 | Crear consignacion con imagenes validas | `consignador@quickbid.demo` | BD reseteada, 6 a 15 imagenes validas | Crear solicitud con fotos JPG/PNG/WebP validas | Solicitud creada en revision | Opcional | Si | `04_consignacion_flujo_nuevo_feliz.http` |
| MUT-12 | Cargar documentacion de origen | `consignador@quickbid.demo` | Consignacion que requiere documentacion | Subir PDF/documento permitido por el flujo | Documentacion queda registrada como metadata y vuelve a revision | Opcional | Si | `04_consignacion_flujo_nuevo_feliz.http` |

No ejecutar pujas validas, pagos, aceptaciones/rechazos ni cargas reales sobre
seeds compartidos salvo que el objetivo sea justamente consumirlos en una base
reseteada.

## 6. WebSocket/STOMP

Endpoint:

```text
ws://localhost:8080/ws
```

CONNECT STOMP:

```text
Authorization: Bearer <accessToken>
```

Topics publicos autenticados para live:

```text
/topic/subastas/{subastaId}/estado
/topic/subastas/{subastaId}/items/{itemId}/pujas
```

Colas privadas:

```text
/user/queue/pujas
/user/queue/notificaciones
```

Reglas de validacion:

- Las pujas se envian por HTTP, no por WebSocket.
- Cada puja HTTP debe incluir `idempotencyKey`.
- El snapshot inicial de puja actual se obtiene por HTTP con
  `GET /api/subastas/{id}/puja-actual`.
- Las pujas se envian por HTTP con `POST /api/subastas/{id}/pujar`.
- STOMP/WebSocket se usa para eventos realtime y colas privadas.
- Invitados no deben recibir montos live.
- Una cuenta `restriccion_multa` puede mirar live, pero no pujar.
- Una cuenta `bloqueada_permanente` no debe navegar ni suscribirse a live real.
- Cada `SUBSCRIBE` revalida destino, cuenta, subasta e item.

Pruebas recomendadas:

| ID | Prueba | Usuario | Pasos | Resultado esperado | Muta datos | Referencia |
| --- | --- | --- | --- | --- | --- | --- |
| WS-01 | Conexion desde app | `aprobado@quickbid.demo` | Abrir live con backend arriba | STOMP conecta usando `Authorization` en `CONNECT` | No | `README_FRONTEND.md` |
| WS-02 | Validacion con `ws-test.html` | `aprobado@quickbid.demo` | Abrir `http://localhost:8080/ws-test.html`, conectar con token | Suscripcion exitosa a topics permitidos | No | `06_ws_realtime_pujas_privadas.http` |
| WS-03 | Topics publicos | `aprobado@quickbid.demo` | Suscribirse a estado y pujas de subasta/item seed | Recibe eventos cuando hay cambios | No, salvo que se dispare evento con mutacion | `06_ws_realtime_pujas_privadas.http` |
| WS-04 | Colas privadas | `aprobado@quickbid.demo` | Suscribirse a `/user/queue/pujas` y `/user/queue/notificaciones` | Recibe eventos privados propios, no ajenos | No, salvo evento mutante | `06_ws_realtime_pujas_privadas.http` |
| WS-05 | Dos usuarios - `PUJA_SUPERADA` | `aprobado` y `consignador` | Con BD reseteada, hacer pujas validas consecutivas | Usuario superado recibe `PUJA_SUPERADA` privada | Si | `06_ws_realtime_pujas_privadas.http` |

No ejecutar pujas validas sobre seeds salvo BD reseteada. Para pruebas
puramente no destructivas, limitarse a conectar, suscribirse y observar estado.

## 7. Registro y paises

El registro debe consumir el catalogo real:

```text
GET /api/catalogos/paises?q=&buscar=&page=&size=
GET /api/catalogos/paises/{id}
```

Checklist especifico:

| ID | Prueba | Precondicion | Pasos | Resultado esperado | Muta datos |
| --- | --- | --- | --- | --- | --- |
| REG-01 | Abrir registro | Backend arriba | Entrar a Register desde Login | Se carga pantalla de registro | No |
| REG-02 | Dropdown de paises | Backend arriba | Desplegar selector | Lista buscable, colapsable y scrolleable | No |
| REG-03 | Buscar Argentina | Backend arriba | Buscar `arg` | Argentina aparece desde backend; en seed puede tener `id=32` | No |
| REG-04 | No hardcode Argentina | Backend arriba | Borrar busqueda, buscar otros paises | El valor no vuelve por fallback silencioso a Argentina | No |
| REG-05 | Backend caido | Backend abajo | Abrir registro o recargar paises | Muestra error/reintento y no permite continuar con pais invalido | No |
| REG-06 | Telefono | Backend arriba | Revisar payload de etapa 1 o app | Telefono no se envia porque backend etapa 1 no lo acepta | No |
| REG-07 | DNI imagen | Backend arriba | Seleccionar JPG/JPEG/PNG/WebP si el selector lo permite | Formatos de imagen aceptados | Puede mutar si se envia etapa 2 |
| REG-08 | DNI PDF | Backend arriba | Intentar PDF | PDF rechazado para DNI | No si se corta antes o backend rechaza |

No enviar registro completo salvo caso controlado y con datos nuevos
descartables. El flujo completo crea solicitud y consume estados de registro.

## 8. Compras y documentos

Checklist:

| ID | Prueba | Usuario | Pasos | Resultado esperado | Muta datos | Referencia |
| --- | --- | --- | --- | --- | --- | --- |
| COM-01 | Listar compras | `aprobado@quickbid.demo` o `multa@quickbid.demo` | Abrir Mis Compras | Lista paginada o estado vacio controlado | No | `README.md` |
| COM-02 | Detalle de compra | Usuario con compra seed | Abrir compra | Se ve estado, importes y acciones segun estado | No | `02_pujas_compras_flujo_exitoso.http` |
| COM-03 | Documentos metadata | Usuario con compra/documentos | Abrir documentos | Se muestran nombre, tipo, fecha u otros metadatos | No | `README.md` |
| COM-04 | Sin descarga binaria | Usuario con documentos | Intentar abrir/ver documento si app lo ofrece | No esperar descarga binaria si backend solo expone metadata | No | `00_decisiones_finales.md` |
| COM-05 | Pagos reales | Usuario con compra seed | No confirmar pago salvo caso seguro | Pago no ejecutado en smoke; solo se valida UI/guard | No si no se confirma | `03_multas_alternativas.http` |

No ejecutar pagos reales salvo caso seguro en BD reseteada.

## 9. Consignacion

Checklist:

| ID | Prueba | Usuario | Pasos | Resultado esperado | Muta datos | Referencia |
| --- | --- | --- | --- | --- | --- | --- |
| CON-01 | Requisitos | `consignador@quickbid.demo` | Abrir alta/requisitos | Se informan requisitos reales | No | `04_consignacion_flujo_nuevo_feliz.http` |
| CON-02 | Listado | `consignador@quickbid.demo` | Abrir consignaciones | Se listan estados seed | No | `05_consignacion_seeds_ramas_independientes.http` |
| CON-03 | Detalle | `consignador@quickbid.demo` | Abrir consignacion seed | Se ve detalle segun estado | No | `05_consignacion_seeds_ramas_independientes.http` |
| CON-04 | Documentacion de origen | `consignador@quickbid.demo` | Abrir seccion de documentacion | Se ve estado/metadata disponible | No, si no se sube archivo | `04_consignacion_flujo_nuevo_feliz.http` |
| CON-05 | Acuerdo | `consignador@quickbid.demo` | Abrir consignacion con acuerdo pendiente | Se ve aceptar/rechazar segun estado | No, si no se confirma | `05_consignacion_seeds_ramas_independientes.http` |
| CON-06 | Devolucion | `consignador@quickbid.demo` | Abrir consignacion en devolucion | Se ve seleccion/pago si corresponde | No, si no se confirma | `05_consignacion_seeds_ramas_independientes.http` |
| CON-07 | Liquidacion | `consignador@quickbid.demo` | Abrir consignacion liquidada | Se ve liquidacion y comprobantes metadata | No | `05_consignacion_seeds_ramas_independientes.http` |
| CON-08 | Alta con imagenes | `consignador@quickbid.demo` | Completar alta sin confirmar en smoke | La UI exige 6 a 15 fotos y datos requeridos | No si no se confirma | `API_CONTRATO_FINAL.md` |

Acciones reales como crear consignacion, aceptar/rechazar acuerdo, elegir
devolucion, pagar envio o cargar documentacion deben ejecutarse solo con BD
reseteada o seed seguro preparado para consumirse.

## 10. Checklist de entrega

- [ ] Backend arriba.
- [ ] Health `UP`.
- [ ] Metro arriba.
- [ ] Android arriba.
- [ ] `adb reverse tcp:8081 tcp:8081` aplicado.
- [ ] `adb reverse tcp:8080 tcp:8080` aplicado.
- [ ] TypeScript OK, si se ejecuto.
- [ ] Lint OK, si se ejecuto.
- [ ] `git diff --check` OK.
- [ ] Invitado OK.
- [ ] Activo OK.
- [ ] Restringido por multa OK.
- [ ] Bloqueado permanente OK.
- [ ] Subastas OK.
- [ ] Inscripcion OK.
- [ ] Live OK.
- [ ] Compras OK.
- [ ] Consignacion OK.
- [ ] Logout OK.

## 11. Observaciones conocidas

- Jest puede fallar por configuracion ESM de React Navigation.
- Pueden aparecer warnings no bloqueantes en mocks.
- Puede aparecer warning de deprecacion de `SafeAreaView` si sigue existiendo en
  dependencias o codigo.
- Los documentos de compras y consignaciones pueden ser metadata, no descarga
  binaria.
- No usar endpoints de Figma como contrato tecnico.
- No ejecutar `npm audit fix` sin revisar cambios de versiones,
  compatibilidad React Native y posibles modificaciones nativas.
- Si Android no llega al backend, usar `adb reverse tcp:8080 tcp:8080` o
  configurar `10.0.2.2`.
- Los endpoints admin no tienen frontend formal; son auxiliares para
  dev/test/demo y deben permanecer protegidos segun configuracion backend.
- La validacion final de pujas, pagos y transiciones ocurre en backend; el
  frontend solo debe guiar y bloquear cuando corresponde.

## 12. Matriz breve de riesgo

| Area | Riesgo | Control manual |
| --- | --- | --- |
| Seeds demo | Consumir pujas/pagos/acuerdos por accidente | Separar smoke no destructivo de MUTANTE y resetear BD |
| Registro | Crear solicitudes descartables | Probar catalogo de paises sin enviar etapa completa |
| Cambio de clave | Romper `Demo123!` | Usar clave actual incorrecta para prueba no destructiva |
| WebSocket | Confundir transporte con operacion | Recordar que puja va por HTTP y STOMP solo notifica |
| Documentos | Esperar descarga inexistente | Validar metadata si backend no expone binario |
| Android local | Backend inaccesible desde emulador | Aplicar reverse o usar `10.0.2.2` |
