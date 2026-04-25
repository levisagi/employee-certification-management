import React, { useRef } from 'react';
import { Edit2, FileText, ShoppingCart, Camera } from 'lucide-react';
import { Equipment, calculateEquipmentStatus } from '../models/equipment';

interface EquipmentCardProps {
    equipment: Equipment;
    onEdit: (equipment: Equipment) => void;
    onViewCertificate: (equipment: Equipment) => void;
    onUploadCertificate: (equipment: Equipment, file: File) => void;
    onAddToCart?: (equipment: Equipment) => void;
}

const EquipmentCard: React.FC<EquipmentCardProps> = ({ 
    equipment, 
    onEdit, 
    onViewCertificate,
    onUploadCertificate,
    onAddToCart 
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleCameraClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onUploadCertificate(equipment, file);
        }
    };
    const status = calculateEquipmentStatus(equipment.nextCalibrationDate);
    const nextDate = new Date(equipment.nextCalibrationDate);
    const today = new Date();
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const statusConfig = {
        valid: {
            bg: 'bg-green-50',
            border: 'border-green-500',
            text: 'text-green-700',
            badge: 'bg-green-100 text-green-800',
            label: 'כיול בתוקף'
        },
        expiring: {
            bg: 'bg-yellow-50',
            border: 'border-yellow-500',
            text: 'text-yellow-700',
            badge: 'bg-yellow-100 text-yellow-800',
            label: 'מתקרב לפקיעה'
        },
        expired: {
            bg: 'bg-red-50',
            border: 'border-red-500',
            text: 'text-red-700',
            badge: 'bg-red-100 text-red-800',
            label: 'נדרש כיול'
        }
    };

    const config = statusConfig[status];

    return (
        <div className={`${config.bg} border-r-4 ${config.border} rounded-lg shadow-md p-4 mb-4`}>
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{equipment.name}</h3>
                    <p className="text-sm text-gray-600">מס׳ סידורי: <span className="font-mono font-semibold">{equipment.serialNumber}</span></p>
                </div>
            </div>

            {/* Details */}
            <div className="space-y-2 mb-3">
                {equipment.company && (
                    <div className="flex items-center text-sm">
                        <span className="text-gray-600 w-20">🏢 חברה:</span>
                        <span className="font-semibold text-gray-800">{equipment.company}</span>
                    </div>
                )}
                {equipment.location && (
                    <div className="flex items-center text-sm">
                        <span className="text-gray-600 w-20">📍 מיקום:</span>
                        <span className="font-semibold text-gray-800">{equipment.location}</span>
                    </div>
                )}
                <div className="flex items-center text-sm">
                    <span className="text-gray-600 w-20">📅 כיול הבא:</span>
                    <span className="font-semibold text-gray-800">
                        {new Date(equipment.nextCalibrationDate).toLocaleDateString('he-IL')}
                    </span>
                </div>
            </div>

            {/* Status Badge */}
            <div className="mb-3">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${config.badge}`}>
                    {config.label} • {diffDays < 0 ? `${Math.abs(diffDays)} ימים באיחור` : `${diffDays} ימים`}
                </span>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
                {(equipment.certificate || equipment.hasCertificate) ? (
                    <button
                        onClick={() => onViewCertificate(equipment)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
                    >
                        <FileText size={18} />
                        הצג תעודה
                    </button>
                ) : (
                    <>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/pdf,image/*"
                            capture="environment"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <button
                            onClick={handleCameraClick}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold text-sm"
                        >
                            <Camera size={18} />
                            העלה תעודה
                        </button>
                    </>
                )}
                
                <button
                    onClick={() => onEdit(equipment)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold text-sm"
                >
                    <Edit2 size={18} />
                    ערוך
                </button>
            </div>

            {/* Add to Cart Button (if provided) */}
            {onAddToCart && (
                <button
                    onClick={() => onAddToCart(equipment)}
                    className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
                >
                    <ShoppingCart size={18} />
                    הוסף לסל כיול
                </button>
            )}
        </div>
    );
};

export default EquipmentCard;

