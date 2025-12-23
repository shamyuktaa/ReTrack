"use client";

export default function PrepareQCModal({ bagId, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center">
      <div className="bg-gray-900 p-8 rounded-2xl w-[460px] border border-gray-700">
        <h2 className="text-xl font-bold mb-6">Prepare Bag for QC</h2>

        <p className="text-gray-400 mb-4">Bag ID: <span className="text-white">{bagId}</span></p>
        <p className="text-gray-400 mb-6">Bag moved for Quality Check</p>

        <div className="flex justify-end gap-4">
          <button onClick={onClose} className="px-6 py-2 bg-gray-700 rounded-xl">
            Cancel
          </button>
          <button className="px-6 py-2 bg-green-600 rounded-xl hover:bg-green-700">
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
