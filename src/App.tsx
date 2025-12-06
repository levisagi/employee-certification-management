import React, { useState, useEffect, useRef } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { Users, LayoutDashboard, FileText, UserPlus, LogOut, Settings as SettingsIcon, ClipboardCopy } from 'lucide-react';
import EmployeeCard from './components/EmployeeCard';
import EmployeeForm from './components/EmployeeForm';
import Dashboard from './components/Dashboard';
import Reports from './components/Reports';
import Login from './components/Login';
import Settings from './components/Settings';
import CertificationCopyModal from './components/CertificationCopyModal';
import { Employee, Certification } from './models/employee';
import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee, copyCertifications } from './services/api';
import { login, logout, isAuthenticated, getCurrentUser, User } from './services/auth';
import './index.css';

function App() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [currentView, setCurrentView] = useState<'employees' | 'dashboard' | 'reports'>('employees');
    const [currentPage, setCurrentPage] = useState(0);
    const [selectedDepartment, setSelectedDepartment] = useState<string>('ניווט');
    const [isUserAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loginError, setLoginError] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [settings, setSettings] = useState({
        username: 'admin',
        // הגדרות נוספות...
    });
    
    // State לחיפוש עובד
    const [searchQuery, setSearchQuery] = useState<string>('');
    
    // State לחלונית העתקת ההסמכות
    const [showCertCopyModal, setShowCertCopyModal] = useState(false);
    const [certCopySourceEmployee, setCertCopySourceEmployee] = useState<Employee | null>(null);
    
    // רפרנס לאזור התצוגה של העובדים
    const employeesSectionRef = useRef<HTMLDivElement>(null);
    
    const employeesPerPage = 3;

    // קבלת רשימת המחלקות הייחודיות
    const departments = ['הכל', ...Array.from(new Set(employees.map(emp => emp.department)))];

    useEffect(() => {
        // בדיקת התחברות קודמת
        const authenticated = isAuthenticated();
        if (authenticated) {
            setIsAuthenticated(true);
            setCurrentUser(getCurrentUser());
            loadEmployees();
        } else {
            setLoading(false);
        }
    }, []);

    const loadEmployees = async () => {
        try {
            setLoading(true);
            const data = await fetchEmployees();
            setEmployees(data);
            setError(null);
        } catch (err) {
            setError('Failed to load employees');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (username: string, password: string) => {
        setLoading(true);
        
        try {
            const result = await login(username, password);
            
            if (result.success) {
                setIsAuthenticated(true);
                setCurrentUser(result.user || null);
                setLoginError(null);
                loadEmployees();
            } else {
                setLoginError(result.error || 'שגיאת התחברות');
            }
        } catch (error) {
            setLoginError('אירעה שגיאה בהתחברות');
            console.error('Login error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        setIsAuthenticated(false);
        setCurrentUser(null);
    };

    const handleAddEmployee = async (newEmployee: Employee) => {
        try {
            const savedEmployee = await createEmployee(newEmployee);
            setEmployees(prev => [...prev, savedEmployee]);
            setShowForm(false);
        } catch (err) {
            setError('Failed to add employee');
        }
    };

    const handleEditEmployee = async (updatedEmployee: Employee) => {
        try {
            if (!updatedEmployee._id) throw new Error('Employee ID is missing');
            const saved = await updateEmployee(updatedEmployee._id, updatedEmployee);
            setEmployees(prev => prev.map(emp => emp._id === saved._id ? saved : emp));
            setEditingEmployee(null);
            setShowForm(false);
        } catch (err) {
            setError('Failed to update employee');
        }
    };

    const handleDeleteEmployee = async (id: string | undefined) => {
        try {
            if (!id) throw new Error('Employee ID is missing');
            await deleteEmployee(id);
            setEmployees(prev => prev.filter(emp => emp._id !== id));
        } catch (err) {
            setError('Failed to delete employee');
        }
    };

    const handleSaveSettings = (newSettings: any) => {
        setSettings(newSettings);
        // במציאות, שמור את ההגדרות בשרת/מסד נתונים
        localStorage.setItem('settings', JSON.stringify(newSettings));
    };

    // טיפול בהעתקת הסמכות
    const handleCopyCertifications = (employee: Employee) => {
        setCertCopySourceEmployee(employee);
        setShowCertCopyModal(true);
    };

    const handleDoCopyCertifications = async (certs: Certification[], targetEmployeeIds: string[]) => {
        try {
            await copyCertifications(certs, targetEmployeeIds);
            // רענון רשימת העובדים לאחר ההעתקה
            await loadEmployees();
        } catch (err) {
            console.error("Error copying certifications:", err);
            throw err;
        }
    };

    // סינון העובדים לפי מחלקה וחיפוש
    const filteredEmployees = employees
        // סינון לפי מחלקה
        .filter(emp => selectedDepartment === 'הכל' || emp.department === selectedDepartment)
        // סינון לפי חיפוש
        .filter(emp => {
            if (!searchQuery.trim()) return true;
            const query = searchQuery.toLowerCase().trim();
            return (
                emp.firstName.toLowerCase().includes(query) ||
                emp.lastName.toLowerCase().includes(query) ||
                emp.employeeNumber.toLowerCase().includes(query) ||
                emp.role.toLowerCase().includes(query) ||
                emp.department.toLowerCase().includes(query)
            );
        });
        
    // גלילה חלקה למיקום העמוד בעת מעבר
    const ensureVisibleEmployeesSection = () => {
        if (employeesSectionRef.current) {
            const rect = employeesSectionRef.current.getBoundingClientRect();
            // בדוק אם החלק העליון של אזור העובדים מחוץ לתצוגה
            if (rect.top < 0) {
                employeesSectionRef.current.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start'
                });
            }
        }
    };

    const nextPage = () => {
        if ((currentPage + 1) * employeesPerPage < filteredEmployees.length) {
            // מעבר עם אנימציה חלקה
            setCurrentPage(prev => prev + 1);
            // ודא שאזור העובדים נראה
            setTimeout(ensureVisibleEmployeesSection, 100);
        }
    };

    const prevPage = () => {
        if (currentPage > 0) {
            // מעבר עם אנימציה חלקה
            setCurrentPage(prev => prev - 1);
            // ודא שאזור העובדים נראה
            setTimeout(ensureVisibleEmployeesSection, 100);
        }
    };

    if (!isUserAuthenticated) {
        return <Login onLogin={handleLogin} error={loginError || undefined} />;
    }

    if (loading && employees.length === 0) return (
        <div className="min-h-screen bg-gray-200 flex items-center justify-center">
            <div className="text-center text-gray-600">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>טוען...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-gray-200 flex items-center justify-center">
            <div className="text-center text-red-500">
                <p className="text-xl mb-2">😕</p>
                <p>{error}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-200">
            {/* Header with background */}
            <div className="bg-[#0A192F] text-white shadow-lg">
                <div className="container mx-auto py-2 px-3">
                    {/* שורה ראשונה: כותרת במרכז, משתמש וכפתורים */}
                    <div className="flex items-center justify-between mb-2">
                        {/* רווח ריק בצד ימין לאיזון */}
                        <div className="w-1/4"></div>
                        
                        {/* כותרת במרכז */}
                        <div className="text-center w-2/4 flex flex-col items-center">
                            <div className="flex items-center gap-2">
                                <img src="/images/logo.svg" alt="CertVision Logo" className="h-10 w-10" />
                                <h1 className="text-2xl font-bold text-white">
                                    CertVision
                                </h1>
                            </div>
                            <div className="text-xs text-white mt-0.5">
                                Certification Management Excellence
                            </div>
                        </div>
                        
                        {/* User and Settings */}
                        <div className="flex items-center gap-2 justify-end w-1/4">
                            <div className="text-xs text-gray-300">
                                {currentUser?.fullName || currentUser?.username}
                            </div>
                            <button
                                onClick={() => setShowSettings(true)}
                                className="flex items-center gap-0.5 bg-[#172A46] text-gray-300 px-2 py-1 rounded-lg 
                                         hover:bg-[#1F3A67] transition-colors text-xs"
                            >
                                <SettingsIcon size={13} />
                                <span>הגדרות</span>
                            </button>
                            
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-0.5 bg-[#172A46] text-gray-300 px-2 py-1 rounded-lg 
                                         hover:bg-[#1F3A67] transition-colors text-xs"
                            >
                                <LogOut size={13} />
                                <span>התנתק</span>
                            </button>
                        </div>
                    </div>
                    
                    {/* שורה שנייה: ניווט, בחירת מחלקה וכפתור הוספה */}
                    <div className="flex items-center">
                        {/* Navigation Buttons עם בחירת מחלקה וכפתור הוספה - רוחב מוגבל */}
                        <div className="flex items-center gap-2 w-1/3">
                            <button
                                onClick={() => setCurrentView('employees')}
                                className={`px-2.5 py-1 rounded-lg transition-all duration-200 flex items-center font-medium text-xs ${
                                    currentView === 'employees'
                                    ? 'bg-white text-[#0A192F] shadow-lg transform scale-105'
                                    : 'bg-[#172A46] text-white hover:bg-[#1F3A67]'
                                }`}
                            >
                                <Users size={13} className="ml-1.5" />
                                עובדים
                            </button>
                            <button
                                onClick={() => setCurrentView('dashboard')}
                                className={`px-2.5 py-1 rounded-lg transition-all duration-200 flex items-center font-medium text-xs ${
                                    currentView === 'dashboard'
                                    ? 'bg-white text-[#0A192F] shadow-lg transform scale-105'
                                    : 'bg-[#172A46] text-white hover:bg-[#1F3A67]'
                                }`}
                            >
                                <LayoutDashboard size={13} className="ml-1.5" />
                                דשבורד
                            </button>
                            <button
                                onClick={() => setCurrentView('reports')}
                                className={`px-2.5 py-1 rounded-lg transition-all duration-200 flex items-center font-medium text-xs ${
                                    currentView === 'reports'
                                    ? 'bg-white text-[#0A192F] shadow-lg transform scale-105'
                                    : 'bg-[#172A46] text-white hover:bg-[#1F3A67]'
                                }`}
                            >
                                <FileText size={13} className="ml-1.5" />
                                דוחות
                            </button>
                        </div>
                        
                        {/* כפתורי ניווט בין עובדים - במרכז אמיתי */}
                        <div className="flex-1 flex justify-center w-1/3">
                            {currentView === 'employees' && (
                                <div className="flex items-center gap-2">
                                    {/* שדה חיפוש */}
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value);
                                                setCurrentPage(0); // חזרה לעמוד הראשון בעת חיפוש
                                            }}
                                            placeholder="חיפוש עובד..."
                                            className="text-xs px-3 py-1 rounded-lg border-0 bg-[#172A46] text-white placeholder-gray-400 focus:ring-2 focus:ring-white/20 w-40"
                                        />
                                        {searchQuery && (
                                            <button
                                                onClick={() => setSearchQuery('')}
                                                className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                    
                                    {filteredEmployees.length > 0 && (
                                        <>
                                            <button 
                                                onClick={prevPage} 
                                                disabled={currentPage === 0}
                                                className="flex items-center justify-center w-5 h-5 rounded-full bg-[#172A46] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1F3A67] transition-colors"
                                                aria-label="העמוד הקודם"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                            <div className="text-xs text-white">
                                                {currentPage + 1} / {Math.ceil(filteredEmployees.length / employeesPerPage)}
                                            </div>
                                            <button 
                                                onClick={nextPage} 
                                                disabled={(currentPage + 1) * employeesPerPage >= filteredEmployees.length}
                                                className="flex items-center justify-center w-5 h-5 rounded-full bg-[#172A46] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1F3A67] transition-colors"
                                                aria-label="העמוד הבא"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                                </svg>
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        {/* בחירת מחלקה וכפתור הוספה - בצד שמאל */}
                        <div className="flex items-center gap-2 justify-end w-1/3">
                            {currentView === 'employees' && (
                                <>
                                    <select
                                        value={selectedDepartment}
                                        onChange={(e) => {
                                            setSelectedDepartment(e.target.value);
                                            setCurrentPage(0);
                                        }}
                                        className="text-gray-800 text-xs px-2 py-1 rounded-lg border-0 focus:ring-2 focus:ring-white/20 bg-white/90"
                                    >
                                        {departments.map((dept, index) => (
                                            <option key={index} value={dept === 'הכל' ? 'הכל' : dept}>
                                                {dept === 'הכל' ? 'כל המחלקות' : dept}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => {
                                            setEditingEmployee(null);
                                            setShowForm(true);
                                        }}
                                        className="text-xs bg-emerald-500 text-white px-2 py-1 rounded-lg 
                                        hover:bg-emerald-400 transition-colors flex items-center gap-1.5 font-medium"
                                    >
                                        <UserPlus size={13} />
                                        הוסף
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 pb-4 pt-4 overflow-visible">
                {currentView === 'employees' && (
                    <div id="employees-section" ref={employeesSectionRef} className="relative overflow-visible">
                        {/* שינוי כאן: הסרת כפתורי החיצים מכאן */}
                        <div className="flex items-center relative page-container overflow-visible">
                            <div className="transition-container min-h-[600px] w-full">
                                <TransitionGroup className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {filteredEmployees
                                        .slice(currentPage * employeesPerPage, (currentPage + 1) * employeesPerPage)
                                        .map(employee => (
                                            <CSSTransition
                                                key={employee._id}
                                                timeout={300}
                                                classNames="page-transition"
                                            >
                                                <EmployeeCard 
                                                    employee={employee}
                                                    onEdit={(emp) => {
                                                        setEditingEmployee(emp);
                                                        setShowForm(true);
                                                    }}
                                                    onDelete={handleDeleteEmployee}
                                                    onCopyCertifications={handleCopyCertifications}
                                                />
                                            </CSSTransition>
                                        ))}
                                </TransitionGroup>
                            </div>
                        </div>
                    </div>
                )}
                
                {currentView === 'dashboard' && (
                    <Dashboard employees={employees} />
                )}
                
                {currentView === 'reports' && (
                    <Reports employees={employees} />
                )}
            </div>
            
            {/* Modal Form */}
            {showForm && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowForm(false)}
                >
                    <div 
                        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-4 border-b flex justify-between items-center">
                            <h2 className="text-xl font-semibold">
                                {editingEmployee ? 'עריכת עובד' : 'הוספת עובד חדש'}
                            </h2>
                            <button 
                                onClick={() => setShowForm(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="p-4">
                            <EmployeeForm 
                                onSubmit={editingEmployee ? handleEditEmployee : handleAddEmployee}
                                initialData={editingEmployee}
                                onCancel={() => setShowForm(false)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {showSettings && (
                <Settings 
                    onClose={() => setShowSettings(false)}
                    onSave={handleSaveSettings}
                    currentSettings={settings}
                />
            )}

            {/* Certification Copy Modal */}
            {showCertCopyModal && certCopySourceEmployee && (
                <CertificationCopyModal
                    sourceEmployee={certCopySourceEmployee}
                    employees={employees}
                    onClose={() => setShowCertCopyModal(false)}
                    onCopyCertifications={handleDoCopyCertifications}
                />
            )}
        </div>
    );
}

export default App;