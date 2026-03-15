/**
 * Test script:
 * 1. Login to master admin panel
 * 2. Find subscriber by email adityarajsir162@gmail.com
 * 3. Reset their password to "TestPass123"
 * 4. Login to BillVyapar as that user with the new password
 */

const BASE = 'http://localhost:4000';
const ADMIN_EMAIL = 'adityarajsir162@gmail.com';
const ADMIN_PASSWORD = 'adi*tya';
const TARGET_EMAIL = 'adityarajsir162@gmail.com';
const NEW_PASSWORD = 'TestPass123';

async function run() {
  // ── Step 1: Master admin login ──────────────────────────────────────────
  console.log('\n[1] Logging in as master admin...');
  const loginRes = await fetch(`${BASE}/master-admin/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok || loginData.error) {
    console.error('   ❌ Admin login failed:', loginData);
    process.exit(1);
  }
  const adminToken = loginData.accessToken;
  console.log('   ✅ Admin logged in. Token:', adminToken.slice(0, 30) + '...');

  // ── Step 2: Find subscriber by email ────────────────────────────────────
  console.log(`\n[2] Searching for subscriber: ${TARGET_EMAIL}`);
  const searchRes = await fetch(
    `${BASE}/master-admin/subscribers?search=${encodeURIComponent(TARGET_EMAIL)}&limit=5`,
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  const searchData = await searchRes.json();
  if (!searchRes.ok || searchData.error) {
    console.error('   ❌ Search failed:', searchData);
    process.exit(1);
  }
  const subscriber = searchData.subscribers?.find(
    s => s.email?.toLowerCase() === TARGET_EMAIL.toLowerCase()
  );
  if (!subscriber) {
    console.error('   ❌ Subscriber not found. Results:', searchData.subscribers?.map(s => s.email));
    process.exit(1);
  }
  console.log(`   ✅ Found subscriber: ${subscriber.name} (${subscriber.email}) id=${subscriber._id}`);

  // ── Step 3: Reset password ───────────────────────────────────────────────
  console.log(`\n[3] Resetting password to "${NEW_PASSWORD}"...`);
  const resetRes = await fetch(`${BASE}/master-admin/subscribers/${subscriber._id}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ newPassword: NEW_PASSWORD }),
  });
  const resetData = await resetRes.json();
  if (!resetRes.ok || resetData.error) {
    console.error('   ❌ Reset failed:', resetData);
    process.exit(1);
  }
  console.log('   ✅ Password reset successful:', resetData);

  // ── Step 4: Login as the user ────────────────────────────────────────────
  console.log(`\n[4] Logging in as ${TARGET_EMAIL} with new password...`);
  const userLoginRes = await fetch(`${BASE}/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Device-ID': 'test-script-device' },
    body: JSON.stringify({ email: TARGET_EMAIL, password: NEW_PASSWORD }),
  });
  const userLoginData = await userLoginRes.json();
  if (!userLoginRes.ok || userLoginData.error) {
    console.error('   ❌ User login failed:', userLoginData);
    process.exit(1);
  }
  console.log('   ✅ User login successful!');
  console.log('   User:', userLoginData.user);
  console.log('   Token:', userLoginData.session?.access_token?.slice(0, 40) + '...');
}

run().catch(err => { console.error('Fatal:', err); process.exit(1); });
