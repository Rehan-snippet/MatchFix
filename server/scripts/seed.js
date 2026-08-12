// Runs database/seed.sql against DATABASE_URL.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  const seedPath = path.join(__dirname, '..', '..', 'database', 'seed.sql');
  const sql = fs.readFileSync(seedPath, 'utf8');

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('Applying seed.sql ...');
  await client.query(sql);
  console.log('Seed data inserted successfully.');
  await client.end();
}

main().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
