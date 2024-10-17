const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const employeeSchema = new Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    mobile: { type: String, required: true },
    city: { type: String, required: true },
    salary: { type: Number, required: true },
    position: { type: String, required: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department' } // This is crucial for population
});

const Employee = mongoose.model('Employee', employeeSchema);
module.exports = Employee; // Make sure this line is correct
