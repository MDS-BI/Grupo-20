# Modelo de Datos: Módulo Base ERP

**Alcance**: Este documento describe el modelo de datos tal como lo implementa el módulo base (ver `plan.md` — aplicación Vite, sin backend, persistencia en `localStorage` del navegador) y cómo los perfiles CRM, Marketing y Postventa descritos en las Historias de Usuario 2, 3, 5, 6, 7, 11, 16 a 21, 22 y 25 lo reutilizan mediante configuración, sin introducir una estructura de almacenamiento distinta.

Para la forma exacta de los campos y las operaciones de almacenamiento, ver `contracts/entity-storage.md`, que es la fuente autoritativa; este documento resume las relaciones y la extensión vía configuración.

## 1. Entidades Base

### 1.1 `Entidad`

Registro de datos maestros gestionado por el módulo (FR-001 a FR-007). Persistido como un arreglo de objetos JSON en `localStorage`.

| Campo                     | Tipo                   | Obligatorio         | Notas                                                                                                                                                                                                             |
| ------------------------- | ---------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                      | string                 | Sí                  | Identificador interno único, autogenerado.                                                                                                                                                                        |
| `entity_id`               | string                 | Sí                  | Identificador público único, autogenerado; usado para vincular Documentos.                                                                                                                                        |
| `name`                    | string                 | Sí                  | Nombre de la entidad.                                                                                                                                                                                             |
| `code`                    | string                 | Sí                  | Código de negocio único (comparación sin distinguir mayúsculas ni espacios, FR-001). En el perfil de clientes se genera automáticamente, se guarda en el registro y queda oculto y no buscable (FR-052, FR-055).  |
| `category`                | string                 | No                  | Categoría de clasificación, usada en búsqueda en el perfil base (FR-004). En el perfil de clientes se conserva, pero se oculta y excluye de la búsqueda (FR-051, FR-054, FR-055).                                 |
| `description`             | string                 | No                  | Detalle descriptivo. En el perfil de clientes se conserva, pero se oculta y excluye de la búsqueda (FR-051, FR-054, FR-055).                                                                                      |
| `targetDate`              | string (ISO date)      | No (Sí en clientes) | Fecha objetivo opcional (Historia de Usuario 10). En el perfil de clientes se etiqueta "Fecha de nacimiento", es obligatoria (FR-056) y se restringe según FR-047 a FR-050; la clave de almacenamiento no cambia. |
| `createdAt` / `updatedAt` | string (ISO timestamp) | Sí                  | Marcas de tiempo de auditoría.                                                                                                                                                                                    |
| _(campos personalizados)_ | según configuración    | según configuración | Declarados en `module-config.js`; se persisten junto a los campos base sin cambio de esquema (XR-001, Historia de Usuario 8).                                                                                     |

En el perfil de clientes, los campos personalizados activos son `rubro`, `ejecutivo_asignado`, `canal_contacto`, `rut` y los cuatro campos condicionales de contacto (`contacto_telefono`, `contacto_correo`, `contacto_lugar`, `contacto_whatsapp`). `rubro` conserva su clave de almacenamiento pero se muestra como «Tipo de actividad» y se restringe a un desplegable de diez opciones (FR-066). `pedidos` deja de declararse (FR-053); sus valores antiguos, al igual que los de `category` y `description`, permanecen en el registro sin mostrarse (FR-054).

### 1.2 `Documento`

Registro transaccional vinculado a exactamente una `Entidad` mediante `entity_id` (FR-008, FR-009).

| Campo                     | Tipo                   | Obligatorio         | Notas                                                                                                                                                                                                              |
| ------------------------- | ---------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                      | string                 | Sí                  | Identificador único, autogenerado.                                                                                                                                                                                 |
| `entity_id`               | string                 | Sí                  | Debe coincidir con el `entity_id` de una entidad existente; si no, se rechaza (Historia de Usuario 1, Historia de Usuario 11).                                                                                     |
| `startDate`               | string (ISO date)      | No                  | Fecha de inicio opcional; cuando se provee junto a `endDate`, `endDate` debe ser igual o posterior (Historia de Usuario 11).                                                                                       |
| `endDate`                 | string (ISO date)      | No                  | Fecha de fin opcional; no puede ser anterior a `startDate`.                                                                                                                                                        |
| `notes`                   | string                 | No                  | Notas o descripción libres del documento.                                                                                                                                                                          |
| `status`                  | string                 | No                  | Texto libre por defecto (FR-031); si `module-config.js` declara `statusLifecycle`, el valor queda restringido a transiciones válidas (FR-030, Historia de Usuario 13).                                             |
| `motivo_perdida`          | string                 | Condicional         | Campo personalizado del perfil CRM. Obligatorio solo cuando `status = cerrado perdido` y la entidad vinculada tiene `estado_comercial = prospecto`; se guarda con el documento y aparece en el historial (FR-113). |
| `createdAt` / `updatedAt` | string (ISO timestamp) | Sí                  | Marcas de tiempo de auditoría.                                                                                                                                                                                     |
| _(campos personalizados)_ | según configuración    | según configuración | Declarados en `module-config.js` (Historia de Usuario 8).                                                                                                                                                          |

**Integridad referencial**: la eliminación definitiva de una `Entidad` solo se permite cuando no tiene `Documento` ni registros comerciales vinculados, tras confirmación explícita. Si existen registros vinculados por `entity_id`, la operación se bloquea con `EntityHasRecordsError`, no se mutan `erp_entities` ni `erp_documents` y se ofrece archivar la entidad para conservar su historial. Por tanto, borrar una entidad no elimina sus documentos en cascada (FR-003, FR-009, FR-103).

### 1.3 `ModuleConfig`

Objeto de adaptación cargado desde `src/module-config.js` al arrancar (Historia de Usuario 5). No se persiste en `localStorage`; vive en código fuente de cada módulo adaptado.

| Campo                                                             | Tipo            | Notas                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `moduleName`                                                      | string          | Nombre mostrado en la barra superior y el panel (FR-036).                                                                                                                                                                                                                                                                  |
| `labels`                                                          | object          | Mapeo de términos (p. ej. `entity → "Cliente"`, `document → "Interacción"`) (FR-029, Historia de Usuario 7).                                                                                                                                                                                                               |
| `customFields.entity` / `customFields.document`                   | array           | Definiciones de campos personalizados por tipo de registro (FR-026 a FR-028, FR-040, Historia de Usuario 8).                                                                                                                                                                                                               |
| `statusLifecycle`                                                 | object \| null  | Estados permitidos y transiciones válidas para `Documento.status` (FR-030, FR-031, Historia de Usuario 13).                                                                                                                                                                                                                |
| `entityDate`                                                      | object \| null  | Regla opcional para el campo base `targetDate`: `{ label, min, max, required }`. `max: "localToday"` se resuelve en tiempo de ejecución a la fecha local del dispositivo; `required: true` solo en el perfil de clientes. Ausente en perfiles no-clientes. (FR-047 a FR-050, FR-056).                                      |
| `fieldRules.entity` / `fieldRules.document`                       | object          | Reglas declarativas por clave de campo: `hidden`, `searchable`, `required`, `generated`, `unique`, `format`, `normalize`, `when`, `group`. Aplica a campos base y personalizados; ausente = comportamiento base (FR-051 a FR-055, FR-057, FR-059 a FR-061).                                                                |
| `detailPolicy.entity`                                             | object          | `{ blockWhenInvalid: true, offerEditAction: true }` en el perfil de clientes; bloquea la ficha de registros incompletos y ofrece editarlos (FR-058).                                                                                                                                                                       |
| `documentRules.lostReason`                                        | object \| null  | Regla opcional del perfil CRM: `{ status, entityStateField, entityState, customField, options }`. Hace obligatorio el motivo en documentos de prospectos que pasan a «Cerrado perdido» (FR-113).                                                                                                                           |
| `placeholder` / `order` (en definiciones de campo o `fieldRules`) | string / number | Pista gris de ejemplo y posición opcional del campo en el formulario; no cambian el valor almacenado (FR-062, FR-065, FR-067).                                                                                                                                                                                             |
| `options` (en campos `select`)                                    | array           | Cadenas u objetos `{ value, label }`; la etiqueta se muestra y el valor se persiste, de modo que «Llamada» guarda `llamada` (FR-063).                                                                                                                                                                                      |
| `marketing`                                                       | object \| null  | Bloque opcional con `privacyNoticeVersion`, `captureFields`, `automationRules`, `salesTeams`, `faq` y `campaigns`; ausente = sin comportamiento de Marketing (FR-068 a FR-093).                                                                                                                                            |
| `theme.accentColor`                                               | string          | Color de acento opcional (`#1D4ED8` en el perfil CRM), aplicado a la barra superior, al elemento activo de la barra lateral, al botón principal del panel y a los acentos de tarjetas KPI; el área de trabajo usa fondo `#F8FAFC` y tarjetas `#FFFFFF`, con iconos SVG monocromáticos uniformes en la navegación (FR-038). |

Una configuración ausente, inválida o conflictiva hace que el sistema arranque con los valores predeterminados integrados (Entidad/Documento, sin campos personalizados, sin ciclo de vida) y muestre una advertencia visible (FR-024, FR-025).

### 1.4 Presentación del marco y del panel

Los botones de módulo (`NAV_ITEMS`: Panel, Buscar, Resumen, Marketing y Postventa) se renderizan con iconos SVG monocromáticos de trazo uniforme y nombres accesibles, sin emojis del sistema, tanto expandidos como contraídos (US14b, FR-012, FR-039). El área de trabajo usa fondo `#F8FAFC` y tarjetas `#FFFFFF` con borde sutil y sombra ligera; `theme.accentColor` tiñe la barra superior, el módulo activo, la acción rápida principal y los acentos de KPI, con retorno al valor integrado si es inválido (FR-038). Las tres acciones rápidas del panel se alinean en una sola fila: «Gestionar clientes» con relleno sólido del color de acento y «Gestionar interacciones» y «Buscar registros» con fondo blanco y borde sutil (US15a, FR-033, FR-035). Estas decisiones son solo de presentación: no añaden campos, claves de `localStorage` ni nuevas acciones canónicas.

## 2. Perfil CRM (Historias de Usuario 2, 3, 5, 6, 7)

El perfil CRM ilustrado en la especificación **no introduce entidades nuevas**: reutiliza `Entidad` y `Documento` vía `module-config.js`, de la misma forma que cualquier módulo personalizado (XR-001, XR-002).

| Concepto CRM                                         | Se implementa como                                                                                                                                                        | Configuración relevante                                                                                                                                                  |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Cliente                                              | `Entidad`                                                                                                                                                                 | `labels.entity = "Cliente"`                                                                                                                                              |
| Interacción / llamada / seguimiento                  | `Documento`                                                                                                                                                               | `labels.document = "Interacción"`; campo personalizado `interactionType` (texto/selección: llamada, correo, reunión); `Documento.status` gobernado por `statusLifecycle` |
| Estado de un seguimiento                             | `Documento.status`                                                                                                                                                        | `statusLifecycle` con estados p. ej. `pendiente → en_progreso → completado`, más `atrasado`                                                                              |
| Ficha de cliente (Historia de Usuario 3)             | Vista de detalle de `Entidad` + sus `Documento` asociados, ordenados por fecha (FR-041, FR-042, FR-043)                                                                   | N/A (comportamiento base, no requiere configuración)                                                                                                                     |
| Resumen de Gestión Comercial (Historia de Usuario 6) | Agregación en memoria sobre `Entidad`/`Documento` almacenados: total de entidades, total de documentos, documentos pendientes agrupados por `entity_id` (FR-044 a FR-046) | Usa el `statusLifecycle` configurado para determinar el estado "pendiente"; sin ciclo de vida, compara el estado normalizado (minúsculas y recorte) con "pendiente"      |
| Fecha de nacimiento del cliente (sesión 2026-11-23)  | `Entidad.targetDate` con validación de rango y obligatoria                                                                                                                | `entityDate: { label: "Fecha de nacimiento", min: "1910-01-01", max: "localToday", required: true }`                                                                     |
| Código del cliente                                   | `Entidad.code` generado, guardado y oculto                                                                                                                                | `fieldRules.entity.code = { generated: { strategy: "prefixSequence", prefix: "CLI-", pad: 3 }, unique: true, hidden: true, searchable: false }`                          |
| Campos retirados del cliente                         | `Entidad.category`, `Entidad.description` y el valor heredado de `pedidos`; se conservan sin mostrar                                                                      | `fieldRules.entity.category/description = { hidden: true, searchable: false }`; `pedidos` se elimina de `customFields.entity`                                            |
| RUT del cliente                                      | `Entidad.rut` (campo personalizado)                                                                                                                                       | `required: true`, `format: "cl-rut"`, `unique: true`, `normalize: "cl-rut"`; acepta `12345678-9` y `12.345.678-9`, con pista gris `Ej: 11.111.111-1` (FR-057, FR-062)    |
| Canal de Contacto                                    | `Entidad.canal_contacto` (campo personalizado de selección)                                                                                                               | `required: true`, sin valor preseleccionado; valores `llamada`, `correo`, `reunion`, `whatsapp` con etiquetas «Llamada», «Correo», «Reunión», «WhatsApp» (FR-063)        |
| Dato de contacto adicional                           | Uno de `contacto_telefono`, `contacto_correo`, `contacto_lugar`, `contacto_whatsapp`                                                                                      | `when: { key: "canal_contacto", equals: <opción> }`, `required: true`, `group: "contactDetail"`, `format` según el canal y pista gris por canal (FR-061, FR-067)         |
| Tipo de actividad                                    | `Entidad.rubro` (clave heredada)                                                                                                                                          | `type: "select"`, etiqueta «Tipo de actividad» y diez opciones definidas en FR-066                                                                                       |
| Cliente heredado incompleto                          | Misma `Entidad`, con comprobación de preparación antes de abrir la ficha                                                                                                  | `detailPolicy.entity = { blockWhenInvalid: true, offerEditAction: true }`                                                                                                |

### 2.1 Regla de fecha de entidad

- **Sin `entityDate`**: `targetDate` mantiene el comportamiento base: etiqueta "Fecha objetivo", solo validación de calendario (Historia de Usuario 10).
- **Con `entityDate`**: la etiqueta configurada sustituye a "Fecha objetivo" en formulario, lista, ficha, búsqueda y filtros; el valor debe ser una fecha de calendario válida y cumplir `min <= targetDate <= max`.
- `max: "localToday"` se resuelve cada vez que se calcula la regla usando la fecha local del dispositivo, y se recalcula al cambiar de día sin recargar (FR-048, FR-049).
- Los valores almacenados antes de aplicar la regla que queden fuera del rango no se migran: se muestran igual y `updateEntity()` exige corregirlos antes de guardar cualquier edición (FR-050).

### 2.2 Reglas de campo del perfil de clientes

| Campo                                | Regla de configuración                                          | Efecto en datos e interfaz                                                                                                                                 |
| ------------------------------------ | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `code`                               | `generated`, `unique`, `hidden`, `searchable: false`            | Se genera en `addEntity()`, se conserva en el registro, no se captura ni se muestra en formulario, lista, ficha, selector ni búsqueda.                     |
| `category`, `description`, `pedidos` | `hidden`, `searchable: false` / campo no declarado              | Los valores ya guardados permanecen en `localStorage`; no se renderizan ni influyen en la búsqueda.                                                        |
| `targetDate`                         | `entityDate.required: true`                                     | Debe existir y cumplir el rango; el guardado falla si está vacío.                                                                                          |
| `rut`                                | `required`, `format: "cl-rut"`, `unique`, `normalize: "cl-rut"` | Debe tener dígito verificador válido y no repetirse entre clientes; la comparación ignora puntos, guion, espacios y distingue la `K` de forma consistente. |
| `canal_contacto`                     | `required`, sin preselección                                    | El formulario muestra la opción vacía y el guardado falla hasta elegir una.                                                                                |
| `contacto_*`                         | `when`, `required`, `group: "contactDetail"`, `format`          | Solo se muestra y valida el campo del canal activo; al guardar se descartan los valores de los otros canales.                                              |
| Registro completo                    | `detailPolicy.entity.blockWhenInvalid`                          | Si faltan datos obligatorios o el RUT es inválido, la ficha no se abre y se ofrece editar; al guardar válidamente se desbloquea.                           |
| `rubro`                              | `label: "Tipo de actividad"`, `type: "select"`, diez `options`  | El valor se elige del catálogo; la clave y los valores almacenados no cambian (FR-066).                                                                    |
| Orden                                | `order` por campo                                               | `name` 1, `rut` 2, `targetDate` 3, `canal_contacto` y su campo `contactDetail` 4, `rubro` 5, `ejecutivo_asignado` 6 (FR-065).                              |
| Pistas                               | `placeholder` por campo                                         | Gris y no persistida: `Ej: 11.111.111-1` en `rut`; `Ej: +56 9 1234 5678`, `Ej: nombre@ejemplo.cl` o `Ej: Sala 2 o enlace` según el canal (FR-062, FR-067). |
| Título de creación                   | `Nuevo ${labels.entity}`                                        | «Nuevo Cliente» en el formulario dentro de «Gestionar clientes»; el panel ya no muestra esa acción rápida (FR-033, FR-034, FR-064).                        |

FR-004 es la lista canónica de campos buscables: nombre, código, categoría, descripción, fecha objetivo y campos personalizados visibles declarados en la configuración activa. La búsqueda del perfil de clientes deriva sus campos de estas reglas mediante `fieldRules`/anulación de perfil: solo `name`, `targetDate` y campos personalizados visibles y buscables (FR-020, FR-055); no existe una segunda lista de campos en la vista de búsqueda ni en la persistencia. La utilidad `src/utils/field-formats.js` expone los formatos `cl-rut`, `phone`, `email` y `nonEmpty` sin dependencias externas. La retroalimentación usa los textos exactos de FR-006.

**Nota de diseño**: una versión anterior de este documento describía un esquema relacional (`customers`, `customer_interactions`, `support_tickets`, `sales_opportunities`, `users`) que asumía una base de datos SQL con backend. Ese diseño era incompatible con la arquitectura elegida en `plan.md` (aplicación Vite sin backend, persistencia en `localStorage`, ver `research.md`) y con `contracts/entity-storage.md`, e introducía entidades (`support_tickets`, `sales_opportunities`, `users`) sin respaldo en ninguna historia de usuario o requisito funcional de `spec.md`. Se reemplazó por el modelo de esta sección para mantener un único modelo de datos consistente en toda la funcionalidad. La Postventa de la Historia de Usuario 25 confirma esa decisión: los tickets son `Documento` vinculados a un cliente (sección 9), no registros de `support_tickets`.

## 3. Perfil de Marketing (Historias de Usuario 16 a 21)

Marketing **no introduce entidades nuevas**: usa `Entidad` para prospectos/clientes y `Documento` para interacciones y ejecuciones de automatización (FR-068, XR-001).

### 3.1 Estado comercial de la entidad

| Campo                    | Tipo                        | Obligatorio              | Notas                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------ | --------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `estado_comercial`       | string (opción de `select`) | Sí en Marketing          | Campo personalizado declarado en `customFields.entity`. Valores internos: `prospecto`, `en_proceso`, `en_recontacto`, `ganado`, `perdido`. Valor inicial `prospecto` (FR-068). Etiquetas: «Prospecto», «En proceso», «En recontacto», «Cliente ganado», «Perdido». `ganado` es la conversión de la entidad a Cliente; «Cliente ganado» es su etiqueta visible y no equivale al estado de documento «Cerrado ganado». |
| `consentimiento`         | boolean                     | Sí en la captura pública | Solo se crea un prospecto desde la captura cuando es `true` (FR-071).                                                                                                                                                                                                                                                                                                                                                |
| `consentimiento_fecha`   | string (ISO timestamp)      | Sí en la captura pública | Fecha y hora en que se marcó el consentimiento.                                                                                                                                                                                                                                                                                                                                                                      |
| `consentimiento_version` | string                      | Sí en la captura pública | Copia de `marketing.privacyNoticeVersion` aceptada.                                                                                                                                                                                                                                                                                                                                                                  |

Conversión a Cliente (FR-068): al pasar `estado_comercial` de cualquier estado a `ganado`, la misma `Entidad` conserva `id`, `entity_id`, documentos y campos personalizados; no se crea un registro nuevo ni se migra información. El resultado se denomina «Cliente ganado» cuando debe mostrarse al usuario; «Cerrado ganado» sigue siendo un estado de `Documento`.

### 3.2 Fuente de las tarjetas y del embudo

Marketing ya no usa `estado_comercial` para sus tarjetas ni muestra la torta «Estado comercial de la cartera». Las cinco tarjetas y el embudo se derivan de `Entidad` y `Documento` con las mismas reglas del panel principal (FR-072 a FR-075). `estado_comercial` se conserva únicamente como dato interno de la automatización.

### 3.3 Agregaciones derivadas (no persistidas)

`computeMarketingStats({ entities, documents })` calcula en memoria, sin escribir en `localStorage`:

| Salida           | Definición                                                                                                                                                                                      |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `totalEntities`  | Conteo de entidades activas, sin `archivedAt` (FR-035, FR-103).                                                                                                                                 |
| `totalDocuments` | Conteo de documentos vinculados a entidades activas; se excluyen los de entidades archivadas (FR-035, FR-103).                                                                                 |
| `closedWon`      | Conteo de documentos con `normalizeText(status) === 'cerrado ganado'` vinculados a entidades activas; no es un importe (FR-035).                                                              |
| `conversionRate` | `closedWon / totalEntities * 100`; cero cuando `totalEntities = 0`. Es la proporción de documentos ganados sobre entidades activas, igual que en el panel (FR-035).                             |
| `pipeline`       | Suma de `importe` de los documentos «Cerrado ganado» vinculados a entidades activas, expresada en USD; un importe ausente cuenta como cero (FR-035, FR-125).                                   |
| `funnel`         | Conteo y porcentajes por estado de documento de las entidades activas, idénticos al embudo del panel (FR-035, FR-074, FR-103).                                                                 |

Todos los importes de estas tarjetas y de cualquier agregación de Marketing se expresan en USD. Si la configuración declara un campo «Moneda», solo se acepta `USD`: otro valor se rechaza con un error visible y no crea ni modifica el documento; no se aplica conversión entre monedas (FR-125).

Al derivarse de los registros almacenados, cualquier creación, edición o eliminación se refleja al volver a consultar la vista sin recarga (FR-074).

### 3.4 Reglas de automatización

`marketing.automationRules` es un arreglo opcional de objetos `{ event, from, to, action, label }`:

| Campo         | Tipo           | Notas                                                                                                                  |
| ------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `event`       | string         | `entity_created`, `stage_changed` o `document_created` (FR-070).                                                       |
| `from` / `to` | string \| null | Estados comercial origen/destino; `from` solo en `stage_changed`, `to` opcional.                                       |
| `action`      | string         | `create_document` (crea un `Documento` en el historial de la entidad) o `notify` (registra el aviso en ese historial). |
| `label`       | string         | Texto legible mostrado en el historial y en mensajes.                                                                  |

Cada ejecución se persiste como un `Documento` con `notes = label`, `status = 'automatico'`, `entity_id` de la entidad afectada, `automation_key = event|from|to|label`, `campaña` opcional y `campaignId` cuando proviene de una campaña. La clave evita repetir ejecuciones ya registradas. Por tanto, el historial de la ficha ya existente muestra la automatización sin un almacén adicional. Con `marketing` ausente o sin reglas ni campañas, no se ejecuta ninguna acción.

### 3.5 Navegación

Clientes e Interacciones no figuran en la barra lateral; Marketing sí es la cuarta opción de `NAV_ITEMS` en `src/components/shell.js`. El estado de la vista (`state.view`) sigue siendo en memoria y no se persiste; la ruta se resuelve desde `location.search` en cada carga, Back/Forward y recarga: sin parámetro es Panel, `?view=capture` es pública y no existe `?view=panel`. La captura pública no altera datos hasta que se envía el formulario. «Dudas y consultas» aparece tanto en la captura pública como en Marketing usando los mismos documentos; su identificador interno sigue siendo `chat`.

Marketing no renderiza los botones de acción rápida del panel: solo ofrece cinco atajos de sección en este orden —«Equipos de ventas y logros», «Campañas», «Rendimiento de campañas», «Dudas y consultas» y «Redes sociales»—, derivados de claves internas estables `team`, `campaigns`, `performance`, `chat` y `social` (FR-091 a FR-093, SC-027 a SC-029). El panel ofrece exactamente tres acciones rápidas —«Gestionar clientes», «Gestionar interacciones» y «Buscar registros»—; la creación de clientes e interacciones ocurre dentro de las respectivas pantallas de gestión (FR-033, FR-034).

## 4. Equipos de ventas y logros

`marketing.salesTeams` es un arreglo opcional de equipos y sirve de semilla. Cada equipo y sus integrantes se capturan en la interfaz y las definiciones editadas se guardan en `erp_marketing_config`; las métricas se calculan, no se persisten.

| Objeto                | Campo             | Tipo           | Notas                                                                                                                                         |
| --------------------- | ----------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Equipo                | `name`            | string         | Nombre editable del equipo (FR-076).                                                                                                          |
| Equipo                | `integrantes`     | array          | Lista editable de integrantes.                                                                                                                |
| Integrante            | `name`            | string         | Nombre editable del integrante (FR-077).                                                                                                      |
| Integrante            | `role`            | string         | Cargo editable del integrante (FR-077).                                                                                                       |
| Integrante            | `active`          | boolean        | Estado «Activo»/«Inactivo» editable (FR-077).                                                                                                 |
| Integrante            | `userId`          | string \| null | Usuario activo vinculado de rango Nivel 2 o Nivel 4; obligatorio desde la octava tanda (FR-099, FR-100).                                      |
| Integrante (derivado) | `realMensual`     | number         | Suma de importes en USD de documentos «Cerrado ganado» del mes vinculados a entidades activas atribuidas al `userId` (FR-078, FR-100, FR-125). |
| Integrante (derivado) | `objetivoMensual` | number         | `realMensual / díasTranscurridos * díasDelMes`, en USD; cero sin ventas o sin días transcurridos (FR-079, FR-125).                            |

La relación se resuelve por el `userId` del usuario activo vinculado, no por el texto visible del integrante; el campo `ejecutivo_asignado` de las entidades guarda ese mismo identificador. Cuando el documento conserva `assignedUserIdAtSale`, la atribución usa ese valor y, en su defecto, el «Ejecutivo Asignado» vigente (FR-078, FR-079). No se crea una entidad separada para el ejecutivo. Un equipo sin integrantes muestra un estado vacío. Los dos importes derivados son USD sin conversión: si una configuración declara «Moneda», solo `USD` es válido y otro valor se rechaza antes de crear o modificar el documento (FR-125).

## 5. Redes sociales y «Dudas y consultas»

| Concepto                                  | Se implementa como                           | Campos/ reglas                                                                                                                                                                                 |
| ----------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Interacción en redes                      | `Documento` vinculado al prospecto o cliente | `plataforma`, `tipo_interaccion`, `nota`, `enlace`, `campaña` opcional, `startDate = fecha` (FR-080, FR-081).                                                                                  |
| Mensaje o consulta de «Dudas y consultas» | `Documento` vinculado al prospecto o cliente | `canal = 'chat'`, `mensaje`, `tipo_interaccion`, `campaña` opcional y marcas de tiempo (FR-081, FR-083). El valor interno `chat` no cambia.                                                    |
| Pregunta frecuente                        | Entrada de configuración `marketing.faq`     | `{ pregunta, respuesta }`; la coincidencia se resuelve sobre texto normalizado (FR-082).                                                                                                       |
| Consentimiento de «Dudas y consultas»     | Campos de la entidad                         | Reutiliza `consentimiento`, `consentimiento_fecha` y `consentimiento_version`; sin consentimiento no se registra el primer mensaje (FR-085). La etiqueta visible usa el nuevo nombre (FR-092). |

Las interacciones se ordenan por fecha en el apartado «Redes sociales» y en la ficha de la entidad. Las consultas sin coincidencia se registran como `Documento` con un acuse visible para el visitante.

## 6. Campañas de marketing

`marketing.campaigns` es un arreglo opcional de campañas y sirve de semilla; las campañas creadas, editadas o detenidas se guardan en `erp_marketing_config` y se gestionan desde Marketing.

| Campo                   | Tipo                   | Notas                                                                                                 |
| ----------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------- |
| `id`                    | string                 | Identificador interno de la campaña.                                                                  |
| `name`                  | string                 | Nombre editable (FR-086).                                                                             |
| `stage`                 | string                 | Estado comercial objetivo (`prospecto`, `en_proceso`, `en_recontacto`, `ganado`, `perdido`) (FR-086). |
| `startDate` / `endDate` | string (ISO date)      | Periodo activo; fuera de él no se ejecutan acciones nuevas (FR-086).                                  |
| `status`                | string                 | `activa` o `detenida`; al detener se conserva el historial (FR-086).                                  |
| `createdAt`             | string (ISO timestamp) | Fecha de creación; desempate ante solapamientos (FR-090).                                             |

Acciones internas permitidas (FR-089): crear un `Documento` de seguimiento, asignar `ejecutivo_asignado` y actualizar `estado_comercial`. Cada ejecución, incluida la omisión por solapamiento, se registra como `Documento` con `campaignId`, fecha, entidad, acción y motivo cuando aplica. No se envían correos, mensajes externos ni publicaciones en redes.

## 7. Rendimiento de marketing

`computeMarketingPerformance({ entities, documents, campaigns })` deriva indicadores sin persistirlos:

| Indicador                  | Definición                                                                                                                                                                                          |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prospectosCapturados`     | Conteo de entidades activas con `estado_comercial = 'prospecto'` o creadas desde la captura; sin `archivedAt` (FR-087, FR-103).                                                                   |
| `conversionesPorEtapa`     | Conteo de entidades activas por cada estado comercial objetivo de campaña; una entidad se cuenta una sola vez por estado (FR-087, FR-088).                                                        |
| `tasaDeConversion`         | `documentos «Cerrado ganado» / entidades activas * 100`, con cero si no hay activas. Usa la misma fuente que FR-035: es proporción de documentos ganados sobre entidades activas, no de entidades con `estado_comercial = 'ganado'` (FR-035, FR-087). |
| `interaccionesRegistradas` | Conteo de documentos de redes y otras interacciones (incluidas ejecuciones de reglas y campañas) vinculados a entidades activas, sin duplicar `id` y sin incluir tickets (FR-087, FR-103).         |
| `consultasRespondidas`     | Conteo de documentos de «Dudas y consultas» (`canal = 'chat'`) con respuesta registrada, contados una sola vez aunque se ejecuten varias veces las respuestas rápidas (FR-082, FR-087).           |
| `ventasGanadas`            | Conteo de documentos «Cerrado ganado» de entidades activas, coincidente con la tarjeta «Cerrado ganado» del panel (FR-035, FR-087).                                                               |

Los seis indicadores se muestran separadamente. Cuando se selecciona una campaña, los indicadores se filtran por el campo `campaña` o `campaignId`; `tasaDeConversion` aplica la misma fórmula al conjunto filtrado y, sin filtro, coincide con la tarjeta del panel. Los registros sin campaña aparecen bajo el grupo «Sin campaña» (FR-088). Una campaña sin registros muestra cero con una explicación clara (SC-026). Cualquier importe usado en estos indicadores se expresa en USD sin conversión (FR-125).

## 8. Autenticación, sesión y permisos

La autenticación es local y simulada (FR-094 a FR-102, US22, US23). No introduce una base de datos ni un servicio externo: persiste en las claves `erp_users` y `erp_session` de `localStorage`. `erp_users` es la fuente de verdad de identidad, rango y estado activo; `erp_session` solo referencia al usuario, de modo que un cambio de rango o una desactivación se refleje en la siguiente acción sin depender de datos copiados en la sesión.

### 8.1 `Usuario`

| Campo                     | Tipo    | Obligatorio | Notas                                                                                                                                  |
| ------------------------- | ------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                      | string  | Sí          | Identificador interno único, autogenerado.                                                                                             |
| `username`                | string  | Sí          | Nombre visible de inicio de sesión y etiqueta del botón, p. ej. `gerente`.                                                             |
| `usernameKey`             | string  | Sí          | `username` recortado y en minúsculas; garantiza unicidad sin distinguir mayúsculas ni espacios (aclaración 2026-11-24, FR-110).        |
| `rank`                    | string  | Sí          | Uno de `n4_manager`, `n3_marketing`, `n2_sales`, `n1_support`; equivale a los rangos de la matriz (FR-094).                            |
| `active`                  | boolean | Sí          | `true` ofrece botón y permite iniciar sesión; `false` retira el botón y revoca la sesión existente (FR-098, FR-102, FR-110).           |
| `createdAt` / `updatedAt` | string  | Sí          | Marcas de tiempo ISO de auditoría; `createdAt` también fija el orden de los botones creados por Gerencia detrás de los cuatro semilla. |

No se persisten `passwordHash`, `salt`, `failedAttempts` ni `lockedUntil`: el inicio de sesión por botones no verifica credenciales ni bloquea por intentos (FR-110). Usuarios semilla demostrativos: `gerente` (Nivel 4), `marketing` (Nivel 3), `ventas` (Nivel 2) y `atencion` (Nivel 1), con etiquetas fijas «Gerente», «Marketing», «Ventas» y «Atención al Cliente». Solo se crean cuando `erp_users` no existe.

### 8.2 `Sesión`

| Campo            | Tipo   | Obligatorio | Notas                                                                                        |
| ---------------- | ------ | ----------- | -------------------------------------------------------------------------------------------- |
| `userId`         | string | Sí          | Referencia a `Usuario.id`; dentro de una sola clave de sesión existe como máximo una sesión. |
| `issuedAt`       | string | Sí          | Marca ISO de creación de la sesión.                                                          |
| `lastActivityAt` | string | Sí          | Marca ISO de la última acción verificada; se actualiza en cada verificación.                 |
| `expiresAt`      | string | Sí          | `lastActivityAt + 8 horas`; al expirar se elimina la sesión y se redirige a login.           |

La sesión no guarda `rank`, `username` ni `active`: esos valores se resuelven desde `erp_users` cada vez que `getCurrentUser()` o `assertPermission()` los necesitan. Por eso un cambio de rango se aplica en la siguiente acción o recarga, y una desactivación cierra la sesión de inmediato (FR-102).

### 8.3 `Rango` y matriz de permisos

`Rango` no se persiste como entidad separada: es una enumeración exportada por `src/auth/permissions.js`. La matriz rango → acción es la única fuente de permisos y replica la tabla y el «Catálogo canónico de acciones» de `spec.md`; no introduce identificadores adicionales:

| Rango                            | Acciones canónicas                                                                                                                                                                                                                | Restricciones clave                                                                                                                                                                        |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Visitante (sin sesión)           | Ninguna acción interna; solo `chat:create_query` en la ruta pública con consentimiento                                                                                                                                            | Sin `panel:view`, `search:view`, `summary:*`, `marketing:*`, `postventa:*`, `team:*` ni `users:manage`. La captura pública se rige por FR-069 y no es una acción de la matriz interactiva. |
| Nivel 1 - Atención al cliente    | `panel:view`, `search:view`, `entity:view_any`, `document:read`, `document:create`, `chat:answer`, `postventa:view`, `postventa:create`, `postventa:transition`                                                                   | No crea ni edita entidades; no elimina; no cambia estados de documento ajenos a Postventa; sin `summary:*`, `marketing:*`, `team:*` ni `users:manage`.                                     |
| Nivel 2 - Ejecutivo de Ventas    | `panel:view`, `search:view`, `entity:view_any`, `entity:create`, `entity:edit_own`, `document:create`, `document:read`, `document:edit_own`, `document:transition_own`, `summary:view_own`, `team:view_own`, `postventa:view_own` | No elimina entidades ni documentos; edita solo donde `ownerId` coincida con su `id`; ve solo tickets de sus clientes; sin `marketing:*` ni `users:manage`.                                 |
| Nivel 3 - Ejecutivo de Marketing | `panel:view`, `search:view`, `entity:view_any`, `document:read`, `document:create`, `document:edit_any`, `document:delete`, `marketing:view`, `marketing:manage`, `team:view_all`, `chat:view`, `chat:answer`, `campaign:create`, `campaign:view`, `campaign:edit_own`, `campaign:stop_own` | `document:create`, `document:edit_any` y `document:delete` solo con contexto `documentType = 'social'` (interacciones de redes de cualquier prospecto o cliente) y `chat:answer` para responder «Dudas y consultas»; no elimina entidades ni toca otros documentos, ventas ni tickets. Sin `document:transition_own`, `summary:*`, `postventa:*` ni `users:manage`; no detiene campañas de otro usuario (`campaign:stop_any`). |
| Nivel 4 - Gerente comercial      | Todas las acciones canónicas excepto `permissions:edit`                                                                                                                                                                           | `permissions:view` solo consulta la matriz; `permissions:edit` se deniega a todos y la matriz no se edita desde la interfaz.                                                               |

`ownerId` identifica al usuario asignado, al creador de la campaña o al integrante vinculado según la acción; `campaignOwnerId` identifica al creador de la campaña. Las acciones con sufijo `_own` fallan si falta el contexto o si el usuario autenticado no coincide. Toda acción no listada se deniega por defecto. `Sistema` es una identidad de auditoría para automatizaciones, no un rango de la matriz ni una opción de inicio de sesión.

### 8.4 Validaciones y transiciones

- `usernameKey` debe ser único entre todos los usuarios; `GERENTE`, `gerente` y `gerente` colisionan.
- `rank` debe pertenecer a la enumeración; un valor desconocido se deniega por defecto.
- `active: false` retira el botón de inicio de sesión, elimina `erp_session` y bloquea nuevos accesos; las entidades e interacciones históricas se conservan.
- Cambiar `rank` no invalida la sesión, pero la siguiente resolución usa el nuevo rango y actualiza la barra superior.
- Pulsar un botón con `active: true` crea una sesión nueva sin verificar contraseña, sin contadores de intentos y sin mensajes «Ingresa una contraseña» ni «Usuario no encontrado».
- Una sesión con `expiresAt <= ahora` se elimina y se trata como «sin sesión».
- «Cerrar sesión», la desactivación y la expiración son las únicas vías de finalización de sesión.
- `assertPermission()` devuelve o lanza el mensaje exacto `No tienes permiso para realizar esta acción`; una vista no permitida muestra «Acceso denegado» y vuelve al Panel, mientras que un visitante sin sesión es redirigido a login.

### 8.5 Relaciones con el resto del modelo

| Relación                                    | Regla                                                                                                                   |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `Usuario.rank` → matriz                     | Determina navegación, botones, vistas y validaciones de `src/storage.js`.                                               |
| `Usuario.id` ↔ `Entidad.ejecutivo_asignado` | El campo guarda el `id` del usuario activo de rango Nivel 2 o Nivel 4; la interfaz muestra su `username`.               |
| `Usuario.id` ↔ `Integrante.userId`          | El real y objetivo mensuales se calculan desde los clientes asignados al usuario vinculado.                             |
| `Sistema` → `Documento` / campaña           | Las automatizaciones se registran como creadas por «Sistema»; el historial de campaña conserva el `Usuario.id` creador. |

La identidad simulada no sustituye la autenticación de servidor requerida para producción; esta limitación ya está declarada en las suposiciones de la especificación.

## 9. Postventa (Historia de Usuario 25)

### 9.1 Decisión de modelo

Un ticket de Postventa **no es una entidad nueva**: es un `Documento` de la sección 1.2 con `entity_id` apuntando al cliente afectado. El campo personalizado `ticket: true` lo distingue del resto del historial; por tanto aparece en la ficha del cliente y comparte la regla de integridad referencial de la sección 1.2: si el cliente tiene tickets u otros documentos vinculados, la eliminación definitiva se bloquea y debe archivarse para conservar el historial; el borrado individual de documentos sigue siendo una operación distinta (FR-003, FR-009, FR-104). No se crea la clave `support_tickets` ni una segunda lista persistida.

### 9.2 Forma de un ticket

| Campo             | Tipo                   | Obligatorio                 | Notas                                                                                                                        |
| ----------------- | ---------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `id`              | string                 | Sí                          | `id` base del `Documento`, autogenerado.                                                                                     |
| `entity_id`       | string                 | Sí                          | `entity_id` de un cliente existente, elegido en el desplegable «Cliente».                                                    |
| `ticket`          | boolean                | Sí                          | Discriminador declarado en `customFields.document`; todo documento con `ticket: true` se trata como ticket de Postventa.     |
| `asunto`          | string                 | Sí                          | Campo personalizado «Asunto».                                                                                                |
| `categoria`       | string                 | Sí                          | Uno de `soporte_tecnico`, `facturacion`, `garantia`, `consulta`; etiquetas visibles definidas en la sección 9.3.             |
| `prioridad`       | string                 | Sí                          | Uno de `baja`, `media`, `alta`; sin valor preseleccionado en el formulario.                                                  |
| `status`          | string                 | Sí                          | Uno de `Abierto`, `En revisión`, `Resuelto`; gobernado por la configuración `postventa`, no por el `statusLifecycle` global. |
| `nota_resolucion` | string                 | Solo si `status = Resuelto` | Campo personalizado «Nota de resolución». Se descarta al guardar en otro estado para no conservar textos obsoletos.          |
| `createdAt`       | string (ISO timestamp) | Sí                          | Marca de auditoría del `Documento`.                                                                                          |
| `updatedAt`       | string (ISO timestamp) | Sí                          | Se actualiza también en cada cambio de estado.                                                                               |
| `createdByUserId` | string \| null         | No                          | Usuario que creó el ticket; `null` si la sesión es «Sistema» o no está disponible.                                           |

`startDate`, `endDate` y `notes` conservan su comportamiento base y no son obligatorios para Postventa. La tabla muestra el cliente, el asunto, la categoría, la prioridad y el estado vigente; el historial de cambios de estado no se persiste como arreglo separado.

### 9.3 Configuración declarativa

```js
postventa: {
  states: ['Abierto', 'En revisión', 'Resuelto'],
  categoryOptions: [
    { value: 'soporte_tecnico', label: 'Soporte técnico' },
    { value: 'facturacion', label: 'Facturación' },
    { value: 'garantia', label: 'Garantía' },
    { value: 'consulta', label: 'Consulta' },
  ],
  priorityOptions: [
    { value: 'baja', label: 'Baja' },
    { value: 'media', label: 'Media' },
    { value: 'alta', label: 'Alta' },
  ],
  transitions: [],
  cardMapping: { abiertos: 'Abierto', enProceso: 'En revisión', resueltos: 'Resuelto' },
  resolutionNoteStates: ['Resuelto'],
}
```

`transitions: []` significa «sin restricción de par»: cualquier estado puede pasar a cualquier otro, incluida la reapertura `Resuelto → Abierto`. Si el bloque `postventa` está ausente, la vista no se registra y el comportamiento base no cambia (XR-001).

### 9.4 Agregaciones derivadas

`computeTicketStats({ documents })` recorre una sola vez los documentos con `ticket: true` y devuelve `{ abiertos, enProceso, resueltos }` según `cardMapping`. Las tarjetas «Tickets abiertos», «En proceso» y «Resueltos» leen esos contadores; no se persisten ni se calculan a partir de `notes` (FR-105). `listTicketDocuments({ documents, entities, user })` devuelve los tickets visibles para el usuario: todos para N1/N4, solo los clientes con `ejecutivo_asignado === user.id` para N2, y ninguno para N3/visitante (FR-106).

### 9.5 Relaciones y permisos

| Relación                                      | Regla                                                                                                                                                |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Ticket.entity_id` → `Entidad.entity_id`      | Obligatoria; el formulario solo ofrece clientes ya registrados y la capa de datos rechaza un `entity_id` inexistente.                                |
| `Ticket` → ficha de entidad                   | Aparece en el historial de documentos de la ficha del cliente.                                                                                       |
| `Ticket.createdByUserId` → `Usuario.id`       | Auditoría de creación; no restringe la visibilidad de N1/N4.                                                                                         |
| `Entidad.ejecutivo_asignado` → visibilidad N2 | Ventas solo ve tickets cuyo cliente tiene asignado su `id`.                                                                                          |
| `postventa:create` / `postventa:transition`   | N1 y N4; N2 solo `postventa:view_own`; N3 y visitante sin acción. Se validan en `createTicketDocument()` y `changeTicketStatus()` antes de escribir. |

Las acciones `postventa:*` se añaden al catálogo canónico sin reutilizar `document:edit_any`, de modo que Atención al Cliente pueda gestionar tickets sin editar otras interacciones. Toda denegación usa `No tienes permiso para realizar esta acción` y no modifica `localStorage`.

### 9.6 Panel en línea y presentación del formulario (2026-11-26)

El formulario de «Nuevo Ticket» sigue produciendo exactamente el `Documento` de la sección 9.2: abrirlo como panel dentro de `?view=postventa` no introduce entidad, campo, estado, ruta ni clave de almacenamiento adicional. La identidad y el rango se resuelven con la sesión ya cargada (`erp_session`, `erp_users`), y `createTicketDocument()` vuelve a comprobar `postventa:create` en la capa de datos. N2, N3 y el visitante reciben la misma denegación que en el resto de Postventa.

| Elemento                            | Persistencia | Regla observable                                                                                                                     |
| ----------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Panel `state.ticketFormOpen`        | Ninguna      | Estado local en memoria; sustituye la tabla por el formulario y mantiene visibles las tres tarjetas (FR-104, SC-039).                |
| Cancelación con cambios sin guardar | Ninguna      | Reutiliza la detección de borradores existente; pide confirmación antes de descartar y solo cierra el panel si se confirma (FR-022). |
| Tamaño de las tres tarjetas         | Ninguna      | Solo CSS con ámbito `.postventa-cards`; no altera etiquetas, valores, orden de nodos ni `computeTicketStats()` (FR-109).             |

El guardado no modifica la forma del documento: `createTicketDocument()` escribe una sola vez en `erp_documents` y el `render()` normal de Postventa recalcula tabla y tarjetas desde el arreglo ya en memoria. No hay `StorageEvent`, `postMessage`, sondeo ni sincronización entre pestañas; retirar el listener `storage` tampoco cambia los datos persistidos. La presentación del formulario reutiliza las clases `.form-field`, `.client-form-section` y `.form-actions` del formulario de entidades para igualar tarjetas, etiquetas, espaciado, colores, pistas grises y botones sin adoptar campos ni reglas de clientes.

## 10. Acceso, consulta rápida, tickets en clientes y cierre perdido (2026-11-27)

### 10.1 Acceso por botones

`erp_users` sigue siendo la única fuente de usuarios y de sus rangos; `erp_session` continúa guardando solo `userId` y marcas de tiempo. No se persisten contraseñas, hashes ni contadores de intentos. La vista de inicio deriva los botones de los usuarios activos: primero los cuatro semilla con etiquetas fijas y después los creados por Gerencia en orden de `createdAt`, sin reordenarse al recargar. Un usuario desactivado deja de ofrecer botón y su sesión se revoca. `login(userId)` crea la misma sesión que antes sin verificar contraseña; el bloqueo por intentos fallidos y los mensajes «Ingresa una contraseña» y «Usuario no encontrado» dejan de existir (FR-102, FR-110).

### 10.2 Consulta rápida del cliente

| Elemento                  | Persistencia | Regla observable                                                                                                                                                      |
| ------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `state.quickViewEntityId` | Ninguna      | Estado local que identifica al cliente de la ventana superpuesta; se abre desde resultados de «Buscar» y desde la tabla «Clientes» (FR-111).                          |
| Ventana de consulta       | Ninguna      | Solo lectura; botones «Cerrar» y «Ver ficha completa». La ficha completa sigue siendo la vista editable y aplica la matriz vigente (FR-041, FR-094).                  |
| Total comprado            | Ninguna      | Suma de importes de documentos «Cerrado ganado» del cliente, sin límite de fechas, expresada en USD; cada compra muestra su `startDate` (FR-035, FR-078).             |
| Historial y tickets       | Ninguna      | Documentos y tickets ya persistidos, ordenados cronológicamente y filtrados con `can()` antes de renderizarse; no se crean registros nuevos (FR-094, FR-106, FR-111). |

### 10.3 Tickets en la tabla de clientes

Los tickets continúan siendo `Documento` con `ticket: true` y `entity_id` del cliente. La tabla de gestión calcula por fila, en una sola pasada sobre los tickets visibles, si existen estados «Abierto» o «En revisión» y muestra ambas alertas si coexisten. «Ticket abierto» usa naranja y «Ticket en revisión» azul. El botón «Abrir Ticket» no crea un documento por sí solo: solo navega a `?view=postventa`, abre el panel en línea y precarga `#ticket-client` con ese `entity_id`; la creación completa sigue en `createTicketDocument()` (FR-104, FR-106, FR-112).

| Relación                            | Regla                                                                                                                                                                 |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Abrir Ticket` → `postventa:create` | Visible solo para N1 y N4; la capa de datos vuelve a comprobar el permiso si se invoca directamente.                                                                  |
| Alerta → `postventa:view[_own]`     | Visible para N1/N4 sobre todos los tickets y para N2 solo sobre los clientes con `ejecutivo_asignado = user.id`; N3 y visitante no ven alertas.                       |
| Cliente preseleccionado             | `state.ticketValues.entity_id` se precarga con `entity_id` de la fila; `#ticket-client` lo muestra como opción seleccionada sin modificar el documento hasta guardar. |

### 10.4 Cierre perdido con motivo

La regla declarativa del perfil CRM es:

```js
documentRules: {
  lostReason: {
    status: 'cerrado perdido',
    entityStateField: 'estado_comercial',
    entityState: 'prospecto',
    customField: 'motivo_perdida',
    options: ['Precio alto', 'Eligió competencia', 'Sin presupuesto', 'No responde'],
  },
}
```

- `statusLifecycle.states` ya incluye `cerrado perdido`; la regla NO lo añade a `pendingStates` ni a los estados activos usados por `pipelineTotal`.
- `motivo_perdida` es opcional en el documento base y obligatorio solo cuando el documento pasa a `cerrado perdido` y la entidad vinculada tiene `estado_comercial = prospecto` (FR-113).
- Sin motivo, `validateDocumentData()` devuelve un error y ni `addDocument()` ni `updateDocument()` escriben en `erp_documents`; por tanto el documento conserva su estado anterior.
- El motivo elegido se guarda como campo personalizado y `document-list.js` lo muestra en el historial de la entidad.
- «Cerrado ganado», `computeSalesTeamMetrics()` y `computeDashboardStats()` siguen ignorando el nuevo estado: no suma al real mensual, al total de ventas ni a pendientes; el estado solo aparece en el embudo por estados de documento (SC-043).

La forma detallada de estas reglas y sus selectores está en `contracts/client-ui.md`, `contracts/auth.md`, `contracts/postventa.md` y `contracts/entity-storage.md`.

## 11. Rediseño de acceso y Portal del Cliente (2026-11-27)

### 11.1 Tarjeta de acceso sin persistencia nueva

La pantalla de inicio sigue derivando los botones de `erp_users` y creando `erp_session` con `login(userId)`. La única novedad estructural es de presentación: `.login-card` centra la grilla de dos columnas y sitúa por debajo el enlace «Portal del Cliente». `theme.accentColor` se aplica a botones y resaltados de la tarjeta; si falta o es inválido se usa el color integrado y se muestra la advertencia de configuración. No se guardan estilos, posiciones ni preferencias: no hay clave nueva de `localStorage` y la sesión, expiración y matriz de permisos permanecen intactas (FR-038, FR-110, FR-117).

### 11.2 Estado local del portal

| Elemento                   | Persistencia | Regla observable                                                                                                                           |
| -------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `?view=client-portal`      | Ninguna      | Ruta pública sin marco ERP ni sesión; se resuelve desde `location.search` en carga, recarga y Back/Forward (FR-114).                       |
| `state.portalTab`          | Ninguna      | Solo `quote` o `support`, con etiquetas «Solicitar cotización» y «Soporte Postventa»; no se conserva al recargar (FR-114).                 |
| Borradores de las pestañas | Ninguna      | Los valores viven en el formulario hasta el envío; un envío rechazado no escribe en `erp_entities` ni en `erp_documents` (FR-115, FR-116). |

### 11.3 Cotización desde el portal

El envío válido de «Solicitar cotización» produce exactamente dos registros ya conocidos:

| Registro            | Campos escritos                                                                                                                                                                                                        |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Entidad` prospecto | `name`, `code` generado, `estado_comercial = 'prospecto'`, `consentimiento = true`, `consentimiento_fecha`, `consentimiento_version` y los campos configurados `email`/`phone`/`empresa` cuando el perfil los declare. |
| `Documento`         | `entity_id` del prospecto, `servicio_interes`, `monto_estimado`, `notes` opcional con la descripción libre y `status` inicial del ciclo configurado; `ticket` no se marca.                                             |

`createProspectFromCapture()` crea la entidad y `addDocument()` crea la cotización con la misma validación de consentimiento de FR-071. Si falta alguna casilla obligatoria —«Nombre», «Empresa», «Correo», «Teléfono», «Servicio de interés» con monto o consentimiento— no se crea ninguno de los dos registros y se muestra `Completa los campos obligatorios.` (FR-006, FR-115).

### 11.4 Ticket público de soporte

`createPortalTicketDocument(values)` es una operación pública explícita de `src/storage.js`, equivalente a la ruta de `chat:create_query`, y no sustituye a `createTicketDocument()`:

| Paso                 | Regla                                                                                                                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Campos obligatorios  | «Correo del cliente», «Categoría» y «Descripción del problema»; sin ellos se rechaza con `Completa los campos obligatorios.` y no se muta nada (FR-006, FR-114).                                              |
| Búsqueda de cliente  | `findClientByEmailOrPhone()` compara correo y teléfono de los clientes almacenados, en una sola pasada, sin distinguir mayúsculas ni espacios; con varios coincidentes se usa el primero por `createdAt`.     |
| Sin coincidencia     | Se muestra `No encontramos un cliente con ese correo o teléfono.` y no se crea Ticket, Entidad ni ningún otro registro (FR-116).                                                                              |
| Escritura del ticket | `Documento` con `ticket: true`, `entity_id` del cliente encontrado, `asunto` derivado de la categoría, `categoria`, `descripcion` en `notes`, `status = 'Abierto'` y `prioridad = 'media'`.                   |
| Permisos             | No exige `postventa:create` porque el actor es `visitor`, pero no añade esa acción a la matriz ni habilita `?view=postventa`; `createTicketDocument()` sigue exigiéndola para N1/N4 (FR-094, FR-106, FR-114). |

El ticket se agrega al mismo `erp_documents` y aparece en el historial de la entidad, en las tarjetas de Postventa y en las alertas de la tabla de clientes según los permisos ya vigentes. No hay `createdByUserId` de un usuario interno: la auditoría se limita a las marcas de tiempo del documento, igual que en otras rutas públicas (FR-104, FR-111, FR-112).

### 11.5 Actualización inmediata y relaciones

Toda mutación del portal pasa por `storage.js` y el siguiente `render()` lee los arreglos ya cargados en `state`; por eso, al volver al CRM, Marketing muestra el prospecto y su cotización, y Postventa, sus tarjetas y la ficha del cliente muestran el ticket sin recarga ni `StorageEvent`. Ninguna vista persiste un contador derivado. Las relaciones siguen siendo `Documento.entity_id → Entidad.entity_id` y `Ticket → ficha de entidad`, sin nueva estructura de almacenamiento (FR-032, FR-104, FR-114, SC-004, SC-044).

## 12. Panel visual, gráficos y ortografía visible (2026-11-27)

### 12.1 Sin entidades ni claves nuevas

El incremento no añade `localStorage`, permisos canónicos ni tipos de registro. `Entidad`, `Documento`, tickets, campañas y `erp_theme` conservan su forma. Las cuatro visualizaciones y las cinco tarjetas de FR-035 son vistas derivadas calculadas en cada `render()`; los resultados se guardan solo en memoria como `state.dashboardChartData` para reutilizarlos en el marcado y en Chart.js, nunca en `erp_entities`, `erp_documents` ni otra clave (FR-032, FR-118, FR-121).

### 12.2 KPI canónicas frente a KPI retiradas

| Grupo                         | Elementos                                                                                                 | Regla observable                                                                                                                                                          |
| ----------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cinco KPI canónicas           | Entidades, documentos, «Cerrado ganado», «Tasa de conversión», «Pipeline (USD)»                           | Siguen en `src/components/dashboard.js`, las consume también Marketing y se recalculan con `computeDashboardStats()` tras cada mutación (FR-035, FR-072, FR-074, SC-046). |
| Cuatro KPI del «Panel visual» | «Ingresos totales del mes», «Clientes activos», «Campañas activas» con su conversión y «Tickets abiertos» | Desaparecen del marcado y de `aria-label`; no se ocultan con CSS ni se sustituyen por otros valores calculados (FR-118).                                                  |

Las cinco tarjetas canónicas se calculan así sobre entidades activas (sin `archivedAt`) y sus documentos, excluidos los archivados por FR-103: entidades = conteo de entidades activas; documentos = conteo de documentos vinculados a esas entidades; «Cerrado ganado» = conteo de documentos en ese estado; «Tasa de conversión» = documentos ganados ÷ entidades activas × 100, con cero si no hay entidades activas; «Pipeline (USD)» = suma de importes de los documentos ganados. Todos los importes son USD sin conversión; si se declara «Moneda», solo `USD` se acepta y cualquier otro valor se rechaza con un error visible sin crear ni modificar el documento (FR-035, FR-125).
### 12.3 Series derivadas

| Serie             | Entradas                                                                               | Regla de agregación                                                                                                                                                                                      | Estado vacío                                              |
| ----------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `salesByMonth`    | Documentos con `normalizeText(status) === 'cerrado ganado'` y fecha `startDate` válida | Agrupa por mes calendario; para cada mes guarda `ingresos = suma(importe)` y `negocios = conteo`; ordena de menor a mayor fecha (FR-122, SC-050).                                                        | `No hay registros para esta serie.`                       |
| `ticketsByStatus` | Documentos con `ticket: true` y `entity_id` de entidad activa                          | Cuenta una sola vez por `id` en «Abierto», «En revisión» y «Resuelto», con los tres estados presentes aunque tengan cero; usa `isTicket()` y no `notes` para discriminar (FR-122, SC-050).               | `No hay registros para esta serie.`                       |
| `leadsByCampaign` | Entidades activas con `estado_comercial = 'prospecto'`                                 | Agrupa por el campo personalizado `campaña`; los valores vacíos se normalizan al grupo visible «Sin campaña»; no se inventan campañas ausentes de los registros (FR-088, FR-122, SC-050).                | `No hay registros para esta serie.`                       |
| `funnel`          | Documentos activos                                                                     | Reutiliza `computeDashboardStats().funnel` con los estados de `statusLifecycle.states` y su conteo; `cerrado perdido` aparece como estado sin contarse como venta ni pendiente (FR-035, FR-074, FR-113). | Cero por estado, sin ocultar la tarjeta ni sus etiquetas. |

Toda serie excluye entidades con `archivedAt` y documentos vinculados a esas entidades; ninguna usa `src/mockData.js`, valores capturados específicamente para el gráfico ni registros archivados (FR-121, FR-122, FR-103). Las etiquetas visibles se sanitizan con `escapeHtml()` tanto en `aria-label` como en el `title` del embudo.

### 12.4 Estado local de tema y de cuadrícula

| Elemento                      | Persistencia   | Regla observable                                                                                                                                                                                                        |
| ----------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `erp_theme`                   | `localStorage` | Clave ya existente; conserva `light` u `dark` y se aplica en el arranque. El botón `toggle-theme` actualiza etiqueta, `aria-pressed` y `title` sin recargar (FR-123, SC-051).                                           |
| `state.dashboardChartData`    | Ninguna        | Resultado en memoria de `computeDashboardChartData()`; se recalcula en `render()` y se reutiliza en `mountDashboardCharts()`. El cambio de tema no lo recalcula ni lo reemplaza por datos de ejemplo (FR-121, SC-049).  |
| Instancias de Chart.js        | Ninguna        | `refreshDashboardChartTheme()` muta opciones y datasets y llama a `chart.update('none')`; conserva gráficos, series y vista actual. `destroyDashboardCharts()` sigue usándose solo al desmontar la aplicación (FR-123). |
| `.chart-grid` / `.chart-card` | Ninguna        | CSS con `grid-template-columns: repeat(auto-fit, minmax(320px, 1fr))`; panel muestra tres gráficos más el embudo y Marketing solo el embudo, cada uno con `h3` visible (FR-120, SC-048).                                |

### 12.5 Configuración de presentación de estados

`statusLifecycle.labels` es un mapa opcional de valor interno a texto visible. Se añade solo la entrada `'en negociacion': 'En negociación'`; el valor de `statusLifecycle.states`, los documentos ya persistidos y la normalización de búsquedas no cambian. `funnelFor()` y cualquier otro renderizador de estados consultan primero este mapa y, si falta, conservan el comportamiento anterior de derivar la etiqueta del valor (FR-119, SC-047).

### 12.6 Relaciones y validation rules

- `salesByMonth ← Documento.status + Documento.startDate + Documento.importe`, con importes numéricos y fechas ISO válidas; un importe ausente cuenta como cero pero el documento se cuenta como negocio cerrado (FR-122).
- `ticketsByStatus ← Documento.ticket + Documento.status + Entidad.archivedAt`, sin duplicar ids ni incluir tickets de entidades archivadas (FR-103, FR-122).
- `leadsByCampaign ← Entidad.estado_comercial + Entidad.campaña + Entidad.archivedAt`, con «Sin campaña» como grupo derivado y no como valor escrito en la entidad (FR-088, FR-122).
- `funnel ← Documento.status`, calculado por la utilidad ya existente; no se agrega un estado nuevo ni se modifica `pendingStates` (FR-035, FR-113).
- Un estado vacío se sustituye por la serie real en el siguiente `render()` tras una mutación válida; no hay recarga, evento entre pestañas ni contador persistido (FR-124, SC-052).
- La ortografía se aplica solo a literales visibles: no se renombran variables, funciones, clases CSS, rutas, IDs ni claves de objetos, y no se migran valores almacenados (FR-119).

La forma observable de tarjetas, tooltips, estados vacíos y cambio de tema está en [`contracts/dashboard-charts.md`](contracts/dashboard-charts.md); el embudo compartido con Marketing se describe en [`contracts/marketing.md`](contracts/marketing.md).

## 13. Precisión de permisos, KPIs, moneda, baja y campañas (2026-11-27)

### 13.1 Reglas de permisos

- Nivel 3 (`n3_marketing`) usa los identificadores canónicos `document:create`, `document:edit_any` y `document:delete` únicamente con contexto `documentType = 'social'`, derivado de los documentos declarados como interacciones de redes (por `plataforma`/`tipo_interaccion`) y no persistido como campo nuevo. Puede crear, editar y eliminar esas interacciones de cualquier prospecto o cliente.
- La restricción se comprueba en `src/storage.js` con `assertPermission()`: si el documento no es una interacción de redes, o si se intenta una entidad, un documento de venta, otro documento comercial o un ticket, la operación se rechaza con `No tienes permiso para realizar esta acción` y no escribe en `localStorage`. No se crean acciones ni rangos adicionales.
- Nivel 3 responde «Dudas y consultas» con `chat:answer`; esa acción no concede `document:edit_any` sobre el mensaje ni permite cambiar su estado. Sigue sin `document:transition_own`, `postventa:*`, `summary:*` ni `users:manage`, y no crea, edita ni elimina tickets.

### 13.2 KPIs y moneda

- Las cinco tarjetas canónicas y sus equivalentes en Marketing usan: entidades activas (sin `archivedAt`), documentos vinculados a entidades activas, `closedWon` como conteo de documentos «Cerrado ganado», `conversionRate = closedWon / entidades activas * 100` (cero sin activas) y `pipeline` como suma de importes de esos documentos. Los archivados quedan excluidos por FR-103.
- Panel, Marketing, real mensual, objetivo mensual, ventas por mes, pipeline y total comprado usan USD sin conversión. Si la configuración declara «Moneda», el único valor aceptado es `USD`; cualquier otro valor produce un error visible y no crea ni modifica el documento (FR-125).

### 13.3 Baja protegida de entidades

- `deleteEntity()` solo elimina la entidad cuando no tiene documentos, tickets ni registros vinculados por `entity_id`, y solo tras confirmación explícita. Con registros vinculados, muestra `EntityHasRecordsError`, no muta `erp_entities` ni `erp_documents` (tampoco añade `archivedAt`) y ofrece archivar la entidad para conservar el historial. No existe borrado en cascada; `deleteDocumentsForEntity()` sigue siendo una operación explícita y distinta (FR-003, FR-009, FR-103).

### 13.4 Seis indicadores de rendimiento de campañas

| Indicador                  | Definición                                                                                                                                     |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `prospectosCapturados`     | Entidades activas con `estado_comercial = 'prospecto'` o creadas desde la captura.                                                             |
| `conversionesPorEtapa`     | Entidades activas contadas por el estado comercial objetivo de la campaña.                                                                    |
| `tasaDeConversion`         | Documentos «Cerrado ganado» ÷ entidades activas × 100, con cero sin activas; misma fuente que FR-035.                                          |
| `interaccionesRegistradas` | Documentos de redes y otras interacciones de entidades activas, sin duplicar `id` y sin contar tickets.                                        |
| `consultasRespondidas`     | Documentos `canal = 'chat'` con respuesta registrada, contados una sola vez.                                                                  |
| `ventasGanadas`            | Cantidad de documentos «Cerrado ganado» de entidades activas, igual que la tarjeta del panel.                                                  |

Los seis se filtran por `campaña`/`campaignId` cuando se selecciona una campaña; sin valor se agrupan bajo «Sin campaña» y sin registros muestran cero con `Sin registros para esta campaña.` (FR-087, FR-088).
