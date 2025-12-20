import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Employee } from '../models/employee';
import EmployeeCard from './EmployeeCard';

interface SortableEmployeeCardProps {
    employee: Employee;
    onEdit: (employee: Employee) => void;
    onDelete: (id: string | undefined) => void;
    onCopyCertifications?: (employee: Employee) => void;
}

const SortableEmployeeCard: React.FC<SortableEmployeeCardProps> = ({
    employee,
    onEdit,
    onDelete,
    onCopyCertifications
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: employee._id || '' });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div 
            ref={setNodeRef} 
            style={style}
            className="w-full md:w-[calc(33.333%-0.67rem)]"
        >
            <EmployeeCard
                employee={employee}
                onEdit={onEdit}
                onDelete={onDelete}
                onCopyCertifications={onCopyCertifications}
                dragHandleProps={{ ...attributes, ...listeners }}
            />
        </div>
    );
};

export default SortableEmployeeCard;

