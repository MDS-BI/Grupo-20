Feedback Avance 01 (26/10/26)

- no hay cambios en data-model ni en el plan.

Proximos pasos:
 
- rectificar puntos anteriores 
- trabajar en los specs (historias de usuario, US) para definir tareas
- dividirse las US y tareas para una siguiente iteracion (avances cada semana)
- ejecutar una version integrada de prueba

Feedback Avance 02 (2/11/26)

- Se insiste en el manejo de los specs (revisar video). Hay archivos de spec en la raiz del repositorio
- Se observan historias de usuario por miembro del grupo (solo actividad parcial)
- Evitar trabajar con modelos de IA fuera de speckit en local, porque crean ramas nuevas y se pierde la integridad del proyecto

Proximos pasos

- rectificar puntos anteriores y crear tareas a partir de los specs
- hacer primera implmentacion, registar modificaciones/incremental y volver al spec
- dividir el grupo entre modificaciones (ajustes previos) e incremental (nueva funcionalidad)
- integrar nueva version en 2 semanas

Feedback Avance 03 (16/11/26)

- Cambios en la especificación:
  - spec.md incorpora las sesiones 2026-11-12 y 2026-11-16 y reescribe las US 1, 2, 3 y 6 con enfoque CRM. Las US siguen mezclando "Entidad/Documento" (US 4, 9-15) con "Cliente/Interacción" (US 1-3, 6), y la prioridad de la US 6 pasó a "P6" (formato inconsistente).
  - tasks.md se regeneró con speckit: T001-T106 marcadas como hechas y nueva Fase 18 (T107-T111) sin marcar. Pero tasks.md tiene la codificación rota (caracteres "Ã³") y Fase 6 usa US2 con texto ERP, mientras que la spec ya habla de clientes. La US 6 aparece como P1 en tasks.md y P6 en spec.md.

- Consistencia sitio–especificación:
  - T093/FR-044: `computeSummary` en `src/storage.js` busca siempre "pendiente"; no usa estados marcados como pendientes (eso es T109, aún sin marcar, correcto). `statusLifecycle` de `src/module-config.js` no tiene marca de pendientes.
  - `src/app.js`: textos fijos "Editar", "Eliminar", "Guardar", contra T040/T041 (etiquetas desde configuración).
 
- hacer mejoras de funcionalidad e interfaz de usuario, incluir data simulada para probar campos, incluir mejoras de estilo, transicion, navegacion, etcetera.

Presentacion de MVP final en 2 semanas.
