# Plan de Implementación: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

**Rama**: `001-erp-base-module` | **Creado**: 2026-07-08 | **Actualizado**: 2026-11-27 | **Especificación**: [spec.md](spec.md)
**Entrada**: Especificación de la funcionalidad desde `/specs/001-erp-base-module/spec.md`

**Incremento anterior (2026-11-23, séptima tanda)**: completar Marketing con los datos del panel principal (cinco tarjetas y embudo por estados de documento), acceso desde la barra lateral, equipo de ventas con objetivo y real calculados, registro manual de redes sociales, «Dudas y consultas» con respuestas rápidas, campañas internas programadas y seguimiento del rendimiento derivado de los registros existentes.

**Incremento anterior (2026-11-24, octava tanda, Marketing)**: retirar de Marketing los atajos de acción rápida del panel principal y sustituirlos por cinco atajos de sección en orden definido; usar «Equipos de ventas y logros» como etiqueta visible y renombrar «Chat» a «Dudas y consultas» en Marketing y en el formulario público.

**Incremento anterior (2026-11-24, octava tanda, autenticación y permisos)**: añadir autenticación local, sesión persistente con expiración, matriz única de permisos por rango y administración de usuarios restringida al Gerente comercial; el hash de contraseñas y el bloqueo temporal de esa tanda quedaron eliminados por la clarificación de acceso por botones de 2026-11-27. La estructura incluye `src/auth.js`, `src/auth/permissions.js`, `src/components/login.js` y `src/components/users-admin.js`.

**Incremento anterior (2026-11-26, Postventa)**: añadir «Postventa» como quinta opción de la barra lateral, con botón «Nuevo Ticket», tres tarjetas de resumen y una tabla de gestión de casos. Los tickets son `Documento` vinculados a clientes existentes con campos declarados en la configuración, y su creación y cambio de estado se validan con acciones canónicas nuevas en la matriz de permisos.

**Incremento anterior (2026-11-26, ajustes iniciales de Postventa)**: al activar «Nuevo Ticket», abrir el formulario en una pestaña nueva del navegador mientras la vista de Postventa permanece intacta; al guardar en esa pestaña, actualizar automáticamente la tabla y las tres tarjetas de la pestaña original sin recarga manual; y dar a las tres tarjetas el mismo tamaño y proporción que los indicadores del apartado «Resumen», con un cambio únicamente visual.

**Incremento anterior (2026-11-26, Postventa en línea y panel simplificado)**: al activar «Nuevo Ticket», abrir un panel dentro de la misma página de Postventa que sustituye temporalmente la tabla de tickets, con las tres tarjetas visibles arriba y el mismo aspecto visual que el formulario «Nuevo Cliente»; guardar cierra el panel y vuelve a la tabla actualizada, y cancelar con cambios sin guardar pide confirmación. El panel principal queda con exactamente tres acciones rápidas —«Gestionar clientes», «Gestionar interacciones» y «Buscar registros»—; «Nuevo Cliente» y «Nueva interacción» se eliminan de él y su creación pasa a las respectivas pantallas de gestión.

**Incremento anterior (2026-11-27, identidad visual y bloqueo de borrado)**: alinear `plan.md` y `data-model.md` con los cambios recientes de `spec.md`: iconos SVG monocromáticos uniformes en los cinco botones de la barra lateral (US14b), fondo `#F8FAFC` con tarjetas `#FFFFFF` y jerarquía visual de los tres botones del panel (US15a), con el color de acento aplicado también a la barra superior, la opción activa, la acción principal y los acentos de KPI (FR-038); y ajustar la baja definitiva de entidades para que solo proceda sin registros vinculados, con bloqueo `EntityHasRecordsError` y oferta de archivado cuando los haya (FR-003, FR-009, FR-103). La arquitectura, los módulos y las claves de almacenamiento existentes no cambian.

**Incremento actual (2026-11-27, acceso, consulta rápida, tickets y cierre perdido)**: sustituir el login por botones de usuario activo; abrir una ficha rápida de solo lectura desde el nombre del cliente en «Buscar» y en la tabla «Clientes»; mostrar «Abrir Ticket» y alertas de ticket abierto/en revisión en esa tabla; y exigir un motivo rápido al pasar un documento de un prospecto a «Cerrado perdido». Se reutilizan `Entidad`, `Documento`, `erp_users`, `erp_session`, la matriz de permisos y las agregaciones existentes, sin nuevas dependencias, backend ni claves de `localStorage`.

## Resumen

Construir una aplicación web Vite sin framework de interfaz que sirva como módulo base de software de planificación de recursos empresariales (ERP). El módulo proporciona la base común que todo módulo ERP personalizado necesita: gestión de datos maestros (Entidades), documentos transaccionales vinculados (Documentos), flujos de crear/editar/eliminar/buscar, validación y persistencia local — construida con HTML, CSS y JavaScript vanilla. La aplicación se presenta como un espacio de trabajo ERP con barra superior (logotipo derivado + nombre del módulo) y barra lateral persistentes en cada pantalla, y la pantalla de entrada es un panel que ofrece exactamente tres acciones rápidas conforme a FR-033 («Gestionar clientes», «Gestionar interacciones» y «Buscar registros»), además de estadísticas derivadas de los registros almacenados en cada render; la creación de clientes e interacciones ocurre dentro de las respectivas pantallas de gestión (FR-034). La adaptación a un módulo específico (p. ej., Ventas) se realiza mediante un único archivo de configuración (`src/module-config.js`) que cubre terminología, campos personalizados, ciclo de vida de documentos y color de acento, de modo que el código central permanece intacto. En el perfil de clientes, la fecha objetivo pasa a denominarse "Fecha de nacimiento" y se limita al rango comprendido entre el 1 de enero de 1910 y la fecha local actual, con actualización automática del límite al cambiar de día y conservación de los valores históricos que queden fuera de rango. En una segunda tanda de cambios del mismo perfil, el formulario de clientes deja de mostrar «Código», «Categoría», «Descripción» y «Nº de pedidos» (generando y guardando un código interno único sin exposición), exige «Fecha de nacimiento», «Canal de Contacto» y «RUT» con formato chileno válido y único, y despliega una casilla de contacto condicionada al canal elegido con validación propia; la ficha de los clientes heredados incompletos queda bloqueada hasta completarla mediante edición.

Marketing conserva las tarjetas y el embudo del panel, pero no sus botones de acción rápida: en esa vista solo se muestran cinco atajos de sección («Equipos de ventas y logros», «Campañas», «Rendimiento de campañas», «Dudas y consultas» y «Redes sociales»), y el apartado antes llamado «Chat» pasa a denominarse «Dudas y consultas» en todas las etiquetas visibles, conservando `chat` como clave interna.

Postventa es una vista adicional para atender a clientes que ya compraron. Cada ticket se guarda como un `Documento` vinculado al cliente elegido, con «Asunto», «Categoría», «Prioridad», «Estado» y «Nota de resolución», de modo que quede visible en la ficha del cliente. El apartado muestra «Nuevo Ticket» arriba, las tarjetas «Tickets abiertos», «En proceso» y «Resueltos» debajo y una tabla en la que Atención al Cliente y Gerencia pueden cambiar el estado entre «Abierto», «En revisión» y «Resuelto», sin perder la posibilidad de reabrir un ticket resuelto. «Nuevo Ticket» abre ahora un panel en la misma página de Postventa que sustituye temporalmente la tabla, deja visibles las tres tarjetas y usa la misma presentación visual que el formulario «Nuevo Cliente»; al guardar, el panel se cierra y la tabla se actualiza sin recarga, y al cancelar con cambios sin guardar se pide confirmación antes de descartarlos. Las tres tarjetas tienen el mismo tamaño y proporción que los indicadores del apartado «Resumen», sin cambiar etiquetas, valores ni cálculo.

## Contexto Técnico

**Lenguaje/Versión**: JavaScript (ES2022), HTML, CSS  
**Dependencias Principales**: Vite, sin framework de interfaz pesado  
**Almacenamiento**: localStorage del navegador para una instancia del módulo de espacio único: `erp_entities`, `erp_documents`, `erp_marketing_config` para definiciones editables de Marketing, `erp_users` y `erp_session`; la denegación de permisos se garantiza en la API local con sesión íntegra, incluidas las llamadas desde consola, no contra manipulación deliberada de `localStorage`/`erp_session` ni falsificación de identidad/rango sin backend<br>
**Pruebas**: Vitest con jsdom para pruebas unitarias y de interacción (`npm test`); lint con `npm run lint`; comprobación de formato con `npm run format:check`; no hay script `typecheck`<br>
**Utilidades de Fecha**: `Date` nativo y cadenas ISO `YYYY-MM-DD`, sin librerías de fechas; resolución del límite superior mediante componentes locales y temporizador hasta la medianoche local  
**Plataforma Objetivo**: Navegador de escritorio moderno de referencia y navegador low-end/móvil de referencia definidos en FR-032  
**Tipo de Proyecto**: Aplicación web  
**Objetivos de Rendimiento**: Con 500 entidades y 500 documentos, renderizar, buscar y recalcular estados derivados en menos de 2 s en todos los casos, con objetivos de 200 ms p95 en el navegador de escritorio moderno de referencia y 500 ms p95 en el navegador low-end/móvil de referencia, sin congelación visible y con una sola pasada por juego de datos (FR-032, SC-004)  
**Restricciones**: Sin framework de interfaz ni dependencias de ejecución añadidas, despliegue estático de Vite, sin backend requerido; la estructura debe mantenerse extensible para módulos personalizados  
**Escala/Alcance**: Módulo base con CRUD de datos maestros (Entidad) y documentos transaccionales (Documento), búsqueda y capacidades de navegación  
**Reglas de Campo**: Capa declarativa opcional en `module-config.js` (`fieldRules`, `detailPolicy`) para ocultar, generar, exigir, hacer único, condicionar y excluir de búsqueda campos base o personalizados; la configuración ausente conserva el comportamiento base  
**Formatos de Validación**: Registro local de formatos (`src/utils/field-formats.js`) con `cl-rut`, `phone`, `email` y `nonEmpty`; sin dependencias nuevas  
**Preparación de Ficha**: Comprobación pura reutilizada del mismo validador declarativo para bloquear la consulta de registros incompletos y ofrecer su edición
**Presentación del Formulario**: Orden opcional por campo (`order`), pistas grises (`placeholder`) y opciones de selección con valor y etiqueta separados; sin dependencias nuevas
**RUT**: Se aceptan `12345678-9` y `12.345.678-9`; ambos se normalizan para validar el dígito verificador y para comparar unicidad

### Contexto Técnico del incremento de Marketing

**Vista de Marketing**: Vista adicional (`state.view = 'marketing'`) alcanzable desde la barra lateral como cuarta opción; el panel ya no muestra «Abrir Marketing»
**Captura pública y «Dudas y consultas»**: Vistas autónomas/`?view=capture` y controles embebidos en Marketing; responden desde preguntas frecuentes configuradas y registran consultas sin coincidencia como `Documento`
**Estado comercial**: Campo personalizado de entidad `estado_comercial` con valores `prospecto`, `en_proceso`, `en_recontacto`, `ganado` y `perdido`; se conserva oculto para la automatización y ya no alimenta tarjetas ni embudo
**Agregaciones**: Utilidad pura `src/utils/marketing-stats.js` que deriva las cinco tarjetas del panel y el embudo por estados de `Documento`, con `computeMarketingPerformance()` para indicadores por campaña; sin escribir resultados derivados
**Automatización**: Reglas declarativas `marketing.automationRules` y campañas programadas evaluadas tras las mutaciones de almacenamiento; cada ejecución se registra como un `Documento` en el historial de la entidad
**Atribución**: Campo opcional `campaña` en entidades, interacciones y documentos; los registros sin campaña se agrupan bajo «Sin campaña»
**Consentimiento**: Campos `consentimiento`, `consentimiento_fecha` y `consentimiento_version` en la entidad creada desde la captura y en «Dudas y consultas»; versión declarada en `marketing.privacyNoticeVersion`
**Navegación lateral**: `NAV_ITEMS` ofrece Panel, Buscar, Resumen y Marketing; Clientes e Interacciones solo se acceden desde el panel o enlaces profundos
**Atajos de Marketing**: `renderDashboardHtml()` acepta una opción para omitir `.quick-actions`; Marketing conserva tarjetas y embudo, pero usa solo su tabla de secciones como atajos visibles
**Terminología visible de Marketing**: etiquetas y orden exactos de los cinco atajos; «Dudas y consultas» sustituye a «Chat» en el componente compartido de captura y Marketing, sin cambiar claves internas ni selectores

### Contexto Técnico del incremento de identidad visual y bloqueo de borrado (2026-11-27)

**Iconos de navegación**: `src/components/shell.js` dibuja los cinco botones de `NAV_ITEMS` (Panel, Buscar, Resumen, Marketing y Postventa) con iconos SVG monocromáticos de trazo uniforme y nombres accesibles, sin emojis del sistema, legibles en modo expandido y contraído (US14b, FR-012, FR-039).

**Tokens de color**: `src/styles.css` mantiene el fondo del área de trabajo en `#F8FAFC` y las tarjetas en `#FFFFFF` con borde sutil y sombra ligera; `theme.accentColor` (por defecto `#1D4ED8`) se aplica a la barra superior, al elemento activo de la barra lateral, al botón principal del panel y a los acentos de las tarjetas KPI, con retorno al valor integrado si falta o es inválido (FR-038).

**Jerarquía del panel**: `src/components/dashboard.js` conserva exactamente tres acciones rápidas en una sola fila: «Gestionar clientes» como acción principal con relleno sólido del color de acento y «Gestionar interacciones» y «Buscar registros» como secundarias con fondo blanco y borde sutil; no se añaden acciones, rutas ni permisos (US15a, FR-033, FR-035).

**Baja definitiva de entidades**: `src/storage.js` y la capa de interfaz solo eliminan una `Entidad` sin documentos ni registros vinculados tras confirmación explícita; con registros vinculados rechazan la operación con `EntityHasRecordsError`, no mutan `erp_entities` ni `erp_documents` y ofrecen archivarla para conservar el historial. No hay borrado en cascada de documentos al eliminar entidades (FR-003, FR-009, FR-103).

### Contexto Técnico del incremento de autenticación y permisos

**Módulo de sesión**: `src/auth.js` centraliza inicio de sesión por usuario, cierre, persistencia local de la sesión y expiración por inactividad, sin dependencias nuevas; la verificación de credenciales y el bloqueo por intentos se eliminaron en el incremento de acceso por botones (2026-11-27).
**Almacenamiento de identidad**: claves nuevas `erp_users` y `erp_session` en `localStorage`; `erp_session` conserva solo `userId` y marcas de tiempo, y el rango vigente se resuelve desde `erp_users` en cada verificación para reflejar cambios y desactivaciones inmediatas.
**Matriz de permisos**: `src/auth/permissions.js` exporta la tabla rango → acción, la función `can(role, action, context)` y `assertPermission()`; es la única fuente para navegación, botones, vistas y validaciones de `src/storage.js`. Las acciones no declaradas se deniegan por defecto y la matriz no se edita desde la interfaz.
**Catálogo canónico de acciones**: los identificadores y la regla de contexto `ownerId`/`campaignOwnerId` se definen en `spec.md` («Catálogo canónico de acciones»); `contracts/auth.md` y `data-model.md` DEBEN reflejarlos sin introducir acciones nuevas ni variantes propio/cualquiera adicionales.
**Identidad automática**: las reglas de Marketing continúan ejecutándose como `Sistema`; `Sistema` es una identidad de auditoría, no un rango interactivo, y su historial conserva además el usuario creador de la campaña en `createdByUserId`.
**Vistas de acceso**: `src/components/login.js` renderiza la pantalla de inicio de sesión sin marco ERP y permite las rutas públicas de captura y chat; `src/components/users-admin.js` se abre solo desde el menú del usuario de la barra superior para el rango «Nivel 4 - Gerente comercial».
**Reglas de sesión**: expiración por 8 horas de inactividad y revocación inmediata al desactivar usuario; no hay bloqueo por intentos porque no se captura contraseña. Un cambio de rango se aplica en la siguiente acción o recarga. La denegación se garantiza en UI, enlaces profundos y la API de `storage.js`, incluidas las llamadas desde consola con sesión íntegra; la manipulación deliberada de `localStorage`, de `erp_session` o del entorno para falsificar identidad/rango queda fuera del alcance demostrativo.
**Usuarios de demostración**: la semilla local incluye `gerente` (Nivel 4), `marketing` (Nivel 3), `ventas` (Nivel 2) y `atencion` (Nivel 1); cada usuario activo ofrece un botón con su nombre o su `username`, sin contraseña ni hash.

### Contexto Técnico del incremento de Postventa

**Vista y ruta**: `state.view = 'postventa'` y `?view=postventa`, quinta entrada de `NAV_ITEMS` inmediatamente después de Marketing; el resaltado activo deriva de `state.view`.
**Persistencia**: sin clave nueva; cada ticket es un `Documento` con `entity_id` de un cliente existente y campos personalizados `ticket`, `asunto`, `categoria`, `prioridad` y `nota_resolucion`; el discriminador `ticket` separa los tickets del resto del historial.
**Configuración**: bloque opcional `postventa` en `MODULE_CONFIG` con `states`, `categoryOptions`, `priorityOptions`, `cardMapping` y `resolutionNoteStates`; las opciones y etiquetas visibles se derivan de ahí, sin tocar el `statusLifecycle` global.
**Agregaciones**: `src/utils/postventa.js` calcula `computeTicketStats()` en una sola pasada sobre los documentos en memoria, sin contadores persistidos; la vista se vuelve a renderizar tras cada mutación.
**Formulario**: `src/components/postventa.js` combina un buscador `#ticket-client-search` con un `select` de clientes activos, y valida prioridad obligatoria y «Nota de resolución» obligatoria solo cuando el estado es «Resuelto».
**Permisos**: acciones canónicas `postventa:view`, `postventa:view_own`, `postventa:create` y `postventa:transition`; N4 las tiene todas, N1 crea y cambia estados, N2 solo consulta los clientes que tiene asignados y N3/visitante no acceden.
**Capa de datos**: `createTicketDocument()`, `changeTicketStatus()` y `listTicketDocuments()` validan con `assertPermission()` antes de escribir o filtrar, sin depender solo de botones ocultos.

### Contexto Técnico del incremento de Postventa en línea y panel simplificado (2026-11-26)

**Panel en línea**: «Nuevo Ticket» reutiliza el estado local `state.ticketFormOpen` de `app.js` y alterna el cuerpo de `renderPostventaHtml()` entre la tabla de tickets y el formulario, sin registrar `?view=ticket-form`, sin `window.open` y sin `ROUTE_VIEWS`/`VIEW_ROUTES` adicionales. El botón «Nuevo Ticket», las tres tarjetas y el panel comparten la misma vista `?view=postventa`.

**Formulario reutilizado**: `src/components/ticket-form.js` conserva el markup único del formulario con el orden «Cliente», «Asunto», «Categoría», «Prioridad», «Estado» y «Nota de resolución», el buscador `#ticket-client-search`, el identificador `#ticket-form` y los mensajes exactos. Para igualar la presentación de «Nuevo Cliente», cada casilla usa las mismas clases `.form-field`, `.client-form-section` y `.form-actions` que `entity-form.js`/`form-fields.js`, sin adoptar campos ni reglas de entidades.

**Ciclo del panel**: la acción `cancel-ticket-form` pasa a abrirse desde el propio formulario y usa la comprobación de cambios sin guardar ya presente en `app.js` antes de descartar borradores; `ticket-save` conserva validación, permisos y mensajes, y al guardar cierra el panel y vuelve a renderizar tarjetas y tabla con los datos ya en memoria. No hay evento `storage`, `postMessage`, sondeo ni clave nueva de `localStorage`.

**Panel principal simplificado**: `src/components/dashboard.js` deja de renderizar `quick-new-entity` y `quick-new-document`; solo quedan «Gestionar clientes», «Gestionar interacciones» y «Buscar registros». La creación sigue disponible en los formularios ya renderizados por `renderManageView()` para entidades y documentos, por lo que no se añade nueva pantalla ni acción canónica.

**Tamaño de tarjetas**: regla CSS ámbito `.postventa-cards` equivalente a `.summary-cards` (contenedor flex con `gap`/`margin` y `min-width` heredado de `.stat-card`), sin modificar la regla global `.stat-card` ni el orden, etiquetas, valores o cálculo de las tarjetas.

**Pruebas**: Vitest/jsdom verifica el panel en línea, el retorno a la tabla tras guardar, la confirmación al cancelar con cambios y la ausencia de `window.open`; las suites que montaban `?view=ticket-form` y las que contaban cinco acciones rápidas se ajustan al nuevo flujo de tres acciones.

### Contexto Técnico del incremento de acceso, consulta rápida, tickets y cierre perdido (2026-11-27)

**Acceso por botones**: `src/components/login.js` deja de renderizar `#login-form`, `#login-username` y `#login-password`; dibuja botones `data-action="login-user"` con `data-user-id`, cuatro etiquetas fijas para los usuarios semilla y `username` para el resto, en dos columnas centradas. `src/auth.js` resuelve `login(userId)` desde `erp_users` sin contraseña y conserva sesión, expiración, revocación y unicidad de usuario.

**Consulta rápida de cliente**: `src/components/client-quick-view.js` añade una vista superpuesta de solo lectura controlada por `state.quickViewEntityId`; el nombre en `entity-list.js` pasa a ser un botón con `data-action="open-client-quick-view"`. El componente reutiliza `formatCurrencyUsd()`, `isFieldVisible()`, `isTicket()` y el historial ya ordenado, y filtra documentos y tickets con la matriz vigente antes de renderizar.

**Ticket desde la tabla de clientes**: `renderManageEntitiesHtml()` recibe los tickets visibles agrupados por `entity_id` y calcula en una sola pasada las alertas «Ticket abierto» y «Ticket en revisión». La acción `open-ticket` comprueba `postventa:create`, navega a `?view=postventa`, abre `state.ticketFormOpen` y precarga `state.ticketValues.entity_id` para que `#ticket-client` muestre ese cliente.

**Cierre perdido**: `module-config.js` declara `customFields.document.motivo_perdida` y un bloque opcional `documentRules.lostReason` con estado destino `cerrado perdido`, campo de entidad `estado_comercial`, valor `prospecto` y las cuatro opciones exactas. `src/utils/lost-reason.js` concentra la regla pura; `validateDocumentData()` la ejecuta antes de escribir y `document-form.js` muestra el desplegable solo cuando corresponda. El estado ya existe en `statusLifecycle.states`; no se añade a `pendingStates`, al conjunto activo de `marketing-stats.js` ni a `sales-team-metrics.js`.

**Sin cambios de esquema**: ninguna de estas decisiones crea almacenamiento nuevo; el motivo es un campo personalizado del `Documento`, los tickets siguen siendo `Documento` con `ticket: true`, y la consulta rápida es estado local en memoria.

### Aclaraciones integradas (sesión 2026-11-01)

- El `code` de entidad es obligatorio y único, comparado sin distinguir mayúsculas ni espacios.
- Sin ciclo de vida configurado, el estado del documento es texto libre (sin lista fija de valores).
- Una configuración inválida o conflictiva hace que la aplicación arranque con los valores predeterminados y muestre una advertencia visible, sin bloquear el uso.
- Los valores de campos personalizados que ya no están declarados se conservan en el almacenamiento y se ocultan de la interfaz; si el campo se vuelve a declarar, los valores reaparecen.
- La eliminación definitiva de una entidad solo se permite sin documentos ni registros vinculados y exige confirmación explícita; con registros vinculados se bloquea con `EntityHasRecordsError`, no se borra nada y se ofrece archivarla (FR-003, FR-009, FR-103).

### Aclaraciones integradas (sesión 2026-11-12)

- Sin ciclo de vida configurado, un documento se considera pendiente cuando su `status` normalizado (minúsculas y recorte) coincide con "pendiente"; si no hay coincidencias, el indicador es cero.
- Los campos base de `Documento` son `id`, `entity_id`, `startDate`/`endDate` opcionales, `notes` opcional, `status` y marcas de tiempo; serie/folio, importes, moneda, condiciones y tipo de interacción se tratan como campos personalizados declarados por la configuración.

### Aclaraciones integradas (sesión 2026-11-23)

- La regla de fecha de nacimiento aplica únicamente al perfil de clientes; los demás perfiles conservan "Fecha objetivo" sin rango.
- En el perfil de clientes, "Fecha objetivo" se renombra a "Fecha de nacimiento" en todos los lugares visibles (formulario, lista, ficha, búsqueda y filtros).
- El rango válido es del 1 de enero de 1910 a la fecha local del dispositivo, inclusive, con validación real de días y meses del calendario.
- El límite superior se recalcula automáticamente al cambiar de día mientras la aplicación permanece abierta, sin recarga.
- Las fechas históricas fuera de rango se conservan y muestran, pero se exige corregirlas antes de guardar cualquier edición del cliente.

### Aclaraciones integradas (sesión 2026-11-23, segunda tanda)

- «Código», «Categoría», «Descripción» y «Nº de pedidos» dejan de mostrarse en formulario, lista, ficha y búsqueda del perfil de clientes; sus valores se conservan en almacenamiento.
- El sistema genera un código único interno por cliente, lo guarda en el registro y no lo captura, muestra ni busca.
- «Nº de pedidos» se elimina de la configuración del perfil y deja de registrarse.
- En el perfil de clientes la búsqueda ignora código, categoría y descripción; usa nombre, fecha de nacimiento y campos personalizados visibles.
- «Fecha de nacimiento», «Canal de Contacto» y «RUT» son obligatorios al guardar; el RUT debe tener dígito verificador válido y ser único.
- Los clientes heredados sin esos datos o con RUT inválido tienen bloqueada su ficha; se permiten editar solo para completarlos y se desbloquean al guardar válidamente.
- «Canal de Contacto» no tiene opción preseleccionada: el usuario debe elegirla explícitamente.
- Según el canal se muestra una casilla adicional («Teléfono», «Correo electrónico», «Lugar/Enlace de reunión» o «WhatsApp»); solo se guarda el valor del canal elegido y esa casilla también es obligatoria, con formato validado.

### Aclaraciones integradas (sesión 2026-11-23, tercera tanda: presentación del formulario de clientes)

- El «RUT» admite `12345678-9` y `12.345.678-9`: se eliminan los puntos antes de validar el dígito verificador y antes de comprobar unicidad, de modo que un mismo RUT no se guarde dos veces por escribirlo en formatos distintos.
- El «RUT» muestra en gris la pista `Ej: 11.111.111-1`, que no cuenta como valor capturado.
- Las opciones del desplegable de «Canal de Contacto» se muestran como «Llamada», «Correo», «Reunión» y «WhatsApp», conservando los valores almacenados y las condiciones `when`.
- El título del formulario de registro dentro de «Gestionar clientes» dice «Nuevo Cliente» en lugar de «Nueva cliente»; el panel principal ya no muestra esa acción rápida (FR-033, FR-034).
- El orden de las casillas es: «Nombre de Cliente», «RUT», «Fecha de nacimiento», «Canal de Contacto» con su casilla adicional, «Tipo de actividad» y «Ejecutivo Asignado».
- «Rubro» pasa a llamarse «Tipo de actividad» y se convierte en desplegable con las opciones «Dependiente», «Independiente Formal», «Independiente Informal», «Jubilado», «Dueño/a de casa», «Estudiante», «FFAA», «Rentista», «Jubilado - FFAA» y «Cesante»; la clave de almacenamiento `rubro` no cambia.
- La casilla adicional de contacto muestra en gris una pista según el canal: `Ej: +56 9 1234 5678` para «Llamada» y «WhatsApp», `Ej: nombre@ejemplo.cl` para «Correo» y `Ej: Sala 2 o enlace» para «Reunión».

### Aclaraciones integradas (sesión 2026-11-23, cuarta tanda: Marketing y navegación)

- El prospecto es una `Entidad` con estado inicial «Prospecto» que se convierte en Cliente al avanzar de etapa, sin nuevo tipo de registro.
- La captación principal es un formulario web público embebible que crea el prospecto automáticamente.
- La automatización se desencadena por eventos configurables (captura, cambio de etapa o interacción) y ejecuta una acción sobre el prospecto.
- El consentimiento es explícito, obligatorio y se registra con fecha y versión del aviso aceptado.
- La conversión se mide con el embudo del panel: conteo y porcentajes por estado de documento, sin duplicar el cálculo en Marketing.
- El apartado muestra las cinco tarjetas del panel (entidades, documentos, «Cerrado ganado», «Tasa de conversión» y «Pipeline (USD)») y el mismo embudo por estados de documento; la torta «Estado comercial de la cartera» y el selector de etapas se eliminan.
- «Clientes» e «Interacciones» se eliminan de la barra lateral; solo se acceden desde el panel principal. Panel, Buscar y Resumen permanecen en la barra lateral.

### Aclaraciones integradas (sesión 2026-11-23, quinta tanda: datos y navegación de Marketing)

- Marketing muestra las mismas cinco tarjetas y el mismo embudo del panel, derivados de entidades y documentos; se eliminan la torta «Estado comercial de la cartera» y el selector de etapas.
- `estado_comercial` y las reglas automáticas se conservan internamente sin mostrarse en Marketing.
- «Abrir Marketing» desaparece del panel y «Marketing» se añade como cuarta opción de la barra lateral.
- El acceso «Equipos de ventas y logros» permite equipos e integrantes capturados por el usuario, mientras que el real mensual y el objetivo mensual los calcula el sistema.
- El real mensual suma documentos «Cerrado ganado» del mes por «Ejecutivo Asignado»; el objetivo mensual es la proyección `ventas ÷ días transcurridos × días del mes`, o cero sin ventas o sin días transcurridos.

### Aclaraciones integradas (sesión 2026-11-23, sexta tanda: canales y «Dudas y consultas»)

- Las interacciones en redes se registran manualmente con plataforma, fecha, tipo, nota y enlace, vinculadas al prospecto o cliente.
- Las interacciones de redes y los mensajes de «Dudas y consultas» se guardan como `Documento` con campos personalizados de plataforma/canal y tipo de interacción; el valor interno `canal = 'chat'` no cambia.
- «Dudas y consultas» responde desde preguntas frecuentes configuradas; sin coincidencia registra la consulta para seguimiento.
- «Dudas y consultas» está disponible en el formulario público de captura y en Marketing, con consentimiento explícito antes del primer mensaje.

### Aclaraciones integradas (sesión 2026-11-23, séptima tanda: campañas y rendimiento)

- La automatización se organiza en campañas internas por etapa, sin servicios externos.
- El rendimiento se mide con prospectos, conversión por etapa, interacciones, consultas respondidas y ventas ganadas, derivados de registros ya almacenados.
- El campo opcional `campaña` atribuye prospectos, interacciones y ventas; sin valor se agrupa bajo «Sin campaña».
- Las acciones internas de campaña son crear documento de seguimiento, asignar ejecutivo y actualizar `estado_comercial`.
- Si dos campañas activas aplican al mismo prospecto y evento, se ejecuta la más reciente y la otra se registra como «omitida por solapamiento».

### Aclaraciones integradas (sesión 2026-11-24)

- La matriz de permisos no se edita desde la interfaz; se modifica solo en su definición y ningún usuario la cambia desde una pantalla.
- La sesión persiste localmente al recargar y al reabrir el navegador, y finaliza con «Cerrar sesión», desactivación del usuario o expiración por inactividad.
- La desactivación de un usuario revoca su sesión de inmediato: en la siguiente acción o recarga se redirige a inicio de sesión.
- Un cambio de rango se aplica en la siguiente acción o recarga, actualizando la barra superior y los permisos derivados de la matriz.
- El nombre de usuario es único sin distinguir mayúsculas ni espacios; el guardado rechaza duplicados.

### Aclaraciones integradas (sesión 2026-11-24, atajos y terminología de Marketing)

- Los atajos del panel («Gestionar clientes», «Gestionar interacciones» y «Buscar registros») solo aparecen en el panel principal; la creación de clientes e interacciones se hace dentro de las respectivas pantallas de gestión.
- Marketing muestra exactamente cinco atajos en este orden: «Equipos de ventas y logros», «Campañas», «Rendimiento de campañas», «Dudas y consultas» y «Redes sociales».
- La etiqueta visible del equipo cambia de singular a plural: «Equipos de ventas y logros».
- «Dudas y consultas» sustituye visiblemente a «Chat» en Marketing y en el formulario público; las claves internas `chat`, `canal: 'chat'` y los selectores existentes no cambian.

### Aclaraciones integradas (sesión 2026-11-26, Postventa)

- El ticket se guarda como `Documento` vinculado por `entity_id` a un cliente ya existente; «Nuevo Ticket» muestra «Cliente», «Asunto», «Categoría», «Prioridad», «Estado» y «Nota de resolución», en ese orden.
- «Cliente» es un desplegable con todos los clientes existentes y un buscador por nombre; «Categoría» ofrece «Soporte técnico», «Facturación», «Garantía» y «Consulta».
- «Tickets abiertos» cuenta «Abierto», «En proceso» cuenta «En revisión» y «Resueltos» cuenta «Resuelto», una tarjeta por estado.
- Atención al Cliente y Gerencia crean tickets y cambian cualquier estado; Ventas solo consulta los tickets de sus clientes; Marketing y visitantes no acceden.
- La tabla permite cambiar entre cualquier par de estados, incluida la reapertura desde «Resuelto».
- «Prioridad» ofrece «Baja», «Media» y «Alta» sin preselección; «Nota de resolución» es obligatoria solo al guardar en «Resuelto».

### Aclaraciones integradas (sesión 2026-11-26, Postventa en línea y panel simplificado)

- «Nuevo Ticket» abre un panel en la misma página de Postventa que sustituye temporalmente la tabla de tickets; las tres tarjetas permanecen visibles arriba y el botón vuelve a mostrarse al cerrar el panel.
- El formulario de «Nuevo Ticket» usa la misma presentación visual que «Nuevo Cliente» —tarjetas, etiquetas, espaciado, colores, pistas en gris y botones— sin adoptar sus campos ni sus reglas de validación.
- Guardar el ticket cierra el panel y vuelve a la tabla actualizada; cancelar cierra el panel sin guardar y, si hay cambios sin guardar, pide confirmación antes de descartarlos (FR-022).
- El panel principal elimina «Nuevo Cliente» y «Nueva interacción»; la creación queda dentro de «Gestionar clientes» y «Gestionar interacciones».

### Aclaraciones integradas (sesión 2026-11-27, identidad visual y borrado)

- Los botones de módulo de Panel, Buscar, Resumen, Marketing y Postventa usan iconos SVG monocromáticos de trazo uniforme, sin emojis del sistema, y mantienen etiquetas accesibles en la barra contraída (US14b, FR-012, FR-039).
- El panel mantiene sus tres acciones rápidas en una fila, con la acción principal de gestión en color de acento y las secundarias en blanco con borde sutil, sobre fondo `#F8FAFC` y tarjetas `#FFFFFF` (US15a, FR-033, FR-035, FR-038).
- La eliminación definitiva de una entidad solo se permite sin registros vinculados; con documentos asociados se bloquea sin borrar nada y se ofrece archivarla (FR-003, FR-009, FR-103).

### Aclaraciones integradas (sesión 2026-11-27, acceso, consulta rápida, tickets y cierre perdido)

- El login muestra un botón por usuario activo: cuatro iniciales y, detrás, los creados por Gerencia en orden de registro, sin campos de usuario/contraseña ni mensajes «Ingresa una contraseña» o «Usuario no encontrado» (FR-110).
- El nombre de un cliente abre una consulta rápida de solo lectura desde «Buscar» y desde la tabla «Clientes», con «Cerrar» y «Ver ficha completa», total comprado en USD desde documentos «Cerrado ganado» con su `startDate`, historial cronológico y tickets permitidos por rango (FR-111).
- La tabla «Clientes» ofrece «Abrir Ticket» para N1/N4 y alertas «Ticket abierto» en naranja y «Ticket en revisión» en azul para los rangos que pueden consultar los tickets de cada cliente; el botón navega a Postventa con el cliente preseleccionado (FR-112).
- «Cerrado perdido» es un estado de `Documento`. Solo cuando la entidad esté en `estado_comercial = prospecto`, la transición exige uno de «Precio alto», «Eligió competencia», «Sin presupuesto» o «No responde»; sin selección no se guarda. El motivo se guarda en el documento, aparece en el historial y el estado solo se muestra en el embudo, sin afectar ventas, real mensual ni pendientes (FR-113).

### Ajustes posteriores al análisis (2026-11-24)

- FR-005 se limita a búsqueda/ficha; la pantalla de gestión sigue sin lista de entidades conforme a FR-016.
- FR-035 define las cinco tarjetas canónicas del panel y el embudo, reutilizados por Marketing sin duplicar fórmulas.
- La conversión Prospecto→Cliente ocurre solo por transición interna (regla/campaña o edición de Nivel 4) con auditoría, sin selector de etapas.
- «Dudas y consultas» exige consentimiento y los campos obligatorios declarados en `marketing.captureFields` antes del primer mensaje, de modo que las consultas sin coincidencia se vinculen a una entidad y muestren exactamente `Consulta registrada; un ejecutivo hará seguimiento.`.
- Las ventas históricas conservan `assignedUserIdAtSale` aunque el usuario esté inactivo y FR-078/FR-079 la consumen antes que el campo vigente; las nuevas asignaciones siguen exigiendo usuarios activos N2/N4.
- El creador de campaña se persiste en `createdByUserId`, separado de la ejecución como `Sistema`.
- El catálogo canónico de acciones de `spec.md` gobierna `can()`/`assertPermission()`, las pruebas de permisos y la alineación de contratos/modelo de datos.
- SC-003 se vuelve medible con cinco participantes y se cubre con una tarea de validación cronometrada.
- Las siete rutas relativas `?view=summary`, `?view=capture`, `?view=marketing`, `?view=postventa`, `?view=manage-entity`, `?view=manage-document` y `?view=users-admin` se resuelven desde `location.search` en un mismo documento HTML sin host ni ruta de servidor; sin parámetro `view` el Panel es la vista inicial y no existe `?view=panel`.

## Verificación de la Constitución

_COMPROBACIÓN: Debe pasar antes de la investigación de la Fase 0. Reverificar tras el diseño de la Fase 1._

- Calidad: La implementación usará una estructura JavaScript modular con límites de función y nomenclatura definidos, manteniendo las preocupaciones base (almacenamiento, identidad, integridad referencial) separadas de la lógica específica del dominio para que los módulos personalizados puedan extenderlas.
- Calidad (herramientas): Todo incremento ejecutará `npm run lint` además de `npm test`, y el gate final de calidad ejecutará `npm run format:check`; `format:check` usa Prettier en modo comprobación y sustituye la edición automática de `npm run format` en la verificación de calidad.
- Pruebas: Los flujos centrales de crear, editar, eliminar y buscar estarán cubiertos por pruebas automatizadas antes de completar.
- Experiencia de Usuario: La interfaz mostrará mensajes de validación con el texto exacto de FR-006 y estados vacíos con texto definido, y aplicará el mismo comportamiento de formulario en todas las pantallas dentro de un marco de espacio de trabajo ERP compartido con barra superior y barra lateral.
- Rendimiento: Con 500 entidades y 500 documentos, búsqueda, renderizado de listas y recálculo de estados derivados se ejecutan en una sola pasada, terminan en menos de 2 s en todos los casos y se verifican con umbrales p95 de 200 ms en escritorio moderno y 500 ms en low-end/móvil, sin congelación visible (FR-032, SC-004).
- Calidad (Marketing): Las agregaciones, reglas de automatización y validación de consentimiento se implementarán como funciones puras en módulos separados por responsabilidad, con la configuración como único punto de declaración, reutilizando `Entidad` y `Documento` sin nuevas estructuras de almacenamiento.
- Pruebas (Marketing): Se cubrirán con pruebas unitarias las agregaciones y reglas, y con pruebas de integración la vista, la captura con consentimiento, el embudo accesible y la presencia de Marketing en la barra lateral.
- Experiencia de Usuario (Marketing): Los contadores y el embudo usarán los mismos patrones visuales que el panel principal, con estados vacíos con texto definido y leyenda textual accesible; el formulario público mostrará errores con el texto exacto de FR-006 sin el marco ERP.
- Rendimiento (Marketing): Las agregaciones se calcularán en memoria sobre el arreglo ya cargado en `state`, con una sola pasada por entidad y sin almacenar resultados derivados.
- Calidad (Campañas): Las campañas, la atribución, las acciones internas y la resolución de solapamientos se implementarán como utilidades puras y reglas declarativas reutilizando `Entidad`, `Documento` y `marketing.automationRules`, sin estructura de almacenamiento ni dependencias nuevas.
- Pruebas (Campañas): Se cubrirán con pruebas unitarias el cálculo de indicadores, la atribución «Sin campaña», las acciones permitidas y el desempate por campaña más reciente, y con pruebas de integración las vistas de campañas y rendimiento.
- Seguridad y UX (Campañas): «Dudas y consultas» (clave interna `chat`) exigirá consentimiento previo, todo contenido persistido se sanitizará al renderizarse y las vistas nuevas mostrarán estados vacíos, mensajes claros con esa etiqueta visible y los mensajes exactos de FR-006 antes de cualquier ejecución.
- Calidad (atajos y terminología): La omisión de los atajos del panel en Marketing se resolverá con una opción explícita del renderizador compartido y la lista de secciones con claves internas estables, sin duplicar componentes ni añadir dependencias.
- Pruebas (atajos y terminología): Pruebas de integración verificarán que el panel ofrece exactamente tres acciones rápidas, que Marketing no contiene `.quick-actions`, que sus cinco atajos internos aparecen en el orden acordado y que «Dudas y consultas» sustituye a «Chat» en ambas superficies visibles.
- Experiencia de Usuario (atajos y terminología): El panel ofrecerá solo las tres acciones de gestión/búsqueda, Marketing exclusivamente sus secciones, y la creación de clientes e interacciones quedará dentro de las pantallas de gestión; la renombración se aplicará a encabezados, pestañas y texto de consentimiento sin tocar identificadores internos.
- Calidad (Autenticación): La sesión, la expiración, la unicidad de usuario y la matriz de permisos se aislarán en `src/auth.js` y `src/auth/permissions.js`, manteniendo una sola fuente de verdad y funciones puras verificables; no queda lógica de hash ni de bloqueo.
- Pruebas (Autenticación): Se cubrirán con pruebas unitarias la unicidad, el orden de los botones, la expiración y `can()`/`assertPermission()`, y con pruebas de integración el login por botones, el menú del usuario, la administración de usuarios sin contraseña y el rechazo de operaciones directas en `storage.js`.
- Experiencia de Usuario (Autenticación): La pantalla de inicio muestra una grilla centrada de botones por usuario activo, sin campos de usuario/contraseña ni mensajes obsoletos; «Acceso denegado» y el retorno al Panel siguen los patrones del marco ERP, y «Gestionar usuarios» solo aparecerá en el menú del Gerente.
- Rendimiento (Autenticación): La resolución del usuario y del rango se hará en memoria desde una sola lectura de `localStorage` por cambio de vista o mutación, sin derivaciones criptográficas.
- Calidad (Postventa): Los tickets reutilizarán `Documento` y `customFields.document` con un discriminador `ticket`; las opciones, estados y reglas se declararán en un bloque opcional `postventa` de `MODULE_CONFIG`, sin nuevo esquema de almacenamiento ni dependencias.
- Pruebas (Postventa): Se cubrirán con pruebas unitarias las agregaciones, las opciones declaradas y la validación condicional de la nota de resolución, y con pruebas de integración el formulario, el desplegable buscable, la tabla, los cambios de estado, la ficha del cliente y las denegaciones por rango.
- Seguridad y UX (Postventa): La creación y el cambio de estado se validarán en `src/storage.js` con las acciones canónicas nuevas, incluso en llamadas directas; la vista usará mensajes exactos, estados vacíos, texto sanitizado y el mismo marco ERP, con Postventa como quinta opción de la barra lateral.
- Rendimiento (Postventa): Las tres tarjetas se calcularán en una sola pasada sobre los documentos ya cargados en memoria y se actualizarán al renderizar tras cada mutación, sin contadores persistidos (FR-032, FR-105).
- Calidad (Postventa en línea): `src/components/ticket-form.js` conserva un único markup de formulario reutilizado en el panel de `?view=postventa`, sin duplicar campos, opciones ni validación; se retiran la ruta `ticket-form`, `window.open` y el listener `storage` introducidos antes.
- Pruebas (Postventa en línea): Se cubrirán con pruebas de integración la apertura del panel dentro de Postventa, el retorno a la tabla tras guardar, la confirmación al cancelar con cambios, la denegación para N2/N3/visitante, la ausencia de pestaña nueva y el conteo de tres acciones rápidas en el panel.
- Experiencia de Usuario (Postventa en línea): El panel usará los mismos campos, orden y mensajes exactos, con la presentación de «Nuevo Cliente»; las tres tarjetas permanecerán visibles y adoptarán el tamaño de «Resumen» sin alterar etiquetas, valores ni cálculo.
- Seguridad (Postventa en línea): `createTicketDocument()` seguirá comprobando `postventa:create` en la capa de datos y el panel solo se abrirá para usuarios con ese permiso; la creación de clientes e interacciones seguirá validándose en las pantallas de gestión aunque sus botones salgan del panel.
- Rendimiento (Postventa en línea): La mutación existente provoca un solo `render()` en la misma pestaña, sin eventos `storage`, `postMessage`, sondeo ni recálculo adicional; el cambio de tamaño de tarjetas sigue siendo solo CSS.
- Calidad (identidad visual): Los iconos SVG, los tokens de color y la jerarquía de botones se definen en `shell.js`, `dashboard.js` y `styles.css`, sin añadir dependencias ni duplicar estilos por vista (FR-012, FR-038).
- Pruebas (identidad visual): Pruebas de integración verifican los iconos SVG monocromáticos en los cinco botones de navegación, el fondo `#F8FAFC`, las tarjetas `#FFFFFF` y la jerarquía de los tres botones del panel, además del fallback de `theme.accentColor` (US14b, US15a).
- Seguridad y UX (borrado): `deleteEntity()` y la capa de datos bloquean la baja definitiva con `EntityHasRecordsError` cuando hay documentos vinculados, ofrecen archivar y no escriben cambios; la confirmación sin registros sigue siendo explícita (FR-003, FR-009, FR-103).
- Calidad (acceso por botones): `login.js` concentra la grilla de usuarios activos, `auth.js` resuelve la identidad desde `erp_users` y `users-admin.js` deja de capturar contraseña, sin dejar mensajes obsoletos ni dos fuentes de orden (FR-098, FR-110).
- Pruebas (acceso por botones): se cubren los cuatro botones iniciales, usuarios nuevos en orden de registro, usuarios desactivados sin botón, sesión persistente y ausencia de campos y mensajes de contraseña (SC-034).
- Experiencia de Usuario (consulta rápida y tickets): la ficha rápida es de solo lectura, reutiliza tarjetas, tablas, estados vacíos y sanitización; las alertas de la tabla usan etiquetas y colores exactos y «Ver ficha completa» respeta permisos (FR-041, FR-111, FR-112).
- Seguridad (consulta rápida y tickets): interacciones y tickets se filtran con `can()` antes de renderizarse, y «Abrir Ticket» solo se ofrece con `postventa:create`; `createTicketDocument()` sigue validando en la capa de datos (FR-094, FR-095, FR-106).
- Calidad (cierre perdido): `documentRules.lostReason` y `src/utils/lost-reason.js` mantienen la regla declarada y verificable; `validateDocumentData()` es el único punto que bloquea la escritura y `document-form.js` deriva de la misma regla la visibilidad del campo (FR-113).
- Pruebas (cierre perdido): se cubren opciones exactas, cliente prospecto frente a cliente convertido, ausencia de motivo, persistencia en el historial y no alteración de ventas, real mensual, embudo ni pendientes (SC-043).
- Rendimiento (incremento actual): las alertas y la consulta rápida derivan de los arreglos ya cargados en memoria en una sola pasada por vista, sin contadores persistidos ni recálculos redundantes (FR-032, SC-004).

**Reverificación post-diseño (Fase 1)**: APROBADA. Los artefactos de diseño (research, data-model, contratos, quickstart) mantienen la separación entre almacenamiento base y dominio, validan la unicidad de `code`, preservan los valores huérfanos de campos personalizados, documentan el fallback con advertencia ante configuración inválida y exigen confirmación explícita y bloquean la baja con `EntityHasRecordsError` cuando hay registros vinculados. La regla de fecha y las nuevas reglas de perfil se declaran en `module-config.js` mediante `entityDate.required`, `fieldRules` y `detailPolicy`; la validación de RUT reutiliza la lógica ya existente en la semilla, extraída a un registro local de formatos, sin añadir dependencias. El comportamiento base permanece intacto cuando no hay reglas, los borradores del formulario se conservan al cambiar de día y de canal, y se mantienen pruebas unitarias/de integración para los flujos visibles. La tercera tanda añade presentación declarativa (`order`, `placeholder` y opciones con `{ value, label }`) reutilizando el mismo `module-config.js` y el registro de formatos existente: los valores almacenados, las condiciones `when` y la clave `rubro` no cambian, las pistas grises son solo atributos de ejemplo y la unicidad del RUT sigue una sola regla normalizada. No se introducen dependencias ni violaciones de la constitución.

**Reverificación post-diseño del incremento de Marketing**: APROBADA. El marketing reutiliza `Entidad` y `Documento` con un campo `estado_comercial` declarado y reglas `marketing.automationRules`, sin esquema nuevo ni dependencias: las agregaciones se calculan en una utilidad pura y el embudo se reutiliza del panel. La captura pública se resuelve como vista autónoma en la misma aplicación sin backend, documentando la limitación de mismo origen. La barra lateral incluye Marketing; solo se retiran Clientes e Interacciones y se compensa con acciones rápidas, de modo que la navegación y el marco siguen siendo consistentes. Las pruebas unitarias y de integración cubren contadores, embudo, consentimiento, automatización y navegación; los estados vacíos y la leyenda accesible del embudo cumplen el Principio III.

**Reverificación post-diseño del incremento anterior**: APROBADA. Marketing reutiliza el panel y sus reglas de cálculo en lugar de duplicarlas, traslada su acceso a la barra lateral y mantiene `estado_comercial` como dato interno. Equipos, redes, «Dudas y consultas», campañas y rendimiento se modelan con campos personalizados, `Documento` y reglas declarativas sobre la configuración existente; no se añaden dependencias, backend ni esquemas nuevos. La atribución opcional y el grupo «Sin campaña» evitan migraciones, el desempate por campaña más reciente previene acciones duplicadas y el consentimiento de «Dudas y consultas» reutiliza la versión del aviso ya registrada. Los artefactos de Phase 1 documentan contratos, estados y escenarios de validación suficientes para `/speckit.tasks`.

**Reverificación post-diseño del incremento actual (2026-11-24)**: APROBADA. La nueva presentación de Marketing es solo una capa de renderizado: `dashboard.js` expone una opción para no dibujar `.quick-actions`, y `marketing.js` define las cinco secciones y su orden sin alterar las claves internas. «Dudas y consultas» se aplica al componente compartido y al texto visible de consentimiento, preservando `canal: 'chat'`, `#chat-form`, selectores y almacenamiento. No se añaden dependencias, esquemas ni servicios; las pruebas de integración cubren la ausencia de atajos del panel en Marketing, el orden exacto de los nuevos atajos y las etiquetas visibles en ambas superficies.

**Reverificación post-diseño del incremento de autenticación**: APROBADA, con la revisión de 2026-11-27 integrada. La identidad y la matriz viven en módulos separados por responsabilidad sin dependencias nuevas; `src/auth/permissions.js` es la única fuente de permisos y `src/storage.js` la consume antes de mutar, de modo que ocultar botones no sea la única barrera. La sesión guarda solo `userId` y marcas de tiempo, resolviendo el rango desde `erp_users` para cumplir la revocación y el cambio de rango inmediato. El hash y el bloqueo temporal quedaron eliminados cuando el acceso pasó a botones por usuario activo, sin contraseñas que almacenar; `Sistema` queda fuera de la matriz interactiva pero conserva la auditación de campañas. Los contratos y el modelo de datos documentan estados, mensajes exactos y escenarios verificables para `/speckit.tasks`.

**Reverificación post-diseño del incremento de Postventa (2026-11-26)**: APROBADA. Los tickets reutilizan `Documento` y su vínculo `entity_id`, por lo que no aparece `support_tickets` ni segunda historial; el bloque `postventa` de configuración mantiene las opciones y transiciones declaradas sin alterar el `statusLifecycle` global ni los atajos de Marketing. Las cuatro acciones canónicas nuevas se añaden a la única matriz de permisos y se validan en funciones dedicadas de `src/storage.js`, de modo que N1 no necesite `document:edit_any` ni N3 pueda crear tickets. Las tarjetas derivan de los documentos en una sola pasada, con estados vacíos y mensajes exactos conforme al marco compartido. Los contratos, el modelo de datos y la guía de validación cubren la ruta, el formulario, los rangos y los casos límite; no se introducen dependencias ni violaciones de la constitución.

**Reverificación post-diseño del incremento de Postventa en línea y panel simplificado (2026-11-26)**: APROBADA. El formulario sigue concentrado en `src/components/ticket-form.js` y se renderiza dentro de `?view=postventa` mediante estado local, sin nueva ruta, `window.open` ni sincronización entre pestañas; `createTicketDocument()` mantiene la comprobación de `postventa:create` en la capa de datos. La apariencia reutiliza `.form-field`, `.client-form-section` y `.form-actions` ya existentes en el formulario de clientes, sin adoptar sus campos ni reglas, y la cancelación con cambios reutiliza la lógica de borradores ya presente. El panel principal pasa de cinco a tres acciones rápidas, y la creación de clientes e interacciones permanece en las vistas de gestión ya implementadas. El ajuste de tamaño de tarjetas sigue siendo una regla CSS con ámbito `.postventa-cards` que no toca `.stat-card` global, el orden de los nodos ni `computeTicketStats()`. No hay dependencias, claves de almacenamiento ni violaciones de la constitución.

**Reverificación post-diseño del incremento de identidad visual y bloqueo de borrado (2026-11-27)**: APROBADA. Los cambios son de presentación y de una sola regla de integridad referencial: `shell.js` y `dashboard.js` reutilizan los componentes y permisos ya existentes, y `styles.css` concentra los tokens de color sin alterar etiquetas, rutas, claves de `localStorage` ni cálculos derivados. `theme.accentColor` mantiene su fallback declarado, por lo que una configuración inválida no bloquea la interfaz. La baja definitiva deja de borrar documentos en cascada: la capa de datos comprueba los registros vinculados, rechaza la operación con `EntityHasRecordsError` sin mutar datos y ofrece archivar para conservar el historial, en coherencia con FR-003, FR-009 y FR-103. No se introducen dependencias, módulos nuevos ni violaciones de la constitución.

**Reverificación post-diseño del incremento de acceso, consulta rápida, tickets y cierre perdido (2026-11-27)**: APROBADA. El login reutiliza `erp_users` y `erp_session`, y elimina la captura de contraseña sin cambiar la resolución del rango ni la expiración. La consulta rápida y las alertas derivan de los arreglos ya cargados, filtran con la matriz de permisos y reutilizan componentes, estados vacíos y sanitización existentes. El motivo de cierre perdido se declara en `module-config.js`, se valida en `validateDocumentData()` antes de escribir y se persiste como campo personalizado del `Documento`, sin nueva clave ni esquema; las métricas siguen leyendo solo «Cerrado ganado», el conjunto activo y `pendingStates`, por lo que el estado nuevo no altera cifras. No hay dependencias nuevas ni violaciones de la constitución.

## Estructura del Proyecto

### Documentación (esta funcionalidad)

```text
specs/001-erp-base-module/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Código Fuente (raíz del repositorio)

```text
src/
├── main.js
├── styles.css
├── auth.js           (sesión por botón, expiración y usuarios locales)
├── storage.js
├── app.js
├── module-config.js
├── auth/
│   └── permissions.js (matriz de rangos → acciones y `can`/`assertPermission`)
├── utils/
│   ├── entity-date.js   (regla `entityDate`, fecha local y temporizador de medianoche)
│   ├── field-formats.js (formatos declarativos: `cl-rut`, `phone`, `email`, `nonEmpty`)
│   ├── field-rules.js (reglas declarativas por campo, visibilidad, búsqueda y grupos)
│   ├── sanitize.js (escape de texto y atributos para contenido persistido)
│   ├── search.js (normalización y coincidencias sobre campos visibles)
│   ├── marketing-stats.js (agregaciones puras: tarjetas del panel, embudo por estados de documento)
│   ├── marketing-config.js (validación del bloque `marketing` y sus definiciones)
│   ├── capture-prospect.js (captura pública con consentimiento y versión del aviso)
│   ├── marketing-automation.js (reglas por evento, campañas y ejecuciones)
│   ├── marketing-stage.js (transiciones internas de `estado_comercial`)
│   ├── marketing-social.js (interacciones de redes como `Documento`)
│   ├── marketing-chat.js («Dudas y consultas»: FAQ, respuestas rápidas y consultas de seguimiento)
│   ├── sales-team-metrics.js (real mensual y objetivo mensual derivados)
│   ├── marketing-campaigns.js (campañas, atribución, acciones y solapamientos)
│   ├── marketing-performance.js (indicadores globales y por campaña)
│   ├── postventa.js (discriminador de tickets, agregaciones y validaciones puras del formulario)
│   └── lost-reason.js (regla pura del motivo obligatorio en cierres perdidos de prospectos)
└── components/
    ├── shell.js        (marco del espacio de trabajo: barra superior, logotipo SVG, barra lateral con iconos SVG monocromáticos, estado de módulo activo)
    ├── dashboard.js    (vista de inicio: tres acciones rápidas en una fila con jerarquía visual + tarjetas en vivo; opción para ocultar solo las acciones rápidas en Marketing)
    ├── entity-form.js  (formulario de creación/edición de entidades con campos personalizados)
    ├── document-form.js (formulario de creación/edición de documentos con campos personalizados y ciclo de vida de estados)
    ├── entity-detail.js (ficha de entidad: datos de la entidad + sus documentos asociados ordenados por fecha; Historia de Usuario 3)
    ├── commercial-summary.js (resumen de indicadores: totales de entidades/documentos y documentos pendientes por entidad; Historia de Usuario 6)
    ├── marketing.js    (vista de Marketing: datos del panel, cinco atajos de sección ordenados, equipo, campañas, rendimiento, Dudas y consultas y redes; Historias de Usuario 16-21)
    ├── capture-form.js (formulario público autónomo con consentimiento, «Dudas y consultas» y creación de prospecto)
    ├── marketing-social.js (registro y consulta de interacciones en redes)
    ├── marketing-chat.js   («Dudas y consultas»: preguntas frecuentes, respuestas rápidas y consultas de seguimiento)
    ├── login.js            (pantalla de inicio de sesión sin marco ERP; rutas públicas de captura y «Dudas y consultas»)
    ├── users-admin.js      (alta, edición, desactivación y asignación de rango solo para Nivel 4)
    ├── postventa.js        (vista de Postventa: «Nuevo Ticket», tarjetas, tabla y cambios de estado)
    ├── ticket-form.js      (único formulario de «Nuevo Ticket», renderizado dentro del panel en línea de Postventa)
    └── client-quick-view.js (consulta rápida de solo lectura del cliente con compras, historial y tickets permitidos)

tests/
├── unit/          (incluye entity-date, validación de rango, marketing-stats y postventa)
├── integration/   (incluye etiqueta, min/max, cambio de día, marketing, captura pública, postventa, panel en línea del ticket, cancelación con cambios, tres acciones rápidas del panel, iconos SVG de navegación, jerarquía visual, login por botones, consulta rápida, alertas de ticket y cierre perdido)
└── setup/
```

**Decisión de Estructura**: Una aplicación Vite con un único punto de entrada HTML, módulos JavaScript separados por responsabilidad y CSS en un archivo. Se usará localStorage para la persistencia de modo que la aplicación funcione sin backend y sin dependencias de ejecución añadidas. Los componentes se dividen en pares de entidad (datos maestros) y documento (transaccional) que reflejan los dos conceptos centrales del módulo base, de modo que un módulo personalizado pueda renombrar o extender cada par de forma independiente. `shell.js` posee el marco del espacio de trabajo ERP — un logotipo monograma SVG en línea derivado del nombre del módulo, la barra superior y la barra lateral de módulos — envolviendo todas las vistas para que la marca y la navegación se rendericen desde una sola definición compartida. `dashboard.js` renderiza los botones de acción rápida y las tarjetas de estadísticas de la pantalla de entrada, leyendo los recuentos del almacenamiento cada vez que se vuelve visible. `entity-detail.js` renderiza la ficha de una entidad seleccionada (desde búsqueda o resumen) junto con su historial de documentos ordenado por fecha, reflejando los cambios hechos en la pantalla de gestión. `commercial-summary.js` agrega en memoria los recuentos de entidades, documentos y documentos pendientes (según el `statusLifecycle` configurado) y permite seleccionar una entidad para abrir su ficha de detalle; ambos son comportamiento genérico del módulo base, no exclusivo de un perfil CRM. `module-config.js` centraliza todos los puntos de adaptación — nombre del módulo, etiquetas de términos, definiciones de campos personalizados, ciclo de vida de estados, regla opcional `entityDate` y color de acento — manteniendo la personalización del dominio fuera del código central; el estilo se controla mediante propiedades personalizadas de CSS (tokens de diseño) en `styles.css` para que el color de acento configurado se aplique globalmente. `utils/entity-date.js` resuelve la regla activa a `{ label, min, max }`, calcula `localToday` con getters locales y programa el siguiente cambio de día; los componentes solo consumen ese resultado y `storage.js` aplica el mismo rango al validar escrituras, de modo que la interfaz y la persistencia no puedan divergir.

**Decisión adicional (sesión 2026-11-23, segunda tanda)**: Las reglas del perfil de clientes se expresan con mecanismos genéricos del módulo base, no con código específico de cliente. `fieldRules` gana visibilidad, generación, unicidad, obligatoriedad, formato, condición (`when`) y pertenencia a grupo (`group`); `detailPolicy.entity.blockWhenInvalid` bloquea la ficha de registros no completos; `entityDate.required` hace obligatoria la fecha sin afectar otros perfiles. Los componentes de formulario, lista, ficha, buscador y selectores consultan esas reglas, y `src/utils/field-formats.js` centraliza los formatos sin dependencias nuevas. El perfil CRM deja de declarar `pedidos` y añade los campos de contacto por canal.

**Decisión adicional (sesión 2026-11-23, tercera tanda)**: La presentación también se declara en la configuración. Un `order` numérico opcional ordena las casillas del formulario sin acoplar el componente al perfil CRM; `placeholder` proporciona pistas grises por campo y las opciones `select` aceptan `{ value, label }` para mostrar «Llamada» y seguir guardando `llamada`. El título «Nuevo Cliente» se deriva del término configurado sin género gramatical fijo. `rubro` conserva su clave y pasa a `select` con las diez opciones definidas; `rut` reutiliza `normalizeClRut` para formato y unicidad. Ninguna de estas decisiones introduce almacenamiento nuevo ni cambia las condiciones `when` existentes.

**Decisión adicional (cuarta tanda)**: Marketing se implementa como una vista más despachada por `renderCurrentView()` en `app.js`, con dos componentes nuevos (`marketing.js` y `capture-form.js`) y una utilidad pura de agregación. El campo `estado_comercial` se declara en `customFields.entity` y `fieldRules.entity`, y las reglas de automatización en un bloque `marketing` opcional validado por `validateConfig`; sin ese bloque el comportamiento base no cambia. Clientes e Interacciones salen de `NAV_ITEMS`, el panel gana una acción rápida para gestión de documentos y Marketing pasa a ser una entrada de la barra lateral. Ninguna de estas decisiones añade dependencias ni modifica la forma persistida de entidades y documentos.

**Decisión adicional (séptima tanda)**: Marketing reutiliza `computeDashboardStats()`/`marketing-stats.js` para mostrar las mismas tarjetas y el mismo embudo del panel, sin duplicar fórmulas. Equipos, redes, «Dudas y consultas» y campañas se añaden como vistas y utilidades dentro del mismo bloque `marketing` de configuración: `salesTeams`, `faq` y `campaigns`; el rendimiento se calcula a partir de los registros existentes. El campo opcional `campaña` se declara como personalizado de entidad y documento; los documentos de redes, dudas y consultas, seguimiento y ejecución ya son `Documento`, por lo que no hay esquema nuevo. `runAutomationRules()` incorpora `campaignId`, acciones internas y desempate por fecha de creación, manteniendo un único historial por entidad.

**Decisión adicional (octava tanda, 2026-11-24)**: El panel mantenía sus cinco acciones rápidas en esa tanda —posteriormente reducidas a tres por la decisión actual— y Marketing deja de renderizarlas mediante una opción de `renderDashboardHtml()` que solo suprime el bloque `.quick-actions`; las tarjetas y el embudo siguen compartiendo la misma fuente. `marketing.js` sustituye su tabla de secciones por cinco entradas ordenadas —`team`, `campaigns`, `performance`, `chat` y `social`— con etiquetas visibles «Equipos de ventas y logros», «Campañas», «Rendimiento de campañas», «Dudas y consultas» y «Redes sociales». El componente compartido de «Dudas y consultas» y el error de consentimiento usan la nueva etiqueta visible, pero `data-section="chat"`, `#chat-form`, `.chat-*`, `canal: 'chat'`, `ChatConsentError`, nombres de archivo y funciones permanecen iguales. La única superficie nueva de pruebas es de integración: ausencia de `.quick-actions` en Marketing, orden y texto de los cinco atajos, y etiquetas en captura pública y Marketing.

**Decisión adicional (octava tanda, revisada el 2026-11-27)**: La autenticación se separa en `src/auth.js` y `src/auth/permissions.js` para que la identidad, la sesión y la matriz no queden repartidas entre componentes. `src/auth.js` usa `localStorage` con `erp_users` y `erp_session`, resuelve `login(userId)` desde un botón y controla la expiración por inactividad; no guarda contraseñas ni bloquea por intentos. `src/auth/permissions.js` define la tabla rango → acción y expone `can()`/`assertPermission()`; `app.js`, `shell.js`, `dashboard.js` y `storage.js` consultan esa única tabla, por lo que ocultar controles nunca es la única protección. `src/components/login.js` y `src/components/users-admin.js` son las dos vistas nuevas: la primera sin marco ERP y la segunda accesible solo desde el menú del usuario del Gerente, sin entrada en la barra lateral. Los usuarios semilla permiten verificar de inmediato los cuatro rangos y el visitante.

**Decisión adicional (sesión 2026-11-26, Postventa)**: Postventa se añade como quinta entrada de `NAV_ITEMS` y como ruta `?view=postventa`, sin tocar los cinco atajos internos de Marketing. Los tickets reutilizan `Documento` con `entity_id` de un cliente ya existente y se distinguen por el campo `ticket`; sus opciones y estados se declaran en un bloque opcional `postventa` de `MODULE_CONFIG`, con `transitions` vacío para permitir cualquier cambio entre «Abierto», «En revisión» y «Resuelto». `src/utils/postventa.js` centraliza la validación y las tres agregaciones en una sola pasada, y `src/components/postventa.js` reutiliza el marco de tarjetas y tablas existente. `src/auth/permissions.js` gana `postventa:view`, `postventa:view_own`, `postventa:create` y `postventa:transition`; `src/storage.js` los comprueba en `createTicketDocument()`, `changeTicketStatus()` y `listTicketDocuments()`, de modo que N1 pueda crear y reabrir sin heredar `document:edit_any` y N2 quede limitado a sus clientes. No hay nueva clave de `localStorage`, dependencia externa ni esquema relacional.

**Decisión adicional (sesión 2026-11-26, Postventa en línea y panel simplificado)**: «Nuevo Ticket» conserva un formulario en línea dentro de `?view=postventa` usando el estado local `state.ticketFormOpen` ya presente en `app.js`: al abrirlo, el cuerpo de `renderPostventaHtml()` sustituye la tabla por `renderTicketFormHtml()` y mantiene las tres tarjetas; al guardar o cancelar, se cierra el panel y vuelve la tabla. Se retiran el registro de `ticket-form` en `ROUTE_VIEWS`/`VIEW_ROUTES`, el `window.open(..., '_blank', 'noopener')` y el listener `storage` de sincronización; `src/components/ticket-form.js` sigue siendo el único markup del formulario y ahora usa las clases `.form-field`, `.client-form-section` y `.form-actions` compartidas con «Nuevo Cliente» para igualar tarjetas, etiquetas, espaciado, colores, pistas grises y botones, sin adoptar sus campos ni validaciones. La cancelación con cambios sin guardar reutiliza la detección de borradores existente y pide confirmación (FR-022). El panel principal elimina `quick-new-entity` y `quick-new-document`, dejando solo «Gestionar clientes», «Gestionar interacciones» y «Buscar registros»; la creación ya está disponible en `renderManageView()`. Las tarjetas mantienen el tamaño de «Resumen» con una regla `.postventa-cards` equivalente a `.summary-cards`, sin tocar `.stat-card` global ni reordenar etiqueta y valor.

**Decisión adicional (sesión 2026-11-27, identidad visual y borrado)**: La barra lateral pasa a iconos SVG monocromáticos de trazo uniforme en lugar de emojis del sistema, conservando `NAV_ITEMS`, etiquetas accesibles y el comportamiento en 640 px o menos. El panel mantiene sus tres acciones rápidas y solo cambia su presentación: fila única, acción principal con relleno del color de acento y acciones secundarias en blanco con borde sutil, sobre fondo `#F8FAFC` con tarjetas `#FFFFFF`. `theme.accentColor` sigue siendo el único punto de personalización cromática y no añade nuevos tokens configurables. En paralelo, la baja definitiva de entidades deja de eliminar documentos en cascada: solo se permite sin registros vinculados y, si los hay, se rechaza con `EntityHasRecordsError` y se ofrece archivar. Estas decisiones no alteran la arquitectura ni los módulos existentes.

**Decisión adicional (sesión 2026-11-27, acceso, consulta rápida, tickets y cierre perdido)**: el login pasa a una grilla de botones derivada de `erp_users`, conservando la sesión y la matriz; no quedan campos ni mensajes de contraseña. La consulta rápida se resuelve con un componente nuevo de solo lectura y estado local, y las alertas de tickets se derivan de los documentos visibles en una sola pasada, sin nueva persistencia. Para el cierre perdido se conserva el estado `cerrado perdido` ya declarado en `statusLifecycle.states` y se añade `customFields.document.motivo_perdida` más un bloque opcional `documentRules.lostReason`; la validación vive en una utilidad pura y se ejecuta desde `validateDocumentData()`, por lo que una llamada directa a `storage.js` tampoco puede guardar el cambio sin motivo. La regla se limita a entidades con `estado_comercial = prospecto` y el estado nuevo no se agrega a agregaciones de ventas, pipeline ni pendientes.

## Seguimiento de Complejidad

Este plan no introdujo violaciones de la constitución. La sesión 2026-11-23 tampoco añade dependencias: reutiliza `Date` nativo, el sistema de configuración existente, la lógica de RUT ya presente en la semilla y el mismo patrón de pruebas Vitest/jsdom. Las contrapartidas registradas son un temporizador de baja frecuencia (una vez al día) para mantener el límite visible actualizado, y una capa declarativa adicional (`fieldRules`/`detailPolicy`) que se resuelve en un único punto y no modifica el comportamiento de los módulos que no la declaran. El bloqueo de ficha reutiliza el validador de guardado, por lo que no añade una segunda fuente de verdad. La tercera tanda tampoco añade dependencias: `order`, `placeholder` y `options` con valor y etiqueta se resuelven en el mismo punto de configuración, las pistas son texto de ejemplo sin persistencia, y la aceptación de dos formatos de RUT aprovecha el normalizador ya existente en `field-formats.js`.

La cuarta tanda mantiene la huella de dependencias en cero: las agregaciones se calculan en una sola pasada sobre los registros ya cargados en memoria; la captura pública reutiliza el mismo `localStorage` y no requiere backend (contrapartida: el `iframe` debe ser del mismo origen); y las reglas de automatización se ejecutan en un único punto de la capa de almacenamiento, registrando cada acción como un `Documento` para no introducir un segundo historial. La retirada de dos entradas de `NAV_ITEMS` exige actualizar las pruebas de integración que navegaban por sus selectores, compensadas con acciones rápidas y con la API `app.navigate()`.

La séptima tanda no añade dependencias: reutiliza el panel como fuente de datos, `Documento` como historial de interacciones y ejecuciones, y reglas declarativas para campañas y respuestas rápidas. La contrapartida principal es que las campañas y «Dudas y consultas» (clave interna `chat`) siguen siendo locales al navegador y no envían mensajes externos, decisión ya registrada en la especificación. El desempate entre campañas solapadas añade una regla determinista para evitar acciones duplicadas sin crear un motor de reglas nuevo.

La octava tanda de Marketing tampoco añade dependencias ni violaciones: introduce una opción booleana en el renderizador compartido y cambia etiquetas visibles. La contrapartida es que el panel y Marketing comparten el componente de tarjetas con distinta configuración de atajos, y que «Dudas y consultas» conserva identificadores internos heredados para no migrar documentos ni romper selectores; ambos puntos quedan cubiertos por pruebas de integración.

La octava tanda de autenticación tampoco añade dependencias: usa `localStorage` para la identidad simulada y la sesión. Su diseño original con hash Web Crypto y bloqueo temporal fue sustituido el 2026-11-27 por botones por usuario activo; la contrapartida registrada es que esta simulación no sustituye la autenticación de servidor requerida para producción, por lo que la sesión guarda solo `userId`, resuelve el rango en cada verificación y documenta la limitación en `research.md` y `contracts/auth.md`. La expiración por inactividad se conserva como medida demostrativa para que el flujo sea verificable sin backend. La denegación de permisos se verifica en UI, enlaces profundos y llamadas a la API de `storage.js` con sesión íntegra, incluidas las realizadas desde consola; no se promete resistencia a edición deliberada de `localStorage`/`erp_session` ni a falsificación de identidad/rango. `createdByUserId` y `assignedUserIdAtSale` conservan atribución histórica aunque el usuario cambie de rango o sea desactivado.

La tanda de Postventa no añade dependencias ni claves de almacenamiento: reutiliza `Documento`, `customFields.document`, el marco de tarjetas y la matriz de permisos existente. La contrapartida es que la nota de resolución y la prioridad viven en la configuración activa, por lo que las pruebas deben verificar tanto la forma declarada como el texto exacto de validación; y que las acciones `postventa:*` son aditivas a las de Marketing, sin ampliar `document:create` ni `document:edit_any`. La agregación en una sola pasada evita contadores derivados persistidos, y la denegación se comprueba en la capa de datos para enlaces profundos y llamadas directas.

El incremento de Postventa en línea tampoco añade dependencias ni claves: reutiliza el mismo documento HTML, el estado local ya declarado, el componente de formulario existente y las clases de presentación del formulario de clientes. La contrapartida es que el panel comparte el ciclo de renderizado de Postventa, por lo que la cancelación con cambios sin guardar debe apoyarse en la detección de borradores ya existente; retirar `window.open`, la ruta `ticket-form` y el listener `storage` elimina la sincronización entre pestañas sin añadir nuevo estado persistido. El cambio de tamaño sigue siendo solo CSS con ámbito propio, sin afectar a las tarjetas del panel ni de Marketing.

El incremento de identidad visual y borrado no añade dependencias ni claves: reutiliza `shell.js`, `dashboard.js`, `styles.css` y la comprobación de registros ya disponible en la capa de almacenamiento. La contrapartida es que la jerarquía de botones depende del color de acento configurado, por lo que el valor inválido debe seguir resolviéndose al integrado; y que el bloqueo de borrado exige comprobar los documentos vinculados antes de cualquier escritura, sin borrar nada cuando la operación se rechaza.

El incremento de acceso, consulta rápida, tickets y cierre perdido no añade dependencias ni claves de almacenamiento. La contrapartida principal es que el orden de los botones de login depende del orden de creación en `erp_users` y debe hacerse estable con los cuatro usuarios semilla primero; que la consulta rápida y las alertas recalculan desde el arreglo en memoria en cada vista, evitando contadores persistidos pero exigiendo una sola pasada; y que la regla de cierre perdido añade una validación condicional a `validateDocumentData()`, con una utilidad pura compartida por formulario y capa de datos para no duplicar opciones ni mensajes.

## Revisión de la Lista de Verificación Pendiente

Los cuatro elementos marcados como pendientes en `checklists/requirements.md` se revisaron el 2026-11-24: «Sin detalles de implementación», «Escrita para partes interesadas no técnicas», «Los criterios de éxito son agnósticos a la tecnología» y «No hay filtración de detalles de implementación». Se aceptaron por instrucción del usuario porque las referencias técnicas (`storage.js`, `localStorage`, `select`, `permissions:edit`) y la estructura de archivos concreta se solicitaron explícitamente, y SC-003 es una prueba de usabilidad no automatizable. Esta decisión no bloquea la implementación: los detalles se concentran en `plan.md` y en los contratos de Phase 1, mientras que la especificación conserva los escenarios de usuario y los criterios medibles como fuente funcional.

## Change Log

| Fecha      | Cambio                                                                                                                                                                                                                                             | Razón                                                                                                                                       |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-26 | «Nuevo Ticket» vuelve a ser un panel en línea en `?view=postventa`; se retiran `?view=ticket-form`, `window.open` y el listener `storage`; el formulario adopta la presentación de «Nuevo Cliente» y la cancelación con cambios pide confirmación. | Clarificación del usuario: el formulario debe abrirse en la misma página de Postventa y conservar la apariencia del formulario de clientes. |
| 2026-11-26 | El panel principal queda con tres acciones rápidas; «Nuevo Cliente» y «Nueva interacción» se eliminan del panel y su creación pasa a «Gestionar clientes» y «Gestionar interacciones».                                                             | Clarificación del usuario: simplificar el panel principal sin perder las acciones de creación dentro de las gestiones.                      |
| 2026-11-26 | Se actualizan `research.md`, `data-model.md`, `contracts/postventa.md`, `contracts/marketing.md`, `contracts/entity-storage.md` y `quickstart.md` para reflejar ambas decisiones.                                                                  | Alinear Phase 0/Phase 1 con la especificación aclarada antes de regenerar tareas.                                                           |
| 2026-11-27 | Se actualizan `plan.md` y `data-model.md` con los iconos SVG uniformes de la barra lateral, el fondo `#F8FAFC` con tarjetas `#FFFFFF` y la jerarquía de botones del panel, además del bloqueo de borrado de entidades con registros vinculados. | Reflejar en los artefactos de diseño los cambios recientes de `spec.md` (FR-003, FR-009, FR-038, US14b, US15a) sin alterar la arquitectura. |
| 2026-11-27 | Se planifican login por botones, ficha rápida del cliente, «Abrir Ticket» con alertas en la tabla de clientes y motivo obligatorio para «Cerrado perdido»; se actualizan Phase 0 y Phase 1. | Alinear el plan con las cinco clarificaciones de la sesión 2026-11-27 antes de regenerar tareas. |
