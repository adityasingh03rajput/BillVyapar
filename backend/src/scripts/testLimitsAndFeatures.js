/**
 * testLimitsAndFeatures.js
 *
 * Tests subscriber limits and feature flags end-to-end.
 *
 * Usage:
 *   node backend/src/scripts/testLimitsAndFeatures.js
 *
 * Requires the backend server to be running (default: http://localhost:3000)
 */

// Uses Node 18+ built-in fetch (no extra deps needed)

// ─── Config ──────────────────────────────────────────────────────────────────
const BASE = process.env.API_URL || 'http://localhost:4000';

const ADMIN_EMAIL    = 'adityarajsir162@gmail.com';
const ADMIN_PASSWORD = 'adi*tya';

// The test user is the same account — only one subscriber exists
const USER_EMAIL    = 'adityarajsir162@gmail.com';
const USER_PASSWORD = 'TestPass123';

// Limits to set for the test
const TEST_LIMITS = {
  maxDocumentsPerMonth: 2,
  maxCustomers: 2,
  maxSuppliers: 2,
  maxItems: 2,
};

// Features to disable for the test
const TEST_FEATURES = {
  allowAnalytics:    false,
  allowGstinLookup:  false,
  allowSmsReminders: false,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';

const results = [];

function pass(name) {
  console.log(`  ${GREEN}✓${RESET} ${name}`);
  results.push({ name, ok: true });
}

function fail(name, reason) {
  console.log(`  ${RED}✗${RESET} ${name}`);
  if (reason) console.log(`    ${RED}→ ${reason}${RESET}`);
  results.push({ name, ok: false, reason });
}

async function api(path, { method = 'GET', token, profileId, body, deviceId } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token)     headers['Authorization'] = `Bearer ${token}`;
  if (profileId) headers['X-Profile-ID']  = profileId;
  if (deviceId)  headers['X-Device-ID']   = deviceId;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data;
  try { data = await res.json(); } catch { data = {}; }
  return { status: res.status, data };
}

// ─── Step 1: Admin login ──────────────────────────────────────────────────────
async function adminLogin() {
  console.log(`\n${BOLD}[1] Admin login${RESET}`);
  const { status, data } = await api('/master-admin/auth/signin', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });

  if (status !== 200 || !data.accessToken) {
    throw new Error(`Admin login failed (${status}): ${JSON.stringify(data)}`);
  }
  pass('Admin login');
  return data.accessToken;
}

// ─── Step 2: Find subscriber by user email ────────────────────────────────────
async function findSubscriber(adminToken) {
  console.log(`\n${BOLD}[2] Find subscriber for ${USER_EMAIL}${RESET}`);

  const { status, data } = await api(`/master-admin/subscribers?limit=200`, { token: adminToken });
  if (status !== 200) throw new Error(`List subscribers failed (${status}): ${JSON.stringify(data)}`);

  const subscribers = data.subscribers || [];

  // Match by subscriber.email first
  let sub = subscribers.find(s => s.email === USER_EMAIL);

  // Fallback: check ownerUser.email via details endpoint
  if (!sub) {
    for (const s of subscribers) {
      const { status: ds, data: dd } = await api(`/master-admin/subscribers/${s._id}`, { token: adminToken });
      if (ds === 200 && dd.ownerUser?.email === USER_EMAIL) { sub = s; break; }
    }
  }

  if (!sub) {
    throw new Error(
      `No subscriber found for "${USER_EMAIL}". ` +
      `Known emails: ${subscribers.map(s => s.email).join(', ')}`
    );
  }

  pass(`Found subscriber: ${sub.name} (${sub._id})`);
  return sub;
}

// ─── Step 3: Set restrictive limits + disable features ────────────────────────
async function setLimits(adminToken, subscriberId, limits, features) {
  console.log(`\n${BOLD}[3] Set restrictive limits & disable features${RESET}`);
  const { status, data } = await api(`/master-admin/subscribers/${subscriberId}/limits`, {
    method: 'PUT',
    token: adminToken,
    body: { limits, features },
  });

  if (status !== 200 || !data.ok) {
    throw new Error(`Set limits failed (${status}): ${JSON.stringify(data)}`);
  }
  pass(`Limits set: ${JSON.stringify(limits)}`);
  pass(`Features set: ${JSON.stringify(features)}`);
}

// ─── Step 4: User login ───────────────────────────────────────────────────────
async function userLogin() {
  console.log(`\n${BOLD}[4] User login${RESET}`);
  const deviceId = `test-script-${Date.now()}`;
  const { status, data } = await api('/auth/signin', {
    method: 'POST',
    deviceId,
    body: { email: USER_EMAIL, password: USER_PASSWORD },
  });

  if (status !== 200 || !data.session?.access_token) {
    throw new Error(`User login failed (${status}): ${JSON.stringify(data)}`);
  }
  pass('User login');
  return { token: data.session.access_token, deviceId };
}

// ─── Step 5: Get first profile ────────────────────────────────────────────────
async function getProfile(token, deviceId) {
  console.log(`\n${BOLD}[5] Get user profile${RESET}`);
  const { status, data } = await api('/profiles', { token, deviceId });

  if (status !== 200) throw new Error(`Get profiles failed (${status}): ${JSON.stringify(data)}`);

  const profiles = Array.isArray(data) ? data : (data.profiles || []);
  if (!profiles.length) throw new Error('No profiles found for user');

  pass(`Using profile: ${profiles[0].businessName || profiles[0].id}`);
  return profiles[0].id || String(profiles[0]._id);
}

// ─── Step 6: Test document limit ─────────────────────────────────────────────
async function testDocumentLimit(token, deviceId, profileId, max) {
  console.log(`\n${BOLD}[6] Test document limit (max=${max})${RESET}`);

  const now = new Date();
  const created = [];

  // Try creating up to `max` docs — stop as soon as we hit the limit
  for (let i = 0; i < max + 1; i++) {
    const { status, data } = await api('/documents', {
      method: 'POST', token, deviceId, profileId,
      body: { type: 'invoice', customerName: `__test__Doc${i+1}`, grandTotal: 100, date: now.toISOString().slice(0,10) },
    });

    if (status === 403 && data.code === 'LIMIT_REACHED') {
      if (i === 0) {
        // Already at limit before we even started — that's fine, limit is enforced
        pass(`Document limit already enforced (already at/above ${max})`);
      } else {
        pass(`Document limit enforced at ${max} (blocked on attempt ${i+1})`);
      }
      break;
    } else if (status === 200 || status === 201) {
      created.push(data.id);
      if (i < max) {
        pass(`Created document ${i+1}/${max}`);
      } else {
        // Created one beyond the limit — limit NOT enforced
        fail(`Document limit NOT enforced`, `Expected 403 LIMIT_REACHED on attempt ${i+1}, got 200`);
      }
    } else {
      fail(`Create document ${i+1}`, `Unexpected ${status}: ${JSON.stringify(data)}`);
      break;
    }
  }

  // Cleanup only the docs we created
  for (const id of created) {
    await api(`/documents/${id}`, { method: 'DELETE', token, deviceId, profileId });
  }
  if (created.length) console.log(`  cleaned up ${created.length} test document(s)`);
}

// ─── Step 7: Test customer limit ─────────────────────────────────────────────
async function testCustomerLimit(token, deviceId, profileId, max) {
  console.log(`\n${BOLD}[7] Test customer limit (max=${max})${RESET}`);

  const created = [];

  for (let i = 0; i < max + 1; i++) {
    const { status, data } = await api('/customers', {
      method: 'POST', token, deviceId, profileId,
      body: { name: `__test__Customer${Date.now()}_${i}`, phone: '9999999999', email: `testcust${i}@test.com` },
    });

    if (status === 403 && data.code === 'LIMIT_REACHED') {
      if (i === 0) {
        pass(`Customer limit already enforced (already at/above ${max})`);
      } else {
        pass(`Customer limit enforced at ${max} (blocked on attempt ${i+1})`);
      }
      break;
    } else if (status === 200 || status === 201) {
      created.push(data.id);
      if (i < max) {
        pass(`Created customer ${i+1}/${max}`);
      } else {
        fail(`Customer limit NOT enforced`, `Expected 403 LIMIT_REACHED on attempt ${i+1}, got 200`);
      }
    } else {
      fail(`Create customer ${i+1}`, `Unexpected ${status}: ${JSON.stringify(data)}`);
      break;
    }
  }

  // Cleanup only test customers we created
  for (const id of created) {
    await api(`/customers/${id}`, { method: 'DELETE', token, deviceId, profileId });
  }
  if (created.length) console.log(`  cleaned up ${created.length} test customer(s)`);
}

// ─── Step 8: Test feature flags ───────────────────────────────────────────────
async function testFeatureFlags(token, deviceId, profileId) {
  console.log(`\n${BOLD}[8] Test feature flags${RESET}`);

  // allowAnalytics = false → GET /analytics should return 403
  const { status: analyticsStatus, data: analyticsData } = await api('/analytics', { token, deviceId, profileId });
  if (analyticsStatus === 403 && analyticsData.code === 'FEATURE_DISABLED') {
    pass('allowAnalytics=false blocks GET /analytics (403 FEATURE_DISABLED)');
  } else {
    fail('allowAnalytics=false should block analytics', `Got ${analyticsStatus}: ${JSON.stringify(analyticsData)}`);
  }

  // allowGstinLookup = false → POST /customers/gstin/lookup should return 403
  const { status: gstinStatus, data: gstinData } = await api('/customers/gstin/lookup', {
    method: 'POST', token, deviceId, profileId,
    body: { gstin: '27AAPFU0939F1ZV' },
  });
  if (gstinStatus === 403 && gstinData.code === 'FEATURE_DISABLED') {
    pass('allowGstinLookup=false blocks POST /customers/gstin/lookup (403 FEATURE_DISABLED)');
  } else {
    fail('allowGstinLookup=false should block GSTIN lookup', `Got ${gstinStatus}: ${JSON.stringify(gstinData)}`);
  }

  // allowSmsReminders = false → POST /documents/:id/remind should return 403
  // We need a document id — create a temp one
  const now = new Date();
  const { status: createStatus, data: tempDoc } = await api('/documents', {
    method: 'POST', token, deviceId, profileId,
    body: { type: 'invoice', customerName: '__test__ReminderDoc', grandTotal: 500, date: now.toISOString().slice(0,10) },
  });

  if (createStatus === 200 || createStatus === 201) {
    const { status: remindStatus, data: remindData } = await api(`/documents/${tempDoc.id}/remind`, {
      method: 'POST', token, deviceId, profileId,
      body: { channel: 'sms', to: '+919999999999' },
    });
    if (remindStatus === 403 && remindData.code === 'FEATURE_DISABLED') {
      pass('allowSmsReminders=false blocks POST /documents/:id/remind (403 FEATURE_DISABLED)');
    } else {
      fail('allowSmsReminders=false should block SMS reminder', `Got ${remindStatus}: ${JSON.stringify(remindData)}`);
    }
    // Cleanup
    await api(`/documents/${tempDoc.id}`, { method: 'DELETE', token, deviceId, profileId });
  } else {
    console.log(`  ${YELLOW}⚠ Could not create temp doc for SMS reminder test (${createStatus}), skipping${RESET}`);
  }
}

// ─── Step 9: Reset limits to unlimited ───────────────────────────────────────
async function resetLimits(adminToken, subscriberId) {
  console.log(`\n${BOLD}[9] Reset limits to unlimited${RESET}`);
  const resetLimits = Object.fromEntries(Object.keys(TEST_LIMITS).map(k => [k, -1]));
  const resetFeatures = Object.fromEntries(Object.keys(TEST_FEATURES).map(k => [k, true]));

  const { status, data } = await api(`/master-admin/subscribers/${subscriberId}/limits`, {
    method: 'PUT',
    token: adminToken,
    body: { limits: resetLimits, features: resetFeatures },
  });

  if (status === 200 && data.ok) {
    pass('Limits reset to -1 (unlimited)');
    pass('Features reset to true (enabled)');
  } else {
    fail('Reset limits failed', `${status}: ${JSON.stringify(data)}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${BOLD}═══════════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD}  BillVyapar — Limits & Feature Flags Test Script  ${RESET}`);
  console.log(`${BOLD}═══════════════════════════════════════════════════${RESET}`);
  console.log(`  API: ${BASE}`);
  console.log(`  Admin: ${ADMIN_EMAIL}`);
  console.log(`  User:  ${USER_EMAIL}`);

  let adminToken, subscriber, userToken, deviceId, profileId;

  try {
    adminToken = await adminLogin();
    subscriber = await findSubscriber(adminToken);
    await setLimits(adminToken, subscriber._id, TEST_LIMITS, TEST_FEATURES);

    const userAuth = await userLogin();
    userToken = userAuth.token;
    deviceId  = userAuth.deviceId;

    profileId = await getProfile(userToken, deviceId);

    await testDocumentLimit(userToken, deviceId, profileId, TEST_LIMITS.maxDocumentsPerMonth);
    await testCustomerLimit(userToken, deviceId, profileId, TEST_LIMITS.maxCustomers);
    await testFeatureFlags(userToken, deviceId, profileId);
  } catch (err) {
    console.error(`\n${RED}${BOLD}FATAL ERROR: ${err.message}${RESET}`);
    process.exitCode = 1;
  } finally {
    // Always try to reset limits even if tests fail
    if (adminToken && subscriber) {
      try { await resetLimits(adminToken, subscriber._id); }
      catch (e) { console.error(`${RED}Could not reset limits: ${e.message}${RESET}`); }
    }
  }

  // ─── Summary ───────────────────────────────────────────────────────────────
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;

  console.log(`\n${BOLD}═══════════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD}  RESULTS: ${GREEN}${passed} passed${RESET}${BOLD}, ${failed > 0 ? RED : GREEN}${failed} failed${RESET}`);
  console.log(`${BOLD}═══════════════════════════════════════════════════${RESET}\n`);

  if (failed > 0) {
    console.log(`${RED}Failed tests:${RESET}`);
    results.filter(r => !r.ok).forEach(r => {
      console.log(`  ${RED}✗ ${r.name}${RESET}`);
      if (r.reason) console.log(`    ${r.reason}`);
    });
    console.log('');
    process.exitCode = 1;
  }
}

main();
