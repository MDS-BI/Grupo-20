- [ ] T001 Create Vite project structure per implementation plan
- [ ] T002 Initialize npm project with dependencies (vitest, jsdom)
- [ ] T003 Configure eslint and prettier for vanilla JS
- [ ] T004 Setup basic HTML structure (index.html, main.js entry point)

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 [P] Implement storage layer (localStorage) in src/storage.js
- [ ] T006 [P] Implement entity model structure in src/models/entity.js
- [ ] T007 [P] Implement document model structure in src/models/document.js
- [ ] T008 Configure module-config.js structure with default values
- [ ] T009 Implement basic validation framework

## Phase 3: User Story 1 - Definir datos compatibles con el ERP (Priority: P1) 🎯 MVP

**Goal**: Un analista de sistemas ERP define un modelo de datos con identificadores y campos comunes para facilitar futuras integraciones del CRM.

**Independent Test**: Un analista registra un cliente de prueba y le asocia una interacción; el sistema guarda la relación y rechaza un identificador de cliente repetido con un mensaje claro.

- [ ] T010 [US1] Create client entity model with code validation in src/models/client.js
- [ ] T011 [US1] Implement create client operation with unique code validation
- [ ] T012 [P] [US1] Implement search clients by name/code functionality
- [ ] T013 [US1] Implement client list display in dashboard

## Phase 4: User Story 4 - Gestionar entidades y documentos en una pantalla dedicada (Priority: P1)

**Goal**: Un usuario de negocio puede navegar a la pantalla de gestión, alternar entre gestión de entidades y documentos, y añadir/editar/eliminar con éxito.

**Independent Test**: Un usuario navega a la pantalla de gestión mediante la barra lateral o una acción rápida, alterna entre la gestión de entidades y documentos, y vuelve al panel, añadiendo, editando y eliminando con éxito una entidad y un documento.

- [ ] T014 [US4] Implement entity management screen (src/components/entity-form.js)
- [ ] T015 [US4] Implement document management within entity screen
- [ ] T016 [US4] Implement entity creation form with validation
- [ ] T017 [US4] Implement entity editing with confirmation for cascading delete
- [ ] T018 [US4] Implement document creation form with folio validation
- [ ] T019 [US4] Implement document editing with associated entity updates
- [ ] T020 [US4] Implement entity deletion with confirmation for cascading delete

## Phase 5: User Story 5 - Definir un perfil de configuración del módulo (Priority: P1)

**Goal**: Un desarrollador de módulos declara un único archivo de configuración que defina la identidad, terminología, campos personalizados y reglas de su módulo, para adaptar el módulo base en un módulo específico sin modificar su código central.

**Independent Test**: Un desarrollador proporciona un archivo de configuración que define un perfil de Ventas (nombre del módulo, mapeos Entidad→Cliente, campos personalizados, ciclo de vida), y la aplicación se presenta plenamente como un módulo de Ventas; al quitar el archivo se restauran los valores predeterminados sin errores.

- [ ] T021 [US5] Create module-config.js structure with module name, terminology mappings
- [ ] T022 [US5] Implement default configuration (Entidad/Documento fallback)
- [ ] T023 [US5] Implement invalid config detection and warning display

## Phase 6: User Story 7 - Reetiquetar pantallas desde la configuración (Priority: P1)

**Goal**: Todas las etiquetas visibles para el usuario derivan de la configuración, para que un módulo adaptado hable su idioma de dominio de forma consistente en todo momento.

**Independent Test**: Un desarrollador mapea Entidad→Cliente y Documento→Pedido de Venta en la configuración, y cada pestaña, botón, etiqueta de formulario, encabezado y mensaje en las tres pantallas usa los términos mapeados.

- [ ] T024 [US7] Apply module config terminology to shell component labels
- [ ] T025 [US7] Apply module config terminology to dashboard buttons
- [ ] T026 [US7] Apply module config terminology to all form labels

## Phase 7: User Story 8 - Declarar campos personalizados para los registros (Priority: P1)

**Goal**: Un desarrollador de módulos declara campos adicionales para entidades y documentos en la configuración, para que aparezcan automáticamente en formularios, listas, validación y búsqueda sin escribir código de interfaz.

**Independent Test**: Un desarrollador declara un campo numérico obligatorio personalizado en las entidades; se muestra como entrada numérica, bloquea el guardado cuando está en blanco, muestra los valores guardados en las listas y coincide en las búsquedas.

- [ ] T027 [US8] Implement custom field declaration in module-config.js
- [ ] T028 [US8] Implement custom field rendering in entity form
- [ ] T029 [US8] Implement custom field validation before save
- [ ] T030 [US8] Implement custom field display in lists and search results

## Phase 8: User Story 14 - Marco de espacio de trabajo ERP con marca (Priority: P1)

**Goal**: Un espacio de trabajo estilo ERP consistente, con una barra superior con marca y una barra lateral de módulos presentes en cada pantalla, para que la aplicación se sienta como un sistema empresarial coherente en lugar de páginas sueltas.

**Independent Test**: En cada pantalla, una barra superior muestra un logotipo derivado del nombre del módulo junto al nombre del módulo, una barra lateral ofrece botones de módulo para Panel, Entidades, Documentos y Buscar con el módulo activo resaltado visualmente, y navegar entre módulos nunca pierde datos.

- [ ] T031 [US14] Implement shell component with top bar (logo SVG, module name)
- [ ] T032 [US14] Implement sidebar with module buttons (Panel, Entidades, Documentos, Buscar)
- [ ] T033 [US14] Implement responsive sidebar collapse for narrow screens
- [ ] T034 [US14] Implement module active state highlighting in sidebar

## Phase 9: User Story 2 - Registrar clientes y contactos comerciales (Priority: P2)

**Goal**: Un ejecutivo de ventas puede registrar clientes y sus interacciones para organizar la información comercial y dejar constancia de cada contacto.

**Independent Test**: Un ejecutivo registra un cliente y una llamada asociada a él; comprueba que el cliente aparece en la lista de registros y que la llamada queda guardada en su ficha.

- [ ] T035 [US2] Implement client registration form with required fields
- [ ] T036 [US2] Implement client interaction recording (calls, meetings)
- [ ] T037 [US2] Implement duplicate client code rejection with message
- [ ] T038 [P] [US2] Implement client list display with search integration

## Phase 10: User Story 9 - Buscar y encontrar entidades rápidamente (Priority: P2)

**Goal**: Un usuario de negocio puede introducir un término de búsqueda y ver solo las entidades coincidentes.

**Independent Test**: Un usuario puede introducir un término de búsqueda y ver solo las entidades coincidentes.

- [ ] T039 [US9] Implement quick search bar in dashboard with real-time results
- [ ] T040 [US9] Implement search filter by name, code, category, description
- [ ] T041 [US9] Implement empty state display for no matches

## Phase 11: User Story 10 - Registrar una fecha objetivo (Priority: P2)

**Goal**: Un usuario puede fijar una fecha objetivo en una entidad y verla mostrada en la lista.

**Independent Test**: Un usuario puede fijar una fecha en una entidad y verla mostrada en la lista.

- [ ] T042 [US10] Implement target date field on entity form
- [ ] T043 [US10] Implement target date display in entity list
- [ ] T044 [US10] Implement date validation (valid calendar date when present)

## Phase 12: User Story 11 - Registrar los detalles de documentos de una entidad (Priority: P2)

**Goal**: Un usuario puede adjuntar detalles de documentos a una entidad para mantener la actividad transaccional organizada junto a cada registro de datos maestros.

**Independent Test**: Un usuario puede añadir un documento a una entidad y ver los detalles del documento mostrados junto a esa entidad.

- [ ] T045 [US11] Implement document addition to entity with required field validation
- [ ] T046 [US11] Implement document editing with associated entity updates
- [ ] T047 [US11] Implement document deletion confirmation with cascading count
- [ ] T048 [US11] Implement document display in entity management screen

## Phase 13: User Story 12 - Buscar entidades en una pantalla dedicada (Priority: P2)

**Goal**: Un usuario puede abrir la pantalla de búsqueda desde la barra lateral o una acción rápida, introducir un término de búsqueda y ver solo las entidades coincidentes.

**Independent Test**: Un usuario puede abrir la pantalla de búsqueda desde la barra lateral o una acción rápida, introducir un término de búsqueda y ver solo las entidades coincidentes.

- [ ] T049 [US12] Implement dedicated search screen accessible from sidebar
- [ ] T050 [US12] Implement search functionality with name, code, category, date target filters
- [ ] T051 [US12] Implement navigation back to panel from search screen

## Phase 14: User Story 13 - Configurar el ciclo de vida de estados de documentos (Priority: P2)

**Goal**: Un desarrollador de módulos define los estados permitidos de los documentos y las transiciones permitidas, para que los documentos sigan el ciclo de vida del dominio en lugar de aceptar texto de estado arbitrario.

**Independent Test**: Un desarrollador configura un ciclo de vida cotización→pedido→facturado; el control de estado ofrece solo estados siguientes válidos, las transiciones inválidas se rechazan con una explicación, y el estado es visible de un vistazo en las listas.

- [ ] T052 [US13] Implement document state lifecycle configuration (étapes configurables)
- [ ] T053 [US13] Implement valid state transitions enforcement
- [ ] T054 [US13] Implement state display in document lists and details

## Phase 15: User Story 6 - Consultar indicadores de Gestión Comercial (Priority: P6)

**Goal**: Un Gerente Comercial visualiza un resumen de clientes, interacciones y seguimientos pendientes para identificar necesidades de atención y organizar el trabajo del equipo.

**Independent Test**: Un Gerente Comercial accede al resumen de Gestión Comercial y comprueba que el total de clientes, las interacciones registradas y los seguimientos pendientes coinciden con los datos de las fichas de los clientes; luego registra un nuevo seguimiento y verifica que el indicador correspondiente se actualiza.

- [ ] T055 [US6] Implement commercial indicators dashboard showing client counts, interactions, pending follow-ups
- [ ] T056 [US6] Implement summary statistics that update with data changes
- [ ] T057 [US6] Implement configurable terminology labels (CRM vs Entidad/Documento)

## Phase 16: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T058 [P] Documentation updates across all components
- [ ] T059 Code cleanup and refactoring
- [ ] T060 [P] Performance optimization for lists with 500+ records
- [ ] T061 [P] Security hardening - XSS prevention on data display
- [ ] T062 Run quickstart.md validation
- [ ] T063 Final integration test across all user stories

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-15)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P6)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - Builds on data model from US1
- **User Story 4 (P1)**: Can start after Foundational (Phase 2) - Management screen infrastructure
- **User Story 5 (P1)**: Can start after Foundational (Phase 2) - Configuration infrastructure
- **User Story 6 (P6)**: Can start after Foundational (Phase 2) - Depends on US2, US3 for data
- **User Story 7 (P1)**: Can start after Foundational (Phase 2) - Depends on US5 config
- **User Story 8 (P1)**: Can start after Foundational (Phase 2) - Depends on US5 config
- **User Story 9 (P2)**: Can start after Foundational (Phase 2) - Search infrastructure
- **User Story 10 (P2)**: Can start after Foundational (Phase 2) - Date field on entities
- **User Story 11 (P2)**: Can start after Foundational (Phase 2) - Document management
- **User Story 12 (P2)**: Can start after Foundational (Phase 2) - Dedicated search UI
- **User Story 13 (P2)**: Can start after Foundational (Phase 2) - Document lifecycle
- **User Story 14 (P1)**: Can start after Foundational (Phase 2) - Workspace frame

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

## Parallel Example: User Story 1

```bash
# Launch all [P] tasks for User Story 1 in parallel:
Task: "Implement search clients by name/code functionality in src/models/client.js"
Task: "Implement create client operation with unique code validation"
Task: "Implement client list display in dashboard"

# Launch models in parallel:
Task: "Create entity model structure in src/models/entity.js"
Task: "Create client entity model with code validation in src/models/client.js"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Define datos compatibles con el ERP)
4. **STOP and VALIDATE**: Test User Story 1 independently (register client, verify unique code rejection)
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 4 → Test independently → Deploy/Demo
4. Add User Story 5 → Test independently → Deploy/Demo (configuration)
5. Add User Story 7 → Test independently → Deploy/Demo (terminology)
6. Add User Story 8 → Test independently → Deploy/Demo (custom fields)
7. Add User Story 14 → Test independently → Deploy/Demo (workspace frame)
8. Add User Story 2 → Test independently → Deploy/Demo (client registration)
9. Add User Story 9 → Test independently → Deploy/Demo (quick search)
10. Add User Story 10 → Test independently → Deploy/Demo (target date)
11. Add User Story 11 → Test independently → Deploy/Demo (document details)
12. Add User Story 12 → Test independently → Deploy/Demo (dedicated search)
13. Add User Story 13 → Test independently → Deploy/Demo (lifecycle)
14. Add User Story 6 → Test independently → Deploy/Demo (commercial indicators)
15. Complete Polish & Cross-Cutting Concerns

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (P1)
   - Developer B: User Story 4 (P1)
   - Developer C: User Story 5 (P1)
   - Developer D: User Story 14 (P1)
   - Developer E: User Story 7 (P1)
   - Developer F: User Story 8 (P1)
3. Stories complete and integrate independently
4. Move to P2 stories in parallel
5. Final polish and integration