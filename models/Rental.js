const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema({
    car_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
    renter_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'deleted'],
        default: 'pending',
    },
    total_price: { type: Number, required: true },
    reason: { type: String, default: null }, // Add this field for rejection reason
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Rental', rentalSchema);