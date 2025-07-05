"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileText, X, Loader2, Plus, Mail, CheckCircle, ArrowRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DocumentUploadProps {
  onUploadComplete: (document: any) => void
}

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const DocumentUpload = ({ onUploadComplete }: DocumentUploadProps) => {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [documentName, setDocumentName] = useState("")
  const [signerEmails, setSignerEmails] = useState<string[]>([""])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const validateFile = (file: File): boolean => {
    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF file only.",
        variant: "destructive",
      })
      return false
    }

    const maxSize = 10 * 1024 * 1024 // 10MB in bytes
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 10MB.",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleFileSelect = (selectedFile: File) => {
    if (validateFile(selectedFile)) {
      setFile(selectedFile)
      setDocumentName(selectedFile.name.replace(".pdf", ""))
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const removeFile = () => {
    setFile(null)
    setDocumentName("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    toast({
      title: "✨ File Removed",
      description: "The selected PDF has been removed successfully.",
      className: "bg-gradient-to-r from-indigo-500 to-pink-500 text-white border-0",
    })
  }

  const addEmailField = () => {
    setSignerEmails([...signerEmails, ""])
  }

  const removeEmailField = (index: number) => {
    if (signerEmails.length > 1) {
      const newEmails = signerEmails.filter((_, i) => i !== index)
      setSignerEmails(newEmails)
    }
  }

  const updateEmail = (index: number, email: string) => {
    const newEmails = [...signerEmails]
    newEmails[index] = email
    setSignerEmails(newEmails)
  }

  const getAuthToken = (): string | null => {
    // Try to get token from localStorage first, fallback to sessionStorage
    return localStorage.getItem("token") || sessionStorage.getItem("token") || null
  }

  const handleDocumentIconClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "✨ No File Selected",
        description: "Please select a PDF file to upload.",
        variant: "destructive",
        className: "bg-gradient-to-r from-indigo-500 to-pink-500 text-white border-0",
      })
      return
    }

    if (!documentName.trim()) {
      toast({
        title: "✨ Document Name Required",
        description: "Please enter a name for your document.",
        variant: "destructive",
        className: "bg-gradient-to-r from-indigo-500 to-pink-500 text-white border-0",
      })
      return
    }

    // Validate emails
    const validEmails = signerEmails.filter((email) => email.trim() !== "")
    const invalidEmails = validEmails.filter((email) => !validateEmail(email))

    if (invalidEmails.length > 0) {
      toast({
        title: "✨ Invalid Email Addresses",
        description: "Please enter valid email addresses for all signers.",
        variant: "destructive",
        className: "bg-gradient-to-r from-indigo-500 to-pink-500 text-white border-0",
      })
      return
    }

    if (validEmails.length === 0) {
      toast({
        title: "✨ At Least One Email Required",
        description: "Please add at least one email address for document signers.",
        variant: "destructive",
        className: "bg-gradient-to-r from-indigo-500 to-pink-500 text-white border-0",
      })
      return
    }

    const token = getAuthToken()
    if (!token) {
      toast({
        title: "✨ Authentication Required",
        description: "Please log in to upload documents.",
        variant: "destructive",
        className: "bg-gradient-to-r from-indigo-500 to-pink-500 text-white border-0",
      })
      return
    }

    setUploading(true)

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append("document", file)
      formData.append("name", documentName.trim())

      // Add signers as JSON string
      const signersData = validEmails.map((email) => ({
        email: email.trim(),
        name: email.trim().split("@")[0], // Use email prefix as default name
      }))
      formData.append("signers", JSON.stringify(signersData))

      console.log("Uploading document with signers:", signersData)

      const response = await fetch(`${API_BASE_URL}/api/documents`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const responseText = await response.text()
      console.log("Upload response:", responseText)

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
            title: "Authentication Failed",
            description: "Please log in again to upload documents.",
            variant: "destructive",
          })
          return
        }

        throw new Error(data.message || `Upload failed with status ${response.status}`)
      }

      if (data.success) {
        toast({
          title: "✨ Success!",
          description: "Document uploaded successfully! You can now send it for signing.",
          className: "bg-gradient-to-r from-indigo-500 to-pink-500 text-white border-0",
        })

        // Call the callback with the uploaded document data
        onUploadComplete(data.data)

        // Reset form
        setFile(null)
        setDocumentName("")
        setSignerEmails([""])

        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      } else {
        throw new Error(data.message || "Upload failed")
      }
    } catch (error) {
      console.error("Upload error:", error)

      let errorMessage = "Failed to upload document. Please try again."
      if (error instanceof TypeError && error.message.includes("fetch")) {
        errorMessage = "Cannot connect to server. Please ensure the backend is running on port 5000."
      } else if (error instanceof Error && error.message) {
        errorMessage = error.message
      }

      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
          <Upload className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
          Upload Document
        </h1>
        <p className="text-gray-600 text-lg">Securely upload and prepare your documents for digital signing</p>
      </div>

      <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-8 py-6">
          <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-800">
            <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            Document Upload
          </CardTitle>
        </div>

        <CardContent className="p-8 space-y-8">
          {!file ? (
            <div
              className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 group ${
                dragActive
                  ? "border-blue-400 bg-gradient-to-br from-blue-50 to-purple-50 scale-[1.02]"
                  : "border-gray-200 hover:border-blue-300 hover:bg-gradient-to-br hover:from-blue-50/50 hover:to-purple-50/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center gap-6">
                <div
                  className={`relative p-6 rounded-2xl transition-all duration-300 cursor-pointer ${
                    dragActive
                      ? "bg-white shadow-lg scale-110"
                      : "bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-blue-50 group-hover:to-purple-50 group-hover:scale-105"
                  }`}
                  onClick={handleDocumentIconClick}
                >
                  <FileText
                    className={`h-12 w-12 transition-colors duration-300 ${
                      dragActive ? "text-blue-500" : "text-gray-400 group-hover:text-blue-500"
                    }`}
                  />
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                    <Plus className="h-4 w-4 text-white font-bold" />
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xl font-semibold text-gray-900">
                    Drop your PDF here, or{" "}
                    <label
                      htmlFor="file-upload"
                      className="text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text hover:from-blue-700 hover:to-purple-700 cursor-pointer underline decoration-2 underline-offset-2"
                    >
                      browse files
                    </label>
                  </p>
                  <p className="text-gray-500">Supports PDF files up to 10MB • Secure & encrypted upload</p>
                </div>

                <input
                  ref={fileInputRef}
                  id="file-upload"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>

              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="absolute top-4 left-4 w-8 h-8 border border-blue-300 rounded rotate-45 animate-pulse"></div>
                <div className="absolute top-8 right-8 w-6 h-6 border border-purple-300 rounded-full animate-bounce"></div>
                <div className="absolute bottom-8 left-12 w-4 h-4 bg-blue-300 rounded animate-ping"></div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Selected File Display */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                <div className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                        <FileText className="h-7 w-7 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-lg">{file.name}</p>
                      <p className="text-green-600 font-medium">
                        {(file.size / 1024 / 1024).toFixed(2)} MB • Ready to upload
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={removeFile}
                  className="absolute top-4 right-4 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 z-10"
                  type="button"
                  title="Remove file"
                >
                  <X className="h-4 w-4 stroke-2" />
                </button>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/10 to-emerald-400/10 rounded-bl-full"></div>
              </div>

              {/* Document Name Input */}
              <div className="space-y-3">
                <Label
                  htmlFor="document-name"
                  className="text-base font-semibold text-gray-700 flex items-center gap-2"
                >
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                  Document Name
                </Label>
                <div className="relative">
                  <Input
                    id="document-name"
                    type="text"
                    placeholder="Enter a descriptive name for your document"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    maxLength={100}
                    className="h-12 pl-4 pr-12 text-base border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-400">
                    {documentName.length}/100
                  </div>
                </div>
                <p className="text-sm text-gray-500 bg-blue-50 px-3 py-2 rounded-lg">
                  💡 This name will help you identify your document in the dashboard
                </p>
              </div>

              {/* Signer Emails Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold text-gray-700 flex items-center gap-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                    Signer Email Addresses
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addEmailField}
                    className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 text-blue-600 hover:from-blue-100 hover:to-purple-100 rounded-xl transition-all duration-200"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Email
                  </Button>
                </div>

                <div className="space-y-3">
                  {signerEmails.map((email, index) => (
                    <div key={index} className="group">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 relative">
                          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                              <Mail className="h-4 w-4 text-white" />
                            </div>
                          </div>
                          <Input
                            type="email"
                            placeholder="Enter signer's email address"
                            value={email}
                            onChange={(e) => updateEmail(index, e.target.value)}
                            className="h-12 pl-14 pr-4 text-base border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200"
                          />
                        </div>
                        {signerEmails.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEmailField(index)}
                            className="w-10 h-10 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center flex-shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-sm text-gray-500 bg-purple-50 px-3 py-2 rounded-lg">
                  📧 These people will receive email invitations to sign the document
                </p>
              </div>

              {/* Upload Button */}
              <div className="pt-4">
                <Button
                  onClick={handleUpload}
                  disabled={uploading || !documentName.trim()}
                  className="w-full h-14 text-white font-extrabold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-500 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:scale-100"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      <span>Uploading Document...</span>
                      <div className="ml-3 flex space-x-1">
                        <div
                          className="w-1 h-1 bg-white rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="w-1 h-1 bg-white rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></div>
                        <div
                          className="w-1 h-1 bg-white rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></div>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="mr-3 h-5 w-5" />
                      <span>Upload & send for signing</span>
                      <ArrowRight className="ml-3 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>

              {/* Upload Info */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">What happens next?</p>
                      <p className="text-gray-600 leading-relaxed">
                        Your document will be securely uploaded and prepared for digital signing. You can then send
                        email invitations to all specified signers with instructions to complete their signatures.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-bl-full"></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
