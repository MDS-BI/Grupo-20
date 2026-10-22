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

Minimal single-page app serving as an Enterprise Resource Planning (ERP) software base module. It provides the common foundation for building custom ERP modules: master data management (Entities) and linked transactional documents (Documents) with create/edit/delete/search, validation, and browser localStorage persistence — using Vite and vanilla HTML, CSS, and JavaScript.

The user interface is fully in **Spanish** (default terms: Entidad / Documento; module name: Módulo Base ERP), including labels, validation messages, empty states, and dialogs.

Entities carry standard ERP master-data fields (name, code, tax ID, email, phone, address, category, target date, credit limit, payment terms). Documents use series + folio numbering and carry a monetary breakdown (subtotal, discount, tax, total), currency, payment terms, notes, quantity, dates, and status.

The app presents itself as a coherent ERP workspace:

- **Workspace shell** — every screen lives inside a branded chrome: a top bar with a logo (an SVG monogram derived from the module name) and module name, plus a persistent sidebar of module buttons (Panel, Entidades, Documentos, Búsqueda). The active module is highlighted (`aria-current="page"`), and the sidebar collapses to an icon rail on narrow viewports.
- **Home dashboard** — the entry screen offers quick-action buttons for key ERP tasks (new entity, new document, open management areas, find records) and live statistic cards showing record counts.
- **Design tokens** — styling is driven by CSS custom properties in `src/styles.css`, so branding changes apply globally.

## Setup

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Open http://localhost:5173 (or the URL Vite prints).

## Tests

Run the full test suite (unit + integration) with:

```bash
npm test
```

Or a one-off run without watch mode:

```bash
npx vitest run
```

## Building Custom Modules

Custom ERP modules built on this base define:

- What an **Entity** represents (e.g., customer, product, asset) plus domain-specific fields.
- What a **Document** represents (e.g., order, invoice, contract).
- Module-specific labels and validation rules.

The base module handles identity generation, timestamps, referential integrity between entities and documents, cascade deletion, navigation, and search. See `specs/001-erp-base-module/` for the full specification.

## Tailoring via Configuration

All tailoring lives in one place: the `userConfig` object at the top of `src/module-config.js`. Developers edit this single export; no core code changes are required. Available knobs:

- `moduleName` — display name shown in the top bar, dashboard, and document title; also derives the logo monogram.
- `labels` — rename Entity/Document terms across every screen, including sidebar buttons, quick actions, forms, and messages. Spanish articles and agreements (el/la, seleccionado/a) are derived from the first word of each configured term.
- `customFields` — declare extra fields per record type with `target` (`entity` or `document`), `key`, `label`, `type` (`text`, `number`, `date`, or `select`), optional `required`, and `options` for selects. Keys must not collide with base field names (see `specs/001-erp-base-module/data-model.md`). Values persist alongside records and appear in search results.
- `statusLifecycle` — restrict document statuses to a configured list of `statuses` with permitted `transitions` between them. Without it, status stays a free-form field.
- `theme.accentColor` — a hex color (e.g., `"#0f62fe"`) applied across the shell as highlights and primary controls. Invalid values fall back to the default.

If the configuration is invalid (unknown types, bad keys, transitions referencing unknown statuses, non-hex accent colors), the app shows the problems in a banner and falls back to defaults instead of breaking.

## Notes

- Data is persisted to `localStorage` under the keys `erp_base_module:entities` and `erp_base_module:documents`.
- Deleting an entity also deletes its documents (cascade).
- This project intentionally uses vanilla HTML, CSS, and JavaScript for simplicity.
