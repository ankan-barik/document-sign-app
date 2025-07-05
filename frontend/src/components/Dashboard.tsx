"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
  PenTool,
  Send,
  Download,
  Search,
  Filter,
  Plus,
  Eye,
  Calendar,
  User,
  Clock,
  LogOut,
  Loader2,
  Trash2,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AnimatedLogo } from "./AnimatedLogo"
import { DocumentUpload } from "./DocumentUpload"
import { DocumentViewer } from "./DocumentViewer"
import { useToast } from "@/hooks/use-toast"

interface DashboardProps {
  onLogout: () => void
}

const API_BASE_URL = import.meta.env.VITE_API_URL;


export const Dashboard = ({ onLogout }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState("documents")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const getAuthToken = (): string | null => {
    return localStorage.getItem("token") || sessionStorage.getItem("token") || null
  }

  // Fetch documents from API
  const fetchDocuments = async () => {
    const token = getAuthToken()
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to view documents.",
        variant: "destructive",
      })
      onLogout()
      return
    }

    try {
      setLoading(true)
      console.log("Fetching documents...")

      const response = await fetch(`${API_BASE_URL}/api/documents`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const responseText = await response.text()
      console.log("Documents response:", responseText)

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
            title: "Session Expired",
            description: "Please log in again.",
            variant: "destructive",
          })
          onLogout()
          return
        }
        throw new Error(data.message || `Failed to fetch documents (${response.status})`)
      }

      if (data.success) {
        console.log("Documents fetched:", data.data)
        setDocuments(data.data || [])
      } else {
        throw new Error(data.message || "Failed to fetch documents")
      }
    } catch (error) {
      console.error("Fetch documents error:", error)

      let errorMessage = "Failed to load documents. Please try again."
      if (error instanceof TypeError && error.message.includes("fetch")) {
        errorMessage = "Cannot connect to server. Please ensure the backend is running."
      } else if (error instanceof Error && error.message) {
        errorMessage = error.message
      }

      toast({
        title: "Error Loading Documents",
        description: errorMessage,
        variant: "destructive",
        className: "bg-gradient-to-r from-indigo-500 to-pink-500 text-white border-0",
      })
    } finally {
      setLoading(false)
    }
  }

  // Load documents on component mount
  useEffect(() => {
    fetchDocuments()
  }, [])

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.signers && doc.signers.some((signer: any) => signer.email.toLowerCase().includes(searchTerm.toLowerCase())))
    const matchesFilter = filterStatus === "all" || doc.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white border-0 shadow-xl shadow-emerald-200/50"
      case "pending":
        return "bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white border-0 shadow-xl shadow-amber-200/50"
      case "sent":
        return "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white border-0 shadow-xl shadow-blue-200/50"
      case "draft":
        return "bg-gradient-to-r from-gray-500 via-slate-500 to-gray-600 text-white border-0 shadow-xl shadow-gray-200/50"
      default:
        return "bg-gradient-to-r from-gray-500 via-slate-500 to-gray-600 text-white border-0 shadow-xl shadow-gray-200/50"
    }
  }

  const handleDownload = async (docId: string) => {
    const doc = documents.find((d) => d._id === docId)
    if (!doc) return

    if (doc.status !== "completed") {
      toast({
        title: "✨ Cannot download",
        description: "Document must be completed before downloading.",
        variant: "destructive",
        className: "bg-gradient-to-r from-indigo-500 to-pink-500 text-white border-0",
      })
      return
    }

    // For now, just show a success message
    // In a real implementation, you would download the actual file
    toast({
      title: "✨ Download started",
      description: `${doc.name} is being downloaded.`,
      className: "bg-gradient-to-r from-indigo-500 to-pink-500 text-white border-0",
    })
  }

  // FIXED: Add delete document function
  const handleDeleteDocument = async (docId: string) => {
    const doc = documents.find((d) => d._id === docId)
    if (!doc) return

    if (!window.confirm(`Are you sure you want to delete "${doc.name}"? This action cannot be undone.`)) {
      return
    }

    const token = getAuthToken()
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to delete documents.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/${docId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Remove from local state
        setDocuments(documents.filter((d) => d._id !== docId))

        toast({
          title: "✨ Document Deleted",
          description: "The document has been deleted successfully.",
          className: "bg-gradient-to-r from-indigo-500 to-pink-500 text-white border-0",
        })
      } else {
        throw new Error(data.message || "Failed to delete document")
      }
    } catch (error) {
      console.error("Delete document error:", error)
      toast({
        title: "Failed to Delete",
        description: "There was an error deleting the document. Please try again.",
        variant: "destructive",
        className: "bg-gradient-to-r from-indigo-500 to-pink-500 text-white border-0",
      })
    }
  }

  const handleRemindSigners = async (docId: string) => {
    const token = getAuthToken()
    if (!token) {
      toast({
        title: "✨ Authentication Required",
        description: "Please log in to send reminders.",
        variant: "destructive",
        className: "bg-gradient-to-r from-indigo-500 to-pink-500 text-white border-0",
      })
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/${docId}/remind`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "✨ Reminder sent",
          description: `Reminder sent to ${data.remindersSent} signer(s).`,
          className: "bg-gradient-to-r from-indigo-500 to-pink-500 text-white border-0",
        })
      } else {
        throw new Error(data.message || "Failed to send reminders")
      }
    } catch (error) {
      console.error("Remind signers error:", error)
      toast({
        title: "✨ Failed to send reminders",
        description: "There was an error sending reminders. Please try again.",
        variant: "destructive",
        className: "bg-gradient-to-r from-indigo-500 to-pink-500 text-white border-0",
      })
    }
  }

  const handleCancelDocument = async (docId: string) => {
    // FIXED: Proper document cancellation
    await handleDeleteDocument(docId)
  }

  const handleUploadComplete = (uploadedDoc: any) => {
    console.log("Upload completed:", uploadedDoc)

    // Add the new document to the list
    setDocuments((prevDocs) => [uploadedDoc, ...prevDocs])
    setShowUpload(false)

    // Refresh the documents list to get the latest data
    fetchDocuments()

    toast({
      title: "✨ Document uploaded successfully",
      description: "Your document is ready for signing.",
      className: "bg-gradient-to-r from-indigo-500 to-pink-500 text-white border-0",
    })
  }

  const stats = [
    {
      title: "Total Documents",
      value: documents.length.toString(),
      icon: FileText,
      color: "text-blue-600",
      bgGradient: "from-blue-500/10 via-indigo-500/10 to-cyan-500/10",
      iconColor: "text-blue-600",
      iconBg: "bg-gradient-to-br from-blue-500 via-indigo-600 to-cyan-600",
      ringColor: "ring-blue-200/50 rounded-xl",
    },
    {
      title: "Pending Signatures",
      value: documents.filter((d) => d.status === "pending" || d.status === "sent").length.toString(),
      icon: Clock,
      color: "text-amber-600",
      bgGradient: "from-amber-500/10 via-orange-500/10 to-red-500/10",
      iconBg: "bg-gradient-to-br from-amber-500 via-orange-600 to-red-600",
      ringColor: "ring-amber-200/50 rounded-xl",
    },
    {
      title: "Completed",
      value: documents.filter((d) => d.status === "completed").length.toString(),
      icon: PenTool,
      color: "text-emerald-600",
      bgGradient: "from-emerald-500/10 via-green-500/10 to-teal-500/10",
      iconBg: "bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600",
      ringColor: "ring-emerald-200/50 rounded-xl",
    },
    {
      title: "This Month",
      value: documents
        .filter((d) => {
          const docDate = new Date(d.createdAt)
          const now = new Date()
          return docDate.getMonth() === now.getMonth() && docDate.getFullYear() === now.getFullYear()
        })
        .length.toString(),
      icon: Calendar,
      color: "text-purple-600",
      bgGradient: "from-purple-500/10 via-violet-500/10 to-pink-500/10",
      iconBg: "bg-gradient-to-br from-purple-500 via-violet-600 to-pink-600",
      ringColor: "ring-purple-200/50 rounded-xl",
    },
  ]

  if (selectedDocument) {
    return (
      <DocumentViewer
        document={selectedDocument}
        onBack={() => setSelectedDocument(null)}
        onRemindSigners={() => handleRemindSigners(selectedDocument._id)}
        onCancelDocument={() => {
          handleCancelDocument(selectedDocument._id)
          setSelectedDocument(null)
        }}
        onDownload={() => handleDownload(selectedDocument._id)}
      />
    )
  }

  if (showUpload) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => setShowUpload(false)}
              className="mb-4 border-2 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95"
            >
              ← Back
            </Button>
          </div>
          <DocumentUpload onUploadComplete={handleUploadComplete} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/20 to-purple-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-200/20 to-pink-300/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-200/10 to-blue-300/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-gray-200/50 px-4 sm:px-6 py-4 shadow-2xl shadow-blue-100/20 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-lg opacity-30 animate-pulse"></div>
              <AnimatedLogo size={35} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold flex">
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent drop-shadow-sm">
                  Sign
                </span>
                <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 bg-clip-text text-transparent drop-shadow-sm">
                  Flow
                </span>
              </h1>
              <p className="text-gray-600 hidden sm:block text-sm font-medium">Manage your documents and signatures</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button
              onClick={() => setShowUpload(true)}
              className="
                relative
                bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500
                transform hover:scale-105 active:scale-95
                rounded-xl px-6 py-3 text-white font-bold
                overflow-hidden
                group
                ring-2 ring-white/20
              "
            >
              {/* Animated Glow Layer */}
              <span
                className="
                  absolute inset-0
                  bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500
                  blur-2xl opacity-50
                  animate-pulse
                  group-hover:opacity-70
                  transition-opacity duration-500
                  rounded-xl
                  pointer-events-none
                "
              />

              {/* Shimmer effect */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 skew-x-12"></span>

              {/* Content */}
              <span className="relative flex items-center justify-center space-x-2">
                <Plus
                  className="
                    w-5 h-5 
                    animate-bounce
                    group-hover:animate-none
                    transition-transform duration-300
                    group-hover:rotate-180
                  "
                />
                <span className="hidden sm:inline">Upload Document</span>
                <span className="sm:hidden">Upload</span>
              </span>
            </Button>

            <Button
              variant="outline"
              onClick={onLogout}
              className="text-red-600 hover:text-red-700 border-2 hover:bg-red-50 transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95 ring-1 ring-red-100/50 rounded-xl bg-transparent"
            >
              <LogOut className="w-4 h-4 mr-2 " />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 sm:p-6 relative z-10">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className={`hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-gradient-to-br ${stat.bgGradient} border-0 shadow-xl shadow-gray-200/30 backdrop-blur-sm ring-1 ${stat.ringColor} group overflow-hidden relative`}
            >
              {/* Decorative corner gradient */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-white/10 to-transparent rounded-bl-3xl"></div>

              <CardContent className="p-4 sm:p-6 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2 opacity-80">{stat.title}</p>
                    <p className="text-2xl sm:text-3xl font-black text-gray-900 group-hover:scale-110 transition-transform duration-300">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`w-14 h-14 rounded-2xl ${stat.iconBg} flex items-center justify-center shadow-2xl shadow-black/20 group-hover:shadow-3xl group-hover:scale-110 transition-all duration-300 ring-2 ring-white/30`}
                  >
                    <stat.icon className="w-7 h-7 text-white drop-shadow-lg" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Documents Section */}
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-xl ring-1 ring-gray-200/50 overflow-hidden rounded-xl">
          <CardHeader className="bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-purple-50/80 rounded-t-lg relative overflow-hidden">
            {/* Decorative background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-indigo-400 to-pink-600 rounded-full blur-2xl"></div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 relative z-10">
              <CardTitle className="text-2xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-sm">
                Documents
              </CardTitle>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-blue-500 transition-colors duration-300" />
                  <Input
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64 border-2 focus:border-blue-500 transition-all duration-300 bg-white/90 backdrop-blur-sm shadow-lg focus:shadow-xl ring-1 ring-gray-200/50 focus:ring-blue-200/50 rounded-xl"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-36 border-2 focus:border-blue-500 bg-white/90 backdrop-blur-sm shadow-lg ring-1 ring-gray-200/50 rounded-xl">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-0 shadow-2xl backdrop-blur-xl rounded-xl">
                    <SelectItem value="all" className="hover:bg-white/20 text-white transition-colors duration-200">
                      All Status
                    </SelectItem>
                    <SelectItem value="draft" className="hover:bg-white/20 text-white transition-colors duration-200">
                      Draft
                    </SelectItem>
                    <SelectItem value="pending" className="hover:bg-white/20 text-white transition-colors duration-200">
                      Pending
                    </SelectItem>
                    <SelectItem value="sent" className="hover:bg-white/20 text-white transition-colors duration-200">
                      Sent
                    </SelectItem>
                    <SelectItem
                      value="completed"
                      className="hover:bg-white/20 text-white transition-colors duration-200"
                    >
                      Completed
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-gray-100/90 to-gray-200/90 backdrop-blur-sm p-1 rounded-2xl shadow-inner border border-gray-200/50">
                <TabsTrigger
                  value="documents"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:shadow-blue-200/30 transition-all duration-300 rounded-xl font-bold data-[state=active]:ring-2 data-[state=active]:ring-blue-200/50"
                >
                  All Documents
                </TabsTrigger>
                <TabsTrigger
                  value="pending"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:shadow-orange-200/30 transition-all duration-300 rounded-xl font-bold data-[state=active]:ring-2 data-[state=active]:ring-orange-200/50"
                >
                  Pending
                </TabsTrigger>
                <TabsTrigger
                  value="completed"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:shadow-green-200/30 transition-all duration-300 rounded-xl font-bold data-[state=active]:ring-2 data-[state=active]:ring-green-200/50"
                >
                  Completed
                </TabsTrigger>
              </TabsList>

              <TabsContent value="documents" className="space-y-4 mt-8">
                {loading ? (
                  <div className="text-center py-16">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">Loading documents...</p>
                  </div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="text-center py-16 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-blue-50/30 rounded-3xl"></div>
                    <div className="relative z-10">
                      <div className="w-24 h-24 bg-gradient-to-br from-gray-200 via-blue-200 to-indigo-300 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-gray-300/30 ring-4 ring-white/50">
                        <FileText className="w-12 h-12 text-gray-500 drop-shadow-lg" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">No documents found</h3>
                      <p className="text-gray-600 max-w-md mx-auto text-lg">
                        Try adjusting your search or filters, or upload a new document to get started.
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredDocuments.map((doc) => (
                    <div
                      key={doc._id}
                      className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-8 border-2 border-gray-100 rounded-2xl hover:border-blue-300 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-500 space-y-4 sm:space-y-0 shadow-lg hover:shadow-2xl hover:shadow-blue-200/20 transform hover:-translate-y-1 ring-1 ring-gray-200/50 hover:ring-blue-200/50 relative overflow-hidden"
                    >
                      {/* Decorative corner accent */}
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-blue-100/50 to-transparent rounded-bl-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                      <div className="flex items-center space-x-6 flex-1">
                        <div className="w-16 h-16 bg-gradient-to-br from-red-500 via-pink-600 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-2xl shadow-red-200/30 group-hover:shadow-3xl group-hover:scale-110 transition-all duration-300 ring-2 ring-white/30">
                          <FileText className="w-8 h-8 text-white drop-shadow-lg" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-gray-900 truncate text-xl group-hover:text-blue-700 transition-colors duration-300 mb-2">
                            {doc.name}
                          </h3>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 text-sm text-gray-500 space-y-1 sm:space-y-0">
                            <span className="flex items-center font-medium">
                              <Calendar className="w-4 h-4 mr-2" />
                              Created: {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "Unknown"}
                            </span>
                            <span className="hidden sm:inline text-gray-300">•</span>
                            <span className="flex items-center font-medium">
                              <User className="w-4 h-4 mr-2" />
                              {doc.signers ? doc.signers.length : 0} signer(s)
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                        <Badge className={`${getStatusColor(doc.status)} px-4 py-2 text-sm font-bold rounded-xl`}>
                          {doc.status.replace("-", " ").toUpperCase()}
                        </Badge>
                        <div className="flex space-x-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedDocument(doc)}
                            className="border-2 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 ring-1 ring-blue-100/50 font-semibold"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          {doc.status === "completed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(doc._id)}
                              className="border-2 hover:bg-green-50 hover:border-green-300 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 ring-1 ring-green-100/50 font-semibold"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          )}
                          <Button
  variant="outline"
  size="icon"
  onClick={() => handleDeleteDocument(doc._id)}
  className="
    bg-red-50
    hover:bg-red-100
    text-red-600
    hover:text-red-700
    transition-all duration-300
    shadow-md hover:shadow-lg
    hover:scale-105 active:scale-95
    ring-1 ring-red-100/50
    rounded-full
    p-2
  "
>
  <Trash2 className="w-4 h-4" />
</Button>

                        </div>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="pending">
                <div className="space-y-4 mt-8">
                  {filteredDocuments.filter((doc) => doc.status === "pending" || doc.status === "sent").length === 0 ? (
                    <div className="text-center py-16 relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-yellow-50/30 rounded-3xl"></div>
                      <div className="relative z-10">
                        <div className="w-24 h-24 bg-gradient-to-br from-yellow-200 via-orange-300 to-red-300 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-orange-300/30 ring-4 ring-white/50">
                          <Clock className="w-12 h-12 text-orange-600 drop-shadow-lg" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">No pending documents</h3>
                        <p className="text-gray-600 text-lg">All your documents have been signed!</p>
                      </div>
                    </div>
                  ) : (
                    filteredDocuments
                      .filter((doc) => doc.status === "pending" || doc.status === "sent")
                      .map((doc) => (
                        <div
                          key={doc._id}
                          className="flex items-center justify-between p-8 border-2 border-orange-200 rounded-2xl hover:border-orange-300 hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-yellow-50/50 transition-all duration-500 shadow-lg hover:shadow-2xl hover:shadow-orange-200/20 transform hover:-translate-y-1"
                        >
                          <div className="flex items-center space-x-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 via-orange-600 to-red-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-200/30 ring-2 ring-white/30">
                              <Clock className="w-8 h-8 text-white drop-shadow-lg" />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 text-xl mb-1">{doc.name}</h3>
                              <p className="text-sm text-gray-600 font-medium">Waiting for signatures</p>
                            </div>
                          </div>
                          <div className="flex space-x-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemindSigners(doc._id)}
                              className="border-2 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 font-semibold"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Remind
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedDocument(doc)}
                              className="border-2 hover:bg-green-50 hover:border-green-300 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 font-semibold"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="completed">
                <div className="space-y-4 mt-8">
                  {filteredDocuments.filter((doc) => doc.status === "completed").length === 0 ? (
                    <div className="text-center py-16 relative">
                      <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-200 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-200/30 ring-4 ring-white/50">
                        <PenTool className="w-12 h-12 text-emerald-600 drop-shadow-lg" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">No completed documents</h3>
                      <p className="text-gray-600 text-lg">Completed documents will appear here.</p>
                    </div>
                  ) : (
                    filteredDocuments
                      .filter((doc) => doc.status === "completed")
                      .map((doc) => (
                        <div
                          key={doc._id}
                          className="flex items-center justify-between p-6 border-2 border-green-100 rounded-xl hover:border-green-200 hover:bg-gradient-to-r hover:from-green-50/50 hover:to-emerald-50/50 transition-all duration-300 shadow-sm hover:shadow-lg"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                              <PenTool className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 text-lg">{doc.name}</h3>
                              <p className="text-sm text-gray-500">Fully signed and completed</p>
                            </div>
                          </div>
                          <div className="flex space-x-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(doc._id)}
                              className="border-2 hover:bg-green-50 hover:border-green-300 transition-all duration-300"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedDocument(doc)}
                              className="border-2 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
