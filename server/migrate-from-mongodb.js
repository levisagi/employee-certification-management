/**
 * סקריפט להעברת נתונים מ-MongoDB ל-PostgreSQL
 * 
 * שימוש:
 * 1. ודא שיש לך גיבוי MongoDB בתיקיית dump/
 * 2. ודא שקובץ .env מוגדר עם CONNECTION STRING של Supabase
 * 3. הרץ: node migrate-from-mongodb.js
 * 
 * הסקריפט יקרא את הגיבוי של MongoDB ויעביר אותו ל-PostgreSQL
 */

const fs = require('fs');
const path = require('path');
const db = require('./database');
const EmployeeModel = require('./models/EmployeeModel');

// נתיב לגיבוי MongoDB
const DUMP_PATH = path.join(__dirname, '..', 'dump', 'employee-certification');
const EMPLOYEES_FILE = path.join(DUMP_PATH, 'employees.bson');

async function migrateFromMongoDB() {
    console.log('🚀 Starting migration from MongoDB to PostgreSQL...\n');
    
    try {
        // בדיקה אם קיים גיבוי
        if (!fs.existsSync(DUMP_PATH)) {
            console.log('❌ No MongoDB dump found at:', DUMP_PATH);
            console.log('💡 If you have MongoDB data, export it first using:');
            console.log('   mongodump --db=employee-certification --out=dump\n');
            return;
        }

        // בדיקת חיבור ל-PostgreSQL
        console.log('🔌 Testing PostgreSQL connection...');
        await db.query('SELECT NOW()');
        console.log('✅ Connected to PostgreSQL\n');

        // בדיקה אם יש כבר נתונים
        const existingEmployees = await EmployeeModel.findAll();
        if (existingEmployees.length > 0) {
            console.log('⚠️  Warning: Database already contains', existingEmployees.length, 'employees');
            console.log('❓ Do you want to continue? This will add more employees.');
            console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        // קריאת הנתונים מ-MongoDB dump
        console.log('📖 Reading MongoDB dump...');
        
        // הערה: BSON הוא פורמט בינארי, נצטרך להשתמש בספרייה מיוחדת
        // לצורך הדוגמה, נניח שיש JSON export
        const jsonFile = path.join(DUMP_PATH, 'employees.json');
        
        if (!fs.existsSync(jsonFile)) {
            console.log('❌ No JSON export found.');
            console.log('💡 Export your MongoDB data to JSON first:');
            console.log('   mongoexport --db=employee-certification --collection=employees --out=dump/employee-certification/employees.json --jsonArray\n');
            return;
        }

        const jsonData = fs.readFileSync(jsonFile, 'utf8');
        const employees = JSON.parse(jsonData);
        
        console.log(`📊 Found ${employees.length} employees to migrate\n`);

        // העברת כל עובד
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < employees.length; i++) {
            const emp = employees[i];
            try {
                console.log(`[${i + 1}/${employees.length}] Migrating: ${emp.firstName} ${emp.lastName}...`);
                
                // המרת הפורמט
                const employeeData = {
                    employeeNumber: emp.employeeNumber,
                    firstName: emp.firstName,
                    lastName: emp.lastName,
                    phoneNumber: emp.phoneNumber,
                    email: emp.email,
                    role: emp.role,
                    department: emp.department,
                    startDate: emp.startDate ? new Date(emp.startDate) : new Date(),
                    profileImage: emp.profileImage || null,
                    certifications: (emp.certifications || []).map(cert => ({
                        name: cert.name,
                        issueDate: new Date(cert.issueDate),
                        expiryDate: new Date(cert.expiryDate),
                        startDate: cert.startDate ? new Date(cert.startDate) : null,
                        endDate: cert.endDate ? new Date(cert.endDate) : null,
                        status: cert.status,
                        isRequired: cert.isRequired || false,
                        certificate: cert.certificate || null,
                        certificateFileName: cert.certificateFileName || null,
                        ojt1: cert.ojt1 ? {
                            mentor: cert.ojt1.mentor,
                            date: new Date(cert.ojt1.date)
                        } : null,
                        ojt2: cert.ojt2 ? {
                            mentor: cert.ojt2.mentor,
                            date: new Date(cert.ojt2.date)
                        } : null
                    }))
                };

                await EmployeeModel.create(employeeData);
                successCount++;
                console.log(`   ✅ Success\n`);
                
            } catch (error) {
                errorCount++;
                console.error(`   ❌ Error: ${error.message}\n`);
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log('🎉 Migration completed!');
        console.log('='.repeat(50));
        console.log(`✅ Successfully migrated: ${successCount} employees`);
        console.log(`❌ Failed: ${errorCount} employees`);
        console.log('='.repeat(50) + '\n');

        if (successCount > 0) {
            console.log('💡 You can now:');
            console.log('   1. Start the server: npm start');
            console.log('   2. View data in Supabase Table Editor');
            console.log('   3. Delete the MongoDB dump if no longer needed\n');
        }

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error(error);
    } finally {
        // סגירת החיבור
        await db.pool.end();
        console.log('👋 Disconnected from database');
    }
}

// הרצת הסקריפט
if (require.main === module) {
    migrateFromMongoDB()
        .then(() => {
            console.log('\n✨ Done!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { migrateFromMongoDB };



