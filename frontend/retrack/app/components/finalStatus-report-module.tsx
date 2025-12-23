"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  DownloadCloud,
  MoreVertical,
  X,
  Filter,
  LogOut,
} from "lucide-react"

interface Product {
  id: string
  productName: string
  type: string
  status: "Approved" | "Rejected" | "Pending" | "Needs Rework"
  inspectionDate: string
  inspector: string
}

interface DecisionHistoryItem {
  id: string
  productName: string
  previousStatus: string
  newStatus: string
  timestamp: string
  decisionBy: string
  notes: string
}

export default function QualityControlStaffModule() {
  const [activeTab, setActiveTab] = useState<"products" | "history">("products")
  const [selectedStatus, setSelectedStatus] = useState("All")
  const [selectedType, setSelectedType] = useState("All")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [newStatus, setNewStatus] = useState("")

  // Mock data
  const productsData: Product[] = [
    {
      id: "PROD-001",
      productName: "Smartwatch Ultra",
      type: "Electronics",
      status: "Approved",
      inspectionDate: "Oct 26, 2023",
      inspector: "Alice Johnson",
    },
    {
      id: "PROD-002",
      productName: "Wireless Earbuds X",
      type: "Electronics",
      status: "Rejected",
      inspectionDate: "Oct 25, 2023",
      inspector: "Bob Williams",
    },
    {
      id: "PROD-003",
      productName: "Ergonomic Office Chair",
      type: "Furniture",
      status: "Needs Rework",
      inspectionDate: "Oct 24, 2023",
      inspector: "Charlie Brown",
    },
    {
      id: "PROD-004",
      productName: "Organic Cotton T-Shirt",
      type: "Apparel",
      status: "Approved",
      inspectionDate: "Oct 24, 2023",
      inspector: "Diana Miller",
    },
    {
      id: "PROD-005",
      productName: "Stainless Steel Water Bottle",
      type: "Kitchenware",
      status: "Pending",
      inspectionDate: "Oct 23, 2023",
      inspector: "Eve Davis",
    },
  ]

  const decisionHistoryData: DecisionHistoryItem[] = [
    {
      id: "DH-001",
      productName: "Smartwatch Ultra",
      previousStatus: "Pending",
      newStatus: "Approved",
      timestamp: "2023-10-26 14:30",
      decisionBy: "Alice Johnson",
      notes: "All components functioning properly.",
    },
  ]

  // Filtering
  const filteredProducts = productsData.filter((product) => {
    const statusMatch = selectedStatus === "All" || product.status === selectedStatus
    const typeMatch = selectedType === "All" || product.type === selectedType
    return statusMatch && typeMatch
  })

  const productTypes = ["All", ...new Set(productsData.map((p) => p.type))]
  const statuses = ["All", "Approved", "Rejected", "Pending", "Needs Rework"]

  // Status badge colors
  const badge = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-700"
      case "Rejected":
        return "bg-red-100 text-red-700"
      case "Pending":
        return "bg-gray-100 text-gray-700"
      case "Needs Rework":
        return "bg-orange-100 text-orange-700"
      default:
        return "bg-slate-100 text-slate-700"
    }
  }

  const handleStatusUpdate = () => {
    setShowStatusModal(false)
    setNewStatus("")
    setSelectedProduct(null)
  }

  const handleLogout = () => {
    window.location.href = "/"
  }

  return (
    <div className="space-y-8">
      {/* Logout Button */}
      <div className="flex justify-end">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-slate-900">Final Status & Reporting
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Inspected", value: "1,245" },
          { label: "Approved Products", value: "980" },
          { label: "Rejected Products", value: "120" },
          { label: "Needs Rework", value: "145" },
        ].map((s, i) => (
          <div
            key={i}
            className="p-6 bg-white rounded-xl shadow border border-slate-200"
          >
            <p className="text-sm text-slate-600">{s.label}</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="p-6 rounded-xl shadow bg-white border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-slate-700" />
          <h3 className="text-lg font-semibold text-slate-900">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status */}
          <div>
            <label className="block mb-2 font-medium text-slate-700">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="block mb-2 font-medium text-slate-700">Product Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              {productTypes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block mb-2 font-medium text-slate-700">Date Range</label>
            <input
              type="text"
              placeholder="Pick a date"
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-3 mt-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow">Apply Filters</button>
          <button
            onClick={() => {
              setSelectedStatus("All")
              setSelectedType("All")
            }}
            className="px-4 py-2 text-slate-500 border rounded-lg"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b pb-2">
        <button
          onClick={() => setActiveTab("products")}
          className={`px-4 py-2 font-medium ${
            activeTab === "products" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-600"
          }`}
        >
          Inspected Products
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 font-medium ${
            activeTab === "history" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-600"
          }`}
        >
          QC Decision History
        </button>

        <button
          onClick={() => setShowExportModal(true)}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow"
        >
          <DownloadCloud className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Products Table */}
      {activeTab === "products" && (
        <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-left text-slate-900 font-semibold">Product ID</th>
                <th className="p-4 text-left text-slate-900 font-semibold">Product Name</th>
                <th className="p-4 text-left text-slate-900 font-semibold">Type</th>
                <th className="p-4 text-left text-slate-900 font-semibold">Status</th>
                <th className="p-4 text-left text-slate-900 font-semibold">Date</th>
                <th className="p-4 text-left text-slate-900 font-semibold">Inspector</th>
                <th className="p-4 text-center text-slate-900 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p, idx) => (
                <tr
                  key={p.id}
                  className="border-b hover:bg-slate-50 transition"
                >
                  <td className="p-4 font-medium text-slate-900">{p.id}</td>
                  <td className="p-4 text-slate-900">{p.productName}</td>
                  <td className="p-4 text-slate-900">{p.type}</td>

                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge(p.status)}`}>
                      {p.status}
                    </span>
                  </td>

                  <td className="p-4 text-slate-900">{p.inspectionDate}</td>
                  <td className="p-4 text-slate-900">{p.inspector}</td>

                  <td className="p-4 text-center">
                    <button
                      onClick={() => {
                        setSelectedProduct(p)
                        setShowStatusModal(true)
                      }}
                      className="p-2 hover:bg-slate-200 rounded-lg"
                    >
                      <MoreVertical className="w-4 h-4 text-slate-900" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Decision History Table */}
      {activeTab === "history" && (
        <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-left  text-slate-900 font-semibold">Product</th>
                <th className="p-4 text-left  text-slate-900 font-semibold">Prev Status</th>
                <th className="p-4 text-left  text-slate-900 font-semibold">New Status</th>
                <th className="p-4 text-left  text-slate-900 font-semibold">Time</th>
                <th className="p-4 text-left  text-slate-900 font-semibold">Decision By</th>
                <th className="p-4 text-left  text-slate-900 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody>
              {decisionHistoryData.map((d) => (
                <tr key={d.id} className="border-b hover:bg-slate-50">
                  <td className="p-4 text-slate-900">{d.productName}</td>
                  <td className="p-4 text-slate-900">{d.previousStatus}</td>
                  <td className="p-4 text-slate-900">{d.newStatus}</td>
                  <td className="p-4 text-slate-900">{d.timestamp}</td>
                  <td className="p-4 text-slate-900">{d.decisionBy}</td>
                  <td className="p-4 text-slate-900">{d.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Status Modal */}
      <AnimatePresence>
        {showStatusModal && selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center p-4"
          >
            <div className="bg-white p-6 rounded-xl shadow max-w-md w-full">
              <div className="flex justify-between mb-4">
                <h3 className="text-xl font-bold">Update Status</h3>
                <button onClick={() => setShowStatusModal(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="mb-4">Product: <b>{selectedProduct.productName}</b></p>

              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg mb-6"
              >
                <option value="">Select new status</option>
                <option>Approved</option>
                <option>Rejected</option>
                <option>Pending</option>
                <option>Needs Rework</option>
              </select>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>

                <button
                  disabled={!newStatus}
                  onClick={handleStatusUpdate}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                >
                  Update
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center p-4"
          >
            <div className="bg-white p-6 rounded-xl shadow max-w-md w-full">
              <div className="flex justify-between mb-4 text-slate-900">
                <h3 className="text-xl font-bold">Export Report</h3>
                <button onClick={() => setShowExportModal(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="mb-4 text-slate-900">Choose format:</p>

              {["Excel", "PDF", "Plain Text"].map((f) => (
                <button
                  key={f}
                  className="w-full p-3 mb-2 text-left flex items-center gap-2 bg-blue-600 hover:bg-green-600 text-white font-semibold rounded-lg shadow"
                >{/*className="ml-auto flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow"*/}
                  Export as {f}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
