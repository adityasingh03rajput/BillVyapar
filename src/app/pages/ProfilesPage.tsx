import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Building2, LogOut, Edit } from 'lucide-react';
import { API_URL } from '../config/api';
import QRCode from 'qrcode';

interface BusinessProfile {
  id: string;
  businessName: string;
  ownerName: string;
  gstin?: string;
  pan?: string;
  email: string;
  phone: string;
  billingAddress?: string;
  shippingAddress?: string;
  bankName?: string;
  bankBranch?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  customFields?: Record<string, any>;
}

export function ProfilesPage() {
  const [profiles, setProfiles] = useState<BusinessProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<BusinessProfile>>({});
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<BusinessProfile>>({});
  const [upiQrDataUrl, setUpiQrDataUrl] = useState<string>('');
  const { user, accessToken, deviceId, signOut } = useAuth();
  const navigate = useNavigate();

  const apiUrl = API_URL;

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const response = await fetch(`${apiUrl}/profiles`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Device-ID': deviceId,
        },
      });
      const data = await response.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        setProfiles(data);
      }
    } catch (error) {
      toast.error('Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const buildUpiUri = (upiId?: string) => {
    const pa = String(upiId || '').trim();
    if (!pa) return '';
    const pn = String(editFormData.businessName || formData.businessName || '').trim();
    const params = new URLSearchParams();
    params.set('pa', pa);
    if (pn) params.set('pn', pn);
    params.set('cu', 'INR');
    params.set('tn', 'Payment via Hukum');
    return `upi://pay?${params.toString()}`;
  };

  useEffect(() => {
    const run = async () => {
      const uri = buildUpiUri(editFormData.upiId);
      if (!uri) {
        setUpiQrDataUrl('');
        return;
      }
      try {
        const url = await QRCode.toDataURL(uri, { margin: 1, width: 220 });
        setUpiQrDataUrl(url);
      } catch {
        setUpiQrDataUrl('');
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editFormData.upiId, editFormData.businessName]);

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${apiUrl}/profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Device-ID': deviceId,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success('Profile created successfully!');
        setProfiles([...profiles, data]);
        setShowCreateDialog(false);
        setFormData({});
      }
    } catch (error) {
      toast.error('Failed to create profile');
    }
  };

  const handleSelectProfile = (profile: BusinessProfile) => {
    const migrate = async () => {
      try {
        const key = `profileDataMigrated:${profile.id}`;
        if (!localStorage.getItem(key)) {
          const res = await fetch(`${apiUrl}/profiles/${profile.id}/migrate-data`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'X-Device-ID': deviceId,
            },
          });
          const data = await res.json();
          if (!data?.error) {
            localStorage.setItem(key, '1');
          }
        }
      } catch {
        // ignore
      }
    };

    localStorage.setItem('currentProfile', JSON.stringify(profile));
    migrate().finally(() => navigate('/dashboard'));
  };

  const handleEditClick = (profile: BusinessProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProfileId(profile.id);
    setEditFormData({ ...profile });
    setShowEditDialog(true);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingProfileId) return;

    try {
      const response = await fetch(`${apiUrl}/profiles/${editingProfileId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Device-ID': deviceId,
        },
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success('Profile updated successfully!');
      setProfiles(prev => prev.map(p => (p.id === data.id ? data : p)));

      const stored = localStorage.getItem('currentProfile');
      if (stored) {
        try {
          const current = JSON.parse(stored);
          if (current?.id === data.id) {
            localStorage.setItem('currentProfile', JSON.stringify(data));
          }
        } catch {
          // ignore
        }
      }

      setShowEditDialog(false);
      setEditingProfileId(null);
      setEditFormData({});
    } catch {
      toast.error('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Select Business Profile</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user?.name || user?.email}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Profiles Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {profiles.map((profile) => (
            <Card 
              key={profile.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleSelectProfile(profile)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Building2 className="h-10 w-10 text-blue-600" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleEditClick(profile, e)}
                    className="text-gray-500 hover:text-gray-900"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle className="mt-4">{profile.businessName}</CardTitle>
                <CardDescription>{profile.ownerName}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>{profile.email}</p>
                  <p>{profile.phone}</p>
                  {profile.gstin && <p className="font-mono text-xs">GSTIN: {profile.gstin}</p>}
                </div>
              </CardContent>
            </Card>
          ))}

          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Business Profile</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editBusinessName">Business Name *</Label>
                    <Input
                      id="editBusinessName"
                      required
                      value={editFormData.businessName || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, businessName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="editOwnerName">Owner Name *</Label>
                    <Input
                      id="editOwnerName"
                      required
                      value={editFormData.ownerName || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, ownerName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editEmail">Email *</Label>
                    <Input
                      id="editEmail"
                      type="email"
                      required
                      value={editFormData.email || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="editPhone">Phone *</Label>
                    <Input
                      id="editPhone"
                      required
                      value={editFormData.phone || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editGstin">GSTIN</Label>
                    <Input
                      id="editGstin"
                      value={editFormData.gstin || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, gstin: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="editPan">PAN</Label>
                    <Input
                      id="editPan"
                      value={editFormData.pan || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, pan: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="editBillingAddress">Billing Address</Label>
                  <Textarea
                    id="editBillingAddress"
                    value={editFormData.billingAddress || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, billingAddress: e.target.value })}
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="editShippingAddress">Shipping Address</Label>
                  <Textarea
                    id="editShippingAddress"
                    value={editFormData.shippingAddress || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, shippingAddress: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editBankName">Bank Name</Label>
                    <Input
                      id="editBankName"
                      value={editFormData.bankName || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, bankName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="editBankBranch">Branch</Label>
                    <Input
                      id="editBankBranch"
                      value={editFormData.bankBranch || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, bankBranch: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editAccountNumber">Account Number</Label>
                    <Input
                      id="editAccountNumber"
                      value={editFormData.accountNumber || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, accountNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="editIfscCode">IFSC Code</Label>
                    <Input
                      id="editIfscCode"
                      value={editFormData.ifscCode || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, ifscCode: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 items-start">
                  <div>
                    <Label htmlFor="editUpiId">UPI ID</Label>
                    <Input
                      id="editUpiId"
                      value={editFormData.upiId || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, upiId: e.target.value })}
                      placeholder="business@upi"
                    />
                    <p className="text-xs text-gray-500 mt-1">Use E.164 phone in signup; UPI ID here is for invoice payments.</p>
                  </div>
                  <div>
                    <Label>Payment QR</Label>
                    {upiQrDataUrl ? (
                      <div className="mt-2 rounded-md border bg-white p-3 w-fit">
                        <img src={upiQrDataUrl} alt="UPI QR" className="h-[160px] w-[160px]" />
                      </div>
                    ) : (
                      <div className="mt-2 text-sm text-gray-600">Enter UPI ID to preview QR</div>
                    )}
                  </div>
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

          {/* Create New Profile Card */}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow border-dashed border-2 flex items-center justify-center min-h-[250px]">
                <CardContent className="text-center py-12">
                  <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <CardTitle className="text-gray-600">Create New Profile</CardTitle>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Business Profile</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateProfile} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      required
                      value={formData.businessName || ''}
                      onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ownerName">Owner Name *</Label>
                    <Input
                      id="ownerName"
                      required
                      value={formData.ownerName || ''}
                      onChange={(e) => setFormData({...formData, ownerName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email || ''}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      required
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gstin">GSTIN</Label>
                    <Input
                      id="gstin"
                      value={formData.gstin || ''}
                      onChange={(e) => setFormData({...formData, gstin: e.target.value})}
                      placeholder="22AAAAA0000A1Z5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pan">PAN</Label>
                    <Input
                      id="pan"
                      value={formData.pan || ''}
                      onChange={(e) => setFormData({...formData, pan: e.target.value})}
                      placeholder="AAAAA0000A"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="billingAddress">Billing Address</Label>
                  <Textarea
                    id="billingAddress"
                    value={formData.billingAddress || ''}
                    onChange={(e) => setFormData({...formData, billingAddress: e.target.value})}
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="shippingAddress">Shipping Address</Label>
                  <Textarea
                    id="shippingAddress"
                    value={formData.shippingAddress || ''}
                    onChange={(e) => setFormData({...formData, shippingAddress: e.target.value})}
                    rows={2}
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      value={formData.bankName || ''}
                      onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankBranch">Branch</Label>
                    <Input
                      id="bankBranch"
                      value={formData.bankBranch || ''}
                      onChange={(e) => setFormData({...formData, bankBranch: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      value={formData.accountNumber || ''}
                      onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="ifscCode">IFSC Code</Label>
                  <Input
                    id="ifscCode"
                    value={formData.ifscCode || ''}
                    onChange={(e) => setFormData({...formData, ifscCode: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="upiId">UPI ID</Label>
                  <Input
                    id="upiId"
                    value={formData.upiId || ''}
                    onChange={(e) => setFormData({...formData, upiId: e.target.value})}
                    placeholder="business@upi"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Profile</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {profiles.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Business Profiles Yet</h3>
            <p className="text-gray-600 mb-4">Create your first business profile to get started</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Profile
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}