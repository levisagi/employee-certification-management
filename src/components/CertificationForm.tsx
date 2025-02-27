import React, { useState, useRef } from 'react';
import { Certification, OJT } from '../models/employee';
import { FileText, Upload } from 'lucide-react';

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
        return new Date(date).toISOString().split('T')[0];
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
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 mb-6">
            {/* כותרת ההסמכה */}
            <div className="bg-gray-100 px-4 py-3 rounded-t-xl border-b flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        value={certification.name}
                        onChange={(e) => handleBasicChange('name', e.target.value)}
                        placeholder="שם ההסמכה"
                        className="text-lg font-medium text-gray-800 bg-transparent border-0 focus:ring-0 outline-none w-40"
                    />
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={certification.isRequired}
                            onChange={(e) => handleBasicChange('isRequired', e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-600">הסמכת חובה</span>
                    </label>
                </div>
                <button 
                    onClick={onDelete}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                >
                    <span className="text-xl">×</span>
                </button>
            </div>

            {/* תאריך תפוגה */}
            <div className="px-4 py-3 border-b">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">תאריך תפוגה</span>
                    <div className="flex items-center gap-2">
                        <input 
                            type="date"
                            value={formatDate(certification.expiryDate)}
                            onChange={(e) => handleBasicChange('expiryDate', new Date(e.target.value))}
                            className="border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        />
                    </div>
                </div>
            </div>

            {/* אזור תעודה */}
            <div className="px-4 py-3 border-b">
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
                            className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg 
                                      hover:bg-blue-100 transition-colors"
                        >
                            <Upload size={14} />
                            {certification.certificate ? 'החלף תעודה' : 'העלה תעודה'}
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

            {/* אזור ה-OJT */}
            <div className="p-4 bg-white rounded-b-xl">
                <div className="grid grid-cols-2 gap-4">
                    {/* OJT ראשון */}
                    <div className="bg-gray-50 rounded-lg p-3 relative">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-medium text-gray-700">OJT ראשון</span>
                            {certification.ojt1 && (
                                <button 
                                    onClick={() => resetOJT('ojt1')}
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <span className="text-xl">×</span>
                                </button>
                            )}
                        </div>
                        <div className="space-y-2">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">שם החונך</label>
                                <input 
                                    type="text"
                                    value={certification.ojt1?.mentor || ''}
                                    onChange={(e) => handleOJTChange('ojt1', 'mentor', e.target.value)}
                                    className="w-full border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="הכנס שם חונך"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">תאריך</label>
                                <input 
                                    type="date"
                                    value={formatDate(certification.ojt1?.date)}
                                    onChange={(e) => handleOJTChange('ojt1', 'date', e.target.value)}
                                    className="w-full border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* OJT שני */}
                    <div className="bg-gray-50 rounded-lg p-3 relative">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-medium text-gray-700">OJT שני</span>
                            {certification.ojt2 && (
                                <button 
                                    onClick={() => resetOJT('ojt2')}
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <span className="text-xl">×</span>
                                </button>
                            )}
                        </div>
                        <div className="space-y-2">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">שם החונך</label>
                                <input 
                                    type="text"
                                    value={certification.ojt2?.mentor || ''}
                                    onChange={(e) => handleOJTChange('ojt2', 'mentor', e.target.value)}
                                    className="w-full border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="הכנס שם חונך"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">תאריך</label>
                                <input 
                                    type="date"
                                    value={formatDate(certification.ojt2?.date)}
                                    onChange={(e) => handleOJTChange('ojt2', 'date', e.target.value)}
                                    className="w-full border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CertificationForm;