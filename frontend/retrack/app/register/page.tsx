"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!

/* ───────────────── STATE → CITY MAP ───────────────── */
const STATE_CITY_MAP: Record<string, string[]> = {
  "Tamil Nadu": ["Chennai", "Coimbatore", "Tiruchirappalli", "Madurai", "Salem", "Tirunelveli", "Erode", "Vellore", "Thoothukudi"],
  "Karnataka": ["Bengaluru", "Mysuru", "Mangalore", "Hubballi-Dharwad", "Belagavi"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Alappuzha"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad"],
  "Andhra Pradesh": ["Vijayawada", "Visakhapatnam", "Guntur", "Tirupati", "Kurnool"],
  "Telangana": ["Hyderabad", "Warangal", "Karimnagar", "Nizamabad", "Khammam"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Bikaner", "Ajmer"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra", "Ghaziabad"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Siliguri", "Asansol"],
  "Delhi": ["Central Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi"],
}

/* ───────────────── VALIDATION CONSTANTS ───────────────── */
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"]

/* ───────────────── ZOD SCHEMA ───────────────── */
const baseSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .regex(/^[a-zA-Z\s]+$/, "Only letters allowed"),

  dob: z.string().refine(d => {
    const age = new Date().getFullYear() - new Date(d).getFullYear()
    return age >= 18
  }, "Must be at least 18 years old"),

  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),

  address: z.string().min(10, "Address must be at least 10 characters"),

  phone: z.string().regex(/^\d{10}$/, "Phone number must be 10 digits"),

  email: z.string().email("Invalid email address"),

  shift: z.enum(["Morning", "Night"]),

  identityDocument: z
    .instanceof(File, { message: "Identity document is required" })
    .refine(f => ALLOWED_FILE_TYPES.includes(f.type), "Invalid file type")
    .refine(f => f.size <= MAX_FILE_SIZE, "File must be under 2MB"),

  qcCertificate: z
    .instanceof(File)
    .optional(),
})

type FormValues = z.infer<typeof baseSchema>

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const role = searchParams.get("role") || ""
  const router = useRouter()

  const [cities, setCities] = useState<string[]>([])

   const [fileNames, setFileNames] = useState({
       identityDoc: "",
       qcCert: "",
   })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(
      baseSchema.refine(
        data => role !== "QCStaff" || data.qcCertificate,
        {
          path: ["qcCertificate"],
          message: "QC Certificate is required",
        }
      )
    ),
  })

  const selectedState = watch("state")

  /* ───────────── STATE → CITY EFFECT ───────────── */
  useEffect(() => {
    if (selectedState) {
      setCities(STATE_CITY_MAP[selectedState] || [])
      setValue("city", "")
    }
  }, [selectedState, setValue])

  /* ───────────── FILE HANDLERS ───────────── */
   const handleIdentityFile = (e: any) => {
   const file = e.target.files?.[0]
   if (file) {
     setValue("identityDocument", file, { shouldValidate: true })
     setFileNames(prev => ({
       ...prev,
       identityDoc: file.name,
     }))
   }
}


   const handleQCFile = (e: any) => {
   const file = e.target.files?.[0]
   if (file) {
     setValue("qcCertificate", file, { shouldValidate: true })
     setFileNames(prev => ({
       ...prev,
       qcCert: file.name,
     }))
   }
}

  /* ───────────── SUBMIT ───────────── */
  const onSubmit = async (data: FormValues) => {
    const formData = new FormData()

    formData.append("Name", data.name)
    formData.append("DOB", data.dob)
    formData.append("State", data.state)
    formData.append("City", data.city)
    formData.append("Address", data.address)
    formData.append("Phone", data.phone)
    formData.append("Email", data.email)
    formData.append("Role", role)
    formData.append("Shift", data.shift)
    formData.append("WarehouseId", "1")

    formData.append("IdentityDocPath", data.identityDocument)

    if (role === "QCStaff" && data.qcCertificate) {
      formData.append("QCCertificatePath", data.qcCertificate)
    }

    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      body: formData,
    })

    if (res.ok) {
      alert("Registration Successful!")
      router.push(`/registration-success?name=${data.name}&role=${role}`)
    } else {
      const msg = await res.text()
      alert(`Registration Failed: ${msg}`)
    }
  }

  /* ───────────── UI ───────────── */
  return (
    <div className="min-h-screen flex flex-col items-center p-8 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-6">New User Registration</h1>
      <p className="text-gray-400 mb-4">Role: {role}</p>

      <div className=" min-h-screen w-full max-w-lg bg-gray-800 p-6 rounded-xl space-y-4">

        <input {...register("name")} placeholder="Full Name" className="w-full p-3 rounded bg-gray-700" />
        {errors.name && <p className="text-red-400 top-4 left-0 -mt-3">{errors.name.message}</p>}

        <input type="date" {...register("dob")} className="w-full p-3 rounded bg-gray-700" />
        {errors.dob && <p className="text-red-400 top-4 left-0 -mt-3">{errors.dob.message}</p>}

        <select {...register("state")} className="w-full p-3 rounded bg-gray-700">
          <option value="">Select State</option>
          {Object.keys(STATE_CITY_MAP).map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {errors.state && <p className="text-red-400 top-4 left-0 -mt-3">{errors.state.message}</p>}

        <select {...register("city")} disabled={!selectedState} className="w-full p-3 rounded bg-gray-700">
          <option value="">Select City</option>
          {cities.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
        {errors.city && <p className="text-red-400 top-4 left-0 -mt-3">{errors.city.message}</p>}

        <input {...register("address")} placeholder="Residential Address" className="w-full p-3 rounded bg-gray-700" />
        {errors.address && <p className="text-red-400 top-4 left-0 -mt-3">{errors.address.message}</p>}

        <input {...register("phone")} placeholder="Phone Number" className="w-full p-3 rounded bg-gray-700" />
        {errors.phone && <p className="text-red-400 top-4 left-0 -mt-3">{errors.phone.message}</p>}

        <input {...register("email")} placeholder="Email" className="w-full p-3 rounded bg-gray-700" />
        {errors.email && <p className="text-red-400 top-4 left-0 -mt-3">{errors.email.message}</p>}

         {/* Identity Document Upload */}
         <div className="pt-4 border-t border-gray-700 space-y-5">
             <label className="block text-sm font-semibold mb-2">Identity Document</label>
             <div 
                 className={`relative w-full p-3 rounded bg-gray-700 hover:bg-gray-600 transition cursor-pointer 
                             ${fileNames.identityDoc ? 'border border-blue-500' : 'border-2 border-dashed border-gray-600'}`}
             >
                 <input 
                     type="file" 
                     name="IdentityDocPath"
                     id="IdentityDocPath"
                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                     onChange={handleIdentityFile} 
                     required 
                 />
                 <div className="flex items-center justify-between">
                     <p className={`text-sm font-medium truncate ${fileNames.identityDoc ? 'text-white' : 'text-gray-400'}`}>
                         {fileNames.identityDoc || 'Upload Document (PNG, JPG, or PDF)'}
                     </p>
                     <span 
                         className={`shrink-0 ml-2 py-1 px-3 rounded-full text-xs font-semibold transition duration-150 
                                     ${fileNames.identityDoc ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-500 hover:bg-gray-400'}`}
                     >
                         {fileNames.identityDoc ? 'Change' : 'Browse'}
                     </span>
                 </div>
             </div>
              {errors.identityDocument && <p className="text-red-400 top-4 left-0 -mt-3">{errors.identityDocument.message}</p>}
         </div>

         {/* QC Certificate Upload */}
 {role === "QCStaff" && (
     <div>
         <label className="block text-sm font-semibold mb-2 text-red-300">QC Certificate (Required)</label>
         <div 
             className={`relative w-full p-3 rounded bg-gray-700 hover:bg-gray-600 transition cursor-pointer 
                         ${fileNames.qcCert ? 'border border-blue-500' : 'border-2 border-dashed border-gray-600'}`}
         >
             <input 
                 type="file" 
                 name="QCCertificatePath" // FIX: Name changed to match DTO property
                 id="QCCertificatePath"
                 onChange={handleQCFile} 
                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                 required 
             />
             <div className="flex items-center justify-between">
                 <p className={`text-sm font-medium truncate ${fileNames.qcCert ? 'text-white' : 'text-gray-400'}`}>
                     {fileNames.qcCert || 'Upload Certificate (Required)'}
                 </p>
                 <span 
                     className={`flex-shrink-0 ml-2 py-1 px-3 rounded-full text-xs font-semibold transition duration-150 
                                 ${fileNames.qcCert ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-500 hover:bg-gray-400'}`}
                 >
                     {fileNames.qcCert ? 'Change' : 'Browse'}
                 </span>
             </div>

         </div>
     </div>
       )}
       <div  className="border-t border-gray-700"></div>
         <label>Select Preferred Shift <div><small className="text-gray-600">Note: May be changed later by Admin</small></div></label>

        
         <select {...register("shift")} className="w-full p-3 rounded bg-gray-700">
                  
           <option value="Morning">Morning</option>
           <option value="Night">Night</option>
         </select>


        <button
          onClick={handleSubmit(onSubmit)}
          className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl text-lg font-semibold"
        >
          Submit Registration
        </button>
      </div>
    </div>
  )
}
