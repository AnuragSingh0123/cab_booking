const express = require("express");
const cors = require("cors");
const connectDB = require("./config/connectDB");
const authRoutes = require("./routes/authRoutes");
const rideRoutes = require("./routes/rideRoutes");
const driverRoutes = require("./routes/driverRoutes");
const userRoutes = require("./routes/userRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

const app = express();

app.use(cors({
  origin:'http://localhost:4200',
  credentials:true
}));

app.use(express.json());
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// Routes
app.use("/auth", authRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/driver", driverRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reviews", reviewRoutes);


app.get("/", (req, res) => {
  res.send("App is running");
});

app.listen(7000, async () => {
  await connectDB();
  console.log("Server running on http://localhost:7000");
});