# Contrato de Panel Visual, Gráficos y Ortografía Visible

## Propósito

Definir el comportamiento observable del bloque «Panel visual», sus cuatro visualizaciones, el control de tema y la corrección ortográfica de textos visibles (FR-118 a FR-124, US14b, US15b). La fuente funcional es [`../spec.md`](../spec.md); el modelo resumido está en [`../data-model.md`](../data-model.md#12-panel-visual-gráficos-y-ortografía-visible-2026-11-27). No se introduce backend, dependencia nueva, permiso canónico ni clave adicional de `localStorage`.

## Marcado del panel

- `src/components/dashboard.js` conserva exactamente las cinco tarjetas canónicas de FR-035: entidades, documentos, «Cerrado ganado», «Tasa de conversión» y «Pipeline (USD)», con los cálculos actuales de `computeDashboardStats()` y actualización en cada `render()`.
- `src/components/dashboard-charts.js` NO renderiza «Ingresos totales del mes», «Clientes activos», «Campañas activas» con su conversión promedio ni «Tickets abiertos». No se usan `.kpi-grid`, `.kpi-card`, `.kpi-label`, `.kpi-value` ni `.kpi-detail` para esas cuatro cifras.
- La sección «Panel visual» queda compuesta por `.chart-grid` con cuatro `.chart-card`: «Ventas por mes», «Tickets de soporte», «Leads generados por campaña» y «Embudo comercial por estado». Cada tarjeta incluye un `h3` visible.
- Marketing reutiliza el mismo componente para mostrar únicamente la tarjeta del embudo dentro de `.chart-grid`; no muestra los tres gráficos del panel ni las acciones rápidas del panel.
- `src/styles.css` define `.chart-grid` con `grid-template-columns: repeat(auto-fit, minmax(320px, 1fr))` y no conserva reglas de `@media` que sustituyan esa columna por un número fijo. `.chart-card` mantiene fondo, borde, radio y sombra derivados de tokens.

## Fuente de datos

- `src/utils/dashboard-chart-data.js` expone una función pura que recibe `{ entities, documents, config }` y devuelve `salesByMonth`, `ticketsByStatus`, `leadsByCampaign` y `funnel`. No importa `src/mockData.js`, no escribe en `localStorage` y no muta los arreglos de entrada.
- `render()` calcula `state.dashboardChartData` una sola vez y lo entrega tanto a `renderDashboardHtml()` como a `mountDashboardCharts(rootEl, data)`. El HTML y Chart.js usan el mismo resultado para títulos, `aria-label`, tooltips y series.
- «Ventas por mes»: documentos con `normalizeText(status) === 'cerrado ganado'`, agrupados por mes de `startDate`, con `ingresos` = suma de `importe` y `negocios` = conteo de documentos. Importe ausente cuenta como cero; la fecha inválida excluye la fila.
- «Tickets de soporte»: documentos con `ticket: true`, sin duplicar `id`, en «Abierto», «En revisión» y «Resuelto», excluyendo tickets cuyo `entity_id` pertenezca a una entidad archivada.
- «Leads generados por campaña»: entidades activas con `estado_comercial = 'prospecto'`, agrupadas por el valor de `campaña`; las que no tienen valor se agrupan bajo la etiqueta «Sin campaña», que no se escribe en la entidad.
- «Embudo comercial por estado»: reutiliza `computeDashboardStats().funnel` con los estados de `statusLifecycle.states`; no duplica la agregación ni altera ventas, pendientes ni `pendingStates`.
- Ninguna serie usa datos simulados, valores capturados manualmente para el gráfico ni registros archivados. Tras crear, editar o eliminar un registro válido, el siguiente `render()` refleja el cambio sin recarga (FR-121, FR-122, SC-049, SC-050).

### Fórmulas de las cinco tarjetas canónicas

- «Entidades» = conteo de entidades activas, sin `archivedAt`. «Documentos» = conteo de documentos vinculados a esas entidades activas. «Cerrado ganado» = conteo de documentos con `normalizeText(status) === 'cerrado ganado'`, no un importe (FR-035).
- «Tasa de conversión» = documentos «Cerrado ganado» ÷ entidades activas × 100, con cero cuando no hay entidades activas. «Pipeline (USD)» = suma de `importe` de los documentos «Cerrado ganado»; un importe ausente cuenta como cero (FR-035).
- Las cinco tarjetas excluyen entidades archivadas y los documentos vinculados a ellas (FR-103). Todos los importes, incluidos los de «Ventas por mes», son USD sin conversión; si se declara un campo «Moneda», solo `USD` es válido y otro valor se rechaza con un error visible sin crear ni modificar el documento (FR-125).

## Gráficos, tooltips y estados vacíos

- «Ventas por mes» usa barras para ingresos USD y línea para conteo de negocios, con el conteo en un eje secundario. El tooltip muestra mes, importe en USD y negocios; ambos ejes y la leyenda usan colores del tema activo.
- «Tickets de soporte» usa anillo con los tres estados declarados, incluso con conteo cero; el tooltip muestra estado y total.
- «Leads generados por campaña» usa barras horizontales con una barra por campaña presente en los registros y, cuando corresponda, «Sin campaña»; el tooltip muestra campaña y total de leads.
- Los tres tooltips usan `--surface` como fondo, `--text` para títulos y cuerpo y `--border` para el borde; no dependen de colores fijos del tema claro.
- «Embudo comercial por estado» conserva `.funnel-rows` y `.funnel-row` con `.funnel-state`, `.funnel-count` y `.funnel-bar`; cada fila incluye un `title` con el estado y su recuento. La tarjeta mantiene la leyenda textual accesible.
- Cuando una serie no tiene registros, su tarjeta muestra exactamente `No hay registros para esta serie.` en lugar del `canvas` y usa el mismo texto en `aria-label`. No se dibujan series de ejemplo ni valores inventados; la serie real aparece sin recarga al registrar un dato válido (FR-124, SC-052).
- Todo texto derivado de registros se sanitiza con `escapeHtml()` antes de insertarse en `aria-label`, `title` o marcado.

## Tema

- El botón `data-action="toggle-theme"` de la barra superior conserva su etiqueta accesible, `aria-pressed` y `title` derivados del tema activo; la preferencia sigue en `erp_theme` y se aplica al cargar (FR-123).
- `src/utils/dashboard-charts.js` lee `--text`, `--text-muted`, `--border`, `--surface` y `--accent-color` del documento, además de una paleta de series legible para claro y oscuro.
- `refreshDashboardChartTheme()` actualiza leyenda, ticks, grid, border de escalas, tooltips y colores de datasets, y termina con `chart.update('none')`. El manejador `toggle-theme` de `app.js` la invoca en lugar de destruir y recrear los gráficos.
- La dominante cromática de la interfaz sigue siendo `theme.accentColor`; la paleta del tema no añade opciones configurables ni cambia la validación de fallback de configuración inválida (FR-038).
- Al cambiar de tema no se pierden series, instancias, valores, vista actual ni preferencia; no se recarga la página (SC-051).

## Ortografía visible

- Se revisan todos los literales mostrados en HTML, componentes, botones, etiquetas, placeholders, mensajes y datos de semilla/demo.
- Se corrigen tildes, errores de tipeo, mayúsculas/minúsculas consistentes y palabras separadas. Ejemplos contractuales: «Nivel 1 - Atención al cliente», «Portal del cliente», «Opciones del portal del cliente», «Soporte postventa», «Embudo comercial por estado», «Últimas interacciones / próximos seguimientos», «Nuevo ticket», «Abrir ticket», «Ejecutivo asignado», «Canal de contacto», «La fecha de inicio debe ser una fecha ISO.», «La fecha de fin debe ser una fecha ISO.» y «La fecha de fin no puede ser anterior a la fecha de inicio.».
- NO se cambian nombres de variables, funciones, clases CSS, rutas, IDs, claves de objetos ni valores persistidos. En particular, `en negociacion` sigue siendo el valor interno y `statusLifecycle.labels` permite mostrar «En negociación».
- La corrección no altera mensajes exactos ya contractuales como `Completa los campos obligatorios.`, `No se encontraron resultados.`, `No tienes permiso para realizar esta acción`, `Sin registros para esta campaña.` ni `Consulta registrada; un ejecutivo hará seguimiento.`.

## Archivos implicados

- `src/utils/dashboard-chart-data.js`: derivación pura de las cuatro series.
- `src/components/dashboard-charts.js`: marcado del panel sin KPI duplicadas, títulos, estados vacíos y etiquetas accesibles.
- `src/components/dashboard.js`: cinco KPI canónicas, embudo en tarjeta compartida y opción para Marketing.
- `src/utils/dashboard-charts.js`: configuración Chart.js con datos reales, tooltips tematizados y actualización de tema.
- `src/app.js`: cálculo de `state.dashboardChartData`, montaje con datos y cambio de tema sin recarga.
- `src/styles.css`: cuadrícula `auto-fit` y estilos de tarjeta.
- `src/module-config.js`: `statusLifecycle.labels` para la etiqueta visible corregida.
- `src/mockData.js`: deja de ser fuente de las visualizaciones; no se elimina por si otras vistas de demostración lo usan.

## Expectativas de verificación

- El panel no contiene las cuatro etiquetas retiradas y sí contiene las cinco cifras canónicas con valores iguales a los registros y a Marketing (SC-046).
- Las cuatro tarjetas están en `.chart-grid` con la regla CSS exacta, título visible y tooltip; Marketing solo añade la tarjeta del embudo (SC-048).
- Los valores y etiquetas de las series coinciden con documentos, tickets, prospectos y campañas almacenados, sin archivados ni datos simulados (SC-049, SC-050).
- Pulsar el control de tema cambia colores de gráficos sin recarga, conserva la preferencia al recargar y no altera series ni vista (SC-051).
- Cada serie sin registros muestra el mensaje exacto y lo sustituye por datos reales tras una mutación válida (SC-052).
- Los textos visibles revisados cumplen la ortografía española sin que cambien identificadores, rutas, claves ni valores persistidos (SC-047).
