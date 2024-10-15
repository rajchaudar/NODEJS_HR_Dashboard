const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: true,
        unique: true
    },
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        match: [/.+\@.+\..+/, 'Please enter a valid email address']
    },
    mobile: {
        type: String,
        required: true,
        match: [/^\d{10}$/, 'Please enter a valid 10-digit mobile number']
    },
    city: {
        type: String,
        required: true
    },
    position: {
        type: String,
        required: true
    },
    salary: {
        type: Number,
        required: true,
        min: [0, 'Salary cannot be negative']
    }
});

const Employee = mongoose.model('Employee', employeeSchema);
module.exports = Employee;