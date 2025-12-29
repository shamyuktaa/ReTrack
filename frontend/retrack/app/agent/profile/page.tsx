// "use client"

// import { useEffect, useState } from "react"
// import { useRouter } from "next/navigation"
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!

// export default function AgentProfilePage() {
//   const router = useRouter()
//   const [profile, setProfile] = useState<any>(null)
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)

//   // ✅ persistent photo
//   const [photo, setPhoto] = useState<string | null>(null)

//   const agentId =
//     typeof window !== "undefined"
//       ? localStorage.getItem("userId")
//       : null

//   // 🔹 Load profile + saved photo
//   useEffect(() => {
//     if (!agentId) {
//       router.replace("/")
//       return
//     }

//     // load profile
//     fetch(`${API_BASE_URL}/api/Agent/${agentId}/profile`)
//       .then(res => {
//         if (!res.ok) throw new Error("Failed to load profile")
//         return res.json()
//       })
//       .then(data => setProfile(data))
//       .catch(err => setError(err.message))
//       .finally(() => setLoading(false))

//     // ✅ load saved photo
//     const savedPhoto = localStorage.getItem(`agent-profile-photo-${agentId}`)
//     if (savedPhoto) {
//       setPhoto(savedPhoto)
//     }
//   }, [agentId, router, API_BASE_URL])

//   // 🔹 handle image upload (PERSISTENT)
//   const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0]
//     if (!file) return

//     const reader = new FileReader()
//     reader.onloadend = () => {
//       const base64 = reader.result as string
//       setPhoto(base64)
//       localStorage.setItem(`agent-profile-photo-${agentId}`, base64)
//     }
//     reader.readAsDataURL(file)
//   }

//   if (loading)
//     return (
//       <div className="min-h-screen bg-gray-950 text-white p-10">
//         Loading profile...
//       </div>
//     )

//   if (error)
//     return (
//       <div className="min-h-screen bg-gray-950 text-red-500 p-10">
//         {error}
//       </div>
//     )

//   return (
//     <div className="min-h-screen bg-gray-950 text-white px-6 py-10 flex justify-center">
//       <div className="w-full max-w-4xl">

//         {/* Header */}
//         <div className="flex items-center justify-between mb-8">
//           <h1 className="text-3xl font-bold">Agent Profile</h1>
//           <button
//             onClick={() => router.back()}
//             className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
//           >
//             ← Back
//           </button>
//         </div>

//         {/* Profile Card */}
//         <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 grid grid-cols-1 md:grid-cols-3 gap-8">

//           {/* LEFT: Photo */}
//           <div className="flex flex-col items-center gap-4">
//             <div className="w-40 h-40 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center overflow-hidden">
//               {photo ? (
//                 <img
//                   src={photo}
//                   alt="Profile"
//                   className="w-full h-full object-cover"
//                 />
//               ) : (
//                 <span className="text-gray-500 text-sm">No Photo</span>
//               )}
//             </div>

//             <label className="cursor-pointer text-sm text-blue-400 hover:underline">
//               Upload Photo
//               <input
//                 type="file"
//                 accept="image/*"
//                 onChange={handlePhotoUpload}
//                 className="hidden"
//               />
//             </label>
//           </div>

//           {/* RIGHT: Details */}
//           <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
//             <Info label="Name" value={profile.name} />
//             <Info label="Email" value={profile.email} />
//             <Info label="Phone" value={profile.phone} />
//             <Info label="Role" value={profile.role} />
//             <Info label="City" value={profile.city} />
//             <Info label="State" value={profile.state} />
//             <Info label="Status" value={profile.status} />
//           </div>

//         </div>
//       </div>
//     </div>
//   )
// }

// /* ---------- Small reusable component ---------- */
// function Info({ label, value }: { label: string; value: string }) {
//   return (
//     <div>
//       <p className="text-gray-400 text-sm mb-1">{label}</p>
//       <p className="text-lg font-medium bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
//         {value || "-"}
//       </p>
//     </div>
//   )
// }

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Ensure this matches your environment variable or fallback to your server IP
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://98.92.52.78";

export default function AgentProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ persistent photo (base64)
  const [photo, setPhoto] = useState<string | null>(null);

  const agentId =
    typeof window !== "undefined"
      ? localStorage.getItem("userId")
      : null;

  // 🔹 Load profile + saved photo
  useEffect(() => {
    if (!agentId) {
      router.replace("/");
      return;
    }

    // ----------------------------------------------------
    // LOAD PROFILE (Corrected URL to api/users)
    // ----------------------------------------------------
    fetch(`${API_BASE_URL}/api/users/${agentId}/profile`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load profile details");
        return res.json();
      })
      .then((data) => setProfile(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    // ✅ load saved photo from localStorage
    const savedPhoto = localStorage.getItem(`agent-profile-photo-${agentId}`);
    if (savedPhoto) {
      setPhoto(savedPhoto);
    }
  }, [agentId, router, API_BASE_URL]);

  // 🔹 handle image upload (PERSISTENT)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPhoto(base64);
      localStorage.setItem(`agent-profile-photo-${agentId}`, base64);
    };
    reader.readAsDataURL(file);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gray-950 text-white p-10 flex items-center justify-center">
        <div className="animate-pulse text-xl">Loading profile...</div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-gray-950 text-red-500 p-10 flex flex-col items-center justify-center">
        <p className="text-xl font-bold mb-4">Error: {error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-950 text-white px-6 py-10 flex justify-center">
      <div className="w-full max-w-4xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Agent Profile</h1>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
          >
            ← Back
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* LEFT: Photo Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-40 h-40 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center overflow-hidden shadow-xl">
              {photo ? (
                <img
                  src={photo}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-500 text-sm">No Photo</span>
              )}
            </div>

            <label className="cursor-pointer text-sm text-blue-400 hover:text-blue-300 hover:underline transition">
              Upload Photo
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* RIGHT: Details Section */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Info label="Name" value={profile?.name} />
            <Info label="Email" value={profile?.email} />
            <Info label="Phone" value={profile?.phone} />
            <Info label="Role" value={profile?.role} />
            <Info label="City" value={profile?.city} />
            <Info label="State" value={profile?.state} />
            <Info label="Status" value={profile?.status} />
          </div>

        </div>
      </div>
    </div>
  );
}

/* ---------- Small reusable component ---------- */
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className="text-lg font-medium bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
        {value || "-"}
      </p>
    </div>
  );
}