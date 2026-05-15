const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const connectDB = require("./config/connectDB");
const User = require("./models/user");
const Driver = require("./models/driver");
const Booking = require("./models/booking");
const Review = require("./models/review");
const authRoutes = require("./routes/authRoutes");

app.use(cors());
app.use(express.json());

const JWT_SECRET = "super_secret_key";




app.use("/auth", authRoutes);


const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "No token provided"
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({
      message: "Invalid token"
    });
  }
};


app.post("/book-ride", authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.create({
      ...req.body,
      riderId: req.user.id,
    });

    res.status(201).json({
      message: "Ride booked successfully",
      booking,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Booking failed",
    });
  }
});

app.get("/my-bookings", authMiddleware, async (req, res) => {

  try {
    const bookings = await Booking.find({
      riderId: req.user.id
    }).sort({ createdAt: -1 });

    res.status(200).json(bookings);

  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Failed to fetch bookings"
    });
  }
});



app.get("/driver/dashboard", authMiddleware, async (req, res) => {
  try {
    const driver = await Driver.findOne({
      userId: req.user.id
    });

    if (!driver) {
      return res.status(404).json({
        message: "Driver not found"
      });
    }

    const availableRide = await Booking.findOne({
      status: "requested",
      driverId: null
    }).sort({ createdAt: 1 });

    const activeRide = await Booking.findOne({
      driverId: req.user.id,
      status: {
        $in: ["accepted", "started"]
      }
    }).sort({ createdAt: -1 });

    

      const reviews = await Review.find({
  driverId: req.user.id
})
  .populate('bookingId', 'pickup drop total')
  .sort({ createdAt: -1 })
  .limit(5);


    const completed = await Booking.find({
      driverId: req.user.id,
      status: "completed"
    });

    const stats = {
      trips: completed.length,
      earnings: completed.reduce(
        (sum, ride) => sum + (ride.total || 0),
        0
      ),
      distance: completed.reduce(
        (sum, ride) => sum + (ride.distance || 0),
        0
      ),
      hours: Number(
        (
          completed.reduce(
            (sum, ride) => sum + (ride.duration || 0),
            0
          ) / 60
        ).toFixed(1)
      )
    };

    res.json({
      driver,
      availableRide,
      activeRide,
      reviews,
      stats
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Server error"
    });
  }
});


app.patch("/driver/toggle-status", authMiddleware, async (req, res) => {
  try {
    const driver = await Driver.findOne({
      userId: req.user.id
    });

    if (!driver) {
      return res.status(404).json({
        message: "Driver not found"
      });
    }

    driver.online = !driver.online;

    await driver.save();

    res.json(driver);

  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Server error"
    });
  }
});


app.patch("/booking/:id", authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(
      req.params.id
    );

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found"
      });
    }

    const { status, completedAt } = req.body;

    booking.status = status;

    if (status === "accepted") {
      booking.driverId = req.user.id;
    }

    if (completedAt) {
      booking.completedAt = completedAt;
    }

    await booking.save();

    res.json(booking);

  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Update failed"
    });
  }
});

app.get("/user/booking/:id", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found"
      });
    }

    let driver = null;
    let dropLocation = ''


    if (booking.driverId) {
      const driverDetails = await Driver.findOne({
        userId: booking.driverId
      });

      const bookingDetails = await Booking.findOne({_id : booking});

      dropLocation = bookingDetails.drop;
      const userDetails = await User.findById(
        booking.driverId
      ).select("-password");

      driver = {
        id: userDetails._id,
        name: userDetails.name,
        email: userDetails.email,
        vehicle: driverDetails.vehicleType,
        vehicleNo: driverDetails.vehicleNumber,
        license: driverDetails.licenseNumber,
        available: driverDetails.isAvailable
      };
    }

    res.json({
      booking,
      driver,
      dropLocation
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Error"
    });
  }
});


app.post('/user/feedback', async (req, res) => {
  try {
    const { driverId, rating, feedback, bookingId } = req.body;

    const review = await Review.create({
      bookingId,
      driverId,
      rating,
      feedback
    });

    res.status(201).json({
      message: 'Feedback saved',
      review
    });

  } catch (err) {
    console.log(err);
    res.status(500).send('Internal Server Error');
  }
});


app.get("/profile", authMiddleware, async (req, res) => {
  console.log("heello")
  const user = await User.findById(req.user.id);
  const id = user._id;
  const role = user.role;

  let bookingData = [];
  let driverLocation = null;

  if (role === "rider") {
    bookingData = await Booking.find({ riderId: id });
  } else if (role === "driver") {
    bookingData = await Booking.find({ driverId: id });
    driverData = await Driver.findOne({ userId: id });
    driverLocation = driverData.driverLocation;
    console.log("data=  ",driverData);
  }

  const totalRides = bookingData.length;

  const distanceTravelled = bookingData.reduce(
    (sum, ride) => sum + ride.distance,
    0
  );

  const totalSpent = bookingData.reduce(
    (sum, ride) => sum + ride.total,
    0
  );

  res.json({
    totalRides,
    distanceTravelled,
    totalSpent,
    driverLocation
  });
});


app.get("/", (req, res) => {
  res.send("App is running");
});


//----------------------------By Aditya-----------------------------

app.patch("/driverLocation/:place", authMiddleware,async (req, res) => {
  console.log("hello");

  const user = await User.findById(req.user.id);
  const userId = user._id;
  console.log("userId=", userId);

  const driverLocation = req.params.place;
  
  if(driverLocation){
    const updateLocation = await Driver.findOneAndUpdate(
      {userId:userId},
      {$set:{driverLocation:driverLocation}},
      { returnDocument: 'after' }
    )

    return res.status(200).json(updateLocation);
  }
})


app.listen(7000, async () => {
  await connectDB();
  console.log("Server running on http://localhost:7000");
});