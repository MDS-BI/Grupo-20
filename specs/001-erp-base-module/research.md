# Investigación: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

## Decisión: Usar Vite con HTML, CSS y JavaScript vanilla

**Justificación**: La solicitud enfatiza un enfoque de mínimas librerías y una implementación ligera. Vite proporciona una experiencia de desarrollo rápida y un pipeline de construcción simple sin requerir un framework más pesado. JavaScript vanilla mantiene la aplicación fácil de entender, fácil de probar y fácil de mantener para una pequeña aplicación de página única, y deja a los módulos personalizados libres de adoptar cualquier enfoque de interfaz por encima de ella.

## Alternativas consideradas

- React o Vue: Ecosistema de componentes más sólido, pero añade más abstracción y sobrecarga de dependencias de las necesarias para este alcance.
- HTML estático plano sin Vite: Más simple, pero Vite ofrece un mejor flujo de trabajo de desarrollo local y paso de construcción para crecimiento futuro.
- Persistencia en backend con base de datos: No es necesaria para un módulo base de espacio único y añadiría complejidad innecesaria; el contrato de almacenamiento está aislado, por lo que un backend puede introducirse más tarde sin cambiar la lógica del módulo.

## Decisiones adicionales

- Se usará localStorage del navegador para la persistencia porque el módulo base es de espacio único y no necesita almacenamiento del lado servidor.
- La interfaz inicial será una experiencia de página única con un panel, campo de búsqueda y lista de entidades.
- La aplicación favorecerá la mejora progresiva y los controles de formulario nativos accesibles sobre widgets personalizados complejos.
- El modelo de datos separa los datos maestros (Entidad) de los registros transaccionales (Documento), vinculados por un identificador público autogenerado (`entity_id`), de modo que los módulos personalizados puedan adjuntar cualquier significado de dominio a ambos lados sin cambios estructurales.
- Las preocupaciones base (generación de identidad, marcas de tiempo, integridad referencial, eliminación en cascada) residen en la capa de almacenamiento, manteniendo los módulos personalizados limitados a campos, etiquetas y reglas de validación.

## Decisiones de aclaración (sesión 2026-11-01)

### Decisión: El código de entidad es único

**Justificación**: El código es la clave de negocio que los usuarios usan para identificar registros; permitir duplicados haría ambiguas las referencias y debilitaría la validación. Se compara recortado y sin distinguir mayúsculas para evitar duplicados accidentales por formato.

**Alternativas consideradas**: Permitir duplicados con advertencia (no garantiza integridad); permitir duplicados sin aviso (rechazado por riesgo operativo).

### Decisión: Estado de documento como texto libre sin ciclo de vida configurado

**Justificación**: Mantener el texto libre preserva la extensibilidad del módulo base y coincide con FR-031; los cuatro estados del modelo de datos son solo ejemplos, no un catálogo obligatorio.

**Alternativas consideradas**: Lista fija de cuatro estados (limita módulos personalizados); desplegable editable (añade complejidad sin beneficio para la base).

### Decisión: Configuración inválida → valores predeterminados con advertencia visible

**Justificación**: Evita una pantalla muerta, permite seguir operando con los datos y cumple el requisito de informar del problema en lugar de fallar silenciosamente.

**Alternativas consideradas**: Bloquear la aplicación con pantalla de error (impide trabajar); registrar solo en consola (no cumple el aviso claro al usuario).

### Decisión: Conservar y ocultar valores de campos personalizados no declarados

**Justificación**: Evita pérdida de datos al evolucionar la configuración y permite recuperar los valores si el campo se vuelve a declarar; solo cambia la presentación, no el almacenamiento.

**Alternativas consideradas**: Eliminar los valores huérfanos (pérdida irreversible); mostrarlos en solo lectura (expone campos que el módulo ya no define).

### Decisión: Confirmación con recuento antes de eliminar una entidad

**Justificación**: La eliminación en cascada es irreversible; indicar cuántos documentos se eliminarán hace explícito el impacto y reduce pérdidas accidentales.

**Alternativas consideradas**: Confirmación simple sin recuento (menos informativa); eliminación inmediata (riesgo alto de pérdida de datos).

## Decisiones de aclaración (sesión 2026-11-23)

### Decisión: Regla de fecha de entidad declarada en la configuración del perfil

**Justificación**: El usuario pidió el cambio solo para el perfil de clientes. Añadir un bloque opcional `entityDate` a `module-config.js` mantiene el comportamiento base intacto, evita comparar cadenas de etiquetas como "Cliente" y conserva el principio de adaptación por configuración (XR-002, FR-029). El perfil CRM declara `label: "Fecha de nacimiento"`, `min: "1910-01-01"` y `max: "localToday"`; la clave de almacenamiento sigue siendo `targetDate`, sin migración de datos.

**Alternativas consideradas**: Condicionar por `labels.entity === "Cliente"` (frágil ante renombrados); modificar directamente todos los componentes sin configuración (rompe la extensibilidad); crear un campo de almacenamiento nuevo `birthDate` (migración innecesaria y contradice XR-001).

### Decisión: "Fecha actual" = fecha local del dispositivo calculada con getters locales

**Justificación**: El usuario eligió hora local y la aplicación ya persiste datos en el navegador. `localTodayISO()` usa `getFullYear()`, `getMonth()` y `getDate()` con relleno de ceros; no usa `toISOString()` porque ese método aplica UTC y podría desplazar el día en zonas horarias negativas o positivas.

**Alternativas consideradas**: `new Date().toISOString().slice(0, 10)` (incorrecto cerca de medianoche); zona horaria fija global (no coincide con la decisión del usuario).

### Decisión: Actualización al cambiar de día mediante temporizador hasta la medianoche local

**Justificación**: El usuario exige que el límite se refresque sin recargar. Se programa un `setTimeout` hasta el siguiente inicio de día local y se reprograma después de cada disparo; así se evita sondear cada segundo y se recalcula correctamente tras cambios de horario de verano. El manejador actualiza `min`/`max` y el texto de ayuda del formulario abierto sin volver a renderizarlo, preservando los cambios sin guardar.

**Alternativas consideradas**: `setInterval` cada minuto (desperdicio y retraso); recalcular solo al guardar (no cumple la actualización visible); forzar re-render completo (pierde el borrador del formulario).

### Decisión: Sin fecha de librería; validación de calendario y rango sobre cadenas ISO

**Justificación**: `isValidDate()` ya valida días y meses reales (incluidos años bisiestos) con `Date` nativo. Las fechas ISO `YYYY-MM-DD` válidas se comparan lexicográficamente, por lo que basta con `min <= value <= max`. No se añade dependencia.

**Alternativas consideradas**: dayjs/date-fns (dependencia innecesaria para dos operaciones); `Date.parse()` sin comprobación de año/mes/día (acepta fechas inexistentes).

### Decisión: Valores históricos fuera de rango se conservan y se corrigen al editar

**Justificación**: El usuario eligió no borrarlos. No habrá migración ni limpieza en `loadEntities()`. La validación se aplica al objeto fusionado en `updateEntity()`, de modo que cualquier intento de guardar una edición del cliente exige primero corregir la fecha; la lista y la ficha siguen mostrando el valor almacenado.

**Alternativas consideradas**: Migración que vacía fechas (pérdida de datos); válido solo si el usuario toca el campo (deja datos inválidos ocultos tras editar otros campos).

### Decisión: Datos de ejemplo con fechas de nacimiento pasadas

**Justificación**: El generador actual produce `targetDate` en el futuro (3 a 60 días), incompatible con el nuevo perfil CRM. Se generarán fechas deterministas dentro del rango permitido para que las pruebas manuales no empiecen con registros inválidos.

**Alternativas consideradas**: Mantener fechas futuras y dejar que la validación falle (mala experiencia inicial); eliminar `targetDate` del seed (pierde cobertura visual).
