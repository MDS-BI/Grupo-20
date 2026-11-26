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

### Session 2026-11-26

- Q: ¿Cómo deben guardarse los tickets de Postventa: como Documentos vinculados al cliente o como un tipo de registro independiente? → A: Como Documentos vinculados al cliente mediante `entity_id`; «Nuevo Ticket» abre un formulario conectado a los clientes ya existentes con las casillas «Cliente», «Asunto», «Categoría», «Prioridad», «Estado» y «Nota de resolución», en ese orden.
- Q: ¿Cómo deben calcularse las tarjetas «Tickets abiertos» y «En proceso» a partir de los estados «Abierto», «En revisión» y «Resuelto»? → A: «Tickets abiertos» cuenta «Abierto», «En proceso» cuenta «En revisión» y «Resueltos» cuenta «Resuelto»; una tarjeta por estado. Además, «Cliente» es un desplegable con todos los clientes existentes y cuenta con un buscador por nombre.
- Q: ¿Qué usuarios deben poder crear tickets y cambiar su estado en el apartado «Postventa»? → A: Atención al Cliente y Gerencia crean tickets y cambian cualquier estado; Ventas solo consulta los tickets de sus clientes; Marketing y visitantes no tienen acceso.
- Q: ¿Qué cambios de estado debe permitir la tabla de gestión de tickets de Postventa? → A: Cualquier estado a cualquier otro, incluido volver de «Resuelto» a «Abierto». Además, «Categoría» es un desplegable con «Soporte técnico», «Facturación», «Garantía» y «Consulta».
- Q: ¿Qué valores debe ofrecer «Prioridad» y cuándo debe ser obligatoria la «Nota de resolución»? → A: «Baja», «Media» y «Alta» sin preselección; «Nota de resolución» obligatoria solo al guardar un ticket en «Resuelto».

## Escenarios de Usuario y Pruebas _(obligatorio)_

> **Convención de actores**: los roles operativos con sesión son `n4_manager` (Gerente Comercial), `n3_marketing` (Ejecutivo de Marketing), `n2_sales` (Ejecutivo de Ventas), `n1_support` (Atención al Cliente) y `visitor` (Visitante sin sesión; solo formulario público y «Dudas y consultas»). Las historias de configuración se ejecutan antes del despliegue: el actor es el desarrollador de módulos, rol técnico que edita `MODULE_CONFIG` y que no aparece en la matriz de permisos ni realiza acciones comerciales en la aplicación.
>
> **Convención de desglose**: cuando una historia agrupaba varias necesidades, se conserva su identificador original como epígrafe y se numeran las partes como `USna`, `USnb`, etc. Los identificadores originales `US1`–`US23` y las etiquetas `[USn]` de `tasks.md` siguen siendo la trazabilidad oficial.

### Historia de Usuario 1 - Definir datos compatibles con el ERP (Prioridad: P1)

**Como** desarrollador de módulos (rol técnico que prepara `MODULE_CONFIG`; sin rango N1–N4 en la aplicación), **quiero** declarar la relación entre `Entidad` y `Documento` con identificadores generados y un vínculo `entity_id` obligatorio, **para** que cada cliente y cada interacción del CRM queden asociados al registro correcto en la ficha y en el resumen.

**Contexto comercial**: el perfil CRM Comercial representa al cliente como Entidad y a la llamada, correo, reunión, interacción de redes, consulta o venta como Documento. Sin esta relación, el historial que consulta Atención al Cliente y las cifras que revisa Gerencia no podrían atribuirse a un cliente concreto.

**Por qué esta prioridad**: define la base de datos compartida que usan US2, US3, US4, US6, US16 y US20 antes de cualquier registro comercial.

**Prueba independiente**: con el perfil CRM activo, un Ejecutivo de Ventas registra el cliente «Comercial Andina SpA» y una llamada asociada; tras recargar, el documento conserva el `entity_id` del cliente, el cliente tiene un código `CLI-###` distinto del de otro cliente y un documento con `entity_id` inexistente es rechazado sin mutar los registros.

**Criterios de aceptación**:

1. **Dado** un formulario de cliente con los datos obligatorios, **cuando** lo guarda un usuario con `entity:create`, **entonces** se persiste con `id` único, `code` generado con formato `CLI-###` y marcas `createdAt`/`updatedAt` en ISO (FR-001, FR-052).
2. **Dados** dos clientes guardados, **cuando** se comparan sus códigos normalizados, **entonces** son distintos y ningún campo de captura pide el código al usuario (FR-052).
3. **Dado** el cliente «Comercial Andina SpA», **cuando** se guarda una llamada con su `entity_id`, **entonces** la ficha del cliente muestra esa llamada tras recargar `erp_entities` y `erp_documents` (FR-009, FR-041).
4. **Dado** un `entity_id` que no existe en `erp_entities`, **cuando** se intenta guardar un documento desde la interfaz o desde `storage.js`, **entonces** la operación se rechaza, se muestra un error visible y el número de documentos almacenados no cambia (FR-009).
5. **Dado** un cliente con 3 documentos, **cuando** un usuario con `entity:delete` confirma su eliminación, **entonces** los 3 documentos se eliminan en la misma operación y no queda ningún registro con ese `entity_id` (FR-003, FR-009).

---

### Historia de Usuario 2 - Registrar clientes y contactos comerciales (Prioridad: P2)

Esta historia se divide en cuatro necesidades verificables: identidad del cliente (US2a), canal de contacto (US2b), responsable comercial (US2c) y saneamiento de fichas heredadas (US2d). El identificador `US2` se conserva como agrupador de trazabilidad.

#### US2a - Registrar la identidad comercial del cliente

**Como** Ejecutivo de Ventas (rango `n2_sales`, con `entity:create` y `entity:edit_own`), **quiero** registrar el nombre, el RUT, la fecha de nacimiento y el tipo de actividad de un cliente nuevo, **para** que Gerencia y Atención al Cliente puedan identificarlo sin ambigüedad y vincular sus futuras interacciones al contribuyente correcto.

**Criterios de aceptación**:

1. **Dado** el formulario «Nuevo Cliente», **cuando** se abre, **entonces** muestra exactamente las casillas «Nombre de Cliente», «RUT», «Fecha de nacimiento», «Canal de Contacto» con su casilla adicional, «Tipo de actividad» y «Ejecutivo Asignado», en ese orden, y no muestra «Código», «Categoría», «Descripción» ni «Nº de pedidos» (FR-051, FR-065).
2. **Dado** el desplegable «Tipo de actividad», **cuando** se abre, **entonces** ofrece solo las diez opciones de FR-066 y conserva la clave de almacenamiento `rubro`.
3. **Dado** un cliente sin nombre, RUT, fecha de nacimiento o canal de contacto, **cuando** se intenta guardar, **entonces** el guardado se rechaza con `Completa los campos obligatorios.` y el número de clientes no aumenta (FR-056).
4. **Dado** el RUT `12.345.678-9` o `12345678-9` con dígito verificador válido, **cuando** se guarda, **entonces** se normaliza sin puntos y se conserva en el registro; con dígito inválido se rechaza con `El RUT es inválido.` (FR-057).
5. **Dado** un cliente ya registrado con ese RUT normalizado, **cuando** se intenta registrar otro con puntos o sin ellos, **entonces** se rechaza con `El RUT ya está registrado.` (FR-057).
6. **Dado** un cliente válido, **cuando** se guarda, **entonces** el sistema genera un `code` único `CLI-###` que no se captura ni se muestra y la configuración activa no declara el campo `pedidos` (FR-052, FR-053).
7. **Dada** la pista de RUT, **cuando** se abre el formulario, **entonces** aparece en gris `Ej: 11.111.111-1` y no se guarda como valor (FR-062).

#### US2b - Registrar el canal de contacto preferido del cliente

**Como** Ejecutivo de Ventas (rango `n2_sales`), **quiero** elegir explícitamente el canal de contacto del cliente y capturar solo el dato correspondiente a ese canal, **para** que Atención al Cliente sepa por dónde contactarlo y no use un teléfono, correo o enlace obsoleto de otro canal.

**Criterios de aceptación**:

1. **Dado** el formulario de cliente, **cuando** se despliega «Canal de Contacto», **entonces** aparecen exactamente «Llamada», «Correo», «Reunión» y «WhatsApp», con mayúscula inicial y sin opción preseleccionada; guardar sin elegir muestra `Completa los campos obligatorios.` (FR-059, FR-063).
2. **Dado** el canal «Llamada» o «WhatsApp», **cuando** se muestra su casilla, **entonces** aparece «Teléfono» con la pista gris `Ej: +56 9 1234 5678` y el guardado valida formato telefónico (FR-060, FR-061, FR-067).
3. **Dado** el canal «Correo», **cuando** se muestra su casilla, **entonces** aparece «Correo electrónico» con la pista gris `Ej: nombre@ejemplo.cl` y el guardado valida formato de correo (FR-060, FR-061, FR-067).
4. **Dado** el canal «Reunión», **cuando** se muestra su casilla, **entonces** aparece «Lugar/Enlace de reunión» con la pista gris `Ej: Sala 2 o enlace` y el guardado exige un valor no vacío (FR-060, FR-061, FR-067).
5. **Dado** un valor vacío o con formato inválido para el canal elegido, **cuando** se guarda, **entonces** se rechaza con `Revisa el dato de contacto según el canal elegido.` (FR-061).
6. **Dado** un cliente con valores introducidos en «Llamada» y «Correo», **cuando** se guarda con canal final «Correo», **entonces** `erp_entities` conserva solo el correo y no conserva el teléfono anterior (FR-060).

#### US2c - Asignar al ejecutivo responsable del cliente

**Como** Gerente Comercial (rango `n4_manager`, con `entity:edit_any`), **quiero** asignar el «Ejecutivo Asignado» de cada cliente entre los usuarios activos de ventas o gerencia, **para** que el real mensual del equipo y los permisos de edición se apliquen al responsable real de la cuenta.

**Criterios de aceptación**:

1. **Dado** el `select` «Ejecutivo Asignado» en el formulario de cliente, **cuando** se abre, **entonces** solo lista usuarios activos de rango `n2_sales` o `n4_manager` y excluye a `atencion` y `marketing` (FR-065, FR-099).
2. **Dado** el usuario `ventas` creando «Ferretería Central», **cuando** se guarda con `ventas` como responsable, **entonces** `ventas` puede editarlo posteriormente porque `ownerId` coincide con su usuario (FR-094, FR-099).
3. **Dado** un cliente asignado a `ana.munoz`, **cuando** `ventas` intenta editarlo, **entonces** la operación se rechaza con `No tienes permiso para realizar esta acción` y el cliente permanece sin cambios (FR-094, FR-095).
4. **Dado** un ejecutivo desactivado con clientes asignados, **cuando** se abre el `select`, **entonces** ya no aparece como opción y esos clientes muestran «Sin asignar» hasta que Gerencia los reasigne (FR-077, FR-099).
5. **Dado** un cliente con ventas cerradas antes de la reasignación, **cuando** se calcula el real mensual, **entonces** se usa `assignedUserIdAtSale` y no el responsable vigente (FR-078).

#### US2d - Saneamiento de fichas de clientes heredados incompletos

**Como** Gerente Comercial (rango `n4_manager`, con `entity:edit_any`) o Ejecutivo de Ventas responsable (rango `n2_sales`, con `entity:edit_own`), **quiero** completar los campos obligatorios que faltan en un cliente heredado, **para** que su ficha deje de estar bloqueada y pueda volver a usarse en una atención comercial.

**Criterios de aceptación**:

1. **Dado** un cliente guardado sin fecha de nacimiento, canal de contacto o RUT, o con RUT inválido o repetido, **cuando** cualquier usuario con `search:view` intenta abrir su ficha, **entonces** la consulta se bloquea y se enumeran exactamente los campos pendientes (FR-058).
2. **Dada** una ficha bloqueada, **cuando** la abre un usuario sin permiso de edición sobre ese cliente, **entonces** ve la explicación de los campos pendientes y no ve un botón que permita guardar cambios (FR-058, FR-094).
3. **Dada** una ficha bloqueada, **cuando** la abre un usuario con `entity:edit_own` o `entity:edit_any` sobre ese cliente, **entonces** puede editar solo los campos necesarios y el guardado con valores válidos desbloquea la consulta (FR-058).
4. **Dado** un cliente heredado con fecha de nacimiento fuera de rango, **cuando** se edita, **entonces** el sistema conserva el valor anterior hasta que se corrija y no permite guardar mientras siga siendo inválido (FR-050, FR-058).

---

### Historia de Usuario 3 - Consultar antecedentes del cliente (Prioridad: P1)

Se desglosa en localización de la ficha (US3a) y revisión cronológica del historial (US3b), porque responder una consulta y analizar la relación comercial requieren verificaciones distintas.

#### US3a - Localizar la ficha de un cliente desde la búsqueda

**Como** Atención al Cliente (rango `n1_support`, con `search:view` y `entity:view_any`), **quiero** encontrar a un cliente por su nombre visible o por un dato de contacto ya registrado, **para** responder su consulta usando los datos correctos sin pedirle que repita su información.

**Criterios de aceptación**:

1. **Dado** el cliente «Comercial Andina SpA» registrado, **cuando** busco `Comercial`, **entonces** el resultado contiene ese cliente y ningún otro que no coincida (FR-004, FR-055).
2. **Dada** una búsqueda por un valor de «Categoría», «Descripción» o por el código oculto `CLI-###`, **cuando** se envía, **entonces** no se devuelve ningún cliente y se muestra exactamente `No se encontraron resultados.` (FR-051, FR-055).
3. **Dado** un resultado de búsqueda, **cuando** selecciono «Ver ficha», **entonces** se abren los datos del cliente y su historial sin abrir el formulario de edición (FR-041).
4. **Dado** un cliente heredado incompleto, **cuando** intento abrir su ficha, **entonces** veo los nombres de los campos pendientes y no se muestran sus datos comerciales como si estuvieran validados (FR-058).

#### US3b - Revisar el historial comercial del cliente

**Como** Atención al Cliente (rango `n1_support`, con `document:read`), **quiero** consultar en la ficha las llamadas, correos, consultas, reuniones y ventas asociadas al cliente en orden de fecha, **para** dar una respuesta continua basada en lo que ya se conversó con él.

**Criterios de aceptación**:

1. **Dado** un cliente con una llamada del 3 de noviembre y un correo del 10 de noviembre, **cuando** abro su ficha, **entonces** la llamada aparece antes que el correo y ambos muestran fecha, tipo y nota (FR-042).
2. **Dado** que Gerencia edita la nota de una interacción en la pantalla de gestión, **cuando** vuelvo a abrir la ficha, **entonces** aparece la nota actualizada sin recargar el registro desde otra fuente (FR-043).
3. **Dado** un cliente sin documentos, **cuando** abro su ficha, **entonces** sus datos siguen visibles y el historial muestra un estado vacío explícito (FR-041).
4. **Dado** un cliente con documentos de redes sociales y «Dudas y consultas», **cuando** consulto su ficha, **entonces** esos documentos aparecen junto al resto del historial con la plataforma o el canal que corresponde (FR-081).
5. **Dado** un usuario de Marketing con `document:read`, **cuando** abre la misma ficha, **entonces** ve el mismo historial; un usuario sin `document:read` no puede abrirlo (FR-094).

---

### Historia de Usuario 4 - Gestionar entidades y documentos en una pantalla dedicada (Prioridad: P1)

Se desglosa en acceso desde el panel (US4a), alta/edición/baja de clientes (US4b) y gestión de sus documentos desde la misma pantalla (US4c). US11 detalla los campos de la interacción; aquí se especifica quién puede operarlos y desde dónde.

#### US4a - Acceder a la gestión de clientes e interacciones desde el panel

**Como** Ejecutivo de Ventas (rango `n2_sales`) o Gerente Comercial (rango `n4_manager`), **quiero** abrir las pestañas «Clientes» e «Interacciones» desde las acciones rápidas del panel, **para** realizar altas y correcciones sin confundir la gestión con la búsqueda de fichas.

**Criterios de aceptación**:

1. **Dado** el panel principal, **cuando** lo abre un usuario con `entity:create`, **entonces** ve las acciones «Nuevo Cliente», «Nueva interacción», «Gestionar clientes» y «Gestionar interacciones», sin «Abrir Marketing» (FR-033, FR-091).
2. **Dado** un usuario con `search:view` pero sin `entity:create` (Atención al Cliente), **cuando** abre el panel, **entonces** no ve «Nuevo Cliente», «Nueva interacción» ni las acciones de gestión, y solo ve «Buscar registros» (FR-033, FR-094).
3. **Dado** el panel, **cuando** activo «Gestionar clientes» o «Gestionar interacciones», **entonces** se abre la pantalla de gestión en la pestaña correspondiente y la barra lateral NO muestra esos apartados (FR-013, FR-014, FR-016).
4. **Dado** un enlace profundo `?view=manage-entity` o `?view=manage-document`, **cuando** se abre, **entonces** se muestra la misma pantalla de gestión y no la lista de búsqueda (FR-097).
5. **Dado** el botón «Panel» de la barra lateral, **cuando** se activa desde gestión, **entonces** vuelve al panel y el número de clientes e interacciones almacenados no cambia (FR-015, FR-022).

#### US4b - Corregir y dar de baja clientes en la pantalla de gestión

**Como** Gerente Comercial (rango `n4_manager`, con `entity:edit_any` y `entity:delete`), **quiero** editar o eliminar cualquier cliente y confirmar cuántas interacciones se borrarán con él, **para** retirar cuentas cerradas o corregir datos sin dejar documentos huérfanos.

**Criterios de aceptación**:

1. **Dado** el cliente «Comercial Andina SpA» con 4 interacciones, **cuando** intento eliminarlo, **entonces** la confirmación indica exactamente `4` documentos y, sin confirmación, no se elimina nada (FR-003).
2. **Dada** la confirmación aceptada, **cuando** se ejecuta la baja, **entonces** se eliminan el cliente y sus 4 interacciones en una sola operación y `erp_documents` no conserva su `entity_id` (FR-009).
3. **Dada** una orden de edición sobre un cliente inexistente, **cuando** se envía desde la interfaz o desde `storage.js`, **entonces** falla sin mutar datos y muestra un error visible (FR-007, FR-095).
4. **Dado** un Ejecutivo de Ventas con `entity:edit_own`, **cuando** edita su cliente «Ferretería Central», **entonces** el cambio se guarda; al intentar eliminarlo, la operación se rechaza con `No tienes permiso para realizar esta acción` (FR-094, FR-096).

#### US4c - Operar documentos vinculados desde la pestaña de gestión

**Como** Gerente Comercial (rango `n4_manager`, con `document:edit_any` y `document:delete`), **quiero** crear, editar y eliminar documentos seleccionando el cliente al que pertenecen desde la pestaña «Interacciones», **para** que cada llamada, correo o venta quede atribuida a la cuenta correcta.

**Criterios de aceptación**:

1. **Dado** el cliente «Comercial Andina SpA», **cuando** creo una interacción desde la pestaña de documentos, **entonces** el formulario exige seleccionar ese cliente y el documento guardado queda con su `entity_id` (FR-008, FR-009).
2. **Dado** un documento existente, **cuando** edito su fecha, nota o estado permitido, **entonces** el cambio aparece en la ficha del cliente al consultarla de nuevo (FR-008, FR-043).
3. **Dada** una interacción vacía en campos obligatorios, **cuando** se guarda, **entonces** se rechaza con `Completa los campos obligatorios.` (FR-006).
4. **Dado** un usuario sin `document:delete` que intenta borrar una interacción desde la interfaz o desde `storage.js`, **cuando** ejecuta la acción, **entonces** recibe `No tienes permiso para realizar esta acción` y el documento permanece (FR-095, FR-096).

---

### Historia de Usuario 5 - Definir un perfil de configuración del módulo (Prioridad: P1)

**Como** desarrollador de módulos (rol técnico que edita `src/module-config.js`; sin rango N1–N4 en la aplicación), **quiero** declarar en un único `MODULE_CONFIG` la identidad «CRM Comercial», las etiquetas Cliente/Interacción, los campos propios y el ciclo de vida del módulo, **para** que el equipo comercial trabaje con la terminología de su negocio sin que el equipo modifique el código central.

**Contexto comercial**: US7, US8 y US13 detallan cada clase de personalización; esta historia solo garantiza que el perfil se cargue al arrancar, se aplique en todas las vistas y retroceda con aviso cuando sea inválido.

**Por qué esta prioridad**: es prerrequisito de las historias de terminología, campos, fecha y estados, y evita que cada cambio comercial obligue a tocar archivos fuente compartidos.

**Prueba independiente**: con `MODULE_CONFIG` del perfil CRM activo, el marco y el panel muestran «CRM Comercial» y «Cliente/Interacción»; al dejar `MODULE_CONFIG = null`, la aplicación arranca con «Entidad/Documento» sin errores; con una configuración conflictiva, muestra un banner y sigue operable con los valores integrados.

**Criterios de aceptación**:

1. **Dado** el perfil CRM activo, **cuando** carga la aplicación, **entonces** el título del documento, la barra superior y el panel muestran el `moduleName` configurado y las etiquetas «Cliente» e «Interacción» en todas las vistas (FR-023, FR-029).
2. **Dado** un perfil con `labels`, `customFields`, `statusLifecycle` y `theme.accentColor`, **cuando** arranca la aplicación, **entonces** los cuatro bloques se aplican sin editar `src/app.js`, `src/storage.js` ni componentes (FR-023, XR-001–XR-005).
3. **Dado** `MODULE_CONFIG = null`, **cuando** arranca la aplicación, **entonces** se usan «Entidad» y «Documento», sin campos personalizados ni ciclo de vida, y la búsqueda y la gestión siguen disponibles (FR-024).
4. **Dada** una configuración con clave de campo personalizado que choca con un campo base, tipo desconocido o transición a un estado no declarado, **cuando** arranca, **entonces** muestra `#config-warning` con el motivo, aplica `DEFAULT_CONFIG` y no bloquea la aplicación (FR-025).
5. **Dado** un color de acento ausente o inválido, **cuando** arranca, **entonces** se aplica el color integrado sin error y el resto del perfil CRM permanece activo (FR-038).

---

### Historia de Usuario 6 - Consultar indicadores de Gestión Comercial (Prioridad: P2)

> La prioridad se corrige de `P6` a `P2`: el rango permitido es P1/P2 y el resumen depende de US2, US3, US11 y US13.

Se desglosa en lectura de pendientes del equipo (US6a) y acceso al detalle del cliente (US6b). US15 mantiene las tarjetas del panel; aquí se trata del resumen de seguimientos que usa Gerencia.

#### US6a - Priorizar los seguimientos pendientes del equipo

**Como** Gerente Comercial (rango `n4_manager`, con `summary:view_all`), **quiero** ver el total de clientes, el total de interacciones y los documentos pendientes agrupados por cliente en el resumen, **para** decidir qué cuenta requiere atención hoy y comprobar el trabajo de `ventas` y `ana.munoz`.

**Criterios de aceptación**:

1. **Dado** 47 clientes, 120 interacciones y 47 seguimientos pendientes —12 de `ventas` y 35 de `ana.munoz`—, **cuando** abre el resumen, **entonces** ve exactamente `47`, `120` y `47`, y cada pendiente aparece identificado por cliente (FR-044, FR-045).
2. **Dado** que se crea una interacción con estado «pendiente», **cuando** se vuelve a abrir el resumen, **entonces** el total de interacciones aumenta en 1 y el de pendientes aumenta en 1 sin recarga (FR-045).
3. **Dado** que se cambia un seguimiento a «Cerrado ganado», **cuando** se consulta el resumen, **entonces** el total de pendientes baja en 1 y el documento no se cuenta dos veces (FR-044).
4. **Dado** un `statusLifecycle` que marca `en_recontacto` como pendiente, **cuando** se calcula el resumen, **entonces** se cuentan esos estados y no solo el texto `pendiente`; sin ciclo de vida, se cuenta el estado normalizado `pendiente` (FR-044).
5. **Dado** el perfil CRM activo, **cuando** se muestra el resumen, **entonces** las etiquetas son «Clientes» e «Historial/Ficha» y no aparecen «Entidades» ni «Documentos» (FR-029).
6. **Dado** un resumen vacío, **cuando** se abre, **entonces** los tres indicadores muestran `0` y se indica registrar el primer cliente (FR-046).
7. **Dado** un Ejecutivo de Marketing o Atención al Cliente, **cuando** intenta abrir `?view=summary`, **entonces** ve «Acceso denegado» y vuelve al Panel (FR-097).

#### US6b - Revisar el detalle de un cliente con seguimiento pendiente

**Como** Gerente Comercial (rango `n4_manager`, con `summary:view_all` y `entity:view_any`), **quiero** abrir la ficha de un cliente listado como pendiente en el resumen, **para** revisar su historial y asignar la siguiente acción comercial sin buscarlo de nuevo.

**Criterios de aceptación**:

1. **Dado** el cliente «Comercial Andina SpA» con un seguimiento pendiente en el resumen, **cuando** selecciono su fila, **entonces** se abre su ficha con los mismos datos y documentos que muestra la búsqueda (FR-041, FR-045).
2. **Dado** el Ejecutivo de Ventas `ventas` con `summary:view_own`, **cuando** abre el resumen, **entonces** ve solo sus 12 pendientes y no los 35 de `ana.munoz` (FR-094).
3. **Dado** un cliente sin pendientes, **cuando** se abre desde el resumen, **entonces** su historial se muestra igual que desde la búsqueda y el contador de pendientes de ese cliente es `0` (FR-044, FR-045).

---

### Historia de Usuario 7 - Reetiquetar pantallas desde la configuración (Prioridad: P1)

**Como** desarrollador de módulos (rol técnico que edita `MODULE_CONFIG`; sin rango N1–N4), **quiero** que las pestañas, botones, encabezados y mensajes del CRM deriven de `labels` y de la regla de fecha activa, **para** que un Ejecutivo de Ventas vea siempre «Cliente», «Interacción» y «Fecha de nacimiento» en lugar de términos del módulo base.

**Por qué esta prioridad**: depende de US5 y evita que la terminología cambie según la pantalla, lo que produciría instrucciones contradictorias al registrar o buscar clientes.

**Prueba independiente**: con `Entidad→Cliente` y `Documento→Interacción`, las cinco vistas permitidas (Panel, Buscar, Resumen, Marketing y gestión) muestran esos términos, «Nuevo Cliente» y «Fecha de nacimiento», y navegar entre ellas no cambia ningún registro.

**Criterios de aceptación**:

1. **Dado** el perfil CRM activo, **cuando** cargo Panel, Buscar, gestión, ficha y Resumen, **entonces** no aparece el texto «Entidad» ni «Documento» en pestañas, botones, encabezados ni estados vacíos (FR-029).
2. **Dado** un mapeo alternativo `Documento→Pedido de Venta`, **cuando** carga la vista de gestión, **entonces** pestañas y mensajes usan «Pedido de Venta» y la navegación entre Panel y búsqueda sigue igual (XR-002).
3. **Dado** `MODULE_CONFIG = null`, **cuando** carga cualquier pantalla, **entonces** aparecen los términos integrados «Entidad» y «Documento» (FR-024).
4. **Dado** el perfil de clientes, **cuando** se muestran formulario, lista de resultados, ficha, búsqueda y filtros, **entonces** los cinco lugares dicen «Fecha de nacimiento» y ninguno dice «Fecha objetivo» (FR-047).
5. **Dado** el botón de creación de clientes, **cuando** se muestra en el panel o en el formulario, **entonces** dice exactamente «Nuevo Cliente» y no «Nueva cliente» (FR-064).

---

### Historia de Usuario 8 - Declarar campos personalizados para los registros (Prioridad: P1)

Se desglosa en declaración y uso de campos (US8a) y conservación de valores históricos retirados (US8b), porque el riesgo comercial es distinto: capturar datos nuevos y no borrar los antiguos.

#### US8a - Capturar y consultar campos propios del cliente y de la interacción

**Como** desarrollador de módulos (rol técnico que edita `MODULE_CONFIG`; sin rango N1–N4), **quiero** declarar campos adicionales —por ejemplo, `rut`, `canal_contacto`, `tipo_interaccion`, `plataforma` o `importe`— con tipo, obligatoriedad y visibilidad, **para** que el Ejecutivo de Ventas capture los datos que el negocio necesita y Gerencia los consulte en fichas, listas y búsqueda sin código nuevo.

**Criterios de aceptación**:

1. **Dado** un campo numérico obligatorio declarado en `customFields.entity`, **cuando** se abre el formulario de cliente, **entonces** aparece como entrada numérica y dejarlo vacío muestra `Completa los campos obligatorios.` al guardar (FR-026, FR-027).
2. **Dado** un campo con valor guardado, **cuando** se abre la lista de resultados o la ficha, **entonces** el valor aparece con su etiqueta configurada (FR-028).
3. **Dado** un campo declarado como buscable, **cuando** se busca un término que coincide con su valor, **entonces** se devuelve el cliente correspondiente y no los que solo coinciden con campos ocultos (FR-004, FR-028).
4. **Dado** un grupo condicional declarado con `when`/`group`, **cuando** cambia el canal seleccionado, **entonces** solo se valida y se guarda el campo activo del grupo (FR-060, FR-061).
5. **Dado** `MODULE_CONFIG = null`, **cuando** se ejecuta la aplicación, **entonces** no se renderiza ningún campo personalizado y el comportamiento es el del módulo base (FR-024).

#### US8b - Conservar los valores de campos retirados de la configuración

**Como** desarrollador de módulos (rol técnico que edita `MODULE_CONFIG`; sin rango N1–N4), **quiero** que los valores de campos que dejan de declararse permanezcan en `localStorage` pero dejen de mostrarse y buscarse, **para** que una corrección del perfil no destruya el historial comercial de los clientes ya registrados.

**Criterios de aceptación**:

1. **Dado** un cliente con valor en `categoria` y `descripcion`, **cuando** el perfil CRM deja de declararlos, **entonces** los valores siguen en `erp_entities` y no aparecen en formulario, lista, ficha ni búsqueda (FR-040, FR-054).
2. **Dado** el campo `pedidos` eliminado de `customFields.entity`, **cuando** se guarda un cliente, **entonces** el sistema no lo registra ni lo valida como campo del cliente (FR-053).
3. **Dada** una búsqueda por el valor oculto de `categoria` o `descripcion`, **cuando** se envía, **entonces** se muestra exactamente `No se encontraron resultados.` y el registro oculto no se devuelve (FR-055).
4. **Dado** un campo retirado que vuelve a declararse, **cuando** se recarga la aplicación, **entonces** su valor histórico vuelve a mostrarse sin haber sido borrado (FR-040).

---

### Historia de Usuario 9 - Buscar y encontrar entidades rápidamente (Prioridad: P2)

**Como** Atención al Cliente (rango `n1_support`, con `search:view`) o Ejecutivo de Ventas (rango `n2_sales`), **quiero** introducir un término y obtener solo los clientes cuyos campos visibles coinciden, **para** localizar la ficha correcta durante una llamada sin revisar uno por uno los registros de la cartera.

**Por qué esta prioridad**: depende de US2 y US7; con 500 clientes y 500 interacciones, SC-004 exige que la búsqueda termine en menos de 2 segundos.

**Prueba independiente**: con 500 clientes y 500 interacciones cargados, buscar `Andina` devuelve solo «Comercial Andina SpA» en menos de 2 segundos; buscar `CategoríaX` muestra exactamente `No se encontraron resultados.`

**Criterios de aceptación**:

1. **Dados** 500 clientes, **cuando** busco `Andina`, **entonces** el resultado contiene solo los clientes con ese texto en nombre, fecha de nacimiento o campo personalizado visible (FR-004, FR-055).
2. **Dada** una búsqueda por «Categoría», «Descripción» o código `CLI-###`, **cuando** se envía, **entonces** no se devuelve ningún cliente aunque el valor exista oculto en almacenamiento (FR-051, FR-055).
3. **Dada** una búsqueda sin coincidencias, **cuando** se envía, **entonces** se muestra exactamente `No se encontraron resultados.` y puedo volver a intentarlo sin que cambie ningún registro (FR-005, FR-006).
4. **Dado** el conjunto de 500 entidades y 500 documentos, **cuando** busco y renderizo resultados, **entonces** la operación termina en menos de 2 segundos y al menos el 95% de las mediciones en escritorio terminan en 200 ms o menos (FR-032, SC-004).
5. **Dado** un visitante sin sesión, **cuando** intenta usar la búsqueda interna, **entonces** se le redirige al inicio de sesión y solo conserva el formulario público y «Dudas y consultas» (FR-097).

---

### Historia de Usuario 10 - Registrar una fecha objetivo (Prioridad: P2)

Se desglosa en fecha opcional del módulo base (US10a), fecha de nacimiento del cliente (US10b) y corrección de fechas heredadas (US10c), porque las reglas de validación cambian según el perfil activo.

#### US10a - Registrar una fecha objetivo opcional en el módulo base

**Como** Ejecutivo de Ventas (rango `n2_sales`) usando un perfil del módulo base donde la fecha no es obligatoria, **quiero** fijar una fecha objetivo en una entidad, **para** identificar en la lista qué registro tiene un vencimiento pendiente y cuál no.

**Criterios de aceptación**:

1. **Dado** el formulario de una entidad del perfil base, **cuando** dejo la fecha objetivo vacía y guardo, **entonces** la entidad se guarda sin fecha (FR-047, XR-003).
2. **Dada** una fecha válida introducida, **cuando** guardo, **entonces** aparece en la lista junto a esa entidad y se conserva tras recargar (FR-004).
3. **Dado** un día inexistente para el mes elegido, **cuando** guardo, **entonces** el sistema rechaza el valor con una explicación clara y la entidad permanece sin cambios.

#### US10b - Registrar la fecha de nacimiento del cliente

**Como** Ejecutivo de Ventas (rango `n2_sales`, con `entity:create`), **quiero** capturar la «Fecha de nacimiento» del cliente dentro del rango permitido, **para** cumplir el perfil CRM y evitar que una ficha quede bloqueada por un dato inválido.

**Criterios de aceptación**:

1. **Dado** el formulario de cliente, **cuando** se muestra la casilla de fecha, **entonces** dice «Fecha de nacimiento» y exige un valor (FR-047, FR-056).
2. **Dada** la fecha `1910-01-01` o la fecha local actual, **cuando** guardo, **entonces** ambas se aceptan; `1909-12-31`, una fecha futura o `2026-02-30` se rechazan con una explicación clara (FR-047).
3. **Dado** el formulario abierto antes de la medianoche local, **cuando** cambia el día según la hora del dispositivo, **entonces** el límite máximo pasa a ser la nueva fecha local sin recargar y sin borrar el borrador (FR-048, FR-049).
4. **Dado** un cliente sin fecha de nacimiento, **cuando** se guarda, **entonces** se rechaza con `Completa los campos obligatorios.` (FR-056).

#### US10c - Corregir fechas heredadas fuera de rango

**Como** Gerente Comercial (rango `n4_manager`, con `entity:edit_any`), **quiero** conservar la fecha de nacimiento histórica de un cliente mientras corrijo su ficha, **para** no perder el dato original pero dejar el registro válido antes de seguir usándolo comercialmente.

**Criterios de aceptación**:

1. **Dado** un cliente con fecha anterior a 1910 o inválida, **cuando** se consulta su ficha, **entonces** el valor se muestra igual y se indica que debe corregirse al editar (FR-050).
2. **Dado** ese mismo cliente, **cuando** intento guardar sin corregir la fecha, **entonces** el guardado se rechaza y no se modifica ningún otro campo (FR-050).
3. **Dado** un Ejecutivo de Ventas sin permiso sobre ese cliente, **cuando** intenta corregirlo desde `storage.js`, **entonces** recibe `No tienes permiso para realizar esta acción` y la fecha permanece sin cambios (FR-095, FR-096).

---

### Historia de Usuario 11 - Registrar los detalles de documentos de una entidad (Prioridad: P2)

Se desglosa en captura de la interacción (US11a) y corrección según rango (US11b). US4c especifica el acceso desde la pantalla de gestión; aquí se especifican los datos y quién puede modificarlos.

#### US11a - Registrar una interacción comercial con el cliente

**Como** Atención al Cliente (rango `n1_support`, con `document:create`) o Ejecutivo de Ventas (rango `n2_sales`, con `document:create`), **quiero** guardar tipo de interacción, fecha, nota y, cuando corresponde, importe y moneda vinculados al cliente, **para** dejar constancia de cada contacto y que Gerencia pueda contabilizar las ventas cerradas.

**Criterios de aceptación**:

1. **Dado** el cliente «Comercial Andina SpA», **cuando** registramos una «Llamada» el 3 de noviembre con nota «Confirmación de horario de entrega», **entonces** el documento queda guardado con `entity_id` de ese cliente y aparece en su ficha (FR-008, FR-009).
2. **Dado** un documento de venta, **cuando** se capturan serie/folio, importe, moneda, condiciones y tipo de interacción, **entonces** esos valores se guardan como campos personalizados declarados y no alteran la estructura base del Documento (XR-001).
3. **Dado** `startDate` y `endDate`, **cuando** `endDate` es anterior a `startDate`, **entonces** el guardado se rechaza con un error visible y el documento permanece sin cambios.
4. **Dado** un documento sin campos obligatorios, **cuando** se guarda, **entonces** se rechaza con `Completa los campos obligatorios.` (FR-006).
5. **Dado** un usuario `atencion`, **cuando** intenta registrar una interacción de tipo «Reunión», **entonces** la acción se rechaza con `No tienes permiso para realizar esta acción` y solo puede registrar «Llamada» o «Correo» (matriz de permisos).

#### US11b - Corregir y cambiar el estado de una interacción según el rango

**Como** Ejecutivo de Ventas (rango `n2_sales`, con `document:edit_own` y `document:transition_own`), **quiero** editar las interacciones de mis clientes y cambiar su estado a «Cerrado ganado», **para** que el real mensual del equipo y el embudo comercial reflejen las ventas realmente ganadas.

**Criterios de aceptación**:

1. **Dado** el cliente «Ferretería Central» asignado a `ventas`, **cuando** cambio una interacción a «Cerrado ganado», **entonces** el cambio se guarda y el importe entra en el real mensual de `ventas` (FR-078).
2. **Dado** el cliente «Transportes del Norte Ltda.» asignado a `ana.munoz`, **cuando** `ventas` intenta cambiar el estado, **entonces** recibe `No tienes permiso para realizar esta acción` y el estado no cambia (FR-094, FR-096).
3. **Dado** un usuario `atencion`, **cuando** intenta cambiar el estado de una interacción existente, **entonces** la acción se bloquea con el mismo mensaje exacto (matriz de permisos).
4. **Dado** un Gerente Comercial, **cuando** elimina una interacción de cualquier cliente, **entonces** la ficha deja de mostrarla y el contador de documentos baja en 1 (FR-008, FR-094).
5. **Dado** un ciclo de vida configurado, **cuando** se intenta una transición no permitida desde la interfaz o desde `storage.js`, **entonces** se rechaza con una explicación y el estado no cambia (FR-030).

---

### Historia de Usuario 12 - Buscar entidades en una pantalla dedicada (Prioridad: P2)

**Como** Atención al Cliente (rango `n1_support`, con `search:view`), **quiero** abrir una pantalla de búsqueda separada de la gestión y ver solo resultados con acceso a la ficha, **para** atender una consulta telefónica sin que los formularios de alta o edición ocupen la vista.

**Por qué esta prioridad**: US9 define qué coincide; esta historia define dónde se muestra el resultado y garantiza que la búsqueda no se convierta en edición accidental.

**Prueba independiente**: desde la barra lateral y desde la acción rápida del panel se abre `Buscar`, se busca `Ferretería Central`, se abre su ficha y se vuelve al Panel sin que cambie ningún registro.

**Criterios de aceptación**:

1. **Dado** el botón «Buscar» de la barra lateral, **cuando** se activa, **entonces** se abre la pantalla dedicada sin formularios de creación ni edición de clientes (FR-019).
2. **Dada** la acción rápida «Buscar registros» del panel, **cuando** se activa, **entonces** abre la misma pantalla y deja el campo de búsqueda enfocado (FR-021, FR-034).
3. **Dado** el término `Ferretería`, **cuando** se busca, **entonces** solo aparecen clientes coincidentes con botón «Ver ficha» y sin opciones de editar o eliminar en la lista (FR-005, FR-041).
4. **Dado** un término que solo coincide con `categoria` o `descripcion` ocultas, **cuando** se busca, **entonces** se muestra exactamente `No se encontraron resultados.` (FR-055).
5. **Dado** el botón «Panel», **cuando** se activa desde búsqueda, **entonces** vuelve al panel de inicio y el número de clientes e interacciones es idéntico al anterior (FR-015, FR-022).

---

### Historia de Usuario 13 - Configurar el ciclo de vida de estados de documentos (Prioridad: P2)

Se desglosa en declaración del ciclo (US13a, rol técnico) y aplicación del estado por el usuario comercial (US13b), porque la regla se define antes del despliegue pero se verifica al registrar una venta.

#### US13a - Declarar estados y transiciones de las interacciones

**Como** desarrollador de módulos (rol técnico que edita `MODULE_CONFIG`; sin rango N1–N4), **quiero** declarar los estados permitidos, sus transiciones y qué estados cuentan como pendientes, **para** que el embudo y el resumen coincidan con el proceso comercial real de la empresa.

**Criterios de aceptación**:

1. **Dado** un `statusLifecycle` con estados `cotizacion`, `pedido`, `facturado` y transiciones `cotizacion→pedido`, `pedido→facturado`, **cuando** carga la aplicación, **entonces** solo esos estados pueden asignarse a un documento (FR-030).
2. **Dado** `pendingStates: ['pendiente']`, **cuando** se calcula el resumen, **entonces** solo ese estado declarado se cuenta como pendiente (FR-044).
3. **Dado** un ciclo sin `pendingStates`, **cuando** se calcula el resumen, **entonces** el contador de pendientes es `0` a menos que exista coincidencia con el texto configurable declarado (FR-044).
4. **Dada** una transición que referencia un estado no declarado, **cuando** arranca la aplicación, **entonces** se aplica `DEFAULT_CONFIG`, aparece `#config-warning` y no se permite la transición inválida (FR-025).
5. **Dado** `MODULE_CONFIG = null`, **cuando** se edita el estado de un documento, **entonces** se mantiene texto libre sin lista fija (FR-031).

#### US13b - Cambiar el estado de una interacción dentro del ciclo permitido

**Como** Ejecutivo de Ventas (rango `n2_sales`, con `document:transition_own`), **quiero** avanzar el estado de las interacciones de mis clientes solo a los estados siguientes permitidos, **para** que una cotización no aparezca como venta ganada antes de cerrarse.

**Criterios de aceptación**:

1. **Dado** un documento en `cotizacion`, **cuando** abro el selector de estado, **entonces** solo aparece `pedido` como estado alcanzable y no aparece `facturado` (FR-030).
2. **Dado** un intento de pasar de `cotizacion` a `facturado` desde la consola o desde `storage.js`, **cuando** se envía, **entonces** se rechaza con una explicación clara y el documento sigue en `cotizacion` (FR-030, FR-095).
3. **Dado** un documento en `facturado`, **cuando** se muestra en lista o ficha, **entonces** el estado actual es visible sin abrir el formulario (SC-022).
4. **Dado** un usuario con `atencion` que intenta cambiar cualquier estado, **cuando** ejecuta la acción, **entonces** recibe `No tienes permiso para realizar esta acción` (matriz de permisos).

---

### Historia de Usuario 14 - Marco de espacio de trabajo ERP con marca (Prioridad: P1)

Se desglosa en navegación por rango (US14a) e identidad visual accesible (US14b), porque un empleado necesita llegar a sus módulos y la empresa necesita reconocer el CRM en todas las vistas.

#### US14a - Navegar por los módulos permitidos según el rango

**Como** Gerente Comercial (rango `n4_manager`), **quiero** tener en cada pantalla una barra lateral con Panel, Buscar, Resumen y Marketing, con el módulo activo resaltado, **para** pasar de la atención de un cliente al resumen del equipo sin perder el registro en el que trabajaba.

**Criterios de aceptación**:

1. **Dado** `gerente` con sesión, **cuando** abre cualquier pantalla, **entonces** ve Panel, Buscar, Resumen y Marketing, con «Marketing» en la barra lateral y sin botón «Abrir Marketing» en el panel (FR-012, FR-091).
2. **Dado** `ventas`, **cuando** abre la barra lateral, **entonces** ve Panel, Buscar y Resumen, pero no Marketing; `atencion` ve Panel y Buscar, pero no Resumen ni Marketing (FR-012, FR-094).
3. **Dado** `marketing`, **cuando** abre la barra lateral, **entonces** ve Panel, Buscar y Marketing, pero no Resumen ni «Gestionar usuarios» (FR-012, FR-094, FR-098).
4. **Dado** un módulo activo, **cuando** se navega a otro, **entonces** el botón correspondiente queda resaltado y el número de clientes e interacciones en `localStorage` no cambia (FR-037, FR-022).
5. **Dado** un formulario con cambios sin guardar, **cuando** intento cambiar de módulo, **entonces** aparece una confirmación y solo navego si confirmo descartar los cambios (FR-022).

#### US14b - Identificar el CRM y usar la barra en pantallas estrechas

**Como** Ejecutivo de Marketing (rango `n3_marketing`) que abre el CRM desde un equipo portátil, **quiero** ver el nombre «CRM Comercial», su monograma y el color de acento en todas las vistas, además de una barra contraíble con etiquetas accesibles, **para** reconocer la aplicación y seguir usando la navegación en una ventana de 640 px o menos.

**Criterios de aceptación**:

1. **Dada** cualquier pantalla, **cuando** se muestra la barra superior, **entonces** contiene un logotipo SVG en línea derivado de `moduleName` y el texto «CRM Comercial» (FR-036).
2. **Dado** `theme.accentColor` válido, **cuando** carga cualquier vista, **entonces** el color se aplica a resaltados y controles principales; con valor inválido se usa el color integrado y aparece `#config-warning` (FR-038).
3. **Dada** una ventana de 640 px o menos, **cuando** se usa la barra lateral, **entonces** se contrae a una columna de iconos con nombres accesibles y los cuatro módulos permitidos siguen alcanzables (FR-039, SC-020).
4. **Dado** un usuario con `marketing` que abre `?view=users-admin`, **cuando** se resuelve la ruta, **entonces** ve «Acceso denegado» y vuelve al Panel sin ver la administración de usuarios (FR-097, FR-098).

---

### Historia de Usuario 15 - Panel de inicio con acciones rápidas y estadísticas (Prioridad: P1)

Se desglosa en acciones rápidas filtradas por rango (US15a) y cifras derivadas de los registros (US15b). Los atajos propios de Marketing se especifican en US16d.

#### US15a - Iniciar la jornada con las acciones permitidas

**Como** Ejecutivo de Ventas (rango `n2_sales`), **quiero** encontrar en el panel «Nuevo Cliente», «Nueva interacción», «Gestionar clientes», «Gestionar interacciones» y «Buscar registros», **para** registrar una visita comercial o localizar una ficha sin abrir primero otros módulos.

**Criterios de aceptación**:

1. **Dado** un usuario con permisos completos, **cuando** abre la URL raíz, **entonces** el panel contiene exactamente cinco acciones rápidas y no contiene «Abrir Marketing» (FR-033, FR-091).
2. **Dado** `ventas`, **cuando** abre el panel, **entonces** ve las cinco acciones; dado `atencion`, ve solo «Buscar registros» porque carece de `entity:create` y `document:create` (FR-033, FR-094).
3. **Dado** `marketing`, **cuando** abre el panel, **entonces** no ve «Nuevo Cliente», «Nueva interacción» ni las acciones de gestión; crea prospectos desde Marketing, no desde el panel (FR-033, FR-094).
4. **Dada** la acción «Nuevo Cliente», **cuando** se activa, **entonces** se abre el área de gestión con el formulario vacío; dada «Buscar registros», el foco queda en `#search-input` (FR-034, FR-021).
5. **Dado** que un usuario sin permiso intenta ejecutar una acción oculta mediante un enlace profundo, **cuando** se resuelve la ruta, **entonces** ve «Acceso denegado» y el registro no se crea (FR-095, FR-097).

#### US15b - Consultar las cifras de la cartera al abrir el CRM

**Como** Gerente Comercial (rango `n4_manager`), **quiero** ver en el panel el total de clientes, el total de interacciones, «Cerrado ganado», «Tasa de conversión», «Pipeline (USD)», el embudo por estado y las últimas interacciones, **para** comprobar de un vistazo si la cartera avanzó antes de reunirme con el equipo.

**Criterios de aceptación**:

1. **Dado** 47 clientes y 120 interacciones almacenados, **cuando** se abre el panel, **entonces** las dos primeras tarjetas muestran `47` y `120` y coinciden con `erp_entities` y `erp_documents` (FR-035, SC-010).
2. **Dado** un documento «Cerrado ganado» por $250.000, **cuando** se abre el panel, **entonces** «Pipeline (USD)» aumenta en $250.000 y el embudo cuenta ese documento una sola vez en su estado (FR-035, FR-074).
3. **Dado** un resumen vacío, **cuando** se abre el panel, **entonces** las cinco tarjetas y el embudo muestran `0` sin errores y la lista de últimas interacciones está vacía (FR-046).
4. **Dado** que se crea, edita o elimina una interacción, **cuando** se vuelve a mostrar el panel, **entonces** las cifras se recalculan sin recarga y sin escribir valores derivados en `localStorage` (FR-045, FR-072).
5. **Dado** un Ejecutivo de Ventas, **cuando** abre el panel, **entonces** ve las mismas tarjetas de registro; su resumen propio de pendientes se consulta por separado con `summary:view_own` (FR-035, FR-094).

---

### Historia de Usuario 16 - Capturar y convertir prospectos desde Marketing (Prioridad: P2)

Esta historia se divide en captura pública (US16a), automatización (US16b), conversión (US16c) y panel de Marketing (US16d), porque intervienen actores y permisos distintos: el visitante captura, Marketing programa, Gerencia convierte y Marketing consulta las cifras.

#### US16a - Capturar un prospecto desde el formulario público

**Como** Visitante del sitio web (sin sesión, con permiso `chat:create_query` y acceso a `?view=capture`), **quiero** enviar mis datos y marcar el consentimiento explícito en el formulario público, **para** que el Ejecutivo de Marketing tenga un prospecto registrado al que pueda dar seguimiento sin que yo tenga que crear una cuenta.

**Criterios de aceptación**:

1. **Dado** `?view=capture` abierto sin sesión, **cuando** envío mis datos con el consentimiento marcado, **entonces** se crea una Entidad en estado «Prospecto», se guarda la fecha y la versión del aviso aceptado y veo exactamente `Prospecto registrado correctamente.` (FR-068, FR-069, FR-071).
2. **Dado** el mismo formulario sin consentimiento, **cuando** intento enviarlo, **entonces** no se crea la entidad y veo `Completa los campos obligatorios.` (FR-071).
3. **Dado** un campo obligatorio del formulario vacío, **cuando** envío, **entonces** el sistema rechaza el envío y no modifica `erp_entities` (FR-069).
4. **Dada** la limitación sin backend, **cuando** se incrusta el formulario en otro dominio, **entonces** no se crea el prospecto; el formulario solo funciona en el mismo origen del CRM (limitación documentada en README).

#### US16b - Ejecutar reglas automáticas sobre el prospecto

**Como** Ejecutivo de Marketing (rango `n3_marketing`, con `marketing:manage`), **quiero** configurar reglas por captura, cambio de etapa o interacción que creen un seguimiento, asignen un ejecutivo o actualicen el estado comercial interno, **para** que ningún prospecto quede sin acción inicial aunque nadie esté conectado en ese momento.

**Criterios de aceptación**:

1. **Dado** el prospecto «Visita 2026-11-23» y una regla de captura, **cuando** se envía el formulario, **entonces** se crea un documento de seguimiento vinculado al prospecto y la ejecución queda en su historial (FR-070, FR-089).
2. **Dada** una regla de cambio de etapa ejecutada desde otro flujo, **cuando** ocurre el evento, **entonces** la acción se registra como actor «Sistema» aunque `atencion` tenga la sesión iniciada (FR-101).
3. **Dada** una regla que proviene de la «Campaña Primavera 2026», **cuando** se consulta el historial, **entonces** identifica a `marketing` como creadora de la campaña en `createdByUserId` y la ejecución como «Sistema» (FR-086, FR-101).
4. **Dado** un cambio de etapa interno, **cuando** se abre Marketing, **entonces** `estado_comercial` no se muestra ni se puede cambiar allí (FR-075).
5. **Dada** una regla con acción no declarada en `marketing.campaigns.actions`, **cuando** arranca la aplicación, **entonces** se aplica `DEFAULT_CONFIG` con `#config-warning` y la acción no se ejecuta (FR-025).

#### US16c - Convertir un prospecto en cliente conservando su historial

**Como** Gerente Comercial (rango `n4_manager`), **quiero** convertir un prospecto en cliente desde su ficha, **para** que el negocio cerrado conserve toda la conversación previa y pueda contabilizarse sin crear un registro duplicado.

**Criterios de aceptación**:

1. **Dado** el prospecto «Visita 2026-11-23» con 3 documentos y campos personalizados, **cuando** se convierte, **entonces** conserva su `id`, sus 3 documentos y sus campos, y `estado_comercial` pasa a `ganado` con auditoría de la transición (FR-068).
2. **Dado** el estado `ganado`, **cuando** se muestra el resultado visible, **entonces** dice «Cliente ganado» y no se confunde con el estado de documento «Cerrado ganado» (FR-068).
3. **Dado** un usuario sin permiso de edición sobre la entidad, **cuando** intenta la conversión desde `storage.js`, **entonces** recibe `No tienes permiso para realizar esta acción` y el prospecto sigue en estado inicial (FR-095, FR-096).

#### US16d - Consultar el panel de Marketing con las mismas cifras del panel principal

**Como** Ejecutivo de Marketing (rango `n3_marketing`, con `marketing:view`), **quiero** abrir Marketing y ver las cinco tarjetas, el embudo, la lista de últimas interacciones y mis cinco atajos en orden fijo, **para** preparar la campaña del día con los mismos datos que usa Gerencia en el panel.

**Criterios de aceptación**:

1. **Dado** el panel principal con 47 clientes, 120 interacciones y un embudo determinado, **cuando** abro Marketing, **entonces** las cinco tarjetas y el embudo muestran los mismos valores y estados sin recarga (FR-072, FR-073, FR-074).
2. **Dado** Marketing, **cuando** creo, edito o elimino un documento, **entonces** tarjetas y embudo se actualizan y cada documento se cuenta una sola vez (FR-074).
3. **Dado** Marketing, **cuando** se abre, **entonces** no aparece la torta «Estado comercial de la cartera», ni el selector de etapas, ni los cinco botones de acción rápida del panel (FR-075, FR-091).
4. **Dado** Marketing, **cuando** miro sus atajos, **entonces** aparecen exactamente «Equipos de ventas y logros», «Campañas», «Rendimiento de campañas», «Dudas y consultas» y «Redes sociales», en ese orden (FR-093, SC-029).
5. **Dado** Marketing, **cuando** consulto «Últimas Interacciones / Próximos Seguimientos», **entonces** veo las mismas entradas y botones «Ver ficha» del panel principal (FR-075).

---

### Historia de Usuario 17 - Consultar los Equipos de ventas y logros (Prioridad: P2)

Se desglosa en administración de equipos (US17a) y cálculo del desempeño (US17b), porque crear la estructura es una acción de Gerencia y leer las cifras también interesa a Marketing y al propio ejecutivo.

#### US17a - Registrar equipos e integrantes de ventas

**Como** Gerente Comercial (rango `n4_manager`, con `team:manage`), **quiero** crear, editar y eliminar equipos e integrantes con nombre, cargo, estado «Activo/Inactivo» y usuario vinculado, **para** que el seguimiento del desempeño use la estructura real del equipo y no una lista improvisada de nombres.

**Criterios de aceptación**:

1. **Dado** el atajo «Equipos de ventas y logros» de Marketing, **cuando** lo activa `gerente`, **entonces** se muestra la lista de equipos o un estado vacío que permite crear el primero (FR-076).
2. **Dado** el equipo «Equipo Norte», **cuando** creo el integrante «María González» con cargo «Ejecutivo de Ventas», estado «Activo» y usuario vinculado `ventas`, **entonces** se guardan esos cuatro datos y no aparecen casillas para capturar real ni objetivo mensual (FR-077, FR-100).
3. **Dado** el `select` de usuario vinculado, **cuando** se abre, **entonces** solo ofrece usuarios activos de rango `n2_sales` o `n4_manager` (FR-077, FR-099).
4. **Dado** `marketing`, **cuando** abre el apartado, **entonces** puede leer equipos e integrantes pero no ve botones para crear, editar ni eliminarlos (FR-094).
5. **Dado** un integrante con ventas históricas, **cuando** se desactiva al usuario vinculado, **entonces** el integrante sigue mostrando esas ventas mediante `assignedUserIdAtSale` (FR-077).

#### US17b - Consultar el real y el objetivo mensuales calculados

**Como** Gerente Comercial (rango `n4_manager`, con `team:view_all`), **quiero** ver el real mensual y el objetivo mensual de cada integrante calculados desde los documentos «Cerrado ganado» del mes, **para** detectar desviaciones de la proyección y reasignar clientes antes de fin de mes.

**Criterios de aceptación**:

1. **Dado** «María González» vinculada a `ventas` con clientes «Comercial Andina SpA» y «Ferretería Central», **cuando** consulto el apartado, **entonces** el real mensual es la suma de sus documentos «Cerrado ganado» del mes y el objetivo es `real ÷ días transcurridos × días del mes` (FR-078, FR-079).
2. **Dado** un documento «Cerrado ganado» adicional por $250.000, **cuando** se consulta de nuevo, **entonces** el real pasa de $1.250.000 a $1.500.000 y el objetivo se recalcula sin recarga (FR-078, FR-079).
3. **Dado** un ejecutivo sin ventas en el mes, **cuando** se consulta, **entonces** real y objetivo muestran `$0` y no se capturan manualmente (FR-079).
4. **Dado** `ventas`, **cuando** abre el apartado, **entonces** ve únicamente su real de $1.250.000 y su objetivo de $1.800.000; dado `marketing`, ve el real de todos los integrantes en modo solo lectura (FR-094, US23).
5. **Dado** un cambio en la vinculación del integrante, **cuando** se consulta el apartado, **entonces** real y objetivo se recalculan con el usuario vinculado vigente sin editar importes a mano (FR-078, FR-079).

---

### Historia de Usuario 18 - Registrar interacciones en redes sociales (Prioridad: P2)

Se desglosa en registro (US18a) y revisión/corrección (US18b), porque capturar una interacción y corregir el historial son operaciones con verificaciones distintas.

#### US18a - Registrar una interacción de redes vinculada al prospecto

**Como** Ejecutivo de Marketing (rango `n3_marketing`, con `marketing:manage` y `document:create`), **quiero** registrar en «Redes sociales» la plataforma, fecha, tipo de interacción, nota y enlace de un contacto con un prospecto o cliente, **para** continuar la conversación por el canal donde el cliente potencial respondió.

**Criterios de aceptación**:

1. **Dado** el atajo «Redes sociales» de Marketing, **cuando** se abre, **entonces** se listan las interacciones registradas o un estado vacío claro (FR-080).
2. **Dado** el prospecto «Visita 2026-11-23», **cuando** registro una interacción de Instagram el 24 de noviembre con tipo, nota y enlace, **entonces** se guarda como Documento con `entity_id` de ese prospecto y aparece en el apartado (FR-080, FR-081).
3. **Dado** un prospecto sin consentimiento guardado, **cuando** intento registrar la interacción, **entonces** la operación se rechaza porque las interacciones usan el consentimiento ya registrado del prospecto o cliente (FR-085).
4. **Dado** un documento creado por una campaña, **cuando** se consulta su historial, **entonces** el actor de ejecución es «Sistema» y no el usuario conectado (FR-101).

#### US18b - Consultar y corregir el historial de redes

**Como** Ejecutivo de Marketing (rango `n3_marketing`, con `document:edit_any` y `document:delete`), **quiero** editar o eliminar una interacción de redes sin perder su vínculo con el prospecto, **para** corregir un enlace erróneo antes de usarlo en una campaña.

**Criterios de aceptación**:

1. **Dado** un prospecto con interacciones en Instagram, YouTube y Twitter, **cuando** consulto su ficha, **entonces** aparecen ordenadas por fecha junto al resto de documentos (FR-080, FR-081).
2. **Dada** una interacción con enlace mal copiado, **cuando** edito el enlace, **entonces** el cambio se refleja en «Redes sociales» y en la ficha sin crear otro documento (FR-080).
3. **Dada** una interacción eliminada, **cuando** consulto el apartado y la ficha, **entonces** deja de aparecer en ambos y el vínculo con el prospecto se elimina sin afectar sus otros documentos (FR-081).
4. **Dado** un usuario de Atención al Cliente, **cuando** consulta la ficha, **entonces** ve las interacciones por su permiso `document:read`, pero no puede editarlas ni eliminarlas (FR-094).

---

### Historia de Usuario 19 - Ofrecer «Dudas y consultas» con respuestas rápidas (Prioridad: P2)

Se desglosa en atención al visitante (US19a) y seguimiento por el equipo (US19b), porque el acuse de recibo se evalúa en el sitio público y la trazabilidad se evalúa en Marketing y en la ficha.

#### US19a - Responder y registrar la consulta del visitante

**Como** Visitante del sitio web (sin sesión, con permiso `chat:create_query`), **quiero** escribir una pregunta en «Dudas y consultas» y recibir la respuesta configurada o un acuse de registro, **para** saber si aceptan pagos en cuotas sin esperar a que un ejecutivo esté disponible.

**Criterios de aceptación**:

1. **Dado** el apartado «Dudas y consultas» (`chat`) en el formulario público, **cuando** escribo «¿Aceptan pagos en cuotas?» y coincide con una pregunta frecuente, **entonces** veo la respuesta configurada sin recarga (FR-082).
2. **Dado** una pregunta sin coincidencia, **cuando** la envío, **entonces** veo exactamente `Consulta registrada; un ejecutivo hará seguimiento.` y la consulta queda guardada como Documento vinculado al prospecto identificado (FR-083).
3. **Dado** el primer mensaje sin consentimiento explícito y sin datos mínimos de prospecto, **cuando** intento enviarlo, **entonces** el envío se bloquea, se explica el motivo y no se persiste ningún mensaje (FR-085).
4. **Dado** un consentimiento aceptado, **cuando** se guarda el primer mensaje, **entonces** la entidad conserva la fecha y la versión del aviso aceptado (FR-085).
5. **Dado** que no hay preguntas frecuentes configuradas, **cuando** abro el apartado, **entonces** veo un estado vacío claro y puedo dejar la consulta para seguimiento (FR-082, FR-083).
6. **Dado** el identificador interno `chat`, **cuando** se muestra cualquier etiqueta en Marketing o en el formulario público, **entonces** dice «Dudas y consultas» y no «Chat» (FR-092).

#### US19b - Dar seguimiento a las consultas registradas

**Como** Ejecutivo de Marketing (rango `n3_marketing`, con `chat:view` y `chat:answer`) o Atención al Cliente (rango `n1_support`, con las mismas acciones), **quiero** ver las consultas sin respuesta y continuar la conversación vinculada al prospecto, **para** responder con el contexto de lo que el visitante ya preguntó.

**Criterios de aceptación**:

1. **Dado** el formulario público y Marketing abiertos, **cuando** consulto «Dudas y consultas» en ambos, **entonces** veo los mismos mensajes y documentos de la entidad (FR-084).
2. **Dada** una consulta sin coincidencia, **cuando** la respondo desde Marketing, **entonces** la respuesta queda vinculada a la misma entidad y aparece en su ficha (FR-081, FR-083).
3. **Dada** una consulta respondida, **cuando** se filtra el rendimiento de campañas, **entonces** cuenta como «consulta respondida» solo una vez (FR-087).
4. **Dado** un visitante sin consentimiento, **cuando** intento registrar una respuesta sobre su mensaje bloqueado, **entonces** no existe documento al que vincularla y la operación se rechaza (FR-085).

---

### Historia de Usuario 20 - Programar campañas de marketing internas (Prioridad: P2)

Se desglosa en programación (US20a), ejecución y solapamiento (US20b) y cierre con trazabilidad (US20c), porque planificar, ejecutar y detener son decisiones comerciales distintas.

#### US20a - Programar una campaña por etapa y periodo

**Como** Ejecutivo de Marketing (rango `n3_marketing`, con `campaign:create` y `campaign:edit_own`), **quiero** crear una campaña con nombre, etapa objetivo «En proceso» y fechas de inicio y fin, **para** concentrar el seguimiento de los prospectos de esa etapa durante el periodo definido sin servicios externos.

**Criterios de aceptación**:

1. **Dado** el atajo «Campañas» de Marketing, **cuando** se abre, **entonces** se listan las campañas programadas o un estado vacío claro (FR-086).
2. **Dado** el nombre «Campaña Primavera 2026», etapa «En proceso» e inicio y fin válidos, **cuando** guardo, **entonces** la campaña queda lista para ejecutar reglas solo dentro de ese periodo (FR-086).
3. **Dada** una fecha fin anterior a la de inicio, **cuando** guardo, **entonces** la campaña no se crea y se muestra un error visible (FR-086).
4. **Dado** el historial de la campaña, **cuando** se consulta, **entonces** identifica a `marketing` como creadora en `createdByUserId` y ese dato no es editable (FR-086).
5. **Dado** un usuario `ventas`, **cuando** intenta crear una campaña desde la interfaz o desde `storage.js`, **entonces** recibe `No tienes permiso para realizar esta acción` (FR-094, FR-096).

#### US20b - Ejecutar reglas de campaña sin duplicar acciones

**Como** Ejecutivo de Marketing (rango `n3_marketing`), **quiero** que las reglas de una campaña activa creen documentos de seguimiento, asignen ejecutivos o actualicen el estado interno del prospecto, **para** que cada visita capturada reciba una acción concreta y verificable sin depender de correos ni publicaciones externas.

**Criterios de aceptación**:

1. **Dado** un prospecto en la etapa objetivo, **cuando** ocurre captura, cambio de etapa o interacción, **entonces** se ejecuta la regla configurada y se crea exactamente una acción sobre ese prospecto (FR-070, FR-086, FR-089).
2. **Dada** una ejecución, **cuando** consulto el historial de la campaña, **entonces** aparecen fecha, prospecto y acción realizada (FR-086).
3. **Dadas** dos campañas activas para el mismo prospecto y evento, **cuando** se evalúan, **entonces** solo se ejecuta la más reciente y la otra queda registrada como «omitida por solapamiento» con campaña y motivo (FR-090).
4. **Dada** una campaña fuera de su periodo de fechas, **cuando** ocurre un evento, **entonces** no se ejecuta ninguna acción nueva (FR-086).
5. **Dada** una campaña ejecutándose mientras `atencion` tiene sesión, **cuando** se crea el documento de seguimiento, **entonces** el creador del documento es «Sistema» y no `atencion` (FR-101).
6. **Dada** una regla que intenta enviar correo, mensaje externo o publicación, **cuando** se evalúa, **entonces** no se ejecuta porque el alcance solo permite las tres acciones internas de FR-089 (FR-086).

#### US20c - Detener una campaña y conservar su historial

**Como** Gerente Comercial (rango `n4_manager`, con `campaign:stop_any`), **quiero** detener cualquier campaña activa, incluida la creada por `marketing`, **para** frenar acciones automáticas que ya no corresponden a la estrategia comercial sin borrar lo ocurrido.

**Criterios de aceptación**:

1. **Dada** la «Campaña Primavera 2026» creada por `marketing`, **cuando** la detiene `gerente`, **entonces** deja de generar ejecuciones nuevas y su historial permanece visible con fecha, prospecto y acción (FR-086, FR-094).
2. **Dado** un usuario `marketing` que creó la campaña, **cuando** la detiene, **entonces** la operación se permite por `campaign:stop_own` (FR-094).
3. **Dado** un usuario `marketing` que intenta detener una campaña de otro usuario, **cuando** ejecuta la acción, **entonces** recibe `No tienes permiso para realizar esta acción` y la campaña sigue activa (FR-094, FR-096).
4. **Dado** un usuario `ventas` que intenta detenerla, **cuando** ejecuta la acción desde consola o `storage.js`, **entonces** recibe el mismo mensaje exacto y no se muta la campaña (FR-096).
5. **Dada** una campaña finalizada por fecha, **cuando** se consulta, **entonces** muestra su historial completo y no ejecuta reglas nuevas (FR-086).

---

### Historia de Usuario 21 - Medir el rendimiento de Marketing (Prioridad: P2)

Se desglosa en lectura de indicadores globales (US21a) y filtro por campaña (US21b), porque evaluar el total y atribuir resultados a una campaña requieren verificaciones distintas.

#### US21a - Consultar los indicadores globales de rendimiento

**Como** Ejecutivo de Marketing (rango `n3_marketing`, con `marketing:view`), **quiero** ver prospectos capturados, conversión por etapa, interacciones, consultas respondidas y ventas «Cerrado ganado» derivados de los registros, **para** decidir si la campaña actual está generando resultados sin capturar cifras a mano.

**Criterios de aceptación**:

1. **Dado** el atajo «Rendimiento de campañas», **cuando** se abre, **entonces** se muestran los cinco indicadores calculados desde entidades, documentos, interacciones, mensajes de «Dudas y consultas» y ejecuciones (FR-087).
2. **Dado** un resumen vacío, **cuando** se abre, **entonces** los indicadores muestran `0` con un estado vacío claro y el mensaje exacto `Sin registros para esta campaña.` (FR-087).
3. **Dado** un cambio en una entidad, documento, interacción o consulta, **cuando** se consulta de nuevo, **entonces** los indicadores se actualizan sin recarga y sin importar datos externos (FR-087).
4. **Dado** un indicador que coincide con una tarjeta del panel, **cuando** comparo ambas vistas, **entonces** los valores son idénticos porque se derivan de los mismos registros (FR-074, FR-087).
5. **Dado** un Ejecutivo de Ventas, **cuando** intenta abrir `?view=marketing`, **entonces** ve «Acceso denegado» y vuelve al Panel sin ver el rendimiento (FR-097).

#### US21b - Atribuir los resultados a una campaña

**Como** Ejecutivo de Marketing (rango `n3_marketing`), **quiero** filtrar el rendimiento por campaña y revisar los registros sin campaña bajo «Sin campaña», **para** saber qué campaña generó cada prospecto, interacción o venta.

**Criterios de aceptación**:

1. **Dado** un prospecto capturado con la «Campaña Primavera 2026», **cuando** filtro por esa campaña, **entonces** el indicador de prospectos incluye solo los registros con ese valor (FR-088).
2. **Dadas** una interacción de redes y una venta vinculadas a la campaña, **cuando** se filtra, **entonces** ambos se cuentan en sus respectivos indicadores y no se duplican (FR-087, FR-088).
3. **Dado** un prospecto sin campaña seleccionada, **cuando** se consulta el filtro, **entonces** aparece agrupado bajo «Sin campaña» y no se pierde (FR-088).
4. **Dada** una campaña sin registros vinculados, **cuando** se consulta su rendimiento, **entonces** muestra `0` y `Sin registros para esta campaña.` (FR-087).
5. **Dado** el campo «Campaña» opcional, **cuando** se crea un prospecto, interacción o venta, **entonces** puede quedar vacío sin bloquear el guardado y se contabiliza en «Sin campaña» (FR-088).

---

### Historia de Usuario 22 - Iniciar sesión en modo demostración (Prioridad: P1)

Se desglosa en autenticación (US22a), vigencia de la sesión (US22b) y acceso público (US22c), porque la identidad, la continuidad de la sesión y las vistas sin sesión se prueban por separado.

**Usuarios del modo demostración**: `gerente` (`n4_manager`, Gerente Comercial), `marketing` (`n3_marketing`), `ventas` (`n2_sales`) y `atencion` (`n1_support`, Atención al Cliente). El nombre no distingue mayúsculas ni espacios; cualquier contraseña no vacía permite entrar. No hay hash, contraseña incorrecta ni bloqueo por intentos (FR-098).

#### US22a - Identificar al empleado que entra al CRM

**Como** Visitante sin sesión que necesita usar una vista interna del CRM, **quiero** iniciar sesión con uno de los cuatro usuarios demostrativos, **para** que el sistema aplique su rango y registre quién crea o modifica cada cliente o interacción.

**Criterios de aceptación**:

1. **Dado** un visitante en la URL raíz sin `?view=`, **cuando** abre la aplicación, **entonces** ve solo «Usuario» y «Contraseña», sin Panel, Buscar, Resumen ni Marketing (FR-097).
2. **Dado** `gerente` con cualquier contraseña no vacía, **cuando** inicia sesión, **entonces** ve el panel con el usuario `gerente`, el rango exacto «Nivel 4 - Gerente Comercial» y las opciones «Gestionar usuarios» y «Cerrar sesión» en el menú (FR-006, FR-098).
3. **Dado** `GERENTE` con espacios y contraseña no vacía, **cuando** inicia sesión, **entonces** entra como `gerente` y conserva el rango Nivel 4 (FR-098).
4. **Dado** el campo «Contraseña» vacío, **cuando** intenta entrar, **entonces** no se crea la sesión y ve exactamente `Ingresa una contraseña` (FR-006).
5. **Dado** un usuario distinto de los cuatro, **cuando** intenta entrar, **entonces** no se crea la sesión y ve exactamente `Usuario no encontrado` (FR-006).
6. **Dado** `atencion` con sesión iniciada, **cuando** abre el menú del usuario, **entonces** ve «Cerrar sesión» y no ve «Gestionar usuarios» (FR-098).

#### US22b - Mantener y revocar la sesión del empleado

**Como** Ejecutivo de Ventas (rango `n2_sales`) con sesión iniciada, **quiero** que mi identidad y mi rango permanezcan al recargar o reabrir el navegador y que la sesión termine al cerrarla o al ser desactivado, **para** no tener que iniciar sesión en cada pantalla y para que Gerencia pueda revocar el acceso de inmediato.

**Criterios de aceptación**:

1. **Dado** `ventas` con sesión iniciada, **cuando** recarga la URL raíz o cierra y reabre el navegador, **entonces** la barra superior sigue mostrando `ventas` y su rango sin volver al login (FR-102).
2. **Dado** `ventas`, **cuando** pulsa «Cerrar sesión», **entonces** la barra superior desaparece y vuelve a mostrarse solo la pantalla de inicio de sesión (FR-102).
3. **Dado** `ventas` desactivado por `gerente`, **cuando** realiza su siguiente acción o recarga, **entonces** se redirige a inicio de sesión y ya no puede crear ni editar clientes (FR-098, FR-102).
4. **Dado** un cambio de rango de `n2_sales` a `n3_marketing` hecho por `gerente`, **cuando** el usuario realiza su siguiente acción, **entonces** la barra muestra el nuevo rango y se aplican los permisos Nivel 3 (FR-102).
5. **Dado** un visitante sin sesión que abre `?view=summary`, **cuando** inicia sesión como `gerente`, **entonces** se restaura el resumen solicitado (FR-097).

#### US22c - Usar el sitio público sin iniciar sesión

**Como** Visitante del sitio web (sin sesión), **quiero** usar el formulario de captura y «Dudas y consultas» sin entrar al CRM, **para** dejar mis datos y mis preguntas antes de hablar con un ejecutivo.

**Criterios de aceptación**:

1. **Dado** `?view=capture` sin sesión, **cuando** envío el formulario con consentimiento, **entonces** se crea el prospecto «Visita 2026-11-23» en estado «Prospecto» sin exigir login (FR-069).
2. **Dado** «Dudas y consultas» (`chat`) sin sesión, **cuando** escribo «¿Aceptan pagos en cuotas?», **entonces** recibo la respuesta rápida configurada o dejo la consulta registrada para seguimiento (FR-084).
3. **Dado** un enlace directo a una vista interna sin sesión, **cuando** se abre, **entonces** se redirige al login y no se muestran datos de clientes (FR-097).

---

### Historia de Usuario 23 - Acceso según rango (Prioridad: P1)

Se desglosa en permisos sobre datos (US23a), administración de usuarios (US23b) y cumplimiento en rutas y capa de datos (US23c). La matriz de FR-094 es la única fuente de verdad y no se edita desde la interfaz.

#### US23a - Limitar acciones sobre clientes e interacciones según el cargo

**Como** Gerente Comercial (rango `n4_manager`), **quiero** que cada empleado vea y modifique solo los clientes e interacciones que su cargo requiere, **para** impedir que Atención borre una cuenta o que Marketing elimine clientes.

**Criterios de aceptación**:

1. **Dado** `gerente`, **cuando** elimina «Comercial Andina SpA», edita «Equipo Norte» y detiene la «Campaña Primavera 2026», **entonces** las tres operaciones se permiten y quedan registradas (FR-094).
2. **Dado** `marketing`, **cuando** busca «Comercial Andina SpA» y «Visita 2026-11-23», **entonces** ve ambas fichas; al crear la campaña y consultar su rendimiento también puede; al intentar eliminar el cliente o abrir el resumen recibe `No tienes permiso para realizar esta acción` (FR-094, FR-096).
3. **Dado** `marketing` en «Equipos de ventas y logros», **cuando** consulta el real de $1.250.000 de `ventas`, **entonces** solo puede leerlo y no ve botones de alta, edición ni baja de integrantes (FR-094).
4. **Dado** `ventas` con «Ferretería Central» como cliente propio, **cuando** lo edita y cambia una interacción a «Cerrado ganado», **entonces** puede; con «Transportes del Norte Ltda.» asignado a `ana.munoz`, ve la ficha pero no puede editarla ni cambiar estados (FR-094, FR-099).
5. **Dado** `ventas`, **cuando** abre el resumen, **entonces** ve solo sus 12 pendientes y no los 35 de `ana.munoz`; en equipo ve solo su real de $1.250.000 y su objetivo de $1.800.000 (FR-094).
6. **Dado** `atencion`, **cuando** registra una «Llamada» con nota «Confirmación de horario de entrega» en «Comercial Andina SpA» y responde una consulta de «Dudas y consultas», **entonces** puede; al intentar «Reunión», cambiar estados, eliminar clientes o abrir Resumen/Marketing/Equipo recibe `No tienes permiso para realizar esta acción` (matriz de permisos).
7. **Dado** el `select` «Ejecutivo Asignado», **cuando** lo abre `ventas`, **entonces** aparecen `ventas`, `ana.munoz` y `gerente` por ser activos N2/N4, y no aparecen `atencion` ni `marketing` (FR-099).

#### US23b - Administrar usuarios y rangos

**Como** Gerente Comercial (rango `n4_manager`, con `users:manage`), **quiero** crear, editar y desactivar usuarios y asignarles un rango desde el menú de la barra superior, **para** que cada cambio de persona o cargo se refleje en los permisos del CRM sin tocar el código.

**Criterios de aceptación**:

1. **Dado** el menú del usuario, **cuando** lo abre `gerente`, **entonces** ve «Gestionar usuarios»; con `atencion`, `ventas` o `marketing`, la opción no aparece (FR-098).
2. **Dado** el formulario de usuarios, **cuando** se crea un usuario con nombre único, rango y estado activo, **entonces** se guarda en `erp_users` y queda disponible para asignaciones N2/N4 cuando corresponda (FR-098, FR-099).
3. **Dado** el usuario `ventas`, **cuando** `gerente` intenta crear `VENTAS`, **entonces** el guardado se rechaza por duplicado y el original conserva su identidad, rango y clientes (FR-098).
4. **Dado** un usuario desactivado, **cuando** intenta iniciar sesión o realiza una acción con sesión previa, **entonces** se le redirige a login en la siguiente acción o recarga (FR-098, FR-102).
5. **Dado** un cambio de rango de `ventas` a Nivel 3, **cuando** el usuario actúa, **entonces** ve el nuevo rango en la barra superior y se aplican los permisos Nivel 3; ninguna pantalla permite editar la matriz de permisos (FR-094, FR-098, FR-102).
6. **Dado** `gerente`, **cuando** abre «Gestionar usuarios», **entonces** no encuentra controles para modificar `PERMISSION_MATRIX` ni una acción `permissions:edit` permitida (FR-094).

#### US23c - Aplicar la matriz en rutas y en la capa de datos

**Como** Gerente Comercial (rango `n4_manager`), **quiero** que la matriz se aplique también en enlaces profundos y llamadas directas a `storage.js`, **para** que ocultar un botón nunca sea el único mecanismo de protección de los datos del equipo.

**Criterios de aceptación**:

1. **Dado** `ventas`, **cuando** intenta eliminar «Transportes del Norte Ltda.» desde la consola con `storage.js`, **entonces** la capa de datos rechaza la operación con `No tienes permiso para realizar esta acción` y el cliente sigue almacenado (FR-095, FR-096).
2. **Dado** `atencion`, **cuando** abre directamente `?view=summary`, **entonces** ve «Acceso denegado», vuelve al Panel y no ve los 47 pendientes (FR-097).
3. **Dado** un visitante sin sesión, **cuando** abre la URL raíz sin `?view=`, **entonces** no accede al espacio de trabajo y solo conserva formulario público y «Dudas y consultas» (FR-097).
4. **Dado** un usuario autenticado sin permiso para la vista solicitada, **cuando** recarga o usa Back/Forward, **entonces** cada resolución de `location.search` vuelve a aplicar la matriz y muestra «Acceso denegado» sin ejecutar la acción (FR-094, FR-097).
5. **Dado** un rango nuevo añadido a la matriz, **cuando** arranca la aplicación, **entonces** navegación, acciones rápidas y `storage.js` lo respetan sin cambios en componentes ni reglas de negocio (FR-094).
6. **Dada** una manipulación deliberada de `erp_session` o `localStorage` para falsificar identidad, **cuando** se intenta, **entonces** queda fuera del alcance demostrativo sin backend (FR-095).

---

### Historia de Usuario 24 - Archivar, restaurar y eliminar clientes (Prioridad: P1)

Se desglosa en archivo y restauración (US24a), baja definitiva protegida (US24b) y filtros e indicadores (US24c). Las tres operaciones usan la acción canónica `entity:delete` de FR-094: solo el Gerente Comercial (`n4_manager`) puede ejecutarlas y no se introducen identificadores de permiso nuevos.

#### US24a - Archivar y restaurar clientes conservando el historial

**Como** Gerente Comercial (rango `n4_manager`), **quiero** archivar un cliente y restaurarlo después desde la búsqueda, **para** conservar sus interacciones sin mantenerlo en la operación diaria.

**Criterios de aceptación**:

1. **Dado** un cliente activo con interacciones, **cuando** pulso «🗄️ Archivar», **entonces** se guarda `archivedAt` en `erp_entities`, sus documentos siguen intactos en `erp_documents` y el cliente aparece solo en «Archivados» (FR-103).
2. **Dado** un cliente archivado, **cuando** pulso «↩️ Restaurar», **entonces** se elimina `archivedAt`, el cliente vuelve a «Activos» y su historial queda intacto (FR-103).
3. **Dado** un cliente ya archivado, **cuando** se archiva de nuevo, **entonces** la operación es idempotente y no cambia la fecha original de archivo (FR-103).
4. **Dado** `atencion`, `ventas`, `marketing` o un visitante, **cuando** intenta archivar o restaurar desde la interfaz o mediante una llamada directa a `storage.js`, **entonces** no ve los botones y la capa de datos rechaza la operación con `No tienes permiso para realizar esta acción` (FR-094, FR-095, FR-096).

#### US24b - Eliminar definitivamente solo clientes sin registros

**Como** Gerente Comercial (rango `n4_manager`), **quiero** que la eliminación definitiva pida confirmación y se bloquee cuando exista historial comercial, **para** no destruir interacciones, ventas ni campañas asociadas.

**Criterios de aceptación**:

1. **Dado** un cliente sin documentos asociados, **cuando** pulso «🗑️ Eliminar» y confirmo, **entonces** se elimina solo esa entidad de `erp_entities` (FR-103).
2. **Dado** un cliente con una o más interacciones o registros comerciales vinculados por `entity_id`, **cuando** pulso «🗑️ Eliminar», **entonces** no se elimina nada y se ofrece archivarlo para conservar el historial (FR-103).
3. **Dado** el mensaje de historial asociado, **cuando** confirmo el archivo, **entonces** el cliente pasa a «Archivados» y sus documentos permanecen sin cambios; si rechazo, no se muta ningún dato (FR-103).
4. **Dado** una llamada directa a `deleteEntity()` sobre un cliente con registros, **cuando** se ejecuta, **entonces** se rechaza con `EntityHasRecordsError` sin borrar la entidad ni sus documentos (FR-095, FR-103).

#### US24c - Filtrar clientes activos y archivados con indicadores coherentes

**Como** Gerente Comercial (rango `n4_manager`), **quiero** alternar entre clientes activos y archivados y ver indicadores calculados solo sobre los activos, **para** distinguir la cartera operativa del histórico conservado.

**Criterios de aceptación**:

1. **Dado** la vista de búsqueda, **cuando** abro «Activos (n)» o «Archivados (n)», **entonces** solo se listan los clientes del estado elegido, con sus acciones correspondientes (FR-103).
2. **Dado** un cliente archivado, **cuando** consulto el panel, el resumen o Marketing, **entonces** ni ese cliente ni sus documentos cuentan en tarjetas, embudo, pendientes ni rendimiento (FR-035, FR-073, FR-103).
3. **Dado** un cliente archivado, **cuando** lo restauro, **entonces** los indicadores se recalculan sin recarga y vuelven a incluirlo (FR-074, FR-103).

---

**Historia de Usuario 25 - Registrar y gestionar tickets de Postventa (Prioridad: P2)**

**Como** Atención al Cliente (rango `n1_support`) o Gerente Comercial (rango `n4_manager`), **quiero** registrar tickets de clientes que ya compraron y cambiar su estado desde una tabla de gestión con indicadores rápidos, **para** dar seguimiento a reclamos, dudas técnicas, solicitudes de garantía y consultas sin perder el historial del cliente.

**Criterios de aceptación**:

1. **Dado** el acceso «Postventa» de la barra lateral, **cuando** se abre desde cualquier vista permitida, **entonces** se muestra el botón «Nuevo Ticket» en la parte superior, las tarjetas «Tickets abiertos», «En proceso» y «Resueltos» debajo y la tabla de gestión de casos con los tickets registrados (FR-109).
2. **Dado** el botón «Nuevo Ticket», **cuando** se abre el formulario, **entonces** aparecen en orden «Cliente», «Asunto», «Categoría», «Prioridad», «Estado» y «Nota de resolución»; «Cliente» es un desplegable con todos los clientes existentes y un buscador por nombre; «Categoría» ofrece «Soporte técnico», «Facturación», «Garantía» y «Consulta»; «Prioridad» ofrece «Baja», «Media» y «Alta» sin preselección (FR-104, FR-107, FR-108).
3. **Dado** un ticket guardado, **cuando** se consulta la ficha del cliente seleccionado, **entonces** el ticket aparece como Documento vinculado por `entity_id` y conserva sus casillas (FR-009, FR-104).
4. **Dado** un ticket en «Abierto», «En revisión» o «Resuelto», **cuando** se cambia su estado desde la tabla a cualquier otro valor, incluida la reapertura desde «Resuelto», **entonces** el cambio se guarda y las tres tarjetas se recalculan sin recarga; guardar en «Resuelto» sin «Nota de resolución» se rechaza con `Completa los campos obligatorios.` (FR-105, FR-107, FR-108).
5. **Dado** un Ejecutivo de Ventas, **cuando** abre Postventa, **entonces** solo ve los tickets de sus clientes y no puede crearlos ni cambiar su estado; **dado** un usuario de Marketing o un visitante, **cuando** intenta `?view=postventa`, **entonces** ve «Acceso denegado» y vuelve al Panel, o bien la pantalla de inicio de sesión si no tiene sesión (FR-106, FR-097).
6. **Dado** Postventa sin tickets, **cuando** se abre el apartado, **entonces** las tres tarjetas muestran `0` y la tabla muestra un estado vacío explícito (FR-109).

---

### Funcionalidades pendientes detectadas

- **FR-058 / acceso a fichas bloqueadas**: `detailPolicy.entity.offerEditAction` muestra «Editar» sin consultar la matriz de permisos; en los rangos N1 y N3 esa acción puede aparecer y luego rechazarse con `No tienes permiso para realizar esta acción`. Falta decidir si la completación guiada la hace un usuario con `entity:edit_own`/`entity:edit_any` o si la ficha bloqueada debe ofrecer solo lectura y una solicitud de corrección.
- **FR-098 / usuarios de ejemplo**: el inicio de sesión demostrativo reconoce solo `gerente`, `marketing`, `ventas` y `atencion`, pero las historias y pruebas usan `ana.munoz` como Ejecutivo de Ventas para asignaciones y ventas históricas. Falta declararla explícitamente como usuario creado por Gerencia —no semilla de login— o sustituirla en los ejemplos.
- **FR-094 / edición de interacciones por Marketing**: la matriz narrativa resume el acceso de Nivel 3 a «consulta conversaciones del chat», pero el catálogo y `PERMISSION_MATRIX` conceden `document:edit_any` a Nivel 3. Falta decidir si Marketing puede editar también interacciones de redes de cualquier entidad o solo responder «Dudas y consultas».
- **FR-087 / número de indicadores de rendimiento**: el texto dice «cinco indicadores» pero enumera prospectos, conversiones por etapa, tasa de conversión, interacciones, consultas respondidas y ventas «Cerrado ganado». Falta unificar el conteo y decidir si «conversiones por etapa» y «tasa de conversión» son dos tarjetas o una sola.
- **FR-094 / catálogo de permisos**: `permissions:view` y `permissions:edit` existen en el catálogo canónico, pero ninguna pantalla ofrece actualmente una vista de solo lectura de la matriz. Falta decidir si «Gestionar usuarios» debe mostrar esa vista o si ambos identificadores permanecen solo como contrato interno con `permissions:edit` denegado para todos.
- **FR-069 / formulario embebible**: una inserción en otro dominio no es verificable con este proyecto sin backend ni `postMessage`; la limitación documentada es que `?view=capture` solo se sirve desde el mismo origen.
- **Trazabilidad de tareas**: `tasks.md` en la raíz del repositorio conserva la versión ERP anterior con US1–US14 y no debe usarse como fuente; la fuente vigente es `specs/001-erp-base-module/spec.md` y su `tasks.md` asociado.

---

### Casos Límite

- Guardar una entidad sin nombre o código obligatorio: se rechaza con `Completa los campos obligatorios.` y no se crea ni modifica el registro; en el perfil de clientes el código se genera automáticamente y no se captura (FR-052).
- Búsqueda sin coincidencias: se muestra exactamente `No se encontraron resultados.` y no se modifica ningún registro (FR-005).
- Editar o eliminar una entidad que ya no existe: la operación falla sin mutar datos, se muestra un error visible y la lista y el resumen quedan sin cambios.
- Fecha objetivo inválida: se rechaza y no se guarda. En el perfil de clientes se rechazan además las fechas anteriores al 1 de enero de 1910 o posteriores a la fecha local actual (FR-047); si el valor ya estaba guardado se conserva y se exige corregirlo al editar (FR-050).
- Eliminar una entidad: sin registros vinculados, tras la confirmación se elimina solo la entidad; con documentos o registros comerciales asociados, la operación se rechaza sin borrar nada y se ofrece archivarla para conservar el historial (FR-003, FR-009, FR-103).
- Archivar o restaurar una entidad: la operación conserva todos sus documentos y campos, es idempotente y solo la puede ejecutar un usuario con `entity:delete`; un cliente archivado deja de contar en panel, resumen y Marketing (FR-094, FR-103).
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
- Ticket creado sin cliente existente: no se guarda; el desplegable «Cliente» solo ofrece clientes ya registrados y el buscador filtra por nombre (FR-104).
- Ticket resuelto sin «Nota de resolución» o sin «Prioridad»: se rechaza con `Completa los campos obligatorios.` y el estado permanece sin cambios (FR-108).
- Postventa sin tickets, con clientes archivados o consultada por un rango sin permiso: tarjetas en cero y estado vacío en el primer caso; los clientes archivados no se ofrecen en el desplegable; acceso denegado o inicio de sesión en el tercero (FR-103, FR-106, FR-109).
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

La aplicación usa únicamente rutas relativas de un mismo documento HTML, sin host ni rutas de servidor: sin parámetro = Panel; `?view=capture`; `?view=summary`; `?view=marketing`; `?view=postventa`; `?view=manage-entity`; `?view=manage-document`; `?view=users-admin`. No existe `?view=panel`: el Panel se selecciona quitando el parámetro `view`. Back/Forward y la recarga DEBEN resolver la ruta desde `location.search` y aplicar la matriz de permisos (FR-094, FR-097) en cada cambio de vista: un usuario autenticado sin permiso ve «Acceso denegado» y vuelve al Panel; sin sesión ve el inicio de sesión; `?view=capture` sigue siendo público con o sin sesión. La ruta solicitada se conserva al redirigir a login y se restaura tras autenticarse.

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
- **FR-012**: La barra lateral DEBE proporcionar botones de módulo para Panel, Buscar, Resumen, Marketing —con la etiqueta «Marketing»— y Postventa —como quinta opción, inmediatamente después de Marketing (FR-109)—, etiquetados desde la configuración del módulo cuando exista una etiqueta configurada, y NO DEBE incluir botones para «Clientes» (entidades) ni «Interacciones» (documentos). Los botones visibles DEBEN filtrarse según el rango del usuario conectado conforme a la matriz de permisos (FR-094): por ejemplo, Resumen NO DEBE mostrarse a un Ejecutivo de Marketing ni a Atencion al Cliente, y para un Ejecutivo de Ventas DEBE mostrarse limitado a sus propios seguimientos pendientes; Marketing NO DEBE mostrarse a un Ejecutivo de Ventas ni a Atencion al Cliente; Postventa NO DEBE mostrarse a Marketing ni a visitantes y, para un Ejecutivo de Ventas, DEBE limitarse a los tickets de sus clientes (FR-106). La gestión de usuarios NO DEBE figurar en la barra lateral, sino en el menú del usuario de la barra superior (FR-098). Ocultar un botón NO DEBE sustituir la validación de la capa de datos (FR-095).
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
- **FR-103**: La gestión de clientes DEBE ofrecer archivar, restaurar y eliminar definitivamente cada registro con botones iconográficos coherentes con la interfaz. Archivar DEBE persistir `archivedAt` en la entidad sin borrar documentos; restaurar DEBE eliminar esa marca; ambas operaciones DEBEN ser idempotentes y ejecutarse solo con `entity:delete` (FR-094, FR-095). La eliminación definitiva DEBE pedir confirmación y DEBE rechazarse con `EntityHasRecordsError` cuando existan documentos o registros comerciales vinculados por `entity_id`; en ese caso la interfaz DEBE ofrecer archivar el cliente para conservar su historial (US24b). La búsqueda DEBE permitir alternar entre «Activos» y «Archivados»; el panel, el resumen y Marketing DEBEN calcular sus indicadores únicamente con clientes activos y sus documentos, y recalcularlos sin recarga tras archivar o restaurar (FR-035, FR-073, FR-074).
- **FR-104**: El apartado «Postventa» DEBE registrar cada ticket como un Documento vinculado por `entity_id` a un cliente ya existente del sistema. Al activar «Nuevo Ticket» DEBE abrirse un formulario que muestre, en ese orden, las casillas «Cliente», «Asunto», «Categoría», «Prioridad», «Estado» y «Nota de resolución»; «Cliente» DEBE ser un desplegable con todos los clientes existentes, NO DEBE crear uno nuevo desde ese formulario y DEBE incluir un buscador que filtre los clientes por nombre.
- **FR-105**: El apartado «Postventa» DEBE mostrar tres tarjetas de resumen calculadas sobre los tickets almacenados: «Tickets abiertos» cuenta los de estado «Abierto», «En proceso» cuenta los de estado «En revisión» y «Resueltos» cuenta los de estado «Resuelto». Cada ticket DEBE contabilizarse una sola vez y las tarjetas DEBEN actualizarse sin recarga tras crear un ticket o cambiar su estado.
- **FR-106**: Crear un ticket y cambiar su estado DEBEN validarse contra la matriz de permisos (FR-094) también cuando se intenten por enlace profundo, consola o llamada directa a la capa de datos (FR-095): Atención al Cliente y Gerencia pueden crear tickets y cambiar cualquier estado; Ejecutivo de Ventas solo puede consultar los tickets de sus clientes; Marketing y visitantes no pueden acceder a Postventa. La operación denegada DEBE rechazarse con «No tienes permiso para realizar esta acción» (FR-096).
- **FR-107**: La casilla «Categoría» del formulario de «Nuevo Ticket» DEBE ser un desplegable con exactamente las opciones «Soporte técnico», «Facturación», «Garantía» y «Consulta». La tabla de gestión de Postventa DEBE permitir cambiar el «Estado» entre cualquier par de los valores «Abierto», «En revisión» y «Resuelto», incluida la reapertura desde «Resuelto», y DEBE reflejar el cambio en las tarjetas sin recarga (FR-105).
- **FR-108**: La casilla «Prioridad» del formulario de «Nuevo Ticket» DEBE ofrecer «Baja», «Media» y «Alta», sin opción preseleccionada. La casilla «Nota de resolución» DEBE ser obligatoria solo cuando el «Estado» guardado sea «Resuelto»; en los estados «Abierto» y «En revisión» DEBE permanecer opcional. El guardado sin prioridad o sin nota en un ticket resuelto DEBE rechazarse con `Completa los campos obligatorios.` (FR-006).
- **FR-109**: La barra lateral DEBE incluir «Postventa» como quinta opción, inmediatamente después de «Marketing», y DEBE resaltarla cuando esté activa (FR-037). Al abrir el apartado DEBE mostrarse el botón «Nuevo Ticket» en la parte superior, las tres tarjetas de FR-105 debajo y una tabla de gestión de casos con la lista de tickets registrados y un control para cambiar el estado de cada uno. Sin tickets, la tabla DEBE mostrar un estado vacío explícito y las tarjetas DEBEN mostrar `0` (FR-046).

### Matriz de permisos (fuente única)

| Rango                            | Panel y búsqueda de fichas                        | Resumen                          | Marketing                     | Postventa                                   | Equipo de ventas y logros                   | Gestionar usuarios            | Crear/editar/eliminar clientes                                                | Interacciones                                                                                                             | Campañas                                                                |
| -------------------------------- | ------------------------------------------------- | -------------------------------- | ----------------------------- | ------------------------------------------- | ------------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Visitante (sin sesión)           | Solo formulario público (FR-069) y chat (FR-084)  | No                               | No                            | No                                          | No                                          | No                            | No                                                                            | Solo mensajes del chat con consentimiento                                                                                 | No                                                                      |
| Nivel 1 - Atencion al Cliente    | Busca y ve ficha e historial de cualquier cliente | No                               | No                            | Crea tickets y cambia cualquier estado (FR-106) | No                                    | No                            | No                                                                            | Registra solo «Llamada» o «Correo» en cualquier cliente y da seguimiento a consultas del chat (FR-083); no cambia estados | No                                                                      |
| Nivel 2 - Ejecutivo de Ventas    | Busca y ve ficha de cualquier cliente             | Solo sus seguimientos pendientes | No                            | Solo consulta los tickets de sus clientes (FR-106) | Solo su real y objetivo mensuales | No                            | Crea clientes; edita solo los que tenga como «Ejecutivo Asignado»; no elimina | Registra y cambia el estado solo en sus clientes                                                                          | No                                                                      |
| Nivel 3 - Ejecutivo de Marketing | Busca y ve ficha de cualquier cliente y prospecto | No                               | Acceso completo (US16 a US21) | No                                          | Solo lectura                                | No                            | No; crea prospectos desde Marketing                                           | Consulta conversaciones del chat                                                                                          | Crea, edita, detiene y consulta; no puede detener las de otros usuarios |
| Nivel 4 - Gerente Comercial      | Acceso total                                      | De todo el equipo                | Acceso total                  | Acceso total                                | Crea, edita y elimina equipos e integrantes | Sí, desde el menú del usuario | Crea, edita, archiva, restaura y elimina clientes sin registros; archiva en lugar de eliminar si hay historial (FR-003, FR-103) | Acceso total                                                                                                              | Crea y detiene cualquier campaña                                        |

#### Catálogo canónico de acciones

La tabla anterior es la única fuente de verdad. Los identificadores canónicos son: `panel:view`, `search:view`, `entity:view_any`, `entity:view_own`, `entity:create`, `entity:edit_any`, `entity:edit_own`, `entity:delete`, `document:create`, `document:read`, `document:edit_any`, `document:edit_own`, `document:transition_own`, `document:delete`, `summary:view_all`, `summary:view_own`, `marketing:view`, `marketing:manage`, `postventa:view`, `postventa:view_own`, `postventa:create`, `postventa:transition`, `team:view_all`, `team:view_own`, `team:manage`, `chat:view`, `chat:answer`, `chat:create_query`, `campaign:create`, `campaign:view`, `campaign:edit_own`, `campaign:stop_own`, `campaign:stop_any`, `users:manage`, `permissions:view` y `permissions:edit`.

El contexto `ownerId` identifica al usuario asignado (`Ejecutivo Asignado`), al creador de la campaña o al integrante vinculado según la acción; `campaignOwnerId` identifica al creador de la campaña. Las acciones con sufijo `_own` fallan si falta el contexto o si el usuario autenticado no coincide con él. `permissions:edit` NO DEBE concederse a ningún rango y `permissions:view` solo permite consultar la matriz, nunca modificarla. `contracts/auth.md` y `data-model.md` DEBEN reflejar este catálogo sin introducir identificadores adicionales.

### Requisitos de Extensibilidad _(obligaciones del módulo base)_

Los módulos personalizados construidos sobre esta base DEBEN poder:

- **XR-001**: Extender los registros de entidad y documento con campos adicionales específicos del dominio sin cambiar la estructura de almacenamiento base.
- **XR-002**: Reetiquetar pantallas, pestañas, formularios y listas con terminología específica del módulo sin alterar el comportamiento de navegación.
- **XR-003**: Añadir reglas de validación específicas del módulo junto a las reglas de validación base.
- **XR-004**: Apoyarse en el módulo base para generación de identidad, marcas de tiempo, integridad referencial entre entidades y documentos, y eliminación en cascada.
- **XR-005**: Remarcar el espacio de trabajo —nombre del módulo, logotipo derivado y color de acento— únicamente mediante configuración.

### Entidades Clave _(incluir si la funcionalidad implica datos)_

- **Entidad**: Un registro de datos maestros gestionado por el módulo, que incluye un `id` interno único, un entity_id autogenerado de exposición, su nombre, código de negocio, detalles descriptivos, categoría de clasificación, una fecha objetivo opcional, marcas de tiempo y los campos personalizados declarados por la configuración. En el perfil de clientes, esta fecha se etiqueta como "Fecha de nacimiento" y se restringe según FR-047, el código de negocio se genera automáticamente de forma oculta y única (FR-052), y el dato de contacto adicional se guarda únicamente para el canal elegido (FR-060). En el apartado de Marketing, una Entidad con estado inicial «Prospecto» representa una visita capturada que puede convertirse en Cliente conservando su identidad e historial (FR-068). Los módulos personalizados definen qué representa una Entidad en el mundo real (p. ej., cliente, producto, activo). Una entidad archivada conserva la marca opcional `archivedAt` y todo su historial, y se distingue de una entidad activa en la búsqueda sin borrar sus documentos (FR-103).
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
- **Ticket de Postventa**: Documento vinculado a un cliente existente mediante `entity_id` que registra reclamos, dudas técnicas, solicitudes de garantía o consultas posteriores a la compra; sus campos propios son «Asunto», «Categoría», «Prioridad» y «Nota de resolución», y su «Estado» se gobierna desde el apartado «Postventa» (FR-104).

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
- **SC-038**: El 100% de las verificaciones de ciclo de vida de clientes confirman que archivar conserva `archivedAt`, documentos y campos; que restaurar devuelve el cliente a «Activos»; que la eliminación pide confirmación y se bloquea con registros vinculados ofreciendo el archivado; que los filtros separan activos de archivados; y que panel, resumen y Marketing recalculan sus indicadores sin contar clientes archivados (FR-103, US24).
- **SC-039**: El 100% de las verificaciones de Postventa confirman que «Postventa» aparece en la barra lateral después de «Marketing», que «Nuevo Ticket» abre el formulario con «Cliente» desplegable y buscable, «Categoría» y «Prioridad» con las opciones definidas, que cada ticket queda vinculado a su cliente, que las tres tarjetas coinciden con los estados almacenados y se actualizan sin recarga, y que cualquier cambio entre «Abierto», «En revisión» y «Resuelto» se persiste (FR-104, FR-105, FR-107, FR-109, US25).
- **SC-040**: El 100% de las verificaciones de permisos de Postventa confirman que Atención al Cliente y Gerencia crean tickets y cambian cualquier estado, que Ventas solo consulta los de sus clientes, que Marketing y los visitantes no acceden ni por enlace profundo, y que toda operación denegada se rechaza con «No tienes permiso para realizar esta acción» (FR-106, US25).

## Suposiciones

- El módulo base gestiona datos para un único espacio de trabajo en lugar de una base de datos multiinquilino compartida.
- La adaptación a un módulo específico se realiza mediante un archivo de configuración del módulo en lugar de editando archivos fuente centrales.
- Cada entidad incluye información básica suficiente para identificación y seguimiento; los módulos personalizados aportan los campos específicos del dominio.
- La versión inicial se centra en la gestión central de datos maestros y documentos en lugar de capacidades ERP avanzadas como flujos de aprobación, períodos de contabilización o informes.
- La búsqueda se realiza sobre los registros de entidad almacenados.
- La pantalla de gestión consolida los formularios de añadir/editar entidad y añadir/editar documento en una sola pantalla de gestión.
- La navegación entre Panel, Buscar, Resumen, Marketing y Postventa ocurre mediante una barra lateral persistente, mientras que Clientes e Interacciones solo se acceden desde el panel principal; la pantalla de gestión aloja ambos paneles de gestión y no muestra la lista de entidades.
- El logotipo se genera como un monograma SVG en línea derivado del nombre del módulo; no se requieren recursos de imagen externos.
- Se puede configurar un color de acento opcional para la marca; el resto de la paleta base permanece fija.
- Solo se muestra una pantalla a la vez; no hay diseño lado a lado del contenido de gestión y búsqueda.
- La navegación entre pantallas se maneja dentro de la aplicación (p. ej., cambio de vistas), y el botón atrás del navegador debe comportarse de forma predecible.
- Los datos siguen persistiéndose en el localStorage del navegador y no se ven afectados por la navegación entre pantallas.
- La fecha actual para el límite de "Fecha de nacimiento" en el perfil de clientes se determina con la hora local del dispositivo del usuario.
- La pantalla de búsqueda se centra en encontrar y ver entidades; la edición permanece en la pantalla de gestión.
- El seguimiento en redes sociales, el apartado «Dudas y consultas» y las campañas programadas funcionan sin servicios externos: las interacciones se registran dentro del módulo, las respuestas rápidas se derivan de la configuración y las campañas ejecutan solo reglas internas.
- El contenido del usuario introducido por el usuario (nombres, descripciones, notas de documentos) DEBE sanitizarse antes de renderizarse en el DOM para prevenir ataques de inyección de scripts (XSS). El módulo base DEBE escapar HTML y atributos de eventos al mostrar datos de localStorage.
- Los tickets de Postventa son Documentos vinculados a clientes existentes: se crean desde el apartado «Postventa», aparecen en la ficha del cliente y no se registran desde el formulario público (FR-104).
- La autenticación es local y simulada, sin backend, con fines demostrativos; una implementación productiva requeriría autenticación en servidor.
- El inicio de sesión funciona en modo demostración: solo existen `gerente`, `marketing`, `ventas` y `atencion`, y cualquier contraseña no vacía permite entrar. No hay verificación de hash, contraseñas incorrectas ni bloqueo por intentos fallidos; la sesión, la expiración y la matriz de permisos se conservan.
