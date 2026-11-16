# Tareas: Módulo Base de Gestión de Relaciones con Clientes (CRM)

**Entrada**: Documentos de diseño desde `/specs/001-erp-base-module/`
**Prerrequisitos**: plan.md (obligatorio), spec.md (obligatorio para las historias de usuario), research.md, data-model.md, contracts/, quickstart.md
**Aclaraciones aplicadas**: sesión 2026-11-01 (código único, estado de texto libre, fallback con advertencia, retención de campos huérfanos, confirmación de eliminación)

**Dominio CRM**: Entidades → **Clientes** (campos personalizados: industria, canal de origen, ejecutivo asignado) y Documentos → **Oportunidades** (ciclo de vida de embudo: Prospecto, Contactado, Propuesta Enviada, Negociación, Cerrada Ganada, Cerrada Perdida).

**Pruebas**: Incluidas porque la Constitución (Principio II) exige cobertura automatizada del comportamiento visible y de la lógica de negocio. La suite base ya existe en `tests/unit/` y `tests/integration/`; las tareas amplían esa suite.

**Organización**: Las tareas se agrupan por historia de usuario para permitir implementación y prueba independientes.

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
- [X] T006 Implementar en `src/storage.js` la generación de `id` y `entity_id` únicos, las marcas de tiempo `createdAt`/`updatedAt` y la carga/guardado de clientes y oportunidades
- [X] T007 [P] Implementar el saneamiento de texto introducido por el usuario para prevenir XSS (`escapeHtml`) en `src/utils/sanitize.js`
- [X] T008 [P] Implementar la normalización de texto para búsqueda (minúsculas, sin tildes ni espacios redundantes) y la coincidencia por campos en `src/utils/search.js`
- [X] T009 Implementar el enrutador interno de vistas (`showView`, ocultamiento de las demás, resaltado del módulo activo con `aria-current="page"`) y las exportaciones `boot`/`initApp` en `src/app.js`
- [X] T010 Implementar en `src/app.js` los ayudantes compartidos de validación visual: mostrar/limpiar errores por campo, enfocar el primer campo inválido y retroalimentación de éxito

**Punto de control**: La base está lista; las historias pueden comenzar.

---

## Fase 3: Historia de Usuario 5 - Definir un perfil de configuración del módulo (Prioridad: P1)

**Objetivo**: Cargar `src/module-config.js` con valores predeterminados seguros, validación completa y fallback con advertencia visible ante configuración inválida.

**Prueba Independiente**: Una configuración CRM (Cliente/Oportunidad, campos industria/canal de origen/ejecutivo asignado, embudo comercial) se presenta en la aplicación; sin configuración se usan los valores predeterminados; una configuración inválida arranca con predeterminados y muestra advertencia visible.

### Pruebas para la Historia de Usuario 5

- [X] T011 [P] [US5] Ampliar las pruebas de fallback, tipos de campo, colisiones, ciclo de vida y tema en `tests/unit/module-config.test.js`
- [X] T012 [P] [US5] Añadir una prueba de integración que verifique la advertencia visible y el arranque con predeterminados ante configuración inválida en `tests/integration/config-warning.test.js`

### Implementación para la Historia de Usuario 5

- [X] T013 [US5] Definir `DEFAULT_CONFIG`, `BASE_FIELDS` y `FIELD_TYPES` en `src/module-config.js`
- [X] T014 [US5] Implementar `normalizeConfig` con validación de `moduleName`, `labels`, `customFields` (tipo, colisión con campos base, duplicados, `options` en select), `statusLifecycle` y `theme.accentColor` en `src/module-config.js`
- [X] T015 [US5] Implementar `loadModuleConfig`, `setActiveConfig`, `getConfig` y `labelFor` con retroceso a predeterminados en `src/module-config.js`
- [X] T016 [US5] Renderizar una advertencia visible y no bloqueante cuando la configuración sea inválida en `index.html` y `src/app.js`
- [X] T017 [P] [US5] Dar estilo al aviso de configuración inválida en `src/styles.css`

**Punto de control**: La configuración se carga de forma fiable, valida limpiamente y nunca bloquea la aplicación.

---

## Fase 4: Historia de Usuario 1 - Definir datos compatibles con el CRM (Prioridad: P1)

**Objetivo**: Establecer el modelo de cliente con identificador público único, validación de `code` único y creación persistente.

**Prueba Independiente**: Un analista registra un cliente de prueba, el sistema lo guarda con `entity_id` único y rechaza un `code` repetido con un mensaje claro.

### Pruebas para la Historia de Usuario 1

- [X] T018 [P] [US1] Ampliar las pruebas unitarias de validación, generación de `entity_id` y rechazo de `code` duplicado (sin distinguir mayúsculas ni espacios) en `tests/unit/storage.test.js`
- [X] T019 [P] [US1] Ampliar la prueba de integración para rechazar un `code` duplicado con explicación en `tests/integration/create-entity.test.js`

### Implementación para la Historia de Usuario 1

- [X] T020 [US1] Implementar `validateEntity` con nombre y código obligatorios, `taxId`/textos recortados, formato de correo y `creditLimit` no negativo en `src/storage.js`
- [X] T021 [US1] Implementar `addEntity`, `updateEntity` y `deleteEntity` preservando `id`/`entity_id`, actualizando `updatedAt` y aplicando unicidad de `code` en `src/storage.js`
- [X] T022 [P] [US1] Construir los campos base del formulario de cliente con sus identificadores y zonas de error en `src/components/entity-form.js`
- [X] T023 [US1] Conectar el envío del formulario de cliente con creación/actualización y retroalimentación de validación en `src/app.js`
- [X] T024 [US1] Poblar el selector `#edit-entity` con los registros almacenados y limpiar el formulario tras guardar en `src/app.js`
- [X] T025 [P] [US1] Dar estilo a los campos, errores y estados de foco del formulario de cliente en `src/styles.css`

**Punto de control**: La Historia de Usuario 1 funciona y se prueba de forma independiente (MVP).

---

## Fase 5: Historia de Usuario 2 - Registrar clientes y oportunidades comerciales (Prioridad: P2)

**Objetivo**: Registrar clientes y sus oportunidades desde la interfaz, con validación clara.

**Prueba Independiente**: Un ejecutivo registra un cliente y una oportunidad asociada; ambos quedan guardados y visibles en la ficha del cliente.

### Pruebas para la Historia de Usuario 2

- [X] T026 [P] [US2] Añadir una prueba de integración de registro de cliente con oportunidad asociada visible en su ficha en `tests/integration/register-client.test.js`

### Implementación para la Historia de Usuario 2

- [X] T027 [US2] Renderizar en `src/app.js` los registros guardados en los selectores de edición y las oportunidades vinculadas en la ficha del cliente
- [X] T028 [US2] Unificar la retroalimentación de campos obligatorios y códigos repetidos entre ambos formularios en `src/app.js`
- [X] T029 [US2] Asociar cada oportunidad al `entity_id` seleccionado al guardar y refrescar la vista tras el cambio en `src/app.js`
- [X] T030 [P] [US2] Dar estilo a la ficha y a la lista de oportunidades vinculadas en `src/styles.css`

**Punto de control**: Registrar clientes y oportunidades funciona de extremo a extremo.

---

## Fase 6: Historia de Usuario 6 - Reetiquetar pantallas desde la configuración (Prioridad: P1)

**Objetivo**: Derivar todas las etiquetas visibles de la configuración del módulo CRM.

**Prueba Independiente**: Con Entidad→Cliente y Documento→Oportunidad, todas las pestañas, botones, etiquetas, encabezados y estados vacíos usan los términos mapeados sin alterar la navegación.

### Pruebas para la Historia de Usuario 6

- [X] T031 [P] [US6] Ampliar las pruebas de etiquetado en todas las pantallas y en `document.title` en `tests/integration/relabeling.test.js`

### Implementación para la Historia de Usuario 6

- [X] T032 [US6] Sustituir el texto fijo por `labelFor` en `index.html`, `src/app.js` y `src/components/`
- [X] T033 [US6] Aplicar los términos configurados a encabezados, botones, etiquetas de formulario, mensajes y estados vacíos en `src/app.js` y `src/components/`
- [X] T034 [US6] Actualizar `document.title`, `#brand-name` y los botones de la barra lateral desde la configuración en `src/app.js` y `src/components/shell.js`

**Punto de control**: Un módulo CRM configurado se presenta completamente bajo su propia terminología.

---

## Fase 7: Historia de Usuario 7 - Declarar campos personalizados para los registros (Prioridad: P1)

**Objetivo**: Hacer que los campos personalizados de cliente (industria, canal de origen, ejecutivo asignado) fluyan por formularios, validación, persistencia, listas y búsqueda, conservando los valores huérfanos.

**Prueba Independiente**: Los campos personalizados declarados se renderizan con el tipo correcto, bloquean guardados inválidos, aparecen en listas/ficha y coinciden en búsquedas; al retirarlos de la configuración sus valores se conservan ocultos y reaparecen al redeclararlos.

### Pruebas para la Historia de Usuario 7

- [X] T035 [P] [US7] Ampliar las pruebas unitarias de validación por tipo, opciones de select y retención de valores huérfanos en `tests/unit/storage.test.js`
- [X] T036 [P] [US7] Ampliar las pruebas de integración de renderizado, búsqueda y ocultación/restauración de campos personalizados en `tests/integration/custom-fields.test.js`

### Implementación para la Historia de Usuario 7

- [X] T037 [US7] Renderizar dinámicamente los campos personalizados según su tipo (`text`, `number`, `date`, `select`) en `src/components/entity-form.js` y `src/components/document-form.js`
- [X] T038 [US7] Validar campos personalizados obligatorios, de tipo correcto y con opciones válidas en `src/storage.js`
- [X] T039 [US7] Persistir los valores personalizados junto a los campos base sin cambios de esquema en `src/storage.js`
- [X] T040 [US7] Mostrar los valores personalizados con su etiqueta en listas, ficha y resultados de búsqueda en `src/app.js`
- [X] T041 [US7] Conservar en el almacenamiento los valores no declarados, ocultarlos de la interfaz y restaurarlos al redeclarar el campo en `src/storage.js` y `src/app.js`
- [X] T042 [P] [US7] Dar estilo a los bloques de campos personalizados y a sus errores en `src/styles.css`

**Punto de control**: Los datos específicos del módulo CRM (industria, canal de origen, ejecutivo asignado) requieren cero cambios de código de interfaz y no se pierden al evolucionar la configuración.

---

## Fase 8: Historia de Usuario 13 - Marco de espacio de trabajo CRM con marca (Prioridad: P1)

**Objetivo**: Envolver cada pantalla en un marco persistente con barra superior, logotipo derivado, barra lateral con módulo activo resaltado y panel de inicio con acciones rápidas y estadísticas.

**Prueba Independiente**: En cada pantalla se ven la barra superior con logotipo y nombre del módulo, la barra lateral con Panel/Clientes/Oportunidades/Buscar, el módulo activo resaltado, la contracción en ventanas estrechas y la conservación de datos al navegar.

### Pruebas para la Historia de Usuario 13

- [X] T043 [P] [US13] Ampliar las pruebas del marco, logotipo, resaltado activo, color de acento y conservación de datos en `tests/integration/workspace-shell.test.js`
- [X] T044 [P] [US13] Ampliar las pruebas del panel, acciones rápidas y estadísticas en vivo en `tests/integration/dashboard.test.js`

### Implementación para la Historia de Usuario 13

- [X] T045 [US13] Implementar `src/components/shell.js` con monograma SVG derivado del nombre del módulo, nombre de marca, botones de módulo etiquetados y resaltado del módulo activo
- [X] T046 [P] [US13] Implementar `src/components/dashboard.js` con las cuatro acciones rápidas y las tarjetas de estadísticas de clientes/oportunidades
- [X] T047 [US13] Aplicar `theme.accentColor` como propiedad CSS `--accent` con retroceso al valor predeterminado si es inválido en `src/app.js`
- [X] T048 [US13] Conectar las acciones rápidas para abrir gestión con formulario limpio, enfocar el primer campo y abrir la búsqueda con entrada enfocada en `src/app.js`
- [X] T049 [US13] Refrescar los recuentos de estadísticas cada vez que se muestra el panel en `src/components/dashboard.js`
- [X] T050 [US13] Verificar que la navegación entre módulos conserva clientes y oportunidades y no reinicia formularios de forma destructiva en `src/app.js`
- [X] T051 [P] [US13] Dar estilo a la barra superior, la barra lateral, las tarjetas del panel y la contracción a columna de iconos con etiquetas accesibles en `src/styles.css`

**Punto de control**: Todas las pantallas se renderizan dentro del marco CRM con marca y el panel funciona como vista inicial.

---

## Fase 9: Historia de Usuario 10 - Registrar los detalles de oportunidades de un cliente (Prioridad: P2)

**Objetivo**: Permitir registrar, editar y eliminar oportunidades de un cliente con integridad referencial y eliminación en cascada.

**Prueba Independiente**: Un usuario añade una oportunidad a un cliente y la ve asociada; editar y eliminar funcionan; eliminar el cliente elimina sus oportunidades.

### Pruebas para la Historia de Usuario 10

- [X] T052 [P] [US10] Ampliar las pruebas unitarias de validación de oportunidades, folio, fechas, importes y cascada en `tests/unit/storage.test.js`
- [X] T053 [P] [US10] Ampliar las pruebas de integración de crear, editar, eliminar y cascada de oportunidades en `tests/integration/add-document.test.js` y `tests/integration/manage-document.test.js`

### Implementación para la Historia de Usuario 10

- [X] T054 [US10] Implementar `validateDocument` con `entity_id` existente, folio entero positivo, fechas válidas y ordenadas, cantidad entera y descuento no mayor que el subtotal en `src/storage.js`
- [X] T055 [US10] Implementar `addDocument`, `updateDocument`, `deleteDocument` y `deleteDocumentsForEntity`, y la cascada desde `deleteEntity`, en `src/storage.js`
- [X] T056 [P] [US10] Construir los campos base del formulario de oportunidad (serie, folio, fechas, cantidad, importes, moneda, condiciones, notas) en `src/components/document-form.js`
- [X] T057 [US10] Conectar crear, editar y eliminar oportunidades con retroalimentación de validación en `src/app.js`
- [X] T058 [US10] Poblar el selector de cliente de la oportunidad y el selector `#edit-document`, mostrando las oportunidades del cliente seleccionado, en `src/app.js`
- [X] T059 [P] [US10] Dar estilo al formulario y al listado de oportunidades en `src/styles.css`

**Punto de control**: Datos maestros (clientes) y oportunidades comerciales están completamente vinculados.

---

## Fase 10: Historia de Usuario 3 - Consultar antecedentes del cliente (Prioridad: P1)

**Objetivo**: Buscar clientes y consultar su ficha con el historial de oportunidades ordenado por fecha, reflejando las actualizaciones.

**Prueba Independiente**: Un ejecutivo busca un cliente, accede a su ficha y revisa su historial de oportunidades ordenado.

### Pruebas para la Historia de Usuario 3

- [X] T060 [P] [US3] Añadir pruebas de integración de ficha de cliente, historial ordenado por fecha y actualización tras cambios en gestión en `tests/integration/client-history.test.js`

### Implementación para la Historia de Usuario 3

- [X] T061 [US3] Implementar en `src/app.js` la ficha de cliente con datos de perfil e historial de oportunidades asociadas
- [X] T062 [US3] Ordenar el historial por fecha de forma descendente y mostrar un estado vacío cuando no haya oportunidades en `src/app.js`
- [X] T063 [US3] Abrir la ficha al seleccionar un cliente desde los resultados de búsqueda en `src/app.js`
- [X] T064 [US3] Releer los datos almacenados al abrir la ficha para reflejar cambios de la pantalla de gestión en `src/app.js`
- [X] T065 [P] [US3] Dar estilo a la ficha y a la línea de tiempo del historial en `src/styles.css`

**Punto de control**: La consulta de antecedentes funciona sobre los datos existentes y permanece consistente.

---

## Fase 11: Historia de Usuario 4 - Gestionar clientes y oportunidades en una pantalla dedicada (Prioridad: P1)

**Objetivo**: Ofrecer una pantalla de gestión dedicada para clientes y oportunidades, sin mostrar la lista de clientes, con confirmación de eliminación en cascada.

**Prueba Independiente**: Un usuario llega a la pantalla de gestión desde la barra lateral o el panel, alterna entre clientes y oportunidades y crea, edita y elimina ambos.

### Pruebas para la Historia de Usuario 4

- [X] T066 [P] [US4] Ampliar las pruebas de la pantalla de gestión (ausencia de lista de clientes, alternancia y CRUD) en `tests/integration/manage-tabs.test.js`
- [X] T067 [P] [US4] Añadir una prueba de confirmación de eliminación que informe del número de oportunidades en cascada en `tests/integration/manage-tabs.test.js`

### Implementación para la Historia de Usuario 4

- [X] T068 [US4] Implementar el panel de gestión de clientes (crear, editar, eliminar) en `src/app.js`
- [X] T069 [US4] Implementar el diálogo de confirmación de eliminación indicando cuántas oportunidades asociadas se eliminarán en `src/app.js`
- [X] T070 [US4] Implementar el panel de gestión de oportunidades (crear, editar, eliminar) en `src/app.js`
- [X] T071 [US4] Garantizar que la pantalla de gestión no renderiza ninguna lista de clientes (sin `#entity-list`) en `index.html` y `src/app.js`
- [X] T072 [P] [US4] Dar estilo a los paneles de gestión y a la confirmación de eliminación en `src/styles.css`

**Punto de control**: La funcionalidad de gestión está disponible en su pantalla dedicada y alterna sin pérdida de datos.

---

## Fase 12: Historia de Usuario 8 - Buscar y encontrar clientes rápidamente (Prioridad: P2)

**Objetivo**: Buscar y filtrar clientes por detalles clave sobre los registros almacenados.

**Prueba Independiente**: Un usuario introduce un término y ve solo los clientes coincidentes; sin coincidencias ve un estado vacío claro.

### Pruebas para la Historia de Usuario 8

- [X] T073 [P] [US8] Ampliar las pruebas unitarias de normalización y coincidencia por nombre, código, categoría, descripción, fecha objetivo y campos personalizados en `tests/unit/storage.test.js`
- [X] T074 [P] [US8] Ampliar las pruebas de integración de coincidencias, estado vacío y rendimiento con 500 registros en `tests/integration/search-entities.test.js`

### Implementación para la Historia de Usuario 8

- [X] T075 [US8] Implementar `searchEntities` con normalización y coincidencia sobre todos los campos declarados en `src/storage.js`
- [X] T076 [US8] Conectar la entrada de búsqueda con resultados y estado vacío en `src/app.js`
- [X] T077 [US8] Mantener los resultados sincronizados tras crear, editar o eliminar en `src/app.js`

**Punto de control**: La búsqueda funciona de forma independiente sobre los datos existentes.

---

## Fase 13: Historia de Usuario 9 - Registrar una fecha objetivo (Prioridad: P2)

**Objetivo**: Adjuntar una fecha objetivo opcional a un cliente y mostrarla en los listados/ficha.

**Prueba Independiente**: Un usuario fija una fecha, la guarda y la ve; dejarla en blanco no impide guardar.

### Pruebas para la Historia de Usuario 9

- [X] T078 [P] [US9] Ampliar las pruebas de validación, persistencia y búsqueda de la fecha objetivo en `tests/unit/storage.test.js` e `tests/integration/create-entity.test.js`

### Implementación para la Historia de Usuario 9

- [X] T079 [US9] Añadir la entrada de fecha objetivo con su zona de error al formulario de cliente en `src/components/entity-form.js`
- [X] T080 [US9] Validar la fecha objetivo como fecha de calendario válida y opcional en `src/storage.js`
- [X] T081 [US9] Conectar la fecha objetivo al envío, al poblado de edición y a su visualización en listas y ficha en `src/app.js`

**Punto de control**: La fecha objetivo funciona y es visible de un vistazo.

---

## Fase 14: Historia de Usuario 11 - Buscar clientes en una pantalla dedicada (Prioridad: P2)

**Objetivo**: Ofrecer una pantalla de búsqueda dedicada accesible desde la barra lateral y el panel.

**Prueba Independiente**: Un usuario abre la pantalla de búsqueda, busca, ve resultados o estado vacío y vuelve al panel.

### Pruebas para la Historia de Usuario 11

- [X] T082 [P] [US11] Añadir pruebas de navegación a/desde la pantalla de búsqueda, enfoque de la entrada y retorno al panel en `tests/integration/search-screen.test.js`

### Implementación para la Historia de Usuario 11

- [X] T083 [US11] Renderizar los resultados y el estado vacío de la pantalla de búsqueda en `src/app.js`
- [X] T084 [US11] Conectar `#nav-search` y la acción rápida de búsqueda enfocando `#search-input` en `src/app.js`
- [X] T085 [P] [US11] Dar estilo a la pantalla de búsqueda y a sus resultados en `src/styles.css`

**Punto de control**: La búsqueda dedicada funciona sin interferir con la gestión.

---

## Fase 15: Historia de Usuario 12 - Configurar el ciclo de vida de estados de oportunidades (Prioridad: P2)

**Objetivo**: Aplicar estados y transiciones del embudo comercial CRM (Prospecto, Contactado, Propuesta Enviada, Negociación, Cerrada Ganada, Cerrada Perdida), manteniendo el estado de texto libre cuando no hay configuración.

**Prueba Independiente**: Con el embudo configurado solo se ofrecen estados alcanzables, las transiciones inválidas se rechazan y el estado es visible de un vistazo; sin configuración el estado es texto libre.

### Pruebas para la Historia de Usuario 12

- [X] T086 [P] [US12] Ampliar las pruebas de transiciones válidas/inválidas, estado libre y rechazo al actualizar en `tests/unit/storage.test.js` y `tests/integration/manage-document.test.js`

### Implementación para la Historia de Usuario 12

- [X] T087 [US12] Implementar la validación de estados y transiciones permitidas en `validateDocument`/`updateDocument`, rechazando transiciones inválidas con explicación, en `src/storage.js`
- [X] T088 [US12] Renderizar un selector con los estados alcanzables al editar y todos los estados al crear, o una entrada de texto libre sin ciclo de vida, en `src/components/document-form.js`
- [X] T089 [US12] Mostrar el estado actual como insignia en resultados de búsqueda y ficha en `src/app.js`
- [X] T090 [P] [US12] Dar estilo a la insignia de estado en `src/styles.css`

**Punto de control**: La cadena de personalización CRM (US5 → US6/US7/US12) está completa de extremo a extremo.

---

## Fase 16: Pulido y Preocupaciones Transversales

**Propósito**: Calidad, accesibilidad, seguridad, rendimiento y regresión en todas las historias.

- [X] T091 [P] Añadir refinamientos de accesibilidad: etiquetas asociadas, foco de teclado, `aria-current`, roles y estructura semántica en `index.html`, `src/app.js` y `src/styles.css`
- [X] T092 [P] Unificar estados vacíos, de error y de éxito y los mensajes de validación en `src/app.js` y `src/styles.css`
- [X] T093 [P] Añadir pruebas unitarias del saneamiento XSS y verificar su uso en formularios, listas y ficha en `tests/unit/sanitize.test.js` y `src/utils/sanitize.js`
- [X] T094 Verificar el rendimiento de listas, selectores y búsqueda con 500 clientes y corregir cuellos de botella en `src/app.js` y `src/storage.js`
- [X] T095 [P] Actualizar `README.md` con la configuración del módulo CRM, el marco del espacio de trabajo y la extensibilidad
- [X] T096 [P] Añadir pruebas de regresión de las aclaraciones 2026-11-01 (código único, confirmación con recuento, fallback con advertencia, retención de huérfanos, estado de texto libre) en `tests/unit/` y `tests/integration/`
- [X] T097 Eliminar código y referencias obsoletas en `src/` e `index.html`
- [X] T098 Ejecutar `npm test` y corregir cualquier regresión en las pruebas existentes
- [X] T099 Ejecutar `npm run build` y corregir cualquier error de construcción
- [X] T100 Ejecutar los escenarios de `specs/001-erp-base-module/quickstart.md` de extremo a extremo

---

## Dependencias y Orden de Ejecución

### Dependencias entre Fases

- Configuración (Fase 1): Sin dependencias
- Fundacional (Fase 2): Depende de completar Configuración
- US5 (Fase 3): Depende de Fundacional; desbloquea US6, US7, US12 y el marco de US13
- US1 (Fase 4): Depende de Fundacional; es la base de todas las historias de clientes
- US2 (Fase 5): Depende de US1 y de las operaciones de oportunidad de US10
- US6 (Fase 6): Depende de US5 y de las pantallas de US1
- US7 (Fase 7): Depende de US5 y de los formularios de US1/US10
- US13 (Fase 8): Depende de US5 (nombre, etiquetas, color) y del enrutador fundacional
- US10 (Fase 9): Depende de US1 (`entity_id`); habilita US2, US3 y US4
- US3 (Fase 10): Depende de US2, US8 y US10
- US4 (Fase 11): Depende de US1, US10 y US13
- US8 (Fase 12): Depende de US1 y de los campos personalizados de US7
- US9 (Fase 13): Depende de US1
- US11 (Fase 14): Depende de US8 y US13
- US12 (Fase 15): Depende de US5 y US10
- Pulido (Fase 16): Depende de todas las historias deseadas

### Oportunidades Paralelas

- T002, T003, T004, T005, T007 y T008 pueden ejecutarse en paralelo en las fases iniciales
- En cada historia, las tareas de prueba marcadas `[P]` pueden ejecutarse en paralelo
- Los componentes `entity-form.js` y `document-form.js` pueden construirse en paralelo
- US6 y US7 pueden avanzar en paralelo tras US5
- US8 y US9 pueden avanzar en paralelo tras US1/US7
- US11 puede avanzar en paralelo con US12 una vez completadas sus dependencias
- En la Fase 16, T091, T092, T093, T095 y T096 pueden ejecutarse en paralelo antes de T098 y T099

---

## Estrategia de Implementación

### MVP Primero (Historias de Usuario 5 y 1)

1. Completar Fase 1: Configuración
2. Completar Fase 2: Fundacional (CRÍTICO)
3. Completar Fase 3: US5 (configuración CRM)
4. Completar Fase 4: US1 (clientes)
5. DETENERSE y VALIDAR: Configuración cargada y cliente creado con `code` único
6. Desplegar/demostrar si está listo

### Entrega Incremental

1. Configuración + Fundacional → base lista
2. US5 → US1 → Probar → Desplegar (MVP)
3. US2 → US6 → US7 → US13 (registro, personalización y marco CRM)
4. US10 → US3 → US4 (oportunidades, ficha y gestión dedicada)
5. US8 → US9 → US11 → US12 (recuperación y embudo comercial)
6. Pulido y regresión

---

## Notas

- `[P]` indica archivos distintos y sin dependencias pendientes
- `[US#]` traza la tarea a la historia de usuario correspondiente
- Las tareas de prueba se incluyen por mandato de la Constitución (Principio II)
- Verificar que las pruebas fallan antes de implementar
- Confirmar con `npm test` y `npm run build` antes de cerrar cada fase
- Los identificadores técnicos internos (`entity_id`, claves de almacenamiento, nombres de componentes/IDs como `#view-entities`, `#view-documents`, `entity-form.js`) se mantienen para no romper compatibilidad de código/pruebas; la terminología de dominio se adapta vía configuración/etiquetas
