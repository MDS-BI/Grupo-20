# Especificación de la Funcionalidad: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

**Rama de la funcionalidad**: 001-erp-base-module  
**Creada**: 2026-07-08  
**Estado**: Borrador  
**Entrada**: Descripción del usuario: "Construir un módulo base de software de planificación de recursos empresariales (ERP) que pueda extenderse en módulos ERP personalizados. Debe proporcionar gestión de datos maestros (entidades) y documentos transaccionales vinculados con capacidades de crear/editar/eliminar/buscar."

## Propósito

Este proyecto sirve como módulo base reutilizable para construir módulos ERP personalizados. Establece los patrones comunes que todo módulo ERP necesita: gestionar registros de datos maestros (**Entidades**) y sus **Documentos** transaccionales asociados, con navegación, validación, persistencia y búsqueda ya implementadas, de modo que los módulos personalizados solo necesiten definir sus campos y reglas específicos del dominio.

## Clarifications

### Session 2026-11-01

- Q: ¿Debe ser único el código de negocio (`code`) de cada entidad, o se permiten códigos duplicados? → A: Único obligatorio (comparación sin distinguir mayúsculas ni espacios).
- Q: Cuando no se configura un ciclo de vida, ¿el estado del documento debe ser texto libre o debe ofrecerse una lista fija de estados? → A: Texto libre (sin lista de valores predefinidos).
- Q: Cuando la configuración del módulo es inválida o conflictiva, ¿la aplicación debe impedir el uso o debe arrancar con los valores predeterminados mostrando una advertencia? → A: Arrancar con valores predeterminados y mostrar una advertencia visible.
- Q: Cuando la configuración deja de declarar un campo personalizado que ya tenía valores guardados, ¿qué debe hacer el sistema con esos valores? → A: Conservar los valores en el almacenamiento y ocultarlos de la interfaz.
- Q: ¿Debe pedirse confirmación explícita antes de eliminar una entidad, indicando que también se eliminarán sus documentos asociados? → A: Confirmación obligatoria que indique cuántos documentos se eliminarán.

### Session 2026-11-12

- Q: ¿Cómo se identifica un documento "pendiente" en el resumen cuando no hay ciclo de vida configurado (estado de texto libre)? → A: Se compara el estado normalizado (minúsculas y recortado) con "pendiente"; si no hay coincidencias, el indicador es cero. Con ciclo de vida configurado, se usan los estados de ese ciclo que representen "pendiente".
- Q: ¿Qué campos base tiene un Documento frente a los campos personalizados del módulo? → A: Los campos base son `id`, `entity_id`, `startDate`/`endDate` opcionales, `notes` opcional, `status` y marcas de tiempo; serie/folio, importes, moneda, condiciones y tipo de interacción son campos personalizados declarados por la configuración.

### Session 2026-11-16

- Q: ¿Cómo debe identificar el sistema qué documentos cuentan como "pendientes" en el resumen de indicadores? (FR-044) → A: Si hay ciclo de vida, la configuración marca explícitamente uno o más estados como "pendientes"; si no hay ciclo de vida (texto libre), se cuentan los documentos cuyo estado normalizado coincide con `pendiente`.
- Q: ¿Qué debe hacer el sistema si el usuario intenta cambiar de pantalla o módulo mientras hay cambios sin guardar en un formulario? (FR-022) → A: Mostrar confirmación para salir y descartar cambios o quedarse; solo navegar si el usuario confirma descartar.

### Session 2026-11-23

- Q: ¿El rango de fechas desde 1910 hasta hoy debe aplicarse únicamente a la fecha objetivo de los clientes o a la fecha objetivo de todas las entidades del módulo? → A: Únicamente al perfil de clientes (entidades etiquetadas como "Cliente"); los demás perfiles conservan la fecha objetivo sin este rango.
- Q: ¿Cómo debe denominarse el campo de fecha en el perfil de clientes? → A: "Fecha de nacimiento" en lugar de "Fecha objetivo".
- Q: ¿La fecha actual usada como límite debe recalcularse solo al abrir la página o debe actualizarse automáticamente mientras la página permanece abierta cuando cambia el día? → A: Actualizarse automáticamente mientras la página permanece abierta al cambiar de día, sin requerir recarga.
- Q: ¿Qué zona horaria debe usarse para determinar la "fecha actual" cuando cambia el día? → A: Hora local del dispositivo del usuario.
- Q: ¿Qué debe hacer el sistema con las fechas de nacimiento ya guardadas en clientes que queden fuera del nuevo rango o sean inválidas? → A: Conservarlas y mostrarlas sin borrarlas, pero exigir su corrección al editar el cliente antes de guardar.
- Q: ¿La etiqueta "Fecha de nacimiento" debe reemplazar a "Fecha objetivo" solo en el formulario de clientes o en todos los lugares visibles del perfil de clientes, como listas, ficha, búsqueda y filtros? → A: En todos los lugares visibles del perfil de clientes.
- Q: ¿En qué lugares visibles del perfil de clientes deben dejar de aparecer los campos «Código», «Categoría», «Descripción» y «Nº de pedidos»? → A: En todos los lugares visibles del perfil de clientes: formulario de registro/edición, lista de resultados, ficha y búsqueda/filtros.
- Q: ¿Qué identificador y regla de unicidad debe usar el sistema para los clientes ahora que el campo «Código» dejará de mostrarse? → A: El sistema genera un código oculto y único por cliente; se mantiene la validación de unicidad sin que el usuario lo capture ni lo vea.
- Q: ¿Qué debe hacerse con el campo «Nº de pedidos» en el perfil de clientes: eliminarlo o reemplazarlo por un indicador calculado? → A: Eliminarlo de la configuración del perfil de clientes; el sistema deja de registrarlo y de mostrarlo.
- Q: ¿Qué debe hacer el sistema con los valores de «Categoría», «Descripción» y «Nº de pedidos» ya guardados en clientes existentes? → A: Conservar los valores en el almacenamiento sin borrarlos y ocultarlos de todas las vistas del cliente.
- Q: ¿Debe la búsqueda de clientes seguir encontrando registros por los valores ocultos de código, categoría o descripción? → A: No se busca por categoría ni descripción; el código único generado queda guardado en cada registro, sin mostrarse en la interfaz ni usarse en la búsqueda.
- Q: ¿Qué validación debe aplicarse al campo «RUT» de los clientes además de exigir que no esté vacío? → A: Formato chileno con dígito verificador válido y único entre todos los clientes.
- Q: ¿Qué debe hacer el sistema con los clientes ya guardados que no tienen «Fecha de nacimiento», «Canal de Contacto» o «RUT», o que tienen un RUT inválido? → A: Bloquear la consulta de su ficha; permitir la edición normal solo para completar los campos faltantes y desbloquearlos al guardarlos válidamente.
- Q: ¿Debe el campo «Canal de Contacto» tener una opción preseleccionada o el usuario debe elegirla explícitamente? → A: Sin preselección; el usuario debe elegir explícitamente una opción y el guardado falla si queda vacío.
- Q: ¿Cómo debe organizarse la casilla adicional que aparece según el canal de contacto elegido? → A: Campos separados por canal: «Teléfono» para llamada, «Correo electrónico» para correo, «Lugar/Enlace de reunión» para reunión y «WhatsApp» para WhatsApp; se guarda solo el del canal elegido.
- Q: ¿Debe ser obligatoria la casilla adicional de contacto y validarse según el canal elegido? → A: Obligatoria y validada según el canal: formato telefónico para llamada y WhatsApp, formato de correo para correo y valor no vacío para reunión.
- Q: ¿Qué formato exacto debe aceptarse en el campo «RUT» del perfil de clientes al guardar un registro? → A: Ambos formatos (`12345678-9` y `12.345.678-9`), normalizados antes de validar.
- Q: ¿Debe compararse el RUT normalizado al verificar que no esté repetido entre clientes? → A: Sí: comparar siempre el RUT normalizado (sin puntos).
- Q: ¿Qué texto de ejemplo en color gris debe mostrarse como pista en la casilla «RUT» del formulario de clientes? → A: `Ej: 11.111.111-1`, en letra gris como pista.
- Q: ¿Qué etiquetas exactas deben mostrarse en la lista desplegable de «Canal de Contacto»? → A: «Llamada», «Correo», «Reunión» y «WhatsApp» (mayúscula inicial).
- Q: ¿En qué lugares del perfil de clientes debe reemplazarse el título «Nueva cliente» por «Nuevo Cliente»? → A: El título del formulario y el botón o acción rápida de creación de clientes.
- Q: ¿Debe representarse un prospecto como un registro independiente o como una entidad en estado inicial dentro del modelo de entidades actual? → A: Un prospecto es una Entidad con estado inicial «Prospecto» que se convierte en Cliente al avanzar de etapa.
- Q: ¿Cuál debe ser el mecanismo principal de captación de prospectos desde las visitas? → A: Formulario web público embebible que crea el prospecto automáticamente.
- Q: ¿Qué debe desencadenar las acciones automáticas sobre un prospecto en el apartado de Marketing? → A: Reglas configurables por evento (captura, cambio de etapa o interacción) que ejecutan una acción sobre el prospecto.
- Q: ¿Qué requisito de consentimiento debe exigirse al capturar datos personales de un prospecto mediante el formulario web? → A: Consentimiento explícito obligatorio con registro de la fecha y la versión del aviso aceptado.
- Q: ¿Cómo debe medirse la conversión de visitas en clientes en el apartado de Marketing? → A: Embudo por etapas con conteo por etapa y tasa de conversión entre etapas, derivado del estado de la Entidad.
- Q: ¿Qué datos concretos del panel principal deben sustituir a los actuales «Prospecto», «En proceso», «En recontacto», «Perdidos» y «Sin resultados definitivos» en Marketing? → A: Las cinco tarjetas del panel y su embudo por estados de documento, con los mismos cálculos sobre las mismas entidades y documentos.
- Q: Al sustituir las etapas comerciales por los datos del panel, ¿qué debe ocurrir con la torta «Estado comercial de la cartera» y con la lista de prospectos que permite cambiar entre «Prospecto», «En proceso» y «En recontacto»? → A: Eliminar la torta y el selector de etapas; mostrar en su lugar el embudo y la lista de «Últimas Interacciones / Próximos Seguimientos» del panel.
- Q: Ahora que Marketing ya no muestra ni permite cambiar etapas, ¿qué debe pasar con el campo «Estado comercial» y con las reglas automáticas que se activan al cambiar de etapa? → A: Conservar el campo y las reglas de forma interna, sin mostrarlos en Marketing; la captura sigue creando prospectos en «Prospecto» y la conversión puede ocurrir por otros flujos.
- Q: Al pasar «Abrir Marketing» a la barra lateral, ¿debe desaparecer ese botón del panel principal y con qué etiqueta debe figurar en la barra lateral? → A: Eliminar el botón del panel; la barra lateral incluye «Marketing» como cuarta opción junto a Panel, Buscar y Resumen y la resalta al estar activa.
- Q: ¿Cómo debe funcionar el nuevo acceso «Equipos de ventas y logros» dentro de Marketing: con equipos e integrantes capturados por el usuario o con datos calculados de los registros existentes? → A: Una lista editable de varios equipos; cada integrante tiene nombre, cargo y estado «Activo/Inactivo» capturados por el usuario, mientras que el objetivo mensual y el real mensual los actualiza el sistema según las ventas realizadas por el ejecutivo, sin captura manual.
- Q: ¿Qué registros deben contar como «ventas» de un ejecutivo para calcular el real mensual del integrante? → A: Documentos en estado «Cerrado ganado» de clientes con ese Ejecutivo Asignado, sumando sus importes del mes actual.
- Q: ¿Cómo debe calcular el sistema el objetivo mensual de un integrante a partir de las ventas del ejecutivo? → A: Proyección del mes: ventas acumuladas ÷ días transcurridos × días del mes; sin ventas o sin días transcurridos, cero.
- Q: ¿Cómo debe realizar Marketing el seguimiento de interacciones en Twitter, Instagram, YouTube y otras redes sociales? → A: Registro manual dentro de Marketing: plataforma, fecha, tipo de interacción, nota y enlace, vinculado al prospecto o cliente.
- Q: ¿Dónde deben guardarse las interacciones de redes sociales y los mensajes de «Dudas y consultas» para que queden relacionados con el prospecto o cliente? → A: Como Documentos vinculados a la entidad, con campos personalizados para plataforma o canal y tipo de interacción.
- Q: ¿Cómo deben generarse las respuestas rápidas del apartado «Dudas y consultas» en el sitio web? → A: Respuestas automáticas desde preguntas frecuentes configuradas; sin coincidencia, la consulta se registra como Documento para seguimiento.
- Q: ¿Dónde debe estar disponible el apartado «Dudas y consultas» para que los clientes potenciales puedan consultar y el equipo pueda dar seguimiento? → A: En el formulario público de captura del sitio web y en el apartado de Marketing para seguimiento.
- Q: ¿Debe exigirse consentimiento explícito antes de registrar mensajes de «Dudas y consultas» o interacciones de redes sociales que contengan datos personales? → A: Sí: consentimiento explícito antes del primer mensaje de «Dudas y consultas», con fecha y versión del aviso; las interacciones de redes usan el consentimiento del prospecto.
- Q: ¿Qué alcance debe tener la automatización de campañas de Marketing que deseas recomendada e integrada en la especificación? → A: Reglas internas por evento y campañas programadas por etapa, sin servicios externos.
- Q: ¿Qué indicadores debe mostrar el seguimiento del rendimiento de Marketing para evaluar las campañas? → A: Prospectos, conversión por etapa, interacciones, consultas respondidas y ventas ganadas.
- Q: ¿Cómo debe vincularse un prospecto, una interacción o una venta a una campaña para que el rendimiento pueda filtrarse por campaña? → A: Campo «Campaña» opcional en prospecto, interacciones y documentos; sin selección, «Sin campaña».
- Q: ¿Qué acciones internas debe poder ejecutar una campaña sobre el prospecto cuando ocurre un evento? → A: Crear documento de seguimiento, asignar ejecutivo y actualizar estado comercial interno.
- Q: ¿Cómo debe resolverse cuando dos campañas activas aplican al mismo prospecto y al mismo evento? → A: Ejecutar la campaña más reciente y registrar la otra como omitida por solapamiento.

### Session 2026-11-24

- Q: ¿La matriz de permisos debe poder editarse desde la interfaz de la aplicación? (FR-094) → A: No; la matriz se edita solo en su definición y ningún usuario la cambia desde una pantalla.
- Q: ¿Debe conservarse la sesión iniciada al recargar la página o al reabrir el navegador? (US22) → A: Sí; persiste localmente hasta «Cerrar sesión», incluso al cerrar y reabrir el navegador.
- Q: ¿Qué ocurre con la sesión de un usuario desactivado por el Gerente mientras tenía sesión iniciada? (FR-098, FR-102) → A: Se cierra de inmediato: en la siguiente acción o recarga se redirige a inicio de sesión.
- Q: ¿Debe reflejarse de inmediato en la sesión activa un cambio de rango hecho por el Gerente? (FR-098, FR-102) → A: Sí; en la siguiente acción o recarga se aplica el nuevo rango y se actualiza la barra superior.
- Q: ¿Debe ser único el nombre de usuario al crear usuarios? (FR-098) → A: Sí; único sin distinguir mayúsculas ni espacios, y el guardado rechaza duplicados.
- Q: ¿Cuál debe ser la etiqueta definitiva del primer atajo de Marketing y debe reemplazar a la etiqueta actual en todo Marketing? → A: «Equipos de ventas y logros» en todas las vistas de Marketing.
- Q: ¿Qué debe ocurrir con los cinco atajos actuales del panel («Nuevo Cliente», «Nueva interacción», gestionar clientes, gestionar interacciones y buscar) dentro de Marketing? → A: Los cinco atajos solo aparecen en el panel principal.
- Q: ¿En qué lugares debe reemplazarse visiblemente «Chat» por «Dudas y consultas»? → A: Todas las etiquetas visibles del apartado «Dudas y consultas», en Marketing y en el formulario público; el apartado antes denominado «Chat» pasa a llamarse «Dudas y consultas», sin cambiar los identificadores internos `chat`.
- Q: ¿Deben ser exactamente esos cinco atajos de Marketing y aparecer en el orden «Equipos de ventas y logros», «Campañas», «Rendimiento de campañas», «Dudas y consultas» y «Redes sociales»? → A: Exactamente esos cinco, en ese orden.
- Q: ¿Qué usuarios y contraseñas debe aceptar el inicio de sesión? (US22) → A: Solo `gerente` (n4, Gerente Comercial), `marketing` (n3, Ejecutivo de Marketing), `ventas` (n2, Ejecutivo de Ventas) y `atencion` (n1, Atencion al Cliente); el usuario no distingue mayúsculas ni espacios y cualquier contraseña sirve, salvo la vacía, que muestra «Ingresa una contraseña».
- Q: ¿Qué debe ocurrir con la verificación de contraseña y el bloqueo por intentos fallidos? (US22) → A: No aplican en el modo demostración: se eliminan; un usuario desconocido muestra «Usuario no encontrado» y el resto de la sesión y los permisos permanecen igual.

## Escenarios de Usuario y Pruebas _(obligatorio)_

### Historia de Usuario 1 - Definir datos compatibles con el ERP (Prioridad: P1)

Como analista de sistemas ERP, quiero definir un modelo de datos con identificadores y campos comunes para facilitar futuras integraciones del CRM.

**Por qué esta prioridad**: Se registra en esta prioridad dado que establece cómo se organizarán y relacionarán los clientes, las interacciones y los seguimientos. Las demás funciones necesitan esa base para guardar y consultar la información correctamente.

**Prueba Independiente**: un analista registra un cliente de prueba y le asocia una interacción; el sistema guarda la relación y asigna un código interno único a cada cliente sin solicitarlo al usuario.

**Escenarios de Aceptación**:

1. **Dado** que el cliente tiene los datos obligatorios, **cuando** se registra, **entonces** se guarda con un identificador único.
2. **Dado** que existe un cliente registrado, **cuando** se registra otro cliente, **entonces** el sistema le asigna un código interno único y distinto sin pedirlo al usuario (FR-052).
3. **Dado** que existe un cliente, **cuando** se registra una interacción o un seguimiento asociado a él, **entonces** queda vinculado al cliente correcto.
4. **Dado** que un identificador no corresponde a ningún cliente, **cuando** se intenta asociarle una interacción o un seguimiento, **entonces** se rechaza con un mensaje claro.
5. **Dado** que están documentados los campos comunes del ERP, **cuando** el analista revisa el modelo del CRM, **entonces** los nombres, tipos de datos e identificadores coinciden con lo acordado.

---

### Historia de Usuario 2 - Registrar clientes y contactos comerciales (Prioridad: P2)

Como ejecutivo de ventas, quiero registrar clientes y sus interacciones para organizar la información comercial y dejar constancia de cada contacto.

**Por qué esta prioridad**: Se encuentra en este nivel de prioridad dado que permite ingresar la información principal del CRM, una vez definida la estructura de datos en la Historia de Usuario 1. Sin los registros no sería posible consultar antecedentes ni gestionar seguimientos.

**Prueba Independiente**: Un ejecutivo registra un cliente y una llamada asociada a él; comprueba que el registro queda guardado y es localizable (mediante búsqueda, selectores o su ficha) sin requerir una lista de entidades en la pantalla de gestión, y que la llamada queda guardada en su ficha.

**Escenarios de Aceptación**:

1. **Dado** que el ejecutivo completa los datos obligatorios del cliente, **cuando** los guarda, **entonces** el registro se guarda y queda disponible para búsqueda, selección y consulta en su ficha (la pantalla de gestión no muestra una lista de entidades, FR-016).
2. **Dado** que existe un cliente, **cuando** registra una llamada con fecha y descripción, **entonces** queda guardada en la ficha de ese cliente.
3. **Dado** que faltan datos obligatorios del cliente, **cuando** se intenta guardar, **entonces** el sistema rechaza el registro con `Completa los campos obligatorios.`.
4. **Dado** el perfil de clientes, **cuando** se muestra el formulario de registro, **entonces** no se muestran los campos «Código», «Categoría», «Descripción» ni «Nº de pedidos» (FR-051).
5. **Dado** el perfil de clientes, **cuando** se guarda un cliente, **entonces** el sistema genera automáticamente su código interno único sin solicitarlo ni mostrarlo (FR-052).
6. **Dado** el perfil de clientes, **cuando** se carga la configuración, **entonces** no incluye el campo personalizado «Nº de pedidos» y el sistema no lo registra (FR-053).
7. **Dado** el perfil de clientes, **cuando** se intenta guardar un cliente sin «Fecha de nacimiento», «Canal de Contacto» o «RUT», **entonces** el sistema rechaza el guardado con `Completa los campos obligatorios.` (FR-056).
8. **Dado** el perfil de clientes, **cuando** se introduce un RUT con dígito verificador inválido o ya usado por otro cliente, **entonces** el sistema rechaza el guardado con `El RUT es inválido.` o `El RUT ya está registrado.` según corresponda (FR-057).
9. **Dado** el formulario de registro de un cliente, **cuando** se abre, **entonces** «Canal de Contacto» aparece sin opción preseleccionada y el guardado se rechaza hasta que el usuario elija una (FR-059).
10. **Dado** un cliente con un canal de contacto elegido, **cuando** se muestra el formulario, **entonces** aparece solo la casilla adicional correspondiente a ese canal y, al guardar, no se conservan los valores de los otros canales (FR-060).
11. **Dado** el perfil de clientes, **cuando** se deja vacía la casilla adicional de contacto o se introduce un valor con formato inválido para el canal elegido, **entonces** el sistema rechaza el guardado con `Revisa el dato de contacto según el canal elegido.` (FR-061).
12. **Dado** el formulario de registro de un cliente, **cuando** se muestra la casilla «RUT», **entonces** aparece en color gris la pista `Ej: 11.111.111-1` sin contarse como valor capturado (FR-062).
13. **Dado** el formulario de registro de un cliente, **cuando** se despliega «Canal de Contacto», **entonces** se muestran las opciones «Llamada», «Correo», «Reunión» y «WhatsApp» con la primera letra en mayúscula (FR-063).
14. **Dado** el perfil de clientes, **cuando** se abre el formulario de registro o la acción rápida de creación, **entonces** el título y la acción muestran «Nuevo Cliente» (FR-064).
15. **Dado** el formulario de registro o edición de un cliente, **cuando** se muestran las casillas, **entonces** aparecen en el orden «Nombre de Cliente», «RUT», «Fecha de nacimiento», «Canal de Contacto» con su casilla adicional, «Tipo de actividad» y «Ejecutivo Asignado», siendo este último un `select` con los usuarios activos de rango Ejecutivo de Ventas o Gerente Comercial (FR-065, FR-099).
16. **Dado** el perfil de clientes, **cuando** se despliega «Tipo de actividad», **entonces** se muestran únicamente las opciones «Dependiente», «Independiente Formal», «Independiente Informal», «Jubilado», «Dueño/a de casa», «Estudiante», «FFAA», «Rentista», «Jubilado - FFAA» y «Cesante» (FR-066).
17. **Dado** un canal de contacto elegido en el formulario de un cliente, **cuando** se muestra su casilla adicional, **entonces** aparece en color gris la pista «Ej: +56 9 1234 5678» para «Llamada» y «WhatsApp», «Ej: nombre@ejemplo.cl» para «Correo» o «Ej: Sala 2 o enlace» para «Reunión», sin contarse como valor capturado (FR-067).

---

### Historia de Usuario 3 - Consultar antecedentes del cliente (Prioridad: P1)

Como ejecutivo de atención al cliente, quiero buscar clientes y consultar su ficha e historial para brindar una atención informada y continua.

**Por qué esta prioridad**: Permite al ejecutivo de atención al cliente acceder de forma centralizada a la información del cliente, garantizando una atención oportuna, trazable e informada con base en los registros comerciales existentes.

**Prueba Independiente**: Un ejecutivo de atención al cliente busca un cliente registrado, accede a su ficha y revisa su historial de interacciones y documentos asociados, verificando que la información corresponde a los registros creados en la Historia de Usuario 2 y refleja las actualizaciones realizadas en la Historia de Usuario 4.

**Escenarios de Aceptación**:

1. **Dado** que existen clientes registrados conforme a la Historia de Usuario 2, **cuando** el ejecutivo de atención al cliente busca por nombre o palabra clave visible, **entonces** el sistema muestra únicamente los clientes coincidentes, sin usar categoría, descripción ni código (FR-055).
2. **Dado** que el ejecutivo selecciona un cliente de los resultados de búsqueda, **cuando** accede a su ficha, **entonces** se muestra la información del cliente junto a su historial de interacciones y documentos asociados.
3. **Dado** que esta vista consulta los registros de la Historia de Usuario 2, **cuando** se carga la ficha o el historial, **entonces** el sistema debe obtener la información desde dichos registros, manteniendo la consistencia con lo ingresado por el ejecutivo de ventas.
4. **Dado** que se han realizado actualizaciones a la ficha del cliente o a sus documentos desde la pantalla de gestión (Historia de Usuario 4), **cuando** el ejecutivo de atención al cliente consulta nuevamente dicha ficha e historial, **entonces** la vista refleja dichas actualizaciones.
5. **Dada** una búsqueda sin coincidencias, **cuando** el ejecutivo envía la búsqueda, **entonces** el sistema muestra exactamente `No se encontraron resultados.` y permite volver a intentarlo.
6. **Dado** que el ejecutivo necesita dar una atención informada y continua, **cuando** consulta la ficha del cliente, **entonces** el historial se presenta de forma ordenada (por fecha) para facilitar la revisión de los antecedentes del cliente.
7. **Dado** un cliente guardado sin «Fecha de nacimiento», «Canal de Contacto» o «RUT», o con RUT inválido, **cuando** se intenta abrir su ficha, **entonces** la consulta se bloquea con una explicación de los campos pendientes y se ofrece editarlo para completarlos (FR-058).

---

### Historia de Usuario 4 - Gestionar entidades y documentos en una pantalla dedicada (Prioridad: P1)

Como usuario de negocio, quiero una pantalla dedicada donde pueda añadir, editar y eliminar entidades y sus documentos, para poder gestionar los datos del módulo en un lugar enfocado.

**Por qué esta prioridad**: Esto preserva el valor central de las capacidades de gestión del módulo, presentado como una única pantalla de gestión accesible únicamente desde las acciones rápidas del panel.

**Prueba Independiente**: Un usuario puede navegar a la pantalla de gestión mediante una acción rápida del panel, alternar entre la gestión de entidades y documentos, y volver al panel, añadiendo, editando y eliminando con éxito una entidad y un documento.

**Escenarios de Aceptación**:

1. **Dado** el panel principal, **cuando** el usuario mira la navegación, **entonces** ofrece accesos a la gestión de entidades y documentos y la barra lateral NO ofrece botones para esos apartados.
2. **Dado** el panel principal, **cuando** el usuario activa el acceso a entidades, **entonces** se muestra el contenido de gestión de entidades.
3. **Dado** el panel principal, **cuando** el usuario activa el acceso a documentos, **entonces** se muestra el contenido de gestión de documentos.
4. **Dado** que el usuario está en la pantalla de gestión, **cuando** mira la pantalla, **entonces** la lista de entidades no se muestra.
5. **Dado** que el usuario está en la pantalla de gestión, **cuando** crea una nueva entidad, **entonces** la entidad se guarda.
6. **Dada** una entidad existente, **cuando** el usuario edita sus detalles, **entonces** la información actualizada se guarda.
7. **Dada** una entidad que ya no es relevante, **cuando** el usuario la elimina, **entonces** se elimina junto con sus documentos.
8. **Dada** una entidad existente, **cuando** el usuario añade, edita o elimina un documento, **entonces** los cambios del documento se guardan y quedan asociados a esa entidad.
9. **Dado** que el usuario está en la pantalla de gestión, **cuando** activa el botón Panel en la barra lateral, **entonces** vuelve al panel de inicio.

---

### Historia de Usuario 5 - Definir un perfil de configuración del módulo (Prioridad: P1)

Como desarrollador de módulos, quiero declarar un único archivo de configuración que defina la identidad, terminología, campos personalizados y reglas de mi módulo, para adaptar el módulo base en un módulo específico sin modificar su código central.

**Por qué esta prioridad**: La adaptación mediante configuración es lo que convierte este proyecto de una aplicación fija en una base reutilizable. Sin ella, cada módulo personalizado requeriría editar archivos fuente centrales, lo que frustra el propósito de la plantilla; todas las historias de personalización posteriores dependen de que este mecanismo exista primero.

**Prueba Independiente**: Un desarrollador proporciona un archivo de configuración que define un perfil de Ventas (nombre del módulo, mapeos Entidad→Cliente, campos personalizados, ciclo de vida), y la aplicación se presenta plenamente como un módulo de Ventas; al quitar el archivo se restauran los valores predeterminados de la base sin errores.

**Escenarios de Aceptación**:

1. **Dado** que un archivo de configuración define el nombre del módulo, **cuando** la aplicación carga, **entonces** el panel de inicio y el marco del espacio de trabajo muestran el nombre configurado.
2. **Dada** una configuración completa (nombre, mapeos de términos, campos personalizados, ciclo de vida), **cuando** la aplicación carga, **entonces** el módulo se presenta plenamente bajo la identidad configurada sin que se vean términos del módulo base en ningún sitio.
3. **Dado** que no se proporciona configuración, **cuando** la aplicación carga, **entonces** la aplicación retrocede a los valores predeterminados integrados Entidad/Documento sin errores.
4. **Dada** una configuración con valores inválidos o conflictivos, **cuando** la aplicación carga, **entonces** el sistema informa del problema con claridad en lugar de fallar silenciosamente.

---

### Historia de Usuario 6 - Consultar indicadores de Gestión Comercial (Prioridad: P6)

Como Gerente Comercial, quiero visualizar un resumen de clientes, interacciones y seguimientos pendientes para identificar necesidades de atención y organizar el trabajo del equipo.

> Nota: Esta historia describe una vista de perfil (p. ej. CRM con etiquetas configuradas) sobre el comportamiento genérico del resumen de indicadores definido en FR-044 a FR-046 (entidades, documentos y documentos pendientes).

**Por qué esta prioridad**: Se ubica en este nivel porque entrega al Gerente Comercial una vista consolidada para priorizar la gestión del equipo, apoyándose en los clientes e historiales ya registrados en las Historias de Usuario 2 y 3. Sin esos registros, los indicadores no tendrían información que resumir.

**Prueba Independiente**: Un Gerente Comercial accede al resumen de Gestión Comercial y comprueba que el total de clientes, las interacciones registradas y los seguimientos pendientes coinciden con los datos de las fichas de los clientes; luego registra un nuevo seguimiento y verifica que el indicador correspondiente se actualiza.

**Escenarios de Aceptación**:

1. **Dado** que existen clientes e interacciones registrados en sus fichas (Historias de Usuario 2 y 3), **cuando** el Gerente Comercial abre el resumen de Gestión Comercial, **entonces** visualiza el total de clientes y el número de interacciones registradas.
2. **Dado** que existen seguimientos con estado pendiente asociados a los clientes, **cuando** el Gerente Comercial consulta el resumen, **entonces** el sistema muestra la cantidad de seguimientos pendientes y los identifica por cliente.
3. **Dado** que se completó un seguimiento pendiente o se registró uno nuevo en la ficha de un cliente, **cuando** el Gerente Comercial vuelve a consultar el resumen, **entonces** los indicadores reflejan la información actualizada.
4. **Dado** que el Gerente Comercial identifica clientes con seguimientos pendientes, **cuando** selecciona uno de ellos, **entonces** accede a su ficha e historial para revisar el detalle y organizar la atención del equipo.
5. **Dado** que no existen clientes, interacciones ni seguimientos registrados, **cuando** el Gerente Comercial abre el resumen, **entonces** el sistema muestra un estado vacío claro, con los indicadores en cero, e indica cómo comenzar a registrar información.
6. **Dado** que el módulo está configurado como CRM, **cuando** se muestra el resumen de Gestión Comercial, **entonces** todas las etiquetas utilizan "Clientes" e "Historial/Ficha" en lugar de "Entidades" y "Documentos".

---

### Historia de Usuario 7 - Reetiquetar pantallas desde la configuración (Prioridad: P1)

Como desarrollador de módulos, quiero que todas las etiquetas visibles para el usuario deriven de la configuración, para que un módulo adaptado hable su idioma de dominio de forma consistente en todo momento.

**Por qué esta prioridad**: Los usuarios confían en un módulo que dice consistentemente "Cliente" y "Pedido de Venta" en lugar de dejar filtrarse una "Entidad" genérica por media interfaz; la terminología inconsistente hace que los módulos adaptados parezcan rotos. Esta historia depende del perfil de configuración (Historia de Usuario 5).

**Prueba Independiente**: Un desarrollador mapea Entidad→Cliente y Documento→Pedido de Venta en la configuración, y cada pestaña, botón, etiqueta de formulario, encabezado y mensaje en las tres pantallas usa los términos mapeados.

**Escenarios de Aceptación**:

1. **Dados** mapeos de términos definidos en la configuración, **cuando** cualquier pantalla carga, **entonces** pestañas, botones, etiquetas de formulario, encabezados y mensajes de estado vacío muestran los términos configurados.
2. **Dado** que las etiquetas han sido remapeadas, **cuando** el usuario navega entre pantallas, **entonces** el comportamiento de navegación no cambia.
3. **Dado** que no se proporcionan mapeos, **cuando** cualquier pantalla carga, **entonces** se muestran los términos predeterminados Entidad/Documento.
4. **Dado** el perfil de clientes, **cuando** carga cualquier pantalla, **entonces** "Fecha de nacimiento" reemplaza a "Fecha objetivo" en formularios, listas, ficha, búsqueda y filtros.

---

### Historia de Usuario 8 - Declarar campos personalizados para los registros (Prioridad: P1)

Como desarrollador de módulos, quiero declarar campos adicionales para entidades y documentos en la configuración, para que aparezcan automáticamente en formularios, listas, validación y búsqueda sin escribir código de interfaz.

**Por qué esta prioridad**: Los módulos personalizados existen porque sus registros contienen datos específicos del dominio (el límite de crédito de un cliente, la fecha de vencimiento de una factura). Si añadir campos requiere editar formularios y validación a mano, la adaptación es propensa a errores y no escala. Esta historia depende del perfil de configuración (Historia de Usuario 5).

**Prueba Independiente**: Un desarrollador declara un campo numérico obligatorio personalizado en las entidades; se muestra como entrada numérica en el formulario, bloquea el guardado cuando está en blanco, muestra los valores guardados en las listas y coincide en las búsquedas.

**Escenarios de Aceptación**:

1. **Dado** un campo personalizado de entidad de tipo número declarado como obligatorio, **cuando** el usuario crea o edita una entidad, **entonces** el campo se muestra como entrada numérica y un valor en blanco impide guardar con `Completa los campos obligatorios.`.
2. **Dado** un campo personalizado con un valor guardado, **cuando** el usuario ve la lista o la vista de detalle, **entonces** el valor se muestra.
3. **Dados** campos personalizados declarados, **cuando** el usuario busca usando un término que coincide con un valor de campo personalizado, **entonces** se devuelven los registros coincidentes.
4. **Dado** que no hay campos personalizados declarados, **cuando** la aplicación se ejecuta, **entonces** el comportamiento es idéntico al del módulo base sin modificar.

---

### Historia de Usuario 9 - Buscar y encontrar entidades rápidamente (Prioridad: P2)

Como usuario de negocio, quiero buscar mis entidades por detalles clave para encontrar rápidamente el registro que necesito.

**Por qué esta prioridad**: La recuperación rápida mejora la utilidad cuando el conjunto de datos crece más allá de un pequeño número de entradas.

**Prueba Independiente**: Un usuario puede introducir un término de búsqueda y ver solo las entidades coincidentes.

**Escenarios de Aceptación**:

1. **Dadas** múltiples entidades almacenadas, **cuando** el usuario busca con un término coincidente, **entonces** solo se muestran las entidades coincidentes.
2. **Dada** una búsqueda sin coincidencias, **cuando** el usuario envía la búsqueda, **entonces** el sistema muestra exactamente `No se encontraron resultados.` y permite volver a intentarlo.
3. **Dadas** cientos de entidades almacenadas, **cuando** el usuario busca, **entonces** los resultados coincidentes aparecen con prontitud sin retraso perceptible.

---

### Historia de Usuario 10 - Registrar una fecha objetivo (Prioridad: P2)

Como usuario de negocio, quiero adjuntar una fecha objetivo opcional a una entidad para planificar y ordenar los registros según cuándo vence algo.

**Por qué esta prioridad**: La planificación consciente de fechas mejora el valor central cuando el conjunto de datos crece, pero no es necesaria para la gestión básica.

**Prueba Independiente**: Un usuario puede fijar una fecha en una entidad y verla mostrada en la lista.

**Escenarios de Aceptación**:

1. **Dado** que un usuario está creando o editando una entidad, **cuando** introduce una fecha objetivo, **entonces** la fecha se guarda y se muestra en la lista.
2. **Dada** una entidad con fecha fijada, **cuando** el usuario ve la lista, **entonces** las entidades con fechas pueden identificarse de un vistazo.
3. **Dado** que un usuario deja la fecha en blanco, **cuando** guarda la entidad, **entonces** la entidad igualmente se guarda sin fecha (campo opcional). En el perfil de clientes, la «Fecha de nacimiento» es obligatoria y el guardado se rechaza si está vacía (FR-056).
4. **Dado** el perfil de clientes, **cuando** se muestra el formulario de creación o edición, **entonces** el campo de fecha se denomina "Fecha de nacimiento" y admite fechas válidas desde el 1 de enero de 1910 hasta la fecha actual, inclusive.
5. **Dado** el perfil de clientes, **cuando** se introduce una fecha con un día inexistente para su mes, anterior al 1 de enero de 1910 o posterior a la fecha actual, **entonces** el sistema rechaza el valor con una explicación clara.
6. **Dado** el formulario de cliente abierto antes de cambiar de día según la hora local del dispositivo, **cuando** llega el siguiente día local, **entonces** el límite máximo de "Fecha de nacimiento" pasa a ser la nueva fecha actual sin recargar la página.
7. **Dado** un cliente con una fecha de nacimiento almacenada fuera del rango o inválida, **cuando** se consulta su ficha, **entonces** el valor se muestra igual; y **cuando** se edita, **entonces** no se permite guardar hasta corregirlo.

---

### Historia de Usuario 11 - Registrar los detalles de documentos de una entidad (Prioridad: P2)

Como usuario de negocio, quiero registrar detalles de documentos para una entidad, para mantener la actividad transaccional organizada junto a cada registro de datos maestros.

**Por qué esta prioridad**: Los documentos aportan valor operativo práctico una vez que las entidades están gestionadas, pero no son necesarios para la gestión central.

**Prueba Independiente**: Un usuario puede añadir un documento a una entidad y ver los detalles del documento mostrados junto a esa entidad.

**Escenarios de Aceptación**:

1. **Dada** una entidad en la lista, **cuando** el usuario añade un documento con detalles, **entonces** el documento se guarda y queda asociado a esa entidad.
2. **Dado** un documento existente para una entidad, **cuando** el usuario selecciona esa entidad en la pantalla de gestión, **entonces** los detalles del documento se muestran en la vista de gestión de documentos.
3. **Dada** una entidad eliminada, **cuando** se confirma la eliminación, **entonces** sus documentos asociados también se eliminan.
4. **Dado** que un usuario está creando un documento, **cuando** deja la información obligatoria del documento en blanco, **entonces** el sistema impide guardar con `Completa los campos obligatorios.`.

---

### Historia de Usuario 12 - Buscar entidades en una pantalla dedicada (Prioridad: P2)

Como usuario de negocio, quiero una pantalla de búsqueda dedicada para encontrar rápidamente entidades sin que los formularios de edición saturen la vista.

**Por qué esta prioridad**: La recuperación rápida es valiosa cuando el conjunto de datos crece, y una pantalla separada mantiene enfocada la experiencia de gestión, pero la búsqueda no es necesaria para la gestión básica.

**Prueba Independiente**: Un usuario puede abrir la pantalla de búsqueda desde la barra lateral o una acción rápida, introducir un término de búsqueda y ver solo las entidades coincidentes.

**Escenarios de Aceptación**:

1. **Dado** que el usuario está en la pantalla de búsqueda, **cuando** introduce un término coincidente, **entonces** solo se muestran las entidades coincidentes.
2. **Dada** una búsqueda sin coincidencias, **cuando** el usuario envía la búsqueda, **entonces** se muestra exactamente `No se encontraron resultados.` y puede volver a intentarlo.
3. **Dadas** cientos de entidades almacenadas, **cuando** el usuario busca desde la pantalla de búsqueda, **entonces** los resultados aparecen con prontitud sin retraso perceptible.
4. **Dado** que el usuario está en la pantalla de búsqueda, **cuando** activa el botón Panel en la barra lateral, **entonces** vuelve al panel de inicio.
5. **Dado** el perfil de clientes, **cuando** se busca un término que solo coincide con la categoría o la descripción ocultas, **entonces** no se devuelve ningún cliente (FR-055).

---

### Historia de Usuario 13 - Configurar el ciclo de vida de estados de documentos (Prioridad: P2)

Como desarrollador de módulos, quiero definir los estados permitidos de los documentos y las transiciones permitidas, para que los documentos sigan el ciclo de vida del dominio en lugar de aceptar texto de estado arbitrario.

**Por qué esta prioridad**: Los módulos reales necesitan ciclos de vida controlados (p. ej., cotización → pedido → facturado), pero el estado de texto libre sigue siendo aceptable para extensiones simples, así que esto mejora la base sin ser necesario para la adaptación básica. Esta historia depende del perfil de configuración (Historia de Usuario 5).

**Prueba Independiente**: Un desarrollador configura un ciclo de vida cotización→pedido→facturado; el control de estado ofrece solo estados siguientes válidos, las transiciones inválidas se rechazan con una explicación, y el estado es visible de un vistazo en las listas.

**Escenarios de Aceptación**:

1. **Dado** un ciclo de vida configurado, **cuando** el usuario edita el estado de un documento, **entonces** solo se ofrecen los estados alcanzables mediante transiciones permitidas.
2. **Dado** que se intenta una transición inválida por cualquier vía, **cuando** se envía, **entonces** el sistema la rechaza con una explicación clara.
3. **Dado** un ciclo de vida configurado, **cuando** el usuario ve listas o detalles de documentos, **entonces** el estado actual es identificable de un vistazo.
4. **Dado** que no hay ciclo de vida configurado, **cuando** se editan documentos, **entonces** el estado permanece como texto libre igual que en el módulo base sin modificar.

---

### Historia de Usuario 14 - Marco de espacio de trabajo ERP con marca (Prioridad: P1)

Como usuario de negocio, quiero un espacio de trabajo estilo ERP consistente, con una barra superior con marca y una barra lateral de módulos presentes en cada pantalla, para que la aplicación se sienta como un sistema empresarial coherente en lugar de páginas sueltas.

**Por qué esta prioridad**: El marco aporta la marca y la navegación de todas las demás pantallas; construirlo como envoltorio evita tocar cada historia por separado y da al módulo su identidad ERP. Depende del perfil de configuración (Historia de Usuario 5) para el nombre del módulo y la terminología, y reestructura la navegación antes proporcionada por los botones de bienvenida y las pestañas de gestión (Historias de Usuario 15 y 4).

**Prueba Independiente**: En cada pantalla, una barra superior muestra un logotipo derivado del nombre del módulo junto al nombre del módulo, una barra lateral ofrece botones de módulo para Panel, Buscar, Resumen y Marketing con el módulo activo resaltado visualmente, los apartados «Clientes» (entidades) e «Interacciones» (documentos) solo se acceden desde el panel principal sin que este muestre «Abrir Marketing», y navegar entre módulos nunca pierde datos.

**Escenarios de Aceptación**:

1. **Dada** cualquier pantalla mostrada, **cuando** el usuario mira la página, **entonces** es visible una barra superior que contiene un logotipo SVG en línea derivado del nombre del módulo y el nombre del módulo configurado.
2. **Dada** cualquier pantalla mostrada, **cuando** el usuario mira la barra lateral, **entonces** se muestran los botones de módulo permitidos por su rango —Panel, Buscar, Resumen y Marketing, con la etiqueta «Marketing»— usando la terminología configurada, y NO aparecen «Clientes» ni «Interacciones» (entidades y documentos) ni la gestión de usuarios (FR-012, FR-094, FR-098).
3. **Dado** que el usuario está en cualquier pantalla, **cuando** mira la barra lateral, **entonces** el botón del módulo activo está resaltado visualmente.
4. **Dado** que la ventana gráfica es estrecha, **cuando** se usa la aplicación en una pantalla pequeña, **entonces** la barra lateral se contrae a una columna de iconos manteniéndose utilizable y etiquetada de forma accesible.
5. **Dada** una configuración que define un color de acento, **cuando** cualquier pantalla carga, **entonces** el marco lo usa consistentemente para resaltados y controles principales; sin valor configurado o con un valor inválido, se usan los valores predeterminados integrados sin errores.
6. **Dado** que el usuario navega entre módulos mediante la barra lateral, **cuando** inspecciona sus datos después, **entonces** todas las entidades y documentos almacenados permanecen intactos.

---

### Historia de Usuario 15 - Panel de inicio con acciones rápidas y estadísticas (Prioridad: P1)

Como usuario de negocio, quiero un panel de inicio con accesos directos a las tareas clave y estadísticas de registros, para empezar a trabajar de inmediato sin buscar la acción correcta.

**Por qué esta prioridad**: El panel es la pantalla de entrada de todo el espacio de trabajo (Historia de Usuario 14); sin accesos rápidos ni estadísticas visibles, un usuario nuevo no tiene un punto de partida claro para crear, gestionar o buscar registros.

**Prueba Independiente**: Un usuario abre la aplicación, ve el panel con al menos cinco acciones rápidas y tarjetas de estadísticas, y cada acción lo lleva al destino correcto con un formulario vacío o la búsqueda enfocada.

**Escenarios de Aceptación**:

1. **Dado** que la aplicación carga, **cuando** un usuario con permisos completos la abre, **entonces** aterriza en el panel de inicio con al menos cinco botones de acción rápida (nueva entidad, nuevo documento, abrir gestión de entidades, abrir gestión de documentos, buscar registros), sin «Abrir Marketing» y sin que la barra lateral ofrezca accesos a esos apartados; un usuario con menos permisos ve solo las acciones rápidas autorizadas por su rango (FR-033, FR-094).
2. **Dado** que el usuario activa la acción rápida de nueva entidad o nuevo documento, **cuando** se ejecuta, **entonces** se abre el área de gestión correspondiente con un formulario vacío listo para introducir datos.
3. **Dado** que existen entidades y documentos almacenados, **cuando** el panel se muestra, **entonces** las tarjetas de estadísticas reflejan el número actual de cada uno.
4. **Dado** que no existen entidades ni documentos, **cuando** el panel se muestra, **entonces** las tarjetas de estadísticas muestran cero sin errores.
5. **Dado** el apartado de Marketing, **cuando** el usuario abre la vista, **entonces** no se muestran los cinco botones de acción rápida del panel principal; estos solo están disponibles en el panel (FR-091).
6. **Dado** el apartado de Marketing, **cuando** el usuario mira sus atajos, **entonces** aparecen exactamente los cinco indicados y en el orden definido en FR-093.

---

### Historia de Usuario 16 - Capturar y convertir prospectos desde Marketing (Prioridad: P2)

Como ejecutivo de marketing, quiero capturar las visitas como prospectos, automatizar su seguimiento y medir su conversión a clientes, para convertir visitas en clientes de forma trazable.

**Por qué esta prioridad**: El apartado de Marketing completa el ciclo comercial del módulo al aprovechar las entidades, documentos e indicadores ya existentes para transformar cada visita en un registro gestionable y medible.

**Prueba Independiente**: Un visitante envía el formulario web con consentimiento explícito; el sistema crea un prospecto, una regla por evento registra una interacción automática, el prospecto avanza a Cliente conservando su historial y el resumen muestra las mismas tarjetas y el mismo embudo que el panel principal, actualizados con los registros.

**Escenarios de Aceptación**:

1. **Dado** un visitante en el formulario web embebible, **cuando** envía sus datos con el consentimiento explícito marcado, **entonces** se crea una Entidad en estado «Prospecto» con la fecha y la versión del aviso aceptado y se muestra exactamente `Prospecto registrado correctamente.` (FR-068, FR-069, FR-071).
2. **Dado** un visitante que no marca el consentimiento explícito, **cuando** envía el formulario, **entonces** el prospecto no se crea y se muestra `Completa los campos obligatorios.` (FR-071).
3. **Dado** el prospecto «Visita 2026-11-23» con una regla configurada en la «Campaña Primavera 2026», **cuando** se captura, cambia de etapa en otro flujo o se registra una interacción, **entonces** la interacción y la ejecución se registran como «Sistema» con independencia de quién esté conectado, y el historial identifica a `marketing` como creadora de la campaña (FR-070, FR-086, FR-101).
4. **Dado** un prospecto que avanza a la etapa de Cliente, **cuando** se consulta su ficha, **entonces** conserva su identificador, sus documentos y sus campos personalizados (FR-068).
5. **Dado** el apartado de Marketing, **cuando** se consulta tras crear, editar o eliminar un documento, **entonces** el embudo muestra los mismos estados y conteos que el embudo del panel principal, sin requerir recarga (FR-072).
6. **Dado** el apartado de Marketing, **cuando** se abre, **entonces** se muestran las mismas cinco tarjetas de estadísticas que en el panel principal —entidades, documentos, cerrado ganado, tasa de conversión y pipeline— con idénticos valores y presentación, y se actualizan con los registros almacenados (FR-073).
7. **Dado** el apartado de Marketing, **cuando** se comparan sus cifras con las del panel principal, **entonces** coinciden y cada documento se contabiliza como máximo una vez en su estado según las reglas del panel (FR-074).
8. **Dado** el apartado de Marketing, **cuando** se abre, **entonces** no se muestran la torta «Estado comercial de la cartera» ni el selector de etapas, y se presenta la misma lista de «Últimas Interacciones / Próximos Seguimientos» del panel con acceso a las fichas (FR-075).

---

### Historia de Usuario 17 - Consultar los Equipos de ventas y logros (Prioridad: P2)

Como gerente comercial, quiero abrir desde Marketing un apartado de «Equipos de ventas y logros» con los equipos de trabajo, sus integrantes, cargos, estados, objetivo mensual y real mensual calculados por el sistema, para seguir el desempeño comercial del equipo.

**Por qué esta prioridad**: Complementa los indicadores de Marketing con la información de las personas que realizan las ventas; depende de los clientes, documentos y accesos de Marketing ya definidos en las Historias de Usuario 2, 14, 15 y 16.

**Prueba Independiente**: Un usuario abre Marketing, activa el acceso «Equipos de ventas y logros», crea un equipo y un integrante con nombre, cargo y estado, y comprueba que el objetivo mensual y el real mensual se muestran calculados por el sistema según las ventas del ejecutivo, sin casillas para capturarlos manualmente.

**Escenarios de Aceptación**:

1. **Dado** el apartado de Marketing, **cuando** el usuario activa el acceso «Equipos de ventas y logros» —antes denominado «Equipo de ventas y logros»—, **entonces** se muestra la lista de equipos de trabajo con sus integrantes (FR-076).
2. **Dado** un equipo existente —p. ej. «Equipo Norte»—, **cuando** el usuario crea, edita o elimina integrantes, **entonces** se guardan su nombre, cargo y estado «Activo» o «Inactivo» (FR-077); el Gerente Comercial puede crear el integrante «María González» con cargo «Ejecutivo de Ventas», estado «Activo» y usuario vinculado `ventas`, sin campos para capturar el real ni el objetivo mensual (FR-077, FR-100).
3. **Dado** un integrante vinculado a un ejecutivo con ventas registradas —p. ej. «María González» vinculada a `ventas`, que tiene como «Ejecutivo Asignado» los clientes «Comercial Andina SpA» y «Ferretería Central»—, **cuando** se consulta el apartado, **entonces** su real mensual muestra la suma de los importes de sus documentos «Cerrado ganado» del mes y su objetivo mensual muestra la proyección de esas ventas al cierre del mes, sin captura manual (FR-078, FR-079, FR-100).
4. **Dado** que cambian las ventas del ejecutivo —p. ej. se agrega un documento «Cerrado ganado» por $250.000 a «Comercial Andina SpA»—, **cuando** se vuelve a consultar el apartado, **entonces** el real mensual y el objetivo mensual del integrante se actualizan sin recarga; en el ejemplo, el real mensual de «María González» pasa de $1.250.000 a $1.500.000 y su objetivo mensual se recalcula (FR-078, FR-079, FR-100).
5. **Dado** que no hay equipos ni integrantes registrados, **cuando** se abre el apartado, **entonces** se muestra un estado vacío claro que permite crear el primer equipo (FR-076).

---

### Historia de Usuario 18 - Registrar interacciones en redes sociales (Prioridad: P2)

Como ejecutivo de marketing, quiero registrar y consultar las interacciones de los prospectos en Twitter, Instagram, YouTube y otras redes, para atenderlos en su canal preferido.

**Por qué esta prioridad**: Permite concentrar en Marketing el seguimiento de los canales donde los clientes potenciales están activos, aprovechando los prospectos y clientes ya registrados en las Historias de Usuario 2 y 16.

**Prueba Independiente**: Un ejecutivo abre el apartado «Redes sociales» desde Marketing, registra una interacción de Instagram vinculada a un prospecto con plataforma, fecha, tipo, nota y enlace, y comprueba que queda guardada, visible y vinculada a ese prospecto.

**Escenarios de Aceptación**:

1.  **Dado** el apartado de Marketing, **cuando** el usuario abre «Redes sociales», **entonces** se muestran las interacciones registradas o un estado vacío claro si no hay ninguna (FR-080).
2.  **Dado** un prospecto o cliente existente, **cuando** se registra una interacción con plataforma, fecha, tipo, nota y enlace, **entonces** queda guardada como Documento vinculado a ese registro (FR-080, FR-081).
3.  **Dada** una interacción registrada, **cuando** el usuario la edita o elimina, **entonces** los cambios se reflejan en el apartado y en la ficha de la entidad sin perder la relación con el prospecto o cliente (FR-080, FR-081).
4.  **Dado** un prospecto con interacciones en varias plataformas, **cuando** se consulta su ficha, **entonces** aparecen ordenadas por fecha junto al resto de sus documentos (FR-080, FR-081).

---

### Historia de Usuario 19 - Ofrecer «Dudas y consultas» con respuestas rápidas (Prioridad: P2)

Como visitante del sitio web, quiero hacer preguntas en «Dudas y consultas» y recibir respuestas rápidas, para obtener información sin esperar la atención de un ejecutivo.

**Por qué esta prioridad**: Permite atender consultas en el canal preferido del cliente potencial dentro del sitio, aprovechando las preguntas frecuentes configuradas y registrando las consultas que requieren seguimiento (Historias de Usuario 16 y 18).

**Prueba Independiente**: Un visitante escribe una pregunta que coincide con una pregunta frecuente y recibe la respuesta configurada de inmediato; después escribe una pregunta sin coincidencia y comprueba que recibe exactamente `Consulta registrada; un ejecutivo hará seguimiento.` y que la consulta queda guardada como Documento para seguimiento.

**Escenarios de Aceptación**:

1. **Dado** el apartado «Dudas y consultas» disponible —chat integrado, identificador interno `chat`—, **cuando** el visitante escribe una pregunta configurada, **entonces** se muestra la respuesta rápida correspondiente sin recarga (FR-082).
2. **Dado** el apartado «Dudas y consultas», **cuando** la pregunta no coincide con ninguna respuesta configurada, **entonces** se muestra exactamente `Consulta registrada; un ejecutivo hará seguimiento.` como acuse de recibo claro y la consulta queda registrada como Documento para seguimiento (FR-083).
3. **Dado** un visitante identificado como prospecto o cliente, **cuando** conversa en «Dudas y consultas» (`chat`), **entonces** cada mensaje y respuesta quedan vinculados a su entidad (FR-081).
4. **Dado** que no hay preguntas frecuentes configuradas, **cuando** se abre «Dudas y consultas», **entonces** se muestra un estado vacío claro y el visitante puede dejar su consulta para seguimiento (FR-082, FR-083).
5. **Dado** el formulario público de captura y el apartado de Marketing, **cuando** se abre «Dudas y consultas» (`chat`) en cualquiera de ellos, **entonces** se muestran los mismos mensajes y documentos vinculados a la entidad (FR-084).
6. **Dado** un visitante que no marca la casilla de consentimiento, **cuando** intenta enviar el primer mensaje de «Dudas y consultas» (`chat`), **entonces** el envío se bloquea, se explica el motivo y no se registra ningún mensaje (FR-085).

---

### Historia de Usuario 20 - Programar campañas de marketing internas (Prioridad: P2)

Como ejecutivo de marketing, quiero programar campañas por etapa del prospecto y ejecutar las reglas automáticas existentes, para mantener el seguimiento sin depender de servicios externos.

**Por qué esta prioridad**: Ordena la automatización ya definida en Marketing en campañas programadas, aprovechando los prospectos, documentos, interacciones y reglas por evento de las Historias de Usuario 16, 18 y 19.

**Prueba Independiente**: Un ejecutivo crea una campaña con nombre, etapa objetivo «En proceso» y fechas de inicio y fin, y comprueba que los prospectos de esa etapa reciben la acción automática configurada, que cada ejecución queda en el historial y que no se envían correos ni se publica en redes.

**Escenarios de Aceptación**:

1.  **Dado** el apartado de Marketing, **cuando** el usuario abre la vista de campañas, **entonces** se muestran las campañas programadas o un estado vacío claro (FR-086).
2.  **Dado** un usuario de Marketing, **cuando** crea una campaña con nombre, etapa objetivo y fechas de inicio y fin, **entonces** la campaña queda guardada y lista para ejecutarse (FR-086).
3.  **Dado** un prospecto en la etapa objetivo de una campaña activa, **cuando** ocurre un evento de captura, cambio de etapa o interacción, **entonces** se ejecuta la regla configurada sobre ese prospecto creando un documento de seguimiento, asignando un ejecutivo o actualizando su estado comercial interno (FR-070, FR-086, FR-089).
4.  **Dada** una ejecución automática, **cuando** se consulta la campaña, **entonces** el historial muestra la fecha, el prospecto y la acción realizada (FR-070, FR-086).
5.  **Dada** la «Campaña Primavera 2026» creada por `marketing`, **cuando** termina su fecha fin, o la detiene `marketing` o `gerente`, **entonces** deja de ejecutar acciones nuevas y conserva su historial; si `ventas` intenta detenerla, la acción se rechaza con «No tienes permiso para realizar esta acción» (FR-086, FR-094, FR-096).
6.  **Dado** dos campañas activas para el mismo prospecto y evento, **cuando** se evalúan las reglas, **entonces** solo se ejecuta la más reciente y la otra queda registrada como «omitida por solapamiento» sin acciones duplicadas (FR-090).
7.  **Dada** la «Campaña Primavera 2026» creada por `marketing` y ejecutándose mientras `atencion` tiene la sesión iniciada, **cuando** la regla crea el documento de seguimiento del prospecto «Visita 2026-11-23», **entonces** el documento se registra como creado por «Sistema» y no por `atencion`, y el historial de la campaña muestra a `marketing` como usuaria creadora (FR-070, FR-086, FR-101).

---

### Historia de Usuario 21 - Medir el rendimiento de Marketing (Prioridad: P2)

Como ejecutivo de marketing, quiero consultar indicadores derivados de los registros de Marketing, para evaluar el resultado de las campañas sin capturar ni importar datos manualmente.

**Por qué esta prioridad**: Convierte la información ya registrada de prospectos, interacciones, «Dudas y consultas» y ventas en una lectura accionable del rendimiento, junto a las campañas y al equipo de ventas.

**Prueba Independiente**: Un ejecutivo abre «Rendimiento de campañas», selecciona una campaña activa y comprueba que los indicadores de prospectos, conversión, interacciones, consultas respondidas y ventas ganadas coinciden con los registros almacenados y se actualizan sin recarga tras un cambio.

**Escenarios de Aceptación**:

1. **Dado** el apartado de Marketing, **cuando** el usuario abre «Rendimiento de campañas», **entonces** se muestran los indicadores globales o, si no hay registros, cero con un estado vacío claro y el mensaje exacto `Sin registros para esta campaña.` (FR-087).
2. **Dado** un usuario de Marketing, **cuando** selecciona una campaña, **entonces** los indicadores se filtran a los registros vinculados a esa campaña (FR-086, FR-087, FR-088).
3. **Dado** un cambio en entidades, documentos, interacciones, mensajes de «Dudas y consultas» (`chat`) o ejecuciones de campaña, **cuando** se consulta nuevamente el rendimiento, **entonces** los indicadores se actualizan sin recarga (FR-087).
4. **Dado** que una campaña no tiene registros vinculados, **cuando** se consulta su rendimiento, **entonces** los indicadores muestran cero con una explicación clara y el mensaje exacto `Sin registros para esta campaña.` (FR-087).
5. **Dado** que los indicadores coinciden con el panel y las tarjetas cuando aplica, **cuando** se comparan ambas vistas, **entonces** no hay discrepancias en los valores derivados de los mismos registros (FR-074, FR-087).
6. **Dado** un prospecto, una interacción o una venta sin campaña seleccionada, **cuando** se consulta el filtro de campañas, **entonces** aparece agrupado bajo «Sin campaña» (FR-088).

---

### Historia de Usuario 22 - Iniciar sesión en modo demostración (Prioridad: P1)

Como usuario interno del CRM, quiero iniciar sesión con mi usuario para que el sistema sepa quién soy y qué puedo hacer.

**Por qué esta prioridad**: El sistema debe conocer la identidad del usuario antes de aplicar cualquier permiso (Historia de Usuario 23) y antes de mostrar el espacio de trabajo de las Historias de Usuario 14 y 15. Sin sesión no es posible distinguir al Gerente Comercial del Ejecutivo de Ventas ni registrar quién creó o modificó cada cliente o documento.

**Usuarios del modo demostración**: `gerente` (n4, Gerente Comercial), `marketing` (n3, Ejecutivo de Marketing), `ventas` (n2, Ejecutivo de Ventas) y `atencion` (n1, Atencion al Cliente). El nombre de usuario no distingue mayúsculas ni espacios al inicio o al final. Cualquier contraseña no vacía permite el ingreso; no se verifica hash, no hay contraseñas incorrectas y no existe bloqueo por intentos fallidos.

**Prueba Independiente**: Un visitante sin sesión abre la aplicación y solo ve la pantalla de inicio de sesión, pero puede usar el formulario público de captura y «Dudas y consultas» (`chat`) del sitio; al iniciar sesión como `gerente` con cualquier contraseña, ve el panel con su nombre, su rango «Nivel 4 - Gerente Comercial» y el botón «Cerrar sesión», y al cerrarla vuelve a la pantalla de inicio de sesión.

**Escenarios de Aceptación**:

1.  **Dado** que no hay ninguna sesión iniciada, **cuando** se abre la aplicación en la URL raíz sin parámetro `?view=` (Panel), **entonces** se muestra únicamente la pantalla de inicio de sesión con los campos «Usuario» y «Contraseña», sin Panel, Buscar, Resumen ni Marketing.
2.  **Dado** un visitante sin sesión, **cuando** abre el formulario público de captura `?view=capture` (FR-069), **entonces** el formulario sigue disponible y al enviarlo se crea el prospecto «Visita 2026-11-23» en estado «Prospecto» sin exigir inicio de sesión.
3.  **Dado** un visitante sin sesión, **cuando** abre «Dudas y consultas» (`chat`) integrado en el sitio (FR-084), **entonces** puede escribir la consulta «¿Aceptan pagos en cuotas?» y recibir la respuesta rápida configurada, o dejarla registrada para seguimiento, sin iniciar sesión.
4.  **Dado** uno de los cuatro usuarios demostrativos —`gerente`, `marketing`, `ventas` o `atencion`—, **cuando** inicia sesión con cualquier contraseña no vacía y con el nombre en mayúsculas o con espacios, **entonces** accede al panel con su usuario y su rango exacto, y `gerente` ve además el menú con «Gestionar usuarios» y «Cerrar sesión» (FR-006, FR-098).
5.  **Dado** un usuario demostrativo, **cuando** deja el campo «Contraseña» vacío, **entonces** no se crea la sesión y se muestra exactamente «Ingresa una contraseña» (FR-006).
6.  **Dado** un nombre que no corresponde a los cuatro usuarios demostrativos, **cuando** intenta iniciar sesión, **entonces** no se crea la sesión y se muestra exactamente «Usuario no encontrado» (FR-006).
7.  **Dado** el usuario `ventas` con una sesión iniciada, **cuando** pulsa «Cerrar sesión», **entonces** la sesión finaliza, la barra superior desaparece y vuelve a mostrarse solo la pantalla de inicio de sesión.
8.  **Dado** un visitante sin sesión, **cuando** abre directamente el enlace `?view=summary`, **entonces** se redirige a la pantalla de inicio de sesión y, tras autenticarse como `gerente`, se muestra el resumen solicitado (FR-097).
9.  **Dado** el usuario `atencion` con rango «Nivel 1 - Atencion al Cliente» y sesión iniciada, **cuando** abre el menú del usuario en la barra superior, **entonces** ve «Cerrar sesión» pero NO ve la opción «Gestionar usuarios» (FR-098).
10. **Dado** el usuario `gerente` con sesión iniciada, **cuando** recarga la URL raíz sin parámetro `?view=` (Panel) o cierra y vuelve a abrir el navegador, **entonces** la sesión se conserva, la barra superior sigue mostrando su usuario y su rango, y solo «Cerrar sesión» o su desactivación como usuario la finalizan (FR-102).

---

### Historia de Usuario 23 - Acceso según rango (Prioridad: P1)

Como administrador del CRM, quiero que cada usuario acceda solo a las pantallas y acciones de su rango para proteger la información de los clientes y del equipo.

**Por qué esta prioridad**: La identidad obtenida en la Historia de Usuario 22 solo tiene valor si determina qué puede verse y modificarse. Sin esta historia, un usuario de Atencion al Cliente podría eliminar al cliente «Comercial Andina SpA» o un Ejecutivo de Marketing podría detener la «Campaña Primavera 2026» de otro usuario, rompiendo la trazabilidad de los registros.

**Prueba Independiente**: Cuatro usuarios con rangos distintos —`gerente` (Nivel 4), `marketing` (Nivel 3), `ventas` (Nivel 2) y `atencion` (Nivel 1)— inician sesión y comprueban que sus accesos a clientes, resumen, Marketing y «Equipo de ventas y logros» coinciden exactamente con los permitidos para su rango, mientras un visitante sin sesión solo utiliza el formulario público y «Dudas y consultas» (`chat`).

**Escenarios de Aceptación**:

1.  **Dado** el usuario `gerente` con rango «Nivel 4 - Gerente Comercial», **cuando** inicia sesión, **entonces** tiene acceso total: puede eliminar el cliente «Comercial Andina SpA» (FR-003), ver en el resumen los 47 seguimientos pendientes de todo el equipo —12 de `ventas` y 35 de `ana.munoz`— (US6), crear, editar y eliminar el equipo «Equipo Norte» y sus integrantes (US17), detener la «Campaña Primavera 2026» creada por `marketing` y gestionar usuarios desde el menú del usuario de la barra superior (FR-094, FR-098).
2.  **Dado** el usuario `marketing` con rango «Nivel 3 - Ejecutivo de Marketing», **cuando** abre Marketing, **entonces** puede capturar el prospecto «Visita 2026-11-23» (US16), registrar la interacción de Instagram del prospecto (US18), responder la conversación de «Dudas y consultas» (`chat`) (US19), crear la «Campaña Primavera 2026» (US20) y consultar su rendimiento (US21).
3.  **Dado** el usuario `marketing` con rango «Nivel 3 - Ejecutivo de Marketing», **cuando** busca el cliente «Comercial Andina SpA» y el prospecto «Visita 2026-11-23», **entonces** puede ver ambas fichas; y **cuando** abre «Equipo de ventas y logros», **entonces** solo puede leer el real mensual de $1.250.000 de `ventas` sin botones para crear, editar ni eliminar equipos o integrantes.
4.  **Dado** el usuario `marketing` con rango «Nivel 3 - Ejecutivo de Marketing», **cuando** intenta eliminar el cliente «Comercial Andina SpA», abrir el resumen o crear un integrante en «Equipo Norte», **entonces** cada acción se bloquea con el mensaje exacto «No tienes permiso para realizar esta acción» (FR-094, FR-096).
5.  **Dado** el usuario `ventas` con rango «Nivel 2 - Ejecutivo de Ventas», **cuando** crea el cliente «Ferretería Central» seleccionando a `ventas` en el `select` «Ejecutivo Asignado», **entonces** puede editarlo y cambiar el estado de sus interacciones a «Cerrado ganado» (FR-099).
6.  **Dado** el usuario `ventas` con rango «Nivel 2 - Ejecutivo de Ventas» y el cliente «Transportes del Norte Ltda.» asignado a `ana.munoz`, **cuando** lo busca y abre su ficha, **entonces** ve el cliente y su historial sin poder editarlo ni cambiar el estado de sus interacciones.
7.  **Dado** el usuario `ventas` con rango «Nivel 2 - Ejecutivo de Ventas», **cuando** abre el resumen, **entonces** ve solo sus 12 seguimientos pendientes y no los 35 de `ana.munoz`; y **cuando** abre «Equipo de ventas y logros», **entonces** ve únicamente su real mensual de $1.250.000 y su objetivo mensual de $1.800.000.
8.  **Dado** el usuario `atencion` con rango «Nivel 1 - Atencion al Cliente», **cuando** busca el cliente «Comercial Andina SpA», **entonces** ve su ficha y su historial y registra una interacción de tipo «Llamada» con la nota «Confirmación de horario de entrega»; y **cuando** abre la consulta de «Dudas y consultas» (`chat`) sin respuesta «¿Aceptan pagos en cuotas?» (FR-083) desde la ficha, **entonces** puede darle seguimiento.
9.  **Dado** el usuario `atencion` con rango «Nivel 1 - Atencion al Cliente», **cuando** intenta registrar una interacción de tipo «Reunión», cambiar el estado de una interacción existente, eliminar un cliente o abrir Resumen, Marketing u «Equipo de ventas y logros», **entonces** todas esas acciones se bloquean con el mensaje exacto «No tienes permiso para realizar esta acción» (FR-094, FR-096).
10. **Dado** un visitante sin sesión, **cuando** intenta abrir la URL raíz sin parámetro `?view=` (Panel), **entonces** no accede al espacio de trabajo y solo le quedan disponibles el formulario público de captura (FR-069) y «Dudas y consultas» (`chat`) del sitio (FR-084).
11. **Dado** el usuario `atencion` con rango «Nivel 1 - Atencion al Cliente», **cuando** abre directamente el enlace `?view=summary`, **entonces** ve «Acceso denegado» y vuelve al Panel sin ver los 47 seguimientos pendientes (FR-097).
12. **Dado** el usuario `ventas` con rango «Nivel 2 - Ejecutivo de Ventas», **cuando** intenta eliminar el cliente «Transportes del Norte Ltda.» mediante una llamada directa a `storage.js` sin pasar por la interfaz, **entonces** la capa de datos rechaza la operación con «No tienes permiso para realizar esta acción» y el cliente permanece almacenado (FR-095, FR-096).
13. **Dado** el formulario de cliente abierto por `ventas`, **cuando** despliega «Ejecutivo Asignado», **entonces** solo aparecen `ventas`, `ana.munoz` y `gerente` por ser usuarios activos de rango Ejecutivo de Ventas o Gerente Comercial, y NO aparece `atencion` ni `marketing` (FR-099).
14. **Dado** el usuario `ventas` con sesión iniciada, **cuando** `gerente` lo desactiva desde «Gestionar usuarios», **entonces** su sesión se revoca de inmediato; en la siguiente acción o recarga se le redirige a inicio de sesión y ya no puede crear ni editar clientes (FR-098, FR-102).
15. **Dado** el usuario `ventas` con sesión iniciada y rango «Nivel 2 - Ejecutivo de Ventas», **cuando** `gerente` le asigna el rango «Nivel 3 - Ejecutivo de Marketing» desde «Gestionar usuarios», **entonces** en la siguiente acción o recarga la barra superior muestra el nuevo rango y se aplican los permisos de la matriz correspondientes a Nivel 3 (FR-094, FR-098, FR-102).
16. **Dado** el usuario `ventas` ya creado, **cuando** `gerente` intenta crear otro usuario con el nombre `VENTAS` desde «Gestionar usuarios», **entonces** el guardado se rechaza por duplicado y el usuario original conserva su identidad, su rango y sus clientes asignados (FR-098).

---

### Casos Límite

- Guardar una entidad sin nombre o código obligatorio: se rechaza con `Completa los campos obligatorios.` y no se crea ni modifica el registro; en el perfil de clientes el código se genera automáticamente y no se captura (FR-052).
- Búsqueda sin coincidencias: se muestra exactamente `No se encontraron resultados.` y no se modifica ningún registro (FR-005).
- Editar o eliminar una entidad que ya no existe: la operación falla sin mutar datos, se muestra un error visible y la lista y el resumen quedan sin cambios.
- Fecha objetivo inválida: se rechaza y no se guarda. En el perfil de clientes se rechazan además las fechas anteriores al 1 de enero de 1910 o posteriores a la fecha local actual (FR-047); si el valor ya estaba guardado se conserva y se exige corregirlo al editar (FR-050).
- Eliminar una entidad: tras la confirmación con recuento se eliminan también todos sus documentos en la misma operación; sin confirmación no se elimina nada (FR-003, FR-009).
- Documento con `endDate` anterior a `startDate`: se rechaza el guardado, se muestra un error visible y el documento permanece sin cambios.
- Colisión de clave de campo personalizado con un campo base: se descarta la definición conflictiva, se aplican los valores predeterminados y se muestra una advertencia visible; el campo base conserva su comportamiento (FR-025).
- Tipo de campo desconocido o transición de ciclo de vida inválida: se aplica el fallback a `DEFAULT_CONFIG` con advertencia visible; no se guarda la definición inválida ni se permite la transición (FR-025, FR-030).
- Valores de campos personalizados ya no declarados: permanecen almacenados, no se renderizan ni influyen en la búsqueda; si el campo se vuelve a declarar reaparecen. En el perfil de clientes, «Categoría», «Descripción» y «Nº de pedidos» se conservan sin borrar y permanecen ocultos (FR-040, FR-054).
- Enlace profundo, apertura directa de la gestión o la búsqueda, pulsar el botón atrás del navegador (Back/Forward) o recarga: se resuelve la ruta relativa desde `location.search`; sin parámetro se abre Panel y `?view=capture` se mantiene público. La matriz de permisos se aplica en cada resolución: autenticado sin permiso ve «Acceso denegado» y vuelve al Panel; sin sesión ve login; la ruta solicitada se restaura tras autenticarse (FR-094, FR-097). No existe `?view=panel`.
- Navegación con cambios sin guardar en un formulario: se solicita confirmación y solo se navega si se confirma descartar; en caso contrario los datos siguen intactos (FR-022; resuelto en aclaración 2026-11-16).
- Entidades y documentos al navegar entre Panel, gestión y búsqueda: permanecen intactos y consistentes (FR-007, FR-022).
- Panel con cero entidades o cero documentos: las tarjetas muestran cero sin errores; Marketing y el resumen muestran cero con estado vacío (FR-046, FR-073).
- Color de acento inválido o ausente: se aplica el valor integrado y se muestra la advertencia de configuración cuando corresponda; la interfaz sigue operable (FR-025, FR-038).
- Barra lateral estrecha: se contrae a una columna de iconos con etiquetas accesibles y todas las vistas permitidas siguen alcanzables (FR-039).
- Ficha de entidad sin documentos: se muestra un estado vacío explícito de historial y los datos de la entidad siguen visibles (FR-041).
- Documentos "pendientes": con ciclo de vida se cuentan los estados marcados como pendientes en la configuración; sin ciclo de vida, el estado normalizado debe coincidir con "pendiente"; sin coincidencias el indicador es cero (FR-044; resuelto en aclaraciones 2026-11-12 y 2026-11-16).
- Varios documentos pendientes con la misma fecha objetivo: se ordenan de forma determinista por `id` de documento como desempate y todos se identifican por entidad (FR-044, FR-045).
- Sesión abierta al cruzar la medianoche: el límite de «Fecha de nacimiento» pasa a la nueva fecha local sin recarga (FR-048); desactivación o cambio de rango se aplican en la siguiente acción o recarga conforme a FR-102.
- Formulario público enviado sin consentimiento: no se crea el prospecto y se explica el motivo (FR-071).
- «Dudas y consultas» (`chat`) sin consentimiento: el primer mensaje se bloquea, se explica el motivo y no se registra ningún mensaje (FR-085).
- Marketing sin entidades ni documentos: tarjetas y embudo en cero con estado vacío, igual que el panel (FR-072, FR-073, FR-074).
- «Estado comercial» guardado: se conserva internamente para la automatización y no se muestra en Marketing (FR-068, FR-070, FR-075).
- Ejecutivo sin ventas en el mes: real mensual y objetivo mensual en cero, sin captura manual (FR-078, FR-079).
- Registros sin campaña: aparecen bajo «Sin campaña» en el filtro de rendimiento (FR-088).
- Dos campañas activas para el mismo prospecto y evento: se ejecuta la más reciente; las demás se registran como «omitida por solapamiento», sin acciones duplicadas (FR-090).
- Rango nuevo: se añade una fila a la matriz y la interfaz, la navegación y `storage.js` la respetan sin cambios de código (FR-094).
- Operación prohibida por enlace profundo, consola o llamada directa a `storage.js`: se rechaza con «No tienes permiso para realizar esta acción» y no se mutan datos (FR-095, FR-096).
- Usuario autenticado en vista de otro rango: ve «Acceso denegado» y vuelve al Panel; sin sesión, ve login (FR-097).
- Creador de campaña con rango cambiado o desactivado: el historial conserva `createdByUserId` y las ejecuciones siguen como «Sistema» (FR-086, FR-101).
- «Ejecutivo Asignado» heredado como texto libre: se vincula al usuario activo con el mismo nombre; sin coincidencia queda «Sin asignar» y el Gerente puede reasignarlo (FR-098, FR-099).
- Ejecutivo desactivado con clientes asignados: deja de ofrecerse en el `select` y sus clientes muestran «Sin asignar» hasta reasignarlos; las ventas históricas siguen contando por `assignedUserIdAtSale` (FR-077, FR-078, FR-079, FR-099).
- Clientes guardados sin «Fecha de nacimiento», «Canal de Contacto» o «RUT», o con RUT inválido: su ficha queda bloqueada y solo se editan para completarlos; al guardarlos válidamente se desbloquea (FR-058).
- Cambio de canal de contacto con dato ya introducido: solo se guarda el valor del canal final y se descartan los demás (FR-060); si falta o tiene formato inválido se rechaza con una explicación del formato esperado y `Revisa el dato de contacto según el canal elegido.` (FR-061).
- Mismo RUT con puntos y sin puntos: se compara el valor normalizado y el segundo registro se rechaza con `El RUT ya está registrado.` (FR-057).

## Requisitos _(obligatorio)_

### Rutas relativas y comportamiento del historial

La aplicación usa únicamente rutas relativas de un mismo documento HTML, sin host ni rutas de servidor: sin parámetro = Panel; `?view=capture`; `?view=summary`; `?view=marketing`; `?view=manage-entity`; `?view=manage-document`; `?view=users-admin`. No existe `?view=panel`: el Panel se selecciona quitando el parámetro `view`. Back/Forward y la recarga DEBEN resolver la ruta desde `location.search` y aplicar la matriz de permisos (FR-094, FR-097) en cada cambio de vista: un usuario autenticado sin permiso ve «Acceso denegado» y vuelve al Panel; sin sesión ve el inicio de sesión; `?view=capture` sigue siendo público con o sin sesión. La ruta solicitada se conserva al redirigir a login y se restaura tras autenticarse.

### Requisitos Funcionales

- **FR-001**: El sistema DEBE permitir a los usuarios crear un registro de entidad con al menos un nombre y un código; el código DEBE ser único entre todas las entidades (comparación sin distinguir mayúsculas ni espacios). En el perfil de clientes, el código se genera automáticamente y no se captura ni se muestra (FR-052).
- **FR-002**: El sistema DEBE permitir a los usuarios editar los detalles de un registro de entidad existente.
- **FR-003**: El sistema DEBE permitir a los usuarios eliminar un registro de entidad existente tras una confirmación explícita que indique cuántos documentos asociados se eliminarán.
- **FR-004**: El sistema DEBE permitir a los usuarios buscar registros de entidad por la clave de campo o la etiqueta visible de cualquier campo declarado como buscable (nombre, código, categoría, descripción, fecha objetivo y campos personalizados visibles según la configuración activa). Esta es la lista canónica de campos de búsqueda: FR-020 y FR-055 son aplicaciones del perfil del módulo, no listas independientes. Un campo NO DEBE declararse buscable en FR-004 y excluirse en FR-020 o FR-055, ni al revés, salvo que `fieldRules` o una anulación explícita del perfil lo establezca; en el perfil de clientes, código, categoría y descripción quedan no buscables por `fieldRules`/perfil (FR-051, FR-055).
- **FR-005**: El sistema DEBE mostrar una lista de entidades en la pantalla de búsqueda y en los resultados vinculados a la ficha, y mostrar exactamente `No se encontraron resultados.` cuando ningún resultado coincida con la búsqueda. Esta lista NO DEBE mostrarse en la pantalla de gestión (FR-016).
- **FR-006**: El sistema DEBE usar textos exactos en la retroalimentación: `Completa los campos obligatorios.` cuando falte información obligatoria o no se pueda completar una acción por ese motivo; `El RUT es inválido.`, `El RUT ya está registrado.` y `Revisa el dato de contacto según el canal elegido.` en esos casos (FR-057, FR-061); `No se encontraron resultados.` en búsquedas sin coincidencias (FR-005); `Prospecto registrado correctamente.` y `Consulta registrada; un ejecutivo hará seguimiento.` en captura y «Dudas y consultas» (`chat`) (FR-069, FR-083); `Sin registros para esta campaña.` en rendimiento sin datos (FR-087); y los ya definidos «No tienes permiso para realizar esta acción» y «Acceso denegado» (FR-096, FR-097), además de «Ingresa una contraseña» y «Usuario no encontrado» en el inicio de sesión demostrativo (US22).
- **FR-007**: El sistema DEBE mantener los datos de entidad consistentes tras operaciones de creación, edición y eliminación.
- **FR-008**: El sistema DEBE permitir a los usuarios añadir, editar y eliminar detalles de documentos de una entidad.
- **FR-009**: El sistema DEBE asociar cada documento exactamente a una entidad y eliminar los documentos asociados cuando la entidad se elimina.
- **FR-010**: El sistema DEBE mostrar un panel de inicio como vista inicial, con botones de acción rápida claramente etiquetados para las tareas ERP clave.
- **FR-011**: El sistema DEBE envolver cada pantalla en un marco de espacio de trabajo persistente compuesto por una barra superior con marca y una barra lateral de navegación de módulos.
- **FR-012**: La barra lateral DEBE proporcionar botones de módulo para Panel, Buscar, Resumen y Marketing —este último con la etiqueta «Marketing»—, etiquetados desde la configuración del módulo cuando exista una etiqueta configurada, y NO DEBE incluir botones para «Clientes» (entidades) ni «Interacciones» (documentos). Los botones visibles DEBEN filtrarse según el rango del usuario conectado conforme a la matriz de permisos (FR-094): por ejemplo, Resumen NO DEBE mostrarse a un Ejecutivo de Marketing ni a Atencion al Cliente, y para un Ejecutivo de Ventas DEBE mostrarse limitado a sus propios seguimientos pendientes; Marketing NO DEBE mostrarse a un Ejecutivo de Ventas ni a Atencion al Cliente. La gestión de usuarios NO DEBE figurar en la barra lateral, sino en el menú del usuario de la barra superior (FR-098). Ocultar un botón NO DEBE sustituir la validación de la capa de datos (FR-095).
- **FR-013**: El acceso a entidades desde el panel principal DEBE mostrar el contenido de gestión de entidades.
- **FR-014**: El acceso a documentos desde el panel principal DEBE mostrar el contenido de gestión de documentos en la pantalla de gestión.
- **FR-015**: El botón de módulo Panel DEBE devolver al usuario al panel de inicio.
- **FR-016**: La pantalla de gestión NO DEBE mostrar la lista de entidades.
- **FR-017**: La pantalla de gestión DEBE proporcionar la funcionalidad de crear, editar y eliminar entidades.
- **FR-018**: La pantalla de gestión DEBE proporcionar la funcionalidad de crear, editar y eliminar documentos.
- **FR-019**: El sistema DEBE navegar a una pantalla de búsqueda dedicada cuando se selecciona el botón Buscar en la barra lateral.
- **FR-020**: La pantalla de búsqueda DEBE aplicar la lista canónica de FR-004 sin introducir campos propios: ofrece nombre, código, categoría, descripción, fecha objetivo y campos personalizados visibles, salvo la anulación del perfil de clientes que excluye código, categoría y descripción mediante `fieldRules` (FR-004, FR-055).
- **FR-021**: La pantalla de búsqueda DEBE ser accesible tanto desde la barra lateral como desde la acción rápida de buscar registros del panel.
- **FR-022**: El sistema DEBE mantener los datos de entidades y documentos intactos y consistentes durante la navegación entre pantallas. Si el usuario intenta navegar con cambios sin guardar en un formulario, el sistema DEBE mostrar una confirmación para salir y descartar los cambios o quedarse en el formulario, y solo DEBE navegar si el usuario confirma descartar.
- **FR-023**: El sistema DEBE cargar la configuración del módulo al arrancar y aplicarla en todas las pantallas.
- **FR-024**: El sistema DEBE retroceder a los valores predeterminados integrados (terminología Entidad/Documento, sin campos personalizados, sin ciclo de vida) cuando no se proporciona configuración.
- **FR-025**: Ante una configuración inválida o conflictiva, el sistema DEBE arrancar con los valores predeterminados integrados y mostrar una advertencia visible que informe claramente del problema, en lugar de fallar silenciosamente o bloquear la aplicación.
- **FR-026**: El sistema DEBE mostrar los campos personalizados declarados en los formularios de creación/edición con tipos de entrada que coincidan con sus tipos declarados.
- **FR-027**: El sistema DEBE validar los valores de campos personalizados, incluidos los obligatorios, antes de guardar, usando la misma experiencia de retroalimentación que la validación base.
- **FR-028**: El sistema DEBE incluir los valores de campos personalizados en los resultados de búsqueda y mostrarlos en listas y vistas de detalle.
- **FR-029**: El sistema DEBE derivar todas las etiquetas visibles para el usuario de la configuración del módulo en lugar de texto fijo en el código.
- **FR-030**: El sistema DEBE aplicar las transiciones de estado configuradas en los documentos independientemente de cómo se envíe un cambio.
- **FR-031**: El sistema DEBE mantener el estado del documento como texto libre cuando no hay ciclo de vida configurado.
- **FR-032**: Con 500 entidades y 500 documentos, el renderizado de listas, la búsqueda y el recálculo de estados derivados DEBEN completarse en menos de 2 s en ambos navegadores de referencia, con objetivos de 200 ms p95 en el navegador de escritorio moderno de referencia y 500 ms p95 en el navegador de referencia low-end/móvil, sin congelación visible para el usuario. Los valores derivados DEBEN actualizarse en una sola pasada por juego de datos y las pruebas DEBEN cubrir el conjunto de 500 entidades y 500 documentos (SC-004).
- **FR-033**: El panel DEBE ofrecer, para un usuario con permisos completos, al menos cinco botones de acción rápida: nueva entidad, nuevo documento, abrir gestión de entidades, abrir gestión de documentos y buscar registros; estos accesos DEBEN ser el único punto de entrada a los apartados «Clientes» (entidades) e «Interacciones» (documentos). El panel NO DEBE mostrar el botón «Abrir Marketing», cuyo acceso se traslada a la barra lateral (FR-012). Las acciones rápidas visibles DEBEN filtrarse según el rango del usuario conectado conforme a la matriz de permisos (FR-094): Atencion al Cliente NO DEBE ver «Nueva entidad», «Nuevo documento» ni las acciones de gestión; un Ejecutivo de Marketing NO DEBE ver acciones de creación de entidades ni de apertura de gestión. Ocultar una acción NO DEBE sustituir la validación de la capa de datos (FR-095).
- **FR-034**: Activar la acción rápida de nueva entidad o nuevo documento DEBE abrir el área de gestión correspondiente con un formulario vacío listo para introducir datos.
- **FR-035**: El panel DEBE mostrar cinco tarjetas de estadísticas —total de entidades, total de documentos, «Cerrado ganado», «Tasa de conversión» y «Pipeline (USD)»— y el embudo por estados de documento, actualizadas cada vez que se muestra el panel; son la fuente canónica reutilizada por Marketing (FR-072-FR-074).
- **FR-036**: La barra superior DEBE mostrar un logotipo derivado del nombre del módulo junto con el nombre del módulo configurado en cada pantalla.
- **FR-037**: La barra lateral DEBE resaltar visualmente el módulo activo en cada pantalla.
- **FR-038**: La configuración PUEDE definir un color de acento; el sistema DEBE aplicarlo consistentemente en todo el marco y retroceder de forma segura a los valores integrados cuando esté ausente o sea inválido.
- **FR-039**: En ventanas gráficas estrechas, la barra lateral DEBE contraerse a una columna de iconos manteniéndose operable.
- **FR-040**: Los valores de campos personalizados que ya no están declarados en la configuración DEBEN conservarse en el almacenamiento y ocultarse de la interfaz; si el campo se vuelve a declarar, sus valores vuelven a mostrarse.
- **FR-041**: El sistema DEBE ofrecer una vista de detalle de entidad ("ficha"), accesible al seleccionar una entidad desde los resultados de búsqueda, que muestre los datos de la entidad junto con sus documentos asociados.
- **FR-042**: La vista de detalle de entidad DEBE ordenar los documentos asociados por fecha para presentar el historial de forma cronológica.
- **FR-043**: La vista de detalle de entidad DEBE reflejar las actualizaciones realizadas desde la pantalla de gestión (creación, edición o eliminación de la entidad o de sus documentos) la próxima vez que se consulte.
- **FR-044**: El sistema DEBE ofrecer un resumen de indicadores que muestre el total de entidades, el total de documentos y el número de documentos cuyo estado corresponda a "pendiente". La determinación de "pendiente" sigue esta precedencia: (1) si hay `statusLifecycle` configurado, se cuentan únicamente los estados que la configuración del módulo marque explícitamente como pendientes; (2) si no hay ciclo de vida, se considera pendiente cuando el estado de texto libre, tras normalizar (minúsculas y recorte), coincide con `"pendiente"` (comportamiento base por defecto). Si no hay coincidencias, el indicador es cero. Los documentos pendientes se identifican por entidad.
- **FR-045**: El resumen de indicadores DEBE actualizarse cada vez que se crea, edita o elimina una entidad o un documento, y DEBE permitir seleccionar una entidad listada para abrir su ficha de detalle (FR-041).
- **FR-046**: Cuando no existan entidades, documentos ni documentos pendientes, el resumen de indicadores DEBE mostrar un estado vacío con los valores en cero e indicar cómo comenzar a registrar información.
- **FR-047**: En el perfil de clientes, el campo de fecha objetivo DEBE mostrarse con la etiqueta "Fecha de nacimiento" en todos los lugares visibles (formularios, listas, ficha, búsqueda y filtros) y DEBE aceptar únicamente fechas de calendario válidas entre el 1 de enero de 1910 y la fecha actual, inclusive.
- **FR-048**: En el perfil de clientes, el límite máximo de "Fecha de nacimiento" DEBE recalcularse automáticamente cuando cambie el día mientras la aplicación permanece abierta, sin requerir recarga.
- **FR-049**: En el perfil de clientes, la fecha actual usada como límite DEBE corresponder a la fecha local del dispositivo del usuario.
- **FR-050**: En el perfil de clientes, las fechas de nacimiento almacenadas que queden fuera del rango o sean inválidas DEBEN conservarse y mostrarse sin borrarlas, y el sistema DEBE exigir su corrección antes de guardar cuando el cliente se edite.
- **FR-051**: En el perfil de clientes, los campos «Código», «Categoría», «Descripción» y «Nº de pedidos» NO DEBEN mostrarse en ningún lugar visible: formulario de registro/edición, lista de resultados, ficha y búsqueda/filtros.
- **FR-052**: En el perfil de clientes, el sistema DEBE generar automáticamente un código interno único para cada cliente, conservarlo en su registro, usarlo para la validación de unicidad y NO DEBE solicitarlo, mostrarlo ni usarlo como criterio de búsqueda.
- **FR-053**: En el perfil de clientes, el campo personalizado «Nº de pedidos» (`pedidos`) DEBE eliminarse de la configuración del módulo; el sistema NO DEBE registrarlo ni validarlo como campo del cliente.
- **FR-054**: Los valores ya almacenados de «Categoría», «Descripción» y «Nº de pedidos» en clientes DEBEN conservarse sin borrarlos y permanecer ocultos en todas las vistas del perfil de clientes, conforme a FR-040.
- **FR-055**: En el perfil de clientes, la búsqueda DEBE aplicar FR-004 con la anulación declarada en `fieldRules`/perfil: nombre, «Fecha de nacimiento» y campos personalizados visibles; NO DEBE devolver registros por coincidencias con categoría, descripción ni código. Esta restricción no crea una lista de campos distinta de FR-004 ni permite declarar buscable en otro lugar un campo aquí excluido sin una anulación explícita.
- **FR-056**: En el perfil de clientes, los campos «Fecha de nacimiento», «Canal de Contacto» y «RUT» DEBEN ser obligatorios: el sistema NO DEBE guardar un cliente si cualquiera de ellos está vacío.
- **FR-057**: En el perfil de clientes, el «RUT» DEBE aceptarse en los formatos `12345678-9` y `12.345.678-9`; ambos DEBEN normalizarse eliminando los puntos antes de validar el dígito verificador chileno y antes de comprobar que el RUT es único entre todos los clientes registrados; un RUT inválido DEBE rechazarse con `El RUT es inválido.` y un RUT repetido con `El RUT ya está registrado.`, sin crear ni modificar el registro.
- **FR-058**: Los clientes almacenados sin «Fecha de nacimiento», «Canal de Contacto» o «RUT», o con un RUT inválido o repetido, NO DEBEN poder consultarse en su ficha hasta completarlos; el sistema DEBE explicar el bloqueo y permitir la edición normal únicamente para completar esos datos, desbloqueando la consulta cuando se guarden válidamente.
- **FR-059**: El campo «Canal de Contacto» NO DEBE tener una opción preseleccionada; el usuario DEBE elegir explícitamente una de las opciones configuradas y el guardado DEBE fallar si el campo queda vacío.
- **FR-060**: En el perfil de clientes, el formulario DEBE mostrar un campo adicional según el «Canal de Contacto» elegido: «Teléfono» para llamada, «Correo electrónico» para correo, «Lugar/Enlace de reunión» para reunión y «WhatsApp» para WhatsApp. El sistema DEBE guardar únicamente el valor del canal seleccionado y NO DEBE conservar los valores de los demás canales.
- **FR-061**: La casilla adicional de contacto DEBE ser obligatoria y validarse según el canal elegido: formato telefónico para «Teléfono» y «WhatsApp», formato de correo electrónico para «Correo electrónico» y valor no vacío para «Lugar/Enlace de reunión». El guardado DEBE fallar con `Revisa el dato de contacto según el canal elegido.` si el valor falta o no cumple el formato correspondiente.
- **FR-062**: En el perfil de clientes, la casilla «RUT» DEBE mostrar en color gris la pista `Ej: 11.111.111-1`; dicha pista NO DEBE considerarse un valor capturado ni usarse en la validación o el guardado.
- **FR-063**: En el perfil de clientes, la lista desplegable de «Canal de Contacto» DEBE mostrar las opciones «Llamada», «Correo», «Reunión» y «WhatsApp», cada una con la primera letra en mayúscula, sin opción preseleccionada (FR-059).
- **FR-064**: En el perfil de clientes, el título del formulario de registro y el botón o acción rápida de creación DEBEN mostrar «Nuevo Cliente» en lugar de «Nueva cliente».
- **FR-065**: En el perfil de clientes, el formulario de registro y edición DEBE mostrar las casillas en este orden: 1) «Nombre de Cliente», 2) «RUT», 3) «Fecha de nacimiento», 4) «Canal de Contacto» seguido inmediatamente de su casilla adicional correspondiente según el canal (FR-060), 5) «Tipo de actividad» y 6) «Ejecutivo Asignado» como `select` de usuarios activos de rango Ejecutivo de Ventas o Gerente Comercial (FR-099).
- **FR-066**: En el perfil de clientes, la casilla antes denominada «Rubro» DEBE mostrarse con la etiqueta «Tipo de actividad» y como lista desplegable con exactamente estas opciones: «Dependiente», «Independiente Formal», «Independiente Informal», «Jubilado», «Dueño/a de casa», «Estudiante», «FFAA», «Rentista», «Jubilado - FFAA» y «Cesante». La clave de almacenamiento `rubro` se conserva sin cambios.
- **FR-067**: En el perfil de clientes, la casilla adicional que aparece según el «Canal de Contacto» DEBE mostrar en color gris una pista acorde al formato del canal: «Ej: +56 9 1234 5678» para «Llamada» y «WhatsApp», «Ej: nombre@ejemplo.cl» para «Correo» y «Ej: Sala 2 o enlace» para «Reunión». La pista NO DEBE considerarse un valor capturado ni usarse en la validación o el guardado (FR-061).
- **FR-068**: En el apartado de Marketing, un prospecto DEBE registrarse como una Entidad con el estado inicial «Prospecto» y DEBE convertirse en Cliente mediante una transición interna ejecutada por una regla automática/campaña o por un usuario Nivel 4 desde la ficha, sin selector de etapas en Marketing. La conversión DEBE conservar su identificador, su historial de documentos y sus campos personalizados, y DEBE registrar la auditoría de la transición. El valor interno de la conversión es `ganado`; su resultado visible es «Cliente ganado» y NO DEBE confundirse con el estado de documento «Cerrado ganado». El campo `estado_comercial` y sus valores DEBEN conservarse internamente sin mostrarse en la vista de Marketing (FR-075).
- **FR-069**: El apartado de Marketing DEBE ofrecer un formulario web público embebible que capture cada visita y cree automáticamente una Entidad en estado «Prospecto»; DEBE validar los campos obligatorios antes de crear el registro y DEBE mostrar exactamente `Prospecto registrado correctamente.` al visitante.
- **FR-070**: La automatización del apartado de Marketing DEBE ejecutarse mediante reglas configurables por evento —captura del prospecto, cambio de etapa ocurrido en otros flujos o registro de una interacción— que producen una acción sobre el prospecto, y DEBE registrar cada ejecución en su historial. Las reglas y el campo `estado_comercial` DEBEN conservarse sin mostrarse en la vista de Marketing (FR-075). Las acciones automáticas DEBEN ejecutarse como «Sistema», sin depender del rango de quien esté conectado (FR-101), y su historial DEBE identificar al usuario creador de la campaña cuando provengan de una campaña (FR-086).
- **FR-071**: El formulario público de captura DEBE exigir una casilla de consentimiento explícito marcada por el visitante; sin ella el guardado DEBE rechazarse, y el sistema DEBE conservar en el prospecto la fecha del consentimiento y la versión del aviso de privacidad aceptado.
- **FR-072**: El apartado de Marketing DEBE mostrar el mismo «Embudo Comercial por Estado» que el panel principal, con los mismos estados, conteos y barras porcentuales derivados de los documentos almacenados; DEBE actualizarse sin recarga cuando se crea, edita o elimina un documento (FR-035).
- **FR-073**: El apartado de Marketing DEBE mostrar las cinco tarjetas de estadísticas del panel principal (FR-035) —total de entidades, total de documentos, «Cerrado ganado», «Tasa de conversión» y «Pipeline (USD)»— con la misma presentación y los mismos valores que en el panel, calculados sobre las mismas entidades y documentos almacenados.
- **FR-074**: Los valores de las tarjetas y del embudo del apartado de Marketing DEBEN coincidir exactamente con los del panel principal en cada consulta; cada documento DEBE contabilizarse como máximo una vez en el estado que le corresponda según las mismas reglas del panel.
- **FR-075**: El apartado de Marketing NO DEBE mostrar el gráfico «Estado comercial de la cartera» ni el selector de etapas comerciales; DEBE mostrar la lista «Últimas Interacciones / Próximos Seguimientos» del panel principal con las mismas entradas, estados y acción «Ver ficha».
- **FR-076**: El apartado de Marketing DEBE ofrecer un acceso «Equipos de ventas y logros» —antes denominado «Equipo de ventas y logros»— que abra una vista con una lista editable de uno o varios equipos de trabajo; cada equipo DEBE mostrar su nombre y sus integrantes, y la vista DEBE ofrecer un estado vacío claro cuando no haya equipos registrados.
- **FR-077**: Cada integrante de un equipo DEBE mostrar nombre, cargo, estado «Activo» o «Inactivo» y el usuario activo vinculado de rango Ejecutivo de Ventas o Gerente Comercial; nombre, cargo y estado los captura o edita el usuario, mientras que la vinculación DEBE seleccionarse entre los usuarios permitidos por FR-099. Las ventas históricas DEBEN conservar el usuario asignado mediante `assignedUserIdAtSale` aunque el usuario esté inactivo; FR-078 y FR-079 DEBEN consumir esa atribución antes que el campo vigente. La selección de nuevos integrantes sigue exigiendo usuario activo. El usuario NO DEBE capturar el objetivo mensual ni el real mensual (FR-100).
- **FR-078**: El real mensual de cada integrante DEBE ser la suma de los importes de los documentos en estado «Cerrado ganado» del mes actual vinculados a entidades cuya atribución de venta coincida con el usuario vinculado al integrante: DEBE usarse `assignedUserIdAtSale` cuando exista y, en su defecto, el «Ejecutivo Asignado» vigente (FR-077, FR-100). DEBE actualizarse sin recarga cuando cambian esos documentos o la vinculación del integrante.
- **FR-079**: El objetivo mensual de cada integrante DEBE calcularse automáticamente como la proyección del ritmo de ventas del mes: la suma de importes de los documentos «Cerrado ganado» del mes actual de las entidades atribuidas al usuario vinculado, usando `assignedUserIdAtSale` cuando exista y el «Ejecutivo Asignado» vigente en su defecto (FR-077, FR-100), dividida por los días transcurridos del mes y multiplicada por el total de días de ese mes; sin ventas o sin días transcurridos, DEBE ser cero. DEBE actualizarse sin recarga cuando cambien esas ventas o la vinculación.
- **FR-080**: El apartado de Marketing DEBE ofrecer un apartado «Redes sociales» que permita registrar, consultar, editar y eliminar interacciones con plataformas como Twitter, Instagram y YouTube; cada interacción DEBE capturar plataforma, fecha, tipo, nota y enlace, DEBE vincularse al prospecto o cliente correspondiente y DEBE mostrarse ordenada por fecha (FR-081).
- **FR-081**: Las interacciones de redes sociales y los mensajes del apartado «Dudas y consultas» —chat integrado, identificador interno `chat`— DEBEN persistirse como Documentos vinculados a la entidad correspondiente, con campos personalizados declarados para plataforma o canal y tipo de interacción; DEBEN mostrarse en la ficha de la entidad junto al resto de documentos y permanecer intactos al navegar entre vistas.
- **FR-082**: El apartado «Dudas y consultas» —chat integrado, identificador interno `chat`— DEBE responder automáticamente con el texto configurado cuando el visitante escribe una pregunta que coincide con una pregunta frecuente declarada en la configuración del módulo; sin coincidencia, DEBE ofrecer la opción de dejar la consulta (FR-083).
- **FR-083**: Si no hay coincidencia con una pregunta frecuente, «Dudas y consultas» (`chat`) DEBE registrar la consulta como Documento vinculado al prospecto o cliente identificado, mostrar al visitante exactamente `Consulta registrada; un ejecutivo hará seguimiento.` como acuse de recibo claro y permitir al ejecutivo dar seguimiento desde la ficha de la entidad. El visitante DEBE completar consentimiento y datos mínimos de prospecto antes del primer mensaje (FR-085); sin esa identidad no se persiste la consulta.
- **FR-084**: El apartado «Dudas y consultas» —chat integrado, identificador interno `chat`— DEBE estar disponible en el formulario público de captura del sitio web para los visitantes y en el apartado de Marketing para que los ejecutivos revisen y continúen las conversaciones; ambas superficies DEBEN usar los mismos mensajes y documentos vinculados a la entidad.
- **FR-085**: El apartado «Dudas y consultas» (`chat`) DEBE exigir una casilla de consentimiento explícito marcada por el visitante antes de permitir el primer mensaje y DEBE conservar en la entidad la fecha y la versión del aviso aceptado, conforme a FR-071. Ese consentimiento DEBE crear o vincular un prospecto antes del primer mensaje, de modo que toda consulta sin coincidencia pueda persistirse como Documento vinculado. Las interacciones de redes sociales DEBEN asociarse al consentimiento ya guardado del prospecto o cliente.
- **FR-086**: El apartado de Marketing DEBE permitir crear, editar, detener y consultar campañas programadas con nombre, etapa objetivo y fechas de inicio y fin; durante el periodo activo, DEBE ejecutar las reglas por evento de FR-070 sobre los prospectos de esa etapa, con las acciones internas de FR-089, y DEBE registrar cada ejecución en un historial con fecha, prospecto, acción y el usuario que creó la campaña, persistido en `createdByUserId` no editable. Las ejecuciones DEBEN realizarse como «Sistema» sin depender del rango de quien esté conectado (FR-101), y solo el usuario que creó la campaña o un Gerente Comercial DEBE poder detenerla (FR-094). La campaña NO DEBE enviar correos, mensajes externos ni publicaciones en redes.
- **FR-087**: El apartado de Marketing DEBE ofrecer la vista «Rendimiento de campañas» con prospectos capturados, conversiones por etapa, tasa de conversión, interacciones registradas, consultas de «Dudas y consultas» (`chat`) respondidas y ventas «Cerrado ganado»; los valores DEBEN derivarse de los registros ya almacenados, filtrarse por campaña cuando se seleccione una (FR-088), actualizarse sin recarga tras cambios y coincidir con el panel y las tarjetas cuando aplique (FR-074). Una campaña sin registros DEBE mostrar cero con el mensaje exacto `Sin registros para esta campaña.` (SC-032).
- **FR-088**: El sistema DEBE permitir asignar una campaña existente al prospecto capturado, a las interacciones de redes, a las consultas de «Dudas y consultas» (`chat`) y a los documentos de venta mediante un campo «Campaña» opcional; si no se selecciona, DEBE agruparlos bajo «Sin campaña». El filtro de FR-087 DEBE usar esa relación y DEBE mostrar también el grupo «Sin campaña».
- **FR-089**: Las acciones internas disponibles para una campaña DEBEN ser crear un Documento de seguimiento vinculado al prospecto, asignar un «Ejecutivo Asignado» y actualizar el campo interno `estado_comercial`; cada ejecución DEBE quedar registrada en el historial de FR-086 con fecha, prospecto y acción. Estas acciones NO DEBEN mostrar ni permitir cambiar etapas en la vista de Marketing (FR-075).
- **FR-090**: Si dos o más campañas activas aplican al mismo prospecto y al mismo evento, el sistema DEBE ejecutar solo la campaña creada más recientemente y DEBE registrar las demás en sus historiales como «omitida por solapamiento» con fecha, prospecto, campaña y motivo, sin generar acciones duplicadas sobre el prospecto.
- **FR-091**: El apartado de Marketing NO DEBE mostrar los botones de acción rápida del panel principal (nueva entidad o «Nuevo Cliente», nuevo documento o «Nueva interacción», gestionar entidades o clientes, gestionar documentos o interacciones y buscar); estos accesos DEBEN aparecer solo en el panel principal.
- **FR-092**: Todas las etiquetas visibles del apartado antes denominado «Chat» DEBEN mostrar «Dudas y consultas» tanto en Marketing como en el formulario público de captura; los identificadores internos `chat` pueden conservarse sin cambios.
- **FR-093**: El apartado de Marketing DEBE mostrar exactamente cinco atajos de sección, en este orden: «Equipos de ventas y logros», «Campañas», «Rendimiento de campañas», «Dudas y consultas» y «Redes sociales».
- **FR-094**: La matriz de permisos DEBE definirse en un solo lugar como una tabla de rangos → acciones (sección «Matriz de permisos»), y DEBE ser la fuente única para botones de la barra lateral, acciones rápidas, navegación a vistas y validaciones de la capa de datos. Agregar un rango nuevo DEBE consistir únicamente en añadir una fila a esa tabla, sin modificar la interfaz, las reglas de negocio ni el almacenamiento. La matriz NO DEBE editarse desde ninguna pantalla de la aplicación; en particular, «Gestionar usuarios» NO DEBE permitir modificarla. Toda acción no listada para un rango DEBE denegarse por defecto.
- **FR-095**: La capa de datos (`storage.js`) DEBE validar la matriz de permisos (FR-094) antes de crear, editar o eliminar entidades, documentos, equipos, integrantes, campañas o usuarios, y antes de registrar interacciones o cambiar estados. La validación DEBE aplicarse también cuando la operación se intente mediante enlaces profundos, código reutilizado o llamadas directas a la API de `storage.js`, incluidas las realizadas desde la consola del navegador con una sesión local íntegra; ocultar botones NO DEBE considerarse una validación suficiente. El alcance demostrativo cubre UI, enlaces profundos y API de `storage.js` con sesión íntegra; la manipulación deliberada de `localStorage`, de `erp_session` o del entorno de ejecución para falsificar identidad o rango queda fuera del alcance sin backend.
- **FR-096**: Toda operación no permitida DEBE rechazarse con el mensaje exacto «No tienes permiso para realizar esta acción», sin importar la vía por la que se intente (interfaz, enlace profundo, consola o llamada directa a la capa de datos).
- **FR-097**: Cuando un usuario autenticado llega a una vista no permitida para su rango, el sistema DEBE mostrar «Acceso denegado» y DEBE devolverlo al Panel sin ejecutar la acción solicitada. Para un visitante sin sesión, el acceso a vistas internas DEBE redirigir a la pantalla de inicio de sesión (Historia de Usuario 22) en lugar de mostrar «Acceso denegado».
- **FR-098**: La gestión de usuarios DEBE abrirse desde el menú del usuario en la barra superior y NO DEBE ofrecerse en la barra lateral. El menú del usuario DEBE estar disponible para todo usuario autenticado con «Cerrar sesión», pero la opción «Gestionar usuarios» SOLO DEBE mostrarse al usuario con rango «Nivel 4 - Gerente Comercial», que desde allí DEBE poder crear, editar y desactivar usuarios y asignarles un rango de la matriz (FR-094). El nombre de usuario DEBE ser único sin distinguir mayúsculas ni espacios; el guardado DEBE rechazar duplicados. Para el inicio de sesión, el modo demostración SOLO reconoce `gerente` (n4, Gerente Comercial), `marketing` (n3, Ejecutivo de Marketing), `ventas` (n2, Ejecutivo de Ventas) y `atencion` (n1, Atencion al Cliente), sin distinción de mayúsculas ni espacios; cualquier contraseña no vacía DEBE permitir el acceso y NO DEBE verificarse hash, existir contraseña incorrecta ni bloquearse por intentos fallidos (US22).
- **FR-099**: En los formularios de clientes, el campo «Ejecutivo Asignado» DEBE ser un `select` con los usuarios activos cuyo rango sea «Nivel 2 - Ejecutivo de Ventas» o «Nivel 4 - Gerente Comercial»; NO DEBE aceptarse texto libre ni usuarios inactivos o con otro rango (FR-065). Esto aplica a nuevas asignaciones; los registros históricos conservan `assignedUserIdAtSale`.
- **FR-100**: Cada integrante de «Equipos de ventas y logros» DEBE vincularse a un usuario activo de rango «Nivel 2 - Ejecutivo de Ventas» o «Nivel 4 - Gerente Comercial» (FR-099). El real mensual y el objetivo mensual DEBEN calcularse con los clientes asignados a ese usuario vinculado, y NO con el nombre capturado del integrante (FR-078, FR-079).
- **FR-101**: Las interacciones, los documentos y las campañas generados por reglas automáticas DEBEN ejecutarse bajo la identidad «Sistema», sin depender del rango del usuario conectado en ese momento. El historial de cada campaña DEBE registrar además qué usuario la creó (FR-086), conservando ese dato aunque el usuario cambie de rango o sea desactivado. El campo persistido es `createdByUserId`, separado de la identidad de ejecución `Sistema`.
- **FR-102**: La sesión iniciada DEBE persistir localmente al recargar la página y al cerrar y reabrir el navegador, y DEBE finalizar cuando el usuario pulse «Cerrar sesión» o cuando el usuario sea desactivado (FR-098). En caso de desactivación, la revocación DEBE ser inmediata y la siguiente acción o recarga DEBE redirigir a inicio de sesión. Un cambio de rango del usuario autenticado DEBE aplicarse también en la siguiente acción o recarga, actualizando el rango mostrado y los permisos derivados de la matriz (FR-094, FR-098). Mientras la sesión persista, la identidad y el rango mostrados en la barra superior DEBEN seguir siendo los del usuario autenticado.

### Matriz de permisos (fuente única)

| Rango                            | Panel y búsqueda de fichas                        | Resumen                          | Marketing                     | Equipo de ventas y logros                   | Gestionar usuarios            | Crear/editar/eliminar clientes                                                | Interacciones                                                                                                             | Campañas                                                                |
| -------------------------------- | ------------------------------------------------- | -------------------------------- | ----------------------------- | ------------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Visitante (sin sesión)           | Solo formulario público (FR-069) y chat (FR-084)  | No                               | No                            | No                                          | No                            | No                                                                            | Solo mensajes del chat con consentimiento                                                                                 | No                                                                      |
| Nivel 1 - Atencion al Cliente    | Busca y ve ficha e historial de cualquier cliente | No                               | No                            | No                                          | No                            | No                                                                            | Registra solo «Llamada» o «Correo» en cualquier cliente y da seguimiento a consultas del chat (FR-083); no cambia estados | No                                                                      |
| Nivel 2 - Ejecutivo de Ventas    | Busca y ve ficha de cualquier cliente             | Solo sus seguimientos pendientes | No                            | Solo su real y objetivo mensuales           | No                            | Crea clientes; edita solo los que tenga como «Ejecutivo Asignado»; no elimina | Registra y cambia el estado solo en sus clientes                                                                          | No                                                                      |
| Nivel 3 - Ejecutivo de Marketing | Busca y ve ficha de cualquier cliente y prospecto | No                               | Acceso completo (US16 a US21) | Solo lectura                                | No                            | No; crea prospectos desde Marketing                                           | Consulta conversaciones del chat                                                                                          | Crea, edita, detiene y consulta; no puede detener las de otros usuarios |
| Nivel 4 - Gerente Comercial      | Acceso total                                      | De todo el equipo                | Acceso total                  | Crea, edita y elimina equipos e integrantes | Sí, desde el menú del usuario | Crea, edita y elimina cualquier cliente (FR-003)                              | Acceso total                                                                                                              | Crea y detiene cualquier campaña                                        |

#### Catálogo canónico de acciones

La tabla anterior es la única fuente de verdad. Los identificadores canónicos son: `panel:view`, `search:view`, `entity:view_any`, `entity:view_own`, `entity:create`, `entity:edit_any`, `entity:edit_own`, `entity:delete`, `document:create`, `document:read`, `document:edit_any`, `document:edit_own`, `document:transition_own`, `document:delete`, `summary:view_all`, `summary:view_own`, `marketing:view`, `marketing:manage`, `team:view_all`, `team:view_own`, `team:manage`, `chat:view`, `chat:answer`, `chat:create_query`, `campaign:create`, `campaign:view`, `campaign:edit_own`, `campaign:stop_own`, `campaign:stop_any`, `users:manage`, `permissions:view` y `permissions:edit`.

El contexto `ownerId` identifica al usuario asignado (`Ejecutivo Asignado`), al creador de la campaña o al integrante vinculado según la acción; `campaignOwnerId` identifica al creador de la campaña. Las acciones con sufijo `_own` fallan si falta el contexto o si el usuario autenticado no coincide con él. `permissions:edit` NO DEBE concederse a ningún rango y `permissions:view` solo permite consultar la matriz, nunca modificarla. `contracts/auth.md` y `data-model.md` DEBEN reflejar este catálogo sin introducir identificadores adicionales.

### Requisitos de Extensibilidad _(obligaciones del módulo base)_

Los módulos personalizados construidos sobre esta base DEBEN poder:

- **XR-001**: Extender los registros de entidad y documento con campos adicionales específicos del dominio sin cambiar la estructura de almacenamiento base.
- **XR-002**: Reetiquetar pantallas, pestañas, formularios y listas con terminología específica del módulo sin alterar el comportamiento de navegación.
- **XR-003**: Añadir reglas de validación específicas del módulo junto a las reglas de validación base.
- **XR-004**: Apoyarse en el módulo base para generación de identidad, marcas de tiempo, integridad referencial entre entidades y documentos, y eliminación en cascada.
- **XR-005**: Remarcar el espacio de trabajo —nombre del módulo, logotipo derivado y color de acento— únicamente mediante configuración.

### Entidades Clave _(incluir si la funcionalidad implica datos)_

- **Entidad**: Un registro de datos maestros gestionado por el módulo, que incluye un `id` interno único, un entity_id autogenerado de exposición, su nombre, código de negocio, detalles descriptivos, categoría de clasificación, una fecha objetivo opcional, marcas de tiempo y los campos personalizados declarados por la configuración. En el perfil de clientes, esta fecha se etiqueta como "Fecha de nacimiento" y se restringe según FR-047, el código de negocio se genera automáticamente de forma oculta y única (FR-052), y el dato de contacto adicional se guarda únicamente para el canal elegido (FR-060). En el apartado de Marketing, una Entidad con estado inicial «Prospecto» representa una visita capturada que puede convertirse en Cliente conservando su identidad e historial (FR-068). Los módulos personalizados definen qué representa una Entidad en el mundo real (p. ej., cliente, producto, activo).
- **Documento**: Detalles transaccionales adjuntos a una entidad, vinculados a ella por el entity_id de la entidad. Sus campos base son `id`, `entity_id`, `startDate` y `endDate` opcionales (con `endDate` igual o posterior a `startDate`), `notes` opcional, `status` y marcas de tiempo; los campos de dominio (p. ej. tipo de interacción, serie/folio, importes, moneda, condiciones) se declaran como campos personalizados (Historia de Usuario 8) y su estado se gobierna por el ciclo de vida de documentos configurado (Historia de Usuario 13), sin introducir una estructura de almacenamiento distinta a la de un Documento base. Los módulos personalizados definen qué representa un Documento (p. ej., pedido, factura, contrato). En el perfil CRM ilustrado por las Historias de Usuario 2, 3 y 6, cada Documento representa una interacción comercial o un seguimiento (p. ej., llamada, correo, reunión).
- **Estado comercial**: Clasificación interna de cada prospecto en `prospecto` («Prospecto»), `en_proceso` («En proceso»), `en_recontacto` («En recontacto»), `ganado` («Ganado») o `perdido` («Perdido») para la captura y la automatización (FR-068 a FR-071); `ganado` identifica la conversión de la entidad a Cliente, conserva su identificador, su historial de documentos y sus campos personalizados, registra la auditoría de la transición y su resultado visible, cuando se necesite, es «Cliente ganado», distinto del estado de documento «Cerrado ganado» (FR-068). Ya NO ES la fuente de las tarjetas ni del embudo del apartado de Marketing, que se derivan de los documentos del panel principal (FR-072 a FR-074), y NO se ofrece como selector en esa vista (FR-075).
- **Equipo de ventas**: Agrupación editable de integrantes creada desde el acceso «Equipos de ventas y logros» —antes «Equipo de ventas y logros»— de Marketing; contiene un nombre y la lista de integrantes (FR-076).
- **Integrante del equipo**: Registro editable con nombre, cargo, estado «Activo» o «Inactivo» y un usuario activo vinculado de rango Ejecutivo de Ventas o Gerente Comercial (FR-099, FR-100), vinculado al ejecutivo cuyas ventas se usan para el cálculo de su objetivo mensual y su real mensual; ambos importes los genera el sistema y no se capturan manualmente. El real mensual es la suma de importes de sus documentos «Cerrado ganado» del mes y el objetivo mensual es la proyección de esa suma al cierre del mes, usando `assignedUserIdAtSale` cuando exista (FR-077, FR-078, FR-079).
- **Interacción en redes sociales**: Documento vinculado a un prospecto o cliente con plataforma, fecha, tipo de interacción, nota y enlace declarados como campos personalizados, mostrado en orden cronológico en el apartado «Redes sociales» y en la ficha de la entidad, y asociado al consentimiento guardado del prospecto o cliente (FR-071, FR-080, FR-081, FR-085).
- **Pregunta frecuente**: Par declarado en la configuración del módulo formado por una pregunta y su texto de respuesta rápida, usado por el apartado «Dudas y consultas» —chat integrado, identificador interno `chat`— para responder sin intervención de un ejecutivo (FR-082).
- **Campaña de marketing**: Programación interna creada en Marketing con nombre, etapa objetivo y fechas de inicio y fin; ejecuta las reglas por evento sobre los prospectos de esa etapa creando documentos de seguimiento, asignando ejecutivos o actualizando el estado comercial interno, registra cada acción en un historial junto al usuario que la creó y no usa servicios externos. Sus acciones se ejecutan como «Sistema», con independencia del usuario conectado (FR-070, FR-086, FR-089, FR-101).
- **Usuario**: Persona que inicia sesión con un nombre de usuario único —sin distinguir mayúsculas ni espacios— y una contraseña; tiene un rango de la matriz de permisos, un estado activo o inactivo y, cuando corresponde, aparece como opción de «Ejecutivo Asignado» o como usuario vinculado de un integrante del equipo (FR-094, FR-098, FR-099, FR-100).
- **Rango**: Nivel de acceso del usuario —«Nivel 4 - Gerente Comercial», «Nivel 3 - Ejecutivo de Marketing», «Nivel 2 - Ejecutivo de Ventas» o «Nivel 1 - Atencion al Cliente»—, más la condición de «Visitante (sin sesión)». Cada rango se corresponde con una fila de la matriz de permisos, fuente única de las acciones permitidas (FR-094).
- **Indicador de rendimiento de marketing**: Valor calculado por el sistema —prospectos capturados, conversiones por etapa, tasa de conversión, interacciones, consultas respondidas o ventas «Cerrado ganado»— derivado de entidades, documentos y ejecuciones ya almacenadas, sin captura manual ni fuentes externas (FR-087).
- **ModuleConfig**: El objeto de adaptación cargado al arrancar que define el nombre del módulo, las etiquetas de terminología, las definiciones de campos personalizados, el ciclo de vida de estados de documentos y las preguntas frecuentes del apartado «Dudas y consultas» (`chat`). De forma autocontenida DEBE contemplar `fieldRules` (visibilidad, obligatoriedad, formato, normalización, grupos, orden, pistas y opciones), `statusLifecycle.states`/`transitions`/`pendingStates`, `marketing.faq` con pares pregunta-respuesta, `marketing.privacyNoticeVersion` y `marketing.campaigns.actions` con las acciones internas permitidas. Ante configuración inválida o conflictiva se aplica `DEFAULT_CONFIG` y se muestra la advertencia visible (FR-025). Consulte data-model.md para su forma completa.

## Criterios de Éxito _(obligatorio)_

### Resultados Medibles

- **SC-001**: Los usuarios pueden crear una nueva entidad y verla en la lista en menos de 2 minutos.
- **SC-002**: Los usuarios pueden encontrar una entidad existente mediante la búsqueda en menos de 10 segundos tras introducir un término relevante.
- **SC-003**: En una prueba de usabilidad con cinco participantes, al menos el 90% completa crear, editar, eliminar y buscar sin ayuda y todos los intentos quedan registrados en una lista de verificación cronometrada.
- **SC-004**: Con 500 entidades y 500 documentos, el 100% de las operaciones de renderizar, buscar y recalcular estados terminan en menos de 2 s en ambos navegadores de referencia y al menos el 95% termina en ≤200 ms en el navegador de escritorio moderno de referencia y en ≤500 ms en el navegador de referencia low-end/móvil, sin congelación visible, con los valores derivados actualizados en una sola pasada y sin pérdida de funcionalidad central. La suite incluye obligatoriamente ese conjunto de datos (FR-032).
- **SC-005**: Un usuario puede alcanzar las pantallas de gestión desde el panel y la de búsqueda desde el panel o la barra lateral en menos de 10 segundos en el primer uso.
- **SC-006**: Toda la funcionalidad existente de gestión de entidades y documentos sigue operativa tras el rediseño del marco ERP y el panel (sin regresiones).
- **SC-007**: Los usuarios pueden navegar entre las pantallas de panel, gestión y búsqueda sin perder ninguna entidad ni documento almacenado.
- **SC-008**: Un desarrollador puede producir un módulo adaptado usando solo el archivo de configuración, con cero modificaciones en archivos fuente centrales.
- **SC-009**: Cada pantalla presenta el mismo marco con marca, y los usuarios pueden identificar en qué módulo están de un vistazo.
- **SC-010**: Las estadísticas de registros mostradas en el panel siempre coinciden con el número de entidades y documentos almacenados.
- **SC-011**: Los indicadores del resumen de Gestión Comercial (total de entidades, total de documentos y documentos pendientes por entidad) siempre coinciden con los registros de entidades y documentos almacenados.
- **SC-012**: En el perfil de clientes, el campo "Fecha de nacimiento" rechaza el 100% de las fechas anteriores al 1 de enero de 1910, posteriores a la fecha actual o inválidas según el calendario en las pruebas automatizadas, y actualiza su límite máximo al cambiar de día sin recarga.
- **SC-013**: En el perfil de clientes, el 100% de las verificaciones confirman que «Código», «Categoría», «Descripción» y «Nº de pedidos» no aparecen en formulario, lista, ficha ni búsqueda, que cada cliente conserva un código interno único no visible, y que las búsquedas por categoría o descripción no devuelven registros.
- **SC-014**: En el perfil de clientes, el 100% de las pruebas de guardado rechazan registros sin «Fecha de nacimiento», «Canal de Contacto», «RUT» o dato de contacto adicional, sin RUT válido y único, o con un formato de contacto incorrecto para el canal elegido.
- **SC-015**: En el perfil de clientes, el 100% de las verificaciones de interfaz muestran la pista gris `Ej: 11.111.111-1` en «RUT», las opciones «Llamada», «Correo», «Reunión» y «WhatsApp» con mayúscula inicial y el texto «Nuevo Cliente» en el formulario y la acción de creación.
- **SC-016**: En el perfil de clientes, el 100% de las verificaciones de interfaz confirman el orden de casillas «Nombre de Cliente», «RUT», «Fecha de nacimiento», «Canal de Contacto» con su casilla adicional, «Tipo de actividad» y «Ejecutivo Asignado», y que «Tipo de actividad» ofrece solo las diez opciones definidas en FR-066.
- **SC-017**: En el perfil de clientes, el 100% de las verificaciones de interfaz muestran la pista gris correcta en la casilla adicional de contacto para cada uno de los cuatro canales, conforme a FR-067.
- **SC-018**: En el apartado de Marketing, el 100% de las verificaciones confirman que el embudo coincide con el del panel principal y con los estados almacenados de los documentos, que cada cambio se refleja sin recarga y que los prospectos sin consentimiento explícito no se crean.
- **SC-019**: En el apartado de Marketing, el 100% de las verificaciones confirman que las cinco tarjetas coinciden con las del panel principal y con los registros almacenados, que cada documento se contabiliza una sola vez y que todo cambio en entidades o documentos se refleja sin recarga.
- **SC-020**: El 100% de las verificaciones de interfaz confirman que «Clientes» e «Interacciones» no aparecen en la barra lateral, que «Marketing» aparece allí y no como «Abrir Marketing» en el panel, y que el resto de la navegación sigue funcionando.
- **SC-021**: El 100% de las verificaciones de interfaz confirman que Marketing no muestra la torta «Estado comercial de la cartera» ni el selector de etapas y que su lista de interacciones coincide con la del panel principal.
- **SC-022**: El 100% de las verificaciones confirman que el acceso «Equipos de ventas y logros» permite crear equipos e integrantes con nombre, cargo y estado, que el real mensual equivale a la suma de importes de los documentos «Cerrado ganado» del mes del ejecutivo y que el objetivo mensual equivale a la proyección de esa suma al cierre del mes conforme a FR-079, sin captura manual.
- **SC-023**: El 100% de las verificaciones confirman que el apartado «Redes sociales» permite registrar, editar y eliminar interacciones con plataforma, fecha, tipo, nota y enlace, y que cada interacción se guarda como Documento vinculado al prospecto o cliente correcto, ordenado por fecha y visible en su ficha.
- **SC-024**: El 100% de las verificaciones de «Dudas y consultas» (`chat`) confirman que está disponible en el formulario público y en Marketing, que las preguntas configuradas reciben su respuesta rápida sin recarga, que las consultas sin coincidencia quedan registradas como Documentos con acuse de recibo claro y muestran exactamente `Consulta registrada; un ejecutivo hará seguimiento.`, que los mensajes aparecen en la ficha de la entidad vinculada y que sin consentimiento explícito no se registra ningún mensaje.
- **SC-025**: El 100% de las verificaciones de campañas confirman que una campaña activa ejecuta las reglas por evento solo sobre prospectos de su etapa objetivo dentro del periodo de fechas, que las acciones se limitan a crear documentos de seguimiento, asignar ejecutivos y actualizar el estado comercial interno, que cada ejecución queda registrada con fecha, prospecto y acción, que los solapamientos ejecutan solo la campaña más reciente y registran las omitidas, y que al detenerse o finalizar deja de generar ejecuciones nuevas sin borrar el historial.
- **SC-026**: El 100% de las verificaciones de rendimiento confirman que los indicadores globales y por campaña coinciden con los registros almacenados, que se actualizan sin recarga tras cambios, que una campaña sin registros muestra cero con una explicación clara y el mensaje exacto `Sin registros para esta campaña.` y que los registros sin campaña aparecen bajo «Sin campaña».
- **SC-027**: El 100% de las verificaciones de interfaz confirman que los cinco botones de acción rápida del panel principal no aparecen en Marketing y siguen disponibles solo en el panel.
- **SC-028**: El 100% de las verificaciones de interfaz confirman que todas las etiquetas visibles del apartado antes denominado «Chat» muestran «Dudas y consultas» en Marketing y en el formulario público, conservando los identificadores internos `chat`.
- **SC-029**: El 100% de las verificaciones de Marketing confirman que sus atajos son exactamente «Equipos de ventas y logros», «Campañas», «Rendimiento de campañas», «Dudas y consultas» y «Redes sociales», en ese orden.
- **SC-030**: El 100% de las verificaciones de «Dudas y consultas» (`chat`) confirman que está disponible en el formulario público y en Marketing, que las preguntas configuradas reciben su respuesta rápida sin recarga, que las consultas sin coincidencia quedan registradas como Documentos y muestran exactamente `Consulta registrada; un ejecutivo hará seguimiento.` como acuse de recibo, que los mensajes aparecen en la ficha de la entidad vinculada y que sin consentimiento explícito no se registra ningún mensaje.
- **SC-031**: El 100% de las verificaciones de campañas confirman que una campaña activa ejecuta las reglas por evento solo sobre prospectos de su etapa objetivo dentro del periodo de fechas, que las acciones se limitan a crear documentos de seguimiento, asignar ejecutivos y actualizar el estado comercial interno, que cada ejecución queda registrada con fecha, prospecto y acción, que los solapamientos ejecutan solo la campaña más reciente y registran las omitidas, y que al detenerse o finalizar deja de generar ejecuciones nuevas sin borrar el historial.
- **SC-032**: El 100% de las verificaciones de rendimiento confirman que los indicadores globales y por campaña coinciden con los registros almacenados, que se actualizan sin recarga tras cambios, que una campaña sin registros muestra cero con una explicación clara y el mensaje exacto `Sin registros para esta campaña.` y que los registros sin campaña aparecen bajo «Sin campaña».
- **SC-033**: El 100% de las verificaciones del rango «Nivel 4 - Gerente Comercial» (`gerente`) confirman al menos una acción permitida —eliminar el cliente «Comercial Andina SpA» o gestionar usuarios desde el menú del usuario— y una denegada —la ausencia de controles para modificar la matriz en «Gestionar usuarios»—, comprobando además que una llamada directa a `storage.js` con `permissions:edit` es rechazada con «No tienes permiso para realizar esta acción» (FR-094, FR-096, FR-098).
- **SC-034**: El 100% de las verificaciones del rango «Nivel 3 - Ejecutivo de Marketing» (`marketing`) confirman que inicia sesión con cualquier contraseña no vacía, al menos una acción permitida —crear la «Campaña Primavera 2026» y consultar su rendimiento— y una denegada —eliminar el cliente «Comercial Andina SpA» o abrir el resumen—, rechazada con «No tienes permiso para realizar esta acción» (FR-094, FR-096, US22).
- **SC-035**: El 100% de las verificaciones del rango «Nivel 2 - Ejecutivo de Ventas» (`ventas`) confirman al menos una acción permitida —crear el cliente «Ferretería Central» con `ventas` como «Ejecutivo Asignado»— y una denegada —eliminar «Transportes del Norte Ltda.» mediante llamada directa a `storage.js`—, rechazada con «No tienes permiso para realizar esta acción» (FR-095, FR-096, FR-099).
- **SC-036**: El 100% de las verificaciones del rango «Nivel 1 - Atencion al Cliente» (`atencion`) confirman al menos una acción permitida —registrar una «Llamada» en la ficha de «Comercial Andina SpA»— y una denegada —abrir Marketing o el resumen—, rechazada con «No tienes permiso para realizar esta acción» y mostrando «Acceso denegado» con retorno al Panel cuando se intente por enlace profundo (FR-094, FR-096, FR-097).
- **SC-037**: El 100% de las verificaciones del rango «Visitante (sin sesión)» confirman al menos una acción permitida —enviar el formulario público de captura con consentimiento o usar «Dudas y consultas» (`chat`) del sitio— y una denegada —abrir la URL raíz sin parámetro `?view=` (Panel)—, que redirige a la pantalla de inicio de sesión sin mostrar vistas internas; además, el formulario rechaza la contraseña vacía con «Ingresa una contraseña» y cualquier usuario distinto de los cuatro usuarios demostrativos con «Usuario no encontrado» (FR-006, FR-069, FR-084, FR-097, US22).

## Suposiciones

- El módulo base gestiona datos para un único espacio de trabajo en lugar de una base de datos multiinquilino compartida.
- La adaptación a un módulo específico se realiza mediante un archivo de configuración del módulo en lugar de editando archivos fuente centrales.
- Cada entidad incluye información básica suficiente para identificación y seguimiento; los módulos personalizados aportan los campos específicos del dominio.
- La versión inicial se centra en la gestión central de datos maestros y documentos en lugar de capacidades ERP avanzadas como flujos de aprobación, períodos de contabilización o informes.
- La búsqueda se realiza sobre los registros de entidad almacenados.
- La pantalla de gestión consolida los formularios de añadir/editar entidad y añadir/editar documento en una sola pantalla de gestión.
- La navegación entre Panel, Buscar, Resumen y Marketing ocurre mediante una barra lateral persistente, mientras que Clientes e Interacciones solo se acceden desde el panel principal; la pantalla de gestión aloja ambos paneles de gestión y no muestra la lista de entidades.
- El logotipo se genera como un monograma SVG en línea derivado del nombre del módulo; no se requieren recursos de imagen externos.
- Se puede configurar un color de acento opcional para la marca; el resto de la paleta base permanece fija.
- Solo se muestra una pantalla a la vez; no hay diseño lado a lado del contenido de gestión y búsqueda.
- La navegación entre pantallas se maneja dentro de la aplicación (p. ej., cambio de vistas), y el botón atrás del navegador debe comportarse de forma predecible.
- Los datos siguen persistiéndose en el localStorage del navegador y no se ven afectados por la navegación entre pantallas.
- La fecha actual para el límite de "Fecha de nacimiento" en el perfil de clientes se determina con la hora local del dispositivo del usuario.
- La pantalla de búsqueda se centra en encontrar y ver entidades; la edición permanece en la pantalla de gestión.
- El seguimiento en redes sociales, el apartado «Dudas y consultas» y las campañas programadas funcionan sin servicios externos: las interacciones se registran dentro del módulo, las respuestas rápidas se derivan de la configuración y las campañas ejecutan solo reglas internas.
- El contenido del usuario introducido por el usuario (nombres, descripciones, notas de documentos) DEBE sanitizarse antes de renderizarse en el DOM para prevenir ataques de inyección de scripts (XSS). El módulo base DEBE escapar HTML y atributos de eventos al mostrar datos de localStorage.
- La autenticación es local y simulada, sin backend, con fines demostrativos; una implementación productiva requeriría autenticación en servidor.
- El inicio de sesión funciona en modo demostración: solo existen `gerente`, `marketing`, `ventas` y `atencion`, y cualquier contraseña no vacía permite entrar. No hay verificación de hash, contraseñas incorrectas ni bloqueo por intentos fallidos; la sesión, la expiración y la matriz de permisos se conservan.
