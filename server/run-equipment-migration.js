#!/usr/bin/env node

require('dotenv').config();
const createEquipmentTable = require('./migrations/create-equipment-table');

console.log('=========================================');
console.log('  Equipment Table Migration');
console.log('=========================================\n');

console.log('Database URL:', process.env.DATABASE_URL ? 'Found' : 'Missing');
console.log('Starting migration...\n');

createEquipmentTable()
    .then(() => {
        console.log('\n✓✓✓ Migration completed successfully! ✓✓✓\n');
        console.log('You can now:');
        console.log('1. Start the server: npm run server');
        console.log('2. Import your equipment data');
        console.log('3. View equipment in the web app\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n✗✗✗ Migration failed ✗✗✗');
        console.error('Error:', error.message);
        console.error('\nPlease check:');
        console.error('1. Database connection is working');
        console.error('2. DATABASE_URL in .env is correct');
        console.error('3. Supabase/PostgreSQL is running\n');
        process.exit(1);
    });

