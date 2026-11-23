# Plan de Implementación: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

**Rama**: `001-erp-base-module` | **Creado**: 2026-07-08 | **Actualizado**: 2026-11-23 | **Especificación**: [spec.md](spec.md)
**Entrada**: Especificación de la funcionalidad desde `/specs/001-erp-base-module/spec.md`

**Incremento actual (2026-11-23, cuarta tanda)**: añadir el apartado de Marketing —captura pública de prospectos con consentimiento, automatización por eventos, seguimiento comercial, contadores, embudo y gráfico de torta «Estado comercial de la cartera»— y retirar «Clientes» e «Interacciones» de la barra lateral, dejando esos accesos únicamente en el panel principal.

## Resumen

Construir una aplicación web ligera con Vite que sirva como módulo base de software de planificación de recursos empresariales (ERP). El módulo proporciona la base común que todo módulo ERP personalizado necesita: gestión de datos maestros (Entidades), documentos transaccionales vinculados (Documentos), flujos de crear/editar/eliminar/buscar, validación y persistencia local — construida principalmente con HTML, CSS y JavaScript vanilla. La aplicación se presenta como un espacio de trabajo ERP coherente: una barra superior con marca (logotipo derivado + nombre del módulo) y una barra lateral persistente de botones de módulo envuelven cada pantalla, y la pantalla de entrada es un panel estilo ERP que ofrece botones de acción rápida para las tareas clave (nueva entidad, nuevo documento, abrir áreas de gestión, buscar registros) además de estadísticas de registros en vivo. La adaptación a un módulo específico (p. ej., Ventas) se realiza mediante un único archivo de configuración (`src/module-config.js`) que cubre terminología, campos personalizados, ciclo de vida de documentos y color de acento, de modo que el código central permanece intacto. En el perfil de clientes, la fecha objetivo pasa a denominarse "Fecha de nacimiento" y se limita al rango comprendido entre el 1 de enero de 1910 y la fecha local actual, con actualización automática del límite al cambiar de día y conservación de los valores históricos que queden fuera de rango. En una segunda tanda de cambios del mismo perfil, el formulario de clientes deja de mostrar «Código», «Categoría», «Descripción» y «Nº de pedidos» (generando y guardando un código interno único sin exposición), exige «Fecha de nacimiento», «Canal de Contacto» y «RUT» con formato chileno válido y único, y despliega una casilla de contacto condicionada al canal elegido con validación propia; la ficha de los clientes heredados incompletos queda bloqueada hasta completarla mediante edición.

## Contexto Técnico

**Lenguaje/Versión**: JavaScript (ES2022), HTML, CSS  
**Dependencias Principales**: Vite, sin framework de interfaz pesado  
**Almacenamiento**: localStorage del navegador para una instancia del módulo de espacio único  
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

**Vista de Marketing**: Vista adicional (`state.view = 'marketing'`) alcanzable desde una acción rápida del panel; el marco de espacio de trabajo permanece igual
**Captura pública**: Vista autónoma seleccionada por `?view=capture`, embebible por `iframe` del mismo origen; sin backend, escribe en el mismo `localStorage`
**Estado comercial**: Campo personalizado de entidad `estado_comercial` con valores `prospecto`, `en_proceso`, `en_recontacto`, `ganado` y `perdido`; sin nueva estructura de almacenamiento
**Agregaciones**: Utilidad pura `src/utils/marketing-stats.js` que deriva contadores, tasas, embudo y categorías de la torta desde las entidades almacenadas
**Gráfico**: SVG generado en `src/components/marketing.js` con cinco sectores y leyenda accesible; sin librerías de gráficos ni dependencias nuevas
**Automatización**: Reglas declarativas `marketing.automationRules` evaluadas tras las mutaciones de almacenamiento; cada ejecución se registra como un `Documento` en el historial de la entidad
**Consentimiento**: Campos `consentimiento`, `consentimiento_fecha` y `consentimiento_version` en la entidad creada desde la captura; versión declarada en `marketing.privacyNoticeVersion`
**Navegación lateral**: `NAV_ITEMS` conserva Panel, Buscar y Resumen; se eliminan Clientes e Interacciones y se añade la quinta acción rápida de gestión de documentos

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
- La conversión se mide con un embudo por etapas: conteo por etapa y tasa entre etapas derivada del estado de la entidad.
- El apartado muestra cinco contadores («Leads analizados», «Oportunidades abiertas», «Clientes ganados», «Tasa de pérdida», «Conversión actual») y un gráfico de torta «Estado comercial de la cartera» con «Clientes ganados», «En recontacto», «En proceso», «Perdidos» y «Sin resultados definitivos».
- «Clientes» e «Interacciones» se eliminan de la barra lateral; solo se acceden desde el panel principal. Panel, Buscar y Resumen permanecen en la barra lateral.

## Verificación de la Constitución

*COMPROBACIÓN: Debe pasar antes de la investigación de la Fase 0. Reverificar tras el diseño de la Fase 1.*

- Calidad: La implementación usará una estructura JavaScript pequeña y modular con límites de función claros y nomenclatura consistente, manteniendo las preocupaciones base (almacenamiento, identidad, integridad referencial) separadas de la lógica específica del dominio para que los módulos personalizados puedan extenderlas.
- Pruebas: Los flujos centrales de crear, editar, eliminar y buscar estarán cubiertos por pruebas automatizadas antes de completar.
- Experiencia de Usuario: La interfaz proporcionará mensajes de validación claros, estados vacíos y comportamiento de formulario consistente, presentados dentro de un marco de espacio de trabajo ERP con marca (barra superior + barra lateral) que se ve y se comporta idénticamente en todas las pantallas.
- Rendimiento: La búsqueda y el renderizado de listas se optimizarán para colecciones de hasta 500 registros usando actualizaciones ligeras del DOM.
- Calidad (Marketing): Las agregaciones, reglas de automatización y validación de consentimiento se implementarán como funciones puras en módulos pequeños, con la configuración como único punto de declaración, reutilizando `Entidad` y `Documento` sin nuevas estructuras de almacenamiento.
- Pruebas (Marketing): Se cubrirán con pruebas unitarias las agregaciones y reglas, y con pruebas de integración la vista, la captura con consentimiento, el gráfico accesible y la ausencia de Clientes/Interacciones en la barra lateral.
- Experiencia de Usuario (Marketing): Los contadores y el gráfico usarán los mismos patrones visuales que el panel principal, con estados vacíos claros y leyenda textual accesible; el formulario público mostrará errores comprensibles sin el marco ERP.
- Rendimiento (Marketing): Las agregaciones se calcularán en memoria sobre el arreglo ya cargado en `state`, con una sola pasada por entidad y sin almacenar resultados derivados.

**Reverificación post-diseño (Fase 1)**: APROBADA. Los artefactos de diseño (research, data-model, contratos, quickstart) mantienen la separación entre almacenamiento base y dominio, validan la unicidad de `code`, preservan los valores huérfanos de campos personalizados, documentan el fallback con advertencia ante configuración inválida y exigen confirmación con recuento antes de la eliminación en cascada. La regla de fecha y las nuevas reglas de perfil se declaran en `module-config.js` mediante `entityDate.required`, `fieldRules` y `detailPolicy`; la validación de RUT reutiliza la lógica ya existente en la semilla, extraída a un registro local de formatos, sin añadir dependencias. El comportamiento base permanece intacto cuando no hay reglas, los borradores del formulario se conservan al cambiar de día y de canal, y se mantienen pruebas unitarias/de integración para los flujos visibles. La tercera tanda añade presentación declarativa (`order`, `placeholder` y opciones con `{ value, label }`) reutilizando el mismo `module-config.js` y el registro de formatos existente: los valores almacenados, las condiciones `when` y la clave `rubro` no cambian, las pistas grises son solo atributos de ejemplo y la unicidad del RUT sigue una sola regla normalizada. No se introducen dependencias ni violaciones de la constitución.

**Reverificación post-diseño del incremento de Marketing**: APROBADA. El marketing reutiliza `Entidad` y `Documento` con un campo `estado_comercial` declarado y reglas `marketing.automationRules`, sin esquema nuevo ni dependencias: la torta se genera en SVG y las agregaciones en una utilidad pura. La captura pública se resuelve como vista autónoma en la misma aplicación sin backend, documentando la limitación de mismo origen. La barra lateral conserva Panel, Buscar y Resumen; solo se retiran Clientes e Interacciones y se compensa con una quinta acción rápida, de modo que la navegación y el marco siguen siendo consistentes. Las pruebas unitarias y de integración cubren contadores, categorías, consentimiento, automatización y navegación; los estados vacíos y la leyenda accesible cumplen el Principio III.

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
│   └── marketing-stats.js (agregaciones puras: contadores, tasas, embudo y categorías de la torta)
└── components/
    ├── shell.js        (marco del espacio de trabajo: barra superior, logotipo SVG, barra lateral, estado de módulo activo)
    ├── dashboard.js    (vista de inicio: acciones rápidas + tarjetas de estadísticas en vivo)
    ├── entity-form.js  (formulario de creación/edición de entidades con campos personalizados)
    ├── document-form.js (formulario de creación/edición de documentos con campos personalizados y ciclo de vida de estados)
    ├── entity-detail.js (ficha de entidad: datos de la entidad + sus documentos asociados ordenados por fecha; Historia de Usuario 3)
    ├── commercial-summary.js (resumen de indicadores: totales de entidades/documentos y documentos pendientes por entidad; Historia de Usuario 6)
    ├── marketing.js    (vista de Marketing: cinco contadores, embudo, torta SVG y leyenda; Historia de Usuario 16)
    └── capture-form.js (formulario público autónomo con consentimiento, estado inicial y creación de prospecto)

tests/
├── unit/          (incluye entity-date, validación de rango y marketing-stats)
├── integration/   (incluye etiqueta, min/max, cambio de día, marketing y captura pública)
└── setup/
```

**Decisión de Estructura**: Una aplicación Vite simple con un único punto de entrada HTML, un pequeño conjunto de módulos JavaScript y CSS en un archivo separado. Se usará localStorage para la persistencia de modo que la aplicación permanezca ligera y autónoma. Los componentes se dividen en pares de entidad (datos maestros) y documento (transaccional) que reflejan los dos conceptos centrales del módulo base, de modo que un módulo personalizado pueda renombrar o extender cada par de forma independiente. `shell.js` posee el marco del espacio de trabajo ERP — un logotipo monograma SVG en línea derivado del nombre del módulo, la barra superior y la barra lateral de módulos — envolviendo todas las vistas para que la marca y la navegación permanezcan consistentes sin duplicar marcado. `dashboard.js` renderiza los botones de acción rápida y las tarjetas de estadísticas de la pantalla de entrada, leyendo los recuentos del almacenamiento cada vez que se vuelve visible. `entity-detail.js` renderiza la ficha de una entidad seleccionada (desde búsqueda o resumen) junto con su historial de documentos ordenado por fecha, reflejando los cambios hechos en la pantalla de gestión. `commercial-summary.js` agrega en memoria los recuentos de entidades, documentos y documentos pendientes (según el `statusLifecycle` configurado) y permite seleccionar una entidad para abrir su ficha de detalle; ambos son comportamiento genérico del módulo base, no exclusivo de un perfil CRM. `module-config.js` centraliza todos los puntos de adaptación — nombre del módulo, etiquetas de términos, definiciones de campos personalizados, ciclo de vida de estados, regla opcional `entityDate` y color de acento — manteniendo la personalización del dominio fuera del código central; el estilo se controla mediante propiedades personalizadas de CSS (tokens de diseño) en `styles.css` para que el color de acento configurado se aplique globalmente. `utils/entity-date.js` resuelve la regla activa a `{ label, min, max }`, calcula `localToday` con getters locales y programa el siguiente cambio de día; los componentes solo consumen ese resultado y `storage.js` aplica el mismo rango al validar escrituras, de modo que la interfaz y la persistencia no puedan divergir.

**Decisión adicional (sesión 2026-11-23, segunda tanda)**: Las reglas del perfil de clientes se expresan con mecanismos genéricos del módulo base, no con código específico de cliente. `fieldRules` gana visibilidad, generación, unicidad, obligatoriedad, formato, condición (`when`) y pertenencia a grupo (`group`); `detailPolicy.entity.blockWhenInvalid` bloquea la ficha de registros no completos; `entityDate.required` hace obligatoria la fecha sin afectar otros perfiles. Los componentes de formulario, lista, ficha, buscador y selectores consultan esas reglas, y `src/utils/field-formats.js` centraliza los formatos sin dependencias nuevas. El perfil CRM deja de declarar `pedidos` y añade los campos de contacto por canal.

**Decisión adicional (sesión 2026-11-23, tercera tanda)**: La presentación también se declara en la configuración. Un `order` numérico opcional ordena las casillas del formulario sin acoplar el componente al perfil CRM; `placeholder` proporciona pistas grises por campo y las opciones `select` aceptan `{ value, label }` para mostrar «Llamada» y seguir guardando `llamada`. El título «Nuevo Cliente» se deriva del término configurado sin género gramatical fijo. `rubro` conserva su clave y pasa a `select` con las diez opciones definidas; `rut` reutiliza `normalizeClRut` para formato y unicidad. Ninguna de estas decisiones introduce almacenamiento nuevo ni cambia las condiciones `when` existentes.

**Decisión adicional (cuarta tanda)**: Marketing se implementa como una vista más despachada por `renderCurrentView()` en `app.js`, con dos componentes nuevos (`marketing.js` y `capture-form.js`) y una utilidad pura de agregación. El campo `estado_comercial` se declara en `customFields.entity` y `fieldRules.entity`, y las reglas de automatización en un bloque `marketing` opcional validado por `validateConfig`; sin ese bloque el comportamiento base no cambia. La barra lateral se reduce en `NAV_ITEMS` y el panel gana una acción rápida para gestión de documentos. Ninguna de estas decisiones añade dependencias ni modifica la forma persistida de entidades y documentos.

## Seguimiento de Complejidad

Este plan no introdujo violaciones de la constitución. La sesión 2026-11-23 tampoco añade dependencias: reutiliza `Date` nativo, el sistema de configuración existente, la lógica de RUT ya presente en la semilla y el mismo patrón de pruebas Vitest/jsdom. Las contrapartidas registradas son un temporizador de baja frecuencia (una vez al día) para mantener el límite visible actualizado, y una capa declarativa adicional (`fieldRules`/`detailPolicy`) que se resuelve en un único punto y no modifica el comportamiento de los módulos que no la declaran. El bloqueo de ficha reutiliza el validador de guardado, por lo que no añade una segunda fuente de verdad. La tercera tanda tampoco añade dependencias: `order`, `placeholder` y `options` con valor y etiqueta se resuelven en el mismo punto de configuración, las pistas son texto de ejemplo sin persistencia, y la aceptación de dos formatos de RUT aprovecha el normalizador ya existente en `field-formats.js`.

La cuarta tanda mantiene la huella de dependencias en cero: la torta se dibuja con SVG en lugar de incorporar una librería de gráficos; las agregaciones se calculan en una sola pasada sobre los registros ya cargados en memoria; la captura pública reutiliza el mismo `localStorage` y no requiere backend (contrapartida: el `iframe` debe ser del mismo origen); y las reglas de automatización se ejecutan en un único punto de la capa de almacenamiento, registrando cada acción como un `Documento` para no introducir un segundo historial. La retirada de dos entradas de `NAV_ITEMS` exige actualizar las pruebas de integración que navegaban por sus selectores, compensadas con acciones rápidas y con la API `app.navigate()`.
