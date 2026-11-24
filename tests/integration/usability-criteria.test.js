import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { DEFAULT_CONFIG, MODULE_CONFIG, setActiveConfig } from '../../src/module-config.js';
import { loadEntities } from '../../src/storage.js';
import { formatRut } from '../../src/utils/field-formats.js';
import { signIn } from '../helpers/auth-session.js';

const MAX_SECONDS = 300;
const SUCCESS_THRESHOLD = 90;
const TASKS = ['Crear', 'Editar', 'Buscar', 'Eliminar'];
const RUTS = [11111111, 22222222, 33333333, 44444444, 55555555].map(formatRut);

let app = null;

const checklist = readFileSync(
  resolve(process.cwd(), 'tests/integration/usability-checklist.md'),
  'utf8'
);

function sectionBetween(start, end) {
  const from = checklist.indexOf(start);
  const to = end ? checklist.indexOf(end, from) : checklist.length;
  return checklist.slice(from, to);
}

function cells(line) {
  return line
    .split('|')
    .slice(1, -1)
    .map((cell) => cell.trim());
}

function participantRows(section) {
  return section
    .split('\n')
    .filter((line) => /^\|\s*P[1-5]\s*\|/.test(line))
    .map(cells);
}

function setField(name, value) {
  const field = document.querySelector(`#entity-form [name="${name}"]`);
  if (!field) throw new Error(`Campo ${name} no disponible en el formulario`);
  field.value = String(value);
  field.dispatchEvent(new Event('input', { bubbles: true }));
  field.dispatchEvent(new Event('change', { bubbles: true }));
}

function fillEntityForm({ name, rut }) {
  setField('canal_contacto', 'llamada');
  setField('name', name);
  setField('targetDate', '1990-01-01');
  setField('rut', rut);
  setField('contacto_telefono', '+56912345678');
}

function submitEntityForm() {
  document.querySelector('#entity-form').dispatchEvent(new Event('submit', { bubbles: true }));
}

function createEntity(name, rut) {
  app.navigate('manage-entity');
  fillEntityForm({ name, rut });
  submitEntityForm();
  return loadEntities().find((entity) => entity.name === name);
}

function editEntity(entity, newName) {
  app.navigate('search');
  const input = document.querySelector('#search-input');
  input.value = entity.name;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  document
    .querySelector(`[data-action="edit-entity"][data-id="${entity.id}"]`)
    .dispatchEvent(new MouseEvent('click', { bubbles: true }));
  setField('name', newName);
  submitEntityForm();
}

function searchFor(name) {
  app.navigate('search');
  const input = document.querySelector('#search-input');
  input.value = name;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  return document.querySelector('.entity-list')?.textContent || '';
}

function deleteById(id, name) {
  app.navigate('search');
  const input = document.querySelector('#search-input');
  input.value = name;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  document
    .querySelector(`[data-action="delete-entity"][data-id="${id}"]`)
    .dispatchEvent(new MouseEvent('click', { bubbles: true }));
  return !loadEntities().some((entity) => entity.id === id);
}

afterEach(() => {
  app?.destroy();
  app = null;
  setActiveConfig(DEFAULT_CONFIG);
  localStorage.clear();
});

describe('Checklist SC-003', () => {
  it('define una plantilla de cinco participantes con tareas y criterios medibles', () => {
    const template = sectionBetween('## Plantilla', '## Marco de resultados de ejemplo');
    const participantes = participantRows(template);

    expect(participantes).toHaveLength(20);
    for (let index = 1; index <= 5; index += 1) {
      for (const task of TASKS) {
        expect(
          participantes.some((row) => row[0] === `P${index}` && row[1] === task),
          `P${index} / ${task}`
        ).toBe(true);
      }
    }
    for (const heading of ['Tiempo (s)', 'Completada (Sí/No)', 'Ayuda (Sí/No)', 'Errores']) {
      expect(template).toContain(heading);
    }
    expect(checklist).toContain('300 s');
    expect(checklist).toContain('90 %');
  });

  it('incluye un marco de resultados de ejemplo con aprobación superior al umbral', () => {
    const example = sectionBetween('## Marco de resultados de ejemplo');
    const rows = participantRows(example);
    const totalRow = example
      .split('\n')
      .filter((line) => /^\|\s*Total\s*\|/.test(line))
      .map(cells)[0];

    expect(rows).toHaveLength(5);
    expect(totalRow.slice(1, 3)).toEqual(['20', '20']);
    expect(example).toContain('100 %');
    expect(example).toContain('≥ 90 %');
    expect(example).toContain('ficticio');
  });
});

describe('Simulación SC-003 de cinco participantes virtuales', () => {
  it('crea, edita, busca y elimina una entidad con éxito en cada iteración', async () => {
    await signIn('camila.ramirez');
    app = initApp({ mountElement: document.body, rawConfig: MODULE_CONFIG, enableAuth: true });

    const resultados = [];
    for (let index = 0; index < 5; index += 1) {
      const nombre = `Participante ${index + 1}`;
      const nombreEditado = `${nombre} Editado`;
      const tiempos = {};

      let startedAt = performance.now();
      const entity = createEntity(nombre, RUTS[index]);
      tiempos.crear = performance.now() - startedAt;
      expect(entity).toBeTruthy();

      startedAt = performance.now();
      editEntity(entity, nombreEditado);
      tiempos.editar = performance.now() - startedAt;
      expect(loadEntities().find((candidate) => candidate.id === entity.id).name).toBe(
        nombreEditado
      );

      startedAt = performance.now();
      const searchResults = searchFor(nombreEditado);
      tiempos.buscar = performance.now() - startedAt;
      expect(searchResults).toContain(nombreEditado);

      startedAt = performance.now();
      const deleted = deleteById(entity.id, nombreEditado);
      tiempos.eliminar = performance.now() - startedAt;
      expect(deleted).toBe(true);

      for (const task of Object.keys(tiempos)) {
        expect(tiempos[task], `tiempo de ${task}`).toBeLessThan(MAX_SECONDS * 1000);
      }
      resultados.push({ participante: `P${index + 1}`, tiempos, completadas: 4 });
    }

    expect(resultados).toHaveLength(5);
    const completadas = resultados.reduce((total, item) => total + item.completadas, 0);
    const porcentaje = (completadas / 20) * 100;
    expect(completadas).toBe(20);
    expect(porcentaje).toBeGreaterThanOrEqual(SUCCESS_THRESHOLD);
  });
});
