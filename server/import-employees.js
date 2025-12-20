/**
 * סקריפט להוספת עובדים למסד הנתונים
 * הרצה: node import-employees.js
 */

const db = require('./database');
const EmployeeModel = require('./models/EmployeeModel');

// רשימת העובדים
const employees = [
    {
        employeeNumber: '23351',
        firstName: 'כהן',
        lastName: 'מוטי',
        phoneNumber: '050-9755352',
        email: '',
        role: 'ראש מחלקה',
        department: 'ניווט',
        startDate: new Date('2012-03-01'),
        profileImage: null,
        certifications: []
    },
    {
        employeeNumber: '15794',
        firstName: 'אבנר',
        lastName: 'רועי',
        phoneNumber: '077-7080542',
        email: '',
        role: 'ראש משמרת',
        department: 'ניווט',
        startDate: new Date('2003-08-10'),
        profileImage: null,
        certifications: []
    },
    {
        employeeNumber: '14334',
        firstName: 'צוקרמן',
        lastName: 'חן',
        phoneNumber: '050-9755194',
        email: '',
        role: 'ראש משמרת',
        department: 'ניווט',
        startDate: new Date('1998-09-28'),
        profileImage: null,
        certifications: []
    },
    {
        employeeNumber: '16676',
        firstName: 'דניאל',
        lastName: 'רמי',
        phoneNumber: '03-9466001',
        email: '',
        role: 'ראש משמרת',
        department: 'ניווט',
        startDate: new Date('2002-01-06'),
        profileImage: null,
        certifications: []
    },
    {
        employeeNumber: '18499',
        firstName: 'לוי',
        lastName: 'רן',
        phoneNumber: '077-4507100',
        email: '',
        role: 'ראש משמרת',
        department: 'ניווט',
        startDate: new Date('2004-10-18'),
        profileImage: null,
        certifications: []
    },
    {
        employeeNumber: '25353',
        firstName: 'נבון',
        lastName: 'מתן',
        phoneNumber: '050-9755208',
        email: '',
        role: 'סגן ראש משמרת',
        department: 'ניווט',
        startDate: new Date('2015-08-02'),
        profileImage: null,
        certifications: []
    },
    {
        employeeNumber: '17281',
        firstName: 'גולן',
        lastName: 'תומר',
        phoneNumber: '08-9223993',
        email: '',
        role: 'אחרי בקרת איכות',
        department: 'ניווט',
        startDate: new Date('2005-03-01'),
        profileImage: null,
        certifications: []
    },
    {
        employeeNumber: '27337',
        firstName: 'אוראל',
        lastName: 'חגי',
        phoneNumber: '077-9328801',
        email: '',
        role: 'טכנאי ניווט בכיר',
        department: 'ניווט',
        startDate: new Date('2017-08-29'),
        profileImage: null,
        certifications: []
    },
    {
        employeeNumber: '27416',
        firstName: 'עומר',
        lastName: 'הראל',
        phoneNumber: '054-4369508',
        email: '',
        role: 'סגן ראש משמרת',
        department: 'ניווט',
        startDate: new Date('2017-09-25'),
        profileImage: null,
        certifications: []
    },
    {
        employeeNumber: '27832',
        firstName: 'אלמוג',
        lastName: 'גיל',
        phoneNumber: '052-4468658',
        email: '',
        role: 'ראש מחזור ניווט',
        department: 'ניווט',
        startDate: new Date('2018-03-13'),
        profileImage: null,
        certifications: []
    },
    {
        employeeNumber: '26708',
        firstName: 'אביעד',
        lastName: 'דבורה',
        phoneNumber: '050-9754745',
        email: '',
        role: 'סגן ראש משמרת',
        department: 'ניווט',
        startDate: new Date('2018-04-01'),
        profileImage: null,
        certifications: []
    },
    {
        employeeNumber: '27872',
        firstName: 'קיקים',
        lastName: 'אריה',
        phoneNumber: '052-9567607',
        email: '',
        role: 'סגן ראש משמרת',
        department: 'ניווט',
        startDate: new Date('2018-03-21'),
        profileImage: null,
        certifications: []
    },
    {
        employeeNumber: '29327',
        firstName: 'שגיא',
        lastName: 'לוי',
        phoneNumber: '052-7212911',
        email: '',
        role: 'טכנאי ניווט בכיר',
        department: 'ניווט',
        startDate: new Date('2019-08-01'),
        profileImage: null,
        certifications: []
    },
    {
        employeeNumber: '26158',
        firstName: 'איתי',
        lastName: 'מרקוביץ',
        phoneNumber: '050-9754527',
        email: '',
        role: 'טכנאי בקרה צפון',
        department: 'ניווט',
        startDate: new Date('2016-09-01'),
        profileImage: null,
        certifications: []
    },
    {
        employeeNumber: '31885',
        firstName: 'ענאן',
        lastName: 'סלאח',
        phoneNumber: '052-2789353',
        email: '',
        role: 'טכנאי בקרה צפון',
        department: 'ניווט',
        startDate: new Date('2023-06-01'),
        profileImage: null,
        certifications: []
    },
    {
        employeeNumber: '32386',
        firstName: 'קובי',
        lastName: 'טויסה',
        phoneNumber: '050-8166663',
        email: '',
        role: 'טכנאי ניווט',
        department: 'ניווט',
        startDate: new Date('2024-02-11'),
        profileImage: null,
        certifications: []
    },
    {
        employeeNumber: '32450',
        firstName: 'לאון',
        lastName: 'יוסופוב',
        phoneNumber: '053-6247455',
        email: '',
        role: 'טכנאי ניווט',
        department: 'ניווט',
        startDate: new Date('2024-04-01'),
        profileImage: null,
        certifications: []
    }
];

async function importEmployees() {
    console.log('🚀 מתחיל להוסיף עובדים למסד הנתונים...\n');
    
    let successCount = 0;
    let errorCount = 0;
    
    try {
        for (let i = 0; i < employees.length; i++) {
            const emp = employees[i];
            try {
                console.log(`[${i + 1}/${employees.length}] מוסיף: ${emp.firstName} ${emp.lastName} (${emp.employeeNumber})...`);
                
                await EmployeeModel.create(emp);
                successCount++;
                console.log(`   ✅ הצלחה!\n`);
                
            } catch (error) {
                errorCount++;
                console.error(`   ❌ שגיאה: ${error.message}\n`);
            }
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('🎉 סיום!');
        console.log('='.repeat(50));
        console.log(`✅ הצלחה: ${successCount} עובדים`);
        console.log(`❌ כשלון: ${errorCount} עובדים`);
        console.log('='.repeat(50) + '\n');
        
    } catch (error) {
        console.error('\n💥 שגיאה כללית:', error);
    } finally {
        // סגירת החיבור
        await db.pool.end();
        console.log('👋 החיבור למסד הנתונים נסגר');
        process.exit(0);
    }
}

// הרצת הסקריפט
if (require.main === module) {
    importEmployees();
}

module.exports = { importEmployees };

