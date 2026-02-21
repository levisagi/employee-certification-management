import React, { useState, useEffect, useRef } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Users, LayoutDashboard, FileText, UserPlus, LogOut, Settings as SettingsIcon, ClipboardCopy } from 'lucide-react';
import SortableEmployeeCard from './components/SortableEmployeeCard';
import EmployeeForm from './components/EmployeeForm';
import Dashboard from './components/Dashboard';
import Reports from './components/Reports';
import Login from './components/Login';
import Settings from './components/Settings';
import CertificationCopyModal from './components/CertificationCopyModal';
import LandingPage from './components/LandingPage';
import EquipmentManager from './components/EquipmentManager';
import LoadingProgress from './components/LoadingProgress';
import { Employee, Certification } from './models/employee';
import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee, copyCertifications } from './services/api';
import { login, logout, isAuthenticated, getCurrentUser, User } from './services/auth';
import { APP_VERSION } from './version';
import './index.css';

function App() {
    const [currentPage, setCurrentPage] = useState<'landing' | 'training' | 'hr'>('landing');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [currentView, setCurrentView] = useState<'employees' | 'dashboard' | 'reports'>('employees');
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

    // קבלת רשימת המחלקות הייחודיות
    const departments = ['הכל', ...Array.from(new Set(employees.map(emp => emp.department)))];

    useEffect(() => {
        // בדיקת URL parameters לניווט ישיר למערכת
        const urlParams = new URLSearchParams(window.location.search);
        const system = urlParams.get('system');
        
        if (system === 'training') {
            setCurrentPage('training');
        } else if (system === 'equipment' || system === 'hr') {
            setCurrentPage('hr');
        }
        
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
            
            // טעינה עם timeout של 60 שניות
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 60000)
            );
            
            const data = await Promise.race([
                fetchEmployees(),
                timeoutPromise
            ]) as Employee[];
            
            setEmployees(data);
            setError(null);
        } catch (err: any) {
            console.error('Error loading employees:', err);
            setError(err.message === 'Timeout' ? 'הטעינה לוקחת זמן רב מדי. בדוק את החיבור לאינטרנט.' : 'שגיאה בטעינת עובדים');
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

    // Sensors לגרירה
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // פונקציה לטיפול בגרירה ושחרור של עובדים
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        const oldIndex = filteredEmployees.findIndex(emp => emp._id === active.id);
        const newIndex = filteredEmployees.findIndex(emp => emp._id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
            const reorderedFiltered = arrayMove(filteredEmployees, oldIndex, newIndex);
            
            // עדכון המערך המלא של העובדים
            const filteredIds = new Set(reorderedFiltered.map(emp => emp._id));
            const nonFilteredEmployees = employees.filter(emp => !filteredIds.has(emp._id));
            
            const newEmployeesOrder = [...reorderedFiltered, ...nonFilteredEmployees];
            setEmployees(newEmployeesOrder);

            // שמירת הסדר החדש במסד הנתונים
            try {
                const employeeOrders = newEmployeesOrder.map((emp, index) => ({
                    id: emp._id,
                    displayOrder: index
                }));

                await fetch('http://localhost:5001/api/employees/reorder', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ employeeOrders }),
                });
            } catch (error) {
                console.error('Error saving display order:', error);
            }
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

    // Landing Page
    if (currentPage === 'landing') {
        return (
            <LandingPage
                onNavigateToTraining={() => {
                    setCurrentPage('training');
                    window.history.pushState({}, '', '?system=training');
                }}
                onNavigateToHR={() => {
                    setCurrentPage('hr');
                    window.history.pushState({}, '', '?system=equipment');
                }}
            />
        );
    }

    // Equipment Management System
    if (currentPage === 'hr') {
        return <EquipmentManager onBackToHome={() => {
            setCurrentPage('landing');
            window.history.pushState({}, '', '/');
        }} />;
    }

    // Training System
    if (!isUserAuthenticated) {
        return <Login onLogin={handleLogin} error={loginError || undefined} />;
    }

    if (loading && employees.length === 0) {
        return <LoadingProgress message="טוען נתוני עובדים..." />;
    }

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
                        {/* מספר גרסה בצד שמאל */}
                        <div className="w-1/4 flex justify-start">
                            <span className="text-xs text-white">v {APP_VERSION}</span>
                        </div>
                        
                        {/* כותרת במרכז */}
                        <div className="text-center w-2/4 flex flex-col items-center">
                            <div className="flex items-center gap-2">
                                <img src="/images/logo.svg" alt="Employee Certification Logo" className="h-10 w-10" />
                                <h1 className="text-xl font-bold text-white tracking-wide">
                                    Employee Certification
                                </h1>
                            </div>
                            <div className="text-xs text-white mt-0.5 tracking-wider">
                                Training Management System
                            </div>
                        </div>
                        
                        {/* User and Settings */}
                        <div className="flex items-center gap-2 justify-end w-1/4">
                            <div className="text-xs text-gray-300">
                                {currentUser?.fullName || currentUser?.username}
                            </div>
                            <button
                                onClick={() => {
                                    setCurrentPage('landing');
                                    window.history.pushState({}, '', '/');
                                }}
                                className="flex items-center gap-0.5 bg-[#172A46] text-gray-300 px-2 py-1 rounded-lg 
                                         hover:bg-[#1F3A67] transition-colors text-xs"
                            >
                                <span>חזרה לתפריט</span>
                            </button>
                            <button
                                onClick={() => setShowSettings(true)}
                                className="flex items-center gap-0.5 bg-[#172A46] text-gray-300 px-2 py-1 rounded-lg 
                                         hover:bg-[#1F3A67] transition-colors text-xs"
                            >
                                <SettingsIcon size={13} />
                                <span>הגדרות</span>
                            </button>
                            
                            <button
                                onClick={() => {
                                    handleLogout();
                                    setCurrentPage('landing');
                                    window.history.pushState({}, '', '/');
                                }}
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
                        
                        {/* שדה חיפוש - במרכז */}
                        <div className="flex-1 flex justify-center w-1/3">
                            {currentView === 'employees' && (
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
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
                            )}
                        </div>
                        
                        {/* בחירת מחלקה וכפתור הוספה - בצד שמאל */}
                        <div className="flex items-center gap-2 justify-end w-1/3">
                            {currentView === 'employees' && (
                                <>
                                    <select
                                        value={selectedDepartment}
                                        onChange={(e) => setSelectedDepartment(e.target.value)}
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
                        {/* הודעה על אפשרות גרירה */}
                        {searchQuery === '' && selectedDepartment === 'הכל' && (
                            <div className="mb-3 text-center text-xs text-gray-400">
                                💡 ניתן לגרור ולשחרר כרטיסי עובדים כדי לשנות את הסדר
                            </div>
                        )}
                        
                        {/* תצוגת כל העובדים עם אפשרות גרירה */}
                        <DndContext 
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext 
                                items={filteredEmployees.map(emp => emp._id || '')}
                                strategy={verticalListSortingStrategy}
                            >
                                <div 
                                    className="flex flex-wrap gap-4"
                                    style={{ direction: 'rtl' }}
                                >
                                    {filteredEmployees.map((employee) => (
                                        <SortableEmployeeCard
                                            key={employee._id}
                                            employee={employee}
                                            onEdit={(emp) => {
                                                setEditingEmployee(emp);
                                                setShowForm(true);
                                            }}
                                            onDelete={handleDeleteEmployee}
                                            onCopyCertifications={handleCopyCertifications}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
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