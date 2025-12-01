import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    notifications: [],
    unreadCount: 0,
};

const notificationsSlice = createSlice({
    name: "notifications",
    initialState,
    reducers: {
        setNotification: (state, action) => {
            return action.payload;
        },

        markAllAsRead: (state) => {
            const updatedState = {
                ...state,
                notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
                unreadCount: 0,
            };
            return updatedState;
        },

        markAsRead: (state, action) => {
            const updatedNotifications = state.notifications.map((n) =>
                n._id === action.payload ? { ...n, isRead: true } : n
            );
            const updatedUnreadCount = updatedNotifications.filter(n => !n.isRead).length;

            return {
                notifications: updatedNotifications,
                unreadCount: updatedUnreadCount,
            };
        },

        addNotification: (state, action) => {
            const updatedState = {
                notifications: [action.payload, ...state.notifications],
                unreadCount: state.unreadCount + 1,
            };
            return updatedState;
        },

        deleteNotification: (state, action) => {
            const updatedNotifications = state.notifications.filter(
                (n) => n._id !== action.payload
            );
            const updatedUnreadCount = updatedNotifications.filter(n => !n.isRead).length;

            return {
                notifications: updatedNotifications,
                unreadCount: updatedUnreadCount,
            };
        },
    },
});

export const {
    setNotification,
    markAllAsRead,
    markAsRead,
    addNotification,
    deleteNotification,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;