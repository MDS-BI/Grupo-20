# Investigación: Módulo Base de Gestión de Relaciones con Clientes (CRM)

## Decisión: Usar Vite con HTML, CSS y JavaScript vanilla

**Justificación**: Enfoque de mínimas librerías y una implementación ligera. Vite proporciona una experiencia de desarrollo rápida y un pipeline de construcción simple sin requerir un framework pesado. JavaScript vanilla mantiene la aplicación fácil de entender, probar y extender para módulos personalizados.

## Alternativas consideradas

- React o Vue: Ecosistema de componentes más sólido, pero añade abstracción y dependencias innecesarias para este alcance.
- HTML estático plano sin Vite: Más simple, pero Vite ofrece mejor flujo de trabajo local y paso de construcción.
- Persistencia en backend con base de datos: No es necesaria para un módulo de espacio único; el contrato de almacenamiento está aislado para permitir un backend futuro.

## Decisiones adicionales

- Se usa localStorage del navegador para la persistencia porque el módulo es de espacio único.
- La interfaz es una experiencia de página única con panel, búsqueda y gestión de clientes/oportunidades.
- La aplicación favorece controles de formulario nativos accesibles sobre widgets personalizados complejos.
- El modelo de datos separa los datos maestros (Cliente) de los registros comerciales (Oportunidad), vinculados por un identificador público autogenerado (`entity_id`).
- Las preocupaciones base (generación de identidad, marcas de tiempo, integridad referencial, eliminación en cascada) residen en la capa de almacenamiento.

## Decisiones de aclaración (sesión 2026-11-01)

### Decisión: El código de cliente es único

**Justificación**: El código es la clave de negocio; permitir duplicados haría ambiguas las referencias. Se compara recortado y sin distinguir mayúsculas para evitar duplicados accidentales.

**Alternativas consideradas**: Permitir duplicados con advertencia (no garantiza integridad); permitir duplicados sin aviso (rechazado).

### Decisión: Estado de oportunidad como texto libre sin ciclo de vida configurado

**Justificación**: Mantener el texto libre preserva la extensibilidad del módulo base; el ciclo de vida de embudo se activa solo mediante configuración.

**Alternativas consideradas**: Lista fija de estados (limita módulos personalizados); desplegable editable (complejidad sin beneficio para la base).

### Decisión: Configuración inválida → valores predeterminados con advertencia visible

**Justificación**: Evita una pantalla muerta, permite seguir operando con los datos e informa del problema con claridad.

**Alternativas consideradas**: Bloquear la aplicación con pantalla de error; registrar solo en consola (no visible al usuario).

### Decisión: Conservar y ocultar valores de campos personalizados no declarados

**Justificación**: Evita pérdida de datos al evolucionar la configuración y permite recuperar los valores si el campo se vuelve a declarar.

**Alternativas consideradas**: Eliminar los valores huérfanos (pérdida irreversible); mostrarlos en solo lectura.

### Decisión: Confirmación con recuento antes de eliminar un cliente

**Justificación**: La eliminación en cascada de oportunidades es irreversible; indicar cuántas se eliminarán hace explícito el impacto.

**Alternativas consideradas**: Confirmación simple sin recuento; eliminación inmediata.

## Decisiones de adaptación al dominio CRM

### Decisión: Mapear Entidades a Clientes y Documentos a Oportunidades

**Justificación**: En CRM, el cliente es el dato maestro central y la oportunidad representa el avance comercial asociado. El modelo base (entidad/documento con `entity_id`, integridad referencial y cascada) se adapta directamente sin cambios estructurales.

### Decisión: Campos personalizados de cliente (industria, canal de origen, ejecutivo asignado)

**Justificación**: Son atributos comunes para segmentación, atribución de origen y asignación comercial en procesos de ventas, y se modelan como `customFields` de tipo `entity` para no modificar el esquema base.

### Decisión: Ciclo de vida de embudo comercial para oportunidades

**Justificación**: Las oportunidades siguen un flujo de ventas controlado. Se define como `statusLifecycle`: Prospecto → Contactado → Propuesta Enviada → Negociación → Cerrada Ganada / Cerrada Perdida, con transiciones explícitas que impiden saltos o retrocesos inválidos cuando el ciclo está configurado.
