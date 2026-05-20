const jwt = require("jsonwebtoken");

const JWT_SECRET = "super_secret_key";

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    const tokenn = req.cookies.token;

    if (!authHeader) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(tokenn, JWT_SECRET);

    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({
      message: "Invalid token",
    });
  }
};

module.exports = authMiddleware;