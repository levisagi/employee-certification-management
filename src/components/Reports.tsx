import React, { useState, useEffect } from 'react';
import { Employee, Certification } from '../models/employee';
import * as XLSX from 'xlsx';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { FileText, Download, User, Users, Printer } from 'lucide-react';
import EmployeeReport from './EmployeeReport'
interface ReportsProps {
    employees: Employee[];
}

const Reports: React.FC<ReportsProps> = ({ employees }) => {
    const [selectedReport, setSelectedReport] = useState<string>('');
    const [reportData, setReportData] = useState<any[]>([]);
    const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
        from: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
    });
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [showEmployeeReport, setShowEmployeeReport] = useState(false);
    const [showPrintVersion, setShowPrintVersion] = useState(false);

    // דוחות מותאמים אישית
    const reports = [
        {
            category: 'דוחות עובדים',
            items: [
                { id: 'employee-details', name: 'דוח פרטי עובד', description: 'דוח מפורט עם כל הפרטים וההסמכות של עובד' },
                { id: 'expiring-certs', name: 'הסמכות פגות תוקף', description: 'רשימת כל ההסמכות שפגו תוקף או יפוגו בקרוב' },
                { id: 'missing-ojt', name: 'עובדים ללא OJT', description: 'רשימת עובדים שחסר להם OJT' }
            ]
        },
        {
            category: 'דוחות סטטיסטיים',
            items: [
                { id: 'department-stats', name: 'כשירות לפי מחלקות', description: 'פילוח כשירות עובדים לפי מחלקות' },
                { id: 'qualification-summary', name: 'סיכום כשירות', description: 'תמונת מצב של כשירות בארגון' }
            ]
        }
    ];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

    useEffect(() => {
        if (selectedReport) {
            generateReportData();
        }
    }, [selectedReport, dateRange]);

    const generateReportData = () => {
        switch (selectedReport) {
            case 'expiring-certs':
                generateExpiringCertificationsReport();
                break;
            case 'missing-ojt':
                generateMissingOJTReport();
                break;
            case 'department-stats':
                generateDepartmentStatsReport();
                break;
            case 'qualification-summary':
                generateQualificationSummaryReport();
                break;
            case 'employee-details':
                // בחירת עובד במקום יצירת דו"ח
                break;
            default:
                setReportData([]);
        }
    };

    const exportToExcel = () => {
        if (!reportData.length) return;

        const ws = XLSX.utils.json_to_sheet(reportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Report");
        XLSX.writeFile(wb, `${selectedReport}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const generateExpiringCertificationsReport = () => {
        const now = new Date();
        const threeMonthsFromNow = new Date();
        threeMonthsFromNow.setMonth(now.getMonth() + 3);

        const expiringCerts = employees.flatMap(emp => 
            emp.certifications
                .filter(cert => {
                    const expiryDate = new Date(cert.expiryDate);
                    return expiryDate <= threeMonthsFromNow;
                })
                .map(cert => ({
                    שם_עובד: `${emp.firstName} ${emp.lastName}`,
                    מחלקה: emp.department,
                    שם_הסמכה: cert.name,
                    הסמכת_חובה: cert.isRequired ? 'כן' : 'לא',
                    תאריך_תפוגה: new Date(cert.expiryDate).toLocaleDateString('he-IL'),
                    ימים_לתפוגה: Math.ceil((new Date(cert.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
                    סטטוס: new Date(cert.expiryDate) < now ? 'פג תוקף' : 'עומד לפוג בקרוב'
                }))
        );

        expiringCerts.sort((a, b) => a.ימים_לתפוגה - b.ימים_לתפוגה);
        setReportData(expiringCerts);
    };

    const generateMissingOJTReport = () => {
        const missingOJT = employees.flatMap(emp => 
            emp.certifications
                .filter(cert => !cert.ojt1 || !cert.ojt2)
                .map(cert => ({
                    שם_עובד: `${emp.firstName} ${emp.lastName}`,
                    מחלקה: emp.department,
                    תפקיד: emp.role,
                    שם_הסמכה: cert.name,
                    הסמכת_חובה: cert.isRequired ? 'כן' : 'לא',
                    OJT1_חסר: cert.ojt1 ? 'לא' : 'כן',
                    OJT2_חסר: cert.ojt2 ? 'לא' : 'כן',
                    תאריך_תפוגה: new Date(cert.expiryDate).toLocaleDateString('he-IL')
                }))
        );

        setReportData(missingOJT);
    };

    const generateDepartmentStatsReport = () => {
        const departmentStats = employees.reduce((acc: Record<string, any>, emp) => {
            const dept = emp.department;
            if (!acc[dept]) {
                acc[dept] = { 
                    מחלקה: dept, 
                    סה_כ_עובדים: 0, 
                    סה_כ_הסמכות: 0, 
                    הסמכות_תקפות: 0, 
                    הסמכות_פגות: 0, 
                    כשירות_ממוצעת: 0,
                    סה_כ_ציוני_כשירות: 0
                };
            }
            
            acc[dept].סה_כ_עובדים++;
            
            // חישוב כשירות עובד - עודכן ל-60% ניסיון, 40% הסמכות
            const qualification = calculateEmployeeQualification(emp);
            acc[dept].סה_כ_ציוני_כשירות += qualification;
            
            emp.certifications.forEach(cert => {
                acc[dept].סה_כ_הסמכות++;
                if (new Date(cert.expiryDate) > new Date()) {
                    acc[dept].הסמכות_תקפות++;
                } else {
                    acc[dept].הסמכות_פגות++;
                }
            });
            
            return acc;
        }, {});
        
        // חישוב ממוצעים
        Object.values(departmentStats).forEach((dept: any) => {
            dept.כשירות_ממוצעת = Math.round(dept.סה_כ_ציוני_כשירות / dept.סה_כ_עובדים);
            delete dept.סה_כ_ציוני_כשירות;
        });

        setReportData(Object.values(departmentStats));
    };

    const generateQualificationSummaryReport = () => {
        const qualificationStats = {
            סה_כ_עובדים: employees.length,
            סה_כ_הסמכות: 0,
            הסמכות_תקפות: 0,
            הסמכות_פגות_תוקף: 0,
            עובדים_כשירים_מלא: 0,
            עובדים_כשירים_חלקית: 0,
            עובדים_לא_כשירים: 0,
            כשירות_ממוצעת: 0
        };
        
        let totalQualification = 0;
        
        employees.forEach(emp => {
            const qualification = calculateEmployeeQualification(emp);
            totalQualification += qualification;
            
            if (qualification >= 90) qualificationStats.עובדים_כשירים_מלא++;
            else if (qualification >= 70) qualificationStats.עובדים_כשירים_חלקית++;
            else qualificationStats.עובדים_לא_כשירים++;
            
            emp.certifications.forEach(cert => {
                qualificationStats.סה_כ_הסמכות++;
                if (new Date(cert.expiryDate) > new Date()) {
                    qualificationStats.הסמכות_תקפות++;
                } else {
                    qualificationStats.הסמכות_פגות_תוקף++;
                }
            });
        });
        
        qualificationStats.כשירות_ממוצעת = Math.round(totalQualification / employees.length);
        
        setReportData([qualificationStats]);
    };

    const calculateEmployeeQualification = (employee: Employee) => {
        // חישוב ציון ההסמכות (40%)
        const REQUIRED_CERTIFICATIONS = 7;
        const PROGRESS_PER_CERTIFICATION = Math.round(100 / REQUIRED_CERTIFICATIONS);
        
        const validRequiredCerts = employee.certifications.filter(cert => {
            const isValid = new Date(cert.expiryDate) > new Date();
            const hasOJT = cert.ojt1 && cert.ojt2;
            return cert.isRequired && isValid && hasOJT;
        }).length;

        const certScore = Math.min((validRequiredCerts * PROGRESS_PER_CERTIFICATION), 100) * 0.4;

        // חישוב ציון הוותק (60%)
        const experienceYears = Math.min(
            ((new Date().getTime() - new Date(employee.startDate).getTime()) / (1000 * 60 * 60 * 24 * 365)),
            3
        ) / 3;
        const experienceScore = experienceYears * 100 * 0.6;

        // ציון כולל
        return Math.round(certScore + experienceScore);
    };

    const selectEmployeeForReport = (employee: Employee) => {
        setSelectedEmployee(employee);
        setShowEmployeeReport(true);
    };

    const handlePrintReport = () => {
        setShowPrintVersion(true);
        setTimeout(() => {
            window.print();
            setShowPrintVersion(false);
        }, 100);
    };

    return (
        <div className="container mx-auto p-6">
            {showEmployeeReport && selectedEmployee ? (
                <EmployeeReport 
                    employee={selectedEmployee} 
                    onClose={() => setShowEmployeeReport(false)}
                />
            ) : (
                <div className="bg-white rounded-lg shadow-lg p-6">
                    {/* כותרת עם לוגו */}
                    <div className="flex items-center gap-3 mb-6">
                        <img src="/images/logo.svg" alt="CertVision Logo" className="h-8 w-8" />
                        <h2 className="text-2xl font-bold">דוחות וניתוח נתונים</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        {reports.map((category) => (
                            <div key={category.category} className="bg-gray-50 rounded-lg p-4">
                                <h3 className="text-lg font-semibold mb-4 text-gray-700">{category.category}</h3>
                                <div className="space-y-2">
                                {category.items.map((report) => (
                                        <button
                                            key={report.id}
                                            onClick={() => setSelectedReport(report.id)}
                                            className={`w-full text-right px-4 py-2 rounded-lg text-sm
                                            hover:bg-blue-50 hover:text-blue-600 transition-colors
                                            flex items-center justify-between
                                            ${selectedReport === report.id ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                                            title={report.description}
                                        >
                                            <span>{report.name}</span>
                                            <FileText size={16} className="text-gray-400" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {selectedReport && (
                        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-semibold">
                                    {reports.flatMap(cat => cat.items).find(item => item.id === selectedReport)?.name}
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={exportToExcel}
                                        className="flex items-center gap-2 bg-green-50 text-green-600 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors"
                                    >
                                        <Download size={16} />
                                        <span>יצוא לאקסל</span>
                                    </button>
                                    <button
                                        onClick={handlePrintReport}
                                        className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                                    >
                                        <Printer size={16} />
                                        <span>הדפסה</span>
                                    </button>
                                </div>
                            </div>

                            {selectedReport === 'employee-details' ? (
                                <div>
                                    <p className="mb-4 text-gray-600">בחר עובד מהרשימה כדי להציג דוח מפורט:</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {employees.map((employee) => (
                                            <button
                                                key={employee._id}
                                                onClick={() => selectEmployeeForReport(employee)}
                                                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors text-left"
                                            >
                                                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                                                    {employee.profileImage ? (
                                                        <img 
                                                            src={employee.profileImage} 
                                                            alt={employee.firstName} 
                                                            className="w-full h-full object-cover" 
                                                        />
                                                    ) : (
                                                        <User size={20} className="text-gray-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium">{employee.firstName} {employee.lastName}</div>
                                                    <div className="text-sm text-gray-500">{employee.role}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : reportData.length === 0 ? (
                                <div className="text-center py-10 text-gray-500">
                                    <p>אין נתונים להצגה</p>
                                </div>
                            ) : (
                                <>
                                    {/* Data Table */}
                                    <div className="overflow-x-auto mb-6">
                                        <table className="min-w-full bg-white border border-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    {Object.keys(reportData[0]).map(key => (
                                                        <th key={key} className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                                            {key.replace(/_/g, ' ')}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {reportData.map((row, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50">
                                                        {Object.keys(row).map(key => (
                                                            <td key={key} className="px-4 py-2 text-sm text-gray-700 border-b">
                                                                {row[key].toString()}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Charts for Specific Reports */}
                                    {selectedReport === 'department-stats' && (
                                        <div className="h-80 mt-8">
                                            <h4 className="text-lg font-semibold mb-4">כשירות ממוצעת לפי מחלקות</h4>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={reportData}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="מחלקה" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Bar dataKey="כשירות_ממוצעת" fill="#0088FE" name="כשירות ממוצעת" />
                                                    <Bar dataKey="סה_כ_עובדים" fill="#00C49F" name="מספר עובדים" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}

                                    {selectedReport === 'qualification-summary' && reportData.length > 0 && (
                                        <div className="h-80 mt-8">
                                            <h4 className="text-lg font-semibold mb-4">התפלגות כשירות עובדים</h4>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={[
                                                            { name: 'כשירים מלא', value: reportData[0].עובדים_כשירים_מלא },
                                                            { name: 'כשירים חלקית', value: reportData[0].עובדים_כשירים_חלקית },
                                                            { name: 'לא כשירים', value: reportData[0].עובדים_לא_כשירים }
                                                        ]}
                                                        cx="50%"
                                                        cy="50%"
                                                        labelLine={false}
                                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                        outerRadius={80}
                                                        fill="#8884d8"
                                                        dataKey="value"
                                                    >
                                                        {[0, 1, 2].map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            {showPrintVersion && (
                <div className="fixed inset-0 bg-white z-50 p-8 print:p-0">
                    <div className="flex flex-col items-center mb-8">
                        <img src="/images/logo.svg" alt="CertVision Logo" className="h-20 w-20 mb-3" />
                        <h1 className="text-2xl font-bold text-center mb-1">CertVision</h1>
                        <p className="text-sm text-gray-600 mb-4">Certification Management Excellence</p>
                        <h2 className="text-xl font-bold">{reports.flatMap(c => c.items).find(r => r.id === selectedReport)?.name}</h2>
                    </div>
                    
                    {/* כל סוגי הדוחות משתמשים באותה תבנית טבלה לצורך הדפסה */}
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                {reportData.length > 0 && Object.keys(reportData[0]).map(key => (
                                    <th key={key} className="border border-gray-300 px-4 py-2 text-right">{key}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.map((row, i) => (
                                <tr key={i}>
                                    {Object.values(row).map((value, j) => (
                                        <td key={j} className="border border-gray-300 px-4 py-2">{String(value)}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Reports;