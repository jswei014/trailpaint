/* ── Historical map overlay definitions (Academia Sinica 中研院) ── */

export type OverlayGroup = 'taiwan' | 'china' | 'ancient' | 'explore' | 'war';

export interface OverlayDef {
  id: string;
  labelKey:
    | 'overlay.jm200k1897'
    | 'overlay.jm20k1921'
    | 'overlay.corona1966'
    | 'overlay.tang741'
    | 'overlay.yuan1330'
    | 'overlay.ming1582'
    | 'overlay.rome200';
  group: OverlayGroup;
  url: string;
  attribution: string;
  maxZoom: number;
  /** Native tile pyramid ceiling — Leaflet upscales above this. Optional; defaults to maxZoom. */
  maxNativeZoom?: number;
  /** Geographic bounds [[south, west], [north, east]] — used to auto-fit when user selects overlay. */
  bounds?: [[number, number], [number, number]];
}

/** Ordered list of groups for UI rendering (groups absent from OVERLAYS are skipped). */
export const OVERLAY_GROUP_ORDER: OverlayGroup[] = ['taiwan', 'china', 'ancient', 'explore', 'war'];

/** Return the native pyramid ceiling of an overlay, if any — useful for capping fitBounds zoom. */
export function getOverlayZoomCap(overlayId: string | null | undefined): number | undefined {
  if (!overlayId) return undefined;
  const ov = OVERLAYS.find((o) => o.id === overlayId);
  return ov?.maxNativeZoom;
}

export const OVERLAY_GROUP_LABEL_KEY: Record<OverlayGroup, string> = {
  taiwan: 'overlay.group.taiwan',
  china: 'overlay.group.china',
  ancient: 'overlay.group.ancient',
  explore: 'overlay.group.explore',
  war: 'overlay.group.war',
};

// Rough bounding boxes reused by every overlay in each region.
const BOUNDS_TAIWAN: [[number, number], [number, number]] = [[21.5, 119.5], [25.5, 122.3]];
const BOUNDS_CHINA_HISTORIC: [[number, number], [number, number]] = [[18, 73], [54, 135]];
const BOUNDS_ROMAN_MEDITERRANEAN: [[number, number], [number, number]] = [[20, -10], [55, 55]];

export const OVERLAYS: OverlayDef[] = [
  {
    id: 'jm200k_1897',
    labelKey: 'overlay.jm200k1897',
    group: 'taiwan',
    url: 'https://gis.sinica.edu.tw/tileserver/file-exists.php?img=JM200K_1897-png-{z}-{x}-{y}',
    attribution: '中央研究院人社中心GIS專題中心',
    maxZoom: 18,
    maxNativeZoom: 14,
    bounds: BOUNDS_TAIWAN,
  },
  {
    id: 'jm20k_1921',
    labelKey: 'overlay.jm20k1921',
    group: 'taiwan',
    url: 'https://gis.sinica.edu.tw/tileserver/file-exists.php?img=JM20K_1921-jpg-{z}-{x}-{y}',
    attribution: '中央研究院人社中心GIS專題中心',
    maxZoom: 18,
    maxNativeZoom: 14,
    bounds: BOUNDS_TAIWAN,
  },
  {
    id: 'corona_1966',
    labelKey: 'overlay.corona1966',
    group: 'taiwan',
    url: 'https://gis.sinica.edu.tw/tileserver/file-exists.php?img=Taiwan_Corona_1966-png-{z}-{x}-{y}',
    attribution: '中央研究院人社中心GIS專題中心',
    maxZoom: 18,
    maxNativeZoom: 14,
    bounds: BOUNDS_TAIWAN,
  },
  {
    id: 'tang_741',
    labelKey: 'overlay.tang741',
    group: 'china',
    url: 'https://gis.sinica.edu.tw/ccts/file-exists.php?img=ad0741-jpg-{z}-{x}-{y}',
    attribution: '中央研究院人社中心GIS專題中心（CCTS）',
    maxZoom: 18,
    maxNativeZoom: 10,
    bounds: BOUNDS_CHINA_HISTORIC,
  },
  {
    id: 'yuan_1330',
    labelKey: 'overlay.yuan1330',
    group: 'china',
    url: 'https://gis.sinica.edu.tw/ccts/file-exists.php?img=ad1330-jpg-{z}-{x}-{y}',
    attribution: '中央研究院人社中心GIS專題中心（CCTS）',
    maxZoom: 18,
    maxNativeZoom: 10,
    bounds: BOUNDS_CHINA_HISTORIC,
  },
  {
    id: 'ming_1582',
    labelKey: 'overlay.ming1582',
    group: 'china',
    url: 'https://gis.sinica.edu.tw/ccts/file-exists.php?img=ad1582-jpg-{z}-{x}-{y}',
    attribution: '中央研究院人社中心GIS專題中心（CCTS）',
    maxZoom: 18,
    maxNativeZoom: 10,
    bounds: BOUNDS_CHINA_HISTORIC,
  },
  {
    id: 'rome_200',
    labelKey: 'overlay.rome200',
    group: 'ancient',
    url: 'https://dh.gu.se/tiles/imperium/{z}/{x}/{y}.png',
    attribution: '© Johan Åhlfeldt, CDH University of Gothenburg (DARE, CC BY 4.0)',
    maxZoom: 18,
    maxNativeZoom: 10,
    bounds: BOUNDS_ROMAN_MEDITERRANEAN,
  },
];
