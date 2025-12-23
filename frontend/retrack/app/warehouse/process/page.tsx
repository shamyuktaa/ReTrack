"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProcessBag() {
  const router = useRouter();
  const [bagID, setBagID] = useState("");
  const [scanned, setScanned] = useState(false);

  const sampleItems = [
    { id: "RET001", type: "Electronics", condition: "Good", status: "Pending" },
    { id: "RET002", type: "Apparel", condition: "Fair", status: "Pending" },
    { id: "RET003", type: "Accessories", condition: "Good", status: "Pending" },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Process Bag</h1>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl"
          >
            Back
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-10">

        {/* Scan Bag Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-10">
          <h2 className="text-xl font-bold text-white">Scan Bag</h2>
          <p className="text-gray-400 mt-2">Enter or scan Bag ID</p>

          <div className="flex items-center space-x-4 mt-6">
            <input
              type="text"
              placeholder="Enter Bag ID"
              value={bagID}
              onChange={(e) => setBagID(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white p-3 rounded-xl outline-none"
            />
            <button
              onClick={() => setScanned(true)}
              className="px-6 py-3 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-xl shadow-lg"
            >
              Scan
            </button>
          </div>
        </div>

        {/* Scanned Bag Details */}
        {scanned && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">

            <h2 className="text-xl font-bold text-white">Bag Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                <p className="text-gray-400 text-sm">Bag ID</p>
                <p className="text-lg font-semibold text-white">{bagID}</p>
              </div>

              <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                <p className="text-gray-400 text-sm">Total Items</p>
                <p className="text-lg font-semibold text-white">{sampleItems.length}</p>
              </div>

              <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                <p className="text-gray-400 text-sm">Status</p>
                <p className="text-blue-400 font-semibold">Pending Verification</p>
              </div>
            </div>

            {/* Items Table */}
            <h3 className="text-xl font-bold mt-10 mb-4 text-white">Items in Bag</h3>

            <div className="overflow-hidden rounded-2xl border border-gray-800">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-800 text-center">
                    <th className="p-4">Item ID</th>
                    <th>Product</th>
                    <th>Condition</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleItems.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-800 text-center hover:bg-gray-800/40"
                    >
                      <td className="p-4">{item.id}</td>
                      <td>{item.type}</td>
                      <td>{item.condition}</td>
                      <td className="text-blue-400">{item.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <button className="mt-8 px-6 py-3 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-xl shadow-blue-500/20 shadow-lg">
              Forward to QC
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
