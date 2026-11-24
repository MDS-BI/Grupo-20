# Plan de Implementación: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

**Rama**: `001-erp-base-module` | **Creado**: 2026-07-08 | **Actualizado**: 2026-11-24 | **Especificación**: [spec.md](spec.md)
**Entrada**: Especificación de la funcionalidad desde `/specs/001-erp-base-module/spec.md`

**Incremento actual (2026-11-24, octava tanda)**: añadir autenticación local, sesión persistente con expiración, contraseñas con hash, bloqueo temporal, matriz única de permisos por rango y administración de usuarios restringida al Gerente comercial. La estructura incluye `src/auth.js`, `src/auth/permissions.js`, `src/components/login.js` y `src/components/users-admin.js`.

## Resumen

Construir una aplicación web Vite sin framework de interfaz que sirva como módulo base de software de planificación de recursos empresariales (ERP). El módulo proporciona la base común que todo módulo ERP personalizado necesita: gestión de datos maestros (Entidades), documentos transaccionales vinculados (Documentos), flujos de crear/editar/eliminar/buscar, validación y persistencia local — construida con HTML, CSS y JavaScript vanilla. La aplicación se presenta como un espacio de trabajo ERP con barra superior (logotipo derivado + nombre del módulo) y barra lateral persistentes en cada pantalla, y la pantalla de entrada es un panel que ofrece las acciones rápidas enumeradas en FR-010 y FR-033 (nueva entidad, nuevo documento, abrir áreas de gestión, buscar registros) además de estadísticas derivadas de los registros almacenados en cada render. La adaptación a un módulo específico (p. ej., Ventas) se realiza mediante un único archivo de configuración (`src/module-config.js`) que cubre terminología, campos personalizados, ciclo de vida de documentos y color de acento, de modo que el código central permanece intacto. En el perfil de clientes, la fecha objetivo pasa a denominarse "Fecha de nacimiento" y se limita al rango comprendido entre el 1 de enero de 1910 y la fecha local actual, con actualización automática del límite al cambiar de día y conservación de los valores históricos que queden fuera de rango. En una segunda tanda de cambios del mismo perfil, el formulario de clientes deja de mostrar «Código», «Categoría», «Descripción» y «Nº de pedidos» (generando y guardando un código interno único sin exposición), exige «Fecha de nacimiento», «Canal de Contacto» y «RUT» con formato chileno válido y único, y despliega una casilla de contacto condicionada al canal elegido con validación propia; la ficha de los clientes heredados incompletos queda bloqueada hasta completarla mediante edición.

## Contexto Técnico

**Lenguaje/Versión**: JavaScript (ES2022), HTML, CSS  
**Dependencias Principales**: Vite, sin framework de interfaz pesado  
**Almacenamiento**: localStorage del navegador para una instancia del módulo de espacio único: `erp_entities`, `erp_documents`, `erp_marketing_config` para definiciones editables de Marketing, `erp_users` y `erp_session`; la denegación de permisos se garantiza en la API local con sesión íntegra, incluidas las llamadas desde consola, no contra manipulación deliberada de `localStorage`/`erp_session` ni falsificación de identidad/rango sin backend<br>
**Pruebas**: Vitest con jsdom para pruebas unitarias y de interacción (`npm test`); lint con `npm run lint`; comprobación de formato con `npm run format:check`; no hay script `typecheck`<br>
**Utilidades de Fecha**: `Date` nativo y cadenas ISO `YYYY-MM-DD`, sin librerías de fechas; resolución del límite superior mediante componentes locales y temporizador hasta la medianoche local  
**Plataforma Objetivo**: Navegador de escritorio moderno de referencia y navegador low-end/móvil de referencia definidos en FR-032  
**Tipo de Proyecto**: Aplicación web  
**Objetivos de Rendimiento**: Con 500 entidades y 500 documentos, renderizar, buscar y recalcular estados derivados en menos de 2 s en todos los casos, con objetivos de 200 ms p95 en el navegador de escritorio moderno de referencia y 500 ms p95 en el navegador low-end/móvil de referencia, sin congelación visible y con una sola pasada por juego de datos (FR-032, SC-004)  
**Restricciones**: Sin framework de interfaz ni dependencias de ejecución añadidas, despliegue estático de Vite, sin backend requerido; la estructura debe mantenerse extensible para módulos personalizados  
**Escala/Alcance**: Módulo base con CRUD de datos maestros (Entidad) y documentos transaccionales (Documento), búsqueda y capacidades de navegación  
**Reglas de Campo**: Capa declarativa opcional en `module-config.js` (`fieldRules`, `detailPolicy`) para ocultar, generar, exigir, hacer único, condicionar y excluir de búsqueda campos base o personalizados; la configuración ausente conserva el comportamiento base  
**Formatos de Validación**: Registro local de formatos (`src/utils/field-formats.js`) con `cl-rut`, `phone`, `email` y `nonEmpty`; sin dependencias nuevas  
**Preparación de Ficha**: Comprobación pura reutilizada del mismo validador declarativo para bloquear la consulta de registros incompletos y ofrecer su edición
**Presentación del Formulario**: Orden opcional por campo (`order`), pistas grises (`placeholder`) y opciones de selección con valor y etiqueta separados; sin dependencias nuevas
**RUT**: Se aceptan `12345678-9` y `12.345.678-9`; ambos se normalizan para validar el dígito verificador y para comparar unicidad

### Contexto Técnico del incremento de Marketing

**Vista de Marketing**: Vista adicional (`state.view = 'marketing'`) alcanzable desde la barra lateral como cuarta opción; el panel ya no muestra «Abrir Marketing»
**Captura pública y chat**: Vistas autónomas/`?view=capture` y controles embebidos en Marketing; responden desde preguntas frecuentes configuradas y registran consultas sin coincidencia como `Documento`
**Estado comercial**: Campo personalizado de entidad `estado_comercial` con valores `prospecto`, `en_proceso`, `en_recontacto`, `ganado` y `perdido`; se conserva oculto para la automatización y ya no alimenta tarjetas ni embudo
**Agregaciones**: Utilidad pura `src/utils/marketing-stats.js` que deriva las cinco tarjetas del panel y el embudo por estados de `Documento`, con `computeMarketingPerformance()` para indicadores por campaña; sin escribir resultados derivados
**Automatización**: Reglas declarativas `marketing.automationRules` y campañas programadas evaluadas tras las mutaciones de almacenamiento; cada ejecución se registra como un `Documento` en el historial de la entidad
**Atribución**: Campo opcional `campaña` en entidades, interacciones y documentos; los registros sin campaña se agrupan bajo «Sin campaña»
**Consentimiento**: Campos `consentimiento`, `consentimiento_fecha` y `consentimiento_version` en la entidad creada desde la captura y en el chat; versión declarada en `marketing.privacyNoticeVersion`
**Navegación lateral**: `NAV_ITEMS` ofrece Panel, Buscar, Resumen y Marketing; Clientes e Interacciones solo se acceden desde el panel o enlaces profundos

### Contexto Técnico del incremento de autenticación y permisos

**Módulo de sesión**: `src/auth.js` centraliza inicio de sesión, cierre, persistencia local de la sesión, expiración por inactividad, bloqueo temporal y hashes de contraseña con Web Crypto API (`PBKDF2-SHA-256`), sin dependencias nuevas.
**Almacenamiento de identidad**: claves nuevas `erp_users` y `erp_session` en `localStorage`; `erp_session` conserva solo `userId` y marcas de tiempo, y el rango vigente se resuelve desde `erp_users` en cada verificación para reflejar cambios y desactivaciones inmediatas.
**Matriz de permisos**: `src/auth/permissions.js` exporta la tabla rango → acción, la función `can(role, action, context)` y `assertPermission()`; es la única fuente para navegación, botones, vistas y validaciones de `src/storage.js`. Las acciones no declaradas se deniegan por defecto y la matriz no se edita desde la interfaz.
**Catálogo canónico de acciones**: los identificadores y la regla de contexto `ownerId`/`campaignOwnerId` se definen en `spec.md` («Catálogo canónico de acciones»); `contracts/auth.md` y `data-model.md` DEBEN reflejarlos sin introducir acciones nuevas ni variantes propio/cualquiera adicionales.
**Identidad automática**: las reglas de Marketing continúan ejecutándose como `Sistema`; `Sistema` es una identidad de auditoría, no un rango interactivo, y su historial conserva además el usuario creador de la campaña en `createdByUserId`.
**Vistas de acceso**: `src/components/login.js` renderiza la pantalla de inicio de sesión sin marco ERP y permite las rutas públicas de captura y chat; `src/components/users-admin.js` se abre solo desde el menú del usuario de la barra superior para el rango «Nivel 4 - Gerente comercial».
**Reglas de sesión**: expiración por 8 horas de inactividad, bloqueo tras 5 intentos fallidos durante 15 minutos, y revoke inmediato al desactivar usuario; un cambio de rango se aplica en la siguiente acción o recarga. La denegación se garantiza en UI, enlaces profundos y la API de `storage.js`, incluidas las llamadas desde consola con sesión íntegra; la manipulación deliberada de `localStorage`, de `erp_session` o del entorno para falsificar identidad/rango queda fuera del alcance demostrativo.
**Usuarios de demostración**: la semilla local incluye `camila.ramirez` (Nivel 4), `lucia.fernandez` (Nivel 3), `pedro.soto` (Nivel 2) y `sofia.torres` (Nivel 1); las contraseñas se almacenan como hash con sal individual, nunca en texto plano.

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
- El acceso «Equipo de ventas y logros» permite equipos e integrantes capturados por el usuario, mientras que el real mensual y el objetivo mensual los calcula el sistema.
- El real mensual suma documentos «Cerrado ganado» del mes por «Ejecutivo Asignado»; el objetivo mensual es la proyección `ventas ÷ días transcurridos × días del mes`, o cero sin ventas o sin días transcurridos.

### Aclaraciones integradas (sesión 2026-11-23, sexta tanda: canales y chat)

- Las interacciones en redes se registran manualmente con plataforma, fecha, tipo, nota y enlace, vinculadas al prospecto o cliente.
- Las interacciones de redes y los mensajes del chat se guardan como `Documento` con campos personalizados de plataforma/canal y tipo de interacción.
- El chat responde desde preguntas frecuentes configuradas; sin coincidencia registra la consulta para seguimiento.
- El chat está disponible en el formulario público de captura y en Marketing, con consentimiento explícito antes del primer mensaje.

### Aclaraciones integradas (sesión 2026-11-23, séptima tanda: campañas y rendimiento)

- La automatización se organiza en campañas internas por etapa, sin servicios externos.
- El rendimiento se mide con prospectos, conversión por etapa, interacciones, consultas respondidas y ventas ganadas, derivados de registros ya almacenados.
- El campo opcional `campaña` atribuye prospectos, interacciones y ventas; sin valor se agrupa bajo «Sin campaña».
- Las acciones internas de campaña son crear documento de seguimiento, asignar ejecutivo y actualizar `estado_comercial`.
- Si dos campañas activas aplican al mismo prospecto y evento, se ejecuta la más reciente y la otra se registra como «omitida por solapamiento».

### Aclaraciones integradas (sesión 2026-11-24)

- La matriz de permisos no se edita desde la interfaz; se modifica solo en su definición y ningún usuario la cambia desde una pantalla.
- La sesión persiste localmente al recargar y al reabrir el navegador, y finaliza con «Cerrar sesión», desactivación del usuario o expiración por inactividad.
- La desactivación de un usuario revoca su sesión de inmediato: en la siguiente acción o recarga se redirige a inicio de sesión.
- Un cambio de rango se aplica en la siguiente acción o recarga, actualizando la barra superior y los permisos derivados de la matriz.
- El nombre de usuario es único sin distinguir mayúsculas ni espacios; el guardado rechaza duplicados.

### Ajustes posteriores al análisis (2026-11-24)

- FR-005 se limita a búsqueda/ficha; la pantalla de gestión sigue sin lista de entidades conforme a FR-016.
- FR-035 define las cinco tarjetas canónicas del panel y el embudo, reutilizados por Marketing sin duplicar fórmulas.
- La conversión Prospecto→Cliente ocurre solo por transición interna (regla/campaña o edición de Nivel 4) con auditoría, sin selector de etapas.
- El chat exige consentimiento y los campos obligatorios declarados en `marketing.captureFields` antes del primer mensaje, de modo que las consultas sin coincidencia se vinculen a una entidad.
- Las ventas históricas conservan `assignedUserIdAtSale` aunque el usuario esté inactivo y FR-078/FR-079 la consumen antes que el campo vigente; las nuevas asignaciones siguen exigiendo usuarios activos N2/N4.
- El creador de campaña se persiste en `createdByUserId`, separado de la ejecución como `Sistema`.
- El catálogo canónico de acciones de `spec.md` gobierna `can()`/`assertPermission()`, las pruebas de permisos y la alineación de contratos/modelo de datos.
- SC-003 se vuelve medible con cinco participantes y se cubre con una tarea de validación cronometrada.
- Las seis rutas relativas `?view=summary`, `?view=capture`, `?view=marketing`, `?view=manage-entity`, `?view=manage-document` y `?view=users-admin` se resuelven desde `location.search` en un mismo documento HTML sin host ni ruta de servidor; sin parámetro `view` el Panel es la vista inicial y no existe `?view=panel`.

## Verificación de la Constitución

_COMPROBACIÓN: Debe pasar antes de la investigación de la Fase 0. Reverificar tras el diseño de la Fase 1._

- Calidad: La implementación usará una estructura JavaScript modular con límites de función y nomenclatura definidos, manteniendo las preocupaciones base (almacenamiento, identidad, integridad referencial) separadas de la lógica específica del dominio para que los módulos personalizados puedan extenderlas.
- Calidad (herramientas): Todo incremento ejecutará `npm run lint` además de `npm test`, y el gate final de calidad ejecutará `npm run format:check`; `format:check` usa Prettier en modo comprobación y sustituye la edición automática de `npm run format` en la verificación de calidad.
- Pruebas: Los flujos centrales de crear, editar, eliminar y buscar estarán cubiertos por pruebas automatizadas antes de completar.
- Experiencia de Usuario: La interfaz mostrará mensajes de validación con el texto exacto de FR-006 y estados vacíos con texto definido, y aplicará el mismo comportamiento de formulario en todas las pantallas dentro de un marco de espacio de trabajo ERP compartido con barra superior y barra lateral.
- Rendimiento: Con 500 entidades y 500 documentos, búsqueda, renderizado de listas y recálculo de estados derivados se ejecutan en una sola pasada, terminan en menos de 2 s en todos los casos y se verifican con umbrales p95 de 200 ms en escritorio moderno y 500 ms en low-end/móvil, sin congelación visible (FR-032, SC-004).
- Calidad (Marketing): Las agregaciones, reglas de automatización y validación de consentimiento se implementarán como funciones puras en módulos separados por responsabilidad, con la configuración como único punto de declaración, reutilizando `Entidad` y `Documento` sin nuevas estructuras de almacenamiento.
- Pruebas (Marketing): Se cubrirán con pruebas unitarias las agregaciones y reglas, y con pruebas de integración la vista, la captura con consentimiento, el embudo accesible y la presencia de Marketing en la barra lateral.
- Experiencia de Usuario (Marketing): Los contadores y el embudo usarán los mismos patrones visuales que el panel principal, con estados vacíos con texto definido y leyenda textual accesible; el formulario público mostrará errores con el texto exacto de FR-006 sin el marco ERP.
- Rendimiento (Marketing): Las agregaciones se calcularán en memoria sobre el arreglo ya cargado en `state`, con una sola pasada por entidad y sin almacenar resultados derivados.
- Calidad (Campañas): Las campañas, la atribución, las acciones internas y la resolución de solapamientos se implementarán como utilidades puras y reglas declarativas reutilizando `Entidad`, `Documento` y `marketing.automationRules`, sin estructura de almacenamiento ni dependencias nuevas.
- Pruebas (Campañas): Se cubrirán con pruebas unitarias el cálculo de indicadores, la atribución «Sin campaña», las acciones permitidas y el desempate por campaña más reciente, y con pruebas de integración las vistas de campañas y rendimiento.
- Seguridad y UX (Campañas): El chat exigirá consentimiento previo, todo contenido persistido se sanitizará al renderizarse y las vistas nuevas mostrarán estados vacíos y los mensajes exactos de FR-006 antes de cualquier ejecución.
- Calidad (Autenticación): La sesión, el hash, el bloqueo, la expiración y la matriz de permisos se aislarán en `src/auth.js` y `src/auth/permissions.js`, manteniendo una sola fuente de verdad y funciones puras verificables.
- Pruebas (Autenticación): Se cubrirán con pruebas unitarias el hash, la unicidad, el bloqueo, la expiración y `can()`/`assertPermission()`, y con pruebas de integración el login, el menú del usuario, la administración de usuarios y el rechazo de operaciones directas en `storage.js`.
- Experiencia de Usuario (Autenticación): La pantalla de inicio de sesión, el mensaje «Usuario o contraseña incorrectos», el mensaje «Acceso denegado» y el retorno al Panel seguirán los mismos patrones de validación y retroalimentación que el resto del marco ERP; «Gestionar usuarios» solo aparecerá en el menú del usuario del Gerente.
- Rendimiento (Autenticación): La resolución del usuario y del rango se hará en memoria desde una sola lectura de `localStorage` por cambio de vista o mutación, sin recalcular hashes salvo en el inicio de sesión.

**Reverificación post-diseño (Fase 1)**: APROBADA. Los artefactos de diseño (research, data-model, contratos, quickstart) mantienen la separación entre almacenamiento base y dominio, validan la unicidad de `code`, preservan los valores huérfanos de campos personalizados, documentan el fallback con advertencia ante configuración inválida y exigen confirmación con recuento antes de la eliminación en cascada. La regla de fecha y las nuevas reglas de perfil se declaran en `module-config.js` mediante `entityDate.required`, `fieldRules` y `detailPolicy`; la validación de RUT reutiliza la lógica ya existente en la semilla, extraída a un registro local de formatos, sin añadir dependencias. El comportamiento base permanece intacto cuando no hay reglas, los borradores del formulario se conservan al cambiar de día y de canal, y se mantienen pruebas unitarias/de integración para los flujos visibles. La tercera tanda añade presentación declarativa (`order`, `placeholder` y opciones con `{ value, label }`) reutilizando el mismo `module-config.js` y el registro de formatos existente: los valores almacenados, las condiciones `when` y la clave `rubro` no cambian, las pistas grises son solo atributos de ejemplo y la unicidad del RUT sigue una sola regla normalizada. No se introducen dependencias ni violaciones de la constitución.

**Reverificación post-diseño del incremento de Marketing**: APROBADA. El marketing reutiliza `Entidad` y `Documento` con un campo `estado_comercial` declarado y reglas `marketing.automationRules`, sin esquema nuevo ni dependencias: las agregaciones se calculan en una utilidad pura y el embudo se reutiliza del panel. La captura pública se resuelve como vista autónoma en la misma aplicación sin backend, documentando la limitación de mismo origen. La barra lateral incluye Marketing; solo se retiran Clientes e Interacciones y se compensa con acciones rápidas, de modo que la navegación y el marco siguen siendo consistentes. Las pruebas unitarias y de integración cubren contadores, embudo, consentimiento, automatización y navegación; los estados vacíos y la leyenda accesible del embudo cumplen el Principio III.

**Reverificación post-diseño del incremento actual**: APROBADA. Marketing reutiliza el panel y sus reglas de cálculo en lugar de duplicarlas, traslada su acceso a la barra lateral y mantiene `estado_comercial` como dato interno. Equipos, redes, chat, campañas y rendimiento se modelan con campos personalizados, `Documento` y reglas declarativas sobre la configuración existente; no se añaden dependencias, backend ni esquemas nuevos. La atribución opcional y el grupo «Sin campaña» evitan migraciones, el desempate por campaña más reciente previene acciones duplicadas y el consentimiento del chat reutiliza la versión del aviso ya registrada. Los artefactos de Phase 1 documentan contratos, estados y escenarios de validación suficientes para `/speckit.tasks`.

**Reverificación post-diseño del incremento de autenticación**: APROBADA. La identidad y la matriz viven en módulos separados por responsabilidad sin dependencias nuevas; `src/auth/permissions.js` es la única fuente de permisos y `src/storage.js` la consume antes de mutar, de modo que ocultar botones no sea la única barrera. La sesión guarda solo `userId` y marcas de tiempo, resolviendo el rango desde `erp_users` para cumplir la revocación y el cambio de rango inmediato. El hash con `PBKDF2-SHA-256` y sal por usuario evita contraseñas en texto plano dentro de la limitación demostrativa sin backend; `Sistema` queda fuera de la matriz interactiva pero conserva la auditación de campañas. Los contratos y el modelo de datos documentan estados, mensajes exactos y escenarios verificables para `/speckit.tasks`.

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
├── auth.js           (sesión, hash de contraseñas, bloqueo, expiración y usuarios locales)
├── storage.js
├── app.js
├── module-config.js
├── auth/
│   └── permissions.js (matriz de rangos → acciones y `can`/`assertPermission`)
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
│   ├── marketing-chat.js (FAQ, respuestas rápidas y consultas de seguimiento)
│   ├── sales-team-metrics.js (real mensual y objetivo mensual derivados)
│   ├── marketing-campaigns.js (campañas, atribución, acciones y solapamientos)
│   └── marketing-performance.js (indicadores globales y por campaña)
└── components/
    ├── shell.js        (marco del espacio de trabajo: barra superior, logotipo SVG, barra lateral, estado de módulo activo)
    ├── dashboard.js    (vista de inicio: acciones rápidas + tarjetas de estadísticas en vivo)
    ├── entity-form.js  (formulario de creación/edición de entidades con campos personalizados)
    ├── document-form.js (formulario de creación/edición de documentos con campos personalizados y ciclo de vida de estados)
    ├── entity-detail.js (ficha de entidad: datos de la entidad + sus documentos asociados ordenados por fecha; Historia de Usuario 3)
    ├── commercial-summary.js (resumen de indicadores: totales de entidades/documentos y documentos pendientes por entidad; Historia de Usuario 6)
    ├── marketing.js    (vista de Marketing: datos del panel, accesos a redes, chat, campañas, equipo y rendimiento; Historias de Usuario 16-21)
    ├── capture-form.js (formulario público autónomo con consentimiento, chat y creación de prospecto)
    ├── marketing-social.js (registro y consulta de interacciones en redes)
    ├── marketing-chat.js   (preguntas frecuentes, respuestas rápidas y consultas de seguimiento)
    ├── login.js            (pantalla de inicio de sesión sin marco ERP; rutas públicas de captura y chat)
    └── users-admin.js      (alta, edición, desactivación y asignación de rango solo para Nivel 4)

tests/
├── unit/          (incluye entity-date, validación de rango y marketing-stats)
├── integration/   (incluye etiqueta, min/max, cambio de día, marketing y captura pública)
└── setup/
```

**Decisión de Estructura**: Una aplicación Vite con un único punto de entrada HTML, módulos JavaScript separados por responsabilidad y CSS en un archivo. Se usará localStorage para la persistencia de modo que la aplicación funcione sin backend y sin dependencias de ejecución añadidas. Los componentes se dividen en pares de entidad (datos maestros) y documento (transaccional) que reflejan los dos conceptos centrales del módulo base, de modo que un módulo personalizado pueda renombrar o extender cada par de forma independiente. `shell.js` posee el marco del espacio de trabajo ERP — un logotipo monograma SVG en línea derivado del nombre del módulo, la barra superior y la barra lateral de módulos — envolviendo todas las vistas para que la marca y la navegación se rendericen desde una sola definición compartida. `dashboard.js` renderiza los botones de acción rápida y las tarjetas de estadísticas de la pantalla de entrada, leyendo los recuentos del almacenamiento cada vez que se vuelve visible. `entity-detail.js` renderiza la ficha de una entidad seleccionada (desde búsqueda o resumen) junto con su historial de documentos ordenado por fecha, reflejando los cambios hechos en la pantalla de gestión. `commercial-summary.js` agrega en memoria los recuentos de entidades, documentos y documentos pendientes (según el `statusLifecycle` configurado) y permite seleccionar una entidad para abrir su ficha de detalle; ambos son comportamiento genérico del módulo base, no exclusivo de un perfil CRM. `module-config.js` centraliza todos los puntos de adaptación — nombre del módulo, etiquetas de términos, definiciones de campos personalizados, ciclo de vida de estados, regla opcional `entityDate` y color de acento — manteniendo la personalización del dominio fuera del código central; el estilo se controla mediante propiedades personalizadas de CSS (tokens de diseño) en `styles.css` para que el color de acento configurado se aplique globalmente. `utils/entity-date.js` resuelve la regla activa a `{ label, min, max }`, calcula `localToday` con getters locales y programa el siguiente cambio de día; los componentes solo consumen ese resultado y `storage.js` aplica el mismo rango al validar escrituras, de modo que la interfaz y la persistencia no puedan divergir.

**Decisión adicional (sesión 2026-11-23, segunda tanda)**: Las reglas del perfil de clientes se expresan con mecanismos genéricos del módulo base, no con código específico de cliente. `fieldRules` gana visibilidad, generación, unicidad, obligatoriedad, formato, condición (`when`) y pertenencia a grupo (`group`); `detailPolicy.entity.blockWhenInvalid` bloquea la ficha de registros no completos; `entityDate.required` hace obligatoria la fecha sin afectar otros perfiles. Los componentes de formulario, lista, ficha, buscador y selectores consultan esas reglas, y `src/utils/field-formats.js` centraliza los formatos sin dependencias nuevas. El perfil CRM deja de declarar `pedidos` y añade los campos de contacto por canal.

**Decisión adicional (sesión 2026-11-23, tercera tanda)**: La presentación también se declara en la configuración. Un `order` numérico opcional ordena las casillas del formulario sin acoplar el componente al perfil CRM; `placeholder` proporciona pistas grises por campo y las opciones `select` aceptan `{ value, label }` para mostrar «Llamada» y seguir guardando `llamada`. El título «Nuevo Cliente» se deriva del término configurado sin género gramatical fijo. `rubro` conserva su clave y pasa a `select` con las diez opciones definidas; `rut` reutiliza `normalizeClRut` para formato y unicidad. Ninguna de estas decisiones introduce almacenamiento nuevo ni cambia las condiciones `when` existentes.

**Decisión adicional (cuarta tanda)**: Marketing se implementa como una vista más despachada por `renderCurrentView()` en `app.js`, con dos componentes nuevos (`marketing.js` y `capture-form.js`) y una utilidad pura de agregación. El campo `estado_comercial` se declara en `customFields.entity` y `fieldRules.entity`, y las reglas de automatización en un bloque `marketing` opcional validado por `validateConfig`; sin ese bloque el comportamiento base no cambia. Clientes e Interacciones salen de `NAV_ITEMS`, el panel gana una acción rápida para gestión de documentos y Marketing pasa a ser una entrada de la barra lateral. Ninguna de estas decisiones añade dependencias ni modifica la forma persistida de entidades y documentos.

**Decisión adicional (séptima tanda)**: Marketing reutiliza `computeDashboardStats()`/`marketing-stats.js` para mostrar las mismas tarjetas y el mismo embudo del panel, sin duplicar fórmulas. Equipos, redes, chat y campañas se añaden como vistas y utilidades dentro del mismo bloque `marketing` de configuración: `salesTeams`, `faq` y `campaigns`; el rendimiento se calcula a partir de los registros existentes. El campo opcional `campaña` se declara como personalizado de entidad y documento; los documentos de redes, chat, seguimiento y ejecución ya son `Documento`, por lo que no hay esquema nuevo. `runAutomationRules()` incorpora `campaignId`, acciones internas y desempate por fecha de creación, manteniendo un único historial por entidad.

**Decisión adicional (octava tanda)**: La autenticación se separa en `src/auth.js` y `src/auth/permissions.js` para que la identidad, la sesión y la matriz no queden repartidas entre componentes. `src/auth.js` usa `localStorage` con `erp_users` y `erp_session`, guarda contraseñas como hash PBKDF2 con sal por usuario, bloquea temporalmente tras fallos repetidos y controla la expiración por inactividad. `src/auth/permissions.js` define la tabla rango → acción y expone `can()`/`assertPermission()`; `app.js`, `shell.js`, `dashboard.js` y `storage.js` consultan esa única tabla, por lo que ocultar controles nunca es la única protección. `src/components/login.js` y `src/components/users-admin.js` son las dos vistas nuevas: la primera sin marco ERP y la segunda accesible solo desde el menú del usuario del Gerente, sin entrada en la barra lateral. Los usuarios semilla permiten verificar de inmediato los cuatro rangos y el visitante.

## Seguimiento de Complejidad

Este plan no introdujo violaciones de la constitución. La sesión 2026-11-23 tampoco añade dependencias: reutiliza `Date` nativo, el sistema de configuración existente, la lógica de RUT ya presente en la semilla y el mismo patrón de pruebas Vitest/jsdom. Las contrapartidas registradas son un temporizador de baja frecuencia (una vez al día) para mantener el límite visible actualizado, y una capa declarativa adicional (`fieldRules`/`detailPolicy`) que se resuelve en un único punto y no modifica el comportamiento de los módulos que no la declaran. El bloqueo de ficha reutiliza el validador de guardado, por lo que no añade una segunda fuente de verdad. La tercera tanda tampoco añade dependencias: `order`, `placeholder` y `options` con valor y etiqueta se resuelven en el mismo punto de configuración, las pistas son texto de ejemplo sin persistencia, y la aceptación de dos formatos de RUT aprovecha el normalizador ya existente en `field-formats.js`.

La cuarta tanda mantiene la huella de dependencias en cero: las agregaciones se calculan en una sola pasada sobre los registros ya cargados en memoria; la captura pública reutiliza el mismo `localStorage` y no requiere backend (contrapartida: el `iframe` debe ser del mismo origen); y las reglas de automatización se ejecutan en un único punto de la capa de almacenamiento, registrando cada acción como un `Documento` para no introducir un segundo historial. La retirada de dos entradas de `NAV_ITEMS` exige actualizar las pruebas de integración que navegaban por sus selectores, compensadas con acciones rápidas y con la API `app.navigate()`.

La séptima tanda no añade dependencias: reutiliza el panel como fuente de datos, `Documento` como historial de interacciones y ejecuciones, y reglas declarativas para campañas y respuestas rápidas. La contrapartida principal es que las campañas y el chat siguen siendo locales al navegador y no envían mensajes externos, decisión ya registrada en la especificación. El desempate entre campañas solapadas añade una regla determinista para evitar acciones duplicadas sin crear un motor de reglas nuevo.

La octava tanda tampoco añade dependencias: usa Web Crypto API para el hash y `localStorage` para la identidad simulada. La contrapartida registrada es que un hash local con sal y un bloqueo temporal no sustituyen la autenticación de servidor requerida para producción; por eso la sesión guarda solo `userId`, resuelve el rango en cada verificación y documenta la limitación en `research.md` y `contracts/auth.md`. La expiración por inactividad y el bloqueo se implementan como medidas demostrativas para que el flujo sea verificable sin backend. La denegación de permisos se verifica en UI, enlaces profundos y llamadas a la API de `storage.js` con sesión íntegra, incluidas las realizadas desde consola; no se promete resistencia a edición deliberada de `localStorage`/`erp_session` ni a falsificación de identidad/rango. `createdByUserId` y `assignedUserIdAtSale` conservan atribución histórica aunque el usuario cambie de rango o sea desactivado.

## Revisión de la Lista de Verificación Pendiente

Los cuatro elementos marcados como pendientes en `checklists/requirements.md` se revisaron el 2026-11-24: «Sin detalles de implementación», «Escrita para partes interesadas no técnicas», «Los criterios de éxito son agnósticos a la tecnología» y «No hay filtración de detalles de implementación». Se aceptaron por instrucción del usuario porque las referencias técnicas (`storage.js`, `localStorage`, `select`, `permissions:edit`) y la estructura de archivos concreta se solicitaron explícitamente, y SC-003 es una prueba de usabilidad no automatizable. Esta decisión no bloquea la implementación: los detalles se concentran en `plan.md` y en los contratos de Phase 1, mientras que la especificación conserva los escenarios de usuario y los criterios medibles como fuente funcional.
