const mongoose = require('mongoose');
const green = '\x1b[32m';
async function connectDB() {
    try {
        await mongoose.connect('mongodb+srv://rajchaudar60:raj1415@cluster0.ozz8e.mongodb.net/EmployeeDB');
        console.log(`${green}MongoDB Connection Succeeded.`);
    } catch (error) {
        console.error('Error in DB connection: ' + error);
    }
}

module.exports = connectDB;