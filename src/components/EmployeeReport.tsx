import React, { useState } from 'react';
import { Employee, Certification } from '../models/employee';
import { Users, Download, Printer, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';

interface EmployeeReportProps {
    employee: Employee;
    onClose: () => void;
}

const EmployeeReport: React.FC<EmployeeReportProps> = ({ employee, onClose }) => {
    const [showPrintVersion, setShowPrintVersion] = useState(false);

    const formatDate = (dateString: string | Date) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('he-IL');
    };

    const getCertificationStatus = (expiryDate: Date) => {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const monthsUntilExpiry = Math.ceil(daysUntilExpiry / 30);

        if (daysUntilExpiry < 0) {
            return { 
                color: 'text-red-600', 
                bgColor: 'bg-red-50',
                text: 'פג תוקף',
                icon: <XCircle className="w-4 h-4 text-red-600" />
            };
        } else if (daysUntilExpiry <= 90) {
            return { 
                color: 'text-orange-600', 
                bgColor: 'bg-orange-50',
                text: `פג תוקף בקרוב (${monthsUntilExpiry} חודשים)`,
                icon: <Clock className="w-4 h-4 text-orange-600" />
            };
        }
        return { 
            color: 'text-green-600', 
            bgColor: 'bg-green-50',
            text: 'בתוקף',
            icon: <CheckCircle className="w-4 h-4 text-green-600" />
        };
    };

    const calculateQualification = () => {
        // חישוב ציון הסמכות (50%)
        const REQUIRED_CERTIFICATIONS = 7;
        const PROGRESS_PER_CERTIFICATION = Math.round(100 / REQUIRED_CERTIFICATIONS);
        
        const validRequiredCerts = employee.certifications.filter(cert => {
            const isValid = new Date(cert.expiryDate) > new Date();
            const hasOJT = cert.ojt1 && cert.ojt2;
            return cert.isRequired && isValid && hasOJT;
        }).length;

        const certScore = Math.min((validRequiredCerts * PROGRESS_PER_CERTIFICATION), 100) * 0.5;

        // חישוב ציון הוותק (50%)
        const experienceYears = Math.min(
            ((new Date().getTime() - new Date(employee.startDate).getTime()) / (1000 * 60 * 60 * 24 * 365)),
            3
        ) / 3;
        const experienceScore = experienceYears * 100 * 0.5;

        // ציון כולל
        return Math.round(certScore + experienceScore);
    };
    
    const getQualificationColor = (score: number) => {
        if (score >= 90) return 'text-green-600 bg-green-50';
        if (score >= 70) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    const exportToExcel = () => {
        // הכנת נתונים לאקסל
        const certData = employee.certifications.map(cert => {
            const certStatus = getCertificationStatus(cert.expiryDate);
            return {
                'שם ההסמכה': cert.name,
                'חובה': cert.isRequired ? 'כן' : 'לא',
                'תאריך תפוגה': formatDate(cert.expiryDate),
                'סטטוס': certStatus.text,
                'OJT ראשון - חונך': cert.ojt1?.mentor || '',
                'OJT ראשון - תאריך': cert.ojt1 ? formatDate(cert.ojt1.date) : '',
                'OJT שני - חונך': cert.ojt2?.mentor || '',
                'OJT שני - תאריך': cert.ojt2 ? formatDate(cert.ojt2.date) : '',
            };
        });

        const employeeData = [
            {
                'שם פרטי': employee.firstName,
                'שם משפחה': employee.lastName,
                'מספר עובד': employee.employeeNumber,
                'תפקיד': employee.role,
                'מחלקה': employee.department,
                'טלפון': employee.phoneNumber,
                'אימייל': employee.email,
                'תאריך תחילת עבודה': formatDate(employee.startDate),
                'ציון כשירות': `${calculateQualification()}%`
            }
        ];

        // יצירת workbook חדש
        const wb = XLSX.utils.book_new();
        
        // הוספת דף עובד
        const empWs = XLSX.utils.json_to_sheet(employeeData);
        XLSX.utils.book_append_sheet(wb, empWs, "פרטי עובד");
        
        // הוספת דף הסמכות
        const certWs = XLSX.utils.json_to_sheet(certData);
        XLSX.utils.book_append_sheet(wb, certWs, "הסמכות");
        
        // הורדת הקובץ
        XLSX.writeFile(wb, `דוח_עובד_${employee.firstName}_${employee.lastName}.xlsx`);
    };

    const handlePrint = () => {
        setShowPrintVersion(true);
        setTimeout(() => {
            window.print();
            setShowPrintVersion(false);
        }, 100);
    };

    return (
        <div className={`${showPrintVersion ? 'bg-white fixed inset-0 z-50 overflow-auto p-8' : 'bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto'}`}>
            {!showPrintVersion && (
                <div className="flex justify-between items-center mb-6 print:hidden">
                    <h2 className="text-2xl font-bold">דוח עובד</h2>
                    <div className="flex gap-3">
                        <button
                            onClick={exportToExcel}
                            className="flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-lg hover:bg-green-100 transition-colors"
                        >
                            <Download size={16} />
                            <span>יצוא לאקסל</span>
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                            <Printer size={16} />
                            <span>הדפסה</span>
                        </button>
                        {!showPrintVersion && (
                            <button
                                onClick={onClose}
                                className="flex items-center gap-2 bg-gray-50 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <span>סגור</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Employee Header */}
            <div className="flex flex-col md:flex-row gap-6 mb-8 items-center md:items-start">
                <div className="w-32 h-32 overflow-hidden rounded-full border-4 border-gray-200 flex-shrink-0">
                    {employee.profileImage ? (
                        <img
                            src={employee.profileImage}
                            alt={`${employee.firstName} ${employee.lastName}`}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <Users size={40} className="text-gray-400" />
                        </div>
                    )}
                </div>
                
                <div className="flex-1">
                    <div className="text-center md:text-right">
                        <h3 className="text-2xl font-bold mb-1">{employee.firstName} {employee.lastName}</h3>
                        <p className="text-gray-600 mb-4">{employee.role} • {employee.department}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-700 mb-3">פרטי עובד</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">מספר עובד:</span>
                                    <span>{employee.employeeNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">טלפון:</span>
                                    <span dir="ltr">{employee.phoneNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">אימייל:</span>
                                    <span dir="ltr">{employee.email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">תאריך תחילת עבודה:</span>
                                    <span>{formatDate(employee.startDate)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-700 mb-3">מידע על כשירות</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">ציון כשירות:</span>
                                    <span className={`px-2 py-1 rounded-full ${getQualificationColor(calculateQualification())}`}>
                                        {calculateQualification()}%
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">מספר הסמכות:</span>
                                    <span>{employee.certifications.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">הסמכות חובה בתוקף:</span>
                                    <span>
                                        {employee.certifications.filter(cert => 
                                            cert.isRequired && new Date(cert.expiryDate) > new Date()
                                        ).length} / {employee.certifications.filter(cert => cert.isRequired).length}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">ותק:</span>
                                    <span>
                                        {Math.floor((new Date().getTime() - new Date(employee.startDate).getTime()) / 
                                        (1000 * 60 * 60 * 24 * 365))} שנים
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Certifications */}
            <div>
                <h3 className="text-xl font-bold mb-4 border-b pb-2">פירוט הסמכות ({employee.certifications.length})</h3>
                
                {employee.certifications.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        אין הסמכות להצגה
                    </div>
                ) : (
                    <div className="space-y-4">
                        {employee.certifications.map((cert, index) => {
                            const certStatus = getCertificationStatus(cert.expiryDate);
                            return (
                                <div 
                                    key={index} 
                                    className={`border rounded-lg overflow-hidden ${cert.isRequired ? 'border-blue-200' : 'border-gray-200'}`}
                                >
                                    <div className={`p-4 flex flex-col md:flex-row justify-between gap-4 ${cert.isRequired ? 'bg-blue-50' : 'bg-white'}`}>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h4 className="font-semibold">{cert.name}</h4>
                                                {cert.isRequired && (
                                                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                                                        חובה
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <span className="text-gray-500 text-sm">תאריך תפוגה:</span>
                                                    <div className="flex items-center gap-1">
                                                        <span>{formatDate(cert.expiryDate)}</span>
                                                        <span className={`mr-2 text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${certStatus.bgColor} ${certStatus.color}`}>
                                                            {certStatus.icon}
                                                            {certStatus.text}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div>
                                                    <span className="text-gray-500 text-sm">OJT ראשון:</span>
                                                    {cert.ojt1 ? (
                                                        <div>
                                                            <div className="flex gap-1">
                                                                <span className="font-medium">{cert.ojt1.mentor}</span>
                                                                <span className="text-gray-400">|</span>
                                                                <span>{formatDate(cert.ojt1.date)}</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 italic">טרם בוצע</span>
                                                    )}
                                                </div>
                                                
                                                <div>
                                                    <span className="text-gray-500 text-sm">OJT שני:</span>
                                                    {cert.ojt2 ? (
                                                        <div>
                                                            <div className="flex gap-1">
                                                                <span className="font-medium">{cert.ojt2.mentor}</span>
                                                                <span className="text-gray-400">|</span>
                                                                <span>{formatDate(cert.ojt2.date)}</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 italic">טרם בוצע</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {cert.certificate && (
                                            <div className="flex items-center">
                                                <button
                                                    onClick={() => window.open(cert.certificate)}
                                                    className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full 
                                                    hover:bg-gray-200 transition-colors flex items-center gap-1"
                                                >
                                                    <FileText size={14} className="text-blue-500" />
                                                    צפה בתעודה
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-8 text-center text-gray-500 text-sm">
                <p>דוח זה הופק בתאריך {formatDate(new Date())}</p>
            </div>
        </div>
    );
};

export default EmployeeReport;