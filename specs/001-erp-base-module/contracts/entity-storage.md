# Contrato de Almacenamiento de Entidades

## Propósito

La aplicación almacena los registros de entidad localmente en el navegador usando `localStorage`.

## Forma de los Datos

Cada registro de entidad **base** (sin ningún módulo personalizado configurado) debe incluir:

- `id`: cadena única
- `entity_id`: cadena única, generada automáticamente, usada para vincular documentos
- `name`: cadena no vacía
- `code`: cadena no vacía y única entre todas las entidades (comparación sin distinguir mayúsculas ni espacios); cuando `fieldRules.entity.code.generated` está activo, `addEntity()` lo genera antes de validar
- `category`: cadena opcional; en el perfil de clientes se conserva pero no se muestra ni se busca
- `description`: cadena opcional; en el perfil de clientes se conserva pero no se muestra ni se busca
- `targetDate`: cadena de fecha opcional (YYYY-MM-DD) válida cuando está presente; en el perfil de clientes es obligatoria y debe cumplir la regla `entityDate` descrita abajo
- `createdAt`: cadena de marca de tiempo ISO
- `updatedAt`: cadena de marca de tiempo ISO

Un módulo personalizado (p. ej. el perfil CRM de las Historias de Usuario 2, 3, 5-8) declara campos adicionales mediante `module-config.js` (`customFields.entity`, Historia de Usuario 8). El perfil de clientes declara `rubro` (mismo clave, etiqueta «Tipo de actividad» y `select` con diez opciones), `ejecutivo_asignado` (`select` de usuarios activos Nivel 2 o Nivel 4, guarda `userId`), `canal_contacto` (selección obligatoria con valores `llamada`, `correo`, `reunion`, `whatsapp` y etiquetas «Llamada», «Correo», «Reunión», «WhatsApp»), `rut` (obligatorio, `format: "cl-rut"`, `unique: true`, pista gris `Ej: 11.111.111-1`) y los campos condicionales `contacto_telefono`, `contacto_correo`, `contacto_lugar` y `contacto_whatsapp` (obligatorios según el canal, con `group: "contactDetail"` y pista gris por canal). Otros módulos pueden declarar `taxId`, `email`, `phone`, `address`, `creditLimit` o `paymentTerms`. El perfil de Marketing declara `estado_comercial`, `consentimiento`, `consentimiento_fecha`, `consentimiento_version` y `campaña` opcional. Estos valores se persisten como propiedades adicionales del mismo registro, sin cambiar su estructura base (XR-001). `pedidos` ya no se declara en el perfil de clientes; sus valores anteriores se conservan sin mostrarse.

## Operaciones

- `loadEntities()`: devuelve todas las entidades almacenadas.
- `saveEntities(entities)`: persiste la lista completa.
- `addEntity(entity)`: añade una nueva entidad.
- `updateEntity(id, updates)`: actualiza una entidad existente.
- `deleteEntity(id)`: elimina una entidad por id.

## Almacenamiento de Documentos

Cada registro de documento **base** debe incluir:

- `id`: cadena única
- `entity_id`: el entity_id autogenerado de la entidad vinculada; obligatorio y debe corresponder a una entidad existente
- `startDate`: cadena de fecha de calendario opcional; cuando se provee junto a `endDate`, `endDate` debe ser igual o posterior
- `endDate`: cadena de fecha de calendario opcional
- `notes`: cadena opcional (p. ej. la descripción de una interacción, Historia de Usuario 2)
- `status`: cadena opcional; texto libre cuando no hay `statusLifecycle` configurado (FR-031), o restringido a transiciones válidas cuando sí lo hay (FR-030, Historia de Usuario 13)
- `createdAt`: cadena de marca de tiempo ISO
- `updatedAt`: cadena de marca de tiempo ISO

Un módulo personalizado declara campos adicionales mediante `customFields.document` — por ejemplo `series`/`folio` (número de documento) o `subtotal`/`discount`/`taxAmount`/`totalAmount` para un módulo de Ventas, o `interactionType` para el perfil CRM (Historia de Usuario 8). El perfil de Marketing declara `plataforma` o `canal`, `tipo_interaccion`, `nota`/`mensaje`, `enlace`, `automation_key`, `campaignId` y `campaña` opcional. El perfil de Postventa declara `ticket` (discriminador booleano), `asunto`, `categoria`, `prioridad` y `nota_resolucion` opcional en `customFields.document`. El perfil CRM declara además `motivo_perdida` en `customFields.document`, obligatorio solo según la regla `documentRules.lostReason` descrita abajo. La validación "`discount` no puede superar `subtotal`" aplica solo cuando el módulo declara ambos campos.

Operaciones:

- `loadDocuments()`: devuelve todos los documentos almacenados.
- `saveDocuments(documents)`: persiste la lista completa.
- `addDocument(document)`: añade un nuevo documento.
- `updateDocument(id, updates)`: actualiza un documento existente.
- `deleteDocument(id)`: elimina un documento por id.
- `deleteDocumentsForEntity(entityId)`: elimina todos los documentos vinculados cuando se invoca explícitamente; `deleteEntity()` no lo llama automáticamente.

### Operaciones de Postventa

- `listTicketDocuments({ documents, entities, user })`: devuelve solo documentos con `ticket: true` visibles para el usuario resuelto; sin `postventa:view` ni `postventa:view_own` devuelve una lista vacía o lanza la denegación, sin filtrar por texto de `notes`.
- `createTicketDocument(values)`: valida `entity_id` existente, `asunto`, `categoria`, `prioridad`, `status` y `nota_resolucion` condicional, comprueba `postventa:create` y delega en la ruta interna de creación de `Documento`.
- `changeTicketStatus(documentId, nextStatus, resolutionNote)`: comprueba `postventa:transition`, acepta cualquier par de estados declarados, actualiza `updatedAt` y persiste o descarta `nota_resolucion` según el estado final.

## Expectativas de Validación

- Un `name` o `code` faltante debe rechazarse antes de la persistencia.
- Un `code` duplicado debe rechazarse antes de la persistencia (comparación sin distinguir mayúsculas ni espacios).
- Un `targetDate` presente debe ser una fecha de calendario válida.
- Si la configuración activa declara `entityDate`, un `targetDate` presente debe cumplir `min <= targetDate <= max`. En el perfil de clientes, `min = "1910-01-01"` y `max` es la fecha local actual resuelta en el momento de la validación.
- La validación de rango se aplica al objeto fusionado en `updateEntity()`; por eso un registro histórico con fecha fuera de rango puede consultarse pero no guardarse sin corregir la fecha.
- Los campos personalizados obligatorios (declarados en `module-config.js`) deben validarse con la misma experiencia de retroalimentación que los campos base (p. ej. `email` con formato válido, `creditLimit` no negativo cuando el módulo los declara).
- Cuando `entityDate.required` está activo, un `targetDate` ausente debe rechazarse antes de la persistencia.
- Cuando un campo declara `format`, su valor debe cumplir el formato registrado en `src/utils/field-formats.js`: `cl-rut` (dígito verificador válido), `phone`, `email` o `nonEmpty`.
- Cuando un campo declara `unique: true`, su valor normalizado debe ser distinto al de todos los demás registros del mismo tipo; `normalize: "cl-rut"` elimina puntos, guion y espacios y uniformiza la `K`.
- `cl-rut` acepta `12345678-9` y `12.345.678-9`; ambas formas se normalizan antes de validar el dígito verificador y antes de comparar unicidad, por lo que un RUT repetido con distinta puntuación se rechaza (FR-057).
- Un `placeholder` es solo una pista visual en gris: no se persiste, se valida ni se cuenta como valor capturado (FR-062, FR-067).
- En un campo `select`, la etiqueta visible se deriva de `label` cuando las opciones son objetos `{ value, label }`; el valor guardado y el usado en `when.equals` siguen siendo `value` (FR-063).
- Los campos con `when: { key, equals }` solo se validan y persisten cuando la condición se cumple. Dentro de un mismo `group`, solo se conserva el valor del campo activo; los valores de los demás se descartan al guardar.
- Los campos con `hidden: true` o `searchable: false` no se renderizan ni se incluyen en la búsqueda, pero sus valores almacenados se conservan en `updateEntity()`.
- Con `detailPolicy.entity.blockWhenInvalid`, la apertura de la ficha debe comprobar los campos obligatorios y formatos; si hay errores, se muestra la explicación y la acción de editar, sin impedir la edición correctora.
- Un `endDate` presente debe ser igual o posterior a `startDate` cuando ambos están presentes.
- Un entity_id debe generarse automáticamente y debe ser único.
- Un documento sin un `entity_id` que coincida con una entidad existente debe rechazarse.
- Eliminar una entidad solo debe proceder cuando no tenga documentos ni registros vinculados; con registros vinculados debe rechazarse con `EntityHasRecordsError`, sin borrar nada, y ofrecer archivar la entidad para conservar el historial (FR-003, FR-009, FR-103). `deleteDocumentsForEntity()` sigue siendo una operación explícita y distinta, no una consecuencia automática de borrar la entidad.
- Las operaciones de almacenamiento deben preservar el orden actual de la lista y actualizar las marcas de tiempo.
- Con `marketing` activo, una entidad capturada desde el formulario público requiere `consentimiento = true`, `consentimiento_fecha` y `consentimiento_version`; el guardado debe rechazarse sin ellos (FR-071, FR-085).
- `estado_comercial` debe conservar su valor interno aunque no se renderice en Marketing (FR-068, FR-075).
- `campaña` es opcional en entidades y documentos; su ausencia significa «Sin campaña» y no debe rechazarse (FR-088).
- Un documento con `ticket: true` requiere `entity_id` de un cliente existente, `asunto`, `categoria` de las cuatro opciones declaradas, `prioridad` de las tres opciones declaradas y `status` de los tres estados declarados (FR-104, FR-107, FR-108).
- `prioridad` no tiene valor preseleccionado: su ausencia se rechaza con `Completa los campos obligatorios.` (FR-108).
- `nota_resolucion` es obligatoria cuando `status = Resuelto` y se descarta cuando el estado final es otro; ambos casos usan `Completa los campos obligatorios.` si falta el texto requerido (FR-108).
- Cualquier transición entre `Abierto`, `En revisión` y `Resuelto` es válida, incluida `Resuelto → Abierto`; no se aplica el `statusLifecycle` global a los tickets (FR-109).
- Las operaciones de Postventa no crean una clave nueva de `localStorage`; los tickets se conservan al archivar y bloquean la baja definitiva del cliente mientras existan. Solo una invocación explícita de `deleteDocumentsForEntity()` los eliminaría, sin formar parte del flujo normal de baja.
- Con `documentRules.lostReason` activo, un documento cuya entidad vinculada tenga `estado_comercial = prospecto` y cuyo `status` sea `cerrado perdido` debe incluir `motivo_perdida` con una de las cuatro opciones declaradas; sin ese valor, `addDocument()` y `updateDocument()` deben rechazar la escritura con `Completa los campos obligatorios.` antes de modificar `erp_documents` (FR-113).
- Un cliente convertido (`estado_comercial = ganado`) u otro estado comercial distinto de `prospecto` no debe exigir motivo en un documento cerrado como perdido.
- `cerrado perdido` no debe contarse como documento pendiente, venta ganada ni importe del real mensual; solo debe aparecer en el embudo por estados de documento (FR-035, FR-078, FR-113, SC-043).

## Contrato de Configuración `entityDate`

Cuando `module-config.js` declara `entityDate`, debe tener esta forma:

```js
entityDate: {
  label: 'Fecha de nacimiento',
  min: '1910-01-01',
  max: 'localToday',
  required: true,
}
```

- `label`: cadena no vacía usada en todas las etiquetas visibles del campo `targetDate`. Si se omite, se usa "Fecha objetivo".
- `min`: fecha ISO `YYYY-MM-DD` válida. Si se omite, no hay límite inferior.
- `max`: fecha ISO `YYYY-MM-DD` válida o el centinela `localToday`, que se resuelve a la fecha local del dispositivo en cada cálculo.
- `required`: booleano opcional. Con `true`, `targetDate` debe estar presente y válida; con `false` o ausente, el campo sigue siendo opcional.
- Si el bloque `entityDate` está ausente, el campo conserva el comportamiento base sin rango y sin obligatoriedad.
- El centinela `localToday` debe calcularse con componentes locales (`getFullYear`/`getMonth`/`getDate`), nunca con `toISOString()`.
- La UI debe reflejar `min`, `max` y `label` en el formulario y actualizar `max` sin recargar cuando cambia el día local.

## Contrato de Configuración `postventa`

Cuando `module-config.js` declara `postventa`, debe tener esta forma:

```js
postventa: {
  states: ['Abierto', 'En revisión', 'Resuelto'],
  categoryOptions: [
    { value: 'soporte_tecnico', label: 'Soporte técnico' },
    { value: 'facturacion', label: 'Facturación' },
    { value: 'garantia', label: 'Garantía' },
    { value: 'consulta', label: 'Consulta' },
  ],
  priorityOptions: [
    { value: 'baja', label: 'Baja' },
    { value: 'media', label: 'Media' },
    { value: 'alta', label: 'Alta' },
  ],
  transitions: [],
  cardMapping: { abiertos: 'Abierto', enProceso: 'En revisión', resueltos: 'Resuelto' },
  resolutionNoteStates: ['Resuelto'],
}
```

- `states`, `categoryOptions`, `priorityOptions` y `resolutionNoteStates` son las únicas fuentes de opciones visibles y de validación; el valor persistido es `value`, no `label`.
- `transitions: []` permite cualquier cambio entre estados declarados; si se declaran pares explícitos, solo esos pares son válidos.
- `cardMapping` asocia cada tarjeta con un estado exacto; no se cuentan dos veces los documentos que comparten estado.
- Sin el bloque `postventa`, la ruta `?view=postventa` no se registra y el resto del módulo conserva su comportamiento.

## Contrato de `documentRules.lostReason`

Cuando `module-config.js` declara `documentRules.lostReason`, debe tener esta forma:

```js
documentRules: {
  lostReason: {
    status: 'cerrado perdido',
    entityStateField: 'estado_comercial',
    entityState: 'prospecto',
    customField: 'motivo_perdida',
    options: ['Precio alto', 'Eligió competencia', 'Sin presupuesto', 'No responde'],
  },
}
```

- `status` es el valor normalizado de `Documento.status` que activa la regla; coincide con un estado ya declarado en `statusLifecycle.states`.
- `entityStateField` y `entityState` identifican la condición de la entidad vinculada; solo con ese valor se exige el motivo.
- `customField` debe estar declarado en `customFields.document` y es la clave persistida en el documento.
- `options` contiene las etiquetas exactas y canónicas; la comparación de validación ignora mayúsculas y acentos, pero el valor guardado es la opción declarada.
- Sin la regla, el módulo base mantiene el comportamiento anterior: el motivo no existe y no se exige (XR-001).
- La validación se ejecuta en `validateDocumentData()` con las entidades ya cargadas, por lo que también cubre llamadas directas desde consola o enlaces profundos (FR-095, FR-113).

## Contrato de `fieldRules` y `detailPolicy`

Cuando un módulo necesita reglas por campo, declara un mapa opcional por tipo de registro. Las claves pueden ser campos base o personalizados y no requieren volver a declararlos en `customFields`:

```js
fieldRules: {
  entity: {
    code: { generated: { strategy: 'prefixSequence', prefix: 'CLI-', pad: 3 }, unique: true, hidden: true, searchable: false },
    rut: { required: true, format: 'cl-rut', unique: true, normalize: 'cl-rut', order: 2, placeholder: 'Ej: 11.111.111-1' },
    canal_contacto: { required: true, order: 4, options: [{ value: 'llamada', label: 'Llamada' }, { value: 'correo', label: 'Correo' }, { value: 'reunion', label: 'Reunión' }, { value: 'whatsapp', label: 'WhatsApp' }] },
    contacto_correo: { when: { key: 'canal_contacto', equals: 'correo' }, required: true, format: 'email', group: 'contactDetail', order: 4, placeholder: 'Ej: nombre@ejemplo.cl' },
  },
},
detailPolicy: { entity: { blockWhenInvalid: true, offerEditAction: true } },
```

- `hidden`: excluye el campo de formulario, lista, ficha y selectores; el valor almacenado se conserva.
- `searchable: false`: excluye el campo de la búsqueda sin borrar su valor.
- `generated`: `addEntity()` asigna el valor antes de validar, usando una secuencia con prefijo y relleno; el usuario nunca lo captura.
- `required`, `unique`, `format`, `normalize`: se resuelven en la validación compartida, con los formatos registrados en `src/utils/field-formats.js`.
- `when`: el campo solo existe para la vista y la validación cuando `{ key, equals }` coincide con el valor actual del registro.
- `group`: dentro de un grupo, collectar y persistir solo el campo activo; los demás valores se descartan.
- `detailPolicy.entity.blockWhenInvalid`: la ficha usa la misma validación que el guardado; si falla, muestra los errores y ofrece editar en lugar de los datos.
- Sin `fieldRules` ni `detailPolicy`, el módulo base mantiene su comportamiento actual: todos los campos visibles y buscables, sin generación ni bloqueo de ficha.

## Contrato de Presentación del Formulario de Clientes

- `order` es un número opcional por campo; al renderizar se ordenan primero los campos con `order` de menor a mayor y se mantiene el orden de declaración para los que no lo tienen o empatan. En el perfil de clientes: `name` 1, `rut` 2, `targetDate` 3, `canal_contacto` y su campo activo `contactDetail` 4, `rubro` 5 y `ejecutivo_asignado` 6 (FR-065).
- `placeholder` es texto de ejemplo opcional; se renderiza en color gris y desaparece al escribir. No altera la validación ni el registro (FR-062, FR-067).
- Los desplegables admiten `options` como cadenas o como `{ value, label }`. La interfaz muestra `label` pero persiste `value`; por eso «Llamada» se guarda como `llamada` y sigue satisfaciendo `when.equals` (FR-063).
- `rubro` conserva su clave, cambia su etiqueta a «Tipo de actividad» y usa `select` con exactamente: «Dependiente», «Independiente Formal», «Independiente Informal», «Jubilado», «Dueño/a de casa», «Estudiante», «FFAA», «Rentista», «Jubilado - FFAA» y «Cesante» (FR-066).
- El encabezado de creación del cliente dentro de «Gestionar clientes» muestra «Nuevo Cliente»; el término se deriva de `labels.entity` sin forzar género (FR-064). El panel principal ya no ofrece esa acción rápida: la creación se hace desde la pantalla de gestión (FR-033, FR-034).
- Las pistas de la casilla adicional de contacto son: `Ej: +56 9 1234 5678` para «Llamada» y «WhatsApp», `Ej: nombre@ejemplo.cl` para «Correo» y `Ej: Sala 2 o enlace» para «Reunión» (FR-067).

## Expectativas de Extensibilidad

- Los campos adicionales añadidos por módulos personalizados deben persistirse junto a los campos base sin manejo especial en la capa de almacenamiento.
- Los valores de campos personalizados que ya no están declarados en la configuración deben conservarse en el almacenamiento y ocultarse de la interfaz; si el campo se vuelve a declarar, los valores reaparecen.
- Las operaciones base anteriores permanecen estables para que los módulos personalizados puedan construir sobre ellas sin modificación.

## Contrato de Autorización de Operaciones

Desde la octava tanda, `src/storage.js` depende de `src/auth/permissions.js` antes de mutar datos. `loadEntities()` y `loadDocuments()` siguen siendo de solo lectura; `saveEntities()`, `saveDocuments()`, `addEntity()`, `updateEntity()`, `updateEntityStage()`, `deleteEntity()`, `addDocument()`, `updateDocument()`, `deleteDocument()` y `deleteDocumentsForEntity()` DEBEN resolver la sesión vigente y llamar a `assertPermission(rank, action, context)` con la acción correspondiente.

- Las acciones son las del catálogo canónico de `spec.md` y [`auth.md`](auth.md): `entity:create`, `entity:edit_any`, `entity:edit_own`, `entity:delete`, `document:create`, `document:read`, `document:edit_any`, `document:edit_own`, `document:transition_own`, `document:delete`, `campaign:create`, `campaign:edit_own`, `campaign:stop_own`, `campaign:stop_any`, `postventa:view`, `postventa:view_own`, `postventa:create`, `postventa:transition`, `team:manage` y `users:manage`, entre otras. No se introducen identificadores propios como `entity:edit` o `interaction:manage`.
- `context.ownerId` se compara con el `id` del usuario resuelto para las reglas «solo mis clientes»; `context.campaignOwnerId` cumple la misma función para campañas.
- Una operación denegada se rechaza con el mensaje exacto `No tienes permiso para realizar esta acción` y no escribe en `localStorage`; esto cubre también llamadas directas desde consola o enlaces profundos (FR-095, FR-096, SC-035).
- `Sistema` está exento del rango del usuario conectado únicamente para las automatizaciones declaradas; cada ejecución conserva la identidad «Sistema» y el creador de la campaña.
- La resolución del usuario se hace desde `erp_users`, no desde una copia caches en la sesión, para que desactivaciones y cambios de rango se apliquen de inmediato (FR-102).
- Ocultar botones en `app.js`, `shell.js` o `dashboard.js` es una ayuda de experiencia de usuario, no el mecanismo de seguridad; la capa de datos sigue siendo la última barrera.

## Contrato del Campo `ejecutivo_asignado`

- En el perfil de clientes, `ejecutivo_asignado` deja de ser texto libre y se resuelve como un `select` con los usuarios activos cuyo rango es Nivel 2 o Nivel 4 (FR-099).
- El valor persistido es el `id` del usuario; la interfaz muestra su `username`.
- Usuarios inactivos o con otro rango no aparecen como opciones. Los clientes que quedaron con un ejecutivo desactivado se muestran como «Sin asignar» hasta que el Gerente los reasigne; sus ventas históricas siguen contando para el integrante vinculado al usuario (FR-100).
- Cada integrante de `marketing.salesTeams` guarda `userId` apuntando al mismo usuario activo, y el real y objetivo mensuales se calculan desde los clientes asignados a ese identificador.

## Contrato de Búsqueda Canónica (D1)

FR-004 es la única lista de campos buscables: nombre, código, categoría, descripción, fecha objetivo y campos personalizados visibles declarados en la configuración activa. `searchEntities()` DEBE resolver los campos con `isFieldSearchable()`/`fieldRules`, sin ampliar la búsqueda con todas las claves presentes en el registro ni mantener listas paralelas en la barra de búsqueda. FR-020 y FR-055 solo aplican la anulación del perfil de clientes mediante `fieldRules`/perfil, sin crear una lista independiente ni declarar buscable un campo excluido en otro lugar sin esa anulación. Sin coincidencias se muestra exactamente `No se encontraron resultados.` (FR-005, FR-006).

## Rutas relativas

Las vistas se resuelven desde `location.search` en un mismo documento HTML sin host ni ruta de servidor: sin parámetro `view` es Panel; las rutas relativas son `?view=summary`, `?view=capture`, `?view=marketing`, `?view=postventa`, `?view=manage-entity`, `?view=manage-document` y `?view=users-admin`. No existe `?view=panel`. Carga, recarga y Back/Forward aplican la matriz de permisos en cada resolución.

## Mensajes exactos de validación

Los guardados rechazados usan `Completa los campos obligatorios.`, `El RUT es inválido.`, `El RUT ya está registrado.` y `Revisa el dato de contacto según el canal elegido.`; una operación denegada usa `No tienes permiso para realizar esta acción`. No se aceptan paráfrasis ni mensajes por campo que sustituyan estos textos (FR-006).
