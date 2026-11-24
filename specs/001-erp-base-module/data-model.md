# Modelo de Datos: Módulo Base ERP

**Alcance**: Este documento describe el modelo de datos tal como lo implementa el módulo base (ver `plan.md` — aplicación Vite, sin backend, persistencia en `localStorage` del navegador) y cómo los perfiles CRM y Marketing descritos en las Historias de Usuario 2, 3, 5, 6, 7 y 16 a 21 lo reutilizan mediante configuración, sin introducir una estructura de almacenamiento distinta.

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

| Campo                     | Tipo                   | Obligatorio         | Notas                                                                                                                                                                  |
| ------------------------- | ---------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                      | string                 | Sí                  | Identificador único, autogenerado.                                                                                                                                     |
| `entity_id`               | string                 | Sí                  | Debe coincidir con el `entity_id` de una entidad existente; si no, se rechaza (Historia de Usuario 1, Historia de Usuario 11).                                         |
| `startDate`               | string (ISO date)      | No                  | Fecha de inicio opcional; cuando se provee junto a `endDate`, `endDate` debe ser igual o posterior (Historia de Usuario 11).                                           |
| `endDate`                 | string (ISO date)      | No                  | Fecha de fin opcional; no puede ser anterior a `startDate`.                                                                                                            |
| `notes`                   | string                 | No                  | Notas o descripción libres del documento.                                                                                                                              |
| `status`                  | string                 | No                  | Texto libre por defecto (FR-031); si `module-config.js` declara `statusLifecycle`, el valor queda restringido a transiciones válidas (FR-030, Historia de Usuario 13). |
| `createdAt` / `updatedAt` | string (ISO timestamp) | Sí                  | Marcas de tiempo de auditoría.                                                                                                                                         |
| _(campos personalizados)_ | según configuración    | según configuración | Declarados en `module-config.js` (Historia de Usuario 8).                                                                                                              |

**Integridad referencial**: eliminar una `Entidad` elimina en cascada todos sus `Documento` asociados, tras confirmación explícita que indica el número de documentos afectados (FR-003, FR-009).

### 1.3 `ModuleConfig`

Objeto de adaptación cargado desde `src/module-config.js` al arrancar (Historia de Usuario 5). No se persiste en `localStorage`; vive en código fuente de cada módulo adaptado.

| Campo                                                             | Tipo            | Notas                                                                                                                                                                                                                                                                                 |
| ----------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `moduleName`                                                      | string          | Nombre mostrado en la barra superior y el panel (FR-036).                                                                                                                                                                                                                             |
| `labels`                                                          | object          | Mapeo de términos (p. ej. `entity → "Cliente"`, `document → "Interacción"`) (FR-029, Historia de Usuario 7).                                                                                                                                                                          |
| `customFields.entity` / `customFields.document`                   | array           | Definiciones de campos personalizados por tipo de registro (FR-026 a FR-028, FR-040, Historia de Usuario 8).                                                                                                                                                                          |
| `statusLifecycle`                                                 | object \| null  | Estados permitidos y transiciones válidas para `Documento.status` (FR-030, FR-031, Historia de Usuario 13).                                                                                                                                                                           |
| `entityDate`                                                      | object \| null  | Regla opcional para el campo base `targetDate`: `{ label, min, max, required }`. `max: "localToday"` se resuelve en tiempo de ejecución a la fecha local del dispositivo; `required: true` solo en el perfil de clientes. Ausente en perfiles no-clientes. (FR-047 a FR-050, FR-056). |
| `fieldRules.entity` / `fieldRules.document`                       | object          | Reglas declarativas por clave de campo: `hidden`, `searchable`, `required`, `generated`, `unique`, `format`, `normalize`, `when`, `group`. Aplica a campos base y personalizados; ausente = comportamiento base (FR-051 a FR-055, FR-057, FR-059 a FR-061).                           |
| `detailPolicy.entity`                                             | object          | `{ blockWhenInvalid: true, offerEditAction: true }` en el perfil de clientes; bloquea la ficha de registros incompletos y ofrece editarlos (FR-058).                                                                                                                                  |
| `placeholder` / `order` (en definiciones de campo o `fieldRules`) | string / number | Pista gris de ejemplo y posición opcional del campo en el formulario; no cambian el valor almacenado (FR-062, FR-065, FR-067).                                                                                                                                                        |
| `options` (en campos `select`)                                    | array           | Cadenas u objetos `{ value, label }`; la etiqueta se muestra y el valor se persiste, de modo que «Llamada» guarda `llamada` (FR-063).                                                                                                                                                 |
| `marketing`                                                       | object \| null  | Bloque opcional con `privacyNoticeVersion`, `captureFields`, `automationRules`, `salesTeams`, `faq` y `campaigns`; ausente = sin comportamiento de Marketing (FR-068 a FR-090).                                                                                                       |
| `theme.accentColor`                                               | string          | Color de acento opcional (FR-038).                                                                                                                                                                                                                                                    |

Una configuración ausente, inválida o conflictiva hace que el sistema arranque con los valores predeterminados integrados (Entidad/Documento, sin campos personalizados, sin ciclo de vida) y muestre una advertencia visible (FR-024, FR-025).

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
| Título de creación                   | `Nuevo ${labels.entity}`                                        | «Nuevo Cliente» en el formulario y la acción rápida (FR-064).                                                                                              |

FR-004 es la lista canónica de campos buscables: nombre, código, categoría, descripción, fecha objetivo y campos personalizados visibles declarados en la configuración activa. La búsqueda del perfil de clientes deriva sus campos de estas reglas mediante `fieldRules`/anulación de perfil: solo `name`, `targetDate` y campos personalizados visibles y buscables (FR-020, FR-055); no existe una segunda lista de campos en la vista de búsqueda ni en la persistencia. La utilidad `src/utils/field-formats.js` expone los formatos `cl-rut`, `phone`, `email` y `nonEmpty` sin dependencias externas. La retroalimentación usa los textos exactos de FR-006.

**Nota de diseño**: una versión anterior de este documento describía un esquema relacional (`customers`, `customer_interactions`, `support_tickets`, `sales_opportunities`, `users`) que asumía una base de datos SQL con backend. Ese diseño era incompatible con la arquitectura elegida en `plan.md` (aplicación Vite sin backend, persistencia en `localStorage`, ver `research.md`) y con `contracts/entity-storage.md`, e introducía entidades (`support_tickets`, `sales_opportunities`, `users`) sin respaldo en ninguna historia de usuario o requisito funcional de `spec.md`. Se reemplazó por el modelo de esta sección para mantener un único modelo de datos consistente en toda la funcionalidad.

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

| Salida           | Definición                                                                   |
| ---------------- | ---------------------------------------------------------------------------- |
| `totalEntities`  | Total de entidades almacenadas.                                              |
| `totalDocuments` | Total de documentos almacenados.                                             |
| `closedWon`      | Importe de los documentos en estado «Cerrado ganado».                        |
| `conversionRate` | Tasa de conversión calculada con la misma fórmula del panel.                 |
| `pipeline`       | Importe del pipeline calculado con la misma fórmula del panel.               |
| `funnel`         | Conteo y porcentajes por estado de documento, idénticos al embudo del panel. |

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

Clientes e Interacciones no figuran en la barra lateral; Marketing sí es la cuarta opción de `NAV_ITEMS` en `src/components/shell.js`. El estado de la vista (`state.view`) sigue siendo en memoria y no se persiste; la ruta se resuelve desde `location.search` en cada carga, Back/Forward y recarga: sin parámetro es Panel, `?view=capture` es pública y no existe `?view=panel`. La captura pública no altera datos hasta que se envía el formulario. El chat aparece tanto en la captura pública como en Marketing usando los mismos documentos.

## 4. Equipo de ventas y logros

`marketing.salesTeams` es un arreglo opcional de equipos y sirve de semilla. Cada equipo y sus integrantes se capturan en la interfaz y las definiciones editadas se guardan en `erp_marketing_config`; las métricas se calculan, no se persisten.

| Objeto                | Campo             | Tipo           | Notas                                                                                                                                         |
| --------------------- | ----------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Equipo                | `name`            | string         | Nombre editable del equipo (FR-076).                                                                                                          |
| Equipo                | `integrantes`     | array          | Lista editable de integrantes.                                                                                                                |
| Integrante            | `name`            | string         | Nombre editable del integrante (FR-077).                                                                                                      |
| Integrante            | `role`            | string         | Cargo editable del integrante (FR-077).                                                                                                       |
| Integrante            | `active`          | boolean        | Estado «Activo»/«Inactivo» editable (FR-077).                                                                                                 |
| Integrante            | `userId`          | string \| null | Usuario activo vinculado de rango Nivel 2 o Nivel 4; obligatorio desde la octava tanda (FR-096, FR-097).                                      |
| Integrante (derivado) | `realMensual`     | number         | Suma de importes de documentos «Cerrado ganado» del mes cuyo cliente tenga `ejecutivo_asignado` igual al `userId` vinculado (FR-078, FR-097). |
| Integrante (derivado) | `objetivoMensual` | number         | `ventasAcumuladas / díasTranscurridos * díasDelMes`; cero sin ventas o sin días transcurridos (FR-079).                                       |

La relación se resuelve por el `userId` del usuario activo vinculado, no por el texto visible del integrante; el campo `ejecutivo_asignado` de las entidades guarda ese mismo identificador. No se crea una entidad separada para el ejecutivo. Un equipo sin integrantes muestra un estado vacío.

## 5. Redes sociales y chat

| Concepto                   | Se implementa como                           | Campos/ reglas                                                                                                                               |
| -------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Interacción en redes       | `Documento` vinculado al prospecto o cliente | `plataforma`, `tipo_interaccion`, `nota`, `enlace`, `campaña` opcional, `startDate = fecha` (FR-080, FR-081).                                |
| Mensaje o consulta de chat | `Documento` vinculado al prospecto o cliente | `canal = 'chat'`, `mensaje`, `tipo_interaccion`, `campaña` opcional y marcas de tiempo (FR-081, FR-083).                                     |
| Pregunta frecuente         | Entrada de configuración `marketing.faq`     | `{ pregunta, respuesta }`; la coincidencia se resuelve sobre texto normalizado (FR-082).                                                     |
| Consentimiento del chat    | Campos de la entidad                         | Reutiliza `consentimiento`, `consentimiento_fecha` y `consentimiento_version`; sin consentimiento no se registra el primer mensaje (FR-085). |

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

| Indicador                  | Definición                                                                     |
| -------------------------- | ------------------------------------------------------------------------------ |
| `prospectosCapturados`     | Entidades con `estado_comercial = prospecto` o creadas desde la captura.       |
| `conversionesPorEtapa`     | Conteo de entidades por estado comercial objetivo de campaña.                  |
| `tasaDeConversion`         | Proporción de entidades que alcanzaron `ganado`.                               |
| `interaccionesRegistradas` | Documentos de redes y otras interacciones vinculados a entidades.              |
| `consultasRespondidas`     | Mensajes de chat que recibieron respuesta rápida.                              |
| `ventasGanadas`            | Cantidad de documentos «Cerrado ganado», coincidente con la tarjeta del panel. |

Cuando se selecciona una campaña, los indicadores se filtran por el campo `campaña` o `campaignId`. Los registros sin campaña aparecen bajo el grupo «Sin campaña» (FR-088). Una campaña sin registros muestra cero con una explicación clara (SC-026).

## 8. Autenticación, sesión y permisos

La autenticación es local y simulada (FR-091 a FR-099, US22, US23). No introduce una base de datos ni un servicio externo: persiste en las claves `erp_users` y `erp_session` de `localStorage`. `erp_users` es la fuente de verdad de identidad, rango y estado activo; `erp_session` solo referencia al usuario, de modo que un cambio de rango o una desactivación se refleje en la siguiente acción sin depender de datos copiados en la sesión.

### 8.1 `Usuario`

| Campo                     | Tipo           | Obligatorio | Notas                                                                                                                   |
| ------------------------- | -------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| `id`                      | string         | Sí          | Identificador interno único, autogenerado.                                                                              |
| `username`                | string         | Sí          | Nombre visible de inicio de sesión, p. ej. `camila.ramirez`.                                                            |
| `usernameKey`             | string         | Sí          | `username` recortado y en minúsculas; garantiza unicidad sin distinguir mayúsculas ni espacios (aclaración 2026-11-24). |
| `passwordHash`            | string         | Sí          | Digest PBKDF2-SHA-256 en hexadecimal; nunca se guarda la contraseña en texto plano.                                     |
| `salt`                    | string         | Sí          | Sal aleatoria de 16 bytes en hexadecimal, distinta por usuario.                                                         |
| `rank`                    | string         | Sí          | Uno de `n4_manager`, `n3_marketing`, `n2_sales`, `n1_support`; equivale a los rangos de la matriz (FR-091).             |
| `active`                  | boolean        | Sí          | `true` permite iniciar sesión; `false` revoca la sesión existente (FR-095, FR-099).                                     |
| `failedAttempts`          | number         | Sí          | Número de intentos fallidos dentro de la ventana de bloqueo; se reinicia con un login correcto.                         |
| `lockedUntil`             | string \| null | No          | Marca ISO que indica hasta cuándo está bloqueado el usuario.                                                            |
| `createdAt` / `updatedAt` | string         | Sí          | Marcas de tiempo ISO de auditoría.                                                                                      |

Usuarios semilla demostrativos: `camila.ramirez` (Nivel 4), `lucia.fernandez` (Nivel 3), `pedro.soto` (Nivel 2) y `sofia.torres` (Nivel 1). Solo se crean cuando `erp_users` no existe.

### 8.2 `Sesión`

| Campo            | Tipo   | Obligatorio | Notas                                                                                        |
| ---------------- | ------ | ----------- | -------------------------------------------------------------------------------------------- |
| `userId`         | string | Sí          | Referencia a `Usuario.id`; dentro de una sola clave de sesión existe como máximo una sesión. |
| `issuedAt`       | string | Sí          | Marca ISO de creación de la sesión.                                                          |
| `lastActivityAt` | string | Sí          | Marca ISO de la última acción verificada; se actualiza en cada verificación.                 |
| `expiresAt`      | string | Sí          | `lastActivityAt + 8 horas`; al expirar se elimina la sesión y se redirige a login.           |

La sesión no guarda `rank`, `username` ni `active`: esos valores se resuelven desde `erp_users` cada vez que `getCurrentUser()` o `assertPermission()` los necesitan. Por eso un cambio de rango se aplica en la siguiente acción o recarga, y una desactivación cierra la sesión de inmediato (FR-099).

### 8.3 `Rango` y matriz de permisos

`Rango` no se persiste como entidad separada: es una enumeración exportada por `src/auth/permissions.js`. La matriz rango → acción es la única fuente de permisos y replica la tabla y el «Catálogo canónico de acciones» de `spec.md`; no introduce identificadores adicionales:

| Rango                            | Acciones canónicas                                                                                                                                                                                                               | Restricciones clave                                                                                                                                                         |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Visitante (sin sesión)           | Ninguna acción interna; solo `chat:create_query` en la ruta pública con consentimiento                                                                                                                                           | Sin `panel:view`, `search:view`, `summary:*`, `marketing:*`, `team:*` ni `users:manage`. La captura pública se rige por FR-069 y no es una acción de la matriz interactiva. |
| Nivel 1 - Atención al cliente    | `panel:view`, `search:view`, `entity:view_any`, `document:read`, `document:create`, `chat:answer`                                                                                                                                | No crea ni edita entidades; no elimina; no cambia estados de documento; sin `summary:*`, `marketing:*`, `team:*` ni `users:manage`.                                         |
| Nivel 2 - Ejecutivo de Ventas    | `panel:view`, `search:view`, `entity:view_any`, `entity:create`, `entity:edit_own`, `document:create`, `document:read`, `document:edit_own`, `document:transition_own`, `summary:view_own`, `team:view_own`                      | No elimina entidades ni documentos; edita solo donde `ownerId` coincida con su `id`; sin `marketing:*` ni `users:manage`.                                                   |
| Nivel 3 - Ejecutivo de Marketing | `panel:view`, `search:view`, `entity:view_any`, `document:read`, `marketing:view`, `marketing:manage`, `team:view_all`, `chat:view`, `chat:answer`, `campaign:create`, `campaign:view`, `campaign:edit_own`, `campaign:stop_own` | No elimina entidades; sin `summary:*` ni `users:manage`; no detiene campañas de otro usuario (`campaign:stop_any`).                                                         |
| Nivel 4 - Gerente comercial      | Todas las acciones canónicas excepto `permissions:edit`                                                                                                                                                                          | `permissions:view` solo consulta la matriz; `permissions:edit` se deniega a todos y la matriz no se edita desde la interfaz.                                                |

`ownerId` identifica al usuario asignado, al creador de la campaña o al integrante vinculado según la acción; `campaignOwnerId` identifica al creador de la campaña. Las acciones con sufijo `_own` fallan si falta el contexto o si el usuario autenticado no coincide. Toda acción no listada se deniega por defecto. `Sistema` es una identidad de auditoría para automatizaciones, no un rango de la matriz ni una opción de inicio de sesión.

### 8.4 Validaciones y transiciones

- `usernameKey` debe ser único entre todos los usuarios; «Pedro.Soto», `pedro.soto` y `pedro.soto` colisionan.
- `rank` debe pertenecer a la enumeración; un valor desconocido se deniega por defecto.
- `active: false` elimina `erp_session` y bloquea nuevos inicios de sesión; las entidades e interacciones históricas se conservan.
- Cambiar `rank` no invalida la sesión, pero la siguiente resolución usa el nuevo rango y actualiza la barra superior.
- `failedAttempts >= 5` fija `lockedUntil = ahora + 15 minutos`; mientras `lockedUntil > ahora` se rechaza el login aunque la contraseña sea correcta.
- Un login correcto reinicia `failedAttempts` y `lockedUntil`, y crea una sesión nueva.
- Una sesión con `expiresAt <= ahora` se elimina y se trata como «sin sesión».
- «Cerrar sesión», la desactivación, el bloqueo activo y la expiración son las únicas vías de finalización de sesión.
- `assertPermission()` devuelve o lanza el mensaje exacto `No tienes permiso para realizar esta acción`; una vista no permitida muestra «Acceso denegado» y vuelve al Panel, mientras que un visitante sin sesión es redirigido a login.

### 8.5 Relaciones con el resto del modelo

| Relación                                    | Regla                                                                                                                   |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `Usuario.rank` → matriz                     | Determina navegación, botones, vistas y validaciones de `src/storage.js`.                                               |
| `Usuario.id` ↔ `Entidad.ejecutivo_asignado` | El campo guarda el `id` del usuario activo de rango Nivel 2 o Nivel 4; la interfaz muestra su `username`.               |
| `Usuario.id` ↔ `Integrante.userId`          | El real y objetivo mensuales se calculan desde los clientes asignados al usuario vinculado.                             |
| `Sistema` → `Documento` / campaña           | Las automatizaciones se registran como creadas por «Sistema»; el historial de campaña conserva el `Usuario.id` creador. |

La identidad simulada no sustituye la autenticación de servidor requerida para producción; esta limitación ya está declarada en las suposiciones de la especificación.
