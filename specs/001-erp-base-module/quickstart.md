# Inicio Rápido: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

## Configuración

1. Instale las dependencias con `npm install`.
2. Ejecute la suite automatizada con `npm test` y la comprobación de estilo con `npm run lint` antes de validar en el navegador.
3. Inicie el servidor de desarrollo con `npm run dev`.
4. Abra la URL local de Vite en un navegador.

## Flujo de Usuario Principal

1. Aterrice en el panel ERP y use un botón de acción rápida (nueva entidad, nuevo documento, gestión de entidades, gestión de documentos o buscar registros), o abra Marketing o Postventa desde la barra lateral.
2. Cree una entidad usando el formulario y añádale un documento asociado.
3. Busque una entidad usando la pantalla de búsqueda y abra su ficha para ver el historial de documentos ordenado por fecha.
4. Edite o elimine una entidad desde el área de gestión; confirme que la ficha de esa entidad refleja el cambio.
5. Abra el resumen de indicadores y confirme que los totales y los documentos pendientes coinciden con los registros almacenados.
6. Cambie entre módulos usando la barra lateral; actualice la página para confirmar que las entidades persisten en el almacenamiento local y que el marco con marca (logotipo, nombre del módulo) permanece consistente.

## Validación

- Verifique que los campos obligatorios muestran errores de validación.
- Verifique que un `code` duplicado se rechaza con una explicación, incluso si solo difiere en mayúsculas o espacios.
- Si el módulo declara campos personalizados equivalentes (p. ej. folio, subtotal y descuento), verifique que el folio sea entero positivo y que el descuento no supere el subtotal (validaciones de módulo definidas por configuración, no reglas base fijas).
- Si el módulo declara un campo personalizado de correo electrónico, verifique que un valor con formato inválido se rechaza con una explicación.
- Verifique que los resultados de búsqueda se actualizan a medida que el usuario escribe.
- Verifique que la lista permanece consistente tras las acciones de edición y eliminación.
- Verifique que eliminar una entidad pide confirmación e indica cuántos documentos asociados se eliminarán.
- Verifique que sin `statusLifecycle` configurado el estado del documento acepta texto libre.
- Verifique que `statusLifecycle.pendingStates` cuenta como pendientes solo los estados marcados explícitamente, y que sin esa clave se usa la coincidencia normalizada con "pendiente".
- Verifique que al cambiar de vista o módulo con un formulario modificado aparece una confirmación y que los cambios se conservan si se decide quedarse.
- Verifique que una configuración inválida arranca con los valores predeterminados y muestra una advertencia visible.
- Verifique que al retirar un campo personalizado de la configuración sus valores guardados se conservan y se ocultan, y reaparecen al volver a declararlo.
- Verifique que las estadísticas del panel coinciden con el número de registros almacenados.
- Verifique que la ficha de una entidad muestra sus documentos ordenados por fecha y refleja ediciones hechas en la pantalla de gestión.
- Verifique que el resumen de indicadores muestra cero con un estado vacío claro cuando no hay entidades ni documentos, y se actualiza tras crear o completar un documento pendiente.

## Validación del Perfil de Clientes

1. Abra el módulo CRM y confirme que el campo se llama "Fecha de nacimiento" en el formulario, la lista, la ficha, la búsqueda y los filtros.
2. Confirme que el selector permite `1910-01-01` y la fecha local de hoy, pero rechaza `1909-12-31`, el día siguiente a hoy, `1910-02-29` y `2026-02-30`.
3. Deje el formulario abierto hasta el cambio de día local (o use el reloj falso de las pruebas) y confirme que el límite máximo y el texto de ayuda se actualizan sin recargar.
4. Cargue un cliente con fecha antigua fuera de rango, verifique que se muestra igual, y confirme que al editarlo se exige corregir la fecha antes de guardar.
5. Cambie a un perfil sin `entityDate` y confirme que el campo vuelve a llamarse "Fecha objetivo" y admite fechas futuras.

La forma exacta de la regla está en [`contracts/entity-storage.md`](contracts/entity-storage.md#contrato-de-configuración-entitydate) y su efecto en el modelo en [`data-model.md`](data-model.md#21-regla-de-fecha-de-entidad).

## Validación del Perfil de Clientes (segunda tanda)

1. Abra el formulario de registro y confirme que no aparecen «Código», «Categoría», «Descripción» ni «Nº de pedidos»; compruébelo también en la lista, la ficha y la búsqueda.
2. Guarde un cliente y confirme que se le asignó un código interno único que no se ve en ninguna vista; repita el registro y compruebe que el código generado es distinto.
3. Intente guardar sin «Fecha de nacimiento», sin «Canal de Contacto» o sin «RUT»: el sistema debe rechazarlo y explicar qué falta.
4. Introduzca un RUT con dígito verificador incorrecto y luego el RUT válido de otro cliente: ambos intentos deben rechazarse con un mensaje claro.
5. Confirme que «Canal de Contacto» aparece sin selección y que, al elegir «llamada», «whatsapp», «correo» o «reunión», aparece respectivamente «Teléfono», «WhatsApp», «Correo electrónico» o «Lugar/Enlace de reunión».
6. Deje vacía la casilla condicional o escriba un valor con formato incorrecto para el canal (p. ej. un correo sin `@`): el guardado debe fallar indicando el formato esperado.
7. Cambie de canal después de rellenar la casilla, guarde y verifique que solo se conserva el dato del canal final.
8. Busque por un valor de categoría, descripción o código interno de un cliente: no debe devolver resultados; busque por nombre, fecha de nacimiento, RUT o campo de contacto visible: debe encontrarlo, y el placeholder no debe mencionar campos ocultos.
9. Cargue un cliente heredado sin RUT o con RUT inválido, intente abrir su ficha y confirme que se bloquea con la explicación de los campos pendientes; edítelo, complételo y guarde: la ficha debe quedar desbloqueada.
10. Compruebe que los clientes heredados con valores en «Código», «Categoría», «Descripción» o «Nº de pedidos» no los muestran en ninguna vista, pero los conservan en `localStorage` y siguen mostrando su historial de interacciones.

La forma de las reglas está en [`contracts/entity-storage.md`](contracts/entity-storage.md#contrato-de-fieldrules-y-detailpolicy) y su efecto en el modelo en [`data-model.md`](data-model.md#22-reglas-de-campo-del-perfil-de-clientes).

## Validación del Perfil de Clientes (tercera tanda)

1. Abra el formulario de registro: el título debe decir «Nuevo Cliente» y la acción rápida de creación del panel también debe mostrar «Nuevo Cliente».
2. Compruebe que las casillas aparecen en este orden: «Nombre de Cliente», «RUT», «Fecha de nacimiento», «Canal de Contacto» con su casilla adicional, «Tipo de actividad» y «Ejecutivo Asignado».
3. En «RUT», confirme que la pista gris es `Ej: 11.111.111-1` y que no se guarda como valor; guarde un RUT con puntos (`12.345.678-9`) y luego el mismo RUT sin puntos (`12345678-9`) en otro cliente: el segundo debe rechazarse por repetido.
4. Despliegue «Canal de Contacto» y verifique que las opciones son «Llamada», «Correo», «Reunión» y «WhatsApp», y que al guardar se conservan los valores internos `llamada`, `correo`, `reunion` y `whatsapp`.
5. Al elegir cada canal, compruebe la pista gris de su casilla adicional: `Ej: +56 9 1234 5678` para «Llamada» y «WhatsApp», `Ej: nombre@ejemplo.cl` para «Correo» y `Ej: Sala 2 o enlace» para «Reunión». La pista no debe contarse como valor al guardar.
6. Despliegue «Tipo de actividad» y confirme que ofrece solo «Dependiente», «Independiente Formal», «Independiente Informal», «Jubilado», «Dueño/a de casa», «Estudiante», «FFAA», «Rentista», «Jubilado - FFAA» y «Cesante», y que la clave almacenada sigue siendo `rubro`.

La forma de estas reglas está en [`contracts/entity-storage.md`](contracts/entity-storage.md#contrato-de-presentación-del-formulario-de-clientes) y su efecto en el modelo en [`data-model.md`](data-model.md#22-reglas-de-campo-del-perfil-de-clientes).

## Validación del Apartado de Marketing

1. Abra el panel principal y confirme que la barra lateral muestra Panel, Buscar, Resumen y Marketing; «Clientes» e «Interacciones» no aparecen y el panel ya no ofrece «Abrir Marketing».
2. Compruebe que el panel ofrece las acciones rápidas de nueva entidad, nuevo documento, abrir gestión de entidades, abrir gestión de documentos y buscar registros; verifique que las gestiones de entidades y documentos se alcanzan solo desde ahí.
3. Abra Marketing y confirme las cinco tarjetas del panel —entidades, documentos, «Cerrado ganado», «Tasa de conversión» y «Pipeline (USD)»— y el mismo embudo por estados de documento, con idénticos valores que en el panel.
4. Confirme que Marketing no muestra la torta «Estado comercial de la cartera» ni el selector de etapas, y que la lista «Últimas Interacciones / Próximos Seguimientos» coincide con la del panel.
5. Con cero registros, verifique que las tarjetas y el embudo muestran cero con un estado vacío claro.
6. En la vista `?view=capture`, envíe el formulario sin marcar el consentimiento: no debe crearse el prospecto y debe mostrarse `Completa los campos obligatorios.`.
7. Envíe el formulario con consentimiento y confirme que se creó una entidad con `estado_comercial = prospecto`, fecha y versión del aviso guardadas, y que el visitante ve exactamente `Prospecto registrado correctamente.`.
8. Cree, edite y elimine documentos «Cerrado ganado» y confirme que las tarjetas, el embudo y los valores del panel se actualizan sin recarga y sin duplicar documentos.
9. Verifique que `estado_comercial` y las reglas automáticas siguen operando internamente, sin mostrarse en Marketing, y que cada ejecución aparece como documento en la ficha de la entidad.

La forma de estos datos y reglas está en [`contracts/marketing.md`](contracts/marketing.md) y su efecto en el modelo en [`data-model.md`](data-model.md#3-perfil-de-marketing-historias-de-usuario-16-a-21).

## Validación de Atajos y Terminología de Marketing

1. Abra el panel principal y confirme que sigue ofreciendo cinco acciones rápidas: nueva entidad, nuevo documento, gestionar entidades, gestionar documentos y buscar registros.
2. Abra Marketing y confirme que no aparece ninguna de esas cinco acciones rápidas ni el marcado `.quick-actions`, pero que las cinco tarjetas y el embudo siguen mostrando los mismos valores que en el panel.
3. Compruebe que Marketing ofrece exactamente cinco atajos en este orden: «Equipos de ventas y logros», «Campañas», «Rendimiento de campañas», «Dudas y consultas» y «Redes sociales».
4. Active cada atajo y verifique que abre su sección de Marketing sin llevar a las vistas de gestión del panel; vuelva al panel para confirmar que sus cinco acciones rápidas siguen disponibles.
5. Confirme que «Dudas y consultas» sustituye a «Chat» en el encabezado de Marketing, en `?view=capture` y en el texto de consentimiento y de error; envíe una consulta con consentimiento y compruebe que el documento sigue visible en la ficha de la entidad tras recargar.

## Validación de Equipos de ventas y logros, Redes y Dudas y consultas

1. Abra «Equipos de ventas y logros», cree un equipo y un integrante con nombre, cargo y estado, confirme que no hay casillas para capturar objetivo mensual ni real mensual, y recargue la página para verificar que la definición persiste.
2. Registre documentos «Cerrado ganado» del mes para el ejecutivo asignado y confirme que el real mensual es la suma de sus importes y que el objetivo mensual es la proyección `ventas ÷ días transcurridos × días del mes`; sin ventas, ambos muestran cero.
3. Abra «Redes sociales», registre una interacción de Instagram vinculada a un prospecto con plataforma, fecha, tipo, nota y enlace, y compruebe que aparece ordenada por fecha en la vista y en la ficha de la entidad.
4. Abra «Dudas y consultas» desde `?view=capture` y desde Marketing; confirme que una pregunta configurada recibe su respuesta rápida sin recarga y que una pregunta sin coincidencia muestra el acuse exacto `Consulta registrada; un ejecutivo hará seguimiento.` y queda guardada como documento para seguimiento.
5. Intente enviar el primer mensaje sin marcar el consentimiento de «Dudas y consultas»: el envío debe bloquearse y no debe registrarse ningún mensaje.
6. Compruebe que los mensajes de «Dudas y consultas» (con `canal: 'chat'`) y las interacciones de redes aparecen en la ficha de la entidad vinculada y permanecen intactos al navegar entre vistas.

## Validación de Campañas y Rendimiento

1. Cree una campaña con nombre, etapa objetivo «En proceso» y fechas de inicio y fin; verifique que puede editarse, detenerse y consultarse, recargue la página para comprobar que la definición persiste, y confirme que su historial se conserva al finalizar.
2. Con un prospecto en la etapa objetivo, dispare un evento de captura, cambio de etapa o interacción y confirme que la acción se limita a crear un documento de seguimiento, asignar un ejecutivo o actualizar el estado comercial interno; compruebe que no se envía correo ni se publica en redes.
3. Cree dos campañas activas para el mismo prospecto y evento: solo debe ejecutarse la más reciente y la otra debe quedar registrada como «omitida por solapamiento», sin acciones duplicadas.
4. Asigne el campo opcional «Campaña» a un prospecto, una interacción y una venta; deje otro registro sin campaña y confirme que aparece bajo «Sin campaña».
5. Abra «Rendimiento de campañas» y confirme que los indicadores globales y por campaña —prospectos, conversión por etapa, interacciones, consultas respondidas y ventas «Cerrado ganado»— coinciden con los registros almacenados y se actualizan sin recarga.
6. Seleccione una campaña sin registros y confirme que los indicadores muestran cero con el mensaje exacto `Sin registros para esta campaña.`.

La forma de campañas, atribución e indicadores está en [`contracts/marketing.md`](contracts/marketing.md#forma-de-los-datos) y su efecto en el modelo en [`data-model.md`](data-model.md#6-campañas-de-marketing).

## Validación de Postventa

1. Confirme que la barra lateral muestra «Postventa» como quinta opción, inmediatamente debajo de Marketing, y que abre `?view=postventa` con el marco ERP y «Nuevo Ticket» arriba.
2. Pulse «Nuevo Ticket»: debe abrirse `?view=ticket-form` en una pestaña nueva del navegador, sin barra superior ni lateral, mientras la vista de Postventa permanece intacta en la pestaña original. En la pestaña nueva compruebe el orden de las casillas: «Cliente», «Asunto», «Categoría», «Prioridad», «Estado» y «Nota de resolución».
3. En «Cliente», compruebe que el desplegable ofrece solo clientes existentes y que escribir en el buscador filtra por nombre sin crear un cliente nuevo.
4. Despliegue «Categoría» y confirme exactamente «Soporte técnico», «Facturación», «Garantía» y «Consulta»; despliegue «Prioridad» y confirme «Baja», «Media» y «Alta» sin selección previa.
5. Guarde sin elegir prioridad y luego con estado «Resuelto» sin nota: ambos intentos deben mostrar `Completa los campos obligatorios.` y no crear el ticket.
6. Cree un ticket en «Abierto» para un cliente existente; confirme que «Tickets abiertos» aumenta en uno, que «En proceso» y «Resueltos» no cambian y que el ticket aparece en la ficha del cliente.
7. Cambie el estado a «En revisión» y luego a «Resuelto» escribiendo una nota; confirme que las tres tarjetas y la tabla se actualizan sin recarga y que «Resueltos» cuenta el ticket una sola vez.
8. Reabra el ticket de «Resuelto» a «Abierto»; confirme que la transición se acepta, que «Tickets abiertos» vuelve a aumentar y que el ticket sigue en la ficha del cliente.
9. Guarde un ticket en «Abierto» con texto en «Nota de resolución» y confirme que el texto no se conserva; guárdelo en «Resuelto» con nota y compruebe que sí se conserva.
10. Inicie sesión como `atencion` (N1) y como `gerente` (N4): ambos deben crear tickets y cambiar cualquier estado. Inicie como `ventas` (N2): debe ver solo los tickets de sus clientes, sin botón «Nuevo Ticket» ni control de estado. Inicie como `marketing` (N3) o sin sesión: no debe acceder ni por enlace profundo, consola o llamada directa a `storage.js`.
11. Abra directamente `?view=postventa`, use Back/Forward y recargue: la vista debe resolverse con la matriz en cada caso y la denegación debe mostrar `No tienes permiso para realizar esta acción`.

12. Con Postventa abierta en una pestaña y el formulario en otra, guarde un ticket en la pestaña nueva y confirme que la pestaña original muestra la nueva fila y recalcula las tres tarjetas sin pulsar recargar.
13. Abra `?view=ticket-form` como enlace profundo con `ventas` (N2), `marketing` (N3) o sin sesión: debe mostrar «Acceso denegado» o el inicio de sesión, sin formulario utilizable.
14. Compare visualmente las tres tarjetas de Postventa con los indicadores del apartado «Resumen»: deben tener el mismo tamaño y proporción, conservando sus etiquetas «Tickets abiertos», «En proceso» y «Resueltos» y sus valores.

La forma de los tickets y las reglas está en [`contracts/postventa.md`](contracts/postventa.md) y su efecto en el modelo en [`data-model.md`](data-model.md#9-postventa-historia-de-usuario-25).

## Validación de la Navegación Lateral

1. Recorra todas las pantallas y confirme que la barra lateral mantiene Panel, Buscar, Resumen, Marketing y Postventa con el elemento activo resaltado.
2. Intente localizar los botones de Clientes e Interacciones en la barra lateral: no deben existir en el marcado.
3. Navegue a la gestión de entidades y de documentos desde las acciones rápidas del panel y vuelva al panel: los registros deben permanecer intactos.
4. Abra `?view=manage-entity` y `?view=manage-document`: las vistas deben seguir funcionando como enlaces profundos aunque no figuren en la barra lateral.

## Extender el Módulo Base

Los módulos ERP personalizados adaptan la base mediante un único archivo de configuración (`src/module-config.js`) en lugar de editar el código central:

1. Establezca el nombre del módulo y los mapeos de términos (p. ej., Entidad → Cliente, Documento → Pedido de Venta); cada pantalla se reetiqueta, incluida la barra lateral y el logotipo.
2. Declare campos personalizados por tipo de registro (texto, número, fecha, selección) — aparecen automáticamente en formularios, listas, validación y búsqueda.
3. Defina el ciclo de vida de estados de documentos, las transiciones permitidas y los `pendingStates` del resumen (p. ej., cotización → pedido → facturado, con `pendiente` marcado como pendiente).
4. Opcionalmente declare `entityDate` (etiqueta, `min`, `max` o `localToday`) para renombrar y restringir la fecha base de la entidad.
5. Opcionalmente establezca `theme.accentColor` para remarcar los resaltados y controles principales de todo el espacio de trabajo.
6. Añada reglas de validación específicas del módulo junto a las reglas base donde sea necesario.
7. Si el módulo ofrece Marketing, declare `privacyNoticeVersion`, `captureFields`, `automationRules`, `salesTeams`, `faq` y `campaigns` en el bloque `marketing`; las campañas solo pueden usar acciones internas y la atribución por `campaña` es opcional. Si ofrece Postventa, declare el bloque `postventa` con `states`, `categoryOptions`, `priorityOptions`, `cardMapping` y `resolutionNoteStates`; sin él, la ruta no se registra.

La generación de identidad, marcas de tiempo, integridad referencial entre entidades y documentos, eliminación en cascada, navegación y búsqueda siguen siendo gestionadas por el módulo base. Sin archivo de configuración, la aplicación se ejecuta con el comportamiento predeterminado Entidad/Documento. Consulte `specs/001-erp-base-module/` para la especificación completa.

## Validación de Inicio de Sesión y Sesión

1. Abra la URL raíz del mismo documento HTML, sin parámetro `?view=` y sin host ni ruta de servidor, sin sesión: debe mostrarse solo el formulario con «Usuario» y «Contraseña», sin Panel, Buscar, Resumen, Marketing ni Postventa; el formulario público de `?view=capture` y el chat deben seguir disponibles.
2. Ingrese `gerente`, `marketing`, `ventas` y `atencion`, cada uno con una contraseña cualquiera (por ejemplo, `demo`): los cuatro deben iniciar sesión; se admiten mayúsculas y espacios al inicio o al final del usuario. `gerente` debe mostrar «Nivel 4 - Gerente Comercial» y el menú con «Gestionar usuarios» y «Cerrar sesión».
3. Deje vacío el campo «Contraseña» e intente ingresar como `gerente`: no debe crearse sesión y debe aparecer exactamente `Ingresa una contraseña`.
4. Ingrese un usuario que no sea uno de los cuatro, por ejemplo `desconocido`: no debe crearse sesión y debe aparecer exactamente `Usuario no encontrado`.
5. Recargue la página y luego cierre y vuelva a abrir el navegador: la sesión debe conservarse mientras no haya logout, desactivación ni expiración.
6. Abra directamente `?view=summary` sin sesión: debe redirigir a login y, tras autenticarse como `gerente`, debe abrirse el resumen solicitado.
7. Pulse «Cerrar sesión»: la barra superior desaparece y vuelve a mostrarse solo el login. No hay bloqueo por intentos fallidos; simule 8 horas de inactividad: la sesión debe expirar y redirigir a login.

## Validación de Mensajes Exactos y Rutas

1. Busque un término sin coincidencias: la vista debe mostrar exactamente `No se encontraron resultados.` y no modificar registros.
2. Guarde un cliente con RUT inválido y luego con un RUT repetido: debe mostrar `El RUT es inválido.` y `El RUT ya está registrado.`, respectivamente, sin crear ni modificar el registro.
3. Deje vacía la casilla adicional de contacto o introduzca un formato inválido para el canal elegido: debe mostrar `Revisa el dato de contacto según el canal elegido.`.
4. Abra `?view=summary`, `?view=capture`, `?view=marketing`, `?view=postventa`, `?view=manage-entity`, `?view=manage-document` y `?view=users-admin`, use Back/Forward y recargue: la vista solicitada debe resolverse desde `location.search` con la matriz de permisos; no existe `?view=panel` y el Panel se abre quitando el parámetro `view`.
5. En `?view=capture`, envíe el formulario con consentimiento y compruebe que el visitante ve exactamente `Prospecto registrado correctamente.`; en el chat sin coincidencia con una pregunta frecuente compruebe exactamente `Consulta registrada; un ejecutivo hará seguimiento.`.
6. En «Rendimiento de campañas», seleccione una campaña sin registros y compruebe el mensaje exacto `Sin registros para esta campaña.`; una operación denegada debe mostrar exactamente `No tienes permiso para realizar esta acción`.

La forma de la sesión y las operaciones están en [`contracts/auth.md`](contracts/auth.md#clave-erp_session) y su efecto en el modelo en [`data-model.md`](data-model.md#82-sesión).

## Validación de Permisos por Rango

1. Con `atencion` (Nivel 1), busque «Comercial Andina SpA», vea su historial y registre una «Llamada»; confirme que no puede registrar una «Reunión», cambiar estados, eliminar clientes ni abrir Resumen, Marketing o «Equipo de ventas y logros».
2. Abra `?view=summary` con `atencion`: debe ver «Acceso denegado» y volver al Panel sin ver los 47 seguimientos pendientes.
3. Con `ventas` (Nivel 2), cree «Ferretería Central» con él como «Ejecutivo Asignado» y confirme que puede editarla; intente eliminar «Transportes del Norte Ltda.» y cambiar el estado de sus interacciones: todo debe rechazarse con `No tienes permiso para realizar esta acción`.
4. Desde la consola, intente eliminar «Transportes del Norte Ltda.» mediante una llamada directa a `storage.js`: la capa de datos debe rechazarla con el mismo mensaje y el cliente debe permanecer almacenado.
5. Con `marketing` (Nivel 3), cree la «Campaña Primavera 2026», capture un prospecto y consulte el rendimiento; intente eliminar «Comercial Andina SpA», abrir el resumen y detener una campaña de otro usuario: cada acción debe bloquearse.
6. Con `gerente` (Nivel 4), elimine «Comercial Andina SpA», vea los 47 seguimientos del equipo, detenga la campaña de `marketing` y gestione usuarios; confirme que no existe ninguna pantalla para editar la matriz de permisos.
7. Despliegue «Ejecutivo Asignado» en un formulario de cliente: solo deben aparecer `ventas`, `ana.munoz` y `gerente`, nunca `atencion` ni `marketing`.
8. Con `atencion` y `gerente`, abra Postventa, cree un ticket y cámbielo de «Resuelto» a «Abierto»; ambas acciones deben permitirse.
9. Con `ventas`, abra Postventa: solo debe ver tickets de clientes con él como «Ejecutivo Asignado»; intente crear uno y cambiar un estado desde la consola: la capa de datos debe rechazarlo con `No tienes permiso para realizar esta acción`.
10. Con `marketing` y sin sesión, intente abrir `?view=postventa` y llamar a `createTicketDocument()` desde la consola: debe mostrarse «Acceso denegado» o redirección a login, sin crear ni modificar tickets.

La matriz y las acciones están en [`contracts/auth.md`](contracts/auth.md#matriz-de-srcauthpermissionsjs) y la verificación en `storage.js` en [`contracts/entity-storage.md`](contracts/entity-storage.md#contrato-de-autorización-de-operaciones).

## Validación de Administración de Usuarios

1. Ingrese como `atencion` y abra el menú del usuario: debe ver «Cerrar sesión» pero no «Gestionar usuarios».
2. Ingrese como `gerente`, abra el menú del usuario y seleccione «Gestionar usuarios»: la pantalla debe listar los cuatro usuarios semilla con rango y estado.
3. Intente crear un usuario llamado `Pedro.Soto`: el guardado debe rechazarse por duplicado y el usuario original debe conservar su identidad, rango y clientes.
4. Cambie el rango de `ana.munoz` a Nivel 3 y confirme que, en su siguiente acción o recarga, la barra superior y los permisos reflejan el cambio.
5. Desactive a `ventas` mientras tiene sesión iniciada: en la siguiente acción o recarga debe redirigirse a login, sus clientes deben mostrarse como «Sin asignar» hasta reasignarlos y sus ventas históricas deben seguir contando en el integrante vinculado.

La forma de usuarios y reglas está en [`contracts/auth.md`](contracts/auth.md#clave-erp_users) y su efecto en el modelo en [`data-model.md`](data-model.md#81-usuario).
