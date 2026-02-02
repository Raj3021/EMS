const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user || !req.user.permissions) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
};

export default requirePermission;
