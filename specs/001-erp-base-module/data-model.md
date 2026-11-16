# Modelo de Datos: Módulo Base de Gestión de Relaciones con Clientes (CRM)

## Entidad: Cliente (registro de datos maestros)

Representa el dato maestro central del módulo CRM con su identidad, contacto e información comercial básica.

| Campo | Tipo | Descripción | Restricciones |
|---|---|---|---|
| id | string | Identificador interno único del registro | Obligatorio, generado automáticamente |
| entity_id | string | Identificador público usado para vincular oportunidades a este cliente | Obligatorio, generado automáticamente, único |
| name | string | Nombre o razón social del cliente | Obligatorio, no vacío |
| code | string | Código o clave de negocio que identifica al cliente | Obligatorio, no vacío, único (comparación sin distinguir mayúsculas ni espacios) |
| taxId | string | Identificación fiscal del cliente | Opcional; se almacena recortada |
| email | string | Correo electrónico principal de contacto | Opcional; debe tener formato válido si se proporciona |
| phone | string | Teléfono de contacto | Opcional |
| address | string | Dirección fiscal o comercial | Opcional |
| category | string | Clasificación opcional (tipo, segmento, etc.) | Opcional |
| description | string | Descripción corta o notas | Opcional |
| targetDate | string | Fecha objetivo opcional en formato YYYY-MM-DD | Opcional, debe ser una fecha de calendario válida |
| creditLimit | number | Límite de crédito del cliente | Opcional, debe ser un número no negativo |
| paymentTerms | string | Condiciones de pago acordadas | Opcional |
| createdAt | string | Marca de tiempo de creación | Obligatorio |
| updatedAt | string | Marca de tiempo de última actualización | Obligatorio |

### Campos personalizados típicos de CRM (declarados en ModuleConfig)

| Clave | Etiqueta | Tipo | Descripción |
|---|---|---|---|
| industria | Industria | text | Sector o industria del cliente |
| canalOrigen | Canal de origen | select | Canal por el que llegó el cliente (p. ej. Web, Referido, Evento, Llamada) |
| ejecutivoAsignado | Ejecutivo asignado | text | Responsable comercial del cliente |

## Entidad: Oportunidad (registro comercial)

Representa una oportunidad comercial vinculada a un cliente, gestionada a través del embudo de ventas.

| Campo | Tipo | Descripción | Restricciones |
|---|---|---|---|
| id | string | Identificador único de la oportunidad | Obligatorio, generado automáticamente |
| entity_id | string | Identificador del cliente al que pertenece esta oportunidad | Obligatorio, debe referenciar el entity_id de un cliente existente |
| series | string | Serie del documento/oportunidad | Opcional |
| folio | number | Folio consecutivo de la oportunidad | Obligatorio, debe ser un entero positivo |
| startDate | string | Fecha de inicio en formato YYYY-MM-DD | Obligatorio, debe ser una fecha de calendario válida |
| endDate | string | Fecha de cierre estimada/real en formato YYYY-MM-DD | Obligatorio, debe ser una fecha válida, igual o posterior a startDate |
| quantity | number | Cantidad asociada | Opcional, debe ser un entero positivo |
| subtotal | number | Importe antes de descuentos e impuestos | Opcional, número no negativo |
| discount | number | Descuento aplicado | Opcional, número no negativo y no puede superar el subtotal |
| taxAmount | number | Impuesto calculado | Opcional, número no negativo |
| totalAmount | number | Importe total estimado/cerrado | Opcional, número no negativo |
| currency | string | Código de moneda (p. ej. MXN, USD, EUR) | Opcional |
| paymentTerms | string | Condiciones de pago | Opcional |
| notes | string | Notas u observaciones | Opcional |
| status | string | Estado de la oportunidad en el embudo comercial | Opcional (texto libre sin ciclo de vida configurado) |
| createdAt | string | Marca de tiempo de creación | Obligatorio |
| updatedAt | string | Marca de tiempo de última actualización | Obligatorio |

## Entidad: ModuleConfig

Objeto de configuración cargado al arrancar que adapta el módulo base en un módulo CRM específico.

| Campo | Tipo | Descripción | Restricciones |
|---|---|---|---|
| moduleName | string | Nombre visible del módulo adaptado | Obligatorio, no vacío |
| labels | object | Mapeos de términos, p. ej. `{ entity: "Cliente", entities: "Clientes", document: "Oportunidad", documents: "Oportunidades" }` | Opcional; retrocede a predeterminados |
| customFields | array | Definiciones de campos por tipo de registro: `{ target: "entity"\|"document", key, label, type: "text"\|"number"\|"date"\|"select", required: boolean, options?: string[] }` | Opcional; las claves NO DEBEN chocar con nombres de campos base |
| statusLifecycle | object | Estados y transiciones permitidas para oportunidades | Opcional |
| theme | object | Opciones de marca, p. ej. `{ accentColor: "#0f62fe" }` | Opcional; color CSS válido o retrocede al predeterminado |

### Ejemplo de configuración CRM

```js
export default {
  moduleName: 'CRM Comercial',
  labels: {
    entity: 'Cliente',
    entities: 'Clientes',
    document: 'Oportunidad',
    documents: 'Oportunidades'
  },
  customFields: [
    { target: 'entity', key: 'industria', label: 'Industria', type: 'text', required: false },
    { target: 'entity', key: 'canalOrigen', label: 'Canal de origen', type: 'select', required: false, options: ['Web', 'Referido', 'Evento', 'Llamada', 'Otro'] },
    { target: 'entity', key: 'ejecutivoAsignado', label: 'Ejecutivo asignado', type: 'text', required: false }
  ],
  statusLifecycle: {
    statuses: ['Prospecto', 'Contactado', 'Propuesta Enviada', 'Negociación', 'Cerrada Ganada', 'Cerrada Perdida'],
    transitions: {
      'Prospecto': ['Contactado', 'Cerrada Perdida'],
      'Contactado': ['Propuesta Enviada', 'Cerrada Perdida'],
      'Propuesta Enviada': ['Negociación', 'Cerrada Perdida'],
      'Negociación': ['Cerrada Ganada', 'Cerrada Perdida'],
      'Cerrada Ganada': [],
      'Cerrada Perdida': []
    }
  },
  theme: { accentColor: '#0f62fe' }
};
```

## Reglas de ModuleConfig

- La configuración se carga una vez al arrancar y se aplica en todas las pantallas.
- Cuando la configuración está ausente, se aplican los valores predeterminados integrados: etiquetas base, sin campos personalizados, estado de texto libre, color de acento predeterminado.
- Los valores inválidos o conflictivos deben informarse con claridad; la aplicación arranca con los valores predeterminados integrados y muestra una advertencia visible.
- Las claves de campos personalizados no deben chocar con los nombres de campos base (`id`, `entity_id`, `name`, `code`, `taxId`, `email`, `phone`, `address`, `category`, `description`, `targetDate`, `creditLimit`, `paymentTerms`, `series`, `folio`, `startDate`, `endDate`, `quantity`, `subtotal`, `discount`, `taxAmount`, `totalAmount`, `currency`, `notes`, `status`).
- Los valores de campos personalizados se persisten junto a los campos base sin cambios de esquema.
- Los valores de campos personalizados que ya no están declarados se conservan en el almacenamiento y se ocultan de la interfaz; si el campo se vuelve a declarar, los valores reaparecen.
- Un ciclo de vida configurado reemplaza la entrada de estado de texto libre; sin uno, el estado permanece como texto libre.

## Reglas de Validación

### Cliente

- Un cliente debe incluir un nombre no vacío.
- Un cliente debe incluir un código no vacío y único entre todos los clientes, comparado sin distinguir mayúsculas ni espacios.
- Identificación fiscal, teléfono, dirección, categoría, descripción y condiciones de pago son opcionales pero deben almacenarse como cadenas recortadas.
- El correo electrónico es opcional pero, cuando está presente, debe tener formato válido.
- El límite de crédito es opcional pero, cuando está presente, debe ser un número no negativo.
- La fecha objetivo es opcional pero, cuando está presente, debe ser una fecha de calendario válida en formato YYYY-MM-DD.
- Un entity_id debe generarse automáticamente y ser único entre todos los clientes.

### Oportunidad

- Una oportunidad debe referenciar un cliente existente mediante entity_id.
- Una oportunidad debe incluir un folio entero positivo; la serie es opcional.
- Una oportunidad debe incluir fechas de inicio y fin válidas; la fecha de fin debe ser igual o posterior a la fecha de inicio.
- La cantidad es opcional y debe ser un entero positivo.
- Subtotal, descuento, impuesto e importe total son opcionales y deben ser números no negativos; el descuento no puede superar el subtotal.
- Cuando hay ciclo de vida configurado, el estado debe ser uno de los estados declarados y las transiciones deben respetar las reglas definidas.

## Relaciones

- Cada cliente se almacena independientemente y se identifica por su entity_id.
- Cada oportunidad pertenece exactamente a un cliente, vinculada por el entity_id del cliente.
- Cuando se elimina un cliente, todas las oportunidades que referencian su entity_id también se eliminan.
- Las operaciones de búsqueda se realizan sobre los registros de clientes almacenados, incluyendo campos base y personalizados declarados.

## Notas de Extensibilidad

- Los módulos personalizados pueden añadir campos específicos del dominio a clientes y oportunidades; los campos base deben mantener sus nombres y semántica.
- El campo `status` permite imponer ciclos de vida específicos del dominio (p. ej. embudo comercial CRM).
- La unicidad de folio por serie, líneas de producto y numeración automática son puntos de extensión naturales.
