const roleMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        
        if (!req.user.role) {
            return res.status(403).json({ message: "Access forbidden: No role assigned" });
        }
        
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "Access forbidden" });
        }
        
        next();
    };
};

module.exports = roleMiddleware;