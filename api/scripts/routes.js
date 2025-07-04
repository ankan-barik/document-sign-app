const express = require("express")
const fs = require("fs")
const Document = require("../models/Document")
const User = require("../models/User")
const sendEmail = require("../utils/sendEmail")
const protect = require("../middleware/auth")

const app = express()

// Add these routes to your Express backend

// In your main routes file (e.g., server.js or app.js)
// Add this route for signing documents

// GET /api/sign/:id - Get document for signing
app.get("/api/sign/:id", async (req, res) => {
  try {
    const { id } = req.params
    const { token, email } = req.query

    if (!token || !email) {
      return res.status(400).json({
        success: false,
        message: "Token and email are required",
      })
    }

    const document = await Document.findById(id)

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      })
    }

    // Verify token
    if (document.signatureToken !== token) {
      return res.status(401).json({
        success: false,
        message: "Invalid signature token",
      })
    }

    // Check if email is in signers list
    const signer = document.signers.find((s) => s.email === email)
    if (!signer) {
      return res.status(403).json({
        success: false,
        message: "Email not authorized to sign this document",
      })
    }

    // Check if document has expired
    if (document.expiresAt && new Date() > document.expiresAt) {
      return res.status(410).json({
        success: false,
        message: "Document signing link has expired",
      })
    }

    res.json({
      success: true,
      data: document,
    })
  } catch (error) {
    console.error("Get sign document error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// GET /api/sign/:id/pdf - Get PDF for signing
app.get("/api/sign/:id/pdf", async (req, res) => {
  try {
    const { id } = req.params
    const { token } = req.query

    const document = await Document.findById(id)

    if (!document || document.signatureToken !== token) {
      return res.status(404).json({
        success: false,
        message: "Document not found or invalid token",
      })
    }

    // Check if file exists
    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({
        success: false,
        message: "PDF file not found",
      })
    }

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", `inline; filename="${document.name}"`)

    const fileStream = fs.createReadStream(document.filePath)
    fileStream.pipe(res)
  } catch (error) {
    console.error("Get PDF error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// POST /api/sign/:id/submit - Submit signature
app.post("/api/sign/:id/submit", async (req, res) => {
  try {
    const { id } = req.params
    const { token, email, signatures } = req.body

    if (!token || !email || !signatures) {
      return res.status(400).json({
        success: false,
        message: "Token, email, and signatures are required",
      })
    }

    const document = await Document.findById(id)

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      })
    }

    // Verify token
    if (document.signatureToken !== token) {
      return res.status(401).json({
        success: false,
        message: "Invalid signature token",
      })
    }

    // Find and update signer
    const signerIndex = document.signers.findIndex((s) => s.email === email)
    if (signerIndex === -1) {
      return res.status(403).json({
        success: false,
        message: "Email not authorized to sign this document",
      })
    }

    // Update signer status
    document.signers[signerIndex].status = "signed"
    document.signers[signerIndex].signedAt = new Date()
    document.signers[signerIndex].signatureData = signatures

    // Check if all signers have signed
    const allSigned = document.signers.every((s) => s.status === "signed")
    if (allSigned) {
      document.status = "completed"
    }

    await document.save()

    // Send notification to document owner
    const owner = await User.findById(document.owner)
    if (owner) {
      await sendEmail({
        to: owner.email,
        subject: `Document Signed - ${document.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Document Signature Update</h2>
            <p>Hello ${owner.name},</p>
            <p><strong>${email}</strong> has signed the document: <strong>${document.name}</strong></p>
            ${
              allSigned
                ? "<p><strong>🎉 All signers have completed signing this document!</strong></p>"
                : "<p>Waiting for remaining signers to complete.</p>"
            }
            <p>You can view the document in your dashboard.</p>
            <p>Best regards,<br>SignFlow Team</p>
          </div>
        `,
      })
    }

    res.json({
      success: true,
      message: "Signature submitted successfully",
      data: {
        signed: true,
        allCompleted: allSigned,
      },
    })
  } catch (error) {
    console.error("Submit signature error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// Also add PDF route to documents controller
// GET /api/documents/:id/pdf - Get PDF for authenticated users
app.get("/api/documents/:id/pdf", protect, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      })
    }

    // Check if user owns the document or is a signer
    const isOwner = document.owner.toString() === req.user.id
    const isSigner = document.signers.some((signer) => signer.email === req.user.email)

    if (!isOwner && !isSigner) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this document",
      })
    }

    // Check if file exists
    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({
        success: false,
        message: "PDF file not found",
      })
    }

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", `inline; filename="${document.name}"`)

    const fileStream = fs.createReadStream(document.filePath)
    fileStream.pipe(res)
  } catch (error) {
    console.error("Get PDF error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})
