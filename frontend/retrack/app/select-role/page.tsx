"use client"

import { useRouter } from "next/navigation"

export default function SelectRolePage() {
  const router = useRouter()

  const roles = [
    { label: "Pickup Agent", value: "PickupAgent" },
    { label: "Warehouse Staff", value: "WarehouseStaff" },
    { label: "Quality Checking Staff", value: "QCStaff" },
    { label: "Admin", value: "Admin" },
  ]

  const selectRole = (value: string) => {
    router.push(`/register?role=${value}`)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
        {/* --- BACK BUTTON (TOP-LEFT) --- */}
      <button
        onClick={() => {
    router.push('/')
  }}
        // Tailwind classes for top-left positioning and styling
        className="absolute top-6 left-6 bg-gray-800 hover:bg-gray-700 p-3 rounded-xl text-md transition duration-150 flex items-center"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        Back
      </button>
      {/* ------------------------------- */}
      <h1 className="text-3xl font-bold mb-8">Select Your Role</h1>

      <div className="grid grid-cols-1 gap-4 w-72">
        {roles.map((r) => (
          <button
            key={r.value}
            onClick={() => selectRole(r.value)}
            className="bg-gray-800 hover:bg-gray-700 py-4 rounded-xl text-lg"
          >
            {r.label}
          </button>
        ))}
      </div>

      
    </div>
  )
}
