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

export async function exportElementToPdf(params: {
  element: HTMLElement;
  filename: string;
  title?: string;
}) {
  const { element, filename } = params;

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

  const canvas = await html2canvas(element, {
    scale: Math.max(2, window.devicePixelRatio || 1),
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
    onclone: (clonedDoc) => {
      try {
        // Tailwind v4 uses oklch() in generated CSS. html2canvas cannot reliably parse it.
        // Removing stylesheets avoids the parser path that throws `unsupported color function oklch`.
        clonedDoc.querySelectorAll('style, link[rel="stylesheet"]').forEach((n) => n.remove());

        const root = clonedDoc.body.querySelector('[data-slot="card"], body') as HTMLElement | null;
        const target = root || (clonedDoc.body as any);
        if (!target) return;

        if (target instanceof HTMLElement) {
          normalizeElementColors(clonedDoc, target);
        }

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

  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
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

  pdf.save(filename);
}
