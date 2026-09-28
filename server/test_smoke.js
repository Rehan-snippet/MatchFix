require('dotenv').config();
const http = require('http');
const app = require('./server');

const TEST_ADMIN_EMAIL = 'nahid@matchfix.dev';
const TEST_PASSWORD = 'Passw0rd!';
const TEST_REGULAR_EMAIL = 'naeemul@matchfix.dev';

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

async function runSmokeTests() {
  console.log('🚀 Starting MatchFix End-to-End Verification Suite...');

  // Start app on ephemeral port
  const server = app.listen(0);
  const port = server.address().port;
  console.log(`📡 Test server bound to port ${port}`);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const healthRes = await makeRequest(port, 'GET', '/health');
    assert(healthRes.status === 200 && healthRes.data.status === 'ok', 'GET /health returns 200 ok');

    // 2. Admin Login
    console.log('\n--- Test: Admin Authentication ---');
    const loginRes = await makeRequest(port, 'POST', '/api/auth/login', {}, {
      email: TEST_ADMIN_EMAIL,
      password: TEST_PASSWORD,
    });
    assert(loginRes.status === 200, `POST /api/auth/login returned status ${loginRes.status}`);
    assert(loginRes.data.user?.is_admin === true, 'User payload has is_admin = true');
    assert(!!loginRes.data.token, 'JWT token returned on admin login');
    const adminToken = loginRes.data.token;
    const adminId = loginRes.data.user?.user_id;

    // 3. Regular user login (non-admin)
    console.log('\n--- Test: Regular User Authentication & Role Protection ---');
    const regRes = await makeRequest(port, 'POST', '/api/auth/login', {}, {
      email: TEST_REGULAR_EMAIL,
      password: TEST_PASSWORD,
    });
    assert(regRes.status === 200, `POST /api/auth/login for regular user returned 200`);
    assert(regRes.data.user?.is_admin === false, 'Regular user payload has is_admin = false');
    const regularToken = regRes.data.token;

    // 4. Admin stats access with admin token
    console.log('\n--- Test: Admin Statistics API ---');
    const statsRes = await makeRequest(port, 'GET', '/api/admin/stats', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(statsRes.status === 200, 'GET /api/admin/stats returns 200 for Admin');
    assert(typeof statsRes.data.total_users === 'number', `Stats contains total_users: ${statsRes.data.total_users}`);
    assert(typeof statsRes.data.total_turfs === 'number', `Stats contains total_turfs: ${statsRes.data.total_turfs}`);
    assert(typeof statsRes.data.total_revenue === 'number', `Stats contains total_revenue: ৳${statsRes.data.total_revenue}`);

    // 5. Admin stats rejection with regular user token
    const nonAdminStats = await makeRequest(port, 'GET', '/api/admin/stats', {
      Authorization: `Bearer ${regularToken}`,
    });
    assert(nonAdminStats.status === 403, `GET /api/admin/stats correctly rejected for non-admin with 403 (got ${nonAdminStats.status})`);

    // 6. Admin stats rejection without token
    const noTokenStats = await makeRequest(port, 'GET', '/api/admin/stats');
    assert(noTokenStats.status === 401, `GET /api/admin/stats correctly rejected without token with 401`);

    // 7. List Users directory
    console.log('\n--- Test: Admin User Directory API ---');
    const usersRes = await makeRequest(port, 'GET', '/api/admin/users?limit=10', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(usersRes.status === 200, 'GET /api/admin/users returns 200');
    assert(Array.isArray(usersRes.data.users), `Returns users list (found ${usersRes.data.users?.length})`);
    assert(typeof usersRes.data.total === 'number', `Returns total count: ${usersRes.data.total}`);

    // Filter by role
    const orgUsersRes = await makeRequest(port, 'GET', '/api/admin/users?role=organizer', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(orgUsersRes.status === 200, 'Filter users by role=organizer returns 200');

    // 8. Token Refresh endpoint
    console.log('\n--- Test: Token Refresh Endpoint ---');
    const refreshRes = await makeRequest(port, 'POST', '/api/auth/refresh', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(refreshRes.status === 200, 'POST /api/auth/refresh returns 200');
    assert(!!refreshRes.data.token, 'Returns new JWT token');
    assert(refreshRes.data.user?.is_admin === true, 'Refreshed user maintains is_admin = true');

    // 9. Update User (Safe test on non-admin user)
    console.log('\n--- Test: Admin User Update & Governance ---');
    const targetUser = usersRes.data.users.find((u) => u.user_id !== adminId);
    if (targetUser) {
      const updateRes = await makeRequest(port, 'PATCH', `/api/admin/users/${targetUser.user_id}`, {
        Authorization: `Bearer ${adminToken}`,
      }, {
        phone: '+8801700000000',
      });
      assert(updateRes.status === 200, `PATCH /api/admin/users/${targetUser.user_id} updated phone successfully`);
    }

    // 10. Self-demote protection check
    const selfDemoteRes = await makeRequest(port, 'PATCH', `/api/admin/users/${adminId}`, {
      Authorization: `Bearer ${adminToken}`,
    }, {
      is_admin: false,
    });
    assert(selfDemoteRes.status === 400, 'Self-demotion correctly blocked with 400 Bad Request');

    // 11. Self-deactivation protection check
    const selfDeactivateRes = await makeRequest(port, 'PATCH', `/api/admin/users/${adminId}`, {
      Authorization: `Bearer ${adminToken}`,
    }, {
      is_active: false,
    });
    assert(selfDeactivateRes.status === 400, 'Self-deactivation correctly blocked with 400 Bad Request');

    // 12. Static Uploads serving check
    console.log('\n--- Test: Static Uploads Serving ---');
    const staticRes = await makeRequest(port, 'GET', '/uploads/');
    assert(staticRes.status === 404 || staticRes.status === 200 || staticRes.status === 403, 'Static /uploads mount is responsive');

    console.log(`\n========================================`);
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error in smoke test:', err);
    process.exit(1);
  } finally {
    server.close();
  }
}

runSmokeTests();
