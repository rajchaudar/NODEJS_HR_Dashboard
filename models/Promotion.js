const mongoose = require('mongoose');

const PromotionSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    previousPosition: { type: String, required: true },
    newPosition: { type: String, required: true },
    promotionDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Promotion', PromotionSchema);
