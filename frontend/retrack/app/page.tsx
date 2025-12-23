"use client"

import { useState } from "react"
import LoginModal from "./components/LoginModal"
import { useRouter } from "next/navigation"
import Image from "next/image"
// Icons
import { FaUserShield, FaUserTie, FaWarehouse, FaCheckCircle } from "react-icons/fa"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!

export default function HomePage() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const router = useRouter()

  const openLogin = (role: string) => {
    setSelectedRole(role)
    setModalOpen(true)
  }

  const handleLogin = async ({
    username,
    password
  }: {
    username: string
    password: string
  }) => {
    if (!selectedRole) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: username,
          password: password,
          role: selectedRole
        })
      })

      if (!response.ok) {
        alert("Invalid credentials")
        return
      }

      const data = await response.json()

      // Store JWT + role
      localStorage.setItem("jwt", data.token)
      localStorage.setItem("role", data.user.role)

      const userDetails = data.user || {}
      localStorage.setItem("userId", userDetails.id)
      localStorage.setItem("username", userDetails.name)

      // ✅ Redirect based on ACTUAL ROLE
      switch (data.user.role) {
        case "Admin":
          router.push("/admin")
          break

        case "PickupAgent":
          router.push("/agent")
          break

        case "WarehouseStaff":
          router.push("/warehouse")
          break

        case "QCStaff":
          router.push("/qc")
          break

        default:
          alert("Unknown role")
      }
    } catch (err) {
      console.error("Login error:", err)
      alert("Server not reachable!")
    }

    setModalOpen(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <Image
            src="/logo_white.png"
            alt="ReTrack Logo"
            width={100}
            height={100}
            className="object-contain"
            priority
          />
        </div>
        <h1 className="text-white text-4xl font-bold">ReTrack</h1>
        <p className="text-gray-400 mt-2">Where returns create value</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <button
          onClick={() => openLogin("Admin")}
          className="bg-gray-800 hover:bg-gray-700 text-white px-10 py-6 rounded-2xl shadow-lg text-xl font-semibold transition flex flex-col items-center gap-2"
        >
          <FaUserShield size={32} />
          <span>Admin</span>
        </button>

        <button
          onClick={() => openLogin("PickupAgent")}
          className="bg-gray-800 hover:bg-gray-700 text-white px-10 py-6 rounded-2xl shadow-lg text-xl font-semibold transition flex flex-col items-center gap-2"
        >
          <FaUserTie size={32} />
          <span>Agent</span>
        </button>

        <button
          onClick={() => openLogin("WarehouseStaff")}
          className="bg-gray-800 hover:bg-gray-700 text-white px-10 py-6 rounded-2xl shadow-lg text-xl font-semibold transition flex flex-col items-center gap-2"
        >
          <FaWarehouse size={32} />
          <span>Warehouse</span>
        </button>

        <button
          onClick={() => openLogin("QCStaff")}
          className="bg-gray-800 hover:bg-gray-700 text-white px-10 py-6 rounded-2xl shadow-lg text-xl font-semibold transition flex flex-col items-center gap-2"
        >
          <FaCheckCircle size={32} />
          <span>QC</span>
        </button>
      </div>

      <div className="mt-10">
        New User?{" "}
        <a href="/select-role" className="text-blue-400 underline">
          Register Here
        </a>
      </div>

      <LoginModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleLogin}
        role={selectedRole}
      />
    </div>
  )
}
