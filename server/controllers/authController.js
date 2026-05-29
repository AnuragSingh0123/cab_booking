const User = require("../models/user");
const Driver = require("../models/driver");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require('dotenv').config();

exports.signUp = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      licenseNumber,
      vehicleType,
      vehicleNumber,
      driverLocation,
      driverCoordinates
    } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    if (role === "driver") {
      const existingDriver = await Driver.findOne({
        $or: [
          { licenseNumber: licenseNumber },
          { vehicleNumber: vehicleNumber }
        ]
      });

      if (existingDriver) {
        return res.status(400).json({ 
          message: "License number or Vehicle number is already registered to another driver." 
        });
      }
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role
    });

    if (role === "driver") {
      await Driver.create({
        userId: user._id,
        licenseNumber,
        vehicleType,
        vehicleNumber,
        driverLocation,
        driverCoordinates
      });
    }

    res.status(201).json({
      message: "Registration Successful"
    });


  } catch (err) {
    console.error("SignUp Error:", err);
    res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: user._id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax"
    })

    res.json({ message: "Login successful" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    console.log("Error while fetching user profile", err);
    res.status(500).json({ message: "Server error" });
  }
}


exports.logout = async (req, res) => {
  try {
    res.clearCookie("token");
    res.json({ message: "Logged out successful" })
  } catch (err) {
    console.log("Error during logout", err);
    res.status(500).json({ message: "Server error during logout" })
  }
}