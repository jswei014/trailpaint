import { kml } from '@tmcw/togeojson';
import type { ImportBundle, GeoJsonFeatureCollection } from './geojsonImport';

export function parseKml(xmlString: string): ImportBundle {
  let doc: Document;

  try {
    const parser = new DOMParser();
    doc = parser.parseFromString(xmlString, 'text/xml');
  } catch (err) {
    throw new Error('非有效 KML');
  }

  // Check for parse error (XML malformed)
  // Use getElementsByTagName for compatibility with both browser DOM and @xmldom/xmldom
  const parseErrorElements = doc.getElementsByTagName('parsererror');
  if (parseErrorElements && parseErrorElements.length > 0) {
    throw new Error('非有效 KML');
  }

  let featureCollection: GeoJsonFeatureCollection;
  try {
    const result = kml(doc);
    if (!result || result.type !== 'FeatureCollection') {
      throw new Error('非有效 KML');
    }
    featureCollection = result as GeoJsonFeatureCollection;
  } catch (err) {
    throw new Error('非有效 KML');
  }

  return {
    featureCollection,
  };
}
