import axios from 'axios';

const API = 'http://localhost:5000/api';

async function test() {
  try {
    // 1. Login first
    console.log('1. Testing login...');
    const loginRes = await axios.post(`${API}/auth/login`, {
      email: 'test@test.com',
      password: 'test123'
    }).catch(e => ({ error: e.response?.data || e.message }));
    console.log('Login result:', JSON.stringify(loginRes.data || loginRes.error));

    if (loginRes.error) {
      console.log('Login failed, trying to register...');
      const regRes = await axios.post(`${API}/auth/register`, {
        email: 'test@test.com',
        password: 'test123'
      }).catch(e => ({ error: e.response?.data || e.message }));
      console.log('Register result:', JSON.stringify(regRes.data || regRes.error));
      
      const loginRes2 = await axios.post(`${API}/auth/login`, {
        email: 'test@test.com',
        password: 'test123'
      }).catch(e => ({ error: e.response?.data || e.message }));
      console.log('Login retry:', JSON.stringify(loginRes2.data || loginRes2.error));
      
      if (loginRes2.data?.token) {
        return testWithToken(loginRes2.data.token);
      }
      return;
    }

    if (loginRes.data?.token) {
      return testWithToken(loginRes.data.token);
    }
  } catch (e) {
    console.error('Test error:', e.message);
  }
}

async function testWithToken(token) {
  console.log('\n2. Testing /chat/sessions with token...');
  const sessRes = await axios.get(`${API}/chat/sessions`, {
    headers: { Authorization: `Bearer ${token}` }
  }).catch(e => {
    console.log('Sessions error status:', e.response?.status);
    console.log('Sessions error data:', JSON.stringify(e.response?.data));
    return { error: true };
  });
  if (!sessRes.error) {
    console.log('Sessions result:', JSON.stringify(sessRes.data));
  }

  console.log('\n3. Testing /chat/message...');
  const msgRes = await axios.post(`${API}/chat/message`, {
    message: 'Hello test'
  }, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 30000
  }).catch(e => {
    console.log('Message error status:', e.response?.status);
    console.log('Message error data:', JSON.stringify(e.response?.data));
    return { error: true };
  });
  if (!msgRes.error) {
    console.log('Message result:', JSON.stringify(msgRes.data));
  }
}

test();
