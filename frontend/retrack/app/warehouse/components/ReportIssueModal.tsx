"use client";

export default function ReportIssueModal({ bagId, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center">
      <div className="bg-gray-900 p-8 rounded-2xl w-[500px] border border-gray-700">
        <h2 className="text-xl font-bold mb-4">Report Issue</h2>

        {/* Bag ID */}
        <label className="flex gap-2 text-gray-400">Bag ID <div className="text-orange-600">*</div></label>
        <input
          className="w-full bg-gray-800 border border-gray-700 px-4 py-2 rounded-xl mb-4"
          value={bagId}
          readOnly
        />

        {/* Product ID */}
        <label className="text-gray-400">Product ID</label>
        <input
          className="w-full bg-gray-800 border border-gray-700 px-4 py-2 rounded-xl mb-4"
          placeholder="Enter Product ID"
        />

        {/* Issue */}
        <label className="flex gap-2 text-gray-400">Mention Issue <div className="text-orange-600">*</div></label>
        <textarea
          className="w-full bg-gray-800 border border-gray-700 px-4 py-2 rounded-xl h-28"
          placeholder="Describe the issue..."
        ></textarea>

        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-4">
          <button onClick={onClose} className="px-6 py-2 bg-gray-700 rounded-xl">
            Cancel
          </button>
          <button className="px-6 py-2 bg-blue-600 rounded-xl hover:bg-blue-700">
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
}
