import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const resolveToRgb = (doc: Document, value: string) => {
  const v = String(value || '').trim();
  if (!v) return v;
  if (!v.includes('oklch')) return v;

  const tmp = doc.createElement('span');
  tmp.style.color = v;
  doc.body.appendChild(tmp);
  const rgb = doc.defaultView?.getComputedStyle(tmp).color || v;
  tmp.remove();
  return rgb;
};

const normalizeElementColors = (doc: Document, el: HTMLElement) => {
  const win = doc.defaultView;
  if (!win) return;

  const cs = win.getComputedStyle(el);
  const props = [
    'color',
    'backgroundColor',
    'borderTopColor',
    'borderRightColor',
    'borderBottomColor',
    'borderLeftColor',
    'outlineColor',
    'textDecorationColor',
    'caretColor',
    'fill',
    'stroke',
  ] as const;

  for (const p of props) {
    const v = cs[p as any];
    if (typeof v === 'string' && v.includes('oklch')) {
      (el.style as any)[p] = resolveToRgb(doc, v);
    }
  }

  const complexProps = [
    'backgroundImage',
    'boxShadow',
    'textShadow',
    'filter',
    'borderImageSource',
  ] as const;
  for (const p of complexProps) {
    const v = cs[p as any];
    if (typeof v === 'string' && v.includes('oklch')) {
      // html2canvas cannot parse oklch inside gradients/shadows/filters.
      // Strip these effects for PDF export stability.
      if (p === 'backgroundImage') (el.style as any)[p] = 'none';
      else if (p === 'borderImageSource') (el.style as any)[p] = 'none';
      else (el.style as any)[p] = 'none';
    }
  }
};

import { savePdfWithDialog } from '../utils/saveFile';

const smartSave = async (pdf: jsPDF, filename: string) => {
  await savePdfWithDialog(pdf, filename);
};

export async function exportElementToPdf(params: {
  element: HTMLElement;
  filename: string;
  title?: string;
  scale?: number;
  imageFormat?: 'PNG' | 'JPEG';
  jpegQuality?: number;
  marginPt?: number;
}) {
  const { element, filename } = params;
  const scale = Number.isFinite(params.scale) ? Math.max(0.5, Number(params.scale)) : 2;
  const imageFormat = params.imageFormat || 'PNG';
  const jpegQuality = Number.isFinite(params.jpegQuality) ? Math.min(1, Math.max(0.1, Number(params.jpegQuality))) : 0.8;
  const marginPt = Number.isFinite(params.marginPt) ? Math.max(0, Number(params.marginPt)) : 0;

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

  const canvas = await html2canvas(element, {
    scale,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
    width: 794,
    height: 1123,
    onclone: (clonedDoc) => {
      try {
        const target = clonedDoc.getElementById('pdf-capture-node') || clonedDoc.body;
        if (target instanceof HTMLElement) {
          target.style.transform = 'none';
          target.style.transformOrigin = 'unset';
          target.style.margin = '0';
          target.style.position = 'absolute';
          target.style.top = '0';
          target.style.left = '0';
          target.style.width = '210mm';
          target.style.height = '297mm';

          const nodes = target.querySelectorAll<HTMLElement>('*');
          normalizeElementColors(clonedDoc, target);
          nodes.forEach((n) => normalizeElementColors(clonedDoc, n));
        }
      } catch (err) {
        console.warn('PDF Export Error:', err);
      }
    },
  });

  const imgData = imageFormat === 'JPEG'
    ? canvas.toDataURL('image/jpeg', jpegQuality)
    : canvas.toDataURL('image/png');

  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  pdf.addImage(imgData, imageFormat, 0, 0, 210, 297, undefined, 'FAST');
  await smartSave(pdf, filename);
}

export async function exportElementToPdfBlobUrl(params: {
  element: HTMLElement;
  filename?: string;
  title?: string;
  scale?: number;
  imageFormat?: 'PNG' | 'JPEG';
  jpegQuality?: number;
  marginPt?: number;
}) {
  const { element, filename } = params;

  // Use a higher scale for better quality, but cap it to prevent memory issues
  const scale = Number.isFinite(params.scale) ? Math.max(0.5, Number(params.scale)) : 2;
  const imageFormat = params.imageFormat || 'PNG';
  const jpegQuality = Number.isFinite(params.jpegQuality) ? Math.min(1, Math.max(0.1, Number(params.jpegQuality))) : 0.8;
  const marginPt = Number.isFinite(params.marginPt) ? Math.max(0, Number(params.marginPt)) : 0;

  // Ensure element is ready
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

  // html2canvas struggles with transforms. We clone and reset them.
  const canvas = await html2canvas(element, {
    scale,
    backgroundColor: '#ffffff',
    width: 794,
    height: 1123,
    onclone: (clonedDoc) => {
      try {
        const target = clonedDoc.getElementById('pdf-capture-node') || clonedDoc.body;
        if (target instanceof HTMLElement) {
          target.style.transform = 'none';
          target.style.transformOrigin = 'unset';
          target.style.margin = '0';
          target.style.position = 'absolute';
          target.style.top = '0';
          target.style.left = '0';
          target.style.width = '210mm';
          target.style.height = '297mm';

          const nodes = target.querySelectorAll<HTMLElement>('*');
          normalizeElementColors(clonedDoc, target);
          nodes.forEach((n) => normalizeElementColors(clonedDoc, n));
        }
      } catch (err) {
        console.warn('PDF Clone Normalization failed:', err);
      }
    },
  });

  const imgData = imageFormat === 'JPEG' ? canvas.toDataURL('image/jpeg', jpegQuality) : canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  pdf.addImage(imgData, imageFormat, 0, 0, 210, 297, undefined, 'FAST');
  const blob = pdf.output('blob');
  const url = URL.createObjectURL(blob);
  if (filename) { try { (window as any).__billvyapar_last_pdf_filename = filename; } catch {} }
  return url;
}

export async function exportHtmlPagesToPdf(params: {
  pages: HTMLElement[];
  filename: string;
}) {
  const { pages, filename } = params;
  const valid = (pages || []).filter(Boolean);
  if (valid.length === 0) {
    throw new Error('No pages to export');
  }

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < valid.length; i += 1) {
    const el = valid[i];
    const canvas = await html2canvas(el, {
      scale: Math.max(2, window.devicePixelRatio || 1),
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      onclone: (clonedDoc) => {
        try {
          clonedDoc.querySelectorAll('style, link[rel="stylesheet"]').forEach((n) => n.remove());
          const nodes = clonedDoc.body.querySelectorAll<HTMLElement>('*');
          nodes.forEach((n) => {
            normalizeElementColors(clonedDoc, n);
          });
        } catch {
          // ignore
        }
      },
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const y = Math.max(0, (pageHeight - imgHeight) / 2);

    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, y, imgWidth, imgHeight, undefined, 'FAST');

    const label = `${i + 1}/${valid.length}`;
    pdf.setFontSize(9);
    pdf.setTextColor(120);
    pdf.text(label, pageWidth - 36, pageHeight - 18, { align: 'right' });
  }

  await smartSave(pdf, filename);
}
