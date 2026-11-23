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

Un módulo personalizado (p. ej. el perfil CRM de las Historias de Usuario 2, 3, 5-8) declara campos adicionales mediante `module-config.js` (`customFields.entity`, Historia de Usuario 8). El perfil de clientes declara `rubro` (mismo clave, etiqueta «Tipo de actividad» y `select` con diez opciones), `ejecutivo_asignado`, `canal_contacto` (selección obligatoria con valores `llamada`, `correo`, `reunion`, `whatsapp` y etiquetas «Llamada», «Correo», «Reunión», «WhatsApp»), `rut` (obligatorio, `format: "cl-rut"`, `unique: true`, pista gris `Ej: 11.111.111-1`) y los campos condicionales `contacto_telefono`, `contacto_correo`, `contacto_lugar` y `contacto_whatsapp` (obligatorios según el canal, con `group: "contactDetail"` y pista gris por canal). Otros módulos pueden declarar `taxId`, `email`, `phone`, `address`, `creditLimit` o `paymentTerms`. Estos valores se persisten como propiedades adicionales del mismo registro, sin cambiar su estructura base (XR-001). `pedidos` ya no se declara en el perfil de clientes; sus valores anteriores se conservan sin mostrarse.

## Operaciones

- `loadEntities()`: devuelve todas las entidades almacenadas.
- `saveEntities(entities)`: persiste la lista completa.
- `addEntity(entity)`: añade una nueva entidad.
- `updateEntity(id, updates)`: actualiza una entidad existente.
- `deleteEntity(id)`: elimina una entidad por id.

## Almacenamiento de Documentos

Cada registro de documento debe incluir:

Cada registro de documento **base** debe incluir:

- `id`: cadena única
- `entity_id`: el entity_id autogenerado de la entidad vinculada; obligatorio y debe corresponder a una entidad existente
- `startDate`: cadena de fecha de calendario opcional; cuando se provee junto a `endDate`, `endDate` debe ser igual o posterior
- `endDate`: cadena de fecha de calendario opcional
- `notes`: cadena opcional (p. ej. la descripción de una interacción, Historia de Usuario 2)
- `status`: cadena opcional; texto libre cuando no hay `statusLifecycle` configurado (FR-031), o restringido a transiciones válidas cuando sí lo hay (FR-030, Historia de Usuario 13)
- `createdAt`: cadena de marca de tiempo ISO
- `updatedAt`: cadena de marca de tiempo ISO

Un módulo personalizado declara campos adicionales mediante `customFields.document` — por ejemplo `series`/`folio` (número de documento) o `subtotal`/`discount`/`taxAmount`/`totalAmount` para un módulo de Ventas, o `interactionType` para el perfil CRM (Historia de Usuario 8). La validación "`discount` no puede superar `subtotal`" aplica solo cuando el módulo declara ambos campos.

Operaciones:

- `loadDocuments()`: devuelve todos los documentos almacenados.
- `saveDocuments(documents)`: persiste la lista completa.
- `addDocument(document)`: añade un nuevo documento.
- `updateDocument(id, updates)`: actualiza un documento existente.
- `deleteDocument(id)`: elimina un documento por id.
- `deleteDocumentsForEntity(entityId)`: elimina todos los documentos vinculados a una entidad eliminada.

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
- Eliminar una entidad también debe eliminar todos los documentos vinculados a su entity_id.
- Las operaciones de almacenamiento deben preservar el orden actual de la lista y actualizar las marcas de tiempo.

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
- El encabezado de creación del cliente y su acción rápida muestran «Nuevo Cliente»; el término se deriva de `labels.entity` sin forzar género (FR-064).
- Las pistas de la casilla adicional de contacto son: `Ej: +56 9 1234 5678` para «Llamada» y «WhatsApp», `Ej: nombre@ejemplo.cl` para «Correo» y `Ej: Sala 2 o enlace» para «Reunión» (FR-067).

## Expectativas de Extensibilidad

- Los campos adicionales añadidos por módulos personalizados deben persistirse junto a los campos base sin manejo especial en la capa de almacenamiento.
- Los valores de campos personalizados que ya no están declarados en la configuración deben conservarse en el almacenamiento y ocultarse de la interfaz; si el campo se vuelve a declarar, los valores reaparecen.
- Las operaciones base anteriores permanecen estables para que los módulos personalizados puedan construir sobre ellas sin modificación.
