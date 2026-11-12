# Tareas: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

**Entrada**: Documentos de diseño desde `/specs/001-erp-base-module/`
**Prerrequisitos**: plan.md (obligatorio), spec.md (obligatorio para las historias de usuario), research.md, data-model.md, contracts/, quickstart.md
**Aclaraciones aplicadas**: sesión 2026-11-01 (código único, estado de texto libre, fallback con advertencia, retención de campos huérfanos, confirmación de eliminación) y sesión 2026-11-12 (identificación de documentos pendientes sin ciclo de vida; campos base de documento)

**Pruebas**: Incluidas porque la Constitución (Principio II) exige cobertura automatizada del comportamiento visible y de la lógica de negocio. La suite base ya existe en `tests/unit/` y `tests/integration/`; las tareas de prueba amplían esa suite para cubrir huecos, no la duplican.

**Organización**: Las tareas se agrupan por historia de usuario para permitir implementación y prueba independientes. Las fases están ordenadas de modo que cada historia se implementa después de las historias de las que depende.

## Formato: `[ID] [P?] [Historia] Descripción`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Historia]**: Historia de usuario a la que pertenece la tarea (US1, US2, ...)
- Cada tarea incluye la ruta de archivo exacta

## Convenciones de Rutas

- Proyecto único: `index.html`, `src/`, `tests/` en la raíz del repositorio
- Pruebas unitarias en `tests/unit/`; integración en `tests/integration/`
- Componentes de interfaz en `src/components/`; utilidades en `src/utils/`

---

## Fase 1: Configuración (Infraestructura Compartida)

**Propósito**: Inicializar la aplicación Vite, el documento raíz y los estilos base.

- [X] T001 Crear `index.html` con el marco del espacio de trabajo (barra superior, barra lateral y contenedor de contenido) y las cuatro regiones de pantalla `#view-dashboard`, `#view-entities`, `#view-documents` y `#view-search`, incluyendo los identificadores que consumen las pruebas en `tests/integration/`
- [X] T002 [P] Verificar y ajustar scripts `dev`, `build`, `preview` y `test`, además del entorno jsdom de Vitest, en `package.json` y `vitest.config.mjs`
- [X] T003 [P] Crear el punto de entrada de la aplicación que importa los estilos y arranca el módulo en `src/main.js`
- [X] T004 [P] Definir los tokens de diseño (incluida `--accent`), la tipografía base, el layout de dos columnas y los estilos compartidos de formularios y botones en `src/styles.css`

---

## Fase 2: Fundacional (Prerrequisitos Bloqueantes)

**Propósito**: Infraestructura de almacenamiento, saneamiento, búsqueda y navegación de la que dependen todas las historias.

**CRÍTICO**: Ninguna historia de usuario puede comenzar hasta completar esta fase.

- [X] T005 [P] Definir las claves de localStorage y los ayudantes de lectura/escritura de listas y `clearAll()` en `src/storage.js`
- [X] T006 Implementar en `src/storage.js` la generación de `id` y `entity_id` únicos, las marcas de tiempo `createdAt`/`updatedAt` y la carga/guardado de entidades y documentos
- [X] T007 [P] Implementar el saneamiento de texto introducido por el usuario para prevenir XSS (`escapeHtml`) en `src/utils/sanitize.js`
- [X] T008 [P] Implementar la normalización de texto para búsqueda (minúsculas, sin tildes ni espacios redundantes) y la coincidencia por campos en `src/utils/search.js`
- [X] T009 Implementar el enrutador interno de vistas (`showView`, ocultamiento de las demás, resaltado del módulo activo con `aria-current="page"`) y las exportaciones `boot`/`initApp` en `src/app.js`
- [X] T010 Implementar en `src/app.js` los ayudantes compartidos de validación visual: mostrar/limpiar errores por campo, enfocar el primer campo inválido y retroalimentación de éxito

**Punto de control**: La base está lista; las historias pueden comenzar.

---

## Fase 3: Historia de Usuario 5 - Definir un perfil de configuración del módulo (Prioridad: P1)

**Objetivo**: Cargar `src/module-config.js` con valores predeterminados seguros, validación completa y fallback con advertencia visible ante configuración inválida.

**Prueba Independiente**: Una configuración de Ventas se presenta en la aplicación; sin configuración se usan los valores predeterminados; una configuración inválida arranca con predeterminados y muestra una advertencia visible.

### Pruebas para la Historia de Usuario 5

- [X] T011 [P] [US5] Ampliar las pruebas de fallback, tipos de campo, colisiones, ciclo de vida y tema en `tests/unit/module-config.test.js`
- [X] T012 [P] [US5] Añadir una prueba de integración que verifique la advertencia visible y el arranque con predeterminados ante configuración inválida en `tests/integration/config-warning.test.js`

### Implementación para la Historia de Usuario 5

- [X] T013 [US5] Definir `DEFAULT_CONFIG`, `BASE_FIELDS` y `FIELD_TYPES` en `src/module-config.js`
- [X] T014 [US5] Implementar `normalizeConfig` con validación de `moduleName`, `labels`, `customFields` (tipo, colisión con campos base, duplicados, `options` en select), `statusLifecycle` y `theme.accentColor` en `src/module-config.js`
- [X] T015 [US5] Implementar `loadModuleConfig`, `setActiveConfig`, `getConfig` y `labelFor` con retroceso a Entidad/Documento en `src/module-config.js`
- [X] T016 [US5] Renderizar una advertencia visible y no bloqueante cuando la configuración sea inválida en `index.html` y `src/app.js`
- [X] T017 [P] [US5] Dar estilo al aviso de configuración inválida en `src/styles.css`

**Punto de control**: La configuración se carga de forma fiable, valida limpiamente y nunca bloquea la aplicación.

---

## Fase 4: Historia de Usuario 1 - Definir datos compatibles con el ERP (Prioridad: P1)

**Objetivo**: Establecer el modelo de entidad con identificador público único, validación de `code` único y creación persistente.

**Prueba Independiente**: Un analista registra una entidad de prueba, el sistema la guarda con `entity_id` único y rechaza un `code` repetido con un mensaje claro.

### Pruebas para la Historia de Usuario 1

- [X] T018 [P] [US1] Ampliar las pruebas unitarias de validación, generación de `entity_id` y rechazo de `code` duplicado (sin distinguir mayúsculas ni espacios) en `tests/unit/storage.test.js`
- [X] T019 [P] [US1] Ampliar la prueba de integración para rechazar un `code` duplicado con explicación en `tests/integration/create-entity.test.js`

### Implementación para la Historia de Usuario 1

- [X] T020 [US1] Implementar `validateEntity` con nombre y código obligatorios, recorte de textos base y validación genérica de campos personalizados (p. ej. formato de correo y `creditLimit` no negativo cuando el módulo los declare) en `src/storage.js`
- [X] T021 [US1] Implementar `addEntity`, `updateEntity` y `deleteEntity` preservando `id`/`entity_id`, actualizando `updatedAt` y aplicando unicidad de `code` en `src/storage.js`
- [X] T022 [P] [US1] Construir los campos base del formulario de entidad con sus identificadores y zonas de error en `src/components/entity-form.js`
- [X] T023 [US1] Conectar el envío del formulario de entidad con creación/actualización y retroalimentación de validación en `src/app.js`
- [X] T024 [US1] Poblar el selector `#edit-entity` con los registros almacenados y limpiar el formulario tras guardar en `src/app.js`
- [X] T025 [P] [US1] Dar estilo a los campos, errores y estados de foco del formulario de entidad en `src/styles.css`

**Punto de control**: La Historia de Usuario 1 funciona y se prueba de forma independiente (MVP).

---

## Fase 5: Historia de Usuario 11 - Registrar los detalles de documentos de una entidad (Prioridad: P2)

**Objetivo**: Permitir registrar, editar y eliminar documentos de una entidad con integridad referencial y eliminación en cascada.

**Prueba Independiente**: Un usuario añade un documento a una entidad y lo ve asociado; editar y eliminar funcionan; eliminar la entidad elimina sus documentos.

### Pruebas para la Historia de Usuario 11

- [X] T026 [P] [US11] Ampliar las pruebas unitarias de validación de documentos (fechas ordenadas, `notes`), campos personalizados y cascada en `tests/unit/storage.test.js`
- [X] T027 [P] [US11] Ampliar las pruebas de integración de crear, editar, eliminar y cascada de documentos en `tests/integration/add-document.test.js` y `tests/integration/manage-document.test.js`

### Implementación para la Historia de Usuario 11

- [X] T028 [US11] Implementar `validateDocument` con `entity_id` existente, `startDate`/`endDate` válidas y ordenadas, `notes` opcional y validación genérica de campos personalizados (p. ej. `folio` entero positivo y `discount` no mayor que `subtotal` cuando el módulo los declare) en `src/storage.js`
- [X] T029 [US11] Implementar `addDocument`, `updateDocument`, `deleteDocument` y `deleteDocumentsForEntity`, y la cascada desde `deleteEntity`, en `src/storage.js`
- [X] T030 [P] [US11] Construir los campos base del formulario de documento (`startDate`, `endDate`, `notes`, `status`) y los campos personalizados declarados (p. ej. serie, folio, importes, moneda, condiciones) en `src/components/document-form.js`
- [X] T031 [US11] Conectar crear, editar y eliminar documentos con retroalimentación de validación en `src/app.js`
- [X] T032 [US11] Poblar el selector de entidad del documento y el selector `#edit-document`, mostrando los documentos de la entidad seleccionada, en `src/app.js`
- [X] T033 [P] [US11] Dar estilo al formulario y al listado de documentos en `src/styles.css`

**Punto de control**: Datos maestros y documentos transaccionales están completamente vinculados.

---

## Fase 6: Historia de Usuario 2 - Registrar clientes y contactos comerciales (Prioridad: P2)

**Objetivo**: Registrar entidades y sus documentos/interacciones desde la interfaz, con validación clara.

**Prueba Independiente**: Un ejecutivo registra una entidad y un documento asociado; ambos quedan guardados y visibles en la ficha de la entidad.

### Pruebas para la Historia de Usuario 2

- [X] T034 [P] [US2] Añadir una prueba de integración de registro de entidad con documento asociado visible en su ficha en `tests/integration/register-client.test.js`

### Implementación para la Historia de Usuario 2

- [X] T035 [US2] Renderizar en `src/app.js` los registros guardados en los selectores de edición y los documentos vinculados en la ficha de la entidad
- [X] T036 [US2] Unificar la retroalimentación de campos obligatorios y códigos repetidos entre ambos formularios en `src/app.js`
- [X] T037 [US2] Asociar cada documento al `entity_id` seleccionado al guardar y refrescar la vista tras el cambio en `src/app.js`
- [X] T038 [P] [US2] Dar estilo a la ficha y a la lista de documentos vinculados en `src/styles.css`

**Punto de control**: Registrar entidades y contactos funciona de extremo a extremo.

---

## Fase 7: Historia de Usuario 7 - Reetiquetar pantallas desde la configuración (Prioridad: P1)

**Objetivo**: Derivar todas las etiquetas visibles de la configuración del módulo.

**Prueba Independiente**: Con Entidad→Cliente y Documento→Pedido de Venta, todas las pestañas, botones, etiquetas, encabezados y estados vacíos usan los términos mapeados sin alterar la navegación.

### Pruebas para la Historia de Usuario 7

- [X] T039 [P] [US7] Ampliar las pruebas de etiquetado en todas las pantallas y en `document.title` en `tests/integration/relabeling.test.js`

### Implementación para la Historia de Usuario 7

- [X] T040 [US7] Sustituir el texto fijo por `labelFor` en `index.html`, `src/app.js` y `src/components/`
- [X] T041 [US7] Aplicar los términos configurados a encabezados, botones, etiquetas de formulario, mensajes y estados vacíos en `src/app.js` y `src/components/`
- [X] T042 [US7] Actualizar `document.title`, `#brand-name` y los botones de la barra lateral desde la configuración en `src/app.js` y `src/components/shell.js`

**Punto de control**: Un módulo configurado se presenta completamente bajo su propia terminología.

---

## Fase 8: Historia de Usuario 8 - Declarar campos personalizados para los registros (Prioridad: P1)

**Objetivo**: Hacer que los campos personalizados fluyan por formularios, validación, persistencia, listas y búsqueda, conservando los valores huérfanos.

**Prueba Independiente**: Un campo numérico obligatorio se renderiza como entrada numérica, bloquea guardados en blanco, aparece en listas y coincide en búsquedas; al retirarlo de la configuración sus valores se conservan ocultos y reaparecen al redeclararlo.

### Pruebas para la Historia de Usuario 8

- [X] T043 [P] [US8] Ampliar las pruebas unitarias de validación por tipo, opciones de select y retención de valores huérfanos en `tests/unit/storage.test.js`
- [X] T044 [P] [US8] Ampliar las pruebas de integración de renderizado, búsqueda y ocultación/restauración de campos personalizados en `tests/integration/custom-fields.test.js`

### Implementación para la Historia de Usuario 8

- [X] T045 [US8] Renderizar dinámicamente los campos personalizados según su tipo (`text`, `number`, `date`, `select`) en `src/components/entity-form.js` y `src/components/document-form.js`
- [X] T046 [US8] Validar campos personalizados obligatorios, de tipo correcto y con opciones válidas en `src/storage.js`
- [X] T047 [US8] Persistir los valores personalizados junto a los campos base sin cambios de esquema en `src/storage.js`
- [X] T048 [US8] Mostrar los valores personalizados con su etiqueta en listas, ficha y resultados de búsqueda en `src/app.js`
- [X] T049 [US8] Conservar en el almacenamiento los valores no declarados, ocultarlos de la interfaz y restaurarlos al redeclarar el campo en `src/storage.js` y `src/app.js`
- [X] T050 [P] [US8] Dar estilo a los bloques de campos personalizados y a sus errores en `src/styles.css`

**Punto de control**: Los datos específicos del módulo requieren cero cambios de código de interfaz y no se pierden al evolucionar la configuración.

---

## Fase 9: Historias de Usuario 14 y 15 - Marco de espacio de trabajo ERP con marca y panel de inicio (Prioridad: P1)

**Objetivo**: Envolver cada pantalla en un marco persistente con barra superior, logotipo derivado, barra lateral con módulo activo resaltado y panel de inicio con acciones rápidas y estadísticas.

**Prueba Independiente**: En cada pantalla se ven la barra superior con logotipo y nombre del módulo, la barra lateral con Panel/Entidades/Documentos/Buscar, el módulo activo resaltado, la contracción en ventanas estrechas y la conservación de datos al navegar; el panel muestra cuatro acciones rápidas y estadísticas en vivo.

### Pruebas para las Historias de Usuario 14 y 15

- [X] T051 [P] [US14] Ampliar las pruebas del marco, logotipo, resaltado activo, color de acento y conservación de datos en `tests/integration/workspace-shell.test.js`
- [X] T052 [P] [US15] Ampliar las pruebas del panel, acciones rápidas y estadísticas en vivo en `tests/integration/dashboard.test.js`

### Implementación para las Historias de Usuario 14 y 15

- [X] T053 [US14] Implementar `src/components/shell.js` con monograma SVG derivado del nombre del módulo, nombre de marca, botones de módulo etiquetados y resaltado del módulo activo
- [X] T054 [P] [US15] Implementar `src/components/dashboard.js` con las cuatro acciones rápidas y las tarjetas de estadísticas de entidades/documentos
- [X] T055 [US14] Aplicar `theme.accentColor` como propiedad CSS `--accent` con retroceso al valor predeterminado si es inválido en `src/app.js`
- [X] T056 [US15] Conectar las acciones rápidas para abrir gestión con formulario limpio, enfocar el primer campo y abrir la búsqueda con entrada enfocada en `src/app.js`
- [X] T057 [US15] Refrescar los recuentos de estadísticas cada vez que se muestra el panel en `src/components/dashboard.js`
- [X] T058 [US14] Verificar que la navegación entre módulos conserva entidades y documentos y no reinicia formularios de forma destructiva en `src/app.js`
- [X] T059 [P] [US14] Dar estilo a la barra superior, la barra lateral, las tarjetas del panel y la contracción a columna de iconos con etiquetas accesibles en `src/styles.css`

**Punto de control**: Todas las pantallas se renderizan dentro del marco con marca y el panel funciona como vista inicial.

---

## Fase 10: Historia de Usuario 9 - Buscar y encontrar entidades rápidamente (Prioridad: P2)

**Objetivo**: Buscar y filtrar entidades por detalles clave sobre los registros almacenados.

**Prueba Independiente**: Un usuario introduce un término y ve solo las entidades coincidentes; sin coincidencias ve un estado vacío claro y puede reintentar.

### Pruebas para la Historia de Usuario 9

- [X] T060 [P] [US9] Ampliar las pruebas unitarias de normalización y coincidencia por nombre, código, categoría, descripción, fecha objetivo y campos personalizados en `tests/unit/storage.test.js`
- [X] T061 [P] [US9] Ampliar las pruebas de integración de coincidencias, estado vacío y rendimiento con 500 registros en `tests/integration/search-entities.test.js`

### Implementación para la Historia de Usuario 9

- [X] T062 [US9] Implementar `searchEntities` con normalización y coincidencia sobre todos los campos declarados en `src/storage.js`
- [X] T063 [US9] Conectar la entrada de búsqueda con resultados y estado vacío en `src/app.js`
- [X] T064 [US9] Mantener los resultados sincronizados tras crear, editar o eliminar en `src/app.js`

**Punto de control**: La búsqueda funciona de forma independiente sobre los datos existentes.

---

## Fase 11: Historia de Usuario 10 - Registrar una fecha objetivo (Prioridad: P2)

**Objetivo**: Adjuntar una fecha objetivo opcional a una entidad y mostrarla en los listados.

**Prueba Independiente**: Un usuario fija una fecha, la guarda y la ve en la lista; dejarla en blanco no impide guardar.

### Pruebas para la Historia de Usuario 10

- [X] T065 [P] [US10] Ampliar las pruebas de validación, persistencia y búsqueda de la fecha objetivo en `tests/unit/storage.test.js` e `tests/integration/create-entity.test.js`

### Implementación para la Historia de Usuario 10

- [X] T066 [US10] Añadir la entrada de fecha objetivo con su zona de error al formulario de entidad en `src/components/entity-form.js`
- [X] T067 [US10] Validar la fecha objetivo como fecha de calendario válida y opcional en `src/storage.js`
- [X] T068 [US10] Conectar la fecha objetivo al envío, al poblado de edición y a su visualización en listas y ficha en `src/app.js`

**Punto de control**: La fecha objetivo funciona y es visible de un vistazo.

---

## Fase 12: Historia de Usuario 12 - Buscar entidades en una pantalla dedicada (Prioridad: P2)

**Objetivo**: Ofrecer una pantalla de búsqueda dedicada accesible desde la barra lateral y el panel.

**Prueba Independiente**: Un usuario abre la pantalla de búsqueda, busca, ve resultados o estado vacío y vuelve al panel sin formularios de edición.

### Pruebas para la Historia de Usuario 12

- [X] T069 [P] [US12] Añadir pruebas de navegación a/desde la pantalla de búsqueda, enfoque de la entrada y retorno al panel en `tests/integration/search-screen.test.js`

### Implementación para la Historia de Usuario 12

- [X] T070 [US12] Renderizar los resultados y el estado vacío de la pantalla de búsqueda en `src/app.js`
- [X] T071 [US12] Conectar `#nav-search` y la acción rápida de búsqueda enfocando `#search-input` en `src/app.js`
- [X] T072 [P] [US12] Dar estilo a la pantalla de búsqueda y a sus resultados en `src/styles.css`

**Punto de control**: La búsqueda dedicada funciona sin interferir con la gestión.

---

## Fase 13: Historia de Usuario 3 - Consultar antecedentes del cliente (Prioridad: P1)

**Objetivo**: Buscar entidades y consultar su ficha con el historial de documentos ordenado por fecha, reflejando las actualizaciones de la pantalla de gestión.

**Prueba Independiente**: Un ejecutivo busca una entidad, accede a su ficha y revisa su historial de documentos ordenado, verificando que refleja los registros creados y las actualizaciones realizadas.

### Pruebas para la Historia de Usuario 3

- [X] T073 [P] [US3] Añadir pruebas de integración de ficha de entidad, historial ordenado por fecha y actualización tras cambios en gestión en `tests/integration/client-history.test.js`

### Implementación para la Historia de Usuario 3

- [X] T074 [US3] Implementar en `src/app.js` la ficha de entidad con datos de perfil e historial de documentos asociados
- [X] T075 [US3] Ordenar el historial por fecha de forma descendente y mostrar un estado vacío cuando no haya documentos en `src/app.js`
- [X] T076 [US3] Abrir la ficha al seleccionar una entidad desde los resultados de búsqueda en `src/app.js`
- [X] T077 [US3] Releer los datos almacenados al abrir la ficha para reflejar cambios de la pantalla de gestión en `src/app.js`
- [X] T078 [P] [US3] Dar estilo a la ficha y a la línea de tiempo del historial en `src/styles.css`

**Punto de control**: La consulta de antecedentes funciona sobre los datos existentes y permanece consistente.

---

## Fase 14: Historia de Usuario 4 - Gestionar entidades y documentos en una pantalla dedicada (Prioridad: P1)

**Objetivo**: Ofrecer una pantalla de gestión dedicada para entidades y documentos, sin mostrar la lista de entidades, con confirmación de eliminación en cascada.

**Prueba Independiente**: Un usuario llega a la pantalla de gestión desde la barra lateral o el panel, alterna entre entidades y documentos y crea, edita y elimina ambos.

### Pruebas para la Historia de Usuario 4

- [X] T079 [P] [US4] Ampliar las pruebas de la pantalla de gestión (ausencia de lista de entidades, alternancia y CRUD) en `tests/integration/manage-tabs.test.js`
- [X] T080 [P] [US4] Añadir una prueba de confirmación de eliminación que informe del número de documentos en cascada en `tests/integration/manage-tabs.test.js`

### Implementación para la Historia de Usuario 4

- [X] T081 [US4] Implementar el panel de gestión de entidades (crear, editar, eliminar) en `src/app.js`
- [X] T082 [US4] Implementar el diálogo de confirmación de eliminación indicando cuántos documentos asociados se eliminarán en `src/app.js`
- [X] T083 [US4] Implementar el panel de gestión de documentos (crear, editar, eliminar) en `src/app.js`
- [X] T084 [US4] Garantizar que la pantalla de gestión no renderiza ninguna lista de entidades (sin `#entity-list`) en `index.html` y `src/app.js`
- [X] T085 [P] [US4] Dar estilo a los paneles de gestión y a la confirmación de eliminación en `src/styles.css`

**Punto de control**: La funcionalidad de gestión está disponible en su pantalla dedicada y alterna sin pérdida de datos.

---

## Fase 15: Historia de Usuario 13 - Configurar el ciclo de vida de estados de documentos (Prioridad: P2)

**Objetivo**: Aplicar estados y transiciones configurados, manteniendo el estado de texto libre cuando no hay configuración.

**Prueba Independiente**: Con cotización→pedido→facturado solo se ofrecen estados alcanzables, las transiciones inválidas se rechazan y el estado es visible de un vistazo; sin configuración el estado es texto libre.

### Pruebas para la Historia de Usuario 13

- [X] T086 [P] [US13] Ampliar las pruebas de transiciones válidas/inválidas, estado libre y rechazo al actualizar en `tests/unit/storage.test.js` y `tests/integration/manage-document.test.js`

### Implementación para la Historia de Usuario 13

- [X] T087 [US13] Implementar la validación de estados y transiciones permitidas en `validateDocument`/`updateDocument`, rechazando transiciones inválidas con explicación, en `src/storage.js`
- [X] T088 [US13] Renderizar un selector con los estados alcanzables al editar y todos los estados al crear, o una entrada de texto libre sin ciclo de vida, en `src/components/document-form.js`
- [X] T089 [US13] Mostrar el estado actual como insignia en resultados de búsqueda y ficha en `src/app.js`
- [X] T090 [P] [US13] Dar estilo a la insignia de estado en `src/styles.css`

**Punto de control**: La cadena de personalización (US5 → US7/US8/US13) está completa de extremo a extremo.

---

## Fase 16: Historia de Usuario 6 - Consultar indicadores de Gestión Comercial (Prioridad: P1)

**Objetivo**: Ofrecer un resumen de indicadores con el total de entidades, el total de documentos y los documentos pendientes por entidad, actualizado en cada cambio y con selección para abrir la ficha.

**Prueba Independiente**: Un usuario abre el resumen y comprueba que los totales y los pendientes por entidad coinciden con los registros; al crear o completar un documento pendiente los indicadores se actualizan, el estado vacío muestra ceros y puede seleccionar una entidad para abrir su ficha.

### Pruebas para la Historia de Usuario 6

- [X] T091 [P] [US6] Ampliar las pruebas unitarias de la agregación de indicadores (total de entidades, total de documentos y documentos pendientes por `entity_id`, usando el `statusLifecycle` configurado o, sin ciclo de vida, la coincidencia normalizada de `status` con `pendiente`) en `tests/unit/storage.test.js`
- [X] T092 [P] [US6] Ampliar las pruebas de integración del resumen: totales, pendientes por entidad, estado vacío en ceros, actualización tras crear/editar/eliminar y apertura de la ficha desde la lista de pendientes en `tests/integration/commercial-summary.test.js`

### Implementación para la Historia de Usuario 6

- [X] T093 [US6] Implementar `computeSummary` en `src/storage.js` con los totales de entidades/documentos y los documentos pendientes agrupados por `entity_id`, determinados por el estado configurado o, sin ciclo de vida, por coincidencia normalizada de `status` con `pendiente` (FR-044, SC-011)
- [X] T094 [US6] Implementar `src/components/commercial-summary.js` para renderizar las tarjetas de indicadores, la lista de pendientes por entidad, el estado vacío con ceros e indicaciones y la acción de abrir la ficha de la entidad seleccionada (FR-041, FR-046)
- [X] T095 [US6] Conectar la vista `summary` en `src/app.js` y `src/components/shell.js` para refrescar los indicadores al mostrarse y tras cada creación, edición o eliminación de entidades y documentos (FR-045)
- [X] T096 [P] [US6] Dar estilo a las tarjetas del resumen, la lista de pendientes y el estado vacío en `src/styles.css`

**Punto de control**: El resumen de indicadores refleja siempre los registros almacenados, se actualiza tras cada cambio y permite abrir la ficha de una entidad pendiente.

---

## Fase 17: Pulido y Preocupaciones Transversales

**Propósito**: Calidad, accesibilidad, seguridad, rendimiento y regresión en todas las historias.

- [X] T097 [P] Añadir refinamientos de accesibilidad: etiquetas asociadas, foco de teclado, `aria-current`, roles y estructura semántica en `index.html`, `src/app.js` y `src/styles.css`
- [X] T098 [P] Unificar estados vacíos, de error y de éxito y los mensajes de validación en `src/app.js` y `src/styles.css`
- [X] T099 [P] Añadir pruebas unitarias del saneamiento XSS y verificar su uso en formularios, listas y ficha en `tests/unit/sanitize.test.js` y `src/utils/sanitize.js`
- [X] T100 Verificar el rendimiento de listas, selectores y búsqueda con 500 entidades y corregir cuellos de botella en `src/app.js` y `src/storage.js`
- [X] T101 [P] Actualizar `README.md` con la configuración del módulo, el marco del espacio de trabajo y la extensibilidad
- [X] T102 [P] Añadir pruebas de regresión de las aclaraciones 2026-11-01 y 2026-11-12 (código único, confirmación con recuento, fallback con advertencia, retención de huérfanos, estado de texto libre, pendientes sin ciclo de vida, campos base de documento) en `tests/unit/` y `tests/integration/`
- [X] T103 Eliminar código y referencias obsoletas (por ejemplo, cualquier componente de lista de entidades no usado) en `src/` e `index.html`
- [X] T104 Ejecutar `npm test` y corregir cualquier regresión en las pruebas existentes
- [X] T105 Ejecutar `npm run build` y corregir cualquier error de construcción
- [X] T106 Ejecutar los escenarios de `specs/001-erp-base-module/quickstart.md` de extremo a extremo

---

## Dependencias y Orden de Ejecución

### Dependencias entre Fases

- Configuración (Fase 1): Sin dependencias
- Fundacional (Fase 2): Depende de completar Configuración
- US5 (Fase 3): Depende de Fundacional; desbloquea US7, US8, US13 y el marco de US14/US15
- US1 (Fase 4): Depende de Fundacional; es la base de todas las historias de entidades
- US11 (Fase 5): Depende de US1 (`entity_id`); habilita US2, US3, US4, US7, US8, US13 y US6
- US2 (Fase 6): Depende de US1 y US11 (API de documentos)
- US7 (Fase 7): Depende de US5 y de las pantallas de US1/US11
- US8 (Fase 8): Depende de US5 y de los formularios de US1/US11
- US14/US15 (Fase 9): Depende de US5 (nombre, etiquetas, color) y del enrutador fundacional
- US9 (Fase 10): Depende de US1 y de los campos personalizados de US8
- US10 (Fase 11): Depende de US1
- US12 (Fase 12): Depende de US9 y US14
- US3 (Fase 13): Depende de US2, US9 y US11
- US4 (Fase 14): Depende de US1, US11 y US14
- US13 (Fase 15): Depende de US5 y US11
- US6 (Fase 16): Depende de US2, US3, US5 y US13
- Pulido (Fase 17): Depende de todas las historias deseadas

Todas las dependencias apuntan a fases anteriores; no hay historias que dependan de fases posteriores.

### Dentro de Cada Historia

- Las pruebas se escriben y fallan antes de la implementación
- Almacenamiento/modelo antes de servicios y componentes
- Componentes antes de la integración en `src/app.js`
- La historia debe quedar completa y probada antes de pasar a la siguiente prioridad

### Oportunidades Paralelas

- T002, T003, T004, T005, T007 y T008 pueden ejecutarse en paralelo en las fases iniciales
- En cada historia, las tareas de prueba unitaria e integración marcadas `[P]` pueden ejecutarse en paralelo
- Los componentes `entity-form.js` (US1) y `document-form.js` (US11) pueden construirse en paralelo
- US7 y US8 pueden avanzar en paralelo tras US5 y los formularios de US1/US11
- US9 y US10 pueden avanzar en paralelo tras US1/US8
- US12 puede avanzar en paralelo con US3 y US4 una vez completadas US9 y US14
- Dentro de US6, T091, T092 y T096 pueden ejecutarse en paralelo
- En la Fase 17, T097, T098, T099, T101 y T102 pueden ejecutarse en paralelo antes de T104 y T105

---

## Ejemplo Paralelo: Historia de Usuario 1

```bash
# Lanzar las pruebas de US1 en paralelo
Task: "Ampliar pruebas unitarias de validación y unicidad de code en tests/unit/storage.test.js"
Task: "Ampliar prueba de integración de code duplicado en tests/integration/create-entity.test.js"
```

## Ejemplo Paralelo: Historias de Usuario 14 y 15

```bash
# Lanzar pruebas y componentes del marco en paralelo
Task: "Ampliar pruebas del marco en tests/integration/workspace-shell.test.js"
Task: "Ampliar pruebas del panel en tests/integration/dashboard.test.js"
Task: "Implementar shell.js en src/components/shell.js"
Task: "Implementar dashboard.js en src/components/dashboard.js"
```

---

## Estrategia de Implementación

### MVP Primero (Historias de Usuario 5 y 1)

1. Completar Fase 1: Configuración
2. Completar Fase 2: Fundacional (CRÍTICO)
3. Completar Fase 3: US5 (configuración)
4. Completar Fase 4: US1 (datos maestros)
5. DETENERSE y VALIDAR: Configuración cargada y entidad creada con `code` único
6. Desplegar/demostrar si está listo

### Entrega Incremental

1. Configuración + Fundacional → base lista
2. US5 → US1 → Probar → Desplegar (MVP)
3. US11 → US2 → US7 → US8 (documentos, registro y personalización)
4. US14/US15 → US9 → US10 → US12 (marco y búsqueda)
5. US3 → US4 → US13 (ficha, gestión y ciclo de vida)
6. US6 → Pulido y regresión

### Estrategia de Equipo en Paralelo

1. El equipo completa Configuración + Fundacional
2. Tras la base (con puntos de integración según las dependencias):
   - Desarrollador A: US5 → US7 → US8 → US13
   - Desarrollador B: US1 → US11 → US2 → US10
   - Desarrollador C: US14 → US9 → US12 → US3
   - Desarrollador D: US15 → US4 → US6 → Pulido
3. Las historias se integran de forma independiente y se validan en cada punto de control

---

## Notas

- `[P]` indica archivos distintos y sin dependencias pendientes
- `[US#]` traza la tarea a la historia de usuario correspondiente
- Las tareas de prueba se incluyen por mandato de la Constitución (Principio II)
- Verificar que las pruebas fallan antes de implementar
- Confirmar con `npm test` y `npm run build` antes de cerrar cada fase
- Evitar tareas vagas, conflictos de archivo y dependencias que rompan la independencia
