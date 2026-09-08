const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

let pool = null;
let pgliteInstance = null;
let dbType = null; // 'pool' | 'pglite'

async function getDb() {
  if (pool) return { type: 'pool', db: pool };
  if (pgliteInstance) return { type: 'pglite', db: pgliteInstance };

  if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
    try {
      pool = new Pool({ connectionString: process.env.DATABASE_URL });
      await pool.query('SELECT 1');
      console.log('Connected to external PostgreSQL via DATABASE_URL');
      dbType = 'pool';
      return { type: 'pool', db: pool };
    } catch (err) {
      console.warn('Could not connect to external PostgreSQL, falling back to embedded PostgreSQL:', err.message);
      pool = null;
    }
  }

  const { PGlite } = require('@electric-sql/pglite');
  const { pgcrypto } = require('@electric-sql/pglite/contrib/pgcrypto');
  const dataDir = path.join(process.cwd(), 'database', 'pgdata');
  pgliteInstance = new PGlite(dataDir, { extensions: { pgcrypto } });
  await pgliteInstance.waitReady;
  dbType = 'pglite';
  console.log('Connected to embedded PostgreSQL (PGlite) at', dataDir);
  return { type: 'pglite', db: pgliteInstance };
}

async function initDb() {
  const { type, db } = await getDb();
  const checkSql = `SELECT to_regclass('public.users') as tbl;`;
  const res = await query(checkSql);
  const exists = res.rows && res.rows[0] && res.rows[0].tbl;
  if (!exists) {
    console.log('Applying MatchFix PostgreSQL database schema and seed data...');
    const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
    const seedPath = path.join(process.cwd(), 'database', 'seed.sql');

    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      if (type === 'pglite') {
        await db.exec(schemaSql);
      } else {
        await db.query(schemaSql);
      }
      console.log('PostgreSQL schema applied successfully.');
    }
    if (fs.existsSync(seedPath)) {
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      if (type === 'pglite') {
        await db.exec(seedSql);
      } else {
        await db.query(seedSql);
      }
      console.log('PostgreSQL seed data loaded successfully.');
    }
  } else {
    console.log('MatchFix PostgreSQL database tables initialized.');
  }

  // Ensure diverse Dhaka areas and turfs with rich photos and coordinates exist
  try {
    const seedDhakaTurfs = require('./seedDhakaTurfs');
    await seedDhakaTurfs(query);
  } catch (err) {
    console.warn('Could not run seedDhakaTurfs:', err.message);
  }
}

async function query(text, params) {
  const { db } = await getDb();
  return await db.query(text, params);
}

async function getClient() {
  const { type, db } = await getDb();
  if (type === 'pool') {
    return await db.connect();
  }
  return {
    query: (text, params) => db.query(text, params),
    release: () => {},
  };
}

module.exports = {
  query,
  getClient,
  get pool() {
    return pool;
  },
  initDb,
};
