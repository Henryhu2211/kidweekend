const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function seed() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_YqxwtoC9pz1e@ep-plain-hall-a7qlws4x-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require'
  });

  try {
    console.log('Connecting to Neon database...');
    await client.connect();
    console.log('Connected!');

    const sqlPath = path.join(__dirname, 'deploy/seed-test-data.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing seed script...');
    await client.query(sql);
    console.log('✅ Test data inserted successfully!');

    // Verify counts
    const tables = ['users', 'categories', 'places', 'place_images', 'opening_hours', 'reviews', 'favorites'];
    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`  ${table}: ${result.rows[0].count} rows`);
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
