# Plan de Implementación: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

**Rama**: `001-erp-base-module` | **Creado**: 2026-07-08 | **Actualizado**: 2026-11-24 | **Especificación**: [spec.md](spec.md)
**Entrada**: Especificación de la funcionalidad desde `/specs/001-erp-base-module/spec.md`

**Incremento anterior (2026-11-23, séptima tanda)**: completar Marketing con los datos del panel principal (cinco tarjetas y embudo por estados de documento), acceso desde la barra lateral, equipo de ventas con objetivo y real calculados, registro manual de redes sociales, «Dudas y consultas» con respuestas rápidas, campañas internas programadas y seguimiento del rendimiento derivado de los registros existentes.

**Incremento actual (2026-11-24, octava tanda)**: retirar de Marketing los atajos de acción rápida del panel principal y sustituirlos por cinco atajos de sección en orden definido; usar «Equipos de ventas y logros» como etiqueta visible y renombrar «Chat» a «Dudas y consultas» en Marketing y en el formulario público.

## Resumen

Construir una aplicación web ligera con Vite que sirva como módulo base de software de planificación de recursos empresariales (ERP). El módulo proporciona la base común que todo módulo ERP personalizado necesita: gestión de datos maestros (Entidades), documentos transaccionales vinculados (Documentos), flujos de crear/editar/eliminar/buscar, validación y persistencia local — construida principalmente con HTML, CSS y JavaScript vanilla. La aplicación se presenta como un espacio de trabajo ERP coherente: una barra superior con marca (logotipo derivado + nombre del módulo) y una barra lateral persistente de botones de módulo envuelven cada pantalla, y la pantalla de entrada es un panel estilo ERP que ofrece botones de acción rápida para las tareas clave (nueva entidad, nuevo documento, abrir áreas de gestión, buscar registros) además de estadísticas de registros en vivo. La adaptación a un módulo específico (p. ej., Ventas) se realiza mediante un único archivo de configuración (`src/module-config.js`) que cubre terminología, campos personalizados, ciclo de vida de documentos y color de acento, de modo que el código central permanece intacto. En el perfil de clientes, la fecha objetivo pasa a denominarse "Fecha de nacimiento" y se limita al rango comprendido entre el 1 de enero de 1910 y la fecha local actual, con actualización automática del límite al cambiar de día y conservación de los valores históricos que queden fuera de rango. En una segunda tanda de cambios del mismo perfil, el formulario de clientes deja de mostrar «Código», «Categoría», «Descripción» y «Nº de pedidos» (generando y guardando un código interno único sin exposición), exige «Fecha de nacimiento», «Canal de Contacto» y «RUT» con formato chileno válido y único, y despliega una casilla de contacto condicionada al canal elegido con validación propia; la ficha de los clientes heredados incompletos queda bloqueada hasta completarla mediante edición.

Marketing conserva las tarjetas y el embudo del panel, pero no sus botones de acción rápida: en esa vista solo se muestran cinco atajos de sección («Equipos de ventas y logros», «Campañas», «Rendimiento de campañas», «Dudas y consultas» y «Redes sociales»), y el apartado antes llamado «Chat» pasa a denominarse «Dudas y consultas» en todas las etiquetas visibles.

## Contexto Técnico

**Lenguaje/Versión**: JavaScript (ES2022), HTML, CSS  
**Dependencias Principales**: Vite, sin framework de interfaz pesado  
**Almacenamiento**: localStorage del navegador para una instancia del módulo de espacio único: `erp_entities`, `erp_documents` y `erp_marketing_config` para definiciones editables de Marketing  
**Pruebas**: Vitest con jsdom para pruebas unitarias y de interacción (`npm test`); lint con `npm run lint`; no hay script `typecheck`  
**Utilidades de Fecha**: `Date` nativo y cadenas ISO `YYYY-MM-DD`, sin librerías de fechas; resolución del límite superior mediante componentes locales y temporizador hasta la medianoche local  
**Plataforma Objetivo**: Navegadores modernos de escritorio y móviles  
**Tipo de Proyecto**: Aplicación web  
**Objetivos de Rendimiento**: Interacciones responsivas para listas de hasta 500 registros; la búsqueda y las actualizaciones de la interfaz deben sentirse instantáneas  
**Restricciones**: Huella mínima de librerías, despliegue simple, sin backend requerido; la estructura debe mantenerse extensible para módulos personalizados  
**Escala/Alcance**: Módulo base con CRUD de datos maestros (Entidad) y documentos transaccionales (Documento), búsqueda y capacidades de navegación  
**Reglas de Campo**: Capa declarativa opcional en `module-config.js` (`fieldRules`, `detailPolicy`) para ocultar, generar, exigir, hacer único, condicionar y excluir de búsqueda campos base o personalizados; la configuración ausente conserva el comportamiento base  
**Formatos de Validación**: Registro local de formatos (`src/utils/field-formats.js`) con `cl-rut`, `phone`, `email` y `nonEmpty`; sin dependencias nuevas  
**Preparación de Ficha**: Comprobación pura reutilizada del mismo validador declarativo para bloquear la consulta de registros incompletos y ofrecer su edición
**Presentación del Formulario**: Orden opcional por campo (`order`), pistas grises (`placeholder`) y opciones de selección con valor y etiqueta separados; sin dependencias nuevas
**RUT**: Se aceptan `12345678-9` y `12.345.678-9`; ambos se normalizan para validar el dígito verificador y para comparar unicidad

### Contexto Técnico del incremento de Marketing

**Vista de Marketing**: Vista adicional (`state.view = 'marketing'`) alcanzable desde la barra lateral como cuarta opción; el panel ya no muestra «Abrir Marketing»
**Captura pública y «Dudas y consultas»**: Vistas autónomas/`?view=capture` y controles embebidos en Marketing; responden desde preguntas frecuentes configuradas y registran consultas sin coincidencia como `Documento`
**Estado comercial**: Campo personalizado de entidad `estado_comercial` con valores `prospecto`, `en_proceso`, `en_recontacto`, `ganado` y `perdido`; se conserva oculto para la automatización y ya no alimenta tarjetas ni embudo
**Agregaciones**: Utilidad pura `src/utils/marketing-stats.js` que deriva las cinco tarjetas del panel y el embudo por estados de `Documento`, con `computeMarketingPerformance()` para indicadores por campaña; sin escribir resultados derivados
**Automatización**: Reglas declarativas `marketing.automationRules` y campañas programadas evaluadas tras las mutaciones de almacenamiento; cada ejecución se registra como un `Documento` en el historial de la entidad
**Atribución**: Campo opcional `campaña` en entidades, interacciones y documentos; los registros sin campaña se agrupan bajo «Sin campaña»
**Consentimiento**: Campos `consentimiento`, `consentimiento_fecha` y `consentimiento_version` en la entidad creada desde la captura y en «Dudas y consultas»; versión declarada en `marketing.privacyNoticeVersion`
**Navegación lateral**: `NAV_ITEMS` ofrece Panel, Buscar, Resumen y Marketing; Clientes e Interacciones solo se acceden desde el panel o enlaces profundos
**Atajos de Marketing**: `renderDashboardHtml()` acepta una opción para omitir `.quick-actions`; Marketing conserva tarjetas y embudo, pero usa solo su tabla de secciones como atajos visibles
**Terminología visible de Marketing**: etiquetas y orden exactos de los cinco atajos; «Dudas y consultas» sustituye a «Chat» en el componente compartido de captura y Marketing, sin cambiar claves internas ni selectores

### Aclaraciones integradas (sesión 2026-11-01)

- El `code` de entidad es obligatorio y único, comparado sin distinguir mayúsculas ni espacios.
- Sin ciclo de vida configurado, el estado del documento es texto libre (sin lista fija de valores).
- Una configuración inválida o conflictiva hace que la aplicación arranque con los valores predeterminados y muestre una advertencia visible, sin bloquear el uso.
- Los valores de campos personalizados que ya no están declarados se conservan en el almacenamiento y se ocultan de la interfaz; si el campo se vuelve a declarar, los valores reaparecen.
- La eliminación de una entidad exige confirmación explícita e indica cuántos documentos asociados se eliminarán en cascada.

### Aclaraciones integradas (sesión 2026-11-12)

- Sin ciclo de vida configurado, un documento se considera pendiente cuando su `status` normalizado (minúsculas y recorte) coincide con "pendiente"; si no hay coincidencias, el indicador es cero.
- Los campos base de `Documento` son `id`, `entity_id`, `startDate`/`endDate` opcionales, `notes` opcional, `status` y marcas de tiempo; serie/folio, importes, moneda, condiciones y tipo de interacción se tratan como campos personalizados declarados por la configuración.

### Aclaraciones integradas (sesión 2026-11-23)

- La regla de fecha de nacimiento aplica únicamente al perfil de clientes; los demás perfiles conservan "Fecha objetivo" sin rango.
- En el perfil de clientes, "Fecha objetivo" se renombra a "Fecha de nacimiento" en todos los lugares visibles (formulario, lista, ficha, búsqueda y filtros).
- El rango válido es del 1 de enero de 1910 a la fecha local del dispositivo, inclusive, con validación real de días y meses del calendario.
- El límite superior se recalcula automáticamente al cambiar de día mientras la aplicación permanece abierta, sin recarga.
- Las fechas históricas fuera de rango se conservan y muestran, pero se exige corregirlas antes de guardar cualquier edición del cliente.

### Aclaraciones integradas (sesión 2026-11-23, segunda tanda)

- «Código», «Categoría», «Descripción» y «Nº de pedidos» dejan de mostrarse en formulario, lista, ficha y búsqueda del perfil de clientes; sus valores se conservan en almacenamiento.
- El sistema genera un código único interno por cliente, lo guarda en el registro y no lo captura, muestra ni busca.
- «Nº de pedidos» se elimina de la configuración del perfil y deja de registrarse.
- En el perfil de clientes la búsqueda ignora código, categoría y descripción; usa nombre, fecha de nacimiento y campos personalizados visibles.
- «Fecha de nacimiento», «Canal de Contacto» y «RUT» son obligatorios al guardar; el RUT debe tener dígito verificador válido y ser único.
- Los clientes heredados sin esos datos o con RUT inválido tienen bloqueada su ficha; se permiten editar solo para completarlos y se desbloquean al guardar válidamente.
- «Canal de Contacto» no tiene opción preseleccionada: el usuario debe elegirla explícitamente.
- Según el canal se muestra una casilla adicional («Teléfono», «Correo electrónico», «Lugar/Enlace de reunión» o «WhatsApp»); solo se guarda el valor del canal elegido y esa casilla también es obligatoria, con formato validado.

### Aclaraciones integradas (sesión 2026-11-23, tercera tanda: presentación del formulario de clientes)

- El «RUT» admite `12345678-9` y `12.345.678-9`: se eliminan los puntos antes de validar el dígito verificador y antes de comprobar unicidad, de modo que un mismo RUT no se guarde dos veces por escribirlo en formatos distintos.
- El «RUT» muestra en gris la pista `Ej: 11.111.111-1`, que no cuenta como valor capturado.
- Las opciones del desplegable de «Canal de Contacto» se muestran como «Llamada», «Correo», «Reunión» y «WhatsApp», conservando los valores almacenados y las condiciones `when`.
- El título del formulario de registro y la acción rápida de creación dicen «Nuevo Cliente» en lugar de «Nueva cliente».
- El orden de las casillas es: «Nombre de Cliente», «RUT», «Fecha de nacimiento», «Canal de Contacto» con su casilla adicional, «Tipo de actividad» y «Ejecutivo Asignado».
- «Rubro» pasa a llamarse «Tipo de actividad» y se convierte en desplegable con las opciones «Dependiente», «Independiente Formal», «Independiente Informal», «Jubilado», «Dueño/a de casa», «Estudiante», «FFAA», «Rentista», «Jubilado - FFAA» y «Cesante»; la clave de almacenamiento `rubro` no cambia.
- La casilla adicional de contacto muestra en gris una pista según el canal: `Ej: +56 9 1234 5678` para «Llamada» y «WhatsApp», `Ej: nombre@ejemplo.cl` para «Correo» y `Ej: Sala 2 o enlace» para «Reunión».

### Aclaraciones integradas (sesión 2026-11-23, cuarta tanda: Marketing y navegación)

- El prospecto es una `Entidad` con estado inicial «Prospecto» que se convierte en Cliente al avanzar de etapa, sin nuevo tipo de registro.
- La captación principal es un formulario web público embebible que crea el prospecto automáticamente.
- La automatización se desencadena por eventos configurables (captura, cambio de etapa o interacción) y ejecuta una acción sobre el prospecto.
- El consentimiento es explícito, obligatorio y se registra con fecha y versión del aviso aceptado.
- La conversión se mide con el embudo del panel: conteo y porcentajes por estado de documento, sin duplicar el cálculo en Marketing.
- El apartado muestra las cinco tarjetas del panel (entidades, documentos, «Cerrado ganado», «Tasa de conversión» y «Pipeline (USD)») y el mismo embudo por estados de documento; la torta «Estado comercial de la cartera» y el selector de etapas se eliminan.
- «Clientes» e «Interacciones» se eliminan de la barra lateral; solo se acceden desde el panel principal. Panel, Buscar y Resumen permanecen en la barra lateral.

### Aclaraciones integradas (sesión 2026-11-23, quinta tanda: datos y navegación de Marketing)

- Marketing muestra las mismas cinco tarjetas y el mismo embudo del panel, derivados de entidades y documentos; se eliminan la torta «Estado comercial de la cartera» y el selector de etapas.
- `estado_comercial` y las reglas automáticas se conservan internamente sin mostrarse en Marketing.
- «Abrir Marketing» desaparece del panel y «Marketing» se añade como cuarta opción de la barra lateral.
- El acceso «Equipos de ventas y logros» permite equipos e integrantes capturados por el usuario, mientras que el real mensual y el objetivo mensual los calcula el sistema.
- El real mensual suma documentos «Cerrado ganado» del mes por «Ejecutivo Asignado»; el objetivo mensual es la proyección `ventas ÷ días transcurridos × días del mes`, o cero sin ventas o sin días transcurridos.

### Aclaraciones integradas (sesión 2026-11-23, sexta tanda: canales y «Dudas y consultas»)

- Las interacciones en redes se registran manualmente con plataforma, fecha, tipo, nota y enlace, vinculadas al prospecto o cliente.
- Las interacciones de redes y los mensajes de «Dudas y consultas» se guardan como `Documento` con campos personalizados de plataforma/canal y tipo de interacción; el valor interno `canal = 'chat'` no cambia.
- «Dudas y consultas» responde desde preguntas frecuentes configuradas; sin coincidencia registra la consulta para seguimiento.
- «Dudas y consultas» está disponible en el formulario público de captura y en Marketing, con consentimiento explícito antes del primer mensaje.

### Aclaraciones integradas (sesión 2026-11-23, séptima tanda: campañas y rendimiento)

- La automatización se organiza en campañas internas por etapa, sin servicios externos.
- El rendimiento se mide con prospectos, conversión por etapa, interacciones, consultas respondidas y ventas ganadas, derivados de registros ya almacenados.
- El campo opcional `campaña` atribuye prospectos, interacciones y ventas; sin valor se agrupa bajo «Sin campaña».
- Las acciones internas de campaña son crear documento de seguimiento, asignar ejecutivo y actualizar `estado_comercial`.
- Si dos campañas activas aplican al mismo prospecto y evento, se ejecuta la más reciente y la otra se registra como «omitida por solapamiento».

### Aclaraciones integradas (sesión 2026-11-24)

- Los cinco atajos del panel (nueva entidad o «Nuevo Cliente», nuevo documento o «Nueva interacción», gestionar entidades o clientes, gestionar documentos o interacciones y buscar) solo aparecen en el panel principal.
- Marketing muestra exactamente cinco atajos en este orden: «Equipos de ventas y logros», «Campañas», «Rendimiento de campañas», «Dudas y consultas» y «Redes sociales».
- La etiqueta visible del equipo cambia de singular a plural: «Equipos de ventas y logros».
- «Dudas y consultas» sustituye visiblemente a «Chat» en Marketing y en el formulario público; las claves internas `chat`, `canal: 'chat'` y los selectores existentes no cambian.

## Verificación de la Constitución

*COMPROBACIÓN: Debe pasar antes de la investigación de la Fase 0. Reverificar tras el diseño de la Fase 1.*

- Calidad: La implementación usará una estructura JavaScript pequeña y modular con límites de función claros y nomenclatura consistente, manteniendo las preocupaciones base (almacenamiento, identidad, integridad referencial) separadas de la lógica específica del dominio para que los módulos personalizados puedan extenderlas.
- Pruebas: Los flujos centrales de crear, editar, eliminar y buscar estarán cubiertos por pruebas automatizadas antes de completar.
- Experiencia de Usuario: La interfaz proporcionará mensajes de validación claros, estados vacíos y comportamiento de formulario consistente, presentados dentro de un marco de espacio de trabajo ERP con marca (barra superior + barra lateral) que se ve y se comporta idénticamente en todas las pantallas.
- Rendimiento: La búsqueda y el renderizado de listas se optimizarán para colecciones de hasta 500 registros usando actualizaciones ligeras del DOM.
- Calidad (Marketing): Las agregaciones, reglas de automatización y validación de consentimiento se implementarán como funciones puras en módulos pequeños, con la configuración como único punto de declaración, reutilizando `Entidad` y `Documento` sin nuevas estructuras de almacenamiento.
- Pruebas (Marketing): Se cubrirán con pruebas unitarias las agregaciones y reglas, y con pruebas de integración la vista, la captura con consentimiento, el embudo accesible y la presencia de Marketing en la barra lateral.
- Experiencia de Usuario (Marketing): Los contadores y el embudo usarán los mismos patrones visuales que el panel principal, con estados vacíos claros y leyenda textual accesible; el formulario público mostrará errores comprensibles sin el marco ERP.
- Rendimiento (Marketing): Las agregaciones se calcularán en memoria sobre el arreglo ya cargado en `state`, con una sola pasada por entidad y sin almacenar resultados derivados.
- Calidad (Campañas): Las campañas, la atribución, las acciones internas y la resolución de solapamientos se implementarán como utilidades puras y reglas declarativas reutilizando `Entidad`, `Documento` y `marketing.automationRules`, sin estructura de almacenamiento ni dependencias nuevas.
- Pruebas (Campañas): Se cubrirán con pruebas unitarias el cálculo de indicadores, la atribución «Sin campaña», las acciones permitidas y el desempate por campaña más reciente, y con pruebas de integración las vistas de campañas y rendimiento.
- Seguridad y UX (Campañas): «Dudas y consultas» exigirá consentimiento previo, todo contenido persistido se sanitizará al renderizarse y las vistas nuevas mostrarán estados vacíos y mensajes claros antes de cualquier ejecución.
- Calidad (atajos y terminología): La omisión de los atajos del panel en Marketing se resolverá con una opción explícita del renderizador compartido y la lista de secciones con claves internas estables, sin duplicar componentes ni añadir dependencias.
- Pruebas (atajos y terminología): Pruebas de integración verificarán que el panel conserva cinco acciones rápidas, que Marketing no contiene `.quick-actions`, que sus cinco atajos aparecen en el orden acordado y que «Dudas y consultas» sustituye a «Chat» en ambas superficies visibles.
- Experiencia de Usuario (atajos y terminología): El panel seguirá siendo el único punto de creación y gestión, Marketing ofrecerá exclusivamente sus secciones y la renombración se aplicará a encabezados, pestañas y texto de consentimiento sin tocar identificadores internos.

**Reverificación post-diseño (Fase 1)**: APROBADA. Los artefactos de diseño (research, data-model, contratos, quickstart) mantienen la separación entre almacenamiento base y dominio, validan la unicidad de `code`, preservan los valores huérfanos de campos personalizados, documentan el fallback con advertencia ante configuración inválida y exigen confirmación con recuento antes de la eliminación en cascada. La regla de fecha y las nuevas reglas de perfil se declaran en `module-config.js` mediante `entityDate.required`, `fieldRules` y `detailPolicy`; la validación de RUT reutiliza la lógica ya existente en la semilla, extraída a un registro local de formatos, sin añadir dependencias. El comportamiento base permanece intacto cuando no hay reglas, los borradores del formulario se conservan al cambiar de día y de canal, y se mantienen pruebas unitarias/de integración para los flujos visibles. La tercera tanda añade presentación declarativa (`order`, `placeholder` y opciones con `{ value, label }`) reutilizando el mismo `module-config.js` y el registro de formatos existente: los valores almacenados, las condiciones `when` y la clave `rubro` no cambian, las pistas grises son solo atributos de ejemplo y la unicidad del RUT sigue una sola regla normalizada. No se introducen dependencias ni violaciones de la constitución.

**Reverificación post-diseño del incremento de Marketing**: APROBADA. El marketing reutiliza `Entidad` y `Documento` con un campo `estado_comercial` declarado y reglas `marketing.automationRules`, sin esquema nuevo ni dependencias: las agregaciones se calculan en una utilidad pura y el embudo se reutiliza del panel. La captura pública se resuelve como vista autónoma en la misma aplicación sin backend, documentando la limitación de mismo origen. La barra lateral incluye Marketing; solo se retiran Clientes e Interacciones y se compensa con acciones rápidas, de modo que la navegación y el marco siguen siendo consistentes. Las pruebas unitarias y de integración cubren contadores, embudo, consentimiento, automatización y navegación; los estados vacíos y la leyenda accesible del embudo cumplen el Principio III.

**Reverificación post-diseño del incremento anterior**: APROBADA. Marketing reutiliza el panel y sus reglas de cálculo en lugar de duplicarlas, traslada su acceso a la barra lateral y mantiene `estado_comercial` como dato interno. Equipos, redes, «Dudas y consultas», campañas y rendimiento se modelan con campos personalizados, `Documento` y reglas declarativas sobre la configuración existente; no se añaden dependencias, backend ni esquemas nuevos. La atribución opcional y el grupo «Sin campaña» evitan migraciones, el desempate por campaña más reciente previene acciones duplicadas y el consentimiento de «Dudas y consultas» reutiliza la versión del aviso ya registrada. Los artefactos de Phase 1 documentan contratos, estados y escenarios de validación suficientes para `/speckit.tasks`.

**Reverificación post-diseño del incremento actual (2026-11-24)**: APROBADA. La nueva presentación de Marketing es solo una capa de renderizado: `dashboard.js` expone una opción para no dibujar `.quick-actions`, y `marketing.js` define las cinco secciones y su orden sin alterar las claves internas. «Dudas y consultas» se aplica al componente compartido y al texto visible de consentimiento, preservando `canal: 'chat'`, `#chat-form`, selectores y almacenamiento. No se añaden dependencias, esquemas ni servicios; las pruebas de integración cubren la ausencia de atajos del panel en Marketing, el orden exacto de los nuevos atajos y las etiquetas visibles en ambas superficies.

## Estructura del Proyecto

### Documentación (esta funcionalidad)

```text
specs/001-erp-base-module/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Código Fuente (raíz del repositorio)

```text
src/
├── main.js
├── styles.css
├── storage.js
├── app.js
├── module-config.js
├── utils/
│   ├── entity-date.js   (regla `entityDate`, fecha local y temporizador de medianoche)
│   ├── field-formats.js (formatos declarativos: `cl-rut`, `phone`, `email`, `nonEmpty`)
│   ├── field-rules.js (reglas declarativas por campo, visibilidad, búsqueda y grupos)
│   ├── sanitize.js (escape de texto y atributos para contenido persistido)
│   ├── search.js (normalización y coincidencias sobre campos visibles)
│   ├── marketing-stats.js (agregaciones puras: tarjetas del panel, embudo por estados de documento)
│   ├── marketing-config.js (validación del bloque `marketing` y sus definiciones)
│   ├── capture-prospect.js (captura pública con consentimiento y versión del aviso)
│   ├── marketing-automation.js (reglas por evento, campañas y ejecuciones)
│   ├── marketing-stage.js (transiciones internas de `estado_comercial`)
│   ├── marketing-social.js (interacciones de redes como `Documento`)
│   ├── marketing-chat.js («Dudas y consultas»: FAQ, respuestas rápidas y consultas de seguimiento)
│   ├── sales-team-metrics.js (real mensual y objetivo mensual derivados)
│   ├── marketing-campaigns.js (campañas, atribución, acciones y solapamientos)
│   └── marketing-performance.js (indicadores globales y por campaña)
└── components/
    ├── shell.js        (marco del espacio de trabajo: barra superior, logotipo SVG, barra lateral, estado de módulo activo)
    ├── dashboard.js    (vista de inicio: acciones rápidas + tarjetas en vivo; opción para ocultar solo las acciones rápidas en Marketing)
    ├── entity-form.js  (formulario de creación/edición de entidades con campos personalizados)
    ├── document-form.js (formulario de creación/edición de documentos con campos personalizados y ciclo de vida de estados)
    ├── entity-detail.js (ficha de entidad: datos de la entidad + sus documentos asociados ordenados por fecha; Historia de Usuario 3)
    ├── commercial-summary.js (resumen de indicadores: totales de entidades/documentos y documentos pendientes por entidad; Historia de Usuario 6)
    ├── marketing.js    (vista de Marketing: datos del panel, cinco atajos de sección ordenados, equipo, campañas, rendimiento, Dudas y consultas y redes; Historias de Usuario 16-21)
    ├── capture-form.js (formulario público autónomo con consentimiento, «Dudas y consultas» y creación de prospecto)
    ├── marketing-social.js (registro y consulta de interacciones en redes)
    └── marketing-chat.js   («Dudas y consultas»: preguntas frecuentes, respuestas rápidas y consultas de seguimiento)

tests/
├── unit/          (incluye entity-date, validación de rango y marketing-stats)
├── integration/   (incluye etiqueta, min/max, cambio de día, marketing y captura pública)
└── setup/
```

**Decisión de Estructura**: Una aplicación Vite simple con un único punto de entrada HTML, un pequeño conjunto de módulos JavaScript y CSS en un archivo separado. Se usará localStorage para la persistencia de modo que la aplicación permanezca ligera y autónoma. Los componentes se dividen en pares de entidad (datos maestros) y documento (transaccional) que reflejan los dos conceptos centrales del módulo base, de modo que un módulo personalizado pueda renombrar o extender cada par de forma independiente. `shell.js` posee el marco del espacio de trabajo ERP — un logotipo monograma SVG en línea derivado del nombre del módulo, la barra superior y la barra lateral de módulos — envolviendo todas las vistas para que la marca y la navegación permanezcan consistentes sin duplicar marcado. `dashboard.js` renderiza los botones de acción rápida y las tarjetas de estadísticas de la pantalla de entrada, leyendo los recuentos del almacenamiento cada vez que se vuelve visible. `entity-detail.js` renderiza la ficha de una entidad seleccionada (desde búsqueda o resumen) junto con su historial de documentos ordenado por fecha, reflejando los cambios hechos en la pantalla de gestión. `commercial-summary.js` agrega en memoria los recuentos de entidades, documentos y documentos pendientes (según el `statusLifecycle` configurado) y permite seleccionar una entidad para abrir su ficha de detalle; ambos son comportamiento genérico del módulo base, no exclusivo de un perfil CRM. `module-config.js` centraliza todos los puntos de adaptación — nombre del módulo, etiquetas de términos, definiciones de campos personalizados, ciclo de vida de estados, regla opcional `entityDate` y color de acento — manteniendo la personalización del dominio fuera del código central; el estilo se controla mediante propiedades personalizadas de CSS (tokens de diseño) en `styles.css` para que el color de acento configurado se aplique globalmente. `utils/entity-date.js` resuelve la regla activa a `{ label, min, max }`, calcula `localToday` con getters locales y programa el siguiente cambio de día; los componentes solo consumen ese resultado y `storage.js` aplica el mismo rango al validar escrituras, de modo que la interfaz y la persistencia no puedan divergir.

**Decisión adicional (sesión 2026-11-23, segunda tanda)**: Las reglas del perfil de clientes se expresan con mecanismos genéricos del módulo base, no con código específico de cliente. `fieldRules` gana visibilidad, generación, unicidad, obligatoriedad, formato, condición (`when`) y pertenencia a grupo (`group`); `detailPolicy.entity.blockWhenInvalid` bloquea la ficha de registros no completos; `entityDate.required` hace obligatoria la fecha sin afectar otros perfiles. Los componentes de formulario, lista, ficha, buscador y selectores consultan esas reglas, y `src/utils/field-formats.js` centraliza los formatos sin dependencias nuevas. El perfil CRM deja de declarar `pedidos` y añade los campos de contacto por canal.

**Decisión adicional (sesión 2026-11-23, tercera tanda)**: La presentación también se declara en la configuración. Un `order` numérico opcional ordena las casillas del formulario sin acoplar el componente al perfil CRM; `placeholder` proporciona pistas grises por campo y las opciones `select` aceptan `{ value, label }` para mostrar «Llamada» y seguir guardando `llamada`. El título «Nuevo Cliente» se deriva del término configurado sin género gramatical fijo. `rubro` conserva su clave y pasa a `select` con las diez opciones definidas; `rut` reutiliza `normalizeClRut` para formato y unicidad. Ninguna de estas decisiones introduce almacenamiento nuevo ni cambia las condiciones `when` existentes.

**Decisión adicional (cuarta tanda)**: Marketing se implementa como una vista más despachada por `renderCurrentView()` en `app.js`, con dos componentes nuevos (`marketing.js` y `capture-form.js`) y una utilidad pura de agregación. El campo `estado_comercial` se declara en `customFields.entity` y `fieldRules.entity`, y las reglas de automatización en un bloque `marketing` opcional validado por `validateConfig`; sin ese bloque el comportamiento base no cambia. Clientes e Interacciones salen de `NAV_ITEMS`, el panel gana una acción rápida para gestión de documentos y Marketing pasa a ser una entrada de la barra lateral. Ninguna de estas decisiones añade dependencias ni modifica la forma persistida de entidades y documentos.

**Decisión adicional (séptima tanda)**: Marketing reutiliza `computeDashboardStats()`/`marketing-stats.js` para mostrar las mismas tarjetas y el mismo embudo del panel, sin duplicar fórmulas. Equipos, redes, «Dudas y consultas» y campañas se añaden como vistas y utilidades dentro del mismo bloque `marketing` de configuración: `salesTeams`, `faq` y `campaigns`; el rendimiento se calcula a partir de los registros existentes. El campo opcional `campaña` se declara como personalizado de entidad y documento; los documentos de redes, dudas y consultas, seguimiento y ejecución ya son `Documento`, por lo que no hay esquema nuevo. `runAutomationRules()` incorpora `campaignId`, acciones internas y desempate por fecha de creación, manteniendo un único historial por entidad.

**Decisión adicional (octava tanda, 2026-11-24)**: El panel mantiene sus cinco acciones rápidas y Marketing deja de renderizarlas mediante una opción de `renderDashboardHtml()` que solo suprime el bloque `.quick-actions`; las tarjetas y el embudo siguen compartiendo la misma fuente. `marketing.js` sustituye su tabla de secciones por cinco entradas ordenadas —`team`, `campaigns`, `performance`, `chat` y `social`— con etiquetas visibles «Equipos de ventas y logros», «Campañas», «Rendimiento de campañas», «Dudas y consultas» y «Redes sociales». El componente compartido de «Dudas y consultas» y el error de consentimiento usan la nueva etiqueta visible, pero `data-section="chat"`, `#chat-form`, `.chat-*`, `canal: 'chat'`, `ChatConsentError`, nombres de archivo y funciones permanecen iguales. La única superficie nueva de pruebas es de integración: ausencia de `.quick-actions` en Marketing, orden y texto de los cinco atajos, y etiquetas en captura pública y Marketing.

## Seguimiento de Complejidad

Este plan no introdujo violaciones de la constitución. La sesión 2026-11-23 tampoco añade dependencias: reutiliza `Date` nativo, el sistema de configuración existente, la lógica de RUT ya presente en la semilla y el mismo patrón de pruebas Vitest/jsdom. Las contrapartidas registradas son un temporizador de baja frecuencia (una vez al día) para mantener el límite visible actualizado, y una capa declarativa adicional (`fieldRules`/`detailPolicy`) que se resuelve en un único punto y no modifica el comportamiento de los módulos que no la declaran. El bloqueo de ficha reutiliza el validador de guardado, por lo que no añade una segunda fuente de verdad. La tercera tanda tampoco añade dependencias: `order`, `placeholder` y `options` con valor y etiqueta se resuelven en el mismo punto de configuración, las pistas son texto de ejemplo sin persistencia, y la aceptación de dos formatos de RUT aprovecha el normalizador ya existente en `field-formats.js`.

La cuarta tanda mantiene la huella de dependencias en cero: las agregaciones se calculan en una sola pasada sobre los registros ya cargados en memoria; la captura pública reutiliza el mismo `localStorage` y no requiere backend (contrapartida: el `iframe` debe ser del mismo origen); y las reglas de automatización se ejecutan en un único punto de la capa de almacenamiento, registrando cada acción como un `Documento` para no introducir un segundo historial. La retirada de dos entradas de `NAV_ITEMS` exige actualizar las pruebas de integración que navegaban por sus selectores, compensadas con acciones rápidas y con la API `app.navigate()`.

La séptima tanda no añade dependencias: reutiliza el panel como fuente de datos, `Documento` como historial de interacciones y ejecuciones, y reglas declarativas para campañas y respuestas rápidas. La contrapartida principal es que las campañas y «Dudas y consultas» siguen siendo locales al navegador y no envían mensajes externos, decisión ya registrada en la especificación. El desempate entre campañas solapadas añade una regla determinista para evitar acciones duplicadas sin crear un motor de reglas nuevo.

La octava tanda tampoco añade dependencias ni violaciones: introduce una opción booleana en el renderizador compartido y cambia etiquetas visibles. La contrapartida es que el panel y Marketing comparten el componente de tarjetas con distinta configuración de atajos, y que «Dudas y consultas» conserva identificadores internos heredados para no migrar documentos ni romper selectores; ambos puntos quedan cubiertos por pruebas de integración.
