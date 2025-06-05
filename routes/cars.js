const express = require('express');
const router = express.Router();
const {
    getAllCars,
    getCarById,
    createCar,
    updateCar,
    deleteCar,
    getAllCarsByOrganizationNumber,
} = require('../controllers/carController');
const authenticateToken = require('../middleware/authMiddleware');
const { isCompany, isAdmin, isCarOwner } = require('../middleware/roleMiddleware');

// Hämta alla bilar (Öppen för alla användare)
router.get('/', getAllCars);

// Hämta en specifik bil efter ID (Öppen för alla användare)
router.get('/:id', getCarById);

// Skapa en ny bil (Endast företag eller admin)
router.post('/', authenticateToken, isCompany, createCar); // Use isCompany here

// Uppdatera en bil (Endast ägaren av bilen eller admin)
router.put('/:id', authenticateToken, isCarOwner, updateCar);

// Ta bort en bil (Endast ägaren av bilen eller admin)
router.delete('/:id', authenticateToken, isCarOwner, deleteCar);

// Hämta alla bilar för ett företag (Endast företagsanvändare)
router.get('/organization', authenticateToken, isCompany, getAllCarsByOrganizationNumber);

module.exports = router;