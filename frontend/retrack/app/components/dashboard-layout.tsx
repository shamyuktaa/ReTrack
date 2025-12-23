"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import React from "react" // Import React to use ReactNode

// Define the interface for the component props
interface DashboardLayoutProps {
  role: string // We know 'role' is a string based on its usage
  children: React.ReactNode // 'children' must be a ReactNode (any valid JSX element)
}

const MENU_ITEMS = [
  { icon: "👤", label: "Admin", path: "/admin" },
  { icon: "📊", label: "Dashboard", path: "/dashboard" },
  { icon: "🎯", label: "Pickup Agent", path: "/agent" },
  { icon: "🏢", label: "Warehouse Staff", path: "/warehouse" },
  { icon: "✓", label: "QC Staff", path: "/qc" },
]

// Apply the interface to the component function
export default function DashboardLayout({ role, children }: DashboardLayoutProps) {
  const router = useRouter()
  // Ensure the role property is one of the possible menu labels for useState
  const initialActiveMenu = role === "Pickup Agent" ? "Pickup Agent" : role
  const [activeMenu, setActiveMenu] = useState(initialActiveMenu)

  const handleLogout = () => {
    // Implement actual logout logic (clearing auth tokens, etc.)
    router.push("/")
  }

  return (
    <div className="flex h-screen bg-gray-50">
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-gray-800">{role}</h2>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <span className="text-2xl">🔔</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-white hover:bg-gray-700">
              👤
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8">{children}</div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 px-8 py-4 text-center text-gray-600 text-sm">
          © 2025 ReTrack Management. All rights reserved.
        </div>
      </div>
    </div>
  )
}

export {}