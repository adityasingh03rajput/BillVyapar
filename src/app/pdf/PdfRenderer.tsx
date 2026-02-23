import React, { forwardRef } from 'react';
import type { BusinessProfileDto, DocumentDto, PdfTemplateId } from './types';
import { renderTemplate } from './templates';

export const PdfRenderer = forwardRef<
  HTMLDivElement,
  {
    templateId: PdfTemplateId;
    doc: DocumentDto;
    profile: BusinessProfileDto;
  }
>(({ templateId, doc, profile }, ref) => {
  return (
    <div ref={ref}>
      {renderTemplate(templateId, { doc, profile })}
    </div>
  );
});

PdfRenderer.displayName = 'PdfRenderer';
