const mongoose = require('mongoose');
const green = '\x1b[32m';
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`${green}MongoDB Connection Succeeded.`);
    } catch (error) {
        console.error('Error in DB connection: ' + error);
    }
}

module.exports = connectDB;