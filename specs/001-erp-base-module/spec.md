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

## Escenarios de Usuario y Pruebas *(obligatorio)*

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

### Historia de Usuario 2 - Registrar clientes y contactos comerciales  (Prioridad: P2)
Como ejecutivo de ventas, quiero registrar clientes y sus interacciones para organizar la información comercial y dejar constancia de cada contacto. 

**Por qué esta prioridad**: Se encuentra en este nivel de prioridad dado que permite ingresar la información principal del CRM, una vez definida la estructura de datos en la Historia de Usuario 1. Sin los registros no sería posible consultar antecedentes ni gestionar seguimientos. 

**Prueba Independiente**: Un ejecutivo registra un cliente y una llamada asociada a él; comprueba que el registro queda guardado y es localizable (mediante búsqueda, selectores o su ficha) sin requerir una lista de entidades en la pantalla de gestión, y que la llamada queda guardada en su ficha. 

**Escenarios de Aceptación**:

1. **Dado** que el ejecutivo completa los datos obligatorios del cliente, **cuando** los guarda, **entonces** el registro se guarda y queda disponible para búsqueda, selección y consulta en su ficha (la pantalla de gestión no muestra una lista de entidades, FR-016). 
2. **Dado** que existe un cliente, **cuando** registra una llamada con fecha y descripción, **entonces** queda guardada en la ficha de ese cliente.
 3. **Dado** que faltan datos obligatorios del cliente, **cuando** se intenta guardar, **entonces** el sistema rechaza el registro y explica qué se debe corregir.
 4. **Dado** el perfil de clientes, **cuando** se muestra el formulario de registro, **entonces** no se muestran los campos «Código», «Categoría», «Descripción» ni «Nº de pedidos» (FR-051).
 5. **Dado** el perfil de clientes, **cuando** se guarda un cliente, **entonces** el sistema genera automáticamente su código interno único sin solicitarlo ni mostrarlo (FR-052).
 6. **Dado** el perfil de clientes, **cuando** se carga la configuración, **entonces** no incluye el campo personalizado «Nº de pedidos» y el sistema no lo registra (FR-053).
 7. **Dado** el perfil de clientes, **cuando** se intenta guardar un cliente sin «Fecha de nacimiento», «Canal de Contacto» o «RUT», **entonces** el sistema rechaza el guardado y explica qué campo falta (FR-056).
 8. **Dado** el perfil de clientes, **cuando** se introduce un RUT con dígito verificador inválido o ya usado por otro cliente, **entonces** el sistema rechaza el guardado y explica el motivo (FR-057).
 9. **Dado** el formulario de registro de un cliente, **cuando** se abre, **entonces** «Canal de Contacto» aparece sin opción preseleccionada y el guardado se rechaza hasta que el usuario elija una (FR-059).
 10. **Dado** un cliente con un canal de contacto elegido, **cuando** se muestra el formulario, **entonces** aparece solo la casilla adicional correspondiente a ese canal y, al guardar, no se conservan los valores de los otros canales (FR-060).
 11. **Dado** el perfil de clientes, **cuando** se deja vacía la casilla adicional de contacto o se introduce un valor con formato inválido para el canal elegido, **entonces** el sistema rechaza el guardado y explica el formato esperado (FR-061).
 12. **Dado** el formulario de registro de un cliente, **cuando** se muestra la casilla «RUT», **entonces** aparece en color gris la pista `Ej: 11.111.111-1` sin contarse como valor capturado (FR-062).
 13. **Dado** el formulario de registro de un cliente, **cuando** se despliega «Canal de Contacto», **entonces** se muestran las opciones «Llamada», «Correo», «Reunión» y «WhatsApp» con la primera letra en mayúscula (FR-063).
 14. **Dado** el perfil de clientes, **cuando** se abre el formulario de registro o la acción rápida de creación, **entonces** el título y la acción muestran «Nuevo Cliente» (FR-064).
 15. **Dado** el formulario de registro o edición de un cliente, **cuando** se muestran las casillas, **entonces** aparecen en el orden «Nombre de Cliente», «RUT», «Fecha de nacimiento», «Canal de Contacto» con su casilla adicional, «Tipo de actividad» y «Ejecutivo Asignado» (FR-065).
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
5. **Dada** una búsqueda sin coincidencias, **cuando** el ejecutivo envía la búsqueda, **entonces** el sistema muestra un estado vacío claro y permite volver a intentarlo.
 6. **Dado** que el ejecutivo necesita dar una atención informada y continua, **cuando** consulta la ficha del cliente, **entonces** el historial se presenta de forma ordenada (por fecha) para facilitar la revisión de los antecedentes del cliente.
 7. **Dado** un cliente guardado sin «Fecha de nacimiento», «Canal de Contacto» o «RUT», o con RUT inválido, **cuando** se intenta abrir su ficha, **entonces** la consulta se bloquea con una explicación de los campos pendientes y se ofrece editarlo para completarlos (FR-058).

---

### Historia de Usuario 4 - Gestionar entidades y documentos en una pantalla dedicada (Prioridad: P1)

Como usuario de negocio, quiero una pantalla dedicada donde pueda añadir, editar y eliminar entidades y sus documentos, para poder gestionar los datos del módulo en un lugar enfocado.

**Por qué esta prioridad**: Esto preserva el valor central de las capacidades de gestión del módulo, presentado como una única pantalla de gestión accesible desde la barra lateral y las acciones rápidas del panel.

**Prueba Independiente**: Un usuario puede navegar a la pantalla de gestión mediante la barra lateral o una acción rápida, alternar entre la gestión de entidades y documentos, y volver al panel, añadiendo, editando y eliminando con éxito una entidad y un documento.

**Escenarios de Aceptación**:

1. **Dado** que el usuario está en la pantalla de gestión, **cuando** mira la navegación, **entonces** la barra lateral del espacio de trabajo ofrece botones de módulo para Entidades, Documentos y Panel con el módulo activo resaltado.
2. **Dada** la barra lateral visible, **cuando** el usuario activa el botón Entidades, **entonces** se muestra el contenido de gestión de entidades.
3. **Dada** la barra lateral visible, **cuando** el usuario activa el botón Documentos, **entonces** se muestra el contenido de gestión de documentos.
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

1. **Dado** un campo personalizado de entidad de tipo número declarado como obligatorio, **cuando** el usuario crea o edita una entidad, **entonces** el campo se muestra como entrada numérica y un valor en blanco impide guardar con una explicación clara.
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
2. **Dada** una búsqueda sin coincidencias, **cuando** el usuario envía la búsqueda, **entonces** el sistema muestra un estado vacío claro y permite volver a intentarlo.
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
4. **Dado** que un usuario está creando un documento, **cuando** deja la información obligatoria del documento en blanco, **entonces** el sistema impide guardar y explica qué se necesita.

---

### Historia de Usuario 12 - Buscar entidades en una pantalla dedicada (Prioridad: P2)

Como usuario de negocio, quiero una pantalla de búsqueda dedicada para encontrar rápidamente entidades sin que los formularios de edición saturen la vista.

**Por qué esta prioridad**: La recuperación rápida es valiosa cuando el conjunto de datos crece, y una pantalla separada mantiene enfocada la experiencia de gestión, pero la búsqueda no es necesaria para la gestión básica.

**Prueba Independiente**: Un usuario puede abrir la pantalla de búsqueda desde la barra lateral o una acción rápida, introducir un término de búsqueda y ver solo las entidades coincidentes.

**Escenarios de Aceptación**:

1. **Dado** que el usuario está en la pantalla de búsqueda, **cuando** introduce un término coincidente, **entonces** solo se muestran las entidades coincidentes.
2. **Dada** una búsqueda sin coincidencias, **cuando** el usuario envía la búsqueda, **entonces** se muestra un estado vacío claro y puede volver a intentarlo.
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

**Prueba Independiente**: En cada pantalla, una barra superior muestra un logotipo derivado del nombre del módulo junto al nombre del módulo, una barra lateral ofrece botones de módulo para Panel, Entidades, Documentos y Buscar con el módulo activo resaltado visualmente, y navegar entre módulos nunca pierde datos.

**Escenarios de Aceptación**:

1. **Dada** cualquier pantalla mostrada, **cuando** el usuario mira la página, **entonces** es visible una barra superior que contiene un logotipo SVG en línea derivado del nombre del módulo y el nombre del módulo configurado.
2. **Dada** cualquier pantalla mostrada, **cuando** el usuario mira la barra lateral, **entonces** se muestran botones de módulo para Panel, Entidades, Documentos y Buscar usando la terminología configurada.
3. **Dado** que el usuario está en cualquier pantalla, **cuando** mira la barra lateral, **entonces** el botón del módulo activo está resaltado visualmente.
4. **Dado** que la ventana gráfica es estrecha, **cuando** se usa la aplicación en una pantalla pequeña, **entonces** la barra lateral se contrae a una columna de iconos manteniéndose utilizable y etiquetada de forma accesible.
5. **Dada** una configuración que define un color de acento, **cuando** cualquier pantalla carga, **entonces** el marco lo usa consistentemente para resaltados y controles principales; sin valor configurado o con un valor inválido, se usan los valores predeterminados integrados sin errores.
6. **Dado** que el usuario navega entre módulos mediante la barra lateral, **cuando** inspecciona sus datos después, **entonces** todas las entidades y documentos almacenados permanecen intactos.

---

### Historia de Usuario 15 - Panel de inicio con acciones rápidas y estadísticas (Prioridad: P1)

Como usuario de negocio, quiero un panel de inicio con accesos directos a las tareas clave y estadísticas de registros, para empezar a trabajar de inmediato sin buscar la acción correcta.

**Por qué esta prioridad**: El panel es la pantalla de entrada de todo el espacio de trabajo (Historia de Usuario 14); sin accesos rápidos ni estadísticas visibles, un usuario nuevo no tiene un punto de partida claro para crear, gestionar o buscar registros.

**Prueba Independiente**: Un usuario abre la aplicación, ve el panel con al menos cuatro acciones rápidas y tarjetas de estadísticas, y cada acción lo lleva al destino correcto con un formulario vacío o la búsqueda enfocada.

**Escenarios de Aceptación**:

1. **Dado** que la aplicación carga, **cuando** el usuario la abre, **entonces** aterriza en el panel de inicio con al menos cuatro botones de acción rápida (nueva entidad, nuevo documento, abrir gestión de entidades, buscar registros).
2. **Dado** que el usuario activa la acción rápida de nueva entidad o nuevo documento, **cuando** se ejecuta, **entonces** se abre el área de gestión correspondiente con un formulario vacío listo para introducir datos.
3. **Dado** que existen entidades y documentos almacenados, **cuando** el panel se muestra, **entonces** las tarjetas de estadísticas reflejan el número actual de cada uno.
4. **Dado** que no existen entidades ni documentos, **cuando** el panel se muestra, **entonces** las tarjetas de estadísticas muestran cero sin errores.

---

### Casos Límite

- ¿Qué ocurre cuando un usuario intenta guardar una entidad sin nombre o código obligatorio? En el perfil de clientes, el código se genera automáticamente y no se captura (FR-052).
- ¿Cómo gestiona el sistema una búsqueda que no devuelve coincidencias?
- ¿Qué ocurre si un usuario intenta editar o eliminar una entidad que ya no existe?
- ¿Qué ocurre cuando un usuario introduce una fecha objetivo que no es una fecha de calendario válida? En el perfil de clientes, además se rechazan las fechas anteriores al 1 de enero de 1910 o posteriores a la fecha actual (FR-047). Si el valor ya estaba guardado, se conserva y se exige corrección al editar (FR-050).
- ¿Qué ocurre con los documentos de una entidad cuando esta se elimina?
- ¿Qué ocurre cuando un usuario introduce una fecha final anterior a la fecha inicial en un documento?
- ¿Qué ocurre cuando la configuración declara un campo personalizado cuya clave choca con un nombre de campo base?
- ¿Qué ocurre cuando la configuración referencia un tipo de campo desconocido o una definición de transición de ciclo de vida inválida?
- ¿Qué ocurre cuando los registros almacenados contienen valores de campos personalizados que ya no están declarados en la configuración? En el perfil de clientes, los valores de «Categoría», «Descripción» y «Nº de pedidos» se conservan sin borrar y permanecen ocultos (FR-054).
- ¿Qué ocurre cuando un usuario abre la aplicación directamente en la pantalla de gestión o búsqueda (p. ej., vía enlace profundo o recarga del navegador) sin pasar por el panel de inicio?
- ¿Qué ocurre cuando un usuario pulsa el botón atrás del navegador estando en la pantalla de gestión o búsqueda?
- Navegación con cambios sin guardar en un formulario: el sistema solicita confirmación y solo sale si el usuario confirma descartar (resuelto en aclaración 2026-11-16).
- ¿Qué ocurre con clientes ya guardados sin «Fecha de nacimiento», «Canal de Contacto» o «RUT», o con RUT inválido? → Su ficha queda bloqueada y solo se puede editar para completar los datos; al guardarlos válidamente se desbloquea (FR-058).
- ¿Qué ocurre si el usuario cambia de canal de contacto después de haber introducido un dato en la casilla adicional? → Solo se guarda el valor del canal final; los valores de los demás canales se descartan (FR-060).
- ¿Qué ocurre si la casilla adicional de contacto está vacía o tiene un formato que no corresponde al canal? → El guardado se rechaza con una explicación del formato esperado (FR-061).
- ¿Qué ocurre si el mismo RUT se captura una vez con puntos y otra sin puntos? → El sistema compara el valor normalizado sin puntos y rechaza el segundo registro como RUT repetido (FR-057).
- ¿Permanecen intactas las entidades y los documentos al navegar entre el panel, la gestión y la búsqueda?
- ¿Qué ocurre cuando el panel se abre con cero entidades o cero documentos (valores estadísticos)?
- ¿Qué ocurre cuando el color de acento configurado no es un valor de color válido?
- ¿Cómo mantiene la barra lateral contraída las etiquetas de módulo accesibles en ventanas gráficas estrechas?
- ¿Qué ocurre cuando una entidad no tiene ningún documento asociado al abrir su ficha de detalle?
- ¿Cómo identifica el resumen de indicadores los documentos "pendientes"? → Con ciclo de vida, los estados marcados explícitamente como pendientes en la configuración; sin ciclo de vida, coincidencia del estado normalizado con "pendiente" (resuelto en aclaraciones 2026-11-12 y 2026-11-16).
- ¿Qué ocurre cuando varios documentos pendientes comparten la misma fecha objetivo en el resumen de indicadores?
- ¿Qué ocurre si una sesión del perfil de clientes permanece abierta al cruzar la medianoche? → El límite máximo de "Fecha de nacimiento" se actualiza automáticamente al nuevo día (FR-048).

## Requisitos *(obligatorio)*

### Requisitos Funcionales

- **FR-001**: El sistema DEBE permitir a los usuarios crear un registro de entidad con al menos un nombre y un código; el código DEBE ser único entre todas las entidades (comparación sin distinguir mayúsculas ni espacios). En el perfil de clientes, el código se genera automáticamente y no se captura ni se muestra (FR-052).
- **FR-002**: El sistema DEBE permitir a los usuarios editar los detalles de un registro de entidad existente.
- **FR-003**: El sistema DEBE permitir a los usuarios eliminar un registro de entidad existente tras una confirmación explícita que indique cuántos documentos asociados se eliminarán.
- **FR-004**: El sistema DEBE permitir a los usuarios buscar registros de entidad por nombre, código, categoría u otras palabras clave descriptivas. En el perfil de clientes, la búsqueda NO DEBE usar código, categoría ni descripción (FR-055).
- **FR-005**: El sistema DEBE mostrar una lista clara de entidades e indicar cuándo ningún resultado coincide con una búsqueda.
- **FR-006**: El sistema DEBE presentar retroalimentación clara cuando falta información obligatoria o no se puede completar una acción.
- **FR-007**: El sistema DEBE mantener los datos de entidad consistentes tras operaciones de creación, edición y eliminación.
- **FR-008**: El sistema DEBE permitir a los usuarios añadir, editar y eliminar detalles de documentos de una entidad.
- **FR-009**: El sistema DEBE asociar cada documento exactamente a una entidad y eliminar los documentos asociados cuando la entidad se elimina.
- **FR-010**: El sistema DEBE mostrar un panel de inicio como vista inicial, con botones de acción rápida claramente etiquetados para las tareas ERP clave.
- **FR-011**: El sistema DEBE envolver cada pantalla en un marco de espacio de trabajo persistente compuesto por una barra superior con marca y una barra lateral de navegación de módulos.
- **FR-012**: La barra lateral DEBE proporcionar botones de módulo para Panel, Entidades, Documentos y Buscar, etiquetados desde la configuración del módulo.
- **FR-013**: El botón de módulo Entidades DEBE mostrar el contenido de gestión de entidades.
- **FR-014**: El botón de módulo Documentos DEBE mostrar el contenido de gestión de documentos en la pantalla de gestión.
- **FR-015**: El botón de módulo Panel DEBE devolver al usuario al panel de inicio.
- **FR-016**: La pantalla de gestión NO DEBE mostrar la lista de entidades.
- **FR-017**: La pantalla de gestión DEBE proporcionar la funcionalidad de crear, editar y eliminar entidades.
- **FR-018**: La pantalla de gestión DEBE proporcionar la funcionalidad de crear, editar y eliminar documentos.
- **FR-019**: El sistema DEBE navegar a una pantalla de búsqueda dedicada cuando se selecciona el botón Buscar en la barra lateral.
- **FR-020**: La pantalla de búsqueda DEBE permitir buscar entidades por nombre, código, categoría, descripción o fecha objetivo. En el perfil de clientes, la búsqueda NO DEBE permitir buscar por código, categoría ni descripción (FR-055).
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
- **FR-032**: El sistema DEBE mantener el renderizado de listas y la búsqueda ágiles y correctos para conjuntos de datos de al menos 500 registros de entidad.
- **FR-033**: El panel DEBE ofrecer al menos cuatro botones de acción rápida: nueva entidad, nuevo documento, abrir gestión de entidades y buscar registros.
- **FR-034**: Activar la acción rápida de nueva entidad o nuevo documento DEBE abrir el área de gestión correspondiente con un formulario vacío listo para introducir datos.
- **FR-035**: El panel DEBE mostrar tarjetas de estadísticas con el número de entidades y documentos almacenados, actualizadas cada vez que se muestra el panel.
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
- **FR-055**: En el perfil de clientes, la búsqueda DEBE basarse únicamente en el nombre, la «Fecha de nacimiento» y los campos personalizados visibles; NO DEBE devolver registros por coincidencias con categoría, descripción ni código.
- **FR-056**: En el perfil de clientes, los campos «Fecha de nacimiento», «Canal de Contacto» y «RUT» DEBEN ser obligatorios: el sistema NO DEBE guardar un cliente si cualquiera de ellos está vacío.
- **FR-057**: En el perfil de clientes, el «RUT» DEBE aceptarse en los formatos `12345678-9` y `12.345.678-9`; ambos DEBEN normalizarse eliminando los puntos antes de validar el dígito verificador chileno y antes de comprobar que el RUT es único entre todos los clientes registrados; un RUT inválido o repetido DEBE rechazarse con una explicación clara.
- **FR-058**: Los clientes almacenados sin «Fecha de nacimiento», «Canal de Contacto» o «RUT», o con un RUT inválido o repetido, NO DEBEN poder consultarse en su ficha hasta completarlos; el sistema DEBE explicar el bloqueo y permitir la edición normal únicamente para completar esos datos, desbloqueando la consulta cuando se guarden válidamente.
- **FR-059**: El campo «Canal de Contacto» NO DEBE tener una opción preseleccionada; el usuario DEBE elegir explícitamente una de las opciones configuradas y el guardado DEBE fallar si el campo queda vacío.
- **FR-060**: En el perfil de clientes, el formulario DEBE mostrar un campo adicional según el «Canal de Contacto» elegido: «Teléfono» para llamada, «Correo electrónico» para correo, «Lugar/Enlace de reunión» para reunión y «WhatsApp» para WhatsApp. El sistema DEBE guardar únicamente el valor del canal seleccionado y NO DEBE conservar los valores de los demás canales.
- **FR-061**: La casilla adicional de contacto DEBE ser obligatoria y validarse según el canal elegido: formato telefónico para «Teléfono» y «WhatsApp», formato de correo electrónico para «Correo electrónico» y valor no vacío para «Lugar/Enlace de reunión». El guardado DEBE fallar con una explicación clara si el valor falta o no cumple el formato correspondiente.
- **FR-062**: En el perfil de clientes, la casilla «RUT» DEBE mostrar en color gris la pista `Ej: 11.111.111-1`; dicha pista NO DEBE considerarse un valor capturado ni usarse en la validación o el guardado.
- **FR-063**: En el perfil de clientes, la lista desplegable de «Canal de Contacto» DEBE mostrar las opciones «Llamada», «Correo», «Reunión» y «WhatsApp», cada una con la primera letra en mayúscula, sin opción preseleccionada (FR-059).
- **FR-064**: En el perfil de clientes, el título del formulario de registro y el botón o acción rápida de creación DEBEN mostrar «Nuevo Cliente» en lugar de «Nueva cliente».
- **FR-065**: En el perfil de clientes, el formulario de registro y edición DEBE mostrar las casillas en este orden: 1) «Nombre de Cliente», 2) «RUT», 3) «Fecha de nacimiento», 4) «Canal de Contacto» seguido inmediatamente de su casilla adicional correspondiente según el canal (FR-060), 5) «Tipo de actividad» y 6) «Ejecutivo Asignado».
- **FR-066**: En el perfil de clientes, la casilla antes denominada «Rubro» DEBE mostrarse con la etiqueta «Tipo de actividad» y como lista desplegable con exactamente estas opciones: «Dependiente», «Independiente Formal», «Independiente Informal», «Jubilado», «Dueño/a de casa», «Estudiante», «FFAA», «Rentista», «Jubilado - FFAA» y «Cesante». La clave de almacenamiento `rubro` se conserva sin cambios.
- **FR-067**: En el perfil de clientes, la casilla adicional que aparece según el «Canal de Contacto» DEBE mostrar en color gris una pista acorde al formato del canal: «Ej: +56 9 1234 5678» para «Llamada» y «WhatsApp», «Ej: nombre@ejemplo.cl» para «Correo» y «Ej: Sala 2 o enlace» para «Reunión». La pista NO DEBE considerarse un valor capturado ni usarse en la validación o el guardado (FR-061).

### Requisitos de Extensibilidad *(obligaciones del módulo base)*

Los módulos personalizados construidos sobre esta base DEBEN poder:

- **XR-001**: Extender los registros de entidad y documento con campos adicionales específicos del dominio sin cambiar la estructura de almacenamiento base.
- **XR-002**: Reetiquetar pantallas, pestañas, formularios y listas con terminología específica del módulo sin alterar el comportamiento de navegación.
- **XR-003**: Añadir reglas de validación específicas del módulo junto a las reglas de validación base.
- **XR-004**: Apoyarse en el módulo base para generación de identidad, marcas de tiempo, integridad referencial entre entidades y documentos, y eliminación en cascada.
- **XR-005**: Remarcar el espacio de trabajo —nombre del módulo, logotipo derivado y color de acento— únicamente mediante configuración.

### Entidades Clave *(incluir si la funcionalidad implica datos)*

- **Entidad**: Un registro de datos maestros gestionado por el módulo, que incluye un `id` interno único, un entity_id autogenerado de exposición, su nombre, código de negocio, detalles descriptivos, categoría de clasificación, una fecha objetivo opcional, marcas de tiempo y los campos personalizados declarados por la configuración. En el perfil de clientes, esta fecha se etiqueta como "Fecha de nacimiento" y se restringe según FR-047, el código de negocio se genera automáticamente de forma oculta y única (FR-052), y el dato de contacto adicional se guarda únicamente para el canal elegido (FR-060). Los módulos personalizados definen qué representa una Entidad en el mundo real (p. ej., cliente, producto, activo).
- **Documento**: Detalles transaccionales adjuntos a una entidad, vinculados a ella por el entity_id de la entidad. Sus campos base son `id`, `entity_id`, `startDate` y `endDate` opcionales (con `endDate` igual o posterior a `startDate`), `notes` opcional, `status` y marcas de tiempo; los campos de dominio (p. ej. tipo de interacción, serie/folio, importes, moneda, condiciones) se declaran como campos personalizados (Historia de Usuario 8) y su estado se gobierna por el ciclo de vida de documentos configurado (Historia de Usuario 13), sin introducir una estructura de almacenamiento distinta a la de un Documento base. Los módulos personalizados definen qué representa un Documento (p. ej., pedido, factura, contrato). En el perfil CRM ilustrado por las Historias de Usuario 2, 3 y 6, cada Documento representa una interacción comercial o un seguimiento (p. ej., llamada, correo, reunión).
- **ModuleConfig**: El objeto de adaptación cargado al arrancar que define el nombre del módulo, las etiquetas de terminología, las definiciones de campos personalizados y el ciclo de vida de estados de documentos. Consulte data-model.md para su forma completa.

## Criterios de Éxito *(obligatorio)*

### Resultados Medibles

- **SC-001**: Los usuarios pueden crear una nueva entidad y verla en la lista en menos de 2 minutos.
- **SC-002**: Los usuarios pueden encontrar una entidad existente mediante la búsqueda en menos de 10 segundos tras introducir un término relevante.
- **SC-003**: Al menos el 90% de los usuarios de prueba pueden completar tareas de crear, editar, eliminar y buscar sin ayuda.
- **SC-004**: El sistema sigue siendo utilizable para un conjunto de datos de al menos 500 registros de entidad sin pérdida de funcionalidad central.
- **SC-005**: Un usuario puede alcanzar las pantallas de gestión y búsqueda desde el panel o la barra lateral en menos de 10 segundos en el primer uso.
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

## Suposiciones

- El módulo base gestiona datos para un único espacio de trabajo en lugar de una base de datos multiinquilino compartida.
- La adaptación a un módulo específico se realiza mediante un archivo de configuración del módulo en lugar de editando archivos fuente centrales.
- Cada entidad incluye información básica suficiente para identificación y seguimiento; los módulos personalizados aportan los campos específicos del dominio.
- La versión inicial se centra en la gestión central de datos maestros y documentos en lugar de capacidades ERP avanzadas como flujos de aprobación, períodos de contabilización o informes.
- La búsqueda se realiza sobre los registros de entidad almacenados.
- La pantalla de gestión consolida los formularios de añadir/editar entidad y añadir/editar documento en una sola pantalla de gestión.
- La navegación entre áreas ocurre mediante una barra lateral persistente; la pantalla de gestión aloja ambos paneles de gestión y no muestra la lista de entidades.
- El logotipo se genera como un monograma SVG en línea derivado del nombre del módulo; no se requieren recursos de imagen externos.
- Se puede configurar un color de acento opcional para la marca; el resto de la paleta base permanece fija.
- Solo se muestra una pantalla a la vez; no hay diseño lado a lado del contenido de gestión y búsqueda.
- La navegación entre pantallas se maneja dentro de la aplicación (p. ej., cambio de vistas), y el botón atrás del navegador debe comportarse de forma predecible.
- Los datos siguen persistiéndose en el localStorage del navegador y no se ven afectados por la navegación entre pantallas.
- La fecha actual para el límite de "Fecha de nacimiento" en el perfil de clientes se determina con la hora local del dispositivo del usuario.
- La pantalla de búsqueda se centra en encontrar y ver entidades; la edición permanece en la pantalla de gestión.
- El contenido del usuario introducido por el usuario (nombres, descripciones, notas de documentos) DEBE sanitizarse antes de renderizarse en el DOM para prevenir ataques de inyección de scripts (XSS). El módulo base DEBE escapar HTML y atributos de eventos al mostrar datos de localStorage.

