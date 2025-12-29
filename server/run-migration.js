/**
 * סקריפט להוספת עמודת display_order
 */

const db = require('./database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    console.log('🚀 מתחיל להוסיף עמודת display_order...\n');
    
    try {
        // קריאת קובץ ה-SQL
        const sqlPath = path.join(__dirname, 'add-display-order.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // הרצת ה-SQL
        await db.query(sql);
        
        console.log('✅ עמודת display_order נוספה בהצלחה!');
        console.log('✅ כל העובדים קיבלו מספר סדר ראשוני');
        
    } catch (error) {
        console.error('❌ שגיאה:', error);
    } finally {
        await db.pool.end();
        console.log('\n👋 סיום');
        process.exit(0);
    }
}

runMigration();



