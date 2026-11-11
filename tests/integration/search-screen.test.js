import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;

function qs(id){ return document.getElementById(id); }

beforeEach(async () => {
  dom = new JSDOM(html, { url: 'http://localhost/' });
  const w = dom.window;
  globalThis.window = w;
  globalThis.document = w.document;
  globalThis.localStorage = w.localStorage;
  globalThis.alert = vi.fn();
  globalThis.confirm = vi.fn(() => true);
  w.scrollTo = vi.fn();
  w.localStorage.clear();
  vi.resetModules();
  const { boot } = await import('../../src/app.js');
  await boot();
});

afterEach(() => {
  dom.window.close();
});

describe('User Story 11 - dedicated search screen', () => {
  it('opens the search screen from the sidebar and focuses the input', () => {
    qs('nav-search').click();
    expect(qs('view-search').hidden).toBe(false);
    expect(qs('view-entities').hidden).toBe(true);
    expect(qs('view-documents').hidden).toBe(true);
    expect(qs('view-dashboard').hidden).toBe(true);
    expect(document.activeElement).toBe(qs('search-input'));
    expect(qs('nav-search').getAttribute('aria-current')).toBe('page');
  });

  it('does not show the editing forms on the search screen', () => {
    qs('nav-search').click();
    expect(qs('entity-form').closest('#view-search')).toBeNull();
    expect(qs('document-form').closest('#view-search')).toBeNull();
    expect(qs('search-input')).not.toBeNull();
  });

  it('returns to the dashboard without losing search state', () => {
    qs('nav-search').click();
    qs('search-input').value = 'acme';
    qs('nav-dashboard').click();
    expect(qs('view-dashboard').hidden).toBe(false);
    expect(qs('view-search').hidden).toBe(true);
    expect(qs('nav-dashboard').getAttribute('aria-current')).toBe('page');
    expect(qs('search-input').value).toBe('acme');
  });
});
