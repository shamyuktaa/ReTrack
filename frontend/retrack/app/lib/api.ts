const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!

export async function loginUser(username: string, password: string) {
  console.log("📡 loginUser() called with:", username, password);

  try {
    const res = await fetch(`${API_BASE_URL}/Auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    console.log("📥 Response status:", res.status);

    const data = await res.json();
    console.log("📥 Backend JSON:", data);

    if (!res.ok) {
      return { success: false, message: data.message || "Invalid login" };
    }

    return {
      success: true,
      token: data.token,
      role: data.role,
      username: data.username
    };

  } catch (err) {
    console.log("❌ FETCH ERROR:", err);
    return { success: false, message: "Server not reachable" };
  }
}
