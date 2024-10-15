const mongoose = require('mongoose');

// ANSI escape codes for green text
const green = '\x1b[32m';

async function connectDB() {
    try {
        await mongoose.connect('mongodb://localhost:27017/EmployeeDB');
        console.log(`${green}MongoDB Connection Succeeded.`);
    } catch (error) {
        console.error('Error in DB connection: ' + error);
    }
}

module.exports = connectDB;