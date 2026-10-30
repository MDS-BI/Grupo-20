# Plan - Módulo CRM (MVP)

## 1. Usuarios objetivo
- **Ejecutivos de ventas**: responsables de la gestión de leads, seguimiento de oportunidades y reportes de pipeline.
- **Técnicos de soporte**: gestionan tickets de soporte, acompanan los tiempos de resolución y escalan problemas.
- **Administradores de CRM**: configuran usuarios, roles, pipelines y garantizan la integridad de datos.
- **Operaciones/Finanzas**: visualizan oportunidades ganadas y pronósticos de ingresos relacionados.

## 2. Funcionalidades principales
| Característica | Descripción | Ruta UI / Menú |
|----------------|-------------|----------------|
| **Gestión de clientes** | Crear, leer, actualizar y buscar clientes; ver historial de interacciones. | `CRM → Clientes` |
| **Registro de interacciones** | Anotar cada llamada, correo o reunión vinculada a un cliente. | `CRM → Interacciones → Nuevo` |
| **Gestión de tickets de soporte** | Abrir, asignar, priorizar y resolver tickets; seguir SLA. | `CRM → Soporte → Tickets` |
| **Pipeline de oportunidades** | Mover oportunidades a través de etapas (prospecto → ganado/pérdida); prever ingresos. | `CRM → Oportunidades` |
| **Administración de usuarios y roles** | Asignar roles (ventas/soporte/admin), gestionar permisos. | `Configuración → Usuarios` |
| **Panel de reportes** | Widgets visuales: embudo de pipeline, envejecimiento de tickets, actividad de clientes. | `CRM → Panel` |
| **Puntos de integración** | Endpoints API para sincronización en todo el ERP (por ejemplo, facturación, inventario). | `Integraciones` |

## 3. Fases de implementación
| Fase | Objetivo | Entregables clave | Duración aproximada |
|------|----------|-------------------|---------------------|
| **P1 – Fundamentos** | Configurar esquema de base de datos, CRUD básico para clientes, interacciones, tickets, oportunidades. | Modelo ER (data-model.md), API esqueleto, autenticación. | 4 semanas |
| **P2 – UX principal** | Construir consola de administrador, interfaces de ventas y soporte; implementar etapas de pipeline y ciclo de vida de tickets. | Mockups UI, acceso basado en roles, menú de navegación. | 5 semanas |
| **P3 – Reportes** | Desarrollar widgets de panel: embudo de pipeline, envejecimiento de tickets, métricas de actividad. | Reportes exportables, correos programados. | 3 semanas |
| **P4 – Integración** | Exponer endpoints REST para módulos ERP (sincronización de datos ERP↔CRM, facturación). | Documentación Swagger, manejadores de webhook. | 4 semanas |
| **P5 – Riesgo y cumplimiento** | Revisiones de privacidad de datos, registros de auditoría, marcas de consentimiento GDPR. | Actualización de política de privacidad, senda de auditoría. | 2 semanas |

## 4. Gestión de riesgos
### 4.1 Sesgos de datos
- **Sesgo de muestreo**: los logs de interacción pueden sobrerrepresentar a clientes de alto valor. Mitigar registrando automáticamente todos los puntos de contacto mediante eventos del sistema, no solo entrada manual.
- **Sesgo de finalización**: las oportunidades pueden estancarse en etapas tempranas. Implementar reglas obligatorias de progreso de etapa y alertas cuando las oportunidades permanezcan >90 días en una sola etapa.
- **Predicción de abandono**: los modelos predictivos con IA corren riesgo de falsos positivos. Mantener los modelos transparentes; requerir aprobación manual antes de marcar a un cliente como "en riesgo".

### 4.2 Manejo ético y seguro de datos
- **Clasificación de PII**: todos los identificadores personales (email, teléfono, dirección) se almacenan encriptados en reposo; acceso restringido por rol.
- **Gestión de consentimiento**: añadir un campo `consent_status` en `customers` (ENUM: `opted_in`, `opted_out`, `pending`). Obligar a `NOT NULL` con valor por defecto `pending` y bloquear exportaciones relacionadas con marketing para registros sin consentimiento.
- **Registro de auditoría**: cada operación CRUD en `customers`, `tickets` y `opportunities` escribe en una tabla immutables `crm_audit_log` (marca de tiempo, user_id, acción, hash de payload).
- **Retención de datos**: definir política — anonimizar o eliminar datos de clientes después de 7 años de inactividad, respetando regulaciones locales.
- **Respuesta a brechas**: flujo de trabajo predefinido: detectar → aislar → notificar DPO → remediar; documentado en run-books.

### 4.3 Cuadrícula de mitigación
- [ ] Ejecutar scripts de perfilado de datos trimestrales para detectar sesgos.
- [ ] Realizar revisiones de acceso por roles cada semestre.
- [ ] Mantener un programadocumentado de retención de datos.
- [ ] Brindar capacitación de privacidad a todos los usuarios del CRM.