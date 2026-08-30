import { t } from '../i18n';

interface OverlayOpacitySliderProps {
  opacity: number;
  onChange: (opacity: number) => void;
}

/** Opacity slider rendered inline right under the active overlay option,
 *  so it appears where the user just tapped instead of at the menu bottom. */
export default function OverlayOpacitySlider({ opacity, onChange }: OverlayOpacitySliderProps) {
  return (
    <div className="basemap-switcher__slider-row">
      <span className="basemap-switcher__slider-label">{t('overlay.opacity')}</span>
      <input
        type="range"
        min="0"
        max="100"
        value={Math.round(opacity * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="basemap-switcher__slider"
      />
      <span className="basemap-switcher__slider-value">
        {Math.round(opacity * 100)}%
      </span>
    </div>
  );
}
