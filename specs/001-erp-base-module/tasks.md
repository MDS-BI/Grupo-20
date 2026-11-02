# Tareas: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

**Entrada**: Documentos de diseño desde `/specs/001-erp-base-module/`
**Prerrequisitos**: plan.md (obligatorio), spec.md (obligatorio para las historias de usuario), research.md, data-model.md, contracts/, quickstart.md
**Aclaraciones aplicadas**: sesión 2026-11-01 (código único, estado de texto libre, fallback con advertencia, retención de campos huérfanos, confirmación de eliminación)

**Pruebas**: Incluidas porque la Constitución (Principio II) exige cobertura automatizada de comportamiento visible y lógica de negocio. Las pruebas se escriben ANTES de la implementación y deben fallar primero.

**Organización**: Las tareas se agrupan por historia de usuario para permitir implementación y prueba independientes.

## Formato: `[ID] [P?] [Historia] Descripción`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Historia]**: Historia de usuario a la que pertenece la tarea (US1, US2, ...)
- Cada tarea incluye la ruta de archivo exacta

## Convenciones de Rutas

- Proyecto único: `index.html`, `src/`, `tests/` en la raíz del repositorio
- Pruebas unitarias en `tests/unit/`; integración en `tests/integration/`

---

## Fase 1: Configuración (Infraestructura Compartida)

**Propósito**: Inicializar la aplicación Vite y las herramientas compartidas.

- [ ] T001 Crear la estructura de la aplicación Vite (`index.html`, `src/`, `src/components/`, `src/utils/`, `tests/unit/`, `tests/integration/`, `tests/setup/`) según plan.md
- [ ] T002 [P] Configurar Vitest con jsdom en `vitest.config.mjs` y el arranque de pruebas en `tests/setup/test-setup.js`
- [ ] T003 [P] Configurar linting, formateo y scripts de `dev`, `build`, `test` en `package.json`
- [ ] T004 Crear el esqueleto HTML base con regiones de pantalla y el punto de entrada en `index.html` y `src/main.js`

---

## Fase 2: Fundacional (Prerrequisitos Bloqueantes)

**Propósito**: Infraestructura base de almacenamiento, saneamiento, estilos y navegación de la que dependen todas las historias.

**⚠️ CRÍTICO**: Ninguna historia de usuario puede comenzar hasta completar esta fase.

- [ ] T005 [P] Definir las claves de localStorage y los ayudantes de carga/guardado en `src/storage.js`
- [ ] T006 Implementar el modelo base de Entidad y Documento, generación de `id`/`entity_id` y marcas de tiempo en `src/storage.js`
- [ ] T007 [P] Implementar el saneamiento de texto introducido por el usuario para prevenir XSS en `src/utils/sanitize.js`
- [ ] T008 [P] Establecer los tokens de diseño y estilos compartidos de formularios, listas y retroalimentación en `src/styles.css`
- [ ] T009 Implementar el enrutador interno de vistas (panel, gestión, búsqueda) en `src/app.js`

**Punto de control**: La base está lista; las historias pueden comenzar.

---

## Fase 3: Historia de Usuario 1 - Definir datos compatibles con el ERP (Prioridad: P1)

**Objetivo**: Como analista de sistemas ERP, quiero definir un modelo de datos con identificadores y campos comunes para facilitar futuras integraciones del CRM.

**Prueba Independiente**: Un analista registra un cliente de prueba y le asocia un contacto; el sistema guarda la relación y rechaza un identificador de cliente repetido con un mensaje claro.

### Pruebas para la Historia de Usuario 1

- [ ] T010 [P] [US1] Añadir pruebas unitarias de validación de entidad, campos obligatorios y unicidad de `code` en `tests/unit/storage.test.js`
- [ ] T011 [P] [US1] Añadir pruebas de integración para crear una entidad y rechazar un `code` duplicado en `tests/integration/create-entity.test.js`

### Implementación de la Historia de Usuario 1

- [ ] T012 [P] [US1] Construir el formulario de entidad con sus campos base en `src/components/entity-form.js`
- [ ] T013 [US1] Implementar la creación de entidades con recorte de textos, marcas de tiempo y validación de `code` único (sin distinguir mayúsculas ni espacios) en `src/storage.js`
- [ ] T014 [US1] Conectar el envío del formulario a la creación y persistencia en `src/app.js`
- [ ] T015 [US1] Renderizar la lista de entidades y su estado vacío en `src/components/entity-list.js`
- [ ] T016 [US1] Mostrar retroalimentación de validación para campos obligatorios y `code` duplicado en `src/app.js` y `src/styles.css`

**Punto de control**: La Historia de Usuario 1 funciona y se prueba de forma independiente (MVP).

---

## Fase 4: Historia de Usuario 2 - Editar y eliminar entidades (Prioridad: P1)

**Objetivo**: Permitar actualizar o eliminar entidades con confirmación explícita y eliminación en cascada de sus documentos.

**Prueba Independiente**: Un usuario edita una entidad y la lista refleja el cambio; al eliminar, se pide confirmación indicando cuántos documentos se eliminarán.

### Pruebas para la Historia de Usuario 2

- [ ] T017 [P] [US2] Añadir pruebas unitarias de actualización, eliminación y cascada de documentos en `tests/unit/storage.test.js`
- [ ] T018 [P] [US2] Añadir pruebas de integración de edición y de confirmación con recuento antes de eliminar en `tests/integration/edit-delete-entity.test.js`

### Implementación de la Historia de Usuario 2

- [ ] T019 [P] [US2] Añadir controles de edición y eliminación a la lista de entidades en `src/components/entity-list.js`
- [ ] T020 [US2] Implementar la actualización de entidades preservando `id`, `entity_id` y actualizando `updatedAt` en `src/storage.js`
- [ ] T021 [US2] Implementar el diálogo de confirmación de eliminación que muestra el número de documentos asociados en `src/app.js`
- [ ] T022 [US2] Conectar la edición para poblar el formulario y guardar los cambios en `src/app.js`
- [ ] T023 [US2] Ejecutar la eliminación en cascada solo tras confirmar y refrescar lista y búsqueda en `src/app.js`

**Punto de control**: Historias 1 y 2 funcionan de forma independiente.

---

## Fase 5: Historia de Usuario 5 - Definir un perfil de configuración del módulo (Prioridad: P1)

**Objetivo**: Cargar `src/module-config.js` con valores predeterminados seguros y fallback con advertencia visible ante configuración inválida.

**Prueba Independiente**: Una configuración de Ventas se presenta en la aplicación; sin archivo se usan los valores predeterminados; una configuración inválida arranca con predeterminados y muestra una advertencia.

### Pruebas para la Historia de Usuario 5

- [ ] T024 [P] [US5] Añadir pruebas unitarias de carga, valores predeterminados, validación y fallback con advertencia en `tests/unit/module-config.test.js`

### Implementación de la Historia de Usuario 5

- [ ] T025 [US5] Definir la configuración predeterminada y el cargador del perfil en `src/module-config.js`
- [ ] T026 [US5] Validar `moduleName`, `labels`, `customFields`, `statusLifecycle` y `theme.accentColor` en `src/module-config.js`
- [ ] T027 [US5] Implementar el fallback a valores predeterminados y exponer una advertencia visible cuando la configuración sea inválida o conflictiva en `src/module-config.js` y `src/app.js`
- [ ] T028 [US5] Cargar la configuración al arrancar y pasarla a todas las vistas en `src/main.js` y `src/app.js`
- [ ] T029 [P] [US5] Dar estilo al aviso visible de configuración inválida en `src/styles.css`

**Punto de control**: La configuración se carga de forma fiable, valida limpiamente y nunca bloquea la aplicación.

---

## Fase 6: Historia de Usuario 6 - Reetiquetar pantallas desde la configuración (Prioridad: P1)

**Objetivo**: Derivar todas las etiquetas visibles de la configuración.

**Prueba Independiente**: Con Entidad→Cliente y Documento→Pedido de Venta, todas las etiquetas, encabezados, botones y estados vacíos usan los términos mapeados.

### Pruebas para la Historia de Usuario 6

- [ ] T030 [P] [US6] Añadir pruebas de integración que verifiquen las etiquetas configuradas en todas las pantallas en `tests/integration/relabeling.test.js`

### Implementación de la Historia de Usuario 6

- [ ] T031 [US6] Centralizar el acceso a etiquetas con retroceso a Entidad/Documento en `src/module-config.js`
- [ ] T032 [US6] Sustituir el texto fijo por etiquetas configuradas en `index.html`, `src/app.js` y los componentes
- [ ] T033 [US6] Aplicar las etiquetas a estados vacíos, botones, encabezados y mensajes en `src/app.js` y `src/components/`

**Punto de control**: Un módulo configurado se presenta completamente bajo su propia terminología.

---

## Fase 7: Historia de Usuario 7 - Declarar campos personalizados para los registros (Prioridad: P1)

**Objetivo**: Hacer que los campos personalizados fluyan por formularios, validación, persistencia, listas y búsqueda, conservando los valores huérfanos.

**Prueba Independiente**: Un campo numérico obligatorio se renderiza como entrada numérica, bloquea guardados en blanco, aparece en listas y coincide en búsquedas; al retirarlo de la configuración sus valores se conservan ocultos y reaparecen al redeclararlo.

### Pruebas para la Historia de Usuario 7

- [ ] T034 [P] [US7] Añadir pruebas unitarias de validación, persistencia y retención de valores huérfanos de campos personalizados en `tests/unit/storage.test.js`
- [ ] T035 [P] [US7] Añadir pruebas de integración del renderizado de campos personalizados, su búsqueda y la ocultación/restauración de huérfanos en `tests/integration/custom-fields.test.js`

### Implementación de la Historia de Usuario 7

- [ ] T036 [P] [US7] Renderizar dinámicamente los campos personalizados según su tipo en `src/components/entity-form.js` y `src/components/document-form.js`
- [ ] T037 [US7] Validar los campos personalizados obligatorios y de tipo correcto con la misma experiencia de retroalimentación en `src/storage.js` y `src/app.js`
- [ ] T038 [US7] Persistir los valores personalizados junto a los campos base sin cambios de esquema en `src/storage.js`
- [ ] T039 [US7] Incluir los valores personalizados en listas, detalle y búsqueda en `src/app.js`
- [ ] T040 [US7] Conservar en el almacenamiento los valores no declarados, ocultarlos de la interfaz y restaurarlos al redeclarar el campo en `src/storage.js` y `src/app.js`
- [ ] T041 [P] [US7] Dar estilo a los campos personalizados y a sus errores en `src/styles.css`

**Punto de control**: Los datos específicos del módulo requieren cero cambios de código de interfaz y no se pierden al evolucionar la configuración.

---

## Fase 8: Historia de Usuario 13 - Marco de espacio de trabajo ERP con marca (Prioridad: P1)

**Objetivo**: Envolver cada pantalla en un marco persistente con barra superior, logotipo derivado y barra lateral con módulo activo resaltado.

**Prueba Independiente**: En cada pantalla se ven la barra superior con logotipo y nombre, la barra lateral con Panel/Entidades/Documentos/Buscar, el módulo activo resaltado, la contracción en ventanas estrechas y la conservación de datos al navegar.

### Pruebas para la Historia de Usuario 13

- [ ] T042 [P] [US13] Añadir pruebas de integración del marco en todas las pantallas, resaltado activo y barra lateral estrecha en `tests/integration/workspace-shell.test.js`

### Implementación de la Historia de Usuario 13

- [ ] T043 [P] [US13] Añadir el marcado del marco (barra superior, montaje del logotipo, botones de módulo, región de contenido) en `index.html`
- [ ] T044 [P] [US13] Implementar `src/components/shell.js` con monograma SVG derivado, etiquetas configuradas, resaltado activo y eventos de navegación
- [ ] T045 [US13] Integrar el marco envolviendo todas las vistas y sustituir la navegación provisional en `src/app.js`
- [ ] T046 [US13] Aplicar `theme.accentColor` como propiedad CSS y retroceder al valor predeterminado si es inválido en `src/app.js`
- [ ] T047 [P] [US13] Dar estilo a la barra superior, la barra lateral y la contracción a columna de iconos con etiquetas accesibles en `src/styles.css`
- [ ] T048 [US13] Verificar que la navegación entre módulos no pierde entidades ni documentos en `src/app.js`

**Punto de control**: Todas las pantallas se renderizan dentro del marco con marca y navegación por barra lateral.

---

## Fase 9: Historia de Usuario 3 - Panel de inicio con acciones rápidas y estadísticas (Prioridad: P1)

**Objetivo**: Ofrecer un panel de entrada con al menos cuatro acciones rápidas y estadísticas de registros en vivo.

**Prueba Independiente**: La aplicación abre en el panel; las acciones llevan al destino correcto con formulario vacío o búsqueda enfocada; las estadísticas coinciden con los registros.

### Pruebas para la Historia de Usuario 3

- [ ] T049 [P] [US3] Añadir pruebas de integración de acciones rápidas y estadísticas en vivo en `tests/integration/dashboard.test.js`

### Implementación de la Historia de Usuario 3

- [ ] T050 [P] [US3] Añadir el marcado del panel (encabezado, cuadrícula de acciones rápidas, tarjetas de estadísticas) en `index.html`
- [ ] T051 [US3] Implementar `src/components/dashboard.js` con las cuatro acciones rápidas y las tarjetas de estadísticas
- [ ] T052 [US3] Conectar las acciones rápidas para abrir gestión de entidades, gestión de documentos con formulario limpio y búsqueda con entrada enfocada en `src/app.js`
- [ ] T053 [US3] Refrescar los recuentos de entidades/documentos cada vez que se muestra el panel en `src/components/dashboard.js`
- [ ] T054 [P] [US3] Dar estilo al panel, las tarjetas de acción y las estadísticas en `src/styles.css`

**Punto de control**: La aplicación abre en un panel funcional con cada tarea ERP a un clic.

---

## Fase 10: Historia de Usuario 4 - Gestionar entidades y documentos en una pantalla dedicada (Prioridad: P1)

**Objetivo**: Ofrecer una pantalla de gestión dedicada para entidades y documentos, sin mostrar la lista de entidades.

**Prueba Independiente**: Un usuario llega a la pantalla de gestión desde la barra lateral o el panel, alterna entre entidades y documentos, y crea, edita y elimina ambos.

### Pruebas para la Historia de Usuario 4

- [ ] T055 [P] [US4] Añadir pruebas de integración de la pantalla de gestión (sin lista de entidades, CRUD de entidad y documento) en `tests/integration/manage-screen.test.js`

### Implementación de la Historia de Usuario 4

- [ ] T056 [P] [US4] Añadir el contenedor de la pantalla de gestión sin la lista de entidades en `index.html`
- [ ] T057 [P] [US4] Crear el formulario de documentos con campos base y personalizados en `src/components/document-form.js`
- [ ] T058 [US4] Implementar el panel de gestión de entidades (crear, editar, eliminar) en `src/app.js`
- [ ] T059 [US4] Implementar el panel de gestión de documentos (crear, editar, eliminar) en `src/app.js`
- [ ] T060 [US4] Asegurar la asociación documento→entidad y la persistencia tras cada cambio en `src/app.js`
- [ ] T061 [P] [US4] Dar estilo a los paneles de gestión en `src/styles.css`

**Punto de control**: La funcionalidad de gestión está disponible en su pantalla dedicada.

---

## Fase 11: Historia de Usuario 8 - Buscar y encontrar entidades rápidamente (Prioridad: P2)

**Objetivo**: Permitir buscar y filtrar entidades por detalles clave.

**Prueba Independiente**: Un usuario introduce un término y ve solo las entidades coincidentes; sin coincidencias ve un estado vacío claro.

### Pruebas para la Historia de Usuario 8

- [ ] T062 [P] [US8] Añadir pruebas unitarias de normalización y filtrado de búsqueda en `tests/unit/storage.test.js`
- [ ] T063 [P] [US8] Añadir pruebas de integración de coincidencias y estado vacío en `tests/integration/search-entities.test.js`

### Implementación de la Historia de Usuario 8

- [ ] T064 [P] [US8] Crear el componente de barra de búsqueda en `src/components/search-bar.js`
- [ ] T065 [US8] Implementar el filtrado por nombre, código, categoría, descripción, fecha objetivo y campos personalizados en `src/storage.js`
- [ ] T066 [US8] Conectar la entrada de búsqueda a los resultados y al estado vacío en `src/app.js`
- [ ] T067 [US8] Mantener los resultados sincronizados tras crear, editar o eliminar en `src/app.js`

**Punto de control**: La búsqueda funciona de forma independiente sobre los datos existentes.

---

## Fase 12: Historia de Usuario 9 - Registrar una fecha objetivo (Prioridad: P2)

**Objetivo**: Permitir adjuntar una fecha objetivo opcional a una entidad.

**Prueba Independiente**: Un usuario fija una fecha, la guarda y la ve en la lista; dejarla en blanco no impide guardar.

### Pruebas para la Historia de Usuario 9

- [ ] T068 [P] [US9] Añadir pruebas unitarias de validación y persistencia de una fecha objetivo válida y opcional en `tests/unit/storage.test.js`

### Implementación de la Historia de Usuario 9

- [ ] T069 [P] [US9] Añadir la entrada de fecha objetivo al formulario de entidad en `src/components/entity-form.js`
- [ ] T070 [US9] Validar la fecha objetivo como fecha de calendario válida y opcional en `src/storage.js`
- [ ] T071 [US9] Conectar la fecha objetivo al envío, al poblado de edición y a los errores en `src/app.js`
- [ ] T072 [US9] Mostrar la fecha objetivo en la lista de entidades en `src/components/entity-list.js`

**Punto de control**: La fecha objetivo funciona y es visible de un vistazo.

---

## Fase 13: Historia de Usuario 10 - Registrar los detalles de documentos de una entidad (Prioridad: P2)

**Objetivo**: Permitir registrar, editar y eliminar documentos de una entidad con integridad referencial y cascada.

**Prueba Independiente**: Un usuario añade un documento a una entidad y lo ve asociado; editar/eliminar funciona; eliminar la entidad elimina sus documentos.

### Pruebas para la Historia de Usuario 10

- [ ] T073 [P] [US10] Añadir pruebas unitarias de validación de documentos, generación de `entity_id` y cascada en `tests/unit/storage.test.js`
- [ ] T074 [P] [US10] Añadir pruebas de integración de añadir, editar, eliminar y cascada de documentos en `tests/integration/add-document.test.js` y `tests/integration/manage-document.test.js`

### Implementación de la Historia de Usuario 10

- [ ] T075 [P] [US10] Crear la lista de documentos de una entidad en `src/components/document-list.js`
- [ ] T076 [US10] Implementar las operaciones CRUD de documentos en `src/storage.js`
- [ ] T077 [US10] Conectar crear, editar y eliminar documentos en `src/app.js`
- [ ] T078 [US10] Mostrar los documentos asociados a la entidad seleccionada en `src/app.js`
- [ ] T079 [US10] Eliminar en cascada los documentos de una entidad eliminada en `src/storage.js`
- [ ] T080 [US10] Mostrar retroalimentación de validación de los campos obligatorios del documento en `src/app.js`

**Punto de control**: Datos maestros y documentos transaccionales están completamente vinculados.

---

## Fase 14: Historia de Usuario 11 - Buscar entidades en una pantalla dedicada (Prioridad: P2)

**Objetivo**: Ofrecer una pantalla de búsqueda dedicada accesible desde la barra lateral y el panel.

**Prueba Independiente**: Un usuario abre la pantalla de búsqueda, busca, ve resultados o estado vacío y vuelve al panel.

### Pruebas para la Historia de Usuario 11

- [ ] T081 [P] [US11] Añadir pruebas de integración de navegación a/desde la pantalla de búsqueda y sus resultados en `tests/integration/search-screen.test.js`

### Implementación de la Historia de Usuario 11

- [ ] T082 [P] [US11] Añadir el marcado de la pantalla de búsqueda dedicada en `index.html`
- [ ] T083 [US11] Implementar los resultados y el estado vacío de la pantalla de búsqueda en `src/app.js`
- [ ] T084 [US11] Conectar la navegación desde la barra lateral y la acción rápida, enfocando la entrada, en `src/app.js`
- [ ] T085 [P] [US11] Dar estilo a la pantalla de búsqueda en `src/styles.css`

**Punto de control**: La búsqueda dedicada funciona sin interferir con la gestión.

---

## Fase 15: Historia de Usuario 12 - Configurar el ciclo de vida de estados de documentos (Prioridad: P2)

**Objetivo**: Aplicar estados y transiciones configurados, manteniendo estado de texto libre cuando no hay configuración.

**Prueba Independiente**: Con cotización→pedido→facturado solo se ofrecen estados alcanzables, las transiciones inválidas se rechazan y el estado es visible; sin configuración el estado es texto libre.

### Pruebas para la Historia de Usuario 12

- [ ] T086 [P] [US12] Añadir pruebas unitarias de transiciones válidas/inválidas y de estado de texto libre sin configuración en `tests/unit/storage.test.js`
- [ ] T087 [P] [US12] Añadir pruebas de integración de las opciones de estado ofrecidas y el rechazo de transiciones inválidas en `tests/integration/document-lifecycle.test.js`

### Implementación de la Historia de Usuario 12

- [ ] T088 [US12] Implementar la validación de transiciones de estado y el rechazo con explicación en `src/storage.js`
- [ ] T089 [US12] Renderizar un selector con estados alcanzables cuando hay ciclo de vida y una entrada de texto libre cuando no lo hay en `src/components/document-form.js`
- [ ] T090 [US12] Mostrar el estado actual como insignia en listas y detalle de documentos en `src/components/document-list.js`

**Punto de control**: La cadena de personalización (US5 → US6/US7/US12) está completa de extremo a extremo.

---

## Fase 16: Pulido y Preocupaciones Transversales

**Propósito**: Calidad, accesibilidad, seguridad, rendimiento y regresión en todas las historias.

- [ ] T091 [P] Añadir refinamientos de accesibilidad: etiquetas, foco de teclado, `aria-current` y estructura semántica en `index.html`, `src/app.js` y `src/styles.css`
- [ ] T092 [P] Unificar estados vacíos, de carga y de error y los mensajes de validación en `src/app.js` y `src/styles.css`
- [ ] T093 [P] Añadir pruebas unitarias del saneamiento XSS del texto de usuario en `tests/unit/sanitize.test.js` y verificar su uso en `src/utils/sanitize.js`
- [ ] T094 Verificar el rendimiento de listas y búsqueda con 500 entidades y corregir cuellos de botella en `src/app.js` y `src/storage.js`
- [ ] T095 [P] Actualizar `README.md` con la configuración del módulo, el marco del espacio de trabajo y la extensibilidad
- [ ] T096 Ejecutar `npm test` y `npm run build`, y corregir cualquier regresión
- [ ] T097 Ejecutar los escenarios de `specs/001-erp-base-module/quickstart.md` de extremo a extremo
- [ ] T098 [P] Añadir pruebas de regresión de las aclaraciones 2026-11-01 (código único, confirmación de eliminación, fallback con advertencia, retención de huérfanos, estado de texto libre) en `tests/unit/` y `tests/integration/`

---

## Dependencias y Orden de Ejecución

### Dependencias entre Fases

- Configuración (Fase 1): Sin dependencias
- Fundacional (Fase 2): Depende de completar Configuración
- US1 (Fase 3): Depende de Fundacional
- US2 (Fase 4): Depende de US1 (lista y formulario de entidad)
- US5 (Fase 5): Depende de Fundacional; desbloquea US6, US7 y US12
- US6 (Fase 6): Depende de US5
- US7 (Fase 7): Depende de US5 y de los formularios de US1/US4
- US13 (Fase 8): Depende de US5 (nombre, etiquetas y color) y del enrutador de US1/Fundacional
- US3 (Fase 9): Depende de US13 (navegación) y de los recuentos de almacenamiento
- US4 (Fase 10): Depende de US13, US1, US2 y US10 para la gestión de documentos
- US8 (Fase 11): Depende de US1
- US9 (Fase 12): Depende de US1
- US10 (Fase 13): Depende de US1 y de `entity_id`
- US11 (Fase 14): Depende de US8 y US13
- US12 (Fase 15): Depende de US5 y US10
- Pulido (Fase 16): Depende de todas las historias deseadas

### Dentro de Cada Historia

- Las pruebas se escriben y fallan antes de la implementación
- Modelo/almacenamiento antes de servicios y componentes
- Componentes antes de la integración en `src/app.js`
- La historia debe quedar completa y probada antes de pasar a la siguiente prioridad

### Oportunidades Paralelas

- T002, T003, T005, T007 y T008 pueden ejecutarse en paralelo en las fases iniciales
- En cada historia, las pruebas unitarias e integración marcadas `[P]` pueden ejecutarse en paralelo
- Los componentes de formulario (`entity-form`, `document-form`) pueden construirse en paralelo
- US6 y US7 pueden avanzar en paralelo tras US5
- US8 y US9 pueden avanzar en paralelo tras US1
- US11 puede avanzar en paralelo con US12 una vez completadas sus dependencias
- En la Fase 16, T091, T092, T093, T095 y T098 pueden ejecutarse en paralelo antes de T096 y T097

---

## Ejemplo Paralelo: Historia de Usuario 1

```bash
# Lanzar las pruebas de US1 en paralelo
Task: "Pruebas unitarias de validación y unicidad de code en tests/unit/storage.test.js"
Task: "Pruebas de integración de creación y code duplicado en tests/integration/create-entity.test.js"
```

---

## Estrategia de Implementación

### MVP Primero (Solo Historia de Usuario 1)

1. Completar Fase 1: Configuración
2. Completar Fase 2: Fundacional (CRÍTICO)
3. Completar Fase 3: US1
4. **DETENERSE y VALIDAR**: Probar US1 de forma independiente
5. Desplegar/demostrar si está listo

### Entrega Incremental

1. Configuración + Fundacional → base lista
2. US1 → Probar → Desplegar (MVP)
3. US2 → Probar → Desplegar
4. US5 → US6 → US7 → US13 → US3 → US4 (núcleo de personalización y marco)
5. US8 → US9 → US10 → US11 → US12 (valor transaccional y de recuperación)
6. Pulido y regresión

### Estrategia de Equipo en Paralelo

1. El equipo completa Configuración + Fundacional
2. Tras la base:
   - Desarrollador A: US1 → US2 → US8 → US9
   - Desarrollador B: US5 → US6 → US7 → US12
   - Desarrollador C: US13 → US3 → US4 → US10 → US11
3. Las historias se integran de forma independiente y se validan en cada punto de control

---

## Notas

- `[P]` indica archivos distintos y sin dependencias pendientes
- `[US#]` traza la tarea a la historia de usuario correspondiente
- Las tareas de prueba se incluyen por mandato de la Constitución (Principio II)
- Verificar que las pruebas fallan antes de implementar
- Confirmar con `npm test` y `npm run build` antes de cerrar cada fase
- Evitar tareas vagas, conflictos de archivo y dependencias que rompan la independencia
