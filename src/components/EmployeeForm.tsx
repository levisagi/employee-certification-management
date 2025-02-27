import React, { useState, useEffect, useRef } from 'react';
import { Employee, Certification } from '../models/employee';
import CertificationForm from './CertificationForm';
import ImageCropper from './ImageCropper';

interface EmployeeFormProps {
    onSubmit: (employee: Employee) => void;
    initialData?: Employee | null;
    onCancel?: () => void;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ onSubmit, initialData, onCancel }) => {
    const [formData, setFormData] = useState<Omit<Employee, '_id' | 'certifications'>>({
        employeeNumber: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        email: '',
        role: '',
        department: '',
        startDate: new Date(),
        profileImage: ''
    });

    const [certifications, setCertifications] = useState<Certification[]>([]);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageToEdit, setImageToEdit] = useState<string | null>(null);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    const formatDateForInput = (date: Date | string | null): string => {
        try {
            if (!date) return '';
            const d = new Date(date);
            if (isNaN(d.getTime())) return '';
            return d.toISOString().split('T')[0];
        } catch (error) {
            return '';
        }
    };

    useEffect(() => {
        if (initialData) {
            const { certifications: certs, ...rest } = initialData;
            setFormData({
                ...rest,
                startDate: new Date(rest.startDate)
            });
            setCertifications(certs.map(cert => ({
                ...cert,
                expiryDate: new Date(cert.expiryDate),
                issueDate: new Date(cert.issueDate),
                ojt1: cert.ojt1 ? { ...cert.ojt1, date: new Date(cert.ojt1.date) } : undefined,
                ojt2: cert.ojt2 ? { ...cert.ojt2, date: new Date(cert.ojt2.date) } : undefined
            })));
            if (initialData.profileImage) {
                setImagePreview(initialData.profileImage);
            }
        }
    }, [initialData]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5000000) {
                setErrors({ profileImage: 'הקובץ גדול מדי (מקסימום 5MB)' });
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const imageDataUrl = reader.result as string;
                setImageToEdit(imageDataUrl);
            };
            reader.readAsDataURL(file);
        }
    };

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', error => reject(error));
            image.src = url;
        });

    const getCroppedImg = async (
        imageSrc: string,
        pixelCrop: any
    ): Promise<string> => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error('No 2d context');
        }

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        return canvas.toDataURL('image/jpeg');
    };

    const handleCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleCropSave = async () => {
        try {
            if (imageToEdit && croppedAreaPixels) {
                const croppedImage = await getCroppedImg(imageToEdit, croppedAreaPixels);
                setImagePreview(croppedImage);
                setFormData(prev => ({ ...prev, profileImage: croppedImage }));
                setImageToEdit(null);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (formData.profileImage && formData.profileImage.length > 5000000) {
                throw new Error('תמונת הפרופיל גדולה מדי (מקסימום 5MB)');
            }

            certifications.forEach(cert => {
                if (cert.certificate && cert.certificate.length > 5000000) {
                    throw new Error(`הקובץ של ההסמכה "${cert.name}" גדול מדי (מקסימום 5MB)`);
                }
            });

            const employeeData: Employee = {
                ...formData,
                certifications,
                _id: initialData?._id
            };

            await onSubmit(employeeData);
        } catch (error) {
            setErrors({
                submit: error instanceof Error ? error.message : 'אירעה שגיאה בשמירת הטופס'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const addCertification = () => {
        const newCertification: Certification = {
            name: '',
            issueDate: new Date(),
            expiryDate: new Date(),
            status: 'valid',
            isRequired: false
        };
        setCertifications([...certifications, newCertification]);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {errors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                    <p className="text-sm">{errors.submit}</p>
                </div>
            )}

            <div className="grid grid-cols-4 gap-6">
                {/* תמונת פרופיל */}
                <div className="flex flex-col items-center space-y-3">
                    <div className="w-32 h-32">
                        {imagePreview ? (
                            <img 
                                src={imagePreview}
                                alt="תמונת פרופיל"
                                className="w-full h-full rounded-full object-cover border-4 border-blue-100"
                            />
                        ) : (
                            <div className="w-full h-full rounded-full bg-blue-50 flex items-center justify-center border-4 border-blue-100">
                                <span className="text-3xl text-blue-300">👤</span>
                            </div>
                        )}
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        className="hidden"
                        accept="image/*"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-sm px-4 py-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                    >
                        {imagePreview ? 'החלף תמונה' : 'העלה תמונה'}
                    </button>
                </div>

                {/* פרטי העובד */}
                <div className="col-span-3 grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm mb-1 text-gray-600">מספר עובד</label>
                        <input
                            type="text"
                            value={formData.employeeNumber}
                            onChange={(e) => setFormData({...formData, employeeNumber: e.target.value})}
                            className="w-full p-2 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1 text-gray-600">שם פרטי</label>
                        <input
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                            className="w-full p-2 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1 text-gray-600">שם משפחה</label>
                        <input
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                            className="w-full p-2 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1 text-gray-600">טלפון</label>
                        <input
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                            className="w-full p-2 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                            required
                            dir="ltr"
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1 text-gray-600">אימייל</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="w-full p-2 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                            required
                            dir="ltr"
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1 text-gray-600">תפקיד</label>
                        <input
                            type="text"
                            value={formData.role}
                            onChange={(e) => setFormData({...formData, role: e.target.value})}
                            className="w-full p-2 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1 text-gray-600">מחלקה</label>
                        <select
                            value={formData.department}
                            onChange={(e) => setFormData({...formData, department: e.target.value})}
                            className="w-full p-2 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                            required
                        >
                            <option value="">בחר מחלקה</option>
                            <option value="ניווט">ניווט</option>
                            <option value="מכ״מ">מכ״מ</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm mb-1 text-gray-600">תאריך תחילת עבודה</label>
                        <input
                            type="date"
                            value={formatDateForInput(formData.startDate)}
                            onChange={(e) => {
                                const newDate = e.target.value ? new Date(e.target.value) : new Date();
                                if (!isNaN(newDate.getTime())) {
                                    setFormData({...formData, startDate: newDate});
                                }
                            }}
                            className="w-full p-2 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                            required
                            dir="ltr"
                        />
                    </div>
                </div>
            </div>

            {/* הסמכות */}
            <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-700">הסמכות</h3>
                    <button
                        type="button"
                        onClick={addCertification}
                        className="text-sm px-4 py-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                    >
                        + הוסף הסמכה
                    </button>
                </div>

                <div className="space-y-4">
                    {certifications.map((cert, index) => (
                        <CertificationForm
                            key={index}
                            certification={cert}
                            onChange={(updatedCert) => {
                                const newCerts = [...certifications];
                                newCerts[index] = updatedCert;
                                setCertifications(newCerts);
                            }}
                            onDelete={() => {
                                const newCerts = [...certifications];
                                newCerts.splice(index, 1);
                                setCertifications(newCerts);
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* כפתורי פעולה */}
            <div className="flex justify-between items-center gap-3 mt-6 border-t pt-6">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                    disabled={isSubmitting}
                >
                    ביטול
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-6 py-2 bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2
                        ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                >
                    {isSubmitting ? (
                        <>
                            <span className="animate-spin">⌛</span>
                            <span>שומר...</span>
                        </>
                    ) : (
                        <>
                            <span>{initialData ? '✓ עדכן' : '✓ שמור'}</span>
                        </>
                    )}
                </button>
            </div>

            {/* חלון העריכה */}
            {imageToEdit && (
                <ImageCropper
                    image={imageToEdit}
                    onCropComplete={handleCropComplete}
                    onCancel={() => setImageToEdit(null)}
                    onSave={handleCropSave}
                />
            )}
        </form>
    );
};

export default EmployeeForm;