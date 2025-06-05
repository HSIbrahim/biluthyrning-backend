const Rental = require('../models/Rental');
const Car = require('../models/Car');
const Booking = require('../models/Booking');
const { body, validationResult } = require('express-validator');

// Hämta alla hyresorder
exports.getAllRentals = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const rentals = await Rental.find({ status: { $nin: ['rejected', 'deleted'] } })
            .skip(skip)
            .limit(limit)
            .populate('car_id', 'model')
            .populate('renter_id', 'name');

        const total = await Rental.countDocuments({ status: { $nin: ['rejected', 'deleted'] } });
        res.status(200).json({ rentals, total, page, totalPages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Hämta en specifik hyresorder efter ID
const populateRentalDetails = (query) => {
    return query.populate('car_id', 'model').populate('renter_id', 'name');
};

exports.getRentalById = async (req, res) => {
    try {
        const rental = await populateRentalDetails(Rental.findById(req.params.id));
        if (!rental) return res.status(404).json({ message: 'Rental not found' });
        res.status(200).json(rental);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Skapa en ny hyresorder
exports.createRental = async (req, res) => {
    try {
        console.log('Incoming request body:', req.body);
        const { car_id, start_date, end_date } = req.body;

        const car = await Car.findById(car_id);
        if (!car) return res.status(404).json({ message: 'Car not found' });

        const days = Math.ceil((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24));
        let total_price = days * car.price_per_day;

        const newRental = new Rental({
            car_id,
            renter_id: req.user.id,
            start_date,
            end_date,
            total_price,
            status: 'pending',
        });

        await newRental.save();
        console.log('New rental created:', newRental);
        res.status(201).json({ message: 'Rental created successfully', rental: newRental });
    } catch (error) {
        console.error('Error creating rental:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Uppdatera en hyresorder (t.ex. ändra status till "approved" eller "rejected")
exports.updateRental = [
    body('status')
        .isIn(['pending', 'approved', 'rejected', 'completed'])
        .withMessage('Invalid status'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const updatedRental = await Rental.findByIdAndUpdate(
                req.params.id,
                { status: req.body.status },
                { new: true }
            );
            if (!updatedRental) return res.status(404).json({ message: 'Rental not found' });
            res.status(200).json({ message: 'Rental updated successfully', rental: updatedRental });
        } catch (error) {
            res.status(500).json({ message: 'Server error', error });
        }
    },
];

// Ta bort en hyresorder
exports.deleteRental = async (req, res) => {
    try {
        const deletedRental = await Rental.findByIdAndDelete(req.params.id);
        if (!deletedRental) return res.status(404).json({ message: 'Rental not found' });
        res.status(200).json({ message: 'Rental deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Godkänn en hyresorder
exports.approveRental = async (req, res) => {
    try {
        if (!req.user.is_admin) {
            return res.status(403).json({ message: 'Only admins can approve rentals.' });
        }

        const { pickup_address, dropoff_address} = req.body;
        
        const rental = await Rental.findById(req.params.id);
        if (!rental) return res.status(404).json({ message: 'Rental not found' });
        
        const car = await Car.findById(rental.car_id);
        if (!car) return res.status(404).json({ message: 'Car not found' });
        
        car.unavailable.push({
            from: rental.start_date,
            to: rental.end_date,
        });
        await car.save();

        const newBooking = new Booking({
            rental_id: rental._id, 
            car_id: rental.car_id,
            renter_id: rental.renter_id,
            start_date: rental.start_date,
            end_date: rental.end_date,
            total_price: rental.total_price,
            pickup_address: pickup_address || "Default Pickup Address",
            dropoff_address: dropoff_address || "Default Dropoff Address",
        });
        await newBooking.save();

        await Rental.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Rental approved and moved to bookings successfully', booking: newBooking });
    } catch (error) {
        console.error('Error approving rental:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Neka en hyresorder
exports.rejectRental = async (req, res) => {
    try {
        // Kolla om användaren är admin
        if (!req.user.is_admin) {
            return res.status(403).json({ message: 'Only admins can reject rentals.' });
        }

        const { reason } = req.body;

        const updatedRental = await Rental.findByIdAndUpdate(
            req.params.id,
            { status: 'rejected', reason: reason || null },
            { new: true }
        );

        if (!updatedRental) return res.status(404).json({ message: 'Rental not found' });

        res.status(200).json({ message: 'Rental rejected successfully', rental: updatedRental });
    } catch (error) {
        console.error('Error rejecting rental:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Hämta alla bokningar för en användare
exports.getAllBookingsByUserId = async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const bookings = await Booking.find({ renter_id: userId })
            .skip(skip)
            .limit(limit)
            .populate('car_id', 'model')
            .populate('renter_id', 'name');

        const total = await Booking.countDocuments({ renter_id: userId });
        res.status(200).json({ bookings, total, page, totalPages: Math.ceil(total / limit) });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

//Hämtar alla ansökande bokningar
exports.getCurrentRentalsByUserId = async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const rentals = await Rental.find({ renter_id: userId, status: { $in: ['pending', 'approved'] } })
            .skip(skip)
            .limit(limit)
            .populate('car_id', 'model')
            .populate('renter_id', 'name');

        const total = await Rental.countDocuments({ renter_id: userId, status: { $in: ['pending', 'approved'] } });
        res.status(200).json({ rentals, total, page, totalPages: Math.ceil(total / limit) });
    } catch (error) {
        console.error('Error fetching current rentals:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};


// Hämta alla avvisade hyresorder (endast för admin)
exports.getAllRejectedAdmin = async (req, res) => {
    try {
        if (!req.user.is_admin) {
            return res.status(403).json({ message: 'Only admins can view rejected rentals.' });
        }

        const rejectedRentals = await Rental.find({ status: 'rejected' })
            .populate('car_id', 'model')
            .populate('renter_id', 'name');

        res.status(200).json(rejectedRentals);
    } catch (error) {
        console.error('Error fetching rejected rentals:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Hämta alla bokningar (endast för admin)
exports.getAllBookingsAdmin = async (req, res) => {
    try {
        if (!req.user.is_admin) {
            return res.status(403).json({ message: 'Only admins can view all bookings.' });
        }

        const allBookings = await Booking.find()
            .populate('car_id', 'model')
            .populate('renter_id', 'name');

        // Returnera resultatet
        res.status(200).json(allBookings);
    } catch (error) {
        console.error('Error fetching all bookings:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};


// Analytics endpoint for rental insights
exports.getRentalAnalytics = async (req, res) => {
    try {
        const totalRentals = await Rental.countDocuments();

        const mostRentedCars = await Rental.aggregate([
            { $group: { _id: '$car_id', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
        ]);

        const totalRevenue = await Rental.aggregate([
            { $group: { _id: null, total: { $sum: '$total_price' } } },
        ]);

        res.status(200).json({
            totalRentals,
            mostRentedCars,
            totalRevenue: totalRevenue[0]?.total || 0,
        });
    } catch (error) {
        console.error('Error fetching rental analytics:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};