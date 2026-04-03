import React from 'react';
import type { PdfTemplateProps } from '../types';
import { amountInWordsINR, displaySubtotal, safeText } from './TemplateFrame';

const BLUE = '#1a6fa8';
const BLUE_LIGHT = '#e8f4fb';
const BORDER = '#a8d4ed';

const cell: React.CSSProperties = {
  border: `1px solid ${BORDER}`,
  padding: '4px 6px',
  fontSize: 10,
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
  const subtotal = displaySubtotal(doc);
  const grandTotal = Number(doc.grandTotal || 0);
  const items = Array.isArray(doc.items) ? doc.items : [];
  const totalQty = items.reduce((s, it) => s + Number(it.quantity || 0), 0);

  const businessAddr = [
    profile.billingAddress,
  ].filter(Boolean).join(', ');

  const customerAddr = [doc.customerAddress, doc.placeOfSupply].filter(Boolean).join(', ');

  const docTitle = String(doc.type || '').toLowerCase() === 'purchase' ? 'PURCHASE INVOICE'
    : String(doc.type || '').toLowerCase() === 'quotation' ? 'QUOTATION'
    : String(doc.type || '').toLowerCase() === 'proforma' ? 'PROFORMA INVOICE'
    : 'TAX INVOICE';

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', background: '#fff', padding: '20px 24px', width: '100%', boxSizing: 'border-box', color: '#111' }}>

      {/* ── Header ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
        <tbody>
          <tr>
            <td style={{ verticalAlign: 'top', width: '55%' }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#111', marginBottom: 4 }}>{safeText(profile.businessName)}</div>
              {businessAddr && <div style={{ fontSize: 10, color: '#444', lineHeight: 1.5 }}>{businessAddr}</div>}
              {profile.gstin && <div style={{ fontSize: 10, color: '#444' }}>GSTIN: {profile.gstin}</div>}
            </td>
            <td style={{ verticalAlign: 'top', textAlign: 'right', fontSize: 10, color: '#444', lineHeight: 1.8 }}>
              {profile.businessName && <div><strong>Name</strong> : {safeText(profile.businessName)}</div>}
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
            <td style={{ textAlign: 'center', padding: '6px 0', fontSize: 14, fontWeight: 900, color: BLUE, letterSpacing: 1, width: '70%', borderRight: `1px solid ${BORDER}` }}>
              {docTitle}
            </td>
            <td style={{ textAlign: 'right', padding: '6px 10px', fontSize: 10, fontWeight: 700, color: '#555' }}>
              ORIGINAL FOR RECIPIENT
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── Customer + Invoice meta ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${BORDER}`, borderTop: 'none', marginBottom: 0 }}>
        <tbody>
          <tr>
            {/* Customer detail */}
            <td style={{ ...cell, width: '40%', borderRight: `1px solid ${BORDER}`, background: BLUE_LIGHT, fontWeight: 700, textAlign: 'center', padding: '4px 6px' }} colSpan={2}>
              Customer Detail
            </td>
            {/* Invoice meta */}
            <td style={{ ...cell, borderRight: `1px solid ${BORDER}` }}><strong>Invoice No.</strong></td>
            <td style={{ ...cell, borderRight: `1px solid ${BORDER}` }}>{safeText(doc.documentNumber || doc.invoiceNo)}</td>
            <td style={{ ...cell, borderRight: `1px solid ${BORDER}` }}><strong>Invoice Date</strong></td>
            <td style={{ ...cell }}>{fmtDate(doc.date)}</td>
          </tr>
          <tr>
            <td style={{ ...cell, fontWeight: 700, width: '12%', borderRight: `1px solid ${BORDER}` }}>Name</td>
            <td style={{ ...cell, width: '28%', borderRight: `1px solid ${BORDER}` }}>{safeText(doc.customerName)}</td>
            <td style={{ ...cell, borderRight: `1px solid ${BORDER}` }}><strong>Due Date</strong></td>
            <td style={{ ...cell, borderRight: `1px solid ${BORDER}` }} colSpan={3}>{fmtDate(doc.dueDate)}</td>
          </tr>
          <tr>
            <td style={{ ...cell, fontWeight: 700, borderRight: `1px solid ${BORDER}` }}>Address</td>
            <td style={{ ...cell, borderRight: `1px solid ${BORDER}` }}>{customerAddr || '-'}</td>
            <td style={{ ...cell, borderRight: `1px solid ${BORDER}` }} colSpan={4} />
          </tr>
          <tr>
            <td style={{ ...cell, fontWeight: 700, borderRight: `1px solid ${BORDER}` }}>Phone</td>
            <td style={{ ...cell, borderRight: `1px solid ${BORDER}` }}>{safeText(doc.customerMobile) || '-'}</td>
            <td style={{ ...cell, borderRight: `1px solid ${BORDER}` }} colSpan={4} />
          </tr>
          <tr>
            <td style={{ ...cell, fontWeight: 700, borderRight: `1px solid ${BORDER}` }}>GSTIN</td>
            <td style={{ ...cell, borderRight: `1px solid ${BORDER}` }}>{safeText(doc.customerGstin) || '-'}</td>
            <td style={{ ...cell, borderRight: `1px solid ${BORDER}` }} colSpan={4} />
          </tr>
          <tr>
            <td style={{ ...cell, fontWeight: 700, borderRight: `1px solid ${BORDER}` }}>Place of Supply</td>
            <td style={{ ...cell, borderRight: `1px solid ${BORDER}` }}>{safeText(doc.placeOfSupply) || '-'}</td>
            <td style={{ ...cell, borderRight: `1px solid ${BORDER}` }} colSpan={4} />
          </tr>
        </tbody>
      </table>

      {/* ── Items table ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${BORDER}`, borderTop: 'none', marginBottom: 0 }}>
        <thead>
          <tr>
            <th style={{ ...th, width: '5%', borderRight: `1px solid ${BORDER}` }}>Sr. No.</th>
            <th style={{ ...th, borderRight: `1px solid ${BORDER}` }}>Name of Product / Service</th>
            <th style={{ ...th, width: '10%', borderRight: `1px solid ${BORDER}` }}>HSN / SAC</th>
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
                  {it.description && <div style={{ fontSize: 9, color: '#666', fontWeight: 400 }}>{it.description}</div>}
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
          {/* Blank rows to fill space */}
          {items.length < 8 && Array.from({ length: Math.max(0, 8 - items.length) }).map((_, i) => (
            <tr key={`blank-${i}`} style={{ height: 22 }}>
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
          {/* Total row */}
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

      {/* ── Amount in words + Total ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${BORDER}`, borderTop: 'none', marginBottom: 0 }}>
        <tbody>
          <tr>
            <td style={{ ...cell, fontWeight: 700, width: '30%', borderRight: `1px solid ${BORDER}`, background: BLUE_LIGHT }}>Total in words</td>
            <td style={{ ...cell, borderRight: `1px solid ${BORDER}`, width: '30%' }} />
            <td style={{ ...cell, fontWeight: 700, borderRight: `1px solid ${BORDER}`, background: BLUE_LIGHT }}>Total Amount</td>
            <td style={{ ...cell, textAlign: 'right', fontWeight: 900, fontSize: 13 }}>₹{fmt(grandTotal)}</td>
          </tr>
          <tr>
            <td style={{ ...cell, fontStyle: 'italic', fontSize: 9, borderRight: `1px solid ${BORDER}` }} colSpan={2}>
              {amountInWordsINR(grandTotal).toUpperCase()}
            </td>
            <td style={{ ...cell, fontSize: 9, color: '#666', borderRight: `1px solid ${BORDER}` }} colSpan={2}>(E &amp; O.E.)</td>
          </tr>
        </tbody>
      </table>

      {/* ── Terms + Signatory ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${BORDER}`, borderTop: 'none' }}>
        <tbody>
          <tr>
            <td style={{ ...cell, fontWeight: 700, background: BLUE_LIGHT, borderRight: `1px solid ${BORDER}`, width: '50%' }}>Terms and Conditions</td>
            <td style={{ ...cell, fontSize: 9, color: '#555', textAlign: 'center' }}>
              Certified that the particulars given above are true and correct.
            </td>
          </tr>
          <tr>
            <td style={{ ...cell, fontSize: 9, color: '#444', lineHeight: 1.7, borderRight: `1px solid ${BORDER}`, verticalAlign: 'top', minHeight: 80 }}>
              {doc.termsConditions
                ? doc.termsConditions.split('\n').map((line, i) => <div key={i}>{line}</div>)
                : (
                  <>
                    <div>Subject to our home Jurisdiction.</div>
                    <div>Our Responsibility Ceases as soon as goods leaves our Premises.</div>
                    <div>Goods once sold will not taken back.</div>
                    <div>Delivery Ex-Premises.</div>
                  </>
                )}
            </td>
            <td style={{ ...cell, textAlign: 'center', fontWeight: 700, fontSize: 11, paddingTop: 8 }}>
              For {safeText(profile.businessName)}
              <div style={{ marginTop: 48, fontSize: 9, color: '#555', fontWeight: 400 }}>Authorised Signatory</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
