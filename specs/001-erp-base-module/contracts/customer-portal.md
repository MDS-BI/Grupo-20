# Contrato del Portal del Cliente

## Propósito

Definir el comportamiento observable del botón «Portal del Cliente» de la pantalla de inicio y de sus dos pestañas públicas (FR-114 a FR-117, US22d). El portal no inicia sesión, no muestra el marco ERP y no modifica la matriz de permisos. La fuente funcional es [`../spec.md`](../spec.md); el modelo resumido está en [`../data-model.md`](../data-model.md#11-rediseño-de-acceso-y-portal-del-cliente-2026-11-27).

## Ruta y presentación

- `src/components/login.js` muestra el enlace «Portal del Cliente» dentro de `.login-card`, por debajo de los botones de acceso, con estilo discreto y sin competir visualmente con ellos (FR-117, SC-045).
- El enlace abre `?view=client-portal`, registrada en `ROUTE_VIEWS`/`VIEW_ROUTES` como ruta pública. La resolución desde `location.search` funciona en carga, recarga y Back/Forward, igual que `?view=capture` (FR-114).
- `src/components/client-portal.js` renderiza la vista sin barra superior ni lateral, con exactamente dos pestañas: «Solicitar cotización» y «Soporte Postventa» (FR-114).
- `state.portalTab` acepta solo `quote` o `support`; los borradores no se persisten en `localStorage` y se descartan al recargar.
- La tarjeta de acceso usa la paleta base azul/gris oscuro y aplica `theme.accentColor` a botones y resaltados; un valor ausente o inválido vuelve al color integrado y muestra la advertencia de configuración (FR-038, FR-117).

## Pestaña «Solicitar cotización»

- Campos obligatorios, en este orden visible: «Nombre», «Empresa», «Correo», «Teléfono», «Servicio de interés» con monto estimado en USD y una casilla de consentimiento explícito (FR-115, FR-125).
- Con cualquier casilla vacía o sin consentimiento se muestra `Completa los campos obligatorios.` y no se crea ningún registro (FR-006, FR-115).
- Con datos válidos se llama a `createProspectFromCapture()` para crear una `Entidad` con `estado_comercial = 'prospecto'`, `consentimiento = true`, `consentimiento_fecha` y `consentimiento_version`, y se llama a `addDocument()` para crear un `Documento` vinculado con `servicio_interes` y `monto_estimado` en USD (FR-071, FR-115). Si se declara `moneda`, solo `USD` es válido: otro valor se rechaza con un error visible, sin crear ni modificar la cotización y sin conversión (FR-125).
- La confirmación visible es `Solicitud registrada correctamente.` y el prospecto con su cotización queda disponible en Marketing al volver al CRM (SC-044).
- El envío no concede sesión, no cambia `estado_comercial` a `ganado` y no registra la cotización como ticket.

## Pestaña «Soporte Postventa»

- Campos obligatorios, en este orden visible: «Correo del cliente», «Categoría» y «Descripción del problema» (FR-114).
- «Categoría» usa las opciones declaradas en `postventa.categoryOptions` y muestra sus etiquetas; el valor guardado es el `value` configurado.
- `findClientByEmailOrPhone()` de `src/utils/customer-portal.js` compara correo y teléfono en una sola pasada sobre los clientes almacenados, sin distinguir mayúsculas ni espacios, y devuelve `null` si no hay coincidencia (FR-116).
- Sin coincidencia se muestra `No encontramos un cliente con ese correo o teléfono.`, no se crea Ticket ni Entidad y no se modifica ningún registro existente (FR-116).
- Con coincidencia, `createPortalTicketDocument()` de `src/storage.js` crea un `Documento` con `ticket: true`, `entity_id` del cliente, `asunto` derivado de la categoría, `categoria`, `notes` con la descripción, `status = 'Abierto'` y `prioridad = 'media'` (FR-104, FR-114).
- La confirmación visible es `Ticket registrado correctamente.` El ticket aparece en la ficha del cliente, en la tabla de Postventa y en las tarjetas «Tickets abiertos» al volver al CRM, sin recarga (SC-044).

## Operaciones y permisos

- Las funciones puras del portal son `findClientByEmailOrPhone()` y `buildPortalTicketValues()`; la escritura pasa por `createPortalTicketDocument()` en `src/storage.js`.
- `createPortalTicketDocument()` valida campos y coincidencia en la capa de datos, pero no llama a `assertPermission()` porque el actor es `visitor`; es la ruta pública equivalente a `chat:create_query` (FR-094, FR-106).
- No se añaden acciones al catálogo canónico, no se conceden `postventa:view`, `postventa:view_own`, `postventa:create` ni `postventa:transition`, y el visitante sigue sin acceso a `?view=postventa` (FR-106).
- `createTicketDocument()` mantiene su comprobación de `postventa:create` para Nivel 1 y Nivel 4; la acción «Abrir Ticket» de la tabla de clientes sigue siendo interna y distinta del envío público (FR-112).
- No hay `createdByUserId` interno en el ticket público; solo se conservan las marcas de tiempo del documento como en otras rutas sin sesión.

## Actualización al volver al CRM

- Toda mutación se escribe en `erp_entities`/`erp_documents` a través de `storage.js`; el siguiente `render()` lee los arreglos ya cargados en memoria.
- No se usa `StorageEvent`, `postMessage`, sondeo ni recarga. No se persisten contadores derivados ni resultados de búsqueda (FR-032, SC-004).

## Mensajes y etiquetas exactas

- Etiquetas: «Portal del Cliente», «Solicitar cotización», «Soporte Postventa», «Nombre», «Empresa», «Correo», «Teléfono», «Servicio de interés», «Correo del cliente», «Categoría» y «Descripción del problema».
- Mensajes: `Completa los campos obligatorios.`, `No encontramos un cliente con ese correo o teléfono.`, `Solicitud registrada correctamente.` y `Ticket registrado correctamente.`
- No deben aparecer `Ingresa una contraseña`, `Usuario no encontrado` ni `Acceso denegado` en ninguna superficie del portal.

## Expectativas de verificación

- Sin sesión, el botón abre dos pestañas exactas y no muestra vistas internas ni campos de usuario/contraseña (SC-044, SC-045).
- «Solicitar cotización» rechaza envíos incompletos o sin consentimiento y crea prospecto más documento con servicio y monto en USD ante datos válidos; un valor de `moneda` distinto de `USD` se rechaza sin mutar registros (FR-125, SC-044).
- «Soporte Postventa» localiza clientes por correo y por teléfono, crea un ticket `Abierto`/`Media` y rechaza sin mutar cuando no hay coincidencia (SC-044).
- Al volver al CRM, Marketing y Postventa muestran los nuevos registros de inmediato, sin recarga ni pérdida de datos (SC-044).
- La tarjeta de inicio conserva botones centrados en dos columnas, paleta azul/gris oscuro, enlace discreto al portal y fallback del color de acento con advertencia (SC-045).
- Un visitante que intente abrir `?view=postventa` o llamar a `createTicketDocument()` recibe «Acceso denegado» o `No tienes permiso para realizar esta acción` (FR-106).

## Integración

- `src/components/login.js`: tarjeta de acceso, grilla de dos columnas y enlace al portal.
- `src/app.js`: registro de `?view=client-portal` y estado `state.portalTab`.
- `src/components/client-portal.js`: marcado y ciclo de las dos pestañas.
- `src/utils/customer-portal.js`: búsqueda de cliente y valores del ticket.
- `src/storage.js`: `createPortalTicketDocument()` y reutilización de `createProspectFromCapture()`/`addDocument()`.
- `src/styles.css`: tokens de la tarjeta y aplicación de `theme.accentColor`.
- `contracts/auth.md`, `contracts/postventa.md`, `contracts/marketing.md` y `contracts/entity-storage.md`: contratos compartidos de sesión, tickets, prospectos y almacenamiento.
