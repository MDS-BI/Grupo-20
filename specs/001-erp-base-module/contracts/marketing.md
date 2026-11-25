# Contrato de Marketing

## Propósito

Definir la forma de los datos y las operaciones del apartado de Marketing y su integración con autenticación y permisos (FR-068 a FR-102, Historias de Usuario 16 a 23). Marketing reutiliza `Entidad` y `Documento` del módulo base: no crea un tipo de registro nuevo ni modifica el contrato descrito en [`entity-storage.md`](entity-storage.md).

## Forma de los Datos

### Entidad de Marketing

Una entidad incluye los campos base más estos campos personalizados declarados en la configuración:

- `estado_comercial`: selección con valores internos `prospecto`, `en_proceso`, `en_recontacto`, `ganado` y `perdido`. Valor inicial `prospecto` (FR-068). `ganado` convierte la entidad en Cliente; su etiqueta visible es «Cliente ganado» y no equivale al estado de documento «Cerrado ganado». Se conserva internamente para la automatización; no se muestra en Marketing (FR-075).
- `consentimiento`: booleano; `true` solo cuando el visitante marcó la casilla en la captura o en «Dudas y consultas» (FR-071, FR-085); el identificador interno del apartado sigue siendo `chat`.
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
- `tipo_interaccion`: tipo declarado para redes o «Dudas y consultas».
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
- `registerChatMessage(values, entity, config)`: crea el `Documento` de «Dudas y consultas» con `canal = 'chat'`; exige consentimiento previo para el primer mensaje (FR-083, FR-085, FR-092).
- `computeMarketingPerformance({ entities, documents, campaigns })`: devuelve indicadores globales y por campaña sin escribir en `localStorage` (FR-087, FR-088).

## Expectativas de Validación

- Sin consentimiento explícito no se crea el prospecto ni se registra el primer mensaje de «Dudas y consultas»; se muestra una explicación clara con esa etiqueta visible y, cuando el motivo es información obligatoria, el mensaje exacto `Completa los campos obligatorios.` (FR-006, FR-071, FR-085, FR-092, SC-018, SC-024).
- La fecha y la versión del aviso se guardan con la entidad y no se derivan del reloj al mostrar la ficha.
- Marketing muestra las mismas cinco tarjetas y el mismo embudo que el panel; no muestra la torta «Estado comercial de la cartera» ni el selector de etapas (FR-072 a FR-075, SC-020, SC-021).
- Una transición a `ganado` conserva `id`, `entity_id`, documentos y campos personalizados de la entidad y produce «Cliente ganado» como resultado visible; no modifica el estado «Cerrado ganado» de los documentos (FR-068).
- Las reglas y campañas activas se ejecutan una sola vez por evento; cada ejecución queda registrada en el historial de la entidad (FR-070, FR-086).
- Las acciones internas se limitan a crear documento de seguimiento, asignar `ejecutivo_asignado` y actualizar `estado_comercial`; no hay envíos ni publicaciones externas (FR-089).
- Entre campañas solapadas se ejecuta solo la más reciente y las demás quedan como «omitida por solapamiento», sin acciones duplicadas (FR-090, SC-025).
- El campo `campaña` es opcional; los registros sin valor aparecen bajo «Sin campaña» (FR-088, SC-026).
- El real mensual y el objetivo mensual del equipo son calculados por el sistema con las fórmulas de FR-078 y FR-079, sin captura manual (SC-022).
- Las interacciones de redes se guardan como documentos vinculados, ordenados por fecha y visibles en la ficha (FR-080, FR-081, SC-023).
- Una campaña sin registros muestra cero con la explicación clara `Sin registros para esta campaña.`; los indicadores se actualizan sin recarga (FR-087, SC-026).
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

- `privacyNoticeVersion`: texto no vacío; se copia a cada prospecto y a «Dudas y consultas».
- `captureFields`: arreglo opcional de claves visibles y capturables por el formulario público.
- `automationRules`: arreglo opcional; `event` debe ser `entity_created`, `stage_changed` o `document_created`; `action` debe ser una acción interna válida; `label` no puede estar vacío.
- `salesTeams`: arreglo opcional de equipos con integrantes editable; no incluye métricas calculadas.
- `faq`: arreglo opcional de pares `pregunta`/`respuesta` no vacíos.
- `campaigns`: arreglo opcional con `name`, `stage`, `startDate`, `endDate`, `status` y `createdAt` derivado al crear. Sin fechas válidas, la campaña no se ejecuta.
- `salesTeams` y `campaigns` actúan como semilla: las definiciones creadas o editadas por el usuario se persisten en `erp_marketing_config`, sin alterar `src/module-config.js` ni crear entidades nuevas.
- Sin bloque `marketing`, el módulo mantiene el comportamiento base y la captura pública no está disponible.

## Contrato de Navegación

- La barra lateral ofrece Panel, Buscar, Resumen y Marketing; no incluye Clientes ni Interacciones (FR-012).
- El panel ofrece acciones rápidas para nueva entidad, nuevo documento, abrir gestión de entidades, abrir gestión de documentos y buscar registros; ya no ofrece «Abrir Marketing» (FR-033). Esas cinco acciones rápidas solo se renderizan en el panel: Marketing las omite aunque reutilice el componente de tarjetas y embudo (FR-091, SC-027).
- Marketing ofrece exactamente cinco atajos de sección, en este orden y con estos textos visibles: «Equipos de ventas y logros», «Campañas», «Rendimiento de campañas», «Dudas y consultas» y «Redes sociales». Sus claves internas permanecen `team`, `campaigns`, `performance`, `chat` y `social` (FR-093, SC-029).
- Clientes e Interacciones se alcanzan desde el panel o mediante enlaces profundos (`?view=manage-entity`, `?view=manage-document`); no figuran en la barra lateral (SC-020).
- «Dudas y consultas» está disponible en `?view=capture` y en Marketing con los mismos mensajes y documentos; el encabezado, la pestaña, la casilla y el error de consentimiento usan esa etiqueta visible, mientras `data-section="chat"`, `#chat-form`, `.chat-*`, `canal: 'chat'` y `ChatConsentError` siguen siendo identificadores internos (FR-084, FR-092, SC-028).

## Expectativas de Extensibilidad

- Un módulo personalizado puede reetiquetar estados comerciales y acciones mediante `labels` y `options` sin tocar la utilidad de agregación.
- Un módulo sin `marketing` sigue funcionando con entidades, documentos, búsqueda y panel exactamente como antes.
- La captura pública y «Dudas y consultas» embebidas requieren mismo origen porque no existe backend; esa limitación se documenta, no se resuelve con dependencias nuevas.
- Campañas, redes y rendimiento no invocan APIs externas ni proveedores de mensajería; todas las acciones se persisten como `Documento` en el `localStorage` de la aplicación.

## Integración con Autenticación y Permisos

- El acceso a Marketing requiere una sesión vigente y `can(rank, 'marketing:view')`. Nivel 4 y Nivel 3 pueden entrar; Nivel 2, Nivel 1 y visitantes no.
- «Equipo de ventas y logros» usa `can(rank, 'team:view_all')`, `can(rank, 'team:view_own', { ownerId })` y `can(rank, 'team:manage')`: N4 edita equipos, N3 solo lee y N2 ve únicamente su propio real y objetivo. Cada integrante vincula `userId` de un usuario activo Nivel 2 o Nivel 4, y `computeSalesTeamMetrics()` filtra entidades por `ejecutivo_asignado = userId`.
- Las campañas usan `campaign:create`, `campaign:view`, `campaign:edit_own`, `campaign:stop_own` y `campaign:stop_any` con `context.campaignOwnerId`: N3 crea, edita, detiene y consulta solo las suyas; N4 puede detener cualquier campaña.
- Las reglas automáticas y las campañas ejecutan sus acciones internas como identidad «Sistema» con independencia del usuario conectado en ese momento (FR-101). El historial de cada campaña conserva además el `userId` de quien la creó, aunque cambie de rango o sea desactivado.
- Los mensajes del chat y las interacciones de redes siguen sujetos a consentimiento; el seguimiento del chat por Nivel 1 usa `can(rank, 'chat:answer')` y no permite cambiar estados de documentos. Las consultas sin coincidencia se registran con `chat:create_query`.
- Todas las operaciones que mutan entidades o documentos desde Marketing pasan por `assertPermission()` en `src/storage.js`; la interfaz oculta controles, pero la capa de datos es la fuente de denegación.

## Mensajes exactos y rutas relativas

La confirmación de captura es exactamente `Prospecto registrado correctamente.`, el acuse del chat sin coincidencia es `Consulta registrada; un ejecutivo hará seguimiento.` y una campaña sin registros muestra `Sin registros para esta campaña.` (FR-006, FR-069, FR-083, FR-087). Ninguna vista de Marketing sustituye estos textos por paráfrasis. Marketing se abre con `?view=marketing` y la captura con `?view=capture`, sin host ni ruta de servidor; la resolución por `location.search` se aplica también en recarga y Back/Forward.
