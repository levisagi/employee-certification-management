import React from 'react';
import { OJT } from '../models/employee';

interface OJTFormProps {
    title: string;
    data?: OJT;
    onChange: (data: OJT) => void;
}

const OJTForm: React.FC<OJTFormProps> = ({ title, data, onChange }) => {
    const handleChange = (field: keyof OJT, value: string) => {
        const newData: OJT = {
            mentor: data?.mentor || '',
            date: data?.date || new Date(),
            ...data,
            [field]: field === 'date' ? new Date(value) : value
        };
        onChange(newData);
    };

    return (
        <div className="p-2 border rounded bg-gray-50">
            <h5 className="text-xs font-medium mb-2 text-gray-700">{title}</h5>
            <div className="space-y-2">
                <div>
                    <label className="block text-xs mb-1 text-gray-600">שם החונך</label>
                    <input
                        type="text"
                        value={data?.mentor || ''}
                        onChange={(e) => handleChange('mentor', e.target.value)}
                        className="w-full p-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                        placeholder="הכנס שם חונך"
                    />
                </div>
                <div>
                    <label className="block text-xs mb-1 text-gray-600">תאריך</label>
                    <input
                        type="date"
                        value={data?.date ? new Date(data.date).toISOString().split('T')[0] : ''}
                        onChange={(e) => handleChange('date', e.target.value)}
                        className="w-full p-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>
        </div>
    );
};

export default OJTForm;