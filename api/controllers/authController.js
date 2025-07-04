const crypto = require("crypto")
const User = require("../models/User")
const sendEmail = require("../utils/sendEmail")

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide an email address",
      })
    }

    const user = await User.findOne({ email: email.toLowerCase() })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found with that email address",
      })
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken()

    await user.save({ validateBeforeSave: false })

    // Create reset url
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`

    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
        
        <p>Hello <strong>${user.name}</strong>,</p>
        
        <p>We received a request to reset the password for your SignFlow account associated with <strong>${user.email}</strong>.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Reset Password
          </a>
        </div>
        
        <p><strong>⚠️ Important:</strong></p>
        <ul>
          <li>This link will expire in <strong>10 minutes</strong></li>
          <li>If you didn't request this reset, please ignore this email</li>
          <li>Your password won't change until you create a new one</li>
        </ul>
        
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #007bff;">${resetUrl}</p>
        
        <p>Best regards,<br>SignFlow Team</p>
      </div>
    `

    try {
      await sendEmail({
        to: user.email,
        subject: "Password Reset Request - SignFlow",
        html: message,
      })

      res.status(200).json({
        success: true,
        message: "Password reset email sent successfully",
      })
    } catch (err) {
      console.error("Email sending error:", err)
      user.resetPasswordToken = undefined
      user.resetPasswordExpire = undefined

      await user.save({ validateBeforeSave: false })

      return res.status(500).json({
        success: false,
        message: "Email could not be sent",
      })
    }
  } catch (error) {
    console.error("Forgot password error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body
    const { resettoken } = req.params

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Please provide a password",
      })
    }

    // Simple 6 character minimum validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      })
    }

    // Get hashed token
    const resetPasswordToken = crypto.createHash("sha256").update(resettoken).digest("hex")

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      })
    }

    // Set new password
    user.password = password
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined

    await user.save()

    // Generate JWT token for immediate login
    const token = user.getSignedJwtToken()

    res.status(200).json({
      success: true,
      message: "Password reset successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    console.error("Reset password error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// @desc    Validate reset token
// @route   GET /api/auth/resetpassword/:resettoken
// @access  Public
exports.validateResetToken = async (req, res) => {
  try {
    const { resettoken } = req.params

    // Get hashed token
    const resetPasswordToken = crypto.createHash("sha256").update(resettoken).digest("hex")

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      })
    }

    res.status(200).json({
      success: true,
      message: "Valid reset token",
    })
  } catch (error) {
    console.error("Token validation error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email and password",
      })
    }

    // Simple 6 character minimum validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      })
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      })
    }

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
    })

    // Generate token
    const token = user.getSignedJwtToken()

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    console.error("Register error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      })
    }

    // Check for user
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password")

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      })
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password)

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      })
    }

    // Generate token
    const token = user.getSignedJwtToken()

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}
