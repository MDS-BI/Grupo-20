# Contrato de Marketing

## Propósito

Definir la forma de los datos y las operaciones del apartado de Marketing (FR-068 a FR-074, Historia de Usuario 16). Marketing reutiliza `Entidad` y `Documento` del módulo base: no crea un tipo de registro nuevo ni modifica el contrato descrito en [`entity-storage.md`](entity-storage.md).

## Forma de los Datos

Una entidad de Marketing incluye los campos base más estos campos personalizados declarados en la configuración:

- `estado_comercial`: selección con valores internos `prospecto`, `en_proceso`, `en_recontacto`, `ganado` y `perdido`. Valor inicial `prospecto` (FR-068).
- `consentimiento`: booleano; `true` solo cuando el visitante marcó la casilla (FR-071).
- `consentimiento_fecha`: marca de tiempo ISO de la aceptación.
- `consentimiento_version`: copia de `marketing.privacyNoticeVersion` aceptada.

Un documento generado por automatización incluye los campos base de `Documento` más:

- `notes`: texto del `label` de la regla ejecutada.
- `status`: `'automatico'`.
- `entity_id`: entidad afectada.
- `automation_key`: clave `event|from|to|label` que evita repetir una ejecución ya registrada.

## Operaciones

- `computeMarketingStats({ entities })`: devuelve `{ leadsAnalyzed, openOpportunities, wonClients, lossRate, conversionRate, funnel, categories }` sin escribir en `localStorage` (FR-072 a FR-074).
- `categoryForStage(stage)`: devuelve la categoría única de la torta para un `estado_comercial` (sección 3.2 de `data-model.md`).
- `createProspectFromCapture(values, config)`: crea una entidad con `estado_comercial = 'prospecto'` y los datos de consentimiento; falla si `consentimiento` no es `true`.
- `runAutomationRules(event, entity, config, documents, context)`: evalúa las reglas aplicables y devuelve los documentos a persistir en el historial de la entidad; `context` aporta `from`/`to` en `stage_changed` (FR-070).

## Expectativas de Validación

- Sin consentimiento explícito no se crea el prospecto y se muestra una explicación (FR-071, SC-018).
- La fecha y la versión del aviso se guardan con el prospecto y no se derivan del reloj al mostrar la ficha.
- Toda entidad pertenece exactamente a una de las cinco categorías del gráfico; `prospecto` se clasifica como «Sin resultados definitivos» (FR-074).
- Con cero leads, `lossRate` y `conversionRate` son cero y la torta muestra las cinco categorías a cero (FR-073, FR-074).
- Los contadores y las categorías coinciden con las entidades almacenadas tras crear, editar o eliminar un prospecto (SC-019).
- Una transición a `ganado` conserva `id`, `entity_id`, documentos y campos personalizados de la entidad (FR-068).
- Las reglas se ejecutan una sola vez por evento y su ejecución queda registrada en el historial de la entidad (FR-070).
- Configuración ausente o inválida de `marketing` retrocede a los valores predeterminados con advertencia visible, sin bloquear el módulo base (FR-024, FR-025).

## Contrato de Configuración `marketing`

```js
marketing: {
  privacyNoticeVersion: '2026-11-23',
  automationRules: [
    { event: 'entity_created', action: 'create_document', label: 'Registro de bienvenida' },
    { event: 'stage_changed', from: 'prospecto', to: 'en_proceso',
      action: 'notify', label: 'Prospecto en seguimiento' }
  ],
  captureFields: ['name', 'targetDate', 'rut', 'canal_contacto', 'contacto_telefono']
}
```

- `privacyNoticeVersion`: texto no vacío; se copia a cada prospecto creado desde la captura.
- `automationRules`: arreglo opcional; `event` debe ser `entity_created`, `stage_changed` o `document_created`; `action` debe ser `create_document` o `notify`; `from` y `to` deben ser estados comerciales conocidos; `label` no puede estar vacío.
- `captureFields`: arreglo opcional de claves de campo visibles y capturables por el formulario público.
- Sin bloque `marketing`, el módulo mantiene el comportamiento base y la captura pública no está disponible.

## Contrato de Navegación

- La barra lateral ofrece Panel, Buscar y Resumen; no incluye Clientes ni Interacciones (FR-012).
- El panel ofrece acciones rápidas para nueva entidad, nuevo documento, abrir gestión de entidades, abrir gestión de documentos, buscar registros y abrir Marketing (FR-033).
- Clientes e Interacciones se alcanzan desde el panel o mediante enlaces profundos (`?view=manage-entity`, `?view=manage-document`); no figuran en la barra lateral (SC-020).

## Expectativas de Extensibilidad

- Un módulo personalizado puede reetiquetar los estados comerciales y las categorías mediante `labels` y `options` sin tocar la utilidad de agregación.
- Un módulo sin `marketing` sigue funcionando con entidades, documentos, búsqueda y panel exactamente como antes.
- La captura pública embebida por `iframe` requiere mismo origen porque no existe backend; esa limitación se documenta, no se resuelve con dependencias nuevas.
