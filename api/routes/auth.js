const express = require("express")
const { register, login, forgotPassword, resetPassword, validateResetToken } = require("../controllers/authController")

const router = express.Router()

router.post("/register", register)
router.post("/login", login)
router.post("/forgotpassword", forgotPassword)
router.put("/resetpassword/:resettoken", resetPassword)
router.get("/resetpassword/:resettoken", validateResetToken)

module.exports = router
