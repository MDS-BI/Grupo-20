export const kpis = Object.freeze({
  ingresosMes: 184500,
  clientesActivos: 128,
  campanasActivas: 6,
  conversionPromedio: 24.8,
  ticketsAbiertos: 14,
});

export const ventasPorMes = Object.freeze([
  Object.freeze({ mes: 'Jun', ingresos: 142000, negocios: 18 }),
  Object.freeze({ mes: 'Jul', ingresos: 158500, negocios: 21 }),
  Object.freeze({ mes: 'Ago', ingresos: 151000, negocios: 19 }),
  Object.freeze({ mes: 'Sep', ingresos: 172500, negocios: 24 }),
  Object.freeze({ mes: 'Oct', ingresos: 168000, negocios: 22 }),
  Object.freeze({ mes: 'Nov', ingresos: 184500, negocios: 27 }),
]);

export const ticketsPorEstado = Object.freeze([
  Object.freeze({ estado: 'Abierto', total: 14 }),
  Object.freeze({ estado: 'En proceso', total: 9 }),
  Object.freeze({ estado: 'Resuelto', total: 32 }),
]);

export const leadsPorCampana = Object.freeze([
  Object.freeze({ campana: 'Lanzamiento Q4', leads: 148 }),
  Object.freeze({ campana: 'Captación PyME', leads: 96 }),
  Object.freeze({ campana: 'Retención VIP', leads: 74 }),
  Object.freeze({ campana: 'Email navideño', leads: 112 }),
  Object.freeze({ campana: 'Webinars', leads: 58 }),
  Object.freeze({ campana: 'Referidos', leads: 83 }),
]);

export const mockData = Object.freeze({
  kpis,
  ventasPorMes,
  ticketsPorEstado,
  leadsPorCampana,
});

export default mockData;
