const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
    organization_number: { type: String, required: true }, // Organisationens nummer istället för user_id
    model: { type: String, required: true },
    price_per_day: { type: Number, required: true },
    price_per_week: { type: Number },
    price_per_month: { type: Number },
    availability: {
        from: { type: Date }, // När bilen är tillgänglig från
        to: { type: Date },  // När bilen är tillgänglig till
    },
    unavailable: [
        {
            from: { type: Date }, // Array för otillgänglighetsperioder
            to: { type: Date },
        },
    ],
    location: { type: String, required: true },
    image_url: { type: String },
    category: { type: String },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Car', carSchema);