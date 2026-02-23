import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AppLayout } from '../components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible';
import { ChevronDown, ChevronUp, Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/api';
import { toast } from 'sonner';

type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

interface DocumentItem {
  name: string;
  hsnSac: string;
  quantity: number;
  unit: string;
  rate: number;
  currency: CurrencyCode;
  discount: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

interface PresetCustomer {
  id: string;
  name: string;
  address?: string;
  gstin?: string;
}

interface PresetItem {
  id: string;
  name: string;
  hsnSac?: string;
  unit: string;
  rate: number;
  discount?: number;
  cgst: number;
  sgst: number;
  igst: number;
}
type PaymentMode = 'cash' | 'cheque' | 'online';

export function CreateDocumentPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { accessToken, deviceId } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Document fields
  const [type, setType] = useState('invoice');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<DocumentItem[]>([{
    name: '',
    hsnSac: '',
    quantity: 1,
    unit: 'pcs',
    rate: 0,
    currency: 'INR',
    discount: 0,
    cgst: 9,
    sgst: 9,
    igst: 0,
    total: 0
  }]);
  const [transportCharges, setTransportCharges] = useState(0);
  const [additionalCharges, setAdditionalCharges] = useState(0);
  const [roundOff, setRoundOff] = useState(0);
  const [autoRoundOff, setAutoRoundOff] = useState(false);
  const [notes, setNotes] = useState('');
  const [termsConditions, setTermsConditions] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'unpaid' | 'paid'>('unpaid');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [status, setStatus] = useState<'draft' | 'final'>('draft');

  const [invoiceNo, setInvoiceNo] = useState('');
  const [challanNo, setChallanNo] = useState('');
  const [ewayBillNo, setEwayBillNo] = useState('');
  const [transport, setTransport] = useState('');
  const [transportId, setTransportId] = useState('');
  const [placeOfSupply, setPlaceOfSupply] = useState('');

  const [bankName, setBankName] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [upiId, setUpiId] = useState('');
  const [upiQrText, setUpiQrText] = useState('');

  const [presetCustomers, setPresetCustomers] = useState<PresetCustomer[]>([]);
  const [presetItems, setPresetItems] = useState<PresetItem[]>([]);

  const [partyKind, setPartyKind] = useState<'customer' | 'supplier'>('customer');

  const [expandedItemRows, setExpandedItemRows] = useState<Record<number, boolean>>({});

  const smoothPanTo = (el: HTMLElement | null | undefined) => {
    if (!el) return;
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {
      // no-op
    }
  };

  const apiUrl = API_URL;
  const currentProfile = JSON.parse(localStorage.getItem('currentProfile') || '{}');
  const profileId = currentProfile?.id;

  useEffect(() => {
    if (isEdit) {
      loadDocument();
    }
  }, [id]);

  useEffect(() => {
    if (type === 'purchase') {
      setPartyKind('supplier');
    }
  }, [type]);

  useEffect(() => {
    if (!accessToken || !deviceId || !profileId) return;
    void loadPresets();
  }, [accessToken, deviceId, profileId, type, partyKind]);

  const loadPresets = async () => {
    try {
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'X-Device-ID': deviceId,
        'X-Profile-ID': profileId,
      };

      const customersUrl = partyKind === 'supplier' ? `${apiUrl}/suppliers` : `${apiUrl}/customers`;
      const [customersRes, itemsRes] = await Promise.all([
        fetch(customersUrl, { headers }),
        fetch(`${apiUrl}/items`, { headers }),
      ]);

      const [customersData, itemsData] = await Promise.all([
        customersRes.json().catch(() => []),
        itemsRes.json().catch(() => []),
      ]);

      if (!customersData?.error && Array.isArray(customersData)) {
        setPresetCustomers(customersData);
      }
      if (!itemsData?.error && Array.isArray(itemsData)) {
        setPresetItems(itemsData);
      }
    } catch {
      // Non-blocking: page still works with manual input.
    }
  };

  const loadDocument = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/documents`, {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'X-Device-ID': deviceId, 'X-Profile-ID': profileId },
      });
      const allDocs = await response.json();
      const doc = allDocs.find((d: any) => d.id === id);

      if (doc) {
        setType(doc.type);
        setCustomerName(doc.customerName || '');
        setCustomerAddress(doc.customerAddress || '');
        setCustomerGstin(doc.customerGstin || '');
        setDate(doc.date || '');
        setDueDate(doc.dueDate || '');

        const fallbackCurrency: CurrencyCode = (doc.currency as CurrencyCode) || 'INR';
        setItems(
          (doc.items || []).map((it: any) => ({
            ...it,
            currency: (it.currency as CurrencyCode) || fallbackCurrency,
          }))
        );

        setInvoiceNo(doc.invoiceNo || '');
        setChallanNo(doc.challanNo || '');
        setEwayBillNo(doc.ewayBillNo || '');
        setTransport(doc.transport || '');
        setTransportId(doc.transportId || '');
        setPlaceOfSupply(doc.placeOfSupply || '');

        setBankName(doc.bankName || '');
        setBankBranch(doc.bankBranch || '');
        setBankAccountNumber(doc.bankAccountNumber || '');
        setBankIfsc(doc.bankIfsc || '');
        setUpiId(doc.upiId || '');
        setUpiQrText(doc.upiQrText || '');

        setTransportCharges(doc.transportCharges || 0);
        setAdditionalCharges(doc.additionalCharges || 0);
        setRoundOff(doc.roundOff || 0);
        setNotes(doc.notes || '');
        setTermsConditions(doc.termsConditions || '');
        setPaymentStatus(doc.paymentStatus || 'unpaid');
        setPaymentMode((doc.paymentMode as PaymentMode) || 'cash');
        setStatus(doc.status || 'draft');
      }
    } catch (error) {
      toast.error('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const calculateItemTotal = (item: DocumentItem) => {
    const subtotal = item.quantity * item.rate;
    const discountAmount = (subtotal * item.discount) / 100;
    const taxableAmount = subtotal - discountAmount;
    const cgstAmount = (taxableAmount * item.cgst) / 100;
    const sgstAmount = (taxableAmount * item.sgst) / 100;
    const igstAmount = (taxableAmount * item.igst) / 100;
    return taxableAmount + cgstAmount + sgstAmount + igstAmount;
  };

  const updateItem = (index: number, field: keyof DocumentItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    newItems[index].total = calculateItemTotal(newItems[index]);
    setItems(newItems);
  };

  const tryApplyPresetCustomer = (name: string) => {
    const found = presetCustomers.find(c => (c.name || '').toLowerCase() === name.toLowerCase());
    if (!found) return;
    setCustomerName(found.name || '');
    setCustomerAddress(found.address || '');
    setCustomerGstin(found.gstin || '');
  };

  const tryApplyPresetItem = (index: number, name: string) => {
    const found = presetItems.find(i => (i.name || '').toLowerCase() === name.toLowerCase());
    if (!found) return;

    const newItems = [...items];
    const prev = newItems[index];
    newItems[index] = {
      ...prev,
      name: found.name,
      hsnSac: found.hsnSac || '',
      unit: found.unit || prev.unit,
      rate: typeof found.rate === 'number' ? found.rate : prev.rate,
      discount: typeof found.discount === 'number' ? found.discount : prev.discount,
      cgst: typeof found.cgst === 'number' ? found.cgst : prev.cgst,
      sgst: typeof found.sgst === 'number' ? found.sgst : prev.sgst,
      igst: typeof found.igst === 'number' ? found.igst : prev.igst,
    };
    newItems[index].total = calculateItemTotal(newItems[index]);
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, {
      name: '',
      hsnSac: '',
      quantity: 1,
      unit: 'pcs',
      rate: 0,
      currency: 'INR',
      discount: 0,
      cgst: 9,
      sgst: 9,
      igst: 0,
      total: 0
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
      return;
    }

    setItems([
      {
        name: '',
        hsnSac: '',
        quantity: 1,
        unit: 'pcs',
        rate: 0,
        currency: 'INR',
        discount: 0,
        cgst: 9,
        sgst: 9,
        igst: 0,
        total: 0,
      },
    ]);
  };

  const calculateTotals = () => {
    const itemsTotal = items.reduce((sum, item) => sum + item.total, 0);
    const subtotal = itemsTotal + transportCharges + additionalCharges;
    const grandTotal = subtotal + roundOff;
    
    const totalCgst = items.reduce((sum, item) => {
      const taxableAmount = (item.quantity * item.rate) - ((item.quantity * item.rate * item.discount) / 100);
      return sum + (taxableAmount * item.cgst) / 100;
    }, 0);
    
    const totalSgst = items.reduce((sum, item) => {
      const taxableAmount = (item.quantity * item.rate) - ((item.quantity * item.rate * item.discount) / 100);
      return sum + (taxableAmount * item.sgst) / 100;
    }, 0);
    const totalIgst = items.reduce((sum, item) => {
      const taxableAmount = (item.quantity * item.rate) - ((item.quantity * item.rate * item.discount) / 100);
      return sum + (taxableAmount * item.igst) / 100;
    }, 0);

    return { itemsTotal, subtotal, grandTotal, totalCgst, totalSgst, totalIgst };
  };

  useEffect(() => {
    if (!autoRoundOff) return;
    const { subtotal } = calculateTotals();
    const rounded = Math.round(subtotal);
    const next = parseFloat((rounded - subtotal).toFixed(2));
    setRoundOff(next);
  }, [autoRoundOff, items, transportCharges, additionalCharges]);
  const shouldShowPaymentMode =
    type === 'proforma' || type === 'order' || type === 'billing' || type === 'challan';

  const partyLabel = partyKind === 'supplier' ? 'Supplier' : 'Customer';

  const handleSave = async () => {
    if (!customerName.trim()) {
      toast.error('Customer name is required');
      return;
    }

    if (items.some(item => !item.name.trim())) {
      toast.error('All items must have a name');
      return;
    }

    setSaving(true);
    try {
      const totals = calculateTotals();
      const documentData = {
        type,
        customerName,
        customerAddress,
        customerGstin,
        date,
        dueDate,

        invoiceNo,
        challanNo,
        ewayBillNo,
        transport,
        transportId,
        placeOfSupply,

        bankName,
        bankBranch,
        bankAccountNumber,
        bankIfsc,
        upiId,
        upiQrText,

        items,
        transportCharges,
        additionalCharges,
        roundOff,
        notes,
        termsConditions,
        paymentStatus,
        paymentMode: shouldShowPaymentMode ? paymentMode : null,
        status,
        ...totals
      };

      const url = isEdit 
        ? `${apiUrl}/documents/${id}`
        : `${apiUrl}/documents`;
      
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Device-ID': deviceId,
          'X-Profile-ID': profileId,
        },
        body: JSON.stringify(documentData),
      });

      const data = await response.json();
      
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success(isEdit ? 'Document updated!' : 'Document created!');
        navigate('/documents');
      }
    } catch (error) {
      toast.error('Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const totals = calculateTotals();

  const currencySymbol = (code: CurrencyCode) => {
    switch (code) {
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      case 'GBP':
        return '£';
      case 'INR':
      default:
        return '₹';
    }
  };

  const primaryCurrency: CurrencyCode = items[0]?.currency || 'INR';
  const primarySymbol = currencySymbol(primaryCurrency);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading document...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="rounded-xl border bg-gradient-to-r from-blue-50 to-indigo-50 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="neon-target neon-hover transition-all hover:border-blue-200 hover:text-blue-600"
                onClick={() => navigate('/documents')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {isEdit ? 'Edit Document' : 'Create Document'}
                </h1>
                <p className="text-gray-600 mt-1">Fill in the details below</p>
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              data-tour-id="cta-save-document"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Document'}
            </Button>
          </div>
        </div>

        {/* Document Type & Status */}
        <Card className="mb-6">
          <CardHeader className="border-b bg-slate-50/60">
            <CardTitle>Document Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <Label>Document Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quotation">Quotation</SelectItem>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="purchase">Purchase Invoice</SelectItem>
                    <SelectItem value="order">Order</SelectItem>
                    <SelectItem value="proforma">Proforma Invoice</SelectItem>
                    <SelectItem value="challan">Delivery Challan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader className="border-b bg-slate-50/60">
            <CardTitle>More Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="document-details">
                <AccordionTrigger
                  onClick={(e) => {
                    const target = e.currentTarget as unknown as HTMLElement;
                    window.setTimeout(() => smoothPanTo(target), 50);
                  }}
                  className="neon-target neon-hover transition-all hover:text-blue-600"
                >
                  Document Details
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label>Invoice No</Label>
                      <Input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
                    </div>
                    <div>
                      <Label>Challan No</Label>
                      <Input value={challanNo} onChange={(e) => setChallanNo(e.target.value)} />
                    </div>
                    <div>
                      <Label>E-way Bill No</Label>
                      <Input value={ewayBillNo} onChange={(e) => setEwayBillNo(e.target.value)} />
                    </div>
                  </div>

                  <div className="mt-4 grid md:grid-cols-3 gap-4">
                    <div>
                      <Label>Transport</Label>
                      <Input value={transport} onChange={(e) => setTransport(e.target.value)} />
                    </div>
                    <div>
                      <Label>Transport ID</Label>
                      <Input value={transportId} onChange={(e) => setTransportId(e.target.value)} />
                    </div>
                    <div>
                      <Label>Place of Supply</Label>
                      <Input value={placeOfSupply} onChange={(e) => setPlaceOfSupply(e.target.value)} />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="bank-upi-details">
                <AccordionTrigger
                  onClick={(e) => {
                    const target = e.currentTarget as unknown as HTMLElement;
                    window.setTimeout(() => smoothPanTo(target), 50);
                  }}
                  className="neon-target neon-hover transition-all hover:text-blue-600"
                >
                  Bank / UPI Details
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Bank Name</Label>
                      <Input value={bankName} onChange={(e) => setBankName(e.target.value)} />
                    </div>
                    <div>
                      <Label>Branch</Label>
                      <Input value={bankBranch} onChange={(e) => setBankBranch(e.target.value)} />
                    </div>
                  </div>
                  <div className="mt-4 grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Account Number</Label>
                      <Input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} />
                    </div>
                    <div>
                      <Label>IFSC</Label>
                      <Input value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value)} />
                    </div>
                  </div>
                  <div className="mt-4 grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>UPI ID</Label>
                      <Input value={upiId} onChange={(e) => setUpiId(e.target.value)} />
                    </div>
                    <div>
                      <Label>UPI QR Text</Label>
                      <Input value={upiQrText} onChange={(e) => setUpiQrText(e.target.value)} />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Customer / Supplier Details */}
        <Card className="mb-6">
          <CardHeader className="border-b bg-slate-50/60">
            <div className="flex items-center justify-between gap-3">
              <CardTitle>{partyLabel} Details</CardTitle>
              <div
                className="relative inline-flex items-center rounded-full bg-slate-100 p-1 text-xs"
                role="tablist"
                aria-label="Party type"
              >
                <div
                  className={`absolute top-1 bottom-1 left-1 w-1/2 rounded-full bg-white shadow-sm ring-1 ring-slate-200 transition-transform duration-200 ease-out ${
                    partyKind === 'supplier' ? 'translate-x-full' : 'translate-x-0'
                  }`}
                  aria-hidden
                />
                <button
                  type="button"
                  className={`relative z-10 w-24 select-none rounded-full px-3 py-1.5 font-medium transition-colors duration-200 ${
                    partyKind === 'customer' ? 'text-slate-900' : 'text-slate-600'
                  }`}
                  onClick={() => setPartyKind('customer')}
                  role="tab"
                  aria-selected={partyKind === 'customer'}
                >
                  Customer
                </button>
                <button
                  type="button"
                  className={`relative z-10 w-24 select-none rounded-full px-3 py-1.5 font-medium transition-colors duration-200 ${
                    partyKind === 'supplier' ? 'text-slate-900' : 'text-slate-600'
                  }`}
                  onClick={() => setPartyKind('supplier')}
                  role="tab"
                  aria-selected={partyKind === 'supplier'}
                >
                  Supplier
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{partyLabel} Name *</Label>
              <Input
                value={customerName}
                onChange={(e) => {
                  const next = e.target.value;
                  setCustomerName(next);
                  tryApplyPresetCustomer(next);
                }}
                placeholder={`Enter ${partyLabel.toLowerCase()} name`}
                list="customer-presets"
              />
              <datalist id="customer-presets">
                {presetCustomers.map(c => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>
            <div>
              <Label>{partyLabel} Address</Label>
              <Textarea
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder={`Enter ${partyLabel.toLowerCase()} address`}
                rows={2}
              />
            </div>
            <div>
              <Label>{partyLabel} GSTIN</Label>
              <Input
                value={customerGstin}
                onChange={(e) => setCustomerGstin(e.target.value)}
                placeholder="22AAAAA0000A1Z5"
              />
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Items</CardTitle>
            <Button onClick={addItem} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {items.map((item, index) => {
                const isOpen = !!expandedItemRows[index];
                return (
                  <Collapsible
                    key={index}
                    open={isOpen}
                    onOpenChange={(open) => {
                      setExpandedItemRows((prev) => ({ ...prev, [index]: open }));
                      if (open) {
                        const root = document.getElementById(`doc-item-${index}`);
                        window.setTimeout(() => smoothPanTo(root), 50);
                      }
                    }}
                    className="rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div id={`doc-item-${index}`} className="p-3">
                      <div className="grid grid-cols-12 gap-3 items-center">
                        <div className="col-span-5">
                          <Label className="text-xs text-gray-600">Product/Service</Label>
                          <Input
                            value={item.name}
                            onChange={(e) => {
                              const next = e.target.value;
                              updateItem(index, 'name', next);
                              tryApplyPresetItem(index, next);
                            }}
                            placeholder="Item name"
                            list={`item-presets-${index}`}
                          />
                          <datalist id={`item-presets-${index}`}>
                            {presetItems.map(i => (
                              <option key={i.id} value={i.name} />
                            ))}
                          </datalist>
                        </div>

                        <div className="col-span-2">
                          <Label className="text-xs text-gray-600">Qty</Label>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            min="0"
                          />
                        </div>

                        <div className="col-span-3">
                          <Label className="text-xs text-gray-600">Rate</Label>
                          <div className="flex items-center">
                            <Input
                              className="rounded-r-none"
                              type="number"
                              value={item.rate}
                              onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                            />
                            <Select
                              value={item.currency}
                              onValueChange={(v) => updateItem(index, 'currency', v as CurrencyCode)}
                            >
                              <SelectTrigger className="w-[76px] rounded-l-none border-l-0 px-2">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="INR">₹</SelectItem>
                                <SelectItem value="USD">$</SelectItem>
                                <SelectItem value="EUR">€</SelectItem>
                                <SelectItem value="GBP">£</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="col-span-1 text-right">
                          <div className="text-xs text-gray-600">Total</div>
                          <div className="font-semibold text-blue-700">
                            {currencySymbol(item.currency)}{item.total.toFixed(2)}
                          </div>
                        </div>

                        <div className="col-span-1 flex justify-end gap-1">
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="icon" className="neon-target neon-hover transition-all hover:text-blue-600">
                              {isOpen ? (
                                <ChevronUp className={`h-4 w-4 transition-all`} />
                              ) : (
                                <ChevronDown className={`h-4 w-4 transition-all`} />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                            className="neon-target neon-hover transition-all"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>

                      <CollapsibleContent>
                        <div className="mt-4 grid grid-cols-12 gap-3 rounded-md bg-slate-50/70 p-3 transition-all duration-300 ease-out">
                          <div className="col-span-3">
                            <Label className="text-xs text-gray-600">HSN/SAC</Label>
                            <Input
                              value={item.hsnSac}
                              onChange={(e) => updateItem(index, 'hsnSac', e.target.value)}
                              placeholder="HSN"
                            />
                          </div>

                          <div className="col-span-2">
                            <Label className="text-xs text-gray-600">Unit</Label>
                            <Select value={item.unit} onValueChange={(v) => updateItem(index, 'unit', v)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pcs">Pcs</SelectItem>
                                <SelectItem value="kg">Kg</SelectItem>
                                <SelectItem value="ltr">Ltr</SelectItem>
                                <SelectItem value="box">Box</SelectItem>
                                <SelectItem value="hrs">Hrs</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="col-span-2">
                            <Label className="text-xs text-gray-600">Disc%</Label>
                            <Input
                              type="number"
                              value={item.discount}
                              onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                              min="0"
                              max="100"
                            />
                          </div>

                          <div className="col-span-5">
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <Label className="text-xs text-gray-600">CGST%</Label>
                                <Input
                                  type="number"
                                  value={item.cgst}
                                  onChange={(e) => updateItem(index, 'cgst', parseFloat(e.target.value) || 0)}
                                  min="0"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-600">SGST%</Label>
                                <Input
                                  type="number"
                                  value={item.sgst}
                                  onChange={(e) => updateItem(index, 'sgst', parseFloat(e.target.value) || 0)}
                                  min="0"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-600">IGST%</Label>
                                <Input
                                  type="number"
                                  value={item.igst}
                                  onChange={(e) => updateItem(index, 'igst', parseFloat(e.target.value) || 0)}
                                  min="0"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Transport Charges</Label>
                <Input
                  type="number"
                  value={transportCharges}
                  onChange={(e) => setTransportCharges(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <Label>Additional Charges</Label>
                <Input
                  type="number"
                  value={additionalCharges}
                  onChange={(e) => setAdditionalCharges(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <Label>Round Off</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={roundOff}
                    onChange={(e) => setRoundOff(parseFloat(e.target.value) || 0)}
                    step="0.01"
                    disabled={autoRoundOff}
                  />
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <Switch checked={autoRoundOff} onCheckedChange={setAutoRoundOff} />
                    <span className="text-sm text-gray-600">Auto</span>
                  </div>
                </div>
              </div>
              <div>
                <Label>Payment Status</Label>
                <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {shouldShowPaymentMode && (
                <div>
                  <Label>Mode of Payment</Label>
                  <Select value={paymentMode} onValueChange={(v) => setPaymentMode(v as PaymentMode)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="online">Online Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Internal notes..."
                  rows={2}
                />
              </div>
              <div>
                <Label>Terms & Conditions</Label>
                <Textarea
                  value={termsConditions}
                  onChange={(e) => setTermsConditions(e.target.value)}
                  placeholder="Payment terms, warranty, etc..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Items Total:</span>
                <span className="font-semibold">{primarySymbol}{totals.itemsTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total CGST:</span>
                <span className="font-semibold">{primarySymbol}{totals.totalCgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total SGST:</span>
                <span className="font-semibold">{primarySymbol}{totals.totalSgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total IGST:</span>
                <span className="font-semibold">{primarySymbol}{totals.totalIgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Transport Charges:</span>
                <span className="font-semibold">{primarySymbol}{transportCharges.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Additional Charges:</span>
                <span className="font-semibold">{primarySymbol}{additionalCharges.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Round Off:</span>
                <span className="font-semibold">{primarySymbol}{roundOff.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="text-lg font-bold">Grand Total:</span>
                <span className="text-lg font-bold text-blue-600">{primarySymbol}{totals.grandTotal.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate('/documents')}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Document'}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
