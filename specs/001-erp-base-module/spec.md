# Especificación de la Funcionalidad: Módulo Base de Gestión de Relaciones con Clientes (CRM)

**Rama de la funcionalidad**: 001-erp-base-module  
**Creada**: 2026-07-08  
**Estado**: Borrador  
**Entrada**: Descripción del usuario: "Construir un módulo base de CRM que pueda extenderse en módulos CRM personalizados. Debe proporcionar gestión de datos maestros (Clientes) y oportunidades comerciales vinculadas con capacidades de crear/editar/eliminar/buscar."

## Propósito

Este proyecto sirve como módulo base reutilizable para construir módulos CRM personalizados. Establece los patrones comunes que todo módulo CRM necesita: gestionar registros de datos maestros (**Clientes**) y sus **Oportunidades** comerciales asociadas, con navegación, validación, persistencia y búsqueda ya implementadas, de modo que los módulos personalizados solo necesiten definir sus campos y reglas específicos del dominio.

## Clarifications

### Session 2026-11-01

- Q: ¿Debe ser único el código de negocio (`code`) de cada cliente, o se permiten códigos duplicados? → A: Único obligatorio (comparación sin distinguir mayúsculas ni espacios).
- Q: Cuando no se configura un ciclo de vida, ¿el estado de la oportunidad debe ser texto libre o debe ofrecerse una lista fija de estados? → A: Texto libre (sin lista de valores predefinidos).
- Q: Cuando la configuración del módulo es inválida o conflictiva, ¿la aplicación debe impedir el uso o debe arrancar con los valores predeterminados mostrando una advertencia? → A: Arrancar con valores predeterminados y mostrar una advertencia visible.
- Q: Cuando la configuración deja de declarar un campo personalizado que ya tenía valores guardados, ¿qué debe hacer el sistema con esos valores? → A: Conservar los valores en el almacenamiento y ocultarlos de la interfaz.
- Q: ¿Debe pedirse confirmación explícita antes de eliminar un cliente, indicando que también se eliminarán sus oportunidades asociadas? → A: Confirmación obligatoria que indique cuántas oportunidades se eliminarán.

## Escenarios de Usuario y Pruebas *(obligatorio)*

### Historia de Usuario 1 - Definir datos compatibles con el CRM (Prioridad: P1)
Como analista de sistemas CRM, quiero definir un modelo de datos con identificadores y campos comunes para facilitar futuras integraciones comerciales.

**Por qué esta prioridad**: Establece cómo se organizarán y relacionarán los clientes y sus oportunidades. Las demás funciones necesitan esa base para guardar y consultar la información correctamente.

**Prueba Independiente**: Un analista registra un cliente de prueba y le asocia una oportunidad; el sistema guarda la relación y rechaza un identificador de cliente repetido con un mensaje claro.

**Escenarios de Aceptación**:

1. **Dado** que el cliente tiene los datos obligatorios, **cuando** se registra, **entonces** se guarda con un identificador único.
2. **Dado** que existe un cliente registrado, **cuando** se intenta registrar otro con el mismo identificador, **entonces** se rechaza y se explica el motivo.
3. **Dado** que existe un cliente, **cuando** se registra una oportunidad asociada a él, **entonces** queda vinculada al cliente correcto.
4. **Dado** que un identificador no corresponde a ningún cliente, **cuando** se intenta asociarle una oportunidad, **entonces** se rechaza con un mensaje claro.
5. **Dado** que están documentados los campos comunes del CRM, **cuando** el analista revisa el modelo, **entonces** los nombres, tipos de datos e identificadores coinciden con lo acordado.

---

### Historia de Usuario 2 - Registrar clientes y oportunidades comerciales (Prioridad: P2)
Como ejecutivo de ventas, quiero registrar clientes y sus oportunidades para organizar la información comercial y dejar constancia de cada avance.

**Por qué esta prioridad**: Permite ingresar la información principal del CRM, una vez definida la estructura de datos en la Historia de Usuario 1. Sin los registros no sería posible consultar antecedentes ni gestionar seguimientos.

**Prueba Independiente**: Un ejecutivo registra un cliente y una oportunidad asociada a él; comprueba que el cliente aparece en los registros y que la oportunidad queda guardada en su ficha.

**Escenarios de Aceptación**:

1. **Dado** que el ejecutivo completa los datos obligatorios del cliente, **cuando** los guarda, **entonces** aparece en los registros de clientes.
2. **Dado** que existe un cliente, **cuando** registra una oportunidad con folio y fechas, **entonces** queda guardada en la ficha de ese cliente.
3. **Dado** que faltan datos obligatorios o el código del cliente está repetido, **cuando** se intenta guardar, **entonces** el sistema rechaza el registro y explica qué se debe corregir.

---

### Historia de Usuario 3 - Consultar antecedentes del cliente (Prioridad: P1)

Como ejecutivo de atención al cliente, quiero buscar clientes y consultar su ficha e historial para brindar una atención informada y continua.

**Por qué esta prioridad**: Permite acceder de forma centralizada a la información del cliente, garantizando una atención oportuna, trazable e informada con base en los registros comerciales existentes.

**Prueba Independiente**: Un ejecutivo busca un cliente registrado, accede a su ficha y revisa su historial de oportunidades asociadas, verificando que la información corresponde a los registros creados y refleja las actualizaciones realizadas.

**Escenarios de Aceptación**:

1. **Dado** que existen clientes registrados, **cuando** el ejecutivo busca por nombre, código o palabra clave, **entonces** el sistema muestra únicamente los clientes coincidentes.
2. **Dado** que el ejecutivo selecciona un cliente de los resultados de búsqueda, **cuando** accede a su ficha, **entonces** se muestra la información del cliente junto a su historial de oportunidades asociadas.
3. **Dado** que esta vista consulta los registros almacenados, **cuando** se carga la ficha o el historial, **entonces** el sistema debe obtener la información desde dichos registros, manteniendo la consistencia.
4. **Dado** que se han realizado actualizaciones a la ficha del cliente o a sus oportunidades desde la pantalla de gestión, **cuando** el ejecutivo consulta nuevamente, **entonces** la vista refleja dichas actualizaciones.
5. **Dada** una búsqueda sin coincidencias, **cuando** el ejecutivo envía la búsqueda, **entonces** el sistema muestra un estado vacío claro y permite volver a intentarlo.
6. **Dado** que el ejecutivo necesita dar una atención informada y continua, **cuando** consulta la ficha del cliente, **entonces** el historial se presenta de forma ordenada (por fecha) para facilitar la revisión de los antecedentes.

---

### Historia de Usuario 4 - Gestionar clientes y oportunidades en una pantalla dedicada (Prioridad: P1)

Como usuario de negocio, quiero una pantalla dedicada donde pueda añadir, editar y eliminar clientes y sus oportunidades, para poder gestionar los datos del módulo en un lugar enfocado.

**Por qué esta prioridad**: Preserva el valor central de las capacidades de gestión del módulo, presentado como una única pantalla de gestión accesible desde la barra lateral y las acciones rápidas del panel.

**Prueba Independiente**: Un usuario puede navegar a la pantalla de gestión mediante la barra lateral o una acción rápida, alternar entre la gestión de clientes y oportunidades, y volver al panel, añadiendo, editando y eliminando con éxito un cliente y una oportunidad.

**Escenarios de Aceptación**:

1. **Dado** que el usuario está en la pantalla de gestión, **cuando** mira la navegación, **entonces** la barra lateral ofrece botones de módulo para Clientes, Oportunidades y Panel con el módulo activo resaltado.
2. **Dada** la barra lateral visible, **cuando** el usuario activa el botón Clientes, **entonces** se muestra el contenido de gestión de clientes.
3. **Dada** la barra lateral visible, **cuando** el usuario activa el botón Oportunidades, **entonces** se muestra el contenido de gestión de oportunidades.
4. **Dado** que el usuario está en la pantalla de gestión, **cuando** mira la pantalla, **entonces** la lista de clientes no se muestra.
5. **Dado** que el usuario está en la pantalla de gestión, **cuando** crea un nuevo cliente, **entonces** el cliente se guarda.
6. **Dado** un cliente existente, **cuando** el usuario edita sus detalles, **entonces** la información actualizada se guarda.
7. **Dado** un cliente que ya no es relevante, **cuando** el usuario lo elimina, **entonces** se elimina junto con sus oportunidades.
8. **Dado** un cliente existente, **cuando** el usuario añade, edita o elimina una oportunidad, **entonces** los cambios se guardan y quedan asociados a ese cliente.
9. **Dado** que el usuario está en la pantalla de gestión, **cuando** activa el botón Panel en la barra lateral, **entonces** vuelve al panel de inicio.

---

### Historia de Usuario 5 - Definir un perfil de configuración del módulo (Prioridad: P1)

Como desarrollador de módulos, quiero declarar un único archivo de configuración que defina la identidad, terminología, campos personalizados y reglas de mi módulo, para adaptar el módulo base en un módulo CRM específico sin modificar su código central.

**Por qué esta prioridad**: La adaptación mediante configuración convierte este proyecto en una base reutilizable. Sin ella, cada módulo personalizado requeriría editar archivos fuente centrales.

**Prueba Independiente**: Un desarrollador proporciona un archivo de configuración que define un perfil de CRM (nombre del módulo, mapeos Cliente/Oportunidad, campos personalizados como industria, canal de origen y ejecutivo asignado, ciclo de vida de embudo comercial), y la aplicación se presenta plenamente como un módulo CRM; al quitar el archivo se restauran los valores predeterminados sin errores.

**Escenarios de Aceptación**:

1. **Dado** que un archivo de configuración define el nombre del módulo, **cuando** la aplicación carga, **entonces** el panel de inicio y el marco del espacio de trabajo muestran el nombre configurado.
2. **Dada** una configuración completa (nombre, mapeos de términos, campos personalizados, ciclo de vida), **cuando** la aplicación carga, **entonces** el módulo se presenta plenamente bajo la identidad configurada sin que se vean términos del módulo base.
3. **Dado** que no se proporciona configuración, **cuando** la aplicación carga, **entonces** la aplicación retrocede a los valores predeterminados integrados sin errores.
4. **Dada** una configuración con valores inválidos o conflictivos, **cuando** la aplicación carga, **entonces** el sistema informa del problema con claridad en lugar de fallar silenciosamente.

---

### Historia de Usuario 6 - Reetiquetar pantallas desde la configuración (Prioridad: P1)

Como desarrollador de módulos, quiero que todas las etiquetas visibles para el usuario deriven de la configuración, para que un módulo adaptado hable su idioma de dominio de forma consistente.

**Por qué esta prioridad**: La terminología inconsistente hace que los módulos adaptados parezcan rotos. Esta historia depende del perfil de configuración (Historia de Usuario 5).

**Prueba Independiente**: Un desarrollador mapea Entidad→Cliente y Documento→Oportunidad en la configuración, y cada pestaña, botón, etiqueta de formulario, encabezado y mensaje usa los términos mapeados.

**Escenarios de Aceptación**:

1. **Dados** mapeos de términos definidos en la configuración, **cuando** cualquier pantalla carga, **entonces** pestañas, botones, etiquetas de formulario, encabezados y mensajes de estado vacío muestran los términos configurados.
2. **Dado** que las etiquetas han sido remapeadas, **cuando** el usuario navega entre pantallas, **entonces** el comportamiento de navegación no cambia.
3. **Dado** que no se proporcionan mapeos, **cuando** cualquier pantalla carga, **entonces** se muestran los términos predeterminados.

---

### Historia de Usuario 7 - Declarar campos personalizados para los registros (Prioridad: P1)

Como desarrollador de módulos, quiero declarar campos adicionales para clientes y oportunidades en la configuración, para que aparezcan automáticamente en formularios, listas, validación y búsqueda sin escribir código de interfaz.

**Por qué esta prioridad**: Los módulos CRM requieren datos específicos del dominio (industria, canal de origen, ejecutivo asignado) sin editar formularios a mano. Esta historia depende del perfil de configuración (Historia de Usuario 5).

**Prueba Independiente**: Un desarrollador declara los campos personalizados de cliente `industria` (texto), `canalOrigen` (select) y `ejecutivoAsignado` (texto); se muestran en el formulario, se validan, se guardan, aparecen en listas/ficha y coinciden en las búsquedas.

**Escenarios de Aceptación**:

1. **Dado** un campo personalizado de cliente declarado como obligatorio, **cuando** el usuario crea o edita un cliente, **entonces** el campo se muestra con el tipo correcto y un valor en blanco impide guardar con una explicación clara.
2. **Dado** un campo personalizado con un valor guardado, **cuando** el usuario ve la lista o la ficha, **entonces** el valor se muestra.
3. **Dados** campos personalizados declarados, **cuando** el usuario busca usando un término que coincide con un valor de campo personalizado, **entonces** se devuelven los registros coincidentes.
4. **Dado** que no hay campos personalizados declarados, **cuando** la aplicación se ejecuta, **entonces** el comportamiento es idéntico al del módulo base sin modificar.

---

### Historia de Usuario 8 - Buscar y encontrar clientes rápidamente (Prioridad: P2)
Como usuario de negocio, quiero buscar mis clientes por detalles clave para encontrar rápidamente el registro que necesito.

**Prueba Independiente**: Un usuario puede introducir un término de búsqueda y ver solo los clientes coincidentes.

**Escenarios de Aceptación**:

1. **Dados** múltiples clientes almacenados, **cuando** el usuario busca con un término coincidente, **entonces** solo se muestran los clientes coincidentes.
2. **Dada** una búsqueda sin coincidencias, **cuando** el usuario envía la búsqueda, **entonces** el sistema muestra un estado vacío claro y permite volver a intentarlo.
3. **Dados** cientos de clientes almacenados, **cuando** el usuario busca, **entonces** los resultados aparecen con prontitud sin retraso perceptible.

---

### Historia de Usuario 9 - Registrar una fecha objetivo (Prioridad: P2)
Como usuario de negocio, quiero adjuntar una fecha objetivo opcional a un cliente para planificar y ordenar los registros según cuándo vence algo.

**Prueba Independiente**: Un usuario puede fijar una fecha en un cliente y verla mostrada en la lista/ficha.

**Escenarios de Aceptación**:

1. **Dado** que un usuario está creando o editando un cliente, **cuando** introduce una fecha objetivo, **entonces** la fecha se guarda y se muestra.
2. **Dado** un cliente con fecha fijada, **cuando** el usuario lo consulta, **entonces** la fecha puede identificarse de un vistazo.
3. **Dado** que un usuario deja la fecha en blanco, **cuando** guarda el cliente, **entonces** el cliente se guarda sin fecha (campo opcional).

---

### Historia de Usuario 10 - Registrar los detalles de oportunidades de un cliente (Prioridad: P2)
Como usuario de negocio, quiero registrar detalles de oportunidades para un cliente, para mantener la actividad comercial organizada junto a cada registro.

**Prueba Independiente**: Un usuario puede añadir una oportunidad a un cliente y verla asociada; editar y eliminar funcionan; eliminar el cliente elimina sus oportunidades.

**Escenarios de Aceptación**:

1. **Dado** un cliente, **cuando** el usuario añade una oportunidad con detalles, **entonces** la oportunidad se guarda y queda asociada a ese cliente.
2. **Dada** una oportunidad existente, **cuando** el usuario la edita o elimina, **entonces** los cambios se guardan correctamente.
3. **Dado** un cliente eliminado, **cuando** se confirma la eliminación, **entonces** sus oportunidades asociadas también se eliminan.
4. **Dado** que falta información obligatoria de la oportunidad, **cuando** se intenta guardar, **entonces** el sistema impide guardar y explica qué se necesita.

---

### Historia de Usuario 11 - Buscar clientes en una pantalla dedicada (Prioridad: P2)

Como usuario de negocio, quiero una pantalla de búsqueda dedicada para encontrar rápidamente clientes sin que los formularios de edición saturen la vista.

**Prueba Independiente**: Un usuario puede abrir la pantalla de búsqueda, introducir un término y ver solo los clientes coincidentes.

**Escenarios de Aceptación**:

1. **Dado** que el usuario está en la pantalla de búsqueda, **cuando** introduce un término coincidente, **entonces** solo se muestran los clientes coincidentes.
2. **Dada** una búsqueda sin coincidencias, **cuando** el usuario envía la búsqueda, **entonces** se muestra un estado vacío claro y puede volver a intentarlo.
3. **Dado** que el usuario está en la pantalla de búsqueda, **cuando** activa el botón Panel en la barra lateral, **entonces** vuelve al panel de inicio.

---

### Historia de Usuario 12 - Configurar el ciclo de vida de estados de oportunidades (Prioridad: P2)

Como desarrollador de módulos, quiero definir los estados permitidos de las oportunidades y las transiciones permitidas, para que sigan el embudo comercial del dominio en lugar de aceptar texto de estado arbitrario.

**Por qué esta prioridad**: Los módulos CRM necesitan ciclos de vida controlados; esta historia depende del perfil de configuración (Historia de Usuario 5).

**Prueba Independiente**: Un desarrollador configura el ciclo de vida `Prospecto → Contactado → Propuesta Enviada → Negociación → Cerrada Ganada / Cerrada Perdida`; el control de estado ofrece solo estados siguientes válidos, las transiciones inválidas se rechazan con una explicación, y el estado es visible de un vistazo.

**Escenarios de Aceptación**:

1. **Dado** un ciclo de vida configurado, **cuando** el usuario edita el estado de una oportunidad, **entonces** solo se ofrecen los estados alcanzables mediante transiciones permitidas.
2. **Dado** que se intenta una transición inválida por cualquier vía, **cuando** se envía, **entonces** el sistema la rechaza con una explicación clara.
3. **Dado** un ciclo de vida configurado, **cuando** el usuario ve listas o la ficha, **entonces** el estado actual es identificable de un vistazo.
4. **Dado** que no hay ciclo de vida configurado, **cuando** se editan oportunidades, **entonces** el estado permanece como texto libre.

---

### Historia de Usuario 13 - Marco de espacio de trabajo CRM con marca (Prioridad: P1)

Como usuario de negocio, quiero un espacio de trabajo estilo CRM consistente, con una barra superior con marca y una barra lateral de módulos presentes en cada pantalla, para que la aplicación se sienta como un sistema coherente.

**Por qué esta prioridad**: El marco aporta la marca y la navegación de todas las demás pantallas. Depende del perfil de configuración (Historia de Usuario 5).

**Prueba Independiente**: En cada pantalla, una barra superior muestra un logotipo derivado del nombre del módulo junto al nombre del módulo, una barra lateral ofrece botones para Panel, Clientes, Oportunidades y Buscar con el módulo activo resaltado, y navegar entre módulos nunca pierde datos.

**Escenarios de Aceptación**:

1. **Dada** cualquier pantalla mostrada, **cuando** el usuario mira la página, **entonces** es visible una barra superior que contiene un logotipo SVG en línea derivado del nombre del módulo y el nombre del módulo configurado.
2. **Dada** cualquier pantalla mostrada, **cuando** el usuario mira la barra lateral, **entonces** se muestran botones de módulo para Panel, Clientes, Oportunidades y Buscar usando la terminología configurada.
3. **Dado** que el usuario está en cualquier pantalla, **cuando** mira la barra lateral, **entonces** el botón del módulo activo está resaltado visualmente.
4. **Dado** que la ventana gráfica es estrecha, **cuando** se usa la aplicación en una pantalla pequeña, **entonces** la barra lateral se contrae a una columna de iconos manteniéndose utilizable y etiquetada de forma accesible.
5. **Dada** una configuración que define un color de acento, **cuando** cualquier pantalla carga, **entonces** el marco lo usa consistentemente; sin valor configurado o con un valor inválido, se usan los valores predeterminados sin errores.
6. **Dado** que el usuario navega entre módulos mediante la barra lateral, **cuando** inspecciona sus datos después, **entonces** todos los clientes y oportunidades almacenados permanecen intactos.

---

### Casos Límite

- ¿Qué ocurre cuando un usuario intenta guardar un cliente sin nombre o código obligatorio?
- ¿Cómo gestiona el sistema una búsqueda que no devuelve coincidencias?
- ¿Qué ocurre si un usuario intenta editar o eliminar un cliente que ya no existe?
- ¿Qué ocurre cuando un usuario introduce una fecha objetivo que no es una fecha de calendario válida?
- ¿Qué ocurre con las oportunidades de un cliente cuando este se elimina?
- ¿Qué ocurre cuando un usuario introduce una fecha final anterior a la fecha inicial en una oportunidad?
- ¿Qué ocurre cuando la configuración declara un campo personalizado cuya clave choca con un nombre de campo base?
- ¿Qué ocurre cuando la configuración referencia un tipo de campo desconocido o una definición de transición de ciclo de vida inválida?
- ¿Qué ocurre cuando los registros almacenados contienen valores de campos personalizados que ya no están declarados en la configuración?
- ¿Permanecen intactos los clientes y las oportunidades al navegar entre el panel, la gestión y la búsqueda?
- ¿Qué ocurre cuando el panel se abre con cero clientes o cero oportunidades (valores estadísticos)?
- ¿Qué ocurre cuando el color de acento configurado no es un valor de color válido?
- ¿Cómo mantiene la barra lateral contraída las etiquetas de módulo accesibles en ventanas estrechas?

## Requisitos *(obligatorio)*

### Requisitos Funcionales

- **FR-001**: El sistema DEBE permitir a los usuarios crear un registro de cliente con al menos un nombre y un código; el código DEBE ser único entre todos los clientes (comparación sin distinguir mayúsculas ni espacios).
- **FR-002**: El sistema DEBE permitir a los usuarios editar los detalles de un cliente existente.
- **FR-003**: El sistema DEBE permitir a los usuarios eliminar un cliente existente tras una confirmación explícita que indique cuántas oportunidades asociadas se eliminarán.
- **FR-004**: El sistema DEBE permitir a los usuarios buscar clientes por nombre, código, categoría u otras palabras clave descriptivas.
- **FR-005**: El sistema DEBE mostrar una lista clara de resultados e indicar cuándo ningún resultado coincide con una búsqueda.
- **FR-006**: El sistema DEBE presentar retroalimentación clara cuando falta información obligatoria o no se puede completar una acción.
- **FR-007**: El sistema DEBE mantener los datos de clientes consistentes tras operaciones de creación, edición y eliminación.
- **FR-008**: El sistema DEBE permitir a los usuarios añadir, editar y eliminar oportunidades de un cliente.
- **FR-009**: El sistema DEBE asociar cada oportunidad exactamente a un cliente y eliminar las oportunidades asociadas cuando el cliente se elimina.
- **FR-010**: El sistema DEBE mostrar un panel de inicio como vista inicial, con botones de acción rápida claramente etiquetados para las tareas CRM clave.
- **FR-011**: El sistema DEBE envolver cada pantalla en un marco de espacio de trabajo persistente compuesto por una barra superior con marca y una barra lateral de navegación de módulos.
- **FR-012**: La barra lateral DEBE proporcionar botones de módulo para Panel, Clientes, Oportunidades y Buscar, etiquetados desde la configuración del módulo.
- **FR-013**: El botón de módulo Clientes DEBE mostrar el contenido de gestión de clientes.
- **FR-014**: El botón de módulo Oportunidades DEBE mostrar el contenido de gestión de oportunidades.
- **FR-015**: El botón de módulo Panel DEBE devolver al usuario al panel de inicio.
- **FR-016**: La pantalla de gestión NO DEBE mostrar la lista de clientes.
- **FR-017**: La pantalla de gestión DEBE proporcionar la funcionalidad de crear, editar y eliminar clientes.
- **FR-018**: La pantalla de gestión DEBE proporcionar la funcionalidad de crear, editar y eliminar oportunidades.
- **FR-019**: El sistema DEBE navegar a una pantalla de búsqueda dedicada cuando se selecciona el botón Buscar en la barra lateral.
- **FR-020**: La pantalla de búsqueda DEBE permitir buscar clientes por nombre, código, categoría, descripción o fecha objetivo.
- **FR-021**: La pantalla de búsqueda DEBE ser accesible tanto desde la barra lateral como desde la acción rápida de buscar registros del panel.
- **FR-022**: El sistema DEBE mantener los datos de clientes y oportunidades intactos y consistentes durante la navegación entre pantallas.
- **FR-023**: El sistema DEBE cargar la configuración del módulo al arrancar y aplicarla en todas las pantallas.
- **FR-024**: El sistema DEBE retroceder a los valores predeterminados integrados (terminología base, sin campos personalizados, sin ciclo de vida) cuando no se proporciona configuración.
- **FR-025**: Ante una configuración inválida o conflictiva, el sistema DEBE arrancar con los valores predeterminados integrados y mostrar una advertencia visible que informe claramente del problema.
- **FR-026**: El sistema DEBE mostrar los campos personalizados declarados en los formularios de creación/edición con tipos de entrada que coincidan con sus tipos declarados.
- **FR-027**: El sistema DEBE validar los valores de campos personalizados, incluidos los obligatorios, antes de guardar.
- **FR-028**: El sistema DEBE incluir los valores de campos personalizados en los resultados de búsqueda y mostrarlos en listas y vistas de detalle.
- **FR-029**: El sistema DEBE derivar todas las etiquetas visibles para el usuario de la configuración del módulo.
- **FR-030**: El sistema DEBE aplicar las transiciones de estado configuradas en las oportunidades independientemente de cómo se envíe un cambio.
- **FR-031**: El sistema DEBE mantener el estado de la oportunidad como texto libre cuando no hay ciclo de vida configurado.
- **FR-032**: El sistema DEBE mantener el renderizado de listas y la búsqueda ágiles y correctos para conjuntos de datos de al menos 500 clientes.
- **FR-033**: El panel DEBE ofrecer al menos cuatro botones de acción rápida: nuevo cliente, nueva oportunidad, abrir gestión de clientes y buscar registros.
- **FR-034**: Activar la acción rápida de nuevo cliente o nueva oportunidad DEBE abrir el área de gestión correspondiente con un formulario vacío listo para introducir datos.
- **FR-035**: El panel DEBE mostrar tarjetas de estadísticas con el número de clientes y oportunidades almacenados, actualizadas cada vez que se muestra el panel.
- **FR-036**: La barra superior DEBE mostrar un logotipo derivado del nombre del módulo junto con el nombre del módulo configurado en cada pantalla.
- **FR-037**: La barra lateral DEBE resaltar visualmente el módulo activo en cada pantalla.
- **FR-038**: La configuración PUEDE definir un color de acento; el sistema DEBE aplicarlo consistentemente y retroceder de forma segura a los valores integrados cuando esté ausente o sea inválido.
- **FR-039**: En ventanas estrechas, la barra lateral DEBE contraerse a una columna de iconos manteniéndose operable.
- **FR-040**: Los valores de campos personalizados que ya no están declarados en la configuración DEBEN conservarse en el almacenamiento y ocultarse de la interfaz; si el campo se vuelve a declarar, sus valores vuelven a mostrarse.

### Requisitos de Extensibilidad *(obligaciones del módulo base)*

Los módulos personalizados construidos sobre esta base DEBEN poder:

- **XR-001**: Extender los registros de cliente y oportunidad con campos adicionales específicos del dominio sin cambiar la estructura de almacenamiento base.
- **XR-002**: Reetiquetar pantallas, botones, formularios y listas con terminología específica del módulo sin alterar el comportamiento de navegación.
- **XR-003**: Añadir reglas de validación específicas del módulo junto a las reglas de validación base.
- **XR-004**: Apoyarse en el módulo base para generación de identidad, marcas de tiempo, integridad referencial entre clientes y oportunidades, y eliminación en cascada.
- **XR-005**: Remarcar el espacio de trabajo —nombre del módulo, logotipo derivado y color de acento— únicamente mediante configuración.

### Entidades Clave *(incluir si la funcionalidad implica datos)*

- **Cliente** (Entidad): Registro de datos maestros gestionado por el módulo, que incluye nombre, código de negocio, detalles descriptivos, categoría, fecha objetivo opcional y un entity_id autogenerado. La configuración CRM típica declara campos personalizados como `industria`, `canalOrigen` y `ejecutivoAsignado`.
- **Oportunidad** (Documento): Registro comercial vinculado a un cliente por su entity_id. La configuración CRM típica aplica un ciclo de vida de embudo comercial: `Prospecto`, `Contactado`, `Propuesta Enviada`, `Negociación`, `Cerrada Ganada`, `Cerrada Perdida`.
- **ModuleConfig**: Objeto de adaptación cargado al arrancar que define el nombre del módulo, las etiquetas de terminología, las definiciones de campos personalizados y el ciclo de vida de estados de oportunidades. Consulte data-model.md para su forma completa.

## Criterios de Éxito *(obligatorio)*

### Resultados Medibles

- **SC-001**: Los usuarios pueden crear un nuevo cliente y verlo registrado en menos de 2 minutos.
- **SC-002**: Los usuarios pueden encontrar un cliente existente mediante la búsqueda en menos de 10 segundos tras introducir un término relevante.
- **SC-003**: Al menos el 90% de los usuarios de prueba pueden completar tareas de crear, editar, eliminar y buscar sin ayuda.
- **SC-004**: El sistema sigue siendo utilizable para un conjunto de datos de al menos 500 clientes sin pérdida de funcionalidad central.
- **SC-005**: Un usuario puede alcanzar las pantallas de gestión y búsqueda desde el panel o la barra lateral en menos de 10 segundos en el primer uso.
- **SC-006**: Toda la funcionalidad existente de gestión de clientes y oportunidades sigue operativa tras el rediseño del marco y el panel (sin regresiones).
- **SC-007**: Los usuarios pueden navegar entre las pantallas de panel, gestión y búsqueda sin perder ningún cliente ni oportunidad almacenado.
- **SC-008**: Un desarrollador puede producir un módulo CRM adaptado usando solo el archivo de configuración, con cero modificaciones en archivos fuente centrales.
- **SC-009**: Cada pantalla presenta el mismo marco con marca, y los usuarios pueden identificar en qué módulo están de un vistazo.
- **SC-010**: Las estadísticas mostradas en el panel siempre coinciden con el número de clientes y oportunidades almacenados.

## Suposiciones

- El módulo base gestiona datos para un único espacio de trabajo.
- La adaptación a un módulo CRM específico se realiza mediante un archivo de configuración del módulo en lugar de editar archivos fuente centrales.
- Cada cliente incluye información básica suficiente para identificación y seguimiento; los módulos personalizados aportan campos específicos del dominio como industria, canal de origen y ejecutivo asignado.
- La versión inicial se centra en la gestión central de clientes y oportunidades en lugar de capacidades avanzadas como automatización de marketing, pronósticos complejos o informes avanzados.
- La búsqueda se realiza sobre los registros de clientes almacenados.
- La pantalla de gestión consolida los formularios de clientes y oportunidades en una sola pantalla.
- La navegación entre áreas ocurre mediante una barra lateral persistente.
- El logotipo se genera como un monograma SVG en línea derivado del nombre del módulo.
- Los datos se persisten en el localStorage del navegador y no se ven afectados por la navegación entre pantallas.
- La pantalla de búsqueda se centra en encontrar y ver clientes; la edición permanece en la pantalla de gestión.
- El contenido introducido por el usuario DEBE sanitizarse antes de renderizarse en el DOM para prevenir ataques de inyección de scripts (XSS).
