"use client"

import { useState, useEffect, useCallback } from 'react' // Import hooks
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from "chart.js"
import { Bar, Line, Doughnut } from "react-chartjs-2"

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
)

// Define the default/initial state structure for the data
const initialChartData = {
  monthlyReturns: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  monthlyQCRate: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  agentPerformance: [1, 1, 1] // Placeholder for Doughnut to avoid division by zero
}

export default function TrendsPage() {
  // 1. Define State
  const [chartData, setChartData] = useState(initialChartData)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  // 2. Data Fetching Function (wrapped in useCallback for best practice)
  const fetchTrendData = useCallback(async () => {
    setIsLoading(true)
    setError("")
    try {
      // NOTE: Replace '/api/trends' with your actual API endpoint URL
      const response = await fetch(`${API_BASE_URL}/api/overview/admin/trends`) 
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Update state with fetched data
      setChartData({
        monthlyReturns: data.monthlyReturns || initialChartData.monthlyReturns,
        monthlyQCRate: data.monthlyQCRate || initialChartData.monthlyQCRate,
        agentPerformance: data.agentPerformance || initialChartData.agentPerformance,
      })
    } catch (err) {
      console.error("Failed to fetch trend data:", err);
      setError("err")
    } finally {
      setIsLoading(false)
    }
  }, []) // Empty dependency array means this function is created once

  // 3. useEffect Hook: Executes when the component mounts
  useEffect(() => {
    fetchTrendData()
  }, [fetchTrendData]) // Dependency array includes the fetch function


  // 4. Loading/Error State Rendering
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 p-8 flex justify-center items-center">
        <p className="text-xl text-white">Loading analytics data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 p-8">
        <h1 className="text-3xl font-bold text-red-500 mb-8">Error</h1>
        <p className="text-white">{error}</p>
        <button
          onClick={fetchTrendData}
          className="mt-4 bg-red-800 hover:bg-red-700 text-white px-4 py-2 rounded-xl border border-red-700 transition"
        >
          Try Again
        </button>
      </div>
    )
  }

  // --- Actual Component Render (using chartData from state) ---
  return (
    <div className="min-h-screen bg-gray-950 p-8">
      {/* ... Back Button and Header ... */}
      <button
        onClick={() => window.location.href = "/admin"}
        className="mb-6 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-xl border border-gray-700 transition"
      >
        ← Back to Admin Dashboard
      </button>
      <h1 className="text-3xl font-bold text-white mb-8">Admin Trends & Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Bar Chart: Uses chartData.monthlyReturns */}
        <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800">
          <h2 className="text-white text-lg mb-3">Returns Processed (Monthly)</h2>
          <div className="h-64">
            <Bar
              data={{
                labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "July", "Aug", "Sep", "Oct", "Nov", "Dec"],
                datasets: [
                  {
                    label: "Returns",
                    data: chartData.monthlyReturns, // <-- Real Data
                    backgroundColor: "rgba(59,130,246,0.6)"
                  }
                ]
              }}
              options={{ maintainAspectRatio: false }}
            />
          </div>
        </div>

        {/* Line Chart: Uses chartData.monthlyQCRate */}
        <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800">
          <h2 className="text-white text-lg mb-3">QC Approval Rate (%)</h2>
          <div className="h-64">
            <Line
              data={{
                labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "July", "Aug", "Sep", "Oct", "Nov", "Dec"],
                datasets: [
                  {
                    label: "QC Success Rate",
                    data: chartData.monthlyQCRate, // <-- Real Data
                    borderColor: "rgba(34,197,94,1)",
                    backgroundColor: "rgba(34,197,94,0.3)",
                    tension: 0.3
                  }
                ]
              }}
              options={{ maintainAspectRatio: false }}
            />
          </div>
        </div>

        {/* Doughnut Chart: Uses chartData.agentPerformance */}
        <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800 max-w-md mx-auto lg:col-span-2">
          <h2 className="text-white text-lg mb-3">Agent Performance</h2>
          <div className="h-60">
            <Doughnut
              data={{
                labels: ["Active", "Inactive"],
                datasets: [
                  {
                    data: chartData.agentPerformance, // <-- Real Data
                    backgroundColor: [
                      "rgba(59,130,246,0.7)",
                      "rgba(239,68,68,0.7)"
                    ],
                    borderColor: "rgba(255,255,255,0.12)",
                    borderWidth: 0
                  }
                ]
              }}
              options={{ maintainAspectRatio: false }}
            />
          </div>
        </div>

      </div>
    </div>
  )
}