const nodemailer = require("nodemailer")

const sendEmail = async (options) => {
  try {
    console.log("SMTP Configuration:", {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      from: process.env.FROM_EMAIL,
    })

    // Create transporter with enhanced Gmail configuration
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number.parseInt(process.env.SMTP_PORT),
      secure: false, // true for 465, false for other ports like 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
      // Additional Gmail-specific settings
      pool: true,
      maxConnections: 1,
      rateDelta: 20000,
      rateLimit: 5,
    })

    // Verify connection configuration
    console.log("Verifying SMTP connection...")
    await transporter.verify()
    console.log("✅ SMTP connection verified successfully")

    const message = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      // Add text version as fallback
      text: options.text || options.html.replace(/<[^>]*>/g, ""),
    }

    console.log("Sending email to:", options.to)
    const info = await transporter.sendMail(message)
    console.log("✅ Message sent successfully:", info.messageId)

    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    }
  } catch (error) {
    console.error("❌ Email sending error:", error)

    // Enhanced error logging
    if (error.code === "EAUTH") {
      console.error("Authentication failed. Check your email and app password.")
    } else if (error.code === "ECONNECTION") {
      console.error("Connection failed. Check your internet connection and SMTP settings.")
    } else if (error.code === "EMESSAGE") {
      console.error("Message format error. Check email content.")
    } else if (error.code === "ESOCKET") {
      console.error("Socket error. Check firewall and network settings.")
    }

    return {
      success: false,
      error: error.message,
    }
  }
}

module.exports = sendEmail