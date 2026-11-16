# Plan de Implementación: Módulo Base de Gestión de Relaciones con Clientes (CRM)

**Rama**: `001-erp-base-module` | **Fecha**: 2026-07-08 | **Especificación**: [spec.md](spec.md)
**Entrada**: Especificación de la funcionalidad desde `/specs/001-erp-base-module/spec.md`

## Resumen

Construir una aplicación web ligera con Vite que sirva como módulo base de CRM. El módulo proporciona la base común que todo módulo CRM personalizado necesita: gestión de datos maestros (**Clientes**), oportunidades comerciales vinculadas (**Oportunidades**), flujos de crear/editar/eliminar/buscar, validación y persistencia local — construida principalmente con HTML, CSS y JavaScript vanilla. La aplicación se presenta como un espacio de trabajo CRM coherente: una barra superior con marca (logotipo derivado + nombre del módulo) y una barra lateral persistente de botones de módulo envuelven cada pantalla, y la pantalla de entrada es un panel que ofrece botones de acción rápida para las tareas clave (nuevo cliente, nueva oportunidad, abrir áreas de gestión, buscar registros) además de estadísticas en vivo. La adaptación a un módulo CRM específico se realiza mediante un único archivo de configuración (`src/module-config.js`) que cubre terminología, campos personalizados (p. ej. industria, canal de origen, ejecutivo asignado), ciclo de vida de embudo comercial y color de acento, de modo que el código central permanece intacto.

## Contexto Técnico

**Lenguaje/Versión**: JavaScript (ES2022), HTML, CSS  
**Dependencias Principales**: Vite, sin framework de interfaz pesado  
**Almacenamiento**: localStorage del navegador para un espacio de trabajo único  
**Pruebas**: Vitest con jsdom para pruebas unitarias y de interacción  
**Plataforma Objetivo**: Navegadores modernos de escritorio y móviles  
**Tipo de Proyecto**: Aplicación web  
**Objetivos de Rendimiento**: Interacciones responsivas para listas de hasta 500 registros; la búsqueda y las actualizaciones de la interfaz deben sentirse instantáneas  
**Restricciones**: Huella mínima de librerías, despliegue simple, sin backend requerido; la estructura debe mantenerse extensible para módulos personalizados  
**Escala/Alcance**: Módulo base con CRUD de clientes y oportunidades, búsqueda y navegación

### Aclaraciones integradas (sesión 2026-11-01)

- El `code` de cliente es obligatorio y único, comparado sin distinguir mayúsculas ni espacios.
- Sin ciclo de vida configurado, el estado de la oportunidad es texto libre (sin lista fija de valores).
- Una configuración inválida o conflictiva hace que la aplicación arranque con los valores predeterminados y muestre una advertencia visible, sin bloquear el uso.
- Los valores de campos personalizados que ya no están declarados se conservan en el almacenamiento y se ocultan de la interfaz; si el campo se vuelve a declarar, los valores reaparecen.
- La eliminación de un cliente exige confirmación explícita e indica cuántas oportunidades asociadas se eliminarán en cascada.

## Verificación de la Constitución

*COMPROBACIÓN: Debe pasar antes de la investigación de la Fase 0. Reverificar tras el diseño de la Fase 1.*

- Calidad: La implementación usa una estructura JavaScript modular con límites claros, manteniendo las preocupaciones base (almacenamiento, identidad, integridad referencial) separadas de la lógica específica del dominio.
- Pruebas: Los flujos centrales de crear, editar, eliminar y buscar están cubiertos por pruebas automatizadas.
- Experiencia de Usuario: La interfaz proporciona mensajes de validación claros, estados vacíos y comportamiento consistente, dentro de un marco de espacio de trabajo CRM con marca (barra superior + barra lateral).
- Rendimiento: La búsqueda y el renderizado de listas se optimizan para colecciones de hasta 500 registros.

**Reverificación post-diseño (Fase 1)**: APROBADA. Los artefactos de diseño mantienen la separación entre almacenamiento base y dominio, validan la unicidad de `code`, preservan los valores huérfanos de campos personalizados, documentan el fallback con advertencia ante configuración inválida y exigen confirmación con recuento antes de la eliminación en cascada.

## Estructura del Proyecto

### Documentación (esta funcionalidad)

```text
specs/001-erp-base-module/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Código Fuente (raíz del repositorio)

```text
src/
├── main.js
├── styles.css
├── storage.js
├── app.js
├── module-config.js
└── components/
    ├── shell.js        (marco del espacio de trabajo: barra superior, logotipo SVG, barra lateral, estado de módulo activo)
    ├── dashboard.js    (vista de inicio: acciones rápidas + tarjetas de estadísticas en vivo)
    ├── entity-form.js  (formulario de creación/edición de clientes con campos personalizados)
    └── document-form.js (formulario de creación/edición de oportunidades con campos personalizados y ciclo de vida de estados)

tests/
├── unit/
├── integration/
└── setup/
```

**Decisión de Estructura**: Aplicación Vite simple con un único punto de entrada HTML, módulos JavaScript pequeños y CSS separado. Se usa localStorage para la persistencia. Los componentes se organizan en pares cliente (datos maestros) y oportunidad (comercial) que reflejan los conceptos centrales del módulo CRM, de modo que un módulo personalizado pueda renombrar o extender cada par. `shell.js` posee el marco del espacio de trabajo CRM; `dashboard.js` renderiza las acciones rápidas y estadísticas; `module-config.js` centraliza todos los puntos de adaptación —nombre, etiquetas, campos personalizados (industria, canal de origen, ejecutivo asignado), ciclo de vida de embudo comercial y color de acento— manteniendo la personalización fuera del código central.

## Seguimiento de Complejidad

Este plan no introdujo violaciones de la constitución.
