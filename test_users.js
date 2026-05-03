const fetch = require('node-fetch');

async function test() {
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@edutech.com', password: 'Password123!' })
  });
  const loginData = await loginRes.json();
  const token = loginData.data.token;
  
  const usersRes = await fetch('http://localhost:5000/api/admin/users', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const usersData = await usersRes.json();
  console.log('Users Data:', JSON.stringify(usersData, null, 2));
}

test();
