const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  getDriverDashboard,
  toggleDriverStatus,
  updateDriverLocation,
  rejectBooking
} = require("../controllers/driverController");


router.get("/dashboard", authMiddleware, getDriverDashboard);

router.patch("/status", authMiddleware, toggleDriverStatus);

router.patch("/location", authMiddleware, updateDriverLocation);

router.patch("/reject",authMiddleware,rejectBooking)

module.exports = router;