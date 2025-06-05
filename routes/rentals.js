const express = require('express');
const router = express.Router();
const {
    getAllRentals,
    getRentalById,
    createRental,
    updateRental, // Add this line to import updateRental
    deleteRental,
    approveRental,
    rejectRental,
    getAllBookingsByUserId,
    getCurrentRentalsByUserId,
    getAllRejectedAdmin,
    getAllBookingsAdmin,
    getRentalAnalytics,
} = require('../controllers/rentalController');
const authenticateToken = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware'); // Import isCompany
const validateObjectId = require('../middleware/validateObjectId'); // Import validation middleware


// Hämta alla avvisade hyresorder (endast för admin)
router.get('/rejected', authenticateToken, getAllRejectedAdmin);

//Hämtar alla approved bookings
router.get('/approved', authenticateToken, getAllBookingsAdmin);

// Hämta hyresstatistik (endast för admin)
router.get('/analytics', getRentalAnalytics);

// Hämta alla bokningar för en användare
router.get('/bookings', authenticateToken, getAllBookingsByUserId);

// Hämta alla aktuella hyresförfrågningar för en användare
router.get('/current-rentals', authenticateToken, getCurrentRentalsByUserId);

// Hämta en specifik hyresorder efter ID (Funkar)
router.get('/:id', validateObjectId, getRentalById);

// Skapa en ny hyresorder  (Funkar)
router.post('/', authenticateToken, createRental);

// Uppdatera en hyresorder
router.put('/:id', validateObjectId, updateRental);

// Ta bort en hyresorder
router.delete('/:id', validateObjectId, deleteRental);




// ADMIN 

// Hämta alla hyresorder
router.get('/', isAdmin, getAllRentals);


// Approve a rental (Admin only)
router.put('/admin/approve/:id', authenticateToken, isAdmin, approveRental);

// Reject a rental (Admin only)
router.put('/admin/reject/:id', authenticateToken, isAdmin, rejectRental);

module.exports = router;