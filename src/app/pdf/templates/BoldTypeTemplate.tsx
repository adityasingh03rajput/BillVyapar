import React from 'react';
import type { PdfTemplateProps } from '../types';
import {
  KeyValueOptional,
  Money,
  TemplateFrame,
  amountInWordsINR,
  docTitleFromType,
  formatInlineAddress,
  formatStateDisplay,
  safeText,
} from './TemplateFrame';

/**
 * BoldType Template — Large typographic title on grey header band, clean white body,
 * grey footer strip. Inspired by modern editorial invoice design.
 */
export function BoldTypeTemplate({ doc, profile }: PdfTemplateProps) {
  const cgst = Number(doc.totalCgst || 0);
  const sgst = Number(doc.totalSgst || 0);
  const igst = Number(doc.totalIgst || 0);
  const taxes = cgst + sgst + igst;
  const grandTotal = Number(doc.grandTotal || 0);
  const partyLogo = String((doc as any)?.partyLogoDataUrl || '').trim();

  const lineComputed = (it: any) => {
    const qty = Number(it?.quantity || 0);
    const rate = Number(it?.rate || 0);
    const discountPct = Number(it?.discount || 0);
    const gross = qty * rate;
    const taxable = gross - (gross * discountPct) / 100;
    const taxPct = Number(it?.cgst || 0) + Number(it?.sgst || 0) + Number(it?.igst || 0);
    const taxAmount = (taxable * taxPct) / 100;
    const total = Number.isFinite(Number(it?.total)) ? Number(it.total) : taxable + taxAmount;
    return { qty, rate, taxable, taxPct, taxAmount, total };
  };

  const taxRows: Array<{ kind: string; rate: number; tax: number }> = [];
  (doc.items || []).forEach((it: any) => {
    const qty = Number(it?.quantity || 0);
    const rate = Number(it?.rate || 0);
    const discountPct = Number(it?.discount || 0);
    const gross = qty * rate;
    const taxable = gross - (gross * discountPct) / 100;
    const addRow = (kind: string, pct: number) => {
      if (!pct) return;
      const tax = (taxable * pct) / 100;
      const ex = taxRows.find((r) => r.kind === kind && r.rate === pct);
      if (ex) { ex.tax += tax; } else taxRows.push({ kind, rate: pct, tax });
    };
    addRow('CGST', Number(it?.cgst || 0));
    addRow('SGST', Number(it?.sgst || 0));
    addRow('IGST', Number(it?.igst || 0));
  });

  return (
    <TemplateFrame>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 1059 }}>

        {/* ── GREY HEADER BAND ── */}
        <div style={{ background: '#DCDCDC', padding: '28px 36px 24px 36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            {/* Left: big title + doc number */}
            <div>
              <div style={{ fontSize: 52, fontWeight: 900, color: '#111111', lineHeight: 1, letterSpacing: -2, textTransform: 'uppercase', fontFamily: 'Arial Black, Arial, sans-serif' }}>
                {docTitleFromType(doc.type)}
              </div>
              <div style={{ fontSize: 13, color: '#444444', marginTop: 8, fontWeight: 500, letterSpacing: 0.3 }}>
                #{safeText(doc.invoiceNo) || safeText(doc.documentNumber)}
              </div>
            </div>

            {/* Right: logo box + business name */}
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              {partyLogo && (
                <img src={partyLogo} alt="Logo" style={{ width: 64, height: 64, objectFit: 'cover', border: '1px solid #BBBBBB', background: '#fff' }} />
              )}
              <div style={{ fontSize: 14, fontWeight: 900, color: '#111111', letterSpacing: 1, textTransform: 'uppercase' }}>{profile.businessName}</div>
            </div>
          </div>
        </div>

        {/* ── WHITE BODY ── */}
        <div style={{ flex: 1, background: '#FFFFFF', padding: '28px 36px' }}>

          {/* META ROW: date/to/from */}
          <div style={{ display: 'flex', gap: 40, marginBottom: 28 }}>
            {/* Left: date + bill to */}
            <div style={{ flex: 1 }}>
              {!!doc.date && (
                <div style={{ display: 'flex', gap: 10, marginBottom: 6, fontSize: 11 }}>
                  <span style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5, minWidth: 60 }}>Date:</span>
                  <span>{doc.date}</span>
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, marginBottom: 6, fontSize: 11 }}>
                <span style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5, minWidth: 60 }}>To:</span>
                <span style={{ fontWeight: 700 }}>{safeText(doc.customerName) || '—'}</span>
              </div>
              {!!doc.customerAddress && (
                <div style={{ display: 'flex', gap: 10, marginBottom: 6, fontSize: 11 }}>
                  <span style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5, minWidth: 60 }}>Address:</span>
                  <span style={{ color: '#444444' }}>{formatInlineAddress(doc.customerAddress)}</span>
                </div>
              )}
              {!!doc.customerMobile && (
                <div style={{ display: 'flex', gap: 10, marginBottom: 6, fontSize: 11 }}>
                  <span style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5, minWidth: 60 }}>Phone:</span>
                  <span>{doc.customerMobile}</span>
                </div>
              )}
              {!!doc.customerGstin && (
                <div style={{ display: 'flex', gap: 10, marginBottom: 6, fontSize: 11 }}>
                  <span style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5, minWidth: 60 }}>GSTIN:</span>
                  <span>{doc.customerGstin}</span>
                </div>
              )}
              {(!!doc.customerStateCode || !!doc.placeOfSupply) && (
                <div style={{ display: 'flex', gap: 10, marginBottom: 6, fontSize: 11 }}>
                  <span style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5, minWidth: 60 }}>State:</span>
                  <span>{formatStateDisplay(doc.customerStateCode || null, doc.placeOfSupply || null)}</span>
                </div>
              )}
            </div>

            {/* Right: from (business) */}
            <div style={{ flex: 1 }}>
              {!!doc.dueDate && (
                <div style={{ display: 'flex', gap: 10, marginBottom: 6, fontSize: 11 }}>
                  <span style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5, minWidth: 60 }}>Due:</span>
                  <span>{doc.dueDate}</span>
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, marginBottom: 6, fontSize: 11 }}>
                <span style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5, minWidth: 60 }}>From:</span>
                <span style={{ fontWeight: 700 }}>{profile.businessName}</span>
              </div>
              {!!profile.email && (
                <div style={{ display: 'flex', gap: 10, marginBottom: 6, fontSize: 11 }}>
                  <span style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5, minWidth: 60 }}>Email:</span>
                  <span style={{ color: '#444444' }}>{profile.email}</span>
                </div>
              )}
              {!!profile.phone && (
                <div style={{ display: 'flex', gap: 10, marginBottom: 6, fontSize: 11 }}>
                  <span style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5, minWidth: 60 }}>Phone:</span>
                  <span>{profile.phone}</span>
                </div>
              )}
              {!!profile.gstin && (
                <div style={{ display: 'flex', gap: 10, marginBottom: 6, fontSize: 11 }}>
                  <span style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5, minWidth: 60 }}>GSTIN:</span>
                  <span>{profile.gstin}</span>
                </div>
              )}
              {!!profile.billingAddress && (
                <div style={{ display: 'flex', gap: 10, marginBottom: 6, fontSize: 11 }}>
                  <span style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5, minWidth: 60 }}>Address:</span>
                  <span style={{ color: '#444444' }}>{formatInlineAddress(profile.billingAddress)}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── ITEMS TABLE ── */}
          {/* Header row */}
          <div style={{ display: 'flex', borderTop: '2px solid #111111', borderBottom: '2px solid #111111', padding: '8px 0', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            <div style={{ flex: 2 }}>Item Description</div>
            <div style={{ width: 70, textAlign: 'right' }}>HSN/SAC</div>
            <div style={{ width: 90, textAlign: 'right' }}>Unit Price</div>
            <div style={{ width: 70, textAlign: 'right' }}>Quantity</div>
            <div style={{ width: 60, textAlign: 'right' }}>GST%</div>
            <div style={{ width: 90, textAlign: 'right' }}>Price</div>
          </div>

          {/* Item rows */}
          {(doc.items || []).map((it, idx) => {
            const c = lineComputed(it);
            return (
              <div key={idx} style={{ display: 'flex', borderBottom: '1px solid #DDDDDD', padding: '10px 0', fontSize: 11, alignItems: 'flex-start' }}>
                <div style={{ flex: 2, minWidth: 0 }}>
                  <div style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: 11 }}>{safeText(it?.name)}</div>
                  {!!it?.description && <div style={{ fontSize: 10, color: '#666666', marginTop: 3, whiteSpace: 'pre-line' }}>{it.description}</div>}
                  {!!it?.sku && <div style={{ fontSize: 10, color: '#888888' }}>SKU: {it.sku}</div>}
                </div>
                <div style={{ width: 70, textAlign: 'right', color: '#666666' }}>{safeText(it?.hsnSac) || '—'}</div>
                <div style={{ width: 90, textAlign: 'right' }}><Money value={c.rate} /></div>
                <div style={{ width: 70, textAlign: 'right' }}>{c.qty}</div>
                <div style={{ width: 60, textAlign: 'right', color: '#666666' }}>{c.taxPct > 0 ? `${c.taxPct}%` : '—'}</div>
                <div style={{ width: 90, textAlign: 'right', fontWeight: 900 }}><Money value={c.total} /></div>
              </div>
            );
          })}

          {/* ── BOTTOM: manager/bank left, totals right ── */}
          <div style={{ display: 'flex', gap: 30, marginTop: 20, alignItems: 'flex-start' }}>
            {/* Left: authorized + bank */}
            <div style={{ flex: 1 }}>
              {(profile.bankName || (profile as any).accountNumber || doc.bankName || doc.bankAccountNumber) && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Bank Details:</div>
                  <KeyValueOptional label="Bank" value={doc.bankName || profile.bankName} />
                  <KeyValueOptional label="Account Holder" value={(doc as any).bankAccountHolderName || profile.businessName} />
                  <KeyValueOptional label="Account No." value={doc.bankAccountNumber || (profile as any).accountNumber} />
                  <KeyValueOptional label="IFSC" value={doc.bankIfsc || (profile as any).ifscCode} />
                </div>
              )}
              {(profile.upiId || doc.upiId) && (
                <div style={{ marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
                  {!!doc.upiQrText && (
                    <img src={String(doc.upiQrText)} alt="UPI QR" style={{ width: 64, height: 64, border: '1px solid #DDDDDD', background: '#fff', padding: 3 }} />
                  )}
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.8 }}>UPI:</div>
                    <div style={{ fontSize: 11, fontWeight: 700 }}>{safeText(doc.upiId || profile.upiId)}</div>
                  </div>
                </div>
              )}
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.8 }}>Authorized Signatory:</div>
                <div style={{ fontSize: 11, marginTop: 2 }}>{profile.businessName}</div>
                <div style={{ height: 32 }} />
                <div style={{ width: 120, borderTop: '1px solid #111111', paddingTop: 4, fontSize: 10, color: '#666666' }}>Signature</div>
              </div>
            </div>

            {/* Right: totals */}
            <div style={{ width: 240 }}>
              {[
                { label: 'Subtotal:', value: Number(doc.subtotal || 0) },
                { label: `Tax (${taxes > 0 ? ((taxes / Math.max(Number(doc.subtotal || 1), 1)) * 100).toFixed(0) : 0}%):`, value: taxes, hide: taxes === 0 },
                { label: 'CGST:', value: cgst, hide: cgst === 0 },
                { label: 'SGST:', value: sgst, hide: sgst === 0 },
                { label: 'IGST:', value: igst, hide: igst === 0 },
                { label: 'Transport:', value: Number(doc.transportCharges || 0), hide: !doc.transportCharges },
                { label: 'Additional:', value: Number(doc.additionalCharges || 0), hide: !doc.additionalCharges },
                { label: 'Round Off:', value: Number(doc.roundOff || 0), hide: !doc.roundOff },
              ].filter((r) => !r.hide).map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #EEEEEE', fontSize: 12, fontWeight: 700 }}>
                  <span>{r.label}</span>
                  <span><Money value={r.value} /></span>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '2px solid #111111', marginTop: 4, fontSize: 15, fontWeight: 900 }}>
                <span>TOTAL:</span>
                <span><Money value={grandTotal} /></span>
              </div>

              <div style={{ fontSize: 10, color: '#666666', fontStyle: 'italic', marginTop: 6, lineHeight: 1.5 }}>
                {amountInWordsINR(grandTotal)}
              </div>
            </div>
          </div>

          {/* Terms */}
          {!!doc.termsConditions && (
            <div style={{ marginTop: 20, borderTop: '1px solid #DDDDDD', paddingTop: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>Terms & Conditions:</div>
              <div style={{ fontSize: 10, color: '#555555', whiteSpace: 'pre-line', lineHeight: 1.6 }}>{doc.termsConditions}</div>
            </div>
          )}
        </div>

        {/* ── GREY FOOTER BAND ── */}
        <div style={{ background: '#DCDCDC', padding: '14px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {!!profile.phone && <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#333333' }}>Phone: {profile.phone}</span>}
            {!!profile.email && <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#333333' }}>Email: {profile.email}</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, textAlign: 'right' }}>
            {!!profile.gstin && <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#333333' }}>GSTIN: {profile.gstin}</span>}
            {!!profile.billingAddress && <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#333333' }}>Address: {formatInlineAddress(profile.billingAddress)}</span>}
          </div>
        </div>

      </div>
    </TemplateFrame>
  );
}
