# Contrato de Postventa

## Propósito

Definir el comportamiento observable del apartado «Postventa» (US25, FR-104 a FR-109) y de la ruta pública que crea tickets desde «Soporte Postventa» del Portal del Cliente (FR-114, FR-116): quinta opción de la barra lateral, botón «Nuevo Ticket», tres tarjetas derivadas de los tickets y una tabla cuyo estado puede cambiarse libremente. El formulario se abre en un panel dentro de la misma página, sustituyendo temporalmente la tabla sin abrir pestaña nueva; guardar cierra el panel y vuelve a la tabla actualizada, y cancelar con cambios sin guardar pide confirmación. Su presentación visual es la misma que la del formulario «Nuevo Cliente», y las tres tarjetas tienen el tamaño de los indicadores de «Resumen». La fuente funcional es [`../spec.md`](../spec.md); el modelo resumido está en [`../data-model.md`](../data-model.md#9-postventa-historia-de-usuario-25). No se introduce backend, dependencia nueva ni clave adicional de `localStorage`.

## Datos y configuración

- Cada ticket es un `Documento` con `entity_id` de un cliente existente y `ticket: true`; sus campos personalizados son `asunto`, `categoria`, `prioridad` y `nota_resolucion`, y su estado se guarda en `status`.
- `categoria` acepta solo `soporte_tecnico`, `facturacion`, `garantia` y `consulta`, mostrados como «Soporte técnico», «Facturación», «Garantía» y «Consulta».
- `prioridad` acepta solo `baja`, `media` y `alta`, mostrados como «Baja», «Media» y «Alta», sin preselección.
- `status` acepta solo `Abierto`, `En revisión` y `Resuelto`.
- La configuración `postventa` de `module-config.js` es la única fuente de opciones, `cardMapping` y `resolutionNoteStates`; `transitions: []` permite cualquier cambio entre estados, incluida la reapertura.
- Para la forma exacta de la configuración y del documento, ver [`entity-storage.md`](entity-storage.md).

## Operaciones de `src/storage.js`

- `listTicketDocuments({ documents, entities, user })`: devuelve los tickets visibles para el usuario; sin permiso devuelve lista vacía o denegación, nunca todos los documentos.
- `createTicketDocument(values)`: valida cliente existente y campos obligatorios, comprueba `postventa:create` y crea el `Documento`.
- `createPortalTicketDocument(values)`: ruta pública separada para «Soporte Postventa»; valida `correo`, `categoria` y `descripcion`, exige un cliente encontrado por correo o teléfono y crea el mismo `Documento` de ticket con `status = 'Abierto'` y `prioridad = 'media'`. No comprueba `postventa:create` porque el actor es `visitor`, pero no modifica la matriz ni habilita la vista interna (FR-106, FR-114, FR-116).
- `changeTicketStatus(documentId, nextStatus, resolutionNote)`: comprueba `postventa:transition`, acepta cualquier par de estados y actualiza `nota_resolucion` y `updatedAt`.
- `deleteEntity()` no elimina tickets en cascada: si el cliente tiene tickets u otros documentos vinculados, la baja se rechaza con `EntityHasRecordsError` y se ofrece archivarlo. `deleteDocumentsForEntity()` solo actúa si se invoca explícitamente; en la vista de Postventa no existe borrado independiente.
- La acción «Abrir Ticket» de la tabla «Clientes» no llama directamente a `createTicketDocument()`: navega a `?view=postventa`, abre el panel y precarga el cliente. La creación sigue pasando por `createTicketDocument()` y su comprobación de `postventa:create`.

## Validación

- El formulario «Nuevo Ticket» muestra los campos en este orden: «Cliente», «Asunto», «Categoría», «Prioridad», «Estado» y «Nota de resolución».
- «Cliente» es un desplegable `select#ticket-client` con todos los clientes existentes y un buscador de texto `input#ticket-client-search`; escribir filtra por `name` sin crear opciones nuevas. Al llegar desde «Abrir Ticket», el `entity_id` de la fila aparece preseleccionado en ese desplegable sin crear el documento hasta guardar (FR-112).
- «Categoría» y «Prioridad» son desplegables con las opciones declaradas; «Prioridad» arranca sin selección.
- «Estado» ofrece los tres estados declarados; si se elige «Resuelto», «Nota de resolución» pasa a ser obligatoria.
- Cualquier campo obligatorio ausente, incluida la nota en estado «Resuelto» y la prioridad sin elegir, se rechaza con el mensaje exacto `Completa los campos obligatorios.`
- Al guardar en un estado distinto de «Resuelto», `nota_resolucion` se descarta aunque se haya escrito.
- Un `entity_id` inexistente o un cliente eliminado se rechaza antes de persistir.
- El formulario del panel usa la misma presentación visual que «Nuevo Cliente» —tarjetas, etiquetas, espaciado, colores, pistas en gris y botones— sin incorporar campos ni reglas de validación de entidades.
- Guardar cierra el panel y vuelve a la tabla con la fila nueva y las tarjetas recalculadas; cancelar sin cambios cierra el panel de inmediato, y cancelar con cambios sin guardar pide confirmación antes de descartarlos.
- «Soporte Postventa» del portal muestra solo «Correo del cliente», «Categoría» y «Descripción del problema», todos obligatorios. El envío sin coincidencia por correo ni teléfono responde `No encontramos un cliente con ese correo o teléfono.` y no escribe en `erp_entities` ni `erp_documents` (FR-114, FR-116).
- El ticket público se guarda con `asunto` derivado de la categoría elegida, `descripcion` en `notes`, estado `Abierto` y prioridad `Media`; aparece en la ficha del cliente, en la tabla y en las tres tarjetas al volver al CRM, sin recarga (FR-104, SC-044).

## Permisos

| Rango                     | Ver listado       | Crear                        | Cambiar estado                      |
| ------------------------- | ----------------- | ---------------------------- | ----------------------------------- |
| N4 Gerente comercial      | Todos los tickets | Sí                           | Cualquiera                          |
| N1 Atención al cliente    | Todos los tickets | Sí                           | Cualquiera                          |
| N2 Ejecutivo de Ventas    | Solo sus clientes | No                           | No                                  |
| N3 Ejecutivo de Marketing | No                | No                           | No                                  |
| Visitante                 | No                | No (sí en el portal, FR-114) | No (solo N1/N4 en la vista interna) |

- Las acciones canónicas son `postventa:view`, `postventa:view_own`, `postventa:create` y `postventa:transition`, definidas en [`auth.md`](auth.md).
- La pertenencia de N2 se resuelve con `Entidad.ejecutivo_asignado === user.id`; cambiar el asignado cambia la visibilidad sin mutar los tickets.
- La denegación exacta es `No tienes permiso para realizar esta acción` y se aplica en la capa de datos, no solo ocultando botones.
- La creación pública del portal es la única excepción de actor sin sesión y se limita a `createPortalTicketDocument()`: no otorga `postventa:view`, `postventa:view_own`, `postventa:create` ni `postventa:transition`, y un visitante sigue recibiendo «Acceso denegado» al abrir `?view=postventa` o al llamar a `createTicketDocument()` (FR-094, FR-106, FR-114).

## Interfaz

- `src/components/shell.js`: `NAV_ITEMS` incluye `postventa` inmediatamente después de `marketing`, con etiqueta «Postventa» y resaltado derivado de `state.view`.
- `src/app.js`: `ROUTE_VIEWS`/`VIEW_ROUTES` incluyen `postventa`; la resolución aplica la matriz antes de renderizar, incluso en enlaces profundos y Back/Forward. También registra `?view=client-portal` como ruta pública sin marco ERP; ver [`customer-portal.md`](customer-portal.md).
- `src/components/postventa.js`: renderiza «Nuevo Ticket» arriba y las tarjetas «Tickets abiertos», «En proceso» y «Resueltos» debajo; el cuerpo inferior alterna entre la tabla de gestión y el panel del formulario según `state.ticketFormOpen`, reutilizando `.stat-card`, `.client-management-table` y `.empty-state`. Al cerrar el panel vuelven a mostrarse el botón «Nuevo Ticket» y la tabla.
- `src/components/ticket-form.js`: contiene el único formulario de «Nuevo Ticket», con el mismo orden de campos, buscador `#ticket-client-search`, opciones declaradas y mensajes exactos; sus casillas usan `.form-field`, `.client-form-section` y `.form-actions` para igualar la presentación de «Nuevo Cliente», sin adoptar sus campos ni reglas.
- `src/app.js`: `state.ticketFormOpen` controla el panel en la misma vista `?view=postventa`; no hay ruta `ticket-form`, `window.open` ni listener `storage`. La acción `open-ticket` comprueba `postventa:create`, navega a Postventa y fija `state.ticketValues.entity_id` con el cliente pulsado. `ticket-save` conserva validación, permisos y mensajes, cierra el panel y vuelve a renderizar; `cancel-ticket-form` reutiliza la detección de cambios sin guardar antes de descartar.
- `src/styles.css`: `.postventa-cards` usa la misma regla de contenedor que `.summary-cards` para que las tres tarjetas tengan su tamaño y proporción; no se modifica `.stat-card` global ni el orden de etiqueta y valor.
- Las tarjetas leen `computeTicketStats()` de `src/utils/postventa.js`: «Tickets abiertos» = `Abierto`, «En proceso» = `En revisión`, «Resueltos» = `Resuelto`, con una sola pasada y sin contadores persistidos.
- La tabla muestra cliente, asunto, categoría, prioridad y estado, con un control para cambiar el estado permitido según el rango; cada mutación vuelve a renderizar tarjetas y tabla.
- El texto persistido se sanitiza con `escapeHtml()` antes de insertarse en el DOM.
- Sin tickets se muestra un estado vacío; con permiso denegado se muestra `No tienes permiso para realizar esta acción`.

## Rutas y mensajes

- Rutas relativas: `?view=postventa` para la vista interna y `?view=client-portal` para la pestaña pública «Soporte Postventa»; el panel del formulario interno es estado local de Postventa y no añade parámetro `view`. No existe `?view=panel`; el Panel se abre quitando el parámetro.
- La apertura del panel exige `postventa:create` en la interfaz y `createTicketDocument()` vuelve a comprobarlo en la capa de datos; N3 y visitante reciben «Acceso denegado» o inicio de sesión al entrar en `?view=postventa`, igual que antes.
- Mensajes exactos: `Completa los campos obligatorios.`, `No tienes permiso para realizar esta acción` y, solo en el portal sin coincidencia, `No encontramos un cliente con ese correo o teléfono.`.
- Etiquetas exactas: «Postventa», «Nuevo Ticket», «Tickets abiertos», «En proceso», «Resueltos», «Cliente», «Asunto», «Categoría», «Prioridad», «Estado» y «Nota de resolución».

## Expectativas de verificación

- El enlace de Postventa aparece después de Marketing y abre `?view=postventa` con el marco ERP.
- Crear un ticket con nota vacía en «Resuelto» o sin prioridad muestra el mensaje exacto y no persiste el documento.
- Crear un ticket para un cliente existente lo añade a la ficha de ese cliente y aumenta solo la tarjeta correspondiente.
- Cambiar de `Resuelto` a `Abierto` actualiza tabla y tarjetas sin borrar la nota histórica del documento.
- N1 y N4 crean y cambian cualquier estado; N2 solo ve sus clientes y no ve el botón ni el control de estado; N3 y visitante no acceden ni por enlace profundo, consola o llamada directa a `src/storage.js`.
- Al pulsar «Nuevo Ticket» se comprueba que aparece el panel dentro de `?view=postventa`, que la tabla queda sustituida temporalmente, que las tres tarjetas siguen visibles y que no se llama a `window.open` ni se registra `?view=ticket-form`.
- Con N2 no se muestra el botón «Nuevo Ticket»; con N3 o visitante la vista `?view=postventa` muestra la denegación o el inicio de sesión, sin panel utilizable ni escritura directa.
- Guardar un ticket cierra el panel, vuelve a la tabla y recalcula las tres tarjetas sin recarga; cancelar sin cambios cierra el panel, y cancelar con cambios sin guardar muestra la confirmación antes de descartarlos. No se despacha ni se requiere `StorageEvent`.
- El marcado del panel usa las mismas clases de presentación que «Nuevo Cliente» y conserva el orden «Cliente», «Asunto», «Categoría», «Prioridad», «Estado» y «Nota de resolución» con los mensajes exactos.
- Las tres tarjetas de Postventa comparten el tamaño y la proporción de los indicadores de «Resumen» sin cambiar sus etiquetas, valores ni cálculo.
- Al pulsar «Abrir Ticket» en una fila de «Clientes» se abre el panel en `?view=postventa` con ese cliente preseleccionado; N2, N3 y visitante no pueden usar la acción ni crear el ticket aunque manipulen el estado local.
- Desde `?view=client-portal`, «Soporte Postventa» crea un ticket `Abierto`/`Media` para un cliente localizado por correo o teléfono, y el registro aparece de inmediato en la tabla, las tres tarjetas y la ficha del cliente al volver al CRM.
- Un correo y teléfono sin coincidencia muestran `No encontramos un cliente con ese correo o teléfono.`, no crean Ticket ni Entidad y dejan `erp_documents` y `erp_entities` sin cambios.
- Un visitante que intente abrir `?view=postventa` o llamar a `createTicketDocument()` recibe «Acceso denegado» o `No tienes permiso para realizar esta acción`, aunque haya creado un ticket válido desde el portal.
