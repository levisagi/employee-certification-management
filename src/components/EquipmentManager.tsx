import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, AlertCircle, CheckCircle, Clock, ShoppingCart } from 'lucide-react';
import EquipmentTable from './EquipmentTable';
import EquipmentForm from './EquipmentForm';
import { Equipment, calculateEquipmentStatus } from '../models/equipment';
import { 
    fetchEquipment, 
    createEquipment, 
    updateEquipment, 
    deleteEquipment 
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
    const [modalStatus, setModalStatus] = useState<'expiring' | 'expired' | null>(null);
    
    // סל כיול
    const [calibrationCart, setCalibrationCart] = useState<Equipment[]>([]);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [showCart, setShowCart] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

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
        
        // הצגת toast
        setToastMessage(`✓ ${newItems.length} פריטים נוספו לסל הכיול`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const removeFromCart = (equipmentId: string) => {
        setCalibrationCart(calibrationCart.filter(item => item._id !== equipmentId));
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
                                className="flex items-center gap-2 bg-[#172A46] hover:bg-[#1F3A67] text-white px-3 py-1.5 rounded-lg transition-colors text-sm"
                            >
                                ← חזרה
                            </button>
                        )}
                        
                        {/* כותרת */}
                        <div className="flex-1 text-center">
                            <h1 className="text-3xl font-bold">מערכת ניהול צב״דים</h1>
                            <p className="text-gray-300 mt-1">ניהול וכיול ציוד</p>
                        </div>
                        
                        {/* רווח לאיזון */}
                        <div className="w-24"></div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6">
                {/* סטטיסטיקות */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-md p-4 border-r-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">סך הכל ציוד</p>
                                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                            </div>
                            <Filter className="text-blue-500" size={32} />
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-md p-4 border-r-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">כיול בתוקף</p>
                                <p className="text-2xl font-bold text-green-600">{stats.valid}</p>
                            </div>
                            <CheckCircle className="text-green-500" size={32} />
                        </div>
                    </div>
                    
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
                <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex flex-col md:flex-row gap-4 flex-1">
                            {/* חיפוש */}
                            <div className="relative flex-1">
                                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="חיפוש לפי שם, מספר סידורי, מיקום..."
                                    className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {/* סינון לפי סטטוס */}
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">כל הסטטוסים</option>
                                <option value="valid">✓ כיול בתוקף</option>
                                <option value="expiring">⚠ מתקרב לפקיעה</option>
                                <option value="expired">✗ נדרש כיול</option>
                            </select>
                        </div>

                        {/* כפתור סל כיול */}
                        <button
                            onClick={() => setShowCart(true)}
                            className="relative flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-semibold whitespace-nowrap"
                        >
                            <ShoppingCart size={20} />
                            <span>סל כיול</span>
                            {calibrationCart.length > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                                    {calibrationCart.length}
                                </span>
                            )}
                        </button>

                        {/* כפתור הוספה */}
                        <button
                            onClick={() => {
                                setEditingEquipment(null);
                                setShowForm(true);
                            }}
                            className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600 transition-colors font-semibold whitespace-nowrap"
                        >
                            <Plus size={20} />
                            הוסף ציוד
                        </button>
                    </div>
                </div>

                {/* טבלת הציוד */}
                <EquipmentTable
                    equipment={filteredEquipment}
                    onEdit={(eq) => {
                        setEditingEquipment(eq);
                        setShowForm(true);
                    }}
                    onDelete={handleDeleteEquipment}
                />
            </div>

            {/* Modal לטופס */}
            {showForm && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowForm(false)}
                >
                    <div 
                        className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto"
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
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowStatusModal(false)}
                >
                    <div 
                        className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-4 border-b flex justify-between items-center bg-[#0A192F] text-white">
                            <h2 className="text-xl font-semibold">
                                {modalStatus === 'expiring' ? '⚠ ציוד מתקרב לפקיעה' : '✗ ציוד שנדרש כיול'}
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
                                                                <span className={`font-bold ${diffDays < 0 ? 'text-red-600' : 'text-yellow-600'}`}>
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
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowCart(false)}
                >
                    <div 
                        className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
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
                                    <button
                                        onClick={() => {
                                            if (window.confirm('האם אתה בטוח שברצונך לרוקן את הסל?')) {
                                                setCalibrationCart([]);
                                            }
                                        }}
                                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                    >
                                        רוקן סל
                                    </button>
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
        </div>
    );
};

export default EquipmentManager;

