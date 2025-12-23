"use client";

import { useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!

type Notification = {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
};

export default function NotificationBell({ role }: { role: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  // ------------------------------------
  // Fetch notifications from DB
  // ------------------------------------
  const loadNotifications = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/notifications?role=${role}`,
        { cache: "no-store" }
      );

      if (!res.ok) return;

      const data: Notification[] = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  // ------------------------------------
  // INITIAL LOAD + POLLING EVERY 5 SECS
  // ------------------------------------
  useEffect(() => {
    // Initial load
    loadNotifications();

    // Poll every 5 seconds
    const interval = setInterval(() => {
      loadNotifications();
    }, 5000);

    return () => clearInterval(interval);
  }, [role]);

  // ------------------------------------
  // Mark notification as read
  // ------------------------------------
  const markAsRead = async (id: number) => {
    try {
      await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
        method: "PUT"
      });

      // Update UI immediately
      setNotifications(prev =>
        prev.map(n =>
          n.id === id ? { ...n, isRead: true } : n
        )
      );
    } catch (err) {
      console.error("Failed to mark notification read", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // ------------------------------------
  // UI
  // ------------------------------------
  return (
    <div className="relative">
      {/* Bell */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50">
          <div className="p-3 border-b border-gray-800 font-bold text-white">
            Notifications
          </div>

          {notifications.filter(n => !n.isRead).length === 0 && (
            <p className="p-4 text-gray-400 text-sm text-center">
              No new notifications
            </p>
          )}

          <div className="max-h-80 overflow-y-auto">
            {notifications
              .filter(n => !n.isRead)
              .map(n => (
                <div
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className="p-3 cursor-pointer border-b border-gray-800 bg-gray-800 hover:bg-gray-700"
                >
                  <p className="text-white font-semibold text-sm">
                    {n.title}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    {n.message}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}