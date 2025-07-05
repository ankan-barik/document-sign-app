"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { PenTool, FileText, CheckCircle, X, Loader2 } from "lucide-react"

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function SignPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()

  const [document, setDocument] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(false)
  const [signatureText, setSignatureText] = useState("")
  const [signatures, setSignatures] = useState<Array<{ x: number; y: number; text: string }>>([])
  const [showSignatureInput, setShowSignatureInput] = useState(false)
  const [pendingSignature, setPendingSignature] = useState<{ x: number; y: number } | null>(null)
  const [draggedSignature, setDraggedSignature] = useState<number | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [signed, setSigned] = useState(false)

  const documentRef = useRef<HTMLDivElement>(null)

  const token = searchParams.get("token")
  const email = searchParams.get("email")

  // Load document and check signing status
  useEffect(() => {
    const loadDocument = async () => {
      if (!id || !token || !email) {
        toast({
          title: "Invalid Link",
          description: "This signing link is invalid or incomplete.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      try {
        // Fetch document details
        const response = await fetch(`${API_BASE_URL}/api/sign/${id}?token=${token}&email=${encodeURIComponent(email)}`)

        if (!response.ok) {
          throw new Error("Failed to load document")
        }

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.message || "Failed to load document")
        }

        setDocument(data.data)

        // Check if already signed
        const signer = data.data.signers?.find((s: any) => s.email === email)
        if (signer?.status === "signed") {
          setSigned(true)
        }

        // Load PDF
        const pdfResponse = await fetch(`${API_BASE_URL}/api/sign/${id}/pdf?token=${token}`)
        if (pdfResponse.ok) {
          const blob = await pdfResponse.blob()
          const url = URL.createObjectURL(blob)
          setPdfUrl(url)
        }
      } catch (error) {
        console.error("Error loading document:", error)
        toast({
          title: "✨ Error Loading Document",
          description: "Failed to load the document. Please check the link and try again.",
          variant: "destructive",
          className: "bg-gradient-to-r from-indigo-500 to-pink-500 text-white border-0",
        })
      } finally {
        setLoading(false)
      }
    }

    loadDocument()

    // Cleanup PDF URL on unmount
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [id, token, email])

  // Handle document click for signature placement
  const handleDocumentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (signed || draggedSignature !== null) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setPendingSignature({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
    })
    setShowSignatureInput(true)
  }

  // Add signature
  const addSignature = () => {
    if (pendingSignature && signatureText.trim()) {
      setSignatures([
        ...signatures,
        {
          x: pendingSignature.x,
          y: pendingSignature.y,
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
    }
  }

  // Remove signature
  const removeSignature = (index: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setSignatures((prevSignatures) => prevSignatures.filter((_, i) => i !== index))
    toast({
      title: "✨ Signature Removed",
      description: "The signature has been removed from the document.",
      className: "bg-gradient-to-r from-indigo-500 to-pink-500 text-white border-0",
    })
  }

  // Drag handlers
  const handleSignatureMouseDown = (e: React.MouseEvent, index: number) => {
    if (signed) return

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

  // Submit signature
  const handleSubmitSignature = async () => {
    if (signatures.length === 0) {
      toast({
        title: "No Signatures",
        description: "Please add at least one signature before submitting.",
        variant: "destructive",
      })
      return
    }

    setSigning(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/sign/${id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          email,
          signatures,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to submit signature")
      }

      setSigned(true)
      toast({
        title: "🎉 Document Signed!",
        description: "Your signature has been successfully submitted.",
        className: "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0",
      })
    } catch (error) {
      console.error("Error submitting signature:", error)
      toast({
        title: "Error Submitting Signature",
        description: "Failed to submit your signature. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSigning(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading document...</p>
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-8">
            <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Document Not Found</h2>
            <p className="text-gray-600">
              The document you're trying to access could not be found or the link has expired.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {document.name}
            </h1>
            <p className="text-gray-600 text-sm">
              {signed ? "Document signed successfully" : "Click on the document to add your signature"}
            </p>
          </div>

          {signed ? (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Signed</span>
            </div>
          ) : (
            <Button
              onClick={handleSubmitSignature}
              disabled={signatures.length === 0 || signing}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
            >
              {signing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing...
                </>
              ) : (
                <>
                  <PenTool className="w-4 h-4 mr-2" />
                  Submit Signature
                </>
              )}
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm rounded-xl">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b">
              <CardTitle className="flex items-center text-lg">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Document Preview
                {!signed && (
                  <span className="ml-4 text-sm font-normal text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    Click to add signatures • Drag to reposition
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div
                ref={documentRef}
                className={`relative bg-white border-2 rounded-xl overflow-hidden shadow-inner transition-all duration-200 ${
                  !signed ? "cursor-crosshair border-blue-300 shadow-blue-100" : "border-gray-200"
                }`}
                style={{ aspectRatio: "8.5/11", minHeight: "600px" }}
                onClick={handleDocumentClick}
              >
                {/* PDF Preview */}
                {pdfUrl ? (
                  <iframe src={pdfUrl} className="w-full h-full" title="PDF Preview" style={{ border: "none" }} />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg font-medium">PDF Document Preview</p>
                      <p className="text-gray-400 text-sm mt-2">{document.name}</p>
                      <p className="text-gray-400 text-xs mt-1">Loading PDF preview...</p>
                    </div>
                  </div>
                )}

                {/* Signature Overlays */}
                {signatures.map((sig, index) => (
                  <div
                    key={index}
                    className={`absolute group select-none ${
                      draggedSignature === index ? "z-50 cursor-grabbing" : signed ? "cursor-default" : "cursor-grab"
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
                    {!signed && (
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
