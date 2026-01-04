"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!

type Pickup = {
  returnId: string
  customerName: string
  customerPhone: string
  location: string
  pickupTime: string | null
  pickupStatus: string
  bagCode: string | null
}

export default function PickupsPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [pickups, setPickups] = useState<Pickup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const role = localStorage.getItem("role")
    if (role === "PickupAgent") {
      setAuthorized(true)
    } else {
      router.replace("/")
    }
  }, [])

  useEffect(() => {
    if (!authorized) return
    const agentId = localStorage.getItem("userId");

    setLoading(true)
    fetch(`${API_BASE_URL}/api/agent/${agentId}/pickups`)
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok")
        return res.json()
      })
      .then((data: Pickup[]) => setPickups(data))
      .catch((err) => {
        console.error("Failed to load pickups:", err)
        // optionally show toast or fallback UI
      })
      .finally(() => setLoading(false))
  }, [authorized])

  if (!authorized) return null

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <button
        onClick={() => router.push("/agent")}
        className="mb-6 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-xl border border-gray-700 transition"
      >
        ← Back to Agent Dashboard
      </button>

      <h1 className="text-3xl font-bold text-white mb-6">Today's Pickups</h1>

      <div className="overflow-x-auto bg-gray-900 p-6 rounded-2xl border border-gray-800">
        {loading ? (
          <div className="text-gray-400">Loading...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700">
                <th className="py-3">Return ID</th>
                <th className="py-3">Customer</th>
                <th className="py-3">Location</th>
                <th className="py-3">Time</th>
                <th className="py-3">Status</th>
                <th className="py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pickups.map((p) => (
                <tr key={p.returnId} className="border-b border-gray-800 text-white">
                  <td className="py-3">{p.returnId}</td>
                  <td>{p.customerName}</td>
                  <td>{p.location}</td>
                  <td>{p.pickupTime ? new Date(p.pickupTime).toLocaleTimeString() : "-"}</td>
                  <td>
                    <span className="px-3 py-1 rounded-full text-sm bg-blue-500/20 text-blue-400 border border-blue-500/40">
                      {p.pickupStatus}
                    </span>
                  </td>
                  <td className="py-3 flex gap-3">
                    <button className="text-blue-400 hover:text-blue-300">Call</button>
                    <button className="text-green-400 hover:text-green-300">Navigate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
