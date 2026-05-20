const router = require("express").Router();
const { signUp, login, logout } = require("../controllers/authController");

router.post("/sign-up", signUp);
router.post("/login", login);
router.post('/logout', logout);

module.exports = router;