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

async function runPhase3Tests() {
  console.log('🧪 Starting Phase 3: Admin Approval System Test Suite...\n');

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
    // 1. Admin Login
    const adminLoginRes = await makeRequest(port, 'POST', '/api/auth/login', {}, {
      email: 'nahid@matchfix.dev',
      password: 'Passw0rd!',
    });
    assert(adminLoginRes.status === 200, 'Admin login succeeds');
    const adminToken = adminLoginRes.data.token;
    assert(!!adminToken, 'Admin token acquired');

    // 2. Stats includes pending approval counters
    const statsRes = await makeRequest(port, 'GET', '/api/admin/stats', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(statsRes.status === 200, 'Admin stats endpoint returns 200');
    assert(typeof statsRes.data.pending_organizers === 'number', 'Stats contains pending_organizers count');
    assert(typeof statsRes.data.pending_sellers === 'number', 'Stats contains pending_sellers count');
    assert(typeof statsRes.data.pending_turfs === 'number', 'Stats contains pending_turfs count');
    assert(typeof statsRes.data.pending_products === 'number', 'Stats contains pending_products count');

    // 3. Register a New Organizer (Pending)
    const orgPhone = `017${Date.now().toString().slice(-8)}`;
    const regOrgRes = await makeRequest(port, 'POST', '/api/auth/register', {}, {
      name: `Host Candidate ${ts}`,
      email: `host_${ts}@matchfix.dev`,
      phone: orgPhone,
      password: 'Passw0rd!',
      confirmPassword: 'Passw0rd!',
      role: 'organizer',
      trade_licence: `TL-2026-P3-${ts}`,
      payout_account: 'bkash: 01700000000',
    });
    assert(regOrgRes.status === 201, 'Registers organizer with pending status');
    const orgId = regOrgRes.data.user.user_id;

    // 4. Admin sees pending organizer
    const pendingOrgsRes = await makeRequest(port, 'GET', '/api/admin/pending-organizers', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(pendingOrgsRes.status === 200, 'GET /api/admin/pending-organizers returns 200');
    const foundOrg = pendingOrgsRes.data.find((o) => o.user_id === orgId);
    assert(!!foundOrg, `Found newly registered organizer #${orgId} in pending list`);

    // 5. Admin approves organizer
    const approveOrgRes = await makeRequest(port, 'PATCH', `/api/admin/organizers/${orgId}/approve`, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(approveOrgRes.status === 200, 'PATCH /api/admin/organizers/:id/approve succeeds');

    // Organizer logs in again and has 'organizer' role active
    const orgLoginRes = await makeRequest(port, 'POST', '/api/auth/login', {}, {
      email: `host_${ts}@matchfix.dev`,
      password: 'Passw0rd!',
    });
    assert(orgLoginRes.data.user.roles.includes('organizer'), 'Approved organizer now has active organizer role');
    const approvedOrgToken = orgLoginRes.data.token;

    // 6. Register a New Seller (Pending)
    const sellerPhone = `018${Date.now().toString().slice(-8)}`;
    const regSellerRes = await makeRequest(port, 'POST', '/api/auth/register', {}, {
      name: `Merchant Candidate ${ts}`,
      email: `merchant_${ts}@matchfix.dev`,
      phone: sellerPhone,
      password: 'Passw0rd!',
      confirmPassword: 'Passw0rd!',
      role: 'seller',
      shop_name: `Speed Boots ${ts}`,
      payout_account: 'nagad: 01800000000',
    });
    assert(regSellerRes.status === 201, 'Registers seller with pending status');
    const sellerId = regSellerRes.data.user.user_id;

    // 7. Admin sees pending seller
    const pendingSellersRes = await makeRequest(port, 'GET', '/api/admin/pending-sellers', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(pendingSellersRes.status === 200, 'GET /api/admin/pending-sellers returns 200');
    const foundSeller = pendingSellersRes.data.find((s) => s.user_id === sellerId);
    assert(!!foundSeller, `Found newly registered seller #${sellerId} in pending list`);

    // 8. Admin approves seller
    const approveSellerRes = await makeRequest(port, 'PATCH', `/api/admin/sellers/${sellerId}/approve`, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(approveSellerRes.status === 200, 'PATCH /api/admin/sellers/:id/approve succeeds');

    const sellerLoginRes = await makeRequest(port, 'POST', '/api/auth/login', {}, {
      email: `merchant_${ts}@matchfix.dev`,
      password: 'Passw0rd!',
    });
    assert(sellerLoginRes.data.user.roles.includes('seller'), 'Approved seller now has active seller role');
    const approvedSellerToken = sellerLoginRes.data.token;

    // 9. Approved Organizer creates a Turf -> status is pending
    const createTurfRes = await makeRequest(port, 'POST', '/api/turfs', {
      Authorization: `Bearer ${approvedOrgToken}`,
    }, {
      area_id: 1,
      name: `Arena Zenith ${ts}`,
      address: 'Plot 4, Sector 7, Uttara, Dhaka',
      hourly_rate: 1800,
      description: 'Brand new artificial turf with LED floodlights.',
    });
    assert(createTurfRes.status === 201, 'Creates turf successfully');
    const turfId = createTurfRes.data.turf_id;
    assert(createTurfRes.data.approval_status === 'pending', 'Newly created turf has approval_status = pending');

    // 10. Public turf listing excludes pending turf
    const publicTurfsRes = await makeRequest(port, 'GET', '/api/turfs');
    const inPublic = publicTurfsRes.data.some((t) => t.turf_id === turfId);
    assert(!inPublic, 'Pending turf is hidden from public turf directory');

    // 11. Organizer can see their pending turf in their personal listing
    const myTurfsRes = await makeRequest(port, 'GET', `/api/turfs?organizer_id=${orgId}`);
    const inMine = myTurfsRes.data.some((t) => t.turf_id === turfId);
    assert(inMine, 'Pending turf is visible to the owner organizer in their dashboard query');

    // 12. Admin sees pending turf
    const pendingTurfsRes = await makeRequest(port, 'GET', '/api/admin/pending-turfs', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(pendingTurfsRes.status === 200, 'GET /api/admin/pending-turfs returns 200');
    const foundTurf = pendingTurfsRes.data.find((t) => t.turf_id === turfId);
    assert(!!foundTurf, `Found turf #${turfId} in admin pending list`);

    // 13. Admin approves turf
    const approveTurfRes = await makeRequest(port, 'PATCH', `/api/admin/turfs/${turfId}/approve`, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(approveTurfRes.status === 200, 'PATCH /api/admin/turfs/:id/approve succeeds');

    // 14. Approved turf is now visible in public list
    const publicTurfsAfterRes = await makeRequest(port, 'GET', '/api/turfs');
    const inPublicAfter = publicTurfsAfterRes.data.some((t) => t.turf_id === turfId);
    assert(inPublicAfter, 'Approved turf is now visible to public users');

    // 15. Approved Seller creates a Product -> status is pending
    const createProdRes = await makeRequest(port, 'POST', '/api/products', {
      Authorization: `Bearer ${approvedSellerToken}`,
    }, {
      title: `Vapor Elite Football Boots ${ts}`,
      price: 4500,
      category: 'Boots',
      condition: 'new',
      stock: 10,
      description: 'Firm ground pro football boots.',
    });
    assert(createProdRes.status === 201, 'Creates product successfully');
    const prodId = createProdRes.data.product_id;
    assert(createProdRes.data.approval_status === 'pending', 'Newly created product has approval_status = pending');

    // 16. Public product listing excludes pending product
    const publicProdsRes = await makeRequest(port, 'GET', '/api/products');
    const inPublicProd = publicProdsRes.data.some((p) => p.product_id === prodId);
    assert(!inPublicProd, 'Pending product is hidden from public marketplace');

    // 17. Admin sees pending product
    const pendingProdsRes = await makeRequest(port, 'GET', '/api/admin/pending-products', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(pendingProdsRes.status === 200, 'GET /api/admin/pending-products returns 200');
    const foundProd = pendingProdsRes.data.find((p) => p.product_id === prodId);
    assert(!!foundProd, `Found product #${prodId} in admin pending list`);

    // 18. Admin approves product
    const approveProdRes = await makeRequest(port, 'PATCH', `/api/admin/products/${prodId}/approve`, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(approveProdRes.status === 200, 'PATCH /api/admin/products/:id/approve succeeds');

    // 19. Approved product is now visible in public marketplace
    const publicProdsAfterRes = await makeRequest(port, 'GET', '/api/products');
    const inPublicProdAfter = publicProdsAfterRes.data.some((p) => p.product_id === prodId);
    assert(inPublicProdAfter, 'Approved product is now visible to public buyers');

    // 20. Non-admin unauthorized access check
    const unauthRes = await makeRequest(port, 'GET', '/api/admin/pending-turfs', {
      Authorization: `Bearer ${approvedOrgToken}`,
    });
    assert(unauthRes.status === 403, 'Non-admin receives 403 Forbidden on admin pending routes');

    console.log(`\n========================================`);
    console.log(`Phase 3 Test Results: ${passed} passed, ${failed} failed`);
    console.log(`========================================\n`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Fatal test error in Phase 3:', err);
    process.exit(1);
  } finally {
    server.close();
  }
}

runPhase3Tests();
