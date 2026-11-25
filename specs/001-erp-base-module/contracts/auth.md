# Contrato de Autenticación, Sesión y Permisos

## Propósito

Definir la forma de los datos y las operaciones de la autenticación local en modo demostración, la sesión persistente y la matriz única de permisos (FR-094 a FR-102, US22, US23). La fuente funcional es [`../spec.md`](../spec.md); el modelo resumido está en [`../data-model.md`](../data-model.md#8-autenticación-sesión-y-permisos). No se introduce backend ni dependencia nueva; no se verifica contraseña ni se bloquea por intentos fallidos.

## Almacenamiento

### Clave `erp_users`

Arreglo de usuarios. Cada usuario incluye:

- `id`: cadena única autogenerada.
- `username`: cadena visible de inicio de sesión.
- `usernameKey`: `username` recortado y en minúsculas; único entre todos los usuarios.
- `rank`: uno de `n4_manager`, `n3_marketing`, `n2_sales`, `n1_support`.
- `active`: booleano; `false` revoca la sesión y bloquea el login.
- `createdAt` / `updatedAt`: marcas ISO.

No se persisten contraseñas, hashes, sales ni contadores de intentos. Los usuarios semilla se inicializan solo si la clave no existe: `gerente` (`n4_manager`, Gerente Comercial), `marketing` (`n3_marketing`, Ejecutivo de Marketing), `ventas` (`n2_sales`, Ejecutivo de Ventas) y `atencion` (`n1_support`, Atencion al Cliente).

### Clave `erp_session`

Objeto único con `userId`, `issuedAt`, `lastActivityAt` y `expiresAt`. No contiene `rank`, `username` ni copia del estado activo: esos valores se resuelven desde `erp_users` en cada verificación para aplicar de inmediato cambios de rango y desactivaciones.

## Operaciones de `src/auth.js`

- `normalizeUsername(value)`: recorta y convierte a minúsculas para comparar nombres de usuario.
- `login(username, password)`: normaliza el usuario; exige contraseña no vacía; solo acepta los cuatro usuarios demostrativos activos; crea `erp_session` y devuelve el usuario resuelto. Lanza `Ingresa una contraseña` si el campo está vacío y `Usuario no encontrado` si el usuario no es uno de los cuatro o está inactivo. No verifica hashes, no hay contraseñas incorrectas y no cuenta intentos fallidos.
- `logout()`: elimina `erp_session`.
- `getCurrentSession()`: devuelve la sesión vigente o `null` si falta, expiró o su usuario ya no existe o está inactivo.
- `getCurrentUser()`: devuelve el usuario resuelto de la sesión vigente, incluido su `rank` actual.
- `touchSession()`: actualiza `lastActivityAt` y `expiresAt` mientras la sesión siga vigente.
- `createUser(values)`: exige `username` único normalizado, contraseña no vacía y `rank` válido; la contraseña no se persiste ni se verifica; solo se invoca desde la vista de administración autorizada.
- `updateUser(id, updates)`: permite editar `username`, `rank` y `active`; mantiene `usernameKey` sincronizado y rechaza duplicados.
- `deactivateUser(id)`: fija `active = false` y elimina la sesión de ese usuario.

## Matriz de `src/auth/permissions.js`

- `ROLES`: enumeración `n4_manager`, `n3_marketing`, `n2_sales`, `n1_support` y `visitor`.
- `PERMISSION_MATRIX`: tabla rango → conjunto de acciones permitidas; las acciones ausentes devuelven `false`.
- `can(role, action, context)`: función pura que aplica la matriz y las reglas de contexto (`ownerId`, `campaignOwnerId`, `active`, etc.).
- `assertPermission(role, action, context)`: lanza o devuelve un error con el mensaje exacto `No tienes permiso para realizar esta acción` cuando `can()` es falso.

### Catálogo canónico de acciones

Este contrato replica el «Catálogo canónico de acciones» de `spec.md` sin introducir identificadores adicionales: `panel:view`, `search:view`, `entity:view_any`, `entity:view_own`, `entity:create`, `entity:edit_any`, `entity:edit_own`, `entity:delete`, `document:create`, `document:read`, `document:edit_any`, `document:edit_own`, `document:transition_own`, `document:delete`, `summary:view_all`, `summary:view_own`, `marketing:view`, `marketing:manage`, `team:view_all`, `team:view_own`, `team:manage`, `chat:view`, `chat:answer`, `chat:create_query`, `campaign:create`, `campaign:view`, `campaign:edit_own`, `campaign:stop_own`, `campaign:stop_any`, `users:manage`, `permissions:view` y `permissions:edit`.

| Acción                                                                       | N4  | N3  | N2                 | N1  | Visitante                               |
| ---------------------------------------------------------------------------- | --- | --- | ------------------ | --- | --------------------------------------- |
| `panel:view`, `search:view`, `entity:view_any`, `document:read`              | Sí  | Sí  | Sí                 | Sí  | No                                      |
| `entity:create`                                                              | Sí  | No  | Sí                 | No  | No                                      |
| `entity:edit_own`, `document:edit_own`, `document:transition_own`            | Sí  | No  | Solo con `ownerId` | No  | No                                      |
| `entity:edit_any`, `entity:delete`, `document:edit_any`, `document:delete`   | Sí  | No  | No                 | No  | No                                      |
| `document:create`                                                            | Sí  | Sí  | Sí                 | Sí  | No                                      |
| `summary:view_all`                                                           | Sí  | No  | No                 | No  | No                                      |
| `summary:view_own`                                                           | Sí  | No  | Solo con `ownerId` | No  | No                                      |
| `marketing:view`, `marketing:manage`                                         | Sí  | Sí  | No                 | No  | No                                      |
| `team:view_all`, `team:manage`                                               | Sí  | No  | No                 | No  | No                                      |
| `team:view_own`                                                              | Sí  | Sí  | Solo con `ownerId` | No  | No                                      |
| `chat:view`, `chat:answer`                                                   | Sí  | Sí  | No                 | Sí  | No                                      |
| `chat:create_query`                                                          | Sí  | Sí  | Sí                 | Sí  | Solo en ruta pública con consentimiento |
| `campaign:create`, `campaign:view`, `campaign:edit_own`, `campaign:stop_own` | Sí  | Sí  | No                 | No  | No                                      |
| `campaign:stop_any`                                                          | Sí  | No  | No                 | No  | No                                      |
| `users:manage`, `permissions:view`                                           | Sí  | No  | No                 | No  | No                                      |
| `permissions:edit`                                                           | No  | No  | No                 | No  | No                                      |

`ownerId` identifica al usuario asignado, al creador de la campaña o al integrante vinculado según la acción; `campaignOwnerId` identifica al creador de la campaña. Las acciones con sufijo `_own` fallan si falta el contexto o si el usuario autenticado no coincide. Toda acción no listada se deniega por defecto. La captura pública de FR-069 y los mensajes del chat de FR-084 son rutas públicas con consentimiento, no acciones de la matriz interactiva.

`Sistema` no aparece en `ROLES`: es la identidad de auditoría de las automatizaciones y no inicia sesión. Las campañas creadas por usuarios conservan al creador real en `createdByUserId`.

## Contrato de Interfaz

### `src/components/login.js`

- Muestra solo los campos «Usuario» y «Contraseña» y el botón de ingreso, sin barra superior ni lateral.
- Mantiene accesibles las rutas públicas de formulario de captura y chat.
- Con la contraseña vacía muestra exactamente `Ingresa una contraseña`; con un usuario distinto de los cuatro demostrativos muestra exactamente `Usuario no encontrado`.
- Cualquier contraseña no vacía es válida para `gerente`, `marketing`, `ventas` y `atencion`, sin distinción de mayúsculas ni espacios en el usuario.
- Tras autenticarse, redirige a la vista internamente solicitada; si no hay una vista pendiente, abre el Panel.
- Nunca muestra el menú del usuario ni acciones de administración.

### `src/components/users-admin.js`

- Solo se monta desde el menú del usuario de la barra superior y solo cuando `can(rank, 'users:manage')` es verdadero.
- No aparece en `NAV_ITEMS` ni en la barra lateral.
- Lista usuarios con `username`, `rank` y estado activo/inactivo.
- Permite crear, editar, desactivar y asignar rango; el `select` de rango ofrece solo los cuatro rangos de la matriz.
- Rechaza nombres de usuario duplicados según `normalizeUsername()` y no ofrece edición de la matriz.

## Expectativas de Validación

- Sin sesión, abrir una vista interna redirige a login; el formulario público y el chat siguen disponibles.
- Un usuario autenticado sin permiso para una vista ve «Acceso denegado» y vuelve al Panel sin ejecutar la acción.
- Una operación denegada responde con `No tienes permiso para realizar esta acción`, incluso cuando se invoca directamente desde `src/storage.js` o desde un enlace profundo.
- Ocultar un botón nunca es la única barrera: la capa de datos valida con `assertPermission()`.
- No existe bloqueo por intentos fallidos: la contraseña vacía y el usuario inexistente solo muestran su mensaje exacto y no crean sesión.
- La sesión expira tras 8 horas de inactividad; «Cerrar sesión», la desactivación y la expiración eliminan `erp_session`.
- La sesión persiste al recargar y al reabrir el navegador mientras no haya logout, desactivación ni expiración.
- Un cambio de rango se refleja en la siguiente acción o recarga; la desactivación se refleja de inmediato.
- `ejecutivo_asignado` y `Integrante.userId` aceptan solo usuarios activos de rango Nivel 2 o Nivel 4.
- No se guardan contraseñas, hashes ni sales; el campo solo comprueba que no esté vacío.

## Integración

- `app.js`: decide entre vista de login, rutas públicas y marco ERP; pasa el usuario resuelto a los componentes.
- `shell.js`: filtra `NAV_ITEMS` y acciones rápidas con la matriz; muestra el menú del usuario con «Cerrar sesión» y, solo para N4, «Gestionar usuarios».
- `dashboard.js`: filtra sus acciones rápidas según la matriz.
- `storage.js`: valida permisos antes de crear, editar, eliminar o cambiar estados, incluidas las escrituras directas de listas.
- `module-config.js` / formularios: el campo `ejecutivo_asignado` se puebla con usuarios activos válidos en lugar de texto libre.

## Rutas relativas y resolución de vista

La aplicación usa un único documento HTML sin host ni ruta de servidor. La vista se resuelve desde `location.search` en carga inicial, recarga y Back/Forward: sin parámetro `view` es Panel; `?view=summary`, `?view=capture`, `?view=marketing`, `?view=manage-entity`, `?view=manage-document` y `?view=users-admin` son las seis rutas relativas soportadas. No existe `?view=panel`; el Panel se abre quitando el parámetro. Cada resolución aplica la matriz: sin sesión, una ruta interna conserva la ruta solicitada y redirige a login; con sesión sin permiso muestra «Acceso denegado» y vuelve al Panel; `?view=capture` permanece pública.

## Mensajes exactos

Los textos de retroalimentación son los de FR-006. En autenticación y permisos se usan exactamente `No tienes permiso para realizar esta acción`, `Acceso denegado`, `Ingresa una contraseña` y `Usuario no encontrado`; en validación de campos se usa `Completa los campos obligatorios.`. Cualquier variante de estos textos incumple el contrato.

## Extensibilidad y límite

- Agregar un rango requiere añadir una fila en `PERMISSION_MATRIX`; desde la interfaz no puede modificarse.
- Un módulo personalizado puede reutilizar `can()` con nuevas acciones sin cambiar el núcleo de autenticación.
- La autenticación es local y simulada en modo demostración: cualquier contraseña no vacía sirve para los cuatro usuarios, no hay hash ni bloqueo, y la expiración de la sesión sigue siendo demostrativa.
 Una implementación productiva requiere autenticación en servidor, tal como declara la especificación.
