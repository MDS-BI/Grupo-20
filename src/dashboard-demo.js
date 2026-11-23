const STATUS_COUNTS = {
  prospecto: 2,
  contactado: 2,
  'en negociacion': 1,
  'cerrado ganado': 25,
  'cerrado perdido': 2,
  pendiente: 3,
};

const ACTIVE_IMPORTES = {
  prospecto: [300, 300],
  contactado: [300, 300],
  'en negociacion': [300],
};

function buildDemoDocuments() {
  const documents = [];
  let sequence = 0;
  for (const [status, count] of Object.entries(STATUS_COUNTS)) {
    for (let index = 0; index < count; index += 1) {
      sequence += 1;
      documents.push({
        id: `demo-interaccion-${sequence}`,
        entity_id: `demo-cliente-${sequence}`,
        status,
        importe: ACTIVE_IMPORTES[status]?.[index] || 0,
        notes: `Interacción de referencia · ${status}`,
        createdAt: new Date(Date.UTC(2026, 10, 20) - sequence * 86400000).toISOString(),
      });
    }
  }
  return documents;
}

export const DASHBOARD_DEMO_STATS = {
  entityCount: 421,
  documentCount: 35,
  conversionRate: 64,
  documents: buildDemoDocuments(),
  isDemo: true,
};
