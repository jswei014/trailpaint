import { parseRef } from './scriptureParser';
import { buildBibleUrl } from './bibleUrl';
import { currentLocale, t } from '../i18n';

interface Props {
  refs: string[] | undefined;
}

/**
 * Renders Spot.scripture_refs as a one-line row at the bottom of the popup.
 * Valid refs become bible.com deep links; invalid refs render as plain text.
 * Safe against javascript:/XSS: URLs pass through buildBibleUrl's whitelist.
 */
export default function ScriptureRefs({ refs }: Props) {
  if (!refs || refs.length === 0) return null;

  return (
    <p
      style={{
        margin: '8px 0 0',
        fontSize: '12px',
        color: '#7c3a0e',
        fontFamily: 'Georgia, serif',
        lineHeight: 1.5,
      }}
    >
      {t('popup.scripture')}
      {refs.map((raw, i) => {
        const parsed = parseRef(raw);
        const url = parsed ? buildBibleUrl(parsed, currentLocale) : null;
        const sep = i > 0 ? ' | ' : '';
        return (
          <span key={`${raw}-${i}`}>
            {sep}
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{ color: '#b45309', textDecoration: 'underline' }}
              >
                {raw}
              </a>
            ) : (
              <span>{raw}</span>
            )}
          </span>
        );
      })}
    </p>
  );
}
