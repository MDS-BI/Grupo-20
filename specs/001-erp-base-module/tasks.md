# Tareas: MÃ³dulo Base de Software de PlanificaciÃ³n de Recursos Empresariales (ERP)

**Entrada**: Documentos de diseÃ±o desde `/specs/001-erp-base-module/`
**Prerrequisitos**: plan.md (obligatorio), spec.md (obligatorio para las historias de usuario), research.md, data-model.md, contracts/, quickstart.md
**Aclaraciones aplicadas**: sesiÃ³n 2026-11-01 (cÃ³digo Ãºnico, estado de texto libre, fallback con advertencia, retenciÃ³n de campos huÃ©rfanos, confirmaciÃ³n de eliminaciÃ³n) y sesiÃ³n 2026-11-12 (identificaciÃ³n de documentos pendientes sin ciclo de vida; campos base de documento)

**Pruebas**: Incluidas porque la ConstituciÃ³n (Principio II) exige cobertura automatizada del comportamiento visible y de la lÃ³gica de negocio. La suite base ya existe en `tests/unit/` y `tests/integration/`; las tareas de prueba amplÃ­an esa suite para cubrir huecos, no la duplican.

**OrganizaciÃ³n**: Las tareas se agrupan por historia de usuario para permitir implementaciÃ³n y prueba independientes. Las fases estÃ¡n ordenadas de modo que cada historia se implementa despuÃ©s de las historias de las que depende.

## Formato: `[ID] [P?] [Historia] DescripciÃ³n`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Historia]**: Historia de usuario a la que pertenece la tarea (US1, US2, ...)
- Cada tarea incluye la ruta de archivo exacta

## Convenciones de Rutas

- Proyecto Ãºnico: `index.html`, `src/`, `tests/` en la raÃ­z del repositorio
- Pruebas unitarias en `tests/unit/`; integraciÃ³n en `tests/integration/`
- Componentes de interfaz en `src/components/`; utilidades en `src/utils/`

---

## Fase 1: ConfiguraciÃ³n (Infraestructura Compartida)

**PropÃ³sito**: Inicializar la aplicaciÃ³n Vite, el documento raÃ­z y los estilos base.

- [X] T001 Crear `index.html` con el marco del espacio de trabajo (barra superior, barra lateral y contenedor de contenido) y las cuatro regiones de pantalla `#view-dashboard`, `#view-entities`, `#view-documents` y `#view-search`, incluyendo los identificadores que consumen las pruebas en `tests/integration/`
- [X] T002 [P] Verificar y ajustar scripts `dev`, `build`, `preview` y `test`, ademÃ¡s del entorno jsdom de Vitest, en `package.json` y `vitest.config.mjs`
- [X] T003 [P] Crear el punto de entrada de la aplicaciÃ³n que importa los estilos y arranca el mÃ³dulo en `src/main.js`
- [X] T004 [P] Definir los tokens de diseÃ±o (incluida `--accent`), la tipografÃ­a base, el layout de dos columnas y los estilos compartidos de formularios y botones en `src/styles.css`

---

## Fase 2: Fundacional (Prerrequisitos Bloqueantes)

**PropÃ³sito**: Infraestructura de almacenamiento, saneamiento, bÃºsqueda y navegaciÃ³n de la que dependen todas las historias.

**CRÃTICO**: Ninguna historia de usuario puede comenzar hasta completar esta fase.

- [X] T005 [P] Definir las claves de localStorage y los ayudantes de lectura/escritura de listas y `clearAll()` en `src/storage.js`
- [X] T006 Implementar en `src/storage.js` la generaciÃ³n de `id` y `entity_id` Ãºnicos, las marcas de tiempo `createdAt`/`updatedAt` y la carga/guardado de entidades y documentos
- [X] T007 [P] Implementar el saneamiento de texto introducido por el usuario para prevenir XSS (`escapeHtml`) en `src/utils/sanitize.js`
- [X] T008 [P] Implementar la normalizaciÃ³n de texto para bÃºsqueda (minÃºsculas, sin tildes ni espacios redundantes) y la coincidencia por campos en `src/utils/search.js`
- [X] T009 Implementar el enrutador interno de vistas (`showView`, ocultamiento de las demÃ¡s, resaltado del mÃ³dulo activo con `aria-current="page"`) y las exportaciones `boot`/`initApp` en `src/app.js`
- [X] T010 Implementar en `src/app.js` los ayudantes compartidos de validaciÃ³n visual: mostrar/limpiar errores por campo, enfocar el primer campo invÃ¡lido y retroalimentaciÃ³n de Ã©xito

**Punto de control**: La base estÃ¡ lista; las historias pueden comenzar.

---

## Fase 3: Historia de Usuario 5 - Definir un perfil de configuraciÃ³n del mÃ³dulo (Prioridad: P1)

**Objetivo**: Cargar `src/module-config.js` con valores predeterminados seguros, validaciÃ³n completa y fallback con advertencia visible ante configuraciÃ³n invÃ¡lida.

**Prueba Independiente**: Una configuraciÃ³n de Ventas se presenta en la aplicaciÃ³n; sin configuraciÃ³n se usan los valores predeterminados; una configuraciÃ³n invÃ¡lida arranca con predeterminados y muestra una advertencia visible.

### Pruebas para la Historia de Usuario 5

- [X] T011 [P] [US5] Ampliar las pruebas de fallback, tipos de campo, colisiones, ciclo de vida y tema en `tests/unit/module-config.test.js`
- [X] T012 [P] [US5] AÃ±adir una prueba de integraciÃ³n que verifique la advertencia visible y el arranque con predeterminados ante configuraciÃ³n invÃ¡lida en `tests/integration/config-warning.test.js`

### ImplementaciÃ³n para la Historia de Usuario 5

- [X] T013 [US5] Definir `DEFAULT_CONFIG`, `BASE_FIELDS` y `FIELD_TYPES` en `src/module-config.js`
- [X] T014 [US5] Implementar `normalizeConfig` con validaciÃ³n de `moduleName`, `labels`, `customFields` (tipo, colisiÃ³n con campos base, duplicados, `options` en select), `statusLifecycle` y `theme.accentColor` en `src/module-config.js`
- [X] T015 [US5] Implementar `loadModuleConfig`, `setActiveConfig`, `getConfig` y `labelFor` con retroceso a Entidad/Documento en `src/module-config.js`
- [X] T016 [US5] Renderizar una advertencia visible y no bloqueante cuando la configuraciÃ³n sea invÃ¡lida en `index.html` y `src/app.js`
- [X] T017 [P] [US5] Dar estilo al aviso de configuraciÃ³n invÃ¡lida en `src/styles.css`

**Punto de control**: La configuraciÃ³n se carga de forma fiable, valida limpiamente y nunca bloquea la aplicaciÃ³n.

---

## Fase 4: Historia de Usuario 1 - Definir datos compatibles con el ERP (Prioridad: P1)

**Objetivo**: Establecer el modelo de entidad con identificador pÃºblico Ãºnico, validaciÃ³n de `code` Ãºnico y creaciÃ³n persistente.

**Prueba Independiente**: Un analista registra una entidad de prueba, el sistema la guarda con `entity_id` Ãºnico y rechaza un `code` repetido con un mensaje claro.

### Pruebas para la Historia de Usuario 1

- [X] T018 [P] [US1] Ampliar las pruebas unitarias de validaciÃ³n, generaciÃ³n de `entity_id` y rechazo de `code` duplicado (sin distinguir mayÃºsculas ni espacios) en `tests/unit/storage.test.js`
- [X] T019 [P] [US1] Ampliar la prueba de integraciÃ³n para rechazar un `code` duplicado con explicaciÃ³n en `tests/integration/create-entity.test.js`

### ImplementaciÃ³n para la Historia de Usuario 1

- [X] T020 [US1] Implementar `validateEntity` con nombre y cÃ³digo obligatorios, recorte de textos base y validaciÃ³n genÃ©rica de campos personalizados (p. ej. formato de correo y `creditLimit` no negativo cuando el mÃ³dulo los declare) en `src/storage.js`
- [X] T021 [US1] Implementar `addEntity`, `updateEntity` y `deleteEntity` preservando `id`/`entity_id`, actualizando `updatedAt` y aplicando unicidad de `code` en `src/storage.js`
- [X] T022 [P] [US1] Construir los campos base del formulario de entidad con sus identificadores y zonas de error en `src/components/entity-form.js`
- [X] T023 [US1] Conectar el envÃ­o del formulario de entidad con creaciÃ³n/actualizaciÃ³n y retroalimentaciÃ³n de validaciÃ³n en `src/app.js`
- [X] T024 [US1] Poblar el selector `#edit-entity` con los registros almacenados y limpiar el formulario tras guardar en `src/app.js`
- [X] T025 [P] [US1] Dar estilo a los campos, errores y estados de foco del formulario de entidad en `src/styles.css`

**Punto de control**: La Historia de Usuario 1 funciona y se prueba de forma independiente (MVP).

---

## Fase 5: Historia de Usuario 11 - Registrar los detalles de documentos de una entidad (Prioridad: P2)

**Objetivo**: Permitir registrar, editar y eliminar documentos de una entidad con integridad referencial y eliminaciÃ³n en cascada.

**Prueba Independiente**: Un usuario aÃ±ade un documento a una entidad y lo ve asociado; editar y eliminar funcionan; eliminar la entidad elimina sus documentos.

### Pruebas para la Historia de Usuario 11

- [X] T026 [P] [US11] Ampliar las pruebas unitarias de validaciÃ³n de documentos (fechas ordenadas, `notes`), campos personalizados y cascada en `tests/unit/storage.test.js`
- [X] T027 [P] [US11] Ampliar las pruebas de integraciÃ³n de crear, editar, eliminar y cascada de documentos en `tests/integration/add-document.test.js` y `tests/integration/manage-document.test.js`

### ImplementaciÃ³n para la Historia de Usuario 11

- [X] T028 [US11] Implementar `validateDocument` con `entity_id` existente, `startDate`/`endDate` vÃ¡lidas y ordenadas, `notes` opcional y validaciÃ³n genÃ©rica de campos personalizados (p. ej. `folio` entero positivo y `discount` no mayor que `subtotal` cuando el mÃ³dulo los declare) en `src/storage.js`
- [X] T029 [US11] Implementar `addDocument`, `updateDocument`, `deleteDocument` y `deleteDocumentsForEntity`, y la cascada desde `deleteEntity`, en `src/storage.js`
- [X] T030 [P] [US11] Construir los campos base del formulario de documento (`startDate`, `endDate`, `notes`, `status`) y los campos personalizados declarados (p. ej. serie, folio, importes, moneda, condiciones) en `src/components/document-form.js`
- [X] T031 [US11] Conectar crear, editar y eliminar documentos con retroalimentaciÃ³n de validaciÃ³n en `src/app.js`
- [X] T032 [US11] Poblar el selector de entidad del documento y el selector `#edit-document`, mostrando los documentos de la entidad seleccionada, en `src/app.js`
- [X] T033 [P] [US11] Dar estilo al formulario y al listado de documentos en `src/styles.css`

**Punto de control**: Datos maestros y documentos transaccionales estÃ¡n completamente vinculados.

---

## Fase 6: Historia de Usuario 2 - Registrar clientes y contactos comerciales (Prioridad: P2)

**Objetivo**: Registrar entidades y sus documentos/interacciones desde la interfaz, con validaciÃ³n clara.

**Prueba Independiente**: Un ejecutivo registra una entidad y un documento asociado; ambos quedan guardados y visibles en la ficha de la entidad.

### Pruebas para la Historia de Usuario 2

- [X] T034 [P] [US2] AÃ±adir una prueba de integraciÃ³n de registro de entidad con documento asociado visible en su ficha en `tests/integration/register-client.test.js`

### ImplementaciÃ³n para la Historia de Usuario 2

- [X] T035 [US2] Renderizar en `src/app.js` los registros guardados en los selectores de ediciÃ³n y los documentos vinculados en la ficha de la entidad
- [X] T036 [US2] Unificar la retroalimentaciÃ³n de campos obligatorios y cÃ³digos repetidos entre ambos formularios en `src/app.js`
- [X] T037 [US2] Asociar cada documento al `entity_id` seleccionado al guardar y refrescar la vista tras el cambio en `src/app.js`
- [X] T038 [P] [US2] Dar estilo a la ficha y a la lista de documentos vinculados en `src/styles.css`

**Punto de control**: Registrar entidades y contactos funciona de extremo a extremo.

---

## Fase 7: Historia de Usuario 7 - Reetiquetar pantallas desde la configuraciÃ³n (Prioridad: P1)

**Objetivo**: Derivar todas las etiquetas visibles de la configuraciÃ³n del mÃ³dulo.

**Prueba Independiente**: Con Entidadâ†’Cliente y Documentoâ†’Pedido de Venta, todas las pestaÃ±as, botones, etiquetas, encabezados y estados vacÃ­os usan los tÃ©rminos mapeados sin alterar la navegaciÃ³n.

### Pruebas para la Historia de Usuario 7

- [X] T039 [P] [US7] Ampliar las pruebas de etiquetado en todas las pantallas y en `document.title` en `tests/integration/relabeling.test.js`

### ImplementaciÃ³n para la Historia de Usuario 7

- [X] T040 [US7] Sustituir el texto fijo por `labelFor` en `index.html`, `src/app.js` y `src/components/`
- [X] T041 [US7] Aplicar los tÃ©rminos configurados a encabezados, botones, etiquetas de formulario, mensajes y estados vacÃ­os en `src/app.js` y `src/components/`
- [X] T042 [US7] Actualizar `document.title`, `#brand-name` y los botones de la barra lateral desde la configuraciÃ³n en `src/app.js` y `src/components/shell.js`

**Punto de control**: Un mÃ³dulo configurado se presenta completamente bajo su propia terminologÃ­a.

---

## Fase 8: Historia de Usuario 8 - Declarar campos personalizados para los registros (Prioridad: P1)

**Objetivo**: Hacer que los campos personalizados fluyan por formularios, validaciÃ³n, persistencia, listas y bÃºsqueda, conservando los valores huÃ©rfanos.

**Prueba Independiente**: Un campo numÃ©rico obligatorio se renderiza como entrada numÃ©rica, bloquea guardados en blanco, aparece en listas y coincide en bÃºsquedas; al retirarlo de la configuraciÃ³n sus valores se conservan ocultos y reaparecen al redeclararlo.

### Pruebas para la Historia de Usuario 8

- [X] T043 [P] [US8] Ampliar las pruebas unitarias de validaciÃ³n por tipo, opciones de select y retenciÃ³n de valores huÃ©rfanos en `tests/unit/storage.test.js`
- [X] T044 [P] [US8] Ampliar las pruebas de integraciÃ³n de renderizado, bÃºsqueda y ocultaciÃ³n/restauraciÃ³n de campos personalizados en `tests/integration/custom-fields.test.js`

### ImplementaciÃ³n para la Historia de Usuario 8

- [X] T045 [US8] Renderizar dinÃ¡micamente los campos personalizados segÃºn su tipo (`text`, `number`, `date`, `select`) en `src/components/entity-form.js` y `src/components/document-form.js`
- [X] T046 [US8] Validar campos personalizados obligatorios, de tipo correcto y con opciones vÃ¡lidas en `src/storage.js`
- [X] T047 [US8] Persistir los valores personalizados junto a los campos base sin cambios de esquema en `src/storage.js`
- [X] T048 [US8] Mostrar los valores personalizados con su etiqueta en listas, ficha y resultados de bÃºsqueda en `src/app.js`
- [X] T049 [US8] Conservar en el almacenamiento los valores no declarados, ocultarlos de la interfaz y restaurarlos al redeclarar el campo en `src/storage.js` y `src/app.js`
- [X] T050 [P] [US8] Dar estilo a los bloques de campos personalizados y a sus errores en `src/styles.css`

**Punto de control**: Los datos especÃ­ficos del mÃ³dulo requieren cero cambios de cÃ³digo de interfaz y no se pierden al evolucionar la configuraciÃ³n.

---

## Fase 9: Historias de Usuario 14 y 15 - Marco de espacio de trabajo ERP con marca y panel de inicio (Prioridad: P1)

**Objetivo**: Envolver cada pantalla en un marco persistente con barra superior, logotipo derivado, barra lateral con mÃ³dulo activo resaltado y panel de inicio con acciones rÃ¡pidas y estadÃ­sticas.

**Prueba Independiente**: En cada pantalla se ven la barra superior con logotipo y nombre del mÃ³dulo, la barra lateral con Panel/Entidades/Documentos/Buscar, el mÃ³dulo activo resaltado, la contracciÃ³n en ventanas estrechas y la conservaciÃ³n de datos al navegar; el panel muestra cuatro acciones rÃ¡pidas y estadÃ­sticas en vivo.

### Pruebas para las Historias de Usuario 14 y 15

- [X] T051 [P] [US14] Ampliar las pruebas del marco, logotipo, resaltado activo, color de acento y conservaciÃ³n de datos en `tests/integration/workspace-shell.test.js`
- [X] T052 [P] [US15] Ampliar las pruebas del panel, acciones rÃ¡pidas y estadÃ­sticas en vivo en `tests/integration/dashboard.test.js`

### ImplementaciÃ³n para las Historias de Usuario 14 y 15

- [X] T053 [US14] Implementar `src/components/shell.js` con monograma SVG derivado del nombre del mÃ³dulo, nombre de marca, botones de mÃ³dulo etiquetados y resaltado del mÃ³dulo activo
- [X] T054 [P] [US15] Implementar `src/components/dashboard.js` con las cuatro acciones rÃ¡pidas y las tarjetas de estadÃ­sticas de entidades/documentos
- [X] T055 [US14] Aplicar `theme.accentColor` como propiedad CSS `--accent` con retroceso al valor predeterminado si es invÃ¡lido en `src/app.js`
- [X] T056 [US15] Conectar las acciones rÃ¡pidas para abrir gestiÃ³n con formulario limpio, enfocar el primer campo y abrir la bÃºsqueda con entrada enfocada en `src/app.js`
- [X] T057 [US15] Refrescar los recuentos de estadÃ­sticas cada vez que se muestra el panel en `src/components/dashboard.js`
- [X] T058 [US14] Verificar que la navegaciÃ³n entre mÃ³dulos conserva entidades y documentos y no reinicia formularios de forma destructiva en `src/app.js`
- [X] T059 [P] [US14] Dar estilo a la barra superior, la barra lateral, las tarjetas del panel y la contracciÃ³n a columna de iconos con etiquetas accesibles en `src/styles.css`

**Punto de control**: Todas las pantallas se renderizan dentro del marco con marca y el panel funciona como vista inicial.

---

## Fase 10: Historia de Usuario 9 - Buscar y encontrar entidades rÃ¡pidamente (Prioridad: P2)

**Objetivo**: Buscar y filtrar entidades por detalles clave sobre los registros almacenados.

**Prueba Independiente**: Un usuario introduce un tÃ©rmino y ve solo las entidades coincidentes; sin coincidencias ve un estado vacÃ­o claro y puede reintentar.

### Pruebas para la Historia de Usuario 9

- [X] T060 [P] [US9] Ampliar las pruebas unitarias de normalizaciÃ³n y coincidencia por nombre, cÃ³digo, categorÃ­a, descripciÃ³n, fecha objetivo y campos personalizados en `tests/unit/storage.test.js`
- [X] T061 [P] [US9] Ampliar las pruebas de integraciÃ³n de coincidencias, estado vacÃ­o y rendimiento con 500 registros en `tests/integration/search-entities.test.js`

### ImplementaciÃ³n para la Historia de Usuario 9

- [X] T062 [US9] Implementar `searchEntities` con normalizaciÃ³n y coincidencia sobre todos los campos declarados en `src/storage.js`
- [X] T063 [US9] Conectar la entrada de bÃºsqueda con resultados y estado vacÃ­o en `src/app.js`
- [X] T064 [US9] Mantener los resultados sincronizados tras crear, editar o eliminar en `src/app.js`

**Punto de control**: La bÃºsqueda funciona de forma independiente sobre los datos existentes.

---

## Fase 11: Historia de Usuario 10 - Registrar una fecha objetivo (Prioridad: P2)

**Objetivo**: Adjuntar una fecha objetivo opcional a una entidad y mostrarla en los listados.

**Prueba Independiente**: Un usuario fija una fecha, la guarda y la ve en la lista; dejarla en blanco no impide guardar.

### Pruebas para la Historia de Usuario 10

- [X] T065 [P] [US10] Ampliar las pruebas de validaciÃ³n, persistencia y bÃºsqueda de la fecha objetivo en `tests/unit/storage.test.js` e `tests/integration/create-entity.test.js`

### ImplementaciÃ³n para la Historia de Usuario 10

- [X] T066 [US10] AÃ±adir la entrada de fecha objetivo con su zona de error al formulario de entidad en `src/components/entity-form.js`
- [X] T067 [US10] Validar la fecha objetivo como fecha de calendario vÃ¡lida y opcional en `src/storage.js`
- [X] T068 [US10] Conectar la fecha objetivo al envÃ­o, al poblado de ediciÃ³n y a su visualizaciÃ³n en listas y ficha en `src/app.js`

**Punto de control**: La fecha objetivo funciona y es visible de un vistazo.

---

## Fase 12: Historia de Usuario 12 - Buscar entidades en una pantalla dedicada (Prioridad: P2)

**Objetivo**: Ofrecer una pantalla de bÃºsqueda dedicada accesible desde la barra lateral y el panel.

**Prueba Independiente**: Un usuario abre la pantalla de bÃºsqueda, busca, ve resultados o estado vacÃ­o y vuelve al panel sin formularios de ediciÃ³n.

### Pruebas para la Historia de Usuario 12

- [X] T069 [P] [US12] AÃ±adir pruebas de navegaciÃ³n a/desde la pantalla de bÃºsqueda, enfoque de la entrada y retorno al panel en `tests/integration/search-screen.test.js`

### ImplementaciÃ³n para la Historia de Usuario 12

- [X] T070 [US12] Renderizar los resultados y el estado vacÃ­o de la pantalla de bÃºsqueda en `src/app.js`
- [X] T071 [US12] Conectar `#nav-search` y la acciÃ³n rÃ¡pida de bÃºsqueda enfocando `#search-input` en `src/app.js`
- [X] T072 [P] [US12] Dar estilo a la pantalla de bÃºsqueda y a sus resultados en `src/styles.css`

**Punto de control**: La bÃºsqueda dedicada funciona sin interferir con la gestiÃ³n.

---

## Fase 13: Historia de Usuario 3 - Consultar antecedentes del cliente (Prioridad: P1)

**Objetivo**: Buscar entidades y consultar su ficha con el historial de documentos ordenado por fecha, reflejando las actualizaciones de la pantalla de gestiÃ³n.

**Prueba Independiente**: Un ejecutivo busca una entidad, accede a su ficha y revisa su historial de documentos ordenado, verificando que refleja los registros creados y las actualizaciones realizadas.

### Pruebas para la Historia de Usuario 3

- [X] T073 [P] [US3] AÃ±adir pruebas de integraciÃ³n de ficha de entidad, historial ordenado por fecha y actualizaciÃ³n tras cambios en gestiÃ³n en `tests/integration/client-history.test.js`

### ImplementaciÃ³n para la Historia de Usuario 3

- [X] T074 [US3] Implementar en `src/app.js` la ficha de entidad con datos de perfil e historial de documentos asociados
- [X] T075 [US3] Ordenar el historial por fecha de forma descendente y mostrar un estado vacÃ­o cuando no haya documentos en `src/app.js`
- [X] T076 [US3] Abrir la ficha al seleccionar una entidad desde los resultados de bÃºsqueda en `src/app.js`
- [X] T077 [US3] Releer los datos almacenados al abrir la ficha para reflejar cambios de la pantalla de gestiÃ³n en `src/app.js`
- [X] T078 [P] [US3] Dar estilo a la ficha y a la lÃ­nea de tiempo del historial en `src/styles.css`

**Punto de control**: La consulta de antecedentes funciona sobre los datos existentes y permanece consistente.

---

## Fase 14: Historia de Usuario 4 - Gestionar entidades y documentos en una pantalla dedicada (Prioridad: P1)

**Objetivo**: Ofrecer una pantalla de gestiÃ³n dedicada para entidades y documentos, sin mostrar la lista de entidades, con confirmaciÃ³n de eliminaciÃ³n en cascada.

**Prueba Independiente**: Un usuario llega a la pantalla de gestiÃ³n desde la barra lateral o el panel, alterna entre entidades y documentos y crea, edita y elimina ambos.

### Pruebas para la Historia de Usuario 4

- [X] T079 [P] [US4] Ampliar las pruebas de la pantalla de gestiÃ³n (ausencia de lista de entidades, alternancia y CRUD) en `tests/integration/manage-tabs.test.js`
- [X] T080 [P] [US4] AÃ±adir una prueba de confirmaciÃ³n de eliminaciÃ³n que informe del nÃºmero de documentos en cascada en `tests/integration/manage-tabs.test.js`

### ImplementaciÃ³n para la Historia de Usuario 4

- [X] T081 [US4] Implementar el panel de gestiÃ³n de entidades (crear, editar, eliminar) en `src/app.js`
- [X] T082 [US4] Implementar el diÃ¡logo de confirmaciÃ³n de eliminaciÃ³n indicando cuÃ¡ntos documentos asociados se eliminarÃ¡n en `src/app.js`
- [X] T083 [US4] Implementar el panel de gestiÃ³n de documentos (crear, editar, eliminar) en `src/app.js`
- [X] T084 [US4] Garantizar que la pantalla de gestiÃ³n no renderiza ninguna lista de entidades (sin `#entity-list`) en `index.html` y `src/app.js`
- [X] T085 [P] [US4] Dar estilo a los paneles de gestiÃ³n y a la confirmaciÃ³n de eliminaciÃ³n en `src/styles.css`

**Punto de control**: La funcionalidad de gestiÃ³n estÃ¡ disponible en su pantalla dedicada y alterna sin pÃ©rdida de datos.

---

## Fase 15: Historia de Usuario 13 - Configurar el ciclo de vida de estados de documentos (Prioridad: P2)

**Objetivo**: Aplicar estados y transiciones configurados, manteniendo el estado de texto libre cuando no hay configuraciÃ³n.

**Prueba Independiente**: Con cotizaciÃ³nâ†’pedidoâ†’facturado solo se ofrecen estados alcanzables, las transiciones invÃ¡lidas se rechazan y el estado es visible de un vistazo; sin configuraciÃ³n el estado es texto libre.

### Pruebas para la Historia de Usuario 13

- [X] T086 [P] [US13] Ampliar las pruebas de transiciones vÃ¡lidas/invÃ¡lidas, estado libre y rechazo al actualizar en `tests/unit/storage.test.js` y `tests/integration/manage-document.test.js`

### ImplementaciÃ³n para la Historia de Usuario 13

- [X] T087 [US13] Implementar la validaciÃ³n de estados y transiciones permitidas en `validateDocument`/`updateDocument`, rechazando transiciones invÃ¡lidas con explicaciÃ³n, en `src/storage.js`
- [X] T088 [US13] Renderizar un selector con los estados alcanzables al editar y todos los estados al crear, o una entrada de texto libre sin ciclo de vida, en `src/components/document-form.js`
- [X] T089 [US13] Mostrar el estado actual como insignia en resultados de bÃºsqueda y ficha en `src/app.js`
- [X] T090 [P] [US13] Dar estilo a la insignia de estado en `src/styles.css`

**Punto de control**: La cadena de personalizaciÃ³n (US5 â†’ US7/US8/US13) estÃ¡ completa de extremo a extremo.

---

## Fase 16: Historia de Usuario 6 - Consultar indicadores de GestiÃ³n Comercial (Prioridad: P1)

**Objetivo**: Ofrecer un resumen de indicadores con el total de entidades, el total de documentos y los documentos pendientes por entidad, actualizado en cada cambio y con selecciÃ³n para abrir la ficha.

**Prueba Independiente**: Un usuario abre el resumen y comprueba que los totales y los pendientes por entidad coinciden con los registros; al crear o completar un documento pendiente los indicadores se actualizan, el estado vacÃ­o muestra ceros y puede seleccionar una entidad para abrir su ficha.

### Pruebas para la Historia de Usuario 6

- [X] T091 [P] [US6] Ampliar las pruebas unitarias de la agregaciÃ³n de indicadores (total de entidades, total de documentos y documentos pendientes por `entity_id`, usando el `statusLifecycle` configurado o, sin ciclo de vida, la coincidencia normalizada de `status` con `pendiente`) en `tests/unit/storage.test.js`
- [X] T092 [P] [US6] Ampliar las pruebas de integraciÃ³n del resumen: totales, pendientes por entidad, estado vacÃ­o en ceros, actualizaciÃ³n tras crear/editar/eliminar y apertura de la ficha desde la lista de pendientes en `tests/integration/commercial-summary.test.js`

### ImplementaciÃ³n para la Historia de Usuario 6

- [X] T093 [US6] Implementar `computeSummary` en `src/storage.js` con los totales de entidades/documentos y los documentos pendientes agrupados por `entity_id`, determinados por el estado configurado o, sin ciclo de vida, por coincidencia normalizada de `status` con `pendiente` (FR-044, SC-011)
- [X] T094 [US6] Implementar `src/components/commercial-summary.js` para renderizar las tarjetas de indicadores, la lista de pendientes por entidad, el estado vacÃ­o con ceros e indicaciones y la acciÃ³n de abrir la ficha de la entidad seleccionada (FR-041, FR-046)
- [X] T095 [US6] Conectar la vista `summary` en `src/app.js` y `src/components/shell.js` para refrescar los indicadores al mostrarse y tras cada creaciÃ³n, ediciÃ³n o eliminaciÃ³n de entidades y documentos (FR-045)
- [X] T096 [P] [US6] Dar estilo a las tarjetas del resumen, la lista de pendientes y el estado vacÃ­o en `src/styles.css`

**Punto de control**: El resumen de indicadores refleja siempre los registros almacenados, se actualiza tras cada cambio y permite abrir la ficha de una entidad pendiente.

---

## Fase 17: Pulido y Preocupaciones Transversales

**PropÃ³sito**: Calidad, accesibilidad, seguridad, rendimiento y regresiÃ³n en todas las historias.

- [X] T097 [P] AÃ±adir refinamientos de accesibilidad: etiquetas asociadas, foco de teclado, `aria-current`, roles y estructura semÃ¡ntica en `index.html`, `src/app.js` y `src/styles.css`
- [X] T098 [P] Unificar estados vacÃ­os, de error y de Ã©xito y los mensajes de validaciÃ³n en `src/app.js` y `src/styles.css`
- [X] T099 [P] AÃ±adir pruebas unitarias del saneamiento XSS y verificar su uso en formularios, listas y ficha en `tests/unit/sanitize.test.js` y `src/utils/sanitize.js`
- [X] T100 Verificar el rendimiento de listas, selectores y bÃºsqueda con 500 entidades y corregir cuellos de botella en `src/app.js` y `src/storage.js`
- [X] T101 [P] Actualizar `README.md` con la configuraciÃ³n del mÃ³dulo, el marco del espacio de trabajo y la extensibilidad
- [X] T102 [P] AÃ±adir pruebas de regresiÃ³n de las aclaraciones 2026-11-01 y 2026-11-12 (cÃ³digo Ãºnico, confirmaciÃ³n con recuento, fallback con advertencia, retenciÃ³n de huÃ©rfanos, estado de texto libre, pendientes sin ciclo de vida, campos base de documento) en `tests/unit/` y `tests/integration/`
- [X] T103 Eliminar cÃ³digo y referencias obsoletas (por ejemplo, cualquier componente de lista de entidades no usado) en `src/` e `index.html`
- [X] T104 Ejecutar `npm test` y corregir cualquier regresiÃ³n en las pruebas existentes
- [X] T105 Ejecutar `npm run build` y corregir cualquier error de construcciÃ³n
- [X] T106 Ejecutar los escenarios de `specs/001-erp-base-module/quickstart.md` de extremo a extremo

---

## Fase 18: Aclaraciones 2026-11-16 (FR-022, FR-044)

**Propósito**: Incorporar las aclaraciones de la sesión 2026-11-16: estados pendientes marcados explícitamente en la configuración del ciclo de vida y confirmación antes de navegar con cambios sin guardar.

**Prueba Independiente**: Con ciclo de vida, computeSummary y el resumen cuentan solo los estados marcados como pendientes en la configuración; sin ciclo de vida, se mantiene la coincidencia normalizada con `pendiente`. Al intentar cambiar de vista/módulo con un formulario modificado sin guardar, se muestra confirmación y solo se navega si el usuario confirma descartar.

### Pruebas

- [ ] T107 [P] [US13] Añadir pruebas unitarias e integración para que statusLifecycle acepte estados pendientes marcados explícitamente y computeSummary/resumen cuenten solo esos estados (y fallback a pendiente normalizado sin ciclo de vida) en 	ests/unit/module-config.test.js, 	ests/unit/storage.test.js y 	ests/integration/commercial-summary.test.js
- [ ] T108 [P] Añadir prueba de integración que verifique confirmación al navegar (barra lateral, acciones rápidas o cambio de vista) con cambios sin guardar en formularios de entidad/documento en 	ests/integration/unsaved-navigation.test.js

### Implementación

- [ ] T109 [US13] Actualizar src/module-config.js y src/storage.js para soportar la marca explícita de estados pendientes en statusLifecycle y usarla en computeSummary/indicadores (FR-044, SC-011)
- [ ] T110 Implementar seguimiento de estado "dirty" en formularios y confirmación para salir/descartar o quedarse antes de showView/navegación en src/app.js, src/components/entity-form.js y src/components/document-form.js (FR-022)
- [ ] T111 Ejecutar 
pm test y 
pm run build y corregir regresiones introducidas por T107-T110

**Punto de control**: Las aclaraciones 2026-11-16 están implementadas y validadas.

---

## Dependencias y Orden de EjecuciÃ³n

### Dependencias entre Fases

- ConfiguraciÃ³n (Fase 1): Sin dependencias
- Fundacional (Fase 2): Depende de completar ConfiguraciÃ³n
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

- Las pruebas se escriben y fallan antes de la implementaciÃ³n
- Almacenamiento/modelo antes de servicios y componentes
- Componentes antes de la integraciÃ³n en `src/app.js`
- La historia debe quedar completa y probada antes de pasar a la siguiente prioridad

### Oportunidades Paralelas

- T002, T003, T004, T005, T007 y T008 pueden ejecutarse en paralelo en las fases iniciales
- En cada historia, las tareas de prueba unitaria e integraciÃ³n marcadas `[P]` pueden ejecutarse en paralelo
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
Task: "Ampliar pruebas unitarias de validaciÃ³n y unicidad de code en tests/unit/storage.test.js"
Task: "Ampliar prueba de integraciÃ³n de code duplicado en tests/integration/create-entity.test.js"
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

## Estrategia de ImplementaciÃ³n

### MVP Primero (Historias de Usuario 5 y 1)

1. Completar Fase 1: ConfiguraciÃ³n
2. Completar Fase 2: Fundacional (CRÃTICO)
3. Completar Fase 3: US5 (configuraciÃ³n)
4. Completar Fase 4: US1 (datos maestros)
5. DETENERSE y VALIDAR: ConfiguraciÃ³n cargada y entidad creada con `code` Ãºnico
6. Desplegar/demostrar si estÃ¡ listo

### Entrega Incremental

1. ConfiguraciÃ³n + Fundacional â†’ base lista
2. US5 â†’ US1 â†’ Probar â†’ Desplegar (MVP)
3. US11 â†’ US2 â†’ US7 â†’ US8 (documentos, registro y personalizaciÃ³n)
4. US14/US15 â†’ US9 â†’ US10 â†’ US12 (marco y bÃºsqueda)
5. US3 â†’ US4 â†’ US13 (ficha, gestiÃ³n y ciclo de vida)
6. US6 â†’ Pulido y regresiÃ³n

### Estrategia de Equipo en Paralelo

1. El equipo completa ConfiguraciÃ³n + Fundacional
2. Tras la base (con puntos de integraciÃ³n segÃºn las dependencias):
   - Desarrollador A: US5 â†’ US7 â†’ US8 â†’ US13
   - Desarrollador B: US1 â†’ US11 â†’ US2 â†’ US10
   - Desarrollador C: US14 â†’ US9 â†’ US12 â†’ US3
   - Desarrollador D: US15 â†’ US4 â†’ US6 â†’ Pulido
3. Las historias se integran de forma independiente y se validan en cada punto de control

---

## Notas

- `[P]` indica archivos distintos y sin dependencias pendientes
- `[US#]` traza la tarea a la historia de usuario correspondiente
- Las tareas de prueba se incluyen por mandato de la ConstituciÃ³n (Principio II)
- Verificar que las pruebas fallan antes de implementar
- Confirmar con `npm test` y `npm run build` antes de cerrar cada fase
- Evitar tareas vagas, conflictos de archivo y dependencias que rompan la independencia

