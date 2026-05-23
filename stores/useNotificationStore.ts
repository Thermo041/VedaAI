import { create } from "zustand";

export type Notification = {
  id: string;
  message: string;
  time: string;
  read: boolean;
  createdAt: Date;
};

type NotificationStore = {
  notifications: Notification[];
  addNotification: (message: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
};

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],

  addNotification: (message) => {
    const notification: Notification = {
      id: Date.now().toString(),
      message,
      time: "Just now",
      read: false,
      createdAt: new Date(),
    };
    set((state) => ({
      notifications: [notification, ...state.notifications],
    }));
  },

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  clearAll: () => set({ notifications: [] }),
}));
