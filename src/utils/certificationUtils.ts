import { Certification } from '../models/employee';

export function getDaysUntilExpiry(certification: Certification): number {
    const today = new Date();
    const expiryDate = new Date(certification.expiryDate);
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function updateCertificationStatus(expiryDate: Date): 'valid' | 'expired' | 'expiring-soon' {
    const daysUntilExpiry = getDaysUntilExpiry({ expiryDate } as Certification);
    
    if (daysUntilExpiry < 0) {
        return 'expired';
    } else if (daysUntilExpiry <= 365) { // 12 חודשים
        return 'expiring-soon';
    } else {
        return 'valid';
    }
}

export function getStatusText(status: string): string {
    switch (status) {
        case 'valid':
            return 'בתוקף';
        case 'expired':
            return 'פג תוקף';
        case 'expiring-soon':
            return 'עומד לפוג בשנה הקרובה';
        default:
            return '';
    }
}
