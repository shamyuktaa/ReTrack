const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!

export async function getNotifications(role: string) {
  const res = await fetch(
    `${API_BASE_URL}/api/notifications?role=${role}`,
    { cache: "no-store" }
  );

  return res.json();
}

export async function markNotificationRead(id: number) {
  await fetch(
    `${API_BASE_URL}/api/notifications/${id}/read`,
    { method:"PUT"}
);
}