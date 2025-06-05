const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    rental_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Rental', required: true }, // Referens till ursprunglig hyresorder
    car_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true }, // Referens till bilen
    renter_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Referens till hyraren
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    total_price: { type: Number, required: true },
    pickup_address: { type: String, required: true }, // Upphämtningsadress
    dropoff_address: { type: String, required: true }, // Avlämningsadress
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Booking', bookingSchema);