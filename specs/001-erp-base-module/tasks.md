---
description: 'Lista de tareas para la implementación del módulo base ERP'
---

# Tasks: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

**Entrada**: Documentos de diseño de `/specs/001-erp-base-module/`

**Prerrequisitos**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/auth.md`, `contracts/client-ui.md`, `contracts/customer-portal.md`, `contracts/entity-storage.md`, `contracts/marketing.md`, `contracts/postventa.md`, `quickstart.md`

**Pruebas**: Se incluyen suites de prueba porque `spec.md` declara escenarios obligatorios y `quickstart.md` define validaciones ejecutables. Cada suite se escribe antes de la implementación correspondiente y debe fallar primero; se ejecuta con `npm test`.

**Organización**: Las tareas se agrupan por historia de usuario en orden de prioridad: P1 (US1, US3, US4, US5, US7, US8, US14, US15, US22, US22d, US23, US24) y P2 (US2, US6, US9, US10, US11, US12, US13, US16, US17, US18, US19, US20, US21, US25). Las subhistorias (`US2a`–`US2d`, `US3a`–`US3b`, `US4a`–`US4c`, etc.) se etiquetan con su ID exacto cuando la tarea cubre una responsabilidad concreta.

**Reglas vigentes 2026-11-27**: acceso por botones sin usuario/contraseña/hash/bloqueo (FR-110); ficha rápida de solo lectura desde «Buscar» y «Clientes» (FR-111); «Abrir Ticket» y alertas naranja/azul en la tabla de clientes (FR-112); motivo obligatorio para `Cerrado perdido` solo en prospectos (FR-113); baja definitiva sin cascada con `EntityHasRecordsError` (FR-003, FR-009, FR-103); panel en línea de ticket sin `?view=ticket-form`, `window.open` ni listener `storage` (FR-104); dos pestañas públicas en `?view=client-portal` (FR-114); cotización con consentimiento que crea prospecto y documento (FR-115); búsqueda de cliente sin coincidencia sin mutar registros (FR-116); tarjeta de acceso con color de acento, fallback y enlace discreto al portal (FR-117, SC-044, SC-045).

## Formato: `[ID] [P?] [Historia] Descripción`

- El checkbox es siempre `- [ ]`; los ID son secuenciales T001, T002, ...
- **[P]**: la tarea toca archivos distintos y no depende de tareas incompletas.
- **[Historia]**: obligatorio solo en fases de historia de usuario; ausente en Setup, Foundational y Polish.
- La descripción nombra siempre la ruta de archivo concreta y el resultado esperado.

## Convenciones de rutas

- Proyecto único: `src/` y `tests/` en la raíz del repositorio.
- Documentos: `specs/001-erp-base-module/`.
- Comandos: `npm test`, `npm run lint`, `npm run format:check`, `npm run build` desde la raíz.

---

## Phase 1: Setup (Infraestructura compartida)

**Purpose**: Confirmar la estructura Vite/JavaScript vanilla, dependencias y convenciones de prueba.

- [x] T001 Verificar la estructura raíz en `package.json`, `index.html`, `src/main.js` y `vite.config.js` según `specs/001-erp-base-module/plan.md`.
- [x] T002 Confirmar en `package.json` las dependencias de desarrollo `vite`, `vitest`, `jsdom`, `eslint` y `prettier`, sin añadir dependencias nuevas.
- [x] T003 [P] Configurar el entorno jsdom y la limpieza de `localStorage` en `tests/setup/setup.js`.
- [x] T004 [P] Configurar `vitest.config.mjs` para incluir `tests/unit/` y `tests/integration/`.
- [x] T005 [P] Verificar reglas de `eslint` y `prettier` en `.eslintrc` y `.prettierrc` sin cambiar el estilo existente.
- [x] T006 Verificar que `specs/001-erp-base-module/quickstart.md` enumera los comandos `npm test`, `npm run lint` y `npm run format:check`.

---

## Phase 2: Foundational (Prerrequisitos bloqueantes)

**Purpose**: Núcleo compartido que debe estar completo antes de cualquier historia de usuario.

**⚠️ CRITICAL**: No iniciar trabajos de historias de usuario hasta terminar esta fase.

- [x] T007 Implementar la configuración base y el perfil CRM con fallback seguro en `src/module-config.js`, sin `pedidos` y con `customFields.entity` y `customFields.document`.
- [x] T008 [P] Implementar la matriz rango → acción, `can()` y `assertPermission()` en `src/auth/permissions.js`, con `postventa:*` y sin `permissions:edit` editable.
- [x] T009 [P] Implementar `SESSION_HOURS`, `getCurrentSession()`, `touchSession()` y `login(userId)` sin contraseña en `src/auth.js`.
- [x] T010 [P] Implementar normalización y validación de formatos (`cl-rut`, `phone`, `email`, `nonEmpty`) en `src/utils/field-formats.js`.
- [x] T011 [P] Implementar `escapeHtml()` y sanitización de atributos en `src/utils/sanitize.js`.
- [x] T012 Implementar carga, guardado e integridad referencial en `src/storage.js`, con `EntityHasRecordsError` y sin borrado en cascada.
- [x] T013 Implementar resolución de rutas relativas, render y manejo de acciones en `src/app.js`, sin `?view=ticket-form` ni listener `storage`.
- [x] T014 [P] Implementar reglas declarativas de visibilidad, obligatoriedad y grupos en `src/utils/field-rules.js`.
- [x] T015 [P] Implementar búsqueda sobre campos visibles en `src/utils/search.js`, excluyendo `code`, `category` y `description` del perfil cliente.
- [x] T016 [P] Implementar reglas de fecha local y límite dinámico en `src/utils/entity-date.js`.
- [x] T017 Crear pruebas unitarias fundacionales en `tests/unit/storage.test.js` para integridad, baja bloqueada y ausencia de cascada.
- [x] T018 Crear pruebas unitarias fundacionales en `tests/unit/permissions.test.js` para `can()`, `assertPermission()` y denegación por defecto.

**Checkpoint**: La base está lista; cualquier historia de usuario puede iniciarse.

---

## Phase 3: User Story 1 - Definir datos compatibles con el ERP (Priority: P1) 🎯 MVP

**Goal**: Garantizar la relación `Entidad`–`Documento`, identidad automática e integridad referencial.

**Independent Test**: Crear una entidad, un documento vinculado y comprobar en `tests/integration/entity-document.test.js` que el borrado de la entidad con registros se rechaza sin mutar datos.

- [x] T019 [P] [US1] Crear `tests/unit/entity-model.test.js` para los campos base de `Entidad` y la unicidad de `entity_id`.
- [x] T020 [P] [US1] Crear `tests/unit/document-model.test.js` para `entity_id` obligatorio y correspondiente a una entidad existente.
- [x] T021 [US1] Implementar en `src/storage.js` la generación de `id`, `entity_id`, `createdAt` y `updatedAt`.
- [x] T022 [US1] Implementar en `src/storage.js` la validación de `entity_id` contra `erp_entities` antes de escribir un documento.
- [x] T023 [US1] Implementar en `src/storage.js` `countDocumentsForEntity()` para el mensaje de confirmación sin eliminar registros.
- [x] T024 [US1] Crear `tests/integration/entity-document.test.js` para vincular, listar y bloquear la baja con documentos asociados.

**Checkpoint**: US1 es funcional y verificable de forma aislada.

---

## Phase 4: User Story 3 - Consultar antecedentes del cliente (Priority: P1)

**Goal**: Buscar clientes por campos visibles, abrir la ficha rápida y revisar el historial con permisos.

**Independent Test**: Buscar un cliente, abrir la ficha rápida desde «Buscar» y desde «Clientes», y verificar compras USD, fechas de inicio, historial y tickets permitidos en `tests/integration/client-quick-view.test.js`.

- [x] T025 [P] [US3a] Crear `tests/integration/client-quick-view.test.js` para apertura desde `Buscar` y `Clientes`, solo lectura y botones «Cerrar»/«Ver ficha completa».
- [x] T026 [P] [US3b] Crear `tests/integration/client-history.test.js` para historial cronológico y actualización tras mutaciones.
- [x] T027 [US3a] Crear `src/components/client-quick-view.js` con `data-action="close-quick-view"` y `data-action="view-entity-full"`, sin formularios.
- [x] T028 [US3a] Mostrar datos de contacto, total de compras «Cerrado ganado» en USD y `startDate` en `src/components/client-quick-view.js`.
- [x] T029 [US3a] Filtrar documentos y tickets de la vista rápida con `can()` en `src/components/client-quick-view.js`.
- [x] T030 [US3a] Cambiar el nombre del cliente en `src/components/entity-list.js` a `data-action="open-client-quick-view"` con `data-entity-id`.
- [x] T031 [US3b] Conservar `data-action="view-entity"` para la ficha completa en `src/components/entity-list.js` y abrirla desde «Ver ficha completa».
- [x] T032 [US3a] Gestionar `state.quickViewEntityId` y las acciones de apertura/cierre en `src/app.js`.
- [x] T033 [US3b] Renderizar estados vacíos y texto sanitizado en `src/components/client-quick-view.js` y `src/components/entity-detail.js`.
- [x] T034 [US3a] Añadir estilos de la vista superpuesta en `src/styles.css` sin persistir datos derivados.

**Checkpoint**: US3 es funcional y verificable de forma aislada.

---

## Phase 5: User Story 4 - Gestionar entidades y documentos en pantalla dedicada (Priority: P1)

**Goal**: Separar gestión de búsqueda, operar clientes/interacciones y ofrecer ticket rápido con alertas.

**Independent Test**: En `tests/integration/manage-view.test.js`, crear, editar, archivar y eliminar clientes; verificar bloqueo con registros, ficha rápida, «Abrir Ticket» y alertas por estado.

- [x] T035 [P] [US4a] Crear `tests/integration/manage-view.test.js` para acceso desde las tres acciones rápidas y enlaces profundos.
- [x] T036 [P] [US4c] Crear `tests/integration/document-management.test.js` para alta, edición, baja y permisos de documentos.
- [x] T037 [US4a] Implementar pestañas de clientes e interacciones en `src/components/manage-view.js` o el componente equivalente existente.
- [x] T038 [US4b] Adaptar `src/components/entity-list.js` para mostrar «Abrir Ticket» con `data-action="open-ticket"` solo con `postventa:create`.
- [x] T039 [US4b] Derivar alertas «Ticket abierto» y «Ticket en revisión» en `src/components/entity-list.js`, con clases `.ticket-alert--open` y `.ticket-alert--review`.
- [x] T040 [US4b] Mostrar ambas alertas cuando coexistan, en ese orden, en `src/components/entity-list.js`.
- [x] T041 [US4b] Ocultar alertas a N3 y visitante y limitar N2 a clientes con `ejecutivo_asignado = user.id` en `src/components/entity-list.js`.
- [x] T042 [US4b] Implementar `open-ticket` en `src/app.js`: verificar permiso, navegar a `?view=postventa`, abrir el panel y precargar `entity_id`.
- [x] T043 [US4b] Rechazar en `src/storage.js` la baja definitiva con registros vinculados devolviendo `EntityHasRecordsError`.
- [x] T044 [US4b] Ofrecer archivar como alternativa a la baja bloqueada en `src/components/entity-list.js`.
- [x] T045 [US4c] Validar campos obligatorios y mensaje exacto `Completa los campos obligatorios.` en `src/components/document-form.js`.

**Checkpoint**: US4 es funcional y verificable de forma aislada.

---

## Phase 6: User Story 5 - Definir perfil de configuración (Priority: P1)

**Goal**: Cargar `MODULE_CONFIG`, aplicar el perfil CRM y avisar de configuración inválida.

**Independent Test**: Modificar `src/module-config.js` en `tests/integration/config-profile.test.js` y confirmar fallback a `DEFAULT_CONFIG` con aviso visible.

- [x] T046 [P] [US5] Crear `tests/integration/config-profile.test.js` para perfil válido, inválido y en conflicto.
- [x] T047 [US5] Declarar `customFields.entity` y `customFields.document` del perfil CRM en `src/module-config.js`.
- [x] T048 [US5] Añadir `documentRules.lostReason` con `status: 'cerrado perdido'`, `entityStateField: 'estado_comercial'`, `entityState: 'prospecto'`, `customField: 'motivo_perdida'` y las opciones exactas en `src/module-config.js`.
- [x] T049 [US5] Implementar validación de bloques opcionales y aviso visible en `src/module-config.js`.
- [x] T050 [US5] Verificar que los valores huérfanos de campos retirados se conserven sin mostrarse en `src/storage.js` y `src/components/entity-detail.js`.

**Checkpoint**: US5 es funcional y verificable de forma aislada.

---

## Phase 7: User Story 7 - Reetiquetar pantallas desde configuración (Priority: P1)

**Goal**: Derivar terminología visible de la configuración sin cambiar claves internas.

**Independent Test**: Cambiar etiquetas en `src/module-config.js` y comprobar en `tests/integration/labels.test.js` que «Nuevo Cliente» y «Fecha de nacimiento» aparecen en todas las superficies.

- [x] T051 [P] [US7] Crear `tests/integration/labels.test.js` para etiquetas exactas en formularios, tablas, ficha y panel.
- [x] T052 [US7] Centralizar etiquetas de cliente, interacción y fecha en `src/module-config.js`.
- [x] T053 [US7] Aplicar `Nuevo Cliente` y `Fecha de nacimiento` en `src/components/entity-form.js` y `src/components/entity-list.js`.
- [x] T054 [US7] Mantener claves internas estables (`chat`, `estado_comercial`, `motivo_perdida`) en `src/module-config.js`.

**Checkpoint**: US7 es funcional y verificable de forma aislada.

---

## Phase 8: User Story 8 - Declarar campos personalizados (Priority: P1)

**Goal**: Renderizar, validar, buscar y conservar campos configurados.

**Independent Test**: Declarar campos condicionales en `src/module-config.js` y verificar en `tests/integration/custom-fields.test.js` render, validación, búsqueda y conservación de valores retirados.

- [x] T055 [P] [US8a] Crear `tests/unit/field-rules.test.js` para visibilidad, obligatoriedad, `when` y `group`.
- [x] T056 [P] [US8b] Crear `tests/integration/orphan-fields.test.js` para valores ocultos pero conservados.
- [x] T057 [US8a] Renderizar campos personalizados en `src/components/entity-form.js` y `src/components/document-form.js`.
- [x] T058 [US8a] Aplicar reglas de visibilidad y obligatoriedad en `src/utils/field-rules.js`.
- [x] T059 [US8a] Mostrar campos personalizados en `src/components/entity-detail.js` y `src/components/document-list.js`.
- [x] T060 [US8a] Incluir solo campos visibles en `src/utils/search.js`.
- [x] T061 [US8b] Conservar valores huérfanos al guardar en `src/storage.js`.
- [x] T062 [US8b] Ocultar campos retirados en `src/components/entity-form.js`, `src/components/document-form.js` y `src/components/entity-detail.js`.
- [x] T063 [P] [US8a] Añadir pistas grises `Ej: 11.111.111-1` y por canal en `src/components/entity-form.js`.
- [x] T064 [US8a] Validar unicidad de claves de campos en `src/module-config.js`.

**Checkpoint**: US8 es funcional y verificable de forma aislada.

---

## Phase 9: User Story 14 - Marco de espacio de trabajo ERP con marca (Priority: P1)

**Goal**: Navegación filtrada por rango, iconos SVG uniformes y diseño responsive.

**Independent Test**: En `tests/integration/shell.test.js`, verificar cinco botones SVG, resaltado activo, colapso en 640 px y bloqueo de rutas no permitidas.

- [x] T065 [P] [US14a] Crear `tests/integration/shell.test.js` para navegación por rango y confirmación al salir con cambios.
- [x] T066 [P] [US14b] Crear `tests/integration/navigation-icons.test.js` para cinco iconos SVG monocromáticos y nombres accesibles.
- [x] T067 [US14a] Renderizar barra superior y lateral filtradas en `src/components/shell.js`.
- [x] T068 [US14b] Derivar logotipo y color de acento desde `src/module-config.js` con fallback en `src/styles.css`.
- [x] T069 [US14b] Aplicar fondo `#F8FAFC` y tarjetas `#FFFFFF` en `src/styles.css`.
- [x] T070 [US14a] Proteger navegación directa y Back/Forward en `src/app.js` con `assertPermission()`.
- [x] T071 [US14b] Implementar colapso de barra lateral en 640 px o menos en `src/components/shell.js`.
- [x] T072 [US14b] Verificar que no se usen emojis del sistema en `src/components/shell.js`.

**Checkpoint**: US14 es funcional y verificable de forma aislada.

---

## Phase 10: User Story 15 - Panel de inicio con acciones y estadísticas (Priority: P1)

**Goal**: Mostrar tres acciones rápidas, cinco tarjetas y embudo derivado.

**Independent Test**: En `tests/integration/dashboard.test.js`, comprobar exactamente tres acciones, cero botones de creación y recálculo sin recarga.

- [x] T073 [P] [US15a] Crear `tests/integration/dashboard.test.js` para tres acciones rápidas y permisos.
- [x] T074 [P] [US15b] Crear `tests/unit/dashboard-stats.test.js` para tarjetas y embudo por estados de documento.
- [x] T075 [US15a] Renderizar «Gestionar clientes», «Gestionar interacciones» y «Buscar registros» en `src/components/dashboard.js`.
- [x] T076 [US15a] Aplicar jerarquía visual con acción principal sólida y secundarias en blanco en `src/styles.css`.
- [x] T077 [US15b] Calcular cinco tarjetas en `src/utils/marketing-stats.js`.
- [x] T078 [US15b] Calcular pendientes con `statusLifecycle.pendingStates` o texto normalizado `pendiente` en `src/utils/marketing-stats.js`.
- [x] T079 [US15b] Excluir clientes archivados y «Cerrado perdido» de ventas, real mensual y pendientes en `src/utils/marketing-stats.js` y `src/utils/sales-team-metrics.js`.
- [x] T080 [US15b] Renderizar últimas interacciones y estados vacíos en `src/components/dashboard.js`.
- [x] T081 [US15a] Ocultar `.quick-actions` en Marketing mediante opción del renderizador en `src/components/dashboard.js`.

**Checkpoint**: US15 es funcional y verificable de forma aislada.

---

## Phase 11: User Story 22 - Iniciar sesión en modo demostración (Priority: P1)

**Goal**: Acceder directamente con un botón por usuario activo y conservar la sesión sin credenciales.

**Independent Test**: En `tests/integration/login.test.js`, verificar cuatro botones iniciales, usuarios creados detrás, usuarios desactivados sin botón, ausencia de campos/mensajes de contraseña y expiración a las 8 horas.

- [x] T082 [P] [US22a] Adaptar `tests/unit/auth.test.js` para `login(userId)`, usuarios activos, orden por `createdAt`, unicidad y expiración sin contraseña.
- [x] T083 [P] [US22a] Adaptar `tests/integration/login.test.js` a botones `data-action="login-user"` y `data-user-id`, sin `#login-form`, `#login-username` ni `#login-password`.
- [x] T084 [US22a] Reescribir `src/components/login.js` para renderizar la grilla centrada de dos columnas con etiquetas exactas «Gerente», «Marketing», «Ventas» y «Atención al Cliente».
- [x] T085 [US22a] Mostrar `username` de los usuarios creados por Gerencia detrás de los cuatro semilla en `src/components/login.js`.
- [x] T086 [US22a] Eliminar de `src/components/login.js` los mensajes `Ingresa una contraseña` y `Usuario no encontrado`.
- [x] T087 [US22a] Ajustar `src/auth.js`: `login(userId)` sin contraseña, sin `DEMO_PASSWORD`, sin `failedAttempts` ni `lockedUntil`.
- [x] T088 [US22a] Inicializar semilla `gerente`, `marketing`, `ventas` y `atencion` solo si `erp_users` no existe en `src/auth.js`.
- [x] T089 [US22b] Conservar sesión persistente, expiración por inactividad y revocación por desactivación en `src/auth.js`.
- [x] T090 [US22c] Mantener accesibles `?view=capture` y «Dudas y consultas» sin sesión en `src/app.js`.
- [x] T091 [US22b] Redirigir la vista solicitada tras pulsar un botón y conservar sesión en recarga y Back/Forward en `src/app.js`.

**Checkpoint**: US22 es funcional y verificable de forma aislada.

---

## Phase 12: User Story 23 - Acceso según rango (Priority: P1)

**Goal**: Aplicar la matriz en UI, rutas, datos y administración de usuarios sin editar permisos.

**Independent Test**: En `tests/integration/permissions.test.js`, comprobar denegaciones desde enlaces profundos y llamadas directas a `src/storage.js` con sesión íntegra.

- [x] T092 [P] [US23a] Crear `tests/integration/permissions.test.js` para matriz por rango y propiedad.
- [x] T093 [P] [US23c] Crear `tests/unit/storage-permissions.test.js` para denegación en llamadas directas.
- [x] T094 [US23a] Conectar `can()` y `assertPermission()` en `src/app.js`, `src/components/shell.js` y `src/components/dashboard.js`.
- [x] T095 [US23c] Verificar permisos antes de mutar en `addEntity()`, `updateEntity()`, `deleteEntity()`, `addDocument()`, `updateDocument()` y `deleteDocument()` en `src/storage.js`.
- [x] T096 [US23b] Crear `tests/integration/users-admin.test.js` para alta, edición, desactivación y unicidad sin contraseña.
- [x] T097 [US23b] Implementar `createUser()`, `updateUser()` y `deactivateUser()` sin contraseña en `src/auth.js`.
- [x] T098 [US23b] Mostrar «Gestionar usuarios» solo para Nivel 4 en `src/components/shell.js`.
- [x] T099 [US23b] Usar `usernameKey` único sin distinguir mayúsculas ni espacios en `src/auth.js`.
- [x] T100 [US23c] Resolver rango vigente desde `erp_users` en cada acción en `src/auth/permissions.js`.
- [x] T101 [US23a] Mantener `permissions:view` como contrato interno sin interfaz editable en `src/auth/permissions.js`.

**Checkpoint**: US23 es funcional y verificable de forma aislada.

---

## Phase 13: User Story 24 - Archivar, restaurar y eliminar clientes (Priority: P1)

**Goal**: Gestionar el ciclo de vida sin perder historial y bloquear bajas con registros.

**Independent Test**: En `tests/integration/client-lifecycle.test.js`, archivar/restaurar idempotentemente, bloquear baja con documentos, ofrecer archivar y excluir archivados de indicadores.

- [x] T102 [P] [US24a] Crear `tests/integration/client-lifecycle.test.js` para archivado, restauración e idempotencia.
- [x] T103 [P] [US24b] Crear `tests/unit/delete-guard.test.js` para `EntityHasRecordsError` y ausencia de mutación.
- [x] T104 [US24a] Persistir y eliminar `archivedAt` en `src/storage.js` conservando todos los documentos.
- [x] T105 [US24b] Rechazar `deleteEntity()` con documentos o registros vinculados en `src/storage.js`.
- [x] T106 [US24b] Mostrar confirmación explícita y ofrecer archivar en `src/components/entity-list.js`.
- [x] T107 [US24c] Separar «Activos» y «Archivados» en `src/utils/search.js` y `src/components/entity-list.js`.
- [x] T108 [US24c] Excluir clientes archivados de panel, resumen y Marketing en `src/utils/marketing-stats.js`.
- [x] T109 [US24a] Usar la acción canónica `entity:delete` para archivar, restaurar y eliminar en `src/storage.js`.
- [x] T110 [US24b] Sanitizar el mensaje de historial asociado en `src/components/entity-list.js`.

**Checkpoint**: US24 es funcional y verificable de forma aislada.

---

## Phase 14: User Story 2 - Registrar clientes y contactos comerciales (Priority: P2)

**Goal**: Capturar identidad, canal, ejecutivo y saneamiento de fichas heredadas.

**Independent Test**: En `tests/integration/client-registration.test.js`, registrar un cliente con RUT válido, canal WhatsApp, ejecutivo activo y corregir una ficha heredada bloqueada.

- [x] T111 [P] [US2a] Crear `tests/unit/rut.test.js` para `12345678-9` y `12.345.678-9`, dígito verificador y unicidad normalizada.
- [x] T112 [P] [US2b] Crear `tests/integration/contact-channel.test.js` para canales exactos y campo condicional.
- [x] T113 [P] [US2c] Crear `tests/integration/owner-assignment.test.js` para ejecutivos N2/N4 activos.
- [x] T114 [P] [US2d] Crear `tests/integration/blocked-client-edit.test.js` para fichas heredadas incompletas.
- [x] T115 [US2a] Generar `code` oculto y único en `src/storage.js`.
- [x] T116 [US2a] Ocultar `code`, `category`, `description` y `pedidos` del perfil cliente en `src/module-config.js`.
- [x] T117 [US2a] Validar RUT chileno y unicidad normalizada en `src/utils/field-formats.js`.
- [x] T118 [US2b] Exigir selección explícita de canal sin preselección en `src/components/entity-form.js`.
- [x] T119 [US2b] Guardar solo el valor del canal elegido en `src/components/entity-form.js`.
- [x] T120 [US2b] Validar formato del campo de contacto en `src/utils/field-formats.js`.
- [x] T121 [US2c] Poblar `ejecutivo_asignado` con usuarios activos N2/N4 en `src/components/entity-form.js`.
- [x] T122 [US2c] Conservar `assignedUserIdAtSale` al cerrar ventas en `src/storage.js`.
- [x] T123 [US2d] Bloquear ficha incompleta y enumerar campos faltantes en `src/components/entity-detail.js`.
- [x] T124 [US2d] Permitir editar y desbloquear solo con `entity:edit_own`/`entity:edit_any` en `src/app.js`.

**Checkpoint**: US2 es funcional y verificable de forma aislada.

---

## Phase 15: User Story 6 - Consultar indicadores de Gestión Comercial (Priority: P2)

**Goal**: Priorizar pendientes del equipo y abrir su detalle.

**Independent Test**: En `tests/integration/commercial-summary.test.js`, agrupar pendientes por cliente y abrir la ficha desde el resumen con permisos own/all.

- [x] T125 [P] [US6a] Crear `tests/integration/commercial-summary.test.js` para pendientes agrupados por cliente.
- [x] T126 [US6a] Implementar `computePendingByEntity()` en `src/utils/marketing-stats.js` usando estados configurados o texto normalizado.
- [x] T127 [US6b] Renderizar lista de pendientes en `src/components/commercial-summary.js`.
- [x] T128 [US6b] Abrir ficha completa desde el resumen en `src/app.js`.
- [x] T129 [US6b] Aplicar visibilidad own/all en `src/components/commercial-summary.js`.
- [x] T130 [US6a] Excluir archivados y «Cerrado perdido» de pendientes en `src/utils/marketing-stats.js`.

**Checkpoint**: US6 es funcional y verificable de forma aislada.

---

## Phase 16: User Story 9 - Buscar entidades rápidamente (Priority: P2)

**Goal**: Buscar por campos visibles con presupuesto de rendimiento.

**Independent Test**: Ejecutar `tests/performance/search-performance.test.js` con 500 entidades y 500 documentos: menos de 2 s, p95 ≤200 ms en escritorio y ≤500 ms en móvil.

- [x] T131 [P] [US9] Crear `tests/performance/search-performance.test.js` con 500 entidades y 500 documentos.
- [x] T132 [US9] Normalizar búsqueda sin tildes ni mayúsculas en `src/utils/search.js`.
- [x] T133 [US9] Excluir campos ocultos y retirados en `src/utils/search.js`.
- [x] T134 [US9] Calcular coincidencias en una sola pasada en `src/utils/search.js`.
- [x] T135 [US9] Mostrar `No se encontraron resultados.` en `src/components/search.js`.

**Checkpoint**: US9 es funcional y verificable de forma aislada.

---

## Phase 17: User Story 10 - Registrar fecha objetivo (Priority: P2)

**Goal**: Fecha opcional en base y fecha de nacimiento obligatoria en clientes.

**Independent Test**: En `tests/unit/entity-date.test.js`, validar rango `1910-01-01` hasta la fecha local actual y corregir fechas heredadas sin borrarlas.

- [x] T136 [P] [US10a] Crear `tests/unit/entity-date.test.js` para fecha opcional en perfiles base.
- [x] T137 [P] [US10b] Crear `tests/integration/birth-date.test.js` para rango y etiqueta visible.
- [x] T138 [US10a] Validar `YYYY-MM-DD` y `endDate >= startDate` en `src/utils/entity-date.js`.
- [x] T139 [US10b] Exigir fecha de nacimiento en `src/module-config.js` y `src/components/entity-form.js`.
- [x] T140 [US10b] Actualizar límite superior a medianoche local en `src/utils/entity-date.js`.
- [x] T141 [US10c] Conservar fechas heredadas inválidas hasta corrección en `src/storage.js`.
- [x] T142 [US10c] Mostrar fecha inválida y exigir corrección al guardar en `src/components/entity-form.js`.
- [x] T143 [US10b] Verificar pruebas automatizadas de validación de fecha exigidas por SC-012 en `tests/unit/entity-date.test.js`.

**Checkpoint**: US10 es funcional y verificable de forma aislada.

---

## Phase 18: User Story 11 - Registrar detalles de documentos (Priority: P2)

**Goal**: Capturar interacciones, cambiar estados por rango y exigir motivo en cierres perdidos de prospectos.

**Independent Test**: En `tests/integration/lost-reason.test.js`, guardar `Cerrado perdido` sin motivo debe fallar; con «Eligió competencia» debe persistir en el historial y no alterar ventas, pendientes ni real mensual.

- [x] T144 [P] [US11a] Crear `tests/integration/document-form.test.js` para campos obligatorios y permisos de creación.
- [x] T145 [P] [US11b] Crear `tests/unit/lost-reason.test.js` con opciones exactas `Precio alto`, `Eligió competencia`, `Sin presupuesto` y `No responde`.
- [x] T146 [P] [US11b] Crear `tests/integration/lost-reason.test.js` para prospecto, cliente convertido, historial y métricas.
- [x] T147 [US11a] Renderizar `interactionType`, importes y notas en `src/components/document-form.js`.
- [x] T148 [US11b] Crear `src/utils/lost-reason.js` con la regla pura derivada de `documentRules.lostReason`.
- [x] T149 [US11b] Ejecutar la regla en `validateDocumentData()` de `src/storage.js` antes de escribir.
- [x] T150 [US11b] Mostrar `motivo_perdida` solo si el documento pasa a `cerrado perdido` y la entidad tiene `estado_comercial = prospecto` en `src/components/document-form.js`.
- [x] T151 [US11b] Rechazar guardado sin motivo con `Completa los campos obligatorios.` en `src/storage.js` y `src/components/document-form.js`.
- [x] T152 [US11b] Mostrar el motivo elegido en el historial en `src/components/document-list.js`.
- [x] T153 [US11b] Reevaluar visibilidad y obligatoriedad al cambiar estado o cliente en `src/components/document-form.js`.
- [x] T154 [US11b] Verificar que `Cerrado perdido` no se añade a `pendingStates`, `ACTIVE_STATES` ni `WON_STATUS` en `src/module-config.js`, `src/utils/marketing-stats.js` y `src/utils/sales-team-metrics.js`.

**Checkpoint**: US11 es funcional y verificable de forma aislada.

---

## Phase 19: User Story 12 - Buscar entidades en pantalla dedicada (Priority: P2)

**Goal**: Ofrecer búsqueda sin acciones de creación o edición.

**Independent Test**: En `tests/integration/search-view.test.js`, abrir `Buscar`, buscar por campo visible y confirmar que no hay botones de alta, edición ni baja.

- [x] T155 [P] [US12] Crear `tests/integration/search-view.test.js` para ruta, resultados y ausencia de acciones de gestión.
- [x] T156 [US12] Registrar la ruta de búsqueda en `src/app.js` con `search:view`.
- [x] T157 [US12] Renderizar resultados con apertura de ficha rápida en `src/components/entity-list.js`.
- [x] T158 [US12] Ocultar acciones de creación, edición y baja en `src/components/search.js`.

**Checkpoint**: US12 es funcional y verificable de forma aislada.

---

## Phase 20: User Story 13 - Configurar ciclo de vida de estados (Priority: P2)

**Goal**: Declarar estados, transiciones y pendientes con fallback seguro.

**Independent Test**: En `tests/unit/status-lifecycle.test.js`, validar configuración, transiciones permitidas y denegación de estados desconocidos.

- [x] T159 [P] [US13a] Crear `tests/unit/status-lifecycle.test.js` para estados, transiciones y `pendingStates`.
- [x] T160 [US13a] Declarar `statusLifecycle.states` con `cerrado perdido` en `src/module-config.js`.
- [x] T161 [US13b] Validar transiciones en `isValidTransition()` de `src/storage.js`.
- [x] T162 [US13b] Aplicar transiciones desde `src/components/document-form.js` y `src/app.js`.
- [x] T163 [US13a] Proveer fallback ante configuración inválida en `src/module-config.js`.
- [x] T164 [US13b] Mostrar el estado vigente en `src/components/document-list.js`.
- [x] T165 [US13a] Normalizar `pendiente` cuando no haya `pendingStates` en `src/utils/marketing-stats.js`.

**Checkpoint**: US13 es funcional y verificable de forma aislada.

---

## Phase 21: User Story 16 - Capturar y convertir prospectos desde Marketing (Priority: P2)

**Goal**: Captura pública con consentimiento, automatización como `Sistema`, conversión sin pérdida y panel espejo.

**Independent Test**: En `tests/integration/marketing.test.js`, capturar con consentimiento, ejecutar regla, convertir prospecto conservando historial y comparar panel con Marketing.

- [x] T166 [P] [US16a] Crear `tests/integration/capture-form.test.js` para consentimiento, versión y fecha.
- [x] T167 [P] [US16b] Crear `tests/unit/marketing-automation.test.js` para reglas ejecutadas como `Sistema`.
- [x] T168 [P] [US16c] Crear `tests/integration/prospect-conversion.test.js` para conservar ID, documentos y campos.
- [x] T169 [P] [US16d] Crear `tests/integration/marketing-dashboard.test.js` para paridad de tarjetas, embudo y cinco atajos.
- [x] T170 [US16a] Renderizar `?view=capture` sin marco ERP en `src/components/capture-form.js`.
- [x] T171 [US16a] Exigir consentimiento y registrar `consentimiento_fecha`/`consentimiento_version` en `src/utils/capture-prospect.js`.
- [x] T172 [US16a] Crear entidad con `estado_comercial = Prospecto` en `src/storage.js`.
- [x] T173 [US16b] Ejecutar `runAutomationRules()` con `createdBy: 'Sistema'` en `src/utils/marketing-automation.js`.
- [x] T174 [US16b] Registrar ejecuciones como `Documento` en `src/storage.js`.
- [x] T175 [US16b] Ocultar estado comercial interno en Marketing en `src/components/marketing.js`.
- [x] T176 [US16c] Convertir prospecto conservando historial en `src/storage.js`.
- [x] T177 [US16d] Reutilizar tarjetas y embudo del panel en `src/components/marketing.js`.
- [x] T178 [US16d] Ordenar atajos exactamente: «Equipos de ventas y logros», «Campañas», «Rendimiento de campañas», «Dudas y consultas», «Redes sociales» en `src/components/marketing.js`.
- [x] T179 [US16d] Omitir `.quick-actions` en Marketing desde `src/components/dashboard.js`.
- [x] T180 [US16d] Renombrar «Chat» a «Dudas y consultas» manteniendo `data-section="chat"` en `src/components/marketing-chat.js`.

**Checkpoint**: US16 es funcional y verificable de forma aislada.

---

## Phase 22: User Story 17 - Consultar Equipos de ventas y logros (Priority: P2)

**Goal**: Administrar equipos e integrantes y calcular real/objetivo mensuales.

**Independent Test**: En `tests/integration/sales-teams.test.js`, crear equipo con integrante N2 activo y comparar real del mes con documentos `Cerrado ganado`.

- [x] T181 [P] [US17a] Crear `tests/integration/sales-teams.test.js` para alta, edición y baja de equipos.
- [x] T182 [P] [US17b] Crear `tests/unit/sales-team-metrics.test.js` para real y objetivo mensuales.
- [x] T183 [US17a] Declarar `salesTeams` en `src/module-config.js`.
- [x] T184 [US17a] Vincular integrantes a usuarios activos N2/N4 en `src/components/marketing.js`.
- [x] T185 [US17b] Calcular real mensual desde documentos `Cerrado ganado` del mes actual en `src/utils/sales-team-metrics.js`.
- [x] T186 [US17b] Calcular objetivo mensual sin persistir resultados derivados en `src/utils/sales-team-metrics.js`.
- [x] T187 [US17b] Renderizar tarjetas de equipo en `src/components/marketing.js`.

**Checkpoint**: US17 es funcional y verificable de forma aislada.

---

## Phase 23: User Story 18 - Registrar interacciones en redes sociales (Priority: P2)

**Goal**: Registrar y corregir interacciones de redes como documentos vinculados.

**Independent Test**: En `tests/integration/social-interactions.test.js`, registrar una interacción con consentimiento reutilizado, editarla, borrarla y conservar el vínculo con la entidad.

- [x] T188 [P] [US18a] Crear `tests/integration/social-interactions.test.js` para alta, edición y baja.
- [x] T189 [US18a] Declarar campos de redes en `src/module-config.js`.
- [x] T190 [US18a] Crear documentos vinculados en `src/utils/marketing-social.js`.
- [x] T191 [US18a] Reutilizar consentimiento existente en `src/utils/marketing-social.js`.
- [x] T192 [US18b] Mostrar historial de redes en `src/components/marketing-social.js`.
- [x] T193 [US18b] Corregir y eliminar interacciones con `document:edit_own`/`document:delete` en `src/storage.js`.
- [x] T194 [US18b] Sanitizar `enlace` y `nota` en `src/components/marketing-social.js`.

**Checkpoint**: US18 es funcional y verificable de forma aislada.

---

## Phase 24: User Story 19 - Ofrecer «Dudas y consultas» con respuestas rápidas (Priority: P2)

**Goal**: Responder FAQ y registrar consultas como documentos para seguimiento.

**Independent Test**: En `tests/integration/marketing-chat.test.js`, enviar consulta sin consentimiento debe fallar; con consentimiento debe responder o registrar y aparecer para Marketing/Atención.

- [x] T195 [P] [US19a] Crear `tests/integration/marketing-chat.test.js` para consentimiento, FAQ y registro.
- [x] T196 [P] [US19b] Crear `tests/integration/chat-followup.test.js` para seguimiento por Marketing y Atención.
- [x] T197 [US19a] Declarar `faq` y respuestas rápidas en `src/module-config.js`.
- [x] T198 [US19a] Exigir consentimiento y lanzar `ChatConsentError` en `src/utils/marketing-chat.js`.
- [x] T199 [US19a] Registrar consultas no resueltas como `Documento` en `src/storage.js`.
- [x] T200 [US19a] Mostrar `Consulta registrada; un ejecutivo hará seguimiento.` en `src/components/marketing-chat.js`.
- [x] T201 [US19b] Listar consultas en `src/components/marketing-chat.js`.
- [x] T202 [US19b] Permitir respuesta de Marketing/Atención sin ampliar permisos de edición general en `src/auth/permissions.js`.

**Checkpoint**: US19 es funcional y verificable de forma aislada.

---

## Phase 25: User Story 20 - Programar campañas internas (Priority: P2)

**Goal**: Crear, ejecutar y detener campañas internas con historial inmutable.

**Independent Test**: En `tests/integration/campaigns.test.js`, crear campaña por etapa/periodo, ejecutar acciones permitidas y detener conservando historial.

- [x] T203 [P] [US20a] Crear `tests/integration/campaigns.test.js` para programación y permisos.
- [x] T204 [P] [US20b] Crear `tests/unit/campaign-automation.test.js` para acciones internas y desempate por campaña más reciente.
- [x] T205 [US20a] Declarar `campaigns` en `src/module-config.js`.
- [x] T206 [US20a] Validar fechas, etapa objetivo y creador en `src/utils/marketing-campaigns.js`.
- [x] T207 [US20b] Restringir acciones a las declaradas en `src/module-config.js`.
- [x] T208 [US20b] Registrar cada ejecución como `Documento` en `src/storage.js`.
- [x] T209 [US20b] Aplicar precedencia de campaña más reciente en `src/utils/marketing-campaigns.js`.
- [x] T210 [US20c] Detener campaña conservando historial en `src/storage.js`.
- [x] T211 [US20c] Respetar `campaign:stop_own` y `campaign:stop_any` en `src/auth/permissions.js`.

**Checkpoint**: US20 es funcional y verificable de forma aislada.

---

## Phase 26: User Story 21 - Medir el rendimiento de Marketing (Priority: P2)

**Goal**: Mostrar indicadores globales y por campaña con atribución opcional.

**Independent Test**: En `tests/integration/marketing-performance.test.js`, verificar indicadores, `Sin campaña` y estado vacío `Sin registros para esta campaña.`

- [x] T212 [P] [US21a] Crear `tests/integration/marketing-performance.test.js` para indicadores globales.
- [x] T213 [P] [US21b] Crear `tests/unit/marketing-performance.test.js` para atribución y `Sin campaña`.
- [x] T214 [US21a] Calcular indicadores en `src/utils/marketing-performance.js`.
- [x] T215 [US21a] Mostrar estado vacío `Sin registros para esta campaña.` en `src/components/marketing.js`.
- [x] T216 [US21b] Filtrar por `campaignId` y `campaña` en `src/utils/marketing-performance.js`.
- [x] T217 [US21b] Agrupar registros sin campaña bajo `Sin campaña` en `src/utils/marketing-performance.js`.
- [x] T218 [US21a] Recalcular sin recarga tras mutaciones en `src/components/marketing.js`.

**Checkpoint**: US21 es funcional y verificable de forma aislada.

---

## Phase 27: User Story 25 - Registrar y gestionar tickets de Postventa (Priority: P2)

**Goal**: Gestionar tickets como documentos vinculados, con panel en línea, permisos, alertas y preselección desde clientes.

**Independent Test**: En `tests/integration/postventa.test.js`, crear ticket desde el panel con cliente preseleccionado desde la tabla, cambiar estados, ver tres tarjetas y confirmar denegaciones por rango.

- [x] T219 [P] [US25] Crear `tests/unit/postventa.test.js` para discriminador `ticket`, agregaciones y validaciones puras.
- [x] T220 [P] [US25] Crear `tests/integration/postventa.test.js` para panel en línea, permisos y tarjetas.
- [x] T221 [P] [US25] Crear `tests/integration/client-ticket-alerts.test.js` para «Ticket abierto» naranja, «Ticket en revisión» azul y coexistencia.
- [x] T222 [US25] Declarar bloque `postventa` con `states`, `categoryOptions`, `priorityOptions`, `cardMapping` y `resolutionNoteStates` en `src/module-config.js`.
- [x] T223 [US25] Implementar `listTicketDocuments()`, `createTicketDocument()` y `changeTicketStatus()` en `src/storage.js`.
- [x] T224 [US25] Verificar permisos `postventa:view`, `postventa:view_own`, `postventa:create` y `postventa:transition` en `src/storage.js`.
- [x] T225 [US25] Renderizar tres tarjetas y tabla en `src/components/postventa.js`.
- [x] T226 [US25] Implementar `renderTicketFormHtml()` con clientes buscables y sin preselección por defecto en `src/components/ticket-form.js`.
- [x] T227 [US25] Abrir el formulario como panel dentro de `?view=postventa` con `state.ticketFormOpen` en `src/app.js`.
- [x] T228 [US25] Preseleccionar `#ticket-client` desde `state.ticketValues.entity_id` al llegar desde «Abrir Ticket» en `src/components/ticket-form.js`.
- [x] T229 [US25] No crear documento al preseleccionar; crear solo en `ticket-save` en `src/app.js`.
- [x] T230 [US25] Exigir prioridad sin valor preseleccionado y nota de resolución solo en `Resuelto` en `src/components/ticket-form.js`.
- [x] T231 [US25] Confirmar cancelación con cambios sin guardar en `src/app.js`.
- [x] T232 [US25] Aplicar estilo de «Nuevo Cliente» con `.form-field`, `.client-form-section` y `.form-actions` en `src/styles.css`.
- [x] T233 [US25] Asegurar ausencia de `?view=ticket-form`, `window.open` y listener `storage` en `src/app.js`.
- [x] T234 [US25] Verificar que los tickets aparecen en la ficha del cliente y en la vista rápida permitida en `src/components/entity-detail.js` y `src/components/client-quick-view.js`.
- [x] T235 [US25] Verificar que `deleteEntity()` conserva tickets y bloquea la baja con registros en `src/storage.js`.
- [x] T236 [US25] Comprobar que `marketing` y visitante no ven alertas ni botón de apertura en `src/components/entity-list.js`.

**Checkpoint**: US25 es funcional y verificable de forma aislada.

---

## Phase 28: Polish & Cross-Cutting Concerns (incremento anterior)

**Purpose**: Consistencia, rendimiento, documentación y verificación del incremento previo.

- [x] T237 [P] Actualizar `specs/001-erp-base-module/plan.md` con cualquier desviación de implementación detectada.
- [x] T238 [P] Actualizar `specs/001-erp-base-module/data-model.md` si cambian campos o reglas de `motivo_perdida`.
- [x] T239 [P] Actualizar `specs/001-erp-base-module/contracts/auth.md` si cambia la forma de `login(userId)`.
- [x] T240 [P] Actualizar `specs/001-erp-base-module/contracts/client-ui.md` si cambian selectores o alertas.
- [x] T241 Verificar en `src/styles.css` que no se añadieron dependencias ni estilos duplicados por vista.
- [x] T242 Ejecutar `npm test` y corregir fallos en `tests/`.
- [x] T243 Ejecutar `npm run lint` y corregir avisos en `src/` y `tests/`.
- [x] T244 Ejecutar `npm run format:check` y aplicar formato a `src/`, `tests/` y `specs/001-erp-base-module/`.
- [x] T245 Ejecutar `npm run build` y confirmar que `dist/` se genera sin errores.
- [x] T246 Validar en `specs/001-erp-base-module/quickstart.md` los escenarios de login por botones, ficha rápida, alertas de ticket y cierre perdido, y marcar las tareas completadas en `specs/001-erp-base-module/tasks.md`.

---

## Phase 29: User Story 22d - Rediseñar el acceso y publicar el Portal del Cliente (Priority: P1)

**Goal**: Ofrecer una tarjeta de acceso con enlace al portal y dos formularios públicos que creen prospectos con cotización y tickets de soporte sin conceder sesión ni permisos internos.

**Independent Test**: En `tests/integration/login-card.test.js` y `tests/integration/client-portal.test.js`, verificar SC-045 y SC-044: tarjeta con dos columnas, color de acento con fallback, enlace discreto, ruta pública sin marco ERP, dos pestañas, mensajes exactos, sin mutación en envíos rechazados y reflejo inmediato al volver al CRM.

- [x] T247 [P] [US22d] Crear `tests/unit/customer-portal.test.js` para `findClientByEmailOrPhone()` que compare correo y teléfono en una sola pasada sobre los clientes almacenados, sin distinguir mayúsculas ni espacios, devuelva `null` sin coincidencia y, con varios coincidentes, use el primero por `createdAt`; y para `buildPortalTicketValues()` que exija «Correo del cliente», «Categoría» y «Descripción del problema», use `postventa.categoryOptions` y produzca `ticket: true`, `entity_id`, `asunto`, `categoria`, `notes`, `status = 'Abierto'`, `prioridad = 'media'` y sin `createdByUserId`.
- [x] T248 [P] [US22d] Crear `tests/integration/login-card.test.js` para comprobar en `src/components/login.js` una `.login-card` centrada de dos columnas, el enlace discreto «Portal del Cliente» por debajo de los botones, la paleta azul/gris oscuro, `theme.accentColor` aplicado a botones y resaltados con fallback y advertencia, y la ausencia de «Usuario», «Contraseña», `Ingresa una contraseña` y `Usuario no encontrado`.
- [x] T249 [P] [US22d] Crear `tests/integration/client-portal.test.js` para `?view=client-portal` sin sesión ni marco ERP: dos pestañas exactas «Solicitar cotización» y «Soporte Postventa», campos y orden exactos, mensajes `Completa los campos obligatorios.`, `No encontramos un cliente con ese correo o teléfono.`, `Solicitud registrada correctamente.` y `Ticket registrado correctamente.`, ausencia de mutación en envíos rechazados, creación de prospecto/cotización y ticket público, reflejo inmediato en Marketing/Postventa/ficha, y descarto de pestaña y borrador al recargar.
- [x] T250 [US22d] Registrar `client-portal` en `ROUTE_VIEWS` y `VIEW_ROUTES` de `src/app.js`, añadir `state.portalTab` con solo `quote` o `support`, resolver `?view=client-portal` desde `location.search` en carga, recarga y Back/Forward como ruta pública, y renderizar `src/components/client-portal.js` sin `shell`, sin redirección por sesión y sin persistencia en `localStorage`.
- [x] T251 [P] [US22d] Añadir en `src/styles.css` tokens y estilos de `.login-card`, grilla de dos columnas, paleta base azul/gris oscuro, aplicación de `theme.accentColor` a botones y resaltados con fallback al color integrado y advertencia de configuración, sin dependencias nuevas ni clave nueva de `localStorage`.
- [x] T252 [US22d] Envolver en `.login-card` la grilla existente en `src/components/login.js`, conservar los botones semilla y los creados por Gerencia, y añadir debajo el enlace discreto «Portal del Cliente» hacia `?view=client-portal` sin competir visualmente con los botones de acceso.
- [x] T253 [US22d] Crear `src/utils/customer-portal.js` con `findClientByEmailOrPhone()` y `buildPortalTicketValues()`: comparar correo y teléfono en una sola pasada sin distinguir mayúsculas ni espacios, elegir el primero por `createdAt`, mostrar las etiquetas configuradas de `postventa.categoryOptions`, guardar el `value` configurado, sanitizar texto con `escapeHtml()` y derivar `asunto`, `notes`, `status = 'Abierto'` y `prioridad = 'media'`.
- [x] T254 [US22d] Añadir `createPortalTicketDocument(values)` en `src/storage.js`: validar «Correo del cliente», «Categoría» y «Descripción del problema» y la coincidencia de cliente, no mutar ante fallos, no llamar a `assertPermission()` ni añadir acción canónica, crear un `Documento` con `ticket: true`, `entity_id` del cliente, `asunto`, `categoria`, `notes`, `status = 'Abierto'`, `prioridad = 'media'`, marcas de tiempo y sin `createdByUserId`.
- [x] T255 [P] [US22d] Declarar en `src/module-config.js` el campo `empresa` en `customFields.entity`, los campos `servicio_interes` y `monto_estimado` en `customFields.document`, y ampliar `marketing.captureFields` con `empresa` para que la cotización persista `name`, `contacto_correo`, `contacto_telefono`, `empresa`, `servicio_interes` y `monto_estimado` conservando la validación de consentimiento de FR-071.
- [x] T256 [US22d] Crear `src/components/client-portal.js` con exactamente dos pestañas y los campos visibles en orden «Nombre», «Empresa», «Correo», «Teléfono», «Servicio de interés» con monto estimado y consentimiento, y «Correo del cliente», «Categoría» y «Descripción del problema»; usar etiquetas y categorías configuradas, sin marco ERP, campos de usuario/contraseña ni sesión, y mantener los borradores solo en el formulario hasta el envío.
- [x] T257 [US22d] Cablear en `src/app.js` y `src/components/client-portal.js` el envío de «Solicitar cotización» a `createProspectFromCapture()` y `addDocument()`: sin consentimiento o con cualquier casilla vacía mostrar `Completa los campos obligatorios.` y no crear registros; con datos válidos mostrar `Solicitud registrada correctamente.`, crear prospecto con `estado_comercial = 'prospecto'`, consentimiento fechado y versionado, y documento vinculado con `servicio_interes` y `monto_estimado`, sin ticket, sesión ni cambio a `ganado`.
- [x] T258 [US22d] Cablear en `src/app.js` y `src/components/client-portal.js` el envío de «Soporte Postventa» a `findClientByEmailOrPhone()` y `createPortalTicketDocument()`: sin coincidencia mostrar `No encontramos un cliente con ese correo o teléfono.` sin crear Ticket, Entidad ni modificar registros; con coincidencia mostrar `Ticket registrado correctamente.` y crear el ticket `Abierto`/`Media` vinculado al cliente.
- [x] T259 [US22d] Verificar en `src/components/marketing.js`, `src/components/postventa.js`, `src/components/entity-detail.js` y `src/components/entity-list.js` que los registros del portal aparecen al volver al CRM sin recarga, `StorageEvent`, `postMessage`, sondeo ni contadores derivados, y que el siguiente `render()` lee los arreglos ya cargados desde `src/storage.js`.
- [x] T260 [US22d] Confirmar en `src/auth/permissions.js`, `src/auth.js` y `src/storage.js` que el portal no añade acciones al catálogo canónico ni concede `postventa:view`, `postventa:view_own`, `postventa:create` o `postventa:transition` al visitante; `?view=postventa` y `createTicketDocument()` siguen denegados sin sesión con «Acceso denegado» o `No tienes permiso para realizar esta acción`, y las alertas siguen filtradas por `can()`.

**Checkpoint**: US22d es funcional y verificable de forma aislada; las tasas de cotización y soporte son visibles en CRM sin permisos nuevos.

---

## Phase 30: Polish & Cross-Cutting Concerns (incremento actual)

**Purpose**: Cerrar quality gates, documentación y validación manual del Portal del Cliente.

- [x] T261 [P] Actualizar `specs/001-erp-base-module/contracts/customer-portal.md`, `contracts/auth.md`, `contracts/entity-storage.md`, `contracts/marketing.md`, `contracts/postventa.md`, `data-model.md`, `plan.md` y `quickstart.md` si la implementación introduce desviaciones en campos, mensajes, rutas, permisos o estados del portal.
- [x] T262 Ejecutar `npm test` y corregir fallos en `tests/unit/customer-portal.test.js`, `tests/integration/login-card.test.js`, `tests/integration/client-portal.test.js` y cualquier regresión en `tests/`.
- [x] T263 Ejecutar `npm run lint` y corregir avisos en `src/components/login.js`, `src/components/client-portal.js`, `src/utils/customer-portal.js`, `src/app.js`, `src/storage.js`, `src/module-config.js`, `src/styles.css` y `tests/`.
- [x] T264 Ejecutar `npm run format:check` y aplicar formato a `src/`, `tests/` y `specs/001-erp-base-module/`.
- [x] T265 Ejecutar `npm run build` y confirmar que `dist/` se genera sin errores con la nueva ruta pública.
- [x] T266 Validar en `specs/001-erp-base-module/quickstart.md` los escenarios de tarjeta de acceso, fallback del color de acento, cotización, soporte, denegación visitante y actualización inmediata, y marcar las tareas completadas en `specs/001-erp-base-module/tasks.md`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias; puede iniciar de inmediato.
- **Foundational (Phase 2)**: Depende de Setup; bloquea todas las historias de usuario.
- **User Stories (Phase 3+)**: Dependen de Foundational; pueden ejecutarse en paralelo si hay capacidad.
- **Polish anterior (Phase 28)**: Depende de las historias entregadas en el incremento previo; ya está completado.
- **User Story 22d (Phase 29)**: Depende de Foundational y de las convenciones de `US22`, `US23`, `US5`, `US16` y `US25`; puede ejecutarse en paralelo con otras historias ya completadas.
- **Polish actual (Phase 30)**: Depende de Phase 29 y de la verificación de regresión de todo el módulo.

### User Story Dependencies

- **US1 (P1)**: Base de datos; puede iniciar tras Foundational y facilita US4, US11 y US25.
- **US3 (P1)**: Depende de búsqueda y ficha; comparte componentes con US4 y US25.
- **US4 (P1)**: Depende de US1 y US3 para gestión, baja segura, vista rápida y alertas.
- **US5/US7/US8 (P1)**: Configuración transversal; deben preceder a US2, US11 y US16.
- **US14/US15 (P1)**: Marco y panel; independientes entre sí tras Foundational.
- **US22/US23 (P1)**: Autenticación y permisos; bloquean la verificación de cualquier historia con control por rango.
- **US22d (P1)**: Depende de US5 para campos y tema, US16 para `createProspectFromCapture()` y US25 para `postventa.categoryOptions`/`createTicketDocument()`; reutiliza la ruta pública de US22c sin modificar US23.
- **US24 (P1)**: Depende de US1 y US4 para baja sin cascada y filtros.
- **US2, US6, US9, US10, US11, US12, US13 (P2)**: Pueden iniciar tras P1; US11 depende de US5 y US13.
- **US16–US21 (P2)**: Dependen de configuración Marketing y permisos; US21 depende de US20 y US16.
- **US25 (P2)**: Depende de US4, US11 y US23 para tickets, permisos y preselección.

### Within Each User Story

1. Escribir primero las pruebas marcadas como `[P]`; deben fallar antes de la implementación.
2. Implementar utilidades puras y modelos antes de componentes.
3. Integrar componentes y cablear acciones en `src/app.js`.
4. Verificar el criterio independiente antes de pasar a la siguiente prioridad.

### Parallel Opportunities

- Todas las tareas `[P]` de Setup y Foundational pueden ejecutarse en paralelo.
- Las suites de prueba de cada historia pueden ejecutarse en paralelo entre sí.
- Las historias P1 pueden trabajarse en paralelo tras Foundational, salvo las dependencias explícitas.
- Las utilidades puras (`lost-reason.js`, `postventa.js`, `marketing-stats.js`, `sales-team-metrics.js`, `customer-portal.js`) pueden implementarse en paralelo.
- Los contratos y documentación de Phase 28 y Phase 30 pueden actualizarse en paralelo.
- En Phase 29, T247, T248, T249, T251 y T255 pueden ejecutarse en paralelo; T252 depende de T251, T253 de T247 y T256 de T250/T253/T255.

---

## Parallel Example: User Story 11

```bash
# Ejecutar juntas las pruebas de cierre perdido:
Task: "T145 [P] [US11b] Crear tests/unit/lost-reason.test.js"
Task: "T146 [P] [US11b] Crear tests/integration/lost-reason.test.js"

# Ejecutar juntas las utilidades puras:
Task: "T148 [US11b] Crear src/utils/lost-reason.js"
Task: "T149 [US11b] Conectar la regla en validateDocumentData() de src/storage.js"
```

---

## Parallel Example: User Story 22d

```bash
# Ejecutar juntas las pruebas y la configuración de la tarjeta:
Task: "T247 [P] [US22d] Crear tests/unit/customer-portal.test.js"
Task: "T248 [P] [US22d] Crear tests/integration/login-card.test.js"
Task: "T249 [P] [US22d] Crear tests/integration/client-portal.test.js"
Task: "T251 [P] [US22d] Añadir estilos de .login-card en src/styles.css"
Task: "T255 [P] [US22d] Declarar campos del portal en src/module-config.js"

# Ejecutar juntas las utilidades y la ruta una vez disponibles:
Task: "T250 [US22d] Registrar ?view=client-portal en src/app.js"
Task: "T253 [US22d] Crear src/utils/customer-portal.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup.
2. Completar Phase 2: Foundational.
3. Completar Phase 3: US1.
4. **DETENER Y VALIDAR** con `tests/integration/entity-document.test.js`.
5. Mostrar la relación entidad-documento y la baja bloqueada como primer incremento demostrable.

### Incremental Delivery

1. Setup + Foundational → base lista.
2. US1 → integridad referencial (MVP).
3. US3 + US4 → consulta y gestión.
4. US5 + US7 + US8 + US14 + US15 → configuración, marco y panel.
5. US22 + US23 + US24 → acceso, permisos y ciclo de vida del cliente.
6. Historias P2 en orden, con US11 y US25 como cierres funcionales del CRM y Postventa.
7. US22d → acceso rediseñado, portal público, cotizaciones y tickets sin permisos nuevos.
8. Polish → documentación, quality gates y despliegue.

### Parallel Team Strategy

1. El equipo completa Setup y Foundational juntos.
2. Tras Foundational:
   - Desarrollador A: US1, US4, US24.
   - Desarrollador B: US3, US25.
   - Desarrollador C: US5, US7, US8, US11.
   - Desarrollador D: US22, US23.
   - Desarrollador E: US16–US21.
   - Desarrollador F: US22d y integración con US22/US23.
3. Cada historia se valida de forma independiente antes de integrarse.

---

## Notes

- `[P]` significa archivos distintos y sin dependencias incompletas.
- `[Story]` garantiza trazabilidad con `spec.md`.
- Cada historia debe poder completarse y probarse de forma independiente.
- Las pruebas deben fallar antes de la implementación.
- No usar `?view=ticket-form`, `window.open` ni listener `storage` para Postventa.
- El Portal del Cliente no inicia sesión, no muestra marco ERP, no persiste borradores ni concede `postventa:*` al visitante.
- Las cotizaciones no son tickets y los tickets públicos no crean permisos, usuarios ni `createdByUserId` interno.
- No reintroducir contraseñas, hash, bloqueo por intentos ni borrado en cascada.
- Verificar siempre mensajes exactos y opciones exactas de `spec.md` y `contracts/`.
