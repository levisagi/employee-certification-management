import React, { useState } from 'react';
import { Edit2, Trash2, FileText, FileX } from 'lucide-react';
import { Equipment, calculateEquipmentStatus, getStatusColor, getStatusText } from '../models/equipment';
import { fetchEquipmentCertificate } from '../services/equipmentApi';

interface EquipmentTableProps {
    equipment: Equipment[];
    onEdit: (equipment: Equipment) => void;
    onDelete: (id: string) => void;
    onRemoveCertificate?: (equipment: Equipment) => void;
}

const EquipmentTable: React.FC<EquipmentTableProps> = ({ equipment, onEdit, onDelete, onRemoveCertificate }) => {
    const [selectedCertificate, setSelectedCertificate] = useState<string | null>(null);
    const [loadingCertificate, setLoadingCertificate] = useState(false);
    
    const handleViewCertificate = async (eq: Equipment) => {
        if (!eq._id) return;
        if (eq.certificate) {
            setSelectedCertificate(eq.certificate);
            return;
        }
        setLoadingCertificate(true);
        try {
            const cert = await fetchEquipmentCertificate(eq._id);
            setSelectedCertificate(cert);
        } catch (err) {
            console.error('Error loading certificate:', err);
            alert('שגיאה בטעינת התעודה');
        } finally {
            setLoadingCertificate(false);
        }
    };

    // עדכון סטטוס לכל ציוד
    const equipmentWithStatus = equipment.map(eq => ({
        ...eq,
        status: calculateEquipmentStatus(eq.nextCalibrationDate)
    }));

    return (
        <>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200" dir="rtl">
                        <thead className="bg-[#0A192F]">
                            <tr>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
                                    שם הצב״ד
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
                                    מספר סידורי
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
                                    חברה
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
                                    כיול אחרון
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
                                    כיול הבא
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
                                    סטטוס
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
                                    מיקום
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">
                                    פעולות
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {equipmentWithStatus.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                                        אין ציוד במערכת. לחץ על "הוסף ציוד" כדי להתחיל.
                                    </td>
                                </tr>
                            ) : (
                                equipmentWithStatus.map((eq) => (
                                    <tr 
                                        key={eq._id} 
                                        className="hover:bg-blue-50 transition-colors cursor-pointer"
                                        onClick={() => onEdit(eq)}
                                    >
                                        {/* שם */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-gray-900">{eq.name}</div>
                                        </td>
                                        
                                        {/* מספר סידורי */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-sm text-gray-700 font-mono">{eq.serialNumber}</div>
                                        </td>
                                        
                                        {/* חברה */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-sm text-gray-600">{eq.company || '-'}</div>
                                        </td>
                                        
                                        {/* כיול אחרון */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-sm text-gray-700">
                                                {new Date(eq.lastCalibrationDate).toLocaleDateString('he-IL')}
                                            </div>
                                        </td>
                                        
                                        {/* כיול הבא */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-gray-900">
                                                {new Date(eq.nextCalibrationDate).toLocaleDateString('he-IL')}
                                            </div>
                                        </td>
                                        
                                        {/* סטטוס */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(eq.status!)}`}>
                                                {getStatusText(eq.status!)}
                                            </span>
                                        </td>
                                        
                                        {/* מיקום */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-sm text-gray-600">{eq.location || '-'}</div>
                                        </td>
                                        
                                        {/* פעולות */}
                                        <td className="px-4 py-3 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-center gap-2">
                                                {(eq.certificate || eq.hasCertificate) && (
                                                    <>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleViewCertificate(eq);
                                                            }}
                                                            className="text-green-600 hover:text-green-800 transition-colors p-1 hover:bg-green-50 rounded"
                                                            title="צפה בתעודה"
                                                        >
                                                            <FileText size={16} />
                                                        </button>
                                                        {onRemoveCertificate && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onRemoveCertificate(eq);
                                                                }}
                                                                className="text-orange-600 hover:text-orange-800 transition-colors p-1 hover:bg-orange-50 rounded"
                                                                title="הסר תעודה"
                                                            >
                                                                <FileX size={16} />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEdit(eq);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-800 transition-colors p-1 hover:bg-blue-50 rounded"
                                                    title="ערוך"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (window.confirm(`האם אתה בטוח שברצונך למחוק את ${eq.name}?`)) {
                                                            onDelete(eq._id!);
                                                        }
                                                    }}
                                                    className="text-red-600 hover:text-red-800 transition-colors p-1 hover:bg-red-50 rounded"
                                                    title="מחק"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

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
        </>
    );
};

export default EquipmentTable;

