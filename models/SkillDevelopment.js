// models/SkillDevelopment.js
const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    skills: [String],
    trainingStatus: { type: String, enum: ['In Progress', 'Completed'], default: 'In Progress' }
});

const SkillDevelopment = mongoose.model('SkillDevelopment', skillSchema);
module.exports = SkillDevelopment;