import { Employee } from '../models/employee';

const API_URL = 'http://localhost:5001/api';

export const fetchEmployees = async (): Promise<Employee[]> => {
    const response = await fetch(`${API_URL}/employees`);
    if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        throw new Error(errorData.message || 'Failed to fetch employees');
    }
    return response.json();
};

export const createEmployee = async (employee: Employee): Promise<Employee> => {
    const response = await fetch(`${API_URL}/employees`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...employee,
            certifications: employee.certifications.map(cert => ({
                ...cert,
                isRequired: cert.isRequired || false,
                ojt1: cert.ojt1 ? {
                    ...cert.ojt1,
                    date: new Date(cert.ojt1.date)
                } : undefined,
                ojt2: cert.ojt2 ? {
                    ...cert.ojt2,
                    date: new Date(cert.ojt2.date)
                } : undefined
            }))
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        throw new Error(errorData.message || 'Failed to create employee');
    }

    return response.json();
};

export const updateEmployee = async (id: string, employee: Employee): Promise<Employee> => {
    console.log('Sending update request:', employee);
    console.log('Certifications being sent:', employee.certifications.map(cert => ({
        name: cert.name,
        isRequired: cert.isRequired
    })));

    const response = await fetch(`${API_URL}/employees/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...employee,
            certifications: employee.certifications.map(cert => ({
                ...cert,
                isRequired: cert.isRequired || false,
                ojt1: cert.ojt1 ? {
                    ...cert.ojt1,
                    date: new Date(cert.ojt1.date)
                } : undefined,
                ojt2: cert.ojt2 ? {
                    ...cert.ojt2,
                    date: new Date(cert.ojt2.date)
                } : undefined
            }))
        }),
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        throw new Error(errorData.message || 'Failed to update employee');
    }
    
    const updatedEmployee = await response.json();
    console.log('Updated employee response:', updatedEmployee);
    return updatedEmployee;
};

export const deleteEmployee = async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/employees/${id}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        throw new Error(errorData.message || 'Failed to delete employee');
    }
};