import { createSlice } from "@reduxjs/toolkit";

const initialState =
    JSON.parse(localStorage.getItem("user")) || {
        token: null,
        name: null,
        username: null,
        email: null,
        id: null,
        profilePic: null,
        followers: [],
        following: [],
        googleAuth: false, 
    };


const userSlice = createSlice({
    name: "userSlice",
    initialState,
    reducers: {
        login(state, action) {
            const user = { ...state, ...action.payload };
            localStorage.setItem("user", JSON.stringify(user));
            return user;
        },
        logout() {
            localStorage.removeItem("user");
            return {
                token: null,
                name: null,
                username: null,
                email: null,
                id: null,
                profilePic: null,
                followers: [],
                following: [],
            };
        },
        updateData(state, action) {
            const [type, payload] = action.payload;

            if (type === "visibility") {
                const updatedUser = { ...state, ...payload };
                localStorage.setItem("user", JSON.stringify(updatedUser));
                return updatedUser;
            }

            if (type === "followers") {
                const isFollowing = state.following.includes(payload);
                const updatedFollowing = isFollowing
                    ? state.following.filter((id) => id !== payload)
                    : [...state.following, payload];

                const updatedUser = { ...state, following: updatedFollowing };
                localStorage.setItem("user", JSON.stringify(updatedUser));
                return updatedUser;
            }

            return state;
        },
    },
});

export const { login, logout, updateData } = userSlice.actions;
export default userSlice.reducer;
