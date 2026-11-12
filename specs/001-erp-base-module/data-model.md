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
| `code` | string | Sí | Código de negocio único (comparación sin distinguir mayúsculas ni espacios, FR-001). |
| `category` | string | No | Categoría de clasificación, usada en búsqueda (FR-004). |
| `description` | string | No | Detalle descriptivo. |
| `targetDate` | string (ISO date) | No | Fecha objetivo opcional (Historia de Usuario 10). |
| `createdAt` / `updatedAt` | string (ISO timestamp) | Sí | Marcas de tiempo de auditoría. |
| *(campos personalizados)* | según configuración | según configuración | Declarados en `module-config.js`; se persisten junto a los campos base sin cambio de esquema (XR-001, Historia de Usuario 8). |

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

**Nota de diseño**: una versión anterior de este documento describía un esquema relacional (`customers`, `customer_interactions`, `support_tickets`, `sales_opportunities`, `users`) que asumía una base de datos SQL con backend. Ese diseño era incompatible con la arquitectura elegida en `plan.md` (aplicación Vite sin backend, persistencia en `localStorage`, ver `research.md`) y con `contracts/entity-storage.md`, e introducía entidades (`support_tickets`, `sales_opportunities`, `users`) sin respaldo en ninguna historia de usuario o requisito funcional de `spec.md`. Se reemplazó por el modelo de esta sección para mantener un único modelo de datos consistente en toda la funcionalidad.
