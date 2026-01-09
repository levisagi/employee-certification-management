export interface Equipment {
    _id?: string;
    name: string;                      // שם הצב״ד
    serialNumber: string;              // מספר סידורי
    company?: string;                  // חברה
    lastCalibrationDate: string;       // תאריך כיול אחרון
    nextCalibrationDate: string;       // תאריך כיול הבא
    status?: 'valid' | 'expiring' | 'expired';  // סטטוס (מחושב אוטומטית)
    certificate?: string;              // תעודת כיול (PDF/תמונה)
    category?: string;                 // קטגוריה
    location?: string;                 // מיקום
    notes?: string;                    // הערות
    displayOrder?: number;             // סדר תצוגה
}

// פונקציה לחישוב סטטוס הציוד
export const calculateEquipmentStatus = (nextCalibrationDate: string): 'valid' | 'expiring' | 'expired' => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(nextCalibrationDate);
    nextDate.setHours(0, 0, 0, 0);
    
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
        return 'expired';  // פג תוקף
    } else if (diffDays <= 30) {
        return 'expiring'; // מתקרב לפקיעה (30 ימים)
    } else {
        return 'valid';    // תקף
    }
};

// פונקציה לקבלת צבע לפי סטטוס
export const getStatusColor = (status: 'valid' | 'expiring' | 'expired'): string => {
    switch (status) {
        case 'valid':
            return 'bg-green-100 text-green-800 border-green-300';
        case 'expiring':
            return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        case 'expired':
            return 'bg-red-100 text-red-800 border-red-300';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-300';
    }
};

// פונקציה לקבלת טקסט סטטוס בעברית
export const getStatusText = (status: 'valid' | 'expiring' | 'expired'): string => {
    switch (status) {
        case 'valid':
            return '✓ כיול בתוקף';
        case 'expiring':
            return '⚠ מתקרב לפקיעה';
        case 'expired':
            return '✗ נדרש כיול';
        default:
            return 'לא ידוע';
    }
};

