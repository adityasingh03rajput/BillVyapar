import React from 'react';
import type { PdfTemplateProps } from '../types';
import { amountInWordsINR, displaySubtotal, safeText, TemplateFrame } from './TemplateFrame';

const BLUE = '#1a6fa8';
const BLUE_LIGHT = '#e8f4fb';
const BORDER = '#a8d4ed';

const cell: React.CSSProperties = {
  border: `1px solid ${BORDER}`,
  padding: '3px 6px',
  fontSize: 9,
  color: '#111',
  verticalAlign: 'top',
};

const th: React.CSSProperties = {
  ...cell,
  background: BLUE_LIGHT,
  fontWeight: 700,
  textAlign: 'center',
  color: '#111',
};

function fmt(n: number) {
  return Number(n || 0).toFixed(2);
}

function fmtDate(s?: string | null) {
  if (!s) return '';
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
  } catch { return s; }
}

export function GstInvoiceTemplate({ doc, profile }: PdfTemplateProps) {
  const cgst = Number(doc.totalCgst || 0);
  const sgst = Number(doc.totalSgst || 0);
  const igst = Number(doc.totalIgst || 0);
  const taxes = cgst + sgst + igst;
  const grandTotal = Number(doc.grandTotal || 0);
  const items = Array.isArray(doc.items) ? doc.items : [];
  const totalQty = items.reduce((s, it) => s + Number(it.quantity || 0), 0);

  const businessAddr = [profile.billingAddress].filter(Boolean).join(', ');
  const customerAddr = [doc.customerAddress, doc.placeOfSupply].filter(Boolean).join(', ');

  const docTitle = String(doc.type || '').toLowerCase() === 'purchase' ? 'PURCHASE INVOICE'
    : String(doc.type || '').toLowerCase() === 'quotation' ? 'QUOTATION'
    : String(doc.type || '').toLowerCase() === 'proforma' ? 'PROFORMA INVOICE'
    : 'TAX INVOICE';

  return (
    <TemplateFrame>
      <div style={{ fontFamily: 'Arial, sans-serif', background: '#fff', padding: '10mm 12mm', width: '210mm', minHeight: '297mm', color: '#111', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* ── Header ── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 6 }}>
          <tbody>
            <tr>
              <td style={{ verticalAlign: 'top', width: '55%' }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#111', marginBottom: 2 }}>{safeText(profile.businessName)}</div>
                {businessAddr && <div style={{ fontSize: 9, color: '#444', lineHeight: 1.4 }}>{businessAddr}</div>}
                {profile.gstin && <div style={{ fontSize: 9, color: '#444' }}>GSTIN: {profile.gstin}</div>}
              </td>
              <td style={{ verticalAlign: 'top', textAlign: 'right', fontSize: 9, color: '#444', lineHeight: 1.6 }}>
                {profile.phone && <div><strong>Phone</strong> : {safeText(profile.phone)}</div>}
                {profile.email && <div><strong>Email</strong> : {safeText(profile.email)}</div>}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── Title bar ── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${BORDER}`, marginBottom: 0 }}>
          <tbody>
            <tr style={{ background: BLUE_LIGHT }}>
              <td style={{ textAlign: 'center', padding: '4px 0', fontSize: 12, fontWeight: 900, color: BLUE, letterSpacing: 1, width: '70%', borderRight: `1px solid ${BORDER}` }}>
                {docTitle}
              </td>
              <td style={{ textAlign: 'right', padding: '4px 8px', fontSize: 9, fontWeight: 700, color: '#555' }}>
                ORIGINAL FOR RECIPIENT
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── Customer + Invoice meta ── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${BORDER}`, borderTop: 'none', marginBottom: 0 }}>
          <tbody>
            <tr>
              <td style={{ ...cell, width: '40%', borderRight: `1px solid ${BORDER}`, background: BLUE_LIGHT, fontWeight: 700, textAlign: 'center' }} colSpan={2}>
                Customer Detail
              </td>
              <td style={{ ...cell, borderRight: `1px solid ${BORDER}` }}><strong>Invoice No.</strong></td>
              <td style={{ ...cell, borderRight: `1px solid ${BORDER}` }}>{safeText(doc.documentNumber || doc.invoiceNo)}</td>
              <td style={{ ...cell, borderRight: `1px solid ${BORDER}` }}><strong>Date</strong></td>
              <td style={{ ...cell }}>{fmtDate(doc.date)}</td>
            </tr>
            <tr>
              <td style={{ ...cell, fontWeight: 700, width: '12%', borderRight: `1px solid ${BORDER}` }}>Name</td>
              <td style={{ ...cell, width: '28%', borderRight: `1px solid ${BORDER}` }}>{safeText(doc.customerName)}</td>
              <td style={{ ...cell, borderRight: `1px solid ${BORDER}` }}><strong>Due Date</strong></td>
              <td style={{ ...cell, borderRight: `1px solid ${BORDER}` }} colSpan={3}>{fmtDate(doc.dueDate)}</td>
            </tr>
            <tr>
              <td style={{ ...cell, fontWeight: 700, borderRight: `1px solid ${BORDER}` }}>GSTIN</td>
              <td style={{ ...cell, borderRight: `1px solid ${BORDER}` }}>{safeText(doc.customerGstin) || '-'}</td>
              <td style={{ ...cell, borderRight: `1px solid ${BORDER}` }} colSpan={4}><strong>Address:</strong> {customerAddr || '-'}</td>
            </tr>
          </tbody>
        </table>

        {/* ── Items table ── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${BORDER}`, borderTop: 'none', marginBottom: 0, flex: 1 }}>
          <thead>
            <tr>
              <th style={{ ...th, width: '5%', borderRight: `1px solid ${BORDER}` }}>Sr.</th>
              <th style={{ ...th, borderRight: `1px solid ${BORDER}` }}>Product / Service</th>
              <th style={{ ...th, width: '10%', borderRight: `1px solid ${BORDER}` }}>HSN</th>
              <th style={{ ...th, width: '8%', borderRight: `1px solid ${BORDER}` }}>Qty</th>
              <th style={{ ...th, width: '10%', borderRight: `1px solid ${BORDER}` }}>Rate</th>
              {(cgst > 0 || sgst > 0) && <th style={{ ...th, width: '8%', borderRight: `1px solid ${BORDER}` }}>CGST</th>}
              {(cgst > 0 || sgst > 0) && <th style={{ ...th, width: '8%', borderRight: `1px solid ${BORDER}` }}>SGST</th>}
              {igst > 0 && <th style={{ ...th, width: '8%', borderRight: `1px solid ${BORDER}` }}>IGST</th>}
              <th style={{ ...th, width: '10%' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => {
              const gross = Number(it.quantity || 0) * Number(it.rate || 0);
              const discAmt = (gross * Number(it.discount || 0)) / 100;
              const taxable = gross - discAmt;
              const cgstAmt = (taxable * Number(it.cgst || 0)) / 100;
              const sgstAmt = (taxable * Number(it.sgst || 0)) / 100;
              const igstAmt = (taxable * Number(it.igst || 0)) / 100;
              return (
                <tr key={i}>
                  <td style={{ ...cell, textAlign: 'center', borderRight: `1px solid ${BORDER}` }}>{i + 1}</td>
                  <td style={{ ...cell, fontWeight: 600, borderRight: `1px solid ${BORDER}` }}>
                    {safeText(it.name)}
                    {it.description && <div style={{ fontSize: 8, color: '#666', fontWeight: 400 }}>{it.description}</div>}
                  </td>
                  <td style={{ ...cell, textAlign: 'center', borderRight: `1px solid ${BORDER}` }}>{safeText(it.hsnSac)}</td>
                  <td style={{ ...cell, textAlign: 'right', borderRight: `1px solid ${BORDER}` }}>{fmt(it.quantity)}</td>
                  <td style={{ ...cell, textAlign: 'right', borderRight: `1px solid ${BORDER}` }}>{fmt(it.rate)}</td>
                  {(cgst > 0 || sgst > 0) && <td style={{ ...cell, textAlign: 'right', borderRight: `1px solid ${BORDER}` }}>{cgstAmt > 0 ? fmt(cgstAmt) : '-'}</td>}
                  {(cgst > 0 || sgst > 0) && <td style={{ ...cell, textAlign: 'right', borderRight: `1px solid ${BORDER}` }}>{sgstAmt > 0 ? fmt(sgstAmt) : '-'}</td>}
                  {igst > 0 && <td style={{ ...cell, textAlign: 'right', borderRight: `1px solid ${BORDER}` }}>{igstAmt > 0 ? fmt(igstAmt) : '-'}</td>}
                  <td style={{ ...cell, textAlign: 'right' }}>{fmt(it.total)}</td>
                </tr>
              );
            })}
            {/* blank rows kept minimal to save vertical space */}
            {items.length < 5 && Array.from({ length: 5 - items.length }).map((_, i) => (
              <tr key={`blank-${i}`} style={{ height: 18 }}>
                <td style={{ ...cell, borderRight: `1px solid ${BORDER}` }} />
                <td style={{ ...cell, borderRight: `1px solid ${BORDER}` }} />
                <td style={{ ...cell, borderRight: `1px solid ${BORDER}` }} />
                <td style={{ ...cell, borderRight: `1px solid ${BORDER}` }} />
                <td style={{ ...cell, borderRight: `1px solid ${BORDER}` }} />
                {(cgst > 0 || sgst > 0) && <td style={{ ...cell, borderRight: `1px solid ${BORDER}` }} />}
                {(cgst > 0 || sgst > 0) && <td style={{ ...cell, borderRight: `1px solid ${BORDER}` }} />}
                {igst > 0 && <td style={{ ...cell, borderRight: `1px solid ${BORDER}` }} />}
                <td style={{ ...cell }} />
              </tr>
            ))}
            <tr style={{ background: BLUE_LIGHT }}>
              <td style={{ ...cell, textAlign: 'right', fontWeight: 700, borderRight: `1px solid ${BORDER}` }} colSpan={3}>Total</td>
              <td style={{ ...cell, textAlign: 'right', fontWeight: 700, borderRight: `1px solid ${BORDER}` }}>{fmt(totalQty)}</td>
              <td style={{ ...cell, borderRight: `1px solid ${BORDER}` }} />
              {(cgst > 0 || sgst > 0) && <td style={{ ...cell, textAlign: 'right', fontWeight: 700, borderRight: `1px solid ${BORDER}` }}>{fmt(cgst)}</td>}
              {(cgst > 0 || sgst > 0) && <td style={{ ...cell, textAlign: 'right', fontWeight: 700, borderRight: `1px solid ${BORDER}` }}>{fmt(sgst)}</td>}
              {igst > 0 && <td style={{ ...cell, textAlign: 'right', fontWeight: 700, borderRight: `1px solid ${BORDER}` }}>{fmt(igst)}</td>}
              <td style={{ ...cell, textAlign: 'right', fontWeight: 700 }}>{fmt(grandTotal)}</td>
            </tr>
          </tbody>
        </table>

        {/* ── Total in words ── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${BORDER}`, borderTop: 'none' }}>
          <tbody>
            <tr>
              <td style={{ ...cell, fontWeight: 700, width: '25%', background: BLUE_LIGHT, borderRight: `1px solid ${BORDER}` }}>Total in words</td>
              <td style={{ ...cell, fontSize: 8, fontStyle: 'italic', borderRight: `1px solid ${BORDER}` }}>{amountInWordsINR(grandTotal).toUpperCase()}</td>
              <td style={{ ...cell, width: '15%', fontWeight: 700, background: BLUE_LIGHT, borderRight: `1px solid ${BORDER}` }}>Grand Total</td>
              <td style={{ ...cell, textAlign: 'right', fontWeight: 900, fontSize: 12, width: '15%' }}>₹{fmt(grandTotal)}</td>
            </tr>
          </tbody>
        </table>

        {/* ── Bottom Section ── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${BORDER}`, borderTop: 'none' }}>
          <tbody>
            <tr>
              <td style={{ ...cell, borderRight: `1px solid ${BORDER}`, width: '50%', fontSize: 8 }}>
                <strong>Terms:</strong> {doc.termsConditions || 'Goods once sold will not be taken back.'}
              </td>
              <td style={{ ...cell, textAlign: 'center', height: 60, verticalAlign: 'bottom' }}>
                <div style={{ fontSize: 9 }}>For {safeText(profile.businessName)}</div>
                <div style={{ marginTop: 24, fontSize: 8, color: '#666' }}>Authorised Signatory</div>
              </td>
            </tr>
          </tbody>
        </table>
        <div style={{ textAlign: 'center', fontSize: 8, color: '#999', marginTop: 4 }}>Generated by BillVyapar</div>
      </div>
    </TemplateFrame>
  );
}
