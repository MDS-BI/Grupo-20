---
description: "Lista de tareas para la implementación del módulo base ERP"
---

# Tasks: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

**Entrada**: Documentos de diseño de `/specs/001-erp-base-module/`

**Prerrequisitos**: `plan.md` (obligatorio), `spec.md` (obligatorio), `research.md`, `data-model.md`, `contracts/entity-storage.md`, `contracts/marketing.md`, `quickstart.md`

**Pruebas**: Se incluyen pruebas automatizadas por `plan.md` y `quickstart.md` con Vitest/jsdom (`npm test`, `npm run lint`); cada suite de prueba se escribe antes de la implementación correspondiente y debe fallar primero.

**Organización**: Las tareas se agrupan por historia de usuario en el orden de prioridad de `spec.md`: P1 (US1, US3, US4, US5, US7, US8, US14, US15), P2 (US2, US9, US10, US11, US12, US13, US16, US17, US18, US19, US20, US21) y P6 (US6). Dentro de cada fase, las pruebas preceden a la implementación cuando es razonable.

**Incremento actual**: T134-T145 cubren `FR-091`, `FR-092`, `FR-093`, `SC-027`, `SC-028` y `SC-029`; conservan T001-T133 como historial completado.

## Formato: `[ID] [P?] [Historia] Descripción`

- El checkbox es siempre `- [ ]`; los ID son secuenciales T001, T002, ...
- **[P]**: la tarea toca archivos distintos y no depende de tareas incompletas.
- **[Historia]**: obligatorio solo en las fases de historia de usuario (`[US1]` ... `[US21]`); ausente en Setup, Foundational y Polish.
- La descripción nombra siempre la ruta de archivo concreta y el resultado esperado.

## Convenciones de rutas

- Proyecto único: `index.html`, `package.json`, `vitest.config.mjs`, `src/` y `tests/` en la raíz del repositorio.
- Utilidades puras en `src/utils/`; componentes de interfaz en `src/components/`; pruebas unitarias en `tests/unit/` y de integración en `tests/integration/`.
- Sin backend y sin dependencias nuevas: persistencia en `localStorage` bajo `erp_entities`, `erp_documents` y `erp_marketing_config` para las definiciones editables de Marketing; los indicadores derivados no se persisten.

---

## Phase 1: Setup (infraestructura compartida)

**Propósito**: Confirmar el entorno Vite + JavaScript vanilla existente; no se añaden librerías.

- [X] T001 [P] Verificar en `package.json` que `npm test` ejecuta `vitest run`, `npm run lint` ejecuta `eslint .` y no aparecen dependencias nuevas.
- [X] T002 [P] Verificar en `vitest.config.mjs` que `environment: 'jsdom'`, `setupFiles` y `fileParallelism: false` soportan las suites de DOM planeadas.
- [X] T003 [P] Verificar en `index.html` que el único punto de entrada monta `#app` y carga `src/main.js`, sin backend ni scripts externos.
- [X] T004 [P] Verificar en `tests/setup/test-setup.js` que `localStorage` y el DOM se reinician entre pruebas y que `window.confirm` puede simularse.

**Punto de control**: Entorno listo para escribir pruebas que fallan antes de la implementación.

---

## Phase 2: Foundational (prerrequisitos bloqueantes)

**Propósito**: Contratos compartidos de almacenamiento, configuración, formatos, reglas de campo y sanitización. **CRÍTICO**: ninguna historia de usuario puede comenzar hasta completar esta fase.

- [X] T005 [P] Ampliar `tests/unit/storage.test.js` con casos de `loadEntities()`, `saveEntities()`, `addEntity()`, `updateEntity()`, `deleteEntity()`, `loadDocuments()` y `addDocument()` que exijan persistencia en `erp_entities`/`erp_documents` y marcas de tiempo ISO.
- [X] T006 Implementar en `src/storage.js` las operaciones base de lectura/escritura, `ValidationError`, `generateEntityId()` y la conservación del orden de listas y de las marcas `createdAt`/`updatedAt`.
- [X] T007 [P] Ampliar `tests/unit/module-config.test.js` para exigir que `validateConfig()`, `loadModuleConfig()` y `normalizeConfig()` acepten un perfil válido y devuelvan `DEFAULT_CONFIG` con una lista de errores ante configuración inválida o conflictiva.
- [X] T008 Implementar en `src/module-config.js` `DEFAULT_CONFIG`, `validateConfig()`, `loadModuleConfig()`, `normalizeConfig()`, `getLabel()`, `setActiveConfig()`, `getConfig()` y `sanitizeAccentColor()`, sin tocar los componentes.
- [X] T009 [P] Ampliar `tests/unit/field-formats.test.js` con casos de `cl-rut` (`12345678-9` y `12.345.678-9`), `phone`, `email`, `nonEmpty` y `normalizeClRut()` eliminando puntos, guion y espacios.
- [X] T010 Implementar en `src/utils/field-formats.js` `FORMAT_NAMES`, `hasFormat()`, `rutDigit()`, `normalizeClRut()`, `formatRut()`, `isValidRut()`, `isValidPhone()`, `isValidEmail()`, `isNonEmpty()` y `isValidFormat()` sin dependencias nuevas.
- [X] T011 [P] Ampliar `tests/unit/field-rules.test.js` con casos de `hidden`, `searchable`, `required`, `format`, `normalize`, `when`, `group`, `order`, `placeholder` y opciones `{ value, label }` sobre campos base y personalizados.
- [X] T012 Implementar en `src/utils/field-rules.js` `resolveFieldRules()`, `isConditionActive()`, `isFieldSearchable()`, `isFieldPotentiallySearchable()` y `pruneInactiveGroupValues()` con comportamiento base intacto cuando no hay reglas.
- [X] T013 [P] Ampliar `tests/unit/sanitize.test.js` con entradas que contengan `<script>`, comillas en atributos y enlaces `javascript:` para exigir escape en texto y atributos.
- [X] T014 Implementar en `src/utils/sanitize.js` `escapeHtml()` y `sanitizeText()` para todo contenido persistido que se renderice en el DOM.

**Punto de control**: Base compartida lista; las historias pueden implementarse de forma independiente.

---

## Phase 3: US1 - Definir datos compatibles con el ERP (Prioridad: P1)

**Objetivo**: Modelo de `Entidad` y `Documento` con identificadores, código interno único y vínculo referencial verificable.

**Prueba independiente**: Registrar un cliente de prueba y una interacción asociada; el sistema guarda la relación, asigna un código interno único sin solicitarlo y rechaza una interacción con `entity_id` inexistente.

### Pruebas de US1

- [X] T015 [P] [US1] Ampliar `tests/unit/storage.test.js` con `addEntity()` y `fieldRules.entity.code.generated` activo: genera `CLI-001`, rechaza códigos repetidos aunque difieran en mayúsculas o espacios, y asigna `id` y `entity_id` únicos.
- [X] T016 [P] [US1] Crear `tests/integration/entity-relations.test.js` para registrar un cliente y una interacción, recargar `erp_entities`/`erp_documents` y comprobar que el documento conserva el `entity_id` correcto.

### Implementación de US1

- [X] T017 [US1] Implementar en `src/storage.js` `generateBusinessCode()` y la comprobación de unicidad de `code` en `validateEntityData()` usando recorte, minúsculas y eliminación de espacios.
- [X] T018 [US1] Implementar en `src/storage.js` la validación de `entity_id` en `validateDocumentData()` con `errors.entity_id` claro y `countDocumentsForEntity()` para devolver el número de documentos vinculados.

**Punto de control**: La relación entidad-documento y la identidad única son verificables de forma independiente.

---

## Phase 4: US3 - Consultar antecedentes del cliente (Prioridad: P1)

**Objetivo**: Buscar una entidad, abrir su ficha y revisar un historial cronológico consistente con los registros y sus ediciones.

**Prueba independiente**: Buscar un cliente, abrir su ficha desde los resultados y comprobar que muestra sus datos y documentos ordenados por fecha, reflejando las ediciones hechas en gestión.

### Pruebas de US3

- [X] T019 [P] [US3] Ampliar `tests/integration/entity-detail.test.js` para buscar por nombre, abrir la ficha desde `src/components/entity-list.js` y verificar historial ordenado por fecha y estado vacío sin coincidencias.
- [X] T020 [P] [US3] Ampliar `tests/integration/client-history.test.js` para editar una interacción en gestión y confirmar que la ficha del cliente muestra el cambio sin recarga.

### Implementación de US3

- [X] T021 [US3] Implementar `getEntityDocuments()` en `src/storage.js` filtrando por `entity_id` y ordenando por `startDate || createdAt` de forma estable.
- [X] T022 [US3] Implementar `renderEntityDetailHtml()` en `src/components/entity-detail.js` con datos de la entidad, historial ordenado, estado vacío y acción «Editar».
- [X] T023 [US3] Añadir en `src/components/entity-list.js` el botón «Ver ficha» con `data-action="view-entity"` y `data-entity-id`, conectado en `src/app.js` a `state.detailEntityId`.

**Punto de control**: La ficha consulta los mismos registros de gestión y presenta el historial cronológicamente.

---

## Phase 5: US4 - Gestionar entidades y documentos en una pantalla dedicada (Prioridad: P1)

**Objetivo**: Una única pantalla de gestión, alcanzable solo desde el panel, con pestañas de entidades y documentos y CRUD completo sin mostrar la lista de entidades.

**Prueba independiente**: Entrar por una acción rápida del panel, alternar pestañas, crear/editar/eliminar una entidad y un documento, confirmar la cascada con recuento y volver al panel.

### Pruebas de US4

- [X] T024 [P] [US4] Ampliar `tests/integration/manage-screen.test.js` para comprobar que las acciones rápidas abren la gestión, que la lista de entidades no aparece en `#view-root` y que la barra lateral no ofrece esos apartados.
- [X] T025 [P] [US4] Ampliar `tests/integration/manage-document.test.js` para crear, editar y eliminar un documento vinculado a una entidad desde la pestaña de documentos.
- [X] T026 [P] [US4] Ampliar `tests/integration/edit-delete-entity.test.js` para confirmar que eliminar una entidad pide confirmación, indica cuántos documentos se borrarán y elimina ambos registros.

### Implementación de US4

- [X] T027 [US4] Implementar `renderManageView()`, `activeNavKey()` y los casos `manage-tab`, `quick-manage` y `quick-new-*` en `src/app.js`, soportando enlaces profundos `?view=manage-entity` y `?view=manage-document`.
- [X] T028 [US4] Implementar `renderDocumentFormHtml()`, `collectDocumentFormData()`, `buildDocumentFormBaseline()` e `isDocumentFormDirty()` en `src/components/document-form.js` con selector de entidad y campos base/personalizados.
- [X] T029 [US4] Implementar `onDeleteEntity()` en `src/app.js` usando `countDocumentsForEntity()` de `src/storage.js` para el mensaje de confirmación con recuento y la eliminación en cascada.

**Punto de control**: Gestión y navegación de vuelta al panel funcionan sin pérdida de registros.

---

## Phase 6: US5 - Definir un perfil de configuración del módulo (Prioridad: P1)

**Objetivo**: Adaptar identidad, terminología, campos, ciclo de vida y tema desde un único archivo sin modificar el código central.

**Prueba independiente**: Cargar un perfil de Ventas y ver el nombre y términos configurados en panel y marco; al quitar la configuración, volver a Entidad/Documento sin errores.

### Pruebas de US5

- [X] T030 [P] [US5] Ampliar `tests/unit/module-config.test.js` con un perfil que declare `moduleName`, `labels`, `customFields`, `statusLifecycle` y `theme.accentColor`, y con los casos de ausencia y de configuración conflictiva.
- [X] T031 [P] [US5] Ampliar `tests/integration/config-warning.test.js` para exigir el banner visible `#config-warning` y que el panel, la búsqueda y la gestión sigan utilizables con `DEFAULT_CONFIG`.

### Implementación de US5

- [X] T032 [US5] Completar en `src/module-config.js` la declaración de `MODULE_CONFIG`, `RESERVED_ENTITY_KEYS`, `RESERVED_DOCUMENT_KEYS` y la validación de choques de claves y tipos de campo desconocidos.
- [X] T033 [US5] Conectar `loadModuleConfig()`, `setActiveConfig()`, `document.title` y el banner de advertencia en `initApp()` de `src/app.js`.

**Punto de control**: El perfil se carga, retrocede con aviso y no bloquea la aplicación.

---

## Phase 7: US7 - Reetiquetar pantallas desde la configuración (Prioridad: P1)

**Objetivo**: Toda etiqueta visible derive de `labels` y de la regla de fecha activa, sin filtrar términos genéricos.

**Prueba independiente**: Mapear Entidad→Cliente y Documento→Pedido de Venta; verificar pestañas, botones, encabezados, mensajes de vacío y «Fecha de nacimiento» en todas las pantallas.

### Pruebas de US7

- [X] T034 [P] [US7] Ampliar `tests/integration/relabeling.test.js` para comparar términos configurados frente a `DEFAULT_CONFIG` en `src/components/shell.js`, `src/components/dashboard.js`, `src/components/entity-form.js`, `src/components/document-form.js`, `src/components/entity-list.js`, `src/components/document-list.js`, `src/components/entity-detail.js` y `src/components/search-bar.js`.

### Implementación de US7

- [X] T035 [US7] Sustituir texto fijo por `getLabel(config, clave)` en `src/components/shell.js`, `src/components/dashboard.js`, `src/components/entity-form.js`, `src/components/document-form.js`, `src/components/entity-list.js`, `src/components/document-list.js`, `src/components/entity-detail.js` y `src/components/search-bar.js`.
- [X] T036 [US7] Usar `resolveEntityDateRule(getConfig()).label` en `src/components/entity-form.js`, `src/components/entity-list.js`, `src/components/entity-detail.js` y `src/components/search-bar.js` para mostrar «Fecha de nacimiento» en el perfil de clientes.

**Punto de control**: La terminología es consistente y la navegación no cambia al reetiquetar.

---

## Phase 8: US8 - Declarar campos personalizados para los registros (Prioridad: P1)

**Objetivo**: Que los campos declarados aparezcan en formularios, listas, ficha y búsqueda con validación, y que los valores huérfanos se conserven ocultos.

**Prueba independiente**: Declarar un campo numérico obligatorio; ver entrada numérica, bloqueo al dejarlo vacío, valor visible en lista/ficha y coincidencia en búsqueda.

### Pruebas de US8

- [X] T037 [P] [US8] Ampliar `tests/unit/field-rules.test.js` para verificar reglas sobre campos base y personalizados, grupos exclusivos, condiciones `when` y opciones `{ value, label }`.
- [X] T038 [P] [US8] Ampliar `tests/integration/custom-fields.test.js` con un campo numérico obligatorio que bloquee el guardado vacío y sea buscable y visible en lista y ficha.
- [X] T039 [P] [US8] Ampliar `tests/integration/orphan-fields-ui.test.js` para conservar un valor no declarado en `erp_entities`, ocultarlo y volver a mostrarlo al redeclarar el campo.

### Implementación de US8

- [X] T040 [US8] Completar `src/utils/field-rules.js` para resolver reglas por clave, aplicar `hidden`/`searchable` y descartar valores de grupos inactivos antes de validar.
- [X] T041 [US8] Completar `renderFieldHtml()`, `renderFieldsHtml()`, `collectFormData()`, `buildFormBaseline()` e `isFormDirty()` en `src/components/form-fields.js`, respetando `order`, `placeholder`, `when` y opciones con valor y etiqueta.
- [X] T042 [US8] Conectar validación y persistencia de campos personalizados en `src/storage.js` y su presentación en `src/components/entity-list.js` y `src/components/entity-detail.js`.

**Punto de control**: Los campos declarados funcionan de extremo a extremo sin código específico por dominio.

---

## Phase 9: US14 - Marco de espacio de trabajo ERP con marca (Prioridad: P1)

**Objetivo**: Barra superior con logotipo derivado y barra lateral persistente con Panel, Buscar, Resumen y Marketing en todas las pantallas.

**Prueba independiente**: Recorrer las pantallas y comprobar marca, cuatro botones laterales, resaltado del activo, columna de iconos en viewport estrecho, color de acento y persistencia de datos al navegar; «Clientes» e «Interacciones» no figuran en el marcado y el panel no muestra «Abrir Marketing».

### Pruebas de US14

- [X] T043 [P] [US14] Ampliar `tests/integration/workspace-shell.test.js` para verificar en `src/components/shell.js` el SVG monograma, `#brand-name`, los cuatro botones de `NAV_ITEMS`, `aria-current`, ausencia de Clientes/Interacciones y etiquetas accesibles con la barra contraída.
- [X] T044 [P] [US14] Crear `tests/integration/marketing-navigation.test.js` para abrir Marketing desde la barra lateral, navegar a Panel, Buscar y Resumen, y comprobar que `erp_entities`/`erp_documents` permanecen intactos.

### Implementación de US14

- [X] T045 [US14] Implementar `monogramSvg()`, `NAV_ITEMS` y `renderShellHtml()` en `src/components/shell.js` con Panel, Buscar, Resumen y Marketing, y añadir la regla de barra estrecha en `src/styles.css`.
- [X] T046 [US14] Aplicar `theme.accentColor` validado por `src/module-config.js` en `src/app.js` mediante `--accent`/`--accent-color`, con valor integrado por defecto en `src/styles.css`.
- [X] T047 [US14] Ajustar `navigate()` y `activeNavKey()` en `src/app.js` para resaltar la vista activa y pedir confirmación antes de salir de un formulario con cambios sin guardar.

**Punto de control**: El marco es idéntico en todas las vistas y la navegación no pierde datos.

---

## Phase 10: US15 - Panel de inicio con acciones rápidas y estadísticas (Prioridad: P1)

**Objetivo**: Panel de entrada con cinco acciones rápidas exclusivamente en el panel y tarjetas de estadísticas en vivo.

**Prueba independiente**: Abrir la aplicación, contar exactamente cinco acciones rápidas en `.dashboard`, navegar a Marketing y verificar que no existe `.quick-actions`, abrir cada destino del panel con formulario vacío o búsqueda enfocada y verificar tarjetas en cero y con registros.

### Pruebas de US15

- [X] T048 [P] [US15] Ampliar `tests/integration/dashboard.test.js` para comprobar las cinco acciones rápidas, la ausencia de «Abrir Marketing», el destino correcto de cada acción, las tarjetas en cero y los recuentos tras crear registros.
- [X] T049 [P] [US15] Ampliar `tests/unit/dashboard-stats.test.js` para exigir entidades, documentos, «Cerrado ganado», «Tasa de conversión» y «Pipeline (USD)», además del embudo por estados de documento, con cero registros.

### Implementación de US15

- [X] T050 [US15] Implementar `renderDashboardHtml()` y `formatCurrencyUsd()` en `src/components/dashboard.js` con las cinco tarjetas, el embudo por estados de documento y la lista «Últimas Interacciones / Próximos Seguimientos».
- [X] T051 [US15] Implementar en `src/app.js` los casos `quick-new-entity`, `quick-new-document`, `quick-manage` y `quick-search`, abriendo el formulario vacío o enfocando `#search-input`.
- [X] T052 [US15] Implementar `computeDashboardStats()` en `src/utils/marketing-stats.js` para derivar tarjetas y embudo desde entidades y documentos, reutilizándolo en `src/components/dashboard.js` sin escribir en `localStorage`.
- [X] T134 [P] [US15] Ampliar `tests/integration/dashboard.test.js` para exigir que `.dashboard .quick-actions` contenga exactamente cinco botones `data-action="quick-*"`/`data-action="navigate"` y que siga sin aparecer «Abrir Marketing» (FR-091).
- [X] T135 [P] [US15] Ampliar `tests/integration/marketing-dashboard.test.js` para comprobar que `.marketing-view .quick-actions` no existe tras navegar a Marketing, mientras el panel conserva los cinco accesos (SC-027).
- [X] T136 [US15] Añadir la opción `showQuickActions = true` a `renderDashboardHtml(config, stats, { title, sectionClass, showQuickActions })` en `src/components/dashboard.js` para omitir `<div class="quick-actions">` cuando sea `false`, sin alterar tarjetas, embudo ni lista de interacciones.
- [X] T137 [US15] Pasar `showQuickActions: false` en la llamada a `renderDashboardHtml()` dentro de `renderMarketingHtml()` en `src/components/marketing.js`, manteniendo `sectionClass: 'marketing-view'` y el resto del panel compartido.

**Punto de control**: El panel ofrece accesos y cifras correctas incluso sin registros, y Marketing no hereda sus acciones rápidas.

---

## Phase 11: US2 - Registrar clientes y contactos comerciales (Prioridad: P2)

**Objetivo**: Perfil de clientes con campos obligatorios y ocultos, código generado, RUT válido y único, canal de contacto condicional y presentación declarativa.

**Prueba independiente**: Registrar cliente y llamada asociada sin ver Código/Categoría/Descripción/Nº de pedidos; el guardado genera código único, exige fecha, canal, RUT y dato de contacto, y la ficha de un cliente heredado incompleto queda bloqueada hasta editarlo válidamente.

### Pruebas de US2

- [X] T053 [P] [US2] Ampliar `tests/integration/client-field-rules.test.js` para verificar que formulario, lista, ficha y búsqueda no muestran «Código», «Categoría», «Descripción» ni «Nº de pedidos», que el código generado es distinto por cliente y que buscar por esos valores ocultos no devuelve registros.
- [X] T054 [P] [US2] Ampliar `tests/integration/register-client.test.js` para rechazar guardados sin «Fecha de nacimiento», «Canal de Contacto» o «RUT», con dígito verificador inválido y con RUT repetido con y sin puntos.
- [X] T055 [P] [US2] Ampliar `tests/integration/register-client-contact.test.js` para exigir selección explícita del canal, mostrar solo la casilla adicional correspondiente con formatos `phone`/`email`/`nonEmpty` y conservar únicamente el valor del canal final.
- [X] T056 [P] [US2] Ampliar `tests/integration/client-form-presentation.test.js` para comprobar título y acción rápida «Nuevo Cliente», orden «Nombre de Cliente», «RUT», «Fecha de nacimiento», «Canal de Contacto» con su casilla, «Tipo de actividad» y «Ejecutivo Asignado», pistas grises y diez opciones de `rubro`.
- [X] T057 [P] [US2] Ampliar `tests/integration/client-birthdate-legacy.test.js` para bloquear la ficha de un cliente heredado sin datos obligatorios o con RUT inválido, explicar los campos pendientes, ofrecer «Editar» y desbloquearla al guardar válidamente.

### Implementación de US2

- [X] T058 [US2] Completar `MODULE_CONFIG` en `src/module-config.js` con `entityDate`, `fieldRules.entity` para código generado/oculto, `category`/`description` ocultos, `rut` obligatorio único con `cl-rut` y pista, `canal_contacto` sin preselección, campos `contacto_*` con `when`/`group`/formato/pista, `rubro` con diez opciones, `ejecutivo_asignado` con `order: 6` y `detailPolicy.entity`, sin declarar `pedidos`.
- [X] T059 [US2] Completar `validateEntityData()`, `validateFieldRules()`, `normalizeForUniqueness()` y `addEntity()` en `src/storage.js` para generar el código antes de validar, aplicar required/format/unique/normalize y conservar los valores ocultos en `updateEntity()`.
- [X] T060 [US2] Ajustar `src/components/form-fields.js` y `src/components/entity-form.js` para renderizar pistas en gris, orden declarativo y opciones `{ value, label }`, y descartar los valores de canales inactivos al cambiar de selección.
- [X] T061 [US2] Ajustar `src/components/entity-detail.js` para usar `validateEntity()` con `detailPolicy.entity.blockWhenInvalid` y mostrar la explicación y la acción de editar en lugar de los datos del cliente incompleto.
- [X] T062 [US2] Ajustar `src/components/dashboard.js` y `src/components/search-bar.js` para mostrar «Nuevo Cliente» en la acción rápida y no mencionar campos ocultos en la ayuda de búsqueda.

**Punto de control**: El perfil de clientes cumple todas las reglas declarativas sin ramas específicas en el código central.

---

## Phase 12: US9 - Buscar y encontrar entidades rápidamente (Prioridad: P2)

**Objetivo**: Búsqueda instantánea sobre entidades y sus documentos, con estado vacío claro y buen comportamiento con cientos de registros.

**Prueba independiente**: Introducir un término y ver solo coincidencias; sin coincidencias ver estado vacío; con 500 entidades obtener resultados sin retraso perceptible.

### Pruebas de US9

- [X] T063 [P] [US9] Ampliar `tests/integration/search-entities.test.js` con coincidencias parciales, estado vacío y actualización de resultados mientras se escribe en `#search-input`.
- [X] T064 [P] [US9] Ampliar `tests/integration/performance.test.js` para medir búsqueda y renderizado de listas con 500 entidades almacenadas.

### Implementación de US9

- [X] T065 [US9] Implementar `normalizeText()`, `matchesQuery()` y `matchesAny()` en `src/utils/search.js` y usarlos en `searchEntities()` de `src/storage.js` sobre campos visibles y documentos vinculados.
- [X] T066 [US9] Conectar `handleInput()` y `updateSearchResults()` en `src/app.js` con `renderSearchBarHtml()` y `renderEntityListHtml()` para actualizar solo `#search-results`.

**Punto de control**: La búsqueda es correcta y responde con rapidez sobre 500 registros.

---

## Phase 13: US10 - Registrar una fecha objetivo (Prioridad: P2)

**Objetivo**: Fecha objetivo opcional en la base y «Fecha de nacimiento» obligatoria en clientes, con rango local 1910-01-01..hoy y actualización al cambiar de día.

**Prueba independiente**: Aceptar `1910-01-01` y hoy, rechazar fechas imposibles o fuera de rango, y actualizar `max` y la ayuda sin recargar al cruzar la medianoche local conservando el borrador.

### Pruebas de US10

- [X] T067 [P] [US10] Ampliar `tests/unit/entity-date.test.js` con reloj falso para `localTodayISO()`, `isValidISODate()`, `resolveEntityDateRule()` y `watchLocalDayChange()`, incluyendo reprogramación y cancelación.
- [X] T068 [P] [US10] Ampliar `tests/integration/entity-birthdate.test.js` para comprobar `min`/`max`, rechazo de `1909-12-31`, mañana, `1910-02-29` y `2026-02-30`, y actualización del límite sin perder el borrador.

### Implementación de US10

- [X] T069 [US10] Implementar `src/utils/entity-date.js` con `LOCAL_TODAY`, componentes locales (`getFullYear`/`getMonth`/`getDate`), comparación lexicográfica de ISO y temporizador hasta la medianoche local.
- [X] T070 [US10] Conectar la regla resuelta a las definiciones de campo en `src/components/entity-form.js` y actualizar `min`, `max` y `[data-role="date-range"]` desde `src/app.js` sin re-renderizar el formulario.
- [X] T071 [US10] Mantener en `src/storage.js` los valores históricos fuera de rango sin migrarlos, exigiendo corrección sobre el objeto fusionado en `updateEntity()`.

**Punto de control**: La regla de fecha es válida, dinámica y no destruye datos históricos.

---

## Phase 14: US11 - Registrar los detalles de documentos de una entidad (Prioridad: P2)

**Objetivo**: Documentos con campos base y personalizados, asociados a exactamente una entidad y eliminados en cascada.

**Prueba independiente**: Añadir un documento a una entidad, ver sus detalles junto a ella, editarlo y eliminarlo, y comprobar que la eliminación de la entidad elimina sus documentos.

### Pruebas de US11

- [X] T072 [P] [US11] Ampliar `tests/unit/storage.test.js` con campos base `id`, `entity_id`, `startDate`, `endDate`, `notes`, `status`, marcas de tiempo y regla `endDate >= startDate`, más campos personalizados declarados.
- [X] T073 [P] [US11] Ampliar `tests/integration/add-document.test.js` para añadir, editar y eliminar un documento desde la pestaña de documentos y verlo en la ficha de la entidad.

### Implementación de US11

- [X] T074 [US11] Completar `validateDocumentData()`, `addDocument()`, `updateDocument()`, `deleteDocument()` y `deleteDocumentsForEntity()` en `src/storage.js`, rechazando entity_id inexistente y fechas inválidas.
- [X] T075 [US11] Completar `src/components/document-form.js` y `onDocumentFormSubmit()` en `src/app.js` con mensajes de error por campo para datos obligatorios y fechas.

**Punto de control**: Los documentos quedan íntegramente vinculados a su entidad.

---

## Phase 15: US12 - Buscar entidades en una pantalla dedicada (Prioridad: P2)

**Objetivo**: Pantalla de búsqueda separada de la gestión, accesible desde barra lateral y panel, sin edición en línea.

**Prueba independiente**: Abrir la pantalla desde la barra lateral o una acción rápida, buscar, ver estado vacío y volver al panel con el botón Panel.

### Pruebas de US12

- [X] T076 [P] [US12] Ampliar `tests/integration/search-screen.test.js` para cubrir ambos accesos, coincidencias, estado vacío, botón Panel y exclusión de categoría/descripción en el perfil de clientes.

### Implementación de US12

- [X] T077 [US12] Implementar `renderSearchView()` y la navegación a `search`/`dashboard` en `src/app.js`, con `focusSearchOnRender` al llegar desde el panel.
- [X] T078 [US12] Ajustar `src/components/search-bar.js` para ofrecer un formulario accesible con `#search-input` y texto de ayuda derivado de la configuración.

**Punto de control**: La búsqueda dedicada es independiente de la gestión y no expone campos ocultos.

---

## Phase 16: US13 - Configurar el ciclo de vida de estados de documentos (Prioridad: P2)

**Objetivo**: Estados y transiciones declarados por configuración, con estados pendientes explícitos y texto libre como comportamiento base.

**Prueba independiente**: Configurar cotización→pedido→facturado; ver solo transiciones válidas, rechazar una inválida con explicación, mostrar el estado en listas y conservar texto libre sin ciclo de vida.

### Pruebas de US13

- [X] T079 [P] [US13] Ampliar `tests/integration/document-lifecycle.test.js` para verificar transiciones permitidas, rechazo de transición inválida por cualquier vía, estado visible en listas y texto libre sin `statusLifecycle`.
- [X] T080 [P] [US13] Ampliar `tests/unit/module-config.test.js` para validar `statusLifecycle.states`, `transitions` y `pendingStates` y rechazar referencias a estados desconocidos.

### Implementación de US13

- [X] T081 [US13] Implementar `isValidTransition()` y la rama de `status` en `validateDocumentData()` de `src/storage.js`, y hacer que `computeSummary()` use `pendingStates` antes que la coincidencia normalizada con «pendiente».
- [X] T082 [US13] Implementar opciones de estado a partir de `statusLifecycle.transitions` en `src/components/document-form.js` y distintivo visual del estado en `src/components/document-list.js`.

**Punto de control**: El ciclo de vida se aplica por igual en formularios, almacenamiento y resumen.

---

## Phase 17: US16 - Capturar y convertir prospectos desde Marketing (Prioridad: P2)

**Objetivo**: Captura pública con consentimiento, prospectos como `Entidad`, automatización por eventos, conversión sin pérdida de identidad, panel/Marketing derivados de los mismos registros y cinco atajos de Marketing en orden fijo.

**Prueba independiente**: Enviar `?view=capture` con consentimiento, ver creado el prospecto y la ejecución automática, avanzar a Cliente conservando historial, y comprobar que Marketing muestra las cinco tarjetas y el embudo del panel sin torta ni selector de etapas, sin acciones rápidas del panel y con los cinco atajos ordenados `team`, `campaigns`, `performance`, `chat`, `social`.

### Pruebas de US16

- [X] T083 [P] [US16] Ampliar `tests/unit/capture-consent.test.js` para exigir `consentimiento = true`, `consentimiento_fecha`, `consentimiento_version` desde `marketing.privacyNoticeVersion`, `estado_comercial = 'prospecto'` y rechazo sin consentimiento.
- [X] T084 [P] [US16] Ampliar `tests/unit/marketing-stats.test.js` para verificar que las cinco tarjetas y el embudo por estados de documento coinciden con el panel, contabilizan cada documento una sola vez y muestran cero sin registros.
- [X] T085 [P] [US16] Ampliar `tests/integration/marketing-capture.test.js` para comprobar que `?view=capture` se renderiza sin marco ERP, sin consentimiento no crea entidad y con consentimiento muestra confirmación clara.
- [X] T086 [P] [US16] Ampliar `tests/integration/marketing-dashboard.test.js` para verificar en Marketing las cinco tarjetas, el embudo y «Últimas Interacciones / Próximos Seguimientos» del panel, sin torta «Estado comercial de la cartera» ni selector de etapas, y sin mostrar `estado_comercial`.
- [X] T138 [P] [US16] Ampliar `tests/integration/marketing-navigation.test.js` para exigir exactamente cinco botones `.marketing-sections [data-action="marketing-section"]` en el orden `team`, `campaigns`, `performance`, `chat`, `social`, con las etiquetas «Equipos de ventas y logros», «Campañas», «Rendimiento de campañas», «Dudas y consultas» y «Redes sociales» (FR-093/SC-029).

### Implementación de US16

- [X] T087 [US16] Reimplementar `computeDashboardStats()` y `computeMarketingStats()` en `src/utils/marketing-stats.js` sobre entidades y documentos, compartiendo fórmulas con `src/components/dashboard.js` y sin escribir resultados derivados en `localStorage`.
- [X] T088 [US16] Implementar `createProspectFromCapture()` y `CaptureError` en `src/utils/capture-prospect.js`, filtrando por `marketing.captureFields` y guardando consentimiento con fecha y versión.
- [X] T089 [US16] Implementar `getCaptureFieldDefs()`, `renderCaptureFormHtml()` y `collectCaptureFormData()` en `src/components/capture-form.js` con casilla de consentimiento y errores comprensibles.
- [X] T090 [US16] Conectar en `src/app.js` las vistas iniciales `?view=capture` y `?view=marketing`, el envío `#capture-form` y `renderMarketingView()` con las estadísticas compartidas.
- [X] T091 [US16] Reimplementar `renderMarketingHtml()` en `src/components/marketing.js` con cinco tarjetas, embudo por estados de documento, lista de interacciones con «Ver ficha» y estados vacíos, eliminando la torta y el selector de etapas.
- [X] T092 [US16] Implementar `runAutomationRules()` en `src/utils/marketing-automation.js` y `persistAutomation()` en `src/storage.js`, con `automation_key = event|from|to|label`, `status = 'automatico'` y un `Documento` por ejecución en el historial de la entidad.
- [X] T093 [US16] Ajustar `transitionStage()` en `src/utils/marketing-stage.js` y `updateEntityStage()` en `src/storage.js` para que `ganado` conserve `id`, `entity_id`, documentos y campos personalizados, manteniendo `estado_comercial` oculto en `src/module-config.js`.
- [X] T139 [US16] Reordenar y renombrar `SECTIONS` en `src/components/marketing.js` a los cinco atajos exactos `team`, `campaigns`, `performance`, `chat`, `social` con las etiquetas de FR-093, actualizar el `<h2>` de `src/components/marketing-team.js` a «Equipos de ventas y logros» y conservar `data-action="marketing-section"` y el panel renderizado por cada clave.

**Punto de control**: Marketing y panel coinciden exactamente, la captura es trazable sin nueva entidad y los cinco atajos respetan el orden y la terminología aprobada.

---

## Phase 18: US17 - Consultar los Equipos de ventas y logros (Prioridad: P2)

**Objetivo**: Equipos e integrantes capturados por el usuario con real mensual y objetivo mensual calculados por el sistema, accesibles desde el atajo «Equipos de ventas y logros».

**Prueba independiente**: Abrir el atajo «Equipos de ventas y logros», crear equipo e integrante con nombre, cargo y estado, sin casillas de métricas, y comprobar que real mensual suma documentos «Cerrado ganado» del mes del ejecutivo y objetivo mensual proyecta `ventas ÷ días transcurridos × días del mes`, conservando `data-section="team"`.

### Pruebas de US17

- [X] T094 [P] [US17] Crear `tests/unit/sales-team-metrics.test.js` con casos de suma de importes «Cerrado ganado» del mes por `ejecutivo_asignado`, proyección al cierre del mes y cero sin ventas o sin días transcurridos.
- [X] T095 [P] [US17] Crear `tests/integration/marketing-team.test.js` para abrir «Equipo de ventas y logros», crear/editar/eliminar equipos e integrantes con nombre, cargo y «Activo»/«Inactivo», ver estado vacío y actualizar métricas tras cambiar documentos.
- [X] T140 [P] [US17] Actualizar `tests/integration/marketing-team.test.js` para abrir la sección mediante el atajo «Equipos de ventas y logros» (plural) y verificar que el botón conserva `data-section="team"` y que no aparece la forma singular como etiqueta visible (SC-029).

### Implementación de US17

- [X] T096 [US17] Implementar `computeSalesTeamMetrics()` en `src/utils/sales-team-metrics.js` con las fórmulas de FR-078 y FR-079, sin persistir resultados.
- [X] T097 [US17] Implementar la sección «Equipos de ventas y logros» en `src/components/marketing.js` y sus estilos en `src/styles.css`, sin entradas para real ni objetivo.
- [X] T098 [US17] Conectar en `src/app.js` las acciones de equipo e integrante y persistir solo nombre, cargo y estado en `erp_marketing_config` desde `src/storage.js`, usando `marketing.salesTeams` como valores iniciales.

**Punto de control**: Las cifras del equipo son calculadas, verificables y recalculadas sin recarga.

---

## Phase 19: US18 - Registrar interacciones en redes sociales (Prioridad: P2)

**Objetivo**: Registro manual de interacciones de Twitter, Instagram, YouTube y otras redes, vinculadas al prospecto o cliente como `Documento`.

**Prueba independiente**: Abrir «Redes sociales» desde Marketing, registrar una interacción de Instagram con plataforma, fecha, tipo, nota y enlace, y verla guardada, ordenada por fecha y en la ficha de la entidad.

### Pruebas de US18

- [X] T099 [P] [US18] Crear `tests/unit/marketing-social.test.js` para exigir que `registerSocialInteraction()` cree un `Documento` con `entity_id`, `plataforma`, `startDate`, `tipo_interaccion`, `nota`, `enlace` y `campaña` opcional.
- [X] T100 [P] [US18] Crear `tests/integration/marketing-social.test.js` para registrar, editar y eliminar una interacción vinculada, ver estado vacío, orden cronológico y reflejo en `src/components/entity-detail.js`.

### Implementación de US18

- [X] T101 [US18] Implementar `registerSocialInteraction()` en `src/utils/marketing-social.js` reutilizando `addDocument()` de `src/storage.js` y los campos personalizados declarados.
- [X] T102 [US18] Implementar `renderMarketingSocialHtml()` en `src/components/marketing-social.js` con formulario, lista, acciones de edición/eliminación y estado vacío.
- [X] T103 [US18] Declarar en `src/module-config.js` los campos personalizados de documento `plataforma`, `tipo_interaccion`, `enlace` y `campaña`, y conectar las acciones del componente en `src/app.js` usando `escapeHtml()` de `src/utils/sanitize.js`.

**Punto de control**: Las redes usan `Documento` y permanecen en la ficha de la entidad al navegar.

---

## Phase 20: US19 - Ofrecer Dudas y consultas con respuestas rápidas (Prioridad: P2)

**Objetivo**: Superficie visible «Dudas y consultas» en captura y Marketing con respuestas desde FAQ configuradas, acuse para consultas sin coincidencia y consentimiento previo; el canal interno `chat` permanece estable.

**Prueba independiente**: Pregunta configurada recibe respuesta inmediata; pregunta sin coincidencia muestra acuse y queda como `Documento`; sin consentimiento no se registra ningún mensaje; ambas superficies comparten historial; los textos visibles dicen «Dudas y consultas» mientras `data-section="chat"`, `#chat-form`, `.chat-*` y `canal: 'chat'` no cambian.

### Pruebas de US19

- [X] T104 [P] [US19] Crear `tests/unit/marketing-chat.test.js` para verificar `answerFaq()` con texto normalizado, `null` sin coincidencia y `registerChatMessage()` con consentimiento, canal `chat`, `mensaje`, `tipo_interaccion` y `campaña` opcional.
- [X] T105 [P] [US19] Crear `tests/integration/marketing-chat.test.js` para usar el chat en `?view=capture` y en Marketing, comprobar respuesta rápida, acuse de recibo, documento de seguimiento, bloqueo sin consentimiento y mensajes visibles en la ficha.
- [X] T141 [P] [US19] Ampliar `tests/integration/marketing-chat.test.js` para exigir que encabezado, pestaña y texto de consentimiento digan «Dudas y consultas» en captura y Marketing, sin «Chat» como etiqueta visible, verificando que `data-section="chat"`, `#chat-form`, `.chat-*` y los documentos con `canal: 'chat'` permanezcan iguales (SC-028).

### Implementación de US19

- [X] T106 [US19] Implementar `answerFaq()` y `registerChatMessage()` en `src/utils/marketing-chat.js` usando `marketing.faq` y `addDocument()`, sin APIs externas.
- [X] T107 [US19] Implementar `renderMarketingChatHtml()` en `src/components/marketing-chat.js` con casilla de consentimiento, mensajes, respuesta/acuse y estado vacío sin FAQ.
- [X] T108 [US19] Integrar el chat en `src/components/capture-form.js` y `src/components/marketing.js`, con manejadores en `src/app.js` que lean `getEntityDocuments()` para compartir mensajes entre superficies.
- [X] T109 [US19] Ampliar `validateMarketingConfig()` en `src/utils/marketing-config.js` para exigir pares `pregunta`/`respuesta` no vacíos en `marketing.faq` y añadir ejemplos en `src/module-config.js`.
- [X] T142 [US19] Renombrar a «Dudas y consultas» el `<h2>` y el texto visible de consentimiento en `src/components/marketing-chat.js`, conservando `data-role="marketing-chat"`, `#chat-form`, `name="consentimiento"` y las clases `.chat-*`.
- [X] T143 [US19] Actualizar los mensajes visibles de `ChatConsentError` en `src/utils/marketing-chat.js` para usar «Dudas y consultas», conservando el nombre de la clase, `name = 'ChatConsentError'` y `errors.consentimiento` consumido por `src/app.js`.

**Punto de control**: «Dudas y consultas» responde, registra y respeta el consentimiento en ambos puntos de entrada sin cambiar contratos internos.

---

## Phase 21: US20 - Programar campañas de marketing internas (Prioridad: P2)

**Objetivo**: Campañas por etapa y periodo que ejecutan reglas internas con acciones limitadas y desempate determinista.

**Prueba independiente**: Crear campaña «En proceso», disparar evento sobre prospecto de esa etapa, ver seguimiento/historial sin envíos externos, detenerla sin borrar historial y comprobar que con dos campañas solo se ejecuta la más reciente y la otra queda «omitida por solapamiento».

### Pruebas de US20

- [X] T110 [P] [US20] Crear `tests/unit/marketing-campaigns.test.js` con casos de creación, edición, detención, periodo activo y etapa objetivo, verificando que solo se ejecutan acciones internas: crear documento de seguimiento, asignar ejecutivo y actualizar `estado_comercial`.
- [X] T111 [US20] Crear `tests/unit/marketing-campaigns-overlap.test.js` para dos campañas activas sobre el mismo prospecto y evento: ejecuta la de `createdAt` más reciente, registra la otra con `notes = 'omitida por solapamiento'`, `campaignId`, fecha y motivo, sin acciones duplicadas.
- [X] T112 [P] [US20] Crear `tests/integration/marketing-campaigns.test.js` para abrir la vista de campañas con estado vacío, crear/editar/detener una campaña y consultar historial con fecha, prospecto y acción.

### Implementación de US20

- [X] T113 [US20] Implementar `createCampaign()`, `updateCampaign()`, `stopCampaign()`, `isCampaignActive()` y `selectCampaignsForEvent()` en `src/utils/marketing-campaigns.js`, sin correos, mensajes externos ni publicaciones.
- [X] T114 [US20] Ampliar `runAutomationRules()` en `src/utils/marketing-automation.js` y `persistAutomation()` en `src/storage.js` con `campaignId`, contexto de etapa y registro en historial para cada acción o solapamiento.
- [X] T115 [US20] Implementar la vista de campañas en `src/components/marketing.js` y sus acciones en `src/app.js`, persistiendo en `erp_marketing_config` desde `src/storage.js` con `marketing.campaigns` como semilla y validando fechas en `src/utils/marketing-config.js`.

**Punto de control**: Las campañas ejecutan reglas locales, registran todo y no duplican acciones.

---

## Phase 22: US21 - Medir el rendimiento de Marketing (Prioridad: P2)

**Objetivo**: Indicadores derivados de registros existentes, filtrables por campaña, con grupo «Sin campaña» y sin captura manual.

**Prueba independiente**: Abrir «Rendimiento de campañas», seleccionar una campaña y comprobar prospectos, conversión, interacciones, consultas respondidas y ventas ganadas coinciden con los registros y se actualizan sin recarga; campaña vacía muestra cero con explicación.

### Pruebas de US21

- [X] T116 [P] [US21] Crear `tests/unit/marketing-performance.test.js` para verificar `computeMarketingPerformance()` con prospectos capturados, conversiones por etapa, tasa de conversión, interacciones registradas, consultas respondidas y ventas «Cerrado ganado», sin persistir resultados.
- [X] T117 [US21] Crear `tests/unit/marketing-performance-attribution.test.js` para comprobar filtro por `campaignId`/`campaña`, agrupación «Sin campaña» y ceros con explicación para campañas sin registros.
- [X] T118 [P] [US21] Crear `tests/integration/marketing-performance.test.js` para abrir la vista, seleccionar campaña, comparar cifras con el panel y ver actualización sin recarga tras cambios en entidades o documentos.

### Implementación de US21

- [X] T119 [US21] Implementar `computeMarketingPerformance()` en `src/utils/marketing-performance.js` a partir de `entities`, `documents` y `campaigns`, reutilizando `computeDashboardStats()` para los valores compartidos.
- [X] T120 [US21] Implementar la vista «Rendimiento de campañas» en `src/components/marketing.js` con selector de campaña, tarjetas de indicadores y mensaje claro para campañas sin registros, sin campos de captura manual.
- [X] T121 [US21] Conectar `renderMarketingView()` y `handleChange()` en `src/app.js` para recalcular indicadores en cada render, y declarar el campo opcional `campaña` en entidades y documentos de `src/module-config.js`.

**Punto de control**: Rendimiento y panel coinciden porque ambos derivan de los mismos registros.

---

## Phase 23: US6 - Consultar indicadores de Gestión Comercial (Prioridad: P6)

**Objetivo**: Resumen de clientes, interacciones y seguimientos pendientes por entidad, con etiquetas de CRM y estado vacío.

**Prueba independiente**: Abrir el resumen, comparar totales y pendientes con las fichas, registrar un seguimiento nuevo y ver el indicador actualizado; sin registros ver ceros y guía inicial.

### Pruebas de US6

- [X] T122 [P] [US6] Ampliar `tests/integration/commercial-summary.test.js` para verificar totales, pendientes por cliente, selección que abre la ficha, estado vacío, etiquetas «Clientes»/«Historial/Ficha» y actualización tras crear o completar seguimientos.
- [X] T123 [P] [US6] Ampliar `tests/unit/storage.test.js` para comprobar en `computeSummary()` la precedencia de `pendingStates` y, sin ciclo de vida, la coincidencia del estado normalizado con «pendiente».

### Implementación de US6

- [X] T124 [US6] Completar `computeSummary()` en `src/storage.js` con `totalEntities`, `totalDocuments`, `totalPending` y `pendingByEntity` derivados de los registros vigentes.
- [X] T125 [US6] Completar `renderCommercialSummaryHtml()` en `src/components/commercial-summary.js` y su renderizado desde `src/app.js` con estado vacío y enlaces a la ficha.

**Punto de control**: El resumen refleja exactamente lo registrado en clientes y documentos.

---

## Phase 24: Polish & Cross-Cutting Concerns

**Propósito**: Regresión, rendimiento, seguridad y cierre de la validación ejecutable.

- [X] T126 [P] Ampliar `tests/integration/performance.test.js` para afirmar que búsqueda y renderizado de listas permanecen correctos con 500 entidades y 500 documentos.
- [X] T127 [P] Ampliar `tests/unit/sanitize.test.js` y verificar en `src/utils/sanitize.js` que nombres, notas, enlaces y mensajes de chat se escapan antes de renderizarse en `src/components/`.
- [X] T128 [P] Ampliar `tests/integration/unsaved-navigation.test.js` para confirmar que salir desde cualquier botón de `src/components/shell.js` o `src/components/dashboard.js` con el formulario modificado solo navega tras confirmar descartar.
- [X] T129 [P] Ampliar `tests/integration/orphan-fields-ui.test.js` para conservar en `erp_entities` los valores de `category`, `description` y `pedidos` sin mostrarlos en `src/components/`.
- [X] T130 [P] Actualizar `README.md` con los comandos `npm install`, `npm test`, `npm run lint`, `npm run dev` y la limitación de mismo origen de `?view=capture` descrita en `contracts/marketing.md`.
- [X] T131 [P] Ampliar `tests/integration/marketing-navigation.test.js` para verificar que no existen «Abrir Marketing», torta «Estado comercial de la cartera» ni selector de etapas, y que Marketing está como cuarta opción en `src/components/shell.js`.
- [X] T132 Ejecutar `npm test` y `npm run lint` definidos en `package.json` y corregir los fallos en `src/` y `tests/` hasta que ambos comandos terminen sin errores.
- [X] T133 [P] Ampliar `tests/integration/marketing-dashboard.test.js` con la comparación final de cinco tarjetas y embudo entre el panel y Marketing tras crear, editar y eliminar documentos, comprobando que no se escriben resultados derivados en `localStorage`.
- [X] T144 [P] Ampliar `tests/integration/marketing-navigation.test.js` con la regresión final de clarificaciones: cinco acciones rápidas solo en `.dashboard`, cinco atajos de Marketing en orden exacto y ausencia de las etiquetas obsoletas «Chat» y «Equipo de ventas y logros» como texto visible.
- [X] T145 Ejecutar `npm test` y `npm run lint` definidos en `package.json` tras T134-T144 y corregir fallos en `src/` y `tests/` hasta que ambos comandos terminen sin errores.

**Punto de control**: Todas las historias pasan sus pruebas independientes, la suite completa queda en verde y las clarificaciones de Marketing quedan cubiertas.

---

## Dependencias y orden de ejecución

### Dependencias de fases

- **Phase 1 (Setup)**: sin dependencias; solo verifica el entorno existente.
- **Phase 2 (Foundational)**: depende de Setup y bloquea todas las historias.
- **Phase 3-23 (historias)**: comienzan tras Foundational; se entregan en el orden de prioridad del documento, no en orden de dependencia.
- **Phase 24 (Polish)**: depende de que estén completas las historias que se desean incluir en la entrega.

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
- **US6 (P6)**: depende de US2, US3, US11 y US13 para totales y pendientes.

### Dentro de cada historia

- Las pruebas marcadas al inicio de la fase se escriben primero y deben fallar antes de la implementación.
- La configuración declarativa precede a los componentes; los componentes preceden al cableado en `src/app.js`.
- Las utilidades puras preceden a las vistas que las consumen; el historial de `Documento` es la única fuente de ejecuciones.
- Clarificaciones Marketing: T134/T135 preceden a T136-T137; T138 precede a T139; T140 depende de T139; T141 precede a T142-T143; T144 y T145 cierran la regresión.

## Oportunidades de paralelismo

- Setup: T001, T002, T003 y T004 pueden ejecutarse en paralelo porque tocan `package.json`, `vitest.config.mjs`, `index.html` y `tests/setup/test-setup.js`.
- Foundational: T005, T007, T009, T011 y T013 pueden avanzar juntas; cada implementación (T006, T008, T010, T012, T014) parte de su prueba correspondiente.
- US2: T053-T057 son cinco suites independientes en `tests/integration/`; la configuración de T058 y las adaptaciones T059-T062 se hacen después.
- US16: T083-T086 cubren consentimiento, estadísticas, captura y panel en archivos de prueba distintos; T087-T093 se implementan después.
- Marketing P2: US17, US18, US19, US20 y US21 pueden repartirse entre personas distintas una vez cerrada US16, siempre que cada una mantenga sus propias suites en `tests/unit/` y `tests/integration/`.
- Polish: T126-T131 y T133 tocan archivos de prueba o documentación distintos y pueden ejecutarse en paralelo; T132 se ejecuta al final.
- Clarificaciones Marketing: T134, T135, T138, T140, T141 y T144 son suites independientes; T136-T137, T139 y T142-T143 se implementan después de sus pruebas; T145 se ejecuta al final.

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

### Ejemplo de paralelismo: clarificaciones Marketing

```bash
T134 "Ampliar tests/integration/dashboard.test.js ..."
T135 "Ampliar tests/integration/marketing-dashboard.test.js ..."
T138 "Ampliar tests/integration/marketing-navigation.test.js ..."
T141 "Ampliar tests/integration/marketing-chat.test.js ..."
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
6. Aplicar el incremento T134-T145 sobre las fases US15, US16, US17, US19 y Polish para quitar acciones rápidas de Marketing, fijar los cinco atajos y usar «Dudas y consultas» sin cambiar contratos internos.

### Estrategia con equipo paralelo

- Una persona completa Setup + Foundational antes de repartir historias.
- Después de Foundational: un desarrollador toma US1-US4, otro US5-US8 y otro US14-US15.
- Tras US16: equipo A US17/US20, equipo B US18/US19, equipo C US21; US6 se asigna al cierre.

## Notas

- `[P]` significa archivos distintos y sin dependencias pendientes; no implica que las pruebas deban ejecutarse en paralelo, porque `vitest.config.mjs` fija `fileParallelism: false`.
- `[USn]` permite trazar cada tarea hasta su historia y su prueba independiente en `spec.md`.
- Todas las suites se escriben antes de la implementación y se comprueba que fallan; `npm test` y `npm run lint` se ejecutan al final de cada fase y en Polish.
- Marketing reutiliza `Entidad` y `Documento`: no hay nueva entidad, backend, dependencias ni almacenamiento de resultados derivados.
- El campo `estado_comercial`, las reglas y las campañas son internos; Marketing no ofrece torta ni selector de etapas y el panel no ofrece «Abrir Marketing».
- La captura pública se sirve en `?view=capture` y requiere mismo origen con el `localStorage` de la aplicación.
- En el incremento de clarificaciones, los cambios de terminología son solo visuales: `chat` sigue siendo la clave, el canal y el nombre interno de `ChatConsentError`.
