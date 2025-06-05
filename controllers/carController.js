const Car = require('../models/Car');
const { body, validationResult, param } = require('express-validator');
const sanitize = require('mongo-sanitize');


// Hämta alla bilar
exports.getAllCars = async (req, res) => {
    try {
        const cars = await Car.find();
        if (!cars || cars.length === 0) {
            return res.status(404).json({ message: 'No cars found' });
        }
        res.status(200).json(cars); 
    } catch (error) {
        console.error('Error fetching cars:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Hämta en bil efter ID
exports.getCarById = async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car) {
            return res.status(404).json({ message: 'Car not found' });
        }
        res.status(200).json(car);
    } catch (error) {
        console.error('Error fetching car:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Skapa en ny bil

exports.createCar = [
    // Validation rules
    body('model').notEmpty().withMessage('Model is required'),
    body('price_per_day').isNumeric().withMessage('Price per day must be a number'),
    body('availability').optional().isObject().withMessage('Availability must be an object'),
    body('location').notEmpty().withMessage('Location is required'),

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const sanitizedBody = sanitize(req.body);

            const {
                model,
                price_per_day,
                price_per_week,
                price_per_month,
                availability,
                location,
                image_url,
                category,
            } = sanitizedBody;

            if (req.user.user_type !== 'company') {
                return res.status(403).json({ message: 'Only business accounts can create cars.' });
            }

            // Create new car
            const newCar = new Car({
                organization_number: req.user.organization_number,
                model,
                price_per_day,
                price_per_week,
                price_per_month,
                availability,
                location,
                image_url,
                category,
            });

            await newCar.save();
            res.status(201).json({ message: 'Car created successfully', car: newCar });
        } catch (error) {
            res.status(500).json({ message: 'Server error', error });
        }
    },
];
exports.updateCar = [
    param('id').isMongoId().withMessage('Invalid car ID'),

    // Validate request body
    body('model').optional().notEmpty().withMessage('Model cannot be empty'),
    body('price_per_day').optional().isNumeric().withMessage('Price per day must be a number'),
    body('availability').optional().isObject().withMessage('Availability must be an object'),
    body('location').optional().notEmpty().withMessage('Location cannot be empty'),

    async (req, res) => {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const updatedCar = await Car.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!updatedCar) return res.status(404).json({ message: 'Car not found' });
            res.status(200).json({ message: 'Car updated successfully', car: updatedCar });
        } catch (error) {
            res.status(500).json({ message: 'Server error', error });
        }
    },
];
// Ta bort en bil
exports.deleteCar = [
    param('id').isMongoId().withMessage('Invalid car ID'),

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const deletedCar = await Car.findByIdAndDelete(req.params.id);
            if (!deletedCar) return res.status(404).json({ message: 'Car not found' });
            res.status(200).json({ message: 'Car deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Server error', error });
        }
    },
];

// Hämta alla bilar för ett företag
exports.getAllCarsByOrganizationNumber = async (req, res) => {
    try {
        const organizationNumber = req.user.organization_number;

        console.log('Fetching cars for organization:', organizationNumber);

        const cars = await Car.find({ organization_number: organizationNumber });

        if (cars.length === 0) {
            return res.status(404).json({ message: 'No cars found for this organization' });
        }

        res.status(200).json(cars);
    } catch (error) {
        console.error('Error fetching cars by organization number:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};