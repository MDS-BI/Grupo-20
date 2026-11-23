---
description: "Task list for feature implementation"
---

# Tasks: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

**Input**: Design documents from `/specs/001-erp-base-module/`

**Prerequisites**: `plan.md` (required), `spec.md` (required for user stories), `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Incluidas por el Principio II de la Constitución: toda lógica de negocio y comportamiento visible debe tener cobertura automatizada. Las tareas Ampliar/Crear pruebas deben escribirse primero y fallar antes de la implementación correspondiente.

**Organization**: Las tareas se agrupan por historia de usuario. Las historias ya completadas en el baseline (US1, US3, US5, US8, US9, US11, US12, US14, US15 y US6) no se duplican; solo se enumeran las tareas pendientes y las nuevas de las sesiones 2026-11-16 y 2026-11-23. La fase final cubre regresión de todas ellas.

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

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Regresión, documentación y calidad en todas las historias.

- [X] T023 [P] Verificar y ajustar `README.md` y `specs/001-erp-base-module/quickstart.md` para documentar `entityDate`, el rango 1910-01-01..hoy, la fecha local y el comportamiento de valores históricos
- [X] T024 Ejecutar `npm test` desde la raíz del repositorio y corregir regresiones en `tests/unit/` y `tests/integration/`
- [X] T025 Ejecutar `npm run lint` y `npm run build` desde la raíz del repositorio y corregir cualquier error en `src/`
- [X] T026 Ejecutar los escenarios de `specs/001-erp-base-module/quickstart.md` de extremo a extremo, incluida la sección "Validación del Perfil de Clientes"

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias
- **Foundational (Phase 2)**: Depende de Phase 1; BLOCKS US7, US10 y US2
- **US7 (Phase 3)**: Depende de T004, T005 y T007
- **US10 (Phase 4)**: Depende de T004, T005, T007 y T009
- **US2 (Phase 5)**: Depende de T005, T007, T009 y T015
- **US13 (Phase 6)**: Depende de la base completada de US5/US11; independiente de US7, US10 y US2
- **US4 (Phase 7)**: Depende de la base completada de US14 y de los formularios de US1/US11; independiente de la regla de fecha
- **Polish (Phase N)**: Depende de todas las fases deseadas

### User Story Dependencies

- **US7 (P1)**: Puede comenzar tras Foundational; no depende de otras historias pendientes
- **US10 (P2)**: Depende de US7 para la etiqueta, pero es verificable de forma independiente con el reloj falso
- **US2 (P2)**: Depende de US7 y US10 para activar el perfil cliente completo
- **US13 (P2)**: Independiente del resto de historias pendientes
- **US4 (P1)**: Independiente del resto de historias pendientes
- **Historias baseline (US1, US3, US5, US8, US9, US11, US12, US14, US15, US6)**: Ya completadas; solo se validan en Phase N

### Within Each User Story

- Las pruebas marcadas `[P]` se escriben y fallan antes de la implementación
- La utilidad/configuración va antes de los componentes
- Los componentes van antes de la integración en `src/app.js`
- Cada historia se valida en su checkpoint antes de avanzar

### Parallel Opportunities

- T001, T002, T003 y T006 pueden ejecutarse en paralelo tras el setup
- T004 y T005 pueden ejecutarse en paralelo
- T008, T018, T019 y T021 pueden ejecutarse en paralelo una vez lista la base
- T010 y T011 pueden ejecutarse en paralelo
- US13 y US4 pueden avanzar en paralelo con US7/US10/US2 tras Foundational
- T023 puede ejecutarse en paralelo con las últimas implementaciones

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

---

## Implementation Strategy

### MVP First (Nuevo requerimiento 2026-11-23)

1. Completar Phase 1 y Phase 2
2. Completar US7 (renombrado) y US10 (rango + medianoche)
3. Completar US2 (activación del perfil cliente + valores históricos)
4. **DETENERSE y VALIDAR**: ejecutar `tests/integration/entity-birthdate.test.js` y `tests/integration/client-birthdate-legacy.test.js`
5. Desplegar/demostrar si está listo

### Incremental Delivery

1. Foundational → contrato listo
2. US7 → terminología coherente
3. US10 → fecha válida y dinámica
4. US2 → perfil cliente completo
5. US13 y US4 → aclaraciones 2026-11-16 pendientes
6. Polish → regresión y documentación

### Parallel Team Strategy

1. El equipo completa Setup + Foundational
2. Tras la base:
   - Desarrollador A: US7 → US10 → US2
   - Desarrollador B: US13
   - Desarrollador C: US4
3. Integrar cada historia en su checkpoint y ejecutar Phase N al final

---

## Notes

- `[P]` indica archivos distintos y sin dependencias pendientes
- `[US#]` traza la tarea a la historia de usuario correspondiente
- Las tareas de prueba se incluyen por mandato de la Constitución (Principio II)
- Verificar que las pruebas fallan antes de implementar
- No añadir dependencias de fechas: usar `Date` nativo y cadenas ISO
- Confirmar con `npm test`, `npm run lint` y `npm run build` antes de cerrar cada fase
- Evitar tareas vagas, conflictos de archivo y dependencias que rompan la independencia
