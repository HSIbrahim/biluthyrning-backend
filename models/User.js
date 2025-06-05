const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    user_type: { type: String, enum: ['company', 'individual'], required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone_number: { type: String },
    organization_name: { type: String }, // Required for companies
    organization_number: { type: String, unique: true }, // Required for companies
    address: { type: String }, // Required for companies
    is_admin: { type: Boolean, default: false }, // Add this field for admin users
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);