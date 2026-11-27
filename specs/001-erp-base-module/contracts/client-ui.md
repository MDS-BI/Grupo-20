# Contrato de Interfaz de Cliente y Cierre Perdido

## Propósito

Definir el comportamiento observable de la consulta rápida del cliente, las acciones de ticket en la tabla «Clientes» y el selector del motivo de cierre perdido (FR-111 a FR-113). La fuente funcional es [`../spec.md`](../spec.md); el modelo resumido está en [`../data-model.md`](../data-model.md#10-acceso-consulta-rápida-tickets-en-clientes-y-cierre-perdido). No se introduce backend, dependencia nueva ni clave adicional de `localStorage`.

## Consulta rápida del cliente

- El nombre del cliente es un control con `data-action="open-client-quick-view"` y `data-entity-id` en dos superficies: resultados de «Buscar» y tabla «Clientes» de gestión (`entity-list.js`).
- `src/app.js` guarda `state.quickViewEntityId`; el mismo componente `src/components/client-quick-view.js` renderiza la ventana para ambas superficies.
- La ventana es de solo lectura y contiene únicamente dos acciones: `data-action="close-quick-view"` («Cerrar») y `data-action="view-entity-full"` («Ver ficha completa»). No hay formularios de edición ni creación.
- Muestra en un solo lugar: datos de contacto visibles según `fieldRules`, compras «Cerrado ganado» con importe en USD y `startDate`, total de esas compras, historial cronológico y tickets vinculados por `entity_id` que el usuario pueda consultar.
- Las interacciones y los tickets se filtran con `can()` antes de renderizarse; N2 ve solo los registros de sus clientes, N1/N4 los permitidos por su rango y N3 ningún ticket. «Ver ficha completa» abre la ficha existente aplicando la matriz vigente.
- Todo texto persistido se sanitiza con `escapeHtml()`; sin compras o sin tickets se muestran estados vacíos explícitos.
- No se guarda ningún dato derivado ni se modifica `erp_entities` o `erp_documents`.

## Tabla «Clientes» con tickets

- `renderManageEntitiesHtml()` recibe los tickets visibles ya filtrados y calcula por fila los estados «Abierto» y «En revisión».
- La alerta «Ticket abierto» usa la clase `.ticket-alert--open` en naranja; «Ticket en revisión» usa `.ticket-alert--review` en azul. Si coexisten ambos estados en el mismo cliente, se muestran las dos etiquetas en ese orden.
- La alerta aparece solo para rangos con `postventa:view` o `postventa:view_own` y solo sobre los clientes permitidos; Marketing y visitante no ven ninguna alerta.
- El botón «Abrir Ticket» usa `data-action="open-ticket"` y `data-entity-id`, y aparece solo cuando `can(rank, 'postventa:create')` es verdadero (N1 y N4).
- Al pulsarlo, `app.js` comprueba el permiso, navega a `?view=postventa`, abre `state.ticketFormOpen` y precarga `state.ticketValues.entity_id`; `#ticket-client` debe mostrar ese cliente como seleccionado.
- La acción no crea ticket ni escribe en `localStorage`; la creación sigue gobernada por `contracts/postventa.md`.

## Motivo de cierre perdido

- `document-form.js` obtiene la regla `documentRules.lostReason` desde la configuración activa y muestra el campo `motivo_perdida` solo cuando el documento está en `cerrado perdido` y la entidad seleccionada tiene `estado_comercial = prospecto`.
- El campo es un desplegable sin selección previa con las opciones exactas «Precio alto», «Eligió competencia», «Sin presupuesto» y «No responde», en ese orden.
- Cambiar el estado o el cliente vuelve a evaluar la visibilidad y la obligatoriedad del campo con la misma regla que usa `validateDocumentData()`.
- Guardar sin motivo en esa condición muestra `Completa los campos obligatorios.` y no modifica el documento; guardar con motivo lo persiste y `document-list.js` lo muestra en el historial de la entidad.
- Un cliente convertido o en otro estado comercial distinto de `prospecto` no ve el campo exigido aunque el documento se cierre como perdido.
- «Cerrado perdido» aparece en el embudo por estados de documento, pero no cuenta como pendiente, venta ganada ni importe del real mensual.

## Permisos y mensajes

| Acción                      | N4  | N3  | N2                  | N1  | Visitante |
| --------------------------- | --- | --- | ------------------- | --- | --------- |
| Abrir consulta rápida       | Sí  | Sí  | Sí                  | Sí  | No        |
| Ver ficha completa          | Sí  | Sí  | Solo sus clientes   | Sí  | No        |
| «Abrir Ticket»              | Sí  | No  | No                  | Sí  | No        |
| Alerta de ticket en tabla   | Sí  | No  | Solo sus clientes   | Sí  | No        |
| Cambiar documento a perdido | Sí  | No  | Solo sus documentos | No  | No        |

- La denegación exacta es `No tienes permiso para realizar esta acción` y también se aplica en la capa de datos, no solo ocultando controles.
- Mensajes exactos: `Completa los campos obligatorios.`, `No se encontraron resultados.` y `No tienes permiso para realizar esta acción`.
- Etiquetas exactas: «Cerrar», «Ver ficha completa», «Abrir Ticket», «Ticket abierto», «Ticket en revisión», «Precio alto», «Eligió competencia», «Sin presupuesto» y «No responde».

## Expectativas de verificación

- Pulsar el nombre en «Buscar» y en «Clientes» abre la misma ventana con el cliente correcto, sin formularios y con solo los dos botones permitidos.
- El total comprado coincide con la suma de importes «Cerrado ganado» de todas las fechas, en USD, y cada compra muestra su `startDate`.
- El historial y los tickets respetan la visibilidad por rango; los tickets de otros clientes de N2 no aparecen.
- La tabla «Clientes» muestra «Abrir Ticket» solo para N1/N4 y las alertas naranja/azul solo para los rangos con acceso a tickets.
- «Abrir Ticket» abre el panel de Postventa con el cliente preseleccionado y sin crear el documento antes del guardado.
- Un documento de prospecto no pasa a «Cerrado perdido» sin motivo; un cliente convertido no exige motivo; el motivo elegido aparece en el historial.
- El estado «Cerrado perdido» aparece en el embudo y no altera ventas ganadas, real mensual ni pendientes.
