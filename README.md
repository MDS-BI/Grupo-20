# Customer Relationship Management (CRM)

**Módulo:** Gestión de Relaciones con los Clientes  
**Equipo:** Grupo 20  
**Asignatura:** Modelación de Sistemas, 2026-2  
**Universidad de Concepción**

## Integrantes

| Nombre                             | Usuario de GitHub |
| ---------------------------------- | ----------------- |
| Amira Paz Díaz Palma               | amira-diaz        |
| Alfonso Esteban Innocenti Salgado  | innoaeis          |
| Anthonella Ignacia Muñoz Cifuentes | anthonellamunoz   |
| Camelia Paz Barriga Acuña          | cameliabarriga    |
| Gabriela Lisette Almonacid Vargas  | Galmonacid19      |
| Valentina Ignacia Pinela Navarro   | valpinela         |

## Propósito del proyecto

Nuestro proyecto tiene como propósito diseñar y desarrollar un módulo de Customer Relationship Management (CRM) para un sistema ERP, orientado a facilitar la gestión de las relaciones entre una empresa y sus clientes. Buscamos reunir de forma organizada la información de los clientes y sus interacciones con la empresa, para que los equipos de ventas y atención al cliente puedan consultar antecedentes, dar seguimiento a sus contactos e identificar oportunidades de mejora en la atención. Con ello, queremos contribuir a una gestión comercial más ordenada, una atención más oportuna y una mejor experiencia para los clientes.

Para lograrlo, nos proponemos construir un producto mínimo viable (MVP) como prototipo funcional de frontend, a partir del template del curso y mediante desarrollo guiado por especificaciones (Spec Driven Development). Definiremos un modelo entidad-relación coherente con los datos compartidos entre los módulos del ERP y una interfaz que permita demostrar las funciones básicas de nuestro CRM. Este prototipo servirá para evaluar la utilidad de la propuesta y sentar las bases para futuras mejoras, considerando la facilidad de uso, la posibilidad de integración con otros módulos y el manejo responsable de la información de los clientes.

# ERP Software Base Module (Vite + Vanilla JS)

Aplicación de una sola página construida con Vite y JavaScript vanilla. Sirve de base para módulos ERP: entidades (datos maestros), documentos vinculados, búsqueda, validación y persistencia en `localStorage`. La especificación completa está en `specs/001-erp-base-module/`.

La interfaz está en español. El perfil activo es **CRM Comercial** (Cliente / Interacción); sin configuración se usan Entidad / Documento. Los campos propios de cada dominio se declaran en `customFields` (ver `specs/001-erp-base-module/data-model.md`).

La aplicación se presenta como un espacio de trabajo ERP coherente:

- **Marco** (`src/components/shell.js`): barra superior con logotipo y nombre del módulo, y barra lateral persistente con **Panel, Buscar, Resumen y Marketing**. El módulo activo queda resaltado; en pantallas estrechas (≤640 px) la barra se reduce a iconos. «Clientes» e «Interacciones» no figuran en la barra lateral: se gestionan desde el panel o mediante `?view=manage-entity` y `?view=manage-document`.
- **Panel** (`src/components/dashboard.js`): cinco acciones rápidas (nueva entidad, nuevo documento, gestionar entidades, gestionar documentos y buscar registros) y tarjetas con conteos en vivo. No incluye «Abrir Marketing».
- **Marketing** (`src/components/marketing.js`): el formulario público de captura (`?view=capture`) crea prospectos solo con consentimiento explícito. La vista comparte con el panel las cinco tarjetas, el embudo por estados de documento y la lista «Últimas Interacciones / Próximos Seguimientos». No muestra la torta «Estado comercial de la cartera» ni el selector de etapas; `estado_comercial` se conserva solo de forma interna para las reglas automáticas.
- **Gestión** (`src/app.js`): pantalla con pestañas Entidades/Documentos para crear, editar y eliminar registros; la lista completa de entidades está en Buscar.
- **Buscar**: consulta los campos declarados como `searchable` en `fieldRules` y abre la ficha (`src/components/entity-detail.js`) con el historial ordenado por fecha.
- **Resumen de Gestión Comercial** (`src/components/commercial-summary.js`): totales y pendientes por entidad.
- **Estilos**: variables CSS en `src/styles.css`, incluido `theme.accentColor`.

## Puesta en marcha y verificación

```bash
npm install
npm run dev
npm test
npm run lint
```

`npm install` instala dependencias; `npm run dev` inicia Vite (http://localhost:5173 o la URL que indique); `npm test` ejecuta la suite unitaria y de integración (Vitest + jsdom); `npm run lint` comprueba el código con ESLint.

## Usuarios de demostración

El inicio de sesión funciona en modo demostración: la pantalla ofrece un botón por usuario activo, sin campos de usuario ni contraseña. Al pulsarlo se inicia sesión directamente con ese usuario y su rango vigente; no hay hash, contraseñas incorrectas ni bloqueo por intentos fallidos. La sesión persiste, expira tras 8 horas de inactividad y se revoca al desactivar al usuario.

| Usuario     | Rango                            | Capacidades principales                                                                                                |
| ----------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `gerente`   | Nivel 4 - Gerente Comercial      | Acceso total; gestiona usuarios, equipos, clientes, documentos, resumen completo y campañas de cualquier usuario.      |
| `marketing` | Nivel 3 - Ejecutivo de Marketing | Capta prospectos, gestiona campañas y chat, ve fichas y solo lee «Equipo de ventas y logros»; sin resumen ni borrados. |
| `ventas`    | Nivel 2 - Ejecutivo de Ventas    | Crea y edita sus clientes y documentos, ve su propio resumen y su real/objetivo; no elimina ni ve el resumen completo. |
| `atencion`  | Nivel 1 - Atencion al Cliente    | Busca fichas e historiales, registra «Llamada» o «Correo» y da seguimiento al chat; sin resumen, Marketing ni equipo.  |

Los cuatro botones iniciales se etiquetan «Gerente», «Marketing», «Ventas» y «Atención al Cliente»; los usuarios creados por Gerencia aparecen detrás, en orden de registro, y los desactivados dejan de ofrecerse. Los rangos conservan la matriz única de permisos definida en `specs/001-erp-base-module/spec.md`.

**Limitación de `?view=capture`**: no hay backend, por lo que la captura pública y el chat embebido requieren el **mismo origen** (host y puerto) que la aplicación; no se pueden incrustar en otro dominio ni resolverse añadiendo dependencias. Los registros quedan en el `localStorage` de esa aplicación, como describe `specs/001-erp-base-module/contracts/marketing.md`.

## Building Custom Modules

Custom ERP modules built on this base define:

- What an **Entity** represents (e.g., customer, product, asset) plus domain-specific fields.
- What a **Document** represents (e.g., order, invoice, contract, interaction).
- Module-specific labels, custom fields, status lifecycle and optional entity date rule.

The base module handles identity generation, timestamps, referential integrity between entities and documents, cascade deletion, navigation, and search. Custom modules never edit `src/storage.js`, `src/app.js` or any component file — only `src/module-config.js`.

## Tailoring via Configuration

All tailoring lives in one place: the `MODULE_CONFIG` export at the top of `src/module-config.js`, active by default as the **CRM Comercial** profile. Replacing it with `null` runs the base module as-is (Entidad / Documento). A custom module replaces it with an object such as:

```js
export const MODULE_CONFIG = {
  moduleName: 'Ventas',
  labels: {
    entity: 'Cliente',
    entityPlural: 'Clientes',
    document: 'Pedido de Venta',
    documentPlural: 'Pedidos de Venta',
  },
  customFields: {
    entity: [{ key: 'creditLimit', label: 'Límite de crédito', type: 'number', required: true }],
    document: [{ key: 'folio', label: 'Folio', type: 'number', required: true }],
  },
  statusLifecycle: {
    states: ['cotizacion', 'pedido', 'facturado', 'pendiente'],
    pendingStates: ['pendiente'],
    transitions: { cotizacion: ['pedido'], pedido: ['facturado'] },
  },
  theme: { accentColor: '#1a73e8' },
  entityDate: {
    label: 'Fecha de nacimiento',
    min: '1910-01-01',
    max: 'localToday',
    required: true,
  },
};
```

- `moduleName` — display name shown in the top bar, dashboard, and document title; also derives the logo monogram.
- `labels` — rename Entity/Document terms (`entity`, `entityPlural`, `document`, `documentPlural`, `dashboard`, `manage`, `search`, `summary`) across every screen.
- `customFields.entity` / `customFields.document` — extra fields per record type: `key`, `label`, `type` (`text`, `number`, `date`, `select`, or `boolean`), optional `required`, and `options` for `select`. Custom fields and `fieldRules` also accept `placeholder`, `order`, and `options` as strings or `{ value, label }` objects. Keys must not collide with base field names.
- `statusLifecycle` — restrict document `status` to a declared list of `states` with permitted `transitions` between them. Without it, status stays a free-form field. `pendingStates` marks which declared states feed the Resumen de Gestión Comercial's pending count; without it, the normalized text `pendiente` is used.
- `theme.accentColor` — a hex color (e.g., `"#0f62fe"`) applied across the shell. An invalid value falls back to the default silently, without affecting the rest of the configuration.
- `entityDate` — optional label and inclusive ISO range for the base entity date field; `max: "localToday"` follows the user's local date and updates when the local day changes while the app is open. Existing out-of-range values are preserved until the record is edited. `required: true` makes the date mandatory.
- `fieldRules` — declarative per-entity/document rules: `required`, `hidden`, `searchable`, `generated`, `unique`, `format`, `normalize`, `when` and `group`. The active CRM profile generates an internal `CLI-###` code, hides `code`/`category`/`description`, requires a valid unique Chilean RUT, and shows the contact field only for the selected channel (`llamada`, `correo`, `reunión`, `whatsapp`). Inactive channel values are discarded on save; hidden historical values stay in storage.
- `detailPolicy` — controls the ficha for inherited incomplete records. With `entity.blockWhenInvalid: true`, the detail view shows the pending fields and an edit action instead of the normal query.
- `marketing` — optional block with `privacyNoticeVersion`, `captureFields` and `automationRules`. A rule declares `event` (`entity_created`, `stage_changed`, `document_created`), optional `from`/`to` stages, `action` and `label`; each execution is stored as an `automatico` document linked to the prospect.

If the rest of the configuration is invalid (unknown field types, custom field keys colliding with base fields, status transitions referencing undeclared states), the app shows the problem in a banner and falls back to the full base defaults instead of breaking.

## Notes

- Data is persisted to `localStorage` under the keys `erp_entities` and `erp_documents`.
- Deleting an entity also deletes its documents (cascade), after a confirmation that states how many documents will be removed.
- Navigating away from a modified form asks for confirmation before discarding unsaved changes.
- User-entered text is escaped before being rendered (`src/utils/sanitize.js`) to prevent XSS via localStorage-sourced content.
- In the CRM profile, `code`, `category`, `description` and `pedidos` are no longer rendered, but previously stored values are preserved; the code for new clients is generated internally as `CLI-001`, `CLI-002`, and so on.
- Conditional contacts are stored only for the chosen channel and are validated by format (`cl-rut`, `phone`, `email`, `nonEmpty`) and uniqueness rules from `fieldRules`.
- Incomplete inherited clients show a blocked ficha with the missing fields and an edit action; editing and saving valid data unlocks it.
- The CRM form shows gray placeholders: `Ej: 11.111.111-1` for `rut` and a format hint for the active contact field; placeholders are never stored or validated as values.
- CRM fields render in this order: `name`, `rut`, `targetDate`, `canal_contacto` plus its active contact field, `rubro`, `ejecutivo_asignado`. `rubro` is a select labeled «Tipo de actividad» and keeps its storage key.
- Both `12.345.678-9` and `12345678-9` are accepted for RUT and compared normalized for uniqueness. The creation heading and dashboard quick action read «Nuevo Cliente».
- This project intentionally uses vanilla HTML, CSS, and JavaScript for simplicity.

## Validación del apartado de Marketing

1. Abra `?view=capture` en el mismo origen de la aplicación y envíe el formulario sin consentimiento: debe mostrar un error y no crear la entidad.
2. Envíe el formulario con consentimiento: se crea una entidad en estado `prospecto` y se registra la ejecución automática de captura en su historial.
3. Acceda a **Marketing** desde la barra lateral: las cinco tarjetas del panel (entidades, documentos, «Cerrado ganado», «Tasa de conversión» y «Pipeline (USD)») y el embudo por estados de documento coinciden con el panel, junto a «Últimas Interacciones / Próximos Seguimientos». No aparecen la torta «Estado comercial de la cartera» ni el selector de etapas.
4. Tras crear o editar un documento, las tarjetas y el embudo se actualizan sin recargar; las reglas automáticas dejan constancia en el historial de la entidad.

## Validación de la navegación lateral

1. La barra lateral ofrece Panel, Buscar, Resumen y Marketing, con el módulo activo resaltado; no aparecen Clientes ni Interacciones.
2. El panel ofrece cinco acciones rápidas, sin «Abrir Marketing».
3. Los enlaces profundos `?view=manage-entity` y `?view=manage-document` siguen abriendo las vistas de gestión aunque no estén en la barra lateral.
