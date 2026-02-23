import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Create Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Helper function to verify user authentication
async function verifyAuth(request: Request) {
  const accessToken = request.headers.get('Authorization')?.split(' ')[1];
  if (!accessToken) {
    return { error: 'Unauthorized: No token provided', userId: null };
  }
  
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user?.id) {
    return { error: 'Unauthorized: Invalid token', userId: null };
  }
  
  return { error: null, userId: user.id };
}

// Health check endpoint
app.get("/make-server-3ab4c0e4/health", (c) => {
  return c.json({ status: "ok" });
});

// ========== AUTHENTICATION ROUTES ==========

// Sign up with email
app.post("/make-server-3ab4c0e4/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });
    
    if (error) {
      console.log(`Sign up error: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }
    
    // Create initial subscription (free trial)
    const subscriptionKey = `subscription:${data.user.id}`;
    const subscriptionData = {
      userId: data.user.id,
      plan: 'trial',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days trial
      active: true
    };
    await kv.set(subscriptionKey, subscriptionData);
    
    return c.json({ user: data.user, subscription: subscriptionData });
  } catch (error) {
    console.log(`Sign up error: ${error}`);
    return c.json({ error: 'Sign up failed' }, 500);
  }
});

// Sign in with email/password
app.post("/make-server-3ab4c0e4/auth/signin", async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );
    
    const { data, error } = await authClient.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.log(`Sign in error: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }
    
    // Store device session for single-device enforcement
    const deviceId = c.req.header('X-Device-ID') || 'web-' + Date.now();
    const sessionKey = `session:${data.user.id}`;
    await kv.set(sessionKey, { deviceId, lastActive: new Date().toISOString() });
    
    return c.json({ 
      session: data.session,
      user: data.user,
      deviceId
    });
  } catch (error) {
    console.log(`Sign in error: ${error}`);
    return c.json({ error: 'Sign in failed' }, 500);
  }
});

// Verify session (single-device check)
app.post("/make-server-3ab4c0e4/auth/verify-session", async (c) => {
  try {
    const { error, userId } = await verifyAuth(c.req.raw);
    if (error) {
      return c.json({ error }, 401);
    }
    
    const deviceId = c.req.header('X-Device-ID');
    const sessionKey = `session:${userId}`;
    const session = await kv.get(sessionKey);
    
    if (session && session.deviceId !== deviceId) {
      return c.json({ error: 'Session expired. Login detected from another device.' }, 403);
    }
    
    // Update last active
    await kv.set(sessionKey, { deviceId, lastActive: new Date().toISOString() });
    
    return c.json({ valid: true, userId });
  } catch (error) {
    console.log(`Session verification error: ${error}`);
    return c.json({ error: 'Verification failed' }, 500);
  }
});

// ========== BUSINESS PROFILE ROUTES ==========

// Create business profile
app.post("/make-server-3ab4c0e4/profiles", async (c) => {
  try {
    const { error, userId } = await verifyAuth(c.req.raw);
    if (error) return c.json({ error }, 401);
    
    const profileData = await c.req.json();
    const profileId = crypto.randomUUID();
    
    const profile = {
      id: profileId,
      userId,
      ...profileData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(`profile:${profileId}`, profile);
    
    // Add to user's profile list
    const userProfilesKey = `user-profiles:${userId}`;
    const userProfiles = await kv.get(userProfilesKey) || [];
    userProfiles.push(profileId);
    await kv.set(userProfilesKey, userProfiles);
    
    return c.json(profile);
  } catch (error) {
    console.log(`Create profile error: ${error}`);
    return c.json({ error: 'Failed to create profile' }, 500);
  }
});

// Get all profiles for user
app.get("/make-server-3ab4c0e4/profiles", async (c) => {
  try {
    const { error, userId } = await verifyAuth(c.req.raw);
    if (error) return c.json({ error }, 401);
    
    const userProfilesKey = `user-profiles:${userId}`;
    const profileIds = await kv.get(userProfilesKey) || [];
    
    const profiles = [];
    for (const profileId of profileIds) {
      const profile = await kv.get(`profile:${profileId}`);
      if (profile) profiles.push(profile);
    }
    
    return c.json(profiles);
  } catch (error) {
    console.log(`Get profiles error: ${error}`);
    return c.json({ error: 'Failed to get profiles' }, 500);
  }
});

// Update business profile
app.put("/make-server-3ab4c0e4/profiles/:id", async (c) => {
  try {
    const { error, userId } = await verifyAuth(c.req.raw);
    if (error) return c.json({ error }, 401);
    
    const profileId = c.req.param('id');
    const existingProfile = await kv.get(`profile:${profileId}`);
    
    if (!existingProfile || existingProfile.userId !== userId) {
      return c.json({ error: 'Profile not found' }, 404);
    }
    
    const updates = await c.req.json();
    const updatedProfile = {
      ...existingProfile,
      ...updates,
      id: profileId,
      userId,
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(`profile:${profileId}`, updatedProfile);
    return c.json(updatedProfile);
  } catch (error) {
    console.log(`Update profile error: ${error}`);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// ========== DOCUMENT ROUTES ==========

// Create document
app.post("/make-server-3ab4c0e4/documents", async (c) => {
  try {
    const { error, userId } = await verifyAuth(c.req.raw);
    if (error) return c.json({ error }, 401);
    
    // Check subscription
    const subscriptionKey = `subscription:${userId}`;
    const subscription = await kv.get(subscriptionKey);
    if (!subscription || new Date(subscription.endDate) < new Date()) {
      return c.json({ error: 'Subscription expired. Please renew to create documents.' }, 403);
    }
    
    const documentData = await c.req.json();
    const documentId = crypto.randomUUID();
    
    // Generate document number
    const counterKey = `doc-counter:${userId}:${documentData.type}`;
    let counter = await kv.get(counterKey) || 0;
    counter++;
    await kv.set(counterKey, counter);
    
    const documentNumber = `${documentData.type.toUpperCase()}-${String(counter).padStart(5, '0')}`;
    
    const document = {
      id: documentId,
      userId,
      documentNumber,
      ...documentData,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(`document:${documentId}`, document);
    
    // Add to user's document list
    const userDocsKey = `user-documents:${userId}`;
    const userDocs = await kv.get(userDocsKey) || [];
    userDocs.unshift(documentId);
    await kv.set(userDocsKey, userDocs);
    
    return c.json(document);
  } catch (error) {
    console.log(`Create document error: ${error}`);
    return c.json({ error: 'Failed to create document' }, 500);
  }
});

// Get all documents for user
app.get("/make-server-3ab4c0e4/documents", async (c) => {
  try {
    const { error, userId } = await verifyAuth(c.req.raw);
    if (error) return c.json({ error }, 401);
    
    const userDocsKey = `user-documents:${userId}`;
    const docIds = await kv.get(userDocsKey) || [];
    
    const documents = [];
    for (const docId of docIds) {
      const doc = await kv.get(`document:${docId}`);
      if (doc) documents.push(doc);
    }
    
    return c.json(documents);
  } catch (error) {
    console.log(`Get documents error: ${error}`);
    return c.json({ error: 'Failed to get documents' }, 500);
  }
});

// Update document
app.put("/make-server-3ab4c0e4/documents/:id", async (c) => {
  try {
    const { error, userId } = await verifyAuth(c.req.raw);
    if (error) return c.json({ error }, 401);
    
    // Check subscription
    const subscriptionKey = `subscription:${userId}`;
    const subscription = await kv.get(subscriptionKey);
    if (!subscription || new Date(subscription.endDate) < new Date()) {
      return c.json({ error: 'Subscription expired. Please renew to edit documents.' }, 403);
    }
    
    const documentId = c.req.param('id');
    const existingDoc = await kv.get(`document:${documentId}`);
    
    if (!existingDoc || existingDoc.userId !== userId) {
      return c.json({ error: 'Document not found' }, 404);
    }
    
    const updates = await c.req.json();
    const updatedDoc = {
      ...existingDoc,
      ...updates,
      id: documentId,
      userId,
      version: existingDoc.version + 1,
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(`document:${documentId}`, updatedDoc);
    return c.json(updatedDoc);
  } catch (error) {
    console.log(`Update document error: ${error}`);
    return c.json({ error: 'Failed to update document' }, 500);
  }
});

// Duplicate document
app.post("/make-server-3ab4c0e4/documents/:id/duplicate", async (c) => {
  try {
    const { error, userId } = await verifyAuth(c.req.raw);
    if (error) return c.json({ error }, 401);
    
    // Check subscription
    const subscriptionKey = `subscription:${userId}`;
    const subscription = await kv.get(subscriptionKey);
    if (!subscription || new Date(subscription.endDate) < new Date()) {
      return c.json({ error: 'Subscription expired. Please renew to duplicate documents.' }, 403);
    }
    
    const documentId = c.req.param('id');
    const existingDoc = await kv.get(`document:${documentId}`);
    
    if (!existingDoc || existingDoc.userId !== userId) {
      return c.json({ error: 'Document not found' }, 404);
    }
    
    const newDocId = crypto.randomUUID();
    
    // Generate new document number
    const counterKey = `doc-counter:${userId}:${existingDoc.type}`;
    let counter = await kv.get(counterKey) || 0;
    counter++;
    await kv.set(counterKey, counter);
    
    const documentNumber = `${existingDoc.type.toUpperCase()}-${String(counter).padStart(5, '0')}`;
    
    const newDoc = {
      ...existingDoc,
      id: newDocId,
      documentNumber,
      status: 'draft',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(`document:${newDocId}`, newDoc);
    
    // Add to user's document list
    const userDocsKey = `user-documents:${userId}`;
    const userDocs = await kv.get(userDocsKey) || [];
    userDocs.unshift(newDocId);
    await kv.set(userDocsKey, userDocs);
    
    return c.json(newDoc);
  } catch (error) {
    console.log(`Duplicate document error: ${error}`);
    return c.json({ error: 'Failed to duplicate document' }, 500);
  }
});

// Convert document
app.post("/make-server-3ab4c0e4/documents/:id/convert", async (c) => {
  try {
    const { error, userId } = await verifyAuth(c.req.raw);
    if (error) return c.json({ error }, 401);
    
    // Check subscription
    const subscriptionKey = `subscription:${userId}`;
    const subscription = await kv.get(subscriptionKey);
    if (!subscription || new Date(subscription.endDate) < new Date()) {
      return c.json({ error: 'Subscription expired. Please renew to convert documents.' }, 403);
    }
    
    const documentId = c.req.param('id');
    const { targetType } = await c.req.json();
    const existingDoc = await kv.get(`document:${documentId}`);
    
    if (!existingDoc || existingDoc.userId !== userId) {
      return c.json({ error: 'Document not found' }, 404);
    }
    
    const newDocId = crypto.randomUUID();
    
    // Generate new document number
    const counterKey = `doc-counter:${userId}:${targetType}`;
    let counter = await kv.get(counterKey) || 0;
    counter++;
    await kv.set(counterKey, counter);
    
    const documentNumber = `${targetType.toUpperCase()}-${String(counter).padStart(5, '0')}`;
    
    const newDoc = {
      ...existingDoc,
      id: newDocId,
      type: targetType,
      documentNumber,
      convertedFrom: documentId,
      status: 'draft',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(`document:${newDocId}`, newDoc);
    
    // Add to user's document list
    const userDocsKey = `user-documents:${userId}`;
    const userDocs = await kv.get(userDocsKey) || [];
    userDocs.unshift(newDocId);
    await kv.set(userDocsKey, userDocs);
    
    return c.json(newDoc);
  } catch (error) {
    console.log(`Convert document error: ${error}`);
    return c.json({ error: 'Failed to convert document' }, 500);
  }
});

// ========== CUSTOMER ROUTES ==========

// Create customer
app.post("/make-server-3ab4c0e4/customers", async (c) => {
  try {
    const { error, userId } = await verifyAuth(c.req.raw);
    if (error) return c.json({ error }, 401);
    
    const customerData = await c.req.json();
    const customerId = crypto.randomUUID();
    
    const customer = {
      id: customerId,
      userId,
      ...customerData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(`customer:${customerId}`, customer);
    
    // Add to user's customer list
    const userCustomersKey = `user-customers:${userId}`;
    const userCustomers = await kv.get(userCustomersKey) || [];
    userCustomers.push(customerId);
    await kv.set(userCustomersKey, userCustomers);
    
    return c.json(customer);
  } catch (error) {
    console.log(`Create customer error: ${error}`);
    return c.json({ error: 'Failed to create customer' }, 500);
  }
});

// Get all customers for user
app.get("/make-server-3ab4c0e4/customers", async (c) => {
  try {
    const { error, userId } = await verifyAuth(c.req.raw);
    if (error) return c.json({ error }, 401);
    
    const userCustomersKey = `user-customers:${userId}`;
    const customerIds = await kv.get(userCustomersKey) || [];
    
    const customers = [];
    for (const customerId of customerIds) {
      const customer = await kv.get(`customer:${customerId}`);
      if (customer) customers.push(customer);
    }
    
    return c.json(customers);
  } catch (error) {
    console.log(`Get customers error: ${error}`);
    return c.json({ error: 'Failed to get customers' }, 500);
  }
});

// ========== ITEM CATALOG ROUTES ==========

// Create item
app.post("/make-server-3ab4c0e4/items", async (c) => {
  try {
    const { error, userId } = await verifyAuth(c.req.raw);
    if (error) return c.json({ error }, 401);
    
    const itemData = await c.req.json();
    const itemId = crypto.randomUUID();
    
    const item = {
      id: itemId,
      userId,
      ...itemData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(`item:${itemId}`, item);
    
    // Add to user's item list
    const userItemsKey = `user-items:${userId}`;
    const userItems = await kv.get(userItemsKey) || [];
    userItems.push(itemId);
    await kv.set(userItemsKey, userItems);
    
    return c.json(item);
  } catch (error) {
    console.log(`Create item error: ${error}`);
    return c.json({ error: 'Failed to create item' }, 500);
  }
});

// Get all items for user
app.get("/make-server-3ab4c0e4/items", async (c) => {
  try {
    const { error, userId } = await verifyAuth(c.req.raw);
    if (error) return c.json({ error }, 401);
    
    const userItemsKey = `user-items:${userId}`;
    const itemIds = await kv.get(userItemsKey) || [];
    
    const items = [];
    for (const itemId of itemIds) {
      const item = await kv.get(`item:${itemId}`);
      if (item) items.push(item);
    }
    
    return c.json(items);
  } catch (error) {
    console.log(`Get items error: ${error}`);
    return c.json({ error: 'Failed to get items' }, 500);
  }
});

// ========== SUBSCRIPTION ROUTES ==========

// Get subscription status
app.get("/make-server-3ab4c0e4/subscription", async (c) => {
  try {
    const { error, userId } = await verifyAuth(c.req.raw);
    if (error) return c.json({ error }, 401);
    
    const subscriptionKey = `subscription:${userId}`;
    const subscription = await kv.get(subscriptionKey);
    
    if (!subscription) {
      return c.json({ error: 'No subscription found' }, 404);
    }
    
    return c.json(subscription);
  } catch (error) {
    console.log(`Get subscription error: ${error}`);
    return c.json({ error: 'Failed to get subscription' }, 500);
  }
});

// Update subscription
app.post("/make-server-3ab4c0e4/subscription/update", async (c) => {
  try {
    const { error, userId } = await verifyAuth(c.req.raw);
    if (error) return c.json({ error }, 401);
    
    const { plan } = await c.req.json(); // 'monthly' or 'yearly'
    
    const subscriptionKey = `subscription:${userId}`;
    const existingSubscription = await kv.get(subscriptionKey);
    
    const now = new Date();
    const durationDays = plan === 'yearly' ? 365 : 30;
    const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    
    const subscription = {
      userId,
      plan,
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      active: true,
      previousPlan: existingSubscription?.plan || null
    };
    
    await kv.set(subscriptionKey, subscription);
    
    return c.json(subscription);
  } catch (error) {
    console.log(`Update subscription error: ${error}`);
    return c.json({ error: 'Failed to update subscription' }, 500);
  }
});

// ========== ANALYTICS ROUTES ==========

// Get analytics data
app.get("/make-server-3ab4c0e4/analytics", async (c) => {
  try {
    const { error, userId } = await verifyAuth(c.req.raw);
    if (error) return c.json({ error }, 401);
    
    const userDocsKey = `user-documents:${userId}`;
    const docIds = await kv.get(userDocsKey) || [];
    
    const documents = [];
    for (const docId of docIds) {
      const doc = await kv.get(`document:${docId}`);
      if (doc) documents.push(doc);
    }
    
    // Calculate analytics
    const invoices = documents.filter(d => d.type === 'invoice');
    const quotations = documents.filter(d => d.type === 'quotation');
    
    const totalSales = invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
    const paidInvoices = invoices.filter(inv => inv.paymentStatus === 'paid');
    const unpaidInvoices = invoices.filter(inv => inv.paymentStatus !== 'paid');
    const outstanding = unpaidInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
    
    // Top items
    const itemSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    invoices.forEach(inv => {
      inv.items?.forEach((item: any) => {
        if (!itemSales[item.name]) {
          itemSales[item.name] = { name: item.name, quantity: 0, revenue: 0 };
        }
        itemSales[item.name].quantity += item.quantity || 0;
        itemSales[item.name].revenue += item.total || 0;
      });
    });
    
    const topItems = Object.values(itemSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    
    // Monthly revenue
    const monthlyRevenue: Record<string, number> = {};
    invoices.forEach(inv => {
      if (inv.date) {
        const month = inv.date.substring(0, 7); // YYYY-MM
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (inv.grandTotal || 0);
      }
    });
    
    return c.json({
      totalSales,
      outstanding,
      totalInvoices: invoices.length,
      totalQuotations: quotations.length,
      paidInvoices: paidInvoices.length,
      unpaidInvoices: unpaidInvoices.length,
      topItems,
      monthlyRevenue,
      conversionRate: quotations.length > 0 
        ? ((invoices.length / quotations.length) * 100).toFixed(1)
        : 0
    });
  } catch (error) {
    console.log(`Get analytics error: ${error}`);
    return c.json({ error: 'Failed to get analytics' }, 500);
  }
});

Deno.serve(app.fetch);
