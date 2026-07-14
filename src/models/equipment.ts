export interface Equipment {
    _id?: string;
    name: string;                      // שם הצב״ד
    serialNumber: string;              // מספר סידורי
    company?: string;                  // חברה
    lastCalibrationDate: string;       // תאריך כיול אחרון
    nextCalibrationDate: string;       // תאריך כיול הבא
    status?: 'valid' | 'expiring' | 'expired' | 'not-required' | 'in-calibration';
    certificate?: string;              // תעודת כיול (PDF/תמונה) - נטען בעת הצורך
    hasCertificate?: boolean;          // האם יש תעודה (להצגה מהירה)
    inCalibration?: boolean;           // האם הצב״ד נמצא בכיול כרגע
    calibrationNotRequired?: boolean;  // לא נדרש כיול - מעקב בלבד, ללא התראות
    category?: string;                 // קטגוריה
    location?: string;                 // מיקום
    notes?: string;                    // הערות
    displayOrder?: number;             // סדר תצוגה
}

// חישוב סטטוס לפי תאריך בלבד (לא מתחשב בדגלים)
export const calculateDateStatus = (nextCalibrationDate: string): 'valid' | 'expiring' | 'expired' => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(nextCalibrationDate);
    nextDate.setHours(0, 0, 0, 0);
    
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
        return 'expired';
    } else if (diffDays <= 30) {
        return 'expiring';
    } else {
        return 'valid';
    }
};

// חישוב סטטוס מלא - כולל דגלים
export const calculateEquipmentStatus = (
    nextCalibrationDate: string,
    equipment?: Pick<Equipment, 'inCalibration' | 'calibrationNotRequired'>
): 'valid' | 'expiring' | 'expired' | 'not-required' | 'in-calibration' => {
    if (equipment?.calibrationNotRequired) {
        return 'not-required';
    }
    if (equipment?.inCalibration) {
        return 'in-calibration';
    }
    return calculateDateStatus(nextCalibrationDate);
};

// האם הציוד נספר בהתראות (תפוגה / מתקרב)
export const countsTowardAlerts = (eq: Equipment): boolean => {
    return !eq.calibrationNotRequired && !eq.inCalibration;
};

export const getStatusColor = (
    status: 'valid' | 'expiring' | 'expired' | 'not-required' | 'in-calibration'
): string => {
    switch (status) {
        case 'valid':
            return 'bg-green-100 text-green-800 border-green-300';
        case 'expiring':
            return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        case 'expired':
            return 'bg-red-100 text-red-800 border-red-300';
        case 'in-calibration':
            return 'bg-purple-100 text-purple-800 border-purple-300';
        case 'not-required':
            return 'bg-gray-100 text-gray-700 border-gray-300';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-300';
    }
};

export const getStatusText = (
    status: 'valid' | 'expiring' | 'expired' | 'not-required' | 'in-calibration'
): string => {
    switch (status) {
        case 'valid':
            return '✓ כיול בתוקף';
        case 'expiring':
            return '⚠ מתקרב לפקיעה';
        case 'expired':
            return '✗ נדרש כיול';
        case 'in-calibration':
            return '🔧 בכיול כרגע';
        case 'not-required':
            return '○ לא נדרש כיול';
        default:
            return 'לא ידוע';
    }
};
