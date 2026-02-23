import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { AppLayout } from '../components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Plus, Search, User, Mail, Phone, MapPin, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/api';
import { toast } from 'sonner';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  gstin?: string;
  pan?: string;
}

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<Customer>>({});
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Customer>>({});
  const [loading, setLoading] = useState(true);
  const [outstandingOpen, setOutstandingOpen] = useState(false);
  const [outstandingLoading, setOutstandingLoading] = useState(false);
  const [outstandingTotal, setOutstandingTotal] = useState(0);
  const [outstandingByCustomer, setOutstandingByCustomer] = useState<Array<{ customerName: string; amount: number }>>([]);
  const { accessToken, deviceId } = useAuth();
  const navigate = useNavigate();

  const apiUrl = API_URL;
  const currentProfile = JSON.parse(localStorage.getItem('currentProfile') || '{}');
  const profileId = currentProfile?.id;

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setFilteredCustomers(
        customers.filter(c =>
          c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.phone?.includes(searchTerm)
        )
      );
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchTerm, customers]);

  const loadCustomers = async () => {
    try {
      const response = await fetch(`${apiUrl}/customers`, {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'X-Device-ID': deviceId, 'X-Profile-ID': profileId },
      });
      const data = await response.json();
      if (!data.error) {
        setCustomers(data);
      }
    } catch (error) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const loadOutstanding = async () => {
    if (!accessToken) {
      toast.error('Not authenticated');
      return;
    }
    if (!profileId) {
      toast.error('Select a business profile first');
      return;
    }

    setOutstandingLoading(true);
    try {
      const res = await fetch(`${apiUrl}/payments/outstanding`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Device-ID': deviceId,
          'X-Profile-ID': profileId,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to load outstanding');
      }

      const docs: any[] = Array.isArray(data?.documents) ? data.documents : [];
      const grouped = new Map<string, number>();
      for (const d of docs) {
        const name = String(d?.customerName || 'Unknown');
        const remaining = Number(d?.remaining || 0);
        grouped.set(name, (grouped.get(name) || 0) + remaining);
      }

      const rows = Array.from(grouped.entries())
        .map(([customerName, amount]) => ({ customerName, amount }))
        .sort((a, b) => b.amount - a.amount);

      setOutstandingTotal(Number(data?.totalOutstanding || 0));
      setOutstandingByCustomer(rows);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load outstanding');
      setOutstandingOpen(false);
    } finally {
      setOutstandingLoading(false);
    }
  };

  useEffect(() => {
    if (outstandingOpen) {
      loadOutstanding();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outstandingOpen]);

  const handleEditClick = (customer: Customer) => {
    setEditingCustomerId(customer.id);
    setEditFormData({ ...customer });
    setShowEditDialog(true);
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingCustomerId) return;

    if (!editFormData.name?.trim()) {
      toast.error('Customer name is required');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/customers/${editingCustomerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Device-ID': deviceId,
          'X-Profile-ID': profileId,
        },
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success('Customer updated successfully!');
        setCustomers(prev => prev.map(c => (c.id === data.id ? data : c)));
        setShowEditDialog(false);
        setEditingCustomerId(null);
        setEditFormData({});
      }
    } catch {
      toast.error('Failed to update customer');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) {
      toast.error('Customer name is required');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Device-ID': deviceId,
          'X-Profile-ID': profileId,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success('Customer created successfully!');
        setCustomers([...customers, data]);
        setShowCreateDialog(false);
        setFormData({});
      }
    } catch (error) {
      toast.error('Failed to create customer');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading customers...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/suppliers')}
                aria-label="Go to Suppliers"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/suppliers')}
                aria-label="Go to Suppliers"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-gray-600 mt-1">Parties</p>
          </div>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <Button variant="outline" onClick={() => setOutstandingOpen(true)}>
              Outstanding
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Customer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Customer</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Customer Name *</Label>
                    <Input
                      required
                      value={formData.name || ''}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Enter name"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="customer@email.com"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+91 99999 99999"
                    />
                  </div>
                  <div>
                    <Label>GSTIN</Label>
                    <Input
                      value={formData.gstin || ''}
                      onChange={(e) => setFormData({...formData, gstin: e.target.value})}
                      placeholder="22AAAAA0000A1Z5"
                    />
                  </div>
                </div>
                <div>
                  <Label>PAN</Label>
                  <Input
                    value={formData.pan || ''}
                    onChange={(e) => setFormData({...formData, pan: e.target.value})}
                    placeholder="AAAAA0000A"
                  />
                </div>
                <div>
                  <Label>Address</Label>
                  <Textarea
                    value={formData.address || ''}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Enter customer address"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Customer</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <Dialog open={outstandingOpen} onOpenChange={setOutstandingOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Outstanding</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-md border p-4">
                <div className="text-sm text-gray-600">Total Outstanding</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(outstandingTotal)}</div>
              </div>

              {outstandingLoading ? (
                <div className="text-sm text-gray-600">Loading…</div>
              ) : outstandingByCustomer.length === 0 ? (
                <div className="text-sm text-gray-600">No outstanding invoices.</div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <div className="grid grid-cols-2 bg-gray-50 text-xs font-semibold text-gray-700 px-4 py-2">
                    <div>Customer</div>
                    <div className="text-right">Outstanding</div>
                  </div>
                  {outstandingByCustomer.map((r) => (
                    <div key={r.customerName} className="grid grid-cols-2 px-4 py-3 border-t text-sm">
                      <div className="font-medium text-gray-900 truncate">{r.customerName}</div>
                      <div className="text-right font-semibold">{formatCurrency(r.amount)}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setOutstandingOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search customers by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Customers Grid */}
        {filteredCustomers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {customers.length === 0 ? 'No customers yet' : 'No matching customers'}
              </h3>
              <p className="text-gray-600 mb-4">
                {customers.length === 0 
                  ? 'Add your first customer to get started'
                  : 'Try a different search term'}
              </p>
              {customers.length === 0 && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Customer
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.map((customer) => (
              <Card key={customer.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 justify-between">
                    <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{customer.name}</CardTitle>
                      {customer.gstin && (
                        <p className="text-xs text-gray-600 font-mono">{customer.gstin}</p>
                      )}
                    </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditClick(customer)}
                      className="text-gray-500 hover:text-gray-900"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {customer.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mt-0.5" />
                      <span className="line-clamp-2">{customer.address}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateCustomer} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Customer Name *</Label>
                  <Input
                    required
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    placeholder="Enter name"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={editFormData.email || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    placeholder="customer@email.com"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    placeholder="+91 99999 99999"
                  />
                </div>
                <div>
                  <Label>GSTIN</Label>
                  <Input
                    value={editFormData.gstin || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, gstin: e.target.value })}
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>
              </div>
              <div>
                <Label>PAN</Label>
                <Input
                  value={editFormData.pan || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, pan: e.target.value })}
                  placeholder="AAAAA0000A"
                />
              </div>
              <div>
                <Label>Address</Label>
                <Textarea
                  value={editFormData.address || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  placeholder="Enter customer address"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Summary */}
        {filteredCustomers.length > 0 && (
          <Card className="mt-6">
            <CardContent className="py-4">
              <p className="text-sm text-gray-600">
                Showing {filteredCustomers.length} of {customers.length} customers
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
