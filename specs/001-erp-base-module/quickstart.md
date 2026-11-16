# Inicio Rápido: Módulo Base de Gestión de Relaciones con Clientes (CRM)

## Configuración

1. Instale las dependencias con `npm install`.
2. Inicie el servidor de desarrollo con `npm run dev`.
3. Abra la URL local de Vite en un navegador.

## Flujo de Usuario Principal

1. Aterrice en el panel CRM y use un botón de acción rápida (nuevo cliente, nueva oportunidad, gestión de clientes o buscar registros).
2. Cree un cliente usando el formulario (con campos personalizados como industria, canal de origen y ejecutivo asignado si están configurados).
3. Busque un cliente usando la pantalla de búsqueda.
4. Edite o elimine un cliente desde el área de gestión.
5. Registre oportunidades asociadas al cliente y gestione su estado según el embudo comercial configurado.
6. Cambie entre módulos usando la barra lateral; actualice la página para confirmar que los datos persisten y el marco con marca permanece consistente.

## Validación

- Verifique que los campos obligatorios muestran errores de validación.
- Verifique que un `code` duplicado se rechaza con una explicación, incluso si solo difiere en mayúsculas o espacios.
- Verifique que una oportunidad exige folio entero positivo y que el descuento no puede superar el subtotal.
- Verifique que un correo electrónico con formato inválido se rechaza con una explicación.
- Verifique que los resultados de búsqueda se actualizan a medida que el usuario escribe.
- Verifique que la lista permanece consistente tras las acciones de edición y eliminación.
- Verifique que eliminar un cliente pide confirmación e indica cuántas oportunidades asociadas se eliminarán.
- Verifique que sin `statusLifecycle` configurado el estado de la oportunidad acepta texto libre.
- Verifique que con el ciclo de vida CRM configurado solo se permiten transiciones válidas del embudo: Prospecto → Contactado → Propuesta Enviada → Negociación → Cerrada Ganada/Cerrada Perdida.
- Verifique que una configuración inválida arranca con los valores predeterminados y muestra una advertencia visible.
- Verifique que al retirar un campo personalizado de la configuración sus valores guardados se conservan y se ocultan, y reaparecen al volver a declararlo.
- Verifique que las estadísticas del panel coinciden con el número de clientes y oportunidades almacenados.

## Extender el Módulo Base (perfil CRM)

Los módulos CRM personalizados adaptan la base mediante un único archivo de configuración (`src/module-config.js`) en lugar de editar el código central:

1. Establezca el nombre del módulo y los mapeos de términos: `Cliente/Clientes` y `Oportunidad/Oportunidades`.
2. Declare campos personalizados de cliente: `industria` (texto), `canalOrigen` (select: Web, Referido, Evento, Llamada, Otro) y `ejecutivoAsignado` (texto).
3. Defina el ciclo de vida de estados de oportunidades (embudo comercial): Prospecto, Contactado, Propuesta Enviada, Negociación, Cerrada Ganada, Cerrada Perdida, con sus transiciones permitidas.
4. Opcionalmente establezca `theme.accentColor` para remarcar el espacio de trabajo.
5. Añada reglas de validación específicas del módulo junto a las reglas base donde sea necesario.

La generación de identidad, marcas de tiempo, integridad referencial entre clientes y oportunidades, eliminación en cascada, navegación y búsqueda siguen siendo gestionadas por el módulo base. Sin archivo de configuración, la aplicación se ejecuta con el comportamiento predeterminado.
