const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // To hash passwords

// Define the Admin schema
const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true // Ensure username is unique
    },
    password: {
        type: String,
        required: true // Will store the hashed password
    }
});

// Pre-save middleware to hash the password before storing it
adminSchema.pre('save', async function (next) {
    try {
        if (!this.isModified('password')) return next(); // Only hash if the password is new or modified
        const salt = await bcrypt.genSalt(10); // Generate salt
        this.password = await bcrypt.hash(this.password, salt); // Hash the password
        next(); // Proceed to save the document
    } catch (error) {
        next(error); // Pass any error to the next middleware
    }
});

// Create the Admin model
const Admin = mongoose.model('Admin', adminSchema);

// Export the Admin model
module.exports = Admin;