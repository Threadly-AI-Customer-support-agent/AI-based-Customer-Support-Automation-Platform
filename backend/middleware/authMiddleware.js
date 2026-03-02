const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    let token;

    // Header check karein: "Authorization: Bearer <token>"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1]; // Token extract karna
            const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verification
            
            req.user = decoded; // User data request object mein daal dena
            next(); // Agle step par jane dena
        } catch (error) {
            res.status(401).json({ message: "Not authorized, token failed" });
        }
    }

    if (!token) {
        res.status(401).json({ message: "Not authorized, no token" });
    }
};

module.exports = { protect };