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

const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;