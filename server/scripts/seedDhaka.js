// Runs the richer Dhaka-neighborhood turf data (seedDhakaTurfs) against
// DATABASE_URL. Safe to re-run: seedDhakaTurfs no-ops once >= 6 turfs exist.
require('dotenv').config();
const path = require('path');
const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const query = (text, params) => client.query(text, params);
  const seedDhakaTurfs = require(path.join('..', 'src', 'config', 'seedDhakaTurfs'));

  console.log('Seeding Dhaka neighborhood turfs ...');
  await seedDhakaTurfs(query);
  console.log('Done.');

  await client.end();
}

main().catch((err) => {
  console.error('Dhaka seeding failed:', err.message);
  process.exit(1);
});
