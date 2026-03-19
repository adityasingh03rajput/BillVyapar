import React from 'react';
import type { PdfTemplateProps } from '../types';
import {
  Hr,
  KeyValue,
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
 * Corporate Template — Bold blue header band, clean white body, structured grid layout.
 * Print-optimized: no shadows, solid borders, high contrast.
 */
export function CorporateTemplate({ doc, profile }: PdfTemplateProps) {
  const cgst = Number(doc.totalCgst || 0);
  const sgst = Number(doc.totalSgst || 0);
  const igst = Number(doc.totalIgst || 0);
  const taxes = cgst + sgst + igst;
  const grandTotal = Number(doc.grandTotal || 0);
  const businessStateCode = String(profile.gstin || '').trim().slice(0, 2);
  const partyLogo = String((doc as any)?.partyLogoDataUrl || '').trim();

  const accent = '#1E3A5F';
  const accentLight = '#E8EEF5';
  const accentMid = '#2E5090';
  const border = '#C8D4E3';
  const muted = '#5A6A7A';

  const lineComputed = (it: any) => {
    const qty = Number(it?.quantity || 0);
    const rate = Number(it?.rate || 0);
    const discountPct = Number(it?.discount || 0);
    const gross = qty * rate;
    const taxable = gross - (gross * discountPct) / 100;
    const cgstPct = Number(it?.cgst || 0);
    const sgstPct = Number(it?.sgst || 0);
    const igstPct = Number(it?.igst || 0);
    const taxPct = cgstPct + sgstPct + igstPct;
    const taxAmount = (taxable * taxPct) / 100;
    const total = Number.isFinite(Number(it?.total)) ? Number(it.total) : taxable + taxAmount;
    return { qty, rate, taxable, taxPct, taxAmount, total };
  };

  const taxRows: Array<{ kind: string; rate: number; taxable: number; tax: number }> = [];
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
      if (ex) { ex.taxable += taxable; ex.tax += tax; }
      else taxRows.push({ kind, rate: pct, taxable, tax });
    };
    addRow('CGST', Number(it?.cgst || 0));
    addRow('SGST', Number(it?.sgst || 0));
    addRow('IGST', Number(it?.igst || 0));
  });

  return (
    <TemplateFrame>
      {/* TOP HEADER BAND */}
      <div style={{ background: accent, borderRadius: '10px 10px 0 0', padding: '22px 28px 18px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          {/* Left: Logo + Business */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', minWidth: 0 }}>
            {partyLogo ? (
              <img src={partyLogo} alt="Logo" style={{ width: 56, height: 56, borderRadius: 8, border: '2px solid rgba(255,255,255,0.3)', objectFit: 'cover', background: '#fff' }} />
            ) : null}
            <div>
              <div style={{ color: '#FFFFFF', fontSize: 22, fontWeight: 900, letterSpacing: -0.3 }}>{profile.businessName}</div>
              {!!profile.billingAddress && (
                <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10, marginTop: 4, maxWidth: 300 }}>{formatInlineAddress(profile.billingAddress)}</div>
              )}
              <div style={{ display: 'flex', gap: 16, marginTop: 5, flexWrap: 'wrap' }}>
                {!!profile.phone && <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>📞 {profile.phone}</span>}
                {!!profile.email && <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>✉ {profile.email}</span>}
                {!!profile.gstin && <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>GSTIN: {profile.gstin}</span>}
              </div>
            </div>
          </div>
          {/* Right: Doc type + number */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 900, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              {docTitleFromType(doc.type)}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 6 }}>
              #{safeText(doc.invoiceNo) || safeText(doc.documentNumber)}
            </div>
            {!!doc.date && <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 3 }}>Date: {doc.date}</div>}
            {!!doc.dueDate && <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 2 }}>Due: {doc.dueDate}</div>}
          </div>
        </div>
      </div>

      {/* BLUE ACCENT STRIP */}
      <div style={{ background: accentMid, height: 5 }} />

      {/* BODY */}
      <div style={{ border: `1px solid ${border}`, borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '20px 28px' }}>

        {/* BILL TO + DETAILS ROW */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
          <div style={{ flex: 1.5, background: accentLight, borderRadius: 8, padding: '14px 16px', border: `1px solid ${border}` }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: accentMid, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Bill To</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#111827' }}>{safeText(doc.customerName) || '—'}</div>
            {!!doc.customerAddress && <div style={{ fontSize: 11, color: muted, marginTop: 5 }}>{formatInlineAddress(doc.customerAddress)}</div>}
            {!!doc.customerGstin && <div style={{ fontSize: 11, color: '#111827', marginTop: 5, fontWeight: 700 }}>GSTIN: {doc.customerGstin}</div>}
            {(!!doc.customerStateCode || !!doc.placeOfSupply) && (
              <div style={{ fontSize: 11, color: muted, marginTop: 3 }}>State: {formatStateDisplay(doc.customerStateCode || null, doc.placeOfSupply || null)}</div>
            )}
            {!!doc.customerMobile && <div style={{ fontSize: 11, color: muted, marginTop: 3 }}>Phone: {doc.customerMobile}</div>}
          </div>

          <div style={{ flex: 1, background: accentLight, borderRadius: 8, padding: '14px 16px', border: `1px solid ${border}` }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: accentMid, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Invoice Details</div>
            <KeyValue label="Invoice No." value={safeText(doc.invoiceNo) || safeText(doc.documentNumber)} />
            <KeyValueOptional label="Date" value={doc.date} />
            <KeyValueOptional label="Due Date" value={doc.dueDate} />
            <KeyValueOptional label="Place of Supply" value={doc.placeOfSupply} />
            <KeyValueOptional label="Challan No." value={doc.challanNo} />
            <KeyValueOptional label="E-way Bill" value={doc.ewayBillNo} />
            <KeyValueOptional label="Vehicle No." value={doc.ewayBillVehicleNo} />
          </div>
        </div>

        {!!doc.deliveryAddress && (
          <div style={{ background: accentLight, borderRadius: 8, padding: '10px 16px', border: `1px solid ${border}`, marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: accentMid, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Ship To</div>
            <div style={{ fontSize: 11, color: muted }}>{formatInlineAddress(doc.deliveryAddress)}</div>
          </div>
        )}

        {/* ITEMS TABLE */}
        <div style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${border}` }}>
          <div style={{ display: 'flex', background: accent, color: '#FFFFFF', padding: '10px 12px', fontSize: 10, fontWeight: 900, letterSpacing: 0.5 }}>
            <div style={{ width: 36 }}>#</div>
            <div style={{ flex: 2 }}>Item / Description</div>
            <div style={{ width: 72, textAlign: 'right' }}>HSN/SAC</div>
            <div style={{ width: 56, textAlign: 'right' }}>Qty</div>
            <div style={{ width: 88, textAlign: 'right' }}>Rate</div>
            <div style={{ width: 64, textAlign: 'right' }}>GST%</div>
            <div style={{ width: 96, textAlign: 'right' }}>Amount</div>
          </div>

          {(doc.items || []).map((it, idx) => {
            const c = lineComputed(it);
            return (
              <div key={idx} style={{ display: 'flex', padding: '9px 12px', borderTop: `1px solid ${border}`, fontSize: 11, background: idx % 2 === 0 ? '#FFFFFF' : accentLight, alignItems: 'flex-start' }}>
                <div style={{ width: 36, color: muted, paddingTop: 1 }}>{idx + 1}</div>
                <div style={{ flex: 2, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, color: '#111827' }}>{safeText(it?.name)}</div>
                  {!!it?.description && <div style={{ fontSize: 10, color: muted, marginTop: 2, whiteSpace: 'pre-line' }}>{it.description}</div>}
                  {!!it?.sku && <div style={{ fontSize: 10, color: muted }}>SKU: {it.sku}</div>}
                </div>
                <div style={{ width: 72, textAlign: 'right', color: muted }}>{safeText(it?.hsnSac) || '—'}</div>
                <div style={{ width: 56, textAlign: 'right' }}>{c.qty}</div>
                <div style={{ width: 88, textAlign: 'right' }}><Money value={c.rate} /></div>
                <div style={{ width: 64, textAlign: 'right', color: muted }}>{c.taxPct > 0 ? `${c.taxPct}%` : '—'}</div>
                <div style={{ width: 96, textAlign: 'right', fontWeight: 900, color: accent }}><Money value={c.total} /></div>
              </div>
            );
          })}
        </div>

        {/* TOTALS + TAX + BANK */}
        <div style={{ display: 'flex', gap: 20, marginTop: 20, alignItems: 'flex-start' }}>
          {/* Left: bank + words */}
          <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: accentLight, borderRadius: 8, padding: '12px 14px', border: `1px solid ${border}` }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: accentMid, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Amount in Words</div>
              <div style={{ fontSize: 11, fontStyle: 'italic', color: '#111827', fontWeight: 700, lineHeight: 1.5 }}>{amountInWordsINR(grandTotal)}</div>
            </div>

            {(profile.bankName || (profile as any).accountNumber || doc.bankName || doc.bankAccountNumber) && (
              <div style={{ background: accentLight, borderRadius: 8, padding: '12px 14px', border: `1px solid ${border}` }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: accentMid, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Bank Details</div>
                <KeyValueOptional label="Bank" value={doc.bankName || profile.bankName} />
                <KeyValueOptional label="Account Holder" value={(doc as any).bankAccountHolderName || profile.businessName} />
                <KeyValueOptional label="Account No." value={doc.bankAccountNumber || (profile as any).accountNumber} />
                <KeyValueOptional label="IFSC" value={doc.bankIfsc || (profile as any).ifscCode} />
              </div>
            )}

            {(profile.upiId || doc.upiId) && (
              <div style={{ background: accentLight, borderRadius: 8, padding: '12px 14px', border: `1px solid ${border}` }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: accentMid, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>UPI Payment</div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {!!doc.upiQrText && (
                    <img src={String(doc.upiQrText)} alt="UPI QR" style={{ width: 72, height: 72, borderRadius: 6, border: `1px solid ${border}`, background: '#fff', padding: 4 }} />
                  )}
                  <div style={{ fontSize: 11, fontWeight: 800, color: accent }}>{safeText(doc.upiId || profile.upiId)}</div>
                </div>
              </div>
            )}
          </div>

          {/* Right: summary */}
          <div style={{ flex: 1 }}>
            <div style={{ background: accentLight, borderRadius: 8, padding: '14px 16px', border: `1px solid ${border}` }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: accentMid, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Summary</div>
              <KeyValue label="Subtotal" value={<Money value={Number(doc.subtotal || 0)} />} />
              <KeyValue label="Total Tax" value={<Money value={taxes} />} />
              {Number(doc.transportCharges || 0) > 0 && <KeyValue label="Transport" value={<Money value={Number(doc.transportCharges)} />} />}
              {Number(doc.additionalCharges || 0) > 0 && <KeyValue label="Additional" value={<Money value={Number(doc.additionalCharges)} />} />}
              {Number(doc.roundOff || 0) !== 0 && <KeyValue label="Round Off" value={<Money value={Number(doc.roundOff)} />} />}

              {taxRows.length > 0 && (
                <div style={{ marginTop: 10, borderTop: `1px solid ${border}`, paddingTop: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 900, color: muted, marginBottom: 6 }}>Tax Breakdown</div>
                  {taxRows.map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, padding: '3px 0', color: muted }}>
                      <span>{r.kind} @ {r.rate}%</span>
                      <span style={{ fontWeight: 700 }}><Money value={r.tax} /></span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 12, borderTop: `2px solid ${accent}`, paddingTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900, color: accent }}>
                  <span>Grand Total</span>
                  <span><Money value={grandTotal} /></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TERMS */}
        {!!doc.termsConditions && (
          <div style={{ marginTop: 18, background: accentLight, borderRadius: 8, padding: '12px 14px', border: `1px solid ${border}` }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: accentMid, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Terms & Conditions</div>
            <div style={{ fontSize: 11, color: muted, whiteSpace: 'pre-line', lineHeight: 1.6 }}>{doc.termsConditions}</div>
          </div>
        )}

        {/* SIGNATURE + FOOTER */}
        <div style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ fontSize: 10, color: muted }}>Generated by BillVyapar</div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: accent }}>For {profile.businessName}</div>
            <div style={{ height: 36 }} />
            <div style={{ fontSize: 10, color: muted, borderTop: `1px solid ${border}`, paddingTop: 4, display: 'inline-block' }}>Authorized Signatory</div>
          </div>
        </div>
      </div>
    </TemplateFrame>
  );
}
