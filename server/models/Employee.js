const mongoose = require('mongoose');

const ojtSchema = new mongoose.Schema({
    mentor: { type: String, required: true },
    date: { type: Date, required: true }
});

const certificationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    issueDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    status: {
        type: String,
        enum: ['valid', 'expired', 'expiring-soon'],
        required: true
    },
    isRequired: { type: Boolean, default: false },  // הוספנו שדה חדש
    ojt1: ojtSchema,
    ojt2: ojtSchema,
    certificate: { type: String },           // שדה לשמירת קובץ התעודה (base64)
    certificateFileName: { type: String }    // שדה לשמירת שם הקובץ המקורי
});

const employeeSchema = new mongoose.Schema({
    employeeNumber: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, required: true },
    department: { type: String, required: true },
    startDate: { type: Date, default: Date.now },
    certifications: [certificationSchema],
    profileImage: String
}, {
    timestamps: true
});

// אינדקסים לביצועים טובים יותר
employeeSchema.index({ employeeNumber: 1 }, { unique: true });
employeeSchema.index({ firstName: 1, lastName: 1 });
employeeSchema.index({ department: 1 });

// וירטואלים להוספת שדות מחושבים
employeeSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

employeeSchema.virtual('activeExpiringCertifications').get(function() {
    const today = new Date();
    const yearFromNow = new Date();
    yearFromNow.setFullYear(today.getFullYear() + 1);
    
    return this.certifications.filter(cert => {
        const expiryDate = new Date(cert.expiryDate);
        return expiryDate > today && expiryDate <= yearFromNow;
    });
});

// הגדרות לדגם
employeeSchema.set('toJSON', { virtuals: true });
employeeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Employee', employeeSchema);
