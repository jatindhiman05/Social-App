import { configureStore } from "@reduxjs/toolkit";
import userSlice from "./userSilce";
import selectedBlog from "./selectedBlogSlice";
import commentSlice from "./commentSlice";
import notificationSlice from "./notificationsSlice";

const store = configureStore({
    reducer: {
        user: userSlice,
        selectedBlog: selectedBlog,
        comment: commentSlice,
        notifications: notificationSlice
    },
});

export default store;
