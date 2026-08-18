import { describe, it, expect } from 'vitest';
import { resolveImportAction, stripActionFromSearch } from './importAction';

describe('resolveImportAction', () => {
  it('maps the two known actions to wizard sections', () => {
    expect(resolveImportAction('?action=import-photos', '')).toBe('photos');
    expect(resolveImportAction('?action=import-json', '')).toBe('paste');
  });

  it('share payload wins over action (both ?share=ss and #share=)', () => {
    expect(resolveImportAction('?action=import-json&share=ss', '')).toBeNull();
    expect(resolveImportAction('?action=import-json', '#share=abc')).toBeNull();
  });

  it('null for absent or unknown action', () => {
    expect(resolveImportAction('', '')).toBeNull();
    expect(resolveImportAction('?lang=ja', '')).toBeNull();
    expect(resolveImportAction('?action=frobnicate', '')).toBeNull();
  });
});

describe('stripActionFromSearch', () => {
  it('removes action but keeps other params', () => {
    expect(stripActionFromSearch('?action=import-json&lang=ja')).toBe('?lang=ja');
    expect(stripActionFromSearch('?lang=ja&action=import-photos')).toBe('?lang=ja');
  });

  it('returns empty string when action was the only param', () => {
    expect(stripActionFromSearch('?action=import-json')).toBe('');
  });

  it('leaves a search string without action untouched', () => {
    expect(stripActionFromSearch('?lang=ja')).toBe('?lang=ja');
    expect(stripActionFromSearch('')).toBe('');
  });
});
