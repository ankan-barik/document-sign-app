const jwt = require("jsonwebtoken")
const User = require("../models/User")

exports.protect = async (req, res, next) => {
  let token

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1]
  } else if (req.cookies.token) {
    token = req.cookies.token
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // FIXED: Ensure user exists and add proper user data to request
    const user = await User.findById(decoded.id)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      })
    }

    req.user = user
    console.log(`Authenticated user: ${user.id} (${user.email})`) // Debug log
    next()
  } catch (error) {
    console.error("Auth middleware error:", error)
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    })
  }
}
