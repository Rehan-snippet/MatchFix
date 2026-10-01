const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { Client } = require('pg');

/**
 * MatchFix Admin Creator / Promoter Script
 *
 * Usage:
 *   1. Promote existing user:
 *      node scripts/createAdmin.js user@example.com
 *
 *   2. Create brand-new admin:
 *      node scripts/createAdmin.js newadmin@matchfix.dev Passw0rd! "New Admin" 01711999999
 */

const [,, emailArg, passwordArg, nameArg, phoneArg] = process.argv;

if (!emailArg) {
  console.log('======================================================================');
  console.log('🛡️  MATCHFIX ADMIN PROVISIONING TOOL');
  console.log('======================================================================');
  console.log('Usage:');
  console.log('  1. Promote existing user to Admin:');
  console.log('     node scripts/createAdmin.js <email>');
  console.log('');
  console.log('  2. Create a new Admin user:');
  console.log('     node scripts/createAdmin.js <email> <password> [name] [phone]');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/createAdmin.js customer.tanvir@matchfix.dev');
  console.log('  node scripts/createAdmin.js ops@matchfix.dev Passw0rd! "Ops Lead" 01711223344');
  console.log('======================================================================\n');
  process.exit(1);
}

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();

    const email = emailArg.trim().toLowerCase();

    // Check if user already exists
    const checkRes = await client.query('SELECT user_id, name, email, is_admin FROM users WHERE LOWER(email) = $1', [email]);

    if (checkRes.rows.length > 0) {
      // Existing user -> elevate to admin
      const existing = checkRes.rows[0];
      if (existing.is_admin) {
        console.log(`ℹ️  User "${existing.email}" (ID: ${existing.user_id}, Name: ${existing.name}) is ALREADY an Admin.`);
      } else {
        await client.query('UPDATE users SET is_admin = TRUE WHERE user_id = $1', [existing.user_id]);
        console.log(`✅ Success! Elevated existing user "${existing.email}" (ID: ${existing.user_id}, Name: ${existing.name}) to Admin (is_admin = true).`);
      }
    } else {
      // User doesn't exist -> create new admin
      const password = passwordArg || 'Passw0rd!';
      const name = nameArg ? nameArg.trim() : 'MatchFix Administrator';
      const phone = phoneArg ? phoneArg.trim() : '01711000999';

      const passwordHash = await bcrypt.hash(password, 10);

      const insertRes = await client.query(
        `INSERT INTO users (name, email, phone, password_hash, is_admin, is_active)
         VALUES ($1, $2, $3, $4, TRUE, TRUE)
         RETURNING user_id, name, email, phone, is_admin`,
        [name, email, phone, passwordHash]
      );

      const newAdmin = insertRes.rows[0];

      // Give admin a customer record as well for platform consistency
      await client.query(
        `INSERT INTO customers (user_id, default_address)
         VALUES ($1, 'MatchFix Headquarters, Dhaka')
         ON CONFLICT (user_id) DO NOTHING`,
        [newAdmin.user_id]
      );

      console.log('======================================================================');
      console.log('🎉 NEW ADMIN ACCOUNT CREATED SUCCESSFULLY!');
      console.log('======================================================================');
      console.log(`User ID:   ${newAdmin.user_id}`);
      console.log(`Name:      ${newAdmin.name}`);
      console.log(`Email:     ${newAdmin.email}`);
      console.log(`Phone:     ${newAdmin.phone}`);
      console.log(`Password:  ${password}`);
      console.log(`Admin:     ${newAdmin.is_admin}`);
      console.log('======================================================================\n');
    }
  } catch (err) {
    console.error('❌ Failed to provision admin:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

