"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  ArrowLeft,
  Download,
  Send,
  PenTool,
  Eye,
  User,
  Calendar,
  Clock,
  X,
  CheckCircle,
  Mail,
  FileText,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DocumentViewerProps {
  document: any
  onBack: () => void
  onRemindSigners: () => void
  onCancelDocument: () => void
  onDownload: () => void
}

const API_BASE_URL = import.meta.env.VITE_API_URL;


export const DocumentViewer = ({
  document,
  onBack,
  onRemindSigners,
  onCancelDocument,
  onDownload,
}: DocumentViewerProps) => {
  const [signatureMode, setSignatureMode] = useState(false)
  const [signatures, setSignatures] = useState<Array<{ x: number; y: number; signer: string; text: string }>>([])
  const [signatureText, setSignatureText] = useState("")
  const [showSignatureInput, setShowSignatureInput] = useState(false)
  const [pendingSignature, setPendingSignature] = useState<{ x: number; y: number } | null>(null)
  const [sendingForSigning, setSendingForSigning] = useState(false)
  const [draggedSignature, setDraggedSignature] = useState<number | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(true)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const documentRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Get signers from the document data
  const signers = document.signers || []
  const signersCount = Array.isArray(signers) ? signers.length : 0

  const getAuthToken = (): string | null => {
    return localStorage.getItem("token") || sessionStorage.getItem("token") || null
  }

  // FIXED: Improved PDF loading with better error handling
  useEffect(() => {
    const loadPdf = async () => {
      const token = getAuthToken()
      if (!token || !document._id) {
        setPdfError("Authentication required")
        setPdfLoading(false)
        return
      }

      try {
        setPdfLoading(true)
        setPdfError(null)

        console.log("Loading PDF for document:", document._id)

        const response = await fetch(`${API_BASE_URL}/api/documents/${document._id}/pdf`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("PDF file not found on server")
          } else if (response.status === 403) {
            throw new Error("Not authorized to view this document")
          } else {
            throw new Error(`Failed to load PDF (${response.status})`)
          }
        }

        const blob = await response.blob()
        if (blob.size === 0) {
          throw new Error("PDF file is empty")
        }

        const url = URL.createObjectURL(blob)
        setPdfUrl(url)
        console.log("PDF loaded successfully")
      } catch (error) {
        console.error("Error loading PDF:", error)
        setPdfError(error instanceof Error ? error.message : "Failed to load PDF")
        toast({
          title: "PDF Loading Error",
          description: error instanceof Error ? error.message : "Failed to load PDF preview",
          variant: "destructive",
        })
      } finally {
        setPdfLoading(false)
      }
    }

    loadPdf()

    // Cleanup
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [document._id])

  // FIXED: Handle clicks on the overlay when in signature mode
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (signatureMode && draggedSignature === null && !showSignatureInput) {
      e.preventDefault()
      e.stopPropagation()
      
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      setPendingSignature({
        x: (x / rect.width) * 100,
        y: (y / rect.height) * 100,
      })
      setShowSignatureInput(true)
    }
  }

  const addSignature = () => {
    if (pendingSignature && signatureText.trim()) {
      console.log("Adding signature:", signatureText, "at position:", pendingSignature)

      setSignatures((prev) => [
        ...prev,
        {
          x: pendingSignature.x,
          y: pendingSignature.y,
          signer: "current-user",
          text: signatureText.trim(),
        },
      ])

      setSignatureText("")
      setShowSignatureInput(false)
      setPendingSignature(null)

      toast({
        title: "✨ Signature Added",
        description: "Your signature has been placed on the document.",
        className: "bg-gradient-to-r from-indigo-500 to-pink-500 text-white border-0",
      })
    } else {
      console.log("Cannot add signature - missing data:", { pendingSignature, signatureText })
    }
  }

  const removeSignature = (index: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setSignatures((prevSignatures) => {
      const newSignatures = prevSignatures.filter((_, i) => i !== index)
      return newSignatures
    })

    toast({
      title: "✨ Signature Removed",
      description: "The signature has been removed from the document.",
      className: "bg-gradient-to-r from-indigo-500 to-pink-500 text-white border-0",
    })
  }

  // Drag handlers for signature boxes
  const handleSignatureMouseDown = (e: React.MouseEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()

    if (!documentRef.current) return

    const rect = documentRef.current.getBoundingClientRect()
    const signatureElement = e.currentTarget
    const signatureRect = signatureElement.getBoundingClientRect()

    setDraggedSignature(index)
    setDragOffset({
      x: e.clientX - signatureRect.left - signatureRect.width / 2,
      y: e.clientY - signatureRect.top - signatureRect.height / 2,
    })
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (draggedSignature !== null && documentRef.current) {
      e.preventDefault()

      const rect = documentRef.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100
      const y = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100

      // Constrain to document bounds
      const constrainedX = Math.max(0, Math.min(95, x))
      const constrainedY = Math.max(0, Math.min(95, y))

      setSignatures((prev) =>
        prev.map((sig, index) => (index === draggedSignature ? { ...sig, x: constrainedX, y: constrainedY } : sig)),
      )
    }
  }

  const handleMouseUp = (e: MouseEvent) => {
    if (draggedSignature !== null) {
      e.preventDefault()
      setDraggedSignature(null)
      setDragOffset({ x: 0, y: 0 })
    }
  }

  // Add event listeners for dragging
  useEffect(() => {
    if (draggedSignature !== null) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)

      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [draggedSignature, dragOffset])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg"
      case "pending":
        return "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg"
      case "sent":
        return "bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0 shadow-lg"
      case "draft":
        return "bg-gradient-to-r from-gray-500 to-slate-500 text-white border-0 shadow-lg"
      default:
        return "bg-gradient-to-r from-gray-500 to-slate-500 text-white border-0 shadow-lg"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />
      case "pending":
        return <Clock className="w-4 h-4" />
      case "sent":
        return <Send className="w-4 h-4" />
      case "draft":
        return <FileText className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const handleRemindSigners = async () => {
    const token = getAuthToken()
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to send reminders.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/${document._id}/remind`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "📧 Reminders Sent",
          description: `Sent reminders to ${data.remindersSent} signer(s).`,
          className: "bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0",
        })
        onRemindSigners()
      } else {
        throw new Error(data.message || "Failed to send reminders")
      }
    } catch (error) {
      console.error("Remind signers error:", error)
      toast({
        title: "✨ Failed to Send Reminders",
        description: "There was an error sending reminders. Please try again.",
        variant: "destructive",
        className: "bg-gradient-to-r from-indigo-500 to-pink-500 text-white border-0",
      })
    }
  }

  const handleCancelDocument = () => {
    const confirmMessage = "Are you sure you want to cancel this document? This action cannot be undone."

    if (window.confirm(confirmMessage)) {
      onCancelDocument()
      toast({
        title: "✨ Document Cancelled",
        description: "The document has been cancelled successfully.",
        className: "bg-gradient-to-r from-indigo-500 to-pink-500 text-white border-0",
      })
    }
  }

  const handleSendForSigning = async () => {
    if (signersCount === 0) {
      toast({
        title: "✨ No Signers Found",
        description: "Please add signers before sending the document.",
        variant: "destructive",
      })
      return
    }

    const token = getAuthToken()
    if (!token) {
      toast({
        title: "✨ Authentication Required",
        description: "Please log in to send documents for signing.",
        variant: "destructive",
      })
      return
    }

    setSendingForSigning(true)

    try {
      console.log("Sending document for signing:", document._id)

      const response = await fetch(`${API_BASE_URL}/api/documents/${document._id}/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signers: signers,
          signatures: signatures,
          signingUrl: `${window.location.origin}/sign/${document._id}`,
        }),
      })

      const responseText = await response.text()
      console.log("Send for signing response:", responseText)

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error("JSON parse error:", parseError)
        throw new Error("Invalid server response")
      }

      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "✨ Authentication Failed",
            description: "Please log in again to send documents.",
            variant: "destructive",
          })
          return
        }
        throw new Error(data.message || `Failed to send document (${response.status})`)
      }

      if (data.success) {
        const emailDetails = data.emailDetails || []
        const successCount = emailDetails.filter((detail: any) => detail.success).length
        const failCount = emailDetails.filter((detail: any) => !detail.success).length

        let description = `Document sent to ${signersCount} signer(s).`
        if (successCount > 0) {
          description += ` ${successCount} email(s) sent successfully.`
        }
        if (failCount > 0) {
          description += ` ${failCount} email(s) failed to send.`
        }

        toast({
          title: "🎉 Document Sent!",
          description: description,
          className: "bg-gradient-to-r from-indigo-500 to-pink-500 text-white border-0",
        })

        // Update local document status
        document.status = "sent"

        // Refresh the parent component if needed
        if (typeof onBack === "function") {
          setTimeout(() => {
            onBack()
          }, 2000)
        }
      } else {
        throw new Error(data.message || "Failed to send document")
      }
    } catch (error) {
      console.error("Send for signing error:", error)

      let errorMessage = "There was an error sending the document. Please try again."
      if (error instanceof TypeError && error.message.includes("fetch")) {
        errorMessage = "Cannot connect to server. Please ensure the backend is running."
      } else if (error instanceof Error && error.message) {
        errorMessage = error.message
      }

      toast({
        title: "✨ Failed to Send",
        description: errorMessage,
        variant: "destructive",
        className: "bg-gradient-to-r from-indigo-500 to-pink-500 text-white border-0",
      })
    } finally {
      setSendingForSigning(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-4 sm:px-6 py-4 sticky top-0 z-40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {document.name}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1 text-blue-500" />
                  Created: {document.createdAt ? new Date(document.createdAt).toLocaleDateString() : "Unknown"}
                </span>
                <span className="flex items-center">
                  <User className="w-4 h-4 mr-1 text-purple-500" />
                  {signersCount} signer(s)
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge className={`${getStatusColor(document.status)} px-3 py-1.5 text-sm font-medium`}>
              {getStatusIcon(document.status)}
              <span className="ml-2">{(document.status || "draft").replace("-", " ").toUpperCase()}</span>
            </Badge>

            <Button
              variant={signatureMode ? "default" : "outline"}
              onClick={() => {
                setSignatureMode(!signatureMode)
                console.log("Signature mode toggled:", !signatureMode)
              }}
              size="sm"
              className={
                signatureMode
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg "
                  : "hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300 transition-all duration-200 rounded-xl"
              }
            >
              <PenTool className="w-4 h-4 mr-2" />
              {signatureMode ? "Exit Signature Mode" : "Add Signature"}
            </Button>

            {(document.status === "completed" || document.status === "sent") && (
              <Button
                size="sm"
                onClick={onDownload}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}

            {(document.status === "pending" || document.status === "draft") && (
              <Button
                size="sm"
                onClick={handleSendForSigning}
                disabled={sendingForSigning || signersCount === 0}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl"
              >
                {sendingForSigning ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send for Signing
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 sm:p-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Document Viewer */}
          <div className="lg:col-span-3">
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm rounded-xl">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b">
                <CardTitle className="flex items-center text-lg">
                  <Eye className="w-5 h-5 mr-2 text-blue-600" />
                  Document Preview
                  {signatureMode && (
                    <span className="ml-4 text-sm font-normal text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                      Click on the document to add signature fields
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div
                  ref={documentRef}
                  className={`relative bg-white border-2 rounded-xl overflow-hidden shadow-inner transition-all duration-200 ${
                    signatureMode
                      ? "cursor-crosshair border-purple-300 shadow-purple-100"
                      : "cursor-default border-gray-200"
                  }`}
                  style={{ aspectRatio: "8.5/11", minHeight: "600px" }}
                >
                  {/* FIXED: Overlay div to capture clicks when in signature mode */}
                  {signatureMode && (
                    <div
                      className="absolute inset-0 z-30 bg-transparent cursor-crosshair"
                      onClick={handleOverlayClick}
                    />
                  )}

                  {/* FIXED: Better PDF preview with loading and error states */}
                  {pdfLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-500 text-lg font-medium">Loading PDF...</p>
                        <p className="text-gray-400 text-sm mt-2">{document.name}</p>
                      </div>
                    </div>
                  ) : pdfError ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-50">
                      <div className="text-center">
                        <FileText className="w-16 h-16 text-red-300 mx-auto mb-4" />
                        <p className="text-red-600 text-lg font-medium">Failed to Load PDF</p>
                        <p className="text-red-500 text-sm mt-2">{pdfError}</p>
                        <p className="text-gray-400 text-xs mt-1">{document.name}</p>
                      </div>
                    </div>
                  ) : pdfUrl ? (
                    <iframe
                      src={pdfUrl}
                      className="w-full h-full"
                      title="PDF Preview"
                      style={{ border: "none" }}
                      onLoad={() => console.log("PDF iframe loaded successfully")}
                      onError={() => {
                        console.error("PDF iframe failed to load")
                        setPdfError("Failed to display PDF")
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg font-medium">PDF Document Preview</p>
                        <p className="text-gray-400 text-sm mt-2">{document.name}</p>
                        <p className="text-gray-400 text-xs mt-1">No PDF available</p>
                      </div>
                    </div>
                  )}

                  {/* Signature Overlays */}
                  {signatures.map((sig, index) => (
                    <div
                      key={index}
                      className={`absolute group select-none z-40 ${
                        draggedSignature === index ? "cursor-grabbing" : "cursor-grab"
                      }`}
                      style={{
                        left: `${sig.x}%`,
                        top: `${sig.y}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                      onMouseDown={(e) => handleSignatureMouseDown(e, index)}
                    >
                      <div
                        className={`bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg px-4 py-2 font-medium text-sm shadow-lg transition-all duration-200 ${
                          draggedSignature === index ? "shadow-2xl scale-105" : "hover:shadow-xl"
                        }`}
                      >
                        {sig.text}
                        <div className="absolute inset-0 bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </div>
                      {signatureMode && (
                        <button
                          onClick={(e) => removeSignature(index, e)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 shadow-lg z-10"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Document Info */}
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm ">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b">
                <CardTitle className="text-lg">Document Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Status</p>
                  <Badge className={`${getStatusColor(document.status)} px-3 py-2 text-sm font-medium`}>
                    {getStatusIcon(document.status)}
                    <span className="ml-2">{(document.status || "draft").replace("-", " ").toUpperCase()}</span>
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Progress</p>
                  <div className="space-y-2">
                    <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
                        style={{ width: `${document.progress || 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 font-medium">{document.progress || 0}% complete</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Signatures Placed</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                      <PenTool className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{signatures.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Signers */}
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b">
                <CardTitle className="text-lg flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-purple-600" />
                  Signers ({signersCount})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {signersCount > 0 ? (
                  <div className="space-y-4">
                    {signers.map((signer: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg"
                      >
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{signer.email}</p>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Clock className="w-3 h-3 mr-1" />
                            {signer.status === "signed" ? "Signed" : "Pending signature"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm">No signers found</p>
                    <p className="text-gray-400 text-xs mt-1">Add signers when uploading the document</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b">
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all duration-200 rounded-xl bg-transparent"
                  onClick={handleRemindSigners}
                  disabled={signersCount === 0}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Remind Signers
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-all duration-200 rounded-xl bg-transparent"
                  onClick={onDownload}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Copy
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 transition-all duration-200 rounded-xl bg-transparent"
                  onClick={handleCancelDocument}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel Document
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Signature Input Modal */}
      {showSignatureInput && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl transform transition-all">
            <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Add Your Signature
            </h3>
            <Input
              placeholder="Type your signature..."
              value={signatureText}
              onChange={(e) => setSignatureText(e.target.value)}
              className="mb-6 h-12 text-lg border-2 focus:border-purple-500 focus:ring-purple-200"
              autoFocus
              onKeyPress={(e) => e.key === "Enter" && signatureText.trim() && addSignature()}
            />
            <div className="flex space-x-3">
              <Button
                onClick={addSignature}
                disabled={!signatureText.trim()}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg h-12"
              >
                <PenTool className="w-4 h-4 mr-2" />
                Add Signature
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowSignatureInput(false)
                  setPendingSignature(null)
                  setSignatureText("")
                }}
                className="flex-1 h-12 hover:bg-gray-50"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
