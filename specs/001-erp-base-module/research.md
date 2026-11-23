# Investigación: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

## Decisión: Usar Vite con HTML, CSS y JavaScript vanilla

**Justificación**: La solicitud enfatiza un enfoque de mínimas librerías y una implementación ligera. Vite proporciona una experiencia de desarrollo rápida y un pipeline de construcción simple sin requerir un framework más pesado. JavaScript vanilla mantiene la aplicación fácil de entender, fácil de probar y fácil de mantener para una pequeña aplicación de página única, y deja a los módulos personalizados libres de adoptar cualquier enfoque de interfaz por encima de ella.

## Alternativas consideradas

- React o Vue: Ecosistema de componentes más sólido, pero añade más abstracción y sobrecarga de dependencias de las necesarias para este alcance.
- HTML estático plano sin Vite: Más simple, pero Vite ofrece un mejor flujo de trabajo de desarrollo local y paso de construcción para crecimiento futuro.
- Persistencia en backend con base de datos: No es necesaria para un módulo base de espacio único y añadiría complejidad innecesaria; el contrato de almacenamiento está aislado, por lo que un backend puede introducirse más tarde sin cambiar la lógica del módulo.

## Decisiones adicionales

- Se usará localStorage del navegador para la persistencia porque el módulo base es de espacio único y no necesita almacenamiento del lado servidor.
- La interfaz inicial será una experiencia de página única con un panel, campo de búsqueda y lista de entidades.
- La aplicación favorecerá la mejora progresiva y los controles de formulario nativos accesibles sobre widgets personalizados complejos.
- El modelo de datos separa los datos maestros (Entidad) de los registros transaccionales (Documento), vinculados por un identificador público autogenerado (`entity_id`), de modo que los módulos personalizados puedan adjuntar cualquier significado de dominio a ambos lados sin cambios estructurales.
- Las preocupaciones base (generación de identidad, marcas de tiempo, integridad referencial, eliminación en cascada) residen en la capa de almacenamiento, manteniendo los módulos personalizados limitados a campos, etiquetas y reglas de validación.

## Decisiones de aclaración (sesión 2026-11-01)

### Decisión: El código de entidad es único

**Justificación**: El código es la clave de negocio que los usuarios usan para identificar registros; permitir duplicados haría ambiguas las referencias y debilitaría la validación. Se compara recortado y sin distinguir mayúsculas para evitar duplicados accidentales por formato.

**Alternativas consideradas**: Permitir duplicados con advertencia (no garantiza integridad); permitir duplicados sin aviso (rechazado por riesgo operativo).

### Decisión: Estado de documento como texto libre sin ciclo de vida configurado

**Justificación**: Mantener el texto libre preserva la extensibilidad del módulo base y coincide con FR-031; los cuatro estados del modelo de datos son solo ejemplos, no un catálogo obligatorio.

**Alternativas consideradas**: Lista fija de cuatro estados (limita módulos personalizados); desplegable editable (añade complejidad sin beneficio para la base).

### Decisión: Configuración inválida → valores predeterminados con advertencia visible

**Justificación**: Evita una pantalla muerta, permite seguir operando con los datos y cumple el requisito de informar del problema en lugar de fallar silenciosamente.

**Alternativas consideradas**: Bloquear la aplicación con pantalla de error (impide trabajar); registrar solo en consola (no cumple el aviso claro al usuario).

### Decisión: Conservar y ocultar valores de campos personalizados no declarados

**Justificación**: Evita pérdida de datos al evolucionar la configuración y permite recuperar los valores si el campo se vuelve a declarar; solo cambia la presentación, no el almacenamiento.

**Alternativas consideradas**: Eliminar los valores huérfanos (pérdida irreversible); mostrarlos en solo lectura (expone campos que el módulo ya no define).

### Decisión: Confirmación con recuento antes de eliminar una entidad

**Justificación**: La eliminación en cascada es irreversible; indicar cuántos documentos se eliminarán hace explícito el impacto y reduce pérdidas accidentales.

**Alternativas consideradas**: Confirmación simple sin recuento (menos informativa); eliminación inmediata (riesgo alto de pérdida de datos).

## Decisiones de aclaración (sesión 2026-11-23)

### Decisión: Regla de fecha de entidad declarada en la configuración del perfil

**Justificación**: El usuario pidió el cambio solo para el perfil de clientes. Añadir un bloque opcional `entityDate` a `module-config.js` mantiene el comportamiento base intacto, evita comparar cadenas de etiquetas como "Cliente" y conserva el principio de adaptación por configuración (XR-002, FR-029). El perfil CRM declara `label: "Fecha de nacimiento"`, `min: "1910-01-01"` y `max: "localToday"`; la clave de almacenamiento sigue siendo `targetDate`, sin migración de datos.

**Alternativas consideradas**: Condicionar por `labels.entity === "Cliente"` (frágil ante renombrados); modificar directamente todos los componentes sin configuración (rompe la extensibilidad); crear un campo de almacenamiento nuevo `birthDate` (migración innecesaria y contradice XR-001).

### Decisión: "Fecha actual" = fecha local del dispositivo calculada con getters locales

**Justificación**: El usuario eligió hora local y la aplicación ya persiste datos en el navegador. `localTodayISO()` usa `getFullYear()`, `getMonth()` y `getDate()` con relleno de ceros; no usa `toISOString()` porque ese método aplica UTC y podría desplazar el día en zonas horarias negativas o positivas.

**Alternativas consideradas**: `new Date().toISOString().slice(0, 10)` (incorrecto cerca de medianoche); zona horaria fija global (no coincide con la decisión del usuario).

### Decisión: Actualización al cambiar de día mediante temporizador hasta la medianoche local

**Justificación**: El usuario exige que el límite se refresque sin recargar. Se programa un `setTimeout` hasta el siguiente inicio de día local y se reprograma después de cada disparo; así se evita sondear cada segundo y se recalcula correctamente tras cambios de horario de verano. El manejador actualiza `min`/`max` y el texto de ayuda del formulario abierto sin volver a renderizarlo, preservando los cambios sin guardar.

**Alternativas consideradas**: `setInterval` cada minuto (desperdicio y retraso); recalcular solo al guardar (no cumple la actualización visible); forzar re-render completo (pierde el borrador del formulario).

### Decisión: Sin fecha de librería; validación de calendario y rango sobre cadenas ISO

**Justificación**: `isValidDate()` ya valida días y meses reales (incluidos años bisiestos) con `Date` nativo. Las fechas ISO `YYYY-MM-DD` válidas se comparan lexicográficamente, por lo que basta con `min <= value <= max`. No se añade dependencia.

**Alternativas consideradas**: dayjs/date-fns (dependencia innecesaria para dos operaciones); `Date.parse()` sin comprobación de año/mes/día (acepta fechas inexistentes).

### Decisión: Valores históricos fuera de rango se conservan y se corrigen al editar

**Justificación**: El usuario eligió no borrarlos. No habrá migración ni limpieza en `loadEntities()`. La validación se aplica al objeto fusionado en `updateEntity()`, de modo que cualquier intento de guardar una edición del cliente exige primero corregir la fecha; la lista y la ficha siguen mostrando el valor almacenado.

**Alternativas consideradas**: Migración que vacía fechas (pérdida de datos); válido solo si el usuario toca el campo (deja datos inválidos ocultos tras editar otros campos).

### Decisión: Datos de ejemplo con fechas de nacimiento pasadas

**Justificación**: El generador actual produce `targetDate` en el futuro (3 a 60 días), incompatible con el nuevo perfil CRM. Se generarán fechas deterministas dentro del rango permitido para que las pruebas manuales no empiecen con registros inválidos.

**Alternativas consideradas**: Mantener fechas futuras y dejar que la validación falle (mala experiencia inicial); eliminar `targetDate` del seed (pierde cobertura visual).

## Decisiones de aclaración (sesión 2026-11-23, segunda tanda: perfil de clientes)

### Decisión: Capa genérica `fieldRules` en la configuración del módulo

- **Decisión**: Añadir un mapa `fieldRules: { entity, document }` claveado por nombre de campo, con banderas opcionales `hidden`, `searchable`, `required`, `generated`, `unique`, `format`, `when` y `group`. Las reglas se aplican tanto a campos base como personalizados y se resuelven en un único módulo compartido.
- **Rationale**: Las reglas nuevas no son exclusivas de "Cliente": son mecanismos reutilizables (ocultar, generar, exigir, condicionar). Un mapa declarativo evita comparar etiquetas como `"Cliente"` en el código central, mantiene el principio de adaptación por configuración (FR-023, XR-001, XR-002) y da un único punto de verdad para formulario, lista, ficha, búsqueda y validación.
- **Alternativas consideradas**: Condicionar por `labels.entity === "Cliente"` (frágil ante renombrados); escribir `if` específicos en cada componente (duplicación y alto riesgo de olvidar una vista); añadir una clave nueva por cada regla en lo más alto de la configuración (loaders distintos y más superficie de validación).

### Decisión: Código generado, oculto, único y no buscable en el perfil de clientes

- **Decisión**: `fieldRules.entity.code = { generated: { strategy: 'prefixSequence', prefix: 'CLI-', pad: 3 }, unique: true, hidden: true, searchable: false }`. La generación ocurre en `addEntity()` antes de validar; la unicidad reutiliza la normalización actual (recortar, minúsculas, sin espacios). La semilla deja de capturar `code` manualmente y usa el generador.
- **Rationale**: Conserva la integridad de la clave de negocio (FR-001, FR-052) sin pedir al usuario un dato que ya no debe ver, y evita filtrarlo en listas, ficha, selector de entidades ni búsqueda (FR-051, FR-055).
- **Alternativas consideradas**: Usar solo `entity_id` como identidad de negocio (cambia el contrato de almacenamiento y rompe la validación de unicidad existente); dejar el código visible (contradice FR-051); generarlo en la interfaz (dos fuentes de verdad y posible duplicado).

### Decisión: Retirar `pedidos` y conservar ocultos los valores de los campos suprimidos

- **Decisión**: Eliminar la declaración `pedidos` de `customFields.entity`; `category`, `description` y `code` pasan a `hidden: true` / `searchable: false` mediante `fieldRules`. Los valores ya persistidos no se migran ni se borran: `updateEntity()` sigue fusionando el registro existente primero (FR-054).
- **Rationale**: Extiende a campos base el patrón ya aprobado para campos personalizados huérfanos (FR-040) y evita pérdida de información histórica sin exponer campos que el perfil ya no usa.
- **Alternativas consideradas**: Borrar los valores al cargar (pérdida irreversible); migrar a un esquema nuevo (contradice XR-001); ocultar solo en el formulario (contradice FR-051).

### Decisión: Validador `cl-rut` reutilizable y unicidad normalizada

- **Decisión**: Extraer las funciones de cálculo de dígito verificador y formato que hoy viven en `src/seed.js` a un registro de formatos `src/utils/field-formats.js` (`cl-rut`, `phone`, `email`, `nonEmpty`). La configuración declara `format: 'cl-rut'`, `unique: true` y `normalize: 'cl-rut'`; la comparación elimina puntos, guion y espacios y normaliza la `K`.
- **Rationale**: El proyecto ya contiene la lógica del dígito verificador en la semilla; centralizarla evita duplicarla y mantiene la validación determinista y sin dependencias. La normalización evita duplicados por formato de escritura (FR-057).
- **Alternativas consideradas**: Importar desde `seed.js` en storage (acoplamiento hacia datos de ejemplo); añadir una librería de RUT (huella innecesaria); validar solo que no esté vacío (no cumple FR-057).

### Decisión: Fecha de nacimiento obligatoria sin romper perfiles existentes

- **Decisión**: Ampliar la regla `entityDate` con `required: true` en el perfil de clientes y exponerla en la resolución de `{ label, min, max, required }`. La validación en `validateEntityData()` exige `targetDate` cuando la regla esté activa y marca el campo como obligatorio; el campo del formulario hereda `required` de la misma resolución.
- **Rationale**: Mantiene la compatibilidad con perfiles sin `entityDate` (campo opcional, HU10) y concentra la obligatoriedad en la misma regla que ya controla etiqueta y rango (FR-047, FR-056).
- **Alternativas consideradas**: Hacer obligatoria `targetDate` en la capa base (rompe otros módulos); duplicar la regla en `fieldRules` y en `entityDate` (dos fuentes de verdad).

### Decisión: Canal de Contacto sin preselección y campo condicional por grupo exclusivo

- **Decisión**: `canal_contacto` declara `required: true` y mantiene la opción vacía «Seleccionar» sin valor por defecto (FR-059). Cuatro campos personalizados (`contacto_telefono`, `contacto_correo`, `contacto_lugar`, `contacto_whatsapp`) declaran `when: { key: 'canal_contacto', equals: <opción> }`, `required: true`, `format` (`phone`, `email`, `nonEmpty`) y `group: 'contactDetail'`. Solo se renderiza, valida, collecta y persiste el miembro activo del grupo; al cambiar de canal se descartan los valores de los demás (FR-060, FR-061).
- **Rationale**: La condición y el formato son metadata genérica reutilizable; el grupo exclusivo evita guardar datos de canales no elegidos y resuelve el problema de valores huérfanos al cambiar de selección.
- **Alternativas consideradas**: Un único campo con etiqueta dinámica (mezcla formatos incompatibles y dificulta la validación); preseleccionar la primera opción (registra canales no decididos, contrario a FR-059); conservar los cuatro valores (contradice FR-060).

### Decisión: Bloqueo de ficha para registros heredados incompletos

- **Decisión**: `detailPolicy.entity = { blockWhenInvalid: true, offerEditAction: true }`. Una función pura de "preparación" reutiliza el mismo validador declarativo para decidir si la ficha puede abrirse; si faltan campos obligatorios o el RUT es inválido, la vista muestra los campos pendientes y ofrece la acción de editar. `updateEntity()` ya valida el objeto fusionado, por lo que el guardado sigue exigiendo la corrección completa (FR-058).
- **Rationale**: Cumple la elección del usuario de bloquear la consulta sin dejar los registros inaccesibles: la edición normal es la vía de corrección y el desbloqueo ocurre al guardar válidamente. No se aplica a fechas históricas fuera de rango, que se rigen por FR-050.
- **Alternativas consideradas**: Bloquear también la edición (imposibilita corregir, descartado en la desambiguación); limpieza automática de registros (pérdida de datos); permitir la ficha con aviso (no cumple FR-058).

### Decisión: La búsqueda deriva sus campos de las reglas visibles

- **Decisión**: `matchesQuery()` construye el "haystack" solo con campos base y personalizados cuyo `searchable` no sea `false`; `renderSearchBarHtml()` toma el texto de ayuda de la configuración en lugar de texto fijo que menciona código/categoría.
- **Rationale**: Evita que un dato oculto influya en resultados que el usuario no puede explicar (FR-055) y mantiene el comportamiento base intacto cuando no hay reglas (todos los campos siguen siendo buscables).
 - **Alternativas consideradas**: Mantener todos los campos en la búsqueda (contradice FR-055); quitar código/categoría del buscador global (rompería otros módulos).

## Decisiones de aclaración (sesión 2026-11-23, tercera tanda: presentación del formulario de clientes)

### Decisión: Aceptar dos formatos de RUT con una sola comparación normalizada

- **Decisión**: Mantener `format: "cl-rut"` y `normalize: "cl-rut"`; el validador existente ya acepta `12345678-9` y `12.345.678-9`, y `normalizeClRut()` elimina puntos, guion y espacios y uniformiza la `K`. La unicidad se comprueba sobre ese valor normalizado.
- **Rationale**: El usuario pidió ampliar el formato permitido sin relajar el dígito verificador. Reutilizar la normalización ya presente evita duplicados del mismo RUT escrito de dos maneras y mantiene una sola fuente de verdad (FR-057).
- **Alternativas consideradas**: Aceptar solo un formato (contradice la decisión del usuario); guardar el texto tal cual y compararlo literalmente (permite duplicados); añadir una librería de RUT (huella innecesaria).

### Decisión: Pistas grises declarativas por campo

- **Decisión**: Añadir `placeholder` opcional a las definiciones de campo y a `fieldRules`, renderizarlo como atributo `placeholder` del control y aplicar color gris mediante CSS. El «RUT» usa `Ej: 11.111.111-1`; los campos de contacto usan `Ej: +56 9 1234 5678` (llamada y WhatsApp), `Ej: nombre@ejemplo.cl` (correo) y `Ej: Sala 2 o enlace` (reunión). El texto no se persiste ni se valida.
- **Rationale**: Es la forma nativa y accesible de guiar la captura sin añadir valores al registro; una sola propiedad por campo mantiene el patrón de configuración y permite probar cada pista por canal (FR-062, FR-067).
- **Alternativas consideradas**: Texto de ayuda permanente bajo el campo (ocupa espacio y no desaparece al escribir); precargar el ejemplo como valor (contaminaría el guardado y la validación); componentes específicos por canal (duplican lógica).

### Decisión: Etiquetas capitalizadas con valores estables en «Canal de Contacto»

- **Decisión**: Las opciones `select` aceptan cadenas (compatibilidad) u objetos `{ value, label }`. El perfil CRM declara valores `llamada`, `correo`, `reunion`, `whatsapp` con etiquetas «Llamada», «Correo», «Reunión» y «WhatsApp». Las condiciones `when.equals` y los datos guardados siguen usando los valores originales.
- **Rationale**: Cumple la mayúscula inicial solicitada sin migrar registros ni romper las reglas condicionales ya aprobadas (FR-063, FR-060, FR-061).
- **Alternativas consideradas**: Cambiar los valores almacenados a «Llamada», etc. (obliga a migrar datos y `when`); usar CSS `text-transform: capitalize` (no cambia el texto real y falla en pruebas de etiqueta).

### Decisión: Orden declarativo del formulario

- **Decisión**: Añadir `order` numérico opcional por campo, resuelto junto a `fieldRules` con orden estable; los campos base tienen valores por defecto (`name` 1, `targetDate` 3) y el perfil CRM asigna `rut` 2, `canal_contacto` 4, los campos `contactDetail` 4, `rubro` 5 y `ejecutivo_asignado` 6. Sin `order`, se conserva el orden actual de declaración.
- **Rationale**: El orden exacto pedido intercala campos base y personalizados; un mecanismo genérico evita ramas específicas por perfil y mantiene intactos los módulos que no declaran orden (FR-065).
- **Alternativas consideradas**: Reordenar solo el arreglo `customFields` (no permite colocar `rut` antes de `targetDate`); codificar un arreglo fijo en `entity-form.js` (rompe la extensibilidad).

### Decisión: «Rubro» se convierte en «Tipo de actividad» desplegable

- **Decisión**: Conservar la clave `rubro`, cambiar la etiqueta a «Tipo de actividad» y el tipo a `select` con las diez opciones indicadas, incluidas «Dueño/a de casa» y «Jubilado - FFAA» tal como se escribieron.
- **Rationale**: El usuario pidió renombrar la casilla y restringirla a un catálogo; mantener la clave evita migración y preserva los valores históricos en `localStorage` (FR-066).
- **Alternativas consideradas**: Crear una clave nueva `tipo_actividad` (migración innecesaria); dejar texto libre (no cumple la petición de desplegable).

### Decisión: Título «Nuevo Cliente» sin género codificado

 - **Decisión**: Derivar el encabezado y la acción rápida de creación como `Nuevo ${entityLabel}` usando el término configurado con su inicial, en lugar de `Nueva ${label.toLowerCase()}`; el término «Cliente» produce «Nuevo Cliente».
 - **Rationale**: Evita concordar género en el código central y satisface el cambio pedido en el formulario y la acción de creación sin afectar otros perfiles (FR-064).
 - **Alternativas consideradas**: Texto fijo «Nuevo Cliente» en los componentes (rompe la reetiquetación de FR-029); mantener «Nueva» (contradice la decisión del usuario).

## Decisiones de diseño (apartado de Marketing)

### Decisión: El prospecto reutiliza `Entidad` con un campo `estado_comercial` declarado

- **Decisión**: Añadir un campo personalizado de entidad `estado_comercial` (`select`) con valores internos `prospecto`, `en_proceso`, `en_recontacto`, `ganado` y `perdido`, etiquetas «Prospecto», «En proceso», «En recontacto», «Cliente ganado» y «Perdido», y valor inicial `prospecto`. El estado inicial «Prospecto» de FR-068 queda representado sin crear un tipo de registro nuevo (XR-001).
- **Justificación**: El módulo base ya persiste entidades, documentos, campos personalizados y reglas `fieldRules`; un campo declarado mantiene la adaptación por configuración y evita una segunda estructura de almacenamiento. Los cinco valores permiten derivar las cinco categorías del gráfico sin duplicar datos.
- **Alternativas consideradas**: Crear una entidad `Prospecto` separada (contradice la aclaración del usuario y duplica identidad/historial); usar `Documento.status` (en el módulo base gobierna documentos, no entidades, y no permite convertir la entidad en cliente); guardar una categoría calculada sin campo (no se puede editar el avance comercial).

### Decisión: Categorías del gráfico derivadas del estado comercial, con regla determinista para el estado inicial

- **Decisión**: `ganado → Clientes ganados`, `en_recontacto → En recontacto`, `en_proceso → En proceso`, `perdido → Perdidos`, `prospecto → Sin resultados definitivos`. Cada entidad cuenta exactamente en una categoría. La asignación se implementa en una única función pura `computeMarketingStats()` en `src/utils/marketing-stats.js`.
- **Justificación**: FR-074 exige cinco categorías mutuamente exclusivas, pero el estado inicial acordado es «Prospecto», que no aparece como categoría. La correspondencia explícita resuelve la aparente contradicción y hace comprobable el gráfico.
- **Alternativas consideradas**: Añadir «Prospecto» como sexta categoría (contradice FR-074); dejar los prospectos fuera del gráfico (los contadores no cuadrarían con el total de leads).

### Decisión: Contadores y tasas calculados en una sola utilidad pura

- **Decisión**: `computeMarketingStats({ entities })` devuelve `{ leadsAnalyzed, openOpportunities, wonClients, lossRate, conversionRate, funnel, categories }`. `leadsAnalyzed` es el total de entidades; `openOpportunities` cuenta `en_proceso` y `en_recontacto`; `wonClients` cuenta `ganado`; `lossRate = perdido / leadsAnalyzed * 100`; `conversionRate = ganado / leadsAnalyzed * 100`; con cero leads, ambas tasas son cero.
- **Justificación**: FR-073 exige fórmulas verificables y FR-072 un embudo derivado de los mismos estados; una sola función evita dos fuentes de verdad y permite pruebas unitarias sin DOM.
- **Alternativas consideradas**: Calcular en el componente HTML (difícil de probar y duplica la lógica); almacenar contadores en `localStorage` (pueden quedar desincronizados tras editar una entidad).

### Decisión: Gráfico de torta sin dependencias, con SVG accesible

- **Decisión**: Renderizar la torta con un `<svg>` de cinco sectores generados a partir de los conteos, usando cinco tokens CSS de categoría y una leyenda textual con etiqueta y valor. El `<svg>` lleva `role="img"` y `aria-label` con el detalle de las cinco categorías. Sin estado, se muestran las cinco categorías a cero.
- **Justificación**: El proyecto no tiene librería de gráficos y la constitución exige huella mínima de librerías; SVG es nativo, escalable y accesible, y reutiliza el patrón de HTML generado por componentes puros.
- **Alternativas consideradas**: Instalar Chart.js o similar (dependencia nueva innecesaria); `conic-gradient` CSS (menos preciso para etiquetas y más difícil de hacer accesible); `<canvas>` (no ofrece semántica accesible sin trabajo adicional).

### Decisión: Captura pública como vista autónoma por parámetro de URL

- **Decisión**: La aplicación reconoce `?view=capture` al arrancar y renderiza el formulario de captura sin el marco del espacio de trabajo. El formulario crea una entidad en `localStorage` con `estado_comercial: 'prospecto'` y el consentimiento registrado. Es embebible mediante un `<iframe>` que apunte a esa URL del mismo origen.
- **Justificación**: No hay backend (decisión ya aprobada), por lo que un formulario servido desde otro dominio no podría escribir en el `localStorage` de la aplicación. La vista autónoma cumple FR-069 dentro de la arquitectura existente y mantiene la huella mínima.
- **Alternativas consideradas**: Añadir un backend para captura externa (rompe la arquitectura sin servidor y amplía el alcance); formulario dentro del panel con la barra lateral (no es público ni embebible); nueva entrada HTML con configuración multi-página de Vite (más superficie de build para el mismo resultado).

### Decisión: Consentimiento como campos de entidad y validación en la captura

- **Decisión**: El formulario de captura exige una casilla `consentimiento` marcada; al crear la entidad se guardan `consentimiento: true`, `consentimiento_fecha` (ISO) y `consentimiento_version` (texto de configuración `marketing.privacyNoticeVersion`). Sin la casilla no se crea la entidad y se muestra un error (FR-071).
- **Justificación**: Registrar fecha y versión hace auditable el consentimiento y reutiliza el mecanismo de campos personalizados sin nueva estructura. La validación se concentra en la lógica de captura, que es el único punto de entrada público.
- **Alternativas consideradas**: Solo aviso informativo (no cumple FR-071); guardar el consentimiento en `sessionStorage` (se pierde y no es auditable).

### Decisión: Automatización declarativa por eventos con historial en `Documento`

- **Decisión**: Añadir `marketing.automationRules` a la configuración: arreglo de `{ event: 'entity_created' | 'stage_changed' | 'document_created', from?, to?, action: 'create_document' | 'notify', label }`. Las reglas se evalúan en un único punto después de `addEntity()`/`updateEntity()`/`addDocument()`. Cada ejecución se registra como un `Documento` asociado a la entidad (`notes` con la descripción de la regla, `status: 'automatico'`), de modo que quede visible en su historial (FR-070).
- **Justificación**: Reutilizar `Documento` como registro de ejecución evita un nuevo tipo de dato y hace que la automatización aparezca en la ficha ya existente. Las reglas en configuración mantienen el patrón de adaptación del módulo base.
- **Alternativas consideradas**: Motor de reglas concriptor en código central (rompe XR-002); tabla de ejecuciones nueva (duplica historial y requiere migración); ejecutar reglas en la interfaz (se pierde si la mutación llega por otra vía).

### Decisión: Entrada a Marketing desde una acción rápida del panel

- **Decisión**: No añadir Marketing a la barra lateral; el panel ofrece una acción rápida adicional «Abrir Marketing» que navega a `state.view = 'marketing'`. La barra lateral conserva Panel, Buscar y Resumen.
- **Justificación**: El usuario pidió reducir la barra lateral, no ampliarla; el panel es el punto de entrada acordado para los apartados de gestión. Mantener la barra en tres elementos evita reintroducir la navegación que se está retirando.
- **Alternativas consideradas**: Añadir un botón «Marketing» en la barra lateral (contradice la dirección del cambio pedido); accesible solo por URL (poca descubribilidad).

### Decisión: Retirar solo «Clientes» e «Interacciones» de la barra lateral

- **Decisión**: Eliminar `manage-entity` y `manage-document` de `NAV_ITEMS` en `src/components/shell.js`; conservar `dashboard`, `search` y `summary`. Añadir una quinta acción rápida «abrir gestión de documentos» en `src/components/dashboard.js` para que ambos apartados sigan siendo accesibles solo desde el panel (FR-012, FR-013, FR-014, FR-033).
- **Justificación**: El usuario nombró únicamente esos dos apartados; retirar también «Resumen» sería un cambio no solicitado. Las pruebas de integración que navegaban por `#nav-entities`/`#nav-documents` deben usar las acciones rápidas o `app.navigate(...)`.
- **Alternativas consideradas**: Retirar también «Resumen» (excede la petición); ocultar los botones con CSS (deja el marcado y los selectores accesibles, contradictorio con «eliminar»).
