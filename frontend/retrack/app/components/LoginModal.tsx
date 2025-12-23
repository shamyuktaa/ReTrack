"use client"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    username: string
    password: string
    role: string | null
  }) => void
  role: string | null
}

export default function LoginModal({
  isOpen,
  onClose,
  onSubmit,
  role
}: LoginModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-2xl shadow-xl w-96 border border-gray-700">
        <h2 className="text-white text-xl font-semibold mb-4 text-center">
          Login as {role}
        </h2>

        <input
          type="text"
          placeholder="Username"
          className="w-full mb-3 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white outline-none focus:border-blue-500"
          id="username"
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white outline-none focus:border-blue-500"
          id="password"
        />

        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              const username = (document.getElementById("username") as HTMLInputElement).value
              const password = (document.getElementById("password") as HTMLInputElement).value
              onSubmit({
                username,
                password,
                role
              })
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  )
}
