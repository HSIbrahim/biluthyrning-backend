const errorHandler = require('./middleware/errorHandler');


module.exports = (err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ message: err.message || 'Something went wrong!' });
};

app.use(errorHandler);