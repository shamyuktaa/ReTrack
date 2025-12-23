"use client";

import { useEffect, useState } from "react";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  shift?: string;
}

interface AdminDashboardProps {
  staffType: "warehouse" | "qc";
}

export default function AdminDashboard({ staffType }: AdminDashboardProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  const title = staffType === "warehouse" ? "Warehouse Staff" : "QC Staff";
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [newShift, setNewShift] = useState("");

  const openEditModal = (user: User) => {
  setSelectedUser(user);
  setNewStatus(user.status);
  setNewShift(user.shift ?? "");
};
const closeModal = () => {
  setSelectedUser(null);
};

  // =========================================================
  // Fetch Real Database Users From Backend
  // =========================================================
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/users`); 
        const data = await res.json();

        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  // =========================================================
  // FILTER BASED ON ROLE + STATUS
  // =========================================================
  const filteredUsers = users
    .filter((u) => {
      if (staffType === "warehouse") {
        return (
          u.role === "WarehouseStaff" &&
          (u.status === "Approved" || u.status === "Active" || u.status === "Inactive")
        );
      }
      if (staffType === "qc") {
        return (
          u.role === "QCStaff" &&
          (u.status === "Approved" || u.status === "Active" || u.status === "Inactive")
        );
      }
      return false;
    })
    .filter((u) =>
      `${u.name} ${u.email}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const saveStatusUpdate = async () => {
  if (!selectedUser) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/users/${selectedUser.id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: newStatus,
        shift: newShift || null,
        warehouseId: 1
      }),
    });

    const result = await res.json();
    console.log("Updated:", result);

    // Update UI instantly
    setUsers(prev =>
      prev.map(u =>
        u.id === selectedUser.id
          ? { ...u, status: newStatus, shift: newShift }
          : u
      )
    );

    closeModal();
  } catch (error) {
    console.error("Update error:", error);
  }
};

    const confirmDelete = async () => {
  if (!deleteUser) return;

  try {
    const res = await fetch(`https://localhost:7147/api/users/${deleteUser.id}`, {
      method: "DELETE",
    });

    const result = await res.json();
    console.log("Deleted:", result);

    // Remove from UI
    setUsers(prev => prev.filter(u => u.id !== deleteUser.id));

    setDeleteUser(null); 
  } catch (error) {
    console.error("Delete error:", error);
  }
};


  return (
    <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 shadow-2xl">
      
      {/* ================== SEARCH ================== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <button className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white px-6 py-3 rounded-xl transition-all">
          Export Data
        </button>
      </div>

      {/* ================== TABLE ================== */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left py-4 px-4 text-gray-400 font-semibold text-sm">ID</th>
              <th className="text-left py-4 px-4 text-gray-400 font-semibold text-sm">Name</th>
              <th className="text-left py-4 px-4 text-gray-400 font-semibold text-sm">Email</th>
              <th className="text-left py-4 px-4 text-gray-400 font-semibold text-sm">Status</th>
              <th className="text-left py-4 px-4 text-gray-400 font-semibold text-sm">Shift</th>
              <th className="text-left py-4 px-4 text-gray-400 font-semibold text-sm">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((member) => (
              <tr
                key={member.id}
                className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
              >
                <td className="py-4 px-4 text-white font-medium">{member.id}</td>
                <td className="py-4 px-4 text-white">{member.name}</td>
                <td className="py-4 px-4 text-gray-400">{member.email}</td>

                {/* STATUS BADGE */}
                <td className="py-4 px-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      member.status === "Active"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-gray-700 text-gray-400 border border-gray-600"
                    }`}
                  >
                    {member.status}
                  </span>
                </td>

                <td className="py-4 px-4 text-gray-400">{member.shift ?? "—"}</td>

                {/* ACTION BUTTONS */}
                <td className="py-4 px-4">
                  <div className="flex space-x-2">
                    
                    {/* Edit */}
                      <button
                        onClick={() => openEditModal(member)}
                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all"
                      >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
                        />
                      </svg>
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => setDeleteUser(member)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    >   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                        />
                      </svg>
                    </button>

                  </div>
                </td>


              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4">
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md">
      <h2 className="text-white text-xl font-semibold mb-4">
        Edit Status — {selectedUser.name}
      </h2>

      {/* STATUS DROPDOWN */}
      <label className="text-gray-400 text-sm">Status</label>
      <select
        value={newStatus}
        onChange={(e) => setNewStatus(e.target.value)}
        className="w-full mt-1 mb-4 p-2 bg-gray-800 border border-gray-700 text-white rounded-lg"
      >
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
        <option value="Approved">Approved</option>
        <option value="Rejected">Rejected</option>
      </select>

      {/* SHIFT (Optional) */}
      <label className="text-gray-400 text-sm">Shift</label>
      <input
        type="text"
        value={newShift}
        onChange={(e) => setNewShift(e.target.value)}
        placeholder="Morning / Evening / Night"
        className="w-full mt-1 mb-4 p-2 bg-gray-800 border border-gray-700 text-white rounded-lg"
      />

      {/* ACTION BUTTONS */}
      <div className="flex justify-end gap-2">
        <button
          onClick={closeModal}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg"
        >
          Cancel
        </button>

        <button
          onClick={saveStatusUpdate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}

    {deleteUser && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4">
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-sm">
      
      <h2 className="text-white text-xl font-semibold mb-4">
        Confirm Delete
      </h2>

      <p className="text-gray-400 mb-6">
        Are you sure you want to delete 
        <span className="text-red-400"> {deleteUser.name}</span>?
        <br />This action cannot be undone.
      </p>

      <div className="flex justify-end gap-3">
        
        <button
          onClick={() => setDeleteUser(null)}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg"
        >
          Cancel
        </button>

        <button
          onClick={confirmDelete}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg"
        >
          Delete
        </button>
      </div>

    </div>
  </div>
)}


    </div>

    
  );
}
