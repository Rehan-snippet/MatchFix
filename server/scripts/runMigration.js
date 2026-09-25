require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

async function run() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node scripts/runMigration.js <migration_file.sql>');
    process.exit(1);
  }
  const filePath = path.resolve(__dirname, '../../database/migrations', file);
  if (!fs.existsSync(filePath)) {
    console.error(`Migration file not found: ${filePath}`);
    process.exit(1);
  }
  const sql = fs.readFileSync(filePath, 'utf8');
  console.log(`Executing migration ${file}...`);
  await db.query(sql);
  console.log(`Migration ${file} applied successfully.`);
  process.exit(0);
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
