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
