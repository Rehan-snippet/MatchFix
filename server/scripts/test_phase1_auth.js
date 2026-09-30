require('dotenv').config();
const http = require('http');
const app = require('../server');

async function makeRequest(port, method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          let data;
          try {
            data = JSON.parse(rawData);
          } catch {
            data = rawData;
          }
          resolve({ status: res.statusCode, headers: res.headers, data });
        });
      }
    );

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runPhase1Tests() {
  console.log('🧪 Starting Phase 1: Authentication & Validation Test Suite...\n');

  const server = app.listen(0);
  const port = server.address().port;
  console.log(`📡 Test server bound to port ${port}\n`);

  let passed = 0;
  let failed = 0;

  function assert(condition, message, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message} ${details ? '— ' + details : ''}`);
      failed++;
    }
  }

  const uniqueId = Date.now().toString().slice(-6);
  const testEmail = `tester_${uniqueId}@matchfix.dev`;
  // Generate valid BD mobile number starting with 017 and 8 digits
  const testPhone = `017${Date.now().toString().slice(-8)}`;
  const testPassword = 'SecurePass123!';

  try {
    // 1. Invalid Email at Signup
    const resBadEmail = await makeRequest(port, 'POST', '/api/auth/register', {}, {
      name: 'John Doe',
      email: 'not-an-email',
      phone: '01711223344',
      password: testPassword,
      confirmPassword: testPassword,
    });
    assert(resBadEmail.status === 400, 'Rejects invalid email format at signup', JSON.stringify(resBadEmail.data));

    // 2. Invalid Phone at Signup
    const resBadPhone = await makeRequest(port, 'POST', '/api/auth/register', {}, {
      name: 'John Doe',
      email: `valid_${uniqueId}@matchfix.dev`,
      phone: '12345',
      password: testPassword,
      confirmPassword: testPassword,
    });
    assert(resBadPhone.status === 400, 'Rejects invalid phone number format at signup', JSON.stringify(resBadPhone.data));

    // 3. Password Mismatch at Signup
    const resMismatch = await makeRequest(port, 'POST', '/api/auth/register', {}, {
      name: 'John Doe',
      email: `valid2_${uniqueId}@matchfix.dev`,
      phone: '01711223344',
      password: testPassword,
      confirmPassword: 'DifferentPassword123!',
    });
    assert(resMismatch.status === 400, 'Rejects password mismatch at signup', JSON.stringify(resMismatch.data));

    // 4. Short Password at Signup
    const resShortPass = await makeRequest(port, 'POST', '/api/auth/register', {}, {
      name: 'John Doe',
      email: `valid3_${uniqueId}@matchfix.dev`,
      phone: '01711223344',
      password: '123',
      confirmPassword: '123',
    });
    assert(resShortPass.status === 400, 'Rejects short password (< 6 chars) at signup', JSON.stringify(resShortPass.data));

    // 5. Short Name at Signup
    const resShortName = await makeRequest(port, 'POST', '/api/auth/register', {}, {
      name: ' ',
      email: `valid4_${uniqueId}@matchfix.dev`,
      phone: '01711223344',
      password: testPassword,
      confirmPassword: testPassword,
    });
    assert(resShortName.status === 400, 'Rejects empty or single char name at signup', JSON.stringify(resShortName.data));

    // 6. Valid Registration
    const resValidReg = await makeRequest(port, 'POST', '/api/auth/register', {}, {
      name: 'Test Athlete',
      email: testEmail,
      phone: testPhone,
      password: testPassword,
      confirmPassword: testPassword,
    });
    assert(resValidReg.status === 201, 'Registers user successfully with valid email, phone & confirm password', JSON.stringify(resValidReg.data));
    assert(!!resValidReg.data.token, 'Returns auth token on successful registration');
    assert(resValidReg.data.user?.email === testEmail, 'User payload contains registered email');
    assert(resValidReg.data.user?.phone === testPhone, 'User payload contains normalized phone');

    // 7. Duplicate Email Rejection
    const resDupEmail = await makeRequest(port, 'POST', '/api/auth/register', {}, {
      name: 'Duplicate Athlete',
      email: testEmail,
      phone: `018${Date.now().toString().slice(-8)}`,
      password: testPassword,
      confirmPassword: testPassword,
    });
    assert(resDupEmail.status === 400, 'Rejects registration with already existing email', JSON.stringify(resDupEmail.data));

    // 8. Duplicate Phone Rejection
    const resDupPhone = await makeRequest(port, 'POST', '/api/auth/register', {}, {
      name: 'Duplicate Phone Athlete',
      email: `unique_${uniqueId}@matchfix.dev`,
      phone: testPhone,
      password: testPassword,
      confirmPassword: testPassword,
    });
    assert(resDupPhone.status === 400, 'Rejects registration with already existing phone', JSON.stringify(resDupPhone.data));

    // 9. Login with Email
    const resLoginEmail = await makeRequest(port, 'POST', '/api/auth/login', {}, {
      email: testEmail,
      password: testPassword,
    });
    assert(resLoginEmail.status === 200, 'Logs in successfully using registered email', JSON.stringify(resLoginEmail.data));

    // 10. Login with Phone Number
    const resLoginPhone = await makeRequest(port, 'POST', '/api/auth/login', {}, {
      phone: testPhone,
      password: testPassword,
    });
    assert(resLoginPhone.status === 200, 'Logs in successfully using registered phone number', JSON.stringify(resLoginPhone.data));

    // 11. Login with Phone in Email field (unified identifier)
    const resLoginUnified = await makeRequest(port, 'POST', '/api/auth/login', {}, {
      email: testPhone,
      password: testPassword,
    });
    assert(resLoginUnified.status === 200, 'Logs in successfully using phone number in identifier field', JSON.stringify(resLoginUnified.data));

    // 12. Login with Invalid Identifier Format
    const resLoginBadId = await makeRequest(port, 'POST', '/api/auth/login', {}, {
      email: 'not_an_email_or_phone',
      password: testPassword,
    });
    assert(resLoginBadId.status === 400, 'Rejects login with invalid format identifier', JSON.stringify(resLoginBadId.data));

    // 13. Login with Wrong Password
    const resLoginWrongPass = await makeRequest(port, 'POST', '/api/auth/login', {}, {
      email: testEmail,
      password: 'WrongPassword!',
    });
    assert(resLoginWrongPass.status === 401, 'Rejects login with incorrect password', JSON.stringify(resLoginWrongPass.data));

    console.log(`\n========================================`);
    console.log(`Phase 1 Test Results: ${passed} passed, ${failed} failed`);
    console.log(`========================================\n`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  } finally {
    server.close();
  }
}

runPhase1Tests();
