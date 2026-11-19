# Customer Relationship Management (CRM)

**Módulo:** Gestión de Relaciones con los Clientes  
**Equipo:** Grupo 20  
**Asignatura:** Modelación de Sistemas, 2026-2  
**Universidad de Concepción**

## Integrantes

| Nombre | Usuario de GitHub |
| --- | --- |
| Amira Paz Díaz Palma | amira-diaz |
| Alfonso Esteban Innocenti Salgado | innoaeis |
| Anthonella Ignacia Muñoz Cifuentes | anthonellamunoz |
| Camelia Paz Barriga Acuña | cameliabarriga |
| Gabriela Lisette Almonacid Vargas | Galmonacid19 |
| Valentina Ignacia Pinela Navarro | valpinela |

## Propósito del proyecto

Nuestro proyecto tiene como propósito diseñar y desarrollar un módulo de Customer Relationship Management (CRM) para un sistema ERP, orientado a facilitar la gestión de las relaciones entre una empresa y sus clientes. Buscamos reunir de forma organizada la información de los clientes y sus interacciones con la empresa, para que los equipos de ventas y atención al cliente puedan consultar antecedentes, dar seguimiento a sus contactos e identificar oportunidades de mejora en la atención. Con ello, queremos contribuir a una gestión comercial más ordenada, una atención más oportuna y una mejor experiencia para los clientes.

Para lograrlo, nos proponemos construir un producto mínimo viable (MVP) como prototipo funcional de frontend, a partir del template del curso y mediante desarrollo guiado por especificaciones (Spec Driven Development). Definiremos un modelo entidad-relación coherente con los datos compartidos entre los módulos del ERP y una interfaz que permita demostrar las funciones básicas de nuestro CRM. Este prototipo servirá para evaluar la utilidad de la propuesta y sentar las bases para futuras mejoras, considerando la facilidad de uso, la posibilidad de integración con otros módulos y el manejo responsable de la información de los clientes.
# ERP Software Base Module (Vite + Vanilla JS)

Minimal single-page app serving as an Enterprise Resource Planning (ERP) software base module. It provides the common foundation for building custom ERP modules: master data management (Entities) and linked transactional documents (Documents) with create/edit/delete/search, validation, and browser localStorage persistence — using Vite and vanilla HTML, CSS, and JavaScript. See `specs/001-erp-base-module/` for the full specification (15 user stories, functional requirements, data model).

The user interface is fully in **Spanish** (default terms: Entidad / Documento; module name: Módulo Base ERP), including labels, validation messages, empty states, and dialogs.

Entities carry base master-data fields (name, code, category, description, target date). Documents link to exactly one entity and carry base fields (start/end date, notes, status). Any domain-specific field (tax ID, credit limit, interaction type, invoice folio, etc.) is added by a custom module through `customFields`, without changing the storage layer (see `specs/001-erp-base-module/data-model.md`).

The app presents itself as a coherent ERP workspace:

- **Workspace shell** (`src/components/shell.js`) — every screen lives inside a branded chrome: a top bar with a logo (an SVG monogram derived from the module name) and module name, plus a persistent sidebar with buttons for Panel, Entidades, Documentos, Buscar and Resumen. The active module is highlighted (`aria-current="page"`), and the sidebar collapses to an icon rail on narrow viewports (≤640px).
- **Home dashboard** (`src/components/dashboard.js`) — the entry screen offers quick-action buttons for key ERP tasks (new entity, new document, open management area, find records) and live statistic cards showing record counts.
- **Management screen** (`src/app.js`, `manage-entity` / `manage-document`) — a dedicated screen with an Entidades/Documentos tab to create, edit and delete records; it does not show the full entity list (that lives in Search), per the base module's navigation model.
- **Search screen** — finds entities by name, code, category, description, target date or custom field values, updating results as you type; selecting a result opens its **ficha** (`src/components/entity-detail.js`) with its document history sorted by date.
- **Resumen de Gestión Comercial** (`src/components/commercial-summary.js`) — totals of entities/documents and documents with a "pendiente" status, grouped by entity.
- **Design tokens** — styling is driven by CSS custom properties in `src/styles.css`, so branding (including `theme.accentColor`) applies globally.

## Setup

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Open http://localhost:5173 (or the URL Vite prints).

## Tests

Run the full test suite (unit + integration, Vitest + jsdom) with:

```bash
npm test
```

## Building Custom Modules

Custom ERP modules built on this base define:

- What an **Entity** represents (e.g., customer, product, asset) plus domain-specific fields.
- What a **Document** represents (e.g., order, invoice, contract, interaction).
- Module-specific labels, custom fields and status lifecycle.

The base module handles identity generation, timestamps, referential integrity between entities and documents, cascade deletion, navigation, and search. Custom modules never edit `src/storage.js`, `src/app.js` or any component file — only `src/module-config.js`.

## Tailoring via Configuration

All tailoring lives in one place: the `MODULE_CONFIG` export at the top of `src/module-config.js` (`null` by default, meaning "use the base module as-is"). A custom module replaces it with an object such as:

```js
export const MODULE_CONFIG = {
  moduleName: 'Ventas',
  labels: { entity: 'Cliente', entityPlural: 'Clientes', document: 'Pedido de Venta', documentPlural: 'Pedidos de Venta' },
  customFields: {
    entity: [{ key: 'creditLimit', label: 'Límite de crédito', type: 'number', required: true }],
    document: [{ key: 'folio', label: 'Folio', type: 'number', required: true }],
  },
  statusLifecycle: {
    states: ['cotizacion', 'pedido', 'facturado'],
    transitions: { cotizacion: ['pedido'], pedido: ['facturado'] },
  },
  theme: { accentColor: '#1a73e8' },
};
```

- `moduleName` — display name shown in the top bar, dashboard, and document title; also derives the logo monogram.
- `labels` — rename Entity/Document terms (`entity`, `entityPlural`, `document`, `documentPlural`, `dashboard`, `manage`, `search`, `summary`) across every screen.
- `customFields.entity` / `customFields.document` — extra fields per record type: `key`, `label`, `type` (`text`, `number`, `date`, `select`, or `boolean`), optional `required`, and `options` for `select`. Keys must not collide with base field names.
- `statusLifecycle` — restrict document `status` to a declared list of `states` with permitted `transitions` between them. Without it, status stays a free-form field. A state named `pendiente` feeds the Resumen de Gestión Comercial's pending count.
- `theme.accentColor` — a hex color (e.g., `"#0f62fe"`) applied across the shell. An invalid value falls back to the default silently, without affecting the rest of the configuration.

If the rest of the configuration is invalid (unknown field types, custom field keys colliding with base fields, status transitions referencing undeclared states), the app shows the problem in a banner and falls back to the full base defaults instead of breaking.

## Notes

- Data is persisted to `localStorage` under the keys `erp_entities` and `erp_documents`.
- Deleting an entity also deletes its documents (cascade), after a confirmation that states how many documents will be removed.
- User-entered text is escaped before being rendered (`src/utils/sanitize.js`) to prevent XSS via localStorage-sourced content.
- This project intentionally uses vanilla HTML, CSS, and JavaScript for simplicity.
