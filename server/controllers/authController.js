const User = require("../models/user");
const Driver = require("../models/driver");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const JWT_SECRET = "super_secret_key";

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

    console.log(req.body);

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "rider"
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
      message: `${role || "rider"} created successfully`
    });


  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Signup error"
    });
  }
};

exports.login =  async (req, res) => {
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
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );


    

    return res.status(200).cookie('token',token).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.logout = async (req, res) => {
  try {
  
    return res
      .status(200)
      .clearCookie('token', {
        httpOnly: true,
        sameSite: 'lax',
      })
      .json({ message: "Logged out successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error during logout" });
  }
};