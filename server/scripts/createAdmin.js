require('dotenv').config();
const { Client } = require('pg');

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/createAdmin.js <email>');
  process.exit(1);
}

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:admin@localhost:5432/matchfix',
  });

  try {
    await client.connect();
    const res = await client.query(
      'UPDATE users SET is_admin = TRUE WHERE LOWER(email) = LOWER($1) RETURNING user_id, name, email, is_admin',
      [email]
    );

    if (res.rowCount === 0) {
      console.error(`User with email "${email}" not found.`);
      process.exit(1);
    }

    console.log(`Success: User "${res.rows[0].email}" (ID: ${res.rows[0].user_id}, Name: ${res.rows[0].name}) is now an Admin (is_admin = ${res.rows[0].is_admin}).`);
  } catch (err) {
    console.error('Error promoting user to admin:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
