const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the Admin schema
const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: false  // Password is not required for Google logins
    },
    googleId: {
        type: String,
        unique: true, // Ensure a user isn't stored multiple times via Google
        sparse: true  // Allows multiple documents to have a null value for googleId
    }
});

// Pre-save hook for password hashing
adminSchema.pre('save', async function (next) {
    try {
        if (!this.isModified('password') || !this.password) return next();
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;