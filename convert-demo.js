const XLSX = require('xlsx');
const fs = require('fs');

// קריאת הקובץ
const workbook = XLSX.readFile('demo.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log('מצאתי', data.length, 'שורות בקובץ');
console.log('דוגמה מהשורה הראשונה:', JSON.stringify(data[0], null, 2));

// המרת הנתונים לפורמט של המערכת
const equipment = data.map((row, index) => {
    // מציאת תאריך כיול הבא (יכול להיות בשמות שונים)
    const nextCalibrationDateKey = Object.keys(row).find(key => 
        key.includes('תאריך') || key.includes('כיול') || key.includes('הבא') || 
        key.toLowerCase().includes('date') || key.toLowerCase().includes('next')
    );
    
    const nextCalibrationDateStr = row[nextCalibrationDateKey];
    
    // המרת תאריך מ-Excel (מספר) לתאריך רגיל
    let nextCalibrationDate;
    if (typeof nextCalibrationDateStr === 'number') {
        // Excel מחזיק תאריכים כמספרים (ימים מ-1/1/1900)
        const excelEpoch = new Date(1899, 11, 30);
        nextCalibrationDate = new Date(excelEpoch.getTime() + nextCalibrationDateStr * 86400000);
    } else if (nextCalibrationDateStr) {
        nextCalibrationDate = new Date(nextCalibrationDateStr);
    } else {
        // אם אין תאריך, נשתמש בתאריך עתידי
        nextCalibrationDate = new Date();
        nextCalibrationDate.setFullYear(nextCalibrationDate.getFullYear() + 1);
    }
    
    // חישוב תאריך כיול אחרון - בדיוק שנה אחורה
    const lastCalibrationDate = new Date(nextCalibrationDate);
    lastCalibrationDate.setFullYear(lastCalibrationDate.getFullYear() - 1);
    
    // פורמט תאריך ל-YYYY-MM-DD
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    // מציאת שמות העמודות
    const nameKey = Object.keys(row).find(key => 
        key.includes('שם') || key.includes('ציוד') || key.toLowerCase().includes('name') || key.toLowerCase().includes('equipment')
    ) || Object.keys(row)[0];
    
    const serialKey = Object.keys(row).find(key => 
        key.includes('מספר') || key.includes('סידורי') || key.toLowerCase().includes('serial') || key.toLowerCase().includes('number')
    ) || Object.keys(row)[1];
    
    const companyKey = Object.keys(row).find(key => 
        key.includes('חברה') || key.toLowerCase().includes('company') || key.toLowerCase().includes('manufacturer')
    );
    
    const categoryKey = Object.keys(row).find(key => 
        key.includes('קטגוריה') || key.includes('סוג') || key.toLowerCase().includes('category') || key.toLowerCase().includes('type')
    );
    
    return {
        _id: (index + 1).toString(),
        name: row[nameKey] || `ציוד ${index + 1}`,
        serialNumber: row[serialKey] || `SN-${String(index + 1).padStart(4, '0')}`,
        company: row[companyKey] || '',
        lastCalibrationDate: formatDate(lastCalibrationDate),
        nextCalibrationDate: formatDate(nextCalibrationDate),
        category: row[categoryKey] || '',
        location: 'נתב״ג',
        notes: '',
    };
});

console.log('\nהומרו', equipment.length, 'רשומות');
console.log('\nדוגמה לרשומה ראשונה:');
console.log(JSON.stringify(equipment[0], null, 2));

// שמירת הנתונים לקובץ JSON
const outputData = {
    equipment: equipment,
    importDate: new Date().toISOString(),
    totalRecords: equipment.length
};

fs.writeFileSync('equipment-import.json', JSON.stringify(outputData, null, 2));
console.log('\n✓ הנתונים נשמרו בקובץ equipment-import.json');
console.log('\nכעת העתק את התוכן של equipment-import.json והדבק אותו במערכת.');

