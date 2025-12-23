import { BarChart3, Users, Warehouse, CheckCircle, Search, Plus, Edit2, Trash2, LogOut, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!
// The API endpoint URL
const API_URL = `${API_BASE_URL}/api/Agents` // Use the correct port

interface Agent {
  id: number
  name: string
  email: string
  status: "Active" | "Inactive"
  region: string
}

// Define the structure for the new agent form data
interface NewAgentData {
  name: string
  email: string
  phoneNumber: string // Use string for input to handle large numbers and non-numeric characters
  location: string
}

// ----------------------------------------------------------------------
// NEW COMPONENT: Modal Form for Adding Agents
// ----------------------------------------------------------------------

interface AddAgentModalProps {
  isOpen: boolean
  onClose: () => void
  onAgentAdded: () => void // Function to call after successful add
}

const AddAgentModal: React.FC<AddAgentModalProps> = ({ isOpen, onClose, onAgentAdded }) => {
  const [formData, setFormData] = useState<NewAgentData>({
    name: "",
    email: "",
    phoneNumber: "",
    location: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    // Basic validation
    if (!formData.name || !formData.phoneNumber) {
        setError("Name and Phone Number are required fields.")
        setIsSubmitting(false)
        return
    }

    try {
      const payload = {
        Name: formData.name,
        Email: formData.email,
        // Convert the string input to a number for the backend DTO
        PhoneNumber: parseInt(formData.phoneNumber), 
        Location: formData.location,
      }
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // The frontend sends the C# DTO structure (Name, Email, etc.)
        body: JSON.stringify(payload), 
      })

      if (!response.ok) {
        // Log or throw the detailed error from the backend if possible
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      // Success
      console.log("Agent added successfully!")
      onAgentAdded() // Close modal and potentially refresh data
      setFormData({ name: "", email: "", phoneNumber: "", location: "" }) // Reset form
      onClose()

    } catch (err: any) {
      console.error("Submission failed:", err)
      setError(err.message || "An unexpected error occurred during submission.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClass = "w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
  const labelClass = "block text-sm font-medium text-slate-700 mb-1"

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100">
          <X className="w-5 h-5 text-slate-500" />
        </button>
        
        {/* <h2 className="text-2xl font-bold text-slate-900 mb-6">Add New Agent</h2> */}
        
        {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <p className="font-bold">Error</p>
                <p className="text-sm">{error}</p>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label htmlFor="name" className={labelClass}>Agent Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={inputClass}
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="email" className={labelClass}>Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={inputClass}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="phoneNumber" className={labelClass}>Phone Number *</label>
            <input
              type="text" // Use text to prevent mobile formatting issues
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className={inputClass}
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="location" className={labelClass}>Location</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className={inputClass}
              disabled={isSubmitting}
            />
          </div>
          
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition duration-150 ${
                isSubmitting ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Create Agent"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminModule() {
const router = useRouter()
  const [activeTab, setActiveTab] = useState("staff")
  const [activeSubTab, setActiveSubTab] = useState("agents")
  const [searchQuery, setSearchQuery] = useState("")
const [isModalOpen, setIsModalOpen] = useState(false) // NEW STATE for modal
const handleAgentAdded = () => {
    // In a real application, you would put the logic to refresh your 
    // agentsData state by calling your API's GET endpoint here.
    console.log("Agent added, refresh data hook triggered.")
    // For now, we'll just close the modal.
}
  const agentsData: Agent[] = [
    { id: 1, name: "Arjun Mehta", email: "arjun.mehta@retrack.com", status: "Active", region: "Delhi NCR" },
    { id: 2, name: "Lakshmi Narayanan", email: "lakshmi.n@retrack.com", status: "Active", region: "Bengaluru" },
    { id: 3, name: "Anirban Das", email: "a.das@retrack.com", status: "Inactive", region: "Kolkata" },
    { id: 4, name: "Sneha Patel", email: "sneha.p@retrack.com", status: "Active", region: "Mumbai" },
    { id: 5, name: "Vikram Singh", email: "v.singh@retrack.com", status: "Active", region: "Nagpur" },
  ]

  const warehouseStaffData: Agent[] = [
    { id: 6, name: "Mohammed Irfan", email: "m.irfan@retrack.com", status: "Active", region: "Manesar Hub" },
    { id: 7, name: "Priya Menon", email: "p.menon@retrack.com", status: "Active", region: "Chennai Hub" },
    { id: 8, name: "Rajesh Gupta", email: "r.gupta@retrack.com", status: "Inactive", region: "Guwahati Hub" },
  ]

  const qcStaffData: Agent[] = [
    { id: 9, name: "Anjali Deshmukh", email: "a.deshmukh@retrack.com", status: "Active", region: "QC Pune" },
    { id: 10, name: "Hardeep Kaur", email: "h.kaur@retrack.com", status: "Active", region: "QC Chandigarh" },
  ]

  const getCurrentData = () => {
    switch (activeSubTab) {
      case "warehouse":
        return warehouseStaffData
      case "qc":
        return qcStaffData
      default:
        return agentsData
    }
  }

  const currentData = getCurrentData().filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleLogout = () => {
    window.location.href = "/"
  }
   const handleViewDashboard = () => {
    window.location.href = "/dashboard"
  }

  return (
    <div className="space-y-8">

      <AddAgentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAgentAdded={handleAgentAdded} 
    />

      {/* Logout Button */}
      <div className="flex justify-end">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      {/* Overview */}
      <div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Operational Overview</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Returns Processed",
              value: "2,847",
              subtitle: "Last 30 days",
              icon: BarChart3,
              bg: "bg-purple-50 dark:bg-purple-900/20",
              border: "border-purple-200 dark:border-purple-800"
            },
            {
              label: "Active Agents",
              value: "156",
              subtitle: "Across all roles",
              icon: Users,
              bg: "bg-blue-50 dark:bg-blue-900/20",
              border: "border-blue-200 dark:border-blue-800"
            },
            {
              label: "Warehouses Managed",
              value: "12",
              subtitle: "Regional hubs",
              icon: Warehouse,
              bg: "bg-emerald-50 dark:bg-emerald-900/20",
              border: "border-emerald-200 dark:border-emerald-800"
            },
            {
              label: "QC Success Rate",
              value: "94.2%",
              subtitle: "Approved vs Rejected",
              icon: CheckCircle,
              bg: "bg-cyan-50 dark:bg-cyan-900/20",
              border: "border-cyan-200 dark:border-cyan-800"
            }
          ].map((c, i) => (
            <div key={i} className={`${c.bg} ${c.border} border p-6 rounded-xl`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-600">{c.label}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{c.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{c.subtitle}</p>
                </div>

                <div className="p-3 rounded-lg bg-white dark:bg-slate-800 shadow">
                  <c.icon className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Management Section */}
      <div>
        <h3 className="text-xl font-bold mb-4">Management Dashboards</h3>

        {/* Main Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-800">
          {[
            { id: "staff", label: "Staff Management" },
            { id: "warehouse", label: "Warehouse Locations" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                if (tab.id === "warehouse") { setActiveSubTab("warehouse-location") }
                else { setActiveSubTab("agents") }
              }}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
                activeTab === tab.id ? "bg-blue-600 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Staff Sub-tabs */}
        {activeTab === "staff" && (
          <div className="flex gap-2 mb-6">
            {[
              { id: "agents", label: "Pickup Agents" },
              { id: "warehouse", label: "Warehouse Staff" },
              { id: "qc", label: "QC Staff" }
            ].map((sub) => (
              <button
                key={sub.id}
                onClick={() => setActiveSubTab(sub.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  activeSubTab === sub.id
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}

        {/* Search + Add */}
        {activeTab === "staff" && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">

  {/* Search Bar */}
  <div className="flex-1 relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
    <input
      type="text"
      placeholder="Search by name or email..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-full shadow-sm"
    />
  </div>

  {/* Add New Agent */}
  <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full">
    {/* <Plus className="w-5 h-5" /> */}
    Add New Agent
  </button>

  {/* VIEW DASHBOARD BUTTON */}
  <button
    onClick={() => router.push("/dashboard")}
    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full"
  >
    View Dashboard
  </button>
</div>

        )}

        {/* Table */}
        {activeTab === "staff" && (
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {["ID", "Name", "Email", "Status", "Region", "Actions"].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-sm font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentData.map((row) => (
                  <tr key={row.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium">#{row.id}</td>
                    <td className="px-6 py-4 text-sm">{row.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{row.email}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        row.status === "Active"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-700"
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{row.region}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-2 rounded-lg hover:bg-blue-100">
                          <Edit2 className="w-4 h-4 text-blue-600" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-red-100">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {currentData.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                No staff members found
              </div>
            )}
          </div>
        )}

        {/* Warehouse Locations Placeholder */}
        {activeTab === "warehouse" && (
          <div className="p-8 text-center border rounded-xl">
            <Warehouse className="w-12 h-12 mx-auto mb-4 text-slate-500" />
            <p className="text-slate-600">Warehouse location management coming soon</p>
          </div>
        )}
      </div>
    </div>
  )
}
