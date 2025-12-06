import React, { useState } from 'react';
import { Employee, Certification } from '../models/employee';
import { Copy, Check, AlertCircle } from 'lucide-react';

interface CertificationCopyModalProps {
  sourceEmployee: Employee;
  employees: Employee[];
  onClose: () => void;
  onCopyCertifications: (sourceCerts: Certification[], targetEmployeeIds: string[]) => Promise<void>;
}

const CertificationCopyModal: React.FC<CertificationCopyModalProps> = ({
  sourceEmployee,
  employees,
  onClose,
  onCopyCertifications
}) => {
  // מצב לתהליך העתקה
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // מצב לעובדים נבחרים
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  
  // מצב להסמכות נבחרות
  const [selectedCertIds, setSelectedCertIds] = useState<string[]>([]);
  
  // סינון - לא כולל את העובד המקור
  const targetEmployees = employees.filter(emp => emp._id !== sourceEmployee._id);
  
  const handleToggleEmployee = (empId: string) => {
    setSelectedEmployeeIds(prevSelected => {
      if (prevSelected.includes(empId)) {
        return prevSelected.filter(id => id !== empId);
      } else {
        return [...prevSelected, empId];
      }
    });
  };
  
  const handleToggleCertification = (certId: string | undefined) => {
    if (!certId) return;
    
    setSelectedCertIds(prevSelected => {
      if (prevSelected.includes(certId)) {
        return prevSelected.filter(id => id !== certId);
      } else {
        return [...prevSelected, certId];
      }
    });
  };
  
  const handleSelectAllEmployees = () => {
    if (selectedEmployeeIds.length === targetEmployees.length) {
      setSelectedEmployeeIds([]);
    } else {
      setSelectedEmployeeIds(targetEmployees.map(emp => emp._id || '').filter(Boolean));
    }
  };
  
  const handleSelectAllCertifications = () => {
    if (selectedCertIds.length === sourceEmployee.certifications.length) {
      setSelectedCertIds([]);
    } else {
      setSelectedCertIds(
        sourceEmployee.certifications
          .map(cert => cert._id)
          .filter((id): id is string => id !== undefined)
      );
    }
  };
  
  const handleCopyCertifications = async () => {
    if (selectedEmployeeIds.length === 0 || selectedCertIds.length === 0) {
      setError('נא לבחור לפחות עובד אחד והסמכה אחת');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // סינון רק ההסמכות שנבחרו
      const certsToClone = sourceEmployee.certifications
        .filter(cert => cert._id && selectedCertIds.includes(cert._id));
      
      await onCopyCertifications(certsToClone, selectedEmployeeIds);
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError('אירעה שגיאה בהעתקת ההסמכות');
      console.error('Error copying certifications:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            העתקת הסמכות מ{sourceEmployee.firstName} {sourceEmployee.lastName}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="p-4">
          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
              <Check className="text-green-500 mr-2" size={20} />
              <span className="text-green-800">ההסמכות הועתקו בהצלחה!</span>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-center">
                  <AlertCircle className="text-red-500 mr-2" size={20} />
                  <span className="text-red-800">{error}</span>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* בחירת הסמכות */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-lg">בחר הסמכות להעתקה</h3>
                    <button 
                      onClick={handleSelectAllCertifications}
                      className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-100"
                    >
                      {selectedCertIds.length === sourceEmployee.certifications.length ? 'נקה הכל' : 'בחר הכל'}
                    </button>
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-80 overflow-y-auto">
                      {sourceEmployee.certifications.length > 0 ? (
                        <div className="divide-y">
                          {sourceEmployee.certifications.map((cert, index) => (
                            <label 
                              key={cert._id || index}
                              className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 ${
                                cert._id && selectedCertIds.includes(cert._id) ? 'bg-blue-50' : ''
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={cert._id ? selectedCertIds.includes(cert._id) : false}
                                onChange={() => handleToggleCertification(cert._id)}
                                className="w-4 h-4 text-blue-600 rounded"
                              />
                              <div className="mr-3 flex-1">
                                <div className="font-medium">{cert.name}</div>
                                <div className="text-xs text-gray-500">
                                  בתוקף עד: {new Date(cert.expiryDate).toLocaleDateString('he-IL')}
                                </div>
                              </div>
                              
                              {cert.isRequired && (
                                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full ml-2">
                                  חובה
                                </span>
                              )}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-gray-500">אין הסמכות להעתקה</div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* בחירת עובדים */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-lg">בחר עובדים לקבלת ההסמכות</h3>
                    <button 
                      onClick={handleSelectAllEmployees}
                      className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-100"
                    >
                      {selectedEmployeeIds.length === targetEmployees.length ? 'נקה הכל' : 'בחר הכל'}
                    </button>
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-80 overflow-y-auto">
                      {targetEmployees.length > 0 ? (
                        <div className="divide-y">
                          {targetEmployees.map((emp) => (
                            <label 
                              key={emp._id}
                              className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 ${
                                emp._id && selectedEmployeeIds.includes(emp._id) ? 'bg-blue-50' : ''
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={emp._id ? selectedEmployeeIds.includes(emp._id) : false}
                                onChange={() => handleToggleEmployee(emp._id || '')}
                                className="w-4 h-4 text-blue-600 rounded"
                              />
                              <div className="mr-3">
                                <div className="font-medium">{emp.firstName} {emp.lastName}</div>
                                <div className="text-xs text-gray-500">{emp.role} • {emp.department}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-gray-500">אין עובדים אחרים להעתקה</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* סיכום וכפתורים */}
              <div className="mt-6 flex flex-col gap-2">
                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                  <div>
                    <span className="font-medium">סה״כ נבחרו:</span>
                    <span className="mr-1">{selectedCertIds.length} הסמכות</span>
                    <span className="mx-1">•</span>
                    <span>{selectedEmployeeIds.length} עובדים</span>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    ביטול
                  </button>
                  <button
                    onClick={handleCopyCertifications}
                    disabled={isLoading || selectedCertIds.length === 0 || selectedEmployeeIds.length === 0}
                    className={`px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 ${
                      isLoading || selectedCertIds.length === 0 || selectedEmployeeIds.length === 0
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-blue-700'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        <span>מעתיק...</span>
                      </>
                    ) : (
                      <>
                        <Copy size={18} />
                        <span>העתק הסמכות</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CertificationCopyModal;