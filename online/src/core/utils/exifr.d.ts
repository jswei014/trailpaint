declare module 'exifr/dist/lite.umd.js' {
  interface ExifrParseResult {
    latitude?: number;
    longitude?: number;
    DateTimeOriginal?: Date | string;
    [key: string]: unknown;
  }

  interface ExifrParseOptions {
    gps?: boolean;
    ifd0?: boolean;
    exif?: boolean;
    pick?: string[];
  }

  function parse(file: File, options?: ExifrParseOptions): Promise<ExifrParseResult>;

  export default {
    parse,
  };
}
