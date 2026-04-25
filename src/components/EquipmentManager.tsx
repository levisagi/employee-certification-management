import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, AlertCircle, CheckCircle, Clock, ShoppingCart, Printer, FileText } from 'lucide-react';
import EquipmentTable from './EquipmentTable';
import EquipmentCard from './EquipmentCard';
import EquipmentForm from './EquipmentForm';
import { Equipment, calculateEquipmentStatus } from '../models/equipment';
import { APP_VERSION } from '../version';
import { 
    fetchEquipment, 
    createEquipment, 
    updateEquipment, 
    deleteEquipment,
    fetchEquipmentCertificate
} from '../services/equipmentApi';

interface EquipmentManagerProps {
    onBackToHome?: () => void;
}

const EquipmentManager: React.FC<EquipmentManagerProps> = ({ onBackToHome }) => {
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'expiring' | 'expired'>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [modalStatus, setModalStatus] = useState<'valid' | 'expiring' | 'expired' | null>(null);
    
    // סל כיול
    const [calibrationCart, setCalibrationCart] = useState<Equipment[]>([]);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [showCart, setShowCart] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    
    // הצגת תעודה
    const [selectedCertificate, setSelectedCertificate] = useState<string | null>(null);
    const [loadingCertificate, setLoadingCertificate] = useState(false);
    
    // דוחות
    const [showReportsModal, setShowReportsModal] = useState(false);
    
    // ⚡ טעינת תעודה בעת הצורך (lazy loading)
    const handleViewCertificate = async (equipmentItem: Equipment) => {
        if (!equipmentItem._id) return;
        
        // אם התעודה כבר נטענה במטמון - השתמש בה
        if (equipmentItem.certificate) {
            setSelectedCertificate(equipmentItem.certificate);
            return;
        }
        
        setLoadingCertificate(true);
        try {
            const certificate = await fetchEquipmentCertificate(equipmentItem._id);
            setSelectedCertificate(certificate);
            
            // שמירה במטמון מקומי למניעת טעינות חוזרות
            setEquipment(prev => prev.map(eq => 
                eq._id === equipmentItem._id ? { ...eq, certificate } : eq
            ));
        } catch (error) {
            console.error('Error loading certificate:', error);
            alert('שגיאה בטעינת התעודה');
        } finally {
            setLoadingCertificate(false);
        }
    };

    // טעינת נתונים מהשרת
    useEffect(() => {
        loadEquipment();
    }, []);

    const loadEquipment = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchEquipment();
            setEquipment(data);
        } catch (err: any) {
            console.error('Failed to load equipment:', err);
            setError('שגיאה בטעינת הציוד. נסה שוב מאוחר יותר.');
        } finally {
            setLoading(false);
        }
    };

    // הוספת ציוד חדש
    const handleAddEquipment = async (newEquipment: Equipment) => {
        try {
            const created = await createEquipment(newEquipment);
            setEquipment([...equipment, created]);
            setShowForm(false);
        } catch (err: any) {
            alert(`שגיאה בהוספת ציוד: ${err.message}`);
        }
    };

    // עדכון ציוד קיים
    const handleEditEquipment = async (updatedEquipment: Equipment) => {
        try {
            const updated = await updateEquipment(updatedEquipment._id!, updatedEquipment);
            setEquipment(equipment.map(eq => 
                eq._id === updated._id ? updated : eq
            ));
            setShowForm(false);
            setEditingEquipment(null);
        } catch (err: any) {
            alert(`שגיאה בעדכון ציוד: ${err.message}`);
        }
    };

    // מחיקת ציוד
    const handleDeleteEquipment = async (id: string) => {
        try {
            await deleteEquipment(id);
            setEquipment(equipment.filter(eq => eq._id !== id));
        } catch (err: any) {
            alert(`שגיאה במחיקת ציוד: ${err.message}`);
        }
    };

    // ⚡ הסרת תעודה בלבד (ללא מחיקת הציוד)
    const handleRemoveCertificate = async (equipmentItem: Equipment) => {
        if (!equipmentItem._id) return;
        if (!window.confirm(`האם להסיר את התעודה של ${equipmentItem.name}?`)) return;

        try {
            // שליחת null בשדה certificate כדי למחוק אותו בשרת
            const payload: any = { ...equipmentItem, certificate: null };
            const updated = await updateEquipment(equipmentItem._id, payload);
            setEquipment(prev => prev.map(eq =>
                eq._id === equipmentItem._id
                    ? { ...updated, certificate: undefined, hasCertificate: false }
                    : eq
            ));
        } catch (err: any) {
            alert(`שגיאה בהסרת התעודה: ${err.message}`);
        }
    };

    // פונקציות סל כיול
    const toggleItemSelection = (equipmentId: string) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(equipmentId)) {
            newSelected.delete(equipmentId);
        } else {
            newSelected.add(equipmentId);
        }
        setSelectedItems(newSelected);
    };

    const addToCart = () => {
        const itemsToAdd = equipment.filter(eq => selectedItems.has(eq._id!));
        const existingIds = new Set(calibrationCart.map(item => item._id));
        const newItems = itemsToAdd.filter(item => !existingIds.has(item._id));
        
        setCalibrationCart([...calibrationCart, ...newItems]);
        setSelectedItems(new Set());
        setShowStatusModal(false);
        
        // הצגת toast עם הודעה מותאמת לסטטוס
        let message = '';
        if (modalStatus === 'valid') {
            message = `✓ ${newItems.length} פריטים תקינים נוספו לסל הכיול`;
        } else if (modalStatus === 'expiring') {
            message = `⚠ ${newItems.length} פריטים מתקרבים לפקיעה נוספו לסל`;
        } else if (modalStatus === 'expired') {
            message = `🔴 ${newItems.length} פריטים דחופים נוספו לסל`;
        }
        
        setToastMessage(message);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const removeFromCart = (equipmentId: string) => {
        const removedItem = calibrationCart.find(item => item._id === equipmentId);
        setCalibrationCart(calibrationCart.filter(item => item._id !== equipmentId));
        
        // הצגת הודעה
        if (removedItem) {
            setToastMessage(`🗑️ ${removedItem.name} הוסר מהסל`);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        }
    };

    const requestQuote = () => {
        // בניית רשימת הפריטים למייל
        const itemsList = calibrationCart.map((eq, index) => {
            return `${index + 1}. ${eq.name} - מספר סידורי: ${eq.serialNumber} (חברה: ${eq.company || 'לא צוין'})`;
        }).join('\n');

        // בניית תוכן המייל
        const subject = 'בקשת הצעת מחיר לכיול ציוד';
        const body = `שלום רב,

אשמח להצעת מחיר לפריטים הבאים:

${itemsList}

סה"כ: ${calibrationCart.length} פריטים

תודה רבה,`;

        // פתיחת אפליקציית המייל
        const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoLink;
    };

    // הפקת דוח לפי סטטוס
    const generateReport = (reportStatus: 'all' | 'valid' | 'expiring' | 'expired') => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const currentDate = new Date().toLocaleDateString('he-IL');
        
        // סינון ציוד לפי סטטוס
        let reportEquipment = equipment;
        let reportTitle = 'דוח כל הציוד';
        
        if (reportStatus !== 'all') {
            reportEquipment = equipment.filter(eq => calculateEquipmentStatus(eq.nextCalibrationDate) === reportStatus);
            if (reportStatus === 'valid') reportTitle = 'דוח ציוד בכיול תקף';
            if (reportStatus === 'expiring') reportTitle = 'דוח ציוד מתקרב לפקיעה';
            if (reportStatus === 'expired') reportTitle = 'דוח ציוד שנדרש כיול';
        }

        const itemsHTML = reportEquipment.map((eq, index) => {
            const status = calculateEquipmentStatus(eq.nextCalibrationDate);
            const nextDate = new Date(eq.nextCalibrationDate);
            const today = new Date();
            const diffTime = nextDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            let statusText = '';
            let statusColor = '';
            if (status === 'valid') {
                statusText = '✓ תקין';
                statusColor = 'color: green;';
            } else if (status === 'expiring') {
                statusText = '⚠ מתקרב לפקיעה';
                statusColor = 'color: orange;';
            } else {
                statusText = '✗ נדרש כיול';
                statusColor = 'color: red;';
            }
            
            return `
            <tr>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${eq.name}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${eq.serialNumber}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${eq.company || '-'}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${new Date(eq.nextCalibrationDate).toLocaleDateString('he-IL')}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center; ${statusColor} font-weight: bold;">
                    ${diffDays < 0 ? `${Math.abs(diffDays)} ימים באיחור` : `${diffDays} ימים`}
                </td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center; ${statusColor} font-weight: bold;">${statusText}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${eq.location || '-'}</td>
            </tr>
        `;
        }).join('');

        const htmlContent = `
            <!DOCTYPE html>
            <html dir="rtl" lang="he">
            <head>
                <meta charset="UTF-8">
                <title>${reportTitle} - ${currentDate}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 20px;
                        direction: rtl;
                    }
                    h1 {
                        text-align: center;
                        color: #0A192F;
                        border-bottom: 3px solid #0A192F;
                        padding-bottom: 10px;
                    }
                    .info {
                        margin: 20px 0;
                        font-size: 14px;
                        background-color: #f3f4f6;
                        padding: 15px;
                        border-radius: 8px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                    }
                    th {
                        background-color: #0A192F;
                        color: white;
                        padding: 10px;
                        border: 1px solid #ddd;
                        text-align: center;
                    }
                    td {
                        padding: 8px;
                        border: 1px solid #ddd;
                    }
                    .footer {
                        margin-top: 30px;
                        text-align: center;
                        font-size: 12px;
                        color: #666;
                        border-top: 1px solid #ddd;
                        padding-top: 20px;
                    }
                    @media print {
                        body { padding: 10px; }
                    }
                </style>
            </head>
            <body>
                <h1>🛠️ ${reportTitle}</h1>
                <div class="info">
                    <p><strong>תאריך הדפסה:</strong> ${currentDate}</p>
                    <p><strong>סה״כ פריטים בדוח:</strong> ${reportEquipment.length}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>שם הצב״ד</th>
                            <th>מספר סידורי</th>
                            <th>חברה</th>
                            <th>תאריך כיול הבא</th>
                            <th>ימים נותרו</th>
                            <th>סטטוס</th>
                            <th>מיקום</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>
                <div class="footer">
                    <p>מערכת ניהול צב״דים - Israel Airports Authority</p>
                    <p>Navigation Department - ${new Date().getFullYear()}</p>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                    }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setShowReportsModal(false);
    };

    const printCart = () => {
        // יצירת חלון הדפסה
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        // בניית HTML להדפסה
        const currentDate = new Date().toLocaleDateString('he-IL');
        const itemsHTML = calibrationCart.map((eq, index) => `
            <tr>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${eq.name}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${eq.serialNumber}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${eq.company || '-'}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${new Date(eq.nextCalibrationDate).toLocaleDateString('he-IL')}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${eq.location || '-'}</td>
            </tr>
        `).join('');

        const htmlContent = `
            <!DOCTYPE html>
            <html dir="rtl" lang="he">
            <head>
                <meta charset="UTF-8">
                <title>סל כיול - ${currentDate}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 20px;
                        direction: rtl;
                    }
                    h1 {
                        text-align: center;
                        color: #0A192F;
                        border-bottom: 3px solid #0A192F;
                        padding-bottom: 10px;
                    }
                    .info {
                        margin: 20px 0;
                        font-size: 14px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                    }
                    th {
                        background-color: #0A192F;
                        color: white;
                        padding: 10px;
                        border: 1px solid #ddd;
                        text-align: center;
                    }
                    td {
                        padding: 8px;
                        border: 1px solid #ddd;
                    }
                    .footer {
                        margin-top: 30px;
                        text-align: center;
                        font-size: 12px;
                        color: #666;
                    }
                    @media print {
                        body { padding: 10px; }
                    }
                </style>
            </head>
            <body>
                <h1>🛠️ סל כיול - רשימת ציוד לכיול</h1>
                <div class="info">
                    <p><strong>תאריך הדפסה:</strong> ${currentDate}</p>
                    <p><strong>סה״כ פריטים:</strong> ${calibrationCart.length}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>שם הצב״ד</th>
                            <th>מספר סידורי</th>
                            <th>חברה</th>
                            <th>תאריך כיול הבא</th>
                            <th>מיקום</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>
                <div class="footer">
                    <p>מערכת ניהול צב״דים - ${new Date().getFullYear()}</p>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                    }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    // סינון הציוד
    const filteredEquipment = equipment.filter(eq => {
        const status = calculateEquipmentStatus(eq.nextCalibrationDate);
        
        // סינון לפי סטטוס
        if (statusFilter !== 'all' && status !== statusFilter) {
            return false;
        }
        
        // סינון לפי חיפוש
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            return (
                eq.name.toLowerCase().includes(query) ||
                eq.serialNumber.toLowerCase().includes(query) ||
                eq.company?.toLowerCase().includes(query) ||
                eq.location?.toLowerCase().includes(query)
            );
        }
        
        return true;
    });

    // חישוב סטטיסטיקות
    const stats = {
        total: equipment.length,
        valid: equipment.filter(eq => calculateEquipmentStatus(eq.nextCalibrationDate) === 'valid').length,
        expiring: equipment.filter(eq => calculateEquipmentStatus(eq.nextCalibrationDate) === 'expiring').length,
        expired: equipment.filter(eq => calculateEquipmentStatus(eq.nextCalibrationDate) === 'expired').length,
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-200 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">טוען ציוד...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-200 flex items-center justify-center">
                <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">שגיאה</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={loadEquipment}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        נסה שוב
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-200">
            {/* Header */}
            <div className="bg-[#0A192F] text-white shadow-lg">
                <div className="container mx-auto py-4 px-4">
                    <div className="flex items-center justify-between">
                        {/* כפתור חזרה */}
                        {onBackToHome && (
                            <button
                                onClick={onBackToHome}
                                className="flex items-center gap-1 bg-[#172A46] hover:bg-[#1F3A67] text-white px-2 py-1 md:px-3 md:py-1.5 rounded-lg transition-colors text-xs md:text-sm"
                            >
                                ← חזרה
                            </button>
                        )}
                        
                        {/* כותרת עם לוגו */}
                        <div className="flex-1 flex items-center justify-center gap-5">
                            {/* לוגו ציוד מדידה - מוסתר במובייל */}
                            <svg 
                                width="80" 
                                height="80" 
                                viewBox="0 0 100 100" 
                                className="flex-shrink-0 hidden md:block"
                            >
                                {/* מסגרת ספקטרום אנלייזר */}
                                <rect x="10" y="20" width="80" height="60" rx="4" fill="#1E293B" stroke="#3B82F6" strokeWidth="2"/>
                                
                                {/* מסך */}
                                <rect x="15" y="25" width="70" height="40" fill="#0A192F" stroke="#60A5FA" strokeWidth="1"/>
                                
                                {/* גרף ספקטרום */}
                                <path 
                                    d="M 20 55 L 30 50 L 40 35 L 50 30 L 60 40 L 70 45 L 80 50" 
                                    stroke="#10B981" 
                                    strokeWidth="2" 
                                    fill="none"
                                    strokeLinecap="round"
                                />
                                <path 
                                    d="M 20 55 L 30 50 L 40 35 L 50 30 L 60 40 L 70 45 L 80 50 L 80 65 L 20 65 Z" 
                                    fill="url(#gradient)" 
                                    opacity="0.3"
                                />
                                
                                {/* כפתורים */}
                                <circle cx="25" cy="73" r="3" fill="#EF4444"/>
                                <circle cx="35" cy="73" r="3" fill="#10B981"/>
                                <circle cx="45" cy="73" r="3" fill="#3B82F6"/>
                                
                                {/* מחוגים קטנים */}
                                <rect x="60" y="69" width="8" height="8" rx="1" fill="#374151" stroke="#60A5FA" strokeWidth="0.5"/>
                                <rect x="70" y="69" width="8" height="8" rx="1" fill="#374151" stroke="#60A5FA" strokeWidth="0.5"/>
                                
                                {/* גרדיאנט */}
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.6"/>
                                        <stop offset="100%" stopColor="#10B981" stopOpacity="0.1"/>
                                    </linearGradient>
                                </defs>
                            </svg>
                            
                            {/* טקסט - קטן יותר במובייל */}
                            <div className="text-center">
                                <h1 className="text-lg md:text-3xl font-bold tracking-wide">Equipment Calibration</h1>
                                <p className="text-gray-300 mt-0.5 md:mt-1 text-xs md:text-sm tracking-wider hidden md:block">Measurement & Testing Equipment Management</p>
                            </div>
                        </div>
                        
                        {/* מספר גרסה */}
                        <div className="w-24 flex justify-end">
                            <span className="text-xs text-white">v {APP_VERSION}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6">
                {/* סטטיסטיקות */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-md p-4 border-r-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">סך הכל ציוד</p>
                                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                            </div>
                            <Filter className="text-blue-500" size={32} />
                        </div>
                    </div>
                    
                    <button
                        onClick={() => {
                            setModalStatus('valid');
                            setShowStatusModal(true);
                        }}
                        className="bg-white rounded-lg shadow-md p-4 border-r-4 border-green-500 hover:shadow-lg transition-all cursor-pointer text-right"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">כיול בתוקף</p>
                                <p className="text-2xl font-bold text-green-600">{stats.valid}</p>
                            </div>
                            <CheckCircle className="text-green-500" size={32} />
                        </div>
                    </button>
                    
                    <button
                        onClick={() => {
                            setModalStatus('expiring');
                            setShowStatusModal(true);
                        }}
                        className="bg-white rounded-lg shadow-md p-4 border-r-4 border-yellow-500 hover:shadow-lg transition-all cursor-pointer text-right"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">מתקרב לפקיעה</p>
                                <p className="text-2xl font-bold text-yellow-600">{stats.expiring}</p>
                            </div>
                            <Clock className="text-yellow-500" size={32} />
                        </div>
                    </button>
                    
                    <button
                        onClick={() => {
                            setModalStatus('expired');
                            setShowStatusModal(true);
                        }}
                        className="bg-white rounded-lg shadow-md p-4 border-r-4 border-red-500 hover:shadow-lg transition-all cursor-pointer text-right"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">נדרש כיול</p>
                                <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
                            </div>
                            <AlertCircle className="text-red-500" size={32} />
                        </div>
                    </button>
                </div>

                {/* כלי סינון וחיפוש */}
                <div className="bg-white rounded-lg shadow-md p-3 md:p-4 mb-6">
                    <div className="flex flex-col gap-3">
                        {/* שורה ראשונה: חיפוש */}
                        <div className="relative w-full">
                            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="חיפוש לפי שם, מספר סידורי, מיקום..."
                                className="w-full pr-10 pl-4 py-3 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                            />
                        </div>

                        {/* שורה שנייה: סינון וכפתורים */}
                        <div className="flex flex-col sm:flex-row gap-2">
                            {/* סינון לפי סטטוס */}
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="flex-1 px-4 py-3 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                            >
                                <option value="all">כל הסטטוסים</option>
                                <option value="valid">✓ כיול בתוקף</option>
                                <option value="expiring">⚠ מתקרב לפקיעה</option>
                                <option value="expired">✗ נדרש כיול</option>
                            </select>

                            {/* כפתור סל כיול */}
                            <button
                                onClick={() => setShowCart(true)}
                                className="relative flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-3 md:py-2 rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                            >
                                <ShoppingCart size={20} />
                                <span className="md:inline">סל כיול</span>
                                {calibrationCart.length > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                        {calibrationCart.length}
                                    </span>
                                )}
                            </button>

                            {/* כפתור דוחות */}
                            <button
                                onClick={() => setShowReportsModal(true)}
                                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 md:py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                            >
                                <FileText size={20} />
                                <span>דוחות</span>
                            </button>

                            {/* כפתור הוספה */}
                            <button
                                onClick={() => {
                                    setEditingEquipment(null);
                                    setShowForm(true);
                                }}
                                className="flex items-center justify-center gap-2 bg-emerald-500 text-white px-4 py-3 md:py-2 rounded-lg hover:bg-emerald-600 transition-colors font-semibold"
                            >
                                <Plus size={20} />
                                <span>הוסף ציוד</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* טבלת הציוד - מחשב */}
                <div className="hidden md:block">
                    <EquipmentTable
                        equipment={filteredEquipment}
                        onEdit={(eq) => {
                            setEditingEquipment(eq);
                            setShowForm(true);
                        }}
                        onDelete={handleDeleteEquipment}
                        onRemoveCertificate={handleRemoveCertificate}
                    />
                </div>

                {/* כרטיסי ציוד - מובייל */}
                <div className="md:hidden">
                    {filteredEquipment.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <p className="text-lg">לא נמצא ציוד 🔍</p>
                            <p className="text-sm mt-2">נסה לשנות את החיפוש או הסינון</p>
                        </div>
                    ) : (
                        filteredEquipment.map((eq) => (
                            <EquipmentCard
                                key={eq._id}
                                equipment={eq}
                                onEdit={(equipment) => {
                                    setEditingEquipment(equipment);
                                    setShowForm(true);
                                }}
                                onViewCertificate={(equipment) => {
                                    handleViewCertificate(equipment);
                                }}
                                onRemoveCertificate={handleRemoveCertificate}
                                onUploadCertificate={async (equipment, file) => {
                                    // דחיסת התמונה והעלאה ישירה
                                    try {
                                        const { compressImage } = await import('../utils/imageCompression');
                                        const originalSizeKB = (file.size / 1024).toFixed(0);
                                        const compressedImage = await compressImage(file, {
                                            maxWidth: 1600,
                                            maxHeight: 1600,
                                            quality: 0.85,
                                            maxSizeMB: 0.5
                                        });
                                        
                                        const compressedSizeKB = ((compressedImage.length * 3) / 4 / 1024).toFixed(0);
                                        const savings = ((1 - (parseInt(compressedSizeKB) / parseInt(originalSizeKB))) * 100).toFixed(0);
                                        
                                        alert(`✅ תעודה נדחסה בהצלחה!\n\n📊 גודל מקורי: ${originalSizeKB}KB\n📉 גודל דחוס: ${compressedSizeKB}KB\n💾 חיסכון: ${savings}%`);
                                        
                                        // עדכון הציוד עם התעודה
                                        const updatedEquipment = { ...equipment, certificate: compressedImage };
                                        await handleEditEquipment(updatedEquipment);
                                    } catch (error) {
                                        console.error('Error uploading certificate:', error);
                                        alert('שגיאה בהעלאת התעודה');
                                    }
                                }}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Modal לטופס */}
            {showForm && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 md:p-4"
                    onClick={() => setShowForm(false)}
                >
                    <div 
                        className="bg-white md:rounded-lg shadow-xl w-full h-full md:h-auto md:max-w-3xl md:max-h-[90vh] overflow-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-semibold">
                                {editingEquipment ? 'עריכת ציוד' : 'הוספת ציוד חדש'}
                            </h2>
                            <button 
                                onClick={() => setShowForm(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="p-6">
                            <EquipmentForm 
                                onSubmit={editingEquipment ? handleEditEquipment : handleAddEquipment}
                                initialData={editingEquipment}
                                onCancel={() => setShowForm(false)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Status Modal - ציוד לפי סטטוס */}
            {showStatusModal && modalStatus && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 md:p-4"
                    onClick={() => setShowStatusModal(false)}
                >
                    <div 
                        className="bg-white md:rounded-lg shadow-xl w-full h-full md:h-auto md:max-w-6xl md:max-h-[90vh] overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-4 border-b flex justify-between items-center bg-[#0A192F] text-white">
                            <h2 className="text-xl font-semibold">
                                {modalStatus === 'valid' && '✓ ציוד בכיול תקף'}
                                {modalStatus === 'expiring' && '⚠ ציוד מתקרב לפקיעה'}
                                {modalStatus === 'expired' && '✗ ציוד שנדרש כיול'}
                            </h2>
                            <button 
                                onClick={() => setShowStatusModal(false)}
                                className="text-white hover:text-gray-300 text-2xl"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-auto max-h-[calc(90vh-80px)]">
                            {equipment.filter(eq => calculateEquipmentStatus(eq.nextCalibrationDate) === modalStatus).length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p className="text-lg">אין ציוד בקטגוריה זו 🎉</p>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-4 flex justify-between items-center">
                                    <div className="text-sm text-gray-600">
                                        {selectedItems.size > 0 && (
                                            <span className="font-semibold">{selectedItems.size} פריטים נבחרו</span>
                                        )}
                                    </div>
                                    <button
                                        onClick={addToCart}
                                        disabled={selectedItems.size === 0}
                                        className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all ${
                                            selectedItems.size > 0
                                                ? 'bg-purple-600 text-white hover:bg-purple-700'
                                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                    >
                                        <ShoppingCart size={20} />
                                        הוסף לסל כיול ({selectedItems.size})
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200" dir="rtl">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedItems.size === equipment.filter(eq => calculateEquipmentStatus(eq.nextCalibrationDate) === modalStatus).length}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                const allIds = equipment
                                                                    .filter(eq => calculateEquipmentStatus(eq.nextCalibrationDate) === modalStatus)
                                                                    .map(eq => eq._id!);
                                                                setSelectedItems(new Set(allIds));
                                                            } else {
                                                                setSelectedItems(new Set());
                                                            }
                                                        }}
                                                        className="w-4 h-4 cursor-pointer"
                                                    />
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">שם הצב״ד</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">מספר סידורי</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">חברה</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">כיול הבא</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">ימים נותרו</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">פעולות</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {equipment
                                                .filter(eq => calculateEquipmentStatus(eq.nextCalibrationDate) === modalStatus)
                                                .map((eq) => {
                                                    const nextDate = new Date(eq.nextCalibrationDate);
                                                    const today = new Date();
                                                    const diffTime = nextDate.getTime() - today.getTime();
                                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                    
                                                    return (
                                                        <tr key={eq._id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedItems.has(eq._id!)}
                                                                    onChange={() => toggleItemSelection(eq._id!)}
                                                                    className="w-4 h-4 cursor-pointer"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">{eq.name}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-700 font-mono">{eq.serialNumber}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-600">{eq.company || '-'}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                                {new Date(eq.nextCalibrationDate).toLocaleDateString('he-IL')}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm">
                                                                <span className={`font-bold ${
                                                                    diffDays < 0 ? 'text-red-600' : 
                                                                    modalStatus === 'valid' ? 'text-green-600' : 
                                                                    'text-yellow-600'
                                                                }`}>
                                                                    {diffDays < 0 ? `${Math.abs(diffDays)} ימים באיחור` : `${diffDays} ימים`}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingEquipment(eq);
                                                                        setShowForm(true);
                                                                        setShowStatusModal(false);
                                                                    }}
                                                                    className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                                                                >
                                                                    ערוך
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                        </tbody>
                                    </table>
                                </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Cart Modal - סל כיול */}
            {showCart && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 md:p-4"
                    onClick={() => setShowCart(false)}
                >
                    <div 
                        className="bg-white md:rounded-lg shadow-xl w-full h-full md:h-auto md:max-w-6xl md:max-h-[90vh] overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-4 border-b flex justify-between items-center bg-purple-600 text-white">
                            <div className="flex items-center gap-3">
                                <ShoppingCart size={24} />
                                <h2 className="text-xl font-semibold">
                                    סל כיול ({calibrationCart.length} פריטים)
                                </h2>
                            </div>
                            <button 
                                onClick={() => setShowCart(false)}
                                className="text-white hover:text-gray-300 text-2xl"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-auto max-h-[calc(90vh-180px)]">
                            {calibrationCart.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <ShoppingCart size={64} className="mx-auto mb-4 text-gray-300" />
                                    <p className="text-xl">הסל ריק</p>
                                    <p className="text-sm mt-2">הוסף ציוד מהרשימות של "מתקרב לפקיעה" או "נדרש כיול"</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200" dir="rtl">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">שם הצב״ד</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">מספר סידורי</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">חברה</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">כיול הבא</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">סטטוס</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">הסר</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {calibrationCart.map((eq) => {
                                                const status = calculateEquipmentStatus(eq.nextCalibrationDate);
                                                const nextDate = new Date(eq.nextCalibrationDate);
                                                const today = new Date();
                                                const diffTime = nextDate.getTime() - today.getTime();
                                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                
                                                return (
                                                    <tr key={eq._id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{eq.name}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-700 font-mono">{eq.serialNumber}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-600">{eq.company || '-'}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-700">
                                                            {new Date(eq.nextCalibrationDate).toLocaleDateString('he-IL')}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                                status === 'expired' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                                {diffDays < 0 ? `${Math.abs(diffDays)} ימים באיחור` : `${diffDays} ימים`}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <button
                                                                onClick={() => removeFromCart(eq._id!)}
                                                                className="text-red-600 hover:text-red-800 font-semibold text-sm"
                                                            >
                                                                הסר
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {calibrationCart.length > 0 && (
                            <div className="p-4 border-t bg-gray-50">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={printCart}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                                        >
                                            <Printer size={18} />
                                            הדפס
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm('האם אתה בטוח שברצונך לרוקן את הסל?')) {
                                                    const itemCount = calibrationCart.length;
                                                    setCalibrationCart([]);
                                                    setShowCart(false);
                                                    
                                                    // הצגת הודעה
                                                    setToastMessage(`🗑️ הסל רוקן! ${itemCount} פריטים הוסרו`);
                                                    setShowToast(true);
                                                    setTimeout(() => setShowToast(false), 3000);
                                                }
                                            }}
                                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                        >
                                            רוקן סל
                                        </button>
                                    </div>
                                    <div className="text-lg font-bold text-gray-700">
                                        סה״כ: {calibrationCart.length} פריטים לכיול
                                    </div>
                                </div>
                                <button
                                    onClick={requestQuote}
                                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-bold text-lg flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="2" y="4" width="20" height="16" rx="2"/>
                                        <path d="m2 7 8.97 5.7a1.94 1.94 0 0 0 2.06 0L22 7"/>
                                    </svg>
                                    בקש הצעת מחיר
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {showToast && (
                <div className="fixed bottom-8 right-8 z-50 animate-slide-up">
                    <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px]">
                        <div className="bg-white rounded-full p-1">
                            <ShoppingCart className="text-green-500" size={24} />
                        </div>
                        <div>
                            <p className="font-bold text-lg">{toastMessage}</p>
                            <p className="text-sm text-green-100">הפריטים נוספו בהצלחה</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading אינדיקטור לטעינת תעודה */}
            {loadingCertificate && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-3">
                        <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                        <p className="text-gray-700 font-semibold">טוען תעודה...</p>
                    </div>
                </div>
            )}

            {/* Modal להצגת תעודה */}
            {selectedCertificate && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedCertificate(null)}
                >
                    <div 
                        className="max-w-6xl w-full max-h-[90vh] relative bg-white rounded-lg flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b flex justify-between items-center bg-white rounded-t-lg flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-bold">תעודת כיול</h3>
                                {selectedCertificate.startsWith('data:application/pdf') && (
                                    <span className="text-sm bg-red-100 text-red-600 px-2 py-1 rounded">PDF</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {selectedCertificate.startsWith('data:application/pdf') && (
                                    <a
                                        href={selectedCertificate}
                                        download="certificate.pdf"
                                        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                    >
                                        הורד PDF
                                    </a>
                                )}
                                <button
                                    onClick={() => setSelectedCertificate(null)}
                                    className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            {selectedCertificate.startsWith('data:application/pdf') ? (
                                <iframe 
                                    src={selectedCertificate}
                                    className="w-full h-full border-0"
                                    title="תעודת כיול"
                                    style={{ minHeight: '600px' }}
                                />
                            ) : (
                                <div className="p-4 overflow-auto h-full">
                                    <img 
                                        src={selectedCertificate} 
                                        alt="תעודת כיול"
                                        className="max-w-full h-auto mx-auto rounded"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal דוחות */}
            {showReportsModal && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowReportsModal(false)}
                >
                    <div 
                        className="bg-white rounded-lg shadow-xl max-w-2xl w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b flex justify-between items-center bg-blue-600 text-white rounded-t-lg">
                            <div className="flex items-center gap-2">
                                <FileText size={24} />
                                <h2 className="text-xl font-semibold">הפקת דוחות</h2>
                            </div>
                            <button 
                                onClick={() => setShowReportsModal(false)}
                                className="text-white hover:text-gray-300 text-2xl"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="p-6">
                            <p className="text-gray-600 mb-6 text-center">בחר את סוג הדוח שברצונך להפיק</p>
                            
                            <div className="grid grid-cols-1 gap-4">
                                {/* דוח כל הציוד */}
                                <button
                                    onClick={() => generateReport('all')}
                                    className="flex items-center justify-between p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-gray-100 p-3 rounded-lg group-hover:bg-blue-100">
                                            <Filter className="text-gray-600 group-hover:text-blue-600" size={24} />
                                        </div>
                                        <div className="text-right">
                                            <h3 className="font-bold text-lg text-gray-800">דוח כל הציוד</h3>
                                            <p className="text-sm text-gray-600">{stats.total} פריטים</p>
                                        </div>
                                    </div>
                                    <Printer className="text-gray-400 group-hover:text-blue-600" size={20} />
                                </button>

                                {/* דוח ציוד תקין */}
                                <button
                                    onClick={() => generateReport('valid')}
                                    className="flex items-center justify-between p-4 border-2 border-green-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-green-100 p-3 rounded-lg group-hover:bg-green-200">
                                            <CheckCircle className="text-green-600" size={24} />
                                        </div>
                                        <div className="text-right">
                                            <h3 className="font-bold text-lg text-gray-800">דוח ציוד בכיול תקף</h3>
                                            <p className="text-sm text-green-600">{stats.valid} פריטים</p>
                                        </div>
                                    </div>
                                    <Printer className="text-gray-400 group-hover:text-green-600" size={20} />
                                </button>

                                {/* דוח ציוד מתקרב לפקיעה */}
                                <button
                                    onClick={() => generateReport('expiring')}
                                    className="flex items-center justify-between p-4 border-2 border-yellow-300 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-yellow-100 p-3 rounded-lg group-hover:bg-yellow-200">
                                            <Clock className="text-yellow-600" size={24} />
                                        </div>
                                        <div className="text-right">
                                            <h3 className="font-bold text-lg text-gray-800">דוח ציוד מתקרב לפקיעה</h3>
                                            <p className="text-sm text-yellow-600">{stats.expiring} פריטים</p>
                                        </div>
                                    </div>
                                    <Printer className="text-gray-400 group-hover:text-yellow-600" size={20} />
                                </button>

                                {/* דוח ציוד שנדרש כיול */}
                                <button
                                    onClick={() => generateReport('expired')}
                                    className="flex items-center justify-between p-4 border-2 border-red-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-red-100 p-3 rounded-lg group-hover:bg-red-200">
                                            <AlertCircle className="text-red-600" size={24} />
                                        </div>
                                        <div className="text-right">
                                            <h3 className="font-bold text-lg text-gray-800">דוח ציוד שנדרש כיול</h3>
                                            <p className="text-sm text-red-600">{stats.expired} פריטים</p>
                                        </div>
                                    </div>
                                    <Printer className="text-gray-400 group-hover:text-red-600" size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EquipmentManager;

