# Modelo de Datos - Módulo CRM

## Entidades y Relaciones

Las siguientes tablas en markdown definen las entidades principales del módulo CRM, sus atributos, tipos de datos, claves primarias, claves foráneas y restricciones. Las relaciones garantizan la integridad referencial en todo el ERP.

### 1. `customers`
| Nombre de columna | Tipo de datos | Restricciones | Descripción |
|-------------------|--------------|---------------|-------------|
| `customer_id` | INT | **PK**, **NOT NULL**, **AUTO_INCREMENT** | Identificador único para cada cliente. |
| `company_name` | VARCHAR(255) | NOT NULL | Nombre legal o comercial del cliente. |
| `legal_name` | VARCHAR(255) | | Nombre legal completo (si es diferente al company_name). |
| `email` | VARCHAR(191) | **UNIQUE**, NOT NULL | Correo electrónico de contacto (usado para inicio de sesión/identificación). |
| `phone` | VARCHAR(50) | | Número de teléfono de contacto principal. |
| `address` | TEXT | | Dirección física. |
| `city` | VARCHAR(100) | | Ciudad. |
| `state` | VARCHAR(100) | | Estado o provincia. |
| `country` | VARCHAR(100) | | País. |
| `postal_code` | VARCHAR(20) | | Código postal. |
| `created_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Marca de tiempo de creación del registro. |
| `updated_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Marca de tiempo de la última actualización. |

### 2. `customer_interactions`
| Nombre de columna | Tipo de datos | Restricciones | Descripción |
|-------------------|--------------|---------------|-------------|
| `interaction_id` | INT | **PK**, **NOT NULL**, **AUTO_INCREMENT** | Identificador único para cada interacción. |
| `customer_id` | INT | **FK** → `customers.customer_id`, NOT NULL | Vinculación con el cliente involucrado. |
| `interaction_type` | VARCHAR(50) | NOT NULL | Tipo de interacción (por ejemplo, llamada, correo, reunión, visita). |
| `interaction_date` | DATE | NOT NULL | Fecha en que ocurrió la interacción. |
| `description` | TEXT | | Descripción detallada de la interacción. |
| `next_action` | TEXT | | Acción de seguimiento planificada. |
| `created_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Marca de tiempo de creación del registro. |

### 3. `support_tickets`
| Nombre de columna | Tipo de datos | Restricciones | Descripción |
|-------------------|--------------|---------------|-------------|
| `ticket_id` | INT | **PK**, **NOT NULL**, **AUTO_INCREMENT** | Identificador único para cada ticket de soporte. |
| `customer_id` | INT | **FK** → `customers.customer_id`, NOT NULL | Cliente que abrió el ticket. |
| `title` | VARCHAR(255) | NOT NULL | Descripción corta del problema. |
| `description` | TEXT | | Descripción detallada del problema. |
| `status` | ENUM('open','in_progress','on_hold','resolved','closed') | NOT NULL | Estado actual del ciclo de vida. |
| `priority` | ENUM('low','medium','high','critical') | NOT NULL | Nivel de severidad. |
| `assigned_to` | INT | FK → `users.user_id`, NULLABLE | Empleado responsable de manejar el ticket. |
| `created_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Marca de tiempo de creación del ticket. |
| `resolved_at` | DATETIME | NULLABLE | Marca de tiempo en que se resolvió el ticket. |

### 4. `sales_opportunities`
| Nombre de columna | Tipo de datos | Restricciones | Descripción |
|-------------------|--------------|---------------|-------------|
| `opportunity_id` | INT | **PK**, **NOT NULL**, **AUTO_INCREMENT** | Identificador único para cada oportunidad de venta. |
| `customer_id` | INT | **FK** → `customers.customer_id`, NOT NULL | Cliente asociado a la oportunidad. |
| `name` | VARCHAR(255) | NOT NULL | Nombre/título de la oportunidad. |
| `description` | TEXT | | Descripción detallada de la venta potencial. |
| `stage` | ENUM('prospecting','qualification','proposal','negotiation','won','lost') | NOT NULL | Etapa actual del embudo de ventas. |
| `estimated_value` | DECIMAL(15,2) | NOT NULL | Valor esperado de ingresos si se gana. |
| `probability` | SMALLINT | NOT NULL, DEFAULT 0 | Probcentaje de probabilidad de cerrar (0‑100). |
| `expected_close_date` | DATE | NULLABLE | Fecha estimada de cierre. |
| `created_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Marca de tiempo de creación del registro. |
| `updated_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Marca de tiempo de la última actualización. |

### 5. `users` (referencia cruzada ERP)
| Nombre de columna | Tipo de datos | Restricciones | Descripción |
|-------------------|--------------|---------------|-------------|
| `user_id` | INT | **PK**, **NOT NULL**, **AUTO_INCREMENT** | Identificador único para usuarios del ERP (ventas, soporte, etc.). |
| `username` | VARCHAR(100) | **UNIQUE**, NOT NULL | Nombre de usuario para login. |
| `email` | VARCHAR(191) | **UNIQUE**, NOT NULL | Dirección de correo electrónico. |
| `full_name` | VARCHAR(255) | NOT NULL | Nombre para mostrar. |
| `role` | ENUM('sales','support','admin') | NOT NULL | Rol del usuario dentro del CRM. |
| `created_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Marca de tiempo de creación de la cuenta. |

**Notas de Integridad Referencial**
- Todas las claves foráneas (`customer_id`, `assigned_to`) tienen `ON DELETE RESTRICT` y `ON UPDATE CASCADE` para preservar la consistencia de datos.
- Se sugieren índices en `email` y `username` para búsquedas rápidas.
- Los campos temporales (`created_at`, `updated_at`) estandarizados en todas las tablas para auditoría.