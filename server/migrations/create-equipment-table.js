const { pool } = require('../database');

async function createEquipmentTable() {
    const client = await pool.connect();
    
    try {
        console.log('Creating equipment table...');
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS equipment (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                serial_number VARCHAR(255) NOT NULL UNIQUE,
                company VARCHAR(255),
                last_calibration_date DATE NOT NULL,
                next_calibration_date DATE NOT NULL,
                category VARCHAR(255),
                location VARCHAR(255),
                notes TEXT,
                image TEXT,
                display_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        console.log('✓ Equipment table created successfully');
        
        // יצירת אינדקסים לביצועים טובים יותר
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_equipment_serial ON equipment(serial_number);
            CREATE INDEX IF NOT EXISTS idx_equipment_company ON equipment(company);
            CREATE INDEX IF NOT EXISTS idx_equipment_next_calibration ON equipment(next_calibration_date);
        `);
        
        console.log('✓ Indexes created successfully');
        
    } catch (error) {
        console.error('Error creating equipment table:', error);
        throw error;
    } finally {
        client.release();
    }
}

// הרצת המיגרציה
if (require.main === module) {
    createEquipmentTable()
        .then(() => {
            console.log('\n✓ Equipment table migration completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n✗ Equipment table migration failed:', error);
            process.exit(1);
        });
}

module.exports = createEquipmentTable;

