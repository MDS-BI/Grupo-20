# Contrato de Almacenamiento de Entidades

## Propósito

La aplicación almacena los registros de entidad localmente en el navegador usando `localStorage`.

## Forma de los Datos

Cada registro de entidad **base** (sin ningún módulo personalizado configurado) debe incluir:

- `id`: cadena única
- `entity_id`: cadena única, generada automáticamente, usada para vincular documentos
- `name`: cadena no vacía
- `code`: cadena no vacía y única entre todas las entidades (comparación sin distinguir mayúsculas ni espacios)
- `category`: cadena opcional
- `description`: cadena opcional
- `targetDate`: cadena de fecha opcional (YYYY-MM-DD) válida cuando está presente
- `createdAt`: cadena de marca de tiempo ISO
- `updatedAt`: cadena de marca de tiempo ISO

Un módulo personalizado (p. ej. el perfil CRM de las Historias de Usuario 2, 3, 5-8) declara campos adicionales mediante `module-config.js` (`customFields.entity`, Historia de Usuario 8) — por ejemplo `taxId`, `email` (validado con formato de correo cuando está presente), `phone`, `address`, `creditLimit` (número no negativo) o `paymentTerms`. Estos valores se persisten como propiedades adicionales del mismo registro, sin cambiar su estructura base (XR-001).

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
- Los campos personalizados obligatorios (declarados en `module-config.js`) deben validarse con la misma experiencia de retroalimentación que los campos base (p. ej. `email` con formato válido, `creditLimit` no negativo cuando el módulo los declara).
- Un `endDate` presente debe ser igual o posterior a `startDate` cuando ambos están presentes.
- Un entity_id debe generarse automáticamente y debe ser único.
- Un documento sin un `entity_id` que coincida con una entidad existente debe rechazarse.
- Eliminar una entidad también debe eliminar todos los documentos vinculados a su entity_id.
- Las operaciones de almacenamiento deben preservar el orden actual de la lista y actualizar las marcas de tiempo.

## Expectativas de Extensibilidad

- Los campos adicionales añadidos por módulos personalizados deben persistirse junto a los campos base sin manejo especial en la capa de almacenamiento.
- Los valores de campos personalizados que ya no están declarados en la configuración deben conservarse en el almacenamiento y ocultarse de la interfaz; si el campo se vuelve a declarar, los valores reaparecen.
- Las operaciones base anteriores permanecen estables para que los módulos personalizados puedan construir sobre ellas sin modificación.
