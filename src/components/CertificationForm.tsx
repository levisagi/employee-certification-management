import React, { useState, useRef } from 'react';
import { Certification, OJT } from '../models/employee';
import { FileText, Upload, X, Check } from 'lucide-react';

interface CertificationFormProps {
    certification: Certification;
    onChange: (updatedCert: Certification) => void;
    onDelete: () => void;
}

const CertificationForm: React.FC<CertificationFormProps> = ({ 
    certification, 
    onChange,
    onDelete 
}) => {
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [expanded, setExpanded] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleOJTChange = (type: 'ojt1' | 'ojt2', field: keyof OJT, value: string) => {
        const ojt = certification[type] || { mentor: '', date: new Date() };
        const updatedOJT = { ...ojt, [field]: field === 'date' ? new Date(value) : value };
        
        onChange({
            ...certification,
            [type]: updatedOJT
        });
    };

    const handleBasicChange = (field: keyof Certification, value: any) => {
        onChange({
            ...certification,
            [field]: value
        });
    };

    const resetOJT = (type: 'ojt1' | 'ojt2') => {
        onChange({
            ...certification,
            [type]: undefined
        });
    };

    const formatDate = (date: Date | undefined) => {
        if (!date) return '';
        try {
            const d = new Date(date);
            if (isNaN(d.getTime())) return ''; // בדיקה אם התאריך תקין
            return d.toISOString().split('T')[0];
        } catch (error) {
            console.error('Invalid date:', date);
            return '';
        }
    };

    const handleCertificateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5000000) {
                setErrors({ certificate: 'הקובץ גדול מדי (מקסימום 5MB)' });
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                onChange({
                    ...certification,
                    certificate: base64String,
                    certificateFileName: file.name
                });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 mb-3 overflow-hidden">
            {/* שורת כותרת קומפקטית */}
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b">
                <div className="flex items-center gap-2 flex-1">
                    <input
                        type="text"
                        value={certification.name}
                        onChange={(e) => handleBasicChange('name', e.target.value)}
                        placeholder="שם ההסמכה"
                        className="text-sm font-medium text-gray-800 bg-transparent border-0 focus:ring-0 outline-none flex-1"
                    />
                    <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={certification.isRequired}
                                onChange={(e) => handleBasicChange('isRequired', e.target.checked)}
                                className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <span className="text-xs text-gray-600">חובה</span>
                        </label>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                            <span>תפוגה:</span>
                            <input 
                                type="date"
                                value={formatDate(certification.expiryDate)}
                                onChange={(e) => handleBasicChange('expiryDate', new Date(e.target.value))}
                                className="border rounded px-1 py-0.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none w-28"
                                required
                            />
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => setExpanded(!expanded)}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg 
                                hover:bg-gray-200 transition-colors"
                    >
                        {expanded ? 'הסתר' : 'פרטים'}
                    </button>
                    <button 
                        onClick={onDelete}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* אזור מורחב - מוצג רק כשלוחצים על "פרטים" */}
            {expanded && (
                <div className="p-3 bg-white">
                    {/* אזור תאריכי תחילה וסיום */}
                    <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-600">תקופת ההסמכה</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">תאריך תחילה</label>
                                <input
                                    type="date"
                                    value={formatDate(certification.startDate)}
                                    onChange={(e) => handleBasicChange('startDate', new Date(e.target.value))}
                                    className="w-full p-1.5 text-xs border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                    dir="ltr"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">תאריך סיום</label>
                                <input
                                    type="date"
                                    value={formatDate(certification.endDate)}
                                    onChange={(e) => handleBasicChange('endDate', new Date(e.target.value))}
                                    className="w-full p-1.5 text-xs border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                    dir="ltr"
                                />
                            </div>
                        </div>
                    </div>

                    {/* אזור תעודה */}
                    <div className="mb-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">תעודה</span>
                            <div className="flex items-center gap-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleCertificateUpload}
                                    className="hidden"
                                    accept="image/*,application/pdf"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg 
                                            hover:bg-blue-100 transition-colors"
                                >
                                    <Upload size={12} />
                                    {certification.certificate ? 'החלף' : 'העלה'}
                                </button>
                                {certification.certificate && (
                                    <span className="text-xs text-gray-500">{certification.certificateFileName || 'קובץ תעודה'}</span>
                                )}
                            </div>
                        </div>
                        {errors.certificate && (
                            <p className="text-xs text-red-500 mt-1">{errors.certificate}</p>
                        )}
                    </div>

                    {/* OJT ראשון */}
                    <div className="mb-2">
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-medium text-gray-600">OJT ראשון</label>
                            {certification.ojt1 && (
                                <button 
                                    onClick={() => resetOJT('ojt1')}
                                    className="text-xs text-red-500 hover:text-red-700"
                                >
                                    ביטול
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <input
                                    type="text"
                                    placeholder="שם החונך"
                                    value={certification.ojt1?.mentor || ''}
                                    onChange={(e) => handleOJTChange('ojt1', 'mentor', e.target.value)}
                                    className="w-full p-1.5 text-xs border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <input
                                    type="date"
                                    value={formatDate(certification.ojt1?.date)}
                                    onChange={(e) => handleOJTChange('ojt1', 'date', e.target.value)}
                                    className="w-full p-1.5 text-xs border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                    dir="ltr"
                                />
                            </div>
                        </div>
                    </div>

                    {/* OJT שני */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-medium text-gray-600">OJT שני</label>
                            {certification.ojt2 && (
                                <button 
                                    onClick={() => resetOJT('ojt2')}
                                    className="text-xs text-red-500 hover:text-red-700"
                                >
                                    ביטול
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <input
                                    type="text"
                                    placeholder="שם החונך"
                                    value={certification.ojt2?.mentor || ''}
                                    onChange={(e) => handleOJTChange('ojt2', 'mentor', e.target.value)}
                                    className="w-full p-1.5 text-xs border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <input
                                    type="date"
                                    value={formatDate(certification.ojt2?.date)}
                                    onChange={(e) => handleOJTChange('ojt2', 'date', e.target.value)}
                                    className="w-full p-1.5 text-xs border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                    dir="ltr"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CertificationForm;