
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!

export default function PickupAgentModule() {
  const [searchTerm, setSearchTerm] = useState("");
  const [agents, setAgents] = useState([]);

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [updatedStatus, setUpdatedStatus] = useState("");

  // FETCH REAL PICKUP AGENTS
  const fetchAgents = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users`);
      const pickupAgents = response.data.filter(
        (u: any) =>
          u.role === "PickupAgent" &&
          (u.status === "Approved" || u.status === "Active")
      );
      setAgents(pickupAgents);
    } catch (error) {
      console.error("Error fetching agents:", error);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const openEditModal = (agent: any) => {
    setSelectedAgent(agent);
    setUpdatedStatus(agent.status);
    setEditModalOpen(true);
  };

  const openDeleteModal = (agent: any) => {
    setSelectedAgent(agent);
    setDeleteModalOpen(true);
  };

  // DELETE USER
  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/users/${selectedAgent.id}`);
      setDeleteModalOpen(false);
      setSelectedAgent(null);
      fetchAgents();
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  // UPDATE STATUS
  const handleStatusUpdate = async () => {
    if (!selectedAgent) return;
    try {
      await axios.put(
        `${API_BASE_URL}/api/users/${selectedAgent.id}/status`,
        { status: updatedStatus }
      );
      setEditModalOpen(false);
      setSelectedAgent(null);
      fetchAgents(); // Refresh table
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const filteredAgents = agents.filter(
    (agent: any) =>
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 shadow-2xl">
      {/* Search */}
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
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500"
          />
        </div>

      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 text-left">
              <th className="py-4 px-4 text-gray-400 text-sm font-semibold">ID</th>
              <th className="py-4 px-4 text-gray-400 text-sm font-semibold">Name</th>
              <th className="py-4 px-4 text-gray-400 text-sm font-semibold">Email</th>
              <th className="py-4 px-4 text-gray-400 text-sm font-semibold">Status</th>
              <th className="py-4 px-4 text-gray-400 text-sm font-semibold">Region</th>
              <th className="py-4 px-4 text-gray-400 text-sm font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredAgents.map((agent: any) => (
              <tr key={agent.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="py-4 px-4 text-white font-medium">{agent.id}</td>
                <td className="py-4 px-4 text-white">{agent.name}</td>
                <td className="py-4 px-4 text-gray-400">{agent.email}</td>

                <td className="py-4 px-4">
                  <span className="px-3 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    {agent.status}
                  </span>
                </td>
                <td className="py-4 px-4 text-gray-400">{agent.address}</td>

                <td className="py-4 px-4">
                  <div className="flex space-x-2">
                    {/* EDIT */}
                    <button
                      onClick={() => openEditModal(agent)}
                      className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>

                    {/* DELETE */}
                    <button
                      onClick={() => openDeleteModal(agent)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
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

      {/* EDIT MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-xl w-96 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Update Status</h2>

            <select
              value={updatedStatus}
              onChange={(e) => setUpdatedStatus(e.target.value)}
              className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600"
            >
              <option>Active</option>
              <option>Inactive</option>
              <option>Approved</option>
              <option>Rejected</option>
            </select>

            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 bg-gray-600 rounded-lg text-white"
              >
                Cancel
              </button>

              <button
                onClick={handleStatusUpdate}
                className="px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-xl w-96 border border-gray-700">
            <h2 className="text-xl font-semibold text-red-400 mb-4">
              Confirm Delete
            </h2>

            <p className="text-gray-300 mb-6">
              Are you sure you want to delete{" "}
              <span className="text-white font-medium">{selectedAgent?.name}</span>?
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 rounded-lg text-white hover:bg-red-500"
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
