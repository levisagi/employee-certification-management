import React, { useState, useEffect } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { Users, LayoutDashboard, FileText, UserPlus, LogOut, Settings as SettingsIcon } from 'lucide-react';
import EmployeeCard from './components/EmployeeCard';
import EmployeeForm from './components/EmployeeForm';
import Dashboard from './components/Dashboard';
import Reports from './components/Reports';
import Login from './components/Login';
import Settings from './components/Settings';
import { Employee } from './models/employee';
import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee } from './services/api';
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
    const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
    const [isUserAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loginError, setLoginError] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [settings, setSettings] = useState({
        username: 'admin',
        // הגדרות נוספות...
    });
    
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

    // סינון העובדים לפי מחלקה
    const filteredEmployees = selectedDepartment === 'הכל' 
        ? employees
        : employees.filter(emp => emp.department === selectedDepartment);

    const nextPage = () => {
        if ((currentPage + 1) * employeesPerPage < filteredEmployees.length) {
            setCurrentPage(prev => prev + 1);
        }
    };

    const prevPage = () => {
        if (currentPage > 0) {
            setCurrentPage(prev => prev - 1);
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
                <div className="container mx-auto py-3 px-4">
                    <div className="flex flex-col items-center">
                        <div className="w-full flex justify-between items-center mb-4">
                            <h1 className="text-2xl font-bold">
                                מערכת ניהול כשירות מבצעית
                            </h1>
                            
                            <div className="flex items-center gap-3">
                                <div className="text-sm text-gray-300 ml-2">
                                    {currentUser?.fullName || currentUser?.username}
                                </div>
                                <button
                                    onClick={() => setShowSettings(true)}
                                    className="flex items-center gap-1 bg-[#172A46] text-gray-300 px-3 py-1.5 rounded-lg 
                                             hover:bg-[#1F3A67] transition-colors text-sm"
                                >
                                    <SettingsIcon size={16} />
                                    <span>הגדרות</span>
                                </button>
                                
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-1 bg-[#172A46] text-gray-300 px-3 py-1.5 rounded-lg 
                                             hover:bg-[#1F3A67] transition-colors text-sm"
                                >
                                    <LogOut size={16} />
                                    <span>התנתק</span>
                                </button>
                            </div>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex flex-wrap justify-center items-center gap-3">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentView('employees')}
                                    className={`px-4 py-1.5 rounded-lg transition-all duration-200 flex items-center font-medium text-sm ${
                                        currentView === 'employees'
                                        ? 'bg-white text-[#0A192F] shadow-lg transform scale-105'
                                        : 'bg-[#172A46] text-white hover:bg-[#1F3A67]'
                                    }`}
                                >
                                    <Users size={16} className="ml-2" />
                                    עובדים
                                </button>
                                <button
                                    onClick={() => setCurrentView('dashboard')}
                                    className={`px-4 py-1.5 rounded-lg transition-all duration-200 flex items-center font-medium text-sm ${
                                        currentView === 'dashboard'
                                        ? 'bg-white text-[#0A192F] shadow-lg transform scale-105'
                                        : 'bg-[#172A46] text-white hover:bg-[#1F3A67]'
                                    }`}
                                >
                                    <LayoutDashboard size={16} className="ml-2" />
                                    דשבורד
                                </button>
                                <button
                                    onClick={() => setCurrentView('reports')}
                                    className={`px-4 py-1.5 rounded-lg transition-all duration-200 flex items-center font-medium text-sm ${
                                        currentView === 'reports'
                                        ? 'bg-white text-[#0A192F] shadow-lg transform scale-105'
                                        : 'bg-[#172A46] text-white hover:bg-[#1F3A67]'
                                    }`}
                                >
                                    <FileText size={16} className="ml-2" />
                                    דוחות
                                </button>
                            </div>
                            
                            {currentView === 'employees' && (
                                <div className="flex gap-2 items-center">
                                    <select
                                        value={selectedDepartment}
                                        onChange={(e) => {
                                            setSelectedDepartment(e.target.value);
                                            setCurrentPage(0);
                                        }}
                                        className="text-gray-800 text-sm px-3 py-1.5 rounded-lg border-0 focus:ring-2 focus:ring-white/20 bg-white/90"
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
                                        className="text-sm bg-emerald-500 text-white px-3 py-1.5 rounded-lg 
                                        hover:bg-emerald-400 transition-colors flex items-center gap-2 font-medium"
                                    >
                                        <UserPlus size={16} />
                                        הוסף
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto p-4">
                {currentView === 'employees' && (
                    <div className="relative">
                        <div className="min-h-[600px]">
                            <TransitionGroup className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {filteredEmployees
                                    .slice(currentPage * employeesPerPage, (currentPage + 1) * employeesPerPage)
                                    .map(employee => (
                                        <CSSTransition
                                            key={employee._id}
                                            timeout={500}
                                            classNames="page-transition"
                                        >
                                            <EmployeeCard 
                                                employee={employee}
                                                onEdit={(emp) => {
                                                    setEditingEmployee(emp);
                                                    setShowForm(true);
                                                }}
                                                onDelete={handleDeleteEmployee}
                                            />
                                        </CSSTransition>
                                    ))}
                            </TransitionGroup>
                        </div>

                        {/* Centered Navigation */}
                        <div className="flex justify-center items-center gap-4 mt-6">
                            <button
                                onClick={prevPage}
                                disabled={currentPage === 0}
                                className={`transform transition-all duration-300 ease-in-out ${
                                    currentPage === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
                                }`}
                            >
                                <div className="bg-blue-100 text-blue-600 p-2 rounded-full shadow-lg flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </button>

                            <div className="text-gray-600 text-sm font-medium px-4">
                                עמוד {currentPage + 1} מתוך {Math.ceil(filteredEmployees.length / employeesPerPage)}
                            </div>

                            <button
                                onClick={nextPage}
                                disabled={(currentPage + 1) * employeesPerPage >= filteredEmployees.length}
                                className={`transform transition-all duration-300 ease-in-out ${
                                    (currentPage + 1) * employeesPerPage >= filteredEmployees.length ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
                                }`}
                            >
                                <div className="bg-blue-100 text-blue-600 p-2 rounded-full shadow-lg flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </div>
                            </button>
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
        </div>
    );
}

export default App;