"use client";

import { useEffect, useState } from "react";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!

type User = {
  id: number;
  userId?: string | null;
  name: string;
  dob: string;
  address: string;
  phone: string;
  email: string;
  identityDocPath: string | null;
  qcCertificatePath?: string | null;
  role: string;
  shift?: string | null;
  warehouseId?: number | null;
  status: string;
  createdAt?: string;
  employmentDate?: string | null;
};

export default function PendingRequests() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"Pending" | "Active" | "Approved" | "All">("Pending");
  const [selected, setSelected] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionStatus, setActionStatus] = useState<"Approved" | "Rejected" | "Pending">("Pending");
  const [assignWarehouse, setAssignWarehouse] = useState<number | "">("");
  const [assignShift, setAssignShift] = useState<"Morning" | "Night" | "">("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = users.filter((u) =>
    filter === "All" ? true : filter === "Pending" ? u.status === "Pending" : u.status === "Active"
  );

  function openDetails(user: User) {
    setSelected(user);
    setActionStatus(user.status === "Active" ? "Approved" : "Pending");
    setAssignWarehouse(user.warehouseId ?? "");
    setAssignShift((user.shift as "Morning" | "Night") ?? "");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSelected(null);
    setActionStatus("Pending");
    setAssignWarehouse("");
    setAssignShift("");
  }

  async function submitStatusChange() {
    if (!selected) return;
    const id = selected.id;
    const payload: any = {
      status: actionStatus === "Approved" ? "Approved" : "Rejected",
    };

    // only send shift/warehouse if approving and role requires it
    if (payload.status === "Approved") {
      // If no shift chosen, fallback to Morning
      if (assignShift) payload.shift = assignShift;
      if (assignWarehouse !== "") payload.warehouseId = Number(assignWarehouse) || null;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Update failed");
      }

      // refresh list and close modal
      await loadUsers();
      closeModal();
      alert("User status updated.");
    } catch (err: any) {
      console.error(err);
      alert("Failed to update status: " + (err?.message || "unknown"));
    }
  }

  return (
    <div className="bg-gray-900/0 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-xl font-semibold">User Requests</h3>

        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="bg-gray-800 text-white p-2 rounded"
          >
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Active">Active</option>
            <option value="All">All</option>
          </select>
          <button
            onClick={() => loadUsers()}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-gray-900/50">
            <tr>
              <th className="p-3 text-sm text-gray-300">UserID</th>
              <th className="p-3 text-sm text-gray-300">Name</th>
              <th className="p-3 text-sm text-gray-300">Role</th>
              <th className="p-3 text-sm text-gray-300">Status</th>
              <th className="p-3 text-sm text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="p-4 text-gray-400">
                  Loading...
                </td>
              </tr>
            )}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-gray-400">
                  No users found.
                </td>
              </tr>
            )}

            {!loading &&
              filtered.map((u) => (
                <tr key={u.id} className="border-t border-gray-700">
                  <td className="p-3 text-sm">{u.userId ?? `#${u.id}`}</td>
                  <td className="p-3 text-sm">{u.name}</td>
                  <td className="p-3 text-sm">{u.role}</td>
                  <td className="p-3 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        u.status === "Pending" ? "bg-yellow-500 text-black" : "bg-green-600 text-white"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="p-3 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openDetails(u)}
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white"
                      >
                        View Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl bg-gray-800 rounded-2xl p-6">
            <div className="flex justify-between items-start">
              <h4 className="text-lg font-bold text-white">User Details</h4>
              <button onClick={closeModal} className="text-gray-400 hover:text-white">Close</button>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <Info label="UserID" value={selected.userId ?? `#${selected.id}`} />
              <Info label="Name" value={selected.name} />
              <Info label="Role" value={selected.role} />
              <Info label="Status" value={selected.status} />
              <Info label="DOB" value={selected.dob} />
              <Info label="Phone" value={selected.phone} />
              <Info label="Email" value={selected.email} />
              <Info label="Address" value={selected.address} />
              <Info
                label="Identity Document"
                value={selected.identityDocPath ? (
                  <a
                    href={`${API_BASE_URL}${selected.identityDocPath}`}
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-blue-400"
                  >
                    Download
                  </a>
                ) : "Not uploaded"}
              />
              {selected.qcCertificatePath && (
                <Info
                  label="QC Certificate"
                  value={
                    <a
                      href={`${API_BASE_URL}${selected.qcCertificatePath}`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline text-blue-400"
                    >
                      Download
                    </a>
                  }
                />
              )}
              <Info label="Warehouse ID" value={selected.warehouseId ?? "—"} />
              <Info label="Shift" value={selected.shift ?? "—"} />
            </div>

            {/* Approval controls */}
            <div className="mt-6 border-t border-gray-700 pt-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <label className="text-gray-300">Action</label>
                <select
                  value={actionStatus}
                  onChange={(e) => setActionStatus(e.target.value as any)}
                  className="bg-gray-700 text-white p-2 rounded"
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {/* Only show assignment fields when approving */}
              {actionStatus === "Approved" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-300 block mb-1">Assign Warehouse ID</label>
                    <input
                      type="number"
                      value={assignWarehouse === "" ? "" : assignWarehouse}
                      onChange={(e) => setAssignWarehouse(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full p-2 rounded bg-gray-700 text-white"
                      placeholder="e.g., 1"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 block mb-1">Shift</label>
                    <select
                      value={assignShift}
                      onChange={(e) => setAssignShift(e.target.value as any)}
                      className="w-full p-2 rounded bg-gray-700 text-white"
                    >
                      <option value="">Select</option>
                      <option value="Morning">Morning</option>
                      <option value="Night">Night</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button onClick={closeModal} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white">
                  Cancel
                </button>
                <button
                  onClick={submitStatusChange}
                  className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="p-2 bg-gray-900/20 rounded">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-sm text-white">{value}</div>
    </div>
  );
}
