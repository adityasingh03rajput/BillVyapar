// Seed data for demo account
export async function seedDemoData(apiUrl: string, accessToken: string, deviceId: string) {
  try {
    // Create demo business profile
    const profileResponse = await fetch(`${apiUrl}/profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Device-ID': deviceId,
      },
      body: JSON.stringify({
        businessName: 'Tech Solutions Pvt Ltd',
        ownerName: 'Rajesh Kumar',
        gstin: '29ABCDE1234F1Z5',
        pan: 'ABCDE1234F',
        email: 'rajesh@techsolutions.com',
        phone: '+91 98765 43210',
        billingAddress: '123, MG Road, Bangalore, Karnataka - 560001',
        shippingAddress: '123, MG Road, Bangalore, Karnataka - 560001',
        bankName: 'HDFC Bank',
        accountNumber: '50200012345678',
        ifscCode: 'HDFC0001234',
        upiId: 'techsolutions@upi',
      }),
    });
    const profile = await profileResponse.json();
    const profileId = profile?.id;
    
    // Create demo customers
    const customers = [
      {
        name: 'Acme Corporation',
        email: 'purchase@acmecorp.com',
        phone: '+91 99887 76655',
        address: '456, Brigade Road, Bangalore, Karnataka - 560025',
        gstin: '29ZYXWV9876E1Z5',
        pan: 'ZYXWV9876E',
      },
      {
        name: 'Global Traders Ltd',
        email: 'accounts@globaltraders.com',
        phone: '+91 98876 54321',
        address: '789, Commercial Street, Bangalore, Karnataka - 560001',
        gstin: '29MNOPQ5678D1Z5',
        pan: 'MNOPQ5678D',
      },
      {
        name: 'Metro Enterprises',
        email: 'info@metro.com',
        phone: '+91 97765 43210',
        address: '321, Church Street, Bangalore, Karnataka - 560001',
      },
    ];

    for (const customer of customers) {
      await fetch(`${apiUrl}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Device-ID': deviceId,
          'X-Profile-ID': profileId,
        },
        body: JSON.stringify(customer),
      });
    }

    // Create demo items
    const items = [
      {
        name: 'Web Development Service',
        hsnSac: '998314',
        unit: 'hrs',
        rate: 2500,
        cgst: 9,
        sgst: 9,
        igst: 0,
        description: 'Custom web development and consulting services',
      },
      {
        name: 'Mobile App Development',
        hsnSac: '998315',
        unit: 'hrs',
        rate: 3000,
        cgst: 9,
        sgst: 9,
        igst: 0,
        description: 'iOS and Android app development',
      },
      {
        name: 'Cloud Hosting Package',
        hsnSac: '998316',
        unit: 'month',
        rate: 5000,
        cgst: 9,
        sgst: 9,
        igst: 0,
        description: 'Managed cloud hosting with 99.9% uptime',
      },
      {
        name: 'SEO Optimization',
        hsnSac: '998317',
        unit: 'month',
        rate: 15000,
        cgst: 9,
        sgst: 9,
        igst: 0,
        description: 'Search engine optimization services',
      },
      {
        name: 'Digital Marketing Campaign',
        hsnSac: '998318',
        unit: 'project',
        rate: 25000,
        cgst: 9,
        sgst: 9,
        igst: 0,
        description: 'Complete digital marketing campaign management',
      },
    ];

    for (const item of items) {
      await fetch(`${apiUrl}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Device-ID': deviceId,
          'X-Profile-ID': profileId,
        },
        body: JSON.stringify(item),
      });
    }

    // Create demo documents
    const documents = [
      // Quotation
      {
        type: 'quotation',
        customerName: 'Acme Corporation',
        customerAddress: '456, Brigade Road, Bangalore, Karnataka - 560025',
        customerGstin: '29ZYXWV9876E1Z5',
        date: '2026-02-15',
        dueDate: '2026-02-28',
        items: [
          {
            name: 'Web Development Service',
            hsnSac: '998314',
            quantity: 80,
            unit: 'hrs',
            rate: 2500,
            discount: 10,
            cgst: 9,
            sgst: 9,
            igst: 0,
            total: 213840,
          },
          {
            name: 'Cloud Hosting Package',
            hsnSac: '998316',
            quantity: 3,
            unit: 'month',
            rate: 5000,
            discount: 0,
            cgst: 9,
            sgst: 9,
            igst: 0,
            total: 17700,
          },
        ],
        transportCharges: 0,
        additionalCharges: 0,
        roundOff: -40,
        notes: 'Thank you for your interest',
        termsConditions: 'Quote valid for 15 days. Payment terms: 50% advance, 50% on completion.',
        paymentStatus: 'unpaid',
        status: 'final',
        itemsTotal: 231540,
        subtotal: 231540,
        grandTotal: 231500,
      },
      // Invoice - Paid
      {
        type: 'invoice',
        customerName: 'Global Traders Ltd',
        customerAddress: '789, Commercial Street, Bangalore, Karnataka - 560001',
        customerGstin: '29MNOPQ5678D1Z5',
        date: '2026-02-10',
        dueDate: '2026-02-25',
        items: [
          {
            name: 'Mobile App Development',
            hsnSac: '998315',
            quantity: 120,
            unit: 'hrs',
            rate: 3000,
            discount: 5,
            cgst: 9,
            sgst: 9,
            igst: 0,
            total: 426780,
          },
        ],
        transportCharges: 0,
        additionalCharges: 2000,
        roundOff: -80,
        notes: 'Payment received - Thank you!',
        termsConditions: 'Payment due within 15 days.',
        paymentStatus: 'paid',
        status: 'final',
        itemsTotal: 426780,
        subtotal: 428780,
        grandTotal: 428700,
      },
      // Invoice - Unpaid
      {
        type: 'invoice',
        customerName: 'Metro Enterprises',
        customerAddress: '321, Church Street, Bangalore, Karnataka - 560001',
        date: '2026-02-18',
        dueDate: '2026-03-05',
        items: [
          {
            name: 'SEO Optimization',
            hsnSac: '998317',
            quantity: 2,
            unit: 'month',
            rate: 15000,
            discount: 0,
            cgst: 9,
            sgst: 9,
            igst: 0,
            total: 35400,
          },
          {
            name: 'Digital Marketing Campaign',
            hsnSac: '998318',
            quantity: 1,
            unit: 'project',
            rate: 25000,
            discount: 0,
            cgst: 9,
            sgst: 9,
            igst: 0,
            total: 29500,
          },
        ],
        transportCharges: 0,
        additionalCharges: 0,
        roundOff: 100,
        notes: 'Payment pending',
        termsConditions: 'Payment due within 15 days.',
        paymentStatus: 'unpaid',
        status: 'final',
        itemsTotal: 64900,
        subtotal: 64900,
        grandTotal: 65000,
      },
      // Order
      {
        type: 'order',
        customerName: 'Acme Corporation',
        customerAddress: '456, Brigade Road, Bangalore, Karnataka - 560025',
        customerGstin: '29ZYXWV9876E1Z5',
        date: '2026-02-20',
        dueDate: '2026-03-15',
        items: [
          {
            name: 'Web Development Service',
            hsnSac: '998314',
            quantity: 40,
            unit: 'hrs',
            rate: 2500,
            discount: 0,
            cgst: 9,
            sgst: 9,
            igst: 0,
            total: 118000,
          },
        ],
        transportCharges: 500,
        additionalCharges: 0,
        roundOff: 0,
        notes: 'Urgent delivery required',
        termsConditions: 'Delivery in 3 weeks',
        paymentStatus: 'unpaid',
        status: 'final',
        itemsTotal: 118000,
        subtotal: 118500,
        grandTotal: 118500,
      },
      // Proforma Invoice
      {
        type: 'proforma',
        customerName: 'Global Traders Ltd',
        customerAddress: '789, Commercial Street, Bangalore, Karnataka - 560001',
        customerGstin: '29MNOPQ5678D1Z5',
        date: '2026-02-22',
        items: [
          {
            name: 'Cloud Hosting Package',
            hsnSac: '998316',
            quantity: 12,
            unit: 'month',
            rate: 5000,
            discount: 15,
            cgst: 9,
            sgst: 9,
            igst: 0,
            total: 60180,
          },
        ],
        transportCharges: 0,
        additionalCharges: 0,
        roundOff: -80,
        notes: 'Annual subscription - Advance payment required',
        termsConditions: 'Full payment required before service activation',
        paymentStatus: 'unpaid',
        status: 'final',
        itemsTotal: 60180,
        subtotal: 60180,
        grandTotal: 60100,
      },
    ];

    for (const doc of documents) {
      await fetch(`${apiUrl}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Device-ID': deviceId,
          'X-Profile-ID': profileId,
        },
        body: JSON.stringify(doc),
      });
    }

    return { success: true, profile };
  } catch (error) {
    console.error('Failed to seed data:', error);
    return { success: false, error };
  }
}
