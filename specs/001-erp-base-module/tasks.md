# Tareas: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

**Entrada**: Documentos de diseño desde `/specs/001-erp-base-module/`
**Prerrequisitos**: plan.md (obligatorio), spec.md (obligatorio para las historias de usuario), research.md, data-model.md, contracts/, quickstart.md
**Aclaraciones aplicadas**: sesión 2026-11-01 (código único, estado de texto libre, fallback con advertencia, retención de campos huérfanos, confirmación de eliminación)

**Nota de regeneración**: Esta versión realinea las fases con los 15 Historias de Usuario actuales de `spec.md` (las Historias 8-14 habían quedado fuera de `spec.md` por una resolución de merge incompleta y fueron restauradas; la Historia 6 "Gestión Comercial" y la Historia 15 "Panel de inicio" son nuevas respecto a la versión anterior de este archivo). Los IDs de tarea no se corresponden con la versión previa de `tasks.md`.

**Pruebas**: Incluidas porque la Constitución (Principio II) exige cobertura automatizada de comportamiento visible y lógica de negocio. Las pruebas se escriben ANTES de la implementación y deben fallar primero.

**Organización**: Las tareas se agrupan por historia de usuario para permitir implementación y prueba independientes.

## Formato: `[ID] [P?] [Historia] Descripción`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Historia]**: Historia de usuario a la que pertenece la tarea (H1, H2, ...)
- Cada tarea incluye la ruta de archivo exacta

## Convenciones de Rutas

- Proyecto único: `index.html`, `src/`, `tests/` en la raíz del repositorio
- Pruebas unitarias en `tests/unit/`; integración en `tests/integration/`

---

## Fase 1: Configuración (Infraestructura Compartida)

**Propósito**: Inicializar la aplicación Vite y las herramientas compartidas.

- [X] T001 Crear la estructura de la aplicación Vite (`index.html`, `src/`, `src/components/`, `src/utils/`, `tests/unit/`, `tests/integration/`, `tests/setup/`) según plan.md
- [X] T002 [P] Configurar Vitest con jsdom en `vitest.config.mjs` y el arranque de pruebas en `tests/setup/test-setup.js`
- [X] T003 [P] Configurar linting, formateo y scripts de `dev`, `build`, `test` en `package.json`
- [X] T004 Crear el esqueleto HTML base con regiones de pantalla y el punto de entrada en `index.html` y `src/main.js`

---

## Fase 2: Fundacional (Prerrequisitos Bloqueantes)

**Propósito**: Infraestructura base de almacenamiento, saneamiento, estilos y navegación de la que dependen todas las historias.

**⚠️ CRÍTICO**: Ninguna historia de usuario puede comenzar hasta completar esta fase.

- [X] T005 [P] Definir las claves de localStorage y los ayudantes de carga/guardado en `src/storage.js`
- [X] T006 Implementar el modelo base de Entidad y Documento, generación de `id`/`entity_id` y marcas de tiempo en `src/storage.js`
- [X] T007 [P] Implementar el saneamiento de texto introducido por el usuario para prevenir XSS en `src/utils/sanitize.js`
- [X] T008 [P] Establecer los tokens de diseño y estilos compartidos de formularios, listas y retroalimentación en `src/styles.css`
- [X] T009 Implementar el enrutador interno de vistas (panel, gestión, búsqueda, ficha, resumen) en `src/app.js`

**Punto de control**: La base está lista; las historias pueden comenzar.

---

## Fase 3: Historia de Usuario 1 - Definir datos compatibles con el ERP (Prioridad: P1)

**Objetivo**: Definir un modelo de datos con identificadores y campos comunes, incluida la vinculación de documentos a una entidad.

**Prueba Independiente**: Un analista registra un cliente de prueba y le asocia una interacción; el sistema guarda la relación y rechaza un identificador de cliente repetido o inexistente con un mensaje claro.

### Pruebas para la Historia de Usuario 1

- [X] T010 [P] [H1] Añadir pruebas unitarias de validación de entidad, campos obligatorios y unicidad de `code` en `tests/unit/storage.test.js`
- [X] T011 [P] [H1] Añadir pruebas de integración para crear una entidad y rechazar un `code` duplicado en `tests/integration/create-entity.test.js`
- [X] T012 [P] [H1] Añadir pruebas unitarias que rechacen un documento cuyo `entity_id` no corresponda a ninguna entidad y confirmen la vinculación cuando sí corresponde en `tests/unit/storage.test.js`

### Implementación de la Historia de Usuario 1

- [X] T013 [P] [H1] Construir el formulario de entidad con sus campos base en `src/components/entity-form.js`
- [X] T014 [H1] Implementar la creación de entidades con recorte de textos, marcas de tiempo y validación de `code` único (sin distinguir mayúsculas ni espacios) en `src/storage.js`
- [X] T015 [H1] Implementar `addDocument` con validación de `entity_id` existente antes de persistir en `src/storage.js` (base para Historias 2, 4 y 11)
- [X] T016 [H1] Conectar el envío del formulario a la creación y persistencia en `src/app.js`
- [X] T017 [H1] Renderizar la lista de entidades y su estado vacío en `src/components/entity-list.js`
- [X] T018 [H1] Mostrar retroalimentación de validación para campos obligatorios y `code` duplicado en `src/app.js` y `src/styles.css`

**Punto de control**: La Historia de Usuario 1 funciona y se prueba de forma independiente (MVP).

---

## Fase 4: Historia de Usuario 2 - Registrar clientes y contactos comerciales (Prioridad: P2)

**Objetivo**: Permitir registrar un cliente y una interacción (p. ej., llamada) asociada a él desde la interfaz.

**Prueba Independiente**: Un ejecutivo registra un cliente y una llamada asociada a él; comprueba que el cliente aparece en la lista de registros y que la llamada queda guardada en su ficha.

### Pruebas para la Historia de Usuario 2

- [X] T019 [P] [H2] Añadir pruebas de integración de registrar un cliente y una interacción asociada en `tests/integration/register-client-contact.test.js`
- [X] T020 [P] [H2] Añadir pruebas de integración de rechazo por datos obligatorios faltantes o `code` repetido con explicación en `tests/integration/register-client-contact.test.js`

### Implementación de la Historia de Usuario 2

- [X] T021 [P] [H2] Construir el formulario de documento con sus campos base (fecha, descripción) en `src/components/document-form.js`
- [X] T022 [H2] Conectar la creación de documentos (usando `addDocument` de T015) a la persistencia en `src/app.js`
- [X] T023 [H2] Mostrar los documentos de una entidad en su registro/lista en `src/app.js`
- [X] T024 [H2] Mostrar retroalimentación de validación para campos obligatorios del documento en `src/app.js` y `src/styles.css`

**Punto de control**: Un ejecutivo puede registrar clientes y sus interacciones de extremo a extremo.

---

## Fase 5: Historia de Usuario 3 - Consultar antecedentes del cliente (Prioridad: P1)

**Objetivo**: Buscar clientes y consultar su ficha e historial de interacciones/documentos, ordenado por fecha y siempre actualizado.

**Prueba Independiente**: Un ejecutivo de atención al cliente busca un cliente registrado, accede a su ficha y revisa su historial de interacciones y documentos asociados, verificando que la información corresponde a los registros creados en la Historia de Usuario 2 y refleja las actualizaciones realizadas en la Historia de Usuario 4.

### Pruebas para la Historia de Usuario 3

- [X] T025 [P] [H3] Añadir pruebas de integración de búsqueda por nombre, código o palabra clave en `tests/integration/search-entities.test.js`
- [X] T026 [P] [H3] Añadir pruebas de integración de la ficha de entidad: datos + documentos asociados ordenados por fecha en `tests/integration/entity-detail.test.js`
- [X] T027 [P] [H3] Añadir pruebas de integración de que la ficha refleja ediciones/eliminaciones hechas en la pantalla de gestión en `tests/integration/entity-detail.test.js`
- [X] T028 [P] [H3] Añadir pruebas de integración de búsqueda sin coincidencias (estado vacío) en `tests/integration/search-entities.test.js`

### Implementación de la Historia de Usuario 3

- [X] T029 [H3] Implementar el filtrado de entidades por nombre, código, categoría y palabra clave en `src/storage.js`
- [X] T030 [P] [H3] Construir el componente de búsqueda reutilizable en `src/components/search-bar.js`
- [X] T031 [H3] Conectar la búsqueda a resultados y estado vacío en `src/app.js`
- [X] T032 [P] [H3] Construir `src/components/entity-detail.js` (ficha: datos de la entidad + documentos asociados ordenados por fecha)
- [X] T033 [H3] Conectar la selección de un resultado de búsqueda a la apertura de la ficha en `src/app.js`
- [X] T034 [H3] Releer el almacenamiento cada vez que se muestra la ficha para reflejar cambios hechos en la pantalla de gestión en `src/components/entity-detail.js`

**Punto de control**: La búsqueda y la ficha de cliente funcionan de forma independiente sobre los datos de las Historias 1 y 2.

---

## Fase 6: Historia de Usuario 4 - Gestionar entidades y documentos en una pantalla dedicada (Prioridad: P1)

**Objetivo**: Ofrecer una pantalla de gestión dedicada para crear, editar y eliminar entidades y documentos, sin mostrar la lista de entidades, con eliminación en cascada confirmada.

**Prueba Independiente**: Un usuario llega a la pantalla de gestión, alterna entre entidades y documentos, y crea, edita y elimina ambos; al eliminar una entidad se pide confirmación indicando cuántos documentos se eliminarán.

### Pruebas para la Historia de Usuario 4

- [X] T035 [P] [H4] Añadir pruebas de integración de la pantalla de gestión (sin lista de entidades) en `tests/integration/manage-screen.test.js`
- [X] T036 [P] [H4] Añadir pruebas de integración de edición de entidades y confirmación con recuento antes de eliminar en `tests/integration/edit-delete-entity.test.js`
- [X] T037 [P] [H4] Añadir pruebas unitarias de actualización de entidad, eliminación y cascada de documentos en `tests/unit/storage.test.js`
- [X] T038 [P] [H4] Añadir pruebas de integración de crear, editar y eliminar documentos en `tests/integration/manage-document.test.js`

### Implementación de la Historia de Usuario 4

- [X] T039 [P] [H4] Añadir el contenedor de la pantalla de gestión sin la lista de entidades en `index.html`
- [X] T040 [H4] Implementar la actualización de entidades preservando `id`, `entity_id` y actualizando `updatedAt` en `src/storage.js`
- [X] T041 [H4] Implementar `updateDocument`, `deleteDocument` y `deleteDocumentsForEntity` (cascada) en `src/storage.js`
- [X] T042 [H4] Implementar el diálogo de confirmación de eliminación que muestra el número de documentos asociados en `src/app.js`
- [X] T043 [H4] Implementar el panel de gestión de entidades (crear, editar, eliminar) en `src/app.js`
- [X] T044 [H4] Implementar el panel de gestión de documentos (crear, editar, eliminar) en `src/app.js`
- [X] T045 [P] [H4] Crear la lista de documentos de una entidad en `src/components/document-list.js`
- [X] T046 [H4] Ejecutar la eliminación en cascada solo tras confirmar y refrescar lista, ficha y búsqueda en `src/app.js`
- [X] T047 [P] [H4] Dar estilo a los paneles de gestión en `src/styles.css`

**Punto de control**: La funcionalidad completa de gestión está disponible en su pantalla dedicada.

---

## Fase 7: Historia de Usuario 5 - Definir un perfil de configuración del módulo (Prioridad: P1)

**Objetivo**: Cargar `src/module-config.js` con valores predeterminados seguros y fallback con advertencia visible ante configuración inválida.

**Prueba Independiente**: Una configuración de Ventas se presenta en la aplicación; sin archivo se usan los valores predeterminados; una configuración inválida arranca con predeterminados y muestra una advertencia.

### Pruebas para la Historia de Usuario 5

- [X] T048 [P] [H5] Añadir pruebas unitarias de carga, valores predeterminados, validación y fallback con advertencia en `tests/unit/module-config.test.js`

### Implementación de la Historia de Usuario 5

- [X] T049 [H5] Definir la configuración predeterminada y el cargador del perfil en `src/module-config.js`
- [X] T050 [H5] Validar `moduleName`, `labels`, `customFields`, `statusLifecycle` y `theme.accentColor` en `src/module-config.js`
- [X] T051 [H5] Implementar el fallback a valores predeterminados y exponer una advertencia visible cuando la configuración sea inválida o conflictiva en `src/module-config.js` y `src/app.js`
- [X] T052 [H5] Cargar la configuración al arrancar y pasarla a todas las vistas en `src/main.js` y `src/app.js`
- [X] T053 [P] [H5] Dar estilo al aviso visible de configuración inválida en `src/styles.css`

**Punto de control**: La configuración se carga de forma fiable, valida limpiamente y nunca bloquea la aplicación.

---

## Fase 8: Historia de Usuario 6 - Consultar indicadores de Gestión Comercial (Prioridad: P6)

**Objetivo**: Ofrecer un resumen de totales de entidades/documentos y documentos pendientes por entidad, siempre actualizado.

**Prueba Independiente**: Un Gerente Comercial accede al resumen y comprueba que el total de clientes, las interacciones registradas y los seguimientos pendientes coinciden con los datos de las fichas de los clientes; luego registra un nuevo seguimiento y verifica que el indicador correspondiente se actualiza.

### Pruebas para la Historia de Usuario 6

- [X] T054 [P] [H6] Añadir pruebas unitarias de agregación de totales y de documentos pendientes por entidad según el `statusLifecycle` configurado en `tests/unit/storage.test.js`
- [X] T055 [P] [H6] Añadir pruebas de integración de que los indicadores coinciden con los registros y se actualizan tras crear/completar un documento en `tests/integration/commercial-summary.test.js`
- [X] T056 [P] [H6] Añadir pruebas de integración del estado vacío (indicadores en cero) en `tests/integration/commercial-summary.test.js`

### Implementación de la Historia de Usuario 6

- [X] T057 [H6] Implementar la agregación de totales de entidades/documentos y de documentos pendientes agrupados por `entity_id` en `src/storage.js`
- [X] T058 [P] [H6] Construir `src/components/commercial-summary.js` con los indicadores y el estado vacío
- [X] T059 [H6] Conectar el resumen como vista accesible desde la navegación en `src/app.js`
- [X] T060 [H6] Conectar la selección de una entidad en el resumen a su ficha (`entity-detail.js`, Historia 3) en `src/app.js`
- [X] T061 [P] [H6] Dar estilo al resumen y a su estado vacío en `src/styles.css`

**Punto de control**: El resumen de Gestión Comercial refleja siempre los registros reales (SC-011).

---

## Fase 9: Historia de Usuario 7 - Reetiquetar pantallas desde la configuración (Prioridad: P1)

**Objetivo**: Derivar todas las etiquetas visibles de la configuración.

**Prueba Independiente**: Con Entidad→Cliente y Documento→Interacción, todas las etiquetas, encabezados, botones y estados vacíos usan los términos mapeados.

### Pruebas para la Historia de Usuario 7

- [X] T062 [P] [H7] Añadir pruebas de integración que verifiquen las etiquetas configuradas en todas las pantallas en `tests/integration/relabeling.test.js`

### Implementación de la Historia de Usuario 7

- [X] T063 [H7] Centralizar el acceso a etiquetas con retroceso a Entidad/Documento en `src/module-config.js`
- [X] T064 [H7] Sustituir el texto fijo por etiquetas configuradas en `index.html`, `src/app.js` y los componentes
- [X] T065 [H7] Aplicar las etiquetas a estados vacíos, botones, encabezados y mensajes en `src/app.js` y `src/components/`

**Punto de control**: Un módulo configurado se presenta completamente bajo su propia terminología.

---

## Fase 10: Historia de Usuario 8 - Declarar campos personalizados para los registros (Prioridad: P1)

**Objetivo**: Hacer que los campos personalizados fluyan por formularios, validación, persistencia, listas y búsqueda, conservando los valores huérfanos.

**Prueba Independiente**: Un campo numérico obligatorio se renderiza como entrada numérica, bloquea guardados en blanco, aparece en listas y coincide en búsquedas; al retirarlo de la configuración sus valores se conservan ocultos y reaparecen al redeclararlo.

### Pruebas para la Historia de Usuario 8

- [X] T066 [P] [H8] Añadir pruebas unitarias de validación, persistencia y retención de valores huérfanos de campos personalizados en `tests/unit/storage.test.js`
- [X] T067 [P] [H8] Añadir pruebas de integración del renderizado de campos personalizados, su búsqueda y la ocultación/restauración de huérfanos en `tests/integration/custom-fields.test.js`

### Implementación de la Historia de Usuario 8

- [X] T068 [P] [H8] Renderizar dinámicamente los campos personalizados según su tipo en `src/components/entity-form.js` y `src/components/document-form.js`
- [X] T069 [H8] Validar los campos personalizados obligatorios y de tipo correcto con la misma experiencia de retroalimentación en `src/storage.js` y `src/app.js`
- [X] T070 [H8] Persistir los valores personalizados junto a los campos base sin cambios de esquema en `src/storage.js`
- [X] T071 [H8] Incluir los valores personalizados en listas, ficha y búsqueda en `src/app.js`
- [X] T072 [H8] Conservar en el almacenamiento los valores no declarados, ocultarlos de la interfaz y restaurarlos al redeclarar el campo en `src/storage.js` y `src/app.js`
- [X] T073 [P] [H8] Dar estilo a los campos personalizados y a sus errores en `src/styles.css`

**Punto de control**: Los datos específicos del módulo (p. ej., `interactionType` del perfil CRM) requieren cero cambios de código de interfaz.

---

## Fase 11: Historia de Usuario 9 - Buscar y encontrar entidades rápidamente (Prioridad: P2)

**Objetivo**: Que la búsqueda de la Historia 3 escale e incluya campos personalizados, fecha objetivo y descripción.

**Prueba Independiente**: Con cientos de entidades almacenadas, un usuario busca y los resultados coincidentes aparecen con prontitud; sin coincidencias ve un estado vacío claro.

### Pruebas para la Historia de Usuario 9

- [X] T074 [P] [H9] Añadir pruebas unitarias de normalización y filtrado de búsqueda a escala en `tests/unit/storage.test.js`
- [X] T075 [P] [H9] Añadir pruebas de integración de coincidencias con cientos de registros en `tests/integration/search-entities.test.js`

### Implementación de la Historia de Usuario 9

- [X] T076 [H9] Extender el filtrado de `src/storage.js` (T029) a descripción, fecha objetivo y campos personalizados
- [X] T077 [H9] Mantener los resultados sincronizados tras crear, editar o eliminar en `src/app.js`

**Punto de control**: La búsqueda funciona de forma independiente y a escala sobre los datos existentes.

---

## Fase 12: Historia de Usuario 10 - Registrar una fecha objetivo (Prioridad: P2)

**Objetivo**: Permitir adjuntar una fecha objetivo opcional a una entidad.

**Prueba Independiente**: Un usuario fija una fecha, la guarda y la ve en la lista; dejarla en blanco no impide guardar.

### Pruebas para la Historia de Usuario 10

- [X] T078 [P] [H10] Añadir pruebas unitarias de validación y persistencia de una fecha objetivo válida y opcional en `tests/unit/storage.test.js`

### Implementación de la Historia de Usuario 10

- [X] T079 [P] [H10] Añadir la entrada de fecha objetivo al formulario de entidad en `src/components/entity-form.js`
- [X] T080 [H10] Validar la fecha objetivo como fecha de calendario válida y opcional en `src/storage.js`
- [X] T081 [H10] Conectar la fecha objetivo al envío, al poblado de edición y a los errores en `src/app.js`
- [X] T082 [H10] Mostrar la fecha objetivo en la lista de entidades en `src/components/entity-list.js`

**Punto de control**: La fecha objetivo funciona y es visible de un vistazo.

---

## Fase 13: Historia de Usuario 11 - Registrar los detalles de documentos de una entidad (Prioridad: P2)

**Objetivo**: Cerrar la cobertura de CRUD de documentos (más allá de la creación básica de las Historias 2 y 4) con una lista de documentos dedicada y validación completa.

**Prueba Independiente**: Un usuario añade un documento a una entidad y lo ve asociado; editar/eliminar funciona; eliminar la entidad elimina sus documentos.

### Pruebas para la Historia de Usuario 11

- [X] T083 [P] [H11] Añadir pruebas de integración de añadir, editar, eliminar y cascada de documentos en `tests/integration/add-document.test.js`

### Implementación de la Historia de Usuario 11

- [X] T084 [H11] Mostrar los documentos asociados a la entidad seleccionada usando `document-list.js` (T045) en `src/app.js`
- [X] T085 [H11] Mostrar retroalimentación de validación de los campos obligatorios del documento en `src/app.js`

**Punto de control**: Datos maestros y documentos transaccionales están completamente vinculados y validados.

---

## Fase 14: Historia de Usuario 12 - Buscar entidades en una pantalla dedicada (Prioridad: P2)

**Objetivo**: Ofrecer una pantalla de búsqueda dedicada accesible desde la barra lateral y el panel.

**Prueba Independiente**: Un usuario abre la pantalla de búsqueda, busca, ve resultados o estado vacío y vuelve al panel.

### Pruebas para la Historia de Usuario 12

- [X] T086 [P] [H12] Añadir pruebas de integración de navegación a/desde la pantalla de búsqueda y sus resultados en `tests/integration/search-screen.test.js`

### Implementación de la Historia de Usuario 12

- [X] T087 [P] [H12] Añadir el marcado de la pantalla de búsqueda dedicada en `index.html`
- [X] T088 [H12] Implementar los resultados y el estado vacío de la pantalla de búsqueda reutilizando `search-bar.js` (T030) en `src/app.js`
- [X] T089 [H12] Conectar la navegación desde la barra lateral y la acción rápida, enfocando la entrada, en `src/app.js`
- [X] T090 [P] [H12] Dar estilo a la pantalla de búsqueda en `src/styles.css`

**Punto de control**: La búsqueda dedicada funciona sin interferir con la gestión.

---

## Fase 15: Historia de Usuario 13 - Configurar el ciclo de vida de estados de documentos (Prioridad: P2)

**Objetivo**: Aplicar estados y transiciones configurados, manteniendo estado de texto libre cuando no hay configuración; es la base del concepto "pendiente" usado en la Historia 6.

**Prueba Independiente**: Con pendiente→en_progreso→completado solo se ofrecen estados alcanzables, las transiciones inválidas se rechazan y el estado es visible; sin configuración el estado es texto libre.

### Pruebas para la Historia de Usuario 13

- [X] T091 [P] [H13] Añadir pruebas unitarias de transiciones válidas/inválidas y de estado de texto libre sin configuración en `tests/unit/storage.test.js`
- [X] T092 [P] [H13] Añadir pruebas de integración de las opciones de estado ofrecidas y el rechazo de transiciones inválidas en `tests/integration/document-lifecycle.test.js`

### Implementación de la Historia de Usuario 13

- [X] T093 [H13] Implementar la validación de transiciones de estado y el rechazo con explicación en `src/storage.js`
- [X] T094 [H13] Renderizar un selector con estados alcanzables cuando hay ciclo de vida y una entrada de texto libre cuando no lo hay en `src/components/document-form.js`
- [X] T095 [H13] Mostrar el estado actual como insignia en listas y detalle de documentos en `src/components/document-list.js`

**Punto de control**: La cadena de personalización (H5 → H7/H8/H13) y el concepto "pendiente" de H6 están completos de extremo a extremo.

---

## Fase 16: Historia de Usuario 14 - Marco de espacio de trabajo ERP con marca (Prioridad: P1)

**Objetivo**: Envolver cada pantalla en un marco persistente con barra superior, logotipo derivado y barra lateral con módulo activo resaltado.

**Prueba Independiente**: En cada pantalla se ven la barra superior con logotipo y nombre, la barra lateral con Panel/Entidades/Documentos/Buscar, el módulo activo resaltado, la contracción en ventanas estrechas y la conservación de datos al navegar.

### Pruebas para la Historia de Usuario 14

- [X] T096 [P] [H14] Añadir pruebas de integración del marco en todas las pantallas, resaltado activo y barra lateral estrecha en `tests/integration/workspace-shell.test.js`

### Implementación de la Historia de Usuario 14

- [X] T097 [P] [H14] Añadir el marcado del marco (barra superior, montaje del logotipo, botones de módulo, región de contenido) en `index.html`
- [X] T098 [P] [H14] Implementar `src/components/shell.js` con monograma SVG derivado, etiquetas configuradas, resaltado activo y eventos de navegación
- [X] T099 [H14] Integrar el marco envolviendo todas las vistas y sustituir la navegación provisional en `src/app.js`
- [X] T100 [H14] Aplicar `theme.accentColor` como propiedad CSS y retroceder al valor predeterminado si es inválido en `src/app.js`
- [X] T101 [P] [H14] Dar estilo a la barra superior, la barra lateral y la contracción a columna de iconos con etiquetas accesibles en `src/styles.css`
- [X] T102 [H14] Verificar que la navegación entre módulos no pierde entidades ni documentos en `src/app.js`

**Punto de control**: Todas las pantallas se renderizan dentro del marco con marca y navegación por barra lateral.

---

## Fase 17: Historia de Usuario 15 - Panel de inicio con acciones rápidas y estadísticas (Prioridad: P1)

**Objetivo**: Ofrecer un panel de entrada con al menos cuatro acciones rápidas y estadísticas de registros en vivo.

**Prueba Independiente**: La aplicación abre en el panel; las acciones llevan al destino correcto con formulario vacío o búsqueda enfocada; las estadísticas coinciden con los registros.

### Pruebas para la Historia de Usuario 15

- [X] T103 [P] [H15] Añadir pruebas de integración de acciones rápidas y estadísticas en vivo en `tests/integration/dashboard.test.js`

### Implementación de la Historia de Usuario 15

- [X] T104 [P] [H15] Añadir el marcado del panel (encabezado, cuadrícula de acciones rápidas, tarjetas de estadísticas) en `index.html`
- [X] T105 [H15] Implementar `src/components/dashboard.js` con las cuatro acciones rápidas y las tarjetas de estadísticas
- [X] T106 [H15] Conectar las acciones rápidas para abrir gestión de entidades, gestión de documentos con formulario limpio y búsqueda con entrada enfocada en `src/app.js`
- [X] T107 [H15] Refrescar los recuentos de entidades/documentos cada vez que se muestra el panel en `src/components/dashboard.js`
- [X] T108 [P] [H15] Dar estilo al panel, las tarjetas de acción y las estadísticas en `src/styles.css`

**Punto de control**: La aplicación abre en un panel funcional con cada tarea ERP a un clic.

---

## Fase 18: Pulido y Preocupaciones Transversales

**Propósito**: Calidad, accesibilidad, seguridad, rendimiento y regresión en todas las historias.

- [X] T109 [P] Añadir refinamientos de accesibilidad: etiquetas, foco de teclado, `aria-current` y estructura semántica en `index.html`, `src/app.js` y `src/styles.css`
- [X] T110 [P] Unificar estados vacíos, de carga y de error y los mensajes de validación en `src/app.js` y `src/styles.css`
- [X] T111 [P] Añadir pruebas unitarias del saneamiento XSS del texto de usuario en `tests/unit/sanitize.test.js` y verificar su uso en `src/utils/sanitize.js`
- [X] T112 Verificar el rendimiento de listas, búsqueda y resumen de indicadores con 500 entidades y corregir cuellos de botella en `src/app.js` y `src/storage.js`
- [X] T113 [P] Actualizar `README.md` con la configuración del módulo, el marco del espacio de trabajo y la extensibilidad
- [X] T114 Ejecutar `npm test` y `npm run build`, y corregir cualquier regresión
- [X] T115 Ejecutar los escenarios de `specs/001-erp-base-module/quickstart.md` de extremo a extremo
- [X] T116 [P] Añadir pruebas de regresión de las aclaraciones 2026-11-01 (código único, confirmación de eliminación, fallback con advertencia, retención de huérfanos, estado de texto libre) en `tests/unit/` y `tests/integration/`
- [X] T117 [P] Añadir pruebas de regresión que confirmen que los indicadores de `commercial-summary.js` (SC-011) coinciden con los registros tras creaciones, ediciones y eliminaciones en `tests/integration/commercial-summary.test.js`

---

## Dependencias y Orden de Ejecución

### Dependencias entre Historias

- Configuración (Fase 1): Sin dependencias
- Fundacional (Fase 2): Depende de completar Configuración
- H1 (Fase 3): Depende de Fundacional
- H2 (Fase 4): Depende de H1 (entidad + `addDocument`)
- H3 (Fase 5): Depende de H1 y H2 (registros poblados); su ficha es reutilizada por H6
- H4 (Fase 6): Depende de H1; su CRUD de documentos es reutilizado por H11
- H5 (Fase 7): Depende de Fundacional; desbloquea H7, H8 y H13
- H6 (Fase 8): Depende de H1, H2, H3 (ficha), H4 (documentos editables) y H5/H13 (para interpretar "pendiente")
- H7 (Fase 9): Depende de H5
- H8 (Fase 10): Depende de H5 y de los formularios de H1/H2/H4
- H9 (Fase 11): Depende de H3 (filtro base)
- H10 (Fase 12): Depende de H1
- H11 (Fase 13): Depende de H1, H4 (CRUD de documentos) y de `entity_id`
- H12 (Fase 14): Depende de H9 y H14
- H13 (Fase 15): Depende de H5 y H4/H11; desbloquea el indicador "pendiente" de H6
- H14 (Fase 16): Depende de H5 (nombre, etiquetas y color) y del enrutador de H1/Fundacional
- H15 (Fase 17): Depende de H14 (navegación) y de los recuentos de almacenamiento
- Pulido (Fase 18): Depende de todas las historias deseadas

**Nota**: H6 y H13 se listan antes de H9/H10/H11/H12 por ser prerrequisitos conceptuales de H6 ("pendiente"), pero su implementación completa de H13 (ciclo de vida) puede construirse en paralelo con H9/H10/H11 si el equipo lo prefiere; el resumen de H6 solo necesita que `statusLifecycle` exista en la configuración (H5), no que H13 esté terminada primero.

### Dentro de Cada Historia

- Las pruebas se escriben y fallan antes de la implementación
- Modelo/almacenamiento antes de servicios y componentes
- Componentes antes de la integración en `src/app.js`
- La historia debe quedar completa y probada antes de pasar a la siguiente prioridad

### Oportunidades Paralelas

- T002, T003, T005, T007 y T008 pueden ejecutarse en paralelo en las fases iniciales
- En cada historia, las pruebas unitarias e integración marcadas `[P]` pueden ejecutarse en paralelo
- Los componentes de formulario (`entity-form`, `document-form`) pueden construirse en paralelo
- H7 y H8 pueden avanzar en paralelo tras H5
- H9 y H10 pueden avanzar en paralelo tras H3/H1 respectivamente
- H12 puede avanzar en paralelo con H13 una vez completadas sus dependencias
- En la Fase 18, T109, T110, T111, T113, T116 y T117 pueden ejecutarse en paralelo antes de T114 y T115

---

## Ejemplo Paralelo: Historia de Usuario 1

```bash
# Lanzar las pruebas de H1 en paralelo
Task: "Pruebas unitarias de validación y unicidad de code en tests/unit/storage.test.js"
Task: "Pruebas de integración de creación y code duplicado en tests/integration/create-entity.test.js"
Task: "Pruebas unitarias de rechazo de entity_id inexistente en tests/unit/storage.test.js"
```

---

## Estrategia de Implementación

### MVP Primero (Solo Historia de Usuario 1)

1. Completar Fase 1: Configuración
2. Completar Fase 2: Fundacional (CRÍTICO)
3. Completar Fase 3: H1
4. **DETENERSE y VALIDAR**: Probar H1 de forma independiente
5. Desplegar/demostrar si está listo

### Entrega Incremental

1. Configuración + Fundacional → base lista
2. H1 → Probar → Desplegar (MVP)
3. H2 → H3 (registro y consulta de clientes) → Probar → Desplegar
4. H4 → H5 → H7 → H8 → H13 (gestión dedicada y personalización) → Probar → Desplegar
5. H6 (indicadores de Gestión Comercial, depende de lo anterior) → Probar → Desplegar
6. H9 → H10 → H11 → H12 (recuperación y detalle a escala) → Probar → Desplegar
7. H14 → H15 (marco de espacio de trabajo y panel) → Probar → Desplegar
8. Pulido y regresión

### Estrategia de Equipo en Paralelo

1. El equipo completa Configuración + Fundacional
2. Tras la base:
   - Desarrollador A: H1 → H2 → H3 → H9
   - Desarrollador B: H5 → H7 → H8 → H13 → H6
   - Desarrollador C: H4 → H11 → H10 → H14 → H15 → H12
3. Las historias se integran de forma independiente y se validan en cada punto de control

---

## Notas

- `[P]` indica archivos distintos y sin dependencias pendientes
- `[H#]` traza la tarea a la Historia de Usuario correspondiente en `spec.md` (coincide exactamente con su numeración actual)
- Las tareas de prueba se incluyen por mandato de la Constitución (Principio II)
- Verificar que las pruebas fallan antes de implementar
- Confirmar con `npm test` y `npm run build` antes de cerrar cada fase
- Evitar tareas vagas, conflictos de archivo y dependencias que rompan la independencia
