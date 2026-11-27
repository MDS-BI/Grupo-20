import { describe, expect, it } from 'vitest';
import { renderSearchHtml, renderSearchResultsHtml } from '../../src/components/search.js';

describe('Vista de búsqueda', () => {
  it('muestra el mensaje exacto cuando no hay resultados', () => {
    expect(renderSearchResultsHtml([])).toContain('No se encontraron resultados.');
  });

  it('renderiza el buscador y permite abrir la ficha de un resultado', () => {
    const html = renderSearchHtml({
      config: { moduleName: 'CRM Comercial', labels: { entityPlural: 'Clientes' } },
      query: 'Ana',
      entities: [{ entity_id: 'ent-1', name: 'Ana Torres' }],
    });
    expect(html).toContain('id="search-form"');
    expect(html).toContain('Ana Torres');
    expect(html).toContain('data-action="view-entity" data-entity-id="ent-1"');
  });
});
