const Booking = require("../models/booking");
const Driver = require("../models/driver");
const User = require("../models/user");


const getProfile = async (req, res) => {
  try {

    const user = await User.findById(req.user.id);
    const id = user._id;
    const role = user.role;

    let bookingData = [];
    let driverLocation = null;

    console.log(user);

    if (role === "rider") {
      bookingData = await Booking.find({ riderId: id });
    } else if (role === "driver") {
      bookingData = await Booking.find({ driverId: id });
      driverData = await Driver.findOne({ userId: id });
      driverLocation = driverData.driverLocation;
    }

    const totalRides = bookingData.length;

    const distanceTravelled = bookingData.reduce(
      (sum, ride) => sum + ride.distance,
      0
    );

    console.log(distanceTravelled)

    const totalSpent = bookingData.reduce((sum, ride) => sum + ride.total, 0);

    res.json({
      totalRides,
      distanceTravelled,
      totalSpent,
      driverLocation,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Server error",
    });
  }
};


const editProfile = async (req, res) => {
  try {


    const { name, email } = req.body.editUser;
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    let updateFields = {};

    if (name && name !== user.name) {
      updateFields.name = name;
    }

    if (email && email !== user.email) {

      const emailExists = await User.findOne({ email, _id: { $ne: userId } });

      if (emailExists) {
        return res.status(400).json({ message: "This email is already registered to another account!" });
      }
      updateFields.email = email;
    }

    await User.updateOne(
      { _id: userId },
      { $set: updateFields }
    );

    const updatedUser = await User.findById(userId).select("-password");

    return res.status(200).json({
      message: "Updated Successfully",
      user: updatedUser
    });

  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}

module.exports = {
  getProfile,
  editProfile
};