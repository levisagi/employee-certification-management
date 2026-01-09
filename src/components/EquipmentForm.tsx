import React, { useState, useRef } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { Equipment } from '../models/equipment';
import { compressImage, isImageFile } from '../utils/imageCompression';

interface EquipmentFormProps {
    onSubmit: (equipment: Equipment) => void;
    initialData?: Equipment | null;
    onCancel: () => void;
}

const EquipmentForm: React.FC<EquipmentFormProps> = ({ onSubmit, initialData, onCancel }) => {
    // המרת תאריכים לפורמט YYYY-MM-DD
    const formatDateForInput = (dateStr: string | undefined): string => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch {
            return '';
        }
    };

    const [formData, setFormData] = useState<Equipment>({
        name: initialData?.name || '',
        serialNumber: initialData?.serialNumber || '',
        company: initialData?.company || '',
        lastCalibrationDate: formatDateForInput(initialData?.lastCalibrationDate),
        nextCalibrationDate: formatDateForInput(initialData?.nextCalibrationDate),
        category: initialData?.category || '',
        location: initialData?.location || '',
        notes: initialData?.notes || '',
        certificate: initialData?.certificate || '',
        _id: initialData?._id,
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCertificateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // בדיקת גודל הקובץ (מקסימום 10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert('הקובץ גדול מדי. אנא בחר קובץ קטן מ-10MB');
                return;
            }

            // בדיקת סוג הקובץ
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedTypes.includes(file.type)) {
                alert('נא להעלות קובץ PDF או תמונה (JPG, PNG)');
                return;
            }

            try {
                let base64String: string;

                // אם זה תמונה - דחוס אותה
                if (isImageFile(file)) {
                    console.log(`מדחיס תעודת צב״ד (תמונה): ${(file.size / 1024).toFixed(2)}KB`);
                    base64String = await compressImage(file, {
                        maxWidth: 1600,
                        maxHeight: 1600,
                        quality: 0.85,
                        maxSizeMB: 0.5
                    });
                } else {
                    // PDF - לא דוחסים
                    const reader = new FileReader();
                    base64String = await new Promise((resolve, reject) => {
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    });
                }

                setFormData(prev => ({
                    ...prev,
                    certificate: base64String
                }));
            } catch (error) {
                console.error('Error processing certificate:', error);
                alert('שגיאה בעיבוד הקובץ');
            }
        }
    };

    const handleRemoveCertificate = () => {
        setFormData(prev => ({
            ...prev,
            certificate: ''
        }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // וולידציה
        if (!formData.name.trim()) {
            alert('נא למלא שם צב״ד');
            return;
        }
        if (!formData.serialNumber.trim()) {
            alert('נא למלא מספר סידורי');
            return;
        }
        if (!formData.lastCalibrationDate) {
            alert('נא למלא תאריך כיול אחרון');
            return;
        }
        if (!formData.nextCalibrationDate) {
            alert('נא למלא תאריך כיול הבא');
            return;
        }

        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* שם הצב״ד */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                        שם הצב״ד <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="לדוגמה: מד לחץ דיגיטלי"
                        required
                    />
                </div>

                {/* מספר סידורי */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                        מספר סידורי <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="serialNumber"
                        value={formData.serialNumber}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                        placeholder="לדוגמה: SN-12345"
                        required
                    />
                </div>

                {/* חברה */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                        חברה
                    </label>
                    <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="לדוגמה: חברת ABC"
                    />
                </div>

                {/* מיקום */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                        מיקום
                    </label>
                    <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="לדוגמה: מחסן A, מעבדה 2"
                    />
                </div>

                {/* תאריך כיול אחרון */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                        תאריך כיול אחרון <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        name="lastCalibrationDate"
                        value={formData.lastCalibrationDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </div>

                {/* תאריך כיול הבא */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                        תאריך כיול הבא <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        name="nextCalibrationDate"
                        value={formData.nextCalibrationDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </div>
            </div>

            {/* הערות */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                    הערות
                </label>
                <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="הערות נוספות על הציוד..."
                />
            </div>

            {/* העלאת תעודת כיול */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    תעודת כיול
                </label>
                
                {formData.certificate ? (
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-300 rounded-lg">
                            <FileText size={20} className="text-green-600" />
                            <span className="text-sm text-green-700">תעודה הועלתה</span>
                        </div>
                        <button
                            type="button"
                            onClick={handleRemoveCertificate}
                            className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                        >
                            הסר תעודה
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* כפתור העלאה רגיל */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/pdf,image/jpeg,image/jpg,image/png"
                            onChange={handleCertificateUpload}
                            className="hidden"
                            id="certificate-upload"
                        />
                        <label
                            htmlFor="certificate-upload"
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
                        >
                            <Upload size={18} />
                            <span>העלה מהגלריה</span>
                        </label>

                        {/* כפתור צילום (מובייל) */}
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleCertificateUpload}
                            className="hidden"
                            id="certificate-camera"
                        />
                        <label
                            htmlFor="certificate-camera"
                            className="flex md:hidden items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer"
                        >
                            <Upload size={18} />
                            <span>📷 צלם תעודה</span>
                        </label>

                        <span className="text-sm text-gray-500 self-center">PDF או תמונה (מקסימום 10MB)</span>
                    </div>
                )}
            </div>

            {/* כפתורי פעולה */}
            <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    ביטול
                </button>
                <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                    {initialData ? 'עדכן' : 'הוסף'}
                </button>
            </div>
        </form>
    );
};

export default EquipmentForm;

