# QuickBid — Design Reference

Esta carpeta contiene capturas de referencia visual del diseño original de QuickBid.

## Uso correcto

Estas imágenes son una guía de UX/UI, jerarquía visual, flujos, estados y estilo general.

Deben usarse para mantener una sintonía visual similar:
- fondo claro;
- azul principal;
- cards;
- bottom navigation;
- chips/filtros;
- botones primarios azules;
- modales para acciones críticas;
- pantallas de error/estado claras;
- estilo mobile-first.

## Importante

Las imágenes NO son contrato técnico.

Los endpoints escritos en rojo sobre algunas capturas pueden estar desactualizados.

La fuente de verdad técnica es:
- `BE/-Backend-Desarrollo-de-Aplicaciones-I/docs/API_CONTRATO_FINAL.md`
- `BE/-Backend-Desarrollo-de-Aplicaciones-I/docs/00_decisiones_finales.md`
- `BE/-Backend-Desarrollo-de-Aplicaciones-I/quickbid/README.md`
- `.http` finales en `BE/-Backend-Desarrollo-de-Aplicaciones-I/quickbid/docs/`
- código real del backend.

Si una imagen contradice el backend final, gana el backend.

No implementar pantallas ni flujos admin en la app mobile, aunque existan endpoints admin para pruebas internas.

## Imágenes

### 01_auth_onboarding_recovery.png
Pantallas de splash, login, registro por etapas, DNI, validación, setup de contraseña, recuperación, reenvío de link y acceso como invitado/limitado.

Usar en prompts de:
- auth;
- registro;
- recuperación;
- cuenta limitada/invitado;
- pulido visual de login.

### 02_payment_methods_flow.png
Pantallas de métodos de pago, selección de tipo, tarjeta, cuenta bancaria, cheque certificado y validación del medio.

Usar en prompts de:
- medios de pago;
- selección de medio para inscripción;
- selección de medio para pagos.

### 03_profile_menu_notifications_stats.png
Pantallas de menú/perfil, estadísticas, historial, ayuda/soporte y notificaciones.

Usar en prompts de:
- perfil;
- menú;
- estadísticas;
- historial;
- notificaciones;
- ayuda.

### 04_purchases_payments_documents.png
Pantallas de compras, detalle, entrega, resumen de pago, compra exitosa, factura/documentos, recibo de multa y pago de multa.

Usar en prompts de:
- compras;
- multas;
- pagos de extras;
- documentos metadata.

### 05_consignment_full_overview_original.png
Vista amplia del flujo original de consignación, con creación, requisitos, documentación, listas, detalle, acuerdo, devolución y liquidación.

Usar como referencia general para consignación.

### 06_auctions_catalog_live_overview_original.png
Vista amplia del flujo original de subastas, catálogo, detalle de ítem, sala live, modal de puja y éxito de puja.

Usar como referencia general para subastas/live.

### 07_special_states_errors_restrictions.png
Pantallas especiales de cuenta restringida, cuenta bloqueada, sin conexión, uso de datos móviles, puja superada, puja rechazada, límite excedido y pago fallido.

Usar en prompts de:
- guards;
- estados de error;
- live/pujas;
- pagos;
- offline.

### 08_guest_access_auction_consignment_pending_states.png
Pantallas de acceso limitado para invitados, subasta bloqueada por falta de medio validado/acorde, validación física pendiente y documentación adicional pendiente.

Usar en prompts de:
- modo invitado;
- subastas bloqueadas;
- consignación pendiente;
- estados especiales.

### 09_consignment_create_and_lists.png
Pantallas de crear consignación, requisitos, datos del bien, detalle del objeto, documentación de origen, solicitud enviada y listas de consignaciones activas/rechazadas/vendidas.

Usar en prompts de creación/listado de consignación.

### 10_consignment_detail_statuses_and_asset_card.png
Pantallas de detalle de consignación en distintos estados, rechazo físico/acuerdo rechazado, detalle activo/completo y ficha de bien consignado.

Usar en prompts de detalle/seguimiento de consignación.

### 11_consignment_agreement_return_liquidation.png
Pantallas de acuerdo pendiente, aceptar/rechazar acuerdo, acuerdo aceptado, liquidación, gestión de devolución, pago de envío de devolución y comprobante.

Usar en prompts de acuerdo/devolución/liquidación de consignación.

### 12_auctions_listing_detail_catalog_item_overview.png
Pantallas de listado de subastas, detalle, inscripción visual, confirmación de inscripción, catálogo y detalle de ítem.

Usar en prompts de subastas de solo lectura, catálogo e ítem.

### 13_live_bidding_flow_and_success.png
Pantallas de sala de subasta, modal de oferta, enviando puja y éxito de puja ganada.

Usar en prompts de live/pujas.

### 14_auction_registration_and_access_states.png
Pantallas de listado/detalle de subasta, selección de medio para inscripción, confirmación de inscripción y estado de colección disponible/bloqueada.

Usar en prompts de inscripción.

### 15_auctions_listing_expanded_reference.png
Referencia visual extendida del listado de subastas, cards, chips/filtros y scroll.

Usar en prompts de listado de subastas.

### 16_catalog_and_item_detail_reference.png
Referencia visual de catálogo y detalle de ítem.

Usar en prompts de catálogo/detalle de ítem.