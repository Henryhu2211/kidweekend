const { Client } = require('pg');

async function checkSchema() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_YqxwtoC9pz1e@ep-plain-hall-a7qlws4x-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require'
  });

  try {
    await client.connect();
    console.log('Connected!');

    // Get all tables
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    console.log('\n=== Tables ===');
    console.log(tables.rows.map(r => r.table_name).join(', '));

    // Get columns for key tables
    const keyTables = ['users', 'categories', 'places', 'place_images'];
    for (const table of keyTables) {
      const cols = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [table]);
      console.log(`\n=== ${table} columns ===`);
      cols.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));
    }

  } finally {
    await client.end();
  }
}

checkSchema();
