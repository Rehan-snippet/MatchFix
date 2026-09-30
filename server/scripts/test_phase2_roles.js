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

async function runPhase2Tests() {
  console.log('🧪 Starting Phase 2: Role-Based Registration & Conditional Fields Test Suite...\n');

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

  const ts = Date.now().toString().slice(-6);

  try {
    // 1. Invalid Role Rejection
    const resInvalidRole = await makeRequest(port, 'POST', '/api/auth/register', {}, {
      name: 'Bad Role User',
      email: `badrole_${ts}@matchfix.dev`,
      phone: `017${Date.now().toString().slice(-8)}`,
      password: 'Passw0rd!',
      confirmPassword: 'Passw0rd!',
      role: 'superman',
    });
    assert(resInvalidRole.status === 400, 'Rejects invalid role type', JSON.stringify(resInvalidRole.data));

    // 2. Customer Registration (Default)
    const customerPhone = `017${Date.now().toString().slice(-8)}`;
    const resCustomer = await makeRequest(port, 'POST', '/api/auth/register', {}, {
      name: 'Standard Customer',
      email: `customer_${ts}@matchfix.dev`,
      phone: customerPhone,
      password: 'Passw0rd!',
      confirmPassword: 'Passw0rd!',
      role: 'customer',
      address: 'House 5, Road 2, Dhanmondi, Dhaka',
    });
    assert(resCustomer.status === 201, 'Registers customer successfully', JSON.stringify(resCustomer.data));
    assert(resCustomer.data.requires_approval === false, 'Customer does not require admin approval');
    assert(resCustomer.data.user?.roles?.includes('customer'), 'Customer role granted immediately');

    // 3. Organizer Registration - Missing Trade Licence
    const resOrgNoLicence = await makeRequest(port, 'POST', '/api/auth/register', {}, {
      name: 'Organizer Candidate',
      email: `org_nolic_${ts}@matchfix.dev`,
      phone: `018${Date.now().toString().slice(-8)}`,
      password: 'Passw0rd!',
      confirmPassword: 'Passw0rd!',
      role: 'organizer',
      payout_account: 'bkash: 01800000001',
    });
    assert(resOrgNoLicence.status === 400, 'Rejects organizer registration when trade licence is missing', JSON.stringify(resOrgNoLicence.data));

    // 4. Organizer Registration - Missing Payout Account
    const resOrgNoPayout = await makeRequest(port, 'POST', '/api/auth/register', {}, {
      name: 'Organizer Candidate',
      email: `org_nopay_${ts}@matchfix.dev`,
      phone: `018${Date.now().toString().slice(-8)}`,
      password: 'Passw0rd!',
      confirmPassword: 'Passw0rd!',
      role: 'organizer',
      trade_licence: 'TL-2026-DHAKA-1122',
    });
    assert(resOrgNoPayout.status === 400, 'Rejects organizer registration when payout account is missing', JSON.stringify(resOrgNoPayout.data));

    // 5. Valid Organizer Registration (Pending Approval)
    const orgPhone = `018${Date.now().toString().slice(-8)}`;
    const resOrgValid = await makeRequest(port, 'POST', '/api/auth/register', {}, {
      name: 'Dhaka Arena Host',
      email: `organizer_${ts}@matchfix.dev`,
      phone: orgPhone,
      password: 'Passw0rd!',
      confirmPassword: 'Passw0rd!',
      role: 'organizer',
      trade_licence: 'TL-2026-DHAKA-8899',
      payout_account: 'bkash: 01888888888',
    });
    assert(resOrgValid.status === 201, 'Registers organizer with trade licence and payout account', JSON.stringify(resOrgValid.data));
    assert(resOrgValid.data.requires_approval === true, 'Organizer registration flagged as requires_approval');
    assert(resOrgValid.data.user?.organizer?.approval_status === 'pending', 'Organizer approval_status is set to pending');
    assert(!resOrgValid.data.user?.roles?.includes('organizer'), 'Active organizer role not granted until approved');
    assert(resOrgValid.data.user?.roles?.includes('customer'), 'Customer role granted so user can explore platform');

    // 6. Seller Registration - Missing Shop Name
    const resSellerNoShop = await makeRequest(port, 'POST', '/api/auth/register', {}, {
      name: 'Seller Candidate',
      email: `seller_noshop_${ts}@matchfix.dev`,
      phone: `019${Date.now().toString().slice(-8)}`,
      password: 'Passw0rd!',
      confirmPassword: 'Passw0rd!',
      role: 'seller',
      payout_account: 'nagad: 01900000001',
    });
    assert(resSellerNoShop.status === 400, 'Rejects seller registration when shop name is missing', JSON.stringify(resSellerNoShop.data));

    // 7. Seller Registration - Missing Payout Account
    const resSellerNoPayout = await makeRequest(port, 'POST', '/api/auth/register', {}, {
      name: 'Seller Candidate',
      email: `seller_nopay_${ts}@matchfix.dev`,
      phone: `019${Date.now().toString().slice(-8)}`,
      password: 'Passw0rd!',
      confirmPassword: 'Passw0rd!',
      role: 'seller',
      shop_name: 'Apex Sports Store',
    });
    assert(resSellerNoPayout.status === 400, 'Rejects seller registration when payout account is missing', JSON.stringify(resSellerNoPayout.data));

    // 8. Valid Seller Registration (Pending Approval)
    const sellerPhone = `019${Date.now().toString().slice(-8)}`;
    const resSellerValid = await makeRequest(port, 'POST', '/api/auth/register', {}, {
      name: 'Premier Football Gear',
      email: `seller_${ts}@matchfix.dev`,
      phone: sellerPhone,
      password: 'Passw0rd!',
      confirmPassword: 'Passw0rd!',
      role: 'seller',
      shop_name: 'Premier Boots & Kits',
      payout_account: 'nagad: 01999999999',
    });
    assert(resSellerValid.status === 201, 'Registers seller with shop name and payout account', JSON.stringify(resSellerValid.data));
    assert(resSellerValid.data.requires_approval === true, 'Seller registration flagged as requires_approval');
    assert(resSellerValid.data.user?.seller?.approval_status === 'pending', 'Seller approval_status is set to pending');
    assert(!resSellerValid.data.user?.roles?.includes('seller'), 'Active seller role not granted until approved');
    assert(resSellerValid.data.user?.roles?.includes('customer'), 'Customer role granted so user can explore platform');

    console.log(`\n========================================`);
    console.log(`Phase 2 Test Results: ${passed} passed, ${failed} failed`);
    console.log(`========================================\n`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Fatal test error in Phase 2:', err);
    process.exit(1);
  } finally {
    server.close();
  }
}

runPhase2Tests();
