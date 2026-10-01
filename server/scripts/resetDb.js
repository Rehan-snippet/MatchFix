const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Client } = require('pg');
const { URL } = require('url');
const { spawn } = require('child_process');

async function dropAndRecreateDb() {
  const target = new URL(process.env.DATABASE_URL);
  const dbName = target.pathname.replace('/', '');

  // Connect to administrative 'postgres' database to drop and recreate target DB
  const adminUrl = new URL(process.env.DATABASE_URL);
  adminUrl.pathname = '/postgres';

  console.log('======================================================================');
  console.log(`💥 DROPPING AND RECREATING DATABASE: "${dbName}"`);
  console.log('======================================================================\n');

  console.log(`🔌 Connecting to PostgreSQL server at ${adminUrl.hostname}:${adminUrl.port || 5432}...`);
  const client = new Client({ connectionString: adminUrl.toString() });
  await client.connect();

  console.log(`🗑️  Dropping database "${dbName}" (terminating existing connections)...`);
  await client.query(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE);`);

  console.log(`✨ Recreating blank database "${dbName}"...`);
  await client.query(`CREATE DATABASE "${dbName}";`);

  await client.end();
  console.log(`✅ Database "${dbName}" recreated clean.\n`);

  // Now invoke the unified seed script
  console.log('🌱 Launching seed.js to apply schema.sql and populate fresh data...\n');
  const seedProcess = spawn('node', [path.resolve(__dirname, 'seed.js')], {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..'),
    env: process.env,
  });

  seedProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`❌ Seeding exited with code ${code}`);
      process.exit(code);
    }
  });
}

dropAndRecreateDb().catch((err) => {
  console.error('❌ Failed to drop and recreate database:', err.message);
  process.exit(1);
});
