const path = require("path")
const fs = require("fs").promises
const crypto = require("crypto")
const Document = require("../models/Document")
const sendEmail = require("../utils/sendEmail")

// @desc Upload document
// @route POST /api/documents
// @access Private
exports.uploadDocument = async (req, res) => {
  try {
    console.log("Upload request from user:", req.user.id)

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a PDF file",
      })
    }

    const { signers } = req.body
    let parsedSigners = []

    if (signers) {
      try {
        parsedSigners = typeof signers === "string" ? JSON.parse(signers) : signers
      } catch (error) {
        console.log("Error parsing signers:", error)
      }
    }

    const document = await Document.create({
      name: req.body.name || req.file.originalname,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      owner: req.user.id,
      signers: parsedSigners.map((signer) => ({
        email: signer.email,
        name: signer.name || signer.email,
        status: "pending",
      })),
    })

    console.log("Document created:", document._id, "for user:", req.user.id)

    res.status(201).json({
      success: true,
      data: document,
    })
  } catch (error) {
    console.error("Upload error:", error)
    res.status(500).json({
      success: false,
      message: "Error uploading document",
      error: error.message,
    })
  }
}

// @desc Get user documents
// @route GET /api/documents
// @access Private
exports.getDocuments = async (req, res) => {
  try {
    console.log("Fetching documents for user:", req.user.id)

    const documents = await Document.find({
      owner: req.user.id,
    }).sort({ createdAt: -1 })

    console.log(`Found ${documents.length} documents for user ${req.user.id}`)

    documents.forEach((doc) => {
      console.log(`Document ${doc._id} owned by ${doc.owner}, requested by ${req.user.id}`)
    })

    const documentsWithProgress = documents.map((doc) => {
      const totalSigners = doc.signers.length
      const signedCount = doc.signers.filter((signer) => signer.status === "signed").length
      const progress = totalSigners > 0 ? Math.round((signedCount / totalSigners) * 100) : 0

      return {
        ...doc.toObject(),
        progress,
      }
    })

    res.status(200).json({
      success: true,
      count: documentsWithProgress.length,
      data: documentsWithProgress,
    })
  } catch (error) {
    console.error("Get documents error:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching documents",
      error: error.message,
    })
  }
}

// @desc Get single document
// @route GET /api/documents/:id
// @access Private
exports.getDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      })
    }

    const isOwner = document.owner.toString() === req.user.id.toString()
    const isSigner = document.signers.some((signer) => signer.email === req.user.email)

    if (!isOwner && !isSigner) {
      console.log(
        `Access denied: User ${req.user.id} tried to access document ${document._id} owned by ${document.owner}`,
      )
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this document",
      })
    }

    const totalSigners = document.signers.length
    const signedCount = document.signers.filter((signer) => signer.status === "signed").length
    const progress = totalSigners > 0 ? Math.round((signedCount / totalSigners) * 100) : 0

    res.status(200).json({
      success: true,
      data: {
        ...document.toObject(),
        progress,
      },
    })
  } catch (error) {
    console.error("Get document error:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching document",
      error: error.message,
    })
  }
}

// @desc Get document PDF
// @route GET /api/documents/:id/pdf
// @access Private
exports.getDocumentPdf = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      })
    }

    const isOwner = document.owner.toString() === req.user.id.toString()
    const isSigner = document.signers.some((signer) => signer.email === req.user.email)

    if (!isOwner && !isSigner) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this document",
      })
    }

    const fs = require("fs")
    if (!fs.existsSync(document.filePath)) {
      console.error(`PDF file not found at path: ${document.filePath}`)
      return res.status(404).json({
        success: false,
        message: "PDF file not found on server",
      })
    }

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", `inline; filename="${document.name}.pdf"`)
    res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate")
    res.setHeader("Pragma", "no-cache")
    res.setHeader("Expires", "0")

    const fileStream = fs.createReadStream(document.filePath)

    fileStream.on("error", (error) => {
      console.error("Error streaming PDF:", error)
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Error reading PDF file",
        })
      }
    })

    fileStream.pipe(res)
  } catch (error) {
    console.error("Get PDF error:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching PDF",
      error: error.message,
    })
  }
}

// @desc Delete document
// @route DELETE /api/documents/:id
// @access Private
exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      })
    }

    if (document.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this document",
      })
    }

    try {
      await fs.unlink(document.filePath)
      console.log("Physical file deleted:", document.filePath)
    } catch (fileError) {
      console.error("Error deleting physical file:", fileError)
    }

    await Document.findByIdAndDelete(req.params.id)

    console.log("Document deleted from database:", req.params.id)

    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    })
  } catch (error) {
    console.error("Delete document error:", error)
    res.status(500).json({
      success: false,
      message: "Error deleting document",
      error: error.message,
    })
  }
}

// @desc Send document for signature - FIXED VERSION
// @route POST /api/documents/:id/send
// @access Private
exports.sendForSignature = async (req, res) => {
  try {
    console.log("=== Starting sendForSignature ===")
    console.log("Document ID:", req.params.id)
    console.log("User ID:", req.user.id)
    console.log("Request body:", req.body)

    const document = await Document.findById(req.params.id)

    if (!document) {
      console.error("Document not found:", req.params.id)
      return res.status(404).json({
        success: false,
        message: "Document not found",
      })
    }

    console.log("Document found:", {
      id: document._id,
      name: document.name,
      owner: document.owner,
      status: document.status,
      signersCount: document.signers.length
    })

    // Check ownership
    if (document.owner.toString() !== req.user.id.toString()) {
      console.error("Authorization failed:", {
        docOwner: document.owner,
        requestUser: req.user.id
      })
      return res.status(403).json({
        success: false,
        message: "Not authorized to send this document",
      })
    }

    // Check if document has signers
    if (!document.signers || document.signers.length === 0) {
      console.error("No signers found for document:", req.params.id)
      return res.status(400).json({
        success: false,
        message: "No signers found for this document. Please add signers before sending.",
      })
    }

    // Generate signature token
    const signatureToken = crypto.randomBytes(32).toString("hex")
    console.log("Generated signature token:", signatureToken)

    // Update document status and token
    try {
      document.signatureToken = signatureToken
      document.status = "sent"
      await document.save()
      console.log("Document updated successfully with status 'sent'")
    } catch (saveError) {
      console.error("Error saving document:", saveError)
      return res.status(500).json({
        success: false,
        message: "Error updating document status",
        error: saveError.message,
      })
    }

    // Send emails to signers
    const emailResults = []
    console.log("Starting email sending process...")

    for (let i = 0; i < document.signers.length; i++) {
      const signer = document.signers[i]
      console.log(`Processing signer ${i + 1}/${document.signers.length}:`, signer.email)

      try {
        // Create signing URL
        const signUrl = `${process.env.CLIENT_URL}/sign/${document._id}?token=${signatureToken}&email=${encodeURIComponent(signer.email)}`
        console.log(`Sign URL for ${signer.email}:`, signUrl)

        // Prepare email content
        const emailOptions = {
          to: signer.email,
          subject: `Document Signature Request - ${document.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">📋 Document Signature Request</h1>
              </div>
              
              <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-top: 20px;">
                <h2 style="color: #333; margin-top: 0;">Hello ${signer.name || signer.email},</h2>
                
                <p style="font-size: 16px; line-height: 1.6; color: #666;">
                  You have been requested to sign a document: <strong style="color: #333;">${document.name}</strong>
                </p>
                
                <p style="font-size: 16px; line-height: 1.6; color: #666;">
                  Please click the button below to review and sign the document:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${signUrl}" 
                     style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            color: white; 
                            padding: 15px 30px; 
                            text-decoration: none; 
                            border-radius: 25px; 
                            font-weight: bold; 
                            font-size: 16px; 
                            display: inline-block;
                            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                    ✍️ Sign Document
                  </a>
                </div>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 14px; color: #666;">
                    <strong>⚠️ Important:</strong> This link will expire in 30 days. Please sign the document as soon as possible.
                  </p>
                </div>
                
                <p style="font-size: 14px; color: #999; margin-top: 30px;">
                  If you're having trouble with the button above, copy and paste this link into your browser:<br>
                  <a href="${signUrl}" style="color: #667eea; word-break: break-all;">${signUrl}</a>
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 20px; color: #999; font-size: 14px;">
                <p>Best regards,<br><strong>SignFlow Team</strong></p>
                <p>Secure Document Signing Platform</p>
              </div>
            </div>
          `,
          text: `Document Signature Request - ${document.name}

Hello ${signer.name || signer.email},

You have been requested to sign a document: ${document.name}

Please visit this link to review and sign the document:
${signUrl}

Important: This link will expire in 30 days. Please sign the document as soon as possible.

Best regards,
SignFlow Team
Secure Document Signing Platform`,
        }

        console.log(`Sending email to ${signer.email}...`)
        const emailResult = await sendEmail(emailOptions)
        console.log(`Email result for ${signer.email}:`, emailResult)

        emailResults.push({
          email: signer.email,
          success: emailResult.success,
          messageId: emailResult.messageId || null,
          error: emailResult.error || null
        })

        if (emailResult.success) {
          console.log(`✅ Email sent successfully to ${signer.email}`)
        } else {
          console.error(`❌ Email failed to ${signer.email}:`, emailResult.error)
        }

      } catch (emailError) {
        console.error(`❌ Exception sending email to ${signer.email}:`, emailError)
        emailResults.push({
          email: signer.email,
          success: false,
          messageId: null,
          error: emailError.message || "Email sending failed"
        })
      }
    }

    // Count successful and failed emails
    const successfulEmails = emailResults.filter(result => result.success)
    const failedEmails = emailResults.filter(result => !result.success)

    console.log("=== Email Summary ===")
    console.log(`Total emails: ${emailResults.length}`)
    console.log(`Successful: ${successfulEmails.length}`)
    console.log(`Failed: ${failedEmails.length}`)

    // Log failed emails for debugging
    if (failedEmails.length > 0) {
      console.error("Failed emails details:", failedEmails)
    }

    // Even if some emails failed, consider it a success if at least one was sent
    const overallSuccess = successfulEmails.length > 0

    console.log("=== Sending Response ===")
    console.log("Overall success:", overallSuccess)

    res.status(200).json({
      success: true,
      message: overallSuccess 
        ? `Document sent for signature. ${successfulEmails.length} email(s) sent successfully.`
        : "Document prepared for signature, but email sending failed.",
      data: {
        ...document.toObject(),
        progress: 0 // Reset progress since it's now sent
      },
      emailsSent: successfulEmails.length,
      emailsFailed: failedEmails.length,
      emailDetails: emailResults,
    })

  } catch (error) {
    console.error("=== Send for signature error ===", error)
    res.status(500).json({
      success: false,
      message: "Error sending document for signature",
      error: error.message,
    })
  }
}

// @desc Send reminder to signers
// @route POST /api/documents/:id/remind
// @access Private
exports.remindSigners = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      })
    }

    if (document.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to send reminders for this document",
      })
    }

    const pendingSigners = document.signers.filter((signer) => signer.status === "pending")

    if (pendingSigners.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No pending signers to remind",
      })
    }

    const emailResults = []

    for (const signer of pendingSigners) {
      try {
        const signUrl = `${process.env.CLIENT_URL}/sign/${document._id}?token=${document.signatureToken}&email=${encodeURIComponent(signer.email)}`

        const emailOptions = {
          to: signer.email,
          subject: `Reminder: Document Signature Required - ${document.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #ffa726 0%, #ff7043 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">🔔 Document Signature Reminder</h1>
              </div>
              
              <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-top: 20px;">
                <h2 style="color: #333; margin-top: 0;">Hello ${signer.name || signer.email},</h2>
                
                <p style="font-size: 16px; line-height: 1.6; color: #666;">
                  This is a friendly reminder that you have a pending document to sign: <strong style="color: #333;">${document.name}</strong>
                </p>
                
                <p style="font-size: 16px; line-height: 1.6; color: #666;">
                  Please click the button below to review and sign the document:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${signUrl}" 
                     style="background: linear-gradient(135deg, #ffa726 0%, #ff7043 100%); 
                            color: white; 
                            padding: 15px 30px; 
                            text-decoration: none; 
                            border-radius: 25px; 
                            font-weight: bold; 
                            font-size: 16px; 
                            display: inline-block;
                            box-shadow: 0 4px 15px rgba(255, 167, 38, 0.3);">
                    ✍️ Sign Document Now
                  </a>
                </div>
                
                <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffa726;">
                  <p style="margin: 0; font-size: 14px; color: #856404;">
                    <strong>⏰ Reminder:</strong> This document is waiting for your signature. Please complete it as soon as possible.
                  </p>
                </div>
              </div>
              
              <div style="text-align: center; margin-top: 20px; color: #999; font-size: 14px;">
                <p>Best regards,<br><strong>SignFlow Team</strong></p>
              </div>
            </div>
          `,
          text: `Document Signature Reminder - ${document.name}

Hello ${signer.name || signer.email},

This is a friendly reminder that you have a pending document to sign: ${document.name}

Please visit this link to review and sign the document:
${signUrl}

Reminder: This document is waiting for your signature. Please complete it as soon as possible.

Best regards,
SignFlow Team`,
        }

        const emailResult = await sendEmail(emailOptions)
        emailResults.push({
          email: signer.email,
          success: emailResult.success,
          error: emailResult.error || null
        })

      } catch (emailError) {
        console.error(`Error sending reminder to ${signer.email}:`, emailError)
        emailResults.push({
          email: signer.email,
          success: false,
          error: emailError.message || "Email sending failed"
        })
      }
    }

    const successful = emailResults.filter(result => result.success).length

    res.status(200).json({
      success: true,
      message: "Reminders sent successfully",
      remindersSent: successful,
      totalPending: pendingSigners.length,
      emailDetails: emailResults,
    })
  } catch (error) {
    console.error("Send reminder error:", error)
    res.status(500).json({
      success: false,
      message: "Error sending reminders",
      error: error.message,
    })
  }
}