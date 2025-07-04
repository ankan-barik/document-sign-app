const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const path = require("path")
const fs = require("fs")
require("dotenv").config()

// Route files
const auth = require("./routes/auth")
const documents = require("./routes/documents")

const app = express()

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads", "documents")
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
  console.log("Created uploads directory")
}

// Security middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
})
app.use(limiter)

// Body parser
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  })
})

// Mount routers
app.use("/api/auth", auth)
app.use("/api/documents", documents)

// Error handler
app.use((err, req, res, next) => {
  console.error("Error stack:", err.stack)

  // Multer errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File too large. Maximum size is 10MB.",
    })
  }

  if (err.message === "Only PDF files are allowed") {
    return res.status(400).json({
      success: false,
      message: "Only PDF files are allowed",
    })
  }

  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  })
})

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => {
    console.error("MongoDB connection error:", err)
    process.exit(1)
  })

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV}`)
  console.log(`Client URL: ${process.env.CLIENT_URL}`)
})
