exports.isAdmin = (req, res, next) => {
    if (!req.user.is_admin) {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
    next();
};

exports.isCompany = (req, res, next) => {
    if (req.user.user_type !== 'company') {
        return res.status(403).json({ message: 'Access denied. Only business accounts can perform this action.' });
    }
    next();
};

exports.isCarOwner = async (req, res, next) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car) return res.status(404).json({ message: 'Car not found' });

        if (car.organization_number !== req.user.organization_number) {
            return res.status(403).json({ message: 'Access denied. You do not own this car.' });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};