// Seeds 30+ marketplace products (plus a couple of extra sellers) against
// DATABASE_URL. Safe to re-run: seedMarketplace no-ops once >= 30 products
// already exist.
require('dotenv').config();
const path = require('path');
const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const query = (text, params) => client.query(text, params);
  const seedMarketplace = require(path.join('..', 'src', 'config', 'seedMarketplace'));

  console.log('Seeding marketplace...');
  await seedMarketplace(query);
  console.log('Done.');

  await client.end();
}

main().catch((err) => {
  console.error('Marketplace seeding failed:', err.message);
  process.exit(1);
});
