const equipmentData = require('./src/data/equipment-data.json');

const API_URL = 'http://localhost:5001/api/equipment';

async function importEquipment() {
    console.log('=========================================');
    console.log('  ייבוא נתוני ציוד למסד הנתונים');
    console.log('=========================================\n');
    console.log(`מצאתי ${equipmentData.length} פריטי ציוד לייבוא\n`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < equipmentData.length; i++) {
        const equipment = equipmentData[i];
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(equipment),
            });

            if (response.ok) {
                successCount++;
                console.log(`✓ [${i + 1}/${equipmentData.length}] ${equipment.name} - ${equipment.serialNumber}`);
            } else {
                const error = await response.json();
                errorCount++;
                errors.push({ equipment: equipment.name, error: error.message });
                console.log(`✗ [${i + 1}/${equipmentData.length}] ${equipment.name} - שגיאה: ${error.message}`);
            }
        } catch (error) {
            errorCount++;
            errors.push({ equipment: equipment.name, error: error.message });
            console.log(`✗ [${i + 1}/${equipmentData.length}] ${equipment.name} - שגיאה: ${error.message}`);
        }

        // המתנה קצרה בין בקשות
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n=========================================');
    console.log('  סיכום ייבוא');
    console.log('=========================================');
    console.log(`✓ הצלחות: ${successCount}`);
    console.log(`✗ שגיאות: ${errorCount}`);
    
    if (errors.length > 0) {
        console.log('\nשגיאות:');
        errors.forEach(err => {
            console.log(`  - ${err.equipment}: ${err.error}`);
        });
    }
    
    console.log('\n✓✓✓ ייבוא הושלם! ✓✓✓\n');
}

// בדיקה שהשרת רץ
fetch(API_URL)
    .then(() => {
        console.log('✓ השרת רץ - מתחיל ייבוא...\n');
        return importEquipment();
    })
    .catch(error => {
        console.error('✗ השרת לא רץ!');
        console.error('אנא הרץ את השרת קודם:');
        console.error('  cd server && npm run server\n');
        process.exit(1);
    });

