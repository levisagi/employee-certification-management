import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Employee, Certification } from '../models/employee';
import ExperienceBar from './ExperienceBar';
import { Users, FileText, ChevronRight, ChevronLeft } from 'lucide-react';

interface EmployeeCardProps {
    employee: Employee;
    onEdit: (employee: Employee) => void;
    onDelete: (id: string | undefined) => void;
}

const EmployeeCard = ({ employee, onEdit, onDelete }: EmployeeCardProps) => {
    const [selectedCertificate, setSelectedCertificate] = useState<string | null>(null);
    const [selectedCertName, setSelectedCertName] = useState<string>('');
    const [certPage, setCertPage] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const certsPerPage = 3;
    const certsContainerRef = useRef<HTMLDivElement>(null);

    // חישוב מקסימום עמודים - עם תיקון למניעת ערכים שליליים
    const maxPage = Math.max(0, Math.ceil(employee.certifications.length / certsPerPage) - 1);
    
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
                color: 'bg-red-500/10 text-red-500', 
                text: 'נדרש רענון בהקדם'
            };
        } else if (daysUntilExpiry <= 365) {
            return { 
                color: 'bg-yellow-500/10 text-yellow-500', 
                text: `נדרש רענון בעוד ${monthsUntilExpiry} חודשים`
            };
        }
        return { 
            color: 'bg-emerald-500/10 text-emerald-500', 
            text: 'בתוקף'
        };
    };

    const qualificationProgress = useMemo(() => {
        const REQUIRED_CERTIFICATIONS = 7;
        const PROGRESS_PER_CERTIFICATION = Math.round(100 / REQUIRED_CERTIFICATIONS);

        const requiredCerts = employee.certifications.filter(cert => cert.isRequired === true);
        if (requiredCerts.length === 0) return 0;

        const validRequiredCerts = requiredCerts.filter(cert => {
            const isValid = new Date(cert.expiryDate) > new Date();
            const hasOJT = cert.ojt1 && cert.ojt2;
            return isValid && hasOJT;
        });

        return Math.min((validRequiredCerts.length * PROGRESS_PER_CERTIFICATION), 100);
    }, [employee.certifications]);

    const calculateTotalQualification = useMemo(() => {
        const experienceWeight = 0.5;
        const experienceYears = Math.min(
            ((new Date().getTime() - new Date(employee.startDate).getTime()) / (1000 * 60 * 60 * 24 * 365)),
            3
        ) / 3;
        const experienceScore = experienceYears * 100 * experienceWeight;

        const certificationsWeight = 0.5;
        const certificationsScore = qualificationProgress * certificationsWeight;

        return Math.round(experienceScore + certificationsScore);
    }, [employee.startDate, qualificationProgress]);

    const getQualificationColor = (score: number) => {
        if (score >= 90) return '#10B981'; // ירוק
        if (score >= 70) return '#F59E0B'; // צהוב
        return '#EF4444'; // אדום
    };

    const handleShowCertificate = (cert: Certification) => {
        if (cert.certificate) {
            setSelectedCertificate(cert.certificate);
            setSelectedCertName(cert.name);
        }
    };

    const nextPage = () => {
        if (certPage < maxPage && !isAnimating) {
            setIsAnimating(true);
            const container = certsContainerRef.current;
            if (container) {
                container.style.transform = 'translateX(100%)';
                container.style.opacity = '0';
                
                setTimeout(() => {
                    setCertPage(prev => prev + 1);
                    container.style.transition = 'none';
                    container.style.transform = 'translateX(-100%)';
                    
                    setTimeout(() => {
                        container.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
                        container.style.transform = 'translateX(0)';
                        container.style.opacity = '1';
                        
                        setTimeout(() => {
                            setIsAnimating(false);
                        }, 300);
                    }, 10);
                }, 300);
            }
        }
    };

    const prevPage = () => {
        if (certPage > 0 && !isAnimating) {
            setIsAnimating(true);
            const container = certsContainerRef.current;
            if (container) {
                container.style.transform = 'translateX(-100%)';
                container.style.opacity = '0';
                
                setTimeout(() => {
                    setCertPage(prev => prev - 1);
                    container.style.transition = 'none';
                    container.style.transform = 'translateX(100%)';
                    
                    setTimeout(() => {
                        container.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
                        container.style.transform = 'translateX(0)';
                        container.style.opacity = '1';
                        
                        setTimeout(() => {
                            setIsAnimating(false);
                        }, 300);
                    }, 10);
                }, 300);
            }
        }
    };

    useEffect(() => {
        const container = certsContainerRef.current;
        if (container) {
            container.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
            container.style.transform = 'translateX(0)';
            container.style.opacity = '1';
        }
    }, []);

    // חישוב ההסמכות הנראות כרגע - עם תיקון לוודא שלא יוצאים מגבולות המערך
    const visibleCertifications = employee.certifications.slice(
        certPage * certsPerPage, 
        Math.min((certPage + 1) * certsPerPage, employee.certifications.length)
    );

    // חישוב כמה פריטים ריקים להוסיף כדי שתמיד יהיו בדיוק 3 כרטיסים
    const emptyCardsToAdd = certsPerPage - visibleCertifications.length;

    return (
        <div className="bg-[#1E293B] rounded-xl shadow-lg p-4 border border-[#334155]">
            {/* Header Section */}
            <div className="flex flex-col items-center mb-4 relative">
                {/* Action Buttons */}
                <div className="absolute top-0 right-0 flex gap-1">
                    <button
                        onClick={() => onEdit(employee)}
                        className="text-xs bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-lg 
                        hover:bg-blue-500/20 transition-colors"
                    >
                        ערוך
                    </button>
                    <button
                        onClick={() => {
                            if (window.confirm('האם אתה בטוח שברצונך למחוק עובד זה?')) {
                                onDelete(employee._id);
                            }
                        }}
                        className="text-xs bg-red-500/10 text-red-500 px-2 py-0.5 rounded-lg 
                        hover:bg-red-500/20 transition-colors"
                    >
                        מחק
                    </button>
                </div>

                {/* Profile Image with Qualification Circle */}
                <div className="relative w-24 h-24 mb-3">
                    <svg
                        className="absolute top-0 left-0 w-full h-full -rotate-90 transform"
                        viewBox="0 0 100 100"
                    >
                        <circle
                            cx="50"
                            cy="50"
                            r="45"
                            className="stroke-[#334155]"
                            strokeWidth="8"
                            fill="none"
                        />
                        <circle
                            cx="50"
                            cy="50"
                            r="45"
                            stroke={getQualificationColor(calculateTotalQualification)}
                            strokeWidth="8"
                            fill="none"
                            strokeLinecap="round"
                            style={{
                                strokeDasharray: `${2 * Math.PI * 45}`,
                                strokeDashoffset: `${2 * Math.PI * 45 * (1 - calculateTotalQualification / 100)}`,
                                transition: 'stroke-dashoffset 0.5s ease-in-out, stroke 0.5s ease-in-out'
                            }}
                        />
                    </svg>

                    <div className="absolute inset-2">
                        {employee.profileImage ? (
                            <img 
                                src={employee.profileImage}
                                alt={`${employee.firstName} ${employee.lastName}`}
                                className="w-full h-full rounded-full object-cover border-2 border-[#334155]"
                            />
                        ) : (
                            <div className="w-full h-full rounded-full bg-[#334155] flex items-center justify-center border-2 border-[#334155]">
                                <Users size={24} className="text-gray-400" />
                            </div>
                        )}
                    </div>

                    <div 
                        className="absolute -bottom-2 -right-2 bg-[#1E293B] rounded-full w-8 h-8 
                        flex items-center justify-center border-2"
                        style={{ borderColor: getQualificationColor(calculateTotalQualification) }}
                    >
                        <span className="text-xs font-bold" style={{ color: getQualificationColor(calculateTotalQualification) }}>
                            {calculateTotalQualification}%
                        </span>
                    </div>
                </div>

                {/* Employee Details */}
                <div className="text-center">
                    <h2 className="text-lg font-bold text-gray-100 mb-0.5">
                        {employee.firstName} {employee.lastName}
                    </h2>
                    <p className="text-sm text-gray-400 leading-tight">{employee.role}</p>
                    <p className="text-xs text-gray-500 leading-tight">מס׳ {employee.employeeNumber}</p>
                </div>

                {/* Progress Bars Section */}
                <div className="w-full mt-4 space-y-2">
                    {/* פס התקדמות הסמכות */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-400">התקדמות הסמכות</span>
                            <div className="flex items-center gap-1">
                                <span className="text-xs font-medium text-gray-300">
                                    {qualificationProgress}% 
                                </span>
                                <span className="text-xs text-gray-500">
                                    ({Math.min(employee.certifications.filter(cert => cert.isRequired).length, 7)}/7)
                                </span>
                            </div>
                        </div>
                        <div className="w-full bg-[#334155] rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all duration-500 ${
                                    qualificationProgress >= 90 ? 'bg-emerald-500' :
                                    qualificationProgress >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${qualificationProgress}%` }}
                            />
                        </div>
                    </div>

                    {/* ותק */}
                    <ExperienceBar startDate={employee.startDate} />
                </div>
            </div>

            {/* Certifications */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-sm text-gray-300">
                        הסמכות ({employee.certifications.length})
                    </h3>
                    <div className="flex items-center">
                        {employee.certifications.length > certsPerPage && (
                            <div className="flex gap-1">
                                <button 
                                    onClick={prevPage} 
                                    disabled={certPage === 0 || isAnimating}
                                    className={`p-1 rounded ${certPage === 0 ? 'text-gray-600' : 'text-gray-400 hover:text-gray-200'}`}
                                    aria-label="הסמכות קודמות"
                                >
                                    <ChevronRight size={16} />
                                </button>
                                <span className="text-xs text-gray-400">
                                    {certPage + 1}/{maxPage + 1}
                                </span>
                                <button 
                                    onClick={nextPage} 
                                    disabled={certPage >= maxPage || isAnimating}
                                    className={`p-1 rounded ${certPage >= maxPage ? 'text-gray-600' : 'text-gray-400 hover:text-gray-200'}`}
                                    aria-label="הסמכות הבאות"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="relative overflow-hidden">
                    <div 
                        ref={certsContainerRef}
                        className="space-y-2"
                        style={{
                            transform: 'translateX(0)',
                            opacity: 1
                        }}
                    >
                        {/* בדיקה אם אין הסמכות בכלל */}
                        {employee.certifications.length === 0 ? (
                            <>
                                <div className="flex items-center justify-center h-[70px] text-gray-400 p-3 rounded-lg border border-[#334155] border-dashed">
                                    אין הסמכות להצגה
                                </div>
                                <div className="h-[70px] text-gray-400 p-3 rounded-lg border border-[#334155] border-dashed mt-2 flex items-center justify-center">
                                    <span className="text-xs text-gray-500 italic">אין הסמכה נוספת</span>
                                </div>
                                <div className="h-[70px] text-gray-400 p-3 rounded-lg border border-[#334155] border-dashed mt-2 flex items-center justify-center">
                                    <span className="text-xs text-gray-500 italic">אין הסמכה נוספת</span>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* הצגת ההסמכות הנראות */}
                                {visibleCertifications.map((cert, index) => {
                                    const certStatus = getCertificationStatus(cert.expiryDate);
                                    return (
                                        <div 
                                            key={index} 
                                            className={`p-3 rounded-lg border bg-[#1E293B] hover:border-blue-500/20 transition-colors min-h-[70px]
                                                ${cert.isRequired ? 'border-blue-500/20 bg-blue-500/5' : 'border-[#334155]'}`}
                                        >
                                            <div className="flex flex-col justify-between h-full">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-sm text-gray-200">{cert.name}</p>
                                                        {cert.isRequired && (
                                                            <span className="text-xs bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded-full">
                                                                חובה
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${certStatus.color}`}>
                                                        {certStatus.text}
                                                    </span>
                                                </div>

                                                <div className="space-y-1 text-xs">
                                                    <div className={`flex items-center gap-1 ${cert.ojt1 ? 'text-emerald-500' : 'text-gray-500'}`}>
                                                        <span>✓ OJT 1:</span>
                                                        {cert.ojt1 ? (
                                                            <div className="flex gap-1">
                                                                <span>{cert.ojt1.mentor}</span>
                                                                <span className="text-gray-500">|</span>
                                                                <span>{formatDate(cert.ojt1.date)}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="italic">טרם בוצע</span>
                                                        )}
                                                    </div>

                                                    <div className={`flex items-center gap-1 ${cert.ojt2 ? 'text-emerald-500' : 'text-gray-500'}`}>
                                                        <span>✓ OJT 2:</span>
                                                        {cert.ojt2 ? (
                                                            <div className="flex gap-1">
                                                                <span>{cert.ojt2.mentor}</span>
                                                                <span className="text-gray-500">|</span>
                                                                <span>{formatDate(cert.ojt2.date)}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="italic">טרם בוצע</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center mt-2 pt-1 border-t border-[#334155]">
                                                    <p className="text-xs text-gray-400">תוקף: {formatDate(cert.expiryDate)}</p>
                                                    {cert.certificate && (
                                                        <button
                                                            onClick={() => handleShowCertificate(cert)}
                                                            className="text-xs px-1.5 py-0.5 bg-[#334155] text-gray-300 
                                                            rounded-full hover:bg-[#405171] transition-colors flex items-center gap-1"
                                                        >
                                                            <FileText size={12} className="text-blue-400" />
                                                            תעודה
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* הוספת פריטים ריקים להשלמה ל-3 פריטים */}
                                {Array.from({ length: emptyCardsToAdd }).map((_, index) => (
                                    <div 
                                        key={`empty-${index}`} 
                                        className="p-3 rounded-lg border border-[#334155] border-dashed h-[70px] mt-2
                                        bg-transparent flex items-center justify-center"
                                    >
                                        <span className="text-xs text-gray-500 italic">אין הסמכה נוספת</span>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>

                    {/* Pagination Dots */}
                    {employee.certifications.length > certsPerPage && (
                        <div className="flex justify-center gap-1 mt-2">
                            {Array.from({ length: maxPage + 1 }).map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => !isAnimating && setCertPage(index)}
                                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                                        index === certPage ? 'bg-blue-500 w-3' : 'bg-gray-500'
                                    }`}
                                    aria-label={`עבור לעמוד ${index + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal להצגת התעודה */}
            {selectedCertificate && (
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
                    onClick={() => setSelectedCertificate(null)}
                >
                    <div 
                        className="bg-[#1E293B] p-4 rounded-lg max-w-3xl max-h-[90vh] overflow-auto w-full m-4 border border-[#334155]"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-100">{selectedCertName}</h3>
                            <button
                                onClick={() => setSelectedCertificate(null)}
                                className="text-gray-400 hover:text-gray-200"
                            >
                                ✕
                            </button>
                        </div>
                        {selectedCertificate.startsWith('data:application/pdf') ? (
                            <embed
                                src={selectedCertificate}
                                type="application/pdf"
                                width="100%"
                                height="600px"
                            />
                        ) : (
                            <img
                                src={selectedCertificate}
                                alt="תעודה"
                                className="max-w-full rounded border border-[#334155]"
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeCard;