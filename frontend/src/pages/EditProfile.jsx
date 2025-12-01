import axios from "axios";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../utils/userSilce";
import { Navigate, useNavigate } from "react-router-dom";
import useLoader from "../hooks/useLoader";
import {
    Camera,
    X,
    ArrowLeft,
    Check,
    User,
    AtSign,
    Pencil,
    Upload,
} from "lucide-react";

function EditProfile() {
    const {
        token,
        id: userId,
        email,
        name,
        username,
        profilePic,
        bio,
    } = useSelector((state) => state.user);

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [isLoading, startLoading, stopLoading] = useLoader();

    const [userData, setUserData] = useState({
        profilePic,
        username,
        name,
        bio,
    });

    const [imagePreview, setImagePreview] = useState(
        typeof profilePic === "string" ? profilePic : null
    );

    const [initialData, setInitialData] = useState(null);
    const [isButtonDisabled, setIsButtonDisabled] = useState(true);

    useEffect(() => {
        setInitialData({
            profilePic,
            username,
            name,
            bio,
        });
    }, []);

    function handleChange(e) {
        const { name, value, files } = e.target;

        if (files && files[0]) {
            const file = files[0];
            setUserData((prev) => ({ ...prev, profilePic: file }));
            setImagePreview(URL.createObjectURL(file));
        } else {
            setUserData((prev) => ({ ...prev, [name]: value }));
        }
    }

    async function handleUpdateProfile() {
        startLoading();
        setIsButtonDisabled(true);

        const formData = new FormData();
        formData.append("name", userData.name);
        formData.append("username", userData.username);
        formData.append("bio", userData.bio);

        if (userData.profilePic === null) {
            formData.append("profilePic", ""); // signal to remove image
        } else if (typeof userData.profilePic === "string") {
            formData.append("profilePic", userData.profilePic); // keep existing Cloudinary URL
        } else if (userData.profilePic instanceof File) {
            formData.append("profilePic", userData.profilePic); // upload new image
        }

        try {
            const res = await axios.patch(
                `${import.meta.env.VITE_BACKEND_URL}/users/${userId}`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            toast.success(res.data.message);
            dispatch(login({ ...res.data.user, token, email, id: userId }));
            navigate(`/@${userData.username}`);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update profile");
        } finally {
            stopLoading();
        }
    }
    

    useEffect(() => {
        if (!initialData) return;

        const hasChanged =
            userData.username !== initialData.username ||
            userData.name !== initialData.name ||
            userData.bio !== initialData.bio ||
            typeof userData.profilePic === "object" ||
            userData.profilePic === null;

        setIsButtonDisabled(!hasChanged);
    }, [userData, initialData]);

    if (!token) {
        return <Navigate to="/signin" />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-darkbg dark:to-darkbg py-8 px-4 sm:px-6">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-600 dark:text-darktext/80 hover:text-indigo-600 dark:hover:text-accent"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Back</span>
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-darktext flex items-center gap-2">
                        Edit Profile
                    </h1>
                    <div className="w-10"></div>
                </div>

                <div className="bg-white dark:bg-darkcard rounded-xl shadow-sm overflow-hidden border-gray-200 dark:border-darkborder">
                    <div className="p-6 border-gray-200 dark:border-darkborder">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-darktext mb-4 flex items-center gap-2">
                            <Camera className="text-indigo-600 dark:text-accent w-5 h-5" />
                            Profile Picture
                        </h2>
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full overflow-hidden border-white dark:border-darkbg shadow-lg bg-gray-100 dark:bg-darkbg">
                                    <label htmlFor="profilePic" className="cursor-pointer block w-full h-full">
                                        {imagePreview ? (
                                            <img
                                                src={imagePreview}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-darktext/70">
                                                <User className="w-12 h-12" />
                                            </div>
                                        )}
                                    </label>
                                </div>
                                {userData.profilePic && (
                                    <button
                                        onClick={() => {
                                            setUserData((prev) => ({ ...prev, profilePic: null }));
                                            setImagePreview(null);
                                        }}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <input
                                id="profilePic"
                                type="file"
                                name="profilePic"
                                accept="image/*"
                                onChange={handleChange}
                                className="hidden"
                            />
                            <label
                                htmlFor="profilePic"
                                className="text-indigo-600 dark:text-accent hover:text-indigo-800 dark:hover:text-accent/80 font-medium cursor-pointer flex items-center gap-2"
                            >
                                {userData.profilePic ? (
                                    <>
                                        <Camera className="w-4 h-4" />
                                        <span>Change photo</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4" />
                                        <span>Upload photo</span>
                                    </>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Profile Information */}
                    <div className="p-6 space-y-6">
                        <div>
                            <label
                                htmlFor="name"
                                className="block text-sm font-medium text-gray-700 dark:text-darktext/80 mb-2 flex items-center gap-2"
                            >
                                <User className="w-4 h-4 text-gray-500 dark:text-darktext/70" />
                                <span>Name</span>
                            </label>
                            <div className="relative">
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={userData.name || ""}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 border-gray-300 dark:border-darkborder rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-accent focus:border-indigo-500 dark:focus:border-accent bg-white dark:bg-darkbg text-gray-800 dark:text-darktext placeholder-gray-400 dark:placeholder-darktext/70"
                                    placeholder="Your name"
                                />
                                <User className="absolute left-3 top-3.5 w-4 h-4 text-gray-400 dark:text-darktext/70" />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="username"
                                className="block text-sm font-medium text-gray-700 dark:text-darktext/80 mb-2 flex items-center gap-2"
                            >
                                <AtSign className="w-4 h-4 text-gray-500 dark:text-darktext/70" />
                                <span>Username</span>
                            </label>
                            <div className="relative">
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    value={userData.username || ""}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 border-gray-300 dark:border-darkborder rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-accent focus:border-indigo-500 dark:focus:border-accent bg-white dark:bg-darkbg text-gray-800 dark:text-darktext placeholder-gray-400 dark:placeholder-darktext/70"
                                    placeholder="Your username"
                                />
                                <AtSign className="absolute left-3 top-3.5 w-4 h-4 text-gray-400 dark:text-darktext/70" />
                            </div>
                            <p className="mt-2 text-sm text-gray-500 dark:text-darktext/70">
                                Your profile URL: <span className="text-indigo-600 dark:text-accent">@{userData.username || "username"}</span>
                            </p>
                        </div>

                        <div>
                            <label
                                htmlFor="bio"
                                className="block text-sm font-medium text-gray-700 dark:text-darktext/80 mb-2 flex items-center gap-2"
                            >
                                <Pencil className="w-4 h-4 text-gray-500 dark:text-darktext/70" />
                                <span>Bio</span>
                            </label>
                            <textarea
                                id="bio"
                                name="bio"
                                rows="4"
                                value={userData.bio || ""}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border-gray-300 dark:border-darkborder rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-accent focus:border-indigo-500 dark:focus:border-accent bg-white dark:bg-darkbg text-gray-800 dark:text-darktext placeholder-gray-400 dark:placeholder-darktext/70 resize-none"
                                placeholder="Tell us about yourself..."
                                maxLength="160"
                            />

                            <div className="flex justify-between mt-1">
                                <p className="text-xs text-gray-500 dark:text-darktext/70">
                                    Brief description for your profile
                                </p>
                                <p className="text-xs text-gray-500 dark:text-darktext/70">
                                    {userData.bio?.length || 0}/160
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="p-6 border-gray-200 dark:border-darkborder flex justify-end">
                        <button
                            onClick={handleUpdateProfile}
                            disabled={isButtonDisabled || isLoading}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${isButtonDisabled || isLoading
                                ? "bg-gray-200 dark:bg-darkbg text-gray-500 dark:text-darktext/70 cursor-not-allowed"
                                : "bg-indigo-600 dark:bg-accent text-white hover:bg-indigo-700 dark:hover:bg-indigo-500"
                                }`}
                        >
                            {isLoading ? (
                                <div className="animate-spin">
                                    <svg
                                        className="w-5 h-5 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                </div>
                            ) : (
                                <>
                                    <Check className="w-5 h-5" />
                                    <span>Save Changes</span>
                                </>
                            )}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default EditProfile;