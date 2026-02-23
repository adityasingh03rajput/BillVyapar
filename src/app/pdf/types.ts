export type PdfTemplateId = 'classic' | 'modern' | 'minimal';

export type DocumentItem = {
  name: string;
  hsnSac?: string | null;
  quantity: number;
  unit?: string | null;
  rate: number;
  currency?: string;
  discount?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  total: number;
};

export type DocumentDto = {
  id: string;
  documentNumber: string;
  type: string;

  customerName?: string | null;
  customerAddress?: string | null;
  customerGstin?: string | null;
  date?: string | null;
  dueDate?: string | null;

  invoiceNo?: string | null;
  challanNo?: string | null;
  ewayBillNo?: string | null;
  transport?: string | null;
  transportId?: string | null;
  placeOfSupply?: string | null;

  bankName?: string | null;
  bankBranch?: string | null;
  bankAccountNumber?: string | null;
  bankIfsc?: string | null;
  upiId?: string | null;
  upiQrText?: string | null;

  items: DocumentItem[];

  transportCharges?: number;
  additionalCharges?: number;
  roundOff?: number;

  notes?: string | null;
  termsConditions?: string | null;

  paymentStatus?: string;
  paymentMode?: string | null;
  status?: string;

  currency?: string;

  itemsTotal?: number;
  subtotal?: number;
  grandTotal?: number;
  totalCgst?: number;
  totalSgst?: number;
  totalIgst?: number;
};

export type BusinessProfileDto = {
  id: string;
  businessName: string;
  ownerName: string;
  gstin?: string | null;
  pan?: string | null;
  email?: string | null;
  phone?: string | null;
  billingAddress?: string | null;
  shippingAddress?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  ifscCode?: string | null;
  upiId?: string | null;
};

export type PdfTemplateProps = {
  doc: DocumentDto;
  profile: BusinessProfileDto;
};
