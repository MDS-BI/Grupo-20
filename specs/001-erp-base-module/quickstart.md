# Inicio Rápido: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

## Configuración

1. Instale las dependencias con `npm install`.
2. Inicie el servidor de desarrollo con `npm run dev`.
3. Abra la URL local de Vite en un navegador.

## Flujo de Usuario Principal

1. Aterrice en el panel ERP y use un botón de acción rápida (nueva entidad, nuevo documento, gestión de entidades o buscar registros).
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
8. Busque por un valor de categoría o descripción de un cliente: no debe devolver resultados; busque por nombre o fecha de nacimiento: debe encontrarlo.
9. Cargue un cliente heredado sin RUT o con RUT inválido, intente abrir su ficha y confirme que se bloquea con la explicación de los campos pendientes; edítelo, complételo y guarde: la ficha debe quedar desbloqueada.

La forma de las reglas está en [`contracts/entity-storage.md`](contracts/entity-storage.md#contrato-de-fieldrules-y-detailpolicy) y su efecto en el modelo en [`data-model.md`](data-model.md#22-reglas-de-campo-del-perfil-de-clientes).

## Extender el Módulo Base

Los módulos ERP personalizados adaptan la base mediante un único archivo de configuración (`src/module-config.js`) en lugar de editar el código central:

1. Establezca el nombre del módulo y los mapeos de términos (p. ej., Entidad → Cliente, Documento → Pedido de Venta); cada pantalla se reetiqueta, incluida la barra lateral y el logotipo.
2. Declare campos personalizados por tipo de registro (texto, número, fecha, selección) — aparecen automáticamente en formularios, listas, validación y búsqueda.
3. Defina el ciclo de vida de estados de documentos, las transiciones permitidas y los `pendingStates` del resumen (p. ej., cotización → pedido → facturado, con `pendiente` marcado como pendiente).
4. Opcionalmente declare `entityDate` (etiqueta, `min`, `max` o `localToday`) para renombrar y restringir la fecha base de la entidad.
5. Opcionalmente establezca `theme.accentColor` para remarcar los resaltados y controles principales de todo el espacio de trabajo.
6. Añada reglas de validación específicas del módulo junto a las reglas base donde sea necesario.

La generación de identidad, marcas de tiempo, integridad referencial entre entidades y documentos, eliminación en cascada, navegación y búsqueda siguen siendo gestionadas por el módulo base. Sin archivo de configuración, la aplicación se ejecuta con el comportamiento predeterminado Entidad/Documento. Consulte `specs/001-erp-base-module/` para la especificación completa.
