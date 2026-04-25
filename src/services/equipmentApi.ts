import { Equipment } from '../models/equipment';

const API_URL = process.env.NODE_ENV === 'production' 
    ? '/api'  // In production, API is on the same server
    : 'http://localhost:5001/api';  // In development, API is on port 5001

// טיפול בשגיאות
const handleResponse = async (response: Response) => {
    if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const error = await response.json();
                errorMessage = error.message || errorMessage;
            } else {
                const text = await response.text();
                errorMessage = `${errorMessage}: ${text.substring(0, 200)}`;
            }
        } catch (e) {
            // ignore parsing errors
        }
        console.error('API response error:', response.status, response.url, errorMessage);
        throw new Error(errorMessage);
    }
    return response.json();
};

// קבלת כל הציוד
export const fetchEquipment = async (): Promise<Equipment[]> => {
    try {
        const response = await fetch(`${API_URL}/equipment`);
        return await handleResponse(response);
    } catch (error) {
        console.error('Error fetching equipment:', error);
        throw error;
    }
};

// קבלת ציוד בודד
export const fetchEquipmentById = async (id: string): Promise<Equipment> => {
    try {
        const response = await fetch(`${API_URL}/equipment/${id}`);
        return await handleResponse(response);
    } catch (error) {
        console.error('Error fetching equipment by id:', error);
        throw error;
    }
};

// ⚡ טעינת קובץ תעודה - נקרא רק בעת הצורך (lazy loading)
export const fetchEquipmentCertificate = async (id: string): Promise<string> => {
    try {
        const url = `${API_URL}/equipment/${id}/certificate`;
        console.log('Fetching equipment certificate from:', url);
        const response = await fetch(url);
        const data = await handleResponse(response);
        if (!data.certificate) {
            throw new Error('Certificate data is empty');
        }
        return data.certificate;
    } catch (error) {
        console.error('Error fetching equipment certificate:', error);
        throw error;
    }
};

// יצירת ציוד חדש
export const createEquipment = async (equipment: Equipment): Promise<Equipment> => {
    try {
        const response = await fetch(`${API_URL}/equipment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(equipment),
        });
        return await handleResponse(response);
    } catch (error) {
        console.error('Error creating equipment:', error);
        throw error;
    }
};

// עדכון ציוד
export const updateEquipment = async (id: string, equipment: Equipment): Promise<Equipment> => {
    try {
        const response = await fetch(`${API_URL}/equipment/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(equipment),
        });
        return await handleResponse(response);
    } catch (error) {
        console.error('Error updating equipment:', error);
        throw error;
    }
};

// מחיקת ציוד
export const deleteEquipment = async (id: string): Promise<void> => {
    try {
        const response = await fetch(`${API_URL}/equipment/${id}`, {
            method: 'DELETE',
        });
        await handleResponse(response);
    } catch (error) {
        console.error('Error deleting equipment:', error);
        throw error;
    }
};

// חיפוש ציוד
export const searchEquipment = async (query: string): Promise<Equipment[]> => {
    try {
        const response = await fetch(`${API_URL}/equipment/search/${encodeURIComponent(query)}`);
        return await handleResponse(response);
    } catch (error) {
        console.error('Error searching equipment:', error);
        throw error;
    }
};

// עדכון סדר תצוגה
export const updateEquipmentDisplayOrder = async (equipmentIds: string[]): Promise<void> => {
    try {
        const response = await fetch(`${API_URL}/equipment/display-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ equipmentIds }),
        });
        await handleResponse(response);
    } catch (error) {
        console.error('Error updating display order:', error);
        throw error;
    }
};

