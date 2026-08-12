// Runs database/schema.sql against DATABASE_URL.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('Applying schema.sql ...');
  await client.query(sql);
  console.log('Schema applied successfully.');
  await client.end();
}

main().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
