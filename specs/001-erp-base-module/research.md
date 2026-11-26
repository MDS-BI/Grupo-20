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

- **Decisión**: Añadir un campo personalizado de entidad `estado_comercial` (`select`) con valores internos `prospecto`, `en_proceso`, `en_recontacto`, `ganado` y `perdido`, etiquetas «Prospecto», «En proceso», «En recontacto», «Cliente ganado» y «Perdido», y valor inicial `prospecto`. `ganado` es la conversión interna de la entidad a Cliente y «Cliente ganado» su etiqueta visible; «Cerrado ganado» queda reservado al estado de `Documento`. El estado inicial «Prospecto» de FR-068 queda representado sin crear un tipo de registro nuevo (XR-001).
- **Justificación**: El módulo base ya persiste entidades, documentos, campos personalizados y reglas `fieldRules`; un campo declarado mantiene la adaptación por configuración y evita una segunda estructura de almacenamiento. Los cinco valores permiten gobernar la automatización y el rendimiento por etapa sin duplicar datos.
- **Alternativas consideradas**: Crear una entidad `Prospecto` separada (contradice la aclaración del usuario y duplica identidad/historial); usar `Documento.status` (en el módulo base gobierna documentos, no entidades, y no permite convertir la entidad en cliente); guardar una categoría calculada sin campo (no se puede editar el avance comercial).

### Decisión: Marketing reutiliza el embudo y las tarjetas del panel

- **Decisión**: `computeMarketingStats()` deriva las cinco tarjetas y el embudo de entidades y documentos con las mismas reglas del panel principal; `estado_comercial` queda como dato interno para la automatización. Se eliminan la torta «Estado comercial de la cartera» y el selector de etapas.
- **Justificación**: La especificación actual exige que Marketing y el panel muestren exactamente los mismos valores derivados de los mismos registros (FR-072 a FR-075). Reutilizar una sola utilidad evita dos cálculos que puedan divergir y elimina la contradicción con la decisión anterior del gráfico.
- **Alternativas consideradas**: Mantener la torta con categorías de `estado_comercial` (contradice FR-075); duplicar las fórmulas en Marketing (riesgo de desincronización y pruebas frágiles).

### Decisión: Contadores y embudo calculados en una sola utilidad pura

- **Decisión**: `computeMarketingStats({ entities, documents })` devuelve las cinco tarjetas del panel —total de entidades, total de documentos, «Cerrado ganado», «Tasa de conversión» y «Pipeline (USD)»— y el `funnel` por estados de documento, aplicando las mismas reglas que el panel. Con cero registros, las tarjetas muestran cero.
- **Justificación**: FR-073 y FR-074 exigen valores idénticos a los del panel; una sola función compartida permite probar las fórmulas sin DOM y evita cálculos divergentes tras crear, editar o eliminar documentos.
- **Alternativas consideradas**: Calcular en el componente HTML (difícil de probar y duplica la lógica); almacenar contadores en `localStorage` (pueden quedar desincronizados tras editar una entidad).

### Decisión: Sin gráfico de torta; embudo accesible reutilizado del panel

- **Decisión**: Marketing no renderiza la torta «Estado comercial de la cartera». Muestra el embudo del panel con barras porcentuales y etiquetas textuales derivadas de los estados de documento; las reglas de accesibilidad del panel siguen aplicando.
- **Justificación**: La especificación eliminó explícitamente la torta y el selector de etapas (FR-075). Reutilizar el embudo existente evita dependencias de gráficos y mantiene una sola representación verificable del estado comercial basado en documentos.
- **Alternativas consideradas**: Conservar la torta con otra fuente de datos (contradice FR-075); crear un nuevo componente de gráfico (duplicación y más superficie de pruebas).

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

### Decisión: Entrada a Marketing desde la barra lateral

- **Decisión**: `NAV_ITEMS` incluye Panel, Buscar, Resumen y Marketing; el panel elimina «Abrir Marketing». Clientes e Interacciones siguen accesibles solo desde el panel o enlaces profundos.
- **Justificación**: La decisión posterior del usuario traslada explícitamente el acceso a Marketing a la barra lateral (FR-012, FR-033). El marco mantiene una sola fuente de navegación y resalta el módulo activo como antes.
- **Alternativas consideradas**: Mantener «Abrir Marketing» en el panel (contradice FR-033); dejar Marketing solo por URL (poca descubribilidad).

### Decisión: Retirar solo «Clientes» e «Interacciones» de la barra lateral

- **Decisión**: Eliminar `manage-entity` y `manage-document` de `NAV_ITEMS` en `src/components/shell.js`; conservar `dashboard`, `search` y `summary`. Añadir una quinta acción rápida «abrir gestión de documentos» en `src/components/dashboard.js` para que ambos apartados sigan siendo accesibles solo desde el panel (FR-012, FR-013, FR-014, FR-033).
- **Justificación**: El usuario nombró únicamente esos dos apartados; retirar también «Resumen» sería un cambio no solicitado. Las pruebas de integración que navegaban por `#nav-entities`/`#nav-documents` deben usar las acciones rápidas o `app.navigate(...)`.
- **Alternativas consideradas**: Retirar también «Resumen» (excede la petición); ocultar los botones con CSS (deja el marcado y los selectores accesibles, contradictorio con «eliminar»).

## Decisiones de diseño (equipo, canales, campañas y rendimiento)

### Decisión: Equipos de ventas y logros con métricas calculadas, no capturadas

- **Decisión**: `marketing.salesTeams` contiene equipos con `name` e `integrantes`; cada integrante guarda `name`, `role`/`cargo` y `active`. El real mensual se calcula sumando importes de documentos «Cerrado ganado» del mes cuyo cliente tenga `ejecutivo_asignado` igual al integrante. El objetivo mensual es `ventasAcumuladas / díasTranscurridos * díasDelMes`, o cero sin ventas o sin días transcurridos.
- **Justificación**: La especificación exige que el usuario capture solo datos del equipo y que el sistema derive ambas cifras (FR-076 a FR-079). Reutilizar documentos y el campo existente evita una nueva estructura y mantiene una sola fuente de verdad.
- **Alternativas consideradas**: Capturar objetivo y real manualmente (contradice FR-077); crear un almacén de ventas separado (rompe XR-001 y duplica el historial).

### Decisión: Redes y «Dudas y consultas» como `Documento` con tipos declarados

- **Decisión**: Las interacciones de redes y los mensajes/consultas de «Dudas y consultas» se persisten como `Documento` con campos personalizados `plataforma`/`canal`, `tipo_interaccion`, `nota`/`mensaje`, `enlace` y `campaña`. Las respuestas rápidas se declaran en `marketing.faq` como pares pregunta/respuesta. «Dudas y consultas» bloquea el primer mensaje sin consentimiento y reutiliza `privacyNoticeVersion`.
- **Justificación**: FR-080 a FR-085 exigen trazabilidad en la ficha de la entidad, consentimiento y respuestas configurables; `Documento` ya aporta vinculación, historial y sanitización al renderizar. No se introducen APIs de redes ni proveedores de mensajería.
- **Alternativas consideradas**: Nueva entidad «Interacción social» (duplica identidad e historial); integración con plataformas externas (contradice la decisión de registro manual y añade dependencias).

### Decisión: Campañas internas como programación declarativa sobre reglas existentes

- **Decisión**: `marketing.campaigns` contiene `{ id, name, stage, startDate, endDate, status }`. Durante el periodo activo, `runAutomationRules()` evalúa las campañas junto a `automationRules`; las acciones internas permitidas son crear documento de seguimiento, asignar `ejecutivo_asignado` y actualizar `estado_comercial`. Cada ejecución se registra como `Documento` con `campaignId`, fecha, entidad, acción y resultado.
- **Justificación**: Organiza la automatización ya aprobada sin crear un motor externo ni enviar correos/publicaciones (FR-086, FR-089). El historial único por entidad sigue siendo la fuente verificable para auditoría y para el cálculo de rendimiento.
- **Alternativas consideradas**: Envío por correo o publicación en redes (contradice la decisión de sin servicios externos); tabla de ejecuciones separada (duplica el historial y añade migración).

### Decisión: Atribución opcional por campaña con grupo «Sin campaña»

- **Decisión**: El campo personalizado opcional `campaña` se declara en entidades y documentos. El filtro de rendimiento agrupa los registros sin valor bajo «Sin campaña» y muestra ese grupo junto a las campañas creadas.
- **Justificación**: La atribución opcional evita exigir campañas antes de capturar prospectos y hace auditable el rendimiento (FR-087, FR-088). El grupo explícito evita descartar registros históricos.
- **Alternativas consideradas**: Asignar automáticamente la campaña activa de la etapa (puede atribuir de forma incorrecta); no filtrar por campaña (contradice FR-087).

### Decisión: Rendimiento derivado y desempate determinista de campañas

- **Decisión**: `computeMarketingPerformance()` deriva prospectos capturados, conversiones por etapa, tasa de conversión, interacciones, consultas respondidas y ventas «Cerrado ganado» desde entidades, documentos y ejecuciones ya almacenadas, globalmente y por campaña. Si dos campañas activas aplican al mismo prospecto y evento, se ejecuta la creada más recientemente y las demás se registran como «omitida por solapamiento» con motivo.
- **Justificación**: Cumple SC-025 y SC-026 con valores verificables y evita acciones duplicadas o contradictorias en la ficha del prospecto sin crear un sistema de prioridades configurable.
- **Alternativas consideradas**: Ejecutar todas las campañas (duplica acciones); rechazar la segunda campaña (reduce flexibilidad y no registra el conflicto); integración con analítica externa (contradice la decisión de una sola fuente de datos local).

## Decisiones de diseño (autenticación, sesión y permisos)

### Decisión: `src/auth.js` concentra sesión, hash, bloqueo y expiración

- **Decisión**: Crear `src/auth.js` con operaciones `login`, `logout`, `getCurrentUser`, `getCurrentSession`, `createUser`, `updateUser`, `deactivateUser`, `normalizeUsername`, `hashPassword` y `verifyPassword`. La sesión se guarda en `erp_session` con `userId`, `issuedAt`, `lastActivityAt` y `expiresAt`; los usuarios se guardan en `erp_users` con `id`, `username`, `usernameKey`, `passwordHash`, `salt`, `rank`, `active`, `failedAttempts`, `lockedUntil`, `createdAt` y `updatedAt`.
- **Justificación**: El usuario pidió explícitamente sesión, hash, bloqueo y expiración. Un solo módulo evita que esas reglas se repartan entre `app.js`, `storage.js` y los componentes, y permite probar la lógica sin DOM. Guardar solo `userId` en la sesión permite resolver rango y estado activo desde `erp_users` en cada verificación.
- **Alternativas consideradas**: Guardar rango y nombre en la sesión (deja permisos obsoletos tras un cambio); dividir sesión/hash/usuarios en tres módulos sin una fachada común (más superficie de importación); almacenar contraseñas en texto plano (inaceptable incluso en la demo).

### Decisión: Hash PBKDF2-SHA-256 con sal por usuario y Web Crypto API

- **Decisión**: Derivar cada contraseña con `crypto.subtle.deriveBits` usando PBKDF2-SHA-256, sal aleatoria de 16 bytes, 100 000 iteraciones y codificación hexadecimal para `salt` y `passwordHash`. No se añade dependencia criptográfica; las pruebas inyectan o simulan la API cuando el entorno no expone `crypto.subtle`.
- **Justificación**: Cumple la petición de «hash» sin ampliar la huella de librerías y evita el error frecuente de guardar contraseñas legibles en `localStorage`. La sal individual impide que dos usuarios con la misma contraseña compartan el mismo digest.
- **Alternativas consideradas**: Almacenar contraseña en texto plano (rechazado); hash simple sin sal ni iteraciones (débil); añadir bcrypt/argon2 como dependencia (contradice la restricción de huella mínima y no aporta seguridad real sin backend).

### Decisión: Bloqueo temporal y expiración por inactividad con valores demostrativos

- **Decisión**: Bloquear el usuario durante 15 minutos después de 5 intentos fallidos; un inicio de sesión correcto reinicia `failedAttempts` y `lockedUntil`. La sesión expira tras 8 horas de inactividad, actualizando `lastActivityAt` en cada acción verificada; «Cerrar sesión», la desactivación y la expiración eliminan `erp_session`.
- **Justificación**: El usuario pidió bloqueo y expiración sin dar umbrales. Estos valores son suficientes para probar el comportamiento sin convertir la demo en un sistema de seguridad productivo, y se documentan como constantes de `src/auth.js`.
- **Alternativas consideradas**: Sin bloqueo ni expiración (no cumple la petición); expiración absoluta desde el login sin renovación (cierra sesiones activas de forma sorpresiva); umbrales configurables desde la interfaz (amplían el alcance y permitirían debilitar la política).

### Decisión: Matriz de permisos única en `src/auth/permissions.js`

- **Decisión**: Exportar `ROLES`, `PERMISSION_MATRIX`, `can(role, action, context)` y `assertPermission(role, action, context)` desde `src/auth/permissions.js`. La tabla replica la sección «Matriz de permisos» de la especificación; las acciones no declaradas devuelven `false`; `assertPermission()` lanza un error cuyo mensaje es exactamente `No tienes permiso para realizar esta acción`.
- **Justificación**: FR-094 exige una sola fuente para botones, navegación, vistas y capa de datos, y la aclaración 2026-11-24 impidió editarla desde la interfaz. Un módulo separado de `src/auth.js` mantiene la identidad separada de la autorización, sin añadir dependencias.
- **Alternativas consideradas**: Mantener permisos en cada componente (divergencia y aumento de pruebas frágiles); guardar la matriz en `localStorage` editable (contradice la aclaración); permitir que el Gerente modifique la tabla (contradice FR-094 y SC-033).

### Decisión: `Sistema` como identidad de auditoría, no como rango

- **Decisión**: Las automatizaciones siguen ejecutándose como `Sistema` sin consultar el rango del usuario conectado; cada ejecución conserva `createdBy: 'Sistema'` y el historial de campaña mantiene el usuario creador real. `Sistema` no aparece en `ROLES` ni en el `select` de «Ejecutivo Asignado».
- **Justificación**: FR-101 exige independencia del usuario conectado y la matriz debe seguir teniendo una fila por rango interactivo más el visitante. Mezclar `Sistema` como rango permitiría iniciar sesión con una identidad sin permisos definidos.
- **Alternativas consideradas**: Usar el rango del usuario que disparó la regla (contradice FR-101); crear un rango «Sistema» con todos los permisos (amplía la matriz y la superficie de login); no registrar creador de campaña (rompe trazabilidad).

### Decisión: Vistas `login.js` y `users-admin.js` con límites distintos

- **Decisión**: `src/components/login.js` renderiza «Usuario» y «Contraseña» sin barra superior ni lateral, conserva enlaces públicos a captura/chat y redirige a la vista solicitada tras autenticarse. `src/components/users-admin.js` se monta solo desde el menú del usuario de la barra superior y solo para Nivel 4; no se añade a `NAV_ITEMS`.
- **Justificación**: US22 exige que sin sesión solo se vea el login excepto las rutas públicas, y FR-098 exige que la administración de usuarios no esté en la barra lateral. Separar ambos componentes permite probar sus flujos sin acoplarlos al marco ERP.
- **Alternativas consideradas**: Mostrar login dentro del shell (filtra vistas protegidas); añadir «Usuarios» a la barra lateral (contradice FR-098); combinar login y administración en un único componente (acopla una vista pública con una privada).

### Decisión: Integración en almacenamiento y configuración existente

- **Decisión**: `src/storage.js` llama a `assertPermission()` antes de `addEntity`, `updateEntity`, `deleteEntity`, altas/ediciones/bajas de documentos, cambios de estado y escrituras directas de las listas; `app.js` controla el acceso a vistas y `shell.js`/`dashboard.js` filtran navegación y acciones rápidas con la misma matriz. El campo `ejecutivo_asignado` pasa de texto libre a un `select` poblado con usuarios activos de rango Nivel 2 o Nivel 4, y los integrantes del equipo se vinculan al `userId` correspondiente.
- **Justificación**: FR-095 exige validar en la capa de datos y SC-035 comprueba una llamada directa a `storage.js`; FR-099 y FR-100 exigen que ejecutivo e integrante provengan de usuarios activos válidos. Reutilizar la configuración evita crear un esquema paralelo.
- **Alternativas consideradas**: Confiar solo en botones ocultos (falla SC-035); dejar `ejecutivo_asignado` como texto libre (contradice FR-099); vincular integrantes por nombre visible (rompe FR-100 al renombrar usuarios).

### Decisión: Autenticación local simulada con limitación explícita

- **Decisión**: Los usuarios semilla se inicializan solo si `erp_users` no existe y representan los cuatro rangos de la demostración. El aviso de configuración inválida y la nota de suposiciones siguen indicando que una implementación productiva requiere autenticación en servidor; el bloqueo y la expiración locales son medidas de demostración.
- **Justificación**: La especificación ya declara autenticación local y simulada, sin backend. Documentar el límite evita que el hash local se interprete como una garantía de seguridad de producción.
- **Alternativas consideradas**: Introducir backend y base de datos (cambia la arquitectura aprobada); omitir usuarios semilla (impide probar rangos sin configuración manual); ocultar la limitación (riesgo de malinterpretar la demo).

### Decisión: Seis rutas relativas en un único documento HTML

- **Decisión**: La vista se resuelve desde `location.search` en carga, recarga y Back/Forward con `?view=summary`, `?view=capture`, `?view=marketing`, `?view=manage-entity`, `?view=manage-document` y `?view=users-admin`; sin parámetro `view` se abre el Panel y no existe `?view=panel`. La construcción de URLs usa solo `window.location.pathname`, sin host ni ruta de servidor, y cada resolución aplica la matriz de permisos.
- **Justificación**: I1 exige rutas relativas verificables en un despliegue estático; una resolución única evita que el estado de la vista y la barra de direcciones divergan al recargar o usar el historial.
- **Alternativas consideradas**: Rutas absolutas con prefijo de servidor (rompen el despliegue estático); estado solo en memoria (se pierde al recargar); hash propio (duplica el mecanismo de `location.search` ya usado por `?view=capture`).

## Decisiones de aclaración (sesión 2026-11-24: atajos y terminología de Marketing)

### Decisión: Marketing sustituye los atajos del panel por sus propias secciones

- **Decisión**: `renderDashboardHtml()` recibe una opción para omitir únicamente el bloque `.quick-actions`; `renderMarketingHtml()` la activa y conserva las tarjetas, el embudo y la lista de seguimientos. Los cinco atajos de Marketing se derivan de una tabla local de secciones con claves internas estables (`team`, `campaigns`, `performance`, `chat`, `social`).
- **Justificación**: El usuario pidió que los atajos de creación y gestión aparezcan solo en el panel principal. Una opción en el renderizador compartido evita duplicar la lógica de tarjetas y mantiene una sola fuente de cálculo (FR-091, FR-073).
- **Alternativas consideradas**: Crear un componente de Marketing separado sin reutilizar el panel (duplica tarjetas y cálculos); ocultar los botones con CSS (deja el marcado accesible y no cumple «solo en el panel»); eliminar las tarjetas de Marketing (contradice FR-073).

### Decisión: Cinco atajos exactos y en orden explícito

- **Decisión**: El orden visible es «Equipos de ventas y logros», «Campañas», «Rendimiento de campañas», «Dudas y consultas» y «Redes sociales». La etiqueta del equipo pasa de singular a plural en todo texto visible.
- **Justificación**: El usuario enumeró las etiquetas en ese orden; hacerlo explícito en la tabla de secciones permite verificarlo con una sola prueba de interfaz y evita que el orden heredado (`team`, `social`, `chat`, `campaigns`, `performance`) se considere correcto (FR-093, SC-029).
- **Alternativas consideradas**: Conservar el orden actual del componente (no respeta la enumeración); dejar el orden sin definir (genera pruebas ambiguas); añadir atajos adicionales del panel (contradice FR-091).

### Decisión: «Dudas y consultas» renombra solo la capa visible

- **Decisión**: El encabezado del componente compartido, la pestaña de Marketing, las etiquetas de consentimiento y el mensaje de error de consentimiento muestran «Dudas y consultas». Se conservan `data-section="chat"`, `#chat-form`, `.chat-*`, `canal: 'chat'`, `ChatConsentError`, nombres de archivo, funciones y datos ya persistidos.
- **Justificación**: El usuario pidió un nuevo nombre para el apartado, no una migración de esquema. Un cambio exclusivamente visible satisface FR-092 y SC-028 sin romper selectores, historiales ni reglas de atribución existentes.
- **Alternativas consideradas**: Renombrar claves y archivos (migración innecesaria y riesgo de perder documentos); mantener «Chat» solo en la captura pública (deja dos nombres para el mismo apartado); mostrar ambos nombres juntos (no es un renombramiento).

### Decisión: Cobertura de integración para la nueva presentación

- **Decisión**: Las pruebas de integración comprueban que el panel conserva cinco `.quick-actions button`, que Marketing no contiene `.quick-actions`, que `.marketing-sections [data-action="marketing-section"]` devuelve cinco elementos con el texto y orden exactos, y que «Dudas y consultas» aparece como encabezado y en el texto de consentimiento de la captura pública y de Marketing.
- **Justificación**: Los cambios son visibles y susceptibles de regresión por compartir componentes entre panel, Marketing y captura; la verificación debe hacerse sobre marcado real, no solo sobre cadenas de código.
- **Alternativas consideradas**: Solo pruebas unitarias de las listas de etiquetas (no detectan que el panel sigue renderizando los botones en Marketing); snapshots completos de HTML (frágiles ante cambios de estilo no relacionados).

## Decisiones de diseño (Postventa, sesión 2026-11-26)

### Decisión: Los tickets son `Documento` vinculados a clientes existentes

- **Decisión**: Cada ticket se persiste como un `Documento` con `entity_id` de una `Entidad` ya registrada y campos personalizados `ticket`, `asunto`, `categoria`, `prioridad` y `nota_resolucion`. No se crea la clave `support_tickets` ni un tipo de registro nuevo. El estado del ticket se guarda en `status` con los valores exactos `Abierto`, `En revisión` y `Resuelto`, gobernados por una configuración propia de Postventa y no por el `statusLifecycle` global.
- **Justificación**: `data-model.md` ya descartó el esquema relacional con `support_tickets` por incompatible con la arquitectura sin backend; reutilizar `Documento` conserva la ficha del cliente, la integridad referencial y la eliminación en cascada sin migración (FR-009, FR-104).
- **Alternativas consideradas**: Registros independientes con almacenamiento propio (rompe la ficha del cliente y añade un esquema); reutilizar solo las consultas del `chat` (no permite registrar tickets nuevos ni prioridad); añadir los estados al `statusLifecycle` global (altera todos los formularios y pendientes del panel).

### Decisión: Configuración declarativa propia dentro de `MODULE_CONFIG`

- **Decisión**: Un bloque opcional `postventa` declara `states`, `categoryOptions`, `priorityOptions`, `cardMapping` y `resolutionNoteStates`. Las opciones visibles son «Soporte técnico», «Facturación», «Garantía» y «Consulta» para `categoria`, y «Baja», «Media» y «Alta» para `prioridad`, sin preselección. `transitions` queda vacío para permitir cualquier cambio entre estados, incluida la reapertura.
- **Justificación**: La configuración es el único punto de adaptación del módulo (XR-001, XR-002, XR-005); un bloque opcional mantiene el comportamiento base intacto cuando no hay Postventa y hace verificables las listas exactas (FR-107, FR-108).
- **Alternativas consideradas**: Constantes repartidas en componentes (duplican etiquetas y validación); opciones capturadas como texto libre (aceptan valores no previstos); reutilizar `marketing.faq` o `statusLifecycle` (mezcla dominios distintos).

### Decisión: Utilidad pura de agregación y tabla derivada

- **Decisión**: `src/utils/postventa.js` expone `isTicket(document)`, `computeTicketStats({ documents })`, `listTicketDocuments({ documents, entities, user })` y validaciones puras del formulario. `computeTicketStats()` devuelve `abiertos`, `enProceso` y `resueltos` con una sola pasada; cada documento se cuenta una sola vez según `cardMapping`. La vista vuelve a calcular sobre el arreglo en memoria tras cada mutación, sin persistir derivados.
- **Justificación**: Cumple FR-105 y FR-032/SC-004 con el mismo patrón de `marketing-stats.js` y `computeSummary()`, evitando contadores duplicados y recálculos costosos.
- **Alternativas consideradas**: Guardar contadores en `localStorage` (pueden desincronizarse); recorrer tres veces la lista (innecesario con 500 documentos); filtrar por texto de `notes` (no distingue tickets de otras interacciones).

### Decisión: Quinta opción de navegación y vista dedicada

- **Decisión**: `shell.js` añade `postventa` a `NAV_ITEMS` inmediatamente después de `marketing`; `app.js` registra `?view=postventa` en `ROUTE_VIEWS`/`VIEW_ROUTES` y despacha `renderPostventaView()`. El botón «Nuevo Ticket», las tres tarjetas y la tabla viven en `src/components/postventa.js`, reutilizando `.stat-card`, `.client-management-table`, `.empty-state` y `escapeHtml()`.
- **Justificación**: La solicitud pide el apartado «abajo de Marketing» con el botón arriba y los indicadores debajo; una vista dedicada con el mismo marco evita mezclar Postventa con Marketing o con la gestión de documentos (FR-109, FR-037).
- **Alternativas consideradas**: Añadir un quinto atajo dentro de Marketing (contradice FR-093, que fija exactamente cinco atajos); reutilizar la gestión de documentos (no ofrece el formulario ni las tarjetas pedidas); ocultar la opción con CSS (deja la ruta accesible sin control de permisos).

### Decisión: Permisos canónicos nuevos y funciones de almacenamiento dedicadas

- **Decisión**: Se añaden `postventa:view`, `postventa:view_own`, `postventa:create` y `postventa:transition` al catálogo de `src/auth/permissions.js`. N4 recibe los cuatro; N1 recibe `view`, `create` y `transition`; N2 solo `view_own`; N3 y el visitante ninguno. `src/storage.js` expone `createTicketDocument()`, `changeTicketStatus()` y `listTicketDocuments()`, que llaman a `assertPermission()` antes de usar la ruta interna de escrituras; `listTicketDocuments()` limita N2 a los clientes con `ejecutivo_asignado` igual a su `id`.
- **Justificación**: `addDocument()` permite `document:create` a N3 y `saveDocuments()` exige `document:edit_any`, permiso que N1 no tiene; por tanto las operaciones genéricas no bastan para FR-106/FR-095. Funciones dedicadas mantienen una sola validación de permisos y permiten probar llamadas directas desde consola.
- **Alternativas consideradas**: Dar `document:edit_any` a Atención al Cliente (amplía permisos sobre todas las interacciones); confiar solo en el ocultamiento de botones (falla FR-095); duplicar la lógica de validación en el componente (dos fuentes de verdad).
