---
description: "Task list for feature implementation"
---

# Tasks: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

**Input**: Design documents from `/specs/001-erp-base-module/`

**Prerequisites**: `plan.md` (required), `spec.md` (required for user stories), `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Incluidas por el Principio II de la Constitución: toda lógica de negocio y comportamiento visible debe tener cobertura automatizada. Las tareas Ampliar/Crear pruebas deben escribirse primero y fallar antes de la implementación correspondiente.

**Organization**: Las tareas se agrupan por historia de usuario. Las historias ya completadas en el baseline (US1, US3, US5, US8, US9, US11, US12, US14, US15 y US6) no se duplican; solo se enumeran las tareas pendientes y las nuevas de las sesiones 2026-11-16 y 2026-11-23. Las fases 1–7 y 7b cubren la primera tanda (2026-11-16 y fecha de nacimiento) y están completadas; las fases 8–13 cubren los FR-051..FR-061 del perfil de clientes (2026-11-23). La fase final cubre regresión de todas ellas.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: Historia de usuario a la que pertenece la tarea (US1, US2, ...)
- Cada tarea incluye la ruta de archivo exacta

## Path Conventions

- Proyecto único: `index.html`, `src/`, `tests/` en la raíz del repositorio
- Utilidades compartidas en `src/utils/`; componentes en `src/components/`
- Pruebas unitarias en `tests/unit/`; integración en `tests/integration/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar que el entorno existente sigue siendo suficiente para la nueva incrementación; no se añaden dependencias.

- [X] T001 [P] Verificar los scripts `test`, `lint` y `build` y el entorno jsdom existentes en `package.json` y `vitest.config.mjs`, añadiendo solo lo que falte para ejecutar las nuevas pruebas

**Checkpoint**: Entorno listo; se pueden escribir pruebas que fallan.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Contrato `entityDate`, utilidad de fecha local y validación de almacenamiento. BLOCKS las fases US7, US10 y US2.

**⚠️ CRITICAL**: Ninguna tarea de historia de usuario puede comenzar hasta completar esta fase.

- [X] T002 [P] Crear `tests/unit/entity-date.test.js` con casos para `localTodayISO()` con fecha local fija (no UTC), `resolveEntityDateRule()` sin `entityDate`, con `min: "1910-01-01"` y con `max: "localToday"`, incluyendo `1910-01-01`, `1909-12-31`, hoy y mañana
- [X] T003 [P] Ampliar `tests/unit/module-config.test.js` para exigir que `entityDate` acepte `{ label, min, max }`, rechace `label` vacío, `min` inválido y `max` distinto de una fecha ISO válida o `"localToday"`, y haga fallback a `DEFAULT_CONFIG` con aviso
- [X] T004 [P] Implementar `src/utils/entity-date.js` exportando `LOCAL_TODAY`, `localTodayISO(now)`, `resolveEntityDateRule(config, now)` y `watchLocalDayChange(onChange, options)` con programación hasta la siguiente medianoche local y retorno de función de cancelación
- [X] T005 [P] Ampliar `src/module-config.js` con `entityDate: null` en `DEFAULT_CONFIG` y validación/normalización de `entityDate` en `validateConfig`, `loadModuleConfig` y `normalizeConfig` según el contrato de `contracts/entity-storage.md`
- [X] T006 [P] Ampliar `tests/unit/storage.test.js` con casos de `targetDate`: acepta `1910-01-01` y la fecha local de hoy; rechaza `1909-12-31`, mañana, `1910-02-29` y `2026-02-30`; verifica que `updateEntity()` exige corregir un valor histórico fuera de rango antes de guardar
- [X] T007 Integrar la regla resuelta en `src/storage.js`: `validateEntityData()` debe usar `resolveEntityDateRule(getConfig())`, validar calendario con `isValidDate()`, comparar `min <= targetDate <= max` sobre cadenas ISO y mostrar mensajes con la etiqueta configurada; `updateEntity()` debe validar el objeto fusionado

**Checkpoint**: La regla existe, se valida y fallan las pruebas hasta que la implementación esté lista; las historias pueden comenzar.

---

## Phase 3: User Story 7 - Reetiquetar pantallas desde la configuración (Priority: P1)

**Goal**: "Fecha de nacimiento" sustituye a "Fecha objetivo" en todos los lugares visibles del perfil de clientes, sin afectar a otros perfiles.

**Independent Test**: Con `entityDate.label = "Fecha de nacimiento"`, el formulario, la lista, la ficha, la búsqueda y los mensajes de error muestran ese texto; al quitar `entityDate`, vuelve "Fecha objetivo".

### Tests for User Story 7

- [X] T008 [P] [US7] Ampliar `tests/integration/relabeling.test.js` para verificar la etiqueta "Fecha de nacimiento" en `#entity-form`, `src/components/entity-list.js`, `src/components/entity-detail.js` y el placeholder de `src/components/search-bar.js`, y su reversión al perfil base

### Implementation for User Story 7

- [X] T009 [US7] Sustituir el texto fijo "Fecha objetivo"/"Objetivo" por la etiqueta resuelta en `src/components/entity-form.js`, `src/components/entity-list.js`, `src/components/entity-detail.js` y `src/components/search-bar.js`, usando `resolveEntityDateRule(getConfig())`

**Checkpoint**: El renombrado es completo y no rompe la terminología de otros módulos.

---

## Phase 4: User Story 10 - Registrar una fecha objetivo / fecha de nacimiento (Priority: P2)

**Goal**: Restringir el campo a fechas reales del calendario entre 1910-01-01 y la fecha local actual, reflejar `min`/`max` en la interfaz y actualizar el límite al cambiar de día sin recargar.

**Independent Test**: El selector rechaza fechas imposibles y fuera de rango; con reloj falso, al cruzar la medianoche local el atributo `max` y el texto de ayuda cambian sin perder el borrador; el seed no genera fechas futuras.

### Tests for User Story 10

- [X] T010 [P] [US10] Ampliar `tests/unit/entity-date.test.js` con relojes falsos para comprobar que `watchLocalDayChange()` dispara una vez al cruzar la medianoche local y se reprograma, y que la cancelación detiene el temporizador
- [X] T011 [P] [US10] Crear `tests/integration/entity-birthdate.test.js` para verificar `min="1910-01-01"`, `max` igual a la fecha local, mensaje de rango, rechazo de valores fuera de rango y actualización de `max`/texto de ayuda sin recargar ni borrar el borrador

### Implementation for User Story 10

- [X] T012 [US10] Añadir soporte para `def.min`, `def.max` y `def.hint` en `renderFieldHtml()` de `src/components/form-fields.js`, emitiendo atributos escapados y un `<p class="field-hint" data-role="date-range">`
- [X] T013 [US10] Conectar `resolveEntityDateRule(getConfig())` a la definición de `targetDate` en `getEntityFieldDefs()` de `src/components/entity-form.js`, estableciendo `label`, `min`, `max` y `hint`
- [X] T014 [US10] Suscribir `watchLocalDayChange()` en `initApp()` de `src/app.js`, actualizar `min`, `max` y el texto `data-role="date-range"` del formulario abierto sin re-renderizar, y exponer `destroy()` para cancelar el temporizador
- [X] T015 [US10] Ajustar `src/seed.js` y `scripts/seed.mjs` para generar `targetDate` como fecha de nacimiento pasada dentro de 1910-01-01..hoy, y actualizar `tests/unit/seed.test.js` para dejar de esperar fechas futuras

**Checkpoint**: La fecha de nacimiento es válida, visible y dinámica de extremo a extremo.

---

## Phase 5: User Story 2 - Registrar clientes y contactos comerciales (Priority: P2)

**Goal**: Activar la regla únicamente en el perfil CRM y conservar los valores históricos sin borrarlos, exigiéndolos corregir al editar.

**Independent Test**: Un cliente con fecha antigua fuera de rango se muestra igual; al editarlo, guardar otros campos sigue bloqueado hasta corregir la fecha. Un perfil sin `entityDate` sigue aceptando fechas futuras.

### Tests for User Story 2

- [X] T016 [P] [US2] Crear `tests/integration/client-birthdate-legacy.test.js` que siembre un cliente con `targetDate` fuera de rango, verifique que se muestra en lista y ficha, y exija corrección antes de guardar una edición

### Implementation for User Story 2

- [X] T017 [US2] Declarar `entityDate: { label: "Fecha de nacimiento", min: "1910-01-01", max: "localToday" }` en `MODULE_CONFIG` de `src/module-config.js`, sin añadir migración ni limpieza en `src/storage.js`

**Checkpoint**: El alcance queda limitado al perfil de clientes y no se pierden datos históricos.

---

## Phase 6: User Story 13 - Configurar el ciclo de vida de estados de documentos (Priority: P2)

**Goal**: Cerrar la tarea pendiente de la sesión 2026-11-16: estados "pendientes" marcados explícitamente en la configuración.

**Independent Test**: Con ciclo de vida, `computeSummary()` y el resumen cuentan solo los estados marcados como pendientes; sin ciclo de vida, se mantiene la coincidencia normalizada con `pendiente`.

### Tests for User Story 13

- [X] T018 [P] [US13] Ampliar `tests/unit/module-config.test.js` y `tests/unit/storage.test.js` para validar `pendingStates` dentro de `statusLifecycle` y su uso exclusivo en `computeSummary()`
- [X] T019 [P] [US13] Ampliar `tests/integration/commercial-summary.test.js` para verificar el resumen con estados marcados y el fallback a `pendiente` sin ciclo de vida

### Implementation for User Story 13

- [X] T020 [US13] Implementar `pendingStates` en `validateConfig`/`normalizeConfig` de `src/module-config.js` y usarlo en `computeSummary()` de `src/storage.js` (FR-044, SC-011)

**Checkpoint**: Los indicadores deducen "pendiente" de la configuración, no de suposiciones de texto.

---

## Phase 7: User Story 4 - Gestionar entidades y documentos en una pantalla dedicada (Priority: P1)

**Goal**: Cerrar la tarea pendiente de la sesión 2026-11-16: confirmación antes de navegar con cambios sin guardar.

**Independent Test**: Al cambiar de vista o módulo con un formulario modificado, aparece confirmación; solo se navega si se confirma descartar, y quedarse conserva el borrador.

### Tests for User Story 4

- [X] T021 [P] [US4] Crear `tests/integration/unsaved-navigation.test.js` para cubrir barra lateral, acciones rápidas y cambio de pestaña con borradores de `src/components/entity-form.js` y `src/components/document-form.js`

### Implementation for User Story 4

- [X] T022 [US4] Implementar seguimiento de estado "dirty" y confirmación antes de navegar en `src/app.js`, `src/components/entity-form.js` y `src/components/document-form.js` (FR-022)

**Checkpoint**: La navegación nunca descarta cambios sin consentimiento explícito.

---

## Phase 7b: Cierre de la primera tanda (completado)

**Purpose**: Regresión, documentación y calidad de las historias de la primera tanda; se mantiene aquí para conservar el orden secuencial de IDs.

- [X] T023 [P] Verificar y ajustar `README.md` y `specs/001-erp-base-module/quickstart.md` para documentar `entityDate`, el rango 1910-01-01..hoy, la fecha local y el comportamiento de valores históricos
- [X] T024 Ejecutar `npm test` desde la raíz del repositorio y corregir regresiones en `tests/unit/` y `tests/integration/`
- [X] T025 Ejecutar `npm run lint` y `npm run build` desde la raíz del repositorio y corregir cualquier error en `src/`
- [X] T026 Ejecutar los escenarios de `specs/001-erp-base-module/quickstart.md` de extremo a extremo, incluida la sección "Validación del Perfil de Clientes"

---

## Phase 8: Foundational - Reglas de campo del perfil cliente (segunda tanda 2026-11-23)

**Purpose**: Contrato de reglas de campo, validadores compartidos y resolución de preparación de ficha. BLOCKS las fases US8, US7, US2, US3, US9 y US12.

**⚠️ CRITICAL**: Ninguna tarea de las fases 9–13 puede comenzar hasta completar esta fase.

- [ ] T027 [P] Crear `tests/unit/field-formats.test.js` con casos válidos e inválidos para `cl-rut` (dígito verificador, normalización de puntos/guion y unicidad delegada), `phone`, `email` y `nonEmpty`, siguiendo `contracts/entity-storage.md`
- [ ] T028 [P] Crear `tests/unit/field-rules.test.js` para `resolveFieldRules(config, entityType)` con herencia de reglas globales por entidad, `isFieldVisible()`, `isFieldSearchable()`, `isConditionActive()` y `getReadinessErrors()` ante clientes heredados incompletos
- [ ] T029 [P] Implementar `src/utils/field-formats.js` exportando los validadores `cl-rut`, `phone`, `email` y `nonEmpty`, reutilizando la lógica de RUT de `src/seed.js` y devolviendo booleanos sin efectos secundarios
- [ ] T030 Implementar `src/utils/field-rules.js` con `resolveFieldRules()`, `isFieldVisible()`, `isFieldSearchable()`, `isConditionActive()` y `getReadinessErrors()`, derivando `required`, `hidden`, `searchable`, `generated`, `unique`, `format`, `normalize`, `when` y `group` de `fieldRules`
- [ ] T031 [P] Ampliar `tests/unit/module-config.test.js` para exigir `fieldRules`, `detailPolicy` y `entityDate.required` en `DEFAULT_CONFIG`/`MODULE_CONFIG`, rechazar reglas con `format` desconocido y verificar fallback a `DEFAULT_CONFIG` con aviso
- [ ] T032 [P] Ampliar `tests/unit/storage.test.js` con casos de `addEntity()`/`updateEntity()` para código generado único y oculto, RUT inválido/duplicado, fecha de nacimiento obligatoria, campos condicionales por canal y exclusión de `code`, `category` y `description` de la búsqueda
- [ ] T033 Ampliar `src/module-config.js` con `fieldRules`, `detailPolicy`, `entityDate.required` y los campos condicionales del perfil cliente en `DEFAULT_CONFIG`, `validateConfig()`, `loadModuleConfig()` y `normalizeConfig()`, eliminando `pedidos` de la configuración
- [ ] T034 Integrar `src/utils/field-rules.js` y `src/utils/field-formats.js` en `src/storage.js` para validar requeridos, formatos, unicidad, grupo activo y reglas `generated`, conservando los valores heredados ocultos sin borrarlos

**Checkpoint**: Las reglas son configurables, se validan y las pruebas fallan hasta completar la implementación; las historias pueden comenzar.

---

## Phase 9: User Story 8 - Declarar campos y reglas del perfil de clientes (Priority: P1)

**Goal**: La configuración del perfil cliente declara campos obligatorios, ocultos, generados, únicos y condicionales sin endurecer reglas en la interfaz.

**Independent Test**: Con `MODULE_CONFIG` cargado, `resolveFieldRules()` expone `pedidos` ausente, `code` generado/oculto/no buscable y los cuatro canales con su grupo de contacto; el seed genera datos coherentes.

### Tests for User Story 8

- [ ] T035 [P] [US8] Crear `tests/integration/client-field-rules.test.js` para verificar que la configuración declara RUT, fecha de nacimiento y canal como obligatorios, `pedidos` ausente, campos ocultos y campos condicionales por canal

### Implementation for User Story 8

- [ ] T036 [US8] Aplicar en `src/module-config.js` la declaración final de `fieldRules.entity`, `detailPolicy.entity` y `entityDate.required: true` del perfil cliente, con `code` generado/único/oculto/no buscable y `category`/`description` ocultos/no buscables (depende de T033)
- [ ] T037 [US8] Actualizar `src/seed.js` y `scripts/seed.mjs` para no generar `pedidos`, producir RUT chileno válido y único, fecha de nacimiento pasada y datos de contacto coherentes con el canal, ajustando `tests/unit/seed.test.js`

**Checkpoint**: La declaración de campos del perfil cliente está completa y es verificable sin tocar la interfaz.

---

## Phase 10: User Story 7 - Ocultar campos retirados en todas las vistas (Priority: P1)

**Goal**: `Código`, `Categoría`, `Descripción` y `Nº de pedidos` dejan de mostrarse en formulario, lista, ficha y selector, sin eliminar valores guardados.

**Independent Test**: Con clientes sembrados que tienen valores en esos campos, ninguna vista los renderiza y el almacenamiento sigue conservándolos.

### Tests for User Story 7

- [ ] T038 [P] [US7] Ampliar `tests/integration/relabeling.test.js` para comprobar que `Código`, `Categoría`, `Descripción` y `Nº de pedidos` no aparecen en `#entity-form`, lista, ficha ni selector de campos

### Implementation for User Story 7

- [ ] T039 [US7] Ocultar los campos retirados en `getEntityFieldDefs()` de `src/components/entity-form.js`, `renderEntityListHtml()` de `src/components/entity-list.js`, `renderEntityDetailHtml()` de `src/components/entity-detail.js` y `customFieldKeys()` de `src/app.js`, manteniendo los valores en almacenamiento

**Checkpoint**: La retirada visual es completa y no destruye datos históricos.

---

## Phase 11: User Story 2 - Registrar clientes con campos obligatorios y código generado (Priority: P2)

**Goal**: El alta de clientes exige fecha de nacimiento, RUT chileno válido y único y canal de contacto, muestra un código generado solo internamente y guarda únicamente el dato del canal elegido.

**Independent Test**: Sin completar los tres obligatorios no se puede guardar; al elegir cada canal aparece su casilla validada; el registro creado recibe un `code` único que no aparece en la interfaz.

### Tests for User Story 2

- [ ] T040 [P] [US2] Ampliar `tests/integration/register-client.test.js` para exigir fecha de nacimiento, RUT válido y único, canal seleccionado y código generado no editable en el alta de clientes
- [ ] T041 [P] [US2] Ampliar `tests/integration/register-client-contact.test.js` para verificar que `Teléfono`, `Correo electrónico`, `Lugar/Enlace de reunión` y `WhatsApp` son obligatorios y validados solo cuando su canal está activo, guardándose únicamente ese valor

### Implementation for User Story 2

- [ ] T042 [US2] Hacer obligatoria la fecha de nacimiento en `resolveEntityDateRule()` de `src/utils/entity-date.js` y marcar `required` en la definición de `targetDate` de `getEntityFieldDefs()` en `src/components/entity-form.js`
- [ ] T043 [US2] Generar el `code` único en `addEntity()` de `src/storage.js` usando la regla `generated` y conservarlo en el registro sin incluirlo en formularios, listas ni fichas
- [ ] T044 [US2] Renderizar la casilla condicional del canal en `renderFieldHtml()` de `src/components/form-fields.js` y reaccionar al cambio de canal en `handleChange()` de `src/app.js` sin perder el borrador ni valores de otros canales

**Checkpoint**: El registro de clientes es válido, completo y no expone el código interno.

---

## Phase 12: User Story 3 - Consultar clientes heredados incompletos (Priority: P1)

**Goal**: Los clientes con fecha/RUT inválidos o incompletos tienen la ficha bloqueada pero pueden editarse para completar los datos; la ficha nunca muestra campos retirados.

**Independent Test**: Un cliente heredado se muestra en lista, su ficha muestra aviso y botón de edición en lugar de la consulta normal; tras guardar valores válidos, la ficha se desbloquea.

### Tests for User Story 3

- [ ] T045 [P] [US3] Ampliar `tests/integration/client-birthdate-legacy.test.js` para cubrir clientes heredados con fecha/RUT inválidos: ficha bloqueada, acción de edición disponible y desbloqueo tras guardar valores válidos
- [ ] T046 [P] [US3] Ampliar `tests/integration/entity-detail.test.js` y `tests/integration/client-history.test.js` para verificar que la ficha no muestra campos ocultos pero conserva el historial de valores heredados

### Implementation for User Story 3

- [ ] T047 [US3] Implementar la comprobación de preparación con `detailPolicy.entity` en `renderDetailView()` de `src/app.js` y `renderEntityDetailHtml()` de `src/components/entity-detail.js`, ofreciendo botón de edición correctora y bloqueando la consulta normal

**Checkpoint**: La consulta protege la integridad sin impedir la corrección.

---

## Phase 13: User Story 9 / User Story 12 - Buscar solo por campos visibles (Priority: P2)

**Goal**: La búsqueda de clientes y la pantalla de búsqueda ignoran `code`, `category` y `description`, y usan solo campos buscables del perfil.

**Independent Test**: Buscar un código, categoría o descripción conocidos no devuelve clientes; buscar por nombre, fecha de nacimiento o campo de contacto visibles sí los devuelve y el placeholder no menciona campos ocultos.

### Tests for User Story 9 / User Story 12

- [ ] T048 [P] [US9] Ampliar `tests/integration/search-entities.test.js` para verificar que los clientes no se encuentran por `code`, `category` ni `description`, pero sí por nombre, fecha de nacimiento y campos visibles
- [ ] T049 [P] [US12] Ampliar `tests/integration/search-screen.test.js` para comprobar que el placeholder y los resultados de `src/components/search-bar.js` reflejan solo campos buscables del perfil cliente

### Implementation for User Story 9 / User Story 12

- [ ] T050 [US9] Excluir los campos no buscables en `matchesQuery()`/`searchEntities()` de `src/storage.js` y en `currentSearchResults()`/`customFieldKeys()` de `src/app.js`, usando `isFieldSearchable()`
- [ ] T051 [US12] Derivar el placeholder de búsqueda de `fieldRules` en `renderSearchBar()` de `src/components/search-bar.js`, eliminando referencias fijas a `Código` y `Categoría`

**Checkpoint**: La búsqueda es coherente con los campos que el usuario ve.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Regresión, documentación y calidad finales de todas las historias, incluidas las reglas FR-051..FR-061.

- [ ] T052 [P] Ampliar `README.md` y `specs/001-erp-base-module/quickstart.md` para documentar campos ocultos, código generado, RUT chileno obligatorio, campos condicionales por canal y ficha bloqueada de clientes heredados
- [ ] T053 Ejecutar `npm test` desde la raíz del repositorio y corregir regresiones en `tests/unit/` y `tests/integration/` derivadas de las fases 8–13
- [ ] T054 Ejecutar `npm run lint` y `npm run build` desde la raíz del repositorio y corregir cualquier error en `src/` derivado de las fases 8–13
- [ ] T055 Ejecutar de extremo a extremo las secciones "Validación del Perfil de Clientes" y "Validación del Perfil de Clientes (segunda tanda)" de `specs/001-erp-base-module/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias
- **Foundational (Phase 2)**: Depende de Phase 1; BLOCKS US7, US10 y US2 de la primera tanda
- **US7 (Phase 3)**: Depende de T004, T005 y T007
- **US10 (Phase 4)**: Depende de T004, T005, T007 y T009
- **US2 (Phase 5)**: Depende de T005, T007, T009 y T015
- **US13 (Phase 6)**: Depende de la base completada de US5/US11; independiente de US7, US10 y US2
- **US4 (Phase 7)**: Depende de la base completada de US14 y de los formularios de US1/US11; independiente de la regla de fecha
- **Foundational segunda tanda (Phase 8)**: Depende de Phase 2; BLOCKS US8, US7, US2, US3, US9 y US12 de las fases 9–13
- **US8 (Phase 9)**: Depende de T027–T034
- **US7 segunda tanda (Phase 10)**: Depende de T030, T033 y T034
- **US2 segunda tanda (Phase 11)**: Depende de T034, T036 y T039
- **US3 (Phase 12)**: Depende de T030, T034, T036 y T039
- **US9 / US12 (Phase 13)**: Dependen de T030, T034, T036 y T039
- **Polish (Phase N)**: Depende de todas las fases deseadas

### User Story Dependencies

- **US7 (P1, primera tanda)**: Puede comenzar tras Foundational; no depende de otras historias pendientes
- **US10 (P2, primera tanda)**: Depende de US7 para la etiqueta, pero es verificable de forma independiente con el reloj falso
- **US2 (P2, primera tanda)**: Depende de US7 y US10 para activar el perfil cliente completo
- **US13 (P2)**: Independiente del resto de historias pendientes
- **US4 (P1)**: Independiente del resto de historias pendientes
- **US8 (P1, segunda tanda)**: Puede comenzar tras Phase 8; no depende de US7/US2/US3/US9/US12 de la segunda tanda
- **US7 (P1, segunda tanda)**: Depende de las reglas declaradas en US8, pero es verificable de forma independiente revisando vistas
- **US2 (P2, segunda tanda)**: Depende de US8 y US7 para registrar clientes con campos visibles y reglas activas
- **US3 (P1)**: Depende de US8 y US7; verificable de forma independiente con clientes heredados sembrados
- **US9 / US12 (P2)**: Dependen de US8 y US7; verificables de forma independiente con búsquedas sembradas
- **Historias baseline (US1, US3, US5, US8, US9, US11, US12, US14, US15, US6)**: Completadas en su versión original; solo se validan en Phase N junto con sus incrementos de las fases 9–13

### Within Each User Story

- Las pruebas marcadas `[P]` se escriben y fallan antes de la implementación
- La utilidad/configuración va antes de los componentes
- Los componentes van antes de la integración en `src/app.js`
- En la segunda tanda, `field-formats`/`field-rules` van antes que `module-config`/`storage`, y estos antes que componentes y búsqueda
- Cada historia se valida en su checkpoint antes de avanzar

### Parallel Opportunities

- T001, T002, T003 y T006 pueden ejecutarse en paralelo tras el setup
- T004 y T005 pueden ejecutarse en paralelo
- T008, T018, T019 y T021 pueden ejecutarse en paralelo una vez lista la base
- T010 y T011 pueden ejecutarse en paralelo
- US13 y US4 pueden avanzar en paralelo con US7/US10/US2 tras Foundational
- T027, T028, T031 y T032 pueden ejecutarse en paralelo al iniciar Phase 8
- T029 puede ejecutarse en paralelo con T028 y T030; T033 va después de T031 y T034 después de T030/T032/T033
- T035 puede ejecutarse en paralelo con T036; T038, T040, T041, T045, T046, T048 y T049 pueden ejecutarse en paralelo tras Phase 8
- US7, US2, US3, US9 y US12 de la segunda tanda pueden avanzar en paralelo entre sí una vez completas Phase 8 y Phase 9
- T052 puede ejecutarse en paralelo con las últimas implementaciones; T053–T055 van al final

---

## Parallel Example: User Story 10

```bash
# Ejecutar juntas las pruebas unitaria y de integración de la fecha de nacimiento:
Task: "Ampliar tests/unit/entity-date.test.js con relojes falsos para medianoche local"
Task: "Crear tests/integration/entity-birthdate.test.js con min/max y actualización sin recarga"
```

## Parallel Example: Foundational

```bash
# Crear pruebas primero y luego utilidad/configuración en paralelo:
Task: "Crear tests/unit/entity-date.test.js"
Task: "Ampliar tests/unit/module-config.test.js"
Task: "Ampliar tests/unit/storage.test.js"
Task: "Implementar src/utils/entity-date.js"
Task: "Ampliar src/module-config.js"
```

## Parallel Example: Foundational segunda tanda

```bash
# Escribir pruebas y utilidades independientes en paralelo:
Task: "Crear tests/unit/field-formats.test.js"
Task: "Crear tests/unit/field-rules.test.js"
Task: "Implementar src/utils/field-formats.js"
Task: "Ampliar tests/unit/module-config.test.js"
Task: "Ampliar tests/unit/storage.test.js"
```

## Parallel Example: User Story 2 (segunda tanda)

```bash
# Ejecutar juntas las pruebas de registro y campos condicionales:
Task: "Ampliar tests/integration/register-client.test.js"
Task: "Ampliar tests/integration/register-client-contact.test.js"
```

---

## Implementation Strategy

### MVP First (Segunda tanda 2026-11-23)

1. Completar Phase 8 (reglas de campo y validadores)
2. Completar Phase 9 (US8: declaración de campos del perfil cliente)
3. Completar Phase 10 (US7: ocultar campos retirados)
4. **DETENERSE y VALIDAR**: ejecutar `tests/integration/client-field-rules.test.js` y `tests/integration/relabeling.test.js`
5. Desplegar/demostrar si está listo

### Incremental Delivery

1. Foundational primera tanda → contrato de fecha listo
2. US7 → terminología coherente
3. US10 → fecha válida y dinámica
4. US2 → perfil cliente completo
5. US13 y US4 → aclaraciones 2026-11-16 pendientes
6. Foundational segunda tanda → reglas de campo y validadores listos
7. US8 → configuración declarativa del perfil cliente
8. US7 → campos retirados invisibles sin pérdida de datos
9. US2 → registro con obligatorios, código generado y campos condicionales
10. US3 → ficha bloqueada de clientes heredados con edición correctora
11. US9 / US12 → búsqueda coherente con campos visibles
12. Polish → regresión y documentación

### Parallel Team Strategy

1. El equipo completa Setup + Foundational de la primera tanda
2. Tras la base:
   - Desarrollador A: US7 → US10 → US2
   - Desarrollador B: US13
   - Desarrollador C: US4
3. Tras esas fases, completar Phase 8 y Phase 9 juntos
4. Tras Phase 9:
   - Desarrollador A: US7 (ocultar campos) → US2 (registro)
   - Desarrollador B: US3 (ficha heredada)
   - Desarrollador C: US9 / US12 (búsqueda)
5. Integrar cada historia en su checkpoint y ejecutar Phase N al final

---

## Notes

- `[P]` indica archivos distintos y sin dependencias pendientes
- `[US#]` traza la tarea a la historia de usuario correspondiente
- Las tareas de prueba se incluyen por mandato de la Constitución (Principio II)
- Verificar que las pruebas fallan antes de implementar
- No añadir dependencias de fechas: usar `Date` nativo y cadenas ISO
- Confirmar con `npm test`, `npm run lint` y `npm run build` antes de cerrar cada fase
- Evitar tareas vagas, conflictos de archivo y dependencias que rompan la independencia
