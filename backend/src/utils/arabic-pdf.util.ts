/**
 * arabic-pdf.util.ts
 * ------------------
 * Production-safe Arabic text support for PDF generation.
 *
 * HOW TO ENABLE FULL ARABIC SUPPORT:
 *   1. Download Amiri font: https://fonts.google.com/specimen/Amiri
 *   2. Place files in:  <backend_root>/assets/fonts/Amiri-Regular.ttf
 *                       <backend_root>/assets/fonts/Amiri-Bold.ttf
 *   3. The utility will auto-detect and register them.
 *
 * WITHOUT the font files the fallback is Helvetica (no Arabic glyphs).
 */

import fs from "fs";
import path from "path";

// ── Font paths ────────────────────────────────────────────────────────────────
const FONTS_DIR = path.join(process.cwd(), "assets", "fonts");
export const AMIRI_REGULAR = path.join(FONTS_DIR, "Amiri-Regular.ttf");
export const AMIRI_BOLD    = path.join(FONTS_DIR, "Amiri-Bold.ttf");
const NOTO_ARABIC          = path.join(FONTS_DIR, "NotoSansArabic-Regular.ttf");

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns true when the font file exists on disk. */
export const arabicFontAvailable = (): boolean =>
  fs.existsSync(AMIRI_REGULAR) || fs.existsSync(NOTO_ARABIC);

/** Returns true when the string contains Arabic characters. */
export const isArabic = (text: string): boolean =>
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);

/**
 * Register Arabic fonts with a PDFDocument instance.
 * Call this once before drawing any Arabic text.
 */
export const registerArabicFonts = (doc: PDFKit.PDFDocument): void => {
  const regular = fs.existsSync(AMIRI_REGULAR) ? AMIRI_REGULAR : NOTO_ARABIC;
  const bold    = fs.existsSync(AMIRI_BOLD)    ? AMIRI_BOLD    : regular;

  if (fs.existsSync(regular)) {
    doc.registerFont("Arabic",      regular);
    doc.registerFont("Arabic-Bold", bold);
  }
};

/**
 * Return the correct pdfkit font name for the given text.
 * Falls back to Helvetica when no Arabic font is installed.
 */
export const resolveFont = (text: string, bold = false): string => {
  if (isArabic(text) && arabicFontAvailable()) {
    return bold ? "Arabic-Bold" : "Arabic";
  }
  return bold ? "Helvetica-Bold" : "Helvetica";
};

/**
 * Build pdfkit text() options with RTL enabled for Arabic text.
 * Merge with any caller-supplied options.
 */
export const textOpts = (
  text: string,
  extra: Record<string, unknown> = {}
): Record<string, unknown> => ({
  ...extra,
  ...(isArabic(text)
    ? { direction: "rtl", align: "right", features: ["rtla"] }
    : {}),
});

// ── HTML Template (Puppeteer / browser-print approach) ────────────────────────

export interface ArabicPdfRow {
  label: string;
  value: string;
}

export interface ArabicPdfOptions {
  title?: string;
  subtitle?: string;
  institution?: string;
  direction?: "rtl" | "ltr";
  rows: ArabicPdfRow[];
  generatedAt?: Date;
}

/**
 * Generates a complete, self-contained HTML document suitable for:
 *   - Puppeteer page.pdf()
 *   - A browser's window.print() / CSS @media print
 *
 * Arabic text is rendered correctly because browsers use ICU for BiDi layout
 * and the Amiri font is loaded via Google Fonts CDN.
 *
 * Example (Puppeteer):
 *   const browser = await puppeteer.launch();
 *   const page    = await browser.newPage();
 *   await page.setContent(generateArabicHtml(opts), { waitUntil: 'networkidle0' });
 *   const buffer  = await page.pdf({ format: 'A4' });
 *   await browser.close();
 */
export const generateArabicHtml = (opts: ArabicPdfOptions): string => {
  const dir         = opts.direction ?? "rtl";
  const textAlign   = dir === "rtl" ? "right" : "left";
  const generatedAt = (opts.generatedAt ?? new Date()).toLocaleString("ar-DZ");

  const rowsHtml = opts.rows
    .map(
      (r) => `
        <tr>
          <th class="arabic">${r.label}</th>
          <td class="arabic">${r.value}</td>
        </tr>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="ar" dir="${dir}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link
    href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap"
    rel="stylesheet"
  />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Amiri', 'Noto Sans Arabic', Arial, sans-serif;
      direction: ${dir};
      unicode-bidi: embed;
      background: #ffffff;
      color: #111827;
      padding: 40px 48px;
    }

    .arabic {
      font-family: 'Amiri', serif;
      direction: rtl;
      unicode-bidi: embed;
      text-align: right;
    }

    header { text-align: center; margin-bottom: 32px; border-bottom: 2px solid #d1d5db; padding-bottom: 20px; }
    header h1 { font-size: 22px; font-weight: 700; margin-bottom: 6px; }
    header p  { font-size: 13px; color: #6b7280; }

    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td {
      border: 1px solid #e5e7eb;
      padding: 10px 14px;
      text-align: ${textAlign};
      font-size: 13px;
    }
    th { background: #f3f4f6; font-weight: 700; width: 38%; }
    tr:nth-child(even) td { background: #f9fafb; }

    footer {
      margin-top: 40px;
      text-align: center;
      font-size: 11px;
      color: #9ca3af;
    }

    @media print {
      body { padding: 20px; }
      @page { margin: 15mm; size: A4; }
    }
  </style>
</head>
<body>
  <header>
    ${opts.institution ? `<p class="arabic">${opts.institution}</p>` : ""}
    ${opts.title ? `<h1 class="arabic">${opts.title}</h1>` : ""}
    ${opts.subtitle ? `<p class="arabic">${opts.subtitle}</p>` : ""}
  </header>

  <table>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <footer>
    <p class="arabic">تاريخ الإصدار: ${generatedAt}</p>
  </footer>
</body>
</html>`;
};
