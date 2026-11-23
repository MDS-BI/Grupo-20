# Modelo de Datos: Módulo Base ERP

**Alcance**: Este documento describe el modelo de datos tal como lo implementa el módulo base (ver `plan.md` — aplicación Vite, sin backend, persistencia en `localStorage` del navegador) y cómo el perfil CRM descrito en las Historias de Usuario 2, 3, 5, 6 y 7 lo reutiliza mediante configuración, sin introducir una estructura de almacenamiento distinta.

Para la forma exacta de los campos y las operaciones de almacenamiento, ver `contracts/entity-storage.md`, que es la fuente autoritativa; este documento resume las relaciones y la extensión vía configuración.

## 1. Entidades Base

### 1.1 `Entidad`

Registro de datos maestros gestionado por el módulo (FR-001 a FR-007). Persistido como un arreglo de objetos JSON en `localStorage`.

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `id` | string | Sí | Identificador interno único, autogenerado. |
| `entity_id` | string | Sí | Identificador público único, autogenerado; usado para vincular Documentos. |
| `name` | string | Sí | Nombre de la entidad. |
| `code` | string | Sí | Código de negocio único (comparación sin distinguir mayúsculas ni espacios, FR-001). En el perfil de clientes se genera automáticamente, se guarda en el registro y queda oculto y no buscable (FR-052, FR-055). |
| `category` | string | No | Categoría de clasificación, usada en búsqueda en el perfil base (FR-004). En el perfil de clientes se conserva, pero se oculta y excluye de la búsqueda (FR-051, FR-054, FR-055). |
| `description` | string | No | Detalle descriptivo. En el perfil de clientes se conserva, pero se oculta y excluye de la búsqueda (FR-051, FR-054, FR-055). |
| `targetDate` | string (ISO date) | No (Sí en clientes) | Fecha objetivo opcional (Historia de Usuario 10). En el perfil de clientes se etiqueta "Fecha de nacimiento", es obligatoria (FR-056) y se restringe según FR-047 a FR-050; la clave de almacenamiento no cambia. |
| `createdAt` / `updatedAt` | string (ISO timestamp) | Sí | Marcas de tiempo de auditoría. |
| *(campos personalizados)* | según configuración | según configuración | Declarados en `module-config.js`; se persisten junto a los campos base sin cambio de esquema (XR-001, Historia de Usuario 8). |

En el perfil de clientes, los campos personalizados activos son `rubro`, `ejecutivo_asignado`, `canal_contacto`, `rut` y los cuatro campos condicionales de contacto (`contacto_telefono`, `contacto_correo`, `contacto_lugar`, `contacto_whatsapp`). `rubro` conserva su clave de almacenamiento pero se muestra como «Tipo de actividad» y se restringe a un desplegable de diez opciones (FR-066). `pedidos` deja de declararse (FR-053); sus valores antiguos, al igual que los de `category` y `description`, permanecen en el registro sin mostrarse (FR-054).

### 1.2 `Documento`

Registro transaccional vinculado a exactamente una `Entidad` mediante `entity_id` (FR-008, FR-009).

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `id` | string | Sí | Identificador único, autogenerado. |
| `entity_id` | string | Sí | Debe coincidir con el `entity_id` de una entidad existente; si no, se rechaza (Historia de Usuario 1, Historia de Usuario 11). |
| `startDate` | string (ISO date) | No | Fecha de inicio opcional; cuando se provee junto a `endDate`, `endDate` debe ser igual o posterior (Historia de Usuario 11). |
| `endDate` | string (ISO date) | No | Fecha de fin opcional; no puede ser anterior a `startDate`. |
| `notes` | string | No | Notas o descripción libres del documento. |
| `status` | string | No | Texto libre por defecto (FR-031); si `module-config.js` declara `statusLifecycle`, el valor queda restringido a transiciones válidas (FR-030, Historia de Usuario 13). |
| `createdAt` / `updatedAt` | string (ISO timestamp) | Sí | Marcas de tiempo de auditoría. |
| *(campos personalizados)* | según configuración | según configuración | Declarados en `module-config.js` (Historia de Usuario 8). |

**Integridad referencial**: eliminar una `Entidad` elimina en cascada todos sus `Documento` asociados, tras confirmación explícita que indica el número de documentos afectados (FR-003, FR-009).

### 1.3 `ModuleConfig`

Objeto de adaptación cargado desde `src/module-config.js` al arrancar (Historia de Usuario 5). No se persiste en `localStorage`; vive en código fuente de cada módulo adaptado.

| Campo | Tipo | Notas |
|---|---|---|
| `moduleName` | string | Nombre mostrado en la barra superior y el panel (FR-036). |
| `labels` | object | Mapeo de términos (p. ej. `entity → "Cliente"`, `document → "Interacción"`) (FR-029, Historia de Usuario 7). |
| `customFields.entity` / `customFields.document` | array | Definiciones de campos personalizados por tipo de registro (FR-026 a FR-028, FR-040, Historia de Usuario 8). |
| `statusLifecycle` | object \| null | Estados permitidos y transiciones válidas para `Documento.status` (FR-030, FR-031, Historia de Usuario 13). |
| `entityDate` | object \| null | Regla opcional para el campo base `targetDate`: `{ label, min, max, required }`. `max: "localToday"` se resuelve en tiempo de ejecución a la fecha local del dispositivo; `required: true` solo en el perfil de clientes. Ausente en perfiles no-clientes. (FR-047 a FR-050, FR-056). |
| `fieldRules.entity` / `fieldRules.document` | object | Reglas declarativas por clave de campo: `hidden`, `searchable`, `required`, `generated`, `unique`, `format`, `normalize`, `when`, `group`. Aplica a campos base y personalizados; ausente = comportamiento base (FR-051 a FR-055, FR-057, FR-059 a FR-061). |
| `detailPolicy.entity` | object | `{ blockWhenInvalid: true, offerEditAction: true }` en el perfil de clientes; bloquea la ficha de registros incompletos y ofrece editarlos (FR-058). |
| `placeholder` / `order` (en definiciones de campo o `fieldRules`) | string / number | Pista gris de ejemplo y posición opcional del campo en el formulario; no cambian el valor almacenado (FR-062, FR-065, FR-067). |
| `options` (en campos `select`) | array | Cadenas u objetos `{ value, label }`; la etiqueta se muestra y el valor se persiste, de modo que «Llamada» guarda `llamada` (FR-063). |
| `theme.accentColor` | string | Color de acento opcional (FR-038). |

Una configuración ausente, inválida o conflictiva hace que el sistema arranque con los valores predeterminados integrados (Entidad/Documento, sin campos personalizados, sin ciclo de vida) y muestre una advertencia visible (FR-024, FR-025).

## 2. Perfil CRM (Historias de Usuario 2, 3, 5, 6, 7)

El perfil CRM ilustrado en la especificación **no introduce entidades nuevas**: reutiliza `Entidad` y `Documento` vía `module-config.js`, de la misma forma que cualquier módulo personalizado (XR-001, XR-002).

| Concepto CRM | Se implementa como | Configuración relevante |
|---|---|---|
| Cliente | `Entidad` | `labels.entity = "Cliente"` |
| Interacción / llamada / seguimiento | `Documento` | `labels.document = "Interacción"`; campo personalizado `interactionType` (texto/selección: llamada, correo, reunión); `Documento.status` gobernado por `statusLifecycle` |
| Estado de un seguimiento | `Documento.status` | `statusLifecycle` con estados p. ej. `pendiente → en_progreso → completado`, más `atrasado` |
| Ficha de cliente (Historia de Usuario 3) | Vista de detalle de `Entidad` + sus `Documento` asociados, ordenados por fecha (FR-041, FR-042, FR-043) | N/A (comportamiento base, no requiere configuración) |
| Resumen de Gestión Comercial (Historia de Usuario 6) | Agregación en memoria sobre `Entidad`/`Documento` almacenados: total de entidades, total de documentos, documentos pendientes agrupados por `entity_id` (FR-044 a FR-046) | Usa el `statusLifecycle` configurado para determinar el estado "pendiente"; sin ciclo de vida, compara el estado normalizado (minúsculas y recorte) con "pendiente" |
| Fecha de nacimiento del cliente (sesión 2026-11-23) | `Entidad.targetDate` con validación de rango y obligatoria | `entityDate: { label: "Fecha de nacimiento", min: "1910-01-01", max: "localToday", required: true }` |
| Código del cliente | `Entidad.code` generado, guardado y oculto | `fieldRules.entity.code = { generated: { strategy: "prefixSequence", prefix: "CLI-", pad: 3 }, unique: true, hidden: true, searchable: false }` |
| Campos retirados del cliente | `Entidad.category`, `Entidad.description` y el valor heredado de `pedidos`; se conservan sin mostrar | `fieldRules.entity.category/description = { hidden: true, searchable: false }`; `pedidos` se elimina de `customFields.entity` |
| RUT del cliente | `Entidad.rut` (campo personalizado) | `required: true`, `format: "cl-rut"`, `unique: true`, `normalize: "cl-rut"`; acepta `12345678-9` y `12.345.678-9`, con pista gris `Ej: 11.111.111-1` (FR-057, FR-062) |
| Canal de Contacto | `Entidad.canal_contacto` (campo personalizado de selección) | `required: true`, sin valor preseleccionado; valores `llamada`, `correo`, `reunion`, `whatsapp` con etiquetas «Llamada», «Correo», «Reunión», «WhatsApp» (FR-063) |
| Dato de contacto adicional | Uno de `contacto_telefono`, `contacto_correo`, `contacto_lugar`, `contacto_whatsapp` | `when: { key: "canal_contacto", equals: <opción> }`, `required: true`, `group: "contactDetail"`, `format` según el canal y pista gris por canal (FR-061, FR-067) |
| Tipo de actividad | `Entidad.rubro` (clave heredada) | `type: "select"`, etiqueta «Tipo de actividad» y diez opciones definidas en FR-066 |
| Cliente heredado incompleto | Misma `Entidad`, con comprobación de preparación antes de abrir la ficha | `detailPolicy.entity = { blockWhenInvalid: true, offerEditAction: true }` |

### 2.1 Regla de fecha de entidad

- **Sin `entityDate`**: `targetDate` mantiene el comportamiento base: etiqueta "Fecha objetivo", solo validación de calendario (Historia de Usuario 10).
- **Con `entityDate`**: la etiqueta configurada sustituye a "Fecha objetivo" en formulario, lista, ficha, búsqueda y filtros; el valor debe ser una fecha de calendario válida y cumplir `min <= targetDate <= max`.
- `max: "localToday"` se resuelve cada vez que se calcula la regla usando la fecha local del dispositivo, y se recalcula al cambiar de día sin recargar (FR-048, FR-049).
- Los valores almacenados antes de aplicar la regla que queden fuera del rango no se migran: se muestran igual y `updateEntity()` exige corregirlos antes de guardar cualquier edición (FR-050).

### 2.2 Reglas de campo del perfil de clientes

| Campo | Regla de configuración | Efecto en datos e interfaz |
|---|---|---|
| `code` | `generated`, `unique`, `hidden`, `searchable: false` | Se genera en `addEntity()`, se conserva en el registro, no se captura ni se muestra en formulario, lista, ficha, selector ni búsqueda. |
| `category`, `description`, `pedidos` | `hidden`, `searchable: false` / campo no declarado | Los valores ya guardados permanecen en `localStorage`; no se renderizan ni influyen en la búsqueda. |
| `targetDate` | `entityDate.required: true` | Debe existir y cumplir el rango; el guardado falla si está vacío. |
| `rut` | `required`, `format: "cl-rut"`, `unique`, `normalize: "cl-rut"` | Debe tener dígito verificador válido y no repetirse entre clientes; la comparación ignora puntos, guion, espacios y distingue la `K` de forma consistente. |
| `canal_contacto` | `required`, sin preselección | El formulario muestra la opción vacía y el guardado falla hasta elegir una. |
| `contacto_*` | `when`, `required`, `group: "contactDetail"`, `format` | Solo se muestra y valida el campo del canal activo; al guardar se descartan los valores de los otros canales. |
| Registro completo | `detailPolicy.entity.blockWhenInvalid` | Si faltan datos obligatorios o el RUT es inválido, la ficha no se abre y se ofrece editar; al guardar válidamente se desbloquea. |
| `rubro` | `label: "Tipo de actividad"`, `type: "select"`, diez `options` | El valor se elige del catálogo; la clave y los valores almacenados no cambian (FR-066). |
| Orden | `order` por campo | `name` 1, `rut` 2, `targetDate` 3, `canal_contacto` y su campo `contactDetail` 4, `rubro` 5, `ejecutivo_asignado` 6 (FR-065). |
| Pistas | `placeholder` por campo | Gris y no persistida: `Ej: 11.111.111-1` en `rut`; `Ej: +56 9 1234 5678`, `Ej: nombre@ejemplo.cl` o `Ej: Sala 2 o enlace` según el canal (FR-062, FR-067). |
| Título de creación | `Nuevo ${labels.entity}` | «Nuevo Cliente» en el formulario y la acción rápida (FR-064). |

La búsqueda del perfil de clientes deriva sus campos de estas reglas: solo `name`, `targetDate` y campos personalizados visibles y buscables. La utilidad `src/utils/field-formats.js` expone los formatos `cl-rut`, `phone`, `email` y `nonEmpty` sin dependencias externas.

**Nota de diseño**: una versión anterior de este documento describía un esquema relacional (`customers`, `customer_interactions`, `support_tickets`, `sales_opportunities`, `users`) que asumía una base de datos SQL con backend. Ese diseño era incompatible con la arquitectura elegida en `plan.md` (aplicación Vite sin backend, persistencia en `localStorage`, ver `research.md`) y con `contracts/entity-storage.md`, e introducía entidades (`support_tickets`, `sales_opportunities`, `users`) sin respaldo en ninguna historia de usuario o requisito funcional de `spec.md`. Se reemplazó por el modelo de esta sección para mantener un único modelo de datos consistente en toda la funcionalidad.
