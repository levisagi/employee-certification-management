export interface OJT {
    mentor: string;
    date: Date;
}

export interface Certification {
    _id?: string;
    name: string;
    issueDate: Date;
    expiryDate: Date;
    status: 'valid' | 'expired' | 'expiring-soon';
    isRequired: boolean;
    ojt1?: OJT;
    ojt2?: OJT;
    certificate?: string;
    certificateFileName?: string;
}

export interface Employee {
    _id?: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    role: string;
    department: string;
    startDate: Date;
    certifications: Certification[];
    profileImage?: string;
}