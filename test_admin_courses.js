const fetch = require('node-fetch');

async function test() {
  // Login as admin
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@edutech.com', password: 'Admin@123456' })
  });
  const loginData = await loginRes.json();
  console.log('Login response:', JSON.stringify(loginData, null, 2));
  
  if (!loginData.data?.token) {
    console.log('Login failed!');
    return;
  }
  
  const token = loginData.data.token;

  // Fetch admin courses
  const coursesRes = await fetch('http://localhost:5000/api/admin/courses', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const coursesData = await coursesRes.json();
  console.log('\nAdmin Courses Response:', JSON.stringify(coursesData, null, 2));
}

test().catch(console.error);
