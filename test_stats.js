const fetch = require('node-fetch');

async function test() {
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@edutech.com', password: 'Password123!' })
  });
  const loginData = await loginRes.json();
  if (!loginData.success) {
    console.log('Login failed:', loginData);
    return;
  }
  const token = loginData.data.token;
  
  const statsRes = await fetch('http://localhost:5000/api/admin/stats', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const statsData = await statsRes.json();
  console.log('Stats:', JSON.stringify(statsData, null, 2));
}

test();
