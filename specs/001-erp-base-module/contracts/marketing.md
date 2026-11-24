# Contrato de Marketing

## Propósito

Definir la forma de los datos y las operaciones del apartado de Marketing (FR-068 a FR-090, Historias de Usuario 16 a 21). Marketing reutiliza `Entidad` y `Documento` del módulo base: no crea un tipo de registro nuevo ni modifica el contrato descrito en [`entity-storage.md`](entity-storage.md).

## Forma de los Datos

### Entidad de Marketing

Una entidad incluye los campos base más estos campos personalizados declarados en la configuración:

- `estado_comercial`: selección con valores internos `prospecto`, `en_proceso`, `en_recontacto`, `ganado` y `perdido`. Valor inicial `prospecto` (FR-068). Se conserva internamente para la automatización; no se muestra en Marketing (FR-075).
- `consentimiento`: booleano; `true` solo cuando el visitante marcó la casilla en la captura o en el chat (FR-071, FR-085).
- `consentimiento_fecha`: marca de tiempo ISO de la aceptación.
- `consentimiento_version`: copia de `marketing.privacyNoticeVersion` aceptada.
- `campaña`: opcional; identificador/nombre de campaña para atribución. Sin valor, el registro pertenece al grupo «Sin campaña» (FR-088).

### Documento de Marketing

Un documento incluye los campos base de `Documento` más los campos personalizados que apliquen:

- `notes`: nota, mensaje o texto de la regla ejecutada.
- `status`: estado libre o del ciclo de vida; `'automatico'` para ejecuciones de reglas.
- `entity_id`: entidad afectada.
- `automation_key`: clave `event|from|to|label` que evita repetir una ejecución ya registrada.
- `campaignId`: presente cuando la ejecución proviene de una campaña.
- `plataforma` o `canal`: `twitter`, `instagram`, `youtube`, `chat`, etc.
- `tipo_interaccion`: tipo declarado para redes o chat.
- `enlace`: opcional en interacciones de redes.
- `campaña`: opcional; sin valor, el documento se agrupa bajo «Sin campaña».

Un documento de campaña omitida por solapamiento conserva `campaignId`, entidad, fecha y `notes = 'omitida por solapamiento'` con el motivo (FR-090).

## Operaciones

- `computeMarketingStats({ entities, documents })`: devuelve las cinco tarjetas del panel y el embudo por estados de documento, sin escribir en `localStorage` (FR-072 a FR-074).
- `createProspectFromCapture(values, config)`: crea una entidad con `estado_comercial = 'prospecto'` y los datos de consentimiento; falla si `consentimiento` no es `true`.
- `runAutomationRules(event, entity, config, documents, context)`: evalúa reglas y campañas aplicables; devuelve los documentos a persistir en el historial de la entidad. `context` aporta `from`/`to` en `stage_changed` y `campaignId` cuando aplica (FR-070, FR-086, FR-089, FR-090).
- `computeSalesTeamMetrics(team, entities, documents, now)`: devuelve `realMensual` y `objetivoMensual` por integrante con las fórmulas de FR-078 y FR-079.
- `answerFaq(question, config)`: normaliza la pregunta y devuelve la respuesta de `marketing.faq` o `null` cuando no hay coincidencia (FR-082).
- `registerSocialInteraction(values, entity, config)`: crea el `Documento` de redes con plataforma, fecha, tipo, nota y enlace (FR-080, FR-081).
- `registerChatMessage(values, entity, config)`: crea el `Documento` de chat; exige consentimiento previo para el primer mensaje (FR-083, FR-085).
- `computeMarketingPerformance({ entities, documents, campaigns })`: devuelve indicadores globales y por campaña sin escribir en `localStorage` (FR-087, FR-088).

## Expectativas de Validación

- Sin consentimiento explícito no se crea el prospecto ni se registra el primer mensaje del chat; se muestra una explicación (FR-071, FR-085, SC-018, SC-024).
- La fecha y la versión del aviso se guardan con la entidad y no se derivan del reloj al mostrar la ficha.
- Marketing muestra las mismas cinco tarjetas y el mismo embudo que el panel; no muestra la torta «Estado comercial de la cartera» ni el selector de etapas (FR-072 a FR-075, SC-020, SC-021).
- Una transición a `ganado` conserva `id`, `entity_id`, documentos y campos personalizados de la entidad (FR-068).
- Las reglas y campañas activas se ejecutan una sola vez por evento; cada ejecución queda registrada en el historial de la entidad (FR-070, FR-086).
- Las acciones internas se limitan a crear documento de seguimiento, asignar `ejecutivo_asignado` y actualizar `estado_comercial`; no hay envíos ni publicaciones externas (FR-089).
- Entre campañas solapadas se ejecuta solo la más reciente y las demás quedan como «omitida por solapamiento», sin acciones duplicadas (FR-090, SC-025).
- El campo `campaña` es opcional; los registros sin valor aparecen bajo «Sin campaña» (FR-088, SC-026).
- El real mensual y el objetivo mensual del equipo son calculados por el sistema con las fórmulas de FR-078 y FR-079, sin captura manual (SC-022).
- Las interacciones de redes se guardan como documentos vinculados, ordenados por fecha y visibles en la ficha (FR-080, FR-081, SC-023).
- Una campaña sin registros muestra cero con una explicación clara; los indicadores se actualizan sin recarga (FR-087, SC-026).
- Configuración ausente o inválida de `marketing` retrocede a los valores predeterminados con advertencia visible, sin bloquear el módulo base (FR-024, FR-025).

## Contrato de Configuración `marketing`

```js
marketing: {
  privacyNoticeVersion: '2026-11-23',
  captureFields: ['name', 'targetDate', 'rut', 'canal_contacto', 'contacto_telefono', 'campaña'],
  automationRules: [
    { event: 'entity_created', action: 'create_document', label: 'Registro de bienvenida' },
    { event: 'stage_changed', from: 'prospecto', to: 'en_proceso',
      action: 'notify', label: 'Prospecto en seguimiento' }
  ],
  salesTeams: [
    { name: 'Equipo Norte', integrantes: [{ name: 'Ana', role: 'Ejecutiva', active: true }] }
  ],
  faq: [
    { pregunta: '¿Cómo capturo prospectos?', respuesta: 'Use el formulario público con consentimiento.' }
  ],
  campaigns: [
    { name: 'Reactivación', stage: 'en_recontacto', startDate: '2026-11-01',
      endDate: '2026-11-30', status: 'activa' }
  ]
}
```

- `privacyNoticeVersion`: texto no vacío; se copia a cada prospecto y al chat.
- `captureFields`: arreglo opcional de claves visibles y capturables por el formulario público.
- `automationRules`: arreglo opcional; `event` debe ser `entity_created`, `stage_changed` o `document_created`; `action` debe ser una acción interna válida; `label` no puede estar vacío.
- `salesTeams`: arreglo opcional de equipos con integrantes editable; no incluye métricas calculadas.
- `faq`: arreglo opcional de pares `pregunta`/`respuesta` no vacíos.
- `campaigns`: arreglo opcional con `name`, `stage`, `startDate`, `endDate`, `status` y `createdAt` derivado al crear. Sin fechas válidas, la campaña no se ejecuta.
- `salesTeams` y `campaigns` actúan como semilla: las definiciones creadas o editadas por el usuario se persisten en `erp_marketing_config`, sin alterar `src/module-config.js` ni crear entidades nuevas.
- Sin bloque `marketing`, el módulo mantiene el comportamiento base y la captura pública no está disponible.

## Contrato de Navegación

- La barra lateral ofrece Panel, Buscar, Resumen y Marketing; no incluye Clientes ni Interacciones (FR-012).
- El panel ofrece acciones rápidas para nueva entidad, nuevo documento, abrir gestión de entidades, abrir gestión de documentos y buscar registros; ya no ofrece «Abrir Marketing» (FR-033).
- Clientes e Interacciones se alcanzan desde el panel o mediante enlaces profundos (`?view=manage-entity`, `?view=manage-document`); no figuran en la barra lateral (SC-020).
- El chat está disponible en `?view=capture` y en Marketing con los mismos mensajes y documentos (FR-084).

## Expectativas de Extensibilidad

- Un módulo personalizado puede reetiquetar estados comerciales y acciones mediante `labels` y `options` sin tocar la utilidad de agregación.
- Un módulo sin `marketing` sigue funcionando con entidades, documentos, búsqueda y panel exactamente como antes.
- La captura pública y el chat embebidos requieren mismo origen porque no existe backend; esa limitación se documenta, no se resuelve con dependencias nuevas.
- Campañas, redes y rendimiento no invocan APIs externas ni proveedores de mensajería; todas las acciones se persisten como `Documento` en el `localStorage` de la aplicación.
