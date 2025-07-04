const express = require("express")
const {
  uploadDocument,
  getDocuments,
  getDocument,
  getDocumentPdf, // FIXED: Add PDF route
  deleteDocument,
  sendForSignature,
  remindSigners,
} = require("../controllers/documentController")
const { protect } = require("../middleware/auth")
const upload = require("../middleware/upload")

const router = express.Router()

router.use(protect) // All routes are protected

router.route("/").get(getDocuments).post(upload.single("document"), uploadDocument)

router.route("/:id").get(getDocument).delete(deleteDocument)

// FIXED: Add PDF route
router.get("/:id/pdf", getDocumentPdf)

router.post("/:id/send", sendForSignature)
router.post("/:id/remind", remindSigners)

module.exports = router
