---
description: 'Lista de tareas para la implementación del módulo base ERP'
---

# Tasks: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

**Entrada**: Documentos de diseño de `/specs/001-erp-base-module/`

**Prerrequisitos**: `plan.md` (obligatorio), `spec.md` (obligatorio), `research.md`, `data-model.md`, `contracts/entity-storage.md`, `contracts/marketing.md`, `contracts/auth.md`, `contracts/postventa.md`, `quickstart.md`

**Pruebas**: Se incluyen pruebas automatizadas por `plan.md` y `quickstart.md` con Vitest/jsdom (`npm test`, `npm run lint`, `npm run format:check`); cada suite de prueba se escribe antes de la implementación correspondiente y debe fallar primero.

**Organización**: Las tareas se agrupan por historia de usuario en el orden de prioridad de `spec.md`: P1 (US1, US3, US4, US5, US7, US8, US14, US15, US22, US23) y P2 (US2, US6, US9, US10, US11, US12, US13, US16, US17, US18, US19, US20, US21, US25). Dentro de cada fase, las pruebas preceden a la implementación cuando es razonable. US24 permanece documentada en `spec.md` pero sin fase en este incremento por no contar con artefactos de diseño propios.

**Incremento actual**: T134-T145 (grupo) cubren `FR-091`, `FR-092`, `FR-093`, `SC-027`, `SC-028` y `SC-029`; T146-T194 (usuario) cubren `FR-094`–`FR-102` y `SC-030`–`SC-037`; T195-T210 (Postventa) cubren `FR-104`–`FR-109` y `SC-039`–`SC-040`; conservan T001-T194 como historial completado.

**Convención de historias desglosadas**: `spec.md` conserva `US1`–`US23` como epígrafes de trazabilidad y detalla las responsabilidades en subhistorias `US2a`–`US2d`, `US3a`–`US3b`, `US4a`–`US4c`, `US6a`–`US6b`, `US8a`–`US8b`, `US10a`–`US10c`, `US11a`–`US11b`, `US13a`–`US13b`, `US14a`–`US14b`, `US15a`–`US15b`, `US16a`–`US16d`, `US17a`–`US17b`, `US18a`–`US18b`, `US19a`–`US19b`, `US20a`–`US20c`, `US21a`–`US21b`, `US22a`–`US22c` y `US23a`–`US23c`. Las etiquetas de tarea siguen siendo `[USn]`; cuando una tarea cubre una responsabilidad concreta, la descripción indica la subhistoria sin renumerar IDs.

## Formato: `[ID] [P?] [Historia] Descripción`

- El checkbox es siempre `- [ ]`; los ID son secuenciales T001, T002, ...
- **[P]**: la tarea toca archivos distintos y no depende de tareas incompletas.
- **[Historia]**: obligatorio solo en las fases de historia de usuario (`[US1]` ... `[US23]`, `[US25]`); ausente en Setup, Foundational y Polish.
- La descripción nombra siempre la ruta de archivo concreta y el resultado esperado.

## Convenciones de rutas

- Proyecto único: `index.html`, `package.json`, `vitest.config.mjs`, `src/` y `tests/` en la raíz del repositorio.
- Utilidades puras en `src/utils/`; componentes de interfaz en `src/components/`; pruebas unitarias en `tests/unit/` y de integración en `tests/integration/`.
- Sin backend y sin dependencias nuevas: persistencia en `localStorage` bajo `erp_entities`, `erp_documents` y `erp_marketing_config` para las definiciones editables de Marketing; los indicadores derivados no se persisten.

---

## Phase 1: Setup (infraestructura compartida)

**Propósito**: Confirmar el entorno Vite + JavaScript vanilla existente; no se añaden librerías.

- [x] T001 [P] Verificar en `package.json` que `npm test` ejecuta `vitest run`, `npm run lint` ejecuta `eslint .` y no aparecen dependencias nuevas.
- [x] T002 [P] Verificar en `vitest.config.mjs` que `environment: 'jsdom'`, `setupFiles` y `fileParallelism: false` soportan las suites de DOM planeadas.
- [x] T003 [P] Verificar en `index.html` que el único punto de entrada monta `#app` y carga `src/main.js`, sin backend ni scripts externos.
- [x] T004 [P] Verificar en `tests/setup/test-setup.js` que `localStorage` y el DOM se reinician entre pruebas y que `window.confirm` puede simularse.

**Punto de control**: Entorno listo para escribir pruebas que fallan antes de la implementación.

---

## Phase 2: Foundational (prerrequisitos bloqueantes)

**Propósito**: Contratos compartidos de almacenamiento, configuración, formatos, reglas de campo y sanitización. **CRÍTICO**: ninguna historia de usuario puede comenzar hasta completar esta fase.

- [x] T005 [P] Ampliar `tests/unit/storage.test.js` con casos de `loadEntities()`, `saveEntities()`, `addEntity()`, `updateEntity()`, `deleteEntity()`, `loadDocuments()` y `addDocument()` que exijan persistencia en `erp_entities`/`erp_documents` y marcas de tiempo ISO.
- [x] T006 Implementar en `src/storage.js` las operaciones base de lectura/escritura, `ValidationError`, `generateEntityId()` y la conservación del orden de listas y de las marcas `createdAt`/`updatedAt`.
- [x] T007 [P] Ampliar `tests/unit/module-config.test.js` para exigir que `validateConfig()`, `loadModuleConfig()` y `normalizeConfig()` acepten un perfil válido y devuelvan `DEFAULT_CONFIG` con una lista de errores ante configuración inválida o conflictiva.
- [x] T008 Implementar en `src/module-config.js` `DEFAULT_CONFIG`, `validateConfig()`, `loadModuleConfig()`, `normalizeConfig()`, `getLabel()`, `setActiveConfig()`, `getConfig()` y `sanitizeAccentColor()`, sin tocar los componentes.
- [x] T009 [P] Ampliar `tests/unit/field-formats.test.js` con casos de `cl-rut` (`12345678-9` y `12.345.678-9`), `phone`, `email`, `nonEmpty` y `normalizeClRut()` eliminando puntos, guion y espacios.
- [x] T010 Implementar en `src/utils/field-formats.js` `FORMAT_NAMES`, `hasFormat()`, `rutDigit()`, `normalizeClRut()`, `formatRut()`, `isValidRut()`, `isValidPhone()`, `isValidEmail()`, `isNonEmpty()` y `isValidFormat()` sin dependencias nuevas.
- [x] T011 [P] Ampliar `tests/unit/field-rules.test.js` con casos de `hidden`, `searchable`, `required`, `format`, `normalize`, `when`, `group`, `order`, `placeholder` y opciones `{ value, label }` sobre campos base y personalizados.
- [x] T012 Implementar en `src/utils/field-rules.js` `resolveFieldRules()`, `isConditionActive()`, `isFieldSearchable()`, `isFieldPotentiallySearchable()` y `pruneInactiveGroupValues()` con comportamiento base intacto cuando no hay reglas.
- [x] T013 [P] Ampliar `tests/unit/sanitize.test.js` con entradas que contengan `<script>`, comillas en atributos y enlaces `javascript:` para exigir escape en texto y atributos.
- [x] T014 Implementar en `src/utils/sanitize.js` `escapeHtml()` y `sanitizeText()` para todo contenido persistido que se renderice en el DOM.

**Punto de control**: Base compartida lista; las historias pueden implementarse de forma independiente.

---

## Phase 3: US1 - Definir datos compatibles con el ERP (Prioridad: P1)

**Objetivo**: Modelo de `Entidad` y `Documento` con identificadores, código interno único y vínculo referencial verificable.

**Prueba independiente**: Registrar un cliente de prueba y una interacción asociada; el sistema guarda la relación, asigna un código interno único sin solicitarlo y rechaza una interacción con `entity_id` inexistente.

### Pruebas de US1

- [x] T015 [P] [US1] Ampliar `tests/unit/storage.test.js` con `addEntity()` y `fieldRules.entity.code.generated` activo: genera `CLI-001`, rechaza códigos repetidos aunque difieran en mayúsculas o espacios, y asigna `id` y `entity_id` únicos.
- [x] T016 [P] [US1] Crear `tests/integration/entity-relations.test.js` para registrar un cliente y una interacción, recargar `erp_entities`/`erp_documents` y comprobar que el documento conserva el `entity_id` correcto.

### Implementación de US1

- [x] T017 [US1] Implementar en `src/storage.js` `generateBusinessCode()` y la comprobación de unicidad de `code` en `validateEntityData()` usando recorte, minúsculas y eliminación de espacios.
- [x] T018 [US1] Implementar en `src/storage.js` la validación de `entity_id` en `validateDocumentData()` con `errors.entity_id` claro y `countDocumentsForEntity()` para devolver el número de documentos vinculados.

**Punto de control**: La relación entidad-documento y la identidad única son verificables de forma independiente.

---

## Phase 4: US3 - Consultar antecedentes del cliente (Prioridad: P1)

**Objetivo**: Buscar una entidad, abrir su ficha y revisar un historial cronológico consistente con los registros y sus ediciones.

**Prueba independiente**: Buscar un cliente, abrir su ficha desde los resultados y comprobar que muestra sus datos y documentos ordenados por fecha, reflejando las ediciones hechas en gestión.

### Pruebas de US3

- [x] T019 [P] [US3] Ampliar `tests/integration/entity-detail.test.js` para buscar por nombre, abrir la ficha desde `src/components/entity-list.js` y verificar historial ordenado por fecha y estado vacío sin coincidencias.
- [x] T020 [P] [US3] Ampliar `tests/integration/client-history.test.js` para editar una interacción en gestión y confirmar que la ficha del cliente muestra el cambio sin recarga.

### Implementación de US3

- [x] T021 [US3] Implementar `getEntityDocuments()` en `src/storage.js` filtrando por `entity_id` y ordenando por `startDate || createdAt` de forma estable.
- [x] T022 [US3] Implementar `renderEntityDetailHtml()` en `src/components/entity-detail.js` con datos de la entidad, historial ordenado, estado vacío y acción «Editar».
- [x] T023 [US3] Añadir en `src/components/entity-list.js` el botón «Ver ficha» con `data-action="view-entity"` y `data-entity-id`, conectado en `src/app.js` a `state.detailEntityId`.

**Punto de control**: La ficha consulta los mismos registros de gestión y presenta el historial cronológicamente.

---

## Phase 5: US4 - Gestionar entidades y documentos en una pantalla dedicada (Prioridad: P1)

**Objetivo**: Una única pantalla de gestión, alcanzable solo desde el panel, con pestañas de entidades y documentos y CRUD completo sin mostrar la lista de entidades.

**Prueba independiente**: Entrar por una acción rápida del panel, alternar pestañas, crear/editar/eliminar una entidad y un documento, confirmar la cascada con recuento y volver al panel.

### Pruebas de US4

- [x] T024 [P] [US4] Ampliar `tests/integration/manage-screen.test.js` para comprobar que las acciones rápidas abren la gestión, que la lista de entidades no aparece en `#view-root` y que la barra lateral no ofrece esos apartados.
- [x] T025 [P] [US4] Ampliar `tests/integration/manage-document.test.js` para crear, editar y eliminar un documento vinculado a una entidad desde la pestaña de documentos.
- [x] T026 [P] [US4] Ampliar `tests/integration/edit-delete-entity.test.js` para confirmar que eliminar una entidad pide confirmación, indica cuántos documentos se borrarán y elimina ambos registros.

### Implementación de US4

- [x] T027 [US4] Implementar `renderManageView()`, `activeNavKey()` y los casos `manage-tab`, `quick-manage` y `quick-new-*` en `src/app.js`, soportando enlaces profundos `?view=manage-entity` y `?view=manage-document`.
- [x] T028 [US4] Implementar `renderDocumentFormHtml()`, `collectDocumentFormData()`, `buildDocumentFormBaseline()` e `isDocumentFormDirty()` en `src/components/document-form.js` con selector de entidad y campos base/personalizados.
- [x] T029 [US4] Implementar `onDeleteEntity()` en `src/app.js` usando `countDocumentsForEntity()` de `src/storage.js` para el mensaje de confirmación con recuento y la eliminación en cascada.

**Punto de control**: Gestión y navegación de vuelta al panel funcionan sin pérdida de registros.

---

## Phase 6: US5 - Definir un perfil de configuración del módulo (Prioridad: P1)

**Objetivo**: Adaptar identidad, terminología, campos, ciclo de vida y tema desde un único archivo sin modificar el código central.

**Prueba independiente**: Cargar un perfil de Ventas y ver el nombre y términos configurados en panel y marco; al quitar la configuración, volver a Entidad/Documento sin errores.

### Pruebas de US5

- [x] T030 [P] [US5] Ampliar `tests/unit/module-config.test.js` con un perfil que declare `moduleName`, `labels`, `customFields`, `statusLifecycle` y `theme.accentColor`, y con los casos de ausencia y de configuración conflictiva.
- [x] T031 [P] [US5] Ampliar `tests/integration/config-warning.test.js` para exigir el banner visible `#config-warning` y que el panel, la búsqueda y la gestión sigan utilizables con `DEFAULT_CONFIG`.

### Implementación de US5

- [x] T032 [US5] Completar en `src/module-config.js` la declaración de `MODULE_CONFIG`, `RESERVED_ENTITY_KEYS`, `RESERVED_DOCUMENT_KEYS` y la validación de choques de claves y tipos de campo desconocidos.
- [x] T033 [US5] Conectar `loadModuleConfig()`, `setActiveConfig()`, `document.title` y el banner de advertencia en `initApp()` de `src/app.js`.

**Punto de control**: El perfil se carga, retrocede con aviso y no bloquea la aplicación.

---

## Phase 7: US7 - Reetiquetar pantallas desde la configuración (Prioridad: P1)

**Objetivo**: Toda etiqueta visible derive de `labels` y de la regla de fecha activa, sin filtrar términos genéricos.

**Prueba independiente**: Mapear Entidad→Cliente y Documento→Pedido de Venta; verificar pestañas, botones, encabezados, mensajes de vacío y «Fecha de nacimiento» en todas las pantallas.

### Pruebas de US7

- [x] T034 [P] [US7] Ampliar `tests/integration/relabeling.test.js` para comparar términos configurados frente a `DEFAULT_CONFIG` en `src/components/shell.js`, `src/components/dashboard.js`, `src/components/entity-form.js`, `src/components/document-form.js`, `src/components/entity-list.js`, `src/components/document-list.js`, `src/components/entity-detail.js` y `src/components/search-bar.js`.

### Implementación de US7

- [x] T035 [US7] Sustituir texto fijo por `getLabel(config, clave)` en `src/components/shell.js`, `src/components/dashboard.js`, `src/components/entity-form.js`, `src/components/document-form.js`, `src/components/entity-list.js`, `src/components/document-list.js`, `src/components/entity-detail.js` y `src/components/search-bar.js`.
- [x] T036 [US7] Usar `resolveEntityDateRule(getConfig()).label` en `src/components/entity-form.js`, `src/components/entity-list.js`, `src/components/entity-detail.js` y `src/components/search-bar.js` para mostrar «Fecha de nacimiento» en el perfil de clientes.

**Punto de control**: La terminología es consistente y la navegación no cambia al reetiquetar.

---

## Phase 8: US8 - Declarar campos personalizados para los registros (Prioridad: P1)

**Objetivo**: Que los campos declarados aparezcan en formularios, listas, ficha y búsqueda con validación, y que los valores huérfanos se conserven ocultos.

**Prueba independiente**: Declarar un campo numérico obligatorio; ver entrada numérica, bloqueo al dejarlo vacío, valor visible en lista/ficha y coincidencia en búsqueda.

### Pruebas de US8

- [x] T037 [P] [US8] Ampliar `tests/unit/field-rules.test.js` para verificar reglas sobre campos base y personalizados, grupos exclusivos, condiciones `when` y opciones `{ value, label }`.
- [x] T038 [P] [US8] Ampliar `tests/integration/custom-fields.test.js` con un campo numérico obligatorio que bloquee el guardado vacío y sea buscable y visible en lista y ficha.
- [x] T039 [P] [US8] Ampliar `tests/integration/orphan-fields-ui.test.js` para conservar un valor no declarado en `erp_entities`, ocultarlo y volver a mostrarlo al redeclarar el campo.

### Implementación de US8

- [x] T040 [US8] Completar `src/utils/field-rules.js` para resolver reglas por clave, aplicar `hidden`/`searchable` y descartar valores de grupos inactivos antes de validar.
- [x] T041 [US8] Completar `renderFieldHtml()`, `renderFieldsHtml()`, `collectFormData()`, `buildFormBaseline()` e `isFormDirty()` en `src/components/form-fields.js`, respetando `order`, `placeholder`, `when` y opciones con valor y etiqueta.
- [x] T042 [US8] Conectar validación y persistencia de campos personalizados en `src/storage.js` y su presentación en `src/components/entity-list.js` y `src/components/entity-detail.js`.

**Punto de control**: Los campos declarados funcionan de extremo a extremo sin código específico por dominio.

---

## Phase 9: US14 - Marco de espacio de trabajo ERP con marca (Prioridad: P1)

**Objetivo**: Barra superior con logotipo derivado y barra lateral persistente con las entradas permitidas por rango en todas las pantallas.

**Prueba independiente**: Recorrer las pantallas y comprobar marca, botones laterales permitidos por rango, resaltado del activo, columna de iconos en viewport estrecho, color de acento y persistencia de datos al navegar; «Clientes» e «Interacciones» no figuran en el marcado y el panel no muestra «Abrir Marketing».

### Pruebas de US14

- [x] T043 [P] [US14a] Ampliar `tests/integration/workspace-shell.test.js` para verificar en `src/components/shell.js` el SVG monograma, `#brand-name`, los botones de `NAV_ITEMS` permitidos por rango, `aria-current`, ausencia de Clientes/Interacciones y etiquetas accesibles con la barra contraída.
- [x] T044 [P] [US14] Crear `tests/integration/marketing-navigation.test.js` para abrir Marketing desde la barra lateral, navegar a Panel, Buscar y Resumen, y comprobar que `erp_entities`/`erp_documents` permanecen intactos.

### Implementación de US14

- [x] T045 [US14a] Implementar `monogramSvg()`, `NAV_ITEMS` y `renderShellHtml()` en `src/components/shell.js` con Panel, Buscar, Resumen y Marketing filtrados por `can()`, y añadir la regla de barra estrecha en `src/styles.css`.
- [x] T046 [US14] Aplicar `theme.accentColor` validado por `src/module-config.js` en `src/app.js` mediante `--accent`/`--accent-color`, con valor integrado por defecto en `src/styles.css`.
- [x] T047 [US14] Ajustar `navigate()` y `activeNavKey()` en `src/app.js` para resaltar la vista activa y pedir confirmación antes de salir de un formulario con cambios sin guardar.

**Punto de control**: El marco es idéntico en todas las vistas y la navegación no pierde datos.

---

## Phase 10: US15 - Panel de inicio con acciones rápidas y estadísticas (Prioridad: P1)

**Objetivo**: Panel de entrada con cinco acciones rápidas exclusivamente en el panel y tarjetas de estadísticas en vivo.

**Prueba independiente**: Abrir la aplicación, contar exactamente cinco acciones rápidas en `.dashboard`, navegar a Marketing y verificar que no existe `.quick-actions`, abrir cada destino del panel con formulario vacío o búsqueda enfocada y verificar tarjetas en cero y con registros.

### Pruebas de US15

- [x] T048 [P] [US15] Ampliar `tests/integration/dashboard.test.js` para comprobar las cinco acciones rápidas, la ausencia de «Abrir Marketing», el destino correcto de cada acción, las tarjetas en cero y los recuentos tras crear registros.
- [x] T049 [P] [US15] Ampliar `tests/unit/dashboard-stats.test.js` para exigir entidades, documentos, «Cerrado ganado», «Tasa de conversión» y «Pipeline (USD)», además del embudo por estados de documento, con cero registros.

### Implementación de US15

- [x] T050 [US15] Implementar `renderDashboardHtml()` y `formatCurrencyUsd()` en `src/components/dashboard.js` con las cinco tarjetas, el embudo por estados de documento y la lista «Últimas Interacciones / Próximos Seguimientos».
- [x] T051 [US15] Implementar en `src/app.js` los casos `quick-new-entity`, `quick-new-document`, `quick-manage` y `quick-search`, abriendo el formulario vacío o enfocando `#search-input`.
- [x] T052 [US15] Implementar `computeDashboardStats()` en `src/utils/marketing-stats.js` para derivar tarjetas y embudo desde entidades y documentos, reutilizándolo en `src/components/dashboard.js` sin escribir en `localStorage`.
- [x] T134 [P] [US15] Ampliar `tests/integration/dashboard.test.js` para exigir que `.dashboard .quick-actions` contenga exactamente cinco botones `data-action="quick-*"`/`data-action="navigate"` y que siga sin aparecer «Abrir Marketing» (FR-091).
- [x] T135 [P] [US15] Ampliar `tests/integration/marketing-dashboard.test.js` para comprobar que `.marketing-view .quick-actions` no existe tras navegar a Marketing, mientras el panel conserva los cinco accesos (SC-027).
- [x] T136 [US15] Añadir la opción `showQuickActions = true` a `renderDashboardHtml(config, stats, { title, sectionClass, showQuickActions })` en `src/components/dashboard.js` para omitir `<div class="quick-actions">` cuando sea `false`, sin alterar tarjetas, embudo ni lista de interacciones.
- [x] T137 [US15] Pasar `showQuickActions: false` en la llamada a `renderDashboardHtml()` dentro de `renderMarketingHtml()` en `src/components/marketing.js`, manteniendo `sectionClass: 'marketing-view'` y el resto del panel compartido.

**Punto de control**: El panel ofrece accesos y cifras correctas incluso sin registros, y Marketing no hereda sus acciones rápidas.

---

## Phase 11: US2 - Registrar clientes y contactos comerciales (Prioridad: P2)

**Objetivo**: Perfil de clientes con campos obligatorios y ocultos, código generado, RUT válido y único, canal de contacto condicional y presentación declarativa.

**Prueba independiente**: Registrar cliente y llamada asociada sin ver Código/Categoría/Descripción/Nº de pedidos; el guardado genera código único, exige fecha, canal, RUT y dato de contacto, y la ficha de un cliente heredado incompleto queda bloqueada hasta editarlo válidamente.

### Pruebas de US2

- [x] T053 [P] [US2] Ampliar `tests/integration/client-field-rules.test.js` para verificar que formulario, lista, ficha y búsqueda no muestran «Código», «Categoría», «Descripción» ni «Nº de pedidos», que el código generado es distinto por cliente y que buscar por esos valores ocultos no devuelve registros.
- [x] T054 [P] [US2] Ampliar `tests/integration/register-client.test.js` para rechazar guardados sin «Fecha de nacimiento», «Canal de Contacto» o «RUT», con dígito verificador inválido y con RUT repetido con y sin puntos.
- [x] T055 [P] [US2] Ampliar `tests/integration/register-client-contact.test.js` para exigir selección explícita del canal, mostrar solo la casilla adicional correspondiente con formatos `phone`/`email`/`nonEmpty` y conservar únicamente el valor del canal final.
- [x] T056 [P] [US2] Ampliar `tests/integration/client-form-presentation.test.js` para comprobar título y acción rápida «Nuevo Cliente», orden «Nombre de Cliente», «RUT», «Fecha de nacimiento», «Canal de Contacto» con su casilla, «Tipo de actividad» y «Ejecutivo Asignado», pistas grises y diez opciones de `rubro`.
- [x] T057 [P] [US2] Ampliar `tests/integration/client-birthdate-legacy.test.js` para bloquear la ficha de un cliente heredado sin datos obligatorios o con RUT inválido, explicar los campos pendientes, ofrecer «Editar» y desbloquearla al guardar válidamente.

### Implementación de US2

- [x] T058 [US2] Completar `MODULE_CONFIG` en `src/module-config.js` con `entityDate`, `fieldRules.entity` para código generado/oculto, `category`/`description` ocultos, `rut` obligatorio único con `cl-rut` y pista, `canal_contacto` sin preselección, campos `contacto_*` con `when`/`group`/formato/pista, `rubro` con diez opciones, `ejecutivo_asignado` con `order: 6` y `detailPolicy.entity`, sin declarar `pedidos`.
- [x] T059 [US2] Completar `validateEntityData()`, `validateFieldRules()`, `normalizeForUniqueness()` y `addEntity()` en `src/storage.js` para generar el código antes de validar, aplicar required/format/unique/normalize y conservar los valores ocultos en `updateEntity()`.
- [x] T060 [US2] Ajustar `src/components/form-fields.js` y `src/components/entity-form.js` para renderizar pistas en gris, orden declarativo y opciones `{ value, label }`, y descartar los valores de canales inactivos al cambiar de selección.
- [x] T061 [US2] Ajustar `src/components/entity-detail.js` para usar `validateEntity()` con `detailPolicy.entity.blockWhenInvalid` y mostrar la explicación y la acción de editar en lugar de los datos del cliente incompleto.
- [x] T062 [US2] Ajustar `src/components/dashboard.js` y `src/components/search-bar.js` para mostrar «Nuevo Cliente» en la acción rápida y no mencionar campos ocultos en la ayuda de búsqueda.

**Punto de control**: El perfil de clientes cumple todas las reglas declarativas sin ramas específicas en el código central.

---

## Phase 12: US9 - Buscar y encontrar entidades rápidamente (Prioridad: P2)

**Objetivo**: Búsqueda instantánea sobre entidades y sus documentos, con estado vacío claro y buen comportamiento con cientos de registros.

**Prueba independiente**: Introducir un término y ver solo coincidencias; sin coincidencias ver estado vacío; con 500 entidades obtener resultados sin retraso perceptible.

### Pruebas de US9

- [x] T063 [P] [US9] Ampliar `tests/integration/search-entities.test.js` con coincidencias parciales, estado vacío y actualización de resultados mientras se escribe en `#search-input`.
- [x] T064 [P] [US9] Ampliar `tests/integration/performance.test.js` para medir búsqueda y renderizado de listas con 500 entidades almacenadas.

### Implementación de US9

- [x] T065 [US9] Implementar `normalizeText()`, `matchesQuery()` y `matchesAny()` en `src/utils/search.js` y usarlos en `searchEntities()` de `src/storage.js` sobre campos visibles y documentos vinculados.
- [x] T066 [US9] Conectar `handleInput()` y `updateSearchResults()` en `src/app.js` con `renderSearchBarHtml()` y `renderEntityListHtml()` para actualizar solo `#search-results`.

**Punto de control**: La búsqueda es correcta y responde con rapidez sobre 500 registros.

---

## Phase 13: US10 - Registrar una fecha objetivo (Prioridad: P2)

**Objetivo**: Fecha objetivo opcional en la base y «Fecha de nacimiento» obligatoria en clientes, con rango local 1910-01-01..hoy y actualización al cambiar de día.

**Prueba independiente**: Aceptar `1910-01-01` y hoy, rechazar fechas imposibles o fuera de rango, y actualizar `max` y la ayuda sin recargar al cruzar la medianoche local conservando el borrador.

### Pruebas de US10

- [x] T067 [P] [US10] Ampliar `tests/unit/entity-date.test.js` con reloj falso para `localTodayISO()`, `isValidISODate()`, `resolveEntityDateRule()` y `watchLocalDayChange()`, incluyendo reprogramación y cancelación.
- [x] T068 [P] [US10] Ampliar `tests/integration/entity-birthdate.test.js` para comprobar `min`/`max`, rechazo de `1909-12-31`, mañana, `1910-02-29` y `2026-02-30`, y actualización del límite sin perder el borrador.

### Implementación de US10

- [x] T069 [US10] Implementar `src/utils/entity-date.js` con `LOCAL_TODAY`, componentes locales (`getFullYear`/`getMonth`/`getDate`), comparación lexicográfica de ISO y temporizador hasta la medianoche local.
- [x] T070 [US10] Conectar la regla resuelta a las definiciones de campo en `src/components/entity-form.js` y actualizar `min`, `max` y `[data-role="date-range"]` desde `src/app.js` sin re-renderizar el formulario.
- [x] T071 [US10] Mantener en `src/storage.js` los valores históricos fuera de rango sin migrarlos, exigiendo corrección sobre el objeto fusionado en `updateEntity()`.

**Punto de control**: La regla de fecha es válida, dinámica y no destruye datos históricos.

---

## Phase 14: US11 - Registrar los detalles de documentos de una entidad (Prioridad: P2)

**Objetivo**: Documentos con campos base y personalizados, asociados a exactamente una entidad y eliminados en cascada.

**Prueba independiente**: Añadir un documento a una entidad, ver sus detalles junto a ella, editarlo y eliminarlo, y comprobar que la eliminación de la entidad elimina sus documentos.

### Pruebas de US11

- [x] T072 [P] [US11] Ampliar `tests/unit/storage.test.js` con campos base `id`, `entity_id`, `startDate`, `endDate`, `notes`, `status`, marcas de tiempo y regla `endDate >= startDate`, más campos personalizados declarados.
- [x] T073 [P] [US11] Ampliar `tests/integration/add-document.test.js` para añadir, editar y eliminar un documento desde la pestaña de documentos y verlo en la ficha de la entidad.

### Implementación de US11

- [x] T074 [US11] Completar `validateDocumentData()`, `addDocument()`, `updateDocument()`, `deleteDocument()` y `deleteDocumentsForEntity()` en `src/storage.js`, rechazando entity_id inexistente y fechas inválidas.
- [x] T075 [US11] Completar `src/components/document-form.js` y `onDocumentFormSubmit()` en `src/app.js` con mensajes de error por campo para datos obligatorios y fechas.

**Punto de control**: Los documentos quedan íntegramente vinculados a su entidad.

---

## Phase 15: US12 - Buscar entidades en una pantalla dedicada (Prioridad: P2)

**Objetivo**: Pantalla de búsqueda separada de la gestión, accesible desde barra lateral y panel, sin edición en línea.

**Prueba independiente**: Abrir la pantalla desde la barra lateral o una acción rápida, buscar, ver estado vacío y volver al panel con el botón Panel.

### Pruebas de US12

- [x] T076 [P] [US12] Ampliar `tests/integration/search-screen.test.js` para cubrir ambos accesos, coincidencias, estado vacío, botón Panel y exclusión de categoría/descripción en el perfil de clientes.

### Implementación de US12

- [x] T077 [US12] Implementar `renderSearchView()` y la navegación a `search`/`dashboard` en `src/app.js`, con `focusSearchOnRender` al llegar desde el panel.
- [x] T078 [US12] Ajustar `src/components/search-bar.js` para ofrecer un formulario accesible con `#search-input` y texto de ayuda derivado de la configuración.

**Punto de control**: La búsqueda dedicada es independiente de la gestión y no expone campos ocultos.

---

## Phase 16: US13 - Configurar el ciclo de vida de estados de documentos (Prioridad: P2)

**Objetivo**: Estados y transiciones declarados por configuración, con estados pendientes explícitos y texto libre como comportamiento base.

**Prueba independiente**: Configurar cotización→pedido→facturado; ver solo transiciones válidas, rechazar una inválida con explicación, mostrar el estado en listas y conservar texto libre sin ciclo de vida.

### Pruebas de US13

- [x] T079 [P] [US13] Ampliar `tests/integration/document-lifecycle.test.js` para verificar transiciones permitidas, rechazo de transición inválida por cualquier vía, estado visible en listas y texto libre sin `statusLifecycle`.
- [x] T080 [P] [US13] Ampliar `tests/unit/module-config.test.js` para validar `statusLifecycle.states`, `transitions` y `pendingStates` y rechazar referencias a estados desconocidos.

### Implementación de US13

- [x] T081 [US13] Implementar `isValidTransition()` y la rama de `status` en `validateDocumentData()` de `src/storage.js`, y hacer que `computeSummary()` use `pendingStates` antes que la coincidencia normalizada con «pendiente».
- [x] T082 [US13] Implementar opciones de estado a partir de `statusLifecycle.transitions` en `src/components/document-form.js` y distintivo visual del estado en `src/components/document-list.js`.

**Punto de control**: El ciclo de vida se aplica por igual en formularios, almacenamiento y resumen.

---

## Phase 17: US16 - Capturar y convertir prospectos desde Marketing (Prioridad: P2)

**Objetivo**: Captura pública con consentimiento, prospectos como `Entidad`, automatización por eventos, conversión sin pérdida de identidad, panel/Marketing derivados de los mismos registros y cinco atajos de Marketing en orden fijo.

**Prueba independiente**: Enviar `?view=capture` con consentimiento, ver creado el prospecto y la ejecución automática, avanzar a Cliente conservando historial, y comprobar que Marketing muestra las cinco tarjetas y el embudo del panel sin torta ni selector de etapas, sin acciones rápidas del panel y con los cinco atajos ordenados `team`, `campaigns`, `performance`, `chat`, `social`.

### Pruebas de US16

- [x] T083 [P] [US16] Ampliar `tests/unit/capture-consent.test.js` para exigir `consentimiento = true`, `consentimiento_fecha`, `consentimiento_version` desde `marketing.privacyNoticeVersion`, `estado_comercial = 'prospecto'` y rechazo sin consentimiento.
- [x] T084 [P] [US16] Ampliar `tests/unit/marketing-stats.test.js` para verificar que las cinco tarjetas y el embudo por estados de documento coinciden con el panel, contabilizan cada documento una sola vez y muestran cero sin registros.
- [x] T085 [P] [US16] Ampliar `tests/integration/marketing-capture.test.js` para comprobar que `?view=capture` se renderiza sin marco ERP, sin consentimiento no crea entidad y con consentimiento muestra una confirmación clara con el mensaje exacto `Prospecto registrado correctamente.`.
- [x] T086 [P] [US16] Ampliar `tests/integration/marketing-dashboard.test.js` para verificar en Marketing las cinco tarjetas, el embudo y «Últimas Interacciones / Próximos Seguimientos» del panel, sin torta «Estado comercial de la cartera» ni selector de etapas, y sin mostrar `estado_comercial`.
- [x] T138 [P] [US16] Ampliar `tests/integration/marketing-navigation.test.js` para exigir exactamente cinco botones `.marketing-sections [data-action="marketing-section"]` en el orden `team`, `campaigns`, `performance`, `chat`, `social`, con las etiquetas «Equipos de ventas y logros», «Campañas», «Rendimiento de campañas», «Dudas y consultas» y «Redes sociales» (FR-093/SC-029).

### Implementación de US16

- [x] T087 [US16] Reimplementar `computeDashboardStats()` y `computeMarketingStats()` en `src/utils/marketing-stats.js` sobre entidades y documentos, compartiendo fórmulas con `src/components/dashboard.js` y sin escribir resultados derivados en `localStorage`.
- [x] T088 [US16] Implementar `createProspectFromCapture()` y `CaptureError` en `src/utils/capture-prospect.js`, filtrando por `marketing.captureFields` y guardando consentimiento con fecha y versión.
- [x] T089 [US16] Implementar `getCaptureFieldDefs()`, `renderCaptureFormHtml()` y `collectCaptureFormData()` en `src/components/capture-form.js` con casilla de consentimiento y errores comprensibles.
- [x] T090 [US16] Conectar en `src/app.js` las vistas iniciales `?view=capture` y `?view=marketing`, el envío `#capture-form` y `renderMarketingView()` con las estadísticas compartidas.
- [x] T091 [US16] Reimplementar `renderMarketingHtml()` en `src/components/marketing.js` con cinco tarjetas, embudo por estados de documento, lista de interacciones con «Ver ficha» y estados vacíos, eliminando la torta y el selector de etapas.
- [x] T092 [US16] Implementar `runAutomationRules()` en `src/utils/marketing-automation.js` y `persistAutomation()` en `src/storage.js`, con `automation_key = event|from|to|label`, `status = 'automatico'` y un `Documento` por ejecución en el historial de la entidad.
- [x] T093 [US16] Ajustar `transitionStage()` en `src/utils/marketing-stage.js` y `updateEntityStage()` en `src/storage.js` para que el valor interno `ganado` —visible como «Cliente ganado» cuando se requiera— conserve `id`, `entity_id`, documentos y campos personalizados, sin confundirlo con el estado de documento «Cerrado ganado» y manteniendo `estado_comercial` oculto en `src/module-config.js`.
- [x] T139 [US16] Reordenar y renombrar `SECTIONS` en `src/components/marketing.js` a los cinco atajos exactos `team`, `campaigns`, `performance`, `chat`, `social` con las etiquetas de FR-093, actualizar el `<h2>` de `src/components/marketing-team.js` a «Equipos de ventas y logros» y conservar `data-action="marketing-section"` y el panel renderizado por cada clave.

**Punto de control**: Marketing y panel coinciden exactamente, la captura es trazable sin nueva entidad y los cinco atajos respetan el orden y la terminología aprobada.

---

## Phase 18: US17 - Consultar los Equipos de ventas y logros (Prioridad: P2)

**Objetivo**: Equipos e integrantes capturados por el usuario con real mensual y objetivo mensual calculados por el sistema, accesibles desde el atajo «Equipos de ventas y logros».

**Prueba independiente**: Abrir el atajo «Equipos de ventas y logros», crear equipo e integrante con nombre, cargo y estado, sin casillas de métricas, y comprobar que real mensual suma documentos «Cerrado ganado» del mes del ejecutivo y objetivo mensual proyecta `ventas ÷ días transcurridos × días del mes`, conservando `data-section="team"`.

### Pruebas de US17

- [x] T094 [P] [US17] Crear `tests/unit/sales-team-metrics.test.js` con casos de suma de importes «Cerrado ganado» del mes por `ejecutivo_asignado`, proyección al cierre del mes y cero sin ventas o sin días transcurridos.
- [x] T095 [P] [US17] Crear `tests/integration/marketing-team.test.js` para abrir «Equipo de ventas y logros», crear/editar/eliminar equipos e integrantes con nombre, cargo y «Activo»/«Inactivo», ver estado vacío y actualizar métricas tras cambiar documentos.
- [x] T140 [P] [US17] Actualizar `tests/integration/marketing-team.test.js` para abrir la sección mediante el atajo «Equipos de ventas y logros» (plural) y verificar que el botón conserva `data-section="team"` y que no aparece la forma singular como etiqueta visible (SC-029).

### Implementación de US17

- [x] T096 [US17] Implementar `computeSalesTeamMetrics()` en `src/utils/sales-team-metrics.js` con las fórmulas de FR-078 y FR-079, sin persistir resultados.
- [x] T097 [US17] Implementar la sección «Equipos de ventas y logros» —antes «Equipo de ventas y logros»— en `src/components/marketing.js` y sus estilos en `src/styles.css`, sin entradas para real ni objetivo.
- [x] T098 [US17] Conectar en `src/app.js` las acciones de equipo e integrante y persistir solo nombre, cargo y estado en `erp_marketing_config` desde `src/storage.js`, usando `marketing.salesTeams` como valores iniciales.

**Punto de control**: Las cifras del equipo son calculadas, verificables y recalculadas sin recarga.

---

## Phase 19: US18 - Registrar interacciones en redes sociales (Prioridad: P2)

**Objetivo**: Registro manual de interacciones de Twitter, Instagram, YouTube y otras redes, vinculadas al prospecto o cliente como `Documento`.

**Prueba independiente**: Abrir «Redes sociales» desde Marketing, registrar una interacción de Instagram con plataforma, fecha, tipo, nota y enlace, y verla guardada, ordenada por fecha y en la ficha de la entidad.

### Pruebas de US18

- [x] T099 [P] [US18] Crear `tests/unit/marketing-social.test.js` para exigir que `registerSocialInteraction()` cree un `Documento` con `entity_id`, `plataforma`, `startDate`, `tipo_interaccion`, `nota`, `enlace` y `campaña` opcional.
- [x] T100 [P] [US18] Crear `tests/integration/marketing-social.test.js` para registrar, editar y eliminar una interacción vinculada, ver estado vacío, orden cronológico y reflejo en `src/components/entity-detail.js`.

### Implementación de US18

- [x] T101 [US18] Implementar `registerSocialInteraction()` en `src/utils/marketing-social.js` reutilizando `addDocument()` de `src/storage.js` y los campos personalizados declarados.
- [x] T102 [US18] Implementar `renderMarketingSocialHtml()` en `src/components/marketing-social.js` con formulario, lista, acciones de edición/eliminación y estado vacío.
- [x] T103 [US18] Declarar en `src/module-config.js` los campos personalizados de documento `plataforma`, `tipo_interaccion`, `enlace` y `campaña`, y conectar las acciones del componente en `src/app.js` usando `escapeHtml()` de `src/utils/sanitize.js`.

**Punto de control**: Las redes usan `Documento` y permanecen en la ficha de la entidad al navegar.

---

## Phase 20: US19 - Ofrecer Dudas y consultas con respuestas rápidas (Prioridad: P2)

**Objetivo**: Superficie visible «Dudas y consultas» en captura y Marketing con respuestas desde FAQ configuradas, acuse para consultas sin coincidencia y consentimiento previo; el canal interno `chat` permanece estable.

**Prueba independiente**: Pregunta configurada recibe respuesta inmediata; pregunta sin coincidencia muestra acuse y queda como `Documento`; sin consentimiento no se registra ningún mensaje; ambas superficies comparten historial; los textos visibles dicen «Dudas y consultas» mientras `data-section="chat"`, `#chat-form`, `.chat-*` y `canal: 'chat'` no cambian.

### Pruebas de US19

- [x] T104 [P] [US19] Crear `tests/unit/marketing-chat.test.js` para verificar `answerFaq()` con texto normalizado, `null` sin coincidencia y `registerChatMessage()` con consentimiento, canal `chat`, `mensaje`, `tipo_interaccion` y `campaña` opcional.
- [x] T105 [P] [US19] Crear `tests/integration/marketing-chat.test.js` para usar el chat en `?view=capture` y en Marketing, comprobar respuesta rápida, acuse de recibo con el mensaje exacto `Consulta registrada; un ejecutivo hará seguimiento.`, documento de seguimiento, bloqueo sin consentimiento y mensajes visibles en la ficha.
- [x] T141 [P] [US19] Ampliar `tests/integration/marketing-chat.test.js` para exigir que encabezado, pestaña y texto de consentimiento digan «Dudas y consultas» en captura y Marketing, sin «Chat» como etiqueta visible, verificando que `data-section="chat"`, `#chat-form`, `.chat-*` y los documentos con `canal: 'chat'` permanezcan iguales (SC-028).

### Implementación de US19

- [x] T106 [US19] Implementar `answerFaq()` y `registerChatMessage()` en `src/utils/marketing-chat.js` usando `marketing.faq` y `addDocument()`, sin APIs externas.
- [x] T107 [US19] Implementar `renderMarketingChatHtml()` en `src/components/marketing-chat.js` con casilla de consentimiento, mensajes, respuesta/acuse y estado vacío sin FAQ.
- [x] T108 [US19] Integrar el chat en `src/components/capture-form.js` y `src/components/marketing.js`, con manejadores en `src/app.js` que lean `getEntityDocuments()` para compartir mensajes entre superficies.
- [x] T109 [US19] Ampliar `validateMarketingConfig()` en `src/utils/marketing-config.js` para exigir pares `pregunta`/`respuesta` no vacíos en `marketing.faq` y añadir ejemplos en `src/module-config.js`.
- [x] T142 [US19] Renombrar a «Dudas y consultas» el `<h2>` y el texto visible de consentimiento en `src/components/marketing-chat.js`, conservando `data-role="marketing-chat"`, `#chat-form`, `name="consentimiento"` y las clases `.chat-*`.
- [x] T143 [US19] Actualizar los mensajes visibles de `ChatConsentError` en `src/utils/marketing-chat.js` para usar «Dudas y consultas», conservando el nombre de la clase, `name = 'ChatConsentError'` y `errors.consentimiento` consumido por `src/app.js`.

**Punto de control**: «Dudas y consultas» responde, registra y respeta el consentimiento en ambos puntos de entrada sin cambiar contratos internos.

---

## Phase 21: US20 - Programar campañas de marketing internas (Prioridad: P2)

**Objetivo**: Campañas por etapa y periodo que ejecutan reglas internas con acciones limitadas y desempate determinista.

**Prueba independiente**: Crear campaña «En proceso», disparar evento sobre prospecto de esa etapa, ver seguimiento/historial sin envíos externos, detenerla sin borrar historial y comprobar que con dos campañas solo se ejecuta la más reciente y la otra queda «omitida por solapamiento».

### Pruebas de US20

- [x] T110 [P] [US20] Crear `tests/unit/marketing-campaigns.test.js` con casos de creación, edición, detención, periodo activo y etapa objetivo, verificando que solo se ejecutan acciones internas: crear documento de seguimiento, asignar ejecutivo y actualizar `estado_comercial`.
- [x] T111 [US20] Crear `tests/unit/marketing-campaigns-overlap.test.js` para dos campañas activas sobre el mismo prospecto y evento: ejecuta la de `createdAt` más reciente, registra la otra con `notes = 'omitida por solapamiento'`, `campaignId`, fecha y motivo, sin acciones duplicadas.
- [x] T112 [P] [US20] Crear `tests/integration/marketing-campaigns.test.js` para abrir la vista de campañas con estado vacío, crear/editar/detener una campaña y consultar historial con fecha, prospecto y acción.

### Implementación de US20

- [x] T113 [US20] Implementar `createCampaign()`, `updateCampaign()`, `stopCampaign()`, `isCampaignActive()` y `selectCampaignsForEvent()` en `src/utils/marketing-campaigns.js`, sin correos, mensajes externos ni publicaciones.
- [x] T114 [US20] Ampliar `runAutomationRules()` en `src/utils/marketing-automation.js` y `persistAutomation()` en `src/storage.js` con `campaignId`, contexto de etapa y registro en historial para cada acción o solapamiento.
- [x] T115 [US20] Implementar la vista de campañas en `src/components/marketing.js` y sus acciones en `src/app.js`, persistiendo en `erp_marketing_config` desde `src/storage.js` con `marketing.campaigns` como semilla y validando fechas en `src/utils/marketing-config.js`.

**Punto de control**: Las campañas ejecutan reglas locales, registran todo y no duplican acciones.

---

## Phase 22: US21 - Medir el rendimiento de Marketing (Prioridad: P2)

**Objetivo**: Indicadores derivados de registros existentes, filtrables por campaña, con grupo «Sin campaña» y sin captura manual.

**Prueba independiente**: Abrir «Rendimiento de campañas», seleccionar una campaña y comprobar prospectos, conversión, interacciones, consultas respondidas y ventas ganadas coinciden con los registros y se actualizan sin recarga; campaña vacía muestra cero con explicación.

### Pruebas de US21

- [x] T116 [P] [US21] Crear `tests/unit/marketing-performance.test.js` para verificar `computeMarketingPerformance()` con prospectos capturados, conversiones por etapa, tasa de conversión, interacciones registradas, consultas respondidas y ventas «Cerrado ganado», sin persistir resultados.
- [x] T117 [US21] Crear `tests/unit/marketing-performance-attribution.test.js` para comprobar filtro por `campaignId`/`campaña`, agrupación «Sin campaña» y ceros con explicación para campañas sin registros.
- [x] T118 [P] [US21] Crear `tests/integration/marketing-performance.test.js` para abrir la vista, seleccionar campaña, comparar cifras con el panel y ver actualización sin recarga tras cambios en entidades o documentos.

### Implementación de US21

- [x] T119 [US21] Implementar `computeMarketingPerformance()` en `src/utils/marketing-performance.js` a partir de `entities`, `documents` y `campaigns`, reutilizando `computeDashboardStats()` para los valores compartidos.
- [x] T120 [US21] Implementar la vista «Rendimiento de campañas» en `src/components/marketing.js` con selector de campaña, tarjetas de indicadores y el mensaje exacto `Sin registros para esta campaña.` para campañas sin registros, sin campos de captura manual.
- [x] T121 [US21] Conectar `renderMarketingView()` y `handleChange()` en `src/app.js` para recalcular indicadores en cada render, y declarar el campo opcional `campaña` en entidades y documentos de `src/module-config.js`.

**Punto de control**: Rendimiento y panel coinciden porque ambos derivan de los mismos registros.

---

## Phase 23: US6 - Consultar indicadores de Gestión Comercial (Prioridad: P2)

**Objetivo**: Resumen de clientes, interacciones y seguimientos pendientes por entidad, con etiquetas de CRM y estado vacío.

**Prueba independiente**: Abrir el resumen, comparar totales y pendientes con las fichas, registrar un seguimiento nuevo y ver el indicador actualizado; sin registros ver ceros y guía inicial.

### Pruebas de US6

- [x] T122 [P] [US6] Ampliar `tests/integration/commercial-summary.test.js` para verificar totales, pendientes por cliente, selección que abre la ficha, estado vacío, etiquetas «Clientes»/«Historial/Ficha» y actualización tras crear o completar seguimientos.
- [x] T123 [P] [US6] Ampliar `tests/unit/storage.test.js` para comprobar en `computeSummary()` la precedencia de `pendingStates` y, sin ciclo de vida, la coincidencia del estado normalizado con «pendiente».

### Implementación de US6

- [x] T124 [US6] Completar `computeSummary()` en `src/storage.js` con `totalEntities`, `totalDocuments`, `totalPending` y `pendingByEntity` derivados de los registros vigentes.
- [x] T125 [US6] Completar `renderCommercialSummaryHtml()` en `src/components/commercial-summary.js` y su renderizado desde `src/app.js` con estado vacío y enlaces a la ficha.

**Punto de control**: El resumen refleja exactamente lo registrado en clientes y documentos.

---

## Phase 24: Polish & Cross-Cutting Concerns

**Propósito**: Regresión, rendimiento, seguridad y cierre de la validación ejecutable.

- [x] T126 [P] Ampliar `tests/integration/performance.test.js` para afirmar que búsqueda y renderizado de listas permanecen correctos con 500 entidades y 500 documentos.
- [x] T127 [P] Ampliar `tests/unit/sanitize.test.js` y verificar en `src/utils/sanitize.js` que nombres, notas, enlaces y mensajes de chat se escapan antes de renderizarse en `src/components/`.
- [x] T128 [P] Ampliar `tests/integration/unsaved-navigation.test.js` para confirmar que salir desde cualquier botón de `src/components/shell.js` o `src/components/dashboard.js` con el formulario modificado solo navega tras confirmar descartar.
- [x] T129 [P] Ampliar `tests/integration/orphan-fields-ui.test.js` para conservar en `erp_entities` los valores de `category`, `description` y `pedidos` sin mostrarlos en `src/components/`.
- [x] T130 [P] Actualizar `README.md` con los comandos `npm install`, `npm test`, `npm run lint`, `npm run dev` y la limitación de mismo origen de `?view=capture` descrita en `contracts/marketing.md`.
- [x] T131 [P] Ampliar `tests/integration/marketing-navigation.test.js` para verificar que no existen «Abrir Marketing», torta «Estado comercial de la cartera» ni selector de etapas, y que Marketing está como cuarta opción en `src/components/shell.js`.
- [x] T132 Ejecutar `npm test` y `npm run lint` definidos en `package.json` y corregir los fallos en `src/` y `tests/` hasta que ambos comandos terminen sin errores.
- [x] T133 [P] Ampliar `tests/integration/marketing-dashboard.test.js` con la comparación final de cinco tarjetas y embudo entre el panel y Marketing tras crear, editar y eliminar documentos, comprobando que no se escriben resultados derivados en `localStorage`.
- [x] T144 [P] Ampliar `tests/integration/marketing-navigation.test.js` con la regresión final de clarificaciones: cinco acciones rápidas solo en `.dashboard`, cinco atajos de Marketing en orden exacto y ausencia de las etiquetas obsoletas «Chat» y «Equipo de ventas y logros» como texto visible.
- [x] T145 Ejecutar `npm test` y `npm run lint` definidos en `package.json` tras T134-T144 y corregir fallos en `src/` y `tests/` hasta que ambos comandos terminen sin errores.

**Punto de control**: Todas las historias pasan sus pruebas independientes, la suite completa queda en verde y las clarificaciones de Marketing quedan cubiertas.

---

## Phase 25: Inicio de sesión y rangos (US22, US23) (Prioridad: P1)

**Objetivo**: Inicio de sesión demostrativo con cuatro usuarios fijos, sesión persistente sin hash ni bloqueo, matriz única de permisos por rango, navegación y acciones filtradas, administración de usuarios y migración de «Ejecutivo Asignado» a usuarios vinculados.

**Prueba independiente**: Sin sesión solo están disponibles login, formulario público y «Dudas y consultas»; `gerente` (N4), `marketing` (N3), `ventas` (N2) y `atencion` (N1) acceden con cualquier contraseña no vacía y solo a lo permitido; las acciones prohibidas se rechazan con `No tienes permiso para realizar esta acción` o «Acceso denegado» también desde `src/storage.js` o enlaces directos; «Gestionar usuarios» aparece solo para N4 y los ejecutivos asignados provienen de usuarios activos N2/N4.

### Pruebas de US22

- [x] T146 [US22a] Crear `tests/unit/auth.test.js` para verificar `normalizeUsername()` sin distinguir mayúsculas ni espacios, que `ensureSeedUsers()` siembra solo `gerente`/`marketing`/`ventas`/`atencion` con rangos N4/N3/N2/N1, y que los usuarios no guardan `passwordHash`, `salt`, `failedAttempts` ni `lockedUntil`.
- [x] T147 [US22a] Ampliar `tests/unit/auth.test.js` con ingreso de los cuatro usuarios mediante cualquier contraseña no vacía, normalización de `GERENTE` con espacios, mensajes exactos `Ingresa una contraseña` y `Usuario no encontrado`, y comprobación de que cinco intentos fallidos no bloquean al usuario.
- [x] T148 [US22b] Ampliar `tests/unit/auth.test.js` con `erp_session` persistente, renovación de `lastActivityAt`/`expiresAt` por `touchSession()`, descarte de sesión expirada y revocación inmediata en `logout()` y al desactivar usuario.
- [x] T149 [US22a] Crear `tests/integration/login.test.js` para abrir la raíz sin `?view=` sin sesión y ver solo «Usuario»/«Contraseña» sin marco ERP; iniciar sesión como los cuatro usuarios demostrativos y comprobar rango exacto, menú del usuario y «Cerrar sesión».
- [x] T150 [US22a] Ampliar `tests/integration/login.test.js` con contraseña vacía y usuario inexistente que muestran los mensajes exactos sin crear sesión, enlace profundo `?view=summary` redirigido a login y restaurado tras autenticarse, con conservación en recarga y Back/Forward.
- [x] T151 [US22c] Crear `tests/integration/public-access.test.js` para comprobar que un visitante sin sesión envía `?view=capture` con consentimiento y usa «Dudas y consultas» (`chat`) sin iniciar sesión, sin marco ERP y con prospecto/documento persistidos.
- [x] T152 [US22b] Ampliar `tests/integration/login.test.js` con recarga y reapertura de navegador conservando la sesión, desactivación de `ventas` que redirige a login en la siguiente acción, y cambio de rango de `ventas` a Nivel 3 reflejado en la barra superior y permisos en la siguiente acción o recarga.

### Pruebas de US23

- [x] T153 [US23c] Crear `tests/unit/permissions.test.js` para verificar `PERMISSION_MATRIX`, `can()` y `assertPermission()` contra el catálogo canónico de `spec.md` en N4, N3, N2, N1 y visitante, con denegación por defecto de acciones no listadas y de `permissions:edit` para todos, usando el mensaje exacto `No tienes permiso para realizar esta acción`.
- [x] T154 [P] [US23a] Crear `tests/integration/role-n4.test.js` para comprobar permitido de `gerente` (N4): eliminar «Comercial Andina SpA», ver los 47 seguimientos del equipo, gestionar equipos, detener la «Campaña Primavera 2026» creada por `marketing` y abrir «Gestionar usuarios»; y denegado: editar la matriz, `permissions:edit` desde `src/storage.js` y actuar como visitante, incluidas llamadas directas.
- [x] T155 [P] [US23a] Crear `tests/integration/role-n3.test.js` para comprobar permitido de `marketing` (N3): capturar «Visita 2026-11-23», registrar interacción de Instagram, responder «Dudas y consultas», crear y consultar su «Campaña Primavera 2026», ver fichas y leer «Equipos de ventas y logros»; y denegado: eliminar clientes, abrir resumen, crear integrantes, detener campañas ajenas y gestionar usuarios, también desde `src/storage.js`.
- [x] T156 [P] [US23a] Crear `tests/integration/role-n2.test.js` para comprobar permitido de `ventas` (N2): crear «Ferretería Central» consigo mismo como «Ejecutivo Asignado», editar sus clientes, registrar y cambiar estados de sus interacciones, ver sus 12 pendientes y su real/objetivo; y denegado: eliminar «Transportes del Norte Ltda.», editar clientes de `ana.munoz`, ver el resumen completo, Marketing, equipo ajeno y llamada directa a `src/storage.js` con el mensaje exacto.
- [x] T157 [P] [US23a] Crear `tests/integration/role-n1.test.js` para comprobar permitido de `atencion` (N1): buscar y ver fichas, registrar «Llamada» o «Correo» en cualquier cliente y dar seguimiento a consultas del chat; y denegado: registrar «Reunión», cambiar estados, eliminar clientes y abrir Resumen, Marketing o «Equipos de ventas y logros», también desde `src/storage.js`.
- [x] T158 [P] [US22c] Crear `tests/integration/role-visitor.test.js` para comprobar permitido de visitante: formulario público y «Dudas y consultas»; y denegado: Panel, Buscar, Resumen, Marketing y Equipo, con redirección a login desde la URL raíz sin parámetro `?view=` (no existe `?view=panel`) y sin lectura/escritura interna desde `src/storage.js`.
- [x] T159 [US23c] Crear `tests/integration/navigation-by-rank.test.js` para verificar en `src/components/shell.js` y `src/components/dashboard.js` que `NAV_ITEMS` y las acciones rápidas ocultan Resumen, Marketing, Equipo y «Gestionar usuarios» según `can()`, sin dejar botones en el DOM para rangos no autorizados.
- [x] T160 [US23c] Ampliar `tests/integration/navigation-by-rank.test.js` con enlaces directos `?view=summary`, `?view=marketing` y `?view=users-admin`: usuario autenticado sin permiso ve «Acceso denegado» y vuelve al Panel; visitante sin sesión ve login.
- [x] T161 [P] [US23b] Crear `tests/integration/users-admin.test.js` para ver «Gestionar usuarios» solo en el menú de `gerente`, crear/editar/desactivar usuarios, asignar rangos, rechazar `VENTAS` por duplicado y revocar la sesión de `ventas` al desactivarlo.
- [x] T162 [US23a] Crear `tests/integration/executive-assignment-migration.test.js` para migrar valores de texto libre de `ejecutivo_asignado` al `userId` de usuarios activos N2/N4, mostrar «Sin asignar» al desactivar `ana.munoz`, conservar sus ventas históricas en el integrante vinculado y ofrecer en el `select` solo usuarios activos válidos.
- [x] T163 [US23c] Ampliar `tests/unit/storage.test.js` para exigir `assertPermission()` en `saveEntities()`, `addEntity()`, `updateEntity()`, `updateEntityStage()`, `deleteEntity()`, `saveDocuments()`, `addDocument()`, `updateDocument()`, `deleteDocument()`, `deleteDocumentsForEntity()` y escrituras de configuración, verificando que ninguna escritura ocurre cuando `can()` es falso y que `Sistema` solo se usa en automatizaciones. El alcance cubre la API de `storage.js` con sesión local íntegra, incluidas las llamadas iniciadas desde consola; la manipulación deliberada de `localStorage`/`erp_session` o del entorno para falsificar identidad/rango queda fuera de la prueba.

### Implementación de US22 y US23

- [x] T164 [US22a] Implementar `src/auth.js` con `SESSION_HOURS`, `DEMO_PASSWORD`, `normalizeUsername()`, `ensureSeedUsers()`, `listUsers()`, `login()` que acepta cualquier contraseña no vacía, `logout()`, `getCurrentSession()`, `getCurrentUser()`, `touchSession()`, `createUser()`, `updateUser()`, `deactivateUser()`, `listExecutiveUsers()` y `resolveExecutive()` sobre `erp_users`/`erp_session`, sin hash, bloqueo por intentos ni dependencias nuevas.
- [x] T165 [US22a] Inicializar en `src/auth.js` los usuarios demostrativos `gerente`, `marketing`, `ventas` y `atencion` con rangos N4/N3/N2/N1 y estado activo, solo cuando `erp_users` no exista, sin `passwordHash`, `salt`, `failedAttempts` ni `lockedUntil`.
- [x] T166 [US22a] Crear `src/components/login.js` con `renderLoginHtml()`, `collectLoginData()` y `renderLoginError()` para mostrar solo «Usuario»/«Contraseña», mantener accesibles captura y «Dudas y consultas», y mostrar `Ingresa una contraseña` o `Usuario no encontrado` según el caso.
- [x] T167 [US22b] Integrar en `src/app.js` la selección de vista login/pública/shell, el formulario `login-form`, `logout`, la redirección a la vista solicitada, `touchSession()` y la resolución de usuario/rango en cada render o mutación.
- [x] T168 [P] [US23c] Crear `src/auth/permissions.js` con `ROLES`, `PERMISSION_MATRIX` derivada del catálogo canónico de `spec.md` («Catálogo canónico de acciones»), `can()` y `assertPermission()`, denegando por defecto y excluyendo a `Sistema` de la matriz interactiva.
- [x] T169 [US23c] Conectar `assertPermission()` en `src/storage.js` antes de todas las mutaciones y escrituras directas, con `context.ownerId`/`campaignOwnerId`, mensaje exacto `No tienes permiso para realizar esta acción`, y ejecución de automatizaciones como `Sistema`.
- [x] T170 [US14a] Adaptar `src/components/shell.js` para filtrar `NAV_ITEMS` con `can()`, mostrar nombre/rango del usuario en la barra superior, añadir el menú con «Cerrar sesión» y «Gestionar usuarios» solo para N4, sin crear entrada lateral.
- [x] T171 [US15a] Adaptar `src/components/dashboard.js` para filtrar las acciones rápidas con `can()` y evitar que rangos no autorizados vean botones de creación, gestión o búsqueda.
- [x] T172 [US23b] Crear `src/components/users-admin.js` con `renderUsersAdminHtml()`, `renderUserFormHtml()`, `collectUserData()`, lista de usuarios y `select` de rangos, rechazando duplicados normalizados y sin ofrecer edición de la matriz.
- [x] T173 [US23b] Conectar en `src/app.js` las acciones `manage-users`, `user-form`, `edit-user` y `deactivate-user` con `src/auth.js`, refrescando la vista activa tras cambios de rango o desactivación.
- [x] T174 [US2c] Sustituir en `src/module-config.js` y `src/components/form-fields.js` el texto libre de `ejecutivo_asignado` por un `select` poblado desde `src/auth.js` con usuarios activos N2/N4, guardando el `userId`.
- [x] T175 [US17b] Adaptar `src/utils/sales-team-metrics.js` y la persistencia de `marketing.salesTeams` en `src/storage.js` para vincular integrantes por `userId` y calcular real/objetivo usando `assignedUserIdAtSale` cuando exista y el `ejecutivo_asignado` vigente en su defecto.
- [x] T176 [US2d] Implementar en `src/storage.js` la migración de `ejecutivo_asignado` desde texto heredado a `userId`, resolviendo nombres de usuarios activos N2/N4, marcando «Sin asignar» los inactivos y conservando documentos e historial de ventas.
- [x] T177 [US23c] Ejecutar `npm test` y `npm run lint` definidos en `package.json`, corregir fallos en `src/` y `tests/` y verificar que la Fase 25 no rompe las fases 1-24.
- [x] T178 [US15b] Crear `tests/integration/usability-criteria.test.js` y `tests/integration/usability-checklist.md` para ejecutar la prueba cronometrada de SC-003 con cinco participantes que creen, editen, eliminen y busquen una entidad sin ayuda, registrando resultados y al menos 90% de éxito.
- [x] T179 [US16c] Crear `tests/integration/prospect-conversion.test.js` para verificar que un prospecto solo se convierte en Cliente mediante regla automática/campaña o edición de Nivel 4, sin selector de etapas, conservando `id`, documentos y campos personalizados y registrando auditoría; comprobar que el valor interno es `ganado`, que su etiqueta visible es «Cliente ganado» y que «Cerrado ganado» sigue siendo un estado de documento; ajustar `src/storage.js` y `src/utils/marketing-stage.js` según FR-068.
- [x] T180 [US16a] Ampliar `tests/integration/public-access.test.js` y ajustar `src/components/marketing-chat.js` con `src/utils/capture-prospect.js` para exigir consentimiento y datos mínimos de prospecto antes del primer mensaje, vinculando las consultas sin coincidencia a esa entidad (FR-083, FR-085).
- [x] T181 [US5] Ampliar `tests/unit/module-config.test.js` para exigir validación autocontenida de `fieldRules`, `statusLifecycle.pendingStates`, `marketing.faq`, `marketing.privacyNoticeVersion` y `marketing.campaigns.actions`, con fallback a `DEFAULT_CONFIG` y advertencia visible.
- [x] T182 [US23c] Ampliar `tests/unit/permissions.test.js` y `tests/unit/storage.test.js` para verificar denegación de lecturas, agregaciones y acciones con sufijo `_own` cuando `ownerId`/`campaignOwnerId` falta o no coincide, según el catálogo canónico de `spec.md`.
- [x] T183 [US17b] Ampliar `tests/unit/sales-team-metrics.test.js` y `tests/integration/executive-assignment-migration.test.js` para conservar `assignedUserIdAtSale` tras desactivar o cambiar de rango al ejecutivo, verificar que FR-078/FR-079 lo consumen antes que el campo vigente, mantener el historial de ventas y excluirlo de nuevas asignaciones.
- [x] T184 [US20c] Ampliar `tests/unit/marketing-campaigns.test.js` y `tests/integration/marketing-campaigns.test.js` para persistir `createdByUserId` en campañas y conservarlo tras cambio de rango o desactivación del creador, separándolo de la ejecución como `Sistema`.
- [x] T185 [US23c] Ejecutar `npm test` y `npm run lint` definidos en `package.json` tras T178-T184, corregir fallos en `src/`/`tests/` y verificar que T001-T184 y las fases 1-25 siguen en verde sin cambiar los marcadores `[x]` existentes; este gate cubre US5, US15, US16 y US23.
- [x] T186 [US23] Ejecutar `npm run format:check` definido en `package.json`, corregir el formato de `src/`, `tests/`, `specs/`, `README.md` y archivos de configuración, y verificar que la comprobación termina sin cambios pendientes; esta tarea cierra el gate de calidad sin renumerar T001-T185 ni modificar marcadores `[x]`.

## Phase 26: Remediación de consistencia (I1, I2, U1, U2, U3, A1, D1) (Prioridad: P1)

**Objetivo**: Alinear implementación y pruebas con rutas relativas, terminología de conversión, reglas de casos límite, presupuesto de rendimiento, mensajes exactos, redacción verificable y lista canónica de campos de búsqueda, sin renumerar T001-T186 ni cambiar sus marcadores.

**Prueba independiente**: Abrir cada ruta relativa y recargarla o usar Back/Forward; distinguir «Cliente ganado» de «Cerrado ganado»; ejecutar los casos límite con resultados observables; medir 500 entidades y 500 documentos; comprobar los doce mensajes exactos; verificar FR-004/FR-020/FR-055 con una sola lista canónica.

- [x] T187 [US23c] Crear `tests/integration/relative-routes.test.js` para resolver la vista desde `location.search` en carga inicial, recarga y Back/Forward con `?view=capture`, `?view=summary`, `?view=marketing`, `?view=manage-entity`, `?view=manage-document` y `?view=users-admin`, sin `?view=panel`, conservando la ruta al redirigir a login y restaurándola tras autenticarse; comprobar que `?view=capture` sigue público y que un usuario autenticado sin permiso ve «Acceso denegado» y vuelve al Panel.
- [x] T188 [US23c] Ajustar `src/app.js`, `src/components/login.js` y `src/components/shell.js` para eliminar cualquier dependencia de host o ruta de servidor, aplicar la matriz en cada resolución de ruta y mantener navegación, botones y acciones rápidas coherentes con la matriz de permisos (FR-094, FR-097).
- [x] T189 [US16c] Ampliar `tests/integration/prospect-conversion.test.js` y `tests/unit/marketing-performance.test.js` para comprobar que el valor interno de conversión es `ganado`, que su etiqueta visible es «Cliente ganado» y que «Cerrado ganado» sigue siendo exclusivamente un estado de `Documento` en tarjetas, embudo, equipo y rendimiento; ajustar `src/utils/marketing-stage.js`, `src/utils/marketing-stats.js` y `src/module-config.js` sin cambiar datos persistidos.
- [x] T190 [U1] Crear `tests/integration/edge-case-rules.test.js` con resultados observables para: búsqueda sin coincidencias; editar o eliminar entidad inexistente sin mutación; fechas inválidas y conservación de valores históricos; cascada de documentos; `endDate < startDate`; colisión de clave de campo personalizado; tipo de campo o transición desconocidos; valores huérfanos guardados y ocultos; enlaces profundos con Back/Forward y recarga; cambios sin guardar; estados cero; color de acento inválido; barra lateral estrecha; ficha sin documentos; pendientes empatados por `id`; y sesión conforme a FR-102.
- [x] T191 [U2] Crear `tests/performance/render-search.test.js` con 500 entidades y 500 documentos para medir renderizado, búsqueda y recálculo de derivados en 200 ms p95 en el navegador de escritorio moderno de referencia y 500 ms p95 en el navegador low-end/móvil de referencia, sin congelación visible, con una sola pasada por juego de datos y sin persistir resultados derivados; ajustar las utilidades de agregación que superen el umbral.
- [x] T192 [U3] Crear `tests/integration/exact-messages.test.js` para exigir los doce textos exactos `No se encontraron resultados.`, `Completa los campos obligatorios.`, `El RUT es inválido.`, `El RUT ya está registrado.`, `Revisa el dato de contacto según el canal elegido.`, `Prospecto registrado correctamente.`, `Consulta registrada; un ejecutivo hará seguimiento.`, `Sin registros para esta campaña.`, `No tienes permiso para realizar esta acción`, `Acceso denegado`, `Ingresa una contraseña` y `Usuario no encontrado` en los flujos de FR-005, FR-006, FR-057, FR-061, FR-069, FR-083, FR-087, FR-096, FR-097 y US22; ajustar los componentes que usen variantes.
- [x] T193 [D1] Ampliar `tests/unit/search-fields.test.js` y `tests/unit/module-config.test.js` para verificar que FR-004 es la única lista canónica de campos buscables, que FR-020 y FR-055 solo aplican el perfil mediante `fieldRules` o una anulación explícita, y que ningún campo queda buscable en un sitio y excluido en otro sin esa declaración; ajustar `src/utils/field-rules.js` y `src/module-config.js`.
- [x] T194 [A1] Revisar `plan.md`, `spec.md`, `tasks.md`, `quickstart.md` y los contratos para comprobar que no quedan URL absolutas ni adjetivos subjetivos sin respaldo medible, que los mensajes exactos y la terminología coinciden, y ejecutar `npm test`, `npm run lint` y `npm run format:check`, conservando los marcadores `[X]` de T001-T186.

**Punto de control**: Login, permisos por rango, administración de usuarios, atribución histórica, conversión de prospectos y usabilidad son verificables de forma independiente; T185 ejecuta el gate final funcional de US5, US15, US16 y US23, T186 cierra el gate de formato y T187-T194 verifican la remediación de consistencia.

---

## Phase 27: US25 - Registrar y gestionar tickets de Postventa (Prioridad: P2)

**Objetivo**: Añadir «Postventa» como quinta opción de la barra lateral con `?view=postventa`, botón «Nuevo Ticket», tres tarjetas derivadas de tickets y una tabla con cambio libre de estado, reutilizando `Documento` como único almacenamiento y validando permisos en la capa de datos.

**Prueba independiente**: Con `atencion` (N1) y `gerente` (N4), abrir `?view=postventa`, crear un ticket en `Abierto` para un cliente existente, ver «Tickets abiertos» en 1, cambiar a `Resuelto` con nota, reabrir a `Abierto`, recargar y confirmar que el ticket sigue en la ficha del cliente y que las tarjetas coinciden con los estados almacenados; con `ventas` (N2) ver solo tickets de sus clientes y sin controles de creación/cambio; con `marketing` (N3) y visitante, denegación también por enlace profundo, consola y llamada directa a `src/storage.js`.

### Pruebas de US25

> **Nota**: Estas suites se escriben primero y deben fallar antes de la implementación.

- [ ] T195 [P] [US25] Crear `tests/unit/postventa.test.js` para exigir que `validatePostventaConfig()` acepte solo `states = ['Abierto', 'En revisión', 'Resuelto']`, `categoryOptions` con «Soporte técnico», «Facturación», «Garantía» y «Consulta», `priorityOptions` con «Baja», «Media» y «Alta» sin preselección, `cardMapping = { abiertos: 'Abierto', enProceso: 'En revisión', resueltos: 'Resuelto' }`, `resolutionNoteStates = ['Resuelto']` y `transitions: []` con significado de cualquier par, incluida `Resuelto → Abierto`; verificar `isTicket()` y que `computeTicketStats()` cuente cada ticket una sola vez en una pasada.
- [ ] T196 [P] [US25] Crear `tests/unit/postventa-permissions.test.js` para exigir en `src/auth/permissions.js` las acciones canónicas `postventa:view`, `postventa:view_own`, `postventa:create` y `postventa:transition`, con N4 y N1 creando/cambiando cualquier estado, N2 solo `postventa:view_own` con `ownerId`, y N3/visitante denegados por defecto con `No tienes permiso para realizar esta acción`.
- [ ] T197 [P] [US25] Crear `tests/unit/postventa-storage.test.js` para exigir que `createTicketDocument()`, `changeTicketStatus()` y `listTicketDocuments()` en `src/storage.js` comprueben permisos antes de leer o escribir, rechacen `entity_id` inexistente, vinculen el ticket al cliente, acepten cualquier transición entre `Abierto`, `En revisión` y `Resuelto`, persistan `nota_resolucion` solo en `Resuelto`, actualicen `updatedAt` y no escriban en `localStorage` cuando `can()` sea falso.
- [ ] T198 [P] [US25] Crear `tests/integration/postventa-view.test.js` para verificar en `src/components/shell.js` y `src/app.js` que «Postventa» aparece como quinta opción después de Marketing, que `?view=postventa` resuelve en carga, recarga y Back/Forward con resaltado activo, que «Nuevo Ticket» va arriba y las tarjetas «Tickets abiertos», «En proceso» y «Resueltos» debajo de la tabla, que el desplegable «Cliente» filtra por nombre y no ofrece clientes con `archivedAt`, y que sin tickets se muestran ceros y un estado vacío explícito.
- [ ] T199 [P] [US25] Crear `tests/integration/postventa-permissions.test.js` para comprobar que `atencion` y `gerente` crean tickets y cambian cualquier estado, que `ventas` ve solo tickets de clientes con `ejecutivo_asignado` igual a su `id` y no ve botón ni control de estado, que `marketing` y el visitante reciben «Acceso denegado» o login desde `?view=postventa`, y que las llamadas directas a `src/storage.js` o desde consola se rechazan con `No tienes permiso para realizar esta acción` sin mutar datos.
- [ ] T200 [P] [US25] Crear `tests/integration/postventa-customer-detail.test.js` para verificar que un ticket creado desde Postventa aparece en la ficha de su cliente con «Asunto», «Categoría», «Prioridad», «Estado» y «Nota de resolución», que el texto persistido se sanitiza, que un guardado sin prioridad o en `Resuelto` sin nota muestra exactamente `Completa los campos obligatorios.` y que eliminar el cliente elimina sus tickets por `entity_id`.

### Implementación de US25

- [ ] T201 [P] [US25] Crear `src/utils/postventa.js` con `isTicket()`, `validatePostventaConfig()`, `validateTicketValues()` y `computeTicketStats()`, usando `ticket: true` como discriminador, las opciones exactas declaradas, prioridad sin preselección, nota obligatoria solo en `Resuelto` con `Completa los campos obligatorios.`, y una sola pasada para `{ abiertos, enProceso, resueltos }` según `cardMapping`.
- [ ] T202 [US25] Añadir el bloque opcional `postventa` a `DEFAULT_CONFIG` en `src/module-config.js` y validarlo con `validatePostventaConfig()` desde `src/utils/postventa.js`, manteniendo el comportamiento base intacto cuando el bloque está ausente.
- [ ] T203 [US25] Ampliar `src/auth/permissions.js` con `postventa:view` para N4/N1, `postventa:view_own` para N4/N2 con `ownerId`, y `postventa:create`/`postventa:transition` para N4/N1, sin conceder `document:edit_any` a N1 ni acciones a N3/visitante.
- [ ] T204 [US25] Implementar en `src/storage.js` `createTicketDocument()`, `changeTicketStatus()` y `listTicketDocuments()` sobre la ruta existente de `Documento`, llamando a `assertPermission()` con las acciones `postventa:*`, validando `entity_id` existente, cualquier par de estados declarado, `nota_resolucion` condicional, `updatedAt` y el mensaje exacto de denegación sin escritura.
- [ ] T205 [US25] Añadir `postventa` a `NAV_ITEMS` en `src/components/shell.js` inmediatamente después de `marketing`, con etiqueta «Postventa», resaltado por `state.view` y filtrado por `can()` para N1, N2 y N4.
- [ ] T206 [US25] Registrar `postventa` en `ROUTE_VIEWS`, `VIEW_ROUTES` y `routeFromKey()` en `src/app.js`, resolviendo `?view=postventa` desde `location.search` en carga, recarga y Back/Forward y aplicando la matriz antes de renderizar.
- [ ] T207 [US25] Crear `src/components/postventa.js` con botón «Nuevo Ticket» arriba, las tres tarjetas y la tabla debajo, campos en orden «Cliente», «Asunto», «Categoría», «Prioridad», «Estado» y «Nota de resolución», buscador `#ticket-client-search`, opciones exactas sin preselección, control de estado, mensaje `Completa los campos obligatorios.`, `No tienes permiso para realizar esta acción`, estado vacío y `escapeHtml()` para texto persistido.
- [ ] T208 [US25] Cablear en `src/app.js` las acciones `ticket-form`, `ticket-client-search`, `ticket-save` y `ticket-status-change` con `src/storage.js`, volviendo a renderizar tarjetas y tabla tras cada mutación sin recarga.
- [ ] T209 [US25] Adaptar `src/components/entity-detail.js` para mostrar los tickets del cliente desde el historial de documentos con sus campos de Postventa, sin crear una lista persistida adicional.
- [ ] T210 [US25] Ejecutar `npm test`, `npm run lint` y `npm run format:check` tras T195-T209, corregir fallos en `src/` y `tests/` y verificar que T001-T194 siguen en verde sin cambiar sus marcadores `[x]`.

**Punto de control**: Postventa es funcional de forma independiente con N1/N4 creando y reabriendo tickets, N2 limitado a sus clientes y N3/visitante denegado en UI, enlaces profundos y capa de datos; T210 cierra el gate funcional y de calidad del incremento.

---

## Dependencias y orden de ejecución

### Dependencias de fases

- **Phase 1 (Setup)**: sin dependencias; solo verifica el entorno existente.
- **Phase 2 (Foundational)**: depende de Setup y bloquea todas las historias.
- **Phase 3-23 (historias)**: comienzan tras Foundational; se entregan en el orden de prioridad del documento, no en orden de dependencia.
- **Phase 24 (Polish)**: depende de que estén completas las historias que se desean incluir en la entrega.
- **Phase 25 (Inicio de sesión y rangos)**: se añade tras Polish sin renombrar fases existentes; depende de Setup, Foundational y de los contratos de `src/components/shell.js`, `src/components/dashboard.js`, `src/storage.js` y Marketing definidos en Phase 14-23.
- **Phase 26 (Remediación de consistencia)**: se ejecuta tras Phase 25 sin renombrar T001-T186; depende de los contratos de rutas relativas, mensajes exactos, terminología, casos límite, rendimiento y búsqueda canónica ya declarados en `spec.md`, `plan.md` y los contratos.
- **Phase 27 (US25 Postventa)**: se ejecuta tras Phase 26 sin renombrar T001-T194; depende de Setup, Foundational, de la matriz de US23, de la relación entidad-documento de US1/US11 y de los contratos `contracts/postventa.md`, `contracts/auth.md` y `contracts/entity-storage.md`.

### Dependencias entre historias

- **US1 (P1)**: sin dependencias entre historias; define identidad y vínculo para US3, US4 y US16.
- **US3 (P1)**: depende de los registros de US1/US2 y de la pantalla de gestión de US4 para reflejar ediciones.
- **US4 (P1)**: depende de US1 para el modelo y precede a US15 como destino de las acciones rápidas.
- **US5 (P1)**: prerrequisito lógico de US7, US8, US14, US15 y de todo el bloque Marketing.
- **US7 (P1)**: depende de US5 para `labels` y de la regla de fecha compartida con US10.
- **US8 (P1)**: depende de US5 y alimenta US2, US11, US18, US19 y US21.
- **US14 (P1)**: depende de US5 para nombre, tema y terminología; reestructura la navegación de US4 y US15.
- **US15 (P1)**: depende de US14 para el marco y de las estadísticas compartidas con US16.
- **US2 (P2)**: depende de US5, US7, US8 y US10; US3 bloquea su ficha cuando faltan datos.
- **US9 (P2)**: reutiliza `searchEntities()` de US1 y las reglas de visibilidad de US8.
- **US10 (P2)**: depende de US5 y US7; conserva valores históricos junto con US2.
- **US11 (P2)**: depende de US1 y US8 para campos de documento y cascada.
- **US12 (P2)**: depende de US9 y US14 para pantalla y navegación.
- **US13 (P2)**: depende de US5/US8 y del resumen de US6 para `pendingStates`.
- **US16 (P2)**: depende de US15 para las tarjetas compartidas y de US8 para campos personalizados; habilita US17-US21.
- **US17 (P2)**: depende de US16, US2 y US11 para ejecutivos y documentos de venta.
- **US18 (P2)**: depende de US16 y US8 para vincular `Documento` y declarar campos de redes.
- **US19 (P2)**: depende de US16/US18 para consentimiento, FAQ e historial compartido.
- **US20 (P2)**: depende de US16, US18 y US19 para eventos y reglas existentes.
- **US21 (P2)**: depende de US16-US20 para los registros que alimentan los indicadores.
- **US6 (P2)**: depende de US2, US3, US11 y US13 para totales y pendientes.
- **US22 (P1)**: depende de Foundational y de US14/US15 para envolver la navegación sin romper las vistas públicas existentes; habilita la identidad de US23 y la validación de usabilidad T178.
- **US23 (P1)**: depende de US22 para resolver rango y estado del usuario, y de US1/US8/US16-US21 para aplicar la matriz sobre clientes, documentos, equipos, campañas y chat; T182-T184 cierran lecturas/agregaciones y atribución histórica.
- **Correcciones US5/US15/US16 (P1)**: T178, T179, T180 y T181 dependen respectivamente de las definiciones de SC-003, FR-068, FR-083/FR-085 y del esquema `ModuleConfig` ya corregidos en `spec.md`.
- **Remediación I1/I2/U1/U2/U3/A1/D1 (P1)**: T187-T194 dependen de Phase 25 y de las definiciones corregidas de rutas relativas, terminología, casos límite, FR-032/SC-004, mensajes exactos y FR-004/FR-020/FR-055; T194 cierra el gate documental y de ejecución sin renumerar T001-T186.
- **US25 (P2)**: depende de US1/US11 para `Documento` y su vínculo `entity_id`, de US23 para `can()`/`assertPermission()` y de US14 para la barra lateral; no altera los cinco atajos de Marketing, el `statusLifecycle` global ni las acciones `document:*` existentes.
- **US24 (P1)**: permanece documentada en `spec.md` (FR-103, SC-038) pero sin fase en este incremento; requiere artefactos de diseño propios antes de generar sus tareas.

### Dentro de cada historia

- Las pruebas marcadas al inicio de la fase se escriben primero y deben fallar antes de la implementación.
- La configuración declarativa precede a los componentes; los componentes preceden al cableado en `src/app.js`.
- Las utilidades puras preceden a las vistas que las consumen; el historial de `Documento` es la única fuente de ejecuciones.
- En US22: auth y hash antes que login, y login antes que el cableado de sesión en `src/app.js`.
- En US23: matriz y `assertPermission()` antes que filtros de navegación, administración de usuarios o migración de ejecutivos; T185 se ejecuta después de T178-T184 como gate final funcional de US5, US15, US16 y US23, y T186 cierra el gate de formato.
- En Phase 26: T187/T188 resuelven rutas antes de T189-T193, y T194 se ejecuta al final con `npm test`, `npm run lint` y `npm run format:check`.
- Clarificaciones Marketing: T134/T135 preceden a T136-T137; T138 precede a T139; T140 depende de T139; T141 precede a T142-T143; T144 y T145 cierran la regresión.
- En US25: T195-T200 se escriben primero y fallan; T201/T202 definen la configuración y las utilidades puras antes de T203-T209; la matriz T203 precede al filtro de navegación T205 y a la capa de datos T204; el componente T207 y el cableado T208 se integran después de T204/T206; T210 ejecuta el gate final.

## Oportunidades de paralelismo

- Setup: T001, T002, T003 y T004 pueden ejecutarse en paralelo porque tocan `package.json`, `vitest.config.mjs`, `index.html` y `tests/setup/test-setup.js`.
- Foundational: T005, T007, T009, T011 y T013 pueden avanzar juntas; cada implementación (T006, T008, T010, T012, T014) parte de su prueba correspondiente.
- US2: T053-T057 son cinco suites independientes en `tests/integration/`; la configuración de T058 y las adaptaciones T059-T062 se hacen después.
- US16: T083-T086 cubren consentimiento, estadísticas, captura y panel en archivos de prueba distintos; T087-T093 se implementan después.
- Marketing P2: US17, US18, US19, US20 y US21 pueden repartirse entre personas distintas una vez cerrada US16, siempre que cada una mantenga sus propias suites en `tests/unit/` y `tests/integration/`.
- Polish: T126-T131 y T133 tocan archivos de prueba o documentación distintos y pueden ejecutarse en paralelo; T132 se ejecuta al final.
- US22: T146/T147/T148 comparten `auth.test.js`, T149/T150/T152 comparten `login.test.js`, T151/T180 comparten `public-access.test.js` y T159/T160 comparten `navigation-by-rank.test.js`; ninguna lleva `[P]`. T164-T167 se implementan después de esas pruebas.
- US23: T154-T158 y T161 son suites independientes por rango/administración y conservan `[P]`; T153/T182, T162/T183, T163/T182 y T159/T160 comparten archivos de prueba y no llevan `[P]`. T168-T177 se implementan después de la matriz y de US22.
- Correcciones post-análisis: T178 y T179 usan archivos propios, mientras T180-T184 amplían suites existentes o dependen del esquema/catálogo/atribución definidos; ninguna lleva `[P]`. T185 depende de todas ellas y tampoco lleva `[P]`; T186 depende de T185 y tampoco lleva `[P]`.
- Remediación: T187/T190/T191/T192 crean suites propias; T188/T189/T193 ajustan módulos existentes y T194 depende de todas ellas sin llevar `[P]`.
- Clarificaciones Marketing: T134, T135, T138, T140, T141 y T144 son suites independientes; T136-T137, T139 y T142-T143 se implementan después de sus pruebas; T145 se ejecuta al final.
- US25: T195-T200 son seis suites independientes en `tests/unit/` y `tests/integration/`; T201 también puede avanzar en paralelo porque crea `src/utils/postventa.js`; T202-T210 se encadenan según las dependencias de configuración, permisos, almacenamiento, ruta, componente y cableado, y T210 se ejecuta al final.

### Ejemplo de paralelismo: US16

```bash
T083 "Ampliar tests/unit/capture-consent.test.js ..."
T084 "Ampliar tests/unit/marketing-stats.test.js ..."
T085 "Ampliar tests/integration/marketing-capture.test.js ..."
T086 "Ampliar tests/integration/marketing-dashboard.test.js ..."
```

### Ejemplo de paralelismo: campañas y rendimiento

```bash
T110 "Crear tests/unit/marketing-campaigns.test.js ..."
T112 "Crear tests/integration/marketing-campaigns.test.js ..."
T116 "Crear tests/unit/marketing-performance.test.js ..."
T118 "Crear tests/integration/marketing-performance.test.js ..."
```

### Ejemplo de paralelismo: inicio de sesión y rangos

```bash
T154 "Crear tests/integration/role-n4.test.js ..."
T155 "Crear tests/integration/role-n3.test.js ..."
T156 "Crear tests/integration/role-n2.test.js ..."
T157 "Crear tests/integration/role-n1.test.js ..."
```

### Ejemplo de paralelismo: clarificaciones Marketing

```bash
T134 "Ampliar tests/integration/dashboard.test.js ..."
T135 "Ampliar tests/integration/marketing-dashboard.test.js ..."
T138 "Ampliar tests/integration/marketing-navigation.test.js ..."
T141 "Ampliar tests/integration/marketing-chat.test.js ..."
```

### Ejemplo de paralelismo: US25

```bash
T195 "Crear tests/unit/postventa.test.js ..."
T196 "Crear tests/unit/postventa-permissions.test.js ..."
T197 "Crear tests/unit/postventa-storage.test.js ..."
T198 "Crear tests/integration/postventa-view.test.js ..."
T199 "Crear tests/integration/postventa-permissions.test.js ..."
T200 "Crear tests/integration/postventa-customer-detail.test.js ..."
```

## Estrategia de implementación

### MVP primero

1. Completar Phase 1 (Setup) y Phase 2 (Foundational).
2. Completar Phase 3 (US1: identidad, código único y relación entidad-documento).
3. **DETENER Y VALIDAR**: ejecutar T015 y T016 y comprobar la prueba independiente de US1.
4. Mostrar una demo mínima con cliente e interacción persistidos; no incluir Marketing todavía.

### Entrega incremental

1. Añadir US3, US4, US5, US7, US8, US14 y US15 para completar el espacio de trabajo ERP base.
2. Añadir US2, US9, US10, US11, US12 y US13 para el perfil de clientes y la búsqueda avanzada.
3. Añadir US16 para habilitar Marketing con panel compartido y captura con consentimiento.
4. Añadir US17-US21 para equipo, redes, dudas y consultas, campañas y rendimiento.
5. Cerrar con US6 y Polish; cada fase se valida con su prueba independiente antes de continuar.
6. Añadir Phase 25 con US22 y US23 sin reordenar fases: primero sesión y matriz, luego navegación, administración de usuarios y migración de «Ejecutivo Asignado»; cerrar con T178-T184 para usabilidad, conversión interna, chat consent-first, esquema config, lecturas protegidas y atribución histórica, T185 como gate final funcional de US5, US15, US16 y US23, y T186 como gate final de formato.
7. Cerrar con Phase 26 (T187-T194) sin renumerar T001-T186: rutas relativas, terminología, casos límite, presupuesto de rendimiento, mensajes exactos, redacción verificable y búsqueda canónica.
8. Aplicar el incremento T134-T145 sobre las fases US15, US16, US17, US19 y Polish para quitar acciones rápidas de Marketing, fijar los cinco atajos y usar «Dudas y consultas» sin cambiar contratos internos.
9. Añadir Phase 27 (US25) sin renumerar T001-T194: primero las seis suites que fallan, luego configuración/utilidades, matriz, capa de datos, navegación, ruta, componente, cableado y ficha del cliente; T210 cierra el gate funcional y de calidad.

### Estrategia con equipo paralelo

- Una persona completa Setup + Foundational antes de repartir historias.
- Después de Foundational: un desarrollador toma US1-US4, otro US5-US8 y otro US14-US15.
- Tras US16: equipo A US17/US20, equipo B US18/US19, equipo C US21; US6 se asigna al cierre.
- Para Phase 25: una persona toma autenticación y sesión, otra matriz y `storage.js`, otra pruebas de rangos y administración de usuarios; la migración de ejecutivos se integra al final.

## Trazabilidad de requisitos a tareas

La tabla declara explícitamente la cobertura de los 149 requisitos buildables planificados (`FR-001`–`FR-102`, `FR-104`–`FR-109`, `SC-001`–`SC-037` y `SC-039`–`SC-040`). `FR-103` y `SC-038` (US24) permanecen sin tareas en este incremento. Las tareas marcadas `[X]`/`[x]` se conservan; `T185` es el gate final funcional de US5, US15, US16 y US23, `T186` el gate final de formato, `T187`-`T194` la cobertura adicional de I1, I2, U1, U2, U3, A1 y D1, y `T210` el gate de US25.

| Requirement Key | Task IDs                                                               | Notes                                                       |
| --------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------- |
| FR-001          | `T015`, `T017`                                                         | Identidad y código único.                                   |
| FR-002          | `T005`, `T006`, `T020`, `T026`                                         | Edición base y desde gestión.                               |
| FR-003          | `T026`, `T029`                                                         | Eliminación con recuento y cascada.                         |
| FR-004          | `T063`, `T065`, `T076`, `T193`                                         | Lista canónica de campos buscables y anulaciones de perfil. |
| FR-005          | `T019`, `T063`, `T066`, `T192`                                         | Lista, estado vacío y mensaje exacto en búsqueda/ficha.     |
| FR-006          | `T059`, `T075`, `T089`, `T192`                                         | Mensajes exactos de validación.                             |
| FR-007          | `T005`, `T006`, `T016`                                                 | Consistencia CRUD.                                          |
| FR-008          | `T025`, `T073`, `T074`                                                 | Altas, ediciones y bajas de documentos.                     |
| FR-009          | `T016`, `T018`, `T029`, `T074`                                         | Vínculo exacto y cascada.                                   |
| FR-010          | `T048`, `T050`, `T051`                                                 | Panel y acciones rápidas.                                   |
| FR-011          | `T043`, `T045`                                                         | Marco persistente.                                          |
| FR-012          | `T043`, `T045`, `T159`, `T170`                                         | Barra lateral filtrada por rango.                           |
| FR-013          | `T024`, `T027`, `T051`                                                 | Acceso a entidades desde el panel.                          |
| FR-014          | `T024`, `T027`, `T051`                                                 | Acceso a documentos desde el panel.                         |
| FR-015          | `T047`, `T077`                                                         | Botón Panel y retorno al inicio.                            |
| FR-016          | `T024`, `T027`                                                         | Gestión sin lista de entidades.                             |
| FR-017          | `T024`, `T026`, `T027`                                                 | CRUD de entidades en gestión.                               |
| FR-018          | `T025`, `T027`, `T028`                                                 | CRUD de documentos en gestión.                              |
| FR-019          | `T076`, `T077`                                                         | Pantalla de búsqueda dedicada.                              |
| FR-020          | `T063`, `T065`, `T076`, `T193`                                         | Aplicación del perfil sin lista independiente.              |
| FR-021          | `T051`, `T076`, `T077`                                                 | Accesos a búsqueda.                                         |
| FR-022          | `T047`, `T128`                                                         | Confirmación al salir con cambios.                          |
| FR-023          | `T007`, `T008`, `T033`                                                 | Carga de configuración.                                     |
| FR-024          | `T007`, `T008`, `T031`                                                 | Valores predeterminados.                                    |
| FR-025          | `T031`, `T033`                                                         | Configuración inválida con advertencia.                     |
| FR-026          | `T011`, `T012`, `T041`                                                 | Campos personalizados en formularios.                       |
| FR-027          | `T037`, `T040`, `T042`                                                 | Validación de campos personalizados.                        |
| FR-028          | `T038`, `T042`                                                         | Campos personalizados en listas/ficha.                      |
| FR-029          | `T034`, `T035`                                                         | Etiquetas derivadas de configuración.                       |
| FR-030          | `T079`, `T081`                                                         | Transiciones configuradas por cualquier vía.                |
| FR-031          | `T079`, `T081`                                                         | Estado como texto libre.                                    |
| FR-032          | `T064`, `T126`, `T191`                                                 | 500 entidades y 500 documentos con umbrales p95.            |
| FR-033          | `T048`, `T051`, `T171`                                                 | Cinco acciones rápidas filtradas por rango.                 |
| FR-034          | `T028`, `T051`                                                         | Formulario vacío desde acción rápida.                       |
| FR-035          | `T049`, `T050`, `T052`, `T084`, `T133`                                 | Tarjetas y embudo canónicos.                                |
| FR-036          | `T043`, `T045`                                                         | Marca en barra superior.                                    |
| FR-037          | `T045`, `T047`                                                         | Módulo activo resaltado.                                    |
| FR-038          | `T008`, `T046`                                                         | Color de acento con fallback.                               |
| FR-039          | `T043`, `T045`                                                         | Barra estrecha operable.                                    |
| FR-040          | `T039`, `T129`                                                         | Valores huérfanos conservados.                              |
| FR-041          | `T019`, `T022`, `T023`                                                 | Ficha de entidad.                                           |
| FR-042          | `T021`, `T022`                                                         | Historial ordenado por fecha.                               |
| FR-043          | `T020`, `T022`                                                         | Ficha refleja ediciones.                                    |
| FR-044          | `T081`, `T123`, `T124`                                                 | Indicadores y precedencia de pendientes.                    |
| FR-045          | `T122`, `T124`, `T125`                                                 | Actualización y selección desde resumen.                    |
| FR-046          | `T122`, `T125`                                                         | Estado vacío del resumen.                                   |
| FR-047          | `T036`, `T068`, `T069`                                                 | Rango de fecha de nacimiento.                               |
| FR-048          | `T067`, `T068`, `T069`                                                 | Actualización al cambiar de día.                            |
| FR-049          | `T067`, `T069`                                                         | Fecha local del dispositivo.                                |
| FR-050          | `T057`, `T071`                                                         | Valores históricos conservados y corregidos.                |
| FR-051          | `T053`, `T058`, `T129`                                                 | Campos ocultos del cliente.                                 |
| FR-052          | `T015`, `T017`, `T053`, `T058`                                         | Código interno único no visible.                            |
| FR-053          | `T058`, `T129`                                                         | Campo `pedidos` eliminado.                                  |
| FR-054          | `T039`, `T053`, `T129`                                                 | Valores ocultos conservados.                                |
| FR-055          | `T053`, `T065`, `T076`, `T193`                                         | Perfil de clientes sin contradecir FR-004.                  |
| FR-056          | `T054`, `T058`, `T059`                                                 | Campos obligatorios del cliente.                            |
| FR-057          | `T009`, `T010`, `T054`, `T059`                                         | RUT válido y único.                                         |
| FR-058          | `T057`, `T061`                                                         | Ficha bloqueada de cliente incompleto.                      |
| FR-059          | `T055`, `T058`                                                         | Canal sin preselección.                                     |
| FR-060          | `T055`, `T058`, `T060`                                                 | Casilla adicional por canal.                                |
| FR-061          | `T009`, `T010`, `T055`, `T059`                                         | Validación por canal.                                       |
| FR-062          | `T056`, `T058`, `T060`                                                 | Pista gris del RUT.                                         |
| FR-063          | `T056`, `T058`                                                         | Opciones de canal.                                          |
| FR-064          | `T056`, `T062`                                                         | Texto «Nuevo Cliente».                                      |
| FR-065          | `T056`, `T058`, `T174`                                                 | Orden de casillas y `select` de ejecutivo.                  |
| FR-066          | `T056`, `T058`                                                         | Diez opciones de tipo de actividad.                         |
| FR-067          | `T056`, `T058`, `T060`                                                 | Pistas de casilla adicional.                                |
| FR-068          | `T083`, `T088`, `T092`, `T093`, `T179`                                 | Conversión interna y auditoría.                             |
| FR-069          | `T085`, `T088`, `T089`, `T090`, `T151`                                 | Captura pública.                                            |
| FR-070          | `T092`, `T114`, `T169`                                                 | Reglas por evento y ejecución como `Sistema`.               |
| FR-071          | `T083`, `T085`, `T088`, `T089`                                         | Consentimiento de captura.                                  |
| FR-072          | `T084`, `T086`, `T087`, `T091`, `T133`                                 | Embudo compartido.                                          |
| FR-073          | `T084`, `T086`, `T087`, `T091`, `T133`                                 | Tarjetas compartidas.                                       |
| FR-074          | `T084`, `T087`, `T118`, `T133`                                         | Coincidencia panel/Marketing.                               |
| FR-075          | `T086`, `T091`, `T131`                                                 | Sin torta ni selector de etapas.                            |
| FR-076          | `T095`, `T097`, `T098`                                                 | Equipos e integrantes.                                      |
| FR-077          | `T095`, `T175`, `T183`                                                 | Integrantes y atribución histórica.                         |
| FR-078          | `T094`, `T096`, `T175`, `T183`                                         | Real mensual.                                               |
| FR-079          | `T094`, `T096`, `T175`, `T183`                                         | Objetivo mensual.                                           |
| FR-080          | `T099`, `T100`, `T102`                                                 | Apartado de redes sociales.                                 |
| FR-081          | `T099`, `T101`, `T103`                                                 | Interacciones como documentos.                              |
| FR-082          | `T104`, `T106`, `T107`, `T109`                                         | Respuestas rápidas por FAQ.                                 |
| FR-083          | `T104`, `T105`, `T106`, `T180`                                         | Consultas sin coincidencia.                                 |
| FR-084          | `T105`, `T108`, `T151`                                                 | Chat en captura y Marketing.                                |
| FR-085          | `T104`, `T105`, `T107`, `T180`                                         | Consentimiento y prospecto previo.                          |
| FR-086          | `T110`, `T112`, `T113`, `T184`                                         | Campañas e historial con creador.                           |
| FR-087          | `T116`, `T119`, `T120`                                                 | Indicadores de rendimiento.                                 |
| FR-088          | `T117`, `T121`                                                         | Campaña opcional y «Sin campaña».                           |
| FR-089          | `T110`, `T113`, `T114`                                                 | Acciones internas de campaña.                               |
| FR-090          | `T111`, `T114`                                                         | Solapamiento y omitidas.                                    |
| FR-091          | `T134`, `T135`, `T136`, `T137`                                         | Acciones rápidas solo en el panel; Marketing no las hereda. |
| FR-092          | `T141`, `T142`, `T143`                                                 | «Dudas y consultas» como terminología visible.              |
| FR-093          | `T138`, `T139`, `T140`, `T144`                                         | Cinco atajos de Marketing en orden y terminología aprobada. |
| FR-094          | `T153`, `T159`, `T168`                                                 | Matriz como fuente única.                                   |
| FR-095          | `T153`, `T163`, `T169`, `T182`                                         | Validación en capa de datos.                                |
| FR-096          | `T153`, `T156`, `T157`, `T163`, `T169`                                 | Mensaje exacto de denegación.                               |
| FR-097          | `T150`, `T160`                                                         | Acceso denegado y redirección.                              |
| FR-098          | `T146`, `T161`, `T172`, `T173`                                         | Administración de usuarios.                                 |
| FR-099          | `T056`, `T161`, `T174`                                                 | Select de ejecutivos activos.                               |
| FR-100          | `T094`, `T175`, `T183`                                                 | Vinculación del integrante y métricas.                      |
| FR-101          | `T092`, `T114`, `T184`                                                 | Identidad `Sistema` y creador persistido.                   |
| FR-102          | `T148`, `T152`, `T167`                                                 | Persistencia y revocación de sesión.                        |
| SC-001          | `T015`, `T178`                                                         | Crear entidad en menos de 2 minutos.                        |
| SC-002          | `T063`, `T064`                                                         | Búsqueda en menos de 10 segundos.                           |
| SC-003          | `T178`, `T185`                                                         | Prueba cronometrada con cinco participantes.                |
| SC-004          | `T064`, `T126`                                                         | 500 registros sin pérdida funcional.                        |
| SC-005          | `T048`, `T077`                                                         | Accesos iniciales en menos de 10 segundos.                  |
| SC-006          | `T132`, `T177`, `T185`                                                 | Sin regresiones.                                            |
| SC-007          | `T016`, `T128`                                                         | Navegación sin pérdida de datos.                            |
| SC-008          | `T030`, `T032`, `T058`                                                 | Adaptación solo por configuración.                          |
| SC-009          | `T043`, `T045`                                                         | Marco con marca consistente.                                |
| SC-010          | `T049`, `T052`, `T133`                                                 | Estadísticas del panel coincidentes.                        |
| SC-011          | `T122`, `T124`                                                         | Indicadores del resumen coincidentes.                       |
| SC-012          | `T068`, `T069`                                                         | Fechas inválidas y límite diario.                           |
| SC-013          | `T053`, `T129`                                                         | Campos ocultos del cliente.                                 |
| SC-014          | `T054`, `T055`, `T059`                                                 | Rechazo de guardados inválidos.                             |
| SC-015          | `T056`                                                                 | Pista, opciones y texto «Nuevo Cliente».                    |
| SC-016          | `T056`, `T058`                                                         | Orden y opciones de tipo de actividad.                      |
| SC-017          | `T056`, `T060`                                                         | Pistas de canales.                                          |
| SC-018          | `T084`, `T086`, `T133`                                                 | Embudo de Marketing.                                        |
| SC-019          | `T084`, `T086`, `T133`                                                 | Tarjetas de Marketing.                                      |
| SC-020          | `T043`, `T044`, `T131`                                                 | Navegación y etiquetas.                                     |
| SC-021          | `T086`, `T091`, `T131`                                                 | Sin torta ni selector.                                      |
| SC-022          | `T094`, `T095`, `T183`                                                 | Equipo y métricas.                                          |
| SC-023          | `T099`, `T100`, `T102`                                                 | Redes sociales.                                             |
| SC-024          | `T116`, `T117`, `T118`, `T119`, `T141`, `T142`, `T143`, `T180`, `T192` | «Dudas y consultas» con respuesta, acuse y consentimiento.  |
| SC-025          | `T122`, `T123`, `T124`, `T125`, `T126`, `T184`, `T192`                 | Campañas internas con historial y solapamiento.             |
| SC-026          | `T128`, `T129`, `T130`, `T192`                                         | Rendimiento por campaña coherente con los registros.        |
| SC-027          | `T134`, `T135`, `T136`, `T137`                                         | Cinco acciones rápidas solo en el panel.                    |
| SC-028          | `T141`, `T142`, `T143`                                                 | Etiquetas «Dudas y consultas» sin cambiar contratos.        |
| SC-029          | `T138`, `T139`, `T140`, `T144`                                         | Cinco atajos de Marketing en orden exacto.                  |
| SC-030          | `T104`, `T105`, `T180`                                                 | Chat con consentimiento.                                    |
| SC-031          | `T110`, `T111`, `T112`, `T184`                                         | Campañas y solapamientos.                                   |
| SC-032          | `T116`, `T117`, `T118`                                                 | Rendimiento por campaña.                                    |
| SC-033          | `T154`                                                                 | Verificaciones de Nivel 4.                                  |
| SC-034          | `T155`                                                                 | Verificaciones de Nivel 3.                                  |
| SC-035          | `T156`                                                                 | Verificaciones de Nivel 2.                                  |
| SC-036          | `T157`                                                                 | Verificaciones de Nivel 1.                                  |
| SC-037          | `T158`                                                                 | Verificaciones de visitante.                                |
| FR-104          | `T195`, `T198`, `T200`, `T201`, `T207`, `T208`                          | Ticket como `Documento`, formulario y desplegable buscable. |
| FR-105          | `T195`, `T198`, `T201`, `T207`, `T208`                                  | Tres tarjetas derivadas y actualizadas sin recarga.         |
| FR-106          | `T196`, `T199`, `T203`, `T204`, `T205`                                  | Permisos en UI, rutas y capa de datos.                      |
| FR-107          | `T195`, `T198`, `T204`, `T207`, `T208`                                  | Categorías y cambios entre cualquier par de estados.        |
| FR-108          | `T195`, `T200`, `T201`, `T204`, `T207`                                  | Prioridad sin preselección y nota condicional.              |
| FR-109          | `T195`, `T198`, `T205`, `T206`, `T207`                                  | Quinta opción, layout y estado vacío.                       |
| SC-039          | `T195`, `T198`, `T200`, `T201`, `T207`, `T208`, `T210`                   | Verificaciones funcionales de Postventa.                    |
| SC-040          | `T196`, `T199`, `T203`, `T204`, `T205`, `T206`, `T210`                   | Verificaciones de permisos de Postventa.                    |

## Notas

- `[P]` significa archivos distintos y sin dependencias pendientes; no implica que las pruebas deban ejecutarse en paralelo, porque `vitest.config.mjs` fija `fileParallelism: false`. T177 verifica la base US22/US23, T185 verifica Phase 25 completa para US5, US15, US16 y US23 y T186 verifica el formato del repositorio.
- `[USn]` permite trazar cada tarea hasta su historia y su prueba independiente en `spec.md`.
- Todas las suites se escriben antes de la implementación y se comprueba que fallan; `npm test` y `npm run lint` se ejecutan al final de cada fase y en Polish, mientras `npm run format:check` cierra la verificación de calidad en T186.
- Marketing reutiliza `Entidad` y `Documento`: no hay nueva entidad, backend, dependencias ni almacenamiento de resultados derivados.
- El campo `estado_comercial`, las reglas y las campañas son internos; Marketing no ofrece torta ni selector de etapas y el panel no ofrece «Abrir Marketing».
- La captura pública se sirve en `?view=capture` y requiere mismo origen con el `localStorage` de la aplicación.
- Phase 25 se añade después de Polish para conservar todas las fases existentes, sus números y sus marcadores `[X]`; T186 se añade tras T185 sin renumerar T001-T185 y `tasks.md` no se regenera.
- La matriz de permisos es solo código en `src/auth/permissions.js`: ninguna vista permite editarla y `Sistema` queda fuera del selector interactivo.
- El catálogo canónico de acciones está en `spec.md`; `contracts/auth.md` y `data-model.md` solo pueden reflejarlo y T153/T168 fallan si aparece una acción nueva o una variante propio/cualquiera no declarada.
- Los permisos se comprueban en UI, lecturas/agregaciones y en `src/storage.js`; la negación no es solo ocultar botones y usa siempre `No tienes permiso para realizar esta acción` o «Acceso denegado» según la capa.
- La garantía de denegación cubre la API local con sesión íntegra, incluidas las llamadas iniciadas desde consola; la manipulación deliberada de `localStorage`/`erp_session` o del entorno para falsificar identidad/rango queda fuera del alcance demostrativo sin backend.
- T183/T184 conservan `assignedUserIdAtSale` y `createdByUserId` como atribución histórica aunque el usuario cambie de rango o sea desactivado.
- Phase 26 añade T187-T194 sin renumerar ni cambiar marcadores de T001-T186; T194 verifica que no queden URL absolutas, adjetivos subjetivos sin respaldo medible, variantes de mensajes exactos ni contradicciones entre FR-004, FR-020 y FR-055.
- En el incremento de clarificaciones, los cambios de terminología son solo visuales: `chat` sigue siendo la clave, el canal y el nombre interno de `ChatConsentError`.
- Phase 27 añade T195-T210 sin renumerar ni cambiar marcadores de T001-T194; T210 verifica `npm test`, `npm run lint` y `npm run format:check` al cierre de Postventa.
- Los tickets son `Documento` con `ticket: true` y `entity_id` de un cliente existente: no hay clave `support_tickets`, resultados derivados persistidos ni cambio del `statusLifecycle` global.
- Las acciones `postventa:*` son aditivas al catálogo canónico; N1 no recibe `document:edit_any` y N3 no recibe `postventa:view` aunque pueda leer documentos genéricos.
- US24 (FR-103, SC-038) queda fuera de este incremento: sus tareas requieren primero artefactos de diseño propios y no deben inferirse de la implementación de Postventa.
