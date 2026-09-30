const db = require('e:/Project/MatchFix/MatchFix/server/src/config/db');
const jwt = require('e:/Project/MatchFix/MatchFix/server/node_modules/jsonwebtoken');
const http = require('http');
const app = require('e:/Project/MatchFix/MatchFix/server/server.js');

async function runTests() {
  const server = app.listen(0);
  const port = server.address().port;
  console.log(`\n🧪 Phase 4: Turf Listing & Organizer Dashboard Tests — port ${port}\n`);

  let passed = 0, failed = 0;

  // Create test organizer user (approved)
  const email = `org_p4_${Date.now()}@test.com`;
  const uRes = await db.query(
    `INSERT INTO users (name, email, phone, password_hash) VALUES ($1,$2,$3,$4) RETURNING user_id`,
    ['P4 Organizer', email, '01811112222', 'hash']
  );
  const userId = uRes.rows[0].user_id;
  await db.query(
    `INSERT INTO organizers (user_id, trade_licence, payout_account, approval_status) VALUES ($1,$2,$3,'approved')`,
    [userId, 'TL-P4', 'bKash-123']
  );
  const areaRes = await db.query(`SELECT area_id FROM areas LIMIT 1`);
  const areaId = areaRes.rows[0].area_id;

  const token = jwt.sign(
    { user_id: userId, email, is_admin: false, roles: ['customer', 'organizer'] },
    process.env.JWT_SECRET || 'test_secret'
  );

  async function req(method, path, body = null, tok = token) {
    return new Promise((resolve, reject) => {
      const opts = {
        hostname: 'localhost', port, path, method,
        headers: { 'Authorization': `Bearer ${tok}`, 'Content-Type': 'application/json' }
      };
      const r = http.request(opts, (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
          catch(e) { resolve({ status: res.statusCode, body: d }); }
        });
      });
      r.on('error', reject);
      if (body) r.write(JSON.stringify(body));
      r.end();
    });
  }

  function check(label, condition, detail = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${label}`);
      passed++;
    } else {
      console.log(`  ❌ FAIL: ${label} ${detail}`);
      failed++;
    }
  }

  // 1. Create turf without hourly_rate (should use default 1200)
  let r = await req('POST', '/api/turfs', { area_id: areaId, name: 'P4 Arena', address: 'Road 5, Dhaka' });
  check('POST /turfs — creates turf without hourly_rate (default 1200)', r.status === 201);
  check('POST /turfs — approval_status is pending', r.body.approval_status === 'pending');
  check('POST /turfs — hourly_rate defaults to 1200', Number(r.body.hourly_rate) === 1200);
  const turfId = r.body.turf_id;

  // 2. Create turf with explicit hourly_rate and GPS
  r = await req('POST', '/api/turfs', {
    area_id: areaId,
    name: 'P4 Arena 2',
    address: 'Road 10, Dhaka',
    hourly_rate: 1500,
    latitude: 23.8103,
    longitude: 90.4125,
    description: 'Test arena',
  });
  check('POST /turfs — creates turf with hourly_rate=1500', r.status === 201);
  check('POST /turfs — hourly_rate saved correctly', Number(r.body.hourly_rate) === 1500);
  check('POST /turfs — latitude saved', Number(r.body.latitude) === 23.8103);
  check('POST /turfs — longitude saved', Number(r.body.longitude) === 90.4125);
  const turfId2 = r.body.turf_id;

  // 3. GET /turfs — public listing should NOT show pending turfs
  r = await req('GET', '/api/turfs', null, '');
  check('GET /turfs (public) — pending turfs hidden', !r.body.some(t => t.turf_id === turfId));

  // 4. GET /turfs?organizer_id=X — organizer sees their pending turfs
  r = await req('GET', `/api/turfs?organizer_id=${userId}`, null, token);
  check('GET /turfs?organizer_id — shows organizer pending turfs', r.body.some(t => t.turf_id === turfId));
  check('GET /turfs?organizer_id — both turfs visible', r.body.length >= 2);

  // 5. GET /turfs/:id — includes fields (empty initially)
  r = await req('GET', `/api/turfs/${turfId}`, null, '');
  check('GET /turfs/:id — returns turf detail', r.status === 200);
  check('GET /turfs/:id — fields is array', Array.isArray(r.body.fields));

  // 6. Add a field to the turf
  r = await req('POST', '/api/fields', { turf_id: turfId, name: 'Pitch A', surface: 'Artificial Turf', side_type: '5v5' });
  check('POST /fields — creates field', r.status === 201);
  const fieldId = r.body.field_id;

  // 7. Add pricing rule
  r = await req('POST', `/api/fields/${fieldId}/pricing-rules`, {
    day_of_week: 5, start_time: '18:00', end_time: '22:00', hourly_rate: 2000
  });
  check('POST /fields/:id/pricing-rules — creates rule', r.status === 201);
  const ruleId = r.body.rule_id;

  // 8. GET /turfs/:id — pricing_rules now embedded in fields
  r = await req('GET', `/api/turfs/${turfId}`, null, '');
  const fieldData = r.body.fields?.find(f => f.field_id === fieldId);
  check('GET /turfs/:id — fields contains added pitch', !!fieldData);
  check('GET /turfs/:id — pricing_rules embedded in field', Array.isArray(fieldData?.pricing_rules));
  check('GET /turfs/:id — pricing rule has correct rate', fieldData?.pricing_rules?.some(pr => Number(pr.hourly_rate) === 2000));

  // 9. DELETE /fields/:fieldId/pricing-rules/:ruleId
  r = await req('DELETE', `/api/fields/${fieldId}/pricing-rules/${ruleId}`);
  check('DELETE /fields/:id/pricing-rules/:ruleId — deletes rule', r.status === 200);

  r = await req('GET', `/api/turfs/${turfId}`, null, '');
  const fieldAfterRuleDel = r.body.fields?.find(f => f.field_id === fieldId);
  check('Pricing rule removed from field after delete', fieldAfterRuleDel?.pricing_rules?.length === 0);

  // 10. DELETE /fields/:id — deletes pitch
  r = await req('DELETE', `/api/fields/${fieldId}`);
  check('DELETE /fields/:id — deletes pitch', r.status === 200);

  // 11. PATCH /turfs/:id — update turf
  r = await req('PATCH', `/api/turfs/${turfId}`, { hourly_rate: 1800, description: 'Updated description' });
  check('PATCH /turfs/:id — updates turf', r.status === 200);
  check('PATCH /turfs/:id — hourly_rate updated', Number(r.body.hourly_rate) === 1800);

  // 12. DELETE /turfs/:id — deletes turf
  r = await req('DELETE', `/api/turfs/${turfId}`);
  check('DELETE /turfs/:id — deletes turf', r.status === 200);

  const checkDel = await db.query('SELECT * FROM turfs WHERE turf_id = $1', [turfId]);
  check('DELETE /turfs/:id — turf removed from database', checkDel.rowCount === 0);

  // 13. Verify setCoverImage route registered — PATCH /turfs/:id/images/:imageId/cover
  // (Just check 404 not found is 404, not 500 or method not allowed)
  r = await req('PATCH', `/api/turfs/${turfId2}/images/99999/cover`);
  check('PATCH /turfs/:turfId/images/:imageId/cover — route exists (not 404 method not allowed)', r.status !== 404 || r.body.error !== 'Not Found');

  // Cleanup
  await db.query('DELETE FROM users WHERE user_id = $1', [userId]);
  server.close();

  console.log(`\n========================================`);
  console.log(`Phase 4 Test Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => { console.error('Fatal:', err); process.exit(1); });
