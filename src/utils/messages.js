export const MESSAGES = Object.freeze({
  noResults: 'No se encontraron resultados.',
  required: 'Completa los campos obligatorios.',
  invalidRut: 'El RUT es inválido.',
  duplicateRut: 'El RUT ya está registrado.',
  invalidContact: 'Revisa el dato de contacto según el canal elegido.',
  prospectRegistered: 'Prospecto registrado correctamente.',
  chatQueryRegistered: 'Consulta registrada; un ejecutivo hará seguimiento.',
  noCampaignRecords: 'Sin registros para esta campaña.',
  permissionDenied: 'No tienes permiso para realizar esta acción',
  accessDenied: 'Acceso denegado',
});

export function exactFormatMessage(key) {
  if (key === 'rut') return MESSAGES.invalidRut;
  if (typeof key === 'string' && key.startsWith('contacto_')) return MESSAGES.invalidContact;
  return MESSAGES.required;
}
