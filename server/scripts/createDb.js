// Creates the `matchfix` database on the Postgres server pointed to by
// DATABASE_URL's host/port/user, if it doesn't already exist.
require('dotenv').config();
const { Client } = require('pg');
const { URL } = require('url');

async function main() {
  const target = new URL(process.env.DATABASE_URL);
  const dbName = target.pathname.replace('/', '');

  // Connect to the default 'postgres' database to issue CREATE DATABASE.
  const adminUrl = new URL(process.env.DATABASE_URL);
  adminUrl.pathname = '/postgres';

  const client = new Client({ connectionString: adminUrl.toString() });
  await client.connect();

  const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if (rowCount === 0) {
    await client.query(`CREATE DATABASE ${JSON.stringify(dbName).replace(/"/g, '"')}`);
    console.log(`Database "${dbName}" created.`);
  } else {
    console.log(`Database "${dbName}" already exists.`);
  }
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
