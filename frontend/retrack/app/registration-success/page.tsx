"use client"

import { useSearchParams } from "next/navigation"
    import { useRouter } from 'next/navigation';
export default function RegistrationSuccess() {
    const searchParams = useSearchParams();
    const name = searchParams.get("name") || "User";
    const role = searchParams.get("role") || "N/A";
    const router = useRouter()

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-6">

        {/* --- BACK BUTTON (TOP-LEFT) --- */}
        <button
                onClick={() => {
            router.push('/')
        }}
        // Tailwind classes for top-left positioning and styling
        className="absolute top-6 left-6 bg-gray-800 hover:bg-gray-700 p-3 rounded-xl text-md transition duration-150 flex items-center"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        Home
      </button>
            <div className="bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md text-center border border-gray-700">

                <h1 className="text-3xl font-bold mb-4 text-blue-400">
                    Registration Complete
                </h1>

                <p className="text-lg text-gray-300 mb-6">
                    Thank you, <span className="font-semibold text-white">{name}</span>!
                </p>

                {/* USER DETAILS CARD */}
                <div className="text-left bg-gray-700 p-4 rounded-lg mb-6">
                    <p><strong className="text-gray-300">Role:</strong> {role}</p>

                    <p className="mt-3">
                        <strong className="text-gray-300">Status:</strong>
                        <span className="ml-2 py-1 px-3 text-sm rounded-full bg-yellow-500 text-black font-bold">
                            Pending
                        </span>
                    </p>
                </div>

                <p className="text-gray-400">
                    Our admin team will review your information shortly.
                </p>

            </div>
        </div>
    );
}
