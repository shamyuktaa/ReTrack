"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import AdminDashboard from "@/app/components/admin-dashboard"
import PickupAgentModule from "@/app/components/pickup-agent-module"
import PendingRequests from "../components/pending-requests"
import { BarChart3, Users, Warehouse, CheckCircle, Search, Plus, Edit2, Trash2, LogOut } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!


export default function AdminPage() {
  const [activeView, setActiveView] = useState<
    "dashboard" | "pickupAgents" | "warehouseStaff" | "qcStaff" | "requests"
  >("dashboard")

  const [roleLoaded, setRoleLoaded] = useState(false)    // prevents early redirect
  const router = useRouter()
  const [summary, setSummary] = useState({ returns_30: 0, agents: 0, warehouses: 0, QcSuccessRate: 0 });

  // REAL FIX — delay auth check
  useEffect(() => {
    const timer = setTimeout(() => {
      const role = localStorage.getItem("role")
      if (role !== "Admin") {
        router.replace("/")
      } else {
        setRoleLoaded(true);
        loadOverview();
      }
    }, 150) // delay fixes hydration timing issues

    return () => clearTimeout(timer)
  }, [])

  if (!roleLoaded) return null  // prevents redirect before role loads

  const handleLogout = () => {
    localStorage.removeItem("role")
    router.replace("/")
  }

  // SET OPERATIONAL OVERVIEW
  async function loadOverview(){
    try{
      const res = await fetch(`${API_BASE_URL}/api/overview/admin/summary`);
      if (!res.ok) {
        throw new Error("Failed to load summary")
      }
      const data = await res.json();
      setSummary({
        returns_30: Number(data.total_returns ?? 0),
        agents: Number(data.active_agents ?? 0),
        warehouses: Number(data.warehouses ?? 0),
        QcSuccessRate: Number(data.qCsuccessRate ?? 0)
      })

    }
    catch(error){
      console.error(error);
    }
  }
  return (
    <div className="min-h-screen bg-gray-950">

      {/* HEADER */}
      <header className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-800 shadow-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">

          <div className="flex items-center justify-between">

            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div>
                <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
                <p className="text-sm text-gray-500">System Management</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              

              <button
  onClick={() => router.push("/admin/profile")}
  className="w-15 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all"
>
  Admin
</button>


              
              <button
                onClick={() => router.push("/admin/trends")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg transition"
              >
                View Trends
              </button>
              <div className="h-6 w-px bg-gray-700 mx-2"></div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">

        {/* Stats Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
            <span className="w-1 h-8 bg-blue-500 rounded-full mr-4"></span>
            Operational Overview
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            <div className="group bg-gray-900/50 border border-gray-800 rounded-2xl p-6 hover:border-blue-500/50 transition-all hover:scale-105">
              <h3 className="flex items-center justify-between text-gray-400 text-sm mb-2">Total Returns Processed <BarChart3></BarChart3></h3>
              <p className="text-4xl font-bold text-white">{summary.returns_30}</p>
              <p className="text-gray-600 text-sm">Last 30 days</p>
            </div>

            <div className="group bg-gray-900/50 border border-gray-800 rounded-2xl p-6 hover:border-blue-500/50 transition-all hover:scale-105">
              <h3 className="flex items-center justify-between text-gray-400 text-sm mb-2">Active Agents <Users></Users></h3>
              <p className="text-4xl font-bold text-blue-400">{summary.agents}</p>
              <p className="text-gray-600 text-sm">Across all roles</p>
            </div>

            <div className="group bg-gray-900/50 border border-gray-800 rounded-2xl p-6 hover:border-blue-500/50 transition-all hover:scale-105">
              <h3 className="flex items-center justify-between text-gray-400 text-sm mb-2">Warehouses Managed <Warehouse></Warehouse></h3>
              <p className="text-4xl font-bold text-blue-400">{summary.warehouses}</p>
              <p className="text-gray-600 text-sm">Regional hubs</p>
            </div>

            <div className="group bg-gray-900/50 border border-gray-800 rounded-2xl p-6 hover:border-blue-500/50 transition-all hover:scale-105">
              <h3 className="flex items-center justify-between text-gray-400 text-sm mb-2">QC Success Rate <CheckCircle></CheckCircle></h3>
              <p className="text-4xl font-bold text-gray-400">{summary.QcSuccessRate}%</p>
              <p className="text-gray-600 text-sm">Approved vs Rejected</p>
            </div>

          </div>
        </div>


        {/* VIEW SWITCHING */}
        <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
            <span className="w-1 h-8 bg-blue-500 rounded-full mr-4"></span>
            Management Dashboards
          </h2>

        <div className="mb-8 flex flex-wrap gap-4">
  <button
    onClick={() => setActiveView("pickupAgents")}
    className={`px-6 py-3 rounded-xl font-medium ${
      activeView === "pickupAgents"
        ? "bg-blue-500 text-white"
        : "bg-gray-800 text-gray-400 hover:bg-gray-700"
    }`}
  >
    Pickup Agents
  </button>

  <button
    onClick={() => setActiveView("warehouseStaff")}
    className={`px-6 py-3 rounded-xl font-medium ${
      activeView === "warehouseStaff"
        ? "bg-blue-500 text-white"
        : "bg-gray-800 text-gray-400 hover:bg-gray-700"
    }`}
  >
    Warehouse Staff
  </button>

  <button
    onClick={() => setActiveView("qcStaff")}
    className={`px-6 py-3 rounded-xl font-medium ${
      activeView === "qcStaff"
        ? "bg-blue-500 text-white"
        : "bg-gray-800 text-gray-400 hover:bg-gray-700"
    }`}
  >
    QC Staff
  </button>

  {/* NEW Requests tab */}
  <button
    onClick={() => setActiveView("requests")}
    className={`px-6 py-3 rounded-xl font-medium ${
      activeView === "requests"
        ? "bg-yellow-500 text-black"
        : "bg-gray-800 text-gray-400 hover:bg-gray-700"
    } ml-auto`}
  >
    Requests
  </button>
</div>

        {/* PAGE CONTENT */}
        {activeView === "pickupAgents" && <PickupAgentModule />}
        {activeView === "warehouseStaff" && <AdminDashboard staffType="warehouse" />}
        {activeView === "qcStaff" && <AdminDashboard staffType="qc" />}
        {activeView === "requests" && <PendingRequests />}

      </main>
    </div>
  )
}
