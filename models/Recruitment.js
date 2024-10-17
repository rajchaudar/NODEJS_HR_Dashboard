// models/Recruitment.js
const mongoose = require('mongoose');

const recruitmentSchema = new mongoose.Schema({
    candidateName: String,
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    source: { type: String, enum: ['Referral', 'Job Board', 'Recruitment Agency'] },
    hireDate: { type: Date, default: Date.now },
    positionFilled: Boolean
});

const Recruitment = mongoose.model('Recruitment', recruitmentSchema);
module.exports = Recruitment;