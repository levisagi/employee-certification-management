import React, { useState, useEffect, useMemo } from 'react';
import { Employee } from '../models/employee';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Activity, Users, AlertTriangle, Award, TrendingUp } from 'lucide-react';

interface DashboardProps {
    employees: Employee[];
}

const Dashboard: React.FC<DashboardProps> = ({ employees }) => {
    const [summaryData, setSummaryData] = useState({
        totalEmployees: 0,
        expiringThisMonth: 0,
        expiringThisYear: 0,
        pendingOJT: 0,
        avgQualification: 0
    });

    // חישוב כשירות לעובד בודד
    const calculateEmployeeQualification = (employee: Employee) => {
        const REQUIRED_CERTIFICATIONS = 7;
        const PROGRESS_PER_CERTIFICATION = Math.round(100 / REQUIRED_CERTIFICATIONS);
        
        const validRequiredCerts = employee.certifications.filter(cert => {
            const isValid = new Date(cert.expiryDate) > new Date();
            const hasOJT = cert.ojt1 && cert.ojt2;
            return cert.isRequired && isValid && hasOJT;
        }).length;

        const certScore = Math.min((validRequiredCerts * PROGRESS_PER_CERTIFICATION), 100) * 0.5;

        const experienceYears = Math.min(
            ((new Date().getTime() - new Date(employee.startDate).getTime()) / (1000 * 60 * 60 * 24 * 365)),
            3
        ) / 3;
        const experienceScore = experienceYears * 100 * 0.5;

        return Math.round(certScore + experienceScore);
    };

    // חישוב נתוני סיכום
    useEffect(() => {
        const now = new Date();
        const monthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        const yearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

        let expiringThisMonth = 0;
        let expiringThisYear = 0;
        let pendingOJT = 0;
        let totalQualification = 0;

        employees.forEach(employee => {
            const qualification = calculateEmployeeQualification(employee);
            totalQualification += qualification;

            employee.certifications.forEach(cert => {
                const expiryDate = new Date(cert.expiryDate);
                if (expiryDate <= monthFromNow) expiringThisMonth++;
                if (expiryDate <= yearFromNow) expiringThisYear++;
                if (!cert.ojt1 || !cert.ojt2) pendingOJT++;
            });
        });

        setSummaryData({
            totalEmployees: employees.length,
            expiringThisMonth,
            expiringThisYear,
            pendingOJT,
            avgQualification: employees.length ? Math.round(totalQualification / employees.length) : 0
        });
    }, [employees]);

    // נתונים לפי מחלקות
    const departmentStats = useMemo(() => {
        const data: { [key: string]: { qualified: number, partial: number, unqualified: number, total: number } } = {};
        
        employees.forEach(emp => {
            if (!data[emp.department]) {
                data[emp.department] = { qualified: 0, partial: 0, unqualified: 0, total: 0 };
            }
            
            const qualification = calculateEmployeeQualification(emp);
            data[emp.department].total++;
            
            if (qualification >= 90) data[emp.department].qualified++;
            else if (qualification >= 70) data[emp.department].partial++;
            else data[emp.department].unqualified++;
        });

        return Object.entries(data).map(([name, stats]) => ({
            name,
            qualified: stats.qualified,
            partial: stats.partial,
            unqualified: stats.unqualified,
            total: stats.total
        }));
    }, [employees]);

    // חישוב כשירות ממוצעת למחלקה
    const departmentQualifications = useMemo(() => {
        const qualifications: { [key: string]: { total: number, count: number } } = {};
        
        employees.forEach(emp => {
            if (!qualifications[emp.department]) {
                qualifications[emp.department] = { total: 0, count: 0 };
            }
            
            const qualification = calculateEmployeeQualification(emp);
            qualifications[emp.department].total += qualification;
            qualifications[emp.department].count++;
        });

        return Object.entries(qualifications).map(([department, stats]) => ({
            department,
            qualification: Math.round(stats.total / stats.count)
        }));
    }, [employees]);

    // קומפוננטת כרטיס מחלקה
    const DepartmentQualificationCard = ({ department, qualification }: { department: string, qualification: number }) => (
        <div className="bg-[#1E293B] rounded-lg p-4 shadow-lg relative overflow-hidden">
            <div className="relative z-10">
                <h4 className="text-base font-medium text-gray-200 mb-1">{department}</h4>
                <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-gray-100">{qualification}%</span>
                    <span className="text-xs text-gray-400 mb-0.5">כשירות ממוצעת</span>
                </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                <div 
                    className="absolute bottom-0 left-0 h-full transition-all duration-500"
                    style={{ 
                        width: `${qualification}%`,
                        backgroundColor: qualification >= 90 ? '#10B981' : qualification >= 70 ? '#F59E0B' : '#EF4444'
                    }}
                />
            </div>
        </div>
    );

    // קומפוננטת כרטיס סטטיסטיקה
    const StatCard = ({ title, value, icon: Icon, trend }: { title: string, value: number, icon: any, trend?: string }) => (
        <div className="bg-[#1E293B] rounded-lg p-3 shadow-lg">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xs font-medium text-gray-400 mb-1">{title}</h3>
                    <p className="text-xl font-bold text-gray-100">{value}</p>
                </div>
                <div className="p-1.5 bg-[#334155] rounded-lg">
                    <Icon size={16} className="text-blue-400" />
                </div>
            </div>
            {trend && (
                <div className="mt-1 flex items-center text-xs">
                    <TrendingUp size={12} className="text-green-400 mr-1" />
                    <span className="text-green-400 text-xs">{trend}</span>
                </div>
            )}
        </div>
    );

    // קומפוננטת טולטיפ מותאם
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#1E293B] p-2 rounded-lg shadow-lg border border-[#334155] text-xs">
                    <p className="font-medium text-gray-100">{payload[0].payload.name}</p>
                    <p className="text-gray-400">
                        כשירים: <span className="text-green-400">{payload[0].payload.qualified}</span>
                    </p>
                    <p className="text-gray-400">
                        חלקית: <span className="text-yellow-400">{payload[0].payload.partial}</span>
                    </p>
                    <p className="text-gray-400">
                        לא כשירים: <span className="text-red-400">{payload[0].payload.unqualified}</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="p-4 bg-[#0F172A] text-gray-100 min-h-screen">
            {/* Header */}
            <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-100">דשבורד כשירות מבצעית</h2>
                <p className="text-xs text-gray-400">מבט כולל על מצב הכשירות בארגון</p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <StatCard 
                    title="סה״כ עובדים"
                    value={summaryData.totalEmployees}
                    icon={Users}
                />
                <StatCard 
                    title="כשירות ממוצעת"
                    value={summaryData.avgQualification}
                    icon={Activity}
                    trend="5% שיפור"
                />
                <StatCard 
                    title="פג תוקף החודש"
                    value={summaryData.expiringThisMonth}
                    icon={AlertTriangle}
                />
                <StatCard 
                    title="ממתינים ל-OJT"
                    value={summaryData.pendingOJT}
                    icon={Award}
                />
            </div>

            {/* Department Qualifications */}
            <div className="mb-4">
                <h3 className="text-sm font-semibold mb-2 text-gray-100">כשירות מחלקתית</h3>
                <div className="grid grid-cols-2 gap-3">
                    {departmentQualifications.map(({ department, qualification }) => (
                        <DepartmentQualificationCard
                            key={department}
                            department={department}
                            qualification={qualification}
                        />
                    ))}
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* Line Chart */}
                <div className="bg-[#1E293B] rounded-lg p-4 shadow-lg">
                    <h3 className="text-sm font-semibold mb-4 text-gray-100">כשירות לפי מחלקות</h3>
                    <div className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={departmentStats}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
                                <YAxis stroke="#94A3B8" fontSize={12} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line 
                                    type="monotone" 
                                    dataKey="qualified" 
                                    stroke="#10B981" 
                                    strokeWidth={2}
                                    name="כשירים"
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="partial" 
                                    stroke="#F59E0B" 
                                    strokeWidth={2}
                                    name="כשירות חלקית"
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="unqualified" 
                                    stroke="#EF4444" 
                                    strokeWidth={2}
                                    name="לא כשירים"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="bg-[#1E293B] rounded-lg p-4 shadow-lg">
                    <h3 className="text-sm font-semibold mb-4 text-gray-100">התפלגות רמות כשירות</h3>
                    <div className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'כשירים', value: departmentStats.reduce((acc, curr) => acc + curr.qualified, 0) },
                                        { name: 'כשירות חלקית', value: departmentStats.reduce((acc, curr) => acc + curr.partial, 0) },
                                        { name: 'לא כשירים', value: departmentStats.reduce((acc, curr) => acc + curr.unqualified, 0) }
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={45}
                                    outerRadius={60}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    <Cell fill="#10B981" />
                                    <Cell fill="#F59E0B" />
                                    <Cell fill="#EF4444" />
                                </Pie>
                                <Tooltip />
                                <Legend 
                                    verticalAlign="bottom"
                                    height={36}
                                    formatter={(value) => <span className="text-gray-300 text-xs">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;