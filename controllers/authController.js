const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

exports.register = [
    body('user_type').isIn(['company', 'individual']).withMessage('Invalid user type'),
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Invalid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('phone_number').optional().isMobilePhone().withMessage('Invalid phone number'),
    body('organization_name').if(body('user_type').equals('company')).notEmpty().withMessage('Organization name is required for company accounts'),
    body('organization_number').if(body('user_type').equals('company')).notEmpty().withMessage('Organization number is required for company accounts'),
    body('address').if(body('user_type').equals('company')).notEmpty().withMessage('Address is required for company accounts'),

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { user_type, name, email, password, phone_number, organization_name, organization_number, address } = req.body;

            const existingUser = await User.findOne({ email });
            if (existingUser) return res.status(400).json({ message: 'User already exists' });

            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = new User({
                user_type,
                name,
                email,
                password: hashedPassword,
                phone_number,
                organization_name,
                organization_number,
                address,
            });

            await newUser.save();
            res.status(201).json({ message: 'User registered successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Server error', error });
        }
    },
];

// Logga in användare
exports.login = [
    body('email').isEmail().withMessage('Invalid email address'),
    body('password').notEmpty().withMessage('Password is required'),

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { email, password } = req.body;

            // Hitta ANvändare
            const user = await User.findOne({ email });
            if (!user) return res.status(400).json({ message: 'Invalid credentials' });

            // validera lössenord
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

            // Skapa JWT token
            const payload = {
                id: user._id.toString(),
                user_type: user.user_type,
                phone_number: user.phone_number,
                is_admin: user.is_admin || false,
            };

            if (user.user_type === 'company') {
                payload.organization_number = user.organization_number;
            }

            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

            res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email, phone_number: user.phone_number, is_admin: user.is_admin } });
        } catch (error) {
            res.status(500).json({ message: 'Server error', error });
        }
    },
];