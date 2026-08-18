/**
 * 017 D3: ?action=import-photos|import-json deep link parsing.
 * Share payloads (hash #share= or ?share=ss) take precedence — an explicit
 * share link must never be hijacked into an import panel.
 */

export type ImportSection = 'photos' | 'paste';

const ACTION_TO_SECTION: Record<string, ImportSection> = {
  'import-photos': 'photos',
  'import-json': 'paste',
};

export function resolveImportAction(search: string, hash: string): ImportSection | null {
  const params = new URLSearchParams(search);
  const action = params.get('action');
  if (!action) return null;
  const shareActive = hash.startsWith('#share=') || params.get('share') === 'ss';
  if (shareActive) return null;
  return ACTION_TO_SECTION[action] ?? null;
}

/** Query string with the action key removed; other params (lang, …) survive. */
export function stripActionFromSearch(search: string): string {
  const params = new URLSearchParams(search);
  if (!params.has('action')) return search;
  params.delete('action');
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}
