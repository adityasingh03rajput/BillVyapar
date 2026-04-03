import fetch from 'node-fetch';

const API_URL = 'http://localhost:4000';
const ACCESS_TOKEN = '...'; // I'll need to grab this from a real session or just test the 400 source
const PROFILE_ID = '699ae8eb922a0d0ca802ca2a'; // cloud technologies

async function test() {
  // Test with explicit dates
  const url = `${API_URL}/analytics?from=2026-03-31&to=2026-04-29`;
  const res = await fetch(url, {
    headers: {
      'X-Profile-ID': PROFILE_ID,
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'X-Device-ID': 'test-device'
    }
  });

  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Data:', data);
}
// test();
